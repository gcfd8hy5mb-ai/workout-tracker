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

test('read-only original history search matches workout titles and exercise names without mutation',()=>{
 const input=[importer.normalizedSession(session),importer.normalizedSession({
  ...session,id:102,workoutTitle:'Legs',exercises:[{id:'leg-press',name:'Leg Press',sets:[{weight:150,reps:8}]}]
 })];
 const raw=JSON.stringify(input);
 assert.equal(importer.filterSessions(input,'chest').length,1);
 assert.equal(importer.filterSessions(input,'leg press')[0].workoutTitle,'Legs');
 assert.equal(importer.filterSessions(input,'  LEGS  ')[0].workoutTitle,'Legs');
 assert.equal(importer.filterSessions(input,'')[0].workoutTitle,'Chest');
 assert.equal(importer.filterSessions(input,'missing').length,0);
 assert.equal(JSON.stringify(input),raw);
});

test('original workout history detail excludes unfinished sets without altering source history',()=>{
 const input={date:'2026-11-13',exercises:[
  {id:'press',sets:[{weight:100,reps:8,completed:true},{weight:180,reps:10,completed:false}]},
  {id:'row',sets:[{weight:80,reps:12},{weight:0,reps:10}]}
 ]};
 const before=JSON.stringify(input);
 assert.deepEqual(importer.sessionTotals(input),{sets:2,volume:1760});
 assert.deepEqual(importer.sessionTotals({exercises:[input.exercises[0]]}),{sets:1,volume:800});
 assert.deepEqual(importer.sessionTotals(null),{sets:0,volume:0});
 assert.equal(JSON.stringify(input),before);
});

test('Home original activity shows latest three actual workouts without incomplete or mixed records',()=>{
 const sessions=[
  {date:'2026-11-09T12:00:00Z',workoutTitle:'Older',exercises:[{sets:[{weight:50,reps:10}]}]},
  {date:'2026-11-16T12:00:00Z',workoutTitle:'Unfinished',exercises:[{sets:[{weight:500,reps:10,completed:false}]}]},
  {date:'2026-11-15T12:00:00Z',workoutTitle:'Newest',exercises:[{sets:[{weight:90,reps:10}]}]},
  {date:'2026-11-13T12:00:00Z',workoutTitle:'Middle',exercises:[{sets:[{weight:80,reps:10}]}]},
  {date:'2026-11-11T12:00:00Z',workoutTitle:'Earlier',exercises:[{sets:[{weight:70,reps:10}]}]}
 ];
 const before=JSON.stringify(sessions);
 assert.deepEqual(importer.recentCompleted(sessions,3).map(s=>s.workoutTitle),['Newest','Middle','Earlier']);
 assert.deepEqual(importer.recentCompleted(sessions,1).map(s=>s.workoutTitle),['Newest']);
 assert.deepEqual(importer.recentCompleted([]),[]);
 assert.equal(JSON.stringify(sessions),before);
});
