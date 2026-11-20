const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../myliftcoach2/completed-local-history.js');
const entry=n=>({id:'demo-'+n,sets:[{exerciseId:'leg-press',weight:100,reps:8}]});
function store(value){const rows=new Map(value===undefined?[]:[['owner',JSON.stringify(value)]]);
 return {getItem:key=>rows.has(key)?rows.get(key):null,setItem:(key,value)=>rows.set(key,value)};
}
test('retains all 125 existing workouts when saving a new one',()=>{
 const old=Array.from({length:125},(_,i)=>entry(i)),storage=store(old);
 const updated=api.append(storage,'owner',api.read(storage,'owner'),entry(125));
 assert.equal(updated.length,126);assert.deepEqual(updated.at(-1),entry(124));
 assert.deepEqual(api.read(storage,'owner').map(x=>x.id),updated.map(x=>x.id));
});
test('distinct completions in the same millisecond do not collide',()=>{
 let index=0;const random={randomUUID:()=>String(++index).padStart(8,'0')+'-0000-4000-8000-000000000000'};
 const a=api.newId(random,1795200000000),b=api.newId(random,1795200000000);
 assert.notEqual(a,b);assert.match(a,/^demo-1795200000000-/);
});
test('repeated save with identical workout ID is refused without changing saved history',()=>{
 const storage=store([entry(1)]),before=storage.getItem('owner');
 assert.throws(()=>api.append(storage,'owner',api.read(storage,'owner'),entry(1)),/Duplicate/);
 assert.equal(storage.getItem('owner'),before);
});
test('stale tab cannot overwrite a newer saved workout',()=>{
 const storage=store([entry(1)]),stale=api.read(storage,'owner');
 storage.setItem('owner',JSON.stringify([entry(2),entry(1)]));
 assert.throws(()=>api.append(storage,'owner',stale,entry(3)),/another tab/);
 assert.deepEqual(api.read(storage,'owner').map(x=>x.id),['demo-2','demo-1']);
});
test('corrupt, repeated or malformed storage refuses silent replacement',()=>{
 const storage=store([entry(1),entry(1)]);
 assert.throws(()=>api.read(storage,'owner'),/duplicate/);
 const bad=store();bad.setItem('owner','not json');
 assert.throws(()=>api.read(bad,'owner'),/corrupted/);
 assert.equal(bad.getItem('owner'),'not json');
});
test('storage quota failures cannot silently drop prior sessions',()=>{
 const storage=store([entry(1)]),before=storage.getItem('owner');
 storage.setItem=()=>{throw Error('QuotaExceededError')};
 assert.throws(()=>api.append(storage,'owner',[entry(1)],entry(2)),/QuotaExceeded/);
 assert.equal(storage.getItem('owner'),before);
});
