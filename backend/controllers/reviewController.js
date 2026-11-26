const Donation = require('../models/Donation');
const Request = require('../models/Request');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');

/**
 * POST /api/reviews
 */
const createReview = asyncHandler(async (req, res) => {
  const { donationId, rating, comment } = req.body;
  const donation = await Donation.findById(donationId);
  if (!donation) {
    throw new ApiError(404, 'Donation not found.');
  }

  const completedRequests = await Request.find({
    donationId: donation._id,
    status: 'Completed',
  });

  if (completedRequests.length === 0) {
    throw new ApiError(400, 'Reviews can only be submitted for completed donations.');
  }

  let revieweeId;
  if (String(donation.donorId) === String(req.user._id)) {
    const targetRequest = req.body.revieweeId
      ? completedRequests.find((r) => String(r.ngoId) === String(req.body.revieweeId))
      : completedRequests[0];
    if (!targetRequest) {
      throw new ApiError(400, 'No completed NGO request found to review.');
    }
    revieweeId = targetRequest.ngoId;
  } else {
    const myCompletedReq = completedRequests.find(
      (r) => String(r.ngoId) === String(req.user._id)
    );
    if (!myCompletedReq) {
      throw new ApiError(403, 'Only participants of a completed donation can submit a review.');
    }
    revieweeId = donation.donorId;
  }

  const existing = await Review.findOne({ donationId, reviewerId: req.user._id });
  if (existing) {
    throw new ApiError(409, 'You have already reviewed this donation.');
  }

  const review = await Review.create({
    donationId,
    reviewerId: req.user._id,
    revieweeId,
    rating: Number(rating),
    comment: comment || '',
  });

  await review.populate([
    { path: 'reviewerId', select: 'name organizationName role' },
    { path: 'revieweeId', select: 'name organizationName role' },
  ]);

  return sendResponse(res, 201, 'Review submitted successfully.', { review });
});

/**
 * GET /api/reviews/user/:userId
 */
const getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ revieweeId: req.params.userId })
    .populate('reviewerId', 'name organizationName role')
    .populate('donationId', 'foodName category')
    .sort({ createdAt: -1 });

  const avgRating =
    reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

  return sendResponse(res, 200, 'User reviews retrieved.', {
    reviews,
    averageRating: avgRating,
    totalReviews: reviews.length,
  });
});

/**
 * GET /api/reviews/public
 */
const getPublicTestimonials = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ rating: { $gte: 4 } })
    .populate('reviewerId', 'name organizationName role')
    .populate('donationId', 'foodName')
    .sort({ createdAt: -1 })
    .limit(6);

  return sendResponse(res, 200, 'Testimonials retrieved.', { reviews });
});

module.exports = { createReview, getUserReviews, getPublicTestimonials };
