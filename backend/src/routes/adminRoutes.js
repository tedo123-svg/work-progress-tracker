import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchStats,
  resetBranchPassword,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getSystemStats,
  updateUserEmail
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

// Branch management routes (legacy - kept for compatibility)
router.get('/branches', getAllBranches);
router.post('/branches', createBranch);
router.put('/branches/:id', updateBranch);
router.delete('/branches/:id', deleteBranch);
router.post('/branches/:id/reset-password', resetBranchPassword);

// User management routes (enhanced)
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/reset-password', resetUserPassword);
router.put('/users/:id/email', updateUserEmail);

// Statistics and overview
router.get('/stats', getBranchStats);
router.get('/system-stats', getSystemStats);

export default router;