// A phone and a tablet as three.js objects for productFace(): a rounded metal body with bevelled
// edges, black glass on the front, the screen (a canvas) inset by the bezel, and for the phone a
// camera cut-out. Sizes are in a typical device's proportions (a 6.3" phone: 71.5 × 149.6 mm,
// 8.25 mm deep; an 11" tablet: 249.7 × 177.5 mm landscape, 5.3 mm deep). Change PHONE / TABLET
// to the real product's measurements.
import { THREE } from '../sf/product3d.js';

function shape(w, h, r) {
  const s = new THREE.Shape(), x0 = -w / 2, y0 = -h / 2, x1 = w / 2, y1 = h / 2;
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r);
  s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1); s.lineTo(x0 + r, y1);
  s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}
function flat(w, h, r, mat) {
  const geo = new THREE.ShapeGeometry(shape(w, h, r), 16);
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  return new THREE.Mesh(geo, mat);
}
const texOf = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

// w, h: body size; depth; r: corner radius; bezel: screen inset; screen: canvas (cropped to fill)
export function buildDevice({ screen, w, h, depth, r, bezel, edge = 0x3a3b40, island = false }) {
  const g = new THREE.Group();
  const metal = new THREE.MeshPhysicalMaterial({ color: edge, metalness: 1, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x060607, roughness: 0.12, clearcoat: 1 });
  const bev = depth * 0.35;
  const body = new THREE.ExtrudeGeometry(shape(w - 2 * bev, h - 2 * bev, Math.max(r - bev, 0.002)),
    { depth: depth - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 5, curveSegments: 18 });
  body.translate(0, 0, -(depth - 2 * bev) / 2);
  g.add(new THREE.Mesh(body, metal));
  const front = flat(w - bev * 0.7, h - bev * 0.7, r - bev * 0.35, glass); front.position.z = depth / 2 + 0.0008; g.add(front);
  const back = flat(w - bev * 0.7, h - bev * 0.7, r - bev * 0.35, metal); back.position.z = -depth / 2 - 0.0008; back.rotation.y = Math.PI; g.add(back);
  const tex = texOf(screen);
  const sc = flat(w - 2 * bezel, h - 2 * bezel, Math.max(r - bezel, 0.004), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  sc.position.z = depth / 2 + 0.002; g.add(sc);
  if (island) {
    const iw = w * 0.3, ih = w * 0.085;
    const isl = flat(iw, ih, ih / 2, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    isl.position.set(0, h / 2 - bezel - w * 0.06, depth / 2 + 0.003); g.add(isl);
  }
  g.userData.tex = tex;
  return g;
}

// screen canvas cropped to the device's screen aspect (cover fit, top-aligned)
export function fitScreen(img, aspect, { W = 1200, align = 'top', bg = '#0b0b0c' } = {}) {
  const H = Math.round(W / aspect), c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const s = Math.max(W / img.width, H / img.height), dw = img.width * s, dh = img.height * s;
  g.drawImage(img, (W - dw) / 2, align === 'top' ? 0 : align === 'bottom' ? H - dh : (H - dh) / 2, dw, dh);
  return c;
}

const PHONE = { w: 0.715, h: 1.496, depth: 0.0825, r: 0.115, bezel: 0.028 };
const TABLET = { w: 2.497, h: 1.775, depth: 0.053, r: 0.15, bezel: 0.07 };
export function phone(img) {
  const sa = (PHONE.w - 2 * PHONE.bezel) / (PHONE.h - 2 * PHONE.bezel);
  return buildDevice({ ...PHONE, screen: fitScreen(img, sa, { W: 900 }), island: true });
}
export function tablet(img) {
  const sa = (TABLET.w - 2 * TABLET.bezel) / (TABLET.h - 2 * TABLET.bezel);
  return buildDevice({ ...TABLET, screen: fitScreen(img, sa, { W: 1600, align: 'center' }), edge: 0x55575d });
}
// the pair for the signature: the tablet, the phone standing in front of its lower right corner.
// set(p): p = 0 the phone alone at the centre, the tablet hidden below; p = 1 the pair
export function pair(phoneImg, padImg) {
  const root = new THREE.Group(), P = phone(phoneImg), D = tablet(padImg);
  root.add(D, P);
  const set = (p) => {
    const e = p * p * (3 - 2 * p);
    P.position.set(0.55 * e, -0.42 * e, 0.25 * e); // in front of the tablet, inside its width, so both sides of the pair are the tablet's edges
    D.position.set(-0.25 * e, -2.6 * (1 - e), -0.1);
    D.visible = e > 0.001;
  };
  // fixed extent for framing: measure at p = 1
  set(1);
  root.userData.set = set;
  return root;
}
