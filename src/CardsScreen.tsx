import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
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

  const load = async () => {
    const data = await cardStorage.list();
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

  return (
    <View style={styles.flex}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navLeft} onPress={onBack}>
          <Icon name="chevron" size={24} color={colors.blue} />
          <Text style={styles.navBackText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Cards</Text>
        <View style={styles.navRight}>
          <TouchableOpacity onPress={() => { setSelectedEntry(null); setSheetVisible(true); }}>
            <Icon name="plus" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No cards yet</Text>
            <TouchableOpacity
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
            <View style={{ marginTop: space.lg }}>
              <InsetGroup>
                {items.map((c, i) => (
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
