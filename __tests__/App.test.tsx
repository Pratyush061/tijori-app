/**
 * @format
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import App from '../App';

async function renderApp() {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  return tree;
}

test('renders the app and the Tijori brand', async () => {
  const tree = await renderApp();
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Tijori');
});

test('unlocking reveals the vault and its tabs', async () => {
  const tree = await renderApp();
  const buttons = tree.root.findAllByType(TouchableOpacity);
  expect(buttons.length).toBeGreaterThan(0);

  await ReactTestRenderer.act(() => {
    buttons[0].props.onPress();
  });

  // Assert on structure (tab labels and the hero stats), not on marketing copy,
  // so a copy change or a redesigned lock screen cannot break the test.
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Items');
  expect(json).toContain('Passwords');
  expect(json).toContain('Birthdays');
  expect(json).toContain('Settings');
});
