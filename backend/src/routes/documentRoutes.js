import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { ACTIONS } from '../constants/actions.js';
import {
  createUploadSession,
  completeUpload,
  listDocuments,
  deleteDocument,
} from '../controllers/document.js';

const router = Router();

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
  ]),
  completeUpload,
);



router.get('/', protect, authorize(ACTIONS.DOCUMENT.READ),
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
    query('status').optional().isString().trim(),
  ]),
  listDocuments,
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
