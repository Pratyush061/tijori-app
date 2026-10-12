/**
 * The notes toolbar is a pure view of the editor's reported state: it never
 * flips a button on its own. Bold / italic / underline / strike are read by the
 * editor from the real tags around the caret, so a heading can no longer light
 * the B button, and there are no H1 / H2 / ¶ buttons any more — sizes come from
 * the point-size menu instead.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { NoteEditorScreen } from '../src/NoteEditorScreen';
import { RichEditor } from '../src/RichEditor';
import { colors } from '../src/theme';

function createTree(element: React.ReactElement) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(element);
  });
  return tree;
}

function findByLabel(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  return tree.root.findAll(
    node =>
      !!node.props &&
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function'
  )[0];
}

function findByTestID(tree: ReactTestRenderer.ReactTestRenderer, id: string) {
  return tree.root.findAll(node => !!node.props && node.props.testID === id)[0];
}

function editorDocument(tree: ReactTestRenderer.ReactTestRenderer): string {
  const webView = tree.root.findAll(
    node => !!node.props && typeof node.props.source?.html === 'string'
  )[0];
  return webView?.props.source.html as string;
}

function backgroundOf(node: ReturnType<typeof findByLabel>): unknown {
  if (!node) return undefined;
  const style = Array.isArray(node.props.style)
    ? Object.assign({}, ...node.props.style)
    : node.props.style;
  return style?.backgroundColor;
}

function tap(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  ReactTestRenderer.act(() => {
    findByLabel(tree, label)?.props.onPress();
  });
}

function report(tree: ReactTestRenderer.ReactTestRenderer, state: Record<string, unknown>) {
  const editor = tree.root.findByType(RichEditor);
  ReactTestRenderer.act(() => {
    editor.props.onStateChange(state);
  });
}

function mount() {
  return createTree(
    <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
  );
}

describe('Notes toolbar toggles', () => {
  it('lights B only when the editor reports real bold', () => {
    const tree = mount();

    expect(backgroundOf(findByLabel(tree, 'Format B'))).not.toBe(colors.ink);

    report(tree, { bold: true });
    expect(backgroundOf(findByLabel(tree, 'Format B'))).toBe(colors.ink);

    report(tree, { bold: false });
    expect(backgroundOf(findByLabel(tree, 'Format B'))).not.toBe(colors.ink);
  });

  it('lets several marks be active at the same time', () => {
    const tree = mount();

    report(tree, { bold: true, italic: true, underline: true, strikeThrough: true });
    ['Format B', 'Format I', 'Format U', 'Format S'].forEach(label => {
      expect(backgroundOf(findByLabel(tree, label))).toBe(colors.ink);
    });
  });

  it('does not flip a button on its own — the editor decides', () => {
    const tree = mount();

    tap(tree, 'Format B');
    // Nothing was reported back, so the button must stay unlit.
    expect(backgroundOf(findByLabel(tree, 'Format B'))).not.toBe(colors.ink);
  });

  it('lights the list buttons from the reported state', () => {
    const tree = mount();

    report(tree, { insertUnorderedList: true });
    expect(backgroundOf(findByLabel(tree, 'Format •'))).toBe(colors.ink);
    expect(backgroundOf(findByLabel(tree, 'Format 1.'))).not.toBe(colors.ink);
  });

  it('lights quote and code only for the block the editor reports', () => {
    const tree = mount();

    report(tree, { formatBlock: 'blockquote' });
    expect(backgroundOf(findByLabel(tree, 'Format ❝'))).toBe(colors.ink);
    expect(backgroundOf(findByLabel(tree, 'Format </>'))).not.toBe(colors.ink);

    report(tree, { formatBlock: 'pre' });
    expect(backgroundOf(findByLabel(tree, 'Format </>'))).toBe(colors.ink);
    expect(backgroundOf(findByLabel(tree, 'Format ❝'))).not.toBe(colors.ink);

    // Tapping the lit one again returns the text to a paragraph.
    report(tree, { formatBlock: 'p' });
    expect(backgroundOf(findByLabel(tree, 'Format ❝'))).not.toBe(colors.ink);
    expect(backgroundOf(findByLabel(tree, 'Format </>'))).not.toBe(colors.ink);
  });

  it('no longer offers H1, H2 or paragraph buttons', () => {
    const tree = mount();

    ['Format H1', 'Format H2', 'Format ¶'].forEach(label => {
      expect(findByLabel(tree, label)).toBeUndefined();
    });
  });

  it('opens the point-size pill bar from the size button and applies a size', () => {
    const tree = mount();

    expect(findByTestID(tree, 'font-size-bar')).toBeUndefined();

    tap(tree, 'Font size');
    expect(findByTestID(tree, 'font-size-bar')).toBeDefined();
    ['10', '12', '14', '16', '18', '24', '32'].forEach(pt => {
      expect(findByTestID(tree, `size-${pt}`)).toBeDefined();
    });
    expect(findByTestID(tree, 'size-13')).toBeUndefined();

    tap(tree, 'Font size');
    expect(findByTestID(tree, 'font-size-bar')).toBeUndefined();
  });

  it('highlights the active font size pill in the horizontal bar', () => {
    const tree = mount();

    tap(tree, 'Font size');
    report(tree, { fontSize: '18' });

    const pill18 = findByTestID(tree, 'size-18');
    expect(backgroundOf(pill18)).toBe(colors.ink);

    const pill14 = findByTestID(tree, 'size-14');
    expect(backgroundOf(pill14)).not.toBe(colors.ink);
  });

  it('lights inline code button when inlineCode is reported by editor', () => {
    const tree = mount();

    expect(backgroundOf(findByLabel(tree, 'Format code'))).not.toBe(colors.ink);

    report(tree, { inlineCode: true });
    expect(backgroundOf(findByLabel(tree, 'Format code'))).toBe(colors.ink);

    report(tree, { inlineCode: false });
    expect(backgroundOf(findByLabel(tree, 'Format code'))).not.toBe(colors.ink);
  });

  it('shows the reported current point size on the size button', () => {
    const tree = mount();

    const defaultSize = findByTestID(tree, 'font-size');
    expect(defaultSize?.findAll(node => node.props.children === '13pt').length).toBeGreaterThan(0);

    report(tree, { fontSize: '16' });
    const selectedSize = findByTestID(tree, 'font-size');
    expect(selectedSize?.findAll(node => node.props.children === '16pt').length).toBeGreaterThan(0);
  });

  it('only uses command state for collapsed-caret marks, not selected text', () => {
    const tree = createTree(<RichEditor initialHTML="<h2>Heading</h2><p>Text</p>" />);
    const html = editorDocument(tree);

    expect(html).toContain('function isCollapsedCaret()');
    expect(html).toContain('function pendingFormatState(command)');
    expect(html).toContain("return pendingFormatState('bold');");
    expect(html).toContain('return pendingFormatState(command);');
    expect(html).toContain("if (hasAny(names, ['b', 'strong'])) return true;");
    expect(html).toContain('function executeBoldInHeading(heading)');
    expect(html).toContain("if (heading && !hasAny(names, ['b', 'strong']))");
    expect(html).toContain('if (heading) return pendingBoldForCurrentCaret(heading);');
    expect(html).not.toContain("return document.queryCommandState('bold') === true;");
    expect(html).not.toContain('return document.queryCommandState(command) === true;');
  });

  it('rewrites only the size markers it creates, and keeps converting later ones', () => {
    const tree = createTree(<RichEditor initialHTML={'<font size="7">Old large text</font>'} />);
    const html = editorDocument(tree);

    // Only markers that appeared after the snapshot are rewritten, so a size-7
    // tag already sitting in an old note is left alone.
    expect(html).toContain('function convertNewSizeMarkers(pt)');
    expect(html).toContain('if (markerSnapshot.indexOf(marked[i]) !== -1) continue;');
    expect(html).toContain('markerSnapshot = sizeSevenFonts();');

    // The pending size must survive the first conversion: words typed after a
    // size is chosen are converted too, instead of being left as stray tags.
    expect(html).toContain('convertNewSizeMarkers(lastPt);');
    expect(html).not.toContain('function clearPendingFontSize()');
    expect(html).not.toContain('pendingSizeCaret');

    // A collapsed caret gets an empty sized span with the caret inside it.
    expect(html).toContain('function insertSizeSpanAtCaret(pt)');
    expect(html).toContain('caret.setStart(span, 0);');

    // Styled spans are never treated as orphans, so that span survives a save.
    expect(html).toContain("if (el.getAttribute && el.getAttribute('style')) continue;");
    expect(html).not.toContain(
      'var marked = editor.querySelectorAll(\'font[size="7"]\');\n      for (var i = 0; i < marked.length; i++)'
    );
  });
});
