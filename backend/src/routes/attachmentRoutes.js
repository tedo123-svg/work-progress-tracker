import express from 'express';
import { authenticate, authorizeMainBranch, authorizeBranchUser } from '../middleware/auth.js';
import {
  addActionAttachment,
  addActionReportAttachment,
  addMonthlyReportAttachment,
  listAttachments
} from '../controllers/attachmentsController.js';

const router = express.Router();

// Main branch: attach to actions
router.post('/action/:actionId', authenticate, authorizeMainBranch, addActionAttachment);

// Branch users: attach to their own reports
router.post('/action-report/:reportId', authenticate, authorizeBranchUser, addActionReportAttachment);
router.post('/monthly-report/:reportId', authenticate, authorizeBranchUser, addMonthlyReportAttachment);

// List attachments for any entity
router.get('/:entityType/:entityId', authenticate, listAttachments);

export default router;
