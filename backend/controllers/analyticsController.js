const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { resolveNotificationPrefs } = require('../utils/notificationPreferences');
const Subscription = require('../models/Subscription');
const { calculateMonthlyWaste } = require('../utils/financeCalculations');
const {
  detectAnomalies,
  calculateCategoryTrends,
  calculateHealthScore,
  calculateSpendingMix,
} = require('../utils/analyticsEngine');

const TREND_MONTHS_BACK = 3;

const calculateSpendingVolatility = (expenseTransactions) => {
  const spendingByDay = new Map();

  expenseTransactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const day = date.toISOString().slice(0, 10);
    spendingByDay.set(day, (spendingByDay.get(day) || 0) + transaction.amount);
  });

  const dailyTotals = Array.from(spendingByDay.values());
  if (dailyTotals.length === 0) {
    return 0;
  }

  const mean = dailyTotals.reduce((total, amount) => total + amount, 0) /
    dailyTotals.length;
  if (mean === 0) {
    return 0;
  }

  const variance = dailyTotals.reduce(
    (total, amount) => total + (amount - mean) ** 2,
    0
  ) / dailyTotals.length;

  return Math.sqrt(variance) / mean;
};

const getDashboardAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfTrendWindow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - TREND_MONTHS_BACK,
        1
      )
    );

    const [transactions, subscriptions, user] = await Promise.all([
      Transaction.find({
        userId: req.userId,
        date: { $gte: startOfTrendWindow, $lte: now },
      }).lean(),
      Subscription.find({ userId: req.userId }).lean(),
      User.findById(req.userId).select('notificationPrefs').lean(),
    ]);

    if (!user) return res.status(404).json({ message: 'User not found' });
    const notificationPrefs = resolveNotificationPrefs(user.notificationPrefs);
    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));
    const weeklyTransactions = transactions.filter((item) => new Date(item.date) >= weekStart && new Date(item.date) <= now);
    const weeklyIncome = weeklyTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
    const weeklyExpense = weeklyTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);

    const expenseTransactions = transactions.filter(
      (transaction) => transaction.type === 'expense'
    );
    const totalIncome = transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((total, transaction) => total + transaction.amount, 0);
    const totalExpense = expenseTransactions.reduce(
      (total, transaction) => total + transaction.amount,
      0
    );
    const monthlyWaste = calculateMonthlyWaste(subscriptions);

    const savingsRate =
      totalIncome === 0 ? 0 : (totalIncome - totalExpense) / totalIncome;
    const subscriptionWastePercent =
      totalExpense === 0
        ? monthlyWaste > 0
          ? 1
          : 0
        : monthlyWaste / totalExpense;
    const spendingVolatility = calculateSpendingVolatility(expenseTransactions);

    return res.status(200).json({
      transactionCount: transactions.length,
      spendingMix: calculateSpendingMix(transactions, now),
      anomalies: notificationPrefs.unusualSpendingAlerts ? detectAnomalies(transactions) : [],
      notificationPrefs,
      weeklyDigest: notificationPrefs.weeklySummary ? {
        from: weekStart, through: now, transactionCount: weeklyTransactions.length,
        income: weeklyIncome, expense: weeklyExpense, net: weeklyIncome - weeklyExpense,
      } : null,
      categoryTrends: calculateCategoryTrends(
        transactions,
        TREND_MONTHS_BACK,
        now
      ),
      healthScore: calculateHealthScore({
        savingsRate,
        subscriptionWastePercent,
        spendingVolatility,
      }),
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    console.error('Get dashboard analytics error:', error);
    return res.status(500).json({ message: 'Unable to build dashboard analytics' });
  }
};

module.exports = { getDashboardAnalytics };

