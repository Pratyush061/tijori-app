import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { RichEditor, type RichEditorHandle, type EditorState } from './RichEditor';
import {
  colors,
  space,
  NOTE_TINTS,
  NOTE_TINT_BORDERS,
  NOTE_TINT_NAMES,
  type NoteTintKey,
} from './theme';
import type { NoteEntry } from './data';
import { Icon } from './components';

type Props = {
  entry?: NoteEntry | null;
  onClose: () => void;
  onSave: (entry: Partial<NoteEntry> & { id?: string }) => Promise<NoteEntry | string | void> | void;
  onDelete?: () => void;
};

const PALETTE = ['#111111', '#FF6B00', '#0A84FF', '#34C759', '#FF2D55', '#AF52DE'];

// Notes created before the rich-text editor are plain text. Turn their line
// breaks into <br> so they open looking the way they were written.
function toEditableHTML(body: string) {
  if (!body) return '';
  if (/<[a-z][\s\S]*>/i.test(body)) return body;
  return body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

export function NoteEditorScreen({ entry, onClose, onSave, onDelete }: Props) {

  const getInitialTint = (e?: NoteEntry | null): NoteTintKey => {
    if (e?.tint && e.tint in NOTE_TINTS) {
      return e.tint;
    }
    if (e?.color) {
      const matched = (Object.keys(NOTE_TINTS) as NoteTintKey[]).find(
        k => NOTE_TINTS[k].toLowerCase() === e.color.toLowerCase()
      );
      if (matched) return matched;
    }
    return 'default';
  };

  const [title, setTitle] = useState(entry?.title || '');
  const [, setBody] = useState(entry?.body || '');
  const [tint, setTint] = useState<NoteTintKey>(() => getInitialTint(entry));
  const [showPalette, setShowPalette] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [activeFormats, setActiveFormats] = useState<EditorState>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const editorRef = useRef<RichEditorHandle>(null);
  const titleInputRef = useRef<TextInput>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdRef = useRef<string | null>(entry?.id || null);
  const latestTitleRef = useRef(entry?.title || '');
  const latestBodyRef = useRef(entry?.body || '');
  const latestTintRef = useRef<NoteTintKey>(getInitialTint(entry));
  const hasEditsRef = useRef(false);

  // Sync ref values
  useEffect(() => {
    latestTitleRef.current = title;
  }, [title]);

  useEffect(() => {
    latestTintRef.current = tint;
  }, [tint]);

  // Keyboard height listener for floating toolbar
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const s1 = Keyboard.addListener(showEvent, e => {
      setKeyboardHeight(e.endCoordinates ? e.endCoordinates.height : 0);
    });
    const s2 = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    const s3 = Keyboard.addListener('keyboardDidShow', e => {
      setKeyboardHeight(e.endCoordinates ? e.endCoordinates.height : 0);
    });
    const s4 = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      s1.remove();
      s2.remove();
      s3.remove();
      s4.remove();
    };
  }, []);

  const isSavingRef = useRef(false);

  const performSave = async (explicitClose = false) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      const currentTitle = latestTitleRef.current.trim();
      const currentBody = editorRef.current?.getHTML() ?? latestBodyRef.current ?? '';
      const currentTint = latestTintRef.current;

      // If new note and completely empty, do not create ghost record
      if (!activeIdRef.current && !currentTitle && !currentBody.trim()) {
        if (explicitClose) {
          onClose();
        }
        return;
      }

      const resolvedTitle = currentTitle || (currentBody.trim() ? 'Untitled Note' : 'Untitled Note');

      const payload: Partial<NoteEntry> & { id?: string } = {
        id: activeIdRef.current || undefined,
        title: resolvedTitle,
        body: currentBody,
        tint: currentTint,
        color: NOTE_TINTS[currentTint] || colors.orange,
        initial:
          resolvedTitle
            .split(' ')
            .filter(Boolean)
            .map(n => n.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('') || 'N',
      };

      try {
        const res = await onSave(payload);
        if (res && typeof res === 'object' && res.id) {
          activeIdRef.current = res.id;
        } else if (typeof res === 'string') {
          activeIdRef.current = res;
        }
      } catch (e) {
        console.warn('Auto-save error', e);
      }

      if (explicitClose) {
        onClose();
      }
    } finally {
      isSavingRef.current = false;
    }
  };

  const scheduleAutoSave = () => {
    hasEditsRef.current = true;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      performSave(false);
    }, 1000);
  };

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  const handleExplicitSave = () => {
    performSave(true);
  };

  const handleBack = () => {
    if (debounceTimerRef.current || hasEditsRef.current) {
      performSave(true);
    } else {
      onClose();
    }
  };

  const run = (command: string, value?: string) => {
    if (command === 'bold') {
      setActiveFormats(prev => ({ ...prev, bold: !prev.bold }));
    } else if (command === 'italic') {
      setActiveFormats(prev => ({ ...prev, italic: !prev.italic }));
    } else if (command === 'underline') {
      setActiveFormats(prev => ({ ...prev, underline: !prev.underline }));
    } else if (command === 'strikeThrough') {
      setActiveFormats(prev => ({ ...prev, strikeThrough: !prev.strikeThrough }));
    }
    editorRef.current?.exec(command, value);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const currentBg = NOTE_TINTS[tint] || NOTE_TINTS.default;

  return (
    <View style={[styles.container, { backgroundColor: currentBg }]}>
      {/* Clean Single-Row Header */}
      <View style={[styles.header, { backgroundColor: currentBg }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Icon name="chevron" color={colors.ink} size={22} />
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <TouchableOpacity
            onPress={() => setShowPalette(v => !v)}
            style={styles.paletteTrigger}
            accessibilityRole="button"
            accessibilityLabel="Palette"
            testID="palette-button"
            hitSlop={8}
          >
            <View
              style={[
                styles.paletteIndicator,
                {
                  backgroundColor: currentBg,
                  borderColor: NOTE_TINT_BORDERS[tint] || colors.sep,
                },
              ]}
            />
            <Text style={styles.paletteLabel}>{NOTE_TINT_NAMES[tint]}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          {entry && onDelete ? (
            <TouchableOpacity
              onPress={confirmDelete}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Delete"
              hitSlop={8}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={handleExplicitSave}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Save"
            hitSlop={8}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pastel Swatch Picker */}
      {showPalette && (
        <View
          style={[styles.paletteRow, { backgroundColor: currentBg }]}
          accessibilityLabel="Palette Picker"
          testID="palette-picker"
        >
          {(['default', 'mint', 'lemon', 'peach', 'sky', 'lavender'] as NoteTintKey[]).map(t => {
            const name = NOTE_TINT_NAMES[t];
            const isSelected = tint === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => {
                  setTint(t);
                  latestTintRef.current = t;
                  scheduleAutoSave();
                }}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: NOTE_TINTS[t],
                    borderColor: NOTE_TINT_BORDERS[t],
                  },
                  isSelected && styles.swatchSelected,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Select tint ${name}`}
                testID={`tint-${t}`}
              >
                {isSelected && <View style={styles.swatchCheck} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Note Title Input with Auto-focus */}
      <TextInput
        ref={titleInputRef}
        style={[styles.titleInput, { backgroundColor: currentBg }]}
        placeholder="Note Title"
        placeholderTextColor={colors.dim}
        value={title}
        autoFocus={!entry}
        onChangeText={newTitle => {
          setTitle(newTitle);
          latestTitleRef.current = newTitle;
          scheduleAutoSave();
        }}
      />

      {/* Full-Height Canvas & Editor Wrap */}
      <View style={[styles.editorWrap, { backgroundColor: currentBg }]}>
        <RichEditor
          ref={editorRef}
          initialHTML={toEditableHTML(entry?.body || '')}
          accent={colors.orange}
          backgroundColor={currentBg}
          onChange={newBody => {
            setBody(newBody);
            latestBodyRef.current = newBody;
            scheduleAutoSave();
          }}
          onStateChange={setActiveFormats}
        />
      </View>

      {/* ForeColor Palette Row */}
      {showColors && (
        <View style={[styles.colorRow, { backgroundColor: currentBg }]}>
          {PALETTE.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => {
                run('foreColor', c);
                setShowColors(false);
              }}
              style={[styles.fontSwatch, { backgroundColor: c }]}
              accessibilityLabel={`Text colour ${c}`}
            />
          ))}
        </View>
      )}

      {/* Keyboard-Adaptive Floating Toolbar */}
      <View
        style={[styles.toolbar, { bottom: keyboardHeight }]}
        accessibilityLabel="Formatting Toolbar"
        testID="formatting-toolbar"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
          keyboardShouldPersistTaps="always"
        >
          <ToolButton
            label="B"
            bold
            isActive={!!activeFormats.bold}
            style={[styles.toolButton, activeFormats.bold ? styles.toolButtonActive : null]}
            accessibilityLabel="Format B"
            testID="format-bold"
            onPress={() => run('bold')}
          />
          <ToolButton
            label="I"
            italic
            isActive={!!activeFormats.italic}
            style={[styles.toolButton, activeFormats.italic ? styles.toolButtonActive : null]}
            accessibilityLabel="Format I"
            testID="format-italic"
            onPress={() => run('italic')}
          />
          <ToolButton
            label="U"
            underline
            isActive={!!activeFormats.underline}
            style={[styles.toolButton, activeFormats.underline ? styles.toolButtonActive : null]}
            accessibilityLabel="Format U"
            testID="format-underline"
            onPress={() => run('underline')}
          />
          <ToolButton
            label="S"
            strike
            isActive={!!activeFormats.strikeThrough}
            style={[styles.toolButton, activeFormats.strikeThrough ? styles.toolButtonActive : null]}
            accessibilityLabel="Format S"
            testID="format-strike"
            onPress={() => run('strikeThrough')}
          />
          <Divider />
          <ToolButton label="A-" onPress={() => run('fontSize', '2')} />
          <ToolButton label="A+" onPress={() => run('fontSize', '5')} />
          <ToolButton
            label="H1"
            isActive={activeFormats.formatBlock === 'h1'}
            onPress={() => run('formatBlock', '<h1>')}
          />
          <ToolButton
            label="H2"
            isActive={activeFormats.formatBlock === 'h2'}
            onPress={() => run('formatBlock', '<h2>')}
          />
          <ToolButton
            label="¶"
            isActive={activeFormats.formatBlock === 'p'}
            onPress={() => run('formatBlock', '<p>')}
          />
          <Divider />
          <ToolButton
            label="•"
            isActive={!!activeFormats.insertUnorderedList}
            onPress={() => run('insertUnorderedList')}
          />
          <ToolButton
            label="1."
            isActive={!!activeFormats.insertOrderedList}
            onPress={() => run('insertOrderedList')}
          />
          <ToolButton
            label="❝"
            isActive={activeFormats.formatBlock === 'blockquote'}
            onPress={() => run('formatBlock', '<blockquote>')}
          />
          <ToolButton
            label="</>"
            isActive={activeFormats.formatBlock === 'pre'}
            onPress={() => run('formatBlock', '<pre>')}
          />
          <Divider />
          <ToolButton
            label="A"
            color={colors.orange}
            onPress={() => setShowColors(v => !v)}
          />
        </ScrollView>
      </View>
    </View>
  );
}

function ToolButton({
  label,
  onPress,
  bold,
  italic,
  underline,
  strike,
  color,
  isActive,
  accessibilityLabel,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  isActive?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.toolButton,
        isActive ? styles.toolButtonActive : null,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `Format ${label}`}
      testID={testID}
    >
      <Text
        style={[
          styles.toolButtonText,
          color ? { color } : null,
          bold ? styles.bold : null,
          italic ? styles.italic : null,
          underline ? styles.underline : null,
          strike ? styles.strike : null,
          isActive ? styles.toolButtonTextActive : null,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sep,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.xs,
  },
  headerButtonText: {
    fontSize: 17,
    color: colors.ink,
  },
  paletteTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  paletteIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  paletteLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
  },
  deleteButtonText: {
    fontSize: 17,
    color: colors.pink,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.blue,
  },
  paletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sep,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  swatchCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ink,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
    color: colors.ink,
  },
  editorWrap: {
    flex: 1,
    minHeight: 100,
  },
  colorRow: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.sep,
  },
  fontSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  toolbar: {
    position: 'relative',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.sep,
    backgroundColor: colors.bg,
  },
  toolbarContent: {
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.xs,
  },
  toolButton: {
    minWidth: 40,
    height: 38,
    paddingHorizontal: space.sm,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  toolButtonActive: {
    backgroundColor: colors.ink,
  },
  toolButtonText: {
    fontSize: 16,
    color: colors.ink,
  },
  toolButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
  strike: { textDecorationLine: 'line-through' },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: colors.sep,
    marginHorizontal: space.xs,
  },
});
