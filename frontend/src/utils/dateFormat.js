/**
 * Format a date string to "Friday, 3rd July 2026" format
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const day = d.getDate();
  const suffix = getOrdinalSuffix(day);
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const year = d.getFullYear();
  
  return `${weekday}, ${day}${suffix} ${month} ${year}`;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 * @param {number} n - Number
 * @returns {string} Ordinal suffix
 */
function getOrdinalSuffix(n) {
  if (n > 3 && n < 21) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
