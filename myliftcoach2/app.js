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
const originalExercises=Array.isArray(window.MLCCompleteOriginalExercises)&&window.MLCCompleteOriginalExercises.length===341?
 window.MLCCompleteOriginalExercises:(Array.isArray(window.MLCOriginalExercises)?window.MLCOriginalExercises:[]);
const WEEKLY_KEY='mlc2-weekly-preview-v1';
const RECURRING_KEY='mlc2-recurring-preview-v1';
const recurringDraftAPI=window.MLCRecurringDraft;
const weeklyAPI=window.MLCWeeklySchedule;
let fullCatalogLoadError=null,verifiedFullCatalog=null;
try{verifiedFullCatalog=window.MLCFullExerciseImport.load(localStorage,originalExercises)}
catch(error){fullCatalogLoadError=String(error.message||error)}
const editorExercises=window.MLCV2ExerciseCatalog.merge(verifiedFullCatalog||originalExercises,exercises);
function prepareLibraryEquipment(){
 const control=document.getElementById('libraryEquipment');
 if(!control)return;
 const gear=[...new Set(editorExercises.map(libraryEquipment))].filter(Boolean).sort((a,b)=>a.localeCompare(b));
 control.innerHTML='<option value="">All equipment</option>'+gear.map(item=>'<option value="'+escapeHTML(item)+'">'+escapeHTML(item)+'</option>').join('');
}
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
function clearOriginalCustomSchedule(){customScheduleLoadEpoch++;originalCustomSchedule=null;importedCustomOwner=null;originalSchedulePreview=false;fullMigrationPreview=null;renderOriginalCustomSchedule();if($('recurringMigrationStatus'))$('recurringMigrationStatus').textContent='';}
async function loadOriginalCustomSchedule(){
 if(!account?.id||!auth?.access_token){notice('Sign in to load original custom workouts.');return;}
 const owner=account.id,epoch=++customScheduleLoadEpoch,button=$('loadOriginalCustom'),status=$('originalCustomStatus');
 button.disabled=true;status.textContent='Reading original custom workouts and dates…';
 try{
  await validateStoredAuth();
  if(account?.id!==owner||!auth?.access_token)throw Error('Session changed');
  const data=await window.MLCOriginalCustomSchedule.load({endpoint:BACKEND,publishableKey:PUBLIC_KEY,accessToken:auth.access_token,userId:owner,validExerciseIds:allowedExerciseIds});
  if(account?.id!==owner||customScheduleLoadEpoch!==epoch)return;
  originalCustomSchedule=data;importedCustomOwner=owner;originalSchedulePreview=true;fullMigrationPreview=null;$('recurringMigrationStatus').textContent='';renderOriginalCustomSchedule();renderHome();renderWorkouts();
 }catch(error){
  if(account?.id!==owner||customScheduleLoadEpoch!==epoch)return;
  clearOriginalCustomSchedule();status.textContent='Import failed: '+String(error.message||error).slice(0,160);
 }finally{if(customScheduleLoadEpoch===epoch)button.disabled=!account}
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
function commitWeekly(candidate,explicitDay=null){
 if(weeklyDraftReadError)throw Error('Saved schedule needs recovery before editing: '+weeklyDraftReadError);
 if(activeRecurring){
  let document=recurringDraftAPI.edited(activeRecurring,candidate,allowedExerciseIds);
  if(explicitDay){
   // A direct weekday edit must appear on Home/Start even when a migrated
   // recurring rule already covers this date. Keep all other dated rules.
   // Null is an explicit one-date rest-day exception, not a deleted repeat.
   const d=dayAtWeekIndex(explicitDay.day);
   const date=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
   document={...document,overrides:{...document.overrides,[date]:explicitDay.id}};
  }
  recurringDraftAPI.commit(localStorage,RECURRING_KEY,scheduleOwner(),document,allowedExerciseIds);
  activeRecurring=document;weekly=candidate;
 }else{
  weekly=weeklyAPI.commitOwned(localStorage,WEEKLY_KEY,scheduleOwner(),candidate,plans.map(p=>p.id));
  fullMigrationPreview=null;
  renderOriginalCustomSchedule();
 }
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
 const current=resolvedWorkout(dayAtWeekIndex(day)).plan;
 choice.value=current?.id||'';
 updateWeekEditor();
 refreshRestoreRepeating();
 setPage('workouts');target.hidden=false;
 target.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function selectedWeekDate(){
 const day=Number($('weekEditor').dataset.day);
 if(!Number.isInteger(day)||day<0||day>6)throw Error('Select a weekday first');
 const value=dayAtWeekIndex(day);
 return [value.getFullYear(),String(value.getMonth()+1).padStart(2,'0'),String(value.getDate()).padStart(2,'0')].join('-');
}
function refreshRestoreRepeating(){
 const button=$('weekRestoreRepeating');
 if(!button)return;
 const date=$('weekEditor').dataset.day===undefined?null:selectedWeekDate();
 button.hidden=!(activeRecurring&&date&&Object.prototype.hasOwnProperty.call(activeRecurring.overrides,date)&&!originalPreviewActive());
}
function restoreRepeatingForDate(){
 try{
  if(!activeRecurring||originalPreviewActive()||weeklyDraftReadError)throw Error('Editable recurring schedule required');
  const date=selectedWeekDate();
  const result=recurringDraftAPI.restoreDate(activeRecurring,date,allowedExerciseIds);
  recurringDraftAPI.commit(localStorage,RECURRING_KEY,scheduleOwner(),result,allowedExerciseIds);
  activeRecurring=result;
  const plan=resolvedWorkout(dayAtWeekIndex(Number($('weekEditor').dataset.day))).plan;
  $('weekWorkoutSelect').value=plan?.id||'';
  updateWeekEditor();refreshRestoreRepeating();
  renderWeekBoard();renderHome();renderWorkouts();
  notice('Repeating workout restored for this date; future rules preserved.');
 }catch(error){notice(error.message)}
}
function prepareWeekLibraryFilters(){
 const muscle=$('weekExerciseMuscle'),equipment=$('weekExerciseEquipment');
 const groups=[...new Set(editorExercises.map(ex=>String(ex.muscle||ex.group||'Other')))].sort();
 const gears=[...new Set(editorExercises.map(ex=>libraryEquipment(ex)))].sort();
 muscle.innerHTML='<option value="">All muscles</option>'+groups.map(x=>'<option value="'+escapeHTML(x)+'">'+escapeHTML(x)+'</option>').join('');
 equipment.innerHTML='<option value="">All equipment</option>'+gears.map(x=>'<option value="'+escapeHTML(x)+'">'+escapeHTML(x)+'</option>').join('');
}
function filterWeekEditorExercises(){
 const query=$('weekExerciseSearch').value.trim().toLowerCase(),muscle=$('weekExerciseMuscle').value,
  equipment=$('weekExerciseEquipment').value,onlyFavorites=$('weekExerciseFavorites').checked;
 const favorites=new Set(libraryPrefs()?.favorites||[]);
 let shown=0;
 $('weekExerciseOptions').querySelectorAll('.week-exercise').forEach(label=>{
  const id=label.querySelector('input')?.value,ex=exerciseById(id);
  const matches=Boolean(ex)&&(!muscle||String(ex.muscle||ex.group||'Other')===muscle)&&
   (!equipment||libraryEquipment(ex)===equipment)&&(!onlyFavorites||favorites.has(id))&&
   (!query||(ex.name+' '+String(ex.muscle||ex.group||'')+' '+libraryEquipment(ex)).toLowerCase().includes(query));
  label.hidden=!matches;if(matches)shown++;
 });
 const selected=$('weekExerciseOptions').querySelectorAll('input:checked').length;
 $('weekExerciseCount').textContent=shown+' of '+editorExercises.length+' exercises shown · '+selected+' selected · not saved until you press Save day and workout.';
}
function updateWeekEditor(){
 const id=$('weekWorkoutSelect').value,p=weekly.plans.find(p=>p.id===id);
 $('weekWorkoutName').value=p?.title||'';
 $('weekWorkoutName').disabled=!p;
 $('weekExerciseOptions').innerHTML=editorExercises.map(ex=>
  '<div class="week-exercise library-editor-row"><label class="week-exercise-choice"><input type="checkbox" value="'+escapeHTML(ex.id)+'"'+(p?.ids.includes(ex.id)?' checked':'')+(p?'':' disabled')+'><span><strong>'+escapeHTML(ex.name)+'</strong><small>'+escapeHTML(String(ex.muscle||ex.group||'Other'))+' · '+escapeHTML(libraryEquipment(ex))+'</small></span></label><button type="button" class="button-outline" data-week-library-detail="'+escapeHTML(ex.id)+'">Details</button></div>'
 ).join('');
 $('weekExerciseSearch').value='';$('weekExerciseMuscle').value='';$('weekExerciseEquipment').value='';$('weekExerciseFavorites').checked=false;
 filterWeekEditorExercises();
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
  commitWeekly(candidate,{day,id});
  renderWeekBoard();renderHome();renderWorkouts();renderOriginalProgress();refreshRestoreRepeating();
  notice('Saved '+weeklyAPI.DAYS[day]+' workout. Home and workout details now match.');
 }catch(error){notice(error.message)}
}
function duplicateWeekWorkout(){
 try{
  if(originalPreviewActive()||weeklyDraftReadError)throw Error('Switch to a healthy editable schedule before copying');
  const sourceId=$('weekWorkoutSelect').value;
  if(!sourceId)throw Error('Select a workout to copy first');
  const id='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
  const candidate=weeklyAPI.duplicate(weekly,sourceId,id,allowedExerciseIds);
  commitWeekly(candidate);
  $('weekWorkoutSelect').innerHTML='<option value="">Rest day</option>'+weekly.plans.map(p=>'<option value="'+escapeHTML(p.id)+'">'+escapeHTML(p.title)+'</option>').join('');
  $('weekWorkoutSelect').value=id;
  updateWeekEditor();
  renderWorkouts();
  notice('Personal copy created. Edit it and save to assign it to this day. Original workout unchanged.');
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
let activeSessionOwner=null,sessionDirty=false;
let originalHistory=[];
let historyLoadEpoch=0,trackingLoadEpoch=0,settingsLoadEpoch=0,customScheduleLoadEpoch=0,combinedLoadEpoch=0;
let importedHistoryOwner=null;
let originalTracking=null,importedTrackingOwner=null;
let originalAccountSettings=null,importedSettingsOwner=null;
let toastTimer;
let muscleFilter='';
let libraryVisibleOffset=0;
let restSeconds=90,restPaused=true,restClock=null;
function demoKey(owner=account?.id||'guest'){return owner==='guest'?DEMO_KEY:DEMO_KEY+':'+owner;}
function loadDemo(owner='guest'){try{const a=JSON.parse(localStorage.getItem(demoKey(owner))||'[]');return Array.isArray(a)?a.filter(x=>x&&Array.isArray(x.sets)).slice(0,100):[]}catch{return []}}
function storeDemo(){localStorage.setItem(demoKey(),JSON.stringify(demoSessions))}
function escapeHTML(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function notice(message){const t=$('toast');t.textContent=message;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,3400)}
function setPage(next){if(!['welcome','home','workouts','library','progress','settings','coaching','nutrition'].includes(next))return;page=next;
 document.querySelectorAll('.page').forEach(el=>el.hidden=el.id!==next);
 document.querySelectorAll('[data-page]').forEach(el=>{const is=el.dataset.page===next;el.classList.toggle('selected',is);el.classList.toggle('active',is);if(is)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
 $('pageTitle').textContent=({welcome:'Welcome',home:'Home',workouts:'Workouts',library:'Exercise library',progress:'Progress',settings:'My Account',coaching:'Coaching',nutrition:'Nutrition'})[next];
 $('sidebar').classList.remove('open');$('sidebarScrim').classList.remove('open');document.body.classList.remove('sidebar-is-open');$('menuBtn').setAttribute('aria-expanded','false');$('moreMenuBtn').setAttribute('aria-expanded','false');$('sidebar').inert=window.matchMedia('(max-width:760px)').matches;document.body.classList.toggle('welcome-view',next==='welcome');window.scrollTo({top:0,behavior:'instant'});
 if(next==='home')renderHome();if(next==='workouts')renderWorkouts();if(next==='library')renderLibrary();
 if(next==='progress')renderProgress();if(next==='coaching')renderCoach();if(next==='nutrition'){renderLocalDailyTracking();renderOriginalTracking();}if(next==='settings'){renderSettings();renderOriginalAccountSettings();}
}
function totalSets(){return demoSessions.reduce((n,x)=>n+x.sets.length,0)}

function renderHomeOriginalRecent(){
 const status=$('homeOriginalRecentStatus'),root=$('homeOriginalRecent'),button=$('homeLoadOriginalHistory');
 if(!status||!root||!button)return;
 const signedIn=Boolean(account?.id);
 const loaded=signedIn&&importedHistoryOwner===account.id;
 button.disabled=!signedIn;button.hidden=Boolean(loaded);
 root.replaceChildren();
 if(!signedIn){status.textContent='Sign in to load real completed workouts from your original account.';return;}
 if(!loaded){status.textContent='Original history has not been loaded for this account. Demo activity is shown separately below.';return;}
 const sessions=window.MLCOriginalHistory.recentCompleted(originalHistory,3);
 status.textContent=sessions.length?'Latest '+sessions.length+' actual completed workouts · read only · separate from demo activity.':'No qualifying completed original workouts were found.';
 root.innerHTML=sessions.map(item=>{
  const totals=window.MLCOriginalHistory.sessionTotals(item);
  return '<div class="recent-item"><div><strong>'+escapeHTML(item.workoutTitle)+'</strong><small>'+new Date(item.date).toLocaleDateString()+' · '+totals.sets+' completed sets</small></div><span>'+Math.round(totals.volume).toLocaleString()+' lb-reps</span></div>';
 }).join('');
}
function renderHome(){
 renderHomeOriginalRecent();
 $('metricWorkouts').textContent=demoSessions.length;
 $('metricSets').textContent=totalSets();
 const today=resolvedWorkout(),plan=today.plan;
 $('todayTitle').textContent=plan?.title||'Rest day';
 $('todayDescription').textContent=plan?today.dayName+' · '+plan.ids.length+' exercises · '+(plan.ids.length*3)+' sets':'Rest scheduled for '+today.dayName+' · tap a day to change';
 $('todayExercises').innerHTML=plan?plan.ids.map(id=>{const e=exerciseById(id);return '<div class="preview-exercise"><div><strong>'+escapeHTML(e.name)+'</strong><small>'+e.sets+' × '+escapeHTML(e.reps)+'</small></div><button type="button" class="button-outline" data-exercise-open="'+escapeHTML(id)+'" aria-label="View '+escapeHTML(e.name)+' exercise details">Details</button></div>'}).join(''):'<p class="small">No workout assigned today. Pick a day to edit your schedule.</p>';
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
function libraryImage(ex){
 return window.MLCV2ExerciseCatalog.imagePath(ex);
}
function exerciseVisualProfile(ex){
 return window.MLCExerciseVisualAudit.resolve(ex);
}
function exerciseAnatomy(ex,size='mini'){
 if(!window.LiftovaAnatomy)return '';
 const mapping=exerciseVisualProfile(ex);
 return window.LiftovaAnatomy.render({
  id:ex.id,name:ex.name,muscle:ex.muscle||ex.group||'Other',
  anatomyMapping:mapping
 },{size});
}
function visualMuscleNames(ex){
 const mapping=exerciseVisualProfile(ex),labels=window.LiftovaAnatomy?.labels||{};
 const names=ids=>ids.map(id=>labels[id]||id).join(', ')||'Not specified';
 return '<p class="small visual-muscle-key"><strong>Primary:</strong> '+escapeHTML(names(mapping.primary))+
  ' · <strong>Supporting:</strong> '+escapeHTML(names(mapping.secondary))+
  ' <span class="visual-review-note">· '+escapeHTML(mapping.reviewStatus)+'</span></p>';
}
function libraryPrefs(){
 try{return window.MLCLibraryPrefs.read(localStorage,account?.id||'guest',allowedExerciseIds);}
 catch(error){notice(String(error.message||error));return null;}
}
function favoriteButton(id,active){
 return '<button type="button" class="button-outline library-favorite" data-library-favorite="'+escapeHTML(id)+'" aria-pressed="'+String(active)+'">'+(active?'★ Favorite':'☆ Favorite')+'</button>';
}
function toggleLibraryFavorite(id){
 try{window.MLCLibraryPrefs.toggle(localStorage,account?.id||'guest',id,allowedExerciseIds);
  renderLibrary();if(!$('modal').hidden&&$('modalContent').querySelector('[data-library-favorite]'))exerciseDetail(id,false);
 }catch(error){notice(String(error.message||error));}
}
function renderRecentExercises(prefs){
 const root=$('libraryRecentWrap');
 const recent=prefs?.recent?.map(id=>editorExercises.find(ex=>ex.id===id)).filter(Boolean)||[];
 root.hidden=!recent.length;
 $('libraryRecentList').innerHTML=recent.map(ex=>'<button type="button" class="button-outline" data-library-recent="'+escapeHTML(ex.id)+'">'+escapeHTML(ex.name)+'</button>').join('');
}
function exerciseDetail(id,recordView=true){
 const ex=originalExercises.find(e=>e.id===id)||editorExercises.find(e=>e.id===id);
 if(!ex)return;
 if(recordView){try{window.MLCLibraryPrefs.viewed(localStorage,account?.id||'guest',id,allowedExerciseIds)}catch(error){notice(String(error.message||error));}}
 const prefs=libraryPrefs();
 if(recordView)renderLibrary();
 const tips=Array.isArray(ex.tips)?ex.tips:[],mistakes=Array.isArray(ex.mistakes)?ex.mistakes:[];
 const image=libraryImage(ex),anatomy=exerciseAnatomy(ex,'detail');
 const visualKey=visualMuscleNames(ex);
 const metadata=window.MLCExerciseMetadata.get(ex.id,ex.name);
 const displayEquipment=ex.equipment||metadata.equipment;
 const list=(label,items)=>items.length?'<h3>'+label+'</h3><ul>'+items.map(x=>'<li>'+escapeHTML(x)+'</li>').join('')+'</ul>':'';
 const related=editorExercises.filter(item=>item.id!==ex.id&&
  String(item.muscle||item.group||'').toLowerCase()===String(ex.muscle||ex.group||'').toLowerCase())
  .slice(0,5);
 const relatedHtml=related.length?'<h3>Other movements for this muscle</h3><div class="hero-actions">'+
   related.map(item=>'<button type="button" class="button-outline" data-library-related="'+escapeHTML(item.id)+'">'+escapeHTML(item.name)+'</button>').join('')+'</div>':'';
 const actions='<div class="hero-actions">'+favoriteButton(ex.id,Boolean(prefs?.favorites.includes(ex.id)))+'<button type="button" class="button-primary" data-library-stage="'+escapeHTML(ex.id)+'">Add to today’s workout · review first</button></div>';
 openModal('<div class="exercise-detail-modal"><div class="modal-eyebrow">EXERCISE LIBRARY · TECHNIQUE</div><h2>'+escapeHTML(ex.name)+'</h2><p class="small">Primary: '+escapeHTML(ex.muscle||ex.group||'Other')+(displayEquipment?' · Equipment: '+escapeHTML(displayEquipment):'')+'</p><div class="exercise-detail-visuals">'+(image?'<img src="'+escapeHTML(image)+'" alt="'+escapeHTML(ex.name)+' exercise reference" loading="lazy">':'<div class="panel"><p class="small">No original exercise photograph supplied.</p></div>')+'<div>'+anatomy+visualKey+'</div></div><h3>How to perform</h3><p>'+escapeHTML(ex.how||ex.cue||'Detailed instructions not available for this exercise.')+'</p>'+list('Technique tips',tips)+list('Common mistakes',mistakes)+relatedHtml+actions+'<p class="small">Static exercise reference and highlighted muscles. Moving demonstrations are not yet available.</p></div>');
}
function libraryEquipment(ex){
 return ex?.equipment||window.MLCExerciseMetadata.get(ex.id,ex.name)?.equipment||'Unspecified';
}
function stageLibraryExercise(id){
 const ex=editorExercises.find(x=>x.id===id);
 if(!ex)return;
 if(originalPreviewActive()){notice('Original imported schedule is read-only. Switch to editable workouts before adding exercises.');return;}
 if(weeklyDraftReadError){notice('Saved schedule requires recovery. No workout was changed.');return;}
 // Exercise details opened from the editor must not discard unsaved checkboxes.
 if(page==='workouts'&&!$('weekEditor').hidden){
  const draftId=$('weekWorkoutSelect').value;
  if(draftId&&weekly.plans.some(p=>p.id===draftId)){
   const checkbox=[...$('weekExerciseOptions').querySelectorAll('input[type="checkbox"]')].find(el=>el.value===id);
   if(checkbox&&!checkbox.disabled){
    checkbox.checked=true;closeModal();filterWeekEditorExercises();
    checkbox.closest('.week-exercise')?.scrollIntoView({block:'center'});
    notice(ex.name+' selected. Save the workout to apply this change.');return;
   }
  }
 }
 const current=resolvedWorkout(),plan=current.plan;
 if(!plan||!weekly.plans.some(p=>p.id===plan.id)){
  closeModal();setPage('workouts');
  notice('Choose or create an editable workout first. No existing workout was changed.');return;
 }
 closeModal();
 chooseWeekday(weeklyAPI.dayIndex(new Date()));
 const selected=$('weekWorkoutSelect');
 if(selected.value!==plan.id){
  notice('Select an editable workout before adding this exercise. No changes saved.');return;
 }
 const check=[...$('weekExerciseOptions').querySelectorAll('input[type="checkbox"]')].find(el=>el.value===id);
 if(!check){notice('Exercise unavailable in the editor. No changes saved.');return;}
 check.checked=true;
 const row=check.closest('label');
 row?.scrollIntoView({block:'center',behavior:'smooth'});
 notice(ex.name+' selected in the editor. Tap Save Workout to save; no change has been made yet.');
}
function renderFullCatalogImportStatus(){
 const target=$('fullLibraryImportStatus');
 if(!target)return;
 if(fullCatalogLoadError)target.textContent=fullCatalogLoadError+' · Existing library retained.';
 else target.textContent=verifiedFullCatalog?
  'Verified '+verifiedFullCatalog.length+' imported source exercises; '+editorExercises.length+' total catalog entries including compatible starter movements. Local development storage only.':
  originalExercises.length===341?'Complete 341-exercise original library loaded from five verified GitHub expansion sources.':'Only '+originalExercises.length+' original exercises are present; the 341 source is not available.';
}
async function importVerifiedFullCatalog(event){
 const file=event.target.files?.[0];
 if(!file)return;
 const status=$('fullLibraryImportStatus');
 try{
  if(file.size>5_000_000)throw Error('Catalog file exceeds 5 MB');
  const parsed=JSON.parse(await file.text());
  const prepared=window.MLCFullExerciseImport.prepare(parsed,originalExercises);
  const extras=prepared.filter(item=>!originalExercises.some(ex=>ex.id===item.id)).length;
  if(!confirm('Validate and save '+prepared.length+' original exercise records in this browser preview? Existing workouts, scores, cloud data and active sessions will not be changed.'))return;
  window.MLCFullExerciseImport.save(localStorage,prepared,originalExercises);
  status.textContent=prepared.length+' verified original exercises, including '+extras+' not in the 60-entry subset. Saved locally; reloading the preview.';
  location.reload();
 }catch(error){status.textContent=String(error.message||error)+' · Existing exercises unchanged.';}
 finally{event.target.value='';}
}
function renderLibrary({append=false}={}){
 renderFullCatalogImportStatus();
 if(!append)libraryVisibleOffset=0;
 const coverage=window.MLCExerciseVisualAudit.summary(originalExercises);
 $('libraryVisualCoverage').textContent=coverage.photos+' original exercise photos · '+coverage.anatomyOnly+' anatomy-only entries · '+coverage.movementDerived+' movement-derived muscle maps · '+coverage.groupOnly+' group-only maps · '+coverage.unresolved+' unresolved. Detailed highlights require expert review.';
 const query=$('exerciseSearch').value.trim().toLowerCase();
 const equipment=$('libraryEquipment').value,photosOnly=$('libraryPhotosOnly').checked;
 const prefs=libraryPrefs(),favoritesOnly=$('libraryFavoritesOnly').checked;
 const allMatches=window.MLCV2ExerciseCatalog.filter(editorExercises,query,muscleFilter,{
  equipment,photosOnly,equipmentFor:libraryEquipment
 }).filter(ex=>!favoritesOnly||Boolean(prefs?.favorites.includes(ex.id)));
 const visual=window.MLCExerciseVisualBrowser.browse(allMatches,{
  status:$('libraryVisualStatus').value,review:$('libraryAnatomyStatus').value,
  offset:append?libraryVisibleOffset:0
 },window.MLCExerciseVisualAudit);
 const matches=visual.entries;
 libraryVisibleOffset=visual.shown;
 $('libraryShowMore').hidden=!visual.hasMore;
 $('libraryShownCount').textContent='Showing '+visual.shown+' of '+visual.total+' matching exercises.';
 renderRecentExercises(prefs);
 $('libraryResultCount').textContent=visual.total+' matching of '+editorExercises.length+' exercises'+(photosOnly?' · original photographs only':'')+(favoritesOnly?' · favorites':'')+'.';
 document.querySelectorAll('[data-muscle]').forEach(button=>button.classList.toggle('selected',button.dataset.muscle===muscleFilter));
 $('libraryGrid').innerHTML=matches.map(ex=>{
  const group=String(ex.muscle||ex.group||'Other');
  const image=libraryImage(ex);
  const guide=String(ex.how||ex.cue||'');
  const tips=Array.isArray(ex.tips)?ex.tips:[];
  const mistakes=Array.isArray(ex.mistakes)?ex.mistakes:[];
  const notes='<p>'+escapeHTML(guide)+'</p>'+(tips.length?'<strong>Technique tips</strong><ul>'+tips.map(x=>'<li>'+escapeHTML(x)+'</li>').join('')+'</ul>':'')+(mistakes.length?'<strong>Common mistakes</strong><ul>'+mistakes.map(x=>'<li>'+escapeHTML(x)+'</li>').join('')+'</ul>':'');
  return '<article class="library-card reference-exercise">'+(image?'<img class="library-thumb" src="'+escapeHTML(image)+'" alt="" loading="lazy">':'<div class="library-anatomy">'+exerciseAnatomy(ex,'mini')+'</div>')+'<div class="library-info"><h3>'+escapeHTML(ex.name)+'</h3><p>'+escapeHTML(group)+(ex.sets?' · '+ex.sets+' sets':'')+(ex.reps?' · '+escapeHTML(ex.reps)+' reps':'')+'</p><details><summary>Technique notes</summary>'+notes+'</details>'+visualMuscleNames(ex)+'<button class="button-outline exercise-open" type="button" data-library-detail="'+escapeHTML(ex.id)+'">View exercise details</button>'+favoriteButton(ex.id,Boolean(prefs?.favorites.includes(ex.id)))+'</div><span class="library-chevron">›</span></article>';
 }).join('')||'<p class="empty-note">No exercises match that search.</p>';
}
function renderProgress(){
 const movements=new Set(demoSessions.flatMap(x=>x.sets.map(y=>y.exerciseId)));
 $('progressSessions').textContent=demoSessions.length;$('progressSets').textContent=totalSets();$('progressMovements').textContent=movements.size;
 renderProgressChart();
 renderOriginalHistory();
 renderOriginalProgress();
 $('sessionHistory').innerHTML=demoSessions.length?demoSessions.map((x,index)=>{
  const summary=window.MLCSessionSummary.summarize(x,demoSessions.slice(index+1),editorExercises);
  const details=summary.movements.map(ex=>'<div class="recent-item"><div><strong>'+escapeHTML(ex.name)+'</strong><small>'+ex.sets+' completed sets · Top '+ex.topWeight+' lb'+(ex.newPracticeRecord?' · Local practice record':'')+'</small></div><button type="button" class="button-outline" data-exercise-open="'+escapeHTML(ex.id)+'">Exercise</button><span>'+Math.round(ex.volume).toLocaleString()+' lb-reps</span></div>').join('');
  return '<details class="panel"><summary><strong>'+escapeHTML(x.title)+'</strong> · '+new Date(x.created).toLocaleDateString()+' · '+summary.sets+' sets · '+Math.round(summary.volume).toLocaleString()+' lb-reps</summary><p class="small">'+(summary.durationMinutes?summary.durationMinutes+' min · ':'')+escapeHTML(x.readiness||'No readiness recorded')+' · '+summary.recordCount+' new local practice weight records</p>'+details+'</details>';
 }).join(''):'<div class="empty-note">No demo sessions recorded yet. Open Workouts to start your first practice session.</div>';
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
 const trend=window.MLCCoachActivityTrend.compare(demoSessions);
 const localWeek=window.MLCCoachReview.week(demoSessions);
 if(localWeek){
  $('coachWeekWorkouts').textContent=String(localWeek.sessions);
  $('coachWeekDays').textContent=String(localWeek.trainingDays);
  $('coachWeekSets').textContent=String(localWeek.sets);
  $('coachWeekVolume').textContent=Math.round(localWeek.volume).toLocaleString()+' lb-reps';
  $('coachLocalWeekStatus').textContent=localWeek.from+' through '+localWeek.to+' · '+(trend.delta.sessions>=0?'+':'')+trend.delta.sessions+' workouts and '+(trend.delta.sets>=0?'+':'')+trend.delta.sets+' sets versus the preceding 7 days. Recorded activity only; no plan changes.';
  $('coachWeekReadiness').textContent='Recorded check-ins: Great '+localWeek.readiness.Great+' · Normal '+localWeek.readiness.Normal+' · Tired '+localWeek.readiness.Tired+'. Not an inferred recovery score.';
 }
 const recentHistory=demoSessions.map(s=>({date:s.created,readiness:s.readiness,exercises:(s.sets||[]).reduce((acc,set)=>{
  if(!window.MLCCoachActivityTrend.validSet(set))return acc;
  let match=acc.find(ex=>ex.id===set.exerciseId);
  if(!match){match={id:set.exerciseId,sets:[]};acc.push(match)}
  match.sets.push({weight:set.weight,reps:set.reps,completed:true});return acc;
 },[])}));
 const localMuscles=window.MLCRecoveryPreview.summarize(recentHistory,editorExercises);
 $('coachLocalMuscleStatus').textContent=localMuscles.muscles.length?'Latest completed local workout per muscle. Time since training, not a recovery estimate.':'No completed local exercise history with mapped muscles.';
 $('coachLocalMuscleList').innerHTML=localMuscles.muscles.map(m=>'<div class="recent-item"><strong>'+escapeHTML(m.name)+'</strong><span>'+Math.floor(m.hoursAgo/24)+' days since trained</span></div>').join('')||'<p class="small">Muscle activity will appear after you log workouts.</p>';
 const sets=demoSessions.flatMap(x=>Array.isArray(x.sets)?x.sets.filter(window.MLCCoachActivityTrend.validSet):[]);
 const movementCount=new Set(sets.map(x=>x.exerciseId).filter(Boolean)).size;
 $('coachSessions').textContent=String(demoSessions.length);
 $('coachSets').textContent=String(sets.length);
 $('coachMovements').textContent=String(movementCount);
 $('coachStatus').textContent=demoSessions.length?'Practice activity recorded':'No practice history yet';
 $('coachDescription').textContent=demoSessions.length?'Your local workout activity powers your Coach training review and optional working-weight suggestions when enough qualifying sessions exist. No plan changes are automatic.':'Complete practice workouts or load verified original history to build your training review and optional suggestions.';
 const latest=demoSessions.find(x=>x&&x.created&&Number.isFinite(Date.parse(x.created)));
 $('coachRecent').textContent=latest?'Latest practice session: '+new Date(latest.created).toLocaleDateString()+' · '+String(latest.title||'Workout')+(latest.readiness?' · Readiness: '+latest.readiness:''):'No completed preview sessions have been saved.';
 renderOriginalCoachEvidence();
}
function renderCoachProgression(){
 const status=$('coachProgressionStatus'),root=$('coachProgressionList'),start=$('coachOpenToday');
 if(!status||!root)return;
 const selected=resolvedWorkout();
 start.disabled=!selected.plan||Boolean(weeklyDraftReadError);
 const verified=Boolean(account?.id&&importedHistoryOwner===account.id);
 let personalTargets={};
 let targetReadError=false;
 try{personalTargets=window.MLCCoachTargets.read(localStorage,account?.id||'guest').targets}
 catch{targetReadError=true}
 const today=window.MLCTodayCoach.preview({
  plan:selected.plan,catalog:editorExercises,localSessions:demoSessions,
  legacySessions:verified?originalHistory:[],legacyVerified:verified,personalTargets
 });
 const todayStatus=$('coachTodayStatus'),todayList=$('coachTodayList');
 if(todayStatus&&todayList){
  todayStatus.textContent=today.status==='rest'?
   'No scheduled workout today (or no exercises assigned). Coach will not substitute a preset.':
   today.title+' · '+today.items.length+' scheduled exercises · '+today.ready+' eligible weight suggestions. '+(targetReadError?'Personal targets need local storage recovery. ':'')+'No automatic changes.';
  todayList.innerHTML=today.items.map(row=>{
   const label=row.status==='ready'?row.action.toUpperCase()+' · '+row.weight+' lb · '+row.reason:
    row.status==='unavailable'?row.reason:'Keep your current working weight until enough completed history is available.';
   const personal=row.personalTarget===null?'':'Personal target: '+row.personalTarget+' lb (set manually; not automatically applied).';
   const observed=window.MLCCoachConsistency.review(demoSessions,row.id);
   const evidence=observed.status==='steady-load'?
    'Recent training: same working load and similar repetitions over '+observed.sessions+' sessions. This is not a plateau diagnosis.':
    observed.status==='load-increase'?'Recent training: recorded working load increased.':
    observed.status==='load-decrease'?'Recent training: recorded working load decreased.':
    observed.status==='rep-increase'?'Recent training: average repetitions increased at the same working load.':
    observed.status==='rep-decrease'?'Recent training: average repetitions decreased at the same working load.':null;
   return '<div class="recent-item"><div><strong>'+escapeHTML(row.name)+'</strong><small>'+escapeHTML(label)+'</small><small>'+escapeHTML(row.source||'No verified recommendation')+'</small>'+(evidence?'<small>'+escapeHTML(evidence)+'</small>':'')+(personal?'<small>'+escapeHTML(personal)+'</small>':'')+'</div></div>';
  }).join('')||'<p class="small">No exercises scheduled for today.</p>';
 }
 const items=window.MLCCoachDashboard.recommendations({
  localSessions:demoSessions,originalSessions:verified?originalHistory:[],
  legacyVerified:verified,catalog:editorExercises,limit:24
 });
 const ready=items.filter(x=>x.status==='ready');
 status.textContent=ready.length?
  ready.length+' evidence-based movement suggestions · '+items.length+' previously trained movements. Open a workout to decide whether to apply one to an individual set.':
  items.length?'Training history found, but two qualifying working-set sessions are needed for a weight suggestion.':
  'No eligible completed sessions yet. Log workouts locally, or sign in and load verified original training history.';
 root.innerHTML=items.map(ex=>{
  const suggestion=ex.status==='ready'?ex.action.toUpperCase()+' · '+ex.weight+' lb · '+ex.reason:
   'Insufficient working-set evidence; no recommendation made.';
  return '<div class="recent-item"><div><strong>'+escapeHTML(ex.name)+'</strong><small>'+escapeHTML(suggestion)+'</small><small>'+escapeHTML(ex.source||'No verified source yet')+'</small></div><button type="button" class="button-outline" data-exercise-open="'+escapeHTML(ex.id)+'">Exercise</button><span>'+escapeHTML(ex.lastWeight===null?'—':String(ex.lastWeight)+' lb last')+'</span></div>';
 }).join('')||'<p class="small">Complete workouts to build your personal Coach history.</p>';
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
 const status=$('coachOriginalStatus'),movements=$('coachOriginalMovements'),search=$('coachMovementSearch');
 $('coachLoadOriginalHistory').disabled=!account;
 if(!status||!movements||!search)return;
 search.disabled=!(account?.id&&importedHistoryOwner===account.id);
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
 const matching=window.MLCOriginalCoachEvidence.filterMovements(evidence.movements,search.value);
 movements.innerHTML=matching.slice(0,50).map(ex=>'<div class="recent-item"><div><strong>'+escapeHTML(ex.name)+'</strong><small>'+ex.sessions+' workouts · '+ex.sets+' sets</small></div><span>Best '+ex.bestWeight.toLocaleString()+' lb</span></div>').join('')||(evidence.movements.length?'<p class="small">No matching trained exercises.</p>':'<p class="small">No qualifying completed sets found.</p>');
 renderCoachProgression();
 renderOriginalRecovery();
}
function renderOriginalCalendar(){
 const input=$('originalCalendarMonth'),status=$('originalCalendarStatus'),root=$('originalCalendarDays');
 if(!input||!status||!root)return;
 const loaded=Boolean(account?.id&&importedHistoryOwner===account.id);
 input.disabled=!loaded;root.replaceChildren();
 if(!loaded){status.textContent='Load original account history to view completed training days.';return;}
 if(!input.value){
  const latest=originalHistory.find(x=>x&&Number.isFinite(Date.parse(x.date||'')));
  input.value=latest?new Date(Date.parse(latest.date)).toISOString().slice(0,7):new Date().toISOString().slice(0,7);
 }
 const days=window.MLCOriginalProgress.calendarDays(originalHistory,input.value);
 status.textContent=days.length?days.length+' documented training days during '+input.value+'. No demo sessions included.':'No qualifying completed workouts found for this month.';
 root.innerHTML=days.map(day=>'<details class="recent-item"><summary><strong>'+escapeHTML(day.date)+'</strong> · '+day.workouts+' workouts · '+day.sets+' sets · '+Math.round(day.volume).toLocaleString()+' lb-reps</summary><p>'+day.titles.map(escapeHTML).join(' · ')+'</p></details>').join('');
}
function renderOriginalExerciseTrend(records=null){
 const select=$('originalExerciseTrendSelect'),status=$('originalExerciseTrendStatus'),root=$('originalExerciseTrend');
 if(!select||!status||!root)return;
 const ready=Boolean(account?.id&&importedHistoryOwner===account.id);
 const previous=select.value;
 root.replaceChildren();
 if(!ready){
  select.replaceChildren(new Option('Load original history first',''));
  select.disabled=true;
  status.textContent='Original exercise progress appears after loading your account history.';
  return;
 }
 const rows=records||window.MLCOriginalProgress.analyze(originalHistory).records;
 select.disabled=!rows.length;
 select.replaceChildren(new Option(rows.length?'Choose an exercise':'No completed exercises',''));
 for(const item of rows)select.add(new Option(item.name,item.id));
 select.value=rows.some(x=>x.id===previous)?previous:(rows[0]?.id||'');
 if(!select.value){status.textContent='No qualifying completed sets available.';return;}
 const trend=window.MLCOriginalProgress.exerciseTrend(originalHistory,select.value,12);
 status.textContent=trend.length?trend.length+' latest completed sessions for this exercise; actual logged weight, not estimated 1RM.':'No completed sets found for this exercise.';
 root.innerHTML=trend.slice().reverse().map(item=>'<div class="recent-item"><div><strong>'+escapeHTML(item.date)+'</strong><small>'+item.sets+' completed sets · '+Math.round(item.volume).toLocaleString()+' lb-reps</small></div><span>Best '+item.bestWeight.toLocaleString()+' lb</span></div>').join('');
}
function renderOriginalProgress(){
 const status=$('originalProgressStatus'),root=$('originalRecords'),chart=$('originalVolumeChart');
 if(!status||!root||!chart)return;
 const ready=Boolean(account?.id&&importedHistoryOwner===account.id);
 renderOriginalCalendar();
 if(!ready)renderOriginalExerciseTrend();
 for(const id of ['Sessions','Sets','Exercises','Volume'])$('originalProgress'+id).textContent='—';
 root.replaceChildren();chart.replaceChildren();
 if(!ready){status.textContent='Load your original history to view your workout progress and personal records.';chart.textContent='Load original account history to view the real workout volume trend.';return;}
 const result=window.MLCOriginalProgress.analyze(originalHistory);
 renderOriginalExerciseTrend(result.records);
 $('originalProgressSessions').textContent=String(result.sessions);
 $('originalProgressSets').textContent=String(result.sets);
 $('originalProgressExercises').textContent=String(result.exercises);
 $('originalProgressVolume').textContent=Math.round(result.volume).toLocaleString();
 status.textContent=result.sessions?result.trainingDays+' distinct training days · based on original completed workouts only. Estimates are not measured 1RM values.':'No completed original workouts found for this account.';
 const rows=window.MLCOriginalProgress.volumeSeries(originalHistory,12);
 if(rows.length){
  const peak=Math.max(1,...rows.map(p=>p.volume));
  const coordinates=rows.map((p,i)=>({x:22+i*(276/Math.max(1,rows.length-1)),y:175-p.volume/peak*142}));
  const points=coordinates.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
  const fill='22,184 '+points+' '+coordinates[coordinates.length-1].x.toFixed(1)+',184';
  chart.innerHTML='<h3>Actual workout volume trend</h3><svg viewBox="0 0 320 220" role="img" aria-label="Original completed workout volume across '+rows.length+' sessions"><path d="M22 28 V184 H304" fill="none" stroke="#bbdfd2" stroke-opacity=".35"/><polygon points="'+fill+'" fill="#d8b775" fill-opacity=".15"/><polyline points="'+points+'" fill="none" stroke="#ffe1a0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+coordinates.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="3.5" fill="#ffeba8"/>').join('')+'</svg><p class="small">'+rows.length+' actual workouts · '+Math.round(rows[rows.length-1].volume).toLocaleString()+' lb-reps on '+escapeHTML(rows[rows.length-1].date)+'</p>';
 }else chart.textContent='No qualifying original completed sets available to plot.';
 if(!result.records.length)return;
 root.innerHTML='<h3>Exercise records</h3>'+result.records.map(ex=>'<details class="recent-item"><summary><strong>'+escapeHTML(ex.name)+'</strong> · Best weight '+ex.weight.toLocaleString()+' lb</summary><p>Most reps in a set: '+ex.reps+' · Best set volume: '+Math.round(ex.setVolume).toLocaleString()+' lb · Estimated 1RM (sets up to 10 reps): '+(ex.estimatedOneRepMax?Math.round(ex.estimatedOneRepMax).toLocaleString()+' lb':'Unavailable')+'</p></details>').join('');
}
function clearOriginalHistory(){
 historyLoadEpoch++;
 originalHistory=[];importedHistoryOwner=null;
 if($('originalCalendarMonth'))$('originalCalendarMonth').value='';
 renderOriginalHistory();
 renderOriginalProgress();
 renderOriginalCoachEvidence();
 renderHomeOriginalRecent();
}
function renderOriginalHistory(){
 const status=$('originalHistoryStatus'),root=$('originalHistory'),button=$('loadOriginalHistory'),search=$('originalHistorySearch');
 if(!status||!root||!button)return;
 button.disabled=!account;
 search.disabled=!(account?.id&&importedHistoryOwner===account.id);
 if(!account){status.textContent='Sign in with your existing account first.';root.replaceChildren();return;}
 if(importedHistoryOwner!==account.id){status.textContent='Ready to load read-only original workout history.';root.replaceChildren();return;}
 const matches=window.MLCOriginalHistory.filterSessions(originalHistory,search.value);
 status.textContent=originalHistory.length?(matches.length+' of '+originalHistory.length+' original completed workouts match (read only).'):'No completed original workouts were returned for this account.';
 root.innerHTML=matches.slice(0,200).map(item=>{
  const totals=window.MLCOriginalHistory.sessionTotals(item);
  const details=item.exercises.map(ex=>{
   const count=window.MLCOriginalHistory.sessionTotals({exercises:[ex]});
   return '<div class="recent-item"><div><strong>'+escapeHTML(ex.name)+'</strong><small>'+count.sets+' completed sets</small></div><span>'+Math.round(count.volume).toLocaleString()+' lb-reps</span></div>';
  }).join('');
  return '<details class="panel"><summary><strong>'+escapeHTML(item.workoutTitle)+'</strong> · '+new Date(item.date).toLocaleDateString()+' · '+totals.sets+' completed sets · '+Math.round(totals.volume).toLocaleString()+' lb-reps</summary>'+details+'</details>';
 }).join('')||(originalHistory.length?'<p class="small">No matching workouts or exercises.</p>':'');
}
async function loadOriginalHistory(){
 if(!account?.id||!auth?.access_token){notice('Sign in first to load your original history.');return;}
 const button=$('loadOriginalHistory'),status=$('originalHistoryStatus');
 const owner=account.id,epoch=++historyLoadEpoch;
 button.disabled=true;status.textContent='Reading original account history securely…';
 try{
  await validateStoredAuth();
  if(account?.id!==owner||!auth?.access_token)throw Error('Account session is no longer valid');
  const history=await window.MLCOriginalHistory.load({endpoint:BACKEND,publishableKey:PUBLIC_KEY,accessToken:auth.access_token,userId:owner});
  if(account?.id!==owner||historyLoadEpoch!==epoch)return;
  originalHistory=history;importedHistoryOwner=owner;renderOriginalHistory();renderOriginalProgress();renderOriginalCoachEvidence();renderHomeOriginalRecent();
 }catch(error){
  if(account?.id!==owner||historyLoadEpoch!==epoch)return;
  originalHistory=[];importedHistoryOwner=null;renderOriginalHistory();renderOriginalProgress();renderOriginalCoachEvidence();renderHomeOriginalRecent();
  status.textContent='Could not load original history: '+String(error.message||error).slice(0,180);
 }finally{if(historyLoadEpoch===epoch)button.disabled=!account}
}
function clearOriginalTracking(){
 trackingLoadEpoch++;
 originalTracking=null;importedTrackingOwner=null;$('trackingMonth').value='';renderOriginalTracking();
}
function localTrackingDate(){
 const today=new Date();
 const current=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
 if(!$('localTrackingDay').value)$('localTrackingDay').value=current;
 return $('localTrackingDay').value;
}
function renderLocalDailyTracking(){
 const api=window.MLCLocalDailyTracking,owner=account?.id||'guest';
 const status=$('localTrackingStatus'),list=$('localTrackingEntries'),day=localTrackingDate();
 try{
  const doc=api.read(localStorage,owner),sum=api.summarize(doc,day);
  const unit=$('localWaterUnit').value;
  $('localWaterTotal').textContent=unit==='oz'?(sum.waterMl/29.5735).toFixed(1)+' oz':sum.waterMl.toLocaleString()+' mL';
  $('localCaloriesTotal').textContent=sum.calories.toLocaleString();
  $('localMacroTotals').textContent=['protein','carbs','fat'].map(k=>k[0].toUpperCase()+k.slice(1)+': '+(sum.macros[k].knownEntries?sum.macros[k].total.toFixed(1)+' g from '+sum.macros[k].knownEntries+' logged foods':'not recorded')).join(' · ');
  $('localWeightLatest').textContent=sum.weight===null?'—':sum.weight+' lb';
  const types=[['water','Water'],['food','Food'],['weight','Weight']];
  const rows=types.flatMap(([type,label])=>doc[type].filter(x=>x.day===day).map(x=>({type,label,...x})));
  list.innerHTML=rows.length?rows.map(x=>{
   const value=x.type==='water'?x.amount+' mL':x.type==='weight'?x.value+' lb':x.name+' · '+x.calories+' cal';
   return '<div class="recent-item"><div><strong>'+escapeHTML(x.label)+'</strong><small>'+escapeHTML(value)+'</small></div><button type="button" class="button-outline" data-local-remove="'+escapeHTML(x.id)+'" data-local-type="'+x.type+'">Remove</button></div>';
  }).join(''):'<p class="small">No 2.0 local entries for this day.</p>';
  status.textContent='Local entries for '+day+' · '+(account?'signed-in account':'guest')+' workspace. Original cloud history is separate.';
 }catch(error){
  list.replaceChildren();status.textContent='Stored local tracking could not be read. Existing records have not been overwritten: '+String(error.message||error).slice(0,110);
  $('localWaterTotal').textContent='—';$('localCaloriesTotal').textContent='—';$('localWeightLatest').textContent='—';$('localMacroTotals').textContent='Local records unavailable.';
 }
}
function localTrackingAdd(type,entry,form){
 const owner=account?.id||'guest';
 try{
  window.MLCLocalDailyTracking.add(localStorage,owner,type,{...entry,id:'local-'+crypto.randomUUID(),day:localTrackingDate()});
  form.reset();renderLocalDailyTracking();notice('Saved to this browser only; original account records unchanged.');
 }catch(error){notice('Could not save local tracking: '+String(error.message||error).slice(0,125))}
}
function localFoodMacro(id){
 const raw=$(id).value.trim();return raw===''?null:Number(raw);
}
function renderOriginalTracking(){
 const status=$('trackingStatus'),button=$('loadOriginalTracking'),month=$('trackingMonth'),monthlyStatus=$('trackingMonthStatus'),monthlySummary=$('trackingMonthlySummary');
 if(!status||!button)return;
 button.disabled=!account;
 const valid=Boolean(account?.id&&importedTrackingOwner===account.id&&originalTracking);
 month.disabled=!valid;monthlySummary.replaceChildren();
 for(const id of ['Water','Food','Weight'])$('tracking'+id+'Count').textContent=valid?String(originalTracking[id.toLowerCase()].length):'—';
 $('trackingGoals').textContent=valid?'Logged water goal: '+(originalTracking.waterGoal?Math.round(originalTracking.waterGoal)+' '+(originalTracking.waterUnit==='oz'?'oz':'mL'):'Not set')+' · Calorie goal: '+(originalTracking.calorieGoal??'Not set')+' · Saved meals: '+originalTracking.savedMeals+' · Food favorites: '+originalTracking.foodFavorites:'';
 for(const id of ['Water','Food','Weight'])$('tracking'+id+'List').replaceChildren();
 monthlyStatus.textContent=valid?'':'Load original tracking to view monthly totals.';
 if(!account?.id){status.textContent='Sign in to view your original tracking history.';return;}
 if(!valid){status.textContent='Ready to load original tracking without modifying any records.';return;}
 status.textContent='Read-only original tracking data loaded for the signed-in account.';
 if(!month.value){
  const days=[...originalTracking.water,...originalTracking.food,...originalTracking.weight].map(x=>x.day).filter(Boolean).sort().reverse();
  month.value=days[0]?.slice(0,7)||new Date().toISOString().slice(0,7);
 }
 const summary=window.MLCOriginalTracking.monthSummary(originalTracking,month.value);
 const unit=originalTracking.waterUnit==='oz'?'oz':'mL';
 if(summary){
  monthlyStatus.textContent='Logged entries for '+summary.month+' only; not estimates of consumption.';
  monthlySummary.innerHTML='<div class="recent-item"><strong>Hydration entries</strong><span>'+summary.waterEntries+' · '+Math.round(summary.totalWater).toLocaleString()+' '+unit+'</span></div>'+
   '<div class="recent-item"><strong>Food entries</strong><span>'+summary.foodEntries+' · '+Math.round(summary.calories).toLocaleString()+' logged calories</span></div>'+
   '<div class="recent-item"><strong>Weight entries</strong><span>'+summary.weightEntries+(summary.latestWeight?' · last '+summary.latestWeight.value+' lb':'')+'</span></div>';
 }

 const order=(a,b)=>b.day.localeCompare(a.day);
 const water=originalTracking.water.filter(x=>x.day.startsWith(month.value+'-')).slice().sort(order).slice(0,100);
 $('trackingWaterList').innerHTML=water.map(x=>'<div class="recent-item"><strong>'+escapeHTML(x.day)+'</strong><span>'+Math.round(x.amount)+' '+unit+'</span></div>').join('')||'<p class="small">No water records found.</p>';
 const food=originalTracking.food.filter(x=>x.day.startsWith(month.value+'-')).slice().sort(order).slice(0,100);
 $('trackingFoodList').innerHTML=food.map(x=>'<div class="recent-item"><div><strong>'+escapeHTML(x.name)+'</strong><small>'+escapeHTML(x.day)+'</small></div><span>'+x.calories+' cal</span></div>').join('')||'<p class="small">No food records found.</p>';
 const weight=originalTracking.weight.filter(x=>x.day.startsWith(month.value+'-')).slice().sort(order).slice(0,100);
 $('trackingWeightList').innerHTML=weight.map(x=>'<div class="recent-item"><strong>'+escapeHTML(x.day)+'</strong><span>'+x.value+' lb</span></div>').join('')||'<p class="small">No weight records found.</p>';
}
async function loadOriginalTracking(){
 if(!account?.id||!auth?.access_token){notice('Sign in before loading original tracking.');return;}
 const owner=account.id,epoch=++trackingLoadEpoch,button=$('loadOriginalTracking'),status=$('trackingStatus');
 button.disabled=true;status.textContent='Reading original account tracking records…';
 try{
  await validateStoredAuth();
  if(account?.id!==owner||!auth?.access_token)throw Error('Account session expired or changed');
  const data=await window.MLCOriginalTracking.load({endpoint:BACKEND,publishableKey:PUBLIC_KEY,accessToken:auth.access_token,userId:owner});
  if(account?.id!==owner||trackingLoadEpoch!==epoch)return;
  originalTracking=data;importedTrackingOwner=data?owner:null;
  renderOriginalTracking();
  if(!data)status.textContent='No original tracking records returned for this account.';
 }catch(error){
  if(account?.id!==owner||trackingLoadEpoch!==epoch)return;
  clearOriginalTracking();
  status.textContent='Could not load original tracking: '+String(error.message||error).slice(0,170);
 }finally{if(trackingLoadEpoch===epoch)button.disabled=!account}
}
function clearOriginalAccountSettings(){
 settingsLoadEpoch++;
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
 const owner=account.id,epoch=++settingsLoadEpoch,status=$('originalSettingsStatus'),button=$('loadOriginalSettings');
 button.disabled=true;status.textContent='Reading original profile and goals…';
 try{
  await validateStoredAuth();
  if(account?.id!==owner||!auth?.access_token)throw Error('Account changed or session expired');
  const result=await window.MLCOriginalAccountSettings.load({endpoint:BACKEND,publishableKey:PUBLIC_KEY,accessToken:auth.access_token,userId:owner});
  if(account?.id!==owner||settingsLoadEpoch!==epoch)return;
  originalAccountSettings=result;importedSettingsOwner=result?owner:null;renderOriginalAccountSettings();
  if(!result)status.textContent='No original profile or training-goal records exist for this account.';
 }catch(err){
  if(account?.id!==owner||settingsLoadEpoch!==epoch)return;
  clearOriginalAccountSettings();
  status.textContent='Original settings could not be loaded: '+String(err.message||err).slice(0,160);
 }finally{if(settingsLoadEpoch===epoch)button.disabled=!account}
}
async function loadAllOriginalRecords(){
 const button=$('loadAllOriginalRecords'),status=$('loadAllOriginalStatus');
 if(!account?.id||!auth?.access_token){status.textContent='Sign in before loading original records.';return;}
 const owner=account.id,epoch=++combinedLoadEpoch;
 button.disabled=true;
 status.textContent='Loading original completed workouts, tracking and profile (read-only)…';
 try{
  await Promise.allSettled([loadOriginalHistory(),loadOriginalTracking(),loadOriginalAccountSettings()]);
  if(account?.id!==owner||combinedLoadEpoch!==epoch)return;
  const loaded=[
   importedHistoryOwner===owner,
   importedTrackingOwner===owner&&Boolean(originalTracking),
   importedSettingsOwner===owner&&Boolean(originalAccountSettings)
  ];
  const count=loaded.filter(Boolean).length;
  status.textContent=count===3?'All three original account sections loaded read-only.':
   count+' of 3 original account sections loaded. Review each section for missing records or read errors.';
 }catch(error){
  if(account?.id===owner&&combinedLoadEpoch===epoch)status.textContent='Could not complete original record loading: '+String(error.message||error).slice(0,140);
 }finally{if(combinedLoadEpoch===epoch)button.disabled=!account}
}
async function runCloudReadinessCheck(){
 const button=$('cloudReadinessButton'),status=$('cloudReadinessStatus');
 if(!button||!status)return;
 const owner=account?.id;
 button.disabled=true;
 status.textContent='Checking sign-in and cloud read capability. This does not upload or save any workout.';
 try{
  const checked=await window.MLCV2ReadOnlyPreflight.check({
   owner,session:auth,getSession:async()=>auth,
   verifyUser:token=>authRequest('user',null,token,'GET'),
   localDocument:activeRecurring,validExerciseIds:allowedExerciseIds,
   readCloud:async token=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
     // This RPC is read-only (SELECT). Its absence is a release blocker, not a save failure.
     const response=await fetch(BACKEND+'/rest/v1/rpc/prism_v2_schedule_read',{
      method:'POST',headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body:'{}',cache:'no-store',signal:controller.signal
     });
     return {status:response.status,data:await response.json().catch(()=>null)};
    }finally{clearTimeout(timer)}
   }
  });
  if(account?.id!==owner)throw Error('Account changed during check');
  status.textContent=checked.summary.workouts+' local workouts, '+checked.summary.datedOverrides+
   ' one-time dates and '+checked.summary.recurringRules+' repeating rules checked. '+
   (checked.available?'V2 cloud read is available (revision '+checked.revision+').':
    checked.reason+'.')+' Cloud saving remains disabled; no data was changed.';
 }catch(error){
  status.textContent='Read-only check incomplete: '+String(error.message||error).slice(0,180)+
   '. No workouts were uploaded or overwritten.';
 }finally{button.disabled=!account}
}
function renderSettings(){
 $('accountIdentity').textContent=account?.email?account.email+' · authenticated (production workout data is not loaded)':'Not signed in. You can still explore the demo.';
 $('backendStatus').textContent=account?'AUTHENTICATED':'NOT CONNECTED';
 $('cloudPill').textContent=account?'ACCOUNT CONNECTED · DEMO':'DEMO WORKSPACE';
 $('authAction').textContent=account?'Sign out':'Sign in with existing account';
 $('cloudReadinessButton').disabled=!account||!activeRecurring;
 $('loadAllOriginalRecords').disabled=!account;
}
function openModal(content){$('modalContent').innerHTML=content;$('modal').hidden=false;document.body.style.overflow='hidden';$('closeModal').focus()}
function persistOpenSession(){
 if(!session||!activePlan||!sessionDirty)return;
 if(activeSessionOwner!==(account?.id||'guest')){notice('Account changed. Workout draft was not saved.');return;}
 try{window.MLCSessionDraft.save(localStorage,activeSessionOwner,activePlan,session)}
 catch(error){notice('Could not protect unfinished workout: '+String(error.message||error).slice(0,100))}
}
function closeModal(){
 if(session&&activePlan)persistOpenSession();
 closeRest();$('modal').hidden=true;document.body.style.overflow='';activePlan=null;session=null;activeSessionOwner=null;sessionDirty=false;
}
function openWorkout(id){
 const plan=(originalPreviewActive()?originalCustomSchedule.plans:[]).find(x=>x.id===id)||weekly.plans.find(x=>x.id===id);
 if(!plan)return;
 const owner=account?.id||'guest';
 let draft;
 try{draft=window.MLCSessionDraft.read(localStorage,owner)}
 catch(error){notice(String(error.message||error));return;}
 if(draft&&draft.planId!==plan.id){
  if(!confirm('An unfinished workout is saved for this account. Discard it and start another workout?'))return;
  try{window.MLCSessionDraft.clear(localStorage,owner)}catch{notice('Cannot discard saved workout draft.');return;}
  draft=null;
 }
 activeSessionOwner=owner;sessionDirty=Boolean(draft);
 activePlan=draft?{...draft.plan,ids:draft.plan.ids.slice()}:{...plan,ids:plan.ids.slice()};
 session=draft?{sets:draft.sets.map(x=>({...x})),readiness:draft.readiness,startedAt:draft.startedAt||Date.now()}:{sets:[],readiness:'Normal',startedAt:Date.now()};
 openModal('<div class="modal-eyebrow">PRACTICE SESSION · LOCAL ONLY</div><h2>'+escapeHTML(activePlan.title)+'</h2><p>'+escapeHTML(activePlan.description)+' All entries stay in the isolated demo workspace and will not be uploaded to Supabase.</p><div class="panel"><strong>How are you feeling today?</strong><p class="small">Readiness check-in saved with this practice session only.</p><div class="hero-actions" id="sessionReadiness"><button type="button" class="button-outline" data-session-readiness="Great" aria-pressed="false">Great</button><button type="button" class="button-outline" data-session-readiness="Normal" aria-pressed="true">Normal</button><button type="button" class="button-outline" data-session-readiness="Tired" aria-pressed="false">Tired</button></div></div><div class="panel"><strong id="sessionSetProgressText">Ready to start</strong><progress id="sessionSetProgress" value="0" max="1" style="width:100%" aria-label="Completed practice sets"></progress><p class="small">Progress reflects logged sets in this practice session.</p></div><div id="workoutLog" class="workout-log"></div><div class="modal-footer"><button type="button" class="button-outline" id="cancelWorkout">Save for later</button><button type="button" class="button-outline" id="discardWorkout">Discard draft</button><button type="button" class="button-outline" id="startRest">Rest 1:30</button><button type="button" class="button-primary" id="finishWorkout">Finish session</button></div>');
 renderWorkoutLog();
 updateSessionReadiness(session.readiness,false);
 for(const exerciseId of activePlan.ids)updateExerciseFeedback(exerciseId);
 if(draft)notice('Unfinished workout restored from this browser.');
 $('cancelWorkout').addEventListener('click',closeModal);
 $('discardWorkout').addEventListener('click',()=>{
  if(!confirm('Discard this unfinished practice workout? Your completed sessions and weekly workout plan will not change.'))return;
  try{
   window.MLCSessionDraft.clear(localStorage,activeSessionOwner);
   session=null;activePlan=null;activeSessionOwner=null;sessionDirty=false;
   closeModal();notice('Unfinished practice workout discarded.');
  }catch{notice('Could not discard unfinished draft; it remains saved.')}
 });
 $('startRest').addEventListener('click',openRest);
 $('finishWorkout').addEventListener('click',()=>{
  if(!session?.sets.length){notice('Add at least one practice set first.');return}
  const entry={id:'demo-'+Date.now(),created:new Date().toISOString(),title:activePlan.title,planId:activePlan.id,sets:session.sets.map(x=>({...x})),readiness:session.readiness,startedAt:session.startedAt};
  const updated=[entry,...demoSessions].slice(0,100);
  try{
   localStorage.setItem(demoKey(activeSessionOwner),JSON.stringify(updated));
   if(localStorage.getItem(demoKey(activeSessionOwner))!==JSON.stringify(updated))throw Error('Save verification failed');
   demoSessions=updated;
   window.MLCSessionDraft.clear(localStorage,activeSessionOwner);
   // Completion must not recreate the in-progress draft.
   session=null;activePlan=null;activeSessionOwner=null;sessionDirty=false;
   closeModal();renderHome();setPage('progress');renderCoach();notice('Practice session saved in this browser.');
  }catch{notice('Could not finish saving this workout. Your unfinished draft is retained.')}

 });
}
function updateSessionReadiness(value,record=true){
 if(!session||!['Great','Normal','Tired'].includes(value))return;
 session.readiness=value;
 if(record){sessionDirty=true;persistOpenSession();}
 document.querySelectorAll('[data-session-readiness]').forEach(button=>{
  const chosen=button.dataset.sessionReadiness===value;
  button.setAttribute('aria-pressed',String(chosen));
  button.classList.toggle('selected',chosen);
 });
}
function renderSessionSetProgress(){
 if(!session||!activePlan||!$('sessionSetProgress'))return;
 const target=activePlan.ids.reduce((total,id)=>total+(exerciseById(id)?.sets||3),0);
 const logged=session.sets.length;
 $('sessionSetProgressText').textContent=logged?logged+' of '+target+' planned sets logged':'Ready to start · '+target+' planned sets';
 $('sessionSetProgress').max=Math.max(1,target);
 $('sessionSetProgress').value=Math.min(logged,target);
}
function renderWorkoutLog(inputSnapshot=null){
 if(!activePlan)return;
 $('workoutLog').innerHTML=activePlan.ids.map(id=>{
  const e=exerciseById(id);
  const count=session.sets.filter(x=>x.exerciseId===id).length;
  const originalGuide=originalExercises.find(x=>x.id===id);
  const tips=originalGuide?.tips||[];
  const mistakes=originalGuide?.mistakes||[];
  const photo=libraryImage(originalGuide||e);
  const visual='<details class="panel"><summary>Exercise image &amp; anatomy</summary><div class="exercise-detail-visuals">'+(photo?'<img loading="lazy" src="'+escapeHTML(photo)+'" alt="'+escapeHTML(e.name)+' exercise reference">':'<p class="small">No original exercise photo supplied.</p>')+'<div>'+exerciseAnatomy(originalGuide||e,'mini')+visualMuscleNames(originalGuide||e)+'</div></div><p class="small">Static reference; movement animation pending.</p></details>';
  const guidance='<details class="panel"><summary>Exercise form &amp; technique</summary><p>'+escapeHTML(originalGuide?.how||e.cue||'Follow a comfortable controlled range of motion.')+'</p>'+
    (tips.length?'<strong>Technique tips</strong><ul>'+tips.map(x=>'<li>'+escapeHTML(x)+'</li>').join('')+'</ul>':'')+
    (mistakes.length?'<strong>Common mistakes</strong><ul>'+mistakes.map(x=>'<li>'+escapeHTML(x)+'</li>').join('')+'</ul>':'')+'</details>';
  const recorded=session.sets.map((set,index)=>({...set,index})).filter(set=>set.exerciseId===id);
  const lastPracticeSet=window.MLCCoachReview.priorSet(demoSessions,id);
  const compareNote=lastPracticeSet?'<p class="small">Last local practice: '+lastPracticeSet.weight+' lb × '+lastPracticeSet.reps+' reps</p>':'';
  const logged=recorded.length?'<div class="recent-list">'+recorded.map(set=>
   '<div class="recent-item"><div><strong>Logged set '+(recorded.indexOf(set)+1)+'</strong><small>'+escapeHTML(window.MLCCoachReview.compare(set,lastPracticeSet)?.label||'No comparison available')+'</small><div class="inputs"><label>Weight (lb)<input type="number" min="0" max="1500" step="2.5" inputmode="decimal" aria-label="Edit set weight" data-edit-weight="'+set.index+'" value="'+set.weight+'"></label><label>Reps<input type="number" min="1" max="100" step="1" inputmode="numeric" aria-label="Edit set reps" data-edit-reps="'+set.index+'" value="'+set.reps+'"></label><button type="button" class="button-outline" data-save-logged-set="'+set.index+'">Save set</button><button type="button" class="button-outline" data-delete-logged-set="'+set.index+'">Remove set</button></div></div></div>'
  ).join('')+'</div>':'';
  const options=window.MLCSessionCoach.rankedAlternatives(id,activePlan.ids,editorExercises);
  const previous=account?.id&&importedHistoryOwner===account.id?
    window.MLCOriginalHistory.latestWorkingWeight(originalHistory,id):null;
  const localCoachResult=window.MLCSessionCoach.localProgression(demoSessions,id,e.name);
  const originalCoachResult=previous?window.MLCSessionCoach.coach(originalHistory,id,e.name):null;
  const coachSource=localCoachResult.status==='ready'?'2.0 completed workouts':originalCoachResult?.status==='ready'?'Original completed history':null;
  const coachResult=localCoachResult.status==='ready'?localCoachResult:originalCoachResult;
  const coachHint=coachResult?.status==='ready'?
    '<div class="panel"><strong>Coach progression · '+escapeHTML(coachSource)+'</strong><p class="small">'+escapeHTML(coachResult.action.toUpperCase()+': '+coachResult.reason)+'</p><button class="button-outline" type="button" data-use-coach="'+id+'">Use suggested '+coachResult.weight+' lb for this set</button></div>':'';
  let savedTarget=null,targetError=false;
  try{savedTarget=window.MLCCoachTargets.get(localStorage,activeSessionOwner,id)}
  catch{targetError=true}
  const targetHint='<div class="panel"><strong>My working-weight target · local only</strong>'+
   (targetError?'<p class="small">Saved targets need recovery. No target can be changed until storage is repaired.</p>':
    '<p class="small">'+(savedTarget!==null?'Personal target: '+savedTarget+' lb.':'No personal target set.')+
    ' A personal target is separate from Coach\'s calculated suggestion.</p>'+
    '<div class="inputs"><label>Personal target (lb)<input type="number" min="0.25" max="1000" step="0.25" inputmode="decimal" data-target-weight="'+escapeHTML(id)+'" value="'+(savedTarget??'')+'"></label>'+
    '<button type="button" class="button-outline" data-target-save="'+escapeHTML(id)+'">Save target</button>'+
    (savedTarget!==null?'<button type="button" class="button-outline" data-target-use="'+escapeHTML(id)+'">Use '+savedTarget+' lb for this set</button><button type="button" class="button-outline" data-target-clear="'+escapeHTML(id)+'">Clear target</button>':'')+
    '</div>')+'</div>';
  const historyHint=previous?'<div class="hero-actions"><span class="small">Last original workout: '+previous.weight+' lb on '+escapeHTML(previous.date)+'</span><button type="button" class="button-outline" data-use-last="'+id+'">Use last weight</button></div>':'';
  const replacement=options.length?'<div class="inputs"><label>Replace this exercise<select aria-label="Replacement for '+escapeHTML(e.name)+'" data-swap-select="'+id+'"><option value="">Choose same-muscle alternative</option>'+options.map(x=>'<option value="'+escapeHTML(x.id)+'">'+escapeHTML(x.name)+' · '+escapeHTML(x.reason)+'</option>').join('')+'</select></label><button type="button" class="button-outline" data-swap-apply="'+id+'">Replace exercise</button></div>':'<p class="small">No unused same-muscle alternatives available.</p>';
  return '<article class="log-card" data-exercise-card="'+id+'"><div class="log-title"><h4>'+escapeHTML(e.name)+'</h4><span class="logged-count" data-count="'+id+'">'+count+' logged</span></div><small>Target: '+e.sets+' sets × '+escapeHTML(e.reps)+' reps</small>'+visual+guidance+coachHint+targetHint+historyHint+compareNote+replacement+logged+'<p class="small" data-warmups="'+id+'"></p><div class="inputs"><label>Weight (lb)<input aria-label="'+escapeHTML(e.name)+' weight in pounds" type="number" min="0" max="1500" step="2.5" inputmode="decimal" data-weight="'+id+'" value="40"></label><label>Reps<input aria-label="'+escapeHTML(e.name)+' repetitions" type="number" min="1" max="100" step="1" inputmode="numeric" data-reps="'+id+'" value="10"></label><button class="button-outline" data-addset="'+id+'" type="button">Log set</button></div><div class="set-feedback" data-feedback="'+id+'" role="status" aria-live="polite"></div><button class="undo-set" data-undo="'+id+'" type="button" hidden>Undo last set</button></article>'
 }).join('');
 if(inputSnapshot)window.MLCSessionInputContinuity.restore($('workoutLog'),inputSnapshot,activePlan.ids);
 renderSessionSetProgress();
 for(const id of activePlan.ids)updateWarmupGuide(id);
}
function coachTargetOwner(){
 const owner=account?.id||'guest';
 return activePlan&&session&&activeSessionOwner===owner?owner:null;
}
function saveCoachTarget(id){
 const owner=coachTargetOwner();
 if(!owner||!activePlan.ids.includes(id))return;
 const input=document.querySelector('[data-target-weight="'+id+'"]');
 if(!input)return;
 if(input.value.trim()===''){notice('Enter a target weight, or use Clear target.');return;}
 try{
  const value=Number(input.value);
  window.MLCCoachTargets.save(localStorage,owner,id,value);
  const snapshot=window.MLCSessionInputContinuity.capture($('workoutLog'),activePlan.ids);
  renderWorkoutLog(snapshot);
  notice('Personal target saved on this device only. No set or workout plan was changed.');
 }catch(error){notice('Target not saved: '+String(error.message||error).slice(0,120))}
}
function clearCoachTarget(id){
 const owner=coachTargetOwner();
 if(!owner||!activePlan.ids.includes(id))return;
 try{
  window.MLCCoachTargets.clear(localStorage,owner,id);
  const snapshot=window.MLCSessionInputContinuity.capture($('workoutLog'),activePlan.ids);
  renderWorkoutLog(snapshot);
  notice('Personal target cleared. Recorded workouts remain unchanged.');
 }catch(error){notice('Target not cleared: '+String(error.message||error).slice(0,120))}
}
function useCoachTarget(id){
 const owner=coachTargetOwner(),field=document.querySelector('[data-weight="'+id+'"]');
 if(!owner||!activePlan.ids.includes(id)||!field)return;
 try{
  const weight=window.MLCCoachTargets.get(localStorage,owner,id);
  if(weight===null)return;
  field.value=String(weight);
  updateWarmupGuide(id);
  notice('Personal target copied into this set only. Log the set when ready.');
 }catch(error){notice('Target unavailable: '+String(error.message||error).slice(0,120))}
}
function useCoachWeight(id){
 if(!activePlan?.ids.includes(id))return;
 const ex=exerciseById(id),field=document.querySelector('[data-weight="'+id+'"]');
 if(!ex||!field)return;
 const localResult=window.MLCSessionCoach.localProgression(demoSessions,id,ex.name);
 const originalResult=account?.id&&importedHistoryOwner===account.id?
   window.MLCSessionCoach.coach(originalHistory,id,ex.name):null;
 const result=localResult.status==='ready'?localResult:originalResult;
 if(result?.status!=='ready'||!Number.isFinite(result.weight)||result.weight<=0||result.weight>1500)return;
 field.value=String(result.weight);
 updateWarmupGuide(id);
 notice('Coach suggested weight entered for this set only. No sets or weekly plans changed.');
}
function updateWarmupGuide(id){
 const field=document.querySelector('[data-weight="'+id+'"]'),root=document.querySelector('[data-warmups="'+id+'"]');
 if(!field||!root)return;
 const values=window.MLCSessionCoach.warmups(field.value);
 root.textContent=values.length?'Optional warm-ups (not counted): '+values.map(x=>x.weight+' lb × '+x.reps).join(' · '):'Set a working weight to view optional warm-ups.';
}
function reuseLastWorkingWeight(id){
 if(!activePlan?.ids.includes(id)||!account?.id||importedHistoryOwner!==account.id)return;
 const previous=window.MLCOriginalHistory.latestWorkingWeight(originalHistory,id);
 const field=document.querySelector('[data-weight="'+id+'"]');
 if(!previous||!field)return;
 field.value=String(previous.weight);
 updateWarmupGuide(id);
 notice('Last logged weight copied into this set. Nothing was automatically saved.');
}
function replaceSessionExercise(id){
 if(!session||!activePlan?.ids.includes(id))return;
 const choice=document.querySelector('[data-swap-select="'+id+'"]');
 if(!choice?.value){notice('Choose a same-muscle alternative first.');return;}
 try{
  const result=window.MLCSessionSubstitutions.replace(activePlan,session.sets,id,choice.value,editorExercises);
  activePlan=result.plan;
  session.sets=result.retainedSets;
  sessionDirty=true;persistOpenSession();
  renderWorkoutLog();
  for(const exerciseId of activePlan.ids)updateExerciseFeedback(exerciseId);
  notice(result.retainedOriginal?'Replacement added; previously logged sets were preserved.':'Exercise replaced for this session only. Your saved weekly plan is unchanged.');
 }catch(error){notice(String(error.message||error).slice(0,140))}
}
function updateExerciseFeedback(id){
 const sets=session.sets.filter(x=>x.exerciseId===id);
 const count=document.querySelector('[data-count="'+id+'"]');
 const feedback=document.querySelector('[data-feedback="'+id+'"]');
 const undo=document.querySelector('[data-undo="'+id+'"]');
 if(count)count.textContent=sets.length+' logged';
 if(feedback)feedback.textContent=sets.length?('Last set: '+sets[sets.length-1].weight+' lb × '+sets[sets.length-1].reps+' reps'):'';
 if(undo)undo.hidden=sets.length===0;
 renderSessionSetProgress();
}
function removeLoggedSet(index){
 if(!session||!activePlan||!Number.isInteger(index)||index<0||index>=session.sets.length)return;
 session.sets.splice(index,1);sessionDirty=true;persistOpenSession();
 renderWorkoutLog();
 for(const id of activePlan.ids)updateExerciseFeedback(id);
 notice('Selected logged set removed from this practice session.');
}
function updateLoggedSet(index){
 if(!session||!Number.isInteger(index)||index<0||index>=session.sets.length)return;
 const weightField=document.querySelector('[data-edit-weight="'+index+'"]');
 const repsField=document.querySelector('[data-edit-reps="'+index+'"]');
 if(!weightField||!repsField)return;
 const weight=Number(weightField.value),reps=Number(repsField.value);
 if(!weightField.value.trim()||!repsField.value.trim()||!Number.isFinite(weight)||
   weight<0||weight>1500||!Number.isInteger(reps)||reps<1||reps>100){
  notice('Enter a valid weight and repetition count.');return;
 }
 session.sets[index]={...session.sets[index],weight,reps};
 sessionDirty=true;persistOpenSession();
 const cardId=session.sets[index].exerciseId;
 renderWorkoutLog();
 for(const id of activePlan.ids)updateExerciseFeedback(id);
 notice('Logged set updated and saved to your unfinished workout.');
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
 const inputSnapshot=window.MLCSessionInputContinuity.capture($('workoutLog'),activePlan.ids);
 session.sets.push({exerciseId:id,weight,reps});
 sessionDirty=true;persistOpenSession();
 // Update this exercise without discarding entries for other movements.
 renderWorkoutLog(inputSnapshot);
 for(const exerciseId of activePlan.ids)updateExerciseFeedback(exerciseId);
}
function undoSet(id){
 if(!session||!activePlan?.ids.includes(id))return;
 const index=session.sets.findLastIndex(x=>x.exerciseId===id);
 if(index<0)return;
 const inputSnapshot=window.MLCSessionInputContinuity.capture($('workoutLog'),activePlan.ids);
 session.sets.splice(index,1);
 sessionDirty=true;persistOpenSession();
 renderWorkoutLog(inputSnapshot);
 for(const exerciseId of activePlan.ids)updateExerciseFeedback(exerciseId);
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
 const e=exerciseById(next);
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
 // A session already in progress belongs to its original account.
 if(activePlan&&activeSessionOwner&&activeSessionOwner!==data.user?.id)closeModal();
 const session={access_token:data.access_token,refresh_token:data.refresh_token,user:data.user,expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600)};
 if(account?.id&&account.id!==data.user?.id){combinedLoadEpoch++;$('loadAllOriginalStatus').textContent='Account changed. Load records for the current account.';clearOriginalHistory();clearOriginalTracking();clearOriginalAccountSettings();clearOriginalCustomSchedule();}sessionStorage.setItem(AUTH_KEY,JSON.stringify(session));auth=session;account=data.user;demoSessions=loadDemo(account.id);renderLocalDailyTracking();refreshWeeklyOwner();renderHome();renderWorkouts();renderProgress();renderCoach();renderSettings();renderOriginalHistory();
}
function clearAuth(){if(activePlan)closeModal();combinedLoadEpoch++;if($('loadAllOriginalStatus'))$('loadAllOriginalStatus').textContent='Sign in to load original account records.';if($('cloudReadinessStatus'))$('cloudReadinessStatus').textContent='Sign in and activate a complete local schedule before checking cloud readiness.';sessionStorage.removeItem(AUTH_KEY);auth=null;account=null;demoSessions=loadDemo('guest');renderLocalDailyTracking();clearOriginalHistory();clearOriginalTracking();clearOriginalAccountSettings();clearOriginalCustomSchedule();refreshWeeklyOwner();renderHome();renderWorkouts();renderProgress();renderCoach();renderSettings()}
async function validateStoredAuth(){
 try{
  const saved=JSON.parse(sessionStorage.getItem(AUTH_KEY)||'null');
  if(!saved?.access_token||!saved?.user?.id)return;
  let token=saved.access_token;
  if(saved.expires_at<Date.now()/1000+45&&saved.refresh_token){
    const refreshed=await authRequest('token?grant_type=refresh_token',{refresh_token:saved.refresh_token});
    saveAuth(refreshed);token=refreshed.access_token;
  }else{auth=saved;account=saved.user;demoSessions=loadDemo(account.id);renderLocalDailyTracking();refreshWeeklyOwner();renderHome();renderWorkouts();renderProgress();renderCoach()}
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
 document.querySelectorAll('[data-workout-action]').forEach(el=>el.addEventListener('click',()=>{
  // Both shortcuts use the existing account-scoped editor, not a second plan.
  if(originalPreviewActive()){notice('Switch from read-only original preview to edit your local workouts.');setPage('workouts');return;}
  if(weeklyDraftReadError){notice('Saved workout needs recovery before editing; existing data preserved.');setPage('workouts');return;}
  const day=weeklyAPI.dayIndex(new Date());
  chooseWeekday(day);
  if(el.dataset.workoutAction==='create')createWeekWorkout();
 }));
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
 $('todayExercises').addEventListener('click',e=>{const item=e.target.closest('[data-exercise-open]');if(item)exerciseDetail(item.dataset.exerciseOpen);});
 $('heroStart').addEventListener('click',()=>openToday());
 $('heroViewPlan').addEventListener('click',()=>setPage('workouts'));
 $('todayStart').addEventListener('click',()=>openWorkout(nextPlan().id));
 $('workoutGrid').addEventListener('click',e=>{const el=e.target.closest('[data-workout]');if(el)openWorkout(el.dataset.workout)});
 for(const key of ['weeklyBoardHome','weeklyBoardWorkouts'])$(key).addEventListener('click',e=>{const btn=e.target.closest('[data-week-day]');if(btn)chooseWeekday(Number(btn.dataset.weekDay))});
 $('weekWorkoutSelect').addEventListener('change',updateWeekEditor);
 prepareWeekLibraryFilters();
 $('weekExerciseSearch').addEventListener('input',filterWeekEditorExercises);
 $('weekExerciseMuscle').addEventListener('change',filterWeekEditorExercises);
 $('weekExerciseEquipment').addEventListener('change',filterWeekEditorExercises);
 $('weekExerciseFavorites').addEventListener('change',filterWeekEditorExercises);
 $('weekExerciseReset').addEventListener('click',()=>{
  $('weekExerciseSearch').value='';$('weekExerciseMuscle').value='';$('weekExerciseEquipment').value='';$('weekExerciseFavorites').checked=false;
  filterWeekEditorExercises();
 });
 $('weekExerciseOptions').addEventListener('change',filterWeekEditorExercises);
 $('weekExerciseOptions').addEventListener('click',e=>{
  const button=e.target.closest('[data-week-library-detail]');
  if(button)exerciseDetail(button.dataset.weekLibraryDetail);
 });
 $('weekSaveButton').addEventListener('click',saveWeekEditor);
 $('weekRestoreRepeating').addEventListener('click',restoreRepeatingForDate);
 $('weekNewWorkout').addEventListener('click',createWeekWorkout);
 $('weekDuplicateWorkout').addEventListener('click',duplicateWeekWorkout);

 prepareLibraryEquipment();
 $('fullLibraryImportFile').addEventListener('change',importVerifiedFullCatalog);
 $('exerciseSearch').addEventListener('input',renderLibrary);
 $('libraryEquipment').addEventListener('change',renderLibrary);
 $('libraryPhotosOnly').addEventListener('change',renderLibrary);
 $('libraryVisualStatus').addEventListener('change',renderLibrary);
 $('libraryAnatomyStatus').addEventListener('change',renderLibrary);
 $('libraryShowMore').addEventListener('click',()=>renderLibrary({append:true}));
 $('libraryFavoritesOnly').addEventListener('change',renderLibrary);
 $('libraryRecentList').addEventListener('click',e=>{const btn=e.target.closest('[data-library-recent]');if(btn)exerciseDetail(btn.dataset.libraryRecent);});
 $('libraryReset').addEventListener('click',()=>{
  $('exerciseSearch').value='';$('libraryEquipment').value='';$('libraryPhotosOnly').checked=false;$('libraryFavoritesOnly').checked=false;$('libraryVisualStatus').value='all';$('libraryAnatomyStatus').value='all';
  muscleFilter='';renderLibrary();
 });
 for(const id of ['sessionHistory','coachProgressionList']){
  $(id).addEventListener('click',e=>{
   const button=e.target.closest('[data-exercise-open]');if(button)exerciseDetail(button.dataset.exerciseOpen);
  });
 }
 $('libraryGrid').addEventListener('click',e=>{const favorite=e.target.closest('[data-library-favorite]');if(favorite){toggleLibraryFavorite(favorite.dataset.libraryFavorite);return;}const button=e.target.closest('[data-library-detail]');if(button)exerciseDetail(button.dataset.libraryDetail)});
 $('libraryChips').addEventListener('click',event=>{const el=event.target.closest('[data-muscle]');if(!el)return;muscleFilter=el.dataset.muscle;renderLibrary()});
 document.querySelectorAll('[data-account-page]').forEach(el=>el.addEventListener('click',()=>setPage(el.dataset.accountPage)));

 $('modalContent').addEventListener('input',e=>{const field=e.target.closest('[data-weight]');if(field)updateWarmupGuide(field.dataset.weight)});
 $('modalContent').addEventListener('click',e=>{const favorite=e.target.closest('[data-library-favorite]');if(favorite){toggleLibraryFavorite(favorite.dataset.libraryFavorite);return;}const related=e.target.closest('[data-library-related]');if(related){exerciseDetail(related.dataset.libraryRelated);return}const stage=e.target.closest('[data-library-stage]');if(stage){stageLibraryExercise(stage.dataset.libraryStage);return}const remove=e.target.closest('[data-delete-logged-set]');if(remove){removeLoggedSet(Number(remove.dataset.deleteLoggedSet));return}const edit=e.target.closest('[data-save-logged-set]');if(edit){updateLoggedSet(Number(edit.dataset.saveLoggedSet));return}const add=e.target.closest('[data-addset]');if(add){addSet(add.dataset.addset);return}const readiness=e.target.closest('[data-session-readiness]');if(readiness){updateSessionReadiness(readiness.dataset.sessionReadiness);return}const targetSave=e.target.closest('[data-target-save]');if(targetSave){saveCoachTarget(targetSave.dataset.targetSave);return}
 const targetUse=e.target.closest('[data-target-use]');if(targetUse){useCoachTarget(targetUse.dataset.targetUse);return}
 const targetClear=e.target.closest('[data-target-clear]');if(targetClear){clearCoachTarget(targetClear.dataset.targetClear);return}
 const coach=e.target.closest('[data-use-coach]');if(coach){useCoachWeight(coach.dataset.useCoach);return}const last=e.target.closest('[data-use-last]');if(last){reuseLastWorkingWeight(last.dataset.useLast);return}const swap=e.target.closest('[data-swap-apply]');if(swap){replaceSessionExercise(swap.dataset.swapApply);return}const undo=e.target.closest('[data-undo]');if(undo)undoSet(undo.dataset.undo)});
 $('closeModal').addEventListener('click',closeModal);
 $('restClose').addEventListener('click',closeRest);
 $('restSkip').addEventListener('click',closeRest);
 $('restPause').addEventListener('click',()=>{restPaused=!restPaused;updateRestClock()});
 $('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('modal').hidden)closeModal()});
 $('clearDemo').addEventListener('click',()=>{if(!confirm('Delete only MYLIFTCOACH 2.0 practice sessions stored in this browser?'))return;demoSessions=[];localStorage.removeItem(demoKey());renderProgress();renderCoach();renderHome();notice('Local demo history cleared. Production data untouched.')});
 $('loadOriginalHistory').addEventListener('click',loadOriginalHistory);
 $('homeLoadOriginalHistory').addEventListener('click',loadOriginalHistory);
 document.querySelectorAll('[data-home-original-progress]').forEach(el=>el.addEventListener('click',()=>setPage('progress')));
 $('coachLoadOriginalHistory').addEventListener('click',loadOriginalHistory);
 $('coachOpenToday').addEventListener('click',()=>{const chosen=resolvedWorkout();if(!chosen.plan){notice('No workout assigned today.');setPage('workouts');return;}if(weeklyDraftReadError){notice('Recover the saved schedule before starting.');return;}openWorkout(chosen.plan.id);});
 $('coachMovementSearch').addEventListener('input',renderOriginalCoachEvidence);
 $('originalHistorySearch').addEventListener('input',renderOriginalHistory);
 $('originalCalendarMonth').addEventListener('change',renderOriginalCalendar);
 $('originalExerciseTrendSelect').addEventListener('change',()=>renderOriginalExerciseTrend());
 $('loadOriginalTracking').addEventListener('click',loadOriginalTracking);
 $('trackingMonth').addEventListener('change',renderOriginalTracking);
 $('localTrackingDay').addEventListener('change',renderLocalDailyTracking);
 $('localWaterUnit').addEventListener('change',renderLocalDailyTracking);
 $('localWaterForm').addEventListener('submit',e=>{
  e.preventDefault();
  const amount=window.MLCLocalDailyTracking.waterMl($('localWaterAmount').value,$('localWaterUnit').value);
  if(amount===null){notice('Enter a valid water amount.');return;}
  localTrackingAdd('water',{amount},e.target);
 });
 $('quickWaterButton').addEventListener('click',()=>{
  localTrackingAdd('water',{amount:window.MLCLocalDailyTracking.waterMl(8,'oz')},$('localWaterForm'));
 });
 $('localFoodForm').addEventListener('submit',e=>{
  e.preventDefault();
  localTrackingAdd('food',{name:$('localFoodName').value.trim(),calories:Number($('localFoodCalories').value),
   protein:localFoodMacro('localFoodProtein'),carbs:localFoodMacro('localFoodCarbs'),fat:localFoodMacro('localFoodFat')},e.target);
 });
 $('localWeightForm').addEventListener('submit',e=>{
  e.preventDefault();localTrackingAdd('weight',{value:Number($('localWeightValue').value)},e.target);
 });
 $('localTrackingEntries').addEventListener('click',e=>{
  const button=e.target.closest('[data-local-remove]');if(!button)return;
  if(!confirm('Remove this local 2.0 entry? Your original records will not change.'))return;
  try{window.MLCLocalDailyTracking.remove(localStorage,account?.id||'guest',button.dataset.localType,button.dataset.localRemove);
   renderLocalDailyTracking();notice('Local entry removed.');}
  catch(error){notice('Could not remove local entry: '+String(error.message||error).slice(0,100))}
 });

 $('loadOriginalCustom').addEventListener('click',loadOriginalCustomSchedule);
 $('toggleOriginalCustom').addEventListener('click',toggleOriginalCustomSchedule);
 $('copyOriginalCustom').addEventListener('click',copyOriginalToEditable);
 $('inspectRecurringMigration').addEventListener('click',inspectCompleteRecurringMigration);
 $('activateFullRecurring').addEventListener('click',activateCompleteRecurringLocally);
 $('loadOriginalSettings').addEventListener('click',loadOriginalAccountSettings);
 $('loadAllOriginalRecords').addEventListener('click',loadAllOriginalRecords);
 $('cloudReadinessButton').addEventListener('click',runCloudReadinessCheck);
 $('authAction').addEventListener('click',()=>{if(!account){openSignIn();return}clearAuth();notice('Signed out of 2.0. Original app session remains unchanged.')});
}
refreshWeeklyOwner();bind();renderOriginalCustomSchedule();renderHome();renderWorkouts();renderLibrary();renderProgress();renderCoach();renderLocalDailyTracking();renderOriginalTracking();renderSettings();renderOriginalAccountSettings();validateStoredAuth();
})();