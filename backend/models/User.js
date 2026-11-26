const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const USER_ROLES = ['donor', 'ngo', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: 'Role must be donor, ngo, or admin',
      },
      default: 'donor',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: [25, 'Phone number cannot exceed 25 characters'],
    },
    organizationName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [120, 'Organization name cannot exceed 120 characters'],
    },
    address: {
      type: String,
      trim: true,
      default: '',
      maxlength: [250, 'Address cannot exceed 250 characters'],
    },
    profileImage: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

userSchema.index({ role: 1, isVerified: 1, isSuspended: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Compare a plaintext password candidate against the stored bcrypt hash.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
module.exports.USER_ROLES = USER_ROLES;
