const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const {
  calculateSpendable,
  calculateDaysLeftInMonth,
  calculateSafeToSpend,
  calculateMonthlyWaste,
  calculateCashFlow,
} = require('../utils/financeCalculations');

const CASH_FLOW_MONTHS = 6;

const getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfCashFlowWindow = new Date(
      now.getFullYear(),
      now.getMonth() - (CASH_FLOW_MONTHS - 1),
      1
    );

    // One transaction query covers both this month's budget and cash flow.
    const [user, recentTransactions, unusedSubscriptions] = await Promise.all([
      User.findById(req.userId).select('salary fixedCommitments').lean(),
      Transaction.find({
        userId: req.userId,
        date: { $gte: startOfCashFlowWindow, $lte: now },
      }).lean(),
      Subscription.find({ userId: req.userId, status: 'unused' }).lean(),
    ]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transactionsThisMonth = recentTransactions.filter(
      (transaction) => new Date(transaction.date) >= startOfCurrentMonth
    );

    const spendable = calculateSpendable(
      user.salary || 0,
      user.fixedCommitments || 0
    );
    const daysLeftInMonth = calculateDaysLeftInMonth(now);
    const { safeToSpendPerDay, remainingThisMonth } = calculateSafeToSpend(
      spendable,
      transactionsThisMonth,
      daysLeftInMonth
    );

    return res.status(200).json({
      salary: user.salary || 0,
      fixedCommitments: user.fixedCommitments || 0,
      spendable,
      safeToSpendPerDay,
      remainingThisMonth,
      daysLeftInMonth,
      monthlyWaste: calculateMonthlyWaste(unusedSubscriptions),
      cashFlow: calculateCashFlow(recentTransactions, CASH_FLOW_MONTHS),
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    console.error('Get dashboard summary error:', error);
    return res.status(500).json({ message: 'Unable to build dashboard summary' });
  }
};

module.exports = { getDashboardSummary };

