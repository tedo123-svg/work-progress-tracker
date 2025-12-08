# Monthly Auto-Renewal System

## Overview
The system has been upgraded from **Annual Plans** to **Monthly Auto-Renewal Plans**.

## How It Works

### 1. Automatic Plan Creation
- ✅ System automatically creates a monthly plan for the current Ethiopian month
- ✅ No manual creation needed - happens on server startup
- ✅ Only ONE active plan exists at a time (current month only)

### 2. Auto-Renewal Process
- ✅ When the 18th deadline passes, the system automatically:
  1. Archives the current month's plan
  2. Creates next month's plan with the same target numbers
  3. Creates new reports for all 10 branch users
  4. Repeats monthly forever

### 3. What Branches See
- ✅ Branches see ONLY the current month's plan
- ✅ Past months are archived but kept for history/reports
- ✅ No future months visible (only current)

### 4. Data Retention
- ✅ All historical data is preserved
- ✅ Archived plans remain in database
- ✅ Past reports accessible for analytics
- ✅ Full audit trail maintained

## Technical Implementation

### Database Changes

**New Table: `monthly_plans`**
```sql
- id: Primary key
- title: Plan title
- description: Plan description
- month: Ethiopian month (1-12)
- year: Ethiopian year
- target_amount: Monthly target number
- deadline: 18th of the month
- status: 'active' or 'archived'
- created_at, updated_at: Timestamps
```

**Key Features:**
- Only ONE active plan per month/year (enforced by UNIQUE constraint)
- Automatic archiving when deadline passes
- Auto-creation of next month's plan

### API Endpoints

**GET `/api/monthly-plans/current`**
- Returns current active monthly plan
- Auto-creates if doesn't exist
- Available to all users

**PUT `/api/monthly-plans/current/target`**
- Update current month's target
- Main branch only
- Body: `{ targetAmount: number }`

**GET `/api/monthly-plans/history`**
- Get all monthly plans (active + archived)
- For reports and analytics
- Available to all users

**GET `/api/monthly-plans/:planId/stats`**
- Get statistics for a specific monthly plan
- Shows submission rates, progress, etc.

**POST `/api/monthly-plans/check-renewal`**
- Manually trigger renewal check
- Main branch only
- Useful for testing

### Automatic Processes

**On Server Startup:**
1. Auto-create current month's plan if missing
2. Schedule hourly renewal checks
3. Run initial renewal check after 5 seconds

**Hourly Check (Every 60 minutes):**
1. Check if current plan's deadline has passed
2. If yes: Archive current, create next month
3. If no: Do nothing

**Renewal Logic:**
```javascript
Current Month: 5 (ኅዳር)
Deadline: 18th of month 5
Today: 19th of month 5

Action:
1. Archive month 5 plan (status = 'archived')
2. Create month 6 plan (ታኅሣሥ)
3. Copy target_amount from month 5
4. Set deadline to 18th of month 6
5. Create reports for all 10 branches
```

## Configuration

### Update Current Month
Edit `backend/src/controllers/monthlyPlanController.js`:

```javascript
const getCurrentEthiopianMonth = () => {
  return 5; // Update this when month changes
};

const getCurrentEthiopianYear = () => {
  return 2025; // Update yearly
};
```

**Important:** Update these values on the 1st of each Ethiopian month!

### Deadline Day
Currently set to 18th of each month. To change:

```javascript
const getDeadlineForMonth = (month, year) => {
  return new Date(year, month - 1, 18); // Change 18 to desired day
};
```

## Migration from Annual to Monthly

### Step 1: Run Database Migration
```bash
psql -h aws-0-eu-north-1.pooler.supabase.com -p 6543 -U postgres.lxzuarfulvoqfmswdkga -d postgres -f backend/src/database/monthly-schema.sql
```

### Step 2: Deploy Backend
The backend will automatically:
- Create current month's plan on startup
- Start hourly renewal checks
- Handle all automation

### Step 3: Update Frontend
Frontend changes needed:
- Update dashboard to show only current month
- Remove "Create Annual Plan" button
- Add "Update Monthly Target" button (main branch)
- Show current month's plan details

## Benefits

### For Main Branch
- ✅ No manual monthly plan creation
- ✅ Consistent targets month-to-month
- ✅ Can adjust current month's target anytime
- ✅ Full historical data access

### For Branch Users
- ✅ See only current month (less confusion)
- ✅ Clear deadlines (18th of each month)
- ✅ Automatic report creation
- ✅ Past submissions preserved

### For System
- ✅ Fully automated - no manual intervention
- ✅ Scalable - works indefinitely
- ✅ Reliable - hourly checks ensure no missed renewals
- ✅ Data integrity - all history preserved

## Monitoring

### Check Current Plan
```bash
curl https://work-progress-tracker.onrender.com/api/monthly-plans/current
```

### Check Renewal Status
```bash
curl -X POST https://work-progress-tracker.onrender.com/api/monthly-plans/check-renewal \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View History
```bash
curl https://work-progress-tracker.onrender.com/api/monthly-plans/history
```

## Troubleshooting

### Plan Not Auto-Creating
1. Check server logs for errors
2. Verify database connection
3. Manually trigger: `POST /api/monthly-plans/check-renewal`

### Wrong Month Showing
1. Update `getCurrentEthiopianMonth()` in controller
2. Restart server
3. System will auto-create correct month

### Renewal Not Happening
1. Check if deadline has actually passed
2. Verify hourly check is running (check logs)
3. Manually trigger renewal endpoint

## Future Enhancements

### Possible Additions:
- Email notifications before deadline
- SMS reminders to branches
- Dashboard widget showing days until deadline
- Automatic target adjustment based on previous performance
- Predictive analytics for next month's targets

## Notes

- System uses Ethiopian calendar (12 months)
- Deadline is 18th of each month
- Only one active plan at a time
- All past data preserved forever
- Fully automated - no manual intervention needed
