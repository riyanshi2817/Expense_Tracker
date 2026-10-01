const mongoose = require('mongoose');

const Goal = require('../models/Goal');

const UPDATE_FIELDS = ['name', 'targetAmount', 'currentAmount'];

const isPositiveNumber = (value) => {
  if (value === null || value === '' || typeof value === 'boolean') {
    return false;
  }

  return Number.isFinite(Number(value)) && Number(value) > 0;
};

const isNonNegativeNumber = (value) => {
  if (value === null || value === '' || typeof value === 'boolean') {
    return false;
  }

  return Number.isFinite(Number(value)) && Number(value) >= 0;
};

const createGoal = async (req, res) => {
  try {
    const { name, targetAmount, currentAmount = 0 } = req.body || {};
    const errors = [];

    if (typeof name !== 'string' || !name.trim()) {
      errors.push('Name is required');
    }

    if (!isPositiveNumber(targetAmount)) {
      errors.push('Target amount must be a positive number');
    }

    if (!isNonNegativeNumber(currentAmount)) {
      errors.push('Current amount must be a non-negative number');
    }

    if (
      isPositiveNumber(targetAmount) &&
      isNonNegativeNumber(currentAmount) &&
      Number(currentAmount) > Number(targetAmount)
    ) {
      errors.push('Current amount cannot exceed the target amount');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const goal = await Goal.create({
      userId: req.userId,
      name: name.trim(),
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount),
    });

    return res.status(201).json({
      message: 'Goal created successfully',
      goal,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Create goal error:', error);
    return res.status(500).json({ message: 'Unable to create goal' });
  }
};

const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.userId }).sort({ createdAt: -1 });

    return res.status(200).json({ count: goals.length, goals });
  } catch (error) {
    console.error('Get goals error:', error);
    return res.status(500).json({ message: 'Unable to retrieve goals' });
  }
};

const updateGoal = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }

    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You do not own this goal' });
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

    const errors = [];

    if (
      updates.name !== undefined &&
      (typeof updates.name !== 'string' || !updates.name.trim())
    ) {
      errors.push('Name cannot be empty');
    }

    if (
      updates.targetAmount !== undefined &&
      !isPositiveNumber(updates.targetAmount)
    ) {
      errors.push('Target amount must be a positive number');
    }

    if (
      updates.currentAmount !== undefined &&
      !isNonNegativeNumber(updates.currentAmount)
    ) {
      errors.push('Current amount must be a non-negative number');
    }

    const updatedTargetAmount =
      updates.targetAmount === undefined
        ? goal.targetAmount
        : Number(updates.targetAmount);
    const updatedCurrentAmount =
      updates.currentAmount === undefined
        ? goal.currentAmount
        : Number(updates.currentAmount);

    if (
      isPositiveNumber(updatedTargetAmount) &&
      isNonNegativeNumber(updatedCurrentAmount) &&
      updatedCurrentAmount > updatedTargetAmount
    ) {
      errors.push('Current amount cannot exceed the target amount');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    if (updates.name !== undefined) updates.name = updates.name.trim();
    if (updates.targetAmount !== undefined) {
      updates.targetAmount = Number(updates.targetAmount);
    }
    if (updates.currentAmount !== undefined) {
      updates.currentAmount = Number(updates.currentAmount);
    }

    Object.assign(goal, updates);
    await goal.save();

    return res.status(200).json({
      message: 'Goal updated successfully',
      goal,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Update goal error:', error);
    return res.status(500).json({ message: 'Unable to update goal' });
  }
};

const deleteGoal = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }

    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You do not own this goal' });
    }

    await goal.deleteOne();

    return res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    return res.status(500).json({ message: 'Unable to delete goal' });
  }
};

module.exports = {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
};

