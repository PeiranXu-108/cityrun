// Four of Los Angeles's landmark scenes (la.js ROUTE; the rest are in la_landmarks.js, la_beach.js and la_sights.js):
// the Getty Center on its hilltop over the 405, travertine and white enamel catching the last of the sun, its tram
// climbing to it, the azaleas in the Central Garden's pool; the Farmers Market's white clock tower and its stalls,
// The Grove's green trolley rolling along beside you and its fountain dancing; the Stahl House cantilevered off the
// Hollywood Hills over the lights of the basin, the Chemosphere on its column across the road; the Hollywood Bowl,
// the seats falling away from the road to the shell, its rings of light, the orchestra playing.
// Big buildings stand back from the track and well ahead; anything over the track is 11 m up or more.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, shade, CHUNK_LEN, rand, randi, pick, chance, clamp, smooth } from '../core.js';
import { farGround, RING } from './common.js';
import { frame, frustum4, figure } from './ny_icons.js';
import { beam } from './tokyo_kit.js';
import { puffs } from './taipei_towers.js';
import { SANS, SERIF, DECO, SCRIPT, X0, STUCCO, PASTEL, HOLLY_SIGNS, DOWNTOWN_SIGNS, GI, face, hipRoof } from './la_kit.js';

const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
const I4 = new THREE.Matrix4();
function travTex() {   // the Getty's cleft travertine: squares of 76 cm, warm, pitted, each its own shade
  return canvasTex(256, 256, (g, w, h) => {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { g.fillStyle = `rgb(${randi(214, 232)},${randi(196, 212)},${randi(160, 178)})`; g.fillRect(c * 64, r * 64, 64, 64); }
    for (let k = 0; k < 1400; k++) { g.fillStyle = `rgba(${pick(['120,100,70', '90,74,52', '255,250,240'])},${rand(0.1, 0.35)})`; g.fillRect(rand(0, w), rand(0, h), rand(1, 4), rand(1, 2)); }
    g.fillStyle = 'rgba(90,74,56,0.5)'; for (let k = 0; k <= 4; k++) { g.fillRect(0, k * 64 - 1, w, 2); g.fillRect(k * 64 - 1, 0, 2, h); }
  });
}
function panelTex() {   // the off-white enamelled aluminium panels: a 76 cm grid, the joints dark
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#eceae4'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(60,60,64,0.55)'; for (let k = 0; k <= 4; k++) { g.fillRect(0, k * 32 - 1, w, 2); g.fillRect(k * 32 - 1, 0, 2, h); }
  });
}
// a convex quad a-b-c-d (points [x, y, z]) as two triangles, turned to face away from the point inside
function quad4(bt, mat, pts, inside, col) {
  const V = pts.map((p) => new THREE.Vector3(...p)), n = new THREE.Vector3().subVectors(V[1], V[0]).cross(new THREE.Vector3().subVectors(V[2], V[0]));
  const c = V.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(0.25);
  const order = n.dot(c.sub(new THREE.Vector3(...inside))) < 0 ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(order.flatMap((i) => pts[i]), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(order.flatMap((i) => [pts[i][0] / 4, pts[i][2] / 4]), 2)); g.computeVertexNormals();
  bt.addM(g, mat, I4, col);
}
// a hill with a flat top: its foot the rectangle B (x0, z0, x1, z1) on the ground, its top T up at h
function mesa(bt, B, Tp, h, col) {
  const b = [[B[0], 0, B[1]], [B[2], 0, B[1]], [B[2], 0, B[3]], [B[0], 0, B[3]]], t = [[Tp[0], h, Tp[1]], [Tp[2], h, Tp[1]], [Tp[2], h, Tp[3]], [Tp[0], h, Tp[3]]];
  const inside = [(Tp[0] + Tp[2]) / 2, h / 2, (Tp[1] + Tp[3]) / 2];
  quad4(bt, VC.solid, t, [inside[0], -10, inside[2]], col);
  for (let k = 0; k < 4; k++) quad4(bt, VC.solid, [b[k], b[(k + 1) % 4], t[(k + 1) % 4], t[k]], inside, col);
}

export function laHills(K, H) {
  const extras = { live: [], movers: [] };
  const trav = std({ map: travTex(), vertexColors: true, roughness: 0.88 });
  const panel = std({ map: panelTex(), vertexColors: true, roughness: 0.35, metalness: 0.15 });
  const led = [0, 1, 2].map(() => basic({ color: hdr('#ffffff', 1.2), side: THREE.DoubleSide }));   // the Bowl's shell, its rings running through the colours
  const jetMat = basic({ color: hdr('#e8f2ff', 1.1), transparent: true, opacity: 0.75, depthWrite: false });   // the Grove's fountain
  const gold = '#d8b048';

  const lights = (b, x0, y0, x1, y1, z, n, sag) => {   // a string of bulbs from (x0, y0) to (x1, y1) at z, sagging between
    let p = null;
    for (let k = 0; k <= n; k++) {
      const t = k / n, q = [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * sag, z];
      if (p) beam(b, VC.solid, ...p, ...q, 0.015, '#1a1a1a');
      if (k > 0 && k < n) b.sph(VC.glow, hdr('#ffd890', 2.4), q[0], q[1] - 0.08, z, 0.07, true);
      p = q;
    }
  };

  // ---------- the Getty Center ----------
  const G_H = 22;   // the hilltop
  const hillAt = (x, z) => G_H * Math.min(1, Math.max(0, (x - 13) / 33), Math.max(0, (-1 - z) / 15), Math.max(0, (z + 79) / 15));
  const tramPath = [new THREE.Vector3(17, 4.5, -7), new THREE.Vector3(51, G_H + 4.4, -46)];
  const tram = () => {   // the tram: two white cars coupled, rounded at the ends, their windows lit, on the guideway (it moves: update)
    const t = new Batcher();
    for (const z of [-4.3, 4.3]) {
      t.box(VC.solid, '#f4f4f0', 0, 1.5, z, 2.8, 2.6, 7.6); t.add(G.sph, VC.solid, 0, 1.5, z + Math.sign(z) * 3.8, 2.8, 2.6, 1.6, 0, 0, 0, '#f4f4f0');
      for (const e of [-1, 1]) t.box(VC.glow, hdr('#ffe8c0', 1.1), e * 1.42, 1.9, z, 0.04, 1.0, 6.4);
      t.box(VC.solid, '#3a3a40', 0, 0.15, z, 2.4, 0.3, 7.0);
    }
    t.box(VC.glow, hdr('#fff4d0', 2.2), 0, 1.4, -8.85, 1.2, 0.2, 0.06); t.box(VC.glow, hdr('#ff2a2a', 1.4), 0, 1.4, 8.85, 1.2, 0.2, 0.06);
    const g = t.build();
    const d = tramPath[1].clone().sub(tramPath[0]);
    g.rotation.order = 'YXZ'; g.rotation.set(Math.atan2(d.y, Math.hypot(d.x, d.z)), Math.atan2(-d.x, -d.z), 0);
    g.userData.move = (tt) => { const c = (tt / 46) % 1, u = smooth(clamp(c < 0.5 ? (c - 0.08) / 0.34 : (0.92 - c) / 0.34, 0, 1)); g.position.lerpVectors(tramPath[0], tramPath[1], u); };
    g.userData.move(0); extras.movers.push(g);
    return g;
  };
  const pavilion = (b, x, z, w, d, h, { mat = trav, band = true, slots = 2 } = {}) => {   // one of the pavilions: its cladding, a band of white panels round its top, slots of glass lit within
    b.addM(K.tiledBox(w, h, d, 3.04), mat, T(x, G_H + h / 2, z), '#ffffff');
    if (band) b.addM(K.tiledBox(w + 0.3, 2.4, d + 0.3, 3.04), panel, T(x, G_H + h - 1.2, z), '#ffffff');
    for (let k = 0; k < slots; k++) b.box(VC.glow, hdr('#ffe2b8', 0.8), x - w / 2 - 0.02, G_H + h * 0.45, z - d / 2 + (d * (k + 1)) / (slots + 1), 0.04, h * 0.5, 1.6);
    b.box(VC.solid, '#b8b0a4', x, G_H + h + 0.15, z, w + 0.6, 0.3, d + 0.6);
  };
  const getty = () => {
    const b = new Batcher();
    // the right: the hill over the frontage road, the museum along its top; the tram's guideway up its face, the stations at
    // either end; the Central Garden at the hill's brow; the stone sign by the road
    K.kerbLane(b, 1, { x1: 12.4 }); farGround(b, 1, '#6a6a48');
    mesa(b, [13, -1, 150, -79], [46, -16, 150, -64], G_H, '#6a6a46');
    for (let k = 0; k < 90; k++) { const x = rand(14, 46), z = -rand(3, 77), y = hillAt(x, z); b.add(G.sphLow, VC.solid, x, y + 0.3, z, rand(1.2, 2.8), rand(0.7, 1.5), rand(1.2, 2.8), 0, rand(0, 3), 0, pick(['#5a6a3a', '#6a7a44', '#7a7a4a', '#4e6236', '#8a7a52'])); }   // the chaparral, sage and the dry grass
    for (let k = 0; k < 5; k++) { const x = rand(18, 44), z = -rand(14, 66); K.fig(b, x, z, rand(0.5, 0.72), { y: hillAt(x, z) }); }
    for (let k = 0; k < 16; k++) { const t = k / 15, x = 15 + t * 30, z = -18 - (k % 2 ? 6 : 0) - t * 34; b.add(G.box, VC.solid, x, hillAt(x, z) + 0.06, z, 3.2, 0.12, 1.4, 0, -0.5 + (k % 2) * 1.0, 0.55, '#c8bca4'); }   // the path zigzagging up
    // the buildings on top: the round entrance hall, the pavilions in travertine and panels, the curved wall, the research institute
    const rx = 60, rz = -38;
    b.cyl(VC.solid, '#e8dcc4', rx, G_H + 1.5, rz, 7.4, 3, 'cyl'); b.cyl(VC.glow, hdr('#ffe2b8', 0.9), rx, G_H + 6.5, rz, 7.1, 7, 'cyl'); b.cyl(VC.solid, '#eceae4', rx, G_H + 10.4, rz, 8.2, 0.8, 'cyl');
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; b.box(VC.metal, '#d8dcdc', rx + Math.cos(a) * 7.15, G_H + 6.5, rz + Math.sin(a) * 7.15, 0.12, 7, 0.12); }
    b.add(G.box, VC.solid, rx - 9, G_H + 4.6, rz, 6, 0.3, 9, 0, 0, -0.08, '#eceae4');   // its canopy toward the tram
    pavilion(b, 84, -26, 22, 16, 12, { slots: 3 }); pavilion(b, 92, -48, 20, 18, 14, { mat: panel, band: false }); pavilion(b, 70, -58, 16, 12, 10); pavilion(b, 112, -34, 24, 18, 12, { slots: 3 });
    const arc = new THREE.CylinderGeometry(19, 19, 9, 18, 1, true, -2.2, 1.3);   // the curved wall of travertine
    b.addM(arc, VC.solid, T(84, G_H + 4.5, -40), '#e4d6bc'); b.addM(new THREE.CylinderGeometry(18.6, 18.6, 9, 18, 1, true, -2.2, 1.3), VC.solid, T(84, G_H + 4.5, -40), '#d8caae');
    b.cyl(VC.solid, '#e4d6bc', 128, G_H + 5, -58, 11, 10, 'cyl');
    b.cyl(VC.solid, '#eceae4', 128, G_H + 10.4, -58, 11.4, 0.8, 'cyl'); b.cyl(VC.glow, hdr('#ffe2b8', 0.6), 128, G_H + 5, -58, 11.05, 1.4, 'cyl');
    for (const [x, z] of [[100, -18], [76, -14], [104, -62], [66, -24]]) K.fig(b, x, z, rand(0.6, 0.8), { y: G_H });
    for (let k = 0; k < 6; k++) b.add(G.sphLow, VC.solid, rand(56, 64), G_H + 3, -rand(18, 26), 0.9, 6, 0.9, 0, 0, 0, '#2a4a2a');   // cypresses
    // the Central Garden: its round pool at the brow, the rings of azaleas in it; the bougainvillea on their steel arbors
    const cx = 54, cz = -60;
    b.cyl(VC.solid, '#c8c0b0', cx, G_H + 0.3, cz, 7, 0.6, 'cyl'); b.add(G.cyl, K.water, cx, G_H + 0.62, cz, 13.4, 0.02, 13.4, 0, 0, 0, 0xffffff);
    for (const [r, n] of [[5.4, 22], [3.8, 16], [2.2, 10]]) for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; b.add(G.sphLow, VC.solid, cx + Math.cos(a) * r, G_H + 0.9, cz + Math.sin(a) * r, 0.9, 0.6, 0.9, 0, 0, 0, pick(['#e8307a', '#ff5aa0', '#c8206a', '#f4a0c8'])); }
    for (const [x, z] of [[48, -50], [50, -44], [56, -50], [60, -66]]) {
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; b.add(G.box, VC.metal, x + Math.cos(a) * 0.6, G_H + 1.2, z + Math.sin(a) * 0.6, 0.05, 2.6, 0.05, Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4, '#5a4a3a'); }
      b.add(G.sphLow, VC.solid, x, G_H + 2.9, z, 3.0, 1.0, 3.0, 0, 0, 0, '#c8206a');
    }
    // the tram's guideway on its columns, the two stations
    const [A, Bp] = tramPath, n = 10;
    for (let k = 0; k < n; k++) { const p0 = A.clone().lerp(Bp, k / n), p1 = A.clone().lerp(Bp, (k + 1) / n); const F = frame(b, 0, 0, 0, 1, 0); F.beam(VC.solid, '#d8d4cc', [p0.x, p0.y - 0.5, p0.z], [p1.x, p1.y - 0.5, p1.z], 0.7, 2.0); }
    for (let k = 1; k < n; k++) { const p = A.clone().lerp(Bp, k / n), y0 = hillAt(p.x, p.z); if (p.y - 1 - y0 > 0.4) b.cyl(VC.solid, '#c8c4bc', p.x, (p.y - 0.9 + y0) / 2, p.z, 0.4, p.y - 0.9 - y0, 'cyl8'); }
    for (const [p, y] of [[A, 0], [Bp, G_H]]) { for (const [dx, dz] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) b.cyl(VC.metal, '#c8ccd0', p.x + dx, (y + p.y + 2.6) / 2, p.z + dz, 0.1, p.y + 2.6 - y, 'cyl8'); b.box(VC.solid, '#eceae4', p.x, p.y + 2.8, p.z, 5.6, 0.25, 6.4); b.box(VC.glow, hdr('#ffe8c8', 0.9), p.x, p.y + 2.6, p.z, 4.4, 0.04, 5.2); }
    b.block(VC.solid, '#c8c4bc', A.x, 0, A.z, 4.4, A.y - 0.8, 6);
    const sg = frame(b, 13.0, 0, -14, 1, face(1));   // the stone sign by the road
    sg.addM(K.tiledBox(8, 1.6, 0.8, 3.04), trav, T(0, 0.8, -0.4), '#ffffff');
    K.sign(sg, 'THE GETTY', { w: 768, h: 128, color: '#3a3430', font: SERIF, weight: 700, size: 0.6, k: 0.9 }, 0, 0.9, 0.02, 6, 0.9, 1);
    for (let z = 20; z < 78; z += rand(14, 18)) K.lamp(b, 7.0, -z, 1);
    K.carRow(b, 5.25, 0, CHUNK_LEN, { p: 0.4, lit: true });
    K.crowd(b, 8, 12, 2, 16, 5, { camera: true });
    // the left: the 405 coming the other way, its wall; the Santa Monica Mountains climbing beyond it, a few lights on them
    farGround(b, -1, '#6a6a48');
    H.carriageway(b, -1, { jam: rand(0.75, 0.92) });
    H.slope(b, -110, 38, -22, 0, '#5e6044', { scrub: 34 });
    b.block(VC.solid, '#5e6044', -150, 0, -40, 80, 38, CHUNK_LEN);
    for (let k = 0; k < 9; k++) { const x = rand(30, 100), y = ((x - 22) / 88) * 38, z = -rand(6, 74); b.addM(K.tiledBox(8, 6, 6, 2.5), K.stuccoMat, T(-x, y + 1.2, z), pick(STUCCO)); b.box(VC.glow, K.glass(0.8, true), -x + 4.02, y + 2.6, z, 0.04, 1.4, 3); b.box(VC.solid, '#7a3a2a', -x, y + 4.3, z, 8.6, 0.3, 6.6); }
    for (let k = 0; k < 4; k++) { const x = rand(26, 96); K.gum(b, -x, -rand(4, 76), rand(0.7, 1.0), { y: ((x - 22) / 88) * 38 }); }
    return { b, extra: [tram()] };
  };

  // ---------- the Farmers Market · The Grove ----------
  const STALLS = ['PRODUCE', 'MEATS', 'BAKERY', 'DONUTS', 'GUMBO', 'COFFEE', 'CANDY', 'FLOWERS', 'TACOS', 'CHEESE'];
  const shed = (b, z0, z1) => {   // a row of the market's stalls under one roof: white walls trimmed in green, the counters and their goods, a sign over each, striped awnings
    const L = z1 - z0, zc = -(z0 + z1) / 2, x0 = 22, D = 12;
    b.addM(K.tiledBox(D, 4.4, L, 2.5), K.stuccoMat, T(x0 + D / 2, 2.2, zc), '#f4f0e6');
    b.box(VC.solid, '#2a6a4a', x0 + D / 2, 4.6, zc, D + 1.6, 0.4, L + 0.6);
    for (let z = z0 + 0.4; z < z1 - 3.5; z += 4) {
      const c = -(z + 2);
      b.box(VC.glow, hdr('#ffe8c8', 0.9), x0 - 0.03, 2.0, c, 0.04, 2.6, 3.6);
      b.block(VC.solid, '#6a4a2a', x0 - 0.6, 0, c, 1.0, 1.0, 3.6);
      K.board(b, K.goodsRects[pick([GI.fruit, GI.pandulce, GI.cafe, GI.grocery])], x0 - 1.12, 1.4, c, 3.2, 0.9, 1, 0, -Math.PI / 2, 0);
      K.sign(b, pick(STALLS), { w: 512, h: 112, color: '#f4f0e6', bg: '#2a6a4a', font: SANS, weight: 700, size: 0.55, k: 1.0 }, x0 - 0.05, 3.7, c, 3.2, 0.62, 1, 0, -Math.PI / 2, 0);
      for (let k = 0; k < 6; k++) b.add(G.box, VC.solid, x0 - 1.1, 3.3, c - 1.5 + k * 0.6, 2.2, 0.05, 0.6, 0, 0, 0.32, k % 2 ? '#f4f0e6' : '#2a8a5a');
      K.person(b, x0 - 0.2, c + rand(-1, 1), { ry: Math.PI / 2, bag: false });
    }
  };
  const trolley = () => {   // the Grove's trolley: green and cream, the lower deck enclosed, the upper deck open under its canopy, people aboard (it moves: update)
    const t = new Batcher(), g0 = '#1f5a3a', cream = '#efe6c8';
    t.box(VC.solid, g0, 0, 1.9, 0, 2.6, 2.6, 10.4); t.box(VC.solid, cream, 0, 2.3, 0, 2.62, 0.9, 10.2);
    for (const e of [-1, 1]) for (let k = 0; k < 6; k++) { t.box(VC.glow, hdr('#ffe8c0', 0.75), e * 1.32, 2.35, -4 + k * 1.6, 0.04, 0.7, 1.2); t.box(VC.solid, cream, e * 1.33, 2.35, -4.75 + k * 1.6, 0.04, 0.8, 0.12); }
    t.box(VC.solid, cream, 0, 3.25, 0, 2.7, 0.2, 10.6);
    for (const e of [-1, 1]) { t.box(VC.metal, '#c8a050', e * 1.3, 4.15, 0, 0.06, 0.06, 10.4); for (let k = 0; k < 9; k++) t.box(VC.metal, '#c8a050', e * 1.3, 3.75, -4.8 + k * 1.2, 0.05, 0.9, 0.05); for (const z of [-4.9, 0, 4.9]) t.box(VC.metal, '#c8a050', e * 1.2, 4.4, z, 0.08, 2.2, 0.08); }
    t.box(VC.solid, g0, 0, 5.55, 0, 2.8, 0.14, 10.6);
    t.box(VC.glow, hdr('#2e3a4e', 0.9), 0, 2.4, -5.22, 2.2, 1.0, 0.04); t.box(VC.glow, hdr('#fff4d0', 2.4), 0, 1.2, -5.23, 0.5, 0.3, 0.04);
    for (const zz of [-3.2, 3.2]) for (const e of [-1, 1]) t.cyl(VC.solid, '#141414', e * 0.72, 0.45, zz, 0.42, 0.2, 'cyl8', 0, Math.PI / 2);
    for (let k = 0; k < 8; k++) K.person(t, rand(-0.8, 0.8), rand(-4.2, 4.2), { seated: true, y: 3.0, ry: Math.PI, bag: false });
    K.sign(t, 'THE GROVE · FARMERS MARKET', { w: 768, h: 80, color: '#ffd890', bg: '#141414', font: SANS, weight: 700, size: 0.5, k: 1.4 }, 0, 3.0, -5.26, 2.2, 0.3, 1);
    const g = t.build(); g.position.x = -8.0;
    g.userData.move = (tt) => { const c = (tt / 70) % 1, u = smooth(clamp(c < 0.5 ? (c - 0.06) / 0.38 : (0.94 - c) / 0.38, 0, 1)); g.position.z = -8 - 64 * u; };
    g.userData.move(0); extras.movers.push(g);
    return g;
  };
  const fountainJets = (x, z) => {   // the fountain's jets, rising and falling in turn (update)
    const n = 17, m = new THREE.InstancedMesh(G.cone8, jetMat, n), M = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion();
    m.frustumCulled = false;
    m.userData.move = (tt) => {
      for (let k = 0; k < n; k++) {
        const a = (k / (n - 1)) * Math.PI * 2, r = k === n - 1 ? 0 : 3.6, h = k === n - 1 ? 5 + 3 * Math.max(0, Math.sin(tt * 0.9)) : 0.6 + 3.2 * Math.pow(0.5 + 0.5 * Math.sin(tt * 1.7 - a * 2), 2);
        m.setMatrixAt(k, M.compose(p.set(x + Math.cos(a) * r, 0.7 + h / 2, z + Math.sin(a) * r), q, s.set(0.26, h, 0.26)));
      }
      m.instanceMatrix.needsUpdate = true;
    };
    m.userData.move(0); extras.movers.push(m);
    return m;
  };
  const grove = () => {
    const b = new Batcher();
    // the right: the Farmers Market: its two rows of stalls, the plaza between with its tables and umbrellas under strings of lights, the clock tower
    K.kerbLane(b, 1, { x1: 12 }); farGround(b, 1, '#7a6a52'); K.pave(b, 24, -40, 24, CHUNK_LEN, 0.035);
    shed(b, 2, 34); shed(b, 52, 78);
    const CT = frame(b, 19, 0, -44, 1, face(1));
    CT.addM(K.tiledBox(4, 18, 4, 2.5), K.stuccoMat, T(0, 9, 0), '#f4f0e8'); CT.box(VC.solid, '#d8d0c0', 0, 0.6, 0, 4.4, 1.2, 4.4);
    for (const [ex, ez] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) CT.box(VC.solid, '#e8e2d4', ex * 1.95, 9, ez * 1.95, 0.4, 18, 0.4);
    for (const [ox, oz, ry] of [[0, 2.03, 0], [-2.03, 0, -Math.PI / 2], [2.03, 0, Math.PI / 2]]) {
      const C = frame(b, ...CT.at(ox, 15.4, oz).toArray(), 1, face(1) + ry);
      C.add(G.cyl, VC.glow, 0, 0, 0.02, 2.6, 0.06, 2.6, Math.PI / 2, 0, 0, hdr('#f4f8f0', 1.3)); C.add(RING, VC.metal, 0, 0, 0.05, 1.35, 1.35, 1.35, 0, 0, 0, '#2a6a4a');
      C.add(G.box, VC.solid, 0.25, 0.3, 0.07, 0.08, 0.8, 0.03, 0, 0, -0.8, '#1a1a20'); C.add(G.box, VC.solid, -0.2, 0.15, 0.08, 0.07, 0.55, 0.03, 0, 0, 1.0, '#1a1a20');
    }
    K.vsign(CT, 'FARMERS MARKET', { color: '#d81e1e', bg: '#f4f0e8', font: SANS, k: 1.05 }, 0, 7.2, 2.04, 1.3, 10.4, 1, 0, 0, 0);
    CT.add(G.cone4, VC.solid, 0, 19.6, 0, 6.2, 3.2, 6.2, 0, Math.PI / 4, 0, '#2a6a4a'); CT.cyl(VC.metal, '#c8a050', 0, 22.0, 0, 0.05, 1.8, 'cyl6'); CT.box(VC.metal, '#c8a050', 0.3, 22.6, 0, 0.9, 0.12, 0.04);
    for (let k = 0; k < 6; k++) { const x = rand(14, 20), z = -rand(36, 50); if (Math.abs(z + 44) < 3 && x > 16) continue; b.cyl(VC.metal, '#5a5a5e', x, 1.2, z, 0.04, 2.4, 'cyl6'); b.add(G.cone8, VC.solid, x, 2.55, z, 2.6, 0.5, 2.6, 0, 0, 0, pick(['#2a6a4a', '#f4f0e6', '#c8302a'])); b.block(VC.solid, '#e8e4dc', x, 0, z, 0.9, 0.75, 0.9); K.person(b, x + 0.8, z, { seated: true, ry: Math.PI / 2 }); }
    for (const z of [8, 24, 60, 72]) { lights(b, 12.4, 4.3, 22, 4.3, -z, 8, 0.4); b.cyl(VC.metal, '#3a3a3e', 12.4, 2.2, -z, 0.05, 4.4, 'cyl6'); }
    for (const z of [-35.4, -40.6]) b.cyl(VC.metal, '#3a3a3e', 13.0, 1.8, z, 0.06, 3.6, 'cyl6'); b.box(VC.solid, '#2a6a4a', 13.0, 3.2, -38, 0.08, 0.8, 5.8);
    K.sign(b, 'FARMERS MARKET · 3RD & FAIRFAX', { w: 768, h: 96, color: '#f4f0e6', bg: '#2a6a4a', font: SANS, weight: 700, size: 0.5, k: 1.0 }, 12.9, 3.2, -38, 5.6, 0.7, 1, 0, -Math.PI / 2, 0);
    K.crowd(b, 12.6, 20, 4, 76, 14, { bag: true });
    // the left: The Grove: the trolley's rails and the trolley, the dancing fountain and its gilded figure, the shopfronts, the strings of lights
    K.pave(b, -24, -40, 40.5, CHUNK_LEN, 0.035);
    for (const e of [-0.72, 0.72]) b.box(VC.metal, '#8a8e94', -8.0 + e, 0.05, -40, 0.08, 0.04, CHUNK_LEN);
    b.box(VC.solid, '#5a5650', -8.0, 0.04, -40, 2.2, 0.01, CHUNK_LEN);
    const fx = -16.2, fz = -40;
    b.cyl(VC.solid, '#e8e2d4', fx, 0.35, fz, 5.2, 0.7, 'cyl'); b.add(G.cyl, K.water, fx, 0.72, fz, 10, 0.02, 10, 0, 0, 0, 0xffffff);
    b.addM(frustum4(0.8, 1.2, 2.2), VC.solid, T(fx, 0.7, fz), '#d8d0c4');
    const sp = frame(b, fx, 2.9, fz, 1.8, Math.PI / 2); figure(sp, VC.metal, gold, { arms: 'out', cloak: true });
    for (const e of [-1, 1]) sp.add(G.cone4, VC.metal, -0.2, 1.75, e * 0.5, 0.1, 1.5, 0.7, e * 1.1, 0, 0.3, gold);   // its wings
    extras.live.push(puffs(Array.from({ length: 8 }, (_, k) => [fx + Math.cos(k) * 3.4, 3.2, fz + Math.sin(k) * 3.4]), { size: 0.9, grow: 1.4, rise: -2.5, drift: 0.6, life: 1.8, n: 4, color: '#f4f8ff', opacity: 0.28 }));
    for (const [z0, z1] of [[0, 48], [68, 79]]) for (let z = z0; z < z1 - 5;) {   // the shopfronts, a cinema's tower among them
      const w = Math.min(rand(9, 14), z1 - z); K.shop(b, -1, 22, -(z + w / 2), w, { style: pick(['deco', 'mission', 'stucco', 'deco']), floors: 2, sign: pick([...DOWNTOWN_SIGNS, ...HOLLY_SIGNS]) }); z += w + 0.1;
    }
    K.theatre(b, -1, 22, -58, 18, { name: 'CINEMA', floors: 3 });
    for (const z of [12, 30, 52, 70]) { lights(b, -9.6, 6.2, -22, 6.2, -z, 10, 0.6); b.cyl(VC.metal, '#3a3a3e', -9.6, 3.1, -z, 0.06, 6.2, 'cyl6'); }
    for (let z = 14; z < 76; z += 20) K.lamp(b, -10.2, -z, -1, { kind: 'deco' });
    for (let k = 0; k < 6; k++) { const z = -rand(6, 74); if (Math.abs(z - fz) < 7) continue; b.block(VC.solid, '#c8c0b4', -20.6, 0, z, 1.4, 0.7, 1.4); for (let j = 0; j < 5; j++) b.add(G.sphLow, VC.solid, -20.6 + rand(-0.5, 0.5), 0.95, z + rand(-0.5, 0.5), 0.4, 0.4, 0.4, 0, 0, 0, pick(['#e8307a', '#ffd23d', '#f4f0f0', '#2e5a2a'])); }
    K.crowd(b, -10.5, -20.5, 4, 76, 18, { bag: true });
    return { b, extra: [trolley(), fountainJets(fx, fz)] };
  };

  // ---------- the Stahl House ----------
  const stahl = () => {
    const b = new Batcher(), white = '#f4f4f0', steel = '#2a2a2e';
    // the left: the lot on the brow, the hillside falling away beyond it, the lights of the basin far below; the house:
    // the bedroom wing along the road, the living room out over the edge, its glass on three sides under the long thin
    // roof, the pool along the brink, the carport
    K.kerbLane(b, -1, { x1: 11.6 });
    b.box(VC.solid, '#6a6a50', -22.8, -0.15, -40, 22.4, 0.3, CHUNK_LEN);
    H.slope(b, -110, -70, -34, 0, '#5a5040', { scrub: 28 });
    const lights = H.cityLights(-82, -1600, -40, 200, -1400);
    b.box(VC.solid, '#c8c4bc', -12.3, 0.4, -40, 0.4, 0.8, CHUNK_LEN);
    const F = frame(b, -12, 0, -52, 1, face(-1));   // local x along the road (away from you), z toward the road
    F.box(VC.solid, '#c8c4bc', -4, 0.12, -10, 30, 0.24, 18);   // the terrace
    // a room of glass: the panes between black mullions, the lamps inside lighting some, the rest giving back the dusk; the
    // roof slab over it all with its overhang and the rafters' ends; the floor
    const room = (xa, xb, za, zb, h = 3.0) => {
      const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), z0 = Math.min(za, zb), z1 = Math.max(za, zb), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
      for (const [a0, a1, fixed, alongZ] of [[x0, x1, z0, false], [x0, x1, z1, false], [z0, z1, x0, true], [z0, z1, x1, true]]) {
        const n = Math.max(1, Math.round((a1 - a0) / 1.6)), step = (a1 - a0) / n;
        for (let k = 0; k <= n; k++) { const t = a0 + k * step; F.box(VC.solid, steel, alongZ ? fixed : t, h / 2 + 0.25, alongZ ? t : fixed, 0.1, h, 0.1); }
        for (let k = 0; k < n; k++) {
          const t = a0 + (k + 0.5) * step, lit = chance(0.6), c = lit ? hdr(pick(['#ffd8a0', '#ffe2b8', '#ffcc90']), rand(0.75, 1.0)) : hdr(pick(['#4a5470', '#5a6488', '#6a5a78']), rand(0.75, 0.95));
          F.box(VC.glow, c, alongZ ? fixed : t, h / 2 + 0.25, alongZ ? t : fixed, alongZ ? 0.04 : step - 0.1, h - 0.1, alongZ ? step - 0.1 : 0.04);
        }
      }
      F.box(VC.solid, white, cx, h + 0.4, cz, w + 2.4, 0.3, d + 2.4); F.box(VC.solid, steel, cx, h + 0.22, cz, w + 2.5, 0.08, d + 2.5);
      for (let t = x0 - 1; t <= x1 + 1; t += 1.6) F.box(VC.solid, steel, t, h + 0.18, cz, 0.12, 0.2, d + 2.6);
      F.box(VC.solid, '#8a8278', cx, 0.15, cz, w, 0.3, d);
    };
    room(-16, 2, -4, -12);   // the bedrooms
    room(2, 10, -4, -30);    // the living room, out over the edge
    for (const e of [-1, 1]) { F.beam(VC.solid, steel, [6 + e * 3, 0.1, -20], [6 + e * 3, 0.1, -30], 0.3, 0.5); F.beam(VC.solid, steel, [6 + e * 3, -6, -21], [6 + e * 3, 0, -28], 0.2); }   // the steel under the cantilever, its strut into the slope
    F.box(VC.solid, '#c8c0b0', 6, 1.6, -9, 2.2, 3.2, 0.9);   // the fireplace, the sofa and chairs, a lamp, two people at ease
    F.box(VC.solid, '#3a3a40', 6, 0.55, -22, 4.2, 0.5, 1.2); for (const x of [3.8, 8.4]) F.box(VC.solid, '#2a2a30', x, 0.6, -17, 0.9, 0.6, 0.9);
    F.cyl(VC.metal, '#c8a050', 9, 0.9, -25, 0.03, 1.8, 'cyl6'); F.ell(VC.glow, hdr('#ffe0b0', 2.2), 9, 1.85, -25, 0.25, 0.25, 0.25, true);
    for (const [x, z] of [[4.6, -18], [7.4, -22.6]]) { const p = F.at(x, 0, z); K.person(b, p.x, p.z, { seated: true, y: 0.3, ry: face(-1) + rand(-0.6, 0.6), shades: false, bag: false, phone: false }); }
    F.box(VC.solid, '#c8c4bc', -7, 0.2, -18, 16, 0.4, 8.4);   // the pool on the brink, lit
    F.box(VC.glow, hdr('#5ad8e8', 1.1), -7, 0.42, -18, 15, 0.04, 7.4);
    for (const e of [-1, 1]) F.box(VC.solid, white, -14.5 + e * 0.6, 0.6, -18, 0.7, 0.2, 2.0);
    for (const x of [-12, -2]) { const p = F.at(x, 0, -14.2); K.person(b, p.x, p.z, { lying: true, y: 0.45, ry: face(-1), shades: true, bag: false, phone: false }); }
    F.box(VC.solid, white, -22, 2.6, -4, 6.4, 0.2, 6.4); for (const [x, z] of [[-25, -1], [-19, -1], [-25, -7], [-19, -7]]) F.box(VC.solid, steel, x, 1.3, z, 0.12, 2.6, 0.12);   // the carport and its car
    const cp = F.at(-22, 0, -4); K.place(b, (t) => K.car(t, 0, 0, 1, { kind: 'classic', col: '#c8d8d8' }), new THREE.Matrix4().makeRotationY(face(-1)).setPosition(cp.x, 0, cp.z));
    for (const [zc, w] of [[-6, 9], [-20, 9]]) {   // the neighbours nearer you: low and flat-roofed, glass to the street, a wall of stone, the roof out over it all
      const H2 = rand(3.4, 3.9), x = -18;
      b.addM(K.tiledBox(10, H2, w, 2.5), K.stuccoMat, T(x - 5, H2 / 2, zc), pick(['#f4f2ec', '#e8e4dc']));
      b.box(VC.glow, hdr('#ffd8a0', 0.8), x + 0.02, H2 * 0.48, zc + 0.8, 0.04, H2 - 0.6, w - 3.4); for (let t = -w / 2 + 1.8; t < w / 2 - 1.4; t += 1.6) b.box(VC.solid, steel, x + 0.05, H2 * 0.48, zc + 0.8 + t, 0.08, H2 - 0.5, 0.08);
      b.box(VC.solid, '#8a7a68', x + 0.1, H2 / 2 + 0.2, zc - w / 2 + 0.9, 0.5, H2 + 0.4, 1.6);
      b.box(VC.solid, white, x - 4.4, H2 + 0.15, zc, 12, 0.3, w + 1.6); b.box(VC.solid, steel, x + 1.6, H2 + 0.02, zc, 0.08, 0.08, w + 1.6);
    }
    for (let z = 4; z < 78; z += rand(14, 20)) if (z < 30 || z > 76) K.fanPalm(b, -12.6, -z, rand(1.0, 1.2));
    // the right: the hill climbing from the road: the Chemosphere on its column, its funicular; houses on stilts, cypresses, bougainvillea
    K.kerbLane(b, 1, { x1: 11.6 });
    const hy = (x) => Math.max(0, ((x - 12.5) / 57.5) * 30);
    H.slope(b, 12.5, 0, 70, 30, '#5a5a3e', { scrub: 30 }); b.block(VC.solid, '#5a5a3e', 110, 0, -40, 80, 30, CHUNK_LEN);
    b.box(VC.solid, '#a89c88', 12.6, 0.7, -40, 0.4, 1.4, CHUNK_LEN);
    const chx = 34, chz = -44, cy = hy(chx) + 9;
    b.cyl(VC.solid, '#d8d4cc', chx, (hy(chx) + cy) / 2, chz, 1.5, cy - hy(chx) + 0.4, 'cyl');
    b.addM(new THREE.CylinderGeometry(9, 6.8, 2.4, 8), VC.solid, T(chx, cy + 0.6, chz), '#e8e4dc');
    b.addM(new THREE.CylinderGeometry(9.06, 9.06, 1.2, 8, 1, true), VC.glow, T(chx, cy + 2.4, chz), hdr('#ffd8a0', 0.9));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; b.box(VC.solid, steel, chx + Math.sin(a) * 9.1, cy + 2.4, chz + Math.cos(a) * 9.1, 0.12, 1.3, 0.12); }
    b.addM(new THREE.CylinderGeometry(3.2, 9.6, 1.4, 8), VC.solid, T(chx, cy + 3.7, chz), '#f4f2ec'); b.cyl(VC.solid, '#e8e4dc', chx, cy + 4.7, chz, 1.6, 0.8, 'cyl8');
    for (const e of [-0.5, 0.5]) { const F2 = frame(b, 0, 0, 0, 1, 0); F2.beam(VC.metal, '#5a5a5e', [13.5, 0.5, chz - 6 + e], [chx - 2, cy - 1.5, chz - 6 + e], 0.1); }   // the funicular, its little car
    b.add(G.box, VC.solid, 22, (0.5 + cy - 1.5) / 2 + 1.0, chz - 6, 2.2, 1.6, 1.8, 0, 0, Math.atan2(cy - 2, chx - 15.5), '#c8302a');
    for (let x = 16; x < chx - 3; x += 3) { const y = 0.5 + ((x - 13.5) / (chx - 15.5)) * (cy - 2); b.cyl(VC.metal, '#5a5a5e', x, (y + hy(x)) / 2, chz - 6, 0.08, y - hy(x), 'cyl6'); }   // its trestle
    for (const [x, z, w] of [[24, -12, 9], [46, -20, 10], [24, -70, 9], [52, -68, 11]]) {   // houses on stilts
      const y = hy(x) + 2.6;
      b.addM(K.tiledBox(w, 3.4, 7, 2.5), K.stuccoMat, T(x, y + 1.7, z), pick(['#f4f2ec', '#e8e0d4', '#3a3a40']));
      b.box(VC.glow, K.glass(0.7, true), x - w / 2 - 0.02, y + 1.8, z, 0.04, 2.4, 6); b.box(VC.solid, white, x, y + 3.55, z, w + 1.6, 0.25, 8);
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const px = x + dx * (w / 2 - 0.4); b.cyl(VC.metal, steel, px, (hy(px) + y) / 2, z + dz * 3, 0.1, y - hy(px) + 0.2, 'cyl6'); }
    }
    for (let k = 0; k < 10; k++) { const x = rand(15, 64), z = -rand(4, 76); if (Math.abs(z - chz) < 11 && Math.abs(x - chx) < 11) continue; b.add(G.sphLow, VC.solid, x, hy(x) + 4, z, 1.3, 9, 1.3, 0, 0, 0, '#2a4228'); }   // the cypresses
    for (let k = 0; k < 14; k++) { const x = rand(13, 30); b.add(G.sphLow, VC.solid, x, hy(x) + 0.6, -rand(4, 76), rand(1.2, 2), rand(0.8, 1.3), rand(1.2, 2), 0, 0, 0, pick(['#c8206a', '#e8307a', '#3a5a32'])); }
    K.mailbox(b, 11.2, -30); K.carRow(b, 5.25, 0, CHUNK_LEN, { p: 0.35, lit: true }); K.carRow(b, -5.25, 0, CHUNK_LEN, { p: 0.3, lit: true });
    return { b, extra: [lights] };
  };

  // ---------- the Hollywood Bowl ----------
  // The bowl in the hills on the left: the stage and its shell at S, the seats rising from it toward the road (between
  // the bearings P0 and P1 from S, out to the rim R), grassy slopes round the rest; the ground a field of heights.
  const S = { x: -46, z: -66, y: -10 }, P0 = -0.35, P1 = 0.85, PC = (P0 + P1) / 2, R = 44, R0 = 13;
  const inSeats = (a) => { const d = Math.atan2(Math.sin(a - PC), Math.cos(a - PC)); return clamp(1 - (Math.abs(d) - (P1 - P0) / 2) / 0.45, 0, 1); };
  const bowlH = (x, z) => {
    const dx = x - S.x, dz = z - S.z, r = Math.hypot(dx, dz), a = Math.atan2(dx, dz), w = inSeats(a);
    const back = Math.max(0, Math.cos(a - PC - Math.PI)), rim = 20 + 24 * w - 10 * back;   // (behind the shell the hill comes close)
    if (r <= R0) return S.y;
    const u = clamp((r - R0) / (rim - R0), 0, 1), lin = S.y * (1 - u) - 0.6 * w * (1 - u), sm = S.y * (1 - smooth(u));
    let y = lin * w + sm * (1 - w);
    if (r > rim) y = Math.min(14, (r - rim) * 0.35) * (1 - w) * smooth(clamp((-18 - x) / 8, 0, 1)) * smooth(clamp(Math.min(-z - 0.5, z + 79.5) / 14, 0, 1));   // the hills beyond: not by the road, nor at the chunk's ends
    return y;
  };
  const bowl = () => {
    const b = new Batcher();
    // the left: the ground, the seats, the boxes at the front, the aisles; the shell, its rings lit, the stage and the orchestra
    K.kerbLane(b, -1, { x1: 11.6 });
    b.box(VC.metal, '#3a3a3e', -11.8, 1.0, -40, 0.06, 0.06, CHUNK_LEN); for (let z = 1; z < 80; z += 2.5) b.box(VC.metal, '#3a3a3e', -11.8, 0.5, -z, 0.05, 1.0, 0.05);
    const gx0 = -11.7, gx1 = -112, NX = 64, NZ = 50, geo = new THREE.PlaneGeometry(gx0 - gx1, CHUNK_LEN - 1, NX, NZ).rotateX(-Math.PI / 2);
    const P = geo.attributes.position, C = new Float32Array(P.count * 3), cg = new THREE.Color();
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i) + (gx0 + gx1) / 2, z = P.getZ(i) - 40, y = bowlH(x, z); P.setXYZ(i, x, y, z);
      cg.set(y < -1 ? '#4a5a36' : '#5a6a40').multiplyScalar(rand(0.92, 1.06)); C.set([cg.r, cg.g, cg.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); geo.computeVertexNormals(); b.addM(geo, VC.solid, I4, null);
    // the seats: rows of benches about a metre deep rising half a metre each, built back to front so they face the stage
    const rows = 31, pts = [new THREE.Vector2(R0, S.y + 0.2)];
    for (let k = 0; k < rows; k++) { const ra = R0 + ((R - R0) * k) / rows, rb = R0 + ((R - R0) * (k + 1)) / rows, y = S.y + 0.2 - (S.y * (k + 1)) / rows; pts.push(new THREE.Vector2(ra, y), new THREE.Vector2(rb, y)); }
    const g0 = new THREE.LatheGeometry(pts.reverse(), 40, P0, P1 - P0), sg = g0.toNonIndexed(); g0.dispose(); sg.computeVertexNormals();
    const SP = sg.attributes.position, SN = sg.attributes.normal, SC = new Float32Array(SP.count * 3), ct = new THREE.Color('#5a6a4e'), cr = new THREE.Color('#2a3428');
    for (let i = 0; i < SP.count; i += 3) { const c = SN.getY(i) > 0.5 ? ct : cr; for (let j = 0; j < 3; j++) SC.set([c.r, c.g, c.b], (i + j) * 3); }
    sg.setAttribute('color', new THREE.BufferAttribute(SC, 3)); b.addM(sg, VC.solid, T(S.x, 0, S.z), null);
    const seatY = (r) => S.y + 0.2 - (S.y * Math.ceil(((r - R0) / (R - R0)) * rows)) / rows;
    for (let k = 0; k < 900; k++) {   // the audience: its colours, a phone lit here and there
      const r = rand(R0 + 9, R - 0.5), a = rand(P0 + 0.02, P1 - 0.02), x = S.x + Math.sin(a) * r, z = S.z + Math.cos(a) * r;
      b.box(chance(0.06) ? VC.glow : VC.solid, chance(0.06) ? hdr('#e8f0ff', 1.6) : pick(['#f4f4f0', '#2a2a30', '#c8302a', '#2a5ad8', '#e8c040', '#8a5ad8', '#3a8a5a']), x, seatY(r) + 0.45, z, 0.42, 0.8, 0.42);
    }
    for (const a of [P0 + 0.3, PC, P1 - 0.3]) { const F2 = frame(b, 0, 0, 0, 1, 0); F2.beam(VC.solid, '#a8a49c', [S.x + Math.sin(a) * R0, S.y + 0.35, S.z + Math.cos(a) * R0], [S.x + Math.sin(a) * R, 0.25, S.z + Math.cos(a) * R], 0.06, 1.3); }   // the aisles
    for (let r = R0 + 1.6; r < R0 + 8; r += 3.2) for (let a = P0 + 0.08; a < P1 - 0.06; a += 3.4 / r) {   // the garden boxes at the front: low walls, a table, the picnic and its candles
      const x = S.x + Math.sin(a) * r, z = S.z + Math.cos(a) * r, y = seatY(r) + 0.05, F2 = frame(b, x, y, z, 1, a);
      for (const [dx, dz, w, d] of [[0, -1.45, 3, 0.12], [0, 1.45, 3, 0.12], [-1.45, 0, 0.12, 3], [1.45, 0, 0.12, 3]]) F2.box(VC.solid, '#e8e4dc', dx, 0.4, dz, w, 0.8, d);
      F2.box(VC.solid, '#f4f2ec', 0, 0.7, 0, 1.2, 0.06, 0.8); F2.box(VC.glow, hdr('#ffc870', 3), 0.2, 0.82, 0, 0.06, 0.12, 0.06); F2.cyl(VC.solid, '#2a4a2a', -0.3, 0.88, 0.1, 0.05, 0.3, 'cyl6');
      for (const e of [-1, 1]) { const p = F2.at(e * 0.9, 0, 0.6); K.person(b, p.x, p.z, { seated: true, y, ry: a, bag: false }); }
    }
    // the shell: rings of half-cylinders stepping in, their insides lit and running through the colours; the stage before it
    const SF = frame(b, S.x, S.y, S.z, 1, PC);
    for (let k = 0; k < 10; k++) {
      const r = 13.6 - k * 0.6, g = new THREE.CylinderGeometry(r, r, 1.3, 28, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2);
      SF.addM(g, led[k % 3], T(0, 0, -1.5 - k * 1.25), 0xffffff);
      SF.addM(new THREE.TorusGeometry(r, 0.12, 4, 28, Math.PI), VC.solid, T(0, 0, -0.85 - k * 1.25), '#f4f2ec');
    }
    SF.addM(new THREE.CylinderGeometry(14.2, 14.2, 11, 28, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), VC.solid, T(0, 0, -6.4), '#e8e4dc');   // its back, toward the hill
    SF.box(VC.solid, '#5a4a3a', 0, 0.6, 3.6, 26, 1.2, 11.6); SF.box(VC.solid, '#3a2e24', 0, 1.22, 3.6, 26, 0.04, 11.6);
    for (let k = 0; k < 26; k++) {   // the orchestra in its arcs, their stands; the piano; the conductor on his podium
      const row = k < 12 ? 0 : k < 21 ? 1 : 2, n = [12, 9, 5][row], j = row === 0 ? k : row === 1 ? k - 12 : k - 21, a = (j / (n - 1) - 0.5) * 2.2, r = 3.4 + row * 2.2;
      const p = SF.at(Math.sin(a) * r, 0, 5.2 - Math.cos(a) * r + 2.4); K.person(b, p.x, p.z, { seated: true, y: S.y + 1.1, ry: PC + Math.PI - a * 0.5, top: '#141414', legs: '#141414', bag: false, phone: false, shades: false, hat: 'none' });
      const q = SF.at(Math.sin(a) * (r - 0.8), 0, 5.2 - Math.cos(a) * (r - 0.8) + 2.4); b.box(VC.solid, '#1a1a1e', q.x, S.y + 2.25, q.z, 0.45, 0.3, 0.04);
    }
    SF.box(VC.solid, '#0e0e12', -4.4, 2.0, 4.4, 1.5, 0.9, 2.6); SF.add(G.box, VC.solid, -4.7, 2.7, 4.3, 0.06, 0.9, 2.4, 0, 0, 0.5, '#0e0e12');
    SF.box(VC.solid, '#3a2e24', 0, 1.45, 8.3, 1.0, 0.45, 1.0); const cp = SF.at(0, 0, 8.3); K.person(b, cp.x, cp.z, { y: S.y + 1.65, ry: PC, top: '#0e0e12', legs: '#0e0e12', reach: true, hat: 'none', bag: false, phone: false });
    for (const e of [-1, 1]) { SF.box(VC.solid, '#1a1a1e', e * 14.5, 6, 1, 1.8, 12, 1.8); SF.box(VC.solid, '#2a2a30', e * 10, 13.5, 1.5, 2.2, 3.0, 1.6); for (let k = 0; k < 3; k++) SF.box(VC.glow, hdr('#fff4e0', 3), e * 14.5, 10 + k * 1.2, 1.95, 0.8, 0.5, 0.06); }   // the speaker towers, the clusters, the lights
    const sp = SF.at(0, 0, 5); K.pool(b, sp.x, sp.z, 22, 16, hdr('#ffd8f0', 0.35), S.y + 1.26);
    for (let k = 0, n = 0; k < 20 && n < 5; k++) { const a = rand(P1 + 0.3, P0 + Math.PI * 2 - 0.3), r = rand(18, 34), x = S.x + Math.sin(a) * r, z = S.z + Math.cos(a) * r; if (x > -14 || z > -3 || z < -77) continue; (n % 2 ? K.fig : K.pine)(b, x, z, rand(0.6, 0.85), { y: bowlH(x, z) }); n++; }   // the trees on the slopes round it, the scrub
    for (let k = 0; k < 3; k++) { const x = rand(-92, -106), z = -rand(10, 70); K.pine(b, x, z, rand(0.7, 1.0), { y: bowlH(x, z) }); }
    for (let k = 0; k < 40; k++) { const a = rand(P1 + 0.2, P0 + Math.PI * 2 - 0.2), r = rand(15, 40), x = S.x + Math.sin(a) * r, z = S.z + Math.cos(a) * r; if (x > -14 || z > -2 || z < -78) continue; K.shrub(b, x, z, { y: bowlH(x, z) - 0.1, s: rand(1.2, 2.2) }); }
    // the right: Highland's side: the sign, the Muse fountain, the box office and the line at it, the picnic lane under its lights, the stacked parking
    K.kerbLane(b, 1, { x1: 12 }); farGround(b, 1, '#6a6a50'); K.pave(b, 20, -30, 16, 52, 0.035);
    const SG = frame(b, 13.2, 0, -8, 1, face(1));
    SG.box(VC.solid, '#2a4a4a', 0, 1.6, -0.3, 11, 3.2, 0.6); K.sign(SG, 'HOLLYWOOD BOWL', { w: 768, h: 128, color: '#f4f2ec', font: DECO, size: 0.6, k: 1.3 }, 0, 2.1, 0.02, 10, 1.4, 1);
    K.sign(SG, 'TONIGHT · UNDER THE STARS', { w: 768, h: 80, color: '#ffd890', font: SANS, weight: 700, size: 0.55, k: 1.3 }, 0, 0.8, 0.02, 7, 0.5, 1);
    const mx = 22, mz = -24;   // the Muse fountain: its basin, the three figures back to back on their pedestal, the jets
    b.cyl(VC.solid, '#d8d0c0', mx, 0.4, mz, 5, 0.8, 'cyl'); b.add(G.cyl, K.water, mx, 0.82, mz, 9.4, 0.02, 9.4, 0, 0, 0, 0xffffff);
    b.addM(frustum4(1.6, 2.6, 3.2), VC.solid, T(mx, 0.8, mz), '#e8e0d0');
    for (let k = 0; k < 3; k++) figure(frame(b, mx, 4.0, mz, 2.4, (k / 3) * Math.PI * 2), VC.solid, '#e8e0d0', { skirt: true, arms: k === 1 ? 'out' : 'hips', hair: true });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.add(G.cone8, VC.glow, mx + Math.cos(a) * 3.6, 1.6, mz + Math.sin(a) * 3.6, 0.18, 1.6, 0.18, 0, 0, 0, hdr('#e8f2ff', 1.1)); }
    b.addM(K.tiledBox(8, 4.6, 6, 2.5), K.stuccoMat, T(18.5, 2.3, -42), '#f2ece0');   // the box office
    for (let k = -1; k <= 1; k++) b.box(VC.glow, hdr('#ffe6c0', 1.2), 14.48, 1.6, -42 + k * 2, 0.04, 1.2, 1.4);
    K.sign(b, 'BOX OFFICE', { w: 512, h: 96, color: '#2a4a4a', font: DECO, size: 0.6, k: 1.0 }, 14.46, 3.6, -42, 4.4, 0.8, 1, 0, -Math.PI / 2, 0);
    for (let k = 0; k < 9; k++) K.person(b, 13.4, -36 - k * 0.8, { ry: Math.PI, bag: chance(0.5) });
    for (let k = 0; k < 6; k++) { const z = -50 - k * 4.5; b.block(VC.solid, '#6a4a2a', 18, 0, z, 1.0, 0.75, 2.4); for (const e of [-1, 1]) { b.box(VC.solid, '#6a4a2a', 18 + e * 0.9, 0.45, z, 0.3, 0.06, 2.4); K.person(b, 18 + e * 0.95, z + rand(-0.6, 0.6), { seated: true, ry: e > 0 ? Math.PI / 2 : -Math.PI / 2 }); } }   // the picnic tables
    for (const z of [50, 72]) { lights(b, 14, 4.0, 22.8, 4.0, -z - 3, 8, 0.4); for (const x of [14, 22.8]) b.cyl(VC.metal, '#3a3a3e', x, 2.0, -z - 3, 0.05, 4.0, 'cyl6'); }
    for (const [x, z] of [[24, -52], [24, -66], [15, -60]]) K.fig(b, x, z, rand(0.7, 0.85));
    for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) K.car(b, 30 + r * 5.2, -(48 + k * 4.4), 1, { lit: false, lo: r > 0, kind: pick(['sedan', 'suv', 'pickup']) });   // the stacked parking, nose to tail
    b.add(G.plane, VC.solid, 35.2, 0.04, -62, 16, 32, 1, -Math.PI / 2, 0, 0, '#3a3a3e');
    K.metroBus(b, 5.3, -rand(20, 40), 1);
    K.crowd(b, 7.8, 11.4, 2, 78, 14, { bag: true });
    return b;
  };

  const done = (fn) => () => { const r = fn(), g = K.flush((r.b || r).build()); for (const o of r.extra || []) g.add(o); for (const m of extras.live.splice(0)) { g.add(m); live.push(m); } return g; };
  const live = [];
  const LIST = [['getty', '盖蒂中心', 'THE GETTY CENTER', getty], ['grove', '农夫市场 · The Grove', 'FARMERS MARKET · THE GROVE', grove],
    ['stahl', '斯塔尔住宅 · 好莱坞山', 'STAHL HOUSE · HOLLYWOOD HILLS', stahl], ['bowl', '好莱坞露天剧场', 'HOLLYWOOD BOWL', bowl]];
  return {
    landmarks: Object.fromEntries(LIST.map(([key, name, en, fn]) => [key, { key, name, en, build: done(fn) }])),
    update(t) {
      for (const m of live) m.userData.update(t);
      for (const m of extras.movers) m.userData.move(t);
      led.forEach((m, i) => m.color.setHSL((t * 0.03 + i * 0.08) % 1, 0.8, 0.62).multiplyScalar(1.35));
    },
  };
}
