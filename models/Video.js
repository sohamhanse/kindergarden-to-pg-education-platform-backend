// models/Video.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VideoSchema = new Schema({
  title: String,
  description: String,
  type: { type: String, enum: ['lecture', 'youtube', 'live-stream'] },
  url: { type: String, required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  aiBlog: String,
  language: String,
  recognitionData: {
    characters: [String],
    numbers: [Number],
    poems: [String]
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', VideoSchema);