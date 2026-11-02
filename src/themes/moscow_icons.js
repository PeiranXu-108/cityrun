// Moscow's icons, each modelled once in its own frame (ny_icons.js `frame`) so the same model can stand in a landmark
// scene (lit, in the fog) or on the far skyline (unlit, its shading baked): onion domes and the churches under them,
// St Basil's, the Kremlin's wall and towers, the Stalinist high-rises with Moscow University among them, the Bolshoi,
// Christ the Saviour, the Ostankino tower, Moscow-City's glass towers, the power stations' chimneys and their plumes.
// A style S carries the materials and colours: S.lo switches to lighter geometry for the skyline.
import { THREE, G, canvasTex, rand, randi, pick } from '../core.js';
import { taperGeo } from './ny_icons.js';

const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
// an onion dome, its foot (radius 0.5) on y = 0, the bulb swelling to 0.69 and drawn up into a point at 1.06
const ONION_P = [[0, 0], [0.5, 0], [0.6, 0.1], [0.69, 0.26], [0.66, 0.44], [0.52, 0.6], [0.3, 0.76], [0.13, 0.88], [0.045, 0.98], [0.0, 1.06]];
// the helmet dome of Christ the Saviour and the Kremlin cathedrals
const HELMET_P = [[0, 0], [0.5, 0], [0.52, 0.18], [0.5, 0.38], [0.43, 0.58], [0.3, 0.76], [0.14, 0.9], [0.04, 1.0], [0.0, 1.06]];
export const ONION = lathe(ONION_P, 16), ONION_LO = lathe(ONION_P, 8);
export const HELMET = lathe(HELMET_P, 16), HELMET_LO = lathe(HELMET_P, 8);
const TENT = new THREE.ConeGeometry(0.5, 1, 8), TENT4 = new THREE.ConeGeometry(0.5, 1, 4);
TENT4.rotateY(Math.PI / 4);
const OCT = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const ARCH = new THREE.TorusGeometry(0.5, 0.03, 4, 24, Math.PI);   // a half ring: the moulding round a gable
const DODEC = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const onion = (S) => (S.lo ? ONION_LO : ONION), helmet = (S) => (S.lo ? HELMET_LO : HELMET);

// the swallow-tailed merlon of the Kremlin wall: a block with two horns and the V between them
const MERLON = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.62, 0); s.lineTo(0.62, 0); s.lineTo(0.62, 2.0); s.lineTo(0.0, 1.35); s.lineTo(-0.62, 2.0); s.lineTo(-0.62, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  return g;
})();
// a five-pointed star, flat, for the Kremlin towers and the high-rises' spires
export const STAR = (() => {
  const s = new THREE.Shape();
  for (let k = 0; k < 10; k++) { const r = k % 2 ? 0.2 : 0.5, a = Math.PI / 2 + (k * Math.PI) / 5; k ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  return new THREE.ShapeGeometry(s);
})();

// ---------- textures for the painted domes of St Basil's and the tent over its central church ----------
function domeTex(kind, a, b) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h);
    g.fillStyle = b;
    if (kind === 'spiral') for (let k = -4; k < 8; k++) { g.beginPath(); g.moveTo(k * 32, h); g.lineTo(k * 32 + 16, h); g.lineTo(k * 32 + 16 + h * 0.9, 0); g.lineTo(k * 32 + h * 0.9, 0); g.closePath(); g.fill(); }
    else if (kind === 'chevron') for (let y = 0; y < h; y += 24) { g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + ((x / 16) % 2 ? 12 : 0)); for (let x = w; x >= 0; x -= 16) g.lineTo(x, y + 10 + ((x / 16) % 2 ? 12 : 0)); g.closePath(); g.fill(); }
    else if (kind === 'scales') for (let y = 0; y < h + 16; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w + 16; x += 16) { g.beginPath(); g.arc(x, y, 7, 0, Math.PI); g.fill(); }
    else if (kind === 'rhomb') for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, y + 2); g.lineTo(x + 6, y + 8); g.lineTo(x, y + 14); g.lineTo(x - 6, y + 8); g.closePath(); g.fill(); }
    else if (kind === 'ribs') for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 7, h);
    else if (kind === 'tent') {   // the white tent's red and green lozenges with gold stars in them
      for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < w + 32; x += 32) {
        g.fillStyle = (x / 32 + y / 32) % 2 ? '#b8302a' : '#2a7a4a'; g.beginPath(); g.moveTo(x, y + 2); g.lineTo(x + 14, y + 16); g.lineTo(x, y + 30); g.lineTo(x - 14, y + 16); g.closePath(); g.fill();
        g.fillStyle = '#f0c850'; g.beginPath(); g.arc(x, y + 16, 3, 0, Math.PI * 2); g.fill();
      }
    }
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, 0, w * 0.18, h);   // a lit edge along each gore
  });
}
// St Basil's dome materials: make() wraps a texture in a material (lit for a scene, unlit for a skyline)
export function basilDomes(make) {
  return {
    spiralGY: make(domeTex('spiral', '#2a8a4a', '#f0c040')), spiralRW: make(domeTex('spiral', '#c8302a', '#f4ece0')),
    spiralBW: make(domeTex('spiral', '#2a5ab0', '#f2f0ea')), chevron: make(domeTex('chevron', '#e8d8b0', '#c8302a')),
    scales: make(domeTex('scales', '#e8c040', '#3a8a4a')), rhomb: make(domeTex('rhomb', '#2a7a4a', '#f0c850')),
    ribs: make(domeTex('ribs', '#e8c040', '#c8302a')), tent: make(domeTex('tent', '#f2ece0', '#f2ece0')),
  };
}

// ---------- the pieces ----------
// the Orthodox cross: the upright, the title bar, the arms, the slanted footrest
export function cross(F, S, x, y, z, s = 1) {
  if (S.lo && s < 1.2) { F.box(S.gold, S.cGold, x, y + 0.8 * s, z, 0.12 * s, 1.6 * s, 0.12 * s); F.box(S.gold, S.cGold, x, y + 1.15 * s, z, 0.7 * s, 0.12 * s, 0.12 * s); return; }
  F.box(S.gold, S.cGold, x, y + 0.85 * s, z, 0.09 * s, 1.7 * s, 0.09 * s);
  F.box(S.gold, S.cGold, x, y + 1.32 * s, z, 0.72 * s, 0.09 * s, 0.09 * s);
  F.box(S.gold, S.cGold, x, y + 1.6 * s, z, 0.36 * s, 0.08 * s, 0.08 * s);
  F.add(G.box, S.gold, x, y + 0.5 * s, z, 0.5 * s, 0.08 * s, 0.08 * s, 0, 0, -0.38, S.cGold);
}
// a dome on its drum and neck: an onion (gold, green, blue with stars, or patterned) or a helmet, the cross on top
export function dome(F, S, x, y, z, r, { mat = S.gold, col = S.cGold, drum = r * 1.1, drumCol = S.cWall, neck = r * 0.25, kind = 'onion', crossed = true, win = true } = {}) {
  if (drum > 0) {
    F.add(OCT, S.wall, x, y + drum / 2, z, r * 1.25, drum, r * 1.25, 0, Math.PI / 8, 0, drumCol);
    if (win && !S.lo) for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 8; F.box(S.glow, S.cWin, x + Math.sin(a) * r * 0.62, y + drum * 0.5, z + Math.cos(a) * r * 0.62, r * 0.22, drum * 0.45, 0.05, a); }
    F.add(OCT, S.wall, x, y + drum, z, r * 1.38, r * 0.1, r * 1.38, 0, Math.PI / 8, 0, S.cTrim);
  }
  const y1 = y + Math.max(0, drum);
  if (neck > 0) F.cyl(S.wall, drumCol, x, y1 + neck / 2, z, r * 0.42, neck);
  const y2 = y1 + Math.max(0, neck);
  F.add(kind === 'helmet' ? helmet(S) : onion(S), mat, x, y2, z, r * 2, r * 2.1, r * 2, 0, 0, 0, col);
  if (crossed) cross(F, S, x, y2 + r * 2.2, z, r * 0.9);
  return y2 + r * 2.2;
}
// a little Moscow church: the cube under its cornice, the five domes, the refectory and the bell tower with its tent
// (modelled facing +z, its bell tower toward +z)
export function church(F, S, { w = 10, h = 9, col = S.cWall, domes = 5, domeCol = S.cGold, domeMat = S.gold, bell = true, tentBell = true, foot = 0 } = {}) {
  if (foot) for (const [z, fw, fd] of bell ? [[0, w, w], [w * 0.95, w * 0.72, w * 0.9], [w * 1.75, w * 0.46, w * 0.46]] : [[0, w, w]]) F.block(S.wall, col, 0, -foot, z, fw, foot, fd);
  F.block(S.wall, col, 0, 0, 0, w, h, w);
  F.box(S.wall, S.cTrim, 0, h - 0.3, 0, w + 0.5, 0.6, w + 0.5);
  F.box(S.wall, S.cTrim, 0, 0.4, 0, w + 0.3, 0.8, w + 0.3);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.box(S.wall, S.cTrim, (sx * w) / 2, h / 2, (sz * w) / 2, 0.5, h, 0.5);
  if (!S.lo) for (const [fx, fz, ry] of [[0, 1, 0], [1, 0, Math.PI / 2], [-1, 0, Math.PI / 2]]) for (const o of [-w * 0.25, w * 0.25]) for (const y of [h * 0.32, h * 0.7]) {
    const x = fx ? (fx * w) / 2 + fx * 0.03 : o, z = fz ? (fz * w) / 2 + 0.03 : o;
    F.box(S.wall, S.cTrim, x, y, z, ry ? 0.08 : 1.3, h * 0.24, ry ? 1.3 : 0.08);
    F.box(S.glow, S.cWin, x + fx * 0.03, y, z + fz * 0.03, ry ? 0.06 : 0.8, h * 0.18, ry ? 0.8 : 0.06);
  }
  F.add(TENT4, S.roof, 0, h + 0.7, 0, w * 1.45, 1.4, w * 1.45, 0, 0, 0, S.cRoof);
  dome(F, S, 0, h + 0.5, 0, w * 0.2, { mat: domeMat, col: domeCol, drum: w * 0.38, drumCol: col });
  if (domes === 5) for (const sx of [-1, 1]) for (const sz of [-1, 1]) dome(F, S, sx * w * 0.3, h + 0.4, sz * w * 0.3, w * 0.11, { mat: domeMat, col: domeCol, drum: w * 0.22, drumCol: col, win: false });
  if (!bell) return;
  F.block(S.wall, col, 0, 0, w * 0.95, w * 0.72, h * 0.55, w * 0.9);   // the refectory
  F.box(S.wall, S.cTrim, 0, h * 0.55, w * 0.95, w * 0.78, 0.4, w * 0.96);
  F.add(TENT4, S.roof, 0, h * 0.55 + 0.5, w * 0.95, w * 1.05, 1.0, w * 1.3, 0, 0, 0, S.cRoof);
  const bz = w * 1.75, bw = w * 0.46;   // the bell tower: a square, an open belfry, then the tent (шатёр) or a little dome
  F.block(S.wall, col, 0, 0, bz, bw, h * 1.1, bw);
  F.box(S.wall, S.cTrim, 0, h * 1.1, bz, bw + 0.3, 0.35, bw + 0.3);
  F.add(OCT, S.wall, 0, h * 1.1 + h * 0.3, bz, bw * 0.95, h * 0.6, bw * 0.95, 0, Math.PI / 8, 0, col);
  if (!S.lo) for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; F.box(S.glow, S.cBell, Math.sin(a) * bw * 0.46, h * 1.4, bz + Math.cos(a) * bw * 0.46, bw * 0.3, h * 0.36, 0.05, a); }
  const ty = h * 1.7;
  if (tentBell) { F.add(TENT, S.roof, 0, ty + h * 0.55, bz, bw * 0.95, h * 1.1, bw * 0.95, 0, Math.PI / 8, 0, S.cRoof); dome(F, S, 0, ty + h * 1.05, bz, bw * 0.14, { mat: domeMat, col: domeCol, drum: 0, neck: 0.2 }); }
  else dome(F, S, 0, ty, bz, bw * 0.3, { mat: domeMat, col: domeCol, drum: bw * 0.4, drumCol: col });
}

// ---------- the Kremlin ----------
// the red wall from x0 to x1 along x at z = 0, the swallow-tailed merlons along its top, the walkway's inner parapet
export function kremlinWall(F, S, x0, x1, { h = 9, t = 3 } = {}) {
  const len = x1 - x0, xc = (x0 + x1) / 2;
  F.block(S.brick, S.cBrick, xc, 0, 0, len, h, t);
  F.box(S.brick, S.cBrick2, xc, h - 0.25, t / 2 + 0.06, len, 0.5, 0.15);
  for (let x = x0 + 1.05; x < x1 - 0.5; x += 2.1) F.add(MERLON, S.brick, x, h, t * 0.25, 1, 1, t * 0.42, 0, 0, 0, S.cBrick);
}
// a tower of the Kremlin: the brick shaft, the white-dressed machicolation, a lantern tier, the green tent; on the five
// great towers the ruby star; Spasskaya with its clock, its pinnacled tiers and its belfry
export function kremlinTower(F, S, { w = 7, h = 16, star = false, clock = false, round = false, tiers = 1 } = {}) {
  if (round) { F.add(OCT, S.brick, 0, h / 2, 0, w * 1.1, h, w * 1.1, 0, Math.PI / 8, 0, S.cBrick); }
  else F.block(S.brick, S.cBrick, 0, 0, 0, w, h, w);
  if (!S.lo) for (let k = 0; k < (round ? 8 : 4); k++) {   // the arrow slits, two to a face
    const a = (k / (round ? 8 : 4)) * Math.PI * 2, r = (round ? w * 0.508 : w / 2) + 0.03;
    for (const y of [h * 0.4, h * 0.7]) F.box(S.dark, S.cDark, Math.sin(a) * r, y, Math.cos(a) * r, 0.45, 1.3, 0.06, a);
  }
  F.box(S.wall, S.cTrim, 0, h - 0.5, 0, w + 0.7, 1.0, w + 0.7);
  if (clock) {   // Spasskaya: the clock tier, its dials on all four faces, the white Gothic tiers above
    const w2 = w * 0.82;
    F.block(S.brick, S.cBrick, 0, h, 0, w2, w2 * 0.95, w2);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; F.add(G.cyl, S.clock || S.dark, Math.sin(a) * (w2 / 2 + 0.05), h + w2 * 0.5, Math.cos(a) * (w2 / 2 + 0.05), w2 * 0.66, 0.08, w2 * 0.66, Math.PI / 2, a, 0, S.cClock || S.cDark); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.add(G.cone8, S.wall, (sx * w2) / 2, h + w2 * 0.95 + 1.0, (sz * w2) / 2, 0.6, 2.0, 0.6, 0, 0, 0, S.cTrim);   // pinnacles
    const y3 = h + w2 * 0.95;
    F.add(OCT, S.brick, 0, y3 + 2.4, 0, w2 * 0.8, 4.8, w2 * 0.8, 0, Math.PI / 8, 0, S.cBrick);
    F.add(OCT, S.wall, 0, y3 + 4.9, 0, w2 * 0.88, 0.4, w2 * 0.88, 0, Math.PI / 8, 0, S.cTrim);
    F.add(OCT, S.brick, 0, y3 + 7.0, 0, w2 * 0.62, 3.8, w2 * 0.62, 0, Math.PI / 8, 0, S.cBrick);   // the open belfry
    if (!S.lo) for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; F.box(S.glow, S.cBell, Math.sin(a) * w2 * 0.3, y3 + 7.0, Math.cos(a) * w2 * 0.3, w2 * 0.14, 2.4, 0.05, a); }
    F.add(TENT, S.roof, 0, y3 + 9.0 + w2 * 0.95, 0, w2 * 0.7, w2 * 1.9, w2 * 0.7, 0, Math.PI / 8, 0, S.cRoof);
    const top = y3 + 9.0 + w2 * 1.9;
    F.cyl(S.gold, S.cGold, 0, top + 0.5, 0, 0.12, 1.2);
    if (star) F.add(STAR, S.star, 0, top + 2.0, 0, w * 0.34, w * 0.34, 1, 0, 0, 0, S.cStar).add(STAR, S.star, 0, top + 2.0, 0, w * 0.34, w * 0.34, 1, 0, Math.PI / 2, 0, S.cStar);
    return top + 2.0 + w * 0.17;
  }
  let y = h, ww = w;
  for (let k = 0; k < tiers; k++) {   // lantern tiers, each narrower, with white arches let into them
    const th = ww * 0.55;
    F.block(S.brick, S.cBrick, 0, y, 0, ww * 0.78, th, ww * 0.78);
    F.box(S.wall, S.cTrim, 0, y + th - 0.2, 0, ww * 0.86, 0.4, ww * 0.86);
    if (!S.lo) for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; F.box(S.wall, S.cTrim, Math.sin(a) * ww * 0.39, y + th * 0.5, Math.cos(a) * ww * 0.39, ww * 0.26, th * 0.55, 0.06, a); }
    y += th; ww *= 0.78;
  }
  F.add(TENT, S.roof, 0, y + ww * 1.25, 0, ww * 0.95, ww * 2.5, ww * 0.95, 0, Math.PI / 8, 0, S.cRoof);
  const top = y + ww * 2.5;
  if (star) {
    F.cyl(S.gold, S.cGold, 0, top + 0.4, 0, 0.1, 0.9);
    F.add(STAR, S.star, 0, top + 1.6, 0, w * 0.3, w * 0.3, 1, 0, 0, 0, S.cStar).add(STAR, S.star, 0, top + 1.6, 0, w * 0.3, w * 0.3, 1, 0, Math.PI / 2, 0, S.cStar);
    return top + 1.6 + w * 0.15;
  }
  F.cyl(S.gold, S.cGold, 0, top + 0.7, 0, 0.08, 1.4);   // a gilded weathervane
  F.box(S.gold, S.cGold, 0.3, top + 1.2, 0, 0.6, 0.35, 0.04);
  return top + 1.4;
}
// Ivan the Great's bell tower: white octagons stacked into the sky under a gold helmet
export function ivanBell(F, S, s = 1) {
  const r = 4.6 * s;
  let y = 0;
  for (const [rr, h] of [[1, 10], [0.86, 8], [0.72, 7]]) {
    F.add(OCT, S.wall, 0, y + (h * s) / 2, 0, r * 2 * rr, h * s, r * 2 * rr, 0, Math.PI / 8, 0, S.cWall);
    F.add(OCT, S.wall, 0, y + h * s, 0, r * 2 * rr + 0.6, 0.5, r * 2 * rr + 0.6, 0, Math.PI / 8, 0, S.cTrim);
    if (!S.lo) for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; F.box(S.glow, S.cBell, Math.sin(a) * r * rr * 0.93, y + h * s * 0.55, Math.cos(a) * r * rr * 0.93, r * rr * 0.32, h * s * 0.45, 0.05, a); }
    y += h * s;
  }
  F.add(OCT, S.wall, 0, y + 2.5 * s, 0, r * 1.1, 5 * s, r * 1.1, 0, Math.PI / 8, 0, S.cWall);   // the drum, its gilded band
  F.add(OCT, S.gold, 0, y + 4.6 * s, 0, r * 1.18, 0.6 * s, r * 1.18, 0, Math.PI / 8, 0, S.cGold);
  return dome(F, S, 0, y + 5 * s, 0, r * 0.55, { kind: 'helmet', drum: 0, neck: 0.3 * s });
}
// a cathedral of the Kremlin: the white cube, its round gables (zakomary), five gold helmets
export function kremlinCathedral(F, S, { w = 16, h = 14, s = 1 } = {}) {
  F.block(S.wall, S.cWall, 0, 0, 0, w, h, w * 0.82);
  for (const z of [w * 0.41 + 0.05, -w * 0.41 - 0.05]) for (const k of [-1, 0, 1]) F.add(G.cyl, S.wall, k * (w / 3), h, z, w / 3 - 0.3, 0.3, w / 3 - 0.3, Math.PI / 2, 0, 0, S.cWall);
  F.box(S.wall, S.cTrim, 0, h * 0.55, 0, w + 0.3, 0.4, w * 0.82 + 0.3);
  if (!S.lo) for (const z of [w * 0.41 + 0.04]) for (const k of [-1, 0, 1]) F.box(S.glow, S.cWin, k * (w / 3), h * 0.75, z, 0.9, 2.2, 0.05);
  dome(F, S, 0, h, 0, w * 0.16, { kind: 'helmet', drum: w * 0.32 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) dome(F, S, sx * w * 0.27, h, sz * w * 0.22, w * 0.1, { kind: 'helmet', drum: w * 0.22, win: false });
}

// ---------- St Basil's (the Cathedral of the Intercession on the Moat) ----------
// The central church under its tall tent, eight chapels round it, four large on the axes and four small between, each
// under its own painted dome, all on the arcaded gallery; the bell tower at the south-east corner. D: dome materials.
export function stBasil(F, S, D) {
  const brick = S.cBrick, trim = S.cTrim;
  F.block(S.brick, brick, 0, 0, 0, 30, 4.2, 30);   // the gallery's base and its arcade
  F.box(S.wall, trim, 0, 4.2, 0, 30.4, 0.4, 30.4);
  if (!S.lo) for (const [fx, fz, ry] of [[0, 1, 0], [1, 0, Math.PI / 2], [-1, 0, Math.PI / 2], [0, -1, 0]]) for (let k = -5; k <= 5; k++) {
    const x = fx ? fx * 15.05 : k * 2.6, z = fz ? fz * 15.05 : k * 2.6;
    F.box(S.dark, S.cDark, x, 2.0, z, ry ? 0.06 : 1.5, 2.6, ry ? 1.5 : 0.06);
    F.box(S.wall, trim, x, 3.4, z, ry ? 0.08 : 1.8, 0.3, ry ? 1.8 : 0.08);
  }
  const chapel = (x, z, r, h, mat, dr) => {   // an octagonal chapel: brick, white kokoshnik bands, a drum, its dome
    F.add(OCT, S.brick, x, 4.4 + h / 2, z, r * 2, h, r * 2, 0, Math.PI / 8, 0, brick);
    for (const y of [4.4 + h * 0.45, 4.4 + h - 0.4]) F.add(OCT, S.wall, x, y, z, r * 2 + 0.35, 0.45, r * 2 + 0.35, 0, Math.PI / 8, 0, trim);
    if (!S.lo) for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; F.add(G.cone4, S.wall, x + Math.sin(a) * r * 0.95, 4.4 + h + 0.4, z + Math.cos(a) * r * 0.95, r * 0.55, 0.9, 0.2, 0, a, 0, trim); F.box(S.glow, S.cWin, x + Math.sin(a) * r * 0.93, 4.4 + h * 0.7, z + Math.cos(a) * r * 0.93, r * 0.2, h * 0.16, 0.05, a); }
    return dome(F, S, x, 4.4 + h, z, dr, { mat, col: 0xffffff, drum: dr * 0.9, drumCol: brick, win: false });
  };
  chapel(0, 9.5, 3.3, 11, D.spiralGY, 2.9);
  chapel(0, -9.5, 3.3, 11, D.spiralRW, 2.9);
  chapel(9.5, 0, 3.3, 11, D.ribs, 2.9);
  chapel(-9.5, 0, 3.3, 11, D.spiralBW, 2.9);
  chapel(7.2, 7.2, 2.3, 8.5, D.chevron, 2.0);
  chapel(-7.2, 7.2, 2.3, 8.5, D.scales, 2.0);
  chapel(7.2, -7.2, 2.3, 8.5, D.rhomb, 2.0);
  chapel(-7.2, -7.2, 2.3, 8.5, D.spiralGY, 2.0);
  // the central church: an octagon rising through tiers of kokoshniki to the tent, a little gold dome on top
  F.add(OCT, S.brick, 0, 4.4 + 7.5, 0, 9.6, 15, 9.6, 0, Math.PI / 8, 0, brick);
  for (const y of [8, 13, 18.4]) F.add(OCT, S.wall, 0, y, 0, 10.0, 0.5, 10.0, 0, Math.PI / 8, 0, trim);
  if (!S.lo) for (let row = 0; row < 3; row++) for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8 + row * 0.2, y = 15.5 + row * 1.1; F.add(G.cone4, S.wall, Math.sin(a) * 4.7, y, Math.cos(a) * 4.7, 1.6, 1.1, 0.3, 0, a, 0, trim); }
  F.add(TENT, D.tent, 0, 19.4 + 6.5, 0, 8.4, 13, 8.4, 0, Math.PI / 8, 0, 0xffffff);
  F.add(OCT, S.wall, 0, 32.6, 0, 1.6, 1.2, 1.6, 0, Math.PI / 8, 0, trim);
  dome(F, S, 0, 33.2, 0, 1.1, { drum: 0, neck: 0.3 });
  // the bell tower beside it
  const bx = 15.5, bz = -10.5;
  F.block(S.brick, brick, bx, 0, bz, 5, 9, 5);
  F.box(S.wall, trim, bx, 9, bz, 5.4, 0.4, 5.4);
  F.add(OCT, S.brick, bx, 11.6, bz, 4.4, 5, 4.4, 0, Math.PI / 8, 0, brick);
  if (!S.lo) for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; F.box(S.glow, S.cBell, bx + Math.sin(a) * 2.05, 11.6, bz + Math.cos(a) * 2.05, 0.8, 2.6, 0.05, a); }
  F.add(TENT, S.roof, bx, 14.1 + 3.6, bz, 4.2, 7.2, 4.2, 0, Math.PI / 8, 0, S.cRoof);
  dome(F, S, bx, 21.3, bz, 0.7, { drum: 0, neck: 0.2 });
}

// ---------- Stalinist high-rises (высотки) ----------
const floors = (F, S, x, y0, z, w, h, d, every = 3.2) => {   // lit bands of windows round a block, a floor at a time
  for (let y = y0 + 2; y < y0 + h - 1; y += every) F.box(S.glow, S.cWin, x, y, z, w + 0.06, 0.9, d + 0.06);
};
// tiers: [w, h] blocks stacked up the central tower; wings: [x0, x1, h, d] blocks either side; the spire with its star
export function vysotka(F, S, { tiers = [[40, 60], [28, 22], [20, 16], [14, 12]], wings = [[20, 50, 40, 26], [50, 70, 26, 22]], spire = 46, every = 3.6, starCol = null, foot = 0 } = {}) {
  if (foot) {   // the walls carried on below the foot, where no ground hides it (the skyline)
    F.block(S.wall, S.cWall, 0, -foot, 0, tiers[0][0], foot, tiers[0][0] * 0.7);
    for (const [x0, x1, , d] of wings) for (const s of [-1, 1]) F.block(S.wall, S.cWall, (s * (x0 + x1)) / 2, -foot, -d * 0.1, x1 - x0, foot, d);
  }
  let y = 0;
  tiers.forEach(([w, h], i) => {
    F.block(S.wall, S.cWall, 0, y, 0, w, h, w * (i ? 1 : 0.7));
    F.box(S.wall, S.cTrim, 0, y + h - 0.4, 0, w + 1.2, 0.8, w * (i ? 1 : 0.7) + 1.2);
    if (!S.lo || i === 0) floors(F, S, 0, y, 0, w, h, w * (i ? 1 : 0.7), every);
    if (i > 0 && !S.lo) for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.add(G.cone4, S.wall, (sx * w) / 2, y + h + 1.6, (sz * w) / 2, 1.4, 3.2, 1.4, 0, 0, 0, S.cTrim);   // obelisks at the corners
    y += h;
  });
  const tw = tiers[tiers.length - 1][0];
  F.add(OCT, S.wall, 0, y + 3, 0, tw * 0.7, 6, tw * 0.7, 0, Math.PI / 8, 0, S.cWall);
  F.add(TENT, S.gold, 0, y + 6 + spire / 2, 0, tw * 0.42, spire, tw * 0.42, 0, Math.PI / 8, 0, S.cSpire);
  const sy = y + 6 + spire + 2.4;
  F.add(STAR, S.star, 0, sy, 0, 5, 5, 1, 0, 0, 0, starCol || S.cStar).add(STAR, S.star, 0, sy, 0, 5, 5, 1, 0, Math.PI / 2, 0, starCol || S.cStar);
  for (const [x0, x1, h, d] of wings) for (const s of [-1, 1]) {
    const xc = (s * (x0 + x1)) / 2, w = x1 - x0;
    F.block(S.wall, S.cWall, xc, 0, -d * 0.1, w, h, d);
    F.box(S.wall, S.cTrim, xc, h - 0.4, -d * 0.1, w + 0.8, 0.8, d + 0.8);
    floors(F, S, xc, 0, -d * 0.1, w, h, d, every);
  }
  return sy;
}
// Moscow State University on the Sparrow Hills: the central tower and its spire, the four corner towers, the long wings
export function mgu(F, S, { foot = 0 } = {}) {
  const top = vysotka(F, S, { tiers: [[52, 72], [34, 24], [24, 18], [16, 12]], wings: [[26, 58, 58, 34], [58, 92, 44, 30], [92, 120, 30, 26]], spire: 56, every: 3.4, foot });
  for (const s of [-1, 1]) {   // the corner towers at the ends of the inner wings, each under its own spire
    const x = s * 75;
    if (foot) { F.block(S.wall, S.cWall, x, -foot, 6, 16, foot, 16); F.block(S.wall, S.cWall, s * 62, -foot, 48, 26, foot, 30); }
    F.block(S.wall, S.cWall, x, 0, 6, 16, 72, 16);
    F.block(S.wall, S.cWall, x, 72, 6, 11, 12, 11);
    floors(F, S, x, 0, 6, 16, 72, 16, 3.4);
    F.add(TENT, S.gold, x, 84 + 14, 6, 6, 28, 6, 0, Math.PI / 8, 0, S.cSpire);
    F.add(G.sphLow, S.gold, x, 113, 6, 3, 3, 3, 0, 0, 0, S.cSpire);
    F.block(S.wall, S.cWall, s * 62, 0, 48, 26, 26, 30);   // the forward wings round the court of honour
    floors(F, S, s * 62, 0, 48, 26, 26, 30, 3.4);
  }
  return top;
}

// ---------- the Bolshoi Theatre ----------
// the cream body, eight white columns on the portico under the pediment, Apollo's quadriga on top (modelled facing +z)
export function bolshoi(F, S) {
  F.block(S.wall, S.cCream, 0, 0, -12, 34, 19, 30);
  F.block(S.wall, S.cCream, 0, 19, -14, 26, 8, 22);   // the stage house behind, higher
  F.box(S.wall, S.cTrim, 0, 18.8, -12, 34.6, 0.8, 30.6);
  F.block(S.wall, S.cTrim, 0, 0, 3.5, 30, 2.2, 6);   // the portico's stylobate
  for (let k = 0; k < 8; k++) {
    const x = -12.6 + k * 3.6;
    F.cyl(S.wall, S.cTrim, x, 2.2 + 7.6, 5.3, 0.72, 15.2, S.lo ? 'cyl6' : 'cyl');
    if (!S.lo) { F.box(S.wall, S.cTrim, x, 2.45, 5.3, 1.8, 0.5, 1.8); F.box(S.wall, S.cTrim, x, 17.6, 5.3, 1.9, 0.6, 1.9); }
  }
  F.box(S.wall, S.cTrim, 0, 18.6, 3.6, 30.4, 2.0, 6.4);   // the entablature
  const ped = new THREE.Shape(); ped.moveTo(-15.4, 0); ped.lineTo(15.4, 0); ped.lineTo(0, 5.2); ped.lineTo(-15.4, 0);
  F.addM(new THREE.ExtrudeGeometry(ped, { depth: 6.2, bevelEnabled: false }), S.wall, new THREE.Matrix4().makeTranslation(0, 19.6, 0.5), S.cTrim);
  if (!S.lo) {
    F.add(G.plane, S.dark, 0, 21.0, 6.75, 22, 2.6, 1, 0, 0, 0, S.cRelief || S.cDark);   // the tympanum in shadow
    for (let k = 0; k < 5; k++) F.box(S.glow, S.cWin, -9.6 + k * 4.8, 9.8, 0.62, 2.0, 5.0, 0.05);   // the foyer's tall windows behind the columns
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) for (const y of [6, 12]) F.box(S.glow, S.cWin, sx * (17.05), y, -4 - k * 6, 0.05, 2.6, 1.6);
  }
  // the quadriga: four horses rearing, the chariot, Apollo with his lyre, in dark bronze
  const qy = 24.8, br = S.cBronze;
  F.block(S.wall, S.cTrim, 0, 23.8, 3.4, 5, 1.0, 4);
  for (let k = 0; k < 4; k++) {
    const x = -1.8 + k * 1.2, z = 5.0;
    F.add(G.box, S.bronze, x, qy + 1.0, z, 0.5, 0.8, 1.8, -0.35, 0, 0, br);
    F.add(G.box, S.bronze, x, qy + 1.8, z + 0.9, 0.35, 0.9, 0.5, -0.6, 0, 0, br);
    for (const dz of [-0.6, 0.5]) F.box(S.bronze, br, x, qy + 0.3, z + dz, 0.18, 0.9, 0.18);
  }
  F.add(G.cyl, S.bronze, 0, qy + 0.9, 2.9, 2.4, 1.2, 1.4, 0, 0, 0, br);
  F.box(S.bronze, br, 0, qy + 2.6, 2.8, 0.7, 2.2, 0.5);
  F.add(G.sphLow, S.bronze, 0, qy + 4.0, 2.8, 0.55, 0.6, 0.55, 0, 0, 0, br);
  F.add(G.tor, S.bronze, 0.6, qy + 3.4, 3.1, 0.9, 1.2, 0.9, 0, 0, 0, br);
}

// ---------- Christ the Saviour ----------
// the white cathedral on its terrace: round gables on all four sides, the corner belfries, the great gold helmet
export function christSaviour(F, S) {
  F.block(S.wall, S.cTrim, 0, 0, 0, 52, 3, 52);
  for (const [w, d] of [[40, 40], [24, 48], [48, 24]]) F.block(S.wall, S.cWall, 0, 3, 0, w, 26, d);
  for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const x = fx * 24, z = fz * 24, ry = fx ? Math.PI / 2 : 0;
    F.add(G.cyl, S.wall, x, 29, z, 22, 1.2, 22, Math.PI / 2, ry, 0, S.cWall);   // the great round gable (закомара) and its moulding
    F.add(ARCH, S.wall, x + fx * 0.62, 29, z + fz * 0.62, 22.6, 22.6, 6, 0, ry, 0, S.cTrim);
    for (const o of [-16, 16]) F.add(G.cyl, S.wall, fz ? o : fx * 20, 29, fz ? fz * 20 : o, 7, 0.8, 7, Math.PI / 2, ry, 0, S.cWall);   // the small gables over the side bays
    if (!S.lo) for (const o of [-6, 0, 6]) { F.box(S.glow, S.cWin, x + (fz ? o : fx * 0.05), 14, z + (fx ? o : fz * 0.05), fz ? 2.2 : 0.06, 9, fx ? 2.2 : 0.06); F.box(S.wall, S.cTrim, x + (fz ? o : fx * 0.1), 19.2, z + (fx ? o : fz * 0.1), fz ? 3.0 : 0.1, 1.0, fx ? 3.0 : 0.1); }
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {   // the four belfries at the corners
    const x = sx * 15, z = sz * 15;
    F.add(OCT, S.wall, x, 29 + 5, z, 7, 10, 7, 0, Math.PI / 8, 0, S.cWall);
    if (!S.lo) for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 8; F.box(S.glow, S.cBell, x + Math.sin(a) * 3.3, 34, z + Math.cos(a) * 3.3, 1.4, 4.2, 0.05, a); }
    dome(F, S, x, 39, z, 2.4, { kind: 'helmet', drum: 0, neck: 0.6 });
  }
  F.add(DODEC, S.wall, 0, 29 + 7, 0, 22, 14, 22, 0, 0, 0, S.cWall);   // the drum and its windows, one to each face
  if (!S.lo) for (let k = 0; k < 12; k++) { const a = ((k + 0.5) / 12) * Math.PI * 2; F.box(S.glow, S.cWin, Math.sin(a) * 10.66, 36, Math.cos(a) * 10.66, 1.6, 7, 0.06, a); }
  F.add(G.cyl, S.wall, 0, 43.4, 0, 23, 0.8, 23, 0, 0, 0, S.cTrim);
  dome(F, S, 0, 43.8, 0, 10.4, { kind: 'helmet', drum: 0, neck: 0 });
}

// ---------- the Ostankino tower ----------
// the ten legs flaring into the base, the tapering concrete shaft, the pod, the steel mast banded red and white;
// LED: the material of the light ring round the pod (the city's light shows)
export function ostankino(F, S, LED, { foot = 0 } = {}) {
  for (let k = 0; k < 10; k++) {   // the legs, leaning out like the petals of an upturned lily
    const a = (k / 10) * Math.PI * 2;
    F.limb(S.wall, S.cTower, [Math.sin(a) * 36, 0, Math.cos(a) * 36], [Math.sin(a) * 9, 62, Math.cos(a) * 9], 2.6, 1.6, 6);
    if (foot) F.limb(S.wall, S.cTower, [Math.sin(a) * 36, -foot, Math.cos(a) * 36], [Math.sin(a) * 36, 0.5, Math.cos(a) * 36], 2.6, 2.6, 6);   // carried on down
  }
  F.add(taperGeo(0.42, 12), S.wall, 0, 60 + 135, 0, 18, 270, 18, 0, 0, 0, S.cTower);
  F.add(G.cyl, S.wall, 0, 335, 0, 22, 16, 22, 0, 0, 0, S.cTower);
  F.add(G.cyl, LED, 0, 331, 0, 22.4, 3, 22.4, 0, 0, 0, 0xffffff);
  F.add(G.cyl, LED, 0, 340, 0, 22.4, 2, 22.4, 0, 0, 0, 0xffffff);
  F.add(taperGeo(0.7, 10), S.wall, 0, 343 + 22, 0, 7.6, 44, 7.6, 0, 0, 0, S.cTower);
  for (let k = 0; k < 10; k++) F.add(taperGeo(0.9, 8), S.wall, 0, 387 + k * 15 + 7.5, 0, 4.4 - k * 0.3, 15, 4.4 - k * 0.3, 0, 0, 0, k % 2 ? S.cRedBand : S.cTower);
  for (const y of [120, 240, 345, 460, 538]) F.add(G.sphLow, S.star, 0, y, 0, 3.4, 3.4, 3.4, 0, 0, 0, S.cStar);   // aviation lights
}

// ---------- Moscow-City ----------
// the glass towers of the business district: plans (tri, chamfer, twist, pinch, box), heights, tints; lit floor bands
export const CITY = [
  { x: 0, z: 0, w: 52, h: 374, plan: 'tri', col: '#7a9ab8', spire: 40 }, { x: -46, z: 14, w: 44, h: 242, plan: 'tri', col: '#86a4c0' },
  { x: 52, z: -8, w: 42, h: 338, plan: 'chamfer', col: '#b8845a' }, { x: 100, z: 20, w: 40, h: 354, plan: 'pinch', col: '#5a8a9a' },
  { x: 132, z: 46, w: 34, h: 245, plan: 'pinch', col: '#6a9aa8' }, { x: -96, z: 40, w: 38, h: 246, plan: 'twist', col: '#9ab8d0' },
  { x: -144, z: 10, w: 40, h: 345, plan: 'box', col: '#4a6a90' }, { x: -186, z: 30, w: 36, h: 302, plan: 'box', col: '#56789a' },
  { x: 176, z: -10, w: 44, h: 301, plan: 'stack', col: '#6a7a9a' }, { x: 210, z: 30, w: 46, h: 239, plan: 'curve', col: '#7aa0b8' },
];
export function cityTower(F, S, t, { lit = 0.5, foot = 0 } = {}) {
  const { x, z, w, h, plan } = t, col = S.tint ? S.tint(t.col) : t.col;
  if (foot) F.box(S.glass, col, x, -foot / 2, z, w * 0.9, foot, w * 0.85);
  if (plan === 'tri') F.add(new THREE.CylinderGeometry(w * 0.58, w * 0.62, 1, 3), S.glass, x, h / 2, z, 1, h, 1, 0, 0.3, 0, col);
  else if (plan === 'chamfer') F.add(OCT, S.glass, x, h / 2, z, w, h, w, 0, Math.PI / 8, 0, col);
  else if (plan === 'twist') { const n = S.lo ? 8 : 18; for (let k = 0; k < n; k++) F.add(G.box, S.glass, x, ((k + 0.5) * h) / n, z, w * 0.8, h / n + 0.2, w * 0.8, 0, (k / n) * Math.PI * 0.5, 0, col); }
  else if (plan === 'pinch') { F.add(taperGeo(0.82, 4), S.glass, x, h * 0.25, z, w, h * 0.5, w, 0, Math.PI / 4, 0, col); F.add(taperGeo(1.18, 4), S.glass, x, h * 0.75, z, w * 0.82, h * 0.5, w * 0.82, 0, Math.PI / 4, 0, col); }
  else if (plan === 'stack') { const n = 6; for (let k = 0; k < n; k++) F.box(S.glass, col, x + (k % 2 ? 4 : -4), ((k + 0.5) * h) / n, z + (k % 3) * 3, w, h / n, w * 0.9); }
  else if (plan === 'curve') { F.box(S.glass, col, x, h / 2, z, w, h, w * 0.6); F.add(G.cyl, S.glass, x, h, z, w, w * 0.5, w * 0.6, Math.PI / 2, 0, 0, col); }
  else F.box(S.glass, col, x, h / 2, z, w, h, w * 0.85);
  const step = S.lo ? 14 : 7;
  for (let y = 10; y < h - 6; y += step) if (Math.random() < lit) F.box(S.glow, S.cOffice, x, y, z, w * 0.86, S.lo ? 2.4 : 1.4, w * 0.86, 0, plan === 'twist' ? (y / h) * Math.PI * 0.5 : plan === 'tri' ? 0.3 : 0);
  F.box(S.glow, S.cCrown, x, h + 0.6, z, w * 0.5, 1.2, w * 0.5);
  if (t.spire) { F.add(G.cone4, S.glass, x, h + t.spire / 2, z, 4, t.spire, 4, 0, 0, 0, col); F.add(G.sphLow, S.star, x, h + t.spire + 1, z, 2, 2, 2, 0, 0, 0, S.cStar); }
}

// ---------- the power stations' chimneys and their plumes of steam, standing straight up in the frost ----------
export function chimney(F, S, { h = 150, plume = 1, foot = 0 } = {}) {
  if (foot) F.add(G.cyl, S.wall, 0, -foot / 2, 0, 9, foot, 9, 0, 0, 0, S.cTower);
  for (let k = 0; k < 6; k++) F.add(taperGeo(0.94, 10), S.wall, 0, (k + 0.5) * (h / 6), 0, 9 - k * 0.9, h / 6, 9 - k * 0.9, 0, 0, 0, k % 2 ? S.cRedBand : S.cTower);
  F.add(G.sphLow, S.star, 0, h + 1, 0, 2, 2, 2, 0, 0, 0, S.cStar);
  if (!plume) return;
  let y = h + 6, r = 8, x = 0;
  for (let k = 0; k < 9; k++) {   // the plume billows up and leans a little with the wind, lit pink on its sunward side
    F.add(G.sphLow, S.steam, x + rand(-2, 2), y, rand(-2, 2), r * 2, r * 1.6, r * 2, 0, rand(0, 3), 0, S.cSteam);
    y += r * 1.1; r *= 1.16; x += r * 0.35 * plume;
  }
}
