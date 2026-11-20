const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const endpoint='https://kirlpjflaoriiusfamsk.supabase.co/**';
 const records=new Map();
 const owners={pro:'mlc-test-pro',free:'mlc-test-free'};
 let commits=0;
 const errors=[];
 const workout={id:'demo-sync-check',title:'History sync test',created:new Date().toISOString(),sets:[
  {exerciseId:'leg-press',weight:100,reps:10},{exerciseId:'chest-press',weight:40,reps:10},
  {exerciseId:'seated-row',weight:50,reps:9}
 ]};
 async function device(tier,seed=false){
  const owner=owners[tier],context=await browser.newContext();
  await context.addInitScript(({owner,tier,entry,seed})=>{
   sessionStorage.setItem('mlc2-auth-session-v1',JSON.stringify({access_token:tier,user:{id:owner},expires_at:Date.now()/1000+3600}));
   // A client-side grant must never change the server-verified tier.
   localStorage.setItem('prismEntitlementV1',JSON.stringify({tier:'lifetime_pro'}));
   if(seed)localStorage.setItem('mlc2-demo-workouts-v1:'+owner,JSON.stringify([entry]));
  },{owner,tier,entry:workout,seed});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.route(endpoint,async route=>{
   const request=route.request(),path=new URL(request.url()).pathname;
   const auth=request.headers().authorization;
   const signedTier=auth?.replace('Bearer ','');
   const signedOwner=owners[signedTier];
   if(!signedOwner)return route.fulfill({status:401,json:{}});
   if(path.endsWith('/user'))return route.fulfill({json:{id:signedOwner,email:signedTier+'@example.test',
    app_metadata:signedTier==='pro'?{myliftcoach_entitlement:{tier:'lifetime_pro'}}:{}}});
   const input=request.postDataJSON();
   const key=signedOwner+':'+input.p_record_id;
   if(path.endsWith('/mlc2_v1_list_sessions'))
    return route.fulfill({json:[...records.values()].filter(record=>record.owner===signedOwner)});
   if(path.endsWith('/mlc2_v1_read'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(records.get(key)??null)});
   if(path.endsWith('/mlc2_v1_commit')){
    assert.equal(input.p_type,'session');
    assert.equal(input.p_base_revision,0);
    assert.equal(input.p_deleted,false);
    assert.ok(input.p_record_id.startsWith('mlc2-history-'));
    assert.ok(!records.has(key));
    commits++;
    records.set(key,{owner:signedOwner,type:'session',id:input.p_record_id,revision:1,deleted:false,payload:input.p_payload});
    return route.fulfill({json:{owner:signedOwner,revision:1,replayed:false,opId:input.p_op_id}});
   }
   return route.fulfill({status:404,json:{}});
  });
  await page.goto('http://127.0.0.1:8765/myliftcoach2/');
  await page.waitForFunction(()=>!document.querySelector('#historySyncButton').disabled);
  return page;
 }
 async function runSync(page,expected){
  await page.locator('#historySyncButton').evaluate(button=>button.click());
  await page.waitForFunction(expected=>document.querySelector('#historySyncStatus').textContent.includes(expected),expected);
 }
 try{
  const source=await device('pro',true);
  await source.waitForFunction(()=>document.querySelector('#accountTierStatus').textContent==='Lifetime Pro');
  await runSync(source,'1 backed up · 0 restored');
  await runSync(source,'0 backed up · 0 restored');
  const recovered=await device('pro');
  await recovered.waitForFunction(()=>document.querySelector('#accountTierStatus').textContent==='Lifetime Pro');
  await runSync(recovered,'0 backed up · 1 restored');
  assert.equal(await recovered.locator('#progressSessions').textContent(),'1');
  assert.match(await recovered.locator('#coachBuilderPlan').textContent(),/Coach|Leg Press/);
  assert.ok(await recovered.locator('[data-adaptive-session]').count()>0);
  await recovered.locator('[data-adaptive-session]').first().evaluate(button=>button.click());
  assert.equal(await recovered.locator('#workoutLog').isVisible(),true);
  const free=await device('free');
  await runSync(free,'0 backed up · 0 restored');
  assert.equal(await free.locator('#progressSessions').textContent(),'0');
  assert.equal(await free.locator('#accountTierStatus').textContent(),'Free');
  assert.match(await free.locator('#coachBuilderStatus').textContent(),/requires MYLIFTCOACH Pro/);
  assert.equal(await free.locator('[data-adaptive-session]').count(),0);
  assert.equal(commits,1);
  assert.deepEqual(errors,[]);
  console.log('PASS: completed workout backup and recovery, duplicate avoidance, account isolation, and verified Pro access');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
