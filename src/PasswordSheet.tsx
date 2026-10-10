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
import Clipboard from '@react-native-clipboard/clipboard';

import { Icon } from './components';
import type { PasswordEntry } from './data';
import { DraggableSheet } from './DraggableSheet';
import { colors, radius, space } from './theme';

const CATEGORIES = ['Email', 'Banking', 'Social', 'Work', 'Shopping', 'Other'];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: Partial<PasswordEntry>) => void;
  onDelete?: () => void;
  entry?: PasswordEntry | null;
};

export function PasswordSheet({
  visible,
  onClose,
  onSave,
  onDelete,
  entry,
}: Props) {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [favorite, setFavorite] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
    setShowPassword(false);
    if (visible) {
      if (entry) {
        setName(entry.name);
        setSubtitle(entry.subtitle);
        setPassword(entry.password || '');
        setCategory(entry.category || CATEGORIES[0]);
        setFavorite(entry.favorite || false);
      } else {
        setName('');
        setSubtitle('');
        setPassword('');
        setCategory(CATEGORIES[0]);
        setFavorite(false);
      }
    }
  }, [visible, entry]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name,
      subtitle,
      password,
      category,
      favorite,
      color: entry?.color || colors.blue,
      initial: name.charAt(0).toUpperCase(),
    });
    onClose();
  };

  const handleCopy = () => {
    if (password) {
      Clipboard.setString(password);
      setCopied(true);
      setTimeout(() => {
        Clipboard.setString('');
        setCopied(false);
      }, 3000);
    }
  };

  return (
    <DraggableSheet
      visible={visible}
      onClose={onClose}
      onSave={handleSave}
      title={entry ? 'Edit Password' : 'New Password'}
    >
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.fieldGroup}>
          <TextInput
            style={[styles.input, styles.inputBorder]}
            placeholder="Name (e.g. Google)"
            placeholderTextColor={colors.dim}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, styles.inputBorder]}
            placeholder="Username / ID"
            placeholderTextColor={colors.dim}
            value={subtitle}
            onChangeText={setSubtitle}
            autoCapitalize="none"
          />
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Password"
              placeholderTextColor={colors.dim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon
                name="eye"
                size={20}
                color={showPassword ? colors.blue : colors.dim}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.chipsRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, category === c && styles.chipActive]}
                onPress={() => setCategory(c)}
              >
                <Text
                  style={[
                    styles.chipText,
                    category === c && styles.chipTextActive,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Favorite</Text>
            <Switch
              value={favorite}
              onValueChange={setFavorite}
              trackColor={{ true: colors.green }}
            />
          </View>
        </View>

        {entry && (
          <TouchableOpacity
            style={[styles.deleteButton, styles.copyButton]}
            onPress={handleCopy}
          >
            <Text
              style={[
                styles.deleteButtonText,
                { color: copied ? colors.green : colors.blue },
              ]}
            >
              {copied ? 'Copied!' : 'Copy Password'}
            </Text>
          </TouchableOpacity>
        )}

        {entry && onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteButtonText}>Delete Password</Text>
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
  flex: {
    flex: 1,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    paddingHorizontal: space.lg,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: colors.dim,
    textTransform: 'uppercase',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.gold,
  },
  chipText: {
    fontSize: 14,
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.goldDark,
    fontWeight: '500',
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
  },
  copyButton: {
    marginTop: space.md,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.pink,
  },
});
