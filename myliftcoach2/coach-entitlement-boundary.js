/* MYLIFTCOACH 2.0 entitlement boundary.
 * Never trust localStorage, imported user profile or client flags as paid access.
 * This preview has no server-verified entitlement provider. Returning DENIED for
 * production is intentional until an authenticated server check is integrated.
 */
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
 return Object.freeze({assess});
});
