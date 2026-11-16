/* Run: node --test tests/test_myliftcoach2_history_import.cjs */
const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../persistence/storage-model.js');
const importer=require('../myliftcoach2/history-import.js');
const session={id:101,date:'2026-11-10T15:00:00.000Z',workoutKey:'preset-1',workoutTitle:'Chest',exercises:[{id:'machine-chest-press',name:'Machine Chest Press',sets:[{set:1,weight:'100',reps:'10'}]}]};
test('normalizes original session and preserves its workout title and sets',()=>{
 const out=importer.normalizedSession(session);
 assert.equal(out.workoutTitle,'Chest');assert.equal(out.exercises[0].sets[0].weight,100);
});
test('read-only account scoped cloud mapping restores original completed sessions',async()=>{
 const rows=await model.normalize({workoutHistoryV52:JSON.stringify([session])});
 const owner='test-user';
 const requests=[];
 const fetcher=async(url,opts)=>{
  assert.equal(opts.method,'GET');
  assert.equal(opts.headers.Authorization,'Bearer test-token');
  const parsed=new URL(url),table=parsed.pathname.split('/').pop().replace('prism_account_','');
  requests.push(table);
  const selected=rows.filter(row=>row.table===table).map(row=>({...row,user_id:owner}));
  return {ok:true,json:async()=>selected};
 };
 const results=await importer.load({endpoint:'https://example.supabase.co',publishableKey:'test-public',accessToken:'test-token',userId:owner,fetcher});
 assert.equal(results.length,1);assert.equal(results[0].workoutTitle,'Chest');
 assert.deepEqual(requests,['sources','sessions','session_exercises','sets']);
});
test('rejects cloud records belonging to a different user',async()=>{
 const fetcher=async()=>({ok:true,json:async()=>[{user_id:'other-user',source_key:'workoutHistoryV52'}]});
 await assert.rejects(importer.load({endpoint:'https://example.supabase.co',publishableKey:'public',accessToken:'token',userId:'owner',fetcher}),/ownership mismatch/);
});
test('rejects missing authentication and invalid session records',async()=>{
 await assert.rejects(importer.load({endpoint:'http://insecure.test',publishableKey:'public',accessToken:'token',userId:'owner'}),/Authenticated account required/);
 assert.equal(importer.normalizedSession({date:'bad',exercises:[]}),null);
});
