import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GAME } from './config.js';
import { createPetModel } from './entities.js';

function m(color,emissive=0x000000,ei=0){return new THREE.MeshStandardMaterial({color,roughness:.72,emissive,emissiveIntensity:ei});}
function box(w,h,d,mat){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.castShadow=true;o.receiveShadow=true;return o;}
function buildAvatar(){
  const root=new THREE.Group();root.name='player-avatar';
  const skin=m('#d9aa82'),skinShade=m('#c58f69'),shirt=m('#36a985'),shirtDark=m('#24765f'),pants=m('#263b4a'),boot=m('#172631'),hair=m('#222b35'),hair2=m('#303a46'),metal=m('#c6d1da'),eye=m('#17222c'),white=m('#edf4f6');

  const torso=box(.62,.72,.34,shirt);torso.position.y=1.12;
  const collar=box(.30,.10,.025,shirtDark);collar.position.set(0,1.41,-.183);
  const belt=box(.64,.09,.36,m('#1d2e39'));belt.position.y=.79;

  const head=box(.50,.50,.50,skin);head.position.y=1.78;
  const hairTop=box(.52,.13,.52,hair);hairTop.position.y=2.095;
  const hairBack=box(.52,.28,.10,hair2);hairBack.position.set(0,1.91,.255);
  const fringeL=box(.16,.11,.035,hair);fringeL.position.set(-.14,2.00,-.267);
  const fringeR=box(.13,.08,.035,hair);fringeR.position.set(.13,2.02,-.267);
  const eyeL=box(.075,.055,.026,eye),eyeR=eyeL.clone();eyeL.position.set(-.12,1.82,-.266);eyeR.position.set(.12,1.82,-.266);
  const eyeGlintL=box(.018,.018,.010,white),eyeGlintR=eyeGlintL.clone();eyeGlintL.position.set(-.103,1.834,-.282);eyeGlintR.position.set(.137,1.834,-.282);
  const nose=box(.055,.065,.045,skinShade);nose.position.set(0,1.73,-.276);

  const armLPivot=new THREE.Group(),armRPivot=new THREE.Group();armLPivot.position.set(-.41,1.42,0);armRPivot.position.set(.41,1.42,0);
  const armL=box(.20,.64,.24,shirt),armR=box(.20,.64,.24,shirt);armL.position.y=-.31;armR.position.y=-.31;
  const handL=box(.20,.18,.24,skin),handR=box(.20,.18,.24,skin);handL.position.y=-.68;handR.position.y=-.68;
  armLPivot.add(armL,handL);armRPivot.add(armR,handR);

  const legLPivot=new THREE.Group(),legRPivot=new THREE.Group();legLPivot.position.set(-.17,.76,0);legRPivot.position.set(.17,.76,0);
  const legL=box(.25,.62,.27,pants),legR=box(.25,.62,.27,pants);legL.position.y=-.30;legR.position.y=-.30;
  const bootL=box(.26,.19,.34,boot),bootR=box(.26,.19,.34,boot);bootL.position.set(0,-.67,-.035);bootR.position.set(0,-.67,-.035);
  legLPivot.add(legL,bootL);legRPivot.add(legR,bootR);

  const weaponPivot=new THREE.Group();weaponPivot.position.set(.04,-.61,-.07);weaponPivot.rotation.set(.08,0,-.18);
  const weapon=box(.065,.86,.065,metal);weapon.position.y=-.38;weapon.name='weapon-visual';
  const guard=box(.30,.055,.09,m('#6b7780'));guard.position.y=.04;
  const grip=box(.075,.25,.075,m('#6e4e36'));grip.position.y=.18;
  weaponPivot.add(weapon,guard,grip);armRPivot.add(weaponPivot);

  const armorMat=m('#87c8d6');
  const chest=box(.70,.52,.39,armorMat);chest.position.y=1.17;chest.visible=false;
  const shoulderL=box(.25,.22,.42,armorMat),shoulderR=shoulderL.clone();shoulderL.position.set(-.45,1.43,0);shoulderR.position.set(.45,1.43,0);shoulderL.visible=shoulderR.visible=false;
  const helm=box(.57,.20,.57,armorMat);helm.position.y=2.11;helm.visible=false;

  root.add(torso,collar,belt,head,hairTop,hairBack,fringeL,fringeR,eyeL,eyeR,eyeGlintL,eyeGlintR,nose,armLPivot,armRPivot,legLPivot,legRPivot,chest,shoulderL,shoulderR,helm);
  root.userData.parts={torso,head,hairTop,armL,armR,handL,handR,armLPivot,armRPivot,legL,legR,legLPivot,legRPivot,weapon,weaponPivot,chest,shoulderL,shoulderR,helm};
  return root;
}
function buildVehicle(){
  const root=new THREE.Group();root.name='player-vehicle';const wood=m('#7e583d'),wood2=m('#a87850'),cloth=m('#e7ded0'),metal=m('#6e8795'),glass=m('#78c6d6',0x174e5c,.18),dark=m('#2b3842');
  const boat=new THREE.Group();boat.name='boat';const hull=box(1.95,.36,.92,wood);hull.position.y=.18;const bow=box(.48,.42,.74,wood2);bow.position.set(1.02,.28,0);bow.rotation.z=-.18;const stern=box(.38,.36,.78,wood2);stern.position.set(-1.0,.22,0);const mast=box(.08,1.55,.08,wood2);mast.position.set(0,.95,0);const sail=box(.08,1.05,.85,cloth);sail.position.set(.12,1.17,0);boat.add(hull,bow,stern,mast,sail);
  const sub=new THREE.Group();sub.name='sub';const body=box(2.15,.82,.92,metal);body.position.y=.48;const nose=box(.52,.62,.72,dark);nose.position.set(1.25,.48,0);const tail=box(.55,.36,.5,dark);tail.position.set(-1.24,.48,0);const cabin=box(.76,.48,.64,glass);cabin.position.set(.25,1.03,0);const fin=box(.52,.08,.95,metal);fin.position.set(-.35,.78,0);const periscope=box(.08,.55,.08,dark);periscope.position.set(.2,1.48,0);const periscopeTop=box(.28,.08,.08,dark);periscopeTop.position.set(.3,1.73,0);sub.add(body,nose,tail,cabin,fin,periscope,periscopeTop);
  boat.visible=false;sub.visible=false;root.add(boat,sub);root.userData={boat,sub};return root;
}

export class PlayerController{
  constructor(camera,domElement,scene,world,state){
    this.camera=camera;this.domElement=domElement;this.scene=scene;this.world=world;this.state=state;
    this.controls=new PointerLockControls(camera,domElement);this.controls.pointerSpeed=0;
    this.position=new THREE.Vector3(state.x||0,state.y||10,state.z||0);this.velocity=new THREE.Vector3();this.keys={};this.onGround=false;this.walkPhase=0;this.bodyYaw=Number.isFinite(state.bodyYaw)?state.bodyYaw:-(Number.isFinite(state.lookYaw)?state.lookYaw:0);this.moveDirection=new THREE.Vector3();
    this.avatar=buildAvatar();scene.add(this.avatar);this.vehicle=buildVehicle();scene.add(this.vehicle);this.mountVisual=null;this.mountVisualId=null;
    this.horizontalForward=new THREE.Vector3(0,0,-1);this.lookDirection=new THREE.Vector3(0,0,-1);this.right=new THREE.Vector3(1,0,0);this.up=new THREE.Vector3(0,1,0);
    this.yaw=Number.isFinite(state.lookYaw)?state.lookYaw:0;this.pitch=Number.isFinite(state.lookPitch)?state.lookPitch:-.08;
    this.viewModes=['third','first','tactical'];if(!this.viewModes.includes(state.view))state.view='third';this.bind();
  }
  bind(){
    addEventListener('keydown',e=>{const k=e.code;this.keys[k]=true;if(['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ShiftRight','ControlLeft','ControlRight'].includes(k))e.preventDefault();if(k==='Space'&&!e.repeat)this.jump();});
    addEventListener('keyup',e=>{this.keys[e.code]=false;});
    addEventListener('mousemove',e=>{if(!this.controls.isLocked)return;const sens=.00215;this.yaw-=e.movementX*sens;this.pitch=THREE.MathUtils.clamp(this.pitch-e.movementY*sens*.78,-1.0,.62);this.state.lookYaw=this.yaw;this.state.lookPitch=this.pitch;});
  }
  lock(){this.controls.lock();} unlock(){this.controls.unlock();} get isLocked(){return this.controls.isLocked;}
  cycleView(){const i=this.viewModes.indexOf(this.state.view);this.state.view=this.viewModes[(i+1)%this.viewModes.length];this.syncAvatar();return this.state.view;}
  jump(){if(this.onGround&&!this.state.mountedPet){this.velocity.y=GAME.jumpVelocity;this.onGround=false;}}
  updateGearVisual(){
    const p=this.avatar.userData.parts,luminous=this.state.gear.luminous;p.torso.material=this.state.gear.armor==='晶铁战甲'?m('#8bc9d6',0x265666,luminous ? .35 : 0):this.state.gear.armor==='雪地皮衣'?m('#bc9b70'):m('#3cb08d');p.weapon.material=luminous?m('#f8df69',0xc69c13,1.2):this.state.gear.weapon==='铁剑'?m('#cbd5dc'):this.state.gear.weapon==='石剑'?m('#8c979f'):m('#b68a59');const plated=this.state.gear.armor==='晶铁战甲';p.chest.visible=p.shoulderL.visible=p.shoulderR.visible=p.helm.visible=plated;if(plated&&luminous){const armorMat=m('#91d5e4',0x235d70,.55);p.chest.material=p.shoulderL.material=p.shoulderR.material=p.helm.material=armorMat;}
  }
  syncMountVisual(){
    const id=this.state.mountedPet||null;if(id===this.mountVisualId)return;if(this.mountVisual){this.scene.remove(this.mountVisual);this.mountVisual=null;}this.mountVisualId=id;if(!id)return;const pet=this.state.pets?.find(p=>p.id===id);if(!pet)return;this.mountVisual=createPetModel(pet,{label:false,mounted:true});this.mountVisual.name='mounted-pet';const scale=pet.rank==='SSSS'?1.55:pet.rank==='SSS'?1.32:1.18;this.mountVisual.scale.setScalar(scale);this.scene.add(this.mountVisual);
  }
  syncAvatar(){const mounted=!!this.state.mountedPet,first=this.state.view==='first';this.avatar.visible=!first;this.vehicle.visible=!first&&!mounted;if(this.mountVisual)this.mountVisual.visible=!first;}
  update(dt){
    this.syncMountVisual();const cp=Math.cos(this.pitch);this.horizontalForward.set(Math.sin(this.yaw),0,-Math.cos(this.yaw)).normalize();this.lookDirection.set(Math.sin(this.yaw)*cp,Math.sin(this.pitch),-Math.cos(this.yaw)*cp).normalize();this.right.crossVectors(this.horizontalForward,this.up).normalize();
    let f=(this.keys.KeyW?1:0)-(this.keys.KeyS?1:0),s=(this.keys.KeyD?1:0)-(this.keys.KeyA?1:0);const moving=!!(f||s);let speed=this.keys.ShiftLeft||this.keys.ShiftRight?GAME.sprintSpeed:GAME.walkSpeed;const mounted=this.state.pets?.find(p=>p.id===this.state.mountedPet);if(mounted)speed=mounted.mount==='fly'?GAME.rideSpeed*1.22:mounted.mount==='swim'?GAME.rideSpeed*1.08:GAME.rideSpeed;
    this.moveDirection.set(0,0,0);
    if(moving){
      const len=Math.hypot(f,s)||1;f/=len;s/=len;
      this.moveDirection.copy(this.horizontalForward).multiplyScalar(f).addScaledVector(this.right,s).normalize();
      const move=this.moveDirection.clone().multiplyScalar(speed*dt);
      const currentGround=this.world.getTopSolidY(this.position.x,this.position.z),tx=this.position.x+move.x,tz=this.position.z+move.z,gx=this.world.getTopSolidY(tx,this.position.z),gz=this.world.getTopSolidY(this.position.x,tz);
      if(mounted?.mount==='fly'||gx-currentGround<=1)this.position.x=tx;if(mounted?.mount==='fly'||gz-currentGround<=1)this.position.z=tz;
      const targetYaw=Math.atan2(-this.moveDirection.x,-this.moveDirection.z),delta=Math.atan2(Math.sin(targetYaw-this.bodyYaw),Math.cos(targetYaw-this.bodyYaw));
      this.bodyYaw+=delta*Math.min(1,dt*(mounted?12:15));this.walkPhase+=dt*(mounted?6.5:9);
    }else if(this.state.view==='first'){
      const targetYaw=-this.yaw,delta=Math.atan2(Math.sin(targetYaw-this.bodyYaw),Math.cos(targetYaw-this.bodyYaw));this.bodyYaw+=delta*Math.min(1,dt*10);
    }
    this.state.bodyYaw=this.bodyYaw;
    this.position.x=THREE.MathUtils.clamp(this.position.x,-GAME.worldLimit,GAME.worldLimit);this.position.z=THREE.MathUtils.clamp(this.position.z,-GAME.worldLimit,GAME.worldLimit);
    if(mounted?.mount==='fly'){const rise=(this.keys.Space?1:0)-((this.keys.ControlLeft||this.keys.ControlRight)?1:0);this.velocity.y=0;this.position.y+=rise*GAME.rideSpeed*.72*dt;this.position.y=Math.max(this.world.getTopSolidY(this.position.x,this.position.z)+1.35,this.position.y);this.onGround=false;}else{this.velocity.y-=GAME.gravity*dt;this.position.y+=this.velocity.y*dt;const water=this.world.getWaterY(this.position.x,this.position.z),ground=Math.max(this.world.getTopSolidY(this.position.x,this.position.z),water??-Infinity)+1.01;if(this.position.y<=ground){this.position.y=ground;this.velocity.y=0;this.onGround=true;}else this.onGround=false;}
    let seatLift=0;if(mounted){const rootY=this.position.y-(mounted.mount==='fly' ? .78 : .93);if(this.mountVisual){this.mountVisual.position.set(this.position.x,rootY+Math.sin(this.walkPhase*1.4)*.035,this.position.z);this.mountVisual.rotation.y=this.bodyYaw+Math.PI/2;this.mountVisual.rotation.z=moving?Math.sin(this.walkPhase*.45)*.025:0;}seatLift=mounted.rank==='SSSS'?1.55:mounted.rank==='SSS'?1.27:1.05;}
    this.avatar.position.copy(this.position);this.avatar.position.y+=seatLift;this.avatar.rotation.y=this.bodyYaw;
    const biome=this.world.getBiome(this.position.x,this.position.z),boatOn=this.state.dimension==='overworld'&&biome==='ocean'&&!mounted&&this.state.gear.boat,subOn=this.state.dimension==='overworld'&&biome==='ocean'&&!mounted&&this.state.gear.sub;this.vehicle.userData.boat.visible=boatOn&&!subOn;this.vehicle.userData.sub.visible=subOn;this.vehicle.position.copy(this.position);this.vehicle.position.y-=.78;this.vehicle.rotation.y=this.bodyYaw+Math.PI/2;this.vehicle.visible=(boatOn||subOn)&&this.state.view!=='first';if(boatOn||subOn)this.avatar.position.y+=subOn ? .35 : .18;
    const parts=this.avatar.userData.parts;
    if(mounted){
      parts.legLPivot.rotation.x=-1.05;parts.legRPivot.rotation.x=-1.05;parts.legLPivot.rotation.z=-.10;parts.legRPivot.rotation.z=.10;
      parts.armLPivot.rotation.x=-.24;parts.armRPivot.rotation.x=-.24;
    }else if(moving){
      const swing=Math.sin(this.walkPhase)*.58,bob=Math.abs(Math.sin(this.walkPhase))*0.035;
      parts.armLPivot.rotation.x=swing;parts.armRPivot.rotation.x=-swing*.82;parts.legLPivot.rotation.x=-swing;parts.legRPivot.rotation.x=swing;
      parts.legLPivot.rotation.z*=.75;parts.legRPivot.rotation.z*=.75;this.avatar.position.y+=bob;
    }else{
      for(const pivot of [parts.armLPivot,parts.armRPivot,parts.legLPivot,parts.legRPivot]){pivot.rotation.x*=.72;pivot.rotation.z*=.72;}
    }
    this.updateCamera();this.state.x=this.position.x;this.state.y=this.position.y;this.state.z=this.position.z;
  }
  updateCamera(){
    this.syncAvatar();const mounted=this.state.pets?.find(p=>p.id===this.state.mountedPet),seatLift=mounted?(mounted.rank==='SSSS'?1.3:mounted.rank==='SSS'?1.05:.82):0,eye=this.position.clone().add(new THREE.Vector3(0,1.58+seatLift,0)),focus=eye.clone().addScaledVector(this.lookDirection,5.5);
    if(this.state.view==='first'){this.camera.position.copy(eye);this.camera.up.set(0,1,0);this.camera.lookAt(focus);return;}
    if(this.state.view==='third'){const dist=mounted?5.7:4.6,desired=eye.clone().addScaledVector(this.horizontalForward,-dist);desired.y+=1.25-this.pitch*1.35;const clipped=this.world.clipCamera(eye,desired,.32);this.camera.position.copy(clipped);this.camera.up.set(0,1,0);this.camera.lookAt(focus);const camDist=this.camera.position.distanceTo(eye);this.avatar.visible=camDist>1.05;if(this.mountVisual)this.mountVisual.visible=camDist>.72;return;}
    const desired=eye.clone().addScaledVector(this.horizontalForward,-7.4).add(new THREE.Vector3(0,8.4,0)),clipped=this.world.clipCamera(eye,desired,.25);this.camera.position.copy(clipped);this.camera.up.set(0,1,0);this.camera.lookAt(eye.clone().addScaledVector(this.horizontalForward,1.8));
  }
}
