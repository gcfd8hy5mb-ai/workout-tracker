(() => {
  'use strict';

  const BRAND='MYLIFTCOACH';
  const TITLE='MYLIFTCOACH · Train · Track · Progress';
  const ICON='images/myliftcoach-icon.svg?v=21';

  function ensureHead(){
    if(document.title!==TITLE)document.title=TITLE;
    let meta=document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if(!meta){
      meta=document.createElement('meta');
      meta.name='apple-mobile-web-app-title';
      document.head.appendChild(meta);
    }
    meta.content=BRAND;

    let icon=document.querySelector('link[rel="icon"]');
    if(!icon){
      icon=document.createElement('link');
      icon.rel='icon';
      document.head.appendChild(icon);
    }
    icon.type='image/svg+xml';
    icon.href=ICON;
  }

  ensureHead();
  window.MYLIFTCOACHBrand=Object.freeze({name:BRAND,icon:ICON,ensureHead});
})();
