const Donation = require('../models/Donation');
const Request = require('../models/Request');

/**
 * Mark donations whose pickup deadline has passed as Expired, along with pending requests.
 */
const expireOutdatedDonations = async () => {
  const now = new Date();
  const outdated = await Donation.find({
    pickupDeadline: { $lt: now },
    status: { $in: ['Available', 'Requested'] },
  }).select('_id');

  if (outdated.length === 0) return 0;

  const ids = outdated.map((d) => d._id);
  await Promise.all([
    Donation.updateMany(
      { _id: { $in: ids }, status: { $in: ['Available', 'Requested'] } },
      { $set: { status: 'Expired' } }
    ),
    Request.updateMany(
      { donationId: { $in: ids }, status: 'Requested' },
      { $set: { status: 'Expired' } }
    ),
  ]);
  return ids.length;
};

/**
 * Derive and persist the aggregate donation status from remaining quantity and request states.
 */
const syncDonationStatus = async (donationId, session = null) => {
  const queryOpts = session ? { session } : {};
  const donation = await Donation.findById(donationId, null, queryOpts);
  if (!donation) return null;

  if (['Cancelled', 'Expired'].includes(donation.status)) {
    return donation;
  }

  const requests = await Request.find({ donationId }, null, queryOpts);
  const hasStatus = (s) => requests.some((r) => r.status === s);

  if (new Date(donation.pickupDeadline) < new Date() && !hasStatus('Approved') && !hasStatus('Picked Up') && !hasStatus('Completed')) {
    donation.status = 'Expired';
    await donation.save(queryOpts);
    return donation;
  }

  let nextStatus = 'Available';
  if (donation.availableQuantity === 0) {
    if (hasStatus('Approved')) {
      nextStatus = 'Approved';
    } else if (hasStatus('Picked Up')) {
      nextStatus = 'Picked Up';
    } else if (hasStatus('Completed')) {
      nextStatus = 'Completed';
    } else if (hasStatus('Requested')) {
      nextStatus = 'Requested';
    }
  } else if (hasStatus('Requested')) {
    nextStatus = 'Requested';
  } else {
    nextStatus = 'Available';
  }

  if (donation.status !== nextStatus) {
    donation.status = nextStatus;
    await donation.save(queryOpts);
  }
  return donation;
};

module.exports = { expireOutdatedDonations, syncDonationStatus };
