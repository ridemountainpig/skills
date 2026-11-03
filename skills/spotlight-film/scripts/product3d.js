// three.js product stage: transparent WebGL canvas that composites over the DOM stage
// or inside a graphic window. Load the real product as GLB when you have it
// (loadGLB); slabObject() turns a flat photo or screenshot into a thin lit slab.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export { THREE };

export function createStage3D({ width = 1920, height = 1080, fov = 30, exposure = 1.0 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 6, 4);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.05, 100);
  return {
    canvas, renderer, scene, camera, key,
    look(pos, target = [0, 0, 0], fovDeg) {
      camera.position.set(...pos);
      if (fovDeg) { camera.fov = fovDeg; camera.updateProjectionMatrix(); }
      camera.lookAt(...target);
    },
    render() { renderer.render(scene, camera); },
  };
}

export async function loadGLB(url) {
  const gltf = await new GLTFLoader().loadAsync(url);
  return gltf.scene;
}

export function aluminium(color = 0xc4c6cc, roughness = 0.32) {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness, clearcoat: 0.25, clearcoatRoughness: 0.4 });
}

// ---------- a 3D product as the anchor's face ----------
// productFace(object, opts) -> a material ({ canvas, draw(t) }) that renders a three.js object on
// alpha, framed to fill the canvas. Pass it to useFace(face, { cutout: true }): the anchor, its
// beams, match moves and typeSlot() then work exactly as with a flat face, but the subject is a
// lit object with thickness, reflections and a turning view instead of a printed card.
//   object: a GLB scene (loadGLB), your own three.js group, or slabObject(material) for a flat photo
//   view(t) -> { yaw, pitch, roll } in degrees (keep |yaw| ≤ 25 and |pitch| ≤ 20 inside one film:
//   the beam's neck is measured from the outline at t = 0, so a big turn would open a gap)
//   tick(t): optional per-frame hook (a hinge angle, a screen texture update)
// All faces share one WebGL renderer (the "one renderer" rule): each draw renders and copies.
let SHARED = null;
export function productFace(object, { w = 1024, h = 1024, fov = 20, fill = 0.92, view = () => ({}), tick = null, exposure = 1.05 } = {}) {
  if (!SHARED) SHARED = createStage3D({ width: w, height: h, fov, exposure });
  const st = SHARED;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext('2d');
  const pivot = new THREE.Group();
  // centre the object on the pivot
  const box = new THREE.Box3().setFromObject(object), c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  object.position.sub(c);
  pivot.add(object);
  // frame: the camera looks straight down -z; distance so the object's x-y extent fills `fill` of
  // the canvas (depth and the view's tilt take the rest of the margin)
  const tv = Math.tan(THREE.MathUtils.degToRad(fov) / 2), th = tv * (w / h);
  const dist = Math.max(size.x / 2 / th, Math.max(size.y, size.z) / 2 / tv) / fill + size.z;
  const D = THREE.MathUtils.degToRad;
  return {
    canvas, object, pivot,
    draw(t) {
      const v = { yaw: 0, pitch: 0, roll: 0, ...view(t) };
      if (object.userData.update) object.userData.update(t);
      if (tick) tick(t);
      st.scene.add(pivot);
      pivot.rotation.set(D(v.pitch), D(v.yaw), D(v.roll), 'YXZ');
      if (st.canvas.width !== w || st.canvas.height !== h) { st.renderer.setSize(w, h, false); }
      st.camera.aspect = w / h; st.camera.fov = fov; st.camera.position.set(0, 0, dist); st.camera.lookAt(0, 0, 0); st.camera.updateProjectionMatrix();
      st.key.position.set(-dist * 0.6, dist, dist * 0.8);
      st.render();
      st.scene.remove(pivot);
      g.clearRect(0, 0, w, h);
      g.drawImage(st.canvas, 0, 0, w, h);
    },
  };
}

// slabObject(material, opts): a flat product photo or top view (phone back, card, case lid) made
// into a solid: the image on the front, a rounded body of `depth` behind it with metal or plastic
// sides. The face material may be animated (its texture updates every draw).
//   radius: corner radius as a fraction of the width (match the product); depth: fraction of the width
export function slabObject(mat, { depth = 0.07, radius = 0.12, edge = 0x8d8f95, metalness = 0.9, roughness = 0.3 } = {}) {
  const W = 2, H = (2 * mat.canvas.height) / mat.canvas.width, Dp = W * depth, rr = W * radius;
  const rounded = (w, h, r) => {
    const sh = new THREE.Shape(), x0 = -w / 2, y0 = -h / 2;
    sh.moveTo(x0 + r, y0); sh.lineTo(-x0 - r, y0); sh.quadraticCurveTo(-x0, y0, -x0, y0 + r);
    sh.lineTo(-x0, -y0 - r); sh.quadraticCurveTo(-x0, -y0, -x0 - r, -y0); sh.lineTo(x0 + r, -y0);
    sh.quadraticCurveTo(x0, -y0, x0, -y0 - r); sh.lineTo(x0, y0 + r); sh.quadraticCurveTo(x0, y0, x0 + r, y0);
    return sh;
  };
  const root = new THREE.Group();
  // the body: the same rounded rectangle as the face, extruded with a soft bevel on both sides
  const bev = Math.min(Dp * 0.35, rr * 0.5);
  const bodyGeo = new THREE.ExtrudeGeometry(rounded(W - 2 * bev, H - 2 * bev, Math.max(rr - bev, 0.001)),
    { depth: Dp - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 5, curveSegments: 16 });
  bodyGeo.translate(0, 0, -(Dp - 2 * bev) / 2);
  root.add(new THREE.Mesh(bodyGeo, new THREE.MeshPhysicalMaterial({ color: edge, metalness, roughness, clearcoat: 0.3 })));
  const tex = new THREE.CanvasTexture(mat.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  // the front: the image on the flat part of the face, under a clear glass coat
  const fw = W - 2 * bev * 0.6, fh = H - 2 * bev * 0.6;
  const geo = new THREE.ShapeGeometry(rounded(fw, fh, Math.max(rr - bev * 0.6, 0.001)), 16);
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + fw / 2) / fw, (pos.getY(i) + fh / 2) / fh);
  const front = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, roughness: 0.25, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }));
  front.position.z = Dp / 2 + 0.002;
  root.add(front);
  const draw = mat.draw;
  root.userData.update = (t) => { draw(t); tex.needsUpdate = true; };
  return root;
}
