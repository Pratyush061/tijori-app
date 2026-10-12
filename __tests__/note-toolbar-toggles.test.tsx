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

  it('opens the point-size menu from the size button and applies a size', () => {
    const tree = mount();

    expect(findByTestID(tree, 'font-size-menu')).toBeUndefined();

    tap(tree, 'Font size');
    expect(findByTestID(tree, 'font-size-menu')).toBeDefined();
    expect(findByTestID(tree, 'size-16')).toBeDefined();
    expect(findByTestID(tree, 'size-36')).toBeDefined();

    tap(tree, 'Font size 16');
    expect(findByTestID(tree, 'font-size-menu')).toBeUndefined();
  });
});
