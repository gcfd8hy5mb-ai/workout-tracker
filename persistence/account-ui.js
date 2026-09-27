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
      <div id="prismGuestClaim" hidden><p class="small">This account is empty. Move the PRISM workout, profile, goal and Coach data already on this device into this account?</p><button type="button" id="prismClaimGuest">Move my device data</button><button type="button" id="prismKeepSeparate">Keep guest data separate</button></div>
      <button type="button" id="prismAccountSignOut">Sign out</button></div>`;
    host.querySelector('#prismAccountIdentity').textContent = accountEmail ? `Signed in as ${accountEmail}` : 'Signed in to PRISM';
    host.querySelector('#prismAccountSignOut').addEventListener('click', async () => {
      if (inFlight) return;
      inFlight = true;
      try { await controller?.flush(); } catch { /* device copy remains available */ }
      controller?.stop();
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
  }
  render();
  try {
    const channel = new BroadcastChannel('prism-account-session');
    channel.onmessage = event => {
      if (event.data?.type === 'auth-changed') location.reload();
    };
  } catch { /* tab broadcast is optional; local account namespaces still isolate data */ }
  if (!manager.owner) return;
  const unlock = () => document.documentElement.classList.remove('prism-account-booting');
  // Never strand an installed PWA behind the loading veil during an outage.
  const timeout = setTimeout(() => { unlock();accountStatus('Account check is taking longer. Your device copy is still available.'); }, 12000);
  controller = window.PRISMAccountController.create({
    manager,cloud,url:config.url,publishableKey:config.publishableKey,
    backing:window.localStorage,initialSnapshot:window.PRISMAccountInitialSnapshot,
    onStatus:({kind,message}) => { accountStatus(message,kind === 'conflict' || kind === 'offline'); }
  });
  (async () => {
    try {
      const user = await cloud.currentUser();
      if (!user?.id || user.id !== manager.owner) {
        controller.stop();await cloud.signOut();location.reload();return;
      }
      accountEmail = user.email || '';
      render();
      const result = await controller.connect();
      if (result.status === 'restored') { location.reload(); return; }
      if (result.status === 'claim') {
        claimAvailable = true;
        host.querySelector('#prismGuestClaim').hidden = false;
        accountStatus('Choose whether to move existing guest data into this account.');
      }
    } catch (error) {
      accountStatus(error.message || 'Cloud is unavailable. Your local data remains on this device.',true);
    } finally { clearTimeout(timeout);unlock(); }
  })();
})();
