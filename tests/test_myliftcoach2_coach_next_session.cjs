const test=require('node:test'),assert=require('node:assert/strict');
const {prescribe}=require('../myliftcoach2/coach-next-session.js');
const today={status:'scheduled',title:'Custom Day',items:[{id:'leg-press',name:'Leg Press',personalTarget:170},{id:'seated-row',name:'Seated Row',personalTarget:null}]};
const adaptive={status:'scheduled',items:[{exerciseId:'leg-press',status:'hold',weight:165,source:'2.0 history',reason:'Build reps'},
 {exerciseId:'seated-row',status:'learning',weight:null,reason:'Insufficient evidence'}]};
test('preserves custom order and distinguishes personal target from optional working weight',()=>{
 const before=JSON.stringify({today,adaptive}),p=prescribe({today,adaptive});
 assert.equal(p.status,'scheduled');assert.deepEqual(p.items.map(x=>x.exerciseId),['leg-press','seated-row']);
 assert.equal(p.items[0].weight,165);assert.equal(p.items[0].personalTarget,170);
 assert.deepEqual(p.items[0].reps,{min:8,max:10});
 assert.equal(p.items[0].warmups.length,3);
 assert.equal(p.items[1].weight,null);assert.equal(p.items[1].warmups.length,0);
 assert.equal(JSON.stringify({today,adaptive}),before);
});
test('paused increase never becomes an actionable prescription',()=>{
 const cautious={...adaptive,items:[{...adaptive.items[0],status:'review-increase',weight:null},adaptive.items[1]]};
 const p=prescribe({today,adaptive:cautious});
 assert.equal(p.items[0].weight,null);assert.equal(p.items[0].warmups.length,0);
 assert.match(p.items[0].warning,/paused/);
});
test('dismissal remains visible but never automatically applies the saved weight',()=>{
 const sig=JSON.stringify(['leg-press','hold',165,'2.0 history']);
 const p=prescribe({today,adaptive,decisions:[{signature:sig,choice:'dismissed'}]});
 assert.equal(p.items[0].decision,'dismissed');assert.match(p.items[0].warning,/dismissed/);
 assert.equal(p.items[0].requiresManualUse,true);
});
test('rest, stale schedule and swapped exercise IDs fail closed',()=>{
 assert.equal(prescribe({today:{status:'rest',items:[]},adaptive:{status:'rest',items:[]}}).status,'rest');
 const swapped={...adaptive,items:[adaptive.items[1],adaptive.items[0]]};
 assert.equal(prescribe({today,adaptive:swapped}).status,'invalid');
});
