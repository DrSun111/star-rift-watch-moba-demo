export class MobileControls{
  constructor({player,gameplay,ui,canvas,state}){
    this.player=player;this.gameplay=gameplay;this.ui=ui;this.canvas=canvas;this.state=state;
    this.enabled=(navigator.maxTouchPoints||0)>0||matchMedia('(pointer:coarse)').matches||/Android|Mobile/i.test(navigator.userAgent);
    this.movePointer=null;this.lookPointer=null;this.moveOrigin={x:0,y:0};this.lookLast={x:0,y:0};
    if(!this.enabled)return;
    document.body.classList.add('mobile-game');this.build();this.bind();
  }
  build(){
    const root=document.createElement('div');root.id='mobile-controls';root.innerHTML=`
      <div class="mobile-look-zone" data-look-zone></div>
      <div class="mobile-stick" data-stick><div class="stick-ring"></div><div class="stick-knob" data-stick-knob></div></div>
      <div class="mobile-actions">
        <button data-act="attack" class="m-action attack">⚔<small>攻击/拆除</small></button>
        <button data-act="place" class="m-action place">▣<small>放置</small></button>
        <button data-act="interact" class="m-action interact">E<small>交互</small></button>
        <button data-act="jump" class="m-action jump">↑<small>跳跃/上升</small></button>
        <button data-act="down" class="m-action down">↓<small>下降</small></button>
        <button data-act="capture" class="m-action capture">✦<small>捕捉</small></button>
      </div>
      <div class="mobile-top-actions">
        <button data-act="pets">精灵</button><button data-act="bag">背包</button><button data-act="view">视角</button>
      </div>
      <button class="mobile-sprint" data-act="sprint">冲刺</button>
    `;document.body.appendChild(root);this.root=root;this.stick=root.querySelector('[data-stick]');this.knob=root.querySelector('[data-stick-knob]');this.lookZone=root.querySelector('[data-look-zone]');
  }
  bind(){
    const stop=e=>{e.preventDefault();e.stopPropagation();};
    this.stick.addEventListener('pointerdown',e=>{stop(e);this.movePointer=e.pointerId;this.stick.setPointerCapture(e.pointerId);const r=this.stick.getBoundingClientRect();this.moveOrigin={x:r.left+r.width/2,y:r.top+r.height/2};this.updateStick(e.clientX,e.clientY);});
    this.stick.addEventListener('pointermove',e=>{if(e.pointerId!==this.movePointer)return;stop(e);this.updateStick(e.clientX,e.clientY);});
    const endStick=e=>{if(e.pointerId!==this.movePointer)return;stop(e);this.movePointer=null;this.setKeys(0,0);this.knob.style.transform='translate(0px,0px)';};
    this.stick.addEventListener('pointerup',endStick);this.stick.addEventListener('pointercancel',endStick);
    this.lookZone.addEventListener('pointerdown',e=>{stop(e);this.lookPointer=e.pointerId;this.lookZone.setPointerCapture(e.pointerId);this.lookLast={x:e.clientX,y:e.clientY};globalThis.__voxelAudio?.unlock();});
    this.lookZone.addEventListener('pointermove',e=>{if(e.pointerId!==this.lookPointer)return;stop(e);const dx=e.clientX-this.lookLast.x,dy=e.clientY-this.lookLast.y;this.lookLast={x:e.clientX,y:e.clientY};this.player.yaw-=dx*.00325;this.player.pitch=Math.max(-1,Math.min(.62,this.player.pitch-dy*.00235));this.state.lookYaw=this.player.yaw;this.state.lookPitch=this.player.pitch;});
    const endLook=e=>{if(e.pointerId!==this.lookPointer)return;stop(e);this.lookPointer=null;};
    this.lookZone.addEventListener('pointerup',endLook);this.lookZone.addEventListener('pointercancel',endLook);
    this.root.querySelectorAll('[data-act]').forEach(btn=>{const act=btn.dataset.act;if(['jump','down','sprint'].includes(act)){btn.addEventListener('pointerdown',e=>{stop(e);globalThis.__voxelAudio?.unlock();this.hold(act,true);});for(const ev of ['pointerup','pointercancel','pointerleave'])btn.addEventListener(ev,e=>{stop(e);this.hold(act,false);});}else btn.addEventListener('pointerdown',e=>{stop(e);globalThis.__voxelAudio?.unlock();this.press(act);});});
    addEventListener('blur',()=>{this.setKeys(0,0);this.player.keys.ShiftLeft=false;this.player.keys.Space=false;this.player.keys.ControlLeft=false;});
  }
  setKeys(strafe,forward){const k=this.player.keys;k.KeyW=forward>.18;k.KeyS=forward<-.18;k.KeyD=strafe>.18;k.KeyA=strafe<-.18;}
  updateStick(x,y){const dx=x-this.moveOrigin.x,dy=y-this.moveOrigin.y,max=52,len=Math.hypot(dx,dy)||1,scale=Math.min(1,max/len),cx=dx*scale,cy=dy*scale;this.knob.style.transform=`translate(${cx}px,${cy}px)`;this.setKeys(cx/max,-cy/max);}
  hold(act,on){if(act==='sprint')this.player.keys.ShiftLeft=on;else if(act==='jump'){const mounted=this.state.pets?.find(p=>p.id===this.state.mountedPet);if(mounted?.mount==='fly')this.player.keys.Space=on;else if(on)this.player.jump();}else if(act==='down')this.player.keys.ControlLeft=on;}
  press(act){if(act==='attack'){this.gameplay.removeOrAttack();globalThis.__voxelAudio?.play('attack');}else if(act==='place')this.gameplay.placeBlock();else if(act==='interact')this.gameplay.interact();else if(act==='capture')this.gameplay.capture();else if(act==='pets')this.ui.openPets();else if(act==='bag')this.ui.toggleDrawer(true);else if(act==='view'){const v=this.player.cycleView();this.ui.toast('视角：'+this.ui.viewName(v));}}
}
