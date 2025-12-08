@echo off
echo ========================================
echo Deploying Monthly Auto-Renewal System
echo ========================================
echo.

echo Step 1: Running database migration...
echo.
set PGPASSWORD=Word@1212tedo
psql -h aws-0-eu-north-1.pooler.supabase.com -p 6543 -U postgres.lxzuarfulvoqfmswdkga -d postgres -f backend/src/database/monthly-schema.sql

echo.
echo Step 2: Committing changes to Git...
git add .
git commit -m "Add monthly auto-renewal system"

echo.
echo Step 3: Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Wait 2-3 minutes for Render to auto-deploy backend
echo 2. Check deployment at: https://dashboard.render.com
echo 3. Visit your app: https://work-progress-tracker-rho.vercel.app
echo.
echo The system will automatically:
echo - Create current month's plan on startup
echo - Check for renewals every hour
echo - Archive old plans and create new ones
echo.
pause
