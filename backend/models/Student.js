const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please add a valid Indian phone number'],
  },
  parentPhone: {
    type: String,
    trim: true,
  },
  parentEmail: {
    type: String,
    lowercase: true,
    trim: true,
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    uppercase: true,
    trim: true,
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8,
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    trim: true,
  },
  batch: {
    type: String, // e.g. "2023-2027"
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // linked user account (optional)
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
StudentSchema.index({ section: 1, semester: 1, branch: 1 });
StudentSchema.index({ name: 'text' });

// ─── Virtual: attendance summary ─────────────────────────────────────────────
StudentSchema.virtual('attendance', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'student',
});

module.exports = mongoose.model('Student', StudentSchema);
