import * as THREE from "three";
import { BRUSH_ZONES } from "./brushes";

function canvasTexture(kind: "grass" | "stone" | "river"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const palettes = {
    grass: ["#223d2e", "#315b3b", "#1b3128", "#3f7048"],
    stone: ["#59616a", "#717b86", "#454c55", "#838c94"],
    river: ["#10566b", "#1da8c1", "#15455f", "#53dcff"]
  };
  const colors = palettes[kind];
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i += 1) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.globalAlpha = 0.18 + Math.random() * 0.35;
    ctx.fillRect(x, y, 2 + Math.random() * 8, 2 + Math.random() * 8);
  }
  if (kind === "river") {
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "#99f9ff";
    for (let i = 0; i < 12; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-20, i * 23);
      ctx.bezierCurveTo(60, i * 23 + 18, 160, i * 23 - 18, 276, i * 23 + 9);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function add(mesh: THREE.Mesh, scene: THREE.Scene): THREE.Mesh {
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}

function makeCrystal(color: string): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.55,
    roughness: 0.24,
    metalness: 0.2
  });
  const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.35, 5), material);
  crystal.position.y = 0.68;
  crystal.castShadow = true;
  group.add(crystal);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.46, 0.24, 6), new THREE.MeshStandardMaterial({ color: "#454a52", roughness: 0.7 }));
  base.position.y = 0.12;
  base.castShadow = true;
  group.add(base);
  return group;
}

function makeTree(): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.2, 6), new THREE.MeshStandardMaterial({ color: "#384039", roughness: 0.82 }));
  trunk.position.y = 0.6;
  trunk.castShadow = true;
  group.add(trunk);
  const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.45, 7), new THREE.MeshStandardMaterial({ color: "#2e6e4f", emissive: "#104329", emissiveIntensity: 0.1, roughness: 0.75 }));
  leaves.position.y = 1.55;
  leaves.castShadow = true;
  group.add(leaves);
  return group;
}

function makeBrushPatch(width: number, depth: number): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: "#2f7a50",
    emissive: "#123d27",
    emissiveIntensity: 0.12,
    roughness: 0.86,
    transparent: true,
    opacity: 0.78
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: "#1d563b",
    emissive: "#0f3525",
    emissiveIntensity: 0.08,
    roughness: 0.92,
    transparent: true,
    opacity: 0.82
  });
  const pad = 0.8;
  const columns = Math.max(5, Math.round(width / 1.15));
  const rows = Math.max(3, Math.round(depth / 1.1));
  for (let x = 0; x < columns; x += 1) {
    for (let z = 0; z < rows; z += 1) {
      const blade = new THREE.Mesh(
        new THREE.PlaneGeometry(0.72 + Math.random() * 0.34, 1.25 + Math.random() * 0.55),
        (x + z) % 2 === 0 ? material : darkMaterial
      );
      blade.position.set(-width / 2 + pad + (x / Math.max(1, columns - 1)) * (width - pad * 2), 0.68, -depth / 2 + pad + (z / Math.max(1, rows - 1)) * (depth - pad * 2));
      blade.rotation.y = Math.random() * Math.PI;
      blade.castShadow = true;
      group.add(blade);

      const cross = blade.clone();
      cross.rotation.y += Math.PI / 2;
      group.add(cross);
    }
  }

  const fog = new THREE.Mesh(
    new THREE.BoxGeometry(width, 1.35, depth),
    new THREE.MeshBasicMaterial({ color: "#2ad87b", transparent: true, opacity: 0.07, depthWrite: false })
  );
  fog.position.y = 0.72;
  group.add(fog);

  const outline = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.035, depth),
    new THREE.MeshBasicMaterial({ color: "#7df2a6", transparent: true, opacity: 0.18 })
  );
  outline.position.y = 0.035;
  group.add(outline);
  return group;
}

export function createMap(scene: THREE.Scene): void {
  scene.background = new THREE.Color("#071424");
  scene.fog = new THREE.Fog("#071424", 42, 96);
  const laneZ = [-16, 0, 16];

  const grassTexture = canvasTexture("grass");
  grassTexture.repeat.set(18, 10);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(132, 68),
    new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 0.92, metalness: 0.02 })
  );
  ground.rotation.x = -Math.PI / 2;
  add(ground, scene);

  const stoneTexture = canvasTexture("stone");
  stoneTexture.repeat.set(18, 1);
  for (const z of laneZ) {
    const lane = new THREE.Mesh(
      new THREE.BoxGeometry(112, 0.18, 7.4),
      new THREE.MeshStandardMaterial({ map: stoneTexture, color: "#b3bdc6", roughness: 0.72, metalness: 0.12 })
    );
    lane.position.set(0, 0.02, z);
    add(lane, scene);

    for (let x = -50; x <= 50; x += 5) {
      const seam = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.055, 6.8),
        new THREE.MeshStandardMaterial({ color: "#bfc7cd", emissive: "#79d9ff", emissiveIntensity: 0.09, roughness: 0.65 })
      );
      seam.position.set(x, 0.16, z);
      add(seam, scene);
    }
  }

  const arenaColors = ["#ff8b56", "#f8d26b", "#5beeff"];
  laneZ.forEach((z, index) => {
    const arena = new THREE.Mesh(
      new THREE.CylinderGeometry(8.8, 9.5, 0.32, 64),
      new THREE.MeshStandardMaterial({ map: stoneTexture, color: "#aeb9c3", emissive: "#314a63", emissiveIntensity: 0.12, roughness: 0.58, metalness: 0.18 })
    );
    arena.position.set(0, 0.16, z);
    arena.receiveShadow = true;
    arena.castShadow = true;
    scene.add(arena);

    const arenaInner = new THREE.Mesh(
      new THREE.CylinderGeometry(5.7, 6.15, 0.36, 64),
      new THREE.MeshStandardMaterial({ color: "#303b4d", emissive: arenaColors[index], emissiveIntensity: 0.18, roughness: 0.42, metalness: 0.28 })
    );
    arenaInner.position.set(0, 0.22, z);
    arenaInner.receiveShadow = true;
    scene.add(arenaInner);

    for (const radius of [6.2, 9.35]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.065, 12, 96),
        new THREE.MeshBasicMaterial({ color: radius > 7 ? arenaColors[index] : "#ffffff", transparent: true, opacity: 0.52, blending: THREE.AdditiveBlending })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.43, z);
      scene.add(ring);
    }
  });

  const riverTexture = canvasTexture("river");
  riverTexture.repeat.set(2, 2);
  for (const z of laneZ) {
    const river = new THREE.Mesh(
      new THREE.RingGeometry(7.4, 8.35, 80),
      new THREE.MeshStandardMaterial({
        map: riverTexture,
        color: "#44dbff",
        emissive: "#00a8d6",
        emissiveIntensity: 0.28,
        transparent: true,
        opacity: 0.68,
        roughness: 0.38
      })
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, 0.46, z);
    add(river, scene);
  }

  for (const z of laneZ) {
    for (const edge of [-3.25, 3.25]) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(106, 0.05, 0.08),
        new THREE.MeshBasicMaterial({ color: edge < 0 ? "#58eaff" : "#ff507b", transparent: true, opacity: 0.42 })
      );
      line.position.set(0, 0.24, z + edge);
      scene.add(line);
    }
  }

  for (let i = 0; i < 108; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = -58 + Math.random() * 116;
    const z = side * (6.2 + Math.random() * 21.2);
    const item = Math.random() > 0.55 ? makeTree() : makeCrystal(Math.random() > 0.5 ? "#66f0ff" : "#ff5f91");
    item.position.set(x, 0, z);
    item.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.75 + Math.random() * 0.75;
    item.scale.setScalar(scale);
    scene.add(item);
  }

  for (const zone of BRUSH_ZONES) {
    const brush = makeBrushPatch(zone.width, zone.depth);
    brush.position.set(zone.x, 0.08, zone.z);
    scene.add(brush);
  }

  for (let i = 0; i < 70; i += 1) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.25 + Math.random() * 0.45, 0),
      new THREE.MeshStandardMaterial({ color: "#5a626c", roughness: 0.86, metalness: 0.04 })
    );
    const side = Math.random() > 0.5 ? -1 : 1;
    rock.position.set(-58 + Math.random() * 116, 0.15, side * (5.4 + Math.random() * 23.5));
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.scale.y = 0.55 + Math.random() * 0.7;
    add(rock, scene);
  }

  for (const x of [-48, -32, -16, 16, 32, 48]) {
    const pylon = new THREE.Group();
    const color = x < 0 ? "#50e9ff" : "#ff4778";
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.58, 1.2, 6), new THREE.MeshStandardMaterial({ color: "#414b58", roughness: 0.7, metalness: 0.35 }));
    base.position.y = 0.6;
    base.castShadow = true;
    pylon.add(base);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.025, 8, 42),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending })
    );
    ring.position.y = 1.45;
    ring.rotation.x = Math.PI / 2;
    pylon.add(ring);
    pylon.position.set(x, 0, x < 0 ? -23 : 23);
    scene.add(pylon);
  }

  for (const x of [-55, 55]) {
    const color = x < 0 ? "#50e9ff" : "#ff4778";
    const shrine = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 5.2, 0.42, 10), new THREE.MeshStandardMaterial({ color: "#566272", roughness: 0.62, metalness: 0.28 }));
    base.position.y = 0.21;
    shrine.add(base);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.16, 10, 60, Math.PI), new THREE.MeshStandardMaterial({ color: "#6c7482", emissive: color, emissiveIntensity: 0.18, roughness: 0.52, metalness: 0.36 }));
    arch.position.y = 2.2;
    arch.rotation.z = Math.PI;
    shrine.add(arch);
    shrine.position.set(x, 0, 0);
    scene.add(shrine);
  }

  const starGeometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  for (let i = 0; i < 300; i += 1) {
    vertices.push((Math.random() - 0.5) * 150, 16 + Math.random() * 54, (Math.random() - 0.5) * 100);
  }
  starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: "#9ceeff", size: 0.06, transparent: true, opacity: 0.75 })
  );
  scene.add(stars);
}
