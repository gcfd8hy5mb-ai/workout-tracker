const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\\//,'')||'index.html');
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':file.endsWith('.js')?'application/javascript':'text/html'}).end(data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await page.route('**/persistence/account-ui.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* isolated fixture */'}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.myliftcoachWeeklySchedule==='function');
  const result=await page.evaluate(()=>{
   const workoutsKey='customWorkoutsV5',overridesKey='myliftcoachWeeklyDayOverridesV1',historyKey='workoutHistoryV52';
   const previous={workouts:localStorage.getItem(workoutsKey),overrides:localStorage.getItem(overridesKey),history:localStorage.getItem(historyKey)};
   const id='qa-linked-workout';
   const workout={id,name:'Original QA Workout',exercises:['machine-chest-press','pec-deck']};
   const errors=[];
   try{
    localStorage.setItem(workoutsKey,JSON.stringify([workout]));
    localStorage.setItem(overridesKey,JSON.stringify({0:{name:workout.name,ids:[...workout.exercises],customWorkoutId:id}}));
    localStorage.setItem(historyKey,JSON.stringify([{workoutKey:'historical-qa',completedAt:'2026-01-01'}]));
    const initial=window.myliftcoachWeeklySchedule()[0];
    if(initial?.name!==workout.name||initial?.ids?.join(',')!==workout.exercises.join(','))errors.push('initial linked override mismatch');
    localStorage.setItem(workoutsKey,JSON.stringify([{...workout,name:'Renamed QA Workout',exercises:['lat-pulldown']}]));
    const edited=window.myliftcoachWeeklySchedule()[0];
    if(edited?.name!=='Renamed QA Workout'||edited?.ids?.join(',')!=='lat-pulldown')errors.push('linked override did not follow edit');
    localStorage.setItem(workoutsKey,'[]');
    const deleted=window.myliftcoachWeeklySchedule()[0];
    if(deleted!==null)errors.push('deleted linked workout still scheduled');
    if(JSON.parse(localStorage.getItem(historyKey)||'[]')[0]?.workoutKey!=='historical-qa')errors.push('history changed');
    return {errors,initial:initial?.name,edited:edited?.name,deleted:deleted?.name??null};
   }finally{
    for(const [key,value] of [[workoutsKey,previous.workouts],[overridesKey,previous.overrides],[historyKey,previous.history]]){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}
   }
  });
  assert.deepEqual(result.errors,[],JSON.stringify(result));
  console.log('PASS linked custom weekday edit/delete preserves history',result);
 }finally{await browser.close();server.close();}
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
