/* MYLIFTCOACH 2.0 — Image-only exercise guide for active workout cards.
   DOM enhancement only. No writes to auth, Coach, cloud, or workout state. */
(()=>{'use strict';
const modalContent=document.getElementById('modalContent');
if(!modalContent)return;
let root=null;
const catalog=window.MLC2_EXERCISE_CATALOG;
if(!Array.isArray(catalog))return;
const byId=new Map(catalog.map(e=>[e.id,e]));
const safePath=s=>typeof s==='string'&&/^(?:\.\/)?assets\/exercise-demonstrations\/[A-Za-z0-9._-]+\.webp$/.test(s);
const placeholder='./assets/image-coming-approved.webp';
const imgFor=(e,full=false)=>{
 const demo=e.demonstration;
 const path=demo?.status==='approved'?(full?demo.image:demo.thumbnail):null;
 return safePath(path)?'./'+path.replace(/^\.\//,''):placeholder;
};
const approved=e=>e.demonstration?.status==='approved'&&safePath(e.demonstration.image);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
let opened=null,lastTrigger=null,priorOverflow='';
function addParagraph(parent,label,value){
 const section=el('section','mlc-guide-section');
 section.append(el('h3','',label),el('p','',value||'No additional information provided.'));
 parent.append(section);
}
function addHowTo(parent,e){
 const section=el('section','mlc-guide-section');
 section.append(el('h3','','How to Perform'));
 const source=String(e.how||e.cue||'').trim();
 // Preserve each exercise's actual instructions; never invent missing steps.
 const sentences=source.match(/[^.!?]+[.!?]*/g)?.map(s=>s.trim()).filter(Boolean)||[];
 if(sentences.length>1){
  const steps=el('ol','mlc-guide-steps');
  for(const sentence of sentences)steps.append(el('li','',sentence));
  section.append(steps);
 }else section.append(el('p','',source||'Instructions are not available yet.'));
 parent.append(section);
}
function addList(parent,label,items){
 const section=el('section','mlc-guide-section');section.append(el('h3','',label));
 const list=el('ul');for(const s of Array.isArray(items)&&items.length?items:['No additional notes provided.'])list.append(el('li','',s));
 section.append(list);parent.append(section);
}
const overlay=el('div','mlc-guide-overlay');
overlay.hidden=true;
overlay.setAttribute('role','presentation');
const panel=el('section','mlc-guide-panel');
panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Exercise guide');
overlay.append(panel);document.body.append(overlay);
function closeFull(){
 if(overlay.hidden)return;
 overlay.hidden=true;panel.replaceChildren();document.body.style.overflow=priorOverflow;
 lastTrigger?.focus();lastTrigger=null;
}
function openFull(id,trigger){
 const e=byId.get(id);if(!e)return;
 lastTrigger=trigger;priorOverflow=document.body.style.overflow;
 const top=el('div','mlc-guide-top'),back=el('button','mlc-guide-back','← Return to workout');back.type='button';back.addEventListener('click',closeFull);
 top.append(back,el('span','mlc-guide-eyebrow','EXERCISE GUIDE'));
 const title=el('h2','',e.name);
 const metadata=el('p','mlc-guide-meta',[e.group,e.equipment].filter(Boolean).join(' · '));
 const image=el('img','mlc-guide-large');image.loading='eager';image.alt=approved(e)?'Complete approved demonstration of '+e.name:'Image coming placeholder for '+e.name;
 image.src=imgFor(e,true);image.addEventListener('error',()=>{if(!image.src.endsWith('image-coming-approved.webp'))image.src=placeholder},{once:true});
 const caption=el('p','mlc-guide-caption',approved(e)?'Starting and finishing positions':'IMAGE COMING — exercise instructions available below');
 panel.replaceChildren(top,title,metadata,image,caption);
 addHowTo(panel,e);
 addParagraph(panel,'Muscles Worked',e.muscle||e.group);
 addParagraph(panel,'Equipment',e.equipment||'Not specified');
 addList(panel,'Technique Tips',e.tips);addList(panel,'Common Mistakes',e.mistakes);
 const done=el('button','mlc-guide-done','Return to workout');done.type='button';done.addEventListener('click',closeFull);panel.append(done);
 overlay.hidden=false;document.body.style.overflow='hidden';back.focus();
}
overlay.addEventListener('click',event=>{if(event.target===overlay)closeFull()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!overlay.hidden)closeFull()});
function enhance(){
 root=document.getElementById('workoutLog');
 if(!root)return;
 for(const card of root.querySelectorAll('[data-exercise-card]')){
  if(card.querySelector('.mlc-guide-wrap'))continue;
  const e=byId.get(card.getAttribute('data-exercise-card'));if(!e)continue;
  const context=card.querySelector('.active-exercise-context');if(!context)continue;
  const wrap=el('div','mlc-guide-wrap');
  const bar=el('div','mlc-guide-bar');
  const thumbnail=el('img','mlc-guide-thumb');thumbnail.loading='lazy';thumbnail.src=imgFor(e);thumbnail.alt=approved(e)?'Starting position for '+e.name:'Image coming placeholder';if(!approved(e))thumbnail.classList.add('mlc-guide-placeholder');
  thumbnail.addEventListener('error',()=>{if(!thumbnail.src.endsWith('image-coming-approved.webp')){thumbnail.src=placeholder;thumbnail.classList.add('mlc-guide-placeholder')}},{once:true});
  const toggle=el('button','mlc-guide-toggle','View Exercise Guide ▾');toggle.type='button';toggle.setAttribute('aria-expanded','false');
  const thumbFrame=el('span','mlc-guide-thumb-frame');thumbFrame.append(thumbnail);bar.append(thumbFrame,toggle);wrap.append(bar);
  const content=el('div','mlc-guide-quick');content.hidden=true;
  const lead=el('p','mlc-guide-how',e.how||e.cue||'Detailed instructions not available');
  const muscle=el('p','mlc-guide-mini','Muscles: '+(e.muscle||e.group));
  const tip=el('p','mlc-guide-mini','Form tip: '+(Array.isArray(e.tips)&&e.tips[0]||e.cue||'Use controlled movement'));
  const full=el('button','mlc-guide-full','View Full Guide →');full.type='button';
  full.addEventListener('click',()=>openFull(e.id,full));
  content.append(lead,muscle,tip,full);wrap.append(content);
  toggle.addEventListener('click',()=>{
   const willOpen=content.hidden;
   for(const other of root.querySelectorAll('.mlc-guide-quick'))other.hidden=true;
   for(const t of root.querySelectorAll('.mlc-guide-toggle')){t.setAttribute('aria-expanded','false');t.textContent='View Exercise Guide ▾'}
   if(willOpen){content.hidden=false;toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide Exercise Guide ▴';opened=e.id}
   else opened=null;
  });
  context.insertAdjacentElement('afterend',wrap);
  if(opened===e.id){content.hidden=false;toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide Exercise Guide ▴'}
 }
 if(opened&&![...root.querySelectorAll('[data-exercise-card]')].some(card=>card.getAttribute('data-exercise-card')===opened))opened=null;
}
const observer=new MutationObserver(enhance);
observer.observe(modalContent,{childList:true,subtree:true});
enhance();
})();
