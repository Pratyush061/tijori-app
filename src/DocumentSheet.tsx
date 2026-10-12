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
import { errorCodes, isErrorWithCode, keepLocalCopy, pick, types } from '@react-native-documents/picker';
import { viewDocument } from '@react-native-documents/viewer';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';

import { documentBadge, DocumentTypes, formatFileSize, isImageDocument } from './data';
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
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [mimeType, setMimeType] = useState<string | undefined>(undefined);
  const [sizeBytes, setSizeBytes] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      if (entry) {
        setTitle(entry.title);
        setType(entry.type);
        setNote(entry.note || '');
        setPhotoPath(entry.photoPath);
        setFileName(entry.fileName);
        setMimeType(entry.mimeType);
        setSizeBytes(entry.sizeBytes);
      } else {
        setTitle('');
        setType('Other');
        setNote('');
        setPhotoPath(undefined);
        setFileName(undefined);
        setMimeType(undefined);
        setSizeBytes(undefined);
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
      fileName,
      mimeType,
      sizeBytes,
      color: entry?.color || colors.indigo,
      initial: title
        .split(' ')
        .map(n => n.charAt(0).toUpperCase())
        .slice(0, 2)
        .join(''),
    });
    onClose();
  };

  const clearAttachment = () => {
    setPhotoPath(undefined);
    setFileName(undefined);
    setMimeType(undefined);
    setSizeBytes(undefined);
  };

  const handlePickAttachment = () => {
    Alert.alert('Add Attachment', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => handleImageResponse(await launchCamera({ mediaType: 'photo' })),
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => handleImageResponse(await launchImageLibrary({ mediaType: 'photo' })),
      },
      { text: 'Upload a File', onPress: handleUploadFile },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleImageResponse = async (res: any) => {
    if (res.didCancel || !res.assets || res.assets.length === 0) {
      return;
    }
    const asset = res.assets[0];
    if (!asset.uri) return;

    const name = asset.fileName || `photo-${Date.now()}.jpg`;
    try {
      const destPath = `${RNFS.DocumentDirectoryPath}/${Date.now()}_${name}`;
      const sourceUri = asset.uri.startsWith('content://')
        ? asset.uri
        : asset.uri.replace('file://', '');
      await RNFS.copyFile(sourceUri, destPath);

      setPhotoPath(`file://${destPath}`);
      setFileName(name);
      setMimeType(asset.type);
      setSizeBytes(asset.fileSize);
    } catch (e) {
      console.error('Failed to copy image', e);
      Alert.alert('Error', 'Failed to save the image');
    }
  };

  // Any file, not just a photo — a PDF, a DOCX, a spreadsheet, whatever the
  // device's document picker offers. The picked uri is copied into the app's own
  // storage, because a content:// uri only stays readable for the life of the
  // activity that received it.
  const handleUploadFile = async () => {
    try {
      const [picked] = await pick({ type: [types.allFiles], allowMultiSelection: false });

      const [copy] = await keepLocalCopy({
        files: [{ uri: picked.uri, fileName: picked.name ?? `file-${Date.now()}` }],
        destination: 'documentDirectory',
      });

      if (copy.status !== 'success') {
        Alert.alert('Error', 'Could not save the selected file.');
        return;
      }

      setPhotoPath(copy.localUri);
      setFileName(picked.name ?? undefined);
      setMimeType(picked.type ?? undefined);
      setSizeBytes(picked.size ?? undefined);

      // A file usually names itself better than the user would type it.
      if (!title.trim() && picked.name) {
        setTitle(picked.name.replace(/\.[^.]+$/, ''));
      }
    } catch (e) {
      if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) return;
      Alert.alert('Error', 'Could not open the file picker.');
    }
  };

  const handleOpen = async () => {
    if (!photoPath) return;
    try {
      await viewDocument({ uri: photoPath, mimeType, grantPermissions: 'read' });
    } catch {
      Alert.alert('Error', 'No app on this device can open this file.');
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
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
          {!photoPath ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.photoButton}
              onPress={handlePickAttachment}
              accessibilityLabel="Add attachment"
            >
              <Icon name="plus" size={20} color={colors.blue} />
              <Text style={styles.photoButtonText}>Add Photo or File</Text>
            </TouchableOpacity>
          ) : isImageDocument({ photoPath, fileName, mimeType }) ? (
            <View style={styles.photoWrap}>
              <Image source={{ uri: photoPath }} style={styles.photo} />
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.removePhoto}
                onPress={clearAttachment}
                accessibilityLabel="Remove attachment"
              >
                <Icon name="plus" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.fileRow}>
              <View style={styles.fileBadge}>
                <Text style={styles.fileBadgeText}>{documentBadge({ fileName, photoPath })}</Text>
              </View>
              <View style={styles.fileMeta}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {fileName || 'Attached file'}
                </Text>
                <Text style={styles.fileSize}>{formatFileSize(sizeBytes) || 'Tap the eye to open'}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.fileAction}
                onPress={handleOpen}
                accessibilityLabel="Open attachment"
              >
                <Icon name="eye" size={20} color={colors.blue} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.fileAction}
                onPress={clearAttachment}
                accessibilityLabel="Remove attachment"
              >
                <Text style={styles.fileRemoveText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {entry && onDelete && (
          <TouchableOpacity activeOpacity={0.7} style={styles.deleteButton} onPress={confirmDelete}>
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
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
  },
  fileBadge: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldSoft,
  },
  fileBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.goldDark,
  },
  fileMeta: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: 16,
    color: colors.ink,
  },
  fileSize: {
    fontSize: 13,
    color: colors.dim,
    marginTop: 2,
  },
  fileAction: {
    paddingHorizontal: space.xs,
    paddingVertical: space.xs,
  },
  fileRemoveText: {
    fontSize: 15,
    color: colors.pink,
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
