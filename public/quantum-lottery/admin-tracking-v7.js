// Adds per-code prize history to the existing admin list without moving the admin entry or changing login flow.
(function(){
  const style=document.createElement('style');
  style.textContent='.prize-log{grid-column:1/-1;margin-top:3px;padding-top:7px;border-top:1px solid rgba(130,160,230,.1);font-size:8px;line-height:1.7;color:#b9c6e7}.prize-log b{color:#ffe59a}.prize-log .neg{color:#ff9cac}.prize-log .empty{color:#697590}';
  document.head.appendChild(style);
  async function syncPrizeLogs(){
    const t=sessionStorage.getItem('lotteryAdminToken');
    const list=document.getElementById('list');
    if(!t||!list||document.getElementById('dash')?.style.display==='none') return;
    try{
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'list_codes',token:t})});
      const d=await r.json(); if(!d.ok||!Array.isArray(d.items)) return;
      const map=new Map(d.items.map(x=>[x.code,x.prizes||[]]));
      list.querySelectorAll('.row').forEach(row=>{
        const code=row.querySelector('code')?.textContent?.trim(); if(!code) return;
        row.querySelector('.prize-log')?.remove();
        const prizes=map.get(code)||[];
        const el=document.createElement('div'); el.className='prize-log';
        if(!prizes.length){el.innerHTML='<span class="empty">奖品记录：暂无抽奖记录</span>'}
        else{
          el.innerHTML='奖品记录：'+prizes.map((p,i)=>{const cls=p.prize_type==='penalty'?'neg':'';return `<b class="${cls}">${i+1}. ${p.prize_label}</b>`}).join(' · ');
        }
        row.appendChild(el);
      });
    }catch(_){ }
  }
  setInterval(syncPrizeLogs,2200); setTimeout(syncPrizeLogs,700);
})();
