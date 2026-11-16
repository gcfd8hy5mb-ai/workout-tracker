const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../myliftcoach2/v2-cloud-transport.js');
const id='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222';
const doc=(title='Leg Day')=>({version:1,plans:[{id:'custom-leg',title,ids:['leg-press']}],assigned:['custom-leg',null,null,null,null,null,null],
  overrides:{'2026-11-20':'custom-leg'},recurring:[{start:'2026-11-13',end:null,workoutId:'custom-leg'}]});
const result=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
function harness({owner=id,response,resultStatus=200,customFetcher,session}={}){
 let calls=[],state={access_token:'test-token',user:{id:owner},expires_at:Math.floor(Date.now()/1000)+3600};
 const fetcher=customFetcher||(async(url,opts)=>{calls.push({url,opts});return result(response,resultStatus)});
 const getSession=()=>session===undefined?state:session();
 const client=api.createTestTransport({endpoint:'https://example.supabase.co',publishableKey:'test-publishable',getSession,fetcher});
 return {client,calls,setAccount(x){state={...state,user:{id:x}}},expire(){state={...state,expires_at:0}}};
}
test('real production path remains hard-disabled without any requests',()=>{
 let calls=0;
 assert.equal(api.ENABLED,false);
 assert.throws(()=>api.create({endpoint:'https://example.supabase.co',publishableKey:'test',getSession:async()=>({access_token:'x',user:{id}}),fetcher:()=>calls++,enabled:true}),/disabled/);
 assert.equal(calls,0);
});
test('first cloud read returns revision zero, without creating a record',async()=>{
 const h=harness({response:null});assert.deepEqual(await h.client.read(id),{revision:0,document:null});
 assert.equal(h.calls.length,1);assert.match(h.calls[0].url,/\/rpc\/prism_v2_schedule_read$/);
 assert.equal(h.calls[0].opts.method,'POST');assert.equal(h.calls[0].opts.headers.Authorization,'Bearer test-token');
});
test('saved revisions and documents return as one verified state',async()=>{
 const original=doc(),h=harness({response:{revision:4,document:original}});
 assert.deepEqual(await h.client.read(id),{revision:4,document:original});
});
test('cloud save accepts re-ordered JSON keys but rejects altered values',async()=>{
 const d=doc(),responseDoc={recurring:d.recurring,overrides:d.overrides,assigned:d.assigned,plans:d.plans,version:1};
 const h=harness({response:{revision:2,document:responseDoc}});
 assert.equal((await h.client.save(id,1,d)).revision,2);
 assert.equal(JSON.parse(h.calls[0].opts.body).expected_revision,1);
 const altered=harness({response:{revision:2,document:doc('Wrong Session')}});
 await assert.rejects(altered.client.save(id,1,d),/could not be verified/);
});
test('conflict and server failure never change the caller draft',async()=>{
 const d=doc(),before=JSON.stringify(d);
 await assert.rejects(harness({response:{message:'conflict'},resultStatus:409}).client.save(id,1,d),/another device/);
 await assert.rejects(harness({response:{message:'failed'},resultStatus:500}).client.save(id,1,d),/local draft unchanged/);
 assert.equal(JSON.stringify(d),before);
});
test('account switch after response rejects stale results',async()=>{
 let state={access_token:'token',user:{id},expires_at:Math.floor(Date.now()/1000)+3600};
 const h=harness({session:()=>state,customFetcher:async()=>{state={...state,user:{id:other}};return result({revision:2,document:doc()})}});
 await assert.rejects(h.client.save(id,1,doc()),/account changed/);
});
test('expired or mismatched owner rejects before making any request',async()=>{
 const h=harness({response:null});h.expire();await assert.rejects(h.client.read(id),/expired/);assert.equal(h.calls.length,0);
 const x=harness({response:null});await assert.rejects(x.client.read(other),/account changed/);assert.equal(x.calls.length,0);
});
test('network errors and invalid read response reject rather than resetting draft',async()=>{
 const failed=harness({customFetcher:async()=>{throw Error('Offline')}});await assert.rejects(failed.client.read(id),/Offline/);
 const invalid=harness({response:{revision:1,document:doc('Changed') .plans}});await assert.rejects(invalid.client.read(id),/Invalid cloud schedule/);
});
