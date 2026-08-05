/**
 * Design tokens — MoodMate "Serene Pulse" Design System
 * Extended with: gradients, glassmorphism, glow shadows, animation constants
 */

export const colors = {
  // ── Backgrounds / surfaces ──────────────────────────────────────────────
  // "Calm Forest" — 2026 flat redesign (see `calm` palette below for exact
  // Figma hexes). bg moved off the old lavender tint to a neutral off-white.
  bg: '#F8F8F8',
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
  // Repointed from the old coral-orange CTA to the Calm Forest primary green
  // (#579E65) — this is the single highest-leverage change for the Figma
  // redesign since `coral`/`primary` is the CTA color used app-wide.
  coral: '#25D366',                 // primary (WhatsApp green)
  coralDeep: '#1DA851',             // pressed/active state
  coralSoft: '#E7F8EE',             // primary-container
  coralLight: '#F0FBF4',

  blue: '#5C8AE6',
  blueSoft: '#E3ECFC',
  blueDeep: '#3D6FD4',              // pressed/active state — also the Counsellor-portal accent

  sage: '#7DBE9E',                  // secondary — sage green (was #5F9E7C)
  sageSoft: '#CEF5DF',              // secondary-container
  sageDeep: '#4F9A76',              // pressed/active state — also the Peer-Mentor-portal accent

  lavender: '#8E7BC0',
  lavenderSoft: '#EFE9F8',
  lavenderDeep: '#6B5BA0',          // also the Admin-portal accent

  sun: '#FFC857',
  sunSoft: '#FFF3D9',
  sunText: '#5A4300',

  line: 'rgba(43,37,48,0.10)',
  shadow: 'rgba(43,37,48,0.12)',    // matches --shadow-elevation opacity exactly

  // ── Status colors ───────────────────────────────────────────────────────
  // Muted/desaturated on purpose — MoodMate reduces stress rather than alarms,
  // so even "error" reads as concerned-but-calm, not a harsh system red.
  success: '#7DBE9E',               // = sage
  successSoft: '#CEF5DF',
  warning: '#FFC857',               // = sun
  warningSoft: '#FFF3D9',
  info: '#5C8AE6',                  // = blue
  infoSoft: '#E3ECFC',
  error: '#D64545',
  errorSoft: '#FDEAEA',
  errorDeep: '#8C2F2F',

  // ── Named brand-role colors ─────────────────────────────────────────────
  // These give every "which hue means what" question in the app one answer,
  // instead of screens/portals each inventing their own. See tokens.ts's
  // design-system plan: Counsellor→blue family, Mentor→sage family,
  // Admin→lavender family — no new hues, just named roles on existing ones.
  premiumGold: '#FFC857',           // = sun — Pro/paywall + all XP/level UI
  premiumGoldSoft: '#FFF3D9',
  treeGrowth: '#7DBE9E',            // = sage — wellness-tree UI
  treeGrowthSoft: '#CEF5DF',
  journalAccent: '#8E7BC0',         // = lavender — journal + celebration surfaces
  journalAccentSoft: '#EFE9F8',
  aiAccent: '#6C63D6',              // small indigo lean, distinct enough from lavender to read as "AI"
  aiAccentSoft: '#EDEBFB',
  sos: '#FF6F4D',                   // = coral — SOS/crisis stays warm-urgent, never alarm-red

  // ── Semantic aliases ─────────────────────────────────────────────────────
  // Names the design-system brief asks for, mapped onto the palette above so
  // no new hex values are introduced — just vocabulary every screen can share.
  primary: '#FF6F4D',               // = coral
  secondary: '#7DBE9E',             // = sage
  background: '#FFF7FE',            // = bg
  surfaceElevated: '#FDF5FE',       // slightly raised tint above `surface`, for stacked/nested cards
  divider: 'rgba(43,37,48,0.10)',   // = line
  textPrimary: '#2B2530',           // = ink
  textSecondary: '#6F6478',         // = inkSoft
  textDisabled: '#9B8FA3',          // = inkFaint
  inactive: '#9B8FA3',              // = inkFaint — unselected tab/control state
  overlay: 'rgba(24,20,28,0.55)',   // modal/bottom-sheet backdrop
  moodDark: '#0A0A14',              // near-black canvas for the immersive MoodGate/MoodSuggest flow
} as const;

// Premium dark appearance. Inspired by modern chat apps: true black page chrome,
// charcoal raised surfaces, quiet dividers, and MoodMate green reserved for action
// and selected state. Import this instead of inventing screen-local dark hexes.
export const darkPalette = {
  bg: '#050605',
  bgRaised: '#0B0C0B',
  surface: '#1F211F',
  surfaceRaised: '#262826',
  surfaceSunken: '#111211',
  surfaceGreen: 'rgba(37, 211, 102, 0.16)',
  border: 'rgba(255,255,255,0.10)',
  divider: 'rgba(255,255,255,0.09)',
  text: '#F7F8F5',
  textSoft: 'rgba(247,248,245,0.72)',
  textMuted: 'rgba(247,248,245,0.56)',
  textFaint: 'rgba(247,248,245,0.38)',
  primary: '#25D366',
  primaryDeep: '#1BAE55',
  primarySoft: 'rgba(37,211,102,0.18)',
  accent: '#25D366',
  accentText: '#25D366',
  muted: 'rgba(247,248,245,0.56)',
  warning: '#FFC857',
  danger: '#FF8E75',
  shadow: 'rgba(0,0,0,0.42)',
} as const;

// ── Calm Forest palette ──────────────────────────────────────────────────────
// Exact hexes pulled from the Figma "MoodMate — Student Wellness App" redesign
// (auth/onboarding + home/check-in/journal/insights flow, 24 screens). Use
// these directly in screens ported from that file; `colors.coral`/`colors.bg`
// above are also repointed to this palette so untouched screens inherit it.
export const calm = {
  bg: '#F4F6F5',
  /** WhatsApp-inspired teal-green — dark headers, headline text */
  forest: '#075E54',
  forestPanel: '#128C7E',           // raised panel / gradient end on forest backgrounds
  /** WhatsApp bright green — primary CTAs, active states */
  primary: '#25D366',
  primaryDeep: '#1DA851',
  mint: '#34E07A',                  // light accent (dots, small icons on dark)
  mintBg: '#E7F8EE',                // light green container / selected option bg
  ink: '#1B1B1B',
  muted: '#6B7770',                 // secondary text on light
  mutedOnDark: 'rgba(255,255,255,0.72)', // secondary text on forest background
  faint: '#A9B4AC',                 // inactive nav / faint labels
  border: '#DFE6E1',                // card & input borders
  track: '#D9E2DB',                 // progress-bar track
  trackAlt: '#EDF1EE',              // secondary track shade (week bars, meter tracks)
  amber: '#F0B429',                 // manageable / energy-mid / streak star
  warningSoft: '#FFF3D9',
  terracotta: '#E08A5A',            // heavy / anxious
  rust: '#D2694E',                  // overwhelming / stress-high
  dustyBlue: '#6FA8C7',             // calm accent (week chart)
  dustyPink: '#E8A0BF',             // gratitude accent
  dustyPurple: '#8E86BF',           // overwhelmed accent (insights bars)
  brown: '#6B4F3A',                 // tree trunk
  dotInactive: '#C9D4CC',           // onboarding page-dot, inactive state
  journalLine: '#4E6E55',           // onboarding slide-2 journal-card placeholder text lines
  journalQuote: '#7D9B82',          // onboarding slide-2 journal-card quote-mark glyph
  emergencyBg: '#241A18',
  emergencyCard: '#312321',
  emergencyMuted: '#C9BDB8',
  alertText: '#BB4D29',
  alertTextSoft: '#7A3B24',
  alertCta: '#C25A38',
} as const;

// ── Gradient presets ────────────────────────────────────────────────────────
export const gradients = {
  // Auth backgrounds — dark but rich, not pitch black
  dark:     ['#0D0D1A', '#0F1F2E', '#130A2E'] as const,  // = RoleSelectScreen's background
  darkRich: ['#1E1040', '#2D1478', '#4A1E8A'] as const,  // = SplashScreen's background

  // Home header — coral→lavender brand gradient (serene, not carnival-vibrant)
  header:   ['#FF6F4D', '#E893A8', '#8E7BC0'] as const,

  // Brand CTAs — flat Calm Forest green (was coral-orange). coralBtn is
  // intentionally near-flat since Figma's buttons are solid pills, not gradients.
  coral:    ['#25D366', '#1DA851'] as const,
  coralBtn: ['#25D366', '#20BD5A'] as const,

  // Card accents
  sage:     ['#7DBE9E', '#4F9A76'] as const,
  lavender: ['#8E7BC0', '#6B5BA0'] as const,
  sun:      ['#FFC857', '#FFB020'] as const,
  blue:     ['#5C8AE6', '#3D6FD4'] as const,
  // AI companion / insight surfaces — indigo, kept distinct from `lavender`
  // (journal) so a glance tells the two apart.
  ai:       ['#6C63D6', '#554AC2'] as const,

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

  solidFill: 'rgba(255,255,255,0.88)',
  solidBorder: 'rgba(43,37,48,0.10)',

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
  coral:    'rgba(87,158,101,0.28)',
  sage:     'rgba(125,190,158,0.25)',
  lavender: 'rgba(142,123,192,0.28)',
  blue:     'rgba(92,138,230,0.28)',
  sun:      'rgba(255,200,87,0.30)',
  dark:     'rgba(8,8,15,0.45)',
} as const;

// ── Semantic content accents ─────────────────────────────────────────────────
// Two-tier color rule: app CHROME (nav, headers, primary buttons, cards, forms, dialogs) always
// uses the brand tokens above (bg/coral/calm.*) — never a screen-local hex. CONTENT that needs to
// stay visually distinct (emotions, tool/resource categories, music genres, mood-chart series,
// community tags) draws from this curated table instead of inventing its own hex. Every entry is
// deliberately desaturated/muted to match the rest of the palette — no saturated or clashing hues.
export type AccentKey =
  | 'wellness' | 'focus' | 'gratitude' | 'creativity' | 'energy' | 'calm'
  | 'sleep' | 'anxiety' | 'social' | 'learning' | 'premium' | 'crisis';

export interface AccentTone {
  accent: string;   // icon tint / text-on-soft-bg
  soft: string;     // tinted card/pill background
  border: string;   // matching hairline border
  pressed: string;  // darker active/pressed state
}

export const accents: Record<AccentKey, AccentTone> = {
  wellness:   { accent: '#579E65', soft: '#E9F2EC', border: '#C7E0D0', pressed: '#468752' },
  focus:      { accent: '#F0B429', soft: '#FFF3D9', border: '#F5DFA6', pressed: '#D99A1F' },
  gratitude:  { accent: '#E8A0BF', soft: '#FBEAF2', border: '#F2C9DC', pressed: '#D97FA3' },
  creativity: { accent: '#8E86BF', soft: '#ECEAF7', border: '#D3CFEA', pressed: '#746BAA' },
  energy:     { accent: '#E08A5A', soft: '#FBEDE3', border: '#F0C7AA', pressed: '#C96F3E' },
  calm:       { accent: '#6FA8C7', soft: '#E9F3F8', border: '#C3DEEA', pressed: '#4F8AAD' },
  sleep:      { accent: '#5B6EAE', soft: '#E8EAF6', border: '#C7CCEA', pressed: '#47578F' },
  anxiety:    { accent: '#D2694E', soft: '#FBE9E4', border: '#EFC2B3', pressed: '#B8523A' },
  social:     { accent: '#5C8AE6', soft: '#E7EEFC', border: '#C3D6F7', pressed: '#3F6BC9' },
  learning:   { accent: '#3D8A7D', soft: '#E4F2F0', border: '#BFE0DA', pressed: '#2E6E63' },
  premium:    { accent: '#FFC857', soft: '#FFF3D9', border: '#F5DFA6', pressed: '#E0A93C' },
  crisis:     { accent: '#FF6F4D', soft: '#FFE4DC', border: '#FFC1AE', pressed: '#E85A39' },
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
  xl: 20,    // standard card roundness — canonized from HomeScreen's own CARD_R
  card: 24,  // Calm Forest card roundness (insight/tree/chart cards)
  xxl: 32,
  /** Scoop curve where forest headers meet light content */
  headerCurve: 36,
  pill: 999,
  button: 22,
  sheet: 34,
} as const;

/** Shared curve geometry for forest headers */
export const headerCurve = {
  height: 28,
  radius: radii.headerCurve,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  huge: 48,
  giant: 64,
} as const;

// NOTE: load 'PlusJakartaSans-Regular'/'-Medium'/'-SemiBold'/'-Bold' via expo-font (see App.tsx).
// Single-family system per Serene Pulse spec — weight alone carries the hierarchy that used to
// come from mixing Baloo2 (display) + DMSans (body).
export const fonts = {
  display: 'PlusJakartaSans-Bold',
  displayExtraBold: 'PlusJakartaSans-ExtraBold', // Calm Forest headline weight
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
  // Hero/celebration surfaces (modals, level-up cards, splash orb) — deeper
  // and softer than `md` so these don't compete visually with resting cards.
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 14,
  },
} as const;

// ── Typography scale ─────────────────────────────────────────────────────────
// Named presets over the raw fonts/fontSizes tokens above, so screens stop
// hand-combining {fontFamily, fontSize} pairs inconsistently. `fonts`/
// `fontSizes` stay exported for one-off tweaks — this is additive sugar,
// not a replacement.
export const typography = {
  display:   { fontFamily: fonts.display,     fontSize: 40, lineHeight: 46 },
  headline:  { fontFamily: fonts.display,     fontSize: 24, lineHeight: 30 },
  title:     { fontFamily: fonts.bodyBold,    fontSize: 18, lineHeight: 24 },
  body:      { fontFamily: fonts.body,        fontSize: 16, lineHeight: 22 },
  bodySmall: { fontFamily: fonts.body,        fontSize: 14, lineHeight: 20 },
  label:     { fontFamily: fonts.bodyBold,    fontSize: 12, lineHeight: 16 },
  caption:   { fontFamily: fonts.bodyMedium,  fontSize: 11, lineHeight: 14 },
} as const;

export const theme = { colors, calm, darkPalette, accents, gradients, glass, glow, springs, timing, radii, headerCurve, spacing, fonts, fontSizes, typography, shadow };
export type Theme = typeof theme;
