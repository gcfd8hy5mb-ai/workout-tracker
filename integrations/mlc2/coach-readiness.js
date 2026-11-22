/* 2.0 Coach readiness and weekly training summary.
   Adapted from original app's Great/Normal/Tired readiness choices and Monday-start weekly summary.
   Isolated browser storage only: no changes to original MYLIFTCOACH or Supabase records. */
(function(){
'use strict';
const KEY='mlc2-coach-readiness-v1', GOAL_KEY='mlc2-weekly-goal-v1';
let owner=null;
const scoped=key=>owner?key+':user:'+owner:key;
function setOwner(id){if(id!==null&&!/^[a-zA-Z0-9_-]{1,128}$/.test(id||''))throw Error('Invalid Coach account');owner=id}
const DAYS=['Great','Normal','Tired'];
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
function monday(date){
 const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());
 d.setDate(d.getDate()-(d.getDay()+6)%7);
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
function read(){
 try{
  const raw=JSON.parse(localStorage.getItem(scoped(KEY))||'{}');
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
  const clean={};
  for(const [key,value] of Object.entries(raw).slice(-365)){
   if(/^\d{4}-\d{2}-\d{2}:.{1,100}$/.test(key)&&DAYS.includes(value))clean[key]=value;
  }
  return clean;
 }catch{return {}}
}
function current(planId,day=today()){return read()[day+':'+planId]||'Normal'}
function save(planId,value,day=today()){
 if(!planId||!DAYS.includes(value))return false;
 const entries=read();entries[day+':'+planId]=value;
 try{const payload=JSON.stringify(entries);localStorage.setItem(scoped(KEY),payload);if(localStorage.getItem(scoped(KEY))!==payload)return false;try{window.MLC2ScheduleAuxSync?.()}catch{}return true}catch{return false}
}
function weeklyGoal(storage=localStorage){
 try{const raw=storage.getItem(scoped(GOAL_KEY));if(raw===null)return 4;
  const value=Number(raw);return Number.isInteger(value)&&value>=1&&value<=7?value:4;
 }catch{return 4}
}
function saveWeeklyGoal(value,storage=localStorage){
 const target=Number(value);
 if(!Number.isInteger(target)||target<1||target>7)return false;
 try{storage.setItem(scoped(GOAL_KEY),String(target));if(storage.getItem(scoped(GOAL_KEY))!==String(target))return false;try{window.MLC2ScheduleAuxSync?.()}catch{}return true}catch{return false}
}
function weekSummary(sessions,now=new Date(),target=4){
 const start=monday(now),validTarget=Number.isInteger(target)&&target>=1&&target<=7?target:4;
 const end=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 end.setDate(end.getDate()+(7-(end.getDay()+6)%7)-1);
 const ending=[end.getFullYear(),String(end.getMonth()+1).padStart(2,'0'),String(end.getDate()).padStart(2,'0')].join('-');
 const rows=(Array.isArray(sessions)?sessions:[]).filter(s=>{
  const d=String(s?.created||s?.date||'').slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d)&&d>=start&&d<=ending;
 });
 let sets=0,volume=0;const records=new Map();
 for(const s of rows)for(const set of Array.isArray(s.sets)?s.sets:[]){
  const weight=Number(set.weight),reps=Number(set.reps);
  if(!Number.isFinite(weight)||weight<=0||!Number.isInteger(reps)||reps<=0)continue;
  sets++;volume+=weight*reps;
  const id=String(set.exerciseId||'');
  if(id)records.set(id,Math.max(weight,records.get(id)||0));
 }
 return {start,end:ending,sessions:rows.length,sets,volume,exercises:records.size,target:validTarget};
}
function render(root,sessions,plan,onChange){
 if(!root||!plan)return;
 const readiness=current(plan.id),summary=weekSummary(sessions,new Date(),weeklyGoal()),target=Math.min(100,Math.round(summary.sessions/summary.target*100));
 root.innerHTML='<div class="coach-readiness-block"><h4>Today’s readiness · '+escapeText(plan.title)+'</h4><div id="coachReadinessChoices" class="coach-readiness-choices">'+
 DAYS.map(x=>'<button type="button" data-readiness="'+x+'" aria-pressed="'+(readiness===x)+'">'+x+'</button>').join('')+
 '</div><p id="coachReadinessNote">'+(readiness==='Tired'?'You marked yourself tired. Consider a lighter session or rest, based on how you feel.':readiness==='Great'?'You marked yourself great. Follow your planned workout and normal progression rules.':'Normal readiness selected. Follow your usual plan and adjust to comfort.')+'</p></div>'+
 '<div class="coach-weekly-block"><h4>This week · '+summary.start+' to '+summary.end+'</h4>'+
 '<label class="coach-goal-label">Weekly workout goal <select id="coachWeeklyGoal" aria-label="Planned workouts each week">'+
 [1,2,3,4,5,6,7].map(n=>'<option value="'+n+'" '+(n===summary.target?'selected':'')+'>'+n+' '+(n===1?'workout':'workouts')+'</option>').join('')+
 '</select></label><p id="coachGoalNote" role="status" aria-live="polite"></p>'+
 '<div class="coach-weekly-progress" role="progressbar" aria-label="Weekly training goal" aria-valuemin="0" aria-valuemax="'+summary.target+'" aria-valuenow="'+Math.min(summary.sessions,summary.target)+'"><span style="width:'+target+'%"></span></div>'+
 '<p>'+summary.sessions+' of '+summary.target+' planned sessions · '+summary.sets+' weighted sets · '+Math.round(summary.volume).toLocaleString()+' lb total volume</p></div>'+
 '<p class="coach-readiness-help">Readiness is a personal check-in, not a medical assessment. No workout or training weight changes automatically. Saved to this 2.0 account on this device. Use Settings to back up your check-ins.</p>';
 root.querySelector('#coachWeeklyGoal').addEventListener('change',e=>{
  if(!saveWeeklyGoal(e.target.value)){
   root.querySelector('#coachGoalNote').textContent='Could not save weekly goal in this browser.';
   e.target.value=String(weeklyGoal());return;
  }
  render(root,sessions,plan,onChange);
  if(typeof onChange==='function')onChange();
 });
 root.querySelector('#coachReadinessChoices').addEventListener('click',e=>{
  const b=e.target.closest('[data-readiness]');if(!b)return;
  if(!save(plan.id,b.dataset.readiness)){root.querySelector('#coachReadinessNote').textContent='Could not save readiness in this browser.';return}
  render(root,sessions,plan,onChange);
  if(typeof onChange==='function')onChange();
 });
}
function escapeText(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
window.MLC2CoachReadiness={monday,read,current,save,weeklyGoal,saveWeeklyGoal,weekSummary,render,setOwner};
})();
