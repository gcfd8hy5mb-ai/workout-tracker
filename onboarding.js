/* PRISM local profile and goal phases. No credentials or account tokens. */
const PRISM_JOURNEY_KEY="prismJourneyV1";
const PRISM_PHASES_KEY="prismGoalPhasesV1";
const PRISM_PROFILE_KEY="prismLocalProfileV1";
const PRISM_AVATARS=["prism","blue","teal","violet"];
const PRISM_GOAL_NAMES={bulk:"Bulk",cut:"Cut",maintain:"Maintain",recomp:"Recomp / Not Sure"};
const PRISM_TRAINING_NAMES={muscle:"Build Muscle",strength:"Get Stronger","fat-loss":"Lose Weight",consistency:"General Fitness"};
const PRISM_ACTIVITIES={1.2:"Sedentary",1.375:"Lightly Active",1.55:"Moderately Active",1.725:"Very Active",1.9:"Extremely Active",1.4:"Some daily movement",1.6:"Active most days"};
const PRISM_PACES={conservative:"Conservative",moderate:"Moderate",faster:"Faster"};
const PRISM_STEPS=["profile","training","body","duration","calories","preferences","ready"];
function prismReadJson(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function prismExistingData(){
if(["workoutGoalsV1","workoutHistoryV52","customWorkoutsV5","prismActiveWorkoutV1"].some(key=>localStorage.getItem(key)!==null))return true;
const saved=prismReadJson("dailyTrackingV1",{});
return ["water","food","weight","measurements"].some(key=>Array.isArray(saved[key])&&saved[key].length>0)||Boolean(saved.calorieAge||saved.calorieGoal);
}
let prismJourney=prismReadJson(PRISM_JOURNEY_KEY,null);
if(!prismJourney||!["welcome","onboarding","complete"].includes(prismJourney.status)){
prismJourney={status:prismExistingData()?"complete":"welcome",mode:prismExistingData()?"local":"guest",step:0,draft:{}};
localStorage.setItem(PRISM_JOURNEY_KEY,JSON.stringify(prismJourney));
}
let prismPhases=prismReadJson(PRISM_PHASES_KEY,[]);
if(!Array.isArray(prismPhases))prismPhases=[];
function savePrismJourney(){localStorage.setItem(PRISM_JOURNEY_KEY,JSON.stringify(prismJourney))}
function savePrismPhases(){localStorage.setItem(PRISM_PHASES_KEY,JSON.stringify(prismPhases))}
let prismLocalProfile=prismReadJson(PRISM_PROFILE_KEY,null);
function savePrismLocalProfile(){prismLocalProfile.updatedAt=new Date().toISOString();localStorage.setItem(PRISM_PROFILE_KEY,JSON.stringify(prismLocalProfile))}
function prismProfileName(){return typeof prismLocalProfile?.displayName==="string"?prismLocalProfile.displayName.trim():""}
function prismAvatarMarkup(id=prismLocalProfile?.avatarId){
if(id==="prism")return `<img src="images/app-icon-192.png" alt="">`;
return `<span class="prism-avatar-symbol" aria-hidden="true">${id==="teal"?"◇":id==="violet"?"✧":"P"}</span>`;
}
function prismProfileMigration(){
const prior=prismJourney.status==="complete"||prismExistingData();
if(prismExistingData()&&prismJourney.status==="welcome"){
prismJourney.status="complete";prismJourney.mode="local";savePrismJourney();
}
if(!prismLocalProfile||typeof prismLocalProfile!=="object"||Array.isArray(prismLocalProfile)){
const now=new Date().toISOString();prismLocalProfile={userId:null,displayName:"",avatarId:"prism",onboardingComplete:prior,createdAt:now,updatedAt:now};savePrismLocalProfile();
}else{
let changed=false;
if(prismLocalProfile.userId===undefined){prismLocalProfile.userId=null;changed=true}
if(!PRISM_AVATARS.includes(prismLocalProfile.avatarId)){prismLocalProfile.avatarId="prism";changed=true}
if(prior&&!prismLocalProfile.onboardingComplete){prismLocalProfile.onboardingComplete=true;changed=true}
if(changed)savePrismLocalProfile();
}
if(prismJourney.status==="onboarding"&&!prismJourney.localProfileStepVersion){
const oldStep=Math.max(0,Math.min(5,Number(prismJourney.step)||0));
prismJourney.resumeStep=oldStep+1;prismJourney.step=0;prismJourney.localProfileStepVersion=1;savePrismJourney();
}
}
prismProfileMigration();
function prismDateAtNoon(day){return new Date(day+"T12:00:00")}
function prismDatePlusDays(day,days){const date=prismDateAtNoon(day);date.setDate(date.getDate()+days);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function prismDateLabel(day){return prismDateAtNoon(day).toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"})}
function prismDaysBetween(start,end){return Math.round((prismDateAtNoon(end)-prismDateAtNoon(start))/86400000)}
function prismActivePhase(){return prismPhases.findLast(phase=>phase.status==="active")||null}
function prismCurrentWeight(){return weightEntriesNewestFirst()[0]?.value??null}
function prismWeightAtOrBefore(day){const entries=tracking.weight.filter(entry=>entry.day<=day).sort((a,b)=>b.day.localeCompare(a.day));return entries[0]?.value??null}
function prismGoalFactor(goal=prismActivePhase()?.type,pace=prismActivePhase()?.pace||"moderate"){
if(!goal)return null;
const factors={bulk:{conservative:1.05,moderate:1.08,faster:1.10},cut:{conservative:.93,moderate:.88,faster:.85},maintain:{conservative:1,moderate:1,faster:1},recomp:{conservative:1,moderate:.98,faster:.97}};
return factors[goal]?.[pace]??null;
}
/* Mifflin-St Jeor (1990): resting kcal/day. Activity multipliers estimate
   maintenance; modest goal factors are adjustable starting estimates. */
function prismCalorieEstimate({age,sex,feet,inches,weight,activity,goal,pace}){
age=Number(age);feet=Number(feet);inches=Number(inches);weight=Number(weight);activity=Number(activity);
if(!Number.isInteger(age)||age<18||age>100||!Number.isInteger(feet)||feet<3||feet>7||!Number.isInteger(inches)||inches<0||inches>11||!Number.isFinite(weight)||weight<50||weight>800||!Object.hasOwn(PRISM_ACTIVITIES,activity)||!["male","female","neutral"].includes(sex))return null;
const kg=weight/2.20462,cm=(feet*12+inches)*2.54;
const offset=sex==="male"?5:sex==="female"?-161:-78;
const rawMaintenance=(10*kg+6.25*cm-5*age+offset)*activity;
const maintenance=Math.round(rawMaintenance/25)*25;
const factor=prismGoalFactor(goal,pace);
return factor?{maintenance,target:Math.round(rawMaintenance*factor/25)*25}:null;
}
function prismSelectedOptions(values,selected,fn){
return values.map(([value,label,detail])=>`<button type="button" class="journey-option" aria-pressed="${selected===value}" onclick="${fn}('${value}')"><span><strong>${label}</strong>${detail?`<br><small>${detail}</small>`:""}</span><span aria-hidden="true">${selected===value?"✓":""}</span></button>`).join("");
}
function prismProgress(step){return `<div class="journey-progress" aria-label="Setup step ${step+1} of 7">${PRISM_STEPS.map((_,i)=>`<span class="${i<=step?"done":""}"></span>`).join("")}</div><span class="journey-eyebrow">STEP ${step+1} OF 7</span>`}
function showPrismWelcome(){prismJourney.status="welcome";savePrismJourney();showScreen("welcomeScreen")}
function startPrismGuest(){
if(prismJourney.status==="complete"){goHome();return}
prismJourney.status="onboarding";prismJourney.mode="guest";prismJourney.step=Number.isInteger(prismJourney.step)?prismJourney.step:0;
prismJourney.localProfileStepVersion=1;savePrismJourney();renderPrismJourney();
}
function prismChoose(field,value){prismJourney.draft[field]=value;savePrismJourney();renderPrismJourney()}
function prismBack(){if(prismJourney.step===0){showPrismWelcome();return}prismJourney.step--;savePrismJourney();renderPrismJourney()}
function prismNext(){
const step=prismJourney.step,d=prismJourney.draft,error=document.getElementById("journeyError");
if(step===0){const name=document.getElementById("journey-name")?.value.trim();if(!name||name.length>40){error.textContent="Enter a display name (up to 40 characters).";return}d.displayName=name;d.units=document.getElementById("journey-profile-units")?.value||"lb";savePrismJourney();if(prismJourney.resumeStep){prismJourney.step=prismJourney.resumeStep;delete prismJourney.resumeStep;savePrismJourney();renderPrismJourney();return}}
if(step===1&&!PRISM_TRAINING_NAMES[d.training]){error.textContent="Choose a training goal.";return}
if(step===2&&!PRISM_GOAL_NAMES[d.body]){error.textContent="Choose a body goal.";return}
if(step===3){
const start=d.start||localDay(),end=d.weeks==="custom"?d.end:prismDatePlusDays(start,Number(d.weeks||0)*7);
if(!/^\d{4}-\d{2}-\d{2}$/.test(end||"")||!Number.isFinite(prismDateAtNoon(end).getTime())||prismDaysBetween(start,end)<1||prismDaysBetween(start,end)>730){error.textContent="Choose an end date after today, within two years.";return}
d.start=start;d.end=end;d.durationWeeks=Math.max(1,Math.round(prismDaysBetween(start,end)/7));
}
if(step===4){prismCaptureCalories();if(!d.calorieSkipped&&!prismCalorieEstimate({...d,goal:d.body,pace:d.pace||"moderate"})){error.textContent="Enter valid age, height, weight and activity, or skip for now.";return}}
if(step===5){prismCapturePreferences();if(![2,3,4,5].includes(Number(d.days))){error.textContent="Choose 2–5 days per week.";return}}
prismJourney.step=Math.min(6,step+1);savePrismJourney();renderPrismJourney();
}
function prismCaptureCalories(){
const d=prismJourney.draft;
for(const field of ["age","sex","feet","inches","weight","activity","pace"]){const input=document.getElementById("journey-"+field);if(input)d[field]=input.value}
d.calorieSkipped=false;savePrismJourney();prismUpdateCaloriePreview();
}
function prismSkipCalories(){prismJourney.draft.calorieSkipped=true;prismJourney.step=5;savePrismJourney();renderPrismJourney()}
function prismCapturePreferences(){
const d=prismJourney.draft;
for(const field of ["level","rest","days","focus"]){const input=document.getElementById("journey-"+field);if(input)d[field]=input.value}
savePrismJourney();
}
function prismUpdateDuration(){
const d=prismJourney.draft;
const weeks=document.getElementById("journey-weeks")?.value||"8",end=document.getElementById("journey-end")?.value;
d.weeks=weeks;if(end)d.end=end;savePrismJourney();
document.getElementById("journey-custom-wrap").classList.toggle("hidden",weeks!=="custom");
const target=weeks==="custom"?d.end:prismDatePlusDays(d.start||localDay(),Number(weeks)*7);
document.getElementById("journey-date-preview").textContent=target&&Number.isFinite(prismDateAtNoon(target).getTime())?`${PRISM_GOAL_NAMES[d.body]} · ${weeks==="custom"?"Custom end date":weeks+" weeks"} · ${prismDateLabel(d.start||localDay())} → ${prismDateLabel(target)}`:"Choose an end date.";
}
function prismUpdateCaloriePreview(){
const d=prismJourney.draft;
const out=document.getElementById("journey-calorie-preview");if(!out)return;
const estimate=prismCalorieEstimate({...d,goal:d.body,pace:d.pace||"moderate"});
out.innerHTML=estimate?`<div class="journey-summary"><span>Estimated maintenance</span><strong>${estimate.maintenance.toLocaleString()} kcal/day</strong></div><div class="journey-summary"><span>Recommended ${PRISM_GOAL_NAMES[d.body]} target</span><strong>${estimate.target.toLocaleString()} kcal/day</strong></div>`:"Enter your details to see a starting estimate.";
}
function prismJourneyActions(next="Continue"){return `<p id="journeyError" class="journey-error" role="alert"></p><div class="journey-actions"><button type="button" class="journey-primary" onclick="prismNext()">${next}</button><button type="button" class="journey-secondary" onclick="prismBack()">Back</button></div>`}
function renderPrismJourney(){
showScreen("onboardingScreen");
const d=prismJourney.draft,s=prismJourney.step,area=document.getElementById("prismJourneyContent");
let html=prismProgress(s);
if(s===0)html+=`<h2>CREATE YOUR PRISM PROFILE</h2><p>Your personal setup stays on this device.</p><div class="journey-card journey-form"><label for="journey-name">What should PRISM call you?</label><input id="journey-name" type="text" maxlength="40" autocomplete="nickname" placeholder="Your name" value="${escapeHTML(d.displayName||prismProfileName())}" oninput="prismJourney.draft.displayName=this.value;savePrismJourney()"><label>Choose an avatar</label><div class="prism-avatar-choices" role="group" aria-label="Profile avatar">${PRISM_AVATARS.map(id=>`<button type="button" class="prism-avatar-option ${id===(d.avatarId||"prism")?"selected":""}" aria-label="${id} avatar" aria-pressed="${id===(d.avatarId||"prism")}" onclick="prismChoose('avatarId','${id}')">${prismAvatarMarkup(id)}</button>`).join("")}</div><label for="journey-profile-units">Units</label><select id="journey-profile-units" onchange="prismJourney.draft.units=this.value;savePrismJourney()"><option value="lb" ${(d.units||tracking.preferredWeightUnit)!=="kg"?"selected":""}>Pounds</option><option value="kg" ${(d.units||tracking.preferredWeightUnit)==="kg"?"selected":""}>Kilograms</option></select><p class="journey-note">Workout set entry currently uses pounds. This choice sets your display preference.</p></div>${prismJourneyActions()}`;
if(s===1)html+=`<h2>What are you training for?</h2><p>Your answer helps shape your workout plan.</p>${prismSelectedOptions([["muscle","Build Muscle"],["strength","Get Stronger"],["fat-loss","Lose Weight"],["consistency","General Fitness"]],d.training,"prismChooseTraining")}${prismJourneyActions()}`;
if(s===2)html+=`<h2>What best describes your current body goal?</h2>${prismSelectedOptions([["bulk","BULK","Gain weight / muscle"],["cut","CUT","Lose weight / body fat"],["maintain","MAINTAIN","Maintain current body weight"],["recomp","RECOMP / NOT SURE","Build muscle while staying near the same body weight"]],d.body,"prismChooseBody")}${prismJourneyActions()}`;
if(s===3)html+=`<h2>How long do you want to follow this goal?</h2><div class="journey-card journey-form"><label for="journey-weeks">Duration</label><select id="journey-weeks" onchange="prismUpdateDuration()">${[4,6,8,12,16].map(n=>`<option value="${n}" ${String(d.weeks||"8")===String(n)?"selected":""}>${n} weeks</option>`).join("")}<option value="custom" ${d.weeks==="custom"?"selected":""}>Custom end date</option></select><div id="journey-custom-wrap" class="${d.weeks==="custom"?"":"hidden"}"><label for="journey-end">End date</label><input id="journey-end" type="date" min="${prismDatePlusDays(localDay(),1)}" value="${d.end||""}" onchange="prismUpdateDuration()"></div><p id="journey-date-preview" class="journey-note"></p></div>${prismJourneyActions("Confirm duration")}`;
if(s===4)html+=`<h2>Set a starting calorie target</h2><p>Optional. PRISM estimates your maintenance and a modest starting target. Your actual needs may differ.</p><div class="journey-card journey-form" oninput="prismCaptureCalories()"><div class="journey-inline"><div><label for="journey-age">Age (18+)</label><input id="journey-age" type="number" inputmode="numeric" min="18" max="100" value="${d.age||""}"></div><div><label for="journey-sex">Sex used for estimate</label><select id="journey-sex"><option value="neutral" ${d.sex==="neutral"?"selected":""}>Neutral average</option><option value="female" ${d.sex==="female"?"selected":""}>Female-based</option><option value="male" ${d.sex==="male"?"selected":""}>Male-based</option></select></div></div><div class="journey-inline"><div><label for="journey-feet">Height (feet)</label><input id="journey-feet" type="number" inputmode="numeric" min="3" max="7" value="${d.feet||""}"></div><div><label for="journey-inches">Inches</label><input id="journey-inches" type="number" inputmode="numeric" min="0" max="11" value="${d.inches??""}"></div></div><label for="journey-weight">Current weight (lb)</label><input id="journey-weight" type="number" inputmode="decimal" step="0.1" min="50" max="800" value="${d.weight||prismCurrentWeight()||""}"><label for="journey-activity">Activity level</label><select id="journey-activity">${[1.2,1.375,1.55,1.725,1.9].map(v=>`<option value="${v}" ${String(d.activity||1.375)===String(v)?"selected":""}>${PRISM_ACTIVITIES[v]}</option>`).join("")}</select><label for="journey-pace">Goal pace</label><select id="journey-pace">${Object.entries(PRISM_PACES).map(([v,label])=>`<option value="${v}" ${(d.pace||"moderate")===v?"selected":""}>${label}</option>`).join("")}</select><div id="journey-calorie-preview" role="status"></div><p class="journey-note"><a href="https://pubmed.ncbi.nlm.nih.gov/2305711/" target="_blank" rel="noopener noreferrer">Mifflin-St Jeor</a> resting estimate × activity level, then a modest goal adjustment. This is a starting estimate.</p></div>${prismJourneyActions("Use estimate")}<div class="journey-actions"><button type="button" onclick="prismSkipCalories()">SKIP FOR NOW</button></div>`;
if(s===5)html+=`<h2>Set up your training</h2><p>Keep it simple. You can adjust these in Profile later.</p><div class="journey-card journey-form"><label for="journey-level">Experience</label><select id="journey-level">${["Beginner","Intermediate","Advanced"].map(x=>`<option ${d.level===x?"selected":""}>${x}</option>`).join("")}</select><label for="journey-rest">Rest between sets</label><select id="journey-rest">${[60,90,120,180].map(v=>`<option value="${v}" ${String(d.rest||90)===String(v)?"selected":""}>${v} seconds</option>`).join("")}</select><label for="journey-days">Days per week</label><select id="journey-days">${[2,3,4,5].map(v=>`<option value="${v}" ${String(d.days||4)===String(v)?"selected":""}>${v} days</option>`).join("")}</select><label for="journey-focus">Equipment / focus</label><select id="journey-focus"><option value="balanced" ${d.focus==="balanced"?"selected":""}>Mostly machines · balanced</option><option value="upper" ${d.focus==="upper"?"selected":""}>Mostly machines · upper focus</option><option value="lower" ${d.focus==="lower"?"selected":""}>Mostly machines · lower focus</option></select></div>${prismJourneyActions("See my setup")}`;
if(s===6){
const est=d.calorieSkipped?null:prismCalorieEstimate({...d,goal:d.body,pace:d.pace||"moderate"});
html+=`<h2>YOU'RE READY${d.displayName?", "+escapeHTML(d.displayName.toUpperCase()):""}</h2><p>PRISM is set up for your current goal.</p><div class="journey-card"><div class="journey-summary"><span>Training goal</span><strong>${PRISM_TRAINING_NAMES[d.training]}</strong></div><div class="journey-summary"><span>Body goal</span><strong>${PRISM_GOAL_NAMES[d.body]}</strong></div><div class="journey-summary"><span>Duration</span><strong>${d.durationWeeks} weeks</strong></div><div class="journey-summary"><span>Review date</span><strong>${prismDateLabel(d.end)}</strong></div><div class="journey-summary"><span>Estimated calorie target</span><strong>${est?est.target.toLocaleString()+" kcal/day":"Set later"}</strong></div><div class="journey-summary"><span>Training</span><strong>${d.days} days/week</strong></div></div><div class="journey-actions"><button class="journey-primary" onclick="finishPrismJourney()">START TRAINING</button><button class="journey-secondary" onclick="prismBack()">Back</button></div>`;
}
area.innerHTML=html;
if(s===3)prismUpdateDuration();
if(s===4)prismUpdateCaloriePreview();
}
function prismChooseTraining(value){prismChoose("training",value)}
function prismChooseBody(value){prismChoose("body",value)}
function finishPrismJourney(){
const d=prismJourney.draft;
if(!d.displayName?.trim()||!PRISM_TRAINING_NAMES[d.training]||!PRISM_GOAL_NAMES[d.body]||!d.end||![2,3,4,5].includes(Number(d.days)))return;
const existing=prismActivePhase();
if(existing){existing.status="closed";existing.closedAt=localDay()}
const phase={id:newTrackingId(),status:"active",type:d.body,startDate:d.start,endDate:d.end,durationWeeks:d.durationWeeks,pace:d.pace||"moderate",startWeight:Number(d.weight)||prismCurrentWeight(),calorieTarget:null,customCalorieTarget:null};
prismPhases.push(phase);savePrismPhases();
workoutGoals={goal:d.training,days:Number(d.days),focus:d.focus||"balanced",gender:"prefer"};
localStorage.setItem("workoutGoalsV1",JSON.stringify(workoutGoals));
tracking.restSeconds=Number(d.rest)||90;tracking.preferredWeightUnit=d.units||"lb";tracking.trainingLevel=d.level||"Beginner";
if(!d.calorieSkipped){
const est=prismCalorieEstimate({...d,goal:d.body,pace:d.pace||"moderate"});
if(est){
tracking.calorieAge=Number(d.age);tracking.calorieFeet=Number(d.feet);tracking.calorieInches=Number(d.inches);
tracking.calorieEquation=d.sex||"neutral";tracking.calorieActivity=d.activity||"1.375";
tracking.calorieMode="auto";tracking.calorieGoal=null;phase.calorieTarget=est.target;
const current=Number(d.weight),latest=weightEntriesNewestFirst()[0];
if(Number.isFinite(current)&&current>0&&(!latest||latest.day!==localDay()||Number(latest.value)!==current))tracking.weight.push({id:newTrackingId(),day:localDay(),value:current});
}
}
saveTracking();savePrismPhases();
prismLocalProfile.displayName=d.displayName.trim();prismLocalProfile.avatarId=PRISM_AVATARS.includes(d.avatarId)?d.avatarId:"prism";prismLocalProfile.onboardingComplete=true;savePrismLocalProfile();
prismJourney.status="complete";prismJourney.step=6;prismJourney.draft={};savePrismJourney();goHome();
}
function markPrismCalorieOverride(value){const phase=prismActivePhase();if(phase){phase.customCalorieTarget=value;savePrismPhases()}}
function prismPhaseWeightChange(phase){
const current=prismCurrentWeight(),start=Number(phase.startWeight);
return current!=null&&Number.isFinite(start)&&start>0?Number(current)-start:null;
}
function prismDisplayedWeight(value){const unit=tracking.preferredWeightUnit||"lb";return unit==="kg"?`${(Number(value)/2.20462).toFixed(1)} kg`:`${Number(value).toFixed(1)} lb`}
function renderPrismCurrentGoal(){
const area=document.getElementById("currentGoalCard"),phase=prismActivePhase();area.replaceChildren();
if(!phase)return;
const now=localDay(),elapsed=Math.max(0,prismDaysBetween(phase.startDate,now)),week=Math.min(phase.durationWeeks,Math.floor(elapsed/7)+1),change=prismPhaseWeightChange(phase),target=dailyCalorieTarget(now);
area.innerHTML=`<div class="card goal-phase-card"><span class="journey-eyebrow">CURRENT GOAL</span><h3>${PRISM_GOAL_NAMES[phase.type]}</h3><p class="small">Week ${week} of ${phase.durationWeeks} · Review ${prismDateLabel(phase.endDate)}</p><p class="small">Calorie target: ${target?target.toLocaleString()+" kcal/day"+(tracking.calorieMode==="manual"?" · custom":" · estimate"):"Set up in Goals"}</p><p class="small">Weight change: ${change===null?"Log weight to see it":`${change>0?"+":""}${prismDisplayedWeight(change)}`}</p><button type="button" onclick="showTrackingGoals()">VIEW GOAL</button></div>`;
}
function renderPrismGoalSettings(){
const area=document.getElementById("prismGoalSettings"),phase=prismActivePhase();
if(!phase){area.innerHTML='<div class="card"><h3>Body goal</h3><p class="small">Set a goal phase and review date when you are ready.</p><button onclick="startNewPrismGoal()">Set a body goal</button></div>';return}
area.innerHTML=`<div class="card"><h3>Current goal · ${PRISM_GOAL_NAMES[phase.type]}</h3><p class="small">${prismDateLabel(phase.startDate)} → ${prismDateLabel(phase.endDate)} · ${phase.durationWeeks} weeks${phase.customCalorieTarget?" · custom calorie target":""}</p><form class="journey-form" onsubmit="savePrismGoalSettings(event)"><label for="goalEditTraining">Training goal</label><select id="goalEditTraining">${Object.entries(PRISM_TRAINING_NAMES).map(([v,label])=>`<option value="${v}" ${workoutGoals?.goal===v?"selected":""}>${label}</option>`).join("")}</select><label for="goalEditType">Body goal</label><select id="goalEditType">${Object.entries(PRISM_GOAL_NAMES).map(([v,label])=>`<option value="${v}" ${phase.type===v?"selected":""}>${label}</option>`).join("")}</select><label for="goalEditWeeks">Goal duration</label><select id="goalEditWeeks" onchange="prismGoalWeeksChanged()">${[4,6,8,12,16].map(v=>`<option value="${v}" ${phase.durationWeeks===v?"selected":""}>${v} weeks</option>`).join("")}<option value="custom" ${[4,6,8,12,16].includes(phase.durationWeeks)?"":"selected"}>Custom end date</option></select><label for="goalEditEnd">Review / end date</label><input id="goalEditEnd" type="date" min="${prismDatePlusDays(localDay(),1)}" value="${phase.endDate}"><label for="goalEditPace">Goal pace</label><select id="goalEditPace">${Object.entries(PRISM_PACES).map(([v,label])=>`<option value="${v}" ${phase.pace===v?"selected":""}>${label}</option>`).join("")}</select><label for="goalEditActivity">Activity level</label><select id="goalEditActivity">${Object.entries(PRISM_ACTIVITIES).map(([v,label])=>`<option value="${v}" ${String(tracking.calorieActivity)===v?"selected":""}>${label}</option>`).join("")}</select><label for="goalEditUnits">Weight display preference</label><select id="goalEditUnits"><option value="lb" ${tracking.preferredWeightUnit!=="kg"?"selected":""}>Pounds</option><option value="kg" ${tracking.preferredWeightUnit==="kg"?"selected":""}>Kilograms</option></select><p class="journey-note">Workout set entry currently uses pounds.</p><label for="goalEditRest">Rest timer</label><select id="goalEditRest">${[60,90,120,180].map(v=>`<option value="${v}" ${Number(tracking.restSeconds)===v?"selected":""}>${v} seconds</option>`).join("")}</select><p id="goalEditError" class="journey-error" role="alert"></p><button type="submit" class="journey-primary">Save goal settings</button></form><button type="button" onclick="showCalorieSettings()">Edit calorie target</button></div><div class="card"><h3>Goal history</h3>${prismPhases.map(p=>`<div class="journey-summary"><span>${PRISM_GOAL_NAMES[p.type]||"Goal"}</span><span>${prismDateLabel(p.startDate)} – ${prismDateLabel(p.closedAt||p.endDate)}</span></div>`).join("")}</div>`;
}
function prismGoalWeeksChanged(){const weeks=document.getElementById("goalEditWeeks").value,phase=prismActivePhase();if(phase&&weeks!=="custom")document.getElementById("goalEditEnd").value=prismDatePlusDays(phase.startDate,Number(weeks)*7)}
function savePrismGoalSettings(event){
event.preventDefault();
const phase=prismActivePhase(),type=document.getElementById("goalEditType").value,end=document.getElementById("goalEditEnd").value,pace=document.getElementById("goalEditPace").value,training=document.getElementById("goalEditTraining").value;
if(!phase||!PRISM_GOAL_NAMES[type]||!PRISM_TRAINING_NAMES[training]||!PRISM_PACES[pace]||!Number.isFinite(prismDateAtNoon(end).getTime())||prismDaysBetween(localDay(),end)<1||prismDaysBetween(localDay(),end)>730){document.getElementById("goalEditError").textContent="Choose a future review date within two years.";return}
if(type!==phase.type){phase.status="closed";phase.closedAt=localDay();prismPhases.push({id:newTrackingId(),status:"active",type,startDate:localDay(),endDate:end,durationWeeks:Math.max(1,Math.round(prismDaysBetween(localDay(),end)/7)),pace,startWeight:prismCurrentWeight(),calorieTarget:null,customCalorieTarget:tracking.calorieMode==="manual"?tracking.calorieGoal:null})}
else{phase.endDate=end;phase.durationWeeks=Math.max(1,Math.round(prismDaysBetween(phase.startDate,end)/7));phase.pace=pace}
workoutGoals=workoutGoals&&!workoutGoals.skipped?{...workoutGoals,goal:training}: {goal:training,days:4,focus:"balanced",gender:"prefer"};
localStorage.setItem("workoutGoalsV1",JSON.stringify(workoutGoals));
tracking.calorieActivity=document.getElementById("goalEditActivity").value;tracking.preferredWeightUnit=document.getElementById("goalEditUnits").value;tracking.restSeconds=Number(document.getElementById("goalEditRest").value);
saveTracking();savePrismPhases();showTrackingGoals();
}
function showCalorieSettings(){document.getElementById("calorieMode").scrollIntoView({block:"center"});document.getElementById("calorieMode").focus()}
function startNewPrismGoal(){prismJourney={status:"onboarding",mode:"guest",step:prismProfileName()?1:0,localProfileStepVersion:1,draft:{displayName:prismProfileName(),avatarId:prismLocalProfile.avatarId,units:tracking.preferredWeightUnit||"lb"}};savePrismJourney();renderPrismJourney()}
function prismGoalReviewDue(){const phase=prismActivePhase();return phase&&localDay()>=phase.endDate&&prismJourney.reviewSnoozedDay!==localDay()&&!readPrismActiveWorkout()}
function showPrismGoalReview(){
const phase=prismActivePhase();if(!phase)return;
const delta=prismPhaseWeightChange(phase),weeks=Math.max(1,prismDaysBetween(phase.startDate,localDay())/7);
showScreen("goalReviewScreen");
document.getElementById("prismGoalReviewContent").innerHTML=`<span class="journey-eyebrow">GOAL REVIEW</span><h2>Your ${PRISM_GOAL_NAMES[phase.type]} phase is complete</h2><p>You decide what comes next. Your calorie target stays the same until you confirm a change.</p><div class="journey-card"><div class="journey-summary"><span>Planned duration</span><strong>${phase.durationWeeks} weeks</strong></div><div class="journey-summary"><span>Start weight</span><strong>${phase.startWeight?prismDisplayedWeight(phase.startWeight):"Not logged"}</strong></div><div class="journey-summary"><span>Current weight</span><strong>${prismCurrentWeight()?prismDisplayedWeight(prismCurrentWeight()):"Not logged"}</strong></div><div class="journey-summary"><span>Change</span><strong>${delta===null?"Not available":`${delta>0?"+":""}${prismDisplayedWeight(delta)}`}</strong></div><div class="journey-summary"><span>Average weekly change</span><strong>${delta===null?"Not available":`${delta>0?"+":""}${prismDisplayedWeight(delta/weeks)}/week`}</strong></div></div><div class="journey-actions"><button class="journey-primary" onclick="prismReviewChoice('continue')">CONTINUE ${PRISM_GOAL_NAMES[phase.type].toUpperCase()}</button><button onclick="prismReviewChoice('maintain')">MAINTAIN</button><button onclick="prismReviewChoice('bulk')">START A BULK</button><button onclick="prismReviewChoice('change')">CHANGE GOAL</button><button onclick="prismReviewLater()">LATER</button></div><div id="prismReviewExtension"></div>`;
}
function prismReviewChoice(choice){
if(choice==="change"){startNewPrismGoal();return}
const type=choice==="continue"?prismActivePhase().type:choice;
document.getElementById("prismReviewExtension").innerHTML=`<div class="journey-card journey-form"><h3>${PRISM_GOAL_NAMES[type]}</h3><label for="prismReviewWeeks">How many more weeks?</label><select id="prismReviewWeeks">${[4,6,8,12,16].map(v=>`<option value="${v}" ${v===8?"selected":""}>${v} weeks</option>`).join("")}</select><p>Your calorie target will be reviewed only after you confirm.</p><button class="journey-primary" onclick="confirmPrismGoalReview('${type}')">CONFIRM GOAL</button></div>`;
}
function confirmPrismGoalReview(type){
const phase=prismActivePhase(),weeks=Number(document.getElementById("prismReviewWeeks").value);
if(!phase||!PRISM_GOAL_NAMES[type]||![4,6,8,12,16].includes(weeks))return;
phase.status="closed";phase.closedAt=localDay();
const next={id:newTrackingId(),status:"active",type,startDate:localDay(),endDate:prismDatePlusDays(localDay(),weeks*7),durationWeeks:weeks,pace:phase.pace,startWeight:prismCurrentWeight(),calorieTarget:null,customCalorieTarget:tracking.calorieMode==="manual"?tracking.calorieGoal:null};
prismPhases.push(next);savePrismPhases();prismJourney.reviewSnoozedDay=null;savePrismJourney();goHome();
}
function prismReviewLater(){prismJourney.reviewSnoozedDay=localDay();savePrismJourney();goHome()}
function renderPrismLocalProfile(){
const area=document.getElementById("prismLocalProfile");if(!area)return;
const name=prismProfileName(),phase=prismActivePhase(),unit=tracking.preferredWeightUnit||"lb";
area.innerHTML=`<div class="prism-local-hero"><div class="prism-avatar ${prismLocalProfile.avatarId}">${prismAvatarMarkup()}</div><div><strong>${escapeHTML(name||"Your PRISM Profile")}</strong><span>PRISM Guest</span><small>Your PRISM data is currently stored on this device.</small></div></div>
<div class="card prism-local-section"><h3>Personal</h3><form class="journey-form" onsubmit="savePrismPersonal(event)"><label for="prismEditName">Display name</label><input id="prismEditName" type="text" maxlength="40" autocomplete="nickname" value="${escapeHTML(name)}" placeholder="Your name" required><label>Avatar</label><div class="prism-avatar-choices" role="group" aria-label="Profile avatar">${PRISM_AVATARS.map(id=>`<button type="button" class="prism-avatar-option ${id===prismLocalProfile.avatarId?"selected":""}" aria-pressed="${id===prismLocalProfile.avatarId}" aria-label="${id} avatar" onclick="selectPrismProfileAvatar('${id}')">${prismAvatarMarkup(id)}</button>`).join("")}</div><label for="prismEditUnits">Units</label><select id="prismEditUnits"><option value="lb" ${unit==="lb"?"selected":""}>Pounds</option><option value="kg" ${unit==="kg"?"selected":""}>Kilograms</option></select><p class="journey-note">Workout set entry currently uses pounds; this controls your display preference.</p><p id="prismPersonalError" class="journey-error" role="alert"></p><button class="journey-primary" type="submit">Save personal details</button></form></div>
<div class="card prism-local-section"><h3>Training</h3><form class="journey-form" onsubmit="savePrismTraining(event)"><label for="prismEditTraining">Primary training goal</label><select id="prismEditTraining">${Object.entries(PRISM_TRAINING_NAMES).map(([v,label])=>`<option value="${v}" ${workoutGoals?.goal===v?"selected":""}>${label}</option>`).join("")}</select><label for="prismEditLevel">Experience level</label><select id="prismEditLevel">${["Beginner","Intermediate","Advanced"].map(v=>`<option ${tracking.trainingLevel===v?"selected":""}>${v}</option>`).join("")}</select><label for="prismEditDays">Training days per week</label><select id="prismEditDays">${[2,3,4,5].map(v=>`<option value="${v}" ${Number(workoutGoals?.days||4)===v?"selected":""}>${v} days</option>`).join("")}</select><label for="prismEditFocus">Equipment / focus</label><select id="prismEditFocus">${[["balanced","Mostly machines · balanced"],["upper","Mostly machines · upper focus"],["lower","Mostly machines · lower focus"]].map(([v,label])=>`<option value="${v}" ${(workoutGoals?.focus||"balanced")===v?"selected":""}>${label}</option>`).join("")}</select><label for="prismEditRest">Rest between sets</label><select id="prismEditRest">${[60,90,120,180].map(v=>`<option value="${v}" ${Number(tracking.restSeconds||90)===v?"selected":""}>${v} seconds</option>`).join("")}</select><button class="journey-primary" type="submit">Save training preferences</button></form></div>
<div class="card prism-local-section"><h3>Body goal</h3><p class="small">${phase?`${PRISM_GOAL_NAMES[phase.type]} · ${phase.durationWeeks} weeks · Review ${prismDateLabel(phase.endDate)} · ${PRISM_PACES[phase.pace]||"Moderate"} pace`:"Choose a body goal and review date."}</p><p class="small">Calorie target: ${dailyCalorieTarget(localDay())?dailyCalorieTarget(localDay()).toLocaleString()+" kcal/day"+(tracking.calorieMode==="manual"?" · custom":""):"Set later"}</p><button type="button" onclick="showTrackingGoals()">Edit goal, duration &amp; calories</button></div>
<div class="card prism-local-section"><h3>Account status</h3><strong>Guest Profile</strong><p class="small">Your data is stored locally on this device. Back it up before changing phones or clearing browser data.</p><button type="button" onclick="showDataBackup()">Data &amp; Backup</button></div>`;
}
function selectPrismProfileAvatar(id){
if(!PRISM_AVATARS.includes(id))return;
const name=document.getElementById("prismEditName")?.value,units=document.getElementById("prismEditUnits")?.value;
prismLocalProfile.avatarId=id;savePrismLocalProfile();renderPrismLocalProfile();
if(name!==undefined)document.getElementById("prismEditName").value=name;
if(units)document.getElementById("prismEditUnits").value=units;
}
function savePrismPersonal(event){
event.preventDefault();const name=document.getElementById("prismEditName").value.trim();
if(!name||name.length>40){document.getElementById("prismPersonalError").textContent="Enter a display name (up to 40 characters).";return}
prismLocalProfile.displayName=name;savePrismLocalProfile();
tracking.preferredWeightUnit=document.getElementById("prismEditUnits").value;saveTracking();
renderPrismLocalProfile();
}
function savePrismTraining(event){
event.preventDefault();const goal=document.getElementById("prismEditTraining").value;
if(!PRISM_TRAINING_NAMES[goal])return;
workoutGoals={...(workoutGoals||{}),goal,days:Number(document.getElementById("prismEditDays").value),focus:document.getElementById("prismEditFocus").value,gender:workoutGoals?.gender||"prefer"};
localStorage.setItem("workoutGoalsV1",JSON.stringify(workoutGoals));
tracking.trainingLevel=document.getElementById("prismEditLevel").value;tracking.restSeconds=Number(document.getElementById("prismEditRest").value);saveTracking();
renderPrismLocalProfile();
}
function initPrismJourney(){
if(prismJourney.status==="onboarding"){renderPrismJourney();return}
if(prismJourney.status==="welcome"){showPrismWelcome();return}
if(prismGoalReviewDue()){showPrismGoalReview();return}
goHome();
}
initPrismJourney();
