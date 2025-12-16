# Duplicate Submission Prevention Fix

## Problem
Woredas were able to submit their plan reports multiple times, even after they had already submitted them. The system should prevent duplicate submissions and show a clear message that the report has already been submitted.

## Solution Implemented

### 1. Monthly Reports (SubmitReport.jsx)
- **Frontend Changes:**
  - Added visual indication when report is already submitted (green success message)
  - Disabled all form inputs when report has `submitted_at` timestamp
  - Changed submit button to "Return to Dashboard" when already submitted
  - Added readonly and disabled attributes to prevent form interaction

- **Backend Changes:**
  - Added validation in `submitMonthlyReport` controller
  - Checks if `report.submitted_at` exists before allowing submission
  - Returns 400 error with clear message if already submitted

### 2. Amharic Activity Reports (SubmitAmharicReport.jsx)
- **Frontend Changes:**
  - Added check for existing submitted reports on page load
  - Shows green success message when reports already submitted
  - Disables all form inputs and submit button
  - Changes submit button to "Return to Reports" when already submitted

- **Backend Changes:**
  - Added validation in `submitAmharicActivityReports` controller
  - Checks for any submitted reports for the plan/period/user before processing
  - Returns 400 error if any reports already submitted for this plan

## Testing Steps

### Test Monthly Reports:
1. Login as a woreda user
2. Go to dashboard and click "Submit Report" on any pending report
3. Fill out the form and submit
4. Try to access the same report again
5. **Expected:** Form should be disabled, green message shown, only "Return to Dashboard" button available

### Test Amharic Reports:
1. Login as a woreda user
2. Go to Amharic Plan Reports
3. Click "Submit Report" on any plan
4. Fill out activities and submit
5. Try to access the same plan report again
6. **Expected:** Form should be disabled, green message shown, only "Return to Reports" button available

### Test Backend API:
1. Try to submit the same report via API call
2. **Expected:** Should receive 400 error with message about duplicate submission

## Error Messages
- **English:** "You have already submitted this report. Please return to dashboard."
- **Amharic:** "ይህ ሪፖርት ቀደም ብሎ ገብቷል። ዳሽቦርድ ላይ ተመለስ።"

## Files Modified
1. `frontend/src/pages/SubmitReport.jsx` - Monthly report submission
2. `frontend/src/pages/SubmitAmharicReport.jsx` - Amharic activity report submission  
3. `backend/src/controllers/reportController.js` - Monthly report backend validation
4. `backend/src/controllers/annualPlanController.js` - Amharic report backend validation

The fix ensures that once a woreda submits their report, they cannot submit it again, preventing data duplication and confusion.