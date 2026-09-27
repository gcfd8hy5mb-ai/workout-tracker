const assert = require('node:assert/strict');
const {databaseName} = require('../persistence/photo-scope.js');
const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
for (const legacy of ['workoutTrackerPhotosV1', 'prismProgressPhotosDB']) {
  assert.equal(databaseName(legacy, null), legacy, 'existing guest photos remain reachable');
  assert.notEqual(databaseName(legacy, A), legacy, 'account cannot read guest photos');
  assert.notEqual(databaseName(legacy, A), databaseName(legacy, B), 'accounts have isolated photo databases');
}
assert.throws(() => databaseName('unknown', A), /Unknown/);
assert.throws(() => databaseName('prismProgressPhotosDB', 'unverified'), /Verified/);
console.log('Photo scope preserves guest databases and isolates account A from B.');
