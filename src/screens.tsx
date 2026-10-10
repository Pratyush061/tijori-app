import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Card,
  Chevron,
  Icon,
  InsetGroup,
  KeyValueRow,
  ListRow,
  Monogram,
  SectionLabel,
} from './components';
import type { IconName } from './components';
import { birthdays, passwords } from './data';
import { colors, radius, space } from './theme';

export const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

/* ------------------------------------------------------------------- lock */

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  return (
    <View style={styles.lock}>
      <View style={styles.lockBadge}>
        <Icon name="lock" size={40} color={colors.goldDark} strokeWidth={1.5} />
      </View>
      <Text style={styles.lockTitle}>Tijori</Text>
      <Text style={styles.lockCaption}>Your private locker</Text>

      <TouchableOpacity style={styles.lockButton} activeOpacity={0.85} onPress={onUnlock}>
        <Icon name="shield" size={19} color="#FFFFFF" />
        <Text style={styles.lockButtonText}>Unlock with Face ID</Text>
      </TouchableOpacity>
      <Text style={styles.lockPasscode}>Enter Passcode</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ vault */

const categories: { label: string; count: string; icon: IconName; color: string }[] = [
  { label: 'Passwords', count: '24 items', icon: 'key', color: colors.blue },
  { label: 'Birthdays', count: '9 upcoming', icon: 'cake', color: colors.pink },
  { label: 'Notes', count: '15 secured', icon: 'note', color: colors.orange },
  { label: 'Cards', count: '6 saved', icon: 'card', color: colors.green },
];

export function VaultScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.bigTitleWrap}>
        <Text style={styles.bigTitleSerif}>Good evening</Text>
        <Text style={styles.bigSubtitle}>Everything in your vault is safe and synced.</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroShield}>
            <Icon name="shield" size={24} color="#E9C877" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.heroTitle}>Vault secured</Text>
            <Text style={styles.heroMeta}>End-to-end encrypted · backed up 2h ago</Text>
          </View>
        </View>
        <View style={styles.heroStats}>
          {[
            { n: '54', l: 'Items' },
            { n: '9', l: 'Upcoming' },
            { n: '2', l: 'Alerts' },
          ].map(s => (
            <View key={s.l}>
              <Text style={styles.heroStatNum}>{s.n}</Text>
              <Text style={styles.heroStatLabel}>{s.l}</Text>
            </View>
          ))}
        </View>
      </View>

      <SectionLabel>Categories</SectionLabel>
      <View style={styles.grid}>
        {categories.map(c => (
          <View key={c.label} style={styles.catCard}>
            <View style={[styles.catIcon, { backgroundColor: c.color }]}>
              <Icon name={c.icon} size={19} color="#FFFFFF" />
            </View>
            <Text style={styles.catTitle}>{c.label}</Text>
            <Text style={styles.catSubtitle}>{c.count}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* -------------------------------------------------------------- passwords */

export function PasswordsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.searchBar}>
        <Icon name="search" size={17} color={colors.dim} strokeWidth={2} />
        <Text style={styles.searchText}>Search</Text>
      </View>

      <SectionLabel>Security</SectionLabel>
      <InsetGroup>
        <ListRow
          divider={false}
          leading={
            <View style={[styles.alertIcon, { backgroundColor: colors.orange }]}>
              <Icon name="shield" size={20} color="#FFFFFF" />
            </View>
          }
          title="3 passwords need attention"
          subtitle="Reused or older than a year"
          right={<Chevron />}
        />
      </InsetGroup>

      <SectionLabel>All items</SectionLabel>
      <InsetGroup>
        {passwords.map((p, i) => (
          <ListRow
            key={p.id}
            divider={i > 0}
            leading={<Monogram label={p.initial} color={p.color} />}
            title={p.name}
            subtitle={p.subtitle}
            right={
              <View style={styles.rowTail}>
                <Text style={styles.dots}>••••••</Text>
                <Chevron />
              </View>
            }
          />
        ))}
      </InsetGroup>
    </ScrollView>
  );
}

/* -------------------------------------------------------------- birthdays */

export function BirthdaysScreen() {
  const next = birthdays[0];
  const upcoming = birthdays.slice(1);
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.segment}>
        <View style={[styles.segmentItem, styles.segmentItemOn]}>
          <Text style={styles.segmentTextOn}>Upcoming</Text>
        </View>
        <View style={styles.segmentItem}>
          <Text style={styles.segmentText}>All people</Text>
        </View>
      </View>

      <View style={styles.nextUp}>
        <Monogram label={next.initial} color={colors.pink} size={54} round />
        <View style={styles.flex}>
          <Text style={styles.nextUpName}>{next.name}</Text>
          <Text style={styles.nextUpDate}>Turning 27 · {next.date}</Text>
        </View>
        <View style={styles.wishButton}>
          <Text style={styles.wishButtonText}>Wish</Text>
        </View>
      </View>

      <SectionLabel>Coming up</SectionLabel>
      <InsetGroup>
        {upcoming.map((b, i) => (
          <ListRow
            key={b.id}
            divider={i > 0}
            leading={<Monogram label={b.initial} color={b.color} round />}
            title={b.name}
            subtitle={b.date}
            right={
              <View style={styles.badge}>
                <Text style={styles.badgeText}>in {b.daysAway} days</Text>
              </View>
            }
          />
        ))}
      </InsetGroup>
    </ScrollView>
  );
}

/* --------------------------------------------------------------- settings */

export function SettingsScreen() {
  const [faceId, setFaceId] = React.useState(true);
  const [sync, setSync] = React.useState(true);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <InsetGroup>
        <View style={styles.profile}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>PJ</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.profileName}>Pratyush Jain</Text>
            <Text style={styles.profileEmail}>pratyushjj02@gmail.com</Text>
          </View>
          <Chevron />
        </View>
      </InsetGroup>

      <SectionLabel>Security</SectionLabel>
      <InsetGroup>
        <KeyValueRow label="Face ID unlock" divider={false}>
          <Switch value={faceId} onValueChange={setFaceId} trackColor={{ true: colors.green }} />
        </KeyValueRow>
        <KeyValueRow label="Auto-lock">
          <Text style={styles.krowValue}>Immediately</Text>
        </KeyValueRow>
        <KeyValueRow label="Change passcode">
          <Chevron />
        </KeyValueRow>
      </InsetGroup>

      <SectionLabel>Data</SectionLabel>
      <InsetGroup>
        <KeyValueRow label="iCloud sync" divider={false}>
          <Switch value={sync} onValueChange={setSync} trackColor={{ true: colors.green }} />
        </KeyValueRow>
        <KeyValueRow label="Back up now">
          <Text style={styles.krowValue}>2h ago</Text>
        </KeyValueRow>
        <KeyValueRow label="Export vault">
          <Chevron />
        </KeyValueRow>
      </InsetGroup>

      <SectionLabel>About</SectionLabel>
      <InsetGroup>
        <KeyValueRow label="Version" divider={false}>
          <Text style={styles.krowValue}>1.0.0</Text>
        </KeyValueRow>
        <KeyValueRow label="Help & support">
          <Chevron />
        </KeyValueRow>
      </InsetGroup>
    </ScrollView>
  );
}

/* ----------------------------------------------------------------- styles */

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingBottom: 32 },

  lock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  lockBadge: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(185,138,46,0.28)',
    shadowColor: colors.gold,
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  lockTitle: {
    fontFamily: serifFont,
    fontSize: 46,
    fontWeight: '600',
    color: colors.ink,
    marginTop: space.xl,
  },
  lockCaption: {
    fontSize: 14,
    color: colors.dim,
    marginTop: 6,
  },
  lockButton: {
    position: 'absolute',
    bottom: 118,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: space.xl,
  },
  lockButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  lockPasscode: {
    position: 'absolute',
    bottom: 88,
    fontSize: 14,
    color: colors.dim,
  },

  bigTitleWrap: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  bigTitleSerif: {
    fontFamily: serifFont,
    fontSize: 34,
    fontWeight: '600',
    color: colors.ink,
  },
  bigSubtitle: {
    fontSize: 14,
    color: colors.dim,
    marginTop: 4,
  },

  hero: {
    marginHorizontal: space.md,
    borderRadius: 24,
    padding: space.lg + 4,
    backgroundColor: colors.heroB,
    overflow: 'hidden',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  heroShield: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(185,138,46,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(233,200,119,0.28)',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12.5,
    marginTop: 2,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 26,
    marginTop: space.lg + 2,
  },
  heroStatNum: {
    fontFamily: serifFont,
    fontSize: 26,
    fontWeight: '600',
    color: '#F3E6C4',
  },
  heroStatLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginTop: 1,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    paddingHorizontal: space.md,
  },
  catCard: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  catIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  catTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  catSubtitle: {
    fontSize: 12.5,
    color: colors.dim,
    marginTop: 2,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.md,
    marginTop: space.md,
    paddingVertical: 9,
    paddingHorizontal: space.md,
    borderRadius: 11,
    backgroundColor: 'rgba(118,118,128,0.12)',
  },
  searchText: {
    fontSize: 16,
    color: colors.dim,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dots: {
    fontSize: 15,
    letterSpacing: 2,
    color: colors.dim,
  },

  segment: {
    flexDirection: 'row',
    marginHorizontal: space.md,
    marginTop: space.md,
    padding: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(118,118,128,0.12)',
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentItemOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  segmentTextOn: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },

  nextUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginHorizontal: space.md,
    marginTop: space.md,
    padding: space.lg,
    borderRadius: 22,
    backgroundColor: '#FBF7EE',
    borderWidth: 1,
    borderColor: 'rgba(185,138,46,0.22)',
  },
  nextUpName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  nextUpDate: {
    fontSize: 13,
    color: colors.dim,
    marginTop: 2,
  },
  wishButton: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  wishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.goldSoft,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.goldDark,
  },

  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: space.lg,
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  profileInitials: {
    fontFamily: serifFont,
    fontSize: 22,
    fontWeight: '600',
    color: '#F3E6C4',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.dim,
    marginTop: 2,
  },
  krowValue: {
    fontSize: 15.5,
    color: colors.dim,
  },
});
