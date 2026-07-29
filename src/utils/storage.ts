import type { AbilityKey, GameSettings, HeroDefinition, MatchResult } from "../game/core/types";

const SETTINGS_KEY = "star-rift-settings";
const RECORDS_KEY = "star-rift-records";
const LAST_HERO_KEY = "star-rift-last-hero";
const GACHA_KEY = "star-rift-skill-gacha-v1";
const LEGACY_GACHA_KEY = "star-rift-gacha";
const validHeroIds = new Set([
  "lingxiao",
  "liyue",
  "zhongshan",
  "yanque",
  "moxuan",
  "qingshuang",
  "yunting",
  "chenyao",
  "suixu",
  "baize",
  "lanshu",
  "yeguang",
  "huanyin",
  "xuanji",
  "chixiao"
]);

export const defaultSettings: GameSettings = {
  quality: "high",
  audio: true,
  cameraDistance: 22,
  tuning: {
    skillDamageMultiplier: 100,
    basicAttackMultiplier: 1,
    cooldownMultiplier: 1,
    healthMultiplier: 1
  }
};

export interface GachaSaveState {
  gold: number;
  ownedCardIds: string[];
  history: string[];
  drawCount: number;
  ultraPulled: boolean;
  equippedSkillCardIds: Partial<Record<AbilityKey, string>>;
}

export const defaultGachaState: GachaSaveState = {
  gold: 0,
  ownedCardIds: [],
  history: [],
  drawCount: 0,
  ultraPulled: false,
  equippedSkillCardIds: {}
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const saved = JSON.parse(raw) as Partial<GameSettings>;
    return {
      ...defaultSettings,
      ...saved,
      tuning: {
        ...defaultSettings.tuning,
        ...saved.tuning
      }
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadRecords(): MatchResult[] {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) || "[]") as MatchResult[];
  } catch {
    return [];
  }
}

export function addRecord(record: MatchResult): MatchResult[] {
  const records = [record, ...loadRecords()].slice(0, 12);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  return records;
}

export function loadLastHero(fallback: HeroDefinition["id"]): HeroDefinition["id"] {
  const saved = localStorage.getItem(LAST_HERO_KEY);
  return saved && validHeroIds.has(saved) ? (saved as HeroDefinition["id"]) : fallback;
}

export function saveLastHero(heroId: HeroDefinition["id"]): void {
  localStorage.setItem(LAST_HERO_KEY, heroId);
}

export function loadGachaState(): GachaSaveState {
  try {
    localStorage.removeItem(LEGACY_GACHA_KEY);
    const raw = localStorage.getItem(GACHA_KEY);
    if (!raw) return defaultGachaState;
    const saved = JSON.parse(raw) as Partial<GachaSaveState>;
    const equippedSkillCardIds = saved.equippedSkillCardIds && typeof saved.equippedSkillCardIds === "object" ? saved.equippedSkillCardIds : {};
    return {
      gold: Math.max(0, Math.floor(saved.gold ?? defaultGachaState.gold)),
      ownedCardIds: Array.isArray(saved.ownedCardIds) ? saved.ownedCardIds.filter((id): id is string => typeof id === "string") : [],
      history: Array.isArray(saved.history) ? saved.history.filter((id): id is string => typeof id === "string").slice(0, 40) : [],
      drawCount: Math.max(0, Math.floor(saved.drawCount ?? 0)),
      ultraPulled: Boolean(saved.ultraPulled),
      equippedSkillCardIds
    };
  } catch {
    return defaultGachaState;
  }
}

export function saveGachaState(state: GachaSaveState): void {
  localStorage.setItem(GACHA_KEY, JSON.stringify(state));
}
