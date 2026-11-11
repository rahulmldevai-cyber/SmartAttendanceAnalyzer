const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const logger = require('../config/logger');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected for seeding...');
};

const subjects = [
  { name: 'Data Structures & Algorithms', code: 'CSE201' },
  { name: 'Database Management Systems', code: 'CSE202' },
  { name: 'Operating Systems', code: 'CSE203' },
  { name: 'Computer Networks', code: 'CSE204' },
  { name: 'Software Engineering', code: 'CSE205' },
];

const sections = ['A', 'B'];
const branches = ['CSE', 'ECE', 'ME'];

const getRandomStatus = (weight = 0.8) => {
  const r = Math.random();
  if (r < weight) return 'present';
  if (r < weight + 0.05) return 'late';
  return 'absent';
};

const seedDatabase = async () => {
  await connectDB();

  try {
    // Clear existing data (drop to remove stale index conflicts)
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Student.collection.drop().catch(() => {}),
      Attendance.collection.drop().catch(() => {}),
    ]);

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@attendance.com',
      password: 'Admin@123',
      role: 'admin',
      department: 'Administration',
      isEmailVerified: true,
      isActive: true,
    });

    // Create teacher users
    const teachers = await Promise.all([
      User.create({ name: 'Mr. Aryan Sharma', email: 'aryan.sharma@attendance.com', password: 'Teacher@123', role: 'teacher', department: 'CSE', isEmailVerified: true, isActive: true }),
      User.create({ name: 'Ms. Priya Singh', email: 'priya.singh@attendance.com', password: 'Teacher@123', role: 'teacher', department: 'CSE', isEmailVerified: true, isActive: true }),
      User.create({ name: 'Mr. Rahul Verma', email: 'rahul.verma@attendance.com', password: 'Teacher@123', role: 'teacher', department: 'ECE', isEmailVerified: true, isActive: true }),
    ]);

    console.log(`✅ Created ${1 + teachers.length} users`);

    // Create students
    const studentData = [];
    const rollPrefixes = { CSE: '2501730', ECE: '2501731', ME: '2501732' };

    ['CSE', 'ECE'].forEach((branch) => {
      sections.forEach((section, sIdx) => {
        for (let i = 1; i <= 30; i++) {
          const uniqueNum = sIdx * 100 + i;
          const rollNum = `${rollPrefixes[branch]}${String(uniqueNum).padStart(3, '0')}`;
          studentData.push({
            rollNumber: rollNum,
            name: `Student ${branch}${section}${i}`,
            email: `student${rollNum.toLowerCase()}@college.edu`,
            phone: `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`,
            section,
            semester: 3,
            branch,
            batch: '2023-2027',
            createdBy: adminUser._id,
            isActive: true,
          });
        }
      });
    });

    const students = await Student.insertMany(studentData);
    console.log(`✅ Created ${students.length} students`);

    // Create User login accounts for every student
    // Default password = their roll number
    for (const student of students) {
      try {
        const user = await User.create({
          name: student.name,
          email: student.email,
          password: student.rollNumber,
          role: 'student',
          department: student.branch,
          isEmailVerified: true,
          isActive: true,
        });
        await Student.findByIdAndUpdate(student._id, { userId: user._id });
      } catch (_) {
        // skip duplicates
      }
    }
    console.log(`✅ Created login accounts for all students (password = roll number)`);

    // Create attendance records for the last 60 days
    const attendanceRecords = [];
    const now = new Date();

    for (let day = 60; day >= 0; day--) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const subject of subjects) {
        for (const student of students.slice(0, 60)) { // First 60 students
          // Some students are chronic absentees (lower weight)
          const isAtRisk = student.rollNumber.endsWith('01') || student.rollNumber.endsWith('15');
          const weight = isAtRisk ? 0.55 : 0.82;

          attendanceRecords.push({
            student: student._id,
            subject: subject.name,
            subjectCode: subject.code,
            date: new Date(date.setHours(9 + subjects.indexOf(subject), 0, 0, 0)),
            status: getRandomStatus(weight),
            markedBy: teachers[0]._id,
            semester: 3,
            section: student.section,
            branch: student.branch,
            lectureNumber: 1,
          });
        }
      }
    }

    // Insert in batches
    const BATCH_SIZE = 1000;
    for (let i = 0; i < attendanceRecords.length; i += BATCH_SIZE) {
      await Attendance.insertMany(attendanceRecords.slice(i, i + BATCH_SIZE), { ordered: false });
    }

    console.log(`✅ Created ${attendanceRecords.length} attendance records`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('  Admin:   admin@attendance.com    / Admin@123');
    console.log('  Teacher: aryan.sharma@attendance.com / Teacher@123');
    console.log('  Teacher: priya.singh@attendance.com  / Teacher@123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
