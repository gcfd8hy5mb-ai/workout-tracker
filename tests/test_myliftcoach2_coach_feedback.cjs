const test=require('node:test'),assert=require('node:assert/strict');
const f=require('../myliftcoach2/coach-feedback.js');
const memory=()=>{const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)}};
const action={kind:'progress',exerciseId:'leg-press',requiresExplicitAction:true};
test('records owner-isolated user response and factual counts',()=>{
 const store=memory();f.save(store,'owner-1','modified',action);
 f.save(store,'owner-1','rejected',action);
 assert.equal(f.read(store,'owner-2').length,0);
 const stats=f.summary(f.read(store,'owner-1'));
 assert.equal(stats.responses,2);assert.equal(stats.modified,1);assert.equal(stats.rejected,1);
 assert.match(stats.note,/do not prove improvement/);
});
test('rejects fabricated, malformed and unapproved actions without writes',()=>{
 const store=memory();
 assert.throws(()=>f.save(store,'guest','improved',action),/Invalid/);
 assert.throws(()=>f.save(store,'guest','followed',{kind:'progress'}),/Invalid/);
 assert.equal(store.getItem(f.key('guest')),null);
});
test('malformed stored feedback fails closed',()=>{
 const store=memory();store.setItem(f.key('guest'),'{');
 assert.throws(()=>f.save(store,'guest','followed',action),/recovery/);
 assert.equal(store.getItem(f.key('guest')),'{');
});
test('does not mutate action, session or workout plan',()=>{
 const store=memory(),plan={ids:['leg-press']},before=JSON.stringify({action,plan});
 f.save(store,'guest','followed',action);
 assert.equal(JSON.stringify({action,plan}),before);
});
