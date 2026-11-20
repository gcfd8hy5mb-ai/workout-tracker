/* Explainable Coach Actions: one safe recommendation from observed schedule,
 * performance and the user's own weekly check-in; not an autonomous plan editor.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachActions=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const action=(kind,title,description,why,exerciseId=null)=>Object.freeze({kind,title,description,why,exerciseId,requiresExplicitAction:true});
 function prioritize({today=null,checkin=null,weekly=null}={}){
  const status=today?.status,items=Array.isArray(today?.items)?today.items:[];
  const load=checkin?.load||'unknown';
  if(status!=='scheduled'||!items.length)return action('rest','Respect today’s rest or unassigned day',
   'Coach will not schedule an alternative workout automatically.',
   'Home and Coach use the same resolved weekly schedule.');
  if(load==='conservative'){
   const ready=items.find(x=>x.status==='ready'&&x.action==='increase');
   return action('caution','Keep training progression conservative',
    ready?'Hold off applying the suggested increase for '+ready.name+'.':'Choose weights and sets based on your current recorded performance.',
    checkin?.reason||'You reported low energy, poor recovery, or hard training.',ready?.id||null);
  }
  const target=items.find(x=>x.status==='ready'&&x.action==='reduce')||
   items.find(x=>x.status==='ready'&&x.action==='hold')||
   items.find(x=>x.status==='ready'&&x.action==='increase');
  if(target){
   const kind=target.action==='reduce'?'reduce':target.action==='hold'?'hold':'progress';
   const label=kind==='reduce'?'Review a lower working weight':kind==='hold'?'Build repetitions at the current weight':'Consider the next working-weight increment';
   return action(kind,label,
    target.name+': '+target.reason,
    'Based on qualifying completed sessions from '+(target.source||'recorded history')+'. The suggested adjustment is optional.',target.id);
  }
  const missing=items.find(x=>x.status==='unavailable');
  if(missing)return action('missing-exercise','Review an unavailable scheduled exercise',
   'Confirm the exercise ID in your editable plan before starting.',
   'Coach does not replace missing exercises with random presets.',missing.id||null);
  if(weekly?.remaining===0&&weekly?.daysAvailable!==null)return action('consistency','Weekly availability goal reached',
   'Continue according to your existing schedule.',
   'Recorded training days meet the days you reported available; no extra workouts are inserted.');
  return action('learning','Build exercise-specific training evidence',
   'Log qualifying sets in your scheduled workout to make future guidance more specific.',
   'No valid calculated weight recommendation is available yet.');
 }
 return Object.freeze({prioritize});
});
