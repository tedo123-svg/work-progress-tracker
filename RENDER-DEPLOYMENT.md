# 🚀 Deploy Backend to Render.com

Render.com is more reliable than Back4App for Node.js applications and offers a generous free tier.

## Step 1: Create Render Account

1. Go to https://render.com
2. Click **"Get Started"**
3. Sign up with **GitHub** (easiest option)
4. Authorize Render to access your repositories

## Step 2: Create New Web Service

1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Connect your GitHub repository:
   - Find: `work-progress-tracker`
   - Click **"Connect"**

## Step 3: Configure Service

### Basic Settings:
- **Name**: `work-progress-tracker` (or any name you like)
- **Region**: Choose closest to you (e.g., Frankfurt for Europe)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Instance Type:
- Select **"Free"** (0$/month)

## Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** for each:

```
PORT=5000
NODE_ENV=production
DB_HOST=aws-1-eu-north-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.lxzuarfulvoqfmswdkga
DB_PASSWORD=Word@1212tedo
DB_SSL=true
JWT_SECRET=work_progress_tracker_secret_key_2024_change_this
JWT_EXPIRES_IN=7d
```

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Render will show build logs in real-time

## Step 6: Get Your URL

After deployment completes:
- Your backend URL will be: `https://work-progress-tracker.onrender.com`
- Copy this URL for frontend configuration

## Step 7: Test Backend

Visit: `https://work-progress-tracker.onrender.com/api/health`

Should return:
```json
{
  "status": "ok",
  "message": "Work Progress Tracker API is running"
}
```

## Step 8: Update Frontend

Update your frontend environment variable on Vercel:
1. Go to Vercel Dashboard → Your project → Settings → Environment Variables
2. Edit `VITE_API_URL`
3. Change to: `https://work-progress-tracker.onrender.com/api`
4. Redeploy frontend

## Benefits of Render vs Back4App

✅ More reliable deployments
✅ Better free tier (750 hours/month)
✅ Automatic HTTPS
✅ Better logging and monitoring
✅ Easier configuration
✅ Auto-deploy from GitHub (free tier)

## Important Notes

⚠️ **Free tier sleeps after 15 minutes of inactivity**
- First request after sleep takes 30-60 seconds to wake up
- Subsequent requests are fast
- Upgrade to paid tier ($7/month) to prevent sleeping

⚠️ **Free tier limits:**
- 750 hours/month (enough for testing)
- 512 MB RAM
- Shared CPU

## Troubleshooting

**Build Failed?**
- Check logs in Render dashboard
- Verify Root Directory is set to `backend`
- Ensure all environment variables are added

**Can't Connect to Database?**
- Verify Supabase credentials
- Check DB_SSL is set to `true`
- Test Supabase connection directly

**App Not Responding?**
- Check if service is sleeping (free tier)
- Wait 30-60 seconds for wake up
- Check logs for errors

---

**That's it! Your backend is now live on Render.com! 🎉**
