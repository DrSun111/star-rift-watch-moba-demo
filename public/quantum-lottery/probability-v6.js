// Lottery probability and activity-mode runtime. Probabilities are intentionally not rendered in the public UI.

// Keep the visible prize pool aligned with every selectable result.
const blankIndex = prizes.findIndex(p => p.type === 'blank');
if (blankIndex >= 0) prizes.splice(blankIndex, 1);
if (!prizes.some(p => p.type === 'gift10')) {
  const insertAt = Math.min(5, prizes.length);
  prizes.splice(insertAt, 0, {type:'gift10',label:'赠送10元',icon:'💵',text:'恭喜抽中赠送 10 元。',win:true});
}

if (typeof gallery !== 'undefined' && gallery) {
  gallery.innerHTML = prizes.map(p => `<div class="card"><div class="ico">${p.icon}</div><div class="meta"><b>${p.label}</b><p>${p.text}</p></div></div>`).join('');
}

// Three activity modes are attached to redeemed codes and apply to the next N draws.
const MODE_QUEUE_KEY = 'quantumLotteryModeQueueV2';
let modeQueue = [];
try {
  const saved = JSON.parse(localStorage.getItem(MODE_QUEUE_KEY) || '[]');
  if (Array.isArray(saved)) modeQueue = saved.filter(x => x && ['normal','champions','egg'].includes(x.mode) && Number(x.remaining) > 0).map(x => ({mode:x.mode, remaining:Math.floor(Number(x.remaining))}));
} catch (_) {}
function saveModeQueue(){ localStorage.setItem(MODE_QUEUE_KEY, JSON.stringify(modeQueue)); }
function queueMode(mode, count){
  const n = Math.max(0, Math.floor(Number(count)||0));
  if (!n) return;
  modeQueue.push({mode:['normal','champions','egg'].includes(mode)?mode:'normal', remaining:n});
  saveModeQueue();
}
let eggRevealPending = false;
function consumeMode(){
  while (modeQueue.length && modeQueue[0].remaining <= 0) modeQueue.shift();
  if (!modeQueue.length) { saveModeQueue(); return 'normal'; }
  const entry = modeQueue[0];
  const mode = entry.mode;
  entry.remaining -= 1;
  if (entry.remaining <= 0) {
    modeQueue.shift();
    if (mode === 'egg') eggRevealPending = true;
  }
  saveModeQueue();
  return mode;
}

function chooseNormalType(){
  // Normal: penalty 20%, gift10 15%, thanks 34%, notebook 6%, pen 10%, water 11%, four rare prizes 1% each.
  const n = secureInt(100000);
  if (n < 20000) return 'penalty';
  if (n < 35000) return 'gift10';
  if (n < 69000) return 'thanks';
  if (n < 75000) return 'notebook';
  if (n < 85000) return 'pen';
  if (n < 96000) return 'water';
  if (n < 97000) return 'rolls';
  if (n < 98000) return 'rolex';
  if (n < 99000) return 'dji';
  return 'maldives';
}
function chooseChampionsType(){
  // Champions activity: physical-prize probability is genuinely increased to 70%.
  const n = secureInt(100000);
  if (n < 10000) return 'penalty';       // 10%
  if (n < 30000) return 'thanks';        // 20%
  if (n < 50000) return 'gift10';        // 20%
  if (n < 62000) return 'notebook';      // 12%
  if (n < 77000) return 'pen';           // 15%
  if (n < 94000) return 'water';         // 17%
  if (n < 95500) return 'rolls';         // 1.5%
  if (n < 97000) return 'rolex';         // 1.5%
  if (n < 98500) return 'dji';           // 1.5%
  return 'maldives';                     // 1.5%
}

chooseType = function(){
  const mode = consumeMode();
  if (mode === 'egg') return 'thanks';
  if (mode === 'champions') return chooseChampionsType();
  return chooseNormalType();
};

// Dynamic wheel geometry for the current prize count.
drawWheel = function(){
  const W=wheel.width,c=W/2,r=W*.48,count=prizes.length,step=Math.PI*2/count;
  ctx.clearRect(0,0,W,W);
  prizes.forEach((p,i)=>{
    const a0=-Math.PI/2+i*step,a1=a0+step;
    ctx.beginPath();ctx.moveTo(c,c);ctx.arc(c,c,r,a0,a1);ctx.closePath();
    ctx.fillStyle=colors[i%colors.length];ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=2;ctx.stroke();
    ctx.save();ctx.translate(c,c);ctx.rotate((a0+a1)/2);ctx.textAlign='right';ctx.fillStyle='#fff';
    ctx.font='700 23px Microsoft YaHei,sans-serif';ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=5;
    ctx.fillText(p.label.length>8?p.label.slice(0,8):p.label,r-31,7);ctx.restore();
  });
  ctx.beginPath();ctx.arc(c,c,r*.985,0,Math.PI*2);ctx.strokeStyle='rgba(123,245,255,.55)';ctx.lineWidth=4;ctx.stroke();
};
targetRotation = function(i,turns=6){
  const step=360/prizes.length;
  const target=((360-(i+.5)*step)%360+360)%360;
  const current=((rotation%360)+360)%360;
  const delta=((target-current+360)%360)+360*turns;
  return rotation+delta;
};
drawWheel();

// Keep five-draw visible and cap a five-draw at no more than two tangible/credit prizes.
const fiveDrawStyle = document.createElement('style');
fiveDrawStyle.textContent = `.draw5{display:block!important;visibility:visible!important;opacity:1!important;min-height:58px!important;border:1px solid rgba(255,214,107,.82)!important;background:linear-gradient(120deg,rgba(255,217,91,.28),rgba(139,87,255,.25))!important;color:#fff0a8!important;font-size:14px!important;box-shadow:0 0 34px rgba(255,205,69,.2),inset 0 0 24px rgba(255,230,130,.1)!important}.draw5:disabled{display:block!important;visibility:visible!important;opacity:.72!important;filter:none!important}`;
document.head.appendChild(fiveDrawStyle);

async function cappedFiveDraw(){
  if(busy||remaining()<5)return;
  busy=true;
  const results=[];
  let wins=0;
  for(let i=0;i<5;i++){
    let r=makeResult();
    if(r.p.win){
      if(wins>=2){
        const p=prizes.find(x=>x.type==='thanks');
        r={i:prizes.findIndex(x=>x.type==='thanks'),p};
      }else wins++;
    }
    results.push(r);
  }
  commitResults(results);
  batchHud.classList.add('show');
  render();
  for(let k=0;k<results.length;k++){
    const r=results[k];
    batchHud.textContent=`五连抽 · ${k+1} / 5`;
    await spinTo(r.i,1080,2);
    showToast(r.p,`MULTI DRAW ${k+1} / 5`);
    if(r.p.gold)await goldSequence();
    else{if(r.p.win)particleBurst(false);await sleep(520)}
  }
  batchHud.classList.remove('show');
  wheel.style.transition='transform 5.2s cubic-bezier(.08,.72,.08,1)';
  busy=false;
  render();
  showBatch(results);
}
btn5.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();cappedFiveDraw()},true);

// Truthful egg-mode hidden-screen notice shown after its five fixed non-winning draws.
const eggOverlay=document.createElement('div');
eggOverlay.style.cssText='position:fixed;z-index:180;inset:0;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(2,3,10,.9);backdrop-filter:blur(16px)';
eggOverlay.innerHTML='<div style="width:min(470px,100%);padding:28px 22px;border-radius:26px;border:1px solid rgba(255,214,107,.5);background:radial-gradient(circle at 50% 0,rgba(255,214,107,.18),#0b1024 56%);text-align:center;box-shadow:0 30px 90px rgba(0,0,0,.65)"><div style="font-size:42px">✦</div><div style="font-size:9px;letter-spacing:.22em;color:#ffd66b">HIDDEN INTERFACE</div><h2 style="margin:7px 0 8px">恭喜您进入隐藏界面</h2><p style="margin:0;color:#9aa7c8;font-size:10px;line-height:1.8">彩蛋视觉效果已触发。后续抽奖按实际活动概率运行，隐藏界面不会额外提高库里南或绿水鬼的中奖概率。</p><button id="eggOverlayClose" style="margin-top:16px;width:100%;height:45px;border:0;border-radius:13px;background:linear-gradient(120deg,#ffd66b,#9b84ff);font-weight:900;color:#070914">进入幸运终端</button></div>';
document.body.appendChild(eggOverlay);
eggOverlay.querySelector('#eggOverlayClose').onclick=()=>eggOverlay.style.display='none';
function maybeShowEggOverlay(){if(!eggRevealPending)return;eggRevealPending=false;setTimeout(()=>eggOverlay.style.display='flex',420)}
const baseShowResult=showResult;showResult=function(p){baseShowResult(p);maybeShowEggOverlay()};
const baseShowBatch=showBatch;showBatch=function(results){baseShowBatch(results);maybeShowEggOverlay()};

// Redeem code with its server-side activity mode.
async function redeemWithActivityMode(){
  const code=codeInput.value.trim();
  if(!code){redeemMsg.className='msg bad';redeemMsg.textContent='请输入兑换码。';return}
  redeemMsg.className='msg';redeemMsg.textContent='正在向服务器核验…';
  try{
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'redeem_code',code,device_id:deviceId})});
    const d=await r.json();
    if(!d.ok)throw new Error(d.error||'兑换失败');
    state.bonus+=Number(d.chances)||0;save();
    const mode=['normal','champions','egg'].includes(d.mode)?d.mode:'normal';
    queueMode(mode,Number(d.chances)||0);
    render();
    redeemMsg.className='msg ok';
    if(mode==='champions') redeemMsg.textContent=`欧冠版高概率活动码已激活：增加 ${d.chances} 次，接下来这些抽奖使用真实提高后的实物奖概率。`;
    else if(mode==='egg') redeemMsg.textContent=`彩蛋版已激活：增加 ${d.chances} 次，其中前 5 次固定为“谢谢惠顾”；完成后会触发隐藏界面彩蛋，之后概率恢复正常。`;
    else redeemMsg.textContent=`随机版兑换成功：已增加 ${d.chances} 次抽奖机会，使用正常概率。`;
    codeInput.value='';
  }catch(e){redeemMsg.className='msg bad';redeemMsg.textContent=e.message||'兑换失败'}
}
redeem = redeemWithActivityMode;
document.getElementById('redeemBtn').onclick=redeemWithActivityMode;

// Persistent user-side prize verification code button.
(function(){
  if(document.getElementById('claimCodeOpen')) return;
  const redeemOpen=document.getElementById('redeemOpen');
  if(!redeemOpen) return;
  const style=document.createElement('style');
  style.textContent=`.claim-open{min-height:48px;padding:12px;border-radius:17px;border:1px solid rgba(255,214,107,.58);background:linear-gradient(120deg,rgba(255,214,107,.14),rgba(105,244,255,.07));color:#ffe9a5;font-size:12px;font-weight:1000;letter-spacing:.06em;cursor:pointer;box-shadow:0 0 24px rgba(255,205,69,.08)}.claim-panel{width:min(470px,100%);border-radius:24px;border:1px solid rgba(255,214,107,.4);background:linear-gradient(160deg,#16192a,#090c1d);box-shadow:0 30px 90px rgba(0,0,0,.62),0 0 55px rgba(255,205,69,.08);padding:22px;text-align:center}.claim-panel h2{margin:6px 0;font-size:24px}.claim-panel p{font-size:9px;line-height:1.7;color:#8d98b7;margin:0}.claim-code{margin:14px 0 8px;font-size:25px;font-weight:1000;letter-spacing:.12em;color:#ffe39a;word-break:break-all;min-height:32px}.claim-msg{font-size:9px;line-height:1.7;color:#b8c3df;min-height:34px}.claim-actions{display:flex;gap:8px;margin-top:14px}.claim-actions button{flex:1;height:44px;border-radius:12px;border:1px solid rgba(140,170,240,.2);background:rgba(255,255,255,.04);color:#fff;cursor:pointer}.claim-actions .primary{border:0;background:linear-gradient(120deg,#ffd66b,#8d84ff);color:#080b16;font-weight:1000}@media(max-width:640px){.claim-open{grid-column:1/-1}.claim-actions{flex-direction:column}}`;
  document.head.appendChild(style);
  const open=document.createElement('button');open.id='claimCodeOpen';open.className='claim-open';open.textContent='◆ 生成兑奖核验码';redeemOpen.insertAdjacentElement('afterend',open);
  const modal=document.createElement('div');modal.id='claimCodeModal';modal.className='modal';modal.innerHTML=`<div class="claim-panel"><div class="rk">PRIZE VERIFICATION CODE</div><h2>兑奖核验码</h2><p>生成后，把此码提供给管理员。管理员可查看本机截至当前的全部抽奖记录，包括“倒贴10元”和“赠送10元”。</p><div class="claim-code" id="claimCodeValue"></div><div class="claim-msg" id="claimCodeMsg">点击下方按钮生成。</div><div class="claim-actions"><button class="primary" id="claimCodeGenerate">生成核验码</button><button id="claimCodeClose">关闭</button></div></div>`;document.body.appendChild(modal);
  const codeEl=modal.querySelector('#claimCodeValue'),msgEl=modal.querySelector('#claimCodeMsg'),genBtn=modal.querySelector('#claimCodeGenerate');let currentCode='';
  open.onclick=()=>{currentCode='';codeEl.textContent='';const n=Array.isArray(state.history)?state.history.length:0;msgEl.textContent=n?`本机已有 ${n} 条抽奖记录，可生成核验码。`:'本机暂无抽奖记录，完成抽奖后即可生成。';genBtn.textContent='生成核验码';modal.classList.add('show')};
  modal.querySelector('#claimCodeClose').onclick=()=>modal.classList.remove('show');modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('show')});
  genBtn.onclick=async()=>{if(currentCode){try{await navigator.clipboard.writeText(currentCode);genBtn.textContent='已复制核验码'}catch(_){genBtn.textContent='请长按复制'}return}const history=Array.isArray(state.history)?state.history:[];if(!history.length){msgEl.textContent='本机暂无抽奖记录。';return}genBtn.disabled=true;genBtn.textContent='生成中…';try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create_claim_code',device_id:deviceId,history})});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'生成失败');currentCode=d.code;codeEl.textContent=currentCode;msgEl.textContent=`已生成，包含 ${d.total} 条抽奖记录。请把此核验码提供给管理员。`;genBtn.textContent='复制核验码'}catch(e){msgEl.textContent=e&&e.message?e.message:'生成失败，请重试';genBtn.textContent='重新生成'}finally{genBtn.disabled=false}};
})();
