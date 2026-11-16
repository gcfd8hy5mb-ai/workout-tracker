const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../myliftcoach2/session-substitutions.js');
const library=[
 {id:'leg-press',name:'Leg Press',muscle:'Quads'},
 {id:'leg-extension',name:'Leg Extension',muscle:'Quads'},
 {id:'squat',name:'Squat',muscle:'Quads'},
 {id:'row',name:'Seated Row',muscle:'Back'}
];
test('only unused same-muscle exercises can replace current movement',()=>{
 const list=api.alternatives('leg-press',['leg-press','squat'],library);
 assert.deepEqual(list.map(x=>x.id),['leg-extension']);
 assert.deepEqual(api.alternatives('row',['row'],library),[]);
});
test('replacement without logged sets changes only current session plan',()=>{
 const plan={id:'my-day',title:'My Day',ids:['leg-press','row']};
 const before=JSON.stringify(plan),result=api.replace(plan,[],'leg-press','leg-extension',library);
 assert.deepEqual(result.plan.ids,['leg-extension','row']);
 assert.equal(result.retainedOriginal,false);
 assert.equal(JSON.stringify(plan),before);
});
test('replacing after logging sets retains original movement and all recorded sets',()=>{
 const plan={id:'my-day',title:'My Day',ids:['leg-press','row']};
 const sets=[{exerciseId:'leg-press',weight:200,reps:8},{exerciseId:'row',weight:90,reps:10}];
 const before=JSON.stringify({plan,sets});
 const result=api.replace(plan,sets,'leg-press','leg-extension',library);
 assert.equal(result.retainedOriginal,true);
 assert.deepEqual(result.plan.ids,['leg-press','leg-extension','row']);
 assert.deepEqual(result.retainedSets,sets);
 assert.equal(JSON.stringify({plan,sets}),before);
});
test('invalid replacements reject with no mutation',()=>{
 const plan={id:'my-day',ids:['leg-press','row']},sets=[{exerciseId:'leg-press',weight:80,reps:10}];
 const prior=JSON.stringify({plan,sets});
 assert.throws(()=>api.replace(plan,sets,'leg-press','row',library),/same muscle/);
 assert.throws(()=>api.replace({...plan,ids:['leg-press','squat','row']},sets,'leg-press','squat',library),/duplicate/);
 assert.equal(JSON.stringify({plan,sets}),prior);
});
