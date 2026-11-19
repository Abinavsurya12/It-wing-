/**
 * Paguthi / Ondriyam / Nagaram / Peruratchi & Municipal Ward Configuration
 * TVK Digital Governance CRM
 */

export const PAGUTHI_LABEL = 'Paguthi / Ondriyam / Nagaram / Peruratchi';

export const PAGUTHI_OPTIONS = [
  'Pothanur',
  'Kurichi',
  'Sundarapuram',
];

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
 * Remaining 10 options:
 * - Ward 1 through Ward 100, excluding 85, 94, 95, 96, 97, 98, 99, 100 (Count: 92)
 */
export const getWardsForPaguthi = (paguthi) => {
  if (!paguthi) return [];
  if (paguthi === 'Pothanur' || paguthi === 'Podanur') {
    return [95, 99, 100];
  }
  if (paguthi === 'Sundarapuram') {
    return [94, 96];
  }
  if (paguthi === 'Kurichi') {
    return [85, 96, 98];
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
  getWardsForPaguthi,
  isWardValidForPaguthi,
};
