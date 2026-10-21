// Lijiang street kit at dusk: two-storey Naxi houses of dark timber and white plaster with lattice windows, open
// shopfronts, red lanterns and wind chimes under grey-tiled roofs; canals with slab bridges and river lanterns, earthen
// village walls hung with corn and chillies, tea-horse caravans, yaks, people in Naxi dress, folk singers and drums.
import { THREE, VC, G, std, basic, hdr, planeUV, canvasTex, signAtlas, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { buildingRow, facadeMat, EDGE, waterMat, textTex, at } from './common.js';
import { beam, wire } from './tokyo_kit.js';
import { roofGeo, tiledBox } from './beijing_kit.js';
import { treeKit, lijiangTreeKit } from './trees.js';
import { rememberFlowerFacade } from './lijiang_flowers.js';

const LANTERN = new THREE.SphereGeometry(0.5, 10, 7);   // a few facets read as the bamboo ribs, and the old town hangs ~80 per chunk

export const CN = '"PingFang SC", "Hiragino Sans GB", "Noto Serif SC", "Songti SC", "Microsoft YaHei", serif';
const SHOPS = ['银器', '手鼓', '鲜花饼', '普洱茶', '东巴纸坊', '纳西披肩', '客栈', '牦牛肉', '腊排骨', '扎染', '木雕', '酥油茶', '咖啡', '民谣'];
const BAR_SIGNS = [
  { text: '民谣酒吧', color: '#ff4a6a' }, { text: 'LIVE', color: '#3dfff0', border: true }, { text: '清吧', color: '#ffd23d' },
  { text: '手鼓', color: '#ff9a3a', border: true }, { text: '小酒馆', color: '#b26bff' }, { text: '慢生活', color: '#7cf8ff' },
  { text: '音乐现场', color: '#ff3df0', border: true }, { text: 'BAR', color: '#ff4a4a', border: true },
];
const WOOD = '#4a2a18', DARK = '#25272d';

// ---------- textures ----------
// Naxi house front, both storeys in one tile: plaster and lattice above, a beam, dark timber shopfronts below.
function houseTex() {
  const cols = 3, cw = 64, ch = 192, W = cols * cw, H = ch;
  const cells = Array.from({ length: cols }, () => ({ up: chance(0.6) ? pick(['#ffcf8a', '#ffd9a0', '#ffc070']) : null, shop: chance(0.75) ? pick(['#ffd9a0', '#ffc878', '#ffe6c0']) : null }));
  const lattice = (g, x, y, w, h, col) => { g.strokeStyle = col; g.lineWidth = 1.2; for (let k = 4; k < w; k += 6) { g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + k, y + h); g.stroke(); } for (let k = 4; k < h; k += 6) { g.beginPath(); g.moveTo(x, y + k); g.lineTo(x + w, y + k); g.stroke(); } };
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = '#ece4d4'; g.fillRect(0, 0, W, 86);
    for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(120,100,70,${rand(0.04, 0.1).toFixed(2)})`; g.fillRect(rand(0, W), rand(0, 86), rand(2, 6), rand(2, 6)); }
    g.fillStyle = '#5a3420'; g.fillRect(0, 86, W, H - 86);
    for (let x = 0; x < W; x += 7) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, 96, 1.2, H - 96); }
    g.fillStyle = '#2e1a10'; g.fillRect(0, 84, W, 12);
    for (let c = 0; c < cols; c++) {
      const x = c * cw;
      g.fillStyle = '#3a2214'; g.fillRect(x, 0, 4, 86); g.fillRect(x + 8, 12, 48, 66);
      g.fillStyle = '#d8c8a4'; g.fillRect(x + 11, 15, 42, 60); lattice(g, x + 11, 15, 42, 60, '#4a2a18');
      g.fillStyle = '#140c08'; g.fillRect(x + 12, 100, 40, 88);
      g.fillStyle = '#6a3e24'; for (const dx of [12, 22, 32, 42]) g.fillRect(x + dx, 100, 1.5, 88);
    }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    cells.forEach(({ up, shop }, c) => {
      const x = c * cw;
      if (up) { g.fillStyle = up; g.fillRect(x + 11, 15, 42, 60); lattice(g, x + 11, 15, 42, 60, '#000'); }
      if (shop) { const gr = g.createLinearGradient(0, 100, 0, 188); gr.addColorStop(0, shop); gr.addColorStop(1, '#5a3010'); g.fillStyle = gr; g.fillRect(x + 12, 100, 40, 88); g.fillStyle = '#000'; for (const dx of [12, 42]) g.fillRect(x + dx, 100, 1.5, 88); }
    });
  });
  return { map, emissive, cols, rows: 1 };
}
function tileTex() {   // grey roof tiles in channels
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#26282e'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) { g.fillStyle = '#464a54'; g.fillRect(x, 0, 5, h); g.fillStyle = '#1a1c22'; g.fillRect(x + 5, 0, 1.5, h); }
    for (let y = 0; y < h; y += 8) { g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, y, w, 1.5); }
  });
}
function plasterTex() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#ece6d8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(110,95,70,${rand(0.04, 0.12).toFixed(2)})`; g.fillRect(rand(0, w), rand(0, h), rand(1, 5), rand(1, 5)); }
  });
}
function adobeTex() {   // sun-dried earth bricks with straw in them
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#8a6440'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 16 - 16; x < w; x += 32) { const v = randi(-12, 12); g.fillStyle = `rgb(${168 + v},${124 + v},${82 + v})`; g.fillRect(x + 1, y + 1, 30, 14); }
    g.strokeStyle = 'rgba(230,200,140,0.35)'; g.lineWidth = 0.8;
    for (let i = 0; i < 120; i++) { const x = rand(0, w), y = rand(0, h), a = rand(0, 3); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4); g.stroke(); }
  });
}
export function cobbleTex() {   // 五花石: polished breccia cobbles in grey, rust, green and cream
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#2e2a26'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 150; i++) {
      const x = rand(0, w), y = rand(0, h), r = rand(4, 9);
      g.fillStyle = pick(['#6e6a66', '#7a5244', '#5e6a5a', '#9a8e78', '#84786a', '#6a4e44', '#8a8a84']);
      g.beginPath(); for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2, rr = r * rand(0.75, 1.1); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); } g.fill();
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, 7); g.fill();
    }
  });
}
function plaqueAtlas() {   // dark lacquered boards with gold calligraphy over the shop doors
  const cw = 512, ch = 128, n = SHOPS.length;
  const tex = canvasTex(cw, ch * n, (g) => {
    SHOPS.forEach((t, i) => {
      const y = i * ch;
      g.fillStyle = i % 3 ? '#2a1610' : '#3a1a12'; g.fillRect(0, y, cw, ch);
      g.strokeStyle = '#c8a050'; g.lineWidth = 5; g.strokeRect(9, y + 9, cw - 18, ch - 18);
      g.fillStyle = '#f2cf72'; g.font = `700 74px ${CN}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(t, cw / 2, y + ch / 2 + 4);
    });
  }, { repeat: false });
  return { tex, rects: SHOPS.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / n, v1: 1 - i / n })) };
}
// a few Dongba pictographs (sun, moon, mountain, water, person, tree, bird, fish) on pale wooden cards
function dongbaAtlas() {
  const cs = 128, n = 8;
  const tex = canvasTex(cs * n, cs * 2, (g) => {
    for (let i = 0; i < n; i++) {
      const x0 = i * cs;
      g.fillStyle = '#d8c49a'; g.fillRect(x0, 0, cs, cs * 2);
      g.strokeStyle = '#7a4a2a'; g.lineWidth = 4; g.strokeRect(x0 + 6, 6, cs - 12, cs * 2 - 12);
      g.save(); g.translate(x0 + cs / 2, cs); g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = i % 2 ? '#1a1410' : '#a8201a'; g.fillStyle = g.strokeStyle;
      const L = (pts) => { g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
      if (i === 0) { g.beginPath(); g.arc(0, 0, 22, 0, 7); g.stroke(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; L([[Math.cos(a) * 30, Math.sin(a) * 30], [Math.cos(a) * 44, Math.sin(a) * 44]]); } }
      if (i === 1) { g.beginPath(); g.arc(0, 0, 34, -1.2, 1.2); g.arc(14, 0, 28, 1.1, -1.1, true); g.closePath(); g.fill(); }
      if (i === 2) L([[-46, 40], [-22, -30], [-6, 10], [12, -44], [30, 6], [46, 40]]);
      if (i === 3) for (const y of [-26, 0, 26]) L([[-44, y], [-22, y - 12], [0, y], [22, y + 12], [44, y]]);
      if (i === 4) { g.beginPath(); g.arc(0, -44, 13, 0, 7); g.stroke(); L([[0, -30], [-26, 22], [26, 22], [0, -30]]); L([[-12, 22], [-18, 56]]); L([[12, 22], [18, 56]]); L([[-14, -10], [-38, 4]]); L([[14, -10], [38, 4]]); }
      if (i === 5) { L([[0, 60], [0, -10]]); L([[-34, 10], [0, -56], [34, 10], [-34, 10]]); L([[-24, -10], [24, -10]]); }
      if (i === 6) { L([[-44, -6], [-16, 6], [0, -2], [22, -30]]); L([[0, -2], [38, 12], [10, 22], [-16, 6]]); g.beginPath(); g.arc(28, -30, 6, 0, 7); g.fill(); }
      if (i === 7) { g.beginPath(); g.ellipse(-6, 0, 32, 17, 0, 0, 7); g.stroke(); L([[26, 0], [46, -18], [46, 18], [26, 0]]); g.beginPath(); g.arc(-24, -4, 4, 0, 7); g.fill(); }
      g.restore();
    }
  }, { repeat: false });
  return { tex, rects: Array.from({ length: n }, (_, i) => ({ u0: i / n, u1: (i + 1) / n, v0: 0, v1: 1 })) };
}
function latticeTex() {   // lit paper behind a wooden lattice, for halls, pavilions and towers
  return canvasTex(64, 64, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe2a8'); gr.addColorStop(1, '#ffb860');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#4a2010'; g.lineWidth = 2;
    for (let k = 0; k <= w; k += 8) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, h); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(w, k); g.stroke(); }
    g.lineWidth = 4; g.strokeRect(1, 1, w - 2, h - 2);
  });
}
function lotusTex() {   // a paper lotus river lantern with its candle
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.fillStyle = k % 2 ? '#ff6aa0' : '#ff9ac0'; g.beginPath(); g.ellipse(32 + Math.cos(a) * 14, 32 + Math.sin(a) * 14, 12, 6, a, 0, 7); g.fill(); }
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 14); gr.addColorStop(0, '#fff6d0'); gr.addColorStop(1, 'rgba(255,180,80,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 14, 0, 7); g.fill();
  }, { repeat: false });
}
function fishTex() {   // 悬鱼: the carved board hanging under a gable
  return canvasTex(64, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#3a2214';
    g.beginPath(); g.moveTo(32, 4); g.quadraticCurveTo(58, 46, 34, 92); g.lineTo(52, 124); g.lineTo(32, 108); g.lineTo(12, 124); g.lineTo(30, 92); g.quadraticCurveTo(6, 46, 32, 4); g.fill();
    g.strokeStyle = '#c8a050'; g.lineWidth = 2.5; for (let y = 30; y < 90; y += 12) { g.beginPath(); g.arc(32, y, 9, 0.3, Math.PI - 0.3); g.stroke(); }
  }, { repeat: false });
}

// ---------- the kit ----------
export function makeKit() {
  const K = {};
  Object.assign(K, treeKit(), lijiangTreeKit());
  K.house = houseTex();
  K.houseMat = facadeMat(K.house, { k: 0.95 });
  K.tileMat = std({ map: tileTex(), side: THREE.DoubleSide, roughness: 0.55, metalness: 0.2 });
  K.plasterMat = std({ map: plasterTex(), vertexColors: true, roughness: 0.9 });
  K.adobeMat = std({ map: adobeTex(), vertexColors: true, roughness: 0.95 });
  K.latticeMat = basic({ map: latticeTex(), color: hdr('#ffffff', 0.95) });
  K.fishMat = std({ map: fishTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
  const pl = plaqueAtlas();
  K.plaqueRects = pl.rects; K.plaqueMat = std({ map: pl.tex, roughness: 0.5, emissive: '#ffffff', emissiveMap: pl.tex, emissiveIntensity: 0.55 });
  const db = dongbaAtlas();
  K.dongbaRects = db.rects; K.dongbaMat = std({ map: db.tex, side: THREE.DoubleSide, roughness: 0.6, emissive: '#ffffff', emissiveMap: db.tex, emissiveIntensity: 0.3 });
  const neon = signAtlas(BAR_SIGNS.map((e) => ({ ...e, font: CN, weight: 700 })), { cols: 2 });
  K.neonRects = neon.rects;
  K.neonMat = basic({ map: neon.tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hdr('#ffffff', 1.3) });
  K.neon = (b, x, y, z, side, w, i = randi(0, K.neonRects.length - 1)) => b.add(planeUV(K.neonRects[i]), K.neonMat, x, y, z, w, w / 4, 1, 0, -side * Math.PI / 2);
  K.lotusMat = basic({ map: lotusTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hdr('#ffffff', 1.5) });
  K.canalWater = waterMat('#1e4a50', 3);
  K.canalWater.metalness = 0.55; K.canalWater.roughness = 0.25; K.canalWater.envMapIntensity = 0.5; K.canalWater.normalScale.set(0.35, 0.35);
  K.wood = (b, x, y, z, w, h, d, col = WOOD) => b.box(VC.solid, col, x, y + h / 2, z, w, h, d);
  K.adobe = (b, x, y, z, w, h, d, col = 0xffffff, ry = 0) => b.addM(tiledBox(w, h, d, 2.2), K.adobeMat, at(x, y + h / 2, z, ry), col);

  // roofs: a gable roof along local x with gently swept ends, its ridge and ridge-end curls; hip roofs for pavilions
  K.gableRoof = (b, x, y, z, len, d, h, ry = 0, { gable = true, eave = 0.8 } = {}) => {
    const { roof, gable: gg } = roofGeo(len, d, h, { hip: false, lift: 0.3, eave });
    const m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z), c = Math.cos(ry), s = Math.sin(ry);
    b.addM(roof, K.tileMat, m, 0xffffff);
    if (gable && gg) b.addM(gg, K.plasterMat, m, 0xffffff);
    b.add(G.box, VC.solid, x, y + h + 0.1, z, len + 1.6, 0.3, 0.34, 0, ry, 0, DARK);
    for (const e of [-1, 1]) b.add(G.box, VC.solid, x + c * e * (len / 2 + 0.8), y + h + 0.32, z - s * e * (len / 2 + 0.8), 0.6, 0.3, 0.3, 0, ry, e * 0.5, DARK);
  };
  K.hipRoof = (b, x, y, z, w, d, h, { lift = 0.6, eave = 1.0, ry = 0, finial = false } = {}) => {
    const { roof } = roofGeo(w, d, h, { hip: true, lift, eave });
    b.addM(roof, K.tileMat, new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z), 0xffffff);
    const R = Math.max(0.3, (w - d) / 2);
    b.add(G.box, VC.solid, x, y + h + 0.1, z, 2 * R + 0.4, 0.28, 0.3, 0, ry, 0, DARK);
    if (finial) { b.cyl(VC.metal, '#d8a840', x, y + h + 0.5, z, 0.14, 0.8, 'cyl8'); b.sph(VC.metal, '#e8b84a', x, y + h + 1.0, z, 0.22, true); }
  };
  // a pavilion or a tower of `tiers` storeys: lit lattice walls in a ring of red pillars under swept hip roofs
  K.tower = (b, x, y, z, { w = 6, tiers = 1, tierH = 3.2, shrink = 0.8, ry = 0, pillar = '#8a2a1e', open = false } = {}) => {
    let ww = w, yy = y;
    for (let k = 0; k < tiers; k++) {
      if (!open || k) b.add(G.box, K.latticeMat, x, yy + tierH * 0.45, z, ww * 0.78, tierH * 0.9, ww * 0.78, 0, ry, 0);
      const c = Math.cos(ry), s = Math.sin(ry), r = ww * 0.46;
      for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) b.cyl(VC.solid, pillar, x + c * px * r + s * pz * r, yy + tierH / 2, z - s * px * r + c * pz * r, 0.16 + ww * 0.008, tierH, 'cyl8');
      b.add(G.box, VC.solid, x, yy + tierH - 0.2, z, ww * 0.98, 0.4, ww * 0.98, 0, ry, 0, '#3a1e14');
      if (k) b.add(G.box, VC.solid, x, yy + 0.5, z, ww * 1.02, 0.1, ww * 1.02, 0, ry, 0, '#5a2a1a');
      const rh = ww * 0.3;
      K.hipRoof(b, x, yy + tierH, z, ww + 0.4, ww + 0.4, rh, { ry, lift: 0.7, eave: 1.0 + ww * 0.05, finial: k === tiers - 1 });
      for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const ex = (ww / 2 + 1.2 + ww * 0.05), lx = x + c * px * ex + s * pz * ex, lz = z - s * px * ex + c * pz * ex; K.lantern(b, lx, yy + tierH - 0.6, lz, 0.55); }
      yy += tierH + rh * 0.55; ww *= shrink;
    }
    return yy;
  };

  // ---------- Naxi houses ----------
  K.windChime = (b, x, y, z) => {   // a brass bell over a wooden card painted with a Dongba sign, a red tassel below
    b.box(VC.solid, '#2a1a10', x, y - 0.2, z, 0.015, 0.4, 0.015);
    b.add(G.cone8, VC.metal, x, y - 0.46, z, 0.16, 0.16, 0.16, 0, 0, 0, '#d8a840');
    b.add(planeUV(pick(K.dongbaRects)), K.dongbaMat, x, y - 0.8, z, 0.16, 0.34, 1, 0, rand(0, 3), 0);
    b.box(VC.solid, '#c8201a', x, y - 1.06, z, 0.03, 0.16, 0.03);
  };
  K.lantern = (b, x, y, z, s = 1) => {   // red lantern with gold caps and a tassel
    b.cyl(VC.metal, '#3a2a18', x, y + 0.48 * s, z, 0.02, 0.3 * s);
    b.add(LANTERN, VC.glow, x, y, z, 0.62 * s, 0.7 * s, 0.62 * s, 0, 0, 0, hdr('#ff3a24', 2.4));
    b.cyl(VC.solid, '#c9a227', x, y + 0.34 * s, z, 0.18 * s, 0.07 * s);
    b.cyl(VC.solid, '#c9a227', x, y - 0.34 * s, z, 0.18 * s, 0.07 * s);
    b.cyl(VC.glow, hdr('#ffc04a', 1.4), x, y - 0.56 * s, z, 0.03 * s, 0.36 * s);
  };
  K.corn = (b, x, y, z, n = 7) => {   // a string of drying corn cobs
    b.box(VC.solid, '#3a2a18', x, y, z, 0.03, 0.04, 0.03);
    for (let k = 0; k < n; k++) b.add(G.sphLow, VC.solid, x + (k % 2 ? 0.08 : -0.08), y - 0.2 - k * 0.24, z, 0.15, 0.32, 0.15, 0, 0, (k % 2 ? 0.3 : -0.3), pick(['#f2b81a', '#e8a010', '#ffc82a', '#d89010']));
  };
  K.chilli = (b, x, y, z, n = 9) => { for (let k = 0; k < n; k++) b.add(G.cone8, VC.solid, x + rand(-0.05, 0.05), y - k * 0.13, z, 0.07, 0.2, 0.07, Math.PI, 0, 0, pick(['#c8180e', '#e02a1a', '#a8120a'])); };
  K.shopGoods = (b, x, z, side, kind = randi(0, 4)) => {   // what is on show under the eave
    if (kind === 0) for (let k = 0; k < 5; k++) { const zz = z - 1.4 + k * 0.7; b.add(G.cone8, VC.solid, x, 0.35, zz, 0.42, 0.7, 0.42, Math.PI, 0, 0, pick(['#8a4a2a', '#c8702a', '#5a2a1a', '#a85a2a'])); b.cyl(VC.solid, '#e8d8b0', x, 0.72, zz, 0.23, 0.05); }   // hand drums
    else if (kind === 1) { b.block(VC.solid, WOOD, x, 0, z, 0.6, 0.9, 2.4); for (let k = 0; k < 8; k++) b.sph(VC.metal, '#e8ecf4', x + rand(-0.2, 0.2), 0.96, z + rand(-1.1, 1.1), rand(0.05, 0.1), true); }   // silver
    else if (kind === 2) {   // shawls hung from a wooden rail on two posts
      for (const dz of [-1.55, 1.55]) b.box(VC.solid, WOOD, x, 1.35, z + dz, 0.06, 2.7, 0.06);
      b.box(VC.solid, WOOD, x, 2.68, z, 0.06, 0.06, 3.16);
      for (let k = 0; k < 5; k++) b.box(VC.solid, pick(['#c8202c', '#2a5ad8', '#e8a020', '#1f8a6a', '#8a3ad8', '#f2f0ea']), x - side * 0.045, 1.95, z - 1.2 + k * 0.6, 0.03, 1.4, 0.45);
    }
    else if (kind === 3) { b.block(VC.solid, WOOD, x, 0, z, 0.7, 0.8, 1.8); b.box(VC.glow, hdr('#ffe0a8', 1.0), x, 1.0, z, 0.6, 0.4, 1.6); b.add(G.plane, K.cakeMat, x - side * 0.36, 1.05, z, 1.4, 0.35, 1, 0, -side * Math.PI / 2, 0); }   // flower cakes
    else {   // Pu'er cakes in neat stacks on a low table
      b.block(VC.solid, WOOD, x, 0, z, 0.6, 0.45, 1.8);
      for (const dz of [-0.55, 0, 0.55]) for (let k = 0, n = randi(3, 6); k < n; k++) b.cyl(VC.solid, pick(['#8a5a2a', '#6a3a1a', '#a8784a']), x, 0.485 + k * 0.072, z + dz, 0.22, 0.07);
    }
  };
  K.cakeMat = basic({ map: textTex('鲜花饼', { w: 384, h: 96, color: '#ffe8c0', bg: '#a81a1a', font: CN, weight: 700, size: 0.66 }), color: hdr('#ffffff', 1.1) });
  K.naxiFront = (b, i, { bar = false } = {}) => {
    const s = i.side, f = i.face, L = i.len;
    b.add(G.box, VC.solid, f - s * 0.55, 3.95, i.z, 1.15, 0.1, L + 0.3, 0, 0, s * 0.32, '#2e3036');   // the waist eave
    b.box(VC.solid, '#1e2026', f - s * 1.08, 3.78, i.z, 0.14, 0.14, L + 0.3);
    const n = Math.max(2, Math.round(L / 3.2));
    for (let k = 0; k < n; k++) K.lantern(b, f - s * 0.9, 3.15, i.z - L / 2 + (L * (k + 0.5)) / n, bar ? 0.66 : 0.58);
    if (chance(0.85)) b.add(planeUV(pick(K.plaqueRects)), K.plaqueMat, f - s * 0.07, 3.56, i.z + rand(-L / 5, L / 5), 1.7, 0.42, 1, 0, -s * Math.PI / 2, 0);
    if (chance(0.7)) K.windChime(b, f - s * 1.05, 3.72, i.z + rand(-L / 3, L / 3));
    if (chance(0.35)) K.bougain(b, f - s * 0.14, 6.6, i.z + rand(-L / 4, L / 4), rand(1.8, 2.8), rand(1.6, 2.4), Math.PI / 2);
    if (chance(0.6)) K.shopGoods(b, f - s * 0.45, i.z + rand(-L / 5, L / 5), s);
    if (bar) {
      K.neon(b, f - s * 0.04, 5.2, i.z, s, Math.min(4.2, L - 1));
      b.block(VC.solid, WOOD, f - s * 0.45, 4.0, i.z, 0.9, 0.1, L - 0.6);
      b.box(VC.solid, WOOD, f - s * 0.88, 4.5, i.z, 0.06, 0.9, L - 0.6);
      if (chance(0.5)) K.singer(b, f - s * 0.45, i.z + rand(-L / 4, L / 4), s, 4.1);
    }
    rememberFlowerFacade(b, f, i.z, L, s);
  };
  K.naxiRoof = (b, i) => {
    K.gableRoof(b, i.x, i.h, i.z, i.len, i.d, 2.3, Math.PI / 2);
    for (const e of [-1, 1]) b.add(G.plane, K.fishMat, i.x, i.h + 1.45, i.z + e * (i.len / 2 + 0.03), 0.6, 1.2, 1, 0, e > 0 ? 0 : Math.PI, 0);
  };
  K.naxiType = { mat: K.houseMat, tex: K.house, colors: ['#ffffff', '#f6eadc', '#fff2e4', '#ecdcc8'], w: [7, 10], h: [6.6, 6.6], weight: 1, cellW: 2.4, cellH: 6.6, roof: K.naxiRoof, front: (b, i) => K.naxiFront(b, i) };
  K.barType = { ...K.naxiType, front: (b, i) => K.naxiFront(b, i, { bar: true }) };
  K.oldRow = (b, side, z0, z1, { bar = false, x0 = 11.2 } = {}) => buildingRow(b, side, [bar ? K.barType : K.naxiType], { x0, depth: [9, 12], gap: [0, 0.4], z0, z1, setback: [0, 0.3] });

  // ---------- Baisha-style village: earthen walls with tile copings, gateways, corn and chillies drying, houses behind ----------
  K.gate = (b, x, z, side) => {   // a timber gateway under its own little roof, couplets and a pair of lanterns
    b.block(VC.solid, '#3a1e12', x, 0, z, 0.5, 3.2, 3.0);
    b.box(VC.solid, '#5a1a12', x - side * 0.27, 1.45, z, 0.04, 2.6, 2.2);
    for (const dz of [-1.35, 1.35]) b.box(VC.solid, '#c8201a', x - side * 0.27, 1.6, z + dz, 0.03, 1.8, 0.28);
    for (const dz of [-0.4, 0.4]) b.sph(VC.metal, '#c8a050', x - side * 0.3, 1.45, z + dz, 0.06, true);
    K.gableRoof(b, x - side * 0.3, 3.2, z, 3.6, 1.6, 0.9, Math.PI / 2, { gable: false, eave: 0.4 });
    for (const dz of [-1.2, 1.2]) K.lantern(b, x - side * 0.9, 2.6, z + dz, 0.5);
  };
  K.villageRow = (b, side, z0, z1) => {
    let z = z0 + rand(0, 2);
    while (z < z1 - 5) {
      const len = Math.min(rand(12, 20), z1 - z), xw = side * 11.5, zc = -(z + len / 2), wh = rand(2.6, 3.2);
      K.adobe(b, xw, 0, zc, 0.7, wh, len, pick(['#ffffff', '#f2e4d0', '#e8d4bc']));
      K.gableRoof(b, xw, wh, zc, len, 0.9, 0.35, Math.PI / 2, { gable: false, eave: 0.15 });
      const zg = zc + rand(-len / 4, len / 4);
      if (len > 9) K.gate(b, xw - side * 0.1, zg, side);
      for (let k = randi(2, 5); k > 0; k--) { const zz = zc + rand(-len / 2 + 0.6, len / 2 - 0.6); if (Math.abs(zz - zg) > 2.2) (chance(0.7) ? K.corn : K.chilli)(b, xw - side * 0.45, wh - 0.1, zz); }
      const hx = side * rand(17, 21), hd = rand(8, 10);
      b.addM(new THREE.BoxGeometry(hd, 6.6, len - 2).translate(0, 3.3, 0), K.plasterMat, at(hx, 0, zc), '#efe6d6');
      b.box(VC.solid, WOOD, hx - side * hd / 2, 4.6, zc, 0.06, 2.2, len - 2.4);
      b.box(K.latticeMat, 0xffffff, hx - side * (hd / 2 + 0.04), 4.7, zc, 0.03, 1.2, Math.min(len - 4, 4.5));
      K.gableRoof(b, hx, 6.6, zc, len - 2, hd, 2.1, Math.PI / 2);
      if (chance(0.5)) K.walnut(b, side * rand(24, 30), zc + rand(-len / 3, len / 3), rand(1.0, 1.3));
      K.cosmos(b, side * 10.7, z + 0.6, z + len - 0.6);
      rememberFlowerFacade(b, xw, zc, len, side, 0, true);
      z += len + rand(0.5, 2.5);
    }
  };

  // ---------- the canal (水巷): a clear stream between stone kerbs, slab bridges to the doors, river lanterns ----------
  K.riverLantern = (b, x, z) => { b.add(G.plane, K.lotusMat, x, 0.1, z, 0.55, 0.55, 1, -Math.PI / 2, rand(0, 3), 0); b.sph(VC.glow, hdr('#fff0c0', 2.6), x, 0.16, z, 0.05, true); };
  K.canal = (b, s, z0 = 0, z1 = CHUNK_LEN) => {
    const xc = s * (EDGE + 5.6), L = z1 - z0, zc = -(z0 + z1) / 2;
    b.box(VC.solid, '#16262a', xc, 0.035, zc, 2.3, 0.05, L);
    b.add(G.plane, K.canalWater, xc, 0.075, zc, 2.2, L, 1, -Math.PI / 2, 0, 0);
    for (const e of [-1, 1]) b.box(VC.solid, '#8a8478', xc + e * 1.27, 0.2, zc, 0.3, 0.4, L);
    for (let z = z0 + rand(4, 9); z < z1 - 3; z += rand(10, 15)) { b.box(VC.solid, '#9a9488', xc, 0.42, -z, 3.0, 0.16, 1.5); b.box(VC.solid, '#7a7468', xc, 0.24, -z, 2.4, 0.2, 1.3); }
    for (let k = randi(4, 7); k > 0; k--) K.riverLantern(b, xc + rand(-0.75, 0.75), -rand(z0 + 2, z1 - 2));
  };
  // lantern strings strung high across the street between timber poles
  K.lanternSpan = (b, z, y = 12.4) => {
    for (const s of [-1, 1]) b.cyl(VC.solid, WOOD, s * (EDGE + 0.5), (y + 0.4) / 2, z, 0.12, y + 0.4, 'cyl8');
    wire(b, -(EDGE + 0.5), y, z, EDGE + 0.5, y, z, 0.6, { color: '#1a1410', t: 0.03, n: 8 });
    for (let k = 1; k < 10; k++) { const t = k / 10, x = -(EDGE + 0.5) + 2 * (EDGE + 0.5) * t; K.lantern(b, x, y - 0.6 * 4 * t * (1 - t) - 0.55, z, 0.6); }
  };

  // ---------- people, animals ----------
  const TOUR = ['#e84a3a', '#2a6ad8', '#f2c230', '#1f8a6a', '#e8e2d6', '#8a3ad8', '#ff8a3a', '#2a2a30'];
  K.person = (b, x, z, { s = rand(0.92, 1.06), kind = pick(['naxi', 'naxi', 'naxiMan', 'tourist', 'tourist', 'tourist']), seated = false, ry = rand(0, 6), y0 = 0 } = {}) => {
    const y = (seated ? -0.45 : 0) + y0, bx = Math.sin(ry), bz = Math.cos(ry);
    if (!seated) b.add(G.cyl8, VC.solid, x, y0 + 0.5 * s, z, 0.3 * s, 1.0 * s, 0.24 * s, 0, 0, 0, kind === 'tourist' ? pick(['#2a3a5a', '#1c1c22', '#6a5a4a']) : '#1a1e3a');
    if (kind === 'naxi') {   // blue jacket, maroon vest, the starry sheepskin cape on her back, a blue cap
      b.box(VC.solid, pick(['#2a54b0', '#3a6ac8', '#5a8ad8']), x, y + 1.25 * s, z, 0.46 * s, 0.62 * s, 0.28 * s, ry);
      b.box(VC.solid, '#7a1a2a', x, y + 1.32 * s, z, 0.48 * s, 0.4 * s, 0.3 * s, ry);
      b.box(VC.solid, '#16182a', x - bx * 0.15 * s, y + 0.95 * s, z - bz * 0.15 * s, 0.4 * s, 0.4 * s, 0.04 * s, ry);
      b.box(VC.solid, '#141214', x + bx * 0.16 * s, y + 1.2 * s, z + bz * 0.16 * s, 0.44 * s, 0.6 * s, 0.05 * s, ry);
      b.box(VC.solid, '#f2ece0', x + bx * 0.16 * s, y + 1.5 * s, z + bz * 0.16 * s, 0.48 * s, 0.08 * s, 0.08 * s, ry);
      for (let k = 0; k < 7; k++) b.sph(VC.solid, pick(['#ffd23d', '#2a8ad8', '#e83a3a', '#3ab86a']), x + bx * 0.19 * s + bz * (k - 3) * 0.06 * s, y + 1.0 * s, z + bz * 0.19 * s - bx * (k - 3) * 0.06 * s, 0.025 * s, true);
      b.sph(VC.solid, pick(['#e8c4a0', '#d9a07a', '#c8946a']), x, y + 1.72 * s, z, 0.15 * s, true);
      b.cyl(VC.solid, '#1a2a6a', x, y + 1.86 * s, z, 0.16 * s, 0.1 * s);
    } else if (kind === 'naxiMan') {   // dark jacket and a felt hat
      b.box(VC.solid, pick(['#2a2420', '#3a3430', '#1e2a3a']), x, y + 1.25 * s, z, 0.48 * s, 0.62 * s, 0.3 * s, ry);
      b.sph(VC.solid, pick(['#c8946a', '#b8845a']), x, y + 1.72 * s, z, 0.15 * s, true);
      b.cyl(VC.solid, '#2a2018', x, y + 1.84 * s, z, 0.26 * s, 0.03 * s); b.cyl(VC.solid, '#2a2018', x, y + 1.92 * s, z, 0.14 * s, 0.14 * s);
    } else {   // visitors in bright jackets, some in sun hats
      b.box(VC.solid, pick(TOUR), x, y + 1.25 * s, z, 0.46 * s, 0.62 * s, 0.28 * s, ry);
      b.sph(VC.solid, pick(['#e8c4a0', '#d9a07a', '#f0d0b0']), x, y + 1.72 * s, z, 0.15 * s, true);
      if (chance(0.4)) b.cyl(VC.solid, pick(['#e8d8b0', '#f4f0e8', '#c8a878']), x, y + 1.84 * s, z, 0.3 * s, 0.04 * s);
      else b.sph(VC.solid, pick(['#141414', '#3a2a1a', '#6a4a2a']), x, y + 1.8 * s, z + 0.02, 0.16 * s, true);
    }
  };
  K.crowd = (b, x0, x1, z0, z1, n, opts = {}) => { for (let i = 0; i < n; i++) K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1), opts); };
  K.singer = (b, x, z, side, y = 0) => {   // a folk singer on a stool with his guitar
    b.block(VC.solid, WOOD, x, y, z, 0.4, 0.45, 0.4);
    K.person(b, x, z, { kind: chance(0.5) ? 'naxiMan' : 'tourist', seated: true, ry: -side * Math.PI / 2, y0: y });
    const yy = y + 0.45;
    b.add(G.box, VC.solid, x - side * 0.25, yy + 0.65, z + 0.1, 0.12, 0.45, 0.36, 0, 0, side * 0.6, '#c8904a');
    beam(b, VC.solid, x - side * 0.3, yy + 0.85, z + 0.1, x - side * 0.1, yy + 1.15, z - 0.45, 0.05, '#3a2414');
  };
  K.horse = (b, x, z, ry = 0, { col = pick(['#5a3a24', '#3a2a1e', '#8a6a4a', '#2a2420', '#a8845a']), pack = true } = {}) => {
    const P = (f, y, s = 0) => [x + Math.sin(ry) * f + Math.cos(ry) * s, y, z + Math.cos(ry) * f - Math.sin(ry) * s];
    b.add(G.sph, VC.solid, ...P(0, 1.25), 0.55, 0.6, 1.5, 0, ry, 0, col);
    beam(b, VC.solid, ...P(0.55, 1.4), ...P(0.9, 1.95), 0.26, col);
    beam(b, VC.solid, ...P(0.85, 2.0), ...P(1.25, 1.72), 0.2, col, 0.24);
    beam(b, VC.solid, ...P(0.6, 1.55), ...P(0.88, 2.08), 0.06, '#141210');
    for (const f of [-0.5, 0.5]) for (const s of [-0.16, 0.16]) beam(b, VC.solid, ...P(f, 1.05, s), ...P(f, 0, s), 0.1, col);
    beam(b, VC.solid, ...P(-0.72, 1.35), ...P(-0.9, 0.7), 0.07, '#141210');
    b.sph(VC.solid, '#d8201a', ...P(1.0, 2.15), 0.08, true);
    b.sph(VC.metal, '#d8a840', ...P(0.75, 1.55), 0.07, true);
    if (pack) {
      for (const s of [-0.4, 0.4]) b.add(G.box, VC.solid, ...P(0, 1.42, s), 0.32, 0.46, 0.62, 0, ry, 0, pick(['#a8844a', '#8a6a3a', '#b8945a']));
      b.add(G.box, VC.solid, ...P(0, 1.72), 0.7, 0.08, 0.66, 0, ry, 0, '#a81a1a');
    }
  };
  K.caravan = (b, x, z, n = randi(3, 5), dir = 1) => {   // a tea-horse caravan in single file, the muleteer leading
    const ry = dir > 0 ? Math.PI : 0;
    for (let k = 0; k < n; k++) K.horse(b, x, z + dir * k * 2.4, ry);
    K.person(b, x + 0.6, z - dir * 1.6, { kind: 'naxiMan', ry });
  };
  K.yak = (b, x, z, ry = rand(0, 6)) => {   // shaggy black yak with pale horns and a red saddle cloth
    const P = (f, y, s = 0) => [x + Math.sin(ry) * f + Math.cos(ry) * s, y, z + Math.cos(ry) * f - Math.sin(ry) * s];
    b.add(G.sph, VC.solid, ...P(0, 1.2), 1.1, 1.05, 2.0, 0, ry, 0, '#1e1a18');
    b.add(G.sph, VC.solid, ...P(0.5, 1.65), 0.9, 0.6, 0.8, 0, ry, 0, '#1e1a18');
    b.add(G.box, VC.solid, ...P(0, 0.62), 0.95, 0.5, 1.7, 0, ry, 0, '#141110');
    for (const f of [-0.6, 0.6]) for (const s of [-0.28, 0.28]) beam(b, VC.solid, ...P(f, 0.8, s), ...P(f, 0, s), 0.16, '#141110');
    b.add(G.sph, VC.solid, ...P(1.1, 1.05), 0.5, 0.5, 0.6, 0, ry, 0, '#1e1a18');
    b.add(G.sph, VC.solid, ...P(1.32, 1.0), 0.22, 0.2, 0.18, 0, ry, 0, '#e8e2d6');
    for (const s of [-1, 1]) { beam(b, VC.solid, ...P(1.05, 1.28, s * 0.18), ...P(1.12, 1.45, s * 0.42), 0.06, '#d8ccb4'); beam(b, VC.solid, ...P(1.12, 1.45, s * 0.42), ...P(1.2, 1.62, s * 0.36), 0.05, '#d8ccb4'); }
    b.add(G.box, VC.solid, ...P(-0.1, 1.78), 0.8, 0.06, 1.0, 0, ry, 0, '#c8201a');
    beam(b, VC.solid, ...P(-1.0, 1.3), ...P(-1.2, 0.6), 0.12, '#141110');
  };
  K.update = (t) => { K.canalWater.userData.scroll.offset.y = -t * 0.05; };
  return K;
}
