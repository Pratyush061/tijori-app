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

export const darkColors = {
  bg: '#000000',
  card: '#1C1C1E',
  ink: '#FFFFFF',
  ink2: '#EBEBF5',
  dim: '#8E8E93',
  dim2: '#48484A',
  sep: 'rgba(84,84,88,0.65)',
  gold: '#B98A2E',
  goldDark: '#E9C877',
  goldSoft: 'rgba(185,138,46,0.25)',
  heroA: '#2C2C30',
  heroB: '#1C1C1E',
  blue: '#0A84FF',
  pink: '#FF375F',
  green: '#32D74B',
  orange: '#FF9F0A',
  teal: '#64D2FF',
  indigo: '#5E5CE6',
} as const;
