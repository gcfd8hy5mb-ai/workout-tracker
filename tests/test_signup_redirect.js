const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function check(href) {
  let request;
  const window = {
    PRISM_SUPABASE_CONFIG: { url: 'https://example.supabase.co', publishableKey: 'public-test' },
    dispatchEvent() {}
  };
  const context = {
    window, location: { href }, URL, encodeURIComponent,
    localStorage: { getItem: () => null, setItem() {} },
    CustomEvent: class {},
    fetch: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ user: { id: 'pending-confirmation' } }) };
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../cloud-backup.js'), 'utf8'), context);
  await window.PRISMCloud.signUp('test@example.com', 'password');
  assert.equal(new URL(request.url).searchParams.get('redirect_to'), 'https://gcfd8hy5mb-ai.github.io/workout-tracker/');
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(JSON.parse(request.options.body), { email: 'test@example.com', password: 'password' });
}

Promise.all([
  check('https://gcfd8hy5mb-ai.github.io/workout-tracker/'),
  check('https://gcfd8hy5mb-ai.github.io/workout-tracker/index.html?source=email#section')
]).then(() => console.log('Signup confirmation redirect: app root and index URL pass.'))
  .catch(error => { console.error(error); process.exitCode = 1; });
