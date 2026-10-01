// MYLIFTCOACH native-feel forms and keyboard behavior.
(() => {
  'use strict';

  const isEditable=el=>el&&el.matches?.('input:not([type=hidden]),textarea,select,[contenteditable=true]');
  const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

  function classifyInput(input){
    const hint=`${input.name||''} ${input.id||''} ${input.placeholder||''} ${input.getAttribute('aria-label')||''}`.toLowerCase();
    if(input.tagName==='TEXTAREA'){input.enterKeyHint='done';return;}
    if(input.type==='email'){input.inputMode='email';input.autocapitalize='none';input.autocomplete=input.autocomplete||'email';return;}
    if(input.type==='tel'){input.inputMode='tel';return;}
    if(/weight|load|height|bodyweight|body weight|calorie|price|amount/.test(hint)){input.inputMode='decimal';input.enterKeyHint='next';return;}
    if(/rep|sets|age|minute|second|duration|year/.test(hint)){input.inputMode='numeric';input.enterKeyHint='next';return;}
    if(/name|title|exercise|workout/.test(hint))input.autocapitalize='words';
    if(input.type==='password')input.autocapitalize='none';
    if(!input.enterKeyHint)input.enterKeyHint='next';
  }

  function fieldShell(el){
    return el.closest('.form-group,.field,.setting-row,.card,label')||el.parentElement;
  }

  function decorate(root=document){
    root.querySelectorAll?.('input,textarea,select').forEach(el=>{
      classifyInput(el);
      el.classList.add('myliftcoach-native-field');
      el.classList.remove('liftova-native-field');
      if(el.required)el.setAttribute('aria-required','true');
      if(el.placeholder&&!el.getAttribute('aria-label')&&!el.id){el.setAttribute('aria-label',el.placeholder);}
    });
  }

  function nextField(current){
    const scope=current.closest('form,[role=dialog],section')||document;
    const fields=[...scope.querySelectorAll('input:not([disabled]):not([type=hidden]),textarea:not([disabled]),select:not([disabled])')]
      .filter(el=>el.offsetParent!==null);
    return fields[fields.indexOf(current)+1]||null;
  }

  function syncValidity(input,force=false){
    if(!input?.matches?.('input,textarea,select'))return;
    const shell=fieldShell(input);
    const shouldShow=force||input.dataset.myliftcoachTouched==='1';
    const invalid=shouldShow&&!input.validity.valid;
    input.toggleAttribute('aria-invalid',invalid);
    shell?.classList.toggle('myliftcoach-field-invalid',invalid);
    shell?.classList.toggle('myliftcoach-field-valid',shouldShow&&!invalid&&input.value!=='');
  }

  function installKeyboardBehavior(){
    document.addEventListener('focusin',event=>{
      if(!isEditable(event.target))return;
      document.documentElement.classList.add('myliftcoach-keyboard-active');
      fieldShell(event.target)?.classList.add('myliftcoach-field-active');
      setTimeout(()=>event.target.scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'center'}),180);
    });
    document.addEventListener('focusout',event=>{
      if(!isEditable(event.target))return;
      event.target.dataset.myliftcoachTouched='1';
      syncValidity(event.target);
      fieldShell(event.target)?.classList.remove('myliftcoach-field-active');
      setTimeout(()=>{
        if(!isEditable(document.activeElement))document.documentElement.classList.remove('myliftcoach-keyboard-active');
      },40);
    });
    document.addEventListener('input',event=>{
      if(!isEditable(event.target))return;
      if(event.target.dataset.myliftcoachTouched==='1')syncValidity(event.target);
    });
    document.addEventListener('keydown',event=>{
      if(event.key!=='Enter'||!event.target.matches?.('input'))return;
      if(event.target.type==='submit'||event.target.type==='button')return;
      const next=nextField(event.target);
      if(next){event.preventDefault();next.focus();}
      else{event.preventDefault();event.target.blur();}
    });
  }

  function installValidationUX(){
    document.addEventListener('invalid',event=>{
      const input=event.target;
      if(!input?.matches?.('input,textarea,select'))return;
      input.dataset.myliftcoachTouched='1';
      syncValidity(input,true);
    },true);
    document.addEventListener('submit',event=>{
      const form=event.target;
      if(!(form instanceof HTMLFormElement))return;
      const invalid=[...form.querySelectorAll('input,textarea,select')].filter(el=>!el.validity.valid);
      if(!invalid.length)return;
      invalid.forEach(el=>{el.dataset.myliftcoachTouched='1';syncValidity(el,true);});
      requestAnimationFrame(()=>invalid[0]?.scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'center'}));
    },true);
  }

  function installKeyboardDismiss(){
    document.addEventListener('pointerdown',event=>{
      if(!isEditable(document.activeElement)||isEditable(event.target)||event.target.closest?.('button,label,[role=button]'))return;
      document.activeElement.blur();
    },{passive:true});
  }

  function installStyles(){
    document.getElementById('liftovaNativeFormsStyles')?.remove();
    if(document.getElementById('myliftcoachNativeFormsStyles'))return;
    const style=document.createElement('style');
    style.id='myliftcoachNativeFormsStyles';
    style.textContent=`
      .myliftcoach-native-field{font-size:16px!important;-webkit-appearance:none;appearance:none;touch-action:manipulation;scroll-margin-top:110px;scroll-margin-bottom:160px;transition:border-color .14s ease,box-shadow .14s ease,background .14s ease}
      select.myliftcoach-native-field{appearance:auto;-webkit-appearance:menulist}
      input.myliftcoach-native-field,textarea.myliftcoach-native-field,select.myliftcoach-native-field{min-height:48px;border-radius:12px!important}
      textarea.myliftcoach-native-field{min-height:104px;resize:vertical}
      .myliftcoach-native-field::placeholder{color:#6f6878!important;opacity:1}
      .myliftcoach-native-field:focus{outline:none!important;border-color:#8f59d7!important;box-shadow:0 0 0 3px rgba(142,61,255,.13)!important}
      .myliftcoach-native-field:disabled{opacity:.48!important;cursor:not-allowed}
      .myliftcoach-field-active{border-color:rgba(147,83,211,.55)!important}
      .myliftcoach-field-invalid .myliftcoach-native-field,.myliftcoach-native-field[aria-invalid=true]{border-color:#b94f68!important;box-shadow:0 0 0 3px rgba(185,79,104,.1)!important}
      .myliftcoach-field-valid .myliftcoach-native-field:not(:focus){border-color:#315b49!important}
      form button[type=submit],form input[type=submit]{min-height:48px;touch-action:manipulation}
      button:disabled,[aria-disabled=true]{opacity:.5!important;cursor:not-allowed!important}
      input[type=checkbox],input[type=radio],input[type=range]{accent-color:#8c3cff}
      input[type=checkbox],input[type=radio]{min-width:20px;min-height:20px}
      html.myliftcoach-keyboard-active .prism-bottom-nav{transform:translateY(calc(100% + env(safe-area-inset-bottom)));pointer-events:none;transition:transform .16s ease}
      .prism-bottom-nav{transition:transform .16s ease}
      @supports(height:100dvh){body{min-height:100dvh}.container{min-height:calc(100dvh - 64px)}}
      @media(max-width:430px){.myliftcoach-native-field{font-size:16px!important}.form-group,.field,.setting-row{scroll-margin-top:96px}}
      @media(prefers-reduced-motion:reduce){.prism-bottom-nav,.myliftcoach-native-field{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function boot(){
    installStyles();
    decorate();
    installKeyboardBehavior();
    installValidationUX();
    installKeyboardDismiss();
    new MutationObserver(records=>{
      for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)decorate(node);
    }).observe(document.body,{subtree:true,childList:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
