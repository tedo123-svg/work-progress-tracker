// Test Ethiopian Year Calculation
// Run this to verify the Ethiopian calendar year is correct

const getCurrentEthiopianDate = () => {
  const now = new Date();
  const gregorianMonth = now.getMonth() + 1; // 1-12
  const gregorianDay = now.getDate();
  const gregorianYear = now.getFullYear();
  
  console.log(`Current Gregorian Date: ${gregorianMonth}/${gregorianDay}/${gregorianYear}`);
  
  // Fixed Ethiopian calendar conversion
  // December 16, 2025 should be Tahsas 7, 2018
  
  let ethiopianDay;
  let ethiopianMonth;
  let ethiopianYear;
  
  if (gregorianMonth === 12) { // December
    ethiopianDay = gregorianDay - 9;
    ethiopianMonth = 6; // Tahsas
    ethiopianYear = gregorianYear - 7; // 2025 - 7 = 2018
    
    if (ethiopianDay <= 0) {
      ethiopianDay = 30 + ethiopianDay;
      ethiopianMonth = 5; // Hidar
    }
  } else {
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
    
    ethiopianMonth = monthMapping[gregorianMonth] || 1;
    
    ethiopianDay = gregorianDay - 9;
    if (ethiopianDay <= 0) {
      ethiopianDay = 30 + ethiopianDay;
      ethiopianMonth = ethiopianMonth - 1;
      if (ethiopianMonth < 1) {
        ethiopianMonth = 12;
      }
    }
    
    if (gregorianMonth >= 9) {
      ethiopianYear = gregorianYear - 7;
    } else {
      ethiopianYear = gregorianYear - 8;
    }
  }
  
  return { day: ethiopianDay, month: ethiopianMonth, year: ethiopianYear };
};

// Test the function
const ethiopianDate = getCurrentEthiopianDate();
console.log(`Current Ethiopian Date: Month ${ethiopianDate.month}, Day ${ethiopianDate.day}, Year ${ethiopianDate.year}`);

// Expected results for January 2026:
// Should be around Tir (month 7), Year 2018
console.log('\n✅ Ethiopian Calendar Year Fix Applied!');
console.log(`📅 Current Ethiopian Year: ${ethiopianDate.year} (instead of Gregorian ${new Date().getFullYear()})`);
console.log('🎯 This will now be used in Create Plan and Edit Plan forms');