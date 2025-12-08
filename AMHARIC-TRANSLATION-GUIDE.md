# የአማርኛ ትርጉም መመሪያ (Amharic Translation Guide)

## Overview

This guide shows how to translate the Work Progress Tracker application to Amharic.

## Translation File Created

✅ **File**: `frontend/src/utils/translations.js`

This file contains all Amharic translations organized by category:
- Common words (save, cancel, submit, etc.)
- Authentication (login, logout, username, password)
- Dashboard terms
- Annual plans
- Reports
- Actions
- Navigation
- Ethiopian months (Government fiscal year)
- Status messages
- Validation messages

## How to Use Translations

### Import the translation helper:
```javascript
import { t, getMonthName, getStatusText } from '../utils/translations';
```

### Use in your components:
```javascript
// Simple translation
<h1>{t('dashboard.mainBranch')}</h1>
// Output: ዋና ቅርንጫፍ ዳሽቦርድ

// Month names
<span>{getMonthName(5)}</span>
// Output: ኅዳር

// Status text
<span>{getStatusText('pending')}</span>
// Output: በመጠባበቅ ላይ
```

## Key Pages to Translate

### 1. Login Page (`frontend/src/pages/Login.jsx`)

**Current English**:
```jsx
<h1>Work Progress Tracker</h1>
<p>Modern Reporting System</p>
<label>Username</label>
<label>Password</label>
<button>Sign In</button>
```

**Amharic Translation**:
```jsx
<h1>የስራ እድገት መከታተያ</h1>
<p>ዘመናዊ የሪፖርት ስርዓት</p>
<label>የተጠቃሚ ስም</label>
<label>የይለፍ ቃል</label>
<button>ግባ</button>
```

### 2. Main Branch Dashboard (`frontend/src/pages/MainBranchDashboard.jsx`)

**Replace**:
- "Main Branch Dashboard" → "ዋና ቅርንጫፍ ዳሽቦርድ"
- "Manage annual plans" → "የዓመታዊ እቅዶችን ያስተዳድሩ"
- "Create Annual Plan" → "የዓመታዊ እቅድ ፍጠር"
- "No Annual Plans Yet" → "እስካሁን ምንም የዓመታዊ እቅዶች የሉም"
- "View Details" → "ዝርዝር ይመልከቱ"
- "Comparison" → "ንጽጽር"

### 3. Branch User Dashboard (`frontend/src/pages/BranchUserDashboard.jsx`)

**Replace**:
- "Branch Dashboard" → "ቅርንጫፍ ዳሽቦርድ"
- "Submit and track your monthly reports" → "የወርሃዊ ሪፖርቶችዎን ያስገቡ እና ይከታተሉ"
- "Total Reports" → "ጠቅላላ ሪፖርቶች"
- "Pending" → "በመጠባበቅ ላይ"
- "Submitted" → "ገብቷል"
- "Late" → "ዘግይቷል"
- "Action Reports" → "የተግባር ሪፖርቶች"
- "Plan" → "እቅድ"
- "Period" → "ጊዜ"
- "Target" → "ዒላማ"
- "Achieved" → "የተሳካ"
- "Progress" → "እድገት"
- "Deadline" → "የመጨረሻ ቀን"
- "Status" → "ሁኔታ"
- "Action" → "ተግባር"
- "Submit" → "አስገባ"
- "View/Edit" → "ይመልከቱ/አርትዕ"

### 4. Create Annual Plan (`frontend/src/pages/CreateAnnualPlan.jsx`)

**Replace**:
- "Create Annual Plan" → "የዓመታዊ እቅድ ፍጠር"
- "Plan Title" → "የእቅድ ርዕስ"
- "Description" → "መግለጫ"
- "Year" → "ዓመት"
- "Target Number" → "ዒላማ ቁጥር"
- "What happens next?" → "ምን ይከሰታል?"
- "12 monthly periods will be auto-generated" → "12 ወርሃዊ ጊዜዎች በራስ-ሰር ይፈጠራሉ"
- "Monthly targets will be evenly distributed" → "ወርሃዊ ዒላማዎች በእኩል ይከፋፈላሉ"
- "Reports will be created for all 10 branch users" → "ለሁሉም 10 የቅርንጫፍ ተጠቃሚዎች ሪፖርቶች ይፈጠራሉ"
- "Creating..." → "በመፍጠር ላይ..."
- "Cancel" → "ሰርዝ"

### 5. Submit Report (`frontend/src/pages/SubmitReport.jsx`)

**Replace**:
- "Submit Monthly Report" → "ወርሃዊ ሪፖርት አስገባ"
- "Achieved Amount" → "የተሳካ መጠን"
- "Notes" → "ማስታወሻዎች"
- "Submitting..." → "በማስገባት ላይ..."
- "Submit Report" → "ሪፖርት አስገባ"
- "Back to Dashboard" → "ወደ ዳሽቦርድ ተመለስ"

### 6. View Annual Plan (`frontend/src/pages/ViewAnnualPlan.jsx`)

**Replace**:
- "Year" → "ዓመት"
- "Target Number" → "ዒላማ ቁጥር"
- "Overall Progress" → "አጠቃላይ እድገት"
- "Monthly Targets" → "ወርሃዊ ዒላማዎች"
- "Quarterly Progress" → "ሩብ ዓመታዊ እድገት"
- "Monthly Breakdown" → "ወርሃዊ ክፍፍል"
- "Month" → "ወር"
- "Deadline" → "የመጨረሻ ቀን"
- "Create Actions" → "ተግባራት ፍጠር"

### 7. Navbar (`frontend/src/components/Navbar.jsx`)

**Replace**:
- "Logout" → "ውጣ"
- User role display (keep as is or translate)

### 8. Action Reports (`frontend/src/pages/ActionReports.jsx`)

**Replace**:
- "Action Reports" → "የተግባር ሪፖርቶች"
- "Action Name" → "የተግባር ስም"
- "Plan Number" → "የእቅድ ቁጥር"
- "Target Activity" → "ዒላማ እንቅስቃሴ"
- "Actual Activity" → "ትክክለኛ እንቅስቃሴ"
- "Implementation %" → "ትግበራ %"
- "Month" → "ወር"

### 9. Branch Comparison (`frontend/src/pages/BranchComparison.jsx`)

**Replace**:
- "Branch Comparison" → "የቅርንጫፍ ንጽጽር"
- "Compare performance across all branches" → "በሁሉም ቅርንጫፎች መካከል አፈጻጸምን ያወዳድሩ"
- "Branch" → "ቅርንጫፍ"
- "Performance" → "አፈጻጸም"

## Ethiopian Month Names (Already in translations.js)

```javascript
1: 'ሐምሌ'    // Hamle
2: 'ነሐሴ'     // Nehase
3: 'መስከረም'   // Meskerem
4: 'ጥቅምት'    // Tikimt
5: 'ኅዳር'     // Hidar
6: 'ታኅሣሥ'    // Tahsas
7: 'ጥር'      // Tir
8: 'የካቲት'    // Yekatit
9: 'መጋቢት'    // Megabit
10: 'ሚያዝያ'   // Miazia
11: 'ግንቦት'   // Ginbot
12: 'ሰኔ'      // Sene
```

## Implementation Steps

### Step 1: Update Each Page

For each page file, import the translation helper:
```javascript
import { t, getMonthName, getStatusText } from '../utils/translations';
```

### Step 2: Replace Hard-coded Text

Replace English text with translation function calls:
```javascript
// Before
<h1>Dashboard</h1>

// After
<h1>{t('dashboard.mainBranch')}</h1>
```

### Step 3: Update Month Displays

Replace month displays with Amharic names:
```javascript
// Before
{new Date(report.year, report.month - 1).toLocaleDateString('en-US', { month: 'long' })}

// After
{getMonthName(report.month)}
```

### Step 4: Update Status Badges

Replace status text with Amharic:
```javascript
// Before
<span>Pending</span>

// After
<span>{getStatusText('pending')}</span>
```

## Quick Translation Reference

### Common UI Elements

| English | Amharic |
|---------|---------|
| Dashboard | ዳሽቦርድ |
| Create | ፍጠር |
| View | ይመልከቱ |
| Edit | አርትዕ |
| Delete | ሰርዝ |
| Submit | አስገባ |
| Cancel | ሰርዝ |
| Save | አስቀምጥ |
| Back | ተመለስ |
| Loading | በመጫን ላይ |
| Search | ፈልግ |
| Filter | አጣራ |

### Report Terms

| English | Amharic |
|---------|---------|
| Report | ሪፖርት |
| Monthly Report | ወርሃዊ ሪፖርት |
| Annual Plan | የዓመታዊ እቅድ |
| Target | ዒላማ |
| Achieved | የተሳካ |
| Progress | እድገት |
| Deadline | የመጨረሻ ቀን |
| Status | ሁኔታ |
| Pending | በመጠባበቅ ላይ |
| Submitted | ገብቷል |
| Late | ዘግይቷል |

### Action Terms

| English | Amharic |
|---------|---------|
| Action | ተግባር |
| Plan Number | የእቅድ ቁጥር |
| Target Activity | ዒላማ እንቅስቃሴ |
| Actual Activity | ትክክለኛ እንቅስቃሴ |
| Implementation | ትግበራ |

## Testing Translations

After implementing translations:

1. **Test Login Page**: Verify all text is in Amharic
2. **Test Dashboards**: Check both main and branch dashboards
3. **Test Forms**: Verify form labels and buttons
4. **Test Tables**: Check column headers and data
5. **Test Messages**: Verify error and success messages
6. **Test Month Names**: Ensure Ethiopian months display correctly

## Notes

- The translation file is already created and ready to use
- All translations follow Ethiopian Government fiscal year calendar
- Month names are in correct order (ሐምሌ to ሰኔ)
- Status messages are contextually appropriate
- Form validation messages are included

## Next Steps

To fully translate the app:

1. Import `translations.js` in each page component
2. Replace English text with `t()` function calls
3. Update month displays with `getMonthName()`
4. Update status displays with `getStatusText()`
5. Test each page thoroughly
6. Commit and push changes
7. Vercel will auto-deploy

---

**Translation file location**: `frontend/src/utils/translations.js`

**All translations are ready to use!** Just import and apply them to each component.
