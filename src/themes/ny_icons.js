// New York's icons, each modelled once in its own frame so the same model can stand in a landmark scene (lit, in the
// fog) or on the far skyline (unlit, its shading baked into vertex colours): the Statue of Liberty, the Empire State
// Building, the Chrysler Building, One World Trade Center, and a few more towers for the skyline.
import { THREE, G, canvasTex, rand, randi, pick } from '../core.js';

const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _a = new THREE.Vector3();

// ---------- geometry helpers ----------
const tapers = new Map();
export function taperGeo(ratio, seg = 10) {   // unit cylinder, radius 0.5 at the bottom and 0.5·ratio at the top
  const key = `${ratio.toFixed(2)}:${seg}`;
  if (!tapers.has(key)) tapers.set(key, new THREE.CylinderGeometry(0.5 * ratio, 0.5, 1, seg));
  return tapers.get(key);
}
const fr4 = new Map();
export function frustum4(top, bot, h) {   // square frustum standing on y = 0, sides top and bot
  const key = `${top}:${bot}:${h}`;
  if (!fr4.has(key)) { const g = new THREE.CylinderGeometry(top / Math.SQRT2, bot / Math.SQRT2, h, 4, 1); g.rotateY(Math.PI / 4); g.translate(0, h / 2, 0); fr4.set(key, g.toNonIndexed()); fr4.get(key).computeVertexNormals(); }
  return fr4.get(key);
}

// A frame: parts added through it are placed in the model's own coordinates (metres, y up), then turned (ry), scaled
// (s) and moved into the batcher's space.
export function frame(b, x, y, z, s = 1, ry = 0) {
  const M = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, ry), new THREE.Vector3(s, s, s));
  const F = {
    M, s,
    addM(geo, mat, m, col = 0xffffff) { b.addM(geo, mat, _m2.multiplyMatrices(M, m), col); return F; },
    add(geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0, col = 0xffffff) {
      _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(sx, sy, sz));
      return F.addM(geo, mat, _m, col);
    },
    box(mat, col, x, y, z, w, h, d, ry = 0, rx = 0, rz = 0) { return F.add(G.box, mat, x, y, z, w, h, d, rx, ry, rz, col); },
    block(mat, col, x, y, z, w, h, d, ry = 0) { return F.add(G.box, mat, x, y + h / 2, z, w, h, d, 0, ry, 0, col); },
    cyl(mat, col, x, y, z, r, h, seg = 'cyl', rx = 0, rz = 0) { return F.add(G[seg], mat, x, y, z, r * 2, h, r * 2, rx, 0, rz, col); },
    ell(mat, col, x, y, z, rx, ry, rz, low = false) { return F.add(low ? G.sphLow : G.sph, mat, x, y, z, rx * 2, ry * 2, rz * 2, 0, 0, 0, col); },
    // a member from a to c: geo's unit y axis is stretched between them (a box of section t × t2, or a taper r0 → r1)
    span(geo, mat, col, a, c, sx, sz = sx) {
      _a.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
      const len = _a.length();
      if (len < 1e-5) return F;
      _q.setFromUnitVectors(UP, _a.multiplyScalar(1 / len));
      _m.compose(_p.set((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2), _q, _s.set(sx, len, sz));
      return F.addM(geo, mat, _m, col);
    },
    beam(mat, col, a, c, t = 0.3, t2 = t) { return F.span(G.box, mat, col, a, c, t, t2); },
    limb(mat, col, a, c, r0, r1 = r0, seg = 10) { return F.span(taperGeo(r1 / r0, seg), mat, col, a, c, r0 * 2); },
    at(x, y, z) { return new THREE.Vector3(x, y, z).applyMatrix4(M); },
  };
  return F;
}

// Thin a material's fog (the landmarks far out over the water would otherwise fade into the dusk haze).
export function thinFog(mat, k = 0.4) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', `#ifdef USE_FOG
      gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vFogDepth) * ${k.toFixed(2)});
    #endif`);
  };
  mat.customProgramCacheKey = () => 'curvedThinFog' + k;
  return mat;
}

// Light a model's vertex colours once, for the unlit skyline: ambient plus a key light from direction L.
export function bakeShade(obj, mats, L, amb = 0.55, k = 0.6) {
  const l = L.clone().normalize();
  obj.traverse((m) => {
    if (!m.isMesh || !mats.includes(m.material)) return;
    const n = m.geometry.attributes.normal, c = m.geometry.attributes.color;
    if (!n || !c) return;
    for (let i = 0; i < c.count; i++) {
      const f = amb + k * Math.max(0, n.getX(i) * l.x + n.getY(i) * l.y + n.getZ(i) * l.z);
      c.setXYZ(i, c.getX(i) * f, c.getY(i) * f, c.getZ(i) * f);
    }
    c.needsUpdate = true;
  });
}

// A draped figure's robe: rings (y, rx, rz) round a vertical axis, each pushed in and out by folds that are deep at the
// hem and fade toward the shoulders; the folds drift round as they rise, as the cloak crosses the body. Capped on top.
export function drapeGeo(rings, { seg = 48, folds = 11, seed = 0.7 } = {}) {
  const pos = [], idx = [];
  for (const { y, rx, rz, cx = 0, cz = 0, f = 0 } of rings) {
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const k = 1 + f * (0.6 * Math.sin(folds * a + seed + y * 0.11) + 0.4 * Math.sin((2 * folds + 3) * a + 2.3 * seed - y * 0.07));
      pos.push(cx + Math.cos(a) * rx * k, y, cz + Math.sin(a) * rz * k);
    }
  }
  const R = rings.length;
  for (let j = 0; j < R - 1; j++) for (let i = 0; i < seg; i++) {
    const a = j * (seg + 1) + i, c = a + seg + 1;
    idx.push(a, c, a + 1, a + 1, c, c + 1);
  }
  const top = rings[R - 1], ci = pos.length / 3;
  pos.push(top.cx || 0, top.y, top.cz || 0);
  for (let i = 0; i < seg; i++) { const a = (R - 1) * (seg + 1) + i; idx.push(a, ci, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function starGeo(n, ro, ri, h) {   // an n-pointed star wall standing on y = 0
  const sh = new THREE.Shape();
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? ri : ro;
    i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 6, uv.getY(i) / 6);
  return g;
}

// ---------- textures ----------
export function tabletTex() {   // her tablet: JULY IV MDCCLXXVI in Roman letters on the copper
  return canvasTex(128, 224, (g, w, h) => {
    g.fillStyle = '#7fb8a4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(30,70,60,0.55)'; g.lineWidth = 5; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = 'rgba(28,64,54,0.85)'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 30px Georgia, "Times New Roman", serif'; g.fillText('JULY IV', w / 2, h * 0.38);
    g.font = '700 21px Georgia, "Times New Roman", serif'; g.fillText('MDCCLXXVI', w / 2, h * 0.58);
  }, { repeat: false });
}
export function graniteTex() {   // dressed granite blocks for the pedestal and the fort
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#9a8c80'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 16 - 16; x < w; x += 32) {
      const v = randi(-12, 12); g.fillStyle = `rgb(${176 + v},${164 + v},${150 + v})`; g.fillRect(x + 1, y + 1, 30, 14);
    }
  });
}
// The Empire State Building's face: limestone piers between continuous metal mullions, recessed window columns
export function esbTex({ pier = '#4a4e6e', win = '#141828', lit = ['#ffd890', '#ffe8c0', '#fff4dc'], chance = 0.32 } = {}) {
  const cols = 8, rows = 24, cw = 16, ch = 12;
  const map = canvasTex(cols * cw, rows * ch, (g) => {
    g.fillStyle = pier; g.fillRect(0, 0, cols * cw, rows * ch);
    for (let c = 0; c < cols; c++) {
      g.fillStyle = win; g.fillRect(c * cw + 5, 0, cw - 8, rows * ch);
      for (let r = 0; r < rows; r++) {
        g.fillStyle = 'rgba(120,128,160,0.35)'; g.fillRect(c * cw + 5, r * ch + ch - 3, cw - 8, 3);   // the aluminium spandrels
        if (Math.random() < chance) { g.fillStyle = pick(lit); g.fillRect(c * cw + 6, r * ch + 2, cw - 10, ch - 6); }
      }
    }
  });
  return { map, cols, rows };
}

// ---------- a standing statue ----------
// In its frame: feet at y = 0, facing +x, about 2 m tall before scaling. arms: 'down', 'out' (the right held out in
// front, as Washington at Federal Hall) or 'hips' (both hands on the hips, as the Fearless Girl).
export function figure(F, mat, col = 0xffffff, { arms = 'down', cloak = false, skirt = false, hair = false } = {}) {
  for (const e of [-1, 1]) F.limb(mat, col, [0.02, 0.04, e * 0.12], [0, 0.95, e * 0.11], 0.1, 0.13, 6);
  if (skirt) F.add(G.cone8, mat, 0, 0.98, 0, 0.78, 0.62, 0.66, 0, 0, 0, col);
  F.limb(mat, col, [0, 0.9, 0], [0, 1.55, 0], 0.2, 0.25, 8);
  if (cloak) F.add(G.cone8, mat, -0.1, 1.02, 0, 0.78, 1.25, 0.84, 0, 0, 0.06, col);
  F.ell(mat, col, 0.02, 1.79, 0, 0.13, 0.16, 0.13);
  if (hair) F.limb(mat, col, [-0.1, 1.86, 0], [-0.3, 1.55, 0], 0.07, 0.04, 6);
  for (const e of [-1, 1]) {
    const sh = [0, 1.5, e * 0.25];
    if (arms === 'hips') { const el = [-0.05, 1.24, e * 0.46], h = [0.04, 1.02, e * 0.22]; F.limb(mat, col, sh, el, 0.07, 0.06, 6); F.limb(mat, col, el, h, 0.06, 0.05, 6); }
    else if (arms === 'out' && e > 0) { const el = [0.4, 1.4, 0.34], h = [0.78, 1.46, 0.36]; F.limb(mat, col, sh, el, 0.08, 0.07, 6); F.limb(mat, col, el, h, 0.07, 0.06, 6); }
    else F.limb(mat, col, sh, [0.04, 1.0, e * 0.3], 0.08, 0.06, 6);
  }
  return F;
}

// ---------- the Statue of Liberty ----------
// Her frame: metres at full size, the island at y = 0, the heel of the figure at y = 47 on the pedestal; she faces +x
// and her right side, the torch arm, is +z. Materials: copper, stone (pedestal and fort), flame, glow (crown windows,
// floodlights) and tablet (its face, or the copper); vertex-coloured materials take cc / sc / gc.
const ROBE = [
  [-0.3, 6.4, 6.2, 0.13], [1.4, 6.05, 5.95, 0.135], [4.4, 5.55, 5.7, 0.125], [7.8, 5.1, 5.5, 0.11, 0.25],
  [11.2, 4.75, 5.3, 0.09], [14.4, 4.45, 5.05, 0.07], [17.0, 4.0, 4.75, 0.045], [19.4, 4.1, 4.85, 0.03],
  [21.5, 4.15, 5.0, 0.02], [23.3, 3.85, 5.25, 0.014], [24.7, 3.25, 5.3, 0.01], [25.8, 2.55, 4.35, 0.006],
  [26.6, 1.75, 2.05, 0], [27.0, 1.4, 1.5, 0],
];
export function liberty(b, { x, y, z, s = 1, ry = 0, copper, stone, flame, glow, tablet = copper, base = true,
  cc = '#7fb8a4', sc = '#b4a494', gc = '#ffd890', fc = '#ffc04a' }) {
  const F = frame(b, x, y, z, s, ry), H = 47;
  if (base) {
    // Fort Wood's eleven-pointed star, the stepped foundation inside it, Hunt's granite pedestal
    F.addM(starGeo(11, 46, 31, 6.5), stone, _m.identity(), sc);
    F.addM(frustum4(20.3, 27.7, 13.5), stone, _m.makeTranslation(0, 6.5, 0), sc);
    F.block(stone, sc, 0, 20, 0, 19.2, 2.5, 19.2);
    F.addM(frustum4(15.6, 17, 18.5), stone, _m.makeTranslation(0, 22.5, 0), sc);
    for (let f = 0; f < 4; f++) {
      const a = (f * Math.PI) / 2, cs = Math.cos(a), sn = Math.sin(a);
      const P = (d, yy, t) => [cs * d - sn * t, yy, -sn * d - cs * t];   // d out from the centre, t along the face
      const face = (yy) => (17 - ((yy - 22.5) / 18.5) * 1.4) / 2;
      // the central bay: a door at the foot, the loggia's four columns high up, the band of discs over it
      F.add(G.box, stone, ...P(face(31) + 0.25, 31.6, 0), 0.6, 18.2, 8.2, 0, a, 0, sc);
      F.add(G.box, stone, ...P(face(24) + 0.55, 24.6, 0), 0.05, 4.2, 3.0, 0, a, 0, '#2a2420');
      F.add(G.box, stone, ...P(face(36) + 0.57, 36.4, 0), 0.05, 5.4, 6.4, 0, a, 0, '#3a3430');
      for (const t of [-2.4, -0.8, 0.8, 2.4]) F.add(G.cyl8, stone, ...P(face(36) + 0.75, 36.3, t), 0.6, 5.2, 0.6, 0, 0, 0, sc);
      F.add(G.box, stone, ...P(face(33.6) + 0.85, 33.6, 0), 0.9, 0.4, 7.2, 0, a, 0, sc);
      for (let k = 0; k < 8; k++) F.add(G.cyl8, stone, ...P(face(40) + 0.6, 40.1, -3.15 + k * 0.9), 0.75, 0.12, 0.75, 0, a, Math.PI / 2, sc);
      for (let k = 0; k < 9; k++) {   // rusticated quoins up the corners
        const yy = 23.4 + k * 2.0, hw = face(yy) + 0.15, L = k % 2 ? 2.4 : 1.6;
        F.add(G.box, stone, ...P(hw, yy, hw - L / 2), 0.3, 1.7, L, 0, a, 0, sc);
      }
    }
    F.block(stone, sc, 0, 41, 0, 17.8, 1.4, 17.8);   // the cornice, the attic, the balcony on top
    F.block(stone, sc, 0, 42.4, 0, 14.6, 3.4, 14.6);
    F.block(stone, sc, 0, 45.8, 0, 15.2, 0.35, 15.2);
    for (let f = 0; f < 4; f++) for (let k = -6; k <= 6; k++) {
      const a = (f * Math.PI) / 2;
      F.add(G.box, stone, Math.cos(a) * 7.4 - Math.sin(a) * k * 1.15, 46.6, -Math.sin(a) * 7.4 - Math.cos(a) * k * 1.15, 0.22, 1.2, 0.22, 0, 0, 0, sc);
    }
    F.block(stone, sc, 0, 46.1, 0, 12.6, 0.9, 12.6);
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) F.ell(glow, gc, dx * 6.8, 46.3, dz * 6.8, 0.35, 0.25, 0.35, true);   // her floodlights
  }
  // the robe and the cloak, gathered under the bust, falling in folds over the stepping right foot
  F.addM(drapeGeo(ROBE.map(([yy, rx, rz, f, cx = 0]) => ({ y: H + yy, rx, rz, f, cx }))), copper, _m.identity(), cc);
  const front = (yy, zz) => {   // where the robe's front is at height yy, zz off the middle
    let i = 0; while (i < ROBE.length - 2 && ROBE[i + 1][0] < yy) i++;
    const [y0, rx0, rz0] = ROBE[i], [y1, rx1, rz1] = ROBE[i + 1], t = Math.min(1, Math.max(0, (yy - y0) / (y1 - y0)));
    const rx = rx0 + (rx1 - rx0) * t, rz = rz0 + (rz1 - rz0) * t;
    return rx * Math.sqrt(Math.max(0.05, 1 - (zz / rz) ** 2));
  };
  for (const [ya, za, yc, zc, r] of [[24.0, -3.6, 14.6, 3.4, 0.55], [21.4, -4.1, 11.4, 2.6, 0.5], [18.2, -4.2, 8.2, 1.6, 0.46], [13.2, -3.9, 3.4, -0.2, 0.42]])
    F.limb(copper, cc, [front(ya, za) - 0.15, H + ya, za], [front(yc, zc) - 0.2, H + yc, zc], r, r * 0.7, 8);   // the cloak's swags crossing her front
  F.ell(copper, cc, 4.6, H + 0.6, 1.9, 1.5, 0.7, 1.0, true);   // her left foot, the right heel raised behind
  F.ell(copper, cc, -4.2, H + 1.6, 3.4, 1.3, 0.9, 0.9, true);
  // the neck and the head: the brow, the long straight nose, the hair gathered behind
  F.limb(copper, cc, [0, H + 26.4, 0], [0.25, H + 29.0, 0], 1.45, 1.25, 10);
  F.ell(copper, cc, 0.3, H + 30.4, 0, 2.15, 2.6, 1.78);
  F.ell(copper, cc, -0.5, H + 30.9, 0, 2.2, 2.45, 1.98);
  F.add(G.box, copper, 2.38, H + 30.2, 0, 0.6, 1.15, 0.44, 0, 0, -0.18, cc);
  F.add(G.box, copper, 2.2, H + 31.15, 0, 0.42, 0.3, 2.1, 0, 0, 0, cc);
  F.ell(copper, cc, 2.0, H + 28.9, 0, 0.75, 0.6, 0.95, true);
  // the crown: its band with the twenty-five windows lit, and the seven rays
  F.add(G.cyl, copper, 0.25, H + 32.3, 0, 4.6, 1.15, 4.0, 0, 0, -0.08, cc);
  F.add(G.cyl, copper, 0.3, H + 32.95, 0, 4.9, 0.25, 4.3, 0, 0, -0.08, cc);
  for (let k = 0; k < 25; k++) {
    const a = -1.25 + (2.5 * k) / 24;
    F.add(G.box, glow, 0.25 + Math.cos(a) * 2.32, H + 32.3, Math.sin(a) * 2.02, 0.12, 0.42, 0.22, 0, -a, 0, gc);
  }
  for (let k = 0; k < 7; k++) {
    const a = ((k - 3) / 3) * 1.32, el = 0.68 - (Math.abs(k - 3) / 3) * 0.36, L = 3.6;
    const bx = 0.3 + Math.cos(a) * 2.2, bz = Math.sin(a) * 1.9, by = H + 33.0;
    const d = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)];
    F.span(G.cone4, copper, cc, [bx, by, bz], [bx + d[0] * L, by + d[1] * L, bz + d[2] * L], 0.95, 0.5);
  }
  // the right arm raised in its fallen sleeve, the hand round the torch: the cup, the balcony, the gilded flame
  const S = [0.3, H + 24.6, 4.5], E = [1.0, H + 30.6, 5.35], W = [1.55, H + 36.4, 5.85];
  F.limb(copper, cc, S, E, 1.55, 1.25, 10);
  F.limb(copper, cc, E, W, 1.2, 0.85, 10);
  F.limb(copper, cc, [0.5, H + 23.6, 5.2], [1.05, H + 30.0, 5.6], 2.1, 1.35, 10);
  F.ell(copper, cc, 1.6, H + 36.6, 5.9, 0.95, 1.1, 0.95, true);
  F.limb(copper, cc, [1.62, H + 35.6, 5.92], [1.66, H + 40.0, 5.98], 0.5, 0.62, 8);
  F.limb(copper, cc, [1.66, H + 39.8, 5.98], [1.67, H + 41.0, 6.0], 0.85, 1.75, 12);
  F.cyl(copper, cc, 1.67, H + 41.05, 6.0, 2.1, 0.18);
  F.add(G.tor, copper, 1.67, H + 41.75, 6.0, 4.3, 4.3, 3.0, Math.PI / 2, 0, 0, cc);
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; F.cyl(copper, cc, 1.67 + Math.cos(a) * 2.1, H + 41.45, 6.0 + Math.sin(a) * 2.1, 0.07, 0.7, 'cyl6'); }
  F.add(G.cone8, flame, 1.67, H + 43.3, 6.0, 2.5, 4.4, 2.5, 0, 0, 0, fc);
  F.add(G.cone8, flame, 1.3, H + 42.5, 6.4, 1.2, 2.6, 1.2, 0.3, 0, 0.25, fc);
  F.add(G.cone8, flame, 2.0, H + 42.6, 5.6, 1.1, 2.4, 1.1, -0.3, 0, -0.2, fc);
  // the left arm bent round the tablet, its face turned out: JULY IV MDCCLXXVI
  const S2 = [0.1, H + 24.4, -4.6], E2 = [0.6, H + 19.6, -5.7], W2 = [2.3, H + 20.5, -5.5];
  F.limb(copper, cc, S2, E2, 1.4, 1.15, 10);
  F.limb(copper, cc, E2, W2, 1.1, 0.85, 10);
  F.ell(copper, cc, 2.4, H + 20.6, -5.5, 0.8, 0.95, 0.9, true);
  const Tm = new THREE.Matrix4().compose(_p.set(1.55, H + 21.6, -6.15), _q.setFromEuler(_e.set(0.12, 0.62, 0.1, 'YXZ')), _s.set(1, 1, 1));
  F.addM(G.box, copper, new THREE.Matrix4().makeScale(0.62, 7.2, 4.15).premultiply(Tm), cc);
  F.addM(G.plane, tablet, new THREE.Matrix4().makeRotationY(Math.PI / 2).scale(_s.set(4.0, 7.0, 1)).setPosition(0.32, 0, 0).premultiply(Tm), cc);
  return F;
}

// ---------- the Empire State Building ----------
// Ground at y = 0, metres at full size: the five-storey base, the setbacks, the shaft with its notched corners, the
// terraces up to the 86th-floor deck, the mast, the antenna. wall: the facade texture; solid / glow vertex-coloured.
export function empireState(b, { x, y, z, s = 1, ry = 0, wall, solid, glow, tex, wc = '#ffffff', dc = '#3a3e5a', crown = ['#ff3a4a', '#f4f6ff', '#4d7bff'] }) {
  const F = frame(b, x, y, z, s, ry);
  const slab = (w, d, y0, y1, col = wc) => F.addM(facadeGeo(w, y1 - y0, d, tex, 3.0, 3.8), wall, _m.makeTranslation(0, y0, 0), col);
  const tier = (w, d, nw, nd, y0, y1) => { slab(w, d - 2 * nd, y0, y1); slab(w - 2 * nw, d, y0, y1); };   // notched corners
  slab(128, 56, 0, 25);
  tier(100, 50, 8, 5, 25, 72);
  tier(86, 46, 8, 5, 72, 96);
  tier(72, 44, 7, 5, 96, 114);
  tier(58, 40, 6, 5, 114, 274);
  slab(22, 42.4, 114, 274);   // the middle bays standing out from the long faces
  tier(44, 30, 5, 4, 274, 300);
  tier(32, 24, 4, 3, 300, 314);
  slab(26, 20, 314, 320);
  F.block(solid, dc, 0, 320, 0, 27, 2.2, 21);   // the 86th-floor deck and its parapet
  // the mast: four buttresses round a drum, the lantern, the antenna with its beacon
  F.addM(frustum4(15, 19, 40), solid, _m.makeTranslation(0, 322, 0), dc);
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2 + Math.PI / 4; F.add(G.box, solid, Math.cos(a) * 8.2, 340, Math.sin(a) * 8.2, 3, 36, 3, 0, -a, 0, dc); }
  F.cyl(solid, dc, 0, 366, 0, 5.2, 8, 'cyl8');
  F.limb(solid, dc, [0, 370, 0], [0, 443, 0], 1.6, 0.5, 8);
  for (const yy of [384, 400, 416]) F.cyl(solid, dc, 0, yy, 0, 1.6, 1.2, 'cyl8');
  if (glow) {
    // floodlit crown: the terraces' parapets, the mast in bands of colour, the beacon
    for (const [w, d, yy] of [[58.6, 40.6, 274], [44.6, 30.6, 300], [32.6, 24.6, 314], [27.4, 21.4, 322]]) {
      F.box(glow, crown[1], 0, yy - 1.2, d / 2, w, 2.2, 0.3); F.box(glow, crown[1], 0, yy - 1.2, -d / 2, w, 2.2, 0.3);
      F.box(glow, crown[1], w / 2, yy - 1.2, 0, 0.3, 2.2, d); F.box(glow, crown[1], -w / 2, yy - 1.2, 0, 0.3, 2.2, d);
    }
    F.addM(frustum4(17.9, 19.1, 12), glow, _m.makeTranslation(0, 323, 0), crown[0]);
    F.addM(frustum4(16.6, 17.8, 12), glow, _m.makeTranslation(0, 336, 0), crown[1]);
    F.addM(frustum4(15.3, 16.5, 12), glow, _m.makeTranslation(0, 349, 0), crown[2]);
    F.cyl(glow, '#e8ecff', 0, 366, 0, 5.4, 6, 'cyl8');
    F.ell(glow, '#ff2a2a', 0, 444, 0, 2.2, 2.2, 2.2, true);
  }
  return F;
}
// a box standing on y = 0 whose faces tile tex in world units (like buildingGeo, without its random offset)
function facadeGeo(w, h, d, tex, cw, ch) {
  const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0);
  const uv = g.attributes.uv, tw = tex.cols * cw, th = tex.rows * ch;
  for (let f = 0; f < 6; f++) {
    const fw = f < 2 ? d : w;
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      if (f === 2 || f === 3) { uv.setXY(i, 0.002, 0.002); continue; }
      uv.setXY(i, (uv.getX(i) * fw) / tw, (uv.getY(i) * h) / th);
    }
  }
  return g;
}

// ---------- the Chrysler Building ----------
// Ground at y = 0, full size: the base and its setbacks, the white-brick shaft, the eagles at the 61st floor, the crown
// of seven stainless arches with the triangular windows lit in sunbursts, the needle.
const ARCH = new Map();
function archGeo(w, t) {   // a stainless arch panel: a rectangle w wide under a half disc, t thick, its foot on y = 0
  const key = `${w}:${t}`;
  if (!ARCH.has(key)) {
    const sh = new THREE.Shape(), r = w / 2;
    sh.moveTo(-r, 0); sh.lineTo(r, 0); sh.absarc(0, 0, r, 0, Math.PI, false); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 10 });
    g.translate(0, 0, -t / 2);
    ARCH.set(key, g);
  }
  return ARCH.get(key);
}
export function chrysler(b, { x, y, z, s = 1, ry = 0, wall, tex, steel, glow, solid, wc = '#ffffff', mc = '#c9ced8', gc = '#fff1c4', shaft = true }) {
  const F = frame(b, x, y, z, s, ry);
  if (shaft) {
    let y0 = 0;
    for (const [w, h] of [[62, 64], [52, 36], [46, 30], [40, 84]]) {
      F.addM(facadeGeo(w, h, w, tex, 2.4, 3.6), wall, _m.makeTranslation(0, y0, 0), wc);
      y0 += h;
    }
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {   // the radiator caps at the 31st floor, the eagles at the 61st
      F.add(G.box, steel, dx * 24.6, 100.8, dz * 24.6, 3.2, 1.6, 1.2, 0, -Math.atan2(dz, dx), 0, mc);
      F.add(G.box, steel, dx * 20.6, 211, dz * 20.6, 5.2, 1.6, 1.4, -0.35, -Math.atan2(dz, dx), 0, mc);
      F.add(G.cone4, steel, dx * 22.6, 211.4, dz * 22.6, 1.4, 2.6, 0.8, Math.PI / 2, -Math.atan2(dz, dx) + Math.PI / 2, 0, mc);
    }
  }
  let yy = 214;
  const tiers = [[34, 9], [30, 8.5], [26, 8], [22, 7.5], [18, 7], [14.5, 6.5], [11, 6]];
  tiers.forEach(([w, h], k) => {
    F.block(solid, '#2a2c3a', 0, yy, 0, w - 1.6, h + w / 2 - 1, w - 1.6);
    for (let f = 0; f < 4; f++) {
      const a = (f * Math.PI) / 2, ox = Math.sin(a) * w / 2, oz = Math.cos(a) * w / 2;
      F.add(archGeo(w, 0.7), steel, ox, yy + h, oz, 1, 1, 1, 0, a, 0, mc);
      F.add(G.box, steel, ox, yy + h / 2, oz, Math.abs(Math.cos(a)) * w + 0.7, h, Math.abs(Math.sin(a)) * w + 0.7, 0, 0, 0, mc);
      if (glow) for (let j = 0; j < 5; j++) {   // the triangular windows, fanned round the arch
        const t = Math.PI * (0.16 + (0.68 * j) / 4), r = w / 2 - 1.8;
        const lx = Math.cos(t) * r, ly = yy + h + Math.sin(t) * r * 0.92;
        F.add(G.cone4, glow, ox + Math.sin(a) * 0.42 + Math.cos(a) * lx, ly, oz + Math.cos(a) * 0.42 - Math.sin(a) * lx, 1.6, 2.6, 0.2, 0, a, t - Math.PI / 2, gc);
      }
    }
    yy += h * 0.92;
  });
  const top = yy + tiers[6][0] / 2 + 3;
  F.limb(steel, mc, [0, top - 6, 0], [0, 319, 0], 2.6, 0.12, 8);
  if (glow) F.ell(glow, '#ff3a3a', 0, 300, 0, 0.6, 0.6, 0.6, true);
  return F;
}

// ---------- One World Trade Center ----------
// The cube of the base, then eight long triangles that turn its square through 45° as the tower rises, the parapet
// and the spire. faces: glass (vertex-coloured, the faces toward the sunset brighter).
export function oneWTC(b, { x, y, z, s = 1, ry = 0, glass, solid, glow, sun = new THREE.Vector3(-0.3, 0, -1), lo = '#26304e', hi = '#c88a8a' }) {
  const F = frame(b, x, y, z, s, ry);
  F.addM(facadeCube(61, 57), glass, _m.identity(), lo);
  const a = 30.5, c = 30.5, H0 = 57, H1 = 417;
  const B = [[a, a], [-a, a], [-a, -a], [a, -a]], T = [[c, 0], [0, c], [-c, 0], [0, -c]];
  const pos = [], col = [], cL = new THREE.Color(lo), cH = new THREE.Color(hi), tmp = new THREE.Color(), n = new THREE.Vector3();
  const sd = sun.clone().setY(0).normalize();
  const tri = (p, q, r) => {
    const v1 = new THREE.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]), v2 = new THREE.Vector3(r[0] - p[0], r[1] - p[1], r[2] - p[2]);
    n.crossVectors(v1, v2).normalize();
    tmp.copy(cL).lerp(cH, Math.max(0, n.x * sd.x + n.z * sd.z) ** 2);
    for (const v of [p, q, r]) { pos.push(...v); col.push(tmp.r, tmp.g, tmp.b); }
  };
  for (let i = 0; i < 4; i++) {
    const b0 = B[i], b1 = B[(i + 1) % 4], t1 = T[(i + 1) % 4], t0 = T[i];
    // an upright facet on each edge of the base, an inverted one under each edge of the turned top
    tri([b0[0], H0, b0[1]], [t1[0], H1, t1[1]], [b1[0], H0, b1[1]]);
    tri([b0[0], H0, b0[1]], [t0[0], H1, t0[1]], [t1[0], H1, t1[1]]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  F.addM(g, glass, _m.identity(), null);
  F.box(solid, '#2a3048', 0, H1 + 2, 0, 43.4, 4, 43.4, Math.PI / 4);
  F.cyl(solid, '#c8ccd8', 0, H1 + 6, 0, 7, 4, 'cyl8');
  F.limb(solid, '#d8dce8', [0, H1 + 8, 0], [0, 541, 0], 2.2, 0.5, 8);
  if (glow) {
    for (let k = 0; k < 6; k++) F.cyl(glow, '#e8f0ff', 0, H1 + 14 + k * 18, 0, 2.6 - k * 0.3, 0.8, 'cyl8');
    F.ell(glow, '#ffffff', 0, 542, 0, 2.4, 2.4, 2.4, true);
  }
  return F;
}
function facadeCube(w, h) { const g = new THREE.BoxGeometry(w, h, w); g.translate(0, h / 2, 0); return g; }

// ---------- more of the skyline ----------
// The Woolworth Building's Gothic crown, the Citigroup Center's slanted top, 432 Park Avenue's needle, One Vanderbilt
// tapering to its spire, 30 Hudson Yards with the Edge's deck sticking out. Ground at y = 0, full size, mat textured.
export function woolworth(b, { x, y, z, s = 1, ry = 0, mat, tex, solid, glow }) {
  const F = frame(b, x, y, z, s, ry);
  F.addM(facadeGeo(60, 100, 40, tex, 3, 3.8), mat, _m.identity(), '#e8e0d8');
  F.addM(facadeGeo(26, 130, 26, tex, 3, 3.8), mat, _m.makeTranslation(0, 100, 0), '#f0e8e0');
  F.addM(facadeGeo(20, 22, 20, tex, 3, 3.8), mat, _m.makeTranslation(0, 230, 0), '#f0e8e0');
  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) F.add(G.cone4, solid, dx * 10, 262, dz * 10, 3, 14, 3, 0, 0, 0, '#3a6a5a');
  F.add(G.cone4, solid, 0, 268, 0, 20, 32, 20, 0, 0, 0, '#3e7262');
  F.limb(solid, '#3e7262', [0, 282, 0], [0, 300, 0], 1.2, 0.2, 6);
  if (glow) { F.box(glow, '#ffe0a0', 0, 251, 10.2, 18, 1.4, 0.3); F.box(glow, '#ffe0a0', 10.2, 251, 0, 0.3, 1.4, 18); F.box(glow, '#ffe0a0', -10.2, 251, 0, 0.3, 1.4, 18); F.box(glow, '#ffe0a0', 0, 251, -10.2, 18, 1.4, 0.3); }
  return F;
}
export function citigroup(b, { x, y, z, s = 1, ry = 0, mat, tex, solid, glow }) {
  const F = frame(b, x, y, z, s, ry);
  F.addM(facadeGeo(48, 248, 48, tex, 3, 3.8), mat, _m.identity(), '#f4f4f8');
  const sh = new THREE.Shape(); sh.moveTo(-24, 0); sh.lineTo(24, 0); sh.lineTo(24, 2); sh.lineTo(-24, 44); sh.closePath();   // the 45° crown
  const g = new THREE.ExtrudeGeometry(sh, { depth: 48, bevelEnabled: false }); g.translate(0, 0, -24);
  F.addM(g, solid, _m.makeTranslation(0, 248, 0), '#dcdce4');
  if (glow) F.add(G.box, glow, 0, 248 + 23, 0, 66, 0.8, 48.4, 0, 0, -Math.PI / 4 + 0.03, '#fff0d8');
  return F;
}
export function park432(b, { x, y, z, s = 1, ry = 0, solid, glow }) {
  const F = frame(b, x, y, z, s, ry);
  F.block(solid, '#d8d4cc', 0, 0, 0, 28, 426, 28);
  if (glow) for (let yy = 20; yy < 420; yy += 25) for (const [dx, dz, w, d] of [[0, 14.1, 26, 0.2], [14.1, 0, 0.2, 26]]) F.box(glow, pick(['#fff0d0', '#ffe0a8', '#202436']), dx, yy, dz, w, 3.2, d);
  return F;
}
export function vanderbilt(b, { x, y, z, s = 1, ry = 0, mat, tex, solid, glow }) {
  const F = frame(b, x, y, z, s, ry);
  let y0 = 0;
  for (const [w, h] of [[64, 120], [54, 110], [44, 90], [32, 60]]) { F.addM(facadeGeo(w, h, w * 0.8, tex, 3, 3.8), mat, _m.makeTranslation(0, y0, 0), '#f0e6dc'); y0 += h; }
  F.add(G.cone4, solid, 0, y0 + 14, 0, 30, 28, 24, 0, 0, 0, '#c8b8a8');
  F.limb(solid, '#d8d4cc', [0, y0 + 26, 0], [0, 427, 0], 1.6, 0.3, 6);
  if (glow) F.box(glow, '#fff4dc', 0, y0 + 2, 0, 30, 1.2, 24);
  return F;
}
export function hudsonYards(b, { x, y, z, s = 1, ry = 0, mat, tex, solid, glow }) {
  const F = frame(b, x, y, z, s, ry);
  F.addM(facadeGeo(58, 300, 40, tex, 3, 3.8), mat, _m.identity(), '#c8d4f0');
  F.addM(facadeGeo(44, 87, 34, tex, 3, 3.8), mat, _m.makeTranslation(-4, 300, 0), '#c8d4f0');
  const sh = new THREE.Shape(); sh.moveTo(0, -12); sh.lineTo(0, 12); sh.lineTo(24, 0); sh.closePath();   // the Edge, out over the street
  const g = new THREE.ExtrudeGeometry(sh, { depth: 2, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
  F.addM(g, solid, _m.makeTranslation(29, 330, 0), '#9aa4c0');
  if (glow) F.add(G.box, glow, 39, 333, 0, 20, 0.6, 0.6, 0, 0, 0, '#fff4dc');
  return F;
}
