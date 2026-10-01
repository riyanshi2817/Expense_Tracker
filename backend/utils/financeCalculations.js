const assertFiniteNumber = (value, name) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
};

const toValidDate = (value, name) => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`${name} must be a valid date`);
  }

  return date;
};

/**
 * Money available after recurring fixed commitments are deducted.
 */
const calculateSpendable = (salary, fixedCommitments) => {
  assertFiniteNumber(salary, 'salary');
  assertFiniteNumber(fixedCommitments, 'fixedCommitments');

  return salary - fixedCommitments;
};

/**
 * Calendar days from currentDate through the final day of its month.
 * Today is included, so the result is always at least 1 for a valid date.
 */
const calculateDaysLeftInMonth = (currentDate) => {
  const date = toValidDate(currentDate, 'currentDate');
  const finalDayOfMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();

  return finalDayOfMonth - date.getDate() + 1;
};

/**
 * transactionsThisMonth is expected to contain transactions from the
 * current month up to today. Income does not reduce the spending budget.
 */
const calculateSafeToSpend = (
  spendable,
  transactionsThisMonth,
  daysLeftInMonth
) => {
  assertFiniteNumber(spendable, 'spendable');
  assertFiniteNumber(daysLeftInMonth, 'daysLeftInMonth');

  if (!Array.isArray(transactionsThisMonth)) {
    throw new TypeError('transactionsThisMonth must be an array');
  }

  if (!Number.isInteger(daysLeftInMonth) || daysLeftInMonth <= 0) {
    throw new RangeError('daysLeftInMonth must be a positive integer');
  }

  const expensesSoFar = transactionsThisMonth
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => {
      assertFiniteNumber(transaction.amount, 'transaction amount');
      return total + transaction.amount;
    }, 0);

  const remainingThisMonth = spendable - expensesSoFar;

  return {
    safeToSpendPerDay: remainingThisMonth / daysLeftInMonth,
    remainingThisMonth,
  };
};

/**
 * Convert unused subscriptions to their combined monthly equivalent.
 */
const calculateMonthlyWaste = (unusedSubscriptions) => {
  if (!Array.isArray(unusedSubscriptions)) {
    throw new TypeError('unusedSubscriptions must be an array');
  }

  return unusedSubscriptions
    .filter((subscription) => subscription.status === 'unused')
    .reduce((total, subscription) => {
      assertFiniteNumber(subscription.amount, 'subscription amount');

      if (!['monthly', 'yearly'].includes(subscription.billingCycle)) {
        throw new TypeError("billingCycle must be either 'monthly' or 'yearly'");
      }

      const monthlyAmount =
        subscription.billingCycle === 'yearly'
          ? subscription.amount / 12
          : subscription.amount;

      return total + monthlyAmount;
    }, 0);
};

/**
 * Group transactions into monthly income, expense, and net totals.
 * The input should already be limited to the desired calendar window.
 * monthsBack caps the number of returned month buckets.
 */
const calculateCashFlow = (transactions, monthsBack = 6) => {
  if (!Array.isArray(transactions)) {
    throw new TypeError('transactions must be an array');
  }

  if (!Number.isInteger(monthsBack) || monthsBack <= 0) {
    throw new RangeError('monthsBack must be a positive integer');
  }

  const totalsByMonth = new Map();

  transactions.forEach((transaction) => {
    const date = toValidDate(transaction.date, 'transaction date');
    assertFiniteNumber(transaction.amount, 'transaction amount');

    if (!['income', 'expense'].includes(transaction.type)) {
      throw new TypeError("transaction type must be either 'income' or 'expense'");
    }

    // MongoDB stores dates in UTC, so UTC components keep grouping consistent.
    const month = `${date.getUTCFullYear()}-${String(
      date.getUTCMonth() + 1
    ).padStart(2, '0')}`;

    if (!totalsByMonth.has(month)) {
      totalsByMonth.set(month, { month, income: 0, expense: 0, net: 0 });
    }

    const totals = totalsByMonth.get(month);
    totals[transaction.type] += transaction.amount;
    totals.net = totals.income - totals.expense;
  });

  return Array.from(totalsByMonth.values())
    .sort((first, second) => first.month.localeCompare(second.month))
    .slice(-monthsBack);
};

// Normalize every subscription, including unused services that are still billed.
const calculateSubscriptionSummary = (subscriptions) => {
  if (!Array.isArray(subscriptions)) throw new TypeError('subscriptions must be an array');
  const totalMonthlyRecurring = subscriptions.reduce((total, subscription) => {
    assertFiniteNumber(subscription.amount, 'subscription amount');
    if (!['monthly', 'yearly'].includes(subscription.billingCycle)) throw new TypeError('Invalid billing cycle');
    return total + (subscription.billingCycle === 'yearly' ? subscription.amount / 12 : subscription.amount);
  }, 0);
  const monthlyWaste = calculateMonthlyWaste(subscriptions);
  const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
  return { totalMonthlyRecurring: round(totalMonthlyRecurring), monthlyWaste: round(monthlyWaste), potentialSavings: round(monthlyWaste) };
};

module.exports = {
  calculateSubscriptionSummary,
  calculateSpendable,
  calculateDaysLeftInMonth,
  calculateSafeToSpend,
  calculateMonthlyWaste,
  calculateCashFlow,
};

