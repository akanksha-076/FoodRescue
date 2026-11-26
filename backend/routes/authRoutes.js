const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.'),
    body('role')
      .optional()
      .isIn(USER_ROLES)
      .withMessage('Role must be donor, ngo, or admin.'),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  login
);

router.get('/me', protect, getMe);

router.put(
  '/profile',
  protect,
  upload.single('profileImage'),
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Name must be 2–80 characters.'),
    body('phone').optional().trim().isLength({ max: 25 }),
    body('organizationName').optional().trim().isLength({ max: 120 }),
    body('address').optional().trim().isLength({ max: 250 }),
  ],
  validate,
  updateProfile
);

module.exports = router;
