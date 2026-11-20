const test=require('node:test'),assert=require('node:assert/strict');
const {review}=require('../myliftcoach2/coach-fatigue.js');
const mk=(d,w,r,done=true)=>({id:d,created:d+'T12:00:00Z',sets:[{exerciseId:'leg-press',weight:w,reps:r,completed:done},{exerciseId:'leg-press',weight:w,reps:r,completed:done}]});
const now=Date.parse('2026-11-19T12:00:00Z');
test('detects three consecutive comparable-load rep declines without medical inference',()=>{
 const r=review([mk('2026-11-17',150,6),mk('2026-11-14',150,8),mk('2026-11-11',150,10)],'leg-press',now);
 assert.equal(r.status,'review-decline');assert.equal(r.noAutomaticAdjustment,true);
});
test('weight increases or one weaker session do not create a false decline',()=>{
 assert.equal(review([mk('2026-11-17',180,6),mk('2026-11-14',160,8),mk('2026-11-11',150,10)],'leg-press',now).status,'no-repeated-decline');
 assert.equal(review([mk('2026-11-17',150,8),mk('2026-11-14',150,9),mk('2026-11-11',150,8)],'leg-press',now).status,'no-repeated-decline');
});
test('future and incomplete sessions do not count',()=>{
 const r=review([mk('2099-01-01',150,4),mk('2026-11-17',150,6,false),mk('2026-11-14',150,8)],'leg-press',now);
 assert.equal(r.status,'insufficient');
});
