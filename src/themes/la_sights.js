// Four of Los Angeles's landmark scenes (la.js ROUTE; the rest are in la_landmarks.js, la_beach.js and la_hills.js):
// Broadway's picture palaces downtown, the Eastern Columbia's turquoise clock tower standing over them; the Watts Towers
// beside the line, Simon Rodia's spires of steel and mortar and broken bottles, the 103rd Street platform across from
// them; Echo Park's lake, its lotus and swan boats, the fountain, the palms round it standing on their reflections, the
// Angelus Temple's dome over the boulevard; Dodger Stadium down in Chavez Ravine, its decks of coloured seats under the
// lights, a game on.
// Big buildings stand back from the track and well ahead; anything over the track is 11 m up or more.
import { THREE, Batcher, VC, G, std, hdr, canvasTex, shade, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { farGround, RING } from './common.js';
import { frame, frustum4, figure } from './ny_icons.js';
import { mirrorInto, mergeInto, clearWater } from './beijing_sights.js';
import { quad } from './la_beach.js';
import { puffs } from './taipei_towers.js';
import { SANS, SERIF, DECO, NEON, BLADE, X0, STUCCO, PASTEL, DOWNTOWN_SIGNS, STRIP_SIGNS, GI, face, hipRoof, gableRoof } from './la_kit.js';

const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
function mosaicTex() {   // Rodia's mortar: broken tile and bottle glass pressed into it, shells, hearts and stars
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#9a948a'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 420; k++) {
      g.fillStyle = pick(['#2a6ab0', '#3a9a6a', '#c8a040', '#f4f0e8', '#8a3a2a', '#2a8a8a', '#e8d070', '#58b890', '#4a4a8a']);
      const x = rand(0, w), y = rand(0, h), r = rand(3, 9); g.beginPath(); g.moveTo(x + r, y); for (let j = 1; j < 5; j++) { const a = (j / 5) * Math.PI * 2 + rand(-0.3, 0.3); g.lineTo(x + Math.cos(a) * r * rand(0.6, 1.2), y + Math.sin(a) * r * rand(0.6, 1.2)); } g.fill();
    }
    g.strokeStyle = 'rgba(60,54,48,0.55)'; g.lineWidth = 3;
    for (let k = 0; k < 7; k++) { const x = rand(20, w - 20), y = rand(20, h - 20), r = rand(8, 14); g.beginPath(); if (k % 2) { g.moveTo(x, y + r); g.bezierCurveTo(x - r * 1.6, y - r * 0.4, x - r * 0.4, y - r * 1.4, x, y - r * 0.4); g.bezierCurveTo(x + r * 0.4, y - r * 1.4, x + r * 1.6, y - r * 0.4, x, y + r); } else for (let j = 0; j <= 10; j++) { const a = (j / 10) * Math.PI * 2 - Math.PI / 2, rr = j % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke(); }
    g.fillStyle = '#f4ece0'; for (let k = 0; k < 10; k++) { const x = rand(0, w), y = rand(0, h); g.beginPath(); g.arc(x, y, 6, Math.PI, 0); g.fill(); }
  });
}
// Dodger Stadium's layout in its chunk: home plate at (HX, FY, HZ), the line to centre field A radians off +z (toward the
// runner, a little to the right), the field at four tenths of its size, its plane from X0 to X1 and Z0 to Z1
const DS = { HX: 40, HZ: -52, FY: -16, A: 0.44, s: 0.4, X0: 12, X1: 92, Z0: -2, Z1: -78 };
const dsAt = (d, a) => [DS.HX + Math.sin(DS.A + a) * d, DS.HZ + Math.cos(DS.A + a) * d];   // d metres from home, a off the line to centre field
const fence = (a) => 40 + 8 * Math.cos(2 * a);   // the outfield wall: 40 m down the lines, 48 to centre
function fieldTex() {   // the ballfield from above (DS): the mowing stripes, the warning track, the skin, the diamond, the lines
  const W = 1024, H = 976, P = (x, z) => [((x - DS.X0) / (DS.X1 - DS.X0)) * W, ((z - DS.Z1) / (DS.Z0 - DS.Z1)) * H], px = (d) => (d / (DS.X1 - DS.X0)) * W;
  const at = (d, a) => P(...dsAt(d, a)), s = DS.s;
  return canvasTex(W, H, (g) => {
    g.fillStyle = '#3c7a34'; g.fillRect(0, 0, W, H);
    g.save(); g.beginPath(); g.moveTo(...at(0, 0)); for (let a = -Math.PI / 4; a <= Math.PI / 4 + 0.001; a += Math.PI / 40) g.lineTo(...at(fence(a), a)); g.closePath(); g.clip();
    for (let k = 0; k < 14; k++) { g.fillStyle = k % 2 ? '#3a7632' : '#46843c'; g.beginPath(); g.moveTo(...at(k * 4, -1)); g.lineTo(...at(k * 4, 1)); g.lineTo(...at(k * 4 + 4, 1)); g.lineTo(...at(k * 4 + 4, -1)); g.fill(); }   // the mowing
    g.fillStyle = '#a8704a'; g.beginPath(); for (let a = -Math.PI / 4; a <= Math.PI / 4 + 0.001; a += Math.PI / 40) g.lineTo(...at(fence(a) - 2.4, a)); for (let a = Math.PI / 4; a >= -Math.PI / 4 - 0.001; a -= Math.PI / 40) g.lineTo(...at(fence(a), a)); g.fill();   // the warning track
    g.restore();
    g.fillStyle = '#b07a52'; g.beginPath(); g.moveTo(...at(0, 0)); for (let a = -Math.PI / 4; a <= Math.PI / 4 + 0.001; a += Math.PI / 30) g.lineTo(...at(47 * s, a)); g.closePath(); g.fill();   // the skin of the infield
    g.fillStyle = '#46843c'; g.beginPath(); g.moveTo(...at(1.5, 0)); g.lineTo(...at(24 * s, -Math.PI / 4)); g.lineTo(...at(34 * s, 0)); g.lineTo(...at(24 * s, Math.PI / 4)); g.closePath(); g.fill();   // the grass inside the diamond
    g.fillStyle = '#b07a52'; for (const [d, r] of [[0, 4 * s], [18.4 * s, 2.7 * s]]) { g.beginPath(); g.arc(...at(d, 0), px(r), 0, Math.PI * 2); g.fill(); }   // home's circle, the mound
    g.strokeStyle = '#f4f2ec'; g.lineWidth = 3; for (const a of [-Math.PI / 4, Math.PI / 4]) { g.beginPath(); g.moveTo(...at(0, 0)); g.lineTo(...at(fence(a), a)); g.stroke(); }   // the foul lines
    g.fillStyle = '#f4f2ec'; for (const [d, a] of [[27.4 * s, -Math.PI / 4], [38.8 * s, 0], [27.4 * s, Math.PI / 4], [0, 0]]) { const [x, y] = at(d, a); g.fillRect(x - 4, y - 4, 8, 8); }
    for (let k = 0; k < 3000; k++) { g.fillStyle = `rgba(0,0,0,${rand(0.02, 0.07)})`; g.fillRect(rand(0, W), rand(0, H), 2, 2); }
  });
}

export function laSights(K, H) {
  const extras = { boats: [], spray: [], scoreboard: null };
  const lakeMat = clearWater('#1a2a44', 6, 0.55);
  const mosaic = std({ map: mosaicTex(), vertexColors: true, roughness: 0.7, emissive: '#ffffff', emissiveIntensity: 0.1 });
  mosaic.emissiveMap = mosaic.map;
  const field = std({ map: fieldTex(), roughness: 0.92 });
  const glints = ['#3ab890', '#58d0a0', '#e8a040', '#4a8ad8', '#f4f0e8', '#2aa8b8', '#7ad870'];

  // ---------- Broadway ----------
  // a blade sign out over the pavement, tall: its letters stacked, neon down its edges, bulbs chasing up beside it
  const blade = (b, s, z, y0, text, { col = '#ff3a2a', W = 2.0, step = 1.5, bg = '#1a1418', bulbs = true } = {}) => {
    const h = text.length * step + 1.0, x = s * (X0 - W / 2 - 0.2), c = hdr(col, 2.3);
    b.box(VC.solid, bg, x, y0 + h / 2, z, W, h, 0.36);
    K.vsign(b, text, { color: col, glow: col, font: BLADE }, x, y0 + h / 2, z + 0.19, W - 0.4, h - 0.7, 1, 0, 0, 0);
    for (const e of [-1, 1]) b.box(VC.glow, c, x + e * (W / 2 - 0.07), y0 + h / 2, z + 0.19, 0.07, h - 0.14, 0.03);
    for (const y of [y0 + 0.08, y0 + h - 0.08]) b.box(VC.glow, c, x, y, z + 0.19, W - 0.14, 0.07, 0.03);
    if (bulbs) for (let k = 0, n = Math.round(h / 0.45); k < n; k++) for (const e of [-1, 1]) b.box(k % 2 ? K.chaseA : K.chaseB, 0xffffff, x + e * (W / 2 + 0.07), y0 + 0.25 + k * 0.45, z, 0.12, 0.12, 0.12);
    for (const y of [y0 + 0.6, y0 + h - 0.6]) b.box(VC.metal, '#2a2a30', s * (X0 - 0.12), y, z, 0.24, 0.24, 0.24);
  };
  // a theatre's marquee out over the pavement: its lit underside, the bill in black letters, the name on its ends, bulbs running round it
  const marquee = (F, w, y, name, bill) => {
    F.box(VC.solid, '#2a2228', 0, y, 1.7, w, 1.5, 3.2);
    F.box(VC.glow, hdr('#fff0d0', 1.6), 0, y - 0.76, 1.7, w - 0.3, 0.02, 2.9);
    K.sign(F, bill, { w: 1024, h: 128, color: '#141414', bg: '#fff4e0', font: SANS, weight: 700, size: 0.5, k: 1.3 }, 0, y - 0.08, 3.31, w - 0.6, 0.8, 1);
    for (const e of [-1, 1]) K.sign(F, name, { w: 512, h: 128, color: '#ffd23d', bg: '#2a2228', font: DECO, size: 0.6, k: 1.5 }, e * (w / 2 + 0.01), y, 1.7, 3.0, 0.9, 1, 0, (e * Math.PI) / 2, 0);
    for (let k = 0; k < Math.round(w / 0.4); k++) for (const zz of [0.2, 3.3]) F.box(k % 2 ? K.chaseA : K.chaseB, 0xffffff, -w / 2 + 0.2 + k * 0.4, y - 0.66, zz, 0.12, 0.12, 0.12);
    for (const e of [-1, 1]) F.beam(VC.metal, '#2a2a30', [e * (w / 2 - 1), y + 3.2, 0.1], [e * (w / 2 - 1), y + 0.7, 3.2], 0.06);
  };
  const cornice = (F, w, y, col, z = 0) => {   // a cornice: the band, its bed moulding, the dentils under it
    F.box(VC.solid, col, 0, y, z + 0.45, w + 0.6, 0.5, 0.9); F.box(VC.solid, shade(col, 0.9), 0, y - 0.38, z + 0.3, w + 0.3, 0.26, 0.6);
    for (let x = -w / 2 + 0.25; x < w / 2; x += 0.5) F.box(VC.solid, col, x, y - 0.62, z + 0.36, 0.22, 0.2, 0.22);
  };
  const windows = (F, x0, x1, y0, y1, cols, rows, { lit = 0.45, frame: fc = '#5a5048', w = 1.4, h = 1.8 } = {}) => {   // a grid of windows, their frames and sills
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = x0 + ((x1 - x0) * (c + 0.5)) / cols, y = y0 + ((y1 - y0) * (r + 0.5)) / rows;
      F.box(VC.solid, fc, x, y, 0.04, w + 0.16, h + 0.16, 0.06); F.box(VC.glow, K.glass(lit, true), x, y, 0.08, w, h, 0.04); F.box(VC.solid, shade(fc, 1.3), x, y - h / 2 - 0.12, 0.14, w + 0.3, 0.1, 0.2);
    }
  };
  const shopfronts = (F, x0, x1, signs) => {   // the ground floor's little shops: their glass, a sign over each, an awning on some
    const n = Math.max(1, Math.round((x1 - x0) / 4.4)), w = (x1 - x0) / n;
    for (let k = 0; k < n; k++) {
      const x = x0 + w * (k + 0.5);
      F.box(VC.solid, '#2a2228', x, 1.7, 0.03, w - 0.2, 3.4, 0.06); F.box(VC.glow, hdr(pick(['#ffe8c0', '#fff0dc', '#ffd8a8']), rand(0.8, 1.15)), x, 1.6, 0.07, w - 0.6, 2.8, 0.04);
      const t = pick(signs), i = signs.indexOf(t);   // (each name always in the same colours, so it is drawn into the atlas once)
      K.sign(F, t, { w: 512, h: 112, color: ['#ffd23d', '#ffffff', '#ff5a5a', '#5ae8ff'][i % 4], bg: ['#1a1a24', '#7a1a24', '#1a3a6a', '#2a5a2a'][(i >> 1) % 4], font: SANS, weight: 700, size: 0.55, k: 1.2 }, x, 3.75, 0.1, w - 0.4, 0.7, 1);
      if (chance(0.4)) F.add(G.box, VC.solid, x, 3.25, 0.7, w - 0.3, 0.06, 1.4, -0.3, 0, 0, pick(['#c8302a', '#2a6a4a', '#e8a020', '#2a4a8a']));
    }
  };
  const SHOPS = ['JOYERÍA', 'ZAPATERÍA', 'NOVEDADES', 'ROPA', 'PERFUMES', 'ELECTRÓNICA', 'QUINCEAÑERAS', 'BOTAS', 'CELULARES', 'DULCERÍA'];
  // the Eastern Columbia: turquoise terra cotta, its piers gilt down their faces, the spandrels deep blue with gold
  // zigzags; the black granite base, its entrance under a gilt sunburst; the clock tower over the front, EASTERN in neon
  // above a clock on each face, the stepped crown and its flagpole
  const easternColumbia = (b, zc) => {
    const W = 26, D = 18, Hh = 46, F = frame(b, X0, 0, zc, 1, face(1)), tq = '#3aa89c', tq2 = '#46b8aa', blue = '#1c3a6e', gold = '#d8b048';
    F.addM(K.tiledBox(W, Hh, D, 2.5), K.stuccoMat, T(0, Hh / 2, -D / 2), tq);
    F.box(VC.solid, '#1a1a20', 0, 2.7, 0.012, W + 0.2, 5.4, 0.02);
    shopfronts(F, -W / 2 + 0.6, -3, SHOPS); shopfronts(F, 3, W / 2 - 0.6, SHOPS);
    F.box(VC.solid, '#141418', 0, 2.2, 0.2, 4.2, 4.4, 0.1); for (const e of [-1, 1]) F.box(VC.glow, hdr('#ffe0b0', 0.75), e * 0.85, 1.4, 0.26, 1.4, 2.6, 0.04); F.box(VC.metal, gold, 0, 3.0, 0.27, 3.6, 0.12, 0.04);   // the entrance and its sunburst
    for (let k = 0; k < 9; k++) { const a = Math.PI * (0.06 + (0.88 * k) / 8); F.beam(VC.metal, gold, [0, 4.6, 0.26], [Math.cos(a) * 2.1, 4.6 + Math.sin(a) * 1.2, 0.26], 0.12, 0.04); }
    K.sign(F, 'EASTERN COLUMBIA', { w: 768, h: 96, color: '#e8c060', font: DECO, size: 0.6, k: 1.2 }, 0, 6.2, 0.2, 9, 0.9, 1);
    const bay = W / 6;
    for (let k = 0; k <= 6; k++) { const x = -W / 2 + k * bay; F.box(VC.solid, tq2, x, (Hh + 5.6) / 2, 0.3, 0.9, Hh - 5.6, 0.6); F.box(VC.metal, gold, x, (Hh + 5.6) / 2, 0.62, 0.16, Hh - 5.6, 0.04); }   // the piers
    for (let f = 0; f < 11; f++) {
      const y = 7.0 + f * 3.6;
      for (let k = 0; k < 6; k++) {
        const x = -W / 2 + bay * (k + 0.5);
        F.box(VC.glow, K.glass(0.45, true), x, y + 1.05, 0.06, 2.7, 2.0, 0.04); F.box(VC.solid, shade(tq, 0.7), x, y + 1.05, 0.03, 3.0, 2.25, 0.04);
        F.box(VC.solid, blue, x, y - 0.42, 0.07, 3.3, 0.95, 0.06);
        for (let j = 0; j < 4; j++) F.add(G.box, VC.metal, x - 1.05 + j * 0.7, y - 0.42, 0.11, 0.52, 0.07, 0.03, 0, 0, j % 2 ? 0.7 : -0.7, gold);
      }
    }
    F.box(VC.solid, tq2, 0, Hh + 0.9, -0.3, W + 0.4, 1.8, 0.8); F.box(VC.metal, gold, 0, Hh + 1.85, 0.12, W + 0.4, 0.12, 0.04);   // the parapet
    const tz = -4.6, tH = 19;   // the clock tower
    F.addM(K.tiledBox(9, tH, 9, 2.5), K.stuccoMat, T(0, Hh + tH / 2, tz), tq);
    for (const [ex, ez] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { F.box(VC.solid, tq2, ex * 4.4, Hh + tH / 2, tz + ez * 4.4, 0.9, tH, 0.9); F.box(VC.metal, gold, ex * 4.4, Hh + tH / 2, tz + ez * 4.86, 0.14, tH, 0.04); }
    for (const [ox, oz, ry] of [[0, tz + 4.56, 0], [-4.56, tz, -Math.PI / 2], [4.56, tz, Math.PI / 2]]) {
      const C = frame(b, ...F.at(ox, Hh + 7.5, oz).toArray(), 1, face(1) + ry);
      C.add(G.cyl, VC.glow, 0, 0, 0.05, 5.2, 0.1, 5.2, Math.PI / 2, 0, 0, hdr('#f4f8f0', 1.3)); C.add(RING, VC.metal, 0, 0, 0.1, 2.7, 2.7, 2.7, 0, 0, 0, gold);
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; C.box(VC.solid, '#1a1a20', Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0.12, 0.18, 0.18, 0.03); }
      C.add(G.box, VC.solid, 0.5, 0.6, 0.14, 0.14, 1.6, 0.04, 0, 0, -0.7, '#1a1a20'); C.add(G.box, VC.solid, -0.35, 0.3, 0.15, 0.12, 1.1, 0.04, 0, 0, 1.1, '#1a1a20');
      K.sign(C, 'EASTERN', { w: 768, h: 160, color: '#f0fff8', font: SANS, weight: 700, size: 0.72, glow: '#8affe0', k: 2.3 }, 0, 5.6, 0.1, 8.2, 1.7, 1);
    }
    for (const [y, w, h] of [[Hh + tH, 7.6, 2.0], [Hh + tH + 2, 5.6, 1.8], [Hh + tH + 3.8, 3.6, 1.6]]) { F.addM(K.tiledBox(w, h, w, 2.5), K.stuccoMat, T(0, y + h / 2, tz), tq2); F.box(VC.metal, gold, 0, y + h - 0.06, tz + w / 2 + 0.02, w, 0.12, 0.04); }
    F.add(G.cone4, VC.metal, 0, Hh + tH + 6.6, tz, 2.0, 2.4, 2.0, 0, Math.PI / 4, 0, gold);
    F.cyl(VC.metal, '#8a8e94', 0, Hh + tH + 9.4, tz, 0.08, 3.6, 'cyl6'); F.box(K.blinkRed, 0xffffff, 0, Hh + tH + 11.3, tz, 0.3, 0.3, 0.3);
  };
  // the Orpheum: cream terra cotta, its three tall arched windows between paired pilasters, the cornice and its urns, the
  // red blade sign, the marquee, ORPHEUM in neon on its frame on the roof
  const orpheum = (b, zc) => {
    const W = 22, D = 16, Hh = 26, F = frame(b, X0, 0, zc, 1, face(1)), c = '#e8dcc4';
    F.addM(K.tiledBox(W, Hh, D, 2.5), K.stuccoMat, T(0, Hh / 2, -D / 2), c);
    shopfronts(F, -W / 2 + 0.6, -5, SHOPS); shopfronts(F, 5, W / 2 - 0.6, SHOPS);
    F.box(VC.solid, '#1a1418', 0, 2.2, 0.05, 9, 4.4, 0.06); for (let k = -3; k <= 3; k++) F.box(VC.glow, hdr('#ffe0b0', 1.3), k * 1.2, 1.4, 0.09, 1.0, 2.6, 0.04);   // the doors
    for (const e of [-1, 1]) { F.box(VC.solid, '#c8a050', e * 3.9, 2.0, 0.1, 1.2, 1.9, 0.08); K.board(F, pick(K.billRects), e * 3.9, 2.0, 0.15, 1.0, 1.6, 1, 0, 0, 0); }
    marquee(F, 14, 5.2, 'ORPHEUM', 'TONIGHT · LIVE ON STAGE · THE PALMS');
    F.box(VC.solid, shade(c, 0.92), 0, 7.2, 0.15, W, 0.5, 0.3);
    for (let k = -1; k <= 1; k++) K.archWin(F, k * 4.6, 14.5, 0.06, 2.8, 8.0, hdr('#ffd9a0', 0.95), '#c8b8a0');
    for (const x of [-6.9, -2.3, 2.3, 6.9]) for (const e of [-0.45, 0.45]) { F.box(VC.solid, shade(c, 1.05), x + e, 14.2, 0.3, 0.5, 12, 0.5); F.box(VC.solid, shade(c, 0.9), x + e, 20.4, 0.36, 0.7, 0.5, 0.6); }
    for (const e of [-1, 1]) windows(F, e * 8.2 - 1.6, e * 8.2 + 1.6, 9, 22, 1, 3, { w: 1.6, h: 2.2, frame: '#7a6a58' });
    cornice(F, W, Hh - 1.4, shade(c, 0.95));
    for (let x = -W / 2 + 1; x <= W / 2 - 1; x += 3) { F.cyl(VC.solid, shade(c, 0.9), x, Hh + 0.4, 0.3, 0.32, 0.8, 'cyl8'); F.add(G.sphLow, VC.solid, x, Hh + 1.0, 0.3, 0.6, 0.5, 0.6, 0, 0, 0, shade(c, 0.9)); }
    for (let x = -6; x <= 6; x += 3) F.beam(VC.metal, '#3a3a40', [x, Hh, -2], [x, Hh + 4.6, -1.4], 0.12);   // ORPHEUM on its frame on the roof
    F.box(VC.metal, '#3a3a40', 0, Hh + 4.3, -1.5, 13, 0.12, 0.12);
    K.sign(F, 'ORPHEUM', { w: 768, h: 160, color: '#ff4a2a', font: NEON, size: 0.68, glow: '#ff3a1a', k: 2.6 }, 0, Hh + 2.6, -1.3, 13, 2.6, 1);
    blade(b, 1, zc + W / 2 - 2.2, 7.4, 'ORPHEUM', { col: '#ff3a2a', W: 2.2, step: 1.5 });
  };
  // the Los Angeles Theatre: French baroque, its great arched window three storeys high between pairs of columns, the
  // entablature, the cartouche and balustrade on top; its blade, white bulbs and gold letters
  const laTheatre = (b, zc) => {
    const W = 20, D = 16, Hh = 24, F = frame(b, -X0, 0, zc, 1, face(-1)), c = '#ece2cc';
    F.addM(K.tiledBox(W, Hh, D, 2.5), K.stuccoMat, T(0, Hh / 2, -D / 2), c);
    shopfronts(F, -W / 2 + 0.6, -5, SHOPS); shopfronts(F, 5, W / 2 - 0.6, SHOPS);
    F.box(VC.solid, '#1a1418', 0, 2.2, 0.05, 9, 4.4, 0.06); for (let k = -3; k <= 3; k++) F.box(VC.glow, hdr('#ffe0b0', 1.3), k * 1.2, 1.4, 0.09, 1.0, 2.6, 0.04);
    marquee(F, 14, 5.2, 'LOS ANGELES', `NOW SHOWING · ${pick(['STARFALL', 'DESERT KING', 'PALM NIGHTS'])}`);
    K.archWin(F, 0, 13.6, 0.06, 6.0, 10.4, hdr('#ffd9a0', 1.05), '#d8c8a8');
    for (let y = 9.4; y < 18; y += 2.1) F.box(VC.solid, '#b8a888', 0, y, 0.12, 6.0, 0.08, 0.04);   // its glazing bars
    for (const e of [-1, 1]) for (const x of [3.8, 5.0]) { F.cyl(VC.solid, shade(c, 1.04), e * x, 13.6, 0.7, 0.36, 11.6, 'cyl'); F.box(VC.solid, shade(c, 0.92), e * x, 19.6, 0.7, 0.9, 0.5, 0.9); F.box(VC.solid, shade(c, 0.92), e * x, 7.95, 0.7, 0.9, 0.5, 0.9); }
    F.box(VC.solid, shade(c, 0.95), 0, 20.4, 0.6, 12.6, 1.0, 1.2);
    F.ell(VC.solid, shade(c, 1.05), 0, 21.9, 0.5, 1.6, 1.3, 0.5); for (const e of [-1, 1]) F.add(G.sphLow, VC.solid, e * 1.9, 21.6, 0.5, 1.4, 0.8, 0.6, 0, 0, e * 0.6, shade(c, 0.98));   // the cartouche
    for (const e of [-1, 1]) windows(F, e * 8.2 - 1.4, e * 8.2 + 1.4, 9, 21, 1, 3, { w: 1.5, h: 2.1, frame: '#8a7a64' });
    cornice(F, W, Hh - 1.0, shade(c, 0.95));
    for (let x = -W / 2 + 0.5; x <= W / 2 - 0.5; x += 0.55) F.cyl(VC.solid, shade(c, 0.95), x, Hh + 0.4, -0.35, 0.1, 0.8, 'cyl6');
    F.box(VC.solid, shade(c, 0.95), 0, Hh + 0.85, -0.35, W, 0.14, 0.3);
    blade(b, -1, zc + W / 2 - 2.2, 7.4, 'LOS ANGELES', { col: '#ffe8b0', W: 2.2, step: 1.22 });
  };
  // the Million Dollar: its office floors of brick over the theatre's churrigueresque front, the arch smothered in
  // ornament, figures in its niches
  const millionDollar = (b, zc) => {
    const W = 18, D = 16, Hh = 36, F = frame(b, -X0, 0, zc, 1, face(-1)), brick = '#a8583e', tc = '#f0e6d4';
    F.addM(K.tiledBox(W, Hh, D, 2.5), K.stuccoMat, T(0, Hh / 2, -D / 2), brick);
    F.box(VC.solid, tc, 0, 6.5, 0.012, W, 13, 0.02);
    shopfronts(F, -W / 2 + 0.6, -4.5, SHOPS); shopfronts(F, 4.5, W / 2 - 0.6, SHOPS);
    F.box(VC.solid, '#1a1418', 0, 2.2, 0.18, 8, 4.4, 0.06); for (let k = -2; k <= 2; k++) F.box(VC.glow, hdr('#ffe0b0', 1.3), k * 1.3, 1.4, 0.22, 1.1, 2.6, 0.04);
    marquee(F, 13, 5.2, 'MILLION DOLLAR', 'CINE · MÚSICA · TEATRO');
    K.archWin(F, 0, 9.6, 0.2, 5.0, 4.6, hdr('#ffd9a0', 0.9), '#c8b090');
    for (let k = 0; k < 26; k++) { const a = Math.PI * (k / 25), r = 3.4 + (k % 2) * 0.35; F.add(pick([G.box, G.sphLow, G.cone4]), VC.solid, Math.cos(a) * r, 11.9 + Math.sin(a) * r * 0.9, 0.35, rand(0.35, 0.6), rand(0.35, 0.7), 0.4, 0, 0, a, shade(tc, rand(0.88, 1.02))); }   // the ornament round the arch
    for (const e of [-1, 1]) { F.box(VC.solid, shade(tc, 0.9), e * 4.2, 9.4, 0.3, 1.8, 3.4, 0.5); figure(frame(b, ...F.at(e * 4.2, 8.0, 0.65).toArray(), 1.15, 0), VC.solid, '#e8dcc8', { skirt: true, arms: e > 0 ? 'out' : 'hips' }); }   // the figures in their niches
    cornice(F, W, 13.2, tc);
    windows(F, -W / 2 + 1, W / 2 - 1, 14.2, Hh - 1.4, 5, 7, { w: 1.6, h: 1.9, frame: '#e8dcc8' });
    cornice(F, W, Hh - 0.4, tc);
  };
  // the Tower: a narrow front of ornament, its clock tower on the corner, the dome on top; its blade
  const towerTheatre = (b, zc) => {
    const W = 12, D = 14, Hh = 17, F = frame(b, -X0, 0, zc, 1, face(-1)), c = '#e4d8c0';
    F.addM(K.tiledBox(W, Hh, D, 2.5), K.stuccoMat, T(0, Hh / 2, -D / 2), c);
    F.box(VC.solid, '#1a1418', 0.8, 2.2, 0.05, 6, 4.4, 0.06); for (let k = -2; k <= 2; k++) F.box(VC.glow, hdr('#ffe0b0', 1.3), 0.8 + k * 1.1, 1.4, 0.09, 0.9, 2.6, 0.04);
    marquee(F, 8.4, 5.2, 'TOWER', `NOW SHOWING · ${pick(['STARFALL', 'DESERT KING', 'PALM NIGHTS'])}`);
    K.archWin(F, 0.8, 11.5, 0.06, 4.0, 5.6, hdr('#ffd9a0', 0.9), '#c8b8a0');
    cornice(F, W, Hh - 0.6, shade(c, 0.95));
    const tx = W / 2 - 1.9, tH = 31;   // the clock tower on the corner, nearer you
    F.addM(K.tiledBox(3.8, tH, 3.8, 2.5), K.stuccoMat, T(tx, tH / 2, -1.9), c);
    for (const e of [-1, 1]) F.box(VC.solid, shade(c, 1.05), tx + e * 1.7, tH / 2, 0.05, 0.4, tH, 0.3);
    F.add(G.cyl, VC.glow, tx, tH - 4, 0.05, 2.4, 0.1, 2.4, Math.PI / 2, 0, 0, hdr('#f4f8f0', 1.2)); F.add(RING, VC.metal, tx, tH - 4, 0.1, 1.25, 1.25, 1.25, 0, 0, 0, '#c8a050');
    F.box(VC.solid, shade(c, 0.9), tx, tH + 0.3, -1.9, 4.4, 0.6, 4.4); F.ell(VC.metal, '#7aa094', tx, tH + 0.6, -1.9, 1.7, 2.2, 1.7); F.cyl(VC.metal, '#c8a050', tx, tH + 3.2, -1.9, 0.06, 1.4, 'cyl6');
    blade(b, -1, zc + W / 2 - 4.6, 7.4, 'TOWER', { col: '#39e8ff', W: 1.8, step: 1.5 });
  };
  const broadway = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) { K.kerbLane(b, s, { x1: X0, red: 0.3 }); farGround(b, s, '#6a5a50'); }
    // the right: a deco front, the Orpheum, a row of little shops, the Eastern Columbia ahead
    K.shop(b, 1, X0, -6, 11, { style: 'deco', floors: 3, sign: pick(DOWNTOWN_SIGNS), blade: true });
    orpheum(b, -23.5);
    K.shop(b, 1, X0, -42.5, 15, { style: 'stucco', floors: 2, sign: pick(DOWNTOWN_SIGNS) });
    easternColumbia(b, -64);
    // the left: the Los Angeles, the Million Dollar, the Tower, the towers of the business district beyond
    laTheatre(b, -12); millionDollar(b, -32.5); towerTheatre(b, -49);
    K.towerRow(b, -1, 56, CHUNK_LEN, { x0: X0, signs: DOWNTOWN_SIGNS });
    // the pavements: crowds, carts, the lamps and their banners; a bus at the kerb; the crossing at the near end
    const taken = [];
    for (const s of [-1, 1]) for (let k = randi(1, 2); k > 0; k--) { const z = rand(8, 74); if (!taken.some((t) => Math.abs(t - z) < 5)) { K.cart(b, s * 9.2, -z, s, pick(['ELOTES', 'FRUTA', 'HOT DOGS', 'MANGOS', 'CHURROS'])); taken.push(z); } }
    for (const s of [-1, 1]) for (let z = 10; z < 76; z += 22) {
      K.lamp(b, s * 7.3, -z, s, { kind: 'twin' });
      K.vsign(b, 'BROADWAY', { color: '#ffd23d', bg: '#7a1a24', font: DECO, k: 1.2 }, s * 7.75, 5.0, -z, 0.5, 2.8, 1, 0, 0, 0);
    }
    for (const s of [-1, 1]) K.throng(b, s * 7.8, s * 10.9, 2, 78, randi(16, 22), taken.map((t) => [t - 2, t + 2]));
    K.metroBus(b, 5.3, -rand(30, 60), 1); K.carRow(b, -5.25, 0, CHUNK_LEN, { p: 0.55, lit: true });
    K.crosswalk(b, 3); for (const s of [-1, 1]) K.signal(b, s * 7.25, -0.8, s);
    K.streetBits(b, 1, 8, CHUNK_LEN, { meters: true, gaps: taken.map((t) => [t - 2, t + 2]) });
    return b;
  };

  // ---------- the Watts Towers ----------
  // one of Rodia's towers in its frame: the legs leaning in to the top, the hoops round them, spokes in to the core every
  // other hoop, a spiral round the outside; bits of bottle glass and tile glinting in the mortar
  const spire = (F, Ht, R, { legs = 7, hoop = 1.15, top = true, col = '#b4aea2' } = {}) => {
    const r = (y) => 0.25 + (R - 0.25) * Math.pow(1 - y / Ht, 0.85);
    F.limb(VC.solid, col, [0, 0, 0], [0, Ht, 0], 0.32, 0.07, 6);
    for (let i = 0; i < legs; i++) {
      const a0 = (i / legs) * Math.PI * 2;
      let prev = null;
      for (let j = 0; j <= 10; j++) { const y = (Ht * j) / 10, a = a0 + j * 0.06, p = [Math.cos(a) * r(y), y, Math.sin(a) * r(y)]; if (prev) F.beam(VC.solid, col, prev, p, 0.16 * (1 - j / 14)); prev = p; }
    }
    for (let y = hoop, h = 0; y < Ht - 0.6; y += hoop, h++) {
      const rr = r(y), n = Math.max(8, Math.round(rr * 4));
      for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2; F.beam(VC.solid, shade(col, rand(0.92, 1.06)), [Math.cos(a) * rr, y, Math.sin(a) * rr], [Math.cos(a1) * rr, y, Math.sin(a1) * rr], 0.1, 0.05); }
      if (h % 3 === 0) for (let k = 0; k < legs; k++) { const a = (k / legs) * Math.PI * 2 + 0.3; F.beam(VC.solid, col, [0, y, 0], [Math.cos(a) * rr, y, Math.sin(a) * rr], 0.06); }
    }
    let prev = null;
    for (let j = 0; j <= 60; j++) { const y = (Ht * 0.9 * j) / 60, a = j * 0.42, rr = r(y) + 0.12, p = [Math.cos(a) * rr, y, Math.sin(a) * rr]; if (prev) F.beam(VC.solid, col, prev, p, 0.07); prev = p; }
    for (let k = 0; k < Ht * 4; k++) { const y = rand(0.3, Ht * 0.95), a = (randi(0, legs - 1) / legs) * Math.PI * 2 + (y / Ht) * 0.6, rr = r(y); F.box(VC.glow, hdr(pick(glints), rand(0.8, 1.5)), Math.cos(a) * rr, y, Math.sin(a) * rr, 0.14, 0.14, 0.14); }   // (bits of glass on the legs)
    if (top) { F.add(RING, VC.solid, 0, Ht - 0.3, 0, 0.9, 0.9, 0.9, Math.PI / 2, 0, 0, col); F.limb(VC.solid, col, [0, Ht - 0.5, 0], [0, Ht + 1.6, 0], 0.08, 0.02, 5); }
  };
  const mosaicWall = (b, x0, z0, x1, z1, h = 1.4) => {   // a stretch of Rodia's wall, its top scalloped, shells along it
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2)), ry = Math.atan2(-(z1 - z0), x1 - x0);
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, hh = h + (k % 2 ? 0.3 : 0);
      b.addM(K.tiledBox(L / n, hh, 0.35, 1), mosaic, new THREE.Matrix4().makeRotationY(ry).setPosition(x0 + (x1 - x0) * t, hh / 2, z0 + (z1 - z0) * t), '#ffffff');
      b.add(G.cyl8, VC.solid, x0 + (x1 - x0) * t, hh, z0 + (z1 - z0) * t, (L / n) * 0.9, 0.24, 0.5, Math.PI / 2, ry, 0, '#a8a296');
    }
  };
  const watts = () => {
    const b = new Batcher();
    // the right: the triangular lot beside the line, walled in mosaic; the three tall towers and the small ones, the
    // gazebo, the ship; the arts center, the houses round it, palms
    farGround(b, 1, '#7a6a52');
    K.pave(b, 11.0, -40, 1.6, CHUNK_LEN, 0.03); b.add(G.plane, VC.solid, 26, 0.035, -40, 28, 72, 1, -Math.PI / 2, 0, 0, '#8a8478');
    mosaicWall(b, 12, -6, 12, -36); mosaicWall(b, 12, -44, 12, -74); mosaicWall(b, 12, -6, 40, -40); mosaicWall(b, 40, -40, 12, -74);
    for (const z of [-36, -44]) b.cyl(VC.solid, '#9a968c', 12, 1.2, z, 0.3, 2.4, 'cyl8');   // the gate's piers
    for (const [x, z, Ht, R, legs] of [[25, -51, 30, 3.0, 8], [21.5, -42, 29.5, 2.8, 7], [28.5, -32, 17.5, 2.4, 7], [17.5, -61, 8, 1.2, 6], [31, -46, 9, 1.4, 6], [16, -34, 6, 1.0, 6], [33.5, -40, 5, 0.9, 5]]) spire(frame(b, x, 0, z, 0.75, rand(0, 6)), Ht, R, { legs });
    const Gz = frame(b, 18.5, 0, -22.5, 0.75, 0);   // the gazebo: its ring of posts, the hoops over them, its spire
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; Gz.beam(VC.solid, '#9a968c', [Math.cos(a) * 3.4, 0, Math.sin(a) * 3.4], [Math.cos(a) * 3.1, 3.4, Math.sin(a) * 3.1], 0.2); }
    for (const [y, r] of [[3.4, 3.15], [3.9, 2.4], [4.3, 1.5]]) Gz.add(RING, VC.solid, 0, y, 0, r, r, r, Math.PI / 2, 0, 0, '#9a968c');
    spire(Gz, 11, 1.0, { legs: 6, hoop: 1.0 });
    Gz.cyl(VC.solid, '#a8a296', 0, 0.25, 0, 3.0, 0.5, 'cyl'); Gz.add(RING, mosaic, 0, 0.5, 0, 2.9, 2.9, 2.9, Math.PI / 2, 0, 0, '#ffffff');
    const S = frame(b, 18.5, 0, -56, 0.75, 0.1);   // the ship of Marco Polo: its hull of hoops and ribs, the mast
    for (const y of [0.4, 1.0, 1.6]) { const n = 16; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, w = 1.1 + y * 0.35; S.beam(VC.solid, '#9a968c', [Math.cos(a) * w, y, Math.sin(a) * 5], [Math.cos(a1) * w, y, Math.sin(a1) * 5], 0.1); } }
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; S.beam(VC.solid, '#9a968c', [Math.cos(a) * 1.1, 0, Math.sin(a) * 5], [Math.cos(a) * 1.66, 1.6, Math.sin(a) * 5], 0.1); }
    spire(frame(b, ...S.at(0, 0, 0.5).toArray(), 0.75, 0), 10, 0.9, { legs: 5 });
    b.addM(K.tiledBox(14, 4.6, 10, 2.5), K.stuccoMat, T(43, 2.3, -11), '#e8e0d4');   // the arts center
    b.box(VC.glow, hdr('#ffe6c0', 0.9), 35.95, 1.8, -11, 0.04, 2.8, 8);
    K.sign(b, 'WATTS TOWERS ARTS CENTER', { w: 768, h: 96, color: '#2a2a2e', font: SANS, weight: 700, size: 0.5, k: 0.9 }, 35.94, 3.9, -11, 9, 0.7, 1, 0, -Math.PI / 2, 0);
    for (const [zc, w] of [[-28, 10], [-50, 11], [-68, 10]]) K.bungalow(b, 1, 47, zc, { w });
    for (const [x, z] of [[44, -78], [13.4, -79], [38, -24], [9.6, -16], [9.6, -64]]) K.fanPalm(b, x, z, rand(1.0, 1.2));
    K.crowd(b, 14, 22, 24, 64, 8, { camera: true }); K.crowd(b, 9.6, 10.6, 4, 76, 6);
    // the left: the 103rd Street platform along the line, its canopy and sign; the fence behind it; the street of
    // bungalows behind their chain-link, the corner market, a mural, the palms
    farGround(b, -1, '#7a6a52');
    b.block(VC.solid, '#b8b4ac', -6.3, 0, -40, 4.6, 0.95, 62); b.box(VC.solid, '#e8c020', -4.35, 0.96, -40, 0.6, 0.02, 62);
    for (let z = -14; z >= -66; z -= 6.5) { b.cyl(VC.metal, '#5a5e64', -7.7, 2.9, z, 0.12, 3.9, 'cyl8'); beam2(b, -7.7, 4.8, z); }
    b.add(G.box, VC.metal, -6.4, 4.95, -40, 4.2, 0.12, 56, 0, 0, 0.12, '#c8ccd2'); b.box(VC.solid, '#3a3a40', -4.35, 4.75, -40, 0.12, 0.3, 56);
    for (const z of [-24, -56]) {
      b.box(VC.solid, '#141414', -6.4, 4.1, z, 3.6, 0.6, 0.12); for (const e of [-1.4, 1.4]) b.box(VC.metal, '#5a5e64', -6.4 + e, 4.6, z, 0.05, 0.5, 0.05);
      K.sign(b, '103RD ST / WATTS TOWERS', { w: 768, h: 96, color: '#ffffff', bg: '#141414', font: SANS, weight: 700, size: 0.48, k: 1.2 }, -6.4, 4.1, z + 0.07, 3.4, 0.45, 1);
      b.cyl(VC.glow, hdr('#0072bc', 1.6), -8.0, 4.1, z + 0.08, 0.22, 0.04, 'cyl', Math.PI / 2); K.sign(b, 'A', { w: 64, h: 64, color: '#ffffff', font: SANS, weight: 700, size: 0.8, k: 1.4 }, -8.0, 4.1, z + 0.11, 0.28, 0.28, 1);
    }
    for (const z of [-30, -46]) K.bench(b, -7.8, z, -1, { y: 0.95, people: chance(0.6) });
    b.block(VC.solid, '#2a2a30', -7.9, 0.95, -38, 0.7, 1.6, 0.5); b.box(VC.glow, hdr('#8ad8ff', 1.4), -7.54, 2.0, -38, 0.02, 0.5, 0.36);   // the ticket machine
    for (let k = randi(4, 7); k > 0; k--) K.person(b, rand(-5.2, -7.6), -rand(16, 64), { y: 0.95, ry: -Math.PI / 2 + rand(-0.4, 0.4), bag: chance(0.4) });
    K.chainLink(b, -9.4, -1, -9.4, -79, { h: 1.9 });
    K.road(b, -13.6, -40, 7.6, CHUNK_LEN, 0.034); K.carRow(b, -16.2, 0, CHUNK_LEN, { p: 0.45 });
    b.box(VC.solid, '#b8b0a4', -17.4, 0.08, -40, 0.14, 0.16, CHUNK_LEN); K.pave(b, -18.4, -40, 2, CHUNK_LEN, 0.03);
    for (let z = 1; z < 62;) {
      const w = rand(9, 11), zc = -(z + w / 2);
      if (chance(0.25)) K.muralWall(b, -1, 19.5, zc, w); else { K.bungalow(b, -1, rand(22, 23.5), zc, { w }); K.chainLink(b, -19.5, zc + w / 2 - 0.3, -19.5, zc - w / 2 + 0.3, { h: 1.2 }); }
      z += w + rand(0.5, 1.5);
    }
    K.shop(b, -1, 19.5, -71, 12, { style: 'stucco', floors: 1, col: '#f2e2a0', sign: STRIP_SIGNS.find((s) => s.t === 'MARKET') || pick(STRIP_SIGNS) });
    K.sign(b, 'LIQUOR · LOTTO · ATM', { w: 768, h: 96, color: '#c8202a', bg: '#f4f0e8', font: SANS, weight: 700, size: 0.55, k: 1.0 }, -19.45, 2.6, -71, 7, 0.6, 1, 0, Math.PI / 2, 0);
    for (const z of [8, 30, 52, 74]) K.fanPalm(b, -18.6, -z, rand(1.0, 1.2));
    K.cart(b, -18.2, -rand(20, 50), -1, 'PALETAS');
    for (let k = randi(2, 3); k > 0; k--) K.cyclist(b, -rand(12, 15), -rand(10, 70), chance(0.5) ? 0 : Math.PI);
    K.crowd(b, -18, -19.5, 4, 76, 5);
    return b;
  };
  const beam2 = (b, x, y, z) => { b.add(G.box, VC.metal, x + 1.4, y, z, 3.0, 0.14, 0.14, 0, 0, 0.12, '#5a5e64'); b.add(G.box, VC.metal, x - 0.55, y - 0.05, z, 1.2, 0.12, 0.12, 0, 0, -0.1, '#5a5e64'); };   // a canopy's arm

  // ---------- Echo Park Lake ----------
  const swanBoat = (b, x, z, ry, yw) => {   // a pedal boat with a swan's neck and head at its bow, two aboard
    const F = frame(b, x, yw, z, 1, ry);
    F.add(G.sph, VC.solid, 0, 0.25, 0, 1.6, 0.9, 2.6, 0, 0, 0, '#f4f2ec');
    F.box(VC.solid, '#e8e4dc', 0, 0.55, 0.3, 1.2, 0.2, 1.2);
    F.limb(VC.solid, '#f4f2ec', [0, 0.5, -0.9], [0, 1.5, -1.25], 0.16, 0.1, 6); F.limb(VC.solid, '#f4f2ec', [0, 1.5, -1.25], [0, 1.65, -1.6], 0.11, 0.07, 6);
    F.add(G.cone4, VC.solid, 0, 1.6, -1.8, 0.1, 0.3, 0.1, -Math.PI / 2, 0, 0, '#e8a020');
    for (const e of [-0.3, 0.3]) { const p = F.at(e, 0, 0.35); K.person(b, p.x, p.z, { seated: true, y: yw + 0.1, ry: ry, bag: false, phone: false, s: 0.9 }); }
  };
  const echoPark = () => {
    const b = new Batcher(), r = new Batcher(), yw = -0.55, X1 = -86;
    // the left: the lake from the promenade's edge to the far shore; the lotus, the boats, the island and its bridge, the
    // fountain; the boathouse and the Lady of the Lake; the palms all round, their reflections under them
    K.kerbLane(b, -1, { x1: 13 });
    b.box(VC.solid, '#c8bcae', -13.3, -0.15, -40, 0.6, 0.9, CHUNK_LEN); b.box(VC.metal, '#3a3a3e', -13.15, 0.75, -40, 0.06, 0.06, CHUNK_LEN);
    for (let z = 1; z < 80; z += 2.5) b.box(VC.metal, '#3a3a3e', -13.15, 0.45, -z, 0.05, 0.6, 0.05);
    b.add(G.plane, lakeMat, (X1 - 13.6) / 2, yw, -40, -13.6 - X1, CHUNK_LEN - 0.4, 1, -Math.PI / 2, 0, 0);
    const bed = hdr('#6a4a6a', 0.7);   // (the sky's dusk under the reflections)
    b.box(VC.glow, bed, (X1 - 13.6) / 2, yw - 26, -40, -13.6 - X1 + 1, 0.4, CHUNK_LEN);
    for (const z of [-0.2, -79.8]) b.box(VC.glow, bed, (X1 - 13.6) / 2, yw - 13, z, -13.6 - X1, 26, 0.4);   // the water's ends, so nothing below shows
    b.box(VC.glow, bed, X1 - 0.2, yw - 13, -40, 0.4, 26, CHUNK_LEN);
    b.box(VC.solid, '#5a6a42', X1 - 40, -0.2, -40, 80, 0.2, CHUNK_LEN); b.box(VC.solid, '#c8bcae', X1 + 0.3, -0.15, -40, 0.6, 0.9, CHUNK_LEN); K.pave(r, X1 - 2.2, -40, 3.4, CHUNK_LEN, 0.03);
    for (let k = 0; k < 260; k++) {   // the lotus: leaves on the water, some held up, the pink flowers
      const far = chance(0.7), x = far ? rand(-24, -78) : rand(-15, -30), z = far ? -rand(58, 78) : -rand(2, 22), up = chance(0.25);
      b.add(G.cyl8, VC.solid, x, yw + (up ? rand(0.3, 0.9) : 0.03), z, rand(0.8, 1.5), 0.03, rand(0.8, 1.5), up ? rand(-0.4, 0.4) : 0, rand(0, 3), up ? rand(-0.4, 0.4) : 0, pick(['#3a6a32', '#4a7a3a', '#2e5a2a', '#5a8a40']));
      if (up) b.cyl(VC.solid, '#3a6a32', x, yw + 0.25, z, 0.03, 0.9, 'cyl6');
      if (chance(0.16)) { const fx = x + rand(-0.4, 0.4), fz = z + rand(-0.4, 0.4), fy = yw + rand(0.4, 1.1); b.cyl(VC.solid, '#3a6a32', fx, (yw + fy) / 2, fz, 0.025, fy - yw, 'cyl6'); b.add(G.sphLow, VC.solid, fx, fy, fz, 0.32, 0.38, 0.32, 0, 0, 0, pick(['#ff8ac8', '#ffb0d8', '#f4e8f0'])); }
    }
    const FX = -46, FZ = -38;   // the fountain: its jet, the spray falling round it, the lamps at its foot
    b.add(G.cone8, VC.glow, FX, yw + 6.5, FZ, 1.0, 13, 1.0, 0, 0, 0, hdr('#f4f8ff', 1.25)); b.add(G.cone8, VC.glow, FX, yw + 4, FZ, 2.6, 8, 2.6, 0, 0, 0, hdr('#dce8f8', 0.5));
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; b.add(G.sphLow, VC.glow, FX + Math.cos(a) * 2.6, yw + 0.3, FZ + Math.sin(a) * 2.6, 1.2, 0.5, 1.2, 0, 0, 0, hdr('#e8f0ff', 0.9)); }
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; b.box(VC.glow, hdr(pick(['#ff5aa8', '#5ac8ff', '#ffd23d']), 2), FX + Math.cos(a) * 1.4, yw + 0.12, FZ + Math.sin(a) * 1.4, 0.4, 0.1, 0.4); }
    const sp = puffs(Array.from({ length: 10 }, (_, k) => [FX + Math.cos(k) * 1.6, yw + 10, FZ + Math.sin(k) * 1.6]), { size: 1.6, grow: 1.8, rise: -8, drift: 2.2, life: 2.2, n: 5, color: '#f4f8ff', opacity: 0.3 });
    extras.spray.push(sp);
    const ix = -30, iz = -66;   // the island, its trees; the footbridge out to it from the promenade
    r.add(G.sphLow, VC.solid, ix, yw - 0.6, iz, 12, 2.6, 9, 0, 0.4, 0, '#5a7a3a');
    for (const [dx, dz] of [[-2, 1], [2.5, -1.5], [0, 2.5]]) K.fig(r, ix + dx, iz + dz, rand(0.6, 0.75), { y: yw + 0.4 });
    const N = 10;
    for (let k = 0; k < N; k++) {
      const t0 = k / N, t1 = (k + 1) / N, x0 = -13.6 + t0 * (ix + 5 + 13.6), x1 = -13.6 + t1 * (ix + 5 + 13.6), y0 = Math.sin(t0 * Math.PI) * 1.8 + 0.1, y1 = Math.sin(t1 * Math.PI) * 1.8 + 0.1;
      const F = frame(r, 0, 0, 0, 1, 0);
      F.beam(VC.solid, '#c8302a', [x0, y0, iz + 3], [x1, y1, iz + 3], 0.22, 2.0);
      for (const e of [-1, 1]) { F.beam(VC.solid, '#c8302a', [x0, y0 + 0.9, iz + 3 + e], [x1, y1 + 0.9, iz + 3 + e], 0.08, 0.08); F.box(VC.solid, '#c8302a', x0, y0 + 0.45, iz + 3 + e, 0.06, 0.9, 0.06); }
    }
    for (let k = 0; k < 7; k++) { const a = rand(0, Math.PI * 2); swanBoat(b, rand(-24, -74), -rand(26, 54), a, yw); }
    for (let k = 0; k < 6; k++) r.add(G.sphLow, VC.solid, rand(-16, -80), yw + 0.12, -rand(4, 76), 0.3, 0.22, 0.45, 0, rand(0, 6), 0, pick(['#f4f2ec', '#5a4a3a', '#3a6a3a']));   // ducks
    const BH = frame(r, X1 - 4, 0, -26, 1, face(-1));   // the boathouse: white, red tile, its arcade on the water
    BH.addM(K.tiledBox(14, 5, 8, 2.5), K.stuccoMat, T(0, 2.5, -4), '#f4f0e8'); BH.addM(hipRoof(15, 9, 2.6), K.tileMat, T(0, 5, 0.5), '#ffffff');
    for (let k = -3; k <= 3; k++) { BH.box(VC.solid, '#f4f0e8', k * 2, 1.6, 1.2, 0.5, 3.2, 0.5); if (k < 3) K.archWin(BH, k * 2 + 1, 1.6, 0.06, 1.3, 2.0, hdr('#ffd9a0', 1.0), '#d8c8b0'); }
    K.sign(BH, 'BOATS', { w: 512, h: 128, color: '#f4f0e8', bg: '#2a5a8a', font: DECO, size: 0.6, k: 1.1 }, 0, 4.2, 0.08, 4, 0.9, 1);
    b.add(G.box, VC.solid, X1 + 3, yw + 0.3, -26, 6, 0.3, 3, 0, 0, 0, '#6a5038');   // its dock
    const LY = frame(r, -16.4, yw - 0.4, -18, 1, 0), bronze = '#a89a7a';   // the Lady of the Lake: on her pedestal in the water by the shore, arms raised
    LY.addM(frustum4(1.2, 1.8, 3.0), VC.solid, T(0, 0, 0), '#d8d0c4'); LY.box(VC.solid, '#c8c0b4', 0, 3.15, 0, 1.4, 0.3, 1.4);
    const lady = frame(r, ...LY.at(0, 3.3, 0).toArray(), 1.6, 0);
    lady.add(G.cone8, VC.metal, 0, 0.55, 0, 0.7, 1.1, 0.6, 0, 0, 0, bronze); lady.limb(VC.metal, bronze, [0, 0.9, 0], [0, 1.55, 0], 0.2, 0.24, 8); lady.ell(VC.metal, bronze, 0, 1.78, 0, 0.12, 0.15, 0.12);
    for (const e of [-1, 1]) lady.limb(VC.metal, bronze, [0, 1.5, e * 0.22], [0.08, 2.3, e * 0.42], 0.07, 0.05, 6);
    for (let z = 3; z < 78; z += rand(11, 15)) K.fanPalm(r, -12.4, -z, rand(1.25, 1.45));   // the palms: along the promenade, round the far shore
    for (let z = 2; z < 78; z += rand(9, 13)) K.fanPalm(r, X1 - rand(4, 9), -z, rand(1.2, 1.5));
    mergeInto(b, r);
    mirrorInto(b, r, yw, 0.5);
    K.throng(b, -8.2, -12.4, 2, 78, randi(8, 12));
    for (let z = 12; z < 76; z += 20) K.lamp(b, -12.2, -z, -1, { kind: 'deco' });
    K.bench(b, -12.2, -32, -1, { people: true }); K.bench(b, -12.2, -54, -1, { people: true });
    K.cart(b, -9.6, -42, -1, 'ELOTES'); K.cart(b, -9.6, -62, -1, 'PALETAS');
    K.person(b, -12.9, -46, { ry: Math.PI / 2, hat: 'cap' }); b.add(G.box, VC.solid, -14.6, 1.2, -46, 0.03, 0.03, 3.6, 0, Math.PI / 2, -0.5, '#2a2420');   // someone fishing
    // the right: Glendale Boulevard, the Angelus Temple's portico and dome, its radio masts; Echo Park's houses up the hill
    // behind, the stair climbing between them
    K.kerbLane(b, 1, { x1: 12 }); farGround(b, 1, '#6a6050');
    const AT = frame(b, 14, 0, -28, 1, face(1)), white = '#f2ece2';
    AT.addM(K.tiledBox(34, 15, 30, 2.5), K.stuccoMat, T(0, 7.5, -15), white);
    for (let k = -4; k <= 4; k++) { AT.cyl(VC.solid, '#f8f4ec', k * 3.4, 6, 2.6, 0.55, 12, 'cyl'); AT.box(VC.solid, '#e8e0d4', k * 3.4, 12.2, 2.6, 1.4, 0.4, 1.4); AT.box(VC.solid, '#e8e0d4', k * 3.4, 0.2, 2.6, 1.4, 0.4, 1.4); }
    AT.box(VC.solid, white, 0, 13.4, 2.4, 30.4, 2.0, 1.8); AT.box(VC.solid, '#e8e0d4', 0, 12.3, 1.6, 31, 0.4, 3.4);
    K.sign(AT, 'ANGELUS TEMPLE', { w: 768, h: 112, color: '#3a3a42', font: SERIF, weight: 700, size: 0.6, k: 0.95 }, 0, 13.4, 3.32, 18, 1.4, 1);
    for (let k = -2; k <= 2; k++) K.archWin(AT, k * 5.4, 6.2, 0.05, 2.2, 5.2, hdr('#ffd9a0', 1.0), '#d8d0c4');
    AT.box(VC.solid, '#3a2a20', 0, 2.0, 0.06, 3.2, 4.0, 0.06);
    AT.cyl(VC.solid, white, 0, 16.2, -15, 14.5, 2.4, 'cyl'); AT.add(G.sph, VC.solid, 0, 17.4, -15, 29, 13, 29, 0, 0, 0, '#e4dcd0');
    AT.cyl(VC.solid, white, 0, 24.2, -15, 1.6, 1.8, 'cyl8'); AT.add(G.cone8, VC.solid, 0, 25.9, -15, 3.4, 1.6, 3.4, 0, 0, 0, '#c8c0b4'); AT.box(VC.metal, '#d8c890', 0, 27.6, -15, 0.16, 1.8, 0.16); AT.box(VC.metal, '#d8c890', 0, 27.9, -15, 0.9, 0.16, 0.16);
    for (const e of [-1, 1]) { AT.limb(VC.metal, '#8a8e94', [e * 13, 15, -24], [e * 13, 34, -24], 0.3, 0.08, 5); AT.box(K.blinkRed, 0xffffff, e * 13, 34.2, -24, 0.4, 0.4, 0.4); for (const y of [20, 26]) AT.beam(VC.metal, '#8a8e94', [e * 13 - 2.5, 15, -24], [e * 13, y, -24], 0.06); }
    H.slope(b, 13, 0, 60, 18, '#5a6a42', { scrub: 18, z0: -50, z1: -CHUNK_LEN });
    b.block(VC.solid, '#5a6a42', 90, 0, -65, 60, 18, 30);
    for (let k = 0; k < 7; k++) {   // the hillside houses, stepping up
      const x = 20 + k * 5.6 + rand(-1, 1), y = ((x - 13) / 47) * 18, z = -rand(53, 76);
      b.addM(K.tiledBox(5.4, 4.2, 7, 2.5), K.stuccoMat, T(x + 1.5, y + 1.6, z), pick([...PASTEL, '#e8a090', '#8ac8b8']));
      b.add(G.box, VC.solid, x + 1.5, y + 3.9, z, 6.2, 0.2, 7.8, 0, 0, 0.18, pick(['#7a3a2a', '#3a3a40', '#5a4a3a']));
      b.box(VC.glow, K.glass(0.6, true), x - 1.22, y + 2.0, z, 0.04, 1.2, 1.6);
      for (const e of [-1, 1]) b.cyl(VC.solid, '#6a5a4a', x - 0.8, y - 0.4, z + e * 2.8, 0.1, 2.4, 'cyl6');
    }
    for (let k = 0; k < 18; k++) { const x = 13.5 + k * 2.6, y = ((x - 13) / 47) * 18; b.box(VC.solid, '#c8c0b4', x, y + 0.15, -51.2, 2.6, 0.3, 1.8); for (const e of [-1, 1]) b.box(VC.metal, '#5a5a5e', x, y + 1.0, -51.2 + e * 0.95, 2.6, 0.05, 0.05); }   // the stair
    for (const [x, z] of [[24, -70], [40, -62], [52, -74], [12.6, -48], [12.6, -78]]) K.fanPalm(b, x, z, rand(1.0, 1.2), { y: Math.max(0, ((x - 13) / 47) * 18) });
    K.throng(b, 7.8, 11, 2, 78, randi(6, 10)); K.carRow(b, 5.25, 0, CHUNK_LEN, { p: 0.5, lit: true });
    K.busStop(b, 8.0, -60, 1, { shelter: true });
    for (let k = randi(1, 3); k > 0; k--) K.cyclist(b, rand(8, 10), -rand(6, 74), chance(0.5) ? 0 : Math.PI);
    return b;
  };

  // ---------- Dodger Stadium ----------
  // A deck of seats round home plate: rows stepping up from r0, y0 to r1, y1 (about 0.9 m each), the treads in its colour
  // and the seat backs darker, its fascia along the front; swept from phi0 through phiL (LatheGeometry's angle, 0 toward
  // +z), built back to front so that the faces look in, toward the field; people in it.
  const deck = (b, r0, r1, y0, y1, col, phi0, phiL, { fascia = 1.4, fc = '#f4f2ec', seg = 36 } = {}) => {
    const rows = Math.max(2, Math.round((r1 - r0) / 0.9)), pts = [new THREE.Vector2(r0, y0 - fascia)];
    for (let k = 0; k < rows; k++) { const ra = r0 + ((r1 - r0) * k) / rows, rb = r0 + ((r1 - r0) * (k + 1)) / rows, y = y0 + ((y1 - y0) * (k + 1)) / rows; pts.push(new THREE.Vector2(ra, y), new THREE.Vector2(rb, y)); }
    pts.push(new THREE.Vector2(r1, DS.FY - 0.2));   // its back, down to the concourse
    const g0 = new THREE.LatheGeometry(pts.reverse(), seg, phi0, phiL), g = g0.toNonIndexed(); g0.dispose(); g.computeVertexNormals();
    const P = g.attributes.position, N = g.attributes.normal, C = new Float32Array(P.count * 3), cs = new THREE.Color(col), cr = new THREE.Color(shade(col, 0.55)), cf = new THREE.Color(fc), cb = new THREE.Color('#c8c4bc');
    for (let i = 0; i < P.count; i += 3) {
      const low = [0, 1, 2].every((j) => P.getY(i + j) < y0 + 0.01), back = [0, 1, 2].every((j) => Math.hypot(P.getX(i + j), P.getZ(i + j)) > r1 - 0.02);
      const c = back ? cb : low ? cf : N.getY(i) > 0.5 ? cs : cr;
      for (let j = 0; j < 3; j++) C.set([c.r, c.g, c.b], (i + j) * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    b.addM(g, VC.solid, T(DS.HX, 0, DS.HZ), null);
    for (let k = 0; k < (r1 - r0) * (phiL / Math.PI) * 10; k++) {
      const t = Math.floor(rand(0, rows)), ra = r0 + ((r1 - r0) * (t + 0.5)) / rows, y = y0 + ((y1 - y0) * (t + 1)) / rows, a = phi0 + rand(0.02, 0.98) * phiL;
      b.box(VC.solid, pick(['#f4f4f0', '#1a4a9a', '#1a1a1e', '#c8302a', '#2a5ad8', '#e8e4dc', '#3a6ad8']), DS.HX + Math.sin(a) * ra, y + 0.4, DS.HZ + Math.cos(a) * ra, 0.42, 0.8, 0.42);
    }
  };
  const lightBank = (b, x, y, z, ry) => {   // a bank of floodlights on its standard, turned on the field (its face toward local -z)
    const F = frame(b, x, y, z, 1, ry);
    F.cyl(VC.metal, '#8a8e94', 0, -4.95, 0, 0.22, 9.9, 'cyl8');
    F.add(G.box, VC.metal, 0, 1.2, 0, 6.4, 3.6, 0.4, -0.35, 0, 0, '#3a3a40');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) F.add(G.box, VC.glow, -2.6 + c * 1.04, 0.15 + r * 1.05, -0.26 + r * 0.36, 0.8, 0.8, 0.06, -0.35, 0, 0, hdr('#fff8ee', 3.4));
  };
  const scoreboard = (b, x, y, z, ry) => {   // a hexagonal scoreboard on its posts over a pavilion, lit both sides
    const F = frame(b, x, y, z, 1, ry);
    for (const e of [-1, 1]) F.box(VC.metal, '#3a3a40', e * 2.4, -2.8, 0, 0.4, 5.6, 0.4);
    F.add(G.cyl6, VC.solid, 0, 2.6, 0, 10, 1.0, 10, Math.PI / 2, 0, Math.PI / 6, '#1a1a1e');
    for (const e of [-1, 1]) {
      F.box(VC.glow, hdr('#2a2a34', 1), 0, 2.6, e * 0.52, 7.4, 3.6, 0.02);
      K.sign(F, 'LOS ANGELES  3', { w: 512, h: 96, color: '#ffd23d', font: SANS, weight: 700, size: 0.62, k: 1.6 }, 0, 3.4, e * 0.54, 6.8, 1.2, 1, 0, e > 0 ? 0 : Math.PI, 0);
      K.sign(F, 'VISITORS  2', { w: 512, h: 96, color: '#ffffff', font: SANS, weight: 700, size: 0.62, k: 1.5 }, 0, 2.0, e * 0.54, 6.8, 1.2, 1, 0, e > 0 ? 0 : Math.PI, 0);
    }
  };
  const pavilion = (b, x, z, ry) => {   // an outfield pavilion facing home: its bleachers, the folded-plate roof zigzagging over them, the scoreboard on top
    const F = frame(b, x, DS.FY, z, 1, ry);
    for (let k = 0; k < 10; k++) F.box(VC.solid, k % 2 ? '#f2c230' : shade('#f2c230', 0.55), 0, 0.5 + k * 0.55, -k * 0.7, 16, 0.55, 0.7);
    F.block(VC.solid, '#d8d4cc', 0, 0, -7.4, 17, 6.6, 0.8);
    for (const e of [-1, 1]) F.box(VC.solid, '#d8d4cc', e * 8.3, 3.3, -3.4, 0.5, 6.6, 7.6);
    for (let k = 0; k < 8; k++) F.add(G.box, VC.solid, -8 + k * 2 + 1, 9.2, -3.4, 2.15, 0.12, 9.2, 0, 0, k % 2 ? 0.38 : -0.38, '#f4f2ec');
    for (const e of [-7.6, 7.6]) F.box(VC.solid, '#e8e4dc', e, 4.8, -0.2, 0.4, 9.0, 0.4);
    for (let k = 0; k < 36; k++) F.box(VC.solid, pick(['#f4f4f0', '#1a4a9a', '#1a1a1e', '#c8302a']), rand(-7.5, 7.5), 1.2 + Math.floor(rand(0, 9)) * 0.55, -Math.floor(rand(0, 9)) * 0.7, 0.42, 0.8, 0.42);
    const p = F.at(0, 13.2, -4); scoreboard(b, p.x, p.y, p.z, ry);
  };
  const dodger = () => {
    const b = new Batcher(), { HX, HZ, FY, A } = DS, Q = Math.PI / 4;
    // the right: the rim of the ravine and its fence, the slope down to the field; the decks wrapped round home plate ahead,
    // their lights on the roof; the pavilions by the poles; a game on; the hills and palms behind
    K.kerbLane(b, 1, { x1: 11.6 });
    K.chainLink(b, 11.7, -1, 11.7, -79, { h: 1.8 });
    quad(b, VC.solid, 12, 0, 20, FY, -2, -78, { col: '#4a5a34' });
    for (let k = 0; k < 30; k++) { const t = rand(0.05, 0.95); b.add(G.sphLow, VC.solid, 12 + 8 * t, FY * t + 0.2, -rand(3, 77), rand(1.2, 2.2), rand(0.8, 1.3), rand(1.2, 2.2), 0, rand(0, 3), 0, pick(['#3e5030', '#4a5a34', '#5a6a3a'])); }
    for (const z of [-1.2, -78.8]) b.box(VC.solid, '#4a5a34', 61, FY / 2, z, 98, -FY, 2.4);   // the ravine's ends
    b.box(VC.solid, '#3a4a2e', 56, FY - 0.1, -40, 88, 0.2, 76);
    b.add(G.plane, field, (DS.X0 + DS.X1) / 2, FY + 0.02, (DS.Z0 + DS.Z1) / 2, DS.X1 - DS.X0, DS.Z0 - DS.Z1, 1, -Math.PI / 2, 0, 0);
    const F0 = frame(b, 0, 0, 0, 1, 0);
    for (let k = 0; k < 24; k++) {   // the outfield wall, its padding blue, the yellow line along its top; the foul poles
      const a = -Q + (k / 24) * 2 * Q, a1 = -Q + ((k + 1) / 24) * 2 * Q, [x, z] = dsAt(fence(a), a), [x1, z1] = dsAt(fence(a1), a1);
      F0.beam(VC.solid, '#1a3a7a', [x, FY + 0.9, z], [x1, FY + 0.9, z1], 0.4, 1.8); F0.beam(VC.solid, '#f2c230', [x, FY + 1.85, z], [x1, FY + 1.85, z1], 0.42, 0.1);
    }
    for (const a of [-Q, Q]) { const [x, z] = dsAt(fence(a), a); b.cyl(VC.solid, '#f2c230', x, FY + 7, z, 0.18, 14, 'cyl8'); }
    // the decks: field level round to near the left-field line, the upper three from the right-field line round behind home
    const p0 = A + Q + 0.04, pL = Math.PI * 0.86, pF = Math.PI * 1.28;
    deck(b, 9, 16, FY + 0.8, FY + 4.6, '#f2c230', p0, pF, { fascia: 1.6, fc: '#1a3a7a' });
    deck(b, 12, 19, FY + 7.5, FY + 11, '#e8803a', p0 + 0.06, pL);
    deck(b, 15.5, 22.5, FY + 14, FY + 18, '#3ab8b0', p0 + 0.1, pL - 0.04);
    deck(b, 19, 26.5, FY + 21, FY + 25.5, '#6aaee8', p0 + 0.14, pL - 0.08);
    for (let k = 0; k <= 8; k++) {   // the roof over the top deck's back rows, the light standards on it
      const a = p0 + 0.14 + (k / 8) * (pL - 0.08), a1 = p0 + 0.14 + ((k + 1) / 8) * (pL - 0.08);
      if (k < 8) F0.beam(VC.solid, '#e8e4dc', [HX + Math.sin(a) * 24.8, FY + 28.6, HZ + Math.cos(a) * 24.8], [HX + Math.sin(a1) * 24.8, FY + 28.6, HZ + Math.cos(a1) * 24.8], 0.25, 4.4);
      b.cyl(VC.solid, '#e8e4dc', HX + Math.sin(a) * 26.6, FY + 27, HZ + Math.cos(a) * 26.6, 0.22, 3.2, 'cyl8');
      if (k % 2 === 1) lightBank(b, HX + Math.sin(a) * 27, FY + 38, HZ + Math.cos(a) * 27, a);
    }
    for (const e of [-1, 1]) { const a = e * 0.6, [x, z] = dsAt(fence(a) + 5, a); pavilion(b, x, z, A + a + Math.PI); }
    for (const [d, a] of [[18.4 * DS.s, 0], [13.7 * 0.8, -Q], [19.4 * 0.8, 0], [13.7 * 0.8, Q], [11, -0.4], [11, 0.4], [30, -0.55], [36, 0], [30, 0.55]]) { const [x, z] = dsAt(d, a); K.person(b, x, z, { y: FY, top: '#f4f4f0', legs: '#f4f4f0', hat: 'cap', ry: A + a, bag: false, phone: false }); }   // the fielders, facing home
    for (const [d, top] of [[-1.1, '#2a2a30'], [-0.5, '#c8302a']]) { const [x, z] = dsAt(d, d < -1 ? 0 : 0.6); K.person(b, x, z, { y: FY, top, legs: '#3a3a40', hat: 'cap', ry: A + Math.PI, bag: false, phone: false }); }   // the catcher, the batter
    for (const e of [-1, 1]) { const [x, z] = dsAt(7.5, e * 1.2); b.block(VC.solid, '#1a1a20', x, FY - 0.2, z, 3, 1.6, 3); b.box(VC.solid, '#1a3a7a', x, FY + 1.5, z, 3.4, 0.2, 3.4); }   // the dugouts
    quad(b, VC.solid, 70, FY, 104, 4, -2, -78, { col: '#5a6046' });   // the hills behind, the palms along their crest
    b.block(VC.solid, '#5a6046', 140, 0, -40, 72, 4, 76);
    for (let z = 4; z < 77; z += rand(6, 9)) K.fanPalm(b, rand(105, 112), -z, rand(1.1, 1.3), { y: 4 });
    for (let k = 0; k < 18; k++) { const x = rand(72, 102); b.add(G.sphLow, VC.solid, x, FY + ((x - 70) / 34) * (4 - FY) + 0.3, -rand(4, 76), rand(1.4, 2.6), rand(0.8, 1.4), rand(1.4, 2.6), 0, rand(0, 3), 0, pick(['#3e5030', '#4a5a34', '#5a6a3a'])); }
    for (let z = 6; z < 78; z += rand(16, 22)) K.fanPalm(b, 10.4, -z, rand(1.0, 1.15));
    K.crowd(b, 10, 11.2, 4, 76, 8, { ry: -Math.PI / 2, camera: chance(0.5) });
    // the left: Elysian Park's hillside, pines and gums on it; the stadium's sign by the road, the cars coming up to the game
    K.kerbLane(b, -1, { x1: 12.4 });
    H.slope(b, -72, 16, -13, 0, '#5a6a42', { scrub: 24 });
    b.block(VC.solid, '#5a6a42', -110, 0, -40, 76, 16, CHUNK_LEN);
    for (let k = 0; k < 11; k++) { const x = rand(16, 66), y = ((x - 13) / 59) * 16; (chance(0.5) ? K.gum : K.pine)(b, -x, -rand(4, 76), rand(0.7, 1.0), { y }); }
    for (let z = 6; z < 78; z += rand(14, 18)) K.fanPalm(b, -9.8, -z, rand(1.0, 1.2));
    const SG = frame(b, -11.6, 0, -24, 1, face(-1));   // the sign at the gate
    for (const e of [-1, 1]) SG.box(VC.solid, '#c8c4bc', e * 3.4, 1.6, -0.2, 0.5, 3.2, 0.5);
    SG.box(VC.solid, '#1a4a9a', 0, 2.6, -0.1, 7.6, 1.8, 0.24);
    K.sign(SG, 'DODGER STADIUM', { w: 768, h: 144, color: '#f4f4f0', font: DECO, size: 0.6, k: 1.3 }, 0, 2.75, 0.03, 7.0, 1.2, 1);
    SG.box(VC.solid, '#f4f4f0', 0, 1.45, -0.1, 6.8, 0.5, 0.12); K.sign(SG, 'SUNSET GATE · PARKING', { w: 768, h: 80, color: '#1a4a9a', bg: '#f4f4f0', font: SANS, weight: 700, size: 0.55, k: 1.0 }, 0, 1.45, -0.03, 4.6, 0.45, 1);
    K.carRow(b, -5.25, 0, CHUNK_LEN, { p: 0.85, lit: true, dir: -1 });
    K.cart(b, -9.4, -44, -1, 'HOT DOGS');
    for (let k = randi(6, 10); k > 0; k--) K.person(b, -rand(7.8, 11), -rand(4, 76), { top: pick(['#1a4a9a', '#f4f4f0', '#1a4a9a']), hat: 'cap', ry: chance(0.5) ? 0 : Math.PI });
    return b;
  };

  const done = (fn) => () => { const r = fn(), g = K.flush((r.b || r).build()); for (const o of r.extra || []) g.add(o); for (const m of extras.spray.splice(0)) { g.add(m); extras.live.push(m); } return g; };
  extras.live = [];
  const LIST = [['broadway', '百老汇剧院区', 'BROADWAY THEATRE DISTRICT', broadway], ['watts', '瓦茨塔', 'WATTS TOWERS', watts],
    ['echoPark', '回声公园湖', 'ECHO PARK LAKE', echoPark], ['dodger', '道奇体育场', 'DODGER STADIUM', dodger]];
  return {
    landmarks: Object.fromEntries(LIST.map(([key, name, en, fn]) => [key, { key, name, en, build: done(fn) }])),
    update(t) {
      lakeMat.userData.scroll.offset.set(t * 0.004, t * 0.012);
      for (const m of extras.live) m.userData.update(t);
    },
  };
}
