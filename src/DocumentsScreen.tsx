import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
} from 'react-native';

import { Chevron, Icon, InsetGroup, ListRow } from './components';
import type { DocumentEntry } from './data';
import RNFS from 'react-native-fs';

import { documentStorage } from './storage/asyncStorage';
import { DocumentSheet } from './DocumentSheet';
import { colors, space } from './theme';

type Props = {
  onBack: () => void;
};

export function DocumentsScreen({ onBack }: Props) {
  const [items, setItems] = useState<DocumentEntry[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DocumentEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    try {
      const data = await documentStorage.list();
      setItems(data);
    } catch (e) {
      console.warn('Failed to load documents', e);
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (entry: Partial<DocumentEntry>) => {
    if (selectedEntry) {
      await documentStorage.update(selectedEntry.id, entry);
    } else {
      await documentStorage.create(entry as Omit<DocumentEntry, 'id'>);
    }
    load();
  };

  const handleDelete = async () => {
    if (selectedEntry) {
      const photo = selectedEntry.photoPath;
      await documentStorage.delete(selectedEntry.id);
      if (photo) {
        // Remove the stored image too, so deleting a document does not leave
        // its photo behind on disk.
        try {
          await RNFS.unlink(photo.replace(/^file:\/\//, ''));
        } catch {
          // The file may already be gone; the record is what matters.
        }
      }
      load();
      setSheetVisible(false);
    }
  };

  const filtered = items.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.flex}>
      <View style={styles.nav}>
        <TouchableOpacity activeOpacity={0.7} style={styles.navLeft} onPress={onBack}>
          <Icon name="chevron" size={24} color={colors.blue} />
          <Text style={styles.navBackText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Documents</Text>
        <View style={styles.navRight}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => { setSelectedEntry(null); setSheetVisible(true); }}>
            <Icon name="plus" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No documents yet</Text>
            <Text style={styles.emptyHint}>Add your first document to get started.</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.addButton}
              onPress={() => {
                setSelectedEntry(null);
                setSheetVisible(true);
              }}
            >
              <Text style={styles.addButtonText}>Add Document</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.searchBar}>
              <Icon name="search" size={20} color={colors.dim} />
              <TextInput
                style={[styles.flex, styles.searchText]}
                placeholder="Search documents"
                placeholderTextColor={colors.dim}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.listContainer}>
              <InsetGroup>
                {filtered.map((d, i) => (
                  <ListRow
                    key={d.id}
                    divider={i > 0}
                    leading={
                      d.photoPath ? (
                        <Image source={{ uri: d.photoPath }} style={styles.thumbnail} />
                      ) : (
                        <View style={[styles.thumbnailPlaceholder, { backgroundColor: d.color }]}>
                          <Icon name="document" size={24} color="#FFF" />
                        </View>
                      )
                    }
                    title={d.title}
                    subtitle={d.type}
                    onPress={() => {
                      setSelectedEntry(d);
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

      <DocumentSheet
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
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    marginTop: space.lg,
  }
});
