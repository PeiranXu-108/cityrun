// Los Angeles's icons for the far skyline, each modelled once in its own frame (ny_icons.js `frame`) and drawn unlit
// with its shading baked: the Hollywood Sign on Mount Lee, Griffith Observatory on its ridge, the Getty on its hill,
// City Hall's white tower and stepped pyramid, downtown's towers (the Wilshire Grand's sail and spire, the U.S. Bank
// Tower's glass crown, the Aon Center's dark slab, the Gas Company's blue crown), Mount Wilson's masts; the premiere
// searchlights. S is the style: materials (wall, glow, dark, metal, sign) and colours (c...).
import { THREE, G, rand, pick } from '../core.js';
import { frustum4 } from './ny_icons.js';
import { windowed } from './sf_icons.js';

// ---------- the Hollywood Sign ----------
// Nine white letters on the slope of Mount Lee, each a few strokes in a unit box (x right, y up), set out along x in
// metres at about their real size (13.7 m tall, the whole 110 m long); they stand on their scaffolds and lean a little,
// each at its own height on the hill. yAt(x): the hillside's height under a letter.
const STROKES = {
  H: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 0.5, 1, 0.5]],
  O: [[0, 0.1, 0, 0.9], [1, 0.1, 1, 0.9], [0.1, 1, 0.9, 1], [0.1, 0, 0.9, 0], [0, 0.9, 0.1, 1], [0.9, 1, 1, 0.9], [0, 0.1, 0.1, 0], [0.9, 0, 1, 0.1]],
  L: [[0, 0, 0, 1], [0, 0, 1, 0]],
  Y: [[0, 1, 0.5, 0.48], [1, 1, 0.5, 0.48], [0.5, 0.48, 0.5, 0]],
  W: [[0, 1, 0.24, 0], [0.24, 0, 0.5, 0.64], [0.5, 0.64, 0.76, 0], [0.76, 0, 1, 1]],
  D: [[0, 0, 0, 1], [0, 1, 0.66, 1], [0, 0, 0.66, 0], [0.66, 1, 1, 0.72], [0.66, 0, 1, 0.28], [1, 0.28, 1, 0.72]],
};
const WIDTH = { H: 10.4, O: 10.4, L: 9, Y: 11, W: 14, D: 10.4 };
export const SIGN_LEN = 'HOLLYWOOD'.split('').reduce((s, c) => s + WIDTH[c], 0) + 8 * 1.8;
export function hollywoodSign(F, S, { yAt = () => 0, foot = 6, H = 13.7, t = 2.4 } = {}) {
  let x = -SIGN_LEN / 2;
  for (const c of 'HOLLYWOOD') {
    const w = WIDTH[c], y0 = yAt(x + w / 2), lean = rand(-0.05, 0.05), cx = x + w / 2;
    const P = (u, v) => { const px = (u - 0.5) * (w - t), py = v * (H - t) + t / 2; return [cx + px * Math.cos(lean) - py * Math.sin(lean), y0 + px * Math.sin(lean) + py * Math.cos(lean), 0]; };
    for (const [u0, v0, u1, v1] of STROKES[c]) {
      const a = P(u0, v0), b = P(u1, v1), d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ex = ((b[0] - a[0]) / d) * t * 0.5, ey = ((b[1] - a[1]) / d) * t * 0.5;
      F.beam(S.sign, S.cSign, [a[0] - ex, a[1] - ey, 0], [b[0] + ex, b[1] + ey, 0], t, 0.6);
    }
    for (const u of [0.15, 0.5, 0.85]) F.box(S.dark, S.cDark, cx + (u - 0.5) * w, y0 + H * 0.45 - foot / 2, -1.6, 0.5, H * 0.9 + foot, 0.5);   // the scaffold behind it, down into the hill
    x += w + 1.8;
  }
}

// ---------- Griffith Observatory ----------
// The white building along its ridge: the planetarium's big dome on its drum in the middle, the wings and their
// arcades out to the two telescope domes, lit windows; the Astronomers Monument on the lawn in front.
export function griffith(F, S, { foot = 0 } = {}) {
  F.box(S.wall, S.cWhite, 0, (15 - foot) / 2, 0, 36, 15 + foot, 30);
  F.cyl(S.wall, S.cWhite, 0, 16.5, 0, 12.6, 5, 'cyl');
  F.add(G.sph, S.metal, 0, 18.6, 0, 24.4, 20, 24.4, 0, 0, 0, S.cDome);
  F.cyl(S.wall, S.cWhite2, 0, 29, 0, 1.1, 2, 'cyl8');
  for (const e of [-1, 1]) {
    F.box(S.wall, S.cWhite2, e * 31, (10 - foot) / 2, 4, 28, 10 + foot, 12);
    for (let k = 0; k < 6; k++) F.box(S.glow, S.cArch, e * (20 + k * 4), 4.6, 10.1, 2.2, 4.8, 0.2);   // the arcade, lit
    F.cyl(S.wall, S.cWhite, e * 47, 6.5, 4, 6.6, 13, 'cyl');
    F.add(G.sph, S.metal, e * 47, 13, 4, 12.2, 10, 12.2, 0, 0, 0, S.cDome);
  }
  for (let k = -2; k <= 2; k++) F.box(S.glow, S.cWin, k * 6, 7, 15.1, 2.4, 6, 0.2);
  F.box(S.wall, S.cWhite, 0, 6, 34, 2.4, 14, 2.4); F.add(G.cone4, S.wall, 0, 13.8, 34, 2.4, 2, 2.4, 0, 0, 0, S.cWhite);
}

// ---------- the Getty ----------
// On its hilltop over the freeway: long low pavilions of pale travertine, a round one, their windows lit
export function getty(F, S, { foot = 0 } = {}) {
  for (const [x, z, w, d, h] of [[-40, 0, 46, 22, 16], [10, -10, 40, 26, 20], [52, 8, 34, 20, 14], [-6, 28, 30, 18, 12]]) {
    F.box(S.wall, S.cStone, x, (h - foot) / 2, z, w, h + foot, d);
    F.box(S.glow, S.cWin, x, h * 0.55, z + d / 2 + 0.1, w * 0.8, h * 0.25, 0.2);
  }
  F.cyl(S.wall, S.cStone, -10, 11, 16, 13, 22, 'cyl'); F.cyl(S.glow, S.cWin, -10, 12, 16, 13.2, 4, 'cyl');
}

// ---------- City Hall ----------
// The white tower over its wide base, set back near the top under a colonnade, then the stepped pyramid and its lantern
export function cityHall(F, S, { foot = 0 } = {}) {
  F.box(S.wall, S.cWhite2, 0, (34 - foot) / 2, 0, 76, 34 + foot, 46);
  F.box(S.wall, S.cWhite, 0, 56, 0, 27, 112, 27);
  for (let k = -2; k <= 2; k++) F.box(S.glow, S.cWin, k * 4.6, 64, 13.6, 1.6, 84, 0.2);   // the lit windows up its face, between the piers
  F.box(S.wall, S.cWhite2, 0, 113, 0, 22, 4, 22);
  for (let k = -2; k <= 2; k++) F.box(S.glow, S.cArch, k * 4, 118, 11.1, 2.2, 6, 0.2);   // the colonnade
  F.box(S.wall, S.cWhite, 0, 118, 0, 21, 8, 21);
  for (let k = 0; k < 5; k++) F.addM(frustum4(19 - k * 3.4, 21 - k * 3.4, 2.2), S.wall, new THREE.Matrix4().makeTranslation(0, 122 + k * 2.2, 0), k % 2 ? S.cWhite2 : S.cWhite);
  F.cyl(S.wall, S.cWhite, 0, 135, 0, 1.6, 3, 'cyl8'); F.box(S.glow, S.cRed, 0, 137.2, 0, 1.2, 1.2, 1.2);
}

// ---------- downtown's towers ----------
// windowed: the skyline's lit-window texture wrapped round a prism or a cylinder (mat), shaded and coloured by S
const box = (F, mat, col, w, d, h, foot, taper = 1, n = 4) => F.addM(windowed(taper, n, (w + d) / 2, h + foot), mat, new THREE.Matrix4().compose(new THREE.Vector3(0, (h - foot) / 2, 0), new THREE.Quaternion(), new THREE.Vector3(w, h + foot, d)), col);
export function wilshireGrand(F, S, mat, { foot = 0 } = {}) {   // the tallest: a glass slab narrowing as it rises, the sail of its crown lit along its edge, the spire
  box(F, mat, S.cGlass, 62, 36, 280, foot, 0.84);
  const pts = [];
  for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([-24 + 48 * t, 280 + 26 * Math.sin(t * Math.PI * 0.5) * (1 - 0.35 * t), 0]); }
  for (let k = 1; k < pts.length; k++) { F.beam(S.glow, S.cSail, pts[k - 1], pts[k], 1.8, 2.0); F.beam(S.wall, S.cGlass2, [pts[k][0], 280, 0], pts[k], 1.2, 14); }
  F.limb(S.metal, S.cSteel, [16, 300, 0], [16, 336, 0], 1.6, 0.3, 6);
  F.box(S.glow, S.cRed, 16, 337, 0, 1.4, 1.4, 1.4);
}
export function usBank(F, S, mat, { foot = 0 } = {}) {   // the round tower with its stepped setbacks, the crown of glass lit from within, the helipad
  F.addM(windowed(1, 16, 52, 250 + foot), mat, new THREE.Matrix4().compose(new THREE.Vector3(0, (250 - foot) / 2, 0), new THREE.Quaternion(), new THREE.Vector3(52, 250 + foot, 52)), S.cGlass);
  for (const [y, r, h] of [[250, 23, 18], [268, 20, 16], [284, 17, 12]]) F.addM(windowed(1, 16, r * 2, h), mat, new THREE.Matrix4().compose(new THREE.Vector3(0, y + h / 2, 0), new THREE.Quaternion(), new THREE.Vector3(r * 2, h, r * 2)), S.cGlass);
  F.cyl(S.glow, S.cCrown, 0, 302, 0, 15, 12, 'cyl');
  F.cyl(S.wall, S.cWhite2, 0, 308.6, 0, 16, 1.2, 'cyl');
  F.box(S.glow, S.cRed, 0, 310, 0, 1.4, 1.4, 1.4);
}
export function aon(F, S, { foot = 0 } = {}) {   // the dark slab, its corners cut back, a pale band round its top
  F.box(S.dark, S.cDarkGlass, 0, (262 - foot) / 2, 0, 58, 262 + foot, 38);
  for (const e of [-1, 1]) for (const f of [-1, 1]) F.add(G.box, S.dark, e * 29, (262 - foot) / 2, f * 19, 6, 262 + foot, 6, 0, Math.PI / 4, 0, S.cDarkGlass);
  for (let y = 12; y < 252; y += 6) F.box(S.glow, S.cWinDim, 0, y, 19.2, 46, 1.2, 0.2);
  F.box(S.wall, S.cWhite2, 0, 260, 0, 59, 4, 39);
}
export function gasCo(F, S, mat, { foot = 0 } = {}) {   // blue glass, its crown lit blue like a gas flame
  box(F, mat, S.cBlueGlass, 44, 44, 220, foot, 0.96);
  F.box(S.glow, S.cFlame, 0, 226, 0, 30, 12, 30);
  F.box(S.wall, S.cGlass2, 0, 233, 0, 32, 2, 32);
}
export function mast(F, S, lamp, { h = 120, foot = 0 } = {}) {   // a TV mast on the mountain, its red lamps
  F.limb(S.metal, S.cSteel, [0, -foot, 0], [0, h, 0], 3, 0.6, 5);
  for (const e of [-1, 1]) F.beam(S.metal, S.cSteel, [e * 14, -foot, 0], [0, h * 0.7, 0], 0.8, 0.8);
  for (const y of [h * 0.5, h]) F.box(lamp.mat, lamp.col, 0, y, 0, 4, 4, 4);
}

// ---------- the searchlights ----------
// a premiere's searchlight beam: a long thin cone from its foot (narrow) up into the sky, fading as it goes; the
// caller swings it
export function searchlight(len = 900, r = 16, k = 0.13) {
  const geo = new THREE.ConeGeometry(r, len, 14, 1, true);
  geo.rotateX(Math.PI); geo.translate(0, len / 2, 0);   // the point at the foot, opening upward
  const P = geo.attributes.position, col = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) { const f = Math.pow(1 - Math.min(1, P.getY(i) / len), 1.4) * k; col.set([f * 0.92, f * 0.96, f], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide, forceSinglePass: true }));
  m.frustumCulled = false; m.renderOrder = -2;
  return m;
}
