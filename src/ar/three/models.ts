import * as THREE from "three";
import type { Accessory } from "../../types/accessory";
import { eyewearBuilders } from "./builders/eyewear";
import { headwearBuilders } from "./builders/headwear";
import { hairBuilders } from "./builders/hair";
import { jewelryBuilders } from "./builders/jewelry";
import { funBuilders } from "./builders/fun";
import { maskBuilders } from "./builders/masks";

/**
 * Where each group of items sits on the head (canonical face space, roughly cm).
 * pos = [left/right, up/down, back/front]. Tune these if something looks off.
 */
type Anchor = { pos: [number, number, number]; scale: number };

export const ANCHORS: Record<string, Anchor> = {
  eyewear: { pos: [0, 2.4, 5.4], scale: 1 },
  headwear: { pos: [0, 5.2, 1.5], scale: 1 },
  hair: { pos: [0, 0, 0.5], scale: 1 },
  fun: { pos: [0, 1, 1], scale: 1 }, // ears, horns, halo
  masks: { pos: [0, 2.2, 3.5], scale: 1 },
  nose: { pos: [0, -1.7, 5.8], scale: 1 },
  headphones: { pos: [0, 2, 0.5], scale: 1 },
  neck: { pos: [0, -9.5, 1], scale: 1 }, // necklaces
  ears: { pos: [0, -1, -1.5], scale: 1 }, // earrings
  tikka: { pos: [0, 5.2, 6], scale: 1 }, // maang tikka
  mustache: { pos: [0, -2.6, 5.6], scale: 1 },
};

/** Set true later to hide glasses arms behind the head. */
export const OCCLUDER = false;
export const DEBUG_ANCHORS = false;

/* ---------------------------------------------------------------
   Registry: accessory id -> { builder, anchor group }
---------------------------------------------------------------- */
type Entry = { make: () => THREE.Group; anchor: string };
const REGISTRY: Record<string, Entry> = {};

const add = (
  builders: Record<string, () => THREE.Group>,
  anchorOf: (id: string) => string,
) => {
  for (const id of Object.keys(builders)) {
    REGISTRY[id] = { make: builders[id], anchor: anchorOf(id) };
  }
};

add(eyewearBuilders, () => "eyewear");
add(headwearBuilders, () => "headwear");
add(hairBuilders, () => "hair");
add(jewelryBuilders, (id) => {
  if (
    id === "earrings" ||
    id === "hoops" ||
    id === "studs" ||
    id === "ear-cuffs"
  )
    return "ears";
  if (id === "maang-tikka") return "tikka";
  if (id === "nose-stud" || id === "septum-ring") return "nose";
  return "neck";
});
add(funBuilders, (id) => {
  if (id === "mustache") return "mustache";
  if (id === "pilot-goggles") return "eyewear";
  if (id === "clown-nose") return "nose";
  if (id === "headphones") return "headphones";
  if (id === "bandana") return "headwear";
  return "fun";
});
add(maskBuilders, () => "masks");

/** true = drawn in 3D, false = stays on the 2D canvas (makeup: lips, liner, bindi) */
export function is3D(a: Accessory): boolean {
  return !!REGISTRY[a.id];
}

export function build3D(a: Accessory): THREE.Object3D | null {
  const entry = REGISTRY[a.id];
  if (!entry) return null;

  const obj = entry.make();
  const { pos, scale } = ANCHORS[entry.anchor];
  obj.position.set(pos[0], pos[1], pos[2]);
  obj.scale.setScalar(scale);

  const wrap = new THREE.Group();
  wrap.add(obj);
  wrap.userData.pop = 0; // drives the pop-in animation
  return wrap;
}

/** Free GPU memory when an accessory is taken off. */
export function disposeObject(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (!mat) return;
    (Array.isArray(mat) ? mat : [mat]).forEach((m) => {
      (m as THREE.MeshStandardMaterial).map?.dispose();
      m.dispose();
    });
  });
}
