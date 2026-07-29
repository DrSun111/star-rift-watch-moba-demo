import * as THREE from "three";
import { makeId } from "../core/math";
import { FloatingText, Team } from "../core/types";

interface Particle {
  id: string;
  object: THREE.Object3D;
  velocity: THREE.Vector3;
  age: number;
  duration: number;
  spin: number;
}

const teamColors: Record<Team, string> = {
  ally: "#55e9ff",
  enemy: "#ff4778",
  neutral: "#f8d26b"
};

export class EffectSystem {
  readonly floatingTexts: FloatingText[] = [];
  private readonly particles: Particle[] = [];

  constructor(
    private scene: THREE.Scene,
    private overlay: HTMLElement,
    private camera: THREE.Camera
  ) {}

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.age += dt;
      particle.object.position.addScaledVector(particle.velocity, dt);
      particle.object.rotation.y += particle.spin * dt;
      particle.object.scale.multiplyScalar(Math.max(0.88, 1 - dt * 0.34));
      const material = (particle.object as THREE.Mesh).material as THREE.Material | undefined;
      if (material && "opacity" in material) {
        material.opacity = Math.max(0, 1 - particle.age / particle.duration);
      }
      if (particle.age >= particle.duration) {
        this.scene.remove(particle.object);
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i -= 1) {
      const text = this.floatingTexts[i];
      text.age += dt;
      text.worldPosition.y += dt * 1.15;
      const screen = text.worldPosition.clone().project(this.camera);
      const visible = screen.z > -1 && screen.z < 1;
      text.element.style.opacity = visible ? `${Math.max(0, 1 - text.age / text.duration)}` : "0";
      text.element.style.transform = `translate(${(screen.x * 0.5 + 0.5) * this.overlay.clientWidth}px, ${(-screen.y * 0.5 + 0.5) * this.overlay.clientHeight}px) translate(-50%, -50%)`;
      if (text.age >= text.duration) {
        text.element.remove();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  dispose(): void {
    for (const particle of this.particles) this.scene.remove(particle.object);
    for (const text of this.floatingTexts) text.element.remove();
    this.particles.length = 0;
    this.floatingTexts.length = 0;
  }

  burst(position: THREE.Vector3, team: Team, count = 14, scale = 1): void {
    const color = new THREE.Color(teamColors[team]);
    for (let i = 0; i < count; i += 1) {
      const geometry = new THREE.TetrahedronGeometry(0.06 + Math.random() * 0.06 * scale, 0);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const object = new THREE.Mesh(geometry, material);
      object.position.copy(position).add(new THREE.Vector3(0, 0.25 + Math.random() * 0.7, 0));
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.4 + Math.random() * 3.4;
      this.scene.add(object);
      this.particles.push({
        id: makeId("particle"),
        object,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.random() * 2.2, Math.sin(angle) * speed),
        age: 0,
        duration: 0.45 + Math.random() * 0.55,
        spin: (Math.random() - 0.5) * 7
      });
    }
  }

  ring(position: THREE.Vector3, radius: number, color: string, duration = 0.55): THREE.Group {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.82, radius, 64),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    ring.rotation.x = -Math.PI / 2;
    group.position.copy(position).add(new THREE.Vector3(0, 0.04, 0));
    group.add(ring);
    this.scene.add(group);
    this.particles.push({
      id: makeId("ring"),
      object: group,
      velocity: new THREE.Vector3(0, 0.01, 0),
      age: 0,
      duration,
      spin: 0
    });
    return group;
  }

  trail(position: THREE.Vector3, team: Team): void {
    const color = teamColors[team];
    const object = new THREE.Mesh(
      new THREE.CircleGeometry(0.22 + Math.random() * 0.13, 16),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    object.rotation.x = -Math.PI / 2;
    object.position.copy(position).add(new THREE.Vector3((Math.random() - 0.5) * 0.18, 0.03, (Math.random() - 0.5) * 0.18));
    this.scene.add(object);
    this.particles.push({
      id: makeId("trail"),
      object,
      velocity: new THREE.Vector3(0, 0.02, 0),
      age: 0,
      duration: 0.55,
      spin: 0
    });
  }

  damageText(position: THREE.Vector3, value: number, tone: "damage" | "heal" | "xp" = "damage"): void {
    const element = document.createElement("div");
    element.className = `floating-text floating-text-${tone}`;
    element.textContent = tone === "damage" ? `-${Math.round(value)}` : tone === "heal" ? `+${Math.round(value)}` : `+${Math.round(value)} XP`;
    this.overlay.appendChild(element);
    this.floatingTexts.push({
      id: makeId("float"),
      element,
      worldPosition: position.clone().add(new THREE.Vector3(0, 2.2, 0)),
      age: 0,
      duration: 1.05
    });
  }
}
