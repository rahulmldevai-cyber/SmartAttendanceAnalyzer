const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student reference is required'],
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  subjectCode: {
    type: String,
    trim: true,
    uppercase: true,
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: [true, 'Status is required'],
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  section: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  branch: {
    type: String,
    trim: true,
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [200, 'Remarks cannot exceed 200 characters'],
  },
  lectureNumber: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

// ─── Indexes for performance ──────────────────────────────────────────────────
AttendanceSchema.index({ student: 1, date: -1 });
AttendanceSchema.index({ student: 1, subject: 1 });
AttendanceSchema.index({ section: 1, date: -1 });
AttendanceSchema.index({ date: -1 });
AttendanceSchema.index({ subject: 1, section: 1, date: -1 });

// Prevent duplicate entries for same student + subject + date + lectureNumber
AttendanceSchema.index(
  { student: 1, subject: 1, date: 1, lectureNumber: 1 },
  { unique: true }
);

// ─── Static: Get attendance percentage for a student ─────────────────────────
AttendanceSchema.statics.getAttendancePercentage = async function (studentId, subject = null, semester = null) {
  const match = { student: new mongoose.Types.ObjectId(studentId) };
  if (subject) match.subject = subject;
  if (semester) match.semester = semester;

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        total: 1,
        present: 1,
        percentage: {
          $cond: [
            { $eq: ['$total', 0] },
            0,
            { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
          ],
        },
      },
    },
  ]);

  return result[0] || { total: 0, present: 0, percentage: 0 };
};

module.exports = mongoose.model('Attendance', AttendanceSchema);
