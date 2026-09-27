const assert=require('node:assert/strict');
const {create}=require('../persistence/photo-sync.js');
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const databases=['workoutTrackerPhotosV1','prismProgressPhotosDB'];
function device(){
 const guest=Object.fromEntries(databases.map(db=>[db,[]])),account=Object.fromEntries(databases.map(db=>[db,[]]));
 const stores={guest:db=>({all:async()=>guest[db],put:async row=>guest[db].push(row)}),account:db=>({all:async()=>account[db],put:async row=>account[db].push(row),remove:async id=>{account[db]=account[db].filter(row=>row.id!==id)}})};
 return {guest,account,stores};
}
const objects=new Map(),rows=[];
const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data,blob:async()=>data});
async function fetcher(input,options){
 const url=new URL(input),owner=options.headers.Authorization.slice('Bearer '.length);
 if(![A,B].includes(owner))return response({},401);
 if(url.pathname==='/rest/v1/prism_account_photos'){
  if(options.method==='PATCH'){
   const id=new URLSearchParams(url.search).get('id').slice(3),row=rows.find(x=>x.user_id===owner&&x.id===id);
   if(!row)return response([],200);
   row.deleted_at=JSON.parse(options.body).deleted_at;return response([row]);
  }
  if(options.method==='POST'){
   const row=JSON.parse(options.body);
   if(row.user_id!==owner)return response({},403);
   if(!rows.some(x=>x.user_id===owner&&x.id===row.id))rows.push(row);
   return response([row],201);
  }
  return response(rows.filter(row=>row.user_id===owner));
 }
 const prefix='/storage/v1/object/';
 if(url.pathname.startsWith(prefix)){
  const key=url.pathname.replace(prefix,'');
  if(!key.includes('/'+owner+'/'))return response({},403);
  if(options.method==='POST'){
   if(objects.has(key))return response({},409);
   objects.set(key,options.body);return response({},200);
  }
  const blob=objects.get(key.replace(/^authenticated\//,''));
  return blob?response(blob):response({},404);
 }
 throw Error('Unexpected request '+url);
}
const backings=new Map();
const build=(owner,stores)=>create({url:'https://example.supabase.co',publishableKey:'sb_publishable_test',userId:owner,getSession:async()=>({access_token:owner,user:{id:owner}}),fetcher,stores,backing:{getItem:key=>backings.get(key)||null,setItem:(key,value)=>backings.set(key,value)}});
async function run(){
 const first=device();
 first.guest.workoutTrackerPhotosV1.push({id:'old',day:'2026-09-01',weight:180,data:new Blob(['photo one'],{type:'image/jpeg'})});
 first.guest.prismProgressPhotosDB.push({id:'modern',date:'2026-09-20',view:'front',phaseId:'cut1',blob:new Blob(['photo two'],{type:'image/png'})});
 const a=build(A,first.stores);
 assert.equal(await a.claimGuest(),2);
 assert.equal(first.guest.workoutTrackerPhotosV1.length,1,'guest original remains');
 assert.equal(rows.length,2);assert.equal(objects.size,2);
 assert.ok(rows.every(row=>row.object_path.startsWith(A+'/')&&!JSON.stringify(row.metadata).includes('photo one')));
 assert.equal(await a.push(),0,'upload retry is idempotent');
 const second=device(),a2=build(A,second.stores);
 assert.equal(await a2.restore(),2);
 assert.equal((await second.account.workoutTrackerPhotosV1[0].data.text()),'photo one');
 assert.equal((await second.account.prismProgressPhotosDB[0].blob.text()),'photo two');
 assert.equal(await a2.restore(),0,'second restore is idempotent');
 a2.markDeleted('workoutTrackerPhotosV1','old');second.account.workoutTrackerPhotosV1=[];
 assert.equal(await a2.push(),0,'deletion marker is uploaded');
 assert.ok(rows.find(row=>row.legacy_id==='old').deleted_at);
 assert.equal(await a.restore(),0,'tombstone removes the old account copy');
 assert.equal(first.account.workoutTrackerPhotosV1.length,0,'deleted photo cannot reappear on another device');
 const another=device(),b=build(B,another.stores);assert.equal(await b.restore(),0,'User B sees no A photos');
 console.log('Photos: guest copy, private upload, read-back, second device restore, A/B isolation, retry pass.');
}
run().catch(error=>{console.error(error);process.exitCode=1});
