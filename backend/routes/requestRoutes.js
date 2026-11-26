const express = require('express');
const { body } = require('express-validator');
const {
  createRequest,
  getMyRequests,
  getIncomingRequestsForDonor,
  approveRequest,
  rejectRequest,
  pickupRequest,
  completeRequest,
  cancelRequest,
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  protect,
  authorize('ngo'),
  [
    body('donationId').isMongoId().withMessage('Valid donationId is required.'),
    body('requestedQuantity')
      .isInt({ min: 1 })
      .withMessage('Requested quantity must be a whole number of at least 1.'),
    body('message').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  createRequest
);

router.get('/my', protect, authorize('ngo'), getMyRequests);
router.get('/incoming', protect, authorize('donor'), getIncomingRequestsForDonor);

router.patch('/:id/approve', protect, authorize('donor'), approveRequest);
router.patch('/:id/reject', protect, authorize('donor'), rejectRequest);
router.patch('/:id/pickup', protect, authorize('donor', 'ngo'), pickupRequest);
router.patch('/:id/complete', protect, authorize('donor', 'ngo'), completeRequest);
router.patch('/:id/cancel', protect, authorize('ngo'), cancelRequest);

module.exports = router;
