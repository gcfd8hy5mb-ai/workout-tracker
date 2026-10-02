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
  const context=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block',acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/persistence/account-ui.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* guest settings fixture; account lifecycle is covered by authenticated account tests */'}));
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof showProfile==='function'&&typeof showSettings==='function'&&typeof showHelp==='function'&&typeof showDataBackup==='function'&&typeof showGlobalTimer==='function');
  const waitInViewport=async id=>page.waitForFunction(targetId=>{const el=document.getElementById(targetId);if(!el)return false;const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;},id);

  // Profile: every remaining navigation row must be a real, tappable control.
  await page.evaluate(()=>showProfile());await page.locator('#profileScreen:not(.hidden)').waitFor();
  for(const label of ['Goals & calorie targets','Body weight','Water intake','Food tracking','Workout calendar','Personal records','Measurements','Manage workouts & data']){
    await page.evaluate(()=>showProfile());const button=page.getByRole('button',{name:new RegExp(label,'i')});assert.equal(await button.count(),1,`Profile row must exist: ${label}`);await button.click();
    assert.equal(await page.locator('#profileScreen:not(.hidden)').count(),0,`Profile row must navigate away: ${label}`);
  }
  await page.evaluate(()=>showProfile());assert.equal(await page.getByRole('button',{name:/Private progress photos/i}).count(),1,'Progress Photos row must remain present');

  // Settings: the destination must land on the actual settings card, not a dead Profile route.
  await page.evaluate(()=>showSettings());await page.locator('#profileScreen:not(.hidden)').waitFor();await waitInViewport('profileSettings');
  const settingsBox=await page.locator('#profileSettings').boundingBox();assert.ok(settingsBox&&settingsBox.y<844&&settingsBox.y+settingsBox.height>0,'Settings card must be brought into the iPhone viewport');
  const timerFromSettings=page.locator('#profileSettings').getByRole('button',{name:/Open timer/i});await timerFromSettings.click();await page.locator('#globalTimerScreen:not(.hidden)').waitFor();

  // Timer: preset, start, pause and reset through visible controls.
  const display=page.locator('#globalTimerContent [data-timer-display]').first();assert.match(await display.innerText(),/^01:30$/,'Timer should open at the saved/default 1:30 state');
  await page.locator('#globalTimerContent').getByRole('button',{name:'1:00',exact:true}).click();assert.equal(await display.innerText(),'01:00','1:00 preset must apply');
  const start=page.locator('#globalTimerContent [data-timer-start]').first();await start.click();await page.waitForTimeout(1150);assert.notEqual(await display.innerText(),'01:00','Running timer must count down');await start.click();
  const paused=await display.innerText();await page.waitForTimeout(1100);assert.equal(await display.innerText(),paused,'Paused timer must stop counting');
  await page.locator('#globalTimerContent').getByRole('button',{name:/Reset/i}).click();assert.equal(await display.innerText(),'01:00','Reset must restore selected preset');

  // Help: support content and Data & Backup handoff must both work.
  await page.evaluate(()=>showHelp());await page.locator('#helpScreen:not(.hidden)').waitFor();assert.match(await page.locator('#helpScreen').innerText(),/Help & Support/i);
  const support=page.locator('#helpScreen a[href*="github.com"]').first();assert.ok((await support.getAttribute('href')||'').includes('/issues'),'Support link must point to the project issue tracker');
  await page.getByRole('button',{name:/Open Data & Backup/i}).click();await page.locator('#manageWorkoutScreen:not(.hidden)').waitFor();await waitInViewport('dataBackupSection');
  const backupBox=await page.locator('#dataBackupSection').boundingBox();assert.ok(backupBox&&backupBox.y<844&&backupBox.y+backupBox.height>0,'Data & Backup card must be brought into the iPhone viewport');

  // Backup: export must produce an actual JSON download.
  const downloadPromise=page.waitForEvent('download');await page.locator('#dataBackupSection').getByRole('button',{name:/Download backup/i}).click();const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/\.json$/i,'Backup export must download a JSON file');
  assert.equal(await page.locator('#backupFile').getAttribute('accept'),'application/json,.json','Restore control must accept JSON backups');

  // Destructive resets must still require confirmation; cancelling may not mutate history.
  await page.evaluate(()=>{workoutHistory=[{id:123,date:new Date().toISOString(),workoutKey:'qa-settings',workoutTitle:'QA Settings Workout',exercises:[]}];localStorage.setItem('workoutHistoryV52',JSON.stringify(workoutHistory));});
  page.once('dialog',dialog=>dialog.dismiss());await page.evaluate(()=>resetWorkoutData('history'));await page.waitForTimeout(100);
  const retained=await page.evaluate(()=>JSON.parse(localStorage.getItem('workoutHistoryV52')||'[]').length);assert.equal(retained,1,'Cancelling destructive reset must preserve workout history');

  // Compact iPhone safety across the remaining surfaces.
  for(const fn of ['showProfile','showSettings','showHelp','showDataBackup','showGlobalTimer']){
    await page.evaluate(name=>window[name](),fn);await page.waitForTimeout(100);const geometry=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert.ok(geometry.scrollWidth<=geometry.innerWidth+2,`${fn} must not overflow compact iPhone width: ${JSON.stringify(geometry)}`);
  }
  assert.deepEqual(errors,[],'Profile/Settings/Help/Backup/Timer QA must not produce page errors');
  await context.close();console.log('MYLIFTCOACH Profile + Settings + Data Backup + Help + Timer PASS');
 }finally{await browser.close();server.close();}
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
