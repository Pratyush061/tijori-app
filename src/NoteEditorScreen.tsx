import React, { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { RichEditor, type RichEditorHandle } from './RichEditor';
import { colors, space } from './theme';
import type { NoteEntry } from './data';
import { Icon } from './components';

type Props = {
  entry?: NoteEntry | null;
  onClose: () => void;
  onSave: (entry: Partial<NoteEntry>) => void;
  onDelete?: () => void;
};

const PALETTE = ['#111111', '#FF6B00', '#0A84FF', '#34C759', '#FF2D55', '#AF52DE'];

// Notes created before the rich-text editor are plain text. Turn their line
// breaks into <br> so they open looking the way they were written.
function toEditableHTML(body: string) {
  if (!body) return '';
  if (/<[a-z][\s\S]*>/i.test(body)) return body;
  return body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

export function NoteEditorScreen({ entry, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(entry?.title || '');
  const [showColors, setShowColors] = useState(false);
  const editorRef = useRef<RichEditorHandle>(null);

  const run = (command: string, value?: string) => {
    editorRef.current?.exec(command, value);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const body = editorRef.current?.getHTML() ?? entry?.body ?? '';

    onSave({
      title,
      body,
      color: entry?.color || colors.orange,
      initial: title
        .split(' ')
        .map(n => n.charAt(0).toUpperCase())
        .slice(0, 2)
        .join(''),
    });
    onClose();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton} hitSlop={8}>
          <Icon name="chevron" color={colors.ink} size={22} />
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>

        {entry && onDelete ? (
          <TouchableOpacity onPress={onDelete} style={styles.headerButton} hitSlop={8}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        <TouchableOpacity onPress={handleSave} style={styles.headerButton} hitSlop={8}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.titleInput}
        placeholder="Note Title"
        placeholderTextColor={colors.dim}
        value={title}
        onChangeText={setTitle}
      />

      <View style={styles.editorWrap}>
        <RichEditor
          ref={editorRef}
          initialHTML={toEditableHTML(entry?.body || '')}
          accent={colors.orange}
        />
      </View>

      {showColors && (
        <View style={styles.colorRow}>
          {PALETTE.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => {
                run('foreColor', c);
                setShowColors(false);
              }}
              style={[styles.swatch, { backgroundColor: c }]}
              accessibilityLabel={`Text colour ${c}`}
            />
          ))}
        </View>
      )}

      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
          keyboardShouldPersistTaps="always"
        >
          <ToolButton label="B" bold onPress={() => run('bold')} />
          <ToolButton label="I" italic onPress={() => run('italic')} />
          <ToolButton label="U" underline onPress={() => run('underline')} />
          <ToolButton label="S" strike onPress={() => run('strikeThrough')} />
          <Divider />
          <ToolButton label="A-" onPress={() => run('fontSize', '2')} />
          <ToolButton label="A+" onPress={() => run('fontSize', '5')} />
          <ToolButton label="H1" onPress={() => run('formatBlock', '<h1>')} />
          <ToolButton label="H2" onPress={() => run('formatBlock', '<h2>')} />
          <ToolButton label="¶" onPress={() => run('formatBlock', '<p>')} />
          <Divider />
          <ToolButton label="•" onPress={() => run('insertUnorderedList')} />
          <ToolButton label="1." onPress={() => run('insertOrderedList')} />
          <ToolButton label="❝" onPress={() => run('formatBlock', '<blockquote>')} />
          <ToolButton label="</>" onPress={() => run('formatBlock', '<pre>')} />
          <Divider />
          <ToolButton
            label="A"
            color={colors.orange}
            onPress={() => setShowColors(v => !v)}
          />
        </ScrollView>
      </View>
    </View>
  );
}

function ToolButton({
  label,
  onPress,
  bold,
  italic,
  underline,
  strike,
  color,
}: {
  label: string;
  onPress: () => void;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.toolButton}
      accessibilityRole="button"
      accessibilityLabel={`Format ${label}`}
    >
      <Text
        style={[
          styles.toolButtonText,
          color ? { color } : null,
          bold ? styles.bold : null,
          italic ? styles.italic : null,
          underline ? styles.underline : null,
          strike ? styles.strike : null,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sep,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.xs,
  },
  headerButtonText: {
    fontSize: 17,
    color: colors.ink,
  },
  deleteButtonText: {
    fontSize: 17,
    color: colors.pink,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.blue,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
    color: colors.ink,
  },
  editorWrap: {
    flex: 1,
  },
  colorRow: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.sep,
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  toolbar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.sep,
    backgroundColor: colors.bg,
  },
  toolbarContent: {
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.xs,
  },
  toolButton: {
    minWidth: 40,
    height: 38,
    paddingHorizontal: space.sm,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  toolButtonText: {
    fontSize: 16,
    color: colors.ink,
  },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
  strike: { textDecorationLine: 'line-through' },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: colors.sep,
    marginHorizontal: space.xs,
  },
});
