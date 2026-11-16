const test=require('node:test'),assert=require('node:assert/strict'),model=require('../persistence/storage-model.js'),adapter=require('../myliftcoach2/account-settings-import.js');
test('restores original profile and goals only with matching account owner',async()=>{
 const snapshot={prismLocalProfileV1:JSON.stringify({displayName:'Test Member',avatarId:'teal',onboardingComplete:true}),workoutGoalsV1:JSON.stringify({goal:'strength',days:4,focus:'upper'})};
 const rows=await model.normalize(snapshot),userId='owner';
 const fetcher=async(url,options)=>{assert.equal(options.method,'GET');const table=new URL(url).pathname.split('/').pop().replace('prism_account_','');const source=new URL(url).searchParams.get('source_key').slice(3);return {ok:true,json:async()=>rows.filter(x=>x.table===table&&x.source_key===source).map(x=>({...x,user_id:userId}))}};
 const result=await adapter.load({endpoint:'https://example.supabase.co',publishableKey:'public',accessToken:'token',userId,fetcher});
 assert.equal(result.displayName,'Test Member');assert.equal(result.days,4);assert.equal(result.trainingGoal,'strength');
});
test('rejects settings from another account',async()=>{
 const fetcher=async()=>({ok:true,json:async()=>[{user_id:'someone-else',source_key:'prismLocalProfileV1'}]});
 await assert.rejects(adapter.load({endpoint:'https://example.supabase.co',publishableKey:'public',accessToken:'token',userId:'owner',fetcher}),/ownership mismatch/);
});
test('does not infer paid access or mutate source objects',()=>{
 const p={displayName:'Member',avatarId:'teal',onboardingComplete:true},g={goal:'muscle',days:3};
 const before=JSON.stringify({p,g}),result=adapter.clean(p,g);
 assert.equal(result.trainingGoal,'muscle');assert.equal(Object.hasOwn(result,'tier'),false);
 assert.equal(before,JSON.stringify({p,g}));
});
