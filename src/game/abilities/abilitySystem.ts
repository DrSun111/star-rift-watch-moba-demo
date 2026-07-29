import * as THREE from "three";
import { heroById } from "../../data/heroes";
import { AbilityDefinition, AreaEffect, DamageType, GameUnit, Projectile, StatusEffect } from "../core/types";
import { clampPointFromOrigin, clampWorld, flatDirection, makeId, pointInCapsule } from "../core/math";

export interface CastAim {
  point: THREE.Vector3;
  direction: THREE.Vector3;
}

export interface AbilityContext {
  getEnemies(caster: GameUnit): GameUnit[];
  getAllies(caster: GameUnit): GameUnit[];
  damage(source: GameUnit, target: GameUnit, amount: number, type: DamageType, origin?: THREE.Vector3): void;
  addStatus(target: GameUnit, status: Omit<StatusEffect, "id">): void;
  addProjectile(projectile: Projectile): void;
  addArea(effect: AreaEffect): void;
  getSkillDamageMultiplier(caster: GameUnit): number;
  burst(position: THREE.Vector3, team: GameUnit["team"], count?: number, scale?: number): void;
  ring(position: THREE.Vector3, radius: number, color: string, duration?: number): void;
  trail(position: THREE.Vector3, team: GameUnit["team"]): void;
  playAudio(type: "hit" | "cast" | "dash" | "death" | "victory" | "tower"): void;
}

const allyColor = "#5bf1ff";
const enemyColor = "#ff4778";

function colorFor(unit: GameUnit): string {
  return unit.team === "ally" ? allyColor : enemyColor;
}

function archetypeOf(unit: GameUnit): "warrior" | "mage" | "tank" | undefined {
  return unit.heroId ? heroById[unit.heroId]?.archetype : undefined;
}

function skillDamage(ctx: AbilityContext, caster: GameUnit, amount: number): number {
  return amount * ctx.getSkillDamageMultiplier(caster);
}

function makeProjectileObject(color: string, radius: number, shape: "sphere" | "blade" | "bolt" = "sphere"): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const core =
    shape === "blade"
      ? new THREE.Mesh(new THREE.ConeGeometry(radius, radius * 2.8, 4), material)
      : shape === "bolt"
        ? new THREE.Mesh(new THREE.OctahedronGeometry(radius, 1), material)
        : new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), material);
  core.castShadow = false;
  group.add(core);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.35, radius * 0.08, 8, 32), material.clone());
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

function makeAreaObject(color: string, radius: number, kind: "vines" | "storm" | "domain" | "quake"): THREE.Group {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.84, radius, 72),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: kind === "domain" ? 0.38 : 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  const strands = kind === "domain" ? 9 : 14;
  for (let i = 0; i < strands; i += 1) {
    const angle = (i / strands) * Math.PI * 2;
    const length = radius * (0.55 + Math.random() * 0.4);
    const strand = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.035, length),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.36, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    strand.position.set(Math.cos(angle) * radius * 0.28, 0.08, Math.sin(angle) * radius * 0.28);
    strand.rotation.y = -angle;
    group.add(strand);
  }
  return group;
}

function enemiesInRadius(ctx: AbilityContext, caster: GameUnit, center: THREE.Vector3, radius: number): GameUnit[] {
  return ctx.getEnemies(caster).filter((unit) => unit.alive && unit.position.distanceTo(center) <= radius + unit.radius);
}

function enemiesInCapsule(ctx: AbilityContext, caster: GameUnit, from: THREE.Vector3, to: THREE.Vector3, radius: number): GameUnit[] {
  return ctx.getEnemies(caster).filter((unit) => unit.alive && pointInCapsule(unit.position, from, to, radius + unit.radius));
}

export function castHeroAbility(ctx: AbilityContext, caster: GameUnit, ability: AbilityDefinition, aim: CastAim): boolean {
  const color = colorFor(caster);
  const origin = caster.position.clone();
  ctx.playAudio("cast");

  if (caster.heroId === "wuxiang") {
    if (ability.key === "Q" || ability.key === "R") {
      const targets = ctx.getEnemies(caster).filter((unit) => unit.alive && unit.kind !== "base");
      const multiplier = ability.key === "R" ? 1.35 : 0.78;
      const damage = skillDamage(ctx, caster, ability.damage + caster.stats.attack * multiplier);
      ctx.ring(origin, ability.key === "R" ? 8.4 : 5.8, color, ability.key === "R" ? 0.9 : 0.62);
      ctx.burst(origin.clone().add(new THREE.Vector3(0, 1.35, 0)), caster.team, ability.key === "R" ? 34 : 18, ability.key === "R" ? 1.55 : 1);
      targets.forEach((target) => {
        ctx.damage(caster, target, damage, ability.damageType, origin);
        if (ability.key === "Q") ctx.addStatus(target, { type: "slow", remaining: 1.8, value: 0.28, sourceId: caster.id });
        if (ability.key === "R") ctx.addStatus(target, { type: "stun", remaining: 0.65, value: 1, sourceId: caster.id });
      });
      targets.slice(0, 12).forEach((target) => ctx.ring(target.position, target.radius + 0.9, color, 0.46));
      return true;
    }
    if (ability.key === "W") {
      ctx.ring(origin, ability.radius, color, 0.62);
      ctx.addStatus(caster, { type: "speed", remaining: 3.2, value: 0.24, sourceId: caster.id });
      enemiesInRadius(ctx, caster, origin, ability.radius).forEach((target) => {
        ctx.damage(caster, target, skillDamage(ctx, caster, ability.damage + caster.stats.attack * 0.42), ability.damageType, origin);
        ctx.addStatus(target, { type: "stun", remaining: 0.48, value: 1, sourceId: caster.id });
      });
      return true;
    }
    if (ability.key === "E") {
      const destination = clampWorld(origin.clone().addScaledVector(aim.direction, ability.range));
      caster.position.copy(destination);
      caster.object.position.copy(destination);
      caster.object.rotation.y = Math.atan2(aim.direction.x, aim.direction.z);
      ctx.trail(origin, caster.team);
      ctx.trail(destination, caster.team);
      ctx.ring(destination, 2.2, color, 0.45);
      ctx.playAudio("dash");
      return true;
    }
  }

  if (archetypeOf(caster) === "warrior") {
    if (ability.key === "Q") {
      const destination = clampPointFromOrigin(origin, origin.clone().addScaledVector(aim.direction, ability.range), ability.range);
      const targets = enemiesInCapsule(ctx, caster, origin, destination, ability.radius);
      caster.position.copy(destination);
      caster.object.position.copy(destination);
      caster.object.rotation.y = Math.atan2(aim.direction.x, aim.direction.z);
      ctx.trail(origin, caster.team);
      ctx.trail(destination, caster.team);
      ctx.ring(destination, ability.radius, color, 0.42);
      targets.forEach((target) => ctx.damage(caster, target, skillDamage(ctx, caster, ability.damage + caster.stats.attack * 0.8), ability.damageType, origin));
      ctx.playAudio("dash");
      return true;
    }
    if (ability.key === "W") {
      ctx.ring(origin, ability.radius, color, 0.5);
      enemiesInRadius(ctx, caster, origin, ability.radius).forEach((target) => {
        ctx.damage(caster, target, skillDamage(ctx, caster, ability.damage + caster.stats.attack * 0.58), ability.damageType, origin);
      });
      return true;
    }
    if (ability.key === "E") {
      caster.shield = Math.max(caster.shield, 170 + caster.level * 28);
      ctx.addStatus(caster, { type: "shield", remaining: 4, value: 170 + caster.level * 28, sourceId: caster.id });
      ctx.addStatus(caster, { type: "speed", remaining: 3.1, value: 0.34, sourceId: caster.id });
      ctx.ring(origin, 2.4, color, 0.55);
      return true;
    }
    if (ability.key === "R") {
      ctx.addStatus(caster, { type: "starBlade", remaining: 9, value: skillDamage(ctx, caster, ability.damage + caster.stats.attack * 0.35), sourceId: caster.id });
      ctx.ring(origin, 3.2, color, 0.8);
      ctx.burst(origin.clone().add(new THREE.Vector3(0, 1.2, 0)), caster.team, 24, 1.2);
      return true;
    }
  }

  if (archetypeOf(caster) === "mage") {
    if (ability.key === "Q") {
      const object = makeProjectileObject(color, 0.28, "bolt");
      ctx.addProjectile({
        id: makeId("projectile"),
        object,
        position: origin.clone().add(new THREE.Vector3(0, 1.15, 0)).addScaledVector(aim.direction, 0.6),
        direction: aim.direction.clone(),
        speed: 12.6,
        radius: 0.28,
        range: ability.range,
        traveled: 0,
        team: caster.team,
        sourceId: caster.id,
        damage: skillDamage(ctx, caster, ability.damage + caster.stats.attack * 0.72),
        damageType: ability.damageType,
        hitRadius: ability.radius,
        pierce: false,
        onHit: (target) => ctx.addStatus(target, { type: "slow", remaining: 2.1, value: 0.38, sourceId: caster.id })
      });
      return true;
    }
    if (ability.key === "W" || ability.key === "R") {
      const point = clampPointFromOrigin(origin, aim.point, ability.range);
      const object = makeAreaObject(color, ability.radius, ability.key === "W" ? "vines" : "storm");
      object.position.copy(point);
      ctx.addArea({
        id: makeId("area"),
        object,
        team: caster.team,
        sourceId: caster.id,
        position: point,
        radius: ability.radius,
        duration: ability.key === "W" ? 4.4 : 6.2,
        remaining: ability.key === "W" ? 4.4 : 6.2,
        tickEvery: ability.key === "W" ? 0.7 : 0.5,
        tickTimer: 0.05,
        damage: skillDamage(ctx, caster, ability.damage + caster.stats.attack * (ability.key === "W" ? 0.18 : 0.26)),
        damageType: ability.damageType,
        slow: ability.key === "W" ? 0.45 : 0.22
      });
      ctx.ring(point, ability.radius, color, 0.55);
      return true;
    }
    if (ability.key === "E") {
      const destination = clampWorld(origin.clone().addScaledVector(aim.direction, ability.range));
      caster.position.copy(destination);
      caster.object.position.copy(destination);
      caster.object.rotation.y = Math.atan2(aim.direction.x, aim.direction.z);
      ctx.trail(origin, caster.team);
      ctx.trail(destination, caster.team);
      ctx.playAudio("dash");
      return true;
    }
  }

  if (archetypeOf(caster) === "tank") {
    if (ability.key === "Q") {
      const destination = clampPointFromOrigin(origin, origin.clone().addScaledVector(aim.direction, ability.range), ability.range);
      const targets = enemiesInCapsule(ctx, caster, origin, destination, ability.radius);
      caster.position.copy(destination);
      caster.object.position.copy(destination);
      caster.object.rotation.y = Math.atan2(aim.direction.x, aim.direction.z);
      ctx.ring(destination, ability.radius, color, 0.45);
      targets.forEach((target) => {
        ctx.damage(caster, target, skillDamage(ctx, caster, ability.damage + caster.stats.attack * 0.55), ability.damageType, origin);
        target.position.addScaledVector(aim.direction, 1.6);
        clampWorld(target.position);
        ctx.addStatus(target, { type: "stun", remaining: 0.65, value: 1, sourceId: caster.id });
      });
      ctx.playAudio("dash");
      return true;
    }
    if (ability.key === "W") {
      caster.shield = Math.max(caster.shield, 260 + caster.level * 42);
      ctx.addStatus(caster, { type: "shield", remaining: 4.8, value: 260 + caster.level * 42, sourceId: caster.id });
      ctx.addStatus(caster, { type: "damageReduction", remaining: 4.8, value: 0.32, sourceId: caster.id });
      ctx.ring(origin, 2.6, color, 0.6);
      return true;
    }
    if (ability.key === "E") {
      ctx.ring(origin, ability.radius, color, 0.52);
      enemiesInRadius(ctx, caster, origin, ability.radius).forEach((target) => {
        ctx.damage(caster, target, skillDamage(ctx, caster, ability.damage + caster.stats.attack * 0.45), ability.damageType, origin);
        ctx.addStatus(target, { type: "stun", remaining: 1.05, value: 1, sourceId: caster.id });
      });
      return true;
    }
    if (ability.key === "R") {
      const object = makeAreaObject(color, ability.radius, "domain");
      object.position.copy(origin);
      ctx.addArea({
        id: makeId("domain"),
        object,
        team: caster.team,
        sourceId: caster.id,
        position: origin.clone(),
        radius: ability.radius,
        duration: 7.5,
        remaining: 7.5,
        tickEvery: 0.35,
        tickTimer: 0.05,
        damage: 0,
        damageType: "true",
        allyReduction: 0.32
      });
      ctx.ring(origin, ability.radius, color, 0.8);
      return true;
    }
  }

  return false;
}

export function createBasicProjectile(source: GameUnit, target: GameUnit, damage: number): Projectile {
  const direction = flatDirection(source.position, target.position);
  const color = colorFor(source);
  const archetype = archetypeOf(source);
  return {
    id: makeId("basic"),
    object: makeProjectileObject(color, archetype === "mage" ? 0.2 : 0.16, archetype === "warrior" ? "blade" : "sphere"),
    position: source.position.clone().add(new THREE.Vector3(0, 1.05, 0)).addScaledVector(direction, 0.45),
    direction,
    speed: archetype === "mage" ? 11.5 : 13,
    radius: 0.2,
    range: source.stats.attackRange + 2.5,
    traveled: 0,
    team: source.team,
    sourceId: source.id,
    damage,
    damageType: archetype === "mage" ? "magic" : "physical",
    hitRadius: 0.7,
    pierce: false
  };
}
