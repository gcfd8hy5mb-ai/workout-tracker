const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{const filename=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';const target=path.resolve(root,filename);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(target,(error,content)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'}).end(content);});});

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/persistence/account-ui.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* guest lifecycle fixture */'}));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof goHome==='function'&&typeof resumePrismWorkout==='function'&&typeof finishWorkout==='function');

  await page.evaluate(()=>{
    workoutGoals={goal:'muscle',days:4,focus:'balanced',gender:'prefer'};
    localStorage.setItem('workoutGoalsV1',JSON.stringify(workoutGoals));
    renderHome();goHome();
  });
  await page.locator('#home:not(.hidden)').waitFor();

  const start=page.locator('#home .myliftcoach-home-workout-action');await start.waitFor();
  assert.equal((await start.innerText()).trim(),'Start Workout','canonical Home must expose Start Workout for a scheduled session');
  await start.click();await page.locator('#workoutScreen:not(.hidden)').waitFor();
  let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('prismActiveWorkoutV1')||'null'));
  assert.ok(state?.key&&state.ids.length>0&&state.startedAt>0,'Home Start Workout must create an active checkpoint');
  const key=state.key,firstId=state.ids[0],startedAt=state.startedAt;

  await page.getByRole('button',{name:'Tired',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Tired',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'1 min',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#workoutRestPresets button[aria-pressed="true"]')?.textContent.trim()==='1 min');
  assert.equal(await page.getByRole('button',{name:'1 min',exact:true}).getAttribute('aria-pressed'),'true');
  const tracking=await page.evaluate(()=>JSON.parse(localStorage.getItem('dailyTrackingV1')||'{}'));
  assert.equal(tracking.restSeconds,60,'rest preset must persist');
  assert.equal(tracking.readiness[`${new Date().toISOString().slice(0,10)}-${key}`],'Tired','readiness must persist');

  assert.equal(await page.locator('#exerciseList > .exercise').count()>0,true,'active workout must render exercise cards');
  await page.locator('#exerciseList > .exercise').first().locator('.liftova-log-check').first().waitFor();
  assert.equal(await page.locator('#exerciseList > .exercise').first().locator('.liftova-log-check').count(),4,'focused exercise must expose four visible one-tap set controls');
  const geometry=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert.ok(geometry.scrollWidth<=geometry.innerWidth+2,`active workout must not overflow horizontally: ${JSON.stringify(geometry)}`);

  await page.evaluate(({key,firstId})=>{const setKey=`${key}-${firstId}-set1`;setHistory[setKey]={weight:135,reps:8,done:false};localStorage.setItem('setHistoryV5',JSON.stringify(setHistory));renderActiveWorkoutExercises();focusWorkoutExercise(0);},{key,firstId});
  const logSet=page.locator('#exerciseList > .exercise').first().locator('.liftova-log-check').first();await logSet.waitFor();await logSet.click();
  const underlying=page.locator('#exerciseList > .exercise').first().locator('.set-done').first();
  assert.equal(await underlying.getAttribute('aria-pressed'),'true','visible Log Set control must mark the underlying set done');
  assert.equal((await logSet.innerText()).trim(),'✓','visible Log Set control must reflect completion');
  assert.match(await page.locator('#workoutRestStatus').innerText(),/Rest timer running/i,'completing a set must start rest');
  assert.ok(Number(await page.evaluate(()=>localStorage.getItem('prismRestEndsAtV1')||0))>Date.now(),'rest end time must persist');
  await page.getByRole('button',{name:'Skip',exact:true}).click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('prismRestEndsAtV1')),null,'Skip must clear persisted rest timer');

  if(state.ids.length>1)await page.evaluate(()=>focusWorkoutExercise(1));
  state=await page.evaluate(()=>JSON.parse(localStorage.getItem('prismActiveWorkoutV1')));const savedIndex=state.index;
  await page.evaluate(()=>goHome());await page.locator('#home:not(.hidden)').waitFor();
  const resume=page.locator('#home .myliftcoach-home-workout-action');await resume.waitFor();
  await page.waitForFunction(()=>document.querySelector('#home .myliftcoach-home-workout-action')?.textContent.trim()==='Resume Workout');
  await resume.click();await page.locator('#workoutScreen:not(.hidden)').waitFor();
  let restored=await page.evaluate(({key,firstId})=>({active:JSON.parse(localStorage.getItem('prismActiveWorkoutV1')),set:JSON.parse(localStorage.getItem('setHistoryV5'))[`${key}-${firstId}-set1`]}),{key,firstId});
  assert.equal(restored.active.startedAt,startedAt,'resume must preserve original workout start time');
  assert.equal(restored.active.index,savedIndex,'resume must preserve focused exercise');
  assert.deepEqual(restored.set,{weight:135,reps:8,done:true},'resume must preserve completed set');

  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof resumePrismWorkout==='function');
  state=await page.evaluate(()=>JSON.parse(localStorage.getItem('prismActiveWorkoutV1')||'null'));assert.equal(state.startedAt,startedAt);assert.equal(state.index,savedIndex);
  await page.evaluate(()=>resumePrismWorkout());await page.locator('#workoutScreen:not(.hidden)').waitFor();

  await page.evaluate(()=>finishWorkout());await page.locator('#completionScreen:not(.hidden)').waitFor();
  let finalState=await page.evaluate(()=>({active:localStorage.getItem('prismActiveWorkoutV1'),history:JSON.parse(localStorage.getItem('workoutHistoryV52')||'[]'),sets:JSON.parse(localStorage.getItem('setHistoryV5')||'{}')}));
  assert.equal(finalState.active,null,'finished workout must clear active checkpoint');assert.equal(finalState.history.length,1,'finish must create exactly one history record');assert.equal(finalState.history[0].workoutKey,key);assert.equal(finalState.sets[`${key}-${firstId}-set1`],undefined,'active set state must clear after commit');
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof goHome==='function');
  finalState=await page.evaluate(()=>({active:localStorage.getItem('prismActiveWorkoutV1'),history:JSON.parse(localStorage.getItem('workoutHistoryV52')||'[]')}));assert.equal(finalState.active,null);assert.equal(finalState.history.length,1);assert.deepEqual(errors,[],'active-workout QA must not produce page errors');
  await context.close();console.log('MYLIFTCOACH active workout: calendar Home start, readiness, rest, visible Log Set, resume, relaunch and finish PASS');
 }finally{await browser.close();server.close();}
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
