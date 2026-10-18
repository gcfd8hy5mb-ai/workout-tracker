// Targeted release regression for Free food search, verified Pro planner, and custom scheduling.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const vm=require('node:vm');
const plannerSource=fs.readFileSync(path.resolve(__dirname,'../meal-planner.js'),'utf8');
const recipeSource=plannerSource.match(/const meals=(\[[\s\S]*?\])\.map\(/)?.[1];
const quantitySource=plannerSource.match(/const recipeQuantities=(\{[\s\S]*?\});\s*function groceryTotals/)?.[1];
assert.ok(recipeSource&&quantitySource,'Pro recipe catalog is parseable');
const proRecipes=vm.runInNewContext('('+recipeSource+')');
const proQuantities=vm.runInNewContext('('+quantitySource+')');
assert.ok(proRecipes.length>=28,'Pro planner offers at least 28 reference meals');
assert.equal(new Set(proRecipes.map(x=>x[0])).size,proRecipes.length,'Recipe names are unique');
for(const recipe of proRecipes){
 assert.ok(['Breakfast','Lunch','Dinner','Snack'].includes(recipe[5]),'Recipe has a meal type');
 assert.ok(Number.isFinite(recipe[1])&&recipe[1]>0&&Number.isFinite(recipe[2])&&recipe[2]>0,'Recipe has estimated calories and protein');
 assert.ok(proQuantities[recipe[0]]?.length>0,'Every recipe generates shopping quantities: '+recipe[0]);
 assert.ok(proQuantities[recipe[0]].every(x=>Number.isFinite(x[1])&&x[1]>0),'Ingredient quantities are positive');
}
for(const type of ['Breakfast','Lunch','Dinner','Snack'])assert.ok(proRecipes.filter(x=>x[5]===type).length>=6,'Pro has at least six '+type+' options');

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
  await page.route('https://world.openfoodfacts.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({products:[{code:'1234567890123',product_name:'QA Cereal',brands:'Test Brand',nutriments:{'energy-kcal_100g':400,proteins_100g:10,carbohydrates_100g:70,fat_100g:8}}]})}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof showFood==='function'&&typeof showWorkoutsBrowserRoot==='function'&&typeof window.mlcRefreshMealPlanner==='function');
  await page.addStyleTag({content:'html.myliftcoach-starting body, html.prism-account-booting body, .container, #foodScreen {visibility:visible!important}'}); // Isolated nutrition fixture; startup behavior has independent tests.
   await page.evaluate(()=>{document.documentElement.classList.remove('myliftcoach-starting');goHome();showFood()});
  console.log('[food visibility diagnostic]',await page.evaluate(()=>{const el=document.getElementById('foodScreen');const chain=[];for(let e=el;e;e=e.parentElement){const st=getComputedStyle(e);chain.push({id:e.id,className:typeof e.className==='string'?e.className:'',display:st.display,visibility:st.visibility,rect:e.getBoundingClientRect().toJSON?.()})}return {chain,screenFns:{showFood:String(showFood).slice(0,400),showScreen:String(showScreen).slice(0,300)},bodyClass:document.body.className}}));
  await page.waitForFunction(()=>{const el=document.getElementById('foodScreen');return el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'},null,{timeout:15000});
  const allFoods=await page.locator('#foodChoice option').count();
  assert.ok(allFoods>=200,'Free food selector should expose the expanded library');
  await page.locator('#foodCategory').selectOption('Fruit');
  assert.ok(await page.locator('#foodChoice option').count()<allFoods,'Fruit category must filter the list');
  assert.ok(await page.locator('#foodChoice option').count()>5,'Fruit category should contain useful choices');
  await page.locator('#foodCategory').selectOption('');
  const beforeQuick=await page.evaluate(()=>tracking.food.length);
  await page.getByRole('button',{name:'Quick log one serving of Banana'}).click();
  assert.equal(await page.evaluate(()=>tracking.food.length),beforeQuick+1,'One-tap quick food must save exactly one entry');
  assert.ok(await page.evaluate(()=>tracking.food.at(-1).name.includes('Banana')),'Quick food must log selected item');
  // Free saved meals: compose, save, log once, and persist after reload.
  await page.locator('#savedMealName').fill('QA Lunch');
  await page.locator('#savedMealFood').selectOption('chicken');
  await page.locator('#savedMealServings').fill('1');
  await page.getByRole('button',{name:'Add ingredient'}).click();
  await page.locator('#savedMealFood').selectOption('rice');
  await page.getByRole('button',{name:'Add ingredient'}).click();
  await page.getByRole('button',{name:'Save this meal'}).click();
  assert.equal(await page.evaluate(()=>tracking.savedMeals.length),1,'Free user can save custom meal');
  const mealCalories=await page.evaluate(()=>caloriesForSavedMeal(tracking.savedMeals[0]));
  assert.ok(mealCalories>200,'Saved meal totals multiple foods');
  const mealsBeforeLog=await page.evaluate(()=>tracking.food.length);
  await page.getByRole('button',{name:'Log saved meal QA Lunch'}).click();
  assert.equal(await page.evaluate(()=>tracking.food.length),mealsBeforeLog+1,'Saved meal logs exactly one entry');
  assert.equal(await page.evaluate(()=>tracking.food.at(-1).calories),mealCalories,'Logged saved meal preserves total calories');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dailyTrackingV1')).savedMeals.length),1,'Saved meals persist in account sync tracking data');
  await page.getByRole('button',{name:'Edit saved meal QA Lunch'}).click();
  await page.locator('#savedMealName').fill('QA Dinner');
  await page.locator('#savedMealServings').fill('0.5');
  await page.locator('#savedMealFood').selectOption('egg');
  await page.getByRole('button',{name:'Add ingredient'}).click();
  await page.locator('#saveCustomMealButton').click();
  assert.equal(await page.evaluate(()=>tracking.savedMeals.length),1,'Editing must not duplicate saved meals');
  assert.equal(await page.evaluate(()=>tracking.savedMeals[0].name),'QA Dinner','Edited meal name saved');
  assert.equal(await page.evaluate(()=>tracking.savedMeals[0].ingredients.length),3,'New ingredient persisted in edited meal');
  assert.ok(await page.evaluate(()=>tracking.food.some(x=>x.name.includes('QA Lunch (saved meal)'))),'Editing saved meal must not rewrite prior food log');
  await page.getByRole('button',{name:'Edit saved meal QA Dinner'}).click();
  await page.locator('#savedMealName').fill('Discarded edit');
  await page.getByRole('button',{name:'Cancel editing'}).click();
  assert.equal(await page.evaluate(()=>tracking.savedMeals[0].name),'QA Dinner','Cancel must not save draft edits');

  await page.locator('#foodCategory').selectOption('');
  await page.locator('#foodChoice').selectOption('chicken');
  await page.locator('#foodServings').fill('1');
  await page.locator('#foodScreen form.tracker-form').first().getByRole('button',{name:'Log food'}).click();
  const trackedMacro=await page.evaluate(()=>tracking.food.at(-1));
  assert.ok(trackedMacro.protein>25 && trackedMacro.carbs===0,'Known chicken macro values must be recorded');
  assert.ok((await page.locator('#foodMacroSummary').innerText()).includes('Protein'),'Free daily macro summary renders');
  await page.locator('#foodChoice').selectOption('custom');
  await page.locator('#foodName').fill('QA Label');
  await page.locator('#foodCalories').fill('150');
  await page.locator('#foodProtein').fill('12');
  await page.locator('#foodCarbs').fill('20');
  await page.locator('#foodFat').fill('3');
  await page.locator('#foodScreen form.tracker-form').first().getByRole('button',{name:'Log food'}).click();
  assert.equal(await page.evaluate(()=>tracking.food.at(-1).protein),12,'Custom labeled protein persisted');
  assert.equal(await page.evaluate(()=>tracking.food.at(-1).carbs),20,'Custom labeled carbohydrates persisted');
  assert.equal(await page.evaluate(()=>tracking.food.at(-1).fat),3,'Custom labeled fat persisted');
  const checked=await page.evaluate(()=>{
    const blueberry=commonFoods.find(x=>x.id==='blueberries');
    const tuna=commonFoods.find(x=>x.id==='extra-tuna-canned-in-water-drained');
    const oil=commonFoods.find(x=>x.id==='extra-olive-oil');
    const unknown=commonFoods.find(x=>x.id==='extra-cheese-pizza');
    return {blueberry:foodMacros(blueberry,1),tuna:foodMacros(tuna,1.5),oil:foodMacros(oil,1),unknown:foodMacros(unknown,1)};
  });
  assert.ok(checked.blueberry.carbs>20,'Blueberries have source-specific carbs');
  assert.equal(checked.tuna.protein,38.3,'Tuna protein scales to 150g');
  assert.equal(checked.oil.fat,14,'Olive oil fat scales to 14g');
  assert.equal(checked.unknown,null,'Unsourced mixed meals remain unknown');
  await page.locator('#foodChoice').selectOption('blueberries');
  assert.match(await page.locator('#foodEstimate').innerText(),/Protein .*reference estimates/,'Known foods show reference macro estimates');
  await page.locator('#foodChoice').selectOption('extra-cheese-pizza');
  assert.match(await page.locator('#foodEstimate').innerText(),/Macros unavailable/,'Unmapped foods show honest missing-macro status');
  await page.locator('#foodChoice').selectOption('');
  assert.match(await page.locator('#savedMealsList').innerText(),/Some ingredient macros unavailable|Macros estimated/,'Saved meals explain macro coverage');
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
  assert.equal(freeFood?.protein,15,'Packaged food protein scales by grams');
  assert.equal(freeFood?.carbs,105,'Packaged food carbs scale by grams');
  assert.equal(freeFood?.fat,12,'Packaged food fat scales by grams');
  assert.ok(await page.locator('#onlineFoodStatus').innerText().then(x=>x.includes('600 calories')),'Food lookup must confirm calorie log');

  // Simulate a trusted verified subscription, not a beta preview.
  await page.evaluate(()=>{prismEntitlement={tier:'beta',source:'beta_preview',betaView:'pro'};window.mlcRefreshMealPlanner()});
  assert.equal(await planner.getByRole('button',{name:'Generate my week'}).count(),0,'Pro preview cannot unlock automatic plans');
  await page.evaluate(()=>{prismEntitlement={tier:'pro',source:'manual_grant'};window.mlcRefreshMealPlanner()});
  await planner.getByRole('button',{name:'Generate my week'}).click();
  let planned=await page.evaluate(()=>JSON.parse(localStorage.getItem('myliftcoachMealPlannerV1:guest')));
  const recipeAudit=await page.evaluate(()=>{
    const source=Array.from(document.scripts).find(x=>x.src.includes('meal-planner.js'));
    return Boolean(source);
  });
  assert.ok(recipeAudit,'Pro meal planner script must load');
  assert.equal(planned.days.length,7,'Paid planner must generate exactly 7 days');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dailyTrackingV1')).mealPlanner.days.length),7,'Meal plan must enter account-scoped tracking sync snapshot');
  assert.ok(planned.days.every(d=>d.items.length===4),'Each day must contain four planned meals');
  await planner.getByRole('spinbutton',{name:'Daily protein target in grams'}).fill('150');
  await planner.getByRole('spinbutton',{name:'Daily protein target in grams'}).press('Tab');
  await planner.getByRole('button',{name:'Regenerate 7 days'}).click();
  planned=await page.evaluate(()=>JSON.parse(localStorage.getItem('myliftcoachMealPlannerV1:guest')));
  assert.equal(planned.proteinGoal,150,'Pro protein goal persists in plan');
  assert.ok(planned.days.every(d=>d.items.length===4),'Protein preference maintains complete days');
  assert.ok(await planner.getByText('Weekly ingredient list', {exact:false}).count()>0,'Grocery list must render');
  const shop=planner.locator('details');await shop.locator('summary').click();
  await shop.getByRole('checkbox',{name:/Got /}).first().check();
  assert.equal(await page.evaluate(()=>Object.values(tracking.mealPlanner.groceryChecked||{}).filter(Boolean).length),1,'Pro grocery checkoff persists');
  await shop.getByRole('button',{name:'Reset shopping checklist'}).click();
  assert.equal(await page.evaluate(()=>Object.values(tracking.mealPlanner.groceryChecked||{}).filter(Boolean).length),0,'Pro checklist reset persists');
  await planner.locator('label').filter({hasText:'No meat'}).locator('input').check();
  await planner.getByRole('button',{name:/Generate|Regenerate/}).click();
  const noMeat=await page.evaluate(()=>tracking.mealPlanner.days.every(day=>day.items.every(item=>!/(Chicken|Turkey)/.test(item.name))));
  assert.ok(noMeat,'Pro meat exclusion must remove chicken and turkey');
  await planner.locator('label').filter({hasText:'No meat'}).locator('input').uncheck();
  await planner.getByRole('button',{name:/Generate|Regenerate/}).click(); // Rebuild cleared plan after changing exclusions.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof showFood==='function'&&typeof window.mlcRefreshMealPlanner==='function');
  await page.evaluate(()=>{document.documentElement.classList.remove('myliftcoach-starting');prismEntitlement={tier:'pro',source:'manual_grant'};goHome();showFood()});
  planned=await page.evaluate(()=>JSON.parse(localStorage.getItem('myliftcoachMealPlannerV1:guest')));
  assert.equal(planned.days.length,7,'Meal plan must survive a reload');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dailyTrackingV1')).mealPlanner.days.length),7,'Synced tracking source must restore the plan after reload');

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