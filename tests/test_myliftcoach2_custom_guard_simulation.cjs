const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const simulation=require('../myliftcoach2/custom-guard-simulation.js');
const sql=fs.readFileSync(path.join(__dirname,'../docs/sql/prism-custom-schedule-guarded-v2.DRAFT.sql'),'utf8');
test('two competing custom schedule writes with identical checkpoint cannot both succeed',async()=>{
 const db=simulation.create({owner:{water:[100],custom:'original'}});
 const a=db.read('owner'),b=db.read('owner');
 const results=await Promise.allSettled([
  db.save({owner:'owner',verifiedOwner:'owner',checkpoint:a.revision,newValue:{water:[100],custom:'Monday'}}),
  db.save({owner:'owner',verifiedOwner:'owner',checkpoint:b.revision,newValue:{water:[100],custom:'Tuesday'}})
 ]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(results.filter(r=>r.status==='rejected').length,1);
 assert.equal(db.read('owner').revision,1);
});
test('failed transaction cannot erase existing custom schedule or tracking',async()=>{
 const db=simulation.create({owner:{water:[100],custom:'original'}});
 await assert.rejects(db.save({owner:'owner',verifiedOwner:'owner',checkpoint:0,newValue:{water:[],custom:'broken'},failAfterValidate:true}),/rolled back/);
 assert.deepEqual(db.read('owner').value,{water:[100],custom:'original'});
 assert.equal(db.read('owner').revision,0);
});
test('owner mismatch is rejected and cannot access other account',async()=>{
 const db=simulation.create({owner:{custom:'mine'},other:{custom:'different'}});
 await assert.rejects(db.save({owner:'owner',verifiedOwner:'other',checkpoint:0,newValue:{custom:'overwrite'}}),/owner mismatch/);
 assert.equal(db.read('owner').value.custom,'mine');
});
test('draft SQL fingerprints all original custom workout and tracking tables',()=>{
 for(const table of ['prism_account_sources','prism_account_workouts','prism_account_workout_exercises','prism_account_tracking','prism_account_tracking_entries','prism_account_tracking_maps'])assert.ok(sql.includes(table));
 for(const key of ['customWorkoutsV5','dailyTrackingV1'])assert.ok(sql.includes(key));
 assert.match(sql,/row_data\.revision::text/);assert.match(sql,/row_data\.payload::text/);assert.match(sql,/row_data\.position::text/);
});
test('draft RPC enforces owner, checkpoint and one-batch bound but is not deployed',()=>{
 assert.match(sql,/owner_id uuid := auth\.uid\(\)/);
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/current_checkpoint <> expected_checkpoint/);
 assert.match(sql,/pg_catalog\.jsonb_array_length\(changes\) > 500/);
 assert.match(sql,/Legacy prism_apply_account_batch does not honor/);
});
