/* MYLIFTCOACH 2.0 · Phase 1. No writes to production Supabase tables. */
(()=>{
'use strict';
const BACKEND='https://kirlpjflaoriiusfamsk.supabase.co';
const PUBLIC_KEY='sb_publishable_yYMnCM3k14zaEtpHo4-xkQ_Cd1Aty90';
const DEMO_KEY='mlc2-demo-workouts-v1'; // independent namespace, never original workout keys
const AUTH_KEY='mlc2-auth-session-v1'; // separate from original production auth storage
const exercises=[
 {id:'chest-press',name:'Machine Chest Press',group:'Chest',sets:3,reps:'8–12',cue:'Set the handles near mid-chest. Press smoothly and control the return.'},
 {id:'pec-deck',name:'Pec Deck',group:'Chest',sets:3,reps:'10–15',cue:'Keep the chest tall and bring the arms together without swinging.'},
 {id:'shoulder-press',name:'Machine Shoulder Press',group:'Shoulders',sets:3,reps:'8–12',cue:'Keep elbows under the handles and avoid arching your back.'},
 {id:'lat-pulldown',name:'Lat Pulldown',group:'Back',sets:3,reps:'8–12',cue:'Pull elbows toward your sides and control the bar upward.'},
 {id:'seated-row',name:'Seated Cable Row',group:'Back',sets:3,reps:'10–12',cue:'Start tall and draw elbows back without leaning excessively.'},
 {id:'biceps-curl',name:'Machine Biceps Curl',group:'Arms',sets:3,reps:'10–12',cue:'Keep upper arms stable and lower slowly.'},
 {id:'triceps-push',name:'Triceps Pushdown',group:'Arms',sets:3,reps:'10–12',cue:'Keep elbows beside your torso and extend without swinging.'},
 {id:'leg-press',name:'Leg Press',group:'Legs',sets:3,reps:'8–12',cue:'Use a controlled range while keeping hips against the seat.'},
 {id:'leg-curl',name:'Seated Leg Curl',group:'Legs',sets:3,reps:'10–15',cue:'Position the knee joint with the machine pivot and move smoothly.'},
 {id:'leg-extension',name:'Leg Extension',group:'Legs',sets:3,reps:'10–15',cue:'Lift under control and avoid kicking the weight.'},
 {id:'calf-raise',name:'Calf Raise Machine',group:'Legs',sets:3,reps:'12–15',cue:'Reach a comfortable stretch, rise steadily, and pause.'},
 {id:'cable-crunch',name:'Cable Crunch',group:'Core',sets:3,reps:'10–15',cue:'Move the rib cage toward the pelvis without pulling with the arms.'}
];
const plans=[
 {id:'upper-a',title:'Upper Body A',kind:'Upper Strength',description:'A push-and-pull session for the upper body.',ids:['chest-press','lat-pulldown','shoulder-press','triceps-push']},
 {id:'lower-a',title:'Lower Body A',kind:'Lower Strength',description:'Controlled lower-body movements and core training.',ids:['leg-press','leg-curl','calf-raise','cable-crunch']},
 {id:'upper-b',title:'Upper Body B',kind:'Upper Hypertrophy',description:'Variation for chest, back and arms.',ids:['pec-deck','seated-row','biceps-curl','triceps-push']},
 {id:'lower-b',title:'Lower Body B',kind:'Lower Hypertrophy',description:'A second lower-body session with balanced emphasis.',ids:['leg-press','leg-extension','leg-curl','calf-raise']}
];
const originalExercises=Array.isArray(window.MLCOriginalExercises)?window.MLCOriginalExercises:[];
const WEEKLY_KEY='mlc2-weekly-preview-v1';
const RECURRING_KEY='mlc2-recurring-preview-v1';
const recurringDraftAPI=window.MLCRecurringDraft;
const weeklyAPI=window.MLCWeeklySchedule;
const editorExercises=[...exercises,...originalExercises.filter(ex=>!exercises.some(demo=>demo.id===ex.id)).map(ex=>({
 id:ex.id,name:ex.name,group:ex.muscle||'Other',sets:3,reps:'8–12',cue:ex.how||''
}))];
const exerciseById=id=>editorExercises.find(ex=>ex.id===id);
const allowedExerciseIds=editorExercises.map(ex=>ex.id);
function scheduleOwner(){return account?.id||null}
function readWeekly(owner=scheduleOwner()){
 return weeklyAPI.loadOwned(localStorage,WEEKLY_KEY,owner,plans,allowedExerciseIds);
}
let weekly=weeklyAPI.normalize(null,plans,allowedExerciseIds);
let activeRecurring=null;
let weeklyDraftReadError=null;
function refreshWeeklyOwner(){
 activeRecurring=null;
 try{
  const recurring=recurringDraftAPI.read(localStorage,RECURRING_KEY,scheduleOwner(),allowedExerciseIds);
  if(recurring){
   activeRecurring=recurring;
   weekly={plans:recurring.plans.map(p=>({...p,ids:p.ids.slice()})),assigned:recurring.assigned.slice()};
  }else weekly=readWeekly();
  weeklyDraftReadError=null;
 }catch(error){
  // Preserve bytes of the unreadable record and block changes until recovered.
  weekly=weeklyAPI.normalize(null,plans,allowedExerciseIds);
  weeklyDraftReadError=String(error.message||error);
 }
}
let originalCustomSchedule=null,importedCustomOwner=null,originalSchedulePreview=false,fullMigrationPreview=null;
function originalPreviewActive(){return Boolean(originalSchedulePreview&&originalCustomSchedule&&account?.id&&importedCustomOwner===account.id)}
function dayAtWeekIndex(day){const now=new Date();return new Date(now.getFullYear(),now.getMonth(),now.getDate()+day-weeklyAPI.dayIndex(now),12);}
function resolvedWorkout(date=new Date()){
 const local=weeklyAPI.resolve(weekly,date);
 if(originalPreviewActive()){
  const fromOriginal=window.MLCOriginalCustomSchedule.resolve(originalCustomSchedule,date);
  if(fromOriginal.hasSchedule)return {...local,plan:fromOriginal.plan,source:fromOriginal.kind};
 }
 if(activeRecurring){
  const result=window.MLCV2RecurringSchedule.resolve(activeRecurring,date);
  return {...local,plan:result.plan,source:result.source};
 }
 return {...local,source:'preview'};
}
function renderOriginalCustomSchedule(){
 const status=$('originalCustomStatus'),load=$('loadOriginalCustom'),toggle=$('toggleOriginalCustom');
 if(!status||!load||!toggle)return;
 load.disabled=!account;
 const available=Boolean(account?.id&&importedCustomOwner===account.id&&originalCustomSchedule);
 toggle.disabled=!available;
 $('copyOriginalCustom').disabled=!available;
 $('inspectRecurringMigration').disabled=!available;
 $('activateFullRecurring').disabled=!available||!fullMigrationPreview||fullMigrationPreview.owner!==account.id||Boolean(activeRecurring);
 toggle.textContent=originalPreviewActive()?'Switch to editable preview':'Preview original custom assignments';
 status.textContent=!account?'Sign in to load your original custom schedule.':!available?'Load custom workouts and scheduled dates from your original account.':originalCustomSchedule.plans.length+' compatible custom workouts found · '+(originalPreviewActive()?'Original assignments shown read-only':'Local editable schedule shown');
}
function clearOriginalCustomSchedule(){originalCustomSchedule=null;importedCustomOwner=null;originalSchedulePreview=false;fullMigrationPreview=null;renderOriginalCustomSchedule();if($('recurringMigrationStatus'))$('recurringMigrationStatus').textContent='';}
async function loadOriginalCustomSchedule(){
 if(!account?.id||!auth?.access_token){notice('Sign in to load original custom workouts.');return;}
 const owner=account.id,button=$('loadOriginalCustom'),status=$('originalCustomStatus');
 button.disabled=true;status.textContent='Reading original custom workouts and dates…';
 try{
  await validateStoredAuth();
  if(account?.id!==owner||!auth?.access_token)throw Error('Session changed');
  const data=await window.MLCOriginalCustomSchedule.load({endpoint:BACKEND,publishableKey:PUBLIC_KEY,accessToken:auth.access_token,userId:owner,validExerciseIds:allowedExerciseIds});
  if(account?.id!==owner)throw Error('Account changed during import');
  originalCustomSchedule=data;importedCustomOwner=owner;originalSchedulePreview=true;fullMigrationPreview=null;$('recurringMigrationStatus').textContent='';renderOriginalCustomSchedule();renderHome();renderWorkouts();
 }catch(error){
  clearOriginalCustomSchedule();status.textContent='Import failed: '+String(error.message||error).slice(0,160);
 }finally{button.disabled=!account}
}
function toggleOriginalCustomSchedule(){
 if(!account?.id||importedCustomOwner!==account.id||!originalCustomSchedule)return;
 originalSchedulePreview=!originalSchedulePreview;renderOriginalCustomSchedule();renderHome();renderWorkouts();
}
function inspectCompleteRecurringMigration(){
 const status=$('recurringMigrationStatus');
 if(!account?.id||importedCustomOwner!==account.id||!originalCustomSchedule){status.textContent='Load the original schedule for this account first.';return;}
 try{
  const prepared=window.MLCV2RecurringSchedule.migrate({original:originalCustomSchedule,weekly,validExerciseIds:allowedExerciseIds});
  if(!window.MLCV2RecurringSchedule.validate(prepared.document))throw Error('Migration verification failed');
  fullMigrationPreview={owner:account.id,prepared};
  renderOriginalCustomSchedule();
  status.textContent='Verified read-only migration preview: '+prepared.summary.workouts+' original workouts, '+prepared.summary.oneTime+' one-time dates and '+prepared.summary.recurring+' recurring rules. All future starts and end dates retained. Nothing was saved or deployed.';
 }catch(error){fullMigrationPreview=null;renderOriginalCustomSchedule();status.textContent='Migration blocked: '+String(error.message||error).slice(0,200);}
}
function activateCompleteRecurringLocally(){
 const status=$('recurringMigrationStatus');
 if(!account?.id||!fullMigrationPreview||fullMigrationPreview.owner!==account.id||importedCustomOwner!==account.id){
  status.textContent='Inspect the complete original schedule for this account before activating.';return;
 }
 try{
  if(weeklyDraftReadError)throw Error('Existing saved schedule requires recovery');
  if(activeRecurring)throw Error('A complete recurring schedule is already active. Original document was not overwritten.');
  const candidate=fullMigrationPreview.prepared.document;
  recurringDraftAPI.commit(localStorage,RECURRING_KEY,scheduleOwner(),candidate,allowedExerciseIds);
  activeRecurring=candidate;
  weekly={plans:candidate.plans.map(p=>({...p,ids:p.ids.slice()})),assigned:candidate.assigned.slice()};
  originalSchedulePreview=false;
  fullMigrationPreview=null;
  renderOriginalCustomSchedule();renderHome();renderWorkouts();
  status.textContent='Complete recurring schedule activated in this browser. One-time dates and all weekly repeats are retained. Original account records remain read-only; cloud sync is disabled.';
  notice('Recurring workouts now govern Home and Start Workout locally.');
 }catch(error){status.textContent='Activation blocked: '+String(error.message||error).slice(0,210)}
}
function copyOriginalToEditable(){
 if(activeRecurring){$('originalCustomStatus').textContent='Full recurring schedule is already active; do not replace it with a one-week copy.';return;}
 if(!originalPreviewActive()){notice('Load and preview the original schedule first.');return}
 try{
  const current=window.MLCCustomScheduleCopy.prepare({original:originalCustomSchedule,existing:weekly,referenceDate:new Date(),validExerciseIds:allowedExerciseIds});
  commitWeekly(current.draft);
  originalSchedulePreview=false;
  renderOriginalCustomSchedule();renderHome();renderWorkouts();
  const status=$('originalCustomStatus');
  status.textContent='Copied '+current.copiedCount+' original custom workouts and matching assignments for '+current.dates[0]+'–'+current.dates[6]+' into your editable local draft. Future recurring rules remain unchanged in the original account.';
  notice('Original workouts copied locally. Live cloud data unchanged.');
 }catch(error){$('originalCustomStatus').textContent='Copy not completed: '+String(error.message||error).slice(0,180)}
}
function commitWeekly(candidate){
 if(weeklyDraftReadError)throw Error('Saved schedule needs recovery before editing: '+weeklyDraftReadError);
 if(activeRecurring){
  const document=recurringDraftAPI.edited(activeRecurring,candidate,allowedExerciseIds);
  recurringDraftAPI.commit(localStorage,RECURRING_KEY,scheduleOwner(),document,allowedExerciseIds);
  activeRecurring=document;weekly=candidate;
 }else weekly=weeklyAPI.commitOwned(localStorage,WEEKLY_KEY,scheduleOwner(),candidate,plans.map(p=>p.id));
}
function nextPlan(){return resolvedWorkout().plan}
function openToday(){const plan=nextPlan();if(plan)openWorkout(plan.id);else notice('Today is a rest day. Choose a workout from the weekly board.')}
function renderWeekBoard(){
 const current=weeklyAPI.resolve(weekly).index;
 for(const key of ['weeklyBoardHome','weeklyBoardWorkouts']){
  const target=$(key);if(!target)continue;
  target.innerHTML=weeklyAPI.DAYS.map((label,day)=>{
   const resolved=resolvedWorkout(dayAtWeekIndex(day)),plan=resolved.plan;
   return '<button type="button" class="week-day-card'+(day===current?' is-today':'')+'" data-week-day="'+day+'" aria-label="'+(originalPreviewActive()?'View':'Edit')+' '+label+' workout"><strong>'+label+'</strong><small>'+escapeHTML(plan?.title||(resolved.source==='unmatched'?'Unmatched original':'Rest'))+'</small>'+(resolved.source!=='preview'?'<small>Original</small>':'')+'</button>';
  }).join('');
 }
}
function chooseWeekday(day){
 const target=$('weekEditor'),choice=$('weekWorkoutSelect');
 if(!Number.isInteger(day)||day<0||day>6)return;
 if(originalPreviewActive()){notice('Original schedule is read-only. Switch to editable preview first.');return;}
 target.hidden=false;target.dataset.day=String(day);
 $('weekEditingDay').textContent=weeklyAPI.DAYS[day];
 choice.innerHTML='<option value="">Rest day</option>'+weekly.plans.map(p=>'<option value="'+escapeHTML(p.id)+'">'+escapeHTML(p.title)+'</option>').join('');
 choice.value=weekly.assigned[day]||'';
 updateWeekEditor();
 setPage('workouts');target.hidden=false;
 target.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function updateWeekEditor(){
 const id=$('weekWorkoutSelect').value,p=weekly.plans.find(p=>p.id===id);
 $('weekWorkoutName').value=p?.title||'';
 $('weekWorkoutName').disabled=!p;
 $('weekExerciseOptions').innerHTML=editorExercises.map(ex=>'<label class="week-exercise"><input type="checkbox" value="'+escapeHTML(ex.id)+'"'+(p?.ids.includes(ex.id)?' checked':'')+(p?'':' disabled')+'><span>'+escapeHTML(ex.name)+'</span></label>').join('');
 $('weekExerciseSearch').value='';
}
function saveWeekEditor(){
 const day=Number($('weekEditor').dataset.day),id=$('weekWorkoutSelect').value||null;
 try{
  let candidate=weekly;
  if(id){
   const title=$('weekWorkoutName').value.trim();
   const selected=[...$('weekExerciseOptions').querySelectorAll('input:checked')].map(input=>input.value);
   candidate=weeklyAPI.edit(candidate,id,{title,ids:selected},allowedExerciseIds);
  }
  candidate=weeklyAPI.assign(candidate,day,id);
  commitWeekly(candidate);
  renderWeekBoard();renderHome();renderWorkouts();renderOriginalProgress();
  notice('Saved '+weeklyAPI.DAYS[day]+' workout. Home and workout details now match.');
 }catch(error){notice(error.message)}
}
function createWeekWorkout(){
 try{
  const id='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
  const candidate=weeklyAPI.add(weekly,id,{title:'My Custom Workout',ids:[editorExercises[0].id]},allowedExerciseIds);
  commitWeekly(candidate);$('weekWorkoutSelect').innerHTML='<option value="">Rest day</option>'+weekly.plans.map(p=>'<option value="'+escapeHTML(p.id)+'">'+escapeHTML(p.title)+'</option>').join('');
  $('weekWorkoutSelect').value=id;updateWeekEditor();
  notice('Custom workout created. Choose exercises and save the day.');
 }catch(error){notice(error.message)}
}

const $=(id)=>document.getElementById(id);
let page='home',activePlan=null,session=null,guest=true,account=null,auth=null;
let demoSessions=loadDemo();
let originalHistory=[];
let importedHistoryOwner=null;
let originalTracking=null,importedTrackingOwner=null;
let originalAccountSettings=null,importedSettingsOwner=null;
let toastTimer;
let muscleFilter='';
let restSeconds=90,restPaused=true,restClock=null;
function loadDemo(){try{const a=JSON.parse(localStorage.getItem(DEMO_KEY)||'[]');return Array.isArray(a)?a.filter(x=>x&&Array.isArray(x.sets)).slice(0,100):[]}catch{return []}}
function storeDemo(){localStorage.setItem(DEMO_KEY,JSON.stringify(demoSessions))}
function escapeHTML(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function notice(message){const t=$('toast');t.textContent=message;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,3400)}
function setPage(next){if(!['welcome','home','workouts','library','progress','settings','coaching','nutrition'].includes(next))return;page=next;
 document.querySelectorAll('.page').forEach(el=>el.hidden=el.id!==next);
 document.querySelectorAll('[data-page]').forEach(el=>{const is=el.dataset.page===next;el.classList.toggle('selected',is);el.classList.toggle('active',is);if(is)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
 $('pageTitle').textContent=({welcome:'Welcome',home:'Home',workouts:'Workouts',library:'Exercise library',progress:'Progress',settings:'My Account',coaching:'Coaching',nutrition:'Nutrition'})[next];
 $('sidebar').classList.remove('open');$('sidebarScrim').classList.remove('open');document.body.classList.remove('sidebar-is-open');$('menuBtn').setAttribute('aria-expanded','false');$('moreMenuBtn').setAttribute('aria-expanded','false');$('sidebar').inert=window.matchMedia('(max-width:760px)').matches;document.body.classList.toggle('welcome-view',next==='welcome');window.scrollTo({top:0,behavior:'instant'});
 if(next==='home')renderHome();if(next==='workouts')renderWorkouts();if(next==='library')renderLibrary();
 if(next==='progress')renderProgress();if(next==='coaching')renderCoach();if(next==='nutrition')renderOriginalTracking();if(next==='settings'){renderSettings();renderOriginalAccountSettings();}
}
function totalSets(){return demoSessions.reduce((n,x)=>n+x.sets.length,0)}

function renderHome(){
 $('metricWorkouts').textContent=demoSessions.length;
 $('metricSets').textContent=totalSets();
 const today=resolvedWorkout(),plan=today.plan;
 $('todayTitle').textContent=plan?.title||'Rest day';
 $('todayDescription').textContent=plan?today.dayName+' · '+plan.ids.length+' exercises · '+(plan.ids.length*3)+' sets':'Rest scheduled for '+today.dayName+' · tap a day to change';
 $('todayExercises').innerHTML=plan?plan.ids.map(id=>{const e=exerciseById(id);return '<div class="preview-exercise"><strong>'+escapeHTML(e.name)+'</strong><small>'+e.sets+' × '+escapeHTML(e.reps)+'</small></div>'}).join(''):'<p class="small">No workout assigned today. Pick a day to edit your schedule.</p>';
 $('heroStart').disabled=!plan;$('todayStart').disabled=!plan;
 renderWeekBoard();
 $('recentActivity').innerHTML=demoSessions.length?demoSessions.slice(0,3).map(x=>'<div class="recent-item"><div><strong>'+escapeHTML(x.title)+'</strong><small>'+new Date(x.created).toLocaleDateString()+'</small></div><span>'+x.sets.length+' sets</span></div>').join(''):'<div class="empty-note">Your next session starts here. Practice workouts you complete in this demo will appear in this section.</div>';
}
function renderWorkouts(){
 renderWeekBoard();
 renderOriginalCustomSchedule();
 $('weeklyDraftError').textContent=weeklyDraftReadError?'A previously saved local schedule could not be read safely: '+weeklyDraftReadError:'';
 const visible=originalPreviewActive()?[...originalCustomSchedule.plans,...weekly.plans]:weekly.plans;
 $('workoutGrid').innerHTML=visible.map((p,i)=>'<button type="button" class="workout-card" data-workout="'+p.id+'"><span class="number">SESSION 0'+(i+1)+' · '+escapeHTML(p.kind.toUpperCase())+'</span><h3>'+escapeHTML(p.title)+'</h3><p>'+escapeHTML(p.description)+'</p><div class="workout-meta"><span>'+p.ids.length+' movements · '+p.ids.length*3+' recommended sets</span><b>Open session ↗</b></div></button>').join('');
}
function renderLibrary(){
 const query=$('exerciseSearch').value.trim().toLowerCase();
 const catalog=originalExercises.length?originalExercises:exercises;
 const matches=catalog.filter(ex=>{
  const group=String(ex.muscle||ex.group||'');
  const normalized=group.toLowerCase();
  const selected=muscleFilter.toLowerCase();
  const matchesGroup=!selected||normalized===selected||(selected==='arms'&&['biceps','triceps','forearms'].includes(normalized))||(selected==='legs'&&['quads','hamstrings','calves','glutes','adductors'].includes(normalized))||(selected==='shoulders'&&normalized==='delts');
  return matchesGroup&&(String(ex.name||'')+' '+group).toLowerCase().includes(query);
 });
 document.querySelectorAll('[data-muscle]').forEach(button=>button.classList.toggle('selected',button.dataset.muscle===muscleFilter));
 $('libraryGrid').innerHTML=matches.map(ex=>{
  const group=String(ex.muscle||ex.group||'Other');
  const image=typeof ex.image==='string'&&/^images\/[a-zA-Z0-9_.-]+\.(png|webp|jpg|jpeg|svg)$/.test(ex.image)?'../'+ex.image:'./assets/chest-press.svg';
  const guide=String(ex.how||ex.cue||'');
  const tips=Array.isArray(ex.tips)?ex.tips:[];
  const mistakes=Array.isArray(ex.mistakes)?ex.mistakes:[];
  const notes='<p>'+escapeHTML(guide)+'</p>'+(tips.length?'<strong>Technique tips</strong><ul>'+tips.map(x=>'<li>'+escapeHTML(x)+'</li>').join('')+'</ul>':'')+(mistakes.length?'<strong>Common mistakes</strong><ul>'+mistakes.map(x=>'<li>'+escapeHTML(x)+'</li>').join('')+'</ul>':'');
  return '<article class="library-card reference-exercise"><img class="library-thumb" src="'+escapeHTML(image)+'" alt="" loading="lazy"><div class="library-info"><h3>'+escapeHTML(ex.name)+'</h3><p>'+escapeHTML(group)+(ex.sets?' · '+ex.sets+' sets':'')+(ex.reps?' · '+escapeHTML(ex.reps)+' reps':'')+'</p><details><summary>Technique notes</summary>'+notes+'</details></div><span class="library-chevron">›</span></article>';
 }).join('')||'<p class="empty-note">No exercises match that search.</p>';
}
function renderProgress(){
 const movements=new Set(demoSessions.flatMap(x=>x.sets.map(y=>y.exerciseId)));
 $('progressSessions').textContent=demoSessions.length;$('progressSets').textContent=totalSets();$('progressMovements').textContent=movements.size;
 renderProgressChart();
 renderOriginalHistory();
 renderOriginalProgress();
 $('sessionHistory').innerHTML=demoSessions.length?demoSessions.map(x=>'<div class="recent-item"><div><strong>'+escapeHTML(x.title)+'</strong><small>'+new Date(x.created).toLocaleString()+'</small></div><span>'+x.sets.length+' sets</span></div>').join(''):'<div class="empty-note">No demo sessions recorded yet. Open Workouts to start your first practice session.</div>';
}
function renderProgressChart(){
 const root=$('progressChart');if(!root)return;
 const rows=demoSessions.slice(0,8).reverse();
 if(!rows.length){root.innerHTML='<div class="chart-empty">Your volume chart will appear here after you finish a practice workout.<span>No invented progress numbers.</span></div>';return;}
 const values=rows.map(x=>x.sets.reduce((sum,set)=>sum+Number(set.weight||0)*Number(set.reps||0),0));
 const peak=Math.max(1,...values),count=values.length;
 const xy=values.map((n,i)=>({x:22+(i*(276/Math.max(1,count-1))),y:175-(n/peak)*142}));
 const points=xy.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
 const fill='22,184 '+points+' '+xy[xy.length-1].x.toFixed(1)+',184';
 root.innerHTML='<svg viewBox="0 0 320 220" role="img" aria-label="Training volume trend based on '+count+' locally saved practice sessions"><defs><linearGradient id="volumeFill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#f6d88c" stop-opacity=".48"/><stop offset="1" stop-color="#f6d88c" stop-opacity=".02"/></linearGradient></defs><path d="M22 28 V184 H304" fill="none" stroke="#bbdfd2" stroke-opacity=".35"/><path d="M22 80 H304 M22 132 H304" fill="none" stroke="#bbdfd2" stroke-opacity=".2"/><polygon points="'+fill+'" fill="url(#volumeFill)"/><polyline points="'+points+'" fill="none" stroke="#ffe1a0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+xy.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="3.5" fill="#ffeba8"/>').join('')+'<text x="25" y="207" fill="#c9e5da" font-size="11">Earliest</text><text x="293" y="207" text-anchor="end" fill="#c9e5da" font-size="11">Latest</text></svg><p>'+count+' practice sessions · '+Math.round(values[values.length-1]).toLocaleString()+' lb-reps last session</p>';
}
function renderCoach(){
 const sets=demoSessions.flatMap(x=>Array.isArray(x.sets)?x.sets:[]);
 const movementCount=new Set(sets.map(x=>x.exerciseId).filter(Boolean)).size;
 $('coachSessions').textContent=String(demoSessions.length);
 $('coachSets').textContent=String(sets.length);
 $('coachMovements').textContent=String(movementCount);
 $('coachStatus').textContent=demoSessions.length?'Practice activity recorded':'No practice history yet';
 $('coachDescription').textContent=demoSessions.length?'This is a factual summary of local practice sessions, not an adaptive recommendation.':'Complete a practice workout to view a factual summary of your recent activity.';
 const latest=demoSessions.find(x=>x&&x.created&&Number.isFinite(Date.parse(x.created)));
 $('coachRecent').textContent=latest?'Latest practice session: '+new Date(latest.created).toLocaleDateString()+' · '+String(latest.title||'Workout'):'No completed preview sessions have been saved.';
 renderOriginalCoachEvidence();
}
function renderCoachProgression(){
 const status=$('coachProgressionStatus'),root=$('coachProgressionList');
 if(!status||!root)return;
 root.replaceChildren();
 if(!account?.id||importedHistoryOwner!==account.id){
  status.textContent='Load your original workout history first. No recommendations are being applied.';
  return;
 }
 const evidence=window.MLCOriginalCoachEvidence.summarize(originalHistory);
 status.textContent=evidence.movements.length?'Read-only original progression rules · 8–10 reps · original equipment-specific 2.5 or 5 lb steps. No workout targets changed.':'No qualifying completed workouts available.';
 root.innerHTML=evidence.movements.slice(0,12).map(ex=>{
  const increment=window.MLCExerciseMetadata.increment(ex.id,ex.name);
  const result=window.MLCProgressionPreview.suggest(originalHistory,ex.id,{range:{min:8,max:10},increment});
  const label=result.status==='ready'?('Preview: '+result.action+' to '+result.weight+' lb · '+result.reason):'Not enough qualifying working-set history (at least two completed workouts required).';
  return '<div class="recent-item"><div><strong>'+escapeHTML(ex.name)+'</strong><small>'+escapeHTML(label)+'</small></div><span>'+escapeHTML(String(result.lastWeight||'—'))+' lb last</span></div>';
 }).join('');
}
function renderOriginalRecovery(){
 const status=$('coachRecoveryStatus'),muscles=$('coachRecoveryMuscles'),readiness=$('coachReadinessRecords');
 if(!status||!muscles||!readiness)return;
 muscles.replaceChildren();readiness.replaceChildren();
 if(!account?.id||importedHistoryOwner!==account.id){
  status.textContent='Load verified original account history in Progress to see recently trained muscle groups.';
  return;
 }
 const summary=window.MLCRecoveryPreview.summarize(originalHistory,originalExercises);
 const counts=summary.recordedCheckins;
 const total=counts.Great+counts.Normal+counts.Tired;
 status.textContent=summary.sessionCount+' completed workouts analyzed. Displaying time since each muscle group was trained, not a recovery score.';
 muscles.innerHTML=summary.muscles.length?summary.muscles.map(m=>'<div class="recent-item"><strong>'+escapeHTML(m.name)+'</strong><span>'+Math.floor(m.hoursAgo/24)+' days ago'+(m.within72Hours?' · Within 72h':'')+'</span></div>').join(''):'<p class="small">No original exercise muscle matches were found.</p>';
 readiness.textContent=total?'Original recorded session check-ins: Great '+counts.Great+' · Normal '+counts.Normal+' · Tired '+counts.Tired+'.':'No explicit session readiness labels found in imported completed workouts.';
}
function renderOriginalCoachEvidence(){
 const status=$('coachOriginalStatus'),movements=$('coachOriginalMovements');
 if(!status||!movements)return;
 for(const id of ['Sessions','Days','Sets','Volume'])$('coachOriginal'+id).textContent='—';
 movements.replaceChildren();
 if(!account?.id||importedHistoryOwner!==account.id){
  status.textContent='Sign in and load original history from Progress to view real completed-workout evidence. No adaptive recommendations are active.';
  renderCoachProgression();
  renderOriginalRecovery();
  return;
 }
 const evidence=window.MLCOriginalCoachEvidence.summarize(originalHistory);
 $('coachOriginalSessions').textContent=String(evidence.completedSessions);
 $('coachOriginalDays').textContent=String(evidence.trainingDays);
 $('coachOriginalSets').textContent=String(evidence.loggedSets);
 $('coachOriginalVolume').textContent=Math.round(evidence.totalVolume).toLocaleString();
 status.textContent=evidence.latestDate?'Latest completed workout: '+new Date(evidence.latestDate).toLocaleDateString()+' · '+evidence.latestTitle+'. Historical activity only, not coaching advice.':'No completed workouts in imported history.';
 movements.innerHTML=evidence.movements.slice(0,8).map(ex=>'<div class="recent-item"><div><strong>'+escapeHTML(ex.name)+'</strong><small>'+ex.sessions+' workouts · '+ex.sets+' sets</small></div><span>Best '+ex.bestWeight.toLocaleString()+' lb</span></div>').join('');
 renderCoachProgression();
 renderOriginalRecovery();
}
function renderOriginalProgress(){
 const status=$('originalProgressStatus'),root=$('originalRecords');
 if(!status||!root)return;
 const ready=Boolean(account?.id&&importedHistoryOwner===account.id);
 for(const id of ['Sessions','Sets','Exercises','Volume'])$('originalProgress'+id).textContent='—';
 root.replaceChildren();
 if(!ready){status.textContent='Load your original history to view your workout progress and personal records.';return;}
 const result=window.MLCOriginalProgress.analyze(originalHistory);
 $('originalProgressSessions').textContent=String(result.sessions);
 $('originalProgressSets').textContent=String(result.sets);
 $('originalProgressExercises').textContent=String(result.exercises);
 $('originalProgressVolume').textContent=Math.round(result.volume).toLocaleString();
 status.textContent=result.sessions?result.trainingDays+' distinct training days · based on original completed workouts only. Estimates are not measured 1RM values.':'No completed original workouts found for this account.';
 if(!result.records.length)return;
 root.innerHTML='<h3>Exercise records</h3>'+result.records.map(ex=>'<details class="recent-item"><summary><strong>'+escapeHTML(ex.name)+'</strong> · Best weight '+ex.weight.toLocaleString()+' lb</summary><p>Most reps in a set: '+ex.reps+' · Best set volume: '+Math.round(ex.setVolume).toLocaleString()+' lb · Estimated 1RM (sets up to 10 reps): '+(ex.estimatedOneRepMax?Math.round(ex.estimatedOneRepMax).toLocaleString()+' lb':'Unavailable')+'</p></details>').join('');
}
function clearOriginalHistory(){
 originalHistory=[];importedHistoryOwner=null;
 renderOriginalHistory();
 renderOriginalProgress();
 renderOriginalCoachEvidence();
}
function renderOriginalHistory(){
 const status=$('originalHistoryStatus'),root=$('originalHistory'),button=$('loadOriginalHistory');
 if(!status||!root||!button)return;
 button.disabled=!account;
 if(!account){status.textContent='Sign in with your existing account first.';root.replaceChildren();return;}
 if(importedHistoryOwner!==account.id){status.textContent='Ready to load read-only original workout history.';root.replaceChildren();return;}
 status.textContent=originalHistory.length?originalHistory.length+' original completed workouts loaded (read only).':'No completed original workouts were returned for this account.';
 root.innerHTML=originalHistory.slice(0,200).map(item=>{
  const sets=item.exercises.flatMap(ex=>ex.sets);
  const volume=sets.reduce((n,s)=>n+s.weight*s.reps,0);
  const details=item.exercises.map(ex=>'<div class="recent-item"><div><strong>'+escapeHTML(ex.name)+'</strong><small>'+ex.sets.length+' sets</small></div><span>'+Math.round(ex.sets.reduce((n,s)=>n+s.weight*s.reps,0)).toLocaleString()+' lb</span></div>').join('');
  return '<details class="panel"><summary><strong>'+escapeHTML(item.workoutTitle)+'</strong> · '+new Date(item.date).toLocaleDateString()+' · '+sets.length+' sets · '+Math.round(volume).toLocaleString()+' lb</summary>'+details+'</details>';
 }).join('');
}
async function loadOriginalHistory(){
 if(!account?.id||!auth?.access_token){notice('Sign in first to load your original history.');return;}
 const button=$('loadOriginalHistory'),status=$('originalHistoryStatus');
 const owner=account.id;
 button.disabled=true;status.textContent='Reading original account history securely…';
 try{
  await validateStoredAuth();
  if(account?.id!==owner||!auth?.access_token)throw Error('Account session is no longer valid');
  const history=await window.MLCOriginalHistory.load({endpoint:BACKEND,publishableKey:PUBLIC_KEY,accessToken:auth.access_token,userId:owner});
  if(account?.id!==owner)throw Error('Account changed during import');
  originalHistory=history;importedHistoryOwner=owner;renderOriginalHistory();renderOriginalProgress();renderOriginalCoachEvidence();
 }catch(error){
  originalHistory=[];importedHistoryOwner=null;renderOriginalHistory();renderOriginalProgress();renderOriginalCoachEvidence();
  status.textContent='Could not load original history: '+String(error.message||error).slice(0,180);
 }finally{button.disabled=!account}
}
function clearOriginalTracking(){
 originalTracking=null;importedTrackingOwner=null;renderOriginalTracking();
}
function renderOriginalTracking(){
 const status=$('trackingStatus'),button=$('loadOriginalTracking');
 if(!status||!button)return;
 button.disabled=!account;
 const valid=Boolean(account?.id&&importedTrackingOwner===account.id&&originalTracking);
 for(const id of ['Water','Food','Weight'])$('tracking'+id+'Count').textContent=valid?String(originalTracking[id.toLowerCase()].length):'—';
 $('trackingGoals').textContent=valid?'Logged water goal: '+(originalTracking.waterGoal?Math.round(originalTracking.waterGoal)+' mL':'Not set')+' · Calorie goal: '+(originalTracking.calorieGoal??'Not set')+' · Saved meals: '+originalTracking.savedMeals+' · Food favorites: '+originalTracking.foodFavorites:'';
 for(const id of ['Water','Food','Weight'])$('tracking'+id+'List').replaceChildren();
 if(!account?.id){status.textContent='Sign in to view your original tracking history.';return;}
 if(!valid){status.textContent='Ready to load original tracking without modifying any records.';return;}
 status.textContent='Read-only original tracking data loaded for the signed-in account.';
 const order=(a,b)=>b.day.localeCompare(a.day);
 const water=originalTracking.water.slice().sort(order).slice(0,100);
 $('trackingWaterList').innerHTML=water.map(x=>'<div class="recent-item"><strong>'+escapeHTML(x.day)+'</strong><span>'+Math.round(x.amount)+' mL</span></div>').join('')||'<p class="small">No water records found.</p>';
 const food=originalTracking.food.slice().sort(order).slice(0,100);
 $('trackingFoodList').innerHTML=food.map(x=>'<div class="recent-item"><div><strong>'+escapeHTML(x.name)+'</strong><small>'+escapeHTML(x.day)+'</small></div><span>'+x.calories+' cal</span></div>').join('')||'<p class="small">No food records found.</p>';
 const weight=originalTracking.weight.slice().sort(order).slice(0,100);
 $('trackingWeightList').innerHTML=weight.map(x=>'<div class="recent-item"><strong>'+escapeHTML(x.day)+'</strong><span>'+x.value+' lb</span></div>').join('')||'<p class="small">No weight records found.</p>';
}
async function loadOriginalTracking(){
 if(!account?.id||!auth?.access_token){notice('Sign in before loading original tracking.');return;}
 const owner=account.id,button=$('loadOriginalTracking'),status=$('trackingStatus');
 button.disabled=true;status.textContent='Reading original account tracking records…';
 try{
  await validateStoredAuth();
  if(account?.id!==owner||!auth?.access_token)throw Error('Account session expired or changed');
  const data=await window.MLCOriginalTracking.load({endpoint:BACKEND,publishableKey:PUBLIC_KEY,accessToken:auth.access_token,userId:owner});
  if(account?.id!==owner)throw Error('Account changed while loading tracking data');
  originalTracking=data;importedTrackingOwner=data?owner:null;
  renderOriginalTracking();
  if(!data)status.textContent='No original tracking records returned for this account.';
 }catch(error){
  clearOriginalTracking();
  status.textContent='Could not load original tracking: '+String(error.message||error).slice(0,170);
 }finally{button.disabled=!account}
}
function clearOriginalAccountSettings(){
 originalAccountSettings=null;importedSettingsOwner=null;renderOriginalAccountSettings();
}
function renderOriginalAccountSettings(){
 const button=$('loadOriginalSettings'),status=$('originalSettingsStatus'),details=$('originalSettingsDetails');
 if(!button||!status||!details)return;
 button.disabled=!account;
 details.replaceChildren();
 if(!account){status.textContent='Sign in to load the original settings.';return;}
 if(importedSettingsOwner!==account.id||!originalAccountSettings){status.textContent='Ready to load original profile and training goals.';return;}
 const value=originalAccountSettings;
 status.textContent='Original account profile and goals loaded read-only.';
 const rows=[['Display name',value.displayName||'Not set'],['Avatar style',value.avatarId],['Onboarding',value.onboardingComplete?'Completed':'Not recorded complete'],['Training goal',value.trainingGoal||'Not set'],['Training days per week',value.days??'Not set'],['Focus',value.trainingFocus||'Not set'],['Program mode',value.workoutMode]];
 details.innerHTML=rows.map(([name,val])=>'<div class="recent-item"><strong>'+escapeHTML(name)+'</strong><span>'+escapeHTML(String(val))+'</span></div>').join('');
}
async function loadOriginalAccountSettings(){
 if(!account?.id||!auth?.access_token){notice('Sign in before loading your account settings.');return;}
 const owner=account.id,status=$('originalSettingsStatus'),button=$('loadOriginalSettings');
 button.disabled=true;status.textContent='Reading original profile and goals…';
 try{
  await validateStoredAuth();
  if(account?.id!==owner||!auth?.access_token)throw Error('Account changed or session expired');
  const result=await window.MLCOriginalAccountSettings.load({endpoint:BACKEND,publishableKey:PUBLIC_KEY,accessToken:auth.access_token,userId:owner});
  if(account?.id!==owner)throw Error('Account changed during settings read');
  originalAccountSettings=result;importedSettingsOwner=owner;renderOriginalAccountSettings();
 }catch(err){
  clearOriginalAccountSettings();
  status.textContent='Original settings could not be loaded: '+String(err.message||err).slice(0,160);
 }finally{button.disabled=!account}
}
function renderSettings(){
 $('accountIdentity').textContent=account?.email?account.email+' · authenticated (production workout data is not loaded)':'Not signed in. You can still explore the demo.';
 $('backendStatus').textContent=account?'AUTHENTICATED':'NOT CONNECTED';
 $('cloudPill').textContent=account?'ACCOUNT CONNECTED · DEMO':'DEMO WORKSPACE';
 $('authAction').textContent=account?'Sign out':'Sign in with existing account';
}
function openModal(content){$('modalContent').innerHTML=content;$('modal').hidden=false;document.body.style.overflow='hidden';$('closeModal').focus()}
function closeModal(){closeRest();$('modal').hidden=true;document.body.style.overflow='';activePlan=null;session=null}
function openWorkout(id){
 const plan=(originalPreviewActive()?originalCustomSchedule.plans:[]).find(x=>x.id===id)||weekly.plans.find(x=>x.id===id);if(!plan)return;activePlan={...plan,ids:plan.ids.slice()};
 session={sets:[]};
 openModal('<div class="modal-eyebrow">PRACTICE SESSION · LOCAL ONLY</div><h2>'+escapeHTML(plan.title)+'</h2><p>'+escapeHTML(plan.description)+' All entries stay in the isolated demo workspace and will not be uploaded to Supabase.</p><div id="workoutLog" class="workout-log"></div><div class="modal-footer"><button type="button" class="button-outline" id="cancelWorkout">Cancel</button><button type="button" class="button-outline" id="startRest">Rest 1:30</button><button type="button" class="button-primary" id="finishWorkout">Finish session</button></div>');
 renderWorkoutLog();
 $('cancelWorkout').addEventListener('click',closeModal);
 $('startRest').addEventListener('click',openRest);
 $('finishWorkout').addEventListener('click',()=>{
  if(!session?.sets.length){notice('Add at least one practice set first.');return}
  const entry={id:'demo-'+Date.now(),created:new Date().toISOString(),title:plan.title,planId:plan.id,sets:session.sets};
  demoSessions.unshift(entry);demoSessions=demoSessions.slice(0,100);
  try{storeDemo();closeModal();renderHome();setPage('progress');notice('Practice session saved in this browser.')}catch{notice('Could not save demo session; check browser storage.')}
 });
}
function renderWorkoutLog(){
 if(!activePlan)return;
 $('workoutLog').innerHTML=activePlan.ids.map(id=>{
  const e=exerciseById(id);
  const count=session.sets.filter(x=>x.exerciseId===id).length;
  return '<article class="log-card" data-exercise-card="'+id+'"><div class="log-title"><h4>'+escapeHTML(e.name)+'</h4><span class="logged-count" data-count="'+id+'">'+count+' logged</span></div><small>Target: '+e.sets+' sets × '+escapeHTML(e.reps)+' reps</small><div class="inputs"><label>Weight (lb)<input aria-label="'+escapeHTML(e.name)+' weight in pounds" type="number" min="0" max="1500" step="2.5" inputmode="decimal" data-weight="'+id+'" value="40"></label><label>Reps<input aria-label="'+escapeHTML(e.name)+' repetitions" type="number" min="1" max="100" step="1" inputmode="numeric" data-reps="'+id+'" value="10"></label><button class="button-outline" data-addset="'+id+'" type="button">Log set</button></div><div class="set-feedback" data-feedback="'+id+'" role="status" aria-live="polite"></div><button class="undo-set" data-undo="'+id+'" type="button" hidden>Undo last set</button></article>'
 }).join('');
}
function updateExerciseFeedback(id){
 const sets=session.sets.filter(x=>x.exerciseId===id);
 const count=document.querySelector('[data-count="'+id+'"]');
 const feedback=document.querySelector('[data-feedback="'+id+'"]');
 const undo=document.querySelector('[data-undo="'+id+'"]');
 if(count)count.textContent=sets.length+' logged';
 if(feedback)feedback.textContent=sets.length?('Last set: '+sets[sets.length-1].weight+' lb × '+sets[sets.length-1].reps+' reps'):'';
 if(undo)undo.hidden=sets.length===0;
}
function addSet(id){
 if(!session||!activePlan?.ids.includes(id))return;
 const weightField=document.querySelector('[data-weight="'+id+'"]');
 const repsField=document.querySelector('[data-reps="'+id+'"]');
 if(!weightField||!repsField)return;
 const weight=Number(weightField.value),reps=Number(repsField.value);
 if(weightField.value.trim()===''||repsField.value.trim()===''||!Number.isFinite(weight)||weight<0||weight>1500||!Number.isInteger(reps)||reps<1||reps>100){
  notice('Enter a valid weight and rep count.');return;
 }
 session.sets.push({exerciseId:id,weight,reps});
 // Update only this exercise: never erase inputs, keyboard focus, or scroll position.
 updateExerciseFeedback(id);
}
function undoSet(id){
 if(!session||!activePlan?.ids.includes(id))return;
 const index=session.sets.findLastIndex(x=>x.exerciseId===id);
 if(index<0)return;
 session.sets.splice(index,1);
 updateExerciseFeedback(id);
}
function stopRestClock(){
 if(restClock!==null){clearInterval(restClock);restClock=null;}
}
function updateRestClock(){
 const mins=Math.floor(restSeconds/60),secs=restSeconds%60;
 $('restTime').textContent=mins+':'+String(secs).padStart(2,'0');
 $('restDial').style.setProperty('--rest-fraction',String(Math.min(1,Math.max(0,restSeconds/90))));
 $('restPause').textContent=restPaused?'▶':'Ⅱ';
 $('restPause').setAttribute('aria-label',restPaused?'Resume rest timer':'Pause rest timer');
}
function closeRest(){
 stopRestClock();restPaused=true;$('restScreen').hidden=true;
 document.body.style.overflow=$('modal').hidden?'':'hidden';
}
function openRest(){
 restSeconds=90;restPaused=false;
 let next=activePlan?.ids.find(id=>!session?.sets.some(set=>set.exerciseId===id))||activePlan?.ids[0];
 const e=exercises.find(x=>x.id===next);
 $('restNextName').textContent=e?.name||'Continue workout';
 $('restNextReps').textContent=e?e.sets+' sets · '+e.reps+' reps':'';
 $('restScreen').hidden=false;
 document.body.style.overflow='hidden';
 stopRestClock();updateRestClock();
 // Use wall-clock elapsed time so an iPhone screen lock does not stretch the timer.
 let tickAt=Date.now();
 restClock=setInterval(()=>{
  const now=Date.now();
  if(!restPaused){restSeconds=Math.max(0,restSeconds-Math.round((now-tickAt)/1000));}
  tickAt=now;updateRestClock();
  if(restSeconds===0){closeRest();notice('Rest complete — ready for the next set.')}
 },1000);
}
async function authRequest(path,body,token,method='POST'){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
 try{
  const headers={'apikey':PUBLIC_KEY,'Content-Type':'application/json'};
  if(token)headers.Authorization='Bearer '+token;
  const res=await fetch(BACKEND+'/auth/v1/'+path,{method,headers,body:body?JSON.stringify(body):undefined,signal:ctrl.signal,cache:'no-store'});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){const error=new Error(data.error_description||data.msg||data.message||('HTTP '+res.status));error.status=res.status;throw error}
  return data;
 }finally{clearTimeout(timer)}
}
function saveAuth(data){
 const session={access_token:data.access_token,refresh_token:data.refresh_token,user:data.user,expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600)};
 if(account?.id&&account.id!==data.user?.id){clearOriginalHistory();clearOriginalTracking();clearOriginalAccountSettings();clearOriginalCustomSchedule();}sessionStorage.setItem(AUTH_KEY,JSON.stringify(session));auth=session;account=data.user;refreshWeeklyOwner();renderHome();renderWorkouts();renderSettings();renderOriginalHistory();
}
function clearAuth(){sessionStorage.removeItem(AUTH_KEY);auth=null;account=null;clearOriginalHistory();clearOriginalTracking();clearOriginalAccountSettings();clearOriginalCustomSchedule();refreshWeeklyOwner();renderHome();renderWorkouts();renderSettings()}
async function validateStoredAuth(){
 try{
  const saved=JSON.parse(sessionStorage.getItem(AUTH_KEY)||'null');
  if(!saved?.access_token||!saved?.user?.id)return;
  let token=saved.access_token;
  if(saved.expires_at<Date.now()/1000+45&&saved.refresh_token){
    const refreshed=await authRequest('token?grant_type=refresh_token',{refresh_token:saved.refresh_token});
    saveAuth(refreshed);token=refreshed.access_token;
  }else{auth=saved;account=saved.user;refreshWeeklyOwner();renderHome();renderWorkouts()}
  const user=await authRequest('user',null,token,'GET');
  if(!user?.id||user.id!==account.id)clearAuth();
 }catch{clearAuth()}
 renderSettings();renderOriginalHistory();
}
function openSignIn(){
 openModal('<div class="modal-eyebrow">EXISTING SUPABASE ACCOUNT</div><h2>Welcome back</h2><p>Use the email and password from your original MYLIFTCOACH account. This only verifies your identity; it will not import, overwrite, or modify workout records.</p><form id="loginForm" class="login-form"><label>Email<input name="email" type="email" autocomplete="email" autocapitalize="none" required></label><label>Password<input name="password" type="password" autocomplete="current-password" minlength="6" required></label><button class="button-primary" id="loginSubmit" type="submit">Sign in securely</button></form><p id="loginMessage" role="status"></p><p class="small">The training area stays in demo mode until the legacy data mapping is verified.</p>');
 $('loginForm').addEventListener('submit',async event=>{
  event.preventDefault();const submit=$('loginSubmit');submit.disabled=true;submit.textContent='Connecting…';$('loginMessage').textContent='';
  const form=new FormData(event.currentTarget);
  try{
   const response=await authRequest('token?grant_type=password',{email:String(form.get('email')).trim(),password:String(form.get('password'))});
   if(!response?.access_token||!response?.user?.id)throw Error('No verified account was returned.');
   saveAuth(response);closeModal();notice('Account verified. This workspace remains demo-only.');setPage('home');
  }catch(err){$('loginMessage').className='auth-error';$('loginMessage').textContent=err.name==='AbortError'?'The account service timed out.':/invalid/i.test(err.message)?'Email or password was not accepted.':'Could not sign in: '+String(err.message).slice(0,120)}
  finally{submit.disabled=false;submit.textContent='Sign in securely'}
 });
}
function bind(){
 document.querySelectorAll('[data-page]').forEach(el=>el.addEventListener('click',()=>setPage(el.dataset.page)));
 $('avatarBtn').addEventListener('click',()=>setPage('settings'));
 $('previewWelcome').addEventListener('click',()=>setPage('welcome'));
 $('welcomeExplore').addEventListener('click',()=>setPage('home'));
 $('welcomeSignIn').addEventListener('click',openSignIn);
 document.querySelectorAll('[data-shortcut]').forEach(el=>el.addEventListener('click',()=>setPage(el.dataset.shortcut)));
 document.querySelectorAll('[data-coach-link]').forEach(el=>el.addEventListener('click',()=>setPage(el.dataset.coachLink)));

 const sidebar=$('sidebar');
 const mobileSidebar=window.matchMedia('(max-width:760px)');
 let sidebarReturnFocus=null;
 function syncSidebarState(){
  const opened=sidebar.classList.contains('open');
  const mobile=mobileSidebar.matches;
  sidebar.inert=mobile&&!opened;
  $('menuBtn').setAttribute('aria-expanded',String(mobile&&opened));
  $('moreMenuBtn').setAttribute('aria-expanded',String(mobile&&opened));
  $('sidebarScrim').classList.toggle('open',mobile&&opened);
  document.body.classList.toggle('sidebar-is-open',mobile&&opened);
 }
 function openSidebar(){
  if(!mobileSidebar.matches){sidebar.scrollIntoView({block:'nearest'});return}
  sidebarReturnFocus=document.activeElement;
  sidebar.classList.add('open');syncSidebarState();$('sidebarClose').focus();
 }
 function closeSidebar(){
  if(!sidebar.classList.contains('open'))return;
  if(sidebar.contains(document.activeElement)&&sidebarReturnFocus?.focus)sidebarReturnFocus.focus();
  sidebar.classList.remove('open');syncSidebarState();
 }
 $('menuBtn').addEventListener('click',()=>sidebar.classList.contains('open')?closeSidebar():openSidebar());
 $('moreMenuBtn').addEventListener('click',openSidebar);
 document.querySelectorAll('[data-sidebar-open]').forEach(el=>el.addEventListener('click',openSidebar));
 $('sidebarClose').addEventListener('click',closeSidebar);
 $('sidebarScrim').addEventListener('click',closeSidebar);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSidebar()});
 mobileSidebar.addEventListener('change',()=>{sidebar.classList.remove('open');syncSidebarState()});
 syncSidebarState();
 $('heroStart').addEventListener('click',()=>openToday());
 $('heroViewPlan').addEventListener('click',()=>setPage('workouts'));
 $('todayStart').addEventListener('click',()=>openWorkout(nextPlan().id));
 $('workoutGrid').addEventListener('click',e=>{const el=e.target.closest('[data-workout]');if(el)openWorkout(el.dataset.workout)});
 for(const key of ['weeklyBoardHome','weeklyBoardWorkouts'])$(key).addEventListener('click',e=>{const btn=e.target.closest('[data-week-day]');if(btn)chooseWeekday(Number(btn.dataset.weekDay))});
 $('weekWorkoutSelect').addEventListener('change',updateWeekEditor);
 $('weekExerciseSearch').addEventListener('input',()=>{
  const q=$('weekExerciseSearch').value.trim().toLowerCase();
  $('weekExerciseOptions').querySelectorAll('.week-exercise').forEach(label=>{label.hidden=!label.textContent.toLowerCase().includes(q)});
 });
 $('weekSaveButton').addEventListener('click',saveWeekEditor);
 $('weekNewWorkout').addEventListener('click',createWeekWorkout);

 $('exerciseSearch').addEventListener('input',renderLibrary);
 $('libraryChips').addEventListener('click',event=>{const el=event.target.closest('[data-muscle]');if(!el)return;muscleFilter=el.dataset.muscle;renderLibrary()});
 document.querySelectorAll('[data-account-page]').forEach(el=>el.addEventListener('click',()=>setPage(el.dataset.accountPage)));

 $('modalContent').addEventListener('click',e=>{const add=e.target.closest('[data-addset]');if(add){addSet(add.dataset.addset);return}const undo=e.target.closest('[data-undo]');if(undo)undoSet(undo.dataset.undo)});
 $('closeModal').addEventListener('click',closeModal);
 $('restClose').addEventListener('click',closeRest);
 $('restSkip').addEventListener('click',closeRest);
 $('restPause').addEventListener('click',()=>{restPaused=!restPaused;updateRestClock()});
 $('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('modal').hidden)closeModal()});
 $('clearDemo').addEventListener('click',()=>{if(!confirm('Delete only MYLIFTCOACH 2.0 practice sessions stored in this browser?'))return;demoSessions=[];localStorage.removeItem(DEMO_KEY);renderProgress();renderHome();notice('Local demo history cleared. Production data untouched.')});
 $('loadOriginalHistory').addEventListener('click',loadOriginalHistory);
 $('loadOriginalTracking').addEventListener('click',loadOriginalTracking);
 $('loadOriginalCustom').addEventListener('click',loadOriginalCustomSchedule);
 $('toggleOriginalCustom').addEventListener('click',toggleOriginalCustomSchedule);
 $('copyOriginalCustom').addEventListener('click',copyOriginalToEditable);
 $('inspectRecurringMigration').addEventListener('click',inspectCompleteRecurringMigration);
 $('activateFullRecurring').addEventListener('click',activateCompleteRecurringLocally);
 $('loadOriginalSettings').addEventListener('click',loadOriginalAccountSettings);
 $('authAction').addEventListener('click',()=>{if(!account){openSignIn();return}clearAuth();notice('Signed out of 2.0. Original app session remains unchanged.')});
}
refreshWeeklyOwner();bind();renderOriginalCustomSchedule();renderHome();renderWorkouts();renderLibrary();renderProgress();renderCoach();renderOriginalTracking();renderSettings();renderOriginalAccountSettings();validateStoredAuth();
})();