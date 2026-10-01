import * as THREE from "three";
import {
  GOLD,
  SILVER,
  ROSE_GOLD,
  metal,
  plastic,
  lensMat,
  mirrorLens,
  fabric,
  lensShape,
  rimTube,
  flatLens,
  tube,
  extrude,
  type LensKind,
} from "./common";

/* ---------------------------------------------------------------
   Generic two-lens glasses
---------------------------------------------------------------- */
interface Spec {
  kind: LensKind;
  w: number;
  h: number;
  rim: number; // frame thickness
  frame: THREE.Material;
  lens: THREE.Material;
  bridge?: "single" | "double" | "none";
  arm?: THREE.Material;
  gap?: number; // half distance between lens centres
}

function glasses(s: Spec) {
  const g = new THREE.Group();
  const gap = s.gap ?? s.w / 2 + 0.8;
  const shape = lensShape(s.kind, s.w, s.h);

  // two lenses (the left one is mirrored so winged shapes point outwards)
  for (const side of [1, -1]) {
    const eye = new THREE.Group();
    eye.add(rimTube(shape, s.rim, s.frame), flatLens(shape, s.lens));
    eye.position.x = side * gap;
    eye.scale.x = side;
    g.add(eye);
  }

  // nose bridge
  const ix = gap - s.w / 2;
  if (s.bridge !== "none" && ix > 0.05) {
    g.add(
      tube(
        [
          [-ix, 0.5, 0],
          [0, 0.95, 0.35],
          [ix, 0.5, 0],
        ],
        s.rim * 0.7,
        s.frame,
        false,
        64,
      ),
    );
    if (s.bridge === "double") {
      g.add(
        tube(
          [
            [-ix, 1.5, 0],
            [0, 1.8, 0.3],
            [ix, 1.5, 0],
          ],
          s.rim * 0.6,
          s.frame,
          false,
          64,
        ),
      );
    }
  }

  // arms with a small ear hook
  const ox = gap + s.w / 2;
  const armMat = s.arm ?? s.frame;
  for (const side of [1, -1]) {
    g.add(
      tube(
        [
          [side * ox, 0.4, 0],
          [side * (ox + 0.1), 0.35, -3.5],
          [side * (ox + 0.2), 0.1, -7.2],
          [side * (ox + 0.18), -0.8, -9.8],
        ],
        s.rim * 0.75,
        armMat,
        false,
        64,
      ),
    );
  }
  return g;
}

/* ---------------------------------------------------------------
   Goggles: ski-style visor with strap
---------------------------------------------------------------- */
function goggles() {
  const g = new THREE.Group();
  const outer = lensShape("rounded", 15.6, 6.6);
  const inner = lensShape("rounded", 13.8, 4.9);
  outer.holes.push(new THREE.Path(inner.getPoints(32)));
  g.add(extrude(outer, 1.6, plastic(0x15151c, 0.4)));

  // iridescent visor
  const visor = new THREE.Mesh(
    new THREE.PlaneGeometry(14.4, 5.6),
    new THREE.MeshPhysicalMaterial({
      color: 0x22d3ee,
      metalness: 0.7,
      roughness: 0.05,
      iridescence: 1,
      iridescenceIOR: 1.6,
      transparent: true,
      opacity: 0.72,
      envMapIntensity: 2,
      side: THREE.DoubleSide,
    }),
  );
  g.add(visor);

  // strap around the head
  g.add(
    tube(
      [
        [-7.8, 0, -0.5],
        [-8.3, 0, -5],
        [-7, 0, -11],
        [-3.5, 0, -14.5],
        [0, 0, -15.3],
        [3.5, 0, -14.5],
        [7, 0, -11],
        [8.3, 0, -5],
        [7.8, 0, -0.5],
      ],
      0.55,
      fabric(0x14141c, 0.8),
      false,
      80,
    ),
  );
  return g;
}

/* ---------------------------------------------------------------
   Cyber visor: one glowing slab
---------------------------------------------------------------- */
function cyberVisor() {
  const g = new THREE.Group();
  const shape = lensShape("rounded", 15, 3.6);
  g.add(
    rimTube(shape, 0.2, plastic(0x0b0b10, 0.25)),
    flatLens(
      shape,
      new THREE.MeshPhysicalMaterial({
        color: 0x22d3ee,
        emissive: 0x7c3aed,
        emissiveIntensity: 0.55,
        metalness: 0.6,
        roughness: 0.06,
        transparent: true,
        opacity: 0.75,
        envMapIntensity: 2,
        side: THREE.DoubleSide,
      }),
    ),
  );
  const dark = plastic(0x0b0b10, 0.3);
  for (const side of [1, -1]) {
    g.add(
      tube(
        [
          [side * 7.5, 0, 0],
          [side * 7.8, 0, -4],
          [side * 7.8, -0.2, -8],
          [side * 7.8, -1.3, -10.4],
        ],
        0.28,
        dark,
        false,
        40,
      ),
    );
  }
  return g;
}

/* ---------------------------------------------------------------
   Monocle: one gold lens with a hanging chain
---------------------------------------------------------------- */
function monocle() {
  const g = new THREE.Group();
  const shape = lensShape("round", 5, 5);
  const eye = new THREE.Group();
  eye.position.x = 3.5;
  eye.add(
    rimTube(shape, 0.2, metal(GOLD, 0.15)),
    flatLens(shape, lensMat(0xffffff, 0.12)),
  );
  g.add(eye);
  g.add(
    tube(
      [
        [5.9, -1.2, 0],
        [6.4, -4, 0.5],
        [6.6, -8, 0.2],
        [6.1, -12, 0],
      ],
      0.06,
      metal(GOLD, 0.2),
      false,
      40,
    ),
  );
  return g;
}

/* ---------------------------------------------------------------
   Neon material
---------------------------------------------------------------- */
const neonPink = () =>
  new THREE.MeshPhysicalMaterial({
    color: 0xff2d95,
    emissive: 0xff2d95,
    emissiveIntensity: 0.9,
    roughness: 0.3,
    clearcoat: 1,
  });

/* ---------------------------------------------------------------
   Registry: accessory id -> builder
---------------------------------------------------------------- */
export const eyewearBuilders: Record<string, () => THREE.Group> = {
  aviator: () =>
    glasses({
      kind: "aviator",
      w: 5.9,
      h: 5.0,
      rim: 0.09,
      frame: metal(GOLD, 0.15),
      lens: lensMat(0x1a1d2e, 0.82),
      bridge: "double",
    }),
  "round-specs": () =>
    glasses({
      kind: "round",
      w: 4.8,
      h: 4.8,
      rim: 0.2,
      frame: plastic(0x14141a),
      lens: lensMat(0xffffff, 0.1),
    }),
  goggles,
  wayfarer: () =>
    glasses({
      kind: "rounded",
      w: 5.6,
      h: 4.2,
      rim: 0.28,
      frame: plastic(0x0d0d12, 0.25),
      lens: lensMat(0x111118, 0.85),
    }),
  "neon-shades": () =>
    glasses({
      kind: "rounded",
      w: 6.2,
      h: 3.6,
      rim: 0.2,
      frame: neonPink(),
      lens: lensMat(0x7c3aed, 0.6),
    }),
  "rose-specs": () =>
    glasses({
      kind: "round",
      w: 5,
      h: 5,
      rim: 0.09,
      frame: metal(ROSE_GOLD, 0.15),
      lens: lensMat(0xf472b6, 0.38),
    }),
  "gold-specs": () =>
    glasses({
      kind: "square",
      w: 5.2,
      h: 3.8,
      rim: 0.1,
      frame: metal(GOLD, 0.12),
      lens: lensMat(0xffffff, 0.1),
    }),
  "mirror-shades": () =>
    glasses({
      kind: "round",
      w: 5.4,
      h: 5.2,
      rim: 0.12,
      frame: metal(SILVER, 0.1),
      lens: mirrorLens(),
      bridge: "double",
    }),
  "cat-eye": () =>
    glasses({
      kind: "cat",
      w: 5.8,
      h: 4.6,
      rim: 0.2,
      frame: plastic(0x1a0a14, 0.2),
      lens: lensMat(0x241226, 0.78),
    }),
  "heart-shades": () =>
    glasses({
      kind: "heart",
      w: 5.6,
      h: 5,
      rim: 0.2,
      frame: plastic(0xf43f7f, 0.22),
      lens: lensMat(0xff5c8a, 0.55),
    }),
  "star-shades": () =>
    glasses({
      kind: "star",
      w: 6.8,
      h: 6.8,
      rim: 0.18,
      frame: plastic(0xfacc15, 0.2),
      lens: lensMat(0xf59e0b, 0.55),
      bridge: "none",
      gap: 3.6,
    }),
  "hex-frames": () =>
    glasses({
      kind: "hex",
      w: 5.2,
      h: 4.8,
      rim: 0.1,
      frame: metal(0x2b2b33, 0.2),
      lens: lensMat(0xffffff, 0.1),
    }),
  "cyber-visor": cyberVisor,
  monocle,
};
