const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const Request = require('../models/Request');
const ApiError = require('../utils/ApiError');
const { syncDonationStatus } = require('./donationService');

/**
 * Execute a callback inside a MongoDB transaction when replica sets are enabled,
 * falling back cleanly on standalone MongoDB instances that do not support sessions.
 */
const runWithTransactionIfSupported = async (work) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    const isStandaloneTxError =
      err?.code === 20 ||
      err?.codeName === 'IllegalOperation' ||
      /Transaction numbers are only allowed on a replica set/i.test(err?.message || '');
    if (isStandaloneTxError) {
      return work(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
};

/**
 * Create a donation request after validating availability and preventing duplicate active claims.
 */
const createRequestForDonation = async ({ ngoId, donationId, requestedQuantity, message }) => {
  const qty = Number(requestedQuantity);
  if (!Number.isInteger(qty) || qty < 1) {
    throw new ApiError(400, 'Requested quantity must be a whole number of at least 1.');
  }

  const donation = await Donation.findById(donationId);
  if (!donation) {
    throw new ApiError(404, 'Donation listing not found.');
  }

  if (String(donation.donorId) === String(ngoId)) {
    throw new ApiError(400, 'You cannot request your own donation listing.');
  }

  if (['Cancelled', 'Expired', 'Completed'].includes(donation.status)) {
    throw new ApiError(400, `This donation is ${donation.status.toLowerCase()} and cannot be requested.`);
  }

  if (new Date(donation.pickupDeadline) <= new Date()) {
    donation.status = 'Expired';
    await donation.save();
    throw new ApiError(400, 'This donation has passed its pickup deadline and has expired.');
  }

  if (donation.availableQuantity < qty) {
    throw new ApiError(
      400,
      `Only ${donation.availableQuantity} ${donation.unit} remaining for this donation.`
    );
  }

  const existingActive = await Request.findOne({
    donationId,
    ngoId,
    status: { $in: ['Requested', 'Approved', 'Picked Up'] },
  });
  if (existingActive) {
    throw new ApiError(
      409,
      `You already have an active (${existingActive.status}) request for this donation.`
    );
  }

  const createdRequest = await Request.create({
    donationId,
    ngoId,
    requestedQuantity: qty,
    message: message || '',
    status: 'Requested',
  });

  await syncDonationStatus(donationId);
  return createdRequest;
};

/**
 * Approve an NGO request atomically, reserving the requested quantity so concurrent approvals cannot oversubscribe.
 */
const approveDonationRequest = async ({ requestId, donorId }) =>
  runWithTransactionIfSupported(async (session) => {
    const opts = session ? { session } : {};
    const request = await Request.findById(requestId, null, opts);
    if (!request) {
      throw new ApiError(404, 'Donation request not found.');
    }

    const donation = await Donation.findById(request.donationId, null, opts);
    if (!donation) {
      throw new ApiError(404, 'Associated donation not found.');
    }

    if (String(donation.donorId) !== String(donorId)) {
      throw new ApiError(403, 'Only the donor who created this listing can approve requests.');
    }

    if (request.status !== 'Requested') {
      throw new ApiError(400, `Cannot approve a request that is currently ${request.status}.`);
    }

    if (new Date(donation.pickupDeadline) <= new Date()) {
      throw new ApiError(400, 'Cannot approve request after the pickup deadline has passed.');
    }

    const updatedDonation = await Donation.findOneAndUpdate(
      {
        _id: donation._id,
        availableQuantity: { $gte: request.requestedQuantity },
        status: { $nin: ['Cancelled', 'Expired', 'Completed'] },
      },
      {
        $inc: { availableQuantity: -request.requestedQuantity },
      },
      { new: true, ...opts }
    );

    if (!updatedDonation) {
      throw new ApiError(
        409,
        'Insufficient remaining quantity to approve this request. Another NGO may have claimed it.'
      );
    }

    request.status = 'Approved';
    await request.save(opts);

    if (updatedDonation.availableQuantity === 0) {
      await Request.updateMany(
        {
          donationId: donation._id,
          _id: { $ne: request._id },
          status: 'Requested',
        },
        { $set: { status: 'Rejected' } },
        opts
      );
    }

    const syncedDonation = await syncDonationStatus(donation._id, session);
    return { request, donation: syncedDonation };
  });

/**
 * Reject a pending request.
 */
const rejectDonationRequest = async ({ requestId, donorId }) => {
  const request = await Request.findById(requestId);
  if (!request) {
    throw new ApiError(404, 'Donation request not found.');
  }

  const donation = await Donation.findById(request.donationId);
  if (!donation) {
    throw new ApiError(404, 'Associated donation not found.');
  }

  if (String(donation.donorId) !== String(donorId)) {
    throw new ApiError(403, 'Only the listing donor can reject this request.');
  }

  if (request.status !== 'Requested') {
    throw new ApiError(400, `Only pending requests can be rejected (current status: ${request.status}).`);
  }

  request.status = 'Rejected';
  await request.save();
  const syncedDonation = await syncDonationStatus(donation._id);
  return { request, donation: syncedDonation };
};

/**
 * Mark an approved request as Picked Up (collected by NGO).
 */
const pickupDonationRequest = async ({ requestId, user }) => {
  const request = await Request.findById(requestId);
  if (!request) {
    throw new ApiError(404, 'Donation request not found.');
  }

  const donation = await Donation.findById(request.donationId);
  if (!donation) {
    throw new ApiError(404, 'Associated donation not found.');
  }

  const isDonor = String(donation.donorId) === String(user._id);
  const isRequestingNgo = String(request.ngoId) === String(user._id);
  if (!isDonor && !isRequestingNgo) {
    throw new ApiError(403, 'You are not authorized to confirm pickup for this request.');
  }

  if (request.status !== 'Approved') {
    throw new ApiError(
      400,
      `Donation must be Approved before marking as Picked Up (current status: ${request.status}).`
    );
  }

  request.status = 'Picked Up';
  request.pickedUpAt = new Date();
  await request.save();
  const syncedDonation = await syncDonationStatus(donation._id);
  return { request, donation: syncedDonation };
};

/**
 * Mark a picked-up request as Completed. Rejects completion if not yet approved and picked up.
 */
const completeDonationRequest = async ({ requestId, user }) => {
  const request = await Request.findById(requestId);
  if (!request) {
    throw new ApiError(404, 'Donation request not found.');
  }

  const donation = await Donation.findById(request.donationId);
  if (!donation) {
    throw new ApiError(404, 'Associated donation not found.');
  }

  const isDonor = String(donation.donorId) === String(user._id);
  const isRequestingNgo = String(request.ngoId) === String(user._id);
  if (!isDonor && !isRequestingNgo) {
    throw new ApiError(403, 'You are not authorized to complete this request.');
  }

  if (request.status !== 'Picked Up') {
    throw new ApiError(
      400,
      `A donation cannot be marked Completed before it is Approved and Picked Up (current status: ${request.status}).`
    );
  }

  request.status = 'Completed';
  request.completedAt = new Date();
  await request.save();
  const syncedDonation = await syncDonationStatus(donation._id);
  return { request, donation: syncedDonation };
};

/**
 * Cancel a request by the NGO that created it; restores quantity if it had been approved.
 */
const cancelDonationRequest = async ({ requestId, ngoId }) =>
  runWithTransactionIfSupported(async (session) => {
    const opts = session ? { session } : {};
    const request = await Request.findById(requestId, null, opts);
    if (!request) {
      throw new ApiError(404, 'Donation request not found.');
    }

    if (String(request.ngoId) !== String(ngoId)) {
      throw new ApiError(403, 'Only the NGO that submitted this request can cancel it.');
    }

    if (!['Requested', 'Approved'].includes(request.status)) {
      throw new ApiError(400, `Cannot cancel a request with status ${request.status}.`);
    }

    const wasApproved = request.status === 'Approved';
    request.status = 'Cancelled';
    await request.save(opts);

    if (wasApproved) {
      await Donation.findByIdAndUpdate(
        request.donationId,
        { $inc: { availableQuantity: request.requestedQuantity } },
        opts
      );
    }

    const syncedDonation = await syncDonationStatus(request.donationId, session);
    return { request, donation: syncedDonation };
  });

module.exports = {
  createRequestForDonation,
  approveDonationRequest,
  rejectDonationRequest,
  pickupDonationRequest,
  completeDonationRequest,
  cancelDonationRequest,
};
