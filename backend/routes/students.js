const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents,
} = require('../controllers/students');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'teacher'), getStudents)
  .post(authorize('admin', 'teacher'), createStudent);

router.post('/bulk', authorize('admin'), bulkImportStudents);

router
  .route('/:id')
  .get(getStudent)
  .put(authorize('admin', 'teacher'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

module.exports = router;
