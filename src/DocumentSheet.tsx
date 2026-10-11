import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  View,
  Image,
  Alert,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';

import { DocumentTypes } from './data';
import type { DocumentEntry, DocumentType } from './data';
import { DraggableSheet, SheetScrollView } from './DraggableSheet';
import { Icon } from './components';
import { colors, radius, space } from './theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: Partial<DocumentEntry>) => void;
  onDelete?: () => void;
  entry?: DocumentEntry | null;
};

export function DocumentSheet({
  visible,
  onClose,
  onSave,
  onDelete,
  entry,
}: Props) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DocumentType>('Other');
  const [note, setNote] = useState('');
  const [photoPath, setPhotoPath] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      if (entry) {
        setTitle(entry.title);
        setType(entry.type);
        setNote(entry.note || '');
        setPhotoPath(entry.photoPath);
      } else {
        setTitle('');
        setType('Other');
        setNote('');
        setPhotoPath(undefined);
      }
    }
  }, [visible, entry]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title,
      type,
      note,
      photoPath,
      color: entry?.color || colors.indigo,
      initial: title
        .split(' ')
        .map(n => n.charAt(0).toUpperCase())
        .slice(0, 2)
        .join(''),
    });
    onClose();
  };

  const handlePickImage = async () => {
    Alert.alert('Add Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const res = await launchCamera({ mediaType: 'photo' });
          handleImageResponse(res);
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const res = await launchImageLibrary({ mediaType: 'photo' });
          handleImageResponse(res);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleImageResponse = async (res: any) => {
    if (res.didCancel || !res.assets || res.assets.length === 0) {
      return;
    }
    const asset = res.assets[0];
    if (asset.uri) {
      try {
        const destPath = `${RNFS.DocumentDirectoryPath}/${Date.now()}_${asset.fileName || 'photo.jpg'}`;

        let sourceUri = asset.uri;
        if (sourceUri.startsWith('content://')) {
          await RNFS.copyFile(sourceUri, destPath);
        } else {
          sourceUri = sourceUri.replace('file://', '');
          await RNFS.copyFile(sourceUri, destPath);
        }

        setPhotoPath(`file://${destPath}`);
      } catch (e) {
        console.error('Failed to copy image', e);
        Alert.alert('Error', 'Failed to save the image');
      }
    }
  };


  return (
    <DraggableSheet
      visible={visible}
      onClose={onClose}
      onSave={handleSave}
      title={entry ? 'Edit Document' : 'New Document'}
    >
      <SheetScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.fieldGroup}>
          <TextInput
            style={[styles.input, styles.inputBorder]}
            placeholder="Title (e.g. My Passport)"
            placeholderTextColor={colors.dim}
            value={title}
            onChangeText={setTitle}
          />
          <View style={styles.typePickerWrap}>
            <Text style={styles.pickerLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typePicker}>
              {DocumentTypes.map(t => (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.7}
                  style={[styles.typeChip, type === t && styles.typeChipActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <TextInput
            style={styles.input}
            placeholder="Note (optional)"
            placeholderTextColor={colors.dim}
            value={note}
            onChangeText={setNote}
          />
        </View>

        <View style={styles.fieldGroup}>
          {photoPath ? (
            <View style={styles.photoWrap}>
              <Image source={{ uri: photoPath }} style={styles.photo} />
              <TouchableOpacity activeOpacity={0.7} style={styles.removePhoto} onPress={() => setPhotoPath(undefined)}>
                <Icon name="plus" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity activeOpacity={0.7} style={styles.photoButton} onPress={handlePickImage}>
              <Icon name="plus" size={20} color={colors.blue} />
              <Text style={styles.photoButtonText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {entry && onDelete && (
          <TouchableOpacity activeOpacity={0.7} style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteButtonText}>Delete Document</Text>
          </TouchableOpacity>
        )}
      </SheetScrollView>
    </DraggableSheet>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: space.md,
  },
  fieldGroup: {
    backgroundColor: colors.card,
    borderRadius: radius.inset,
    marginBottom: space.md,
    overflow: 'hidden',
  },
  input: {
    height: 44,
    paddingHorizontal: space.lg,
    fontSize: 16,
    color: colors.ink,
  },
  inputBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sep,
  },
  typePickerWrap: {
    paddingVertical: space.sm,
  },
  pickerLabel: {
    paddingHorizontal: space.lg,
    fontSize: 13,
    color: colors.dim,
    marginBottom: space.xs,
  },
  typePicker: {
    paddingHorizontal: space.md,
    gap: space.xs,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(118,118,128,0.12)',
    marginRight: space.xs,
  },
  typeChipActive: {
    backgroundColor: colors.ink,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink2,
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    gap: space.xs,
  },
  photoButtonText: {
    fontSize: 16,
    color: colors.blue,
  },
  photoWrap: {
    alignItems: 'center',
    padding: space.lg,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: radius.inset,
    resizeMode: 'cover',
  },
  removePhoto: {
    position: 'absolute',
    top: space.lg + space.sm,
    right: space.lg + space.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  deleteButton: {
    backgroundColor: colors.card,
    borderRadius: radius.inset,
    padding: 14,
    alignItems: 'center',
    marginTop: space.lg,
    marginBottom: space.xl * 2,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.pink,
  },
});
