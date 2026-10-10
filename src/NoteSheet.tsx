import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';

import type { NoteEntry } from './data';
import { DraggableSheet } from './DraggableSheet';
import { colors, radius, space } from './theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: Partial<NoteEntry>) => void;
  onDelete?: () => void;
  entry?: NoteEntry | null;
};

export function NoteSheet({
  visible,
  onClose,
  onSave,
  onDelete,
  entry,
}: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (visible) {
      if (entry) {
        setTitle(entry.title);
        setBody(entry.body);
      } else {
        setTitle('');
        setBody('');
      }
    }
  }, [visible, entry]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title,
      body,
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
    <DraggableSheet
      visible={visible}
      onClose={onClose}
      onSave={handleSave}
      title={entry ? 'Edit Note' : 'New Note'}
    >
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.fieldGroup}>
          <TextInput
            style={[styles.input, styles.inputBorder]}
            placeholder="Title"
            placeholderTextColor={colors.dim}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Note body..."
            placeholderTextColor={colors.dim}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
        </View>

        {entry && onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteButtonText}>Delete Note</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </DraggableSheet>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: space.md,
  },
  fieldGroup: {
    backgroundColor: colors.card,
    borderRadius: radius.inset,
    marginBottom: space.md,
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: space.lg,
    fontSize: 16,
    color: colors.ink,
  },
  inputBorder: {
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sep,
  },
  textArea: {
    minHeight: 120,
    paddingVertical: space.md,
  },
  deleteButton: {
    backgroundColor: colors.card,
    borderRadius: radius.inset,
    padding: 14,
    alignItems: 'center',
    marginTop: space.lg,
    marginBottom: space.xl * 2,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.pink,
  },
});
