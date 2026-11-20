/* Offline, evidence-bound Coach Q&A for the 2.0 draft.
 * This is deterministic guidance, not a language model or autonomous planner.
 */
(function(root,factory){const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachAsk=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function answer(question,{today=null,weekly=null,checkin=null,action=null,lastSession=null,profile=null,adaptive=null}={}){
  const q=String(question||'').trim().slice(0,500).toLowerCase();
  const missing=()=>Object.freeze({kind:'needs-data',text:'I do not have enough verified training evidence for that answer. Complete a workout or update your weekly check-in first.',source:'Missing data'});
  if(!q)return Object.freeze({kind:'help',text:'Ask about today’s workout, a working-weight suggestion, weekly training progress, or your recorded check-in.',source:'Coach help'});
  if(/\bgoals?\b|training focus/.test(q)){
   if(!profile?.trainingGoal&&!profile?.trainingFocus)
    return Object.freeze({kind:'needs-data',text:'Load your original profile in Settings to see your saved training goal.',source:'Original account profile'});
   const details=[profile.trainingGoal&&'Goal: '+profile.trainingGoal,profile.trainingFocus&&'Focus: '+profile.trainingFocus,
    profile.days!=null&&'Planned training days per week: '+profile.days].filter(Boolean);
   return Object.freeze({kind:'goal',text:details.join(' · ')+'. Your assigned workout schedule takes priority.',source:'Verified original account profile'});
  }
  if(/(what|which|today|next).*(workout|exercise|train)|(workout|exercise).*(today|next)/.test(q)){
   if(today?.status!=='scheduled')return Object.freeze({kind:'schedule',text:'No workout is assigned today. Coach will not substitute a preset.',source:'Resolved workout schedule'});
   const names=(today.items||[]).map(x=>x.name).filter(Boolean);
   return Object.freeze({kind:'schedule',text:(today.title||'Scheduled workout')+': '+(names.join(', ')||'No exercises assigned')+'.',source:'Resolved workout schedule'});
  }
  if(/(personal target|my target|saved target|overload target)/.test(q)){
   const items=Array.isArray(today?.items)?today.items:[];
   const named=items.find(x=>q.includes(String(x.name||'').toLowerCase())||q.includes(String(x.id||'').toLowerCase()));
   const row=named||items.find(x=>Number.isFinite(x.personalTarget)&&x.personalTarget>0);
   if(!row||!Number.isFinite(row.personalTarget)||row.personalTarget<=0)
    return Object.freeze({kind:'needs-data',text:'No personal target is saved for that scheduled exercise. Open the workout to set one; no target will be invented.',source:'Owner-scoped local targets'});
   return Object.freeze({kind:'personal-target',text:row.name+': your saved personal target is '+row.personalTarget+' lb. It is separate from calculated Coach progression and is not automatically applied.',source:'Owner-scoped local targets'});
  }
  if(/(weight|heavy|increase|reduce|lighter|progression|load)/.test(q)){
   const items=Array.isArray(today?.items)?today.items:[];
   const named=items.find(x=>q.includes(String(x.name||'').toLowerCase())||q.includes(String(x.id||'').toLowerCase()));
   const row=named||items.find(x=>x.status==='ready');
   if(!row||row.status!=='ready')return missing();
   const proposal=adaptive?.items?.find(item=>item.exerciseId===row.id);
   if(proposal?.status==='review-increase')
    return Object.freeze({kind:'caution',text:row.name+': review your current working load before increasing. '+proposal.reason,source:'Adaptive Coach review'});
   if(checkin?.load==='conservative'&&row.action==='increase')
    return Object.freeze({kind:'caution',text:'Your check-in favors caution. '+row.name+' has a calculated increase, but it will not be automatically applied; consider holding your current load.',source:'Self-reported check-in + qualifying working sets'});
   return Object.freeze({kind:'progression',text:row.name+': '+row.action+' · '+row.weight+' lb suggested, not automatically applied. '+row.reason,source:row.source||'Qualifying completed sets'});
  }
  if(/(recover|tired|energy|readiness|feeling|check.in)/.test(q)){
   if(checkin?.status!=='recorded')return missing();
   return Object.freeze({kind:'checkin',text:'Your own weekly check-in: '+checkin.load+' training context. '+checkin.reason+' This is not a medical recovery estimate.',source:'Self-reported weekly check-in'});
  }
  if(/(week|day|schedule|consisten|availability)/.test(q)){
   if(!weekly)return missing();
   return Object.freeze({kind:'weekly',text:weekly.workouts+' workouts across '+weekly.trainingDays+' days recorded this week. '+weekly.note,source:'Completed 2.0 workouts + weekly check-in'});
  }
  if(/(last|previous|recent|history|finished)/.test(q)){
   const d=Date.parse(lastSession?.created||'');
   if(!Number.isFinite(d))return missing();
   return Object.freeze({kind:'history',text:'Most recent saved practice workout: '+String(lastSession.title||'Workout')+' on '+new Date(d).toISOString().slice(0,10)+'.',source:'Local completed workout history'});
  }
  if(action)return Object.freeze({kind:'action',text:action.title+'. '+action.description+' '+action.why,source:'Explainable Coach Actions'});
  return missing();
 }
 return Object.freeze({answer});
});
