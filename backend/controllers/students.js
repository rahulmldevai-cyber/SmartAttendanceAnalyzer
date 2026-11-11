const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get all students
// @route   GET /api/v1/students
// @access  Private (admin, teacher)
exports.getStudents = asyncHandler(async (req, res, next) => {
  const { section, semester, branch, search, isActive, page = 1, limit = 50 } = req.query;

  const query = {};
  if (section) query.section = section;
  if (semester) query.semester = parseInt(semester);
  if (branch) query.branch = branch;
  // Only filter by isActive if explicitly passed; default shows all active students
  if (isActive !== undefined) query.isActive = isActive === 'true';
  else query.isActive = true;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [students, total] = await Promise.all([
    Student.find(query)
      .sort({ rollNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Student.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: students.length,
    total,
    pagination: { page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    data: students,
  });
});

// @desc    Get single student
// @route   GET /api/v1/students/:id
// @access  Private
exports.getStudent = asyncHandler(async (req, res, next) => {
  const student = await Student.findById(req.params.id);
  if (!student) return next(new ErrorResponse('Student not found', 404));

  // Students can only access their own profile
  if (req.user.role === 'student' && student.userId?.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  res.status(200).json({ success: true, data: student });
});

// @desc    Create student + auto-create their login account
// @route   POST /api/v1/students
// @access  Private (admin, teacher)
exports.createStudent = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  req.body.isActive = true;

  // Create the student profile
  const student = await Student.create(req.body);

  // Auto-create a User login account for the student
  // OR link to an existing account if the email is already registered
  try {
    const user = await User.create({
      name: student.name,
      email: student.email,
      password: student.rollNumber, // default password = roll number
      role: 'student',
      department: student.branch || 'General',
      isEmailVerified: true,
      isActive: true,
    });
    student.userId = user._id;
    await student.save();
  } catch (err) {
    if (err.code === 11000) {
      // Email already registered — find that user and link them
      const existingUser = await User.findOne({ email: student.email });
      if (existingUser) {
        student.userId = existingUser._id;
        await student.save();
      }
    } else {
      console.error('Could not create user account for student:', err.message);
    }
  }

  res.status(201).json({ success: true, data: student });
});

// @desc    Bulk import students + auto-create login accounts
// @route   POST /api/v1/students/bulk
// @access  Private (admin)
exports.bulkImportStudents = asyncHandler(async (req, res, next) => {
  const { students } = req.body;

  if (!students || !Array.isArray(students)) {
    return next(new ErrorResponse('Provide an array of students', 400));
  }

  const enriched = students.map((s) => ({ ...s, createdBy: req.user._id }));
  let insertedStudents = [];
  try {
    insertedStudents = await Student.insertMany(enriched, { ordered: false });
  } catch (err) {
    if (err.name === 'MongoBulkWriteError') {
      insertedStudents = err.result?.insertedIds
        ? Object.values(err.result.insertedIds).map((id) => ({ _id: id }))
        : [];
    } else {
      return next(err);
    }
  }

  // Auto-create User accounts for each inserted student
  for (const student of insertedStudents) {
    try {
      const fullStudent = await Student.findById(student._id);
      if (!fullStudent) continue;
      const user = await User.create({
        name: fullStudent.name,
        email: fullStudent.email,
        password: fullStudent.rollNumber,
        role: 'student',
        department: fullStudent.branch || 'General',
        isEmailVerified: true,
        isActive: true,
      });
      fullStudent.userId = user._id;
      await fullStudent.save();
    } catch (_) {
      // skip if user already exists
    }
  }

  res.status(201).json({
    success: true,
    message: `${insertedStudents.length} students imported`,
    data: { inserted: insertedStudents.length },
  });
});

// @desc    Update student
// @route   PUT /api/v1/students/:id
// @access  Private (admin, teacher)
exports.updateStudent = asyncHandler(async (req, res, next) => {
  delete req.body.createdBy;

  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!student) return next(new ErrorResponse('Student not found', 404));
  res.status(200).json({ success: true, data: student });
});

// @desc    Delete (deactivate) student
// @route   DELETE /api/v1/students/:id
// @access  Private (admin)
exports.deleteStudent = asyncHandler(async (req, res, next) => {
  const student = await Student.findById(req.params.id);
  if (!student) return next(new ErrorResponse('Student not found', 404));

  student.isActive = false;
  await student.save();

  res.status(200).json({ success: true, message: 'Student deactivated' });
});
