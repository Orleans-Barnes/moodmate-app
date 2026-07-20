/**
 * Institution catalogue — public entry point (Phase 1C-ii, backend-driven as of Institution
 * Management milestone).
 *
 * `INSTITUTIONS` is the current list `searchInstitutions(query)` matches against — deliberately
 * kept here (not duplicated in the picker component) exactly as this file's own doc comment always
 * planned: "a future swap to a backend-driven catalogue only has to change this file." That swap is
 * `loadInstitutions()` below. `INSTITUTIONS` starts as the bundled GHANA_INSTITUTIONS (so the
 * picker always has *something* to show even before loadInstitutions resolves) and is replaced in
 * place once the live/cached fetch completes - no other module needs to change.
 */
import type { Institution } from './types';
import { GHANA_INSTITUTIONS } from './ghana';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchPublicInstitutions, type InstitutionView } from '@/api/support';

export type { Institution, InstitutionType } from './types';

export const OTHER_INSTITUTION_ID = 'other';

const CACHE_KEY = 'moodmate_institutions_cache_v1';

// eslint-disable-next-line prefer-const -- reassigned in place by loadInstitutions below
export let INSTITUTIONS: Institution[] = GHANA_INSTITUTIONS;

export type InstitutionSource = 'live' | 'cached' | 'bundled';

function toFrontendType(type: InstitutionView['type']): Institution['type'] {
  switch (type) {
    case 'UNIVERSITY_COLLEGE': return 'University College';
    case 'INSTITUTE': return 'Institute';
    default: return 'University';
  }
}

// The "Other" row needs a stable id === OTHER_INSTITUTION_ID for InstitutionPicker's isOther
// branch and searchInstitutions' append-at-end behavior to keep working - matched by shortName
// since the backend's real numeric id for that row has no reason to line up with the sentinel
// string. Every other institution just uses its real backend id.
function toInstitution(v: InstitutionView): Institution {
  return {
    id: v.shortName.toLowerCase() === 'other' ? OTHER_INSTITUTION_ID : String(v.id),
    name: v.name,
    shortName: v.shortName,
    city: v.city ?? '',
    country: v.country,
    type: toFrontendType(v.type),
    logo: v.logoUrl ? { uri: v.logoUrl } : null,
  };
}

/** Institution Management (Milestone). Fetches the live backend catalogue and swaps it into
 * INSTITUTIONS on success (caching a copy for next time). On failure, falls back to the last
 * successful cache; if there's no cache either (first launch, no connectivity), falls back to the
 * bundled GHANA_INSTITUTIONS so signup never hard-blocks on the network being briefly down. Safe
 * to call multiple times (e.g. a manual retry, or a silent background refresh on screen focus). */
export async function loadInstitutions(): Promise<InstitutionSource> {
  try {
    const live = await fetchPublicInstitutions();
    const mapped = live.map(toInstitution);
    INSTITUTIONS = mapped;
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(mapped)).catch(() => {});
    return 'live';
  } catch {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        INSTITUTIONS = JSON.parse(cached) as Institution[];
        return 'cached';
      }
    } catch {
      // Corrupt/unreadable cache - fall through to the bundled list below.
    }
    INSTITUTIONS = GHANA_INSTITUTIONS;
    return 'bundled';
  }
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Matches full name, acronym/short name, and city — substring, case-insensitive. The "Other"
 * entry is excluded from ordinary text matches (searching "kumasi" shouldn't surface a bare
 * "Other" row) but is always appended at the end of results so it's still reachable, matching
 * the current signup flow's existing safety net for institutions not in the list.
 */
export function searchInstitutions(query: string): Institution[] {
  const q = normalize(query);
  const other = INSTITUTIONS.find((i) => i.id === OTHER_INSTITUTION_ID);
  const searchable = INSTITUTIONS.filter((i) => i.id !== OTHER_INSTITUTION_ID);

  if (q.length === 0) {
    return other ? [...searchable, other] : searchable;
  }

  const matches = searchable.filter((i) =>
    normalize(i.name).includes(q) ||
    normalize(i.shortName).includes(q) ||
    normalize(i.city).includes(q),
  );

  return other ? [...matches, other] : matches;
}
