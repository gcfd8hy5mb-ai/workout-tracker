const test=require('node:test'),assert=require('node:assert/strict');
const moduleUnderTest=require('../myliftcoach2/fresh-history-checkpoint.js');
const model=require('../persistence/storage-model.js');
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const sample={id:'legacy-1',date:'2026-11-18T12:00:00Z',workoutKey:'custom-a',workoutTitle:'Custom Day',
 exercises:[{id:'leg-press',name:'Leg Press',sets:[{set:1,weight:100,reps:10}]}]};
async function fixture(){return (await model.normalize({workoutHistoryV52:JSON.stringify([sample])})).map(x=>({...x,user_id:owner,revision:2}));}
function harness(rows,{ownerNow=owner,mutateToken=false,truncate=false,failPage=false}={}){
 let calls=[],current=ownerNow,token='test-token';
 const read=async()=>({access_token:token,user:{id:current},expires_at:Math.floor(Date.now()/1000)+3600});
 const fetcher=async(url,options)=>{
  const path=new URL(url),table=path.pathname.split('prism_account_')[1],limit=Number(path.searchParams.get('limit')),
   offset=Number(path.searchParams.get('offset'));
  calls.push({table,offset,options});
  if(mutateToken)token='changed-token';
  const found=rows.filter(x=>x.table===table).slice(offset,offset+limit);
  return {ok:!failPage,status:failPage?503:200,json:async()=>truncate?[...found,{...found[0],id:'extra'}]:found};
 };
 return {calls,read,fetcher,changeOwner(x){current=x},
  input:{endpoint:'https://example.supabase.co',publishableKey:'test-publishable',
   owner,getSession:read,verifyUser:async()=>({id:owner}),fetcher}};
}
test('fresh raw checkpoint reads exactly the four history tables without write requests',async()=>{
 const rows=await fixture(),h=harness(rows);const checkpoint=await moduleUnderTest.read(h.input);
 assert.equal(checkpoint.owner,owner);assert.equal(checkpoint.readOnly,true);
 assert.equal(checkpoint.readyForProduction,false);assert.equal(checkpoint.rows.length,rows.length);
 assert.deepEqual(h.calls.map(x=>x.table),moduleUnderTest.TABLES);
 assert.ok(h.calls.every(x=>x.options.method==='GET'));
 assert.deepEqual(JSON.parse(model.restoreSnapshot(checkpoint.rows).workoutHistoryV52),[sample]);
});
test('wrong owner row and invalid revision reject a checkpoint',async()=>{
 const rows=await fixture();
 await assert.rejects(moduleUnderTest.read(harness(rows.map(x=>({...x,user_id:other}))).input),/ownership/);
 await assert.rejects(moduleUnderTest.read(harness(rows.map(x=>({...x,revision:0}))).input),/revision/);
});
test('expired token and mismatched identity never read rows',async()=>{
 const rows=await fixture(),h=harness(rows);
 await assert.rejects(moduleUnderTest.read({...h.input,verifyUser:async()=>({id:other})}),/identity/);
 assert.equal(h.calls.length,0);
 await assert.rejects(moduleUnderTest.read({...h.input,getSession:async()=>({...await h.read(),expires_at:0})}),/expired/);
});
test('session changes during read invalidate all collected rows',async()=>{
 const rows=await fixture(),h=harness(rows,{mutateToken:true});
 await assert.rejects(moduleUnderTest.read(h.input),/changed or expired/);
});
test('missing source marker and duplicate row cannot produce a usable checkpoint',async()=>{
 const rows=await fixture();
 await assert.rejects(moduleUnderTest.read(harness(rows.filter(x=>x.table!=='sources')).input),/source missing/);
 await assert.rejects(moduleUnderTest.read(harness([...rows,rows[0]]).input),/Duplicate/);
});
test('failed network request fails closed without a partial result',async()=>{
 const h=harness(await fixture(),{failPage:true});
 await assert.rejects(moduleUnderTest.read(h.input),/read failed/);
});
