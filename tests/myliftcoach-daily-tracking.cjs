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
  await page.route('**/persistence/account-ui.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* guest daily-tracking fixture */'}));
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof showWater==='function'&&typeof showFood==='function'&&typeof showWeight==='function'&&typeof showTrackingGoals==='function'&&typeof showMeasurements==='function'&&typeof showProgressPhotos==='function');
  const day=await page.evaluate(()=>localDay());

  // Water: real form save, screen revisit, delete.
  await page.evaluate(()=>showWater());await page.locator('#waterScreen:not(.hidden)').waitFor();
  await page.locator('#waterAmount').fill('500');await page.locator('#waterScreen form').first().evaluate(form=>form.requestSubmit());
  assert.match(await page.locator('#waterSummary').innerText(),/500 mL/i,'Water save must update the daily total');
  await page.evaluate(()=>goHome());await page.evaluate(()=>showWater());assert.match(await page.locator('#waterSummary').innerText(),/500 mL/i,'Water must survive navigation away and back');
  const waterDelete=page.locator('#waterList button').first();if(await waterDelete.count()){await waterDelete.click();assert.doesNotMatch(await page.locator('#waterSummary').innerText(),/500 mL of/i,'Water delete must update the total');await page.locator('#quickWaterButton').click();}

  // Food: custom entry save.
  await page.evaluate(()=>showFood());await page.locator('#foodScreen:not(.hidden)').waitFor();
  await page.locator('#foodChoice').selectOption('custom');await page.locator('#foodName').fill('QA Meal');await page.locator('#foodCalories').fill('420');await page.locator('#foodScreen form').first().evaluate(form=>form.requestSubmit());
  assert.match(await page.locator('#foodSummary').innerText(),/420/i,'Food save must update calories');assert.match(await page.locator('#foodList').innerText(),/QA Meal/i,'Food list must show saved meal');

  // Weight: save and revisit.
  await page.evaluate(()=>showWeight());await page.locator('#weightScreen:not(.hidden)').waitFor();
  await page.locator('#weightValue').fill('200.5');await page.locator('#weightDate').fill(day);await page.locator('#weightScreen form').first().evaluate(form=>form.requestSubmit());
  assert.match(await page.locator('#weightScreen').innerText(),/200\.5/i,'Weight screen must show saved weight');

  // Goals: water goal save must persist and reflect in Water.
  await page.evaluate(()=>showTrackingGoals());await page.locator('#goalsScreen:not(.hidden)').waitFor();
  await page.locator('#waterGoal').fill('3000');const goalForm=page.locator('#waterGoal').locator('xpath=ancestor::form');await goalForm.evaluate(form=>form.requestSubmit());
  await page.evaluate(()=>showWater());assert.match(await page.locator('#waterSummary').innerText(),/3000 mL/i,'Saved water goal must feed back into Water');

  // Measurements: real save and trend/list presence.
  await page.evaluate(()=>showMeasurements());await page.locator('#measurementsScreen:not(.hidden)').waitFor();
  await page.locator('#measurementArea').selectOption({label:'Waist'});await page.locator('#measurementValue').fill('34.5');await page.locator('#measurementDay').fill(day);await page.locator('#measurementsScreen form').evaluate(form=>form.requestSubmit());
  assert.match(await page.locator('#measurementList').innerText(),/34\.5/i,'Measurements must show saved entry');

  // Photos are Pro-gated for Free and must route to the Pro preview rather than exposing upload controls.
  await page.evaluate(()=>showProgressPhotos());
  assert.equal(await page.locator('#photosScreen:not(.hidden)').count(),0,'Free tier must not expose Progress Photos upload screen');
  assert.ok(await page.locator('text=/progress photos|pro/i').count()>0,'Free Photos action must show a Pro preview');

  // Persist all daily-tracking state through a full relaunch.
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('dailyTrackingV1')||'{}'));
  assert.ok(before.water.length>=1,'Water state must be stored');assert.ok(before.food.some(x=>x.name==='QA Meal'),'Food state must be stored');assert.ok(before.weight.some(x=>Number(x.value)===200.5),'Weight state must be stored');assert.ok(before.measurements.some(x=>x.area==='Waist'&&Number(x.value)===34.5),'Measurement state must be stored');assert.equal(before.waterGoal,3000,'Water goal must be stored');
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof showWater==='function');
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('dailyTrackingV1')||'{}'));assert.deepEqual(after,before,'Daily tracking must survive relaunch without mutation');
  const geometry=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert.ok(geometry.scrollWidth<=geometry.innerWidth+2,`Daily tracking must not overflow compact iPhone width: ${JSON.stringify(geometry)}`);
  assert.deepEqual(errors,[],'Daily tracking QA must not produce page errors');
  await context.close();console.log('MYLIFTCOACH Daily Tracking: Water + Food + Weight + Goals + Measurements + Photos gating PASS');
 }finally{await browser.close();server.close();}
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
