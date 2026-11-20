/* Verification only; no database access or Supabase writes. The isolated
 * schedule RPC must accept every 2.0 catalog exercise ID and no omissions. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'..');
const ctx={window:{}};
vm.createContext(ctx);
for(const name of ['original-exercise-catalog.js','complete-original-exercise-catalog.js']){
 vm.runInContext(fs.readFileSync(path.join(base,'myliftcoach2',name),'utf8'),ctx,{filename:name});
}
const originals=ctx.window.MLCCompleteOriginalExercises;
const sql=fs.readFileSync(path.join(base,'docs/sql/prism-v2-private-rpc.DRAFT.sql'),'utf8');
const segment=sql.slice(sql.indexOf('create or replace function prism_v2_private.is_supported_exercise'),
 sql.indexOf('revoke all on function prism_v2_private.is_supported_exercise'));
const ids=Array.from(segment.matchAll(/'([a-z][a-z0-9-]+)'/g),match=>match[1]);
test('all 341 distinct imported original exercises are accepted by isolated RPC',()=>{
 assert.equal(originals.length,341);
 assert.equal(new Set(originals.map(ex=>ex.id)).size,341);
 const valid=new Set(ids);
 for(const ex of originals)assert.ok(valid.has(ex.id),'RPC rejects exercise '+ex.id);
});
test('RPC accepts exactly 344 distinct catalog/starter identifiers',()=>{
 assert.equal(ids.length,344);
 assert.equal(new Set(ids).size,344);
 assert.ok(ids.every(id=>/^[a-z0-9-]+$/.test(id)));
});
test('RPC remains draft-only and original production table grants are revoked',()=>{
 assert.match(sql,/DESIGN DRAFT ONLY — DO NOT DEPLOY/);
 assert.match(sql,/revoke all on table public\.prism_v2_workout_schedules from public, anon, authenticated/);
 assert.match(sql,/revoke all on function public\.prism_v2_schedule_save\(bigint,jsonb\) from public, anon/);
});
