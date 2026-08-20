import { DEFAULT_STATE } from './config.js';
import './sandbox-mode.js';

const KEY='voxel_epoch_threejs_save_v3';
function clone(v){return JSON.parse(JSON.stringify(v));}
function merge(base,extra){
  if(!extra||typeof extra!=='object')return base;
  for(const [k,v] of Object.entries(extra)){
    if(v&&typeof v==='object'&&!Array.isArray(v)&&base[k]&&typeof base[k]==='object'&&!Array.isArray(base[k]))merge(base[k],v);else base[k]=v;
  }
  return base;
}
export function loadState(){
  const base=clone(DEFAULT_STATE);
  try{const raw=localStorage.getItem(KEY);if(!raw)return base;return merge(base,JSON.parse(raw));}catch{return base;}
}
export function saveState(state){
  try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{return false;}
}
export function resetState(){localStorage.removeItem(KEY);}
