import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Icon } from './components';
import { Keypad, PasscodeDots } from './PasscodeKeypad';
import { initializeVault } from './storage/secureStore';
import { colors, space } from './theme';

const MIN_LENGTH = 4;
const MAX_LENGTH = 8;

/**
 * First-run screen: the user chooses the passcode that protects the vault.
 * The first submit is deliberately synchronous and only advances the UI.
 * Key derivation/storage runs only after the second, matching entry.
 */
export function PasscodeSetupScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [first, setFirst] = useState('');
  const [entry, setEntry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onDigit = (digit: string) => {
    setError(null);
    setEntry(prev => (prev.length < MAX_LENGTH ? prev + digit : prev));
  };

  const onBackspace = () => {
    setError(null);
    setEntry(prev => prev.slice(0, -1));
  };

  const finishSetup = async (passcode: string) => {
    setBusy(true);
    try {
      await initializeVault(passcode);
      onDone();
    } catch {
      setBusy(false);
      setError('Could not set up the vault. Please try again.');
    }
  };

  const onEnter = () => {
    if (busy) return;

    if (entry.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} digits.`);
      return;
    }

    // Do not perform crypto or storage on the first submit. Advance straight
    // to confirmation so the transition is immediate and obvious.
    if (step === 'create') {
      setFirst(entry);
      setEntry('');
      setError(null);
      setStep('confirm');
      return;
    }

    if (entry !== first) {
      setError('The passcodes did not match. Start again.');
      setFirst('');
      setEntry('');
      setStep('create');
      return;
    }

    void finishSetup(first);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <View style={styles.badge}>
          <Icon name="lock" size={34} color={colors.goldDark} strokeWidth={1.5} />
        </View>
        <Text style={styles.brand}>Tijori</Text>
        <Text
          accessibilityLiveRegion="polite"
          style={styles.step}
        >
          {step === 'create' ? 'STEP 1 OF 2' : 'STEP 2 OF 2'}
        </Text>
        <Text accessibilityLiveRegion="polite" style={styles.title}>
          {step === 'create' ? 'Create a passcode' : 'Confirm your passcode'}
        </Text>
        <Text style={styles.caption}>
          {step === 'create'
            ? 'Choose 4–8 digits, then tap ✓ to continue.'
            : 'Enter the same digits once more, then tap ✓.'}
        </Text>

        <PasscodeDots filled={entry.length} error={!!error} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator color={colors.gold} />
            <Text style={styles.busyText}>Securing your vault…</Text>
          </View>
        ) : null}
      </View>

      <Keypad
        onDigit={onDigit}
        onBackspace={onBackspace}
        onEnter={onEnter}
        enterEnabled={entry.length >= MIN_LENGTH}
        disabled={busy}
      />

      <Text style={styles.hint}>
        There is no recovery. If you forget this passcode, your saved data
        cannot be read.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: space.xl,
    paddingBottom: space.lg,
    backgroundColor: colors.bg,
  },
  top: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(185,138,46,0.28)',
  },
  brand: {
    fontSize: 30,
    fontWeight: '600',
    color: colors.goldDark,
    marginTop: space.md,
  },
  step: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.goldDark,
    marginTop: space.lg,
  },
  title: {
    fontSize: 19,
    fontWeight: '600',
    color: colors.ink,
    marginTop: space.sm,
  },
  caption: {
    fontSize: 14,
    color: colors.dim,
    marginTop: 4,
    textAlign: 'center',
  },
  error: {
    fontSize: 13,
    color: colors.pink,
    marginTop: space.sm,
    textAlign: 'center',
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.sm,
  },
  busyText: {
    fontSize: 13,
    color: colors.dim,
  },
  hint: {
    fontSize: 12.5,
    color: colors.dim,
    textAlign: 'center',
    marginTop: space.xl,
    paddingHorizontal: space.xl,
    lineHeight: 18,
  },
});
