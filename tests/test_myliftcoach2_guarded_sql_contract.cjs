const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const sql=fs.readFileSync(path.join(__dirname,'../docs/sql/prism-guarded-workout-v2.DRAFT.sql'),'utf8');
test('guarded write explicitly requires authenticated owner and a checkpoint',()=>{
 assert.match(sql,/owner_id uuid := auth\.uid\(\)/);
 assert.match(sql,/current_checkpoint <> expected_checkpoint/);
 assert.match(sql,/using errcode='40001'/);
});
test('guarded write restricts source and tables and requires one atomic batch',()=>{
 assert.match(sql,/workoutHistoryV52/);
 assert.match(sql,/session_exercises/);
 assert.match(sql,/jsonb_array_length\(changes\) > 500/);
 assert.match(sql,/public\.prism_apply_account_batch\(changes\)/);
});
test('change detection includes child records and positions',()=>{
 for(const table of ['prism_account_sources','prism_account_sessions','prism_account_session_exercises','prism_account_sets'])assert.ok(sql.includes(table));
 assert.match(sql,/row_data\.position::text/);
 assert.match(sql,/row_data\.revision::text/);
 assert.match(sql,/row_data\.payload::text/);
});
test('draft explicitly gates old-writer deployment',()=>{
 assert.match(sql,/NOT safe against existing legacy writers/);
 assert.match(sql,/Old writers must be modified to share this lock/);
});
