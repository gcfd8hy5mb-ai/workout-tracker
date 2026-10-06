/* Shared Liftova anatomy atlas and exercise-to-muscle map. No workout data changes. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.LiftovaAnatomy=api;
})(globalThis,function(){
  'use strict';

  // Coordinates are aligned to the approved 1536 × 1024 realistic atlas.
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
    brachialis:[
      'M380 267 Q388 277 387 296 L377 324 Q369 330 365 326 Q377 293 380 267Z',
      'M617 267 Q609 277 610 296 L620 324 Q629 330 632 326 Q620 293 617 267Z'],
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
  // Contours traced against the approved realistic atlas. Each region stays
  // inside a visible muscle boundary; the image itself supplies the fibers.
  Object.assign(regions,{
    frontDelts:[
      'M385 172 Q407 174 417 198 Q414 225 393 249 Q369 250 351 233 Q346 204 359 186 Q369 176 385 172Z',
      'M611 172 Q635 176 645 190 Q658 211 647 236 Q630 251 607 249 Q587 226 586 198 Q596 177 611 172Z'],
    lateralDelts:[
      'M371 176 Q390 169 402 186 Q407 215 391 248 Q366 244 351 231 Q346 207 354 190Z',
      'M628 176 Q646 181 651 194 Q658 215 647 232 Q631 246 607 248 Q592 214 599 187 Q612 170 628 176Z'],
    rearDelts:[
      'M932 179 Q950 170 965 176 Q988 190 993 221 Q982 246 957 252 Q929 247 918 230 Q914 199 932 179Z',
      'M1108 176 Q1124 170 1142 179 Q1161 197 1158 231 Q1147 249 1122 252 Q1098 244 1087 222 Q1091 192 1108 176Z'],
    biceps:[
      'M355 252 Q374 249 387 259 Q391 284 375 316 Q364 336 349 335 Q342 321 346 297Z',
      'M613 259 Q627 249 645 252 Q657 274 655 296 Q658 319 647 334 Q631 338 620 318 Q608 287 613 259Z'],
    triceps:[
      'M897 250 Q914 241 927 251 Q935 276 929 304 Q923 328 911 340 Q892 333 884 315 Q885 276 897 250Z',
      'M1167 251 Q1183 242 1196 251 Q1208 278 1207 313 Q1198 331 1182 340 Q1172 321 1165 303 Q1161 274 1167 251Z'],
    forearms:[
      'M324 334 Q340 334 349 349 Q340 397 309 458 Q294 460 287 443 Q302 370 324 334Z',
      'M655 349 Q667 335 679 335 Q698 371 710 443 Q704 462 690 457 Q661 395 655 349Z',
      'M867 344 Q880 330 897 341 Q895 386 856 461 Q839 464 832 447 Q843 382 867 344Z',
      'M1191 342 Q1205 331 1218 345 Q1243 383 1249 447 Q1240 464 1225 459 Q1190 391 1191 342Z'],
    rhomboids:[
      'M989 216 Q1014 216 1032 235 L1032 304 Q1006 287 985 257Z',
      'M1043 235 Q1063 217 1087 216 L1091 257 Q1068 287 1043 304Z'],
    lats:[
      'M937 246 Q969 239 997 262 Q1019 295 1031 337 Q1008 375 982 383 Q945 339 928 297Z',
      'M1075 262 Q1102 239 1134 246 L1144 297 Q1127 339 1090 383 Q1065 375 1044 337 Q1057 294 1075 262Z'],
    glutes:[
      'M949 411 Q987 397 1032 421 L1032 493 Q994 512 949 491 Q936 458 949 411Z',
      'M1042 421 Q1086 397 1124 411 Q1137 456 1125 491 Q1082 512 1042 493Z'],
    quads:[
      'M405 504 Q429 495 452 505 Q470 545 465 584 Q459 613 440 631 Q411 632 394 601 Q385 550 405 504Z',
      'M547 505 Q573 495 595 504 Q613 550 603 602 Q585 630 558 631 Q538 610 532 584 Q527 545 547 505Z'],
    adductors:[
      'M456 526 Q469 511 484 527 L482 610 Q464 606 449 567Z',
      'M513 527 Q529 511 544 526 L550 567 Q535 606 515 610Z'],
    hamstrings:[
      'M936 577 Q972 568 1019 577 Q1020 624 1001 675 Q974 701 949 673 Q934 629 936 577Z',
      'M1056 577 Q1101 568 1137 577 Q1140 629 1123 673 Q1099 700 1071 675 Q1055 626 1056 577Z']
  });
  // Areas covered by the approved artwork's shorts. These contours are
  // separate from exposed muscles so the garment is tinted only where the
  // mapped muscle lies underneath; the source folds and shading remain.
  const coveredRegions={
    glutes:[
      'M955 417 Q974 407 997 412 Q1017 414 1033 426 L1033 478 Q1028 498 1006 502 Q982 503 962 490 Q947 478 944 457 Q943 434 955 417Z',
      'M1042 426 Q1058 414 1079 412 Q1101 407 1121 417 Q1133 434 1132 457 Q1129 478 1115 490 Q1094 503 1070 502 Q1048 498 1042 478Z'],
    quads:[
      'M405 452 Q422 444 438 455 Q454 471 455 499 Q435 495 405 506 Q397 483 405 452Z',
      'M560 455 Q578 444 594 452 Q603 480 594 506 Q566 495 545 499 Q546 472 560 455Z'],
    hamstrings:[
      'M948 508 Q970 499 997 505 Q1015 511 1022 526 L1018 572 Q988 565 943 576 Q940 541 948 508Z',
      'M1076 505 Q1102 499 1124 508 Q1133 540 1135 576 Q1090 565 1060 572 L1056 526 Q1063 511 1076 505Z'],
    adductors:[
      'M452 486 Q467 484 481 497 L483 525 Q466 512 451 525Z',
      'M517 497 Q532 484 547 486 L548 525 Q531 512 515 525Z']
  };
  const labels={chest:'Chest',upperChest:'Upper chest',lowerChest:'Lower chest',frontDelts:'Front deltoids',lateralDelts:'Side deltoids',rearDelts:'Rear deltoids',biceps:'Biceps',brachialis:'Brachialis',triceps:'Triceps',forearms:'Forearms',abs:'Abdominals',obliques:'Obliques',traps:'Trapezius',rhomboids:'Mid back',lats:'Latissimus dorsi',erectors:'Spinal erectors',glutes:'Glutes',quads:'Quadriceps',adductors:'Hip adductors',hamstrings:'Hamstrings',calves:'Calves',tibialis:'Tibialis anterior'};
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
      primary=['biceps'];secondary=['brachialis','forearms'];
    }else if(muscle==='triceps'){
      primary=['triceps'];secondary=has(name,/dip|close.grip.*press/)?['chest','frontDelts']:[];
    }else if(muscle==='forearms'){
      primary=['forearms'];
    }else if(muscle==='quads'){
      primary=has(name,/squat/)?['quads','glutes']:['quads'];secondary=has(name,/extension|sissy/)?[]:has(name,/squat/)?['hamstrings']:['glutes','hamstrings'];
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

  let renderSerial=0;
  const atlas='images/myliftcoach-anatomy-realistic.webp';
  function renderProfile(p,{size='detail'}={}){
    const small=size==='mini'||size==='compact';
    const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const description=`Front and back anatomical models. Primary: ${p.primaryLabels.join(', ')}. ${p.secondaryLabels.length?'Secondary: '+p.secondaryLabels.join(', ')+'.':''}`;
    const serial=++renderSerial;
    const paths=ids=>ids.filter(id=>id!=='glutes').flatMap(id=>(regions[id]||[]).map(d=>`<path data-muscle="${id}" d="${d}"/>`)).join('');
    const layer=(ids,role)=>ids.some(id=>id!=='glutes')?`<g class="liftova-muscle liftova-muscle--${role}" mask="url(#lv-body-${serial})"><image href="${atlas}" xlink:href="${atlas}" x="0" y="0" width="1536" height="1024" clip-path="url(#lv-${role}-${serial})" filter="url(#lv-tint-${role}-${serial})"/></g>`:'';
    const clothPaths=ids=>ids.flatMap(id=>(coveredRegions[id]||[]).map(d=>`<path data-muscle="${id}" data-surface="clothing" d="${d}"/>`)).join('');
    const clothLayer=(ids,role)=>ids.some(id=>coveredRegions[id])?`<g class="liftova-muscle liftova-muscle--${role} liftova-muscle--clothing" mask="url(#lv-body-${serial})"><image href="${atlas}" xlink:href="${atlas}" x="0" y="0" width="1536" height="1024" clip-path="url(#lv-cloth-${role}-${serial})" filter="url(#lv-cloth-tint-${role}-${serial})"/></g>`:'';
    return `<div class="liftova-anatomy liftova-anatomy--${small?'small':'detail'}" data-primary="${p.primary.join(' ')}" data-secondary="${p.secondary.join(' ')}" role="img" aria-label="${escape(description)}"><svg viewBox="180 0 1190 1024" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true"><defs><mask id="lv-body-${serial}" maskUnits="userSpaceOnUse" x="0" y="0" width="1536" height="1024" style="mask-type:alpha"><image href="images/myliftcoach-anatomy-body-mask.png" xlink:href="images/myliftcoach-anatomy-body-mask.png" x="0" y="0" width="1536" height="1024"/></mask><clipPath id="lv-primary-${serial}">${paths(p.primary)}</clipPath><clipPath id="lv-secondary-${serial}">${paths(p.secondary)}</clipPath><clipPath id="lv-cloth-primary-${serial}">${clothPaths(p.primary)}</clipPath><clipPath id="lv-cloth-secondary-${serial}">${clothPaths(p.secondary)}</clipPath><filter id="lv-tint-primary-${serial}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".82 0 0 0 .28  0 .25 0 0 .015  0 0 .85 0 .35  0 0 0 1 0"/></filter><filter id="lv-tint-secondary-${serial}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".34 0 0 0 .08  0 .26 0 0 .025  0 0 .44 0 .13  0 0 0 1 0"/></filter><filter id="lv-cloth-tint-primary-${serial}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".88 0 0 0 .34  0 .22 0 0 .01  0 0 .95 0 .41  0 0 0 1 0"/></filter><filter id="lv-cloth-tint-secondary-${serial}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".48 0 0 0 .11  0 .29 0 0 .025  0 0 .61 0 .18  0 0 0 1 0"/></filter></defs><image href="${atlas}" xlink:href="${atlas}" x="0" y="0" width="1536" height="1024"/>${layer(p.secondary,'secondary')}${layer(p.primary,'primary')}${clothLayer(p.secondary,'secondary')}${clothLayer(p.primary,'primary')}</svg></div>`;
  }

  const render=(ex,options)=>renderProfile(profile(ex),options);
  function renderGroups(groups,options){
    const regionGroups={Chest:['chest'],Back:['lats','rhomboids'],Shoulders:['frontDelts','lateralDelts','rearDelts'],Biceps:['biceps'],Triceps:['triceps'],Core:['abs','obliques'],Glutes:['glutes'],Quads:['quads'],Hamstrings:['hamstrings'],Calves:['calves'],Forearms:['forearms'],Cardio:['quads','glutes']};
    const primary=unique(Object.keys(groups||{}).filter(group=>groups[group]).flatMap(group=>regionGroups[group]||[]));
    return renderProfile({primary,secondary:[],primaryLabels:primary.map(id=>labels[id]),secondaryLabels:[]},options);
  }
  return Object.freeze({profile,render,renderGroups,regions:Object.freeze(regions),coveredRegions:Object.freeze(coveredRegions),labels:Object.freeze(labels)});
});
