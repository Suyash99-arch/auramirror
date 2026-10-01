import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { faceBus } from "../faceBus";
import { accessories } from "../../data/accessories";
import { build3D, OCCLUDER } from "./models";

/** Vertical field of view of a typical laptop webcam. Tune 55-70 if glasses look too big/small. */
const BASE_FOV = 63;

type Props = {
  worn: string[];
  ready: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export default function ThreeOverlay({ worn, ready, videoRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wornRef = useRef(worn);

  useEffect(() => {
    wornRef.current = worn;
  }, [worn]);

  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    const canvas = canvasRef.current;

    const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true, // lets photo capture read the 3D layer
});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 1000);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(0.4, 1, 1);
    scene.add(key);

    // everything worn lives inside this group, which follows the head
    const head = new THREE.Group();
    head.matrixAutoUpdate = false;
    head.visible = false;
    scene.add(head);

    if (OCCLUDER) {
      const occ = new THREE.Mesh(
        new THREE.SphereGeometry(7, 32, 24),
        new THREE.MeshBasicMaterial({ colorWrite: false })
      );
      occ.position.set(0, 0, -2);
      occ.scale.set(1, 1.15, 1);
      occ.renderOrder = -1;
      head.add(occ);
    }

    const items = new Map<string, THREE.Object3D>();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const sc = new THREE.Vector3(1, 1, 1);
    const tp = new THREE.Vector3();
    const tq = new THREE.Quaternion();
    const ts = new THREE.Vector3();
    const tmp = new THREE.Matrix4();
    let init = false;
    let raf = 0;
    let lastW = 0;
    let lastH = 0;
    let lastVW = 0;

    // match the camera to how the <video> is cropped by object-fit: cover
    const syncCamera = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      const video = videoRef.current;
      const vw = video?.videoWidth ?? 0;
      const vh = video?.videoHeight ?? 0;
      if (w === lastW && h === lastH && vw === lastVW) return;
      lastW = w;
      lastH = h;
      lastVW = vw;

      renderer.setSize(w, h, false);
      const canvasAspect = w / h;
      let fov = BASE_FOV;
      if (vw && vh) {
        const videoAspect = vw / vh;
        if (canvasAspect > videoAspect) {
          // canvas is wider than the video, so top/bottom get cropped: narrower vertical view
          const half = THREE.MathUtils.degToRad(BASE_FOV) / 2;
          fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(half) * (videoAspect / canvasAspect)));
        }
      }
      camera.fov = fov;
      camera.aspect = canvasAspect;
      camera.updateProjectionMatrix();
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      syncCamera();

      // 1) keep the scene in sync with what is worn
      const want = new Set(wornRef.current);
      for (const [id, obj] of items) {
        if (!want.has(id)) {
          head.remove(obj);
          items.delete(id);
        }
      }
      for (const id of want) {
        if (items.has(id)) continue;
        const a = accessories.find((x) => x.id === id);
        const obj = a ? build3D(a) : null;
        if (obj) {
          obj.scale.setScalar(0.001);
          head.add(obj);
          items.set(id, obj);
        }
      }

      // 2) pop-in animation
      for (const obj of items.values()) {
        obj.userData.pop = Math.min(1, obj.userData.pop + 0.08);
        const e = 1 - Math.pow(1 - obj.userData.pop, 3);
        obj.scale.setScalar(Math.max(e, 0.001));
      }

      // 3) follow the head pose (position + rotation) from MediaPipe
      const m = faceBus.result?.facialTransformationMatrixes?.[0];
      const fresh = performance.now() - faceBus.t < 250;
      if (m && fresh) {
        tmp.fromArray(m.data as unknown as number[]);
        tmp.decompose(tp, tq, ts);
        if (!init) {
          pos.copy(tp);
          quat.copy(tq);
          init = true;
        } else {
          pos.lerp(tp, 0.55);
          quat.slerp(tq, 0.55);
        }
        sc.copy(ts);
        head.matrix.compose(pos, quat, sc);
        head.matrixWorldNeedsUpdate = true;
        head.visible = true;
      } else {
        head.visible = false;
        init = false;
      }

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
    };
  }, [ready, videoRef]);

  return <canvas ref={canvasRef} className="three-layer" />;
}