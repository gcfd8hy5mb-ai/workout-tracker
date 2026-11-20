const test=require('node:test'),assert=require('node:assert/strict');
const {assess}=require('../myliftcoach2/coach-entitlement-boundary.js');
test('draft demo can preview but never grants a paid entitlement',()=>{
 const r=assess({environment:'draft'});
 assert.equal(r.previewAvailable,true);assert.equal(r.productionCoachEntitled,false);
 assert.equal(r.serverEntitlementVerified,false);
});
test('imported local Pro or lifetime values are not authorization',()=>{
 for(const localTier of ['pro','lifetime_pro','beta']){
  const r=assess({environment:'production',localTier,importedTier:'lifetime_pro',accountId:'user-1'});
  assert.equal(r.productionCoachEntitled,false);assert.equal(r.previewAvailable,false);
  assert.equal(r.ignoredLocalTier,true);
 }
});
test('unknown environment always fails closed',()=>{
 const r=assess({environment:'live',localTier:'pro'});
 assert.equal(r.productionCoachEntitled,false);assert.equal(r.environment,'production');
});
