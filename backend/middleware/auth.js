const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

/**
 * Verify JWT access token and attach authenticated user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired authentication token.');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Account associated with this token no longer exists.');
  }

  if (user.isSuspended) {
    throw new ApiError(403, 'Your account has been suspended. Please contact support.');
  }

  req.user = user;
  next();
});

/**
 * Attach req.user if a valid Bearer token is provided; continue silently otherwise.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && !user.isSuspended) {
      req.user = user;
    }
  } catch {
    // Ignore invalid optional tokens on public endpoints
  }
  next();
});

/**
 * Restrict route access to specific user roles.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(
      new ApiError(403, `Access denied. Required role: ${roles.join(' or ')}.`)
    );
  }
  return next();
};

module.exports = { protect, optionalAuth, authorize };
