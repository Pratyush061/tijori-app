import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Chevron,
  Icon,
  InsetGroup,
  KeyValueRow,
  ListRow,
  Monogram,
  SectionLabel,
} from './components';
import type { IconName } from './components';
import { birthdays, passwords, getDaysAway, formatBirthdayDate } from './data';
import type { PasswordEntry, Birthday } from './data';
import { passwordStorage, birthdayStorage, noteStorage, cardStorage, documentStorage } from './storage/asyncStorage';
import { PasswordSheet } from './PasswordSheet';
import { BirthdaySheet } from './BirthdaySheet';
import { Calendar } from './Calendar';
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

      <TouchableOpacity
        style={styles.lockButton}
        activeOpacity={0.85}
        onPress={onUnlock}
      >
        <Icon name="shield" size={19} color="#FFFFFF" />
        <Text style={styles.lockButtonText}>Unlock with Face ID</Text>
      </TouchableOpacity>
      <Text style={styles.lockPasscode}>Enter Passcode</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ vault */

type VaultScreenProps = {
  onOpenCards?: () => void;
  onOpenDocuments?: () => void;
  onTabSelect?: (tab: any) => void;
};

type RecentItem = {
  id: string;
  title: string;
  subtitle: string;
  initial: string;
  color: string;
  ts: number;
};

export function VaultScreen({ onOpenCards, onOpenDocuments, onTabSelect }: VaultScreenProps) {
  const [stats, setStats] = React.useState({
    totalItems: 0,
    upcomingBdays: 0,
    alerts: 0,
  });

  const [catCounts, setCatCounts] = React.useState({
    passwords: 0,
    birthdays: 0,
    notes: 0,
    cards: 0,
    documents: 0,
  });

  const [recents, setRecents] = React.useState<RecentItem[]>([]);

  React.useEffect(() => {
    const load = async () => {
      const [ps, bs, ns, cs, ds] = await Promise.all([
        passwordStorage.list(),
        birthdayStorage.list(),
        noteStorage.list(),
        cardStorage.list(),
        documentStorage.list(),
      ]);

      const upcoming = bs.filter(b => getDaysAway(b.date) <= 30).length;
      const alerts = ps.filter(p => !p.password || p.password.trim() === '').length;

      setStats({
        totalItems: ps.length + bs.length + ns.length + cs.length + ds.length,
        upcomingBdays: upcoming,
        alerts: alerts,
      });

      setCatCounts({
        passwords: ps.length,
        birthdays: bs.length,
        notes: ns.length,
        cards: cs.length,
        documents: ds.length,
      });

      const extractTs = (id: string) => {
        const match = id.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const allItems: RecentItem[] = [
        ...ps.map(p => ({ id: p.id, title: p.name, subtitle: p.subtitle || 'Password', initial: p.initial, color: p.color, ts: extractTs(p.id) })),
        ...bs.map(b => ({ id: b.id, title: b.name, subtitle: formatBirthdayDate(b.date), initial: b.initial, color: b.color, ts: extractTs(b.id) })),
        ...ns.map(n => ({ id: n.id, title: n.title, subtitle: 'Note', initial: n.initial, color: n.color, ts: extractTs(n.id) })),
        ...cs.map(c => ({ id: c.id, title: c.name, subtitle: `•••• ${c.last4}`, initial: c.initial, color: c.color, ts: extractTs(c.id) })),
        ...ds.map(d => ({ id: d.id, title: d.title, subtitle: d.type, initial: d.initial, color: d.color, ts: extractTs(d.id) })),
      ];

      allItems.sort((a, b) => b.ts - a.ts);
      setRecents(allItems.slice(0, 3));
    };

    load();
  }, []);

  const categories = [
    { label: 'Passwords', count: `${catCounts.passwords} items`, icon: 'key' as IconName, color: colors.blue },
    { label: 'Birthdays', count: `${catCounts.birthdays} items`, icon: 'cake' as IconName, color: colors.pink },
    { label: 'Notes', count: `${catCounts.notes} items`, icon: 'note' as IconName, color: colors.orange },
    { label: 'Cards', count: `${catCounts.cards} items`, icon: 'card' as IconName, color: colors.green },
    { label: 'Documents', count: `${catCounts.documents} items`, icon: 'document' as IconName, color: colors.indigo },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.bigTitleWrap}>
        <Text style={styles.bigTitleSerif}>Good evening</Text>
        <Text style={styles.bigSubtitle}>
          Everything in your vault is safe and synced.
        </Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroShield}>
            <Icon name="shield" size={24} color="#E9C877" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.heroTitle}>Vault secured</Text>
            <Text style={styles.heroMeta}>
              End-to-end encrypted · backed up 2h ago
            </Text>
          </View>
        </View>
        <View style={styles.heroStats}>
          {[
            { n: stats.totalItems.toString(), l: 'Items' },
            { n: stats.upcomingBdays.toString(), l: 'Upcoming' },
            { n: stats.alerts.toString(), l: 'Alerts' },
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
          <TouchableOpacity
            key={c.label}
            style={styles.catCard}
            onPress={() => {
              if (c.label === 'Cards') {
                onOpenCards?.();
              } else if (c.label === 'Documents') {
                onOpenDocuments?.();
              } else {
                onTabSelect?.(c.label.toLowerCase());
              }
            }}
          >
            <View style={[styles.catIcon, { backgroundColor: c.color }]}>
              <Icon name={c.icon} size={19} color="#FFFFFF" />
            </View>
            <Text style={styles.catTitle}>{c.label}</Text>
            <Text style={styles.catSubtitle}>{c.count}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {recents.length > 0 && (
        <>
          <SectionLabel>Recently Added</SectionLabel>
          <InsetGroup>
            {recents.map((r, i) => (
              <ListRow
                key={r.id}
                divider={i > 0}
                leading={<Monogram label={r.initial} color={r.color} round />}
                title={r.title}
                subtitle={r.subtitle}
              />
            ))}
          </InsetGroup>
        </>
      )}
    </ScrollView>
  );
}

/* -------------------------------------------------------------- passwords */

const CATEGORIES = ['Email', 'Banking', 'Social', 'Work', 'Government / ID', 'Shopping', 'Other'];

export function PasswordsScreen() {
  const [items, setItems] = React.useState<PasswordEntry[]>([]);
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<PasswordEntry | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const loadItems = async () => {
    let stored = await passwordStorage.list();
    if (stored.length === 0) {
      // Seed with sample data initially if empty
      for (const p of passwords) {
        await passwordStorage.create({
          name: p.name,
          subtitle: p.subtitle,
          color: p.color,
          initial: p.initial,
          category: p.category,
        });
      }
      stored = await passwordStorage.list();
    }
    setItems(stored);
  };

  React.useEffect(() => {
    loadItems();
  }, []);

  const handleSave = async (entry: Partial<PasswordEntry>) => {
    if (selectedEntry) {
      await passwordStorage.update(selectedEntry.id, entry);
    } else {
      await passwordStorage.create(entry as Omit<PasswordEntry, 'id'>);
    }
    loadItems();
  };

  const handleDelete = async () => {
    if (selectedEntry) {
      await passwordStorage.delete(selectedEntry.id);
      loadItems();
      setSheetVisible(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory ? item.category === activeCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.flex}>
      <View style={{ alignItems: 'flex-end', paddingHorizontal: space.xl, marginTop: -35, zIndex: 10, elevation: 10, paddingBottom: 10 }}>
        <TouchableOpacity onPress={() => { setSelectedEntry(null); setSheetVisible(true); }}>
          <Icon name="plus" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.searchBar}>
        <Icon name="search" size={17} color={colors.dim} strokeWidth={2} />
        <TextInput
          style={[styles.searchText, { flex: 1, height: 20, padding: 0 }]}
          placeholder="Search"
          placeholderTextColor={colors.dim}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsScroll}
      >
        <TouchableOpacity
          style={[styles.filterChip, activeCategory === null && styles.filterChipActive]}
          onPress={() => setActiveCategory(null)}
        >
          <Text style={[styles.filterChipText, activeCategory === null && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.filterChip, activeCategory === c && styles.filterChipActive]}
            onPress={() => setActiveCategory(activeCategory === c ? null : c)}
          >
            <Text style={[styles.filterChipText, activeCategory === c && styles.filterChipTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionLabel>Security</SectionLabel>
      <InsetGroup>
        <ListRow
          divider={false}
          leading={
            <View
              style={[styles.alertIcon, { backgroundColor: colors.orange }]}
            >
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
        {filteredItems.map((p, i) => (
          <ListRow
            key={p.id}
            divider={i > 0}
            leading={<Monogram label={p.initial} color={p.color} />}
            title={p.name}
            subtitle={[p.subtitle, p.category].filter(Boolean).join(' • ')}
            onPress={() => {
              setSelectedEntry(p);
              setSheetVisible(true);
            }}
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
      <PasswordSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSave={handleSave}
        onDelete={selectedEntry ? handleDelete : undefined}
        entry={selectedEntry}
      />
    </View>
  );
}

/* -------------------------------------------------------------- birthdays */

export function BirthdaysScreen() {
  const [items, setItems] = React.useState<Birthday[]>([]);
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<Birthday | null>(null);
  const [viewMode, setViewMode] = React.useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = React.useState<string | undefined>(undefined);

  const loadItems = async () => {
    let stored = await birthdayStorage.list();
    if (stored.length === 0) {
      for (const b of birthdays) {
        await birthdayStorage.create({
          name: b.name,
          date: b.date,
          includeYear: b.includeYear,
          color: b.color,
          initial: b.initial,
          note: b.note,
        });
      }
      stored = await birthdayStorage.list();
    }
    setItems(stored);
  };

  React.useEffect(() => {
    loadItems();
  }, []);

  const handleSave = async (entry: Partial<Birthday>) => {
    if (selectedEntry) {
      await birthdayStorage.update(selectedEntry.id, entry);
    } else {
      await birthdayStorage.create(entry as Omit<Birthday, 'id'>);
    }
    await loadItems();
  };

  const handleDelete = async () => {
    if (selectedEntry) {
      await birthdayStorage.delete(selectedEntry.id);
      setSheetVisible(false);
      await loadItems();
    }
  };

  const sortedItems = [...items].sort((a, b) => getDaysAway(a.date) - getDaysAway(b.date));
  const next = sortedItems.length > 0 ? sortedItems[0] : null;
  const upcoming = sortedItems.length > 1 ? sortedItems.slice(1) : [];

  const markedDates = items.map(i => i.date);

  const selectedDateBirthdays = selectedDate
    ? items.filter(i => i.date.slice(5) === selectedDate.slice(5))
    : [];

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, viewMode === 'list' && styles.segmentItemOn]}
            onPress={() => setViewMode('list')}
          >
            <Text style={viewMode === 'list' ? styles.segmentTextOn : styles.segmentText}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, viewMode === 'calendar' && styles.segmentItemOn]}
            onPress={() => setViewMode('calendar')}
          >
            <Text style={viewMode === 'calendar' ? styles.segmentTextOn : styles.segmentText}>Calendar</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'list' ? (
          <>
            {next && (
              <TouchableOpacity
                style={styles.nextUp}
                onPress={() => {
                  setSelectedEntry(next);
                  setSheetVisible(true);
                }}
              >
                <Monogram label={next.initial} color={next.color} size={54} round />
                <View style={styles.flex}>
                  <Text style={styles.nextUpName}>{next.name}</Text>
                  <Text style={styles.nextUpDate}>{formatBirthdayDate(next.date)}</Text>
                </View>
                <View style={styles.wishButton}>
                  <Text style={styles.wishButtonText}>Wish</Text>
                </View>
              </TouchableOpacity>
            )}

            {upcoming.length > 0 && (
              <>
                <SectionLabel>Coming up</SectionLabel>
                <InsetGroup>
                  {upcoming.map((b, i) => {
                    const daysAway = getDaysAway(b.date);
                    return (
                      <ListRow
                        key={b.id}
                        divider={i > 0}
                        leading={<Monogram label={b.initial} color={b.color} round />}
                        title={b.name}
                        subtitle={formatBirthdayDate(b.date)}
                        onPress={() => {
                          setSelectedEntry(b);
                          setSheetVisible(true);
                        }}
                        right={
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>in {daysAway} days</Text>
                          </View>
                        }
                      />
                    );
                  })}
                </InsetGroup>
              </>
            )}

            <TouchableOpacity
              style={[styles.wishButton, { alignSelf: 'center', marginTop: space.xl, paddingHorizontal: space.xl, paddingVertical: space.sm }]}
              onPress={() => {
                setSelectedEntry(null);
                setSheetVisible(true);
              }}
            >
              <Text style={styles.wishButtonText}>Add Birthday</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Calendar
              markedDates={markedDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            {selectedDate && selectedDateBirthdays.length > 0 && (
              <View style={{ marginTop: space.lg }}>
                <SectionLabel>{`Birthdays on ${formatBirthdayDate(selectedDate)}`}</SectionLabel>
                <InsetGroup>
                  {selectedDateBirthdays.map((b, i) => (
                    <ListRow
                      key={b.id}
                      divider={i > 0}
                      leading={<Monogram label={b.initial} color={b.color} round />}
                      title={b.name}
                      onPress={() => {
                        setSelectedEntry(b);
                        setSheetVisible(true);
                      }}
                      right={<Chevron />}
                    />
                  ))}
                </InsetGroup>
              </View>
            )}

            <TouchableOpacity
              style={[styles.wishButton, { alignSelf: 'center', marginTop: space.xl, paddingHorizontal: space.xl, paddingVertical: space.sm }]}
              onPress={() => {
                setSelectedEntry(null);
                setSheetVisible(true);
              }}
            >
              <Text style={styles.wishButtonText}>Add Birthday</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <BirthdaySheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSave={handleSave}
        onDelete={selectedEntry ? handleDelete : undefined}
        entry={selectedEntry}
      />
    </View>
  );
}

/* --------------------------------------------------------------- settings */

export function SettingsScreen() {
  const [faceId, setFaceId] = React.useState(true);
  const [sync, setSync] = React.useState(true);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
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
          <Switch
            value={faceId}
            onValueChange={setFaceId}
            trackColor={{ true: colors.green }}
          />
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
          <Switch
            value={sync}
            onValueChange={setSync}
            trackColor={{ true: colors.green }}
          />
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
  filterChipsScroll: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
    gap: space.xs,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(118,118,128,0.12)',
    marginRight: space.xs,
  },
  filterChipActive: {
    backgroundColor: colors.ink,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink2,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
