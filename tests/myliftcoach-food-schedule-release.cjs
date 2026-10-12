// Targeted release regression for Free food search, verified Pro planner, and custom scheduling.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';
 const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(data)});
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/persistence/account-ui.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* isolated UI fixture */'}));
  await page.route('https://world.openfoodfacts.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({products:[{code:'1234567890123',product_name:'QA Cereal',brands:'Test Brand',nutriments:{'energy-kcal_100g':400}}]})}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof showFood==='function'&&typeof showWorkoutsBrowserRoot==='function'&&typeof window.mlcRefreshMealPlanner==='function');
  await page.evaluate(()=>showFood());
  await page.locator('#foodScreen:not(.hidden)').waitFor();
  const planner=page.locator('#mlcMealPlanner');
  assert.equal(await planner.getByRole('button',{name:'Generate my week'}).count(),0,'Free users must not generate Pro plans');
  assert.equal(await page.locator('#onlineFoodLookup').count(),1,'Food search must be available to Free users');
  await page.locator('#onlineFoodQuery').fill('cereal');
  await page.getByRole('button',{name:'Search foods'}).click();
  await page.locator('#onlineFoodResults button').first().waitFor();
  await page.locator('#onlineFoodGrams').fill('150');
  await page.locator('#onlineFoodResults button').first().click();
  const freeFood=await page.evaluate(()=>tracking.food.find(x=>x.name.includes('QA Cereal')));
  assert.equal(freeFood?.calories,600,'150g of 400kcal/100g product must log 600 calories');
  assert.ok(await page.locator('#onlineFoodStatus').innerText().then(x=>x.includes('600 calories')),'Food lookup must confirm calorie log');

  // Simulate a trusted verified subscription, not a beta preview.
  await page.evaluate(()=>{prismEntitlement={tier:'beta',source:'beta_preview',betaView:'pro'};window.mlcRefreshMealPlanner()});
  assert.equal(await planner.getByRole('button',{name:'Generate my week'}).count(),0,'Pro preview cannot unlock automatic plans');
  await page.evaluate(()=>{prismEntitlement={tier:'pro',source:'manual_grant'};window.mlcRefreshMealPlanner()});
  await planner.getByRole('button',{name:'Generate my week'}).click();
  let planned=await page.evaluate(()=>JSON.parse(localStorage.getItem('myliftcoachMealPlannerV1:guest')));
  assert.equal(planned.days.length,7,'Paid planner must generate exactly 7 days');
  assert.ok(planned.days.every(d=>d.items.length===4),'Each day must contain four planned meals');
  assert.ok(await planner.getByText('Weekly ingredient list', {exact:false}).count()>0,'Grocery list must render');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof showFood==='function'&&typeof window.mlcRefreshMealPlanner==='function');
  await page.evaluate(()=>{prismEntitlement={tier:'pro',source:'manual_grant'};showFood()});
  planned=await page.evaluate(()=>JSON.parse(localStorage.getItem('myliftcoachMealPlannerV1:guest')));
  assert.equal(planned.days.length,7,'Meal plan must survive a reload');

  // Verify recurring workout priority, expiration, and one-off date overrides using real app state.
  const schedule=await page.evaluate(()=>{
   const sample=availableWorkoutPlans().find(p=>p.ids?.length);
   if(!sample)throw Error('Workout source unavailable');
   const item={name:'QA Scheduled Workout',exercises:sample.ids.slice(0,2)};
   customWorkouts.push(item);
   tracking.customSchedule={};
   tracking.customRecurringSchedule=[{start:'2026-10-12',end:'2026-11-08',name:item.name,exercises:item.exercises}];
   saveTracking();
   const sameDay=scheduledCustomWorkout('2026-10-12');
   const repeat=scheduledCustomWorkout('2026-10-19');
   const noMatch=scheduledCustomWorkout('2026-10-13');
   const expired=scheduledCustomWorkout('2026-11-09');
   tracking.customSchedule['2026-10-19']={name:item.name,exercises:item.exercises};
   const once=scheduledCustomWorkout('2026-10-19');
   customWorkouts.pop();
   return {sameDay:sameDay?.title,repeat:repeat?.title,noMatch,expired,once:once?.title};
  });
  assert.equal(schedule.sameDay,'QA Scheduled Workout');
  assert.equal(schedule.repeat,'QA Scheduled Workout');
  assert.equal(schedule.noMatch,null);
  assert.equal(schedule.expired,null);
  assert.equal(schedule.once,'QA Scheduled Workout');
  assert.deepEqual(errors,[],'No uncaught page errors during food and schedule checks');
  await context.close();
  console.log('Food and scheduling release checks PASS: Free search, calorie conversion, Pro gating, seven days, persisted plan, weekly repeat and expiration');
 }finally{await browser.close();server.close()}
})().catch(e=>{server.close();console.error(e);process.exitCode=1});