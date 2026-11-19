const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../myliftcoach2/coach-checkin.js');
const mk=()=>{const records=new Map();return {getItem:k=>records.get(k)||null,setItem:(k,v)=>records.set(k,v),dump:()=>records}};
const now=Date.parse('2026-11-19T12:00:00Z');
const values={recovery:'good',energy:'normal',difficulty:'right',days:4,limitations:''};
test('saves one account-scoped check-in per week and overwrites only same-week row',()=>{
 const store=mk();api.save(store,'user1',values,now);
 assert.equal(api.current(store,'user1',now).days,4);
 assert.equal(api.current(store,'user2',now),null);
 api.save(store,'user1',{...values,days:3},now);
 assert.equal(api.read(store,'user1').length,1);
 assert.equal(api.current(store,'user1',now).days,3);
});
test('a low-energy or hard week yields conservative context without changing a workout',()=>{
 const store=mk(),plan={id:'a',ids:['leg-press']},before=JSON.stringify(plan);
 const row=api.save(store,'guest',{...values,energy:'low'},now);
 assert.equal(api.signal(row).load,'conservative');assert.equal(JSON.stringify(plan),before);
});
test('check-in never infers positive readiness from missing data',()=>assert.equal(api.signal(null).load,'unknown'));
test('bad stored history blocks overwrites',()=>{
 const store=mk();store.setItem(api.key('guest'),'{');
 assert.throws(()=>api.save(store,'guest',values,now),/recovery/);
 assert.equal(store.getItem(api.key('guest')),'{');
});
test('invalid check-in choices are rejected',()=>{
 const store=mk();assert.throws(()=>api.save(store,'guest',{...values,days:8},now));
 assert.throws(()=>api.save(store,'guest',{...values,recovery:'unknown'},now));
});
