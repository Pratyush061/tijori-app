import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';

import type { Birthday } from './data';
import { colors, radius, space } from './theme';
import { Calendar } from './Calendar';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: Partial<Birthday>) => void;
  onDelete?: () => void;
  entry?: Birthday | null;
};

export function BirthdaySheet({ visible, onClose, onSave, onDelete, entry }: Props) {
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
      initial: name.split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join(''),
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheet}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{entry ? 'Edit Birthday' : 'New Birthday'}</Text>
            <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, { fontWeight: '600' }]}>Save</Text>
            </TouchableOpacity>
          </View>

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
              <Calendar
                selectedDate={date}
                onSelectDate={setDate}
              />
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sep,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  headerButton: {
    paddingHorizontal: 8,
  },
  headerButtonText: {
    fontSize: 17,
    color: colors.blue,
  },
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
