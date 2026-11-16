/* Pure planning only: preserve original newest-first workout ordering.
 * No RPC calls, writes, authentication, or production enablement.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('../persistence/storage-model.js'):root.PRISMStorageModel,node?require('../persistence/reconcile.js'):root.PRISMReconcile);
 if(node)module.exports=api;else root.MLCOrderedAppendPlanner=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(model,reconcile){
 'use strict';
 async function plan({owner,verifiedOwner,baseline,latestHistory,cloudRows,session}){
  if(!owner||owner!==verifiedOwner)throw Error('Verified account owner required');
  if(!Array.isArray(baseline)||!Array.isArray(latestHistory)||!Array.isArray(cloudRows))throw Error('Fresh history and cloud checkpoint required');
  if(model.canonical(baseline)!==model.canonical(latestHistory))throw Error('History changed since baseline');
  if(!session||!session.id||latestHistory.some(x=>String(x.id)===String(session.id)))throw Error('Duplicate or missing session ID');
  if(!Array.isArray(session.exercises)||!session.exercises.length)throw Error('Complete workout required');
  const prior=model.restoreSnapshot(cloudRows).workoutHistoryV52;
  if(typeof prior!=='string'||model.canonical(JSON.parse(prior))!==model.canonical(latestHistory))throw Error('Cloud checkpoint does not match latest history');
  const candidate=[session,...latestHistory];
  const nextRows=await model.normalize({workoutHistoryV52:JSON.stringify(candidate)});
  const priorRows=cloudRows.filter(x=>x.source_key==='workoutHistoryV52');
  const baselineRows=await model.normalize({workoutHistoryV52:JSON.stringify(baseline)});
  const received=new Map(priorRows.map(row=>[row.table+':'+row.id,row]));
  if(received.size!==priorRows.length||received.size!==baselineRows.length||
    baselineRows.some(row=>{
      const other=received.get(row.table+':'+row.id);
      return !other||reconcile.content(row)!==reconcile.content(other);
    }))throw Error('Cloud checkpoint has changed; refresh before saving');
  const proposed=reconcile.plan(nextRows,priorRows,priorRows);
  if(!proposed.ready)throw Error('Cloud data conflict — do not save');
  const ordered=JSON.parse(model.restoreSnapshot(nextRows).workoutHistoryV52);
  if(model.canonical(ordered)!==model.canonical(candidate))throw Error('History ordering changed during normalization');
  const newRows=proposed.writes.filter(x=>x.expected_revision===0).length;
  const revisedRows=proposed.writes.filter(x=>x.expected_revision>0).length;
  return Object.freeze({candidate,changes:proposed.writes,checkpoint:priorRows,newRows,revisedRows,readyForProduction:false});
 }
 return Object.freeze({plan});
});
