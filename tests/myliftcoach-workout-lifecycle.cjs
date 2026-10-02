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
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
    const page=await context.newPage();page.setDefaultTimeout(12000);
    await page.route('**/persistence/account-ui.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* guest lifecycle fixture */'}));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof openPresetWorkout==='function'&&typeof resumePrismWorkout==='function'&&typeof finishWorkout==='function');

    // Start a canonical workout and create one completed set using the same persisted state path as the live UI.
    await page.evaluate(()=>openPresetWorkout('day1'));
    await page.locator('#workoutScreen:not(.hidden)').waitFor();
    let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('prismActiveWorkoutV1')||'null'));
    assert.equal(state.key,'preset-day1');assert.equal(state.ids.length,3);assert.ok(state.startedAt>0);
    const startedAt=state.startedAt;
    const firstId=state.ids[0];
    await page.evaluate(firstId=>{
      const key=`preset-day1-${firstId}-set1`;
      setHistory[key]={weight:135,reps:8,done:true};
      localStorage.setItem('setHistoryV5',JSON.stringify(setHistory));
      focusWorkoutExercise(1);
    },firstId);
    assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('prismActiveWorkoutV1')).index)),1,'focused exercise checkpoint must persist');

    // Leave the workout, then use the canonical resume action without losing set state or start time.
    await page.evaluate(()=>goHome());await page.locator('#home:not(.hidden)').waitFor();
    await page.evaluate(()=>resumePrismWorkout());await page.locator('#workoutScreen:not(.hidden)').waitFor();
    let restored=await page.evaluate(firstId=>({active:JSON.parse(localStorage.getItem('prismActiveWorkoutV1')),set:JSON.parse(localStorage.getItem('setHistoryV5'))[`preset-day1-${firstId}-set1`]}),firstId);
    assert.equal(restored.active.startedAt,startedAt,'resume must preserve original workout start time');
    assert.equal(restored.active.index,1,'resume must preserve focused exercise');
    assert.deepEqual(restored.set,{weight:135,reps:8,done:true},'resume must preserve logged set');

    // Hard relaunch must preserve the active checkpoint and allow another resume.
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof resumePrismWorkout==='function');
    state=await page.evaluate(()=>JSON.parse(localStorage.getItem('prismActiveWorkoutV1')||'null'));
    assert.equal(state.startedAt,startedAt);assert.equal(state.index,1);
    await page.evaluate(()=>resumePrismWorkout());await page.locator('#workoutScreen:not(.hidden)').waitFor();

    // Finish once. Completion must clear only the active checkpoint, retain history, and not resurrect after reload.
    await page.evaluate(()=>finishWorkout());
    await page.locator('#completionScreen:not(.hidden)').waitFor();
    let finalState=await page.evaluate(()=>({active:localStorage.getItem('prismActiveWorkoutV1'),history:JSON.parse(localStorage.getItem('workoutHistoryV52')||'[]'),sets:JSON.parse(localStorage.getItem('setHistoryV5')||'{}')}));
    assert.equal(finalState.active,null,'finished workout must clear active checkpoint');
    assert.equal(finalState.history.length,1,'finish must create exactly one workout history record');
    assert.equal(finalState.history[0].workoutKey,'preset-day1');
    assert.equal(finalState.sets[`preset-day1-${firstId}-set1`],undefined,'transient active set state must be cleared after history is committed');

    await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof goHome==='function');
    finalState=await page.evaluate(()=>({active:localStorage.getItem('prismActiveWorkoutV1'),history:JSON.parse(localStorage.getItem('workoutHistoryV52')||'[]')}));
    assert.equal(finalState.active,null,'finished workout must not return as active after relaunch');
    assert.equal(finalState.history.length,1,'completed history must survive relaunch without duplication');
    await context.close();
    console.log('MYLIFTCOACH workout lifecycle: start, log, leave/resume, relaunch, finish and post-finish relaunch PASS');
  } finally {await browser.close();server.close();}
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
