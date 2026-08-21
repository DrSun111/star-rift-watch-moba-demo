// Runtime lottery probability override. Probabilities are intentionally not rendered in the UI.
chooseType = function(){
  const n = secureInt(100000);
  if(n < 42300) return 'penalty';      // 42.30%
  if(n < 84600) return 'thanks';       // 42.30%
  if(n < 89600) return 'notebook';     // 5.00%
  if(n < 94600) return 'pen';          // 5.00%
  if(n < 99600) return 'water';        // 5.00%
  if(n < 99700) return 'rolls';        // 0.10%
  if(n < 99800) return 'rolex';        // 0.10%
  if(n < 99900) return 'dji';          // 0.10%
  return 'maldives';                   // 0.10%
};

// Remove the legacy filler sector so every visible sector can actually be selected.
const blankIndex = prizes.findIndex(p => p.type === 'blank');
if(blankIndex >= 0) prizes.splice(blankIndex, 1);

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
