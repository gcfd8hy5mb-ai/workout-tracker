const { chromium,webkit } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
 const safari=process.env.MLC_BROWSER==='webkit';
 const browser=safari?await webkit.launch({headless:true}):await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  for(const device of [{name:'desktop',viewport:{width:1440,height:900},isMobile:false},
   {name:'iPhone-sized',viewport:{width:390,height:844},isMobile:true}]){
   if(safari&&!device.isMobile)continue;
   const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,hasTouch:device.isMobile});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   const user={id:'beta-tester',email:'beta@example.test',app_metadata:{myliftcoach_beta:true}};
   let offline=false;
   await page.route('https://kirlpjflaoriiusfamsk.supabase.co/**',route=>{
    if(offline)return route.abort();
    const url=new URL(route.request().url());
    if(url.pathname.endsWith('/user'))return route.fulfill({json:user});
    if(url.pathname.endsWith('/token'))return route.fulfill({json:{user,access_token:'beta-token',expires_in:3600}});
    return route.fulfill({status:404,json:{}});
   });
   await page.addInitScript(()=>{
    if(localStorage.getItem('seeded-beta'))return;
    localStorage.setItem('seeded-beta','yes');
    sessionStorage.setItem('mlc2-auth-session-v1',JSON.stringify({access_token:'beta-token',user:{id:'beta-tester'},expires_at:Date.now()/1000+3600}));
    const now=new Date(),day=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
    const plan={id:'coach-smoke-plan',title:'My Custom Coach Session',kind:'Custom',description:'Coach browser test',ids:['leg-press']};
    const draft={version:1,plans:[plan],assigned:Array(7).fill(plan.id),overrides:{[day]:plan.id},recurring:[]};
    localStorage.setItem('mlc2-recurring-preview-v1:account:beta-tester',JSON.stringify(draft));
    const dayBefore=new Date(now.getFullYear(),now.getMonth(),now.getDate()-3,12).toISOString();
    const weekBefore=new Date(now.getFullYear(),now.getMonth(),now.getDate()-7,12).toISOString();
    localStorage.setItem('mlc2-demo-workouts-v1:beta-tester',JSON.stringify([{
     id:'coach-verified-workout',created:dayBefore,title:'Prior custom training',readiness:'Normal',
     sets:[{exerciseId:'leg-press',weight:155,reps:9},{exerciseId:'leg-press',weight:155,reps:10}]
    },{
     id:'older-training',created:new Date(now.getFullYear(),now.getMonth(),now.getDate()-14,12).toISOString(),
     title:'Earlier custom training',readiness:'Normal',
     sets:[{exerciseId:'leg-press',weight:150,reps:8},{exerciseId:'leg-press',weight:150,reps:9}]
    }]));
    localStorage.setItem('mlc2-coach-feedback-v1:beta-tester',JSON.stringify({
     version:1,owner:'beta-tester',rows:[{id:'cf-1770000000000-1',at:weekBefore,
      response:'modified',kind:'progress',exerciseId:'leg-press'}]
    }));

   });
   await page.goto('http://127.0.0.1:8765/myliftcoach2/',{waitUntil:'load'});
   await page.waitForFunction(()=>document.querySelector('#todayTitle')?.textContent==='My Custom Coach Session',{timeout:15000});
   await page.locator('.sidebar [data-page="coaching"]').first().evaluate(el=>el.click());
   assert.equal(await page.locator('#coaching').isVisible(),true,device.name+' Coach tab');
   await page.waitForFunction(()=>!document.querySelector('#betaMode').disabled);
   assert.equal(await page.locator('#betaMode').inputValue(),'free');
   assert.equal(await page.locator('#coachAskSubmit').isVisible(),false);
   assert.equal(await page.locator('#basicCoachTitle').textContent(),'My Custom Coach Session');
   assert.match(await page.locator('#basicCoachExercises').textContent(),/155 lb × 10/);
   await page.locator('#basicCoachStart').click();
   assert.equal(await page.locator('#modalContent h2').textContent(),'My Custom Coach Session');
   await page.locator('#closeModal').click();
   const selectMode=async mode=>{
    await page.locator('.sidebar [data-page="settings"]').first().evaluate(el=>el.click());
    await page.locator('#betaMode').selectOption(mode);
    await page.locator('.sidebar [data-page="coaching"]').first().evaluate(el=>el.click());
   };
   await selectMode('pro');
   assert.match(await page.locator('#coachAdaptiveStatus').textContent(),/scheduled movements assessed/,device.name+' adaptive summary');
   assert.match(await page.locator('#coachNextSessionStatus').textContent(),/exact custom workout/,device.name+' next-session plan');
   assert.match(await page.locator('#coachNextSessionList').textContent(),/Leg Press/,device.name+' actual exercise');
   assert.match(await page.locator('#coachCycleStatus').textContent(),/Coach (before|after|during)|weekly Coach check-in/i,device.name+' original Coach cycle');
   assert.match(await page.locator('#coachEntitlementStatus').textContent(),/Pro beta preview active/i,device.name+' draft entitlement boundary');
   assert.ok(await page.locator('[data-coach-proposal-accept]').count()>0,device.name+' eligible adaptive suggestion');
   await page.locator('[data-coach-proposal-accept]').first().evaluate(el=>el.click());
   const decisions=await page.evaluate(()=>JSON.parse(localStorage.getItem('mlc2-coach-proposal-decisions-v1:beta-tester')));
   assert.equal(decisions.rows[0].choice,'accepted');
   assert.match(await page.locator('#coachAdaptiveProposals').textContent(),/review record only/,device.name+' non-applying decision');
   assert.equal(await page.locator('#todayTitle').textContent(),'My Custom Coach Session');

   await page.locator('#coachCheckinRecovery').selectOption('poor');
   await page.locator('#coachCheckinEnergy').selectOption('low');
   await page.locator('#coachCheckinDifficulty').selectOption('hard');
   await page.locator('#coachCheckinDays').selectOption('3');
   await page.locator('#coachCheckinSave').evaluate(el=>el.click());
   assert.match(await page.locator('#coachCheckinStatus').textContent(),/conservative/,device.name+' check-in signal');
   assert.match(await page.locator('#coachAdaptiveStatus').textContent(),/optional weight changes/,device.name+' adaptive safety');
   assert.ok(await page.locator('#coachOutcomeCandidate option').count()>1,device.name+' eligible outcome');
   await page.locator('#coachOutcomeCandidate').selectOption({index:1});
   await page.locator('#coachOutcomeRating').selectOption('same');
   await page.locator('#coachOutcomeSave').evaluate(el=>el.click());
   assert.match(await page.locator('#coachOutcomeStatus').textContent(),/1 outcome ratings saved/,device.name+' outcome pairing');
   const outcome=await page.evaluate(()=>JSON.parse(localStorage.getItem('mlc2-coach-outcomes-v1:beta-tester')));
   assert.equal(outcome.rows[0].rating,'same');
   assert.equal(outcome.rows[0].sessionId,'coach-verified-workout');

   await page.locator('#coachAskInput').fill('What workout today?');
   await page.locator('#coachAskSubmit').evaluate(el=>el.click());
   assert.match(await page.locator('#coachAskAnswer').textContent(),/My Custom Coach Session/,device.name+' Ask Coach');
   await page.locator('[data-coach-feedback="modified"]').evaluate(el=>el.click());
   assert.match(await page.locator('#coachFeedbackStatus').textContent(),/2 Coach responses recorded/,device.name+' feedback');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mlc2-coach-feedback-v1:beta-tester')).rows[0].response),'modified');
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
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mlc2-coach-manual-targets-v1:beta-tester')));
   assert.equal(saved.targets['leg-press'],165,device.name+' isolated local target');
   // Dismiss the software keyboard to expose the workout footer as on a real iPhone.
   await page.evaluate(()=>document.activeElement?.blur());
   const saveLater=page.locator('#cancelWorkout');
   try{if(device.isMobile)await saveLater.tap({timeout:8000});else await saveLater.click({timeout:8000})}
   catch(error){
    console.error(device.name,await saveLater.evaluate(button=>{
     const r=button.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
     return {bounds:r.toJSON(),hit:hit?.outerHTML.slice(0,200),viewport:[innerWidth,innerHeight],
      scale:visualViewport?.scale,offset:[visualViewport?.offsetLeft,visualViewport?.offsetTop],
      modal:document.querySelector('.modal-panel').getBoundingClientRect().toJSON()};
    }));
    throw error;
   }
   const snapshot=()=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage)
    .filter(key=>key.startsWith('mlc2-')&&!key.startsWith('mlc2-beta-mode')).sort()
    .map(key=>[key,localStorage.getItem(key)])));
   const before=await snapshot();
   await selectMode('free');
   assert.equal(await page.locator('#coachAskSubmit').isVisible(),false);
   await selectMode('pro');
   assert.deepEqual(await snapshot(),before);
   await page.reload();
   await page.waitForFunction(()=>document.querySelector('#betaMode').value==='pro');
   await page.locator('#authAction').evaluate(el=>el.click());
   assert.equal(await page.locator('#betaMode').isEnabled(),true,'guest beta switch remains available like original MYLIFTCOACH');
   await page.locator('#authAction').evaluate(el=>el.click());
   await page.locator('#loginForm [name=email]').fill('beta@example.test');
   await page.locator('#loginForm [name=password]').fill('fixture-only');
   await page.locator('#loginSubmit').click();
   await page.waitForFunction(()=>document.querySelector('#betaMode').value==='pro');
   assert.equal(await page.locator('#progressSessions').textContent(),'2');
   offline=true;
   await page.reload();
   await page.waitForFunction(()=>document.querySelector('#progressSessions').textContent==='2');
   assert.equal(await page.locator('#betaMode').isEnabled(),true,'offline beta switch remains available like original MYLIFTCOACH');
   assert.deepEqual(errors,[],device.name+' browser errors: '+errors.join('; '));
   await context.close();
  }
 } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
