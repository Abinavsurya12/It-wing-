/**
 * Paguthi / Ondriyam / Nagaram & Village / Municipal Ward Configuration
 * TVK Digital Governance CRM - Backend Utility
 */

export const PAGUTHI_LABEL = 'Paguthi / Ondriyam / Nagaram / Peruratchi';

export const PAGUTHI_OPTIONS = [
  'Pothanur',
  'Kurichi',
  'Sundarapuram',
  'Malumachampatti',
  'Kinathukadavu Ondriyam',
  'Kinathukadavu Nagaram',
  'Thondamuthur Therku Ondriyam',
  'Thondamuthur Merku Ondriyam',
  'Madukarai Therku Ondriyam',
  'Madukarai Merku Ondriyam',
  'Madukkarai Nagaram',
  'Vellalur Nagaram',
];

export const PAGUTHI_VILLAGES_MAP = {
  'Thondamuthur Therku Ondriyam': [
    'Perur Chettipalayam'
  ],
  'Thondamuthur Merku Ondriyam': [
    'Theethipalayam',
    'Madhampatti'
  ],
  'Kinathukadavu Ondriyam': [
    'Vadaputhur',
    'Solavampalayam',
    'Sokkanur',
    'No.10 Muthur',
    'Kodangipalayam',
    'Kuthirayampalayam',
    'Pottayandipurambu'
  ],
  'Madukarai Merku Ondriyam': [
    'Chettipalayam',
    'Othakalmandapam',
    'Ettimadai',
    'Tirumalaipalayam',
    'Palathurai',
    'Pichanur',
    'Mavuthampathy'
  ],
  'Madukarai Therku Ondriyam': [
    'Arisipalayam',
    'Valukuparai',
    'Nachipalayam',
    'Myleripalayam',
    'Elur'
  ],
  'Malumachampatti': [
    'Seerapalayam',
    'Malumachampatti'
  ]
};

/**
 * Normalizes Paguthi names across single/double 'k' variations and aliases
 */
export const normalizePaguthiName = (name) => {
  if (!name) return '';
  const s = String(name).trim();
  if (/^thondamuthur\s+therk?ku\s+ondriyam$/i.test(s)) return 'Thondamuthur Therku Ondriyam';
  if (/^thondamuthur\s+merk?ku\s+ondriyam$/i.test(s)) return 'Thondamuthur Merku Ondriyam';
  if (/^maduk?karai\s+merk?ku\s+ondriyam$/i.test(s)) return 'Madukarai Merku Ondriyam';
  if (/^maduk?karai\s+therk?ku\s+ondriyam$/i.test(s)) return 'Madukarai Therku Ondriyam';
  if (/^malum[ia]champatti$/i.test(s)) return 'Malumachampatti';
  if (/^kinathukadavu\s+ondriyam$/i.test(s)) return 'Kinathukadavu Ondriyam';
  if (/^kinathukadavu\s+nagaram$/i.test(s)) return 'Kinathukadavu Nagaram';
  if (/^pothanur$/i.test(s) || /^podanur$/i.test(s)) return 'Pothanur';
  if (/^kurichi$/i.test(s)) return 'Kurichi';
  if (/^sundarapuram$/i.test(s)) return 'Sundarapuram';
  return s;
};

/**
 * Returns allowed villages for a given Paguthi
 */
export const getVillagesForPaguthi = (paguthi) => {
  if (!paguthi) return [];
  const normalized = normalizePaguthiName(paguthi);
  return PAGUTHI_VILLAGES_MAP[normalized] || [];
};

/**
 * Validates if a village is valid for a selected Paguthi
 * - If the Paguthi has mapped villages, village MUST be one of those allowed villages.
 * - If the Paguthi does NOT have mapped villages, village must be empty ('') or omitted.
 */
export const isVillageValidForPaguthi = (paguthi, village) => {
  const allowed = getVillagesForPaguthi(paguthi);
  const cleanVillage = (village || '').trim();

  if (allowed.length === 0) {
    // Paguthi has no mapped villages: only empty village is allowed
    return cleanVillage === '';
  }

  // Paguthi has mapped villages: village must be in allowed list (case-insensitive match)
  if (!cleanVillage) {
    return false;
  }

  return allowed.some((v) => v.toLowerCase() === cleanVillage.toLowerCase());
};

export default {
  PAGUTHI_LABEL,
  PAGUTHI_OPTIONS,
  PAGUTHI_VILLAGES_MAP,
  normalizePaguthiName,
  getVillagesForPaguthi,
  isVillageValidForPaguthi,
};
