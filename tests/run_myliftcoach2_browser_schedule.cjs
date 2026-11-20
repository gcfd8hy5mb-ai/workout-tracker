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
   if(device.isMobile){
    // Regression: More must reveal the drawer, not just its dark backdrop.
    await page.locator('#moreMenuBtn').click();
    assert.equal(await page.locator('#sidebar').evaluate(el=>getComputedStyle(el).display),'flex','More drawer must be rendered');
    await page.waitForFunction(()=>{
      const el=document.querySelector('#sidebar'),r=el.getBoundingClientRect(),style=getComputedStyle(el);
      return el.classList.contains('open')&&style.display!=='none'&&style.visibility==='visible'&&r.right>0&&r.width>0;
    },null,{timeout:3000}).catch(async error=>{
      console.error('More drawer diagnostics:',await page.locator('#sidebar').evaluate(el=>{
        const r=el.getBoundingClientRect(),s=getComputedStyle(el);
        return {class:el.className,display:s.display,visibility:s.visibility,transform:s.transform,rect:r.toJSON(),inert:el.inert};
      }));
      throw error;
    });
    assert.equal(await page.locator('#sidebar').isVisible(),true,'More drawer must actually appear');
    assert.equal(await page.locator('#sidebarScrim').isVisible(),true,'backdrop visible behind open menu');
    await page.locator('#sidebarClose').click();
    assert.equal(await page.locator('#sidebarScrim').isVisible(),false,'backdrop must disappear after closing More');
   }

   await page.locator('#cloudInventoryButton').evaluate(el=>el.click());
   assert.match(await page.locator('#cloudInventoryStatus').textContent(),/0 of 4 original sections loaded read-only/,device.label+' unsigned inventory');
   assert.match(await page.locator('#cloudInventoryStatus').textContent(),/Replacement status: BLOCKED/,device.label+' release safeguard');
   assert.match(await page.locator('#cloudScheduleComparisonStatus').textContent(),/No cloud-to-device comparison completed/,device.label+' no unverified comparison');
   assert.equal(await page.locator('#cloudSessionPreviewButton').isDisabled(),true,device.label+' requires verified original history');
   assert.equal(await page.locator('#cloudBatchPreviewButton').isDisabled(),true,device.label+' all-workout review requires verified account history');
   assert.equal(await page.locator('#cloudFreshCheckpointButton').isDisabled(),true,device.label+' fresh cloud read requires verified sign-in and history');
   assert.equal(await page.locator('#existingCloudSessionsButton').isDisabled(),true,device.label+' deployed 2.0 RPC requires verified account');
   assert.equal(await page.locator('#scheduleBackupCheck').isDisabled(),true,device.label+' backup inspection requires signed-in account');
   assert.equal(await page.locator('#scheduleBackupRestore').isDisabled(),true,device.label+' cloud recovery must remain disabled without verified backup');
   assert.equal(await page.evaluate(()=>typeof window.MLCScheduleBackupQueue.stage),'function');
   assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('mlc2-schedule-backup-pending-v1:guest'))),false);
   assert.match(await page.locator('#scheduleBackupStatus').textContent(),/Sign in to check your custom workout backup/);
   assert.equal(await page.locator('#betaMode').isEnabled(),true,device.label+' beta preview should not require Supabase enrollment');
   await page.locator('.sidebar [data-page="settings"]').first().evaluate(el=>el.click());
   await page.locator('#betaMode').selectOption('pro');
   assert.match(await page.locator('#coachEntitlementStatus').textContent(),/Pro beta preview active/);
   await page.reload({waitUntil:'load'});
   assert.equal(await page.locator('#betaMode').inputValue(),'pro',device.label+' Pro preview persists');
   await page.locator('.sidebar [data-page="settings"]').first().evaluate(el=>el.click());
   await page.locator('#betaMode').selectOption('free');
   assert.match(await page.locator('#coachEntitlementStatus').textContent(),/Free beta preview active/);
      assert.equal(await page.evaluate(()=>window.MLCExistingScheduleBackup.ENABLED),true,device.label+' custom-plan transport enabled for authenticated writes');
   assert.equal(await page.evaluate(()=>typeof window.MLCExistingScheduleBackup.createReadOnly),'function');
   assert.equal(await page.locator('#manualCloudTestButton').isDisabled(),true,device.label+' manual cloud upload requires verified account and a completed local workout');
   assert.equal(await page.locator('#manualCloudVerifyButton').isDisabled(),true,device.label+' test readback requires account');
   assert.match(await page.locator('#existingCloudSessionsStatus').textContent(),/Sign in to inspect existing 2.0 cloud sessions/,device.label+' read-only 2.0 inventory status');
   assert.match(await page.locator('#cloudFreshCheckpointStatus').textContent(),/Sign in, load original history/,device.label+' no unverified checkpoint');
   assert.match(await page.locator('#cloudBatchPreviewStatus').textContent(),/Sign in and load original workout history/,device.label+' all-workout review not started');
   assert.match(await page.locator('#cloudSessionPreviewStatus').textContent(),/Sign in, load original workout history/,device.label+' no unverified upload');

   assert.equal(await page.locator('#todayTitle').textContent(),'My Custom Session');
   await page.locator('#todayExercises [data-exercise-open="leg-press"]').evaluate(el=>el.click());
   assert.match(await page.locator('#modalContent h2').textContent(),/Leg Press/);
   await page.locator('#closeModal').evaluate(el=>el.click());
   assert.equal(await page.locator('#todayTitle').textContent(),'My Custom Session');
   assert.equal(await page.locator('#homeLoadOriginalHistory').isDisabled(),true);
   assert.match(await page.locator('#homeOriginalRecentStatus').textContent(),/Sign in/);
   assert.equal(await page.locator('#homeOriginalRecent .recent-item').count(),0);
   const boardToday=await page.locator('#weeklyBoardHome .week-day-card.is-today').textContent();
   assert.match(boardToday,/My Custom Session/);
   await page.locator('.sidebar [data-page="library"]').first().evaluate(el=>el.click());
   assert.equal(await page.locator('#library').isVisible(),true);
   assert.ok(await page.locator('[data-library-detail]').count()>5);
   assert.equal(await page.locator('[data-library-detail]').count(),36); // progressive preview of 344 actual catalog entries
   assert.match(await page.locator('#libraryShownCount').textContent(),/36 of 344 matching/);
   await page.locator('#libraryShowMore').evaluate(el=>el.click());
   assert.equal(await page.locator('[data-library-detail]').count(),72);
   await page.locator('#exerciseSearch').fill('dead bug');
   await page.locator('[data-library-favorite="dead-bug"]').first().evaluate(el=>el.click());
   assert.equal(await page.locator('[data-library-favorite="dead-bug"]').first().getAttribute('aria-pressed'),'true');
   await page.locator('#libraryFavoritesOnly').check();
   assert.equal(await page.locator('[data-library-detail]').count(),1);
   assert.equal(await page.locator('[data-library-detail="dead-bug"]').count(),1);
   await page.locator('#exerciseSearch').fill('dead bug');
   await page.locator('[data-library-detail="dead-bug"]').evaluate(el=>el.click());
   assert.equal(await page.locator('#libraryRecentWrap').isHidden(),false);
   assert.equal(await page.locator('#modalContent [data-library-favorite="dead-bug"]').getAttribute('aria-pressed'),'true');
   await page.locator('#closeModal').evaluate(el=>el.click());
   await page.reload({waitUntil:'load'});
   await page.locator('.sidebar [data-page="library"]').first().evaluate(el=>el.click());
   await page.locator('#exerciseSearch').fill('dead bug'); // progressive grid needs a search after reload
   assert.equal(await page.locator('[data-library-favorite="dead-bug"]').first().getAttribute('aria-pressed'),'true');
   assert.ok(await page.locator('#libraryRecentList [data-library-recent="dead-bug"]').count()>0);
   assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('mlc2-library-prefs-v1:guest')).favorites),['dead-bug']);

   await page.locator('#libraryReset').evaluate(el=>el.click());
   assert.match(await page.locator('#libraryResultCount').textContent(),/344 matching of 344 exercises/);
   assert.equal(await page.evaluate(()=>window.MLCCompleteOriginalCatalogAudit.unique),341);
   assert.match(await page.locator('#libraryVisualCoverage').textContent(),/14 original exercise photos/);
   assert.match(await page.locator('#libraryVisualCoverage').textContent(),/327 anatomy-only entries/);
   assert.equal(await page.evaluate(()=>window.MLCLibraryVisualRegister.stats(window.MLCCompleteOriginalExercises).total),341);
   assert.equal(await page.evaluate(()=>window.MLCLibraryVisualRegister.stats(window.MLCCompleteOriginalExercises).photoNeeded),327);

   for(const name of ['Landmine Squat','Wide-Grip Lat Pulldown','Medicine Ball Slams','EZ-Bar Curl']){
    await page.locator('#exerciseSearch').fill(name);
    assert.ok(await page.locator('#libraryGrid h3').filter({hasText:name}).count()>0,name+' missing');
   }
   await page.locator('#libraryReset').evaluate(el=>el.click());
   assert.ok(await page.locator('#libraryEquipment option').count()>2);
   await page.locator('#libraryPhotosOnly').check();
   assert.equal(await page.locator('[data-library-detail]').count(),14);
   assert.match(await page.locator('#libraryResultCount').textContent(),/14 matching of 344 exercises/);
   await page.locator('#libraryPhotosOnly').uncheck();
   await page.locator('#exerciseSearch').fill('machine chest press');
   assert.ok(await page.locator('[data-library-detail]').count()>=1);
   assert.ok(await page.locator('[data-library-detail="machine-chest-press"]').count()>0);
   await page.locator('#libraryReset').evaluate(el=>el.click());
   assert.equal(await page.locator('[data-library-detail]').count(),36);
   await page.locator('#libraryEquipment').selectOption({index:1});
   assert.ok(await page.locator('[data-library-detail]').count()>0);
   assert.ok(await page.locator('[data-library-detail]').count()<344);
   await page.locator('#libraryReset').evaluate(el=>el.click());
   await page.locator('#libraryVisualStatus').selectOption('missing');
   // Full 344-entry catalog = 327 original anatomy-only entries + 3 starter entries.
   assert.match(await page.locator('#libraryResultCount').textContent(),/330 matching/);
   assert.equal(await page.locator('[data-library-detail]').count(),36);
   await page.locator('#libraryAnatomyStatus').selectOption('unresolved');
   assert.ok(await page.locator('[data-library-detail]').count()<=36);
   await page.locator('#libraryReset').evaluate(el=>el.click());
   const photoSources=await page.evaluate(()=>window.MLCOriginalExercises.filter(ex=>ex.image).map(ex=>ex.image));
   assert.equal(photoSources.length,14);
   for(const asset of [...photoSources,'images/myliftcoach-anatomy-realistic.webp','images/myliftcoach-anatomy-body-mask.png']){
    const response=await page.request.get('http://127.0.0.1:8765/'+asset);
    assert.equal(response.status(),200,device.label+' original asset missing: '+asset);
    assert.match(response.headers()['content-type']||'',/image\//,asset+' is not served as an image');
   }
   await page.locator('#exerciseSearch').fill('dead bug'); // progressive grid needs a search after filters reset
   await page.locator('[data-library-detail="dead-bug"]').evaluate(el=>el.click());
   assert.match(await page.locator('#modalContent').textContent(),/No original exercise photograph supplied/);
   assert.equal(await page.locator('#modalContent img').count(),0);
   assert.ok(await page.locator('#modalContent .liftova-anatomy svg').count()>0);
   assert.ok(await page.locator('[data-library-related]').count()>0);
   await page.locator('[data-library-related]').first().evaluate(el=>el.click());
   assert.notEqual(await page.locator('#modalContent h2').textContent(),'Dead Bug');
   await page.locator('#closeModal').evaluate(el=>el.click());
   await page.locator('#exerciseSearch').fill('machine chest press');
   await page.locator('[data-library-detail="machine-chest-press"]').evaluate(el=>el.click());
   assert.match(await page.locator('#modalContent h2').textContent(),/Machine Chest Press/);
   assert.match(await page.locator('#modalContent .visual-muscle-key').textContent(),/Primary: Chest/);
   assert.match(await page.locator('#modalContent .visual-muscle-key').textContent(),/Supporting:/);
   assert.match(await page.locator('#modalContent .visual-review-note').textContent(),/review pending/);

   assert.ok(await page.locator('#modalContent .liftova-anatomy svg').count()>0);
   assert.match(await page.locator('#modalContent').textContent(),/Technique tips/);
   assert.match(await page.locator('#modalContent').textContent(),/Moving demonstrations are not yet available/);
   assert.ok(await page.locator('#modalContent .liftova-anatomy image[href="../images/myliftcoach-anatomy-realistic.webp"]').count()>0);
   assert.ok(await page.locator('#modalContent .liftova-anatomy image[href="../images/myliftcoach-anatomy-body-mask.png"]').count()>0);
   await page.locator('#closeModal').evaluate(el=>el.click());
   await page.locator('#exerciseSearch').fill('dead bug'); // return from machine-only filtered results
   await page.locator('[data-library-detail="dead-bug"]').evaluate(el=>el.click());
   await page.locator('[data-library-stage="dead-bug"]').evaluate(el=>el.click());
   assert.equal(await page.locator('#workouts').isVisible(),true);
   assert.equal(await page.locator('#weekExerciseOptions input[value="dead-bug"]').isChecked(),true);
   assert.equal(await page.locator('#todayTitle').textContent(),'My Custom Session');
   // The checkbox is a proposed edit only. Leaving without saving must not alter the plan.
   await page.locator('.sidebar [data-page="home"]').first().evaluate(el=>el.click());
   assert.doesNotMatch(await page.locator('#todayExercises').textContent(),/Dead Bug/);
   const effectiveMarble=await page.evaluate(()=>[getComputedStyle(document.body).backgroundImage,getComputedStyle(document.body,'::before').backgroundImage].join(' '));
   assert.match(effectiveMarble,/approved-vertical-marble-sharp\.webp/);
   const palette=await page.evaluate(()=>{
    const root=getComputedStyle(document.documentElement);
    return {bg:root.getPropertyValue('--bg').trim(),gold:root.getPropertyValue('--gold').trim(),body:getComputedStyle(document.body).backgroundImage};
   });
   assert.ok(palette.bg,'theme background variable remains available');
   assert.ok(palette.gold,'metallic gold theme variable remains available');
   assert.match(effectiveMarble,/approved-vertical-marble-sharp\.webp/);
   await page.locator('#heroStart').evaluate(el=>el.click());
   assert.match(await page.locator('#modalContent h2').textContent(),/My Custom Session/);
   assert.ok(await page.locator('[data-exercise-card="leg-press"] .liftova-anatomy svg').count()>0);
   assert.equal(await page.locator('[data-use-last]').count(),0);
   assert.equal(await page.locator('[data-session-readiness="Normal"]').getAttribute('aria-pressed'),'true');
   await page.locator('[data-session-readiness="Tired"]').evaluate(el=>el.click());
   assert.equal(await page.locator('[data-session-readiness="Tired"]').getAttribute('aria-pressed'),'true');
   assert.match(await page.locator('#sessionSetProgressText').textContent(),/Ready to start/);
   assert.match(await page.locator('[data-warmups="leg-press"]').textContent(),/Optional warm-ups/);
   assert.equal(await page.locator('[data-use-coach]').count(),0);
   await page.locator('[data-addset="leg-press"]').evaluate(el=>el.click());
   assert.match(await page.locator('#sessionSetProgressText').textContent(),/1 of/);
   await page.locator('[data-edit-weight="0"]').fill('175');
   await page.locator('[data-edit-reps="0"]').fill('9');
   await page.locator('[data-save-logged-set="0"]').evaluate(el=>el.click());
   assert.equal(await page.locator('[data-edit-weight="0"]').inputValue(),'175');
   assert.equal(await page.locator('[data-edit-reps="0"]').inputValue(),'9');
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
   const draftRaw=await page.evaluate(()=>localStorage.getItem('mlc2-unfinished-session-v1:guest'));
   assert.ok(draftRaw&&JSON.parse(draftRaw).sets.length===1,'Unfinished workout did not persist');
   assert.equal(JSON.parse(draftRaw).sets[0].weight,175);
   assert.equal(JSON.parse(draftRaw).sets[0].reps,9);
   await page.reload({waitUntil:'load'});
   await page.locator('#heroStart').evaluate(el=>el.click());
   assert.match(await page.locator('[data-count="leg-press"]').textContent(),/1 logged/);
   assert.equal(await page.locator('[data-exercise-card="leg-extension"]').count(),1);
   assert.equal(await page.locator('[data-session-readiness="Tired"]').getAttribute('aria-pressed'),'true');
   page.once('dialog',dialog=>dialog.accept());
   await page.locator('#discardWorkout').evaluate(el=>el.click());
   assert.equal(await page.evaluate(()=>localStorage.getItem('mlc2-unfinished-session-v1:guest')),null);

   // Editing the exact scheduled plan must update Home, modal and persisted copy.
   const today=(new Date().getDay()+6)%7;
   await page.locator('#weeklyBoardHome [data-week-day="'+today+'"]').evaluate(el=>el.click());
   // Unsaved workout edits cannot vanish silently when navigating between days.
   await page.locator('#weekWorkoutName').fill('Unsaved session name');
   const other=(today+1)%7;
   page.once('dialog',dialog=>dialog.dismiss());
   await page.locator('#weeklyBoardWorkouts [data-week-day="'+other+'"]').evaluate(el=>el.click());
   assert.equal(await page.locator('#weekWorkoutName').inputValue(),'Unsaved session name');
   page.once('dialog',dialog=>dialog.accept());
   await page.locator('#weeklyBoardWorkouts [data-week-day="'+today+'"]').evaluate(el=>el.click());
   assert.equal(await page.locator('#weekWorkoutName').inputValue(),'My Custom Session');
   // The same complete library drives the workout editor; search cannot lose checked draft selections.
   assert.equal(await page.locator('#weekExerciseOptions input').count(),344);
   assert.ok(await page.locator('#weekExerciseMuscle option').count()>5);
   assert.ok(await page.locator('#weekExerciseEquipment option').count()>2);
   await page.locator('#weekExerciseSearch').fill('dead bug');
   assert.equal(await page.locator('#weekExerciseOptions .week-exercise:visible').count(),1);
   await page.locator('#weekExerciseOptions input[value="dead-bug"]').check();
   assert.match(await page.locator('#weekExerciseCount').textContent(),/3 selected/);
   await page.locator('#weekExerciseEquipment').selectOption({index:1});
   assert.equal(await page.locator('#weekExerciseOptions input[value="dead-bug"]').isChecked(),true);
   await page.locator('#weekExerciseReset').evaluate(el=>el.click());
   await page.locator('#weekExerciseOptions [data-week-library-detail="dead-bug"]').evaluate(el=>el.click());
   assert.match(await page.locator('#modalContent h2').textContent(),/Dead Bug/);
   await page.locator('[data-library-stage="dead-bug"]').evaluate(el=>el.click());
   assert.equal(await page.locator('#weekExerciseOptions input[value="dead-bug"]').isChecked(),true);
   assert.doesNotMatch(await page.locator('#todayExercises').textContent(),/Dead Bug/);
   await page.locator('#weekWorkoutName').fill('Updated Custom Session');
   await page.locator('#weekSaveButton').evaluate(el=>el.click());
   assert.equal(await page.locator('#todayTitle').textContent(),'Updated Custom Session');
   assert.match(await page.locator('#todayExercises').textContent(),/Dead Bug/);
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
   // New 2.0 logs are functional but isolated from the original account records.
   assert.match(await page.locator('#localTrackingStatus').textContent(),/guest/);
   await page.locator('#localWaterAmount').fill('8');
   await page.locator('#localWaterForm button[type="submit"]').evaluate(el=>el.click());
   assert.match(await page.locator('#localWaterTotal').textContent(),/8\.0 oz/);
   await page.locator('#localFoodName').fill('Test meal');
   await page.locator('#localFoodCalories').fill('375');
   await page.locator('#localFoodForm button[type="submit"]').evaluate(el=>el.click());
   assert.equal(await page.locator('#localCaloriesTotal').textContent(),'375');
   await page.locator('#localWeightValue').fill('182.5');
   await page.locator('#localWeightForm button[type="submit"]').evaluate(el=>el.click());
   assert.equal(await page.locator('#localWeightLatest').textContent(),'182.5 lb');
   const localGuest=await page.evaluate(()=>JSON.parse(localStorage.getItem('mlc2-daily-tracking-v1:guest')));
   assert.equal(localGuest.water[0].amount,237);
   assert.equal(localGuest.food[0].calories,375);
   assert.equal(localGuest.weight[0].value,182.5);
   await page.reload({waitUntil:'load'});
   await page.locator('.sidebar [data-page="nutrition"]').first().evaluate(el=>el.click());
   assert.equal(await page.locator('#localCaloriesTotal').textContent(),'375');
   assert.equal(await page.locator('#localWeightLatest').textContent(),'182.5 lb');
   assert.match(await page.locator('#localMacroTotals').textContent(),/not recorded/);
   await page.locator('#quickWaterButton').evaluate(el=>el.click());
   assert.match(await page.locator('#localWaterTotal').textContent(),/16\.0 oz/);
   assert.equal(await page.locator('#trackingMonth').isDisabled(),true);

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
   // Finish a practice workout, remove a mistaken set, and inspect original-style summary.
   await page.locator('#heroStart').evaluate(el=>el.click());
   await page.locator('[data-addset="leg-press"]').evaluate(el=>el.click());
   await page.locator('[data-addset="leg-press"]').evaluate(el=>el.click());
   assert.equal(await page.locator('[data-save-logged-set]').count(),2);
   await page.locator('[data-delete-logged-set="0"]').evaluate(el=>el.click());
   assert.equal(await page.locator('[data-save-logged-set]').count(),1);
   await page.locator('#finishWorkout').evaluate(el=>el.click());
   assert.equal(await page.locator('#sessionHistory details').count(),1);
   const sessionText=await page.locator('#sessionHistory details').first().textContent();
   assert.match(sessionText,/Updated Custom Session/);
   assert.match(sessionText,/1 sets/);
   assert.match(sessionText,/Local practice record/);
   assert.ok(await page.locator('#sessionHistory [data-exercise-open="leg-press"]').count()>0);
   await page.locator('#sessionHistory [data-exercise-open="leg-press"]').evaluate(el=>el.click());
   assert.match(await page.locator('#modalContent h2').textContent(),/Leg Press/);
   await page.locator('#closeModal').evaluate(el=>el.click());
   assert.equal(await page.evaluate(()=>localStorage.getItem('mlc2-unfinished-session-v1:guest')),null);
   await page.reload({waitUntil:'load'});
   assert.equal(await page.locator('#sessionHistory details').count(),1);
   await page.locator('.sidebar [data-page="coaching"]').first().evaluate(el=>el.click());
   assert.equal(await page.locator('#coachWeekWorkouts').textContent(),'1');
   assert.equal(await page.locator('#coachWeekDays').textContent(),'1');
   assert.equal(await page.locator('#coachWeekSets').textContent(),'1');
   assert.match(await page.locator('#coachLocalMuscleStatus').textContent(),/Time since training|Latest completed local workout/);
   assert.ok(await page.locator('#coachLocalMuscleList .recent-item').count()>0);
   assert.match(await page.locator('#coachWeekVolume').textContent(),/lb-reps/);
   assert.equal(await page.locator('#coachAskSubmit').isVisible(),false);
   assert.match(await page.locator('#basicCoachExercises').textContent(),/Leg Press.*Last logged/);
   assert.equal(await page.locator('#basicCoachTitle').textContent(),await page.locator('#todayTitle').textContent());
   await page.locator('#basicCoachStart').evaluate(el=>el.click());
   assert.match(await page.locator('#modalContent h2').textContent(),/Updated Custom Session/);
   await page.locator('#cancelWorkout').evaluate(el=>el.click());
   await page.locator('#heroStart').evaluate(el=>el.click());
   assert.match(await page.locator('[data-exercise-card="leg-press"]').textContent(),/Last local practice:/);
   await page.locator('[data-addset="leg-press"]').evaluate(el=>el.click());
   assert.match(await page.locator('[data-exercise-card="leg-press"]').textContent(),/Matched previous|Improved from previous|Below previous/);
   page.once('dialog',dialog=>dialog.accept());
   await page.locator('#discardWorkout').evaluate(el=>el.click());
   console.log('PASS '+device.label+': workout completion and Coach local weekly activity/previous-set feedback');
   // Corrupt completed-session history must remain untouched, visibly warn,
   // and disable the destructive clear action on both desktop and mobile.
   await page.evaluate(()=>localStorage.setItem('mlc2-demo-workouts-v1','{"corrupt":true}'));
   await page.reload({waitUntil:'load'});
   assert.match(await page.locator('#localHistoryIntegrityStatus').textContent(),/could not be read safely/i,device.label+' corrupt-history warning');
   assert.equal(await page.locator('#clearDemo').isDisabled(),true,device.label+' corrupt-history erase blocked');
   assert.equal(await page.evaluate(()=>localStorage.getItem('mlc2-demo-workouts-v1')),'{"corrupt":true}',device.label+' corrupt history preserved');
   await context.close();
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
