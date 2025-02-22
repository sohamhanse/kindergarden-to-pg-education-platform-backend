// models/Assignment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssignmentSchema = new Schema({
  title: String,
  description: String,
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  dueDate: Date,
  maxMarks: Number,
  submissions: [{
    student: { type: Schema.Types.ObjectId, ref: 'User' },
    files: [String],
    grade: Number,
    feedback: String,
    submittedAt: Date
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', AssignmentSchema);