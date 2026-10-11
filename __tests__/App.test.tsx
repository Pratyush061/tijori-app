/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import App from '../App';

async function renderApp() {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  return tree;
}

function findKey(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  return tree.root.findAll(
    node =>
      !!node.props &&
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function'
  )[0];
}

async function tap(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  await ReactTestRenderer.act(async () => {
    findKey(tree, label).props.onPress();
  });
}

test('first run shows the create-passcode keypad', async () => {
  const tree = await renderApp();
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Tijori');
  expect(json).toContain('Create a passcode');
  expect(json).toContain('STEP 1 OF 2');
});

jest.setTimeout(15000);
test('first passcode submit immediately advances to confirmation', async () => {
  const tree = await renderApp();

  for (const digit of ['1', '2', '3', '4']) {
    await tap(tree, digit);
  }
  await tap(tree, '✓');

  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Confirm your passcode');
  expect(json).toContain('STEP 2 OF 2');
  expect(json).not.toContain('STEP 1 OF 2');
});

test('entering and confirming a passcode reveals the vault', async () => {
  const tree = await renderApp();

  // Step 1: choose a passcode and confirm it with the check key.
  for (const digit of ['1', '2', '3', '4']) {
    await tap(tree, digit);
  }
  await tap(tree, '✓');

  // Step 2: enter it again.
  for (const digit of ['1', '2', '3', '4']) {
    await tap(tree, digit);
  }
  await ReactTestRenderer.act(async () => {
    await findKey(tree, '✓').props.onPress();
  });

  // Assert on structure (tab labels and the hero stats), not on marketing copy.
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Items');
  expect(json).toContain('Passwords');
  expect(json).toContain('Birthdays');
  expect(json).toContain('Settings');
});
