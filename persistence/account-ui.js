/* MYLIFTCOACH account controls. Account authentication is the first-run gate. */
(() => {
  'use strict';
  const host=document.getElementById('prismCloudAccount');
  const manager=window.PRISMDeviceStore,cloud=window.PRISMCloud,config=window.PRISM_SUPABASE_CONFIG;
  if(!host||!manager||!cloud||!config||!window.PRISMAccountController){document.documentElement.classList.remove('prism-account-booting');return;}
  let controller=null,accountEmail='',claimAvailable=false,legacyBackup=null,photos=null,inFlight=false;
  const accountStatus=(message,isError=false)=>{const output=document.querySelector('#liftovaAuthStatus')||host.querySelector('#prismAccountStatus');if(output){output.textContent=message;output.dataset.error=String(isError);}};
  const friendlyAuthError=(error,fallback)=>{
    const status=Number(error?.status)||0,message=String(error?.message||'').toLowerCase();
    if(status===429||message.includes('rate limit'))return 'Too many attempts. Wait a moment and try again.';
    if(message.includes('invalid login')||message.includes('invalid credentials'))return 'That email or password is not correct.';
    if(message.includes('email not confirmed'))return 'Confirm your email first, then sign in.';
    if(message.includes('already registered')||message.includes('already been registered'))return 'An account already exists for that email. Sign in instead.';
    if(status>=500)return 'MYLIFTCOACH could not reach the account service. Try again shortly.';
    return fallback;
  };
  function injectAuthStyles(){if(document.getElementById('myliftcoachAuthStyles'))return;const style=document.createElement('style');style.id='myliftcoachAuthStyles';style.textContent=`
    body.liftova-auth-locked{overflow:hidden!important;padding:0!important;background:#fbf8f0!important}
    body.liftova-auth-locked>header,body.liftova-auth-locked>.container,body.liftova-auth-locked>.bottom-nav{visibility:hidden!important}
    #liftovaAuthGate{position:fixed;inset:0;z-index:999999;background:radial-gradient(circle at 50% 18%,rgba(169,37,255,.22),transparent 34%),linear-gradient(rgba(5,5,10,.74),rgba(5,5,10,.94)),linear-gradient(135deg,#fffefa,#eee8dc);color:#092c38;overflow:auto;padding:calc(28px + env(safe-area-inset-top)) 22px calc(28px + env(safe-area-inset-bottom));font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',Arial,sans-serif}
    .liftova-auth-shell{position:relative;max-width:460px;min-height:calc(100vh - 56px);margin:auto;display:flex;flex-direction:column;justify-content:center}
    .myliftcoach-auth-logo{display:block;width:104px;height:104px;object-fit:contain;margin:0 auto 13px;border-radius:24px;filter:drop-shadow(0 0 18px rgba(169,37,255,.34))}
    .liftova-brand{text-align:center;margin-bottom:24px}.liftova-brand h1{margin:0;font-size:31px;letter-spacing:.06em;font-weight:850;color:#092c38}.liftova-brand p{margin:7px 0 0;font-size:11px;letter-spacing:.3em;color:#557076}.liftova-brand p b{color:#00a9b8}
    .liftova-auth-card{background:rgba(10,10,18,.9);border:1px solid rgba(169,37,255,.44);border-radius:26px;padding:22px;box-shadow:0 18px 70px rgba(0,0,0,.48);backdrop-filter:blur(16px)}
    .liftova-auth-card h2{font-size:27px;margin:0 0 6px;text-align:center}.liftova-auth-card>.sub{margin:0 0 20px;text-align:center;color:#48676e;font-size:14px;line-height:1.45}
    .liftova-auth-tabs{display:grid;grid-template-columns:1fr 1fr;background:#f6f1e7;border:1px solid #dac9ae;border-radius:15px;padding:4px;margin-bottom:18px}.liftova-auth-tab{border:0!important;border-radius:11px!important;background:transparent!important;color:#47666b!important;min-height:44px;font-weight:750!important}.liftova-auth-tab.active{background:linear-gradient(135deg,#003b49,#00a9b8)!important;color:#092c38!important}
    .liftova-field{margin:12px 0}.liftova-field label{display:block;margin:0 0 7px!important;color:#234650;font-size:12px;font-weight:700;letter-spacing:.06em}.liftova-field input{width:100%!important;background:#ffffff!important;color:#092c38!important;border:1px solid #d9d1c4!important;border-radius:14px!important;min-height:52px!important;padding:0 15px!important;font-size:16px!important;outline:none}.liftova-field input:focus{border-color:#00a9b8!important;box-shadow:0 0 0 3px rgba(169,37,255,.13)}
    .liftova-password-wrap{position:relative}.liftova-password-wrap input{padding-right:72px!important}.liftova-password-toggle{position:absolute;right:7px;top:7px;min-height:38px!important;padding:0 10px!important;border:0!important;border-radius:10px!important;background:#eaf7f6!important;color:#17434d!important;font-size:12px!important;font-weight:700!important}
    .liftova-submit{width:100%;min-height:54px;margin-top:8px;border:0!important;border-radius:15px!important;background:linear-gradient(135deg,#003b49,#00a9b8)!important;color:#092c38!important;font-size:16px!important;font-weight:800!important;letter-spacing:.08em!important}.liftova-submit:disabled{opacity:.58}.liftova-auth-link{display:block;margin:10px auto 0;min-height:42px;border:0;background:transparent;color:#007f91;font:inherit;font-size:13px;font-weight:700}.liftova-auth-note{margin:14px 0 0;color:#647c7e;font-size:11px;line-height:1.45;text-align:center}.liftova-auth-status{min-height:20px;margin:13px 0 0;text-align:center;font-size:13px;color:#48676e}.liftova-auth-status[data-error='true']{color:#c2394e}.liftova-auth-status[data-error='false']{color:#087b69}.liftova-verify-actions{display:grid;gap:8px;margin-top:14px}.liftova-verify-actions button{min-height:48px;border-radius:13px;font:inherit;font-weight:750}.liftova-verify-actions .primary{border:0;background:#005768;color:#092c38}.liftova-verify-actions .secondary{border:1px solid #d9d1c4;background:#ffffff;color:#17434d}
    @media(max-width:390px){.liftova-brand h1{font-size:27px}.liftova-auth-card{padding:18px}.liftova-auth-shell{justify-content:flex-start;padding-top:5vh}.myliftcoach-auth-logo{width:92px;height:92px}}
  
    /* Auth gate is created dynamically: first paint must already use approved marble styling. */
    body.liftova-auth-locked{background:#fbf8f0!important}
    #liftovaAuthGate{background:radial-gradient(circle at 85% 0%,rgba(19,214,222,.18),transparent 38%),repeating-linear-gradient(115deg,transparent 0 145px,rgba(194,157,107,.08) 146px,transparent 148px 310px),linear-gradient(135deg,#fffefa,#eee8dc)!important;color:#092c38!important}
    .liftova-auth-card{background:#fffdf8!important;border:1px solid #ddcdb4!important;box-shadow:0 16px 36px rgba(3,49,62,.09)!important}
    .liftova-brand h1,.liftova-auth-card h2{font-family:Georgia,serif!important;font-weight:500!important;color:#092c38!important}
    .liftova-brand p,.liftova-auth-card>.sub,.liftova-auth-note,.liftova-auth-status{color:#47666b!important}
    .liftova-auth-tab.active,.liftova-submit{background:linear-gradient(135deg,#003b49,#006a77)!important;color:white!important}
    .liftova-field input{background:white!important;color:#092c38!important;border-color:#d9d1c4!important}
    .liftova-field label{color:#234650!important}

    /* Preview login refinement: one visual language, no legacy purple overlay. */
    #liftovaAuthGate{background:radial-gradient(ellipse at 80% 0%,rgba(0,186,191,.12),transparent 42%),linear-gradient(150deg,#fffefa 0%,#f7f3e9 62%,#e9f2ed 100%)!important}
    #liftovaAuthGate .liftova-auth-shell{max-width:420px!important}
    #liftovaAuthGate .liftova-brand{margin-bottom:27px!important}
    #liftovaAuthGate .myliftcoach-auth-logo{width:78px!important;height:78px!important;border-radius:20px!important;filter:drop-shadow(0 7px 15px rgba(3,58,66,.16))!important}
    #liftovaAuthGate .liftova-brand h1{font-family:Georgia,serif!important;font-size:29px!important;letter-spacing:.12em!important;font-weight:500!important}
    #liftovaAuthGate .liftova-brand p{letter-spacing:.24em!important;font-size:10px!important}
    #liftovaAuthGate .liftova-auth-card{background:rgba(255,254,250,.98)!important;border:1px solid #ddcfb8!important;border-radius:24px!important;padding:26px 23px!important;box-shadow:0 20px 50px rgba(0,48,57,.08)!important;backdrop-filter:none!important}
    #liftovaAuthGate .liftova-auth-card h2{font-size:27px!important}
    #liftovaAuthGate .liftova-auth-tabs{background:#f3f1e9!important;border:1px solid #ded6c7!important}
    #liftovaAuthGate .liftova-auth-tab{color:#34535b!important;background:transparent!important}
    #liftovaAuthGate .liftova-auth-tab.active{background:#004958!important;color:#fff!important;box-shadow:0 3px 9px rgba(0,58,71,.15)!important}
    #liftovaAuthGate .liftova-field input{background:#fff!important;color:#092c38!important;border:1px solid #d8d5cc!important}
    #liftovaAuthGate .liftova-field input:focus{border-color:#008d9c!important;box-shadow:0 0 0 3px rgba(0,163,179,.14)!important}
    #liftovaAuthGate .liftova-submit{background:linear-gradient(120deg,#003c4a,#006b77)!important;color:#fff!important;border:1px solid #bda27a!important}
    #liftovaAuthGate .liftova-auth-note{font-weight:400!important}
    #liftovaAuthGate .liftova-verify-actions .primary{color:#fff!important}
    #liftovaAuthGate [hidden]{display:none!important}

    /* Approved teal / ivory marble direction: replace the generic pale login layout. */
    #liftovaAuthGate{
      background:
        radial-gradient(ellipse at 5% 86%,rgba(255,255,255,.98) 0%,rgba(250,246,236,.96) 17%,transparent 43%),
        repeating-linear-gradient(126deg,transparent 0 112px,rgba(205,159,90,.5) 113px,rgba(255,240,189,.82) 114px,transparent 116px,transparent 225px),
        radial-gradient(ellipse at 90% 8%,rgba(16,125,135,.85),transparent 52%),
        radial-gradient(ellipse at 12% 45%,rgba(3,33,47,.94),transparent 66%),
        linear-gradient(153deg,#00303b 0%,#004c58 49%,#f5f0e6 82%,#fffaf1 100%)!important;
      color:#fdfbf4!important;
    }
    #liftovaAuthGate .liftova-auth-shell{justify-content:flex-start!important;padding-top:clamp(20px,5vh,65px)!important}
    #liftovaAuthGate .liftova-brand{margin-bottom:26px!important}
    #liftovaAuthGate .liftova-brand h1{color:#fffdf6!important;text-shadow:0 2px 14px rgba(0,23,34,.5)!important;font-size:clamp(28px,7vw,38px)!important;text-transform:lowercase!important;letter-spacing:-.045em!important}
    #liftovaAuthGate .liftova-brand p{color:#e7e3d7!important;letter-spacing:.2em!important;text-shadow:0 2px 9px rgba(0,23,34,.55)!important}
    #liftovaAuthGate .liftova-brand p b{color:#37d4dc!important}
    #liftovaAuthGate .liftova-auth-card{background:rgba(255,252,245,.96)!important;border:1px solid rgba(207,171,111,.78)!important;box-shadow:0 22px 65px rgba(0,23,33,.28)!important;border-radius:23px!important}
    #liftovaAuthGate .liftova-auth-card h2{color:#062c3a!important}
    #liftovaAuthGate .liftova-auth-tabs{background:#edf0e9!important;border-color:#cbb991!important}
    #liftovaAuthGate .liftova-auth-tab{background:transparent!important;color:#37555c!important}
    #liftovaAuthGate .liftova-auth-tab.active{background:linear-gradient(130deg,#003b4a,#007887)!important;color:#fff!important}
    #liftovaAuthGate .liftova-field input{background:#fffefa!important;color:#062c3a!important;border:1px solid #cfc9b9!important}
    #liftovaAuthGate .liftova-field input::placeholder{color:#8c9998!important}
    #liftovaAuthGate .liftova-submit{background:linear-gradient(120deg,#003a48,#007482)!important;color:#fff!important;border:1px solid #c7a66f!important}
    #liftovaAuthGate .liftova-auth-note{color:#49636b!important}
    @media(max-width:430px){#liftovaAuthGate .liftova-auth-shell{padding-top:14px!important}#liftovaAuthGate .liftova-brand{margin-bottom:18px!important}#liftovaAuthGate .liftova-auth-card{padding:22px 19px!important}}

    /* Approved login: marble backdrop, emblem and refined serif lettering. */
    #liftovaAuthGate{background:#002f3a url('images/luxury-teal-marble.svg?v=2') center center/cover no-repeat!important;color:#fffdf5!important}
    #liftovaAuthGate .liftova-auth-shell{max-width:430px!important;min-height:calc(100dvh - 100px)!important;padding-top:12px!important;justify-content:center!important}
    #liftovaAuthGate .liftova-brand{margin-bottom:20px!important}
    #liftovaAuthGate .myliftcoach-auth-logo{width:min(67vw,255px)!important;height:145px!important;object-fit:contain!important;margin:0 auto -3px!important;border-radius:0!important;filter:drop-shadow(0 8px 12px rgba(0,14,21,.6))!important}
    #liftovaAuthGate .liftova-brand h1{font-family:'Bodoni MT','Didot','Times New Roman',Georgia,serif!important;font-weight:400!important;text-transform:lowercase!important;font-size:clamp(39px,10vw,58px)!important;letter-spacing:-.075em!important;line-height:1.05!important;text-shadow:0 3px 12px rgba(0,17,22,.75)!important}
    #liftovaAuthGate .luxury-my,#liftovaAuthGate .luxury-coach{color:#f9e8c0!important}
    #liftovaAuthGate .luxury-lift{color:#36d8d7!important}
    #liftovaAuthGate .liftova-brand p{color:#f7ebd4!important;font-family:Georgia,serif!important;font-size:11px!important;letter-spacing:.27em!important;margin-top:11px!important}
    #liftovaAuthGate .liftova-auth-card{background:linear-gradient(130deg,rgba(0,32,40,.87),rgba(0,23,31,.86))!important;border:1.5px solid #c9a16a!important;border-radius:27px!important;box-shadow:0 16px 46px rgba(0,16,24,.35),inset 0 1px 0 rgba(255,232,181,.2)!important;backdrop-filter:blur(14px)!important}
    #liftovaAuthGate .liftova-auth-card h2{font-family:'Bodoni MT','Didot',Georgia,serif!important;color:#fff2d7!important;font-size:clamp(30px,8vw,42px)!important;font-weight:400!important}
    #liftovaAuthGate .liftova-auth-card>.sub{color:#eee5d6!important;font-family:Georgia,serif!important}
    #liftovaAuthGate .liftova-auth-tabs{background:rgba(0,22,30,.6)!important;border:1px solid rgba(204,171,110,.35)!important}
    #liftovaAuthGate .liftova-auth-tab{color:#e4d7c4!important;font-family:Georgia,serif!important;font-size:18px!important;font-weight:400!important}
    #liftovaAuthGate .liftova-auth-tab.active{background:linear-gradient(130deg,#003e4a,#007382)!important;color:#fff5df!important;border:1px solid #c9a16a!important;box-shadow:inset 0 1px 0 rgba(255,231,178,.2)!important}
    #liftovaAuthGate .liftova-field label{color:#e9dcc3!important;font-family:Georgia,serif!important;letter-spacing:.18em!important}
    #liftovaAuthGate .liftova-field input{background:rgba(0,25,33,.8)!important;color:#fff9ea!important;border:1.2px solid #c9a16a!important;font-family:Georgia,serif!important}
    #liftovaAuthGate .liftova-field input::placeholder{color:#bcb7af!important}
    #liftovaAuthGate .liftova-field input:focus{border-color:#f2cf91!important;box-shadow:0 0 0 3px rgba(204,167,102,.16)!important}
    #liftovaAuthGate .liftova-password-toggle{background:rgba(0,66,74,.9)!important;color:#fff2d4!important}
    #liftovaAuthGate .liftova-submit{background:linear-gradient(120deg,#003b49,#006b79)!important;border:1.5px solid #d5af70!important;color:#fff3dc!important;font-family:Georgia,serif!important;font-size:19px!important;font-weight:500!important;letter-spacing:.13em!important}
    #liftovaAuthGate .liftova-auth-link{color:#f2dfb8!important;font-family:Georgia,serif!important;text-decoration:underline;text-underline-offset:5px}
    #liftovaAuthGate .liftova-auth-note{color:#c5d4d1!important}
    #liftovaAuthGate .liftova-auth-status{color:#dce9e5!important}
    @media(max-height:730px){#liftovaAuthGate .myliftcoach-auth-logo{height:104px!important}#liftovaAuthGate .liftova-auth-card{padding:17px!important}#liftovaAuthGate .liftova-brand{margin-bottom:12px!important}}

    /* Material depth pass: retain actual interactive inputs and existing layout. */
    #liftovaAuthGate .liftova-auth-card{background:linear-gradient(115deg,rgba(1,35,44,.80),rgba(0,14,23,.91) 68%,rgba(2,39,47,.78))!important;box-shadow:0 24px 58px rgba(0,10,16,.6),0 0 22px rgba(227,175,89,.15),inset 0 1px 0 rgba(255,236,188,.55),inset 0 -1px 0 rgba(255,226,166,.22)!important}
    #liftovaAuthGate .liftova-brand h1{text-shadow:0 2px 0 #73542c,0 3px 4px rgba(0,0,0,.9),0 0 22px rgba(255,214,134,.3)!important}
    #liftovaAuthGate .myliftcoach-auth-logo{filter:drop-shadow(0 10px 9px rgba(0,8,16,.8)) drop-shadow(0 0 11px rgba(252,200,105,.26))!important}
    #liftovaAuthGate .liftova-submit{box-shadow:0 6px 0 rgba(0,19,27,.65),0 0 17px rgba(226,173,88,.22),inset 0 1px 0 rgba(255,242,199,.55)!important}
    #liftovaAuthGate .liftova-field input{box-shadow:inset 0 2px 7px rgba(0,8,14,.65),0 1px 0 rgba(255,232,179,.13)!important}
    #liftovaAuthGate .liftova-auth-tab.active{box-shadow:inset 0 1px 0 rgba(255,237,179,.6),0 2px 10px rgba(0,8,15,.4)!important}

    /* Approved photorealistic brand crop from original generated artwork. */
    #liftovaAuthGate .liftova-brand{margin-bottom:12px!important}
    #liftovaAuthGate .myliftcoach-auth-logo{display:block!important;width:min(100%,375px)!important;height:auto!important;max-height:none!important;aspect-ratio:auto!important;object-fit:contain!important;border-radius:0!important;margin:0 auto!important;filter:drop-shadow(0 8px 16px rgba(0,15,22,.4))!important}
    #liftovaAuthGate .liftova-brand h1,#liftovaAuthGate .liftova-brand p{display:none!important}
    #liftovaAuthGate .liftova-auth-shell{padding-top:10px!important}
    @media(max-height:750px){#liftovaAuthGate .myliftcoach-auth-logo{width:min(82%,315px)!important}}

    /* Seamless photographic brand treatment; remove the pasted-on rectangular image. */
    #liftovaAuthGate{background-color:#001e2b!important;background-image:
      linear-gradient(180deg,rgba(0,13,20,.15),rgba(0,13,20,.02) 45%,rgba(0,13,20,.08)),
      url('images/luxury-teal-marble.svg?v=2')!important;background-position:center top!important;background-size:cover!important}
    #liftovaAuthGate .liftova-brand{isolation:isolate;position:relative;margin-bottom:4px!important}
    #liftovaAuthGate .myliftcoach-auth-logo{
      width:min(100%,410px)!important;
      height:auto!important;
      max-height:none!important;
      display:block!important;
      mix-blend-mode:lighten!important;
      -webkit-mask-image:radial-gradient(ellipse 67% 66% at 50% 48%,#000 44%,rgba(0,0,0,.93) 63%,transparent 99%)!important;
      mask-image:radial-gradient(ellipse 67% 66% at 50% 48%,#000 44%,rgba(0,0,0,.93) 63%,transparent 99%)!important;
      filter:drop-shadow(0 5px 10px rgba(0,12,18,.25))!important;
    }
    #liftovaAuthGate .liftova-auth-card{position:relative;z-index:1;background:linear-gradient(125deg,rgba(0,33,42,.80),rgba(0,14,22,.88) 70%,rgba(0,46,54,.78))!important;border:1.5px solid rgba(239,192,113,.92)!important;box-shadow:0 20px 48px rgba(0,9,15,.5),inset 0 1px 0 rgba(255,232,180,.45)!important}
    #liftovaAuthGate .liftova-auth-shell{justify-content:flex-start!important;padding-top:clamp(12px,3vh,38px)!important}
    #liftovaAuthGate .liftova-auth-tab.active{background:linear-gradient(135deg,rgba(0,67,79,.93),rgba(0,122,134,.9))!important}
    #liftovaAuthGate .liftova-submit{background:linear-gradient(115deg,#003743 0%,#006b78 58%,#003e4d 100%)!important}
    @media(max-width:430px){#liftovaAuthGate{padding-left:15px!important;padding-right:15px!important}#liftovaAuthGate .liftova-auth-card{padding:20px!important}#liftovaAuthGate .myliftcoach-auth-logo{width:min(100%,385px)!important}}
`;document.head.appendChild(style);}
  function showAuthGate(){injectAuthStyles();document.body.classList.add('liftova-auth-locked');host.innerHTML='';document.getElementById('liftovaAuthGate')?.remove();const gate=document.createElement('section');gate.id='liftovaAuthGate';gate.innerHTML=`<div class="liftova-auth-shell"><div class="liftova-brand"><img class="myliftcoach-auth-logo" src="images/myliftcoach-luxury-brand.webp?v=1" alt="MYLIFTCOACH M barbell emblem"><h1><span class="luxury-my">my</span><span class="luxury-lift">lift</span><span class="luxury-coach">coach</span></h1><p>TRAIN <b>•</b> TRACK <b>•</b> PROGRESS</p></div><div class="liftova-auth-card"><h2 id="liftovaAuthHeading">Welcome back</h2><p class="sub" id="liftovaAuthSub">Sign in to continue your training.</p><div class="liftova-auth-tabs" id="liftovaAuthTabs" role="tablist" aria-label="Account action"><button type="button" class="liftova-auth-tab active" id="liftovaSignInTab">Sign In</button><button type="button" class="liftova-auth-tab" id="liftovaSignUpTab">Sign Up</button></div><form id="liftovaAuthForm"><div class="liftova-field"><label for="liftovaEmail">EMAIL</label><input id="liftovaEmail" name="email" type="email" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" placeholder="you@example.com" required></div><div class="liftova-field"><label for="liftovaPassword">PASSWORD</label><div class="liftova-password-wrap"><input id="liftovaPassword" name="password" type="password" autocomplete="current-password" placeholder="••••••••" minlength="6" required><button type="button" class="liftova-password-toggle" id="liftovaPasswordToggle" aria-label="Show password">Show</button></div></div><div class="liftova-field" id="liftovaConfirmWrap" hidden><label for="liftovaConfirm">CONFIRM PASSWORD</label><div class="liftova-password-wrap"><input id="liftovaConfirm" name="confirm" type="password" autocomplete="new-password" placeholder="••••••••" minlength="6"><button type="button" class="liftova-password-toggle" id="liftovaConfirmToggle" aria-label="Show confirm password">Show</button></div></div><button class="liftova-submit" type="submit" id="liftovaSubmit">SIGN IN →</button><button class="liftova-auth-link" type="button" id="liftovaForgot">Forgot password?</button></form><div id="liftovaVerify" hidden><p class="sub">We sent a confirmation link to <strong id="liftovaVerifyEmail"></strong>. Open it, then come back and sign in.</p><div class="liftova-verify-actions"><button class="primary" type="button" id="liftovaVerifySignIn">I confirmed my email · Sign in</button><button class="secondary" type="button" id="liftovaResend">Resend confirmation email</button></div></div><p id="liftovaAuthStatus" class="liftova-auth-status" role="status" aria-live="polite"></p><p class="liftova-auth-note">Your MYLIFTCOACH account keeps your training data tied to you across supported devices.</p></div></div>`;document.body.appendChild(gate);
    const form=gate.querySelector('#liftovaAuthForm'),tabs=gate.querySelector('#liftovaAuthTabs'),signInTab=gate.querySelector('#liftovaSignInTab'),signUpTab=gate.querySelector('#liftovaSignUpTab'),confirmWrap=gate.querySelector('#liftovaConfirmWrap'),confirmInput=gate.querySelector('#liftovaConfirm'),heading=gate.querySelector('#liftovaAuthHeading'),sub=gate.querySelector('#liftovaAuthSub'),submit=gate.querySelector('#liftovaSubmit'),forgot=gate.querySelector('#liftovaForgot'),verify=gate.querySelector('#liftovaVerify'),verifyEmail=gate.querySelector('#liftovaVerifyEmail'),verifySignIn=gate.querySelector('#liftovaVerifySignIn'),resend=gate.querySelector('#liftovaResend');let mode='signin',pendingEmail='';
    const setBusy=(busy,label)=>{inFlight=busy;submit.disabled=busy;signInTab.disabled=busy;signUpTab.disabled=busy;forgot.disabled=busy;if(label)submit.textContent=label;submit.setAttribute('aria-busy',String(busy));};
    const setVisibility=(input,button)=>{const showing=input.type==='text';input.type=showing?'password':'text';button.textContent=showing?'Show':'Hide';button.setAttribute('aria-label',showing?'Show password':'Hide password');};
    gate.querySelector('#liftovaPasswordToggle').addEventListener('click',()=>setVisibility(form.elements.password,gate.querySelector('#liftovaPasswordToggle')));gate.querySelector('#liftovaConfirmToggle').addEventListener('click',()=>setVisibility(confirmInput,gate.querySelector('#liftovaConfirmToggle')));
    const setMode=next=>{mode=next;const signup=mode==='signup';form.hidden=false;verify.hidden=true;tabs.hidden=false;signInTab.classList.toggle('active',!signup);signUpTab.classList.toggle('active',signup);confirmWrap.hidden=!signup;confirmInput.required=signup;form.elements.password.autocomplete=signup?'new-password':'current-password';heading.textContent=signup?'Create your account':'Welcome back';sub.textContent=signup?'Start your journey and make your training yours.':'Sign in to continue your training.';forgot.hidden=signup;submit.textContent=signup?'CREATE ACCOUNT →':'SIGN IN →';accountStatus('');};
    const showVerification=email=>{pendingEmail=email;form.hidden=true;tabs.hidden=true;verify.hidden=false;verifyEmail.textContent=email;heading.textContent='Confirm your email';sub.textContent='One quick step before setup.';accountStatus('Check your inbox for your MYLIFTCOACH confirmation link.');};
    signInTab.addEventListener('click',()=>setMode('signin'));signUpTab.addEventListener('click',()=>setMode('signup'));verifySignIn.addEventListener('click',()=>{setMode('signin');form.elements.email.value=pendingEmail;form.elements.password.focus();});
    resend.addEventListener('click',async()=>{if(inFlight||!pendingEmail)return;inFlight=true;resend.disabled=true;try{await cloud.resendSignup(pendingEmail);accountStatus('Confirmation email sent again.');}catch(error){accountStatus(friendlyAuthError(error,'Could not resend the confirmation email. Try again.'),true);}finally{inFlight=false;resend.disabled=false;}});
    forgot.addEventListener('click',async()=>{if(inFlight)return;const email=form.elements.email.value.trim();if(!email||!form.elements.email.checkValidity()){accountStatus('Enter your email first, then tap Forgot password.',true);form.elements.email.focus();return;}inFlight=true;forgot.disabled=true;try{await cloud.recoverPassword(email);accountStatus('Password reset email sent. Check your inbox.');}catch(error){accountStatus(friendlyAuthError(error,'Could not send the reset email. Try again.'),true);}finally{inFlight=false;forgot.disabled=false;}});
    form.addEventListener('submit',async event=>{event.preventDefault();if(inFlight)return;const email=form.elements.email.value.trim(),password=form.elements.password.value;if(!email||!form.elements.email.checkValidity()||password.length<6){accountStatus('Enter a valid email and a password of at least 6 characters.',true);return;}if(mode==='signup'&&password!==form.elements.confirm.value){accountStatus('Passwords do not match.',true);return;}const label=mode==='signup'?'CREATING ACCOUNT…':'SIGNING IN…';setBusy(true,label);try{if(mode==='signin'){await cloud.signIn(email,password);const user=await cloud.currentUser();if(!user?.id)throw Error('Sign-in could not be verified. Please try again.');location.reload();}else{const result=await cloud.signUp(email,password);if(result.access_token)location.reload();else showVerification(email);}}catch(error){accountStatus(friendlyAuthError(error,mode==='signin'?'Could not sign in. Check your details and try again.':'Could not create the account. Check your details and try again.'),true);}finally{setBusy(false,mode==='signup'?'CREATE ACCOUNT →':'SIGN IN →');}});
  }
  function renderAccountPanel(){host.innerHTML=`<div class="card"><h3>MYLIFTCOACH account</h3><p id="prismAccountIdentity" class="small"></p><p id="prismAccountStatus" class="small" role="status">Checking your account…</p><div id="prismGuestClaim" hidden><p class="small">This account is empty. Move the workout, profile, goal and Coach data already on this device into this account?</p><button type="button" id="prismClaimGuest">Move my device data</button><button type="button" id="prismKeepSeparate">Keep guest data separate</button><button type="button" id="prismImportLegacy" hidden>Import older cloud backup</button></div><div id="prismGuestPhotos" hidden><p class="small">Photos saved before sign-in are still on this device. Choose to copy them into this account and its private photo storage.</p><button type="button" id="prismClaimPhotos">Move my device photos</button></div><button type="button" id="prismAccountSignOut">Sign out</button></div>`;host.querySelector('#prismAccountIdentity').textContent=accountEmail?`Signed in as ${accountEmail}`:'Signed in to MYLIFTCOACH';
    host.querySelector('#prismAccountSignOut').addEventListener('click',async()=>{if(inFlight)return;inFlight=true;try{await controller?.flush();}catch{}controller?.stop();window.PRISMAccountLiveFlush=null;try{await cloud.signOut();}catch{}try{new BroadcastChannel('prism-account-session').postMessage({type:'auth-changed'});}catch{}location.reload();});
    host.querySelector('#prismClaimGuest').addEventListener('click',async()=>{if(!claimAvailable||inFlight)return;inFlight=true;try{const count=controller.claimGuest(),result=await controller.flush();if(result.status!=='verified')throw Error('Cloud and device changes need review before migration.');accountStatus(`${count} saved data groups moved to this account. Your original device copy remains available.`);claimAvailable=false;host.querySelector('#prismGuestClaim').hidden=true;location.reload();}catch(error){accountStatus(error.message||'Data could not be moved. Nothing was removed.',true);}finally{inFlight=false;}});
    host.querySelector('#prismKeepSeparate').addEventListener('click',()=>{claimAvailable=false;host.querySelector('#prismGuestClaim').hidden=true;accountStatus('Your device data stays separate from this account.');});
    host.querySelector('#prismImportLegacy').addEventListener('click',async()=>{if(!claimAvailable||!legacyBackup||inFlight)return;inFlight=true;try{const groups=await controller.importLegacyBackup(legacyBackup),result=await controller.flush();if(result.status!=='verified')throw Error('Cloud and older backup changes need review.');accountStatus(`${groups} saved data groups imported. The older backup was kept.`);location.reload();}catch(error){accountStatus(error.message||'Could not import the older backup. No original data was removed.',true);}finally{inFlight=false;}});
    host.querySelector('#prismClaimPhotos').addEventListener('click',async()=>{if(!photos||inFlight)return;inFlight=true;try{const count=await photos.claimGuest();accountStatus(`${count} photos copied to this account and private storage. Device originals remain available.`);host.querySelector('#prismGuestPhotos').hidden=true;}catch(error){accountStatus(error.message||'Photo transfer paused; originals remain on this device.',true);}finally{inFlight=false;}});
  }
  function syncAccountOnboardingCopy(){if(!manager.owner)return;const welcome=document.querySelector('#welcomeScreen .journey-note');if(welcome)welcome.textContent='Your MYLIFTCOACH setup is saved to your account.';const area=document.getElementById('prismJourneyContent');if(area){const first=[...area.querySelectorAll('p')].find(node=>node.textContent.includes('stays on this device'));if(first)first.textContent='Your profile and training setup are saved to your MYLIFTCOACH account.';}}
  function continueNewAccountOnboarding(){if(!manager.owner)return;let journey=null;try{journey=JSON.parse(manager.storage.getItem('prismJourneyV1')||'null');}catch{}syncAccountOnboardingCopy();if(journey?.status==='welcome'&&typeof window.startPrismGuest==='function'){window.startPrismGuest();syncAccountOnboardingCopy();}}
  if(!manager.owner){showAuthGate();document.documentElement.classList.remove('prism-account-booting');return;}renderAccountPanel();try{const channel=new BroadcastChannel('prism-account-session');channel.onmessage=event=>{if(event.data?.type==='auth-changed')location.reload();};}catch{}
  const onboardingObserver=new MutationObserver(syncAccountOnboardingCopy);const onboardingRoot=document.getElementById('onboardingScreen');if(onboardingRoot)onboardingObserver.observe(onboardingRoot,{childList:true,subtree:true});
  window.addEventListener('storage',event=>{if(event.storageArea!==window.localStorage||!event.key?.startsWith('prismAccountLocalV1:'+manager.owner+':'))return;manager.invalidate();controller?.stop();window.PRISMAccountLiveFlush=null;accountStatus('This account changed in another tab. Refresh before saving here.',true);let button=document.getElementById('prismRefreshAccount');if(!button){button=document.createElement('button');button.id='prismRefreshAccount';button.type='button';button.textContent='Account changed in another tab · Refresh';button.style.cssText='position:fixed;z-index:9999;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));min-height:48px;background:#a925ff;color:white;border-radius:12px';button.onclick=()=>location.reload();document.body.appendChild(button);}});
  const unlock=()=>document.documentElement.classList.remove('prism-account-booting');const timeout=setTimeout(()=>{unlock();accountStatus('Account check is taking longer. Your device copy is still available.');},12000);
  controller=window.PRISMAccountController.create({manager,cloud,url:config.url,publishableKey:config.publishableKey,backing:window.localStorage,initialSnapshot:window.PRISMAccountInitialSnapshot,onStatus:({kind,message})=>accountStatus(message,kind==='conflict'||kind==='offline')});
  window.PRISMAccountLiveFlush=async()=>{if(!controller||!manager.owner)return{status:'guest'};return controller.flush();};
  (async()=>{try{const user=await cloud.currentUser();if(!user?.id||user.id!==manager.owner){controller.stop();window.PRISMAccountLiveFlush=null;await cloud.signOut();location.reload();return;}accountEmail=user.email||'';renderAccountPanel();const result=await controller.connect();clearTimeout(timeout);if(window.PRISMPhotoSync){photos=window.PRISMPhotoSync.create({url:config.url,publishableKey:config.publishableKey,userId:user.id,getSession:()=>cloud.getSession(),backing:window.localStorage});window.PRISMAccountPhotos=photos;try{await photos.push();await photos.restore();const guestCount=await photos.guestCount();if(guestCount)host.querySelector('#prismGuestPhotos').hidden=false;}catch(error){accountStatus(error.message||'Private photo sync paused; device photos remain available.',true);}}if(result.status==='restored'){
      // A restore is written to scoped storage before this point. Reload once so the
      // app reads the restored snapshot, but never allow an endless reload loop.
      const restoreKey='myliftcoach-preview-restore-reload:'+user.id;
      const lastRestore=Number(sessionStorage.getItem(restoreKey)||0);
      if(Date.now()-lastRestore>30000){sessionStorage.setItem(restoreKey,String(Date.now()));location.reload();return;}
      accountStatus('Account restored. Please refresh this page if your latest data is not visible.');
    }if(result.status==='claim'){claimAvailable=true;host.querySelector('#prismGuestClaim').hidden=false;try{legacyBackup=await cloud.getBackup();}catch{legacyBackup=null;}if(legacyBackup)host.querySelector('#prismImportLegacy').hidden=false;accountStatus(legacyBackup?'Choose device data or the older cloud backup. Nothing is moved automatically.':'Choose whether to move existing device data into this account.');return;}continueNewAccountOnboarding();}catch(error){accountStatus(error.message||'Cloud is unavailable. Your local data remains on this device.',true);}finally{clearTimeout(timeout);unlock();}})();
})();
