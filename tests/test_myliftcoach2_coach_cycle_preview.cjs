const test=require('node:test'),assert=require('node:assert/strict');
const {guidance}=require('../myliftcoach2/coach-cycle-preview.js');
const NOW=Date.parse('2026-11-19T18:00:00Z');
const scheduled={status:'scheduled',title:'Custom Upper',items:[{id:'leg-press'}]};
test('active local workout takes precedence and counts only valid working sets',()=>{
 const session={startedAt:NOW-1000,sets:[{exerciseId:'leg-press',weight:100,reps:8},{exerciseId:'leg-press',weight:0,reps:8}]};
 const out=guidance({today:scheduled,activeSession:session,checkin:{load:'conservative'},now:NOW});
 assert.equal(out.phase,'during');assert.match(out.message,/1 qualifying/);assert.match(out.message,/caution/);
});
test('just completed workout produces post-session guide',()=>{
 const out=guidance({lastSession:{created:'2026-11-19T16:00:00Z',title:'Custom Upper'},now:NOW});
 assert.equal(out.phase,'after');assert.match(out.message,/Custom Upper/);
});
test('missing check-in produces weekly state instead of invented recovery',()=>{
 const out=guidance({today:scheduled,now:NOW});
 assert.equal(out.phase,'weekly');assert.match(out.why,/will not infer/);
});
test('rest day with check-in does not invent a preset',()=>{
 const out=guidance({today:{status:'rest',items:[]},checkin:{status:'recorded',load:'normal'},now:NOW});
 assert.equal(out.phase,'before');assert.match(out.message,/no(t)?( select)? a replacement preset/i);
});
test('assigned custom plan is preserved and outputs are read-only',()=>{
 const before=JSON.stringify(scheduled);
 const out=guidance({today:scheduled,checkin:{status:'recorded',load:'normal'},now:NOW});
 assert.equal(out.phase,'before');assert.match(out.message,/Custom Upper/);
 assert.equal(out.readOnly,true);assert.equal(JSON.stringify(scheduled),before);
});
