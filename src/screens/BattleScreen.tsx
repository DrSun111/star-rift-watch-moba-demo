import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../app/store";
import { buildEquippedAbilities } from "../data/gacha";
import { GameEngine } from "../game/core/GameEngine";
import { BattleHud } from "../ui/BattleHud";

export function BattleScreen() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [error, setError] = useState("");
  const {
    selectedHeroId,
    settings,
    hud,
    setHud,
    finishBattle,
    paused,
    setPaused,
    showScoreboard,
    setScoreboard,
    battleSeed,
    gacha
  } = useAppStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return undefined;
    setError("");
    let engine: GameEngine | null = null;
    try {
      engine = new GameEngine({
        canvas,
        overlay,
        heroId: selectedHeroId,
        settings,
        equippedAbilities: buildEquippedAbilities(gacha.equippedSkillCardIds ?? {}),
        onHud: setHud,
        onFinish: finishBattle,
        onPauseChange: setPaused,
        onScoreboardChange: setScoreboard
      });
      engineRef.current = engine;
      engine.start();
    } catch (reason) {
      console.error(reason);
      setError("当前浏览器无法启动 WebGL。请启用硬件加速，或换用支持 WebGL 的桌面浏览器。");
    }
    return () => {
      engine?.dispose();
      engineRef.current = null;
      setHud(undefined);
    };
  }, [battleSeed, finishBattle, gacha.equippedSkillCardIds, selectedHeroId, setHud, setPaused, setScoreboard, settings]);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  return (
    <main className="battle-screen">
      <canvas ref={canvasRef} className="game-canvas" />
      <div ref={overlayRef} className="battle-overlay">
        {error && <div className="webgl-error glass-panel">{error}</div>}
        {hud && (
          <BattleHud
            hud={hud}
            heroId={selectedHeroId}
            paused={paused}
            showScoreboard={showScoreboard}
            onPause={() => setPaused(!paused)}
          />
        )}
      </div>
    </main>
  );
}
