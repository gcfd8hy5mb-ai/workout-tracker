const test=require('node:test'),assert=require('node:assert/strict');
const {summarize}=require('../myliftcoach2/recovery-preview.js');
test('reports recency from real completed sets and explicit readiness only',()=>{
 const now=Date.parse('2026-11-16T12:00:00Z');
 const history=[{date:'2026-11-15T12:00:00Z',readiness:'Tired',exercises:[{id:'press',sets:[{weight:100,reps:10}]}]}];
 const before=JSON.stringify(history),result=summarize(history,[{id:'press',muscle:'Chest'}],now);
 assert.equal(result.muscles[0].name,'Chest');assert.equal(result.muscles[0].hoursAgo,24);
 assert.equal(result.muscles[0].within72Hours,true);assert.equal(result.recordedCheckins.Tired,1);
 assert.equal(JSON.stringify(history),before);
});
test('ignores future sessions, empty sets, and absent readiness values',()=>{
 const now=Date.parse('2026-11-16T12:00:00Z');
 const result=summarize([{date:'2026-11-18',readiness:'Great',exercises:[]},{date:'2026-11-12',exercises:[{id:'press',sets:[{weight:0,reps:10}]}]}],[{id:'press',muscle:'Chest'}],now);
 assert.equal(result.sessionCount,1);assert.equal(result.muscles.length,0);assert.equal(result.recordedCheckins.Great,0);
});

test('unfinished working sets do not imply training recency for muscle groups',()=>{
 const now=Date.parse('2026-11-16T12:00:00Z');
 const original=[{date:'2026-11-15T12:00:00Z',exercises:[{id:'press',sets:[{weight:200,reps:10,completed:false}]}]}];
 const before=JSON.stringify(original),result=summarize(original,[{id:'press',muscle:'Chest'}],now);
 assert.equal(result.muscles.length,0);
 assert.equal(JSON.stringify(original),before);
});
