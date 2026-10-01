const clamp = (value, minimum, maximum) => {
  return Math.min(Math.max(value, minimum), maximum);
};

const roundToTwoDecimals = (value) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

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

const getMonthKey = (date) => {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    '0'
  )}`;
};

const getPreviousMonthKeys = (referenceDate, monthsBack) => {
  const keys = [];

  for (let monthsAgo = 1; monthsAgo <= monthsBack; monthsAgo += 1) {
    const date = new Date(
      Date.UTC(
        referenceDate.getUTCFullYear(),
        referenceDate.getUTCMonth() - monthsAgo,
        1
      )
    );
    keys.push(getMonthKey(date));
  }

  return keys;
};

/**
 * Large expenses are compared with other expenses in the same category.
 * Three records establish a minimum baseline; a value over two standard
 * deviations from that category's mean is unusual enough to flag.
 */
const detectAnomalies = (transactions) => {
  if (!Array.isArray(transactions)) {
    throw new TypeError('transactions must be an array');
  }

  const expensesByCategory = new Map();

  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      if (typeof transaction.category !== 'string' || !transaction.category.trim()) {
        throw new TypeError('expense transaction category is required');
      }
      assertFiniteNumber(transaction.amount, 'transaction amount');

      const category = transaction.category.trim();
      if (!expensesByCategory.has(category)) {
        expensesByCategory.set(category, []);
      }
      expensesByCategory.get(category).push(transaction);
    });

  const anomalies = [];

  expensesByCategory.forEach((categoryTransactions, category) => {
    if (categoryTransactions.length < 3) {
      return;
    }

    const amounts = categoryTransactions.map((transaction) => transaction.amount);
    const mean = amounts.reduce((total, amount) => total + amount, 0) / amounts.length;
    const variance =
      amounts.reduce((total, amount) => total + (amount - mean) ** 2, 0) /
      amounts.length;
    const standardDeviation = Math.sqrt(variance);
    const threshold = mean + 2 * standardDeviation;

    categoryTransactions.forEach((transaction) => {
      if (transaction.amount <= threshold) {
        return;
      }

      const percentAboveMean =
        mean === 0 ? 100 : Math.round(((transaction.amount - mean) / mean) * 100);

      anomalies.push({
        ...transaction,
        isAnomaly: true,
        anomalyReason: `${percentAboveMean}% above your usual ${category} spend`,
      });
    });
  });

  return anomalies;
};

/**
 * Current category spending is compared with the average across the previous
 * N calendar months, including zero-spend months. A change of five percent or
 * less is treated as stable so small normal fluctuations do not create noise.
 * Passing referenceDate keeps the calculation deterministic; otherwise the
 * newest transaction determines which month counts as current.
 */
const calculateCategoryTrends = (
  transactions,
  monthsBack = 3,
  referenceDate
) => {
  if (!Array.isArray(transactions)) {
    throw new TypeError('transactions must be an array');
  }

  if (!Number.isInteger(monthsBack) || monthsBack <= 0) {
    throw new RangeError('monthsBack must be a positive integer');
  }

  const expenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .map((transaction) => {
      if (typeof transaction.category !== 'string' || !transaction.category.trim()) {
        throw new TypeError('expense transaction category is required');
      }
      assertFiniteNumber(transaction.amount, 'transaction amount');

      return {
        ...transaction,
        category: transaction.category.trim(),
        parsedDate: toValidDate(transaction.date, 'transaction date'),
      };
    });

  if (expenses.length === 0) {
    return [];
  }

  const anchorDate = referenceDate
    ? toValidDate(referenceDate, 'referenceDate')
    : new Date(Math.max(...expenses.map((transaction) => transaction.parsedDate.getTime())));
  const currentMonthKey = getMonthKey(anchorDate);
  const previousMonthKeys = getPreviousMonthKeys(anchorDate, monthsBack);
  const relevantMonthKeys = new Set([currentMonthKey, ...previousMonthKeys]);
  const totalsByCategory = new Map();

  expenses.forEach((transaction) => {
    const month = getMonthKey(transaction.parsedDate);
    if (!relevantMonthKeys.has(month)) {
      return;
    }

    if (!totalsByCategory.has(transaction.category)) {
      totalsByCategory.set(transaction.category, new Map());
    }

    const monthlyTotals = totalsByCategory.get(transaction.category);
    monthlyTotals.set(
      month,
      (monthlyTotals.get(month) || 0) + transaction.amount
    );
  });

  return Array.from(totalsByCategory.entries())
    .map(([category, monthlyTotals]) => {
      const currentMonth = monthlyTotals.get(currentMonthKey) || 0;
      const previousTotal = previousMonthKeys.reduce(
        (total, month) => total + (monthlyTotals.get(month) || 0),
        0
      );
      const previousAvg = previousTotal / monthsBack;
      const percentChange =
        previousAvg === 0
          ? currentMonth === 0
            ? 0
            : 100
          : ((currentMonth - previousAvg) / previousAvg) * 100;
      const trend =
        Math.abs(percentChange) <= 5
          ? 'stable'
          : percentChange > 0
            ? 'up'
            : 'down';

      return {
        category,
        currentMonth: roundToTwoDecimals(currentMonth),
        previousAvg: roundToTwoDecimals(previousAvg),
        percentChange: roundToTwoDecimals(percentChange),
        trend,
      };
    })
    .sort((first, second) => first.category.localeCompare(second.category));
};

/**
 * A healthy score rewards savings and penalizes avoidable subscriptions and
 * unpredictable spending. Inputs are ratios (0.20 means 20%). Each becomes a
 * 0-100 component, then savings receives 40% weight and the two risk measures
 * receive 30% each. The breakdown includes raw percentages and earned points.
 */
const calculateHealthScore = ({
  savingsRate,
  subscriptionWastePercent,
  spendingVolatility,
}) => {
  assertFiniteNumber(savingsRate, 'savingsRate');
  assertFiniteNumber(subscriptionWastePercent, 'subscriptionWastePercent');
  assertFiniteNumber(spendingVolatility, 'spendingVolatility');

  const normalizedSavingsRate = clamp(savingsRate * 100, 0, 100);
  const normalizedWastePercent = clamp(subscriptionWastePercent * 100, 0, 100);
  const normalizedVolatility = clamp(spendingVolatility * 100, 0, 100);

  const breakdown = {
    savingsRate: { value: roundToTwoDecimals(normalizedSavingsRate), weightedScore: roundToTwoDecimals(normalizedSavingsRate * 0.4) },
    subscriptionWastePercent: { value: roundToTwoDecimals(normalizedWastePercent), weightedScore: roundToTwoDecimals((100 - normalizedWastePercent) * 0.3) },
    spendingVolatility: { value: roundToTwoDecimals(normalizedVolatility), weightedScore: roundToTwoDecimals((100 - normalizedVolatility) * 0.3) },
  };
  // Sum the displayed contributions so they reconcile exactly with the score.
  const score = Object.values(breakdown).reduce((total, component) => total + component.weightedScore, 0);
  return { score: roundToTwoDecimals(clamp(score, 0, 100)), breakdown };
};

// Match the API's UTC calendar month and exclude future-dated entries.
const calculateSpendingMix = (transactions, referenceDate = new Date()) => {
  if (!Array.isArray(transactions)) throw new TypeError('transactions must be an array');
  const now = toValidDate(referenceDate, 'referenceDate');
  const month = getMonthKey(now);
  const totals = new Map();
  for (const transaction of transactions) {
    if (transaction.type !== 'expense') continue;
    const date = toValidDate(transaction.date, 'transaction date');
    if (getMonthKey(date) !== month || date > now) continue;
    assertFiniteNumber(transaction.amount, 'transaction amount');
    if (transaction.amount <= 0) continue;
    if (typeof transaction.category !== 'string' || !transaction.category.trim()) throw new TypeError('expense transaction category is required');
    const category = transaction.category.trim();
    totals.set(category, (totals.get(category) || 0) + transaction.amount);
  }
  const total = Array.from(totals.values()).reduce((sum, amount) => sum + amount, 0);
  return Array.from(totals, ([category, amount]) => ({ category, amount: roundToTwoDecimals(amount), percent: roundToTwoDecimals(amount / total * 100) }))
    .sort((first, second) => second.amount - first.amount || first.category.localeCompare(second.category));
};

module.exports = {
  calculateSpendingMix,
  detectAnomalies,
  calculateCategoryTrends,
  calculateHealthScore,
};

