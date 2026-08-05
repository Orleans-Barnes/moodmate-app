/**
 * Institution — structured catalogue entry (Phase 1C-ii).
 *
 * Replaces the flat string[] dropdown that used to live inline in SignupScreen.tsx. `logo` is
 * always present in the shape (even though every entry ships `null` for now, since we don't have
 * real institution crest assets) so that dropping in real logo files later is a one-line change
 * per institution in ghana.ts — no component code needs to change. See InstitutionPicker.tsx for
 * the fallback rendering (initials badge) used while `logo` is null.
 */
import type { ImageSourcePropType } from 'react-native';

export type InstitutionType = 'University' | 'University College' | 'Institute';

export interface Institution {
  id: string;
  /** Full official name. */
  name: string;
  /** Acronym/short name — this exact string is what gets sent as `institution` on signup,
   *  preserving the existing SignupRequest.institution contract (a plain string column on
   *  `users`, unchanged by this phase). */
  shortName: string;
  city: string;
  country: string;
  type: InstitutionType;
  logo: ImageSourcePropType | null;
}
