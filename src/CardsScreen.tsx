import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Chevron, Icon, InsetGroup, ListRow, Monogram } from './components';
import type { CardEntry } from './data';
import { cardStorage } from './storage/asyncStorage';
import { CardSheet } from './CardSheet';
import { colors, space } from './theme';

type Props = {
  onBack: () => void;
};

export function CardsScreen({ onBack }: Props) {
  const [items, setItems] = useState<CardEntry[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CardEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    let data: CardEntry[] = [];
    try {
      data = await cardStorage.list();
    } catch (e) {
      console.warn('Failed to load cards', e);
    }
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (entry: Partial<CardEntry>) => {
    if (selectedEntry) {
      await cardStorage.update(selectedEntry.id, entry);
    } else {
      await cardStorage.create(entry as Omit<CardEntry, 'id'>);
    }
    load();
  };

  const handleDelete = async () => {
    if (selectedEntry) {
      await cardStorage.delete(selectedEntry.id);
      load();
      setSheetVisible(false);
    }
  };

  const filtered = items.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.last4.includes(searchQuery)
  );

  return (
    <View style={styles.flex}>
      <View style={styles.nav}>
        <TouchableOpacity activeOpacity={0.7} style={styles.navLeft} onPress={onBack}>
          <Icon name="chevron" size={24} color={colors.blue} />
          <Text style={styles.navBackText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Cards</Text>
        <View style={styles.navRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => { setSelectedEntry(null); setSheetVisible(true); }}
            accessibilityLabel="Add Card"
            accessibilityRole="button"
          >
            <Icon name="plus" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No cards yet</Text>
            <Text style={styles.emptyHint}>Add your first card to get started.</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.addButton}
              onPress={() => {
                setSelectedEntry(null);
                setSheetVisible(true);
              }}
            >
              <Text style={styles.addButtonText}>Add Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.searchBar}>
              <Icon name="search" size={20} color={colors.dim} />
              <TextInput
                style={[styles.flex, styles.searchText]}
                placeholder="Search cards"
                placeholderTextColor={colors.dim}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.listContainer}>
              <InsetGroup>
                {filtered.map((c, i) => (
                  <ListRow
                    key={c.id}
                    divider={i > 0}
                    leading={<Monogram label={c.initial} color={c.color} round />}
                    title={c.name}
                    subtitle={`•••• ${c.last4}  |  Exp ${c.expiry}`}
                    onPress={() => {
                      setSelectedEntry(c);
                      setSheetVisible(true);
                    }}
                    right={<Chevron />}
                  />
                ))}
              </InsetGroup>
            </View>
          </>
        )}
      </ScrollView>

      <CardSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSave={handleSave}
        onDelete={selectedEntry ? handleDelete : undefined}
        entry={selectedEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0, backgroundColor: colors.bg },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: space.md,
  },
  navLeft: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
  },
  navRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  navBackText: {
    fontSize: 17,
    color: colors.blue,
    marginLeft: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  scroll: { paddingBottom: 32 },
  empty: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.dim,
    marginBottom: space.sm,
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
  listContainer: {
    marginTop: space.lg,
  },
});
