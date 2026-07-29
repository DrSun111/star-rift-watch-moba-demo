import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createHeroModel, animateHeroModel } from "../game/heroes/heroFactory";
import { HeroDefinition, Team } from "../game/core/types";

interface HeroPreviewProps {
  heroId: HeroDefinition["id"];
  team?: Team;
  launch?: boolean;
}

export function HeroPreview({ heroId, team = "ally", launch = false }: HeroPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(1.7, window.devicePixelRatio));
    renderer.shadowMap.enabled = true;

    const hemi = new THREE.HemisphereLight("#c7f8ff", "#172135", 1.7);
    scene.add(hemi);
    const key = new THREE.DirectionalLight("#ffe7b0", 2.8);
    key.position.set(4, 8, 7);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.PointLight("#61eaff", 3.8, 9);
    rim.position.set(-3.5, 2.8, 2);
    scene.add(rim);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.5, 0.28, 9),
      new THREE.MeshStandardMaterial({ color: "#1b2c45", emissive: "#235a86", emissiveIntensity: 0.22, roughness: 0.48, metalness: 0.34 })
    );
    platform.position.y = -0.1;
    platform.receiveShadow = true;
    scene.add(platform);

    const model = createHeroModel(heroId, team);
    model.scale.setScalar(1.35);
    model.position.y = 0.02;
    scene.add(model);

    let distance = 8.2;
    let rotation = -0.35;
    let dragging = false;
    let lastX = 0;
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    };
    const pointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    };
    const pointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      rotation += (event.clientX - lastX) * 0.008;
      lastX = event.clientX;
    };
    const pointerUp = (event: PointerEvent) => {
      dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      distance = Math.min(10.5, Math.max(6.1, distance + Math.sign(event.deltaY) * 0.5));
    };

    const tick = (timeMs: number) => {
      const time = timeMs / 1000;
      if (!dragging) rotation += 0.0025;
      const launchLift = launch ? Math.min(1, time % 1.2) * 0.8 : 0;
      model.rotation.y = rotation;
      model.position.y = 0.02 + launchLift;
      animateHeroModel(model, time);
      camera.position.set(0, 2.45, distance);
      camera.lookAt(0, 1.35, 0);
      platform.rotation.y += 0.004;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("wheel", wheel, { passive: false });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("wheel", wheel);
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
    };
  }, [heroId, team, launch]);

  return <canvas className="hero-preview-canvas" ref={canvasRef} aria-label="英雄实时三维预览" />;
}
