// Taipei landmark scenes on a rainy night: Bangka's Longshan Temple, its waterfall and the bronze dragon columns, the
// incense smoke over the lanterns; Xinyi at the foot of Taipei 101, the mall, the skywalks; Ximending's rainbow
// crossroads, its pedestrian streets, their billboards and the octagonal Red House; the Presidential Office's red brick
// and white bands on Chongqing South Road, Ketagalan Boulevard out to the East Gate; Liberty Square's white gate with
// the National Theater and Concert Hall either side; Raohe Street's gate beside Ciyou Temple's tower and its hawkers;
// Dihua Street's baroque shophouses and the City God's little temple; and Beitou, the Thermal Valley steaming beside
// the Hot Spring Museum and the wooden library in the park.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, planeUV, buildingGeo, rand, randi, pick, chance } from '../core.js';
import { EDGE, farGround } from './common.js';
import { beam, wire } from './tokyo_kit.js';
import { roofGeo } from './beijing_kit.js';
import { HEI, MING, KAI, X0, BAY, FH, STREET, MARKET_SHOPS } from './taipei_kit.js';
import { puffs } from './taipei_towers.js';

const DRAGON = ['#2a9a5a', '#3ab86a', '#e8c040', '#1a6ab8', '#e84a2a', '#f4f4f0', '#2ab8b8'];
const HEX = new THREE.ConeGeometry(1, 1, 6), ICO = new THREE.IcosahedronGeometry(0.5, 0);

export function tpLandmarks(K) {
  const smokes = [];   // incense smoke and steam, run every frame
  // the temples' roofs, lit from below by their floodlights
  const roofLit = std({ map: K.roofTile.map, vertexColors: true, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide, emissive: '#ffb060', emissiveMap: K.roofTile.map, emissiveIntensity: 0.46 });
  const brick = std({ map: canvasTex(128, 128, (g, w, h) => {   // red brick in English bond, the mortar pale
    g.fillStyle = '#d8d0c4'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) for (let x = (y / 8) % 2 ? 0 : 8, k = 0; x < w; x += 16, k++) { const v = randi(-18, 18); g.fillStyle = `rgb(${176 + v},${70 + v / 2},${52 + v / 2})`; g.fillRect(x + 1, y + 1, 14, 6); }
  }), vertexColors: true, roughness: 0.8 });
  const smoke = (b, pts, opts) => { const m = puffs(pts, { size: 0.5, grow: 2.2, rise: 5, drift: 0.8, life: 5.5, n: 7, color: '#cfc8c0', opacity: 0.22, ...opts }); smokes.push(m); return m; };
  const sign = (text, opts) => K.label(text, opts);

  // a temple roof in the southern style: curved slopes, the ridge sweeping up into swallowtails at both ends, cut-porcelain
  // dragons along it facing the pagoda at its centre. Length along local x (turned by ry), y on the eave line.
  const rcache = new Map();
  const templeRoof = (b, x, y, z, w, d, h, { ry = Math.PI / 2, col = '#d8682a', ridge = '#b83a2a', lift = 0.8, eave = 0.9, figures = true, swallow = 1.5, lit = true } = {}) => {
    const key = [w, d, h, lift, eave].join('|');
    if (!rcache.has(key)) rcache.set(key, roofGeo(w, d, h, { hip: false, lift, eave, tile: 0.6 }));
    const { roof, gable } = rcache.get(key), m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
    b.addM(roof, lit ? roofLit : K.roofTile, m, col);
    if (gable) b.addM(gable, VC.solid, m, '#c8bca8');
    const c = Math.cos(ry), sn = Math.sin(ry), P = (lx, ly, lz) => [x + lx * c + lz * sn, y + ly, z - lx * sn + lz * c];
    const W = w / 2 + eave * 0.7, yr = h + 0.28;
    beam(b, VC.solid, ...P(-W + 0.4, yr, 0), ...P(W - 0.4, yr, 0), 0.55, ridge);
    beam(b, VC.glow, ...P(-W + 0.6, yr + 0.05, 0.29), ...P(W - 0.6, yr + 0.05, 0.29), 0.12, hdr('#ffd070', 0.8));
    for (const e of [-1, 1]) {
      const a = P(e * (W - 0.5), yr, 0), m2 = P(e * (W + 0.5), yr + swallow * 0.45, 0);
      beam(b, VC.solid, ...a, ...m2, 0.42, ridge);
      for (const f of [-1, 1]) beam(b, VC.solid, ...m2, ...P(e * (W + 1.3), yr + swallow, f * 0.28), 0.26, ridge);   // the swallowtail's two prongs
    }
    if (figures) {
      for (const e of [-1, 1]) for (let k = 0; k < 10; k++) {   // two dragons coiling along the ridge toward the middle
        const t = k / 9, lx = e * (0.9 + t * (W - 2.2)), ly = yr + 0.55 + Math.sin(t * Math.PI * 2.2) * 0.32;
        b.add(G.sph, VC.solid, ...P(lx, ly, 0), 0.55 - t * 0.22, 0.42 - t * 0.14, 0.42, 0, 0, 0, pick(DRAGON));
      }
      b.add(G.cone8, VC.solid, ...P(0, yr + 1.0, 0), 0.7, 1.5, 0.7, 0, 0, 0, '#e8c040');   // the pagoda between them
      b.add(G.sph, VC.glow, ...P(0, yr + 1.95, 0), 0.42, 0.42, 0.42, 0, 0, 0, hdr('#ffd060', 1.6));
    }
  };
  const hexRoof = (b, x, y, z, r, h, col = '#d8682a') => {   // a hexagonal pavilion roof with a gilded finial
    b.add(HEX, roofLit, x, y + h / 2, z, r, h, r, 0, Math.PI / 6, 0, col);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; beam(b, VC.solid, x + Math.cos(a) * r * 0.95, y + 0.05, z + Math.sin(a) * r * 0.95, x + Math.cos(a) * r * 1.12, y + 0.75, z + Math.sin(a) * r * 1.12, 0.18, '#b83a2a'); }
  };
  const kerb = (b, s, { lamps = true, scoot = true } = {}) => {
    if (lamps) for (let z = rand(6, 12); z < 78; z += rand(22, 28)) K.lamp(b, s * (EDGE + 0.5), -z, s);
    if (scoot) K.scooters(b, s, 2, 78, EDGE + 1.6, { gap: 0.4 });
  };

  // ---------- 0. Longshan Temple, Bangka ----------
  const longshan = () => {
    const b = new Batcher();
    farGround(b, -1, '#14161c'); farGround(b, 1, '#14161c');
    K.row(b, -1, 0, 80, { shops: { herbal: 16, dried: 8, teashop: 6, shutter: 8, noodles: 6, tea: 4, gold: 3, conv: 3 }, floors: [2, 4], vsigns: 0.6 });   // old Bangka across the street
    kerb(b, -1);
    for (let z = rand(6, 12); z < 78; z += rand(22, 28)) K.lamp(b, EDGE + 0.5, -z, 1);
    b.add(G.plane, K.paveMat, EDGE + 13, 0.05, -40, 18.6, 80, 1, -Math.PI / 2, 0, 0);   // the temple's forecourt
    // the waterfall: a wall of rock, the water's white sheets lit from below, the koi pond at its foot
    for (let k = 0; k < 14; k++) b.add(G.box, VC.solid, rand(16.5, 22), rand(0.5, 6.5), -rand(4, 18), rand(2, 4), rand(1.5, 3.5), rand(2, 4), rand(-0.3, 0.3), rand(0, 3), rand(-0.3, 0.3), pick(['#3a3c3a', '#4a4a46', '#2e302e']));
    for (const [z, w, h] of [[-6.5, 1.6, 5.6], [-9.6, 2.4, 6.2], [-13.2, 1.8, 5.2], [-16, 1.2, 4.4]]) b.add(G.plane, K.fallMat, 15.9, h / 2 + 0.4, z, w, h, 1, 0, -Math.PI / 2, 0);   // the falls pouring between the rocks
    K.pool(b, 14.8, -11, 3, 12, hdr('#e8f8ff', 0.25), 0.4);
    b.add(G.plane, K.water, 12.6, 0.32, -11, 5, 14, 1, -Math.PI / 2, 0, 0);
    b.block(VC.solid, '#a8a49a', 10.1, 0, -11, 0.4, 0.5, 14.4);
    for (let k = 0; k < 9; k++) b.box(VC.glow, hdr(pick(['#ff7a1a', '#ffffff', '#ff4a1a']), 1.2), rand(10.8, 14.6), 0.34, -rand(5, 17), 0.3, 0.02, 0.12);
    K.pool(b, 13, -11, 8, 15, hdr('#9ad8ff', 0.1));
    // the front hall (三川殿): the stone porch, the bronze dragon columns, painted doors, the plaque, three raised roofs
    const FX = 22, ZC = -43;
    b.block(VC.solid, '#c8c4b8', FX + 6, 0, ZC, 14, 0.6, 40);
    b.block(VC.solid, '#a8a094', FX + 8, 0.6, ZC, 12, 1.6, 38);
    b.block(VC.glow, hdr('#c88a48', 0.78), FX + 8, 2.2, ZC, 12, 4.4, 38);   // the upper walls, washed gold by the floodlights
    for (const [dz, w, h, main] of [[0, 4.2, 4.4, true], [-8.5, 3.2, 3.8], [8.5, 3.2, 3.8], [-15, 2.4, 3.2], [15, 2.4, 3.2]]) {   // the doors with their door gods
      b.box(VC.solid, '#a81818', FX + 1.98, 0.6 + h / 2, ZC + dz, 0.06, h, w);
      b.box(VC.glow, hdr('#ffc070', 0.9), FX + 1.94, 0.6 + h / 2, ZC + dz, 0.03, h - 0.2, 0.08);
      for (const e of [-1, 1]) { b.box(VC.solid, pick(['#e8c040', '#2a6ab8', '#c8202a']), FX + 1.93, 0.6 + h * 0.55, ZC + dz + e * w / 4, 0.03, h * 0.5, w * 0.3); b.sph(VC.solid, '#f4dcc8', FX + 1.92, 0.6 + h * 0.78, ZC + dz + e * w / 4, 0.25, true); }
      if (main) b.add(G.plane, sign('龍山寺', { w: 512, h: 170, color: '#ffd878', font: KAI, weight: 400, size: 0.74, bg: '#14243a', border: '#d8a830', k: 1.4 }), FX + 1.9, 5.65, ZC, 3.4, 1.15, 1, 0, -Math.PI / 2, 0);
    }
    b.box(VC.solid, '#1a4a8a', FX + 0.6, 6.4, ZC, 1.0, 0.6, 39);   // the painted beams under the eaves
    b.box(VC.glow, hdr('#ffc860', 0.9), FX + 0.08, 6.4, ZC, 0.04, 0.2, 38);
    for (const dz of [-4, 4]) {   // the bronze dragon columns, a dragon climbing each
      b.cyl(VC.metal, '#4a3a22', FX, 3.6, ZC + dz, 0.42, 6, 'cyl8');
      for (let k = 0; k < 18; k++) { const a = k * 0.9, y = 1.2 + k * 0.27; b.sph(VC.metal, k % 4 ? '#8a6a3a' : '#d8a840', FX + Math.cos(a) * 0.52, y, ZC + dz + Math.sin(a) * 0.52, 0.2, true); }
    }
    for (const dz of [-11, 11, -17.5, 17.5]) b.cyl(VC.solid, '#b8b4a8', FX, 3.6, ZC + dz, 0.38, 6, 'cyl8');
    for (const dz of [-11, 11]) b.add(G.plane, sign(dz < 0 ? '龍山古剎千秋在' : '艋舺香火萬古傳', { w: 96, h: 512, color: '#ffe08a', font: KAI, weight: 400, size: 0.72, bg: '#a81818', vertical: true, k: 1.1 }), FX - 0.4, 3.6, ZC + dz, 0.5, 4.2, 1, 0, -Math.PI / 2, 0);
    for (let z = ZC - 18; z <= ZC + 18; z += 2.4) K.lantern(b, FX - 0.5, 5.4, z, 0.3, z % 4.8 ? '#e8202a' : '#ffb020');
    templeRoof(b, FX + 7, 8.1, ZC, 14, 16, 4.0);
    b.box(VC.solid, '#d8a040', FX + 7, 7.4, ZC, 15, 1.4, 14);
    for (const e of [-1, 1]) templeRoof(b, FX + 7, 6.7, ZC + e * 13.4, 12.4, 16, 3.3, { swallow: 1.2 });
    // the bell and drum towers with their sedan-chair roofs
    for (const z of [-20, -66]) {
      b.block(VC.solid, '#c8c4b8', FX + 10, 0, z, 7, 0.6, 7);
      b.block(VC.solid, '#a8402a', FX + 10, 0.6, z, 5.6, 8.4, 5.6);
      b.box(VC.glow, hdr('#b8683a', 0.6), FX + 7.18, 4.8, z, 0.02, 8.0, 5.4);   // its face to the court, floodlit
      for (const e of [-1, 1]) b.box(VC.glow, hdr('#ffc070', 1.0), FX + 7.15, 5.8, z + e * 1.4, 0.04, 1.6, 0.8);
      hexRoof(b, FX + 10, 9.0, z, 5.4, 2.6); b.cyl(VC.solid, '#a8402a', FX + 10, 12.2, z, 2.2, 1.8, 'cyl8'); hexRoof(b, FX + 10, 13.0, z, 3.8, 2.4);
      b.sph(VC.glow, hdr('#ffd060', 1.6), FX + 10, 15.7, z, 0.35, true);
    }
    // the main hall rising behind, its double roof over the front hall's ridges
    b.block(VC.solid, '#8a5a3a', FX + 26, 0.6, ZC, 14, 9, 26);
    templeRoof(b, FX + 26, 9.6, ZC, 26, 16, 4.6, { swallow: 1.8 });
    templeRoof(b, FX + 26, 7.2, ZC, 30, 20, 1.6, { figures: false, swallow: 0.6 });
    // the censer in the court, its smoke, the faithful with their incense
    b.cyl(VC.metal, '#6a5030', FX - 6, 0.9, ZC, 1.2, 1.4, 'cyl8'); b.cyl(VC.metal, '#8a6a3a', FX - 6, 1.75, ZC, 1.4, 0.3, 'cyl8');
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; b.cyl(VC.metal, '#5a4020', FX - 6 + Math.cos(a) * 0.9, 0.3, ZC + Math.sin(a) * 0.9, 0.12, 0.6, 'cyl6'); }
    b.box(VC.glow, hdr('#ff7a2a', 1.8), FX - 6, 1.95, ZC, 1.4, 0.06, 1.4);
    K.pool(b, FX - 6, ZC, 6, 6, hdr('#ff9a4a', 0.14));
    K.crowd(b, 7, FX - 2, 22, 64, 26, { umbrellaP: 0.5 });
    for (let k = 0; k < 14; k++) b.box(VC.glow, hdr('#ff6a1a', 2.6), rand(8, FX - 2), 1.35, -rand(26, 60), 0.05, 0.05, 0.05);   // the incense sticks' glowing tips
    for (const z of [-26, -34, -52, -60]) wire(b, FX - 0.5, 5.6, z, EDGE + 1.0, 5.0, z, 0.4, { color: '#1a1a1e', n: 6 });   // strings of lanterns out over the court
    for (const z of [-26, -34, -52, -60]) for (let k = 1; k < 7; k++) K.lantern(b, FX - 0.5 - k * ((FX - 0.5 - EDGE - 1) / 7), 5.0 - Math.sin((k / 7) * Math.PI) * 0.35, z, 0.26, k % 2 ? '#ffb020' : '#e8202a');
    K.pool(b, FX - 4, ZC, 14, 40, hdr('#ffb060', 0.1));   // the court in the temple's glow
    K.mrt(b, EDGE + 6, -74, 1, '捷運 龍山寺站');
    const g = b.build();
    g.add(smoke(b, [[FX - 6, 2.1, ZC], [FX - 5.6, 2.1, ZC + 0.4]], { n: 9, size: 0.6, rise: 6, opacity: 0.2 }));
    return g;
  };

  // ---------- 1. Taipei 101 and Xinyi ----------
  const xinyi = () => {
    const b = new Batcher();
    farGround(b, -1, '#121418'); farGround(b, 1, '#121418');
    b.add(G.plane, K.paveMat, -(EDGE + 42), 0.06, -40, 84, 80, 1, -Math.PI / 2, 0, 0);   // the plaza at the tower's foot
    // the tower's mall: glass and screens, the canopy, its name, the ruyi medallion over the doors
    b.block(VC.solid, '#22262e', -36, 0, -34, 22, 26, 34);
    b.cyl(VC.metal, hdr('#ffd060', 0.9), -24.6, 15, -34, 3.4, 0.5, 'cyl', 0, Math.PI / 2);
    b.cyl(VC.glow, hdr('#3a7a74', 1.2), -24.3, 15, -34, 1.4, 0.5, 'cyl', 0, Math.PI / 2);
    b.add(K.tiled(4), K.lobbyMat, -24.96, 4.0, -34, 32, 7.6, 1, 0, Math.PI / 2, 0, hdr('#ffffff', 1.05));
    b.box(VC.solid, '#5a6070', -24.0, 8.2, -34, 2.2, 0.3, 30);
    b.box(VC.glow, hdr('#fff4e0', 0.9), -24.0, 8.04, -34, 1.8, 0.03, 28);
    K.led(b, { side: -1, face: -25, z: -34, len: 22, h: 10 });
    b.add(G.plane, sign('台北101', { w: 512, h: 128, color: '#ffffff', font: HEI, size: 0.7, glow: '#7affe0', k: 1.6 }), -24.9, 21.5, -24, 8, 2, 1, 0, Math.PI / 2, 0);
    for (const z of [-8, -62, -72]) K.luan(b, -(EDGE + 3.2), z, rand(0.9, 1.05));
    K.mrt(b, -(EDGE + 6.5), -12, -1, '捷運 台北101/世貿站');
    for (let z = 6; z < 78; z += 24) K.lamp(b, -(EDGE + 0.5), -z, -1);
    K.crowd(b, -(EDGE + 1.0), -(EDGE + 20), 2, 78, 26, { umbrellaP: 0.6 });
    // across the road: the department stores, their screens, the skywalk along the front and over the road
    K.towerRow(b, 1, 0, 80, { x0: EDGE + 10.4 });
    b.add(G.plane, K.paveMat, EDGE + 5.4, 0.1, -40, 10.2, 80, 1, -Math.PI / 2, 0, 0);
    K.skywalk(b, 1, 0, 80, { x: EDGE + 5.6 });
    for (const z of [-30, -66]) K.skybridge(b, z, { W: EDGE + 6 });
    for (let z = 10; z < 78; z += 16) K.luan(b, EDGE + 8.6, -z, rand(0.85, 1.0));
    for (let z = 4; z < 78; z += 24) K.lamp(b, EDGE + 0.5, -z, 1);
    K.crowd(b, EDGE + 1.0, EDGE + 9.6, 2, 78, 22, { umbrellaP: 0.6 });
    K.taxi(b, EDGE + 1.6, -20); K.taxi(b, -(EDGE + 1.6), -46);
    return b.build();
  };

  // ---------- 2. Ximending and the Red House ----------
  const posters = (() => {   // the pedestrian streets' great banners: films, idols, sales
    const P = [['全台首映', '#1a0a3a', '#ff3df0', '#ffe23d'], ['巨星演唱會', '#0a2a5a', '#3dd6ff', '#ffffff'], ['暑假強檔', '#3a0a0a', '#ff6a1a', '#ffe23d'], ['動畫電影', '#ff8ab8', '#ffffff', '#3a1a4a'],
      ['人氣偶像', '#141414', '#ffd23d', '#ffffff'], ['限時特賣', '#d8202a', '#ffffff', '#ffe23d'], ['聯名新品', '#f4f4f0', '#1a5ad8', '#141414'], ['週末限定', '#2a8a5a', '#ffffff', '#ffe23d']];
    const cw = 128, ch = 256, tex = canvasTex(cw * P.length, ch, (g) => P.forEach(([t, bg, c1, c2], i) => {
      const x0 = i * cw, gr = g.createLinearGradient(x0, 0, x0, ch); gr.addColorStop(0, bg); gr.addColorStop(1, '#0a0a10'); g.fillStyle = gr; g.fillRect(x0, 0, cw, ch);
      g.fillStyle = c1; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(x0 + cw / 2, ch * 0.42, cw * 0.32, ch * 0.24, 0, 0, 7); g.fill(); g.globalAlpha = 1;
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.arc(x0 + cw / 2, ch * 0.34, cw * 0.12, 0, 7); g.fill(); g.fillRect(x0 + cw * 0.3, ch * 0.42, cw * 0.4, ch * 0.22);
      g.fillStyle = c2; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `900 ${Math.floor(cw * 0.22)}px ${HEI}`; g.fillText(t, x0 + cw / 2, ch * 0.8, cw * 0.9);
      g.fillStyle = c1; g.fillRect(x0 + cw * 0.2, ch * 0.88, cw * 0.6, 3);
    }), { repeat: false });
    const geos = P.map((_, i) => { const geo = new THREE.PlaneGeometry(1, 1), uv = geo.attributes.uv; for (let k = 0; k < 4; k++) uv.setX(k, (i + uv.getX(k)) / P.length); return geo; });
    return { mat: basic({ map: tex, vertexColors: true, color: hdr('#ffffff', 1.0) }), geos };
  })();
  const poster = (b, x, y, z, s, w, h) => b.add(pick(posters.geos), posters.mat, x, y, z, w, h, 1, 0, -s * Math.PI / 2, 0, hdr('#ffffff', rand(0.85, 1.1)));
  const ximen = () => {
    const b = new Batcher();
    farGround(b, -1, '#121418'); farGround(b, 1, '#121418');
    // the crossroads at the pedestrian zone's mouth, Hanzhong Street (the track) over Chengdu Road, every crossing painted
    // in the rainbow: two over the track, one over each arm of the side street. Chengdu Road's scooters wait at the line,
    // headlights on, while people cross in front of them
    const ZA = -6, ZB = -24, S0 = -8, S1 = -22;   // the crossings over the track; the side street's kerbs
    for (const z of [ZA, ZB]) K.crossing(b, 0, z, 2 * X0, 4, { colors: K.RAINBOW });
    for (const s of [-1, 1]) {
      b.add(G.plane, VC.solid, s * (EDGE + 7 + 22), 0.03, (S0 + S1) / 2, 44, S0 - S1, 1, -Math.PI / 2, 0, 0, '#25272b');
      b.add(G.plane, K.paveMat, s * (X0 + 22), 0.05, (S0 + ZA + 2) / 2, 44, ZA + 2 - S0, 1, -Math.PI / 2, 0, 0);   // the corners' pavements
      b.add(G.plane, K.paveMat, s * (X0 + 22), 0.05, (S1 + ZB - 2) / 2, 44, S1 - ZB + 2, 1, -Math.PI / 2, 0, 0);
      K.crossing(b, s * (X0 + 2.6), (S0 + S1) / 2, S0 - S1 - 1, 4, { dir: 'z', colors: K.RAINBOW });
      const inz = s < 0 ? [S0, (S0 + S1) / 2] : [(S0 + S1) / 2, S1];   // the half of Chengdu Road coming in toward the crossing
      K.paint(b, s * (X0 + 5.1), (inz[0] + inz[1]) / 2, 0.35, inz[0] - inz[1] - 0.4);   // the stop line
      for (const z of [-14.85, -15.15]) K.paint(b, s * (X0 + 5.2 + 19), z, 38, 0.14, hdr('#e8b830', 0.55));
      for (let x = X0 + 6; x < 50; x += 6) for (const z of [-11.5, -18.5]) K.paint(b, s * (x + 1.5), z, 3, 0.15);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) K.scooter(b, s * (X0 + 6.0 + r * 1.8 + rand(-0.2, 0.2)), inz[0] - 1.2 - c * 2.2 + rand(-0.25, 0.25), s * Math.PI / 2 + rand(-0.1, 0.1), undefined, { rider: true, lit: true });
      for (let k = 0; k < 6; k++) K.person(b, s * (X0 + rand(1, 4.2)), rand(S1 + 0.8, S0 - 0.8), { umbrella: chance(0.55), phone: chance(0.4) });   // crossing Chengdu Road
      for (const z of [rand(-1.5, -3.6), rand(-26.4, -28)]) K.crowd(b, s * (EDGE + 0.4), s * (X0 - 0.3), -z - 1, -z + 1, randi(3, 5), { umbrellaP: 0.6 });   // waiting to cross the track
      K.signal(b, s * (EDGE + 0.6), -3.2, s, 2);
    }
    K.streetSign(b, EDGE + 0.6, -1.5, STREET.chengdu);
    K.streetSign(b, -(EDGE + 0.6), -27, STREET.hanzhong);
    // the gantry over the pedestrian zone's mouth, just past the crossing
    const GZ = -29, GY = 12.2;   // (its beam clear of the jetpack's flight)
    for (const e of [-1, 1]) b.box(VC.metal, '#3a3e46', e * (EDGE + 1.0), (GY + 0.9) / 2, GZ, 0.4, GY + 0.9, 0.4);
    b.box(VC.metal, '#1a1c22', 0, GY, GZ, 2 * EDGE + 2.8, 1.8, 0.5);
    b.add(G.plane, sign('西門町 · 徒步區', { w: 1024, h: 160, color: '#ffffff', font: HEI, size: 0.66, glow: '#ff3df0', k: 1.6 }), 0, GY + 0.25, GZ + 0.28, 2 * EDGE + 2.2, 1.1, 1);
    b.add(G.plane, sign('XIMENDING', { w: 512, h: 64, color: '#7affff', font: HEI, size: 0.8, k: 1.5 }), 0, GY - 0.6, GZ + 0.28, 4.2, 0.5, 1);
    // the pedestrian street's blocks: tall, banners and screens all over them; the corner block's end wall faces the crossing
    K.row(b, -1, 0, 4.4, { floors: [6, 9], shops: { tea: 4, conv: 3, claw: 3 }, vsigns: 1.2 });
    K.row(b, -1, 26, 80, { floors: [6, 10], tall: 0.4, shops: { tea: 12, claw: 10, phone: 8, eyewear: 6, dessert: 8, fried: 8, conv: 6, cafe: 4, shutter: 3 }, vsigns: 1.6, marquee: 0.6 });
    for (let z = 30; z < 76; z += rand(9, 14)) poster(b, -(X0 - 0.06), rand(8, 14), -z, -1, rand(3, 4.4), rand(7, 10));
    for (const [x, w, h, y] of [[-(X0 + 5.2), 5.2, 9, 12], [-(X0 + 10.6), 4.2, 7, 9.5]]) b.add(pick(posters.geos), posters.mat, x, y, -25.92, w, h, 1, 0, 0, 0, hdr('#ffffff', rand(0.9, 1.05)));
    for (const y of [6.6, 11.4]) b.add(planeUV(K.vRects[randi(0, K.V_SIGNS.length - 1)]), K.vMat, -(X0 + 0.8), y, -25.9, 1.1, 4.4, 1, 0, 0, 0, hdr('#ffffff', rand(0.9, 1.05)));
    b.add(G.plane, sign('萬年大樓', { w: 128, h: 512, color: '#ffe23d', font: HEI, size: 0.8, vertical: true, glow: '#ff9a2a', bg: '#141418', k: 1.5 }), -(X0 + 0.6), 13, -46.5, 1.6, 7, 1, 0, 0, 0);
    // Chengdu Road's blocks out beyond the corners, lit, signs on the ones facing the crossing
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
      const x = s * (33 + k * 18);
      for (const [z0, z1] of [[-0.6, -7.4], [-22.6, -36.6]]) {
        if (s > 0 && k === 0 && z0 < -20) continue;   // the Red House's cross hall stands there
        const T = pick(K.apts), h = rand(14, 24);
        b.addM(buildingGeo(16, h, z0 - z1, T.tex, BAY, FH), T.mat, new THREE.Matrix4().makeTranslation(x, 0, (z0 + z1) / 2), pick(['#c8b49a', '#b8b0a4', '#d0d0c8']));
        if (z0 < -20) b.add(planeUV(K.vRects[randi(0, K.V_SIGNS.length - 1)]), K.vMat, x - s * rand(2, 5), h * 0.5, z0 + 0.05, 1.2, 4.8, 1, 0, 0, 0);
      }
    }
    // the Red House: an octagon of red brick banded in white, arched windows, the lantern on its roof; the cross hall behind
    const RX = 19, RZ = -40, R = 8.5;
    b.add(new THREE.CylinderGeometry(R, R, 9.6, 8).translate(0, 4.8, 0), brick, RX, 0, RZ, 1, 1, 1, 0, Math.PI / 8, 0, '#ffffff');
    for (const y of [0.4, 4.8, 9.4]) b.add(G.cyl8, VC.solid, RX, y, RZ, 2 * R * 1.03, 0.4, 2 * R * 1.03, 0, Math.PI / 8, 0, '#efe8dc');
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + (k / 8) * Math.PI * 2 + Math.PI / 8, nx = Math.sin(a), nz = Math.cos(a), ap = R * Math.cos(Math.PI / 8) + 0.03;
      for (const y of [2.6, 7.1]) b.add(G.box, VC.glow, RX + nx * ap, y, RZ + nz * ap, 1.4, 2.4, 0.04, 0, a, 0, hdr(pick(['#ffd8a0', '#ffe8c0']), 1.0));
    }
    b.add(G.cone8, VC.solid, RX, 11.0, RZ, 2 * R + 1, 3.0, 2 * R + 1, 0, Math.PI / 8, 0, '#4a4a50');
    b.add(G.cyl8, VC.solid, RX, 12.9, RZ, 4, 1.6, 4, 0, Math.PI / 8, 0, '#efe8dc');
    b.add(G.cyl8, VC.glow, RX, 12.9, RZ, 3.4, 1.0, 3.4, 0, Math.PI / 8, 0, hdr('#ffd8a0', 1.1));
    b.add(G.cone8, VC.solid, RX, 14.4, RZ, 4.6, 1.6, 4.6, 0, Math.PI / 8, 0, '#4a4a50');
    const AP = R * Math.cos(Math.PI / 8);
    b.add(G.plane, sign('西門紅樓', { w: 512, h: 128, color: '#ffe8c0', font: MING, size: 0.66, bg: '#3a1410', k: 1.3 }), RX - AP - 0.08, 5.6, RZ, 3.6, 0.9, 1, 0, -Math.PI / 2, 0);
    b.box(VC.glow, hdr('#ffd8a0', 1.2), RX - AP - 0.03, 1.9, RZ, 0.04, 3, 2);
    b.addM(new THREE.BoxGeometry(14, 9, 24).translate(0, 4.5, 0), brick, new THREE.Matrix4().makeTranslation(RX + 15, 0, RZ), '#ffffff');
    const { roof: crossRoof } = roofGeo(24, 14, 4, { hip: false, lift: 0.1, eave: 0.6, tile: 1 });
    b.addM(crossRoof, K.roofTile, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(RX + 15, 9, RZ), '#4a4a50');
    // the square in front: the craft market's white umbrellas, a busker and the ring of people round him, the metro's exit 6
    b.add(G.plane, K.paveMat, EDGE + 7.8, 0.05, -(26 + 80) / 2, 8.4, 54, 1, -Math.PI / 2, 0, 0);
    b.add(G.plane, K.paveMat, EDGE + 7.8, 0.05, -2, 8.4, 4, 1, -Math.PI / 2, 0, 0);
    for (const [x, z] of [[10.4, -54], [8.2, -60], [10.6, -66], [8, -72], [10.4, -78]]) { b.cyl(VC.metal, '#8a8a8a', x, 1.2, z, 0.04, 2.4, 'cyl6'); b.add(G.cone8, VC.solid, x, 2.5, z, 3, 0.7, 3, 0, 0, 0, '#f4f4f0'); b.block(VC.solid, '#5a4a38', x, 0, z, 1.4, 0.8, 1.4); b.box(VC.glow, hdr('#fff0c8', 2), x, 2.1, z, 0.12, 0.12, 0.12); }
    K.person(b, 7.6, -42, { umbrella: false, coat: '#ff3d9a' }); K.pool(b, 7.6, -42, 4, 4, hdr('#ffe8c0', 0.2));
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; K.person(b, 7.6 + Math.cos(a) * 2.4, -42 + Math.sin(a) * 2.4, { umbrella: chance(0.3) }); }
    K.mrt(b, EDGE + 5.4, -30.5, 1, '捷運 西門站');
    b.box(VC.solid, '#1f5fb4', EDGE + 3.6, 5.3, -34.1, 0.34, 0.6, 0.6);
    b.add(G.plane, sign('6', { w: 128, h: 128, color: '#ffffff', font: HEI, size: 0.8, bg: '#1f5fb4', k: 1.3 }), EDGE + 3.42, 5.3, -34.1, 0.5, 0.5, 1, 0, -Math.PI / 2, 0);
    for (const z of [4, 34, 58]) K.lamp(b, EDGE + 0.5, -z, 1);
    K.lamp(b, -(EDGE + 0.5), -34, -1); K.lamp(b, -(EDGE + 0.5), -62, -1);
    K.crowd(b, -(EDGE + 0.6), -(X0 + 2.6), 28, 78, 24, { umbrellaP: 0.5 });
    K.crowd(b, EDGE + 0.6, EDGE + 12, 34, 78, 16);
    return b.build();
  };

  // ---------- 3. The Presidential Office on Chongqing South Road, Ketagalan Boulevard opposite ----------
  // its front in red brick banded with white stone, the granite plinth, arched windows on the ground and second floors and
  // pedimented ones between, the cornice with its dentils; floodlit from the ground, the light fanning up every pier.
  // One texture tile is four bays (17.6 m) by the wings' full height, so the lit windows don't repeat bay after bay.
  const WHITE = '#efe4cf', BAY4 = 17.6, PH = 18.4;
  const brickFill = (g, w, h) => {
    g.fillStyle = '#a8452e'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(60,20,10,${rand(0.06, 0.18)})`; g.fillRect(0, y, w, 1); }
    for (let i = 0; i < (w * h) / 300; i++) { g.fillStyle = `rgba(${randi(150, 205)},${randi(56, 86)},${randi(36, 56)},0.35)`; g.fillRect(rand(0, w), rand(0, h), rand(3, 7), 2); }
  };
  const archPath = (g, x, y, w, h) => { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); };
  const glass = (g, t, hpx, lit) => {
    if (lit) { const gr = g.createLinearGradient(0, t, 0, t + hpx); gr.addColorStop(0, '#ffe6b0'); gr.addColorStop(1, '#f0b460'); g.fillStyle = gr; } else g.fillStyle = '#1c2029';
    g.fill();
  };
  const wash = (g, w, h, xs, r = 0.75, a = 0.34) => {   // floodlights at the foot of the wall, their light fanning upward
    g.globalCompositeOperation = 'lighter';
    for (const x of xs) {
      const gr = g.createRadialGradient(x, h, 0, x, h, h * r);
      gr.addColorStop(0, `rgba(255,190,120,${a})`); gr.addColorStop(0.5, `rgba(255,160,90,${a * 0.35})`); gr.addColorStop(1, 'rgba(255,150,80,0)');
      g.fillStyle = gr; g.fillRect(x - h * r, 0, h * r * 2, h);
    }
    g.globalCompositeOperation = 'source-over';
  };
  const pobTex = canvasTex(512, 512, (g, w, h) => {
    const px = w / BAY4, py = h / PH, X = (m) => m * px, Y = (m) => h - m * py, H = (m0, m1) => (m1 - m0) * py;
    brickFill(g, w, h);
    const band = (m0, m1) => { g.fillStyle = WHITE; g.fillRect(0, Y(m1), w, H(m0, m1)); };
    g.fillStyle = '#b4aea2'; g.fillRect(0, Y(1.4), w, H(0, 1.4));   // the granite plinth
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, Y(0.7), w, 1); for (let x = 0; x < w; x += 24) g.fillRect(x, Y(1.4), 1, H(0, 1.4));
    for (let m = 1.9; m < 5.4; m += 0.7) band(m, m + 0.2);   // the ground floor's stripes
    band(5.6, 6.0); band(9.9, 10.25); band(14.1, 14.4); band(16.9, 18.4);   // the string courses, the cornice
    g.fillStyle = 'rgba(90,70,50,0.55)'; for (let x = 2; x < w; x += 8) g.fillRect(x, Y(17.25), 4, H(16.95, 17.25));   // its dentils
    g.fillRect(0, Y(17.85), w, 2);
    for (let i = 0; i < 4; i++) {
      const x0 = X(i * 4.4), cx = x0 + X(2.2);
      for (let m = 6.0, k = 0; m < 16.8; m += 0.55, k++) {   // the quoins up the piers between the bays
        const qw = X(k % 2 ? 0.55 : 0.36); g.fillStyle = WHITE;
        g.fillRect(x0, Y(m + 0.32), qw, H(m, m + 0.32)); g.fillRect(x0 + X(4.4) - qw, Y(m + 0.32), qw, H(m, m + 0.32));
      }
      const win = (m0, m1, ww, arch, ped) => {
        const l = cx - X(ww / 2), t = Y(m1), wpx = X(ww), hpx = H(m0, m1), lit = chance(0.3);
        g.fillStyle = WHITE;   // the stone surround, the sill, the pediment
        if (arch) archPath(g, l - X(0.16), t - X(0.16), wpx + X(0.32), hpx + X(0.16)); else { g.beginPath(); g.rect(l - X(0.14), t - X(0.14), wpx + X(0.28), hpx + X(0.14)); }
        g.fill();
        if (ped) { g.beginPath(); g.moveTo(l - X(0.32), t - X(0.2)); g.lineTo(cx, t - X(0.8)); g.lineTo(l + wpx + X(0.32), t - X(0.2)); g.closePath(); g.fill(); }
        g.fillRect(l - X(0.22), Y(m0) - 1, wpx + X(0.44), X(0.14));
        if (arch) archPath(g, l, t, wpx, hpx); else { g.beginPath(); g.rect(l, t, wpx, hpx); }
        glass(g, t, hpx, lit);
        g.fillStyle = lit ? 'rgba(120,70,30,0.7)' : 'rgba(200,190,170,0.4)';   // the frames
        g.fillRect(cx - 1, t + (arch ? wpx / 2 : 0), 2, hpx - (arch ? wpx / 2 : 0)); g.fillRect(l, t + hpx * 0.42, wpx, 2);
      };
      win(2.1, 5.0, 1.6, true, false); win(6.6, 9.2, 1.4, false, true); win(10.8, 13.6, 1.4, true, false); win(14.8, 16.3, 1.2, false, false);
    }
    wash(g, w, h, [0, 1, 2, 3, 4].map((i) => X(i * 4.4)), 0.75, 0.26);
  });
  const towerTex = canvasTex(256, 448, (g, w, h) => {   // the tower's shaft above the roofs: bands round it, quoins at the corners, tall arched windows
    const px = w / 10, py = h / 17, X = (m) => m * px, Y = (m) => h - m * py;
    brickFill(g, w, h);
    g.fillStyle = WHITE;
    for (let m = 0.6; m < 16.4; m += 1.4) g.fillRect(0, Y(m + 0.22), w, 0.22 * py);
    for (let m = 0, k = 0; m < 17; m += 0.6, k++) { const qw = X(k % 2 ? 0.9 : 0.6); g.fillRect(0, Y(m + 0.36), qw, 0.36 * py); g.fillRect(w - qw, Y(m + 0.36), qw, 0.36 * py); }
    g.fillRect(0, 0, w, 0.5 * py);
    for (const m0 of [1.6, 6.4, 11.2]) for (const cx of [X(3.5), X(6.5)]) {
      const ww = X(1.1), hh = 3.6 * py, l = cx - ww / 2, t = Y(m0 + 3.6);
      g.fillStyle = WHITE; archPath(g, l - 4, t - 4, ww + 8, hh + 6); g.fill();
      archPath(g, l, t, ww, hh); glass(g, t, hh, chance(0.35));
      g.fillStyle = 'rgba(200,190,170,0.4)'; g.fillRect(cx - 1, t + ww / 2, 2, hh - ww / 2);
    }
    wash(g, w, h, [X(0.4), X(5), X(9.6)], 0.9, 0.3);
  });
  const stageTex = canvasTex(192, 160, (g, w, h) => {   // the lantern stage on top: three arched openings a side, lit
    const px = w / 7, py = h / 5.8, X = (m) => m * px, Y = (m) => h - m * py;
    brickFill(g, w, h);
    g.fillStyle = WHITE; g.fillRect(0, Y(0.5), w, 0.5 * py); g.fillRect(0, 0, w, 0.45 * py); g.fillRect(0, 0, X(0.5), h); g.fillRect(w - X(0.5), 0, X(0.5), h);
    for (const cx of [X(1.85), X(3.5), X(5.15)]) {
      const ww = X(1.05), hh = 3.6 * py, l = cx - ww / 2, t = Y(4.5);
      g.fillStyle = WHITE; archPath(g, l - 3, t - 3, ww + 6, hh + 3); g.fill();
      archPath(g, l, t, ww, hh); glass(g, t, hh, true);
    }
    wash(g, w, h, [X(3.5)], 1.2, 0.22);
  });
  const POB = basic({ map: pobTex, vertexColors: true }), PTW = basic({ map: towerTex, vertexColors: true }), PST = basic({ map: stageTex, vertexColors: true });
  const PED = new THREE.CylinderGeometry(0.5, 0.5, 1, 3).rotateX(-Math.PI / 2).rotateY(Math.PI / 2);   // a triangular prism: a pediment facing along x
  const guard = (b, x, z) => {   // a military policeman at the gate: white helmet, white belt and gloves, standing still
    b.box(VC.solid, '#2a3428', x, 0.47, z, 0.24, 0.94, 0.34);
    b.box(VC.solid, '#3a4632', x, 1.27, z, 0.28, 0.62, 0.46);
    b.box(VC.solid, '#f4f4f0', x, 1.02, z, 0.3, 0.07, 0.48);
    for (const e of [-1, 1]) { b.box(VC.solid, '#3a4632', x, 1.2, z + e * 0.27, 0.12, 0.56, 0.1); b.box(VC.solid, '#f4f4f0', x, 0.9, z + e * 0.27, 0.12, 0.1, 0.11); }
    b.sph(VC.solid, '#e8c4a0', x, 1.72, z, 0.14, true);
    b.add(G.sphLow, VC.solid, x, 1.84, z, 0.36, 0.26, 0.36, 0, 0, 0, '#f4f4f0');
  };
  // the building, its front on x = FX facing -x and the tower on the axis z = ZT, in the materials M: the street's own,
  // or the horizon's unfogged ones for the copy seen at the end of the street on the way there
  const poBuilding = (b, M, FX, ZT, { lamps = true } = {}) => {
    // the front, bay by bay: an end pavilion, a wing, a pedimented middle pavilion, a wing, the tower, and the same again
    const SEG = [[36, 26, 2, 21.6, 'end'], [26, 19, 0, PH, 'wing'], [19, 13, 1, 19.8, 'mid'], [13, 6, 0, PH, 'wing'], [6, -6, 1.5, PH, 'tower'],
      [-6, -13, 0, PH, 'wing'], [-13, -19, 1, 19.8, 'mid'], [-19, -26, 0, PH, 'wing'], [-26, -36, 2, 21.6, 'end']];
    SEG.forEach(([a0, a1, dx, h, kind], i) => {
      const z0 = ZT + a0, z1 = ZT + a1, L = z0 - z1, zc = (z0 + z1) / 2, xf = FX - dx, D = 16 + dx;
      b.block(M.solid, '#6a2e20', xf + D / 2, 0, zc, D - 0.1, h, L - 0.05);
      b.add(K.tiled2(L / BAY4, 1), M.wall, xf - 0.02, PH / 2, zc, L, PH, 1, 0, -Math.PI / 2, 0, hdr('#ffffff', M.k));
      for (const e of [1, -1]) {   // the sides of a projecting bay, or the whole end of the building
        const out = kind === 'end' && (e > 0 ? i === 0 : i === SEG.length - 1), wd = out ? D : dx;
        if (!wd) continue;
        b.add(K.tiled2(wd / BAY4, 1), M.wall, xf + wd / 2, PH / 2, (e > 0 ? z0 : z1) + e * 0.02, wd, PH, 1, 0, e > 0 ? 0 : Math.PI, 0, hdr('#ffffff', M.k * (out ? 0.85 : 0.92)));
      }
      if (h > PH) {   // the pavilions' attic storeys above the cornice
        b.box(M.glow, hdr('#a8452e', M.k * 0.95), xf - 0.03, (PH + h) / 2, zc, 0.04, h - PH, L);
        b.box(M.glow, hdr(WHITE, M.k * 0.9), xf - 0.12, h - 0.3, zc, 0.24, 0.6, L + 0.2);
        for (let k = 0; k < Math.floor(L / 2.2); k++) b.box(M.glow, hdr(chance(0.4) ? '#ffd890' : '#2a2e36', 0.8), xf - 0.05, PH + (h - PH) * 0.45, zc - L / 2 + 1.1 + k * 2.2, 0.03, 1.1, 0.8);
      }
      b.box(M.glow, hdr(WHITE, M.k * 0.85), xf - 0.15, h + 0.45, zc, 0.3, 0.9, L + 0.1);   // the parapet
      if (kind === 'mid') b.add(PED, M.glow, xf - 0.1, h + 0.9 + 0.8, zc, 0.5, 3.2, (L * 0.9) / 0.866, 0, 0, 0, hdr(WHITE, M.k * 0.9));
      if (kind === 'end') b.addM(roofGeo(L, D, 3.6, { hip: true, lift: 0.1, eave: 0.3, tile: 1 }).roof, M.roof, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(xf + D / 2, h + 0.9, zc), '#3e4248');
      if (lamps && kind !== 'tower') for (let z = z0 - 2.2; z > z1 + 0.5; z -= 4.4) { b.box(M.solid, '#2a2a2e', xf - 0.7, 0.15, z, 0.4, 0.3, 0.5); b.box(M.glow, hdr('#ffd8a0', 1.8), xf - 0.7, 0.31, z, 0.3, 0.02, 0.36); }   // the floodlights
    });
    b.block(M.solid, '#4a2418', FX + 30, 0, ZT, 28, 16, 66);   // the courts and wings behind
    // the tower: the carriage porch and its balcony, the shaft banded and quoined, the lantern stage between corner piers, the cap
    const TX = FX + 3.5, TW = 10;
    b.block(M.solid, '#c8c4b8', FX - 4.4, 0, ZT, 5.8, 0.5, 10.6);
    for (const dz of [-4.7, -1.65, 1.65, 4.7]) b.block(M.glow, hdr('#d8ccb8', M.k * 0.62), FX - 6.6, 0.5, ZT + dz, 1.1, 5.8, 1.1);
    b.block(M.glow, hdr('#d8ccb8', M.k * 0.6), FX - 4.25, 6.3, ZT, 5.5, 1.1, 10.6);
    for (const dz of [-3.15, 0, 3.15]) b.box(M.glow, hdr('#3a2a20', 1), FX - 7.17, 5.7, ZT + dz, 0.02, 0.5, 1.6);   // the arches' dark soffits
    for (let k = 0; k < 19; k++) b.box(M.glow, hdr('#d8ccb8', M.k * 0.6), FX - 6.85, 7.8, ZT - 4.95 + k * 0.55, 0.16, 0.8, 0.16);   // the balcony's balusters
    b.box(M.glow, hdr('#d8ccb8', M.k * 0.62), FX - 6.85, 8.25, ZT, 0.3, 0.14, 10.6);
    b.box(M.glow, hdr('#ffd8a0', 0.75), FX - 1.55, 3.0, ZT, 0.04, 4.6, 5.6);   // the doors lit inside
    for (const [x, z, ry] of [[TX - TW / 2 - 0.01, ZT, -Math.PI / 2], [TX, ZT + TW / 2 + 0.01, 0], [TX, ZT - TW / 2 - 0.01, Math.PI], [TX + TW / 2 + 0.01, ZT, Math.PI / 2]]) b.add(G.plane, M.tower, x, PH + 8.5, z, TW, 17, 1, 0, ry, 0, hdr('#ffffff', M.k * 1.08));
    b.box(M.glow, hdr(WHITE, M.k * 0.94), TX, PH + 17.4, ZT, TW + 0.8, 0.8, TW + 0.8);
    for (const ex of [-1, 1]) for (const ez of [-1, 1]) {
      const x = TX + ex * 4.3, z = ZT + ez * 4.3;
      b.block(M.glow, hdr('#a8452e', M.k * 1.05), x, 36.2, z, 1.4, 3.2, 1.4); b.block(M.glow, hdr(WHITE, M.k * 0.94), x, 39.4, z, 1.6, 0.35, 1.6);
      b.add(G.cone4, M.solid, x, 40.4, z, 2.0, 1.3, 2.0, 0, 0, 0, '#3e4248');
    }
    for (const [x, z, ry] of [[TX - 3.51, ZT, -Math.PI / 2], [TX, ZT + 3.51, 0], [TX, ZT - 3.51, Math.PI], [TX + 3.51, ZT, Math.PI / 2]]) b.add(G.plane, M.stage, x, 39.1, z, 7, 5.8, 1, 0, ry, 0, hdr('#ffffff', M.k * 1.08));
    b.box(M.glow, hdr(WHITE, M.k * 0.94), TX, 42.3, ZT, 7.8, 0.6, 7.8);
    b.block(M.glow, hdr('#a8452e', M.k * 1.05), TX, 42.6, ZT, 4.4, 3.4, 4.4);
    for (const y of [43.6, 45.4]) b.box(M.glow, hdr(WHITE, M.k * 0.94), TX, y, ZT, 4.5, 0.3, 4.5);
    for (const [dx, dz] of [[-2.21, 0], [0, 2.21], [0, -2.21], [2.21, 0]]) b.box(M.glow, hdr('#ffd890', 1.0), TX + dx, 44.5, ZT + dz, dx ? 0.02 : 1.0, 1.1, dz ? 0.02 : 1.0);
    b.add(G.cone4, M.solid, TX, 47.5, ZT, 6.6, 3.0, 6.6, 0, 0, 0, '#3e4248');
    b.cyl(M.metal, '#c8b070', TX, 50.6, ZT, 0.1, 3.2, 'cyl6'); b.sph(M.glow, hdr('#ffd060', 1.4), TX, 49.2, ZT, 0.28, true);
  };
  // the copy on the horizon: unfogged, fading in at the end of the street as the Presidential Office nears
  const skyMat = (p = {}) => new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true, ...p });
  const PO_SKY = { wall: skyMat({ map: pobTex }), tower: skyMat({ map: towerTex }), stage: skyMat({ map: stageTex }), glow: skyMat(), solid: skyMat(), metal: skyMat(), roof: skyMat({ map: K.roofTile.map }), k: 0.72 };
  const poSky = () => {
    const b = new Batcher();
    poBuilding(b, PO_SKY, 0, 0, { lamps: false });
    const g = b.build();
    g.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.renderOrder = -4; } });
    g.userData.mats = [...new Set(Object.values(PO_SKY).filter((m) => m.isMaterial))];
    return g;
  };
  const presidential = () => {
    const b = new Batcher();
    farGround(b, -1, '#121418'); farGround(b, 1, '#121418');
    const FX = EDGE + 18, ZT = -42;   // the front's line; the tower's axis, which Ketagalan Boulevard runs out along
    poBuilding(b, { wall: POB, tower: PTW, stage: PST, glow: VC.glow, solid: VC.solid, metal: VC.metal, roof: K.roofTile, k: 0.66 }, FX, ZT);
    K.pool(b, FX - 5, ZT, 9, 12, hdr('#ffd8a0', 0.16));
    // the forecourt: lawns and hedges, the railing and its gate, the guards, the old globe lamps, visitors under umbrellas
    b.add(G.plane, K.paveMat, (EDGE + 0.2 + FX) / 2, 0.05, -40, FX - EDGE - 0.2, 80, 1, -Math.PI / 2, 0, 0);
    for (const [za, zb] of [[-7, -35], [-49, -77]]) {
      b.block(VC.solid, '#1c3420', FX - 5.2, 0, (za + zb) / 2, 5.6, 0.3, za - zb);
      b.block(VC.solid, '#1a3a1e', FX - 7.8, 0, (za + zb) / 2, 0.9, 0.9, za - zb);
      for (let k = 0; k < 10; k++) b.sph(VC.solid, pick(['#e8202a', '#ffd23d', '#f4f4f0', '#ff8ab8']), FX - 5.2 + rand(-2, 2), 0.42, rand(zb + 1, za - 1), 0.22, true);
    }
    const RX = EDGE + 8.2;
    for (const [za, zb] of [[-1, -38.6], [-45.4, -79]]) b.add(K.tiled((za - zb) / 1.6), K.railTex, RX, 0.75, (za + zb) / 2, za - zb, 1.3, 1, 0, Math.PI / 2, 0);
    for (const z of [-38.6, -45.4]) { b.block(VC.glow, hdr(WHITE, 0.7), RX, 0, z, 0.7, 2.6, 0.7); b.box(VC.glow, hdr('#ffe8c0', 1.6), RX, 2.75, z, 0.3, 0.3, 0.3); guard(b, RX - 0.7, z + (z < -40 ? 0.9 : -0.9)); }
    for (let z = 6; z < 78; z += 12) {
      if (Math.abs(-z - ZT) < 4) continue;
      b.cyl(VC.metal, '#1a1a1e', RX - 1.0, 2.3, -z, 0.08, 4.6, 'cyl8'); b.sph(VC.glow, hdr('#fff0d8', 2.0), RX - 1.0, 4.75, -z, 0.28, true); K.pool(b, RX - 1.0, -z, 5, 5, hdr('#fff0d8', 0.07));
    }
    for (const z of [14, 40, 66]) K.lamp(b, EDGE + 0.45, -z, 1);
    K.streetSign(b, EDGE + 0.6, -5, STREET.chongqing);
    K.crowd(b, EDGE + 1.0, RX - 1.6, 2, 78, 16, { umbrellaP: 0.7 });
    // across the road: Ketagalan Boulevard running away east between its trees, the Guest House behind its wall, the ministry
    const B0 = -30, B1 = -54;
    b.add(G.plane, VC.solid, -(EDGE + 7 + 40), 0.03, (B0 + B1) / 2, 80, B0 - B1, 1, -Math.PI / 2, 0, 0, '#242629');
    for (const z of [B0 + 1.7, B1 - 1.7]) b.add(G.plane, K.paveMat, -(EDGE + 7 + 40), 0.05, z, 80, 3.4, 1, -Math.PI / 2, 0, 0);
    for (let x = X0 + 7; x < 50; x += 6) for (const z of [-34, -38, -46, -50]) K.paint(b, -(x + 1.5), z, 3, 0.15);
    for (const z of [-41.8, -42.2]) K.paint(b, -(X0 + 6 + 22), z, 44, 0.14, hdr('#e8b830', 0.55));
    K.crossing(b, -(X0 + 2.6), ZT, 23, 4, { dir: 'z' });
    K.paint(b, -(X0 + 5.2), -36, 0.35, 11.6);   // the stop line
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) K.scooter(b, -(X0 + 6.2 + r * 1.9 + rand(-0.2, 0.2)), -31.4 - c * 2.7 + rand(-0.3, 0.3), -Math.PI / 2 + rand(-0.1, 0.1), undefined, { rider: true, lit: true });
    for (const z of [B0 + 1.7, B1 - 1.7]) for (let x = X0 + 9; x < 44; x += 11) (chance(0.5) ? K.camphor : K.banyan)(b, -x, z, rand(0.75, 0.9));
    for (let x = X0 + 14; x < 46; x += 11) for (const z of [B0 + 0.6, B1 - 0.6]) { b.cyl(VC.metal, '#4a4e56', -x, 3.5, z, 0.09, 7, 'cyl8'); b.box(VC.glow, hdr('#ffe8c8', 2.4), -x, 7.0, z + (z > ZT ? -0.6 : 0.6), 0.3, 0.06, 0.8); K.pool(b, -x, z + (z > ZT ? -2 : 2), 6, 6, hdr('#ffe8c8', 0.06)); }
    // north of the boulevard the Guest House in its walled garden, south of it the ministry
    b.block(VC.solid, '#d8d4c8', -(X0 + 0.6), 0, -13.6, 0.5, 2.6, 25.4); b.box(VC.solid, '#3a3e44', -(X0 + 0.6), 2.7, -13.6, 0.7, 0.2, 25.6);
    for (let z = 3; z < 26; z += 6) b.box(VC.glow, hdr('#ffe8c0', 1.6), -(X0 + 0.32), 2.1, -z, 0.06, 0.24, 0.24);
    b.addM(buildingGeo(16, 9, 20, K.baroque[0].tex, 2.6, 3.8), K.baroque[0].mat, new THREE.Matrix4().makeTranslation(-(X0 + 20), 0, -13.5), '#f4ece0');
    b.addM(roofGeo(20, 16, 3.4, { hip: true, lift: 0.12, eave: 0.4, tile: 1 }).roof, K.roofTile, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(-(X0 + 20), 9, -13.5), '#3a3e48');
    K.banyan(b, -(X0 + 9), -6, rand(0.8, 0.95));
    b.addM(buildingGeo(18, 24, 21, K.office2, 1.6, 3.4), K.office2Mat, new THREE.Matrix4().makeTranslation(-(X0 + 15), 0, -69), '#c8bca8');
    for (const z of [-8, -20, -62, -74]) K.camphor(b, -(EDGE + 2.6), z, rand(0.75, 0.85));
    for (const z of [8, 26, 58, 76]) K.lamp(b, -(EDGE + 0.5), -z, -1);
    K.signal(b, -(EDGE + 0.6), -28.4, -1, 2);
    K.streetSign(b, -(EDGE + 0.6), -56, STREET.ketagalan);
    for (let k = 0; k < 6; k++) K.person(b, -(X0 + rand(1, 4.2)), -rand(31, 53), { umbrella: chance(0.6) });
    K.crowd(b, -(EDGE + 0.4), -(X0 - 0.3), 25, 29.5, 4, { umbrellaP: 0.6 });
    K.crowd(b, -(EDGE + 0.4), -(X0 - 0.3), 54.5, 58, 4, { umbrellaP: 0.6 });
    return b.build();
  };

  // ---------- 4. Liberty Square, the National Theater and Concert Hall ----------
  const libertyGate = (b, z) => {   // the square's white gate: five openings, blue glazed roofs, the name in gold
    const white = '#f0f0ea', blue = '#2a5ac8';
    for (const x of [-5.6, 5.6]) b.block(VC.solid, white, x, 0, z, 2.4, 15.2, 3.4);
    for (const x of [-13.6, 13.6]) b.block(VC.solid, white, x, 0, z, 2.2, 11.2, 3.0);
    for (const x of [-21, 21]) b.block(VC.solid, white, x, 0, z, 2.0, 8.6, 2.8);
    b.block(VC.solid, white, 0, 12.6, z, 13.6, 3.4, 3.4);
    for (const e of [-1, 1]) { b.block(VC.solid, white, e * 9.2, 9.0, z, 7.6, 2.4, 3.0); b.block(VC.solid, white, e * 17.3, 6.8, z, 6.4, 1.8, 2.8); }
    const R = (w, d, h) => roofGeo(w, d, h, { hip: true, lift: 0.5, eave: 0.8, tile: 0.6 }).roof;
    b.addM(R(14.6, 3.6, 2.4), K.roofTile, new THREE.Matrix4().makeTranslation(0, 16.0, z), blue);
    for (const e of [-1, 1]) { b.addM(R(8, 3.2, 1.8), K.roofTile, new THREE.Matrix4().makeTranslation(e * 9.2, 11.4, z), blue); b.addM(R(6.6, 3.0, 1.6), K.roofTile, new THREE.Matrix4().makeTranslation(e * 17.3, 8.6, z), blue); }
    b.add(G.plane, sign('自由廣場', { w: 512, h: 160, color: '#ffd878', font: KAI, weight: 400, size: 0.74, bg: '#1a3a8a', border: '#d8a830', k: 1.5 }), 0, 14.2, z + 1.72, 6.4, 2.0, 1);
    const lit = hdr('#e4e8f0', 0.5);   // its faces washed by the floodlights
    for (const [x, w, h, d] of [[-5.6, 2.4, 15.2, 3.4], [5.6, 2.4, 15.2, 3.4], [-13.6, 2.2, 11.2, 3.0], [13.6, 2.2, 11.2, 3.0], [-21, 2.0, 8.6, 2.8], [21, 2.0, 8.6, 2.8]]) b.box(VC.glow, lit, x, h / 2, z + d / 2 + 0.01, w, h, 0.02);
    b.box(VC.glow, lit, 0, 12.6 + 1.0, z + 1.71, 13.6, 2.0, 0.02);
    for (const e of [-1, 1]) { b.box(VC.glow, lit, e * 9.2, 10.2, z + 1.51, 7.6, 2.4, 0.02); b.box(VC.glow, lit, e * 17.3, 7.7, z + 1.41, 6.4, 1.8, 0.02); }
    for (const x of [-5.6, 5.6, -13.6, 13.6, -21, 21]) K.pool(b, x, z + 2.5, 5, 4, hdr('#d8e8ff', 0.12));
  };
  const palace = (b, x, z0, z1, s, name) => {   // the National Theater or the Concert Hall: a golden double roof over a red colonnade on its white podium
    const L = z1 - z0, zc = -(z0 + z1) / 2, D = 30, xc = x + s * D / 2;
    b.block(VC.solid, '#e8e4dc', xc, 0, zc, D + 6, 3.2, L + 6);
    for (let k = 0; k < 5; k++) b.block(VC.solid, '#d8d4cc', x - s * (1 + k * 0.6), 0, zc, 1, 3.2 - k * 0.64, 14);   // the stair
    b.block(VC.glow, hdr('#ffcf8a', 0.55), xc, 3.2, zc, D - 4, 10, L - 4);   // the lit hall behind the columns
    for (let z = z0 + 1.5; z <= z1 - 1.5; z += (L - 3) / 12) b.cyl(VC.solid, '#b8282a', x + s * 0.8, 8.2, -z, 0.55, 10, 'cyl8');
    b.box(VC.solid, '#1a5a5a', x + s * 0.8, 13.6, zc, 1.6, 1.0, L);   // the painted architrave
    b.box(VC.glow, hdr('#ffd060', 0.8), x + s * 0.0, 13.6, zc, 0.04, 0.3, L - 1);
    const big = roofGeo(L + 2, D + 2, 6, { hip: true, lift: 0.55, eave: 2.4, tile: 0.8 }).roof, small = roofGeo(L - 10, D - 10, 5, { hip: true, lift: 0.6, eave: 1.6, tile: 0.8 }).roof;
    b.addM(big, roofLit, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(xc, 14.2, zc), '#f2a630');
    b.block(VC.solid, '#b8282a', xc, 17.6, zc, D - 12, 3.4, L - 12);
    b.addM(small, roofLit, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(xc, 21.0, zc), '#f2a630');
    b.add(G.plane, sign(name, { w: 512, h: 128, color: '#ffe08a', font: KAI, weight: 400, size: 0.7, bg: '#1a3a3a', border: '#d8a830', k: 1.3 }), x - s * 0.3, 15.6, zc, 6, 1.5, 1, 0, -s * Math.PI / 2, 0);
    K.pool(b, x - s * 3, zc, 8, L, hdr('#ffb060', 0.08));
  };
  const liberty = () => {
    const b = new Batcher();
    farGround(b, -1, '#121418'); farGround(b, 1, '#121418');
    b.add(G.plane, K.paveMat, -(EDGE + 45), 0.06, -40, 90, 80, 1, -Math.PI / 2, 0, 0);
    b.add(G.plane, K.paveMat, EDGE + 45, 0.06, -40, 90, 80, 1, -Math.PI / 2, 0, 0);
    libertyGate(b, -9);
    palace(b, -44, 24, 80, -1, '國家戲劇院');
    palace(b, 44, 24, 80, 1, '國家音樂廳');
    for (const s of [-1, 1]) for (let z = 18; z < 80; z += 14) {   // the square's lamps and its flower beds
      b.cyl(VC.metal, '#e8e8e0', s * (EDGE + 6), 2.5, -z, 0.08, 5, 'cyl8'); b.sph(VC.glow, hdr('#fff4e0', 2.4), s * (EDGE + 6), 5.1, -z, 0.3, true); K.pool(b, s * (EDGE + 6), -z, 6, 6, hdr('#fff0d8', 0.08));
      b.block(VC.solid, '#2a4a2a', s * (EDGE + 16), 0, -z, 6, 0.5, 8); for (let k = 0; k < 8; k++) b.sph(VC.solid, pick(['#e8202a', '#ffd23d', '#ff8ab8', '#f4f4f0']), s * (EDGE + 16) + rand(-2.6, 2.6), 0.6, -z + rand(-3.6, 3.6), 0.22, true);
    }
    K.crowd(b, -(EDGE + 1), -(EDGE + 30), 14, 78, 16, { umbrellaP: 0.6 });
    K.crowd(b, EDGE + 1, EDGE + 30, 14, 78, 16, { umbrellaP: 0.6 });
    return b.build();
  };

  // ---------- 5. Raohe Street Night Market and Ciyou Temple ----------
  const raoheGate = (b, z) => {   // the market's gate: red pillars twined with dragons, the lit name board, an orange roof, lanterns
    const Y = 13.0;   // the board, high enough for the jetpack to pass under its lanterns
    for (const e of [-1, 1]) {
      b.box(VC.solid, '#b8202a', e * (EDGE + 0.9), (Y + 0.8) / 2, z, 0.9, Y + 0.8, 0.9);
      for (let k = 0; k < 44; k++) { const a = k * 0.7; b.add(ICO, VC.solid, e * (EDGE + 0.9) + Math.cos(a) * 0.5, 1.2 + k * 0.25, z + Math.sin(a) * 0.5, 0.26, 0.26, 0.26, 0, a, 0, k % 5 ? '#e8b030' : '#2a9a5a'); }   // a gilded dragon coiling up
    }
    b.box(VC.solid, '#8a1a1a', 0, Y, z, 2 * EDGE + 3.4, 1.6, 1.0);
    b.add(G.plane, sign('饒河街觀光夜市', { w: 1024, h: 160, color: '#ffe23d', font: HEI, size: 0.7, bg: '#a01818', border: '#ffd060', k: 1.5 }), 0, Y, z + 0.52, 2 * EDGE + 2.6, 1.3, 1);
    templeRoof(b, 0, Y + 1.0, z, 2 * EDGE + 4, 2.2, 1.5, { ry: 0, swallow: 1.0, figures: true });
    for (let x = -EDGE; x <= EDGE + 0.01; x += (2 * EDGE) / 5) K.lantern(b, x, Y - 1.4, z, 0.3);
    for (let x = -EDGE - 1; x <= EDGE + 1.01; x += 0.6) b.add(ICO, VC.glow, x, Y - 0.78, z + 0.52, 0.12, 0.12, 0.12, 0, 0, 0, hdr(pick(['#ff4a4a', '#ffd23d', '#3dd6ff', '#ff3df0', '#39ff88']), 2.4));   // the bulbs chasing round the board
  };
  const ciyou = (b) => {   // Ciyou Temple facing the street, its tall tower of stacked roofs behind
    const FX = 14, ZC = -14;
    b.block(VC.solid, '#c8c4b8', FX + 7, 0, ZC, 14, 0.5, 24);
    b.block(VC.glow, hdr('#a8603a', 0.55), FX + 7.5, 0.5, ZC, 12, 6, 22);
    for (const dz of [0, -6.5, 6.5]) { b.box(VC.solid, '#a81818', FX + 1.48, 2.6, ZC + dz, 0.06, 4, dz ? 2.6 : 3.6); b.box(VC.glow, hdr('#ffc070', 0.9), FX + 1.45, 2.6, ZC + dz, 0.03, 3.8, 0.08); }
    b.add(G.plane, sign('慈祐宮', { w: 512, h: 170, color: '#ffd878', font: KAI, weight: 400, size: 0.74, bg: '#14243a', border: '#d8a830', k: 1.4 }), FX + 1.4, 5.5, ZC, 3.0, 1.0, 1, 0, -Math.PI / 2, 0);
    for (const dz of [-3, 3, -9.5, 9.5]) b.cyl(VC.solid, '#c8b8a0', FX + 0.2, 3.2, ZC + dz, 0.32, 5.4, 'cyl8');
    for (let z = ZC - 10; z <= ZC + 10; z += 2.5) K.lantern(b, FX - 0.4, 5.3, z, 0.28);
    templeRoof(b, FX + 7, 6.5, ZC, 22, 14, 3.4);
    // the tower: five storeys, each under its own roof
    const TX = FX + 18;
    for (let k = 0; k < 5; k++) {
      const w = 12 - k * 1.6, y0 = 6 + k * 5.6;
      b.block(VC.glow, hdr(k % 2 ? '#a8603a' : '#b8502a', 0.55), TX, y0, ZC, w * 0.8, 4.6, w * 0.8);
      for (const e of [-1, 1]) b.box(VC.glow, hdr('#ffd8a0', 1.1), TX - w * 0.4 - 0.02, y0 + 2.4, ZC + e * w * 0.2, 0.04, 1.6, 0.8);
      templeRoof(b, TX, y0 + 4.6, ZC, w + 2, w + 2, 1.6, { ry: Math.PI / 2, figures: k === 4, swallow: 0.9 });
    }
    b.block(VC.solid, '#8a6a4a', TX, 0, ZC, 10, 6, 10);
    b.cyl(VC.metal, '#6a5030', FX - 4, 0.8, ZC, 1.0, 1.2, 'cyl8'); b.box(VC.glow, hdr('#ff7a2a', 1.8), FX - 4, 1.45, ZC, 1.1, 0.05, 1.1);
    return [[FX - 4, 1.6, ZC]];
  };
  const pepperBuns = (b, x, z, s, steam) => {   // the pepper-bun stall: the clay oven glowing, buns stuck round its walls, the queue
    b.cyl(VC.solid, '#8a5a3a', x, 0.7, z, 0.75, 1.4, 'cyl');
    b.cyl(K.ember, hdr('#ff8a2a', 2.0), x, 1.42, z, 0.55, 0.04, 'cyl');
    b.block(VC.metal, '#c8ccd0', x + s * 1.2, 0, z, 1.0, 0.9, 2.0);
    for (let k = 0; k < 12; k++) b.sph(VC.solid, '#e8b060', x + s * 1.2 + rand(-0.3, 0.3), 0.98, z + rand(-0.8, 0.8), 0.12, true);
    b.add(planeUV(K.stallRects[4]), K.stallMat, x - s * 0.2, 2.4, z, 2.4, 0.7, 1, 0, K.face(s), 0);
    K.vendor(b, x + s * 0.95, z + 0.2, s, { apron: '#f0f0ea', hat: 'towel', reach: 0.55 });   // slapping the buns onto the oven's wall
    K.vendor(b, x + s * 1.9, z - 0.4, s, { apron: '#c8202a', hat: 'cap', reach: 0.4 });
    for (let k = 0; k < 9; k++) K.person(b, x - s * rand(0.6, 1.2), z - 1.5 - k * 0.7, { umbrella: chance(0.5) });
    K.pool(b, x, z, 4, 4, hdr('#ff9a4a', 0.16));
    steam.push([x, 1.5, z], [x + 0.3, 1.5, z - 0.2]);
  };
  const raohe = () => {
    const b = new Batcher();
    farGround(b, -1, '#141418'); farGround(b, 1, '#141418');
    raoheGate(b, -5);
    const burners = ciyou(b);
    K.row(b, -1, 0, 80, { shops: MARKET_SHOPS, floors: [3, 6], vsigns: 0.8 });
    K.row(b, 1, 30, 80, { shops: MARKET_SHOPS, floors: [3, 6], vsigns: 0.8 });
    b.add(G.plane, K.paveMat, EDGE + 6, 0.05, -14, 12, 30, 1, -Math.PI / 2, 0, 0);
    const steam = [];
    pepperBuns(b, -(EDGE + 1.6), -9, -1, steam);
    for (const s of [-1, 1]) for (let z = s < 0 ? 14 : 32; z < 78; z += 2.6) if (chance(0.85)) K.stall(b, s * (EDGE + 1.7), -z, s, undefined, { steam, queue: chance(0.3) });
    for (let z = rand(18, 24); z < 76; z += rand(9, 13)) K.table(b, -(X0 + 1.6), -z);   // people eating in the arcade
    for (let z = rand(36, 42); z < 76; z += rand(10, 14)) K.table(b, X0 + 1.6, -z);
    for (let z = 16; z < 80; z += 8) K.festoon(b, -z, { y: 6.8, w: EDGE + 3, lanterns: chance(0.6) });
    K.crowd(b, -(EDGE + 0.3), -(EDGE + 0.8), 2, 78, 6);
    K.crowd(b, EDGE + 0.3, EDGE + 0.8, 30, 78, 5);
    K.crowd(b, -(EDGE + 3.0), -(X0 + 2.6), 2, 78, 14);
    K.crowd(b, EDGE + 2, EDGE + 12, 2, 28, 14, { umbrellaP: 0.5 });
    const g = b.build();
    g.add(smoke(b, burners, { n: 8, rise: 6 }));
    g.add(K.steam(steam));
    return g;
  };

  // ---------- 6. Dihua Street and the City God ----------
  const cityGod = (b, z0, z1) => {   // Xiahai City God Temple: one narrow bay squeezed into the row, lanterns, the smoke of the faithful
    const s = -1, f = s * X0, zc = -(z0 + z1) / 2, L = z1 - z0;
    b.block(VC.solid, '#8a3a24', s * (X0 + 8), 0, zc, 16, 6.4, L);
    b.box(VC.glow, hdr('#a8603a', 0.6), f - s * 0.05, 3.6, zc, 0.04, 5.6, L - 1);
    for (const dz of [-L / 4, L / 4]) b.cyl(VC.solid, '#c8b8a0', f - s * 0.6, 3.2, zc + dz, 0.3, 6.4, 'cyl8');
    b.box(VC.solid, '#a81818', f - s * 0.08, 2.0, zc, 0.06, 3.6, 2.6);
    b.add(G.plane, sign('霞海城隍廟', { w: 512, h: 128, color: '#ffd878', font: KAI, weight: 400, size: 0.7, bg: '#14243a', border: '#d8a830', k: 1.4 }), f - s * 0.12, 4.9, zc, 3.4, 0.85, 1, 0, -s * Math.PI / 2, 0);
    templeRoof(b, s * (X0 + 4), 6.4, zc, L + 0.4, 9, 2.6);
    for (let z = zc - L / 2 + 1; z <= zc + L / 2 - 1; z += 1.6) K.lantern(b, f - s * 0.9, 5.6, z, 0.26);
    b.cyl(VC.metal, '#6a5030', f - s * 2.4, 0.6, zc, 0.6, 1.0, 'cyl8'); b.box(VC.glow, hdr('#ff7a2a', 1.8), f - s * 2.4, 1.15, zc, 0.7, 0.05, 0.7);
    K.crowd(b, f - s * 1.6, f - s * 3.2, z0 + 0.5, z1 - 0.5, 10, { umbrellaP: 0.4 });
    return [[f - s * 2.4, 1.3, zc]];
  };
  const dihua = () => {
    const b = new Batcher();
    farGround(b, -1, '#141418'); farGround(b, 1, '#141418');
    K.dihuaRow(b, -1, 0, 38); const burners = cityGod(b, 38, 48); K.dihuaRow(b, -1, 48, 80);
    K.dihuaRow(b, 1, 0, 80);
    for (let z = 6; z < 80; z += 9) K.festoon(b, -z, { y: 7.0, w: X0, sag: 0.5, lanterns: true, lr: 0.24 });
    for (const s of [-1, 1]) { K.scooters(b, s, 2, 78, EDGE + 1.6, { gap: 0.45 }); for (let z = rand(6, 12); z < 78; z += rand(24, 30)) K.lamp(b, s * (EDGE + 0.5), -z, s); }
    K.crowd(b, -(X0 + 0.6), -(X0 + 2.6), 2, 78, 14, { umbrella: false });
    K.crowd(b, X0 + 0.6, X0 + 2.6, 2, 78, 14, { umbrella: false });
    const g = b.build();
    g.add(smoke(b, burners, { n: 7 }));
    return g;
  };

  // ---------- 7. Beitou: the Thermal Valley, the Hot Spring Museum, the library in the park ----------
  const springMat = std({ color: '#7ac8b0', roughness: 0.15, metalness: 0.2, emissive: '#2a7a6a', emissiveIntensity: 0.55, transparent: true, opacity: 0.92 });
  const stoneLantern = (b, x, z) => {   // a stone lantern beside the path, its little window lit
    b.cyl(VC.solid, '#8a8a84', x, 0.5, z, 0.16, 1.0, 'cyl6');
    b.block(VC.solid, '#9a9a94', x, 1.0, z, 0.55, 0.45, 0.55);
    b.box(VC.glow, hdr('#ffd8a0', 1.6), x, 1.22, z, 0.57, 0.18, 0.2);
    b.add(G.cone4, VC.solid, x, 1.65, z, 0.9, 0.4, 0.9, 0, 0, 0, '#7a7a74');
  };
  const beitou = () => {
    const b = new Batcher();
    farGround(b, -1, '#101612'); farGround(b, 1, '#101612');
    // right: the Thermal Valley steaming under its wooded slope, the rail along the path
    b.add(G.plane, K.paveMat, EDGE + 2.0, 0.05, -40, 3.6, 80, 1, -Math.PI / 2, 0, 0);
    b.add(G.plane, springMat, EDGE + 18, 0.04, -42, 26, 64, 1, -Math.PI / 2, 0, 0);
    for (let k = 0; k < 60; k++) { const a = (k / 60) * Math.PI * 2; b.add(G.sphLow, VC.solid, EDGE + 18 + Math.cos(a) * 13.6 + rand(-1, 1), rand(-0.35, -0.1), -42 + Math.sin(a) * 32.5 + rand(-1, 1), rand(1.2, 2.4), rand(0.5, 1.0), rand(1.2, 2.4), 0, rand(0, 3), 0, pick(['#9a9484', '#8a8678', '#a8a090', '#7e7a6e'])); }   // the boulders round the pool
    for (let k = 0; k < 8; k++) b.add(G.sphLow, VC.solid, EDGE + rand(34, 50), rand(4, 9), -rand(6, 76), rand(14, 22), rand(10, 16), rand(14, 22), 0, 0, 0, pick(['#1a2a1a', '#203220', '#16241a']));
    for (let z = 6; z < 80; z += rand(9, 13)) (chance(0.5) ? K.camphor : K.banyan)(b, EDGE + rand(32, 40), -z, rand(0.8, 1.0), { y: rand(2, 5) });
    b.add(K.tiled(40), K.railTex, EDGE + 3.8, 0.6, -40, 78, 1.0, 1, 0, Math.PI / 2, 0);
    for (let z = 2; z < 80; z += 2.5) b.box(VC.solid, '#5a3a24', EDGE + 3.8, 0.55, -z, 0.12, 1.1, 0.12);
    b.add(G.plane, sign('地熱谷', { w: 512, h: 170, color: '#f4ecd8', font: KAI, weight: 400, size: 0.72, bg: '#3a2a1a', border: '#8a6a40', k: 1.1 }), EDGE + 4.2, 1.9, -12, 2.6, 0.9, 1, 0, -Math.PI / 2, 0);
    for (let z = 8; z < 78; z += 14) stoneLantern(b, EDGE + 3.2, -z);
    K.pool(b, EDGE + 18, -42, 30, 66, hdr('#7affd8', 0.06));
    // left: the hot-spring stream in its stone channel, the museum and the library under the trees
    b.add(G.plane, K.water, -(EDGE + 2.6), 0.07, -40, 2.6, 80, 1, -Math.PI / 2, 0, 0);
    for (const e of [-1, 1]) b.block(VC.solid, '#5a5a54', -(EDGE + 2.6) + e * 1.45, 0, -40, 0.3, 0.32, 80);
    b.add(G.plane, K.paveMat, -(EDGE + 6), 0.05, -40, 4.4, 80, 1, -Math.PI / 2, 0, 0);
    // the museum: a red-brick ground floor with arched windows, the timber storey above, a dark tiled roof
    const MX = -(EDGE + 20), MZ = -22;
    b.addM(new THREE.BoxGeometry(16, 4.4, 26).translate(0, 2.2, 0), brick, new THREE.Matrix4().makeTranslation(MX, 0, MZ), '#ffffff');
    for (let k = 0; k < 6; k++) b.box(VC.glow, hdr('#ffd8a0', 1.0), MX + 8.02, 2.2, MZ - 10 + k * 4, 0.04, 2.0, 1.4);
    b.block(VC.solid, '#5a3a24', MX, 4.4, MZ, 15, 3.8, 25);
    for (let k = 0; k < 9; k++) b.box(VC.solid, '#efe8d8', MX + 7.52, 6.3, MZ - 11 + k * 2.75, 0.04, 2.6, 1.6);
    for (let k = 0; k < 9; k++) b.box(VC.glow, hdr('#ffe0b0', 0.8), MX + 7.55, 6.4, MZ - 11 + k * 2.75, 0.02, 1.6, 1.0);
    b.addM(roofGeo(26, 16, 3.6, { hip: true, lift: 0.25, eave: 1.2, tile: 0.6 }).roof, K.roofTile, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(MX, 8.2, MZ), '#3a3c40');
    b.add(G.plane, sign('北投溫泉博物館', { w: 1024, h: 160, color: '#f4ecd8', font: MING, size: 0.62, bg: '#2a1e14', k: 1.2 }), MX + 8.05, 4.0, MZ, 6, 0.7, 1, 0, Math.PI / 2, 0);
    // the library: a timber ark on stilts, wooden louvres, a sloping green roof with its solar panels
    const LX = -(EDGE + 20), LZ = -60;
    for (const [dx, dz] of [[-6, -10], [6, -10], [-6, 10], [6, 10], [0, 0]]) b.cyl(VC.solid, '#4a3a2a', LX + dx, 1.2, LZ + dz, 0.25, 2.4, 'cyl8');
    b.block(VC.solid, '#6a4a2a', LX, 2.4, LZ, 14, 6.6, 24);
    for (let k = 0; k < 40; k++) b.box(VC.solid, '#8a6a40', LX + 7.1, 5.7, LZ - 11.7 + k * 0.6, 0.12, 6.4, 0.1);
    b.box(VC.glow, hdr('#ffdca0', 1.0), LX + 7.02, 5.7, LZ, 0.04, 5.6, 22.6);
    b.add(G.box, VC.solid, LX, 9.4, LZ, 17, 0.4, 27, 0, 0, -0.16, '#3a6a3a');
    for (let k = 0; k < 6; k++) b.add(G.box, VC.solid, LX + 2, 9.8, LZ - 10 + k * 4, 6, 0.08, 3.2, 0, 0, -0.16, '#1a2a4a');
    b.box(VC.solid, '#6a4a2a', LX + 7.6, 2.6, LZ, 1.6, 0.2, 24);   // the deck
    b.add(G.plane, sign('北投圖書館', { w: 512, h: 128, color: '#f4ecd8', font: MING, size: 0.62, bg: '#2a1e14', k: 1.2 }), LX + 7.2, 3.3, LZ - 8, 3.4, 0.85, 1, 0, Math.PI / 2, 0);
    for (let z = 4; z < 80; z += rand(10, 15)) (chance(0.5) ? K.banyan : K.camphor)(b, -(EDGE + rand(7, 9)), -z, rand(0.7, 0.85));
    for (let z = 10; z < 78; z += 16) stoneLantern(b, -(EDGE + 4.6), -z);
    b.add(G.plane, sign('♨ 溫泉', { w: 128, h: 512, color: '#ffffff', font: HEI, size: 0.66, vertical: true, bg: '#c8202a', k: 1.3 }), -(EDGE + 9.5), 6, -40, 1.2, 4.8, 1, 0, 0, 0);
    K.crowd(b, -(EDGE + 4.4), -(EDGE + 7.8), 2, 78, 12);
    K.crowd(b, EDGE + 0.8, EDGE + 3.2, 2, 78, 12);
    const g = b.build();
    const vents = []; for (let k = 0; k < 22; k++) vents.push([EDGE + 18 + rand(-10, 10), 0.1, -42 + rand(-28, 28)]);
    g.add(smoke(b, vents, { n: 6, size: 2.4, grow: 3.4, rise: 9, drift: 2.5, life: 7, color: '#e8f0ee', opacity: 0.2 }));
    const brook = []; for (let z = 4; z < 78; z += 6) brook.push([-(EDGE + 2.6), 0.1, -z]);
    g.add(smoke(b, brook, { n: 3, size: 0.9, grow: 2, rise: 3, life: 5, color: '#e8f0ee', opacity: 0.16 }));
    return g;
  };

  return {
    landmarks: [
      { name: '艋舺龙山寺', en: 'LONGSHAN TEMPLE', build: longshan },
      { name: '台北 101 · 信义商圈', en: 'TAIPEI 101 · XINYI', build: xinyi },
      { name: '西门町 · 西门红楼', en: 'XIMENDING · THE RED HOUSE', build: ximen },
      { name: '总统府 · 凯达格兰大道', en: 'PRESIDENTIAL OFFICE · KETAGALAN BLVD.', build: presidential },
      { name: '自由广场 · 两厅院', en: 'LIBERTY SQUARE', build: liberty },
      { name: '饶河街夜市 · 慈祐宫', en: 'RAOHE NIGHT MARKET', build: raohe },
      { name: '大稻埕 · 迪化街', en: 'DADAOCHENG · DIHUA STREET', build: dihua },
      { name: '北投温泉 · 地热谷', en: 'BEITOU HOT SPRINGS', build: beitou },
    ],
    poSky,
    update(t) { for (const m of smokes) m.userData.update(t); },
  };
}
