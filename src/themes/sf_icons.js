// San Francisco's icons, each modelled once in its own frame (see ny_icons.js `frame`) so it can stand lit in a scene or
// unlit on the far skyline with its shading baked: the Golden Gate Bridge's towers and cables, Sutro Tower, the
// Transamerica Pyramid, Salesforce Tower and its neighbours, Coit Tower, Alcatraz and its lighthouse, the Bay Bridge,
// the Ferry Building's clock tower. S is the style: materials (paint, wall, glass, glow, dark, metal) and colours (c...).
import { THREE, G, canvasTex, rand, randi, pick } from '../core.js';
import { taperGeo, frustum4 } from './ny_icons.js';

// ---------- the Golden Gate ----------
// One tower in its own units: the roadway at y = 0, the bridge running along z, the legs either side of the deck at
// x = ±legX. Half the real height (the roadway to the top of the saddles), the portals' stepped struts, the legs'
// flutes and setbacks; under the deck a strut and the cross-bracing down into the water (foot: how far the legs go on).
export const GG = { legX: 12.4, top: 80, saddle: 81.2, struts: [[22.5, 25.5], [38, 40.6], [52.6, 55], [65.4, 67.6]] };
export function ggTower(F, S, { foot = 70, lamp = null } = {}) {
  const X = GG.legX, sec = [[-foot, 22.5, 3.7, 5.8], [22.5, 38, 3.4, 5.4], [38, 52.6, 3.1, 5.0], [52.6, 65.4, 2.9, 4.6], [65.4, GG.top, 2.7, 4.3]];
  for (const e of [-1, 1]) for (const [y0, y1, w, d] of sec) {
    F.box(S.paint, S.cOrange, e * X, (y0 + y1) / 2, 0, w, y1 - y0, d);
    for (const f of [-1, 1]) for (const r of [-0.27, 0.27]) F.box(S.paint, S.cOrange2, e * X + r * w, (Math.max(y0, -12) + y1) / 2, f * (d / 2 + 0.07), w * 0.17, y1 - Math.max(y0, -12), 0.16);   // the flutes
    F.box(S.paint, S.cOrange2, e * X, y1 - 0.35, 0, w + 0.36, 0.7, d + 0.36);   // the setback ledge
  }
  for (const [y0, y1] of GG.struts) {   // the portals: a strut between the legs, stepped in under it at the corners
    F.box(S.paint, S.cOrange, 0, (y0 + y1) / 2, 0, 2 * X - 2.6, y1 - y0, 3.8);
    F.box(S.paint, S.cOrange2, 0, y0 - 0.45, 0, 2 * X - 7, 0.9, 3.4);
    for (const e of [-1, 1]) { F.box(S.paint, S.cOrange, e * (X - 2.9), y0 - 1.0, 0, 1.8, 2.0, 3.6); F.box(S.paint, S.cOrange2, e * (X - 4.2), y0 - 0.45, 0, 1.0, 0.9, 3.5); }
  }
  F.box(S.paint, S.cOrange, 0, GG.top - 1.4, 0, 2 * X + 2.2, 2.8, 4.6);   // the crown
  for (const e of [-1, 1]) {
    F.box(S.paint, S.cOrange2, e * X, GG.saddle - 0.4, 0, 3.0, 2.2, 5.6);   // the saddle's housing the cable rides over
    if (lamp) F.box(lamp.mat, lamp.col, e * X, GG.saddle + 1.1, 0, 0.9, 0.9, 0.9);   // the aircraft lamp
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
// Square, of pale stone, its arched openings, the four clock faces, the stages narrowing to the lantern and its flagpole.
export function ferryTower(F, S, { clock = null, foot = 0 } = {}) {
  F.box(S.wall, S.cStone, 0, (34 - foot) / 2, 0, 11, 34 + foot, 11);
  for (const [y, h] of [[12, 8], [24, 7]]) for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2, c = Math.cos(a), s = Math.sin(a); for (const o of [-2.6, 0, 2.6]) F.box(S.glow, S.cArch, c * 5.55 - s * o, y, s * 5.55 + c * o, 0.2 + Math.abs(s) * 1.4, h, 0.2 + Math.abs(c) * 1.4); }
  F.box(S.wall, S.cStone2, 0, 34.5, 0, 12.2, 1.2, 12.2);
  F.box(S.wall, S.cStone, 0, 40, 0, 9.4, 10, 9.4);
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; F.add(G.cyl, clock ? clock.mat : S.glow, Math.sin(a) * 4.75, 40.4, Math.cos(a) * 4.75, 6.4, 0.2, 6.4, Math.PI / 2, a, 0, clock ? 0xffffff : S.cClock); }
  F.box(S.wall, S.cStone2, 0, 45.4, 0, 10.4, 0.9, 10.4);
  F.box(S.wall, S.cStone, 0, 49, 0, 7.6, 6.4, 7.6);
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; F.box(S.glow, S.cArch, Math.sin(a) * 3.85, 49, Math.cos(a) * 3.85, 0.2 + Math.abs(Math.cos(a)) * 2.6, 4.4, 0.2 + Math.abs(Math.sin(a)) * 2.6); }
  F.add(G.cyl8, S.wall, 0, 54.8, 0, 6.4, 5, 6.4, 0, Math.PI / 8, 0, S.cStone);
  F.add(G.cone8, S.wall, 0, 59.4, 0, 6.6, 4.4, 6.6, 0, Math.PI / 8, 0, S.cStone2);
  F.cyl(S.metal, S.cDark, 0, 66, 0, 0.12, 9, 'cyl6');
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
