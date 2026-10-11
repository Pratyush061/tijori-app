import React from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Platform,
  ScrollView,
  StyleSheet,
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
import { getDaysAway, formatBirthdayDate } from './data';
import type { PasswordEntry, Birthday, NoteEntry, CardEntry, DocumentEntry } from './data';
import { passwordStorage, birthdayStorage, noteStorage, cardStorage, documentStorage } from './storage/asyncStorage';
import { changePasscode } from './storage/secureStore';
import { Keypad, PasscodeDots } from './PasscodeKeypad';
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

export function LockScreen({
  onUnlock,
}: {
  onUnlock: (passcode: string) => Promise<boolean>;
}) {
  const [passcode, setPasscode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    if (busy || passcode.length < 4) return;
    setBusy(true);
    const ok = await onUnlock(passcode);
    if (!ok) {
      setBusy(false);
      setError('Incorrect passcode');
      setPasscode('');
    }
  };

  return (
    <View style={styles.lock}>
      <View style={styles.lockTop}>
        <View style={styles.lockBadge}>
          <Icon name="lock" size={34} color={colors.goldDark} strokeWidth={1.5} />
        </View>
        <Text style={styles.lockTitle}>Tijori</Text>
        <Text style={styles.lockCaption}>
          {error ? error : 'Enter your passcode'}
        </Text>
        <PasscodeDots filled={passcode.length} error={!!error} />
        {busy ? <ActivityIndicator color={colors.gold} style={styles.lockBusy} /> : null}
      </View>

      <Keypad
        onDigit={digit => {
          setError(null);
          setPasscode(prev => (prev.length < 8 ? prev + digit : prev));
        }}
        onBackspace={() => {
          setError(null);
          setPasscode(prev => prev.slice(0, -1));
        }}
        onEnter={submit}
        enterEnabled={passcode.length >= 4}
        disabled={busy}
      />
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

  const [healthScore, setHealthScore] = React.useState(100);
  const [healthAlerts, setHealthAlerts] = React.useState<PasswordEntry[]>([]);

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
      let ps: PasswordEntry[] = [];
      let bs: Birthday[] = [];
      let ns: NoteEntry[] = [];
      let cs: CardEntry[] = [];
      let ds: DocumentEntry[] = [];
      try {
        ([ps, bs, ns, cs, ds] = await Promise.all([
          passwordStorage.list(),
          birthdayStorage.list(),
          noteStorage.list(),
          cardStorage.list(),
          documentStorage.list(),
        ]));
      } catch (e) {
        console.warn('Failed to load vault data', e);
      }

      const extractTs = (id: string) => {
        const match = id.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      let scoreDeduction = 0;
      const weakPasswords: PasswordEntry[] = [];
      const passSet = new Set<string>();
      const reusedSet = new Set<string>();

      ps.forEach(p => {
        if (!p.password) return;

        // Reused check
        if (passSet.has(p.password)) {
          reusedSet.add(p.password);
        } else {
          passSet.add(p.password);
        }
      });

      ps.forEach(p => {
        let isWeak = false;
        let isReused = false;
        let isOld = false;

        if (p.password) {
          let score = 0;
          if (p.password.length >= 8) score += 1;
          if (p.password.length >= 12) score += 1;
          if (/[A-Z]/.test(p.password)) score += 1;
          if (/[a-z]/.test(p.password)) score += 1;
          if (/[0-9]/.test(p.password)) score += 1;
          if (/[^A-Za-z0-9]/.test(p.password)) score += 1;

          if (score < 3) isWeak = true;
          if (reusedSet.has(p.password)) isReused = true;

          const ts = extractTs(p.id);
          if (ts > 0 && ts < oneYearAgo) isOld = true;
        } else {
          isWeak = true; // empty password
        }

        if (isWeak || isReused || isOld) {
          weakPasswords.push(p);
          scoreDeduction += 10;
        }
      });

      setHealthScore(Math.max(0, 100 - scoreDeduction));
      setHealthAlerts(weakPasswords);

      const upcoming = bs.filter(b => getDaysAway(b.date) <= 30).length;
      const alerts = weakPasswords.length;

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
          Everything in your vault is stored on this device.
        </Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroShield}>
            <Icon name="shield" size={24} color="#E9C877" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.heroTitle}>Your vault</Text>
            <Text style={styles.heroMeta}>
              Stored on this device · no cloud backup yet
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

      {catCounts.passwords > 0 && (
        <TouchableOpacity
          style={[styles.hero, styles.healthHero]}
          onPress={() => onTabSelect?.('passwords-health')}
        >
          <View style={[styles.heroRow, styles.heroRowSpaceBetween]}>
            <View style={styles.healthHeroContent}>
              <View
                style={[
                  styles.heroShield,
                  healthScore > 80
                    ? styles.healthShieldGood
                    : healthScore > 50
                    ? styles.healthShieldFair
                    : styles.healthShieldPoor,
                ]}
              >
                <Icon
                  name="shield"
                  size={24}
                  color={
                    healthScore > 80
                      ? colors.green
                      : healthScore > 50
                      ? colors.orange
                      : colors.pink
                  }
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.healthTitle}>Vault Health: {healthScore}%</Text>
                <Text style={styles.healthMeta}>
                  {healthAlerts.length} {healthAlerts.length === 1 ? 'password needs' : 'passwords need'} attention
                </Text>
              </View>
            </View>
            <Chevron />
          </View>
        </TouchableOpacity>
      )}

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
                onPress={() => {
                  const sub = r.subtitle.toLowerCase();
                  if (sub.includes('••••')) {
                    onOpenCards?.();
                  } else if (sub === 'note') {
                    onTabSelect?.('notes');
                  } else if (sub === 'password' || r.title !== r.subtitle && !sub.includes(' ') && !sub.includes('/')) {
                    onTabSelect?.('passwords');
                  } else if (sub.includes('document') || ['aadhaar', 'pan', 'passport', 'driving licence'].includes(sub)) {
                    onOpenDocuments?.();
                  } else {
                    onTabSelect?.('birthdays');
                  }
                }}
                right={<Chevron />}
              />
            ))}
          </InsetGroup>
        </>
      )}
    </ScrollView>
  );
}

/* -------------------------------------------------------------- passwords */

const CATEGORIES = ['Favorites', 'Email', 'Banking', 'Social', 'Work', 'Government / ID', 'Shopping', 'Other'];

export function PasswordsScreen({ initialShowHealthAlerts }: { initialShowHealthAlerts?: boolean }) {
  const [items, setItems] = React.useState<PasswordEntry[]>([]);
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [healthAlerts, setHealthAlerts] = React.useState<PasswordEntry[]>([]);
  const [showHealthAlertsOnly, setShowHealthAlertsOnly] = React.useState(initialShowHealthAlerts || false);
  const [selectedEntry, setSelectedEntry] = React.useState<PasswordEntry | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialShowHealthAlerts !== undefined) {
      setShowHealthAlertsOnly(initialShowHealthAlerts);
    }
  }, [initialShowHealthAlerts]);

  const loadItems = async () => {
    let stored: PasswordEntry[] = [];
    try {
      stored = await passwordStorage.list();
    } catch (e) {
      console.warn('Failed to load passwords', e);
    }
    setItems(stored);

    const extractTs = (id: string) => {
      const match = id.match(/^(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const weakPasswords: PasswordEntry[] = [];
    const passSet = new Set<string>();
    const reusedSet = new Set<string>();

    stored.forEach(p => {
      if (!p.password) return;
      if (passSet.has(p.password)) {
        reusedSet.add(p.password);
      } else {
        passSet.add(p.password);
      }
    });

    stored.forEach(p => {
      let isWeak = false;
      let isReused = false;
      let isOld = false;

      if (p.password) {
        let score = 0;
        if (p.password.length >= 8) score += 1;
        if (p.password.length >= 12) score += 1;
        if (/[A-Z]/.test(p.password)) score += 1;
        if (/[a-z]/.test(p.password)) score += 1;
        if (/[0-9]/.test(p.password)) score += 1;
        if (/[^A-Za-z0-9]/.test(p.password)) score += 1;

        if (score < 3) isWeak = true;
        if (reusedSet.has(p.password)) isReused = true;

        const ts = extractTs(p.id);
        if (ts > 0 && ts < oneYearAgo) isOld = true;
      } else {
        isWeak = true;
      }

      if (isWeak || isReused || isOld) {
        weakPasswords.push(p);
      }
    });

    setHealthAlerts(weakPasswords);
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

  let filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCategory = true;
    if (activeCategory === 'Favorites') {
      matchesCategory = !!item.favorite;
    } else if (activeCategory) {
      matchesCategory = item.category === activeCategory;
    }

    return matchesSearch && matchesCategory;
  });

  if (showHealthAlertsOnly) {
    const alertIds = new Set(healthAlerts.map(a => a.id));
    filteredItems = filteredItems.filter(item => alertIds.has(item.id));
  }

  return (
    <View style={styles.flex}>
      <View style={styles.floatingAddWrapper}>
        <TouchableOpacity
          onPress={() => { setSelectedEntry(null); setSheetVisible(true); }}
          accessibilityLabel="Add Password"
          accessibilityRole="button"
        >
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
          style={[styles.searchText, styles.searchTextInput]}
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

      {filteredItems.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="key" size={48} color={colors.dim2} />
          <Text style={styles.emptyTitle}>No passwords yet</Text>
          <Text style={styles.emptyHint}>Keep your accounts secure and easily accessible.</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setSelectedEntry(null);
              setSheetVisible(true);
            }}
          >
            <Text style={styles.addButtonText}>Add Password</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {healthAlerts.length > 0 && !showHealthAlertsOnly && (
            <>
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
                  title={`${healthAlerts.length} ${healthAlerts.length === 1 ? 'password needs' : 'passwords need'} attention`}
                  subtitle="Weak, reused or older than a year"
                  right={<Chevron />}
                  onPress={() => setShowHealthAlertsOnly(true)}
                />
              </InsetGroup>
            </>
          )}

          {showHealthAlertsOnly && (
            <View style={styles.healthAlertsHeader}>
              <SectionLabel>Needs Attention</SectionLabel>
              <TouchableOpacity onPress={() => setShowHealthAlertsOnly(false)}>
                <Text style={styles.showAllText}>Show All</Text>
              </TouchableOpacity>
            </View>
          )}

          {!showHealthAlertsOnly && <SectionLabel>All items</SectionLabel>}
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
        </>
      )}
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
    let stored: Birthday[] = [];
    try {
      stored = await birthdayStorage.list();
    } catch (e) {
      console.warn('Failed to load birthdays', e);
    }
    setItems(stored);
  };

  React.useEffect(() => {
    loadItems();
  }, []);

  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener('actionAdd', () => {
      setSelectedEntry(null);
      setSheetVisible(true);
    });
    return () => sub.remove();
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
          items.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="cake" size={48} color={colors.dim2} />
              <Text style={styles.emptyTitle}>No birthdays yet</Text>
              <Text style={styles.emptyHint}>Add upcoming birthdays so you never forget.</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setSelectedEntry(null);
                  setSheetVisible(true);
                }}
              >
                <Text style={styles.addButtonText}>Add Birthday</Text>
              </TouchableOpacity>
            </View>
          ) : (
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
              style={styles.addBirthdayBtn}
              onPress={() => {
                setSelectedEntry(null);
                setSheetVisible(true);
              }}
            >
              <Text style={styles.wishButtonText}>Add Birthday</Text>
            </TouchableOpacity>
          </>
          )
        ) : (
          <>
            <Calendar
              markedDates={markedDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            {selectedDate && selectedDateBirthdays.length > 0 && (
              <View style={styles.calendarBirthdaysWrap}>
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
              style={styles.addBirthdayBtn}
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
  const [changing, setChanging] = React.useState(false);
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<{
    text: string;
    ok: boolean;
  } | null>(null);

  const reset = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setMessage(null);
  };

  const submitChange = async () => {
    if (busy) return;
    if (next.length < 4) {
      setMessage({ text: 'New passcode must be at least 4 digits.', ok: false });
      return;
    }
    if (next !== confirm) {
      setMessage({ text: 'The new passcodes do not match.', ok: false });
      return;
    }
    setBusy(true);
    const ok = await changePasscode(current, next);
    setBusy(false);
    if (!ok) {
      setMessage({ text: 'Current passcode is incorrect.', ok: false });
      return;
    }
    setMessage({ text: 'Passcode changed.', ok: true });
    setChanging(false);
    reset();
  };

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
        <KeyValueRow label="Passcode lock" divider={false}>
          <Text style={styles.krowValue}>On</Text>
        </KeyValueRow>
        <KeyValueRow label="Auto-lock">
          <Text style={styles.krowValue}>Immediately</Text>
        </KeyValueRow>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => {
            reset();
            setChanging(v => !v);
          }}
          accessibilityLabel="Change passcode"
          accessibilityRole="button"
          style={styles.settingsRow}
        >
          <Text style={styles.settingsRowLabel}>Change passcode</Text>
          <Chevron />
        </TouchableOpacity>
      </InsetGroup>

      {changing && (
        <InsetGroup>
          <View style={styles.changeForm}>
            <TextInput
              style={styles.changeInput}
              placeholder="Current passcode"
              placeholderTextColor={colors.dim}
              value={current}
              onChangeText={setCurrent}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={8}
              accessibilityLabel="Current passcode"
            />
            <TextInput
              style={styles.changeInput}
              placeholder="New passcode"
              placeholderTextColor={colors.dim}
              value={next}
              onChangeText={setNext}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={8}
              accessibilityLabel="New passcode"
            />
            <TextInput
              style={styles.changeInput}
              placeholder="Confirm new passcode"
              placeholderTextColor={colors.dim}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={8}
              accessibilityLabel="Confirm new passcode"
            />
            {message ? (
              <Text
                style={[
                  styles.changeMessage,
                  message.ok ? styles.changeOk : styles.changeError,
                ]}
              >
                {message.text}
              </Text>
            ) : null}
            <TouchableOpacity
              style={styles.changeButton}
              onPress={submitChange}
              disabled={busy}
              accessibilityLabel="Save new passcode"
              accessibilityRole="button"
            >
              <Text style={styles.changeButtonText}>
                {busy ? 'Saving...' : 'Save passcode'}
              </Text>
            </TouchableOpacity>
          </View>
        </InsetGroup>
      )}

      <SectionLabel>Data</SectionLabel>
      <InsetGroup>
        <KeyValueRow label="Cloud backup" divider={false}>
          <Text style={styles.krowValue}>Not available yet</Text>
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

  empty: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.dim,
    marginTop: space.lg,
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 15,
    color: colors.dim,
    textAlign: 'center',
    marginBottom: space.lg,
    paddingHorizontal: space.xl,
  },
  addButton: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.sep,
  },
  settingsRowLabel: {
    fontSize: 15,
    color: colors.ink,
  },
  changeForm: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.sm,
  },
  changeInput: {
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 10,
    paddingHorizontal: space.md,
    borderRadius: 10,
    backgroundColor: 'rgba(118,118,128,0.12)',
  },
  changeMessage: {
    fontSize: 13,
  },
  changeOk: {
    color: colors.green,
  },
  changeError: {
    color: colors.pink,
  },
  changeButton: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  lock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: space.xl,
    backgroundColor: colors.bg,
  },
  lockTop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  lockBadge: {
    width: 76,
    height: 76,
    borderRadius: 24,
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
    fontSize: 34,
    fontWeight: '600',
    color: colors.ink,
    marginTop: space.lg,
  },
  lockCaption: {
    fontSize: 14,
    color: colors.dim,
    marginTop: 6,
  },
  lockBusy: {
    marginTop: space.sm,
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
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  heroRowSpaceBetween: {
    justifyContent: 'space-between',
  },
  healthHero: {
    marginTop: space.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.sep,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  healthHeroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  healthShieldGood: {
    backgroundColor: 'rgba(52,199,89,0.15)',
    borderColor: 'transparent',
  },
  healthShieldFair: {
    backgroundColor: 'rgba(255,159,10,0.15)',
    borderColor: 'transparent',
  },
  healthShieldPoor: {
    backgroundColor: 'rgba(255,55,95,0.15)',
    borderColor: 'transparent',
  },
  healthTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '600',
  },
  healthMeta: {
    color: colors.dim,
    fontSize: 12.5,
    marginTop: 2,
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

  floatingAddWrapper: {
    alignItems: 'flex-end',
    paddingHorizontal: space.xl,
    marginTop: -35,
    zIndex: 10,
    elevation: 10,
    paddingBottom: 10,
  },

  healthAlertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: space.lg,
  },
  showAllText: {
    color: colors.blue,
    fontSize: 14,
  },

  calendarBirthdaysWrap: {
    marginTop: space.lg,
  },
  addBirthdayBtn: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: space.xl,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
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
  searchTextInput: {
    flex: 1,
    height: 20,
    padding: 0,
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
