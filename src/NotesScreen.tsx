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
import type { NoteEntry } from './data';
import { noteStorage } from './storage/asyncStorage';
import { NoteSheet } from './NoteSheet';
import { colors, space } from './theme';

export function NotesScreen() {
  const [items, setItems] = useState<NoteEntry[]>([]);
  const [search, setSearch] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<NoteEntry | null>(null);

  const load = async () => {
    const data = await noteStorage.list();
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (entry: Partial<NoteEntry>) => {
    if (selectedEntry) {
      await noteStorage.update(selectedEntry.id, entry);
    } else {
      await noteStorage.create(entry as Omit<NoteEntry, 'id'>);
    }
    load();
  };

  const handleDelete = async () => {
    if (selectedEntry) {
      await noteStorage.delete(selectedEntry.id);
      load();
      setSheetVisible(false);
    }
  };

  const filtered = items.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.flex}>
      <View style={styles.searchBar}>
        <Icon name="search" size={18} color={colors.dim} strokeWidth={2.5} />
        <TextInput
          style={[styles.flex, styles.searchText]}
          placeholder="Search notes"
          placeholderTextColor={colors.dim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setSelectedEntry(null);
                setSheetVisible(true);
              }}
            >
              <Text style={styles.addButtonText}>Add Note</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={{ marginTop: space.lg }}>
              <InsetGroup>
                {filtered.map((n, i) => (
                  <ListRow
                    key={n.id}
                    divider={i > 0}
                    leading={<Monogram label={n.initial} color={n.color} round />}
                    title={n.title}
                    subtitle={n.body.split('\n')[0]}
                    onPress={() => {
                      setSelectedEntry(n);
                      setSheetVisible(true);
                    }}
                    right={<Chevron />}
                  />
                ))}
              </InsetGroup>
            </View>

            <TouchableOpacity
              style={[styles.addButton, { alignSelf: 'center', marginTop: space.xl, paddingHorizontal: space.xl, paddingVertical: space.sm }]}
              onPress={() => {
                setSelectedEntry(null);
                setSheetVisible(true);
              }}
            >
              <Text style={styles.addButtonText}>Add Note</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <NoteSheet
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
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingBottom: 32 },
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
  empty: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.dim,
    marginBottom: space.lg,
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
});
