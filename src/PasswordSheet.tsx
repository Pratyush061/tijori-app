import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
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

import Clipboard from '@react-native-clipboard/clipboard';
import { Icon } from './components';
import type { PasswordEntry } from './data';
import { colors, radius, space } from './theme';

const CATEGORIES = [
  'Email',
  'Banking',
  'Social',
  'Work',
  'Government / ID',
  'Shopping',
  'Other',
];

const SCREEN_HEIGHT = Dimensions.get('window').height;
// The sheet is free to drag. Pulled above FULL_THRESHOLD it settles to full
// screen; released below DISMISS_THRESHOLD it slides away; in between it stays
// where the finger left it.
const MIN_SHEET_HEIGHT = 160;
const DEFAULT_SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.72);
const FULL_THRESHOLD = SCREEN_HEIGHT * 0.9;
const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.25;

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
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const sheetHeight = useRef(new Animated.Value(DEFAULT_SHEET_HEIGHT)).current;
  const dragStartHeight = useRef(DEFAULT_SHEET_HEIGHT);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        sheetHeight.stopAnimation(value => {
          dragStartHeight.current = value;
        });
      },
      onPanResponderMove: (_, g) => {
        const next = Math.min(
          SCREEN_HEIGHT,
          Math.max(MIN_SHEET_HEIGHT, dragStartHeight.current - g.dy),
        );
        sheetHeight.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const released = dragStartHeight.current - g.dy;
        if (released >= FULL_THRESHOLD) {
          Animated.timing(sheetHeight, {
            toValue: SCREEN_HEIGHT,
            duration: 180,
            useNativeDriver: false,
          }).start();
        } else if (released <= DISMISS_THRESHOLD) {
          Animated.timing(sheetHeight, {
            toValue: 0,
            duration: 180,
            useNativeDriver: false,
          }).start(() => onClose());
        } else {
          Animated.timing(sheetHeight, {
            toValue: Math.min(
              SCREEN_HEIGHT,
              Math.max(MIN_SHEET_HEIGHT, released),
            ),
            duration: 120,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    setCopied(false);
    setShowPassword(false);
    if (visible) {
      sheetHeight.setValue(DEFAULT_SHEET_HEIGHT);
      dragStartHeight.current = DEFAULT_SHEET_HEIGHT;
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
  }, [visible, entry, sheetHeight]);

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
      }, 30000);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
            <View style={styles.grabberArea} {...panResponder.panHandlers}>
              <View style={styles.grabber} />
            </View>

            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.title}>
                {entry ? 'Edit Password' : 'New Password'}
              </Text>
              <TouchableOpacity
                onPress={handleSave}
                style={styles.headerButton}
              >
                <Text style={[styles.headerButtonText, { fontWeight: '600' }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.form}
              showsVerticalScrollIndicator={false}
            >
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
                  style={[styles.deleteButton, { marginTop: space.md }]}
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
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={onDelete}
                >
                  <Text style={styles.deleteButtonText}>Delete Password</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Animated.View>
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
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  grabberArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  grabber: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.dim2,
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
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.pink,
  },
});
