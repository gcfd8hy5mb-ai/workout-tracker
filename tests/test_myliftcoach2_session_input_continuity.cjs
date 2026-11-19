const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../myliftcoach2/session-input-continuity.js');
function root(entries){
 const cards=entries.map(([id,w,r])=>({dataset:{exerciseCard:id},
  weight:{value:w},reps:{value:r},
  querySelector(sel){return sel==='[data-weight]'?this.weight:sel==='[data-reps]'?this.reps:null;}}));
 return {cards,querySelectorAll(){return cards}};
}
test('preserves manually entered weights and repetitions across a rebuilt workout',()=>{
 const before=root([['leg-press','160','9'],['seated-row','95','12']]);
 const snapshot=api.capture(before,['leg-press','seated-row']);
 const after=root([['leg-press','40','10'],['seated-row','40','10']]);
 assert.equal(api.restore(after,snapshot,['leg-press','seated-row']),4);
 assert.deepEqual(after.cards.map(x=>[x.weight.value,x.reps.value]),[['160','9'],['95','12']]);
});
test('cannot restore input for a removed or substituted exercise',()=>{
 const before=root([['deleted','150','10']]);
 const snapshot=api.capture(before,['deleted']);
 const after=root([['deleted','40','10'],['replacement','40','10']]);
 assert.equal(api.restore(after,snapshot,['replacement']),0);
 assert.equal(after.cards[0].weight.value,'40');
});
test('does not carry empty, non-finite, or out-of-range inputs forward',()=>{
 const before=root([['a','',''],['b','Infinity','101'],['c','-5','0']]);
 const snapshot=api.capture(before,['a','b','c']);
 assert.equal(Object.keys(snapshot).length,0);
 assert.equal(api.weight('0'),'0');
 assert.equal(api.reps('1'),'1');
});
test('does not mutate saved session data or invent extra fields',()=>{
 const before=root([['a','85','8']]);const snapshot=api.capture(before,['a']);
 const session={sets:[{exerciseId:'a',weight:80,reps:10}]},old=JSON.stringify(session);
 const after=root([['a','40','10']]);api.restore(after,snapshot,['a']);
 assert.equal(JSON.stringify(session),old);assert.equal(after.cards[0].weight.value,'85');
});
