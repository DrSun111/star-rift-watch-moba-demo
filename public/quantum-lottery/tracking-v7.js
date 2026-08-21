// Bind an activated one-time code to this browser and mirror all draw results to the backend.
(function(){
  const TRACK_KEY='quantumLotteryPlayerCode';
  const params=new URLSearchParams(location.search);
  const urlCode=(params.get('code')||'').trim().toUpperCase();

  async function bindCode(code){
    if(!code) return;
    const existing=localStorage.getItem(TRACK_KEY);
    if(existing) return;
    try{
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'redeem_code',code,device_id:deviceId})});
      const d=await r.json();
      if(!d.ok) return;
      state.bonus+=Number(d.chances)||0;
      save(); render();
      localStorage.setItem(TRACK_KEY,d.code);
      if(typeof redeemMsg!=='undefined'&&redeemMsg){redeemMsg.className='msg ok';redeemMsg.textContent=`专属兑换码已激活，增加 ${d.chances} 次；本次及后续奖品将同步到后台。`;}
    }catch(_){ }
  }

  const originalCommit=commitResults;
  commitResults=function(results){
    originalCommit(results);
    const code=localStorage.getItem(TRACK_KEY);
    if(!code||!Array.isArray(results)||!results.length) return;
    const first=Math.max(1,state.history.length-results.length+1);
    fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      action:'record_draw',code,device_id:deviceId,
      results:results.map((r,i)=>({type:r.p.type,label:r.p.label,draw_index:first+i}))
    })}).catch(()=>{});
  };

  const redeemButton=document.getElementById('redeemBtn');
  if(redeemButton){
    redeemButton.addEventListener('click',()=>{
      const candidate=(codeInput?.value||'').trim().toUpperCase();
      if(!candidate) return;
      setTimeout(()=>{if(redeemMsg?.classList.contains('ok')) localStorage.setItem(TRACK_KEY,candidate)},900);
    },true);
  }

  if(urlCode) setTimeout(()=>bindCode(urlCode),120);
})();
