import { ChevronLeft, Coins, Crown, Sparkles, Ticket, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppStore } from "../app/store";
import { GACHA_DRAW_COST, GACHA_TEN_DRAW_COST, findGachaCard, gachaCards, getGachaCost, getGachaRateSummary, rarityLabels, ultraRareCard, type GachaCard } from "../data/gacha";
import type { AbilityKey } from "../game/core/types";
import { SkillIcon } from "../ui/SkillIcon";

const slots: AbilityKey[] = ["Q", "W", "E", "R"];

function rewardText(card: GachaCard): string {
  return `${card.slot} 技能卡 · 已入库`;
}

export function GachaScreen() {
  const { gacha, lastGachaDraw, drawGacha, equipSkillCard, setScreen } = useAppStore();
  const [featuredId, setFeaturedId] = useState(ultraRareCard.id);
  const [revealing, setRevealing] = useState(false);
  const [notice, setNotice] = useState("金币来自对局结算，进入战斗后击杀、推塔并完成一局即可入账。");
  const owned = useMemo(() => new Set(gacha.ownedCardIds), [gacha.ownedCardIds]);
  const equippedSkillCardIds = gacha.equippedSkillCardIds ?? {};
  const featured = gachaCards.find((card) => card.id === featuredId) ?? ultraRareCard;
  const rates = useMemo(() => getGachaRateSummary(), []);
  const equippedCard = findGachaCard(equippedSkillCardIds[featured.slot]);
  const featuredOwned = owned.has(featured.id);
  const featuredEquipped = equippedSkillCardIds[featured.slot] === featured.id;

  const runDraw = (count: number) => {
    const cost = getGachaCost(count);
    if (gacha.gold < cost) {
      setNotice(`金币不足：需要 ${cost}，当前 ${gacha.gold}。先打一局结算金币。`);
      return;
    }
    setRevealing(true);
    const beforeOwned = new Set(gacha.ownedCardIds);
    const results = drawGacha(count);
    const highlight = results.find((card) => card.rarity === "ultra") ?? results.find((card) => !beforeOwned.has(card.id)) ?? results[0];
    if (highlight) setFeaturedId(highlight.id);
    setNotice(`消耗 ${cost} 金币，获得 ${results.length} 张技能卡。新槽位会自动佩戴第一张抽到的技能卡。`);
    window.setTimeout(() => setRevealing(false), 680);
  };

  const equipFeatured = () => {
    if (!featuredOwned) return;
    equipSkillCard(featured.id);
    setNotice(`${featured.name} 已佩戴到 ${featured.slot} 键。进入战斗后会替换该键位技能。`);
  };

  return (
    <main className="screen gacha-screen">
      <div className="stars-layer gacha-stars" />
      <section className="gacha-shell">
        <header className="gacha-topbar">
          <button className="text-icon-button" onClick={() => setScreen("home")}>
            <ChevronLeft size={18} />
            返回首页
          </button>
          <div className="gacha-title">
            <span className="eyebrow">星核研修 · 技能卡限定池</span>
            <h1>技能抽卡池</h1>
          </div>
          <div className="gacha-wallet glass-panel" data-testid="gacha-gold">
            <Coins size={20} />
            <span>{gacha.gold.toLocaleString("zh-CN")}</span>
          </div>
        </header>

        <section className="gacha-spotlight">
          <div className="gacha-copy">
            <div className="gacha-kicker">
              <Crown size={18} />
              超稀有金色技能
            </div>
            <h2>{ultraRareCard.name}</h2>
            <p>{ultraRareCard.flavor}</p>
            <div className="gacha-owned-line">
              <span>已拥有技能卡 {gacha.ownedCardIds.length}</span>
              <span>累计抽取 {gacha.drawCount} 次</span>
              <span>单抽 {GACHA_DRAW_COST} 金币</span>
              <span>十连 {GACHA_TEN_DRAW_COST} 金币</span>
              {gacha.ultraPulled && <strong>已获得金色技能</strong>}
            </div>
          </div>
          <article className={`gacha-feature-card ${featured.rarity}`} data-testid="gacha-feature-card">
            <img src={featured.art} alt={`${featured.name}卡面`} />
            <div>
              <span>
                {rarityLabels[featured.rarity]} · {featured.slot}
              </span>
              <strong>{featured.name}</strong>
            </div>
          </article>
        </section>

        <section className="gacha-layout">
          <aside className="gacha-rate-panel glass-panel">
            <h2>概率与佩戴</h2>
            <div className="rate-list">
              {rates.map((rate) => (
                <div key={rate.rarity} className={`rate-row ${rate.rarity}`}>
                  <span>{rate.label}</span>
                  <strong>{rate.percent}%</strong>
                </div>
              ))}
            </div>
            <div className="equipped-slots">
              {slots.map((slot) => {
                const card = findGachaCard(equippedSkillCardIds[slot]);
                return (
                  <button key={slot} className={`equip-slot ${card ? card.rarity : ""}`} onClick={() => card && setFeaturedId(card.id)} disabled={!card}>
                    <span>{slot}</span>
                    <strong>{card?.name ?? "未佩戴"}</strong>
                  </button>
                );
              })}
            </div>
            <p>{notice}</p>
          </aside>

          <section className="gacha-pool glass-panel">
            <div className="gacha-section-heading">
              <h2>技能图鉴</h2>
              <span>{gachaCards.length} 张本地技能卡图</span>
            </div>
            <div className="gacha-card-grid" data-testid="gacha-card-grid">
              {gachaCards.map((card) => (
                <button
                  key={card.id}
                  className={`pool-card ${card.rarity} ${featured.id === card.id ? "active" : ""} ${owned.has(card.id) ? "owned" : ""} ${equippedSkillCardIds[card.slot] === card.id ? "equipped" : ""}`}
                  onClick={() => setFeaturedId(card.id)}
                  aria-label={`查看${card.name}`}
                >
                  <img src={card.art} alt={`${card.name}卡面`} />
                  <span>{card.slot}</span>
                </button>
              ))}
            </div>
          </section>

          <aside className="gacha-draw-panel glass-panel">
            <div className="gacha-section-heading">
              <h2>技能详情</h2>
              <SkillIcon icon={featured.ability.icon} />
            </div>
            <div className="skill-card-detail">
              <strong>{featured.name}</strong>
              <span>
                {featured.subtitle} · 冷却 {featured.ability.cooldown}s
              </span>
              <p>{featured.ability.description}</p>
              <div className="skill-card-stats">
                <span>伤害 {featured.ability.damage}</span>
                <span>范围 {featured.ability.range || featured.ability.radius || "自身"}</span>
                <span>{featured.ability.damageType === "magic" ? "魔法" : featured.ability.damageType === "physical" ? "物理" : "真实"}</span>
              </div>
              <button className="primary-action small" onClick={equipFeatured} disabled={!featuredOwned || featuredEquipped}>
                <Zap size={17} />
                {featuredEquipped ? `已佩戴到 ${featured.slot}` : featuredOwned ? `佩戴到 ${featured.slot}` : "未拥有"}
              </button>
              {equippedCard && equippedCard.id !== featured.id && <small>{featured.slot} 当前佩戴：{equippedCard.name}</small>}
            </div>
            <div className="draw-buttons">
              <button className="primary-action" data-testid="gacha-draw-one" onClick={() => runDraw(1)} disabled={gacha.gold < GACHA_DRAW_COST}>
                <Ticket size={19} />
                抽 1 次
              </button>
              <button className="glass-action" data-testid="gacha-draw-ten" onClick={() => runDraw(10)} disabled={gacha.gold < GACHA_TEN_DRAW_COST}>
                <Sparkles size={19} />
                十连抽
              </button>
            </div>
            <div className={`draw-results ${revealing ? "revealing" : ""}`} data-testid="gacha-results">
              {lastGachaDraw.length === 0 ? (
                <div className="empty-draw">
                  <Crown size={24} />
                  <span>点击抽取，技能卡会在这里翻开。</span>
                </div>
              ) : (
                lastGachaDraw.map((card, index) => (
                  <article key={`${card.id}-${index}-${gacha.drawCount}`} className={`draw-card ${card.rarity}`} style={{ animationDelay: `${index * 55}ms` }}>
                    <img src={card.art} alt={`${card.name}卡面`} />
                    <div>
                      <strong>{card.name}</strong>
                      <span>{rewardText(card)}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
