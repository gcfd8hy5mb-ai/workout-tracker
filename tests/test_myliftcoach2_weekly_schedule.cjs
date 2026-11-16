const test=require('node:test'),assert=require('node:assert/strict');
const s=require('../myliftcoach2/weekly-schedule.js');
const preset=[{id:'upper-a',title:'Upper',ids:['press']},{id:'lower-a',title:'Legs',ids:['squat']},{id:'upper-b',title:'Back',ids:['row']},{id:'lower-b',title:'Lower',ids:['squat']}];
const allowed=['press','row','squat'];
test('weekday selection is stable regardless of completed workout count',()=>{
 const state=s.normalize(null,preset,allowed);
 assert.equal(s.resolve(state,'2026-11-16T12:00:00').plan.id,'upper-a');
 assert.equal(s.resolve(state,'2026-11-17T12:00:00').plan.id,'lower-a');
 assert.equal(s.resolve(state,'2026-11-18T12:00:00').plan,null);
});
test('custom schedule overrides preset without changing preset itself',()=>{
 let state=s.normalize(null,preset,allowed);
 state=s.add(state,'custom-my-1',{title:'My Legs',ids:['squat','row']},allowed);
 state=s.assign(state,0,'custom-my-1');
 assert.equal(s.resolve(state,'2026-11-16T12:00:00').plan.title,'My Legs');
 assert.equal(state.plans.find(p=>p.id==='upper-a').title,'Upper');
});
test('editing name and exercises follows day assignment and persists',()=>{
 let state=s.normalize(null,preset,allowed);
 state=s.edit(state,'upper-a',{title:'Push Day',ids:['press','row']},allowed);
 const stored=s.saved(state,preset.map(p=>p.id));
 const restored=s.normalize(stored,preset,allowed);
 assert.equal(s.resolve(restored,'2026-11-16T12:00:00').plan.title,'Push Day');
 assert.deepEqual(restored.plans.find(x=>x.id==='upper-a').ids,['press','row']);
});
test('rest day and invalid exercise protections',()=>{
 let state=s.normalize(null,preset,allowed);
 state=s.assign(state,0,null);
 assert.equal(s.resolve(state,'2026-11-16T12:00:00').plan,null);
 assert.throws(()=>s.edit(state,'upper-a',{ids:['unknown']},allowed),/Choose at least one/);
 assert.throws(()=>s.assign(state,9,'upper-a'),/Invalid weekday/);
});
test('original workout and schedule source are not mutated',()=>{
 const state=s.normalize(null,preset,allowed),before=JSON.stringify({state,preset});
 s.assign(state,0,'lower-a');s.edit(state,'upper-a',{title:'Modified'},allowed);
 assert.equal(JSON.stringify({state,preset}),before);
});

test('rehydration never silently replaces a missing custom workout with a preset',()=>{
 const raw={plans:[],assigned:['custom-deleted-1','lower-a',null,null,null,null,null]};
 const restored=s.normalize(raw,preset,allowed);
 assert.equal(s.resolve(restored,'2026-11-16T12:00:00').plan,null);
});
test('persist then reload retains every edited custom exercise and weekday',()=>{
 let state=s.normalize(null,preset,allowed);
 state=s.add(state,'custom-week-a',{title:'Friday Glutes',ids:['squat','row']},allowed);
 state=s.assign(state,4,'custom-week-a');
 state=s.edit(state,'custom-week-a',{title:'Friday Legs',ids:['squat']},allowed);
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 const committed=s.commit(storage,'weekly',state,preset.map(p=>p.id));
 const reloaded=s.normalize(JSON.parse(storage.getItem('weekly')),preset,allowed);
 assert.equal(committed,state);
 assert.equal(s.resolve(reloaded,'2026-11-20T12:00:00').plan.title,'Friday Legs');
 assert.deepEqual(s.resolve(reloaded,'2026-11-20T12:00:00').plan.ids,['squat']);
});
test('failed browser persistence raises error and does not return new in-memory state',()=>{
 const state=s.normalize(null,preset,allowed);
 let attempted=false;
 const storage={setItem:()=>{attempted=true;throw Error('Storage full')},getItem:()=>null};
 assert.throws(()=>s.commit(storage,'weekly',s.assign(state,0,'lower-a'),preset.map(p=>p.id)),/Storage full/);
 assert.equal(attempted,true);
 assert.equal(s.resolve(state,'2026-11-16T12:00:00').plan.id,'upper-a');
});

test('account-scoped drafts never appear for a different user or guest',()=>{
 const storageData=new Map(),store={getItem:k=>storageData.get(k)??null,setItem:(k,v)=>storageData.set(k,v)};
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 let first=s.normalize(null,preset,allowed);
 first=s.add(first,'custom-owner-1',{title:'My Custom Monday',ids:['squat']},allowed);
 first=s.assign(first,0,'custom-owner-1');
 s.commitOwned(store,'weekly',a,first,preset.map(x=>x.id));
 assert.equal(s.resolve(s.loadOwned(store,'weekly',a,preset,allowed),'2026-11-16T12:00:00').plan.title,'My Custom Monday');
 assert.equal(s.resolve(s.loadOwned(store,'weekly',b,preset,allowed),'2026-11-16T12:00:00').plan.title,'Upper');
 assert.equal(s.resolve(s.loadOwned(store,'weekly',null,preset,allowed),'2026-11-16T12:00:00').plan.title,'Upper');
});
test('corrupted draft refuses silent replacement and cannot be overwritten by loading',()=>{
 const id='11111111-1111-4111-8111-111111111111',store=new Map();
 store.set(s.ownerKey('weekly',id),'{invalid-json');
 assert.throws(()=>s.loadOwned({getItem:k=>store.get(k)},'weekly',id,preset,allowed),/unreadable/);
 assert.equal(store.get(s.ownerKey('weekly',id)),'{invalid-json');
});
test('storage namespace rejects unverified owner identifiers',()=>{
 assert.throws(()=>s.ownerKey('weekly','!'),/Verified owner/);
 assert.notEqual(s.ownerKey('weekly',null),s.ownerKey('weekly','11111111-1111-4111-8111-111111111111'));
});
