// Beijing street kit: Chinese roofs, hutong walls and courtyard gates, old shopfronts with plaques and lanterns,
// red palace walls, archways (牌楼), Chang'an Avenue lamps, ring-road overpasses with light trails, street life.
import { THREE, VC, G, std, basic, hdr, windowTex, signAtlas, planeUV, canvasTex, rand, randi, pick, chance } from '../core.js';
import { facadeMat, buildingRow, screenMat, at } from './common.js';
import { beam, wire } from './tokyo_kit.js';
import { ginkgoKit } from './trees.js';

export const CN = '"Ma Shan Zheng", "STKaiti", "KaiTi", serif';                                  // calligraphy
export const CN_SIGN = '"ZCOOL QingKe HuangYou", "PingFang SC", "Microsoft YaHei", sans-serif';   // modern signs
export const VERM = '#b8302a';     // vermilion columns and doors
export const MARBLE = '#e6e2d8';   // white marble (汉白玉)

const PLAQUES = ['烤鸭', '涮肉', '茶庄', '饽饽铺', '绸布庄', '酱园', '书局', '药铺', '茶馆', '古玩', '炸酱面', '豆汁儿'];
const BANNERS = [
  { t: '酒', bg: '#b8262a' }, { t: '茶', bg: '#1f4f8a' }, { t: '面', bg: '#e8b84a', fg: '#3a1a10' }, { t: '饭', bg: '#b8262a' },
  { t: '当', bg: '#2a2a2e', fg: '#ffd77a' }, { t: '布', bg: '#2a7a5a' }, { t: '药', bg: '#7a1b1b' }, { t: '烟', bg: '#4a2a1a', fg: '#ffd77a' },
];
const HUTONGS = [['帽儿胡同', "MAO'ER HUTONG"], ['菊儿胡同', "JU'ER HUTONG"], ['雨儿胡同', "YU'ER HUTONG"],
  ['福祥胡同', 'FUXIANG HUTONG'], ['黑芝麻胡同', 'HEIZHIMA HUTONG'], ['东棉花胡同', 'DONGMIANHUA HUTONG']];
const COUPLETS = [['国泰民安', '家和业兴'], ['春风送暖', '福满人间'], ['吉星高照', '紫气东来']];
const H_SIGNS = [
  { text: '火锅', color: '#ff3b3b' }, { text: '烧烤', color: '#ffb13d', border: true }, { text: 'KTV', color: '#ff3df0' },
  { text: '24小时', color: '#39ff88', border: true }, { text: '奶茶', color: '#ff9ad5' }, { text: '北京', color: '#ff2d55', border: true },
  { text: '酒吧', color: '#b26bff' }, { text: '便利店', color: '#3dfff0', border: true }, { text: 'LIVE', color: '#ffd23d' },
  { text: '咖啡', color: '#ffcf8a', border: true }, { text: '书店', color: '#7cf8ff' }, { text: '撸串', color: '#ff6a3d', border: true },
].map((e) => ({ ...e, font: CN_SIGN, weight: 400 }));
const ADS = [
  { bg: ['#d7262e', '#7a0a1a'], text: '北京', sub: 'BEIJING · 金秋', icon: 'moon' },
  { bg: ['#ffb000', '#ff3d00'], text: '烤鸭', sub: '老字号 · 片皮鸭', icon: 'steam' },
  { bg: ['#1a1440', '#5a2a8a'], text: '京剧', sub: 'PEKING OPERA 今晚', icon: 'stars' },
  { bg: ['#00c2ff', '#0040ff'], text: '国潮', sub: 'GUOCHAO 新品', icon: 'bubbles' },
  { bg: ['#141414', '#3a0a0a'], text: '5折', sub: '双十一 SALE', icon: 'bar', fg: '#ffd23d' },
  { bg: ['#12c27e', '#04402c'], text: 'CITY DASH', sub: '城市酷跑', icon: 'bolt' },
  { bg: ['#ff5fa2', '#ffd23d'], text: '中秋', sub: '月饼 MOONCAKE', icon: 'moon' },
  { bg: ['#f2f4ff', '#a9b8ff'], text: '冰糖葫芦', sub: 'TANGHULU 酸甜', icon: 'haws', fg: '#b8262a' },
];
const PAILOU = ['东四', '西四', '国子监', '成贤街'];
const EXTRA = '前门大街正阳门五牌楼天安门长安街故宫角楼天坛祈年殿皇穹宇什刹海后海鼓楼钟楼银锭桥鸟巢水立方中国尊央视国贸东二环东直门朝阳门限高施工铛铛车吉祥如意福北京';
// every glyph the Beijing canvases draw, so the Chinese web fonts can be fetched before textures are built
export const GLYPHS = [...new Set([
  ...PLAQUES, ...BANNERS.map((b) => b.t), ...HUTONGS.map((h) => h[0]), ...COUPLETS.flat(), ...H_SIGNS.map((s) => s.text),
  ...ADS.map((a) => a.text + a.sub), ...PAILOU, EXTRA,
].join(''))].join('');

// ---------- geometry ----------
// Box whose UVs tile a texture every `s` metres on every face.
export function tiledBox(w, h, d, s = 1.6) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, (uv.getX(i) * dims[f][0]) / s, (uv.getY(i) * dims[f][1]) / s);
  }
  return g;
}

// Chinese roof: concave slopes rising to the ridge with the eave corners swept up (飞檐翘角).
// Local x = length, z = depth, y = 0 on the eave line. hip: four slopes, otherwise two slopes with gable ends.
export function roofGeo(w, d, h, { hip = true, lift = 0.45, eave = 0.9, tile = 1.1 } = {}) {
  const W = w + 2 * eave, D = d + 2 * eave, R = hip ? Math.max(0, W / 2 - D / 2) : W / 2;
  const pos = [], uv = [], NU = 8, NT = 4;
  const put = (p) => { pos.push(p[0], p[1], p[2]); uv.push(p[3], p[4]); };
  const face = (e0, e1, r0, r1) => {
    const len = Math.hypot(e1[0] - e0[0], e1[1] - e0[1]), grid = [];
    for (let j = 0; j <= NT; j++) {
      const t = j / NT, row = [];
      for (let i = 0; i <= NU; i++) {
        const u = i / NU;
        const ex = e0[0] + (e1[0] - e0[0]) * u, ez = e0[1] + (e1[1] - e0[1]) * u;
        const rx = r0[0] + (r1[0] - r0[0]) * u, rz = r0[1] + (r1[1] - r0[1]) * u;
        const sweep = Math.pow(Math.abs(2 * u - 1), 3) * lift;
        const y = h * Math.pow(t, 1.5) + sweep * h * (1 - t) * (1 - t);
        row.push([ex + (rx - ex) * t, y, ez + (rz - ez) * t, (u * len) / tile, (t * Math.hypot(Math.hypot(rx - ex, rz - ez), h)) / tile]);
      }
      grid.push(row);
    }
    for (let j = 0; j < NT; j++) for (let i = 0; i < NU; i++) {
      const a = grid[j][i], b = grid[j][i + 1], c = grid[j + 1][i], dd = grid[j + 1][i + 1];
      put(a); put(b); put(dd); put(a); put(dd); put(c);
    }
  };
  const hw = W / 2, hd = D / 2;
  face([-hw, hd], [hw, hd], [-R, 0], [R, 0]);
  face([hw, -hd], [-hw, -hd], [R, 0], [-R, 0]);
  if (hip) { face([hw, hd], [hw, -hd], [R, 0], [R, 0]); face([-hw, -hd], [-hw, hd], [-R, 0], [-R, 0]); }
  const roof = new THREE.BufferGeometry();
  roof.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  roof.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  roof.computeVertexNormals();
  let gable = null;
  if (!hip) {   // gable walls under both ends, following the curved slope
    const gp = [], gu = [], N = 8;
    const yTop = (z) => h * Math.pow(Math.max(0, 1 - Math.abs(z) / hd), 1.5);
    for (const sx of [-1, 1]) {
      const x = sx * (w / 2);
      for (let k = 0; k < N; k++) {
        const za = sx * (d / 2 - (d * k) / N), zb = sx * (d / 2 - (d * (k + 1)) / N);
        const ya = yTop(za), yb = yTop(zb);
        const q = [[x, 0, za], [x, 0, zb], [x, yb, zb], [x, 0, za], [x, yb, zb], [x, ya, za]];
        for (const p of q) { gp.push(...p); gu.push(p[2] / 1.6, p[1] / 1.6); }
      }
    }
    gable = new THREE.BufferGeometry();
    gable.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
    gable.setAttribute('uv', new THREE.Float32BufferAttribute(gu, 2));
    gable.computeVertexNormals();
  }
  return { roof, gable };
}

// ---------- textures ----------
function brickTex() {   // grey brick (青砖)
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#9a9ca2'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 12) for (let x = ((y / 12) % 2) * 16 - 16; x < w; x += 32) {
      const v = randi(-10, 10);
      g.fillStyle = `rgb(${104 + v},${107 + v},${114 + v})`; g.fillRect(x + 1, y + 1, 30, 10);
    }
  });
}
function plasterTex(base, spots) {   // red palace plaster or white marble with a little mottling
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = pick(spots); g.globalAlpha = rand(0.05, 0.18); g.fillRect(rand(0, w), rand(0, h), rand(2, 10), rand(2, 10)); }
    g.globalAlpha = 1;
  });
}
function tileTex(c1, c2, c3) {   // roof tiles: rows of half-round channels
  return canvasTex(64, 64, (g, w, h) => {
    for (let x = 0; x < w; x += 8) {
      const gr = g.createLinearGradient(x, 0, x + 8, 0);
      gr.addColorStop(0, c3); gr.addColorStop(0.5, c2); gr.addColorStop(1, c1);
      g.fillStyle = gr; g.fillRect(x, 0, 8, h);
    }
    g.fillStyle = c3; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 2);
  });
}
function paintTex() {   // blue-green beam painting with gold (旋子彩画)
  return canvasTex(256, 32, (g, w, h) => {
    for (let i = 0; i < 4; i++) {
      const x = i * 64;
      g.fillStyle = i % 2 ? '#1f5f8a' : '#2a7a5a'; g.fillRect(x, 0, 64, h);
      g.strokeStyle = '#f2f2f2'; g.lineWidth = 2; g.beginPath(); g.ellipse(x + 32, h / 2, 20, 10, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = '#e8b84a'; g.beginPath(); g.ellipse(x + 32, h / 2, 12, 6, 0, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#e8b84a'; g.beginPath(); g.arc(x + 32, h / 2, 3.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#b8262a'; g.fillRect(x, 0, 4, h);
    }
    g.fillStyle = '#e8b84a'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
  });
}
function latticeTex() {   // lit paper window behind a wooden lattice (窗棂)
  return canvasTex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 90);
    gr.addColorStop(0, '#ffe2a8'); gr.addColorStop(1, '#f0a048');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#4a2a14'; g.lineWidth = 3;
    for (let k = 0; k <= w; k += 16) {
      g.beginPath(); g.moveTo(k, 0); g.lineTo(k, h); g.stroke();
      g.beginPath(); g.moveTo(0, k); g.lineTo(w, k); g.stroke();
    }
    g.lineWidth = 1.5;
    for (let k = -w; k <= w; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + h, h); g.stroke(); }
    g.strokeStyle = '#6a3a1a'; g.lineWidth = 8; g.strokeRect(0, 0, w, h);
  });
}
function plaqueAtlas() {   // black-lacquer shop plaques with gold calligraphy (牌匾)
  const cw = 384, ch = 128, cols = 3, rows = Math.ceil(PLAQUES.length / cols);
  const tex = canvasTex(cw * cols, ch * rows, (g) => {
    PLAQUES.forEach((t, i) => {
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch, blue = i % 4 === 3;
      g.fillStyle = blue ? '#1d3f6e' : '#1a1210'; g.fillRect(x + 4, y + 4, cw - 8, ch - 8);
      g.strokeStyle = '#d9a83a'; g.lineWidth = 8; g.strokeRect(x + 12, y + 12, cw - 24, ch - 24);
      g.strokeStyle = '#7a4a1a'; g.lineWidth = 2; g.strokeRect(x + 22, y + 22, cw - 44, ch - 44);
      g.fillStyle = '#ffd77a'; g.shadowColor = '#ffb347'; g.shadowBlur = 10;
      g.font = `400 ${Math.min(84, (cw - 70) / [...t].length)}px ${CN}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(t, x + cw / 2, y + ch / 2 + 4);
      g.shadowBlur = 0;
    });
  }, { repeat: false });
  const rects = PLAQUES.map((_, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    return { u0: c / cols, u1: (c + 1) / cols, v0: 1 - (r + 1) / rows, v1: 1 - r / rows };
  });
  return { tex, rects };
}
function bannerAtlas() {   // cloth shop banners (幌子) with a zigzag hem
  const cw = 96, ch = 320, n = BANNERS.length;
  const tex = canvasTex(cw * n, ch, (g) => {
    g.clearRect(0, 0, cw * n, ch);
    BANNERS.forEach((s, i) => {
      const x = i * cw;
      g.fillStyle = s.bg;
      g.beginPath(); g.moveTo(x + 8, 10); g.lineTo(x + cw - 8, 10); g.lineTo(x + cw - 8, ch - 50);
      for (let k = 0; k <= 4; k++) g.lineTo(x + cw - 8 - (k * (cw - 16)) / 4, ch - (k % 2 ? 50 : 18));
      g.closePath(); g.fill();
      g.strokeStyle = '#ffd77a'; g.lineWidth = 3; g.strokeRect(x + 15, 20, cw - 30, ch - 86);
      g.fillStyle = s.fg || '#ffffff'; g.font = `400 70px ${CN}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(s.t, x + cw / 2, ch * 0.4);
      g.fillStyle = '#1a1210'; g.fillRect(x + 4, 4, cw - 8, 8);
    });
  }, { repeat: false });
  return { tex, rects: BANNERS.map((_, i) => ({ u0: i / n, u1: (i + 1) / n, v0: 0, v1: 1 })) };
}
function hutongSignAtlas() {   // blue street-name plates with pinyin
  const cw = 320, ch = 112, n = HUTONGS.length;
  const tex = canvasTex(cw, ch * n, (g) => {
    HUTONGS.forEach(([cn, en], i) => {
      const y = i * ch;
      g.fillStyle = '#1d4fa0'; g.fillRect(0, y, cw, ch);
      g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.strokeRect(7, y + 7, cw - 14, ch - 14);
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `400 46px ${CN_SIGN}`; g.fillText(cn, cw / 2, y + 46);
      g.font = '700 17px "Chakra Petch", sans-serif'; g.fillText(en, cw / 2, y + 86);
    });
  }, { repeat: false });
  return { tex, rects: HUTONGS.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / n, v1: 1 - i / n })) };
}
function doorAtlas() {   // red double doors with spring couplets, a 福 and brass knockers
  const cw = 256, ch = 256, n = COUPLETS.length;
  const tex = canvasTex(cw * n, ch, (g) => {
    COUPLETS.forEach(([l, r], i) => {
      const x = i * cw;
      for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#8a1a18' : '#7e1614'; g.fillRect(x + k * 32, 0, 32, ch); }
      g.fillStyle = '#2a0a08'; g.fillRect(x + cw / 2 - 2, 0, 4, ch);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const [cx, text] of [[x + 52, l], [x + cw - 52, r]]) {
        g.fillStyle = '#d42a22'; g.fillRect(cx - 22, 22, 44, 178);
        g.fillStyle = '#141414'; g.font = `400 36px ${CN}`;
        [...text].forEach((c, k) => g.fillText(c, cx, 44 + k * 43));
      }
      for (const cx of [x + cw / 2 - 26, x + cw / 2 + 26]) {
        g.fillStyle = '#c9a227'; g.beginPath(); g.arc(cx, 136, 9, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#e8c547'; g.lineWidth = 3; g.beginPath(); g.arc(cx, 152, 11, 0, Math.PI * 2); g.stroke();
      }
      g.save(); g.translate(x + cw / 2, 74); g.rotate(Math.PI / 4); g.fillStyle = '#d42a22'; g.fillRect(-24, -24, 48, 48); g.restore();
      g.fillStyle = '#141414'; g.font = `400 38px ${CN}`; g.fillText('福', x + cw / 2, 76);
      g.fillStyle = '#3a2a1e'; g.fillRect(x, ch - 14, cw, 14);
    });
  }, { repeat: false });
  return { tex, rects: COUPLETS.map((_, i) => ({ u0: i / n, u1: (i + 1) / n, v0: 0, v1: 1 })) };
}
function nameplateTex(text) {   // archway / gate plaque: gold calligraphy on blue
  return canvasTex(512, 160, (g, w, h) => {
    g.fillStyle = '#1d3f6e'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d9b44a'; g.lineWidth = 12; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#ffd77a'; g.shadowColor = '#ffb347'; g.shadowBlur = 14;
    g.font = `400 ${[...text].length > 3 ? 80 : 104}px ${CN}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 6);
  }, { repeat: false });
}
function adAtlas() {   // LED screens with Chinese ads
  const CW = 384, CH = 240;
  return canvasTex(CW * ADS.length, CH, (g) => {
    ADS.forEach((a, i) => {
      const x0 = i * CW;
      const gr = g.createLinearGradient(x0, 0, x0 + CW, CH); gr.addColorStop(0, a.bg[0]); gr.addColorStop(1, a.bg[1]);
      g.fillStyle = gr; g.fillRect(x0, 0, CW, CH);
      g.save(); g.beginPath(); g.rect(x0, 0, CW, CH); g.clip();
      g.globalAlpha = 0.4; g.fillStyle = '#ffffff';
      if (a.icon === 'moon') { g.globalAlpha = 0.8; g.fillStyle = '#ffe29a'; g.beginPath(); g.arc(x0 + CW * 0.8, CH * 0.42, 56, 0, Math.PI * 2); g.fill(); }
      if (a.icon === 'steam') for (let k = 0; k < 5; k++) { g.lineWidth = 6; g.strokeStyle = '#ffffff'; g.beginPath(); for (let y = 30; y < 150; y += 6) g.lineTo(x0 + 250 + k * 22 + Math.sin(y * 0.08 + k) * 8, y); g.stroke(); }
      if (a.icon === 'bubbles') for (let k = 0; k < 18; k++) { g.beginPath(); g.arc(x0 + rand(0, CW), rand(0, CH), rand(4, 22), 0, Math.PI * 2); g.fill(); }
      if (a.icon === 'stars') for (let k = 0; k < 14; k++) { g.font = `${randi(18, 40)}px sans-serif`; g.fillText('★', x0 + rand(0, CW), rand(20, CH)); }
      if (a.icon === 'bar') { g.globalAlpha = 0.9; g.fillStyle = '#ff2a2a'; g.fillRect(x0, CH - 52, CW, 52); }
      if (a.icon === 'bolt') for (let k = 0; k < 7; k++) g.fillRect(x0 + rand(0, CW), rand(0, CH), rand(60, 160), 4);
      if (a.icon === 'haws') { g.globalAlpha = 0.95; for (let k = 0; k < 5; k++) { g.fillStyle = '#d81e1e'; g.beginPath(); g.arc(x0 + 300, 40 + k * 34, 16, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#c9a86a'; g.fillRect(x0 + 298, 20, 4, 200); }
      g.restore();
      g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = a.fg || '#ffffff';
      g.font = `400 70px ${CN_SIGN}`;
      const m = g.measureText(a.text).width, sc = Math.min(1, (CW - 40) / m);
      g.save(); g.translate(x0 + 20, 130); g.scale(sc, 1); g.fillText(a.text, 0, 0); g.restore();
      g.font = `400 28px ${CN_SIGN}`; g.globalAlpha = 0.92;
      g.fillText(a.sub, x0 + 22, 176);
      g.globalAlpha = 1;
    });
  }, { repeat: false });
}
function roadSignTex() {   // blue ring-road direction sign
  return canvasTex(1024, 192, (g, w, h) => {
    g.fillStyle = '#1f4fa6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#ffffff'; g.textBaseline = 'middle'; g.textAlign = 'center';
    g.font = `400 64px ${CN_SIGN}`; g.fillText('← 朝阳门', 230, 78); g.fillText('东直门 →', 800, 78);
    g.fillStyle = '#2f8a3a'; g.fillRect(420, 34, 184, 92); g.fillStyle = '#ffffff'; g.font = `400 58px ${CN_SIGN}`; g.fillText('东二环', 512, 82);
    g.font = '700 26px "Chakra Petch", sans-serif'; g.fillText('CHAOYANGMEN', 230, 148); g.fillText('DONGZHIMEN', 800, 148); g.fillText('E 2ND RING RD', 512, 150);
  }, { repeat: false });
}
function trailTex(col) {   // streaks of car lights along an overpass
  const t = canvasTex(256, 16, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) {
      const x = rand(0, w - 40), len = rand(14, 40);
      const gr = g.createLinearGradient(x, 0, x + len, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.8, col); gr.addColorStop(1, '#ffffff');
      g.fillStyle = gr; g.fillRect(x, 4 + (i % 2) * 5, len, 3);
    }
  });
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// ---------- the kit ----------
export function makeKit() {
  const K = {};
  Object.assign(K, ginkgoKit());
  // materials
  K.brickMat = std({ map: brickTex(), vertexColors: true, roughness: 0.92 });
  K.redMat = std({ map: plasterTex('#9e2a22', ['#7a1a14', '#b8443a', '#6a1a12']), vertexColors: true, roughness: 0.9 });
  K.marbleMat = std({ map: plasterTex(MARBLE, ['#cfcac0', '#f4f2ec', '#bdb8ae']), vertexColors: true, roughness: 0.6 });
  const tile = (c1, c2, c3, k = 0) => {
    const map = tileTex(c1, c2, c3);
    return std({ map, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.2, ...(k ? { emissive: '#ffffff', emissiveMap: map, emissiveIntensity: k } : {}) });
  };
  K.tileGrey = tile('#30333a', '#4a4e57', '#202228');
  K.goldTile = tile('#b8860e', '#f2c94a', '#7a5a08', 0.14);
  K.blueTile = tile('#183478', '#2d58b8', '#0e2050', 0.14);
  K.greenTile = tile('#1a5a40', '#2f8a62', '#103426', 0.08);
  const paint = paintTex();
  K.paintMat = std({ map: paint, emissive: '#ffffff', emissiveMap: paint, emissiveIntensity: 0.3, roughness: 0.7 });
  K.latticeMat = basic({ map: latticeTex(), color: hdr('#ffffff', 0.95) });
  const doors = doorAtlas();
  K.doorRects = doors.rects;
  K.doorMat = std({ map: doors.tex, roughness: 0.7, emissive: '#ffffff', emissiveMap: doors.tex, emissiveIntensity: 0.18 });
  const pl = plaqueAtlas();
  K.plaqueRects = pl.rects;
  K.plaqueMat = std({ map: pl.tex, roughness: 0.5, emissive: '#ffffff', emissiveMap: pl.tex, emissiveIntensity: 0.6 });
  const bn = bannerAtlas();
  K.bannerRects = bn.rects;
  K.bannerMat = std({ map: bn.tex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8, emissive: '#ffffff', emissiveMap: bn.tex, emissiveIntensity: 0.3 });
  const hs = hutongSignAtlas();
  K.hutongRects = hs.rects;
  K.hutongMat = basic({ map: hs.tex, color: hdr('#ffffff', 0.9) });
  const neon = signAtlas(H_SIGNS, { cols: 2 });
  K.neonRects = neon.rects;
  K.neonMat = basic({ map: neon.tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hdr('#ffffff', 1.3) });
  K.screen = screenMat(adAtlas(), ADS.length, 1.3);
  K.roadMat = basic({ map: roadSignTex(), color: hdr('#ffffff', 1.0) });
  K.trails = [trailTex('#fff2d0'), trailTex('#ff3a2a')];
  K.trails.forEach((t) => t.repeat.set(14, 1));
  K.trailMats = K.trails.map((t, i) => basic({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hdr(i ? '#ff5a4a' : '#fff6e6', 1.8) }));
  K.hawMat = std({ color: '#d81e1e', emissive: '#6a0808', emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.1 });
  const plates = new Map();
  K.nameplate = (text) => {
    if (!plates.has(text)) { const t = nameplateTex(text); plates.set(text, std({ map: t, roughness: 0.5, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.65 })); }
    return plates.get(text);
  };

  // ---------- architecture ----------
  K.brick = (b, x, y, z, w, h, d, col = 0xffffff) => b.addM(tiledBox(w, h, d), K.brickMat, at(x, y + h / 2, z), col);
  K.red = (b, x, y, z, w, h, d) => b.addM(tiledBox(w, h, d, 3), K.redMat, at(x, y + h / 2, z), 0xffffff);
  K.marble = (b, x, y, z, w, h, d) => b.addM(tiledBox(w, h, d, 2), K.marbleMat, at(x, y + h / 2, z), 0xffffff);
  // roof with its ridge and the two ridge-end ornaments (吻兽)
  K.roof = (b, mat, x, y, z, w, d, h, { hip = true, ry = 0, lift = 0.45, eave = 0.9, ridge = '#26282d', gable = null, gableCol = 0xffffff } = {}) => {
    const { roof, gable: gg } = roofGeo(w, d, h, { hip, lift: hip ? lift : 0, eave });
    const m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
    b.addM(roof, mat, m, 0xffffff);
    if (gg && gable) b.addM(gg, gable, m, gableCol);
    const R = hip ? Math.max(0.4, (w - d) / 2) : w / 2 + eave * 0.6, c = Math.cos(ry), s = Math.sin(ry);
    b.add(G.box, VC.solid, x, y + h + 0.1, z, 2 * R + 0.3, 0.32, 0.34, 0, ry, 0, ridge);
    for (const k of [-1, 1]) b.add(G.box, VC.solid, x + c * k * R, y + h + 0.42, z - s * k * R, 0.32, 0.7, 0.36, 0, ry, k * 0.25, ridge);
  };
  // classical hall: platform, vermilion columns, lit lattice, painted beams, one or two eaves
  K.hall = (b, x, z, { w = 14, d = 9, h = 5, base = 1.2, y = 0, roof = K.goldTile, double = false, ry = 0, baseMat = 'marble', roofH = null } = {}) => {
    const c = Math.cos(ry), s = Math.sin(ry);
    const P = (lx, lz) => [x + c * lx + s * lz, z - s * lx + c * lz];
    const bw = ry ? d + 3 : w + 3, bd = ry ? w + 3 : d + 3, y0 = y + base;
    if (baseMat === 'marble') K.marble(b, x, y, z, bw, base, bd); else if (baseMat) K.brick(b, x, y, z, bw, base, bd);
    b.add(G.box, VC.solid, x, y0 + h / 2, z, w - 1.2, h, d - 1.2, 0, ry, 0, '#8a2a22');
    b.add(G.box, K.latticeMat, x, y0 + h * 0.42, z, w - 1.1, h * 0.7, d - 1.1, 0, ry, 0);
    const n = Math.max(3, Math.round(w / 2.6));
    for (let i = 0; i <= n; i++) for (const lz of [d / 2 - 0.3, -d / 2 + 0.3]) {
      const [cx, cz] = P(-w / 2 + 0.3 + ((w - 0.6) * i) / n, lz);
      b.cyl(VC.solid, VERM, cx, y0 + h / 2, cz, 0.22, h, 'cyl8');
    }
    b.add(G.box, K.paintMat, x, y0 + h - 0.35, z, w, 0.7, d, 0, ry, 0);
    const rh = roofH || Math.min(w, d) * 0.32;
    if (double) {
      K.roof(b, roof, x, y0 + h, z, w + 1.2, d + 1.2, rh * 0.45, { ry, eave: 1.3, lift: 0.5 });
      b.add(G.box, VC.solid, x, y0 + h + rh * 0.45 + 0.8, z, w - 2.2, 1.8, d - 2.2, 0, ry, 0, '#8a2a22');
      b.add(G.box, K.paintMat, x, y0 + h + rh * 0.45 + 1.4, z, w - 2.0, 0.6, d - 2.0, 0, ry, 0);
      K.roof(b, roof, x, y0 + h + rh * 0.45 + 1.7, z, w - 2.4, d - 2.4, rh, { ry, eave: 1.3, lift: 0.55 });
    } else K.roof(b, roof, x, y0 + h, z, w, d, rh, { ry, eave: 1.3, lift: 0.5 });
  };
  // white marble balustrade between two points
  K.balustrade = (b, x0, z0, x1, z1, y = 0, step = 1.3) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / step));
    beam(b, VC.solid, x0, y + 0.95, z0, x1, y + 0.95, z1, 0.14, MARBLE, 0.18);
    beam(b, VC.solid, x0, y + 0.3, z0, x1, y + 0.3, z1, 0.1, '#cfcac0', 0.2);
    for (let i = 0; i <= n; i++) {
      const t = i / n, px = x0 + (x1 - x0) * t, pz = z0 + (z1 - z0) * t;
      b.box(VC.solid, MARBLE, px, y + 0.6, pz, 0.2, 1.2, 0.2);
      b.sph(VC.solid, MARBLE, px, y + 1.25, pz, 0.12, true);
    }
  };
  K.coping = (b, x, y, z, len) => K.roof(b, K.tileGrey, x, y, z, len, 0.7, 0.35, { hip: false, ry: Math.PI / 2, eave: 0.15, ridge: '#2e3036' });

  // ---------- hutong (胡同): grey courtyard walls, gates, the roofs and trees of the courtyards behind ----------
  K.drum = (b, x, z, s = 1) => {   // 门墩 stone drum at a gate
    b.block(VC.solid, '#8a8680', x, 0, z, 0.5 * s, 0.32 * s, 0.34 * s);
    b.cyl(VC.solid, '#a3a09a', x, 0.62 * s, z, 0.3 * s, 0.24 * s, 'cyl', 0, Math.PI / 2);
  };
  K.plate = (b, x, y, z, side) => b.add(planeUV(pick(K.hutongRects)), K.hutongMat, x, y, z, 1.6, 0.56, 1, 0, -side * Math.PI / 2);
  K.hutong = (b, side, z0, z1, { x0 = 9.6, back = true } = {}) => {
    const s = side, H = 3.5;
    let z = z0;
    while (z < z1 - 4) {
      const seg = Math.min(z1 - z, rand(10, 16)), zA = z, zB = z + seg, zc = -(zA + seg / 2);
      const kind = seg > 8 ? pick(['grand', 'gate', 'gate', 'plain']) : 'plain';
      const gw = kind === 'grand' ? 3.6 : 1.9, gz = -(zA + rand(2.6, seg - 2.6));
      const xw = s * (x0 + 0.25);
      const cuts = kind === 'plain' ? [[zA, zB]] : [[zA, -gz - gw / 2], [-gz + gw / 2, zB]];
      for (const [a, c] of cuts) if (c - a > 0.2) {
        K.brick(b, xw, 0, -(a + c) / 2, 0.5, H, c - a);
        b.box(VC.solid, '#55575d', xw - s * 0.03, 0.4, -(a + c) / 2, 0.56, 0.8, c - a);
      }
      // the house behind the street wall shows its tiled roof; a plain wall gets a tiled coping
      if (kind === 'grand') {
        for (const [a, c] of cuts) if (c - a > 1.5) K.roof(b, K.tileGrey, s * (x0 + 3.2), H, -(a + c) / 2, c - a - 0.4, 6.2, 2.0, { hip: false, ry: Math.PI / 2, eave: 0.45, gable: K.brickMat });
      } else if (kind === 'gate' || chance(0.5)) K.roof(b, K.tileGrey, s * (x0 + 3.2), H, zc, seg - 0.5, 6.2, 2.0, { hip: false, ry: Math.PI / 2, eave: 0.45, gable: K.brickMat });
      else K.coping(b, xw, H, zc, seg);
      if (kind === 'grand') {   // 广亮大门: gatehouse with a recessed red door, columns, painted beam, lanterns
        for (const dz of [-gw / 2, gw / 2]) K.brick(b, s * (x0 + 2.6), 0, gz + dz, 5.2, 4.3, 0.5);
        for (const dz of [-1.5, 1.5]) b.cyl(VC.solid, VERM, s * (x0 + 0.05), 2.1, gz + dz, 0.16, 4.2, 'cyl8');
        b.add(G.box, K.paintMat, s * (x0 + 0.1), 3.95, gz, 0.4, 0.55, gw);
        K.brick(b, s * (x0 + 1.35), 0, gz - 1.45, 0.25, 3.3, 0.6);
        K.brick(b, s * (x0 + 1.35), 0, gz + 1.45, 0.25, 3.3, 0.6);
        b.add(planeUV(pick(K.doorRects)), K.doorMat, s * (x0 + 1.22), 1.45, gz, 2.3, 2.9, 1, 0, -s * Math.PI / 2);
        b.box(VC.solid, '#3a1a14', s * (x0 + 1.25), 3.2, gz, 0.22, 0.55, gw - 0.5);
        for (const dz of [-1.32, 1.32]) K.drum(b, s * (x0 + 0.75), gz + dz);
        b.box(VC.solid, '#8a8a86', s * (x0 + 0.35), 0.14, gz, 1.5, 0.28, gw);
        K.roof(b, K.tileGrey, s * (x0 + 2.6), 4.3, gz, gw + 0.7, 5.8, 2.3, { hip: false, ry: Math.PI / 2, eave: 0.6, gable: K.brickMat });
        for (const dz of [-1.5, 1.5]) K.lantern(b, s * (x0 - 0.4), 3.3, gz + dz, 0.75);
      } else if (kind === 'gate') {   // 如意门: a door in the wall under a carved brick header and a little hood
        K.brick(b, xw, 2.5, gz, 0.5, H - 2.5, gw);
        b.add(planeUV(pick(K.doorRects)), K.doorMat, s * (x0 + 0.18), 1.25, gz, 1.6, 2.5, 1, 0, -s * Math.PI / 2);
        b.box(VC.solid, '#a7a9ae', xw - s * 0.06, 2.75, gz, 0.6, 0.5, gw + 0.6);
        K.roof(b, K.tileGrey, s * (x0 + 0.05), 3.05, gz, gw + 0.8, 0.9, 0.55, { hip: false, ry: Math.PI / 2, eave: 0.2 });
        for (const dz of [-0.95, 0.95]) K.drum(b, s * (x0 - 0.15), gz + dz, 0.75);
        if (chance(0.5)) K.lantern(b, s * (x0 - 0.3), 2.55, gz - 1.15, 0.6);
      }
      if (chance(0.35)) b.box(VC.glow, hdr(pick(['#ffd9a0', '#ffe6c0']), 0.9), s * (x0 - 0.02), 2.8, -(zA + rand(1, seg - 1)), 0.04, 0.5, 0.8);
      if (chance(0.2)) K.plate(b, s * (x0 - 0.03), 2.4, -(zA + rand(1, seg - 1)), s);
      if (chance(0.3)) K.bike(b, s * (x0 - 0.5), -(zA + rand(1, seg - 1)), s);
      // the courtyard: a persimmon or scholar tree and the main house roof behind
      if (back) {
        if (chance(0.75)) {
          const tz = -(zA + rand(2, seg - 2)), tx = s * (x0 + rand(8.5, 11.5));
          if (chance(0.62)) K.persimmon(b, tx, tz, rand(1.15, 1.4)); else K.huai(b, tx, tz, rand(1.0, 1.25));
        }
        if (chance(0.8)) {
          const bl = seg * rand(0.55, 0.85), bz = -(zA + seg * rand(0.4, 0.6)), bx = s * (x0 + rand(14, 16));
          K.brick(b, bx, 0, bz, 7, 3.8, bl);
          K.roof(b, K.tileGrey, bx, 3.8, bz, bl, 7, 2.4, { hip: false, ry: Math.PI / 2, eave: 0.5, gable: K.brickMat });
        }
      }
      z = zB + rand(0, 0.3);
    }
  };

  // ---------- old shopping street (大栅栏 style): two-storey shops with plaques, banners, lanterns ----------
  K.shops = (b, side, z0, z1, { x0 = 10.4 } = {}) => {
    const s = side;
    let z = z0;
    while (z < z1 - 4) {
      const len = Math.min(z1 - z, rand(7, 11)), zc = -(z + len / 2), xf = s * x0;
      const two = chance(0.75), H1 = 4.0, H = two ? 7.3 : 4.6, D = rand(8, 11);
      if (chance(0.55)) K.brick(b, s * (x0 + D / 2), 0, zc, D, H, len - 0.2, pick(['#ffffff', '#e8e2da']));
      else K.red(b, s * (x0 + D / 2), 0, zc, D, H, len - 0.2);
      b.box(VC.glow, hdr(pick(['#ffb870', '#ffa860', '#ffc488']), 0.42), xf - s * 0.03, 1.75, zc, 0.06, 3.1, len - 1.3);
      const nc = Math.max(2, Math.round(len / 2.6));
      for (let k = 0; k <= nc; k++) b.cyl(VC.solid, VERM, xf - s * 0.4, H1 / 2, zc - (len - 1) / 2 + ((len - 1) * k) / nc, 0.15, H1, 'cyl8');
      b.add(G.box, K.paintMat, xf - s * 0.42, H1 - 0.25, zc, 0.45, 0.5, len - 0.2);
      const pw = Math.min(3.4, len * 0.42);
      b.add(planeUV(pick(K.plaqueRects)), K.plaqueMat, xf - s * 0.68, H1 + 0.42, zc, pw, pw / 3, 1, 0, -s * Math.PI / 2);
      if (two) {
        b.addM(tiledBox(0.04, 1.9, len - 1.6, 1.2), K.latticeMat, at(xf - s * 0.02, H1 + 1.65, zc), 0xffffff);
        b.box(VC.solid, VERM, xf - s * 0.75, H1 + 0.95, zc, 0.08, 0.08, len - 0.4);
        b.box(VC.solid, VERM, xf - s * 0.75, H1 + 0.25, zc, 0.08, 0.08, len - 0.4);
        for (let zz = -(len - 0.6) / 2; zz <= (len - 0.6) / 2; zz += 0.45) b.box(VC.solid, VERM, xf - s * 0.75, H1 + 0.6, zc + zz, 0.05, 0.7, 0.05);
        b.box(VC.solid, '#3a3a3e', xf - s * 0.4, H1 + 0.18, zc, 0.8, 0.12, len - 0.2);
        for (let zz = -(len - 2) / 2; zz <= (len - 2) / 2 + 0.01; zz += (len - 2) / Math.max(1, Math.round((len - 2) / 1.7))) K.lantern(b, xf - s * 0.75, H - 0.75, zc + zz, 0.62);
      } else for (const dz of [-len / 3, len / 3]) K.lantern(b, xf - s * 0.75, H1 + 0.05, zc + dz, 0.6);
      if (chance(0.6)) {   // cloth banner on a bracket, readable along the street
        const bz = zc + (len / 2 - 0.8) * pick([-1, 1]), bx = xf - s * 1.05;
        b.box(VC.solid, '#2a1a12', xf - s * 0.55, H1 - 0.75, bz, 1.1, 0.06, 0.06);
        b.add(planeUV(pick(K.bannerRects)), K.bannerMat, bx, H1 - 2.05, bz, 0.68, 2.3, 1);
      }
      K.roof(b, K.tileGrey, s * (x0 + D / 2), H, zc, len, D, rand(1.8, 2.4), { hip: chance(0.45), ry: Math.PI / 2, eave: 0.9, lift: 0.55, gable: K.brickMat });
      z += len + rand(0.05, 0.4);
    }
  };

  // ---------- red palace wall (红墙) with yellow-glazed coping and hall roofs behind it ----------
  K.redWall = (b, side, z0, z1, { x0 = 10.6, h = 6.4, halls = true } = {}) => {
    const len = z1 - z0, zc = -(z0 + len / 2), xc = side * (x0 + 0.7);
    K.marble(b, xc, 0, zc, 1.9, 0.75, len);
    K.red(b, xc, 0.75, zc, 1.4, h - 0.75, len);
    K.roof(b, K.goldTile, xc, h, zc, len, 1.5, 0.75, { hip: false, ry: Math.PI / 2, eave: 0.4, ridge: '#a87a12' });
    if (halls) for (let z = z0 + rand(2, 8); z < z1 - 10; z += rand(18, 26)) {
      const w = rand(14, 20), hx = side * (x0 + rand(15, 19)), hz = -(z + w / 2);
      K.red(b, hx, 0, hz, 9, 7.2, w - 1.5);
      b.add(G.box, K.paintMat, hx, 6.7, hz, 9.1, 0.6, w - 1.4);
      K.roof(b, K.goldTile, hx, 7.2, hz, w, 9, 3.2, { hip: true, ry: Math.PI / 2, lift: 0.55, ridge: '#a87a12' });
    }
  };

  // ---------- archway (牌楼) spanning the street; the central beam clears jetpack height ----------
  K.pailou = (b, z, { text = pick(PAILOU), roof = K.greenTile } = {}) => {
    for (const [x, h] of [[-10.6, 9.6], [-5.4, 13.4], [5.4, 13.4], [10.6, 9.6]]) {
      b.block(VC.solid, '#8a8680', x, 0, z, 1.3, 1.3, 1.3);
      b.cyl(VC.solid, VERM, x, h / 2, z, 0.34, h, 'cyl8');
    }
    b.add(G.box, K.paintMat, 0, 11.5, z, 11.4, 0.7, 0.62);
    b.add(G.box, K.paintMat, 0, 13.0, z, 11.4, 0.5, 0.56);
    const plate = K.nameplate(text);
    b.add(G.plane, plate, 0, 12.25, z + 0.33, 3.6, 1.12, 1);
    b.add(G.plane, plate, 0, 12.25, z - 0.33, 3.6, 1.12, 1, 0, Math.PI, 0);
    b.add(G.box, K.paintMat, 0, 13.5, z, 11.0, 0.5, 1.2);
    K.roof(b, roof, 0, 13.75, z, 11.4, 1.6, 1.5, { eave: 0.9, lift: 0.65 });
    for (const sx of [-1, 1]) {
      const cx = sx * 8;
      b.add(G.box, K.paintMat, cx, 7.8, z, 5.0, 0.6, 0.56);
      b.add(G.box, K.paintMat, cx, 8.9, z, 5.0, 0.45, 0.5);
      b.add(G.box, K.paintMat, cx, 9.35, z, 4.8, 0.45, 1.0);
      K.roof(b, roof, cx, 9.55, z, 5.0, 1.4, 1.2, { eave: 0.8, lift: 0.65 });
    }
  };

  // ---------- ring-road overpass (立交桥) with streaming car lights and a blue direction sign ----------
  K.overpass = (b, z) => {
    const y0 = 7.8, y1 = 9.0, Wd = 15;
    b.box(VC.solid, '#62646c', 0, (y0 + y1) / 2, z, 160, y1 - y0, Wd);
    for (const dz of [Wd / 2 - 0.2, -Wd / 2 + 0.2]) b.box(VC.solid, '#8a8c94', 0, y1 + 0.45, z + dz, 160, 0.9, 0.4);
    b.box(VC.glow, hdr('#3d7bff', 1.6), 0, y0 + 0.3, z + Wd / 2 + 0.02, 160, 0.12, 0.04);
    b.box(VC.glow, hdr('#b26bff', 1.2), 0, y1 - 0.2, z + Wd / 2 + 0.02, 160, 0.08, 0.04);
    for (const x of [-6.8, 6.8, -26, 26, -48, 48, -70, 70]) b.box(VC.solid, '#74767e', x, y0 / 2, z, 1.6, y0, 6);
    b.add(G.plane, K.trailMats[0], 0, y1 + 1.15, z + 3.4, 160, 0.55, 1);
    b.add(G.plane, K.trailMats[1], 0, y1 + 1.15, z - 2.6, 160, 0.55, 1);
    for (const x of [-5.2, 5.2]) b.box(VC.metal, '#5a6068', x, y1 + 2.1, z + Wd / 2 - 0.3, 0.22, 2.6, 0.22);
    b.box(VC.solid, '#14326e', 0, y1 + 2.6, z + Wd / 2 - 0.1, 11.4, 2.3, 0.12);
    b.add(G.plane, K.roadMat, 0, y1 + 2.6, z + Wd / 2 - 0.03, 11.2, 2.1, 1);
    b.box(VC.glow, hdr('#fff4dc', 0.9), 0, y0 - 0.05, z, 12, 0.06, 1.2);
  };

  // ---------- modern Beijing: glass offices, slab apartments, old red-brick blocks ----------
  K.office = windowTex({ wall: '#18202e', glass: '#22344c', lit: ['#e6f2ff', '#ffffff', '#cfe4ff', '#ffe9c4'], litChance: 0.45, band: true });
  K.officeMat = facadeMat(K.office, { k: 0.8, rough: 0.25, metal: 0.6 });
  K.slab = windowTex({ wall: '#c2b6a4', glass: '#1a1d24', lit: ['#ffe2b0', '#fff4dc', '#ffd59a'], litChance: 0.55, ledge: '#9a8c78', cols: 6 });
  K.slabMat = facadeMat(K.slab, { k: 0.85 });
  K.redbrick = windowTex({ wall: '#8a4a3a', glass: '#1a1410', lit: ['#ffd9a0', '#ffe6c0'], litChance: 0.5, frame: '#d9cfc0', cols: 5 });
  K.redbrickMat = facadeMat(K.redbrick, { k: 0.85 });
  K.neon = (b, x, y, z, side, w, i = randi(0, K.neonRects.length - 1)) => b.add(planeUV(K.neonRects[i]), K.neonMat, x, y, z, w, w / 4, 1, 0, -side * Math.PI / 2);
  K.ledScreen = (b, x, y, z, side, w, h) => {
    b.box(VC.solid, '#101014', x + side * 0.12, y, z, 0.2, h + 0.3, w + 0.3);
    b.add(G.plane, K.screen, x - side * 0.01, y, z, w, h, 1, 0, -side * Math.PI / 2, 0, new THREE.Color(Math.random(), rand(0.85, 1.05), 0));
  };
  K.modernShop = (b, i) => {
    const x = i.face - i.side * 0.04, L = Math.min(i.len - 0.8, 8), s = i.side;
    b.box(VC.glow, hdr(pick(['#e6f2ff', '#ffe0b0', '#ffd0e6', '#d6ecff']), 0.55), x, 1.6, i.z, 0.05, 2.8, L);
    b.box(VC.solid, '#1a1a1e', x - s * 0.1, 3.3, i.z, 0.2, 0.5, i.len - 0.2);
    if (chance(0.5)) K.neon(b, x - s * 0.12, 3.95, i.z, s, Math.min(4.5, L * 0.6));
  };
  K.types = [
    { mat: K.officeMat, tex: K.office, colors: ['#ffffff', '#c9d6ff', '#a9b8d9', '#d9e6ff'], w: [12, 20], h: [26, 60], weight: 1.5, cellW: 1.3, cellH: 2.6,
      roof: (b, i) => {
        for (const dz of [-i.len / 2, i.len / 2]) b.box(VC.glow, hdr('#7cf8ff', 1.4), i.x, i.h + 0.1, i.z + dz, i.d, 0.12, 0.12);
        b.cyl(VC.metal, '#9aa3b5', i.x, i.h + 3, i.z, 0.1, 6);
        b.sph(VC.glow, hdr('#ff2a2a', 4), i.x, i.h + 6.2, i.z, 0.28);
      },
      front: (b, i) => {
        if (chance(0.35)) K.ledScreen(b, i.face - i.side * 0.15, rand(10, 18), i.z, i.side, Math.min(10, i.len - 2), 5.6);
        else if (chance(0.5)) K.neon(b, i.face - i.side * 0.1, rand(8, 14), i.z, i.side, Math.min(8, i.len - 2));
        K.modernShop(b, i);
      } },
    { mat: K.slabMat, tex: K.slab, colors: ['#ffffff', '#e8e0d4', '#d6cfc4'], w: [14, 24], h: [16, 30], weight: 1.3, cellW: 1.5, cellH: 2.8,
      roof: (b, i) => { if (chance(0.5)) b.block(VC.solid, '#8a8c90', i.x, i.h, i.z, 3, 2.4, 3); },
      front: (b, i) => {
        for (let y = 3.6; y < i.h - 1; y += 2.8) if (chance(0.7)) b.box(VC.solid, '#d8d2c8', i.face - i.side * 0.45, y, i.z, 0.9, 1.1, i.len - 1);
        K.modernShop(b, i);
      } },
    { mat: K.redbrickMat, tex: K.redbrick, colors: ['#ffffff', '#e0c8b8'], w: [10, 15], h: [12, 19], weight: 1.0, cellW: 1.4, cellH: 2.7,
      roof: (b, i) => { if (chance(0.4)) b.cyl(VC.metal, '#7a7e86', i.x, i.h + 1.2, i.z, 0.9, 2.4); },
      front: (b, i) => K.modernShop(b, i) },
  ];
  K.modernRow = (b, side, z0, z1, x0 = 12.5) => { if (z1 - z0 > 3) buildingRow(b, side, K.types, { x0, depth: [10, 16], gap: [0.3, 2], z0, z1 }); };

  // ---------- street furniture ----------
  K.lantern = (b, x, y, z, s = 1) => {   // red silk lantern with gold caps and a tassel
    b.cyl(VC.metal, '#3a2a18', x, y + 0.48 * s, z, 0.02, 0.3 * s);
    b.add(G.sph, VC.glow, x, y, z, 0.66 * s, 0.6 * s, 0.66 * s, 0, 0, 0, hdr('#ff3a24', 2.6));
    b.cyl(VC.solid, '#c9a227', x, y + 0.3 * s, z, 0.2 * s, 0.08 * s);
    b.cyl(VC.solid, '#c9a227', x, y - 0.3 * s, z, 0.2 * s, 0.08 * s);
    b.cyl(VC.glow, hdr('#ffc04a', 1.5), x, y - 0.55 * s, z, 0.035 * s, 0.4 * s);
  };
  K.lanternString = (b, x0, x1, y, z, step = 2.0) => {
    wire(b, x0, y, z, x1, y, z, 0.6, { n: 8 });
    const n = Math.round(Math.abs(x1 - x0) / step);
    for (let i = 1; i < n; i++) { const t = i / n; K.lantern(b, x0 + (x1 - x0) * t, y - 0.6 * 4 * t * (1 - t) - 0.55, z, 0.55); }
  };
  K.lanternRun = (b, x, y, z0, z1) => {   // lantern strings on posts along the street
    for (let z = z0; z < z1 - 1; z += 10) {
      const za = z, zb = Math.min(z + 10, z1);
      b.cyl(VC.metal, '#2a2a2e', x, y / 2, -za, 0.05, y);
      wire(b, x, y, -za, x, y, -zb, 0.5, { n: 6 });
      for (let k = 1; k < 5; k++) { const t = k / 5; K.lantern(b, x, y - 2 * t * (1 - t) - 0.5, -(za + (zb - za) * t), 0.5); }
    }
  };
  K.huadeng = (b, x, z, s = 1) => {   // Chang'an Avenue lamp: tiers of white globes
    b.block(VC.solid, '#c9c6be', x, 0, z, 0.7, 0.6, 0.7);
    b.cyl(VC.metal, '#d9d6cc', x, 4.4 * s, z, 0.12 * s, 8.2 * s, 'cyl8');
    const glow = hdr('#fff0d0', 1.1);
    b.sph(VC.glow, glow, x, 8.75 * s, z, 0.32 * s);
    for (const [y, r, n, o] of [[7.95, 0.75, 4, Math.PI / 4], [7.15, 1.05, 6, 0]]) for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + o, gx = x + Math.cos(a) * r * s, gz = z + Math.sin(a) * r * s;
      beam(b, VC.metal, x, (y - 0.3) * s, z, gx, y * s - 0.2, gz, 0.05 * s, '#d9d6cc');
      b.sph(VC.glow, glow, gx, y * s, gz, 0.23 * s);
    }
  };
  K.gongdeng = (b, x, z, side) => {   // street lamp shaped like a palace lantern
    b.cyl(VC.metal, '#3a1e18', x, 2.2, z, 0.08, 4.4, 'cyl8');
    b.box(VC.metal, '#3a1e18', x - side * 0.45, 4.3, z, 0.9, 0.08, 0.08);
    const lx = x - side * 0.85;
    b.cyl(VC.solid, '#7a1414', lx, 4.08, z, 0.34, 0.12, 'cyl6');
    b.cyl(VC.glow, hdr('#ffc070', 1.35), lx, 3.72, z, 0.26, 0.56, 'cyl6');
    b.cyl(VC.solid, '#7a1414', lx, 3.4, z, 0.3, 0.1, 'cyl6');
    b.cyl(VC.glow, hdr('#ff6a3a', 1.2), lx, 3.16, z, 0.04, 0.32);
  };
  const COATS = ['#2b2d3a', '#3a2f3f', '#1f2a3a', '#4a3a34', '#2f3a2f', '#5a2b33', '#2a3550', '#7a6a5a', '#8a2a2a', '#3a4a6a'];
  K.person = (b, x, z, { s = rand(0.92, 1.06), coat = pick(COATS), cap = null, seated = false } = {}) => {
    const y = seated ? -0.45 : 0;
    if (!seated) b.add(G.cyl8, VC.solid, x, 0.55 * s, z, 0.3 * s, 1.1 * s, 0.24 * s, 0, 0, 0, '#1c1c22');
    b.box(VC.solid, coat, x, y + 1.25 * s, z, 0.46 * s, 0.62 * s, 0.28 * s);
    b.sph(VC.solid, '#d9b08c', x, y + 1.72 * s, z, 0.15 * s, true);
    if (cap) b.add(G.cyl8, VC.solid, x, y + 1.84 * s, z, 0.34 * s, 0.1 * s, 0.34 * s, 0, 0, 0, cap);
    else b.sph(VC.solid, pick(['#141414', '#2a1a12', '#8a8a8a']), x, y + 1.79 * s, z + 0.02, 0.16 * s, true);
  };
  K.crowd = (b, x0, x1, z0, z1, n) => { for (let i = 0; i < n; i++) K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1)); };
  K.bike = (b, x, z, side, col = pick(['#2a2a2e', '#1f5fbf', '#8a1a18', '#3a8a5a']), ang = 0) => {
    const c = Math.cos(ang), sn = Math.sin(ang), P = (dz) => [x + sn * dz, z + c * dz];
    for (const dz of [-0.55, 0.55]) { const [px, pz] = P(dz); b.add(G.tor, VC.metal, px, 0.36, pz, 0.72, 0.72, 0.72, 0, Math.PI / 2 + ang, 0, '#2a2a2e'); }
    const [ax, az] = P(-0.55), [bx, bz] = P(0.1), [cx, cz] = P(0.55), [dx, dz2] = P(0.45);
    beam(b, VC.metal, ax, 0.36, az, bx, 0.82, bz, 0.05, col);
    beam(b, VC.metal, cx, 0.36, cz, dx, 0.98, dz2, 0.05, col);
    beam(b, VC.metal, bx, 0.82, bz, dx, 0.92, dz2, 0.05, col);
    b.box(VC.solid, '#151515', bx, 0.9, bz, 0.12, 0.06, 0.26);
  };
  K.sharedBikes = (b, x, z0, n, side) => {
    const col = pick(['#f2c200', '#2a8adf', '#3ab54a']);
    for (let k = 0; k < n; k++) K.bike(b, x, z0 - k * 0.62, side, col, side * 0.5);
  };
  K.rickshaw = (b, x, z) => {   // 三轮车 for hutong tours, red canopy
    for (const [wx, wz] of [[0, -1.0], [-0.55, 0.6], [0.55, 0.6]]) b.add(G.tor, VC.metal, x + wx, 0.34, z + wz, 0.66, 0.66, 0.66, 0, Math.PI / 2, 0, '#2a2a2e');
    beam(b, VC.metal, x, 0.4, z - 1.0, x, 0.9, z - 0.2, 0.06, '#7a1414');
    b.block(VC.solid, '#7a1414', x, 0.45, z + 0.65, 1.2, 0.5, 0.8);
    b.block(VC.solid, '#c93a2a', x, 0.95, z + 0.75, 1.15, 0.12, 0.7);
    b.box(VC.solid, '#c93a2a', x, 1.3, z + 1.05, 1.15, 0.7, 0.1);
    for (const wx of [-0.55, 0.55]) b.cyl(VC.metal, '#2a2a2e', x + wx, 1.55, z + 0.95, 0.02, 1.2);
    b.box(VC.solid, '#c93a2a', x, 2.15, z + 0.7, 1.3, 0.08, 1.0);
    K.person(b, x, z - 0.25, { seated: true, cap: '#2a2a2e', coat: '#3a3a3e' });
  };
  K.tanghulu = (b, x, z) => {   // candied-haw seller with his straw post (冰糖葫芦)
    K.person(b, x, z, { cap: '#3a3a3e', coat: '#2a3550' });
    b.cyl(VC.solid, '#6a5a48', x + 0.45, 1.0, z, 0.03, 2.0);
    b.cyl(VC.solid, '#c9a86a', x + 0.45, 2.15, z, 0.17, 0.75, 'cyl8');
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2, y = 1.95 + (k % 3) * 0.2, dx = Math.cos(a), dz = Math.sin(a);
      const sx = x + 0.45 + dx * 0.15, sz = z + dz * 0.15;
      beam(b, VC.solid, sx, y, sz, sx + dx * 0.55, y + 0.35, sz + dz * 0.55, 0.012, '#d9c9a0');
      for (let j = 0; j < 4; j++) { const t = 0.35 + j * 0.2; b.sph(K.hawMat, 0xffffff, sx + dx * 0.55 * t, y + 0.35 * t, sz + dz * 0.55 * t, 0.05, true); }
    }
  };
  K.elder = (b, x, z, side) => {   // old man taking his bird out (遛鸟)
    K.person(b, x, z, { cap: '#4a4a4e', coat: pick(['#3a4a6a', '#4a4a4e', '#2a3550']) });
    const cx = x - side * 0.5, cy = 1.45;
    beam(b, VC.solid, x - side * 0.2, 1.4, z, cx, cy + 0.65, z, 0.03, '#5a4a3a');
    b.cyl(VC.solid, '#6a4a2a', cx, cy, z, 0.22, 0.04);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.cyl(VC.solid, '#8a6a3a', cx + Math.cos(a) * 0.2, cy + 0.24, z + Math.sin(a) * 0.2, 0.008, 0.46); }
    b.add(G.sph, VC.solid, cx, cy + 0.47, z, 0.42, 0.22, 0.42, 0, 0, 0, '#8a6a3a');
    b.sph(VC.solid, '#ffd23d', cx, cy + 0.18, z, 0.06, true);
  };
  K.chess = (b, x, z) => {   // street xiangqi game with a ring of onlookers
    b.block(VC.solid, '#6a5a48', x, 0, z, 0.8, 0.7, 0.8);
    b.box(VC.solid, '#e8c890', x, 0.72, z, 0.62, 0.02, 0.62);
    for (let k = 0; k < 8; k++) b.cyl(VC.solid, k % 2 ? '#c81e1e' : '#141414', x + rand(-0.25, 0.25), 0.75, z + rand(-0.25, 0.25), 0.04, 0.03);
    for (const dx of [-0.7, 0.7]) { b.block(VC.solid, '#5a4a3a', x + dx, 0, z, 0.36, 0.42, 0.36); K.person(b, x + dx, z, { seated: true, cap: chance(0.5) ? '#4a4a4e' : null }); }
    for (let k = 0; k < randi(1, 3); k++) K.person(b, x + rand(-0.9, 0.9), z + pick([-0.8, 0.8]) + rand(-0.2, 0.2));
  };
  K.taxi = (b, x, z) => {   // Beijing taxi: yellow upper body over a coloured skirt
    const low = pick(['#2f7a4a', '#2a5fb0', '#8a3a2a', '#c99a2a', '#2f7a4a']), top = '#f2c200';
    b.block(VC.solid, low, x, 0.3, z, 1.75, 0.55, 4.3);
    b.block(VC.solid, top, x, 0.85, z, 1.76, 0.22, 4.3);
    b.block(VC.solid, top, x, 1.07, z + 0.15, 1.6, 0.62, 2.4);
    b.box(VC.glow, hdr('#bcd6ff', 0.45), x, 1.38, z + 0.15, 1.62, 0.32, 2.15);
    b.box(VC.glow, hdr('#ffcf5a', 2.2), x, 1.82, z + 0.3, 0.6, 0.18, 0.22);
    for (const dz of [-1.35, 1.35]) for (const dx of [-0.8, 0.8]) b.cyl(VC.solid, '#111111', x + dx, 0.3, z + dz, 0.3, 0.22, 'cyl', 0, Math.PI / 2);
    b.box(VC.glow, hdr('#fff4d6', 2.4), x, 0.62, z + 2.16, 1.3, 0.12, 0.04);
    b.box(VC.glow, hdr('#ff2a2a', 2.0), x, 0.62, z - 2.16, 1.3, 0.12, 0.04);
  };
  K.lion = (b, x, z, ry = 0, s = 1) => {   // stone lion on its pedestal, facing ry
    const c = Math.sin(ry), d = Math.cos(ry), stone = '#a29e94';
    b.block(VC.solid, '#8a877e', x, 0, z, 1.3 * s, 1.1 * s, 1.6 * s);
    b.add(G.sph, VC.solid, x - c * 0.15 * s, 1.75 * s, z - d * 0.15 * s, 0.85 * s, 1.2 * s, 1.0 * s, 0, ry, 0, stone);
    b.sph(VC.solid, stone, x + c * 0.25 * s, 2.45 * s, z + d * 0.25 * s, 0.42 * s);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; b.sph(VC.solid, '#8f8b82', x + c * 0.1 * s + Math.cos(a) * 0.38 * s, 2.5 * s + Math.sin(a) * 0.3 * s, z + d * 0.1 * s, 0.16 * s, true); }
    for (const o of [-0.25, 0.25]) b.box(VC.solid, stone, x + c * 0.35 * s + d * o * s, 1.45 * s, z + d * 0.35 * s - c * o * s, 0.22 * s, 0.75 * s, 0.22 * s);
    b.sph(VC.solid, '#8f8b82', x + c * 0.5 * s + d * 0.38 * s, 1.25 * s, z + d * 0.5 * s - c * 0.38 * s, 0.2 * s, true);
  };

  K.update = (t) => {
    K.screen.uniforms.time.value = t;
    K.trails[0].offset.x = -t * 0.9; K.trails[1].offset.x = t * 0.75;
  };
  return K;
}
