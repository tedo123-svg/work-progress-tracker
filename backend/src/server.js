import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import annualPlanRoutes from './routes/annualPlanRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import actionRoutes from './routes/actionRoutes.js';
import monthlyPlanRoutes from './routes/monthlyPlanRoutes.js';
import attachmentRoutes from './routes/attachmentRoutes.js';
import { autoCreateMonthlyPlan, checkAndRenewMonthlyPlan } from './controllers/monthlyPlanController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Allow all origins for now
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/annual-plans', annualPlanRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/monthly-plans', monthlyPlanRoutes);
app.use('/api/attachments', attachmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Work Progress Tracker API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Auto-create current month's plan if it doesn't exist
  try {
    await autoCreateMonthlyPlan();
    console.log('✅ Monthly plan system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize monthly plan:', error);
  }
  
  // Check and renew monthly plans every hour
  setInterval(async () => {
    try {
      await checkAndRenewMonthlyPlan();
    } catch (error) {
      console.error('❌ Monthly plan renewal check failed:', error);
    }
  }, 60 * 60 * 1000); // Every hour
  
  // Also check immediately on startup
  setTimeout(async () => {
    try {
      await checkAndRenewMonthlyPlan();
    } catch (error) {
      console.error('❌ Initial monthly plan renewal check failed:', error);
    }
  }, 5000); // After 5 seconds
});
