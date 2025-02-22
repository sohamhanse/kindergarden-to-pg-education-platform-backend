// models/Course.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  educationalStage: { 
    level: { type: String, enum: ['kindergarten', 'primary', 'secondary', 'undergrad', 'postgrad'] },
    grade: String
  },
  subjects: [String],
  teacher: { type: Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  content: {
    videos: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
    assignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment' }],
    quizzes: [{ type: Schema.Types.ObjectId, ref: 'Quiz' }]
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);