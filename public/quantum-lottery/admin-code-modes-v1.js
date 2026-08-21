(()=>{
  const creator=document.querySelector('.creator');
  const genBtn=document.getElementById('genBtn');
  const chances=document.getElementById('chances');
  if(!creator||!genBtn||!chances)return;

  const style=document.createElement('style');
  style.textContent=`
  .mode-box{margin-top:13px;padding:11px;border:1px solid rgba(130,160,230,.13);border-radius:14px;background:rgba(3,7,19,.38)}
  .mode-title{font-size:8px;color:#9ba7c6;letter-spacing:.1em;margin-bottom:8px}.mode-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.mode-tab{min-height:42px;border:1px solid rgba(130,160,230,.18);border-radius:10px;background:rgba(255,255,255,.03);color:#dce6ff;font-size:9px;font-weight:800}.mode-tab.active{border-color:rgba(105,244,255,.52);background:rgba(105,244,255,.08);color:#c9fbff}.mode-tab[data-mode="champions"].active{border-color:rgba(255,214,107,.58);background:rgba(255,214,107,.09);color:#ffe8a2}.mode-tab[data-mode="egg"].active{border-color:rgba(181,132,255,.58);background:rgba(181,132,255,.09);color:#dfc9ff}.mode-desc{margin-top:8px;font-size:8px;line-height:1.6;color:#7f8aaa}
  .code-main{min-width:0}.code-main code{display:block}.mode-pill{display:inline-block;margin-top:4px;padding:3px 6px;border-radius:999px;font-size:7px;border:1px solid rgba(130,160,230,.14);color:#9eabc9}.mode-pill.champions{color:#ffe29a;border-color:rgba(255,214,107,.24);background:rgba(255,214,107,.05)}.mode-pill.egg{color:#d9bdff;border-color:rgba(181,132,255,.25);background:rgba(181,132,255,.05)}
  .row{grid-template-columns:minmax(118px,1fr) 60px 72px 72px 56px!important}.row .revoke{min-width:0}
  @media(max-width:760px){.mode-tabs{grid-template-columns:1fr}.row{grid-template-columns:minmax(120px,1fr) 52px 68px 54px!important}.row .date{display:none!important}.mode-tab{min-height:40px}}
  `;
  document.head.appendChild(style);

  const box=document.createElement('div');box.className='mode-box';box.innerHTML=`<div class="mode-title">兑换码类型</div><div class="mode-tabs"><button class="mode-tab active" data-mode="normal">随机版</button><button class="mode-tab" data-mode="champions">欧冠版</button><button class="mode-tab" data-mode="egg">彩蛋版</button></div><div class="mode-desc" id="modeDesc">随机版：使用正常免费赠送抽奖概率。</div>`;
  creator.querySelector('.preset').insertAdjacentElement('beforebegin',box);
  let selectedMode='normal';
  const desc=box.querySelector('#modeDesc');
  const descriptions={normal:'随机版：使用正常免费赠送抽奖概率。',champions:'欧冠版：真实提高实物奖概率，后台明确标记为“高概率活动码”。',egg:'彩蛋版：固定赠送 5 次；这 5 次均为“谢谢惠顾”，完成后触发隐藏界面视觉彩蛋，后续概率不变。'};
  box.addEventListener('click',e=>{const b=e.target.closest('.mode-tab');if(!b)return;selectedMode=b.dataset.mode;box.querySelectorAll('.mode-tab').forEach(x=>x.classList.toggle('active',x===b));desc.textContent=descriptions[selectedMode];if(selectedMode==='egg'){chances.value=5;chances.readOnly=true;document.querySelectorAll('#preset button').forEach(x=>x.classList.toggle('active',x.dataset.n==='5'))}else chances.readOnly=false});

  const modeLabel=m=>m==='champions'?'欧冠版 · 高概率活动码':m==='egg'?'彩蛋版':'随机版';
  const modeClass=m=>m==='champions'?'champions':m==='egg'?'egg':'';

  generate=async function(){
    let n=Math.max(1,Math.min(999,Math.floor(Number(chances.value)||1)));
    if(selectedMode==='egg')n=5;
    chances.value=n;
    $('genMsg').className='msg';$('genMsg').textContent='正在生成安全兑换码…';
    try{
      const d=await call({action:'generate_code',token,chances:n,mode:selectedMode});
      $('generated').style.display='block';$('newCode').textContent=d.item.code;$('genTimes').textContent=d.item.chances;
      $('genMsg').className='msg ok';$('genMsg').textContent=`生成成功 · ${modeLabel(d.item.code_mode||selectedMode)}。该兑换码尚未使用。`;
      await loadCodes();
    }catch(e){if(String(e.message).includes('会话'))logout();else{$('genMsg').className='msg bad';$('genMsg').textContent=e.message}}
  };
  genBtn.onclick=generate;

  loadCodes=async function(){
    if(!token)return;
    try{
      const d=await call({action:'list_codes',token});
      $('list').innerHTML=d.items.length?d.items.map(x=>`<div class="row"><div class="code-main"><code>${x.code}</code><span class="mode-pill ${modeClass(x.code_mode)}">${modeLabel(x.code_mode||'normal')}</span></div><b>+${x.chances}次</b><span class="pill ${x.active?'active-pill':'used-pill'}">${x.active?'未使用':'已使用'}</span><span class="date">${fmt(x.redeemed_at||x.created_at)}</span>${x.active?`<button class="revoke" data-code="${x.code}">作废</button>`:'<span></span>'}</div>`).join(''):'<div class="msg">暂无兑换码。</div>';
    }catch(e){if(String(e.message).includes('会话'))logout()}
  };
  clearInterval(timer);timer=null;if(token){startPolling();loadCodes()}
})();
