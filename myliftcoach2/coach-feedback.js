/* Owner-scoped responses to 2.0 Coach Actions. Unlike original learning, responses
 * are observations only until matched to completed training and outcomes.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachFeedback=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PREFIX='mlc2-coach-feedback-v1:';
 function key(owner){if(typeof owner!=='string'||!owner||owner.length>160)throw Error('Invalid feedback owner');return PREFIX+owner}
 const values=new Set(['followed','modified','rejected']);
 function valid(row){return row&&values.has(row.response)&&typeof row.kind==='string'&&row.kind.length<=40&&
  (row.exerciseId===null||(typeof row.exerciseId==='string'&&row.exerciseId.length<=128))&&Number.isFinite(Date.parse(row.at||''));}
 function read(store,owner){
  if(!store||typeof store.getItem!=='function')throw Error('Coach feedback storage unavailable');
  const raw=store.getItem(key(owner));if(raw===null)return Object.freeze([]);
  let parsed;try{parsed=JSON.parse(raw)}catch{throw Error('Saved feedback needs recovery; nothing overwritten')}
  if(!parsed||parsed.version!==1||parsed.owner!==owner||!Array.isArray(parsed.rows)||parsed.rows.length>100||
    !parsed.rows.every(valid))throw Error('Saved feedback needs recovery; nothing overwritten');
  return Object.freeze(parsed.rows.map(x=>Object.freeze({...x})));
 }
 function save(store,owner,response,action,now=Date.now()){
  const at=new Date(now).toISOString();
  const row={at,response,kind:String(action?.kind||'').slice(0,40),
   exerciseId:typeof action?.exerciseId==='string'?action.exerciseId:null};
  if(!valid(row)||!action?.requiresExplicitAction)throw Error('Invalid Coach response');
  const history=read(store,owner),rows=[row,...history].slice(0,100);
  const raw=JSON.stringify({version:1,owner,rows});
  if(typeof store.setItem!=='function')throw Error('Feedback storage unavailable');
  store.setItem(key(owner),raw);
  if(store.getItem(key(owner))!==raw)throw Error('Feedback save could not be verified');
  return Object.freeze(row);
 }
 function summary(rows){
  const all=Array.isArray(rows)?rows.filter(valid):[];
  return Object.freeze({responses:all.length,followed:all.filter(x=>x.response==='followed').length,
   modified:all.filter(x=>x.response==='modified').length,rejected:all.filter(x=>x.response==='rejected').length,
   note:'Responses alone do not prove improvement or change recommendations.'});
 }
 return Object.freeze({key,read,save,summary});
});
