const test=require('node:test'),assert=require('node:assert/strict');
const m=require('../myliftcoach2/local-daily-tracking.js');
function storage(){const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),data};}
test('water ounces convert to original-compatible milliliters without affecting other days',()=>{
 const s=storage(),day='2026-11-16',water=m.waterMl(8,'oz');
 assert.equal(water,237);
 m.add(s,'user-a','water',{id:'a1',day,amount:water});
 m.add(s,'user-a','water',{id:'a2',day:'2026-11-15',amount:250});
 assert.equal(m.summarize(m.read(s,'user-a'),day).waterMl,237);
 assert.equal(m.read(s,'user-b').water.length,0);
 assert.equal(m.read(s,'guest').water.length,0);
});
test('food calories macros with unknown nutrients are not inferred',()=>{
 const s=storage(),day='2026-11-16';
 m.add(s,'user-a','food',{id:'f1',day,name:'Chicken',calories:450,protein:45,carbs:null,fat:null});
 m.add(s,'user-a','food',{id:'f2',day,name:'Coffee',calories:10,protein:null,carbs:null,fat:null});
 const summary=m.summarize(m.read(s,'user-a'),day);
 assert.equal(summary.calories,460);
 assert.deepEqual(summary.macros.protein,{knownEntries:1,total:45});
 assert.deepEqual(summary.macros.carbs,{knownEntries:0,total:0});
});
test('weight entries and remove only target entry not other records',()=>{
 const s=storage(),day='2026-11-16';
 m.add(s,'guest','weight',{id:'w1',day,value:180.5});
 m.add(s,'guest','water',{id:'water1',day,amount:250});
 assert.equal(m.summarize(m.read(s,'guest'),day).weight,180.5);
 m.remove(s,'guest','weight','w1');
 assert.equal(m.summarize(m.read(s,'guest'),day).weight,null);
 assert.equal(m.read(s,'guest').water.length,1);
});
test('invalid date, amount, calories, and malformed saved data never silently overwrite',()=>{
 const s=storage(),day='2026-11-16';
 assert.equal(m.validDay('2026-11-31'),false);
 assert.equal(m.waterMl(10000,'ml'),null);
 assert.throws(()=>m.add(s,'guest','food',{id:'bad',day,name:'Food',calories:-1}),/Invalid food/);
 assert.throws(()=>m.add(s,'guest','water',{id:'x',day:'2026-11-31',amount:250}),/Invalid tracking/);
 const k=m.key('guest');s.setItem(k,'{broken');
 assert.throws(()=>m.add(s,'guest','water',{id:'w1',day,amount:250}),/unreadable/);
 assert.equal(s.getItem(k),'{broken');
});
test('duplicate local entry id is rejected rather than hidden',()=>{
 const s=storage(),day='2026-11-16';
 m.add(s,'a','water',{id:'same',day,amount:250});
 assert.throws(()=>m.add(s,'a','weight',{id:'same',day,value:180}),/Duplicate/);
});
