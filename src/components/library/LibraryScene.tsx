"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type Place = "hall" | "shelves" | "stairs" | "gallery";
const viewpoints: Record<Place, number[]> = {
  hall: [0, 2.4, 13],
  shelves: [-4.8, 2, 0.5],
  stairs: [6.5, 2.5, 5],
  gallery: [9.8, 8, -1],
};

export function LibraryScene({
  place,
  count,
  onBook,
  onOwner,
  onError,
}: {
  place: Place;
  count: number;
  onBook: (index: number) => void;
  onOwner: () => void;
  onError: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef({
    place,
    onBook,
    onOwner,
    onError,
  });
  useEffect(() => {
    state.current = {
      place,
      onBook,
      onOwner,
      onError,
    };
  }, [place, onBook, onOwner, onError]);
  useEffect(() => {
    const container = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      state.current.onError();
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.setClearColor("#123789");
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#123789", 24, 65);
    const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 100);
    camera.position.set(
      ...(viewpoints[state.current.place] as [number, number, number]),
    );
    const ink = new THREE.MeshBasicMaterial({ color: "#080e17" });
    const blue = new THREE.MeshBasicMaterial({ color: "#1646a1" });
    const ivory = new THREE.MeshBasicMaterial({ color: "#d8d0b7" });
    const rust = new THREE.MeshBasicMaterial({ color: "#793025" });
    const gold = new THREE.MeshBasicMaterial({ color: "#b89143" });
    const wood = new THREE.MeshBasicMaterial({ color: "#241c1e" });
    const materials = [
      rust,
      gold,
      ivory,
      new THREE.MeshBasicMaterial({ color: "#284262" }),
      new THREE.MeshBasicMaterial({ color: "#59332d" }),
    ];
    const pickables: THREE.Object3D[] = [];
    const box = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      mat: THREE.Material,
      outline = false,
    ) => {
      const geometry = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      if (outline) {
        const lines = new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry),
          new THREE.LineBasicMaterial({ color: "#090e16" }),
        );
        mesh.add(lines);
      }
      return mesh;
    };
    const curve = (
      points: THREE.Vector3[],
      radius: number,
      mat: THREE.Material,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(points),
          48,
          radius,
          6,
          false,
        ),
        mat,
      );
      scene.add(mesh);
      return mesh;
    };
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    // Every tile, rib, book and stair is spatial geometry, with flat inked shading.
    for (let x = -12; x < 12; x++)
      for (let z = -16; z < 18; z++)
        box(
          1,
          0.08,
          1,
          x + 0.5,
          -0.05,
          z + 0.5,
          (x + z) % 2 === 0 ? ivory : ink,
        );
    box(0.5, 17, 35, -12, 8.5, 0, blue);
    box(0.5, 17, 35, 12, 8.5, 0, blue);
    box(24, 17, 0.5, 0, 8.5, -16, blue);
    box(24, 0.3, 35, 0, 17, 0, blue);
    for (const z of [-13, -7, -1, 5, 11, 17]) {
      for (const side of [-1, 1]) {
        curve(
          [
            v(side * 11.6, 0, z),
            v(side * 10.8, 5, z),
            v(side * 9, 10, z),
            v(side * 5, 14, z),
            v(0, 16.5, z),
          ],
          0.23,
          ink,
        );
        curve(
          [
            v(side * 11.6, 0, z),
            v(side * 11, 6, z),
            v(side * 10, 11, z + 2),
            v(side * 5, 15, z + 3),
            v(0, 16.5, z + 3),
          ],
          0.13,
          ink,
        );
      }
    }
    let bookIndex = 0;
    function shelf(x: number, z: number, rotation: number, base: number) {
      const group = new THREE.Group();
      group.position.set(x, base, z);
      group.rotation.y = rotation;
      scene.add(group);
      const localBox = (
        w: number,
        h: number,
        d: number,
        px: number,
        py: number,
        pz: number,
        mat: THREE.Material,
        outline = false,
      ) => {
        const mesh = box(w, h, d, 0, 0, 0, mat, outline);
        scene.remove(mesh);
        group.add(mesh);
        mesh.position.set(px, py, pz);
        return mesh;
      };
      localBox(3.5, 5.5, 0.4, 0, 2.75, 0, ink);
      for (const sx of [-1.8, 1.8])
        localBox(0.15, 5.7, 0.8, sx, 2.8, 0.15, wood, true);
      for (let row = 0; row < 5; row++) {
        localBox(3.7, 0.13, 0.85, 0, row * 1.05 + 0.2, 0.2, wood, true);
        for (let j = 0; j < 11; j++) {
          const index = bookIndex++;
          const height = 0.6 + ((index * 7) % 5) * 0.06;
          const spine = localBox(
            0.23,
            height,
            0.45,
            -1.52 + j * 0.3,
            row * 1.05 + 0.3 + height / 2,
            0.42,
            materials[index % 5],
            true,
          );
          spine.userData.bookIndex = count ? index % count : -1;
          pickables.push(spine);
          localBox(
            0.15,
            0.025,
            0.015,
            -1.52 + j * 0.3,
            row * 1.05 + 0.48,
            0.653,
            gold,
          );
          localBox(
            0.13,
            0.08,
            0.016,
            -1.52 + j * 0.3,
            row * 1.05 + 0.7,
            0.653,
            index % 3 ? gold : ivory,
          );
        }
      }
      curve(
        [
          v(
            x - Math.cos(rotation) * 1.9,
            base + 5.4,
            z + Math.sin(rotation) * 1.9,
          ),
          v(x, base + 6.8, z),
          v(
            x + Math.cos(rotation) * 1.9,
            base + 5.4,
            z - Math.sin(rotation) * 1.9,
          ),
        ],
        0.16,
        ink,
      );
    }
    for (const base of [0, 6.5]) {
      for (const x of [-8, -4, 0, 4, 8]) shelf(x, -15.5, 0, base);
      for (const z of [-11, -5, 1, 7, 13]) {
        shelf(-11.5, z, Math.PI / 2, base);
        shelf(11.5, z, -Math.PI / 2, base);
      }
    }
    // Upper galleries and their rust handrails.
    for (const side of [-1, 1]) {
      box(2.8, 0.25, 28, side * 10.25, 6.3, -2, ink, true);
      for (let z = -15; z < 12; z += 0.6)
        box(0.065, 1.1, 0.065, side * 8.85, 6.95, z, ink);
      curve(
        [
          v(side * 8.85, 7.55, -16),
          v(side * 8.85, 7.55, -2),
          v(side * 8.85, 7.55, 12),
        ],
        0.085,
        rust,
      );
    }
    box(18, 0.2, 2.5, 0, 6.3, -14, ink);
    for (let x = -9; x < 9; x += 0.55)
      box(0.065, 1.1, 0.065, x, 6.95, -12.7, ink);
    curve(
      [v(-9, 7.55, -12.7), v(0, 7.55, -12.7), v(9, 7.55, -12.7)],
      0.08,
      rust,
    );
    for (const side of [-1, 1]) {
      const points: THREE.Vector3[] = [];
      for (let step = 0; step < 34; step++) {
        const t = step / 33;
        const angle = -Math.PI / 2 + t * Math.PI * 1.35;
        const x = side * (7.6 + Math.cos(angle) * 2.8),
          z = 4 + Math.sin(angle) * 2.8,
          y = t * 6.3;
        const tread = box(2.0, 0.18, 0.5, x, y, z, ivory, true);
        tread.rotation.y = -side * angle;
        const rx = side * (7.6 + Math.cos(angle) * 3.7),
          rz = 4 + Math.sin(angle) * 3.7;
        box(0.055, 1.1, 0.055, rx, y + 0.65, rz, ink);
        points.push(v(rx, y + 1.23, rz));
      }
      curve(points, 0.085, rust);
      box(1.15, 2.8, 0.08, side * 8.7, 9.4, 3.5, rust, true);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.37, 0.035, 8, 40),
        gold,
      );
      ring.position.set(side * 8.7, 9.55, 3.56);
      scene.add(ring);
    }
    // Reading table, an open volume and a small brass lamp.
    box(3.8, 0.2, 1.8, 0, 1.4, 2, rust, true);
    box(3.4, 1.25, 0.2, 0, 0.65, 2.65, wood, true);
    for (const x of [-1.6, 1.6]) box(0.15, 1.4, 1.5, x, 0.65, 2, wood, true);
    box(0.45, 1.4, 0.45, 0, 0.65, 2, wood, true);
    box(1.1, 0.1, 0.7, -0.45, 1.55, 2.3, ivory, true);
    box(0.06, 0.85, 0.06, 0.8, 1.95, 1.85, gold);
    const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.3, 16), gold);
    lamp.position.set(0.8, 2.4, 1.85);
    scene.add(lamp);
    const ownerMap = new THREE.TextureLoader().load("/shop-owner.svg");
    ownerMap.colorSpace = THREE.SRGBColorSpace;
    const owner = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 2.75),
      new THREE.MeshBasicMaterial({
        map: ownerMap,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide,
      }),
    );
    owner.position.set(0, 2.3, 1.1);
    owner.userData.owner = true;
    scene.add(owner);
    // A tall locked door at the end of the room.
    box(1.6, 3.4, 0.12, 0, 8.15, -15.15, gold, true);
    box(0.12, 0.35, 0.08, 0.4, 7.8, -15.04, ink);
    // Batch the illustrated architecture and spines into a handful of draw calls.
    scene.updateMatrixWorld(true);
    const batches = new Map<
      THREE.Material,
      { geometry: THREE.BufferGeometry[]; indices: number[] }
    >();
    const strokes: THREE.BufferGeometry[] = [];
    const originals: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && !Array.isArray(obj.material)) {
        const batch = batches.get(obj.material) ?? {
          geometry: [],
          indices: [],
        };
        // Books use a separate batch so each twelve-face box stays selectable.
        if (obj.userData.bookIndex !== undefined || obj.userData.owner) return;
        batch.geometry.push(obj.geometry.clone().applyMatrix4(obj.matrixWorld));
        batches.set(obj.material, batch);
        originals.push(obj);
      } else if (obj instanceof THREE.LineSegments) {
        strokes.push(obj.geometry.clone().applyMatrix4(obj.matrixWorld));
        originals.push(obj);
      }
    });
    const bookBatches = new Map<
      THREE.Material,
      { geometry: THREE.BufferGeometry[]; indices: number[] }
    >();
    for (const obj of pickables as THREE.Mesh[]) {
      const batch = bookBatches.get(obj.material as THREE.Material) ?? {
        geometry: [],
        indices: [],
      };
      batch.geometry.push(obj.geometry.clone().applyMatrix4(obj.matrixWorld));
      batch.indices.push(obj.userData.bookIndex);
      bookBatches.set(obj.material as THREE.Material, batch);
      originals.push(obj);
    }
    originals.forEach((obj) => {
      obj.removeFromParent();
      if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments)
        obj.geometry.dispose();
    });
    pickables.length = 0;
    for (const [material, batch] of batches) {
      const merged = mergeGeometries(batch.geometry);
      batch.geometry.forEach((g) => g.dispose());
      if (merged) scene.add(new THREE.Mesh(merged, material));
    }
    for (const [material, batch] of bookBatches) {
      const merged = mergeGeometries(batch.geometry);
      batch.geometry.forEach((g) => g.dispose());
      if (merged) {
        const mesh = new THREE.Mesh(merged, material);
        mesh.userData.indices = batch.indices;
        scene.add(mesh);
        pickables.push(mesh);
      }
    }
    pickables.push(owner);
    const mergedStrokes = mergeGeometries(strokes);
    strokes.forEach((g) => g.dispose());
    if (mergedStrokes)
      scene.add(
        new THREE.LineSegments(
          mergedStrokes,
          new THREE.LineBasicMaterial({ color: "#090e16" }),
        ),
      );
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let yaw = 0,
      pitch = 0,
      down = false,
      moved = false,
      lastX = 0,
      lastY = 0,
      frame = 0;
    const start = (e: PointerEvent) => {
      down = true;
      moved = false;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (down) {
        const dx = e.clientX - lastX,
          dy = e.clientY - lastY;
        if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
        yaw -= dx * 0.003;
        pitch = Math.max(-0.65, Math.min(0.7, pitch + dy * 0.003));
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const end = (e: PointerEvent) => {
      down = false;
      if (moved) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickables)[0];
      if (hit?.object.userData.owner) {
        state.current.onOwner();
        return;
      }
      if (hit && hit.faceIndex != null) {
        const index =
          hit.object.userData.indices[Math.floor(hit.faceIndex / 12)];
        if (index >= 0) state.current.onBook(index);
      }
    };
    const cancel = () => {
      down = false;
    };
    const key = (e: KeyboardEvent) => {
      if (document.activeElement !== renderer.domElement) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key))
        e.preventDefault();
      if (e.key === "ArrowLeft") yaw += 0.1;
      if (e.key === "ArrowRight") yaw -= 0.1;
      if (e.key === "ArrowUp") pitch = Math.max(-0.65, pitch - 0.07);
      if (e.key === "ArrowDown") pitch = Math.min(0.7, pitch + 0.07);
    };
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute(
      "aria-label",
      "3D bookshop. Drag or use arrow keys to look around. Use room navigation to move and catalogue to select books.",
    );
    renderer.domElement.addEventListener("pointerdown", start);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", end);
    renderer.domElement.addEventListener("pointercancel", cancel);
    renderer.domElement.addEventListener("keydown", key);
    renderer.domElement.addEventListener(
      "webglcontextlost",
      state.current.onError,
    );
    const resize = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    resize.observe(container);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let previousPlace = state.current.place;
    const render = () => {
      frame = requestAnimationFrame(render);
      if (state.current.place !== previousPlace) {
        yaw = 0;
        pitch = 0;
        previousPlace = state.current.place;
      }
      const target = viewpoints[state.current.place];
      camera.position.lerp(
        v(target[0], target[1], target[2]),
        reduced ? 1 : 0.035,
      );
      const baseYaw =
        state.current.place === "shelves"
          ? 0.7
          : state.current.place === "stairs"
            ? -0.55
            : state.current.place === "gallery"
              ? 0.65
              : 0;
      camera.rotation.order = "YXZ";
      camera.rotation.y = yaw + baseYaw;
      camera.rotation.x = -pitch;
      renderer.render(scene, camera);
    };
    render();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          mats.forEach((m: THREE.Material) => m.dispose());
        }
      });
      ownerMap.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [count]);
  return <div className="library-scene" ref={host} />;
}
