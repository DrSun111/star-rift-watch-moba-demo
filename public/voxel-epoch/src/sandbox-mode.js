import { Gameplay } from './gameplay.js';
import { GameUI } from './ui.js';
import { RESOURCES } from './config.js';

const RESOURCE_POOL=9_000_000_000;
const RESOURCE_IDS=Object.keys(RESOURCES);

export const EVOLUTION_STAGES=[
  {stage:1,name:'灵芽初生体',rank:'C',kind:'moss',variant:'sprout',mount:null,color:'#63c780',power:6},
  {stage:2,name:'青苔灵兽',rank:'C',kind:'moss',variant:'glow',mount:'run',color:'#55d48b',power:9},
  {stage:3,name:'岩角幼体',rank:'B',kind:'horn',variant:'stone',mount:'run',color:'#9d805d',power:12},
  {stage:4,name:'晶铠角兽',rank:'B',kind:'horn',variant:'crystal',mount:'run',color:'#70b7b2',power:15},
  {stage:5,name:'砂翼猎蜥',rank:'A',kind:'lizard',variant:'sand',mount:'run',color:'#d69a4d',power:18},
  {stage:6,name:'赤焰棘龙',rank:'A',kind:'lizard',variant:'ember',mount:'run',color:'#d96042',power:22},
  {stage:7,name:'霜牙灵狼',rank:'S',kind:'wolf',variant:'frost',mount:'run',color:'#c7e8f3',power:26},
  {stage:8,name:'幽夜雷豹',rank:'S',kind:'wolf',variant:'panther',mount:'run',color:'#525978',power:30},
  {stage:9,name:'潮汐海灵',rank:'S',kind:'tide',variant:'wave',mount:'swim',color:'#52b8dd',power:35},
  {stage:10,name:'深海龙鲛',rank:'SSS',kind:'tide',variant:'abyss',mount:'swim',color:'#347ebf',power:40},
  {stage:11,name:'雷羽天隼',rank:'SSS',kind:'bird',variant:'storm',mount:'fly',color:'#9678ee',power:46},
  {stage:12,name:'月辉蝶皇',rank:'SSS',kind:'bird',variant:'moth',mount:'fly',color:'#cb83e8',power:52},
  {stage:13,name:'苍穹狮鹫',rank:'SSS',kind:'bird',variant:'gryphon',mount:'fly',color:'#d0aa5e',power:60},
  {stage:14,name:'星渊幼龙',rank:'SSSS',kind:'dragon',variant:'astral',mount:'fly',color:'#e8c661',power:68},
  {stage:15,name:'圣辉麒麟',rank:'SSSS',kind:'dragon',variant:'qilin',mount:'fly',color:'#9de7d3',power:77},
  {stage:16,name:'虚空凤凰',rank:'SSSS',kind:'bird',variant:'phoenix',mount:'fly',color:'#e7715d',power:87},
  {stage:17,name:'永冻天龙',rank:'SSSS',kind:'dragon',variant:'frost-dragon',mount:'fly',color:'#9bd9f4',power:98},
  {stage:18,name:'神木圣龙',rank:'SSSS',kind:'dragon',variant:'verdant',mount:'fly',color:'#6fcf78',power:110},
  {stage:19,name:'混沌界龙',rank:'SSSS',kind:'dragon',variant:'chaos',mount:'fly',color:'#9b64e8',power:123},
  {stage:20,name:'创世终焉龙',rank:'SSSS',kind:'dragon',variant:'genesis',mount:'fly',color:'#ffd764',power:138},
];

function stageFor(n){return EVOLUTION_STAGES[Math.max(0,Math.min(19,(Number(n)||1)-1))];}
function ensurePetEvolution(p){
  if(!p)return;
  if(!Number.isFinite(p.evolutionStage)||p.evolutionStage<1||p.evolutionStage>20)p.evolutionStage=1;
  if(!Number.isFinite(p.evolutionCycle)||p.evolutionCycle<0)p.evolutionCycle=0;
}
function ensureInfinite(state){
  if(!state)return;
  state.resources=state.resources||{};
  for(const id of RESOURCE_IDS)state.resources[id]=RESOURCE_POOL;
  for(const p of state.pets||[])ensurePetEvolution(p);
}

if(!Gameplay.prototype.__sandboxInfiniteV20){
  Gameplay.prototype.__sandboxInfiniteV20=true;
  const originalUpdate=Gameplay.prototype.update;
  Gameplay.prototype.update=function(dt){ensureInfinite(this.state);const r=originalUpdate.call(this,dt);ensureInfinite(this.state);return r;};

  const originalAdd=Gameplay.prototype.addResource;
  Gameplay.prototype.addResource=function(id,count=1,label='资源'){ensureInfinite(this.state);const r=originalAdd.call(this,id,count,label);ensureInfinite(this.state);return r;};

  for(const method of ['placeBlock','craft','trade','capture','feedPet']){
    const original=Gameplay.prototype[method];
    if(typeof original!=='function')continue;
    Gameplay.prototype[method]=function(...args){ensureInfinite(this.state);const r=original.apply(this,args);ensureInfinite(this.state);return r;};
  }

  Gameplay.prototype.evolvePet=function(i){
    ensureInfinite(this.state);
    const p=this.state.pets?.[i];
    if(!p)return;
    ensurePetEvolution(p);

    const previousStage=p.evolutionStage;
    let nextStage=previousStage+1;
    let cycle=p.evolutionCycle||0;
    if(previousStage>=20){nextStage=20;cycle+=1;}
    const def=stageFor(nextStage);
    const previousPower=Number(p.power)||6;
    const transcendBonus=cycle*45;

    Object.assign(p,{
      name:cycle>0?`超越${cycle}·${def.name}`:def.name,
      rank:def.rank,
      kind:def.kind,
      variant:def.variant,
      mount:def.mount,
      color:def.color,
      evolutionStage:nextStage,
      evolutionCycle:cycle,
      level:(p.level||1)+2,
      exp:0,
      bond:Math.min(100,(p.bond??20)+5),
      power:Math.max(previousPower+Math.max(3,Math.round(def.power*.12)),def.power+transcendBonus),
    });

    const ai=this.state.activePets?.findIndex(x=>x.id===p.id);
    if(ai>=0)this.state.activePets[ai]={...p};
    this.entities.spawnFollowers();
    if(this.state.mountedPet===p.id){this.player.mountVisualId=null;this.player.syncMountVisual();}
    ensureInfinite(this.state);
    const extra=nextStage===20&&cycle>0?` · 超越 ${cycle}`:'';
    this.ui.toast(`无限进化：形态 ${nextStage}/20「${def.name}」${extra} · 战力 ${p.power}`,'good');
  };
}

if(!GameUI.prototype.__sandboxInfiniteV20){
  GameUI.prototype.__sandboxInfiniteV20=true;
  GameUI.prototype.canCraft=function(){return true;};

  const originalHotbar=GameUI.prototype.renderHotbar;
  GameUI.prototype.renderHotbar=function(...args){
    ensureInfinite(this.state);
    const r=originalHotbar.apply(this,args);
    this.el?.hotbar?.querySelectorAll('.slot .count').forEach(el=>el.textContent='∞');
    return r;
  };

  const originalDrawer=GameUI.prototype.renderDrawer;
  GameUI.prototype.renderDrawer=function(...args){
    ensureInfinite(this.state);
    const r=originalDrawer.apply(this,args);
    const root=this.el?.content;
    if(!root)return r;

    if(this.activeTab==='bag'){
      root.querySelectorAll('.resource-card b').forEach(el=>el.textContent='∞');
      if(!root.querySelector('.infinite-mode-banner'))root.insertAdjacentHTML('afterbegin','<div class="infinite-mode-banner"><b>∞ 无限资源模式</b><span>所有采集、建造、制作、交易、喂食与捕捉资源均无限。</span></div>');
    }
    if(this.activeTab==='craft')root.querySelectorAll('[data-craft]').forEach(btn=>btn.disabled=false);
    if(this.activeTab==='pets'){
      const banner=root.querySelector('.pet-command-banner span');
      if(banner)banner.textContent='灵果 ∞ · 晶核 ∞ · 20形态 + 无限超越';
      const cards=[...root.querySelectorAll('.pet-card')];
      cards.forEach((card,i)=>{
        const p=this.state.pets?.[i];if(!p)return;ensurePetEvolution(p);
        const stage=stageFor(p.evolutionStage),nextStage=p.evolutionStage>=20?20:p.evolutionStage+1,next=stageFor(nextStage),cycle=p.evolutionCycle||0;
        const title=card.querySelector('.pet-title');
        if(title&&!title.querySelector('.evo-stage-chip'))title.insertAdjacentHTML('beforeend',`<span class="evo-stage-chip">形态 ${p.evolutionStage}/20${cycle?` · 超越${cycle}`:''}</span>`);
        const note=card.querySelector('.pet-evolve-note');
        if(note)note.textContent=p.evolutionStage>=20?`最终形态：${stage.name}。可继续无限超越，每次提升等级、亲密度与战力，没有上限。`:`当前形态：${stage.name} · 下一形态：${next.name}。共20种形态，到达最终形态后仍可无限超越。`;
        const btn=card.querySelector('[data-evolve]');
        if(btn){btn.disabled=false;btn.textContent=p.evolutionStage>=20?`终焉超越 +1`:`进化 → ${next.name}`;}
      });
    }
    return r;
  };
}

if(typeof document!=='undefined'&&!document.getElementById('sandbox-v20-style')){
  const style=document.createElement('style');style.id='sandbox-v20-style';style.textContent=`
    .infinite-mode-banner{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 14px;padding:13px 15px;border:1px solid rgba(117,239,186,.28);border-radius:14px;background:linear-gradient(135deg,rgba(29,103,78,.34),rgba(28,51,87,.32));box-shadow:inset 0 1px rgba(255,255,255,.06)}
    .infinite-mode-banner b{color:#9ff5c9;font-size:14px}.infinite-mode-banner span{color:#bcd2df;font-size:11px;text-align:right}
    .evo-stage-chip{color:#ffe59a!important;border:1px solid rgba(255,211,99,.32);background:rgba(108,77,19,.34);border-radius:999px;padding:2px 7px;font-size:9px!important;white-space:nowrap}
    .pet-card .gold-action{min-width:132px}
    @media(max-width:720px){.infinite-mode-banner{align-items:flex-start;flex-direction:column;gap:4px}.infinite-mode-banner span{text-align:left}.pet-card .gold-action{min-width:112px}}
  `;document.head.appendChild(style);
}
