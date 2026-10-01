/* MYLIFTCOACH anatomy v2 — precise muscle-contour rendering over the shared atlas. */
(() => {
  'use strict';
  const base=window.LiftovaAnatomy;
  if(!base)return;

  const regions={...base.regions,
    chest:[
      'M494 181 C463 170 423 168 395 181 C383 187 376 198 377 211 C378 225 384 238 397 246 C420 258 452 263 475 253 C487 248 493 239 496 228 L496 187 C496 184 495 182 494 181Z',
      'M504 181 C535 170 575 168 603 181 C615 187 622 198 621 211 C620 225 614 238 601 246 C578 258 546 263 523 253 C511 248 505 239 502 228 L502 187 C502 184 503 182 504 181Z'
    ],
    upperChest:[
      'M494 181 C463 170 423 168 395 181 C385 186 379 195 378 206 C413 213 451 216 495 208 L496 187 C496 184 495 182 494 181Z',
      'M504 181 C535 170 575 168 603 181 C613 186 619 195 620 206 C585 213 547 216 503 208 L502 187 C502 184 503 182 504 181Z'
    ],
    lowerChest:[
      'M379 218 C391 233 410 245 434 250 C457 255 479 251 494 240 L496 226 C472 237 445 240 421 235 C401 231 388 225 379 218Z',
      'M619 218 C607 233 588 245 564 250 C541 255 519 251 504 240 L502 226 C526 237 553 240 577 235 C597 231 610 225 619 218Z'
    ],
    frontDelts:[
      'M350 184 C360 171 375 166 389 173 C400 181 403 192 400 205 C397 220 391 233 383 244 C367 241 354 232 347 219 C341 207 342 194 350 184Z',
      'M648 184 C638 171 623 166 609 173 C598 181 595 192 598 205 C601 220 607 233 615 244 C631 241 644 232 651 219 C657 207 656 194 648 184Z'
    ],
    triceps:[
      'M904 246 C916 239 927 242 935 253 C942 267 940 286 937 305 C934 324 931 340 925 348 C912 351 900 345 895 334 C891 321 892 300 894 281 C896 264 898 253 904 246Z',
      'M1232 246 C1220 239 1209 242 1201 253 C1194 267 1196 286 1199 305 C1202 324 1205 340 1211 348 C1224 351 1236 345 1241 334 C1245 321 1244 300 1242 281 C1240 264 1238 253 1232 246Z'
    ]
  };

  const labels=base.labels;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shapes=(ids,role)=>ids.flatMap(id=>(regions[id]||[]).map(d=>`<path class="liftova-muscle liftova-muscle--${role}" data-muscle="${id}" d="${d}"/>`)).join('');

  function renderProfile(p,{size='detail'}={}){
    const small=size==='mini'||size==='compact';
    const description=`Front and back anatomical models. Primary: ${p.primaryLabels.join(', ')}. ${p.secondaryLabels.length?'Secondary: '+p.secondaryLabels.join(', ')+'.':''}`;
    return `<div class="liftova-anatomy liftova-anatomy--${small?'small':'detail'}" data-primary="${p.primary.join(' ')}" data-secondary="${p.secondary.join(' ')}" role="img" aria-label="${esc(description)}"><svg viewBox="180 0 1190 1024" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true"><defs><linearGradient id="lv-muscle-primary" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d86cff"/><stop offset=".48" stop-color="#b52cff"/><stop offset="1" stop-color="#8a14e8"/></linearGradient><linearGradient id="lv-muscle-secondary" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b994d6"/><stop offset="1" stop-color="#76538f"/></linearGradient></defs><image href="images/liftova-anatomy-atlas.webp" xlink:href="images/liftova-anatomy-atlas.webp" x="0" y="0" width="1536" height="1024"/>${shapes(p.secondary,'secondary')}${shapes(p.primary,'primary')}</svg>${small?'':`<div class="liftova-anatomy__legend"><span><i></i>Primary</span><span><i></i>Secondary</span></div>`}</div>`;
  }

  const render=(ex,options)=>renderProfile(base.profile(ex),options);
  const renderGroups=(groups,options)=>{
    const regionGroups={Chest:['chest'],Back:['lats','rhomboids'],Shoulders:['frontDelts','lateralDelts','rearDelts'],Biceps:['biceps'],Triceps:['triceps'],Core:['abs','obliques'],Glutes:['glutes'],Quads:['quads'],Hamstrings:['hamstrings'],Calves:['calves'],Forearms:['forearms'],Cardio:['quads','glutes']};
    const primary=[...new Set(Object.keys(groups||{}).filter(group=>groups[group]).flatMap(group=>regionGroups[group]||[]))];
    return renderProfile({primary,secondary:[],primaryLabels:primary.map(id=>labels[id]),secondaryLabels:[]},options);
  };

  window.LiftovaAnatomy=Object.freeze({...base,regions:Object.freeze(regions),render,renderGroups});
})();
