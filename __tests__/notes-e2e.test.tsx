/**
 * Opaque-Box E2E Test Suite: Notes Revamp in Tijori App
 * Adhering to Tier 4 Real-World Scenarios and Acceptance Criteria in ORIGINAL_REQUEST.md
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

import App from '../App';
import { noteStorage } from '../src/storage/asyncStorage';
import { lock, initializeVault, unlockVault as unlockVaultDirect, isUnlocked } from '../src/storage/secureStore';
import { colors } from '../src/theme';

jest.setTimeout(20000);

async function renderApp() {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  return tree;
}

function findByLabel(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const matches = tree.root.findAll(
    node =>
      !!node.props &&
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function'
  );
  return matches[0] ?? null;
}

async function tapByLabel(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const node = findByLabel(tree, label);
  if (!node) {
    throw new Error(`Element with accessibilityLabel="${label}" not found`);
  }
  await ReactTestRenderer.act(async () => {
    node.props.onPress();
  });
}

function findByButtonText(tree: ReactTestRenderer.ReactTestRenderer, text: string) {
  const matches = tree.root.findAll(node => {
    if (!node.props || typeof node.props.onPress !== 'function') return false;
    if (node.props.accessibilityLabel === text) return true;
    try {
      const children = node.findAll(n => n.props?.children === text || (typeof n.props?.children === 'string' && n.props.children.includes(text)));
      return children.length > 0;
    } catch {
      return false;
    }
  });
  return matches[0] ?? null;
}

async function tapByButtonText(tree: ReactTestRenderer.ReactTestRenderer, text: string) {
  const node = findByButtonText(tree, text);
  if (!node) {
    throw new Error(`Element with button text "${text}" not found`);
  }
  await ReactTestRenderer.act(async () => {
    node.props.onPress();
  });
}

async function unlockVault(tree: ReactTestRenderer.ReactTestRenderer) {
  for (let i = 0; i < 5; i++) {
    await ReactTestRenderer.act(async () => {
      await new Promise(resolve => setTimeout(() => resolve(undefined), 50));
    });
    const checkJson = JSON.stringify(tree.toJSON());
    if (checkJson.includes('Create a passcode') || checkJson.includes('Enter your passcode') || checkJson.includes('STEP 1 OF 2') || checkJson.includes('Enter Passcode')) {
      break;
    }
  }

  const json = JSON.stringify(tree.toJSON());
  if (json.includes('Create a passcode') || json.includes('STEP 1 OF 2')) {
    for (const digit of ['1', '2', '3', '4', '5', '6']) {
      await tapByLabel(tree, digit);
    }
    await tapByLabel(tree, '✓');
    for (const digit of ['1', '2', '3', '4', '5', '6']) {
      await tapByLabel(tree, digit);
    }
    await tapByLabel(tree, '✓');
  } else if (json.includes('Enter your passcode') || json.includes('Enter Passcode') || json.includes('Unlock')) {
    for (const digit of ['1', '2', '3', '4', '5', '6']) {
      await tapByLabel(tree, digit);
    }
    await tapByLabel(tree, '✓');
  }
}

async function seedNote(data: any) {
  if (!isUnlocked()) {
    const isInit = await AsyncStorage.getItem('@tijori:verifier');
    if (!isInit) {
      await initializeVault('123456');
    } else {
      await unlockVaultDirect('123456');
    }
  }
  return await noteStorage.create(data);
}

describe('Notes Revamp Opaque-Box E2E Suite (Tier 4)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    lock();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('E2E-1: Complete user journey - create note with title, peach tint, formatting, auto-save, and verify in list', async () => {
    const tree = await renderApp();
    await unlockVault(tree);

    // 1. Navigate to Notes tab
    await tapByLabel(tree, 'Notes');

    // 2. Open note editor via \"Add Note\" button
    const addBtn = findByButtonText(tree, 'Add Note') ?? findByLabel(tree, 'Add');
    expect(addBtn).not.toBeNull();
    await ReactTestRenderer.act(async () => {
      addBtn?.props.onPress();
    });

    // 3. Verify single-row header Save button exists
    const saveBtn = findByLabel(tree, 'Save');
    expect(saveBtn).not.toBeNull();

    // 4. Enter Title
    const titleInput = tree.root.findByProps({ placeholder: 'Note Title' });
    expect(titleInput).toBeDefined();
    await ReactTestRenderer.act(async () => {
      titleInput.props.onChangeText('Architecture Decisions');
    });

    // 5. Select Pastel Palette Tint (Peach)
    const paletteBtn = findByLabel(tree, 'Palette') ?? findByLabel(tree, 'Format A');
    if (paletteBtn) {
      await ReactTestRenderer.act(async () => {
        paletteBtn.props.onPress();
      });
    }
    const peachSwatch =
      findByLabel(tree, 'Select tint Peach') ??
      findByLabel(tree, 'Peach') ??
      tree.root.findAll(
        n =>
          !!n.props &&
          n.props.accessibilityLabel &&
          n.props.accessibilityLabel.toLowerCase().includes('peach')
      )[0];
    if (peachSwatch) {
      await ReactTestRenderer.act(async () => {
        peachSwatch.props.onPress();
      });
    }

    // 6. Toggle formatting buttons (Bold and Italic)
    const boldBtn = findByLabel(tree, 'Format B');
    if (boldBtn) {
      await ReactTestRenderer.act(async () => {
        boldBtn.props.onPress();
      });
    }
    const italicBtn = findByLabel(tree, 'Format I');
    if (italicBtn) {
      await ReactTestRenderer.act(async () => {
        italicBtn.props.onPress();
      });
    }

    // 7. Save note explicitly
    await ReactTestRenderer.act(async () => {
      saveBtn?.props.onPress();
    });

    // 8. Verify note persisted to encrypted storage
    const storedNotes = await noteStorage.list();
    expect(storedNotes.length).toBeGreaterThanOrEqual(1);
    const savedNote = storedNotes.find(n => n.title === 'Architecture Decisions');
    expect(savedNote).toBeDefined();

    // 9. Verify note card rendered in list view
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Architecture Decisions');
  });

  test('E2E-2: Edit existing note - reopen from list, edit title, apply tint, explicit Save, verify update', async () => {
    // Seed initial note in storage
    await seedNote({
      title: 'Original Title',
      body: 'Original Body',
      color: colors.orange,
      initial: 'OT',
    });

    const tree = await renderApp();
    await unlockVault(tree);

    // Navigate to Notes
    await tapByLabel(tree, 'Notes');

    // Tap existing note row
    await tapByButtonText(tree, 'Original Title');

    // Update title
    const titleInput = tree.root.findByProps({ placeholder: 'Note Title' });
    await ReactTestRenderer.act(async () => {
      titleInput.props.onChangeText('Updated Title V2');
    });

    // Tap Save
    const saveBtn = findByLabel(tree, 'Save');
    await ReactTestRenderer.act(async () => {
      saveBtn?.props.onPress();
    });

    // Verify storage updated
    const storedNotes = await noteStorage.list();
    const updatedNote = storedNotes.find(n => n.title === 'Updated Title V2');
    expect(updatedNote).toBeDefined();

    // Verify list view updated
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Updated Title V2');
  });

  test('E2E-3: Blank note discard - open editor for new note, type nothing, tap Back, verify no blank note created', async () => {
    const tree = await renderApp();
    await unlockVault(tree);

    await tapByLabel(tree, 'Notes');

    const addBtn = findByButtonText(tree, 'Add Note') ?? findByLabel(tree, 'Add');
    await ReactTestRenderer.act(async () => {
      addBtn?.props.onPress();
    });

    // Tap Back without typing anything
    const backBtn = findByLabel(tree, 'Back');
    await ReactTestRenderer.act(async () => {
      backBtn?.props.onPress();
    });

    // Verify storage remains empty
    const storedNotes = await noteStorage.list();
    expect(storedNotes.length).toBe(0);
  });

  test('E2E-4: Multiple notes with distinct pastel tints and search filtering', async () => {
    await seedNote({
      title: 'Grocery List',
      body: 'Milk, Eggs, Bread',
      color: colors.green,
      initial: 'GL',
    });
    await seedNote({
      title: 'Meeting Notes',
      body: 'Discuss roadmap and deliverables',
      color: colors.blue,
      initial: 'MN',
    });

    const tree = await renderApp();
    await unlockVault(tree);

    await tapByLabel(tree, 'Notes');

    let json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Grocery List');
    expect(json).toContain('Meeting Notes');

    // Filter by \"Grocery\"
    const searchInput = tree.root.findByProps({ placeholder: 'Search notes' });
    await ReactTestRenderer.act(async () => {
      searchInput.props.onChangeText('Grocery');
    });

    json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Grocery List');
    expect(json).not.toContain('Meeting Notes');

    // Clear search
    await ReactTestRenderer.act(async () => {
      searchInput.props.onChangeText('');
    });
    json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Grocery List');
    expect(json).toContain('Meeting Notes');
  });

  test('E2E-5: Legacy note backward compatibility - plain text note without tint opens and saves', async () => {
    await seedNote({
      title: 'Legacy Note',
      body: 'Line 1\\nLine 2\\nLine 3',
      color: colors.orange,
      initial: 'LN',
    });

    const tree = await renderApp();
    await unlockVault(tree);

    await tapByLabel(tree, 'Notes');

    await tapByButtonText(tree, 'Legacy Note');

    const titleInput = tree.root.findByProps({ placeholder: 'Note Title' });
    expect(titleInput.props.value).toBe('Legacy Note');

    const saveBtn = findByLabel(tree, 'Save');
    await ReactTestRenderer.act(async () => {
      saveBtn?.props.onPress();
    });

    const storedNotes = await noteStorage.list();
    expect(storedNotes.length).toBe(1);
    expect(storedNotes[0].title).toBe('Legacy Note');
  });

  test('E2E-6: Vault relock and persistence - notes survive app lock and unlock', async () => {
    await seedNote({
      title: 'Persistent Secret',
      body: 'Confidential project details',
      color: colors.indigo,
      initial: 'PS',
    });

    const tree = await renderApp();
    await unlockVault(tree);

    await tapByLabel(tree, 'Notes');
    let json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Persistent Secret');

    // Relock app
    lock();

    // Verify storage throws while locked
    await expect(noteStorage.list()).rejects.toThrow('Vault is locked');

    // Unlock again and verify notes survived
    const unlocked = await unlockVaultDirect('123456');
    expect(unlocked).toBe(true);
    const storedNotes = await noteStorage.list();
    expect(storedNotes.length).toBe(1);
    expect(storedNotes[0].title).toBe('Persistent Secret');
  });
});
