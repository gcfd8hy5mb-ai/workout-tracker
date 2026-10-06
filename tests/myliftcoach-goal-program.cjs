const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{const file=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html',target=path.resolve(root,file);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(target,(error,content)=>error?res.writeHead(404).end():res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'}).end(content))});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.clock.install({time:new Date('2026-10-05T12:00:00Z')}); // Monday is a workout day on both schedules.
  await page.addInitScript(()=>localStorage.setItem('prismJourneyV1',JSON.stringify({status:'complete',mode:'local',step:6,draft:{}})));
  await page.route('**/persistence/account-ui.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* guest profile fixture */'}));
  const url=`http://127.0.0.1:${server.address().port}/`;
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof savePrismTraining==='function'&&typeof window.myliftcoachWeeklySchedule==='function');
  await page.evaluate(()=>{workoutGoals={goal:'muscle',days:4,focus:'balanced',gender:'prefer'};localStorage.setItem('workoutGoalsV1',JSON.stringify(workoutGoals));workoutHistory=[{id:71,date:'2026-09-01T12:00:00Z',workoutKey:'legacy-session',workoutTitle:'Past Workout',exercises:[{id:'machine-chest-press',name:'Chest Press',sets:[{set:1,weight:100,reps:10}]}]}];localStorage.setItem('workoutHistoryV52',JSON.stringify(workoutHistory));goHome()});
  const snapshot=()=>page.evaluate(()=>({plan:JSON.parse(localStorage.getItem('workoutGoalsV1')).activeProgram,card:document.querySelector('#home .liftova-home-shell .lh-workout')?.innerText||'',schedule:window.myliftcoachWeeklySchedule().filter(Boolean).map(w=>w.ids),history:JSON.parse(localStorage.getItem('workoutHistoryV52')||'[]')}));
  const verify=async(goal,days,focus,sets,reps,label)=>{
    await page.evaluate(()=>showProfile());
    await page.locator('#prismEditTraining').selectOption(goal);
    await page.locator('#prismEditDays').selectOption(String(days));
    await page.locator('#prismEditFocus').selectOption(focus);
    await page.locator('#prismLocalProfile button[type=submit]').filter({hasText:'Save training preferences'}).click();
    await page.evaluate(()=>goHome());
    await page.waitForFunction(expected=>document.querySelector('#home .lh-workout .lh-meta')?.textContent.includes(expected),label);
    let state=await snapshot();assert.equal(state.plan.sourceGoal,goal);assert.equal(state.plan.sourceDays,days);assert.equal(state.plan.sourceFocus,focus);assert.equal(state.plan.prescription.sets,sets);assert.equal(state.plan.prescription.reps,reps);assert.match(state.card,new RegExp(label));assert.deepEqual(state.schedule[0],state.plan.days[0].exercises);assert.equal(state.history[0].id,71);
    await page.evaluate(()=>openSuggestedWorkout(0));
    assert.equal(await page.locator('#exerciseList > .exercise').first().locator('.set-done').count(),sets,'live set entry must match goal prescription');
    assert.match(await page.locator('#exerciseList > .exercise').first().innerText(),new RegExp(reps));
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof window.myliftcoachWeeklySchedule==='function');
    await page.waitForFunction(expected=>document.querySelector('#home .lh-workout .lh-meta')?.textContent.includes(expected),label);
    state=await snapshot();assert.equal(state.plan.sourceGoal,goal);assert.equal(state.plan.days.length,days);assert.equal(state.history[0].id,71);
    return state;
  };
  const muscle=await verify('muscle',4,'balanced',4,'8–10','Hypertrophy');
  const fitness=await verify('consistency',4,'balanced',2,'10–15','General Fitness');assert.ok(fitness.plan.days[0].exercises.length<muscle.plan.days[0].exercises.length);
  await verify('strength',4,'balanced',4,'3–5','Strength'); // Beginner strength starts at four sets.
  await verify('muscle',4,'balanced',4,'8–10','Hypertrophy');
  const three=await verify('muscle',3,'balanced',4,'8–10','Hypertrophy');assert.equal(three.schedule.length,3);
  const lower=await verify('muscle',3,'lower',4,'8–10','Hypertrophy');assert.notDeepEqual(lower.plan.days,three.plan.days);
  await page.evaluate(()=>{customWorkouts=[{id:1,name:'My Custom Day',exercises:['biceps-curl']}];localStorage.setItem('customWorkoutsV5',JSON.stringify(customWorkouts));goHome()});
  await page.waitForFunction(()=>document.querySelector('#home .lh-workout')?.textContent.includes('MY CUSTOM DAY'));
  assert.equal((await snapshot()).plan.sourceFocus,'lower','custom priority must not erase generated plan');
  assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem('customWorkoutsV5')))[0].name,'My Custom Day');
  assert.deepEqual(errors,[],'goal transitions and reload must not throw');
  console.log('PASS browser Profile saves → Home plan/focus → live sets/reps → reload for three goals, 4 → 3 days, focus change, custom/history preserved');
  await context.close();
 }finally{await browser.close();server.close()}
})().catch(error=>{server.close();console.error(error);process.exitCode=1});
