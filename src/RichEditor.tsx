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
  setBlock: (tag: string) => void;
  setFontSize: (pt: string) => void;
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
    var pendingPt = null;
    var pendingSizeCaret = null;
    var pendingSizeExistingFonts = [];
    var pendingBoldHeading = null;
    var pendingBoldCaret = null;

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

    // Marks are read from the real tags around the caret, NOT from
    // queryCommandState. That call answers "does this text LOOK bold", which is
    // true inside a heading purely because headings render bold - so it would
    // light the B button for a heading that was never bolded.
    function selectionNodes() {
      var nodes = [];
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return nodes;
      var node = sel.getRangeAt(0).startContainer;
      if (node.nodeType === 3) node = node.parentNode;
      while (node && node !== editor && node !== document.body) {
        nodes.push(node);
        node = node.parentNode;
      }
      return nodes;
    }

    function nodeNames() {
      var nodes = selectionNodes();
      var names = [];
      for (var i = 0; i < nodes.length; i++) names.push(nodes[i].nodeName.toLowerCase());
      return names;
    }

    function hasAny(names, wanted) {
      for (var i = 0; i < names.length; i++) {
        if (wanted.indexOf(names[i]) >= 0) return true;
      }
      return false;
    }

    var HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

    function headingFromNode(node) {
      if (node && node.nodeType === 3) node = node.parentNode;
      while (node && node !== editor) {
        if (HEADINGS.indexOf(node.nodeName.toLowerCase()) !== -1) return node;
        node = node.parentNode;
      }
      return null;
    }

    function currentHeading() {
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      var range = sel.getRangeAt(0);
      var startHeading = headingFromNode(range.startContainer);
      var endHeading = headingFromNode(range.endContainer);
      return startHeading && startHeading === endHeading ? startHeading : null;
    }

    function pendingBoldForCurrentCaret(heading) {
      var sel = window.getSelection();
      if (!heading || pendingBoldHeading !== heading || !pendingBoldCaret ||
          !sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;
      var range = sel.getRangeAt(0);
      return range.startContainer === pendingBoldCaret.node &&
        range.startOffset === pendingBoldCaret.offset;
    }

    function clearPendingHeadingBold() {
      pendingBoldHeading = null;
      pendingBoldCaret = null;
    }

    // The browser counts h1/h2's default weight as "bold". Temporarily neutralize
    // that block style while executing the command so Bold applies an explicit
    // mark instead of turning the heading's visual boldness off.
    function executeBoldInHeading(heading) {
      var oldWeight = heading.style.getPropertyValue('font-weight');
      var oldPriority = heading.style.getPropertyPriority('font-weight');
      heading.style.setProperty('font-weight', 'normal', 'important');
      document.execCommand('bold', false, null);
      if (oldWeight) heading.style.setProperty('font-weight', oldWeight, oldPriority);
      else heading.style.removeProperty('font-weight');
    }

    function clearResolvedPendingHeadingBold() {
      if (!pendingBoldHeading) return;
      var sel = window.getSelection();
      var range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
      if (!range || !range.isCollapsed || currentHeading() !== pendingBoldHeading) {
        clearPendingHeadingBold();
        return;
      }
      if (hasAny(nodeNames(), ['b', 'strong']) || !pendingBoldForCurrentCaret(pendingBoldHeading)) {
        clearPendingHeadingBold();
      }
    }

    function isCollapsedCaret() {
      var sel = window.getSelection();
      return !!sel && sel.rangeCount > 0 && sel.isCollapsed &&
        editor.contains(sel.getRangeAt(0).commonAncestorContainer);
    }

    // queryCommandState is only meaningful for a pending typing format at a
    // collapsed caret. For selected text, the actual formatting tags are the
    // source of truth, not the visual weight/style of the rendered text.
    function pendingFormatState(command) {
      return isCollapsedCaret() && document.queryCommandState(command) === true;
    }

    function isBold() {
      var names = nodeNames();
      if (hasAny(names, ['b', 'strong'])) return true;
      // The only "bold" state a heading may report without a real mark is a
      // pending Bold command we explicitly issued at this caret.
      var heading = currentHeading();
      if (heading) return pendingBoldForCurrentCaret(heading);
      return pendingFormatState('bold');
    }

    function isMarked(names, wanted, command) {
      if (hasAny(names, wanted)) return true;
      return pendingFormatState(command);
    }

    // The browser reports the default block as 'div' (or nothing); both mean a
    // plain paragraph.
    function currentBlock() {
      var block = (document.queryCommandValue('formatBlock') || '').toLowerCase().replace(/[<>]/g, '');
      if (!block || block === 'div') return 'p';
      return block;
    }

    // Effective rendered size converted to points (CSS uses 96px per inch).
    // A size chosen at a collapsed caret is shown immediately until the caret
    // moves or the first typed input is converted to a real point-sized span.
    function currentFontSize() {
      var sel = window.getSelection();
      if (pendingPt !== null && pendingSizeCaret && sel && sel.rangeCount > 0 && sel.isCollapsed) {
        var currentRange = sel.getRangeAt(0);
        if (currentRange.startContainer === pendingSizeCaret.node &&
            currentRange.startOffset === pendingSizeCaret.offset) {
          return String(pendingPt);
        }
      }

      var nodes = selectionNodes();
      var el = nodes.length ? nodes[0] : editor;
      var px = 0;
      try {
        px = parseFloat(window.getComputedStyle(el).fontSize);
        if (!px) px = parseFloat(window.getComputedStyle(editor).fontSize);
      } catch (e) {
        px = 0;
      }
      if (!px) return null;
      return String(Math.round(px * 0.75));
    }

    function sendState() {
      if (window.ReactNativeWebView) {
        var names = nodeNames();
        var state = {
          bold: isBold(),
          italic: isMarked(names, ['i', 'em'], 'italic'),
          underline: isMarked(names, ['u'], 'underline'),
          strikeThrough: isMarked(names, ['s', 'strike', 'del'], 'strikeThrough'),
          insertUnorderedList: document.queryCommandState('insertUnorderedList') === true,
          insertOrderedList: document.queryCommandState('insertOrderedList') === true,
          formatBlock: currentBlock(),
          fontSize: currentFontSize()
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
    editor.addEventListener('input', function() {
      applyPendingSize();
      clearResolvedPendingHeadingBold();
      push();
      sendState();
      ensureCursorVisible();
    });
    editor.addEventListener('keyup', function() { push(); sendState(); ensureCursorVisible(); });
    editor.addEventListener('click', sendState);

    document.addEventListener('selectionchange', function() {
      if (pendingBoldHeading && pendingBoldCaret) {
        var boldSel = window.getSelection();
        var boldRange = boldSel && boldSel.rangeCount > 0 ? boldSel.getRangeAt(0) : null;
        var sameBoldCaret = !!boldRange && boldRange.isCollapsed &&
          boldRange.startContainer === pendingBoldCaret.node &&
          boldRange.startOffset === pendingBoldCaret.offset;
        var inAppliedBoldTag = !!boldRange && boldRange.isCollapsed &&
          currentHeading() === pendingBoldHeading && hasAny(nodeNames(), ['b', 'strong']);
        if (!sameBoldCaret && !inAppliedBoldTag) clearPendingHeadingBold();
      }
      if (pendingPt !== null && pendingSizeCaret) {
        var sel = window.getSelection();
        var range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
        var stillAtPendingCaret = !!range && range.isCollapsed &&
          range.startContainer === pendingSizeCaret.node &&
          range.startOffset === pendingSizeCaret.offset;
        if (!stillAtPendingCaret && !(range && isCaretInsideNewSizeMarker(range))) {
          clearPendingFontSize();
        }
      }
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
      var heading = command === 'bold' ? currentHeading() : null;
      var names = nodeNames();
      var sel = window.getSelection();
      var collapsed = !sel || sel.rangeCount === 0 || sel.getRangeAt(0).collapsed;

      if (heading && !hasAny(names, ['b', 'strong'])) {
        var wasPendingBold = collapsed && pendingBoldForCurrentCaret(heading);
        executeBoldInHeading(heading);
        if (collapsed && !wasPendingBold) {
          pendingBoldHeading = heading;
          var pendingSel = window.getSelection();
          if (pendingSel && pendingSel.rangeCount > 0) {
            var pendingRange = pendingSel.getRangeAt(0);
            pendingBoldCaret = {
              node: pendingRange.startContainer,
              offset: pendingRange.startOffset
            };
          }
        } else {
          clearPendingHeadingBold();
        }
      } else {
        if (command === 'bold') clearPendingHeadingBold();
        document.execCommand(command, false, value === undefined ? null : value);
      }
      finish();
    };

    // Block formats toggle: the same block again goes back to a paragraph.
    window.__setBlock = function (id, tag) {
      if (alreadyRan(id)) return;
      begin();
      var next = currentBlock() === tag ? 'p' : tag;
      document.execCommand('formatBlock', false, '<' + next + '>');
      finish();
    };

    // execCommand only supports legacy sizes 1-7. Use size 7 as a temporary
    // marker, but convert only marker nodes created by THIS command. Old notes
    // may already contain <font size="7"> and must never be rewritten globally.
    function sizeSevenFonts() {
      return Array.prototype.slice.call(editor.querySelectorAll('font[size="7"]'));
    }

    function replaceFontWithPointSize(font, pt) {
      var span = document.createElement('span');
      span.style.fontSize = pt + 'pt';
      while (font.firstChild) span.appendChild(font.firstChild);
      if (font.parentNode) font.parentNode.replaceChild(span, font);
    }

    function convertNewSizeMarkers(pt, previouslyPresent) {
      var marked = sizeSevenFonts();
      var converted = 0;
      for (var i = 0; i < marked.length; i++) {
        if (previouslyPresent.indexOf(marked[i]) !== -1) continue;
        replaceFontWithPointSize(marked[i], pt);
        converted++;
      }
      return converted;
    }

    function clearPendingFontSize() {
      pendingPt = null;
      pendingSizeCaret = null;
      pendingSizeExistingFonts = [];
    }

    function isCaretInsideNewSizeMarker(range) {
      var node = range.startContainer;
      if (node.nodeType === 3) node = node.parentNode;
      while (node && node !== editor) {
        if (node.nodeName.toLowerCase() === 'font' && node.getAttribute('size') === '7') {
          return pendingSizeExistingFonts.indexOf(node) === -1;
        }
        node = node.parentNode;
      }
      return false;
    }

    function applyPendingSize() {
      if (pendingPt === null) return;
      if (convertNewSizeMarkers(pendingPt, pendingSizeExistingFonts) > 0) {
        // The inserted text now carries a real CSS point size, so there is no
        // stale global pending size left to rewrite later inputs or old notes.
        clearPendingFontSize();
      }
    }

    window.__setFontSize = function (id, pt) {
      if (alreadyRan(id)) return;
      var pointSize = String(parseInt(pt, 10));
      if (['10', '11', '12', '14', '16', '18', '24', '36'].indexOf(pointSize) === -1) return;

      begin();
      clearPendingFontSize();
      var sel = window.getSelection();
      var collapsed = !sel || sel.rangeCount === 0 || sel.getRangeAt(0).collapsed;
      var previouslyPresent = sizeSevenFonts();

      document.execCommand('fontSize', false, '7');
      if (collapsed) {
        pendingPt = pointSize;
        pendingSizeExistingFonts = previouslyPresent;
        var pendingSelection = window.getSelection();
        if (pendingSelection && pendingSelection.rangeCount > 0) {
          var pendingRange = pendingSelection.getRangeAt(0);
          pendingSizeCaret = {
            node: pendingRange.startContainer,
            offset: pendingRange.startOffset
          };
        }
        // Usually the browser creates the marker only when the user starts
        // typing. Handle it immediately too, in case the WebView creates one.
        applyPendingSize();
      } else {
        convertNewSizeMarkers(pointSize, previouslyPresent);
      }
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
        .replace(/<([b|i|u|s]|strike)>\s*<\/\1>/gi, '')
        .replace(/<span\s*[^>]*>\s*<\/span>/gi, '');
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
      setBlock: (tag: string) => {
        webRef.current?.injectJavaScript(
          `window.__setBlock(${JSON.stringify(nextCommandId())}, ${JSON.stringify(tag)}); true;`
        );
      },
      setFontSize: (pt: string) => {
        webRef.current?.injectJavaScript(
          `window.__setFontSize(${JSON.stringify(nextCommandId())}, ${JSON.stringify(pt)}); true;`
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
