import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, space } from './theme';

/**
 * An in-app passcode keypad.
 *
 * The system number-pad keyboard is unusable for a passcode gate: on Android
 * it has no Enter/Done key, and it covers any button near the bottom of the
 * screen, so the user can type a passcode and never be able to submit it. An
 * in-app keypad removes the keyboard entirely, which both fixes that and gives
 * the calm, precise feel of a system passcode screen.
 */

export function PasscodeDots({
  filled,
  total = 6,
  error,
}: {
  filled: number;
  total?: number;
  error?: boolean;
}) {
  const slots = Math.max(total, filled);
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: slots }).map((_, i) => {
        const on = i < filled;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              on && styles.dotFilled,
              on && error ? styles.dotError : null,
            ]}
          />
        );
      })}
    </View>
  );
}

type KeypadProps = {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  enterEnabled: boolean;
  disabled?: boolean;
};

function Key({
  label,
  onPress,
  disabled,
  variant,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'muted' | 'primary';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.key,
        variant === 'primary' && styles.keyPrimary,
        pressed && !disabled && styles.keyPressed,
        disabled && styles.keyDisabled,
      ]}
    >
      <Text
        style={[
          styles.keyText,
          variant === 'muted' && styles.keyTextMuted,
          variant === 'primary' && styles.keyTextPrimary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Keypad({
  onDigit,
  onBackspace,
  onEnter,
  enterEnabled,
  disabled,
}: KeypadProps) {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];
  return (
    <View style={styles.pad}>
      {rows.map(row => (
        <View key={row.join('')} style={styles.padRow}>
          {row.map(k => (
            <Key key={k} label={k} onPress={() => onDigit(k)} disabled={disabled} />
          ))}
        </View>
      ))}
      <View style={styles.padRow}>
        <Key
          label="⌫"
          variant="muted"
          onPress={onBackspace}
          disabled={disabled}
        />
        <Key label="0" onPress={() => onDigit('0')} disabled={disabled} />
        <Key
          label="✓"
          variant="primary"
          onPress={onEnter}
          disabled={disabled || !enterEnabled}
        />
      </View>
    </View>
  );
}

const KEY = 74;

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: space.xl,
    marginBottom: space.xl,
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.dim2,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  dotError: {
    backgroundColor: colors.pink,
    borderColor: colors.pink,
  },
  pad: {
    width: KEY * 3 + 24 * 2,
    gap: 18,
  },
  padRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  key: {
    width: KEY,
    height: KEY,
    borderRadius: KEY / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(118,118,128,0.10)',
  },
  keyPrimary: {
    backgroundColor: colors.ink,
  },
  keyPressed: {
    opacity: 0.55,
  },
  keyDisabled: {
    opacity: 0.35,
  },
  keyText: {
    fontSize: 30,
    fontWeight: '400',
    color: colors.ink,
  },
  keyTextMuted: {
    fontSize: 24,
    color: colors.dim,
  },
  keyTextPrimary: {
    fontSize: 26,
    color: '#FFFFFF',
  },
});
