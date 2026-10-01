const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const { resolveNotificationPrefs } = require('../utils/notificationPreferences');
const { getSubscriptionsDueSoon } = require('./subscriptionController');
const { getDashboardAnalytics } = require('./analyticsController');
const { updateCurrentUser } = require('./userController');
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

test('saved legacy opt-outs and new keys resolve correctly', () => {
  assert.equal(resolveNotificationPrefs({dueDateReminders:false}).dueDateAlerts, false);
  assert.equal(resolveNotificationPrefs({anomalyAlerts:false}).unusualSpendingAlerts, false);
  assert.equal(resolveNotificationPrefs({dueDateAlerts:true,dueDateReminders:false}).dueDateAlerts, true);
});

test('due-soon suppresses records when disabled and returns sorted debits when enabled', async () => {
  const user = {notificationPrefs:{dueDateAlerts:false}};
  mock.method(User, 'findById', () => ({ select: () => ({ lean: async () => user }) }));
  const query = mock.method(Subscription, 'find', () => ({ sort: async (sort) => { assert.deepEqual(sort, {nextDueDate:1}); return [{name:'Music'}]; } }));
  try {
    let res = response(); await getSubscriptionsDueSoon({userId:'user1'},res);
    assert.deepEqual(res.body, {count:0,subscriptions:[],enabled:false}); assert.equal(query.mock.callCount(),0);
    user.notificationPrefs.dueDateAlerts = true;
    res = response(); await getSubscriptionsDueSoon({userId:'user1'},res);
    assert.equal(res.body.subscriptions.length,1); assert.equal(res.body.enabled,true);
    assert.equal(query.mock.calls[0].arguments[0].userId,'user1');
  } finally { mock.restoreAll(); }
});

test('analytics gates anomalies and weekly digest independently while retaining other analytics', async () => {
  const user = {notificationPrefs:{unusualSpendingAlerts:false,weeklySummary:false}};
  const date = new Date();
  const transactions = Array.from({length:10}, () => ({date,type:'expense',category:'Food',amount:10}));
  transactions.push({date,type:'expense',category:'Food',amount:1000});
  mock.method(User, 'findById', () => ({select: () => ({lean: async () => user})}));
  mock.method(Transaction, 'find', () => ({lean: async () => transactions}));
  mock.method(Subscription, 'find', () => ({lean: async () => []}));
  try {
    let res = response(); await getDashboardAnalytics({userId:'user1'},res);
    assert.deepEqual(res.body.anomalies,[]); assert.equal(res.body.weeklyDigest,null); assert.equal(res.body.spendingMix[0].amount,1100);
    user.notificationPrefs.unusualSpendingAlerts=true; user.notificationPrefs.weeklySummary=true;
    res=response(); await getDashboardAnalytics({userId:'user1'},res);
    assert.equal(res.body.anomalies.length,1); assert.equal(res.body.weeklyDigest.expense,1100); assert.equal(res.body.weeklyDigest.transactionCount,11);
  } finally { mock.restoreAll(); }
});

test('profile saves each canonical preference and keeps legacy keys synchronized', async () => {
  let saves=0;
  const user={notificationPrefs:{dueDateReminders:true,anomalyAlerts:true,weeklySummary:true},save:async()=>{saves++;}};
  mock.method(User,'findById',async()=>user);
  try {
    for (const key of ['dueDateAlerts','unusualSpendingAlerts','weeklySummary']) {
      const res=response(); await updateCurrentUser({userId:'user1',body:{notificationPrefs:{[key]:false}}},res);
      assert.equal(res.code,200); assert.equal(res.body.user.notificationPrefs[key],false);
    }
    assert.equal(saves,3); assert.equal(user.notificationPrefs.dueDateReminders,false); assert.equal(user.notificationPrefs.anomalyAlerts,false);
    const res=response(); await updateCurrentUser({userId:'user1',body:{notificationPrefs:{dueDateReminders:true}}},res);
    assert.equal(res.body.user.notificationPrefs.dueDateAlerts,true);
    assert.equal(res.body.user.notificationPrefs.unusualSpendingAlerts,false);
  } finally { mock.restoreAll(); }
});


test('subscription summary API stays user-scoped and preserves the legacy response fields', async () => {
  const { getSubscriptionWaste } = require('./subscriptionController');
  const id = '507f1f77bcf86cd799439011';
  mock.method(Subscription,'find',filter=>{
    assert.deepEqual(filter,{userId:id});
    return {lean:async()=>[
      {amount:1200,billingCycle:'yearly',status:'active'},
      {amount:50,billingCycle:'monthly',status:'unused'},
    ]};
  });
  try {
    const res=response();await getSubscriptionWaste({userId:id},res);
    assert.equal(res.code,200);
    assert.deepEqual(res.body,{totalMonthlyRecurring:150,monthlyWaste:50,potentialSavings:50,totalMonthlyCost:50,unusedSubscriptionCount:1});
  } finally {mock.restoreAll();}
});
