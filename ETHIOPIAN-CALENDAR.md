# Ethiopian Government Fiscal Year Calendar Configuration

## Current Month Setting

The system filters reports to show only **upcoming months** based on the Ethiopian Government Fiscal Year calendar.

### How to Update the Current Month

When a new Ethiopian month begins, update the `CURRENT_ETHIOPIAN_MONTH` constant in:

**File**: `frontend/src/utils/ethiopianCalendar.js`

```javascript
export const CURRENT_ETHIOPIAN_MONTH = 5; // Update this number (1-12)
```

### Ethiopian Government Fiscal Year - Month Order

The fiscal year starts with **ሐምሌ (Hamle)** and ends with **ሰኔ (Sene)**:

| Number | Amharic | English | Gregorian Equivalent |
|--------|---------|---------|---------------------|
| 1 | ሐምሌ | Hamle | Jul 8 - Aug 6 |
| 2 | ነሐሴ | Nehase | Aug 7 - Sep 5 |
| 3 | መስከረም | Meskerem | Sep 11 - Oct 10 |
| 4 | ጥቅምት | Tikimt | Oct 11 - Nov 9 |
| 5 | ኅዳር | Hidar | Nov 10 - Dec 9 |
| 6 | ታኅሣሥ | Tahsas | Dec 10 - Jan 8 |
| 7 | ጥር | Tir | Jan 9 - Feb 7 |
| 8 | የካቲት | Yekatit | Feb 8 - Mar 9 |
| 9 | መጋቢት | Megabit | Mar 10 - Apr 8 |
| 10 | ሚያዝያ | Miazia | Apr 9 - May 8 |
| 11 | ግንቦት | Ginbot | May 9 - Jun 7 |
| 12 | ሰኔ | Sene | Jun 8 - Jul 7 |

### Current Status

**Current Month**: 5 (ኅዳር - Hidar)  
**Visible Months**: 6-12 (ታኅሣሥ through ሰኔ)  
**Hidden Months**: 1-5 (Past months: ሐምሌ, ነሐሴ, መስከረም, ጥቅምት, ኅዳር)

### How It Works

1. When branch users view their dashboard, only reports for **future months** are displayed
2. Past months (1 through current month) are automatically hidden
3. This prevents clutter and focuses on upcoming work

### Monthly Update Process

At the beginning of each Ethiopian month:

1. Open `frontend/src/utils/ethiopianCalendar.js`
2. Update `CURRENT_ETHIOPIAN_MONTH` to the new month number
3. Commit and push changes
4. Vercel will auto-deploy the update

Example:
```bash
# When ታኅሣሥ (month 6) begins
cd work-progress-tracker
# Edit frontend/src/utils/ethiopianCalendar.js
# Change: export const CURRENT_ETHIOPIAN_MONTH = 6;
git add .
git commit -m "Update Ethiopian calendar to month 6 (ታኅሣሥ)"
git push origin main
```

### Deadline Configuration

Monthly deadlines are set to the **18th day** of each Ethiopian month (as configured in the backend).

This aligns with Ethiopian calendar where each month has 30 days (except Pagumen with 5-6 days).
