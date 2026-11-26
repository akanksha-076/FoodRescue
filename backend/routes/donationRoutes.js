const express = require('express');
const { body } = require('express-validator');
const {
  createDonation,
  getDonations,
  getMyDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
  cancelDonation,
} = require('../controllers/donationController');
const { getRequestsForDonation } = require('../controllers/requestController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { DONATION_CATEGORIES, DONATION_UNITS } = require('../models/Donation');

const router = express.Router();

router.get('/', getDonations);
router.get('/my', protect, authorize('donor'), getMyDonations);
router.get('/:id/requests', protect, authorize('donor', 'admin'), getRequestsForDonation);
router.get('/:id', optionalAuth, getDonationById);

router.post(
  '/',
  protect,
  authorize('donor'),
  upload.single('image'),
  [
    body('foodName')
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage('Food name must be 2–120 characters.'),
    body('category')
      .isIn(DONATION_CATEGORIES)
      .withMessage('Please select a valid food category.'),
    body('description')
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Description must be 5–1000 characters.'),
    body('quantity')
      .isFloat({ min: 1 })
      .withMessage('Quantity must be at least 1.'),
    body('unit')
      .optional()
      .isIn(DONATION_UNITS)
      .withMessage('Please select a valid unit.'),
    body('pickupLocation')
      .trim()
      .notEmpty()
      .withMessage('Pickup location is required.'),
    body('preparedAt').notEmpty().withMessage('Preparation date/time is required.'),
    body('useBy').notEmpty().withMessage('Use-by deadline is required.'),
    body('pickupDeadline').notEmpty().withMessage('Pickup deadline is required.'),
  ],
  validate,
  createDonation
);

router.put(
  '/:id',
  protect,
  authorize('donor'),
  upload.single('image'),
  [
    body('foodName').optional().trim().isLength({ min: 2, max: 120 }),
    body('category').optional().isIn(DONATION_CATEGORIES),
    body('description').optional().trim().isLength({ min: 5, max: 1000 }),
    body('quantity').optional().isFloat({ min: 1 }),
    body('unit').optional().isIn(DONATION_UNITS),
  ],
  validate,
  updateDonation
);

router.patch('/:id/cancel', protect, authorize('donor'), cancelDonation);
router.delete('/:id', protect, authorize('donor'), deleteDonation);

module.exports = router;
