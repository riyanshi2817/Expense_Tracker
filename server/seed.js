require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Subscription = require('./models/Subscription');
const Goal = require('./models/Goal');

// Synthetic demo records only. Dates follow the day on which the script runs.
function buildDemoData(now = new Date()) {
  const transactions = [];
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const add = (date, amount, category, description, type = 'expense') => transactions.push({ date, amount, category, description, type });
  for (let ago = 89; ago >= 0; ago--) {
    const date = new Date(today.getTime() - ago * 86400000);
    const day = date.getUTCDate();
    const weekday = date.getUTCDay();
    if (day === 1) add(date, 85000, 'Salary', 'Monthly salary (demo)', 'income');
    if (day === 3) add(date, 22000, 'Housing', 'Apartment rent (demo)');
    if (day === 10) add(date, 1800 + date.getUTCMonth() * 45, 'Utilities', 'Electricity and internet (demo)');
    if (weekday === 6) add(date, 1450 + day * 11, 'Groceries', 'Weekly groceries (demo)');
    if (weekday >= 1 && weekday <= 5) add(date, 90 + (day % 4) * 25, 'Transport', 'Commute (demo)');
    if (weekday === 5) add(date, 480 + (day % 5) * 85, 'Dining', 'Friday dinner (demo)');
    if (day === 15) add(date, 800 + date.getUTCMonth() * 70, 'Shopping', 'Household supplies (demo)');
    if (day === 20) add(date, 650, 'Health', 'Pharmacy essentials (demo)');
    if (day === 22) add(date, 3500, 'Freelance', 'Design project (demo)', 'income');
  }
  add(new Date(today.getTime() - 2 * 86400000), 6800, 'Dining', 'Celebration dinner (demo)');
  const due = (days) => new Date(today.getTime() + days * 86400000);
  const subscriptions = [
    { name: 'Music streaming (demo)', amount: 119, billingCycle: 'monthly', status: 'active', nextDueDate: due(1) },
    { name: 'Cloud storage (demo)', amount: 1300, billingCycle: 'yearly', status: 'active', nextDueDate: due(6) },
    { name: 'Fitness app (demo)', amount: 799, billingCycle: 'monthly', status: 'unused', nextDueDate: due(3) },
    { name: 'Video streaming (demo)', amount: 499, billingCycle: 'monthly', status: 'unused', nextDueDate: due(12) },
  ];
  const goals = [
    { name: 'Emergency fund (demo)', targetAmount: 150000, currentAmount: 62500 },
    { name: 'Weekend getaway (demo)', targetAmount: 25000, currentAmount: 8500 },
  ];
  return { transactions, subscriptions, goals };
}

async function seed({ dryRun = false } = {}) {
  const data = buildDemoData();
  // Exercise the real schema validation even in dry-run mode, without a database.
  const validationUserId = new mongoose.Types.ObjectId();
  for (const [Model, records] of [[Transaction, data.transactions], [Subscription, data.subscriptions], [Goal, data.goals]]) {
    for (const record of records) await new Model({ ...record, userId: validationUserId }).validate();
  }
  if (dryRun) {
    console.log('Dry run passed:', data.transactions.length, 'transactions,', data.subscriptions.length, 'subscriptions,', data.goals.length, 'goals. No database writes.');
    return;
  }
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('Set MONGO_URI before seeding.');
  const email = (process.env.DEMO_EMAIL || 'demo@clearcash.example').trim().toLowerCase();
  const password = process.env.DEMO_PASSWORD || 'ClearCashDemo123!';
  if (password.length < 6) throw new Error('DEMO_PASSWORD must have at least 6 characters.');
  await mongoose.connect(mongoUri);
  try {
    let user = await User.findOne({ email });
    if (user && (user.name !== 'Aarav (Demo)' || !(await bcrypt.compare(password, user.password)))) {
      throw new Error('This email belongs to an existing account. Choose a different DEMO_EMAIL; no records were changed.');
    }
    if (!user) user = await User.create({ name: 'Aarav (Demo)', email, password: await bcrypt.hash(password, 10), salary: 85000, fixedCommitments: 0 });
    // Rent is already recorded as an expense; do not count it again as a fixed commitment.
    // Upserts insert missing demo rows only. Never delete or overwrite user data.
    for (const record of data.transactions) {
      const { date, category, description, type } = record;
      await Transaction.updateOne({ userId: user._id, date, category, description, type }, { $setOnInsert: { ...record, userId: user._id } }, { upsert: true, runValidators: true });
    }
    for (const [Model, records] of [[Subscription, data.subscriptions], [Goal, data.goals]]) {
      for (const record of records) {
        // Goal's cross-field validator requires a document, not a query update.
        const existing = await Model.findOne({ userId: user._id, name: record.name });
        if (!existing) await Model.create({ ...record, userId: user._id });
      }
    }
    console.log('Demo data ready for', email, '(password is DEMO_PASSWORD or the documented demo default).');
  } finally { await mongoose.disconnect(); }
}

if (require.main === module) seed({ dryRun: process.argv.includes('--dry-run') }).catch((error) => { console.error('Seed failed:', error.message); process.exitCode = 1; });
module.exports = { buildDemoData, seed };
