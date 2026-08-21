(()=>{
  const style=document.createElement('style');
  style.textContent=`
  html,body{width:100%;max-width:100%;overflow-x:hidden}
  button,input{font-family:inherit}

  @media(max-width:700px){
    body{padding:0;overscroll-behavior-x:none}
    .app{width:100%!important;max-width:none!important;padding:max(8px,env(safe-area-inset-top)) 10px max(18px,env(safe-area-inset-bottom))!important}
    .top{padding:6px 2px 10px!important;gap:7px!important}
    .logo{width:34px!important;height:34px!important;border-radius:10px!important}
    .brand b{font-size:11px!important;letter-spacing:.11em!important}
    .brand small{display:none!important}
    .online{font-size:7px!important;padding:6px 8px!important}

    .layout{display:block!important;margin-top:10px!important}
    .panel{border-radius:18px!important}
    .main{padding:14px 10px 12px!important}
    .eyebrow{font-size:7px!important}
    .title{font-size:31px!important;line-height:1.04!important;margin:6px 0!important}
    .sub{font-size:9px!important;line-height:1.6!important}

    .stage{display:flex!important;flex-direction:column!important;gap:8px!important;margin-top:10px!important}
    .wheelbox{width:min(88vw,390px)!important;max-width:390px!important;margin:4px auto 10px!important;flex:none!important}
    #wheel{width:91%!important;height:91%!important}
    .pointer{width:28px!important;height:34px!important;top:-1px!important}
    .hub{width:24%!important}
    .hub b{font-size:9px!important}.hub span{font-size:6px!important}
    .batch-hud{top:7%!important;font-size:8px!important;padding:7px 10px!important}

    .controls{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;width:100%!important}
    .stat{padding:10px!important;border-radius:14px!important;min-width:0!important}
    .stat small{font-size:7px!important;letter-spacing:.09em!important}
    .count{font-size:34px!important}
    .secure{font-size:7px!important;gap:4px!important}
    .draw,.draw5,.redeem-open,.claim-open,.note{grid-column:1/-1!important;width:100%!important}
    .draw,.draw5{min-height:51px!important;border-radius:14px!important;font-size:12px!important;padding:12px 10px!important}
    .redeem-open,.claim-open{min-height:46px!important;border-radius:14px!important;font-size:11px!important;padding:11px 10px!important}
    .note{font-size:7px!important;line-height:1.55!important;padding:0 2px!important}

    .statusbar{grid-template-columns:1fr 1fr 1fr!important;gap:5px!important;margin-top:10px!important}
    .mini{padding:8px 6px!important;border-radius:11px!important;min-width:0!important}
    .mini span{font-size:6px!important}.mini b{font-size:8px!important;white-space:normal!important}

    .side{margin-top:10px!important;padding:12px 10px!important}
    .sidehead{margin-bottom:8px!important}.sidehead h2{font-size:13px!important}
    .cards{display:flex!important;overflow-x:auto!important;gap:7px!important;padding:1px 1px 6px!important;scroll-snap-type:x mandatory!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important}
    .cards::-webkit-scrollbar{display:none!important}
    .card{flex:0 0 176px!important;grid-template-columns:46px 1fr!important;gap:7px!important;padding:8px!important;border-radius:13px!important;scroll-snap-align:start!important}
    .ico{width:46px!important;height:46px!important;font-size:22px!important;border-radius:11px!important}
    .meta b{font-size:8px!important}.meta p{font-size:6.5px!important}
    .history{margin-top:8px!important;padding-top:8px!important}
    .hitem{font-size:7px!important;padding:6px 0!important}
    .foot{margin:12px 0 4px!important;padding-bottom:max(4px,env(safe-area-inset-bottom))!important}

    .modal{padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom))!important;align-items:center!important;overflow-y:auto!important}
    .result,.redeem,.batch-panel,.claim-panel{width:100%!important;max-width:430px!important;max-height:calc(100dvh - 20px)!important;border-radius:20px!important;overflow:auto!important}
    .rart{height:135px!important;font-size:64px!important}
    .resultbody,.redeembody,.batch-body{padding:14px 14px 16px!important}
    .result h1,.redeem h2,.batch-panel h2,.claim-panel h2{font-size:21px!important}
    .result p,.redeem p,.batch-panel p,.claim-panel p{font-size:9px!important}
    .codebox{flex-direction:column!important;gap:7px!important}
    .codebox input{height:45px!important;font-size:13px!important}
    .codebox button{width:100%!important;height:44px!important}

    .claim-panel{padding:18px 14px!important}
    .claim-code{font-size:21px!important;letter-spacing:.08em!important;margin:12px 0 7px!important}
    .claim-msg{font-size:9px!important;min-height:30px!important}
    .claim-actions{flex-direction:column!important;gap:7px!important}
    .claim-actions button{width:100%!important;min-height:44px!important;flex:none!important}

    .batch-head{padding:15px 13px 7px!important}
    .batch-grid{grid-template-columns:1fr 1fr!important;gap:7px!important;padding:8px 10px 12px!important}
    .batch-item{padding:11px 6px 10px!important;border-radius:13px!important}
    .batch-item:last-child:nth-child(odd){grid-column:1/-1!important}
    .batch-item .bi{font-size:29px!important}
    .batch-item b{font-size:8px!important}.batch-item small{font-size:6px!important}

    .reveal-toast{top:10%!important;min-width:170px!important;padding:10px 14px!important;border-radius:14px!important}
    .gold-core strong{font-size:clamp(32px,13vw,56px)!important}
    .gold-core span{font-size:8px!important;letter-spacing:.22em!important}
  }

  @media(max-width:390px){
    .app{padding-left:7px!important;padding-right:7px!important}
    .title{font-size:27px!important}
    .wheelbox{width:min(91vw,350px)!important}
    .controls{grid-template-columns:1fr!important}
    .stat{grid-column:auto!important}
    .draw,.draw5,.redeem-open,.claim-open,.note{grid-column:1!important}
    .statusbar{grid-template-columns:1fr 1fr!important}
    .statusbar .mini:last-child{grid-column:1/-1!important}
    .claim-panel{padding:15px 11px!important}
    .claim-code{font-size:19px!important}
  }

  @media(max-height:700px) and (max-width:700px){
    .title{font-size:26px!important}
    .sub{display:none!important}
    .wheelbox{width:min(72vh,84vw,340px)!important}
    .rart{height:110px!important}
  }
  `;
  document.head.appendChild(style);
})();
