// Utility functions for the ProfitPilot backend

/**
 * Validate Indian GSTIN format
 * @param {string} gstin - The GSTIN to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidGSTIN = (gstin) => {
  if (!gstin) return false;
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.toUpperCase());
};

/**
 * Parse date string to YYYY-MM-DD format
 * @param {string} dateString - The date string to parse
 * @returns {string|null} - Parsed date in YYYY-MM-DD format or null
 */
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Try parsing different date formats
  const formats = [
    'DD/MM/YYYY',
    'DD-MM-YYYY',
    'YYYY-MM-DD'
  ];
  
  // Handle DD/MM/YYYY or DD-MM-YYYY formats
  if (dateString.includes('/') || dateString.includes('-')) {
    const parts = dateString.includes('/') ? dateString.split('/') : dateString.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (day && month && year) {
        // If year is 2 digits, assume 20xx
        const fullYear = year.length === 2 ? `20${year}` : year;
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }
  
  // Try to parse as a standard date
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
};

/**
 * Check if a value is a valid number
 * @param {*} value - The value to check
 * @returns {boolean} - True if valid number, false otherwise
 */
const isNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

module.exports = {
  isValidGSTIN,
  parseDate,
  isNumber
};