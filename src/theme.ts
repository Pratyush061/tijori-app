/**
 * Tijori design tokens.
 *
 * The palette is built on Apple's iOS system greys, with a single warm gold
 * as the brand signature (a "tijori" is a vault, so gold earns its place).
 * Colour is reserved for iconography and state — never for decoration.
 */
export const colors = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  ink: '#1C1C1E',
  ink2: '#3A3A3C',
  dim: '#8E8E93',
  dim2: '#C7C7CC',
  sep: 'rgba(60,60,67,0.10)',
  gold: '#B98A2E',
  goldDark: '#8F6A1F',
  goldSoft: 'rgba(185,138,46,0.13)',
  heroA: '#2C2C30',
  heroB: '#141416',
  blue: '#0A84FF',
  pink: '#FF375F',
  green: '#34C759',
  orange: '#FF9F0A',
  teal: '#30B0C7',
  indigo: '#5E5CE6',
  red: '#FF3B30',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
} as const;

export const radius = {
  card: 20,
  inset: 16,
  pill: 999,
} as const;

export type NoteTintKey = 'default' | 'mint' | 'lemon' | 'peach' | 'sky' | 'lavender';

export const NOTE_TINTS: Record<NoteTintKey, string> = {
  default: '#FFFFFF',
  mint: '#EBF6EF',
  lemon: '#FFFBEA',
  peach: '#FFF2EC',
  sky: '#EBF5FB',
  lavender: '#F5EFFB',
} as const;

export const NOTE_TINT_BORDERS: Record<NoteTintKey, string> = {
  default: '#E5E5EA',
  mint: '#D0EBD8',
  lemon: '#FCEFC2',
  peach: '#FED9C9',
  sky: '#CEE5F6',
  lavender: '#E4D3F5',
} as const;

export const NOTE_TINT_NAMES: Record<NoteTintKey, string> = {
  default: 'Default',
  mint: 'Mint',
  lemon: 'Lemon',
  peach: 'Peach',
  sky: 'Sky',
  lavender: 'Lavender',
} as const;

