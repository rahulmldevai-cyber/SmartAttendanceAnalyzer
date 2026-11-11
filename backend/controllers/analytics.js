const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const mongoose = require('mongoose');

// @desc    Get overall attendance dashboard stats
// @route   GET /api/v1/analytics/dashboard
// @access  Private (admin, teacher)
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const { section, semester, branch, startDate, endDate } = req.query;

  const matchStage = {};

  // If logged-in user is a student, scope everything to their own data
  if (req.user.role === 'student') {
    const studentProfile = await Student.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return res.status(200).json({
        success: true,
        data: {
          overview: { total: 0, present: 0, absent: 0, percentage: 0 },
          totalStudents: 1,
          atRiskCount: 0,
          atRiskStudents: [],
          subjectWise: [],
          dailyTrend: [],
        },
      });
    }
    matchStage.student = studentProfile._id;
  } else {
    if (section) matchStage.section = section;
    if (semester) matchStage.semester = parseInt(semester);
    if (branch) matchStage.branch = branch;
  }

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchStage.date.$lte = end;
    }
  }

  const [overallStats, atRiskStudents, subjectWise, totalStudents, recentTrend] = await Promise.all([
    // Overall attendance percentage
    Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          total: 1,
          present: 1,
          absent: { $subtract: ['$total', '$present'] },
          percentage: {
            $cond: [
              { $eq: ['$total', 0] }, 0,
              { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 2] },
            ],
          },
        },
      },
    ]),

    // At-risk students (< 75% attendance)
    Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          percentage: {
            $cond: [
              { $eq: ['$total', 0] }, 0,
              { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
            ],
          },
          total: 1,
          present: 1,
        },
      },
      { $match: { percentage: { $lt: 75 } } },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      { $unwind: '$studentInfo' },
      {
        $project: {
          _id: 1,
          percentage: { $round: ['$percentage', 1] },
          total: 1,
          present: 1,
          name: '$studentInfo.name',
          rollNumber: '$studentInfo.rollNumber',
          section: '$studentInfo.section',
        },
      },
      { $sort: { percentage: 1 } },
      { $limit: 10 },
    ]),

    // Subject-wise attendance
    Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { subject: '$subject', subjectCode: '$subjectCode' },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          subject: '$_id.subject',
          subjectCode: '$_id.subjectCode',
          total: 1,
          present: 1,
          percentage: {
            $cond: [
              { $eq: ['$total', 0] }, 0,
              { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
            ],
          },
        },
      },
      { $sort: { percentage: -1 } },
    ]),

    // Total active students
    Student.countDocuments({ isActive: true, ...(section && { section }), ...(semester && { semester: parseInt(semester) }), ...(branch && { branch }) }),

    // Daily trend for last 30 days
    Attendance.aggregate([
      {
        $match: {
          ...matchStage,
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          date: '$_id',
          total: 1,
          present: 1,
          percentage: {
            $cond: [
              { $eq: ['$total', 0] }, 0,
              { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
            ],
          },
        },
      },
      { $sort: { date: 1 } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: overallStats[0] || { total: 0, present: 0, absent: 0, percentage: 0 },
      totalStudents,
      atRiskCount: atRiskStudents.length,
      atRiskStudents,
      subjectWise,
      dailyTrend: recentTrend,
    },
  });
});

// @desc    Get student-wise attendance report
// @route   GET /api/v1/analytics/students
// @access  Private
exports.getStudentAttendance = asyncHandler(async (req, res, next) => {
  const { section, semester, branch, subject, threshold = 75 } = req.query;

  const studentMatch = { isActive: true };
  if (section) studentMatch.section = section;
  if (semester) studentMatch.semester = parseInt(semester);
  if (branch) studentMatch.branch = branch;

  const attendanceMatch = {};
  if (subject) attendanceMatch.subject = subject;

  const students = await Student.aggregate([
    { $match: studentMatch },
    {
      $lookup: {
        from: 'attendances',
        let: { studentId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$student', '$$studentId'] },
              ...attendanceMatch,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              present: {
                $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
              },
              absent: {
                $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
              },
              late: {
                $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
              },
            },
          },
        ],
        as: 'attendanceSummary',
      },
    },
    { $unwind: { path: '$attendanceSummary', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: 1,
        rollNumber: 1,
        email: 1,
        section: 1,
        semester: 1,
        branch: 1,
        total: { $ifNull: ['$attendanceSummary.total', 0] },
        present: { $ifNull: ['$attendanceSummary.present', 0] },
        absent: { $ifNull: ['$attendanceSummary.absent', 0] },
        late: { $ifNull: ['$attendanceSummary.late', 0] },
        percentage: {
          $cond: [
            {
              $or: [
                { $not: ['$attendanceSummary'] },
                { $eq: ['$attendanceSummary.total', 0] },
              ],
            },
            0,
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$attendanceSummary.present', '$attendanceSummary.total'] },
                    100,
                  ],
                },
                1,
              ],
            },
          ],
        },
        isAtRisk: {
          $lt: [
            {
              $cond: [
                { $eq: [{ $ifNull: ['$attendanceSummary.total', 0] }, 0] },
                100,
                {
                  $multiply: [
                    { $divide: [{ $ifNull: ['$attendanceSummary.present', 0] }, { $ifNull: ['$attendanceSummary.total', 1] }] },
                    100,
                  ],
                },
              ],
            },
            parseFloat(threshold),
          ],
        },
      },
    },
    { $sort: { percentage: 1, rollNumber: 1 } },
  ]);

  res.status(200).json({ success: true, count: students.length, data: students });
});

// @desc    Get weekly/monthly trends
// @route   GET /api/v1/analytics/trends
// @access  Private
exports.getTrends = asyncHandler(async (req, res, next) => {
  const { type = 'weekly', section, semester, subject, months = 6 } = req.query;

  const matchStage = {};

  // If student, scope to their own attendance only
  if (req.user.role === 'student') {
    const studentProfile = await Student.findOne({ userId: req.user._id });
    if (studentProfile) matchStage.student = studentProfile._id;
  } else {
    if (section) matchStage.section = section;
    if (semester) matchStage.semester = parseInt(semester);
    if (subject) matchStage.subject = subject;
  }

  matchStage.date = { $gte: new Date(Date.now() - parseInt(months) * 30 * 24 * 60 * 60 * 1000) };

  const groupFormat = type === 'monthly' ? '%Y-%m' : '%Y-W%V';
  const groupLabel = type === 'monthly'
    ? { $dateToString: { format: '%b %Y', date: { $toDate: { $concat: ['$_id', '-01'] } } } }
    : '$_id';

  const trends = await Attendance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$date' } },
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        period: '$_id',
        total: 1,
        present: 1,
        absent: { $subtract: ['$total', '$present'] },
        percentage: {
          $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1],
        },
      },
    },
    { $sort: { period: 1 } },
  ]);

  res.status(200).json({ success: true, data: trends });
});

// @desc    Get individual student detailed analytics
// @route   GET /api/v1/analytics/students/:id
// @access  Private
exports.getStudentDetails = asyncHandler(async (req, res, next) => {
  const student = await Student.findById(req.params.id);
  if (!student) return next(new ErrorResponse('Student not found', 404));

  // Students can only view their own data
  if (req.user.role === 'student' && student.userId?.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized to view this student data', 403));
  }

  const [subjectBreakdown, dailyHistory, monthlyTrend] = await Promise.all([
    Attendance.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: { subject: '$subject', subjectCode: '$subjectCode' },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        },
      },
      {
        $project: {
          subject: '$_id.subject',
          subjectCode: '$_id.subjectCode',
          total: 1, present: 1, absent: 1, late: 1,
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1],
          },
        },
      },
      { $sort: { subject: 1 } },
    ]),

    Attendance.find({ student: student._id })
      .sort({ date: -1 })
      .limit(60)
      .select('date status subject subjectCode'),

    Attendance.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
        },
      },
      {
        $project: {
          month: '$_id',
          total: 1, present: 1,
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1],
          },
        },
      },
      { $sort: { month: 1 } },
    ]),
  ]);

  // Overall stats
  const overall = await Attendance.getAttendancePercentage(student._id);

  res.status(200).json({
    success: true,
    data: {
      student,
      overall,
      subjectBreakdown,
      dailyHistory,
      monthlyTrend,
      isAtRisk: overall.percentage < 75,
    },
  });
});

// @desc    Get the student profile linked to the logged-in student user
// @route   GET /api/v1/analytics/me
// @access  Private (student)
exports.getMyProfile = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) return next(new ErrorResponse('Student profile not found. Contact your teacher to link your account.', 404));
  res.status(200).json({ success: true, data: student });
});

// @desc    Predict classes needed to reach 75% attendance
// @route   GET /api/v1/analytics/predict
// @access  Private (student)
exports.getPrediction = asyncHandler(async (req, res, next) => {
  const { threshold = 75 } = req.query;
  const thresholdVal = parseFloat(threshold);

  // Find the student profile linked to this user
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) return next(new ErrorResponse('Student profile not found', 404));

  // Get overall attendance stats per subject
  const subjectStats = await Attendance.aggregate([
    { $match: { student: student._id } },
    {
      $group: {
        _id: { subject: '$subject', subjectCode: '$subjectCode' },
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        subject: '$_id.subject',
        subjectCode: '$_id.subjectCode',
        total: 1,
        present: 1,
        percentage: {
          $cond: [
            { $eq: ['$total', 0] }, 0,
            { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
          ],
        },
      },
    },
    { $sort: { subject: 1 } },
  ]);

  // Overall stats
  const totalClasses = subjectStats.reduce((a, s) => a + s.total, 0);
  const totalPresent = subjectStats.reduce((a, s) => a + s.present, 0);
  const currentPct = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

  // --- Core prediction logic ---
  //
  // Let:
  //   P = current present count
  //   T = current total classes
  //   x = additional classes to attend consecutively
  //   Goal: (P + x) / (T + x) >= threshold / 100
  //
  // Solving for x:
  //   P + x >= (threshold/100) * (T + x)
  //   P + x >= (threshold/100)*T + (threshold/100)*x
  //   x - (threshold/100)*x >= (threshold/100)*T - P
  //   x * (1 - threshold/100) >= (threshold/100)*T - P
  //   x >= [(threshold/100)*T - P] / [1 - threshold/100]

  let classesNeeded = 0;
  let canReach = true;

  if (currentPct >= thresholdVal) {
    classesNeeded = 0; // already above threshold
  } else if (thresholdVal >= 100) {
    canReach = false;
  } else {
    const numerator = (thresholdVal / 100) * totalClasses - totalPresent;
    const denominator = 1 - thresholdVal / 100;
    classesNeeded = denominator > 0 ? Math.ceil(numerator / denominator) : 0;
    if (classesNeeded < 0) classesNeeded = 0;
  }

  // How many classes can you skip and still stay above threshold?
  // (P - x) / (T + 0) >= threshold/100  -->  skip budget if already above
  // More useful: if above threshold, how many more can you miss?
  // (P) / (T + x) >= threshold/100  where x = extra total without attending
  // P >= (threshold/100) * (T + x)
  // x <= P/(threshold/100) - T
  let canSkip = 0;
  if (currentPct >= thresholdVal) {
    const maxTotal = totalPresent / (thresholdVal / 100);
    canSkip = Math.floor(maxTotal - totalClasses);
    if (canSkip < 0) canSkip = 0;
  }

  // Per-subject prediction
  const subjectPredictions = subjectStats.map((s) => {
    let needed = 0;
    let skip = 0;
    if (s.percentage >= thresholdVal) {
      const maxT = s.present / (thresholdVal / 100);
      skip = Math.floor(maxT - s.total);
      if (skip < 0) skip = 0;
    } else {
      const num = (thresholdVal / 100) * s.total - s.present;
      const den = 1 - thresholdVal / 100;
      needed = den > 0 ? Math.ceil(num / den) : 0;
      if (needed < 0) needed = 0;
    }
    return {
      subject: s.subject,
      subjectCode: s.subjectCode,
      total: s.total,
      present: s.present,
      percentage: s.percentage,
      classesNeeded: needed,
      canSkip: skip,
      safe: s.percentage >= thresholdVal,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      student: { name: student.name, rollNumber: student.rollNumber },
      threshold: thresholdVal,
      current: {
        total: totalClasses,
        present: totalPresent,
        absent: totalClasses - totalPresent,
        percentage: parseFloat(currentPct.toFixed(1)),
      },
      prediction: {
        isAboveThreshold: currentPct >= thresholdVal,
        classesNeeded,
        canSkip,
        canReach,
        // What percentage after attending classesNeeded more
        percentageAfter: totalClasses + classesNeeded > 0
          ? parseFloat((((totalPresent + classesNeeded) / (totalClasses + classesNeeded)) * 100).toFixed(1))
          : 0,
      },
      subjectPredictions,
    },
  });
});
