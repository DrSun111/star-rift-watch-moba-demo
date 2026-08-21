// Runtime lottery probability override. Probabilities are intentionally not rendered in the UI.
chooseType = function(){
  const n = secureInt(100000);
  if(n < 20000) return 'penalty';
  if(n < 79600) return 'thanks';
  if(n < 84600) return 'notebook';
  if(n < 89600) return 'pen';
  if(n < 94600) return 'water';
  if(n < 99600) return 'gift10';
  if(n < 99700) return 'rolls';
  if(n < 99800) return 'rolex';
  if(n < 99900) return 'dji';
  return 'maldives';
};

// Remove the legacy filler sector so every visible sector can actually be selected.
const blankIndex = prizes.findIndex(p => p.type === 'blank');
if(blankIndex >= 0) prizes.splice(blankIndex, 1);

// Add the new 10-yuan gift prize if the base page does not already contain it.
if(!prizes.some(p=>p.type==='gift10')){
  const insertAt=Math.min(5,prizes.length);
  prizes.splice(insertAt,0,{type:'gift10',label:'赠送10元',icon:'💵',text:'恭喜抽中赠送 10 元。',win:true});
}

// Refresh the visible prize gallery so the new prize is shown on both desktop and mobile.
if(typeof gallery!=='undefined' && gallery){
  gallery.innerHTML=prizes.map(p=>`<div class="card"><div class="ico">${p.icon}</div><div class="meta"><b>${p.label}</b><p>${p.text}</p></div></div>`).join('');
}

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

// Keep five-draw visually obvious even before the user has five remaining chances.
const fiveDrawStyle = document.createElement('style');
fiveDrawStyle.textContent = `.draw5{display:block!important;visibility:visible!important;opacity:1!important;min-height:58px!important;border:1px solid rgba(255,214,107,.82)!important;background:linear-gradient(120deg,rgba(255,217,91,.28),rgba(139,87,255,.25))!important;color:#fff0a8!important;font-size:14px!important;box-shadow:0 0 34px rgba(255,205,69,.2),inset 0 0 24px rgba(255,230,130,.1)!important}.draw5:disabled{display:block!important;visibility:visible!important;opacity:.72!important;filter:none!important}`;
document.head.appendChild(fiveDrawStyle);

// Persistent user-side prize verification code button.
(function(){
  if(document.getElementById('claimCodeOpen')) return;
  const redeemOpen=document.getElementById('redeemOpen');
  if(!redeemOpen) return;

  const style=document.createElement('style');
  style.textContent=`
  .claim-open{min-height:48px;padding:12px;border-radius:17px;border:1px solid rgba(255,214,107,.58);background:linear-gradient(120deg,rgba(255,214,107,.14),rgba(105,244,255,.07));color:#ffe9a5;font-size:12px;font-weight:1000;letter-spacing:.06em;cursor:pointer;box-shadow:0 0 24px rgba(255,205,69,.08)}
  .claim-panel{width:min(470px,100%);border-radius:24px;border:1px solid rgba(255,214,107,.4);background:linear-gradient(160deg,#16192a,#090c1d);box-shadow:0 30px 90px rgba(0,0,0,.62),0 0 55px rgba(255,205,69,.08);padding:22px;text-align:center}
  .claim-panel h2{margin:6px 0;font-size:24px}.claim-panel p{font-size:9px;line-height:1.7;color:#8d98b7;margin:0}.claim-code{margin:14px 0 8px;font-size:25px;font-weight:1000;letter-spacing:.12em;color:#ffe39a;word-break:break-all;min-height:32px}.claim-msg{font-size:9px;line-height:1.7;color:#b8c3df;min-height:34px}.claim-actions{display:flex;gap:8px;margin-top:14px}.claim-actions button{flex:1;height:44px;border-radius:12px;border:1px solid rgba(140,170,240,.2);background:rgba(255,255,255,.04);color:#fff;cursor:pointer}.claim-actions .primary{border:0;background:linear-gradient(120deg,#ffd66b,#8d84ff);color:#080b16;font-weight:1000}
  @media(max-width:640px){.claim-open{grid-column:1/-1}.claim-actions{flex-direction:column}}
  `;
  document.head.appendChild(style);

  const open=document.createElement('button');
  open.id='claimCodeOpen';
  open.className='claim-open';
  open.textContent='◆ 生成兑奖核验码';
  redeemOpen.insertAdjacentElement('afterend',open);

  const modal=document.createElement('div');
  modal.id='claimCodeModal';
  modal.className='modal';
  modal.innerHTML=`<div class="claim-panel"><div class="rk">PRIZE VERIFICATION CODE</div><h2>兑奖核验码</h2><p>生成后，把此码提供给管理员。管理员可查看本机截至当前的全部抽奖记录，包括“倒贴10元”和“赠送10元”。</p><div class="claim-code" id="claimCodeValue"></div><div class="claim-msg" id="claimCodeMsg">点击下方按钮生成。</div><div class="claim-actions"><button class="primary" id="claimCodeGenerate">生成核验码</button><button id="claimCodeClose">关闭</button></div></div>`;
  document.body.appendChild(modal);

  const codeEl=modal.querySelector('#claimCodeValue');
  const msgEl=modal.querySelector('#claimCodeMsg');
  const genBtn=modal.querySelector('#claimCodeGenerate');
  let currentCode='';

  open.onclick=()=>{
    currentCode='';
    codeEl.textContent='';
    const n=Array.isArray(state.history)?state.history.length:0;
    msgEl.textContent=n?`本机已有 ${n} 条抽奖记录，可生成核验码。`:'本机暂无抽奖记录，完成抽奖后即可生成。';
    genBtn.textContent='生成核验码';
    modal.classList.add('show');
  };
  modal.querySelector('#claimCodeClose').onclick=()=>modal.classList.remove('show');
  modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('show')});

  genBtn.onclick=async()=>{
    if(currentCode){
      try{await navigator.clipboard.writeText(currentCode);genBtn.textContent='已复制核验码'}catch(_){genBtn.textContent='请长按复制'}
      return;
    }
    const history=Array.isArray(state.history)?state.history:[];
    if(!history.length){msgEl.textContent='本机暂无抽奖记录。';return}
    genBtn.disabled=true;
    genBtn.textContent='生成中…';
    try{
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create_claim_code',device_id:deviceId,history})});
      const d=await r.json();
      if(!r.ok||!d.ok) throw new Error(d.error||'生成失败');
      currentCode=d.code;
      codeEl.textContent=currentCode;
      msgEl.textContent=`已生成，包含 ${d.total} 条抽奖记录。请把此核验码提供给管理员。`;
      genBtn.textContent='复制核验码';
    }catch(e){
      msgEl.textContent=e&&e.message?e.message:'生成失败，请重试';
      genBtn.textContent='重新生成';
    }finally{genBtn.disabled=false}
  };
})();
