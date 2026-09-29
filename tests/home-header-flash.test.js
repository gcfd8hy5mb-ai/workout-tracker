const fs=require('fs'),assert=require('assert');
const css=fs.readFileSync('app-feel.css','utf8');
assert(!/(^|[,{])\s*header\s*,\s*\.app-header/.test(css),'generic legacy header must not be included in app-header chrome selector');
assert(css.includes('.app-header,[data-app-header]'),'modern app header selector missing');
assert(!/@media\(display-mode:standalone\)\{header,\.app-header/.test(css),'standalone mode must not restyle legacy header');
console.log('Home legacy-header flash regression checks passed');
