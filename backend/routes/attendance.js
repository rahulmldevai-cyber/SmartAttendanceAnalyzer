const express = require('express');
const router = express.Router();
const {
  markAttendance,
  markBulkAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
  getClassAttendance,
} = require('../controllers/attendance');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getAttendance)
  .post(authorize('admin', 'teacher'), markAttendance);

router.post('/bulk', authorize('admin', 'teacher'), markBulkAttendance);
router.get('/class', authorize('admin', 'teacher'), getClassAttendance);

router
  .route('/:id')
  .put(authorize('admin', 'teacher'), updateAttendance)
  .delete(authorize('admin'), deleteAttendance);

module.exports = router;
