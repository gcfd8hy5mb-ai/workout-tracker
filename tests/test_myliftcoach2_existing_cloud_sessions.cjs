const test=require('node:test'),assert=require('node:assert/strict');
const {inspect}=require('../myliftcoach2/existing-cloud-sessions.js');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const entry=(i,deleted=false)=>({owner:A,type:'session',id:String(i).padStart(4,'0'),revision:2,deleted,payload:{title:'Workout '+i}});
function harness(rows,options={}){
 let calls=[],state={access_token:'user-token',user:{id:A},expires_at:Math.floor(Date.now()/1000)+3600};
 const fetcher=async(url,init)=>{
  calls.push({url,init});
  if(options.changeToken)state={...state,access_token:'other-token'};
  const args=JSON.parse(init.body),page=rows.filter(row=>row.id>args.p_after_id).slice(0,args.p_limit);
  return {ok:!options.fail,status:options.fail?500:200,json:async()=>page};
 };
 return {calls,read:()=>state,inp:{endpoint:'https://example.supabase.co',publishableKey:'public-test',
  owner:A,getSession:async()=>state,verifyUser:async()=>({id:A}),fetcher, maxPages:10}};
}
test('reads authenticated owner-scoped cloud session inventory without saving or importing',async()=>{
 const h=harness([entry(1),entry(2,true)]),r=await inspect(h.inp);
 assert.equal(r.total,2);assert.equal(r.active,1);assert.equal(r.deleted,1);
 assert.equal(r.canWrite,false);assert.equal(r.complete,true);
 assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].init.method,'POST');
 assert.match(h.calls[0].url,/\/rpc\/mlc2_v1_list_sessions$/);
 assert.equal(JSON.parse(h.calls[0].init.body).p_limit,100);
});
test('paginates beyond 100 records and never drops earlier sessions',async()=>{
 const rows=Array.from({length:205},(_,i)=>entry(i+1)),h=harness(rows),r=await inspect(h.inp);
 assert.equal(r.total,205);assert.equal(r.records.at(-1).id,'0205');
 assert.deepEqual(h.calls.map(x=>JSON.parse(x.init.body).p_after_id),['','0100','0200']);
});
test('forged owner, repeated IDs and out-of-order rows are rejected',async()=>{
 const wrong=harness([entry(1),{...entry(2),owner:B}]);
 await assert.rejects(inspect(wrong.inp),/Untrusted/);
 const dupe=harness([entry(2),entry(1)]);
 await assert.rejects(inspect({...dupe.inp,fetcher:async()=>({ok:true,json:async()=>[entry(2),entry(1)]})}),/out of order|Untrusted/);
});
test('identity mismatch and expired session refuse to start the RPC',async()=>{
 const h=harness([entry(1)]);
 await assert.rejects(inspect({...h.inp,verifyUser:async()=>({id:B})}),/identity/);
 assert.equal(h.calls.length,0);
 await assert.rejects(inspect({...h.inp,getSession:async()=>({...h.read(),expires_at:0})}),/Sign in again/);
 assert.equal(h.calls.length,0);
});
test('mid-read token change invalidates all results and blocks an incomplete inventory',async()=>{
 const h=harness([entry(1)],{changeToken:true});
 await assert.rejects(inspect(h.inp),/Sign in again/);
 const many=harness(Array.from({length:205},(_,i)=>entry(i+1)));
 await assert.rejects(inspect({...many.inp,maxPages:2}),/pagination limit reached/);
});
test('server errors are not mistaken for an empty account',async()=>{
 const h=harness([entry(1)],{fail:true});
 await assert.rejects(inspect(h.inp),/read failed/);
});
