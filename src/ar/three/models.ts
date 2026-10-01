import * as THREE from "three";
import type { Accessory } from "../../types/accessory";

/**
 * Where each model sits on the head (canonical face space, roughly cm).
 * pos = [left/right, up/down, back/front]. Tune these if something looks off.
 */
export const ANCHORS = {
  glasses: { pos: [0, 2.4, 5.2], scale: 1 },
  cap: { pos: [0, 6, 0.5], scale: 1 },
  hair: { pos: [0, 2, -1.5], scale: 1 },
  bindi: { pos: [0, 4.6, 6.3], scale: 1 },
  chain: { pos: [0, -11, 2.5], scale: 1 },
  earrings: { pos: [0, -0.5, -1], scale: 1 },
};

/** Set true later to hide glasses arms behind the head. */
export const OCCLUDER = false;

const hueOf = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
};

const mat = (hue: number, metal = 0.6, rough = 0.3, double = false) =>
  new THREE.MeshStandardMaterial({
    color: new THREE.Color(`hsl(${hue}, 80%, 55%)`),
    metalness: metal,
    roughness: rough,
    side: double ? THREE.DoubleSide : THREE.FrontSide,
  });

const nameOf = (a: Accessory) => `${a.id} ${a.name}`.toLowerCase();

/** true = drawn in 3D, false = stays on the 2D canvas (makeup, lips, etc.) */
export function is3D(a: Accessory): boolean {
  if (nameOf(a).includes("bindi")) return true;
  if (a.category === "makeup") return false;
  return ["eyes", "forehead", "head", "neck", "ears"].includes(a.anchor);
}

function glasses(hue: number) {
  const g = new THREE.Group();
  const frame = mat(hue, 0.9, 0.2);
  const lens = new THREE.MeshStandardMaterial({
    color: 0x111122,
    transparent: true,
    opacity: 0.55,
    metalness: 0.4,
    roughness: 0.1,
    side: THREE.DoubleSide,
  });
  for (const x of [-3.7, 3.7]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.28, 16, 48), frame);
    ring.position.x = x;
    const l = new THREE.Mesh(new THREE.CircleGeometry(2.7, 40), lens);
    l.position.x = x;
    g.add(ring, l);
  }
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.4, 12), frame);
  bridge.rotation.z = Math.PI / 2;
  g.add(bridge);
  for (const x of [-7, 7]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 10), frame);
    arm.position.set(x, 0, -5);
    g.add(arm);
  }
  return g;
}

function cap(hue: number) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(8.6, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(hue, 0.1, 0.7, true)
  );
  body.scale.y = 0.85;
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(7, 7.4, 0.5, 40, 1, false, 0, Math.PI),
    mat(hue, 0.1, 0.6, true)
  );
  brim.rotation.y = -Math.PI / 2; // half-disc faces forward (+z)
  brim.position.set(0, 0.2, 5.4);
  brim.scale.set(1, 1, 1.1);
  const button = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), mat(hue + 40));
  button.position.y = 7.3;
  g.add(body, brim, button);
  return g;
}

function hair(hue: number) {
  const g = new THREE.Group();
  const m = mat(hue, 0.15, 0.55, true);
  // sphere shell with the front wedge cut out so the face stays visible
  const wedge = 0.8;
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(9.2, 48, 32, Math.PI / 2 + wedge, Math.PI * 2 - wedge * 2, 0, Math.PI * 0.78),
    m
  );
  shell.scale.y = 1.1;
  g.add(shell);
  return g;
}

function bindi(hue: number) {
  const g = new THREE.Group();
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), mat(hue, 0.2, 0.4, true));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.07, 8, 24), mat(hue + 30, 0.9, 0.2));
  g.add(dot, ring);
  return g;
}

function chain(hue: number) {
  const g = new THREE.Group();
  const gold = mat((hue % 60) + 30, 1, 0.2);
  const n = 40;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 0.12 + (i / (n - 1)) * Math.PI * 0.76; // U shape
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.13, 8, 14), gold);
    link.position.set(Math.cos(a) * -8, -Math.sin(a) * 6, Math.sin(a) * 1.5);
    link.rotation.set(i % 2 ? Math.PI / 2 : 0, a, 0);
    g.add(link);
  }
  const pendant = new THREE.Mesh(new THREE.OctahedronGeometry(1.1), mat(hue, 0.9, 0.1));
  pendant.position.set(0, -6.8, 1.6);
  pendant.scale.y = 1.4;
  g.add(pendant);
  return g;
}

function earrings(hue: number) {
  const g = new THREE.Group();
  const gold = mat((hue % 60) + 30, 1, 0.2);
  for (const x of [-7.4, 7.4]) {
    const stud = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), gold);
    stud.position.set(x, 0, 0);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), mat(hue, 0.9, 0.1));
    drop.position.set(x, -1.8, 0);
    const link = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), gold);
    link.position.set(x, -0.9, 0);
    g.add(stud, link, drop);
  }
  return g;
}

export function build3D(a: Accessory): THREE.Object3D | null {
  const hue = hueOf(a.id);
  const n = nameOf(a);
  let obj: THREE.Object3D;
  let key: keyof typeof ANCHORS;

  if (n.includes("bindi")) {
    obj = bindi(hue);
    key = "bindi";
  } else if (a.anchor === "eyes") {
    obj = glasses(hue);
    key = "glasses";
  } else if (a.anchor === "ears") {
    obj = earrings(hue);
    key = "earrings";
  } else if (a.anchor === "neck") {
    obj = chain(hue);
    key = "chain";
  } else if (a.anchor === "head" || a.anchor === "forehead") {
    const isHair = a.category === "hair" || n.includes("hair");
    obj = isHair ? hair(hue) : cap(hue);
    key = isHair ? "hair" : "cap";
  } else {
    return null;
  }

  const { pos, scale } = ANCHORS[key];
  obj.position.set(pos[0], pos[1], pos[2]);
  obj.scale.setScalar(scale);
  const wrap = new THREE.Group();
  wrap.add(obj);
  wrap.userData.pop = 0; // drives the pop-in animation
  return wrap;
}