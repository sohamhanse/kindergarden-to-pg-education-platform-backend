// models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'parent', 'admin'], required: true },
  personalInfo: {
    name: String,
    dob: Date,
    profilePicture: String
  },
  educationalStage: {
    level: { type: String, enum: ['kindergarten', 'primary', 'secondary', 'undergrad', 'postgrad'] },
    grade: String
  },
  coursesEnrolled: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  children: [{ type: Schema.Types.ObjectId, ref: 'User' }], // For parents
  teachingCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }], // For teachers
  activityStreak: Number,
  lastActive: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);