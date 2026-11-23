/**
 * Paguthi / Ondriyam / Nagaram / Peruratchi & Municipal Ward Configuration
 * TVK Digital Governance CRM
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
 */
export const isVillageValidForPaguthi = (paguthi, village) => {
  const allowed = getVillagesForPaguthi(paguthi);
  const cleanVillage = (village || '').trim();

  if (allowed.length === 0) {
    return cleanVillage === '';
  }

  if (!cleanVillage) {
    return false;
  }

  return allowed.some((v) => v.toLowerCase() === cleanVillage.toLowerCase());
};

const EXCLUDED_WARDS_FOR_REMAINING = new Set([85, 94, 95, 96, 97, 98, 99, 100]);

// 92 wards: 1 through 84, and 86 through 93 (excluding 85, 94, 95, 96, 97, 98, 99, 100)
const REMAINING_TEN_WARDS = [];
for (let i = 1; i <= 100; i++) {
  if (!EXCLUDED_WARDS_FOR_REMAINING.has(i)) {
    REMAINING_TEN_WARDS.push(i);
  }
}

/**
 * Returns the exact allowed ward numbers for a selected Paguthi / Local Body.
 * 
 * Special Mappings:
 * - Pothanur: ONLY Ward 95, Ward 99, Ward 100 (Count: 3)
 * - Sundarapuram: ONLY Ward 94, Ward 96 (Count: 2)
 * - Kurichi: ONLY Ward 85, Ward 96, Ward 98 (Count: 3)
 * 
 * Remaining options:
 * - Ward 1 through Ward 100, excluding 85, 94, 95, 96, 97, 98, 99, 100 (Count: 92)
 */
export const getWardsForPaguthi = (paguthi) => {
  if (!paguthi) return [];
  const p = normalizePaguthiName(paguthi);
  if (p === 'Pothanur' || paguthi === 'Podanur') {
    return [95, 99, 100];
  }
  if (p === 'Sundarapuram') {
    return [94, 96];
  }
  if (p === 'Kurichi') {
    return [85, 96, 98];
  }
  if (p === 'Malumachampatti' || paguthi === 'Malumichampatti') {
    return [95, ...REMAINING_TEN_WARDS];
  }
  return REMAINING_TEN_WARDS;
};

/**
 * Validates if a ward belongs to the specified Paguthi.
 */
export const isWardValidForPaguthi = (paguthi, wardNum) => {
  if (!paguthi) return false;
  const parsed = parseInt(String(wardNum).replace(/\D+/g, ''), 10);
  if (isNaN(parsed)) return false;
  const allowed = getWardsForPaguthi(paguthi);
  return allowed.includes(parsed);
};

export default {
  PAGUTHI_LABEL,
  PAGUTHI_OPTIONS,
  PAGUTHI_VILLAGES_MAP,
  normalizePaguthiName,
  getVillagesForPaguthi,
  isVillageValidForPaguthi,
  getWardsForPaguthi,
  isWardValidForPaguthi,
};
