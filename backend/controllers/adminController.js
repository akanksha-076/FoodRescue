const User = require('../models/User');
const Donation = require('../models/Donation');
const Request = require('../models/Request');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const { expireOutdatedDonations } = require('../services/donationService');

/**
 * GET /api/admin/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, verified, suspended, q } = req.query;
  const filter = {};

  if (role && role !== 'all') filter.role = role;
  if (verified === 'true') filter.isVerified = true;
  if (verified === 'false') filter.isVerified = false;
  if (suspended === 'true') filter.isSuspended = true;
  if (suspended === 'false') filter.isSuspended = false;

  if (q && q.trim()) {
    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { organizationName: regex }];
  }

  const users = await User.find(filter).sort({ createdAt: -1 });
  return sendResponse(res, 200, 'Users retrieved successfully.', { users });
});

/**
 * PATCH /api/admin/users/:id/verify
 */
const toggleVerifyUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const nextVerified =
    typeof req.body.isVerified === 'boolean' ? req.body.isVerified : !user.isVerified;
  user.isVerified = nextVerified;
  await user.save();

  return sendResponse(
    res,
    200,
    `User ${user.isVerified ? 'verified' : 'unverified'} successfully.`,
    { user }
  );
});

/**
 * PATCH /api/admin/users/:id/suspend
 */
const toggleSuspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (String(user._id) === String(req.user._id)) {
    throw new ApiError(400, 'Administrators cannot suspend their own account.');
  }

  const nextSuspended =
    typeof req.body.isSuspended === 'boolean' ? req.body.isSuspended : !user.isSuspended;
  user.isSuspended = nextSuspended;
  await user.save();

  return sendResponse(
    res,
    200,
    `User ${user.isSuspended ? 'suspended' : 'reactivated'} successfully.`,
    { user }
  );
});

/**
 * GET /api/admin/donations
 */
const getAllDonationsAdmin = asyncHandler(async (req, res) => {
  await expireOutdatedDonations();

  const { status, category, q } = req.query;
  const filter = {};
  if (status && status !== 'All') filter.status = status;
  if (category && category !== 'All') filter.category = category;
  if (q && q.trim()) {
    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ foodName: regex }, { pickupLocation: regex }, { description: regex }];
  }

  const donations = await Donation.find(filter)
    .populate('donorId', 'name email organizationName isVerified isSuspended')
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, 'All platform donations retrieved.', { donations });
});

/**
 * DELETE /api/admin/donations/:id
 */
const deleteDonationAdmin = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) {
    throw new ApiError(404, 'Donation listing not found.');
  }

  await Request.deleteMany({ donationId: donation._id });
  await Review.deleteMany({ donationId: donation._id });
  await donation.deleteOne();

  return sendResponse(res, 200, 'Donation listing removed by administrator.');
});

/**
 * GET /api/admin/requests
 */
const getAllRequestsAdmin = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status && status !== 'All' ? { status } : {};

  const requests = await Request.find(filter)
    .populate({
      path: 'donationId',
      select: 'foodName category unit pickupLocation status donorId',
      populate: { path: 'donorId', select: 'name organizationName email' },
    })
    .populate('ngoId', 'name organizationName email isVerified')
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, 'All platform requests retrieved.', { requests });
});

/**
 * GET /api/admin/stats
 */
const getAdminStats = asyncHandler(async (req, res) => {
  await expireOutdatedDonations();

  const [
    totalUsers,
    totalDonors,
    totalNgos,
    pendingVerifications,
    suspendedUsers,
    totalDonations,
    completedDonations,
    activeDonations,
    totalRequests,
    donationsByStatus,
    donationsByCategory,
    rescuedAgg,
    recentDonations,
    recentRequests,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'donor' }),
    User.countDocuments({ role: 'ngo' }),
    User.countDocuments({ role: { $in: ['donor', 'ngo'] }, isVerified: false }),
    User.countDocuments({ isSuspended: true }),
    Donation.countDocuments(),
    Donation.countDocuments({ status: 'Completed' }),
    Donation.countDocuments({ status: { $in: ['Available', 'Requested'] } }),
    Request.countDocuments(),
    Donation.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Donation.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    Request.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, totalQuantity: { $sum: '$requestedQuantity' } } },
    ]),
    Donation.find()
      .populate('donorId', 'name organizationName')
      .sort({ createdAt: -1 })
      .limit(5),
    Request.find()
      .populate('donationId', 'foodName unit')
      .populate('ngoId', 'name organizationName')
      .sort({ updatedAt: -1 })
      .limit(5),
  ]);

  return sendResponse(res, 200, 'Platform statistics retrieved.', {
    stats: {
      totalUsers,
      totalDonors,
      totalNgos,
      pendingVerifications,
      suspendedUsers,
      totalDonations,
      completedDonations,
      activeDonations,
      totalRequests,
      totalRescuedUnits: rescuedAgg[0]?.totalQuantity || 0,
      donationsByStatus,
      donationsByCategory,
      recentDonations,
      recentRequests,
    },
  });
});

module.exports = {
  getAllUsers,
  toggleVerifyUser,
  toggleSuspendUser,
  getAllDonationsAdmin,
  deleteDonationAdmin,
  getAllRequestsAdmin,
  getAdminStats,
};
