const Donation = require('../models/Donation');
const Request = require('../models/Request');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const {
  createRequestForDonation,
  approveDonationRequest,
  rejectDonationRequest,
  pickupDonationRequest,
  completeDonationRequest,
  cancelDonationRequest,
} = require('../services/requestService');

/**
 * POST /api/requests
 */
const createRequest = asyncHandler(async (req, res) => {
  const { donationId, requestedQuantity, message } = req.body;
  const request = await createRequestForDonation({
    ngoId: req.user._id,
    donationId,
    requestedQuantity,
    message,
  });

  await request.populate([
    { path: 'donationId', select: 'foodName category unit pickupLocation pickupDeadline status availableQuantity' },
    { path: 'ngoId', select: 'name organizationName email phone address isVerified' },
  ]);

  return sendResponse(res, 201, 'Donation request submitted successfully.', { request });
});

/**
 * GET /api/requests/my
 */
const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await Request.find({ ngoId: req.user._id })
    .populate({
      path: 'donationId',
      populate: {
        path: 'donorId',
        select: 'name organizationName phone address isVerified',
      },
    })
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, 'Your donation requests retrieved.', { requests });
});

/**
 * GET /api/requests/incoming
 */
const getIncomingRequestsForDonor = asyncHandler(async (req, res) => {
  const donorDonations = await Donation.find({ donorId: req.user._id }).select('_id');
  const donationIds = donorDonations.map((d) => d._id);

  const requests = await Request.find({ donationId: { $in: donationIds } })
    .populate('donationId', 'foodName category unit quantity availableQuantity pickupDeadline pickupLocation status image')
    .populate('ngoId', 'name organizationName email phone address isVerified')
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, 'Incoming requests retrieved.', { requests });
});

/**
 * GET /api/donations/:id/requests
 */
const getRequestsForDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) {
    throw new ApiError(404, 'Donation listing not found.');
  }

  const isOwner = String(donation.donorId) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'You are not authorized to view requests for this donation.');
  }

  const requests = await Request.find({ donationId: donation._id })
    .populate('ngoId', 'name organizationName email phone address isVerified')
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, 'Requests for donation retrieved.', { requests });
});

/**
 * PATCH /api/requests/:id/approve
 */
const approveRequest = asyncHandler(async (req, res) => {
  const result = await approveDonationRequest({
    requestId: req.params.id,
    donorId: req.user._id,
  });
  return sendResponse(res, 200, 'Request approved and quantity reserved.', result);
});

/**
 * PATCH /api/requests/:id/reject
 */
const rejectRequest = asyncHandler(async (req, res) => {
  const result = await rejectDonationRequest({
    requestId: req.params.id,
    donorId: req.user._id,
  });
  return sendResponse(res, 200, 'Request rejected.', result);
});

/**
 * PATCH /api/requests/:id/pickup
 */
const pickupRequest = asyncHandler(async (req, res) => {
  const result = await pickupDonationRequest({
    requestId: req.params.id,
    user: req.user,
  });
  return sendResponse(res, 200, 'Donation marked as picked up.', result);
});

/**
 * PATCH /api/requests/:id/complete
 */
const completeRequest = asyncHandler(async (req, res) => {
  const result = await completeDonationRequest({
    requestId: req.params.id,
    user: req.user,
  });
  return sendResponse(res, 200, 'Donation marked as completed.', result);
});

/**
 * PATCH /api/requests/:id/cancel
 */
const cancelRequest = asyncHandler(async (req, res) => {
  const result = await cancelDonationRequest({
    requestId: req.params.id,
    ngoId: req.user._id,
  });
  return sendResponse(res, 200, 'Request cancelled.', result);
});

module.exports = {
  createRequest,
  getMyRequests,
  getIncomingRequestsForDonor,
  getRequestsForDonation,
  approveRequest,
  rejectRequest,
  pickupRequest,
  completeRequest,
  cancelRequest,
};
