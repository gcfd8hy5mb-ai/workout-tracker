// Presentation smoke against the branch's static build. Account transport and
// authentication are covered by their dedicated suites; this is a guest UI fixture.
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{const filename=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';const target=path.resolve(root,filename);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(target,(error,content)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'}).end(content);});});

async function swipe(page,selector,{fromX,toX,y=260}){
 await page.evaluate(({selector,fromX,toX,y})=>{
   const target=document.querySelector(selector);if(!target)throw new Error(`Missing swipe target ${selector}`);
   const makeTouch=x=>new Touch({identifier:1,target,clientX:x,clientY:y,pageX:x,pageY:y,screenX:x,screenY:y,radiusX:2,radiusY:2,rotationAngle:0,force:.5});
   const start=makeTouch(fromX),end=makeTouch(toX);
   target.dispatchEvent(new TouchEvent('touchstart',{touches:[start],targetTouches:[start],changedTouches:[start],bubbles:true,cancelable:true}));
   target.dispatchEvent(new TouchEvent('touchend',{touches:[],targetTouches:[],changedTouches:[end],bubbles:true,cancelable:true}));
 },{selector,fromX,toX,y});
}

async function assertViewportSafe(page,screenId){
 const report=await page.evaluate(screenId=>{
   const screen=document.getElementById(screenId);const visible=screen&&!screen.classList.contains('hidden');
   const width=window.innerWidth;
   const offenders=[...document.querySelectorAll(`#${screenId} *`)].filter(el=>{
     if(!el.getClientRects().length)return false;
     const style=getComputedStyle(el);if(style.position==='fixed'||style.position==='absolute')return false;
     const r=el.getBoundingClientRect();return r.left<-2||r.right>width+2;
   }).slice(0,8).map(el=>({tag:el.tagName,id:el.id,className:typeof el.className==='string'?el.className:'',rect:el.getBoundingClientRect().toJSON?.()||{left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}}));
   return {visible,innerWidth:width,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,offenders};
 },screenId);
 assert.equal(report.visible,true,`${screenId} must be visible for viewport QA`);
 assert.ok(report.documentWidth<=report.innerWidth+2,`${screenId} must not create horizontal document overflow: ${JSON.stringify(report)}`);
 assert.ok(report.bodyWidth<=report.innerWidth+2,`${screenId} must not create horizontal body overflow: ${JSON.stringify(report)}`);
 assert.deepEqual(report.offenders,[],`${screenId} must keep normal-flow content inside the iPhone viewport`);
}

async function runPass(browser,url,pass){
 const context=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
 const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
   window.__liftovaWrites=[];
   const hook=(proto,prop)=>{
     const descriptor=Object.getOwnPropertyDescriptor(proto,prop);
     if(!descriptor?.set||!descriptor?.get)return;
     Object.defineProperty(proto,prop,{configurable:descriptor.configurable,enumerable:descriptor.enumerable,get:descriptor.get,set(value){
       if(typeof value==='string'&&/\bLIFTOVA\b/i.test(value)){
         window.__liftovaWrites.push({prop,value:value.replace(/\s+/g,' ').slice(0,260),stack:(new Error('LIFTOVA write')).stack});
       }
       return descriptor.set.call(this,value);
     }});
   };
   hook(Element.prototype,'innerHTML');
   hook(Node.prototype,'textContent');
   hook(Node.prototype,'nodeValue');
 });
 const stage=name=>console.log(`[browser-smoke pass ${pass}] ${name}`);
 await page.route('**/persistence/account-ui.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* UI-only guest fixture */'}));
 stage('load app');await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000});
 stage('wait for runtime');await page.waitForFunction(()=>window.LiftovaAnatomy&&typeof window.goHome==='function'&&window.showWorkouts?.__myliftcoachScheduledWorkout===true&&window.MYLIFTCOACHNavigation,{timeout:15000});
 stage('home');await page.evaluate(()=>goHome());await page.locator('#home:not(.hidden)').waitFor();await page.waitForTimeout(500);
 assert.equal(await page.locator('#lv3StartWorkout:visible').count(),0,'legacy Home Start button must not reappear');assert.equal(await page.locator('#home:not(.hidden)').count(),1,'canonical Home must remain visible');
 await assertViewportSafe(page,'home');

 stage('root edge menu gesture');
 assert.deepEqual(await page.evaluate(()=>window.MYLIFTCOACHNavigation.getStack()),[],'Home root must start with an empty native back stack');
 await swipe(page,'#home',{fromX:8,toX:112,y:500});await page.locator('#sideMenu.open').waitFor();
 await swipe(page,'#sideMenu',{fromX:300,toX:178,y:500});await page.waitForFunction(()=>!document.getElementById('sideMenu')?.classList.contains('open'));

 stage('menu/profile and menu-return gesture');
 await page.locator('#home .lh-hero-menu').click();await page.locator('#sideMenu.open').waitFor();
 const profileMenuFound=await page.evaluate(()=>{const controls=[...document.querySelectorAll('#sideMenu button,#sideMenu a,#sideMenu [role="button"]')];const target=controls.find(el=>/\bprofile\b/i.test((el.textContent||'').trim())&&!/close/i.test(el.getAttribute('aria-label')||''));if(target){target.dataset.qaProfileMenu='1';return true}return false});
 assert.equal(profileMenuFound,true,'side menu must expose Profile');await page.locator('[data-qa-profile-menu="1"]').click();await page.locator('#profileScreen:not(.hidden)').waitFor();await assertViewportSafe(page,'profileScreen');
 assert.deepEqual(await page.evaluate(()=>window.MYLIFTCOACHNavigation.getStack()),[],'menu root navigation must not create a stale native back target');
 await swipe(page,'#profileScreen',{fromX:8,toX:112,y:500});await page.locator('#sideMenu.open').waitFor();
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.getElementById('sideMenu')?.classList.contains('open'));
 assert.equal(await page.locator('#profileScreen:not(.hidden)').count(),1,'Escape must close the drawer before navigating away');

 stage('bottom-nav root back-stack isolation');
 await page.evaluate(()=>goHome());
 const workoutTabFound=await page.evaluate(()=>{const controls=[...document.querySelectorAll('.prism-bottom-nav button')];const target=controls.find(el=>/workout|training/i.test((el.textContent||'').trim())||/showWorkouts/i.test(el.getAttribute('onclick')||''));if(target){target.dataset.qaWorkoutTab='1';return true}return false});
 assert.equal(workoutTabFound,true,'bottom navigation must expose the workout/training tab');await page.locator('[data-qa-workout-tab="1"]').click();await page.locator('#workoutDetailScreen:not(.hidden)').waitFor();
 assert.deepEqual(await page.evaluate(()=>window.MYLIFTCOACHNavigation.getStack()),[],'bottom-nav Workouts must behave like a tab root even when its canonical screen id is workoutDetailScreen');
 await assertViewportSafe(page,'workoutDetailScreen');

 stage('workout details');await page.locator('#workoutDetailScreen:not(.hidden) .lv3-exercise-row').first().waitFor();const scheduledCount=await page.evaluate(()=>{const week=window.myliftcoachWeeklySchedule?.();const index=(new Date().getDay()+6)%7;return week?.[index]?.ids?.length||0});assert.ok(scheduledCount>0,'current weekday must resolve a scheduled workout in the smoke fixture');assert.equal(await page.locator('.lv3-exercise-row').count(),scheduledCount,'workout detail must render the current day exercise list');assert.equal(await page.locator('.lv3-exercise-row .liftova-anatomy').count(),scheduledCount,'every current-day workout row must show anatomy');
 stage('exercise info + native swipe back');await page.locator('.lv3-exercise-row').first().click();await page.locator('#exerciseInfoScreen:not(.hidden) .liftova-anatomy').first().waitFor();assert.deepEqual(await page.evaluate(()=>window.MYLIFTCOACHNavigation.getStack()),['workoutDetailScreen'],'exercise guide must push only its workout parent');
 await swipe(page,'#exerciseInfoScreen',{fromX:8,toX:116,y:500});
 await page.locator('#workoutDetailScreen:not(.hidden)').waitFor();assert.deepEqual(await page.evaluate(()=>window.MYLIFTCOACHNavigation.getStack()),[],'native swipe-back must consume the workout detail entry');

 stage('exercise info menu');await page.locator('.lv3-exercise-row').first().click();await page.locator('#exerciseInfoScreen:not(.hidden) .liftova-anatomy').first().waitFor();await page.locator('#prismExerciseInfo [data-ex-more]').click();await page.locator('#sideMenu.open').waitFor();await page.locator('#sideMenu .menu-close').click();
 stage('library');await page.evaluate(()=>showLibrary());await page.locator('#libraryScreen:not(.hidden) .library-item').first().waitFor();assert.ok(await page.locator('#libraryList .library-item').count()>100,'full Exercise Library must render');assert.equal(await page.locator('#libraryList .liftova-anatomy').count(),await page.locator('#libraryList .library-item').count(),'every library row must show anatomy');await assertViewportSafe(page,'libraryScreen');
 stage('add to custom workout');await page.locator('#libraryList .library-item button').first().click();await page.locator('#exerciseInfoScreen:not(.hidden) .liftova-anatomy').first().waitFor();const selectedName=await page.locator('#prismExerciseInfo h2').textContent();await page.locator('#prismExerciseInfo .lv3-add-workout').click();await page.locator('#builderScreen:not(.hidden)').waitFor();const builderText=(await page.locator('#builderExercises').innerText()).toLowerCase();const selectedTokens=selectedName.toLowerCase().replace(/[()]/g,' ').split(/\s+/).filter(Boolean);assert.ok(selectedTokens.every(token=>builderText.includes(token)),'Add to Workout must preselect the same exercise even when its canonical display alias reorders “Machine”');
 stage('iPhone form safety');const formReport=await page.evaluate(()=>[...document.querySelectorAll('#builderScreen input,#builderScreen select,#builderScreen textarea')].filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{id:el.id||'',fontSize:parseFloat(s.fontSize),left:r.left,right:r.right,width:innerWidth}}));assert.ok(formReport.length>0,'builder must expose at least one editable control');for(const field of formReport){assert.ok(field.fontSize>=16,`iPhone inputs must stay at 16px+ to prevent Safari zoom: ${JSON.stringify(field)}`);assert.ok(field.left>=-1&&field.right<=field.width+1,`form control must stay inside viewport: ${JSON.stringify(field)}`)}await assertViewportSafe(page,'builderScreen');

 stage('progress gating + swipe');await page.evaluate(()=>showOverallProgress());
 const week=page.locator('#overallProgressScreen [data-period="week"]'),month=page.locator('#overallProgressScreen [data-period="month"]');
 await week.click();assert.equal(await week.getAttribute('aria-pressed'),'true','Week must be the active Free period');assert.equal(await week.getAttribute('aria-selected'),'true','presentation selection must mirror the real Week period');
 await month.click();await page.locator('#prismProOverlay:not(.hidden)').waitFor();assert.equal(await week.getAttribute('aria-pressed'),'true','gated Month must not change the real period');assert.equal(await week.getAttribute('aria-selected'),'true','gated Month must not visually replace Week');assert.equal(await month.getAttribute('aria-pressed'),'false','gated Month stays inactive');assert.equal(await month.getAttribute('aria-selected'),'false','presentation state must stay inactive for gated Month');
 await page.keyboard.press('Escape');await page.locator('#prismProOverlay').waitFor({state:'hidden'});
 await swipe(page,'#overallProgressScreen',{fromX:330,toX:220,y:700});assert.equal(await page.locator('#prismProOverlay:not(.hidden)').count(),0,'Free Progress swipe must not accidentally open the Pro paywall');assert.equal(await week.getAttribute('aria-pressed'),'true','Free Progress swipe stays on the accessible Week period');
 await assertViewportSafe(page,'overallProgressScreen');

 stage('screen routing');for(const [screen,action] of [['home','goHome()'],['workoutDetailScreen','showWorkouts()'],['globalHistoryScreen','showGlobalHistory()'],['overallProgressScreen','showOverallProgress()'],['profileScreen','showProfile()']]){await page.evaluate(action);await page.locator(`#${screen}:not(.hidden)`).waitFor();await assertViewportSafe(page,screen);}
 stage('anatomy asset');const asset=await page.evaluate(async()=>{const response=await fetch('images/myliftcoach-anatomy-realistic.webp');return [response.status,response.headers.get('content-type'),(await response.blob()).size]});assert.equal(asset[0],200);assert.match(asset[1],/webp/);assert.ok(asset[2]>100000);assert.equal(await page.locator('svg image[href="images/myliftcoach-anatomy-realistic.webp"]').count()>0,true);
 stage('branding/errors');const retired=await page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.getClientRects().length&&/\b(?:PRISM|LIFTOVA)\b/i.test(e.innerText||'')).map(e=>({tag:e.tagName,id:e.id||'',className:typeof e.className==='string'?e.className:'',text:(e.innerText||'').replace(/\s+/g,' ').trim().slice(0,220)})).filter((item,index,all)=>!all.some((other,j)=>j!==index&&item.text===other.text&&item.id===other.id)).slice(-20));if(retired.length){console.log('[retired-brand-visible]',JSON.stringify(retired,null,2));const writes=await page.evaluate(()=>window.__liftovaWrites||[]);console.log('[liftova-write-traces]',JSON.stringify(writes.slice(-30),null,2));}assert.deepEqual(retired,[],'no visible retired PRISM/LIFTOVA branding');assert.deepEqual(errors,[],'no uncaught page errors');await context.close();console.log(`MYLIFTCOACH browser smoke pass ${pass}: startup, iPhone viewport, gestures, canonical navigation, gated progress, details, library, atlas and branding PASS`);
}
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}/`;const browser=await chromium.launch({headless:true,args:['--no-sandbox']});try{for(let pass=1;pass<=2;pass++)await runPass(browser,url,pass)}finally{await browser.close();server.close()}})().catch(error=>{server.close();console.error(error);process.exitCode=1});