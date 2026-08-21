// Runtime lottery probability override. Probabilities are intentionally not rendered in the UI.
chooseType = function(){
  const n = secureInt(100000);
  if(n < 19920) return 'penalty';      // 19.92%
  if(n < 39840) return 'thanks';       // 19.92%
  if(n < 59760) return 'notebook';     // 19.92%
  if(n < 79680) return 'pen';          // 19.92%
  if(n < 99600) return 'water';        // 19.92%
  if(n < 99700) return 'rolls';        // 0.10%
  if(n < 99800) return 'rolex';        // 0.10%
  if(n < 99900) return 'dji';          // 0.10%
  return 'maldives';                   // 0.10%
};

// Keep five-draw visible even before the user has five remaining chances.
const fiveDrawStyle = document.createElement('style');
fiveDrawStyle.textContent = `.draw5{display:block!important;visibility:visible!important;opacity:1!important;min-height:56px!important;border:1px solid rgba(255,214,107,.7)!important;background:linear-gradient(120deg,rgba(255,217,91,.22),rgba(139,87,255,.22))!important;box-shadow:0 0 28px rgba(255,205,69,.15),inset 0 0 22px rgba(255,230,130,.08)!important}.draw5:disabled{display:block!important;visibility:visible!important;opacity:.72!important;filter:none!important}`;
document.head.appendChild(fiveDrawStyle);
