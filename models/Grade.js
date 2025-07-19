const mongoose = require('mongoose');

const subjectScoreSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    enum: [
      "English", "Mathematics", "General Science", "Social Studies", "Civics",
      "Literature", "Religious and Moral Education (RME)", "Physical Education (PE)",
      "Agriculture", "Computer Science", "History", "Biology", "Economics",
      "Geography", "R.O.T.C", "French", "Chemistry", "Physics"
    ]
  },
  scores: {
    period1: { type: Number, min: 0, max: 100, default: null },
    period2: { type: Number, min: 0, max: 100, default: null },
    period3: { type: Number, min: 0, max: 100, default: null },
    period4: { type: Number, min: 0, max: 100, default: null },
    period5: { type: Number, min: 0, max: 100, default: null },
    period6: { type: Number, min: 0, max: 100, default: null },
    semesterExam: { type: Number, min: 0, max: 100, default: 0 }
  },
  semesterAverage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, { _id: false });

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  academicYear: {
    type: String, // e.g. "2025/2026"
    required: true
  },
  term: {
    type: String,
    enum: ["1", "2"], // 1 = First Semester, 2 = Second Semester
    required: true
  },
  gradeLevel: {
    type: String,
    enum: ["7", "8", "9", "10", "11", "12"],
    required: true
  },
  department: {
    type: String,
    enum: ["Arts", "Science", "JHS", null],
    default: null
  },
  subjects: [subjectScoreSchema],
  overallAverage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  rank: {
    type: Number,
    default: null
  },
  totalStudents: {
    type: Number,
    default: null
  },
  attendance: {
    daysPresent: { type: Number, default: 0 },
    daysAbsent: { type: Number, default: 0 },
    timesTardy: { type: Number, default: 0 }
  },
  conduct: {
    type: String,
    enum: ["Excellent", "Good", "Satisfactory", "Needs Improvement"],
    default: "Good"
  }
}, { timestamps: true });

// Ensure one grade per student per semester
gradeSchema.index({ student: 1, academicYear: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);