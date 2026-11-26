const mongoose = require('mongoose');

const DONATION_CATEGORIES = [
  'Cooked Meals',
  'Bakery & Bread',
  'Fruits & Vegetables',
  'Dairy & Beverages',
  'Packaged Food',
  'Dry Grains & Staples',
  'Other',
];

const DONATION_UNITS = ['servings', 'kg', 'boxes', 'packs', 'liters', 'trays'];

const DONATION_STATUSES = [
  'Available',
  'Requested',
  'Approved',
  'Rejected',
  'Picked Up',
  'Completed',
  'Cancelled',
  'Expired',
];

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor reference is required'],
      index: true,
    },
    foodName: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      minlength: [2, 'Food name must be at least 2 characters'],
      maxlength: [120, 'Food name cannot exceed 120 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: DONATION_CATEGORIES,
        message: 'Invalid food category',
      },
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative'],
      validate: {
        validator(val) {
          return val <= this.quantity;
        },
        message: 'Available quantity cannot exceed total quantity',
      },
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: {
        values: DONATION_UNITS,
        message: 'Invalid quantity unit',
      },
      default: 'servings',
    },
    image: {
      type: String,
      default: '',
    },
    pickupLocation: {
      type: String,
      required: [true, 'Pickup location is required'],
      trim: true,
      maxlength: [250, 'Pickup location cannot exceed 250 characters'],
      index: true,
    },
    preparedAt: {
      type: Date,
      required: [true, 'Preparation date/time is required'],
    },
    useBy: {
      type: Date,
      required: [true, 'Use-by deadline is required'],
    },
    pickupDeadline: {
      type: Date,
      required: [true, 'Pickup deadline is required'],
      index: true,
    },
    allergenInformation: {
      type: String,
      trim: true,
      default: 'None specified',
      maxlength: [300, 'Allergen information cannot exceed 300 characters'],
    },
    storageInformation: {
      type: String,
      trim: true,
      default: 'Keep refrigerated / food-safe container',
      maxlength: [300, 'Storage information cannot exceed 300 characters'],
    },
    status: {
      type: String,
      enum: {
        values: DONATION_STATUSES,
        message: 'Invalid donation status',
      },
      default: 'Available',
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

donationSchema.index({ status: 1, pickupDeadline: 1, category: 1 });
donationSchema.index({ foodName: 'text', description: 'text', pickupLocation: 'text' });

module.exports = mongoose.model('Donation', donationSchema);
module.exports.DONATION_CATEGORIES = DONATION_CATEGORIES;
module.exports.DONATION_UNITS = DONATION_UNITS;
module.exports.DONATION_STATUSES = DONATION_STATUSES;
