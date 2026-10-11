import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// A small, self-contained rich-text editor. The editing surface is a
// contenteditable document inside a WebView, which lets us control the
// spacing precisely and use the platform's own formatting engine. It needs
// no native module beyond react-native-webview, which the app already ships.

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
    padding: 8px 20px 160px 20px;
    font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
    font-size: 17px;
    line-height: 1.55;
    color: #111111;
    -webkit-text-size-adjust: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
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

    function push() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(editor.innerHTML);
      }
    }

    editor.addEventListener('input', push);
    editor.addEventListener('blur', push);
    editor.addEventListener('keyup', push);

    window.__exec = function (command, value) {
      editor.focus();
      document.execCommand('styleWithCSS', false, false);
      document.execCommand(command, false, value === undefined ? null : value);
      push();
    };

    window.__getHTML = push;

    true;
  })();
</script>
</body>
</html>`;
}

export const RichEditor = forwardRef<RichEditorHandle, Props>(
  ({ initialHTML, accent, onChange }, ref) => {
    const webRef = useRef<WebView>(null);
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

    return (
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={source}
        onMessage={event => {
          latest.current = event.nativeEvent.data;
          onChange?.(latest.current);
        }}
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
