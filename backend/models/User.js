const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  // Passwords are hashed in the auth controller before they are stored.
  password: {
    type: String,
    required: true,
  },
  salary: {
    type: Number,
    default: 0,
    min: 0,
  },
  fixedCommitments: {
    type: Number,
    default: 0,
    min: 0,
  },
  notificationPrefs: {
    dueDateAlerts: { type: Boolean, default: undefined },
    unusualSpendingAlerts: { type: Boolean, default: undefined },
    dueDateReminders: {
      type: Boolean,
      default: true,
    },
    anomalyAlerts: {
      type: Boolean,
      default: true,
    },
    weeklySummary: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);

