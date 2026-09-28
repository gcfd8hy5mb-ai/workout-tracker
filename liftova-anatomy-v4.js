// LIFTOVA exact-reference visual layer — observer-free.
(() => {
'use strict';
const rows={
  'machine-chest-press':0,
  'incline-chest-press':1,
  'pec-deck':2,
  'lat-pulldown':3,
  'seated-row':4,
  'shoulder-press':5,
  'lateral-raise':6,
  'triceps-pushdown':7
};
const clean=id=>String(id||'').toLowerCase().replace(/[^a-z0-9-]/g,'');
function sprite(el,row,kind){
  if(!el)return;
  el.replaceChildren();
  el.classList.remove('lv4-anatomy','large','xl');
  el.classList.add(kind==='photo'?'lv5-photo-sprite':'lv5-anatomy-sprite');
  el.style.setProperty('--row',String(row));
  el.setAttribute('aria-label',kind==='photo'?'Exercise demonstration':'Highlighted target muscles');
}
function patchRows(){
  document.querySelectorAll('#prismWorkoutDetail .lv3-exercise-row[data-exercise-id]').forEach(card=>{
    const id=clean(card.dataset.exerciseId),row=rows[id];
    if(row===undefined)return;
    const photo=card.querySelector('.lv3-ex-photo');
    sprite(photo,row,'photo');
    const anatomy=card.querySelector('.lv3-anatomy,.lv4-anatomy,.lv5-anatomy-sprite');
    if(anatomy)sprite(anatomy,row,'anatomy');
  });
}
function detailPanel(row,id){
  if(id==='machine-chest-press'){
    return '<div class="lv5-realistic-detail"><img src="images/liftova-chest-anatomy-realistic.svg?v=1" alt="Detailed front and back chest press anatomy showing pectorals as the primary target and deltoids and triceps as secondary targets"></div>';
  }
  return `<div class="lv5-detail-sprite" style="--row:${row}" role="img" aria-label="Realistic highlighted target-muscle anatomy"></div>`;
}
function patchDetail(id){
  id=clean(id); const row=rows[id]; if(row===undefined)return;
  const root=document.querySelector('#prismExerciseInfo'); if(!root)return;
  if(id==='machine-chest-press'){
    root.querySelectorAll('.lv3-detail-photo').forEach(img=>{
      img.src='images/liftova-chest-press-detail.webp?v=1';
      img.alt='Chest Press machine start and finish positions';
      img.classList.add('lv5-exact-detail-photo');
    });
  }
  root.querySelectorAll('.lv3-anatomy.large,.lv3-anatomy.xl,.lv4-anatomy.large,.lv4-anatomy.xl,.lv5-detail-sprite,.lv5-realistic-detail').forEach(old=>{
    const box=document.createElement('div');
    box.innerHTML=detailPanel(row,id);
    old.replaceWith(box.firstElementChild);
  });
}
function updateInstallBrand(){
  document.title='LIFTOVA · Train · Track · Progress';
  const title=document.querySelector('meta[name="apple-mobile-web-app-title"]'); if(title)title.content='LIFTOVA';
  let apple=document.querySelector('link[rel="apple-touch-icon"]');
  if(!apple){apple=document.createElement('link');apple.rel='apple-touch-icon';document.head.appendChild(apple);}
  apple.setAttribute('sizes','180x180');
  apple.href='images/apple-touch-icon-180.png?v=4';
}
function wrap(name,after){
  const fn=window[name]; if(typeof fn!=='function'||fn.__lv5Exact)return false;
  const wrapped=function(...args){const out=fn.apply(this,args);requestAnimationFrame(()=>after(...args));return out;};
  wrapped.__lv5Exact=true; wrapped.__lv5Original=fn; window[name]=wrapped; return true;
}
let tries=0;
function install(){
  updateInstallBrand();
  if(!document.querySelector('link[data-lv5-exact]')){
    const l=document.createElement('link');l.rel='stylesheet';l.href='liftova-anatomy-v4.css?v=2';l.dataset.lv5Exact='true';document.head.appendChild(l);
  }
  const a=wrap('showPrismWorkoutDetail',patchRows),b=wrap('showExerciseInfo',patchDetail);
  requestAnimationFrame(()=>{patchRows();const active=document.querySelector('#prismExerciseInfo .lv3-ex-tabs');if(active){const heading=document.querySelector('#prismExerciseInfo h2');const match=[...document.querySelectorAll('#prismWorkoutDetail [data-exercise-id]')].find(x=>(x.textContent||'').includes(heading?.textContent||''));if(match)patchDetail(match.dataset.exerciseId);}});
  if((!a||!b)&&tries++<18)setTimeout(install,120);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
