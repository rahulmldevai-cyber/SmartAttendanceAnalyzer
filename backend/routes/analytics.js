const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getStudentAttendance,
  getTrends,
  getStudentDetails,
  getMyProfile,
  getPrediction,
} = require('../controllers/analytics');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/students', authorize('admin', 'teacher'), getStudentAttendance);
router.get('/trends', getTrends);
router.get('/me', getMyProfile);
router.get('/predict', getPrediction);
router.get('/students/:id', getStudentDetails);

module.exports = router;
