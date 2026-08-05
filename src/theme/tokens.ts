/**
 * Design tokens — MoodMate Premium Design System
 * Extended with: gradients, glassmorphism, glow shadows, animation constants
 */

export const colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg: '#FAF7F2',            // warm cream (unified — was #FBF5EC / #F4F6F9)
  surface: '#FFFFFF',
  ink: '#2B2530',
  inkSoft: '#6B6470',
  inkFaint: '#A7A1AC',

  // ── Brand palette ─────────────────────────────────────────────────────────
  coral: '#FF6F4D',
  coralDeep: '#E85A39',
  coralSoft: '#FFE4DA',
  coralLight: '#FFF0EC',

  blue: '#5C8AE6',
  blueSoft: '#E3ECFC',

  sage: '#5F9E7C',
  sageSoft: '#E1F0E5',

  lavender: '#8E7BC0',
  lavenderSoft: '#EFE9F8',
  lavenderDeep: '#6B5BA0',

  sun: '#FFC857',
  sunSoft: '#FFF3D9',
  sunText: '#5A4300',

  line: 'rgba(43,37,48,0.10)',
  shadow: 'rgba(43,37,48,0.12)',
} as const;

// ── Gradient presets ────────────────────────────────────────────────────────
export const gradients = {
  // Auth backgrounds — dark but rich, not pitch black
  dark:     ['#0D0D1A', '#0F1F2E', '#0D1B0F'] as const,
  darkRich: ['#16103A', '#1E1050', '#0F1B30'] as const,

  // Home header — vibrant coral→purple brand gradient (warm, premium)
  header:   ['#FF6F4D', '#C84895', '#7B3CC9'] as const,

  // Brand CTAs
  coral:    ['#FF6F4D', '#FF8F6F'] as const,
  coralBtn: ['#FF6F4D', '#FF5C35'] as const,

  // Card accents
  sage:     ['#5F9E7C', '#3E8060'] as const,
  lavender: ['#8E7BC0', '#6B5BA0'] as const,
  sun:      ['#FFC857', '#FFB020'] as const,
  blue:     ['#5C8AE6', '#3D6FD4'] as const,

  // Signup header
  signup:   ['#FF6F4D', '#FF9A7A', '#FFF5F2'] as const,

  // Onboarding slides — rich but not pitch-black
  onboard1: ['#0D1B12', '#1B3A2B', '#2D6A4F'] as const,  // warm forest green
  onboard2: ['#16103A', '#2D1B69', '#6B3FA0'] as const,  // rich purple (not black)
  onboard3: ['#0A1830', '#163060', '#1E4A8A'] as const,  // deep ocean blue
} as const;

// ── Glassmorphism ───────────────────────────────────────────────────────────
export const glass = {
  // Light surfaces (on white/cream backgrounds)
  lightFill:   'rgba(255,255,255,0.88)',
  lightBorder: 'rgba(255,255,255,0.6)',

  // Dark surfaces (on gradient/dark backgrounds)
  darkFill:   'rgba(255,255,255,0.09)',
  darkBorder: 'rgba(255,255,255,0.18)',

  // Stat pills on dark header
  statFill:   'rgba(255,255,255,0.12)',
  statBorder: 'rgba(255,255,255,0.20)',

  // Card overlay on light
  cardFill:   'rgba(255,255,255,0.72)',
  cardBorder: 'rgba(255,255,255,0.50)',
} as const;

// ── Glow / colored shadows ───────────────────────────────────────────────────
export const glow = {
  coral:    'rgba(255,111,77,0.28)',
  sage:     'rgba(95,158,124,0.25)',
  lavender: 'rgba(142,123,192,0.28)',
  blue:     'rgba(92,138,230,0.28)',
  sun:      'rgba(255,200,87,0.30)',
  dark:     'rgba(8,8,15,0.45)',
} as const;

// ── Animation spring presets ─────────────────────────────────────────────────
export const springs = {
  // Snappy response (buttons, presses)
  fast:   { friction: 7,  tension: 180 } as const,
  // Bouncy entry (cards, modals)
  bounce: { friction: 5,  tension: 120 } as const,
  // Gentle float (background orbs)
  gentle: { friction: 12, tension: 60  } as const,
  // Standard navigation
  nav:    { friction: 8,  tension: 150 } as const,
} as const;

// ── Timing (ms) ──────────────────────────────────────────────────────────────
export const timing = {
  shimmer:  700,
  stagger:  40,    // per-letter stagger
  cardEntry: 80,   // stagger between cards
  orbCycle: 4000,  // float orb loop
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 26,
  xl: 30,
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

// NOTE: load 'Baloo2-Bold'/'Baloo2-SemiBold' and 'DMSans-Regular'/'DMSans-Medium'/'DMSans-Bold'
// via expo-font (see App.tsx).
export const fonts = {
  display: 'Baloo2-Bold',
  displaySemibold: 'Baloo2-SemiBold',
  body: 'DMSans-Regular',
  bodyMedium: 'DMSans-Medium',
  bodyBold: 'DMSans-Bold',
} as const;

export const fontSizes = {
  xs: 10.5,
  sm: 12,
  base: 13,
  md: 14,
  lg: 16,
  xl: 19,
  xxl: 22,
  display: 26,
} as const;

export const shadow = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,   // Android — stronger than 2 to match iOS look
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.48,
    shadowRadius: 16,
    elevation: 10,  // Android
  },
  // Colored glow variants
  coralGlow: {
    shadowColor: glow.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  lavenderGlow: {
    shadowColor: glow.lavender,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  sageGlow: {
    shadowColor: glow.sage,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const theme = { colors, gradients, glass, glow, springs, timing, radii, spacing, fonts, fontSizes, shadow };
export type Theme = typeof theme;
