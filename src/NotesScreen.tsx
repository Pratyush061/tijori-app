import React, { useEffect, useState } from 'react';
import {
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Chevron, Icon, ListRow, Monogram } from './components';
import type { NoteEntry } from './data';
import { noteStorage } from './storage/asyncStorage';
import { NoteEditorScreen } from './NoteEditorScreen';
import { colors, space, NOTE_TINTS, NOTE_TINT_BORDERS } from './theme';

type Props = {
  onEditingChange?: (isEditing: boolean) => void;
};

export function NotesScreen({ onEditingChange }: Props = {}) {
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

  // Broadcast editor visibility to App.tsx to suppress duplicate NavBar
  useEffect(() => {
    DeviceEventEmitter.emit('noteEditorVisibility', editorVisible);
    onEditingChange?.(editorVisible);
  }, [editorVisible, onEditingChange]);

  useEffect(() => {
    return () => {
      DeviceEventEmitter.emit('noteEditorVisibility', false);
    };
  }, []);

  // The nav bar's "+" emits this so the button opens the note editor.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('actionAdd', () => {
      setSelectedEntry(null);
      setEditorVisible(true);
    });
    return () => sub.remove();
  }, []);

  const handleSave = async (entry: Partial<NoteEntry>): Promise<NoteEntry | undefined> => {
    let result: NoteEntry | undefined;
    if (entry.id) {
      await noteStorage.update(entry.id, entry);
      const list = await noteStorage.list();
      result = list.find(item => item.id === entry.id);
    } else if (selectedEntry) {
      await noteStorage.update(selectedEntry.id, entry);
      const list = await noteStorage.list();
      result = list.find(item => item.id === selectedEntry.id);
    } else {
      result = await noteStorage.create(entry as Omit<NoteEntry, 'id'>);
      setSelectedEntry(result);
    }
    load();
    return result;
  };

  const handleDelete = async () => {
    if (selectedEntry) {
      await noteStorage.delete(selectedEntry.id);
      load();
      setEditorVisible(false);
    }
  };

  const stripHtml = (html: string) => {
    return (
      html
        .replace(/<(br|p|div|h[1-6]|li|blockquote|pre)[^>]*>/gi, ' ')
        .replace(/<[^>]*>?/gm, '')
        .replace(/\s+/g, ' ')
        .trim() || 'No preview'
    );
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
              accessibilityRole="button"
              accessibilityLabel="Add Note"
              onPress={() => {
                setSelectedEntry(null);
                setEditorVisible(true);
              }}
            >
              <Text style={styles.addButtonText}>Add Note</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No notes match</Text>
            <Text style={styles.emptyHint}>Try a different search term.</Text>
          </View>
        ) : (
          <>
            <View style={styles.cardList}>
              {filtered.map(n => {
                const tintKey = n.tint || 'default';
                const tintBg = NOTE_TINTS[tintKey] || NOTE_TINTS.default;
                const tintBorder = NOTE_TINT_BORDERS[tintKey] || colors.sep;
                let dateStr = '';
                if (n.id.includes('-')) {
                  const timestampStr = n.id.split('-')[0];
                  const timestamp = parseInt(timestampStr, 36);
                  if (!isNaN(timestamp)) {
                    dateStr = new Date(timestamp).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                  }
                }
                if (!dateStr) {
                  dateStr = new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                }
                return (
                  <View
                    key={n.id}
                    style={[
                      styles.noteCard,
                      {
                        backgroundColor: tintBg,
                        borderColor: tintBorder,
                      },
                    ]}
                    accessibilityLabel={`Note: ${n.title}`}
                  >
                    <ListRow
                      divider={false}
                      leading={<Monogram label={n.initial} color={n.color} round />}
                      title={n.title}
                      subtitle={`${dateStr} · ${stripHtml(n.body).split('\n')[0]}`}
                      onPress={() => {
                        setSelectedEntry(n);
                        setEditorVisible(true);
                      }}
                      right={<Chevron />}
                    />
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.addButton, styles.addBottomButton]}
              accessibilityRole="button"
              accessibilityLabel="Add Note"
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
  addBottomButton: {
    alignSelf: 'center',
    marginTop: space.xl,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
  cardList: {
    marginTop: space.lg,
    gap: space.sm,
  },
  noteCard: {
    marginHorizontal: space.md,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
