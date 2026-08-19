import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const source=path.join(root,'public','voxel-epoch');
const dest=path.join(root,'mobile-dist');
const threeRoot=path.join(root,'node_modules','three');

await rm(dest,{recursive:true,force:true});
await mkdir(dest,{recursive:true});
await cp(source,dest,{recursive:true});
await mkdir(path.join(dest,'vendor','addons'),{recursive:true});
await cp(path.join(threeRoot,'build','three.module.js'),path.join(dest,'vendor','three.module.js'));
await cp(path.join(threeRoot,'examples','jsm'),path.join(dest,'vendor','addons'),{recursive:true});

const indexPath=path.join(dest,'index.html');
let html=await readFile(indexPath,'utf8');
html=html
  .replace('https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js','./vendor/three.module.js')
  .replace('https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/','./vendor/addons/');
html=html.replace('</head>','  <meta name="mobile-web-app-capable" content="yes" />\n  <meta name="apple-mobile-web-app-capable" content="yes" />\n</head>');
await writeFile(indexPath,html,'utf8');

const mainPath=path.join(dest,'src','main.js');
let main=await readFile(mainPath,'utf8');
main=main.replace(/if\('serviceWorker' in navigator\)\{addEventListener\('load'.*$/m,"// Service worker disabled inside the native Capacitor package.");
await writeFile(mainPath,main,'utf8');

await writeFile(path.join(dest,'build-info.json'),JSON.stringify({build:new Date().toISOString(),mode:'android-capacitor',offlineThree:true},null,2));
console.log(`Prepared Android web assets in ${dest}`);
