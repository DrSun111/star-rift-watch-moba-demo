import * as THREE from "three";
import { heroById } from "../../data/heroes";
import { AbilityDefinition, GameUnit } from "../core/types";
import { flatDirection, flatDistance, teamSign } from "../core/math";

export interface AiContext {
  time: number;
  getEnemies(unit: GameUnit): GameUnit[];
  getAllies(unit: GameUnit): GameUnit[];
  getUnit(id?: string): GameUnit | undefined;
  moveToward(unit: GameUnit, point: THREE.Vector3, dt: number): void;
  tryBasicAttack(source: GameUnit, target: GameUnit): boolean;
  tryCastAbility(source: GameUnit, ability: AbilityDefinition, point: THREE.Vector3): boolean;
  findBase(team: GameUnit["team"]): GameUnit | undefined;
  findTower(team: GameUnit["team"], laneIndex?: number): GameUnit | undefined;
}

function closest(unit: GameUnit, candidates: GameUnit[], maxRange = Infinity): GameUnit | undefined {
  let selected: GameUnit | undefined;
  let selectedDistance = maxRange;
  for (const candidate of candidates) {
    if (!candidate.alive) continue;
    const distance = flatDistance(unit.position, candidate.position);
    if (distance < selectedDistance) {
      selected = candidate;
      selectedDistance = distance;
    }
  }
  return selected;
}

function priorityTarget(unit: GameUnit, enemies: GameUnit[], maxRange: number): GameUnit | undefined {
  const minion = closest(unit, enemies.filter((enemy) => enemy.kind === "minion"), maxRange);
  if (minion) return minion;
  const hero = closest(unit, enemies.filter((enemy) => enemy.kind === "hero"), maxRange);
  if (hero) return hero;
  const monster = closest(unit, enemies.filter((enemy) => enemy.kind === "monster"), maxRange);
  if (monster) return monster;
  const tower = closest(unit, enemies.filter((enemy) => enemy.kind === "tower"), maxRange);
  if (tower) return tower;
  return closest(unit, enemies.filter((enemy) => enemy.kind === "base"), maxRange);
}

function enemyHeroTarget(unit: GameUnit, enemies: GameUnit[]): GameUnit | undefined {
  const hero = closest(unit, enemies.filter((enemy) => enemy.kind === "hero"), 9.5);
  if (hero) return hero;
  const monster = closest(unit, enemies.filter((enemy) => enemy.kind === "monster"), 13);
  if (monster) return monster;
  return priorityTarget(unit, enemies, 7.5);
}

export function updateMinionAi(ctx: AiContext, unit: GameUnit, dt: number): void {
  if (!unit.alive) {
    unit.aiState = "dead";
    return;
  }
  if (unit.statuses.some((status) => status.type === "stun")) return;

  const current = ctx.getUnit(unit.targetId);
  const enemies = ctx.getEnemies(unit);
  const target = current?.alive ? current : priorityTarget(unit, enemies, 5.6);
  unit.targetId = target?.id;

  if (target) {
    if (ctx.tryBasicAttack(unit, target)) {
      unit.aiState = "attacking";
      return;
    }
    ctx.moveToward(unit, target.position, dt);
    unit.aiState = "searching";
    return;
  }

  const enemyBase = ctx.findBase(unit.team === "ally" ? "enemy" : "ally");
  if (enemyBase) {
    const lanePoint = enemyBase.position.clone();
    lanePoint.z = unit.laneOffset;
    ctx.moveToward(unit, lanePoint, dt);
    unit.aiState = "laning";
  }
}

export function updateEnemyHeroAi(ctx: AiContext, unit: GameUnit, dt: number): void {
  if (!unit.alive) {
    unit.aiState = "dead";
    return;
  }
  if (!unit.heroId || unit.statuses.some((status) => status.type === "stun")) return;

  const hpRate = unit.hp / unit.stats.maxHp;
  const ownBase = ctx.findBase(unit.team);
  const ownTower = ctx.findTower(unit.team, unit.laneIndex);
  const enemies = ctx.getEnemies(unit);
  const nearbyThreat = closest(unit, enemies.filter((enemy) => enemy.kind === "hero" || enemy.kind === "minion" || enemy.kind === "monster"), 9);

  if (hpRate < 0.32 && (ownBase || ownTower)) {
    unit.aiState = "retreating";
    ctx.moveToward(unit, ownTower?.alive ? ownTower.position : ownBase!.position, dt);
    if (nearbyThreat && flatDistance(unit.position, nearbyThreat.position) < 5.8) {
      const def = heroById[unit.heroId];
      const escape = def.abilities.find((ability) => ability.key === "E" || ability.key === "W");
      if (escape) ctx.tryCastAbility(unit, escape, ownBase?.position ?? unit.spawn);
    }
    return;
  }

  const target = enemyHeroTarget(unit, enemies);
  unit.targetId = target?.id;
  if (target) {
    unit.aiState = flatDistance(unit.position, target.position) < unit.stats.attackRange + 0.2 ? "attacking" : "searching";
    const def = heroById[unit.heroId];
    const abilityOrder = def.abilities
      .filter((ability) => ability.key !== "R" || hpRate > 0.45 || flatDistance(unit.position, target.position) < ability.radius + 2)
      .sort((a, b) => {
        const scoreA = a.key === "R" ? 4 : a.key === "Q" ? 3 : a.key === "W" ? 2 : 1;
        const scoreB = b.key === "R" ? 4 : b.key === "Q" ? 3 : b.key === "W" ? 2 : 1;
        return scoreB - scoreA;
      });

    for (const ability of abilityOrder) {
      const distance = flatDistance(unit.position, target.position);
      const usableRange = ability.targeting === "self" ? ability.radius + 0.7 : ability.range + ability.radius;
      const wantsSelfDefensive = ability.targeting === "self" && (ability.damage === 0 ? hpRate < 0.72 : distance < ability.radius + 0.7);
      if ((ability.targeting !== "self" && distance <= usableRange) || wantsSelfDefensive) {
        if (ctx.tryCastAbility(unit, ability, target.position)) {
          unit.aiState = "casting";
          break;
        }
      }
    }

    if (!ctx.tryBasicAttack(unit, target)) {
      const approachPoint = target.position.clone().addScaledVector(flatDirection(target.position, unit.position), Math.max(0.2, unit.stats.attackRange * 0.72));
      ctx.moveToward(unit, approachPoint, dt);
    }
    return;
  }

  const alliedMinions = ctx
    .getAllies(unit)
    .filter((ally) => ally.kind === "minion" && ally.alive)
    .sort((a, b) => teamSign(unit.team) * (b.position.x - a.position.x));
  const frontMinion = alliedMinions[0];
  if (frontMinion) {
    const point = frontMinion.position.clone();
    point.z += unit.laneOffset > 0 ? 1.3 : -1.3;
    ctx.moveToward(unit, point, dt);
    unit.aiState = "following";
    return;
  }

  const enemyBase = ctx.findBase(unit.team === "ally" ? "enemy" : "ally");
  if (enemyBase) {
    const point = enemyBase.position.clone();
    point.z = unit.laneOffset;
    ctx.moveToward(unit, point, dt);
    unit.aiState = "returning";
  }
}
