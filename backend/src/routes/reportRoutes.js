import express from 'express';
import { submitMonthlyReport, getMyReports, getAllReports, getBranchComparison, getAllCurrentMonthReports } from '../controllers/reportController.js';
import { authenticate, authorizeBranchUser, authorizeMainBranch } from '../middleware/auth.js';

const router = express.Router();

router.post('/submit', authenticate, authorizeBranchUser, submitMonthlyReport);
router.get('/my-reports', authenticate, authorizeBranchUser, getMyReports);
router.get('/plan/:planId', authenticate, authorizeMainBranch, getAllReports);
router.get('/comparison/:planId', authenticate, authorizeMainBranch, getBranchComparison);
router.get('/current-month/all', authenticate, authorizeMainBranch, getAllCurrentMonthReports);

export default router;
