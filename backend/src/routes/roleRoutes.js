import { Router } from 'express';
import { body, param } from 'express-validator';
import { createRole, getRoles, updateRolePermissions } from '../controllers/roleController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { ACTIONS } from '../constants/actions.js';

const router = Router();

router.post(
  '/create-role',
  protect,
  authorize(ACTIONS.ROLE.CREATE),
  validate([
    body('name')
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Role name must be 2-80 characters'),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('permissions must be an array'),
    body('permissions.*')
      .optional()
      .isString()
      .withMessage('Each permission must be a string'),
  ]),
  createRole
);

router.patch(
  '/:id/permissions',
  protect,
  authorize(ACTIONS.PERMISSION.UPDATE),
  validate([
    param('id').isMongoId().withMessage('Invalid role id'),
    body('permissions')
      .isArray()
      .withMessage('permissions must be an array'),
    body('permissions.*')
      .isString()
      .withMessage('Each permission must be a string'),
  ]),
  updateRolePermissions
);

router.get('/get-roles', protect, authorize(ACTIONS.ROLE.READ), getRoles);

export default router;
