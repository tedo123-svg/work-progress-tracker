# Deploy Monthly Auto-Renewal System - Step by Step

## Step 1: Update Database (Supabase)

### Option A: Using Supabase Dashboard (Easiest)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the contents of `backend/src/database/monthly-schema.sql`
6. Click "Run" button
7. You should see "Success. No rows returned"

### Option B: Using Command Line (If you have psql installed)
```bash
set PGPASSWORD=Word@1212tedo
psql -h aws-0-eu-north-1.pooler.supabase.com -p 6543 -U postgres.lxzuarfulvoqfmswdkga -d postgres -f backend/src/database/monthly-schema.sql
```

## Step 2: Deploy Backend to Render

### Automatic Deployment (Recommended)
```bash
# Commit and push changes
git add .
git commit -m "Add monthly auto-renewal system"
git push origin main
```

Render will automatically detect the changes and redeploy (takes 2-3 minutes).

### Manual Deployment
1. Go to https://dashboard.render.com
2. Find your "work-progress-tracker" service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete

## Step 3: Verify System is Working

### Check 1: Backend is Running
Visit: https://work-progress-tracker.onrender.com/api/health

Should return:
```json
{
  "status": "ok",
  "message": "Work Progress Tracker API is running"
}
```

### Check 2: Monthly Plan Created
Visit: https://work-progress-tracker.onrender.com/api/monthly-plans/current

Should return current month's plan (you'll need to login first to get token).

### Check 3: Check Server Logs
1. Go to https://dashboard.render.com
2. Click on your service
3. Click "Logs" tab
4. Look for these messages:
   - "✅ Monthly plan system initialized"
   - "✅ Auto-created monthly plan for month 5, year 2025"

## Step 4: Test the System

### Login and Get Token
```bash
curl -X POST https://work-progress-tracker.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Copy the token from response.

### Get Current Monthly Plan
```bash
curl https://work-progress-tracker.onrender.com/api/monthly-plans/current \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Monthly Target (Main Branch Only)
```bash
curl -X PUT https://work-progress-tracker.onrender.com/api/monthly-plans/current/target \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"targetAmount": 114277.75}'
```

### View History
```bash
curl https://work-progress-tracker.onrender.com/api/monthly-plans/history \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Manually Trigger Renewal Check (For Testing)
```bash
curl -X POST https://work-progress-tracker.onrender.com/api/monthly-plans/check-renewal \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 5: Visit Your App

Go to: https://work-progress-tracker-rho.vercel.app

Login with:
- Username: `admin`
- Password: `admin123`

The system should now be running with the monthly auto-renewal system!

## What Happens Next?

### Automatic Processes:
1. **On Server Startup:**
   - System checks if current month's plan exists
   - If not, creates it automatically
   - Starts hourly renewal checks

2. **Every Hour:**
   - System checks if deadline (18th) has passed
   - If yes: Archives current month, creates next month
   - If no: Does nothing

3. **When Month Changes:**
   - You need to update `getCurrentEthiopianMonth()` in `monthlyPlanController.js`
   - Change from 5 to 6 when month 6 starts
   - Redeploy backend

## Troubleshooting

### Database Migration Failed
- Check if you're connected to the right database
- Verify password is correct
- Try running SQL directly in Supabase dashboard

### Backend Not Deploying
- Check Render dashboard for errors
- Verify all files are committed to Git
- Check build logs for errors

### Plan Not Creating
- Check server logs in Render
- Verify database connection
- Try manually triggering: POST /api/monthly-plans/check-renewal

### Wrong Month Showing
- Update `getCurrentEthiopianMonth()` in controller
- Commit and push changes
- Render will auto-redeploy

## Important Notes

- System is fully automatic after initial setup
- Only ONE active plan at a time (current month)
- Past plans are archived, not deleted
- All branch reports are preserved
- Renewal checks run every hour
- Deadline is 18th of each month

## Monthly Maintenance

**On the 1st of each Ethiopian month:**
1. Edit `backend/src/controllers/monthlyPlanController.js`
2. Update `getCurrentEthiopianMonth()` to new month number
3. Commit and push: `git add . && git commit -m "Update to month X" && git push`
4. Render auto-deploys
5. System auto-creates new month's plan

That's it! The system handles everything else automatically.

## Need Help?

Check these files for more details:
- `MONTHLY-AUTO-RENEWAL-SYSTEM.md` - Full system documentation
- `IMPLEMENTATION-SUMMARY.md` - Technical details
- `backend/src/controllers/monthlyPlanController.js` - Core logic
