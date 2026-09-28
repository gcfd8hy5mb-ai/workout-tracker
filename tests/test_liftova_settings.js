const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('liftova-reference-v3.js','utf8');
const css=fs.readFileSync('liftova-reference-v3.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const start=source.indexOf('  function renderSettings(){');
const end=source.indexOf('  function renderWorkoutBrowser(){',start);
assert.ok(start>0&&end>start);
const listeners=new Map();
const classes=new Set();
const shell={innerHTML:'',querySelector(selector){return buttons[selector]||null}};
const controls={
  '#prismLocalProfile':{scrollIntoView(){calls.push('profile scroll')}},
  '#prismEditUnits':{scrollIntoView(){calls.push('units scroll')}},
  '#workoutRestStatus':{textContent:'Alerts enabled while this workout stays open.'}
};
const screen={classList:{add(name){classes.add(name)},toggle(name){classes.has(name)?classes.delete(name):classes.add(name)}},querySelector(selector){return selector==='.lv3-settings-shell'?this.shell:controls[selector]||null},prepend(element){this.shell=element}};
const calls=[];
const buttons=Object.fromEntries(['profile','units','timer','theme','notifications'].map(name=>[`[data-setting="${name}"]`,{addEventListener(type,handler){listeners.set(name,handler)}}]));
buttons['.lv3-settings-top>button']={addEventListener(type,handler){listeners.set('menu',handler)}};
const context={qs(selector,root){if(selector==='#profileScreen'&&!root)return screen;if(selector==='#workoutRestStatus'&&!root)return controls[selector];return root===screen?screen.querySelector(selector):root===shell?shell.querySelector(selector):null},document:{createElement(){return shell}},icon(){return '<svg></svg>'},setTimeout(fn){fn()},window:{showGlobalTimer(){calls.push('timer')},openMenu(){calls.push('menu')},alert(message){calls.push(message)},async enableRestAlerts(){calls.push('permission')}}};
vm.runInNewContext(source.slice(start,end)+'\nrenderSettings()',context);
for(const name of ['profile','units','timer','theme','notifications','menu'])assert.equal(typeof listeners.get(name),'function',`${name} must respond to taps`);
listeners.get('profile')();assert.ok(classes.has('lv3-settings-expanded'));assert.ok(calls.includes('profile scroll'));
listeners.get('units')();assert.ok(calls.includes('units scroll'));
listeners.get('timer')();assert.ok(calls.includes('timer'));
listeners.get('theme')();assert.ok(calls.some(item=>typeof item==='string'&&item.includes('Dark (Purple)')));
listeners.get('menu')();assert.ok(calls.includes('menu'));
(async()=>{await listeners.get('notifications')();assert.ok(calls.includes('permission'));assert.ok(calls.includes('Alerts enabled while this workout stays open.'));
 assert.ok(css.includes('#profileScreen.lv3-settings-screen.lv3-settings-expanded>#prismLocalProfile'),'profile form and Units selector must be revealed');
 assert.match(html,/onclick="showPrismPro\(\)"[^>]*>See what Pro can do/);
 assert.match(html,/data-beta-mode="free" onclick="setBetaPreview\('free'\)"/);
 assert.match(html,/data-beta-mode="pro" onclick="setBetaPreview\('pro'\)"/);
 console.log('LIFTOVA Settings tap handlers, reveal, existing Pro/Beta actions: OK');
})().catch(error=>{console.error(error);process.exitCode=1});
