/**
 * @format
 */

import React from 'react';
import { TextInput, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import App from '../App';

async function renderApp() {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  return tree;
}

test('first run shows the create-passcode screen', async () => {
  const tree = await renderApp();
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Tijori');
  expect(json).toContain('Create a passcode to secure your vault');
});

test('creating a passcode reveals the vault and its tabs', async () => {
  const tree = await renderApp();

  const inputs = tree.root.findAllByType(TextInput);
  const pass = inputs.find(i => i.props.accessibilityLabel === 'Passcode');
  const confirm = inputs.find(i => i.props.accessibilityLabel === 'Confirm passcode');
  expect(pass).toBeTruthy();
  expect(confirm).toBeTruthy();

  await ReactTestRenderer.act(async () => {
    pass!.props.onChangeText('1234');
    confirm!.props.onChangeText('1234');
  });

  const create = tree.root
    .findAllByType(TouchableOpacity)
    .find(b => b.props.accessibilityLabel === 'Create passcode');
  expect(create).toBeTruthy();

  await ReactTestRenderer.act(async () => {
    await create!.props.onPress();
  });

  // Assert on structure (tab labels and the hero stats), not on marketing copy,
  // so a copy change cannot break the test.
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Items');
  expect(json).toContain('Passwords');
  expect(json).toContain('Birthdays');
  expect(json).toContain('Settings');
});
