import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post(
  '/register',
  validate([
    body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isString().trim().notEmpty().withMessage('Role must be a non-empty string'),
  ]),
  register,
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password required'),
  ]),
  login,
);

router.get('/me', protect, getMe);

export default router;
