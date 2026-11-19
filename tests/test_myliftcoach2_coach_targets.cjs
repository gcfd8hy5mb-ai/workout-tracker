const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../myliftcoach2/coach-targets.js');
const memory=()=>{const records=new Map();return {getItem:k=>records.has(k)?records.get(k):null,setItem:(k,v)=>records.set(k,v),dump:()=>records}};
test('manual target persists for its exercise and owner only',()=>{
 const store=memory();
 api.save(store,'owner-a','leg-press',165);
 assert.equal(api.get(store,'owner-a','leg-press'),165);
 assert.equal(api.get(store,'owner-b','leg-press'),null);
 assert.equal(api.get(store,'owner-a','seated-row'),null);
});
test('manual target can be changed and cleared without affecting other exercises',()=>{
 const store=memory();api.save(store,'guest','leg-press',140);api.save(store,'guest','seated-row',100);
 api.save(store,'guest','leg-press',145);
 api.clear(store,'guest','leg-press');
 assert.equal(api.get(store,'guest','leg-press'),null);
 assert.equal(api.get(store,'guest','seated-row'),100);
});
test('bad stored data blocks writes instead of silently resetting history',()=>{
 const store=memory(),key=api.key('guest');
 store.setItem(key,'broken JSON');
 const before=store.getItem(key);
 assert.throws(()=>api.save(store,'guest','leg-press',100),/cannot be read/);
 assert.equal(store.getItem(key),before);
});
test('invalid weights and exercise identifiers cannot modify saved targets',()=>{
 const store=memory();for(const w of [0,-3,1001,Infinity,NaN,12.3]){
  assert.throws(()=>api.save(store,'guest','leg-press',w));
 }
 assert.throws(()=>api.save(store,'guest','',100));
 assert.equal(store.getItem(api.key('guest')),null);
});
test('stored targets cannot contain invalid units or foreign owner',()=>{
 const store=memory();store.setItem(api.key('a'),JSON.stringify({version:1,owner:'b',targets:{'leg-press':100}}));
 assert.throws(()=>api.read(store,'a'),/recovery/);
});
