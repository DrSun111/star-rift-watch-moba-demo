import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const cards = [
  ["星痕突切", "Q · 方向突进", "common", "#62f1ff", "#f8d26b", "blade"],
  ["森辉灵弹", "Q · 远程弹体", "common", "#5dffc7", "#d6f58a", "orb"],
  ["玄盾破阵", "Q · 冲撞控制", "common", "#8bd4ff", "#ffe29a", "shield"],
  ["青霜贯星", "Q · 高伤直线", "elite", "#a7f6ff", "#f6f0b2", "orb"],
  ["赤羽贯日", "Q · 爆发切入", "rare", "#ff8b56", "#ffe08a", "blade"],
  ["回天霜环", "W · 近身范围", "common", "#9feeff", "#f6e68d", "blade"],
  ["缠星藤域", "W · 区域减速", "common", "#5dffc7", "#baff99", "orb"],
  ["小型星瀑", "W · 持续区域", "elite", "#7aa8ff", "#ffd97c", "orb"],
  ["赤晶壁环", "W · 防护技能", "elite", "#ff745d", "#ffd184", "shield"],
  ["折光闪现", "E · 位移", "common", "#dceaff", "#a8d9ff", "void"],
  ["星步护幕", "E · 护盾加速", "common", "#6fe6ff", "#ffdf8b", "shield"],
  ["地脉震鸣", "E · 近身控制", "elite", "#8ef0ff", "#ffd06f", "shield"],
  ["流风换位", "E · 短冷却位移", "rare", "#8ff2da", "#f1e18a", "scroll"],
  ["星藤风暴", "R · 范围爆发", "elite", "#5dffc7", "#d6f58a", "orb"],
  ["镇域穹顶", "R · 团队防护", "elite", "#8bd4ff", "#ffe29a", "shield"],
  ["曜刃临界", "R · 强化普攻", "elite", "#62f1ff", "#f8d26b", "blade"],
  ["万象灵潮", "R · 稀有持续爆发", "rare", "#f4fff1", "#c7f28c", "orb"],
  ["赤霄镇界", "R · 稀有防线", "rare", "#ff745d", "#ffd184", "guard"],
  ["镜月天瀑", "W · 稀有区域", "rare", "#dbe8ff", "#b3f5ff", "scroll"],
  ["天衡金令", "R · 金色终式", "ultra", "#fff2a8", "#ffb733", "ultra"]
];

const rarityThemes = {
  common: ["#0d243d", "#163a55", "#7adfff", "#daeaff"],
  elite: ["#082332", "#12485b", "#5beeff", "#f6fbff"],
  rare: ["#190f35", "#35246d", "#c08cff", "#f6f1ff"],
  ultra: ["#1e1508", "#5c3a0b", "#ffe7a0", "#fff8d6"]
};

const outDir = resolve(process.cwd(), "public/gacha/cards");
mkdirSync(outDir, { recursive: true });

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rewardEmblem(kind) {
  if (["blade", "ultra"].includes(kind)) {
    return `
      <g stroke="url(#accentStroke)" stroke-width="13" stroke-linecap="round" filter="url(#glow)">
        <path d="M220 575 C285 430 348 280 428 142" />
        <path d="M422 575 C358 430 296 280 216 142" />
      </g>
      <g fill="url(#metal)">
        <path d="M199 604 L238 565 L270 610 L226 642 Z" />
        <path d="M441 604 L402 565 L370 610 L414 642 Z" />
      </g>`;
  }
  if (["orb", "void"].includes(kind)) {
    return `
      <g filter="url(#glow)">
        <circle cx="320" cy="278" r="62" fill="url(#orb)" />
        <circle cx="320" cy="278" r="104" fill="none" stroke="url(#accentStroke)" stroke-width="7" stroke-dasharray="18 18" />
        <circle cx="218" cy="400" r="28" fill="url(#orb)" opacity=".75" />
        <circle cx="426" cy="414" r="22" fill="url(#orb)" opacity=".7" />
      </g>`;
  }
  if (["shield", "guard"].includes(kind)) {
    return `
      <g filter="url(#glow)">
        <path d="M320 176 L458 232 L430 505 C416 586 367 650 320 680 C273 650 224 586 210 505 L182 232 Z" fill="url(#shield)" stroke="url(#accentStroke)" stroke-width="10" />
        <path d="M320 222 L398 260 L382 494 C372 548 345 592 320 615 C295 592 268 548 258 494 L242 260 Z" fill="rgba(255,255,255,.18)" />
      </g>`;
  }
  if (kind === "scroll") {
    return `
      <g filter="url(#glow)">
        <path d="M207 242 C255 204 383 204 433 244 L411 622 C362 660 273 660 228 622 Z" fill="url(#robe)" stroke="url(#accentStroke)" stroke-width="8" />
        <path d="M246 350 C305 326 365 326 424 350" fill="none" stroke="url(#accentStroke)" stroke-width="9" stroke-linecap="round" />
        <path d="M238 442 C296 414 366 414 424 442" fill="none" stroke="#ffffff" stroke-width="4" opacity=".45" />
      </g>`;
  }
  return `
    <g filter="url(#glow)">
      <ellipse cx="320" cy="414" rx="138" ry="78" fill="url(#gold)" />
      <ellipse cx="282" cy="460" rx="120" ry="68" fill="url(#gold)" opacity=".82" />
      <ellipse cx="356" cy="500" rx="126" ry="72" fill="url(#gold)" opacity=".72" />
      <path d="M224 344 H416 L452 522 C386 572 254 572 188 522 Z" fill="url(#chest)" stroke="url(#accentStroke)" stroke-width="9" />
      <path d="M210 394 H430" stroke="#fff4b8" stroke-width="12" opacity=".7" />
      <circle cx="320" cy="458" r="36" fill="#fff3a6" opacity=".92" />
    </g>`;
}

function heroFigure(kind) {
  if (["coin", "supply", "box", "crystal", "seal", "ticket", "forge", "ledger", "jade", "port", "aurora", "key", "vault"].includes(kind)) {
    return rewardEmblem(kind);
  }
  return `
    <g filter="url(#shadow)">
      <path d="M198 678 C214 566 245 486 320 486 C395 486 426 566 442 678 Z" fill="url(#robe)" />
      <path d="M248 515 C264 456 294 421 320 421 C346 421 376 456 392 515 C354 548 286 548 248 515 Z" fill="rgba(255,255,255,.16)" />
      <circle cx="320" cy="338" r="63" fill="url(#skin)" />
      <path d="M246 332 C254 252 303 216 356 238 C400 258 414 309 389 358 C362 319 303 305 246 332 Z" fill="url(#hair)" />
      <path d="M244 684 C268 634 372 634 396 684 Z" fill="rgba(255,255,255,.22)" />
    </g>
    ${rewardEmblem(kind)}`;
}

function svg(card, index) {
  const [name, subtitle, rarity, primary, accent, kind] = card;
  const [bgA, bgB, frame, text] = rarityThemes[rarity];
  const serial = String(index + 1).padStart(2, "0");
  const ultra = rarity === "ultra";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="900" viewBox="0 0 640 900" role="img" aria-label="${esc(name)} card">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bgA}" />
      <stop offset=".55" stop-color="${bgB}" />
      <stop offset="1" stop-color="#070d18" />
    </linearGradient>
    <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${frame}" />
      <stop offset=".48" stop-color="${accent}" />
      <stop offset="1" stop-color="${ultra ? "#8d5b11" : "#244564"}" />
    </linearGradient>
    <linearGradient id="accentStroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${primary}" />
      <stop offset=".5" stop-color="${accent}" />
      <stop offset="1" stop-color="#ffffff" />
    </linearGradient>
    <radialGradient id="orb" cx="50%" cy="42%" r="55%">
      <stop offset="0" stop-color="#ffffff" />
      <stop offset=".35" stop-color="${primary}" />
      <stop offset="1" stop-color="${bgB}" />
    </radialGradient>
    <linearGradient id="robe" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${primary}" />
      <stop offset=".55" stop-color="${bgB}" />
      <stop offset="1" stop-color="#101827" />
    </linearGradient>
    <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffe4c2" />
      <stop offset="1" stop-color="#b87955" />
    </linearGradient>
    <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ultra ? "#fff1a3" : "#e7eefb"}" />
      <stop offset="1" stop-color="${bgA}" />
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff8b7" />
      <stop offset=".5" stop-color="${accent}" />
      <stop offset="1" stop-color="#b87619" />
    </linearGradient>
    <linearGradient id="chest" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${primary}" />
      <stop offset="1" stop-color="#17243a" />
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f4fbff" />
      <stop offset=".55" stop-color="${primary}" />
      <stop offset="1" stop-color="#28344a" />
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0.2 0 1 0 0 0.76 0 0 1 0 1 0 0 0 .75 0" result="glow" />
      <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity=".45" />
    </filter>
    <clipPath id="round">
      <rect x="22" y="22" width="596" height="856" rx="42" />
    </clipPath>
  </defs>
  <rect width="640" height="900" fill="#060c16" />
  <g clip-path="url(#round)">
    <rect x="22" y="22" width="596" height="856" fill="url(#bg)" />
    <path d="M80 730 C180 595 130 455 238 318 C330 202 454 188 558 82 L558 878 L80 878 Z" fill="${primary}" opacity=".11" />
    <path d="M84 196 C168 92 291 72 380 132 C472 194 520 318 586 348" fill="none" stroke="${accent}" stroke-width="2" opacity=".35" />
    <path d="M76 606 C188 518 242 554 326 456 C415 354 467 330 572 374" fill="none" stroke="${primary}" stroke-width="3" opacity=".24" />
    <g opacity=".35">
      <circle cx="104" cy="104" r="3" fill="#ffffff" />
      <circle cx="514" cy="148" r="4" fill="${accent}" />
      <circle cx="556" cy="632" r="3" fill="#ffffff" />
      <circle cx="126" cy="700" r="4" fill="${primary}" />
      <circle cx="474" cy="732" r="2" fill="#ffffff" />
    </g>
    <circle cx="320" cy="438" r="${ultra ? 266 : 226}" fill="none" stroke="url(#accentStroke)" stroke-width="${ultra ? 10 : 5}" opacity="${ultra ? ".62" : ".35"}" />
    <circle cx="320" cy="438" r="${ultra ? 210 : 176}" fill="none" stroke="#ffffff" stroke-width="2" opacity=".2" stroke-dasharray="18 18" />
    ${heroFigure(kind)}
    ${ultra ? `<path d="M254 174 L292 96 L320 160 L354 94 L388 174 Z" fill="url(#gold)" stroke="#fff7c0" stroke-width="5" filter="url(#glow)" />` : ""}
    <rect x="22" y="22" width="596" height="856" rx="42" fill="none" stroke="url(#frame)" stroke-width="${ultra ? 18 : 12}" />
    <rect x="48" y="48" width="544" height="804" rx="30" fill="none" stroke="#ffffff" stroke-width="2" opacity=".22" />
    <path d="M72 754 H568" stroke="url(#frame)" stroke-width="3" opacity=".7" />
    <text x="88" y="116" fill="${text}" font-size="34" font-weight="800" font-family="Microsoft YaHei, PingFang SC, sans-serif">${esc(name)}</text>
    <text x="90" y="157" fill="${accent}" font-size="21" font-weight="700" font-family="Microsoft YaHei, PingFang SC, sans-serif">${esc(subtitle)}</text>
    <text x="88" y="816" fill="${text}" font-size="20" font-weight="700" opacity=".88" font-family="Microsoft YaHei, PingFang SC, sans-serif">ASTRA SKILL CODE</text>
    <text x="552" y="816" text-anchor="end" fill="${accent}" font-size="26" font-weight="900" font-family="Inter, sans-serif">#${serial}</text>
  </g>
</svg>`;
}

cards.forEach((card, index) => {
  writeFileSync(join(outDir, `card-${String(index + 1).padStart(2, "0")}.svg`), svg(card, index), "utf8");
});

console.log(`Generated ${cards.length} gacha card images in ${outDir}`);
