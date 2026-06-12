import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { ACTIONS } from '../constants/actions.js';
import { ROLES } from '../constants/roles.js';
import { can } from '../security/policy.js';
import {
  assignDepartments,
  assignUsers,
  createUploadSession,
  completeUpload,
  getAssignmentTargets,
  listDocuments,
  getDocumentView,
  deleteDocument,
} from '../controllers/document.js';

const router = Router();

const authorizeDocumentList = (req, res, next) => {
  const action = req.auth?.roleName === ROLES.USER
    ? ACTIONS.DOCUMENT.READ_ASSIGNED
    : ACTIONS.DOCUMENT.READ;
  const decision = can(req.auth, action);

  if (!decision.allowed) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return next();
};

router.post('/upload-url', protect, authorize(ACTIONS.DOCUMENT.CREATE),
  validate([
    body('originalName')
      .isString()
      .withMessage('originalName must be a string')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('originalName must be 1-255 characters'),
    body('contentType').trim().notEmpty().withMessage('contentType is required'),
    body('sizeBytes')
      .isInt({ min: 1, max: 20 * 1024 * 1024 })
      .withMessage('sizeBytes must be between 1 and 20 MB'),
  ]),
  createUploadSession,
);


router.post('/:id/complete', protect, authorize(ACTIONS.DOCUMENT.CREATE),
  validate([
    param('id').isMongoId().withMessage('Document id must be valid'),
    body('originalName')
      .isString()
      .withMessage('originalName must be a string')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('originalName must be 1-255 characters'),
    body('contentType').trim().notEmpty().withMessage('contentType is required'),
    body('sizeBytes')
      .isInt({ min: 1, max: 20 * 1024 * 1024 })
      .withMessage('sizeBytes must be between 1 and 20 MB'),
  ]),
  completeUpload,
);



router.get('/', protect,
  authorizeDocumentList,
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
    query('status').optional().isString().trim(),
  ]),
  listDocuments,
);

router.get(
  '/:id/view',
  protect,
  authorizeDocumentList,
  validate([
    param('id').isMongoId().withMessage('Document id must be valid'),
  ]),
  getDocumentView,
);

router.get(
  '/:id/assignment-targets',
  protect,
  authorize(ACTIONS.DOCUMENT.ASSIGN),
  validate([
    param('id').isMongoId().withMessage('Document id must be valid'),
  ]),
  getAssignmentTargets,
);

router.patch(
  '/:id/assign-departments',
  protect,
  authorize(ACTIONS.DOCUMENT.ASSIGN),
  validate([
    param('id').isMongoId().withMessage('Document id must be valid'),
    body('departmentIds').isArray({ max: 100 }).withMessage('departmentIds must be an array'),
    body('departmentIds.*').isMongoId().withMessage('Each department id must be valid'),
  ]),
  assignDepartments,
);

router.patch(
  '/:id/assign-users',
  protect,
  authorize(ACTIONS.DOCUMENT.ASSIGN),
  validate([
    param('id').isMongoId().withMessage('Document id must be valid'),
    body('userIds').isArray({ max: 500 }).withMessage('userIds must be an array'),
    body('userIds.*').isMongoId().withMessage('Each user id must be valid'),
  ]),
  assignUsers,
);



router.delete(
  '/:id',
  protect,
  authorize(ACTIONS.DOCUMENT.DELETE),
  validate([
    param('id').isMongoId().withMessage('Document id must be valid'),
  ]),
  deleteDocument,
);

export default router;
