// models/Quiz.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuizSchema = new Schema({
  title: String,
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: String
  }],
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  maxMarks: Number,
  attempts: [{
    student: { type: Schema.Types.ObjectId, ref: 'User' },
    answers: [String],
    score: Number,
    attemptedAt: Date
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', QuizSchema);