/**
 * Ghanaian institution dataset — Phase 1C-ii, offline/local catalogue (no API, no backend).
 * ~18 entries, enough for a convincing demo per the agreed scope. Logo URLs use each institution's
 * official domain favicon as a stable remote image source; the picker keeps its initials fallback
 * when a device is offline or a school has not published a usable icon.
 */
import type { Institution } from './types';

function officialLogo(domain: string) {
  return { uri: `https://www.google.com/s2/favicons?domain=${domain}&sz=128` };
}

export const GHANA_INSTITUTIONS: Institution[] = [
  { id: 'knust', name: 'Kwame Nkrumah University of Science and Technology', shortName: 'KNUST', city: 'Kumasi', country: 'Ghana', type: 'University', logo: officialLogo('knust.edu.gh') },
  { id: 'ug', name: 'University of Ghana', shortName: 'UG', city: 'Legon, Accra', country: 'Ghana', type: 'University', logo: officialLogo('ug.edu.gh') },
  { id: 'ucc', name: 'University of Cape Coast', shortName: 'UCC', city: 'Cape Coast', country: 'Ghana', type: 'University', logo: officialLogo('ucc.edu.gh') },
  { id: 'uds', name: 'University for Development Studies', shortName: 'UDS', city: 'Tamale', country: 'Ghana', type: 'University', logo: officialLogo('uds.edu.gh') },
  { id: 'ashesi', name: 'Ashesi University', shortName: 'Ashesi', city: 'Berekuso', country: 'Ghana', type: 'University', logo: officialLogo('ashesi.edu.gh') },
  { id: 'uenr', name: 'University of Energy and Natural Resources', shortName: 'UENR', city: 'Sunyani', country: 'Ghana', type: 'University', logo: officialLogo('uenr.edu.gh') },
  { id: 'uhas', name: 'University of Health and Allied Sciences', shortName: 'UHAS', city: 'Ho', country: 'Ghana', type: 'University', logo: officialLogo('uhas.edu.gh') },
  { id: 'gctu', name: 'Ghana Communication Technology University', shortName: 'GCTU', city: 'Accra', country: 'Ghana', type: 'University', logo: officialLogo('gctu.edu.gh') },
  { id: 'acu', name: 'Academic City University', shortName: 'ACU', city: 'Accra', country: 'Ghana', type: 'University', logo: officialLogo('acity.edu.gh') },
  { id: 'central', name: 'Central University', shortName: 'Central', city: 'Miotso', country: 'Ghana', type: 'University', logo: officialLogo('central.edu.gh') },
  { id: 'wiuc', name: 'Wisconsin International University College', shortName: 'WIUC', city: 'Accra', country: 'Ghana', type: 'University College', logo: officialLogo('wiuc-ghana.edu.gh') },
  { id: 'mug', name: 'Methodist University Ghana', shortName: 'MUG', city: 'Accra', country: 'Ghana', type: 'University', logo: officialLogo('mug.edu.gh') },
  { id: 'regent', name: 'Regent University College of Science and Technology', shortName: 'Regent', city: 'Accra', country: 'Ghana', type: 'University College', logo: officialLogo('regent.edu.gh') },
  { id: 'vvu', name: 'Valley View University', shortName: 'VVU', city: 'Oyibi, Accra', country: 'Ghana', type: 'University', logo: officialLogo('vvu.edu.gh') },
  { id: 'cuc', name: 'Catholic University College of Ghana', shortName: 'CUCG', city: 'Fiapre, Sunyani', country: 'Ghana', type: 'University College', logo: officialLogo('cuc.edu.gh') },
  { id: 'uew', name: 'University of Education, Winneba', shortName: 'UEW', city: 'Winneba', country: 'Ghana', type: 'University', logo: officialLogo('uew.edu.gh') },
  { id: 'gimpa', name: 'Ghana Institute of Management and Public Administration', shortName: 'GIMPA', city: 'Accra', country: 'Ghana', type: 'Institute', logo: officialLogo('gimpa.edu.gh') },
  { id: 'other', name: 'My institution isn’t listed', shortName: 'Other', city: '', country: 'Ghana', type: 'Institute', logo: null },
];
