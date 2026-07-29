import * as THREE from "three";
import { heroById } from "../../data/heroes";
import { BossModelVariant, GameUnit, HeroDefinition, Team } from "../core/types";

const teamTint: Record<Team, string> = {
  ally: "#53e6ff",
  enemy: "#ff3f72",
  neutral: "#e8cf86"
};

function standard(color: string, emissive = "#000000", roughness = 0.55, metalness = 0.35): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emissive === "#000000" ? 0 : 0.45,
    roughness,
    metalness
  });
}

function glow(color: string, opacity = 0.48): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}

function addMesh(parent: THREE.Group, mesh: THREE.Mesh, position: [number, number, number], rotation?: [number, number, number], scale?: [number, number, number]): THREE.Mesh {
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeBlade(color: string): THREE.Group {
  const group = new THREE.Group();
  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.15, 0.08), standard("#25354e", color)), [0, 0.15, 0]);
  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.75, 0.05), glow(color, 0.78)), [0, 1.18, 0], [0, 0, 0.05]);
  addMesh(group, new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 4), glow(color, 0.85)), [0, 2.18, 0], [0, 0, Math.PI]);
  return group;
}

function makeCape(color: string, accent: string): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(-0.72, 0.55);
  shape.lineTo(0.72, 0.48);
  shape.lineTo(0.4, -1.45);
  shape.lineTo(-0.42, -1.58);
  shape.lineTo(-0.72, 0.55);
  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: accent,
    emissiveIntensity: 0.16,
    roughness: 0.75,
    metalness: 0.05,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
}

function createLingxiao(def: HeroDefinition, team: Team): THREE.Group {
  const group = new THREE.Group();
  const primary = team === "enemy" ? "#ff4c7d" : def.palette.primary;
  const dark = team === "enemy" ? "#4c1630" : "#1d385a";
  const accent = def.palette.accent;
  const parts: THREE.Object3D[] = [];

  const body = addMesh(group, new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.82, 4, 8), standard(dark, primary)), [0, 1.45, 0]);
  parts.push(body);
  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.28, 0.5), standard("#34547c", primary)), [0, 1.78, -0.03]);
  addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), standard("#d9c7b7", "#000000", 0.68, 0.1)), [0, 2.25, 0]);
  addMesh(group, new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 5), standard(primary, primary)), [0, 2.62, -0.04], [0.22, 0, 0]);

  for (const side of [-1, 1]) {
    const arm = addMesh(group, new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.62, 4, 8), standard("#6f83a8", primary)), [side * 0.58, 1.42, 0], [0, 0, side * 0.25]);
    const leg = addMesh(group, new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.68, 4, 8), standard("#243c59", "#000000")), [side * 0.23, 0.62, 0], [0, 0, side * 0.08]);
    const blade = makeBlade(primary);
    blade.position.set(side * 0.78, 1.02, 0.12);
    blade.rotation.set(0.1, 0, side * -0.42);
    group.add(blade);
    parts.push(arm, leg, blade);
  }

  const cape = makeCape("#203757", accent);
  cape.position.set(0, 1.25, 0.34);
  cape.rotation.x = -0.26;
  group.add(cape);

  const ring = addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.025, 8, 48), glow(teamTint[team], 0.62)), [0, 0.06, 0], [Math.PI / 2, 0, 0]);
  ring.userData.pulse = true;
  group.userData.parts = parts;
  group.userData.heroId = def.id;
  return group;
}

function createLiyue(def: HeroDefinition, team: Team): THREE.Group {
  const group = new THREE.Group();
  const primary = team === "enemy" ? "#ff5a95" : def.palette.primary;
  const secondary = team === "enemy" ? "#63204e" : def.palette.secondary;
  const parts: THREE.Object3D[] = [];

  addMesh(group, new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.28, 7), standard(secondary, primary, 0.72, 0.08)), [0, 0.86, 0]);
  addMesh(group, new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.62, 4, 8), standard("#dbe8dc", primary, 0.62, 0.16)), [0, 1.55, 0]);
  addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), standard("#ead4c1", "#000000", 0.65, 0.08)), [0, 2.18, 0]);
  addMesh(group, new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.52, 6), standard("#385749", primary, 0.6, 0.2)), [0, 2.54, -0.03], [0.25, 0, 0]);

  for (const side of [-1, 1]) {
    const sleeve = addMesh(group, new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.72, 4, 8), standard("#bde7db", primary, 0.7, 0.08)), [side * 0.46, 1.48, 0.03], [0.1, 0, side * 0.34]);
    const ribbon = addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.76, 0.035), glow(primary, 0.48)), [side * 0.55, 1.03, 0.08], [0.1, 0, side * 0.24]);
    parts.push(sleeve, ribbon);
  }

  const orb = new THREE.Group();
  addMesh(orb, new THREE.Mesh(new THREE.OctahedronGeometry(0.33, 1), standard(primary, primary, 0.28, 0.45)), [0, 0, 0]);
  addMesh(orb, new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.018, 8, 48), glow(def.palette.accent, 0.5)), [0, 0, 0], [Math.PI / 2.8, 0.1, 0]);
  orb.position.set(0.82, 1.74, 0);
  group.add(orb);
  parts.push(orb);

  const halo = addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.022, 8, 48), glow(teamTint[team], 0.58)), [0, 0.06, 0], [Math.PI / 2, 0, 0]);
  halo.userData.pulse = true;
  group.userData.parts = parts;
  group.userData.orb = orb;
  group.userData.heroId = def.id;
  return group;
}

function createZhongshan(def: HeroDefinition, team: Team): THREE.Group {
  const group = new THREE.Group();
  const primary = team === "enemy" ? "#ff5274" : def.palette.primary;
  const armor = team === "enemy" ? "#412335" : "#33404f";
  const parts: THREE.Object3D[] = [];

  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.88, 0.58), standard(armor, primary, 0.5, 0.65)), [0, 1.42, 0]);
  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.28, 0.68), standard("#516172", primary, 0.46, 0.7)), [0, 1.83, 0]);
  addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), standard("#d3c1ae", "#000000", 0.7, 0.12)), [0, 2.24, 0]);
  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.25, 0.5), standard("#27313f", primary, 0.45, 0.8)), [0, 2.43, 0]);

  for (const side of [-1, 1]) {
    const arm = addMesh(group, new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.66, 4, 8), standard("#596677", primary, 0.5, 0.62)), [side * 0.72, 1.34, 0], [0, 0, side * 0.12]);
    const leg = addMesh(group, new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.72, 4, 8), standard("#2d3745", "#000000", 0.5, 0.55)), [side * 0.29, 0.61, 0], [0, 0, side * 0.06]);
    parts.push(arm, leg);
  }

  const shield = new THREE.Group();
  addMesh(shield, new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.12, 0.88), standard("#26313f", primary, 0.36, 0.78)), [0, 0, 0]);
  addMesh(shield, new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.86, 0.58), glow(primary, 0.34)), [-0.02, 0, 0]);
  shield.position.set(-0.9, 1.22, 0.1);
  shield.rotation.z = 0.08;
  group.add(shield);
  parts.push(shield);

  const ring = addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.028, 8, 48), glow(teamTint[team], 0.6)), [0, 0.06, 0], [Math.PI / 2, 0, 0]);
  ring.userData.pulse = true;
  group.userData.parts = parts;
  group.userData.heroId = def.id;
  return group;
}

function createWuxiang(def: HeroDefinition, team: Team): THREE.Group {
  const group = new THREE.Group();
  const primary = team === "enemy" ? "#ffcf7a" : def.palette.primary;
  const secondary = def.palette.secondary;
  const accent = def.palette.accent;
  const parts: THREE.Object3D[] = [];

  addMesh(group, new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.62, 1.15, 8), standard(secondary, primary, 0.36, 0.72)), [0, 1.22, 0]);
  addMesh(group, new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), standard(primary, primary, 0.24, 0.58)), [0, 1.92, 0]);
  addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 12), standard("#f7e4be", "#000000", 0.58, 0.12)), [0, 2.48, 0]);
  addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 8, 56), glow(primary, 0.74)), [0, 2.74, 0], [Math.PI / 2, 0, 0]);
  addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.028, 8, 64), glow(accent, 0.54)), [0, 1.92, 0], [Math.PI / 2, 0.34, 0]);

  for (const side of [-1, 1]) {
    const wing = addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.035), glow(primary, 0.58)), [side * 0.72, 1.72, 0], [0.16, 0, side * 0.62]);
    const blade = addMesh(group, new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.82, 4), glow(accent, 0.72)), [side * 1.02, 1.18, 0.12], [0.18, 0, side * -0.32]);
    parts.push(wing, blade);
  }

  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.1 + i * 0.012, 0), standard(i % 2 ? accent : primary, primary, 0.28, 0.5));
    shard.position.set(Math.cos(angle) * 0.92, 2.16 + (i % 2) * 0.24, Math.sin(angle) * 0.92);
    shard.rotation.set(0.45, angle, 0.25);
    shard.castShadow = true;
    parts.push(shard);
    group.add(shard);
  }

  const ring = addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.028, 8, 56), glow(primary, 0.7)), [0, 0.06, 0], [Math.PI / 2, 0, 0]);
  ring.userData.pulse = true;
  group.userData.parts = parts;
  group.userData.heroId = def.id;
  group.userData.invincible = true;
  return group;
}

export function createHeroModel(heroId: HeroDefinition["id"], team: Team): THREE.Group {
  const def = heroById[heroId];
  const model = heroId === "wuxiang" ? createWuxiang(def, team) : def.archetype === "warrior" ? createLingxiao(def, team) : def.archetype === "mage" ? createLiyue(def, team) : createZhongshan(def, team);
  const variant = Math.abs([...heroId].reduce((total, char) => total + char.charCodeAt(0), 0));
  const height = 0.94 + (variant % 7) * 0.025;
  const width = 0.94 + (variant % 5) * 0.018;
  model.scale.set(width, height, width);
  const crest = new THREE.Mesh(
    new THREE.TorusGeometry(0.26 + (variant % 3) * 0.04, 0.014, 8, 28),
    glow(def.palette.accent, 0.58)
  );
  crest.position.set(0, 2.72 + (variant % 4) * 0.04, -0.02);
  crest.rotation.x = Math.PI / 2 + (variant % 3) * 0.12;
  model.add(crest);
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return model;
}

export function animateHeroModel(model: THREE.Group, time: number, speed = 1): void {
  const bob = Math.sin(time * 2.4 * speed) * 0.04;
  model.position.y = bob;
  const parts = (model.userData.parts || []) as THREE.Object3D[];
  parts.forEach((part, index) => {
    part.rotation.x += Math.sin(time * 1.7 + index) * 0.0008;
    if (part.userData?.pulse) part.scale.setScalar(1 + Math.sin(time * 4) * 0.035);
  });
  const orb = model.userData.orb as THREE.Object3D | undefined;
  if (orb) {
    orb.rotation.y += 0.028;
    orb.position.y = 1.74 + Math.sin(time * 2.8) * 0.1;
  }
}

export function createMinionModel(team: Team): THREE.Group {
  const group = new THREE.Group();
  const color = teamTint[team];
  addMesh(group, new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.45, 4, 7), standard(team === "ally" ? "#27536b" : "#582139", color, 0.55, 0.45)), [0, 0.72, 0]);
  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.18, 0.36), standard(team === "ally" ? "#6bdff1" : "#ff6a8d", color, 0.45, 0.55)), [0, 1.02, 0]);
  addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), standard("#d2beb0")), [0, 1.27, 0]);
  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.08), glow(color, 0.72)), [team === "ally" ? 0.42 : -0.42, 0.8, 0.08], [0, 0, team === "ally" ? -0.35 : 0.35]);
  addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.018, 8, 28), glow(color, 0.45)), [0, 0.04, 0], [Math.PI / 2, 0, 0]);
  return group;
}

export function createGhostModel(): THREE.Group {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: "#c7f0ff",
    emissive: "#7a67ff",
    emissiveIntensity: 0.55,
    roughness: 0.38,
    metalness: 0.08,
    transparent: true,
    opacity: 0.72
  });
  addMesh(group, new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.7, 6, 10), bodyMaterial), [0, 1.0, 0]);
  addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 10), bodyMaterial.clone()), [0, 1.55, 0]);
  addMesh(group, new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.82, 8), bodyMaterial.clone()), [0, 0.55, 0], [Math.PI, 0, 0]);
  addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), glow("#ffef8a", 0.9)), [-0.13, 1.62, -0.31]);
  addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), glow("#ffef8a", 0.9)), [0.13, 1.62, -0.31]);
  for (const side of [-1, 1]) {
    addMesh(group, new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.62, 4, 7), glow("#b98cff", 0.54)), [side * 0.48, 1.05, 0], [0.25, 0, side * 0.46]);
  }
  addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.02, 8, 42), glow("#f8d26b", 0.52)), [0, 0.05, 0], [Math.PI / 2, 0, 0]);
  group.userData.ghost = true;
  return group;
}

export function createBossModel(variant: BossModelVariant = "bulwark", tint = "#f8d26b"): THREE.Group {
  const group = new THREE.Group();
  const core = tint;
  const violet = variant === "blade" ? "#ff4f6f" : variant === "storm" ? "#8d7cff" : "#45d8ff";
  const shell = variant === "blade" ? "#3f2130" : variant === "storm" ? "#252443" : "#20394a";
  const bodyMaterial = standard(shell, violet, 0.38, 0.56);
  const glowMaterial = glow(core, 0.72);

  if (variant === "blade") {
    addMesh(group, new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.28, 1.8, 7), bodyMaterial), [0, 1.36, 0]);
    addMesh(group, new THREE.Mesh(new THREE.DodecahedronGeometry(0.86, 0), standard("#5a2a3b", violet, 0.34, 0.52)), [0, 2.42, 0]);
    addMesh(group, new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.28, 5), standard(core, core, 0.24, 0.48)), [0, 3.28, 0]);
    for (const side of [-1, 1]) {
      addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.85, 0.12), glow(core, 0.82)), [side * 1.48, 1.58, 0.12], [0.1, 0, side * 0.48]);
      addMesh(group, new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.92, 5), glow(violet, 0.62)), [side * 0.8, 3.18, 0], [0, 0, side * 0.62]);
    }
    addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.045, 10, 86), glow(core, 0.48)), [0, 0.08, 0], [Math.PI / 2, 0, 0]);
    group.scale.setScalar(1.32);
  } else if (variant === "storm") {
    addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.86, 18, 14), standard(shell, violet, 0.3, 0.64)), [0, 1.92, 0]);
    addMesh(group, new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 1), standard(core, core, 0.22, 0.55)), [0, 2.44, 0]);
    for (const radius of [1.12, 1.62, 2.08]) {
      addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(radius, 0.04, 10, 78), glow(radius > 1.8 ? core : violet, 0.56)), [0, 2.02, 0], [Math.PI / 2 + radius * 0.1, radius * 0.22, 0]);
    }
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2;
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glow(i % 2 ? core : violet, 0.66));
      shard.position.set(Math.cos(angle) * 1.65, 1.45 + (i % 3) * 0.34, Math.sin(angle) * 1.65);
      shard.rotation.set(0.4, angle, 0.2);
      group.add(shard);
    }
    addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.035, 10, 70), glow(core, 0.42)), [0, 0.08, 0], [Math.PI / 2, 0, 0]);
    group.scale.setScalar(1.2);
  } else {
    addMesh(group, new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.45, 1.55, 9), bodyMaterial), [0, 1.35, 0]);
    addMesh(group, new THREE.Mesh(new THREE.DodecahedronGeometry(1.06, 1), standard("#27455b", violet, 0.34, 0.5)), [0, 2.45, 0]);
    addMesh(group, new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), standard(core, core, 0.24, 0.46)), [0, 3.02, 0]);
    addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.06, 12, 72), glowMaterial), [0, 2.45, 0], [Math.PI / 2, 0, 0]);
    for (const side of [-1, 1]) {
      addMesh(group, new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.32, 5, 9), standard("#36546a", violet, 0.42, 0.46)), [side * 1.22, 1.72, 0], [0.12, 0, side * 0.42]);
      addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.46, 0.92), standard("#6b8693", core, 0.4, 0.5)), [side * 1.66, 1.02, 0.08], [0, 0, side * 0.12]);
      addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.15, 0.12), glow(core, 0.36)), [side * 1.86, 1.52, -0.1], [0, 0, side * 0.16]);
    }
    addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.045, 12, 80), glow(core, 0.46)), [0, 0.08, 0], [Math.PI / 2, 0, 0]);
    group.scale.setScalar(1.38);
  }

  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.72, 5), standard(core, core, 0.3, 0.35));
    crystal.position.set(Math.cos(angle) * 1.5, 2.2 + (i % 2) * 0.34, Math.sin(angle) * 1.5);
    crystal.rotation.set(0.55, angle, 0);
    crystal.castShadow = true;
    group.add(crystal);
  }
  group.userData.boss = true;
  group.userData.bossVariant = variant;
  return group;
}

export function createTowerModel(team: Team): THREE.Group {
  const group = new THREE.Group();
  const color = teamTint[team];
  const dark = team === "ally" ? "#203b57" : "#4a1833";
  addMesh(group, new THREE.Mesh(new THREE.CylinderGeometry(1, 1.25, 2.4, 8), standard("#6d7785", "#000000", 0.74, 0.24)), [0, 1.2, 0]);
  addMesh(group, new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.9, 1.15, 8), standard(dark, color, 0.42, 0.55)), [0, 2.95, 0]);
  addMesh(group, new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 1), standard(color, color, 0.24, 0.5)), [0, 3.78, 0]);
  addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.035, 8, 48), glow(color, 0.42)), [0, 0.08, 0], [Math.PI / 2, 0, 0]);
  return group;
}

export function createBaseModel(team: Team): THREE.Group {
  const group = new THREE.Group();
  const color = teamTint[team];
  const baseColor = team === "ally" ? "#143450" : "#421329";
  addMesh(group, new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.72, 8), standard("#596473", "#000000", 0.7, 0.28)), [0, 0.36, 0]);
  addMesh(group, new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, 1.1, 8), standard(baseColor, color, 0.42, 0.55)), [0, 1.28, 0]);
  addMesh(group, new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), standard(color, color, 0.22, 0.45)), [0, 2.55, 0]);
  addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.045, 8, 64), glow(color, 0.55)), [0, 1.88, 0], [Math.PI / 2, 0, 0]);
  addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.035, 8, 64), glow(color, 0.38)), [0, 0.08, 0], [Math.PI / 2, 0, 0]);
  return group;
}

export function buildUnitFromHero(heroId: HeroDefinition["id"], team: Team, isPlayer: boolean, spawn: THREE.Vector3): Omit<GameUnit, "id"> {
  const def = heroById[heroId];
  return {
    kind: "hero",
    team,
    name: def.name,
    heroId,
    object: createHeroModel(heroId, team),
    position: spawn.clone(),
    velocity: new THREE.Vector3(),
    spawn: spawn.clone(),
    radius: heroId === "wuxiang" ? 0.86 : def.archetype === "tank" ? 0.95 : 0.78,
    stats: { ...def.stats },
    hp: def.stats.maxHp,
    shield: 0,
    level: 1,
    xp: 0,
    gold: 320,
    kills: 0,
    deaths: 0,
    damageDealt: 0,
    damageTaken: 0,
    attackTimer: 0,
    abilityCooldowns: { Q: 0, W: 0, E: 0, R: 0 },
    statuses: [],
    alive: true,
    respawnTimer: 0,
    laneOffset: team === "ally" ? -1.5 : 1.5,
    basicCombo: 0,
    damageFlash: 0,
    isPlayer,
    invulnerable: heroId === "wuxiang"
  };
}
