import { Crosshair, Crown, HeartPulse, Pause, Settings, Shield, Sword, Timer, Volume2, Zap } from "lucide-react";
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

      {hud.buffs.length > 0 && (
        <div className="buff-rack glass-panel">
          {hud.buffs.map((buff) => (
            <span key={buff.id} className={`buff-chip ${buff.type}`} style={{ borderColor: buff.color }}>
              <Zap size={14} />
              <b>{buff.name}</b>
              <i>{Math.ceil(buff.remaining)}s</i>
            </span>
          ))}
        </div>
      )}

      <div className="hud-score glass-panel">
        <span className="ally-score">{hud.allyKills}</span>
        <strong>{secondsToClock(hud.gameTime)}</strong>
        <span className="enemy-score">{hud.enemyKills}</span>
      </div>

      <div className="boss-tracker glass-panel">
        {hud.bossStatus.map((boss) => {
          const rate = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
          return (
            <article key={boss.laneIndex} className={`boss-chip ${boss.alive ? "alive" : "respawning"}`} style={{ borderColor: boss.color }}>
              <div>
                <Crown size={14} />
                <strong>{boss.laneName}</strong>
                <span>{boss.alive ? boss.name.replace(`${boss.laneName}路`, "") : "刷新中"}</span>
              </div>
              {boss.alive ? (
                <i className="boss-hp">
                  <b style={{ width: `${rate * 100}%`, background: boss.color }} />
                </i>
              ) : (
                <small>
                  <Timer size={13} />
                  {Math.ceil(boss.respawn)}s
                </small>
              )}
            </article>
          );
        })}
      </div>

      <div className="hud-top-right">
        <div className="minimap glass-panel">
          {[-16, 0, 16].map((lane) => (
            <i key={lane} className="minimap-lane" style={{ top: `${((lane + 30) / 60) * 100}%` }} />
          ))}
          {hud.minimapUnits.filter((unit) => unit.visible).map((unit) => (
            <span
              key={unit.id}
              className={`map-dot ${unit.team} ${unit.kind} ${unit.isPlayer ? "player" : ""} ${unit.isBoss ? "boss" : ""} ${unit.alive ? "" : "dead"}`}
              style={{ left: `${((unit.x + 62) / 124) * 100}%`, top: `${((unit.z + 30) / 60) * 100}%` }}
              title={unit.name}
            />
          ))}
          {hud.bossStatus
            .filter((boss) => !boss.alive)
            .map((boss) => (
              <span
                key={`boss-respawn-${boss.laneIndex}`}
                className="map-dot neutral monster boss respawning"
                style={{ left: `${((boss.x + 62) / 124) * 100}%`, top: `${((boss.z + 30) / 60) * 100}%` }}
                title={`${boss.laneName} BOSS ${Math.ceil(boss.respawn)}s`}
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
            <button key={skill.key} className={`skill-button ${skill.ready ? "ready" : "cooling"} ${skill.equipped ? "equipped" : ""}`} aria-label={`${skill.key} ${skill.name}`}>
              <SkillIcon icon={skill.icon} />
              <span className="skill-key">{skill.key}</span>
              <span className="skill-name">{skill.name}</span>
              {skill.equipped && <em className="skill-badge">卡</em>}
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
            <span>BOSS</span>
            <strong>
              {hud.bossKills.ally}/{hud.bossKills.enemy}
            </strong>
          </div>
        </div>
      )}
    </>
  );
}
