const Donation = require('../models/Donation');
const Request = require('../models/Request');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const { uploadImageFile } = require('../services/uploadService');
const { expireOutdatedDonations } = require('../services/donationService');

/**
 * POST /api/donations
 */
const createDonation = asyncHandler(async (req, res) => {
  const {
    foodName,
    category,
    description,
    quantity,
    unit,
    pickupLocation,
    preparedAt,
    useBy,
    pickupDeadline,
    allergenInformation,
    storageInformation,
    image,
  } = req.body;

  const qty = Number(quantity);
  const prepDate = new Date(preparedAt);
  const useByDate = new Date(useBy);
  const pickupDate = new Date(pickupDeadline);

  if (Number.isNaN(prepDate.getTime()) || Number.isNaN(useByDate.getTime()) || Number.isNaN(pickupDate.getTime())) {
    throw new ApiError(400, 'Invalid date values for preparation, use-by, or pickup deadline.');
  }
  if (useByDate < prepDate) {
    throw new ApiError(400, 'Use-by deadline must be after the preparation date.');
  }
  if (pickupDate <= new Date()) {
    throw new ApiError(400, 'Pickup deadline must be in the future.');
  }
  if (pickupDate > useByDate) {
    throw new ApiError(400, 'Pickup deadline cannot be later than the use-by deadline.');
  }

  let imageUrl = image || '';
  if (req.file) {
    imageUrl = await uploadImageFile(req.file, 'foodrescue/donations');
  }

  const donation = await Donation.create({
    donorId: req.user._id,
    foodName,
    category,
    description,
    quantity: qty,
    availableQuantity: qty,
    unit,
    image: imageUrl,
    pickupLocation,
    preparedAt: prepDate,
    useBy: useByDate,
    pickupDeadline: pickupDate,
    allergenInformation: allergenInformation || 'None specified',
    storageInformation: storageInformation || 'Keep refrigerated / food-safe container',
    status: 'Available',
  });

  await donation.populate('donorId', 'name organizationName phone address isVerified');

  return sendResponse(res, 201, 'Food donation listing published.', { donation });
});

/**
 * GET /api/donations
 */
const getDonations = asyncHandler(async (req, res) => {
  await expireOutdatedDonations();

  const {
    q,
    category,
    location,
    minQuantity,
    deadlineBefore,
    status,
    page = 1,
    limit = 12,
    sort = 'newest',
  } = req.query;

  const filter = {};

  if (q && q.trim()) {
    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { foodName: regex },
      { description: regex },
      { pickupLocation: regex },
      { category: regex },
    ];
  }

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (location && location.trim()) {
    filter.pickupLocation = new RegExp(
      location.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );
  }

  if (minQuantity !== undefined && minQuantity !== '') {
    const minQ = Number(minQuantity);
    if (!Number.isNaN(minQ) && minQ > 0) {
      filter.availableQuantity = { $gte: minQ };
    }
  }

  if (deadlineBefore) {
    const deadlineDate = new Date(deadlineBefore);
    if (!Number.isNaN(deadlineDate.getTime())) {
      filter.pickupDeadline = { $lte: deadlineDate, $gt: new Date() };
    }
  }

  if (status && status !== 'All') {
    if (status === 'Open') {
      filter.status = { $in: ['Available', 'Requested'] };
      filter.availableQuantity = { ...(filter.availableQuantity || {}), $gt: 0 };
    } else {
      filter.status = status;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const sortMap = {
    newest: { createdAt: -1 },
    deadline: { pickupDeadline: 1 },
    quantity: { availableQuantity: -1 },
  };
  const sortOrder = sortMap[sort] || sortMap.newest;

  const [donations, total] = await Promise.all([
    Donation.find(filter)
      .populate('donorId', 'name organizationName phone address isVerified profileImage')
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum),
    Donation.countDocuments(filter),
  ]);

  return sendResponse(
    res,
    200,
    'Donations fetched successfully.',
    { donations },
    {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    }
  );
});

/**
 * GET /api/donations/my
 */
const getMyDonations = asyncHandler(async (req, res) => {
  await expireOutdatedDonations();

  const donations = await Donation.find({ donorId: req.user._id }).sort({ createdAt: -1 }).lean();
  const donationIds = donations.map((d) => d._id);

  const requestCounts = await Request.aggregate([
    { $match: { donationId: { $in: donationIds } } },
    {
      $group: {
        _id: { donationId: '$donationId', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  const countsMap = {};
  for (const row of requestCounts) {
    const dId = String(row._id.donationId);
    if (!countsMap[dId]) countsMap[dId] = { total: 0, pending: 0 };
    countsMap[dId].total += row.count;
    if (row._id.status === 'Requested') countsMap[dId].pending += row.count;
  }

  const enriched = donations.map((d) => ({
    ...d,
    requestSummary: countsMap[String(d._id)] || { total: 0, pending: 0 },
  }));

  return sendResponse(res, 200, 'Your donations fetched successfully.', {
    donations: enriched,
  });
});

/**
 * GET /api/donations/:id
 */
const getDonationById = asyncHandler(async (req, res) => {
  await expireOutdatedDonations();

  const donation = await Donation.findById(req.params.id).populate(
    'donorId',
    'name organizationName phone address isVerified profileImage'
  );

  if (!donation) {
    throw new ApiError(404, 'Donation listing not found.');
  }

  let myRequest = null;
  if (req.user && req.user.role === 'ngo') {
    myRequest = await Request.findOne({
      donationId: donation._id,
      ngoId: req.user._id,
    }).sort({ createdAt: -1 });
  }

  return sendResponse(res, 200, 'Donation details retrieved.', {
    donation,
    myRequest,
  });
});

/**
 * PUT /api/donations/:id
 */
const updateDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) {
    throw new ApiError(404, 'Donation listing not found.');
  }

  if (String(donation.donorId) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only update your own donation listings.');
  }

  if (['Completed', 'Cancelled', 'Expired'].includes(donation.status)) {
    throw new ApiError(400, `Cannot edit a donation that is ${donation.status}.`);
  }

  const reservedQty = donation.quantity - donation.availableQuantity;
  const updatableFields = [
    'foodName',
    'category',
    'description',
    'unit',
    'pickupLocation',
    'preparedAt',
    'useBy',
    'pickupDeadline',
    'allergenInformation',
    'storageInformation',
  ];

  for (const field of updatableFields) {
    if (req.body[field] !== undefined) {
      donation[field] = req.body[field];
    }
  }

  if (req.body.quantity !== undefined) {
    const newQty = Number(req.body.quantity);
    if (Number.isNaN(newQty) || newQty < 1) {
      throw new ApiError(400, 'Quantity must be at least 1.');
    }
    if (newQty < reservedQty) {
      throw new ApiError(
        400,
        `Quantity cannot be lower than the ${reservedQty} ${donation.unit} already approved for NGOs.`
      );
    }
    donation.quantity = newQty;
    donation.availableQuantity = newQty - reservedQty;
  }

  if (new Date(donation.useBy) < new Date(donation.preparedAt)) {
    throw new ApiError(400, 'Use-by deadline must be after preparation date.');
  }
  if (new Date(donation.pickupDeadline) > new Date(donation.useBy)) {
    throw new ApiError(400, 'Pickup deadline cannot exceed use-by deadline.');
  }

  if (req.file) {
    donation.image = await uploadImageFile(req.file, 'foodrescue/donations');
  } else if (req.body.image !== undefined) {
    donation.image = req.body.image;
  }

  await donation.save();
  await donation.populate('donorId', 'name organizationName phone address isVerified');

  return sendResponse(res, 200, 'Donation listing updated.', { donation });
});

/**
 * DELETE /api/donations/:id
 */
const deleteDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) {
    throw new ApiError(404, 'Donation listing not found.');
  }

  if (String(donation.donorId) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only delete your own donation listings.');
  }

  const activeAccepted = await Request.exists({
    donationId: donation._id,
    status: { $in: ['Approved', 'Picked Up', 'Completed'] },
  });

  if (activeAccepted) {
    throw new ApiError(
      400,
      'Cannot delete a donation with approved, picked up, or completed NGO requests.'
    );
  }

  await Request.updateMany(
    { donationId: donation._id, status: 'Requested' },
    { $set: { status: 'Cancelled' } }
  );
  await donation.deleteOne();

  return sendResponse(res, 200, 'Donation listing deleted successfully.');
});

/**
 * PATCH /api/donations/:id/cancel
 */
const cancelDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) {
    throw new ApiError(404, 'Donation listing not found.');
  }

  if (String(donation.donorId) !== String(req.user._id)) {
    throw new ApiError(403, 'Only the listing donor can cancel this donation.');
  }

  if (['Completed', 'Cancelled', 'Expired', 'Picked Up'].includes(donation.status)) {
    throw new ApiError(400, `Cannot cancel a donation in ${donation.status} status.`);
  }

  const hasCollected = await Request.exists({
    donationId: donation._id,
    status: { $in: ['Picked Up', 'Completed'] },
  });
  if (hasCollected) {
    throw new ApiError(400, 'Cannot cancel a donation that has already been collected.');
  }

  donation.status = 'Cancelled';
  await donation.save();
  await Request.updateMany(
    { donationId: donation._id, status: { $in: ['Requested', 'Approved'] } },
    { $set: { status: 'Cancelled' } }
  );

  return sendResponse(res, 200, 'Donation listing cancelled.', { donation });
});

module.exports = {
  createDonation,
  getDonations,
  getMyDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
  cancelDonation,
};
