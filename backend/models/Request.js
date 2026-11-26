const mongoose = require('mongoose');

const REQUEST_STATUSES = [
  'Requested',
  'Approved',
  'Rejected',
  'Picked Up',
  'Completed',
  'Cancelled',
  'Expired',
];

const requestSchema = new mongoose.Schema(
  {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: [true, 'Donation reference is required'],
      index: true,
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'NGO reference is required'],
      index: true,
    },
    requestedQuantity: {
      type: Number,
      required: [true, 'Requested quantity is required'],
      min: [1, 'Requested quantity must be at least 1'],
    },
    message: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: {
        values: REQUEST_STATUSES,
        message: 'Invalid request status',
      },
      default: 'Requested',
      index: true,
    },
    pickedUpAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

requestSchema.index({ donationId: 1, ngoId: 1, status: 1 });

module.exports = mongoose.model('Request', requestSchema);
module.exports.REQUEST_STATUSES = REQUEST_STATUSES;
