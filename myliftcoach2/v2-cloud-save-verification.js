/* Explicit, opt-in verification helper for an approved isolated schedule
 * transport. Never imported by the live app. No automatic retries: a failed
 * read-back after an acknowledged save leaves the outcome indeterminate.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCV2SaveVerification=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function canonical(value){
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  return JSON.stringify(value);
 }
 async function verify({owner,expectedRevision,document,transport}={}){
  if(typeof owner!=='string'||!owner||!Number.isSafeInteger(expectedRevision)||expectedRevision<0||
   !document||typeof transport?.save!=='function'||typeof transport?.read!=='function')
   throw Error('Explicit authenticated save verification requires a valid owner, revision, document and transport');
  const before=canonical(document);
  const saved=await transport.save(owner,expectedRevision,document);
  if(canonical(document)!==before)throw Error('Local draft changed during cloud save; stop and review');
  if(!saved||saved.revision!==expectedRevision+1||canonical(saved.document)!==before)
   throw Error('Save response did not match the local draft; do not retry automatically');
  let fetched;
  try{fetched=await transport.read(owner)}
  catch{throw Error('Cloud save may have succeeded, but read-back was unavailable; do not retry automatically')}
  if(!fetched||fetched.revision!==saved.revision||canonical(fetched.document)!==before)
   throw Error('Cloud read-back differs from saved document; preserve local copy and review conflict');
  return Object.freeze({verified:true,revision:saved.revision,owner,readBackMatches:true,
   message:'Authenticated save and independent read-back match. No local draft was modified.'});
 }
 return Object.freeze({verify});
});
