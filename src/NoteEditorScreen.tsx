import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Text,
} from 'react-native';
import {
  RichText,
  Toolbar,
  useEditorBridge,
  TenTapStartKit,
  CoreBridge,
} from '@10play/tentap-editor';
import { colors, space } from './theme';
import type { NoteEntry } from './data';
import { Icon } from './components';

type Props = {
  entry?: NoteEntry | null;
  onClose: () => void;
  onSave: (entry: Partial<NoteEntry>) => void;
  onDelete?: () => void;
};

export function NoteEditorScreen({ entry, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(entry?.title || '');

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: entry?.body || '',
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge,
    ],
  });

  const handleSave = async () => {
    if (!title.trim()) return;
    const content = await editor.getHTML();

    onSave({
      title,
      body: content,
      color: entry?.color || colors.orange,
      initial: title
        .split(' ')
        .map(n => n.charAt(0).toUpperCase())
        .slice(0, 2)
        .join(''),
    });
    onClose();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Icon name="chevron" color={colors.ink} size={24} />
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>

        {entry && onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.headerButton}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.titleInput}
        placeholder="Note Title"
        placeholderTextColor={colors.dim}
        value={title}
        onChangeText={setTitle}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.editorContainer}
      >
        <RichText editor={editor} />
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sep,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  headerButtonText: {
    fontSize: 17,
    color: colors.ink,
  },
  deleteButtonText: {
    fontSize: 17,
    color: colors.pink,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: space.lg,
    color: colors.ink,
  },
  editorContainer: {
    flex: 1,
  },
});
