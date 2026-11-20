/* MYLIFTCOACH 2.0 — original smart training behavior, session-only.
   Uses original equipment attributes and progression algorithm. No storage
   writes, tier assumptions, or mutations of an editable weekly workout. */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./exercise-metadata.js'):root.MLCExerciseMetadata,
                   node?require('./progression-preview.js'):root.MLCProgressionPreview);
 if(node)module.exports=api;else root.MLCSessionCoach=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(metadata,progression){
 'use strict';
 function warmups(workingWeight){
  const weight=Number(workingWeight);
  if(!Number.isFinite(weight)||weight<=0||weight>1500)return [];
  return [[0.4,8],[0.6,5],[0.8,3]].map(([ratio,reps])=>({
   weight:Math.max(2.5,Math.round(weight*ratio/5)*5),reps
  }));
 }
 function coach(history,exerciseId,name){
  return progression.suggest(history,exerciseId,{
   range:{min:8,max:10},
   increment:metadata.increment(exerciseId,name)
  });
 }
 function rankedAlternatives(oldId,planIds,catalog){
  const original=(catalog||[]).find(x=>x.id===oldId);
  if(!original)return [];
  const source=metadata.get(oldId,original.name);
  const baseMuscle=String(original.muscle||original.group||'').toLowerCase();
  if(!baseMuscle)return [];
  const selected=new Set(planIds||[]);
  return (catalog||[]).filter(x=>x.id&&x.id!==oldId&&!selected.has(x.id)&&
    String(x.muscle||x.group||'').toLowerCase()===baseMuscle)
   .map(ex=>{
    const attr=metadata.get(ex.id,ex.name);
    const shared=(attr.secondary||[]).filter(m=>(source.secondary||[]).includes(m));
    const samePattern=Boolean(source.pattern)&&source.pattern===attr.pattern;
    const sameEquipment=Boolean(source.equipment)&&source.equipment===attr.equipment;
    const relatedEquipment=!sameEquipment&&['Machine','Smith machine'].includes(source.equipment)&&['Machine','Smith machine'].includes(attr.equipment);
    const score=100+(samePattern?40:0)+Math.min(3,shared.length)*9+(sameEquipment?9:relatedEquipment?5:0)+(source.type&&source.type===attr.type?3:0);
    return {id:ex.id,name:ex.name,score,
     reason:(samePattern?'Similar movement pattern. ':'Same primary muscle. ')+(sameEquipment?'Similar equipment.':'Verify equipment and range of motion.')};
   }).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
 }
 function localProgression(practiceSessions,exerciseId,name){
  const originalShape=(Array.isArray(practiceSessions)?practiceSessions:[])
   .filter(s=>s&&Number.isFinite(Date.parse(s.created||''))&&Date.parse(s.created)<=Date.now()&&Array.isArray(s.sets))
   .map(s=>({date:s.created,exercises:[{id:exerciseId,sets:s.sets
     .filter(x=>x?.exerciseId===exerciseId&&x.completed!==false&&
       Number.isFinite(Number(x.weight))&&Number(x.weight)>0&&
       Number.isFinite(Number(x.reps))&&Number(x.reps)>0)
     .map(x=>({weight:Number(x.weight),reps:Number(x.reps),completed:true}))}]}));
  return coach(originalShape,exerciseId,name);
 }
 return Object.freeze({warmups,coach,rankedAlternatives,localProgression});
});
