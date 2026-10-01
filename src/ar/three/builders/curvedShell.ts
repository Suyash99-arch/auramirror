import * as THREE from "three";

type CurvedShellOptions = {
  minY?: number;
  maxY?: number;
};

const EYE_X = 3.2;
const EYE_Y = 0.2;
const EYE_RADIUS_X = 1.3;
const EYE_RADIUS_Y = 0.72;

export function curvedSurfaceZ(
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
) {
  const nx = x / (width / 2);
  const ny = y / (height / 2);
  return (depth / 2) * Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
}

function insideEye(x: number, y: number) {
  return [-EYE_X, EYE_X].some(
    (centerX) =>
      ((x - centerX) / EYE_RADIUS_X) ** 2 + ((y - EYE_Y) / EYE_RADIUS_Y) ** 2 <
      1,
  );
}

function curvedLine(
  points: THREE.Vector3[],
  radius: number,
  material: THREE.Material,
  closed: boolean,
) {
  const curve = new THREE.CatmullRomCurve3(points, closed, "centripetal");
  return new THREE.Mesh(
    new THREE.TubeGeometry(
      curve,
      Math.max(64, points.length * 2),
      radius,
      10,
      closed,
    ),
    material,
  );
}

export function makeCurvedShell(
  width: number,
  height: number,
  depth: number,
  segments: number,
  color: THREE.ColorRepresentation,
  options: CurvedShellOptions = {},
) {
  const group = new THREE.Group();
  const rows = Math.max(48, Math.ceil(segments * (height / width)));
  const columns = Math.max(48, segments);
  const minY = options.minY ?? -height / 2;
  const maxY = options.maxY ?? height / 2;
  const positions: number[] = [];
  const indices: number[] = [];
  const valid: boolean[] = [];

  for (let row = 0; row <= rows; row++) {
    const y = minY + ((maxY - minY) * row) / rows;
    for (let column = 0; column <= columns; column++) {
      const x = -width / 2 + (width * column) / columns;
      const nx = x / (width / 2);
      const ny = y / (height / 2);
      const onFace = nx * nx + ny * ny <= 1 && !insideEye(x, y);
      positions.push(x, y, curvedSurfaceZ(width, height, depth, x, y));
      valid.push(onFace);
    }
  }

  const stride = columns + 1;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const lowerLeft = row * stride + column;
      const lowerRight = lowerLeft + 1;
      const upperLeft = lowerLeft + stride;
      const upperRight = upperLeft + 1;
      if (valid[lowerLeft] && valid[lowerRight] && valid[upperRight]) {
        indices.push(lowerLeft, lowerRight, upperRight);
      }
      if (valid[lowerLeft] && valid[upperRight] && valid[upperLeft]) {
        indices.push(lowerLeft, upperRight, upperLeft);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const shell = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
  );
  group.add(shell);

  const trim = new THREE.MeshStandardMaterial({
    color: 0x17191f,
    roughness: 0.4,
  });
  const xLimit = (y: number) =>
    (width / 2) * Math.sqrt(Math.max(0, 1 - (y / (height / 2)) ** 2));
  const border: THREE.Vector3[] = [];
  const edgeSteps = Math.max(48, segments);
  for (let index = 0; index <= edgeSteps; index++) {
    const x = -xLimit(minY) + (2 * xLimit(minY) * index) / edgeSteps;
    border.push(
      new THREE.Vector3(
        x,
        minY,
        curvedSurfaceZ(width, height, depth, x, minY) + 0.02,
      ),
    );
  }
  for (let index = 1; index <= edgeSteps; index++) {
    const y = minY + ((maxY - minY) * index) / edgeSteps;
    const x = xLimit(y);
    border.push(
      new THREE.Vector3(
        x,
        y,
        curvedSurfaceZ(width, height, depth, x, y) + 0.02,
      ),
    );
  }
  for (let index = 1; index <= edgeSteps; index++) {
    const x = xLimit(maxY) - (2 * xLimit(maxY) * index) / edgeSteps;
    border.push(
      new THREE.Vector3(
        x,
        maxY,
        curvedSurfaceZ(width, height, depth, x, maxY) + 0.02,
      ),
    );
  }
  for (let index = 1; index < edgeSteps; index++) {
    const y = maxY - ((maxY - minY) * index) / edgeSteps;
    const x = -xLimit(y);
    border.push(
      new THREE.Vector3(
        x,
        y,
        curvedSurfaceZ(width, height, depth, x, y) + 0.02,
      ),
    );
  }
  group.add(curvedLine(border, 0.07, trim, true));

  for (const centerX of [-EYE_X, EYE_X]) {
    const eyeEdge: THREE.Vector3[] = [];
    for (let index = 0; index < 64; index++) {
      const angle = (index / 64) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * EYE_RADIUS_X;
      const y = EYE_Y + Math.sin(angle) * EYE_RADIUS_Y;
      eyeEdge.push(
        new THREE.Vector3(
          x,
          y,
          curvedSurfaceZ(width, height, depth, x, y) + 0.03,
        ),
      );
    }
    group.add(curvedLine(eyeEdge, 0.055, trim, true));
  }

  return group;
}
