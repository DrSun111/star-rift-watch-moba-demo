import { Play, Settings, Ticket, Trophy, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { heroes } from "../data/heroes";
import { useAppStore } from "../app/store";
import { secondsToClock } from "../game/core/math";

export function HomeScreen() {
  const { setScreen, settings, updateSettings, records, mastery } = useAppStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const wins = records.filter((record) => record.outcome === "victory").length;
  const topMastery = Object.entries(mastery)
    .sort(([, a], [, b]) => (b?.games ?? 0) - (a?.games ?? 0))[0];
  const topHero = topMastery ? heroes.find((hero) => hero.id === topMastery[0]) : undefined;
  const topStats = topMastery?.[1];

  return (
    <main className="screen home-screen">
      <div className="stars-layer" />
      <section className="home-stage">
        <div className="brand-lockup">
          <span className="eyebrow">阿斯特拉裂隙作战档案</span>
          <h1>星域守望：裂隙之战</h1>
          <p>原创 3D MOBA Demo。选择守望者，争夺三路 BOSS 增益，摧毁敌方裂隙水晶。</p>
        </div>
        <div className="home-actions">
          <button className="primary-action" data-testid="home-start" onClick={() => setScreen("select")}>
            <Play size={20} />
            开始作战
          </button>
          <button className="glass-action" data-testid="home-gacha" onClick={() => setScreen("gacha")}>
            <Ticket size={19} />
            技能抽卡池
          </button>
          <button className="glass-action" onClick={() => setSettingsOpen(true)}>
            <Settings size={19} />
            设置
          </button>
        </div>
        <div className="home-panel-row">
          <article className="glass-panel compact-panel">
            <Trophy size={20} />
            <span>战绩</span>
            <strong>
              {wins} 胜 / {records.length} 局
            </strong>
          </article>
          <article className="glass-panel compact-panel">
            <span>当前英雄池</span>
            <strong>{heroes.length} 名原创守望者</strong>
          </article>
          <article className="glass-panel compact-panel">
            <span>最快胜场</span>
            <strong>
              {records.filter((record) => record.outcome === "victory").sort((a, b) => a.duration - b.duration)[0]
                ? secondsToClock(records.filter((record) => record.outcome === "victory").sort((a, b) => a.duration - b.duration)[0].duration)
                : "暂无"}
            </strong>
          </article>
          <article className="glass-panel compact-panel">
            <span>英雄熟练度</span>
            <strong>{topHero && topStats ? `${topHero.name} ${topStats.games}局 / ${Math.round((topStats.wins / Math.max(1, topStats.games)) * 100)}%` : "暂无"}</strong>
          </article>
        </div>
      </section>

      {settingsOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="设置">
          <div className="modal glass-panel settings-modal">
            <h2>设置</h2>
            <label className="setting-row">
              <span>画面质量</span>
              <select value={settings.quality} onChange={(event) => updateSettings({ quality: event.target.value as typeof settings.quality })}>
                <option value="high">精致</option>
                <option value="balanced">均衡</option>
                <option value="low">流畅</option>
              </select>
            </label>
            <label className="setting-row">
              <span>基础音效</span>
              <button className="icon-toggle" onClick={() => updateSettings({ audio: !settings.audio })}>
                {settings.audio ? <Volume2 size={20} /> : <VolumeX size={20} />}
                {settings.audio ? "开启" : "关闭"}
              </button>
            </label>
            <label className="setting-row">
              <span>战争迷雾</span>
              <input type="checkbox" checked={settings.fogOfWar} onChange={(event) => updateSettings({ fogOfWar: event.target.checked })} />
            </label>
            <label className="setting-row">
              <span>屏幕震动</span>
              <input type="checkbox" checked={settings.screenShake} onChange={(event) => updateSettings({ screenShake: event.target.checked })} />
            </label>
            <label className="setting-row">
              <span>伤害数字</span>
              <input type="checkbox" checked={settings.damageNumbers} onChange={(event) => updateSettings({ damageNumbers: event.target.checked })} />
            </label>
            <label className="setting-row">
              <span>娱乐模式英雄</span>
              <input type="checkbox" checked={settings.funMode} onChange={(event) => updateSettings({ funMode: event.target.checked })} />
            </label>
            <label className="setting-row">
              <span>默认镜头距离</span>
              <input
                type="range"
                min={16}
                max={30}
                value={settings.cameraDistance}
                onChange={(event) => updateSettings({ cameraDistance: Number(event.target.value) })}
              />
            </label>
            <button className="primary-action small" onClick={() => setSettingsOpen(false)}>
              完成
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
