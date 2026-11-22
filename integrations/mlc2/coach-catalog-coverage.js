/* Coach catalog classification for all 344 release exercises.
   Existing reviewed attributes remain authoritative. Unrecognized exercises
   are explicitly unclassified, never guessed into a substitute family.
   The catalog is not changed; cardio is excluded from weight progression. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLC2CoachCoverage=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const rules=[
  ['Cardio', /./, 'Cardio'],
  ['Chest', /(?:fly|pec-deck)/, 'Chest Fly'],
  ['Chest', /(?:incline|low-to-high).*(?:press|push-up)/, 'Incline Press'],
  ['Chest', /(?:decline|high-to-low).*(?:press|push-up)/, 'Decline Press'],
  ['Chest', /(?:press|push-up)/, 'Horizontal Press'],
  ['Back', /(?:shrug)/, 'Shoulder Elevation'],
  ['Back', /(?:pullover)/, 'Shoulder Extension'],
  ['Back', /(?:pull-up|pullup|pulldown)/, 'Vertical Pull'],
  ['Back', /(?:row)/, 'Horizontal Pull'],
  ['Shoulders', /(?:rear-delt|reverse-cable-fly)/, 'Rear Delt Fly'],
  ['Shoulders', /(?:y-raise)/, 'Y Raise'],
  ['Shoulders', /(?:lateral-raise)/, 'Lateral Raise'],
  ['Shoulders', /(?:front-raise)/, 'Front Raise'],
  ['Shoulders', /(?:press)/, 'Vertical Press'],
  ['Shoulders', /(?:upright-row)/, 'Upright Row'],
  ['Arms', /(?:wrist-curl|reverse-wrist)/, 'Wrist Flexion Extension'],
  ['Arms', /(?:pushdown|triceps-push)/, 'Elbow Extension'],
  ['Arms', /(?:kickback|skull-crush|triceps-extension|overhead.*extension|overhead-db-extension|jm-press|tate-press)/, 'Elbow Extension'],
  ['Arms', /(?:dip|close-grip-bench-press|diamond-push-up)/, 'Elbow Extension Compound'],
  ['Arms', /(?:curl)/, 'Elbow Flexion'],
  ['Legs', /(?:tibialis)/, 'Ankle Dorsiflexion'],
  ['Legs', /(?:calf)/, 'Calf Raise'],
  ['Legs', /(?:abduction|adductor|lateral-walk)/, 'Hip Abduction Adduction'],
  ['Legs', /(?:kickback)/, 'Hip Extension'],
  ['Legs', /(?:hip-thrust|glute-bridge|frog-pump)/, 'Hip Thrust'],
  ['Legs', /(?:leg-extension|reverse-nordic)/, 'Knee Extension'],
  ['Legs', /(?:leg-curl|hamstring-curl|nordic|slider-leg-curl|stability-ball-leg-curl|single-leg-(?:lying|seated)-curl)/, 'Knee Flexion'],
  ['Legs', /(?:romanian-deadlift|stiff-leg|(?:^|-)rdl(?:$|-)|good-morning|pull-through)/, 'Hip Hinge'],
  ['Legs', /(?:lunge|split-squat)/, 'Lunge Split Squat'],
  ['Legs', /(?:step-up)/, 'Step Up'],
  ['Legs', /(?:squat|leg-press)/, 'Squat'],
  ['Legs', /(?:back-extension|sumo-deadlift)/, 'Hip Hinge'],
  ['Core', /(?:pallof|body-saw|plank|bird-dog|dead-bug)/, 'Core Stability'],
  ['Core', /(?:carry)/, 'Loaded Carry'],
  ['Core', /(?:twist|side-bend)/, 'Rotation'],
  ['Core', /(?:crunch|knee-raise|leg-raise|sit-up|rollout|ab-wheel)/, 'Core Flexion']
 ];
 function classify(e,reviewed={}){
  if(!e||typeof e.id!=='string'||typeof e.name!=='string'||typeof e.group!=='string')return null;
  const prior=reviewed[e.id],isCardio=e.group==='Cardio';
  const pattern=isCardio?'Cardio':prior?.pattern||
   rules.find(([group,rx])=>group===e.group&&rx.test(e.id))?.[2]||null;
  return Object.freeze({
   pattern,equipment:prior?.equipment||e.equipment||'Unknown',
   type:prior?.type||(isCardio?'Cardio':pattern?/^(Chest Fly|Elbow Flexion|Elbow Extension|Wrist|Knee|Calf|Ankle|Lateral|Front|Rear|Y Raise|Hip Abduction)/.test(pattern)?'Isolation':'Compound':'Unclassified'),
   secondary:Array.isArray(prior?.secondary)?prior.secondary:[],
   reviewed:!!prior,
   strength:!isCardio&&e.group!=='Cardio',
   substitutionEligible:!isCardio&&!!pattern&&pattern!=='Cardio'
  });
 }
 function expand(catalog,reviewed={}){
  if(!Array.isArray(catalog))return {};
  const out=Object.create(null);
  for(const e of catalog){if(e&&typeof e.id==='string'&&e.id&&!Object.prototype.hasOwnProperty.call(out,e.id)){
   const v=classify(e,reviewed);if(v)out[e.id]=v;
  }}
  return out;
 }
 function report(catalog,reviewed={}){
  const mapped=expand(catalog,reviewed),values=Object.values(mapped);
  return {total:values.length,reviewed:values.filter(v=>v.reviewed).length,
   classified:values.filter(v=>v.pattern!==null).length,
   substitutionEligible:values.filter(v=>v.substitutionEligible).length,
   unclassified:Object.keys(mapped).filter(k=>!mapped[k].pattern),
   cardio:values.filter(v=>!v.strength).length};
 }
 return Object.freeze({classify,expand,report});
});
