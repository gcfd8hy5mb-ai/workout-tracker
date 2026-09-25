/* Weekly PRISM Summary intelligence.
   Reads existing workoutHistory only. No source workout data is modified. */

function prismWeeklyDateAdd(day,days){
  const date=new Date(`${day}T12:00:00`);
  date.setDate(date.getDate()+days);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function prismWeeklyWorkingSets(sessions){
  return (sessions||[]).flatMap(session=>(session.exercises||[]).flatMap(exercise=>(exercise.sets||[]).map(set=>({session,exercise,set}))))
    .filter(item=>Number(item.set.weight)>0&&Number(item.set.reps)>0);
}

function prismWeeklyEstimatedStrength(set){
  const weight=Number(set?.weight),reps=Number(set?.reps);
  if(!Number.isFinite(weight)||!Number.isFinite(reps)||weight<=0||reps<=0)return 0;
  return weight*(1+reps/30);
}

function prismWeeklyExerciseBest(sessions){
  const out=new Map();
  for(const session of sessions||[])for(const entry of session.exercises||[]){
    const id=entry.id||entry.name;
    if(!id)continue;
    const valid=(entry.sets||[]).filter(set=>Number(set.weight)>0&&Number(set.reps)>0);
    if(!valid.length)continue;
    const best=valid.reduce((winner,set)=>prismWeeklyEstimatedStrength(set)>prismWeeklyEstimatedStrength(winner)?set:winner,valid[0]);
    const score=prismWeeklyEstimatedStrength(best);
    const name=getExercise(entry.id)?.name||entry.name||"Exercise";
    const existing=out.get(id);
    if(!existing||score>existing.score)out.set(id,{id,name,score,weight:Number(best.weight),reps:Number(best.reps)});
  }
  return out;
}

function prismWeeklyMuscleSets(sessions){
  const groups=new Map();
  for(const session of sessions||[])for(const entry of session.exercises||[]){
    const count=(entry.sets||[]).filter(set=>Number(set.weight)>0&&Number(set.reps)>0).length;
    if(!count)continue;
    const muscle=getExercise(entry.id)?.muscle||"Other";
    groups.set(muscle,(groups.get(muscle)||0)+count);
  }
  return [...groups.entries()].map(([muscle,sets])=>({muscle,sets})).sort((a,b)=>b.sets-a.sets||a.muscle.localeCompare(b.muscle));
}

function prismWeeklyPrCount(currentSessions,currentStart){
  const currentBest=prismWeeklyExerciseBest(currentSessions);
  const before=(workoutHistory||[]).filter(session=>sessionDay(session)<currentStart);
  const historicalBest=prismWeeklyExerciseBest(before);
  let count=0;
  for(const [id,current] of currentBest){
    const prior=historicalBest.get(id);
    if(prior&&current.score>prior.score*1.002)count++;
  }
  return count;
}

function prismWeeklyBuildData(){
  const currentStart=weekStart(new Date());
  const currentEnd=prismWeeklyDateAdd(currentStart,6);
  const previousStart=prismWeeklyDateAdd(currentStart,-7);
  const previousEnd=prismWeeklyDateAdd(currentStart,-1);
  const all=workoutHistory||[];
  const currentSessions=all.filter(session=>{const day=sessionDay(session);return day>=currentStart&&day<=currentEnd});
  const previousSessions=all.filter(session=>{const day=sessionDay(session);return day>=previousStart&&day<=previousEnd});
  const currentSets=prismWeeklyWorkingSets(currentSessions);
  const previousSets=prismWeeklyWorkingSets(previousSessions);
  const currentVolume=Math.round(currentSets.reduce((sum,item)=>sum+Number(item.set.weight)*Number(item.set.reps),0));
  const previousVolume=Math.round(previousSets.reduce((sum,item)=>sum+Number(item.set.weight)*Number(item.set.reps),0));
  const currentBest=prismWeeklyExerciseBest(currentSessions);
  const previousBest=prismWeeklyExerciseBest(previousSessions);
  const improved=[],declined=[];
  for(const [id,current] of currentBest){
    const prior=previousBest.get(id);
    if(!prior)continue;
    const change=prior.score?((current.score-prior.score)/prior.score)*100:0;
    const result={...current,change,previousWeight:prior.weight,previousReps:prior.reps};
    if(change>=1)improved.push(result);
    else if(change<=-1)declined.push(result);
  }
  improved.sort((a,b)=>b.change-a.change);
  declined.sort((a,b)=>a.change-b.change);
  const muscles=prismWeeklyMuscleSets(currentSessions);
  return {
    currentStart,currentEnd,previousStart,previousEnd,
    currentSessions,previousSessions,currentSets,previousSets,
    currentVolume,previousVolume,
    prCount:prismWeeklyPrCount(currentSessions,currentStart),
    improved,declined,muscles,
    mostTrained:muscles[0]||null,
    leastTrained:muscles.length>1?muscles[muscles.length-1]:null,
    hasPreviousWeek:previousSessions.length>0
  };
}

function prismWeeklyDelta(current,previous,suffix=""){
  const delta=current-previous;
  if(delta===0)return `Same as last week${suffix}`;
  return `${delta>0?"+":""}${delta.toLocaleString()}${suffix} vs last week`;
}

function prismWeeklyExerciseChange(item){
  const weightDelta=item.weight-item.previousWeight;
  const repDelta=item.reps-item.previousReps;
  if(weightDelta!==0)return `${weightDelta>0?"+":""}${weightDelta} lb`;
  if(repDelta!==0)return `${repDelta>0?"+":""}${repDelta} rep${Math.abs(repDelta)===1?"":"s"}`;
  return `${item.change>0?"+":""}${item.change.toFixed(1)}% estimated strength`;
}

function prismWeeklyNextFocus(data){
  if(!data.currentSessions.length)return "Complete your first workout this week and PRISM will start building your recap.";
  if(!data.hasPreviousWeek)return "PRISM is learning your baseline. Keep logging full workouts so next week can include real comparisons.";
  if(data.declined.length){
    const exercise=data.declined[0];
    return `${exercise.name} was below last week's best performance. Keep the next session controlled and aim to rebuild before increasing load.`;
  }
  if(data.leastTrained&&data.mostTrained&&data.mostTrained.sets-data.leastTrained.sets>=4){
    return `${data.leastTrained.muscle} received ${data.leastTrained.sets} working sets versus ${data.mostTrained.sets} for ${data.mostTrained.muscle}. Consider balancing volume if that matches your plan.`;
  }
  if(data.improved.length){
    return `${data.improved[0].name} improved this week. Keep progressing gradually while maintaining clean reps.`;
  }
  if(data.currentVolume<data.previousVolume*.8){
    return "Training volume is below last week so far. That may be intentional; if not, check whether a planned session is still missing.";
  }
  return "Your week looks steady so far. Keep logging complete working sets so PRISM can make the next recap more specific.";
}

function prismWeeklyExerciseList(items,emptyText){
  if(!items.length)return `<p class="small">${escapeHTML(emptyText)}</p>`;
  return `<div class="weekly-insight-list">${items.slice(0,4).map(item=>`<div class="journey-summary"><span>${escapeHTML(item.name)}</span><strong>${escapeHTML(prismWeeklyExerciseChange(item))}</strong></div>`).join("")}</div>`;
}

function prismWeeklyMuscleList(items){
  if(!items.length)return `<p class="small">Log working sets to build your training-balance view.</p>`;
  return `<div class="weekly-insight-list">${items.slice(0,6).map(item=>`<div class="journey-summary"><span>${escapeHTML(item.muscle)}</span><strong>${item.sets} sets</strong></div>`).join("")}</div>`;
}

function prismWeeklyComparison(data){
  if(!data.hasPreviousWeek)return `<div class="journey-card"><strong>PRISM is learning your baseline</strong><p class="small">Complete another week of training to unlock week-over-week workout, set, volume and exercise comparisons.</p></div>`;
  return `<p class="small">Workouts: ${escapeHTML(prismWeeklyDelta(data.currentSessions.length,data.previousSessions.length))}<br>Working sets: ${escapeHTML(prismWeeklyDelta(data.currentSets.length,data.previousSets.length))}<br>Volume: ${escapeHTML(prismWeeklyDelta(data.currentVolume,data.previousVolume," lb"))}</p>`;
}

function prismWeeklyRenderFull(area,id){
  const data=prismWeeklyBuildData();
  const target=workoutGoals&&!workoutGoals.skipped?Number(workoutGoals.days)||4:null;
  const startDate=new Date(`${data.currentStart}T12:00:00`),endDate=new Date(`${data.currentEnd}T12:00:00`);
  const range=`${startDate.toLocaleDateString([],{month:"short",day:"numeric"})}–${endDate.toLocaleDateString([],{month:"short",day:"numeric"})}`;

  if(!canAccessFeature("weekly_prism_summary")){
    area.innerHTML=`<div class="card weekly-dashboard"><span class="journey-eyebrow">PRISM PRO ✦</span><h3>Weekly PRISM Summary</h3><p>Free tracks what you did. Pro turns that history into a weekly coaching recap: what improved, what slipped, your training balance, PRs and what to focus on next.</p><button type="button" onclick="showProPreview('weekly_prism_summary')">Preview Weekly Summary</button></div>`;
    return;
  }

  if(!data.currentSessions.length&&!data.previousSessions.length){
    area.innerHTML=`<div class="card weekly-dashboard"><span class="journey-eyebrow">YOUR PRISM WEEK</span><h3>PRISM is learning from your workouts</h3><p class="small">Complete workouts and log your working sets to unlock weekly volume, PRs, exercise changes and training-balance insights.</p></div>`;
    return;
  }

  if(id==="weeklySummaryHome"){
    area.innerHTML=`<div class="card weekly-dashboard"><span class="journey-eyebrow">YOUR PRISM WEEK</span><h3>Weekly Progress</h3><p class="small">${range}${target?` · ${Math.min(data.currentSessions.length,target)} of ${target} planned workouts`:""}</p><div class="stat-grid"><div class="stat-card"><div class="stat-number">${data.currentSessions.length}</div><div class="stat-label">Workouts</div></div><div class="stat-card"><div class="stat-number">${data.currentSets.length}</div><div class="stat-label">Working sets</div></div><div class="stat-card"><div class="stat-number">${data.currentVolume.toLocaleString()}</div><div class="stat-label">lb volume</div></div><div class="stat-card"><div class="stat-number">${data.prCount}</div><div class="stat-label">PRs</div></div></div><p class="small">${escapeHTML(prismWeeklyNextFocus(data))}</p><button class="dashboard-link" onclick="showOverallProgress()">See full weekly summary →</button></div>`;
    return;
  }

  const balanceHeadline=data.mostTrained?`<p class="small">Most trained: <strong>${escapeHTML(data.mostTrained.muscle)}</strong> · ${data.mostTrained.sets} sets${data.leastTrained?`<br>Least trained: <strong>${escapeHTML(data.leastTrained.muscle)}</strong> · ${data.leastTrained.sets} sets`:""}</p>`:"";
  area.innerHTML=`<div class="card weekly-dashboard"><span class="journey-eyebrow">YOUR PRISM WEEK</span><h3>Weekly PRISM Summary</h3><p class="small">${range}${target?` · ${Math.min(data.currentSessions.length,target)} of ${target} planned workouts`:""}</p><div class="stat-grid"><div class="stat-card"><div class="stat-number">${data.currentSessions.length}</div><div class="stat-label">Workouts</div></div><div class="stat-card"><div class="stat-number">${data.currentSets.length}</div><div class="stat-label">Working sets</div></div><div class="stat-card"><div class="stat-number">${data.currentVolume.toLocaleString()}</div><div class="stat-label">lb volume</div></div><div class="stat-card"><div class="stat-number">${data.prCount}</div><div class="stat-label">PRs</div></div></div><h4>Compared with last week</h4>${prismWeeklyComparison(data)}<h4>Improved</h4>${prismWeeklyExerciseList(data.improved,data.hasPreviousWeek?"No meaningful exercise improvement detected versus last week.":"Repeat exercises across another week to unlock this section.")}<h4>Declined</h4>${prismWeeklyExerciseList(data.declined,data.hasPreviousWeek?"No meaningful exercise decline detected versus last week.":"Repeat exercises across another week to unlock this section.")}<h4>Training Balance</h4>${balanceHeadline}${prismWeeklyMuscleList(data.muscles)}<h4>Next Focus</h4><p>${escapeHTML(prismWeeklyNextFocus(data))}</p></div>`;
}

/* Loaded after the core app, so this replaces the earlier basic renderer without
   changing workout history or the centralized entitlement rules. */
if(typeof renderWeeklySummary==="function"){
  renderWeeklySummary=function(id){
    const area=document.getElementById(id);
    if(area)prismWeeklyRenderFull(area,id);
  };
}

/* Keep the PRISM Pro preview grounded in the same real weekly calculation. */
if(typeof prismProWeeklyExample==="function"){
  prismProWeeklyExample=function(){
    const data=prismWeeklyBuildData();
    if(!data.currentSessions.length)return `<small>YOUR CURRENT WEEK · SAVED DATA</small>No completed workouts yet. PRISM will build your recap as you train.`;
    const insight=data.improved[0]?`<br><strong>${escapeHTML(data.improved[0].name)}</strong> ${escapeHTML(prismWeeklyExerciseChange(data.improved[0]))}`:`<br>${escapeHTML(prismWeeklyNextFocus(data))}`;
    return `<small>YOUR CURRENT WEEK · SAVED DATA</small>${data.currentSessions.length} workouts · ${data.currentSets.length} working sets · ${data.currentVolume.toLocaleString()} lb volume · ${data.prCount} PRs${insight}`;
  };
}

/* Re-render the Home card because onboarding can render Home before this file loads. */
if(document.getElementById("weeklySummaryHome"))renderWeeklySummary("weeklySummaryHome");
