const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
 const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
 const base='http://127.0.0.1:8765/myliftcoach2/';
 try {
  for(const device of [{label:'desktop',viewport:{width:1440,height:900},isMobile:false},{label:'iPhone-sized',viewport:{width:390,height:844},isMobile:true}]){
   const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,hasTouch:device.isMobile});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('https://kirlpjflaoriiusfamsk.supabase.co/**',route=>route.abort());
   await page.addInitScript(()=>{
    const today=new Date();
    const key=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    const prior=new Date(today.getFullYear(),today.getMonth(),today.getDate()-7,12);
    const start=[prior.getFullYear(),String(prior.getMonth()+1).padStart(2,'0'),String(prior.getDate()).padStart(2,'0')].join('-');
    const plans=[{id:'custom-test-session',title:'My Custom Session',kind:'Custom',description:'Browser test workout',ids:['leg-press','seated-leg-curl']}];
    const document={version:1,plans,assigned:Array(7).fill('custom-test-session'),overrides:{[key]:'custom-test-session'},recurring:[{start,end:null,workoutId:'custom-test-session'}]};
    if(localStorage.getItem('mlc2-recurring-preview-v1:guest')===null) localStorage.setItem('mlc2-recurring-preview-v1:guest',JSON.stringify(document));
   });
   await page.goto(base,{waitUntil:'load'});
   await page.waitForFunction(()=>document.querySelector('#todayTitle')?.textContent==='My Custom Session',{timeout:15000});
   assert.deepEqual(errors,[],device.label+' bootstrap errors: '+errors.join('; '));
   assert.equal(await page.locator('#todayTitle').textContent(),'My Custom Session');
   assert.equal(await page.locator('#homeLoadOriginalHistory').isDisabled(),true);
   assert.match(await page.locator('#homeOriginalRecentStatus').textContent(),/Sign in/);
   assert.equal(await page.locator('#homeOriginalRecent .recent-item').count(),0);
   const boardToday=await page.locator('#weeklyBoardHome .week-day-card.is-today').textContent();
   assert.match(boardToday,/My Custom Session/);
   await page.locator('#heroStart').evaluate(el=>el.click());
   assert.match(await page.locator('#modalContent h2').textContent(),/My Custom Session/);
   assert.equal(await page.locator('[data-use-last]').count(),0);
   assert.equal(await page.locator('[data-session-readiness="Normal"]').getAttribute('aria-pressed'),'true');
   await page.locator('[data-session-readiness="Tired"]').evaluate(el=>el.click());
   assert.equal(await page.locator('[data-session-readiness="Tired"]').getAttribute('aria-pressed'),'true');
   assert.match(await page.locator('#sessionSetProgressText').textContent(),/Ready to start/);
   assert.match(await page.locator('[data-warmups="leg-press"]').textContent(),/Optional warm-ups/);
   assert.equal(await page.locator('[data-use-coach]').count(),0);
   await page.locator('[data-addset="leg-press"]').evaluate(el=>el.click());
   assert.match(await page.locator('#sessionSetProgressText').textContent(),/1 of/);
   await page.locator('[data-swap-select="leg-press"]').selectOption('leg-extension');
   await page.locator('[data-swap-apply="leg-press"]').evaluate(el=>el.click());
   assert.equal(await page.locator('[data-exercise-card="leg-press"]').count(),1);
   assert.equal(await page.locator('[data-exercise-card="leg-extension"]').count(),1);
   assert.match(await page.locator('[data-count="leg-press"]').textContent(),/1 logged/);
   assert.match(await page.locator('#sessionSetProgressText').textContent(),/1 of/);
   assert.equal(await page.locator('[data-use-last]').count(),0);
   await page.locator('#closeModal').evaluate(el=>el.click());
   assert.match(await page.locator('#todayExercises').textContent(),/Leg Press/);
   assert.doesNotMatch(await page.locator('#todayExercises').textContent(),/Leg Extension/);

   // Editing the exact scheduled plan must update Home, modal and persisted copy.
   const today=(new Date().getDay()+6)%7;
   await page.locator('#weeklyBoardHome [data-week-day="'+today+'"]').evaluate(el=>el.click());
   await page.locator('#weekWorkoutName').fill('Updated Custom Session');
   await page.locator('#weekSaveButton').evaluate(el=>el.click());
   assert.equal(await page.locator('#todayTitle').textContent(),'Updated Custom Session');
   assert.match(await page.locator('#weeklyBoardWorkouts .week-day-card.is-today').textContent(),/Updated Custom Session/);
   await page.locator('#todayStart').evaluate(el=>el.click());
   assert.equal(await page.locator('#modalContent h2').textContent(),'Updated Custom Session');
   await page.locator('#closeModal').evaluate(el=>el.click());
   await page.reload({waitUntil:'load'});
   await page.waitForFunction(()=>document.querySelector('#todayTitle')?.textContent==='Updated Custom Session',{timeout:15000});
   assert.equal(await page.locator('#todayTitle').textContent(),'Updated Custom Session');
   assert.match(await page.locator('#weeklyBoardHome .week-day-card.is-today').textContent(),/Updated Custom Session/);
   assert.deepEqual(errors,[],device.label+' errors after reload');
   // Newly restored sidebar actions must reach the SAME account-scoped editor.
   await page.locator('[data-workout-action="manage"]').evaluate(el=>el.click());
   assert.equal(await page.locator('#weekEditor').isVisible(),true);
   await page.locator('[data-workout-action="create"]').evaluate(el=>el.click());
   assert.match(await page.locator('#weekWorkoutSelect').inputValue(),/^custom-/);
   await page.locator('#weekWorkoutName').fill('My Sidebar Routine');
   await page.locator('#weekSaveButton').evaluate(el=>el.click());
   assert.equal(await page.locator('#todayTitle').textContent(),'My Sidebar Routine');
   await page.locator('#heroStart').evaluate(el=>el.click());
   assert.equal(await page.locator('#modalContent h2').textContent(),'My Sidebar Routine');
   await page.locator('#closeModal').evaluate(el=>el.click());
   await page.reload({waitUntil:'load'});
   assert.equal(await page.locator('#todayTitle').textContent(),'My Sidebar Routine');
   // Copy an existing saved source workout from this imported account fixture.
   // The fixture intentionally has no default 'upper-a' preset.
   await page.locator('[data-workout-action="manage"]').evaluate(el=>el.click());
   await page.locator('#weekWorkoutSelect').selectOption('custom-test-session');
   const presetName=await page.locator('#weekWorkoutName').inputValue();
   await page.locator('#weekDuplicateWorkout').evaluate(el=>el.click());
   assert.match(await page.locator('#weekWorkoutSelect').inputValue(),/^custom-/);
   await page.locator('#weekWorkoutName').fill('My Copied Routine');
   await page.locator('#weekSaveButton').evaluate(el=>el.click());
   assert.equal(await page.locator('#todayTitle').textContent(),'My Copied Routine');
   await page.reload({waitUntil:'load'});
   assert.equal(await page.locator('#todayTitle').textContent(),'My Copied Routine');
   await page.locator('[data-workout-action="manage"]').evaluate(el=>el.click());
   await page.locator('#weekWorkoutSelect').selectOption('custom-test-session');
   assert.equal(await page.locator('#weekWorkoutName').inputValue(),presetName);
   assert.deepEqual(errors,[],device.label+' sidebar navigation errors');
   // History/Coach/Tracking shortcuts must lead to existing safe read-only views.
   await page.locator('.sidebar [data-page="progress"]').first().evaluate(el=>el.click());
   assert.equal(await page.locator('#progress').isVisible(),true);
   assert.equal(await page.locator('#originalHistorySearch').isDisabled(),true);
   assert.equal(await page.locator('#originalCalendarMonth').isDisabled(),true);
   assert.equal(await page.locator('#originalExerciseTrendSelect').isDisabled(),true);
   assert.match(await page.locator('#originalExerciseTrendStatus').textContent(),/Original exercise progress/);
   assert.match(await page.locator('#originalCalendarStatus').textContent(),/Load original account history/);
   assert.match(await page.locator('#originalVolumeChart').textContent(),/Load original account history/);
   await page.locator('.sidebar [data-page="nutrition"]').first().evaluate(el=>el.click());
   assert.equal(await page.locator('#nutrition').isVisible(),true);
   assert.equal(await page.locator('#trackingMonth').isDisabled(),true);
   assert.match(await page.locator('#trackingMonthStatus').textContent(),/Load original tracking/);
   await page.locator('.sidebar [data-page="coaching"]').first().evaluate(el=>el.click());
   assert.equal(await page.locator('#coaching').isVisible(),true);
   assert.equal(await page.locator('#coachLoadOriginalHistory').isDisabled(),true);
   await page.locator('[data-page="settings"]').first().evaluate(el=>el.click());
   assert.equal(await page.locator('#loadAllOriginalRecords').isDisabled(),true);
   assert.match(await page.locator('#loadAllOriginalStatus').textContent(),/Sign in/);
   assert.equal(await page.locator('#coachMovementSearch').isDisabled(),true);
   assert.deepEqual(errors,[],device.label+' navigation/account-isolation errors');
   // Rest day is a dated exception, not a reset of imported recurring rules.
   await page.locator('#weeklyBoardHome [data-week-day="'+today+'"]').evaluate(el=>el.click());
   await page.locator('#weekWorkoutSelect').selectOption('');
   await page.locator('#weekSaveButton').evaluate(el=>el.click());
   assert.equal(await page.locator('#todayTitle').textContent(),'Rest day');
   assert.equal(await page.locator('#heroStart').isDisabled(),true);
   const storedRest=await page.evaluate(()=>{
    const doc=JSON.parse(localStorage.getItem('mlc2-recurring-preview-v1:guest'));
    const day=new Date(),date=[day.getFullYear(),String(day.getMonth()+1).padStart(2,'0'),String(day.getDate()).padStart(2,'0')].join('-');
    return {override:doc.overrides[date],ruleCount:doc.recurring.length};
   });
   assert.equal(storedRest.override,null);
   assert.equal(storedRest.ruleCount,1);
   await page.reload({waitUntil:'load'});
   assert.equal(await page.locator('#todayTitle').textContent(),'Rest day');
   assert.equal(await page.locator('#heroStart').isDisabled(),true);
   await page.locator('#weeklyBoardHome [data-week-day="'+today+'"]').evaluate(el=>el.click());
   assert.equal(await page.locator('#weekRestoreRepeating').isVisible(),true);
   await page.locator('#weekRestoreRepeating').evaluate(el=>el.click());
   assert.equal(await page.locator('#todayTitle').textContent(),'Updated Custom Session');
   assert.equal(await page.locator('#heroStart').isDisabled(),false);
   assert.equal(await page.locator('#weekRestoreRepeating').isHidden(),true);
   await page.reload({waitUntil:'load'});
   assert.equal(await page.locator('#todayTitle').textContent(),'Updated Custom Session');
   assert.deepEqual(errors,[],device.label+' rest exception undo errors');
   console.log('PASS '+device.label+': Home/board/Start agree; edit, sidebar create, and reload retain custom workout');
   await context.close();
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
