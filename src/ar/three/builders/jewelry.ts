import * as THREE from "three";
import {
  GOLD,
  SILVER,
  metal,
  fabric,
  gem,
  pearl,
  tube,
  ring,
  extrude,
} from "./common";

const X_AXIS = new THREE.Vector3(1, 0, 0);

const doubleSided = <T extends THREE.Material>(m: T) => {
  m.side = THREE.DoubleSide;
  return m;
};

const diamond = () =>
  new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    metalness: 0.1,
    roughness: 0.02,
    clearcoat: 1,
    flatShading: true,
    emissive: 0xbae6fd,
    emissiveIntensity: 0.25,
    envMapIntensity: 2,
  });

/* ---------------------------------------------------------------
   Neck curve: front half of a necklace, origin = collar level.
   Ends sit at y = top, the lowest point is top - sag.
---------------------------------------------------------------- */
function neckCurve(o: {
  sag: number;
  top?: number;
  rx?: number;
  rz?: number;
  tMax?: number;
}) {
  const { sag, top = 0, rx = 6.4, rz = 4.6, tMax = 1.3 } = o;
  const pts: THREE.Vector3[] = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = -tMax + (i / n) * 2 * tMax;
    const y =
      top - (sag * (Math.cos(t) - Math.cos(tMax))) / (1 - Math.cos(tMax));
    pts.push(new THREE.Vector3(rx * Math.sin(t), y, rz * Math.cos(t) - 1.6));
  }
  return new THREE.CatmullRomCurve3(pts);
}

/** Interlocking chain links along a curve (every second link is turned 90 degrees). */
function chainLinks(
  curve: THREE.Curve<THREE.Vector3>,
  count: number,
  len: number,
  thick: number,
  mat: THREE.Material,
) {
  const g = new THREE.Group();
  const geo = new THREE.TorusGeometry(len * 0.5, thick, 12, 32);
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(1.35, 1, 1);
    m.position.copy(curve.getPoint(t));
    const q = new THREE.Quaternion().setFromUnitVectors(
      X_AXIS,
      curve.getTangent(t).normalize(),
    );
    const roll = new THREE.Quaternion().setFromAxisAngle(
      X_AXIS,
      i % 2 ? Math.PI / 2 : 0,
    );
    m.quaternion.copy(q.multiply(roll));
    g.add(m);
  }
  return g;
}

function circleShape(r: number) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, 0, Math.PI * 2, false);
  return s;
}

function heartShape(s: number) {
  const h = new THREE.Shape();
  h.moveTo(0, -s);
  h.bezierCurveTo(-s * 1.3, -s * 0.1, -s * 0.9, s * 0.9, 0, s * 0.45);
  h.bezierCurveTo(s * 0.9, s * 0.9, s * 1.3, -s * 0.1, 0, -s);
  return h;
}

/* ===============================================================
   NECKLACES (origin = collar level at the centre of the neck)
================================================================ */
function goldChain() {
  const g = new THREE.Group();
  const gold = metal(GOLD, 0.14);
  const curve = neckCurve({ sag: 4.2 });
  g.add(chainLinks(curve, 36, 0.8, 0.14, gold));

  const p = curve.getPoint(0.5);
  const bail = ring(0.32, 0.08, gold);
  bail.position.set(p.x, p.y - 0.1, p.z + 0.05);
  const stone = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.85),
    gem(0xdc2626),
  );
  stone.position.set(p.x, p.y - 1.15, p.z + 0.1);
  stone.scale.set(0.85, 1.25, 0.6);
  g.add(bail, stone);
  return g;
}

function silverChain() {
  const g = new THREE.Group();
  const silver = metal(SILVER, 0.1);
  const curve = neckCurve({ sag: 5.0 });
  g.add(chainLinks(curve, 40, 0.7, 0.1, silver));

  const p = curve.getPoint(0.5);
  const coin = extrude(circleShape(0.95), 0.2, silver, 0.06);
  coin.position.set(p.x, p.y - 1.25, p.z + 0.15);
  const centre = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 16, 12),
    gem(0x38bdf8),
  );
  centre.position.set(p.x, p.y - 1.25, p.z + 0.4);
  centre.scale.z = 0.5;
  g.add(coin, centre);
  return g;
}

function pearlNecklace() {
  const g = new THREE.Group();
  const mat = pearl();
  const curve = neckCurve({ sag: 3.0, top: 0.8, tMax: 1.25 });
  const n = 30;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const centre = 1 - Math.abs(t - 0.5) * 2; // 0 at the ends, 1 in the middle
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.38 + centre * 0.18, 18, 14),
      mat,
    );
    s.position.copy(curve.getPoint(t));
    g.add(s);
  }
  return g;
}

function choker() {
  const g = new THREE.Group();
  const curve = neckCurve({ sag: 1.0, rx: 6.0, rz: 4.4, tMax: 1.35 });
  const band = tube(
    curve.getPoints(40).map((v) => [v.x, v.y, v.z] as [number, number, number]),
    0.42,
    fabric(0x0b0b10, 0.75),
    false,
    48,
  );
  band.scale.y = 1.8; // flat ribbon look
  g.add(band);

  const p = curve.getPoint(0.5);
  const charm = ring(0.55, 0.12, metal(SILVER, 0.1));
  charm.position.set(p.x, p.y * 1.8 - 0.55, p.z + 0.35);
  const bead = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 14, 10),
    gem(0xa78bfa),
  );
  bead.position.set(p.x, p.y * 1.8 - 0.55, p.z + 0.45);
  g.add(charm, bead);
  return g;
}

function heartPendant() {
  const g = new THREE.Group();
  const gold = metal(GOLD, 0.14);
  const curve = neckCurve({ sag: 4.6 });
  g.add(chainLinks(curve, 40, 0.6, 0.085, gold));

  const p = curve.getPoint(0.5);
  const heart = extrude(heartShape(0.95), 0.3, gold, 0.08);
  heart.position.set(p.x, p.y - 1.15, p.z + 0.1);
  const stone = extrude(heartShape(0.5), 0.2, gem(0xff4d8d), 0.05);
  stone.position.set(p.x, p.y - 1.1, p.z + 0.32);
  g.add(heart, stone);
  return g;
}

/* ===============================================================
   EARRINGS (origin = centre between the ears at lobe height,
   built as a mirrored pair at x = +/-7.6)
================================================================ */
const EAR_X = 7.6;

function pair(make: (side: number) => THREE.Object3D) {
  const g = new THREE.Group();
  for (const side of [1, -1]) {
    const e = make(side);
    e.position.x = side * EAR_X;
    g.add(e);
  }
  return g;
}

function jhumka() {
  const gold = doubleSided(metal(GOLD, 0.18));
  const rim = pearl();
  return pair(() => {
    const e = new THREE.Group();

    // ruby stud on the lobe
    const stud = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 18, 14),
      gem(0xdc2626),
    );
    e.add(stud);

    // bell
    const profile: [number, number][] = [
      [0.01, -0.5],
      [0.55, -0.6],
      [1.1, -1.1],
      [1.45, -1.8],
      [1.45, -2.4],
      [1.3, -2.7],
    ];
    const bell = new THREE.Mesh(
      new THREE.LatheGeometry(
        profile.map(([r, y]) => new THREE.Vector2(r, y)),
        64,
      ),
      gold,
    );
    e.add(bell);

    // detail ring and pearl rim
    const band = ring(1.3, 0.09, gold);
    band.rotation.x = Math.PI / 2;
    band.position.y = -1.5;
    e.add(band);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), rim);
      b.position.set(Math.cos(a) * 1.3, -2.7, Math.sin(a) * 1.3);
      e.add(b);
    }

    // hanging pearl
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), rim);
    drop.position.y = -3.1;
    e.add(drop);
    return e;
  });
}

function hoops() {
  const gold = metal(GOLD, 0.12);
  return pair((side) => {
    const e = new THREE.Group();
    const hoop = ring(1.7, 0.2, gold);
    hoop.rotation.y = side * (Math.PI / 2 - 0.4); // turned so it reads from the front and the side
    hoop.position.y = -1.7;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), gold);
    e.add(hoop, knob);
    return e;
  });
}

function studs() {
  const gold = metal(GOLD, 0.12);
  const dia = diamond();
  return pair(() => {
    const e = new THREE.Group();
    const collar = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), gold);
    collar.scale.set(0.7, 1, 1);
    const stone = new THREE.Mesh(new THREE.OctahedronGeometry(0.58), dia);
    stone.position.x = 0.2;
    e.add(collar, stone);
    return e;
  });
}

/* ===============================================================
   MAANG TIKKA (origin = forehead centre, pendant faces forward,
   a fine chain runs up and back to the hair parting)
================================================================ */
function maangTikka() {
  const g = new THREE.Group();
  const gold = metal(GOLD, 0.15);
  const rim = pearl();

  // fine chain along the head curve
  g.add(
    tube(
      [
        [0, 0.9, -0.05],
        [0, 3.0, -0.8],
        [0, 5.4, -2.4],
        [0, 7.4, -4.8],
      ],
      0.09,
      gold,
      false,
      30,
    ),
  );
  const hook = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), gold);
  hook.position.set(0, 7.4, -4.8);
  g.add(hook);

  // round pendant
  const disc = extrude(circleShape(1.15), 0.25, gold, 0.07);
  disc.position.set(0, -0.2, 0);
  const ruby = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 20, 16),
    gem(0xdc2626),
  );
  ruby.position.set(0, -0.2, 0.2);
  ruby.scale.z = 0.5;
  g.add(disc, ruby);

  // pearls around the pendant
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), rim);
    b.position.set(Math.cos(a) * 1.4, -0.2 + Math.sin(a) * 1.4, 0.1);
    g.add(b);
  }

  // small drop below
  g.add(
    tube(
      [
        [0, -1.5, 0.05],
        [0, -2.0, 0.08],
      ],
      0.07,
      gold,
      false,
      8,
    ),
  );
  const drop = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 14, 10),
    gem(0xdc2626),
  );
  drop.position.set(0, -2.4, 0.1);
  drop.scale.y = 1.3;
  g.add(drop);
  return g;
}

function noseStud() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 16, 12),
    metal(GOLD, 0.12),
  );
  base.position.set(0.8, 0, 0);
  const gemStone = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), diamond());
  gemStone.position.set(0.86, 0.04, 0.22);
  group.add(base, gemStone);
  return group;
}

function septumRing() {
  const group = new THREE.Group();
  const hoop = ring(0.58, 0.12, metal(GOLD, 0.12), Math.PI);
  hoop.rotation.z = Math.PI;
  hoop.position.set(0, -0.25, 0.15);
  group.add(hoop);
  for (const side of [-1, 1]) {
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 10),
      gem(0xf2d48b),
    );
    bead.position.set(side * 0.58, -0.25, 0.15);
    group.add(bead);
  }
  return group;
}

function earCuffs() {
  const gold = metal(GOLD, 0.12);
  return pair((side) => {
    const group = new THREE.Group();
    const cuff = ring(1.25, 0.18, gold, Math.PI * 1.45);
    cuff.rotation.set(Math.PI / 2, 0, side * -0.25);
    cuff.position.set(0, 0.8, 0.25);
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 14, 10),
      gem(0xf3c764),
    );
    bead.position.set(0, 1.9, 0.25);
    group.add(cuff, bead);
    return group;
  });
}

/* ---------------------------------------------------------------
   Registry: accessory id -> builder
---------------------------------------------------------------- */
export const jewelryBuilders: Record<string, () => THREE.Group> = {
  chain: goldChain,
  "silver-chain": silverChain,
  "pearl-necklace": pearlNecklace,
  choker,
  "heart-pendant": heartPendant,
  earrings: jhumka,
  hoops,
  studs,
  "maang-tikka": maangTikka,
  "nose-stud": noseStud,
  "septum-ring": septumRing,
  "ear-cuffs": earCuffs,
};
