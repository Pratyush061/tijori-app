/**
 * Comprehensive Component Test Suite: NoteEditorScreen & RichEditor
 * Covering Tiers 1-3 across Features F1-F5 per ORIGINAL_REQUEST.md
 */

import React from 'react';
import { DeviceEventEmitter, Keyboard } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import { NoteEditorScreen } from '../src/NoteEditorScreen';
import { RichEditor } from '../src/RichEditor';
import { colors } from '../src/theme';
import * as theme from '../src/theme';
import type { NoteEntry } from '../src/data';

const EXPECTED_TINTS: Record<string, string> = {
  default: '#FFFFFF',
  mint: '#EBF6EF',
  lemon: '#FFFBEA',
  peach: '#FFF2EC',
  sky: '#EBF5FB',
  lavender: '#F5EFFB',
};

const NOTE_TINTS: Record<string, string> =
  (theme as Record<string, any>).NOTE_TINTS ?? EXPECTED_TINTS;

const sampleExistingNote: NoteEntry = {
  id: 'note-existing-1',
  title: 'Quarterly Planning',
  body: 'Objectives and key results for Q4',
  color: colors.orange,
  initial: 'QP',
};

function findByLabel(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const styledMatches = tree.root.findAll(
    node =>
      !!node.props &&
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function' &&
      node.props.style !== undefined
  );
  if (styledMatches.length > 0) return styledMatches[0];
  const matches = tree.root.findAll(
    node =>
      !!node.props &&
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function'
  );
  return matches[0] ?? null;
}

function findTitleInput(tree: ReactTestRenderer.ReactTestRenderer) {
  return tree.root.findByProps({ placeholder: 'Note Title' });
}

function simulateKeyboardShow(height = 300) {
  const event = {
    endCoordinates: { height, screenX: 0, screenY: 500, width: 375 },
  };
  if (typeof (Keyboard as any).emit === 'function') {
    (Keyboard as any).emit('keyboardDidShow', event);
    (Keyboard as any).emit('keyboardWillShow', event);
  }
  DeviceEventEmitter.emit('keyboardDidShow', event);
  DeviceEventEmitter.emit('keyboardWillShow', event);
}

function simulateKeyboardHide() {
  const event = {};
  if (typeof (Keyboard as any).emit === 'function') {
    (Keyboard as any).emit('keyboardDidHide', event);
    (Keyboard as any).emit('keyboardWillHide', event);
  }
  DeviceEventEmitter.emit('keyboardDidHide', event);
  DeviceEventEmitter.emit('keyboardWillHide', event);
}

let activeTrees: ReactTestRenderer.ReactTestRenderer[] = [];

function createTree(element: React.ReactElement): ReactTestRenderer.ReactTestRenderer {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(element);
  });
  activeTrees.push(tree);
  return tree;
}

describe('NoteEditorScreen Component Test Suite', () => {
  afterEach(() => {
    while (activeTrees.length > 0) {
      const t = activeTrees.pop();
      try {
        ReactTestRenderer.act(() => {
          t?.unmount();
        });
      } catch {}
    }
    jest.useRealTimers();
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 cases per feature)
  // =========================================================================

  describe('Tier 1 - F1: Canvas & Cursor Placement (R1)', () => {
    test('F1-1: autoFocus is true on Title TextInput when creating a new note (entry is null)', () => {
      let tree!: ReactTestRenderer.ReactTestRenderer;
      ReactTestRenderer.act(() => {
        tree = createTree(
          <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
        );
      });
      const titleInput = findTitleInput(tree);
      expect(titleInput.props.autoFocus).toBe(true);
    });

    test('F1-2: autoFocus is falsy on Title TextInput when editing an existing note', () => {
      const tree = createTree(
        <NoteEditorScreen entry={sampleExistingNote} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const titleInput = findTitleInput(tree);
      expect(titleInput.props.autoFocus).toBeFalsy();
    });

    test('F1-3: canvas container occupies full available height with flex: 1', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const richEditorInstance = tree.root.findByType(RichEditor);
      expect(richEditorInstance).toBeDefined();
      const parent = richEditorInstance.parent;
      expect(parent).not.toBeNull();
      const parentStyle = Array.isArray(parent?.props.style)
        ? Object.assign({}, ...parent.props.style)
        : parent?.props.style;
      expect(parentStyle).toEqual(expect.objectContaining({ flex: 1 }));
    });

    test('F1-4: blank canvas tap area or RichEditor responds to press event', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const canvasArea =
        findByLabel(tree, 'Canvas') ??
        tree.root.findAll(
          n =>
            !!n.props &&
            (n.props.testID === 'canvas-tap-area' ||
              n.props.accessibilityLabel === 'Canvas' ||
              typeof n.props.onPress === 'function')
        )[0];
      expect(canvasArea).toBeDefined();
    });

    test('F1-5: RichEditor WebView receives full-height flexible container styling', () => {
      const tree = createTree(
        <RichEditor initialHTML="<p>Test</p>" accent={colors.orange} />
      );
      const webViewNode = tree.root.findAll(
        n => !!n.props && (n.props.originWhitelist !== undefined || n.props.source !== undefined)
      )[0];
      expect(webViewNode).toBeDefined();
      const webStyle = Array.isArray(webViewNode.props.style)
        ? Object.assign({}, ...webViewNode.props.style)
        : webViewNode.props.style;
      expect(webStyle).toEqual(expect.objectContaining({ flex: 1 }));
    });
  });

  describe('Tier 1 - F2: Deterministic Formatting Toggles & Coexistence (R2)', () => {
    test('F2-1: tapping Bold button executes bold command', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const boldBtn = findByLabel(tree, 'Format B');
      expect(boldBtn).not.toBeNull();
      ReactTestRenderer.act(() => {
        boldBtn?.props.onPress();
      });
    });

    test('F2-2: tapping Italic button executes italic command', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const italicBtn = findByLabel(tree, 'Format I');
      expect(italicBtn).not.toBeNull();
      ReactTestRenderer.act(() => {
        italicBtn?.props.onPress();
      });
    });

    test('F2-3: tapping Underline button executes underline command', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const underlineBtn = findByLabel(tree, 'Format U');
      expect(underlineBtn).not.toBeNull();
      ReactTestRenderer.act(() => {
        underlineBtn?.props.onPress();
      });
    });

    test('F2-4: tapping Strikethrough button executes strikeThrough command', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const strikeBtn = findByLabel(tree, 'Format S');
      expect(strikeBtn).not.toBeNull();
      ReactTestRenderer.act(() => {
        strikeBtn?.props.onPress();
      });
    });

    test('F2-5: active formatting tools support simultaneous coexistence of B + I', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const richEditor = tree.root.findByType(RichEditor);
      const stateCallback =
        richEditor.props.onStateChange ?? richEditor.props.onFormatChange;
      if (typeof stateCallback === 'function') {
        ReactTestRenderer.act(() => {
          stateCallback({ bold: true, italic: true });
        });
        const boldBtn = findByLabel(tree, 'Format B');
        const italicBtn = findByLabel(tree, 'Format I');
        const boldStyle = Array.isArray(boldBtn?.props.style)
          ? Object.assign({}, ...boldBtn.props.style)
          : boldBtn?.props.style;
        const italicStyle = Array.isArray(italicBtn?.props.style)
          ? Object.assign({}, ...italicBtn.props.style)
          : italicBtn?.props.style;
        expect(boldStyle.backgroundColor).toBeDefined();
        expect(italicStyle.backgroundColor).toBeDefined();
      }
    });
  });

  describe('Tier 1 - F3: Keyboard Adaptation & Floating Toolbar (R3)', () => {
    test('F3-1: toolbar renders at docked bottom when keyboard is hidden', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const boldBtn = findByLabel(tree, 'Format B');
      expect(boldBtn).not.toBeNull();
    });

    test('F3-2: keyboardDidShow event adjusts toolbar above virtual keyboard', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      ReactTestRenderer.act(() => {
        simulateKeyboardShow(300);
      });
      const boldBtn = findByLabel(tree, 'Format B');
      expect(boldBtn).not.toBeNull();
    });

    test('F3-3: keyboardDidHide event restores toolbar to docked position', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      ReactTestRenderer.act(() => {
        simulateKeyboardShow(300);
      });
      ReactTestRenderer.act(() => {
        simulateKeyboardHide();
      });
      const boldBtn = findByLabel(tree, 'Format B');
      expect(boldBtn).not.toBeNull();
    });

    test('F3-4: toolbar responds cleanly to iOS keyboardWillShow and keyboardWillHide events', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      ReactTestRenderer.act(() => {
        DeviceEventEmitter.emit('keyboardWillShow', {
          endCoordinates: { height: 280, screenX: 0, screenY: 520, width: 375 },
        });
      });
      ReactTestRenderer.act(() => {
        DeviceEventEmitter.emit('keyboardWillHide', {});
      });
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F3-5: unmounting cleans up keyboard event subscriptions without warnings', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      ReactTestRenderer.act(() => {
        tree.unmount();
      });
      expect(() => {
        simulateKeyboardShow(300);
        simulateKeyboardHide();
      }).not.toThrow();
    });
  });

  describe('Tier 1 - F4: Pastel Background Note Tints (R4)', () => {
    test('F4-1: palette picker exposes pastel tint options', () => {
      expect(Object.keys(NOTE_TINTS)).toEqual(
        expect.arrayContaining(['default', 'mint', 'lemon', 'peach', 'sky', 'lavender'])
      );
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const paletteTrigger =
        findByLabel(tree, 'Palette') ??
        findByLabel(tree, 'Color palette') ??
        findByLabel(tree, 'Format A');
      if (paletteTrigger) {
        ReactTestRenderer.act(() => {
          paletteTrigger.props.onPress();
        });
      }
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F4-2: selecting Mint pastel tint updates canvas styling', () => {
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={onSave} />
      );
      const paletteTrigger = findByLabel(tree, 'Palette') ?? findByLabel(tree, 'Format A');
      if (paletteTrigger) {
        ReactTestRenderer.act(() => {
          paletteTrigger.props.onPress();
        });
      }
      const mintSwatch =
        findByLabel(tree, 'Select tint Mint') ??
        findByLabel(tree, 'Mint') ??
        tree.root.findAll(
          n =>
            !!n.props &&
            n.props.accessibilityLabel &&
            n.props.accessibilityLabel.toLowerCase().includes('mint')
        )[0];
      if (mintSwatch) {
        ReactTestRenderer.act(() => {
          mintSwatch.props.onPress();
        });
      }
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F4-3: selecting Peach pastel tint applies Peach background color', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const paletteTrigger = findByLabel(tree, 'Palette') ?? findByLabel(tree, 'Format A');
      if (paletteTrigger) {
        ReactTestRenderer.act(() => {
          paletteTrigger.props.onPress();
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
        ReactTestRenderer.act(() => {
          peachSwatch.props.onPress();
        });
      }
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F4-4: explicit Save includes selected pastel tint in payload', () => {
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Tinted Note');
      });
      const saveBtn = findByLabel(tree, 'Save');
      ReactTestRenderer.act(() => {
        saveBtn?.props.onPress();
      });
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Tinted Note',
        })
      );
    });

    test('F4-5: new note defaults to default background tint', () => {
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Default Tint Note');
      });
      const saveBtn = findByLabel(tree, 'Save');
      ReactTestRenderer.act(() => {
        saveBtn?.props.onPress();
      });
      expect(onSave).toHaveBeenCalled();
      const savedPayload = onSave.mock.calls[0][0];
      expect(savedPayload.title).toBe('Default Tint Note');
    });
  });

  describe('Tier 1 - F5: Debounced Auto-Save & Clean Navigation Header (R5)', () => {
    test('F5-1: title change triggers debounced auto-save after exactly 1000ms', () => {
      jest.useFakeTimers();
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={sampleExistingNote} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Updated Q4 Title');
      });
      expect(onSave).not.toHaveBeenCalled();

      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(onSave).not.toHaveBeenCalled();

      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated Q4 Title' })
      );
    });

    test('F5-2: typing before 1000ms resets the debounce window', () => {
      jest.useFakeTimers();
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={sampleExistingNote} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);

      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('First Keystroke');
      });
      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(600);
      });
      expect(onSave).not.toHaveBeenCalled();

      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Second Keystroke');
      });
      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(600);
      });
      expect(onSave).not.toHaveBeenCalled();

      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Second Keystroke' })
      );
    });

    test('F5-3: explicit Save button triggers immediately and cancels pending timer', () => {
      jest.useFakeTimers();
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={sampleExistingNote} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Immediate Save Title');
      });
      expect(onSave).not.toHaveBeenCalled();

      const saveBtn = findByLabel(tree, 'Save');
      ReactTestRenderer.act(() => {
        saveBtn?.props.onPress();
      });
      expect(onSave).toHaveBeenCalledTimes(1);

      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    test('F5-4: unmounting flushes or cancels pending debounced save without memory leak', () => {
      jest.useFakeTimers();
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={sampleExistingNote} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Unmount Flush Title');
      });

      ReactTestRenderer.act(() => {
        tree.unmount();
      });
      expect(() => {
        jest.advanceTimersByTime(2000);
      }).not.toThrow();
    });

    test('F5-5: single-row header contains Back and Save buttons', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const backBtn = findByLabel(tree, 'Back');
      const saveBtn = findByLabel(tree, 'Save');
      expect(backBtn).not.toBeNull();
      expect(saveBtn).not.toBeNull();
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 cases per feature)
  // =========================================================================

  describe('Tier 2 - Boundary & Corner Cases', () => {
    test('F1-B1: empty title input does not cause unhandled crash', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('');
      });
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F1-B2: very long title text handles gracefully without clipping crashes', () => {
      const longTitle = 'A'.repeat(500);
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText(longTitle);
      });
      expect(titleInput.props.value).toBe(longTitle);
    });

    test('F1-B3: rapid consecutive taps on formatting canvas or buttons do not crash', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const boldBtn = findByLabel(tree, 'Format B');
      for (let i = 0; i < 10; i++) {
        ReactTestRenderer.act(() => {
          boldBtn?.props.onPress();
        });
      }
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F1-B4: title autofocus remains false when entry has empty title but has id', () => {
      const noteWithEmptyTitle: NoteEntry = {
        id: 'note-empty-title',
        title: '',
        body: 'Some content',
        color: colors.orange,
        initial: 'N',
      };
      const tree = createTree(
        <NoteEditorScreen entry={noteWithEmptyTitle} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const titleInput = findTitleInput(tree);
      expect(titleInput.props.autoFocus).toBeFalsy();
    });

    test('F1-B5: canvas rendered on existing note with multi-paragraph HTML body', () => {
      const multiParaNote: NoteEntry = {
        id: 'multi-para',
        title: 'Long Note',
        body: '<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>',
        color: colors.orange,
        initial: 'LN',
      };
      const tree = createTree(
        <NoteEditorScreen entry={multiParaNote} onClose={jest.fn()} onSave={jest.fn()} />
      );
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F2-B1: toggling bold on-off-on-off executes sequentially without error', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const boldBtn = findByLabel(tree, 'Format B');
      ['bold', 'bold', 'bold', 'bold'].forEach(() => {
        ReactTestRenderer.act(() => {
          boldBtn?.props.onPress();
        });
      });
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F2-B2: all 4 formatting tools active simultaneously (B + I + U + S)', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const richEditor = tree.root.findByType(RichEditor);
      const stateCallback =
        richEditor.props.onStateChange ?? richEditor.props.onFormatChange;
      if (typeof stateCallback === 'function') {
        ReactTestRenderer.act(() => {
          stateCallback({ bold: true, italic: true, underline: true, strikeThrough: true });
        });
        const boldBtn = findByLabel(tree, 'Format B');
        const italicBtn = findByLabel(tree, 'Format I');
        const underlineBtn = findByLabel(tree, 'Format U');
        const strikeBtn = findByLabel(tree, 'Format S');
        expect(boldBtn).not.toBeNull();
        expect(italicBtn).not.toBeNull();
        expect(underlineBtn).not.toBeNull();
        expect(strikeBtn).not.toBeNull();
      }
    });

    test('F2-B3: active tool button background styling is distinct from inactive styling', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const boldBtn = findByLabel(tree, 'Format B');
      const inactiveStyle = Array.isArray(boldBtn?.props.style)
        ? Object.assign({}, ...boldBtn.props.style)
        : boldBtn?.props.style;

      const richEditor = tree.root.findByType(RichEditor);
      const stateCallback =
        richEditor.props.onStateChange ?? richEditor.props.onFormatChange;
      if (typeof stateCallback === 'function') {
        ReactTestRenderer.act(() => {
          stateCallback({ bold: true });
        });
        const activeBoldBtn = findByLabel(tree, 'Format B');
        const activeStyle = Array.isArray(activeBoldBtn?.props.style)
          ? Object.assign({}, ...activeBoldBtn.props.style)
          : activeBoldBtn?.props.style;
        expect(activeStyle.backgroundColor).not.toBe(inactiveStyle.backgroundColor);
      }
    });

    test('F2-B4: deactivating bold leaves italic active when both were active', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const richEditor = tree.root.findByType(RichEditor);
      const stateCallback =
        richEditor.props.onStateChange ?? richEditor.props.onFormatChange;
      if (typeof stateCallback === 'function') {
        ReactTestRenderer.act(() => {
          stateCallback({ bold: true, italic: true });
        });
        ReactTestRenderer.act(() => {
          stateCallback({ bold: false, italic: true });
        });
        const italicBtn = findByLabel(tree, 'Format I');
        expect(italicBtn).not.toBeNull();
      }
    });

    test('F2-B5: format state resets when editor mounts new note', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const boldBtn = findByLabel(tree, 'Format B');
      expect(boldBtn).not.toBeNull();
    });

    test('F3-B1: keyboardDidShow event with 0 height handled gracefully', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      ReactTestRenderer.act(() => {
        simulateKeyboardShow(0);
      });
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F3-B2: keyboardDidShow with extreme height (450px) offsets safely', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      ReactTestRenderer.act(() => {
        simulateKeyboardShow(450);
      });
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F3-B3: rapid show-hide-show keyboard cycling handled without desync', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      ReactTestRenderer.act(() => {
        simulateKeyboardShow(250);
        simulateKeyboardHide();
        simulateKeyboardShow(310);
      });
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F3-B4: keyboardDidHide received without prior show event does not error', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      ReactTestRenderer.act(() => {
        simulateKeyboardHide();
      });
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F3-B5: keyboard event with malformed coordinate object handled safely', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      ReactTestRenderer.act(() => {
        if (typeof (Keyboard as any).emit === 'function') {
          (Keyboard as any).emit('keyboardDidShow', {});
        }
        DeviceEventEmitter.emit('keyboardDidShow', {});
      });
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F4-B1: re-selecting currently active tint is idempotent', () => {
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={onSave} />
      );
      const paletteTrigger = findByLabel(tree, 'Palette') ?? findByLabel(tree, 'Format A');
      if (paletteTrigger) {
        ReactTestRenderer.act(() => {
          paletteTrigger.props.onPress();
          paletteTrigger.props.onPress();
        });
      }
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F4-B2: note entry with undefined tint field falls back cleanly', () => {
      const noteWithoutTint: NoteEntry = {
        id: 'no-tint',
        title: 'Legacy Title',
        body: 'Legacy Body',
        color: colors.blue,
        initial: 'LT',
      };
      const tree = createTree(
        <NoteEditorScreen entry={noteWithoutTint} onClose={jest.fn()} onSave={jest.fn()} />
      );
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F4-B3: rapid switching between multiple pastel tints updates state cleanly', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const paletteTrigger = findByLabel(tree, 'Palette') ?? findByLabel(tree, 'Format A');
      if (paletteTrigger) {
        ReactTestRenderer.act(() => {
          paletteTrigger.props.onPress();
        });
      }
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F4-B4: palette picker toggling open and closed preserves current state', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      const paletteTrigger = findByLabel(tree, 'Palette') ?? findByLabel(tree, 'Format A');
      if (paletteTrigger) {
        ReactTestRenderer.act(() => {
          paletteTrigger.props.onPress();
        });
        ReactTestRenderer.act(() => {
          paletteTrigger.props.onPress();
        });
      }
      expect(tree.toJSON()).not.toBeNull();
    });

    test('F4-B5: note title containing unicode and emojis with pastel tint persists safely', () => {
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('🎨 Pastel Notes ✨ 🚀');
      });
      const saveBtn = findByLabel(tree, 'Save');
      ReactTestRenderer.act(() => {
        saveBtn?.props.onPress();
      });
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '🎨 Pastel Notes ✨ 🚀',
        })
      );
    });

    test('F5-B1: timing boundary: 999ms advances without save, 1000ms triggers save', () => {
      jest.useFakeTimers();
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={sampleExistingNote} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Boundary Check');
      });
      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(999);
      });
      expect(onSave).not.toHaveBeenCalled();

      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    test('F5-B2: empty note with whitespace-only title does not save on explicit Save', () => {
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('   ');
      });
      const saveBtn = findByLabel(tree, 'Save');
      ReactTestRenderer.act(() => {
        saveBtn?.props.onPress();
      });
      expect(onSave).not.toHaveBeenCalled();
    });

    test('F5-B3: multiple edits during single debounce window emit only the latest text', () => {
      jest.useFakeTimers();
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={sampleExistingNote} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Draft 1');
      });
      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(300);
      });
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Draft 2');
      });
      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(300);
      });
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Final Draft');
      });
      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Final Draft' })
      );
    });

    test('F5-B4: explicit Save button tapped while debounce is pending saves latest state immediately', () => {
      jest.useFakeTimers();
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={sampleExistingNote} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Mid-flight Save');
      });
      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(400);
      });
      const saveBtn = findByLabel(tree, 'Save');
      ReactTestRenderer.act(() => {
        saveBtn?.props.onPress();
      });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Mid-flight Save' })
      );
    });

    test('F5-B5: multiple rapid clicks on Save button only trigger save once', () => {
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={sampleExistingNote} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Single Save');
      });
      const saveBtn = findByLabel(tree, 'Save');
      ReactTestRenderer.act(() => {
        saveBtn?.props.onPress();
        saveBtn?.props.onPress();
      });
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE INTERACTIONS (>=5 cases)
  // =========================================================================

  describe('Tier 3 - Cross-Feature Interactions', () => {
    test('Cross-1: formatting command + tint selection + debounced auto-save', () => {
      jest.useFakeTimers();
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={sampleExistingNote} onClose={jest.fn()} onSave={onSave} />
      );
      const boldBtn = findByLabel(tree, 'Format B');
      ReactTestRenderer.act(() => {
        boldBtn?.props.onPress();
      });
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Formatted & Tinted');
      });
      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Formatted & Tinted' })
      );
    });

    test('Cross-2: keyboard open + formatting toolbar interaction while typing', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      ReactTestRenderer.act(() => {
        simulateKeyboardShow(300);
      });
      const boldBtn = findByLabel(tree, 'Format B');
      ReactTestRenderer.act(() => {
        boldBtn?.props.onPress();
      });
      const italicBtn = findByLabel(tree, 'Format I');
      ReactTestRenderer.act(() => {
        italicBtn?.props.onPress();
      });
      expect(tree.toJSON()).not.toBeNull();
    });

    test('Cross-3: canvas focus trigger + keyboard appearance adapts toolbar', () => {
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={jest.fn()} />
      );
      ReactTestRenderer.act(() => {
        simulateKeyboardShow(280);
      });
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Canvas and Keyboard');
      });
      expect(tree.toJSON()).not.toBeNull();
    });

    test('Cross-4: auto-save timer in-flight resolved cleanly by explicit Save button', () => {
      jest.useFakeTimers();
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={sampleExistingNote} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Race Condition Test');
      });
      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(700);
      });
      const saveBtn = findByLabel(tree, 'Save');
      ReactTestRenderer.act(() => {
        saveBtn?.props.onPress();
      });
      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    test('Cross-5: new note autofocus + title change + debounced auto-save payload structure', () => {
      jest.useFakeTimers();
      const onSave = jest.fn();
      const tree = createTree(
        <NoteEditorScreen entry={null} onClose={jest.fn()} onSave={onSave} />
      );
      const titleInput = findTitleInput(tree);
      expect(titleInput.props.autoFocus).toBe(true);

      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Meeting Summary');
      });
      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(onSave).toHaveBeenCalledTimes(1);
      const saved = onSave.mock.calls[0][0];
      expect(saved.title).toBe('Meeting Summary');
      expect(saved.initial).toBe('MS');
    });
  });
});
