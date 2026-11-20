/* MYLIFTCOACH 2.0 Coach intervention outcomes.
 * User-rated outcome is linked to an explicit previous Coach response AND
 * a subsequent completed working-set session. It cannot auto-edit a plan.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachOutcomes=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PREFIX='mlc2-coach-outcomes-v1:';
 const ratings=new Set(['better','same','worse']);
 function key(owner){if(typeof owner!=='string'||!owner||owner.length>160)throw Error('Invalid owner');return PREFIX+owner}
 function valid(row){return row&&typeof row.feedbackId==='string'&&/^cf-\d+-\d+$/.test(row.feedbackId)&&
  typeof row.sessionId==='string'&&row.sessionId.length>0&&row.sessionId.length<=160&&
  typeof row.exerciseId==='string'&&row.exerciseId.length>0&&row.exerciseId.length<=128&&
  ratings.has(row.rating)&&Number.isFinite(Date.parse(row.at||''));}
 function read(store,owner){
  if(!store||typeof store.getItem!=='function')throw Error('Outcomes storage unavailable');
  const raw=store.getItem(key(owner));if(raw===null)return Object.freeze([]);
  let data;try{data=JSON.parse(raw)}catch{throw Error('Saved outcomes need recovery; nothing overwritten')}
  if(!data||data.version!==1||data.owner!==owner||!Array.isArray(data.rows)||
   data.rows.length>100||!data.rows.every(valid)||
   new Set(data.rows.map(r=>r.feedbackId)).size!==data.rows.length)
   throw Error('Saved outcomes need recovery; nothing overwritten');
  return Object.freeze(data.rows.map(row=>Object.freeze({...row})));
 }
 function qualifies(feedback,session,now=Date.now()){
  if(!feedback?.id||!/^cf-\d+-\d+$/.test(feedback.id)||
   !feedback.exerciseId||!session?.id||!Array.isArray(session?.sets))return false;
  const after=Date.parse(feedback.at||''),at=Date.parse(session.created||'');
  if(!Number.isFinite(now)||!Number.isFinite(after)||!Number.isFinite(at)||at<=after||at>now)return false;
  const matching=session.sets.filter(set=>set?.exerciseId===feedback.exerciseId&&
   set.completed!==false&&Number.isFinite(Number(set.weight))&&Number(set.weight)>0&&
   Number.isFinite(Number(set.reps))&&Number(set.reps)>0);
  return matching.length>=2;
 }
 function candidates(feedback,history,outcomes=[],now=Date.now()){
  const claimed=new Set((Array.isArray(outcomes)?outcomes:[]).map(r=>r.feedbackId));
  const options=[];
  for(const row of Array.isArray(feedback)?feedback:[]){
   if(!row?.id||claimed.has(row.id)||row.response==='rejected')continue;
   const next=(Array.isArray(history)?history:[]).filter(s=>qualifies(row,s,now))
    .slice().sort((a,b)=>Date.parse(a.created)-Date.parse(b.created))[0];
   if(!next)continue;
   options.push(Object.freeze({feedbackId:row.id,sessionId:next.id,exerciseId:row.exerciseId,
    response:row.response,kind:row.kind,date:next.created}));
  }
  return Object.freeze(options);
 }
 function save(store,owner,selection,rating,feedback,history,now=Date.now()){
  if(!ratings.has(rating)||!selection)throw Error('Choose a valid training outcome');
  const matches=candidates(feedback,history,read(store,owner),now);
  const candidate=matches.find(row=>row.feedbackId===selection.feedbackId&&
   row.sessionId===selection.sessionId&&row.exerciseId===selection.exerciseId);
  if(!candidate)throw Error('A later completed workout is required for this outcome');
  const row={feedbackId:candidate.feedbackId,sessionId:candidate.sessionId,
   exerciseId:candidate.exerciseId,rating,at:new Date(now).toISOString()};
  const rows=[row,...read(store,owner)].slice(0,100);
  const payload=JSON.stringify({version:1,owner,rows});
  store.setItem(key(owner),payload);
  if(store.getItem(key(owner))!==payload)throw Error('Coach outcome save verification failed');
  return Object.freeze(row);
 }
 function summary(rows){
  const validRows=(Array.isArray(rows)?rows:[]).filter(valid);
  return Object.freeze({rated:validRows.length,
   better:validRows.filter(r=>r.rating==='better').length,
   same:validRows.filter(r=>r.rating==='same').length,
   worse:validRows.filter(r=>r.rating==='worse').length,
   note:'These are user-rated outcomes after completed workouts, not verified causal effects of Coach recommendations.'});
 }
 return Object.freeze({read,save,key,qualifies,candidates,summary});
});
