import { lazy, Suspense } from "react";
import { useAppStore } from "./store";

const HomeScreen = lazy(() => import("../screens/HomeScreen").then((module) => ({ default: module.HomeScreen })));
const HeroSelectScreen = lazy(() => import("../screens/HeroSelectScreen").then((module) => ({ default: module.HeroSelectScreen })));
const GachaScreen = lazy(() => import("../screens/GachaScreen").then((module) => ({ default: module.GachaScreen })));
const BattleScreen = lazy(() => import("../screens/BattleScreen").then((module) => ({ default: module.BattleScreen })));
const ResultsScreen = lazy(() => import("../screens/ResultsScreen").then((module) => ({ default: module.ResultsScreen })));

export function App() {
  const screen = useAppStore((state) => state.screen);
  return (
    <Suspense fallback={<div className="screen-loading">星核装载中</div>}>
      {screen === "home" && <HomeScreen />}
      {screen === "select" && <HeroSelectScreen />}
      {screen === "gacha" && <GachaScreen />}
      {screen === "battle" && <BattleScreen />}
      {screen === "results" && <ResultsScreen />}
    </Suspense>
  );
}
