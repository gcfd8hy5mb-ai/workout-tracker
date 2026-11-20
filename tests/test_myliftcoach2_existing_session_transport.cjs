const test=require('node:test'),assert=require('node:assert/strict');
const transport=require('../myliftcoach2/existing-session-transport.js');
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const op='44444444-4444-4444-8444-444444444444';
const recordId='mlc2-history-demo-123';
const payload={format:'mlc2-completed-workout-v1',workout:{id:'demo-123',title:'Legs'}};
function mock({onCall}={}){
 let calls=[],session={user:{id:owner},access_token:'token',expires_at:Math.floor(Date.now()/1000)+3600};
 const client=transport.create({endpoint:'https://example.supabase.co',publishableKey:'publishable',
  getSession:async()=>session,
  fetcher:async(url,options)=>{calls.push({url,options});return onCall(url,options)}});
 return {client,calls,changeUser:()=>session={...session,user:{id:other}}};
}
const http=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
test('transport refuses unauthenticated configuration',()=>{
 assert.throws(()=>transport.create({}),/Authenticated HTTPS/);
});
test('owner-scoped existing cloud read returns verified session and no writes',async()=>{
 const record={owner,type:'session',id:'demo-123',revision:1,deleted:false,payload:{title:'Legs'}};
 const h=mock({onCall:(url)=>{assert.match(url,/mlc2_v1_read$/);return http(record)}});
 assert.deepEqual(await h.client.read(owner,'demo-123'),record);
 assert.equal(h.calls.length,1);assert.equal(JSON.parse(h.calls[0].options.body).p_type,'session');
});
test('independent existing backend commit matches exact RPC contract',async()=>{
 const h=mock({onCall:(url,opts)=>{
  assert.match(url,/mlc2_v1_commit$/);
  const params=JSON.parse(opts.body);assert.equal(params.p_deleted,false);
  assert.equal(params.p_base_revision,0);assert.equal(params.p_record_id,recordId);
  return http({owner,opId:op,revision:1,replayed:false});
 }});
 const result=await h.client.commit(owner,{opId:op,recordId,baseRevision:0,payload});
 assert.equal(result.revision,1);assert.equal(result.replayed,false);
});
test('cross-owner results, stale conflicts and unknown receipt are refused',async()=>{
 const h=mock({onCall:()=>http({owner:other,type:'session',id:'demo-123',revision:1,deleted:false,payload:{}})});
 await assert.rejects(h.client.read(owner,'demo-123'),/cross-owner/);
 const conflict=mock({onCall:()=>http({code:'PT409'},409)});
 await assert.rejects(conflict.client.commit(owner,{opId:op,recordId,baseRevision:0,payload}),/another device/);
 const invalid=mock({onCall:()=>http({owner,opId:op,revision:999,replayed:false})});
 await assert.rejects(invalid.client.commit(owner,{opId:op,recordId,baseRevision:0,payload}),/could not be verified/);
});
test('session switch during request refuses cloud result',async()=>{
 let h;
 h=mock({onCall:()=>{h.changeUser();return http(null)}});
 await assert.rejects(h.client.read(owner,'demo-123'),/Account changed/);
});
test('invalid commit identities fail before any network calls',async()=>{
 const h=mock({onCall:()=>http(null)});
 await assert.rejects(h.client.commit(owner,{opId:'not-uuid',recordId,baseRevision:0,payload}),/immutable operation/);
 await assert.rejects(h.client.commit(owner,{opId:op,recordId:'legacy-123',baseRevision:0,payload}),/immutable operation/);
 await assert.rejects(h.client.commit(owner,{opId:op,recordId,baseRevision:1,payload}),/immutable operation/);
 assert.equal(h.calls.length,0);
});
