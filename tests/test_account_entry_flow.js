const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const storage=new Map();
const localStorage={
  getItem:key=>storage.get(key)??null,
  setItem:(key,value)=>storage.set(key,value),
  removeItem:key=>storage.delete(key),
  get length(){return storage.size},
  key:index=>[...storage.keys()][index]??null
};
const calls=[];
const user={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',email:'qa@example.test'};
const fetch=async(url,options={})=>{
  const target=String(url);calls.push({url:target,method:options.method||'GET',body:options.body});
  if(target.includes('/signup?'))return {ok:true,status:200,json:async()=>({user,session:null})};
  if(target.endsWith('/resend'))return {ok:true,status:200,json:async()=>({})};
  if(target.includes('/recover?'))return {ok:true,status:200,json:async()=>({})};
  if(target.includes('token?grant_type=password'))return {ok:true,status:200,json:async()=>({access_token:'qa-token',refresh_token:'qa-refresh',expires_in:3600,user})};
  if(target.endsWith('/user'))return {ok:true,status:200,json:async()=>user};
  if(target.endsWith('/logout'))return {ok:true,status:204,json:async()=>({})};
  throw Error('Unexpected request '+target);
};
const window={PRISM_SUPABASE_CONFIG:{url:'https://example.supabase.co',publishableKey:'sb_publishable_test'},dispatchEvent(){}};
const context={window,fetch,localStorage,location:{href:'https://myliftcoach.test/app/'},URL,Date,CustomEvent:class{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../cloud-backup.js'),'utf8'),context);

(async()=>{
  const cloud=window.PRISMCloud;
  const signup=await cloud.signUp(user.email,'qa-password-123');
  assert.equal(signup.session,null,'unconfirmed signup must not create a local session');
  assert.equal(cloud.hasSession(),false);
  await cloud.resendSignup(user.email);
  await cloud.recoverPassword(user.email);
  await cloud.signIn(user.email,'qa-password-123');
  assert.equal(cloud.hasSession(),true);
  assert.equal((await cloud.currentUser()).id,user.id);
  await cloud.signOut();
  assert.equal(cloud.hasSession(),false);
  assert.ok(calls.some(call=>call.url.endsWith('/resend')),'verification resend endpoint must be available');
  assert.ok(calls.some(call=>call.url.includes('/recover?')),'password recovery endpoint must be available');

  const ui=fs.readFileSync(path.join(__dirname,'../persistence/account-ui.js'),'utf8');
  for(const token of ['liftovaForgot','liftovaPasswordToggle','liftovaVerify','liftovaResend','friendlyAuthError','continueNewAccountOnboarding'])assert.ok(ui.includes(token),`account UI must include ${token}`);
  assert.ok(ui.includes("journey?.status==='welcome'"),'new verified accounts must hand off directly to onboarding');
  assert.ok(ui.includes('saved to your MYLIFTCOACH account'),'signed-in onboarding copy must describe account persistence');
  console.log('Account entry flow: signup verification, resend, recovery, sign-in/out and onboarding handoff OK.');
})().catch(error=>{console.error(error);process.exitCode=1;});
