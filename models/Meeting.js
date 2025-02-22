// models/Meeting.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MeetingSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  scheduledTime: Date,
  notes: String,
  type: { type: String, enum: ['parent-teacher', 'admin'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Meeting', MeetingSchema);