const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => Number.isFinite(value) && value > 0,
      message: 'Amount must be a positive number',
    },
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true,
  },
  nextDueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'unused'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Subscription', subscriptionSchema);

