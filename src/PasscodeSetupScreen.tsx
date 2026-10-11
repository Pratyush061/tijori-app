import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Icon } from './components';
import { initializeVault } from './storage/secureStore';
import { colors, space } from './theme';

const MIN_LENGTH = 4;
const MAX_LENGTH = 8;

/**
 * First-run screen: the user chooses the passcode that protects the vault.
 * The passcode is the only key — there is no recovery — so the copy says so
 * plainly.
 */
export function PasscodeSetupScreen({ onDone }: { onDone: () => void }) {
  const [passcode, setPasscode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (passcode.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} digits.`);
      return;
    }
    if (passcode !== confirm) {
      setError('The two passcodes do not match.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await initializeVault(passcode);
      onDone();
    } catch (e) {
      setBusy(false);
      setError('Could not set up the vault. Please try again.');
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Icon name="lock" size={40} color={colors.goldDark} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>Tijori</Text>
      <Text style={styles.caption}>Create a passcode to secure your vault</Text>

      <TextInput
        style={styles.input}
        placeholder="Passcode"
        placeholderTextColor={colors.dim}
        value={passcode}
        onChangeText={text => {
          setPasscode(text);
          if (error) setError(null);
        }}
        secureTextEntry
        keyboardType="number-pad"
        maxLength={MAX_LENGTH}
        accessibilityLabel="Passcode"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm passcode"
        placeholderTextColor={colors.dim}
        value={confirm}
        onChangeText={text => {
          setConfirm(text);
          if (error) setError(null);
        }}
        secureTextEntry
        keyboardType="number-pad"
        maxLength={MAX_LENGTH}
        accessibilityLabel="Confirm passcode"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.button}
        onPress={submit}
        disabled={busy}
        accessibilityLabel="Create passcode"
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Create Vault</Text>
        )}
      </TouchableOpacity>

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
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    backgroundColor: colors.bg,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(185,138,46,0.28)',
  },
  title: {
    fontSize: 40,
    fontWeight: '600',
    color: colors.ink,
    marginTop: space.xl,
  },
  caption: {
    fontSize: 14,
    color: colors.dim,
    marginTop: 6,
    marginBottom: space.xl,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 320,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: 'center',
    color: colors.ink,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    borderRadius: 12,
    backgroundColor: 'rgba(118,118,128,0.12)',
    marginBottom: space.sm,
  },
  error: {
    fontSize: 13,
    color: colors.pink,
    marginTop: space.xs,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 320,
    marginTop: space.lg,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12.5,
    color: colors.dim,
    textAlign: 'center',
    marginTop: space.xl,
    paddingHorizontal: space.md,
    lineHeight: 18,
  },
});
