import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Calendar } from './Calendar';
import type { Birthday } from './data';
import { DraggableSheet } from './DraggableSheet';
import { colors, radius, space } from './theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: Partial<Birthday>) => void;
  onDelete?: () => void;
  entry?: Birthday | null;
};

export function BirthdaySheet({
  visible,
  onClose,
  onSave,
  onDelete,
  entry,
}: Props) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(''); // YYYY-MM-DD
  const [includeYear, setIncludeYear] = useState(true);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      if (entry) {
        setName(entry.name);
        setDate(entry.date);
        setIncludeYear(entry.includeYear ?? true);
        setNote(entry.note || '');
      } else {
        setName('');
        setDate(new Date().toISOString().slice(0, 10)); // Default to today
        setIncludeYear(true);
        setNote('');
      }
    }
  }, [visible, entry]);

  const handleSave = () => {
    if (!name.trim() || !date) return;
    onSave({
      name,
      date,
      includeYear,
      note,
      color: entry?.color || colors.pink, // use pink as default for bdays
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
      title={entry ? 'Edit Birthday' : 'New Birthday'}
    >
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.fieldGroup}>
          <TextInput
            style={[styles.input, styles.inputBorder]}
            placeholder="Name"
            placeholderTextColor={colors.dim}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Calendar selectedDate={date} onSelectDate={setDate} />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Include Year</Text>
            <Switch
              value={includeYear}
              onValueChange={setIncludeYear}
              trackColor={{ true: colors.green }}
            />
          </View>
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
            <Text style={styles.deleteButtonText}>Delete Birthday</Text>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: space.lg,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.ink,
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
