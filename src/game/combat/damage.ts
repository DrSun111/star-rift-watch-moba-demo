import * as THREE from "three";
import { DamageType, GameUnit } from "../core/types";

export interface DamageRequest {
  source?: GameUnit;
  target: GameUnit;
  amount: number;
  type: DamageType;
  origin?: THREE.Vector3;
  tags?: string[];
}

export interface DamageResult {
  raw: number;
  final: number;
  shielded: number;
  killed: boolean;
}

export function getDamageReduction(unit: GameUnit): number {
  return unit.statuses
    .filter((status) => status.type === "damageReduction" || status.type === "domain")
    .reduce((total, status) => Math.min(0.75, total + status.value), 0);
}

export function calculateDamage(request: DamageRequest): number {
  if (request.type === "true") return Math.max(1, request.amount);
  const defense = request.type === "physical" ? request.target.stats.defense : request.target.stats.defense * 0.72;
  const mitigation = 100 / (100 + Math.max(0, defense));
  const reduction = 1 - getDamageReduction(request.target);
  return Math.max(1, request.amount * mitigation * reduction);
}

export function applyDamage(request: DamageRequest): DamageResult {
  const target = request.target;
  if (!target.alive || target.invulnerable) {
    return { raw: request.amount, final: 0, shielded: 0, killed: false };
  }

  const finalDamage = calculateDamage(request);
  const shielded = Math.min(target.shield, finalDamage);
  target.shield -= shielded;
  const hpDamage = finalDamage - shielded;
  target.hp = Math.max(0, target.hp - hpDamage);
  target.damageTaken += finalDamage;
  target.damageFlash = 0.18;
  if (request.origin) target.lastHitFrom = request.origin.clone();

  if (request.source) {
    request.source.damageDealt += finalDamage;
    target.lastDamagedBy = request.source.id;
  }

  const killed = target.hp <= 0;
  return { raw: request.amount, final: finalDamage, shielded, killed };
}
