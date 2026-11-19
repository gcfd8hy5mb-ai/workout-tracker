const test=require('node:test'),assert=require('node:assert/strict');
const {answer}=require('../myliftcoach2/coach-ask.js');
const today={status:'scheduled',title:'Custom Day',items:[{id:'leg-press',name:'Leg Press',status:'ready',action:'increase',weight:165,reason:'Reached rep target',source:'2.0 completed workouts'}]};
test('answers today based only on actual resolved plan',()=>{
 const x=answer('What workout today?',{today});assert.match(x.text,/Custom Day/);assert.match(x.text,/Leg Press/);
});
test('rest day does not invent a replacement workout',()=>{
 const x=answer('Which workout today?',{today:{status:'rest',items:[]}});assert.match(x.text,/No workout/);
});
test('conservative check-in overrides aggressive textual guidance',()=>{
 const x=answer('Should I increase weight?',{today,checkin:{load:'conservative'}});
 assert.equal(x.kind,'caution');assert.match(x.text,/not be automatically applied/);
});
test('unknown exercise or no real history returns insufficient evidence',()=>{
 const x=answer('What weight for seated row?',{today:{status:'scheduled',items:[{id:'seated-row',name:'Seated Row',status:'insufficient'}]}});
 assert.equal(x.kind,'needs-data');
});
test('does not claim medical recovery from an absent check-in',()=>{
 assert.equal(answer('How is my recovery?',{checkin:{status:'missing'}}).kind,'needs-data');
});
