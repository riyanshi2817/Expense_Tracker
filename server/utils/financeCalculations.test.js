const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateSpendable,
  calculateDaysLeftInMonth,
  calculateSafeToSpend,
  calculateMonthlyWaste,
  calculateCashFlow,
} = require('./financeCalculations');

test('calculateSpendable subtracts fixed commitments from salary', () => {
  assert.equal(calculateSpendable(5000, 1800), 3200);
  assert.equal(calculateSpendable(1000, 1200), -200);
});

test('calculateSpendable rejects non-numeric input', () => {
  assert.throws(() => calculateSpendable('5000', 1000), TypeError);
});

test('calculateDaysLeftInMonth includes today', () => {
  assert.equal(calculateDaysLeftInMonth(new Date(2026, 7, 20)), 12);
  assert.equal(calculateDaysLeftInMonth(new Date(2026, 7, 31)), 1);
});

test('calculateDaysLeftInMonth handles leap years', () => {
  assert.equal(calculateDaysLeftInMonth(new Date(2024, 1, 1)), 29);
  assert.equal(calculateDaysLeftInMonth(new Date(2026, 1, 1)), 28);
});

test('calculateSafeToSpend counts only expenses', () => {
  const result = calculateSafeToSpend(
    3000,
    [
      { amount: 600, type: 'expense' },
      { amount: 1000, type: 'income' },
      { amount: 300, type: 'expense' },
    ],
    7
  );

  assert.deepEqual(result, {
    safeToSpendPerDay: 300,
    remainingThisMonth: 2100,
  });
});

test('calculateSafeToSpend can return a negative daily amount', () => {
  assert.deepEqual(
    calculateSafeToSpend(500, [{ amount: 800, type: 'expense' }], 3),
    { safeToSpendPerDay: -100, remainingThisMonth: -300 }
  );
});

test('calculateMonthlyWaste normalizes yearly subscriptions', () => {
  const subscriptions = [
    { amount: 20, billingCycle: 'monthly', status: 'unused' },
    { amount: 120, billingCycle: 'yearly', status: 'unused' },
    { amount: 50, billingCycle: 'monthly', status: 'active' },
  ];

  assert.equal(calculateMonthlyWaste(subscriptions), 30);
  assert.equal(calculateMonthlyWaste([]), 0);
});

test('calculateCashFlow groups transactions and sorts oldest first', () => {
  const transactions = [
    { date: '2026-08-15T00:00:00.000Z', amount: 100, type: 'expense' },
    { date: '2026-07-01T00:00:00.000Z', amount: 2000, type: 'income' },
    { date: '2026-08-02T00:00:00.000Z', amount: 2500, type: 'income' },
    { date: '2026-07-12T00:00:00.000Z', amount: 400, type: 'expense' },
  ];

  assert.deepEqual(calculateCashFlow(transactions), [
    { month: '2026-07', income: 2000, expense: 400, net: 1600 },
    { month: '2026-08', income: 2500, expense: 100, net: 2400 },
  ]);
});

test('calculateCashFlow limits the returned month buckets', () => {
  const transactions = [
    { date: '2026-06-01', amount: 100, type: 'income' },
    { date: '2026-07-01', amount: 50, type: 'expense' },
    { date: '2026-08-01', amount: 200, type: 'income' },
  ];

  assert.deepEqual(calculateCashFlow(transactions, 2), [
    { month: '2026-07', income: 0, expense: 50, net: -50 },
    { month: '2026-08', income: 200, expense: 0, net: 200 },
  ]);
});



test('subscription summary includes all recurring costs and normalizes yearly waste', () => {
  const { calculateSubscriptionSummary } = require('./financeCalculations');
  assert.deepEqual(calculateSubscriptionSummary([
    { amount: 1200, billingCycle: 'yearly', status: 'active' },
    { amount: 250, billingCycle: 'monthly', status: 'active' },
    { amount: 600, billingCycle: 'yearly', status: 'unused' },
    { amount: 100, billingCycle: 'monthly', status: 'unused' },
  ]), { totalMonthlyRecurring: 500, monthlyWaste: 150, potentialSavings: 150 });
  assert.deepEqual(calculateSubscriptionSummary([]), { totalMonthlyRecurring: 0, monthlyWaste: 0, potentialSavings: 0 });
});
