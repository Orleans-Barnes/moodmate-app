/**
 * Institution catalogue — public entry point (Phase 1C-ii).
 *
 * `INSTITUTIONS` is the full offline list. `searchInstitutions(query)` is the only thing the
 * picker UI needs to know about matching — deliberately kept here (not duplicated in the
 * component) so a future swap to a backend-driven catalogue only has to change this file, per
 * the "data source can later be replaced with an API without changing UI components" requirement.
 */
import type { Institution } from './types';
import { GHANA_INSTITUTIONS } from './ghana';

export type { Institution, InstitutionType } from './types';

export const OTHER_INSTITUTION_ID = 'other';

export const INSTITUTIONS: Institution[] = GHANA_INSTITUTIONS;

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
