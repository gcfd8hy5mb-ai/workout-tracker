/* Owner-scoped adaptive proposal decisions. Accept = explicitly approve a
 * draft suggestion for review, NOT write to a workout or set.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachProposalDecisions=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PREFIX='mlc2-coach-proposal-decisions-v1:';
 const choices=new Set(['accepted','dismissed']);
 function key(owner){
  if(typeof owner!=='string'||!owner||owner.length>160)throw Error('Invalid owner');
  return PREFIX+owner;
 }
 function signature(proposal){
  if(!proposal||typeof proposal.exerciseId!=='string'||!proposal.exerciseId||
   !['increase','reduce','hold'].includes(proposal.status)||!Number.isFinite(proposal.weight)||
   proposal.weight<=0||proposal.weight>1500||proposal.requiresApproval!==true)return null;
  return JSON.stringify([proposal.exerciseId,proposal.status,proposal.weight,proposal.source||null]);
 }
 function valid(row){
  return !!row&&typeof row.signature==='string'&&row.signature.length<=512&&
   typeof row.exerciseId==='string'&&row.exerciseId.length>0&&row.exerciseId.length<=128&&
   choices.has(row.choice)&&Number.isFinite(Date.parse(row.at||''));
 }
 function read(storage,owner){
  if(!storage||typeof storage.getItem!=='function')throw Error('Decision storage unavailable');
  const raw=storage.getItem(key(owner));if(raw===null)return Object.freeze([]);
  let data;try{data=JSON.parse(raw)}catch{throw Error('Saved decisions need recovery; nothing overwritten')}
  if(!data||data.version!==1||data.owner!==owner||!Array.isArray(data.rows)||
   data.rows.length>100||!data.rows.every(valid))throw Error('Saved decisions need recovery; nothing overwritten');
  return Object.freeze(data.rows.map(x=>Object.freeze({...x})));
 }
 function status(storage,owner,proposal){
  const sig=signature(proposal);if(sig===null)return null;
  const found=read(storage,owner).find(x=>x.signature===sig);return found?.choice||null;
 }
 function decide(storage,owner,proposal,choice,now=Date.now()){
  const sig=signature(proposal);
  if(!sig||!choices.has(choice)||!Number.isFinite(now))throw Error('A current eligible Coach proposal is required');
  const history=read(storage,owner);
  const next={signature:sig,exerciseId:proposal.exerciseId,choice,at:new Date(now).toISOString()};
  const rows=[next,...history.filter(x=>x.signature!==sig)].slice(0,100);
  const raw=JSON.stringify({version:1,owner,rows});
  if(typeof storage.setItem!=='function')throw Error('Decision storage unavailable');
  storage.setItem(key(owner),raw);
  if(storage.getItem(key(owner))!==raw)throw Error('Decision save verification failed');
  return Object.freeze(next);
 }
 return Object.freeze({key,signature,read,status,decide});
});
