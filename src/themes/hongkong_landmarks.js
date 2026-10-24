// Hong Kong landmark scenes on a winter night: the Tsim Sha Tsui waterfront with the old Clock Tower, the Star Ferry and
// the Cultural Centre's sweeping roof; Temple Street's night market under its gateway, fortune tellers and opera singers,
// the Tin Hau temple; Central, running between the HSBC lions and right under the bank's hanging floors with the Bank of
// China Tower lit beside it; the Peak, the Peak Tower's wok and the city's lights far below; Golden Bauhinia Square on the
// harbour (the Mid-Levels Escalator, Happy Valley, Causeway Bay and Quarry Bay are in hongkong_districts.js); Choi Hung
// Estate's rainbow blocks round the basketball court; and Ngong Ping, the Divine Generals along the path, Po Lin's hall and
// the Big Buddha on his hill under the cable cars.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, buildingGeo, foliageMat, rand, randi, pick, chance } from '../core.js';
import { at, EDGE, farGround, textTex, skyTex, RING } from './common.js';
import { beam, wire } from './tokyo_kit.js';
import { roofGeo, tiledBox } from './beijing_kit.js';
import { HEI, KAI, WY, GF, MARKET_SHOPS, ESTATE_SHOPS } from './hongkong_kit.js';
import { bocTower, ckcTower, gridTex } from './hongkong_towers.js';
import { hkDistricts } from './hongkong_districts.js';

// The Tian Tan Buddha, bronze, seated on the lotus: the right hand raised, the left in his lap. Built facing local +x
// (turned by ry) at (x, y, z), scale s, in `mat`, the eyes in `dark`.
export function buddha(b, { x, y, z, s = 1, ry = 0, mat, dark = mat }) {
  const c = '#b08a48', cs = Math.cos(ry), sn = Math.sin(ry);
  const P = (dx, dy, dz) => [x + (dx * cs + dz * sn) * s, y + dy * s, z + (-dx * sn + dz * cs) * s], S = (v) => v * s;
  const E = (dx, dy, dz, sx, sy, sz, rx, ry2, rz, col, geo = G.sph) => b.add(geo, mat, ...P(dx, dy, dz), S(sx), S(sy), S(sz), rx, ry2 + ry, rz, col);
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; E(Math.cos(a) * 5.6, 1.6, Math.sin(a) * 5.6, 2.6, 3.2, 1.2, -0.5, -a + Math.PI / 2, 0, '#a87a38'); }   // the lotus throne
  E(0, 1.2, 0, 10.8, 2.4, 10.8, 0, 0, 0, '#9a7034', G.cyl);
  E(0, 3.6, 0, 11, 3.6, 8, 0, 0, 0, c);   // the crossed legs under the robe
  E(0, 7.2, 0, 6.4, 6.4, 4.6, 0, 0, 0, c, G.cyl);   // the body
  E(0, 10.2, 0, 7.2, 2.6, 5, 0, 0, 0, c);   // the shoulders
  E(0.2, 8.6, -0.9, 6.4, 6.6, 4.4, -0.25, 0, 0, '#a8803e');   // the robe over the left shoulder
  E(0, 11.6, 0, 2.2, 1.6, 2.2, 0, 0, 0, c, G.cyl8);
  E(0, 13.4, 0, 3.6, 4.2, 3.6, 0, 0, 0, c);   // the head
  E(0, 15.2, 0, 2.2, 1.8, 2.2, 0, 0, 0, '#6a4a24');   // the curls
  E(0, 16.1, 0, 1.4, 1.4, 1.4, 0, 0, 0, '#6a4a24');   // the ushnisha
  for (const e of [-1, 1]) E(0, 12.6, e * 1.85, 0.7, 2.4, 0.4, 0, 0, 0, c, G.box);   // the long ears
  b.add(G.box, dark, ...P(1.75, 13.6, 0), S(0.05), S(0.12), S(1.4), 0, ry, 0, '#3a2a14');   // the half-closed eyes
  beam(b, mat, ...P(0.6, 10, 3.0), ...P(1.6, 7.4, 3.4), S(1.1), c);   // the right arm, the hand raised palm out
  beam(b, mat, ...P(1.6, 7.4, 3.4), ...P(2.6, 10.6, 3.0), S(0.9), c);
  E(2.9, 11.6, 3.0, 0.4, 2.0, 1.3, 0, 0, 0, c, G.box);
  beam(b, mat, ...P(0.6, 10, -3.0), ...P(1.4, 7, -3.0), S(1.1), c);   // the left, resting palm up in his lap
  E(2.6, 6.0, -1.4, 2.4, 0.7, 1.6, 0, 0, 0, c);
}

// the height of the surface of a scaled low-poly mesh (a hill) under (x, z): things standing on it sit on its facets
const _ray = new THREE.Raycaster(), _down = new THREE.Vector3(0, -1, 0), _from = new THREE.Vector3();
function surfaceY(mesh, x, z, fallback) { _ray.set(_from.set(x, 1000, z), _down); const h = _ray.intersectObject(mesh, false)[0]; return h ? h.point.y : fallback; }
const SPH = new THREE.SphereGeometry(0.5, 32, 20);
// a flag hanging in the wind: a grid of quads swaying more toward its free end (local x from the pole)
function flagGeo(w, h, nx = 6, ny = 4) {
  const p = [], n = [], uv = [], c = [], s = [];
  const V = (i, j) => [(w * i) / nx, -(h * j) / ny, 0];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    for (const [a, b2] of [[i, j], [i + 1, j], [i + 1, j + 1], [i, j], [i + 1, j + 1], [i, j + 1]]) { p.push(...V(a, b2)); n.push(0, 0, 1); uv.push(a / nx, 1 - b2 / ny); c.push(1, 1, 1); s.push(Math.pow(a / nx, 1.3)); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(s, 1));
  return g;
}
function tileTex(c1, c2, c3) {   // glazed roof tiles: rounded channels running up the slope
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = c3; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) { const gr = g.createLinearGradient(x, 0, x + 8, 0); gr.addColorStop(0, c3); gr.addColorStop(0.5, c2); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(x + 1, 0, 6, h); }
    for (let y = 0; y < h; y += 16) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, y, w, 2); }
  });
}

export function hkLandmarks(K) {
  const cabins = [];
  const tile = (c1, c2, c3, k = 0.12) => { const map = tileTex(c1, c2, c3); return std({ map, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.2, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: k }); };
  const greenTile = tile('#1a5a40', '#2f8a62', '#103426'), goldTile = tile('#b8860e', '#f2c94a', '#7a5a08', 0.2);
  const stoneTex = canvasTex(128, 128, (g, w, h) => {   // floodlit granite ashlar
    g.fillStyle = '#a8a49a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 16 - 16; x < w; x += 32) { const v = randi(-10, 10); g.fillStyle = `rgb(${212 + v},${208 + v},${198 + v})`; g.fillRect(x + 1, y + 1, 30, 14); }
  });
  const stone = std({ map: stoneTex, vertexColors: true, roughness: 0.85, emissive: '#ffe8c8', emissiveMap: stoneTex, emissiveIntensity: 0.25 });
  const ashlar = (b, x, y, z, w, h, d, col = 0xffffff, ry = 0) => b.addM(tiledBox(w, h, d, 4), stone, at(x, y + h / 2, z, ry), col);
  const brickTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#6a3424'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) for (let x = ((y / 8) % 2) * 8 - 8; x < w; x += 16) { const v = randi(-14, 14); g.fillStyle = `rgb(${184 + v},${88 + v / 2},${62 + v / 2})`; g.fillRect(x + 1, y + 1, 14, 6); }
  });
  const brick = std({ map: brickTex, vertexColors: true, roughness: 0.9, emissive: '#ffb088', emissiveMap: brickTex, emissiveIntensity: 0.3 });
  const bronze = std({ vertexColors: true, roughness: 0.35, metalness: 0.75, emissive: '#6a4a18', emissiveIntensity: 0.4 });
  const roof = (b, mat, x, y, z, w, d, h, { hip = true, ry = 0, lift = 0.5, eave = 1.0, ridge = '#2a3a2a' } = {}) => {   // a Chinese roof, its ridge and the two ridge ends
    const { roof: g } = roofGeo(w, d, h, { hip, lift: hip ? lift : 0, eave });
    b.addM(g, mat, new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z), 0xffffff);
    const R = hip ? Math.max(0.4, (w - d) / 2) : w / 2 + eave * 0.6, c = Math.cos(ry), s = Math.sin(ry);
    b.add(G.box, VC.solid, x, y + h + 0.1, z, 2 * R + 0.3, 0.32, 0.34, 0, ry, 0, ridge);
    for (const k of [-1, 1]) b.add(G.box, VC.solid, x + c * k * R, y + h + 0.42, z - s * k * R, 0.32, 0.7, 0.36, 0, ry, k * 0.25, ridge);
  };
  const label = (text, opts) => basic({ map: textTex(text, opts), transparent: true, color: hdr('#ffffff', opts.k || 1.2), side: THREE.DoubleSide, depthWrite: false });
  const clockTex = canvasTex(128, 128, (g, w, h) => {   // a clock face: lit opal glass, the hours, the hands at twenty past eight
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff6e0'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill();
    g.strokeStyle = '#2a2018'; g.lineWidth = 4; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.stroke();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.lineWidth = k % 3 ? 2 : 5; g.beginPath(); g.moveTo(64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46); g.lineTo(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54); g.stroke(); }
    g.lineCap = 'round'; g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(2.5) * 28, 64 + Math.sin(2.5) * 28); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(0.52) * 44, 64 + Math.sin(0.52) * 44); g.stroke();
  }, { repeat: false });
  const clockMat = basic({ map: clockTex, transparent: true, color: hdr('#ffffff', 1.3), side: THREE.DoubleSide });

  // ---------- 0. Victoria Harbour at Tsim Sha Tsui ----------
  const clockTower = (b, x, z) => {   // the old railway terminus's clock tower: red brick banded in granite, the clocks, the cupola and its rod
    const W = 5.6;
    ashlar(b, x, 0, z, W + 1.2, 1.4, W + 1.2, '#e8e2d4');
    b.addM(tiledBox(W, 28, W, 2), brick, at(x, 1.4 + 14, z), 0xffffff);
    for (const y of [7.4, 14.6, 21.8]) ashlar(b, x, y, z, W + 0.3, 0.7, W + 0.3, '#f0eadc');
    for (const [dx, dz, ry] of [[0, W / 2 + 0.02, 0], [0, -W / 2 - 0.02, Math.PI], [W / 2 + 0.02, 0, Math.PI / 2], [-W / 2 - 0.02, 0, -Math.PI / 2]]) {
      for (const y of [4.5, 11.5, 18.5, 25]) b.add(G.box, VC.glow, x + dx, y, z + dz, 1.0, 2.2, 0.04, 0, ry, 0, hdr('#ffd8a0', 0.7));   // arched slits, lit inside
      b.add(G.plane, clockMat, x + dx * 1.05, 31.4, z + dz * 1.05, 3.2, 3.2, 1, 0, ry, 0);
    }
    ashlar(b, x, 29.4, z, W + 0.5, 4.2, W + 0.5, '#e8dcc8');
    ashlar(b, x, 33.6, z, W + 1.3, 0.7, W + 1.3, '#f0e8d8');
    b.cyl(stone, '#e8e0d0', x, 35.8, z, 2.1, 3.6, 'cyl8');
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; b.add(G.box, VC.glow, x + Math.cos(a) * 2.12, 35.8, z + Math.sin(a) * 2.12, 0.04, 2.2, 0.8, 0, -a, 0, hdr('#ffe0a8', 1.4)); }
    b.add(G.sph, VC.solid, x, 37.8, z, 4.6, 3.6, 4.6, 0, 0, 0, '#5a7a6a');
    b.cyl(VC.metal, '#5a6068', x, 41, z, 0.12, 6.4, 'cyl6');
    b.sph(VC.glow, hdr('#ff2a2a', 4), x, 44.3, z, 0.18, true);
    K.pool(b, x, z, 16, 16, hdr('#ffc890', 0.55), 0.05);
  };
  const starPier = (b, x, z) => {   // the Star Ferry pier: a white shed on piles, its green roof, the name and a little clock tower
    for (let dz = 2; dz > -20; dz -= 3) for (const dx of [0.5, 9.5]) b.cyl(VC.solid, '#3a3a3e', x + dx, WY - 1, z + dz, 0.3, 3, 'cyl6');
    b.block(VC.solid, '#5a5a5e', x + 5, -0.4, z - 9, 10.6, 0.4, 23);
    b.block(VC.solid, '#f2efe6', x + 5, 0, z - 9, 9, 4.4, 21);
    b.box(VC.glow, hdr('#fff0d0', 0.9), x + 0.48, 2.2, z - 9, 0.04, 1.6, 18);
    b.add(G.cone4, VC.solid, x + 5, 5.4, z - 9, 13.4, 2.0, 30, 0, 0, 0, '#2a6a4a');
    const nm = label('天星小輪  STAR FERRY', { w: 1024, h: 128, color: '#ffffff', font: HEI, size: 0.6, glow: '#9fffe0' });
    b.add(G.plane, nm, x + 0.42, 3.8, z - 9, 12, 1.5, 1, 0, -Math.PI / 2, 0);
    b.block(VC.solid, '#f2efe6', x + 3, 4.4, z + 0.5, 2.6, 6, 2.6);
    for (const [dx, dz, ry] of [[-1.32, 0, -Math.PI / 2], [0, 1.32, 0]]) b.add(G.plane, clockMat, x + 3 + dx, 8.8, z + 0.5 + dz, 1.8, 1.8, 1, 0, ry, 0);
    b.add(G.cone4, VC.solid, x + 3, 11.2, z + 0.5, 3.8, 1.8, 3.8, 0, 0, 0, '#2a6a4a');
    b.box(VC.solid, '#5a5a5e', x - 2, -0.2, z - 4, 4.4, 0.4, 3);   // the gangway from the promenade
  };
  const culturalCentre = (b, xf, z0, z1) => {   // the Cultural Centre: windowless, tiled in pale pink, its roof sweeping up like a ski jump
    const L = z0 - z1, sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(0, 9); sh.quadraticCurveTo(26, 10, 44, 34); sh.lineTo(48, 34); sh.lineTo(48, 0); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false, curveSegments: 16 }), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 4, uv.getY(i) / 4);
    b.addM(g, K.ccMat, new THREE.Matrix4().makeRotationY(Math.PI).setPosition(xf, 0, z0), '#c8aca4');
    b.box(VC.glow, hdr('#ffc8a8', 0.7), xf + 0.05, 0.4, (z0 + z1) / 2, 0.06, 0.12, L - 1);
    b.add(K.tiled(1), K.lobbyMat, xf + 0.06, 2.4, z0 - 5, 6, 3.6, 1, 0, Math.PI / 2, 0, hdr('#ffffff', 0.8));   // the lobby behind its glass doors
  };
  K.ccMat = std({ map: canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#e8e0dc'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(120,90,90,0.12)'; for (let k = 0; k < w; k += 8) { g.fillRect(k, 0, 1, h); g.fillRect(0, k, w, 1); } }), vertexColors: true, roughness: 0.8, emissive: '#ffb8a0', emissiveIntensity: 0.06, side: THREE.DoubleSide });
  const tst = () => {
    const b = new Batcher(), RAIL = EDGE + 14;
    // right: the wide promenade, the Clock Tower, the Star Ferry pier and a ferry alongside, boats on the harbour
    K.harbour(b, 1, 0, 80, { rail: RAIL });
    K.farShore(b, 1, { x0: 130, x1: 185 });
    clockTower(b, 12.4, -58);
    starPier(b, RAIL + 4, -64);
    K.ferry(b, RAIL + 18.5, -70);
    K.ferry(b, 42, -30);
    K.junk(b, 64, -50, 1);
    K.sampan(b, 30, -10);
    for (let z = 30; z < 78; z += 14) if (Math.abs(z - 58) > 6) K.palm(b, EDGE + 4.4, -z, rand(0.95, 1.1));
    for (const z of [18, 40, 72]) { b.box(VC.solid, '#6a4a30', RAIL - 1.2, 0.45, -z, 0.5, 0.08, 1.8); b.box(VC.metal, '#5a5e64', RAIL - 1.2, 0.22, -z, 0.4, 0.44, 1.6); }
    for (const z of [24, 46]) {   // a photographer at his tripod, aimed at the island
      K.person(b, RAIL - 2.4, -z, { phone: false });
      for (const [dx, dz] of [[0.3, 0.25], [0.3, -0.25], [0.7, 0]]) beam(b, VC.metal, RAIL - 1.7, 1.35, -z, RAIL - 1.7 + dx, 0, -z + dz, 0.03, '#2a2a2e');
      b.box(VC.solid, '#141414', RAIL - 1.7, 1.45, -z, 0.22, 0.16, 0.14);
    }
    K.crowd(b, EDGE + 1.0, RAIL - 0.6, 4, 78, 24);
    // left: the Cultural Centre and the Space Museum's dome
    farGround(b, -1, '#1a1820');
    culturalCentre(b, -(EDGE + 11), -6, -54);
    b.add(SPH, VC.solid, -34, 0, -67, 26, 34, 26, 0, 0, 0, '#ece8e0');
    b.cyl(VC.solid, '#8a8478', -34, 0.5, -67, 13.6, 1.0, 'cyl');
    K.pool(b, -34, -67, 34, 34, hdr('#c8d8ff', 0.48), 0.06);
    b.block(VC.solid, '#d8d4cc', -46, 0, -67, 14, 6, 24);
    for (let z = 4; z < 78; z += 13) K.palm(b, -(EDGE + 4.2), -z, rand(0.9, 1.05));
    for (let z = 10; z < 78; z += 26) K.lamp(b, -(EDGE + 0.62), -z, -1);
    K.crowd(b, -(EDGE + 1.0), -(EDGE + 6.5), 2, 78, 14);
    return b.build();
  };

  // ---------- 1. Central: the HSBC lions, under the bank, the Bank of China Tower ----------
  const bocGlass = std({ vertexColors: true, roughness: 0.25, metalness: 0.6, transparent: true, side: THREE.DoubleSide, emissive: '#1a2a44', emissiveIntensity: 0.6 });
  const bocLine = basic({ vertexColors: true, fog: false, transparent: true });
  const hsbcTex = canvasTex(128, 128, (g, w, h) => {   // the bank's glass: floors lit white behind the mullions, some dark
    g.fillStyle = '#1c2432'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 8) { const r = Math.random(); g.fillStyle = r < 0.6 ? '#dfe8f4' : r < 0.8 ? '#b8c8dc' : '#2a3242'; g.fillRect(x, y + 3, 8, 13); }
    g.fillStyle = 'rgba(30,40,56,0.9)'; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 3); for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 1.5, h);
  });
  const hsbcGlass = basic({ map: hsbcTex, vertexColors: true, color: hdr('#ffffff', 0.62) });
  const lion = (b, x, z, roar) => {   // Stephen and Stitt: the bank's bronze lions crouched on their plinths, facing the square
    ashlar(b, x, 0, z, 1.9, 1.3, 3.4, '#d8d4c8');
    const c = '#5a4a30', y = 1.3;
    b.add(G.sph, bronze, x, y + 0.5, z - 0.4, 1.1, 0.9, 2.5, 0, 0, 0, c);   // the body, low along the plinth
    b.add(G.sph, bronze, x, y + 0.42, z - 1.25, 1.0, 0.8, 0.9, 0, 0, 0, c);   // the haunches
    for (const e of [-1, 1]) b.add(G.box, bronze, x + e * 0.32, y + 0.14, z + 0.95, 0.3, 0.26, 1.0, 0, 0, 0, c);   // the paws stretched forward
    b.add(G.sph, bronze, x, y + 1.1, z + 0.55, 1.25, 1.2, 0.9, -0.3, 0, 0, '#4a3c26');   // the mane
    b.add(G.sph, bronze, x, y + 1.12, z + 0.88, 0.72, 0.7, 0.66, 0, 0, 0, c);   // the head
    b.add(G.box, bronze, x, y + 0.98, z + 1.2, 0.36, 0.3, 0.3, 0, 0, 0, '#6a5838');   // the muzzle
    for (const e of [-1, 1]) b.sph(bronze, '#4a3c26', x + e * 0.26, y + 1.42, z + 0.7, 0.1, true);   // the ears
    for (const e of [-1, 1]) b.box(VC.solid, '#1a120a', x + e * 0.17, y + 1.24, z + 1.2, 0.1, 0.07, 0.04);   // the eyes under heavy brows
    b.box(VC.solid, '#2a1e12', x, y + 1.06, z + 1.36, 0.16, 0.1, 0.04);   // the nose
    if (roar) b.box(VC.solid, '#1a120a', x, y + 0.86, z + 1.33, 0.26, 0.14, 0.06);
    beam(b, bronze, x + 0.35, y + 0.4, z - 1.6, x + 0.6, y + 0.15, z - 0.9, 0.12, c);   // the tail curled round
  };
  const legco = (b, xf, zc) => {   // the old Supreme Court: granite colonnades round two storeys, the dome, Justice on the pediment
    const D = 24, L = 34, x = xf - D / 2;
    ashlar(b, x, 0, zc, D, 15, L, '#e4e0d4');
    b.box(VC.glow, hdr('#ffe8c0', 0.8), xf + 0.06, 3.5, zc, 0.04, 4.6, L - 4);
    b.box(VC.glow, hdr('#ffe8c0', 0.7), xf + 0.06, 10.6, zc, 0.04, 3.8, L - 4);
    for (let k = 0; k <= 11; k++) { const z = zc - L / 2 + 1 + (k * (L - 2)) / 11; b.cyl(stone, '#f0ece0', xf + 0.5, 3.6, z, 0.4, 7.2, 'cyl8'); b.cyl(stone, '#f0ece0', xf + 0.5, 11.0, z, 0.36, 6.4, 'cyl8'); }
    ashlar(b, xf + 0.4, 7.2, zc, 1.6, 0.8, L + 0.6, '#f4f0e4'); ashlar(b, xf + 0.4, 14.2, zc, 1.8, 1.2, L + 1, '#f4f0e4');
    b.add(G.cone4, VC.solid, xf + 0.5, 16.6, zc, 1.6, 3.2, 10, 0, 0, 0, '#ece8dc');
    b.add(G.cyl8, VC.solid, xf + 0.6, 18.9, zc, 0.5, 1.6, 0.5, 0, 0, 0, '#f4f0e8');   // Justice
    b.sph(VC.solid, '#f4f0e8', xf + 0.6, 19.9, zc, 0.22, true);
    b.box(VC.solid, '#f4f0e8', xf + 0.6, 19.4, zc, 0.12, 0.08, 1.8);
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#ffd890', 1.6), xf + 0.6, 19.2, zc + e * 0.9, 0.1, 0.12, 0.3);
    b.cyl(stone, '#e8e4d8', x - 2, 17.5, zc, 5, 5, 'cyl');
    b.add(SPH, VC.solid, x - 2, 20, zc, 10.6, 9, 10.6, 0, 0, 0, '#c8c0b0');
    b.cyl(VC.glow, hdr('#ffd890', 1.4), x - 2, 24.5, zc, 0.6, 1.4, 'cyl8');
  };
  const hsbc = (b, z0) => {   // the bank raised on its masts: an open plaza underneath, the glass belly, the coat-hanger trusses
    const z1 = z0 - 52, zc = (z0 + z1) / 2, BELLY = 15, MX = [-30, -6, 6, 30], MZ = [z0 - 4, z1 + 4];
    for (const e of [-1, 1]) b.add(G.plane, K.paveMat, e * (EDGE + 7 + 13), 0.03, zc, 26, 52, 1, -Math.PI / 2, 0, 0);
    for (const mx of MX) for (const mz of MZ) {   // each mast four steel tubes, braced every few floors
      for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) b.cyl(VC.solid, '#b8c0c8', mx + dx, 70, mz + dz, 0.45, 140, 'cyl8');
      for (let y = 6; y < 140; y += 8) b.box(VC.solid, '#9aa2aa', mx, y, mz, 2.6, 0.5, 2.6);
    }
    const bays = [[-30, -6, 116], [-6, 6, 140], [6, 30, 96]];
    for (const [xa, xb, top] of bays) {
      const xm = (xa + xb) / 2, w = xb - xa - 2.6;
      b.addM(tiledBox(w, top - BELLY - 2, 44, 16), hsbcGlass, at(xm, BELLY + 2 + (top - BELLY - 2) / 2, zc), 0xffffff);
      for (const y of [38, 66, 92, 114, 136]) if (y < top) for (const fz of MZ) {   // the suspension trusses at their double-height floors
        beam(b, VC.metal, xa + 1.3, y + 5, fz, xb - 1.3, y + 5, fz, 0.6, '#b8c0c8');
        beam(b, VC.metal, xa + 1.3, y + 5, fz, xm, y, fz, 0.5, '#b8c0c8');
        beam(b, VC.metal, xb - 1.3, y + 5, fz, xm, y, fz, 0.5, '#b8c0c8');
        for (const t of [0.25, 0.75]) beam(b, VC.metal, xa + (xb - xa) * t, y + 5, fz, xa + (xb - xa) * t, y - 20, fz, 0.18, '#9aa2ac');
      }
      b.box(VC.metal, '#8a9098', xm, top + 1, zc, w + 2.6, 2, 48);
    }
    b.box(VC.glow, hdr('#dfe8ff', 0.5), 0, BELLY, zc, 58, 0.1, 40);   // the glass underbelly of the atrium
    for (let x = -28; x <= 28; x += 4) b.box(VC.metal, '#3a4048', x, BELLY - 0.08, zc, 0.16, 0.16, 40);
    for (let z = zc - 20; z <= zc + 20; z += 5) b.box(VC.metal, '#3a4048', 0, BELLY - 0.1, z, 58, 0.18, 0.18);
    for (const e of [-1, 1]) {   // the escalators rising into it
      beam(b, VC.metal, e * 11, 0.2, zc + 10, e * 11, BELLY, zc - 6, 1.6, '#6a7078', 1.1);
      beam(b, VC.glow, e * 11, 0.7, zc + 10, e * 11, BELLY + 0.4, zc - 6, 1.7, hdr('#dfeaff', 0.55), 0.15);
    }
    K.pool(b, 0, zc, 50, 40, hdr('#cfe0ff', 0.11), 0.05);
    K.crowd(b, -(EDGE + 1.0), -28, -z0 + 2, -z1 - 2, 12, { suit: true });
    K.crowd(b, EDGE + 1.0, 28, -z0 + 2, -z1 - 2, 12, { suit: true });
  };
  const central = () => {
    const b = new Batcher();
    K.tramWires(b, 0, 24);
    farGround(b, -1, '#18171e'); farGround(b, 1, '#18171e');
    legco(b, -(EDGE + 10.5), -14);
    // Statue Square: lawns, fountain pools with their jets, palms
    b.add(G.plane, K.paveMat, EDGE + 20, 0.03, -12, 33, 24, 1, -Math.PI / 2, 0, 0);
    for (const [x, z] of [[16, -6], [26, -6], [16, -17], [26, -17]]) {
      b.box(VC.solid, '#2e5228', x, 0.06, z, 8, 0.1, 8);
      b.add(G.plane, K.sea, x, 0.32, z, 5, 5, 1, -Math.PI / 2, 0, 0);
      for (const [dx, dz, w, d] of [[0, 2.6, 5.4, 0.4], [0, -2.6, 5.4, 0.4], [2.6, 0, 0.4, 5.4], [-2.6, 0, 0.4, 5.4]]) b.box(VC.solid, '#c8c4b8', x + dx, 0.25, z + dz, w, 0.5, d);
      for (let k = 0; k < 3; k++) b.cyl(VC.glow, hdr('#d8ecff', 0.9), x + rand(-1.6, 1.6), 1.1, z + rand(-1.6, 1.6), 0.04, 1.6, 'cyl6');
    }
    for (const z of [2, 22]) K.palm(b, EDGE + 9, -z, 1.0);
    for (const e of [-1, 1]) lion(b, e * (EDGE + 1.8), -23.5, e > 0);
    hsbc(b, -26);
    bocTower(b, { glass: bocGlass, line: bocLine, x: -78, y: 0, z: -44, s: 0.55, lw: 1.0, glassCol: '#1a2a44', lineCol: hdr('#eaf4ff', 1.8) });
    ckcTower(b, { solid: VC.glow, grid: K.ckcMat, x: 76, y: 0, z: -58, s: 0.5 });
    for (let z = 4; z < 24; z += 10) for (const s of [-1, 1]) K.lamp(b, s * (EDGE + 0.62), -z, s);
    K.crowd(b, -(EDGE + 1.0), -(EDGE + 7), 2, 24, 10, { suit: true });
    K.crowd(b, EDGE + 1.0, EDGE + 30, 2, 22, 16);
    return b.build();
  };
  K.ckcMat = basic({ map: gridTex(), vertexColors: true });

  // ---------- 2. Temple Street night market ----------
  const gateway = (b, z) => {   // the street's gateway: red posts, a lit name board, a green-tiled roof with lanterns hung under it
    for (const e of [-1, 1]) { b.box(VC.solid, '#b8202a', e * (EDGE + 0.9), 7, z, 0.8, 14, 0.8); b.box(VC.solid, '#d8c8a0', e * (EDGE + 0.9), 0.4, z, 1.2, 0.8, 1.2); }
    b.box(VC.solid, '#8a1a1a', 0, 13.4, z, 2 * EDGE + 3.4, 1.2, 0.8);
    b.box(VC.solid, '#8a1a1a', 0, 11.6, z, 2 * EDGE + 1.0, 0.5, 0.5);
    b.add(G.plane, label('廟街', { w: 512, h: 192, color: '#ffe08a', font: KAI, weight: 700, size: 0.78, bg: '#1a1a1a', border: '#d8a830', k: 1.4 }), 0, 13.3, z + 0.42, 3.6, 1.35, 1);
    b.add(G.plane, label('TEMPLE STREET', { w: 1024, h: 128, color: '#ffe08a', font: HEI, size: 0.55, k: 1.3 }), 0, 12.25, z + 0.42, 4.6, 0.55, 1);
    roof(b, greenTile, 0, 14.0, z, 2 * EDGE + 4.6, 1.8, 1.4, { hip: true, eave: 0.8, ridge: '#d8a830' });
    for (let x = -EDGE; x <= EDGE + 0.01; x += (2 * EDGE) / 4) K.lantern(b, x, 11.0, z, 0.34);
  };
  const fortune = (b, x, z, s) => {   // a fortune teller's booth: a tent with its lamp, the sign, the teller and a client on stools
    b.block(VC.solid, '#c8202a', x, 0, z, 0.9, 0.75, 1.2);
    b.box(VC.solid, '#f2c230', x, 0.76, z, 0.92, 0.02, 1.22);
    for (const dz of [-0.9, 0.9]) b.box(VC.metal, '#5a6068', x + s * 0.5, 1.3, z + dz, 0.04, 2.6, 0.04);
    b.add(G.box, VC.solid, x + s * 0.1, 2.62, z, 1.6, 0.04, 2.0, 0, 0, s * 0.15, pick(['#1f5aa8', '#e8e0c8', '#2a7a4a']));
    b.box(VC.glow, hdr('#fff0c0', 2.6), x, 2.3, z, 0.18, 0.18, 0.18);
    b.add(G.plane, K.fortuneSign, x + s * 0.55, 1.6, z + 0.95, 0.5, 1.6, 1, 0, 0, 0);
    K.seated(b, x + s * 0.55, z - 0.2, { y: 0.4 });
    K.seated(b, x - s * 0.6, z + 0.2, { y: 0.4 });
    b.cyl(VC.solid, '#1f5aa8', x - s * 0.6, 0.2, z + 0.2, 0.18, 0.4, 'cyl8');
  };
  K.fortuneSign = label('睇相 算命', { w: 128, h: 512, color: '#ffffff', font: KAI, size: 0.28, bg: '#c8202a', k: 1.0 });
  const opera = (b, x, z, s) => {   // Cantonese opera under the lights: a little stage, the singers in costume, the band beside it
    b.block(VC.solid, '#3a2a20', x, 0, z, 3.4, 0.5, 4.8);
    b.box(VC.solid, '#a81820', x + s * 1.6, 2.2, z, 0.1, 3.6, 4.8);
    b.box(VC.glow, hdr('#ffd8a0', 1.2), x + s * 1.4, 3.9, z, 0.3, 0.08, 4.4);
    for (const [dz, robe, crown] of [[-0.9, '#e83a6a', '#ffd23d'], [0.9, '#3a6ad8', '#f4f4f0']]) {
      const px = x + s * 0.3, pz = z + dz;
      b.add(G.cone8, VC.solid, px, 1.25, pz, 0.8, 1.5, 0.8, 0, 0, 0, robe);
      b.box(VC.solid, robe, px, 1.85, pz, 0.5, 0.7, 0.34);
      for (const e of [-1, 1]) b.box(VC.solid, '#f4f4f0', px, 1.75, pz + e * 0.34, 0.12, 0.7, 0.12);   // water sleeves
      b.sph(VC.solid, '#f4dcc8', px, 2.4, pz, 0.15, true);
      b.add(G.cone8, VC.solid, px, 2.66, pz, 0.36, 0.3, 0.36, 0, 0, 0, crown);
      for (const e of [-1, 1]) beam(b, VC.solid, px, 2.7, pz, px + s * 0.2, 3.5, pz + e * 0.4, 0.03, '#ffd23d');   // pheasant feathers
    }
    for (let k = 0; k < 3; k++) { K.seated(b, x, z + 3.0 + k * 0.8, { y: 0.4 }); b.box(VC.solid, '#5a3a20', x - s * 0.35, 0.95, z + 3.0 + k * 0.8, 0.05, 0.7, 0.05); }   // the erhu players beside the stage
    for (let k = 0; k < 8; k++) K.seated(b, x - s * rand(2.4, 3.6), z + rand(-2.4, 2.4), { y: 0.4 });
  };
  const tinHau = (b, x, z, s) => {   // the Tin Hau temple, its front at x on side s: grey brick, the granite porch, red doors and the plaque, a green roof with figures on its ridge
    const W = 16, D = 14, H = 6.5, xc = x + s * D / 2, f = -s;   // f points back toward the street
    b.block(VC.solid, '#7a7c80', xc, 0, z, D, H, W);
    for (const dz of [-4, 4]) b.cyl(stone, '#d8d4c8', x + f * 1.2, H / 2, z + dz, 0.3, H, 'cyl8');
    b.box(VC.solid, '#5a5a5e', x + f * 0.6, H - 0.4, z, 1.4, 0.8, 9.4);
    b.box(VC.solid, '#a81820', x + f * 0.06, 2.0, z, 0.1, 4.0, 3.0);
    b.box(VC.glow, hdr('#ffc070', 0.9), x + f * 0.12, 2.0, z, 0.04, 3.4, 0.08);
    b.add(G.plane, label('天后古廟', { w: 512, h: 160, color: '#ffe08a', font: KAI, weight: 700, size: 0.7, bg: '#1a1a1a', border: '#d8a830', k: 1.3 }), x + f * 0.14, 4.85, z, 3.2, 1.0, 1, 0, -s * Math.PI / 2, 0);
    roof(b, greenTile, xc, H, z, W, D, 2.8, { hip: false, ry: Math.PI / 2, eave: 0.9, ridge: '#2a5a3a' });
    for (let k = 0; k < 14; k++) b.box(VC.solid, pick(['#e83a2a', '#3a8ad8', '#f2c230', '#2aa860', '#f4f4f0', '#e87a2a']), xc, H + 3.3, z - W / 2 + 1 + k * ((W - 2) / 13), 0.3, rand(0.4, 0.8), 0.4);   // the Shiwan figures on the ridge
    for (const dz of [-2.4, 2.4]) K.lantern(b, x + f * 1.4, 4.6, z + dz, 0.45);
    for (let k = 0; k < 3; k++) b.cyl(bronze, '#6a5030', x + f * (3 + k * 0.1), 0.5, z + (k - 1) * 0.3, 0.5, 1.0, 'cyl8');   // the incense burner
    b.box(VC.glow, hdr('#ff7a2a', 1.5), x + f * 3.05, 1.05, z, 0.6, 0.12, 0.6);
    for (const dz of [-6.5, 6.5]) {   // the square's banyans, old men at Chinese chess under them
      K.banyan(b, x + f * 4.6, z + dz, 0.7);
      b.block(VC.solid, '#c8c4bc', x + f * 2.6, 0, z + dz, 0.8, 0.75, 0.8);
      K.seated(b, x + f * 2.6, z + dz - 0.7, { y: 0.4 }); K.seated(b, x + f * 2.6, z + dz + 0.7, { y: 0.4 });
    }
  };
  const temple = () => {
    const b = new Batcher();
    gateway(b, -3);
    for (const s of [-1, 1]) {
      farGround(b, s, '#16151c');
      K.row(b, s, 0, s < 0 ? 60 : 80, { shops: MARKET_SHOPS, signs: 0.9, floors: [5, 9], roofSign: 0.15 });
      for (let z = 6; z < 76; z += 2.6) if (!(s > 0 && z > 34 && z < 68) && !(s < 0 && z > 26 && z < 44) && !(s < 0 && z > 58)) K.stall(b, s * (EDGE + 1.9), -z, s);
      K.crowd(b, s * (EDGE + 3.4), s * (EDGE + 6.6), 4, 76, 14);
      K.crowd(b, s * (EDGE + 0.35), s * (EDGE + 0.8), 4, 76, 5);
    }
    K.dpd(b, -(EDGE + 4.6), -35, -1);
    for (const z of [38, 44, 50]) fortune(b, EDGE + 2.6, -z, 1);
    opera(b, EDGE + 5.6, -61, 1);
    tinHau(b, -(EDGE + 6.2), -70, -1);
    for (let z = 10; z < 78; z += 10) K.festoon(b, -z, { lanterns: (z / 10) % 2 === 0, y: 7.2 });
    return b.build();
  };

  // ---------- 3. The Peak: the Peak Tower, the Peak Tram's last climb, the city's lights below ----------
  const night = skyTex({ wall: '#0a0c16', lit: ['#fff0d8', '#eaf4ff', '#ffe0b0', '#d8f0ff', '#ffd0e8'], chance: 0.5 });
  const cityMat = basic({ map: night.map, vertexColors: true, fog: false });
  const bowl = new THREE.SphereGeometry(1, 36, 10, 0, Math.PI * 2, Math.PI * 0.56, Math.PI * 0.44);
  const peak = () => {
    const b = new Batcher();
    // left: the summit rising behind the Peak Tower and the Galleria
    farGround(b, -1, '#18201a');
    b.add(G.sph, VC.solid, -78, -30, -40, 120, 76, 140, 0, 0, 0, '#1c2a1e');
    const PX = -30, PZ = -46;
    b.block(VC.solid, '#3a3640', PX, 0, PZ, 26, 14, 24);
    b.box(VC.glow, hdr('#ffe8c8', 0.55), PX + 13.05, 2.6, PZ, 0.05, 3.4, 20);   // the shops along its foot
    for (let z = PZ - 10; z <= PZ + 10; z += 2.5) b.box(VC.solid, '#5a5462', PX + 13.1, 9.5, z, 0.3, 8, 0.4);
    b.add(G.plane, label('山頂 THE PEAK', { w: 1024, h: 128, color: '#ffffff', font: HEI, size: 0.6, glow: '#ff6ac8', k: 1.3 }), PX + 13.12, 6.4, PZ, 9, 1.1, 1, 0, Math.PI / 2, 0);
    for (const [dx, dz] of [[-8, -6], [8, -6], [-8, 6], [8, 6]]) b.cyl(VC.solid, '#c8c0d0', PX + dx, 17.5, PZ + dz, 1.1, 7, 'cyl8');
    b.addM(bowl, VC.solid, new THREE.Matrix4().makeScale(26, 9.8, 17).setPosition(PX, 31.8, PZ), '#d8c8e0');   // the wok, lit from under its rim
    b.add(RING, VC.glow, PX, 30, PZ, 25.6, 30, 16.7, 0, 0, 0, hdr('#ff6ac8', 2.2));
    b.addM(new THREE.CircleGeometry(1, 36).rotateX(-Math.PI / 2), VC.solid, new THREE.Matrix4().makeScale(25.2, 1, 16.4).setPosition(PX, 29.9, PZ), '#5a5068');
    for (let k = 0; k < 10; k++) K.person(b, PX + rand(-16, 16), PZ + rand(-9, 9), { y: 29.9 });
    b.block(VC.solid, '#4a4450', PX - 8, 0, PZ - 34, 22, 9, 18);   // the Galleria, its terraces stepping up
    b.block(VC.solid, '#4a4450', PX - 12, 9, PZ - 34, 14, 4, 14);
    for (const y of [2, 6]) b.box(VC.glow, hdr('#fff0d8', 0.5), PX + 3.06, y, PZ - 34, 0.05, 2, 16);
    for (let z = 6; z < 78; z += 18) { K.lamp(b, -(EDGE + 0.62), -z, -1); K.banyan(b, -(EDGE + 5.6), -z - 6, rand(0.7, 0.85)); }
    K.crowd(b, -(EDGE + 1.0), -(EDGE + 5), 2, 78, 10);
    // right: the lookout's railing and coin telescopes, the drop through the woods, the city's lights far below
    const TZ = -72;
    K.railing(b, 1, 0, 66, EDGE + 6.8); K.railing(b, 1, 77, 80, EDGE + 6.8);
    for (const z of [10, 26, 42, 58]) { b.cyl(VC.metal, '#3a6a4a', EDGE + 6.2, 0.6, -z, 0.08, 1.2, 'cyl8'); b.add(G.box, VC.metal, EDGE + 6.2, 1.3, -z, 0.3, 0.3, 0.7, 0, 0, 0.4, '#3a6a4a'); }
    K.crowd(b, EDGE + 1.2, EDGE + 6.4, 2, 78, 22);
    const th = Math.atan2(60, 30), Ls = Math.hypot(30, 60);
    b.add(G.box, VC.solid, EDGE + 7 + (Ls / 2) * Math.cos(th) - Math.sin(th), -(Ls / 2) * Math.sin(th) - Math.cos(th), -40, Ls + 1, 2, 220, 0, 0, -th, '#16221a');
    for (let k = 0; k < 40; k++) { const x = rand(EDGE + 9, 34), z = -rand(-40, 120); b.add(G.sphLow, VC.solid, x, -(x - EDGE - 7) * 2 + rand(0, 1.5), z, rand(3, 6), rand(2.5, 4), rand(3, 6), 0, 0, 0, pick(['#1c3a22', '#22442a', '#183020'])); }
    for (let k = 0; k < 30; k++) { const x = rand(EDGE + 9, 32); b.sph(VC.glow, hdr('#ffc070', 2.2), x, -(x - EDGE - 7) * 2 + 0.6, -rand(-20, 100), 0.18, true); }   // lamps on the paths down through the woods
    b.box(VC.solid, '#101014', 170, -49, -160, 280, 2, 520);
    for (let k = 0; k < 320; k++) {   // their tops just below the lookout, so the city shows over the edge as a carpet of light
      const x = rand(40, 300), z = -rand(-40, 420), h = rand(18, 40) * (x < 150 && z < -60 && z > -260 ? 1.15 : 1), w = rand(12, 24);
      b.addM(buildingGeo(w, h, w * rand(0.7, 1.2), night, 3.4, 4.2), cityMat, at(x, -48, z, rand(-0.2, 0.2)), pick(['#ffffff', '#e0e8ff', '#ffe8d8']));
    }
    for (let k = 0; k < 90; k++) { const x = rand(40, 300), z = -rand(-40, 420); b.add(G.box, cityMat, x, -47.4, z, rand(6, 30), 0.3, 0.4, 0, rand(0, 3), 0, hdr(pick(['#ffd890', '#fff0d0', '#ff9a50']), 1.6)); }   // the streets' lights between them
    // the Peak Tram on its last climb, on piers down the slope, its car halfway up
    const tg = Math.atan2(26, 48), ty = (x) => -(x - 12) * Math.tan(tg);
    for (const e of [-0.6, 0.6]) beam(b, VC.metal, 12, 0.4, TZ + e, 60, ty(60) + 0.4, TZ + e, 0.1, '#8a9098');
    for (let x = 14; x < 60; x += 2) b.box(VC.solid, '#3a3a3e', x, ty(x) + 0.25, TZ, 0.3, 0.2, 2.2);
    for (let x = 18; x < 60; x += 8) b.box(VC.solid, '#4a4a50', x, (ty(x) - 49) / 2, TZ, 0.6, -ty(x) + 49 - 0.3, 0.6);
    const cx = 26, cy = ty(cx) + 1.9;
    b.add(G.box, VC.solid, cx, cy, TZ, 11, 2.8, 2.6, 0, 0, -tg, '#7a1418');
    b.add(G.box, VC.glow, cx - Math.sin(tg) * 0.4, cy + Math.cos(tg) * 0.4, TZ, 10, 0.9, 2.64, 0, 0, -tg, hdr('#ffe8c0', 1.1));
    b.add(G.box, VC.solid, cx - Math.sin(tg) * 1.3, cy + Math.cos(tg) * 1.3, TZ, 11, 0.2, 2.4, 0, 0, -tg, '#f2ead0');
    b.block(VC.solid, '#5a5a62', EDGE + 7.2, 0, TZ, 4, 3.6, 9);   // the top of the line
    b.box(VC.glow, hdr('#fff0d8', 0.8), EDGE + 5.16, 1.8, TZ, 0.04, 1.4, 6);
    b.add(G.plane, label('山頂纜車 PEAK TRAM', { w: 1024, h: 128, color: '#ffe08a', font: HEI, size: 0.6, k: 1.2 }), EDGE + 5.15, 3.0, TZ, 6, 0.75, 1, 0, -Math.PI / 2, 0);
    return b.build();
  };

  // ---------- 4. Golden Bauhinia Square ----------
  const hkFlag = canvasTex(192, 128, (g, w, h) => {   // the regional flag: a white bauhinia of five petals, each with a red star, on red
    g.fillStyle = '#de2910'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 5; k++) {
      g.save(); g.translate(w / 2, h / 2); g.rotate((k / 5) * Math.PI * 2);
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-16, -10, -12, -38, 4, -44); g.bezierCurveTo(10, -30, 8, -12, 0, 0); g.fill();
      g.fillStyle = '#de2910'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 1.6 : 4; g.lineTo(-1 + Math.cos(a) * r, -26 + Math.sin(a) * r); } g.fill();
      g.strokeStyle = '#de2910'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -3); g.quadraticCurveTo(-3, -12, -1, -20); g.stroke();
      g.restore();
    }
  }, { repeat: false });
  const cnFlag = canvasTex(192, 128, (g, w, h) => {   // the national flag: the great star and four small ones in yellow on red
    g.fillStyle = '#de2910'; g.fillRect(0, 0, w, h);
    const star = (x, y, r, rot) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = rot - Math.PI / 2 + (i / 10) * Math.PI * 2, rr = i % 2 ? r * 0.38 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
    g.fillStyle = '#ffde00'; star(32, 32, 19, 0);
    for (const [x, y] of [[64, 13], [77, 26], [77, 45], [64, 58]]) star(x, y, 6.5, Math.atan2(32 - y, 32 - x) + Math.PI / 2);
  }, { repeat: false });
  const flagMats = [hkFlag, cnFlag].map((t) => foliageMat(t, { sway: 0.4, alphaTest: 0.5, emissive: 0.5 }));
  const petalGeo = (() => {   // one gilded petal: broad and spoon-shaped, cupped, its tip curling over in the swirl
    const g = new THREE.SphereGeometry(0.5, 14, 10);
    g.scale(2.4, 3.0, 0.55); g.translate(0, 1.5, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), x = p.getX(i), z = p.getZ(i), a = y * 0.3, cup = 0.12 * x * x;
      p.setXYZ(i, x * Math.cos(a) - (z - cup) * Math.sin(a), y, x * Math.sin(a) + (z - cup) * Math.cos(a) + 0.1 * y * y);
    }
    g.computeVertexNormals();
    return g;
  })();
  const shell = new THREE.SphereGeometry(1, 40, 8, 0, Math.PI * 2, 0, Math.PI * 0.32);   // a shallow cap: the Convention Centre's roof
  const goldMat = std({ vertexColors: true, roughness: 0.25, metalness: 0.9, emissive: '#c88a10', emissiveIntensity: 0.55 });
  const bauhiniaSculpture = (b, x, z) => {   // the gilded bauhinia opening on its red granite plinth
    b.block(VC.solid, '#8a2a22', x, 0, z, 9, 0.8, 9);
    b.block(VC.solid, '#9a3028', x, 0.8, z, 7, 0.8, 7);
    b.block(VC.solid, '#a83a30', x, 1.6, z, 4.4, 3.2, 4.4);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2, m = new THREE.Matrix4().compose(new THREE.Vector3(x + Math.cos(a) * 0.6, 4.8, z + Math.sin(a) * 0.6), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.85, -a + Math.PI / 2, 0.25, 'YXZ')), new THREE.Vector3(1, 1, 1));
      b.addM(petalGeo, goldMat, m, '#ffc848');
    }
    b.add(G.cone8, goldMat, x, 5.6, z, 0.6, 1.8, 0.6, 0, 0, 0, '#ffd060');
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + 0.6; beam(b, goldMat, x, 5.0, z, x + Math.cos(a) * 0.9, 7.0, z + Math.sin(a) * 0.9, 0.08, '#ffe080'); }   // the stamens
    K.pool(b, x, z, 18, 18, hdr('#ffb040', 0.66), 0.06);
  };
  const square = () => {
    const b = new Batcher(), RAIL = EDGE + 38;
    K.harbour(b, 1, 0, 80, { rail: RAIL, lamps: true });
    K.farShore(b, 1, { x0: 140, x1: 190 });
    bauhiniaSculpture(b, 17, -50);
    for (const [fx, m] of [[24, 0], [31, 1]]) {   // the two flagpoles, their flags blowing out toward the harbour
      b.cyl(VC.metal, '#d8dce2', fx, 14, -68, 0.16, 28, 'cyl8');
      b.addM(flagGeo(4.8, 3.2), flagMats[m], at(fx + 0.1, 27.6, -68), null);
      b.block(VC.solid, '#8a2a22', fx, 0, -68, 1.6, 0.6, 1.6);
    }
    b.cyl(VC.solid, '#2a2a30', 30, 10, -30, 0.9, 20, 'cyl8');   // the Reunification Monument
    for (let y = 3; y < 20; y += 3.2) b.cyl(VC.glow, hdr('#ffd890', 1.4), 30, y, -30, 1.05, 0.25, 'cyl8');
    // the Convention Centre's extension out on the water: its glass halls, the wing of a roof
    b.box(VC.glow, hdr('#dfe8ff', 0.3), 76, 4.5, -96, 64, 9, 30);
    for (let x = 46; x <= 106; x += 4) b.box(VC.metal, '#3a4048', x, 4.5, -80.9, 0.2, 9, 0.2);
    for (const [dx, sx] of [[-14, 1], [16, 1]]) b.addM(shell, VC.solid, new THREE.Matrix4().makeScale(36 * sx, 30, 22).setPosition(76 + dx, -16.4, -95), '#b8c0cc');   // the wings of its roof
    b.box(VC.glow, hdr('#e8f0ff', 0.9), 76, 9.2, -80.6, 60, 0.2, 0.2);
    K.crowd(b, EDGE + 1.0, RAIL - 1, 2, 50, 26);
    K.junk(b, 70, -24, 1); K.ferry(b, 96, -50);
    // the Wan Chai towers on the left
    farGround(b, -1, '#18171e');
    K.towerRow(b, -1, 0, 80);
    for (let z = 6; z < 78; z += 20) K.lamp(b, -(EDGE + 0.62), -z, -1);
    K.crowd(b, -(EDGE + 1.0), -(EDGE + 6.6), 2, 78, 10, { suit: true });
    return b.build();
  };

  // ---------- 5. Choi Hung Estate ----------
  const RAINBOW = ['#ff6a6a', '#ff9a4a', '#ffd84a', '#7ad86a', '#4ac8e8', '#6a8af0', '#b07ae8'];
  const rainbowTex = canvasTex(256, 64, (g, w, h) => { RAINBOW.forEach((c, k) => { g.fillStyle = c; g.fillRect((k * w) / 7, 0, w / 7 + 1, h); }); }, { repeat: false });
  const rainbowWall = std({ map: rainbowTex, roughness: 0.8, emissive: '#ffffff', emissiveMap: rainbowTex, emissiveIntensity: 0.35 });
  const courtTex = canvasTex(128, 256, (g, w, h) => {   // the basketball court: green, the blue keys, white lines
    g.fillStyle = '#2a7a5a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a5aa8'; g.fillRect(w / 2 - 18, 0, 36, 50); g.fillRect(w / 2 - 18, h - 50, 36, 50);
    g.strokeStyle = '#f4f4f0'; g.lineWidth = 2; g.strokeRect(4, 4, w - 8, h - 8);
    g.beginPath(); g.moveTo(4, h / 2); g.lineTo(w - 4, h / 2); g.stroke(); g.beginPath(); g.arc(w / 2, h / 2, 16, 0, 7); g.stroke();
    for (const y of [4, h - 4]) { g.beginPath(); g.arc(w / 2, y, 46, y < 10 ? 0 : Math.PI, y < 10 ? Math.PI : Math.PI * 2); g.stroke(); }
  }, { repeat: false });
  const courtMat = std({ map: courtTex, roughness: 0.8, emissive: '#ffffff', emissiveMap: courtTex, emissiveIntensity: 0.12 });
  const fence = std({ map: canvasTex(32, 32, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#9aa0a8'; g.lineWidth = 1.2; g.beginPath(); for (let k = -32; k < 32; k += 8) { g.moveTo(k, 0); g.lineTo(k + 32, 32); g.moveTo(k + 32, 0); g.lineTo(k, 32); } g.stroke(); }), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.5 });
  const rainbowBlock = (b, xf, s, z0, z1, fl) => {   // a slab block of the estate, each tier of bays painted its colour of the rainbow
    const d = 14, h = GF + fl * 2.8, cx = xf + s * d / 2;
    b.block(VC.solid, '#3a3836', cx, 0, -(z0 + z1) / 2, d, GF, z1 - z0);
    K.ground(b, { side: s, face: xf, len: z1 - z0, z0, z: -(z0 + z1) / 2 }, ESTATE_SHOPS);
    let k = randi(0, 6);
    for (let z = z0; z < z1 - 1; z += 8, k++) {
      const L = Math.min(8, z1 - z);
      b.addM(buildingGeo(d, fl * 2.8, L, K.dense, 2.0, 2.8), K.denseMat, at(cx, GF, -(z + L / 2)), RAINBOW[k % 7]);
    }
    for (let r = 0; r < fl; r++) b.box(VC.glow, hdr('#e8fff4', 0.8), xf - s * 0.03, GF + r * 2.8 + 2.45, -(z0 + z1) / 2, 0.04, 0.05, z1 - z0 - 1);   // the corridors' tubes
    b.add(G.plane, rainbowWall, cx, h / 2, -z0 + 0.05, d, h, 1);   // the end wall, all the colours at once
    b.box(VC.solid, '#d8d4cc', cx, h + 0.5, -(z0 + z1) / 2, d, 1, z1 - z0);
    return h;
  };
  const choiHung = () => {
    const b = new Batcher();
    farGround(b, -1, '#18171e'); farGround(b, 1, '#18171e');
    rainbowBlock(b, -(EDGE + 8.4), -1, 4, 76, 16);
    rainbowBlock(b, EDGE + 33, 1, 2, 64, 13);
    // the basketball court: fenced, floodlit, a game on
    b.add(G.plane, courtMat, 20, 0.04, -29, 22, 30, 1, -Math.PI / 2, 0, 0);
    for (const [x, z, w, ry] of [[9, -29, 30, Math.PI / 2], [31, -29, 30, Math.PI / 2], [20, -14, 22, 0], [20, -44, 22, 0]]) b.add(K.tiled2(Math.round(w / 0.7), 6), fence, x, 2, z, w, 4, 1, 0, ry, 0);
    for (const e of [-1, 1]) {
      const hz = -29 + e * 13;
      b.box(VC.metal, '#5a6068', 20, 1.7, hz + e * 1.2, 0.16, 3.4, 0.16);
      b.box(VC.solid, '#f4f4f0', 20, 3.35, hz + e * 0.5, 1.8, 1.1, 0.06);
      b.add(G.tor, VC.solid, 20, 3.05, hz, 0.5, 0.5, 0.5, Math.PI / 2, 0, 0, '#ff6a1a');
    }
    for (const [x, z] of [[9.5, -15], [30.5, -15], [9.5, -43], [30.5, -43]]) { b.box(VC.metal, '#5a6068', x, 4, z, 0.14, 8, 0.14); b.box(VC.glow, hdr('#f4f8ff', 2.4), x, 8.1, z, 0.9, 0.2, 0.5); }
    for (let k = 0; k < 6; k++) K.person(b, rand(12, 28), -rand(16, 42), { coat: pick(['#f4f4f0', '#c8202c', '#1f5aa8', '#f2c230']), phone: false, bag: false });
    b.sph(VC.solid, '#e86a1a', 22, 2.2, -31, 0.14, true);
    // the playground, benches and bauhinias down the far end
    for (const [x, z, c] of [[12, -56, '#e8202a'], [18, -62, '#1f5aa8'], [24, -55, '#f2c230']]) { b.block(VC.solid, c, x, 0, z, 1.6, 2.4, 1.6); b.add(G.box, VC.solid, x + 1.6, 1.2, z, 0.8, 0.1, 3.0, 0.7, Math.PI / 2, 0, '#e8e8e4'); }
    for (const z of [-66, -72]) { b.box(VC.solid, '#6a4a30', 14, 0.45, z, 2, 0.08, 0.5); K.seated(b, 14, z, { y: 0.45 }); }
    for (const [x, z] of [[8, -50], [28, -70], [8, -72]]) K.bauhinia(b, x, z, 1.0);
    // the estate's name at the gate
    b.block(VC.solid, '#e8e4dc', EDGE + 4, 0, -3, 1.0, 1.4, 9);
    b.add(G.plane, label('彩虹邨  CHOI HUNG ESTATE', { w: 1024, h: 128, color: '#ff4a8a', font: HEI, size: 0.6, k: 1.2 }), EDGE + 3.48, 0.8, -3, 8.6, 1.1, 1, 0, -Math.PI / 2, 0);
    for (const s of [-1, 1]) for (let z = 6; z < 78; z += 24) K.lamp(b, s * (EDGE + 0.62), -z, s);
    K.minibus(b, EDGE + 1.8, -70, true);
    K.crowd(b, -(EDGE + 1.0), -(EDGE + 6.6), 2, 78, 12);
    K.crowd(b, EDGE + 1.0, EDGE + 4.5, 2, 78, 8);
    return b.build();
  };

  // ---------- 6. Ngong Ping: the Big Buddha on his hill, Po Lin's hall, the cable cars ----------
  const general = (b, x, z, s, k) => {   // one of the twelve Divine Generals on his plinth, armoured, a weapon raised
    ashlar(b, x, 0, z, 1.4, 1.1, 1.4, '#c8c4b8');
    const y = 1.1, c = '#6a5a40';
    b.add(G.cyl8, bronze, x, y + 0.7, z, 0.6, 1.4, 0.5, 0, 0, 0, c);
    b.box(bronze, c, x, y + 1.75, z, 0.7, 0.8, 0.42);
    b.box(bronze, '#7a6a48', x, y + 2.25, z, 0.9, 0.2, 0.46);
    b.sph(bronze, c, x, y + 2.55, z, 0.24, true);
    b.add(G.cone8, bronze, x, y + 2.85, z, 0.34, 0.36, 0.34, 0, 0, 0, c);
    const wx = x - s * 0.45, wz = z + (k % 2 ? 0.3 : -0.3);
    beam(b, bronze, wx, y + 0.6, wz, wx, y + 3.4, wz, 0.07, '#8a7a50');
    if (k % 3 === 0) b.add(G.cone4, bronze, wx, y + 3.6, wz, 0.2, 0.5, 0.06, 0, 0, 0, '#8a7a50');
    K.pool(b, x, z, 3, 3, hdr('#ffc880', 0.44), 0.05);
  };
  const cabinGeo = (() => { const cb = new Batcher(); cb.box(VC.metal, '#3a3e44', 0, 1.6, 0, 0.1, 3.2, 0.1); cb.box(VC.solid, '#c82030', 0, -0.2, 0, 2.6, 2.4, 2.4); cb.box(VC.glow, hdr('#f0f6ff', 1.2), 0, -0.1, 0, 2.64, 1.2, 2.2); cb.box(VC.metal, '#2a2e34', 0, 3.2, 0, 0.6, 0.3, 0.3); return cb.build(); })();
  const ngongPing = () => {
    const b = new Batcher();
    // left: the Buddha's hill, the long flight of steps, the three-tiered altar
    const cx = -64, cz = -62, rx = 50, ry = 30, rz = 36, cy = -14;
    const hill = new THREE.Mesh(G.sph); hill.position.set(cx, cy, cz); hill.scale.set(rx * 2, ry * 2, rz * 2); hill.updateMatrixWorld();
    const hillY = (x, z) => surfaceY(hill, x, z, -99);
    farGround(b, -1, '#18201a');
    b.add(G.sph, VC.solid, cx, cy, cz, rx * 2, ry * 2, rz * 2, 0, 0, 0, '#22342a');
    for (let x = -16; x > -54; x -= 1.4) { const yt = Math.max(0, hillY(x, cz)), yb = Math.min(...[-0.7, 0.7].flatMap((dx) => [-3, 3].map((dz) => Math.max(0, hillY(x + dx, cz + dz))))) - 0.3; b.block(VC.solid, '#c8c4b8', x, yb, cz, 1.5, yt - yb, 6); }
    for (let x = -18; x > -54; x -= 6) { const y = Math.max(0, hillY(x, cz)); for (const e of [-1, 1]) { b.cyl(VC.metal, '#3a3e44', x, y + 1.3, cz + e * 3.4, 0.06, 2.6, 'cyl8'); b.box(VC.glow, hdr('#ffd8a0', 2.4), x, y + 2.7, cz + e * 3.4, 0.3, 0.4, 0.3); } }
    for (let k = 0; k < 40; k++) { const x = rand(-22, -110), z = -rand(10, 116), y = hillY(x, z); if (y < 1 || Math.abs(z - cz) < 8) continue; b.add(G.sphLow, VC.solid, x, y + rand(0.5, 1.5), z, rand(3, 6), rand(2.5, 4), rand(3, 6), 0, 0, 0, pick(['#1c3a22', '#22442a', '#2a4a30'])); }
    // a little pavilion at the top of the flight, lit, the devas with their offerings round it
    const SX = -58, SY = Math.max(0, hillY(SX, cz)), low = Math.min(...Array.from({ length: 8 }, (_, k) => hillY(SX + Math.cos((k / 8) * Math.PI * 2) * 6, cz + Math.sin((k / 8) * Math.PI * 2) * 6))) - 0.4;
    b.cyl(stone, '#e8e4d8', SX, (low + SY + 1) / 2, cz, 6, SY + 1 - low, 'cyl');
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.cyl(VC.solid, '#b8202a', SX + Math.cos(a) * 3, SY + 3, cz + Math.sin(a) * 3, 0.2, 4, 'cyl8'); }
    roof(b, goldTile, SX, SY + 5, cz, 7, 7, 2.2, { hip: true, eave: 0.9, ridge: '#a87a12' });
    b.box(VC.glow, hdr('#ffc070', 1.0), SX, SY + 2.5, cz, 4.4, 2.6, 4.4);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.5, px = SX + Math.cos(a) * 5.2, pz = cz + Math.sin(a) * 5.2; b.add(G.cyl8, bronze, px, SY + 1.7, pz, 0.7, 1.4, 0.6, 0, 0, 0, '#9a7a40'); b.sph(bronze, '#9a7a40', px, SY + 2.7, pz, 0.3, true); }
    for (let z = 4; z < 78; z += 26) K.lamp(b, -(EDGE + 0.62), -z, -1);
    // the path: the gate of the monastery, the Divine Generals in two lines, lanterns
    for (const e of [-1, 1]) {
      ashlar(b, e * (EDGE + 0.9), 0, -2, 0.9, 13, 0.9, '#d8d4c8'); ashlar(b, e * (EDGE + 6), 0, -2, 0.9, 9, 0.9, '#d8d4c8');
      ashlar(b, e * (EDGE + 3.45), 8.6, -2, 4.2, 0.8, 0.8, '#d8d4c8');
      roof(b, goldTile, e * (EDGE + 3.45), 9.4, -2, 5.6, 1.6, 1.0, { hip: true, eave: 0.7, ridge: '#a87a12' });
    }
    ashlar(b, 0, 13, -2, 2 * EDGE + 3.6, 1.2, 1.0, '#d8d4c8');
    roof(b, goldTile, 0, 14.2, -2, 2 * EDGE + 4.6, 1.8, 1.4, { hip: true, eave: 0.8, ridge: '#a87a12' });
    b.add(G.plane, label('寶蓮禪寺', { w: 512, h: 160, color: '#3a2a10', font: KAI, weight: 700, size: 0.72, bg: '#e8c868', k: 1.0 }), 0, 12.2, -1.45, 3.4, 1.05, 1);
    for (let k = 0; k < 12; k++) { const s = k % 2 ? 1 : -1; general(b, s * (EDGE + 2.6), -(8 + Math.floor(k / 2) * 5), s, k); }
    // right: Po Lin's great hall on its terrace, the incense burner before it
    farGround(b, 1, '#18201a');
    const HX = 32, HZ = -50, HW = 28, HD = 18;
    ashlar(b, HX, 0, HZ, HD + 6, 2.2, HW + 6, '#d8d4c8');
    b.block(VC.solid, '#8a2a22', HX, 2.2, HZ, HD - 2, 8, HW - 2);
    b.box(VC.glow, hdr('#ffc070', 0.9), HX - HD / 2 + 0.95, 5.6, HZ, 0.04, 6, HW - 6);
    for (let k = 0; k <= 9; k++) b.cyl(VC.solid, '#b8202a', HX - HD / 2 + 0.6, 6.2, HZ - HW / 2 + 1 + (k * (HW - 2)) / 9, 0.32, 8, 'cyl8');
    roof(b, goldTile, HX, 10.2, HZ, HW + 1, HD + 1, 2.2, { ry: Math.PI / 2, eave: 1.4, ridge: '#a87a12' });
    b.block(VC.solid, '#8a2a22', HX, 12.6, HZ, HD - 6, 2.2, HW - 6);
    roof(b, goldTile, HX, 14.8, HZ, HW - 4, HD - 4, 4.2, { ry: Math.PI / 2, eave: 1.4, lift: 0.6, ridge: '#a87a12' });
    b.cyl(bronze, '#6a5030', 16, 1.2, HZ, 1.3, 2.4, 'cyl8');   // the incense burner
    b.add(G.cone8, bronze, 16, 3.0, HZ, 2.2, 1.2, 2.2, 0, 0, 0, '#6a5030');
    b.box(VC.glow, hdr('#ff8a3a', 1.6), 16, 2.0, HZ, 1.0, 0.3, 1.0);
    for (let z = 8; z < 78; z += 8) K.lantern(b, EDGE + 7.4, 3.2, -z, 0.4);
    K.crowd(b, EDGE + 1.0, EDGE + 7, 4, 78, 10);
    K.crowd(b, -(EDGE + 1.0), -(EDGE + 5), 4, 40, 8);
    // the mountains of Lantau behind
    for (const [x, z, w, h] of [[-150, -160, 180, 140], [110, -180, 220, 170], [-40, -260, 260, 200], [200, -60, 140, 110]]) b.add(G.sphLow, VC.solid, x, -20, z, w, h, w * 0.8, 0, 0, 0, '#141c1a');
    const g = b.build();
    // the cable car: two pylons, the cables high over the path, glass cabins gliding along them
    const cb = new Batcher(), A = new THREE.Vector3(70, 34, 0), B = new THREE.Vector3(-110, 46, -110);
    for (const p of [A, B]) { for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) beam(cb, VC.metal, p.x + dx * 1.6, -2, p.z + dz * 1.6, p.x + dx * 0.4, p.y, p.z + dz * 0.4, 0.3, '#8a9098'); cb.box(VC.metal, '#6a7078', p.x, p.y + 0.5, p.z, 6, 1, 2); cb.sph(VC.glow, hdr('#ff2a2a', 4), p.x, p.y + 1.4, p.z, 0.3, true); }
    for (const e of [-1, 1]) wire(cb, A.x, A.y + 0.4, A.z + e * 1.2, B.x, B.y + 0.4, B.z + e * 1.2, 6, { color: '#2a2e34', t: 0.08, n: 18 });
    g.add(cb.build());
    for (let k = 0; k < 10; k++) { const m = cabinGeo.clone(); g.add(m); cabins.push({ m, A, B, k, n: 10 }); }
    return g;
  };

  const D = hkDistricts(K);
  return {
    // in the order they come up along the run (key: how hongkong.js finds the ones the horizon changes for)
    landmarks: [
      { key: 'tst', name: '维多利亚港 · 尖沙咀钟楼', en: 'VICTORIA HARBOUR · TSIM SHA TSUI', build: tst },
      { key: 'temple', name: '庙街夜市', en: 'TEMPLE STREET NIGHT MARKET', build: temple },
      { key: 'central', name: '中环 · 汇丰总行 · 中银大厦', en: 'CENTRAL', build: central },
      { key: 'escalator', name: '中环 · 半山扶梯', en: 'CENTRAL–MID-LEVELS ESCALATOR', build: D.escalator },
      { key: 'peak', name: '太平山顶 · 凌霄阁', en: 'VICTORIA PEAK', build: peak },
      { key: 'square', name: '湾仔 · 金紫荆广场', en: 'GOLDEN BAUHINIA SQUARE', build: square },
      { key: 'valley', name: '跑马地马场', en: 'HAPPY VALLEY RACECOURSE', build: D.happyValley },
      { key: 'cwb', name: '铜锣湾 · 崇光十字路口', en: 'CAUSEWAY BAY', build: D.causewayBay },
      { key: 'monster', name: '鲗鱼涌 · 益昌大厦', en: 'QUARRY BAY · THE MONSTER BUILDING', build: D.monster },
      { key: 'choiHung', name: '彩虹邨', en: 'CHOI HUNG ESTATE', build: choiHung },
      { key: 'ngongPing', name: '昂坪 · 天坛大佛', en: 'NGONG PING · TIAN TAN BUDDHA', build: ngongPing },
    ],
    // kT fades Central's Bank of China Tower in while the horizon's fades out (see hongkong.js)
    update(t, kT = 1, cams) {
      D.update(t, cams);
      bocGlass.opacity = bocLine.opacity = kT; bocGlass.visible = bocLine.visible = kT > 0.01;
      for (const c of cabins) { const f = (t * 0.012 + c.k / c.n) % 1; c.m.position.lerpVectors(c.A, c.B, f); c.m.position.y += 0.4 - 3.2 - 24 * f * (1 - f); }
    },
  };
}
