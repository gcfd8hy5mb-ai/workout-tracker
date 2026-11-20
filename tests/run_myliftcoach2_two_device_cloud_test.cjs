const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const owner='11111111-1111-4111-8111-111111111111';
 const cloud=new Map(),writes=[];
 const makeContext=async(withWorkout)=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.addInitScript(({owner,withWorkout})=>{
   const auth={access_token:'test-user-token',refresh_token:'mock-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:owner,email:'test@example.invalid'}};
   sessionStorage.setItem('mlc2-auth-session-v1',JSON.stringify(auth));
   if(withWorkout){
    const workout={id:'demo-local-1',created:'2026-11-19T12:00:00Z',title:'Test Leg Press',planId:'custom-a',
     readiness:'Normal',startedAt:1795089600000,sets:[{exerciseId:'leg-press',weight:55,reps:10}]};
    localStorage.setItem('mlc2-demo-workouts-v1:'+owner,JSON.stringify([workout]));
   }
  },{owner,withWorkout});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://kirlpjflaoriiusfamsk.supabase.co/**',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.pathname==='/auth/v1/user')return route.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({id:owner,email:'test@example.invalid'})});
   if(url.pathname.startsWith('/rest/v1/rpc/')){
    const name=url.pathname.split('/').at(-1),body=req.postDataJSON();
    if(name==='mlc2_v1_read')return route.fulfill({status:200,contentType:'application/json',
     body:JSON.stringify(cloud.get(body.p_record_id)||null)});
    if(name==='mlc2_v1_commit'){
     assert.equal(body.p_deleted,false);
     assert.equal(body.p_type,'session');
     assert.equal(body.p_base_revision,0);
     assert.equal(cloud.has(body.p_record_id),false);
     writes.push(body);
     cloud.set(body.p_record_id,{owner,type:'session',id:body.p_record_id,revision:1,deleted:false,payload:body.p_payload});
     return route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({owner,opId:body.p_op_id,revision:1,replayed:false})});
    }
    if(name==='mlc2_v1_list_sessions')return route.fulfill({status:200,contentType:'application/json',
     body:JSON.stringify([...cloud.values()].filter(x=>x.id>body.p_after_id).sort((a,b)=>a.id.localeCompare(b.id)).slice(0,body.p_limit))});
   }
   return route.abort();
  });
  await page.goto('http://127.0.0.1:8765/myliftcoach2/',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#manualCloudVerifyButton')?.disabled===false,{timeout:15000});
  assert.deepEqual(errors,[]);
  return {context,page,errors};
 };
 try{
  const phone=await makeContext(true),laptop=await makeContext(false);
  assert.equal(await phone.page.locator('#manualCloudTestButton').isDisabled(),false);
  assert.equal(await laptop.page.locator('#manualCloudTestButton').isDisabled(),true);
  phone.page.once('dialog',d=>d.accept());
  await phone.page.locator('#manualCloudTestButton').evaluate(el=>el.click());
  await phone.page.waitForFunction(()=>document.querySelector('#manualCloudTestStatus')?.textContent.includes('Verified cloud test record:'),{timeout:15000});
  assert.equal(writes.length,1);
  const uploadedId=(await phone.page.locator('#manualCloudVerifyId').inputValue());
  assert.match(uploadedId,/^mlc2-test-/);
  await laptop.page.locator('#existingCloudSessionsButton').evaluate(el=>el.click());
  await laptop.page.waitForFunction(()=>document.querySelector('#manualCloudVerifyId')?.value.startsWith('mlc2-test-'),{timeout:15000});
  assert.equal(await laptop.page.locator('#manualCloudVerifyId').inputValue(),uploadedId);
  await laptop.page.locator('#manualCloudVerifyButton').evaluate(el=>el.click());
  await laptop.page.waitForFunction(()=>document.querySelector('#manualCloudVerifyStatus')?.textContent.includes('Verified on this device:'),{timeout:15000});
  assert.match(await laptop.page.locator('#manualCloudVerifyStatus').textContent(),/55 lb × 10 reps/);
  assert.equal(writes.length,1,'readback must not create a second upload');
  assert.deepEqual(phone.errors,[]);assert.deepEqual(laptop.errors,[]);
  console.log('PASS: iPhone-sized upload verified, laptop cloud discovery + exact sets readback; 1 isolated test commit');
  await phone.context.close();await laptop.context.close();
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
