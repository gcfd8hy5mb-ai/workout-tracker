const test=require('node:test'),assert=require('node:assert/strict');
const drafts=require('../myliftcoach2/session-draft.js');
function storage(){
 const values=new Map();
 return {getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,value),
  removeItem:key=>values.delete(key),values};
}
const plan=()=>({id:'my-custom',title:'My Custom',kind:'Custom',description:'Mine',ids:['leg-press','leg-curl']});
const session=()=>({readiness:'Tired',sets:[{exerciseId:'leg-press',weight:170,reps:10}]});
test('unfinished custom workout restores logged sets and readiness for the same owner',()=>{
 const db=storage(),p=plan(),s=session();
 const snapshot=JSON.stringify({p,s});
 drafts.save(db,'user-a',p,s);
 assert.deepEqual(drafts.read(db,'user-a').sets,s.sets);
 assert.equal(drafts.read(db,'user-a').readiness,'Tired');
 assert.equal(JSON.stringify({p,s}),snapshot);
 assert.equal(drafts.read(db,'user-b'),null);
 assert.equal(drafts.read(db,'guest'),null);
 drafts.clear(db,'user-a');
 assert.equal(drafts.read(db,'user-a'),null);
});
test('a corrupted draft is rejected but its original bytes are kept for recovery',()=>{
 const db=storage(),key=drafts.key('user-a');
 db.setItem(key,'{broken JSON');
 assert.throws(()=>drafts.read(db,'user-a'),/cannot be read/);
 assert.equal(db.getItem(key),'{broken JSON');
});
test('failed storage cannot falsely report a saved draft',()=>{
 const db={setItem:()=>{throw Error('Quota exceeded')},getItem:()=>null};
 assert.throws(()=>drafts.save(db,'user-a',plan(),session()),/Quota exceeded/);
});
test('wrong account, missing workout and out-of-plan sets are never restored',()=>{
 const db=storage();
 drafts.save(db,'user-a',plan(),session());
 const key=drafts.key('user-a'),old=db.getItem(key);
 db.setItem(key,JSON.stringify({...JSON.parse(old),owner:'user-b'}));
 assert.throws(()=>drafts.read(db,'user-a'),/invalid/);
 db.setItem(key,JSON.stringify({...JSON.parse(old),sets:[{exerciseId:'unknown',weight:120,reps:8}]}));
 assert.throws(()=>drafts.read(db,'user-a'),/invalid/);
 db.setItem(key,old);
 assert.deepEqual(drafts.read(db,'user-a').sets,session().sets);
});
test('saved workout draft plan is a snapshot, not an alias to editable weekly workout',()=>{
 const db=storage(),p=plan(),s=session();
 drafts.save(db,'guest',p,s);
 p.ids[0]='new-exercise';s.sets[0].weight=500;
 const restored=drafts.read(db,'guest');
 assert.deepEqual(restored.plan.ids,['leg-press','leg-curl']);
 assert.equal(restored.sets[0].weight,170);
});
