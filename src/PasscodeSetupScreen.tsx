import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateSalt, hashPasscode, getSupportedBiometry, enableBiometricAuth } from './storage/encryption';
import { useTheme } from './ThemeContext';
import { space, radius } from './theme';

export function PasscodeSetupScreen({ onComplete }: { onComplete: () => void }) {
  const { colors } = useTheme();
  const [step, setStep] = useState<'create' | 'confirm' | 'hint' | 'biometric'>('create');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [hint, setHint] = useState('');
  const [biometryType, setBiometryType] = useState<string | null>(null);

  React.useEffect(() => {
    getSupportedBiometry().then(type => {
      setBiometryType(type);
    });
  }, []);

  const handleNext = async () => {
    if (step === 'create') {
      if (passcode.length >= 4) setStep('confirm');
    } else if (step === 'confirm') {
      if (passcode === confirmPasscode) {
        setStep('hint');
      } else {
        Alert.alert('Error', 'Passcodes do not match.');
        setConfirmPasscode('');
      }
    } else if (step === 'hint') {
      // Save passcode
      const salt = generateSalt();
      const hash = hashPasscode(passcode, salt);
      await AsyncStorage.setItem('tijori_passcode_salt', salt);
      await AsyncStorage.setItem('tijori_passcode_hash', hash);
      if (hint) await AsyncStorage.setItem('tijori_passcode_hint', hint);

      await AsyncStorage.setItem('tijori_has_passcode', 'true');

      if (biometryType) {
        setStep('biometric');
      } else {
        onComplete();
      }
    } else if (step === 'biometric') {
      onComplete();
    }
  };

  const enableBiometrics = async () => {
    await enableBiometricAuth();
    await AsyncStorage.setItem('tijori_biometric_enabled', 'true');
    onComplete();
  };

  if (step === 'biometric') {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Enable Biometrics</Text>
        <Text style={[styles.subtitle, { color: colors.dim }]}>
          Unlock Tijori with {biometryType} for faster access.
        </Text>
        <TouchableOpacity style={styles.button} onPress={enableBiometrics}>
          <Text style={styles.buttonText}>Enable {biometryType}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={onComplete}>
          <Text style={[styles.skipButtonText, { color: colors.dim }]}>Not now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.ink }]}>
        {step === 'create' ? 'Create a Passcode' : step === 'confirm' ? 'Confirm Passcode' : 'Add a Hint'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.dim }]}>
        {step === 'hint' ? 'Optional hint in case you forget it.' : '4-6 digits to secure your vault.'}
      </Text>

      {step === 'hint' ? (
        <TextInput
          style={[styles.input, { color: colors.ink, borderColor: colors.sep }]}
          placeholder="Passcode hint"
          placeholderTextColor={colors.dim}
          value={hint}
          onChangeText={setHint}
        />
      ) : (
        <TextInput
          style={[styles.input, { color: colors.ink, borderColor: colors.sep }]}
          placeholder="Passcode"
          placeholderTextColor={colors.dim}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
          value={step === 'create' ? passcode : confirmPasscode}
          onChangeText={step === 'create' ? setPasscode : setConfirmPasscode}
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>
          {step === 'hint' ? 'Done' : 'Next'}
        </Text>
      </TouchableOpacity>

      {step === 'hint' && (
        <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
          <Text style={[styles.skipButtonText, { color: colors.dim }]}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: space.xl,
    paddingTop: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: space.sm,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: space.xl * 2,
  },
  input: {
    borderBottomWidth: 1,
    fontSize: 24,
    paddingVertical: space.md,
    marginBottom: space.xl * 2,
    textAlign: 'center',
    letterSpacing: 4,
  },
  button: {
    backgroundColor: '#B98A2E',
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: space.lg,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
  }
});
