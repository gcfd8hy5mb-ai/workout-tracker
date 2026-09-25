const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync("onboarding.js","utf8");
function run(seed={}){
const items=new Map(Object.entries(seed)),screens=[];
const elements=new Map();
const avatars=["prism","blue","teal","violet"].map(id=>({
getAttribute:key=>key==="data-avatar"?id:null,
classList:{toggle(name,active){this[name]=active}},
setAttribute(key,value){this[key]=value}
}));
const profileActions={style:{bottom:""}};
const visualViewport={height:700,offsetTop:0,addEventListener(){}};
const localStorage={getItem:key=>items.get(key)??null,setItem:(key,value)=>items.set(key,String(value))};
const context={localStorage,console,Date,Math,Object,Number,JSON,String,window:{innerHeight:700,visualViewport},
localDay:()=> "2026-09-24",readPrismActiveWorkout:()=>null,
tracking:{weight:[],calorieMode:"auto",restSeconds:90},workoutGoals:null,
weightEntriesNewestFirst:()=>context.tracking.weight.slice().reverse(),
escapeHTML:v=>String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;"),
saveTracking:()=>localStorage.setItem("dailyTrackingV1",JSON.stringify(context.tracking)),
newTrackingId:()=>String(Math.random()),
showScreen:id=>screens.push(id),goHome:()=>screens.push("home"),
document:{getElementById(id){if(!elements.has(id))elements.set(id,{innerHTML:"",textContent:"",classList:{toggle(){}},value:""});return elements.get(id)},querySelectorAll:()=>avatars,querySelector:()=>profileActions}};
vm.createContext(context);vm.runInContext(source,context);
return {context,items,screens,elements,avatars,profileActions,eval:s=>vm.runInContext(s,context)};
}
const first=run({dailyTrackingV1:JSON.stringify({water:[],food:[],weight:[],calorieMode:"auto"})});
assert.equal(first.screens.at(-1),"welcomeScreen","an empty default tracking object must not skip onboarding");
assert.equal(first.eval("prismCalorieEstimate({age:30,sex:'male',feet:5,inches:10,weight:180,activity:1.55,goal:'cut',pace:'moderate'}).target")>0,true);
assert.equal(first.eval("prismGoalFactor('cut','faster')"),.85);
assert.equal(first.eval("prismGoalFactor('bulk','faster')"),1.10);
first.eval("startPrismGuest()");
assert.equal(first.elements.get("journey-profile-next").disabled,true,"an empty name explains why Continue is disabled");
assert.match(first.elements.get("journey-profile-hint").textContent,/name/i);
first.elements.get("journey-name").value=" Kevin ";
first.elements.get("journey-profile-units").value="lb";
first.eval("prismProfileChanged()");
assert.equal(first.elements.get("journey-profile-next").disabled,false,"default pounds is valid");
first.context.window.visualViewport.height=420;
first.eval("prismProfileViewport()");
assert.equal(first.profileActions.style.bottom,"280px","keyboard inset keeps Continue above the Android visual viewport");
first.context.window.visualViewport.height=700;
first.eval("prismProfileViewport()");
assert.equal(first.profileActions.style.bottom,"0px","closing the keyboard restores the button position");
const beforeAvatar=first.screens.length;
first.eval("prismChoose('avatarId','teal')");
assert.equal(first.screens.length,beforeAvatar,"avatar changes must not re-render and reset scroll or keyboard");
assert.equal(first.avatars[2].classList.selected,true);
assert.equal(JSON.parse(first.items.get("prismJourneyV1")).draft.avatarId,"teal");
first.eval("prismNext()");
assert.equal(first.eval("prismJourney.step"),1,"profile continues with default units and saved name");
assert.equal(first.eval("prismJourney.draft.displayName"),"Kevin");
assert.equal(first.eval("prismJourney.draft.units"),"lb");
const interrupted=run(Object.fromEntries(first.items));
assert.equal(interrupted.eval("prismJourney.step"),1,"onboarding resumes after refresh");
assert.equal(interrupted.eval("prismJourney.draft.avatarId"),"teal");
first.eval("prismJourney.step=4;prismJourney.draft={displayName:'Kevin',avatarId:'blue',body:'cut',training:'muscle',start:'2026-09-24',end:'2026-11-19',durationWeeks:8,age:'30',sex:'female',feet:'5',inches:'5',weight:'160',activity:'1.55',pace:'moderate',days:'4',rest:'90',units:'lb',focus:'balanced'};savePrismJourney()");
const resumed=run(Object.fromEntries(first.items));
assert.equal(resumed.screens.at(-1),"onboardingScreen");
assert.equal(resumed.eval("prismJourney.step"),4);
resumed.eval("prismJourney.step=6;finishPrismJourney()");
assert.equal(resumed.screens.at(-1),"home");
assert.equal(JSON.parse(resumed.items.get("prismGoalPhasesV1")).length,1);
assert.equal(JSON.parse(resumed.items.get("dailyTrackingV1")).weight.length,1);
assert.equal(JSON.parse(resumed.items.get("workoutGoalsV1")).days,4);
assert.equal(JSON.parse(resumed.items.get("prismLocalProfileV1")).displayName,"Kevin");
const active=JSON.parse(resumed.items.get("prismGoalPhasesV1"))[0];
assert.equal(active.endDate,"2026-11-19");
const again=run(Object.fromEntries(resumed.items));
assert.equal(again.screens.at(-1),"home","completed onboarding remains completed after refresh");
again.context.localDay=()=> "2026-11-19";
assert.equal(again.eval("prismGoalReviewDue()"),true,"review appears at the end date");
again.eval("prismReviewLater()");
assert.equal(again.eval("prismGoalReviewDue()"),false,"review can wait until the next day");
again.eval("prismJourney.reviewSnoozedDay=null;prismPhases[0].status='closed';prismPhases[0].closedAt='2026-11-19';prismPhases.push({...prismPhases[0],id:'phase-two',status:'active',type:'maintain',startDate:'2026-11-19',endDate:'2027-01-14'});savePrismPhases()");
assert.equal(JSON.parse(again.items.get("prismGoalPhasesV1")).length,2,"past goal phases stay available");
const savedWorkouts=JSON.stringify([{id:"existing-workout",exercises:[{id:"chest-press",sets:[{weight:180,reps:10}]}]}]);
const savedEntitlement=JSON.stringify({tier:"beta",betaView:"pro"});
const migrated=run({workoutHistoryV52:savedWorkouts,prismEntitlementV1:savedEntitlement});
assert.equal(migrated.screens.at(-1),"home","existing users should not repeat onboarding");
assert.equal(migrated.items.get("workoutHistoryV52"),savedWorkouts);
assert.equal(migrated.items.get("prismEntitlementV1"),savedEntitlement);
assert.equal(JSON.parse(migrated.items.get("prismLocalProfileV1")).onboardingComplete,true);
assert.equal(JSON.parse(migrated.items.get("prismLocalProfileV1")).displayName,"");
assert.equal(migrated.eval("prismDatePlusDays('2026-09-24',56)"),"2026-11-19");
assert.equal(migrated.eval("prismCalorieEstimate({age:17,sex:'male',feet:5,inches:10,weight:180,activity:1.55,goal:'cut',pace:'moderate'})"),null);
console.log("Onboarding migration, resume, goal dates, calories, and saved data: OK");
