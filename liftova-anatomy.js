/* Shared Liftova anatomy atlas and exercise-to-muscle map. No workout data changes. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.LiftovaAnatomy=api;
})(globalThis,function(){
  'use strict';

  // Coordinates are aligned to the generated 1536 × 1024 transparent atlas.
  // Paths follow visible muscle boundaries rather than painting whole limbs.
  const regions={
    chest:[
      'M386 187 Q430 166 490 181 L495 243 Q444 275 387 248 Q371 225 386 187Z',
      'M506 181 Q564 166 613 187 Q627 224 609 248 Q552 274 501 243Z'],
    upperChest:[
      'M388 188 Q430 166 490 181 L490 213 Q437 218 379 211Z',
      'M507 181 Q566 166 614 188 L623 211 Q563 219 507 213Z'],
    lowerChest:[
      'M387 219 Q446 239 493 225 L495 245 Q441 274 387 248Z',
      'M503 225 Q555 240 611 219 L609 249 Q555 276 501 245Z'],
    frontDelts:[
      'M350 179 Q373 159 398 179 Q405 206 385 246 Q356 242 343 215Z',
      'M601 179 Q626 159 650 180 L657 218 Q644 241 614 246 Q595 209 601 179Z'],
    lateralDelts:[
      'M341 193 Q354 171 373 170 L381 232 Q355 248 341 217Z',
      'M626 170 Q648 171 660 194 L658 219 Q644 245 620 232Z'],
    rearDelts:[
      'M912 184 Q933 167 963 181 L973 216 Q946 249 915 236Z',
      'M1164 181 Q1194 167 1218 186 L1218 237 Q1193 249 1161 216Z'],
    biceps:[
      'M345 241 Q369 244 378 260 L367 333 Q350 348 336 324Z',
      'M622 260 Q634 244 652 241 L665 324 Q652 348 636 333Z'],
    triceps:[
      'M901 240 Q921 238 938 260 L930 344 Q907 357 890 322Z',
      'M1195 260 Q1214 238 1235 242 L1243 322 Q1226 356 1204 344Z'],
    forearms:[
      'M315 329 Q339 328 359 351 L327 462 Q307 481 289 452Z',
      'M644 351 Q665 329 688 329 L713 452 Q696 481 674 461Z',
      'M869 344 Q895 338 915 357 L884 467 Q865 475 852 445Z',
      'M1218 357 Q1238 339 1261 344 L1277 445 Q1263 475 1246 468Z'],
    abs:[
      'M433 256 Q461 269 493 255 L493 395 Q466 410 439 394Z',
      'M504 255 Q537 269 564 257 L559 394 Q535 410 504 394Z'],
    obliques:[
      'M394 250 Q413 270 434 267 L437 392 Q415 414 396 390Z',
      'M564 267 Q586 270 606 250 L604 390 Q583 414 561 392Z'],
    traps:[
      'M949 138 Q999 153 1067 163 L1067 227 Q1013 228 954 193Z',
      'M1073 163 Q1142 151 1192 138 L1187 193 Q1131 229 1073 227Z'],
    rhomboids:[
      'M1003 208 L1067 225 L1067 313 Q1037 314 1000 272Z',
      'M1073 225 L1137 207 L1140 272 Q1106 315 1073 313Z'],
    lats:[
      'M947 236 Q985 224 1013 267 L1052 343 L1014 417 Q962 387 940 303Z',
      'M1125 267 Q1155 226 1192 236 L1198 303 Q1177 389 1126 417 L1086 343Z'],
    erectors:[
      'M1041 306 Q1056 298 1068 311 L1068 435 L1030 426Z',
      'M1072 311 Q1087 298 1101 306 L1111 426 L1072 435Z'],
    glutes:[
      'M950 438 Q1003 422 1067 452 L1064 535 Q1005 559 946 524Z',
      'M1073 452 Q1135 422 1190 439 L1195 524 Q1137 558 1075 535Z'],
    quads:[
      'M369 504 Q410 479 471 505 L469 655 Q431 684 390 647Z',
      'M527 505 Q589 479 631 504 L611 648 Q570 684 532 655Z'],
    adductors:[
      'M453 496 Q472 485 491 501 L486 613 Q462 612 447 571Z',
      'M506 501 Q526 485 546 496 L552 571 Q535 612 511 613Z'],
    hamstrings:[
      'M957 568 Q1009 556 1061 581 L1050 706 Q1012 731 975 697Z',
      'M1080 581 Q1134 556 1184 568 L1166 698 Q1129 730 1090 706Z'],
    calves:[
      'M380 701 Q410 682 443 714 L438 845 Q416 872 391 842Z',
      'M552 713 Q587 684 617 701 L604 843 Q580 873 556 845Z',
      'M969 722 Q1000 700 1028 729 L1019 853 Q998 877 977 849Z',
      'M1110 729 Q1140 700 1170 722 L1161 849 Q1140 877 1119 853Z'],
    tibialis:[
      'M374 704 Q387 696 400 708 L410 853 Q391 865 379 835Z',
      'M596 708 Q610 696 623 705 L617 835 Q604 865 587 853Z']
  };
  const labels={chest:'Chest',upperChest:'Upper chest',lowerChest:'Lower chest',frontDelts:'Front deltoids',lateralDelts:'Side deltoids',rearDelts:'Rear deltoids',biceps:'Biceps',triceps:'Triceps',forearms:'Forearms',abs:'Abdominals',obliques:'Obliques',traps:'Trapezius',rhomboids:'Mid back',lats:'Latissimus dorsi',erectors:'Spinal erectors',glutes:'Glutes',quads:'Quadriceps',adductors:'Hip adductors',hamstrings:'Hamstrings',calves:'Calves',tibialis:'Tibialis anterior'};
  const unique=a=>[...new Set(a.filter(Boolean))];
  const has=(name,pattern)=>pattern.test(name);

  function profile(ex){
    const name=String(ex?.name||ex?.id||'').toLowerCase();
    const muscle=String(ex?.muscle||'').toLowerCase();
    let primary=[],secondary=[];
    if(muscle==='chest'){
      primary=[has(name,/incline|low.to.high/)?'upperChest':has(name,/decline|high.to.low/)?'lowerChest':'chest'];
      secondary=has(name,/fly|deck|crossover/)?['frontDelts']:['triceps','frontDelts'];
    }else if(muscle==='back'){
      if(has(name,/deadlift|good.morning|back.extension|hyperextension/)){primary=['erectors'];secondary=['glutes','hamstrings'];}
      else if(has(name,/shrug/)){primary=['traps'];secondary=['forearms'];}
      else if(has(name,/row/)){primary=['lats','rhomboids'];secondary=['biceps','rearDelts'];}
      else{primary=['lats'];secondary=['biceps','rhomboids'];}
    }else if(muscle==='shoulders'){
      if(has(name,/rear|reverse|face.pull|reverse.fly/)){primary=['rearDelts'];secondary=['rhomboids','traps'];}
      else if(has(name,/lateral|side.raise|upright.row/)){primary=['lateralDelts'];secondary=['traps'];}
      else if(has(name,/front.raise/)){primary=['frontDelts'];secondary=['upperChest'];}
      else{primary=['frontDelts','lateralDelts'];secondary=['triceps'];}
    }else if(muscle==='biceps'){
      primary=['biceps'];secondary=has(name,/hammer|reverse|zottman/)?['forearms']:['forearms'];
    }else if(muscle==='triceps'){
      primary=['triceps'];secondary=has(name,/dip|close.grip.*press/)?['chest','frontDelts']:[];
    }else if(muscle==='forearms'){
      primary=['forearms'];
    }else if(muscle==='quads'){
      primary=['quads'];secondary=has(name,/extension|sissy/)?[]:['glutes','hamstrings'];
    }else if(muscle==='hamstrings'){
      primary=['hamstrings'];secondary=has(name,/curl|nordic/)?['calves']:['glutes','erectors'];
    }else if(muscle==='glutes'){
      if(has(name,/adductor/)){primary=['adductors'];secondary=['glutes'];}
      else{primary=['glutes'];secondary=has(name,/abduct|kickback|bridge|thrust|frog.pump/)?['hamstrings']:['quads','hamstrings'];}
    }else if(muscle==='calves'){
      primary=has(name,/tibialis|dorsi.flex/)?['tibialis']:['calves'];
    }else if(muscle==='core'){
      primary=has(name,/woodchop|twist|pallof|side|rotation|carry/)?['obliques','abs']:['abs'];
      secondary=has(name,/plank|rollout|dead.bug/)?['obliques']:[];
    }else if(muscle==='cardio'){
      if(has(name,/ski|rope|slam|upper.body|boxing|punch/)){primary=['lats','frontDelts'];secondary=['triceps','abs'];}
      else if(has(name,/row|pull/)){primary=['quads','lats'];secondary=['hamstrings','biceps'];}
      else if(has(name,/jump|stair|step|climb|sprint|run|treadmill|walk/)){primary=['quads','calves'];secondary=['glutes','hamstrings'];}
      else{primary=['quads','glutes'];secondary=['hamstrings','calves'];}
    }else if(muscle==='legs'){
      primary=['quads','glutes'];secondary=['hamstrings','calves'];
    }
    // For custom exercises, infer only recognizable movements. An unfamiliar
    // name retains the atlas without inventing a target muscle.
    if(!primary.length){
      if(has(name,/curl/))primary=['biceps'];
      else if(has(name,/press|push.up/))primary=['chest'];
      else if(has(name,/row|pull/))primary=['lats'];
      else if(has(name,/squat|lunge/))primary=['quads'];
    }
    primary=unique(primary);secondary=unique(secondary).filter(x=>!primary.includes(x));
    return {primary,secondary,primaryLabels:primary.map(x=>labels[x]),secondaryLabels:secondary.map(x=>labels[x])};
  }

  function renderProfile(p,{size='detail'}={}){
    const small=size==='mini'||size==='compact';
    const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const description=`Front and back anatomical models. Primary: ${p.primaryLabels.join(', ')}. ${p.secondaryLabels.length?'Secondary: '+p.secondaryLabels.join(', ')+'.':''}`;
    const shapes=(ids,role)=>ids.flatMap(id=>(regions[id]||[]).map(d=>`<path class="liftova-muscle liftova-muscle--${role}" data-muscle="${id}" d="${d}"/>`)).join('');
    return `<div class="liftova-anatomy liftova-anatomy--${small?'small':'detail'}" data-primary="${p.primary.join(' ')}" data-secondary="${p.secondary.join(' ')}" role="img" aria-label="${escape(description)}"><svg viewBox="180 0 1190 1024" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true"><defs><linearGradient id="lv-muscle-primary" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ee94ff"/><stop offset=".5" stop-color="#ab2dff"/><stop offset="1" stop-color="#6511d9"/></linearGradient><linearGradient id="lv-muscle-secondary" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c8a6ea"/><stop offset="1" stop-color="#755b9b"/></linearGradient></defs><image href="images/liftova-anatomy-atlas.webp" xlink:href="images/liftova-anatomy-atlas.webp" x="0" y="0" width="1536" height="1024"/>${shapes(p.secondary,'secondary')}${shapes(p.primary,'primary')}</svg>${small?'':`<div class="liftova-anatomy__legend"><span><i></i>Primary</span><span><i></i>Secondary</span></div>`}</div>`;
  }

  const render=(ex,options)=>renderProfile(profile(ex),options);
  function renderGroups(groups,options){
    const regionGroups={Chest:['chest'],Back:['lats','rhomboids'],Shoulders:['frontDelts','lateralDelts','rearDelts'],Biceps:['biceps'],Triceps:['triceps'],Core:['abs','obliques'],Glutes:['glutes'],Quads:['quads'],Hamstrings:['hamstrings'],Calves:['calves'],Forearms:['forearms'],Cardio:['quads','glutes']};
    const primary=unique(Object.keys(groups||{}).filter(group=>groups[group]).flatMap(group=>regionGroups[group]||[]));
    return renderProfile({primary,secondary:[],primaryLabels:primary.map(id=>labels[id]),secondaryLabels:[]},options);
  }
  return Object.freeze({profile,render,renderGroups,regions:Object.freeze(regions),labels:Object.freeze(labels)});
});
