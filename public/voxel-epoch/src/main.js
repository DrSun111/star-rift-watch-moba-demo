import * as THREE from 'three';
import { GAME, BIOMES, HOTBAR } from './config.js';
import { createBlockMaterials } from './textures.js';
import { loadState, saveState, resetState } from './save.js';
import { VoxelWorld } from './world.js';
import { PlayerController } from './player.js';
import { EntitySystem } from './entities.js';
import { GameUI } from './ui.js';
import { Gameplay } from './gameplay.js';
import { MobileControls } from './mobile.js';
import { GameAudio } from './audio.js';

const canvas=document.getElementById('game-canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2.15));
renderer.setSize(innerWidth,innerHeight,false);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.info.autoReset=true;

const scene=new THREE.Scene();
scene.background=new THREE.Color('#8fc7d2');
scene.fog=new THREE.FogExp2('#a7ced0',0.0145);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.06,280);

const hemi=new THREE.HemisphereLight(0xc8ecff,0x52614b,1.05);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0cb,2.35);sun.position.set(28,46,18);sun.castShadow=true;const shadowSize=Math.min(4096,renderer.capabilities.maxTextureSize||4096);sun.shadow.mapSize.set(shadowSize,shadowSize);sun.shadow.radius=3;sun.shadow.camera.left=-34;sun.shadow.camera.right=34;sun.shadow.camera.top=34;sun.shadow.camera.bottom=-34;sun.shadow.camera.near=1;sun.shadow.camera.far=110;sun.shadow.bias=-.00045;scene.add(sun);scene.add(sun.target);
const rim=new THREE.DirectionalLight(0x8eb8ff,.55);rim.position.set(-24,18,-32);scene.add(rim);const warmFill=new THREE.DirectionalLight(0xffd8ad,.32);warmFill.position.set(18,12,-20);scene.add(warmFill);
const sunOrb=new THREE.Mesh(new THREE.SphereGeometry(2.1,16,12),new THREE.MeshBasicMaterial({color:0xffefb1}));scene.add(sunOrb);

const state=loadState();
const materials=createBlockMaterials();const aniso=Math.min(16,renderer.capabilities.getMaxAnisotropy?.()||1);for(const material of Object.values(materials)){if(material.map)material.map.anisotropy=aniso;if(material.bumpMap)material.bumpMap.anisotropy=aniso;}
const audio=new GameAudio();globalThis.__voxelAudio=audio;
let gameplay=null;
const world=new VoxelWorld(scene,materials,state,(resource,count,label)=>gameplay?.addResource(resource,count,label));
const player=new PlayerController(camera,canvas,scene,world,state);
player.position.set(state.x||0,Math.max(state.y||8,world.getHeight(Math.round(state.x||0),Math.round(state.z||0))+1.1),state.z||0);
player.updateGearVisual();
const entities=new EntitySystem(scene,world,state);
const ui=new GameUI(state,world,entities,player);
gameplay=new Gameplay(state,world,entities,player,ui);ui.setGameplay(gameplay);entities.spawnFollowers();const mobile=new MobileControls({player,gameplay,ui,canvas,state});

const pcx=Math.floor(player.position.x/GAME.chunkSize),pcz=Math.floor(player.position.z/GAME.chunkSize);
for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)world.buildChunk(pcx+dx,pcz+dz);

const cloudGroup=new THREE.Group();scene.add(cloudGroup);
const cloudMat=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.72,depthWrite:false});
for(let i=0;i<14;i++){
  const c=new THREE.Group();const blocks=3+(i%3);
  for(let j=0;j<blocks;j++){const m=new THREE.Mesh(new THREE.BoxGeometry(3.8+(j%2),.65,2.2),cloudMat);m.position.set((j-(blocks-1)/2)*2.5,(j%2)*.3,(j%3-1)*.7);c.add(m);}
  c.position.set((i-7)*18,25+(i%4)*2,(i%5-2)*28);cloudGroup.add(c);
}

const netherAsh=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({color:0xd098ff,size:.09,transparent:true,opacity:.75,depthWrite:false}));
{const pts=[];for(let i=0;i<480;i++)pts.push((Math.random()-.5)*100,Math.random()*32,(Math.random()-.5)*100);netherAsh.geometry.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));}
scene.add(netherAsh);netherAsh.visible=state.dimension==='nether';

const weatherGeom=new THREE.BufferGeometry();
const weatherCount=520;const weatherData=new Float32Array(weatherCount*3);
for(let i=0;i<weatherCount;i++){weatherData[i*3]=(Math.random()-.5)*60;weatherData[i*3+1]=Math.random()*28;weatherData[i*3+2]=(Math.random()-.5)*60;}
weatherGeom.setAttribute('position',new THREE.BufferAttribute(weatherData,3));
const weatherMat=new THREE.PointsMaterial({color:0xffffff,size:.075,transparent:true,opacity:.66,depthWrite:false});
const weather=new THREE.Points(weatherGeom,weatherMat);scene.add(weather);weather.visible=false;

let running=false,last=performance.now(),saveAcc=0,uiAcc=0,mapAcc=0,day=.18,themeBiome='forest';
let perfAcc=0,perfFrames=0,qualityTier=2;
const targetBg=new THREE.Color(),targetFog=new THREE.Color();

function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,2.15));renderer.setSize(innerWidth,innerHeight,false);}
addEventListener('resize',resize);

function sceneTheme(dt){
  if(state.dimension==='nether'){
    targetBg.set('#170d1c');targetFog.set('#291531');hemi.color.set('#7b668d');hemi.groundColor.set('#24151f');hemi.intensity=.48;sun.color.set('#a66ac4');sun.intensity=.72;scene.fog.density=.029;cloudGroup.visible=false;netherAsh.visible=true;sunOrb.visible=false;
  }else{
    themeBiome=world.getBiome(player.position.x,player.position.z);const b=BIOMES[themeBiome];targetBg.set(b.sky);targetFog.set(b.fog);hemi.color.set('#c8ecff');hemi.groundColor.set('#52614b');hemi.intensity=1.05;scene.fog.density=.0145;cloudGroup.visible=true;netherAsh.visible=false;sunOrb.visible=true;
    day=(day+dt*.006)%1;const ang=day*Math.PI*2;const sx=Math.cos(ang)*38,sy=22+Math.sin(ang)*30,sz=Math.sin(ang*.8)*30;sun.position.set(player.position.x+sx,sy,player.position.z+sz);const daylight=THREE.MathUtils.clamp((sy+8)/42,.18,1);sun.intensity=1.3+daylight*1.35;sun.color.set(daylight<.38?'#ffae7d':'#fff0cb');hemi.intensity=.45+daylight*.72;sunOrb.position.copy(camera.position).add(new THREE.Vector3(sx,sy,sz).normalize().multiplyScalar(95));if(daylight<.3)targetBg.multiplyScalar(.36);
  }
  scene.background.lerp(targetBg,1-Math.exp(-dt*2));scene.fog.color.lerp(targetFog,1-Math.exp(-dt*2));sun.target.position.set(player.position.x,0,player.position.z);sun.target.updateMatrixWorld();
}
function updateClouds(dt){if(!cloudGroup.visible)return;for(const c of cloudGroup.children){c.position.x+=dt*.7;if(c.position.x-player.position.x>95)c.position.x-=190;if(c.position.x-player.position.x<-95)c.position.x+=190;}cloudGroup.position.x=player.position.x*.12;cloudGroup.position.z=player.position.z*.12;}
function updateWeather(dt){if(state.dimension==='nether'){weather.visible=false;return;}const b=world.getBiome(player.position.x,player.position.z);if(b==='forest'){weather.visible=false;return;}weather.visible=true;weather.position.set(player.position.x,player.position.y-2,player.position.z);const attr=weather.geometry.attributes.position,arr=attr.array;let fall=0,drift=.22;if(b==='snow'){weatherMat.color.set('#f3fbff');weatherMat.size=.085;weatherMat.opacity=.8;fall=3.0;drift=.18;}else if(b==='desert'||b==='wasteland'){weatherMat.color.set(b==='desert'?'#e7ce8d':'#b89a73');weatherMat.size=.065;weatherMat.opacity=.38;fall=.12;drift=1.35;}else if(b==='tropical'){weatherMat.color.set('#d9ef86');weatherMat.size=.075;weatherMat.opacity=.42;fall=-.08;drift=.2;}else{weatherMat.color.set('#d9f4ff');weatherMat.size=.06;weatherMat.opacity=.34;fall=.35;drift=.45;}for(let i=0;i<weatherCount;i++){const k=i*3;arr[k]+=dt*drift;arr[k+1]-=dt*fall;arr[k+2]+=Math.sin((i+performance.now()*.001)*.7)*dt*drift*.2;if(arr[k]>30)arr[k]-=60;if(arr[k]<-30)arr[k]+=60;if(arr[k+2]>30)arr[k+2]-=60;if(arr[k+2]<-30)arr[k+2]+=60;if(arr[k+1]<0)arr[k+1]+=28;if(arr[k+1]>28)arr[k+1]-=28;}attr.needsUpdate=true;}
function updateNetherAsh(dt){if(!netherAsh.visible)return;netherAsh.position.set(player.position.x,0,player.position.z);netherAsh.rotation.y+=dt*.025;}

function gameLoop(now){
  if(!running)return;const dt=Math.min(.035,(now-last)/1000||0);last=now;
  world.update(player.position);player.update(dt);entities.update(dt,player);gameplay.update(dt);world.updateSelection(camera,HOTBAR[state.selectedBlock]);sceneTheme(dt);world.updatePortalVisual(state.gear.portal,now*.001);updateClouds(dt);updateWeather(dt);updateNetherAsh(dt);audio.update(dt,state.dimension==='nether'?'nether':themeBiome,player);
  uiAcc+=dt;if(uiAcc>.11){uiAcc=0;ui.update();}mapAcc+=dt;if(mapAcc>.16){mapAcc=0;ui.drawMinimap();}saveAcc+=dt;if(saveAcc>GAME.autosaveSeconds){saveAcc=0;saveState(state);}perfAcc+=dt;perfFrames++;if(perfAcc>4){const fps=perfFrames/perfAcc;perfAcc=0;perfFrames=0;if(fps<30&&qualityTier===2){qualityTier=1;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.45));ui.toast('已自动降低渲染分辨率以保持流畅。','warn');}else if(fps<24&&qualityTier===1){qualityTier=0;renderer.setPixelRatio(1);renderer.shadowMap.enabled=false;ui.toast('已切换性能优先模式。','warn');}}
  materials.water.map.offset.x=(materials.water.map.offset.x+dt*.018)%1;materials.water.map.offset.y=(materials.water.map.offset.y+dt*.009)%1;renderer.render(scene,camera);requestAnimationFrame(gameLoop);
}

function lockIfGameReady(){if(mobile.enabled)return;if(document.getElementById('inventory-drawer').classList.contains('hidden')&&document.getElementById('map-modal').classList.contains('hidden'))player.lock();}
canvas.addEventListener('mousedown',e=>{if(!running)return;if(!player.isLocked&&!mobile.enabled){lockIfGameReady();return;}if(e.button===0)gameplay.removeOrAttack();if(e.button===2)gameplay.placeBlock();});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if(!running)return;if(e.code==='KeyE'&&!e.repeat)gameplay.interact();if(e.code==='KeyQ'&&!e.repeat)gameplay.capture();if(e.code==='KeyR'&&!e.repeat)gameplay.ride();});
player.controls.addEventListener('unlock',()=>{if(!mobile.enabled&&running&&document.getElementById('inventory-drawer').classList.contains('hidden')&&document.getElementById('map-modal').classList.contains('hidden'))ui.toast('鼠标已释放。点击游戏画面继续控制视角。');});

function start(){document.getElementById('start-screen').classList.add('hidden');running=true;last=performance.now();audio.unlock();audio.play('ui');ui.update();ui.drawMinimap();if(!mobile.enabled)player.lock();requestAnimationFrame(gameLoop);ui.toast(mobile.enabled?'移动端控制已启用：左摇杆移动，右侧拖动视角。':'森林出生点已载入。采集资源、制作工具并探索六境。','good');}
document.getElementById('start-game').onclick=start;document.getElementById('reset-save').onclick=()=>{resetState();location.reload();};
addEventListener('pagehide',()=>saveState(state));addEventListener('beforeunload',()=>saveState(state));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveState(state);});
player.update(0);world.updateSelection(camera,HOTBAR[state.selectedBlock]);renderer.render(scene,camera);
if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
