const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../persistence/storage-model.js');
const adapter=require('../myliftcoach2/account-settings-import.js');
const endpoint='https://example.supabase.co';
const config={endpoint,publishableKey:'public',accessToken:'test-token',userId:'test-user'};
test('no saved profile or goals is not reported as restored defaults',async()=>{
 const calls=[];
 const fetcher=async(url,options)=>{
  assert.equal(options.method,'GET');
  assert.equal(options.headers.Authorization,'Bearer test-token');
  calls.push(new URL(url).pathname);
  return {ok:true,json:async()=>[]};
 };
 const value=await adapter.load({...config,fetcher});
 assert.equal(value,null);
 assert.equal(calls.length,4);
});
test('restores actual original profile and goal rows without editing the cloud',async()=>{
 const source={
  prismLocalProfileV1:JSON.stringify({displayName:'Existing Account',onboardingComplete:true,avatarId:'teal'}),
  workoutGoalsV1:JSON.stringify({goal:'strength',days:4,focus:'balanced'})
 };
 const rows=await model.normalize(source);
 const fetcher=async(url,options)=>{
  assert.equal(options.method,'GET');
  const parsed=new URL(url);
  const table=parsed.pathname.split('/').pop().replace('prism_account_','');
  const sourceKey=parsed.searchParams.get('source_key').slice(3);
  return {ok:true,json:async()=>rows.filter(row=>row.table===table&&row.source_key===sourceKey).map(row=>({...row,user_id:config.userId}))};
 };
 const value=await adapter.load({...config,fetcher});
 assert.equal(value.displayName,'Existing Account');
 assert.equal(value.trainingGoal,'strength');
 assert.equal(value.days,4);
 assert.equal(value.onboardingComplete,true);
});
test('rejects records from another account instead of showing shared profile',async()=>{
 const fetcher=async()=>({ok:true,json:async()=>[{user_id:'wrong-user',source_key:'prismLocalProfileV1'}]});
 await assert.rejects(adapter.load({...config,fetcher}),/ownership mismatch/);
});
