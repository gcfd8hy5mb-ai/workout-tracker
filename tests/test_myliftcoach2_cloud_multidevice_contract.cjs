/* No production connection: exercise the real client transport against a
 * deterministic, owner-scoped mock RPC that enforces compare-and-swap.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const transport=require('../myliftcoach2/v2-cloud-transport.js');
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const doc=(title='Day A')=>({version:1,plans:[{id:'custom-day',title,ids:['landmine-squat','leg-press']}],
 assigned:['custom-day',null,null,null,null,null,null],
 overrides:{'2026-11-20':'custom-day','2026-11-21':null},
 recurring:[{start:'2026-11-20',end:null,workoutId:'custom-day'}]});
function fakeServer(){
 const rows=new Map(),calls=[],accounts=new Map([['token-a',A],['token-b',B]]);
 const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>structuredClone(data)});
 async function fetcher(url,opts){
  calls.push({url,opts});
  const owner=accounts.get((opts.headers.Authorization||'').replace('Bearer ',''));
  if(!owner)return response({message:'Unauthorized'},401);
  const name=url.split('/').pop(),input=JSON.parse(opts.body),current=rows.get(owner)||null;
  if(name==='prism_v2_schedule_read')return response(current);
  if(name!=='prism_v2_schedule_save')return response({message:'Unknown method'},404);
  if((current?.revision||0)!==input.expected_revision)return response({code:'PT409'},409);
  const next={revision:(current?.revision||0)+1,document:structuredClone(input.new_document)};
  rows.set(owner,next);return response(next);
 }
 const client=(owner,token)=>transport.createTestTransport({endpoint:'https://example.supabase.co',
  publishableKey:'test-publishable',getSession:async()=>({
   access_token:token,user:{id:owner},expires_at:Math.floor(Date.now()/1000)+3600
  }),fetcher});
 return {client,calls,rows,fetcher};
}
test('two separate devices round-trip the same owner schedule and reject a stale update',async()=>{
 const s=fakeServer(),first=s.client(A,'token-a'),second=s.client(A,'token-a');
 const local=doc(),otherDevice=doc('Other device changed plan');
 assert.deepEqual(await first.read(A),{revision:0,document:null});
 assert.equal((await first.save(A,0,local)).revision,1);
 const fresh=await second.read(A);assert.equal(fresh.document.plans[0].title,'Day A');
 assert.equal((await second.save(A,fresh.revision,otherDevice)).revision,2);
 await assert.rejects(first.save(A,1,doc('Stale update')),/another device/);
 const remote=await first.read(A);
 assert.equal(remote.revision,2);
 assert.equal(remote.document.plans[0].title,'Other device changed plan');
 assert.equal(remote.document.overrides['2026-11-21'],null);
 assert.deepEqual(local,doc());
});
test('independent users are isolated and wrong owner never makes a request',async()=>{
 const s=fakeServer(),a=s.client(A,'token-a'),b=s.client(B,'token-b');
 await a.save(A,0,doc());
 assert.deepEqual(await b.read(B),{revision:0,document:null});
 await b.save(B,0,doc('Private B'));
 assert.equal((await a.read(A)).document.plans[0].title,'Day A');
 const before=s.calls.length;
 await assert.rejects(a.read(B),/account changed/i);
 assert.equal(s.calls.length,before);
});
test('malformed recurring rules, unknown plan assignments and invalid dates reject before network',async()=>{
 const s=fakeServer(),client=s.client(A,'token-a');
 for(const bad of [
  {...doc(),recurring:[{start:'bad',end:null,workoutId:'custom-day'}]},
  {...doc(),overrides:{'2026-11-20':'unknown-plan'}},
  {...doc(),assigned:['unknown-plan',null,null,null,null,null,null]},
  {...doc(),overrides:{'2026-02-30':'custom-day'}}
 ]){
  await assert.rejects(client.save(A,0,bad));
 }
 assert.equal(s.calls.length,0);
});
test('invalid remote schedule cannot be accepted as verified even at matching revision',async()=>{
 const s=fakeServer(),client=s.client(A,'token-a');
 s.rows.set(A,{revision:1,document:{...doc(),recurring:[{start:'bad',end:null,workoutId:'custom-day'}]}});
 await assert.rejects(client.read(A),/Invalid cloud schedule|Invalid schedule date/);
});
test('production transport remains impossible to activate from client controls',()=>{
 assert.equal(transport.ENABLED,false);
 assert.throws(()=>transport.create({enabled:true}),/disabled/);
});
