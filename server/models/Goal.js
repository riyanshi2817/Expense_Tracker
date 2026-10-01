const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  targetAmount: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => Number.isFinite(value) && value > 0,
      message: 'Target amount must be a positive number',
    },
  },
  currentAmount: {
    type: Number,
    default: 0,
    validate: {
      validator(value) {
        return (
          Number.isFinite(value) &&
          value >= 0 &&
          value <= this.targetAmount
        );
      },
      message: 'Current amount must be between 0 and the target amount',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Goal', goalSchema);

