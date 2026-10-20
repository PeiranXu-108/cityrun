// Shared constants, helpers, curved-world material patch, geometry batching and canvas textures.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export { THREE };

// ---------- gameplay constants ----------
export const LANE_W = 2.5;
export const laneX = (l) => (l - 1) * LANE_W;
export const CHUNK_LEN = 80;
export const TRAIN_H = 3.3; // roof height
export const TRAIN_W = 2.3;
export const CAR_LEN = 11;
export const CAR_GAP = 0.7;
export const RAMP_LEN = 9;
export const JET_Y = 9;

// ---------- math helpers ----------
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randi = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p) => Math.random() < p;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
export const smooth = (t) => t * t * (3 - 2 * t);

// ---------- curved world ----------
// Every world material bends vertices down (and slightly sideways) with view distance,
// which gives the classic endless-runner "rolling planet" horizon.
export const curveUniforms = {
  uCurveY: { value: 0.0007 },
  uCurveX: { value: 0 },
};
export const CURVE_GLSL = `
  float cdist = max(-mvPosition.z, 0.0);
  mvPosition.y -= uCurveY * cdist * cdist;
  mvPosition.x += uCurveX * cdist * cdist;`;
const PROJECT = `
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
  mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
${CURVE_GLSL}
gl_Position = projectionMatrix * mvPosition;`;

export function curve(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uCurveY = curveUniforms.uCurveY;
    sh.uniforms.uCurveX = curveUniforms.uCurveX;
    sh.vertexShader =
      "uniform float uCurveY;\nuniform float uCurveX;\n" +
      sh.vertexShader.replace("#include <project_vertex>", PROJECT);
  };
  mat.customProgramCacheKey = () => "curved1";
  return mat;
}

export const std = (p) => curve(new THREE.MeshStandardMaterial(p));

// Alpha-tested, double-sided foliage that sways in the wind. Geometry carries an `aSway`
// attribute (0 where a strand is attached, 1 at its tip). Both faces are lit alike.
export const windTime = { value: 0 };
export function foliageMat(
  map,
  { sway = 0.3, rough = 0.85, alphaTest = 0.45, emissive = 0 } = {},
) {
  const m = new THREE.MeshStandardMaterial({
    map,
    alphaTest,
    side: THREE.DoubleSide,
    vertexColors: true,
    roughness: rough,
    metalness: 0,
    envMapIntensity: 0.6,
  });
  if (emissive) {
    m.emissive = new THREE.Color("#ffffff");
    m.emissiveMap = map;
    m.emissiveIntensity = emissive;
  } // e.g. lit night blossoms
  m.userData.sway = true;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCurveY = curveUniforms.uCurveY;
    sh.uniforms.uCurveX = curveUniforms.uCurveX;
    sh.uniforms.uTime = windTime;
    sh.vertexShader =
      "uniform float uCurveY;\nuniform float uCurveX;\nuniform float uTime;\nattribute float aSway;\n" +
      sh.vertexShader
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
        float wph = uTime * 1.5 + position.x * 0.21 + position.z * 0.17;
        transformed.x += (sin(wph) * 0.65 + sin(wph * 2.3 + 1.7) * 0.25) * aSway * ${sway.toFixed(3)};
        transformed.z += cos(wph * 0.8) * aSway * ${(sway * 0.6).toFixed(3)};`,
        )
        .replace("#include <project_vertex>", PROJECT);
    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <normal_fragment_begin>",
      "#include <normal_fragment_begin>\n  normal = normalize(vNormal);",
    );
  };
  m.customProgramCacheKey = () => "foliage" + sway;
  return m;
}
export const basic = (p) => curve(new THREE.MeshBasicMaterial(p));
export const hdr = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);

// Vertex-coloured shared materials: almost all decor merges into these.
export const VC = {
  solid: std({
    vertexColors: true,
    roughness: 0.82,
    metalness: 0.05,
    envMapIntensity: 0.55,
  }),
  metal: std({ vertexColors: true, roughness: 0.32, metalness: 0.8 }),
  glow: basic({ vertexColors: true }),
  glowAdd: basic({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }),
};

// ---------- unit geometries ----------
export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 14),
  cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
  cyl8: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  cone: new THREE.ConeGeometry(0.5, 1, 14),
  cone4: new THREE.ConeGeometry(0.5, 1, 4),
  cone8: new THREE.ConeGeometry(0.5, 1, 8),
  sph: new THREE.SphereGeometry(0.5, 14, 10),
  sphLow: new THREE.SphereGeometry(0.5, 7, 5),
  plane: new THREE.PlaneGeometry(1, 1),
  tor: new THREE.TorusGeometry(0.5, 0.08, 6, 20),
};
G.cone4.rotateY(Math.PI / 4);

const nonIdx = new WeakMap();
function prep(geo) {
  let g = nonIdx.get(geo);
  if (!g) {
    g = geo.index ? geo.toNonIndexed() : geo;
    if (!g.attributes.uv)
      g.setAttribute(
        "uv",
        new THREE.BufferAttribute(
          new Float32Array(g.attributes.position.count * 2),
          2,
        ),
      );
    nonIdx.set(geo, g);
  }
  return g;
}

const _m = new THREE.Matrix4(),
  _q = new THREE.Quaternion(),
  _e = new THREE.Euler();
const _p = new THREE.Vector3(),
  _s = new THREE.Vector3(),
  _c = new THREE.Color();
const KEEP = new Set(["position", "normal", "uv", "color", "aSway"]);

// Collects transformed primitives bucketed by material and merges them into one mesh per material.
export class Batcher {
  constructor() {
    this.buckets = new Map();
  }
  add(
    geo,
    mat,
    x,
    y,
    z,
    sx = 1,
    sy = 1,
    sz = 1,
    rx = 0,
    ry = 0,
    rz = 0,
    color = 0xffffff,
  ) {
    _p.set(x, y, z);
    _s.set(sx, sy, sz);
    _q.setFromEuler(_e.set(rx, ry, rz, "YXZ"));
    _m.compose(_p, _q, _s);
    return this.addM(geo, mat, _m, color);
  }
  // color === null keeps the geometry's own per-vertex colours
  addM(geo, mat, m, color = 0xffffff) {
    const g = prep(geo).clone();
    for (const k of Object.keys(g.attributes))
      if (!KEEP.has(k)) g.deleteAttribute(k);
    if (mat.userData.sway) {
      if (!g.attributes.aSway)
        g.setAttribute(
          "aSway",
          new THREE.BufferAttribute(
            new Float32Array(g.attributes.position.count),
            1,
          ),
        );
    } else if (g.attributes.aSway) g.deleteAttribute("aSway");
    g.applyMatrix4(m);
    if (!mat.vertexColors) {
      if (g.attributes.color) g.deleteAttribute("color");
    } else if (!(color === null && g.attributes.color)) {
      const c =
        color instanceof THREE.Color ? color : _c.set(color ?? 0xffffff);
      const n = g.attributes.position.count,
        a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        a[i * 3] = c.r;
        a[i * 3 + 1] = c.g;
        a[i * 3 + 2] = c.b;
      }
      g.setAttribute("color", new THREE.BufferAttribute(a, 3));
    }
    let list = this.buckets.get(mat);
    if (!list) this.buckets.set(mat, (list = []));
    list.push(g);
    return this;
  }
  box(mat, color, x, y, z, w, h, d, ry = 0, rx = 0, rz = 0) {
    return this.add(G.box, mat, x, y, z, w, h, d, rx, ry, rz, color);
  }
  // box whose base sits on y
  block(mat, color, x, y, z, w, h, d, ry = 0) {
    return this.add(G.box, mat, x, y + h / 2, z, w, h, d, 0, ry, 0, color);
  }
  cyl(mat, color, x, y, z, r, h, seg = "cyl", rx = 0, rz = 0) {
    return this.add(G[seg], mat, x, y, z, r * 2, h, r * 2, rx, 0, rz, color);
  }
  sph(mat, color, x, y, z, r, low = false) {
    return this.add(
      low ? G.sphLow : G.sph,
      mat,
      x,
      y,
      z,
      r * 2,
      r * 2,
      r * 2,
      0,
      0,
      0,
      color,
    );
  }
  build() {
    const group = new THREE.Group();
    for (const [mat, list] of this.buckets) {
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingSphere();
      group.add(new THREE.Mesh(merged, mat));
    }
    this.buckets.clear();
    return group;
  }
}

// ---------- canvas textures ----------
export function canvasTex(w, h, draw, { srgb = true, repeat = true } = {}) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function grain(g, w, h, a = 0.14, n = 1 / 40) {
  for (let i = 0; i < w * h * n; i++) {
    g.fillStyle =
      Math.random() < 0.5
        ? `rgba(0,0,0,${Math.random() * a})`
        : `rgba(255,255,255,${Math.random() * a * 0.5})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}

// Facade texture pair: colour map (wall + dark glass) and emissive map (lit windows).
export function windowTex({
  cols = 8,
  rows = 16,
  cw = 32,
  ch = 40,
  wall = "#555",
  glass = "#0b0e16",
  lit = ["#ffcf7a"],
  litChance = 0.35,
  band = false,
  frame = null,
  arch = false,
  ledge = null,
} = {}) {
  const W = cols * cw,
    H = rows * ch;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    let rowLit = Math.random() < 0.15 ? 0.85 : litChance;
    for (let c = 0; c < cols; c++)
      cells.push(Math.random() < rowLit ? pick(lit) : null);
  }
  const rect = (c, r) =>
    band
      ? [c * cw + 1, r * ch + ch * 0.2, cw - 2, ch * 0.58]
      : [c * cw + cw * 0.2, r * ch + ch * 0.2, cw * 0.6, ch * 0.58];
  const shape = (g, x, y, w, h) => {
    g.beginPath();
    if (arch) {
      g.moveTo(x, y + h);
      g.lineTo(x, y + w / 2);
      g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
      g.lineTo(x + w, y + h);
      g.closePath();
    } else g.rect(x, y, w, h);
  };
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = wall;
    g.fillRect(0, 0, W, H);
    grain(g, W, H);
    if (ledge) {
      g.fillStyle = ledge;
      for (let r = 0; r < rows; r++)
        g.fillRect(0, r * ch + ch * 0.86, W, ch * 0.06);
    }
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const [x, y, w, h] = rect(c, r);
        g.fillStyle = glass;
        shape(g, x, y, w, h);
        g.fill();
        if (frame) {
          g.strokeStyle = frame;
          g.lineWidth = 2;
          g.stroke();
        }
      }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const col = cells[r * cols + c];
        if (!col) continue;
        const [x, y, w, h] = rect(c, r);
        const gr = g.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, col);
        gr.addColorStop(1, shade(col, 0.55));
        g.fillStyle = gr;
        shape(g, x, y, w, h);
        g.fill();
        if (Math.random() < 0.3) {
          g.fillStyle = "rgba(0,0,0,0.6)";
          g.fillRect(x, y, w * rand(0.3, 0.6), h);
        }
      }
  });
  return { map, emissive, cols, rows };
}

export function shade(hex, k) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(k);
  return "#" + c.getHexString();
}

// Box with base at y=0 whose side UVs tile a window texture in world units.
export function buildingGeo(w, h, d, tex, cellW = 1.8, cellH = 2.7) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  const uv = g.attributes.uv;
  const uo = randi(0, tex.cols - 1) / tex.cols,
    vo = randi(0, tex.rows - 1) / tex.rows;
  const tw = tex.cols * cellW,
    th = tex.rows * cellH;
  for (let f = 0; f < 6; f++) {
    const fw = f < 2 ? d : w;
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      if (f === 2 || f === 3) {
        uv.setXY(i, 0.002, 0.002);
        continue;
      }
      uv.setXY(i, uo + (uv.getX(i) * fw) / tw, vo + (uv.getY(i) * h) / th);
    }
  }
  return g;
}

// Neon sign atlas so every sign of a theme shares one additive material.
export function signAtlas(entries, { cw = 512, ch = 128, cols = 2 } = {}) {
  const rows = Math.ceil(entries.length / cols);
  const tex = canvasTex(
    cw * cols,
    ch * rows,
    (g) => {
      g.fillStyle = "#000";
      g.fillRect(0, 0, cw * cols, ch * rows);
      entries.forEach((e, i) =>
        drawSign(g, e, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch),
      );
    },
    { repeat: false },
  );
  const rects = entries.map((e, i) => {
    const c = i % cols,
      r = Math.floor(i / cols);
    return {
      u0: c / cols,
      u1: (c + 1) / cols,
      v0: 1 - (r + 1) / rows,
      v1: 1 - r / rows,
      aspect: cw / ch,
    };
  });
  return { tex, rects };
}

function drawSign(g, e, x, y, w, h) {
  const pad = 10;
  g.save();
  g.translate(x, y);
  if (e.border) {
    g.strokeStyle = e.color;
    g.lineWidth = 6;
    g.shadowColor = e.color;
    g.shadowBlur = 16;
    roundRect(g, pad, pad, w - pad * 2, h - pad * 2, 18);
    g.stroke();
  }
  let size = Math.floor(h * (e.size || 0.56));
  g.font = `${e.weight || 900} ${size}px ${e.font || '"Russo One", "Arial Black", sans-serif'}`;
  const max = w - pad * 6;
  const m = g.measureText(e.text).width;
  if (m > max) {
    size = Math.floor((size * max) / m);
    g.font = `${e.weight || 900} ${size}px ${e.font || '"Russo One", "Arial Black", sans-serif'}`;
  }
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = e.color;
  g.shadowBlur = 24;
  g.fillStyle = e.color;
  g.fillText(e.text, w / 2, h / 2 + 4);
  g.shadowBlur = 6;
  g.fillStyle = e.core || "#ffffff";
  g.globalAlpha = 0.75;
  g.fillText(e.text, w / 2, h / 2 + 4);
  g.restore();
}

export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const uvPlanes = new WeakMap();
export function planeUV(r) {
  let g = uvPlanes.get(r);
  if (g) return g;
  g = new THREE.PlaneGeometry(1, 1);
  const uv = g.attributes.uv;
  uv.setXY(0, r.u0, r.v1);
  uv.setXY(1, r.u1, r.v1);
  uv.setXY(2, r.u0, r.v0);
  uv.setXY(3, r.u1, r.v0);
  uvPlanes.set(r, g);
  return g;
}

export function stripeTex(c1, c2, n = 6, w = 128, h = 32) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = c1;
    g.fillRect(0, 0, w, h);
    g.fillStyle = c2;
    const s = w / n;
    for (let i = -1; i < n + 1; i++) {
      g.beginPath();
      g.moveTo(i * s, h);
      g.lineTo(i * s + s / 2, h);
      g.lineTo(i * s + s, 0);
      g.lineTo(i * s + s / 2, 0);
      g.closePath();
      g.fill();
    }
    grain(g, w, h, 0.1, 1 / 30);
  });
}

export function noiseTex(base, spots, w = 256, h = 256, n = 1 / 6) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h * n; i++) {
      g.fillStyle = pick(spots);
      const s = rand(1, 3.5);
      g.fillRect(Math.random() * w, Math.random() * h, s, s);
    }
  });
}

// Track bed: gravel strip with sleepers drawn into the texture to keep geometry light.
export function trackTex({
  gravel = "#2a2a30",
  spots = ["#3a3a42", "#1c1c22", "#45454f"],
  sleeper = "#3b2f28",
} = {}) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = gravel;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = pick(spots);
      const s = rand(1, 3);
      g.fillRect(Math.random() * w, Math.random() * h, s, s);
    }
    for (let i = 0; i < 4; i++) {
      const y = i * 64 + 18;
      g.fillStyle = sleeper;
      g.fillRect(14, y, w - 28, 26);
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.fillRect(14, y + 22, w - 28, 4);
      g.fillStyle = "rgba(255,255,255,0.06)";
      g.fillRect(14, y, w - 28, 3);
    }
  });
}

export function disposeTree(o) {
  o.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
  });
}
