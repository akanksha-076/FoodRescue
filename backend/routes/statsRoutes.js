const express = require('express');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Request = require('../models/Request');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const { expireOutdatedDonations } = require('../services/donationService');

const router = express.Router();

/**
 * GET /api/stats/public
 * Live aggregate impact metrics for the landing page.
 */
router.get(
  '/public',
  asyncHandler(async (req, res) => {
    await expireOutdatedDonations();

    const [totalDonors, totalNgos, activeDonations, completedDonations, rescuedAgg] =
      await Promise.all([
        User.countDocuments({ role: 'donor', isSuspended: false }),
        User.countDocuments({ role: 'ngo', isSuspended: false }),
        Donation.countDocuments({ status: { $in: ['Available', 'Requested'] } }),
        Donation.countDocuments({ status: 'Completed' }),
        Request.aggregate([
          { $match: { status: 'Completed' } },
          { $group: { _id: null, totalUnits: { $sum: '$requestedQuantity' } } },
        ]),
      ]);

    return sendResponse(res, 200, 'Public impact statistics retrieved.', {
      stats: {
        totalDonors,
        totalNgos,
        activeDonations,
        completedDonations,
        mealsRescued: rescuedAgg[0]?.totalUnits || 0,
      },
    });
  })
);

module.exports = router;
