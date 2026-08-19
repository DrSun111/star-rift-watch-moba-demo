import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const source=path.join(root,'public','voxel-epoch');
const stage=path.join(root,'.voxel-mobile-stage');
const dest=path.join(root,'mobile-dist');

await rm(stage,{recursive:true,force:true});
await rm(dest,{recursive:true,force:true});
await mkdir(stage,{recursive:true});
await cp(source,stage,{recursive:true});

const indexPath=path.join(stage,'index.html');
let html=await readFile(indexPath,'utf8');
html=html.replace(/<script type="importmap">[\s\S]*?<\/script>/i,'');
await writeFile(indexPath,html,'utf8');

const mainPath=path.join(stage,'src','main.js');
let main=await readFile(mainPath,'utf8');
main=main.replace(/if\('serviceWorker' in navigator\)\{[\s\S]*?\}\s*$/m,"// Native Android package: service worker disabled.");
await writeFile(mainPath,main,'utf8');

await build({
  root:stage,
  base:'./',
  publicDir:false,
  logLevel:'info',
  build:{
    outDir:dest,
    emptyOutDir:true,
    target:'es2020',
    minify:'oxc',
    sourcemap:false,
    cssCodeSplit:true,
    assetsInlineLimit:8192,
    rollupOptions:{output:{entryFileNames:'assets/game-[hash].js',chunkFileNames:'assets/chunk-[hash].js',assetFileNames:'assets/[name]-[hash][extname]'}}
  }
});

await writeFile(path.join(dest,'build-info.json'),JSON.stringify({build:new Date().toISOString(),mode:'android-capacitor-vite-bundle',offlineThree:true,importMapRequired:false},null,2));
await rm(stage,{recursive:true,force:true});
console.log(`Prepared bundled Android web assets in ${dest}`);
