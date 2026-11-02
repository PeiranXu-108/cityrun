// Istanbul's landmark scenes on an April evening: Sultanahmet's park between the Blue Mosque and Hagia Sophia with the
// Hippodrome's obelisks and the fountain; the Basilica Cistern's forest of columns lit from the water, the Medusa heads;
// the Grand Bazaar's painted vault over its lamp-lit shops; Eminönü's square under Yeni Cami, the Spice Bazaar's gate,
// the fish-sandwich boats smoking at the quay and the ferries; the Galata Bridge lined with fishermen; the Galata Tower
// over its square; İstiklal with the Flower Passage, St Anthony's and the Lycée gate; Dolmabahçe's Imperial Gate and
// clock tower; the Ortaköy Mosque on its pier under the Bosphorus Bridge; and Salacak's quay facing the Maiden's Tower.
import { THREE, Batcher, VC, G, std, basic, hdr, planeUV, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { EDGE, farGround } from './common.js';
import { beam } from './tokyo_kit.js';
import { frame, thinFog, taperGeo } from './ny_icons.js';
import { X0, SERIF, SANS, face, SIGNS, GI } from './istanbul_kit.js';
import { blueMosque, hagiaSophia, yeniCami, galataTower, maidenTower, bosphorusBridge, ortakoy, clockTower, imperialGate, mahalleMosque, dome, HALF } from './istanbul_icons.js';
import { puffs } from './taipei_towers.js';

const sign = (t) => SIGNS.find((s) => s.t === t);
// the cistern's columns: lit from the water, the light dying away up the shaft into the dark
const COLUMN = (() => {
  const g = new THREE.CylinderGeometry(0.36, 0.42, 1, 10, 8, true).toNonIndexed();
  const p = g.attributes.position, c = new Float32Array(p.count * 3), lo = new THREE.Color('#f0a068'), hi = new THREE.Color('#140c0a'), t = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const k = Math.pow(1 - (p.getY(i) + 0.5), 3.2); t.copy(hi).lerp(lo, k).multiplyScalar(0.3 + k * 1.15); c.set([t.r, t.g, t.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
})();
// a barrel vault seen from below: half a cylinder along z, its faces turned inward
function vaultGeo(R, L, n = 24) {
  const pos = [], nor = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI, P = (a, z) => [Math.cos(a) * R, Math.sin(a) * R, z], N = (a) => [-Math.cos(a), -Math.sin(a), 0];
    for (const [a, z] of [[a0, 0], [a1, 0], [a1, -L], [a0, 0], [a1, -L], [a0, -L]]) { pos.push(...P(a, z)); nor.push(...N(a)); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}
const ARC = new THREE.TorusGeometry(1, 0.05, 3, 12, Math.PI);   // a unit half-ring, scaled into arches
// Floodlit stone and lead: the lamps stand at the foot of the walls, so the glow is strongest low down and fades away up
// toward the domes and the tops of the minarets.
export function floodlit(mat, h = 40, lo = 1.5, hi = 0.25) {
  const prev = mat.onBeforeCompile, key = mat.customProgramCacheKey();
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.vertexShader = 'varying float vFloodY;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vFloodY = (modelMatrix * vec4(transformed, 1.0)).y;');
    sh.fragmentShader = 'varying float vFloodY;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance *= mix(${lo.toFixed(2)}, ${hi.toFixed(2)}, smoothstep(0.0, ${h.toFixed(1)}, vFloodY));
  #ifdef USE_COLOR
    totalEmissiveRadiance *= vColor;   // pale stone catches the light, lead and shadowed stone much less
  #endif`);
  };
  mat.customProgramCacheKey = () => `${key}|flood${h}|${lo}|${hi}`;
  return mat;
}

export function istLandmarks(K) {
  const smokes = [];
  // the floodlit stone and lead of the big buildings, kept clear of the evening haze
  const flood = floodlit(thinFog(std({ vertexColors: true, roughness: 0.8, emissive: '#ffb070', emissiveIntensity: 0.34 }), 0.45), 36, 1.25, 0.22);
  const floodDome = floodlit(thinFog(std({ vertexColors: true, roughness: 0.45, metalness: 0.35, emissive: '#e0a060', emissiveIntensity: 0.3 }), 0.45), 50, 1.25, 0.15);
  const glowT = thinFog(basic({ vertexColors: true }), 0.45);
  const S = { wall: flood, dome: floodDome, glow: glowT, gold: VC.metal, steel: VC.metal, rock: VC.solid, dark: VC.solid, tower: VC.solid, hill: VC.solid,
    cWall: '#e2d0ae', cWall2: '#ecdcbc', cWall3: '#d0b896', cDome: '#8a929c', cWin: hdr('#ffc870', 1.6), cLight: hdr('#fff0c8', 2.4), cGold: '#e8c060', cArch: hdr('#ffd090', 1.3),
    cSteel: '#6a7080', cRock: '#3a3a40', cDark: '#141418', cBrick: '#c87a5a', cTower: '#d8dce8', cHill: '#2a3020', cClock: hdr('#fff4dc', 1.8) };
  const HS = { ...S, cWall: '#dca486', cWall2: '#e6b698', cWall3: '#c88c6c' };   // Hagia Sophia's pink-ochre wash
  const warm = std({ vertexColors: true, roughness: 0.85, emissive: '#ff9a50', emissiveIntensity: 0.14 });   // surfaces lit by the bazaar's lamps
  const led = basic({ vertexColors: true });   // the bridge's cables, changing colour
  const smoke = (pts, opts) => { const m = puffs(pts, { size: 0.5, grow: 2.2, rise: 5, drift: 0.8, life: 5.5, n: 6, color: '#d8d0c8', opacity: 0.2, ...opts }); smokes.push(m); return m; };
  const lawn = (b, x, z, w, d, col = '#2e4a26') => b.block(VC.solid, col, x, 0, z, w, 0.18, d);
  const lampRow = (b, x, z0, z1, step, opts) => { for (let z = z0; z < z1; z += step) K.lamp(b, x, -z, opts); };
  const shopPlane = (b, x, y, z, s, w, h, goods) => b.add(planeUV(K.goodsRects[GI[goods]]), K.goodsMat, x, y, z, w, h, 1, 0, face(s), 0);
  const signPlane = (b, x, y, z, s, w, entry) => b.add(planeUV(K.signRects[entry.i]), K.signMat, x, y, z, w, (w * 112) / 512, 1, 0, face(s), 0);
  const words = (text, opts) => K.label(text, { w: 1024, h: 160, font: SERIF, weight: 900, size: 0.62, ...opts });

  // ---------- 0. Sultanahmet: the Blue Mosque and Hagia Sophia face each other across the park ----------
  const obelisk = (b, x, z) => {   // the Egyptian obelisk on its Roman pedestal
    b.block(VC.solid, '#d8d0c0', x, 0, z, 3.6, 0.6, 3.6);
    b.block(VC.solid, '#c8bca8', x, 0.6, z, 2.8, 3.4, 2.8);
    for (let k = 0; k < 4; k++) b.block(VC.solid, '#a89a88', x, 4.0, z, 2.2, 0.6, 2.2, 0);
    b.add(taperGeo(0.62, 4), VC.solid, x, 4.6 + 9, z, 2.4, 18, 2.4, 0, Math.PI / 4, 0, '#c09a8a');
    b.add(G.cone4, VC.solid, x, 22.6 + 0.8, z, 1.1, 1.6, 1.1, 0, 0, 0, '#c09a8a');
    for (let k = 0; k < 14; k++) for (const e of [-1, 1]) b.box(VC.solid, '#7a5a50', x + e * 0.98 * (1 - k * 0.022), 6 + k * 1.15, z, 0.02, 0.5, 0.5);   // the hieroglyphs, a column of them on each face
    K.pool(b, x, z, 7, 7, hdr('#ffd9a0', 0.14));
    for (const [dx, dz] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) b.box(VC.glow, hdr('#fff0d0', 2.0), x + dx, 0.15, z + dz, 0.3, 0.12, 0.3);
  };
  const serpent = (b, x, z) => {   // the Serpent Column: three bronze snakes twisted together, sunk in its pit behind a railing
    b.block(VC.solid, '#5a5248', x, -0.4, z, 4, 0.5, 4);
    for (let k = 0; k < 3; k++) for (let i = 0; i < 18; i++) { const a = i * 0.7 + (k * Math.PI * 2) / 3; b.sph(VC.metal, '#5a4a30', x + Math.cos(a) * 0.22, 0.2 + i * 0.3, z + Math.sin(a) * 0.22, 0.17, true); }
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; b.box(VC.metal, '#1a1c20', x + Math.cos(a) * 2.2, 0.5, z + Math.sin(a) * 2.2, 0.05, 1.0, 0.05); }
    b.cyl(VC.metal, '#1a1c20', x, 1.0, z, 2.2, 0.05, 'cyl');
  };
  const germanFountain = (b, x, z) => {   // the German Fountain: eight porphyry columns, a green dome lined with gold mosaic
    b.cyl(VC.solid, '#d8d0c0', x, 0.3, z, 4.4, 0.6, 'cyl8');
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.cyl(VC.solid, '#7a2a3a', x + Math.cos(a) * 3.4, 3.2, z + Math.sin(a) * 3.4, 0.28, 5.2, 'cyl8'); }
    b.cyl(VC.solid, '#e8e0d0', x, 6.2, z, 4.0, 1.0, 'cyl8');
    b.add(HALF, VC.solid, x, 6.7, z, 7.6, 5.6, 7.6, 0, 0, 0, '#3a7a5a');
    b.add(HALF, VC.glow, x, 6.5, z, 6.8, -5.0, 6.8, 0, 0, 0, hdr('#ffc860', 1.1));   // the gold mosaic inside, lit
    b.cyl(VC.solid, '#5a6a6a', x, 1.8, z, 1.6, 2.4, 'cyl8');
    b.cyl(VC.metal, '#e8c060', x, 10.0, z, 0.08, 1.4, 'cyl6');
  };
  const sultanahmet = () => {
    const b = new Batcher();
    farGround(b, -1, '#1e2024'); farGround(b, 1, '#1e2024');
    K.pave(b, -(EDGE + 70), -40, 140, 80); K.pave(b, EDGE + 70, -40, 140, 80);
    blueMosque(frame(b, -98, 0, -66, 1, Math.PI / 2), S);   // its courtyard toward the track, six minarets
    hagiaSophia(frame(b, 106, 0, -84, 1, 0.12), HS);
    for (const s of [-1, 1]) {   // lawns and tulip beds along the walks, the lamps, Judas trees and plane trees
      for (let z = 6; z < 78; z += 12) { lawn(b, s * (EDGE + 6.2), -z, 4.6, 9.4); K.tulips(b, s * (EDGE + 6.2), -z, 3.6, 7.8, { y: -0.1, soil: false }); }
      lampRow(b, s * (EDGE + 1.3), 4, 80, 16, { heads: 3 });
      for (let z = 10; z < 78; z += 17) if (s < 0 || z < 26 || z > 50) (chance(0.5) ? K.judas : K.planeTree)(b, s * (EDGE + 12 + rand(0, 4)), -z, rand(0.9, 1.1));
    }
    obelisk(b, -12, -50); serpent(b, -12, -62); germanFountain(b, -14, -22);
    // the park's fountain: its round basin, the jets lit
    const fx = 22, fz = -38;
    b.cyl(VC.solid, '#d8d0c0', fx, 0.35, fz, 8, 0.7, 'cyl');
    b.add(G.cyl, K.water, fx, 0.62, fz, 15.2, 0.02, 15.2);
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, h = rand(1.6, 2.6); b.cyl(VC.glow, hdr('#dff0ff', 1.6), fx + Math.cos(a) * 5.4, 0.6 + h / 2, fz + Math.sin(a) * 5.4, 0.07, h, 'cyl6'); }
    b.cyl(VC.glow, hdr('#e8f6ff', 2.0), fx, 2.6, fz, 0.16, 4.2, 'cyl8');
    K.pool(b, fx, fz, 20, 20, hdr('#9ad0ff', 0.1));
    for (const [x, z] of [[-7, -8], [7, -60], [-7, -74]]) K.simitCart(b, x, z, x < 0 ? -1 : 1);
    K.chestnutCart(b, 7, -14, 1);
    K.crowd(b, -(EDGE + 0.8), -(EDGE + 9), 2, 78, 16); K.crowd(b, EDGE + 0.8, EDGE + 9, 2, 78, 16);
    K.crowd(b, -20, -40, 8, 36, 12); K.crowd(b, 32, 60, 50, 78, 10);
    for (let k = 0; k < 4; k++) K.cat(b, pick([-1, 1]) * rand(EDGE + 1, EDGE + 8), -rand(4, 76));
    for (let z = 4; z < 80; z += 16) if (chance(0.5)) K.gull(b, pick([-1, 1]) * (EDGE + 1.3), 5.47, -z);
    return b.build();
  };

  // ---------- 1. The Basilica Cistern: a forest of columns standing in the water, lit from below ----------
  const darkWater = std({ color: '#0a0705', roughness: 0.15, metalness: 0.2, normalMap: K.water.normalMap, normalScale: new THREE.Vector2(0.3, 0.3) });
  const medusa = (b, x, z, rz) => {   // a Medusa head at a column's foot, laid on her side or upside down
    const F = frame(b, x, 1.0, z, 1, 0), c = '#8a8274';
    F.add(G.sph, VC.solid, 0, 0, 0, 1.5, 1.8, 1.3, 0, 0, rz, c);
    const R = (px, py) => [px * Math.cos(rz) - py * Math.sin(rz), px * Math.sin(rz) + py * Math.cos(rz)];
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2, [px, py] = R(Math.cos(a) * 0.95, Math.sin(a) * 1.05); F.add(G.sphLow, VC.solid, px, py, 0.1, 0.42, 0.42, 0.42, 0, 0, 0, '#7a7264'); }   // her snakes
    for (const e of [-1, 1]) { const [px, py] = R(e * 0.3, 0.2); F.add(G.sphLow, VC.solid, px, py, 0.6, 0.22, 0.14, 0.1, 0, 0, rz, '#3a3630'); }
    { const [px, py] = R(0, -0.15); F.add(G.box, VC.solid, px, py, 0.65, 0.18, 0.4, 0.2, 0, 0, rz, c); }
    { const [px, py] = R(0, -0.55); F.add(G.box, VC.solid, px, py, 0.6, 0.4, 0.08, 0.1, 0, 0, rz, '#4a4438'); }
    K.pool(b, x, z + 0.8, 5, 5, hdr('#ff8a3a', 0.35), 0.1);
  };
  const cistern = () => {
    const b = new Batcher();
    const Y = 9.5, H = 15.2, XW = 23, ROWS = [5.2, 10.0, 14.8, 19.6];
    for (const s of [-1, 1]) {
      b.add(G.plane, darkWater, s * ((EDGE + XW) / 2 + 0.2), 0.05, -40, XW - EDGE, 80, 1, -Math.PI / 2, 0, 0);   // the water, over the street's cobbles
      b.box(VC.metal, '#2a2420', s * (EDGE + 0.35), 1.05, -40, 0.05, 0.05, 78); b.box(VC.metal, '#2a2420', s * (EDGE + 0.35), 0.55, -40, 0.03, 0.03, 78);   // the walkway's rail
      for (let z = 2; z < 80; z += 2.5) b.box(VC.metal, '#2a2420', s * (EDGE + 0.35), 0.55, -z, 0.05, 1.1, 0.05);
      b.box(VC.glow, hdr('#1a120e', 1), s * (XW + 0.5), H / 2, -40, 1, H, 80);   // the side walls
      for (const x of ROWS) for (let z = 2.4; z < 80; z += 4.8) {
        b.addM(COLUMN, VC.glow, new THREE.Matrix4().makeScale(1, Y, 1).setPosition(s * x, Y / 2, -z), null);
        b.box(VC.glow, hdr('#2a1c16', 1), s * x, Y + 0.35, -z, 1.0, 0.7, 1.0);   // the capital in the dark
        b.box(VC.glow, hdr('#ff9a4a', 1.6), s * x, 0.12, -z + 0.5, 0.3, 0.14, 0.12);   // its uplight
        K.pool(b, s * x, -z, 3.2, 3.2, hdr('#ff8a3a', 0.22), 0.07);
        b.add(ARC, VC.glow, s * x, Y + 0.7, -z - 2.4, 2.4, 2.4, 6, 0, Math.PI / 2, 0, hdr('#2a1a14', 1));   // the arches along the row
      }
      for (let i = 0; i < ROWS.length - 1; i++) for (let z = 2.4; z < 80; z += 4.8) b.add(ARC, VC.glow, s * (ROWS[i] + ROWS[i + 1]) / 2, Y + 0.7, -z, 2.4, 2.4, 6, 0, 0, 0, hdr('#24160f', 1));
    }
    for (let z = 2.4; z < 80; z += 4.8) b.add(ARC, VC.glow, 0, Y + 0.7, -z, 5.2, 5.2, 6, 0, 0, 0, hdr('#2a1a14', 1));   // the arches across the walkway, high over the jetpack
    b.box(VC.glow, hdr('#120c0a', 1), 0, H, -40, XW * 2 + 2, 0.6, 80);   // the vaults' dark
    for (const zw of [0.4, 79.6]) for (const s of [-1, 1]) {   // the end walls, an arch for the line
      b.box(VC.glow, hdr('#1e1410', 1), s * (XW + 6.5) / 2, H / 2, -zw, XW - 6.5 + 1, H, 0.8);
      b.box(VC.glow, hdr('#1e1410', 1), 0, (H + 14.2) / 2, -zw, 13, H - 14.2, 0.8);
    }
    // outside, the entrance front: stone, the sign, a lamp each side
    b.box(VC.solid, '#c8bca8', 0, H + 0.6, -0.2, XW * 2 + 2, 1.2, 1.4);
    for (const s of [-1, 1]) { b.box(VC.solid, '#c8bca8', s * (XW / 2 + 3.4), H / 2, 0.25, XW - 6.4, H, 0.3); K.lamp(b, s * 7.6, 1.6, { heads: 1 }); }
    b.add(G.plane, words('YEREBATAN SARNICI', { color: '#f0d8a0', bg: '#2a2018', border: '#c8a050' }), 0, 15.0, 0.45, 12, 1.9, 1);
    medusa(b, -5.2, -74.4 + 0.8, Math.PI / 2); medusa(b, 5.2, -74.4 + 0.8, Math.PI);
    for (const z of [-26.4, -45.6]) { const x = pick([-10, 10]); for (let k = 0; k < 7; k++) b.add(G.tor, VC.glow, x, 1.2 + k * 1.1, z, 0.9, 0.9, 0.6, Math.PI / 2, 0, 0, hdr('#ffb070', 1.2)); }   // the weeping column's eyes
    return b.build();
  };

  // ---------- 2. The Grand Bazaar: the painted vault, the gate, shop after shop of lamps, gold, carpets and spices ----------
  const bazaar = () => {
    const b = new Batcher();
    farGround(b, -1, '#1e1c22'); farGround(b, 1, '#1e1c22');
    const W = 10, YS = 9.6, Z0 = 3, Z1 = 77;
    b.addM(vaultGeo(W, Z1 - Z0), warm, new THREE.Matrix4().makeTranslation(0, YS, -Z0), '#d8c4a0');
    for (const [a, c, w] of [[0.62, '#2a4a8a', 0.5], [Math.PI - 0.62, '#2a4a8a', 0.5], [1.1, '#a8302a', 0.25], [Math.PI - 1.1, '#a8302a', 0.25], [Math.PI / 2, '#2a4a8a', 0.9]]) {   // painted bands running down the vault
      b.add(G.box, warm, Math.cos(a) * (W - 0.06), YS + Math.sin(a) * (W - 0.06), -(Z0 + Z1) / 2, w, 0.04, Z1 - Z0, 0, 0, a + Math.PI / 2, c);
    }
    for (let z = Z0; z <= Z1; z += 6) {   // the transverse arches, red and white voussoirs, a painted roundel on the crown
      b.add(ARC, warm, 0, YS, -z, W, W, 8, 0, 0, 0, '#a8302a');
      for (let k = 1; k < 12; k += 2) { const a = (k / 12) * Math.PI; b.add(G.box, warm, Math.cos(a) * W, YS + Math.sin(a) * W, -z, 0.5, 1.0, 0.7, 0, 0, a + Math.PI / 2, '#f0e6d2'); }
      if (z < Z1) b.add(G.plane, K.iznikMat, 0, YS + W - 0.1, -z - 3, 2.6, 2.6, 1, Math.PI / 2, 0, 0, '#ffffff');
      if (z < Z1) {   // a brass lantern hanging from the crown, its foot high over the jetpack
        b.box(VC.metal, '#3a2a14', 0, 17.6, -z - 3, 0.04, 2.0, 0.04);
        b.add(G.cyl6, VC.glow, 0, 15.9, -z - 3, 0.9, 1.3, 0.9, 0, 0, 0, hdr('#ffc870', 1.15));
        b.add(G.cyl6, VC.metal, 0, 15.2, -z - 3, 0.7, 0.16, 0.7, 0, 0, 0, '#c8a050');
        b.add(G.cone8, VC.metal, 0, 16.75, -z - 3, 1.2, 0.5, 1.2, 0, 0, 0, '#c8a050');
      }
    }
    for (const s of [-1, 1]) {
      b.box(warm, '#e8dcc4', s * (W + 0.3), 6.9, -40, 0.6, 5.4, Z1 - Z0);   // the wall over the shops, its band of painted tiles
      b.add(K.tiledPlane(Z1 - Z0, 0.9, 0.9), K.iznikMat, s * (W - 0.01), 4.6, -40, Z1 - Z0, 0.9, 1, 0, face(s), 0, '#ffffff');
      for (let z = Z0 + 3; z < Z1; z += 6) { b.box(VC.solid, '#5a4030', s * (W - 0.03), 7.8, -z, 0.06, 2.0, 1.3); b.box(VC.glow, hdr('#3a5a9a', 0.9), s * (W - 0.07), 7.8, -z, 0.04, 1.7, 1.0); }   // the clerestory, the dusk in it
      for (let z = Z0 + 1.7, i = 0; z < Z1 - 1; z += 3.4, i++) {   // the shops
        const e = pick(['AYDINLATMA', 'KUYUMCU', 'KUYUMCU', 'HALI · KİLİM', 'SERAMİK', 'TEKSTİL', 'LOKUM · BAKLAVA', 'BAHARAT', 'ANTİKA', 'AYDINLATMA']), en = sign(e);
        b.box(warm, '#d8c8a8', s * (W - 0.1), 1.95, -z + 1.65, 0.4, 3.9, 0.22);
        shopPlane(b, s * (W - 0.03), 1.75, -z, s, 3.0, 3.0, en.goods);
        signPlane(b, s * (W - 0.06), 3.75, -z, s, 3.0, en);
        K.pool(b, s * (W - 1.2), -z, 2.4, 3.2, hdr('#ffd090', 0.14));
        if (en.goods === 'lamps') K.lampCluster(b, s * (W - 0.8), 3.2, -z, 7, 0.6);
        else if (en.goods === 'carpets') K.carpets(b, s * W, -z, s, 1, 1.9);
        else if (en.goods === 'ceramics') K.ceramics(b, s * (W - 1.0), -z, s, 2.0);
        else if (en.goods === 'spices') K.spices(b, s * (W - 1.1), -z, s, 2.2);
        if (chance(0.4)) K.person(b, s * (W - 0.9), -z + 1.2, { ry: s < 0 ? -Math.PI / 2 : Math.PI / 2 });   // the shopkeeper at his door
      }
      for (let z = Z0 + 6; z < Z1; z += 12) K.lampCluster(b, s * 7.6, 9.2, -z, 6, 0.7);
      K.throng(b, s * (EDGE + 0.6), s * (W - 1.6), 4, 76, 22, []);
    }
    for (const zg of [1.6, 78.4]) {   // the gates: stone, the arch for the line, the coat of arms and the bazaar's name
      for (const s of [-1, 1]) b.box(VC.solid, '#d8ccb0', s * (W + 7) / 2 + s * 1.5, 9, -zg, W - 4, 18, 2.4);
      b.box(VC.solid, '#d8ccb0', 0, 16.6, -zg, 16, 3.2, 2.4);
      b.add(ARC, VC.solid, 0, 8.0, -zg, 7, 7, 30, 0, 0, 0, '#c8b898');
      b.add(G.sph, VC.metal, 0, 16.6, -zg + 1.25, 3.2, 2.6, 0.6, 0, 0, 0, '#e8c060');
      b.add(G.plane, words('KAPALIÇARŞI · 1461', { color: '#f0d890', bg: '#1f4a2a', border: '#e8c060' }), 0, 18.9, -zg + 1.25, 9, 1.4, 1);
      for (const s of [-1, 1]) K.lamp(b, s * 5.4, -zg + (zg > 40 ? -2 : 2), { heads: 1 });
    }
    for (let k = 0; k < 2; k++) { const s = pick([-1, 1]), z = rand(12, 68); K.person(b, s * 5, -z, { coat: '#f4f0e8' }); b.add(G.cyl, VC.metal, s * 5 + 0.35, 1.0, -z, 0.5, 0.03, 0.5, 0, 0, 0, '#c8a050'); for (let i = 0; i < 4; i++) b.add(G.cyl6, VC.glow, s * 5 + 0.35 + rand(-0.15, 0.15), 1.07, -z + rand(-0.15, 0.15), 0.06, 0.1, 0.06, 0, 0, 0, hdr('#c8401a', 1.2)); }   // the tea boys with their trays
    return b.build();
  };

  // ---------- 3. Eminönü: Yeni Cami over its pigeons, the Spice Bazaar's gate, the fish boats and the ferries ----------
  const eminonu = () => {
    const b = new Batcher();
    farGround(b, -1, '#1e2024');
    K.pave(b, -(EDGE + 60), -40, 120, 80);
    yeniCami(frame(b, -74, 0, -54, 1, Math.PI / 2), S);
    // the Spice Bazaar: a long stone front under its little domes, the arched gate
    const SX = -16;
    b.block(flood, '#e8d8b8', SX - 7, 0, -14, 14, 11, 26);
    for (let k = 0; k < 6; k++) dome(frame(b, SX - 7, 11, -3 - k * 4.4, 1, 0), S, 0, 0, 0, 1.8, { drum: 0.2, wins: 0, alem: false });
    b.box(VC.glow, hdr('#ffd090', 1.4), SX + 0.06, 3.6, -14, 0.1, 6.4, 5.2);
    b.add(ARC, flood, SX + 0.2, 6.8, -14, 2.8, 2.8, 8, 0, Math.PI / 2, 0, '#c8b090');
    b.add(G.plane, words('MISIR ÇARŞISI', { color: '#f0d890', bg: '#5a1a10', border: '#e8c060' }), SX + 0.3, 9.6, -14, 7, 1.1, 1, 0, Math.PI / 2, 0);
    for (let k = 0; k < 6; k++) b.box(VC.glow, hdr('#ffc870', 1.1), SX + 0.06, 3, -2 - k * 2.1 - (k > 2 ? 9 : 0), 0.1, 2.2, 1.3);
    // the square: pigeons and the seed sellers, people
    for (let k = 0; k < 90; k++) { const x = -rand(EDGE + 2, 14), z = -rand(30, 76); b.add(G.sphLow, VC.solid, x, 0.14, z, 0.18, 0.16, 0.28, 0, rand(0, 6), 0, pick(['#6a6e78', '#8a8e98', '#5a5e68', '#a8acb4'])); }
    for (const z of [36, 58]) { b.block(VC.solid, '#c8202a', -(EDGE + 4), 0, -z, 0.9, 0.9, 1.2); b.block(VC.solid, '#e8d8a8', -(EDGE + 4), 0.9, -z, 0.8, 0.1, 1.1); K.person(b, -(EDGE + 4.8), -z, { scarf: '#2a4a8a', ry: Math.PI / 2 }); }
    K.crowd(b, -(EDGE + 1), -13, 30, 78, 16);
    lampRow(b, -(EDGE + 1.3), 6, 80, 18, { heads: 3 });
    // the quay: the boats, the ferry at the pier, fishermen, gulls
    K.quay(b, 1, { x: EDGE + 7, gulls: 4 });
    const grills = [];
    for (const z of [18, 33, 48]) grills.push(K.balikBoat(b, EDGE + 12.5, -z, 1));
    K.ferry(b, EDGE + 14, -68, 0, 0.62, -1.0);
    b.block(VC.solid, '#e8e0d0', EDGE + 9, 0, -66, 3, 4.5, 10);   // the pier's little terminal
    b.add(G.plane, words('EMİNÖNÜ İSKELESİ', { color: '#ffffff', bg: '#1a3a6a', border: '#ffffff', font: SANS }), EDGE + 7.46, 3.7, -66, 7, 1.1, 1, 0, -Math.PI / 2, 0);
    for (let z = 4; z < 78; z += 3.2) if (z < 14 || z > 54) K.person(b, EDGE + 6.6, -z, { rod: true, ry: -Math.PI / 2, cap: chance(0.5) });
    for (let z = 8; z < 78; z += 24) K.lamp(b, EDGE + 6.4, -z, { heads: 2 });
    K.simitCart(b, EDGE + 2.6, -24, 1); K.chestnutCart(b, EDGE + 2.6, -52, 1);
    K.crowd(b, EDGE + 0.8, EDGE + 5.6, 2, 78, 14);
    const g = b.build();
    g.add(smoke(grills.map(([x, y, z]) => [x, y + 0.6, z]), { size: 0.9, grow: 2.6, rise: 7, drift: 1.4, life: 6, n: 7, color: '#d8d0c8', opacity: 0.24 }));
    return g;
  };

  // ---------- 4. The Galata Bridge: the Golden Horn on either side, the rails lined with fishermen ----------
  const galataBridge = () => {
    const b = new Batcher();
    const W = 21, YW = -6;
    for (const s of [-1, 1]) {
      b.add(G.plane, K.water, s * (W + 160), YW, -40, 320, 80, 1, -Math.PI / 2, 0, 0);
      b.add(K.tiledPlane(W - EDGE - 3, 80, 6), VC.solid, s * (EDGE + (W - EDGE - 3) / 2), 0.04, -40, W - EDGE - 3, 80, 1, -Math.PI / 2, 0, 0, '#2a2c32');   // the roadway
      for (let z = 2; z < 80; z += 6) b.box(VC.glow, hdr('#f0f0e8', 0.6), s * (EDGE + 6.5), 0.06, -z, 0.15, 0.02, 2.5);   // lane markings
      K.pave(b, s * (W - 1.5), -40, 3, 80, 0.12);
      b.box(VC.metal, '#4a5058', s * (W + 0.3), -1.6, -40, 0.6, 3.4, 80);   // the girder face
      b.box(VC.glow, hdr('#ffd9a0', 1.3), s * (W + 0.62), -4.4, -40, 0.05, 1.2, 80);   // the lower deck's restaurants, lit along the water
      for (let z = 6; z < 80; z += 12) b.box(VC.solid, '#3a3e46', s * (W - 3), YW / 2 - 1, -z, 2, -YW + 2, 3);   // piers
      b.box(VC.metal, '#2a3a3a', s * (W - 0.1), 1.15, -40, 0.08, 0.08, 80); b.box(VC.metal, '#2a3a3a', s * (W - 0.1), 0.6, -40, 0.04, 0.04, 80);
      for (let z = 1; z < 80; z += 2) b.box(VC.metal, '#2a3a3a', s * (W - 0.1), 0.58, -z, 0.06, 1.16, 0.06);
      for (let z = 1.2; z < 79; z += rand(1.2, 2.0)) {   // the fishermen shoulder to shoulder, rods out over the water
        K.person(b, s * (W - 0.6), -z, { rod: true, ry: s < 0 ? Math.PI / 2 : -Math.PI / 2, cap: chance(0.4), coat: pick(['#3a3a3e', '#5a4a3a', '#2a3a5a', '#4a4a50', '#6a5a4a']) });
        if (chance(0.35)) b.cyl(VC.solid, pick(['#2a6ab0', '#e8e4dc', '#c8302a']), s * (W - 1.2), 0.32, -z - 0.5, 0.17, 0.5, 'cyl8');
      }
      for (let z = 8; z < 80; z += 20) { K.lamp(b, s * (W - 1.6), -z, { heads: 2, h: 6.5 }); K.gull(b, s * (W - 1.6), 6.55, -z); }
      for (let k = randi(3, 5); k > 0; k--) (chance(0.7) ? K.taxi : K.dolmus)(b, s * rand(EDGE + 2.2, W - 5), -rand(6, 74), -s);
      K.crowd(b, s * (W - 2.6), s * (W - 1.4), 2, 78, 10);
      K.ferry(b, s * rand(70, 110), -rand(10, 70), (Math.PI / 2) * (chance(0.5) ? 1 : -1) + rand(-0.3, 0.3), 1, YW - 1.2);
      for (let k = randi(2, 3); k > 0; k--) K.boat(b, s * rand(30, 60), -rand(5, 75), rand(0, 6.28), { y: YW - 0.25 });
      for (const zw of [0.8, 79.2]) b.box(VC.solid, '#7a7468', s * (W + 60), YW / 2 - 0.5, -zw, 120, -YW + 1, 1.6);   // the embankments at either end
    }
    return b.build();
  };

  // ---------- 5. The Galata Tower over its square, the music shops of Galip Dede ----------
  const galata = () => {
    const b = new Batcher();
    farGround(b, -1, '#1e1c22'); farGround(b, 1, '#1e1c22');
    K.peraRow(b, -1, 0, 80, { signs: ['MÜZİK', 'MÜZİK', 'KAFE', 'ANTİKA', 'TÜRK KAHVESİ', 'KİTAPÇI'].map(sign) });
    K.peraRow(b, 1, 0, 30, { signs: ['MÜZİK', 'KAFE', 'OTEL'].map(sign) }); K.peraRow(b, 1, 70, 80);
    K.cobbles(b, 30, -50, 40, 40);
    galataTower(frame(b, 34, 0, -54, 1, 0.3), S);
    K.pool(b, 34, -54, 30, 30, hdr('#ffd9a0', 0.1));
    for (const [x, z] of [[16, -36], [16, -46], [17, -58], [20, -68], [44, -38], [46, -68], [24, -38]]) {   // café tables under umbrellas round the tower's foot
      b.cyl(VC.solid, '#e8e0d0', x, 0.72, z, 0.45, 0.05, 'cyl8'); b.cyl(VC.metal, '#3a3a3e', x, 1.4, z, 0.03, 2.8, 'cyl6');
      b.add(G.cone8, VC.solid, x, 2.75, z, 2.6, 0.6, 2.6, 0, 0, 0, pick(['#c8302a', '#f4f0e8', '#1f5a3a']));
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; K.person(b, x + Math.cos(a) * 0.8, z + Math.sin(a) * 0.8, { seated: true, ry: Math.PI / 2 - a }); }
    }
    for (const [x, z] of [[EDGE + 2, -40], [EDGE + 2, -64]]) K.musician(b, x + 4, z, 1);
    K.throng(b, -(EDGE + 0.6), -(X0 - 0.6), 2, 78, 16, []);
    for (let k = 0; k < 22; k++) { const x = rand(EDGE + 0.6, 48), z = -rand(32, 72); if (Math.hypot(x - 34, z + 54) > 10) K.person(b, x, z); }
    lampRow(b, -(EDGE + 0.9), 6, 80, 22, { heads: 1 }); lampRow(b, EDGE + 0.9, 6, 80, 22, { heads: 1 });
    for (let k = 0; k < 3; k++) K.cat(b, rand(EDGE + 2, 22), -rand(36, 72));
    K.bunting(b, -12, { y: 15.6, w: X0 }); K.lights(b, -26, { y: 15.2, w: X0 });
    return b.build();
  };

  // ---------- 6. İstiklal: the Flower Passage, St Anthony's, the Lycée's gate, the crowds ----------
  const facadeBlock = (b, s, z0, z1, h, col, mat = K.stoneMatA, tex = K.tex.stoneA) => {   // a front on the building line, its windows from the stone texture
    const len = z1 - z0, d = 14, g = new THREE.BoxGeometry(d, h, len);
    g.translate(0, h / 2, 0);
    const uv = g.attributes.uv, tw = tex.cols * 1.9, th = tex.rows * 3.4;
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k, fw = f < 2 ? len : d; if (f === 2 || f === 3) uv.setXY(i, 0.002, 0.002); else uv.setXY(i, (uv.getX(i) * fw) / tw, (uv.getY(i) * h) / th); }
    b.addM(g, mat, new THREE.Matrix4().makeTranslation(s * (X0 + d / 2), 0, -(z0 + z1) / 2), col);
    b.box(VC.solid, '#d8ccb4', s * (X0 + d / 2), h + 0.3, -(z0 + z1) / 2, d + 0.6, 0.6, len + 0.6);
  };
  const istiklal = () => {
    const b = new Batcher();
    farGround(b, -1, '#1e1c22'); farGround(b, 1, '#1e1c22');
    K.peraRow(b, 1, 0, 26); K.peraRow(b, 1, 54, 80);
    // Çiçek Pasajı: five storeys of columns and arched windows, the passage's arch in the middle, its name lit
    facadeBlock(b, 1, 26, 54, 21, '#f2e2c4');
    for (let y = 4.6; y < 20; y += 3.4) for (let z = 28; z < 53; z += 3.1) b.box(VC.solid, '#fbf2e0', X0 - 0.2, y + 1.5, -z, 0.4, 3.0, 0.35);   // pilasters
    b.box(VC.glow, hdr('#ffc880', 0.85), X0 - 0.05, 3.2, -40, 0.1, 6.0, 5.2);
    b.add(ARC, VC.solid, X0 - 0.3, 6.6, -40, 3.2, 3.2, 8, 0, Math.PI / 2, 0, '#e8d8b8');
    b.add(G.plane, words('ÇİÇEK PASAJI', { color: '#ffe8a8', glow: '#ffb040', size: 0.66 }), X0 - 0.4, 10.6, -40, 9, 1.4, 1, 0, -Math.PI / 2, 0);
    for (const z of [30, 36, 44, 50]) shopPlane(b, X0 - 0.04, 1.8, -z, 1, 3.2, 3.2, pick(['textiles', 'books', 'baklava']));
    // the Galatasaray Lycée's gate in its railings
    K.peraRow(b, -1, 24, 46);
    b.block(VC.solid, '#e8dcc4', -(X0 + 0.5), 0, -12, 1.2, 1.4, 22);
    for (let z = 2; z < 23; z += 1.1) b.box(VC.metal, '#1a1c20', -(X0 + 0.5), 2.6, -z, 0.06, 2.4, 0.06);
    for (const e of [-1, 1]) { b.block(VC.solid, '#efe2c8', -(X0 + 0.5), 0, -12 + e * 3.4, 1.6, 9, 1.6); b.add(G.sph, VC.metal, -(X0 + 0.5), 9.6, -12 + e * 3.4, 0.9, 0.9, 0.9, 0, 0, 0, '#e8c060'); }
    b.add(ARC, VC.metal, -(X0 + 0.5), 7, -12, 3.4, 3.4, 4, 0, Math.PI / 2, 0, '#c8a050');
    b.add(G.plane, words('GALATASARAY LİSESİ · 1481', { color: '#f0d890', bg: '#1a2a5a', border: '#e8c060' }), -(X0 - 0.35), 8.6, -12, 5.6, 0.9, 1, 0, Math.PI / 2, 0);
    b.block(flood, '#e8dcc4', -(X0 + 26), 0, -12, 40, 14, 20);   // the school behind its yard
    for (let y = 3; y < 13; y += 4) for (let z = 4; z < 21; z += 3) b.box(VC.glow, hdr('#ffd9a0', 1.1), -(X0 + 5.94), y, -z, 0.1, 2, 1.3);
    // St Anthony of Padua: red brick Gothic behind its court, the rose window lit
    const cx = -(X0 + 9);
    b.block(VC.solid, '#a8503a', cx - 6, 0, -62, 12, 18, 16);
    for (const e of [-1, 1]) { b.block(VC.solid, '#a8503a', cx, 0, -62 + e * 6.5, 3, 24, 3); b.add(G.cone4, VC.solid, cx, 27, -62 + e * 6.5, 3.6, 6, 3.6, 0, 0, 0, '#5a3a30'); }
    b.add(G.cyl, VC.glow, cx + 0.05, 13, -62, 4.4, 0.1, 4.4, 0, 0, Math.PI / 2, hdr('#ff9a60', 1.6));
    for (const e of [-1, 0, 1]) b.box(VC.glow, hdr('#ffc070', 1.3), cx + 0.06, 5, -62 + e * 3.2, 0.1, 6, 1.6);
    b.add(G.cone4, VC.solid, cx - 6, 21.5, -62, 12, 7, 16, 0, 0, 0, '#5a3a30');
    b.block(VC.solid, '#a8503a', -(X0 + 0.3), 0, -58, 0.6, 7, 24);   // the court's street front, its gate
    b.box(VC.glow, hdr('#ffd9a0', 1.0), -(X0 - 0.02), 3, -62, 0.06, 5, 3.4);
    K.peraRow(b, -1, 70, 80);
    // the avenue: flags, crowds, carts, the tram stop
    for (let z = 4; z < 80; z += 7) { const s = z % 14 < 7 ? 1 : -1; K.flag(b, s * X0, rand(7, 12), -z, s, 1.7); }
    K.bunting(b, -10, { y: 15.6 }); K.lights(b, -30, { y: 15.2 }); K.bunting(b, -50, { y: 15.6 }); K.lights(b, -70, { y: 15.2 });
    K.simitCart(b, EDGE + 2, -18, 1); K.chestnutCart(b, -(EDGE + 2), -34, -1); K.dondurma(b, EDGE + 5.6, -60, 1); K.musician(b, -(X0 - 1.4), -50, -1);
    b.cyl(VC.metal, '#3a3e46', EDGE + 0.6, 1.5, -8, 0.05, 3, 'cyl6');
    b.add(G.plane, K.label('GALATASARAY', { w: 512, h: 112, color: '#ffffff', bg: '#c8102e', font: SANS, weight: 700, size: 0.5 }), EDGE + 0.6, 3.1, -8, 1.6, 0.35, 1);
    K.throng(b, -(EDGE + 0.6), -(X0 - 0.6), 2, 78, 26, [[32, 36]]);
    K.throng(b, EDGE + 0.6, X0 - 0.6, 2, 78, 26, [[16, 20], [57, 63]]);
    lampRow(b, -(EDGE + 0.8), 8, 80, 24, { heads: 1 }); lampRow(b, EDGE + 0.8, 8, 80, 24, { heads: 1 });
    return b.build();
  };

  // ---------- 7. Dolmabahçe: the Imperial Gate in the palace wall, the clock tower, the guards ----------
  const dolmabahce = () => {
    const b = new Batcher();
    farGround(b, -1, '#1e2024'); farGround(b, 1, '#1e2024');
    const WX = 13;
    K.pave(b, EDGE + 5, -40, 10, 80, 0.07);
    for (let z = 1; z < 80; z += 6) {   // the palace wall: stone piers, gilded railings between them
      b.block(flood, '#d8d0c0', WX, 0, -z, 1.4, 4.4, 1.4); b.add(G.sphLow, VC.metal, WX, 4.8, -z, 0.6, 0.6, 0.6, 0, 0, 0, '#e8c060');
      if (Math.abs(z - 40) > 8) { b.block(flood, '#f2ece0', WX, 0, -z - 3, 0.8, 1.2, 4.6); for (let k = 0; k < 7; k++) b.box(VC.metal, '#1a1c20', WX, 2.4, -z - 1.2 - k * 0.6, 0.05, 2.4, 0.05); b.box(VC.metal, '#c8a050', WX, 3.6, -z - 3, 0.08, 0.1, 4.6); }
    }
    imperialGate(frame(b, WX + 0.2, 0, -40, 1, -Math.PI / 2), { ...S, cWall: '#cdc5b4', cWall2: '#ded6c4', cWall3: '#a8a090' });
    for (const e of [-1, 1]) {   // the guards in their boxes either side of the gate
      b.block(flood, '#f2ece0', WX - 1.2, 0, -40 + e * 7.5, 1.4, 2.6, 1.4); b.add(G.cone4, VC.solid, WX - 1.2, 3.0, -40 + e * 7.5, 2.0, 0.8, 2.0, 0, 0, 0, '#c8102e');
      K.person(b, WX - 2.4, -40 + e * 7.5, { coat: '#2a3a2a', cap: true, ry: Math.PI / 2 });
    }
    // the palace behind the wall: a long white front of columns and lit windows, the water beyond it
    b.block(flood, '#ddd6c8', 46, 0, -40, 22, 16, 96);
    for (let y = 2.5; y < 15; y += 4.5) for (let z = -6; z < 86; z += 3.2) { b.box(VC.glow, hdr('#ffe0a0', 1.2), 34.94, y + 1.2, -z, 0.1, 2.4, 1.2); b.box(flood, '#fbf8f0', 34.8, y + 1.2, -z - 1.6, 0.4, 3.6, 0.4); }
    b.box(flood, '#fbf8f0', 46, 16.6, -40, 23, 1.2, 97);
    for (let z = -2; z < 84; z += 12) b.add(G.sphLow, VC.metal, 34.6, 17.5, -z, 0.8, 1.2, 0.8, 0, 0, 0, '#e8c060');
    b.add(G.plane, K.water, 200, -1.2, -40, 260, 120, 1, -Math.PI / 2, 0, 0);
    clockTower(frame(b, 24, 0, -10, 1, 0.5), { ...S, cWall: '#dcd4c4', cWall2: '#e8e0d0' });
    for (let z = 4; z < 80; z += 14) { K.lamp(b, WX - 1.2, -z, { heads: 3, h: 4.6 }); }
    // the Beşiktaş side: plane trees and Judas trees in a park, people on benches
    lawn(b, -(EDGE + 30), -40, 52, 80, '#28401f');
    for (let z = 6; z < 80; z += 11) { (chance(0.5) ? K.planeTree : K.judas)(b, -(EDGE + rand(8, 20)), -z, rand(0.9, 1.15)); if (chance(0.4)) K.judas(b, -(EDGE + rand(24, 40)), -z - 5, rand(0.8, 1)); }
    for (let z = 10; z < 80; z += 16) K.bench(b, -(EDGE + 3.6), -z, -1);
    for (let z = 8; z < 80; z += 12) K.tulips(b, -(EDGE + 6), -z, 2.2, 6, { y: 0 });
    lampRow(b, -(EDGE + 1.0), 6, 80, 20, { heads: 1 });
    K.crowd(b, -(EDGE + 0.6), -(EDGE + 2.6), 2, 78, 10); K.crowd(b, EDGE + 0.6, WX - 2.4, 2, 78, 12);
    return b.build();
  };

  // ---------- 8. Ortaköy: the mosque on its pier, the Bosphorus Bridge overhead, the kumpir stalls ----------
  const kumpir = (b, x, z, s, label) => {   // a stall of baked potatoes heaped with toppings
    b.block(VC.solid, '#f4f0e8', x, 0, z, 1.6, 1.0, 3.2);
    for (let k = 0; k < 5; k++) { b.add(G.sphLow, VC.solid, x - s * 0.2, 1.15, z - 1.2 + k * 0.6, 0.5, 0.36, 0.5, 0, 0, 0, '#e8c890'); for (let i = 0; i < 4; i++) b.sph(VC.solid, pick(['#e8202a', '#ffd23d', '#3a8a3a', '#f4f0e8', '#ff8a2a', '#8a2a5a']), x - s * 0.2 + rand(-0.15, 0.15), 1.32, z - 1.2 + k * 0.6 + rand(-0.15, 0.15), 0.08, true); }
    b.box(VC.glow, hdr('#fff0d0', 0.6), x, 2.6, z, 1.7, 0.08, 3.3);
    for (const e of [-1, 1]) b.box(VC.metal, '#c8ccd0', x + s * 0.7, 1.8, z + e * 1.5, 0.05, 1.6, 0.05);
    b.add(G.plane, K.label(label, { w: 512, h: 112, color: '#ffffff', bg: pick(['#c8102e', '#1a6a3a', '#e86a1a', '#6a1a8a']), font: SANS, weight: 700, size: 0.55 }), x - s * 0.82, 2.85, z, 3.0, 0.65, 1, 0, face(s), 0);
    K.person(b, x + s * 0.9, z, { coat: '#f4f4f0', ry: s < 0 ? -Math.PI / 2 : Math.PI / 2 });
    K.pool(b, x - s * 1.4, z, 3, 4, hdr('#fff0d0', 0.12));
  };
  const ortakoyScene = () => {
    const b = new Batcher();
    farGround(b, -1, '#1e1c22');
    K.woodRow(b, -1, 0, 80, { x0: 12 });
    for (let z = 6, k = 0; z < 76; z += 9, k++) kumpir(b, -(EDGE + 2.8), -z, -1, k % 3 === 2 ? 'WAFFLE' : 'KUMPİR');
    K.pave(b, EDGE + 10, -40, 20, 80);
    b.add(G.plane, K.water, EDGE + 180, -1.2, -50, 320, 180, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#a8a094', EDGE + 20.3, -0.55, -40, 0.6, 1.3, 80);
    for (let z = 2; z < 80; z += 2.2) b.box(VC.metal, '#1f2a2a', EDGE + 20, 0.55, -z, 0.06, 1.1, 0.06);
    b.box(VC.metal, '#1f2a2a', EDGE + 20, 1.08, -40, 0.06, 0.06, 80);
    ortakoy(frame(b, EDGE + 40, 0, -112, 1, -Math.PI / 2 + 0.6), { ...S, cWall: '#e4ddd0', cWall2: '#eee8de' });
    bosphorusBridge(frame(b, -90, 0, -40, 1, 0), { ...S, steel: VC.metal, cSteel: '#5a6070' }, { lights: led, cLights: 0xffffff, span: 1074, back: 260, dh: 64, H: 165 });
    for (let z = 4; z < 80; z += 20) K.lamp(b, EDGE + 19.4, -z, { heads: 2 });
    for (let k = 0; k < 6; k++) K.person(b, EDGE + 19.3, -rand(3, 76), { rod: true, ry: -Math.PI / 2 });
    K.crowd(b, EDGE + 0.8, EDGE + 18, 2, 78, 26); K.crowd(b, -(EDGE + 0.8), -(EDGE + 1.6), 2, 78, 10);
    for (let k = 0; k < 4; k++) K.cat(b, rand(EDGE + 1, EDGE + 18), -rand(4, 76));
    for (let k = 0; k < 3; k++) K.boat(b, EDGE + rand(26, 50), -rand(10, 75), rand(0, 6.28));
    K.ferry(b, EDGE + 120, -30, Math.PI / 2 + 0.3, 1);
    return b.build();
  };

  // ---------- 9. Salacak: the quay where Üsküdar sits out the sunset, the Maiden's Tower on her rock ----------
  const maidenScene = () => {
    const b = new Batcher();
    farGround(b, -1, '#1e2024');
    K.woodRow(b, -1, 0, 30, { x0: 10 });
    mahalleMosque(frame(b, -(10 + 12.5), 0, -44, 1, Math.PI / 2), { ...S }, { minaretSide: 1, h: 30 });
    K.woodRow(b, -1, 58, 80, { x0: 10 });
    K.teaGarden(b, -(EDGE + 1), -(EDGE + 5), 34, 56, 6); K.samovar(b, -(EDGE + 5.6), -32);
    for (let z = 6; z < 80; z += 12) if (z < 30 || z > 58) K.planeTree(b, -(EDGE + 3.5), -z, rand(0.9, 1.1));
    lampRow(b, -(EDGE + 0.9), 4, 80, 22, { heads: 1 });
    K.pave(b, EDGE + 4, -40, 8, 80);
    for (let k = 0; k < 3; k++) b.block(VC.solid, '#b8b0a4', EDGE + 8.3 + k * 0.7, -0.5 - k * 0.4, -40, 0.7, 0.5, 80);   // the steps down to the water
    b.add(G.plane, K.water, EDGE + 170, -1.6, -40, 330, 120, 1, -Math.PI / 2, 0, 0);
    for (let z = 2; z < 80; z += rand(0.9, 1.6)) K.person(b, EDGE + rand(6.6, 7.6), -z, { seated: true, y: -0.05, ry: -Math.PI / 2, scarf: chance(0.25) ? undefined : null });   // the sunset watchers along the edge
    for (let z = 10; z < 80; z += 24) { K.lamp(b, EDGE + 2.2, -z, { heads: 2 }); K.gull(b, EDGE + 2.2, 4.32, -z); }
    K.simitCart(b, EDGE + 2, -30, 1);
    K.crowd(b, EDGE + 0.8, EDGE + 5, 2, 78, 12);
    maidenTower(frame(b, 66, -0.4, -138, 1.5, -0.4), { ...S, cWall: '#efe8dc', cWall2: '#f8f2e8' }, K.flagMat);
    K.pool(b, 66, -138, 60, 50, hdr('#ffe0b0', 0.07), -1.5);
    for (let k = 0; k < 4; k++) K.boat(b, EDGE + rand(20, 50), -rand(10, 80), rand(0, 6.28), { y: -1.85 });
    return b.build();
  };

  return {
    landmarks: [
      { key: 'sultanahmet', name: '苏丹艾哈迈德广场 · 蓝色清真寺', en: 'SULTANAHMET · BLUE MOSQUE', build: sultanahmet },
      { key: 'cistern', name: '地下水宫', en: 'BASILICA CISTERN', build: cistern },
      { key: 'bazaar', name: '大巴扎', en: 'GRAND BAZAAR', build: bazaar },
      { key: 'eminonu', name: '埃米诺努 · 新清真寺', en: 'EMİNÖNÜ · NEW MOSQUE', build: eminonu },
      { key: 'galataBridge', name: '加拉塔大桥', en: 'GALATA BRIDGE', build: galataBridge },
      { key: 'galata', name: '加拉塔塔', en: 'GALATA TOWER', build: galata },
      { key: 'istiklal', name: '独立大街 · 花卉通道', en: 'İSTİKLAL AVENUE', build: istiklal },
      { key: 'dolmabahce', name: '多尔玛巴赫切宫', en: 'DOLMABAHÇE PALACE', build: dolmabahce },
      { key: 'ortakoy', name: '奥塔科伊 · 博斯普鲁斯大桥', en: 'ORTAKÖY · BOSPHORUS BRIDGE', build: ortakoyScene },
      { key: 'maiden', name: '少女塔', en: "MAIDEN'S TOWER", build: maidenScene },
    ],
    update(t) {
      for (const m of smokes) m.userData.update(t);
      led.color.setHSL((t * 0.02 + 0.5) % 1, 0.8, 0.6).multiplyScalar(2.2);
    },
  };
}
