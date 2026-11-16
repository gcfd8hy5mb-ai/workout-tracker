const test=require('node:test'),assert=require('node:assert/strict');const model=require('../persistence/storage-model.js');const adapter=require('../myliftcoach2/tracking-import.js');
test('restores water, food and weight from owner-checked account cloud rows',async()=>{
 const snapshot={dailyTrackingV1:JSON.stringify({water:[{id:'w1',day:'2026-11-16',amount:250}],food:[{id:'f1',day:'2026-11-16',name:'Eggs',calories:150,protein:12}],weight:[{id:'x1',day:'2026-11-15',value:185}],waterGoal:2000,waterUnit:'ml'})};
 const normalized=await model.normalize(snapshot),owner='user-1',calls=[];
 const fetcher=async(url,options)=>{
  assert.equal(options.method,'GET');assert.equal(options.headers.Authorization,'Bearer token');
  const table=new URL(url).pathname.split('/').pop().replace('prism_account_','');calls.push(table);
  return {ok:true,json:async()=>normalized.filter(x=>x.table===table).map(x=>({...x,user_id:owner}))};
 };
 const result=await adapter.load({endpoint:'https://example.supabase.co',publishableKey:'public',accessToken:'token',userId:owner,fetcher});
 assert.equal(result.water[0].amount,250);assert.equal(result.food[0].calories,150);assert.equal(result.weight[0].value,185);
 assert.deepEqual(calls,['sources','tracking','tracking_entries','tracking_maps']);
});
test('rejects ownership mismatch',async()=>{
 const fetcher=async()=>({ok:true,json:async()=>[{user_id:'other',source_key:'dailyTrackingV1'}]});
 await assert.rejects(adapter.load({endpoint:'https://example.supabase.co',publishableKey:'public',accessToken:'token',userId:'mine',fetcher}),/owner mismatch/);
});
test('does not invent missing food macros or change input',()=>{
 const raw={food:[{day:'2026-11-16',name:'Unknown',calories:100}],water:[],weight:[]};
 const before=JSON.stringify(raw),result=adapter.normalize(raw);
 assert.equal(result.food[0].protein,null);assert.equal(result.food[0].carbs,null);assert.equal(JSON.stringify(raw),before);
});
