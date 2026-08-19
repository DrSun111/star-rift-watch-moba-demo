import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const source=path.join(root,'public','voxel-epoch');
const stage=path.join(root,'.voxel-mobile-stage');
const dest=path.join(root,'mobile-dist');
const assetRoot=path.join(root,'.github','voxel-assets');

async function decodeChunks(dir,out){
  let files=[];
  try{ files=(await readdir(dir)).filter(f=>f.endsWith('.txt')).sort(); }catch{return false;}
  if(!files.length)return false;
  let b64='';
  for(const file of files)b64+=(await readFile(path.join(dir,file),'utf8')).trim();
  await mkdir(path.dirname(out),{recursive:true});
  await writeFile(out,Buffer.from(b64,'base64'));
  return true;
}

await rm(stage,{recursive:true,force:true});
await rm(dest,{recursive:true,force:true});
await mkdir(stage,{recursive:true});
await cp(source,stage,{recursive:true});
await mkdir(path.join(stage,'assets'),{recursive:true});

const loadingOk=await decodeChunks(path.join(assetRoot,'loading'),path.join(stage,'assets','loading-bg.webp'));
const iconOk=await decodeChunks(path.join(assetRoot,'icon'),path.join(stage,'assets','app-icon.webp'));
if(!loadingOk)throw new Error('Offline loading artwork is missing.');

const indexPath=path.join(stage,'index.html');
let html=await readFile(indexPath,'utf8');
html=html.replace(/<script type="importmap">[\s\S]*?<\/script>/i,'');
const nativeHead=`
<script>
window.__VOXEL_NATIVE_APP__=true;
document.documentElement.classList.add('native-runtime');
window.__voxelProgress=function(value,stage){
  var n=Math.max(0,Math.min(100,Math.round(value||0)));
  var fill=document.getElementById('native-progress-fill');
  var text=document.getElementById('native-progress-text');
  var label=document.getElementById('native-progress-stage');
  if(fill)fill.style.width=n+'%';
  if(text)text.textContent=n+'%';
  if(label&&stage)label.textContent=stage;
};
window.__voxelNativeDone=function(){
  window.__voxelProgress(100,'世界已载入');
  var el=document.getElementById('native-loader');
  if(el)setTimeout(function(){el.classList.add('done');setTimeout(function(){el.remove();},700);},260);
};
window.addEventListener('error',function(e){
  var label=document.getElementById('native-progress-stage');
  if(label)label.textContent='启动异常：'+(e.message||'未知错误');
});
window.addEventListener('unhandledrejection',function(e){
  var label=document.getElementById('native-progress-stage');
  if(label)label.textContent='资源初始化失败，请重启应用';
});
</script>
<style>
html.native-runtime,html.native-runtime body{width:100%;height:100%;margin:0;overflow:hidden;background:#071018}
html.native-runtime #start-screen{display:none!important}
#native-loader{display:none}
html.native-runtime #native-loader{display:flex;position:fixed;inset:0;z-index:100000;overflow:hidden;align-items:flex-end;justify-content:center;background:#071018;transition:opacity .55s ease,visibility .55s ease}
#native-loader.done{opacity:0;visibility:hidden;pointer-events:none}
.native-loader-bg{position:absolute;inset:0;background:url('./assets/loading-bg.webp') center center/cover no-repeat;transform:scale(1.002)}
.native-loader-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,8,12,.04) 25%,rgba(2,8,12,.22) 61%,rgba(2,8,12,.88) 100%)}
.native-loader-ui{position:relative;z-index:2;width:min(62vw,780px);margin:0 0 max(5.5vh,env(safe-area-inset-bottom)) 0;text-align:center;color:#fff;text-shadow:0 2px 8px #000;padding:0 max(18px,env(safe-area-inset-left))}
.native-loader-title{font:800 clamp(20px,3.3vw,42px)/1.15 system-ui,-apple-system,'Noto Sans SC',sans-serif;letter-spacing:.04em;margin-bottom:14px;color:#fff4cb}
.native-progress{height:clamp(15px,2.5vh,25px);border-radius:999px;border:2px solid rgba(255,229,143,.92);padding:3px;background:rgba(4,12,18,.78);box-shadow:0 0 0 2px rgba(40,18,5,.46),0 8px 30px rgba(0,0,0,.4),inset 0 0 10px rgba(0,0,0,.8)}
.native-progress i{display:block;height:100%;width:2%;border-radius:999px;background:linear-gradient(90deg,#ffd33d 0%,#63ed79 48%,#39d8ff 100%);box-shadow:0 0 18px rgba(72,235,255,.85);transition:width .28s ease}
.native-progress-row{display:flex;align-items:center;justify-content:space-between;margin-top:7px;font:700 clamp(11px,1.45vw,17px)/1.2 system-ui,-apple-system,'Noto Sans SC',sans-serif;color:#d7e7ef}
#native-progress-text{color:#fff1a6;font-variant-numeric:tabular-nums}
@media(max-height:430px){.native-loader-ui{margin-bottom:max(3vh,env(safe-area-inset-bottom));width:min(68vw,680px)}.native-loader-title{margin-bottom:8px}.native-progress-row{margin-top:4px}}
</style>`;
html=html.replace('</head>',nativeHead+'\n</head>');
const loader=`<div id="native-loader" aria-live="polite"><div class="native-loader-bg"></div><div class="native-loader-shade"></div><div class="native-loader-ui"><div class="native-loader-title">正在进入许总的世界...</div><div class="native-progress"><i id="native-progress-fill"></i></div><div class="native-progress-row"><span id="native-progress-stage">初始化离线资源...</span><span id="native-progress-text">2%</span></div></div></div>`;
html=html.replace(/<body([^>]*)>/i,(m,a)=>`<body${a} class="${/class=/.test(a)?'':'native-app '}">${loader}`);
await writeFile(indexPath,html,'utf8');

const mobileCssPath=path.join(stage,'mobile.css');
let mobileCss=await readFile(mobileCssPath,'utf8');
mobileCss=mobileCss.replace('.mobile-game #mobile-controls{display:block}', '.mobile-game.game-running #mobile-controls{display:block}');
mobileCss+='\nbody.mobile-game:not(.game-running) #mobile-controls{display:none!important;pointer-events:none!important}\n';
await writeFile(mobileCssPath,mobileCss,'utf8');

const mainPath=path.join(stage,'src','main.js');
let main=await readFile(mainPath,'utf8');
main=main.replace("const canvas=document.getElementById('game-canvas');",`const nativeApp=!!globalThis.__VOXEL_NATIVE_APP__;
const boot=(n,s)=>globalThis.__voxelProgress?.(n,s);
boot(5,'启动图形引擎...');
const canvas=document.getElementById('game-canvas');`);
main=main.replace("renderer.setPixelRatio(Math.min(devicePixelRatio||1,2.15));","renderer.setPixelRatio(Math.min(devicePixelRatio||1,nativeApp?1.35:2.15));");
main=main.replace("const sun=new THREE.DirectionalLight(0xfff0cb,2.35);sun.position.set(28,46,18);sun.castShadow=true;const shadowSize=Math.min(4096,renderer.capabilities.maxTextureSize||4096);", "const sun=new THREE.DirectionalLight(0xfff0cb,2.35);sun.position.set(28,46,18);sun.castShadow=true;const shadowSize=Math.min(nativeApp?2048:4096,renderer.capabilities.maxTextureSize||4096);");
main=main.replace("const state=loadState();", "boot(14,'读取本地存档...');\nconst state=loadState();");
main=main.replace("const materials=createBlockMaterials();", "boot(22,'生成高清材质...');\nconst materials=createBlockMaterials();");
main=main.replace("const world=new VoxelWorld", "boot(34,'生成六境世界...');\nconst world=new VoxelWorld");
main=main.replace("const player=new PlayerController", "boot(43,'创建角色与镜头...');\nconst player=new PlayerController");
main=main.replace("const entities=new EntitySystem", "boot(53,'载入精灵与生物...');\nconst entities=new EntitySystem");
main=main.replace("gameplay=new Gameplay", "boot(63,'初始化任务与交互...');\ngameplay=new Gameplay");
main=main.replace("for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)world.buildChunk(pcx+dx,pcz+dz);", "boot(74,'构建出生区域...');\nworld.buildChunk(pcx,pcz);");
main=main.replace("function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,2.15));", "function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,nativeApp?1.35:2.15));");
main=main.replace("let running=false,last=performance.now(),saveAcc=0,uiAcc=0,mapAcc=0,day=.18,themeBiome='forest';", "let running=false,last=performance.now(),saveAcc=0,uiAcc=0,mapAcc=0,day=.18,themeBiome='forest';\nlet nativeReadySent=false;");
main=main.replace("materials.water.map.offset.x=(materials.water.map.offset.x+dt*.018)%1;materials.water.map.offset.y=(materials.water.map.offset.y+dt*.009)%1;renderer.render(scene,camera);requestAnimationFrame(gameLoop);", "materials.water.map.offset.x=(materials.water.map.offset.x+dt*.018)%1;materials.water.map.offset.y=(materials.water.map.offset.y+dt*.009)%1;renderer.render(scene,camera);if(nativeApp&&!nativeReadySent){nativeReadySent=true;boot(100,'世界已载入');globalThis.__voxelNativeDone?.();}requestAnimationFrame(gameLoop);");
main=main.replace("function start(){document.getElementById('start-screen').classList.add('hidden');running=true;last=performance.now();audio.unlock();audio.play('ui');ui.update();ui.drawMinimap();if(!mobile.enabled)player.lock();requestAnimationFrame(gameLoop);ui.toast(mobile.enabled?'移动端控制已启用：左摇杆移动，右侧拖动视角。':'森林出生点已载入。采集资源、制作工具并探索六境。','good');}", "function start(){if(running)return;boot(90,'进入许总的世界...');document.getElementById('start-screen')?.classList.add('hidden');document.body.classList.add('game-running');running=true;last=performance.now();audio.unlock();ui.update();ui.drawMinimap();if(!mobile.enabled&&!nativeApp)player.lock();requestAnimationFrame(gameLoop);ui.toast(mobile.enabled?'左摇杆移动，右侧拖动视角。':'森林出生点已载入。','good');}");
main=main.replace("player.update(0);world.updateSelection(camera,HOTBAR[state.selectedBlock]);renderer.render(scene,camera);", "boot(84,'准备光照与镜头...');player.update(0);world.updateSelection(camera,HOTBAR[state.selectedBlock]);renderer.render(scene,camera);boot(88,'准备触控操作...');if(nativeApp)setTimeout(start,80);");
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

// Vite hashes referenced loading art. Keep a stable icon copy for the Android resource patcher.
if(iconOk){
  await mkdir(path.join(dest,'native'),{recursive:true});
  await cp(path.join(stage,'assets','app-icon.webp'),path.join(dest,'native','app-icon.webp'));
}
const info={build:new Date().toISOString(),mode:'android-offline-autostart',offlineThree:true,offlineLoadingArt:true,offlineIcon:iconOk,importMapRequired:false};
await writeFile(path.join(dest,'build-info.json'),JSON.stringify(info,null,2));
const indexBuilt=await readFile(path.join(dest,'index.html'),'utf8');
if(/cdn\.jsdelivr\.net|unpkg\.com/.test(indexBuilt))throw new Error('External CDN reference remained in Android index.');
await rm(stage,{recursive:true,force:true});
console.log(`Prepared fully offline Android web assets in ${dest}`);
