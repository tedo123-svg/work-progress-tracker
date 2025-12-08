import express from 'express';
import { authenticate, authorizeMainBranch } from '../middleware/auth.js';
import {
  getCurrentMonthlyPlan,
  updateMonthlyPlanTarget,
  getAllMonthlyPlans,
  getMonthlyPlanStats,
  checkAndRenewMonthlyPlan
} from '../controllers/monthlyPlanController.js';

const router = express.Router();

// Get current active monthly plan (all users)
router.get('/current', authenticate, getCurrentMonthlyPlan);

// Update monthly plan target (main branch only)
router.put('/current/target', authenticate, authorizeMainBranch, updateMonthlyPlanTarget);

// Get all monthly plans for history (all users)
router.get('/history', authenticate, getAllMonthlyPlans);

// Get monthly plan statistics (all users)
router.get('/:planId/stats', authenticate, getMonthlyPlanStats);

// Manual trigger to check and renew plans (main branch only)
router.post('/check-renewal', authenticate, authorizeMainBranch, async (req, res) => {
  try {
    await checkAndRenewMonthlyPlan();
    res.json({ message: 'Monthly plan renewal check completed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check monthly plan renewal' });
  }
});

export default router;
