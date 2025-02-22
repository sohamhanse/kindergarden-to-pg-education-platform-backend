// models/LiveStream.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LiveStreamSchema = new Schema({
  title: String,
  description: String,
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  conductedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  startTime: Date,
  endTime: Date,
  attendance: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  recordingUrl: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LiveStream', LiveStreamSchema);