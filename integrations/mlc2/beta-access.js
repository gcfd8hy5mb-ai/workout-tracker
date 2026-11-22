/* MYLIFTCOACH 2.0 open Free/Pro beta preview.
   Any signed-in account can choose a feature-preview mode in authenticated
   user_metadata; guests can also preview the modes locally. This is NEVER a
   paid subscription entitlement, and it cannot authorize billing or access
   to protected production subscriber data. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLC2BetaAccess=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const validOwner=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(value);
 const modes=Object.freeze(['free','pro']);
 const FIELD='mlc2_private_beta_mode';
 function allowed(user){return !!user&&validOwner(user.id)}
 function resolve(user,guestMode='free'){
  const signedIn=allowed(user);
  const raw=signedIn?user?.user_metadata?.[FIELD]:guestMode;
  return {owner:signedIn?user.id:null,authorized:true,
   mode:modes.includes(raw)?raw:'free',paidSubscription:false,
   persistence:signedIn?'account':'device'};
 }
 async function change({user,mode,verify,update,stillCurrent}){
  if(!allowed(user))throw Error('Sign in to save a beta mode to an account');
  if(!modes.includes(mode))throw Error('Unsupported beta access mode');
  if(typeof verify!=='function'||typeof update!=='function'||typeof stillCurrent!=='function')
   throw Error('Verified account operations required');
  const owner=user.id;
  if(!stillCurrent(owner))throw Error('Account changed before beta switch');
  const fresh=await verify();
  if(!stillCurrent(owner)||fresh?.id!==owner)
   throw Error('Verified account changed');
  const metadata={...(fresh.user_metadata||{}),[FIELD]:mode};
  const saved=await update(metadata);
  if(!stillCurrent(owner)||saved?.id!==owner)
   throw Error('Account changed while saving beta preference');
  if(saved.user_metadata?.[FIELD]!==mode)
   throw Error('Server did not confirm beta preference');
  const confirmed=await verify();
  if(!stillCurrent(owner)||confirmed?.id!==owner||
     confirmed.user_metadata?.[FIELD]!==mode)
   throw Error('Unable to confirm saved beta preference');
  return resolve(confirmed);
 }
 return Object.freeze({FIELD,modes,allowed,resolve,change});
});
