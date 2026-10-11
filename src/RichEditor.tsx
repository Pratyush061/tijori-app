import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewProps,
} from 'react-native-webview';

// A small, self-contained rich-text editor. The editing surface is a
// contenteditable document inside a WebView, which lets us control the
// spacing precisely and use the platform's own formatting engine. It needs
// no native module beyond react-native-webview, which the app already ships.

// react-native-webview 14.0.1 publishes a broken default type: the class is
// declared `WebView<P = undefined>`, and `WebViewProps & undefined` collapses
// to `never`, so `<WebView />` fails to typecheck anywhere. Re-typing the
// component against its own exported props fixes that without changing the
// dependency version.
type WebViewHandle = { injectJavaScript: (script: string) => void };

const TypedWebView = WebView as unknown as React.ComponentType<
  WebViewProps & { ref?: React.Ref<WebViewHandle> }
>;

export type RichEditorHandle = {
  getHTML: () => string;
  exec: (command: string, value?: string) => void;
};

type Props = {
  initialHTML: string;
  accent: string;
  onChange?: (html: string) => void;
};

function buildDocument(initialHTML: string, accent: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    padding: 8px 24px 160px 24px;
    font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
    font-size: 17px;
    line-height: 1.55;
    color: #111111;
    -webkit-text-size-adjust: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    overflow-x: hidden;
  }
  #editor { outline: none; min-height: 55vh; }
  #editor:empty:before {
    content: "Start typing\\2026";
    color: #b0b0b5;
  }
  h1 { font-size: 28px; line-height: 1.25; margin: 14px 0 6px; }
  h2 { font-size: 22px; line-height: 1.3; margin: 12px 0 6px; }
  p { margin: 0 0 10px; }
  blockquote {
    border-left: 3px solid #d1d1d6;
    margin: 10px 0;
    padding: 2px 0 2px 14px;
    color: #55555c;
  }
  pre {
    background: #f2f2f7;
    border-radius: 10px;
    padding: 12px 14px;
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 15px;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  code { font-family: "SF Mono", Menlo, Consolas, monospace; }
  ul, ol { padding-left: 24px; margin: 8px 0; }
  a { color: ${accent}; }
</style>
</head>
<body>
<div id="editor" contenteditable="true" autocorrect="on" autocapitalize="sentences">${initialHTML}</div>
<script>
  (function () {
    var editor = document.getElementById('editor');
    var savedRange = null;

    function push() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'html', content: editor.innerHTML }));
      }
    }

    function sendState() {
      if (window.ReactNativeWebView) {
        var formatBlock = document.queryCommandValue('formatBlock');
        if (formatBlock) {
          formatBlock = formatBlock.toLowerCase();
        }
        var state = {
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikeThrough: document.queryCommandState('strikeThrough'),
          insertUnorderedList: document.queryCommandState('insertUnorderedList'),
          insertOrderedList: document.queryCommandState('insertOrderedList'),
          formatBlock: formatBlock
        };
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'state', state: state }));
      }
    }

    function rememberSelection() {
      var sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        var range = sel.getRangeAt(0);
        if (editor.contains(range.commonAncestorContainer)) {
          savedRange = range.cloneRange();
        }
      }
    }

    function restoreSelection() {
      if (!savedRange) return;
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }

    editor.addEventListener('input', function() { push(); sendState(); });
    editor.addEventListener('blur', function() { push(); sendState(); });
    editor.addEventListener('keyup', function() { push(); sendState(); });
    editor.addEventListener('click', sendState);

    document.addEventListener('selectionchange', function() {
      rememberSelection();
      sendState();
    });

    window.__exec = function (command, value) {
      editor.focus();
      restoreSelection();
      document.execCommand('styleWithCSS', false, true);
      document.execCommand(command, false, value === undefined ? null : value);
      rememberSelection();
      push();
      sendState();
    };

    window.__getHTML = function() { return editor.innerHTML; };

    true;
  })();
</script>
</body>
</html>`;
}

export type EditorState = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikeThrough?: boolean;
  insertUnorderedList?: boolean;
  insertOrderedList?: boolean;
  formatBlock?: string | null;
};

type ExtendedProps = Props & {
  onStateChange?: (state: EditorState) => void;
};

export const RichEditor = forwardRef<RichEditorHandle, ExtendedProps>(
  ({ initialHTML, accent, onChange, onStateChange }, ref) => {
    const webRef = useRef<WebViewHandle>(null);
    const latest = useRef(initialHTML);

    // Built once so re-renders never reload the WebView and wipe what the
    // user has typed.
    const source = useMemo(
      () => ({ html: buildDocument(initialHTML, accent) }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    useImperativeHandle(ref, () => ({
      getHTML: () => latest.current,
      exec: (command: string, value?: string) => {
        const payload = `window.__exec(${JSON.stringify(command)}, ${
          value === undefined ? 'undefined' : JSON.stringify(value)
        }); true;`;
        webRef.current?.injectJavaScript(payload);
      },
    }));

    const handleMessage = (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data);
        if (payload.type === 'html') {
          latest.current = payload.content;
          onChange?.(payload.content);
        } else if (payload.type === 'state') {
          onStateChange?.(payload.state);
        }
      } catch (e) {
        // Fallback for earlier plain string messages just in case
        latest.current = event.nativeEvent.data;
        onChange?.(latest.current);
      }
    };

    return (
      <TypedWebView
        ref={webRef}
        originWhitelist={['*']}
        source={source}
        onMessage={handleMessage}
        style={styles.web}
        containerStyle={styles.container}
        keyboardDisplayRequiresUserAction={false}
        hideKeyboardAccessoryView
        showsVerticalScrollIndicator={false}
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
      />
    );
  }
);

const styles = StyleSheet.create({
  web: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    backgroundColor: 'transparent',
  },
});
