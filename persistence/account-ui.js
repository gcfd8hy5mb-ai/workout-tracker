/* LIFTOVA account controls. Account authentication is the first-run gate. */
(() => {
  'use strict';
  const host = document.getElementById('prismCloudAccount');
  const manager = window.PRISMDeviceStore;
  const cloud = window.PRISMCloud;
  const config = window.PRISM_SUPABASE_CONFIG;
  if (!host || !manager || !cloud || !config || !window.PRISMAccountController) {
    document.documentElement.classList.remove('prism-account-booting');
    return;
  }

  let controller = null;
  let accountEmail = '';
  let claimAvailable = false;
  let legacyBackup = null;
  let photos = null;
  let inFlight = false;

  const accountStatus = (message, isError = false) => {
    const output = document.querySelector('#liftovaAuthStatus') || host.querySelector('#prismAccountStatus');
    if (output) {
      output.textContent = message;
      output.dataset.error = String(isError);
    }
  };

  function injectLiftovaAuthStyles() {
    if (document.getElementById('liftovaAuthStyles')) return;
    const style = document.createElement('style');
    style.id = 'liftovaAuthStyles';
    style.textContent = `
      :root{--liftova-purple:#7a28ff;--liftova-purple-2:#a45cff;--liftova-bg:#05050a;}
      body.liftova-auth-locked{overflow:hidden!important;padding:0!important;background:#05050a!important;}
      body.liftova-auth-locked>header,body.liftova-auth-locked>.container,body.liftova-auth-locked>.bottom-nav{visibility:hidden!important;}
      #liftovaAuthGate{position:fixed;inset:0;z-index:999999;background:
        radial-gradient(circle at 50% 18%,rgba(122,40,255,.28),transparent 33%),
        linear-gradient(rgba(5,5,10,.68),rgba(5,5,10,.92)),
        url('images/machine-chest-press.png') center/cover no-repeat;
        color:#fff;overflow:auto;padding:calc(28px + env(safe-area-inset-top)) 22px calc(28px + env(safe-area-inset-bottom));font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',Arial,sans-serif;}
      #liftovaAuthGate:before{content:'';position:fixed;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(130,45,255,.12),transparent 18%,transparent 82%,rgba(130,45,255,.12));}
      .liftova-auth-shell{position:relative;max-width:460px;min-height:calc(100vh - 56px);margin:auto;display:flex;flex-direction:column;justify-content:center;}
      .liftova-mark{width:92px;height:74px;margin:0 auto 14px;position:relative;filter:drop-shadow(0 0 18px rgba(132,59,255,.65));}
      .liftova-mark:before,.liftova-mark:after{content:'';position:absolute;bottom:0;width:22px;height:72px;border-radius:4px 4px 1px 1px;background:linear-gradient(180deg,#caa6ff 0%,#8d42ff 40%,#4b159b 100%);transform-origin:bottom;}
      .liftova-mark:before{left:22px;transform:skew(-30deg);}.liftova-mark:after{right:18px;height:55px;transform:skew(30deg);}
      .liftova-brand{text-align:center;margin-bottom:26px}.liftova-brand h1{margin:0;font-size:38px;letter-spacing:.18em;font-weight:850;background:linear-gradient(#fff,#aeb0bd);-webkit-background-clip:text;background-clip:text;color:transparent}.liftova-brand p{margin:7px 0 0;font-size:11px;letter-spacing:.34em;color:#d9d4e5}.liftova-brand p b{color:#a45cff}
      .liftova-auth-card{background:rgba(10,10,18,.86);border:1px solid rgba(164,92,255,.62);border-radius:26px;padding:22px;box-shadow:0 18px 70px rgba(0,0,0,.48),inset 0 0 0 1px rgba(255,255,255,.025);backdrop-filter:blur(16px)}
      .liftova-auth-card h2{font-size:27px;margin:0 0 6px;text-align:center;letter-spacing:.02em}.liftova-auth-card>.sub{margin:0 0 20px;text-align:center;color:#b9b5c5;font-size:14px;line-height:1.45}
      .liftova-auth-tabs{display:grid;grid-template-columns:1fr 1fr;background:#0b0c14;border:1px solid #2c2540;border-radius:15px;padding:4px;margin-bottom:18px}.liftova-auth-tab{border:0!important;border-radius:11px!important;background:transparent!important;color:#a6a1b2!important;min-height:44px;font-weight:750!important}.liftova-auth-tab.active{background:linear-gradient(135deg,#6920e7,#9d45ff)!important;color:#fff!important;box-shadow:0 0 18px rgba(126,48,255,.35)}
      .liftova-field{margin:12px 0}.liftova-field label{display:block;margin:0 0 7px!important;color:#c9c5d4;font-size:12px;font-weight:700;letter-spacing:.06em}.liftova-field input{width:100%!important;background:#11121b!important;color:#fff!important;border:1px solid #343044!important;border-radius:14px!important;min-height:52px!important;padding:0 15px!important;font-size:16px!important;outline:none}.liftova-field input:focus{border-color:#9148ff!important;box-shadow:0 0 0 3px rgba(145,72,255,.13)}
      .liftova-submit{width:100%;min-height:54px;margin-top:8px;border:0!important;border-radius:15px!important;background:linear-gradient(135deg,#7023ef,#9d46ff)!important;color:#fff!important;font-size:16px!important;font-weight:800!important;letter-spacing:.08em!important;box-shadow:0 10px 28px rgba(116,35,238,.32)}
      .liftova-auth-note{margin:14px 0 0;color:#817c8e;font-size:11px;line-height:1.45;text-align:center}.liftova-auth-status{min-height:20px;margin:13px 0 0;text-align:center;font-size:13px;color:#b9b5c5}.liftova-auth-status[data-error='true']{color:#ff7e91}.liftova-auth-status[data-error='false']{color:#a9e5c3}
      @media(max-width:390px){.liftova-brand h1{font-size:31px}.liftova-auth-card{padding:18px}.liftova-auth-shell{justify-content:flex-start;padding-top:7vh}}
    `;
    document.head.appendChild(style);
  }

  function showAuthGate() {
    injectLiftovaAuthStyles();
    document.body.classList.add('liftova-auth-locked');
    host.innerHTML = '';
    let gate = document.getElementById('liftovaAuthGate');
    if (gate) gate.remove();
    gate = document.createElement('section');
    gate.id = 'liftovaAuthGate';
    gate.innerHTML = `
      <div class="liftova-auth-shell">
        <div class="liftova-brand">
          <div class="liftova-mark" aria-hidden="true"></div>
          <h1>LIFTOVA</h1>
          <p>TRAIN <b>•</b> TRACK <b>•</b> PROGRESS</p>
        </div>
        <div class="liftova-auth-card">
          <h2 id="liftovaAuthHeading">Welcome back</h2>
          <p class="sub" id="liftovaAuthSub">Sign in to continue your training.</p>
          <div class="liftova-auth-tabs" role="tablist" aria-label="Account action">
            <button type="button" class="liftova-auth-tab active" id="liftovaSignInTab">Sign In</button>
            <button type="button" class="liftova-auth-tab" id="liftovaSignUpTab">Sign Up</button>
          </div>
          <form id="liftovaAuthForm">
            <div class="liftova-field"><label for="liftovaEmail">EMAIL</label><input id="liftovaEmail" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div>
            <div class="liftova-field"><label for="liftovaPassword">PASSWORD</label><input id="liftovaPassword" name="password" type="password" autocomplete="current-password" placeholder="••••••••" minlength="6" required></div>
            <div class="liftova-field" id="liftovaConfirmWrap" hidden><label for="liftovaConfirm">CONFIRM PASSWORD</label><input id="liftovaConfirm" name="confirm" type="password" autocomplete="new-password" placeholder="••••••••" minlength="6"></div>
            <button class="liftova-submit" type="submit" id="liftovaSubmit">SIGN IN →</button>
          </form>
          <p id="liftovaAuthStatus" class="liftova-auth-status" role="status"></p>
          <p class="liftova-auth-note">Your LIFTOVA account keeps your training data tied to you across supported devices.</p>
        </div>
      </div>`;
    document.body.appendChild(gate);

    const form = gate.querySelector('#liftovaAuthForm');
    const signInTab = gate.querySelector('#liftovaSignInTab');
    const signUpTab = gate.querySelector('#liftovaSignUpTab');
    const confirmWrap = gate.querySelector('#liftovaConfirmWrap');
    const confirmInput = gate.querySelector('#liftovaConfirm');
    const heading = gate.querySelector('#liftovaAuthHeading');
    const sub = gate.querySelector('#liftovaAuthSub');
    const submit = gate.querySelector('#liftovaSubmit');
    let mode = 'signin';

    const setMode = next => {
      mode = next;
      const signup = mode === 'signup';
      signInTab.classList.toggle('active', !signup);
      signUpTab.classList.toggle('active', signup);
      confirmWrap.hidden = !signup;
      confirmInput.required = signup;
      form.elements.password.autocomplete = signup ? 'new-password' : 'current-password';
      heading.textContent = signup ? 'Create your account' : 'Welcome back';
      sub.textContent = signup ? 'Start your journey and make your training yours.' : 'Sign in to continue your training.';
      submit.textContent = signup ? 'CREATE ACCOUNT →' : 'SIGN IN →';
      accountStatus('');
    };
    signInTab.addEventListener('click', () => setMode('signin'));
    signUpTab.addEventListener('click', () => setMode('signup'));

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (inFlight) return;
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;
      if (!email || !form.elements.email.checkValidity() || password.length < 6) {
        accountStatus('Enter a valid email and a password of at least 6 characters.', true);
        return;
      }
      if (mode === 'signup' && password !== form.elements.confirm.value) {
        accountStatus('Passwords do not match.', true);
        return;
      }
      inFlight = true;
      submit.disabled = true;
      try {
        if (mode === 'signin') {
          await cloud.signIn(email, password);
          const user = await cloud.currentUser();
          if (!user?.id) throw Error('Sign-in could not be verified. Please try again.');
          location.reload();
        } else {
          const result = await cloud.signUp(email, password);
          if (result.access_token) location.reload();
          else accountStatus('Check your email to confirm your account, then return here and sign in.');
        }
      } catch (error) {
        accountStatus(error.message || (mode === 'signin' ? 'Could not sign in.' : 'Could not create the account.'), true);
      } finally {
        inFlight = false;
        submit.disabled = false;
      }
    });
  }

  function renderAccountPanel() {
    host.innerHTML = `<div class="card"><h3>LIFTOVA account</h3><p id="prismAccountIdentity" class="small"></p>
      <p id="prismAccountStatus" class="small" role="status">Checking your account…</p>
      <div id="prismGuestClaim" hidden><p class="small">This account is empty. Move the workout, profile, goal and Coach data already on this device into this account?</p><button type="button" id="prismClaimGuest">Move my device data</button><button type="button" id="prismKeepSeparate">Keep guest data separate</button><button type="button" id="prismImportLegacy" hidden>Import older cloud backup</button></div>
      <div id="prismGuestPhotos" hidden><p class="small">Photos saved before sign-in are still on this device. Choose to copy them into this account and its private photo storage.</p><button type="button" id="prismClaimPhotos">Move my device photos</button></div>
      <button type="button" id="prismAccountSignOut">Sign out</button></div>`;
    host.querySelector('#prismAccountIdentity').textContent = accountEmail ? `Signed in as ${accountEmail}` : 'Signed in to LIFTOVA';
    host.querySelector('#prismAccountSignOut').addEventListener('click', async () => {
      if (inFlight) return;
      inFlight = true;
      try { await controller?.flush(); } catch {}
      controller?.stop();
      window.PRISMAccountLiveFlush = null;
      try { await cloud.signOut(); } catch {}
      try { new BroadcastChannel('prism-account-session').postMessage({type:'auth-changed'}); } catch {}
      location.reload();
    });
    host.querySelector('#prismClaimGuest').addEventListener('click', async () => {
      if (!claimAvailable || inFlight) return;
      inFlight = true;
      try {
        const count = controller.claimGuest();
        const result = await controller.flush();
        if (result.status !== 'verified') throw Error('Cloud and device changes need review before migration.');
        accountStatus(`${count} saved data groups moved to this account. Your original device copy remains available.`);
        claimAvailable = false;
        host.querySelector('#prismGuestClaim').hidden = true;
        location.reload();
      } catch (error) { accountStatus(error.message || 'Data could not be moved. Nothing was removed.', true); }
      finally { inFlight = false; }
    });
    host.querySelector('#prismKeepSeparate').addEventListener('click', () => {
      claimAvailable = false;
      host.querySelector('#prismGuestClaim').hidden = true;
      accountStatus('Your device data stays separate from this account.');
    });
    host.querySelector('#prismImportLegacy').addEventListener('click', async () => {
      if (!claimAvailable || !legacyBackup || inFlight) return;
      inFlight = true;
      try {
        const groups = await controller.importLegacyBackup(legacyBackup);
        const result = await controller.flush();
        if (result.status !== 'verified') throw Error('Cloud and older backup changes need review.');
        accountStatus(`${groups} saved data groups imported. The older backup was kept.`);
        location.reload();
      } catch (error) { accountStatus(error.message || 'Could not import the older backup. No original data was removed.', true); }
      finally { inFlight = false; }
    });
    host.querySelector('#prismClaimPhotos').addEventListener('click', async () => {
      if (!photos || inFlight) return;
      inFlight = true;
      try {
        const count = await photos.claimGuest();
        accountStatus(`${count} photos copied to this account and private storage. Device originals remain available.`);
        host.querySelector('#prismGuestPhotos').hidden = true;
      } catch (error) { accountStatus(error.message || 'Photo transfer paused; originals remain on this device.', true); }
      finally { inFlight = false; }
    });
  }

  if (!manager.owner) {
    showAuthGate();
    document.documentElement.classList.remove('prism-account-booting');
    return;
  }

  renderAccountPanel();
  try {
    const channel = new BroadcastChannel('prism-account-session');
    channel.onmessage = event => { if (event.data?.type === 'auth-changed') location.reload(); };
  } catch {}

  window.addEventListener('storage', event => {
    if (event.storageArea !== window.localStorage || !event.key?.startsWith('prismAccountLocalV1:' + manager.owner + ':')) return;
    manager.invalidate();
    controller?.stop();
    window.PRISMAccountLiveFlush = null;
    accountStatus('This account changed in another tab. Refresh before saving here.', true);
    let button = document.getElementById('prismRefreshAccount');
    if (!button) {
      button = document.createElement('button');
      button.id = 'prismRefreshAccount';
      button.type = 'button';
      button.textContent = 'Account changed in another tab · Refresh';
      button.style.cssText = 'position:fixed;z-index:9999;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));min-height:48px;background:#7a28ff;color:white;border-radius:12px';
      button.onclick = () => location.reload();
      document.body.appendChild(button);
    }
  });

  const unlock = () => document.documentElement.classList.remove('prism-account-booting');
  const timeout = setTimeout(() => {
    unlock();
    accountStatus('Account check is taking longer. Your device copy is still available.');
  }, 12000);

  controller = window.PRISMAccountController.create({
    manager,
    cloud,
    url: config.url,
    publishableKey: config.publishableKey,
    backing: window.localStorage,
    initialSnapshot: window.PRISMAccountInitialSnapshot,
    onStatus: ({kind,message}) => accountStatus(message, kind === 'conflict' || kind === 'offline')
  });

  window.PRISMAccountLiveFlush = async () => {
    if (!controller || !manager.owner) return {status:'guest'};
    return controller.flush();
  };

  (async () => {
    try {
      const user = await cloud.currentUser();
      if (!user?.id || user.id !== manager.owner) {
        controller.stop();
        window.PRISMAccountLiveFlush = null;
        await cloud.signOut();
        location.reload();
        return;
      }
      accountEmail = user.email || '';
      renderAccountPanel();
      const result = await controller.connect();
      clearTimeout(timeout);
      if (window.PRISMPhotoSync) {
        photos = window.PRISMPhotoSync.create({url:config.url,publishableKey:config.publishableKey,userId:user.id,getSession:()=>cloud.getSession(),backing:window.localStorage});
        window.PRISMAccountPhotos = photos;
        try {
          await photos.push();
          await photos.restore();
          const guestCount = await photos.guestCount();
          if (guestCount) host.querySelector('#prismGuestPhotos').hidden = false;
        } catch (error) { accountStatus(error.message || 'Private photo sync paused; device photos remain available.', true); }
      }
      if (result.status === 'restored') { location.reload(); return; }
      if (result.status === 'claim') {
        claimAvailable = true;
        host.querySelector('#prismGuestClaim').hidden = false;
        try { legacyBackup = await cloud.getBackup(); } catch { legacyBackup = null; }
        if (legacyBackup) host.querySelector('#prismImportLegacy').hidden = false;
        accountStatus(legacyBackup ? 'Choose device data or the older cloud backup. Nothing is moved automatically.' : 'Choose whether to move existing device data into this account.');
      }
    } catch (error) {
      accountStatus(error.message || 'Cloud is unavailable. Your local data remains on this device.', true);
    } finally {
      clearTimeout(timeout);
      unlock();
    }
  })();
})();