const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const base='http://127.0.0.1:8765/myliftcoach2/';
 const owner='11111111-1111-4111-8111-111111111111';
 const user={id:owner,email:'phone-test@example.com'};
 let row=null,writes=0,reads=0;
 function sessionInit(){
  const expires_at=Math.floor(Date.now()/1000)+3600;
  return {access_token:'local-test-token',refresh_token:'local-refresh-token',
   user:{id:'11111111-1111-4111-8111-111111111111',email:'phone-test@example.com'},expires_at};
 }
 const route=async request=>{
  const url=request.request().url();
  if(url.endsWith('/auth/v1/user')){
   return request.fulfill({status:200,contentType:'application/json',body:JSON.stringify(user)});
  }
  if(url.endsWith('/rest/v1/rpc/mlc2_v1_read')){
   const args=request.request().postDataJSON();
   assert.deepEqual(args,{p_type:'custom-plan',p_record_id:'mlc2-recurring-schedule-v1'});
   reads++;
   return request.fulfill({status:200,contentType:'application/json',body:JSON.stringify(row)});
  }
  if(url.endsWith('/rest/v1/rpc/mlc2_v1_commit')){
   const args=request.request().postDataJSON();
   assert.equal(args.p_type,'custom-plan');
   assert.equal(args.p_record_id,'mlc2-recurring-schedule-v1');
   assert.equal(args.p_deleted,false);
   assert.equal(request.request().headers()['authorization'],'Bearer local-test-token');
   if(args.p_base_revision!==(row?.revision||0))
    return request.fulfill({status:409,contentType:'application/json',body:'{}'});
   writes++;
   row={owner,type:'custom-plan',id:'mlc2-recurring-schedule-v1',
    revision:(row?.revision||0)+1,deleted:false,payload:args.p_payload};
   return request.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({owner,opId:args.p_op_id,revision:row.revision,replayed:false})});
  }
  return request.abort();
 };
 async function phone(){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.route('https://kirlpjflaoriiusfamsk.supabase.co/**',route);
  const session=sessionInit();
  await page.addInitScript(x=>sessionStorage.setItem('mlc2-auth-session-v1',JSON.stringify(x)),session);
  await page.goto(base,{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#accountIdentity')?.textContent?.includes('phone-test@example.com'),{timeout:15000});
  return {context,page,errors};
 }
 try{
  const first=await phone(),page=first.page;
  await page.locator('[data-workout-action="create"]').evaluate(el=>el.click());
  await page.locator('#weekWorkoutName').fill('Phone Backed Up Session');
  await page.locator('#weekSaveButton').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector('#scheduleBackupPendingStatus')?.textContent?.includes('saved and verified in Supabase'),{timeout:15000});
  assert.equal(writes,1,'first save uploads precisely once');
  assert.equal(row.revision,1);
  assert.equal(row.payload.document.plans.some(p=>p.title==='Phone Backed Up Session'),true);
  assert.equal(await page.evaluate(()=>window.MLCScheduleBackupQueue.read(localStorage,'11111111-1111-4111-8111-111111111111',
   window.MLCV2ExerciseCatalog.merge(window.MLCCompleteOriginalExercises,[]).map(x=>x.id))),null);
  await page.locator('#weekWorkoutName').fill('Phone Edited Again');
  await page.locator('#weekSaveButton').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector('#scheduleBackupPendingStatus')?.textContent?.includes('revision 2'),{timeout:15000});
  assert.equal(writes,2);
  assert.equal(row.revision,2);
  assert.equal(row.payload.document.plans.some(p=>p.title==='Phone Edited Again'),true);
  assert.deepEqual(first.errors,[]);
  const second=await phone(),newPhone=second.page;
  assert.equal(await newPhone.evaluate(()=>localStorage.getItem('mlc2-recurring-preview-v1:11111111-1111-4111-8111-111111111111')),null);
  await newPhone.locator('#scheduleBackupCheck').evaluate(el=>el.click());
  await newPhone.waitForFunction(()=>document.querySelector('#scheduleBackupStatus')?.textContent?.includes('Verified backup:'),{timeout:15000});
  assert.equal(await newPhone.locator('#scheduleBackupRestore').isDisabled(),false);
  newPhone.once('dialog',dialog=>dialog.accept());
  await newPhone.locator('#scheduleBackupRestore').evaluate(el=>el.click());
  await newPhone.waitForFunction(()=>document.querySelector('#scheduleBackupRestoreStatus')?.textContent?.includes('restored and cloud revision verified'),{timeout:15000});
  assert.equal(await newPhone.locator('#todayTitle').textContent(),'Phone Edited Again');
  assert.equal(writes,2,'restoration must never upload or overwrite cloud records');
  await newPhone.locator('[data-workout-action="manage"]').evaluate(el=>el.click());
  await newPhone.locator('#weekWorkoutName').fill('Recovered And Edited');
  await newPhone.locator('#weekSaveButton').evaluate(el=>el.click());
  await newPhone.waitForFunction(()=>document.querySelector('#scheduleBackupPendingStatus')?.textContent?.includes('revision 3'),{timeout:15000});
  assert.equal(writes,3);
  assert.equal(row.revision,3);
  assert.equal(row.payload.document.plans.some(p=>p.title==='Recovered And Edited'),true);
  assert.ok(reads>=7);
  assert.deepEqual(second.errors,[]);
  await second.context.close();
  await first.context.close();
  console.log('PASS iPhone-only cloud create/edit/verified readback/new-phone restore/re-edit; writes='+writes);
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1});
