import * as THREE from "three";

export type Team = "ally" | "enemy" | "neutral";
export type EntityKind = "hero" | "minion" | "tower" | "base" | "monster";
export type HeroId =
  | "lingxiao"
  | "liyue"
  | "zhongshan"
  | "yanque"
  | "moxuan"
  | "qingshuang"
  | "yunting"
  | "chenyao"
  | "suixu"
  | "baize"
  | "lanshu"
  | "yeguang"
  | "huanyin"
  | "xuanji"
  | "chixiao"
  | "wuxiang";
export type HeroArchetype = "warrior" | "mage" | "tank";
export type AbilityKey = "Q" | "W" | "E" | "R";
export type AbilityTargeting = "direction" | "point" | "self" | "area";
export type DamageType = "physical" | "magic" | "true";
export type BossBuffType = "power" | "haste" | "guard";
export type BossSkillType = "cleave" | "riftStep" | "bulwark";
export type BossModelVariant = "blade" | "storm" | "bulwark";
export type AiState =
  | "laning"
  | "following"
  | "searching"
  | "attacking"
  | "casting"
  | "retreating"
  | "defending"
  | "dead"
  | "returning";

export interface UnitStats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  regen: number;
}

export interface AbilityDefinition {
  key: AbilityKey;
  name: string;
  shortName: string;
  description: string;
  cooldown: number;
  range: number;
  radius: number;
  damage: number;
  damageType: DamageType;
  targeting: AbilityTargeting;
  icon: "blade" | "spin" | "guard" | "nova" | "orb" | "vines" | "blink" | "storm" | "charge" | "shield" | "quake" | "domain";
}

export interface HeroDefinition {
  id: HeroId;
  name: string;
  title: string;
  role: "战士" | "法师" | "坦克";
  archetype: HeroArchetype;
  difficulty: number;
  tagline: string;
  lore: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    metal: string;
  };
  stats: UnitStats;
  radar: {
    damage: number;
    durability: number;
    control: number;
    mobility: number;
    utility: number;
  };
  abilities: AbilityDefinition[];
}

export interface StatusEffect {
  id: string;
  type: "slow" | "stun" | "knockback" | "shield" | "damageReduction" | "speed" | "starBlade" | "domain";
  remaining: number;
  value: number;
  sourceId?: string;
  direction?: THREE.Vector3;
}

export interface GameUnit {
  id: string;
  kind: EntityKind;
  team: Team;
  name: string;
  heroId?: HeroId;
  object: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  spawn: THREE.Vector3;
  radius: number;
  stats: UnitStats;
  hp: number;
  shield: number;
  level: number;
  xp: number;
  gold: number;
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  attackTimer: number;
  abilityCooldowns: Record<AbilityKey, number>;
  statuses: StatusEffect[];
  alive: boolean;
  respawnTimer: number;
  targetId?: string;
  moveTarget?: THREE.Vector3;
  aiState?: AiState;
  laneOffset: number;
  laneIndex?: number;
  basicCombo: number;
  lastDamagedBy?: string;
  lastHitFrom?: THREE.Vector3;
  damageFlash: number;
  isPlayer?: boolean;
  isStructure?: boolean;
  isBoss?: boolean;
  bossBuff?: BossBuffType;
  bossSkill?: BossSkillType;
  bossTemplateId?: string;
  invulnerable?: boolean;
  barFill?: THREE.Mesh;
  shieldMesh?: THREE.Object3D;
  selectionRing?: THREE.Object3D;
}

export interface Projectile {
  id: string;
  object: THREE.Group;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  radius: number;
  range: number;
  traveled: number;
  team: Team;
  sourceId: string;
  damage: number;
  damageType: DamageType;
  hitRadius: number;
  pierce: boolean;
  onHit?: (target: GameUnit) => void;
}

export interface AreaEffect {
  id: string;
  object: THREE.Group;
  team: Team;
  sourceId: string;
  position: THREE.Vector3;
  radius: number;
  duration: number;
  remaining: number;
  tickEvery: number;
  tickTimer: number;
  damage: number;
  damageType: DamageType;
  slow?: number;
  stun?: number;
  allyReduction?: number;
}

export interface FloatingText {
  id: string;
  element: HTMLDivElement;
  worldPosition: THREE.Vector3;
  age: number;
  duration: number;
}

export interface Announcement {
  id: string;
  text: string;
  tone: "info" | "ally" | "enemy" | "victory" | "defeat";
  time: number;
}

export interface SkillSnapshot {
  key: AbilityKey;
  cooldown: number;
  maxCooldown: number;
  ready: boolean;
  name: string;
  icon: AbilityDefinition["icon"];
}

export interface HudSnapshot {
  playerHp: number;
  playerMaxHp: number;
  playerShield: number;
  playerLevel: number;
  playerXp: number;
  playerXpNeed: number;
  playerGold: number;
  playerKills: number;
  playerDeaths: number;
  allyKills: number;
  enemyKills: number;
  gameTime: number;
  lowHp: boolean;
  respawnTimer: number;
  skills: SkillSnapshot[];
  announcements: Announcement[];
  minimapUnits: Array<{
    id: string;
    team: Team;
    kind: EntityKind;
    name: string;
    x: number;
    z: number;
    alive: boolean;
    isPlayer?: boolean;
    isBoss?: boolean;
  }>;
}

export interface MatchResult {
  outcome: "victory" | "defeat";
  heroId: HeroId;
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  gold: number;
  duration: number;
  finishedAt: string;
}

export interface GameSettings {
  quality: "high" | "balanced" | "low";
  audio: boolean;
  cameraDistance: number;
  tuning: {
    skillDamageMultiplier: number;
    basicAttackMultiplier: number;
    cooldownMultiplier: number;
    healthMultiplier: number;
  };
}
