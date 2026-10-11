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
 * Entry is on an in-app keypad, so nothing is ever hidden behind a system
 * keyboard. The passcode is the only key, and there is no recovery, so the
 * copy says so plainly.
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

  const onEnter = async () => {
    if (busy) return;
    if (entry.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} digits.`);
      return;
    }
    if (step === 'create') {
      setFirst(entry);
      setEntry('');
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
    setBusy(true);
    try {
      await initializeVault(first);
      onDone();
    } catch {
      setBusy(false);
      setError('Could not set up the vault. Please try again.');
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <View style={styles.badge}>
          <Icon name="lock" size={34} color={colors.goldDark} strokeWidth={1.5} />
        </View>
        <Text style={styles.brand}>Tijori</Text>
        <Text style={styles.title}>
          {step === 'create' ? 'Create a passcode' : 'Confirm your passcode'}
        </Text>
        <Text style={styles.caption}>
          {step === 'create'
            ? 'This passcode is the only key to your vault.'
            : 'Enter it once more to be sure.'}
        </Text>

        <PasscodeDots filled={entry.length} error={!!error} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {busy ? <ActivityIndicator color={colors.gold} style={styles.busy} /> : null}
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
  title: {
    fontSize: 19,
    fontWeight: '600',
    color: colors.ink,
    marginTop: space.lg,
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
  busy: {
    marginTop: space.sm,
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
