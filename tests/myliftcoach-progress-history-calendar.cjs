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
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/persistence/account-ui.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* guest progress fixture */'}));
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof showOverallProgress==='function'&&typeof showGlobalHistory==='function'&&typeof showWorkoutCalendar==='function'&&typeof showPersonalRecords==='function'&&typeof goHome==='function');
  await page.evaluate(()=>{workoutGoals={goal:'muscle',days:4,focus:'balanced',gender:'prefer'};localStorage.setItem('workoutGoalsV1',JSON.stringify(workoutGoals));renderHome();goHome();});
  await page.locator('#home:not(.hidden)').waitFor();
  const seeded=await page.evaluate(()=>{
    const ex=exerciseLibrary.find(item=>item?.id&&item?.name)||exerciseLibrary[0];
    const day=localDay();
    const session={date:new Date().toISOString(),workoutKey:'qa-progress-workout',workoutTitle:'QA Progress Workout',recordIds:[ex.id],exercises:[{id:ex.id,name:ex.name,sets:[{weight:100,reps:10},{weight:105,reps:8}]}]};
    workoutHistory=[session];
    localStorage.setItem('workoutHistoryV52',JSON.stringify(workoutHistory));
    updateProgress();
    return {day,exerciseName:ex.name};
  });

  await page.evaluate(()=>showGlobalHistory());await page.locator('#globalHistoryScreen:not(.hidden)').waitFor();
  let historyText=await page.locator('#globalHistoryList').innerText();
  assert.match(historyText,/QA Progress Workout/i,'History must show the saved workout');
  const historyCard=page.locator('#globalHistoryList details').first();await historyCard.locator('summary').click();
  historyText=await page.locator('#globalHistoryList').innerText();
  assert.ok(historyText.includes(seeded.exerciseName),'Expanded History must show the saved exercise');

  await page.evaluate(()=>showOverallProgress());await page.locator('#overallProgressScreen:not(.hidden)').waitFor();
  const progressText=await page.locator('#overallProgressScreen').innerText();
  assert.match(progressText,/1\s*workout|workouts\s*1|1\/4/i,'Progress must include the completed workout');
  let geometry=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert.ok(geometry.scrollWidth<=geometry.innerWidth+2,`Progress must not overflow compact iPhone width: ${JSON.stringify(geometry)}`);

  await page.evaluate(day=>{calendarMonthDate=new Date(`${day}T12:00:00`);calendarMonthDate=new Date(calendarMonthDate.getFullYear(),calendarMonthDate.getMonth(),1);calendarSelectedDay=day;showWorkoutCalendar();},seeded.day);
  await page.locator('#calendarScreen:not(.hidden)').waitFor();
  const calendarText=await page.locator('#calendarDetail').innerText();
  assert.match(calendarText,/Workout completed/i,'Calendar selected day must mark the saved workout as completed');
  assert.ok(!/No activity logged/i.test(calendarText),'Calendar must not treat the completed-workout day as empty');
  geometry=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert.ok(geometry.scrollWidth<=geometry.innerWidth+2,`Calendar must not overflow compact iPhone width: ${JSON.stringify(geometry)}`);

  await page.evaluate(()=>showPersonalRecords());await page.locator('#recordsScreen:not(.hidden)').waitFor();
  const recordText=await page.locator('#personalRecords').innerText();
  assert.ok(recordText.includes(seeded.exerciseName),'Records must include the exercise from the saved workout');
  assert.match(recordText,/105|100|record|best/i,'Records must expose saved performance data');

  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof showGlobalHistory==='function');
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('workoutHistoryV52')||'[]'));
  assert.equal(persisted.length,1,'Saved workout must survive relaunch');
  assert.equal(persisted[0].workoutKey,'qa-progress-workout','Relaunch must preserve the same workout record');
  assert.deepEqual(errors,[],'Progress/history/calendar QA must not produce page errors');
  await context.close();console.log('MYLIFTCOACH Progress + History + Records + Calendar PASS');
 }finally{await browser.close();server.close();}
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
