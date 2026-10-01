import * as THREE from "three";
import { curvedSurfaceZ, makeCurvedShell } from "./curvedShell";

const MASK_WIDTH = 15;
const MASK_HEIGHT = 19;
const MASK_DEPTH = 8;
const MASK_MIN_Y = -6.2;
const MASK_MAX_Y = 5.8;

function maskShell(color: number, minY = MASK_MIN_Y, maxY = MASK_MAX_Y) {
  return makeCurvedShell(MASK_WIDTH, MASK_HEIGHT, MASK_DEPTH, 112, color, {
    minY,
    maxY,
  });
}

function almond(w: number, h: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-w, 0);
  shape.quadraticCurveTo(0, h, w, 0);
  shape.quadraticCurveTo(0, -h, -w, 0);
  return shape;
}

function curvedShape(
  shape: THREE.Shape,
  color: number,
  centerX: number,
  centerY: number,
  offset = 0.08,
  emissive = 0,
) {
  const geometry = new THREE.ShapeGeometry(shape, 32);
  const position = geometry.getAttribute("position");
  for (let index = 0; index < position.count; index++) {
    const x = position.getX(index) + centerX;
    const y = position.getY(index) + centerY;
    position.setXYZ(
      index,
      x,
      y,
      curvedSurfaceZ(MASK_WIDTH, MASK_HEIGHT, MASK_DEPTH, x, y) + offset,
    );
  }
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  if (emissive) {
    material.emissive.setHex(emissive);
    material.emissiveIntensity = 1.6;
  }
  return new THREE.Mesh(geometry, material);
}

function line(
  group: THREE.Group,
  points: [number, number][],
  color: number,
  radius = 0.045,
) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(
      ([x, y]) =>
        new THREE.Vector3(
          x,
          y,
          curvedSurfaceZ(MASK_WIDTH, MASK_HEIGHT, MASK_DEPTH, x, y) + 0.12,
        ),
    ),
  );
  group.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, radius, 10, false),
      new THREE.MeshStandardMaterial({ color, roughness: 0.55 }),
    ),
  );
}

function eyeLenses(group: THREE.Group, color: number, scale = 1, glow = 0) {
  for (const x of [-3.2, 3.2]) {
    group.add(
      curvedShape(almond(1.1 * scale, 0.5 * scale), color, x, 0.2, 0.1, glow),
    );
  }
}

function webHeroMask() {
  const group = new THREE.Group();
  group.add(maskShell(0xc62832));
  eyeLenses(group, 0xf6fbff, 1.08);
  for (const side of [-1, 1]) {
    line(
      group,
      [
        [0, 5.6],
        [side * 1.5, 3.8],
        [side * 3.2, 0.2],
        [side * 6.6, 4.6],
      ],
      0x171923,
      0.045,
    );
    line(
      group,
      [
        [side * 6.9, 2.1],
        [side * 4.7, 0.2],
        [side * 3.2, 0.2],
      ],
      0x171923,
      0.045,
    );
    line(
      group,
      [
        [side * 6.1, -2.7],
        [side * 4.0, -2.4],
        [side * 3.2, 0.2],
      ],
      0x171923,
      0.045,
    );
    const panel = new THREE.Shape();
    panel.moveTo(0, 0.7);
    panel.lineTo(side * 1.1, -0.4);
    panel.lineTo(side * 0.4, -2.2);
    panel.lineTo(-side * 0.7, -1.9);
    panel.closePath();
    group.add(curvedShape(panel, 0x17458a, side * 5.2, 0.6));
  }
  return group;
}

function batCowl() {
  const group = new THREE.Group();
  group.add(maskShell(0x171922));
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(1.0, 4.5, 32),
      new THREE.MeshStandardMaterial({ color: 0x171922, roughness: 0.35 }),
    );
    ear.position.set(
      side * 4.0,
      5.8,
      curvedSurfaceZ(MASK_WIDTH, MASK_HEIGHT, MASK_DEPTH, side * 4.0, 5.8),
    );
    ear.rotation.z = -side * 0.12;
    group.add(ear);
  }
  return group;
}

function ironHeroMask() {
  const group = new THREE.Group();
  group.add(maskShell(0xb9382d));
  line(
    group,
    [
      [-4.7, 2.3],
      [-3.4, 4.0],
      [0, 4.7],
      [3.4, 4.0],
      [4.7, 2.3],
    ],
    0xd8aa43,
    0.18,
  );
  for (const side of [-1, 1]) {
    line(
      group,
      [
        [side * 3.1, 0.8],
        [side * 4.7, 0.1],
        [side * 3.7, -2.2],
      ],
      0xd8aa43,
      0.16,
    );
    line(
      group,
      [
        [side * 2.9, -1.5],
        [side * 1.8, -3.1],
        [side * 0.6, -3.8],
      ],
      0xd8aa43,
      0.12,
    );
  }
  eyeLenses(group, 0x72efff, 0.72, 0x12c9ed);
  return group;
}

function dominoMask() {
  const group = new THREE.Group();
  group.add(maskShell(0x12141a, -1.75, 3.2));
  return group;
}

function zorroMask() {
  const group = new THREE.Group();
  group.add(maskShell(0x17151a, -1.75, 3.2));
  for (const side of [-1, 1]) {
    line(
      group,
      [
        [side * 4.8, 2.6],
        [side * 6.4, 3.1],
        [side * 7.4, 2.8],
      ],
      0x17151a,
      0.1,
    );
  }
  return group;
}

function ninjaWrap() {
  const group = new THREE.Group();
  group.add(maskShell(0x202b42));
  const band = new THREE.Shape();
  band.moveTo(-5.2, 0.9);
  band.quadraticCurveTo(0, 1.6, 5.2, 0.9);
  band.lineTo(5.0, 0.4);
  band.quadraticCurveTo(0, 1.0, -5.0, 0.4);
  band.closePath();
  group.add(curvedShape(band, 0x101827, 0, 0));
  for (const side of [-1, 1])
    line(
      group,
      [
        [side * 4.2, -1.4],
        [side * 5.6, -3.0],
        [side * 6.8, -3.4],
      ],
      0x101827,
      0.13,
    );
  return group;
}

function theatricalMask() {
  const group = new THREE.Group();
  group.add(maskShell(0xe9dfc9));
  line(
    group,
    [
      [-2.8, -6.0],
      [-1.3, -6.2],
      [0, -6.0],
      [1.3, -6.2],
      [2.8, -6.0],
    ],
    0x594446,
    0.075,
  );
  for (const side of [-1, 1]) {
    line(
      group,
      [
        [side * 3.0, -1.5],
        [side * 3.8, -1.7],
        [side * 4.5, -1.5],
      ],
      0xa64f50,
      0.07,
    );
    line(
      group,
      [
        [side * 4.5, 3.4],
        [side * 2.4, 3.8],
        [side * 1.7, 3.3],
      ],
      0x69534a,
      0.12,
    );
  }
  return group;
}

function venetianMask() {
  const group = new THREE.Group();
  group.add(maskShell(0x243c5a, -2.1, 3.9));
  for (const side of [-1, 1]) {
    const flourish = new THREE.Shape();
    flourish.moveTo(0, 0);
    flourish.bezierCurveTo(side * 1.4, 1.1, side * 2.0, -0.2, side * 0.8, -0.5);
    flourish.bezierCurveTo(side * 1.6, 0.3, side * 0.5, 0.55, 0, 0);
    group.add(curvedShape(flourish, 0xd5b46a, side * 4.1, 3.4, 0.11));
  }
  const jewel = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.62),
    new THREE.MeshPhysicalMaterial({
      color: 0x61d5c5,
      metalness: 0.15,
      roughness: 0.12,
      emissive: 0x123c38,
    }),
  );
  jewel.position.set(
    0,
    5.2,
    curvedSurfaceZ(MASK_WIDTH, MASK_HEIGHT, MASK_DEPTH, 0, 5.2) + 0.2,
  );
  group.add(jewel);
  return group;
}

export const maskBuilders: Record<string, () => THREE.Group> = {
  "web-hero-mask": webHeroMask,
  "bat-cowl": batCowl,
  "iron-hero-mask": ironHeroMask,
  "domino-mask": dominoMask,
  "zorro-mask": zorroMask,
  "ninja-wrap": ninjaWrap,
  "theatrical-mask": theatricalMask,
  "venetian-mask": venetianMask,
};
