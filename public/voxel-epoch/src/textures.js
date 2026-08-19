import * as THREE from 'three';

function hash(x,y,seed=0){
  const s=Math.sin(x*12.9898+y*78.233+seed*37.719)*43758.5453;
  return s-Math.floor(s);
}
function clamp255(v){return Math.max(0,Math.min(255,Math.round(v)));}
function hexToRgb(hex){
  const h=hex.replace('#','');
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
}
function makeTexture({base,noise=22,spots=[],lines=[],alpha=255,seed=1}){
  const size=16, c=document.createElement('canvas'); c.width=size;c.height=size;
  const ctx=c.getContext('2d'); const img=ctx.createImageData(size,size); const rgb=hexToRgb(base);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){
    const n=(hash(x,y,seed)-.5)*noise;
    const i=(y*size+x)*4;
    img.data[i]=clamp255(rgb[0]+n);img.data[i+1]=clamp255(rgb[1]+n);img.data[i+2]=clamp255(rgb[2]+n);img.data[i+3]=alpha;
  }
  ctx.putImageData(img,0,0);
  for(const s of spots){
    const count=s.count||10, srgb=hexToRgb(s.color);
    ctx.fillStyle=`rgb(${srgb.join(',')})`;
    for(let i=0;i<count;i++){
      const x=Math.floor(hash(i,seed+8,seed)*size), y=Math.floor(hash(i,seed+17,seed)*size);
      ctx.fillRect(x,y,s.w||1,s.h||1);
    }
  }
  for(const l of lines){
    ctx.fillStyle=l.color;
    for(let p=l.start||0;p<size;p+=l.every||4){
      if(l.axis==='x') ctx.fillRect(0,p,size,l.width||1); else ctx.fillRect(p,0,l.width||1,size);
    }
  }
  const tex=new THREE.CanvasTexture(c);
  tex.magFilter=THREE.NearestFilter; tex.minFilter=THREE.NearestMipmapNearestFilter;
  tex.colorSpace=THREE.SRGBColorSpace; tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  return tex;
}

export function createBlockMaterials(){
  const textures={
    grass:makeTexture({base:'#5f9f57',noise:30,spots:[{color:'#80bb68',count:18},{color:'#3d7d43',count:13}],seed:1}),
    dirt:makeTexture({base:'#806047',noise:26,spots:[{color:'#5e4637',count:20},{color:'#9a7455',count:15}],seed:2}),
    stone:makeTexture({base:'#8f9699',noise:28,spots:[{color:'#6f777a',count:18},{color:'#adb3b4',count:12}],seed:3}),
    sand:makeTexture({base:'#d9c278',noise:16,spots:[{color:'#edd994',count:15},{color:'#bca761',count:9}],seed:4}),
    sandstone:makeTexture({base:'#cba96c',noise:18,lines:[{axis:'x',every:5,color:'#b7945d'}],seed:5}),
    snow:makeTexture({base:'#e7f2f5',noise:10,spots:[{color:'#cfe2ea',count:11}],seed:6}),
    tropicalGrass:makeTexture({base:'#439963',noise:31,spots:[{color:'#67ba79',count:18},{color:'#2e774e',count:13}],seed:7}),
    dryGrass:makeTexture({base:'#927147',noise:25,spots:[{color:'#b2915a',count:14},{color:'#705436',count:15}],seed:8}),
    wood:makeTexture({base:'#8e6748',noise:17,lines:[{axis:'y',every:4,color:'#6d4f39'}],spots:[{color:'#a87d57',count:8}],seed:9}),
    leaves:makeTexture({base:'#39714b',noise:40,spots:[{color:'#5d9467',count:24},{color:'#275a3c',count:18}],seed:10}),
    cactus:makeTexture({base:'#3d8d59',noise:18,lines:[{axis:'y',every:4,color:'#2f7146'}],seed:11}),
    ironOre:makeTexture({base:'#81888b',noise:24,spots:[{color:'#c29c78',count:20,w:2,h:1}],seed:12}),
    crystalOre:makeTexture({base:'#707b83',noise:22,spots:[{color:'#75d8ff',count:18,w:2,h:2},{color:'#b2f0ff',count:7}],seed:13}),
    obsidian:makeTexture({base:'#2f263a',noise:18,spots:[{color:'#5d4671',count:17},{color:'#18131f',count:11}],seed:14}),
    glow:makeTexture({base:'#e7c75a',noise:28,spots:[{color:'#fff3a4',count:20},{color:'#a98132',count:10}],seed:15}),
    ice:makeTexture({base:'#92d8ea',noise:12,lines:[{axis:'x',every:6,color:'#b8edf8'},{axis:'y',every:7,color:'#70bdd4'}],seed:16}),
    basalt:makeTexture({base:'#3b3742',noise:26,spots:[{color:'#201d25',count:16},{color:'#56505f',count:12}],seed:17}),
    ember:makeTexture({base:'#6c332e',noise:24,spots:[{color:'#ff8b43',count:18,w:2,h:1},{color:'#ffcf63',count:8}],seed:18}),
    water:makeTexture({base:'#3a8dbc',noise:13,lines:[{axis:'x',every:5,color:'rgba(137,211,240,.5)'}],alpha:190,seed:19}),
  };

  const materials={};
  for(const [key,tex] of Object.entries(textures)){
    const isWater=key==='water', isGlow=key==='glow'||key==='ember';
    materials[key]=new THREE.MeshStandardMaterial({
      map:tex,
      roughness:isWater?.28:.88,
      metalness:0,
      transparent:isWater,
      opacity:isWater?.72:1,
      depthWrite:!isWater,
      emissive:isGlow?new THREE.Color(key==='ember'?'#6d1f10':'#6f5b16'):new THREE.Color(0x000000),
      emissiveIntensity:isGlow?.48:0,
      alphaTest:isWater?0:.01,
    });
  }
  return materials;
}

export function createSkyGradientTexture(top='#7fc8db',bottom='#dce9dc'){
  const c=document.createElement('canvas');c.width=32;c.height=256;const ctx=c.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,0,256);grad.addColorStop(0,top);grad.addColorStop(1,bottom);
  ctx.fillStyle=grad;ctx.fillRect(0,0,c.width,c.height);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
