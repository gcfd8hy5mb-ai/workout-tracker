/* PRISM account controls. Guest data is claimed only after an explicit tap. */
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
    const output = host.querySelector('#prismAccountStatus');
    if (output) { output.textContent = message; output.dataset.error = String(isError); }
  };
  function render() {
    if (!manager.owner) {
      host.innerHTML = `<div class="card"><h3>PRISM account</h3><p class="small">Sign in to prepare your PRISM data for account backup. Your guest data stays on this device until you choose to move it.</p>
      <form id="prismAccountSignIn"><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">Sign in</button></form>
      <button type="button" id="prismAccountCreate">Create account</button><p id="prismAccountStatus" class="small" role="status"></p></div>`;
      host.querySelector('#prismAccountSignIn').addEventListener('submit', async event => {
        event.preventDefault();
        if (inFlight) return;
        inFlight = true;
        const form = event.currentTarget;
        try {
          await cloud.signIn(form.elements.email.value.trim(), form.elements.password.value);
          const user = await cloud.currentUser();
          if (!user?.id) throw Error('Sign-in could not be verified. Please try again.');
          location.reload();
        } catch (error) { accountStatus(error.message || 'Could not sign in.', true); }
        finally { inFlight = false; }
      });
      host.querySelector('#prismAccountCreate').addEventListener('click', () => {
        const form = host.querySelector('#prismAccountSignIn');
        const email = form.elements.email.value.trim();
        const password = form.elements.password.value;
        if (!email || !form.elements.email.checkValidity() || password.length < 6) {
          accountStatus('Enter a valid email and a password of at least 6 characters.', true);return;
        }
        if (inFlight) return;
        inFlight = true;
        cloud.signUp(email, password).then(result => {
          if (result.access_token) location.reload();
          else accountStatus('Check your email to confirm your account, then sign in. Your device data is safe.');
        }).catch(error => accountStatus(error.message || 'Could not create the account.', true))
          .finally(() => { inFlight = false; });
      });
      return;
    }
    host.innerHTML = `<div class="card"><h3>PRISM account</h3><p id="prismAccountIdentity" class="small"></p>
      <p id="prismAccountStatus" class="small" role="status">Checking your account…</p>
      <div id="prismGuestClaim" hidden><p class="small">This account is empty. Move the PRISM workout, profile, goal and Coach data already on this device into this account?</p><button type="button" id="prismClaimGuest">Move my device data</button><button type="button" id="prismKeepSeparate">Keep guest data separate</button><button type="button" id="prismImportLegacy" hidden>Import older PRISM cloud backup</button></div>
      <div id="prismGuestPhotos" hidden><p class="small">Photos saved in guest mode are still on this device. Choose to copy them into this account and its private photo storage.</p><button type="button" id="prismClaimPhotos">Move my guest photos</button></div>
      <button type="button" id="prismAccountSignOut">Sign out</button></div>`;
    host.querySelector('#prismAccountIdentity').textContent = accountEmail ? `Signed in as ${accountEmail}` : 'Signed in to PRISM';
    host.querySelector('#prismAccountSignOut').addEventListener('click', async () => {
      if (inFlight) return;
      inFlight = true;
      try { await controller?.flush(); } catch { /* device copy remains available */ }
      controller?.stop();
      window.PRISMAccountLiveFlush = null;
      try { await cloud.signOut(); } catch { /* local session was still cleared */ }
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
        accountStatus(`${count} saved data groups moved to this account. Your original guest copy remains on this device.`);
        claimAvailable = false;
        host.querySelector('#prismGuestClaim').hidden = true;
        location.reload();
      } catch (error) { accountStatus(error.message || 'Data could not be moved. Nothing was removed.', true); }
      finally { inFlight = false; }
    });
    host.querySelector('#prismKeepSeparate').addEventListener('click', () => {
      claimAvailable = false;host.querySelector('#prismGuestClaim').hidden = true;
      accountStatus('Your guest data stays on this device, separate from this account.');
    });
    host.querySelector('#prismImportLegacy').addEventListener('click', async () => {
      if(!claimAvailable || !legacyBackup || inFlight)return;
      inFlight=true;
      try{
        const groups=await controller.importLegacyBackup(legacyBackup);
        const result=await controller.flush();
        if(result.status!=='verified')throw Error('Cloud and older backup changes need review.');
        accountStatus(`${groups} saved data groups imported. The older backup was kept.`);
        location.reload();
      }catch(error){accountStatus(error.message||'Could not import the older backup. No original data was removed.',true)}
      finally{inFlight=false}
    });
    host.querySelector('#prismClaimPhotos').addEventListener('click', async () => {
      if(!photos||inFlight)return;
      inFlight=true;
      try{const count=await photos.claimGuest();accountStatus(`${count} photos copied to this account and private storage. Guest originals remain on this device.`);host.querySelector('#prismGuestPhotos').hidden=true;}
      catch(error){accountStatus(error.message||'Photo transfer paused; originals remain on this device.',true)}
      finally{inFlight=false}
    });
  }
  render();
  try {
    const channel = new BroadcastChannel('prism-account-session');
    channel.onmessage = event => {
      if (event.data?.type === 'auth-changed') location.reload();
    };
  } catch { /* tab broadcast is optional; local account namespaces still isolate data */ }
  if (!manager.owner) return;
  window.addEventListener('storage', event => {
    if(event.storageArea!==window.localStorage||!event.key?.startsWith('prismAccountLocalV1:'+manager.owner+':'))return;
    manager.invalidate();controller?.stop();window.PRISMAccountLiveFlush=null;
    accountStatus('This account changed in another tab. Refresh PRISM before saving here.',true);
    let button=document.getElementById('prismRefreshAccount');
    if(!button){button=document.createElement('button');button.id='prismRefreshAccount';button.type='button';button.textContent='Account changed in another tab · Refresh';button.style.cssText='position:fixed;z-index:9999;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));min-height:48px;background:#168bff;color:white;border-radius:12px';button.onclick=()=>location.reload();document.body.appendChild(button)}
  });
  const unlock = () => document.documentElement.classList.remove('prism-account-booting');
  const timeout = setTimeout(() => { unlock();accountStatus('Account check is taking longer. Your device copy is still available.'); }, 12000);
  controller = window.PRISMAccountController.create({
    manager,cloud,url:config.url,publishableKey:config.publishableKey,
    backing:window.localStorage,initialSnapshot:window.PRISMAccountInitialSnapshot,
    onStatus:({kind,message}) => { accountStatus(message,kind === 'conflict' || kind === 'offline'); }
  });
  // Workout completion is a user commit point. Give it a direct, verified flush
  // path instead of relying only on a debounce that mobile Safari may suspend.
  window.PRISMAccountLiveFlush = async () => {
    if (!controller || !manager.owner) return {status:'guest'};
    return controller.flush();
  };
  (async () => {
    try {
      const user = await cloud.currentUser();
      if (!user?.id || user.id !== manager.owner) {
        controller.stop();window.PRISMAccountLiveFlush=null;await cloud.signOut();location.reload();return;
      }
      accountEmail = user.email || '';
      render();
      const result = await controller.connect();
      clearTimeout(timeout);
      if(window.PRISMPhotoSync){
        photos=window.PRISMPhotoSync.create({url:config.url,publishableKey:config.publishableKey,userId:user.id,getSession:()=>cloud.getSession(),backing:window.localStorage});
        window.PRISMAccountPhotos=photos;
        try{
          await photos.push();
          await photos.restore();
          const guestCount=await photos.guestCount();
          if(guestCount)host.querySelector('#prismGuestPhotos').hidden=false;
        }catch(error){accountStatus(error.message||'Private photo sync paused; device photos remain available.',true)}
      }
      if (result.status === 'restored') { location.reload(); return; }
      if (result.status === 'claim') {
        claimAvailable = true;
        host.querySelector('#prismGuestClaim').hidden = false;
        try{legacyBackup=await cloud.getBackup()}catch{legacyBackup=null}
        if(legacyBackup)host.querySelector('#prismImportLegacy').hidden=false;
        accountStatus(legacyBackup?'Choose device data or the older cloud backup. Nothing is moved automatically.':'Choose whether to move existing guest data into this account.');
      }
    } catch (error) {
      accountStatus(error.message || 'Cloud is unavailable. Your local data remains on this device.',true);
    } finally { clearTimeout(timeout);unlock(); }
  })();
})();