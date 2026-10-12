/**
 * Regression guard for the draggable sheet's structure.
 *
 * The sheet body must render *inside* the sheet surface. A refactor once moved
 * it out to a sibling, which left GestureDetector with two children - a hard
 * runtime error on a device, but invisible here because the test renderer stubs
 * GestureDetector as a plain View that happily renders any number of children.
 */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import { DraggableSheet } from '../src/DraggableSheet';

function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyle));
  if (typeof style === 'object') return style as Record<string, unknown>;
  return {};
}

describe('DraggableSheet structure', () => {
  it('renders the sheet body inside the sheet surface', () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <DraggableSheet visible onClose={jest.fn()} onSave={jest.fn()} title="Test Sheet">
          <Text testID="sheet-body">Body content</Text>
        </DraggableSheet>
      );
    });

    const sheet = tree.root.findAll(node => {
      const style = flattenStyle(node.props?.style);
      return style.borderTopLeftRadius === 24 && style.borderTopRightRadius === 24;
    })[0];
    if (!sheet) throw new Error('The sheet surface was not rendered.');

    // `Text` renders a composite node and a host node, so the testID can match
    // more than once - what matters is that the body is under the sheet at all.
    const body = sheet.findAll(node => node.props?.testID === 'sheet-body');
    expect(body.length).toBeGreaterThan(0);
  });
});
