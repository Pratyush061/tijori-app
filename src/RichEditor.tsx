import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewProps,
} from 'react-native-webview';

import { colors } from './theme';

type WebViewHandle = { injectJavaScript: (script: string) => void };

const TypedWebView = WebView as unknown as React.ComponentType<
  WebViewProps & { ref?: React.Ref<WebViewHandle> }
>;

let commandSeq = 0;
const nextCommandId = () => `${Date.now()}-${++commandSeq}`;

export type RichEditorHandle = {
  getHTML: () => string;
  getHtml: () => Promise<string> | string;
  exec: (command: string, value?: string) => void;
  toggleBlock: (tag: string) => void;
  stepFontSize: (delta: number) => void;
  toggleFormat: (format: 'bold' | 'italic' | 'underline' | 'strikeThrough') => void;
  focus: () => void;
  focusEnd: () => void;
  focusToEnd: () => void;
  setBackgroundColor: (color: string) => void;
};

export type EditorState = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikeThrough?: boolean;
  insertUnorderedList?: boolean;
  insertOrderedList?: boolean;
  formatBlock?: string | null;
  fontSize?: string | null;
};

export type FormatStates = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
};

type Props = {
  initialHTML?: string;
  initialHtml?: string;
  accent?: string;
  backgroundColor?: string;
  onChange?: (html: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onStateChange?: (state: EditorState) => void;
  onFormatChange?: (formats: FormatStates) => void;
};

function buildDocument(initialHTML: string, accent: string, backgroundColor: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
    height: 100%;
    box-sizing: border-box;
    background-color: ${backgroundColor || '#FFFFFF'};
  }
  body {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    height: 100%;
    padding: 12px 20px 180px 20px;
    font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
    font-size: 17px;
    line-height: 1.55;
    color: #111111;
    -webkit-text-size-adjust: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    overflow-x: hidden;
    box-sizing: border-box;
  }
  #editor {
    flex: 1;
    min-height: 100%;
    outline: none;
    box-sizing: border-box;
    cursor: text;
  }
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
    window.__editor = editor;
    // New paragraphs become <p>, so formatBlock reads back a real block name.
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}
    var savedRange = null;

    function cleanOrphanedTags() {
      var sel = window.getSelection();
      var activeNode = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).startContainer : null;
      var emptyTags = editor.querySelectorAll('b:empty, i:empty, u:empty, s:empty, strike:empty, span:empty');
      for (var i = 0; i < emptyTags.length; i++) {
        var el = emptyTags[i];
        if (activeNode && (el === activeNode || el.contains(activeNode))) continue;
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    }

    function getCleanHTML() {
      cleanOrphanedTags();
      var html = editor.innerHTML;
      html = html.replace(/<([b|i|u|s]|strike)>\\s*<\\/\\1>/gi, '');
      return html;
    }

    function push() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'html', content: getCleanHTML() }));
      }
    }

    // The browser reports the default block as 'div' (or nothing); both mean a
    // plain paragraph, so the paragraph button lights up in either case.
    function currentBlock() {
      var block = (document.queryCommandValue('formatBlock') || '').toLowerCase().replace(/[<>]/g, '');
      if (!block || block === 'div') return 'p';
      return block;
    }

    function sendState() {
      if (window.ReactNativeWebView) {
        var formatBlock = currentBlock();
        var state = {
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikeThrough: document.queryCommandState('strikeThrough'),
          insertUnorderedList: document.queryCommandState('insertUnorderedList'),
          insertOrderedList: document.queryCommandState('insertOrderedList'),
          formatBlock: formatBlock,
          fontSize: document.queryCommandValue('fontSize') || null
        };
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'state', state: state }));
      }
    }

    function ensureCursorVisible() {
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      var range = sel.getRangeAt(0);
      var rect = range.getBoundingClientRect();
      if (rect.top === 0 && rect.bottom === 0) {
        var node = range.startContainer;
        if (node.nodeType === 3) node = node.parentNode;
        if (node && node.getBoundingClientRect) rect = node.getBoundingClientRect();
      }
      var viewportHeight = window.innerHeight;
      var bottomMargin = 70;
      if (rect.bottom > viewportHeight - bottomMargin) {
        window.scrollBy({ top: rect.bottom - (viewportHeight - bottomMargin) + 20, behavior: 'smooth' });
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

    function focusAtEnd() {
      editor.focus();
      var range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      rememberSelection();
      sendState();
      ensureCursorVisible();
    }
    window.__focusEnd = focusAtEnd;

    document.addEventListener('click', function(e) {
      if (e.target === document.body || e.target === document.documentElement) {
        focusAtEnd();
        return;
      }
      if (e.target === editor) {
        var last = editor.lastElementChild;
        if (!last || e.clientY > last.getBoundingClientRect().bottom) {
          focusAtEnd();
        }
      }
    });

    editor.addEventListener('focus', function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'focus' }));
      }
    });
    editor.addEventListener('blur', function() {
      push();
      sendState();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'blur' }));
      }
    });
    editor.addEventListener('input', function() { push(); sendState(); ensureCursorVisible(); });
    editor.addEventListener('keyup', function() { push(); sendState(); ensureCursorVisible(); });
    editor.addEventListener('click', sendState);

    document.addEventListener('selectionchange', function() {
      rememberSelection();
      sendState();
      ensureCursorVisible();
    });

    // Android on the New Architecture can deliver an injected script twice,
    // which would toggle a format straight back off. Ignore a repeated id.
    var lastCommandId = null;
    function alreadyRan(id) {
      if (id === lastCommandId) return true;
      lastCommandId = id;
      return false;
    }

    // Put the caret back where it was, apply the change, then report the truth.
    function begin() {
      editor.focus();
      restoreSelection();
      document.execCommand('styleWithCSS', false, false);
    }
    function finish() {
      rememberSelection();
      push();
      sendState();
      ensureCursorVisible();
    }

    window.__exec = function (id, command, value) {
      if (alreadyRan(id)) return;
      begin();
      document.execCommand(command, false, value === undefined ? null : value);
      finish();
    };

    // Block formats toggle too: the same block again goes back to a paragraph.
    window.__toggleBlock = function (id, tag) {
      if (alreadyRan(id)) return;
      begin();
      var next = currentBlock() === tag && tag !== 'p' ? 'p' : tag;
      document.execCommand('formatBlock', false, '<' + next + '>');
      finish();
    };

    window.__stepFontSize = function (id, delta) {
      if (alreadyRan(id)) return;
      begin();
      var steps = ['2', '3', '5'];
      var from = steps.indexOf(document.queryCommandValue('fontSize') || '3');
      var index = Math.min(steps.length - 1, Math.max(0, (from === -1 ? 1 : from) + delta));
      document.execCommand('fontSize', false, steps[index]);
      finish();
    };

    window.__getHTML = function() { return getCleanHTML(); };

    true;
  })();
</script>
</body>
</html>`;
}

export const RichEditor = forwardRef<RichEditorHandle, Props>(
  (
    {
      initialHTML = '',
      initialHtml = '',
      accent = colors.orange,
      backgroundColor = '#FFFFFF',
      onChange,
      onFocus,
      onBlur,
      onStateChange,
      onFormatChange,
    },
    ref
  ) => {
    const rawInitial = initialHTML || initialHtml || '';
    const webRef = useRef<WebViewHandle>(null);
    const latest = useRef(rawInitial);

    const source = useMemo(
      () => ({ html: buildDocument(rawInitial, accent, backgroundColor) }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    useEffect(() => {
      if (backgroundColor) {
        const script = `document.documentElement.style.backgroundColor = '${backgroundColor}'; document.body.style.backgroundColor = '${backgroundColor}'; true;`;
        webRef.current?.injectJavaScript(script);
      }
    }, [backgroundColor]);

    const sanitizeHtml = (html: string) => {
      if (!html) return '';
      return html
        .replace(/<([b|i|u|s]|strike)>\\s*<\\/\\1>/gi, '')
        .replace(/<span\\s*[^>]*>\\s*<\\/span>/gi, '');
    };

    useImperativeHandle(ref, () => ({
      getHTML: () => sanitizeHtml(latest.current),
      getHtml: () => Promise.resolve(sanitizeHtml(latest.current)),
      exec: (command: string, value?: string) => {
        if (command === 'focusEnd' || command === 'focusToEnd') {
          webRef.current?.injectJavaScript('window.__focusEnd(); true;');
          return;
        }
        const payload = `window.__exec(${JSON.stringify(nextCommandId())}, ${JSON.stringify(
          command
        )}, ${value === undefined ? 'undefined' : JSON.stringify(value)}); true;`;
        webRef.current?.injectJavaScript(payload);
      },
      toggleBlock: (tag: string) => {
        webRef.current?.injectJavaScript(
          `window.__toggleBlock(${JSON.stringify(nextCommandId())}, ${JSON.stringify(tag)}); true;`
        );
      },
      stepFontSize: (delta: number) => {
        webRef.current?.injectJavaScript(
          `window.__stepFontSize(${JSON.stringify(nextCommandId())}, ${JSON.stringify(delta)}); true;`
        );
      },
      toggleFormat: (format: 'bold' | 'italic' | 'underline' | 'strikeThrough') => {
        const payload = `window.__exec(${JSON.stringify(nextCommandId())}, ${JSON.stringify(
          format
        )}); true;`;
        webRef.current?.injectJavaScript(payload);
      },
      focus: () => {
        webRef.current?.injectJavaScript(
          'if (window.__editor) window.__editor.focus(); true;'
        );
      },
      focusEnd: () => {
        webRef.current?.injectJavaScript('window.__focusEnd(); true;');
      },
      focusToEnd: () => {
        webRef.current?.injectJavaScript('window.__focusEnd(); true;');
      },
      setBackgroundColor: (color: string) => {
        webRef.current?.injectJavaScript(
          `document.documentElement.style.backgroundColor = '${color}'; document.body.style.backgroundColor = '${color}'; true;`
        );
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
          if (onFormatChange) {
            onFormatChange({
              bold: !!payload.state.bold,
              italic: !!payload.state.italic,
              underline: !!payload.state.underline,
              strikeThrough: !!payload.state.strikeThrough,
            });
          }
        } else if (payload.type === 'focus') {
          onFocus?.();
        } else if (payload.type === 'blur') {
          onBlur?.();
        }
      } catch {
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
        style={[styles.web, { backgroundColor }]}
        containerStyle={[styles.webContainer, { backgroundColor }]}
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
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  web: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
