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

    // Need to mock data for vault screen because AsyncStorage returns a string 'true' and the vault screen assumes it's an array for `filter`
    jest.spyOn(require('../src/storage/asyncStorage').passwordStorage, 'list').mockResolvedValue([]);
    jest.spyOn(require('../src/storage/asyncStorage').birthdayStorage, 'list').mockResolvedValue([]);
    jest.spyOn(require('../src/storage/asyncStorage').noteStorage, 'list').mockResolvedValue([]);
    jest.spyOn(require('../src/storage/asyncStorage').cardStorage, 'list').mockResolvedValue([]);

    tree = ReactTestRenderer.create(<App />);

  });
  return tree;
}

test('launches on the lock screen', async () => {
  const tree = await renderApp();
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Tijori');
  expect(json).toContain('Unlock with Face ID');
});

test('unlocking reveals the vault and its tabs', async () => {
  const tree = await renderApp();
  const buttons = tree.root.findAllByType(TouchableOpacity);
  expect(buttons.length).toBeGreaterThan(0);

  await ReactTestRenderer.act(() => {
    buttons[0].props.onPress();
  });

  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Vault secured');
  expect(json).toContain('Passwords');
  expect(json).toContain('Birthdays');
  expect(json).toContain('Settings');
});
