const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const storage=new Map();
const localStorage={getItem:key=>storage.get(key)??null,setItem:(key,val)=>storage.set(key,val),removeItem:key=>storage.delete(key)};
const calls=[];let rejectUser=false;
const fetch=async(url,options={})=>{
 calls.push({url:String(url),method:options.method||'GET',cache:options.cache});
 if(String(url).includes('token?grant_type=refresh_token'))return {ok:true,json:async()=>({access_token:'new-token',refresh_token:'new-refresh',expires_in:3600,user:{id:'account-a'}})};
 if(String(url).endsWith('/user'))return rejectUser?{ok:false,status:401}:{ok:true,json:async()=>({id:'account-a'})};
 if(String(url).endsWith('/logout'))return {ok:true,status:204};
 throw Error('Unexpected request '+url);
};
const window={PRISM_SUPABASE_CONFIG:{url:'https://example.supabase.co',publishableKey:'sb_publishable_test'},dispatchEvent(){}};
const context={window,fetch,localStorage,Date,CustomEvent:class{}};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../cloud-backup.js'),'utf8'),context);
async function run(){
 storage.set('prismSupabaseSessionV1',JSON.stringify({access_token:'old-token',refresh_token:'old-refresh',expires_at:1,user:{id:'account-a'}}));
 const user=await window.PRISMCloud.currentUser();assert.equal(user.id,'account-a');
 assert.equal(JSON.parse(storage.get('prismSupabaseSessionV1')).access_token,'new-token');
 assert.ok(JSON.parse(storage.get('prismSupabaseSessionV1')).expires_at>Math.floor(Date.now()/1000)+3000,'refresh replaces stale expiry');
 assert.equal(calls.at(-1).cache,'no-store','user verification is never cached');
 await window.PRISMCloud.signOut();assert.equal(storage.has('prismSupabaseSessionV1'),false);
 assert.equal(calls.at(-1).method,'POST');assert.ok(calls.at(-1).url.endsWith('/logout'));
 storage.set('prismSupabaseSessionV1',JSON.stringify({access_token:'revoked',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'account-a'}}));
 rejectUser=true;assert.equal(await window.PRISMCloud.currentUser(),null);assert.equal(storage.has('prismSupabaseSessionV1'),false,'revoked session is cleared');
 console.log('Cloud session: refresh, new expiry, no-store verification, server sign-out and revocation pass.');
}
run().catch(err=>{console.error(err);process.exitCode=1});
