/**
 * Tijori — an Apple-style personal vault.
 *
 * @format
 */

import React, { useState } from 'react';
import { Platform, StatusBar, StyleSheet, Text, View, TouchableOpacity } from 'react-native';

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
          <TouchableOpacity accessibilityLabel="Settings" accessibilityRole="button">
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
          <TouchableOpacity accessibilityLabel="Add" accessibilityRole="button">
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

function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<TabKey>('vault');
  const [showCards, setShowCards] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.inset} />
      {unlocked ? (
        showCards ? (
          <CardsScreen onBack={() => setShowCards(false)} />
        ) : (
          <>
            <NavBar tab={tab} />
            <View style={styles.content}>
              {tab === 'vault' ? (
                <VaultScreen onOpenCards={() => setShowCards(true)} onTabSelect={setTab} />
              ) : (
                <CurrentScreen tab={tab} />
              )}
            </View>
            <TabBar active={tab} onChange={setTab} />
          </>
        )
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
