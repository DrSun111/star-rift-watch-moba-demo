import { create } from "zustand";
import { findGachaCard, getGachaCost } from "../data/gacha";
import { heroes } from "../data/heroes";
import type { GachaCard } from "../data/gacha";
import type { GameSettings, HeroDefinition, HudSnapshot, MatchResult } from "../game/core/types";
import { drawGachaCards } from "../utils/gacha";
import { addMasteryResult, addRecord, defaultGachaState, defaultSettings, loadGachaState, loadLastHero, loadMastery, loadRecords, loadSettings, saveGachaState, saveLastHero, saveSettings } from "../utils/storage";
import type { GachaSaveState, HeroMasteryState } from "../utils/storage";

type Screen = "home" | "select" | "battle" | "results" | "gacha";
const funHeroIds = new Set<HeroDefinition["id"]>(["wuxiang", "miaozong"]);

interface AppState {
  screen: Screen;
  selectedHeroId: HeroDefinition["id"];
  settings: GameSettings;
  records: MatchResult[];
  mastery: HeroMasteryState;
  gacha: GachaSaveState;
  lastGachaDraw: GachaCard[];
  lastResult?: MatchResult;
  hud?: HudSnapshot;
  battleSeed: number;
  paused: boolean;
  showScoreboard: boolean;
  setScreen: (screen: Screen) => void;
  selectHero: (heroId: HeroDefinition["id"]) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  setHud: (hud?: HudSnapshot) => void;
  startBattle: () => void;
  finishBattle: (result: MatchResult) => void;
  restartBattle: () => void;
  setPaused: (paused: boolean) => void;
  setScoreboard: (showScoreboard: boolean) => void;
  drawGacha: (count: number) => GachaCard[];
  equipSkillCard: (cardId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: "home",
  selectedHeroId: loadLastHero(heroes[0].id),
  settings: typeof localStorage === "undefined" ? defaultSettings : loadSettings(),
  records: typeof localStorage === "undefined" ? [] : loadRecords(),
  mastery: typeof localStorage === "undefined" ? {} : loadMastery(),
  gacha: typeof localStorage === "undefined" ? defaultGachaState : loadGachaState(),
  lastGachaDraw: [],
  battleSeed: Date.now(),
  paused: false,
  showScoreboard: false,
  setScreen: (screen) => set({ screen }),
  selectHero: (heroId) => {
    const safeHeroId = funHeroIds.has(heroId) && !get().settings.funMode ? heroes[0].id : heroId;
    saveLastHero(safeHeroId);
    set({ selectedHeroId: safeHeroId });
  },
  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    const selectedHeroId = !settings.funMode && funHeroIds.has(get().selectedHeroId) ? heroes[0].id : get().selectedHeroId;
    saveSettings(settings);
    if (selectedHeroId !== get().selectedHeroId) saveLastHero(selectedHeroId);
    set({ settings, selectedHeroId });
  },
  setHud: (hud) => set({ hud }),
  startBattle: () =>
    set({
      screen: "battle",
      selectedHeroId: funHeroIds.has(get().selectedHeroId) && !get().settings.funMode ? heroes[0].id : get().selectedHeroId,
      paused: false,
      showScoreboard: false,
      hud: undefined,
      battleSeed: Date.now()
    }),
  finishBattle: (result) => {
    const records = addRecord(result);
    const mastery = addMasteryResult(result);
    const current = get().gacha;
    const earnedGold = Math.max(0, Math.round(result.gold));
    const gacha: GachaSaveState = { ...current, equippedSkillCardIds: current.equippedSkillCardIds ?? {}, gold: current.gold + earnedGold };
    saveGachaState(gacha);
    set({ screen: "results", lastResult: result, records, mastery, gacha, paused: false, showScoreboard: false });
  },
  restartBattle: () =>
    set({
      screen: "select",
      paused: false,
      showScoreboard: false,
      hud: undefined,
      battleSeed: Date.now()
    }),
  setPaused: (paused) => set({ paused }),
  setScoreboard: (showScoreboard) => set({ showScoreboard }),
  drawGacha: (count) => {
    const current = get().gacha;
    const cost = getGachaCost(count);
    if (current.gold < cost) {
      set({ lastGachaDraw: [] });
      return [];
    }
    const results = drawGachaCards(count);
    const ownedCardIds = Array.from(new Set([...current.ownedCardIds, ...results.map((card) => card.id)]));
    const equippedSkillCardIds = { ...(current.equippedSkillCardIds ?? {}) };
    for (const card of results) {
      if (!equippedSkillCardIds[card.slot]) equippedSkillCardIds[card.slot] = card.id;
    }
    const next: GachaSaveState = {
      gold: current.gold - cost,
      ownedCardIds,
      history: [...results.map((card) => card.id), ...current.history].slice(0, 40),
      drawCount: current.drawCount + results.length,
      ultraPulled: current.ultraPulled || results.some((card) => card.rarity === "ultra"),
      equippedSkillCardIds
    };
    saveGachaState(next);
    set({ gacha: next, lastGachaDraw: results });
    return results;
  },
  equipSkillCard: (cardId) => {
    const card = findGachaCard(cardId);
    const current = get().gacha;
    if (!card || !current.ownedCardIds.includes(cardId)) return;
    const next: GachaSaveState = {
      ...current,
      equippedSkillCardIds: {
        ...(current.equippedSkillCardIds ?? {}),
        [card.slot]: card.id
      }
    };
    saveGachaState(next);
    set({ gacha: next });
  }
}));
