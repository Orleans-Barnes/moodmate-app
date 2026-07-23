/**
 * Design tokens — MoodMate "Serene Pulse" Design System
 * Extended with: gradients, glassmorphism, glow shadows, animation constants
 */

export const colors = {
  // ── Backgrounds / surfaces ──────────────────────────────────────────────
  bg: '#FFF7FE',                    // soft lavender / off-white (was warm cream #FAF7F2)
  surface: '#FFFFFF',               // surface-container-lowest — cards
  surfaceDim: '#E1D6E5',
  surfaceContainerLow: '#FBF0FF',
  surfaceContainer: '#F5E9F7',
  surfaceContainerHigh: '#EFE3F2',
  surfaceContainerHighest: '#E9DDEC',

  ink: '#2B2530',                   // text-primary — deep charcoal
  inkSoft: '#6F6478',                // text-variant — muted purple-grey
  inkFaint: '#9B8FA3',              // derived faint text, between inkSoft and outlineVariant

  outline: '#807489',
  outlineVariant: '#D2C2DA',

  // ── Brand palette ─────────────────────────────────────────────────────────
  coral: '#FF6F4D',                 // primary
  coralDeep: '#E85A39',             // pressed/active state
  coralSoft: '#FFDED6',             // primary-container
  coralLight: '#FFF3EF',

  blue: '#5C8AE6',
  blueSoft: '#E3ECFC',

  sage: '#7DBE9E',                  // secondary — sage green (was #5F9E7C)
  sageSoft: '#CEF5DF',              // secondary-container

  lavender: '#8E7BC0',
  lavenderSoft: '#EFE9F8',
  lavenderDeep: '#6B5BA0',

  sun: '#FFC857',
  sunSoft: '#FFF3D9',
  sunText: '#5A4300',

  line: 'rgba(43,37,48,0.10)',
  shadow: 'rgba(43,37,48,0.12)',    // matches --shadow-elevation opacity exactly
} as const;

// ── Gradient presets ────────────────────────────────────────────────────────
export const gradients = {
  // Auth backgrounds — dark but rich, not pitch black
  dark:     ['#0D0D1A', '#0F1F2E', '#0D1B0F'] as const,
  darkRich: ['#16103A', '#1E1050', '#0F1B30'] as const,

  // Home header — coral→lavender brand gradient (serene, not carnival-vibrant)
  header:   ['#FF6F4D', '#E893A8', '#8E7BC0'] as const,

  // Brand CTAs
  coral:    ['#FF6F4D', '#FF8F6F'] as const,
  coralBtn: ['#FF6F4D', '#FF5C35'] as const,

  // Card accents
  sage:     ['#7DBE9E', '#4F9A76'] as const,
  lavender: ['#8E7BC0', '#6B5BA0'] as const,
  sun:      ['#FFC857', '#FFB020'] as const,
  blue:     ['#5C8AE6', '#3D6FD4'] as const,

  // Signup header
  signup:   ['#FF6F4D', '#FF9A7A', '#FFF7FE'] as const,

  // Onboarding slides — rich but not pitch-black
  onboard1: ['#0D1B12', '#1B3A2B', '#2D6A4F'] as const,  // warm forest green
  onboard2: ['#16103A', '#2D1B69', '#6B3FA0'] as const,  // rich purple (not black)
  onboard3: ['#0A1830', '#163060', '#1E4A8A'] as const,  // deep ocean blue
} as const;

// ── Glassmorphism ───────────────────────────────────────────────────────────
export const glass = {
  // Light surfaces (on lavender/white backgrounds) — matches .glass-panel exactly
  // (background: rgba(255,255,255,0.6), border: rgba(255,255,255,0.3))
  lightFill:   'rgba(255,255,255,0.6)',
  lightBorder: 'rgba(255,255,255,0.3)',

  // Dark surfaces (on gradient/dark backgrounds)
  darkFill:   'rgba(255,255,255,0.09)',
  darkBorder: 'rgba(255,255,255,0.18)',

  // Stat pills on dark header
  statFill:   'rgba(255,255,255,0.12)',
  statBorder: 'rgba(255,255,255,0.20)',

  // Card overlay on light
  cardFill:   'rgba(255,255,255,0.72)',
  cardBorder: 'rgba(255,255,255,0.50)',

  // --glass-blur: 20px (used by GlassView's BlurView intensity)
  blur: 20,
} as const;

// ── Glow / colored shadows ───────────────────────────────────────────────────
export const glow = {
  coral:    'rgba(255,111,77,0.28)',
  sage:     'rgba(125,190,158,0.25)',
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
  sm: 8,
  md: 12,    // button roundness
  lg: 16,
  xl: 24,    // standard card roundness
  xxl: 32,
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

// NOTE: load 'PlusJakartaSans-Regular'/'-Medium'/'-SemiBold'/'-Bold' via expo-font (see App.tsx).
// Single-family system per Serene Pulse spec — weight alone carries the hierarchy that used to
// come from mixing Baloo2 (display) + DMSans (body).
export const fonts = {
  display: 'PlusJakartaSans-Bold',
  displaySemibold: 'PlusJakartaSans-SemiBold',
  body: 'PlusJakartaSans-Regular',
  bodyMedium: 'PlusJakartaSans-Medium',
  bodyBold: 'PlusJakartaSans-Bold',
} as const;

// Anchored to the Serene Pulse type scale: label=12, body=16, headline=24, display=40.
export const fontSizes = {
  xs: 11,
  sm: 12,      // --text-label
  base: 14,
  md: 16,      // --text-body
  lg: 18,
  xl: 20,
  xxl: 24,     // --text-headline
  display: 40, // --text-display
} as const;

export const shadow = {
  // --shadow-diffused: 0px 8px 32px rgba(43,37,48,0.04) — subtle resting-state cards
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 4,   // Android — stronger than 2 to match iOS look
  },
  // --shadow-elevation: 0px 4px 12px rgba(43,37,48,0.12) — raised/pressed elements
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
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
