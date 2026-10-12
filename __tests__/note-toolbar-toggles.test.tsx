/**
 * The notes toolbar treats every stateful format the way it treats bold: the
 * button flips immediately and tapping an active block format turns it off
 * again (returning to a paragraph).
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { NoteEditorScreen } from '../src/NoteEditorScreen';
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

describe('Notes toolbar toggles', () => {
  it('applies a block format and clears it when the same button is tapped again', () => {
    const tree = createTree(
      <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
    );

    tap(tree, 'Format H1');
    expect(backgroundOf(findByLabel(tree, 'Format H1'))).toBe(colors.ink);

    tap(tree, 'Format H1');
    expect(backgroundOf(findByLabel(tree, 'Format ¶'))).toBe(colors.ink);
    expect(backgroundOf(findByLabel(tree, 'Format H1'))).not.toBe(colors.ink);
  });
});
