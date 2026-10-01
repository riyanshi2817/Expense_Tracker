import test from 'node:test'
import assert from 'node:assert/strict'
import { validAmount, validDate, validEmail, validateEntry, apiError } from './validation.js'

test('amount validation rejects empty, nonfinite and negative amounts but allows a zero goal balance', () => {
  for (const value of ['', ' ', '-1', 'NaN', 'Infinity', '0']) assert.equal(validAmount(value), false)
  assert.equal(validAmount('0', 0), true)
  assert.equal(validAmount('0.01'), true)
})
test('email and date validation reject malformed addresses and impossible calendar dates', () => {
  assert.equal(validEmail('test@example.com'), true)
  for (const value of ['bad', 'bad@host', 'a b@host.com']) assert.equal(validEmail(value), false)
  assert.equal(validDate('2024-02-29'), true)
  for (const value of ['', '2026-02-29', '2026-13-01']) assert.equal(validDate(value), false)
})
test('transaction validation checks amount, date, category and type', () => {
  assert.equal(Object.keys(validateEntry('transaction', {amount:'',date:'',category:' ',type:'other'})).length, 4)
  assert.deepEqual(validateEntry('transaction', {amount:12,date:'2026-09-29',category:'Food',type:'expense'}), {})
})
test('subscription validation checks required values and enum choices', () => {
  assert.equal(Object.keys(validateEntry('subscription', {amount:-1,nextDueDate:'',name:' ',status:'other',billingCycle:'weekly'})).length, 5)
})
test('API errors expose field messages, timeout and expired sessions', () => {
  assert.equal(apiError({response:{data:{errors:['Name required','Amount required']}}}), 'Name required. Amount required')
  assert.match(apiError({code:'ECONNABORTED'}), /too long/)
  assert.match(apiError({response:{status:401}}), /session expired/)
})
