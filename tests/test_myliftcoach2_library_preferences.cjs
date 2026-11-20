const test=require('node:test'),assert=require('node:assert/strict');
const prefs=require('../myliftcoach2/library-preferences.js');
const allowed=['machine-chest-press','dead-bug','leg-press','seated-row'];
function storage(){const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v),data};}
test('favorites and history are isolated per signed-in owner and guest',()=>{
 const s=storage();
 prefs.toggle(s,'guest','dead-bug',allowed);
 prefs.viewed(s,'guest','dead-bug',allowed);
 prefs.toggle(s,'account-a','leg-press',allowed);
 assert.deepEqual(prefs.read(s,'guest',allowed).favorites,['dead-bug']);
 assert.deepEqual(prefs.read(s,'account-a',allowed).favorites,['leg-press']);
 assert.deepEqual(prefs.read(s,'account-b',allowed).favorites,[]);
 assert.deepEqual(prefs.read(s,'account-a',allowed).recent,[]);
});
test('repeat views move exercise to front, and favorite toggle removes only selected item',()=>{
 const s=storage();
 prefs.viewed(s,'guest','leg-press',allowed);
 prefs.viewed(s,'guest','dead-bug',allowed);
 prefs.viewed(s,'guest','leg-press',allowed);
 assert.deepEqual(prefs.read(s,'guest',allowed).recent,['leg-press','dead-bug']);
 prefs.toggle(s,'guest','leg-press',allowed);
 prefs.toggle(s,'guest','dead-bug',allowed);
 prefs.toggle(s,'guest','leg-press',allowed);
 assert.deepEqual(prefs.read(s,'guest',allowed).favorites,['dead-bug']);
});
test('invalid and corrupt records fail closed without destroying saved bytes',()=>{
 const s=storage();
 assert.throws(()=>prefs.toggle(s,'guest','unlisted',allowed),/Unknown exercise/);
 const k=prefs.key('guest');s.setItem(k,'{bad');
 assert.throws(()=>prefs.toggle(s,'guest','dead-bug',allowed),/preserved/);
 assert.equal(s.getItem(k),'{bad');
});
test('storage readback errors are surfaced; no success is claimed',()=>{
 const s=storage();s.getItem=()=>null;
 assert.throws(()=>prefs.toggle(s,'guest','dead-bug',allowed),/not be confirmed/);
});
