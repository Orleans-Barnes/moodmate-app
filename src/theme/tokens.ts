/**
 * Design tokens — MoodMate UI Polish
 * Direction: clean white cards, deep forest green brand, elegant typography
 * Inspired by reference UI + new two-tone sage/forest green "M" logo
 */

export const colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg: '#F4F7F5',
  bgAlt: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F5F2',

  // ── Text ─────────────────────────────────────────────────────────────────
  ink: '#1A2E25',
  inkSoft: '#4A6355',
  inkFaint: '#8FA99A',
  inkInverse: '#FFFFFF',

  // ── Brand — forest green (matches new logo) ───────────────────────────────
  primary: '#2A5C45',
  primaryMid: '#3D7A5C',
  primaryLight: '#5F9E7C',
  primarySoft: '#E4EFE9',
  primaryFaint: '#F0F7F3',

  // ── Backwards compat aliases ──────────────────────────────────────────────
  coral: '#2A5C45',
  coralDeep: '#1E4433',
  coralSoft: '#E4EFE9',
  coralLight: '#F0F7F3',
  sage: '#5F9E7C',
  sageSoft: '#E4EFE9',
  lavender: '#2A5C45',
  lavenderSoft: '#E4EFE9',
  lavenderDeep: '#1E4433',
  blue: '#1B8C6E',
  blueSoft: '#D6EFE8',
  sun: '#D4A017',
  sunSoft: '#FEF3C7',
  sunText: '#1A2E25',
  // ── Warm accents (sand / gold / clay) ─────────────────────────────────────
  sand: '#F7F1E4',
  sandLine: '#E8DCC4',
  sandInk: '#6B5426',
  sandInkDark: '#3A2E18',

  gold: '#C9A227',
  goldSoft: '#F0E4CB',

  clay: '#8F4A32',
  claySoft: '#F7E7E0',

  hair: '#DCE8E1',
  // ── Accent ────────────────────────────────────────────────────────────────
  accent: '#1B8C6E',
  accentSoft: '#D6EFE8',

  // ── Status ────────────────────────────────────────────────────────────────
  success: '#2A5C45',
  warning: '#D4A017',
  warningSoft: '#FEF3C7',
  error: '#C0392B',
  errorSoft: '#FDECEA',

  // ── Neutrals ──────────────────────────────────────────────────────────────
  border: 'rgba(42,92,69,0.12)',
  borderStrong: 'rgba(42,92,69,0.22)',
  divider: 'rgba(42,92,69,0.08)',
  line: 'rgba(42,92,69,0.10)',
  shadow: 'rgba(26,46,37,0.14)',
  overlay: 'rgba(26,46,37,0.45)',
} as const;

// ── Gradient presets ────────────────────────────────────────────────────────
export const gradients = {
  primary:    ['#2A5C45', '#3D7A5C'] as const,
  primaryBtn: ['#2A5C45', '#1E4433'] as const,
  header:     ['#1E3D2F', '#2A5C45', '#3D7A5C'] as const,
  dark:       ['#0D1B12', '#1B3A2B', '#2A5C45'] as const,
  darkRich:   ['#0A1F15', '#152E22', '#1B3A2B'] as const,
  signup:     ['#1E3D2F', '#2A5C45', '#3D7A5C'] as const,
  onboard1:   ['#0D1B12', '#1B3A2B', '#2A5C45'] as const,
  onboard2:   ['#152E22', '#2A5C45', '#3D7A5C'] as const,
  onboard3:   ['#0A1F15', '#1A3D2A', '#2E6B4F'] as const,
  sage:       ['#5F9E7C', '#3D7A5C'] as const,
  teal:       ['#1B8C6E', '#156B55'] as const,
  warm:       ['#D4A017', '#B8860B'] as const,

  // Backwards compat
  coral:      ['#2A5C45', '#3D7A5C'] as const,
  coralBtn:   ['#2A5C45', '#1E4433'] as const,
  lavender:   ['#5F9E7C', '#3D7A5C'] as const,
  blue:       ['#1B8C6E', '#156B55'] as const,
  sun:        ['#D4A017', '#B8860B'] as const,
} as const;

// ── Glassmorphism ───────────────────────────────────────────────────────────
export const glass = {
  lightFill:   'rgba(255,255,255,0.90)',
  lightBorder: 'rgba(255,255,255,0.65)',
  darkFill:    'rgba(42,92,69,0.12)',
  darkBorder:  'rgba(255,255,255,0.18)',
  statFill:    'rgba(255,255,255,0.14)',
  statBorder:  'rgba(255,255,255,0.22)',
  cardFill:    'rgba(255,255,255,0.80)',
  cardBorder:  'rgba(255,255,255,0.55)',
} as const;

// ── Glow / colored shadows ───────────────────────────────────────────────────
export const glow = {
  primary:  'rgba(42,92,69,0.28)',
  sage:     'rgba(95,158,124,0.25)',
  teal:     'rgba(27,140,110,0.28)',
  warm:     'rgba(212,160,23,0.30)',
  dark:     'rgba(10,20,15,0.45)',

  // Backwards compat
  coral:    'rgba(42,92,69,0.28)',
  lavender: 'rgba(95,158,124,0.25)',
  blue:     'rgba(27,140,110,0.28)',
  sun:      'rgba(212,160,23,0.30)',
} as const;

// ── Animation spring presets ─────────────────────────────────────────────────
export const springs = {
  fast:   { friction: 7,  tension: 180 } as const,
  bounce: { friction: 5,  tension: 120 } as const,
  gentle: { friction: 12, tension: 60  } as const,
  nav:    { friction: 8,  tension: 150 } as const,
} as const;

// ── Timing (ms) ──────────────────────────────────────────────────────────────
export const timing = {
  shimmer:   700,
  stagger:   40,
  cardEntry: 80,
  orbCycle:  4000,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const fonts = {
  display:         'Baloo2-Bold',
  displaySemibold: 'Baloo2-SemiBold',
  body:            'DMSans-Regular',
  bodyMedium:      'DMSans-Medium',
  bodyBold:        'DMSans-Bold',
} as const;

export const fontSizes = {
  xs:      10.5,
  sm:      12,
  base:    13,
  md:      14,
  lg:      16,
  xl:      19,
  xxl:     22,
  display: 26,
} as const;

export const shadow = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.40,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.44,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryGlow: {
    shadowColor: glow.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 7,
  },
  sageGlow: {
    shadowColor: glow.sage,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 7,
  },

  // Backwards compat
  coralGlow: {
    shadowColor: glow.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 7,
  },
  lavenderGlow: {
    shadowColor: glow.sage,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 7,
  },
} as const;

export const theme = { colors, gradients, glass, glow, springs, timing, radii, spacing, fonts, fontSizes, shadow };
export type Theme = typeof theme;