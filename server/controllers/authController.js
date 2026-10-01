const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { resolveNotificationPrefs } = require('../utils/notificationPreferences');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 10;

const createToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const signup = async (req, res) => {
  try {
    const { name, email, password, salary, fixedCommitments } = req.body || {};
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedName || !email || !password) {
      return res.status(400).json({
        message: 'Name, email, and password are required',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    if (salary !== undefined && (!Number.isFinite(Number(salary)) || Number(salary) < 0)) {
      return res.status(400).json({ message: 'Salary must be a non-negative number' });
    }

    if (
      fixedCommitments !== undefined &&
      (!Number.isFinite(Number(fixedCommitments)) || Number(fixedCommitments) < 0)
    ) {
      return res.status(400).json({
        message: 'Fixed commitments must be a non-negative number',
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(String(password), SALT_ROUNDS);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      salary: salary === undefined ? 0 : Number(salary),
      fixedCommitments:
        fixedCommitments === undefined ? 0 : Number(fixedCommitments),
    });

    const token = createToken(user._id);

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        salary: user.salary,
        fixedCommitments: user.fixedCommitments,
        notificationPrefs: resolveNotificationPrefs(user.notificationPrefs),
      },
    });
  } catch (error) {
    // The unique index also protects against two simultaneous signups.
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists',
      });
    }

    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Unable to create account' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(String(password), user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createToken(user._id);

    return res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        salary: user.salary,
        fixedCommitments: user.fixedCommitments,
        notificationPrefs: resolveNotificationPrefs(user.notificationPrefs),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Unable to log in' });
  }
};

module.exports = { signup, login };

