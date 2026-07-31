import { Check, ChevronLeft, Lock, RotateCcw, Shield, SlidersHorizontal, Sparkles, Swords, WandSparkles } from "lucide-react";
import { CSSProperties, useMemo, useState } from "react";
import { useAppStore } from "../app/store";
import { HeroPreview } from "../components/HeroPreview";
import { heroes } from "../data/heroes";
import { GameSettings, HeroDefinition } from "../game/core/types";
import { RadarChart } from "../ui/RadarChart";
import { SkillIcon } from "../ui/SkillIcon";

const filters = ["全部", "战士", "法师", "坦克"] as const;
const tuningPresets = [0, 1, 10, 100, 1000];
const funHeroIds = new Set<HeroDefinition["id"]>(["wuxiang", "miaozong"]);
const defaultTuning: GameSettings["tuning"] = {
  skillDamageMultiplier: 100,
  basicAttackMultiplier: 1,
  cooldownMultiplier: 1,
  healthMultiplier: 1
};
const tuningControls: Array<{
  key: keyof GameSettings["tuning"];
  label: string;
  hint: string;
}> = [
  { key: "skillDamageMultiplier", label: "技能伤害", hint: "Q/W/E/R/T 与持续区域伤害" },
  { key: "basicAttackMultiplier", label: "普攻伤害", hint: "普通攻击与三段连击" },
  { key: "cooldownMultiplier", label: "冷却时间", hint: "0x 为无冷却，数值越大越久" },
  { key: "healthMultiplier", label: "血量", hint: "只影响玩家出战英雄" }
];

function clampMultiplier(value: number): number {
  return Math.min(1000, Math.max(0, Number.isFinite(value) ? value : 1));
}

function RoleIcon({ role }: { role: HeroDefinition["role"] }) {
  if (role === "战士") return <Swords size={18} />;
  if (role === "法师") return <WandSparkles size={18} />;
  return <Shield size={18} />;
}

function buildPreviewDraft(selected: HeroDefinition) {
  const remaining = heroes.filter((hero) => hero.id !== selected.id && !funHeroIds.has(hero.id));
  return {
    allies: [selected, ...remaining.slice(0, 4)],
    enemies: remaining.slice(4, 9)
  };
}

export function HeroSelectScreen() {
  const { selectedHeroId, selectHero, startBattle, setScreen, settings, updateSettings } = useAppStore();
  const [filter, setFilter] = useState<(typeof filters)[number]>("全部");
  const [launching, setLaunching] = useState(false);
  const standardHeroes = useMemo(() => heroes.filter((hero) => !funHeroIds.has(hero.id)), []);
  const selected = heroes.find((hero) => hero.id === selectedHeroId && (settings.funMode || !funHeroIds.has(hero.id))) ?? standardHeroes[0];
  const visibleHeroes = useMemo(() => heroes.filter((hero) => filter === "全部" || hero.role === filter), [filter]);
  const draft = useMemo(() => buildPreviewDraft(selected), [selected]);

  const confirm = () => {
    setLaunching(true);
    window.setTimeout(startBattle, 720);
  };

  const setTuning = (key: keyof GameSettings["tuning"], value: number) => {
    updateSettings({
      tuning: {
        ...settings.tuning,
        [key]: clampMultiplier(value)
      }
    });
  };

  return (
    <main className="screen select-screen">
      <div className="stars-layer select-stars" />
      <div className="select-shell">
        <aside className="hero-list glass-panel">
          <button className="text-icon-button" onClick={() => setScreen("home")}>
            <ChevronLeft size={18} />
            返回首页
          </button>
          <h2>选择守望者</h2>
          <div className="filter-row">
            {filters.map((item) => (
              <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
                {item}
              </button>
            ))}
          </div>
          <div className="hero-card-list">
            {visibleHeroes.map((hero) => {
              const locked = funHeroIds.has(hero.id) && !settings.funMode;
              return (
                <button
                  key={hero.id}
                  data-testid={`hero-card-${hero.id}`}
                  className={`hero-card ${selected.id === hero.id ? "selected" : ""} ${locked ? "locked" : ""}`}
                  onClick={() => {
                    if (!locked) selectHero(hero.id);
                  }}
                  disabled={locked}
                  style={{ "--hero-primary": hero.palette.primary, "--hero-secondary": hero.palette.secondary } as CSSProperties}
                >
                  <div className="hero-card-mark">
                    {locked ? <Lock size={18} /> : <RoleIcon role={hero.role} />}
                  </div>
                  <div>
                    <strong>{hero.name}</strong>
                    <span>{locked ? "娱乐模式解锁" : hero.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <section className="tuning-panel">
            <div className="tuning-heading">
              <span>
                <SlidersHorizontal size={16} />
                出战参数
              </span>
              <button aria-label="恢复默认出战参数" onClick={() => updateSettings({ tuning: defaultTuning })}>
                <RotateCcw size={16} />
              </button>
            </div>
            <label className="setting-row compact-toggle">
              <span>娱乐模式：解锁无敌与化身英雄</span>
              <input type="checkbox" checked={settings.funMode} onChange={(event) => updateSettings({ funMode: event.target.checked })} />
            </label>
            {tuningControls.map((control) => {
              const value = settings.tuning[control.key];
              return (
                <div className="tuning-control" key={control.key}>
                  <label>
                    <span>{control.label}</span>
                    <input type="number" min={0} max={1000} step={1} value={value} onChange={(event) => setTuning(control.key, Number(event.target.value))} />
                  </label>
                  <input type="range" min={0} max={1000} step={1} value={value} onChange={(event) => setTuning(control.key, Number(event.target.value))} aria-label={`${control.label}倍率`} />
                  <div className="tuning-presets">
                    {tuningPresets.map((preset) => (
                      <button key={preset} className={value === preset ? "active" : ""} onClick={() => setTuning(control.key, preset)}>
                        {preset}x
                      </button>
                    ))}
                  </div>
                  <small>{control.hint}</small>
                </div>
              );
            })}
          </section>
        </aside>

        <section className={`select-preview ${launching ? "launching" : ""}`}>
          <div className="preview-platform-glow" />
          <HeroPreview heroId={selected.id} launch={launching} />
          <div className="preview-caption">
            <Sparkles size={17} />
            拖动旋转 · 滚轮缩放
          </div>
        </section>

        <aside className="hero-detail glass-panel">
          <div className="detail-heading">
            <span className="eyebrow">{selected.title}</span>
            <h2>{selected.name}</h2>
            <p>{selected.tagline}</p>
          </div>
          <div className="role-row">
            <span>
              <RoleIcon role={selected.role} /> {selected.role}
            </span>
            <span>难度 {"◆".repeat(selected.difficulty)}{"◇".repeat(5 - selected.difficulty)}</span>
          </div>
          <p className="lore">{selected.lore}</p>
          <div className="detail-grid">
            <RadarChart radar={selected.radar} />
            <div className="stat-stack">
              <span>生命 {selected.stats.maxHp}</span>
              <span>攻击 {selected.stats.attack}</span>
              <span>防御 {selected.stats.defense}</span>
              <span>移速 {selected.stats.speed.toFixed(1)}</span>
            </div>
          </div>
          <div className="draft-panel">
            <div>
              <strong>己方 5 人</strong>
              {draft.allies.map((hero) => (
                <span key={hero.id}>{hero.name}</span>
              ))}
            </div>
            <div>
              <strong>敌方 5 人</strong>
              {draft.enemies.map((hero) => (
                <span key={hero.id}>{hero.name}</span>
              ))}
            </div>
          </div>
          <div className="ability-list">
            {selected.abilities.map((ability) => (
              <article key={ability.key} className="ability-item">
                <SkillIcon icon={ability.icon} />
                <div>
                  <strong>
                    {ability.key} · {ability.name}
                  </strong>
                  <span>
                    冷却 {ability.cooldown}s · 范围 {ability.range || ability.radius || "自身"}
                  </span>
                  <p>{ability.description}</p>
                </div>
              </article>
            ))}
          </div>
          <button className="primary-action confirm-pick" data-testid="confirm-pick" onClick={confirm} disabled={launching}>
            <Check size={20} />
            {launching ? "正在进入裂隙" : "确认出战"}
          </button>
        </aside>
      </div>
    </main>
  );
}
