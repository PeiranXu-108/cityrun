// Dubai's icons, each modelled once in its own frame (ny_icons.js's frame()) in metres, so the same model can stand in a
// landmark scene, lit and in the fog, or out on the skyline, unlit with its shading baked; a style S gives the materials
// (wall, glass, glow, metal, gold, dark, sail, led, win: a window-textured material and winTex its cell counts) and colours.
// Burj Khalifa: the Y of three wings round a hexagonal core, the wings stepping back in turn up a spiral (27 setbacks)
// until the core goes on alone into the spire, 828 m. Burj Al Arab: the sail, its two wings in a V meeting at the mast,
// the white exoskeleton's great X-braces down their outer sides, the fabric face between them glowing, the helipad and
// the restaurant cantilevered off the top, the island and its curving bridge. The Emirates Towers' triangles and their
// sloping tops; the Museum of the Future's ring of steel written over with calligraphy, on its green hill; the Dubai Frame;
// Cayan Tower's quarter twist; Atlantis's arch and Atlantis The Royal's stacked blocks; Ain Dubai; the Jumeirah Beach
// Hotel's wave; the Opera's dhow; Rose Tower, Princess Tower, Marina 101, the Address Sky View's bridge, Etisalat's ball,
// the Opus's void; the Jumeirah Mosque; Al Fahidi Fort; a tower crane.
import { THREE, G, hdr, buildingGeo, canvasTex, rand, randi, pick } from '../core.js';
import { taperGeo } from './ny_icons.js';
import { HALF } from './istanbul_icons.js';

const _v = new THREE.Vector3();
// a custom mesh from a list of triangles (flat arrays of xyz), its normals computed
export function triGeo(pos) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const uv = new Float32Array((pos.length / 3) * 2);
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
const win = (S, w, h, d) => buildingGeo(w, h, d, S.winTex, 3.4, 4.2);   // a box of windows (S.win's texture tiled in metres)
const lamp = (F, S, x, y, z, r = 1.2) => F.ell(S.red || S.glow, S.cRed, x, y, z, r, r, r, true);   // a red aviation lamp

// ---------- Burj Khalifa ----------
export const BK = { H: 828, roof: 585, core: 16, wing: 13, L0: 62 };
export function burjKhalifa(F, S, { lo = false, led = null } = {}) {
  const glass = led || S.glass, n = 27, y0 = 150, step = (BK.roof - y0) / n, L = [BK.L0, BK.L0 - 4, BK.L0 - 8];
  const wingAt = (k, len, ya, yb) => {   // wing k as a box from the core out to len, its rounded end
    const a = (k / 3) * Math.PI * 2 + Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), mid = (BK.core + len) / 2, h = yb - ya;
    if (len <= BK.core + 2) return;
    F.add(G.box, glass, ca * mid, ya + h / 2, -sa * mid, len - BK.core, h, BK.wing * 2, 0, a, 0, S.cGlass);
    F.add(lo ? G.cyl6 : G.cyl8, glass, ca * len, ya + h / 2, -sa * len, BK.wing * 2, h, BK.wing * 2, 0, a, 0, S.cGlass);
    if (!lo) for (const e of [-1, 1]) F.add(G.box, S.metal, ca * mid - sa * e * (BK.wing + 0.3), ya + h / 2, -sa * mid - ca * e * (BK.wing + 0.3), len - BK.core, h, 0.6, 0, a, 0, S.cSteel);   // the steel fins' gleam down its sides
  };
  // the lower body: the three wings at full length up to the first setback
  for (let k = 0; k < 3; k++) wingAt(k, L[k], 0, y0);
  let ya = y0;
  for (let i = 0; i < n; i++) {   // then one wing steps back at each level, in turn round the spiral
    L[i % 3] -= (BK.L0 - BK.core) / 9.6;
    const yb = ya + step;
    for (let k = 0; k < 3; k++) wingAt(k, L[k], ya, yb);
    if (!lo) F.add(G.box, S.glow, 0, yb, 0, BK.core * 2 + 2, 0.8, BK.core * 2 + 2, 0, 0, 0, S.cBand);   // the mechanical floors' lit bands
    ya = yb;
  }
  F.add(G.cyl6, glass, 0, BK.roof / 2, 0, BK.core * 2, BK.roof, BK.core * 2, 0, Math.PI / 6, 0, S.cGlass);   // the core all the way up
  // the spire: the core narrowing in drums, then the steel needle
  let y = BK.roof, r = BK.core * 0.92;
  for (let k = 0; k < 8; k++) { const h = 22 - k; F.add(G.cyl6, glass, 0, y + h / 2, 0, r * 2, h, r * 2, 0, Math.PI / 6, 0, S.cGlass); y += h; r *= 0.8; }
  F.add(taperGeo(0.1, lo ? 6 : 10), S.metal, 0, y + (BK.H - y) / 2, 0, r * 2, BK.H - y, r * 2, 0, 0, 0, S.cSteel);
  F.ell(S.glow, S.cTip, 0, BK.H - 30, 0, 2.2, 6, 2.2, true);   // the lamp near the tip
  lamp(F, S, 0, BK.H - 2, 0, 1.6);
  if (!lo) for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + Math.PI / 2; F.add(G.box, S.glow, Math.cos(a) * 40, 4, -Math.sin(a) * 40, 30, 8, 22, 0, a, 0, S.cLobby); }   // the lobbies lit at its feet
  return { top: F.at(0, BK.H, 0), roof: F.at(0, BK.roof, 0) };
}

// ---------- Burj Al Arab ----------
// in its own frame: the sail facing +z (the shore), the mast at the back (-z), 321 m to the mast's tip
export function burjAlArab(F, S, { lo = false, island = true } = {}) {
  const N = lo ? 10 : 18, Htop = 262, back = -34;
  const front = (t) => 30 + 26 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * 0.35) - 40 * t * t;   // the sail's leading edge, bulging then curving back
  const half = (t) => 26 * (1 - Math.pow(t, 1.6));   // the wings' spread at the front
  const P = [], sail = [];
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N, y0 = t0 * Htop, y1 = t1 * Htop;
    const f0 = front(t0), f1 = front(t1), h0 = half(t0), h1 = half(t1), b0 = back + 6 * t0, b1 = back + 6 * t1;
    for (const e of [-1, 1]) {   // the wing faces: the mast to the sail's edge
      const A = [0, y0, b0], B = [e * h0, y0, f0], C = [e * h1, y1, f1], D = [0, y1, b1];
      if (e > 0) P.push(...A, ...B, ...C, ...A, ...C, ...D); else P.push(...A, ...C, ...B, ...A, ...D, ...C);
    }
    const M = 6;   // the fabric face: a shallow arc between the wings' front edges
    for (let k = 0; k < M; k++) {
      const u0 = k / M - 0.5, u1 = (k + 1) / M - 0.5, bulge = (u) => (1 - 4 * u * u) * 5;
      sail.push(u0 * 2 * h0, y0, f0 + bulge(u0), u1 * 2 * h0, y0, f0 + bulge(u1), u1 * 2 * h1, y1, f1 + bulge(u1));
      sail.push(u0 * 2 * h0, y0, f0 + bulge(u0), u1 * 2 * h1, y1, f1 + bulge(u1), u0 * 2 * h1, y1, f1 + bulge(u0));
    }
  }
  F.addM(triGeo(P), S.glass, new THREE.Matrix4(), S.cGlassDark || S.cGlass);
  F.addM(triGeo(sail), S.sail, new THREE.Matrix4(), S.cSail);
  // the exoskeleton: the X-braces down each wing's outer edge, white, lit
  for (const e of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([e * (half(t) + 2), t * Htop, front(t) - 6 - 18 * t]); }
    for (let i = 0; i < 8; i++) {
      const a = pts[i], c = pts[i + 1], am = [a[0] * 0.55, a[1], (a[2] + back) / 2], cm = [c[0] * 0.55, c[1], (c[2] + back) / 2];
      F.beam(S.wall, S.cWhite, a, cm, lo ? 2.4 : 1.8); F.beam(S.wall, S.cWhite, am, c, lo ? 2.4 : 1.8); F.beam(S.wall, S.cWhite, a, c, lo ? 2.6 : 2.0);
    }
  }
  // the mast up the back and on above the roof, its lamp
  F.beam(S.wall, S.cWhite, [0, 0, back - 3], [0, Htop + 6, back + 3], 7);
  F.beam(S.metal, S.cSteel, [0, Htop, back + 3], [0, 321, back + 5], 2.2);
  lamp(F, S, 0, 321, back + 5, 1.4);
  // the helipad cantilevered seaward off one side near the top, the restaurant off the other
  F.add(G.cyl, S.wall, 26, 212, -8, 24, 1.6, 24, 0, 0, 0, S.cWhite);
  F.add(G.cyl, S.glow, 26, 213, -8, 18, 0.2, 18, 0, 0, 0, S.cPad);
  F.beam(S.wall, S.cWhite, [8, 196, -18], [24, 211, -8], 1.6);
  F.add(G.sph, S.wall, -20, 205, -14, 30, 9, 16, 0, 0.2, 0, S.cWhite);
  F.add(G.box, S.glow, -20, 205, -14, 26, 2.2, 13, 0, 0.2, 0, S.cWin);
  if (island) {   // the island and the curving bridge to the shore (+z)
    F.add(G.cyl, S.wall, 0, -3, 0, 150, 6, 150, 0, 0, 0, S.cStone);
    F.add(G.cyl, S.glow, 0, 0.2, 0, 152, 0.3, 152, 0, 0, 0, S.cLobby);
    if (!lo) for (let k = 0; k < 14; k++) { const t = k / 13, x = 20 * Math.sin(t * Math.PI), z = 75 + t * 250; F.add(G.box, S.wall, x, 1.2 + 4 * Math.sin(t * Math.PI), z, 10, 1.4, 20, 0, -0.25 * Math.cos(t * Math.PI), 0, S.cStone); }
  }
  return { top: F.at(0, 321, back + 5), mid: F.at(0, 130, 10) };
}

// ---------- the Emirates Towers ----------
// two triangular towers, aluminium and silvered glass, their tops sliced off at a slope to a point; the lit edges
export function emiratesTowers(F, S, { lo = false } = {}) {
  const tri = (x, z, side, h, ry) => {
    const R = side / Math.sqrt(3);
    F.add(lo ? G.cyl6 : G.cyl, S.glass, x, h / 2, z, R * 2, h, R * 2, 0, ry, 0, S.cGlass);
    F.add(new THREE.CylinderGeometry(0.5, 0.5, 1, 3), S.glass, x, h / 2, z, R * 2, h, R * 2, 0, ry, 0, S.cGlass);
    F.add(new THREE.ConeGeometry(0.5, 1, 3), S.glass, x, h + side * 0.55, z, R * 2.02, side * 1.1, R * 2.02, 0, ry, 0, S.cGlassHi || S.cGlass);   // the sloping top
    for (let k = 0; k < 3; k++) { const a = ry + (k / 3) * Math.PI * 2, ex = x + Math.sin(a) * R, ez = z + Math.cos(a) * R; F.beam(S.glow, S.cEdge, [ex, 4, ez], [ex, h, ez], lo ? 1.6 : 0.8); }
    F.beam(S.metal, S.cSteel, [x, h + side * 1.1, z], [x, h + side * 1.1 + 22, z], 1.0);
    lamp(F, S, x, h + side * 1.1 + 22, z);
  };
  tri(0, 0, 44, 300, 0.4);    // the office tower, 355 m
  tri(70, -24, 40, 262, 0.1);   // the hotel, 309 m
  F.add(G.box, S.glass, 35, 9, -10, 90, 18, 40, 0, 0.2, 0, S.cGlass);   // the Boulevard between them
  F.add(G.box, S.glow, 35, 4, -10, 90.5, 5, 40.5, 0, 0.2, 0, S.cLobby);
  return { top: F.at(0, 380, 0) };
}

// ---------- the Museum of the Future ----------
// a ring of stainless steel standing on edge, elliptical, its skin written over with calligraphy that is its windows
// (lit from within), on a green hill; 77 m
let calligraphyTex = null;
const CAL_LINES = ['المستقبل لمن يتخيله ويصممه وينفذه', 'المستقبل لا ينتظر', 'المستقبل يمكن تصميمه وبناؤه', 'سنعيش لمئات السنين ولكن يمكننا أن نصنع شيئا يدوم'];
const calText = (g, w, ink) => {
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
  for (let r = 0; r < 4; r++) { g.font = `700 ${46 + (r % 2) * 8}px "Aref Ruqaa", "Noto Kufi Arabic", serif`; g.fillText(CAL_LINES[r], w / 2 + (r % 2 ? 60 : -40), 34 + r * 62); }
};
// the steel skin with the calligraphy cut through it (map), and the same letters as the light behind them (glow)
export function calligraphy() {
  if (calligraphyTex) return calligraphyTex;
  const map = canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#b8bcc4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1200; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '60,64,72'},${Math.random() * 0.08})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    calText(g, w, '#141820');
  });
  const glow = canvasTex(1024, 256, (g, w, h) => { g.fillStyle = '#000000'; g.fillRect(0, 0, w, h); calText(g, w, '#ffdc9e'); });
  calligraphyTex = { map, glow };
  return calligraphyTex;
}
export function museumOfFuture(F, S, { lo = false } = {}) {
  const ring = new THREE.TorusGeometry(30, 11.5, lo ? 8 : 14, lo ? 28 : 56);
  F.add(ring, S.steel || S.metal, 0, 40, 0, 1.3, 1.0, 1.0, 0, Math.PI / 2, 0, S.cSteel);   // the hole looks along x
  F.add(HALF, S.green || S.wall, 0, 0, 0, 56, 24, 112, 0, 0, 0, S.cGreen);   // the hill, long under the ring
  F.add(G.box, S.glow, 0, 12.5, 0, 40, 3, 16, 0, 0, 0, S.cLobby);
  return { top: F.at(0, 80, 0) };
}

// ---------- the Dubai Frame ----------
// two towers 150 m tall, 93 m apart outside to outside, the glass bridge across their tops; clad in gold, its pattern of
// rings; the lift shafts glazed on the inner faces
let ringTex = null;
export function frameTex() {
  if (ringTex) return ringTex;
  ringTex = canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e8c060'); gr.addColorStop(0.5, '#f8dc88'); gr.addColorStop(1, '#c89a3a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,80,20,0.55)'; g.lineWidth = 3;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = c * 64 + 32, y = r * 64 + 32; g.beginPath(); g.arc(x, y, 26, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(x, y, 14, 0, Math.PI * 2); g.stroke(); }
  });
  return ringTex;
}
export const FRAME = { H: 150, W: 93, leg: 13, deep: 22, bridge: 14 };
export function dubaiFrame(F, S, { lo = false } = {}) {
  const { H, W, leg, deep, bridge } = FRAME, xl = W / 2 - leg / 2;
  for (const e of [-1, 1]) {
    F.block(S.gold, S.cGold, e * xl, 0, 0, leg, H, deep);
    F.box(S.glass, S.cGlass, e * (xl - leg / 2 - 0.1), (H - bridge) / 2, 0, 0.4, H - bridge, deep * 0.5);   // the glazed lift shaft on the inner face
    if (!lo) for (let y = 6; y < H - bridge; y += 9) F.box(S.glow, S.cLobby, e * (xl - leg / 2 - 0.35), y, 0, 0.2, 0.6, deep * 0.45);
    F.beam(S.glow, S.cEdge, [e * (xl + leg / 2 + 0.3), 0, deep / 2 + 0.3], [e * (xl + leg / 2 + 0.3), H, deep / 2 + 0.3], lo ? 1.4 : 0.6);
  }
  F.block(S.gold, S.cGold, 0, H - bridge, 0, W - 2 * leg + 0.2, bridge, deep);
  F.box(S.glass, S.cGlass, 0, H - bridge - 0.2, 0, W - 2 * leg, 0.5, deep * 0.8);   // the glass floor
  F.box(S.glow, S.cWin, 0, H - bridge / 2, deep / 2 + 0.15, W - 2 * leg - 2, bridge * 0.4, 0.2);
  lamp(F, S, 0, H + 1, 0, 1.2);
  return { top: F.at(0, H, 0) };
}

// ---------- Cayan Tower ----------
// its floors each turned a little on the last, a quarter turn in 75 storeys; the balconies' white bands between them
export function cayanTower(F, S, { lo = false } = {}) {
  const n = lo ? 18 : 36, H = 306, w = 30, step = H / n;
  for (let i = 0; i < n; i++) {
    const ry = (i / n) * (Math.PI / 2);
    F.add(lo ? G.box : win(S, w, step * 0.86, w), S.win || S.glass, 0, i * step + (lo ? step * 0.43 : 0), 0, lo ? w : 1, lo ? step * 0.86 : 1, lo ? w : 1, 0, ry, 0, S.cRes || S.cGlass);
    F.add(G.box, S.wall, 0, i * step + step * 0.93, 0, w + 1, step * 0.14, w + 1, 0, ry, 0, S.cWhite);
  }
  F.add(G.box, S.glow, 0, H + 3, 0, w * 0.8, 4, w * 0.8, 0, Math.PI / 2, 0, S.cCrown);
  lamp(F, S, 0, H + 6, 0);
  return { top: F.at(0, H + 6, 0) };
}

// ---------- Atlantis, The Palm ----------
// the coral pink hotel: two wings either side, the inner towers flanking the great arch, the bridge across its top, the
// crown over that; stepped crenellated tops; the lit windows; Atlantis The Royal beside it, its blocks stacked askew
export function atlantis(F, S, { lo = false } = {}) {
  const coral = S.cCoral, wing = (x, w, h) => { F.add(win(S, w, h, 34), S.win, x, 0, 0, 1, 1, 1, 0, 0, 0, coral); F.box(S.wall, S.cCoralHi || coral, x, h + 3, 0, w * 0.8, 6, 30); for (let k = 0; k < 5; k++) F.add(G.cone4, S.wall, x - w * 0.4 + (k + 0.5) * (w * 0.8 / 5), h + 7, 0, 5, 4, 5, 0, 0, 0, S.cCoralHi || coral); };
  for (const e of [-1, 1]) { wing(e * 105, 90, 72); wing(e * 50, 30, 92); }
  F.block(S.wall, S.cCoralHi || coral, 0, 66, 0, 70, 30, 30);   // the bridge across the arch
  F.box(S.glow, S.cWin, 0, 80, 15.2, 64, 8, 0.4);
  F.add(HALF, S.wall, 0, 96, 0, 26, 22, 26, 0, 0, 0, S.cCoralHi || coral);   // the crown over the arch
  F.box(S.glow, S.cArch, 0, 30, 0, 66, 60, 0.4);   // the arch's void, lit from below
  if (!lo) for (const e of [-1, 1]) F.add(G.cyl8, S.wall, e * 36, 110, 0, 8, 20, 8, 0, 0, 0, S.cCoralHi || coral);
  return { top: F.at(0, 118, 0) };
}
export function atlantisRoyal(F, S) {
  let y = 0;
  for (let k = 0; k < 9; k++) { const w = rand(50, 90), h = 18, x = rand(-25, 25); F.add(win(S, w, h, 26), S.win, x, y, 0, 1, 1, 1, 0, 0, 0, S.cWhite); F.box(S.glow, S.cWin, x, y + h - 1, 13.2, w - 2, 1.2, 0.3); y += h; }
  return { top: F.at(0, y, 0) };
}

// ---------- Ain Dubai ----------
// 250 m across: the rim and its LEDs, the cable spokes from the hub, the pods round the rim, the two A-frame legs either
// side of it. Returns the wheel's parts in a group of their own (so a scene can turn it) and the legs into F
export function ainDubaiLegs(F, S, { R = 118 } = {}) {
  const hub = R + 12;
  for (const z of [-14, 14]) { F.beam(S.wall, S.cWhite, [-70, 0, z * 3], [0, hub, z], 6); F.beam(S.wall, S.cWhite, [70, 0, z * 3], [0, hub, z], 6); }
  F.cyl(S.wall, S.cWhite, 0, hub, 0, 9, 40, 'cyl', Math.PI / 2);
  return hub;
}
export function ainDubaiWheel({ R = 118, basicMats = true, curve = null } = {}) {
  const grp = new THREE.Group();
  const mk = (o) => (curve ? curve(o) : new THREE.MeshBasicMaterial({ fog: false, ...o }));
  const rim = mk({ color: hdr('#ffffff', 1.6) }), steel = mk({ color: hdr('#c8ccd4', 0.7) }), pod = mk({ color: hdr('#e8f4ff', 1.2) });
  grp.add(new THREE.Mesh(new THREE.TorusGeometry(R, 2.4, 6, 120), rim));
  grp.add(new THREE.Mesh(new THREE.TorusGeometry(R - 6, 1.2, 4, 120), steel));
  const sp = [];
  for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2; const g = new THREE.BoxGeometry(0.6, R, 0.6).translate(0, R / 2, 0).rotateZ(a); g.translate(0, 0, k % 2 ? 6 : -6); sp.push(g.toNonIndexed()); }
  const merged = new THREE.BufferGeometry(); const P = []; for (const g of sp) P.push(...g.attributes.position.array); merged.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  grp.add(new THREE.Mesh(merged, steel));
  const pods = []; for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2; const g = new THREE.SphereGeometry(4, 8, 6).scale(1.4, 1, 1).translate(Math.cos(a) * (R + 5), Math.sin(a) * (R + 5), 0); pods.push(...g.toNonIndexed().attributes.position.array); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pods, 3)); grp.add(new THREE.Mesh(pg, pod));
  grp.userData.rim = rim;
  grp.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
  return grp;
}

// ---------- the Jumeirah Beach Hotel ----------
// a breaking wave of a building: low at one end, rising to its curling crest at the other, blue glass and white bands
export function jbHotel(F, S, { lo = false } = {}) {
  const pts = [];
  const L = 240, top = (t) => 30 + 74 * Math.pow(t, 1.6) + (t > 0.85 ? -60 * (t - 0.85) : 0);
  for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new THREE.Vector2(-L / 2 + L * t, top(t))); }
  pts.push(new THREE.Vector2(L / 2, 0), new THREE.Vector2(-L / 2, 0));
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 34, bevelEnabled: false });
  g.translate(0, 0, -17);
  F.add(g, S.glass, 0, 0, 0, 1, 1, 1, 0, 0, 0, S.cWave || S.cGlass);
  if (!lo) for (let y = 6; y < 100; y += 6) { const t = Math.pow(Math.max(0, (y - 30) / 74), 1 / 1.6); F.box(S.glow, S.cWin, L / 2 - (1 - Math.max(0, Math.min(1, t))) * L * 0.5 - L * 0.25, y, 17.2, L * 0.5, 0.5, 0.3); }
  return { top: F.at(L / 2 - 30, 100, 0) };
}

// ---------- Dubai Opera ----------
// a dhow of glass: the hull's long glazed side, the prow rising to a point at one end, lit warm from inside
export function dubaiOpera(F, S) {
  const pts = [new THREE.Vector2(-50, 0), new THREE.Vector2(36, 0), new THREE.Vector2(56, 44), new THREE.Vector2(30, 30), new THREE.Vector2(-50, 26)];
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 60, bevelEnabled: false }); g.translate(0, 0, -30);
  F.add(g, S.glass, 0, 0, 0, 1, 1, 1, 0, 0, 0, S.cOpera || S.cWin);
  for (let x = -46; x < 40; x += 6) F.beam(S.metal, S.cSteel, [x, 0, 30.2], [x + (x > 30 ? 6 : 0), x > 30 ? 40 : 27, 30.2], 0.5);
  return { top: F.at(56, 44, 0) };
}

// ---------- the other towers on the skyline ----------
export function roseTower(F, S) {   // slender, its crown curving to a spire like a stem
  F.add(win(S, 34, 300, 30), S.win, 0, 0, 0, 1, 1, 1, 0, 0, 0, S.cGlass);
  F.add(taperGeo(0.2, 8), S.glass, 0, 320, 0, 30, 40, 26, 0, 0, 0, S.cGlassHi || S.cGlass);
  F.cyl(S.metal, S.cSteel, 0, 360, 0, 0.8, 40, 'cyl6'); lamp(F, S, 0, 381, 0);
  return { top: F.at(0, 381, 0) };
}
export function princessTower(F, S) {   // the tall residential tower and its lit dome and spire
  F.add(win(S, 40, 340, 40), S.win, 0, 0, 0, 1, 1, 1, 0, 0, 0, S.cRes || S.cWhite);
  F.add(win(S, 30, 40, 30), S.win, 0, 340, 0, 1, 1, 1, 0, 0, 0, S.cRes || S.cWhite);
  F.add(HALF, S.glow, 0, 380, 0, 26, 24, 26, 0, 0, 0, S.cCrown);
  F.cyl(S.metal, S.cSteel, 0, 405, 0, 0.8, 30, 'cyl6'); lamp(F, S, 0, 421, 0);
  return { top: F.at(0, 421, 0) };
}
export function marina101(F, S) {   // the tall square tower, its crown a frame of light
  F.add(win(S, 40, 400, 40), S.win, 0, 0, 0, 1, 1, 1, 0, 0, 0, S.cGlass);
  for (const y of [404, 412, 420]) F.box(S.glow, S.cCrown, 0, y, 0, 42, 1.2, 42);
  lamp(F, S, 0, 426, 0);
  return { top: F.at(0, 426, 0) };
}
export function addressSkyView(F, S) {   // two towers joined high up by a bridge with its pool
  F.add(win(S, 30, 237, 30), S.win, -30, 0, 0, 1, 1, 1, 0, 0, 0, S.cGlass);
  F.add(win(S, 28, 210, 28), S.win, 30, 0, 0, 1, 1, 1, 0, 0, 0, S.cGlass);
  F.box(S.glass, S.cGlassHi || S.cGlass, 0, 200, 0, 40, 14, 22); F.box(S.glow, S.cWin, 0, 200, 11.2, 38, 6, 0.3);
  F.box(S.glow, S.cCrown, -30, 240, 0, 24, 6, 24); lamp(F, S, -30, 245, 0);
  return { top: F.at(-30, 245, 0) };
}
export function etisalat(F, S) {   // a tower carrying its great golf ball
  F.add(win(S, 34, 160, 34), S.win, 0, 0, 0, 1, 1, 1, 0, 0, 0, S.cGlass);
  F.cyl(S.wall, S.cWhite, 0, 166, 0, 6, 12, 'cyl8');
  F.ell(S.glow, S.cBall, 0, 186, 0, 22, 22, 22);
  lamp(F, S, 0, 210, 0);
  return { top: F.at(0, 210, 0) };
}
export function theOpus(F, S) {   // a glass cube with a void blown through its middle
  F.add(win(S, 80, 30, 50), S.win, 0, 0, 0, 1, 1, 1, 0, 0, 0, S.cGlass);
  F.add(win(S, 80, 26, 50), S.win, 0, 64, 0, 1, 1, 1, 0, 0, 0, S.cGlass);
  for (const e of [-1, 1]) F.add(win(S, 24, 34, 50), S.win, e * 28, 30, 0, 1, 1, 1, 0, 0, 0, S.cGlass);
  F.add(G.sph, S.glow, 0, 47, 0, 32, 30, 48, 0, 0, 0, S.cArch);   // the void, lit
  return { top: F.at(0, 90, 0) };
}
// a plain tower for the rest of the skyline: windows, a crown on some, the red lamp
export function plainTower(F, S, { w = 30, d = 30, h = 160, crown = pick(['lit', 'spire', 'step', null]), col = S.cGlass } = {}) {
  F.add(win(S, w, h, d), S.win, 0, 0, 0, 1, 1, 1, 0, 0, 0, col);
  let top = h;
  if (crown === 'lit') { F.box(S.glow, S.cCrown, 0, h + 2, 0, w + 0.6, 4, d + 0.6); top += 4; }
  else if (crown === 'spire') { F.add(taperGeo(0.1, 6), S.glass, 0, h + 20, 0, w * 0.6, 40, d * 0.6, 0, 0, 0, col); top += 40; }
  else if (crown === 'step') { F.add(win(S, w * 0.7, h * 0.15, d * 0.7), S.win, 0, h, 0, 1, 1, 1, 0, 0, 0, col); top += h * 0.15; }
  lamp(F, S, 0, top + 1, 0);
  return { top: F.at(0, top, 0) };
}

// ---------- the Jumeirah Mosque ----------
// the Fatimid revival: a long hall of carved stone under its great dome and the smaller ones, the arcade in front, the
// two minarets with their two balconies each; floodlit, warm white
export function jumeirahMosque(F, S, { lo = false } = {}) {
  const st = S.cStone;
  F.block(S.wall, st, 0, 0, 0, 44, 13, 30);
  F.box(S.wall, S.cStoneHi || st, 0, 13.6, 0, 45, 1.2, 31);
  for (let k = 0; k < 9; k++) { const x = -20 + k * 5; F.box(S.glow, S.cWin, x, 5.5, 15.1, 2.4, 6, 0.3); F.add(G.cyl, S.glow, x, 8.5, 15.1, 2.4, 0.3, 2.4, Math.PI / 2, 0, 0, S.cWin); }
  if (!lo) for (let k = 0; k < 22; k++) F.add(G.cone4, S.wall, -21 + k * 2, 14.8, 15, 1.2, 1.4, 0.6, 0, 0, 0, S.cStoneHi || st);   // the carved cresting
  F.add(G.cyl8, S.wall, 0, 16.5, 0, 16, 5, 16, 0, Math.PI / 8, 0, st);
  F.add(HALF, S.wall, 0, 19, 0, 17, 15, 17, 0, 0, 0, S.cStoneHi || st);
  for (const e of [-1, 1]) F.add(HALF, S.wall, e * 13, 14.2, 0, 8, 6.5, 8, 0, 0, 0, S.cStoneHi || st);
  for (const e of [-1, 1]) {   // the minarets
    const x = e * 20, z = 13;
    F.block(S.wall, st, x, 0, z, 5, 18, 5);
    F.add(G.cyl8, S.wall, x, 25, z, 4, 14, 4, 0, Math.PI / 8, 0, st);
    F.add(G.cyl8, S.wall, x, 32.3, z, 5.4, 0.8, 5.4, 0, Math.PI / 8, 0, S.cStoneHi || st);
    F.add(G.cyl8, S.wall, x, 37, z, 3.2, 9, 3.2, 0, Math.PI / 8, 0, st);
    F.add(G.cyl8, S.wall, x, 41.8, z, 4.4, 0.7, 4.4, 0, Math.PI / 8, 0, S.cStoneHi || st);
    F.add(HALF, S.wall, x, 42.2, z, 3.4, 4, 3.4, 0, 0, 0, S.cStoneHi || st);
    F.cyl(S.metal, S.cGoldK || S.cSteel, x, 47, z, 0.15, 2, 'cyl6');
  }
  return { top: F.at(0, 48, 0) };
}

// ---------- Al Fahidi Fort (the Dubai Museum) ----------
// the old fort of coral stone and gypsum: its square walls, the round tower at one corner and the square one at the other,
// the crenellations, the wooden gate, the tall wind tower inside
export function fahidiFort(F, S) {
  const st = S.cStone, hi = S.cStoneHi || st;
  for (const [x, z, w, d] of [[0, -16, 34, 3], [0, 16, 34, 3], [-16, 0, 3, 34], [16, 0, 3, 34]]) {
    F.block(S.wall, st, x, 0, z, w, 8, d);
    for (let k = 0; k < Math.max(w, d) / 1.6; k++) F.add(G.cone4, S.wall, x + (w > d ? -w / 2 + 0.8 + k * 1.6 : 0), 8.6, z + (w > d ? 0 : -d / 2 + 0.8 + k * 1.6), 1, 1.2, 1, 0, 0, 0, hi);
  }
  F.add(G.cyl, S.wall, 16, 6.5, 16, 9, 13, 9, 0, 0, 0, st); F.add(G.cyl, S.wall, 16, 13.3, 16, 9.8, 0.8, 9.8, 0, 0, 0, hi);   // the round tower
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; F.add(G.cone4, S.wall, 16 + Math.cos(a) * 4.2, 14.2, 16 + Math.sin(a) * 4.2, 1, 1.2, 1, 0, 0, 0, hi); }
  F.block(S.wall, st, -16, 0, -16, 8, 15, 8);   // the square tower
  F.box(S.dark || S.wall, S.cDoor, 0, 2.2, 17.6, 4, 4.4, 0.3);   // the gate
  F.block(S.wall, st, -4, 0, -4, 4, 22, 4);   // the wind tower inside
  for (let k = -1; k <= 1; k++) for (const [dx, dz] of [[2.05, 0], [-2.05, 0], [0, 2.05], [0, -2.05]]) F.box(S.dark || S.wall, S.cDoor, -4 + dx + (dz ? k * 1.1 : 0), 18, -4 + dz + (dx ? k * 1.1 : 0), dx ? 0.1 : 0.5, 6, dz ? 0.1 : 0.5);
  return { top: F.at(-4, 22, -4) };
}

// ---------- a tower crane ----------
export function crane(F, S, { h = 120, jib = 60, ry = rand(0, Math.PI * 2) } = {}) {
  F.block(S.crane || S.wall, S.cCrane, 0, 0, 0, 4, h, 4);
  const c = Math.cos(ry), sn = Math.sin(ry);
  F.beam(S.crane || S.wall, S.cCrane, [-jib * 0.3 * c, h + 4, jib * 0.3 * sn], [jib * c, h + 4, -jib * sn], 2.2);
  F.block(S.crane || S.wall, S.cCrane, 0, h, 0, 3, 10, 3);
  lamp(F, S, jib * c, h + 5.5, -jib * sn, 1.4); lamp(F, S, 0, h + 11, 0, 1.4);
  return { top: F.at(0, h + 11, 0) };
}
