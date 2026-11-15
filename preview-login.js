/* Isolated MYLIFTCOACH preview sign-in. No workout, coach, or scoped data modules run here. */
(()=>{
'use strict';
const form=document.getElementById('loginForm');
const email=document.getElementById('email'),password=document.getElementById('password');
const submit=document.getElementById('submit'),status=document.getElementById('status');
const continueLink=document.getElementById('continue');
const url='https://kirlpjflaoriiusfamsk.supabase.co';
const key='sb_publishable_yYMnCM3k14zaEtpHo4-xkQ_Cd1Aty90';
const sessionKey='prismSupabaseSessionV1';
const message=(value,error=false)=>{status.textContent=value;status.dataset.error=String(error)};
const next=new URL('app.html',location.href);
document.getElementById('toggle').addEventListener('click',()=>{
 const show=password.type==='password';password.type=show?'text':'password';
 document.getElementById('toggle').textContent=show?'Hide':'Show';
});
const request=async(endpoint,body)=>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
 try{
  const response=await fetch(url+'/auth/v1/'+endpoint,{
   method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
   body:JSON.stringify(body),signal:controller.signal,cache:'no-store'
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok){
   const err=new Error(data.error_description||data.msg||data.message||'Sign-in was rejected.');
   err.status=response.status;throw err;
  }
  return data;
 }finally{clearTimeout(timer);}
};
const describe=(error)=>{
 const s=String(error?.message||'');
 if(error?.name==='AbortError')return 'The account service did not respond. Try again.';
 if(error?.status===429)return 'Too many attempts. Try again later.';
 if(/invalid login|invalid credentials/i.test(s))return 'Email or password was not accepted.';
 if(/email not confirmed/i.test(s))return 'Please confirm your email before signing in.';
 if(!error?.status)return 'Could not reach the account service. Check the connection and retry.';
 return s.slice(0,170);
};
form.addEventListener('submit',async event=>{
 event.preventDefault();if(submit.disabled)return;
 submit.disabled=true;submit.textContent='SIGNING IN…';message('Connecting to your account…');
 try{
  const data=await request('token?grant_type=password',{email:email.value.trim(),password:password.value});
  if(!data?.access_token||!data?.user?.id)throw Error('No verified account session was returned.');
  const session={...data,expires_at:data.expires_at||Math.floor(Date.now()/1000)+(data.expires_in||3600)};
  // Same key and session shape as cloud-backup.js. Do not alter scoped workouts.
  window.localStorage.setItem(sessionKey,JSON.stringify(session));
  message('Signed in. Opening your workouts…');
  continueLink.style.display='block';continueLink.href=next.href;
  // Avoid an endless login loop: app.html validates this session itself.
  location.assign(next.href);
 }catch(error){message(describe(error),true);}
 finally{submit.disabled=false;submit.textContent='SIGN IN →';}
});
document.getElementById('reset').addEventListener('click',async()=>{
 if(!email.value.trim()||!email.checkValidity()){message('Enter your email first to reset your password.',true);email.focus();return;}
 try{await request('recover?redirect_to='+encodeURIComponent(new URL('app.html',location.href).href),{email:email.value.trim()});message('If the address is registered, a password reset email will arrive.');}
 catch(error){message(describe(error),true);}
});
// Existing sessions go straight to the integrated app, which performs server verification.
try{const s=JSON.parse(window.localStorage.getItem(sessionKey)||'null');if(!new URL(location.href).searchParams.has('retry')&&s?.access_token&&s?.user?.id)location.replace(next.href);}catch(_){}
})();