const assert=require('node:assert/strict');
const fs=require('node:fs');
const scoped=require('../persistence/scoped-storage.js');
const {databaseName}=require('../persistence/photo-scope.js');

class MemoryStorage{
  constructor(){this.map=new Map()}
  getItem(key){return this.map.has(String(key))?this.map.get(String(key)):null}
  setItem(key,value){this.map.set(String(key),String(value))}
  removeItem(key){this.map.delete(String(key))}
  key(index){return [...this.map.keys()][index]??null}
  get length(){return this.map.size}
}

const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const backing=new MemoryStorage();
const manager=scoped.create(backing);
const storage=manager.storage;

// A -> B -> A switching must never expose another account's local fallback.
manager.select(A);
storage.setItem('workoutGoalsV1',JSON.stringify({days:4,owner:'A'}));
storage.setItem('prismRestEndsAtV1','111');
assert.equal(JSON.parse(storage.getItem('workoutGoalsV1')).owner,'A');
manager.select(B);
assert.equal(storage.getItem('workoutGoalsV1'),null,'B must not see A workout data');
storage.setItem('workoutGoalsV1',JSON.stringify({days:3,owner:'B'}));
storage.setItem('prismRestEndsAtV1','222');
assert.equal(JSON.parse(storage.getItem('workoutGoalsV1')).owner,'B');
manager.select(A);
assert.equal(JSON.parse(storage.getItem('workoutGoalsV1')).owner,'A','returning to A must restore A namespace');
assert.equal(storage.getItem('prismRestEndsAtV1'),'111','account-local transient state must also restore with A');

// A stale tab/device may read its last state but cannot overwrite current account data.
const stale=scoped.create(backing);
stale.select(A);
stale.invalidate();
assert.throws(()=>stale.storage.setItem('workoutGoalsV1','{}'),/changed in another tab/i,'stale tab write must be blocked');
assert.throws(()=>stale.storage.removeItem('workoutGoalsV1'),/changed in another tab/i,'stale tab delete must be blocked');

// Deletion propagation must create a tombstone ledger for a syncable key.
manager.select(A);
manager.recordDeletion('workoutGoalsV1');
assert.ok(Object.hasOwn(manager.deletionLedger(),'workoutGoalsV1'),'account deletion must be recorded for cloud propagation');
storage.removeItem('workoutGoalsV1');
assert.equal(storage.getItem('workoutGoalsV1'),null);

// Private progress photos must remain account-scoped across devices/accounts.
for(const legacy of ['workoutTrackerPhotosV1','prismProgressPhotosDB']){
  const guest=databaseName(legacy,null),a=databaseName(legacy,A),b=databaseName(legacy,B);
  assert.notEqual(a,guest,'signed-in A must not read guest photo DB directly');
  assert.notEqual(b,guest,'signed-in B must not read guest photo DB directly');
  assert.notEqual(a,b,'A and B photo databases must remain isolated');
}

// Release-critical cloud guards must remain present in the coordinator.
const account=fs.readFileSync('persistence/account-controller.js','utf8');
assert.match(account,/manager\.owner!==user\.id/,'connect must reject account changes during load');
assert.match(account,/session\?\.user\?\.id===userId\?session:null/,'transport session must be bound to the selected account');
assert.match(account,/manager\.owner===userId/,'restore/write paths must recheck current owner');
assert.match(account,/error\.status!==401&&error\.status!==403/,'revoked/unauthorized sessions must not retry forever');

console.log(JSON.stringify({
  suite:'MYLIFTCOACH Beta Account/Device Stress',
  checks:{
    accountSwitchABA:true,
    staleTabBlocked:true,
    deletionLedger:true,
    privatePhotoIsolation:true,
    accountOwnerGuard:true,
    revokedSessionGuard:true
  }
},null,2));
