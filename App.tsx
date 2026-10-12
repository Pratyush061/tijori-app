/**
 * Tijori — an Apple-style personal vault.
 *
 * @format
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  DeviceEventEmitter,
  Keyboard,
} from 'react-native';

import { Icon, TabBar } from './src/components';
import type { TabKey } from './src/components';
import {
  BirthdaysScreen,
  LockScreen,
  PasswordsScreen,
  SettingsScreen,
  VaultScreen,
  serifFont,
} from './src/screens';
import { NotesScreen } from './src/NotesScreen';
import { PasscodeSetupScreen } from './src/PasscodeSetupScreen';
import { isVaultInitialized, unlockVault, lock, getAutoLockTimeout } from './src/storage/secureStore';
import { colors, space } from './src/theme';

const TOP_INSET =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 48;

function NavBar({
  tab,
  onSettings,
  onAdd,
}: {
  tab: TabKey;
  onSettings: () => void;
  onAdd: () => void;
}) {
  if (tab === 'vault') {
    return (
      <View style={styles.nav}>
        <View style={styles.navLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>PJ</Text>
          </View>
        </View>
        <Text style={styles.brand}>Tijori</Text>
        <View style={styles.navRight}>
          <TouchableOpacity
            accessibilityLabel="Settings"
            accessibilityRole="button"
            onPress={onSettings}
          >
            <Icon name="gear" size={22} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const title =
    tab === 'passwords'
      ? 'Passwords'
      : tab === 'birthdays'
      ? 'Birthdays'
      : tab === 'notes'
      ? 'Notes'
      : 'Settings';
  const showPlus = tab !== 'settings';

  return (
    <View style={styles.nav}>
      <View style={styles.navLeft} />
      <Text style={styles.navTitle}>{title}</Text>
      <View style={styles.navRight}>
        {showPlus && tab !== 'passwords' ? (
          <TouchableOpacity
            accessibilityLabel="Add"
            accessibilityRole="button"
            onPress={onAdd}
          >
            <Icon name="plus" size={24} color={colors.ink} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function CurrentScreen({ tab }: { tab: TabKey }) {
  switch (tab) {
    case 'passwords':
      return <PasswordsScreen />;
    case 'birthdays':
      return <BirthdaysScreen />;
    case 'notes':
      return <NotesScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'vault':
    default:
      return <VaultScreen />;
  }
}

import { CardsScreen } from './src/CardsScreen';
import { DocumentsScreen } from './src/DocumentsScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type Phase = 'loading' | 'setup' | 'locked' | 'unlocked';

function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [tab, setTab] = useState<TabKey | 'passwords-health'>('vault');
  const [showCards, setShowCards] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [isNoteEditing, setIsNoteEditing] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('noteEditorVisibility', (visible: boolean) => {
      setIsNoteEditing(visible);
    });
    const lockSub = DeviceEventEmitter.addListener('vaultLock', () => {
      lock();
      setPhase('locked');
    });
    return () => {
      sub.remove();
      lockSub.remove();
    };
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const s1 = Keyboard.addListener(showEvent, () => setIsKeyboardOpen(true));
    const s2 = Keyboard.addListener(hideEvent, () => setIsKeyboardOpen(false));
    const s3 = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardOpen(true));
    const s4 = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardOpen(false));

    return () => {
      s1.remove();
      s2.remove();
      s3.remove();
      s4.remove();
    };
  }, []);

  // Decide on first render whether the vault has been set up yet, so the user
  // sees either the create-passcode screen or the unlock screen.
  useEffect(() => {
    let alive = true;
    (async () => {
      let initialized = false;
      try {
        initialized = await isVaultInitialized();
      } catch {
        // If the vault marker cannot be read, fall back to setup rather than
        // leaving the user on a blank screen.
        initialized = false;
      }
      if (alive) setPhase(initialized ? 'locked' : 'setup');
    })();
    return () => {
      alive = false;
    };
  }, []);

  const lastBackgroundTime = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (phase !== 'unlocked') return;

      const timeoutSeconds = await getAutoLockTimeout();
      if (timeoutSeconds < 0) {
        // Never auto-lock
        return;
      }

      if (nextState === 'background' || nextState === 'inactive') {
        lastBackgroundTime.current = Date.now();
        if (timeoutSeconds === 0) {
          // Immediately
          lock();
          setPhase('locked');
        }
      } else if (nextState === 'active') {
        if (lastBackgroundTime.current && timeoutSeconds > 0) {
          const elapsed = (Date.now() - lastBackgroundTime.current) / 1000;
          if (elapsed >= timeoutSeconds) {
            lock();
            setPhase('locked');
          }
        }
        lastBackgroundTime.current = null;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [phase]);

  const handleUnlock = async (passcode: string) => {
    const ok = await unlockVault(passcode);
    if (ok) setPhase('unlocked');
    return ok;
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.inset} />
      {phase === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : phase === 'setup' ? (
        <PasscodeSetupScreen onDone={() => setPhase('unlocked')} />
      ) : phase === 'locked' ? (
        <LockScreen onUnlock={handleUnlock} />
      ) : showCards ? (
        <CardsScreen onBack={() => setShowCards(false)} />
      ) : showDocuments ? (
        <DocumentsScreen onBack={() => setShowDocuments(false)} />
      ) : (
        <>
          {!(tab === 'notes' && isNoteEditing) && (
            <NavBar
              tab={tab === 'passwords-health' ? 'passwords' : tab}
              onSettings={() => setTab('settings')}
              onAdd={() => DeviceEventEmitter.emit('actionAdd')}
            />
          )}
          <View style={styles.content}>
            {tab === 'vault' ? (
              <VaultScreen onOpenCards={() => setShowCards(true)} onOpenDocuments={() => setShowDocuments(true)} onTabSelect={setTab} />
            ) : tab === 'passwords-health' ? (
              <PasswordsScreen initialShowHealthAlerts={true} />
            ) : (
              <CurrentScreen tab={tab} />
            )}
          </View>
          {!isKeyboardOpen && (
            <TabBar
              active={tab === 'passwords-health' ? 'passwords' : tab}
              onChange={(nextTab: any) => {
                setIsNoteEditing(false);
                setTab(nextTab);
              }}
            />
          )}
        </>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inset: {
    height: TOP_INSET,
  },
  content: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: space.xl,
  },
  navLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  navRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  brand: {
    fontFamily: serifFont,
    fontSize: 20,
    fontWeight: '600',
    color: colors.goldDark,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default App;
