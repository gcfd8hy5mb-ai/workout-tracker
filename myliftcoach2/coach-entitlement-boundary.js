(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachEntitlementBoundary=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function assess({environment='draft',accountId=null,localTier=null,importedTier=null}={}){
  const draft=environment==='draft';
  return Object.freeze({
   environment:draft?'draft':'production',
   previewAvailable:draft,
   productionCoachEntitled:false,
   serverEntitlementVerified:false,
   reason:draft?'Advanced Coach is an isolated draft preview. Production Pro access remains unverified.':
    'Advanced Coach is unavailable until a trusted server entitlement check is implemented.',
   ignoredLocalTier:Boolean(localTier||importedTier),
   accountScoped:Boolean(typeof accountId==='string'&&accountId)
  });
 }
 function verifiedTier(user,owner,now=Date.now()){
  if(!owner||user?.id!==owner)return 'free';
  const entitlement=user.app_metadata?.myliftcoach_entitlement;
  if(entitlement?.tier==='lifetime_pro')return 'lifetime_pro';
  if(entitlement?.tier==='pro'&&Date.parse(entitlement.expires_at)>now)return 'pro';
  return 'free';
 }
 // Release builds may disable beta previews independently of paid account claims.
 const BETA_PREVIEWS_ENABLED=true;
 function access(user,owner,preference,enabled=BETA_PREVIEWS_ENABLED){
  const paidTier=verifiedTier(user,owner);
  const beta=Boolean(enabled&&owner&&user?.id===owner&&user.app_metadata?.myliftcoach_beta===true);
  const mode=beta?(preference==='pro'||preference==='free'?preference:paidTier==='free'?'free':'pro'):null;
  return {paidTier,beta,mode,effectiveTier:mode??paidTier};
 }
 return Object.freeze({assess,verifiedTier,access});
});
