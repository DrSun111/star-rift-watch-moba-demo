import * as THREE from "three";
import { heroes, heroById } from "../../data/heroes";
import { updateEnemyHeroAi, updateMinionAi, AiContext } from "../ai/aiSystem";
import { castHeroAbility, createBasicProjectile, CastAim } from "../abilities/abilitySystem";
import { AudioManager } from "../audio/AudioManager";
import { applyDamage } from "../combat/damage";
import { EffectSystem } from "../effects/EffectSystem";
import { buildUnitFromHero, createBaseModel, createBossModel, createMinionModel, createTowerModel, animateHeroModel } from "../heroes/heroFactory";
import { BRUSH_ZONES, BrushZone, pointInBrush } from "../map/brushes";
import { createMap } from "../map/createMap";
import {
  AbilityDefinition,
  AbilityKey,
  Announcement,
  AreaEffect,
  BossBuffType,
  BossModelVariant,
  BossSkillType,
  GameSettings,
  GameUnit,
  HeroDefinition,
  HudSnapshot,
  MatchResult,
  Projectile,
  Team,
  UnitStats
} from "./types";
import {
  clamp,
  clampPointFromOrigin,
  clampWorld,
  damp,
  flatDirection,
  flatDistance,
  makeId,
  secondsToClock,
  teamSign,
  WORLD_MAX_X,
  WORLD_MIN_X
} from "./math";

interface EngineOptions {
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
  heroId: HeroDefinition["id"];
  settings: GameSettings;
  equippedAbilities?: Partial<Record<AbilityKey, AbilityDefinition>>;
  onHud: (hud: HudSnapshot) => void;
  onFinish: (result: MatchResult) => void;
  onPauseChange: (paused: boolean) => void;
  onScoreboardChange: (visible: boolean) => void;
}

interface TowerAggro {
  sourceId: string;
  timer: number;
}

const abilityKeys: AbilityKey[] = ["Q", "W", "E", "R"];
const xpNeed = (level: number) => 100 + Math.max(0, level - 1) * 40;
const teamColor: Record<Team, string> = {
  ally: "#5beeff",
  enemy: "#ff4778",
  neutral: "#f8d26b"
};
const laneZ = [-16, 0, 16];
const allyTowerX = [-36, -20];
const enemyTowerX = [36, 20];
const bossSpawnInterval = 30;
const bossLaneConfigs: Array<{ laneIndex: number; z: number; laneName: string }> = [
  { laneIndex: 0, z: -16, laneName: "北路" },
  { laneIndex: 1, z: 0, laneName: "中路" },
  { laneIndex: 2, z: 16, laneName: "南路" }
];
interface BossTemplate {
  id: string;
  title: string;
  buff: BossBuffType;
  skill: BossSkillType;
  model: BossModelVariant;
  color: string;
  stats: UnitStats;
}
const bossTemplates: BossTemplate[] = [
  {
    id: "ember-blade",
    title: "炎魄巨刃",
    buff: "power",
    skill: "cleave",
    model: "blade",
    color: "#ff8b56",
    stats: { maxHp: 2750, attack: 138, defense: 40, speed: 2.34, attackRange: 2.55, attackCooldown: 1.18, regen: 2.5 }
  },
  {
    id: "astral-storm",
    title: "流光星魇",
    buff: "haste",
    skill: "riftStep",
    model: "storm",
    color: "#f8d26b",
    stats: { maxHp: 2520, attack: 108, defense: 36, speed: 2.82, attackRange: 3.15, attackCooldown: 0.96, regen: 2.2 }
  },
  {
    id: "crystal-bulwark",
    title: "玄晶堡垒",
    buff: "guard",
    skill: "bulwark",
    model: "bulwark",
    color: "#5beeff",
    stats: { maxHp: 3250, attack: 116, defense: 58, speed: 2.12, attackRange: 2.35, attackCooldown: 1.34, regen: 3.2 }
  }
];
const bossBuffName: Record<BossBuffType, string> = {
  power: "星火强攻",
  haste: "流光疾行",
  guard: "玄晶守护"
};

export class GameEngine implements AiContext {
  time = 0;

  private readonly canvas: HTMLCanvasElement;
  private readonly overlay: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(48, 1, 0.1, 160);
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly pointerWorld = new THREE.Vector3();
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly units = new Map<string, GameUnit>();
  private readonly projectiles: Projectile[] = [];
  private readonly areas: AreaEffect[] = [];
  private readonly keys = new Set<string>();
  private readonly keyDownAt = new Map<string, number>();
  private readonly announcements: Announcement[] = [];
  private readonly portals: Array<{ id: string; object: THREE.Group; position: THREE.Vector3; target: THREE.Vector3; radius: number }> = [];
  private readonly portalCooldowns = new Map<string, number>();
  private readonly effects: EffectSystem;
  private readonly audio: AudioManager;
  private readonly heroId: HeroDefinition["id"];
  private readonly settings: GameSettings;
  private readonly equippedAbilities: Partial<Record<AbilityKey, AbilityDefinition>>;
  private readonly onHud: (hud: HudSnapshot) => void;
  private readonly onFinish: (result: MatchResult) => void;
  private readonly onPauseChange: (paused: boolean) => void;
  private readonly onScoreboardChange: (visible: boolean) => void;

  private raf = 0;
  private lastTime = performance.now();
  private player!: GameUnit;
  private enemyHero!: GameUnit;
  private paused = false;
  private finished = false;
  private gameTime = 0;
  private bossSpawnTimer = 0;
  private hudTimer = 0;
  private trailTimer = 0;
  private cameraDistance: number;
  private desiredCameraDistance: number;
  private cameraMode: 0 | 1 | 2 | 3 = 0;
  private aiming?: AbilityDefinition;
  private aimIndicator?: THREE.Group;
  private allyKills = 0;
  private enemyKills = 0;
  private towerAggro: Partial<Record<Team, TowerAggro>> = {};
  private rightMouseDown = false;

  constructor(options: EngineOptions) {
    this.canvas = options.canvas;
    this.overlay = options.overlay;
    this.heroId = options.heroId;
    this.settings = options.settings;
    this.equippedAbilities = options.equippedAbilities ?? {};
    this.onHud = options.onHud;
    this.onFinish = options.onFinish;
    this.onPauseChange = options.onPauseChange;
    this.onScoreboardChange = options.onScoreboardChange;
    this.cameraDistance = options.settings.cameraDistance;
    this.desiredCameraDistance = options.settings.cameraDistance;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: options.settings.quality !== "low",
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, options.settings.quality === "high" ? 1.75 : 1.2));
    this.renderer.shadowMap.enabled = options.settings.quality !== "low";
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.effects = new EffectSystem(this.scene, this.overlay, this.camera);
    this.audio = new AudioManager(options.settings.audio);
    this.setupScene();
    this.bindEvents();
  }

  start(): void {
    this.resize();
    this.lastTime = performance.now();
    this.announce("守望者已抵达战场", "ally");
    this.raf = requestAnimationFrame(this.loop);
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("contextmenu", this.preventContext);
    this.effects.dispose();
    this.audio.dispose();
    this.renderer.dispose();
    this.units.forEach((unit) => this.disposeObject(unit.object));
    this.projectiles.forEach((projectile) => this.disposeObject(projectile.object));
    this.areas.forEach((area) => this.disposeObject(area.object));
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.onPauseChange(paused);
  }

  getScoreboardUnits(): GameUnit[] {
    return Array.from(this.units.values()).filter((unit) => unit.kind === "hero");
  }

  private setupScene(): void {
    createMap(this.scene);

    const hemi = new THREE.HemisphereLight("#bcecff", "#172030", 1.45);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight("#fff0cf", 2.8);
    sun.position.set(-14, 26, 16);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -72;
    sun.shadow.camera.right = 72;
    sun.shadow.camera.top = 42;
    sun.shadow.camera.bottom = -42;
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight("#5ee9ff", 1.2);
    rim.position.set(16, 10, -12);
    this.scene.add(rim);

    this.spawnStructures();
    this.spawnPortals();
    this.spawnHeroes();
    this.spawnBosses();
  }

  private spawnStructures(): void {
    const towerStats: UnitStats = {
      maxHp: 1850,
      attack: 132,
      defense: 52,
      speed: 0,
      attackRange: 8.8,
      attackCooldown: 1.35,
      regen: 0
    };
    const baseStats: UnitStats = {
      maxHp: 3600,
      attack: 0,
      defense: 38,
      speed: 0,
      attackRange: 0,
      attackCooldown: 1,
      regen: 0
    };
    const addStructure = (kind: "tower" | "base", team: Team, name: string, position: THREE.Vector3, stats: UnitStats, laneIndex?: number) => {
      this.addUnit({
        kind,
        team,
        name,
        object: kind === "tower" ? createTowerModel(team) : createBaseModel(team),
        position,
        velocity: new THREE.Vector3(),
        spawn: position.clone(),
        radius: kind === "tower" ? 1.25 : 2.4,
        stats: { ...stats },
        hp: stats.maxHp,
        shield: 0,
        level: 1,
        xp: 0,
        gold: 0,
        kills: 0,
        deaths: 0,
        damageDealt: 0,
        damageTaken: 0,
        attackTimer: 0,
        abilityCooldowns: { Q: 0, W: 0, E: 0, R: 0 },
        statuses: [],
        alive: true,
        respawnTimer: 0,
        laneOffset: laneIndex == null ? 0 : laneZ[laneIndex],
        laneIndex,
        basicCombo: 0,
        damageFlash: 0,
        isStructure: true
      });
    };

    laneZ.forEach((z, laneIndex) => {
      const laneName = ["北路", "中路", "南路"][laneIndex];
      allyTowerX.forEach((x, order) => addStructure("tower", "ally", `己方${laneName}星穹塔-${order + 1}`, new THREE.Vector3(x, 0, z), towerStats, laneIndex));
      enemyTowerX.forEach((x, order) => addStructure("tower", "enemy", `敌方${laneName}赤曜塔-${order + 1}`, new THREE.Vector3(x, 0, z), towerStats, laneIndex));
    });
    addStructure("base", "ally", "己方星核水晶", new THREE.Vector3(-54, 0, 0), baseStats);
    addStructure("base", "enemy", "敌方裂隙水晶", new THREE.Vector3(54, 0, 0), baseStats);
  }

  private spawnPortals(): void {
    const pairs = [
      { position: new THREE.Vector3(-18, 0, -24), target: new THREE.Vector3(18, 0, 24), color: "#62f1ff" },
      { position: new THREE.Vector3(18, 0, 24), target: new THREE.Vector3(-18, 0, -24), color: "#ff5f91" }
    ];
    for (const portal of pairs) {
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.35, 1.65, 0.18, 32),
        new THREE.MeshStandardMaterial({ color: "#263448", emissive: portal.color, emissiveIntensity: 0.16, roughness: 0.42, metalness: 0.5 })
      );
      base.position.y = 0.09;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.35, 0.065, 12, 64),
        new THREE.MeshBasicMaterial({ color: portal.color, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.18;
      const core = new THREE.Mesh(
        new THREE.CircleGeometry(1.2, 48),
        new THREE.MeshBasicMaterial({ color: portal.color, transparent: true, opacity: 0.24, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
      );
      core.rotation.x = -Math.PI / 2;
      core.position.y = 0.2;
      group.add(base, ring, core);
      group.position.copy(portal.position);
      this.scene.add(group);
      this.portals.push({ id: makeId("portal"), object: group, position: portal.position, target: portal.target, radius: 1.6 });
    }
  }

  private spawnHeroes(): void {
    const selected = heroes.find((hero) => hero.id === this.heroId) ?? heroes[0];
    const remaining = heroes.filter((hero) => hero.id !== selected.id && hero.id !== "wuxiang");
    const allyRoster = [selected, ...remaining.slice(0, 4)];
    const enemyRoster = remaining.slice(4, 9);
    const heroLanePattern = [1, 0, 2, 0, 2];
    const sideOffsets = [0, -1.65, 1.65, 1.65, -1.65];

    allyRoster.forEach((hero, index) => {
      const laneIndex = heroLanePattern[index] ?? 1;
      const spawn = new THREE.Vector3(-49 - Math.floor(index / 2) * 0.6, 0, laneZ[laneIndex] + (sideOffsets[index] ?? 0));
      const unit = this.addUnit({
        ...buildUnitFromHero(hero.id, "ally", index === 0, spawn),
        aiState: index === 0 ? undefined : "laning",
        laneOffset: laneZ[laneIndex],
        laneIndex
      });
      unit.object.rotation.y = Math.PI / 2;
      if (index === 0) {
        this.player = unit;
        this.applyPlayerTuning(this.player);
      }
    });

    enemyRoster.forEach((hero, index) => {
      const laneIndex = heroLanePattern[index] ?? 1;
      const spawn = new THREE.Vector3(49 + Math.floor(index / 2) * 0.6, 0, laneZ[laneIndex] - (sideOffsets[index] ?? 0));
      const unit = this.addUnit({
        ...buildUnitFromHero(hero.id, "enemy", false, spawn),
        aiState: "laning",
        laneOffset: laneZ[laneIndex],
        laneIndex
      });
      unit.object.rotation.y = -Math.PI / 2;
      if (index === 0) this.enemyHero = unit;
    });
  }

  private addUnit(unitWithoutId: Omit<GameUnit, "id">): GameUnit {
    const unit: GameUnit = { ...unitWithoutId, id: makeId(unitWithoutId.kind) };
    unit.object.position.copy(unit.position);
    this.addHealthBar(unit);
    this.scene.add(unit.object);
    this.units.set(unit.id, unit);
    return unit;
  }

  private addHealthBar(unit: GameUnit): void {
    const width = unit.kind === "base" ? 2.6 : unit.kind === "tower" ? 2.1 : unit.kind === "hero" ? 1.55 : unit.isBoss ? 2.85 : unit.kind === "monster" ? 1.15 : 0.8;
    const y = unit.kind === "base" ? 4.05 : unit.kind === "tower" ? 4.65 : unit.kind === "hero" ? 3.05 : unit.isBoss ? 5.35 : unit.kind === "monster" ? 2.35 : 1.72;
    const group = new THREE.Group();
    group.position.set(0, y, 0);
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 0.12),
      new THREE.MeshBasicMaterial({ color: "#09101b", transparent: true, opacity: 0.82, depthWrite: false })
    );
    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.94, 0.065),
      new THREE.MeshBasicMaterial({ color: teamColor[unit.team], transparent: true, opacity: 0.95, depthWrite: false })
    );
    fill.position.set(0, 0, 0.01);
    group.add(bg, fill);
    unit.object.add(group);
    unit.barFill = fill;
  }

  private spawnWave(): void {
    for (const team of ["ally", "enemy"] as Team[]) {
      laneZ.forEach((lane, laneIndex) => {
        for (let i = 0; i < 4; i += 1) {
          const stats: UnitStats = {
            maxHp: i === 0 ? 380 : 285,
            attack: i === 0 ? 36 : 28,
            defense: 16,
            speed: i === 0 ? 2.75 : 3.05,
            attackRange: i === 3 ? 5.4 : 1.6,
            attackCooldown: i === 3 ? 1.25 : 1.05,
            regen: 0
          };
          const laneOffset = lane + (i - 1.5) * 0.45 + (team === "ally" ? -0.25 : 0.25);
          this.addUnit({
            kind: "minion",
            team,
            name: team === "ally" ? "星穹守卫" : "裂隙掠兵",
            object: createMinionModel(team),
            position: new THREE.Vector3(team === "ally" ? -48.5 - i * 0.38 : 48.5 + i * 0.38, 0, laneOffset),
            velocity: new THREE.Vector3(),
            spawn: new THREE.Vector3(team === "ally" ? -48.5 : 48.5, 0, laneOffset),
            radius: 0.45,
            stats,
            hp: stats.maxHp,
            shield: 0,
            level: 1,
            xp: 0,
            gold: 18,
            kills: 0,
            deaths: 0,
            damageDealt: 0,
            damageTaken: 0,
            attackTimer: Math.random() * 0.5,
            abilityCooldowns: { Q: 0, W: 0, E: 0, R: 0 },
            statuses: [],
            alive: true,
            respawnTimer: 0,
            laneOffset: lane,
            laneIndex,
            basicCombo: 0,
            damageFlash: 0,
            aiState: "laning"
          });
        }
      });
    }
    this.announce("新一波小兵已进入战线", "info");
  }

  private spawnBosses(): void {
    const templates = this.shuffledBossTemplates();
    bossLaneConfigs.forEach((config, index) => this.spawnLaneBoss(config, templates[index % templates.length]));
    this.announce("三路随机裂隙首领已进入战场，击败可获得对应增益", "info");
  }

  private refreshMissingBosses(): number {
    let spawned = 0;
    const reservedTemplates = new Set(
      Array.from(this.units.values())
        .filter((unit) => unit.isBoss && unit.alive && unit.bossTemplateId)
        .map((unit) => unit.bossTemplateId as string)
    );
    for (const config of bossLaneConfigs) {
      const bossAlive = Array.from(this.units.values()).some((unit) => unit.isBoss && unit.alive && unit.laneIndex === config.laneIndex);
      if (!bossAlive) {
        const template = this.pickBossTemplate(reservedTemplates);
        reservedTemplates.add(template.id);
        this.spawnLaneBoss(config, template);
        spawned += 1;
      }
    }
    if (spawned > 0) this.announce(`裂隙首领刷新：${spawned} 条路线重新出现随机 BOSS`, "info");
    return spawned;
  }

  private shuffledBossTemplates(): BossTemplate[] {
    return [...bossTemplates].sort(() => Math.random() - 0.5);
  }

  private pickBossTemplate(reserved: Set<string>): BossTemplate {
    const pool = bossTemplates.filter((template) => !reserved.has(template.id));
    const candidates = pool.length > 0 ? pool : bossTemplates;
    return candidates[Math.floor(Math.random() * candidates.length)] ?? bossTemplates[0];
  }

  private spawnLaneBoss(config: (typeof bossLaneConfigs)[number], template: BossTemplate): GameUnit {
    const position = new THREE.Vector3(0, 0, config.z);
    const stats: UnitStats = { ...template.stats };
    const object = createBossModel(template.model, template.color);
    const aura = new THREE.Mesh(
      new THREE.TorusGeometry(2.65, 0.055, 12, 84),
      new THREE.MeshBasicMaterial({ color: template.color, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    aura.rotation.x = Math.PI / 2;
    aura.position.y = 0.12;
    object.add(aura);

    const boss = this.addUnit({
      kind: "monster",
      team: "neutral",
      name: `${config.laneName}·${template.title}`,
      object,
      position,
      velocity: new THREE.Vector3(),
      spawn: position.clone(),
      radius: 2.05,
      stats,
      hp: stats.maxHp,
      shield: 0,
      level: 1,
      xp: 0,
      gold: 240,
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      damageTaken: 0,
      attackTimer: Math.random() * 0.5,
      abilityCooldowns: { Q: 3, W: 0, E: 0, R: 0 },
      statuses: [],
      alive: true,
      respawnTimer: 0,
      laneOffset: config.z,
      laneIndex: config.laneIndex,
      basicCombo: 0,
      damageFlash: 0,
      isBoss: true,
      bossBuff: template.buff,
      bossSkill: template.skill,
      bossTemplateId: template.id
    });
    this.effects.ring(position, 5.2, template.color, 0.75);
    return boss;
  }

  private spawnBoss(): void {
    this.refreshMissingBosses();
  }

  private bindEvents(): void {
    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    this.canvas.addEventListener("contextmenu", this.preventContext);
  }

  private loop = (now: number): void => {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000 || 0);
    this.lastTime = now;
    if (!this.paused && !this.finished) this.update(dt);
    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.time += dt;
    this.gameTime += dt;
    this.bossSpawnTimer += dt;
    this.hudTimer += dt;
    this.trailTimer += dt;

    if (this.bossSpawnTimer >= bossSpawnInterval) {
      this.bossSpawnTimer = 0;
      this.refreshMissingBosses();
    }

    this.updateTowerAggro(dt);
    this.updateStatuses(dt);
    this.updatePlayer(dt);
    this.updateAi(dt);
    this.updateBosses(dt);
    this.updateTowers(dt);
    this.updatePortals(dt);
    this.updateProjectiles(dt);
    this.updateAreas(dt);
    this.cleanupMinions();
    this.updateVisuals(dt);
    this.effects.update(dt);
    this.updateAnnouncements(dt);
    this.checkWinLoss();

    if (this.hudTimer >= 0.08) {
      this.hudTimer = 0;
      this.emitHud();
    }
  }

  private updatePlayer(dt: number): void {
    if (!this.player.alive) return;
    if (this.player.statuses.some((status) => status.type === "stun")) return;

    const move = new THREE.Vector3();
    if (this.keys.has("KeyW")) move.z -= 1;
    if (this.keys.has("KeyS")) move.z += 1;
    if (this.keys.has("KeyA")) move.x -= 1;
    if (this.keys.has("KeyD")) move.x += 1;

    if (move.lengthSq() > 0) {
      this.player.moveTarget = undefined;
      this.moveAlong(this.player, move.normalize(), dt);
      return;
    }

    if (this.player.moveTarget) {
      const distance = flatDistance(this.player.position, this.player.moveTarget);
      if (distance < 0.25) {
        this.player.moveTarget = undefined;
      } else {
        this.moveAlong(this.player, flatDirection(this.player.position, this.player.moveTarget), dt);
      }
    }

    const target = this.getUnit(this.player.targetId);
    if (target?.alive) this.tryBasicAttack(this.player, target);
  }

  private updateAi(dt: number): void {
    for (const unit of this.units.values()) {
      if (unit.isPlayer || unit.kind === "tower" || unit.kind === "base") continue;
      if (unit.kind === "hero") updateEnemyHeroAi(this, unit, dt);
      if (unit.kind === "minion") updateMinionAi(this, unit, dt);
    }
  }

  private updateTowers(dt: number): void {
    for (const tower of this.units.values()) {
      if (tower.kind !== "tower" || !tower.alive) continue;
      tower.attackTimer = Math.max(0, tower.attackTimer - dt);
      const target = this.pickTowerTarget(tower);
      if (target) this.tryTowerAttack(tower, target);
    }
  }

  private updatePortals(dt: number): void {
    for (const [id, remaining] of Array.from(this.portalCooldowns.entries())) {
      const next = remaining - dt;
      if (next <= 0) this.portalCooldowns.delete(id);
      else this.portalCooldowns.set(id, next);
    }

    for (const portal of this.portals) {
      portal.object.rotation.y += dt * 0.9;
      const ring = portal.object.children[1];
      if (ring) ring.scale.setScalar(1 + Math.sin(this.time * 4) * 0.06);
      for (const unit of this.units.values()) {
        if (!unit.alive || unit.isStructure || unit.kind === "minion") continue;
        if (this.portalCooldowns.has(unit.id)) continue;
        if (flatDistance(unit.position, portal.position) > portal.radius + unit.radius) continue;
        unit.position.copy(portal.target).add(new THREE.Vector3(unit.team === "ally" ? -1.4 : 1.4, 0, 0));
        clampWorld(unit.position);
        unit.object.position.copy(unit.position);
        unit.moveTarget = undefined;
        this.portalCooldowns.set(unit.id, 5);
        this.effects.ring(unit.position, 2.4, teamColor[unit.team], 0.55);
        this.effects.burst(unit.position.clone().add(new THREE.Vector3(0, 1.2, 0)), unit.team, 18, 1);
        if (unit.isPlayer) this.announce("传送门已激活", "ally");
      }
    }
  }

  private updateTowerAggro(dt: number): void {
    for (const team of ["ally", "enemy"] as Team[]) {
      const aggro = this.towerAggro[team];
      if (!aggro) continue;
      aggro.timer -= dt;
      if (aggro.timer <= 0) delete this.towerAggro[team];
    }
  }

  private updateStatuses(dt: number): void {
    for (const unit of this.units.values()) {
      if (!unit.alive) {
        if (unit.kind === "hero" && unit.respawnTimer > 0) {
          unit.respawnTimer -= dt;
          if (unit.respawnTimer <= 0) this.respawnHero(unit);
        } else if (unit.kind === "monster") {
          unit.respawnTimer -= dt;
        } else if (unit.kind === "minion") {
          unit.respawnTimer -= dt;
        }
        continue;
      }

      if (unit.alive && unit.stats.regen > 0 && unit.hp > 0) {
        unit.hp = Math.min(unit.stats.maxHp, unit.hp + unit.stats.regen * dt);
      }

      unit.attackTimer = Math.max(0, unit.attackTimer - dt);
      for (const key of abilityKeys) unit.abilityCooldowns[key] = Math.max(0, unit.abilityCooldowns[key] - dt);

      for (let i = unit.statuses.length - 1; i >= 0; i -= 1) {
        const status = unit.statuses[i];
        status.remaining -= dt;
        if (status.type === "knockback" && status.direction && unit.alive) {
          unit.position.addScaledVector(status.direction, status.value * dt);
          clampWorld(unit.position);
        }
        if (status.remaining <= 0) {
          if (status.type === "shield") unit.shield = Math.max(0, unit.shield - status.value);
          unit.statuses.splice(i, 1);
        }
      }
    }
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i];
      const travel = projectile.speed * dt;
      projectile.position.addScaledVector(projectile.direction, travel);
      projectile.traveled += travel;
      projectile.object.position.copy(projectile.position);
      projectile.object.rotation.y = Math.atan2(projectile.direction.x, projectile.direction.z);
      projectile.object.rotation.z += dt * 5;
      const source = this.getUnit(projectile.sourceId);
      const enemies = source ? this.getEnemies(source) : Array.from(this.units.values()).filter((unit) => unit.team !== projectile.team);
      let remove = projectile.traveled >= projectile.range;
      for (const target of enemies) {
        if (!target.alive || flatDistance(projectile.position, target.position) > projectile.hitRadius + target.radius) continue;
        if (source) this.damage(source, target, projectile.damage, projectile.damageType, projectile.position);
        projectile.onHit?.(target);
        this.effects.burst(projectile.position, projectile.team, 8, 0.7);
        remove = !projectile.pierce;
        if (remove) break;
      }
      if (remove) {
        this.scene.remove(projectile.object);
        this.disposeObject(projectile.object);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateAreas(dt: number): void {
    for (let i = this.areas.length - 1; i >= 0; i -= 1) {
      const area = this.areas[i];
      area.remaining -= dt;
      area.tickTimer -= dt;
      area.object.rotation.y += dt * 0.35;
      const source = this.getUnit(area.sourceId);
      if (area.tickTimer <= 0) {
        area.tickTimer = area.tickEvery;
        if (source) {
          for (const target of this.getEnemies(source)) {
            if (!target.alive || flatDistance(target.position, area.position) > area.radius + target.radius) continue;
            if (area.damage > 0) this.damage(source, target, area.damage, area.damageType, area.position);
            if (area.slow) this.addStatus(target, { type: "slow", remaining: area.tickEvery + 0.2, value: area.slow, sourceId: area.sourceId });
            if (area.stun) this.addStatus(target, { type: "stun", remaining: area.stun, value: 1, sourceId: area.sourceId });
          }
          if (area.allyReduction) {
            for (const ally of this.getAllies(source)) {
              if (ally.alive && flatDistance(ally.position, area.position) <= area.radius + ally.radius) {
                this.addStatus(ally, { type: "domain", remaining: area.tickEvery + 0.15, value: area.allyReduction, sourceId: area.sourceId });
              }
            }
          }
        }
      }
      const opacity = Math.max(0, area.remaining / area.duration);
      area.object.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material && "opacity" in child.material) {
          child.material.opacity = Math.min(child.material.opacity, opacity * 0.62);
        }
      });
      if (area.remaining <= 0) {
        this.scene.remove(area.object);
        this.disposeObject(area.object);
        this.areas.splice(i, 1);
      }
    }
  }

  private cleanupMinions(): void {
    for (const unit of Array.from(this.units.values())) {
      if ((unit.kind === "minion" || unit.kind === "monster") && !unit.alive && unit.respawnTimer <= -1) {
        this.scene.remove(unit.object);
        this.disposeObject(unit.object);
        this.units.delete(unit.id);
      }
    }
  }

  private updateBosses(dt: number): void {
    for (const unit of this.units.values()) {
      if (unit.kind !== "monster" || !unit.isBoss || !unit.alive) continue;
      unit.attackTimer = Math.max(0, unit.attackTimer - dt);
      const heroesInArena = Array.from(this.units.values())
        .filter((candidate) => candidate.kind === "hero" && candidate.alive && flatDistance(candidate.position, unit.spawn) <= 18)
        .sort((a, b) => flatDistance(unit.position, a.position) - flatDistance(unit.position, b.position));
      const target = heroesInArena[0];
      const distanceToCamp = flatDistance(unit.position, unit.spawn);
      if (target) {
        const distance = flatDistance(unit.position, target.position);
        unit.targetId = target.id;
        if (unit.abilityCooldowns.Q <= 0 && distance < 7.4) this.castBossSkill(unit, target, heroesInArena);
        if (distance > unit.stats.attackRange + target.radius) {
          this.moveAlong(unit, flatDirection(unit.position, target.position), dt);
        } else {
          this.tryBasicAttack(unit, target);
        }
      } else if (distanceToCamp > 0.35) {
        unit.targetId = undefined;
        this.moveAlong(unit, flatDirection(unit.position, unit.spawn), dt);
      } else {
        unit.velocity.set(0, 0, 0);
      }
    }
  }

  private getBossColor(unit: GameUnit): string {
    return bossTemplates.find((template) => template.id === unit.bossTemplateId)?.color ?? teamColor.neutral;
  }

  private castBossSkill(boss: GameUnit, target: GameUnit, heroesInArena: GameUnit[]): void {
    const color = this.getBossColor(boss);
    if (boss.bossSkill === "cleave") {
      boss.abilityCooldowns.Q = 5.4;
      const direction = flatDirection(boss.position, target.position);
      this.ring(boss.position, 4.7, color, 0.5);
      for (const victim of heroesInArena) {
        if (flatDistance(boss.position, victim.position) <= 5.2 + victim.radius) {
          this.damage(boss, victim, boss.stats.attack * 0.86, "physical", boss.position);
          this.addStatus(victim, { type: "knockback", remaining: 0.32, value: 6.2, direction, sourceId: boss.id });
        }
      }
      return;
    }

    if (boss.bossSkill === "riftStep") {
      boss.abilityCooldowns.Q = 4.3;
      const from = boss.position.clone();
      const direction = flatDirection(boss.position, target.position);
      boss.position.copy(clampWorld(target.position.clone().addScaledVector(direction, -2.4)));
      boss.object.position.copy(boss.position);
      this.trail(from, "neutral");
      this.trail(boss.position, "neutral");
      this.ring(boss.position, 4.2, color, 0.48);
      for (const victim of heroesInArena) {
        if (flatDistance(boss.position, victim.position) <= 4.4 + victim.radius) {
          this.damage(boss, victim, boss.stats.attack * 0.68, "magic", boss.position);
          this.addStatus(victim, { type: "slow", remaining: 1.6, value: 0.34, sourceId: boss.id });
        }
      }
      return;
    }

    boss.abilityCooldowns.Q = 6.3;
    const shield = 420;
    boss.shield = Math.max(boss.shield, shield);
    this.addStatus(boss, { type: "shield", remaining: 4.2, value: shield, sourceId: boss.id });
    this.addStatus(boss, { type: "damageReduction", remaining: 3.6, value: 0.28, sourceId: boss.id });
    this.ring(boss.position, 5.8, color, 0.58);
    for (const victim of heroesInArena) {
      if (flatDistance(boss.position, victim.position) <= 5.9 + victim.radius) {
        this.damage(boss, victim, boss.stats.attack * 0.54, "magic", boss.position);
        this.addStatus(victim, { type: "stun", remaining: 0.62, value: 1, sourceId: boss.id });
      }
    }
  }

  private updateVisuals(dt: number): void {
    for (const unit of this.units.values()) {
      unit.object.visible = (unit.alive || unit.kind === "hero") && !this.isHiddenByBrush(unit);
      if (unit.alive) {
        unit.object.position.copy(unit.position);
        if (unit.kind === "hero") animateHeroModel(unit.object, this.time, unit.velocity.length() > 0.1 ? 1.3 : 0.85);
        if (unit.kind === "monster") {
          unit.object.position.y = Math.sin(this.time * 2.8 + unit.spawn.x) * (unit.isBoss ? 0.045 : 0.08);
          unit.object.rotation.y += dt * (unit.isBoss ? 0.22 : 0.65);
        }
      }

      if (unit.barFill) {
        const rate = clamp(unit.hp / unit.stats.maxHp, 0, 1);
        unit.barFill.scale.x = Math.max(0.001, rate);
        unit.barFill.position.x = -(1 - rate) * ((unit.barFill.geometry as THREE.PlaneGeometry).parameters.width || 1) * 0.5;
        unit.barFill.parent?.lookAt(this.camera.position);
      }

      if (unit.damageFlash > 0) {
        unit.damageFlash -= dt;
        unit.object.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissiveIntensity = Math.max(child.material.emissiveIntensity, 0.7);
          }
        });
      }

      this.updateShieldVisual(unit);
    }
  }

  private updateShieldVisual(unit: GameUnit): void {
    if (!unit.alive || unit.shield <= 1) {
      if (unit.shieldMesh) {
        unit.object.remove(unit.shieldMesh);
        this.disposeObject(unit.shieldMesh);
        unit.shieldMesh = undefined;
      }
      return;
    }
    if (!unit.shieldMesh) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(unit.kind === "hero" ? 1.15 : 0.72, 24, 12),
        new THREE.MeshBasicMaterial({
          color: teamColor[unit.team],
          transparent: true,
          opacity: 0.18,
          wireframe: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      mesh.position.y = unit.kind === "hero" ? 1.35 : 0.9;
      unit.object.add(mesh);
      unit.shieldMesh = mesh;
    }
    unit.shieldMesh.rotation.y += 0.025;
  }

  private findBrushZone(position: THREE.Vector3): BrushZone | undefined {
    return BRUSH_ZONES.find((zone) => pointInBrush(position.x, position.z, zone));
  }

  private isHiddenByBrush(unit: GameUnit): boolean {
    if (!this.player || unit.team !== "enemy" || !unit.alive || (unit.kind !== "hero" && unit.kind !== "minion")) return false;
    const unitBrush = this.findBrushZone(unit.position);
    if (!unitBrush) return false;
    const playerBrush = this.findBrushZone(this.player.position);
    if (playerBrush?.id === unitBrush.id) return false;
    return flatDistance(this.player.position, unit.position) > 6.6;
  }

  private updateCamera(dt: number): void {
    if (!this.player) return;
    this.cameraDistance += (this.desiredCameraDistance - this.cameraDistance) * Math.min(1, dt * 8);
    const lookAt = this.player.position.clone().add(new THREE.Vector3(0, 0.8, 0));
    const forward = new THREE.Vector3(Math.sin(this.player.object.rotation.y), 0, Math.cos(this.player.object.rotation.y));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const offset =
      this.cameraMode === 0
        ? new THREE.Vector3(0, this.cameraDistance * 0.72, this.cameraDistance * 0.68)
        : this.cameraMode === 1
          ? forward.clone().multiplyScalar(-this.cameraDistance * 0.76).add(new THREE.Vector3(0, this.cameraDistance * 0.42, 0))
          : this.cameraMode === 2
            ? new THREE.Vector3(0, this.cameraDistance * 1.14, this.cameraDistance * 0.12)
            : forward
                .clone()
                .multiplyScalar(-this.cameraDistance * 0.58)
                .add(right.multiplyScalar(this.cameraDistance * 0.24))
                .add(new THREE.Vector3(0, this.cameraDistance * 0.34, 0));
    const targetPosition = lookAt.clone().add(offset);
    damp(this.camera.position, targetPosition, 6, dt);
    this.camera.lookAt(lookAt);
  }

  private snapCamera(): void {
    const lookAt = this.player.position.clone().add(new THREE.Vector3(0, 0.8, 0));
    const forward = new THREE.Vector3(Math.sin(this.player.object.rotation.y), 0, Math.cos(this.player.object.rotation.y));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const offset =
      this.cameraMode === 0
        ? new THREE.Vector3(0, this.cameraDistance * 0.72, this.cameraDistance * 0.68)
        : this.cameraMode === 1
          ? forward.clone().multiplyScalar(-this.cameraDistance * 0.76).add(new THREE.Vector3(0, this.cameraDistance * 0.42, 0))
          : this.cameraMode === 2
            ? new THREE.Vector3(0, this.cameraDistance * 1.14, this.cameraDistance * 0.12)
            : forward
                .clone()
                .multiplyScalar(-this.cameraDistance * 0.58)
                .add(right.multiplyScalar(this.cameraDistance * 0.24))
                .add(new THREE.Vector3(0, this.cameraDistance * 0.34, 0));
    this.camera.position.copy(lookAt.clone().add(offset));
    this.camera.lookAt(lookAt);
  }

  private cycleCameraMode(): void {
    this.cameraMode = (((this.cameraMode + 1) % 4) as 0 | 1 | 2 | 3);
    this.camera.fov = this.cameraMode === 1 ? 58 : this.cameraMode === 2 ? 42 : this.cameraMode === 3 ? 64 : 48;
    this.camera.updateProjectionMatrix();
    this.snapCamera();
    this.announce(["斜俯视角", "近景追随视角", "战术高空视角", "自由3D视角"][this.cameraMode], "info");
  }

  private updateAnnouncements(dt: number): void {
    for (let i = this.announcements.length - 1; i >= 0; i -= 1) {
      this.announcements[i].time -= dt;
      if (this.announcements[i].time <= 0) this.announcements.splice(i, 1);
    }
  }

  private emitHud(): void {
    const player = this.player;
    const skills = abilityKeys.map((key) => this.getUnitAbility(player, key)).filter((ability): ability is AbilityDefinition => Boolean(ability)).map((ability) => ({
      key: ability.key,
      cooldown: player.abilityCooldowns[ability.key],
      maxCooldown: Math.max(0.1, this.getAbilityCooldown(player, ability)),
      ready: player.alive && player.abilityCooldowns[ability.key] <= 0,
      name: ability.shortName,
      icon: ability.icon
    }));
    this.onHud({
      playerHp: player.hp,
      playerMaxHp: player.stats.maxHp,
      playerShield: player.shield,
      playerLevel: player.level,
      playerXp: player.xp,
      playerXpNeed: xpNeed(player.level),
      playerGold: player.gold,
      playerKills: player.kills,
      playerDeaths: player.deaths,
      allyKills: this.allyKills,
      enemyKills: this.enemyKills,
      gameTime: this.gameTime,
      lowHp: player.alive && player.hp / player.stats.maxHp < 0.32,
      respawnTimer: player.alive ? 0 : Math.max(0, player.respawnTimer),
      skills,
      announcements: [...this.announcements],
      minimapUnits: Array.from(this.units.values()).map((unit) => ({
        id: unit.id,
        team: unit.team,
        kind: unit.kind,
        name: unit.name,
        x: unit.position.x,
        z: unit.position.z,
        alive: unit.alive,
        isPlayer: unit.isPlayer,
        isBoss: unit.isBoss
      }))
    });
  }

  private checkWinLoss(): void {
    const allyBase = this.findBase("ally");
    const enemyBase = this.findBase("enemy");
    if (!allyBase?.alive) this.finish("defeat");
    if (!enemyBase?.alive) this.finish("victory");
  }

  private finish(outcome: MatchResult["outcome"]): void {
    if (this.finished) return;
    this.finished = true;
    this.clearAim();
    this.audio.play(outcome === "victory" ? "victory" : "death");
    this.effects.burst(this.player.position.clone().add(new THREE.Vector3(0, 1.4, 0)), outcome === "victory" ? "ally" : "enemy", 36, 1.7);
    this.announce(outcome === "victory" ? "星核已稳定，胜利！" : "己方星核崩解，失败", outcome);
    const settlementGold = Math.round(this.player.gold + (outcome === "victory" ? 850 : 360) + Math.min(650, this.gameTime * 2.5));
    setTimeout(() => {
      this.onFinish({
        outcome,
        heroId: this.heroId,
        kills: this.player.kills,
        deaths: this.player.deaths,
        damageDealt: Math.round(this.player.damageDealt),
        damageTaken: Math.round(this.player.damageTaken),
        gold: settlementGold,
        duration: this.gameTime,
        finishedAt: new Date().toISOString()
      });
    }, 850);
  }

  private handleDeath(target: GameUnit, source?: GameUnit): void {
    target.alive = false;
    target.targetId = undefined;
    target.moveTarget = undefined;
    target.hp = 0;
    target.shield = 0;
    target.deaths += 1;
    target.respawnTimer = target.kind === "hero" ? 7 + target.level * 1.1 : target.kind === "monster" ? -1.2 : target.kind === "minion" ? -1.2 : 0;
    this.effects.burst(target.position.clone().add(new THREE.Vector3(0, 0.8, 0)), target.team, target.kind === "hero" ? 26 : target.kind === "monster" ? 20 : 12, target.kind === "hero" ? 1.25 : target.kind === "monster" ? 1.05 : 0.75);
    this.audio.play(target.kind === "hero" ? "death" : "hit");

    if (source?.kind === "hero") {
      source.kills += 1;
      const goldReward = target.kind === "hero" ? 240 : target.kind === "tower" ? 300 : target.kind === "monster" ? target.gold : 28;
      const xpReward = target.kind === "hero" ? 155 : target.kind === "tower" ? 120 : target.isBoss ? 260 : target.kind === "monster" ? 100 : 38;
      source.gold += goldReward;
      source.xp += xpReward;
      if (target.isBoss) this.applyBossBuff(source, target.bossBuff);
      if (source.isPlayer) this.effects.damageText(target.position, xpReward, "xp");
      while (source.xp >= xpNeed(source.level)) {
        source.xp -= xpNeed(source.level);
        source.level += 1;
        source.stats.maxHp += 92;
        source.stats.attack += 6 + Math.ceil(source.level * 1.4);
        source.stats.defense += 4;
        source.hp = source.stats.maxHp;
        this.effects.ring(source.position, 2.4, teamColor[source.team], 0.8);
        if (source.isPlayer) this.announce(`经验满格，等级提升至 ${source.level}，攻击力提高`, "ally");
      }
    }

    if (target.kind === "hero") {
      if (source?.team === "ally" && target.team === "enemy") this.allyKills += 1;
      if (source?.team === "enemy" && target.team === "ally") this.enemyKills += 1;
      if (source?.team === "neutral") {
        this.announce("裂隙将领击倒了一名守望者", "info");
      } else {
        this.announce(target.team === "enemy" ? "击败敌方守望者" : "我方守望者阵亡", target.team === "enemy" ? "ally" : "enemy");
      }
    }

    if (target.isBoss && source?.isPlayer) this.announce("击败裂隙将领，获得大量经验", "ally");
    else if (target.kind === "monster" && source?.isPlayer) this.announce("击败裂隙幽鬼，获得 100 经验", "ally");
    if (target.kind === "tower") this.announce(target.team === "enemy" ? "敌方防御塔已被摧毁" : "己方防御塔已被摧毁", target.team === "enemy" ? "ally" : "enemy");
    if (target.kind === "base") this.effects.burst(target.position.clone().add(new THREE.Vector3(0, 2, 0)), target.team, 64, 2.4);
  }

  private applyBossBuff(unit: GameUnit, buff: BossBuffType = "power"): void {
    const name = bossBuffName[buff];
    if (buff === "power") {
      unit.stats.attack += 22 + Math.ceil(unit.level * 2);
      this.effects.ring(unit.position, 2.9, "#ff8b56", 0.95);
      this.effects.damageText(unit.position, 22, "xp");
    } else if (buff === "haste") {
      this.addStatus(unit, { type: "speed", remaining: 45, value: 0.24, sourceId: unit.id });
      unit.attackTimer = Math.max(0, unit.attackTimer - 0.35);
      this.effects.ring(unit.position, 3.1, "#f8d26b", 0.95);
    } else {
      const shield = 360 + unit.level * 35;
      unit.shield = Math.max(unit.shield, shield);
      this.addStatus(unit, { type: "shield", remaining: 45, value: shield, sourceId: unit.id });
      this.addStatus(unit, { type: "damageReduction", remaining: 25, value: 0.18, sourceId: unit.id });
      this.effects.ring(unit.position, 3.2, "#5beeff", 1);
    }
    this.effects.burst(unit.position.clone().add(new THREE.Vector3(0, 1.4, 0)), unit.team, 18, 1);
    this.announce(unit.isPlayer ? `获得${name} Buff` : `${unit.team === "ally" ? "己方" : "敌方"}英雄获得${name} Buff`, unit.team === "enemy" ? "enemy" : "ally");
  }

  private respawnHero(unit: GameUnit): void {
    unit.alive = true;
    unit.hp = unit.stats.maxHp;
    unit.shield = 0;
    unit.position.copy(unit.spawn);
    unit.object.position.copy(unit.spawn);
    unit.object.visible = true;
    unit.statuses = [];
    unit.respawnTimer = 0;
    this.effects.ring(unit.position, 2.3, teamColor[unit.team], 0.8);
    if (unit.isPlayer) this.announce("你已在星门中复活", "ally");
  }

  private respawnMonster(unit: GameUnit): void {
    unit.alive = true;
    unit.hp = unit.stats.maxHp;
    unit.shield = 0;
    unit.position.copy(unit.spawn);
    unit.object.position.copy(unit.spawn);
    unit.object.visible = true;
    unit.statuses = [];
    unit.targetId = undefined;
    unit.respawnTimer = 0;
    this.effects.ring(unit.position, 1.45, teamColor.neutral, 0.55);
  }

  private moveAlong(unit: GameUnit, direction: THREE.Vector3, dt: number): void {
    const speed = this.getMoveSpeed(unit);
    const oldPosition = unit.position.clone();
    unit.position.addScaledVector(direction, speed * dt);
    clampWorld(unit.position);
    unit.velocity.copy(unit.position).sub(oldPosition).divideScalar(Math.max(dt, 0.001));
    if (unit.velocity.lengthSq() > 0.01) {
      unit.object.rotation.y = Math.atan2(direction.x, direction.z);
      if (this.trailTimer > 0.06 && unit.kind === "hero") {
        this.effects.trail(unit.position, unit.team);
        this.trailTimer = 0;
      }
    }
  }

  private getMoveSpeed(unit: GameUnit): number {
    const slow = unit.statuses.filter((status) => status.type === "slow").reduce((value, status) => Math.max(value, status.value), 0);
    const speedBonus = unit.statuses.filter((status) => status.type === "speed").reduce((total, status) => total + status.value, 0);
    return unit.stats.speed * (1 - slow) * (1 + speedBonus);
  }

  private pickTowerTarget(tower: GameUnit): GameUnit | undefined {
    const enemies = this.getEnemies(tower).filter((unit) => unit.alive && flatDistance(unit.position, tower.position) <= tower.stats.attackRange + unit.radius);
    const aggro = this.towerAggro[tower.team];
    const aggroTarget = aggro ? enemies.find((unit) => unit.id === aggro.sourceId && unit.kind === "hero") : undefined;
    if (aggroTarget) return aggroTarget;
    return (
      enemies.find((unit) => unit.kind === "minion") ??
      enemies.find((unit) => unit.kind === "hero") ??
      enemies.find((unit) => unit.kind === "tower") ??
      enemies.find((unit) => unit.kind === "base")
    );
  }

  private tryTowerAttack(tower: GameUnit, target: GameUnit): boolean {
    if (tower.attackTimer > 0 || !tower.alive) return false;
    tower.attackTimer = tower.stats.attackCooldown;
    const projectile = createBasicProjectile(tower, target, tower.stats.attack);
    projectile.speed = 15;
    projectile.range = tower.stats.attackRange + 2;
    projectile.hitRadius = 0.95;
    projectile.object.scale.setScalar(1.35);
    this.addProjectile(projectile);
    this.effects.ring(tower.position, 1.6, teamColor[tower.team], 0.28);
    this.audio.play("tower");
    return true;
  }

  private preventContext = (event: Event): void => event.preventDefault();

  private handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.desiredCameraDistance = clamp(this.desiredCameraDistance + Math.sign(event.deltaY) * 1.4, 16, 30);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.raycaster.ray.intersectPlane(this.groundPlane, this.pointerWorld);
    if (this.aiming) this.updateAimIndicator();
  };

  private handleMouseDown = (event: MouseEvent): void => {
    if (this.paused || this.finished) return;
    if (event.button === 2) {
      if (this.aiming) this.clearAim();
      else if (this.player.alive) this.player.moveTarget = this.pointerWorld.clone();
      this.rightMouseDown = true;
      return;
    }
    if (event.button !== 0 || !this.player.alive) return;
    if (this.aiming) {
      this.confirmAim();
      return;
    }
    const clicked = this.findUnitAt(this.pointerWorld, "enemy") ?? this.findNeutralMonsterAt(this.pointerWorld);
    if (clicked) {
      this.player.targetId = clicked.id;
      if (!this.tryBasicAttack(this.player, clicked)) this.player.moveTarget = clicked.position.clone();
    } else {
      this.player.targetId = undefined;
      this.player.moveTarget = this.pointerWorld.clone();
    }
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat && !["KeyQ", "KeyW", "KeyE", "KeyR"].includes(event.code)) return;
    if (!this.keyDownAt.has(event.code)) this.keyDownAt.set(event.code, performance.now());
    if (["KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) this.keys.add(event.code);
    if (event.code === "Escape") {
      if (this.aiming) this.clearAim();
      else this.setPaused(!this.paused);
    }
    if (event.code === "Tab") {
      event.preventDefault();
      this.onScoreboardChange(true);
    }
    if (event.code === "Space") {
      event.preventDefault();
      this.playerAttackCommand();
    }
    if (event.code === "KeyC") {
      event.preventDefault();
      this.cycleCameraMode();
    }
    if (event.code === "Digit1") this.usePotion("heal");
    if (event.code === "Digit2") this.usePotion("guard");
    const key = event.code.replace("Key", "") as AbilityKey;
    if (abilityKeys.includes(key) && key !== "W") this.handleAbilityKey(key);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (["KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) this.keys.delete(event.code);
    const downAt = this.keyDownAt.get(event.code);
    this.keyDownAt.delete(event.code);
    if (event.code === "KeyW" && downAt && performance.now() - downAt < 230) this.handleAbilityKey("W");
    if (event.code === "Tab") this.onScoreboardChange(false);
  };

  private handleAbilityKey(key: AbilityKey): void {
    if (!this.player.alive || this.paused) return;
    const ability = this.getUnitAbility(this.player, key);
    if (!ability || this.player.abilityCooldowns[key] > 0) return;
    if (this.aiming?.key === key) {
      this.confirmAim();
      return;
    }
    if (ability.targeting === "self") {
      this.castAbility(this.player, ability, this.pointerWorld);
      return;
    }
    this.aiming = ability;
    this.createAimIndicator(ability);
    this.updateAimIndicator();
  }

  private createAimIndicator(ability: AbilityDefinition): void {
    this.clearAim();
    this.aiming = ability;
    const color = teamColor[this.player.team];
    const group = new THREE.Group();
    if (ability.targeting === "direction") {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(ability.radius * 0.72, 0.04, ability.range),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      line.position.z = ability.range / 2;
      group.add(line);
      const head = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(0.55, ability.radius * 0.65), 1.2, 3),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      head.position.z = ability.range + 0.35;
      head.rotation.x = Math.PI / 2;
      group.add(head);
    } else {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(ability.radius * 0.84, ability.radius, 72),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);
    }
    this.scene.add(group);
    this.aimIndicator = group;
  }

  private updateAimIndicator(): void {
    if (!this.aiming || !this.aimIndicator) return;
    const ability = this.aiming;
    if (ability.targeting === "direction") {
      const direction = flatDirection(this.player.position, this.pointerWorld);
      this.aimIndicator.position.copy(this.player.position).add(new THREE.Vector3(0, 0.12, 0));
      this.aimIndicator.rotation.y = Math.atan2(direction.x, direction.z);
      return;
    }
    const point = clampPointFromOrigin(this.player.position, this.pointerWorld, ability.range);
    this.aimIndicator.position.copy(point).add(new THREE.Vector3(0, 0.12, 0));
  }

  private confirmAim(): void {
    if (!this.aiming) return;
    const ability = this.aiming;
    this.castAbility(this.player, ability, this.pointerWorld);
    this.clearAim();
  }

  private clearAim(): void {
    if (this.aimIndicator) {
      this.scene.remove(this.aimIndicator);
      this.disposeObject(this.aimIndicator);
      this.aimIndicator = undefined;
    }
    this.aiming = undefined;
  }

  private findUnitAt(point: THREE.Vector3, team?: Team): GameUnit | undefined {
    return Array.from(this.units.values())
      .filter((unit) => unit.alive && !this.isHiddenByBrush(unit) && (!team || unit.team === team) && flatDistance(point, unit.position) <= unit.radius + 1.1)
      .sort((a, b) => flatDistance(point, a.position) - flatDistance(point, b.position))[0];
  }

  private findNeutralMonsterAt(point: THREE.Vector3): GameUnit | undefined {
    return Array.from(this.units.values())
      .filter((unit) => unit.kind === "monster" && unit.alive && flatDistance(point, unit.position) <= unit.radius + 1.15)
      .sort((a, b) => flatDistance(point, a.position) - flatDistance(point, b.position))[0];
  }

  private playerAttackCommand(): void {
    if (!this.player.alive || this.paused) return;
    if (this.aiming) {
      this.confirmAim();
      return;
    }
    const current = this.getUnit(this.player.targetId);
    const target =
      current?.alive && current.team === "enemy"
        ? current
        : this.getEnemies(this.player)
            .filter((unit) => unit.alive && !this.isHiddenByBrush(unit))
            .sort((a, b) => flatDistance(this.player.position, a.position) - flatDistance(this.player.position, b.position))[0];
    if (!target) return;
    this.player.targetId = target.id;
    if (!this.tryBasicAttack(this.player, target)) this.player.moveTarget = target.position.clone();
  }

  private usePotion(type: "heal" | "guard"): void {
    if (!this.player.alive) return;
    if (type === "heal" && this.player.gold >= 60) {
      this.player.gold -= 60;
      const heal = this.player.stats.maxHp * 0.22;
      this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + heal);
      this.effects.damageText(this.player.position, heal, "heal");
      this.effects.ring(this.player.position, 1.7, "#72ffbc", 0.45);
    }
    if (type === "guard" && this.player.gold >= 80) {
      this.player.gold -= 80;
      this.player.shield = Math.max(this.player.shield, 150);
      this.addStatus(this.player, { type: "shield", remaining: 4, value: 150, sourceId: this.player.id });
      this.effects.ring(this.player.position, 1.8, "#ffdd86", 0.45);
    }
  }

  private announce(text: string, tone: Announcement["tone"]): void {
    this.announcements.unshift({ id: makeId("announce"), text, tone, time: 3.1 });
    this.announcements.splice(4);
  }

  private tuningValue(key: keyof GameSettings["tuning"]): number {
    const value = Number(this.settings.tuning[key]);
    return Number.isFinite(value) ? clamp(value, 0, 1000) : 1;
  }

  private applyPlayerTuning(unit: GameUnit): void {
    const healthMultiplier = this.tuningValue("healthMultiplier");
    unit.stats.maxHp = Math.max(1, Math.round(unit.stats.maxHp * healthMultiplier));
    unit.hp = unit.stats.maxHp;
  }

  getSkillDamageMultiplier(caster: GameUnit): number {
    return caster.isPlayer && caster.team === "ally" ? this.tuningValue("skillDamageMultiplier") : 1;
  }

  private getBasicAttackMultiplier(source: GameUnit): number {
    return source.isPlayer && source.team === "ally" ? this.tuningValue("basicAttackMultiplier") : 1;
  }

  private getAbilityCooldown(source: GameUnit, ability: AbilityDefinition): number {
    const baseCooldown = Math.max(0, ability.cooldown - source.level * 0.12);
    const multiplier = source.isPlayer && source.team === "ally" ? this.tuningValue("cooldownMultiplier") : 1;
    const tunedCooldown = baseCooldown * multiplier;
    return tunedCooldown <= 0 ? 0 : Math.max(0.1, tunedCooldown);
  }

  private getUnitAbility(unit: GameUnit, key: AbilityKey): AbilityDefinition | undefined {
    if (unit.isPlayer && unit.team === "ally") {
      return this.equippedAbilities[key] ?? heroById[this.heroId].abilities.find((ability) => ability.key === key);
    }
    return unit.heroId ? heroById[unit.heroId].abilities.find((ability) => ability.key === key) : undefined;
  }

  private resize = (): void => {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  };

  getEnemies(unit: GameUnit): GameUnit[] {
    return Array.from(this.units.values()).filter((candidate) => {
      if (!candidate.alive || candidate.id === unit.id || candidate.team === unit.team) return false;
      if (candidate.kind === "monster") return unit.kind === "hero";
      if (unit.kind === "monster") return candidate.kind === "hero";
      return candidate.team !== "neutral";
    });
  }

  getAllies(unit: GameUnit): GameUnit[] {
    return Array.from(this.units.values()).filter((candidate) => candidate.team === unit.team);
  }

  getUnit(id?: string): GameUnit | undefined {
    return id ? this.units.get(id) : undefined;
  }

  findBase(team: Team): GameUnit | undefined {
    return Array.from(this.units.values()).find((unit) => unit.kind === "base" && unit.team === team);
  }

  findTower(team: Team, laneIndex?: number): GameUnit | undefined {
    const towers = Array.from(this.units.values()).filter((unit) => unit.kind === "tower" && unit.team === team && unit.alive);
    return towers.find((unit) => unit.laneIndex === laneIndex) ?? towers[0];
  }

  moveToward(unit: GameUnit, point: THREE.Vector3, dt: number): void {
    if (!unit.alive || unit.statuses.some((status) => status.type === "stun")) return;
    this.moveAlong(unit, flatDirection(unit.position, point), dt);
  }

  tryBasicAttack(source: GameUnit, target: GameUnit): boolean {
    if (!source.alive || !target.alive || source.attackTimer > 0) return false;
    if (source.isPlayer && this.isHiddenByBrush(target)) return false;
    const starBlade = source.statuses.find((status) => status.type === "starBlade");
    const range = source.stats.attackRange + (starBlade ? 1.8 : 0);
    if (flatDistance(source.position, target.position) > range + target.radius) return false;

    source.attackTimer = Math.max(0.24, source.stats.attackCooldown - source.level * 0.015);
    source.object.rotation.y = Math.atan2(target.position.x - source.position.x, target.position.z - source.position.z);
    let damage = source.stats.attack;
    if (source.kind === "hero" && source.heroId && heroById[source.heroId].archetype === "warrior") {
      const combo = [0.9, 1, 1.22][source.basicCombo % 3];
      damage *= combo;
      source.basicCombo += 1;
      if (combo > 1.1) this.effects.ring(target.position, 1.1, teamColor[source.team], 0.28);
    }
    damage *= this.getBasicAttackMultiplier(source);
    if (starBlade) damage += starBlade.value;

    const ranged = source.stats.attackRange > 3 || source.kind === "tower" || Boolean(starBlade);
    if (ranged) {
      this.addProjectile(createBasicProjectile(source, target, damage));
    } else {
      this.damage(source, target, damage, source.heroId && heroById[source.heroId].archetype === "mage" ? "magic" : "physical", source.position);
      this.effects.ring(target.position, 0.9, teamColor[source.team], 0.22);
    }
    return true;
  }

  tryCastAbility(source: GameUnit, ability: AbilityDefinition, point: THREE.Vector3): boolean {
    if (!source.alive || source.abilityCooldowns[ability.key] > 0) return false;
    return this.castAbility(source, ability, point);
  }

  private castAbility(source: GameUnit, ability: AbilityDefinition, point: THREE.Vector3): boolean {
    if (!source.heroId || source.abilityCooldowns[ability.key] > 0 || source.statuses.some((status) => status.type === "stun")) return false;
    const direction = flatDirection(source.position, point);
    const aim: CastAim = { point: point.clone(), direction };
    const success = castHeroAbility(this, source, ability, aim);
    if (success) {
      source.abilityCooldowns[ability.key] = this.getAbilityCooldown(source, ability);
      this.effects.burst(source.position.clone().add(new THREE.Vector3(0, 1.1, 0)), source.team, 5, 0.55);
    }
    return success;
  }

  damage(source: GameUnit, target: GameUnit, amount: number, type: "physical" | "magic" | "true", origin?: THREE.Vector3): void {
    const result = applyDamage({ source, target, amount, type, origin });
    if (result.final <= 0) return;
    if (target.kind === "hero" && source.kind === "hero") {
      this.towerAggro[target.team] = { sourceId: source.id, timer: 4 };
    }
    this.effects.damageText(target.position, result.final);
    this.effects.burst(target.position.clone().add(new THREE.Vector3(0, 1, 0)), source.team, result.killed ? 18 : 5, result.killed ? 1 : 0.45);
    this.audio.play("hit");
    if (result.killed) this.handleDeath(target, source);
  }

  addStatus(target: GameUnit, status: Omit<GameUnit["statuses"][number], "id">): void {
    target.statuses.push({ ...status, id: makeId(status.type) });
  }

  addProjectile(projectile: Projectile): void {
    projectile.object.position.copy(projectile.position);
    projectile.object.rotation.y = Math.atan2(projectile.direction.x, projectile.direction.z);
    this.scene.add(projectile.object);
    this.projectiles.push(projectile);
  }

  addArea(effect: AreaEffect): void {
    this.scene.add(effect.object);
    this.areas.push(effect);
  }

  burst(position: THREE.Vector3, team: Team, count?: number, scale?: number): void {
    this.effects.burst(position, team, count, scale);
  }

  ring(position: THREE.Vector3, radius: number, color: string, duration?: number): void {
    this.effects.ring(position, radius, color, duration);
  }

  trail(position: THREE.Vector3, team: Team): void {
    this.effects.trail(position, team);
  }

  playAudio(type: "hit" | "cast" | "dash" | "death" | "victory" | "tower"): void {
    this.audio.play(type);
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material.dispose());
      }
    });
  }
}
