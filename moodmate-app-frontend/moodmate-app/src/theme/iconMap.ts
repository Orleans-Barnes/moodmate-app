/**
 * Central Ionicons mappings — use instead of emoji anywhere in UI or persisted keys.
 */
import type { Ionicons } from '@expo/vector-icons';

export type IonName = keyof typeof Ionicons.glyphMap;

// ── Journal template / entry mood keys ────────────────────────────────────────
export const JOURNAL_ICON: Record<string, IonName> = {
  journal: 'create-outline',
  gratitude: 'heart-outline',
  exam: 'school-outline',
  reflection: 'bulb-outline',
  prompt: 'chatbubble-ellipses-outline',
  voice: 'mic-outline',
};

// ── Profile avatar picker (stored in avatarEmoji as icon key) ─────────────────
export const AVATAR_ICONS: IonName[] = [
  'happy-outline',
  'sunny-outline',
  'flower-outline',
  'leaf-outline',
  'star-outline',
  'flag-outline',
  'moon-outline',
  'compass-outline',
  'sparkles-outline',
  'paw-outline',
  'water-outline',
  'musical-notes-outline',
  'heart-outline',
  'flame-outline',
  'heart-circle-outline',
  'color-palette-outline',
  'book-outline',
  'fitness-outline',
  'person-outline',
  'ribbon-outline',
];

export const DEFAULT_AVATAR_ICON: IonName = 'person-outline';

// ── Community reactions ───────────────────────────────────────────────────────
export const REACTION_ICONS: Record<string, IonName> = {
  HEART: 'heart',
  PRAYER: 'hand-left-outline',
  MUSCLE: 'barbell-outline',
  PARTY: 'sparkles-outline',
};

// ── Check-in mood slider (1–5) ──────────────────────────────────────────────────
export const MOOD_SLIDER_ICONS: IonName[] = [
  'sad-outline',
  'cloud-outline',
  'remove-outline',
  'happy-outline',
  'heart-circle-outline',
];

// ── Grounding senses ──────────────────────────────────────────────────────────
export const GROUNDING_SENSE_ICONS: Record<string, IonName> = {
  See: 'eye-outline',
  Touch: 'hand-left-outline',
  Hear: 'ear-outline',
  Smell: 'flower-outline',
  Taste: 'nutrition-outline',
};

// ── Habit tracker icons ───────────────────────────────────────────────────────
export const HABIT_ICONS: IonName[] = [
  'checkmark-circle-outline',
  'water-outline',
  'walk-outline',
  'book-outline',
  'leaf-outline',
  'moon-outline',
  'restaurant-outline',
  'create-outline',
  'phone-portrait-outline',
  'flower-outline',
  'chatbubbles-outline',
  'flag-outline',
  'color-palette-outline',
  'musical-notes-outline',
  'heart-outline',
];

export const HABIT_PRESET_ICONS: Record<string, IonName> = {
  'Drink 8 glasses of water': 'water-outline',
  '30 mins of exercise': 'walk-outline',
  'Read for 20 minutes': 'book-outline',
  'Meditate or breathe': 'leaf-outline',
  'Sleep before midnight': 'moon-outline',
  'Eat a healthy meal': 'restaurant-outline',
  'Journal today': 'create-outline',
  'No social media after 9pm': 'phone-portrait-outline',
  'Take a short walk outside': 'flower-outline',
  'Call or text a friend': 'chatbubbles-outline',
};

// ── Bubble pop game ───────────────────────────────────────────────────────────
export const BUBBLE_ICONS: IonName[] = [
  'ellipse-outline',
  'heart-outline',
  'leaf-outline',
  'sparkles-outline',
  'flower-outline',
  'water-outline',
  'cloud-outline',
  'sunny-outline',
];

// ── Memory match game ─────────────────────────────────────────────────────────
export const GAME_SYMBOLS: IonName[] = [
  'leaf-outline',
  'cloud-outline',
  'moon-outline',
  'water-outline',
  'flower-outline',
  'star-outline',
];
export const GAME_HIDDEN: IonName = 'leaf-outline';

// ── Sleep quality (index 0 = empty) ───────────────────────────────────────────
export const SLEEP_QUALITY_ICONS: IonName[] = [
  'remove-outline',
  'sad-outline',
  'cloud-outline',
  'remove-outline',
  'happy-outline',
  'heart-circle-outline',
];

// ── Emotion keys (mood history, etc.) ─────────────────────────────────────────
export const EMOTION_ICONS: Record<string, IonName> = {
  HAPPY: 'happy-outline',
  CALM: 'leaf-outline',
  HOPEFUL: 'sunny-outline',
  GRATEFUL: 'heart-outline',
  MOTIVATED: 'flash-outline',
  ANXIOUS: 'alert-circle-outline',
  STRESSED: 'warning-outline',
  LONELY: 'person-outline',
  OVERWHELMED: 'cloud-outline',
  FRUSTRATED: 'thunderstorm-outline',
};

// ── Music genre tracks ────────────────────────────────────────────────────────
export const MUSIC_GENRE_ICONS: Record<string, IonName> = {
  sleep: 'moon-outline',
  ambient: 'cloud-outline',
  nature: 'water-outline',
  focus: 'sunny-outline',
  meditation: 'sparkles-outline',
  lofi: 'musical-notes-outline',
  classical: 'library-outline',
  binaural: 'pulse-outline',
  rain: 'rainy-outline',
  white: 'radio-outline',
};

// ── Proud / win moments ───────────────────────────────────────────────────────
export const WIN_ICONS: IonName[] = [
  'flower-outline',
  'star-outline',
  'sparkles-outline',
  'barbell-outline',
  'ribbon-outline',
  'trophy-outline',
  'heart-outline',
  'flash-outline',
  'leaf-outline',
  'color-palette-outline',
];

// ── Wellness tree / shop skins ────────────────────────────────────────────────
export const DEFAULT_TREE_ICON: IonName = 'leaf-outline';

// ── Legacy emoji → icon (for old persisted data) ─────────────────────────────
const LEGACY_EMOJI: Record<string, IonName> = {
  '👤': 'person-outline',
  '😊': 'happy-outline',
  '📝': 'create-outline',
  '✍️': 'create-outline',
  '💛': 'heart-outline',
  '📚': 'school-outline',
  '🤔': 'bulb-outline',
  '🎙': 'mic-outline',
  '🎙️': 'mic-outline',
  '🌳': 'leaf-outline',
  '❤️': 'heart',
  '🙏': 'hand-left-outline',
  '💪': 'barbell-outline',
  '🎉': 'sparkles-outline',
  '💬': 'chatbubbles-outline',
  '🧑‍⚕️': 'medkit-outline',
  '🧑': 'person-outline',
};

/** Resolve any stored key, legacy emoji, or raw ion name to a valid Ionicons glyph. */
export function resolveIcon(key: string | null | undefined, fallback: IonName = 'ellipse-outline'): IonName {
  if (!key) return fallback;
  if (LEGACY_EMOJI[key]) return LEGACY_EMOJI[key];
  if (JOURNAL_ICON[key]) return JOURNAL_ICON[key];
  if (EMOTION_ICONS[key]) return EMOTION_ICONS[key];
  if (REACTION_ICONS[key]) return REACTION_ICONS[key];
  // Assume it's already a valid ion name if it contains a hyphen (ionicon convention)
  if (key.includes('-')) return key as IonName;
  return fallback;
}
