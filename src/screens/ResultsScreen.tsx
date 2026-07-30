import { Home, RotateCcw, Trophy } from "lucide-react";
import { useAppStore } from "../app/store";
import { heroById } from "../data/heroes";
import { secondsToClock } from "../game/core/math";

export function ResultsScreen() {
  const { lastResult, restartBattle, setScreen } = useAppStore();
  if (!lastResult) return null;
  const hero = heroById[lastResult.heroId];
  const victory = lastResult.outcome === "victory";

  return (
    <main className={`screen result-screen ${victory ? "victory" : "defeat"}`}>
      <div className="stars-layer" />
      <section className="result-card glass-panel">
        <Trophy size={36} />
        <span className="eyebrow">{hero.name}</span>
        <h1>{victory ? "胜利" : "失败"}</h1>
        <p>{victory ? "敌方裂隙水晶已崩解，星核暂时稳定。" : "己方星核失守，守望者需要重新集结。"} 本局金币已进入技能卡池钱包。</p>
        <div className="result-stats">
          <span>
            击杀<strong>{lastResult.kills}</strong>
          </span>
          <span>
            阵亡<strong>{lastResult.deaths}</strong>
          </span>
          <span>
            伤害<strong>{lastResult.damageDealt}</strong>
          </span>
          <span>
            DPM<strong>{Math.round(lastResult.damagePerMinute ?? 0)}</strong>
          </span>
          <span>
            承伤<strong>{lastResult.damageTaken}</strong>
          </span>
          <span>
            伤害占比<strong>{Math.round((lastResult.damageShare ?? 0) * 100)}%</strong>
          </span>
          <span>
            BOSS<strong>{lastResult.bossKills ?? 0}</strong>
          </span>
          <span>
            入账金币<strong>{lastResult.gold}</strong>
          </span>
          <span>
            MVP<strong>{lastResult.mvp ?? hero.name}</strong>
          </span>
          <span>
            时长<strong>{secondsToClock(lastResult.duration)}</strong>
          </span>
        </div>
        <div className="result-actions">
          <button className="primary-action" onClick={restartBattle}>
            <RotateCcw size={19} />
            再来一局
          </button>
          <button className="glass-action" onClick={() => setScreen("home")}>
            <Home size={19} />
            返回首页
          </button>
        </div>
      </section>
    </main>
  );
}
