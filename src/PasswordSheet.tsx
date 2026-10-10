import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
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
// The sheet is a full-height panel that we slide down with a transform (cheap,
// smooth) rather than resizing its height (expensive, janky). REST_TRANSLATE
// leaves ~72% of the screen visible on open; dragged up past FULL_AT it settles
// to full screen; released past DISMISS_AT it slides away and closes.
const REST_TRANSLATE = Math.round(SCREEN_HEIGHT * 0.28);
const FULL_AT = SCREEN_HEIGHT * 0.06;
const DISMISS_AT = SCREEN_HEIGHT * 0.75;
const SNAP_MS = 220;

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

  const translateY = useRef(new Animated.Value(REST_TRANSLATE)).current;
  const dragStart = useRef(REST_TRANSLATE);
  const currentY = useRef(REST_TRANSLATE);

  const settle = (to: number, after?: () => void) => {
    currentY.current = to;
    Animated.timing(translateY, {
      toValue: to,
      duration: SNAP_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && after) {
        after();
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        translateY.stopAnimation(value => {
          dragStart.current = value;
          currentY.current = value;
        });
      },
      onPanResponderMove: (_, g) => {
        const next = Math.min(
          SCREEN_HEIGHT,
          Math.max(0, dragStart.current + g.dy),
        );
        currentY.current = next;
        translateY.setValue(next);
      },
      onPanResponderRelease: () => {
        const y = currentY.current;
        if (y <= FULL_AT) {
          settle(0);
        } else if (y >= DISMISS_AT) {
          settle(SCREEN_HEIGHT, onClose);
        } else {
          settle(y);
        }
      },
    }),
  ).current;

  useEffect(() => {
    setCopied(false);
    setShowPassword(false);
    if (visible) {
      translateY.setValue(REST_TRANSLATE);
      dragStart.current = REST_TRANSLATE;
      currentY.current = REST_TRANSLATE;
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
  }, [visible, entry, translateY]);

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
          <Animated.View
            style={[
              styles.sheet,
              { height: SCREEN_HEIGHT, transform: [{ translateY }] },
            ]}
          >
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
                <Text
                  style={[styles.headerButtonText, styles.headerButtonStrong]}
                >
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
  headerButtonStrong: {
    fontWeight: '600',
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
  copyButton: {
    marginTop: space.md,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.pink,
  },
});
