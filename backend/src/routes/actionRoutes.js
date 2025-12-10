import express from 'express';
import {
  createActions,
  getActionsByPlan,
  getMyActionReports,
  submitActionReport,
  getAllActionReports,
  getActionSummaryByBranch,
  quickUpdateAchievement
} from '../controllers/actionController.js';
import { authenticate, authorizeMainBranch, authorizeBranchUser } from '../middleware/auth.js';

const router = express.Router();

// Main branch routes
router.post('/', authenticate, authorizeMainBranch, createActions);
router.get('/plan/:planId', authenticate, getActionsByPlan);
router.get('/reports/plan/:planId', authenticate, authorizeMainBranch, getAllActionReports);
router.get('/summary/:planId', authenticate, authorizeMainBranch, getActionSummaryByBranch);

// Branch user routes
router.get('/my-reports', authenticate, authorizeBranchUser, getMyActionReports);
router.post('/submit', authenticate, authorizeBranchUser, submitActionReport);
router.put('/quick-update', authenticate, authorizeBranchUser, quickUpdateAchievement);

export default router;
