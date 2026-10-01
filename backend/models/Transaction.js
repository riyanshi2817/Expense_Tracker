const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => Number.isFinite(value) && value > 0,
      message: 'Amount must be a positive number',
    },
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);

