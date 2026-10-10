/**
 * Tijori — an Apple-style personal vault.
 *
 * @format
 */

import React, { useState } from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';

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
import { colors, space } from './src/theme';

const TOP_INSET =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 48;

function NavBar({ tab }: { tab: TabKey }) {
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
          <Icon name="gear" size={22} color={colors.ink} />
        </View>
      </View>
    );
  }

  const title =
    tab === 'passwords'
      ? 'Passwords'
      : tab === 'birthdays'
      ? 'Birthdays'
      : 'Settings';
  const showPlus = tab !== 'settings';

  return (
    <View style={styles.nav}>
      <View style={styles.navLeft} />
      <Text style={styles.navTitle}>{title}</Text>
      <View style={styles.navRight}>
        {/* We will let the screen itself handle the plus button to access its state,
            or we can expose a global event. For simplicity, we just hide it here
            for passwords, and implement it inside PasswordsScreen's header or absolute positioned,
            or we pass a callback. Wait, let's keep it and use an event system, or better,
            we can render a top bar inside the screen. Actually, let's just use it here and pass a prop
            if we need to, but React Navigation isn't used. Let's just remove it here for passwords and
            put it in the PasswordsScreen so it can open the modal. */}
        {showPlus && tab !== 'passwords' ? <Icon name="plus" size={24} color={colors.ink} /> : null}
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
    case 'settings':
      return <SettingsScreen />;
    case 'vault':
    default:
      return <VaultScreen />;
  }
}

function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<TabKey>('vault');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.inset} />
      {unlocked ? (
        <>
          <NavBar tab={tab} />
          <View style={styles.content}>
            <CurrentScreen tab={tab} />
          </View>
          <TabBar active={tab} onChange={setTab} />
        </>
      ) : (
        <LockScreen onUnlock={() => setUnlocked(true)} />
      )}
    </View>
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
