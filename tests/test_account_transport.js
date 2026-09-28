const assert=require('node:assert/strict');
const {createTransport,migrate}=require('../persistence/account-sync.js');
const model=require('../persistence/storage-model.js');
(async()=>{
 let session={access_token:'test-A',user:{id:'A'}},calls=[];
 const transport=createTransport({url:'https://example.supabase.co',publishableKey:'public-test',getSession:async()=>session,fetcher:async(url,options)=>{
  calls.push({url:String(url),options});assert.equal(options.cache,'no-store');assert.equal(options.headers.Authorization,'Bearer test-A');return {ok:true,json:async()=>[]};
 }});
 await transport.read('A');assert.equal(calls.length,model.TABLES.length);
 assert.ok(calls.every(c=>c.url.includes('user_id=eq.A')));
 session={access_token:'test-B',user:{id:'B'}};await assert.rejects(()=>transport.write('A',[]),/Account changed/);
 // Switching accounts between the preflight check and request must not submit A's data under B's token.
 let checks=0;const race=createTransport({url:'https://example.supabase.co',publishableKey:'public-test',getSession:async()=>++checks===1?{access_token:'A',user:{id:'A'}}:{access_token:'B',user:{id:'B'}},fetcher:async()=>{throw Error('Must not fetch')}});
 await assert.rejects(()=>race.write('A',[]),/Verified signed-in/);
 const failure=createTransport({url:'https://example.supabase.co',publishableKey:'public-test',getSession:async()=>({access_token:'A',user:{id:'A'}}),fetcher:async()=>({ok:false,status:503})});
 await assert.rejects(()=>failure.read('A'),/local data is unchanged/);
 const original={workoutHistoryV52:JSON.stringify(Array.from({length:180},(_,i)=>({id:i,date:'2026-09-01',exercises:[{id:'press',sets:[{weight:100,reps:10}]}]})))};
 let remote=[],failed=false;
 const resumable={read:async()=>structuredClone(remote),write:async(user,rows)=>{
  if(remote.length&&!failed){failed=true;throw Error('Connection interrupted');}
  assert.ok(rows.length<=500);const saved=rows.map(r=>({...r,revision:1,user_id:user}));remote.push(...saved);return saved;
 }};
 await assert.rejects(()=>migrate({snapshot:original,owner:'A',userId:'A',transport:resumable}),/interrupted/);
 assert.equal(remote.length,500);const result=await migrate({snapshot:original,owner:'A',userId:'A',transport:resumable});
 assert.equal(result.status,'verified');assert.equal(new Set(remote.map(r=>r.table+':'+r.id)).size,remote.length);
 assert.equal(JSON.parse(result.restoreCandidate.workoutHistoryV52).length,180);
 console.log('Account transport: authenticated ownership race guard, no-store requests, network errors, and resumable >500-record migration pass.');
})().catch(e=>{console.error(e);process.exitCode=1;});
