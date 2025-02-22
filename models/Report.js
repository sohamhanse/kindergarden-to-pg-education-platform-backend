// models/Report.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
  type: { type: String, enum: ['student', 'course', 'system'] },
  content: Object,
  generatedBy: { type: String, enum: ['AI', 'teacher', 'admin'] },
  referenceId: Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);