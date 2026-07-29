import { Crosshair, HeartPulse, Pause, Settings, Shield, Sword, Volume2 } from "lucide-react";
import { heroById } from "../data/heroes";
import { secondsToClock } from "../game/core/math";
import { HeroDefinition, HudSnapshot } from "../game/core/types";
import { SkillIcon } from "./SkillIcon";

interface BattleHudProps {
  hud: HudSnapshot;
  heroId: HeroDefinition["id"];
  paused: boolean;
  showScoreboard: boolean;
  onPause: () => void;
}

function formatCooldown(seconds: number): string {
  if (seconds > 999) return "999+";
  if (seconds >= 100) return `${Math.ceil(seconds)}`;
  return seconds.toFixed(1);
}

export function BattleHud({ hud, heroId, paused, showScoreboard, onPause }: BattleHudProps) {
  const hero = heroById[heroId];
  const hpRate = Math.max(0, Math.min(1, hud.playerHp / hud.playerMaxHp));
  const xpRate = Math.max(0, Math.min(1, hud.playerXp / hud.playerXpNeed));

  return (
    <>
      <div className="hud-top-left glass-panel">
        <div className="portrait">
          <span>{hero.name.slice(-2)}</span>
        </div>
        <div className="hero-bars">
          <div className="hero-name-line">
            <strong>{hero.name}</strong>
            <span>Lv.{hud.playerLevel}</span>
          </div>
          <div className="bar hp-bar">
            <i style={{ width: `${hpRate * 100}%` }} />
            {hud.playerShield > 0 && <b style={{ width: `${Math.min(100, (hud.playerShield / hud.playerMaxHp) * 100)}%` }} />}
          </div>
          <div className="bar xp-bar">
            <i style={{ width: `${xpRate * 100}%` }} />
          </div>
          <span className="xp-text">经验 {Math.floor(hud.playerXp)}/{hud.playerXpNeed}</span>
        </div>
      </div>

      <div className="hud-score glass-panel">
        <span className="ally-score">{hud.allyKills}</span>
        <strong>{secondsToClock(hud.gameTime)}</strong>
        <span className="enemy-score">{hud.enemyKills}</span>
      </div>

      <div className="hud-top-right">
        <div className="minimap glass-panel">
          {[-16, 0, 16].map((lane) => (
            <i key={lane} className="minimap-lane" style={{ top: `${((lane + 30) / 60) * 100}%` }} />
          ))}
          {hud.minimapUnits.map((unit) => (
            <span
              key={unit.id}
              className={`map-dot ${unit.team} ${unit.kind} ${unit.isPlayer ? "player" : ""} ${unit.isBoss ? "boss" : ""} ${unit.alive ? "" : "dead"}`}
              style={{ left: `${((unit.x + 62) / 124) * 100}%`, top: `${((unit.z + 30) / 60) * 100}%` }}
              title={unit.name}
            />
          ))}
        </div>
        <button className="hud-icon-button" onClick={onPause} aria-label="暂停">
          {paused ? <Settings size={20} /> : <Pause size={20} />}
        </button>
      </div>

      <div className="announcement-stack">
        {hud.announcements.map((item) => (
          <div key={item.id} className={`announcement ${item.tone}`}>
            {item.text}
          </div>
        ))}
      </div>

      <div className="skill-dock glass-panel">
        <button className="basic-attack-button" aria-label="普通攻击">
          <Crosshair size={24} />
          <span>空格 普攻</span>
        </button>
        {hud.skills.map((skill) => {
          const rate = skill.maxCooldown > 0 ? skill.cooldown / skill.maxCooldown : 0;
          return (
            <button key={skill.key} className={`skill-button ${skill.ready ? "ready" : "cooling"}`} aria-label={`${skill.key} ${skill.name}`}>
              <SkillIcon icon={skill.icon} />
              <span className="skill-key">{skill.key}</span>
              <span className="skill-name">{skill.name}</span>
              {!skill.ready && (
                <>
                  <i className="cooldown-mask" style={{ height: `${Math.min(100, rate * 100)}%` }} />
                  <b className="cooldown-text">{formatCooldown(skill.cooldown)}</b>
                </>
              )}
            </button>
          );
        })}
        <div className="item-buttons">
          <button aria-label="恢复道具">
            <HeartPulse size={18} />
            <span>1</span>
          </button>
          <button aria-label="护盾道具">
            <Shield size={18} />
            <span>2</span>
          </button>
        </div>
      </div>

      <div className="hud-resource glass-panel">
        <Sword size={16} />
        <span>金币 {Math.round(hud.playerGold)}</span>
        <Volume2 size={16} />
      </div>

      {hud.lowHp && <div className="low-hp-vignette" />}
      {hud.respawnTimer > 0 && (
        <div className="death-overlay">
          <strong>守望者重构中</strong>
          <span>{Math.ceil(hud.respawnTimer)}</span>
        </div>
      )}

      {paused && (
        <div className="pause-panel glass-panel">
          <h2>暂停</h2>
          <p>按 Esc 或点击按钮继续战斗。</p>
          <button className="primary-action small" onClick={onPause}>
            继续
          </button>
        </div>
      )}

      {showScoreboard && (
        <div className="scoreboard glass-panel">
          <h2>战绩面板</h2>
          <div className="score-grid">
            <span>己方击杀</span>
            <strong>{hud.allyKills}</strong>
            <span>敌方击杀</span>
            <strong>{hud.enemyKills}</strong>
            <span>个人 K/D</span>
            <strong>
              {hud.playerKills}/{hud.playerDeaths}
            </strong>
            <span>等级与经验</span>
            <strong>
              Lv.{hud.playerLevel} · {Math.floor(hud.playerXp)}/{hud.playerXpNeed}
            </strong>
            <span>金币</span>
            <strong>{Math.round(hud.playerGold)}</strong>
          </div>
        </div>
      )}
    </>
  );
}
