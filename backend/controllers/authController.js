const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const { uploadImageFile } = require('../services/uploadService');

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  organizationName: user.organizationName,
  address: user.address,
  profileImage: user.profileImage,
  isVerified: user.isVerified,
  isSuspended: user.isSuspended,
  createdAt: user.createdAt,
});

/**
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, organizationName, address, adminSecret } = req.body;

  const selectedRole = role || 'donor';
  if (selectedRole === 'admin') {
    const expectedKey = process.env.ADMIN_REGISTRATION_KEY;
    if (!expectedKey || adminSecret !== expectedKey) {
      throw new ApiError(403, 'Valid admin registration key is required to create an admin account.');
    }
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: selectedRole,
    phone: phone || '',
    organizationName: organizationName || '',
    address: address || '',
    isVerified: selectedRole === 'admin',
  });

  const token = generateToken(user);
  return sendResponse(res, 201, 'Registration successful.', {
    token,
    user: sanitizeUser(user),
  });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (user.isSuspended) {
    throw new ApiError(403, 'Your account has been suspended by an administrator.');
  }

  const token = generateToken(user);
  return sendResponse(res, 200, 'Login successful.', {
    token,
    user: sanitizeUser(user),
  });
});

/**
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  return sendResponse(res, 200, 'Authenticated profile retrieved.', {
    user: sanitizeUser(req.user),
  });
});

/**
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, organizationName, address, profileImage } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (organizationName !== undefined) user.organizationName = organizationName;
  if (address !== undefined) user.address = address;

  if (req.file) {
    user.profileImage = await uploadImageFile(req.file, 'foodrescue/profiles');
  } else if (profileImage !== undefined) {
    user.profileImage = profileImage;
  }

  await user.save();
  return sendResponse(res, 200, 'Profile updated successfully.', {
    user: sanitizeUser(user),
  });
});

module.exports = { register, login, getMe, updateProfile };
