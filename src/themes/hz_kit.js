// Hangzhou's street kit. By West Lake: the vendors (the sugar painter with his zodiac wheel, the lotus-pod seller on her
// tricycle, snack carts for 葱包桧, 定胜糕, lotus-root starch, ice cream, candied haws and Longjing tea, the balloon
// and flower-crown sellers, a portrait sketcher, the volunteers' service desk), the grey lakeside kiosks with their
// lifted eaves, the dark-green newsstands (the new self-service kind and the old post-office kind with papers pegged
// along the front), benches, West Lake's black lantern lamps and the city's red public bikes. On the plane-tree
// avenues: the villa walls, gates and terraced villas of Beishan Street, bus stops, the sightseeing carts. By the
// Qiantang: the riverside park and its cycle lane, river boats, the tide warning signs, and the towers of Qianjiang New
// City, whose faces carry the light show (hz_show.js). People: tourists under parasols and holding up phones, girls in
// hanfu, volunteers in fluorescent vests, vendors in aprons and straw hats. Every sign is in Chinese.
import { THREE, VC, G, basic, std, hdr, canvasTex, windowTex, buildingGeo, planeUV, roundRect, shade, rand, randi, pick, chance } from '../core.js';
import { EDGE, at, facadeMat, DISC } from './common.js';
import { puffs } from './taipei_towers.js';
import { thinFog } from './ny_icons.js';
import { SHOW_GLYPHS } from './hz_show.js';

export const SANS = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
export const BRUSH = '"Ma Shan Zheng", "STKaiti", "KaiTi", serif';
const DISPLAY = '"ZCOOL QingKe HuangYou", "PingFang SC", sans-serif';

// sign boards and neon names: [text, board (null: letters only), ink, font]
const SIGNS = [
  ['葱包桧', '#c8202c', '#fff4d8', BRUSH], ['定胜糕', '#f4a8c0', '#8a1430', BRUSH], ['西湖藕粉', '#f4f0e4', '#2a6a3a', BRUSH],
  ['冰淇淋', '#5ab8e8', '#ffffff', DISPLAY], ['糖葫芦', '#d8202a', '#ffe08a', BRUSH], ['龙井茶', '#1e3a2a', '#e8c86a', BRUSH],
  ['新鲜莲蓬', '#2a7a3a', '#ffffff', SANS], ['报刊亭', '#1e4a34', '#f0d27a', SANS], ['邮政报刊亭', '#1a5a3a', '#ffe23d', SANS],
  ['体彩', '#d8202a', '#ffffff', SANS], ['数据线 口罩 寄存', '#ffffff', '#1f4aa8', SANS], ['公共自行车', '#d8202a', '#ffffff', SANS],
  ['西湖景区 便民服务', '#7a4a24', '#ffffff', SANS], ['人像速写', '#f4f0e8', '#1a1a1a', BRUSH], ['汉服写真', '#f8d8e4', '#a0204a', BRUSH],
  ['发光气球', '#3a1a5a', '#ffe8ff', DISPLAY], ['涌潮危险 请勿下堤', '#ffd23d', '#c8141e', SANS], ['北山街', '#1f4aa8', '#ffffff', SANS],
  ['南山路', '#1f4aa8', '#ffffff', SANS], ['断桥 →', '#6a3a1e', '#ffffff', SANS], ['公交站', '#1f6ab8', '#ffffff', SANS],
  ['非遗 · 糖画', '#c8141e', '#ffd77a', BRUSH], ['秋水山庄', '#2a1a12', '#e8c870', BRUSH], ['坚匏别墅', '#2a1a12', '#e8c870', BRUSH],
  ['静逸别墅', '#2a1a12', '#e8c870', BRUSH], ['之江路', '#1f4aa8', '#ffffff', SANS], ['钱塘江', '#6a3a1e', '#ffffff', SANS],
  ['钱江中心', null, '#ff3a3a', SANS], ['之江大厦', null, '#ff4a3a', SANS], ['潮城国际', null, '#ff3a5a', SANS],
  ['钱塘金融', null, '#ff5a2a', SANS], ['新城广场', null, '#fff4e8', SANS], ['江南会', null, '#ffd23d', SANS], ['城市阳台', null, '#ffffff', SANS],
];
export const SIGN = Object.fromEntries(SIGNS.map(([t], i) => [t, i]));
const NEON = SIGNS.map(([t, bg], i) => (bg ? -1 : i)).filter((i) => i >= 0 && SIGNS[i][0] !== '城市阳台');
const MASTHEADS = ['杭州日报', '都市快报', '钱江晚报', '读者', '青年文摘', '旅游', '时尚', '汽车', '体育', '财经', '西湖', '漫画', '故事会', '美食', '健康', '家居'];
const ZODIAC = '鼠牛虎兔龙蛇马羊猴鸡狗猪';
export const GLYPHS = [...new Set(SIGNS.map((e) => e[0]).join('') + MASTHEADS.join('') + ZODIAC + SHOW_GLYPHS)].join('');

const COATS = ['#2b2d3a', '#f4f0e8', '#c8d8e8', '#3a5a8a', '#e8c8a8', '#a83a3a', '#2f4a3a', '#f0d0d8', '#5a5a62', '#d8b84a', '#ffffff', '#8ab8d8'];
const PANTS = ['#1f2430', '#2a3a5a', '#3a3a40', '#c8c0b0', '#141418', '#4a4038', '#e8e4dc'];
const SKIN = ['#e8c4a4', '#d8ae8c', '#f0d0b4', '#c89a7a'];
const HAIR = ['#141210', '#1e1814', '#2a2018', '#3a2a20'];
const HANFU = ['#f4c8d4', '#c8e0f4', '#d8f0e0', '#e0d0f0', '#f8f0e0', '#e8a0a8', '#a8d8e8', '#f8e0b0'];
const PARASOL = ['#f8f4f0', '#f4c8d4', '#c8e0f4', '#ffe8a0', '#e8a0a8', '#d8f0e0', '#2a2a30'];
const ICO = new THREE.IcosahedronGeometry(0.5, 0);
const ROBE = new THREE.CylinderGeometry(0.3, 0.52, 1, 9);   // a hanfu skirt flaring to the ground
const WHEEL = new THREE.CircleGeometry(0.5, 24);
const face = (s) => -s * Math.PI / 2;   // turns a plane (or a person) to face the track from side s

function signTex() {
  const cw = 384, ch = 96, cols = 4, rows = Math.ceil(SIGNS.length / cols);
  const tex = canvasTex(cw * cols, ch * rows, (g) => {
    g.clearRect(0, 0, cw * cols, ch * rows);
    SIGNS.forEach(([text, bg, ink, font], i) => {
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
      g.save(); g.translate(x, y);
      if (bg) {
        g.fillStyle = bg; roundRect(g, 3, 3, cw - 6, ch - 6, 10); g.fill();
        g.strokeStyle = shade(ink, 0.9); g.globalAlpha = 0.6; g.lineWidth = 3; roundRect(g, 9, 9, cw - 18, ch - 18, 7); g.stroke(); g.globalAlpha = 1;
      }
      let px = font === SANS ? 58 : 66;
      g.font = `900 ${px}px ${font}`;
      const m = g.measureText(text).width, max = cw - 36;
      if (m > max) { px = Math.floor((px * max) / m); g.font = `900 ${px}px ${font}`; }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (!bg) { g.shadowColor = ink; g.shadowBlur = 16; }
      g.fillStyle = ink; g.fillText(text, cw / 2, ch / 2 + 3);
      if (!bg) { g.shadowBlur = 4; g.fillStyle = '#ffffff'; g.globalAlpha = 0.55; g.fillText(text, cw / 2, ch / 2 + 3); g.globalAlpha = 1; }
      g.restore();
    });
  }, { repeat: false });
  const rects = SIGNS.map((_, i) => { const c = i % cols, r = Math.floor(i / cols); return { u0: c / cols, u1: (c + 1) / cols, v0: 1 - (r + 1) / rows, v1: 1 - r / rows }; });
  return { tex, rects };
}
// magazines and papers for the newsstands' windows: a grid of covers under their mastheads
function magsTex() {
  const cw = 64, ch = 88, cols = 8, rows = 4;
  const tex = canvasTex(cw * cols, ch * rows, (g) => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cw, y = r * ch, bg = pick(['#f4f0e8', '#e8d8c8', '#c8202c', '#1f4aa8', '#2a2a30', '#f0c040', '#2a8a5a', '#e86aa0', '#ffffff']);
      g.fillStyle = bg; g.fillRect(x + 2, y + 2, cw - 4, ch - 4);
      g.fillStyle = pick(['#c8202c', '#1a1a1a', '#1f4aa8', '#ffffff']); g.fillRect(x + 4, y + 4, cw - 8, 16);
      g.fillStyle = bg === '#ffffff' || bg === '#f4f0e8' ? '#1a1a1a' : '#ffffff'; g.font = `900 12px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#fff8e8'; g.fillText(pick(MASTHEADS), x + cw / 2, y + 12, cw - 10);
      g.fillStyle = pick(['#d8a080', '#80a8d8', '#a8d880', '#e8c0a0', '#5a6a8a']); g.fillRect(x + 8, y + 26, cw - 16, 34);
      g.fillStyle = 'rgba(0,0,0,0.35)'; for (let k = 0; k < 3; k++) g.fillRect(x + 8, y + 64 + k * 7, cw - 16 - rand(0, 20), 3);
    }
  });
  return tex;
}
// goods behind a kiosk's counter: drinks in the cooler, snacks hanging in bags, fans and souvenirs
function goodsTex() {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#e8e4dc'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 3; row++) for (let k = 0; k < 16; k++) {
      const x = 4 + k * 15.6, y = 6 + row * 40, col = pick(['#c8202c', '#2a8a5a', '#f0c040', '#1f6ab8', '#f4f4f0', '#ff8a2a', '#8a2ac8', '#30c0d0']);
      if (row < 2) { g.fillStyle = col; g.fillRect(x, y + 8, 10, 26); g.fillStyle = '#f4f4f0'; g.fillRect(x + 3, y + 3, 4, 6); }
      else { g.fillStyle = col; roundRect(g, x - 1, y + 4, 14, 30, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x + 2, y + 10, 8, 6); }
    }
  });
}
// sugar paintings: a dragon, a phoenix, a butterfly and a flower, drawn in poured gold candy
function sugarTex() {
  return canvasTex(512, 128, (g) => {
    g.clearRect(0, 0, 512, 128);
    g.strokeStyle = '#f0a830'; g.fillStyle = '#f0a830'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
    const path = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
    // dragon
    g.beginPath(); for (let t = 0; t <= 1; t += 0.02) { const x = 14 + t * 100, y = 64 + Math.sin(t * 12) * 26 * (1 - t * 0.4); t ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    for (let t = 0.1; t < 1; t += 0.1) path([[14 + t * 100, 64 + Math.sin(t * 12) * 26 * (1 - t * 0.4)], [18 + t * 100, 50 + Math.sin(t * 12) * 26 * (1 - t * 0.4)]]);
    g.beginPath(); g.arc(112, 52, 8, 0, 7); g.stroke(); path([[112, 44], [122, 30]]); path([[116, 46], [126, 40]]);
    // phoenix
    g.beginPath(); g.arc(178, 46, 12, 0, 7); g.stroke(); path([[190, 46], [202, 40]]);
    for (let k = 0; k < 5; k++) path([[176, 58], [150 + k * 10, 116 - k * 4], [140 + k * 12, 124]]);
    path([[170, 52], [148, 34], [158, 52]]); path([[186, 54], [214, 30], [200, 56]]);
    // butterfly
    for (const e of [-1, 1]) { g.beginPath(); g.ellipse(320 + e * 26, 50, 24, 18, e * 0.4, 0, 7); g.stroke(); g.beginPath(); g.ellipse(320 + e * 20, 84, 16, 14, -e * 0.4, 0, 7); g.stroke(); }
    path([[320, 30], [320, 104]]); path([[320, 30], [306, 14]]); path([[320, 30], [334, 14]]);
    // flower
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; g.beginPath(); g.ellipse(448 + Math.cos(a) * 24, 54 + Math.sin(a) * 24, 14, 8, a, 0, 7); g.stroke(); }
    g.beginPath(); g.arc(448, 54, 8, 0, 7); g.fill(); path([[448, 80], [448, 124]]);
  }, { repeat: false });
}
// the sugar painter's wheel: twelve painted sectors with the zodiac animals, a gold rim
function wheelTex() {
  return canvasTex(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    for (let k = 0; k < 12; k++) {
      g.fillStyle = ['#e8402a', '#f0c040', '#3a9a5a', '#2a7ad8'][k % 4];
      g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 120, (k / 12) * Math.PI * 2, ((k + 1) / 12) * Math.PI * 2); g.closePath(); g.fill();
      const a = ((k + 0.5) / 12) * Math.PI * 2;
      g.fillStyle = '#ffffff'; g.font = `900 26px ${BRUSH}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ZODIAC[k], 128 + Math.cos(a) * 88, 128 + Math.sin(a) * 88);
    }
    g.strokeStyle = '#d8a830'; g.lineWidth = 9; g.beginPath(); g.arc(128, 128, 122, 0, 7); g.stroke();
    g.fillStyle = '#d8a830'; g.beginPath(); g.arc(128, 128, 14, 0, 7); g.fill();
  }, { repeat: false });
}
// a light's reflection on rippled water: bright where it leaves the light, broken into dashes, fading toward the viewer
function streakTex() {
  return canvasTex(64, 256, (g, w, h) => {
    g.fillStyle = '#000000'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
      const t = y / h, a = Math.pow(1 - t, 0.8) * (0.35 + 0.65 * Math.random()), half = (w / 2) * (0.25 + 0.75 * Math.random()) * (1 - t * 0.4);
      const gr = g.createLinearGradient(w / 2 - half, 0, w / 2 + half, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(w / 2 - half, h - y - 2, half * 2, 2);
    }
  }, { repeat: false });
}
// a round tower's glass, its UVs tiling the window texture in metres (open: a dome or a crown closes the top)
export function roundGeo(r, h, tex, cellW = 1.6, cellH = 3.6) {
  const g = new THREE.CylinderGeometry(r, r, h, 18, 1, true); g.translate(0, h / 2, 0);
  const uv = g.attributes.uv, C = 2 * Math.PI * r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * C) / (tex.cols * cellW), (uv.getY(i) * h) / (tex.rows * cellH));
  return g;
}

export function makeKit(S, { treeKit } = {}) {
  const K = { S };
  const st = signTex();
  K.signMat = basic({ map: st.tex, color: hdr('#ffffff', 1.05) });
  K.neonMat = basic({ map: st.tex, color: hdr('#ffffff', 1.6), transparent: true, alphaTest: 0.25, depthWrite: false });
  K.sign = (b, i, x, y, z, w, h, ry = 0) => b.add(planeUV(st.rects[i]), SIGNS[i][1] ? K.signMat : K.neonMat, x, y, z, w, h, 1, 0, ry, 0, '#ffffff');
  K.sign2 = (b, i, x, y, z, w, h, ry = 0) => { const ox = 0.012 * Math.sin(ry), oz = 0.012 * Math.cos(ry); K.sign(b, i, x + ox, y, z + oz, w, h, ry); K.sign(b, i, x - ox, y, z - oz, w, h, ry + Math.PI); };   // a board readable from both sides
  const mt = magsTex();
  K.magsMat = std({ map: mt, roughness: 0.6, emissive: '#ffffff', emissiveMap: mt, emissiveIntensity: 0.38 });
  const MAG = [0, 1, 2, 3].map((r) => ({ u0: 0, u1: 1, v0: r / 4, v1: (r + 1) / 4 }));
  K.mags = (b, x, y, z, w, h, ry) => b.add(planeUV(pick(MAG)), K.magsMat, x, y, z, w, h, 1, 0, ry, 0, '#ffffff');
  const gt = goodsTex();
  K.goodsMat = std({ map: gt, roughness: 0.6, emissive: '#ffffff', emissiveMap: gt, emissiveIntensity: 0.5 });
  const sgt = sugarTex();
  K.sugarMat = basic({ map: sgt, color: hdr('#ffffff', 1.35), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
  const SUGAR = [0, 1, 2, 3].map((i) => ({ u0: i / 4, u1: (i + 1) / 4, v0: 0, v1: 1 }));
  K.wheelMat = std({ map: wheelTex(), transparent: true, alphaTest: 0.4, roughness: 0.5, emissive: '#ffffff', emissiveIntensity: 0.25 });
  K.wheelMat.emissiveMap = K.wheelMat.map;
  K.villaTex = windowTex({ wall: '#dcd6c8', glass: '#2a2826', lit: ['#ffd9a0', '#ffcf8a', '#ffe6b8'], litChance: 0.55, frame: '#4a3a2a', cols: 6, rows: 4, arch: true });
  K.villaMat = facadeMat(K.villaTex, { k: 1.0, rough: 0.9 });
  K.officeTex = windowTex({ wall: '#18202c', glass: '#22344a', lit: ['#cfe6ff', '#ffffff', '#ffe8c0'], litChance: 0.4, band: true, cols: 8, rows: 16 });
  K.officeMat = facadeMat(K.officeTex, { k: 1.3, rough: 0.25, metal: 0.6 });
  K.farMat = thinFog(facadeMat(K.officeTex, { k: 1.5, rough: 0.3, metal: 0.5 }), 0.4);
  K.blockMat = facadeMat(K.officeTex, { k: 0.7, rough: 0.5, metal: 0.3 });
  const reflMats = new Map(), streakMap = streakTex();
  K.steams = []; K.steamBuf = [];
  K.flushSteam = (g) => {
    if (K.steamBuf.length) { const m = puffs(K.steamBuf.splice(0), { size: 0.5, grow: 2.2, rise: 2.2, drift: 0.4, life: 3.2, n: 4, color: '#f2f2ee', opacity: 0.3 }); K.steams.push(m); g.add(m); }
    return g;
  };
  K.face = face;

  // ---------- people ----------
  // built cheaply (two legs, the coat, a faceted head and its hair), facing ry (0: toward the approaching runner)
  K.person = (b, x, z, { s = rand(0.92, 1.05), y = 0, ry = rand(-0.5, 0.5), coat = pick(COATS), hanfu = false, vest = false, apron = null, hat = null, parasol = false, phone = false, bag = chance(0.2), kid = false, wreath = false } = {}) => {
    if (kid) s *= 0.62;
    const fx = Math.sin(ry), fz = Math.cos(ry);
    if (hanfu) {
      const c = pick(HANFU);
      b.add(ROBE, VC.solid, x, y + 0.62 * s, z, 0.62 * s, 1.24 * s, 0.56 * s, 0, ry, 0, c);
      b.add(G.box, VC.solid, x, y + 1.2 * s, z, 0.4 * s, 0.5 * s, 0.26 * s, 0, ry, 0, shade(c, 1.06));
      b.add(G.box, VC.solid, x, y + 0.98 * s, z, 0.42 * s, 0.08 * s, 0.28 * s, 0, ry, 0, pick(['#c8202c', '#2a4a8a', '#f4f0e8', '#d8a830']));   // the sash
      for (const e of [-1, 1]) b.add(G.box, VC.solid, x + e * 0.27 * s * fz, y + 1.0 * s, z - e * 0.27 * s * fx, 0.14 * s, 0.6 * s, 0.36 * s, 0, ry, 0, c);   // the wide sleeves hanging
    } else {
      const legs = pick(PANTS);
      for (const e of [-1, 1]) b.add(G.box, VC.solid, x + e * 0.085 * s * fz, y + 0.43 * s, z - e * 0.085 * s * fx, 0.15 * s, 0.86 * s, 0.19 * s, 0, ry, 0, legs);
      b.add(G.box, VC.solid, x, y + 1.17 * s, z, 0.44 * s, 0.68 * s, 0.27 * s, 0, ry, 0, vest ? '#c8f03a' : coat);
      if (vest) b.add(G.box, VC.solid, x, y + 1.08 * s, z, 0.45 * s, 0.05 * s, 0.28 * s, 0, ry, 0, '#e8ecf0');   // the reflective band
      if (apron) b.add(G.box, VC.solid, x + 0.14 * s * fx, y + 0.92 * s, z + 0.14 * s * fz, 0.4 * s, 0.72 * s, 0.02, 0, ry, 0, apron);
    }
    b.add(ICO, VC.solid, x, y + 1.68 * s, z, 0.3 * s, 0.34 * s, 0.3 * s, 0, ry, 0, pick(SKIN));
    b.add(G.box, VC.solid, x - 0.025 * s * fx, y + 1.8 * s, z - 0.025 * s * fz, 0.31 * s, 0.13 * s, 0.31 * s, 0, ry, 0, pick(HAIR));
    if (hanfu) {   // hair up in a bun, a gold pin through it
      b.add(ICO, VC.solid, x - 0.07 * s * fx, y + 1.93 * s, z - 0.07 * s * fz, 0.17 * s, 0.17 * s, 0.17 * s, 0, 0, 0, pick(HAIR));
      b.add(G.box, VC.glow, x - 0.07 * s * fx, y + 1.95 * s, z - 0.07 * s * fz, 0.26 * s, 0.025, 0.025, 0, ry, 0, hdr('#ffd77a', 1.4));
    }
    if (wreath) for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; b.add(ICO, VC.solid, x + Math.cos(a) * 0.15 * s, y + 1.86 * s, z + Math.sin(a) * 0.15 * s, 0.08, 0.06, 0.08, 0, 0, 0, pick(['#ff8ab0', '#ffffff', '#ffd23d', '#c8a0ff'])); }
    if (hat === 'straw') b.add(G.cone8, VC.solid, x, y + 1.93 * s, z, 0.66 * s, 0.2 * s, 0.66 * s, 0, 0, 0, '#d8c08a');
    else if (hat === 'sun') { b.add(G.cyl8, VC.solid, x, y + 1.86 * s, z, 0.62 * s, 0.03, 0.62 * s, 0, 0, 0, '#f0e8d8'); b.add(G.cyl8, VC.solid, x, y + 1.93 * s, z, 0.3 * s, 0.14 * s, 0.3 * s, 0, 0, 0, '#f0e8d8'); }
    else if (hat === 'cap') b.add(G.box, VC.solid, x + 0.05 * s * fx, y + 1.88 * s, z + 0.05 * s * fz, 0.33 * s, 0.1 * s, 0.38 * s, 0, ry, 0, pick(['#f4f4f0', '#1a1a1a', '#c8202c', '#1f4aa8']));
    if (parasol) { b.add(G.cone8, VC.solid, x + 0.08 * s * fz, y + 2.12 * s, z - 0.08 * s * fx, 1.1 * s, 0.28 * s, 1.1 * s, 0, rand(0, 1), 0, pick(PARASOL)); b.box(VC.metal, '#3a3a40', x + 0.08 * s * fz, y + 1.75 * s, z - 0.08 * s * fx, 0.03, 0.75 * s, 0.03); }
    if (phone) b.add(G.box, VC.glow, x + 0.26 * s * fx, y + 1.62 * s, z + 0.26 * s * fz, 0.08, 0.14, 0.02, 0, ry, 0, hdr('#cfe6ff', 1.6));   // held up, taking a picture
    if (bag) b.box(VC.solid, pick(['#141414', '#c8a070', '#8a2a1a', '#f4f0e8', '#2a3a5a', '#e8e0f0']), x + 0.27 * s * fz, y + 0.95 * s, z - 0.27 * s * fx, 0.1, 0.34, 0.32);
  };
  K.seated = (b, x, z, { ry = 0, y = 0, apron = null, hat = null, stool = true } = {}) => {   // someone on a low stool
    const fx = Math.sin(ry), fz = Math.cos(ry);
    if (stool) b.block(VC.solid, pick(['#c8202c', '#1f6ab8', '#3a3a40']), x, y, z, 0.32, 0.4, 0.32);
    b.add(G.box, VC.solid, x + 0.18 * fx, y + 0.5, z + 0.18 * fz, 0.36, 0.14, 0.42, 0, ry, 0, pick(PANTS));
    b.add(G.box, VC.solid, x, y + 0.82, z, 0.42, 0.56, 0.27, 0, ry, 0, pick(COATS));
    if (apron) b.add(G.box, VC.solid, x + 0.14 * fx, y + 0.72, z + 0.14 * fz, 0.38, 0.4, 0.02, 0, ry, 0, apron);
    b.add(ICO, VC.solid, x, y + 1.26, z, 0.3, 0.34, 0.3, 0, ry, 0, pick(SKIN));
    b.add(G.box, VC.solid, x - 0.025 * fx, y + 1.38, z - 0.025 * fz, 0.31, 0.13, 0.31, 0, ry, 0, pick(HAIR));
    if (hat === 'straw') b.add(G.cone8, VC.solid, x, y + 1.5, z, 0.66, 0.2, 0.66, 0, 0, 0, '#d8c08a');
  };
  // tourists strolling between x0 and x1 (distances along the street z0..z1), kept out of the stretches in gaps
  K.strollers = (b, x0, x1, z0, z1, n, { gaps = [], ry = null, parasols = 0.1 } = {}) => {
    for (let i = 0, t = 0; i < n && t < n * 4; t++) {
      const z = rand(z0, z1);
      if (gaps.some(([a, c]) => z > a && z < c)) continue;
      const r = Math.random(), turn = ry === null ? (chance(0.5) ? rand(-0.5, 0.5) : Math.PI + rand(-0.5, 0.5)) : ry + rand(-0.4, 0.4);
      K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -z, { ry: turn, hanfu: r < 0.14, parasol: r >= 0.14 && r < 0.14 + parasols, phone: chance(ry === null ? 0.25 : 0.55), hat: chance(0.12) ? pick(['sun', 'cap']) : null, wreath: r < 0.14 && chance(0.4), kid: chance(0.08) });
      i++;
    }
  };

  // ---------- by West Lake: vendors ----------
  K.sugarArt = (b, x, z, s) => {   // the sugar painter: a steel slab on a red-skirted table, his pictures on a straw bundle, the wheel
    const r = face(s);
    b.block(VC.solid, '#a8141e', x, 0, z, 0.8, 0.78, 1.5);
    b.box(VC.metal, '#d8dce0', x, 0.81, z, 0.82, 0.05, 1.3);
    for (let k = 0; k < 3; k++) b.add(G.box, VC.glow, x + rand(-0.2, 0.2), 0.84, z + rand(-0.4, 0.4), rand(0.1, 0.3), 0.012, 0.03, 0, rand(0, 3), 0, hdr('#f0a830', 1.1));
    K.sign(b, SIGN['非遗 · 糖画'], x - s * 0.41, 0.48, z, 1.3, 0.32, r);
    b.cyl(VC.solid, '#6a4a2a', x + s * 0.15, 0.55, z + 0.95, 0.035, 1.1, 'cyl6');
    b.cyl(VC.solid, '#c8a868', x + s * 0.15, 1.3, z + 0.95, 0.15, 0.5, 'cyl6');
    for (let k = 0; k < 6; k++) {   // the finished pictures stuck into the straw
      const a = (k / 6) * Math.PI * 2, px = x + s * 0.15 + Math.cos(a) * 0.12, pz = z + 0.95 + Math.sin(a) * 0.12, py = 1.62 + (k % 2) * 0.22;
      b.box(VC.solid, '#e8d8b0', px, py - 0.18, pz, 0.012, 0.36, 0.012);
      b.add(planeUV(pick(SUGAR)), K.sugarMat, px, py, pz, 0.34, 0.34, 1, 0, r + rand(-0.4, 0.4), 0, '#ffffff');
    }
    b.box(VC.metal, '#8a8e94', x - s * 0.05, 0.97, z - 0.45, 0.04, 0.26, 0.04);
    b.add(WHEEL, K.wheelMat, x - s * 0.05, 1.12, z - 0.45, 0.62, 0.62, 1, -0.75, r, 0, '#ffffff');   // the wheel tilted toward the customers
    b.add(G.box, VC.metal, x - s * 0.05, 1.12, z - 0.45, 0.04, 0.04, 0.34, 0, r + 0.8, 0, '#d8a830');
    K.seated(b, x + s * 0.7, z - 0.1, { ry: r, apron: '#f4f0e8' });
    if (chance(0.7)) K.person(b, x - s * 0.95, z + rand(-0.5, 0.5), { kid: true, ry: -r });
    if (chance(0.6)) K.person(b, x - s * 1.25, z + rand(-0.6, 0.6), { ry: -r + rand(-0.3, 0.3), phone: true });
  };
  K.lotusSeller = (b, x, z, s) => {   // an old woman in a straw hat by her tricycle piled with lotus pods and a few flowers
    const r = face(s);
    b.block(VC.solid, '#2a5aa8', x, 0.5, z, 0.9, 0.08, 1.3);
    for (const [dx, dz] of [[-0.42, 0.62], [0.42, 0.62], [0, -0.85]]) b.add(G.cyl8, VC.solid, x + dx, 0.32, z + dz, 0.62, 0.05, 0.62, 0, 0, Math.PI / 2, '#1a1a1e');
    b.box(VC.metal, '#3a5a8a', x, 0.62, z - 0.75, 0.06, 0.6, 0.06);
    b.block(VC.solid, '#b89058', x, 0.58, z + 0.05, 0.8, 0.32, 1.1);
    for (let k = 0; k < 16; k++) b.add(G.cone8, VC.solid, x + rand(-0.32, 0.32), 0.98 + rand(0, 0.12), z + 0.05 + rand(-0.45, 0.45), 0.2, 0.15, 0.2, Math.PI, rand(0, 3), 0, pick(['#5a9a3a', '#6aa848', '#4f8a32']));
    for (let k = 0; k < 4; k++) { const px = x + rand(-0.3, 0.3), pz = z + 0.05 + rand(-0.4, 0.4); b.box(VC.solid, '#3a7a2a', px, 1.25, pz, 0.02, 0.5, 0.02); b.add(G.cone8, VC.solid, px, 1.55, pz, 0.16, 0.2, 0.16, 0, 0, 0, pick(['#ff8ab0', '#ffb0c8', '#ffffff'])); }
    K.sign(b, SIGN['新鲜莲蓬'], x - s * 0.47, 0.85, z + 0.05, 0.8, 0.2, r);
    K.seated(b, x + s * 0.3, z - 1.25, { ry: r, hat: 'straw' });
  };
  K.kiosk = (b, x, z, s) => {   // a grey lakeside kiosk: the counter toward the walk, the roof lifting into wide eaves, goods hung under them
    const W = 2.6, D = 1.9, H = 2.45, r = face(s), fx = x - s * (D / 2);
    b.block(VC.solid, '#8c8e8a', x, 0, z, D, H, W);
    b.block(VC.solid, '#6c6e6a', x, 0, z, D + 0.04, 0.15, W + 0.04);
    b.box(VC.glow, hdr('#fff0d0', 0.85), fx - s * 0.01, 1.62, z, 0.02, 0.95, W - 0.5);
    b.add(G.plane, K.goodsMat, fx - s * 0.02, 1.62, z, W - 0.6, 0.9, 1, 0, r, 0, '#ffffff');
    b.block(VC.solid, '#5a5c58', fx - s * 0.2, 0.95, z, 0.42, 0.06, W - 0.2);
    for (let k = 0; k < 7; k++) b.box(VC.solid, pick(['#c8202c', '#2a8a5a', '#f0c040', '#1f6ab8', '#f4f4f0', '#ff8a2a']), fx - s * rand(0.08, 0.3), 1.06, z + rand(-1.0, 1.0), 0.08, 0.2, 0.08);
    // the roof: a thin slab overhanging the front and running out over one side, lifted at its front edge
    b.add(G.box, VC.solid, x - s * 0.35, H + 0.12, z, D + 1.3, 0.08, W + 0.9, 0, 0, s * 0.12, '#6e706c');
    b.add(G.box, VC.solid, x - s * 0.35, H + 0.06, z + (W / 2 + 0.75), D + 0.9, 0.06, 1.2, 0.1, 0, s * 0.12, '#6e706c');
    b.box(VC.glow, hdr('#fff4dc', 1.6), x - s * (D / 2 + 0.7), H - 0.02, z, 0.06, 0.04, W);
    for (let k = 0; k < 9; k++) {   // fans, hats, toys and folded umbrellas hanging along the eave
      const pz = z - W / 2 + 0.2 + k * ((W - 0.4) / 8), px = fx - s * 0.5, kind = k % 4;
      if (kind === 0) b.add(G.cyl, VC.solid, px, H - 0.5, pz, 0.36, 0.02, 0.36, Math.PI / 2, r, 0, pick(['#f4d0d8', '#d8e8f8', '#f8f0d8']));
      else if (kind === 1) b.add(G.cone8, VC.solid, px, H - 0.45, pz, 0.34, 0.12, 0.34, 0, 0, 0, '#e8d8a8');
      else if (kind === 2) b.box(VC.solid, pick(['#ff5a8a', '#5ac8ff', '#ffd23d', '#7aff8a']), px, H - 0.5, pz, 0.14, 0.2, 0.14);
      else b.add(G.cone8, VC.solid, px, H - 0.75, pz, 0.08, 0.7, 0.08, Math.PI, 0, 0, pick(['#c8202c', '#2a4a8a', '#f4f4f0']));
      b.box(VC.solid, '#3a3a3a', px, H - 0.2, pz, 0.01, 0.3, 0.01);
    }
    b.block(VC.solid, '#f4f4f0', fx - s * 0.5, 0, z + W / 2 + 0.6, 0.7, 0.85, 0.9);   // the ice-cream freezer outside
    b.box(VC.glow, hdr('#bfe8ff', 0.8), fx - s * 0.5, 0.86, z + W / 2 + 0.6, 0.6, 0.02, 0.8);
    K.person(b, x - s * 0.1, z + rand(-0.6, 0.6), { ry: r, apron: '#2a6a4a' });
  };
  K.balloons = (b, x, z, s) => {   // a seller with a bunch of lit balloons on strings over his head
    K.person(b, x, z, { ry: face(s) + rand(-0.4, 0.4), hat: 'cap' });
    for (let k = 0; k < 11; k++) {
      const bx = x + rand(-0.6, 0.6), by = rand(2.7, 3.7), bz = z + rand(-0.6, 0.6), col = pick(['#ffb0d0', '#b0e8ff', '#fff0a0', '#c8b0ff', '#b0ffc8', '#ffffff']);
      b.sph(VC.glow, hdr(col, 1.25), bx, by, bz, rand(0.17, 0.24), true);
      const dx = bx - x, dy = by - 1.4, dz = bz - z;   // its string, from the seller's hand
      b.add(G.box, VC.solid, (bx + x) / 2, (by + 1.4) / 2, (bz + z) / 2, 0.01, Math.hypot(dx, dy, dz), 0.01, Math.atan2(Math.hypot(dx, dz), dy), Math.atan2(dx, dz), 0, '#e8e8e8');
    }
    b.box(VC.solid, '#6a4a2a', x - s * 0.3, 0.6, z + 0.5, 0.03, 1.2, 0.03);   // the placard on its stick
    K.sign(b, SIGN['发光气球'], x - s * 0.3, 1.2, z + 0.5, 0.7, 0.18, face(s));
  };
  K.wreaths = (b, x, z, s) => {   // flower crowns hung on a rack, the seller beside them, a girl trying one on
    const r = face(s);
    for (const dz of [-0.7, 0.7]) b.box(VC.metal, '#5a5a60', x, 0.9, z + dz, 0.04, 1.8, 0.04);
    b.box(VC.metal, '#5a5a60', x, 1.75, z, 0.04, 0.04, 1.5);
    for (let k = 0; k < 6; k++) for (const row of [0, 1]) {
      const pz = z - 0.6 + k * 0.24, py = 1.55 - row * 0.45;
      for (let f = 0; f < 6; f++) { const a = (f / 6) * Math.PI * 2; b.add(ICO, VC.solid, x - s * 0.02, py + Math.sin(a) * 0.09, pz + Math.cos(a) * 0.09, 0.07, 0.07, 0.07, 0, 0, 0, pick(['#ff8ab0', '#ffffff', '#ffd23d', '#c8a0ff', '#ff6a6a'])); }
    }
    K.person(b, x + s * 0.5, z - 0.9, { ry: r, wreath: true });
    K.person(b, x - s * 0.7, z + rand(-0.4, 0.4), { ry: -r, hanfu: chance(0.5), wreath: true });
  };
  K.portrait = (b, x, z, s) => {   // a sketcher at his easel, his sitter on a stool, samples on a board
    const r = face(s);
    for (const [dx, dz] of [[-0.25, -0.2], [0.25, -0.2], [0, 0.25]]) b.add(G.box, VC.solid, x + dx, 0.75, z + dz, 0.03, 1.55, 0.03, 0, 0, dx * 0.3, '#7a5a3a');
    b.add(G.box, VC.solid, x, 1.25, z - 0.05, 0.7, 0.55, 0.03, -0.12, r + Math.PI / 2, 0, '#f4f0e8');
    K.seated(b, x + s * 0.0, z + 0.7, { ry: Math.PI });
    K.seated(b, x, z - 1.3, { ry: 0 });
    b.add(G.box, VC.solid, x - s * 0.6, 0.9, z + 0.3, 0.6, 0.8, 0.03, 0, r, 0, '#f4f0e8');
    K.sign(b, SIGN['人像速写'], x - s * 0.62, 1.4, z + 0.3, 0.6, 0.15, r);
  };
  K.serviceDesk = (b, x, z, s) => {   // the scenic area's volunteers: a table in blue cloth, a standing board, fluorescent vests
    const r = face(s);
    b.block(VC.solid, '#2a6ac8', x, 0, z, 0.7, 0.76, 1.6);
    b.box(VC.solid, '#f4f4f0', x, 0.78, z, 0.72, 0.03, 1.62);
    for (let k = 0; k < 4; k++) b.box(VC.solid, pick(['#f4f0e8', '#c8e8d8', '#ffe8a0']), x + rand(-0.2, 0.2), 0.8, z + rand(-0.6, 0.6), 0.2, 0.02, 0.28);
    b.box(VC.solid, '#7a4a24', x - s * 0.1, 1.35, z + 1.1, 0.04, 1.3, 0.8);
    K.sign(b, SIGN['西湖景区 便民服务'], x - s * 0.13, 1.75, z + 1.1, 0.78, 0.2, r);
    K.mags(b, x - s * 0.13, 1.2, z + 1.1, 0.7, 0.6, r);
    K.person(b, x + s * 0.55, z - 0.4, { ry: r, vest: true, hat: 'cap' });
    K.person(b, x - s * 0.7, z + 0.5, { ry: r + rand(-0.5, 0.5), vest: true });
  };
  K.bench = (b, x, z, ry = 0) => {   // a park bench: cast-iron ends, wooden slats
    const c = Math.cos(ry), sn = Math.sin(ry);
    for (const e of [-0.8, 0.8]) b.add(G.box, VC.metal, x + e * c, 0.4, z - e * sn, 0.06, 0.8, 0.5, 0, ry, 0, '#1e1e22');
    for (let k = 0; k < 3; k++) b.add(G.box, VC.solid, x - 0.12 * sn + (k - 1) * 0.13 * sn, 0.46, z - 0.12 * c + (k - 1) * 0.13 * c, 1.8, 0.04, 0.11, 0, ry, 0, '#8a5a34');
    b.add(G.box, VC.solid, x + 0.2 * sn, 0.75, z + 0.2 * c, 1.8, 0.28, 0.04, -0.15, ry, 0, '#8a5a34');
  };

  // ---------- newsstands ----------
  K.newsstand = (b, x, z, s, kind = chance(0.55) ? 'smart' : 'post') => {
    const r = face(s);
    if (kind === 'smart') {   // the self-service kind: dark-green steel, a shallow hipped roof over a deep cornice, glass windows full of magazines
      const W = 3.0, D = 1.6, H = 2.5, fx = x - s * (D / 2);
      b.block(VC.solid, '#1e4a34', x, 0, z, D, H, W);
      b.block(VC.solid, '#16382a', x, 0, z, D + 0.06, 0.18, W + 0.06);
      b.box(VC.solid, '#173c2c', x, H + 0.1, z, D + 0.42, 0.2, W + 0.42);
      b.add(G.cone4, VC.solid, x, H + 0.38, z, (D + 0.36) * 1.42, 0.4, (W + 0.36) * 1.42, 0, 0, 0, '#1e4a34');
      K.sign(b, SIGN['报刊亭'], fx - s * 0.22, H + 0.1, z, 1.3, 0.2, r);
      for (const dz of [-0.95, 0, 0.95]) {   // three glass windows of magazines, lit from inside
        b.box(VC.solid, '#14281e', fx - s * 0.005, 1.35, z + dz, 0.02, 1.7, 0.86);
        K.mags(b, fx - s * 0.02, 1.35, z + dz, 0.78, 1.6, r);
      }
      const endZ = z + W / 2 + 0.01;   // the end toward the runner: the vending cells and the screen
      for (let row = 0; row < 4; row++) for (let c = 0; c < 3; c++) b.box(VC.glow, hdr(pick(['#ffe8b0', '#c8f0ff', '#ffd0d8', '#d8ffd0']), 0.9), x - s * (0.45 - c * 0.3), 0.9 + row * 0.32, endZ, 0.24, 0.24, 0.02);
      b.box(VC.glow, hdr('#7ad8ff', 1.2), x, 2.15, endZ, 0.5, 0.3, 0.02);
      b.box(VC.solid, '#8a5a34', x + s * 0.2, 1.05, z - W / 2 - 0.01, 0.7, 2.0, 0.02);   // the wood-grain door
      b.sph(VC.solid, '#e8e8e8', x - s * (D / 2), H - 0.15, z + W / 2, 0.07, true);
    } else {   // the old post-office kind: the front shutter swung up into an awning, papers pegged along it, magazines in racks
      const W = 2.6, D = 1.5, H = 2.35, fx = x - s * (D / 2);
      b.block(VC.solid, '#2a6a42', x, 0, z, D, H, W);
      b.add(G.box, VC.solid, fx - s * 0.45, H - 0.05, z, 0.95, 0.05, W + 0.1, 0, 0, -s * 0.35, '#2a6a42');
      K.sign(b, SIGN['邮政报刊亭'], fx - s * 0.02, H + 0.22, z, 1.9, 0.38, r);
      b.box(VC.solid, '#2a6a42', fx - s * 0.01, H + 0.22, z, 0.02, 0.46, 2.0);
      b.box(VC.glow, hdr('#fff0d0', 0.75), fx - s * 0.005, 1.45, z, 0.02, 1.1, W - 0.3);
      K.mags(b, fx - s * 0.03, 1.45, z, W - 0.4, 1.05, r);
      b.block(VC.solid, '#5a5a58', fx - s * 0.25, 0.85, z, 0.5, 0.06, W - 0.2);
      for (let k = 0; k < 7; k++) b.box(VC.solid, '#ece6d6', fx - s * rand(0.1, 0.4), 0.92, z - W / 2 + 0.3 + k * 0.33, 0.28, 0.025, 0.36);
      for (let k = 0; k < 6; k++) b.add(G.box, VC.solid, fx - s * 0.62, 1.98, z - W / 2 + 0.35 + k * 0.38, 0.01, 0.42, 0.3, 0, 0, 0, '#ece6d6');   // papers pegged under the awning
      b.box(VC.metal, '#3a3a3a', fx - s * 0.62, 2.2, z, 0.015, 0.015, W);
      b.block(VC.solid, '#c8202c', x, 0, z + W / 2 + 0.38, 0.7, 1.75, 0.65);   // the drinks fridge
      b.box(VC.glow, hdr('#e8f4ff', 0.9), x - s * 0.36, 1.0, z + W / 2 + 0.38, 0.02, 1.2, 0.5);
      K.sign(b, SIGN['体彩'], fx - s * 0.015, 0.55, z - 0.7, 0.5, 0.2, r);
      K.sign(b, SIGN['数据线 口罩 寄存'], fx - s * 0.015, 0.55, z + 0.5, 0.95, 0.22, r);
      K.seated(b, x + s * 0.15, z - 0.3, { ry: r, stool: false, y: 0.15 });
    }
  };

  // ---------- snack carts ----------
  // a steel cart on wheels under a glass hood, its lightbox name on top, the vendor behind, a short queue in front
  K.snackCart = (b, x, z, s, kind = pick(['葱包桧', '定胜糕', '西湖藕粉', '冰淇淋', '糖葫芦', '龙井茶'])) => {
    const r = face(s), W = 1.6, D = 0.8;
    b.block(VC.metal, '#c8ccd0', x, 0.25, z, D, 0.62, W);
    for (const dz of [-0.6, 0.6]) b.add(G.cyl8, VC.solid, x + s * 0.3, 0.2, z + dz, 0.4, 0.05, 0.4, 0, 0, Math.PI / 2, '#1a1a1e');
    b.box(VC.metal, '#a8acb0', x, 0.9, z, D + 0.04, 0.04, W + 0.04);
    if (kind === '冰淇淋') {   // a freezer chest under a big parasol
      b.block(VC.solid, '#f4f4f0', x, 0.92, z, D - 0.1, 0.25, W - 0.2);
      b.box(VC.glow, hdr('#c8f0ff', 0.9), x, 1.18, z, D - 0.2, 0.02, W - 0.3);
      b.box(VC.metal, '#d8d8d8', x + s * 0.3, 1.6, z, 0.04, 2.6, 0.04);
      b.add(G.cone8, VC.solid, x + s * 0.3, 2.85, z, 2.1, 0.5, 2.1, 0, 0, 0, pick(['#5ab8e8', '#ff8ab0', '#ffe08a']));
    } else {
      b.box(VC.glow, hdr('#fff0d0', 0.6), x, 1.25, z, D - 0.05, 0.6, W - 0.05);   // the lit glass hood
      b.box(VC.metal, '#d8dce0', x, 1.57, z, D + 0.04, 0.04, W + 0.04);
      if (kind === '葱包桧') for (let k = 0; k < 5; k++) b.add(G.cyl8, VC.solid, x - s * 0.15, 1.0, z - 0.5 + k * 0.25, 0.1, 0.32, 0.1, Math.PI / 2, 0, 0, '#e8b860');
      if (kind === '定胜糕') { for (let k = 0; k < 3; k++) b.cyl(VC.solid, '#c8a868', x - s * 0.1, 1.68 + k * 0.16, z + 0.3, 0.26, 0.14, 'cyl8'); for (let k = 0; k < 5; k++) b.box(VC.solid, '#f8a8c0', x - s * 0.15, 0.97, z - 0.5 + k * 0.17, 0.1, 0.06, 0.12); K.steamBuf.push([x - s * 0.1, 2.15, z + 0.3]); }
      if (kind === '西湖藕粉') { b.cyl(VC.metal, '#c8a050', x - s * 0.1, 1.85, z + 0.4, 0.2, 0.55, 'cyl8'); for (let k = 0; k < 4; k++) b.cyl(VC.solid, '#f4f0e8', x - s * 0.15, 0.98, z - 0.5 + k * 0.22, 0.08, 0.08, 'cyl8'); K.steamBuf.push([x - s * 0.1, 2.2, z + 0.4]); }
      if (kind === '糖葫芦') { b.cyl(VC.solid, '#d8c088', x - s * 0.1, 2.0, z + 0.35, 0.12, 0.7, 'cyl6'); for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; for (let j = 0; j < 4; j++) b.sph(VC.glow, hdr('#e8202a', 1.1), x - s * 0.1 + Math.cos(a) * (0.16 + j * 0.07), 2.05 + j * 0.06, z + 0.35 + Math.sin(a) * (0.16 + j * 0.07), 0.04, true); } }
      if (kind === '龙井茶') { b.cyl(VC.metal, '#c8ccd0', x - s * 0.1, 1.85, z + 0.4, 0.18, 0.5, 'cyl8'); for (let k = 0; k < 5; k++) b.cyl(VC.glow, hdr('#d8e8a0', 0.8), x - s * 0.15, 0.98, z - 0.5 + k * 0.18, 0.05, 0.1, 'cyl8'); K.steamBuf.push([x - s * 0.1, 2.15, z + 0.4]); }
    }
    K.sign2(b, SIGN[kind], x, kind === '冰淇淋' ? 1.29 : 1.71, z - 0.35, 0.9, 0.24, 0);   // the lightbox standing on the hood
    K.sign(b, SIGN[kind], x - s * (D / 2 + 0.01), 0.55, z, 1.2, 0.3, r);
    K.person(b, x + s * 0.75, z + rand(-0.3, 0.3), { ry: r, apron: pick(['#f4f0e8', '#c8202c', '#2a4a8a']), hat: chance(0.4) ? 'cap' : null });
    for (let k = randi(0, 3); k > 0; k--) K.person(b, x - s * rand(0.85, 1.2), z - 0.4 + k * 0.6, { ry: -r + rand(-0.4, 0.4), phone: chance(0.4), parasol: chance(0.2) });
  };

  // ---------- street furniture ----------
  K.lampWL = (b, x, z, { pool = true } = {}) => {   // West Lake's black lamp: a slim post, a square lantern with a pyramid cap
    b.cyl(VC.metal, '#1a1a1e', x, 0.25, z, 0.14, 0.5, 'cyl8');
    b.cyl(VC.metal, '#1a1a1e', x, 1.9, z, 0.06, 3.0, 'cyl8');
    b.box(VC.glow, hdr('#ffe0a8', 2.2), x, 3.62, z, 0.34, 0.46, 0.34);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.box(VC.metal, '#141416', x + dx * 0.18, 3.62, z + dz * 0.18, 0.04, 0.5, 0.04);
    b.add(G.cone4, VC.metal, x, 4.0, z, 0.62, 0.26, 0.62, 0, 0, 0, '#141416');
    b.sph(VC.metal, '#141416', x, 4.18, z, 0.06, true);
    if (pool) b.addM(DISC, VC.glowAdd, new THREE.Matrix4().makeScale(3.0, 1, 3.0).setPosition(x, 0.05, z), hdr('#ffd9a0', 0.07));
  };
  K.bins = (b, x, z, s) => {   // the four sorting bins: recyclables, hazardous, kitchen, other
    ['#1f5ab8', '#c8202c', '#2a8a4a', '#5a5e62'].forEach((c, k) => { b.block(VC.solid, c, x, 0, z - 0.75 + k * 0.5, 0.42, 0.85, 0.42); b.box(VC.solid, shade(c, 0.7), x, 0.88, z - 0.75 + k * 0.5, 0.44, 0.06, 0.44); });
  };
  K.hydrant = (b, x, z) => { b.cyl(VC.solid, '#c8202c', x, 0.4, z, 0.13, 0.8, 'cyl8'); b.sph(VC.solid, '#c8202c', x, 0.82, z, 0.13, true); b.add(G.cyl8, VC.solid, x, 0.55, z, 0.1, 0.4, 0.1, 0, 0, Math.PI / 2, '#a81818'); };
  K.signpost = (b, x, z, s, i = SIGN['断桥 →']) => { b.box(VC.metal, '#4a3a2a', x, 1.2, z, 0.08, 2.4, 0.08); K.sign2(b, i, x, 2.15, z, 1.0, 0.25, 0); };
  K.bikes = (b, x, z0, n, s) => {   // the city's red public bikes in their docks, angled to the street, white baskets
    const r = face(s);
    b.block(VC.solid, '#7a7c80', x + s * 0.4, 0, z0 - (n * 0.72) / 2 + 0.36, 0.3, 0.12, n * 0.72);
    for (let k = 0; k < n; k++) {
      const z = z0 - k * 0.72, a = r + s * 0.5, ca = Math.cos(a), sa = Math.sin(a);
      b.box(VC.metal, '#8a8e94', x + s * 0.45, 0.45, z, 0.1, 0.9, 0.1);
      b.box(VC.solid, '#d8202a', x + s * 0.45, 0.88, z, 0.14, 0.08, 0.14);
      if (chance(0.15)) continue;   // an empty dock
      for (const e of [-0.48, 0.48]) b.add(G.cyl8, VC.solid, x + e * sa, 0.33, z + e * ca, 0.62, 0.04, 0.62, 0, a, Math.PI / 2, '#1a1a1e');
      b.add(G.box, VC.solid, x, 0.55, z, 0.05, 0.08, 0.95, 0.15, a, 0, '#d8202a');
      b.add(G.box, VC.solid, x - 0.1 * sa, 0.75, z - 0.1 * ca, 0.05, 0.42, 0.06, 0, a, 0, '#d8202a');
      b.add(G.box, VC.solid, x - 0.18 * sa, 0.98, z - 0.18 * ca, 0.12, 0.05, 0.24, 0, a, 0, '#1a1a1e');
      b.add(G.box, VC.solid, x + 0.42 * sa, 0.92, z + 0.42 * ca, 0.32, 0.22, 0.26, 0, a, 0, '#f4f4f0');   // the basket
      b.add(G.box, VC.metal, x + 0.36 * sa, 1.08, z + 0.36 * ca, 0.5, 0.03, 0.03, 0, a + Math.PI / 2, 0, '#2a2a2e');
    }
    b.block(VC.solid, '#e8e8e8', x + s * 0.4, 0, z0 + 0.9, 0.5, 1.6, 0.5);   // the dock's card reader
    K.sign(b, SIGN['公共自行车'], x + s * 0.4, 1.75, z0 + 0.9, 0.9, 0.22, 0);
  };
  K.busStop = (b, x, z, s) => {   // a slim steel shelter, glass roof, a lit poster, the stop's name, people waiting
    const r = face(s);
    for (const dz of [-1.6, 1.6]) b.box(VC.metal, '#5a5e64', x + s * 0.5, 1.3, z + dz, 0.08, 2.6, 0.08);
    b.box(VC.metal, '#3a3e44', x, 2.62, z, 1.6, 0.06, 3.6);
    b.box(VC.glow, hdr('#e8f4ff', 0.5), x, 2.58, z, 1.4, 0.02, 3.3);
    b.box(VC.glow, hdr('#fff8ec', 1.0), x + s * 0.5, 1.4, z + 1.0, 0.04, 1.6, 1.0);
    K.mags(b, x + s * 0.47, 1.4, z + 1.0, 0.9, 1.5, r);
    b.block(VC.solid, '#7a7c80', x + s * 0.3, 0, z - 0.4, 0.4, 0.45, 2.0);
    K.sign2(b, SIGN['公交站'], x - s * 0.5, 2.95, z - 1.6, 0.8, 0.22, 0);
    b.box(VC.metal, '#5a5e64', x - s * 0.5, 1.5, z - 1.6, 0.06, 3.0, 0.06);
    for (let k = randi(1, 3); k > 0; k--) K.person(b, x + rand(-0.2, 0.2), z + rand(-1.2, 0.8), { ry: r + rand(-0.5, 0.5), phone: chance(0.5) });
  };
  K.tourCart = (b, x, z, s) => {   // a West Lake sightseeing cart: white, open sides, rows of benches under a canopy, tourists aboard
    const L = 5.2, W = 1.5;
    b.block(VC.solid, '#f4f4f0', x, 0.28, z, W, 0.5, L);
    b.box(VC.solid, '#2a8a5a', x, 0.66, z, W + 0.02, 0.1, L + 0.02);
    for (const [dx, dz] of [[-0.65, -1.8], [0.65, -1.8], [-0.65, 1.8], [0.65, 1.8]]) b.add(G.cyl8, VC.solid, x + dx, 0.3, z + dz, 0.56, 0.18, 0.56, 0, 0, Math.PI / 2, '#1a1a1e');
    for (let k = 0; k < 4; k++) { b.block(VC.solid, '#2a8a5a', x, 0.78, z - 1.6 + k * 1.05, W - 0.1, 0.35, 0.32); if (chance(0.7)) K.seated(b, x + rand(-0.4, 0.4), z - 1.4 + k * 1.05, { ry: 0, y: 0.3, stool: false }); }
    for (const [dx, dz] of [[-0.7, -2.5], [0.7, -2.5], [-0.7, 2.5], [0.7, 2.5]]) b.box(VC.metal, '#d8d8d8', x + dx, 1.55, z + dz, 0.05, 1.6, 0.05);
    b.box(VC.solid, '#f4f4f0', x, 2.38, z, W + 0.1, 0.1, L + 0.1);
    b.box(VC.solid, '#2a8a5a', x, 2.3, z, W + 0.12, 0.08, L + 0.12);
    for (const e of [-0.5, 0.5]) b.box(VC.glow, hdr('#fff4dc', 3), x + e, 0.55, z + L / 2 + 0.01, 0.2, 0.12, 0.02);
    K.seated(b, x - 0.3, z + 2.0, { ry: 0, y: 0.3, stool: false });
  };

  // ---------- the plane-tree avenues ----------
  // the villa walls of Beishan Street along x = s·xw: whitewashed, under a cap of dark tiles, on a granite course; gates
  // between stone piers with their plaques; returns the gates' distances
  K.villaWall = (b, s, z0, z1, { xw = 11.4, h = 2.7, gates = true } = {}) => {
    const out = [];
    let z = z0;
    while (z < z1 - 1) {
      const gate = gates && z > z0 + 6 && z < z1 - 8 && chance(0.4), len = gate ? 4.2 : Math.min(z1 - z, rand(12, 22));
      const zc = -(z + len / 2), x = s * xw;
      if (gate) {
        for (const e of [-1, 1]) { b.block(VC.solid, '#8a8780', x, 0, zc + e * 1.9, 0.75, 3.3, 0.75); b.add(G.cone4, VC.solid, x, 3.5, zc + e * 1.9, 1.3, 0.4, 1.3, 0, 0, 0, '#2b2f36'); }
        b.block(VC.solid, '#2a2420', x + s * 0.2, 0, zc, 0.12, 2.4, 3.0);
        for (let k = 0; k < 10; k++) b.box(VC.metal, '#1a1a1e', x - s * 0.02, 1.2, zc - 1.35 + k * 0.3, 0.04, 2.4, 0.04);
        K.sign(b, SIGN[pick(['秋水山庄', '坚匏别墅', '静逸别墅'])], x - s * 0.39, 2.75, zc + 1.9, 0.62, 0.17, face(s));
        b.box(VC.glow, hdr('#ffe0a8', 1.8), x - s * 0.4, 3.1, zc - 1.9, 0.12, 0.2, 0.12);
        out.push(z + len / 2);
      } else {
        b.block(VC.solid, '#8a8780', x, 0, zc, 0.5, 0.5, len);
        b.block(VC.solid, pick(['#e8e4da', '#e2ddd2', '#ece8e0']), x, 0.5, zc, 0.36, h - 0.5, len);
        b.box(VC.solid, '#2b2f36', x, h + 0.08, zc, 0.62, 0.16, len + 0.05);
        b.add(G.box, VC.solid, x, h + 0.22, zc, 0.36, 0.24, len, 0, 0, Math.PI / 4, '#262a30');
        if (len > 14 && chance(0.6)) for (const dz of [-len / 4, len / 4]) b.add(G.cyl8, VC.solid, x - s * 0.19, 1.6, zc + dz, 0.8, 0.04, 0.8, Math.PI / 2, Math.PI / 2, 0, '#5a5a5e');   // round lattice windows
      }
      z += len;
    }
    return out;
  };
  // a villa set back on its terrace: two or three floors of white stucco or grey brick under a hipped roof, warm windows
  K.villa = (b, s, x, z, { w = rand(12, 18), d = rand(9, 13), floors = randi(2, 3), terrace = rand(0.8, 2.6) } = {}) => {
    const h = floors * 3.3, tint = pick(['#ffffff', '#e8e4dc', '#c8c4bc', '#d8c8b8']);
    b.block(VC.solid, '#7a7870', x, 0, z, d + 3, terrace, w + 3);
    b.addM(buildingGeo(d, h, w, K.villaTex, 2.0, 3.3), K.villaMat, at(x, terrace, z), tint);
    b.add(G.cone4, VC.solid, x, terrace + h + 1.1, z, (d + 1.4) * 1.42, 2.2, (w + 1.4) * 1.42, 0, 0, 0, pick(['#8a3a2a', '#3a3a40', '#6a2e24']));
    b.box(VC.solid, '#e8e4dc', x, terrace + h + 0.1, z, d + 0.5, 0.2, w + 0.5);
    b.block(VC.solid, '#8a5a4a', x + rand(-2, 2), terrace + h + 0.6, z + rand(-3, 3), 0.7, 2.0, 0.7);
    if (chance(0.5)) { b.block(VC.solid, '#e8e4dc', x - s * (d / 2 + 0.9), terrace, z, 1.8, 0.2, w * 0.5); for (let k = 0; k < 6; k++) b.box(VC.solid, '#e8e4dc', x - s * (d / 2 + 1.75), terrace + 0.6, z - w * 0.22 + k * w * 0.088, 0.1, 0.9, 0.1); }
  };

  // ---------- the Qiantang ----------
  // a light's reflection on the water, drawn out toward the approaching runner and stopped at the embankment (x0)
  K.refl = (b, x, z, len, w, col, { y = -0.76, x0 = 11.4 } = {}) => {
    let m = reflMats.get(col);
    if (!m) reflMats.set(col, (m = basic({ map: streakMap, color: hdr(col, 0.9), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
    K.streak(b, m, x, z, len, w, null, { y, x0 });
  };
  K.streak = (b, mat, x, z, len, w, tint, { y = -0.76, x0 = 11.4 } = {}) => {
    const dx = -x, dz = 40, d = Math.hypot(dx, dz), L = Math.min(len, ((Math.abs(x) - x0) * d) / Math.abs(dx));
    if (L > 2) b.add(G.plane, mat, x + (dx / d) * L / 2, y, z + (dz / d) * L / 2, w, L, 1, -Math.PI / 2, Math.atan2(-dx, -dz), 0, tint || '#ffffff');
  };
  // a tower of Qianjiang New City on side s: dark glass banded with lit floors, the lobby glowing, a crown of light, red
  // lights on the roof and a red neon name; the faces toward the track and toward the runner play the light show.
  // kinds: slab, sail (a raked crown), round (a cylinder under a dome), twin (two round towers on one podium)
  K.tower = (b, x, z, { s, w = rand(18, 26), d = rand(16, 24), h = rand(70, 140), kind = pick(['slab', 'slab', 'sail', 'round', 'twin']), far = false, show = far ? S.far : S.street, name = chance(0.55), bright = rand(0.85, 1.1), refl = false } = {}) => {
    const mat = far ? K.farMat : K.officeMat, tint = pick(['#ffffff', '#d8e8ff', '#e8f0ff']), lo = 5;
    const crown = hdr(pick(['#bfe8ff', '#ffffff', '#ffd27a', '#ff9ad5']), 1.5);
    if (kind === 'round' || kind === 'twin') {
      const parts = kind === 'twin' ? [[z + d * 0.25, w * 0.3, h], [z - d * 0.28, w * 0.28, h * rand(0.78, 0.9)]] : [[z, w * 0.46, h]];
      b.block(VC.solid, '#20262e', x, 0, z, w * 0.9, 6, d * 1.1);
      for (const [pz, r, hh] of parts) {
        b.addM(roundGeo(r, hh, K.officeTex), mat, at(x, 0, pz), tint);
        b.add(G.sphLow, VC.solid, x, hh, pz, r * 2, r * 1.3, r * 2, 0, 0, 0, '#1a2230');
        b.add(G.cyl, VC.glow, x, hh - 0.6, pz, r * 2 + 0.2, 0.5, r * 2 + 0.2, 0, 0, 0, crown);
        b.box(VC.glow, hdr('#ff2a2a', 3), x, hh + r * 0.62, pz, 0.35, 0.35, 0.35);
        const t0 = s > 0 ? -Math.PI / 2 - 0.35 : -0.35, tl = Math.PI / 2 + 0.7, H = hh - lo - 4;
        const g = new THREE.CylinderGeometry(r + 0.08, r + 0.08, H, 14, 1, true, t0, tl);
        b.addM(g, show, at(x, lo + H / 2, pz), S.tint(s > 0 ? pz - r : -(pz + r), bright, r * tl));
      }
      if (refl) K.streak(b, S.refl, x - s * (w * 0.46), z, 140, w * 0.6, S.tint(-(z + w * 0.46), bright, w * 0.9));
    } else {
      b.addM(buildingGeo(w, h, d, K.officeTex, 1.6, 3.6), mat, at(x, 0, z), tint);
      b.box(VC.glow, hdr('#ffe2b8', 0.85), x, 2.4, z, w + 0.08, 3.6, d + 0.08);
      b.box(VC.glow, crown, x, h - 0.6, z, w + 0.14, 0.5, d + 0.14);
      if (kind === 'sail') {   // the crown raked up toward the river, a line of light along its edge
        b.add(G.box, VC.solid, x, h + 4, z, w * 0.96, 9, d * 0.96, 0, 0, s * 0.42, '#1a2230');
        b.add(G.box, VC.glow, x + s * 0.4, h + 7.6, z + d * 0.48, w * 1.0, 0.25, 0.25, 0, 0, s * 0.42, crown);
      }
      for (const [dx, dz] of [[-1, -1], [1, 1]]) b.box(VC.glow, hdr('#ff2a2a', 3), x + dx * w * 0.42, h + 0.17, z + dz * d * 0.42, 0.35, 0.35, 0.35);
      const H = h - lo - 3.5, xf = x - s * (w / 2 + 0.08);
      b.add(G.plane, show, xf, lo + H / 2, z, d * 0.96, H, 1, 0, face(s), 0, S.tint(s > 0 ? z - d / 2 : -(z + d / 2), bright, d));   // the face toward the track
      b.add(G.plane, show, x, lo + H / 2, z + d / 2 + 0.08, w * 0.96, H, 1, 0, 0, 0, S.tint(x - w / 2, bright, w));                    // the face toward the runner
      if (refl) K.streak(b, S.refl, xf - s * 1, z, 140, d * 0.8, S.tint(s > 0 ? z - d / 2 : -(z + d / 2), bright, d));
    }
    if (name) K.sign(b, pick(NEON), x, h - 2.6, z + (kind === 'round' || kind === 'twin' ? w * 0.48 : d / 2 + 0.2), Math.min(w * 0.7, 16), Math.min(w * 0.7, 16) / 4, 0);
  };
  // the riverside park on side s: a red cycle lane by the walk, a lawn of camphor trees lit from below, tall lamps, benches
  K.riverPark = (b, s, z0, z1, { x1 = 26, trees = true } = {}) => {
    const L = z1 - z0, zc = -(z0 + z1) / 2;
    b.box(VC.solid, '#8a3a2e', s * 8.7, 0.035, zc, 3.4, 0.02, L);
    for (const e of [-1, 1]) b.box(VC.solid, '#e8e4dc', s * (8.7 + e * 1.62), 0.05, zc, 0.08, 0.02, L);
    b.box(VC.solid, '#2c4a2e', s * (10.75 + (x1 - 10.75) / 2), 0.03, zc, x1 - 10.75, 0.04, L);
    for (let z = z0 + rand(4, 9); z < z1 - 2; z += rand(16, 20)) {   // the tall lamps along the cycle lane: a slim pole, a long LED head
      b.cyl(VC.metal, '#c8ccd0', s * 10.6, 4, -z, 0.07, 8, 'cyl8');
      b.box(VC.glow, hdr('#e8f4ff', 2.6), s * 9.6, 7.95, -z, 2.0, 0.08, 0.22);
      b.box(VC.metal, '#c8ccd0', s * 10.1, 8.05, -z, 1.1, 0.06, 0.06);
      b.addM(DISC, VC.glowAdd, new THREE.Matrix4().makeScale(3.6, 1, 3.6).setPosition(s * 9.4, 0.06, -z), hdr('#dfeeff', 0.05));
    }
    if (trees && treeKit) for (let z = z0 + rand(3, 7); z < z1 - 3; z += rand(9, 13)) {
      const tx = s * rand(14, x1 - 3);
      treeKit.camphor(b, tx, -z, rand(1.0, 1.3));
      b.addM(DISC, VC.glowAdd, new THREE.Matrix4().makeScale(3.0, 1, 3.0).setPosition(tx, 0.06, -z), hdr('#ffd9a0', 0.1));
    }
    for (let z = z0 + rand(6, 12); z < z1 - 3; z += rand(20, 28)) K.bench(b, s * 11.6, -z, s > 0 ? Math.PI / 2 : -Math.PI / 2);   // facing the river
  };
  // the far bank across the river: its embankment lights, low towers playing the show, their light streaking the water
  K.farBank = (b, { x0 = 118, n = randi(3, 5), z0 = 4, z1 = 76 } = {}) => {
    b.box(VC.solid, '#1a1e24', -(x0 + 70), -0.3, -40, 140, 0.6, 80);
    b.box(VC.glow, hdr('#ffe0b0', 1.6), -(x0 + 0.4), -0.18, -40, 0.3, 0.12, 80);
    for (let k = 0, z = z0; k < n && z < z1; k++) {
      const w = rand(16, 26), d = rand(12, 20), zc = z + d / 2;
      if (zc + d / 2 > z1) break;
      K.tower(b, -(x0 + 8 + w / 2 + rand(0, 14)), -zc, { s: -1, w, d, h: rand(40, 110), kind: pick(['slab', 'slab', 'round', 'sail']), far: true, name: chance(0.4), refl: true });
      z += d + rand(6, 14);
    }
  };
  K.tideSign = (b, x, z, s) => { b.box(VC.metal, '#5a5e64', x, 0.9, z, 0.08, 1.8, 0.08); K.sign2(b, SIGN['涌潮危险 请勿下堤'], x, 1.65, z, 1.4, 0.4, 0); };
  // a river cruise boat: two decks of lit windows, LED lines along its edges, its lights trailing on the water
  K.cruise = (b, x, z, { len = rand(26, 34) } = {}) => {
    const W = 7;
    b.block(VC.solid, '#1e2a3a', x, -1.1, z, W, 1.6, len);
    b.block(VC.solid, '#f0f0ea', x, 0.5, z, W - 0.6, 2.2, len - 4);
    b.box(VC.glow, hdr('#ffe8c0', 1.0), x, 1.4, z, W - 0.56, 0.8, len - 5);
    b.block(VC.solid, '#f0f0ea', x, 2.7, z, W - 1.4, 1.8, len - 10);
    b.box(VC.glow, hdr('#fff0d8', 1.1), x, 3.5, z, W - 1.36, 0.6, len - 11);
    for (const [y, c] of [[0.55, '#5ae0ff'], [2.75, '#ff7ab8'], [4.55, '#ffd27a']]) for (const e of [-1, 1]) b.box(VC.glow, hdr(c, 2.4), x + e * (W / 2 - (y > 2 ? 0.7 : 0.3)), y, z, 0.08, 0.08, len - (y > 2 ? 10 : 4));
    b.block(VC.solid, '#f0f0ea', x, 4.5, z - len / 2 + 7, 2.4, 1.4, 3);
    K.refl(b, x, z, 60, 4, '#ffd9a8', { x0: 11.6 });
    K.refl(b, x, z - 6, 50, 2, '#5ae0ff', { x0: 11.6 });
  };
  K.glowSeller = (b, x, z, s) => {   // a night vendor: lit balloons, glowing rabbit-ear headbands on a pole, a bubble gun
    K.balloons(b, x, z, s);
    b.box(VC.metal, '#5a5a60', x + 0.4, 1.3, z - 0.3, 0.04, 2.6, 0.04);
    for (let k = 0; k < 6; k++) b.box(VC.glow, hdr(pick(['#ff7ab8', '#7ae0ff', '#fff07a']), 1.8), x + 0.4 + rand(-0.15, 0.15), 1.6 + k * 0.16, z - 0.3 + rand(-0.15, 0.15), 0.06, 0.14, 0.02);
  };
  // the new city on side s: a front row of towers behind the park and a taller row behind it, all playing the show
  K.cityRow = (b, s, { front = true, back = true, x0 = 27, show, bright = 1, names = 0.55, z0 = 0, z1 = 80 } = {}) => {
    if (front) for (let z = z0 + rand(2, 8); z < z1 - 8; ) {
      const w = rand(16, 24), d = rand(14, 22);
      if (z + d > z1 - 1) break;
      K.tower(b, s * (x0 + rand(0, 5) + w / 2), -(z + d / 2), { s, w, d, h: rand(55, 120), show, bright: bright * rand(0.85, 1.1), name: chance(names) });
      z += d + rand(10, 18);
    }
    if (back) for (let z = z0 + rand(0, 10); z < z1 - 8; ) {
      const w = rand(20, 30), d = rand(18, 26);
      if (z + d > z1 - 1) break;
      K.tower(b, s * (x0 + 25 + rand(0, 10) + w / 2), -(z + d / 2), { s, w, d, h: chance(0.15) ? rand(220, 290) : rand(110, 200), show, bright: bright * rand(0.85, 1.1), name: chance(names) });
      z += d + rand(8, 16);
    }
  };
  // people at the railing looking across the river, phones up for the show
  K.spectators = (b, x0, x1, z0, z1, n, s = -1, gaps = []) => K.strollers(b, x0, x1, z0, z1, n, { gaps, ry: face(-s), parasols: 0 });

  K.update = (t) => { for (const m of K.steams) m.userData.update(t); };
  return K;
}
