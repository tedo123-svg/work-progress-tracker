// Ethiopian Government Fiscal Year Calendar
// Starts with ሐምሌ (Hamle) and ends with ሰኔ (Sene)
// Automatically calculates current month from system date

// Auto-calculate current Ethiopian month from Gregorian date
const calculateCurrentEthiopianMonth = () => {
  const now = new Date();
  const gregorianMonth = now.getMonth() + 1; // 1-12
  
  // Ethiopian Government Fiscal Year mapping:
  const monthMapping = {
    7: 1,   // July = Hamle
    8: 2,   // August = Nehase
    9: 3,   // September = Meskerem
    10: 4,  // October = Tikimt
    11: 5,  // November = Hidar
    12: 6,  // December = Tahsas
    1: 7,   // January = Tir
    2: 8,   // February = Yekatit
    3: 9,   // March = Megabit
    4: 10,  // April = Miazia
    5: 11,  // May = Ginbot
    6: 12   // June = Sene
  };
  
  return monthMapping[gregorianMonth] || 1;
};

export const CURRENT_ETHIOPIAN_MONTH = calculateCurrentEthiopianMonth();

// Ethiopian Government Fiscal Year - Month Order
export const ETHIOPIAN_MONTHS = [
  { number: 1, amharic: 'ሐምሌ', english: 'Hamle' },
  { number: 2, amharic: 'ነሐሴ', english: 'Nehase' },
  { number: 3, amharic: 'መስከረም', english: 'Meskerem' },
  { number: 4, amharic: 'ጥቅምት', english: 'Tikimt' },
  { number: 5, amharic: 'ኅዳር', english: 'Hidar' },
  { number: 6, amharic: 'ታኅሣሥ', english: 'Tahsas' },
  { number: 7, amharic: 'ጥር', english: 'Tir' },
  { number: 8, amharic: 'የካቲት', english: 'Yekatit' },
  { number: 9, amharic: 'መጋቢት', english: 'Megabit' },
  { number: 10, amharic: 'ሚያዝያ', english: 'Miazia' },
  { number: 11, amharic: 'ግንቦት', english: 'Ginbot' },
  { number: 12, amharic: 'ሰኔ', english: 'Sene' }
];

/**
 * Get the current Ethiopian month number
 * @returns {number} Current Ethiopian month (1-13)
 */
export const getCurrentEthiopianMonth = () => {
  return CURRENT_ETHIOPIAN_MONTH;
};

/**
 * Check if a month should be visible (not in the past)
 * @param {number} month - Month number to check
 * @returns {boolean} True if month should be visible
 */
export const isMonthVisible = (month) => {
  return month > CURRENT_ETHIOPIAN_MONTH;
};

/**
 * Get Ethiopian month name
 * @param {number} monthNumber - Month number (1-13)
 * @param {string} language - 'amharic' or 'english'
 * @returns {string} Month name
 */
export const getEthiopianMonthName = (monthNumber, language = 'amharic') => {
  const month = ETHIOPIAN_MONTHS.find(m => m.number === monthNumber);
  return month ? month[language] : '';
};

/**
 * Filter reports to show only future months
 * @param {Array} reports - Array of report objects
 * @returns {Array} Filtered reports
 */
export const filterFutureReports = (reports) => {
  return reports.filter(report => isMonthVisible(report.month));
};


/**
 * Format deadline as Ethiopian date
 * @param {Date|string} gregorianDate - Gregorian date
 * @param {number} ethiopianMonth - Ethiopian month number
 * @param {string} language - 'amharic' or 'english'
 * @returns {string} Formatted Ethiopian date (e.g., "ታህሳስ 18, 2018")
 */
export const formatEthiopianDeadline = (gregorianDate, ethiopianMonth, language = 'amharic') => {
  const date = new Date(gregorianDate);
  const day = date.getDate();
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth() + 1;
  
  // Calculate Ethiopian year (7-8 years behind Gregorian)
  let ethiopianYear;
  if (gregorianMonth >= 9) {
    ethiopianYear = gregorianYear - 7;
  } else {
    ethiopianYear = gregorianYear - 8;
  }
  
  const monthName = getEthiopianMonthName(ethiopianMonth, language);
  
  if (language === 'amharic') {
    return `${monthName} ${day}, ${ethiopianYear}`;
  } else {
    return `${monthName} ${day}, ${ethiopianYear}`;
  }
};

/**
 * Get current Ethiopian date
 * Simplified conversion: Adds approximately 21 days to Gregorian date
 * @returns {object} {day, month, year}
 */
export const getCurrentEthiopianDate = () => {
  const now = new Date();
  const gregorianMonth = now.getMonth() + 1;
  const gregorianDay = now.getDate();
  const gregorianYear = now.getFullYear();
  
  // Ethiopian calendar is approximately 21 days ahead
  // December 8 (Gregorian) = Hidar 29 (Ethiopian)
  const ethiopianDayOffset = 21;
  let ethiopianDay = gregorianDay + ethiopianDayOffset;
  
  // Map Gregorian month to Ethiopian month
  // Note: Ethiopian months transition around the 10th-11th of Gregorian months
  const monthMapping = {
    7: 1, 8: 2, 9: 3, 10: 4, 11: 5, 12: 6,
    1: 7, 2: 8, 3: 9, 4: 10, 5: 11, 6: 12
  };
  
  let ethiopianMonth = monthMapping[gregorianMonth] || 1;
  
  // Adjust for month transition
  // If we're in the first ~10 days of a Gregorian month, we're still in the previous Ethiopian month
  if (gregorianDay <= 10) {
    ethiopianMonth = ethiopianMonth - 1;
    if (ethiopianMonth < 1) {
      ethiopianMonth = 12;
    }
  }
  
  // If day exceeds 30, move to next month
  if (ethiopianDay > 30) {
    ethiopianDay = ethiopianDay - 30;
    ethiopianMonth = ethiopianMonth + 1;
    if (ethiopianMonth > 12) {
      ethiopianMonth = 1;
    }
  }
  
  // Calculate Ethiopian year
  let ethiopianYear;
  if (gregorianMonth >= 9) {
    ethiopianYear = gregorianYear - 7;
  } else {
    ethiopianYear = gregorianYear - 8;
  }
  
  return { day: ethiopianDay, month: ethiopianMonth, year: ethiopianYear };
};

/**
 * Get days remaining until deadline (Ethiopian Calendar calculation)
 * @param {Date|string} deadline - Deadline date (Gregorian)
 * @param {number} deadlineEthiopianMonth - Ethiopian month of deadline
 * @returns {number} Days remaining in Ethiopian calendar
 */
export const getDaysUntilDeadline = (deadline, deadlineEthiopianMonth) => {
  const currentEC = getCurrentEthiopianDate();
  const deadlineDate = new Date(deadline);
  const deadlineDay = deadlineDate.getDate(); // Should be 18
  
  // If same month, simple subtraction
  if (currentEC.month === deadlineEthiopianMonth) {
    return deadlineDay - currentEC.day;
  }
  
  // If deadline is next month
  if (deadlineEthiopianMonth === currentEC.month + 1) {
    // Days left in current month + days in deadline month
    const daysLeftInCurrentMonth = 30 - currentEC.day;
    return daysLeftInCurrentMonth + deadlineDay;
  }
  
  // If deadline is in the past
  if (deadlineEthiopianMonth < currentEC.month) {
    return -1; // Deadline passed
  }
  
  // For other cases, calculate month difference
  const monthDiff = deadlineEthiopianMonth - currentEC.month;
  const daysLeftInCurrentMonth = 30 - currentEC.day;
  const fullMonthsDays = (monthDiff - 1) * 30;
  return daysLeftInCurrentMonth + fullMonthsDays + deadlineDay;
};
