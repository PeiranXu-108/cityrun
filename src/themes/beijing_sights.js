// More Beijing landmark scenes: the Great Hall of the People across from the National Centre for the Performing Arts in
// its lake, the Summer Palace's Seventeen-Arch Bridge on Kunming Lake (Longevity Hill and the Tower of Buddhist Incense
// rise across the water on the skyline, see beijing.js), the ruins of the Old Summer Palace under the moon, the Lama
// Temple, Wangfujing with St Joseph's Church, and the 798 art zone. Still water shows the scene upside down below it.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, curve, buildingGeo, windowTex, rand, randi, pick, chance } from '../core.js';
import { at, EDGE, farGround, facadeMat, textTex, waterNormal, waterMat } from './common.js';
import { beam } from './tokyo_kit.js';
import { treeKit, parkTreeKit } from './trees.js';
import { puffs } from './taipei_towers.js';
import { VERM, MARBLE, CN, CN_SIGN, tiledBox } from './beijing_kit.js';

// every glyph these scenes draw on canvases, for the font preload
export const SIGHT_GLYPHS = '颐和园大水法圆明园寰海尊亲雍和宫万福阁北京市百货大楼王府井小吃街艺术区画廊咖啡工厂荷花市场银锭桥';

const I4 = new THREE.Matrix4(), UPV = new THREE.Vector3(0, 1, 0);
const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3();

// Floodlighting: the emissive glow is strongest at the foot of a wall and fades with height (taken absolute, so a
// reflection under the water fades the same way), and it is scaled by the vertex colour.
export function uplit(mat, h = 16, lo = 1.4, hi = 0.35) {
  const prev = mat.onBeforeCompile, key = mat.customProgramCacheKey();
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.vertexShader = 'varying float vUpY;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vUpY = (modelMatrix * vec4(transformed, 1.0)).y;');
    sh.fragmentShader = 'varying float vUpY;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance *= mix(${lo.toFixed(2)}, ${hi.toFixed(2)}, smoothstep(0.0, ${h.toFixed(1)}, abs(vUpY)));
  #ifdef USE_COLOR
    totalEmissiveRadiance *= vColor;
  #endif`);
  };
  mat.customProgramCacheKey = () => `${key}|up${h}|${lo}|${hi}`;
  return mat;
}
// a darker copy of a material for reflections (a clone loses the curved-world patch, so it is put back)
export function dim(mat, k) {
  const m = curve(mat.clone());
  m.color.multiplyScalar(k);
  if (m.emissive) m.emissiveIntensity *= k;
  return m;
}

// a piece modelled round the origin by fn(t), then set into dst at (x, y, z), turned by ry, scaled by s
export function put(dst, fn, x, y, z, ry = 0, s = 1) {
  const t = new Batcher();
  fn(t);
  const m = new THREE.Matrix4().compose(_v.set(x, y, z), _q.setFromAxisAngle(UPV, ry), _s.set(s, s, s));
  for (const [mat, list] of t.buckets) for (const g of list) dst.addM(g, mat, m, null);
  return dst;
}

// ---------- reflections in still water ----------
function flipWinding(g) {
  for (const a of Object.values(g.attributes)) {
    const n = a.itemSize, arr = a.array;
    for (let i = 0; i + 2 < a.count; i += 3) for (let k = 0; k < n; k++) {
      const j1 = (i + 1) * n + k, j2 = (i + 2) * n + k, tmp = arr[j1];
      arr[j1] = arr[j2]; arr[j2] = tmp;
    }
  }
}
// everything held by `src` turned upside down about the water line yw into `dst`, vertex colours dimmed by k;
// `swap` maps a material to a darker one (or to null: not reflected)
export function mirrorInto(dst, src, yw, k = 0.5, swap = new Map()) {
  const M = new THREE.Matrix4().set(1, 0, 0, 0, 0, -1, 0, 2 * yw, 0, 0, 1, 0, 0, 0, 0, 1);
  for (const [mat, list] of src.buckets) {
    if (swap.has(mat) && !swap.get(mat)) continue;
    for (const g0 of list) {
      const g = g0.clone();
      g.applyMatrix4(M); flipWinding(g);
      const c = g.attributes.color;
      if (c) for (let i = 0; i < c.array.length; i++) c.array[i] *= k;
      dst.addM(g, swap.get(mat) || mat, I4, null);
    }
  }
}
export function mergeInto(dst, src) {
  for (const [mat, list] of src.buckets) for (const g of list) dst.addM(g, mat, I4, null);
}
// still water that lets the mirrored scene below it show through
export function clearWater(color, rep = 6, opacity = 0.6) {
  const n = waterNormal();
  n.repeat.set(rep, rep * 4);
  const m = std({ color, metalness: 0.85, roughness: 0.1, normalMap: n, normalScale: new THREE.Vector2(0.45, 0.45), transparent: true, opacity, depthWrite: false });
  m.userData.scroll = n;
  return m;
}
// additive light streaks are drawn after the water they lie on
export function lastAdditive(grp) {
  grp.traverse((o) => { if (o.isMesh && o.material.blending === THREE.AdditiveBlending) o.renderOrder = 1; });
  return grp;
}

// ---------- shapes ----------
// outline lamps (轮廓灯): a row of soft bulbs from p0 to p1 as one quad whose width runs along `wd`
function bulbTex() {
  return canvasTex(32, 16, (g) => {
    g.clearRect(0, 0, 32, 16);
    const gr = g.createRadialGradient(16, 8, 0, 16, 8, 8);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,236,190,0.75)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = gr; g.fillRect(8, 0, 16, 16);
  });
}
function bulbs(b, mat, x0, y0, z0, x1, y1, z1, { w = 0.42, step = 0.75, wd = [0, 1, 0] } = {}) {
  const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0), rep = Math.max(1, Math.round(len / step));
  const ox = (wd[0] * w) / 2, oy = (wd[1] * w) / 2, oz = (wd[2] * w) / 2;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([x0 - ox, y0 - oy, z0 - oz, x1 - ox, y1 - oy, z1 - oz, x1 + ox, y1 + oy, z1 + oz,
    x0 - ox, y0 - oy, z0 - oz, x1 + ox, y1 + oy, z1 + oz, x0 + ox, y0 + oy, z0 + oz], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, rep, 0, rep, 1, 0, 0, rep, 1, 0, 1], 2));
  b.addM(g, mat, I4, 0xffffff);
}
// round or eight-sided roof: concave slope from the eave ring r0 (a little upturned lip) to r1 (0 = a point)
function roofCone(r0, r1, h, seg = 8, tile = 1.1) {
  const pts = [new THREE.Vector2(r0 + 0.35, 0.18)];
  for (let j = 0; j <= 6; j++) { const t = j / 6; pts.push(new THREE.Vector2(Math.max(0.02, r0 + (r1 - r0) * t), h * Math.pow(t, 1.6))); }
  const g = new THREE.LatheGeometry(pts, seg), uv = g.attributes.uv, len = Math.hypot(r0 - r1, h);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * 2 * Math.PI * r0) / tile, (uv.getY(i) * len) / tile);
  return g;
}
// extruded outline, its UVs in tiles of `s` metres
function slab(shape, depth, s = 3.3, seg = 10) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: seg }), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / s, uv.getY(i) / s);
  return g;
}
// a flat facade face, its texture repeating every `tile` metres across and once up its height
function faceGeo(len, h, tile) {
  const g = new THREE.PlaneGeometry(len, h), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, (uv.getX(i) * len) / tile);
  return g;
}
// a window or door with a round head (w wide, h tall from its sill)
const panes = new Map();
function archPane(w, h) {
  const key = `${w}|${h}`;
  if (!panes.has(key)) {
    const r = w / 2, s = new THREE.Shape();
    s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0);
    const g = new THREE.ShapeGeometry(s, 10), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + r) / w, uv.getY(i) / h);
    panes.set(key, g);
  }
  return panes.get(key);
}

// ---------- textures ----------
function star(g, cx, cy, R, rot = 0) {
  g.beginPath();
  for (let k = 0; k < 10; k++) { const r = k % 2 ? R * 0.382 : R, a = rot - Math.PI / 2 + (k * Math.PI) / 5; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  g.closePath(); g.fill();
}
function flagTex() {   // the national flag, 3:2: the great star and four small ones turned toward it
  return canvasTex(300, 200, (g, w, h) => {
    g.fillStyle = '#de2910'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffde00';
    star(g, 50, 50, 30);
    for (const [x, y] of [[100, 20], [120, 40], [120, 70], [100, 90]]) star(g, x, y, 10, Math.atan2(50 - y, 50 - x) + Math.PI / 2);
  }, { repeat: false });
}
function emblemTex() {   // the national emblem, simplified: Tian'anmen under five stars in a red disc, a ring of golden grain
  return canvasTex(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    const cx = 128, cy = 128;
    g.fillStyle = '#e8b830'; g.beginPath(); g.arc(cx, cy, 124, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#a87a10'; g.lineWidth = 3;
    for (let k = 0; k < 48; k++) {
      const a = (k / 48) * Math.PI * 2;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * 98, cy + Math.sin(a) * 98); g.lineTo(cx + Math.cos(a + 0.12) * 121, cy + Math.sin(a + 0.12) * 121); g.stroke();
    }
    g.fillStyle = '#c8102e'; g.beginPath(); g.arc(cx, cy, 94, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd23a';
    star(g, cx, 78, 22);
    for (const [dx, y] of [[-50, 90], [-26, 110], [26, 110], [50, 90]]) star(g, cx + dx, y, 8, Math.atan2(78 - y, -dx) + Math.PI / 2);
    g.fillRect(cx - 58, 176, 116, 14);                  // Tian'anmen: the platform, the gate tower, its double roof
    g.fillRect(cx - 40, 154, 80, 22);
    g.beginPath(); g.moveTo(cx - 54, 156); g.lineTo(cx + 54, 156); g.lineTo(cx + 36, 142); g.lineTo(cx - 36, 142); g.fill();
    g.beginPath(); g.moveTo(cx - 44, 142); g.lineTo(cx + 44, 142); g.lineTo(cx + 28, 130); g.lineTo(cx - 28, 130); g.fill();
    g.fillStyle = '#c8102e';
    for (const dx of [-26, -9, 9, 26]) g.fillRect(cx + dx - 4, 160, 8, 14);
    for (const dx of [-36, -18, 0, 18, 36]) g.fillRect(cx + dx - 4, 180, 8, 10);
  }, { repeat: false });
}
function hallFaceTex() {   // the Great Hall's stone face, four bays: pilasters, two tiers of tall lit windows, frieze and granite plinth
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#d6c6a2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) { g.fillStyle = pick(['#cbb994', '#ddd0ae', '#c8b892']); g.globalAlpha = rand(0.1, 0.3); g.fillRect(rand(0, w), rand(0, h), rand(2, 8), rand(1, 4)); }
    g.globalAlpha = 1;
    g.fillStyle = '#c4b28a'; g.fillRect(0, 0, w, 22);
    g.fillStyle = '#9a8a68'; for (let x = 2; x < w; x += 8) g.fillRect(x, 15, 4, 5);
    g.fillStyle = '#8e8a80'; g.fillRect(0, 232, w, 24);
    g.fillStyle = '#7a766c'; for (let y = 238; y < h; y += 8) g.fillRect(0, y, w, 1);
    g.fillStyle = '#c8b690'; g.fillRect(0, 100, w, 12);
    for (let k = 0; k < 4; k++) {
      const x0 = k * 64;
      g.fillStyle = '#e6d8b6'; g.fillRect(x0, 22, 12, 210);
      g.fillStyle = '#f0e4c4'; g.fillRect(x0 - 2, 22, 16, 6);
      g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(x0 + 12, 22, 3, 210);
      for (const [y0, y1] of [[34, 94], [122, 222]]) {
        const lit = Math.random() < 0.85;
        g.fillStyle = '#4a3a26'; g.fillRect(x0 + 21, y0 - 3, 38, y1 - y0 + 6);
        const gr = g.createLinearGradient(0, y0, 0, y1);
        gr.addColorStop(0, lit ? '#ffeec4' : '#3a3428'); gr.addColorStop(1, lit ? '#ffc874' : '#2a241c');
        g.fillStyle = gr; g.fillRect(x0 + 24, y0, 32, y1 - y0);
        g.fillStyle = '#5a4630';
        for (const mx of [34, 45]) g.fillRect(x0 + mx, y0, 2, y1 - y0);
        for (let y = y0 + 16; y < y1; y += 18) g.fillRect(x0 + 24, y, 32, 2);
      }
    }
  });
}
function flowerTex() {   // a National Day flower bed, red and gold
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#1e3a1a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) {
      g.fillStyle = pick(['#e8202a', '#ff3a2a', '#ffcc22', '#ff9a1a', '#d81830', '#ffe04a']);
      g.beginPath(); g.arc(rand(0, w), rand(0, h), rand(1.5, 3.2), 0, Math.PI * 2); g.fill();
    }
  });
}
function tiTex() {   // the opera house's titanium panels, and a few small lamps set into the shell
  const map = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8e949e'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { const v = randi(-14, 14); g.fillStyle = `rgb(${152 + v},${158 + v},${168 + v})`; g.fillRect(x + 1, y + 1, 30, 30); }
  });
  const glow = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#16181e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) {
      const x = randi(0, 7) * 32 + 16, y = randi(0, 7) * 32 + 16, gr = g.createRadialGradient(x, y, 0, x, y, 5);
      gr.addColorStop(0, '#fff8e0'); gr.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = gr; g.fillRect(x - 5, y - 5, 10, 10);
    }
  });
  return { map, glow };
}
function stageGlassTex() {   // the glass curtain: warm foyers floor above floor behind the mullions
  return canvasTex(128, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#ffd690'); gr.addColorStop(0.55, '#ffb658'); gr.addColorStop(1, '#ffe2aa');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(255,255,240,${rand(0.12, 0.4)})`; g.fillRect(rand(0, w), rand(0, h), rand(4, 22), rand(2, 6)); }
    g.fillStyle = 'rgba(70,40,20,0.75)';
    for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 4);
    for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 2, h);
  });
}
function stoneTex() {   // dressed grey-white stone in courses
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#d8d2c6'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 24 - 24; x < w; x += 48) {
      const v = randi(-14, 10); g.fillStyle = `rgb(${210 + v},${204 + v},${192 + v})`; g.fillRect(x + 1, y + 1, 46, 14);
    }
  });
}
function ruinTex() {   // marble of the Xiyanglou: courses, rain streaks, lichen
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#d6d0c2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = pick(['#c8c2b4', '#e2ddd0', '#bdb6a6', '#a8a294']); g.globalAlpha = rand(0.08, 0.3); g.fillRect(rand(0, w), rand(0, h), rand(2, 10), rand(2, 6)); }
    g.globalAlpha = 1; g.strokeStyle = 'rgba(90,84,74,0.55)'; g.lineWidth = 1.5;
    for (let y = 0; y < h; y += 32) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      for (let x = (y / 32) % 2 ? 0 : 40; x < w; x += 80) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); }
    }
    for (let i = 0; i < 26; i++) {
      const x = rand(0, w), y = rand(0, h * 0.6), len = rand(30, 120), gr = g.createLinearGradient(0, y, 0, y + len);
      gr.addColorStop(0, 'rgba(60,58,54,0.35)'); gr.addColorStop(1, 'rgba(60,58,54,0)');
      g.fillStyle = gr; g.fillRect(x, y, rand(2, 7), len);
    }
  });
}
function trophyTex() {   // the stone screens of Guanshuifa: armour, banners, drums and spears carved in relief
  return canvasTex(128, 192, (g, w, h) => {
    g.fillStyle = '#cfc8b8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8a8274'; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12);
    g.lineWidth = 2; g.strokeStyle = '#6e675a'; g.fillStyle = '#e4dece';
    for (const s of [-1, 1]) {   // crossed banners and spears
      g.beginPath(); g.moveTo(w / 2, h * 0.7); g.lineTo(w / 2 + s * 46, 24); g.stroke();
      g.beginPath(); g.moveTo(w / 2 + s * 44, 26); g.lineTo(w / 2 + s * 20, 34); g.lineTo(w / 2 + s * 30, 58); g.lineTo(w / 2 + s * 40, 50); g.closePath(); g.fill(); g.stroke();
    }
    g.beginPath(); g.ellipse(w / 2, h * 0.45, 22, 30, 0, 0, Math.PI * 2); g.fill(); g.stroke();   // the cuirass
    g.beginPath(); g.moveTo(w / 2 - 16, h * 0.32); g.lineTo(w / 2, h * 0.4); g.lineTo(w / 2 + 16, h * 0.32); g.stroke();
    g.beginPath(); g.arc(w / 2, h * 0.24, 13, Math.PI, 0); g.fill(); g.stroke();                 // helmet
    g.beginPath(); g.ellipse(w / 2, h * 0.78, 30, 12, 0, 0, Math.PI * 2); g.fill(); g.stroke();   // drum
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(70,66,58,${rand(0.05, 0.2)})`; g.fillRect(rand(0, w), rand(0, h), rand(1, 5), rand(1, 8)); }
  });
}
function wellTex() {   // the bronze cover over the old well that named Wangfujing
  return canvasTex(256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    gr.addColorStop(0, '#b8925a'); gr.addColorStop(1, '#5a4024');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#3a2814'; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(128, 128, 96, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#2e2010'; g.font = `400 64px ${CN}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('王府井', 128, 134);
  });
}
function vSignTex(text, { bg = '#d8d4cc', fg = '#b81c22', w = 128, font = CN } = {}) {   // characters read top to bottom on a stone or board
  const n = [...text].length, h = w * n + 32;
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = `400 ${w * 0.72}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    [...text].forEach((c, i) => g.fillText(c, w / 2, 16 + w * (i + 0.5)));
  }, { repeat: false });
}
function stainedTex() {   // a round-headed window of coloured glass in lead
  return canvasTex(64, 128, (g, w, h) => {
    for (let y = 0; y < h; y += 12) for (let x = 0; x < w; x += 12) {
      g.fillStyle = pick(['#c8202a', '#2a4ab8', '#e8b830', '#2a8a5a', '#8a2ab8', '#e86a2a', '#3a7ad8']); g.fillRect(x, y, 12, 12);
    }
    g.fillStyle = 'rgba(255,240,210,0.35)'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1a1414'; g.lineWidth = 2;
    for (let y = 0; y <= h; y += 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    for (let x = 0; x <= w; x += 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  });
}
function roseTex() {   // the rose window
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#1a1414'; g.fillRect(0, 0, 128, 128);
    for (let k = 0; k < 12; k++) {
      const a0 = (k / 12) * Math.PI * 2, a1 = ((k + 1) / 12) * Math.PI * 2;
      for (const [r0, r1, c] of [[16, 40, pick(['#2a4ab8', '#c8202a'])], [42, 62, pick(['#e8b830', '#2a8a5a', '#8a2ab8'])]]) {
        g.fillStyle = c; g.beginPath(); g.arc(64, 64, r1, a0 + 0.04, a1 - 0.04); g.arc(64, 64, r0, a1 - 0.04, a0 + 0.04, true); g.fill();
      }
    }
    g.fillStyle = '#e8b830'; g.beginPath(); g.arc(64, 64, 13, 0, Math.PI * 2); g.fill();
  }, { repeat: false });
}
function graffitiTex() {   // a sprayed wall at 798: blobs, drips, tags
  return canvasTex(512, 128, (g, w, h) => {
    g.fillStyle = '#5a5a5e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = pick(['#ff3d8a', '#3dd6ff', '#ffd23d', '#7cff5a', '#ff7a2a', '#b46bff', '#ffffff']);
      g.globalAlpha = rand(0.6, 0.95);
      g.beginPath(); g.ellipse(rand(0, w), rand(10, h - 10), rand(14, 60), rand(10, 34), rand(0, 3), 0, Math.PI * 2); g.fill();
      g.fillRect(rand(0, w), rand(h * 0.4, h), 3, rand(10, 40));
    }
    g.globalAlpha = 1; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [t, x, c] of [['798', 90, '#ffffff'], ['ART', 250, '#141414'], ['LOVE', 410, '#ffd23d']]) {
      g.font = '900 64px "Russo One", "Arial Black", sans-serif'; g.lineWidth = 8; g.strokeStyle = '#141414';
      g.save(); g.translate(x, h / 2); g.rotate(rand(-0.15, 0.15)); g.strokeText(t, 0, 0); g.fillStyle = c; g.fillText(t, 0, 0); g.restore();
    }
  });
}
function signTex(text, sub, { bg = '#f2ead8', fg = '#c8141e', font = CN, w = 1024, h = 128 } = {}) {   // a long name board
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `400 ${Math.round(h * 0.72)}px ${font}`;
    const m = g.measureText(text).width, sc = Math.min(1, (w * 0.9) / m);
    g.save(); g.translate(w / 2, h / 2 + (sub ? -h * 0.08 : 0)); g.scale(sc, 1); g.fillText(text, 0, 0); g.restore();
    if (sub) { g.font = `700 ${Math.round(h * 0.18)}px "Chakra Petch", sans-serif`; g.fillText(sub, w / 2, h * 0.88); }
  }, { repeat: false });
}

export function bjSights(K) {
  const T = treeKit(), PT = parkTreeKit(), upd = [];
  const bulbMat = basic({ map: bulbTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: hdr('#ffe2a8', 2.0) });
  const gold = std({ color: '#e8b84a', metalness: 0.6, roughness: 0.3, emissive: '#7a5a10', emissiveIntensity: 0.6 });
  const stoneLit = uplit(std({ vertexColors: true, roughness: 0.75, emissive: '#ffdcaa', emissiveIntensity: 0.42 }), 18, 1.5, 0.35);
  const latticeR = dim(K.latticeMat, 0.45), paintR = dim(K.paintMat, 0.45), goldR = dim(K.goldTile, 0.5), greenR = dim(K.greenTile, 0.5), greyR = dim(K.tileGrey, 0.5);
  const reflSwap = () => new Map([[K.latticeMat, latticeR], [K.paintMat, paintR], [K.goldTile, goldR], [K.greenTile, greenR], [K.tileGrey, greyR]]);
  const water = (m) => { upd.push((t) => m.userData.scroll.offset.set(t * 0.006, t * 0.015)); return m; };
  const plate = (b, text, x, y, z, ry, w = 2.6) => b.add(G.plane, K.nameplate(text), x, y, z, w, w * 0.32, 1, 0, ry, 0);

  // ---------- 人民大会堂 · 国家大剧院 ----------
  const hallTex = hallFaceTex();
  const hallFace = uplit(std({ map: hallTex, emissiveMap: hallTex, emissive: '#ffffff', emissiveIntensity: 0.46, roughness: 0.8 }), 18, 1.1, 0.42);
  const hallShade = uplit(std({ map: hallTex, emissiveMap: hallTex, color: '#8a8478', emissive: '#ffffff', emissiveIntensity: 0.26, roughness: 0.85 }), 16, 1.2, 0.3);
  const colStone = uplit(std({ vertexColors: true, roughness: 0.6, emissive: '#ffd8a8', emissiveIntensity: 0.4 }), 16, 1.6, 0.18);
  const et = emblemTex(), emblemMat = std({ map: et, emissiveMap: et, emissive: '#ffffff', emissiveIntensity: 0.75, alphaTest: 0.5, roughness: 0.4, metalness: 0.3 });
  const ft = flagTex(), flagMat = std({ map: ft, emissiveMap: ft, emissive: '#ffffff', emissiveIntensity: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
  const flagGeo = (() => {
    const g = new THREE.PlaneGeometry(2.7, 1.8, 10, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + 1.35; p.setZ(i, Math.sin(x * 2.1) * 0.16 * (x / 2.7)); }
    g.translate(1.35, 0, 0); g.computeVertexNormals();
    return g;
  })();
  const bt = flowerTex(); bt.repeat.set(6, 1);
  const bedMat = std({ map: bt, emissiveMap: bt, emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.9 });
  // a sloped band of glazed tiles along a wall top facing +z: from the wall out `d`, dropping `drop`
  const eave = (b, mat, x0, x1, y, z, d = 1.5, drop = 0.9) => {
    const w = Math.hypot(d, drop);
    b.addM(tiledBox(x1 - x0, 0.22, w, 1.0), mat, new THREE.Matrix4().makeRotationX(Math.atan2(drop, d)).setPosition((x0 + x1) / 2, y - drop / 2, z + d / 2), 0xffffff);
  };
  const greatHall = (b) => {   // modelled facing +z: wings with pilasters, end pavilions, the portico of twelve columns under the emblem
    const H = 17;
    b.box(VC.solid, '#7a6e58', 0, 9.5, -14, 72, 19, 28);
    b.box(VC.solid, '#7a6e58', 0, 12, -16, 26, 24, 24);
    for (const [x0, x1] of [[-30, -14.5], [14.5, 30]]) {
      const len = x1 - x0, xc = (x0 + x1) / 2;
      b.addM(faceGeo(len, H, 12.8), hallFace, at(xc, H / 2, 0.02), 0xffffff);
      for (let k = 0; k * 3.2 < len; k++) b.box(stoneLit, '#e2d6b6', x0 + k * 3.2 + 0.3, H / 2 + 0.4, 0.2, 0.62, H - 2.4, 0.4);
      b.box(VC.solid, '#8a867c', xc, 0.6, 0.7, len, 1.2, 1.4);
      eave(b, K.goldTile, x0, x1, 17.9, 0, 1.5, 0.9);
      b.box(stoneLit, '#d8cca8', xc, 18.5, -0.6, len, 1.2, 1.2);
      bulbs(b, bulbMat, x0, 16.95, 1.55, x1, 16.95, 1.55);
      bulbs(b, bulbMat, x0, 19.15, 0.02, x1, 19.15, 0.02);
      for (let x = x0 + 1.9; x < x1; x += 3.2) b.box(VC.glow, hdr('#ffd9a0', 1.6), x, 0.15, 1.6, 0.5, 0.3, 0.4);
    }
    for (const s of [-1, 1]) {   // end pavilions, a step forward and higher
      b.box(VC.solid, '#7a6e58', s * 33, 9.2, -0.4, 6, 18.4, 3.2);
      b.addM(faceGeo(6, 18.4, 12.8), hallFace, at(s * 33, 9.2, 1.22), 0xffffff);
      for (const dx of [-2.7, 2.7]) b.box(stoneLit, '#e2d6b6', s * 33 + dx, 9.2, 1.42, 0.7, 18.4, 0.4);
      eave(b, K.goldTile, s * 33 - 3.2, s * 33 + 3.2, 19.3, 1.2, 1.3, 0.8);
      bulbs(b, bulbMat, s * 30, 18.45, 2.55, s * 36, 18.45, 2.55);
      for (const x of [s * 30.02, s * 35.98]) bulbs(b, bulbMat, x, 0.6, 1.3, x, 18.4, 1.3, { wd: [1, 0, 0] });
    }
    // the portico: steps, twelve columns, the entablature with the emblem, the central block behind
    for (let k = 0; k < 7; k++) { const zf = 11 - k * 0.6; b.box(VC.solid, k % 2 ? '#a8a294' : '#9e988a', 0, (k + 1) * 0.27 - 0.135, (zf - 2.5) / 2, 31 - k * 0.2, 0.27, zf + 2.5); }
    for (let k = 0; k < 12; k++) {
      const x = -13.2 + k * 2.4;
      b.box(colStone, '#b8b2a4', x, 2.15, 4.2, 1.5, 0.5, 1.5);
      b.cyl(colStone, '#c8c2b2', x, 9.4, 4.2, 0.62, 14);
      b.box(colStone, '#d0c8b6', x, 16.7, 4.2, 1.6, 0.6, 1.6);
      b.box(VC.glow, hdr('#ffd9a0', 2.0), x, 2.05, 5.2, 0.4, 0.2, 0.3);
    }
    b.addM(faceGeo(28.8, 15.1, 12.8), hallShade, at(0, 9.45, -2.48), 0xffffff);
    b.box(stoneLit, '#d8ceb4', 0, 18.3, 1.25, 29, 2.6, 7.5);
    b.add(G.plane, emblemMat, 0, 18.3, 5.03, 2.4, 2.4, 1);
    eave(b, K.goldTile, -14.8, 14.8, 20.4, 4.6, 1.4, 0.9);
    bulbs(b, bulbMat, -14.6, 17.05, 5.05, 14.6, 17.05, 5.05);
    bulbs(b, bulbMat, -14.8, 19.5, 6.05, 14.8, 19.5, 6.05);
    for (let x = -11; x <= 11; x += 2.2) b.box(VC.glow, hdr('#ffe2b0', 1.0), x, 21.9, -3.95, 1.0, 1.6, 0.1);
    eave(b, K.goldTile, -13.2, 13.2, 24.6, -4, 1.4, 0.8);
    bulbs(b, bulbMat, -13, 23.75, -2.55, 13, 23.75, -2.55);
    b.cyl(VC.metal, '#d8dce4', 0, 27.8, -10, 0.08, 7.6);
    b.add(flagGeo, flagMat, 0.1, 30.6, -10, 1, 1, 1);
    // National Day beds of red and gold in front of the wings
    for (const s of [-1, 1]) {
      b.box(VC.solid, '#22301c', s * 23, 0.25, 12.6, 14, 0.5, 2.6);
      b.add(G.plane, bedMat, s * 23, 0.51, 12.6, 14, 2.4, 1, -Math.PI / 2, 0, 0);
    }
  };
  // the National Centre for the Performing Arts: a titanium half-ellipsoid split along its length by a glass curtain,
  // narrow over the top and opening wide down to both ends; modelled along z, its foot at y = 0
  const tt = tiTex();
  const tiMat = std({ map: tt.map, emissiveMap: tt.glow, emissive: '#ffffff', emissiveIntensity: 1.4, color: '#b4b8c4', metalness: 0.55, roughness: 0.42, vertexColors: true });
  const sgt = stageGlassTex();
  const stageGlass = basic({ map: sgt, color: hdr('#ffffff', 0.9) }), stageGlassR = basic({ map: sgt, color: hdr('#ffffff', 0.4) });
  const ncpaGeo = (() => {
    const a = 18, bz = 25, c = 11.5, NT = 36, out = { ti: [[], [], []], gl: [[], [], []] };
    const seam = (t) => (Math.PI / 2) * (1 - (0.07 + 0.33 * Math.sin(t) ** 2));
    const pt = (t, f) => { const r = Math.cos(t); return [a * r * Math.cos(f), c * r * Math.sin(f), bz * Math.sin(t)]; };
    const n = new THREE.Vector3();
    const regions = [['ti', () => 0, (t) => seam(t), 12], ['gl', (t) => seam(t), (t) => Math.PI - seam(t), 8], ['ti', (t) => Math.PI - seam(t), () => Math.PI, 6]];
    for (let j = 0; j < NT; j++) {
      const t0 = -Math.PI / 2 + (Math.PI * j) / NT, t1 = -Math.PI / 2 + (Math.PI * (j + 1)) / NT;
      for (const [k, lo, hi, m] of regions) for (let i = 0; i < m; i++) {
        const f = (t, s) => lo(t) + (hi(t) - lo(t)) * s;
        const A = [t0, f(t0, i / m)], B = [t0, f(t0, (i + 1) / m)], C = [t1, f(t1, (i + 1) / m)], D = [t1, f(t1, i / m)];
        for (const [t, ff] of [A, B, C, A, C, D]) {
          const p = pt(t, ff);
          out[k][0].push(...p);
          n.set(p[0] / (a * a), p[1] / (c * c), p[2] / (bz * bz)).normalize();
          out[k][1].push(n.x, n.y, n.z);
          if (k === 'ti') out[k][2].push((ff * a) / 12, (t * bz) / 12);
          else out[k][2].push(p[0] / 6 + 0.5, p[1] / 7);
        }
      }
    }
    const geo = ([p, nn, uv]) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nn, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      return g;
    };
    return { ti: geo(out.ti), gl: geo(out.gl) };
  })();
  const ncpa = (b) => { b.addM(ncpaGeo.ti, tiMat, I4, '#ffffff'); b.addM(ncpaGeo.gl, stageGlass, I4, 0xffffff); };
  const lakeLamp = (b, x, z) => {
    b.cyl(VC.metal, '#c8ccd4', x, 1.5, z, 0.06, 3.0, 'cyl8');
    b.cyl(VC.glow, hdr('#fff0d0', 1.3), x, 3.15, z, 0.14, 0.26, 'cyl8');
  };
  const operaLake = clearWater('#0c1428', 5, 0.6);
  water(operaLake);
  const dahuitang = () => {
    const b = new Batcher();
    farGround(b, 1, '#1e1d1c');
    b.box(VC.solid, '#4a4844', 12.6, 0.03, -40, 18, 0.03, 80);
    put(b, greatHall, 19.5, 0, -40, -Math.PI / 2);
    for (const z of [-5, -75]) K.huadeng(b, EDGE + 2.6, z, 0.95);
    for (const z of [-34, -46]) K.huadeng(b, EDGE + 2.0, z, 0.95);
    K.crowd(b, 4.4, 5.4, 2, 78, 10); K.crowd(b, 9.2, 13, 2, 22, 6); K.crowd(b, 9.2, 13, 58, 78, 6);
    // the opera house in its lake, turned so the glass at its south-east end faces the runner
    const yw = -0.35, r = new Batcher();
    put(r, ncpa, -36, yw, -56, Math.PI / 4);
    for (let z = -6; z > -80; z -= 10) lakeLamp(r, -11.4, z);
    mergeInto(b, r);
    mirrorInto(b, r, yw, 0.45, new Map([[stageGlass, stageGlassR]]));
    b.add(G.plane, operaLake, -52, yw, -40, 80, 80, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#05070c', -52, -16.2, -40, 80, 0.4, 80);
    b.box(VC.solid, '#6a6862', -11.4, -8, -40, 1.4, 16.6, 80);
    b.box(VC.solid, '#2a2a2c', -92.2, -8, -40, 0.4, 16.6, 80);
    for (const z of [-0.2, -79.8]) b.box(VC.solid, '#2a2a2c', -52, -8, z, 80, 16.6, 0.4);
    b.box(VC.solid, '#1a1c1a', -122, -0.2, -40, 60, 0.2, 80);
    for (let z = -6; z > -80; z -= 12) T.camphor(b, rand(-98, -106), z + rand(-3, 3), rand(1.0, 1.3));
    K.crowd(b, -4.6, -10, 2, 78, 12);
    return lastAdditive(b.build());
  };

  // ---------- 颐和园 · 十七孔桥 ----------
  const st = stoneTex(); st.repeat.set(0.4, 0.4);
  const bridgeMat = uplit(std({ map: st, emissiveMap: st, color: '#e8e0d0', vertexColors: true, roughness: 0.85, emissive: '#ffc890', emissiveIntensity: 0.5 }), 6, 1.5, 0.6);
  const archGlow = hdr('#ffc26a', 1.7);
  // the Seventeen-Arch Bridge from (X0, Zc) out along -x: arches growing to the middle, its deck humped over them
  const seventeen = (b, X0, Zc, yw) => {
    const spans = [], pier = 0.5, abut = 3, W = 7.2;
    for (let i = 0; i < 17; i++) spans.push(3.9 - 0.2 * Math.abs(i - 8));
    const L = spans.reduce((s, v) => s + v, 0) + pier * 16 + abut * 2;
    const deck = (x) => { const u = (x / L) * 2 - 1; return 1.3 + 3.2 * Math.pow(Math.max(0, 1 - u * u), 0.7); };
    const sh = new THREE.Shape(), bottom = -1.2;
    sh.moveTo(0, bottom); sh.lineTo(L, bottom);
    for (let i = 48; i >= 0; i--) sh.lineTo((L * i) / 48, deck((L * i) / 48));
    const arches = [];
    let x = abut;
    spans.forEach((s, i) => {
      const r = s / 2, spring = 0.45 + 1.25 * Math.pow(1 - Math.abs(i - 8) / 8, 1.5), cx = x + r, h = new THREE.Path();
      h.moveTo(x, bottom + 0.4); h.lineTo(x + s, bottom + 0.4); h.lineTo(x + s, spring); h.absarc(cx, spring, r, 0, Math.PI, false); h.lineTo(x, bottom + 0.4);
      sh.holes.push(h); arches.push([cx, spring, r]);
      x += s + pier;
    });
    const g = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false, curveSegments: 10 }), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.5, uv.getY(i) / 2.5);
    b.addM(g, bridgeMat, new THREE.Matrix4().makeRotationY(Math.PI).setPosition(X0, yw, Zc + W / 2), '#ffffff');   // a half turn: shape x runs out along -x
    const zf = Zc + W / 2 + 0.03;
    for (const [cx, spring, r] of arches) {   // the lit rim of every arch, and the stilted jambs below it
      b.add(new THREE.TorusGeometry(r, 0.07, 3, 14, Math.PI), VC.glow, X0 - cx, yw + spring, zf, 1, 1, 1, 0, 0, 0, archGlow);
      for (const s of [-1, 1]) if (spring > 0.5) b.box(VC.glow, archGlow, X0 - cx + s * r, yw + spring / 2, zf, 0.14, spring, 0.05);
    }
    const N = 44;
    for (const zz of [Zc + W / 2 - 0.2, Zc - W / 2 + 0.2]) {   // balustrades with a little lion on every post
      let prev = null;
      for (let i = 0; i <= N; i++) {
        const xs = (L * i) / N, y = yw + deck(xs), xw = X0 - xs;
        b.box(stoneLit, '#e4ded2', xw, y + 0.5, zz, 0.24, 1.0, 0.24);
        b.box(stoneLit, '#d8d2c6', xw, y + 1.1, zz, 0.2, 0.2, 0.28);
        if (prev) {
          beam(b, stoneLit, prev[0], prev[1] + 0.82, zz, xw, y + 0.82, zz, 0.1, '#e8e2d6', 0.14);
          beam(b, stoneLit, prev[0], prev[1] + 0.28, zz, xw, y + 0.28, zz, 0.1, '#d8d2c6', 0.14);
        }
        if (i % 2 === 0) b.box(VC.glow, hdr('#ffd28a', 2.2), xw, y + 1.3, zz, 0.13, 0.13, 0.13);
        prev = [xw, y];
      }
    }
    for (let k = 0; k < 4; k++) b.box(stoneLit, '#bcb6aa', X0 + 1.0 + k * 0.7, 0.08 + yw + deck(0) - (k + 1) * 0.16, Zc, 0.8, 0.4, W - 0.4);   // steps down to the dike
    return L;
  };
  const kuoru = (b, x, z) => {   // Kuoru Pavilion: eight-sided, double eaves, three rings of columns
    b.add(G.cyl8, VC.solid, x, 0.35, z, 17, 0.7, 17, 0, 0, 0, '#8a867c');
    for (const r of [7.2, 5.0, 2.8]) for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      b.cyl(VC.solid, VERM, x + Math.cos(a) * r, 2.9, z + Math.sin(a) * r, 0.24, 4.4, 'cyl8');
    }
    b.add(new THREE.CylinderGeometry(7.5, 7.5, 0.7, 8, 1, true), K.paintMat, x, 4.75, z, 1, 1, 1);
    b.addM(roofCone(9.6, 6.0, 1.8), K.tileGrey, at(x, 5.1, z), 0xffffff);
    b.add(new THREE.CylinderGeometry(5.6, 5.6, 1.6, 8), K.latticeMat, x, 7.7, z, 1, 1, 1);
    b.addM(roofCone(7.4, 0, 4.2), K.tileGrey, at(x, 8.5, z), 0xffffff);
    b.sph(gold, 0xffffff, x, 12.9, z, 0.45);
    for (const [r, y] of [[9.9, 5.25], [7.7, 8.65]]) for (let k = 0; k < 8; k++) {   // the eave corners sweeping up
      const a = (k / 8) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      b.add(G.box, VC.solid, x + c * r, y + 0.35, z + s * r, 1.5, 0.22, 0.3, 0, -a, 0.45, '#26282d');
    }
    for (let k = 0; k < 8; k++) { const a = ((k + 0.5) / 8) * Math.PI * 2; K.lantern(b, x + Math.cos(a) * 7.0, 4.1, z + Math.sin(a) * 7.0, 0.55); }
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.box(VC.glow, hdr('#ffd28a', 2.0), x + Math.cos(a) * 8.9, 0.75, z + Math.sin(a) * 8.9, 0.4, 0.15, 0.4); }
  };
  const bronzeOx = (b) => {   // the Bronze Ox on the East Dike, lying down and watching the water (modelled facing +z)
    b.block(VC.solid, '#8a8780', 0, 0, 0, 2.2, 0.9, 3.4);
    const br = '#6a5228';
    b.add(G.sph, VC.metal, 0, 1.5, -0.2, 1.4, 1.1, 2.6, 0, 0, 0, br);
    b.add(G.sph, VC.metal, 0, 1.9, 1.15, 0.7, 0.75, 0.95, -0.3, 0, 0, br);
    for (const s of [-1, 1]) {
      b.add(G.cone8, VC.metal, s * 0.32, 2.35, 1.0, 0.12, 0.55, 0.12, 0, 0, s * 0.8, br);
      b.add(G.box, VC.metal, s * 0.6, 1.0, 0.7, 0.35, 0.22, 0.8, 0, 0, 0, br);
    }
    b.box(VC.glow, hdr('#ffd28a', 2.0), 0, 0.12, 2.0, 0.6, 0.2, 0.3);
  };
  const dragonBoat = (b) => {   // a painted dragon boat with a lit two-tier cabin (modelled bow toward -z)
    b.add(G.sph, VC.solid, 0, 0.1, 0, 2.8, 1.4, 11, 0, 0, 0, '#7a1a14');
    b.box(VC.solid, '#e8b84a', 0, 0.62, 0, 2.6, 0.12, 9.4);
    b.box(VC.solid, '#3a2418', 0, 0.55, 0, 2.4, 0.1, 9);
    b.add(G.box, K.latticeMat, 0, 1.45, 0.6, 2.0, 1.6, 4.4);
    b.add(G.box, K.paintMat, 0, 2.35, 0.6, 2.3, 0.3, 4.7);
    K.roof(b, K.goldTile, 0, 2.5, 0.6, 4.8, 2.4, 0.9, { ry: Math.PI / 2, eave: 0.4, lift: 0.7, ridge: '#a87a12' });
    beam(b, VC.solid, 0, 0.6, -4.6, 0, 2.3, -5.6, 0.45, '#e8b84a');
    b.add(G.box, VC.solid, 0, 2.5, -6.0, 0.6, 0.55, 1.1, 0, 0, 0, '#e8b84a');
    b.add(G.box, VC.solid, 0, 2.3, -6.6, 0.5, 0.3, 0.5, 0, 0, 0, '#c8302a');
    for (const s of [-1, 1]) b.add(G.cone8, VC.solid, s * 0.2, 2.95, -5.8, 0.1, 0.5, 0.1, -0.5, 0, s * 0.3, '#e8b84a');
    beam(b, VC.solid, 0, 0.6, 4.6, 0, 1.9, 5.4, 0.3, '#e8b84a');
    beam(b, VC.solid, 0, 1.9, 5.4, 0, 2.3, 5.0, 0.22, '#e8b84a');
    for (const [x, z] of [[-1.15, -1.6], [1.15, -1.6], [-1.15, 2.8], [1.15, 2.8]]) K.lantern(b, x, 2.05, z, 0.45);
  };
  const kunming = clearWater('#0e1a30', 6, 0.58);
  water(kunming);
  const yiheyuan = () => {
    const b = new Batcher(), yw = -0.7, r = new Batcher();
    farGround(b, 1, '#181a18');
    // the lake: the bridge out to South Lake Island, two dragon boats; all of it mirrored
    const L = seventeen(r, -11, -74, yw);
    const ix = -11 - L - 11, iz = -74;
    r.addM(new THREE.CylinderGeometry(13, 14, 14, 20), VC.solid, at(ix, yw - 6.2, iz), '#5a564e');
    r.add(G.cyl, VC.solid, ix, yw + 0.82, iz, 25, 0.08, 25, 0, 0, 0, '#1c241a');
    K.hall(r, ix - 2, iz, { w: 12, d: 7, h: 4.0, base: 0.6, y: yw + 0.8, roof: K.greenTile, ry: Math.PI / 2 });
    for (const dz of [-3, 3]) K.lantern(r, ix + 2.2, yw + 4.6, iz + dz, 0.6);
    for (const [dx, dz] of [[-6, -8], [4, -9], [-8, 6], [3, 8], [-10, -1]]) T.camphor(r, ix + dx, iz + dz, rand(1.1, 1.4), { y: yw + 0.8 });
    for (const [dx, dz] of [[7, -6], [8, 5]]) K.cypress(r, ix + dx, iz + dz, rand(1.0, 1.2), { y: yw + 0.8 });
    put(r, dragonBoat, -34, yw, -34, 0.25);
    put(r, dragonBoat, -58, yw, -52, -0.4);
    mergeInto(b, r);
    mirrorInto(b, r, yw, 0.5, reflSwap());
    b.add(G.plane, kunming, -71, yw, -40, 120, 80, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#04060c', -71, -16, -40, 120, 0.4, 80);
    b.box(VC.solid, '#6a6862', -11.2, -7.9, -40, 1.0, 16.4, 80);
    for (const z of [-0.2, -79.8]) b.box(VC.solid, '#2a2a2c', -71, -7.9, z, 120, 16.4, 0.4);
    b.box(VC.solid, '#2a2a2c', -131.2, -7.9, -40, 0.4, 16.4, 80);
    b.box(VC.solid, '#121412', -151, -0.2, -40, 40, 0.2, 80);
    // the dike: a marble rail along the water, willows leaning over it, palace lamps
    K.balustrade(b, -10.9, -0.5, -10.9, -69.8, 0.1, 1.5);
    for (const z of [4, 78]) T.willow(b, -9.6, -z, rand(0.95, 1.1), { ry: rand(-0.4, 0.4) });
    for (let z = 8; z < 80; z += 16) { K.gongdeng(b, -(EDGE + 1.2), -z, -1); K.gongdeng(b, EDGE + 1.2, -z, 1); }
    // the other side: the East Palace Gate with its name board, the Bronze Ox, Kuoru Pavilion at the bridge's foot
    K.hall(b, 24, -16, { w: 18, d: 9, h: 5.2, base: 1.0, roof: K.goldTile, ry: Math.PI / 2 });
    plate(b, '颐和园', 19.0, 5.15, -16, -Math.PI / 2, 3.4);
    for (const dz of [-5, 5]) { K.lion(b, 16.2, -16 + dz, -Math.PI / 2); K.lantern(b, 18.8, 5.0, -16 + dz * 0.8, 0.8); }
    b.box(VC.solid, '#4a4642', 15, 0.03, -16, 8, 0.03, 20);
    put(b, bronzeOx, 9.6, 0, -50, -Math.PI / 2);
    kuoru(b, 18, -68);
    for (let z = 28; z < 80; z += 9) if (Math.abs(z - 50) > 4 && Math.abs(z - 68) > 9) T.willow(b, 11.5, -z, rand(0.95, 1.1), { ry: Math.PI + rand(-0.4, 0.4) });
    for (const z of [30, 42, 58]) K.ginkgo(b, 15.5, -z, rand(0.95, 1.1));
    K.crowd(b, 4.6, 9.6, 2, 78, 16); K.crowd(b, -4.6, -9.6, 2, 66, 12);
    return lastAdditive(b.build());
  };

  // ---------- 圆明园 · 大水法 ----------
  const rt = ruinTex(), ruin = uplit(std({ map: rt, emissiveMap: rt, vertexColors: true, roughness: 0.9, emissive: '#ffd0a0', emissiveIntensity: 0.42 }), 9, 1.6, 0.3);
  const tph = trophyTex(), trophy = uplit(std({ map: tph, emissiveMap: tph, emissive: '#ffd0a0', emissiveIntensity: 0.42, roughness: 0.9 }), 6, 1.4, 0.45);
  const rbox = (b, x, y, z, w, h, d, col = '#ffffff', ry = 0) => b.addM(tiledBox(w, h, d, 3.3), ruin, new THREE.Matrix4().makeRotationY(ry).setPosition(x, y + h / 2, z), col);
  const jag = (pts) => { const s = new THREE.Shape(); s.moveTo(...pts[0]); for (const p of pts.slice(1)) s.lineTo(...p); s.lineTo(...pts[0]); return s; };
  const dashuifa = (b) => {   // the Great Fountain's broken stone gateway, its wings and two pylons (modelled facing +z)
    const W = 5.6, R = 2.7, Hs = 6.0, sh = new THREE.Shape();
    sh.moveTo(-W, 0); sh.lineTo(-R, 0); sh.lineTo(-R, Hs); sh.absarc(0, Hs, R, Math.PI, 0, true); sh.lineTo(R, 0); sh.lineTo(W, 0);
    for (const [x, y] of [[W, 7.6], [4.7, 9.3], [3.7, 8.9], [3.1, 10.5], [1.7, 11.2], [0.5, 10.8], [-0.5, 11.5], [-1.7, 10.1], [-2.5, 10.4], [-3.3, 8.8], [-4.4, 9.1], [-W, 8.0]]) sh.lineTo(x, y);
    sh.lineTo(-W, 0);
    b.addM(slab(sh, 2.4), ruin, at(0, 0, -1.2), '#ffffff');
    for (const x of [-(R + 0.55), R + 0.55, -(W - 0.45), W - 0.45]) rbox(b, x, 0, 1.35, 0.7, 7.0, 0.3, '#f0ece4');
    for (const s of [-1, 1]) rbox(b, s * (W + R) / 2, Hs - 0.2, 1.38, W - R - 0.1, 0.4, 0.4, '#f0ece4');
    b.add(new THREE.TorusGeometry(R + 0.3, 0.22, 4, 18, Math.PI), ruin, 0, Hs, 1.25, 1, 1, 1, 0, 0, 0, '#f0ece4');
    rbox(b, 0, Hs + R, 1.3, 0.9, 1.1, 0.5, '#f0ece4');
    for (const s of [-1, 1]) {
      const wing = jag([[0, 0], [6.5, 0], [6.5, 3.2], [5.6, 4.4], [4.2, 4.0], [3.0, 5.2], [1.6, 4.7], [0.4, 5.9], [0, 5.6]]);
      b.addM(slab(wing, 1.4), ruin, new THREE.Matrix4().makeRotationY(s > 0 ? 0.5 : Math.PI - 0.5).setPosition(s * W, 0, s > 0 ? 0.4 : -0.85), '#e8e4dc');
      const x = s * 11.5, z = 4.5, broken = s < 0;
      rbox(b, x, 0, z, 2.4, 1.2, 2.4);
      rbox(b, x, 1.2, z, 1.5, broken ? 4.2 : 6.4, 1.5);
      if (!broken) { rbox(b, x, 7.6, z, 2.0, 0.45, 2.0, '#f0ece4'); b.add(G.cone4, ruin, x, 8.75, z, 1.6, 1.8, 1.6, 0, 0, 0, '#e8e4dc'); }
      else rbox(b, x + 1.6, 0, z + 1.4, 1.4, 0.9, 1.6, '#d8d4cc', 0.5);
      b.add(G.plane, trophy, x, 1.2 + (broken ? 2.0 : 3.0), z + 0.76, 1.2, broken ? 3.4 : 5.2, 1);
      b.box(VC.glow, hdr('#ffd0a0', 2.0), x, 0.12, z + 1.8, 0.6, 0.18, 0.3);
    }
    for (const x of [-4.2, 4.2]) b.box(VC.glow, hdr('#ffd0a0', 2.0), x, 0.12, 2.2, 0.8, 0.18, 0.3);
    // the empty basin in front, ringed with stone, and the fountain's broken pieces strewn about
    for (let k = 0; k < 36; k++) {
      const a = (k / 36) * Math.PI * 2, x = Math.cos(a) * 8.5, z = 10 + Math.sin(a) * 4.6, dx = -Math.sin(a) * 8.5, dz = Math.cos(a) * 4.6;
      rbox(b, x, 0, z, 1.6, 0.5, 0.6, '#cfcabe', Math.atan2(-dz, dx));
    }
    b.add(G.cyl, VC.solid, 0, 0.03, 10, 16.4, 0.04, 8.6, 0, 0, 0, '#2e2c28');
    for (let i = 0; i < 12; i++) {
      const x = rand(-9, 9), z = rand(3, 15);
      if (chance(0.5)) b.add(G.cyl, ruin, x, 0.45, z, 0.9, rand(0.8, 1.6), 0.9, Math.PI / 2, rand(0, 3), 0, '#d8d4cc');
      else rbox(b, x, 0, z, rand(0.6, 1.4), rand(0.4, 0.9), rand(0.6, 1.2), '#d0ccc2', rand(0, 3));
    }
  };
  const yuanyingguan = (b) => {   // the Hall of Distant Seas: a terrace, four carved columns standing at different heights
    rbox(b, 0, 0, 0, 16, 1.8, 10);
    for (let k = 0; k < 4; k++) rbox(b, 0, k * 0.45, 5.4 + (3 - k) * 0.7, 6, 0.45, 0.8);
    for (const [x, h, cap] of [[-6, 9.0, true], [-2.4, 6.4, false], [2.4, 9.4, true], [6, 4.2, false]]) {
      rbox(b, x, 1.8, 3.6, 1.4, 0.6, 1.4);
      b.add(new THREE.CylinderGeometry(0.48, 0.52, 1, 12), ruin, x, 2.4 + h / 2, 3.6, 1, h, 1, 0, 0, 0, '#ece8e0');
      for (let y = 3.6; y < 2.4 + h - 0.4; y += 1.6) b.add(G.tor, ruin, x, y, 3.6, 1.15, 1.15, 1.6, Math.PI / 2, 0, 0, '#ddd8ce');
      if (cap) rbox(b, x, 2.4 + h, 3.6, 1.6, 0.7, 1.6, '#f0ece4');
      b.box(VC.glow, hdr('#ffd0a0', 2.0), x, 1.9, 4.8, 0.4, 0.15, 0.3);
    }
    const door = jag([[-3.2, 0], [-1.6, 0], [-1.6, 4.2], [-1.0, 5.2], [0, 5.5], [1.0, 5.2], [1.6, 4.2], [1.6, 0], [3.2, 0], [3.2, 5.8], [2.2, 7.4], [0.6, 6.8], [-0.8, 7.9], [-3.2, 6.6]]);
    b.addM(slab(door, 1.2), ruin, at(1.5, 1.8, -3.0), '#e8e4dc');
  };
  const guanshuifa = (b) => {   // where the emperor watched the fountain: five stone screens carved with trophies of war
    rbox(b, 0, 0, 0, 13, 1.2, 3.0);
    for (const [x, w, h] of [[-4.9, 2.1, 3.4], [-2.45, 2.3, 4.0], [0, 2.7, 4.8], [2.45, 2.3, 4.0], [4.9, 2.1, 3.4]]) {
      rbox(b, x, 1.2, 0, w, h, 0.55);
      b.add(G.plane, trophy, x, 1.2 + h / 2 - 0.1, 0.285, w - 0.3, h - 0.5, 1);
      rbox(b, x, 1.2 + h, 0, w + 0.25, 0.35, 0.75, '#f0ece4');
      b.box(VC.glow, hdr('#ffd0a0', 2.0), x, 1.3, 1.1, 0.5, 0.15, 0.3);
    }
  };
  const pondMat = waterMat('#0c1020', 3);
  water(pondMat);
  const steleMat = (() => { const t = textTex('大水法', { w: 512, h: 192, color: '#a81c1c', bg: '#bdb8ac', font: CN, weight: 400, size: 0.62 }); return std({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.4, roughness: 0.9 }); })();
  const lotus = (b, x, z) => {   // a withered lotus: a bent stalk, a dried leaf or a hanging seed head
    const h = rand(0.5, 1.7), tx = x + rand(-0.5, 0.5), tz = z + rand(-0.4, 0.4), ty = h;
    beam(b, VC.solid, x, -0.05, z, tx, ty, tz, 0.03, '#5a4630');
    if (chance(0.5)) b.add(G.sphLow, VC.solid, tx, ty, tz, rand(0.6, 1.0), 0.12, rand(0.5, 0.9), rand(-0.6, 0.6), rand(0, 6), rand(-0.6, 0.6), pick(['#5a4428', '#4a3a22', '#6a5030']));
    else {
      const px = tx + rand(-0.3, 0.3), py = ty - rand(0.1, 0.4);
      beam(b, VC.solid, tx, ty, tz, px, py, tz, 0.025, '#5a4630');
      b.add(G.cone8, VC.solid, px, py - 0.08, tz, 0.26, 0.2, 0.26, Math.PI + rand(-0.5, 0.5), 0, 0, '#4a3a24');
    }
  };
  const yuanmingyuan = () => {
    const b = new Batcher();
    farGround(b, -1, '#161a16'); farGround(b, 1, '#161a16');
    b.box(VC.solid, '#3e3c38', 24, 0.03, -42, 26, 0.03, 44);
    put(b, dashuifa, 30, 0, -42, -Math.PI / 2);
    put(b, yuanyingguan, 41, 0, -70, -Math.PI / 2);
    put(b, guanshuifa, -20, 0, -32, Math.PI / 2);
    b.box(VC.solid, '#8a867c', 14.8, 0.3, -26, 0.5, 0.6, 1.8);
    b.add(G.box, steleMat, 14.8, 1.2, -26, 0.25, 0.9, 2.2);
    // the lotus pond, withered for autumn, under willows
    b.add(G.plane, pondMat, -23.5, -0.04, -66.5, 25, 25, 1, -Math.PI / 2, 0, 0);
    for (const [x, z, w, d] of [[-11.2, -66.5, 0.5, 25.4], [-36.0, -66.5, 0.5, 25.4], [-23.5, -54.0, 25.4, 0.5], [-23.5, -79.0, 25.4, 0.5]]) b.box(VC.solid, '#6a665e', x, 0.05, z, w, 0.3, d);
    for (let i = 0; i < 46; i++) lotus(b, rand(-12.5, -35), -rand(55.5, 78));
    for (const z of [56, 66, 76]) T.willow(b, -38, -z, rand(1.0, 1.15), { ry: Math.PI + rand(-0.4, 0.4) });
    // autumn woods: red maples, ginkgo, old cypress, scattered stones
    for (const [x, z] of [[-14, -8], [-26, -14], [-40, -20], [-14, -46], [-44, -48], [-30, -52]]) (chance(0.55) ? PT.maple : K.ginkgo)(b, x, z, rand(1.0, 1.25));
    for (const [x, z] of [[16, -6], [24, -10], [52, -30], [54, -56], [18, -78], [28, -84]]) (chance(0.5) ? PT.maple : K.cypress)(b, x, z, rand(1.0, 1.2));
    for (let i = 0; i < 8; i++) rbox(b, rand(-30, -12), 0, -rand(4, 50), rand(0.6, 1.4), rand(0.3, 0.8), rand(0.6, 1.2), '#c8c4ba', rand(0, 3));
    for (let z = 10; z < 80; z += 18) for (const x of [-(EDGE + 1.4), EDGE + 1.4]) {   // low garden lamps
      b.cyl(VC.metal, '#3a3c40', x, 0.45, -z, 0.08, 0.9, 'cyl8');
      b.cyl(VC.glow, hdr('#e8f0ff', 1.4), x, 1.0, -z, 0.14, 0.22, 'cyl8');
    }
    K.crowd(b, 4.6, 9, 4, 76, 7); K.crowd(b, -4.6, -9, 4, 50, 5);
    return lastAdditive(b.build());
  };

  // ---------- 雍和宫 ----------
  const censer = (b, smoke, x, z) => {   // a great bronze incense burner with its pagoda lid, embers glowing in the bowl
    b.block(VC.solid, MARBLE, x, 0, z, 2.6, 0.8, 2.6);
    const br = '#4a3a24';
    for (let k = 0; k < 3; k++) { const a = k * 2.094; b.cyl(VC.metal, br, x + Math.cos(a) * 0.7, 1.2, z + Math.sin(a) * 0.7, 0.12, 0.8); }
    b.add(G.sph, VC.metal, x, 1.9, z, 1.9, 1.3, 1.9, 0, 0, 0, br);
    b.cyl(VC.metal, br, x, 2.6, z, 0.9, 0.3);
    for (const s of [-1, 1]) b.add(G.tor, VC.metal, x + s * 1.0, 2.8, z, 0.6, 0.6, 0.6, 0, Math.PI / 2, 0, br);
    b.cyl(VC.metal, br, x, 3.2, z, 0.5, 0.8, 'cyl6');
    b.add(G.cone, VC.metal, x, 3.95, z, 1.5, 0.7, 1.5, 0, 0, 0, br);
    b.cyl(VC.metal, br, x, 4.5, z, 0.25, 0.6, 'cyl6');
    b.add(G.cone, VC.metal, x, 4.95, z, 0.8, 0.4, 0.8, 0, 0, 0, br);
    b.sph(gold, 0xffffff, x, 5.3, z, 0.15);
    b.cyl(VC.glow, hdr('#ff8a3a', 2.2), x, 2.62, z, 0.75, 0.05);
    smoke.push([x, 3.1, z]);
  };
  const worshipper = (b, x, z, kneel = false) => {   // holding up a bundle of lit incense
    K.person(b, x, z, { seated: kneel, coat: pick(['#2b2d3a', '#4a3a34', '#7a6a5a', '#8a2a2a', '#3a4a6a']) });
    const y = kneel ? 1.2 : 1.65;
    beam(b, VC.solid, x, y - 0.35, z + 0.25, x, y + 0.15, z + 0.3, 0.05, '#c8a050');
    b.box(VC.glow, hdr('#ff5a2a', 3), x, y + 0.18, z + 0.3, 0.07, 0.05, 0.07);
  };
  const stupa = (b, x, y, z, s = 1) => {   // a little gilded stupa on the Hall of the Wheel of Dharma
    b.add(G.box, gold, x, y + 0.25 * s, z, 0.9 * s, 0.5 * s, 0.9 * s);
    b.add(G.sph, gold, x, y + 0.85 * s, z, 0.9 * s, 0.8 * s, 0.9 * s);
    b.add(G.cone8, gold, x, y + 1.75 * s, z, 0.35 * s, 1.2 * s, 0.35 * s);
    b.add(G.sph, gold, x, y + 2.4 * s, z, 0.2 * s, 0.2 * s, 0.2 * s);
  };
  const wanfuge = (b, x, z) => {   // the Pavilion of Ten Thousand Happinesses, flanked by two towers joined by flying bridges
    K.marble(b, x, 0, z, 38, 1.2, 14);
    const tier = (cx, w, d, y, h, rh) => {
      K.red(b, cx, y, z, w, h, d);
      b.add(G.box, K.latticeMat, cx, y + h * 0.45, z, w + 0.1, h * 0.6, d + 0.1);
      b.add(G.box, K.paintMat, cx, y + h - 0.3, z, w + 0.2, 0.6, d + 0.2);
      K.roof(b, K.goldTile, cx, y + h, z, w + 2.0, d + 2.0, rh, { eave: 1.2, lift: 0.6, ridge: '#a87a12' });
    };
    tier(x, 15, 10, 1.2, 6.5, 2.2); tier(x, 13, 8.6, 9.0, 5.6, 2.0); tier(x, 11, 7.4, 15.8, 5.0, 3.6);
    for (const s of [-1, 1]) {
      const fx = x + s * 14;
      tier(fx, 7, 7, 1.2, 5.6, 1.6); tier(fx, 6, 6, 8.0, 4.4, 2.8);
      const x0 = x + s * 6.5, x1 = fx - s * 3.0, xc = (x0 + x1) / 2, len = Math.abs(x1 - x0);
      b.box(VC.solid, '#8a2a22', xc, 9.4, z, len, 0.5, 2.4);
      b.add(G.box, K.latticeMat, xc, 10.4, z, len, 1.4, 2.2);
      K.roof(b, K.goldTile, xc, 11.2, z, len + 0.6, 2.8, 0.9, { hip: false, eave: 0.3 });
    }
    plate(b, '万福阁', x, 13.9, z + 4.42, 0, 2.6);
    for (const dx of [-5, 5]) K.lantern(b, x + dx, 6.6, z + 5.6, 0.8);
  };
  const yonghegong = () => {
    const b = new Batcher(), smoke = [];
    farGround(b, -1, '#1a1716'); farGround(b, 1, '#1a1716');
    b.box(VC.solid, '#4a4642', -22, 0.03, -40, 36, 0.03, 80);
    b.box(VC.solid, '#4a4642', 18, 0.03, -40, 28, 0.03, 80);
    K.pailou(b, -5, { text: '寰海尊亲', roof: K.goldTile });
    // the axis on the left: the gate, the Hall of the Heavenly Kings, the Yonghe Hall, the Hall of the Wheel, Wanfu Pavilion
    K.hall(b, -24, -12, { w: 13, d: 6, h: 4.4, base: 0.8, roof: K.goldTile });
    for (const dx of [-3.6, 0, 3.6]) b.box(VC.glow, hdr('#ffb860', 1.1), -24 + dx, 2.4, -8.9, 2.0, 3.0, 0.05);
    K.hall(b, -24, -26, { w: 18, d: 9, h: 5.0, base: 1.2, roof: K.goldTile });
    K.hall(b, -24, -42, { w: 20, d: 10, h: 5.6, base: 1.4, roof: K.goldTile, double: true });
    plate(b, '雍和宫', -24, 6.05, -36.75, 0, 2.6);
    K.hall(b, -24, -57, { w: 18, d: 11, h: 5.6, base: 1.4, roof: K.goldTile, double: true });
    stupa(b, -24, 13.8, -57, 1.1);
    for (const [dx, dz] of [[-4.6, -1.8], [4.6, -1.8], [-4.6, 1.8], [4.6, 1.8]]) stupa(b, -24 + dx, 12.2, -57 + dz, 0.8);
    wanfuge(b, -30, -71);
    for (const [z, d, y, w] of [[-26, 9, 5.9, 18], [-42, 10, 6.5, 20], [-57, 11, 6.5, 18]]) for (const s of [-1, 1]) K.lantern(b, -24 + s * (w / 2 - 1.6), y, z + d / 2 + 0.7, 0.7);
    // incense: the great burners before the halls, worshippers with their sticks raised
    censer(b, smoke, -11, -34);
    censer(b, smoke, -11, -49.5);
    for (const [x, z, kn] of [[-8.4, -32.5, false], [-8.8, -36, false], [-7.2, -34.6, true], [-8.4, -48, true], [-8.9, -51.4, false], [-6.9, -50, false]]) worshipper(b, x, z, kn);
    // the right: the bell tower, side halls facing the court, a stele pavilion, old ginkgos
    K.hall(b, 18, -20, { w: 7.5, d: 7.5, h: 4.2, base: 1.0, roof: K.goldTile, double: true });
    K.hall(b, 21, -38, { w: 14, d: 8, h: 4.6, base: 0.9, roof: K.goldTile, ry: Math.PI / 2 });
    K.hall(b, 21, -60, { w: 14, d: 8, h: 4.6, base: 0.9, roof: K.goldTile, ry: Math.PI / 2 });
    for (const z of [8, 30, 70, 78]) K.ginkgo(b, 11.2, -z, rand(1.0, 1.15));
    for (let z = 10; z < 80; z += 16) { K.gongdeng(b, -(EDGE + 1.2), -z, -1); K.gongdeng(b, EDGE + 1.2, -z, 1); }
    K.crowd(b, 4.6, 9.6, 2, 78, 14); K.crowd(b, -4.6, -9.6, 2, 78, 12);
    const g = b.build();
    const sm = puffs(smoke, { size: 0.8, grow: 2.8, rise: 8, drift: 1.4, life: 7, n: 10, color: '#e0dcd2', opacity: 0.22 });
    g.add(sm);
    upd.push((t) => sm.userData.update(t));
    return g;
  };

  // ---------- 王府井 · 东堂 ----------
  const churchMat = uplit(std({ map: K.brickMat.map, emissiveMap: K.brickMat.map, vertexColors: true, roughness: 0.9, emissive: '#ffd6a0', emissiveIntensity: 0.6 }), 22, 1.5, 0.4);
  const domeMat = std({ color: '#5a9a7e', metalness: 0.5, roughness: 0.4, emissive: '#2a5a48', emissiveIntensity: 0.6 });
  const stained = basic({ map: stainedTex(), color: hdr('#ffffff', 1.25) }), rose = basic({ map: roseTex(), color: hdr('#ffffff', 1.3) });
  const doorLit = basic({ color: hdr('#ffc070', 1.2) });
  const cbrick = (b, x, y, z, w, h, d, col = '#a8a8b0') => b.addM(tiledBox(w, h, d, 1.6), churchMat, at(x, y + h / 2, z), col);
  const cross = (b, x, y, z, s = 1) => { b.add(G.box, gold, x, y, z, 0.16 * s, 1.5 * s, 0.16 * s); b.add(G.box, gold, x, y + 0.3 * s, z, 0.9 * s, 0.16 * s, 0.16 * s); };
  const josephs = (b) => {   // St Joseph's: grey brick, three towers under green domes, a round window, coloured glass (modelled facing +z)
    cbrick(b, 0, 0, -6.5, 22, 13, 9);
    K.roof(b, K.tileGrey, 0, 13, -6.5, 9, 22, 4.2, { hip: false, ry: Math.PI / 2, eave: 0.4 });
    cbrick(b, 0, 0, -0.9, 24, 14.5, 1.8);
    cbrick(b, 0, 0, -0.6, 6.4, 23, 2.6);
    for (const s of [-1, 1]) cbrick(b, s * 9.4, 0, -0.7, 4.8, 18.5, 2.4);
    for (const y of [7.2, 14.4]) b.box(stoneLit, '#e8e2d6', 0, y, 0.12, 24.4, 0.4, 0.5);
    b.box(stoneLit, '#e8e2d6', 0, 23.1, -0.6, 7.0, 0.5, 3.2);
    for (const s of [-1, 1]) b.box(stoneLit, '#e8e2d6', s * 9.4, 18.6, -0.7, 5.4, 0.5, 3.0);
    b.add(G.sph, domeMat, 0, 24.6, -0.6, 5.6, 6.4, 5.6);
    b.cyl(stoneLit, '#e8e2d6', 0, 28.3, -0.6, 0.6, 1.4);
    b.add(G.sph, domeMat, 0, 29.2, -0.6, 1.4, 1.4, 1.4);
    cross(b, 0, 30.8, -0.6);
    for (const s of [-1, 1]) {
      b.add(G.sph, domeMat, s * 9.4, 20.0, -0.7, 4.0, 4.6, 4.0);
      cross(b, s * 9.4, 23.2, -0.7, 0.8);
    }
    b.addM(archPane(3.0, 5.4), doorLit, at(0, 0, 0.72), 0xffffff);
    b.add(new THREE.CircleGeometry(1.5, 24), rose, 0, 16.9, 0.72, 1, 1, 1);
    b.addM(archPane(1.6, 3.6), stained, at(0, 8.0, 0.72), 0xffffff);
    for (const x of [-1.1, 1.1]) b.addM(archPane(0.9, 2.2), stained, at(x, 19.6, 0.72), 0xffffff);
    for (const s of [-1, 1]) {
      b.addM(archPane(1.8, 3.4), doorLit, at(s * 9.4, 0, 0.52), 0xffffff);
      for (const y of [8.4, 14.8]) b.addM(archPane(1.2, 3.0), stained, at(s * 9.4, y, 0.52), 0xffffff);
      b.addM(archPane(1.6, 4.0), stained, at(s * 5.0, 8.2, 0.02), 0xffffff);
    }
    for (const x of [-11, -6, 6, 11]) b.box(VC.glow, hdr('#ffd8a0', 2.0), x, 0.12, 2.0, 0.6, 0.18, 0.3);
    // the forecourt railing and its lamps
    for (const s of [-1, 1]) {
      for (let x = 3; x <= 13; x += 0.5) b.box(VC.metal, '#1a1a1e', s * x, 0.7, 9.5, 0.05, 1.4, 0.05);
      b.box(VC.metal, '#1a1a1e', s * 8, 1.35, 9.5, 10, 0.06, 0.06);
      b.cyl(VC.metal, '#1a1a1e', s * 3, 1.8, 9.5, 0.08, 3.6, 'cyl8');
      b.box(VC.glow, hdr('#fff0d0', 2.0), s * 3, 3.7, 9.5, 0.4, 0.5, 0.4);
    }
  };
  const storeTex = windowTex({ wall: '#c8b89a', glass: '#2a2018', lit: ['#ffe6b8', '#fff2d8', '#ffd28a'], litChance: 0.75, ledge: '#a89878', frame: '#e8dcc0', cols: 6 });
  const storeMat = facadeMat(storeTex, { k: 0.9 });
  const sbt = signTex('北京市百货大楼', 'BEIJING DEPARTMENT STORE'), storeSign = std({ map: sbt, emissiveMap: sbt, emissive: '#ffffff', emissiveIntensity: 0.7, roughness: 0.6 });
  const baihuo = (b) => {   // the 1955 department store with its name in red along the top (modelled facing +z)
    b.addM(buildingGeo(30, 14, 18, storeTex, 2.0, 3.4), storeMat, at(0, 0, -9), '#ffffff');
    b.addM(buildingGeo(10, 19, 12, storeTex, 2.0, 3.4), storeMat, at(0, 0, -7), '#f4ecdc');
    b.add(G.plane, storeSign, 0, 12.8, 0.06, 20, 2.0, 1);
    b.box(VC.glow, hdr('#ffd28a', 1.0), 0, 1.9, 0.06, 28, 2.8, 0.05);
    b.box(VC.solid, '#3a2a1e', 0, 4.1, 1.2, 9, 0.3, 2.4);
    bulbs(b, bulbMat, -15, 14.05, 0.05, 15, 14.05, 0.05);
    bulbs(b, bulbMat, -5, 19.05, -0.95, 5, 19.05, -0.95);
    for (const x of [-15, 15]) bulbs(b, bulbMat, x, 0.5, 0.05, x, 14, 0.05, { wd: [1, 0, 0] });
  };
  const snb = signTex('王府井小吃街', null, { bg: '#1d3f6e', fg: '#ffd77a', w: 768, h: 160 });
  const snackBoard = std({ map: snb, emissiveMap: snb, emissive: '#ffffff', emissiveIntensity: 0.65, roughness: 0.5 });
  const snackGate = (b) => {   // the gate of the snack street, its lanterns, the lane of stalls beyond (modelled facing +z)
    for (const x of [-3.6, 3.6]) { b.block(VC.solid, '#8a8680', x, 0, 0, 0.9, 0.8, 0.9); b.cyl(VC.solid, VERM, x, 3.4, 0, 0.26, 6.8, 'cyl8'); }
    b.add(G.box, K.paintMat, 0, 6.1, 0, 8.4, 0.6, 0.5);
    b.add(G.plane, snackBoard, 0, 5.3, 0.27, 4.8, 1.0, 1);
    K.roof(b, K.greenTile, 0, 6.6, 0, 9.4, 1.6, 1.4, { eave: 0.8, lift: 0.65 });
    for (const x of [-2.6, -0.9, 0.9, 2.6]) K.lantern(b, x, 4.2, 0.3, 0.6);
    for (const s of [-1, 1]) for (let z = -2; z > -22; z -= 4) {
      K.red(b, s * 4.8, 0, z - 2, 2.4, 3.6, 3.8);
      b.box(VC.glow, hdr(pick(['#ffb860', '#ffd08a', '#ff9a50']), 0.9), s * 3.58, 1.6, z - 2, 0.05, 2.0, 3.0);
      K.roof(b, K.tileGrey, s * 4.8, 3.6, z - 2, 4.0, 2.8, 1.0, { hip: false, ry: Math.PI / 2, eave: 0.3 });
    }
    for (let z = -3; z > -22; z -= 3) K.lantern(b, 0, 3.6, z, 0.55);
  };
  const wt = wellTex(), wellMat = std({ map: wt, metalness: 0.6, roughness: 0.4, emissive: '#ffffff', emissiveMap: wt, emissiveIntensity: 0.25 });
  const wfjSign = (() => { const t = vSignTex('王府井'); return std({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.45, roughness: 0.8 }); })();
  const wangfujing = () => {
    const b = new Batcher();
    farGround(b, -1, '#1a1a1e'); farGround(b, 1, '#1a1a1e');
    for (const s of [-1, 1]) b.box(VC.solid, '#5a5650', s * 8.1, 0.035, -40, 8.6, 0.03, 80);
    put(b, josephs, 26, 0, -70, 0, 0.9);
    b.box(VC.solid, '#4e4a46', 25, 0.04, -54, 26, 0.03, 30);
    for (const z of [-34, -42, -50, -58]) for (const x of [13.5, 37.5]) K.huai(b, x + rand(-0.6, 0.6), z + rand(-1, 1), rand(1.0, 1.15));
    K.shops(b, 1, 0, 28);
    for (let k = 0; k < 9; k++) K.person(b, rand(16, 34), -rand(42, 60), { coat: pick(['#c8282e', '#3a8adf', '#e8b84a', '#2a2a30']) });
    put(b, baihuo, -12, 0, -20, Math.PI / 2);
    put(b, snackGate, -11.6, 0, -45, Math.PI / 2);
    K.modernRow(b, -1, 52, 80);
    K.ledScreen(b, -12.4, 7, -60, -1, 8, 5);
    // the old well's bronze cover in the paving, the street's name stone, a bronze rickshaw at the kerb
    b.add(new THREE.CylinderGeometry(0.9, 0.9, 0.06, 24), wellMat, 6.6, 0.06, -14, 1, 1, 1);
    b.box(VC.solid, '#8a8680', 7.6, 0.25, -4, 1.4, 0.5, 0.8);
    b.add(G.box, wfjSign, 7.6, 2.5, -4, 0.5, 4.0, 1.2);
    put(b, (t) => {
      t.block(VC.solid, '#6a6862', 0, 0, 0, 1.6, 0.4, 3.4);
      K.rickshaw(t, 0, 0.3);
      K.person(t, 0, -1.4, { cap: '#3a3a3e' });
      for (const [mat, list] of t.buckets) if (mat === VC.solid) for (const g of list) {
        const c = g.attributes.color;
        if (c && g.attributes.position.getY(0) > 0.45) for (let i = 0; i < c.count; i++) c.setXYZ(i, 0.42, 0.31, 0.17);
      }
    }, -7.6, 0, -26, 0.3);
    for (let z = 8; z < 80; z += 14) { K.gongdeng(b, -(EDGE + 1.2), -z, -1); K.gongdeng(b, EDGE + 1.2, -z, 1); }
    K.crowd(b, 4.6, 11.5, 2, 78, 26); K.crowd(b, -4.6, -10.5, 2, 78, 24);
    return lastAdditive(b.build());
  };

  // ---------- 798 艺术区 ----------
  const redBrick = '#b8705a';
  const shellMat = std({ color: '#cfc8bc', roughness: 0.85, emissive: '#3a3028', emissiveIntensity: 0.4 });
  const skylight = basic({ map: stageGlassTex(), color: hdr('#fff0d8', 0.55) });
  const pipeMat = VC.metal;
  const gt = graffitiTex(), graffiti = std({ map: gt, emissiveMap: gt, emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.9 });
  const zoneT = signTex('798艺术区', '798 ART ZONE', { bg: '#c8141e', fg: '#ffffff', font: CN_SIGN }), zoneSign = basic({ map: zoneT, color: hdr('#ffffff', 1.2), side: THREE.DoubleSide });
  const chimT = vSignTex('798', { bg: '#00000000', fg: '#ffffff', font: '"Russo One", "Arial Black", sans-serif' }), chimSign = basic({ map: chimT, transparent: true, color: hdr('#ffffff', 0.9) });
  const galT = textTex('画廊 GALLERY', { w: 1024, h: 160, color: '#ffffff', font: CN_SIGN, weight: 400, size: 0.6 }), galSign = basic({ map: galT, transparent: true, color: hdr('#ffffff', 1.3) });
  const cafeT = textTex('咖啡 CAFE', { w: 768, h: 160, color: '#ffd28a', glow: '#ff9a3a', font: CN_SIGN, weight: 400, size: 0.6 }), cafeSign = basic({ map: cafeT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hdr('#ffffff', 1.4) });
  const bigRed = std({ color: '#d81e2b', metalness: 0.3, roughness: 0.25, emissive: '#5a0808', emissiveIntensity: 0.5 });
  const pipe = (b, x0, y0, z0, x1, y1, z1, r = 0.32) => {   // round, clad in aluminium
    _v.set(x1 - x0, y1 - y0, z1 - z0);
    const len = _v.length();
    _q.setFromUnitVectors(UPV, _v.normalize());
    b.addM(G.cyl, pipeMat, new THREE.Matrix4().compose(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), _q, _s.set(r * 2, len, r * 2)), '#c8ccd2');
  };
  const sawtooth = (b, xFace, xBack, z0, z1) => {   // a Bauhaus hall: red brick, steel windows, the curved north-light roofs (lit glass toward +z)
    const D = xFace - xBack, n = Math.round((z1 - z0) / 6), bay = (z1 - z0) / n, Hw = 7.0;
    K.brick(b, (xFace + xBack) / 2, 0, -(z0 + z1) / 2, D, Hw, z1 - z0, redBrick);
    const pts = [[z0, Hw - 0.1]];
    for (let k = 0; k < n; k++) {
      const s0 = z0 + k * bay;
      pts.push([s0, Hw + 4.0]);
      for (let j = 1; j <= 6; j++) { const t = (j / 6) * (Math.PI / 2); pts.push([s0 + bay * Math.sin(t), Hw + 0.2 + 3.8 * Math.cos(t)]); }
    }
    pts.push([z1, Hw - 0.1]);
    const roof = jag(pts);
    b.addM(slab(roof, D, 4), shellMat, new THREE.Matrix4().set(0, 0, 1, xBack, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1), 0xffffff);
    for (let k = 0; k < n; k++) b.add(G.plane, skylight, (xFace + xBack) / 2, Hw + 2.1, -(z0 + k * bay) + 0.04, D - 0.2, 3.6, 1);
    const s = Math.sign(-xFace);
    for (let k = 0; k < n; k++) {   // tall steel windows, the galleries lit behind them
      const zc = -(z0 + (k + 0.5) * bay);
      b.box(VC.glow, hdr(pick(['#fff4e0', '#ffe2b0', '#e8f0ff', '#ffd6a0']), rand(0.42, 0.62)), xFace + s * 0.04, 3.4, zc, 0.05, 4.2, bay - 1.6);
      for (let m = -2; m <= 2; m++) b.box(VC.solid, '#2a2a2e', xFace + s * 0.07, 3.4, zc + (m * (bay - 1.6)) / 4, 0.06, 4.3, 0.08);
      for (const y of [2.0, 3.4, 4.8]) b.box(VC.solid, '#2a2a2e', xFace + s * 0.07, y, zc, 0.06, 0.08, bay - 1.6);
    }
  };
  const locomotive = (b) => {   // an old steam engine on its own length of track, a photo stop (modelled facing +z)
    for (const x of [-0.72, 0.72]) b.box(VC.metal, '#7a7a80', x, 0.1, -3, 0.12, 0.14, 26);
    for (let z = -15.5; z < 10; z += 0.9) b.box(VC.solid, '#3a3028', 0, 0.04, z, 2.6, 0.08, 0.3);
    const blk = '#1c1c20', red = '#b8201a';
    b.box(VC.solid, blk, 0, 1.3, 0, 2.6, 0.5, 11);
    b.add(G.cyl, VC.metal, 0, 2.7, 1.2, 2.0, 7.6, 2.0, Math.PI / 2, 0, 0, '#2a2a30');
    b.add(G.cyl, VC.solid, 0, 2.7, 5.0, 2.06, 0.3, 2.06, Math.PI / 2, 0, 0, '#2e2e34');
    b.cyl(VC.solid, blk, 0, 4.2, 3.9, 0.38, 1.3);
    for (const z of [1.6, -0.6]) b.add(G.sph, VC.solid, 0, 3.7, z, 0.8, 0.8, 1.0, 0, 0, 0, blk);
    b.add(G.cyl, VC.metal, 0, 3.9, 5.15, 0.6, 0.5, 0.6, Math.PI / 2, 0, 0, '#c8ccd2');
    b.add(G.cyl, VC.glow, 0, 3.9, 5.42, 0.46, 0.05, 0.46, Math.PI / 2, 0, 0, hdr('#fff4d6', 3.0));
    b.box(VC.solid, blk, 0, 3.4, -4.3, 3.0, 2.8, 3.4);
    b.box(VC.solid, '#2a2a30', 0, 4.95, -4.3, 3.2, 0.25, 3.8);
    b.box(VC.glow, hdr('#ffd28a', 0.8), 0, 3.8, -4.3, 3.02, 1.0, 1.6);
    b.box(VC.solid, red, 0, 1.15, 5.7, 2.8, 0.5, 0.3);
    for (const x of [-0.95, 0.95]) b.cyl(VC.metal, '#c8ccd2', x, 1.15, 6.0, 0.18, 0.4, 'cyl8', Math.PI / 2);
    b.add(G.cone4, VC.solid, 0, 0.55, 6.2, 2.6, 0.9, 1.0, -0.6, 0, 0, '#2a2a30');
    for (const z of [2.2, 0.6, -1.0]) for (const s of [-1, 1]) {
      b.add(G.cyl, VC.solid, s * 1.18, 0.78, z, 1.5, 0.14, 1.5, 0, 0, Math.PI / 2, red);
      b.add(G.cyl, VC.solid, s * 1.2, 0.78, z, 0.5, 0.18, 0.5, 0, 0, Math.PI / 2, '#3a3a3e');
    }
    for (const s of [-1, 1]) { b.add(G.cyl, VC.solid, s * 1.15, 0.45, 4.2, 0.9, 0.12, 0.9, 0, 0, Math.PI / 2, red); beam(b, VC.metal, s * 1.32, 0.9, 2.2, s * 1.32, 0.9, -1.0, 0.12, '#c8ccd2'); }
    b.box(VC.solid, blk, 0, 2.0, -9.0, 2.7, 2.4, 5.0);
    b.box(VC.solid, '#121214', 0, 3.25, -9.0, 2.4, 0.2, 4.6);
    b.add(G.plane, basic({ map: textTex('798', { w: 256, h: 128, color: '#ffd23d', bg: '#b8201a', size: 0.7 }), color: hdr('#ffffff', 0.9) }), 0, 2.7, 5.17, 0.9, 0.45, 1);
    for (const [x, z] of [[-2.4, 4.5], [2.4, 4.5], [-2.4, -3], [2.4, -3], [-2.4, -9], [2.4, -9]]) b.box(VC.glow, hdr('#ffe0b0', 2.0), x, 0.1, z, 0.5, 0.16, 0.3);   // uplights round it
    for (const x of [-0.62, 0.62]) b.box(VC.glow, hdr('#ffd28a', 0.5), x, 3.5, 1.2, 0.08, 0.06, 7.4);   // light catching the boiler's shoulders
  };
  const bigFigure = (b) => {   // a giant glossy red figure sitting cross-legged in the square (modelled facing +z)
    b.block(VC.solid, '#3a3a3e', 0, 0, 0, 5, 0.5, 4);
    b.add(G.sph, bigRed, 0, 2.6, 0, 3.2, 3.6, 2.6);
    b.add(G.sph, bigRed, 0, 5.4, 0.2, 2.6, 2.6, 2.6);
    for (const s of [-1, 1]) {
      b.add(G.sph, bigRed, s * 1.2, 1.0, 1.0, 2.2, 0.9, 1.4, 0, s * 0.5, 0);
      beam(b, bigRed, s * 1.4, 3.6, 0, s * 2.1, 2.2, 1.0, 0.7, 0xffffff);
      b.add(G.sph, bigRed, s * 2.1, 2.1, 1.1, 0.8, 0.8, 0.8);
      b.sph(VC.solid, '#141414', s * 0.5, 5.7, 1.38, 0.18, true);
    }
    b.add(G.box, VC.solid, 0, 4.9, 1.45, 0.9, 0.12, 0.1, 0, 0, 0, '#141414');
    for (const s of [-1, 1]) b.box(VC.glow, hdr('#fff0d0', 2.2), s * 2.2, 0.55, 2.2, 0.4, 0.2, 0.3);
  };
  const art798 = () => {
    const b = new Batcher();
    farGround(b, -1, '#1c1c1e'); farGround(b, 1, '#1c1c1e');
    for (const s of [-1, 1]) b.box(VC.solid, '#4a4a4c', s * 25, 0.03, -40, 30, 0.03, 80);
    // left: the sawtooth hall, a big 798 on its wall, neon art in the windows, the chimney beyond
    sawtooth(b, -11, -36, 4, 52);
    b.add(G.plane, basic({ map: textTex('798', { w: 512, h: 256, color: '#ffffff', size: 0.8 }), transparent: true, color: hdr('#ffffff', 0.9) }), -23.5, 3.8, -3.96, 9, 4.5, 1);
    for (const [z, c] of [[-22, '#ff3d8a'], [-34, '#3dd6ff'], [-46, '#ffd23d']]) b.box(VC.glow, hdr(c, 1.8), -10.86, 3.4, z, 0.06, 0.12, 3.2);
    K.brick(b, -30, 0, -62, 4.4, 2, 4.4, redBrick);
    const chim = new THREE.CylinderGeometry(1.0, 1.7, 36, 16), cuv = chim.attributes.uv;
    for (let i = 0; i < cuv.count; i++) cuv.setXY(i, cuv.getX(i) * 5.3, cuv.getY(i) * 22);
    b.addM(chim.translate(0, 20, 0), K.brickMat, at(-30, 0, -62), redBrick);
    for (const y of [33, 35.5]) b.cyl(VC.solid, '#e8e4dc', -30, y, -62, 1.12, 0.9);
    b.add(G.plane, chimSign, -28.5, 17, -62, 1.6, (1.6 * chimT.image.height) / chimT.image.width, 1, 0, Math.PI / 2, 0);
    b.sph(VC.glow, hdr('#ff2a2a', 5), -30, 38.3, -62, 0.3);
    K.modernRow(b, -1, 66, 80, 14);
    // the steam pipes on their frames down both sides, rising to cross the street high over the track with the zone's sign
    for (const s of [-1, 1]) {
      const zA = s < 0 ? 2 : 34, x = s * 9.6;
      for (const [dy, r] of [[0, 0.34], [0.8, 0.24]]) pipe(b, x, 5.4 + dy, -zA, x, 5.4 + dy, -78, r);
      for (let z = zA + 2; z < 78; z += 8) { beam(b, VC.metal, x - 0.8, 0, -z, x, 5.2, -z, 0.14, '#5a5e66'); beam(b, VC.metal, x + 0.8, 0, -z, x, 5.2, -z, 0.14, '#5a5e66'); }
      pipe(b, x, 5.4, -34, x, 15.6, -34, 0.34);
    }
    pipe(b, -9.6, 15.6, -34, 9.6, 15.6, -34, 0.34);
    for (const x of [-3.6, 3.6]) b.box(VC.metal, '#5a5e66', x, 15.0, -34, 0.08, 0.9, 0.08);
    b.box(VC.solid, '#2a2a2e', 0, 14.35, -34, 8.6, 1.5, 0.1);
    b.add(G.plane, zoneSign, 0, 14.35, -33.94, 8.4, 1.3, 1);
    b.add(G.plane, zoneSign, 0, 14.35, -34.06, 8.4, 1.3, 1, 0, Math.PI, 0);
    // right: the engine, a graffiti wall, the gallery, a café, the red giant
    put(b, locomotive, 13.2, 0, -22, 0);
    b.box(VC.solid, '#3a3a3e', 11.2, 1.6, -49, 0.3, 3.2, 18);
    b.add(G.plane, graffiti, 11.03, 1.6, -49, 18, 3.2, 1, 0, -Math.PI / 2, 0);
    b.addM(buildingGeo(14, 8, 22, K.slab, 1.5, 2.8), K.slabMat, at(27, 0, -49), '#f4f4f0');
    b.box(VC.glow, hdr('#f4f8ff', 0.6), 19.95, 3.2, -49, 0.05, 5.2, 14);
    b.add(G.plane, galSign, 19.9, 6.6, -49, 9, 1.4, 1, 0, -Math.PI / 2, 0);
    K.brick(b, 24, 0, -12, 12, 6.5, 16, '#c88a6a');
    b.box(VC.glow, hdr('#ffc070', 0.6), 17.96, 2.0, -12, 0.05, 2.6, 12);
    b.add(G.plane, cafeSign, 17.9, 4.6, -12, 6, 1.25, 1, 0, -Math.PI / 2, 0);
    for (let k = 0; k < 3; k++) K.lanternString(b, 16.5, 11.5, 3.6, -5 - k * 3.5, 1.2);
    put(b, bigFigure, 17.5, 0, -68, -0.6);
    for (const z of [-60, -76]) K.huai(b, 13.5, z, rand(1.0, 1.15));
    for (let z = 6; z < 80; z += 16) { b.cyl(VC.metal, '#2a2a2e', -(EDGE + 1.0), 2.4, -z, 0.07, 4.8, 'cyl8'); b.box(VC.glow, hdr('#ffe8c8', 1.6), -(EDGE + 1.0), 4.85, -z, 0.5, 0.18, 0.5); }
    K.crowd(b, 4.6, 10, 2, 78, 16); K.crowd(b, -4.6, -10, 2, 78, 14);
    for (const [x, z] of [[8.2, -18], [6.4, -40]]) { K.person(b, x, z, { coat: '#2a2a2e' }); for (const a of [0, 2.1, 4.2]) beam(b, VC.metal, x + 0.5, 1.4, z, x + 0.5 + Math.cos(a) * 0.4, 0, z + Math.sin(a) * 0.4, 0.04, '#2a2a2e'); b.box(VC.solid, '#141414', x + 0.5, 1.5, z, 0.25, 0.2, 0.35); }
    return lastAdditive(b.build());
  };

  return {
    landmarks: [
      { key: 'dahuitang', name: '人民大会堂 · 国家大剧院', en: 'GREAT HALL OF THE PEOPLE · NCPA', build: dahuitang },
      { key: 'yiheyuan', name: '颐和园 · 十七孔桥', en: 'SUMMER PALACE · 17-ARCH BRIDGE', build: yiheyuan },
      { key: 'yuanmingyuan', name: '圆明园 · 大水法', en: 'OLD SUMMER PALACE RUINS', build: yuanmingyuan },
      { key: 'yonghegong', name: '雍和宫', en: 'LAMA TEMPLE', build: yonghegong },
      { key: 'wangfujing', name: '王府井 · 东堂', en: "WANGFUJING · ST JOSEPH'S", build: wangfujing },
      { key: 'art798', name: '798 艺术区', en: '798 ART ZONE', build: art798 },
    ],
    update(t) { for (const f of upd) f(t); },
  };
}
