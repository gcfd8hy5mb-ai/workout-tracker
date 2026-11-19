const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  for(const device of [{name:'desktop',viewport:{width:1440,height:900},isMobile:false},
   {name:'iPhone-sized',viewport:{width:390,height:844},isMobile:true}]){
   const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,hasTouch:device.isMobile});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('https://kirlpjflaoriiusfamsk.supabase.co/**',route=>route.abort());
   await page.addInitScript(()=>{
    const now=new Date(),day=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
    const plan={id:'coach-smoke-plan',title:'My Custom Coach Session',kind:'Custom',description:'Coach browser test',ids:['leg-press']};
    const draft={version:1,plans:[plan],assigned:Array(7).fill(plan.id),overrides:{[day]:plan.id},recurring:[]};
    localStorage.setItem('mlc2-recurring-preview-v1:guest',JSON.stringify(draft));
    const dayBefore=new Date(now.getFullYear(),now.getMonth(),now.getDate()-3,12).toISOString();
    const weekBefore=new Date(now.getFullYear(),now.getMonth(),now.getDate()-7,12).toISOString();
    localStorage.setItem('mlc2-demo-workouts-v1',JSON.stringify([{
     id:'coach-verified-workout',created:dayBefore,title:'Prior custom training',readiness:'Normal',
     sets:[{exerciseId:'leg-press',weight:155,reps:9},{exerciseId:'leg-press',weight:155,reps:10}]
    }]));
    localStorage.setItem('mlc2-coach-feedback-v1:guest',JSON.stringify({
     version:1,owner:'guest',rows:[{id:'cf-1770000000000-1',at:weekBefore,
      response:'modified',kind:'progress',exerciseId:'leg-press'}]
    }));

   });
   await page.goto('http://127.0.0.1:8765/myliftcoach2/',{waitUntil:'load'});
   await page.waitForFunction(()=>document.querySelector('#todayTitle')?.textContent==='My Custom Coach Session',{timeout:15000});
   await page.locator('.sidebar [data-page="coaching"]').first().evaluate(el=>el.click());
   assert.equal(await page.locator('#coaching').isVisible(),true,device.name+' Coach tab');
   await page.locator('#coachCheckinRecovery').selectOption('poor');
   await page.locator('#coachCheckinEnergy').selectOption('low');
   await page.locator('#coachCheckinDifficulty').selectOption('hard');
   await page.locator('#coachCheckinDays').selectOption('3');
   await page.locator('#coachCheckinSave').evaluate(el=>el.click());
   assert.match(await page.locator('#coachCheckinStatus').textContent(),/conservative/,device.name+' check-in signal');
   assert.ok(await page.locator('#coachOutcomeCandidate option').count()>1,device.name+' eligible outcome');
   await page.locator('#coachOutcomeCandidate').selectOption({index:1});
   await page.locator('#coachOutcomeRating').selectOption('same');
   await page.locator('#coachOutcomeSave').evaluate(el=>el.click());
   assert.match(await page.locator('#coachOutcomeStatus').textContent(),/1 outcome ratings saved/,device.name+' outcome pairing');
   const outcome=await page.evaluate(()=>JSON.parse(localStorage.getItem('mlc2-coach-outcomes-v1:guest')));
   assert.equal(outcome.rows[0].rating,'same');
   assert.equal(outcome.rows[0].sessionId,'coach-verified-workout');

   await page.locator('#coachAskInput').fill('What workout today?');
   await page.locator('#coachAskSubmit').evaluate(el=>el.click());
   assert.match(await page.locator('#coachAskAnswer').textContent(),/My Custom Coach Session/,device.name+' Ask Coach');
   await page.locator('[data-coach-feedback="modified"]').evaluate(el=>el.click());
   assert.match(await page.locator('#coachFeedbackStatus').textContent(),/1 Coach responses recorded/,device.name+' feedback');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mlc2-coach-feedback-v1:guest')).rows[0].response),'modified');
   await page.locator('#coachOpenToday').evaluate(el=>el.click());
   await page.locator('[data-target-weight="leg-press"]').fill('165');
   await page.locator('[data-target-save="leg-press"]').evaluate(el=>el.click());
   assert.equal(await page.locator('[data-target-weight="leg-press"]').inputValue(),'165');
   await page.locator('[data-target-use="leg-press"]').evaluate(el=>el.click());
   assert.equal(await page.locator('[data-weight="leg-press"]').inputValue(),'165');
   await page.locator('[data-reps="leg-press"]').fill('9');
   await page.locator('[data-addset="leg-press"]').evaluate(el=>el.click());
   assert.equal(await page.locator('[data-weight="leg-press"]').inputValue(),'165',device.name+' weight continuity');
   assert.equal(await page.locator('[data-reps="leg-press"]').inputValue(),'9',device.name+' rep continuity');
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mlc2-coach-manual-targets-v1:guest')));
   assert.equal(saved.targets['leg-press'],165,device.name+' isolated local target');
   assert.deepEqual(errors,[],device.name+' browser errors: '+errors.join('; '));
   await context.close();
  }
 } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
