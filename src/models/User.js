const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  case_id: {
    type: Number,
    required: true
  },
  quiz_score: {
    type: Number,
    default: 0
  },
  evidence_analysis_score: {
    type: Number,
    default: 0
  },
  critical_thinking_score: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  lastAttempt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.*@mans\.edu\.eg$/
  },
  collegeId: {
    type: String,
    required: true,
    unique: true,
    length: 10
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  progress: [progressSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
