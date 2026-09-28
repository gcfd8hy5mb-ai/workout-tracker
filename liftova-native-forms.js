// LIFTOVA native-feel forms and keyboard behavior.
(() => {
  'use strict';

  const isEditable = el => el && el.matches?.('input:not([type=hidden]),textarea,select,[contenteditable=true]');

  function classifyInput(input){
    const hint=`${input.name||''} ${input.id||''} ${input.placeholder||''} ${input.getAttribute('aria-label')||''}`.toLowerCase();
    if(input.tagName==='TEXTAREA') return;
    if(input.type==='email'){ input.inputMode='email'; input.autocapitalize='none'; input.autocomplete=input.autocomplete||'email'; return; }
    if(input.type==='tel'){ input.inputMode='tel'; return; }
    if(/weight|load|height|bodyweight|body weight|calorie|price|amount/.test(hint)){ input.inputMode='decimal'; input.enterKeyHint='next'; return; }
    if(/rep|sets|age|minute|second|duration|year/.test(hint)){ input.inputMode='numeric'; input.enterKeyHint='next'; return; }
    if(/name|title|exercise|workout/.test(hint)){ input.autocapitalize='words'; }
    if(input.type==='password') input.autocapitalize='none';
  }

  function decorate(root=document){
    root.querySelectorAll?.('input,textarea,select').forEach(el=>{
      classifyInput(el);
      el.classList.add('liftova-native-field');
    });
  }

  function nextField(current){
    const scope=current.closest('form,[role=dialog],section') || document;
    const fields=[...scope.querySelectorAll('input:not([disabled]):not([type=hidden]),textarea:not([disabled]),select:not([disabled])')]
      .filter(el=>el.offsetParent!==null);
    return fields[fields.indexOf(current)+1] || null;
  }

  function installKeyboardBehavior(){
    document.addEventListener('focusin',event=>{
      if(!isEditable(event.target))return;
      document.documentElement.classList.add('liftova-keyboard-active');
      event.target.closest('.card,.form-group,.field,.setting-row')?.classList.add('liftova-field-active');
      setTimeout(()=>event.target.scrollIntoView({behavior:'smooth',block:'center'}),220);
    });
    document.addEventListener('focusout',event=>{
      if(!isEditable(event.target))return;
      event.target.closest('.card,.form-group,.field,.setting-row')?.classList.remove('liftova-field-active');
      setTimeout(()=>{
        if(!isEditable(document.activeElement)) document.documentElement.classList.remove('liftova-keyboard-active');
      },40);
    });
    document.addEventListener('keydown',event=>{
      if(event.key!=='Enter' || !event.target.matches?.('input'))return;
      if(event.target.type==='submit' || event.target.type==='button')return;
      const next=nextField(event.target);
      if(next){ event.preventDefault(); next.focus(); }
    });
  }

  function installKeyboardDismiss(){
    document.addEventListener('pointerdown',event=>{
      if(!isEditable(document.activeElement) || isEditable(event.target) || event.target.closest?.('button,label,[role=button]'))return;
      document.activeElement.blur();
    },{passive:true});
  }

  function installStyles(){
    if(document.getElementById('liftovaNativeFormsStyles'))return;
    const style=document.createElement('style');
    style.id='liftovaNativeFormsStyles';
    style.textContent=`
      .liftova-native-field{font-size:16px!important;-webkit-appearance:none;appearance:none;touch-action:manipulation}
      select.liftova-native-field{appearance:auto;-webkit-appearance:menulist}
      input.liftova-native-field,textarea.liftova-native-field,select.liftova-native-field{min-height:46px}
      textarea.liftova-native-field{min-height:96px;resize:vertical}
      .liftova-native-field:focus{outline:none!important;border-color:#8052b8!important;box-shadow:0 0 0 3px rgba(142,61,255,.12)!important}
      .liftova-field-active{border-color:rgba(147,83,211,.55)!important}
      input[type=checkbox],input[type=radio]{accent-color:#8c3cff}
      input[type=range]{accent-color:#8c3cff}
      html.liftova-keyboard-active .prism-bottom-nav{transform:translateY(calc(100% + env(safe-area-inset-bottom)));pointer-events:none;transition:transform .16s ease}
      .prism-bottom-nav{transition:transform .16s ease}
      @supports(height:100dvh){body{min-height:100dvh}.container{min-height:calc(100dvh - 64px)}}
      @media(prefers-reduced-motion:reduce){.prism-bottom-nav{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function boot(){
    installStyles();
    decorate();
    installKeyboardBehavior();
    installKeyboardDismiss();
    new MutationObserver(records=>{
      for(const record of records) for(const node of record.addedNodes) if(node.nodeType===1) decorate(node);
    }).observe(document.body,{subtree:true,childList:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
