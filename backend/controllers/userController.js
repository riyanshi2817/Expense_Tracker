const User = require('../models/User');
const { resolveNotificationPrefs } = require('../utils/notificationPreferences');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UPDATE_FIELDS = [
  'name',
  'email',
  'salary',
  'fixedCommitments',
  'notificationPrefs',
];
const NOTIFICATION_PREF_FIELDS = [
  'dueDateAlerts',
  'unusualSpendingAlerts',
  'dueDateReminders',
  'anomalyAlerts',
  'weeklySummary',
];

const isNonNegativeNumber = (value) => {
  if (value === null || value === '' || typeof value === 'boolean') {
    return false;
  }

  return Number.isFinite(Number(value)) && Number(value) >= 0;
};

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  salary: user.salary,
  fixedCommitments: user.fixedCommitments,
  notificationPrefs: resolveNotificationPrefs(user.notificationPrefs),
});

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      'name email salary fixedCommitments notificationPrefs'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: formatUser(user) });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    console.error('Get current user error:', error);
    return res.status(500).json({ message: 'Unable to retrieve profile' });
  }
};

const updateCurrentUser = async (req, res) => {
  try {
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

    if (updates.email !== undefined) {
      const normalizedEmail = String(updates.email).trim().toLowerCase();
      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        errors.push('Please provide a valid email');
      } else {
        updates.email = normalizedEmail;
      }
    }

    if (
      updates.salary !== undefined &&
      !isNonNegativeNumber(updates.salary)
    ) {
      errors.push('Salary must be a non-negative number');
    }

    if (
      updates.fixedCommitments !== undefined &&
      !isNonNegativeNumber(updates.fixedCommitments)
    ) {
      errors.push('Fixed commitments must be a non-negative number');
    }

    if (updates.notificationPrefs !== undefined) {
      if (
        !updates.notificationPrefs ||
        typeof updates.notificationPrefs !== 'object' ||
        Array.isArray(updates.notificationPrefs)
      ) {
        errors.push('notificationPrefs must be an object');
      } else {
        const suppliedPrefs = Object.keys(updates.notificationPrefs);
        const invalidPrefs = suppliedPrefs.filter(
          (field) => !NOTIFICATION_PREF_FIELDS.includes(field)
        );
        const nonBooleanPrefs = suppliedPrefs.filter(
          (field) => typeof updates.notificationPrefs[field] !== 'boolean'
        );

        if (suppliedPrefs.length === 0) {
          errors.push('At least one notification preference is required');
        }
        if (invalidPrefs.length > 0) {
          errors.push(`Unknown notification preferences: ${invalidPrefs.join(', ')}`);
        }
        if (nonBooleanPrefs.length > 0) {
          errors.push('Notification preferences must be true or false');
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (updates.email !== undefined && updates.email !== user.email) {
      const emailOwner = await User.findOne({ email: updates.email });
      if (emailOwner) {
        return res.status(409).json({
          message: 'An account with this email already exists',
        });
      }
    }

    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.salary !== undefined) user.salary = Number(updates.salary);
    if (updates.fixedCommitments !== undefined) {
      user.fixedCommitments = Number(updates.fixedCommitments);
    }

    // Merge partial preference updates so a single toggle does not reset others.
    if (updates.notificationPrefs !== undefined) {
      if (!user.notificationPrefs) {
        user.notificationPrefs = {};
      }
      const prefs = updates.notificationPrefs;
      const due = prefs.dueDateAlerts ?? prefs.dueDateReminders;
      const unusual = prefs.unusualSpendingAlerts ?? prefs.anomalyAlerts;
      if (due !== undefined) {
        user.notificationPrefs.dueDateAlerts = due;
        user.notificationPrefs.dueDateReminders = due;
      }
      if (unusual !== undefined) {
        user.notificationPrefs.unusualSpendingAlerts = unusual;
        user.notificationPrefs.anomalyAlerts = unusual;
      }
      if (prefs.weeklySummary !== undefined) user.notificationPrefs.weeklySummary = prefs.weeklySummary;
    }

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: formatUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists',
      });
    }

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Update current user error:', error);
    return res.status(500).json({ message: 'Unable to update profile' });
  }
};

module.exports = { getCurrentUser, updateCurrentUser };

