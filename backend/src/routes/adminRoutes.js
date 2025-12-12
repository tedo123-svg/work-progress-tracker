import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchStats,
  resetBranchPassword,
  getAllUsers
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

// Branch management routes
router.get('/branches', getAllBranches);
router.post('/branches', createBranch);
router.put('/branches/:id', updateBranch);
router.delete('/branches/:id', deleteBranch);
router.post('/branches/:id/reset-password', resetBranchPassword);

// Statistics and overview
router.get('/stats', getBranchStats);
router.get('/users', getAllUsers);

export default router;