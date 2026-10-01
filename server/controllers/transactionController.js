const mongoose = require('mongoose');
const { parse } = require('csv-parse/sync');

const Transaction = require('../models/Transaction');

const TRANSACTION_TYPES = ['income', 'expense'];
const UPDATE_FIELDS = ['amount', 'category', 'description', 'date', 'type'];

const isPositiveNumber = (value) => {
  if (value === null || value === '' || typeof value === 'boolean') {
    return false;
  }

  return Number.isFinite(Number(value)) && Number(value) > 0;
};

const isValidDate = (value) => {
  return value !== null && value !== '' && !Number.isNaN(new Date(value).getTime());
};

const validateTransaction = (data, requireAllFields = true) => {
  const errors = [];

  if ((requireAllFields || data.amount !== undefined) && !isPositiveNumber(data.amount)) {
    errors.push('Amount must be a positive number');
  }

  if (
    (requireAllFields || data.category !== undefined) &&
    (typeof data.category !== 'string' || !data.category.trim())
  ) {
    errors.push('Category is required');
  }

  if ((requireAllFields || data.date !== undefined) && !isValidDate(data.date)) {
    errors.push('A valid date is required');
  }

  if (
    (requireAllFields || data.type !== undefined) &&
    !TRANSACTION_TYPES.includes(data.type)
  ) {
    errors.push("Type must be either 'income' or 'expense'");
  }

  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('Description must be a string');
  }

  return errors;
};

const formatTransactionData = (data) => ({
  amount: Number(data.amount),
  category: data.category.trim(),
  description: data.description ? data.description.trim() : '',
  date: new Date(data.date),
  type: data.type,
});

const createTransaction = async (req, res) => {
  try {
    const { amount, category, description, date, type } = req.body || {};
    const data = { amount, category, description, date, type };
    const errors = validateTransaction(data);

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const transaction = await Transaction.create({
      ...formatTransactionData(data),
      userId: req.userId,
    });

    return res.status(201).json({
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Create transaction error:', error);
    return res.status(500).json({ message: 'Unable to create transaction' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { category, type, startDate, endDate } = req.query;
    const filter = { userId: req.userId };

    if (category !== undefined) {
      if (typeof category !== 'string' || !category.trim()) {
        return res.status(400).json({ message: 'Category cannot be empty' });
      }
      filter.category = category.trim();
    }

    if (type !== undefined) {
      if (!TRANSACTION_TYPES.includes(type)) {
        return res.status(400).json({
          message: "Type must be either 'income' or 'expense'",
        });
      }
      filter.type = type;
    }

    if (startDate !== undefined || endDate !== undefined) {
      filter.date = {};

      if (startDate !== undefined) {
        if (!isValidDate(startDate)) {
          return res.status(400).json({ message: 'startDate must be a valid date' });
        }
        filter.date.$gte = new Date(startDate);
      }

      if (endDate !== undefined) {
        if (!isValidDate(endDate)) {
          return res.status(400).json({ message: 'endDate must be a valid date' });
        }

        // Treat a date-only endDate as the end of that calendar day (UTC).
        filter.date.$lte = /^\d{4}-\d{2}-\d{2}$/.test(endDate)
          ? new Date(`${endDate}T23:59:59.999Z`)
          : new Date(endDate);
      }

      if (filter.date.$gte && filter.date.$lte && filter.date.$gte > filter.date.$lte) {
        return res.status(400).json({
          message: 'startDate cannot be later than endDate',
        });
      }
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });

    return res.status(200).json({ count: transactions.length, transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({ message: 'Unable to retrieve transactions' });
  }
};

const updateTransaction = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You do not own this transaction' });
    }

    const updates = {};
    UPDATE_FIELDS.forEach((field) => {
      if (req.body && req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields were provided' });
    }

    const errors = validateTransaction(updates, false);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    if (updates.amount !== undefined) updates.amount = Number(updates.amount);
    if (updates.category !== undefined) updates.category = updates.category.trim();
    if (updates.description !== undefined) updates.description = updates.description.trim();
    if (updates.date !== undefined) updates.date = new Date(updates.date);

    Object.assign(transaction, updates);
    await transaction.save();

    return res.status(200).json({
      message: 'Transaction updated successfully',
      transaction,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Update transaction error:', error);
    return res.status(500).json({ message: 'Unable to update transaction' });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You do not own this transaction' });
    }

    await transaction.deleteOne();

    return res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return res.status(500).json({ message: 'Unable to delete transaction' });
  }
};

const importTransactions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "A CSV file is required in the 'file' form field",
      });
    }

    let rows;
    try {
      rows = parse(req.file.buffer, {
        bom: true,
        columns: (headers) => headers.map((header) => header.trim()),
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error) {
      return res.status(400).json({
        message: 'The uploaded file could not be parsed as CSV',
        error: error.message,
      });
    }

    const requiredColumns = ['date', 'description', 'amount', 'category', 'type'];
    const suppliedColumns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const missingColumns = requiredColumns.filter(
      (column) => !suppliedColumns.includes(column)
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'The CSV file contains no data rows' });
    }

    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: `Missing required CSV columns: ${missingColumns.join(', ')}`,
      });
    }

    const transactionsToInsert = [];
    const failedRows = [];

    rows.forEach((row, index) => {
      const data = {
        amount: row.amount,
        category: row.category,
        description: row.description,
        date: row.date,
        type: row.type,
      };
      const errors = validateTransaction(data);

      if (errors.length > 0) {
        failedRows.push({ rowNumber: index + 2, row, errors });
        return;
      }

      transactionsToInsert.push({
        ...formatTransactionData(data),
        userId: req.userId,
      });
    });

    if (transactionsToInsert.length === 0) {
      return res.status(400).json({
        message: 'No valid transactions were found in the CSV file',
        importedCount: 0,
        failedRows,
      });
    }

    const importedTransactions = await Transaction.insertMany(transactionsToInsert);

    return res.status(201).json({
      message: 'CSV import completed',
      importedCount: importedTransactions.length,
      failedRows,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Import transactions error:', error);
    return res.status(500).json({ message: 'Unable to import transactions' });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  importTransactions,
};

