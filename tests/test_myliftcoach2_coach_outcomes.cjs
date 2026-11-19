const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../myliftcoach2/coach-outcomes.js');
const feedback={id:'cf-1770000000000-1',at:'2026-11-10T12:00:00Z',response:'modified',kind:'progress',exerciseId:'leg-press'};
const entry=(id,date,ex='leg-press')=>({id,created:date,sets:[{exerciseId:ex,weight:100,reps:8},{exerciseId:ex,weight:100,reps:9}]});
const after=entry('completed','2026-11-12T12:00:00Z'),before=entry('prior','2026-11-09T12:00:00Z');
const now=Date.parse('2026-11-19T12:00:00Z');
const memory=()=>{const map=new Map();return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v)}};
test('offers outcome only after a later completed matching exercise session',()=>{
 const options=api.candidates([feedback],[before,after],[],now);
 assert.equal(options.length,1);assert.equal(options[0].sessionId,'completed');
 assert.equal(api.qualifies(feedback,before,now),false);
});
test('incomplete, single set, other exercise or future session cannot qualify',()=>{
 const incomplete={...after,sets:after.sets.map(x=>({...x,completed:false}))};
 assert.equal(api.candidates([feedback],[incomplete],[],now).length,0);
 assert.equal(api.candidates([feedback],[{...after,sets:[after.sets[0]]}],[],now).length,0);
 assert.equal(api.candidates([feedback],[entry('other','2026-11-12T12:00:00Z','seated-row')],[],now).length,0);
 assert.equal(api.candidates([feedback],[entry('future','2099-01-01T12:00:00Z')],[],now).length,0);
});
test('saves one user-rated outcome linked to a legitimate Coach response',()=>{
 const store=memory(),candidate=api.candidates([feedback],[after],[],now)[0];
 api.save(store,'ownerA',candidate,'better',[feedback],[after],now);
 assert.equal(api.summary(api.read(store,'ownerA')).better,1);
 assert.equal(api.read(store,'ownerB').length,0);
 assert.equal(api.candidates([feedback],[after],api.read(store,'ownerA'),now).length,0);
 assert.throws(()=>api.save(store,'ownerA',candidate,'worse',[feedback],[after],now),/later completed workout/);
});
test('rejected advice cannot be rated as a followed intervention',()=>{
 const rejected={...feedback,response:'rejected'};
 assert.equal(api.candidates([rejected],[after],[],now).length,0);
});
test('malformed stored outcomes block writes',()=>{
 const store=memory();store.setItem(api.key('ownerA'),'{');
 const candidate=api.candidates([feedback],[after],[],now)[0];
 assert.throws(()=>api.save(store,'ownerA',candidate,'better',[feedback],[after],now),/recovery/);
 assert.equal(store.getItem(api.key('ownerA')),'{');
});
test('does not mutate history, feedback or training plan',()=>{
 const store=memory(),plan={ids:['leg-press']},input=JSON.stringify({feedback,after,plan});
 const candidate=api.candidates([feedback],[after],[],now)[0];
 api.save(store,'guest',candidate,'same',[feedback],[after],now);
 assert.equal(JSON.stringify({feedback,after,plan}),input);
});
