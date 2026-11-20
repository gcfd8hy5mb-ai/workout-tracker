const test=require('node:test');
const assert=require('node:assert/strict');
const {access,verifiedTier}=require('../myliftcoach2/coach-entitlement-boundary.js');

test('matches original MYLIFTCOACH beta: Free and Pro preview without a Supabase grant',()=>{
 const owner='existing-account';
 const user={id:owner,app_metadata:{}};
 assert.deepEqual(
  [access(user,owner,null),access(user,owner,'free'),access(user,owner,'pro')].map(x=>x.effectiveTier),
  ['free','free','pro']);
 assert.equal(access(user,owner,'pro').beta,true);
 assert.equal(access(null,null,'pro').effectiveTier,'pro','guest can preview Pro like original beta');
});

test('beta preview does not grant a verified paid subscription',()=>{
 const owner='existing-account';
 const user={id:owner,app_metadata:{}};
 const choice=access(user,owner,'pro');
 assert.equal(choice.effectiveTier,'pro');
 assert.equal(choice.paidTier,'free');
 assert.equal(verifiedTier(user,owner),'free');
 const off=access(user,owner,'pro',false);
 assert.equal(off.beta,false);
 assert.equal(off.mode,null);
 assert.equal(off.effectiveTier,'free','turning off beta previews restores server-verified tier');
});

test('beta previews also simulate Free for paid users without downgrading actual entitlement',()=>{
 const owner='paid-account';
 const paid={id:owner,app_metadata:{myliftcoach_entitlement:{tier:'lifetime_pro'}}};
 assert.equal(access(paid,owner,'free').effectiveTier,'free');
 assert.equal(access(paid,owner,'free').paidTier,'lifetime_pro');
 assert.equal(access(paid,owner,'pro').effectiveTier,'pro');
 assert.equal(access(paid,owner,'free',false).effectiveTier,'lifetime_pro');
});

test('beta invalid preferences always default Free; user metadata is not a trusted grant',()=>{
 const owner='existing-account',user={id:owner,user_metadata:{myliftcoach_entitlement:{tier:'pro'}}};
 assert.equal(access(user,owner,'lifetime_pro').effectiveTier,'free');
 assert.equal(access(user,owner,'bogus').effectiveTier,'free');
 assert.equal(access(user,owner,'pro',false).paidTier,'free');
});
