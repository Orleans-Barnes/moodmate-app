/**
 * Ghanaian institution dataset — Phase 1C-ii, offline/local catalogue (no API, no backend).
 * ~18 entries, enough for a convincing demo per the agreed scope. Every `logo` is `null` today —
 * see types.ts for why that's intentional, not a TODO.
 */
import type { Institution } from './types';

export const GHANA_INSTITUTIONS: Institution[] = [
  { id: 'knust', name: 'Kwame Nkrumah University of Science and Technology', shortName: 'KNUST', city: 'Kumasi', country: 'Ghana', type: 'University', logo: null },
  { id: 'ug', name: 'University of Ghana', shortName: 'UG', city: 'Legon, Accra', country: 'Ghana', type: 'University', logo: null },
  { id: 'ucc', name: 'University of Cape Coast', shortName: 'UCC', city: 'Cape Coast', country: 'Ghana', type: 'University', logo: null },
  { id: 'uds', name: 'University for Development Studies', shortName: 'UDS', city: 'Tamale', country: 'Ghana', type: 'University', logo: null },
  { id: 'ashesi', name: 'Ashesi University', shortName: 'Ashesi', city: 'Berekuso', country: 'Ghana', type: 'University', logo: null },
  { id: 'uenr', name: 'University of Energy and Natural Resources', shortName: 'UENR', city: 'Sunyani', country: 'Ghana', type: 'University', logo: null },
  { id: 'uhas', name: 'University of Health and Allied Sciences', shortName: 'UHAS', city: 'Ho', country: 'Ghana', type: 'University', logo: null },
  { id: 'gctu', name: 'Ghana Communication Technology University', shortName: 'GCTU', city: 'Accra', country: 'Ghana', type: 'University', logo: null },
  { id: 'acu', name: 'Academic City University', shortName: 'ACU', city: 'Accra', country: 'Ghana', type: 'University', logo: null },
  { id: 'central', name: 'Central University', shortName: 'Central', city: 'Miotso', country: 'Ghana', type: 'University', logo: null },
  { id: 'wiuc', name: 'Wisconsin International University College', shortName: 'WIUC', city: 'Accra', country: 'Ghana', type: 'University College', logo: null },
  { id: 'mug', name: 'Methodist University Ghana', shortName: 'MUG', city: 'Accra', country: 'Ghana', type: 'University', logo: null },
  { id: 'regent', name: 'Regent University College of Science and Technology', shortName: 'Regent', city: 'Accra', country: 'Ghana', type: 'University College', logo: null },
  { id: 'vvu', name: 'Valley View University', shortName: 'VVU', city: 'Oyibi, Accra', country: 'Ghana', type: 'University', logo: null },
  { id: 'cuc', name: 'Catholic University College of Ghana', shortName: 'CUCG', city: 'Fiapre, Sunyani', country: 'Ghana', type: 'University College', logo: null },
  { id: 'uew', name: 'University of Education, Winneba', shortName: 'UEW', city: 'Winneba', country: 'Ghana', type: 'University', logo: null },
  { id: 'gimpa', name: 'Ghana Institute of Management and Public Administration', shortName: 'GIMPA', city: 'Accra', country: 'Ghana', type: 'Institute', logo: null },
  { id: 'other', name: 'My institution isn’t listed', shortName: 'Other', city: '', country: 'Ghana', type: 'Institute', logo: null },
];
