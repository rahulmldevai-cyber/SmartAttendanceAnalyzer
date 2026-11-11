const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'teacher'));

// Generate attendance report as JSON (frontend can convert to CSV/PDF)
router.get('/attendance', asyncHandler(async (req, res) => {
  const { section, semester, branch, subject, startDate, endDate, format = 'json' } = req.query;

  const studentMatch = { isActive: true };
  if (section) studentMatch.section = section;
  if (semester) studentMatch.semester = parseInt(semester);
  if (branch) studentMatch.branch = branch;

  const attendanceMatch = {};
  if (subject) attendanceMatch.subject = subject;
  if (startDate || endDate) {
    attendanceMatch.date = {};
    if (startDate) attendanceMatch.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      attendanceMatch.date.$lte = end;
    }
  }

  const students = await Student.find(studentMatch).sort({ rollNumber: 1 }).lean();

  const report = await Promise.all(
    students.map(async (student) => {
      const records = await Attendance.find({
        student: student._id,
        ...attendanceMatch,
      }).sort({ date: 1 }).select('date status subject subjectCode').lean();

      const total = records.length;
      const present = records.filter((r) => ['present', 'late'].includes(r.status)).length;
      const absent = records.filter((r) => r.status === 'absent').length;
      const late = records.filter((r) => r.status === 'late').length;
      const percentage = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0;

      return {
        rollNumber: student.rollNumber,
        name: student.name,
        section: student.section,
        semester: student.semester,
        branch: student.branch,
        total,
        present,
        absent,
        late,
        percentage,
        isAtRisk: percentage < 75,
        records: format === 'detailed' ? records : undefined,
      };
    })
  );

  if (format === 'csv') {
    const headers = ['Roll No', 'Name', 'Section', 'Semester', 'Branch', 'Total', 'Present', 'Absent', 'Late', 'Percentage', 'At Risk'];
    const rows = report.map((r) =>
      [r.rollNumber, r.name, r.section, r.semester, r.branch, r.total, r.present, r.absent, r.late, r.percentage, r.isAtRisk ? 'Yes' : 'No'].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  }

  res.status(200).json({
    success: true,
    generatedAt: new Date().toISOString(),
    filters: { section, semester, branch, subject, startDate, endDate },
    count: report.length,
    data: report,
  });
}));

// At-risk students report
router.get('/at-risk', asyncHandler(async (req, res) => {
  const { threshold = 75, section, semester, branch } = req.query;

  const matchStage = {};
  if (section) matchStage.section = section;
  if (semester) matchStage.semester = parseInt(semester);
  if (branch) matchStage.branch = branch;

  const atRisk = await Attendance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$student',
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
      },
    },
    {
      $project: {
        percentage: {
          $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1],
        },
        total: 1, present: 1,
        absent: { $subtract: ['$total', '$present'] },
      },
    },
    { $match: { percentage: { $lt: parseFloat(threshold) } } },
    { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
    {
      $project: {
        rollNumber: '$student.rollNumber',
        name: '$student.name',
        section: '$student.section',
        semester: '$student.semester',
        branch: '$student.branch',
        email: '$student.email',
        phone: '$student.phone',
        parentEmail: '$student.parentEmail',
        percentage: 1, total: 1, present: 1, absent: 1,
      },
    },
    { $sort: { percentage: 1 } },
  ]);

  res.status(200).json({
    success: true,
    threshold: parseFloat(threshold),
    count: atRisk.length,
    data: atRisk,
  });
}));

module.exports = router;
