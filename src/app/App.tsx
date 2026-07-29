import { useAppStore } from "./store";
import { BattleScreen } from "../screens/BattleScreen";
import { GachaScreen } from "../screens/GachaScreen";
import { HeroSelectScreen } from "../screens/HeroSelectScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ResultsScreen } from "../screens/ResultsScreen";

export function App() {
  const screen = useAppStore((state) => state.screen);
  return (
    <>
      {screen === "home" && <HomeScreen />}
      {screen === "select" && <HeroSelectScreen />}
      {screen === "gacha" && <GachaScreen />}
      {screen === "battle" && <BattleScreen />}
      {screen === "results" && <ResultsScreen />}
    </>
  );
}
