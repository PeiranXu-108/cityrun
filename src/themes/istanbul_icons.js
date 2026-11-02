// Istanbul's icons, each modelled once in its own frame (ny_icons.js's frame()) so the same model can stand in a
// landmark scene, lit and in the fog, or out on the skyline, unlit with its shading baked: the imperial mosques
// (Süleymaniye, the Blue Mosque, Yeni Cami) built from one Ottoman plan of dome, semi-domes and pencil minarets, a
// neighbourhood mosque, Hagia Sophia with her buttresses and her flattened dome on its ring of windows, the Galata
// Tower, the Maiden's Tower on her rock, the Bosphorus Bridge, the Ortaköy Mosque, Dolmabahçe's clock tower and its
// Imperial Gate, and the Çamlıca hill across the water with its new mosque and its tulip of a television tower.
import { THREE, G } from '../core.js';
import { taperGeo } from './ny_icons.js';

export const HALF = new THREE.SphereGeometry(0.5, 18, 6, 0, Math.PI * 2, 0, Math.PI / 2);   // a dome, its base on y = 0
const SEMI = new THREE.SphereGeometry(0.5, 12, 5, 0, Math.PI, 0, Math.PI / 2);   // a semi-dome bulging toward +z
const OCT = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const CONE = new THREE.ConeGeometry(0.5, 1, 12);
// the far skyline's versions (a style with lo: true): fewer facets, no windows round the drums, no crescents
const LO = { HALF: new THREE.SphereGeometry(0.5, 10, 3, 0, Math.PI * 2, 0, Math.PI / 2), SEMI: new THREE.SphereGeometry(0.5, 6, 3, 0, Math.PI, 0, Math.PI / 2), CONE: new THREE.ConeGeometry(0.5, 1, 6) };
const geo = (S, k) => (S.lo ? LO[k] : { HALF, SEMI, CONE }[k]);

// a minaret: square base, a slender fluted shaft, one to three balconies (şerefe) on their stalactite corbels with lit
// railings, the upper shaft, the lead cone and the gilded crescent on top
export function minaret(F, S, x, z, h, { r = 1.0, n = 2, y = 0 } = {}) {
  F.block(S.wall, S.cWall, x, y, z, r * 2.7, h * 0.1, r * 2.7);
  const sg = S.lo ? 6 : 12, ring = S.lo ? 'cyl8' : 'cyl';
  if (!S.lo) F.add(taperGeo(0.94, 6), S.wall, x, y + h * 0.1 + h * 0.025, z, r * 2.7, h * 0.05, r * 2.7, 0, Math.PI / 6, 0, S.cWall);   // the base's bevel into the shaft
  const top = 0.5 + 0.13 * (n - 1) + 0.04, fs = Array.from({ length: n }, (_, k) => 0.5 + 0.13 * k + (n === 1 ? 0.2 : 0));
  const shaftTop = Math.max(top, fs[fs.length - 1] + 0.06);
  F.add(taperGeo(0.86, sg), S.wall, x, y + h * (0.1 + shaftTop) / 2, z, r * 2, h * (shaftTop - 0.1), r * 2, 0, 0, 0, S.cWall);
  for (const f of fs) {
    const yy = y + h * f;
    if (!S.lo) F.add(taperGeo(1.5, sg), S.wall, x, yy - 0.7, z, r * 1.75, 1.4, r * 1.75, 0, 0, 0, S.cWall);   // the corbel
    F.cyl(S.wall, S.cWall, x, yy, z, r * 1.32, 0.3, ring);
    F.cyl(S.glow, S.cLight, x, yy + 0.55, z, r * 1.3, 0.22, ring);   // the railing, lit
    if (!S.lo) F.cyl(S.wall, S.cWall, x, yy + 0.95, z, r * 1.33, 0.12, ring);
  }
  const up = y + h * shaftTop;
  F.add(taperGeo(0.9, sg), S.wall, x, up + h * 0.05, z, r * 1.5, h * 0.1, r * 1.5, 0, 0, 0, S.cWall);   // the upper shaft
  F.add(geo(S, 'CONE'), S.dome, x, up + h * 0.1 + h * 0.08, z, r * 1.8, h * 0.16, r * 1.8, 0, 0, 0, S.cDome);   // the lead cone
  F.cyl(S.gold, S.cGold, x, up + h * 0.26 + 0.7, z, 0.12, 1.6, 'cyl6');
  if (!S.lo) { F.ell(S.gold, S.cGold, x, up + h * 0.26 + 1.3, z, 0.28, 0.28, 0.28, true); F.add(G.tor, S.gold, x, up + h * 0.26 + 2.1, z, 1.2, 1.2, 1.6, 0, 0, 0, S.cGold); }   // the crescent
  return up + h * 0.26 + 2.6;
}
export function dome(F, S, x, y, z, R, { k = 0.92, drum = 0.32, wins = 20, alem = true, col = S.cDome, wall = S.cWall } = {}) {
  if (S.lo) { wins = Math.min(wins, 6); alem = false; }
  if (drum) {
    F.add(OCT, S.wall, x, y + (R * drum) / 2, z, R * 2.1, R * drum, R * 2.1, 0, Math.PI / 8, 0, wall);
    for (let k2 = 0; k2 < wins; k2++) {   // the drum's ring of windows, lit from within
      const a = (k2 / wins) * Math.PI * 2;
      F.add(G.box, S.glow, x + Math.sin(a) * R * 1.03, y + R * drum * 0.5, z + Math.cos(a) * R * 1.03, Math.max(0.35, R * 0.11), R * drum * 0.55, 0.15, 0, a, 0, S.cWin);
    }
  }
  F.add(geo(S, 'HALF'), S.dome, x, y + R * drum, z, R * 2, R * 2 * k, R * 2, 0, 0, 0, col);
  if (alem) { F.cyl(S.gold, S.cGold, x, y + R * (drum + k) + 0.9, z, Math.max(0.08, R * 0.02), 1.8, 'cyl6'); F.add(G.tor, S.gold, x, y + R * (drum + k) + 2.2, z, R * 0.12, R * 0.12, R * 0.16, 0, 0, 0, S.cGold); }
  return y + R * (drum + k);
}
const semi = (F, S, x, y, z, R, ry, k = 0.9) => F.add(geo(S, 'SEMI'), S.dome, x, y, z, R * 2, R * 2 * k, R * 2, 0, ry, 0, S.cDome);
// windows round a box: n arched windows a side in rows, lit
function windows(F, S, x, z, W, D, rows, { y0 = 3, dy = 6, n = 6, w = 1.4, h = 3 } = {}) {
  if (S.lo) { rows = 1; n = Math.min(n, 4); }
  for (let r = 0; r < rows; r++) for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n - 0.5, y = y0 + r * dy;
    F.box(S.glow, S.cWin, x + t * W * 0.86, y, z + D / 2 + 0.06, w, h, 0.1); F.box(S.glow, S.cWin, x + t * W * 0.86, y, z - D / 2 - 0.06, w, h, 0.1);
    F.box(S.glow, S.cWin, x + W / 2 + 0.06, y, z + t * D * 0.86, 0.1, h, w); F.box(S.glow, S.cWin, x - W / 2 - 0.06, y, z + t * D * 0.86, 0.1, h, w);
  }
}
// The imperial plan: a square hall under a great dome on its drum of windows, two or four semi-domes buttressing it
// with their own exedrae, little domes at the corners, weight turrets round the drum, an arcaded courtyard of small
// domes in front (+z), the minarets where they stand.
export function imperial(F, S, { R = 12, W = 52, D = 52, Hw = 20, semi4 = true, court = true, minarets = [], turrets = 8, galleries = false } = {}) {
  F.block(S.wall, S.cWall, 0, 0, 0, W, Hw, D);
  F.box(S.wall, S.cWall2, 0, Hw + 0.4, 0, W + 1, 0.8, D + 1);   // the cornice
  windows(F, S, 0, 0, W, D, 2, { y0: 4, dy: 8, n: 7, w: 1.3, h: 3.4 });
  const Hd = Hw + R * 0.55;   // where the great dome's drum starts
  F.add(OCT, S.wall, 0, Hw + (Hd - Hw) / 2, 0, R * 2.6, Hd - Hw, R * 2.6, 0, Math.PI / 8, 0, S.cWall);   // the square below the drum, in pendentives
  const top = dome(F, S, 0, Hd, 0, R, { drum: 0.3, wins: 24, k: 0.9 });
  for (let k = 0; k < turrets; k++) {   // weight turrets round the drum
    const a = (k / turrets) * Math.PI * 2 + Math.PI / turrets, rr = R * 1.18;
    F.cyl(S.wall, S.cWall, Math.sin(a) * rr, Hd + R * 0.2, Math.cos(a) * rr, R * 0.09, R * 0.5, 'cyl8');
    F.add(CONE, S.dome, Math.sin(a) * rr, Hd + R * 0.5, Math.cos(a) * rr, R * 0.2, R * 0.22, R * 0.2, 0, 0, 0, S.cDome);
  }
  const dirs = semi4 ? [0, Math.PI / 2, Math.PI, -Math.PI / 2] : [0, Math.PI];
  for (const ry of dirs) {   // the semi-domes, each with two small exedrae of its own
    const ox = Math.sin(ry) * R * 0.95, oz = Math.cos(ry) * R * 0.95, yS = Hw + R * 0.2;
    semi(F, S, ox, yS, oz, R, ry, 0.95);
    for (const e of [-1, 1]) {
      const a2 = ry + e * 0.85, ex = ox + Math.sin(ry + e * Math.PI / 2) * R * 0.62, ez = oz + Math.cos(ry + e * Math.PI / 2) * R * 0.62;
      semi(F, S, ex, Hw + 0.6, ez, R * 0.42, a2, 0.95);
    }
    F.ell(S.gold, S.cGold, ox + Math.sin(ry) * R * 0.9, yS + R * 0.9, oz + Math.cos(ry) * R * 0.9, 0.25, 0.4, 0.25, true);
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) dome(F, S, sx * W * 0.34, Hw + 0.8, sz * D * 0.34, R * 0.38, { drum: 0.35, wins: 8, k: 0.9 });   // the corner domes
  if (galleries) for (const e of [-1, 1]) {   // the side galleries under their row of little domes
    F.block(S.wall, S.cWall, e * (W / 2 + 4), 0, 0, 8, Hw * 0.45, D * 0.95);
    for (let k = 0; k < 5; k++) dome(F, S, e * (W / 2 + 4), Hw * 0.45, -D * 0.38 + k * (D * 0.19), 2.6, { drum: 0.2, wins: 0, alem: false });
    for (let k = 0; k < 6; k++) F.box(S.glow, S.cWin, e * (W / 2 + 8.06), Hw * 0.2, -D * 0.4 + k * (D * 0.16), 0.1, 3, 1.6);
  }
  if (court) {   // the courtyard: arcades on three sides under small domes, the ablution fountain in the middle
    const C = W * 0.95, cz = D / 2 + C / 2, ch = Hw * 0.42;
    for (const [x, z, w, d] of [[-C / 2 + 3, cz, 6, C], [C / 2 - 3, cz, 6, C], [0, cz + C / 2 - 3, C, 6]]) {
      F.block(S.wall, S.cWall, x, 0, z, w, ch, d);
      const along = w > d ? 'x' : 'z', n = Math.round(Math.max(w, d) / 6.5);
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n - 0.5, dx = along === 'x' ? t * w : 0, dz = along === 'z' ? t * d : 0;
        dome(F, S, x + dx, ch, z + dz, 2.4, { drum: 0.15, wins: 0, alem: false });
        const inner = along === 'x' ? [0, -3.05] : [x < 0 ? 3.05 : -3.05, 0];
        F.box(S.glow, S.cArch, x + dx + inner[0], ch * 0.42, z + dz + inner[1], along === 'x' ? 3.4 : 0.1, ch * 0.6, along === 'x' ? 0.1 : 3.4);   // the arcade's lit arches
        if (!S.lo) { const outer = along === 'x' ? [0, 3.06] : [x < 0 ? -3.06 : 3.06, 0]; F.box(S.glow, S.cWin, x + dx + outer[0], ch * 0.45, z + dz + outer[1], along === 'x' ? 1.4 : 0.1, ch * 0.42, along === 'x' ? 0.1 : 1.4); }   // and its grilled windows looking out
      }
    }
    F.cyl(S.wall, S.cWall, 0, 1.6, cz, 3.2, 3.2, 'cyl8'); dome(F, S, 0, 3.2, cz, 3.0, { drum: 0, wins: 0, alem: true });
  }
  for (const m of minarets) minaret(F, S, m.x, m.z, m.h, m);
  return top;
}
// The Süleymaniye, Sinan's mosque on the third hill: two semi-domes on the long axis, the side galleries, four minarets
// with ten balconies between them
export function suleymaniye(F, S) {
  const W = 58, D = 60, C = W * 0.95;
  return imperial(F, S, { R: 13.25, W, D, Hw: 24, semi4: false, galleries: true, turrets: 8,
    minarets: [{ x: -W / 2 - 1, z: D / 2 + 1, h: 76, n: 3, r: 1.5 }, { x: W / 2 + 1, z: D / 2 + 1, h: 76, n: 3, r: 1.5 }, { x: -C / 2, z: D / 2 + C - 1, h: 56, n: 2, r: 1.3 }, { x: C / 2, z: D / 2 + C - 1, h: 56, n: 2, r: 1.3 }] });
}
// The Blue Mosque: four semi-domes cascading down from the great dome, six minarets
export function blueMosque(F, S) {
  const W = 53, D = 51, C = W * 0.95;
  return imperial(F, S, { R: 11.7, W, D, Hw: 20, semi4: true, turrets: 4,
    minarets: [{ x: -W / 2 - 2, z: -D / 2 - 2, h: 64, n: 3, r: 1.35 }, { x: W / 2 + 2, z: -D / 2 - 2, h: 64, n: 3, r: 1.35 }, { x: -W / 2 - 2, z: D / 2 + 1, h: 64, n: 3, r: 1.35 }, { x: W / 2 + 2, z: D / 2 + 1, h: 64, n: 3, r: 1.35 },
      { x: -C / 2, z: D / 2 + C - 1, h: 58, n: 2, r: 1.2 }, { x: C / 2, z: D / 2 + C - 1, h: 58, n: 2, r: 1.2 }] });
}
// Yeni Cami by the water at Eminönü: four semi-domes, two minarets at the courtyard's corners
export function yeniCami(F, S) {
  const W = 41, D = 41;
  return imperial(F, S, { R: 8.6, W, D, Hw: 16, semi4: true, turrets: 4, minarets: [{ x: -W / 2 + 1, z: D / 2 + 2, h: 64, n: 3, r: 1.2 }, { x: W / 2 - 1, z: D / 2 + 2, h: 64, n: 3, r: 1.2 }] });
}
// a neighbourhood mosque: its hall under one dome, a portico of three little domes, one minaret
export function mahalleMosque(F, S, { minaretSide = 1, h = 30 } = {}) {
  F.block(S.wall, S.cWall, 0, 0, 0, 14, 9, 14);
  F.box(S.wall, S.cWall2, 0, 9.3, 0, 14.8, 0.6, 14.8);
  windows(F, S, 0, 0, 14, 14, 2, { y0: 2.6, dy: 4.2, n: 4, w: 1.0, h: 2.2 });
  if (!S.lo) F.box(S.wall, S.cWall2, 0, 4.8, 0, 14.3, 0.35, 14.3);   // a stone band between the rows
  dome(F, S, 0, 9.6, 0, 5.4, { drum: 0.3, wins: 12, k: 0.92 });
  F.block(S.wall, S.cWall, 0, 0, 9.5, 14, 6, 5);
  for (let k = -1; k <= 1; k++) { dome(F, S, k * 4.6, 6, 9.5, 2.1, { drum: 0.2, wins: 0, alem: false }); F.box(S.glow, S.cArch, k * 4.6, 2.6, 12.06, 3, 4, 0.1); }
  return minaret(F, S, minaretSide * 8.5, -4, h, { r: 0.85, n: 1 });
}
// Hagia Sophia: the great flattened dome on its ring of forty windows and buttresses, the two semi-domes east and west
// with their exedrae, the massive buttress towers north and south, walls washed pink-ochre, four unmatched minarets
export function hagiaSophia(F, S) {
  const W = 72, D = 76, R = 15.6, Hw = 24;   // the long axis runs along z
  F.block(S.wall, S.cWall, 0, 0, 0, W, Hw, D);
  F.box(S.wall, S.cWall2, 0, Hw + 0.4, 0, W + 1, 0.8, D + 1);
  windows(F, S, 0, 0, W, D, 2, { y0: 5, dy: 9, n: 8, w: 1.6, h: 4 });
  F.block(S.wall, S.cWall, 0, Hw, 0, R * 2.6, 12, R * 2.6);   // the square tower carrying the dome
  for (const e of [-1, 1]) F.box(S.glow, S.cWin, e * (R * 1.3 + 0.06), Hw + 6, 0, 0.1, 6, R * 1.6);   // the tympanum windows north and south
  const y0 = Hw + 12;
  F.cyl(S.wall, S.cWall, 0, y0 + 1.5, 0, R * 1.02, 3, 'cyl');
  const NW = S.lo ? 16 : 40;
  for (let k = 0; k < NW; k++) {   // forty windows, forty little buttresses between them
    const a = (k / NW) * Math.PI * 2;
    F.add(G.box, S.glow, Math.sin(a) * R * 1.03, y0 + 1.6, Math.cos(a) * R * 1.03, (1.4 * 40) / NW, 2.0, 0.2, 0, a, 0, S.cWin);
    F.add(G.box, S.wall, Math.sin(a + Math.PI / NW) * R * 1.06, y0 + 1.4, Math.cos(a + Math.PI / NW) * R * 1.06, 0.9, 2.8, 1.6, 0, a + Math.PI / NW, 0, S.cWall);
  }
  F.add(geo(S, 'HALF'), S.dome, 0, y0 + 2.8, 0, R * 2, R * 2 * 0.62, R * 2, 0, 0, 0, S.cDome);
  F.cyl(S.gold, S.cGold, 0, y0 + 2.8 + R * 0.62 + 0.9, 0, 0.12, 1.8, 'cyl6'); F.add(G.tor, S.gold, 0, y0 + 2.8 + R * 0.62 + 2.4, 0, 1.6, 1.6, 2.2, 0, 0, 0, S.cGold);
  for (const ry of [0, Math.PI]) {   // the semi-domes and their exedrae
    const oz = Math.cos(ry) * R * 1.25;
    F.block(S.wall, S.cWall, 0, Hw, oz + Math.cos(ry) * 4, R * 2.2, 4, 10);
    semi(F, S, 0, Hw + 4, oz, R * 0.98, ry, 0.82);
    for (const e of [-1, 1]) semi(F, S, e * R * 0.72, Hw + 1, oz + Math.cos(ry) * R * 0.5, R * 0.45, ry + e * 0.9, 0.85);
  }
  for (const e of [-1, 1]) for (const f of [-1, 1]) F.block(S.wall, S.cWall3, e * (W / 2 - 4), 0, f * R * 0.85, 9, Hw + 13, 12);   // the buttress towers
  for (const [x, z] of [[-W / 2 - 10, D / 2 + 4], [W / 2 + 10, D / 2 + 4]]) minaret(F, S, x, z, 60, { r: 1.25, n: 2 });   // the slender white pair at the west
  minaret(F, { ...S, cWall: S.cBrick || S.cWall3 }, W / 2 + 6, -D / 2 - 4, 58, { r: 1.8, n: 1 });   // the brick one
  minaret(F, S, -W / 2 - 6, -D / 2 - 4, 55, { r: 1.2, n: 1 });
  dome(F, S, -W / 2 - 14, 0, -6, 4.5, { drum: 1.2, wins: 8, k: 0.9 });   // a sultan's tomb in the garden
  dome(F, S, W / 2 + 13, 0, 4, 3.6, { drum: 1.4, wins: 8, k: 0.9 });
  return y0 + 2.8 + R * 0.62;
}
// The Galata Tower: a stone cylinder, its arcade of lit windows under the gallery, the pointed lead cone
export function galataTower(F, S, { h = 1 } = {}) {
  F.add(taperGeo(0.93, S.lo ? 12 : 20), S.wall, 0, 23, 0, 17, 46, 17, 0, 0, 0, S.cWall);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + r * 0.5; F.add(G.box, S.glow, Math.sin(a) * 8.1, 8 + r * 9.5, Math.cos(a) * 8.1, 0.9, 1.8, 0.2, 0, a, 0, S.cDim || S.cWin); }   // the slit windows
  F.cyl(S.wall, S.cWall2, 0, 46.5, 0, 8.4, 1, 'cyl');
  F.cyl(S.wall, S.cWall, 0, 49.5, 0, 7.8, 5, 'cyl');
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; F.add(G.box, S.glow, Math.sin(a) * 7.85, 49.6, Math.cos(a) * 7.85, 1.8, 3.2, 0.2, 0, a, 0, S.cWin); }   // the top floor's arcade, lit
  F.cyl(S.wall, S.cWall2, 0, 52.3, 0, 8.9, 0.6, 'cyl');   // the gallery
  F.cyl(S.glow, S.cLight, 0, 53.0, 0, 8.85, 0.25, 'cyl');
  F.cyl(S.wall, S.cWall, 0, 54.0, 0, 7.4, 2.2, 'cyl');
  F.add(geo(S, 'CONE'), S.dome, 0, 54.8 + 7.5, 0, 16.4, 15 * h, 16.4, 0, 0, 0, S.cDome);
  F.cyl(S.gold, S.cGold, 0, 70.6, 0, 0.15, 2.6, 'cyl6'); F.ell(S.gold, S.cGold, 0, 72.2, 0, 0.45, 0.45, 0.45, true);
  return 72.6;
}
// The Maiden's Tower: the rock and its quay, the low house, the tower with its octagonal lantern and lead cupola, a flag
export function maidenTower(F, S, flagMat) {
  F.ell(S.rock, S.cRock, 0, -3, 0, 22, 4, 14, true);
  F.block(S.wall, S.cWall2, 0, -1, 0, 34, 2.4, 18);
  F.block(S.wall, S.cWall, -5, 1.4, 0, 20, 5.5, 11);
  F.box(S.dome, S.cDome, -5, 7.3, 0, 21, 0.8, 12);
  for (let k = 0; k < 7; k++) { F.box(S.glow, S.cWin, -14 + k * 3, 4, 5.56, 1.2, 2.2, 0.1); F.box(S.glow, S.cWin, -14 + k * 3, 4, -5.56, 1.2, 2.2, 0.1); }
  F.block(S.wall, S.cWall, 8, 1.4, 0, 7.6, 15, 7.6);   // the tower
  for (const e of [-1, 1]) for (const r of [0, 1]) { F.box(S.glow, S.cWin, 8 + e * 3.86, 7 + r * 5, 0, 0.1, 2.4, 1.3); F.box(S.glow, S.cWin, 8, 7 + r * 5, e * 3.86, 1.3, 2.4, 0.1); }
  F.box(S.wall, S.cWall2, 8, 16.6, 0, 8.6, 0.5, 8.6);
  F.add(OCT, S.wall, 8, 18.8, 0, 6.2, 4, 6.2, 0, Math.PI / 8, 0, S.cWall);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; F.add(G.box, S.glow, 8 + Math.sin(a) * 2.9, 18.8, Math.cos(a) * 2.9, 1.0, 2.2, 0.15, 0, a, 0, S.cWin); }
  F.add(HALF, S.dome, 8, 20.8, 0, 6.6, 4.2, 6.6, 0, 0, 0, S.cDome);
  F.cyl(S.wall, S.cWall, 8, 24, 0, 0.8, 1.6, 'cyl8'); F.add(CONE, S.dome, 8, 25.6, 0, 1.8, 1.8, 1.8, 0, 0, 0, S.cDome);
  F.cyl(S.gold, '#d8d8d4', 8, 29.5, 0, 0.08, 6, 'cyl6');
  if (flagMat) F.add(G.plane, flagMat, 9.6, 31.4, 0, 3, 2, 1, 0, 0, 0, 0xffffff);
  return 32;
}
// The Bosphorus Bridge, one tower at x = 0: the two legs and their cross beams, the deck at dh, the main cables sagging
// across the span toward +x and down the back span toward -x; the cables' lights are their own material
export function bosphorusBridge(F, S, { H = 165, dh = 64, span = 1074, back = 230, lights = null, cLights = 0xffffff, deckW = 33 } = {}) {
  for (const e of [-1, 1]) {
    F.add(taperGeo(0.75, 4), S.steel, 0, H / 2, e * deckW * 0.47, 7, H, 7, 0, Math.PI / 4, 0, S.cSteel);
    F.box(S.steel, S.cSteel, 0, H + 1.5, e * deckW * 0.47, 6, 3, 6);
  }
  for (const y of [dh - 6, dh + 45, H - 2]) F.box(S.steel, S.cSteel, 0, y, 0, 5, 5, deckW * 0.94);
  F.box(S.steel, S.cSteel, span / 2 - back / 2, dh, 0, span + back, 3, deckW);
  F.box(S.glow, S.cLight, span / 2 - back / 2, dh + 1.6, 0, span + back, 0.3, deckW * 0.9);   // the deck's lamps
  const cable = (x0, y0, x1, y1, sag, n, z, hang) => {
    let px = x0, py = y0;
    for (let k = 1; k <= n; k++) {
      const t = k / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t - sag * 4 * t * (1 - t);
      F.beam(S.steel, S.cSteel, [px, py, z], [x, y, z], 0.9);
      if (lights) F.beam(lights, cLights, [px, py + 0.6, z], [x, y + 0.6, z], 0.5);
      if (hang && k < n && k % 2 === 0) F.beam(S.steel, S.cSteel, [x, y, z], [x, dh + 1.5, z], 0.25);   // a hanger
      px = x; py = y;
    }
  };
  for (const e of [-1, 1]) { cable(0, H + 2, span, H + 2, H - dh - 4, 40, e * deckW * 0.47, true); cable(0, H + 2, -back, dh - 30, 18, 10, e * deckW * 0.47, false); }
}
// The Ortaköy Mosque: a neo-baroque cube of great arched windows on its pier, a high drum of round windows, two slender
// minarets at the front corners
export function ortakoy(F, S) {
  F.block(S.wall, S.cWall2, 0, -1, 0, 30, 1.6, 34);
  F.block(S.wall, S.cWall, 0, 0.6, 0, 18, 15, 18);
  for (const e of [-1, 1]) for (const f of [-1, 1]) F.block(S.wall, S.cWall2, e * 8.6, 0.6, f * 8.6, 2.2, 16, 2.2);   // the corner piers
  for (const side of [0, 1, 2, 3]) {   // two tiers of great arched windows each side, lit
    const a = (side * Math.PI) / 2;
    for (const t of [-1, 1]) for (const [y, h] of [[5, 6], [12, 4]]) F.add(G.box, S.glow, Math.sin(a) * 9.06 + Math.cos(a) * t * 3.6, y, Math.cos(a) * 9.06 - Math.sin(a) * t * 3.6, 2.8, h, 0.12, 0, a, 0, S.cWin);
  }
  F.box(S.wall, S.cWall2, 0, 16, 0, 19.5, 1.2, 19.5);
  F.cyl(S.wall, S.cWall, 0, 19, 0, 7.4, 5, 'cyl');
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; F.add(G.cyl, S.glow, Math.sin(a) * 7.42, 19.2, Math.cos(a) * 7.42, 1.5, 0.15, 1.5, Math.PI / 2, a, 0, S.cWin); }
  F.add(HALF, S.dome, 0, 21.5, 0, 15.2, 12.5, 15.2, 0, 0, 0, S.cDome);
  F.cyl(S.gold, S.cGold, 0, 28.8, 0, 0.1, 1.6, 'cyl6'); F.add(G.tor, S.gold, 0, 30.1, 0, 1.2, 1.2, 1.6, 0, 0, 0, S.cGold);
  for (const e of [-1, 1]) minaret(F, S, e * 12, 7, 38, { r: 0.8, n: 1 });
  F.block(S.wall, S.cWall, 0, 0.6, 13, 18, 5, 8);   // the sultan's pavilion in front
  for (let k = -2; k <= 2; k++) F.box(S.glow, S.cWin, k * 3.4, 3, 17.06, 1.6, 2.6, 0.1);
}
// Dolmabahçe's clock tower: four storeys of white stone, the clock faces lit, a little dome on top
export function clockTower(F, S) {
  let y = 0;
  for (const [w, h] of [[7, 6], [6.2, 7], [5.2, 5], [4.2, 3.4]]) {
    F.block(S.wall, S.cWall, 0, y, 0, w, h, w);
    F.box(S.wall, S.cWall2, 0, y + h + 0.2, 0, w + 0.6, 0.4, w + 0.6);
    for (const e of [-1, 1]) for (const f of [-1, 1]) F.block(S.wall, S.cWall2, e * (w / 2), y, f * (w / 2), 0.6, h, 0.6);
    for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; F.add(G.box, S.glow, Math.sin(a) * (w / 2 + 0.06), y + h * 0.5, Math.cos(a) * (w / 2 + 0.06), w * 0.3, h * 0.5, 0.1, 0, a, 0, S.cWin); }
    y += h + 0.4;
  }
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; F.add(G.cyl, S.glow, Math.sin(a) * 3.15, 16.4, Math.cos(a) * 3.15, 2.6, 0.12, 2.6, Math.PI / 2, a, 0, S.cClock || S.cWin); }   // the clock faces
  dome(F, S, 0, y, 0, 2.2, { drum: 0.3, wins: 0, k: 1.0 });
  return y + 4;
}
// Dolmabahçe's Imperial Gate: the great arch between paired columns, gilded relief over it, the cresting and a tughra
export function imperialGate(F, S) {
  F.block(S.wall, S.cWall, 0, 0, 0, 20, 13, 4);
  for (const e of [-1, 1]) {   // the wings: sunk panels in a darker marble, a niche with its lamp, gilded garlands over them
    F.box(S.wall, S.cWall3, e * 7.8, 6.5, 2.02, 3.6, 8.6, 0.1);
    F.box(S.dark, S.cDark, e * 7.8, 3.4, 2.08, 1.5, 2.8, 0.1);
    F.box(S.glow, S.cWin, e * 7.8, 3.6, 2.14, 0.5, 0.7, 0.06);
    F.box(S.gold, S.cGold, e * 7.8, 9.6, 2.1, 3.0, 0.3, 0.12);
    F.box(S.gold, S.cGold, e * 7.8, 5.2, 2.1, 2.0, 0.18, 0.12);
  }
  F.box(S.dark, S.cDark, 0, 4.5, 2.05, 6, 9, 0.1);   // the open arch, the gates dark in it
  F.box(S.gold, S.cGold, 0, 9.2, 2.1, 6.4, 0.4, 0.2);
  for (const e of [-1, 1]) {
    for (const f of [3.8, 5.6]) { F.cyl(S.wall, S.cWall2, e * f, 5, 2.4, 0.42, 10, 'cyl'); F.box(S.gold, S.cGold, e * f, 10.2, 2.4, 1.0, 0.5, 1.0); }
    F.box(S.glow, S.cWin, e * 7.8, 6, 2.06, 1.6, 3.2, 0.1);
  }
  F.box(S.wall, S.cWall2, 0, 11.2, 2.2, 21, 1.0, 0.8);
  F.box(S.gold, S.cGold, 0, 12.5, 1.9, 8, 1.6, 0.3);   // the gilded relief and the tughra's cartouche
  F.ell(S.gold, S.cGold, 0, 14.4, 1.7, 1.8, 1.4, 0.4, true);
  for (let k = -4; k <= 4; k++) F.ell(S.wall, S.cWall2, k * 2.2, 13.4, 0, 0.35, 0.6, 0.35, true);   // the cresting's urns
  return 15;
}
// The Çamlıca hill across the Bosphorus: the new mosque with its six minarets, the television tower opening into a tulip
export function camlica(F, S) {
  F.ell(S.hill, S.cHill, 0, -150, 0, 520, 150, 360, true);   // the hill, its top at y = 0
  imperial(F, S, { R: 17, W: 70, D: 70, Hw: 28, semi4: true, court: false, turrets: 4,
    minarets: [[-48, -48], [48, -48], [-48, 48], [48, 48], [-60, 0], [60, 0]].map(([x, z]) => ({ x, z, h: 107, n: 3, r: 2 })) });
  const tx = 220, tz = -60;   // the tower, down the hill's shoulder
  F.add(taperGeo(0.45, 8), S.steel, tx, 100, tz, 26, 240, 26, 0, 0, 0, S.cSteel);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; F.add(G.sphLow, S.tower, tx + Math.sin(a) * 12, 248, tz + Math.cos(a) * 12, 14, 70, 22, 0.32 * Math.cos(a), a, -0.32 * Math.sin(a), S.cTower); }   // the tulip's petals
  F.cyl(S.glow, S.cLight, tx, 242, tz, 15, 3, 'cyl');
  F.add(taperGeo(0.2, 6), S.steel, tx, 310, tz, 5, 90, 5, 0, 0, 0, S.cSteel);
  F.ell(S.glow, S.cRed || S.cLight, tx, 356, tz, 1.4, 1.4, 1.4, true);
}
