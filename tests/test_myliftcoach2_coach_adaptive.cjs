const test=require('node:test'),assert=require('node:assert/strict');
const {compile}=require('../myliftcoach2/coach-adaptive.js');
const today={status:'scheduled',items:[{id:'leg-press',name:'Leg Press',status:'ready',action:'increase',weight:165,reason:'Top of rep range',source:'local',personalTarget:175}]};
test('preserves exact custom exercise and only proposes a weight for explicit use',()=>{
 const before=JSON.stringify(today),p=compile({today,checkin:{load:'normal'}});
 assert.equal(p.status,'scheduled');assert.equal(p.items[0].exerciseId,'leg-press');
 assert.equal(p.items[0].weight,165);assert.equal(p.items[0].personalTarget,175);
 assert.equal(p.items[0].requiresApproval,true);assert.equal(JSON.stringify(today),before);
});
test('conservative weekly check-in suppresses increase but does not alter personal target',()=>{
 const p=compile({today,checkin:{load:'conservative'}});
 assert.equal(p.items[0].status,'review-increase');assert.equal(p.items[0].weight,null);assert.equal(p.items[0].personalTarget,175);
});
test('repeated worse rated outcomes suppress only affected exercise',()=>{
 const more={status:'scheduled',items:[...today.items,{id:'seated-row',name:'Row',status:'ready',action:'increase',weight:95}]};
 const p=compile({today:more,checkin:{load:'normal'},memories:{'leg-press':{signal:'review'}}});
 assert.equal(p.items[0].weight,null);assert.equal(p.items[1].weight,95);
});
test('rest day and missing exercise cannot invent a replacement',()=>{
 assert.equal(compile({today:{status:'rest',items:[]}}).items.length,0);
 const p=compile({today:{status:'scheduled',items:[{id:'deleted',status:'unavailable'}]}});
 assert.equal(p.items[0].status,'verify-exercise');assert.equal(p.items[0].weight,null);
});
test('insufficient evidence and malformed suggestions do not produce loads',()=>{
 const p=compile({today:{status:'scheduled',items:[{id:'a',status:'insufficient'},{id:'b',status:'ready',action:'increase',weight:Infinity}]}});
 assert.deepEqual(p.items.map(x=>x.weight),[null,null]);
});
