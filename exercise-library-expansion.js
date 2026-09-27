/* PRISM Exercise Library Expansion loader — preserves v1 + v2 additions, then loads v3. */
(()=>{
 function load(src,tag,onload){if(document.querySelector(`script[data-prism-${tag}]`)){onload?.();return}const s=document.createElement('script');s.src=src;s.async=false;s.dataset[`prism${tag.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())}`]='1';s.onload=()=>onload?.();document.body.appendChild(s)}
 load('exercise-library-expansion-v1.js?v=1.0','exercise-library-v1',()=>load('exercise-library-expansion-2.js?v=2.0','exercise-library-v2',()=>load('exercise-library-expansion-3.js?v=3.0','exercise-library-v3')));
})();