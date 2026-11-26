const express = require('express');
const {
  getAllUsers,
  toggleVerifyUser,
  toggleSuspendUser,
  getAllDonationsAdmin,
  deleteDonationAdmin,
  getAllRequestsAdmin,
  getAdminStats,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/verify', toggleVerifyUser);
router.patch('/users/:id/suspend', toggleSuspendUser);

router.get('/donations', getAllDonationsAdmin);
router.delete('/donations/:id', deleteDonationAdmin);

router.get('/requests', getAllRequestsAdmin);
router.get('/stats', getAdminStats);

module.exports = router;
