import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';

import type { CardEntry } from './data';
import { DraggableSheet } from './DraggableSheet';
import { colors, radius, space } from './theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: Partial<CardEntry>) => void;
  onDelete?: () => void;
  entry?: CardEntry | null;
};

export function CardSheet({
  visible,
  onClose,
  onSave,
  onDelete,
  entry,
}: Props) {
  const [name, setName] = useState('');
  const [last4, setLast4] = useState('');
  const [expiry, setExpiry] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      if (entry) {
        setName(entry.name);
        setLast4(entry.last4);
        setExpiry(entry.expiry);
        setNote(entry.note || '');
      } else {
        setName('');
        setLast4('');
        setExpiry('');
        setNote('');
      }
    }
  }, [visible, entry]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name,
      last4,
      expiry,
      note,
      color: entry?.color || colors.blue,
      initial: name
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
      title={entry ? 'Edit Card' : 'New Card'}
    >
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.fieldGroup}>
          <TextInput
            style={[styles.input, styles.inputBorder]}
            placeholder="Name (e.g. Chase Sapphire)"
            placeholderTextColor={colors.dim}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, styles.inputBorder]}
            placeholder="Last 4 Digits"
            placeholderTextColor={colors.dim}
            value={last4}
            onChangeText={setLast4}
            keyboardType="number-pad"
            maxLength={4}
          />
          <TextInput
            style={styles.input}
            placeholder="Expiry (MM/YY)"
            placeholderTextColor={colors.dim}
            value={expiry}
            onChangeText={setExpiry}
          />
        </View>

        <View style={styles.fieldGroup}>
          <TextInput
            style={styles.input}
            placeholder="Note (optional)"
            placeholderTextColor={colors.dim}
            value={note}
            onChangeText={setNote}
          />
        </View>

        {entry && onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteButtonText}>Delete Card</Text>
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
    height: 44,
    paddingHorizontal: space.lg,
    fontSize: 16,
    color: colors.ink,
  },
  inputBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sep,
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
