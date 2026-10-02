const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{const filename=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';const target=path.resolve(root,filename);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(target,(error,content)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'}).end(content);});});
function swipeRight(page){return page.evaluate(()=>{const make=(type,x)=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,type==='touchstart'?'touches':'changedTouches',{value:[{clientX:x,clientY:240}]});document.dispatchEvent(e)};make('touchstart',12);make('touchend',125);});}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/persistence/account-ui.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* guest substitution fixture */'}));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof goHome==='function'&&typeof focusWorkoutExercise==='function'&&typeof finishWorkout==='function');
  await page.evaluate(()=>{workoutGoals={goal:'muscle',days:4,focus:'balanced',gender:'prefer'};localStorage.setItem('workoutGoalsV1',JSON.stringify(workoutGoals));renderHome();goHome();});
  await page.locator('#home:not(.hidden)').waitFor();
  await page.locator('#home .myliftcoach-home-workout-action').click();
  await page.locator('#workoutScreen:not(.hidden)').waitFor();
  await page.evaluate(()=>focusWorkoutExercise(0));
  const card=page.locator('#exerciseList > .exercise').first();
  await card.locator('.swap-toggle').waitFor();
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('prismActiveWorkoutV1')));
  const oldId=before.ids[0];

  // Manual substitution must be usable in Free and persist into the active workout checkpoint.
  await card.locator('.swap-toggle').click();
  const options=card.locator('.exercise-swap-list:not(.hidden)');await options.waitFor();
  const option=options.locator('button').first();await option.waitFor();const replacementName=(await option.innerText()).trim();assert.ok(replacementName,'replacement option must have a visible name');
  await option.click();
  const after=await page.evaluate(()=>({active:JSON.parse(localStorage.getItem('prismActiveWorkoutV1')),tracking:JSON.parse(localStorage.getItem('dailyTrackingV1')||'{}')}));
  assert.notEqual(after.active.ids[0],oldId,'unused exercise should be replaced in place');
  assert.deepEqual(after.tracking.substitutions[after.active.key],after.active.ids,'substitution order must persist');
  const replacementId=after.active.ids[0];

  // Exercise info is a drill-down screen and the native left-edge swipe must return to the active workout.
  await page.evaluate(()=>focusWorkoutExercise(0));
  const activeCard=page.locator('#exerciseList > .exercise').first();await activeCard.locator('.prism-info-toggle').click();
  await page.locator('#exerciseInfoScreen:not(.hidden)').waitFor();
  assert.equal(await page.evaluate(()=>window.MYLIFTCOACHNavigation?.canGoBack()),true,'exercise info must participate in native back stack');
  await swipeRight(page);await page.locator('#workoutScreen:not(.hidden)').waitFor();
  assert.equal(await page.evaluate(()=>window.MYLIFTCOACHNavigation?.getCurrent()),'workoutScreen','edge swipe must return to workout');

  // Log one replacement set through the visible compact control so the completion summary has real data.
  await page.evaluate(({replacementId})=>{const active=JSON.parse(localStorage.getItem('prismActiveWorkoutV1'));const k=`${active.key}-${replacementId}-set1`;setHistory[k]={weight:100,reps:10,done:false};localStorage.setItem('setHistoryV5',JSON.stringify(setHistory));renderActiveWorkoutExercises();focusWorkoutExercise(0);},{replacementId});
  const log=page.locator('#exerciseList > .exercise').first().locator('.liftova-log-check').first();await log.waitFor();await log.click();
  assert.equal((await log.innerText()).trim(),'✓','replacement set must log through the visible control');
  if(await page.getByRole('button',{name:'Skip',exact:true}).count())await page.getByRole('button',{name:'Skip',exact:true}).click();

  // Finish through the real button. Both the saved completion screen and native summary sheet must appear.
  const finish=page.locator('#workoutScreen .finish-workout');await finish.scrollIntoViewIfNeeded();await finish.click();
  await page.locator('#completionScreen:not(.hidden)').waitFor();
  const sheet=page.locator('#prismPostWorkoutSummary');await sheet.waitFor();
  assert.match(await sheet.locator('#mlcSummaryTitle').innerText(),/Workout complete/i);
  assert.equal((await sheet.locator('.mlc-summary-stat').first().locator('strong').innerText()).trim(),'1','summary must report the logged set');
  assert.match(await page.locator('#completionContent').innerText(),/Workout complete|workout/i,'saved completion screen must contain a workout recap');
  const finished=await page.evaluate(()=>({active:localStorage.getItem('prismActiveWorkoutV1'),history:JSON.parse(localStorage.getItem('workoutHistoryV52')||'[]'),tracking:JSON.parse(localStorage.getItem('dailyTrackingV1')||'{}')}));
  assert.equal(finished.active,null,'finish must clear active checkpoint');assert.equal(finished.history.length,1,'finish must save one history record');assert.equal(finished.tracking.substitutions?.[finished.history[0].workoutKey],undefined,'finished workout must clear temporary substitution state');

  await sheet.locator('[data-summary-done]').click();await sheet.waitFor({state:'detached'});
  assert.equal(await page.locator('#completionScreen:not(.hidden)').count(),1,'closing native summary must leave saved completion screen visible');
  await page.locator('#completionScreen .summary-actions button').filter({hasText:'Done'}).click();await page.locator('#home:not(.hidden)').waitFor();
  assert.deepEqual(errors,[],'substitution/summary QA must not produce page errors');
  await context.close();console.log('MYLIFTCOACH substitution + navigation + post-workout summary PASS');
 }finally{await browser.close();server.close();}
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
