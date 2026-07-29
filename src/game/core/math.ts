import * as THREE from "three";

export const WORLD_MIN_X = -62;
export const WORLD_MAX_X = 62;
export const WORLD_MIN_Z = -30;
export const WORLD_MAX_Z = 30;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampWorld(position: THREE.Vector3): THREE.Vector3 {
  position.x = clamp(position.x, WORLD_MIN_X, WORLD_MAX_X);
  position.z = clamp(position.z, WORLD_MIN_Z, WORLD_MAX_Z);
  position.y = 0;
  return position;
}

export function flatDistance(a: THREE.Vector3, b: THREE.Vector3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function flatDirection(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3 {
  const direction = new THREE.Vector3(to.x - from.x, 0, to.z - from.z);
  if (direction.lengthSq() < 0.0001) return new THREE.Vector3(1, 0, 0);
  return direction.normalize();
}

export function clampPointFromOrigin(origin: THREE.Vector3, target: THREE.Vector3, maxRange: number): THREE.Vector3 {
  const direction = flatDirection(origin, target);
  const distance = Math.min(maxRange, flatDistance(origin, target));
  return clampWorld(origin.clone().addScaledVector(direction, distance));
}

export function approach(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}

export function damp(current: THREE.Vector3, target: THREE.Vector3, lambda: number, dt: number): THREE.Vector3 {
  const factor = 1 - Math.exp(-lambda * dt);
  return current.lerp(target, factor);
}

export function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;
}

export function secondsToClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function pointInCapsule(point: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, radius: number): boolean {
  const ab = new THREE.Vector3(b.x - a.x, 0, b.z - a.z);
  const ap = new THREE.Vector3(point.x - a.x, 0, point.z - a.z);
  const abLenSq = Math.max(0.0001, ab.lengthSq());
  const t = clamp(ap.dot(ab) / abLenSq, 0, 1);
  const closest = a.clone().addScaledVector(ab, t);
  return flatDistance(point, closest) <= radius;
}

export function teamSign(team: "ally" | "enemy" | "neutral"): number {
  return team === "ally" ? 1 : team === "enemy" ? -1 : 0;
}
