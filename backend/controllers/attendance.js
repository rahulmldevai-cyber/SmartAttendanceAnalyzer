const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Mark attendance for a single student
// @route   POST /api/v1/attendance
// @access  Private (teacher, admin)
exports.markAttendance = asyncHandler(async (req, res, next) => {
  req.body.markedBy = req.user._id;

  const attendance = await Attendance.create(req.body);
  res.status(201).json({ success: true, data: attendance });
});

// @desc    Mark bulk attendance (entire class)
// @route   POST /api/v1/attendance/bulk
// @access  Private (teacher, admin)
exports.markBulkAttendance = asyncHandler(async (req, res, next) => {
  const { records } = req.body;

  if (!records || !Array.isArray(records) || records.length === 0) {
    return next(new ErrorResponse('Please provide an array of attendance records', 400));
  }

  if (records.length > 200) {
    return next(new ErrorResponse('Cannot process more than 200 records at once', 400));
  }

  const enrichedRecords = records.map((r) => ({ ...r, markedBy: req.user._id }));

  // Use insertMany with ordered:false to insert all and collect errors
  let inserted = 0;
  try {
    const results = await Attendance.insertMany(enrichedRecords, { ordered: false });
    inserted = results.length;
  } catch (err) {
    if (err.name === 'MongoBulkWriteError') {
      inserted = err.result?.nInserted ?? 0;
    } else {
      return next(err);
    }
  }

  res.status(201).json({
    success: true,
    message: `${inserted} records saved successfully`,
    data: { inserted },
  });
});

// @desc    Get attendance records
// @route   GET /api/v1/attendance
// @access  Private
exports.getAttendance = asyncHandler(async (req, res, next) => {
  const { student, subject, section, semester, startDate, endDate, status, page = 1, limit = 50 } = req.query;

  const query = {};
  if (student) query.student = student;
  if (subject) query.subject = subject;
  if (section) query.section = section;
  if (semester) query.semester = parseInt(semester);
  if (status) query.status = status;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  // Students can only see their own records
  if (req.user.role === 'student') {
    const studentDoc = await Student.findOne({ userId: req.user._id });
    if (!studentDoc) return next(new ErrorResponse('Student profile not found', 404));
    query.student = studentDoc._id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [records, total] = await Promise.all([
    Attendance.find(query)
      .populate('student', 'name rollNumber section')
      .populate('markedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Attendance.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: records.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
    data: records,
  });
});

// @desc    Update attendance record
// @route   PUT /api/v1/attendance/:id
// @access  Private (teacher, admin)
exports.updateAttendance = asyncHandler(async (req, res, next) => {
  let attendance = await Attendance.findById(req.params.id);
  if (!attendance) return next(new ErrorResponse('Attendance record not found', 404));

  // Teachers can only update their own records
  if (req.user.role === 'teacher' && attendance.markedBy.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized to update this record', 403));
  }

  attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, remarks: req.body.remarks },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: attendance });
});

// @desc    Delete attendance record
// @route   DELETE /api/v1/attendance/:id
// @access  Private (admin only)
exports.deleteAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) return next(new ErrorResponse('Record not found', 404));

  await attendance.deleteOne();
  res.status(200).json({ success: true, message: 'Record deleted' });
});

// @desc    Get students list for a class on a specific date
// @route   GET /api/v1/attendance/class
// @access  Private (teacher, admin)
exports.getClassAttendance = asyncHandler(async (req, res, next) => {
  const { section, semester, branch, date, subject } = req.query;

  if (!section || !date || !subject) {
    return next(new ErrorResponse('Please provide section, date, and subject', 400));
  }

  const targetDate = new Date(date);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const [students, existingRecords] = await Promise.all([
    Student.find((() => { const studentQuery = { section, isActive: true }; if (semester) studentQuery.semester = parseInt(semester, 10); return studentQuery; })())
      .sort({ rollNumber: 1 })
      .select('name rollNumber email'),
    Attendance.find({
      section,
      subject,
      date: { $gte: targetDate, $lt: nextDay },
    }).select('student status'),
  ]);

  const markedMap = {};
  existingRecords.forEach((r) => {
    markedMap[r.student.toString()] = r.status;
  });

  const classRoster = students.map((s) => ({
    ...s.toObject(),
    status: markedMap[s._id.toString()] || null,
    isMarked: !!markedMap[s._id.toString()],
  }));

  res.status(200).json({
    success: true,
    data: {
      students: classRoster,
      totalStudents: students.length,
      markedCount: existingRecords.length,
      isComplete: existingRecords.length === students.length,
    },
  });
});
