import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  appendFinding,
} from '../controllers/workspaceController.js';

const router = Router();

router.get('/', protect, listWorkspaces);

router.post(
  '/',
  protect,
  validate([
    body('title').optional().trim().isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
  ]),
  createWorkspace
);

router.get(
  '/:id',
  protect,
  validate([param('id').isMongoId().withMessage('Invalid workspace id')]),
  getWorkspace
);

router.patch(
  '/:id',
  protect,
  validate([param('id').isMongoId().withMessage('Invalid workspace id')]),
  updateWorkspace
);

router.delete(
  '/:id',
  protect,
  validate([param('id').isMongoId().withMessage('Invalid workspace id')]),
  deleteWorkspace
);

router.post(
  '/:id/findings',
  protect,
  validate([param('id').isMongoId().withMessage('Invalid workspace id')]),
  appendFinding
);

export default router;
