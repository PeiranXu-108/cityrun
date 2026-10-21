// West Lake trees: weeping willows with swaying leaf strands, peach trees in blossom, camphor trees.
// Each species is built as a handful of random templates once per theme, then instanced into chunk batches.
import { THREE, VC, G, std, hdr, foliageMat, canvasTex, rand, randi, pick } from '../core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _one = V(1, 1, 1);

// tapered branch segment from p0 (radius r0) to p1 (radius r1)
function limb(list, p0, p1, r0, r1, seg = 7) {
  const d = V().subVectors(p1, p0), len = d.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1, true);
  _q.setFromUnitVectors(UP, d.normalize());
  g.applyMatrix4(_m.compose(V().addVectors(p0, p1).multiplyScalar(0.5), _q, _one));
  list.push(g.toNonIndexed()); g.dispose();
}
function joint(list, p, r) {
  const g = new THREE.SphereGeometry(r, 7, 5);
  g.translate(p.x, p.y, p.z);
  list.push(g.toNonIndexed()); g.dispose();
}

// Flat arrays for leaf ribbons / blossom cards (non-indexed triangles).
class Leaves {
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.s = []; }
  vert(p, n, u, v, c, s) { this.p.push(p.x, p.y, p.z); this.n.push(n.x, n.y, n.z); this.uv.push(u, v); this.c.push(c.r, c.g, c.b); this.s.push(s); }
  // a0/a1: the two edges at one end (v = va), b0/b1 at the other end (v = vb)
  quad(a0, a1, b0, b1, n, va, vb, c, sa, sb) {
    this.vert(a0, n, 0, va, c, sa); this.vert(a1, n, 1, va, c, sa); this.vert(b1, n, 1, vb, c, sb);
    this.vert(a0, n, 0, va, c, sa); this.vert(b1, n, 1, vb, c, sb); this.vert(b0, n, 0, vb, c, sb);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aSway', new THREE.Float32BufferAttribute(this.s, 1));
    return g;
  }
}

// ---------- textures ----------
function willowLeafTex() {
  return canvasTex(64, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#5b6a2a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
    for (let y = 2; y < h; y += 6) {
      for (const side of [-1, 1]) {
        if (Math.random() < 0.1) continue;
        const len = rand(18, 27), wid = rand(3.4, 4.8), ang = side * rand(0.3, 0.62);
        g.save(); g.translate(w / 2, y + rand(-2, 2)); g.rotate(ang);
        const gr = g.createLinearGradient(0, 0, 0, len);
        gr.addColorStop(0, pick(['#c8e07a', '#b8d86a', '#d4e88c'])); gr.addColorStop(1, pick(['#6f9e38', '#7aa83f', '#5f8f32']));
        g.fillStyle = gr;
        g.beginPath(); g.ellipse(0, len / 2, wid, len / 2, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(240,255,200,0.35)'; g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(0, 2); g.lineTo(0, len - 3); g.stroke();
        g.restore();
      }
    }
  });
}

function blossomTex() {
  return canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#4a302a'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(10, 118); g.quadraticCurveTo(60, 70, 118, 12); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(58, 72); g.lineTo(30, 30); g.stroke();
    const flower = (x, y, r, col) => {
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * Math.PI * 2 + rand(0, 0.4);
        const gr = g.createRadialGradient(x, y, 0, x, y, r * 1.6);
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, col); gr.addColorStop(1, '#ff7aa2');
        g.fillStyle = gr;
        g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75, r * 0.72, r * 0.5, a, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = '#d63c6c'; g.beginPath(); g.arc(x, y, r * 0.28, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffe066';
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.fillRect(x + Math.cos(a) * r * 0.45 - 1, y + Math.sin(a) * r * 0.45 - 1, 2, 2); }
    };
    const spots = [[30, 96], [52, 74], [74, 56], [96, 34], [36, 40], [64, 98], [100, 70], [20, 64], [84, 92]];
    spots.forEach(([x, y]) => flower(x + rand(-4, 4), y + rand(-4, 4), rand(9, 13), pick(['#ffc0d2', '#ffb0c8', '#ffd4e0', '#ffe4ec'])));
    g.fillStyle = '#c42d5a';
    for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(rand(14, 114), rand(14, 114), rand(3, 4.5), 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#7fb04a';
    for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(rand(20, 110), rand(20, 110), 7, 3, rand(0, 3), 0, Math.PI * 2); g.fill(); }
  });
}

function barkTex() {
  return canvasTex(64, 128, (g, w, h) => {
    g.fillStyle = '#6a5644'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = pick(['#3a2d22', '#4a3a2c', '#2e231b', '#7d6a56']); g.lineWidth = rand(1.5, 4);
      const x = rand(0, w);
      g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y <= h; y += 16) g.lineTo(x + rand(-4, 4), y);
      g.stroke();
    }
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(30,22,16,0.6)'; g.beginPath(); g.ellipse(rand(0, w), rand(0, h), rand(2, 4), rand(4, 8), 0, 0, 7); g.fill(); }
  });
}

// ---------- willow ----------
const WILLOW = ['#a8cf62', '#93c257', '#7fb045', '#b5d872', '#8cbc50', '#c2dc7c'];
const willowTint = () => new THREE.Color(pick(WILLOW)).multiplyScalar(rand(0.85, 1.08));

// One hanging branchlet: arcs out from the attachment point, then falls almost straight down.
function strand(L, A, out, drop, reach, tint, width = 0.3, segs = 6) {
  const d = V(out.x, 0, out.z);
  if (d.lengthSq() < 1e-4) d.set(Math.random() - 0.5, 0, Math.random() - 0.5);
  d.normalize();
  const side = V(-d.z, 0, d.x);
  const n = V().copy(UP).multiplyScalar(0.55).addScaledVector(d, 0.45).normalize();
  const pts = [], ws = [], sw = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = A.clone().addScaledVector(d, reach * Math.sqrt(t));
    p.y += 0.3 * Math.sin(Math.PI * Math.min(t * 2.5, 1)) * (1 - t) - drop * Math.pow(t, 1.35);
    pts.push(p); ws.push(width * (1 - 0.5 * t)); sw.push(Math.pow(t, 1.4));
  }
  let total = 0;
  for (let i = 1; i <= segs; i++) total += pts[i].distanceTo(pts[i - 1]);
  const v = [total / 1.1];
  for (let i = 1; i <= segs; i++) v.push(v[i - 1] - pts[i].distanceTo(pts[i - 1]) / 1.1);
  const tw = rand(0, Math.PI);
  const axes = [side.clone().multiplyScalar(Math.cos(tw)).addScaledVector(d, Math.sin(tw))];
  if (Math.random() < 0.5) axes.push(side.clone().multiplyScalar(-Math.sin(tw)).addScaledVector(d, Math.cos(tw)));
  for (const axis of axes) {
    for (let i = 0; i < segs; i++) {
      const a = pts[i], b = pts[i + 1];
      L.quad(a.clone().addScaledVector(axis, -ws[i] / 2), a.clone().addScaledVector(axis, ws[i] / 2),
        b.clone().addScaledVector(axis, -ws[i + 1] / 2), b.clone().addScaledVector(axis, ws[i + 1] / 2),
        n, v[i], v[i + 1], tint, sw[i], sw[i + 1]);
    }
  }
}

function willowTemplate() {
  const wood = [], L = new Leaves();
  const lean = rand(0.1, 0.26), H0 = rand(2.3, 2.9);
  let p = V(), dir = V(-Math.sin(lean), Math.cos(lean), rand(-0.08, 0.08)).normalize();
  let r = rand(0.24, 0.3);
  limb(wood, V(0, -0.2, 0), V(dir.x * 0.3, 0.5, dir.z * 0.3), r * 1.7, r);
  for (let i = 0; i < 3; i++) {
    const q = p.clone().addScaledVector(dir, H0 / 3);
    limb(wood, p, q, r, r * 0.88); joint(wood, q, r * 0.92);
    p = q; r *= 0.88;
    dir.x += rand(-0.1, 0.05); dir.z += rand(-0.08, 0.08); dir.normalize();
  }
  const top = p.clone();
  const nB = randi(4, 5);
  for (let i = 0; i < nB; i++) {
    const az = i / nB * Math.PI * 2 + rand(-0.35, 0.35);
    const bd = V(Math.cos(az) * 0.6 - 0.15, 1, Math.sin(az) * 0.6).normalize();
    let bp = top.clone(), br = r * rand(0.48, 0.58);
    const segL = rand(0.9, 1.3);
    for (let k = 0; k < 3; k++) {
      bd.y -= 0.24; bd.normalize();
      const q = bp.clone().addScaledVector(bd, segL * (1 - k * 0.15));
      limb(wood, bp, q, br, br * 0.64, 6); joint(wood, q, br * 0.66);
      for (let s = 0; s < (k ? 10 : 6); s++) {
        const a = bp.clone().lerp(q, Math.random());
        strand(L, a, V(a.x - top.x * 0.4, 0, a.z - top.z * 0.4), Math.max(1.3, a.y - rand(0.4, 1.9)), rand(0.25, 0.7), willowTint());
      }
      bp = q; br *= 0.64;
    }
    for (let s = 0; s < 7; s++) {
      const a = bp.clone().add(V(rand(-0.3, 0.3), rand(-0.1, 0.25), rand(-0.3, 0.3)));
      strand(L, a, V(Math.cos(az), 0, Math.sin(az)), Math.max(1.3, a.y - rand(0.3, 1.5)), rand(0.3, 0.8), willowTint());
    }
  }
  for (let s = 0; s < 22; s++) {
    const a = top.clone().add(V(rand(-1.5, 1.5), rand(0.5, 1.9), rand(-1.5, 1.5)));
    strand(L, a, V(a.x - top.x, 0, a.z - top.z), rand(0.9, 2.3), rand(0.2, 0.5), willowTint(), 0.34, 4);
  }
  return { wood: mergeGeometries(wood), leaves: L.geometry() };
}

// ---------- peach blossom ----------
const BLOSSOM = ['#ffffff', '#fff0f4', '#ffe2ea', '#ffd6e2'];
function card(L, c, size, tint) {
  const e = new THREE.Euler(rand(-0.6, 0.6), rand(0, Math.PI), rand(-0.6, 0.6));
  _q.setFromEuler(e);
  const up = V(0, 1, 0).applyQuaternion(_q);
  for (const ax of [V(1, 0, 0), V(0, 0, 1)]) {
    const a = ax.applyQuaternion(_q);
    const h = size / 2;
    const n = V().crossVectors(a, up).normalize().multiplyScalar(0.3).addScaledVector(UP, 0.7).normalize();
    const p00 = c.clone().addScaledVector(a, -h).addScaledVector(up, -h), p10 = c.clone().addScaledVector(a, h).addScaledVector(up, -h);
    const p01 = c.clone().addScaledVector(a, -h).addScaledVector(up, h), p11 = c.clone().addScaledVector(a, h).addScaledVector(up, h);
    L.quad(p00, p10, p01, p11, n, 0, 1, tint, 0.35, 0.6);
  }
}
function peachTemplate() {
  const wood = [], L = new Leaves();
  const r = rand(0.13, 0.17);
  const t1 = V(rand(-0.15, 0.15), rand(1.0, 1.35), rand(-0.15, 0.15));
  limb(wood, V(0, -0.1, 0), t1, r, r * 0.8); joint(wood, t1, r * 0.82);
  const nB = randi(3, 4);
  for (let i = 0; i < nB; i++) {
    const az = i / nB * Math.PI * 2 + rand(-0.4, 0.4);
    const d = V(Math.cos(az) * 0.8, 1, Math.sin(az) * 0.8).normalize();
    const p1 = t1.clone().addScaledVector(d, rand(1.0, 1.5));
    limb(wood, t1, p1, r * 0.72, r * 0.45, 5); joint(wood, p1, r * 0.46);
    card(L, p1, rand(0.7, 0.9), new THREE.Color(pick(BLOSSOM)));
    for (let j = 0; j < 2; j++) {
      const d2 = d.clone().add(V(rand(-0.6, 0.6), rand(-0.1, 0.4), rand(-0.6, 0.6))).normalize();
      const p2 = p1.clone().addScaledVector(d2, rand(0.6, 1.0));
      limb(wood, p1, p2, r * 0.45, r * 0.22, 5);
      for (let k = 0; k < 6; k++) {
        const c = p1.clone().lerp(p2, 0.2 + k * 0.17).add(V(rand(-0.25, 0.25), rand(-0.1, 0.25), rand(-0.25, 0.25)));
        card(L, c, rand(0.55, 0.85), new THREE.Color(pick(BLOSSOM)));
      }
    }
  }
  return { wood: mergeGeometries(wood), leaves: L.geometry() };
}

// ---------- bamboo: segmented culms with leaf sprays ----------
function bambooLeafTex() {
  return canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#5a7a34'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(w / 2, 4); g.lineTo(w / 2 + 4, h * 0.5); g.stroke();
    for (let i = 0; i < 9; i++) {
      const a = Math.PI / 2 + (i - 4) * 0.28 + rand(-0.08, 0.08), len = rand(46, 62), y0 = 8 + i * 5;
      g.save(); g.translate(w / 2 + 2, y0); g.rotate(a - Math.PI / 2);
      const gr = g.createLinearGradient(0, 0, 0, len);
      gr.addColorStop(0, pick(['#8fc25a', '#7db24c'])); gr.addColorStop(1, pick(['#4f8a3a', '#5c9640']));
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(6, len * 0.4, 0, len); g.quadraticCurveTo(-6, len * 0.4, 0, 0); g.fill();
      g.restore();
    }
  });
}
function bambooTemplate() {
  const wood = [], L = new Leaves();
  const n = randi(7, 10);
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), r0 = rand(0, 0.9), H = rand(6, 9.5), rad = rand(0.07, 0.11);
    const base = V(Math.cos(a) * r0, 0, Math.sin(a) * r0);
    const tip = base.clone().add(V(Math.cos(a) * rand(0.4, 1.2), H, Math.sin(a) * rand(0.4, 1.2)));
    limb(wood, base, tip, rad, rad * 0.7, 6);
    for (let y = 0.5; y < H - 0.3; y += rand(0.55, 0.75)) joint(wood, base.clone().lerp(tip, y / H), rad * 1.15);
    for (let k = 0; k < randi(9, 13); k++) {
      const t = rand(0.45, 1), c = base.clone().lerp(tip, t).add(V(rand(-0.5, 0.5), rand(-0.2, 0.2), rand(-0.5, 0.5)));
      card(L, c, rand(1.0, 1.4), new THREE.Color('#ffffff').multiplyScalar(rand(0.82, 1.05)));
    }
  }
  return { wood: mergeGeometries(wood), leaves: L.geometry() };
}

// ---------- camphor (香樟): dense faceted canopy ----------
const CAMPHOR = ['#2f5e34', '#3a6e3c', '#2a5530', '#457a40', '#335f36', '#4f8446'];
const hash = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };
function camphorTemplate(pal = CAMPHOR) {
  const wood = [], blobs = [];
  const r = rand(0.24, 0.3), top = V(rand(-0.3, 0.3), rand(2.0, 2.5), rand(-0.3, 0.3));
  limb(wood, V(0, -0.2, 0), V(0, 0.5, 0), r * 1.6, r);
  limb(wood, V(0, 0.4, 0), top, r, r * 0.75); joint(wood, top, r * 0.78);
  for (let i = 0; i < 3; i++) {
    const az = i / 3 * Math.PI * 2 + rand(-0.4, 0.4);
    limb(wood, top, top.clone().add(V(Math.cos(az) * 1.1, 1.1, Math.sin(az) * 1.1)), r * 0.6, r * 0.35, 6);
  }
  const n = randi(8, 11);
  for (let i = 0; i < n; i++) {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const pos = g.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k);
      const f = 0.86 + 0.28 * hash(Math.round(x * 100), Math.round(y * 100), Math.round(z * 100) + i * 7);
      pos.setXYZ(k, x * f, y * f, z * f);
    }
    const a = i / n * Math.PI * 2, rr = i === 0 ? 0 : rand(0.9, 1.7);
    const s = i === 0 ? rand(1.6, 1.9) : rand(1.0, 1.5);
    g.scale(s * rand(1, 1.2), s * rand(0.75, 0.95), s * rand(1, 1.2));
    g.translate(top.x + Math.cos(a) * rr, top.y + 1.4 + rand(-0.4, 0.7) - rr * 0.25, top.z + Math.sin(a) * rr);
    g.computeVertexNormals();
    const base = new THREE.Color(pick(pal)), col = new Float32Array(pos.count * 3);
    for (let f = 0; f < pos.count; f += 3) {
      const c = base.clone().multiplyScalar(rand(0.85, 1.12));
      for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (f + k) * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    blobs.push(g);
  }
  return { wood: mergeGeometries(wood), canopy: mergeGeometries(blobs) };
}

// Build templates once and return placement helpers that write into a Batcher.
export function treeKit() {
  const willowMat = foliageMat(willowLeafTex(), { sway: 0.32 });
  const bark = std({ map: barkTex(), vertexColors: true, roughness: 0.95 });
  const blossomMat = foliageMat(blossomTex(), { sway: 0.07, alphaTest: 0.5 });
  const W = Array.from({ length: 6 }, willowTemplate);
  const P = Array.from({ length: 4 }, peachTemplate);
  const C = Array.from({ length: 4 }, () => camphorTemplate());
  const bambooMat = foliageMat(bambooLeafTex(), { sway: 0.22, alphaTest: 0.5 });
  const B = Array.from({ length: 3 }, bambooTemplate);
  const place = (x, y, z, ry, s) => _m.compose(V(x, y, z), _q.setFromAxisAngle(UP, ry), V(s, s, s));
  return {
    // willows lean toward -x (the lake) unless a rotation is given
    willow(b, x, z, s = 1, { ry = rand(-0.5, 0.5), y = 0 } = {}) {
      const t = pick(W), m = place(x, y, z, ry, s * 1.5);
      b.addM(t.wood, bark, m, pick(['#b4a494', '#a89888', '#bcae9e']));
      b.addM(t.leaves, willowMat, m, null);
    },
    peach(b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0 } = {}) {
      const t = pick(P), m = place(x, y, z, ry, s * 1.35);
      b.addM(t.wood, bark, m, '#6a5a58');
      b.addM(t.leaves, blossomMat, m, null);
    },
    bamboo(b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0 } = {}) {
      const t = pick(B), m = place(x, y, z, ry, s);
      b.addM(t.wood, VC.solid, m, pick(['#6f9a3c', '#7aa646', '#5f8a34']));
      b.addM(t.leaves, bambooMat, m, null);
    },
    camphor(b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0 } = {}) {
      const t = pick(C), m = place(x, y, z, ry, s * 1.3);
      b.addM(t.wood, bark, m, '#8a7a66');
      b.addM(t.canopy, VC.solid, m, null);
    },
  };
}

// ---------- cherry blossoms (桜) ----------
function sakuraFlower(g, x, y, r) {
  const rot = rand(0, Math.PI * 2);
  for (let k = 0; k < 5; k++) {
    const a = rot + (k / 5) * Math.PI * 2;
    const gr = g.createRadialGradient(x, y, 0, x, y, r * 1.3);
    gr.addColorStop(0, '#ff8fb2'); gr.addColorStop(0.35, '#ffd3e2'); gr.addColorStop(1, '#fff6f9');
    g.fillStyle = gr;
    g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.58, r * 0.42, a, 0, Math.PI * 2); g.fill();
    g.save(); g.globalCompositeOperation = 'destination-out';      // the notch at each petal tip
    g.beginPath(); g.arc(x + Math.cos(a) * r * 1.18, y + Math.sin(a) * r * 1.18, r * 0.16, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  g.fillStyle = '#e8507a'; g.beginPath(); g.arc(x, y, r * 0.2, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffe066';
  for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; g.fillRect(x + Math.cos(a) * r * 0.36 - 0.8, y + Math.sin(a) * r * 0.36 - 0.8, 1.6, 1.6); }
}
function sakuraTex() {
  return canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#4a3434'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(14, 116); g.quadraticCurveTo(64, 70, 116, 16); g.stroke();
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(60, 68); g.lineTo(28, 30); g.moveTo(80, 50); g.lineTo(108, 88); g.stroke();
    for (let i = 0; i < 16; i++) sakuraFlower(g, rand(14, 114), rand(14, 114), rand(7.5, 11));
    g.fillStyle = '#e0507a';
    for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(rand(10, 118), rand(10, 118), rand(2, 3.4), 0, Math.PI * 2); g.fill(); }
  });
}
function sakuraStrandTex() {
  return canvasTex(64, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#4a3434'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
    for (let y = 6; y < h; y += 10) for (const side of [-1, 1]) {
      if (Math.random() < 0.25) continue;
      sakuraFlower(g, w / 2 + side * rand(5, 14), y + rand(-3, 3), rand(5, 7));
    }
  });
}
function petalCarpetTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), 0.7) * 120;
      g.fillStyle = pick(['#ffd6e4', '#ffe8ef', '#ffc2d6', '#fff4f7']);
      g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, rand(2, 3.6), rand(1.3, 2.2), rand(0, 3), 0, Math.PI * 2); g.fill();
    }
  }, { repeat: false });
}
const BLOOM = ['#ffffff', '#fff0f5', '#ffe6ee', '#fff8fa'];
const bloomTint = () => new THREE.Color(pick(BLOOM));

// Somei-Yoshino: short trunk, branches spreading wide, a broad dome of blossom clusters
function sakuraTemplate() {
  const wood = [], L = new Leaves();
  const r = rand(0.22, 0.3), top = V(rand(-0.2, 0.2), rand(1.6, 2.1), rand(-0.2, 0.2));
  limb(wood, V(0, -0.2, 0), V(0, 0.5, 0), r * 1.6, r);
  limb(wood, V(0, 0.4, 0), top, r, r * 0.8); joint(wood, top, r * 0.82);
  const nB = randi(4, 5);
  for (let i = 0; i < nB; i++) {
    const az = (i / nB) * Math.PI * 2 + rand(-0.35, 0.35);
    const d = V(Math.cos(az), 0.75, Math.sin(az)).normalize();
    let p = top.clone(), br = r * 0.62;
    for (let k = 0; k < 3; k++) {
      d.y -= 0.12; d.x += rand(-0.15, 0.15); d.z += rand(-0.15, 0.15); d.normalize();
      const q = p.clone().addScaledVector(d, rand(0.9, 1.3) * (1 - k * 0.15));
      limb(wood, p, q, br, br * 0.68, 6); joint(wood, q, br * 0.7);
      for (let j = 0; j < (k ? 6 : 3); j++) card(L, p.clone().lerp(q, Math.random()).add(V(rand(-0.5, 0.5), rand(0, 0.6), rand(-0.5, 0.5))), rand(0.9, 1.3), bloomTint());
      p = q; br *= 0.68;
    }
    for (let j = 0; j < 5; j++) card(L, p.clone().add(V(rand(-0.6, 0.6), rand(-0.3, 0.5), rand(-0.6, 0.6))), rand(1.0, 1.4), bloomTint());
  }
  for (let k = 0; k < 22; k++) {
    const a = rand(0, Math.PI * 2), rr = Math.sqrt(Math.random()) * 2.6;
    card(L, V(top.x + Math.cos(a) * rr, top.y + 1.4 + rand(-0.4, 0.9) - rr * 0.2, top.z + Math.sin(a) * rr), rand(1.0, 1.5), bloomTint());
  }
  return { wood: mergeGeometries(wood), leaves: L.geometry() };
}
// shidarezakura: weeping cherry with strands of blossom hanging like a willow
function shidareTemplate() {
  const wood = [], L = new Leaves();
  const r = rand(0.22, 0.28), top = V(rand(-0.15, 0.15), rand(2.6, 3.2), rand(-0.15, 0.15));
  limb(wood, V(0, -0.2, 0), V(0, 0.5, 0), r * 1.6, r);
  limb(wood, V(0, 0.4, 0), top, r, r * 0.8); joint(wood, top, r * 0.82);
  const nB = randi(5, 6);
  for (let i = 0; i < nB; i++) {
    const az = (i / nB) * Math.PI * 2 + rand(-0.3, 0.3);
    const bd = V(Math.cos(az) * 0.5, 1, Math.sin(az) * 0.5).normalize();
    let bp = top.clone(), br = r * 0.5;
    for (let k = 0; k < 3; k++) {
      bd.y -= 0.32; bd.normalize();
      const q = bp.clone().addScaledVector(bd, rand(0.7, 1.0));
      limb(wood, bp, q, br, br * 0.65, 6); joint(wood, q, br * 0.66);
      for (let j = 0; j < (k ? 7 : 3); j++) {
        const a = bp.clone().lerp(q, Math.random());
        strand(L, a, V(a.x - top.x, 0, a.z - top.z), Math.max(1.2, a.y - rand(0.2, 1.2)), rand(0.2, 0.5), bloomTint(), 0.32, 6);
      }
      bp = q; br *= 0.65;
    }
  }
  for (let j = 0; j < 14; j++) {
    const a = top.clone().add(V(rand(-1, 1), rand(0.2, 1.0), rand(-1, 1)));
    strand(L, a, V(a.x - top.x, 0, a.z - top.z), rand(1.2, 2.4), rand(0.3, 0.7), bloomTint(), 0.34, 5);
  }
  return { wood: mergeGeometries(wood), leaves: L.geometry() };
}

export function sakuraKit() {
  const blossom = foliageMat(sakuraTex(), { sway: 0.05, alphaTest: 0.5, emissive: 0.32 });
  const strandMat = foliageMat(sakuraStrandTex(), { sway: 0.26, alphaTest: 0.45, emissive: 0.28 });
  const bark = std({ map: barkTex(), vertexColors: true, roughness: 0.95 });
  const carpetTex = petalCarpetTex();
  const carpet = std({ map: carpetTex, alphaTest: 0.4, roughness: 0.9, emissive: '#ffffff', emissiveMap: carpetTex, emissiveIntensity: 0.22 });
  const S = Array.from({ length: 5 }, sakuraTemplate), W = Array.from({ length: 3 }, shidareTemplate);
  const place = (x, y, z, ry, s) => _m.compose(V(x, y, z), _q.setFromAxisAngle(UP, ry), V(s, s, s));
  const petals = (b, x, z, size, y = 0) => b.add(G.plane, carpet, x, y + 0.035, z, size, size, 1, -Math.PI / 2, rand(0, Math.PI), 0);
  return {
    sakura(b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0, carpet: withCarpet = true } = {}) {
      const t = pick(S), m = place(x, y, z, ry, s * 1.45);
      b.addM(t.wood, bark, m, '#8a7676');
      b.addM(t.leaves, blossom, m, null);
      if (withCarpet) petals(b, x, z, 6.5 * s, y);
    },
    shidare(b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0, carpet: withCarpet = true } = {}) {
      const t = pick(W), m = place(x, y, z, ry, s * 1.4);
      b.addM(t.wood, bark, m, '#7a6666');
      b.addM(t.leaves, strandMat, m, null);
      if (withCarpet) petals(b, x, z, 6 * s, y);
    },
    petals,
  };
}

// ---------- Beijing autumn: ginkgo avenues, persimmons over hutong walls, scholar trees, old cypresses ----------
// fan-shaped ginkgo leaf opening toward -y, stem end at the origin
function ginkgoLeaf(g, r, col) {
  const cy = -r * 0.32;
  g.fillStyle = col;
  g.beginPath(); g.moveTo(0, cy);
  g.arc(0, cy, r, -Math.PI / 2 - 1.0, -Math.PI / 2 - 0.07);
  g.lineTo(0, cy - r * 0.76);
  g.arc(0, cy, r, -Math.PI / 2 + 0.07, -Math.PI / 2 + 1.0);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(140, 95, 10, 0.35)'; g.lineWidth = Math.max(0.6, r * 0.05);
  for (let k = -4; k <= 4; k++) {
    const a = -Math.PI / 2 + k * 0.21;
    g.beginPath(); g.moveTo(0, cy); g.lineTo(Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92); g.stroke();
  }
  g.strokeStyle = '#8a6a18'; g.lineWidth = Math.max(0.8, r * 0.07);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, cy); g.stroke();
}
const GINKGO = ['#ffd23a', '#ffdc55', '#f7c22c', '#ffe680', '#f0b622', '#e9c53a'];
function ginkgoTex() {
  return canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 28; i++) {
      const a = rand(0, Math.PI * 2), rr = Math.sqrt(Math.random()) * 40;
      g.save(); g.translate(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr); g.rotate(rand(0, Math.PI * 2));
      ginkgoLeaf(g, rand(11, 17), pick(GINKGO)); g.restore();
    }
  }, { repeat: false });
}
function ginkgoCarpetTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 420; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), 0.7) * 118;
      g.save(); g.translate(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); g.rotate(rand(0, Math.PI * 2));
      ginkgoLeaf(g, rand(5, 8), pick(GINKGO)); g.restore();
    }
  }, { repeat: false });
}
const GOLD_T = ['#ffffff', '#fff4dc', '#ffeccc', '#fffaf0'];
const goldTint = () => new THREE.Color(pick(GOLD_T)).multiplyScalar(rand(0.92, 1.05));

// avenue ginkgo: straight trunk, branches climbing in a whorl, an egg-shaped golden crown
function ginkgoTemplate() {
  const wood = [], L = new Leaves();
  const r = rand(0.16, 0.21), H = rand(5.4, 6.4);
  limb(wood, V(0, -0.2, 0), V(0, H * 0.55, 0), r, r * 0.7);
  limb(wood, V(0, H * 0.55, 0), V(rand(-0.1, 0.1), H, rand(-0.1, 0.1)), r * 0.7, r * 0.25);
  const n = randi(8, 10);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), y = 1.7 + t * (H - 2.2), az = i * 2.4 + rand(-0.3, 0.3);
    const len = (1.8 - t * 0.9) * rand(0.85, 1.1);
    const d = V(Math.cos(az), rand(0.9, 1.3), Math.sin(az)).normalize();
    const p0 = V(0, y, 0), p1 = p0.clone().addScaledVector(d, len);
    limb(wood, p0, p1, r * 0.42 * (1 - t * 0.5), r * 0.12, 5);
    for (let k = 0; k < 4; k++) card(L, p0.clone().lerp(p1, 0.35 + k * 0.2).add(V(rand(-0.3, 0.3), rand(-0.2, 0.3), rand(-0.3, 0.3))), rand(0.8, 1.15), goldTint());
  }
  for (let k = 0; k < 46; k++) {
    const a = rand(0, Math.PI * 2), y = 2.0 + Math.random() * (H - 1.4);
    const rad = Math.sin(Math.PI * Math.min(1, (y - 1.6) / (H - 1.0))) * rand(0.6, 1.0) * 1.9;
    card(L, V(Math.cos(a) * rad, y, Math.sin(a) * rad), rand(0.85, 1.2), goldTint());
  }
  return { wood: mergeGeometries(wood), leaves: L.geometry() };
}
// persimmon (柿子树) in late autumn: bare twisting branches hung with orange fruit
function persimmonTemplate() {
  const wood = [], fruit = [];
  const r = rand(0.16, 0.2), t1 = V(rand(-0.2, 0.2), rand(1.3, 1.7), rand(-0.2, 0.2));
  limb(wood, V(0, -0.2, 0), t1, r, r * 0.75); joint(wood, t1, r * 0.76);
  const nB = randi(4, 5);
  for (let i = 0; i < nB; i++) {
    const az = (i / nB) * Math.PI * 2 + rand(-0.4, 0.4);
    let d = V(Math.cos(az) * 0.9, rand(0.7, 1.1), Math.sin(az) * 0.9).normalize(), p = t1.clone(), br = r * 0.6;
    for (let k = 0; k < 3; k++) {
      d = d.clone().add(V(rand(-0.35, 0.35), rand(-0.15, 0.2), rand(-0.35, 0.35))).normalize();
      const q = p.clone().addScaledVector(d, rand(0.8, 1.2) * (1 - k * 0.2));
      limb(wood, p, q, br, br * 0.62, 5);
      if (!k) joint(wood, q, br * 0.63);
      for (let j = 0; j < 2; j++) {
        const d2 = d.clone().add(V(rand(-0.8, 0.8), rand(-0.3, 0.4), rand(-0.8, 0.8))).normalize();
        const tw = q.clone().addScaledVector(d2, rand(0.4, 0.7));
        limb(wood, q, tw, br * 0.5, br * 0.2, 4);
        if (Math.random() < 0.85) fruit.push(tw.clone().add(V(0, -0.12, 0)));
        if (Math.random() < 0.4) fruit.push(q.clone().lerp(tw, 0.5).add(V(0, -0.1, 0)));
      }
      p = q; br *= 0.62;
    }
  }
  return { wood: mergeGeometries(wood), fruit };
}
// ancient cypress (古柏) of the Temple of Heaven: a twisted leaning trunk under dark columnar clumps
const CYPRESS = ['#1e3a2a', '#24432f', '#1a3326', '#2c4c36', '#203d2c'];
const HUAI = ['#8a9a3c', '#9aaa44', '#7d8e36', '#a8b04a', '#b8b050', '#8e9c40'];   // scholar tree turning yellow
function cypressTemplate() {
  const wood = [], blobs = [];
  const r = rand(0.26, 0.34);
  let p = V(0, -0.2, 0);
  for (let k = 0; k < 4; k++) {
    const q = p.clone().add(V(rand(-0.35, 0.35), rand(0.9, 1.3), rand(-0.35, 0.35)));
    limb(wood, p, q, r * (1 - k * 0.15), r * (0.85 - k * 0.15), 7); joint(wood, q, r * (0.86 - k * 0.15));
    p = q;
  }
  const top = p.y + 0.8;
  for (let i = 0; i < 9; i++) {
    const g = new THREE.IcosahedronGeometry(1, 1), pos = g.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k);
      const f = 0.82 + 0.34 * hash(Math.round(x * 100), Math.round(y * 100), Math.round(z * 100) + i * 13);
      pos.setXYZ(k, x * f, y * f, z * f);
    }
    const u = i / 8, s = 1.3 - u * 0.6;
    g.scale(s * rand(1, 1.25), s * rand(0.8, 1.0), s * rand(1, 1.25));
    g.translate(p.x * u + rand(-0.5, 0.5), 2.2 + u * (top - 2.2), p.z * u + rand(-0.5, 0.5));
    g.computeVertexNormals();
    const base = new THREE.Color(pick(CYPRESS)), col = new Float32Array(pos.count * 3);
    for (let f = 0; f < pos.count; f += 3) {
      const c = base.clone().multiplyScalar(rand(0.85, 1.15));
      for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (f + k) * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    blobs.push(g);
  }
  return { wood: mergeGeometries(wood), canopy: mergeGeometries(blobs) };
}

export function ginkgoKit() {
  const leafMat = foliageMat(ginkgoTex(), { sway: 0.08, alphaTest: 0.5, emissive: 0.35 });
  const bark = std({ map: barkTex(), vertexColors: true, roughness: 0.95 });
  const carpetTex = ginkgoCarpetTex();
  const carpet = std({ map: carpetTex, alphaTest: 0.4, roughness: 0.9, emissive: '#ffffff', emissiveMap: carpetTex, emissiveIntensity: 0.25 });
  const fruitMat = std({ color: '#ff7a1a', emissive: '#ff4a00', emissiveIntensity: 0.6, roughness: 0.35 });
  const GK = Array.from({ length: 5 }, ginkgoTemplate), PS = Array.from({ length: 4 }, persimmonTemplate);
  const HU = Array.from({ length: 3 }, () => camphorTemplate(HUAI)), CY = Array.from({ length: 3 }, cypressTemplate);
  const place = (x, y, z, ry, s) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, ry), V(s, s, s));
  const leaves = (b, x, z, size, y = 0) => b.add(G.plane, carpet, x, y + 0.035, z, size, size, 1, -Math.PI / 2, rand(0, Math.PI), 0);
  const p = V();
  return {
    ginkgo(b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0, carpet: withCarpet = true } = {}) {
      const t = pick(GK), m = place(x, y, z, ry, s * 1.3);
      b.addM(t.wood, bark, m, '#8a7a6a');
      b.addM(t.leaves, leafMat, m, null);
      if (withCarpet) leaves(b, x, z, 5.5 * s, y);
    },
    persimmon(b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0 } = {}) {
      const t = pick(PS), m = place(x, y, z, ry, s * 1.5);
      b.addM(t.wood, bark, m, '#5a4a40');
      for (const f of t.fruit) { p.copy(f).applyMatrix4(m); b.add(G.sphLow, fruitMat, p.x, p.y, p.z, 0.27 * s, 0.23 * s, 0.27 * s); }
    },
    huai(b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0 } = {}) {
      const t = pick(HU), m = place(x, y, z, ry, s * 1.3);
      b.addM(t.wood, bark, m, '#7a6a58');
      b.addM(t.canopy, VC.solid, m, null);
    },
    cypress(b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0 } = {}) {
      const t = pick(CY), m = place(x, y, z, ry, s * 1.25);
      b.addM(t.wood, bark, m, '#6a5a4a');
      b.addM(t.canopy, VC.solid, m, null);
    },
    leaves,
  };
}

// ---------- New York in autumn: London plane street trees, Central Park maples and elms ----------
const PLANE = ['#a8983a', '#b89a34', '#9a9a34', '#c0a43e', '#8a9238', '#c8a040'];
const MAPLE = ['#c8401e', '#d85a1a', '#e8862a', '#b8301e', '#f0a020', '#d0601e'];
const ELM = ['#c8a030', '#d8b03a', '#b89028', '#e0c040', '#c09a2e'];
export function parkTreeKit() {
  const bark = std({ map: barkTex(), vertexColors: true, roughness: 0.95 });
  const T = {
    plane: Array.from({ length: 3 }, () => camphorTemplate(PLANE)),
    maple: Array.from({ length: 3 }, () => camphorTemplate(MAPLE)),
    elm: Array.from({ length: 3 }, () => camphorTemplate(ELM)),
  };
  const place = (x, y, z, ry, s) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, ry), V(s, s, s));
  const put = (kind, barkCol) => (b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0 } = {}) => {
    const t = pick(T[kind]), m = place(x, y, z, ry, s * 1.3);
    b.addM(t.wood, bark, m, barkCol);
    b.addM(t.canopy, VC.solid, m, null);
  };
  return { planeTree: put('plane', '#9a9080'), maple: put('maple', '#5a4a3a'), elm: put('elm', '#6a5a48') };
}

// ---------- Sydney: jacarandas in bloom, Canary Island palms, Norfolk Island pines, Moreton Bay figs, gum trees ----------
const JACA = ['#9d7ae0', '#b394f0', '#8a6ad8', '#c4aaf8', '#7a5ac8'];
function jacarandaTex() {   // clusters of small purple bells among a few fern-like sprigs
  return canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#5a7a3a'; g.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const x = rand(20, 108), y = rand(20, 108), a = rand(0, Math.PI * 2);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22); g.stroke();
      for (let k = 1; k < 7; k++) { const px = x + Math.cos(a) * k * 3, py = y + Math.sin(a) * k * 3; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a + 1.2) * 5, py + Math.sin(a + 1.2) * 5); g.moveTo(px, py); g.lineTo(px + Math.cos(a - 1.2) * 5, py + Math.sin(a - 1.2) * 5); g.stroke(); }
    }
    for (let i = 0; i < 60; i++) {
      const a = rand(0, Math.PI * 2), rr = Math.sqrt(Math.random()) * 46, x = w / 2 + Math.cos(a) * rr, y = h / 2 + Math.sin(a) * rr, r = rand(4, 7);
      g.fillStyle = pick(JACA); g.beginPath();
      for (let k = 0; k <= 40; k++) { const t = (k / 40) * Math.PI * 2, e = r * (0.78 + 0.22 * Math.cos(5 * t)); g.lineTo(x + Math.cos(t) * e, y + Math.sin(t) * e); }
      g.fill();
      g.fillStyle = 'rgba(60, 30, 120, 0.55)'; g.beginPath(); g.arc(x, y, r * 0.3, 0, Math.PI * 2); g.fill();
    }
  }, { repeat: false });
}
function jacarandaCarpetTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 1000; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), 0.7) * 120;
      g.fillStyle = pick(JACA); g.beginPath(); g.arc(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, rand(1.6, 3), 0, Math.PI * 2); g.fill();
    }
  }, { repeat: false });
}
function frondTex() {   // pinnate palm frond: a midrib with leaflets
  return canvasTex(64, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#4a6a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2, 0); g.stroke();
    for (let y = h - 6; y > 4; y -= 5) {
      const len = (w / 2 - 2) * Math.min(1, (y / h) * 1.6 + 0.15);
      g.strokeStyle = pick(['#5a8a3a', '#6a9a42', '#4f7e34', '#7aa64a']); g.lineWidth = 2.2;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2, y); g.lineTo(w / 2 + s * len, y - len * 0.55); g.stroke(); }
    }
  }, { repeat: false });
}
function blobPads(list, n, cx, cy, cz, r, sx, sy, pal, seed) {   // flattened leafy clumps
  for (let i = 0; i < n; i++) {
    const g = new THREE.IcosahedronGeometry(1, 1), pos = g.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k), f = 0.84 + 0.3 * hash(Math.round(x * 100), Math.round(y * 100), Math.round(z * 100) + seed + i * 7);
      pos.setXYZ(k, x * f, y * f, z * f);
    }
    const a = (i / n) * Math.PI * 2 + rand(-0.3, 0.3), rr = i === 0 ? 0 : r;
    g.scale(sx * rand(0.85, 1.15), sy * rand(0.85, 1.15), sx * rand(0.85, 1.15));
    g.translate(cx + Math.cos(a) * rr, cy + rand(-0.2, 0.2), cz + Math.sin(a) * rr);
    g.computeVertexNormals();
    const base = new THREE.Color(pick(pal)), col = new Float32Array(pos.count * 3);
    for (let f = 0; f < pos.count; f += 3) { const c = base.clone().multiplyScalar(rand(0.85, 1.15)); for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (f + k) * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    list.push(g);
  }
}
// jacaranda: short trunk, wide spreading arms, an umbrella of purple bloom
function jacarandaTemplate() {
  const wood = [], L = new Leaves();
  const r = rand(0.2, 0.26), top = V(rand(-0.2, 0.2), rand(1.6, 2.0), rand(-0.2, 0.2));
  limb(wood, V(0, -0.2, 0), top, r * 1.2, r * 0.85); joint(wood, top, r * 0.86);
  const nB = randi(4, 5), tint = () => new THREE.Color('#ffffff').multiplyScalar(rand(0.9, 1.05));
  for (let i = 0; i < nB; i++) {
    const az = (i / nB) * Math.PI * 2 + rand(-0.35, 0.35);
    const d = V(Math.cos(az), 0.85, Math.sin(az)).normalize();
    let p = top.clone(), br = r * 0.6;
    for (let k = 0; k < 3; k++) {
      d.y -= 0.14; d.normalize();
      const q = p.clone().addScaledVector(d, rand(0.9, 1.3) * (1 - k * 0.12));
      limb(wood, p, q, br, br * 0.66, 6);
      if (!k) joint(wood, q, br * 0.67);
      for (let j = 0; j < (k ? 6 : 2); j++) card(L, p.clone().lerp(q, Math.random()).add(V(rand(-0.5, 0.5), rand(0, 0.6), rand(-0.5, 0.5))), rand(0.9, 1.3), tint());
      p = q; br *= 0.66;
    }
    for (let j = 0; j < 5; j++) card(L, p.clone().add(V(rand(-0.6, 0.6), rand(-0.2, 0.5), rand(-0.6, 0.6))), rand(1.0, 1.4), tint());
  }
  for (let k = 0; k < 26; k++) {
    const a = rand(0, Math.PI * 2), rr = Math.sqrt(Math.random()) * 2.8;
    card(L, V(top.x + Math.cos(a) * rr, top.y + 1.5 + rand(-0.3, 0.7) - rr * 0.22, top.z + Math.sin(a) * rr), rand(1.0, 1.5), tint());
  }
  return { wood: mergeGeometries(wood), leaves: L.geometry() };
}
// Canary Island date palm: a stout trunk under a fountain of arching fronds
function palmTemplate() {
  const wood = [], L = new Leaves();
  const H = rand(5.5, 7.5), top = V(rand(-0.2, 0.2), H, rand(-0.2, 0.2));
  limb(wood, V(0, -0.2, 0), top, 0.45, 0.38, 10); joint(wood, top, 0.55);
  const n = randi(15, 19);
  for (let i = 0; i < n; i++) {
    const az = (i / n) * Math.PI * 2 + rand(-0.15, 0.15), len = rand(3.4, 4.4), rise = rand(0.4, 1.1);
    const out = V(Math.cos(az), 0, Math.sin(az)), side = V(-Math.sin(az), 0, Math.cos(az)), tint = new THREE.Color('#ffffff').multiplyScalar(rand(0.85, 1.05));
    let prev = null;
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, w = 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08));
      const c = top.clone().addScaledVector(out, len * t).add(V(0, len * (rise * t - 0.9 * t * t), 0));
      const a0 = c.clone().addScaledVector(side, -w), a1 = c.clone().addScaledVector(side, w);
      if (prev) L.quad(prev[0], prev[1], a0, a1, V(0, 1, 0), prev[2], t, tint, prev[2] * 0.9, t * 0.9);
      prev = [a0, a1, t];
    }
  }
  return { wood: mergeGeometries(wood), leaves: L.geometry() };
}
const NORFOLK = ['#2e5a3a', '#386a44', '#2a5236', '#3e7048'];
function norfolkTemplate() {   // Norfolk Island pine: tall, symmetrical tiers of flat sprays
  const wood = [], blobs = [];
  const H = rand(13, 17);
  limb(wood, V(0, -0.2, 0), V(0, H, 0), 0.32, 0.06, 8);
  const tiers = Math.round(H / 1.5);
  for (let k = 0; k < tiers; k++) {
    const y = 3 + k * ((H - 3.5) / tiers), R = 3.0 * (1 - k / (tiers + 1.5)) + 0.4;
    blobPads(blobs, 6, 0, y, 0, R * 0.7, R * 0.5, 0.32, NORFOLK, k * 31);
  }
  blobPads(blobs, 1, 0, H + 0.2, 0, 0, 0.5, 0.8, NORFOLK, 999);
  return { wood: mergeGeometries(wood), canopy: mergeGeometries(blobs) };
}
const FIG = ['#2c5236', '#325c3c', '#3a6644', '#28482e', '#3e6a46'];
function figTemplate() {   // Moreton Bay fig: buttressed trunk, a vast low dome, hanging aerial roots
  const wood = [], blobs = [];
  limb(wood, V(0, -0.2, 0), V(0, 3.2, 0), 0.95, 0.7, 10); joint(wood, V(0, 3.2, 0), 0.75);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rand(-0.2, 0.2);
    limb(wood, V(Math.cos(a) * 1.6, -0.1, Math.sin(a) * 1.6), V(Math.cos(a) * 0.5, 1.6, Math.sin(a) * 0.5), 0.35, 0.2, 5);
    limb(wood, V(0, 3.0, 0), V(Math.cos(a) * 3.2, 4.6, Math.sin(a) * 3.2), 0.4, 0.2, 6);
  }
  blobPads(blobs, 9, 0, 5.6, 0, 3.6, 2.4, 1.4, FIG, 11);
  blobPads(blobs, 6, 0, 6.6, 0, 1.8, 2.2, 1.3, FIG, 57);
  for (let i = 0; i < 9; i++) {
    const a = rand(0, Math.PI * 2), rr = rand(2.5, 4.5);
    limb(wood, V(Math.cos(a) * rr, 4.4, Math.sin(a) * rr), V(Math.cos(a) * rr, 0.2, Math.sin(a) * rr), 0.05, 0.04, 4);
  }
  return { wood: mergeGeometries(wood), canopy: mergeGeometries(blobs) };
}
const GUM = ['#7a8a6a', '#6a7a5e', '#8a9a72', '#5e6e54'];
function gumTemplate() {   // eucalyptus: a pale, crooked trunk and a light, open crown
  const wood = [], blobs = [];
  let p = V(0, -0.2, 0);
  for (let k = 0; k < 3; k++) { const q = p.clone().add(V(rand(-0.4, 0.4), rand(1.4, 1.9), rand(-0.4, 0.4))); limb(wood, p, q, 0.3 - k * 0.07, 0.24 - k * 0.07, 7); joint(wood, q, 0.25 - k * 0.07); p = q; }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rand(-0.4, 0.4), q = p.clone().add(V(Math.cos(a) * rand(1.2, 1.8), rand(0.8, 1.6), Math.sin(a) * rand(1.2, 1.8)));
    limb(wood, p, q, 0.13, 0.06, 5);
    blobPads(blobs, 3, q.x, q.y + 0.3, q.z, 0.6, 0.9, 0.6, GUM, i * 13);
  }
  return { wood: mergeGeometries(wood), canopy: mergeGeometries(blobs) };
}
export function sydneyTreeKit() {
  const bloom = foliageMat(jacarandaTex(), { sway: 0.06, alphaTest: 0.5, emissive: 0.3 });
  const frond = foliageMat(frondTex(), { sway: 0.22, alphaTest: 0.45 });
  const bark = std({ map: barkTex(), vertexColors: true, roughness: 0.95 });
  const carpetTex = jacarandaCarpetTex();
  const carpet = std({ map: carpetTex, alphaTest: 0.4, roughness: 0.9, emissive: '#ffffff', emissiveMap: carpetTex, emissiveIntensity: 0.25 });
  const T = { jac: Array.from({ length: 4 }, jacarandaTemplate), palm: Array.from({ length: 3 }, palmTemplate), nor: Array.from({ length: 2 }, norfolkTemplate), fig: Array.from({ length: 2 }, figTemplate), gum: Array.from({ length: 3 }, gumTemplate) };
  const place = (x, y, z, ry, s) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, ry), V(s, s, s));
  const petals = (b, x, z, size, y = 0) => b.add(G.plane, carpet, x, y + 0.035, z, size, size, 1, -Math.PI / 2, rand(0, Math.PI), 0);
  return {
    jacaranda(b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0, carpet: c = true } = {}) {
      const t = pick(T.jac), m = place(x, y, z, ry, s * 1.4);
      b.addM(t.wood, bark, m, '#7a6a5e'); b.addM(t.leaves, bloom, m, null);
      if (c) petals(b, x, z, 6.5 * s, y);
    },
    palm(b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0 } = {}) {
      const t = pick(T.palm), m = place(x, y, z, ry, s);
      b.addM(t.wood, bark, m, '#a8885e'); b.addM(t.leaves, frond, m, null);
    },
    norfolk(b, x, z, s = 1, { y = 0 } = {}) { const t = pick(T.nor), m = place(x, y, z, rand(0, 6), s); b.addM(t.wood, bark, m, '#6a5a4a'); b.addM(t.canopy, VC.solid, m, null); },
    fig(b, x, z, s = 1, { y = 0 } = {}) { const t = pick(T.fig), m = place(x, y, z, rand(0, 6), s); b.addM(t.wood, bark, m, '#8a8070'); b.addM(t.canopy, VC.solid, m, null); },
    gum(b, x, z, s = 1, { y = 0 } = {}) { const t = pick(T.gum), m = place(x, y, z, rand(0, 6), s * 1.3); b.addM(t.wood, bark, m, '#e4dcd0'); b.addM(t.canopy, VC.solid, m, null); },
    petals,
  };
}

// ---------- London in winter: bare plane trees wrapped in fairy lights, snowy Norway spruces dressed for Christmas ----------
const SNOWC = new THREE.Color('#eef3ff');
// bake a colour into merged geometry, frosted with snow where the surface faces up (k: normal.y where the snow starts)
function frost(g, col, k = 0.5, patch = 0) {
  const n = g.attributes.normal, p = g.attributes.position, out = new Float32Array(n.count * 3), c = new THREE.Color(), base = new THREE.Color(col);
  for (let i = 0; i < n.count; i++) {
    let s = THREE.MathUtils.smoothstep(n.getY(i), k, k + 0.25);
    if (patch) s *= THREE.MathUtils.smoothstep(hash(Math.round(p.getX(i) * 3), Math.round(p.getY(i) * 3), Math.round(p.getZ(i) * 3)), 1 - patch, 1.05 - patch * 0.6);
    c.copy(base).multiplyScalar(rand(0.9, 1.08)).lerp(SNOWC, s);
    out.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(out, 3));
  return g;
}
const BULB = new THREE.OctahedronGeometry(1, 0);
function bulbGeo(points, pal, k, size) {   // tiny glowing octahedra, coloured per bulb (HDR vertex colours)
  const list = points.map((q) => {
    const g = BULB.clone(); g.scale(size, size, size); g.translate(q.x, q.y, q.z);
    const c = new THREE.Color(pick(pal)).multiplyScalar(k), a = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < a.length; i += 3) a.set([c.r, c.g, c.b], i);
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    return g;
  });
  return mergeGeometries(list);
}
// London plane in winter: a straight trunk forking into rising limbs and a fine crown of twigs, no leaves
function bareTemplate() {
  const wood = [], twigs = [];
  const r0 = rand(0.2, 0.25), top = V(rand(-0.15, 0.15), rand(2.6, 3.1), rand(-0.15, 0.15));
  limb(wood, V(0, -0.2, 0), top, r0 * 1.25, r0, 8); joint(wood, top, r0);
  const grow = (p, d, len, r, depth) => {
    const q = p.clone().addScaledVector(d, len);
    limb(wood, p, q, r, r * 0.7, depth >= 2 ? 6 : 4);
    if (depth === 3) joint(wood, q, r * 0.7);
    if (depth <= 2) twigs.push([p, q, depth]);
    if (!depth) return;
    for (let i = 0, n = depth === 3 ? 3 : 2; i < n; i++) {
      const nd = d.clone().add(V(rand(-0.8, 0.8), rand(0, 0.5), rand(-0.8, 0.8))).normalize();
      grow(q, nd, len * rand(0.6, 0.76), r * 0.64, depth - 1);
    }
  };
  const nB = randi(3, 4);
  for (let i = 0; i < nB; i++) {
    const az = (i / nB) * Math.PI * 2 + rand(-0.4, 0.4);
    grow(top, V(Math.cos(az) * 0.62, 0.78, Math.sin(az) * 0.62).normalize(), rand(1.7, 2.2), r0 * 0.72, 3);
  }
  const pts = [];
  for (const [p, q, depth] of twigs) for (let k = 0; k < (depth === 2 ? 2 : 1); k++) pts.push(p.clone().lerp(q, rand(0.3, 1)));
  return { wood: frost(mergeGeometries(wood), '#5c544a', 0.55), pts };
}
// Norway spruce: drooping, jagged tiers with patches of snow; light strings in three styles and baubles
const SPRUCE = ['#1e4a30', '#245636', '#1a4029', '#2a5a3a'];
function spruceTemplate() {
  const wood = [], tiers = [], H = rand(5.4, 6.2), n = 7;
  limb(wood, V(0, -0.2, 0), V(0, 1.2, 0), 0.2, 0.15, 6);
  const env = (y) => 2.15 * (1 - (y - 0.6) / (H - 0.6)) + 0.12;   // outer radius of the tiers at height y
  for (let k = 0; k < n; k++) {
    const t = k / n, y0 = 0.6 + t * (H - 1.3), h = ((H - 0.6) / n) * 2.1, R = env(y0);
    const g = new THREE.ConeGeometry(R, h, 12, 2, true), pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(z, x);
      if (y < -h / 2 + 0.01) { const j = 1 + 0.13 * Math.sin(a * 6 + k * 1.7); pos.setXYZ(i, x * j, y - 0.16 * Math.abs(Math.sin(a * 6 + k * 1.7)), z * j); }
    }
    g.translate(0, y0 + h / 2, 0); g.computeVertexNormals();
    const ng = g.toNonIndexed(); g.dispose();
    frost(ng, pick(SPRUCE), 0.62, 0.45);
    tiers.push(ng);
  }
  const top = H + 0.25, pts = { warm: [], multi: [], strings: [], baubles: [] };
  for (let i = 0; i < 70; i++) { const t = i / 70, y = 0.7 + t * (H - 1.0), a = t * Math.PI * 2 * 5.5, r = env(y) * 0.98; pts.warm.push(V(Math.cos(a) * r, y - 0.08, Math.sin(a) * r)); }
  for (let i = 0; i < 64; i++) { const y = rand(0.7, H - 0.3), a = rand(0, Math.PI * 2), r = env(y) * 0.98; pts.multi.push(V(Math.cos(a) * r, y - 0.08, Math.sin(a) * r)); }
  for (let s = 0; s < 14; s++) {   // the Norwegian way: straight strings of white bulbs from the top down
    const a = (s / 14) * Math.PI * 2;
    for (let y = H - 0.2; y > 0.7; y -= 0.34) { const r = env(y) * 0.99; pts.strings.push(V(Math.cos(a) * r, y - 0.06, Math.sin(a) * r)); }
  }
  for (let i = 0; i < 16; i++) { const y = rand(0.8, H - 0.8), a = rand(0, Math.PI * 2), r = env(y) * 0.9; pts.baubles.push(V(Math.cos(a) * r, y - 0.2, Math.sin(a) * r)); }
  return { wood: mergeGeometries(wood), tiers: mergeGeometries(tiers), pts, top };
}
export function londonTreeKit() {
  const bark = std({ map: barkTex(), vertexColors: true, roughness: 0.95 });
  const WARM = ['#ffe2a8', '#fff0c8', '#ffd890'], ICE = ['#bfe4ff', '#e4f4ff', '#9fd0ff'], MULTI = ['#ff3a3a', '#39ff88', '#3d9bff', '#ffd23d', '#ff7af0', '#ffffff'];
  const BARE = Array.from({ length: 4 }, bareTemplate).map((t) => ({ ...t, warm: bulbGeo(t.pts, WARM, 2.6, 0.075), ice: bulbGeo(t.pts, ICE, 2.6, 0.075) }));
  const SP = Array.from({ length: 3 }, spruceTemplate).map((t) => ({
    ...t, warm: bulbGeo(t.pts.warm, WARM, 3, 0.06), multi: bulbGeo(t.pts.multi, MULTI, 2.6, 0.06), strings: bulbGeo(t.pts.strings, ['#fff4dc', '#ffffff'], 2.8, 0.05),
  }));
  const BAUBLE = ['#c8202c', '#d8a020', '#c8202c', '#2a5ad8', '#e8e8f0'];
  const place = (x, y, z, ry, s) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, ry), V(s, s, s));
  const p = V();
  return {
    // lights: false, 'warm' or 'ice'
    bareTree(b, x, z, s = 1, { lights = false, y = 0, ry = rand(0, Math.PI * 2) } = {}) {
      const t = pick(BARE), m = place(x, y, z, ry, s * 1.3);
      b.addM(t.wood, VC.solid, m, null);
      if (lights) b.addM(t[lights], VC.glow, m, null);
    },
    // lights: 'warm' spiral, 'multi' coloured, 'strings' (Trafalgar Square), or none; star on top; baubles
    spruce(b, x, z, s = 1, { lights = 'warm', baubles = true, star = true, y = 0, ry = rand(0, Math.PI * 2), w = 1 } = {}) {
      const t = pick(SP), m = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, ry), V(s * w, s, s * w));
      b.addM(t.wood, bark, m, '#5a4636');
      b.addM(t.tiers, VC.solid, m, null);
      if (lights) b.addM(t[lights], VC.glow, m, null);
      if (baubles) for (const q of t.pts.baubles) { p.copy(q).applyMatrix4(m); b.sph(VC.metal, pick(BAUBLE), p.x, p.y, p.z, 0.11 * s, true); }
      if (star) { p.set(0, t.top, 0).applyMatrix4(m); b.add(G.cone4, VC.glow, p.x, p.y, p.z, 0.42 * s, 0.42 * s, 0.1 * s, 0, 0, Math.PI / 4, hdr('#ffd86a', 3)); b.add(G.cone4, VC.glow, p.x, p.y, p.z, 0.42 * s, 0.42 * s, 0.1 * s, 0, Math.PI / 2, Math.PI / 4, hdr('#ffd86a', 3)); }
    },
  };
}

// ---------- Lijiang: bougainvillea spilling over the walls, cosmos (格桑花) and rapeseed in bloom, Yunnan pines, walnuts ----------
function bougainTex() {   // papery magenta bracts in clusters among a few dark leaves
  return canvasTex(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    for (let i = 0; i < 10; i++) { g.fillStyle = pick(['#2e5a2a', '#3a6a30', '#24481f']); g.beginPath(); g.ellipse(rand(10, 118), rand(10, 118), rand(6, 10), rand(3, 5), rand(0, 3), 0, 7); g.fill(); }
    for (let c = 0; c < 10; c++) {
      const cx = rand(14, 114), cy = rand(14, 114), col = pick(['#e8288a', '#d81e7a', '#f040a0', '#c8187a', '#ff5ab0']);
      for (let k = 0; k < 7; k++) { const a = rand(0, 7), r = rand(2, 11); g.fillStyle = col; g.beginPath(); g.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, rand(5, 8), rand(4, 6), a, 0, 7); g.fill(); }
      g.fillStyle = '#fff0c0'; g.beginPath(); g.arc(cx, cy, 1.6, 0, 7); g.fill();
    }
  }, { repeat: false });
}
function cosmosTex() {   // cosmos on thin stems: pink, magenta and white
  return canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#4a7a3a'; g.lineWidth = 1.5;
    const heads = [];
    for (let i = 0; i < 14; i++) { const x = rand(8, 120), top = rand(14, 70), hx = x + rand(-6, 6); heads.push([hx, top]); g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + rand(-8, 8), (h + top) / 2, hx, top); g.stroke(); }
    for (let i = 0; i < 26; i++) { const x = rand(4, 124), y = rand(70, 124); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-7, 7), y - rand(4, 10)); g.stroke(); }
    for (const [x, y] of heads) {
      const col = pick(['#ff7ab8', '#ff4a9a', '#ffffff', '#ffb0d0', '#e8287a', '#ffd0e4']), r = rand(6, 9);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.fillStyle = col; g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.5, r * 0.26, a, 0, 7); g.fill(); }
      g.fillStyle = '#ffd23d'; g.beginPath(); g.arc(x, y, r * 0.22, 0, 7); g.fill();
    }
  }, { repeat: false });
}
function rapeTex() {   // a stand of yellow rapeseed
  return canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#4a7a2a'; g.lineWidth = 1.4;
    for (let i = 0; i < 30; i++) { const x = rand(2, 126), top = rand(10, 60); g.beginPath(); g.moveTo(x, h); g.lineTo(x + rand(-4, 4), top); g.stroke(); }
    for (let i = 0; i < 170; i++) { g.fillStyle = pick(['#ffe03a', '#ffd21a', '#fff06a', '#f2c010']); g.beginPath(); g.arc(rand(2, 126), rand(6, 72), rand(1.5, 3.2), 0, 7); g.fill(); }
  }, { repeat: false });
}
function drapeTemplate() {   // a 1 x 1 spill of bracts hanging down a wall, a little fuller at the top
  const L = new Leaves();
  for (let k = 0; k < 18; k++) card(L, V(rand(-0.5, 0.5), rand(-0.5, 0.45) * (k % 3 ? 1 : 0.6), rand(-0.12, 0.12)), rand(0.32, 0.5), new THREE.Color('#ffffff').multiplyScalar(rand(0.85, 1.05)));
  return L.geometry();
}
function clumpTemplate(w, hgt) {   // three upright crossed cards, rooted below and swaying at the top
  const L = new Leaves();
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI + rand(-0.2, 0.2), dx = (Math.cos(a) * w) / 2, dz = (Math.sin(a) * w) / 2;
    const n = V(-Math.sin(a), 0.6, Math.cos(a)).normalize(), c = new THREE.Color('#ffffff').multiplyScalar(rand(0.85, 1.05));
    L.quad(V(-dx, 0, -dz), V(dx, 0, dz), V(-dx, hgt, -dz), V(dx, hgt, dz), n, 0, 1, c, 0, 1);
  }
  return L.geometry();
}
export function lijiangTreeKit() {
  const drapeMat = foliageMat(bougainTex(), { sway: 0.05, alphaTest: 0.5, emissive: 0.18 });
  const cosmosMat = foliageMat(cosmosTex(), { sway: 0.12, alphaTest: 0.45, emissive: 0.12 });
  const rapeMat = foliageMat(rapeTex(), { sway: 0.08, alphaTest: 0.45, emissive: 0.15 });
  const bark = std({ map: barkTex(), vertexColors: true, roughness: 0.95 });
  const D = Array.from({ length: 3 }, drapeTemplate), C = Array.from({ length: 3 }, () => clumpTemplate(1.1, 0.95)), R = Array.from({ length: 2 }, () => clumpTemplate(1.3, 1.05));
  const P = Array.from({ length: 3 }, () => camphorTemplate(['#22442c', '#2a4f32', '#1e3c27', '#305638']));
  const WN = Array.from({ length: 3 }, () => camphorTemplate(['#4a6a32', '#56763a', '#3e5e2c', '#628040']));
  const place = (x, y, z, ry, sx, sy = sx, sz = sx) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, ry), V(sx, sy, sz));
  return {
    // bougainvillea hanging w wide and h tall from (x, y) down a wall; ry turns the sheet to face its street
    bougain(b, x, y, z, w, h, ry = 0) { b.addM(pick(D), drapeMat, place(x, y - h / 2, z, ry, w, h, 1), null); },
    cosmos(b, x, z0, z1, { y = 0, step = 0.85 } = {}) { for (let z = z0; z < z1; z += rand(step * 0.8, step * 1.2)) b.addM(pick(C), cosmosMat, place(x + rand(-0.35, 0.35), y, -z, rand(0, Math.PI), rand(0.8, 1.15)), null); },
    rapeseed(b, x0, x1, z0, z1, { y = 0, step = 1.25 } = {}) {
      for (let x = x0; x < x1; x += step) for (let z = z0; z < z1; z += step) b.addM(pick(R), rapeMat, place(x + rand(-0.35, 0.35), y, -z - rand(-0.35, 0.35), rand(0, Math.PI), rand(0.9, 1.25)), null);
    },
    pine(b, x, z, s = 1, { y = 0 } = {}) { const t = pick(P), m = place(x, y, z, rand(0, 6), s * 1.2, s * 1.8); b.addM(t.wood, bark, m, '#5a4636'); b.addM(t.canopy, VC.solid, m, null); },
    walnut(b, x, z, s = 1, { y = 0 } = {}) { const t = pick(WN), m = place(x, y, z, rand(0, 6), s * 1.35); b.addM(t.wood, bark, m, '#8a7a66'); b.addM(t.canopy, VC.solid, m, null); },
  };
}

// ---------- Paris: plane trees on the boulevards, horse chestnuts in flower, clipped limes, yew and box in the formal
// gardens, orange trees in their Versailles planters, wisteria over the doors and geraniums in the window boxes ----------
const PARIS_PLANE = ['#5e8a40', '#6a9848', '#54803a', '#76a452', '#628e44', '#6e9c4c'];
const MARRON = ['#2f5a2e', '#386634', '#2a5029', '#42703a', '#335e30'];
function planeBarkTex() {   // the plane's mottled bark: cream and olive where the old bark has flaked away
  return canvasTex(64, 128, (g, w, h) => {
    g.fillStyle = '#9a9478'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) {
      g.fillStyle = pick(['#d8d0b0', '#86825e', '#bab494', '#6e6c52', '#e6dec2']);
      g.beginPath(); g.ellipse(rand(0, w), rand(0, h), rand(3, 9), rand(5, 13), rand(-0.4, 0.4), 0, 7); g.fill();
    }
  });
}
function clippedTex() {   // clipped box, yew and pleached lime: a tight speckle of small leaves
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#2c5428'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = pick(['#3a6a34', '#22462a', '#4a7a3c', '#1c3a20', '#58883e', '#30602e']); g.fillRect(rand(0, w), rand(0, h), rand(1, 3), rand(1, 2.5)); }
  });
}
function wisteriaTex() {   // wisteria racemes hanging in lilac bunches among pale leaves
  return canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) { g.fillStyle = pick(['#5a7a3a', '#6a8a44', '#4a6a30']); g.beginPath(); g.ellipse(rand(8, 120), rand(6, 56), rand(5, 9), rand(2.5, 4), rand(0, 3), 0, 7); g.fill(); }
    for (let c = 0; c < 10; c++) {
      const x = rand(10, 118), y0 = rand(6, 36), L = rand(44, 84), col = pick(['#b89ae8', '#a07ad8', '#c8b0f0', '#9a70d0', '#d8c4f4']);
      for (let k = 0; k < 18; k++) { const t = k / 18, r = 7 * (1 - t * 0.75); g.fillStyle = col; g.beginPath(); g.arc(x + rand(-r, r) * 0.6, y0 + t * L, Math.max(1.6, r * 0.55), 0, 7); g.fill(); }
    }
  }, { repeat: false });
}
function geraniumTex() {   // a window box of geraniums: round flower heads over scalloped leaves
  return canvasTex(256, 64, (g, w) => {
    g.clearRect(0, 0, w, 64);
    for (let i = 0; i < 46; i++) { g.fillStyle = pick(['#2e6a2a', '#3a7a32', '#26582a']); g.beginPath(); g.arc(rand(4, w - 4), rand(30, 60), rand(6, 10), 0, 7); g.fill(); }
    for (let i = 0; i < 22; i++) {
      const x = rand(8, w - 8), y = rand(10, 36), col = pick(['#e82a2a', '#ff3a4a', '#d81e2a', '#ff5a6a', '#f4f0f0', '#ff6ab0']);
      for (let k = 0; k < 7; k++) { g.fillStyle = col; g.beginPath(); g.arc(x + rand(-6, 6), y + rand(-5, 5), rand(2.5, 4), 0, 7); g.fill(); }
    }
  }, { repeat: false });
}
function marronnierTemplate() {   // horse chestnut in May: a dark dome studded with upright white flower candles
  const t = camphorTemplate(MARRON), pos = t.canopy.attributes.position, nor = t.canopy.attributes.normal, parts = [t.canopy];
  const cone = new THREE.ConeGeometry(0.12, 0.46, 5).toNonIndexed();
  for (let k = 0, n = 0; k < 120 && n < 24; k++) {
    const i = randi(0, pos.count - 1);
    if (nor.getY(i) < 0.3) continue;
    const g = cone.clone(); g.translate(pos.getX(i), pos.getY(i) + 0.16, pos.getZ(i));
    const c = new THREE.Color(pick(['#fffaf2', '#fff2f4', '#ffffff', '#fbe8e2'])), col = new Float32Array(g.attributes.position.count * 3);
    for (let v = 0; v < g.attributes.position.count; v++) col.set([c.r, c.g, c.b], v * 3);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    parts.push(g); n++;
  }
  return { wood: t.wood, canopy: mergeGeometries(parts) };
}
const clipBoxes = new Map();
function clipBox(w, h, d, s = 1.2) {   // a box whose UVs tile the clipped-leaf texture in world units
  const key = `${w.toFixed(2)}|${h.toFixed(2)}|${d.toFixed(2)}`;
  if (clipBoxes.has(key)) return clipBoxes.get(key);
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / s, (uv.getY(i) * dims[f][1]) / s); }
  clipBoxes.set(key, g);
  return g;
}
export function parisTreeKit() {
  const bark = std({ map: planeBarkTex(), vertexColors: true, roughness: 0.9 });
  const darkBark = std({ map: barkTex(), vertexColors: true, roughness: 0.95 });
  const clip = std({ map: clippedTex(), vertexColors: true, roughness: 0.9 });
  const wisMat = foliageMat(wisteriaTex(), { sway: 0.05, alphaTest: 0.5, emissive: 0.16 });
  const gerMat = foliageMat(geraniumTex(), { sway: 0.03, alphaTest: 0.5, emissive: 0.14 });
  const PL = Array.from({ length: 4 }, () => camphorTemplate(PARIS_PLANE));
  const MA = Array.from({ length: 3 }, marronnierTemplate);
  const D = Array.from({ length: 3 }, drapeTemplate);
  const place = (x, y, z, ry, sx, sy = sx, sz = sx) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, ry), V(sx, sy, sz));
  const K = {
    clipMat: clip,
    // a boulevard plane: a tall clear trunk under a broad crown
    plane(b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0 } = {}) { const t = pick(PL), m = place(x, y, z, ry, s * 1.35, s * 2.1, s * 1.35); b.addM(t.wood, bark, m, '#ffffff'); b.addM(t.canopy, VC.solid, m, null); },
    marronnier(b, x, z, s = 1, { ry = rand(0, Math.PI * 2), y = 0 } = {}) { const t = pick(MA), m = place(x, y, z, ry, s * 1.55, s * 1.9, s * 1.55); b.addM(t.wood, darkBark, m, '#6a5a4a'); b.addM(t.canopy, VC.solid, m, null); },
    // the gardens' clipped trees: a lime pleached into a box on a bare trunk, box and yew topiary, low parterre hedges
    pleached(b, x, z, { w = 3.2, h = 2.8, d = 3.2, trunk = 2.8, ry = 0, y = 0 } = {}) {
      b.cyl(darkBark, '#7a6a58', x, y + trunk / 2, z, 0.13, trunk, 'cyl8');
      b.addM(clipBox(w, h, d), clip, place(x, y + trunk + h / 2, z, ry, 1), pick(['#ffffff', '#f0f8e8', '#e8f0e0']));
    },
    topiary(b, x, z, kind = 'cone', s = 1, y = 0) {
      if (kind === 'cone') b.add(G.cone8, clip, x, y + 1.3 * s, z, 1.3 * s, 2.6 * s, 1.3 * s, 0, rand(0, 3), 0, '#ffffff');
      else if (kind === 'ball') b.add(G.sphLow, clip, x, y + 0.6 * s, z, 1.2 * s, 1.1 * s, 1.2 * s, 0, rand(0, 3), 0, '#ffffff');
      else { b.addM(clipBox(0.9 * s, 1.0 * s, 0.9 * s), clip, place(x, y + 0.5 * s, z, 0, 1), '#ffffff'); b.add(G.sphLow, clip, x, y + 1.5 * s, z, 0.9 * s, 0.9 * s, 0.9 * s, 0, 0, 0, '#ffffff'); }
    },
    hedge(b, x, z, w, h, d, y = 0) { b.addM(clipBox(w, h, d), clip, place(x, y + h / 2, z, 0, 1), pick(['#ffffff', '#f4f8ee'])); },
    // an orange tree in its white Versailles box, ball finials at the corners
    orange(b, x, z, s = 1) {
      b.box(VC.solid, '#f2f0e8', x, 0.5 * s, z, 0.95 * s, 1.0 * s, 0.95 * s);
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        b.box(VC.solid, '#2a4a3a', x + dx * 0.47 * s, 0.5 * s, z + dz * 0.47 * s, 0.1 * s, 1.02 * s, 0.1 * s);
        b.sph(VC.solid, '#f2f0e8', x + dx * 0.47 * s, 1.08 * s, z + dz * 0.47 * s, 0.08 * s, true);
      }
      b.cyl(darkBark, '#6a5a48', x, 1.5 * s, z, 0.07 * s, 1.0 * s, 'cyl8');
      b.add(G.sphLow, clip, x, 2.5 * s, z, 1.5 * s, 1.4 * s, 1.5 * s, 0, rand(0, 3), 0, '#ffffff');
      for (let k = 0; k < 7; k++) { const a = rand(0, 6.28), e = rand(-0.4, 0.8); b.sph(VC.solid, '#ff9a1a', x + Math.cos(a) * Math.cos(e) * 0.74 * s, 2.5 * s + Math.sin(e) * 0.68 * s, z + Math.sin(a) * Math.cos(e) * 0.74 * s, 0.07 * s, true); }
    },
    // wisteria spilling w wide and h tall from (x, y) down a facade; ry turns the sheet to face its street
    wisteria(b, x, y, z, w, h, ry = 0) { b.addM(pick(D), wisMat, place(x, y - h / 2, z, ry, w, h, 1), null); },
    geraniums(b, x, y, z, w, ry = 0, box = '#3a2a24') {
      b.add(G.box, VC.solid, x, y + 0.12, z, w, 0.24, 0.28, 0, ry, 0, box);
      b.add(G.plane, gerMat, x, y + 0.36, z, w, w / 4 * 0.9, 1, 0, ry, 0, '#ffffff');
    },
  };
  return K;
}
