/* Pre-beta destination hardening for long Profile/Manage screens. Presentation/navigation only. */
(() => {
  'use strict';
  const install=()=>{
    if(window.__myliftcoachSettingsDestinationFixes)return true;
    if(typeof window.showSettings!=='function'||typeof window.showDataBackup!=='function')return false;
    const originalSettings=window.showSettings;
    const originalBackup=window.showDataBackup;
    const reveal=id=>{
      const run=()=>{
        const target=document.getElementById(id);
        if(!target)return;
        target.scrollIntoView({behavior:'auto',block:'start',inline:'nearest'});
      };
      requestAnimationFrame(()=>requestAnimationFrame(run));
      setTimeout(run,80);
    };
    window.showSettings=function(){const result=originalSettings.apply(this,arguments);reveal('profileSettings');return result;};
    window.showDataBackup=function(){const result=originalBackup.apply(this,arguments);reveal('dataBackupSection');return result;};
    window.__myliftcoachSettingsDestinationFixes=true;
    return true;
  };
  if(!install())document.addEventListener('DOMContentLoaded',install,{once:true});
})();
