const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const file=fs.readFileSync(path.join(__dirname,'../docs/sql/prism-v2-private-rpc.DRAFT.sql'),'utf8');
test('RPC reads and saves only the isolated schedule table',()=>{
 assert.match(file,/public\.prism_v2_workout_schedules/);
 assert.doesNotMatch(file,/\b(insert into|update|delete from|alter table)\s+public\.prism_account_/i);
});
test('no client writes to isolated table and no public privileged RPC grants',()=>{
 assert.match(file,/revoke all on table public\.prism_v2_workout_schedules from public, anon, authenticated/);
 for(const sig of ['schedule_read\\(\\)','schedule_save\\(bigint,jsonb\\)']){
  assert.match(file,new RegExp('revoke all on function prism_v2_private\\.'+sig+' from public, anon, authenticated'));
 }
 assert.match(file,/revoke all on schema prism_v2_private from public, anon, authenticated/);
});
test('privileged functions use auth uid and bound transaction revision',()=>{
 assert.equal((file.match(/owner_id uuid := auth\.uid\(\)/g)||[]).length,2);
 assert.match(file,/where user_id=owner_id and revision=expected_revision/);
 assert.match(file,/on conflict \(user_id\) do nothing/);
 assert.match(file,/errcode='PT409'/);
 assert.doesNotMatch(file,/execute\s+format\s*\(/i);
});
test('public RPC wrappers are security invoker and private write is definer',()=>{
 assert.match(file,/returns jsonb language plpgsql volatile security definer set search_path = ''/);
 assert.match(file,/returns jsonb language sql stable security invoker set search_path = ''/);
 assert.match(file,/returns jsonb language sql volatile security invoker set search_path = ''/);
});
test('schedule payload is bounded and validates custom assignments',()=>{
 assert.match(file,/jsonb_array_length\(new_document->'assigned'\)<>7/);
 assert.match(file,/jsonb_array_length\(new_document->'plans'\) > 100/);
 assert.match(file,/octet_length\(new_document::text\) > 262144/);
 assert.match(file,/Duplicate workout identifier/);
 assert.match(file,/Unknown assigned workout/);
});
test('not deployed: independent review and isolated transaction tests remain mandatory',()=>{
 assert.match(file,/DO NOT DEPLOY/);
 assert.match(file,/isolated authenticated DB execution and concurrency tests/);
 assert.match(file,/exercise-id allowlist/);
});
