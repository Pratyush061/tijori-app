import React, { useEffect, useState } from 'react';
import {
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
import { DraggableSheet, SheetScrollView } from './DraggableSheet';
import { randomInt } from './storage/crypto';
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

  const [genVisible, setGenVisible] = useState(false);
  const [genLength, setGenLength] = useState(16);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

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
      setGenVisible(false);
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

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const syms = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let charset = chars;
    if (genNumbers) charset += nums;
    if (genSymbols) charset += syms;

    const pick = (set: string) => set[randomInt(set.length)];

    let newPassword = '';
    if (genNumbers) newPassword += pick(nums);
    if (genSymbols) newPassword += pick(syms);

    for (let i = newPassword.length; i < genLength; i++) {
      newPassword += pick(charset);
    }

    // Fisher-Yates shuffle over a secure source, so the guaranteed character
    // classes do not end up in a predictable order.
    const charsArr = newPassword.split('');
    for (let i = charsArr.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      const tmp = charsArr[i];
      charsArr[i] = charsArr[j];
      charsArr[j] = tmp;
    }
    setPassword(charsArr.join(''));
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return null;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score < 3) return { label: 'Weak', percent: '33%', color: colors.pink };
    if (score < 5) return { label: 'Fair', percent: '66%', color: colors.orange };
    return { label: 'Strong', percent: '100%', color: colors.green };
  };

  const strength = getPasswordStrength(password);

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
      <SheetScrollView style={styles.form} showsVerticalScrollIndicator={false}>
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
          {strength && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBarBg}>
                <View style={[styles.strengthBarFill, { width: strength.percent as any, backgroundColor: strength.color }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.genToggle} onPress={() => setGenVisible(!genVisible)}>
            <Text style={styles.genToggleText}>{genVisible ? 'Hide Generator' : 'Generate Password'}</Text>
          </TouchableOpacity>

          {genVisible && (
            <View style={styles.genSettings}>
              <View style={styles.genRow}>
                <Text style={styles.genLabel}>Length: {genLength}</Text>
                <View style={styles.genControls}>
                  <TouchableOpacity style={styles.genBtn} onPress={() => setGenLength(Math.max(12, genLength - 1))}>
                    <Text style={styles.genBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.genBtn} onPress={() => setGenLength(Math.min(32, genLength + 1))}>
                    <Text style={styles.genBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.genRow}>
                <Text style={styles.genLabel}>Numbers</Text>
                <Switch value={genNumbers} onValueChange={setGenNumbers} trackColor={{ true: colors.green }} />
              </View>
              <View style={styles.genRow}>
                <Text style={styles.genLabel}>Symbols</Text>
                <Switch value={genSymbols} onValueChange={setGenSymbols} trackColor={{ true: colors.green }} />
              </View>
              <TouchableOpacity style={styles.genAction} onPress={generatePassword}>
                <Text style={styles.genActionText}>Generate & Fill</Text>
              </TouchableOpacity>
            </View>
          )}
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
      </SheetScrollView>
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
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.sep,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.sep,
    borderRadius: 2,
    marginRight: space.md,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 45,
    textAlign: 'right',
  },
  genToggle: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.sep,
  },
  genToggleText: {
    fontSize: 15,
    color: colors.blue,
    fontWeight: '500',
  },
  genSettings: {
    backgroundColor: colors.bg,
    padding: space.md,
    borderBottomLeftRadius: radius.inset,
    borderBottomRightRadius: radius.inset,
  },
  genRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  genLabel: {
    fontSize: 15,
    color: colors.ink,
  },
  genControls: {
    flexDirection: 'row',
    gap: space.sm,
  },
  genBtn: {
    backgroundColor: colors.card,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  genBtnText: {
    fontSize: 18,
    color: colors.ink,
    fontWeight: '500',
  },
  genAction: {
    backgroundColor: colors.blue,
    borderRadius: radius.inset,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: space.sm,
  },
  genActionText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
