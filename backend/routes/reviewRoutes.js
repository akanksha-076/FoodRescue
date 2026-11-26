const express = require('express');
const { body } = require('express-validator');
const {
  createReview,
  getUserReviews,
  getPublicTestimonials,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/public', getPublicTestimonials);
router.get('/user/:userId', getUserReviews);

router.post(
  '/',
  protect,
  authorize('donor', 'ngo'),
  [
    body('donationId').isMongoId().withMessage('Valid donationId is required.'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5.'),
    body('comment').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  createReview
);

module.exports = router;
