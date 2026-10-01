const assert=require('node:assert/strict');
const fs=require('node:fs');

function config(){
 const raw=fs.readFileSync('supabase-config.js','utf8');
 const url=process.env.MYLIFTCOACH_SUPABASE_URL||raw.match(/url:\s*"([^"]+)"/)?.[1];
 const key=process.env.MYLIFTCOACH_SUPABASE_PUBLISHABLE_KEY||raw.match(/publishableKey:\s*"([^"]+)"/)?.[1];
 if(!url||!key)throw Error('Supabase URL/publishable key unavailable');
 return {url,key};
}
const {url,key}=config();
const creds={
 A:{email:process.env.MYLIFTCOACH_TEST_A_EMAIL,password:process.env.MYLIFTCOACH_TEST_A_PASSWORD},
 B:{email:process.env.MYLIFTCOACH_TEST_B_EMAIL,password:process.env.MYLIFTCOACH_TEST_B_PASSWORD}
};
for(const [name,c] of Object.entries(creds))if(!c.email||!c.password)throw Error(`Missing live ${name} test account credentials`);
const json=async r=>{const body=await r.text();let parsed=null;try{parsed=body?JSON.parse(body):null}catch{}if(!r.ok)throw Object.assign(Error(parsed?.message||parsed?.error_description||body||`HTTP ${r.status}`),{status:r.status});return parsed};
async function signIn({email,password}){
 const r=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 const s=await json(r);assert(s?.access_token&&s?.user?.id,'authenticated session required');return {token:s.access_token,userId:s.user.id};
}
const headers=s=>({apikey:key,Authorization:`Bearer ${s.token}`,'Content-Type':'application/json'});
async function rows(s,table,query=''){
 const r=await fetch(`${url}/rest/v1/${table}?${query}`,{headers:headers(s),cache:'no-store'});const v=await json(r);assert(Array.isArray(v));return v;
}
const tables=['prism_account_interventions','prism_account_outcomes','prism_account_adaptive','prism_account_athlete_preferences','prism_account_profile','prism_account_sessions','prism_account_goals'];
async function fingerprint(s){
 const out={};for(const t of tables){const r=await rows(s,t,'select=user_id,id,updated_at&order=id.asc&limit=1000');assert(r.every(x=>x.user_id===s.userId),`${t}: foreign row leaked`);out[t]=r.map(x=>`${x.id}|${x.updated_at||''}`);}return out;
}
async function assertCrossReadHidden(actor,other){
 for(const t of tables){const r=await rows(actor,t,`user_id=eq.${encodeURIComponent(other.userId)}&select=user_id,id&limit=5`);assert.equal(r.length,0,`${t}: cross-account read visible`);}
}
async function findTarget(s){for(const t of tables){const r=await rows(s,t,'select=user_id,id,updated_at&limit=1');if(r[0])return {table:t,row:r[0]};}return null;}
async function assertCrossUpdateNoop(actor,targetOwner,target){
 if(!target)return {skipped:true};
 const {table,row}=target;const q=`user_id=eq.${encodeURIComponent(targetOwner.userId)}&id=eq.${encodeURIComponent(row.id)}&select=user_id,id,updated_at`;
 const r=await fetch(`${url}/rest/v1/${table}?${q}`,{method:'PATCH',headers:{...headers(actor),Prefer:'return=representation'},body:JSON.stringify({updated_at:row.updated_at})});
 const v=await json(r);assert(Array.isArray(v));assert.equal(v.length,0,`${table}: foreign update reached a row`);return {skipped:false,table};
}
(async()=>{
 const A1=await signIn(creds.A),B=await signIn(creds.B);assert.notEqual(A1.userId,B.userId,'A and B must be different accounts');
 const aBefore=await fingerprint(A1),bBefore=await fingerprint(B);
 await assertCrossReadHidden(A1,B);await assertCrossReadHidden(B,A1);
 const aTarget=await findTarget(A1),bTarget=await findTarget(B);
 const aToB=await assertCrossUpdateNoop(A1,B,bTarget);const bToA=await assertCrossUpdateNoop(B,A1,aTarget);
 const A2=await signIn(creds.A);assert.equal(A2.userId,A1.userId,'second-device A identity mismatch');
 assert.deepEqual(await fingerprint(A2),aBefore,'A second-device restore differs');
 assert.deepEqual(await fingerprint(A1),aBefore,'A changed after A→B→A');
 assert.deepEqual(await fingerprint(B),bBefore,'B changed during A validation');
 console.log(JSON.stringify({status:'PASS',accountsDistinct:true,crossReadsHidden:true,aToBUpdate:aToB.skipped?'no_target':'blocked',bToAUpdate:bToA.skipped?'no_target':'blocked',aSecondSessionMatches:true,aRestoredAfterABA:true},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
