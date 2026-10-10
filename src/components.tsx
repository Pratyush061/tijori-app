import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, radius, space } from './theme';

/* ------------------------------------------------------------------ icons */

export type IconName =
  | 'vault'
  | 'key'
  | 'cake'
  | 'gear'
  | 'shield'
  | 'lock'
  | 'search'
  | 'plus'
  | 'chevron'
  | 'eye'
  | 'card'
  | 'note';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

function Gear({ color }: { color: string }) {
  return (
    <Path
      fill={color}
      d="M19.14 12.94a7.5 7.5 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.3 7.3 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.61.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.5 7.5 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.34.68.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.26.12.54.02.68-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"
    />
  );
}

export function Icon({ name, size = 22, color = colors.ink, strokeWidth = 1.8 }: IconProps) {
  const s = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'vault' && (
        <>
          <Path {...s} d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
        </>
      )}
      {name === 'key' && (
        <>
          <Circle {...s} cx={8} cy={15} r={4} />
          <Path {...s} d="M10.8 12.2L20 3M17 6l2 2M15 8l2 2" />
        </>
      )}
      {name === 'cake' && (
        <>
          <Path {...s} d="M4 20h16M5 20v-6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6" />
          <Path {...s} d="M12 8V4M12 4c-1.5 0-2.5-1-2.5-2M12 4c1.5 0 2.5-1 2.5-2" />
        </>
      )}
      {name === 'gear' && <Gear color={color} />}
      {name === 'shield' && (
        <>
          <Path {...s} d="M12 3l7 3v5c0 4.4-3 8.3-7 10-4-1.7-7-5.6-7-10V6z" />
          <Path {...s} d="M9 12l2 2 4-4.5" />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect {...s} x={3} y={4} width={18} height={16} rx={4} />
          <Circle {...s} cx={12} cy={12} r={4} />
          <Path {...s} d="M12 8v2M12 14v2M8 12h2M14 12h2" />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle {...s} cx={11} cy={11} r={7} />
          <Path {...s} d="M20 20l-3.5-3.5" />
        </>
      )}
      {name === 'plus' && <Path {...s} d="M12 5v14M5 12h14" />}
      {name === 'chevron' && <Path {...s} d="M9 6l6 6-6 6" />}
      {name === 'eye' && (
        <>
          <Path {...s} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <Circle {...s} cx={12} cy={12} r={3} />
        </>
      )}
      {name === 'card' && (
        <>
          <Rect {...s} x={3} y={6} width={18} height={13} rx={3} />
          <Path {...s} d="M3 10h18M7 15h4" />
        </>
      )}
      {name === 'note' && (
        <>
          <Rect {...s} x={4} y={4} width={16} height={16} rx={3} />
          <Path {...s} d="M8 9h8M8 13h8M8 17h5" />
        </>
      )}
    </Svg>
  );
}

/* ------------------------------------------------------------- primitives */

export function Monogram({
  label,
  color,
  size = 40,
  round = false,
}: {
  label: string;
  color: string;
  size?: number;
  round?: boolean;
}) {
  return (
    <View
      style={[
        styles.monogram,
        {
          width: size,
          height: size,
          borderRadius: round ? size / 2 : Math.round(size * 0.28),
          backgroundColor: color,
        },
      ]}>
      <Text style={[styles.monogramText, { fontSize: Math.round(size * 0.42) }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function InsetGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.inset}>{children}</View>;
}

export function ListRow({
  leading,
  title,
  subtitle,
  right,
  onPress,
  divider = true,
}: {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  divider?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, divider && styles.rowDivider]}>
      {leading}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </TouchableOpacity>
  );
}

export function KeyValueRow({
  label,
  children,
  divider = true,
}: {
  label: string;
  children: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <View style={[styles.krow, divider && styles.rowDivider]}>
      <Text style={styles.krowLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function Chevron() {
  return <Icon name="chevron" size={14} color={colors.dim2} strokeWidth={2.2} />;
}

/* --------------------------------------------------------------- tab bar */

export type TabKey = 'vault' | 'passwords' | 'birthdays' | 'settings';

const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'vault', label: 'Vault', icon: 'vault' },
  { key: 'passwords', label: 'Passwords', icon: 'key' },
  { key: 'birthdays', label: 'Birthdays', icon: 'cake' },
  { key: 'settings', label: 'Settings', icon: 'gear' },
];

export function TabBar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map(t => {
        const on = t.key === active;
        const tint = on ? colors.gold : colors.dim;
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => onChange(t.key)}>
            <Icon name={t.icon} size={23} color={tint} />
            <Text style={[styles.tabLabel, { color: tint }]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ----------------------------------------------------------------- styles */

const styles = StyleSheet.create({
  monogram: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: colors.dim,
    textTransform: 'uppercase',
    paddingHorizontal: space.md,
    paddingTop: space.xl,
    paddingBottom: space.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  inset: {
    backgroundColor: colors.card,
    borderRadius: radius.inset,
    overflow: 'hidden',
    marginHorizontal: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: space.lg,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.sep,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    marginLeft: space.md,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.ink,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.dim,
    marginTop: 1,
  },
  krow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: space.lg,
  },
  krowLabel: {
    fontSize: 15.5,
    color: colors.ink,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 9,
    paddingBottom: 22,
    backgroundColor: 'rgba(249,249,249,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.sep,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '500',
  },
});
