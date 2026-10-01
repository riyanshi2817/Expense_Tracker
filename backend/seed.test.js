const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDemoData } = require('./seed');
const { detectAnomalies } = require('./utils/analyticsEngine');

test('demo history covers 90 days, diverse categories, mixed subscriptions and achievable goals', () => {
  const now = new Date('2026-09-29T12:00:00Z');
  const data = buildDemoData(now);
  assert.ok(data.transactions.length > 90);
  assert.ok(new Set(data.transactions.map(item => item.category)).size >= 6);
  assert.ok(data.transactions.every(item => item.amount > 0 && item.date <= now && item.date >= new Date('2026-07-02T00:00:00Z')));
  assert.deepEqual(new Set(data.subscriptions.map(item => item.status)), new Set(['active', 'unused']));
  assert.equal(data.goals.length, 2);
  assert.ok(data.goals.every(item => item.currentAmount < item.targetAmount));
  assert.ok(detectAnomalies(data.transactions).some(item => item.description === 'Celebration dinner (demo)'));
});

test('seed dates are deterministic across reruns, leap years and year boundaries', () => {
  for (const date of ['2026-01-01T12:00:00Z','2024-03-01T12:00:00Z']) {
    const now = new Date(date);
    assert.deepEqual(buildDemoData(now), buildDemoData(now));
    assert.ok(buildDemoData(now).transactions.every(item => Number.isFinite(item.date.getTime()) && item.date <= now));
  }
});


test('seed reruns preserve existing rows and reject unrelated accounts (mocked database)', async () => {
  const { mock } = require('node:test');
  const mongoose = require('mongoose');
  const bcrypt = require('bcrypt');
  const { seed } = require('./seed');
  const User = require('./models/User');
  const Transaction = require('./models/Transaction');
  const Subscription = require('./models/Subscription');
  const Goal = require('./models/Goal');
  const previousEmail = process.env.DEMO_EMAIL;
  const previousPassword = process.env.DEMO_PASSWORD;
  const previousUri = process.env.MONGO_URI;
  process.env.DEMO_EMAIL = 'test@clearcash.example';
  process.env.DEMO_PASSWORD = 'test-password';
  process.env.MONGO_URI = 'mongodb://unused-in-this-test';
  const user = { _id: new mongoose.Types.ObjectId(), name: 'Aarav (Demo)', password: await bcrypt.hash('test-password', 4) };
  const transactions = new Map();
  const collections = new Map([[Subscription, new Map()], [Goal, new Map()]]);
  mock.method(mongoose, 'connect', async () => {});
  mock.method(mongoose, 'disconnect', async () => {});
  mock.method(User, 'findOne', async () => user);
  mock.method(Transaction, 'updateOne', async (filter, update) => {
    const key = JSON.stringify(filter);
    if (!transactions.has(key)) {
      const doc = new Transaction(update.$setOnInsert);
      await doc.validate(); transactions.set(key, doc);
    }
  });
  for (const [Model, records] of collections) {
    mock.method(Model, 'findOne', async filter => records.get(filter.name));
    mock.method(Model, 'create', async value => {
      const doc = new Model(value); await doc.validate(); records.set(value.name, doc); return doc;
    });
  }
  try {
    await seed();
    const originalSize = transactions.size;
    const first = transactions.values().next().value; first.amount = 123;
    await seed();
    assert.equal(transactions.size, originalSize);
    assert.equal(transactions.values().next().value.amount, 123);
    assert.equal(collections.get(Subscription).size, 4);
    assert.equal(collections.get(Goal).size, 2);
    user.name = 'Unrelated user';
    await assert.rejects(seed(), /existing account/);
    assert.equal(transactions.size, originalSize);
  } finally {
    mock.restoreAll();
    for (const [key, value] of [['DEMO_EMAIL', previousEmail], ['DEMO_PASSWORD', previousPassword], ['MONGO_URI', previousUri]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
