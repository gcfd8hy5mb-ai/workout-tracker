/* Original program-builder split and continuity rules for the 2.0 catalog. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCAdaptiveProgram=api;
})(globalThis,function(){
 'use strict';
 const splits={
  1:['Full Body'],2:['Full Body A','Full Body B'],3:['Full Body A','Full Body B','Full Body C'],
  4:['Upper A','Lower A','Upper B','Lower B'],5:['Upper','Lower','Push','Pull','Legs'],
  6:['Push','Pull','Legs','Push','Pull','Legs']
 };
 const roles={
  upper:[['chest'],['back'],['shoulders'],['biceps','triceps','arms']],
  lower:[['quads','legs'],['hamstrings','glutes'],['calves'],['core']],
  push:[['chest'],['shoulders'],['triceps','arms']],
  pull:[['back'],['back'],['biceps','forearms','arms']],
  full:[['quads','legs'],['chest','shoulders'],['back'],['hamstrings','glutes'],['core']]
 };
 function generate({catalog,local=[],legacy=[],profile,checkin,scheduled=null,prescription,now=Date.now()}){
  const recentLimit=now-42*86400000;
  const catalogById=new Map(catalog.map(ex=>[ex.id,ex]));
  const exposures=new Map();
  function count(date,ids){
   const time=Date.parse(date);
   if(!Number.isFinite(time)||time>now||time<recentLimit)return;
   for(const id of new Set(ids))if(catalogById.has(id))exposures.set(id,(exposures.get(id)||0)+1);
  }
  const good=set=>set?.completed!==false&&Number(set?.reps)>0&&Number.isFinite(Number(set?.weight))&&Number(set.weight)>=0;
  for(const entry of local)count(entry.created,(entry.sets||[]).filter(good).map(set=>set.exerciseId));
  for(const entry of legacy)count(entry.date,(entry.exercises||[]).filter(ex=>ex.sets?.some(good)).map(ex=>ex.id));
  const preferred=Number(profile?.days)||4;
  const days=Math.max(1,Math.min(6,preferred,Number(checkin?.days)||preferred));
  const group=ex=>String(ex.muscle||ex.group||'').toLowerCase();
  const used=new Map();
  const candidates=catalog.filter(ex=>exposures.has(ex.id));
  function select(title){
   const role=title.toLowerCase().split(' ')[0];
   const slots=(roles[role]||roles.full).slice();
   if(role==='full'&&profile?.trainingFocus==='upper')slots.push(['shoulders','triceps','biceps']);
   if(role==='full'&&profile?.trainingFocus==='lower')slots.push(['glutes','calves']);
   const ids=[];
   for(const groups of slots){
    const eligible=candidates.filter(ex=>groups.includes(group(ex))&&!ids.includes(ex.id));
    eligible.sort((a,b)=>(exposures.get(b.id)-2*(used.get(b.id)||0))-
      (exposures.get(a.id)-2*(used.get(a.id)||0))||a.name.localeCompare(b.name));
    const picked=eligible[0];
    if(picked){ids.push(picked.id);used.set(picked.id,(used.get(picked.id)||0)+1)}
   }
   return ids.length>=2?ids:[];
  }
  const plans=scheduled??splits[days].map((title,index)=>({
   id:'adaptive-'+index,title,description:'Coach-generated session based on recent training.',ids:select(title)
  }));
  return plans.map(plan=>plan?{...plan,prescriptions:prescription(plan)}:null);
 }
 return Object.freeze({generate});
});
