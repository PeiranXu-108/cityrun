// San Francisco's icons, each modelled once in its own frame (see ny_icons.js `frame`) so it can stand lit in a scene or
// unlit on the far skyline with its shading baked: the Golden Gate Bridge's towers and cables, Sutro Tower, the
// Transamerica Pyramid, Salesforce Tower and its neighbours, Coit Tower, Alcatraz and its lighthouse, the Bay Bridge,
// the Ferry Building's clock tower. S is the style: materials (paint, wall, glass, glow, dark, metal) and colours (c...).
import { THREE, G, canvasTex, rand, randi, pick } from '../core.js';
import { taperGeo, frustum4, frame, figure } from './ny_icons.js';

// ---------- the Golden Gate ----------
// One tower in its own units: the roadway at y = 0, the bridge running along z, the legs either side of the deck at
// x = ±legX. Half the real height (the roadway to the top of the saddles). The legs set back at each portal, a pair of
// flutes running up every face; the portals' struts faced with a row of upright chevrons, stepped down into the legs
// under them in four corbels; the crown's two struts, the saddles' round-backed housings the cables ride over; under
// the deck a strut and the cross-bracing down into the water (foot: how far the legs go on).
export const GG = { legX: 12.4, top: 80, saddle: 81.2, struts: [[22.5, 25.5], [38, 40.6], [52.6, 55], [65.4, 67.6]] };
export function ggTower(F, S, { foot = 70, lamp = null } = {}) {
  const X = GG.legX, sec = [[-foot, 22.5, 3.7, 5.8], [22.5, 38, 3.4, 5.4], [38, 52.6, 3.1, 5.0], [52.6, 65.4, 2.9, 4.6], [65.4, GG.top, 2.7, 4.3]];
  for (const e of [-1, 1]) for (const [y0, y1, w, d] of sec) {
    const ya = Math.max(y0, -12);
    F.box(S.paint, S.cOrange, e * X, (y0 + y1) / 2, 0, w, y1 - y0, d);
    for (const r of [-0.27, 0.27]) for (const f of [-1, 1]) {   // the flutes, on all four faces
      F.box(S.paint, S.cOrange2, e * X + r * w, (ya + y1) / 2, f * (d / 2 + 0.07), w * 0.17, y1 - ya, 0.16);
      F.box(S.paint, S.cOrange2, e * X + f * (w / 2 + 0.07), (ya + y1) / 2, r * d, 0.16, y1 - ya, d * 0.12);
    }
    F.box(S.paint, S.cOrange2, e * X, y1 - 0.35, 0, w + 0.36, 0.7, d + 0.36);   // the setback ledge
  }
  const strut = (y0, y1, dz = 3.8) => {   // a strut between the legs, the chevrons up its faces
    const L = 2 * X - 2.6, n = Math.round(L / 1.5);
    F.box(S.paint, S.cOrange, 0, (y0 + y1) / 2, 0, L, y1 - y0, dz);
    for (let k = 0; k < n; k++) for (const f of [-1, 1]) F.box(S.paint, S.cOrange2, -L / 2 + (k + 0.5) * (L / n), (y0 + y1) / 2 + 0.1, f * dz / 2, 0.75, y1 - y0 - 0.2, 0.75, Math.PI / 4);
  };
  for (const [y0, y1] of GG.struts) {   // the portals: each strut stepped down into the legs under it
    strut(y0, y1);
    F.box(S.paint, S.cOrange2, 0, y0 - 0.45, 0, 2 * X - 7, 0.9, 3.4);
    for (const e of [-1, 1]) for (let k = 0; k < 4; k++) F.box(S.paint, k % 2 ? S.cOrange2 : S.cOrange, e * (X - 2.1 - k * 0.75), y0 - (2.6 - k * 0.6) / 2, 0, 0.75, 2.6 - k * 0.6, 3.6 - k * 0.1);
  }
  strut(GG.top - 2.8, GG.top, 4.6); strut(GG.top - 6.4, GG.top - 4.6, 4.2);   // the crown's two struts
  F.box(S.paint, S.cOrange2, 0, GG.top - 3.7, 0, 2 * X - 4, 1.8, 3.6);
  for (const e of [-1, 1]) {
    F.box(S.paint, S.cOrange2, e * X, GG.saddle - 0.6, 0, 3.0, 1.8, 5.6);   // the saddle's housing, its round back, the aircraft lamp on it
    F.add(G.cyl, S.paint, e * X, GG.saddle + 0.3, 0, 3.0, 5.6, 1.6, Math.PI / 2, 0, 0, S.cOrange2);
    if (lamp) F.box(lamp.mat, lamp.col, e * X, GG.saddle + 1.4, 0, 0.9, 0.9, 0.9);
  }
  F.box(S.paint, S.cOrange, 0, -6.5, 0, 2 * X - 2.6, 2.6, 3.8);   // under the deck: a strut, the X bracing
  for (const e of [-1, 1]) F.beam(S.paint, S.cOrange, [-e * (X - 1.6), -8, 0], [e * (X - 1.6), -Math.min(foot, 40), 0], 1.5, 1.5);
}
// a main cable along points [x, y, z], as a run of cylinders of radius r
export function cable(F, mat, col, pts, r = 0.45) {
  for (let i = 1; i < pts.length; i++) F.span(CYL8, mat, col, pts[i - 1], pts[i], r * 2);
}
const CYL8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);

// ---------- Sutro Tower ----------
// Three legs splayed on Twin Peaks, drawn in to the waist and up to the platform; three masts above it; red and white
// in bands, the lamps on the masts.
export function sutro(F, S, { foot = 0, lamp = null } = {}) {
  const A = [0, 1, 2].map((k) => (k / 3) * Math.PI * 2 + Math.PI / 2), P = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
  const rAt = (y) => (y < 160 ? 34 - (25 * y) / 160 : 9 - (2 * (y - 160)) / 70);
  for (const a of A) {
    const ys = [-foot, 20, 45, 70, 95, 120, 145, 170, 200, 230];
    for (let k = 1; k < ys.length; k++) F.limb(S.paint, k % 2 ? S.cRed : S.cWhite, P(a, rAt(Math.max(0, ys[k - 1])) + (ys[k - 1] < 0 ? 4 : 0), ys[k - 1]), P(a, rAt(ys[k]), ys[k]), 2.2, 1.9, 6);
    for (const [y0, y1] of [[230, 250], [250, 270], [270, 298]]) F.limb(S.paint, y0 === 250 ? S.cWhite : S.cRed, P(a, 7, y0), P(a, 7, y1), 0.9, 0.7, 6);   // the mast
    if (lamp) F.box(lamp.mat, lamp.col, ...P(a, 7, 299), 2.2, 2.2, 2.2);
  }
  for (const y of [60, 110, 160, 195, 230]) for (let k = 0; k < 3; k++) F.beam(S.paint, S.cWhite, P(A[k], rAt(y), y), P(A[(k + 1) % 3], rAt(y), y), 1.6, 1.6);   // the braces
  F.box(S.paint, S.cWhite, 0, 231, 0, 18, 3, 18);   // the platform
}

// ---------- downtown ----------
// a tower drawn with the skyline's window texture tiled round it: geo is a cylinder (n sides) whose UVs are scaled to the floors
const winCyl = new Map();
export function windowed(ratio, n, w, h, cell = [3.4, 4.2], texCells = [8, 16]) {
  const key = `${ratio}|${n}|${w}|${h}`;
  if (!winCyl.has(key)) {
    const c = new THREE.CylinderGeometry(0.5 * ratio, 0.5, 1, n, 1, false);
    if (n === 4) c.rotateY(Math.PI / 4).scale(Math.SQRT2, 1, Math.SQRT2);   // a square, its faces square to the axes, a unit wide
    const g = c.toNonIndexed(), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * Math.PI * w) / cell[0] / texCells[0], (uv.getY(i) * h) / cell[1] / texCells[1]);
    winCyl.set(key, g);
  }
  return winCyl.get(key);
}
export function transamerica(F, S, { foot = 0 } = {}) {   // the pyramid: its four sloping faces, the wings rising up two sides, the spire, the lamp at its tip
  F.addM(frustum4(10, 48, 200 + foot), S.wall, new THREE.Matrix4().makeTranslation(0, -foot, 0), S.cWhite);
  F.addM(frustum4(0.8, 10, 60), S.wall, new THREE.Matrix4().makeTranslation(0, 200, 0), S.cWhite);
  for (const e of [-1, 1]) for (const [y0, y1, x] of [[-foot, 70, 21], [70, 140, 15], [140, 212, 9]]) F.box(S.wall, S.cWhite2, e * x, (y0 + y1) / 2, 0, 6, y1 - y0, 12);
  const side = (y) => 10 + (38 * (200 - y)) / 200;
  for (let y = 14; y < 196; y += 9) F.addM(frustum4(+(side(y + 0.9) + 0.35).toFixed(2), +(side(y) + 0.35).toFixed(2), 0.9), S.glow, new THREE.Matrix4().makeTranslation(0, y, 0), S.cWin);   // lit floors
  F.box(S.glow, S.cRed, 0, 261, 0, 1.2, 1.2, 1.2);
}
export function salesforce(F, S, mat, { foot = 0 } = {}) {   // the rounded obelisk, its crown of light
  F.addM(windowed(0.84, 12, 52, 290 + foot), mat, new THREE.Matrix4().compose(new THREE.Vector3(0, (290 - foot) / 2, 0), new THREE.Quaternion(), new THREE.Vector3(52, 290 + foot, 52)), S.cGlassTower);
  F.add(taperGeo(0.9, 12), S.glow, 0, 308, 0, 43, 36, 43, 0, 0, 0, S.cCrown);
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; F.box(S.wall, S.cWhite2, Math.cos(a) * 21.6, 308, Math.sin(a) * 21.6, 1.6, 36, 1.6, -a); }
  F.box(S.wall, S.cWhite2, 0, 326.5, 0, 38, 1.2, 38);
}
export function tower(F, S, mat, { w = 40, d = 34, h = 200, col = '#ffffff', crown = null, foot = 0, taper = 1 } = {}) {   // a plainer tower: a box of lit windows, a crown on some
  F.addM(windowed(taper, 4, (w + d) / 2, h + foot), mat, new THREE.Matrix4().compose(new THREE.Vector3(0, (h - foot) / 2, 0), new THREE.Quaternion(), new THREE.Vector3(w, h + foot, d)), col);
  if (crown === 'lit') F.box(S.glow, S.cCrown, 0, h + 4, 0, w * 0.7 * taper, 8, d * 0.7 * taper);
  else if (crown === 'brace') for (const e of [-1, 1]) F.beam(S.wall, S.cWhite2, [-w / 2 * taper, h - 30, e * d / 2 * taper], [w / 2 * taper, h + 6, e * d / 2 * taper], 1.4, 1.4);
}
export function california555(F, S, { foot = 0 } = {}) {   // dark granite, its face folded into bay windows all the way up
  F.box(S.dark, S.cGranite, 0, (237 - foot) / 2, 0, 42, 237 + foot, 64);
  for (let k = -5; k <= 5; k++) F.add(G.box, S.dark, -21.5, (237 - foot) / 2, k * 5.6, 2.4, 237 + foot, 2.4, 0, Math.PI / 4, 0, S.cGranite2);
  for (let y = 10; y < 230; y += 8) for (let k = -5; k <= 5; k += 2) F.box(S.glow, S.cWin, -22.4, y, k * 5.6, 0.2, 1.4, 2.0);
}

// ---------- Coit Tower ----------
// The fluted column on Telegraph Hill: its base building, the shaft, the arcade of the viewing gallery near the top.
export function coit(F, S, { foot = 0 } = {}) {
  F.cyl(S.wall, S.cStone, 0, (8 - foot) / 2, 0, 15, 8 + foot, 'cyl');
  F.cyl(S.wall, S.cStone, 0, 8 + 23, 0, 5.6, 46, 'cyl');
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; F.box(S.wall, S.cStone2, Math.cos(a) * 5.6, 8 + 21, Math.sin(a) * 5.6, 0.9, 42, 0.9, -a); }   // the flutes
  F.cyl(S.wall, S.cStone, 0, 58, 0, 5.9, 8, 'cyl');
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; F.box(S.glow, S.cArch, Math.cos(a) * 5.95, 57.5, Math.sin(a) * 5.95, 0.2, 5, 2.2, -a); }   // the gallery's arches, lit
  F.cyl(S.wall, S.cStone2, 0, 62.6, 0, 6.3, 1.2, 'cyl');
  F.cyl(S.wall, S.cStone, 0, 64, 0, 4.4, 1.6, 'cyl');
}

// ---------- Alcatraz ----------
// The rock, the long cellhouse on its top, the water tower on its legs, the lighthouse (its beam is added by the caller).
export function alcatraz(F, S, { foot = 0 } = {}) {
  F.add(G.sphLow, S.dark, 0, -foot * 0.5, 0, 170, 52 + foot, 80, 0, 0.2, 0, S.cRock);
  F.box(S.wall, S.cCell, 8, 26, -2, 70, 14, 22);
  for (let k = 0; k < 14; k++) F.box(S.glow, S.cWin, 8 - 32 + k * 5, 27, 9.1, 1.6, 4, 0.2);
  F.box(S.wall, S.cCell, -30, 18, 8, 22, 10, 14);
  for (const [x, z] of [[40, -10], [44, -4], [40, 2], [36, -4]]) F.limb(S.paint, S.cDark, [x, 22, z], [40, 40, -4], 0.6, 0.5, 5);
  F.cyl(S.paint, S.cWhite2, 40, 44, -4, 6, 9, 'cyl');   // the water tower
  F.cyl(S.wall, S.cWhite, -12, 38, -10, 2.2, 22, 'cyl');   // the lighthouse
  F.cyl(S.glow, S.cLamp, -12, 50.5, -10, 2.4, 3, 'cyl');
  F.add(G.cone, S.dark, -12, 53.2, -10, 5.2, 2.6, 5.2, 0, 0, 0, S.cDark);
}

// ---------- the Bay Bridge ----------
// The western span, from the city's end to Yerba Buena: the deck on its piers, four silver towers, the main cables
// swinging between them; returns the points along the vertical cables where the Bay Lights' LEDs hang.
export function bayBridge(F, S, { L = 900, towers = [0.12, 0.36, 0.64, 0.88], H = 160, deck = 60 } = {}) {
  F.box(S.metal, S.cSteel, 0, deck, L / 2, 32, 10, L);
  for (let k = 0; k <= 10; k++) F.box(S.dark, S.cSteel2, 0, (deck - 4 - 60) / 2, (L * k) / 10, 12, deck - 4 + 60, 8);   // the piers
  const pts = [];
  for (const t of towers) {
    const z = L * t;
    for (const e of [-1, 1]) F.box(S.metal, S.cSteel, e * 14, (deck + H) / 2, z, 4.2, H - deck, 6);
    for (const y of [deck + 30, deck + 70, H - 6]) F.box(S.metal, S.cSteel, 0, y, z, 28, 4, 5);
  }
  // the cables: a sag between each pair of towers, down to the deck at the ends
  const tz = towers.map((t) => L * t), spans = [[0, tz[0], deck + 2, H], [tz[0], tz[1], H, H], [tz[2], tz[3], H, H], [tz[3], L, H, deck + 2]];
  for (const e of [-1, 1]) for (const [z0, z1, y0, y1] of spans) {
    const p = [];
    for (let k = 0; k <= 12; k++) { const t = k / 12, z = z0 + (z1 - z0) * t, y = y0 + (y1 - y0) * t - (y0 === y1 ? (H - deck - 8) * 4 * t * (1 - t) : 0); p.push([e * 14, y, z]); if (e > 0 && k % 1 === 0) for (let j = 1; j <= 5; j++) pts.push(F.at(e * 14, deck + 5 + ((y - deck - 5) * j) / 6, z)); }
    cable(F, S.metal, S.cSteel, p, 1.4);
  }
  F.box(S.dark, S.cSteel2, 0, (deck + H) / 2 - 20, (tz[1] + tz[2]) / 2, 26, H - deck + 40, 60);   // the anchorage in the middle
  return pts;
}

// ---------- the Ferry Building's clock tower ----------
// After the photographs, its foot on the hall's roof at y = 0: the square shaft, pilaster strips up its corners and a line
// of little windows up each face; the clock high on every face in its frame; the attic's square windows, the cornice;
// the open belfry, piers at its corners and two columns a face, the balustrade along its foot; the stepped stage and its
// urns; the smaller open stage; the round lantern of columns, its dome and ball; the flagpole.
export function ferryTower(F, S, { clock = null, foot = 0 } = {}) {
  const W = 11, wall = S.wall, st = S.cStone, st2 = S.cStone2, dark = '#2a2622';
  const face = (k, o, y, d) => { const a = (k * Math.PI) / 2; return [Math.sin(a) * d + Math.cos(a) * o, y, Math.cos(a) * d - Math.sin(a) * o]; };
  F.box(wall, st, 0, (27 - foot) / 2, 0, W, 27 + foot, W);
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    for (const o of [-W / 2 + 0.95, W / 2 - 0.95]) F.box(wall, st2, ...face(k, o, 13.5, W / 2 + 0.06), 0.5, 26.4, 0.12, a);   // the pilaster strips
    for (const y of [5, 8.5, 12, 15.5]) F.box(S.glow, S.cArch, ...face(k, 0, y, W / 2 + 0.03), 0.7, 1.4, 0.06, a);   // the little windows
    F.add(G.cyl, wall, ...face(k, 0, 20.4, W / 2 + 0.08), 7.6, 0.16, 7.6, Math.PI / 2, a, 0, st2);   // the clock in its frame
    F.add(G.cyl, clock ? clock.mat : S.glow, ...face(k, 0, 20.4, W / 2 + 0.2), 6.6, 0.06, 6.6, Math.PI / 2, a, 0, clock ? 0xffffff : S.cClock);
    for (let j = 0; j < 6; j++) F.box(S.dark, S.cDark, ...face(k, -3.5 + j * 1.4, 25.6, W / 2 + 0.04), 0.7, 0.8, 0.06, a);   // the attic's square windows
    for (const o of [-1.6, 1.6]) F.cyl(wall, st, ...face(k, o, 31.4, W / 2 - 0.9), 0.32, 6.6, 'cyl8');   // the belfry's columns, its balustrade
    F.box(wall, st2, ...face(k, 0, 28.6, W / 2 - 0.65), W - 1.8, 0.9, 0.3, a);
    F.cyl(wall, st, ...face(k, 0, 40.1, 2.95), 0.26, 5.0, 'cyl8');   // the upper stage's column
  }
  F.box(wall, st2, 0, 27.3, 0, W + 1.4, 0.8, W + 1.4); F.box(wall, st, 0, 27.9, 0, W + 0.8, 0.4, W + 0.8);   // the cornice
  F.box(S.dark, dark, 0, 31.4, 0, W - 2.6, 6.6, W - 2.6);   // the belfry: its dark core, the piers at its corners, the entablature
  for (const ex of [-1, 1]) for (const ez of [-1, 1]) F.box(wall, st, ex * (W / 2 - 0.9), 31.4, ez * (W / 2 - 0.9), 1.6, 6.6, 1.6);
  F.box(wall, st2, 0, 35.1, 0, W + 0.4, 0.9, W + 0.4);
  F.box(wall, st, 0, 36.5, 0, W - 1.8, 1.9, W - 1.8);   // the stepped stage, the urns round it
  for (const ex of [-1, 1]) for (const ez of [-1, 1]) { F.ell(wall, st2, ex * (W / 2 - 0.5), 36.0, ez * (W / 2 - 0.5), 0.42, 0.55, 0.42, true); F.ell(wall, st2, ex * 3.1, 43.85, ez * 3.1, 0.3, 0.4, 0.3, true); }
  F.box(S.dark, dark, 0, 40.1, 0, 4.4, 5.0, 4.4);   // the upper open stage: its core, its corner piers, its entablature
  for (const ex of [-1, 1]) for (const ez of [-1, 1]) F.box(wall, st, ex * 2.7, 40.1, ez * 2.7, 1.1, 5.0, 1.1);
  F.box(wall, st2, 0, 42.95, 0, 6.8, 0.7, 6.8);
  F.cyl(wall, st2, 0, 43.6, 0, 2.5, 0.5, 'cyl');   // the round lantern: a ring of columns round its core, the cornice, the dome, the ball, the flagpole
  F.cyl(S.dark, dark, 0, 45.5, 0, 1.5, 3.4, 'cyl8');
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; F.cyl(wall, st, Math.cos(a) * 2.0, 45.5, Math.sin(a) * 2.0, 0.17, 3.4, 'cyl6'); }
  F.cyl(wall, st2, 0, 47.4, 0, 2.6, 0.5, 'cyl');
  F.ell(wall, st, 0, 47.6, 0, 2.2, 2.6, 2.2);
  F.cyl(wall, st2, 0, 50.5, 0, 0.45, 0.8, 'cyl8'); F.ell(wall, st2, 0, 51.2, 0, 0.5, 0.5, 0.5, true);
  F.cyl(S.metal, S.cDark, 0, 56.4, 0, 0.12, 9.6, 'cyl6');
}
// the Ferry Building's clock face: white with black numerals and hands at a quarter to eight
export function clockTex() {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#f8f2e4'; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#1a1a1a'; g.lineWidth = 4; g.stroke();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.fillStyle = '#1a1a1a'; g.fillRect(64 + Math.sin(a) * 50 - 2, 64 - Math.cos(a) * 50 - 6, 4, 12); }
    g.lineCap = 'round'; g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(7.75 / 12 * Math.PI * 2) * 30, 64 - Math.cos(7.75 / 12 * Math.PI * 2) * 30); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(0.75 * Math.PI * 2) * 46, 64 - Math.cos(0.75 * Math.PI * 2) * 46); g.stroke();
  }, { repeat: false });
}

// ---------- the Palace of Fine Arts ----------
// The rotunda, its frame on the water at y = 0: eight piers round an open octagon, each faced with a pair of Corinthian
// columns (terracotta shafts, buff capitals); an arch springing between each two, the wall over it; the entablature;
// the attic, its relief panels between the corner blocks, a draped figure on each looking out; the drum, its band, and
// the low pale dome. K: the street kit (its columns).
export function rotunda(F, S, K, { R = 11, H = 14.5, figF = F } = {}) {   // figF: where its figures go (a frame on a batcher whose reflection is not drawn)
  const wall = S.wall, buff = '#ecd0ac', buff2 = '#dcb690', red = '#b0604a', A = (k) => (k / 8) * Math.PI * 2 + Math.PI / 8, ap = R * Math.cos(Math.PI / 8);
  for (let k = 0; k < 8; k++) {
    const a = A(k), c = Math.cos(a), s = Math.sin(a), ry = Math.PI / 2 - a;
    F.box(wall, buff2, c * R, H / 2, s * R, 2.6, H, 2.6, ry);   // the pier, its pair of columns
    for (const o of [-0.85, 0.85]) K.column(F, wall, c * (R + 1.05) + s * o, 0, s * (R + 1.05) - c * o, H, 0.5, red, { top: buff });
    const am = a + Math.PI / 8, cm = Math.cos(am), sm = Math.sin(am), w = 2 * R * Math.sin(Math.PI / 8) - 2.6, r = w / 2, ys = H - 1.6 - r;   // the arch to the next pier, the wall over it
    F.box(wall, buff2, cm * ap, (ys + r - 0.3 + H) / 2, sm * ap, w + 0.3, H - ys - r + 0.3, 1.2, Math.PI / 2 - am);
    for (let j = 0; j < 8; j++) { const m = (Math.PI * (j + 0.5)) / 8; F.add(G.box, wall, cm * (ap + 0.65) + sm * Math.cos(m) * (r + 0.2), ys + Math.sin(m) * (r + 0.2), sm * (ap + 0.65) - cm * Math.cos(m) * (r + 0.2), (r + 0.2) * 0.42, 0.45, 0.3, 0, Math.PI / 2 - am, m + Math.PI / 2, buff); }
  }
  F.add(G.cyl8, wall, 0, H + 0.6, 0, 2 * (R + 1.7), 1.2, 2 * (R + 1.7), 0, Math.PI / 8, 0, buff2);   // the architrave and frieze, the cornice
  F.add(G.cyl8, wall, 0, H + 1.45, 0, 2 * (R + 2.1), 0.5, 2 * (R + 2.1), 0, Math.PI / 8, 0, buff);
  F.add(G.cyl8, wall, 0, H + 3.7, 0, 2 * (R + 0.6), 4.0, 2 * (R + 0.6), 0, Math.PI / 8, 0, buff2);   // the attic
  for (let k = 0; k < 8; k++) {
    const a = A(k), c = Math.cos(a), s = Math.sin(a), am = a + Math.PI / 8, cm = Math.cos(am), sm = Math.sin(am), fa = (R + 0.6) * Math.cos(Math.PI / 8);
    F.box(wall, buff, c * (R + 1.0), H + 3.7, s * (R + 1.0), 2.2, 4.0, 2.2, Math.PI / 2 - a);   // a corner block, the figure on it
    figure(frame(figF, c * (R + 1.0), H + 5.7, s * (R + 1.0), 1.15, -a), wall, buff, { arms: 'down', skirt: true, cloak: true });
    F.box(wall, '#c89c78', cm * (fa + 0.05), H + 3.6, sm * (fa + 0.05), 2 * (R + 0.6) * Math.sin(Math.PI / 8) - 2.8, 2.6, 0.12, Math.PI / 2 - am);   // the relief panel between them, the figures in it
    for (const o of [-1.2, -0.4, 0.4, 1.2]) F.box(wall, buff, cm * (fa + 0.14) + sm * o, H + 3.5 + (o === -0.4 || o === 0.4 ? 0.15 : 0), sm * (fa + 0.14) - cm * o, 0.42, 1.6 + Math.abs(o) * 0.2, 0.12, Math.PI / 2 - am);
  }
  F.cyl(wall, buff2, 0, H + 6.5, 0, R - 0.9, 1.8, 'cyl'); F.cyl(wall, '#c89c78', 0, H + 6.9, 0, R - 0.75, 0.5, 'cyl');   // the drum, its band
  F.ell(wall, '#e6d4be', 0, H + 7.2, 0, R - 1.3, 5.0, R - 1.3);   // the dome
}

// ---------- fog ----------
// a bank of fog: billows piled on a flat foot, thick in the middle, brighter along its top where the sun catches it
export function fogBankTex() {
  return canvasTex(512, 192, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let k = 0; k < 70; k++) {
      const x = rand(40, w - 40), y = rand(h * 0.42, h * 0.8), r = rand(22, 64) * (1 - Math.abs(x - w / 2) / w), gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const fade = g.createLinearGradient(0, 0, 0, h); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(0.85, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = fade; g.fillRect(0, 0, w, h);
  }, { repeat: false });
}
