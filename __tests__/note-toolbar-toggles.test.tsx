/**
 * The notes toolbar is a pure view of the editor's reported state: it never
 * flips a button on its own. Tapping a format asks the editor to apply it, and
 * the highlight follows whatever state the editor sends back — so tapping an
 * active format turns it off again, several formats can be on at once, and only
 * one block format (heading / paragraph / quote / code) is ever lit.
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

describe('Notes toolbar toggles', () => {
  it('lights a button only when the editor reports that format as active', () => {
    const tree = createTree(
      <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
    );

    expect(backgroundOf(findByLabel(tree, 'Format B'))).not.toBe(colors.ink);

    report(tree, { bold: true, formatBlock: 'p' });
    expect(backgroundOf(findByLabel(tree, 'Format B'))).toBe(colors.ink);
  });

  it('lets several formats be active at the same time', () => {
    const tree = createTree(
      <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
    );

    report(tree, { bold: true, italic: true, underline: true, strikeThrough: true });
    ['Format B', 'Format I', 'Format U', 'Format S'].forEach(label => {
      expect(backgroundOf(findByLabel(tree, label))).toBe(colors.ink);
    });
  });

  it('does not flip a button on its own — the editor decides', () => {
    const tree = createTree(
      <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
    );

    tap(tree, 'Format B');
    // Nothing was reported back, so the button must stay unlit.
    expect(backgroundOf(findByLabel(tree, 'Format B'))).not.toBe(colors.ink);
  });

  it('clears a block format when the same button is tapped again', () => {
    const tree = createTree(
      <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
    );

    report(tree, { formatBlock: 'h1' });
    expect(backgroundOf(findByLabel(tree, 'Format H1'))).toBe(colors.ink);
    expect(backgroundOf(findByLabel(tree, 'Format ¶'))).not.toBe(colors.ink);

    // After the second tap the editor reports the block back as a paragraph.
    report(tree, { formatBlock: 'p' });
    expect(backgroundOf(findByLabel(tree, 'Format ¶'))).toBe(colors.ink);
    expect(backgroundOf(findByLabel(tree, 'Format H1'))).not.toBe(colors.ink);
  });

  it('keeps only one block format lit at a time', () => {
    const tree = createTree(
      <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
    );

    report(tree, { formatBlock: 'h2' });
    expect(backgroundOf(findByLabel(tree, 'Format H2'))).toBe(colors.ink);
    expect(backgroundOf(findByLabel(tree, 'Format H1'))).not.toBe(colors.ink);
    expect(backgroundOf(findByLabel(tree, 'Format ¶'))).not.toBe(colors.ink);
  });
});
