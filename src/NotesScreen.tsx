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
import { NoteEditorScreen } from './NoteEditorScreen';
import { colors, space } from './theme';

export function NotesScreen() {
  const [items, setItems] = useState<NoteEntry[]>([]);
  const [search, setSearch] = useState('');
  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<NoteEntry | null>(null);

  const load = async () => {
    try {
      const data = await noteStorage.list();
      setItems(data);
    } catch (e) {
      console.warn('Failed to load notes', e);
      setItems([]);
    }
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
      setEditorVisible(false);
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>?/gm, '').trim() || 'No preview';
  };

  const filtered = items.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  if (editorVisible) {
    return (
      <NoteEditorScreen
        entry={selectedEntry}
        onClose={() => setEditorVisible(false)}
        onSave={handleSave}
        onDelete={selectedEntry ? handleDelete : undefined}
      />
    );
  }

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
            <Text style={styles.emptyHint}>Add your first note to get started.</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setSelectedEntry(null);
                setEditorVisible(true);
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
                    subtitle={stripHtml(n.body).split('\n')[0]}
                    onPress={() => {
                      setSelectedEntry(n);
                      setEditorVisible(true);
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
                setEditorVisible(true);
              }}
            >
              <Text style={styles.addButtonText}>Add Note</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
});
