const mongoose = require('mongoose');

const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { resolveNotificationPrefs } = require('../utils/notificationPreferences');
const { calculateSubscriptionSummary } = require('../utils/financeCalculations');

const BILLING_CYCLES = ['monthly', 'yearly'];
const SUBSCRIPTION_STATUSES = ['active', 'unused'];
const UPDATE_FIELDS = ['name', 'amount', 'billingCycle', 'nextDueDate', 'status'];

const isPositiveNumber = (value) => {
  if (value === null || value === '' || typeof value === 'boolean') {
    return false;
  }

  return Number.isFinite(Number(value)) && Number(value) > 0;
};

const isValidDate = (value) => {
  return value !== null && value !== '' && !Number.isNaN(new Date(value).getTime());
};

const validateSubscription = (data, requireAllFields = true) => {
  const errors = [];

  if (
    (requireAllFields || data.name !== undefined) &&
    (typeof data.name !== 'string' || !data.name.trim())
  ) {
    errors.push('Name is required');
  }

  if ((requireAllFields || data.amount !== undefined) && !isPositiveNumber(data.amount)) {
    errors.push('Amount must be a positive number');
  }

  if (
    (requireAllFields || data.billingCycle !== undefined) &&
    !BILLING_CYCLES.includes(data.billingCycle)
  ) {
    errors.push("Billing cycle must be either 'monthly' or 'yearly'");
  }

  if (
    (requireAllFields || data.nextDueDate !== undefined) &&
    !isValidDate(data.nextDueDate)
  ) {
    errors.push('A valid next due date is required');
  }

  if (
    data.status !== undefined &&
    !SUBSCRIPTION_STATUSES.includes(data.status)
  ) {
    errors.push("Status must be either 'active' or 'unused'");
  }

  return errors;
};

const createSubscription = async (req, res) => {
  try {
    const { name, amount, billingCycle, nextDueDate, status } = req.body || {};
    const data = { name, amount, billingCycle, nextDueDate, status };
    const errors = validateSubscription(data);

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const subscription = await Subscription.create({
      userId: req.userId,
      name: name.trim(),
      amount: Number(amount),
      billingCycle,
      nextDueDate: new Date(nextDueDate),
      status: status || 'active',
    });

    return res.status(201).json({
      message: 'Subscription created successfully',
      subscription,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Create subscription error:', error);
    return res.status(500).json({ message: 'Unable to create subscription' });
  }
};

const getSubscriptions = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.userId };

    if (status !== undefined) {
      if (!SUBSCRIPTION_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Status must be either 'active' or 'unused'",
        });
      }
      filter.status = status;
    }

    const subscriptions = await Subscription.find(filter).sort({ nextDueDate: 1 });

    return res.status(200).json({ count: subscriptions.length, subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return res.status(500).json({ message: 'Unable to retrieve subscriptions' });
  }
};

const getSubscriptionsDueSoon = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('notificationPrefs').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!resolveNotificationPrefs(user.notificationPrefs).dueDateAlerts) {
      return res.status(200).json({ count: 0, subscriptions: [], enabled: false });
    }
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const subscriptions = await Subscription.find({
      userId: req.userId,
      nextDueDate: { $gte: now, $lte: twentyFourHoursFromNow },
    }).sort({ nextDueDate: 1 });

    return res.status(200).json({
      count: subscriptions.length,
      subscriptions,
      enabled: true,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    console.error('Get subscriptions due soon error:', error);
    return res.status(500).json({
      message: 'Unable to retrieve upcoming subscriptions',
    });
  }
};

const updateSubscription = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You do not own this subscription' });
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

    const errors = validateSubscription(updates, false);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    if (updates.name !== undefined) updates.name = updates.name.trim();
    if (updates.amount !== undefined) updates.amount = Number(updates.amount);
    if (updates.nextDueDate !== undefined) {
      updates.nextDueDate = new Date(updates.nextDueDate);
    }

    Object.assign(subscription, updates);
    await subscription.save();

    return res.status(200).json({
      message: 'Subscription updated successfully',
      subscription,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Update subscription error:', error);
    return res.status(500).json({ message: 'Unable to update subscription' });
  }
};

const deleteSubscription = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You do not own this subscription' });
    }

    await subscription.deleteOne();

    return res.status(200).json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Delete subscription error:', error);
    return res.status(500).json({ message: 'Unable to delete subscription' });
  }
};

const getSubscriptionWaste = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.userId)) {
      return res.status(400).json({ message: 'Invalid user ID in token' });
    }

    const subscriptions = await Subscription.find({ userId: req.userId }).lean();
    const summary = calculateSubscriptionSummary(subscriptions);
    return res.status(200).json({
      ...summary,
      // Keep the original fields for existing clients.
      totalMonthlyCost: summary.monthlyWaste,
      unusedSubscriptionCount: subscriptions.filter((item) => item.status === 'unused').length,
    });
  } catch (error) {
    console.error('Get subscription waste error:', error);
    return res.status(500).json({ message: 'Unable to calculate subscription waste' });
  }
};

module.exports = {
  createSubscription,
  getSubscriptions,
  getSubscriptionsDueSoon,
  updateSubscription,
  deleteSubscription,
  getSubscriptionWaste,
};

