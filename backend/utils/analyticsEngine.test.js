const test = require('node:test');
const assert = require('node:assert/strict');

const {
  detectAnomalies,
  calculateCategoryTrends,
  calculateHealthScore,
} = require('./analyticsEngine');

test('detectAnomalies flags a large category expense', () => {
  const usualFoodExpenses = Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    category: 'Food',
    amount: 10,
    type: 'expense',
  }));
  const transactions = [
    ...usualFoodExpenses,
    { id: 11, category: 'Food', amount: 100, type: 'expense' },
  ];

  const anomalies = detectAnomalies(transactions);

  assert.equal(anomalies.length, 1);
  assert.equal(anomalies[0].id, 11);
  assert.equal(anomalies[0].isAnomaly, true);
  assert.match(anomalies[0].anomalyReason, /above your usual Food spend/);
});

test('detectAnomalies ignores income and categories with too little data', () => {
  const transactions = [
    { id: 1, category: 'Travel', amount: 10, type: 'expense' },
    { id: 2, category: 'Travel', amount: 1000, type: 'expense' },
    { id: 3, category: 'Salary', amount: 100000, type: 'income' },
  ];

  assert.deepEqual(detectAnomalies(transactions), []);
});

test('calculateCategoryTrends identifies up, down, and stable categories', () => {
  const transactions = [];

  for (const month of ['01', '02', '03']) {
    transactions.push(
      { date: `2026-${month}-10`, category: 'Food', amount: 100, type: 'expense' },
      { date: `2026-${month}-10`, category: 'Rent', amount: 1000, type: 'expense' },
      { date: `2026-${month}-10`, category: 'Travel', amount: 100, type: 'expense' }
    );
  }

  transactions.push(
    { date: '2026-04-10', category: 'Food', amount: 120, type: 'expense' },
    { date: '2026-04-10', category: 'Rent', amount: 1030, type: 'expense' },
    { date: '2026-04-10', category: 'Travel', amount: 50, type: 'expense' }
  );

  const trends = calculateCategoryTrends(
    transactions,
    3,
    new Date('2026-04-20T00:00:00.000Z')
  );

  assert.equal(trends.find((item) => item.category === 'Food').trend, 'up');
  assert.equal(trends.find((item) => item.category === 'Rent').trend, 'stable');
  assert.equal(trends.find((item) => item.category === 'Travel').trend, 'down');
  assert.equal(trends.find((item) => item.category === 'Food').percentChange, 20);
});

test('calculateCategoryTrends includes zero-spend previous months', () => {
  const trends = calculateCategoryTrends(
    [{ date: '2026-04-01', category: 'Gifts', amount: 90, type: 'expense' }],
    3,
    new Date('2026-04-20T00:00:00.000Z')
  );

  assert.deepEqual(trends, [
    {
      category: 'Gifts',
      currentMonth: 90,
      previousAvg: 0,
      percentChange: 100,
      trend: 'up',
    },
  ]);
});

test('calculateHealthScore applies the requested weights', () => {
  const result = calculateHealthScore({
    savingsRate: 0.2,
    subscriptionWastePercent: 0.1,
    spendingVolatility: 0.2,
  });

  assert.equal(result.score, 59);
  assert.deepEqual(result.breakdown, {
    savingsRate: { value: 20, weightedScore: 8 },
    subscriptionWastePercent: { value: 10, weightedScore: 27 },
    spendingVolatility: { value: 20, weightedScore: 24 },
  });
});

test('calculateHealthScore clamps extreme inputs to a valid score', () => {
  const result = calculateHealthScore({
    savingsRate: 5,
    subscriptionWastePercent: -1,
    spendingVolatility: -2,
  });

  assert.equal(result.score, 100);
  assert.ok(result.score >= 0 && result.score <= 100);
});



test('weighted health components expose points and reconcile with the final score', () => {
  const result = calculateHealthScore({ savingsRate: 0.71, subscriptionWastePercent: 0.12345, spendingVolatility: 0.34567 });
  assert.equal(result.breakdown.savingsRate.weightedScore, 28.4);
  const sum = Object.values(result.breakdown).reduce((total, component) => total + component.weightedScore, 0);
  assert.equal(Number(sum.toFixed(2)), result.score);
  assert.ok(result.breakdown.subscriptionWastePercent.weightedScore <= 30);
  assert.ok(result.breakdown.spendingVolatility.weightedScore <= 30);
});


test('spending mix includes only current-month expenses through today, sorted by amount', () => {
  const { calculateSpendingMix } = require('./analyticsEngine');
  const records = [
    { date: '2026-01-02', category: 'Food', type: 'expense', amount: 100 },
    { date: '2026-01-03', category: ' Food ', type: 'expense', amount: 50 },
    { date: '2026-01-04', category: 'Rent', type: 'expense', amount: 450 },
    { date: '2025-12-31', category: 'Old', type: 'expense', amount: 999 },
    { date: '2026-01-30', category: 'Future', type: 'expense', amount: 999 },
    { date: '2026-01-01', category: 'Salary', type: 'income', amount: 9000 },
  ];
  assert.deepEqual(calculateSpendingMix(records, new Date('2026-01-15')), [
    { category: 'Rent', amount: 450, percent: 75 },
    { category: 'Food', amount: 150, percent: 25 },
  ]);
  assert.deepEqual(calculateSpendingMix([], new Date('2026-01-15')), []);
  assert.deepEqual(calculateSpendingMix([{ date: '2026-01-01', category: 'Zero', type: 'expense', amount: 0 }], new Date('2026-01-15')), []);
});
