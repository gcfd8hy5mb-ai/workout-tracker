const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const sql=fs.readFileSync(require('node:path').join(__dirname,'../docs/sql/prism-v2-isolated-schedule.DRAFT.sql'),'utf8');
const cas=require('../myliftcoach2/v2-schedule-cas.js');
const d=(name)=>({version:1,plans:[{id:'custom-a',title:name,ids:['leg-press']}],assigned:['custom-a',null,null,null,null,null,null]});
test('isolated v2 schedule does not write into any original legacy tables',()=>{
 assert.match(sql,/create table if not exists public\.prism_v2_workout_schedules/);
 assert.doesNotMatch(sql,/insert into public\.prism_account_|update public\.prism_account_|alter table public\.prism_account_/i);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/with check \(\(select auth\.uid\(\)\)=user_id\)/);
});
test('two accounts retain independent custom schedules',async()=>{
 const db=cas.create();
 await db.save({authenticatedUser:'user-a',requestedOwner:'user-a',expectedRevision:0,document:d('Legs')});
 await db.save({authenticatedUser:'user-b',requestedOwner:'user-b',expectedRevision:0,document:d('Upper')});
 assert.equal(db.read('user-a').document.plans[0].title,'Legs');
 assert.equal(db.read('user-b').document.plans[0].title,'Upper');
});
test('concurrent save on one revision wins once and rejects stale update',async()=>{
 const db=cas.create();
 const saved=await Promise.allSettled(['Monday','Tuesday'].map(name=>db.save({authenticatedUser:'a',requestedOwner:'a',expectedRevision:0,document:d(name)})));
 assert.equal(saved.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(saved.filter(x=>x.status==='rejected').length,1);
 assert.equal(db.read('a').revision,1);
});
test('revision conflict cannot replace user edits',async()=>{
 const db=cas.create();
 await db.save({authenticatedUser:'a',requestedOwner:'a',expectedRevision:0,document:d('Monday')});
 await assert.rejects(db.save({authenticatedUser:'a',requestedOwner:'a',expectedRevision:0,document:d('Wrong')}),/reload/);
 assert.equal(db.read('a').document.plans[0].title,'Monday');
});
test('anonymous, cross-owner, malformed or missing exercises rejected',async()=>{
 const db=cas.create();
 await assert.rejects(db.save({authenticatedUser:null,requestedOwner:'a',expectedRevision:0,document:d('x')}),/Account mismatch/);
 await assert.rejects(db.save({authenticatedUser:'a',requestedOwner:'b',expectedRevision:0,document:d('x')}),/Account mismatch/);
 await assert.rejects(db.save({authenticatedUser:'a',requestedOwner:'a',expectedRevision:0,document:{version:1,plans:[],assigned:['nonexistent',null,null,null,null,null,null]}}),/Unknown/);
});
test('SQL draft explicitly blocks unsafe grants and deployment until isolated auth test',()=>{
 assert.match(sql,/DO NOT GRANT SELECT\/INSERT\/UPDATE IN PRODUCTION UNTIL RESOLVED/);
 assert.match(sql,/ISOLATED test project/);
 assert.match(sql,/SECURITY INVOKER needs equivalent table privileges/);
});
