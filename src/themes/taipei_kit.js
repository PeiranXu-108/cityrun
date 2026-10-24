// Taipei street kit for a rainy autumn night. Narrow shophouses and walk-up apartments in their little brown and beige
// tiles, the arcades (騎樓) running under every one of them, each with its own floor and its own step; iron window cages
// full of potted plants, air-conditioners, rooftop tin shacks and stainless water tanks; lightbox signs stacked up the
// facades (dentists, cram schools, KTV, hotels), red LED marquees, convenience stores, bubble tea, claw machines, beef
// noodles, betel nut kiosks in chasing neon; Dihua Street's baroque fronts and dried goods, Xinyi's towers and skywalks,
// the lanes with their shrines and cables, the night markets' carts, the riverside under the floodwall; scooters parked
// in rows everywhere, yellow taxis, buses, the walking green man counting down, and people under their umbrellas.
import { THREE, VC, G, std, basic, hdr, canvasTex, planeUV, buildingGeo, windowTex, roundRect, shade, curveUniforms, CURVE_GLSL, rand, randi, pick, chance } from '../core.js';
import { EDGE, at, facadeMat, waterMat, screenMat, screenTint } from './common.js';
import { beam, wire } from './tokyo_kit.js';
import { roofGeo } from './beijing_kit.js';
import { taipeiTreeKit } from './trees.js';
import { puffs } from './taipei_towers.js';

// Taiwan's own type: Noto Sans TC for the lightboxes, Noto Serif TC for the old boards, justfont's rounded Huninn for
// the tea shops and the market, Iansui's brush hand for the temples
export const HEI = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", "Heiti TC", sans-serif';
export const MING = '"Noto Serif TC", "Songti TC", "PMingLiU", serif';
export const ROUND = '"Huninn", "Noto Sans TC", "PingFang TC", sans-serif';
export const KAI = '"Iansui", "Kaiti TC", "BiauKai", "DFKai-SB", serif';
export const NEON = { red: '#ff2d3a', pink: '#ff4fa8', mag: '#ff3df0', cyan: '#3dfff0', blue: '#3da8ff', green: '#39ff88', yellow: '#ffe23d', orange: '#ff9a2a', white: '#fff2d8', purple: '#b26bff' };
export const X0 = EDGE + 3.4;   // the building line: the arcade's columns, the upper floors' faces
export const ARC = 3.2;          // the arcade's depth, the shopfronts behind it
export const GF = 4.2, FH = 3.2, BAY = 2.2;   // first-floor level, storey height, window bay
export const WY = -2.2;          // the river, below the riverside path
const FLUO = ['#eaf6ff', '#e2fbef', '#f4fbff', '#e6f0ff', '#f0fff4'];
const WARMW = ['#ffe2b0', '#ffd496', '#fff0d0', '#ffc878'];
const OFFICE = ['#e8f2ff', '#d8e8ff', '#f4f8ff', '#cfe0f0', '#fff4e0'];
const TILES = ['#d4c8b0', '#c8b49a', '#b8b0a4', '#a4a49e', '#d0d0c8', '#c8a094', '#a8b4a0', '#9a9a94', '#b4745a', '#86684e', '#c4b8a0', '#bcc4c8', '#e0dcd4'];
const FLOORS = ['#a85a44', '#8a8a86', '#c8bca4', '#6a6a66', '#b89070', '#9aa098', '#c8c4b8', '#7a5040'];
export const COATS = ['#1a1a1e', '#2a2a32', '#3a3a44', '#e8e8ec', '#c8c0b0', '#2a3a5a', '#5a1a20', '#8a8a92', '#1f2a44', '#d8d0c0', '#4a3a30', '#c8202c', '#f0e8d8', '#2a4a3a', '#e8c040', '#6a7a9a', '#d88aa0', '#5a7a5a'];
const TROUSERS = ['#1c1c22', '#2a3a5a', '#3a3a40', '#d8d0c0', '#4a4a52', '#1a2030', '#5a6a8a', '#2a4a7a'];
export const SKIN = ['#f0d0b0', '#e8c4a0', '#dcb08a', '#c8946a', '#f4dcc4', '#a87a5a'];
const HAIR = ['#141414', '#1a1410', '#141414', '#2a1e16', '#3a2a1e', '#5a3a24', '#8a6a4a', '#c8c0b8'];
const UMBRELLAS = ['#dfe8ee', '#dfe8ee', '#dfe8ee', '#141418', '#1f2a5a', '#c8202c', '#f0c030', '#e86aa0', '#2a7ad8', '#2a8a5a', '#8a5ad8', '#ff8a3a'];
const SCOOTERS = ['#f4f4f0', '#141416', '#c8202c', '#1f4aa8', '#9aa0a8', '#5a5e66', '#e8d8b8', '#8ac8d8', '#f0a0b0', '#2a6a4a', '#e8c040', '#f4f4f0', '#141416'];
const TARPS = ['#c8202c', '#1f5aa8', '#2a7a4a', '#e8b020', '#e86a1a', '#7a3aa8', '#e8e8e0', '#2a8ab8'];
const LAUNDRY = ['#f4f4f0', '#e8e8ff', '#c8202c', '#1f5aa8', '#f0d040', '#2a8a5a', '#f0a0c0', '#1a1a1e', '#8a8a92', '#ff8a3a', '#a0d0f0'];
const LANTERN = new THREE.SphereGeometry(0.5, 8, 5);
const UMB = new THREE.SphereGeometry(0.6, 8, 2, 0, Math.PI * 2, 0, 1.1);   // an umbrella's canopy: a shallow dome
const mix = (a, b2, k) => '#' + new THREE.Color(a).lerp(new THREE.Color(b2), k).getHexString();
const pickW = (w) => { let r = Math.random() * Object.values(w).reduce((a, b2) => a + b2, 0); for (const k in w) { r -= w[k]; if (r <= 0) return k; } return Object.keys(w)[0]; };

// ---------- the words on the signs ----------
// lightboxes stacked up the facades: [text, ground, ink, style] (box: a lit face with painted letters; neon: tubes on black)
const V_SIGNS = [
  ['牙醫診所', '#ffffff', '#1a5ad8', 'box'], ['眼鏡', '#ffe23d', '#141414', 'box'], ['KTV', '#0c0c10', 'pink', 'neon'], ['旅館', '#0c0c10', 'cyan', 'neon'],
  ['補習班', '#1f4aa8', '#ffffff', 'box'], ['英文', '#d8202a', '#ffffff', 'box'], ['中醫診所', '#ffffff', '#1a7a3a', 'box'], ['銀樓', '#c8101e', '#ffe08a', 'box'],
  ['當舖', '#141414', '#ffd23d', 'box'], ['按摩', '#0c0c10', 'yellow', 'neon'], ['腳底按摩', '#2a8a4a', '#ffffff', 'box'], ['彩券', '#ffd23d', '#c8101e', 'box'],
  ['通訊行', '#1a8ad8', '#ffffff', 'box'], ['網咖', '#0c0c10', 'green', 'neon'], ['撞球', '#0c0c10', 'blue', 'neon'], ['美髮', '#ff8ab8', '#ffffff', 'box'],
  ['安親班', '#ff9a2a', '#ffffff', 'box'], ['小兒科', '#ffffff', '#ff6a1a', 'box'], ['皮膚科', '#ffffff', '#8a3ad8', 'box'], ['藥局', '#1a9a4a', '#ffffff', 'box'],
  ['火鍋', '#d8202a', '#ffe23d', 'box'], ['熱炒', '#0c0c10', 'red', 'neon'], ['豆花', '#f4e8c8', '#8a4a1a', 'box'], ['牛肉麵', '#c8101e', '#ffffff', 'box'],
  ['麻將', '#0c0c10', 'green', 'neon'], ['電玩', '#0c0c10', 'mag', 'neon'], ['商務旅館', '#1a3a6a', '#ffffff', 'box'], ['汽車美容', '#ffffff', '#d8202a', 'box'],
  ['鎖匙', '#ffd23d', '#1a1a1a', 'box'], ['刻印', '#ffffff', '#c8101e', 'box'], ['冷氣', '#3ab8e8', '#ffffff', 'box'], ['手機維修', '#ffffff', '#1a5ad8', 'box'],
  ['自助洗衣', '#3ab8e8', '#ffffff', 'box'], ['推拿', '#ffffff', '#2a6a3a', 'box'], ['瑜珈', '#e8d0f0', '#6a2a8a', 'box'], ['數學', '#ffd23d', '#1f4aa8', 'box'],
];
// the boards over the arcades: [name, ground, ink, style, line]
const H_SIGNS = [
  ['便利商店', '#ffffff', '#1a8a5a', 'conv', '24H'], ['春日手搖茶', '#ffffff', '#2a8a5a', 'board', 'TEA'], ['黑糖珍珠鮮奶', '#3a2416', '#f4d8a0', 'board', ''],
  ['阿忠牛肉麵', '#c8101e', '#ffffff', 'board', ''], ['黃家滷肉飯', '#f4e8c8', '#8a1a1a', 'board', ''], ['好味雞排', '#ffd23d', '#c8101e', 'board', ''],
  ['老街豆花', '#ffffff', '#6a3a1a', 'board', ''], ['金源銀樓', '#c8101e', '#ffe08a', 'board', ''], ['大眾藥局', '#1a9a4a', '#ffffff', 'board', ''],
  ['明亮眼鏡', '#ffffff', '#1a5ad8', 'board', ''], ['夾娃娃機', '#ff5aa8', '#ffffff', 'board', 'CLAW MACHINES'], ['好運彩券行', '#ffd23d', '#c8101e', 'board', ''],
  ['宏達機車行', '#1f4aa8', '#ffffff', 'board', ''], ['萬家通訊', '#1a8ad8', '#ffffff', 'board', ''], ['永和豆漿', '#ffffff', '#c8101e', 'board', '24H'],
  ['小李麻辣鍋', '#141414', '#ff3a2a', 'board', ''], ['蔡記臭豆腐', '#f4e8c8', '#1a1a1a', 'board', ''], ['芒果雪花冰', '#ffb020', '#ffffff', 'board', ''],
  ['乾元蔘藥行', '#2a1a10', '#e8c060', 'board', ''], ['林合發茶行', '#1a3a1a', '#f0d890', 'board', ''], ['瑞成布行', '#5a1a1a', '#f4e8c8', 'board', ''],
  ['新順南北貨', '#3a2410', '#ffd890', 'board', ''], ['巷口咖啡', '#2a2420', '#f4e8d8', 'board', 'CAFÉ'], ['媽媽麵包店', '#f4e8c8', '#a8401a', 'board', 'BAKERY'],
  ['美味早餐', '#ff9a2a', '#ffffff', 'board', ''], ['林記鍋貼', '#1a5a2a', '#ffffff', 'board', ''], ['老王牛肉麵', '#1a1a1a', '#ffd23d', 'board', ''],
  ['阿嬤甜湯', '#ffffff', '#c8101e', 'board', ''],
];
// the blue road plates, Chinese over the romanised name
const STREETS = [['忠孝東路四段', 'Sec. 4, Zhongxiao E. Rd.'], ['南京西路', 'Nanjing W. Rd.'], ['中山北路二段', 'Sec. 2, Zhongshan N. Rd.'], ['仁愛路四段', "Sec. 4, Ren'ai Rd."],
  ['敦化南路一段', 'Sec. 1, Dunhua S. Rd.'], ['信義路五段', 'Sec. 5, Xinyi Rd.'], ['羅斯福路三段', 'Sec. 3, Roosevelt Rd.'], ['西寧南路', 'Xining S. Rd.'],
  ['漢中街', 'Hanzhong St.'], ['迪化街一段', 'Sec. 1, Dihua St.'], ['饒河街', 'Raohe St.'], ['廣州街', 'Guangzhou St.'], ['永康街', 'Yongkang St.'], ['師大路', 'Shida Rd.'],
  ['民生東路', 'Minsheng E. Rd.'], ['和平東路', 'Heping E. Rd.'], ['凱達格蘭大道', 'Ketagalan Blvd.'], ['重慶南路一段', 'Sec. 1, Chongqing S. Rd.'], ['成都路', 'Chengdu Rd.']];
export const STREET = { hanzhong: 8, ketagalan: 16, chongqing: 17, chengdu: 18 };
// the night markets' stalls: [name, ground, ink, what's on the cart]; the games keep their own gear
export const STALLS = [
  ['大腸包小腸', '#ffd23d', '#c8101e', 'grill'], ['蚵仔煎', '#ffffff', '#1a5ad8', 'griddle'], ['臭豆腐', '#141414', '#ffe23d', 'fryer'], ['大雞排', '#c8101e', '#ffffff', 'cutlet'],
  ['胡椒餅', '#8a1a1a', '#ffe08a', 'oven'], ['蔥抓餅', '#ffffff', '#2a8a3a', 'griddle'], ['地瓜球', '#ffb020', '#5a2a10', 'balls'], ['烤玉米', '#ffe23d', '#5a2a10', 'corn'],
  ['鹽酥雞', '#c8101e', '#ffe23d', 'basket'], ['滷味', '#3a2410', '#ffd890', 'basket'], ['生炒花枝', '#1a5ad8', '#ffffff', 'wok'], ['藥燉排骨', '#2a1a10', '#e8c060', 'pots'],
  ['刈包', '#ffffff', '#c8101e', 'steamer'], ['麻糬', '#ffd0e0', '#8a2a4a', 'tray'], ['甘蔗汁', '#3a8a2a', '#ffffff', 'cane'], ['木瓜牛奶', '#ff8a3a', '#ffffff', 'fruit'],
  ['珍珠奶茶', '#3a2416', '#f4d8a0', 'drinks'], ['芒果冰', '#ffb020', '#ffffff', 'ice'], ['烤香腸', '#c8101e', '#ffffff', 'grill'], ['蚵仔麵線', '#5a2a10', '#ffe8c0', 'pots'],
  ['射氣球', '#ff3d9a', '#ffffff', 'balloons'], ['撈金魚', '#1a8ad8', '#ffffff', 'goldfish'], ['套圈圈', '#39c86a', '#ffffff', 'prizes'], ['彈珠台', '#b26bff', '#ffffff', 'pinball'],
  ['草莓糖葫蘆', '#c8101e', '#ffffff', 'tanghulu'], ['現切水果', '#2a8a3a', '#ffffff', 'fruit'], ['車輪餅', '#ffd23d', '#8a2a10', 'wheel'], ['烤魷魚', '#141414', '#ff8a2a', 'squid'],
];
const GAMES = new Set(['balloons', 'goldfish', 'prizes', 'pinball']);
// the price cards taped to the carts
const PRICES = ['60元', '50元', '70元', '80元', '100元', '35元', '一份60', '大份100'];
const ADS = [   // the LED screens: [headline, line, colours, icon, ink]
  ['城市酷跑', 'CITY DASH', ['#ff3df0', '#3d6bff'], 'bolt'], ['珍珠奶茶', 'BUBBLE TEA', ['#c87a2a', '#4a1e0a'], 'boba'], ['鳳梨酥', 'PINEAPPLE CAKE', ['#ffcf3a', '#e88a1a'], 'cake'],
  ['夜市美食', 'NIGHT MARKET', ['#d8202a', '#ff8a3a'], 'lantern'], ['跨年晚會', "NEW YEAR'S EVE", ['#3a1a8a', '#ff3df0'], 'stars'], ['台北 101', 'TAIPEI 101', ['#0a2a4a', '#2a8a7a'], 'tower'],
  ['小籠包', 'SOUP DUMPLINGS', ['#f4ecd8', '#c8a878'], 'steamer', '#5a2a10'], ['週年慶', 'ANNIVERSARY SALE', ['#141414', '#3a0a0a'], 'bar', '#ffe23d'],
];
export const DESTS = [['淡水', 'Tamsui'], ['象山', 'Xiangshan'], ['南港展覽館', 'Nangang Exhibition Ctr.'], ['頂埔', 'Dingpu'], ['松山', 'Songshan'], ['新店', 'Xindian'], ['動物園', 'Taipei Zoo'], ['蘆洲', 'Luzhou']];
const MARQUEE = '歡迎光臨 ★ 營業中 ★ 全面八折 ★ 24H ★ 新品上市 ★ 買一送一 ★ ';
// everything else the Taipei canvases write, so the web fonts can be fetched for exactly these glyphs first
const EXTRA = '♨龍山寺艋舺福德宮正神國泰民安風調雨順合境平安慈祐宮霞海城隍廟天上聖母饒河街觀光夜市西門町紅樓徒步區自由廣場國家戲劇院音樂廳兩廳院中正紀念堂北投溫泉博物館地熱谷圖書館迪化大稻埕永樂市場台北臺北信義商圈捷運站市政府世貿新北投大橋頭垃圾車資源回收請做好分類清潔隊施工中敬請見諒造成不便小心慢行檳榔香菸飲料冰涼樂透刮刮頭獎公共自行車國內限時郵政計程車公車即將進站分鐘巷弄號水門環河快速道路自行車道請勿進入淡水河乙未年月吉日入口出口月台往方向觀音佛祖南無阿彌陀佛鐘鼓樓三川殿正殿後殿龍虎井名人巷戲院電影街萬年大樓峨嵋停車場百貨誠品百貨公司遠東統一時代空橋步道市府轉運溫泉鄉湯屋泡湯露天浴池湯之瀧北投公園凱達格蘭文化館普濟寺台灣臺灣欒樹茶藝館大樹下歇腳亭滷肉飯蚵仔煎總統府景福門外交部臺北賓館西門站號出口';
export const GLYPHS = [...new Set([V_SIGNS.map((e) => e[0]), H_SIGNS.map((e) => e[0]), STREETS.map((e) => e[0]), STALLS.map((e) => e[0]), PRICES, ADS.map((e) => e[0]), DESTS.map((e) => e[0]), MARQUEE, EXTRA].flat().join(''))].join('');

// ---------- drawing helpers ----------
function tube(g, x, y, w, h, col, r = 10) {   // a neon tube bent round the edge of a board
  g.shadowColor = col; g.shadowBlur = 12; g.strokeStyle = col; g.lineWidth = 5; roundRect(g, x, y, w, h, r); g.stroke();
  g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 1.6; roundRect(g, x, y, w, h, r); g.stroke();
}
function glyph(g, t, x, y, size, col, glow, max) {   // neon letters: the coloured glow round a white-hot core
  if (glow) {
    g.shadowColor = col; g.shadowBlur = size * 0.3; g.fillStyle = col; g.fillText(t, x, y, max);
    g.shadowBlur = size * 0.06; g.globalAlpha = 0.78; g.fillStyle = mix(col, '#ffffff', 0.6); g.fillText(t, x, y, max);
    g.globalAlpha = 1; g.shadowBlur = 0;
  } else { g.fillStyle = col; g.fillText(t, x, y, max); }
}
function lightbox(g, w, h, bg) {   // a lightbox's plastic face, a touch brighter where the tubes behind it are
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, shade(bg, 0.84)); gr.addColorStop(0.5, bg); gr.addColorStop(1, shade(bg, 0.84));
  g.fillStyle = gr; g.fillRect(4, 4, w - 8, h - 8);
}
function drawV(g, [text, bg, fg, style], w, h) {
  g.fillStyle = '#0c0c10'; g.fillRect(0, 0, w, h);
  const neon = style === 'neon', chars = [...text], n = chars.length, top = 22, bot = 22;
  if (neon) tube(g, 10, 10, w - 20, h - 20, NEON[fg]);
  else { lightbox(g, w, h, bg); g.fillStyle = fg; g.fillRect(4, 4, w - 8, 9); g.fillRect(4, h - 13, w - 8, 9); }
  const latin = /^[A-Z]+$/.test(text), size = latin ? Math.min(w * 0.8, ((h - top - bot) / n) * 0.9) : Math.min(w * 0.74, ((h - top - bot) / n) * 0.92);
  g.font = `900 ${Math.floor(size)}px ${HEI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  chars.forEach((c, k) => glyph(g, c, w / 2, top + ((h - top - bot) * (k + 0.5)) / n + size * 0.04, size, neon ? NEON[fg] : fg, neon));
}
function drawH(g, [name, bg, fg, style, sub], w, h) {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (style === 'conv') {   // a convenience store's fascia: white, its colour bands, the name and the hours
    for (const [y, c] of [[0.62, '#1a8a5a'], [0.72, '#f4a020'], [0.82, '#d8202a']]) { g.fillStyle = c; g.fillRect(0, h * y, w, h * 0.08); }
    g.fillStyle = '#1a6a4a'; g.font = `900 ${Math.floor(h * 0.42)}px ${HEI}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(name, 20, h * 0.33, w * 0.62);
    g.fillStyle = '#d8202a'; g.textAlign = 'right'; g.font = `900 ${Math.floor(h * 0.4)}px ${HEI}`; g.fillText(sub, w - 18, h * 0.33);
    return;
  }
  lightbox(g, w, h, bg);
  g.strokeStyle = fg; g.globalAlpha = 0.5; g.lineWidth = 3; g.strokeRect(9, 9, w - 18, h - 18); g.globalAlpha = 1;
  const font = /雞排|豆花|甜湯|冰|手搖|珍珠|早餐|麵包|娃娃/.test(name) ? ROUND : /茶行|布行|南北貨|藥行|銀樓/.test(name) ? MING : HEI;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg;
  g.font = `900 ${Math.floor(h * (sub ? 0.5 : 0.6))}px ${font}`;
  if ([...name].length <= 4 && 'letterSpacing' in g) g.letterSpacing = '10px';
  g.fillText(name, w / 2 + ('letterSpacing' in g && [...name].length <= 4 ? 5 : 0), h * (sub ? 0.42 : 0.52), w - 36);
  if ('letterSpacing' in g) g.letterSpacing = '0px';
  if (sub) { g.font = `700 ${Math.floor(h * 0.17)}px ${HEI}`; g.fillText(sub, w / 2, h * 0.8, w - 50); }
}
function atlas(entries, cw, ch, cols, draw) {
  const rows = Math.ceil(entries.length / cols), W = cw * cols, H = ch * rows;
  const tex = canvasTex(W, H, (g) => entries.forEach((e, i) => { g.save(); g.translate((i % cols) * cw, Math.floor(i / cols) * ch); draw(g, e, cw, ch, i); g.restore(); }), { repeat: false });
  const rects = entries.map((_, i) => { const c = i % cols, r = Math.floor(i / cols); return { u0: c / cols + 1 / W, u1: (c + 1) / cols - 1 / W, v0: 1 - (r + 1) / rows + 1 / H, v1: 1 - r / rows - 1 / H }; });
  return { tex, rects };
}

// ---------- facades ----------
// walk-ups and shophouses faced in little "two-brick" tiles (二丁掛) or mosaic, aluminium windows, grime under the sills.
// A cell is one bay by one storey. win 0: two sliding panes under a transom, 1: three panes across the bay, 2: frosted.
function aptTex({ cols = 4, rows = 6, cw = 40, ch = 58, litChance = 0.5, win = 0, mosaic = false } = {}) {
  const W = cols * cw, H = rows * ch, n = cols * rows, cells = [], q = [];
  for (let r = 0; r < rows; r++) {
    const rl = Math.random() < 0.12 ? 0.9 : litChance;
    for (let c = 0; c < cols; c++) { cells.push(Math.random() < rl ? (Math.random() < 0.72 ? pick(FLUO) : pick(WARMW)) : null); q.push(Math.random()); }
  }
  const R = (c, r) => (win === 1 ? [c * cw + 3, r * ch + 12, cw - 6, ch - 26] : [c * cw + 7, r * ch + 11, cw - 14, ch - 25]);
  const panes = (g, x, y, w, h, col) => {
    g.strokeStyle = col; g.lineWidth = 1.4; g.beginPath();
    const np = win === 1 ? 3 : 2;
    for (let k = 1; k < np; k++) { g.moveTo(x + (w * k) / np, y + (win === 0 ? h * 0.26 : 0)); g.lineTo(x + (w * k) / np, y + h); }
    if (win === 0) { g.moveTo(x, y + h * 0.26); g.lineTo(x + w, y + h * 0.26); }
    g.stroke();
  };
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = '#f2eee6'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(80,70,60,0.2)';
    if (mosaic) { for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 0.7); for (let x = 0; x < W; x += 3) g.fillRect(x, 0, 0.7, H); }
    else for (let y = 0; y < H; y += 3) { g.fillRect(0, y, W, 0.8); for (let x = (y / 3) % 2 ? 5 : 0; x < W; x += 10) g.fillRect(x, y, 0.8, 3); }
    for (let r = 0; r < rows; r++) { g.fillStyle = 'rgba(226,222,212,0.95)'; g.fillRect(0, r * ch + ch - 5, W, 5); g.fillStyle = 'rgba(60,50,40,0.3)'; g.fillRect(0, r * ch + ch - 1, W, 1); }
    for (let i = 0; i < n * 1.4; i++) {   // the rain's grime under every sill
      const x = rand(0, W), y = rand(0, H), len = rand(8, 40), gr = g.createLinearGradient(0, y, 0, y + len);
      gr.addColorStop(0, `rgba(${pick(['60,56,50', '80,70,56', '50,54,56'])},${rand(0.14, 0.32).toFixed(2)})`); gr.addColorStop(1, 'rgba(60,56,50,0)');
      g.fillStyle = gr; g.fillRect(x, y, rand(1.5, 4), len);
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r);
      g.fillStyle = '#c4c8cc'; g.fillRect(x - 2, y - 2, w + 4, h + 4);
      g.fillStyle = win === 2 ? '#3a4048' : '#12161e'; g.fillRect(x, y, w, h);
      panes(g, x, y, w, h, '#b4bac0');
      g.fillStyle = 'rgba(236,234,226,0.95)'; g.fillRect(x - 3, y + h + 2, w + 6, 2.5);
    }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r), i = r * cols + c, col = cells[i];
      if (col) {
        const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, col); gr.addColorStop(1, shade(col, 0.6));
        g.fillStyle = gr; g.fillRect(x, y, w, h);
        if (q[i] < 0.5) { g.fillStyle = pick(['rgba(40,60,120,0.6)', 'rgba(140,40,60,0.5)', 'rgba(150,120,40,0.5)', 'rgba(20,20,20,0.7)', 'rgba(60,120,80,0.5)', 'rgba(200,200,190,0.4)']); g.fillRect(x + (q[i] < 0.25 ? 0 : w * 0.45), y, w * 0.55, h); }   // a curtain drawn
        panes(g, x, y, w, h, '#000');
      }
      if (q[i] > 0.93) { g.fillStyle = '#ff2a14'; g.fillRect(x + w * 0.3, y + h - 7, w * 0.4, 5); }   // the red lamps of a family altar
    }
  });
  return { map, emissive, cols, rows };
}
// Dihua Street's shophouses: tall arched French windows between pilasters, mouldings and keystones, in stucco or red brick
function baroqueTex({ brick = false } = {}) {
  const cols = 4, rows = 3, cw = 40, ch = 58, W = cols * cw, H = rows * ch, cells = [];
  for (let i = 0; i < cols * rows; i++) cells.push(Math.random() < 0.5 ? pick(WARMW) : null);
  const R = (c, r) => [c * cw + 10, r * ch + 12, cw - 20, ch - 20];
  const arch = (g, x, y, w, h) => { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); };
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = brick ? '#f0e8e0' : '#f2ecdc'; g.fillRect(0, 0, W, H);
    if (brick) for (let y = 0; y < H; y += 4) for (let x = (y / 4) % 2 ? 4 : 0; x < W; x += 8) { const v = randi(-16, 16); g.fillStyle = `rgb(${176 + v},${76 + v / 2},${58 + v / 2})`; g.fillRect(x + 0.5, y + 0.5, 7, 3); }
    else for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(140,120,90,${rand(0.04, 0.1).toFixed(2)})`; g.beginPath(); g.ellipse(rand(0, W), rand(0, H), rand(6, 16), rand(4, 12), 0, 0, 7); g.fill(); }
    for (let c = 0; c <= cols; c++) { g.fillStyle = 'rgba(248,244,234,0.95)'; g.fillRect(c * cw - 3, 0, 6, H); g.fillStyle = 'rgba(90,70,50,0.25)'; g.fillRect(c * cw + 3, 0, 1.5, H); }   // the pilasters
    for (let r = 0; r < rows; r++) { g.fillStyle = 'rgba(250,246,236,0.95)'; g.fillRect(0, r * ch + ch - 6, W, 6); g.fillStyle = 'rgba(90,70,50,0.3)'; g.fillRect(0, r * ch + ch - 1, W, 1); }   // the cornices
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r);
      g.fillStyle = 'rgba(250,246,236,0.95)'; arch(g, x - 3, y - 3, w + 6, h + 4); g.fill();
      g.fillStyle = '#1a1610'; arch(g, x, y, w, h); g.fill();
      g.strokeStyle = '#7a5a36'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + w / 2, y + 2); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.45); g.lineTo(x + w, y + h * 0.45); g.stroke();
      g.fillStyle = '#e8dcc0'; g.fillRect(x + w / 2 - 2.5, y - 6, 5, 6);   // the keystone
      for (const sx of [x - 7, x + w + 1]) { g.fillStyle = pick(['#2f6a4a', '#5a3a24', '#2a4a6a']); g.fillRect(sx, y + 4, 6, h - 4); g.fillStyle = 'rgba(0,0,0,0.3)'; for (let yy = y + 5; yy < y + h; yy += 2.5) g.fillRect(sx, yy, 6, 0.8); }   // the shutters
    }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r), col = cells[r * cols + c];
      if (!col) continue;
      g.fillStyle = col; arch(g, x, y, w, h); g.fill();
      g.strokeStyle = '#000'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + w / 2, y + 2); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.45); g.lineTo(x + w, y + h * 0.45); g.stroke();
    }
  });
  return { map, emissive, cols, rows };
}

// ---------- shop windows: one display per row, so a window can tile its row along its length ----------
const WIN = { conv: 0, tea: 1, noodles: 2, claw: 3, pharmacy: 4, gold: 5, phone: 6, lottery: 7, herbal: 8, dried: 9, teashop: 10, fabric: 11, scooter: 12, shutter: 13, hotpot: 14, cafe: 15, bakery: 16, eyewear: 17, dessert: 18, breakfast: 19, fried: 20 };
const NWIN = 21;
function shopWinTex() {
  const RW = 256, RH = 64;
  return canvasTex(RW, RH * NWIN, (g) => {
    const shelf = (y0, ys, col = 'rgba(80,60,40,0.85)') => { g.fillStyle = col; for (const y of ys) g.fillRect(0, y0 + y, RW, 2.5); };
    const bg = (y0, a, b2) => { const gr = g.createLinearGradient(0, y0, 0, y0 + RH); gr.addColorStop(0, a); gr.addColorStop(1, b2); g.fillStyle = gr; g.fillRect(0, y0, RW, RH); };
    const dot = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    const folk = (x, y, col = 'rgba(30,24,24,0.85)') => { g.fillStyle = col; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); g.fillRect(x - 5, y + 4, 10, 13); };
    const goods = (y, x0, x1, cols) => { for (let x = x0; x < x1; x += rand(3.5, 6)) { g.fillStyle = pick(cols); g.fillRect(x, y + rand(0, 3), rand(2.5, 4.5), rand(8, 13)); } };
    const BRIGHT = ['#e82a4a', '#2a6ad8', '#f4f4f4', '#ffd23d', '#2ab86a', '#ff8ac0', '#7a4ad8', '#ff8a1a', '#3ad8e8'];
    for (let r = 0; r < NWIN; r++) {
      const y0 = r * RH;
      if (r === WIN.conv) {   // a convenience store: aisles of packets, the drinks fridges glowing along the back, the till
        bg(y0, '#ffffff', '#e8f0f8'); shelf(y0, [20, 38, 56], 'rgba(160,170,180,0.9)');
        for (const yb of [6, 24, 42]) goods(y0 + yb, 62, 196, BRIGHT);
        for (let x = 198; x < RW; x += 19) { g.fillStyle = '#e4f6ff'; g.fillRect(x, y0 + 4, 17, 56); for (let yy = 8; yy < 58; yy += 9) for (let k = 0; k < 4; k++) { g.fillStyle = pick(['#2a8ad8', '#e82a2a', '#2ab86a', '#ffd23d', '#f4f4f4', '#8a4a2a']); g.fillRect(x + 2 + k * 3.6, y0 + yy, 2.6, 7); } }
        g.fillStyle = '#d8d0c0'; g.fillRect(4, y0 + 40, 54, 22); g.fillStyle = '#3a3e44'; g.fillRect(10, y0 + 32, 12, 8); g.fillStyle = '#c8202c'; g.fillRect(36, y0 + 26, 12, 14); folk(28, y0 + 24, 'rgba(30,90,60,0.9)');
      } else if (r === WIN.tea) {   // a bubble tea counter: the menu boards, cups of milk tea with their pearls, the sealer
        bg(y0, '#fffaf0', '#f0dcb8');
        for (let x = 4; x < RW; x += 62) { g.fillStyle = pick(['#1e4a32', '#2a2a2a', '#5a2a1a']); g.fillRect(x, y0 + 3, 58, 18); g.fillStyle = 'rgba(255,250,230,0.85)'; for (let k = 0; k < 4; k++) g.fillRect(x + 4, y0 + 6 + k * 3.6, rand(20, 34), 1.5); g.fillStyle = '#ffd23d'; for (let k = 0; k < 4; k++) g.fillRect(x + 46, y0 + 6 + k * 3.6, 8, 1.5); }
        g.fillStyle = '#e8e0d0'; g.fillRect(0, y0 + 46, RW, 18);
        for (let x = 6; x < RW; x += 11) {
          const tea = pick(['#c8905a', '#e8c090', '#8a4a2a', '#f0a0b0', '#a0c860', '#f4e0c0']);
          g.fillStyle = 'rgba(232,240,248,0.75)'; g.beginPath(); g.moveTo(x, y0 + 30); g.lineTo(x + 8, y0 + 30); g.lineTo(x + 7, y0 + 46); g.lineTo(x + 1, y0 + 46); g.closePath(); g.fill();
          g.fillStyle = tea; g.fillRect(x + 1.2, y0 + 33, 5.8, 12); for (let k = 0; k < 3; k++) dot(x + 2.2 + k * 1.8, y0 + 44, 1, '#1a1008');
          g.fillStyle = '#3a3a3a'; g.fillRect(x + 3.6, y0 + 25, 0.9, 6);
        }
        folk(70, y0 + 24); folk(150, y0 + 24); g.fillStyle = '#c8202c'; g.fillRect(64, y0 + 19, 12, 2.5); g.fillRect(144, y0 + 19, 12, 2.5);
      } else if (r === WIN.noodles) {   // a beef noodle shop: the great pots steaming at the front, menu strips, diners
        bg(y0, '#fff2d8', '#e8b878');
        for (let x = 8; x < 104; x += 32) { const gr = g.createLinearGradient(x, 0, x + 26, 0); gr.addColorStop(0, '#8a9098'); gr.addColorStop(0.5, '#e8ecf0'); gr.addColorStop(1, '#7a8088'); g.fillStyle = gr; g.fillRect(x, y0 + 34, 26, 26); for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.arc(x + 13 + rand(-8, 8), y0 + rand(6, 30), rand(4, 8), 0, 7); g.fill(); } }
        for (let x = 112; x < RW; x += 12) { g.fillStyle = '#fff8ec'; g.fillRect(x, y0 + 4, 10, 24); g.fillStyle = '#c8101e'; for (let k = 0; k < 4; k++) g.fillRect(x + 3, y0 + 7 + k * 5, 4, 2.5); }
        g.fillStyle = '#6a4a2a'; g.fillRect(112, y0 + 46, RW, 4); for (let x = rand(118, 130); x < RW; x += rand(18, 30)) folk(x, y0 + 36);
      } else if (r === WIN.claw) {   // a claw-machine shop: rows of glowing cabinets stuffed with plush toys
        bg(y0, '#1a1030', '#0a0818');
        for (let x = 2; x < RW; x += 32) {
          const fc = pick(['#ff3d9a', '#3dd6ff', '#ffe23d', '#39ff88', '#b26bff', '#ff8a3a']);
          g.fillStyle = fc; g.fillRect(x, y0 + 3, 30, 58); g.fillStyle = '#fff4fa'; g.fillRect(x + 3, y0 + 9, 24, 31);
          for (let k = 0; k < 9; k++) dot(x + 6 + (k % 3) * 9 + rand(-1, 1), y0 + 34 - Math.floor(k / 3) * 6, rand(3, 4.2), pick(['#ffd0e0', '#ffe8a0', '#a0d8ff', '#f4f4f0', '#c8a070', '#ff8ab8', '#8ae8a0']));
          g.strokeStyle = '#8a8a92'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 15, y0 + 9); g.lineTo(x + 15, y0 + 18); g.moveTo(x + 12, y0 + 21); g.lineTo(x + 15, y0 + 18); g.lineTo(x + 18, y0 + 21); g.stroke();
          g.fillStyle = '#141418'; g.fillRect(x + 3, y0 + 42, 24, 16); g.fillStyle = fc; g.fillRect(x + 12, y0 + 46, 6, 3);
        }
      } else if (r === WIN.pharmacy) {   // shelves packed with boxes and bottles, the green cross
        bg(y0, '#ffffff', '#e8fff0'); shelf(y0, [20, 40, 60], 'rgba(150,170,160,0.9)');
        for (const yb of [5, 25, 45]) goods(y0 + yb, 1, RW, BRIGHT);
        for (const x of [40, 170]) { g.fillStyle = '#1a9a4a'; g.fillRect(x - 2, y0 + 2, 18, 18); g.fillStyle = '#ffffff'; g.fillRect(x + 5, y0 + 5, 4, 12); g.fillRect(x + 1, y0 + 9, 12, 4); }
      } else if (r === WIN.gold) {   // a jeweller's: red under hot lights, chains and bangles behind the glass counters
        bg(y0, '#ff6a48', '#a01018');
        for (let x = 6; x < RW; x += 14) { g.strokeStyle = pick(['#ffe27a', '#ffd040', '#fff0b0']); g.lineWidth = 1.5; g.beginPath(); g.arc(x, y0 + 8, 6, 0.2, Math.PI - 0.2); g.stroke(); g.beginPath(); g.arc(x + 7, y0 + 23, 5, 0, 7); g.stroke(); }
        g.fillStyle = 'rgba(220,240,255,0.55)'; g.fillRect(0, y0 + 36, RW, 2); g.fillRect(0, y0 + 52, RW, 2);
        for (let x = 3; x < RW; x += 7) { g.fillStyle = pick(['#ffe27a', '#ffd040', '#ffffff']); g.fillRect(x, y0 + 41 + rand(0, 6), 4, 3); }
      } else if (r === WIN.phone) {   // a phone shop: handsets on their stands, the posters, the bright white walls
        bg(y0, '#f4f8ff', '#d8e8ff');
        for (let x = 6; x < RW; x += 48) { const gr = g.createLinearGradient(x, y0, x + 40, y0 + 26); gr.addColorStop(0, pick(['#3d6bff', '#ff3df0', '#39c8ff'])); gr.addColorStop(1, pick(['#1a2a8a', '#8a1a8a', '#0a4a6a'])); g.fillStyle = gr; g.fillRect(x, y0 + 4, 40, 24); }
        g.fillStyle = '#e8ecf0'; g.fillRect(0, y0 + 44, RW, 20);
        for (let x = 6; x < RW; x += 13) { g.fillStyle = '#141418'; roundRect(g, x, y0 + 30, 8, 14, 2); g.fill(); g.fillStyle = pick(['#8ad8ff', '#ffffff', '#ffb0d8', '#a0ffd0']); g.fillRect(x + 1.2, y0 + 31.5, 5.6, 11); }
      } else if (r === WIN.lottery) {   // a lottery shop: red and gold posters of last week's winners, the counter, the terminal
        bg(y0, '#e8202a', '#a01018');
        for (let x = 4; x < RW; x += 40) { g.fillStyle = pick(['#ffd23d', '#fff0a0', '#ffe8c0']); g.fillRect(x, y0 + 4, 34, 26); g.fillStyle = '#c8101e'; g.fillRect(x + 4, y0 + 8, 26, 5); for (let k = 0; k < 6; k++) dot(x + 6 + k * 4.5, y0 + 21, 1.8, pick(['#c8101e', '#1a5ad8', '#1a1a1a'])); }
        g.fillStyle = '#f4e8c8'; g.fillRect(0, y0 + 44, RW, 20); folk(60, y0 + 30); folk(190, y0 + 30); g.fillStyle = '#3a3e44'; g.fillRect(110, y0 + 34, 20, 10);
      } else if (r === WIN.herbal) {   // a Chinese medicine shop: the wall of a hundred drawers, jars and scales on the counter
        bg(y0, '#f0d8a8', '#c89858');
        for (let y = 2; y < 46; y += 11) for (let x = 2; x < RW; x += 16) { g.fillStyle = '#7a4a24'; g.fillRect(x, y0 + y, 14, 9); g.fillStyle = '#e8d8b0'; g.fillRect(x + 3, y0 + y + 1, 8, 3); g.fillStyle = '#d8b050'; g.fillRect(x + 6, y0 + y + 6, 2, 2); }
        g.fillStyle = '#4a2a14'; g.fillRect(0, y0 + 50, RW, 14);
        for (let x = 10; x < RW; x += 22) { g.fillStyle = 'rgba(230,240,240,0.6)'; g.fillRect(x, y0 + 40, 9, 10); }
      } else if (r === WIN.dried) {   // dried goods: jars of mushrooms and scallops, baskets, sausages hanging, sacks
        bg(y0, '#ffe8c0', '#d8964a'); shelf(y0, [22]);
        for (let x = 6; x < RW; x += 13) { g.fillStyle = 'rgba(240,250,255,0.45)'; g.fillRect(x, y0 + 6, 10, 15); g.fillStyle = pick(['#c87a2a', '#8a4a1a', '#e8b060', '#5a3018']); g.fillRect(x + 1, y0 + 12, 8, 8); }
        for (let x = 14; x < RW; x += 28) { g.fillStyle = '#a87a40'; g.beginPath(); g.ellipse(x, y0 + 44, 13, 6, 0, 0, 7); g.fill(); for (let k = 0; k < 9; k++) dot(x + rand(-9, 9), y0 + 41 + rand(-2, 2), rand(2, 3), pick(['#f0a040', '#e08a2a', '#5a3018', '#c8a070'])); }
        for (let x = 4; x < RW; x += 9) { g.fillStyle = pick(['#8a1a14', '#a8301a']); g.fillRect(x, y0 + 2, 2.5, rand(8, 14)); }
        g.fillStyle = '#c8b088'; for (let x = 4; x < RW; x += 30) { g.beginPath(); g.ellipse(x + 12, y0 + 60, 13, 8, 0, Math.PI, 0); g.fill(); }
      } else if (r === WIN.teashop) {   // a tea merchant's: tins on the wooden shelves, the big jars, a tea table set out
        bg(y0, '#f4dcb0', '#b8844a'); shelf(y0, [18, 36], 'rgba(90,56,28,0.95)');
        for (const yb of [4, 22]) for (let x = 4; x < RW; x += 10) { g.fillStyle = pick(['#c8202c', '#2a6a3a', '#d8a830', '#1a3a6a', '#8a1a1a']); g.fillRect(x, y0 + yb + 2, 7, 12); g.fillStyle = '#e8c860'; g.fillRect(x, y0 + yb + 6, 7, 2); }
        g.fillStyle = '#5a3418'; g.fillRect(0, y0 + 48, RW, 16);
        for (let x = 20; x < RW; x += 60) { dot(x, y0 + 44, 5, '#8a5a3a'); for (let k = 0; k < 3; k++) dot(x + 10 + k * 5, y0 + 46, 1.8, '#f4ecd8'); }
      } else if (r === WIN.fabric) {   // a fabric shop: bolts of cloth stacked to the ceiling in every colour and print
        bg(y0, '#fff0d8', '#d8b888');
        for (let x = 1; x < RW; x += 7) { const col = pick(['#c8202c', '#1f5aa8', '#f0d040', '#2a8a5a', '#f0a0c0', '#1a1a1e', '#f4f4f0', '#8a4ad8', '#ff8a3a', '#a0d0f0', '#6a3a1a']); g.fillStyle = col; g.fillRect(x, y0 + 4, 6, 44); if (chance(0.4)) { g.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = 6; y < 46; y += 5) g.fillRect(x, y0 + y, 6, 1.5); } }
        g.fillStyle = '#6a4a2a'; g.fillRect(0, y0 + 50, RW, 14);
      } else if (r === WIN.scooter) {   // a scooter workshop under its tubes: tyres on the wall, a scooter up on the stand
        bg(y0, '#f4f8f8', '#c8d0d0');
        for (let x = 8; x < RW; x += 22) { g.strokeStyle = '#1a1a1a'; g.lineWidth = 4; g.beginPath(); g.arc(x, y0 + 14, 7, 0, 7); g.stroke(); }
        for (let x = 30; x < RW; x += 80) {
          const c = pick(['#c8202c', '#f4f4f0', '#1f4aa8', '#1a1a1a']);
          dot(x, y0 + 54, 6, '#1a1a1a'); dot(x + 34, y0 + 54, 6, '#1a1a1a');
          g.fillStyle = c; g.beginPath(); g.moveTo(x - 2, y0 + 50); g.lineTo(x + 6, y0 + 32); g.lineTo(x + 12, y0 + 32); g.lineTo(x + 14, y0 + 46); g.lineTo(x + 38, y0 + 44); g.lineTo(x + 36, y0 + 52); g.closePath(); g.fill();
          g.fillStyle = '#141414'; g.fillRect(x + 16, y0 + 40, 18, 4);
        }
        folk(120, y0 + 34, 'rgba(40,50,70,0.9)');
      } else if (r === WIN.shutter) {   // a shop shut for the night: the roller shutter, stickers, the name painted on it
        bg(y0, '#9aa0a6', '#6a7076');
        for (let y = 0; y < RH; y += 3) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, y0 + y, RW, 1); }
        for (let i = 0; i < 6; i++) { g.fillStyle = pick(['#f4f4f0', '#ffe23d', '#ff8ac0', '#8ae8ff']); g.fillRect(rand(0, RW - 14), y0 + rand(6, 40), rand(6, 14), rand(4, 9)); }
        g.fillStyle = 'rgba(200,30,40,0.7)'; g.fillRect(70, y0 + 12, 116, 14); g.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 5; k++) g.fillRect(80 + k * 20, y0 + 16, 12, 6);
        g.fillStyle = '#c8a040'; g.fillRect(RW / 2 - 3, y0 + 54, 6, 6);
      } else if (r === WIN.hotpot) {   // a hot-pot restaurant: red lanterns, round tables, the pots bubbling, a full house
        bg(y0, '#ffb070', '#a83a1a');
        for (let x = 20; x < RW; x += 50) { dot(x, y0 + 8, 6, '#ff2a14'); dot(x, y0 + 8, 2.5, '#ffe0a0'); }
        for (let x = 24; x < RW; x += 56) { g.fillStyle = '#5a2a14'; g.beginPath(); g.ellipse(x, y0 + 46, 20, 6, 0, 0, 7); g.fill(); dot(x, y0 + 42, 7, '#c8202c'); for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(x + rand(-5, 5), y0 + rand(18, 34), rand(3, 6), 0, 7); g.fill(); } folk(x - 18, y0 + 30); folk(x + 18, y0 + 30); }
      } else if (r === WIN.cafe) {   // a little café: wood and plants, pendant lamps, people at the window counter
        bg(y0, '#f4dcb8', '#8a5a34');
        for (let x = 30; x < RW; x += 60) { g.fillStyle = '#2a2420'; g.fillRect(x - 0.5, y0, 1, 12); dot(x, y0 + 14, 5, '#ffe0a0'); }
        for (let x = 10; x < RW; x += 34) { g.fillStyle = '#3a6a3a'; g.beginPath(); g.ellipse(x, y0 + 30, 7, 9, 0, 0, 7); g.fill(); g.fillStyle = '#c8a070'; g.fillRect(x - 4, y0 + 38, 8, 6); }
        g.fillStyle = '#5a3a20'; g.fillRect(0, y0 + 46, RW, 5); for (let x = rand(16, 30); x < RW; x += rand(30, 44)) folk(x, y0 + 34);
      } else if (r === WIN.bakery) {   // a bakery: trays of buns, pineapple cakes in boxes, the cake fridge
        bg(y0, '#fff8e8', '#f8d8a0'); shelf(y0, [24, 46], 'rgba(170,150,120,0.9)');
        for (let x = 6; x < RW; x += 11) { g.fillStyle = pick(['#d89040', '#e8a850', '#c87a2a']); g.beginPath(); g.ellipse(x, y0 + 18, 5, 4, 0, Math.PI, 0); g.fill(); }
        for (let x = 4; x < RW; x += 14) { g.fillStyle = pick(['#ffd23d', '#c8202c', '#f4e8c8']); g.fillRect(x, y0 + 36, 11, 9); }
        g.fillStyle = 'rgba(220,240,255,0.7)'; g.fillRect(0, y0 + 50, RW, 14); for (let x = 8; x < RW; x += 16) dot(x, y0 + 56, 4, pick(['#ffffff', '#ff8ab8', '#8a4a2a', '#ffd23d']));
      } else if (r === WIN.eyewear) {   // an optician's: frames in rows on the white walls, the bright counter
        bg(y0, '#ffffff', '#e8eef4'); shelf(y0, [16, 32, 48], 'rgba(180,190,200,0.9)');
        for (const yb of [10, 26, 42]) for (let x = 6; x < RW; x += 16) { g.strokeStyle = pick(['#141414', '#8a5a2a', '#c8202c', '#1a5ad8', '#d8a830']); g.lineWidth = 1.4; g.beginPath(); g.arc(x, y0 + yb, 3, 0, 7); g.moveTo(x + 9, y0 + yb); g.arc(x + 6, y0 + yb, 3, 0, 7); g.stroke(); }
      } else if (r === WIN.dessert) {   // a dessert shop: bowls of douhua and mango shaved ice, pastel walls, tables
        bg(y0, '#fff4fa', '#ffd8c8');
        for (let x = 8; x < RW; x += 24) { g.fillStyle = '#f4f4f0'; g.beginPath(); g.ellipse(x, y0 + 22, 9, 4, 0, 0, Math.PI); g.fill(); g.fillStyle = pick(['#ffb020', '#f8f0e0', '#8a4a2a', '#ff6a8a', '#a0e0c0']); g.beginPath(); g.ellipse(x, y0 + 19, 8, 6, 0, Math.PI, 0); g.fill(); }
        for (let x = 0; x < RW; x += 40) { g.fillStyle = '#f4f4f0'; g.fillRect(x + 6, y0 + 40, 24, 3); g.fillStyle = '#c8c0c8'; g.fillRect(x + 16, y0 + 43, 3, 16); }
        for (let x = rand(10, 30); x < RW; x += rand(26, 40)) folk(x, y0 + 34, 'rgba(40,30,40,0.8)');
      } else if (r === WIN.breakfast) {   // a soy-milk breakfast shop open all night: the griddle, steamers, the yellow menu
        bg(y0, '#fffcf0', '#f4e4b0');
        g.fillStyle = '#ffe23d'; g.fillRect(4, y0 + 3, RW - 8, 16); g.fillStyle = '#c8101e'; for (let x = 10; x < RW; x += 22) g.fillRect(x, y0 + 7, 14, 3); for (let x = 10; x < RW; x += 22) g.fillRect(x, y0 + 12, 9, 3);
        g.fillStyle = '#9aa0a8'; g.fillRect(10, y0 + 40, 90, 8); for (let x = 16; x < 96; x += 16) { g.fillStyle = '#f0d890'; g.beginPath(); g.ellipse(x, y0 + 39, 6, 2.5, 0, 0, 7); g.fill(); }
        for (let x = 120; x < 200; x += 18) for (let k = 0; k < 3; k++) { g.fillStyle = '#c8a070'; g.fillRect(x, y0 + 26 + k * 8, 16, 7); }
        for (let x = 210; x < RW; x += 18) { g.fillStyle = '#c8ccd0'; g.fillRect(x, y0 + 26, 14, 24); }
        folk(110, y0 + 28);
      } else {   // a fried-chicken counter: the fryers, golden cutlets heaped under the lamps, the paper bags
        bg(y0, '#fff4d0', '#f0b860');
        for (let x = 6; x < RW; x += 60) { g.fillStyle = '#c8ccd0'; g.fillRect(x, y0 + 38, 50, 20); g.fillStyle = '#d89030'; g.fillRect(x + 4, y0 + 40, 42, 4); for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.arc(x + rand(6, 44), y0 + rand(16, 34), rand(3, 6), 0, 7); g.fill(); } }
        for (let x = 4; x < RW; x += 9) { g.fillStyle = pick(['#d8902a', '#c87a1a', '#e8a840']); g.beginPath(); g.ellipse(x, y0 + 30, 5, 3, rand(-0.5, 0.5), 0, 7); g.fill(); }
        g.fillStyle = '#ffd23d'; g.fillRect(4, y0 + 3, RW - 8, 12); g.fillStyle = '#c8101e'; for (let x = 12; x < RW; x += 30) g.fillRect(x, y0 + 6, 18, 5);
      }
      g.fillStyle = 'rgba(28,26,24,0.9)';
      for (let x = 0; x <= RW; x += 64) g.fillRect(x - 2, y0, 4, RH);
      g.fillRect(0, y0, RW, 3); g.fillRect(0, y0 + RH - 4, RW, 4);
    }
  });
}
function streetAtlas() {   // the blue road plates, white letters, the romanised name below
  return atlas(STREETS, 256, 96, 2, (g, [cn, en], w, h) => {
    g.fillStyle = '#1f4e9a'; roundRect(g, 3, 3, w - 6, h - 6, 8); g.fill();
    g.strokeStyle = '#f4f4f0'; g.lineWidth = 3; roundRect(g, 8, 8, w - 16, h - 16, 6); g.stroke();
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `900 34px ${HEI}`; g.fillText(cn, w / 2, 38, w - 30);
    g.font = `700 16px ${HEI}`; g.fillText(en, w / 2, 70, w - 26);
  });
}
function stallAtlas() {   // the night-market carts' lightboxes, the dish in big round letters; the price cards after them
  return atlas([...STALLS, ...PRICES], 256, 96, 4, (g, e, w, h, i) => {
    if (typeof e === 'string') {   // a hand-written price card: red marker on yellow card, or white on red
      const j = i - STALLS.length;
      g.fillStyle = j % 3 ? '#ffe23d' : '#d8202a'; roundRect(g, 6, 6, w - 12, h - 12, 10); g.fill();
      g.fillStyle = j % 3 ? '#c8101e' : '#ffffff'; g.font = `900 ${Math.floor(h * 0.6)}px ${ROUND}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(e, w / 2, h / 2 + 2, w - 24);
      return;
    }
    const [name, bgc, fg] = e;
    lightbox(g, w, h, bgc); g.fillStyle = fg; g.fillRect(4, 4, w - 8, 6); g.fillRect(4, h - 10, w - 8, 6);
    g.font = `900 ${Math.floor(h * 0.56)}px ${ROUND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg;
    g.fillText(name, w / 2, h / 2 + 3, w - 24);
  });
}
function flameTex() {   // a gas flame's tongues: white-hot at the root, orange, red at the tips
  return canvasTex(64, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let k = 0; k < 7; k++) {
      const cx = w / 2 + rand(-12, 12), top = rand(8, 40), bw = rand(10, 18);
      const gr = g.createLinearGradient(0, h, 0, top);
      gr.addColorStop(0, 'rgba(255,250,220,0.9)'); gr.addColorStop(0.25, 'rgba(255,190,60,0.75)'); gr.addColorStop(0.7, 'rgba(255,90,20,0.45)'); gr.addColorStop(1, 'rgba(200,30,0,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(cx - bw, h);
      g.quadraticCurveTo(cx - bw * 0.9, (h + top) / 2, cx + rand(-6, 6), top); g.quadraticCurveTo(cx + bw * 0.9, (h + top) / 2, cx + bw, h); g.fill();
    }
  }, { repeat: false });
}
function adIcon(g, kind, x, y, s, col) {   // the little pictures on the screens
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 6;
  if (kind === 'boba') { g.beginPath(); g.moveTo(-24, -26); g.lineTo(24, -26); g.lineTo(18, 40); g.lineTo(-18, 40); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.5)'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(-12 + (k % 3) * 12, 30 - Math.floor(k / 3) * 9, 4.5, 0, 7); g.fill(); } g.fillStyle = col; g.fillRect(4, -56, 6, 34); }
  else if (kind === 'cake') { for (let k = 0; k < 3; k++) { g.fillRect(-46 + k * 32, -10, 28, 24); g.fillStyle = 'rgba(120,60,10,0.35)'; g.fillRect(-46 + k * 32, -10, 28, 6); g.fillStyle = col; } }
  else if (kind === 'lantern') { g.beginPath(); g.ellipse(0, 0, 30, 38, 0, 0, 7); g.fill(); g.fillRect(-12, -46, 24, 8); g.fillRect(-12, 38, 24, 8); g.fillRect(-2, 46, 4, 18); }
  else if (kind === 'tower') { for (let k = 0; k < 8; k++) { const y0 = 40 - k * 10; g.beginPath(); g.moveTo(-9, y0); g.lineTo(9, y0); g.lineTo(12, y0 - 9); g.lineTo(-12, y0 - 9); g.closePath(); g.fill(); } g.fillRect(-3, -54, 6, 14); }
  else if (kind === 'steamer') { for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(0, 18 - k * 16, 40, 12, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-40, 18 - k * 16, 80, 3); g.fillStyle = col; } }
  else if (kind === 'bolt') { g.beginPath(); g.moveTo(8, -44); g.lineTo(-22, 6); g.lineTo(0, 6); g.lineTo(-10, 44); g.lineTo(24, -10); g.lineTo(2, -10); g.closePath(); g.fill(); }
  else if (kind === 'bar') { for (let k = 0; k < 4; k++) g.fillRect(-40 + k * 22, 30 - k * 18, 16, k * 18 + 10); }
  else if (kind === 'stars') for (let k = 0; k < 5; k++) { const a = rand(0, 6.28), r = rand(10, 40); g.save(); g.translate(Math.cos(a) * r, Math.sin(a) * r); g.beginPath(); for (let i = 0; i < 10; i++) { const b2 = (i / 10) * Math.PI * 2, rr = i % 2 ? 4 : 10; g.lineTo(Math.cos(b2) * rr, Math.sin(b2) * rr); } g.fill(); g.restore(); }
  g.restore();
}
function adAtlas() {   // the LED screens' adverts, side by side (see screenMat)
  const CW = 384, CH = 240;
  return canvasTex(CW * ADS.length, CH, (g) => {
    ADS.forEach(([cn, en, [c1, c2], icon, fg = '#ffffff'], i) => {
      const x0 = i * CW, gr = g.createLinearGradient(x0, 0, x0 + CW, CH); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
      g.fillStyle = gr; g.fillRect(x0, 0, CW, CH);
      adIcon(g, icon, x0 + 296, 120, 1.2, fg === '#ffffff' ? 'rgba(255,255,255,0.9)' : fg);
      g.fillStyle = fg; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.font = `900 70px ${icon === 'boba' || icon === 'cake' ? ROUND : HEI}`; g.fillText(cn, x0 + 24, 100, 230);
      g.font = `700 26px ${HEI}`; g.fillText(en, x0 + 26, 168, 230);
    });
  }, { repeat: false });
}
function walkTex() {   // the pedestrian signal's little green man in LED dots, six frames of his walk side by side
  const F = 6, cw = 48, ch = 64;
  return canvasTex(cw * F, ch, (g) => {
    g.fillStyle = '#05070a'; g.fillRect(0, 0, cw * F, ch);
    for (let f = 0; f < F; f++) {
      const ph = (f / F) * Math.PI * 2, x0 = f * cw + cw / 2, sw = Math.sin(ph);
      const pts = [];
      const line = (ax, ay, bx, by) => { for (let t = 0; t <= 1.001; t += 0.12) pts.push([ax + (bx - ax) * t, ay + (by - ay) * t]); };
      line(x0, 18, x0 + 1, 36);   // the body
      line(x0 + 1, 36, x0 + sw * 9, 46); line(x0 + sw * 9, 46, x0 + sw * 7 - 3, 56);   // one leg
      line(x0 + 1, 36, x0 - sw * 9, 46); line(x0 - sw * 9, 46, x0 - sw * 9 + 2, 56);   // the other
      line(x0, 22, x0 - sw * 8, 30); line(x0, 22, x0 + sw * 8, 31);   // the arms
      g.fillStyle = '#39ff6a'; g.shadowColor = '#39ff6a'; g.shadowBlur = 4;
      for (const [x, y] of pts) { g.beginPath(); g.arc(x, y, 1.9, 0, 7); g.fill(); }
      g.beginPath(); g.arc(x0, 12, 4.5, 0, 7); g.fill();
      g.shadowBlur = 0;
    }
  }, { repeat: false });
}
function countTex() {   // the countdown beside him: 29 down to 0, one frame a second
  const F = 30, cw = 64, ch = 48;
  return canvasTex(cw * F, ch, (g) => {
    g.fillStyle = '#05070a'; g.fillRect(0, 0, cw * F, ch);
    g.font = `900 38px "Chakra Petch", ${HEI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let f = 0; f < F; f++) { const n = 29 - f; g.fillStyle = n < 6 ? '#ff4a2a' : '#39ff6a'; g.shadowColor = g.fillStyle; g.shadowBlur = 5; g.fillText(String(n).padStart(2, '0'), f * cw + cw / 2, ch / 2 + 2); }
  }, { repeat: false });
}
function marqueeTex() {   // a red LED marquee: the shop's greetings in dots, scrolling for ever
  const W = 1024, H = 32;
  const t = canvasTex(W, H, (g) => {
    g.fillStyle = '#080406'; g.fillRect(0, 0, W, H);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const q = c.getContext('2d');
    q.fillStyle = '#fff'; q.font = `900 24px ${HEI}`; q.textBaseline = 'middle'; q.fillText(MARQUEE + MARQUEE, 4, H / 2 + 1);
    const d = q.getImageData(0, 0, W, H).data;
    for (let y = 1; y < H; y += 3) for (let x = 1; x < W; x += 3) {
      const on = d[(y * W + x) * 4 + 3] > 90;
      g.fillStyle = on ? '#ff3a2a' : 'rgba(80,16,12,0.55)'; g.fillRect(x - 1, y - 1, 2.2, 2.2);
    }
  });
  t.repeat.set(0.3, 1);
  return t;
}

// ---------- the kit ----------
const SHOPS = {
  conv: { boards: [0], light: '#eef6ff', k: 0.24 },
  tea: { boards: [1, 2], light: '#fff4dc', goods: 'standee' },
  noodles: { boards: [3, 4, 25, 26], light: '#ffe0a8' },
  claw: { boards: [10], light: '#ff9ad0', k: 0.22 },
  pharmacy: { boards: [8], light: '#e8fff0' },
  gold: { boards: [7], light: '#ff6a4a' },
  phone: { boards: [13], light: '#d8ecff' },
  lottery: { boards: [11], light: '#ffd890', goods: 'banner' },
  herbal: { boards: [18], light: '#ffe8c0' },
  dried: { boards: [21], light: '#ffd8a0', goods: 'sacks' },
  teashop: { boards: [19], light: '#ffe8b0', goods: 'jars' },
  fabric: { boards: [20], light: '#fff0d8', goods: 'rolls' },
  scooter: { boards: [12], light: '#f0f8ff', goods: 'scooter' },
  shutter: { boards: [3, 4, 5, 6, 9, 11, 14, 24, 25, 26, 27], light: null, dim: true },
  hotpot: { boards: [15], light: '#ffb080' },
  cafe: { boards: [22], light: '#ffd8a0', goods: 'plants' },
  bakery: { boards: [23], light: '#fff0c8' },
  eyewear: { boards: [9], light: '#f4f8ff' },
  dessert: { boards: [6, 17, 27], light: '#fff0f4' },
  breakfast: { boards: [14, 24], light: '#fff8e0' },
  fried: { boards: [5, 16], light: '#ffe0a0', goods: 'standee' },
};
export const ARCADE_SHOPS = { conv: 8, tea: 12, noodles: 9, claw: 6, pharmacy: 6, gold: 3, phone: 6, lottery: 5, scooter: 5, shutter: 14, hotpot: 4, cafe: 4, bakery: 4, eyewear: 5, dessert: 4, breakfast: 4, fried: 5 };
export const MARKET_SHOPS = { tea: 14, noodles: 12, dessert: 10, claw: 8, phone: 6, shutter: 3, fried: 10, hotpot: 6, bakery: 4, eyewear: 4, lottery: 4 };
export const DIHUA_SHOPS = { herbal: 14, dried: 18, teashop: 12, fabric: 10, shutter: 10, cafe: 6, bakery: 4, noodles: 3 };
export const ALLEY_SHOPS = { shutter: 30, conv: 4, noodles: 5, breakfast: 6, scooter: 6, tea: 5, lottery: 3, pharmacy: 3, fried: 3 };

export function makeKit() {
  const K = taipeiTreeKit();
  const face = (s) => -s * Math.PI / 2;   // rotation turning a plane to face the track from side s
  K.face = face;
  K.poolMat = basic({ map: canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { repeat: false }),
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  K.pool = (b, x, z, w, d, col, y = 0.05) => b.add(G.plane, K.poolMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0, col);   // light spilt on the ground
  // a light's reflection in the wet road, a streak drawn out toward the runner (stopped at the track's edge)
  K.streakMat = basic({ map: canvasTex(32, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.7)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, w, h); }, { repeat: false }),
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  K.wet = (b, x, z, len, w, col, { y = 0.035, x0 = EDGE + 0.15 } = {}) => {
    const dx = -x, dz = 40, d = Math.hypot(dx, dz), L = Math.min(len, Math.abs(x) > x0 ? ((Math.abs(x) - x0) * d) / Math.abs(dx) : 0);
    if (L > 1) b.add(G.plane, K.streakMat, x + (dx / d) * L / 2, y, z + (dz / d) * L / 2, w, L, 1, -Math.PI / 2, Math.atan2(-dx, -dz), 0, col);
  };
  K.puddleMat = std({ color: '#06080c', roughness: 0.05, metalness: 0.9, envMapIntensity: 1.2, transparent: true, opacity: 0.85, depthWrite: false });
  K.puddle = (b, x, z, w, d) => b.add(G.sph, K.puddleMat, x, 0.03, z, w, 0.01, d, 0, rand(0, Math.PI), 0);
  const tiles = new Map();
  K.tiled2 = (nu, nv) => {   // a plane whose UVs repeat a texture nu times across and nv times up
    const key = `t2|${nu}|${nv}`;
    if (!tiles.has(key)) tiles.set(key, planeUV({ u0: 0, u1: nu, v0: 0, v1: nv }));
    return tiles.get(key);
  };
  K.tiled = (n, v = 0, rows = 1) => {   // a plane whose UVs repeat row v of an atlas of rows n times across
    const key = `${n}|${v}|${rows}`;
    if (!tiles.has(key)) tiles.set(key, planeUV({ u0: 0, u1: n, v0: 1 - (v + 1) / rows, v1: 1 - v / rows }));
    return tiles.get(key);
  };
  const labels = new Map();
  K.label = (text, { w = 512, h = 128, color = '#ffffff', font = HEI, weight = 900, size = 0.62, bg = null, border = null, glow = null, k = 1.2, vertical = false, alpha = false } = {}) => {
    const key = [text, w, h, color, font, weight, size, bg, border, glow, k, vertical].join('|');
    if (labels.has(key)) return labels.get(key);
    const tex = canvasTex(w, h, (g) => {
      if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } else g.clearRect(0, 0, w, h);
      if (border) { g.strokeStyle = border; g.lineWidth = Math.min(w, h) * 0.05; g.strokeRect(Math.min(w, h) * 0.06, Math.min(w, h) * 0.06, w - Math.min(w, h) * 0.12, h - Math.min(w, h) * 0.12); }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color;
      if (glow) { g.shadowColor = glow; g.shadowBlur = Math.min(w, h) * 0.1; }
      if (vertical) {
        const chars = [...text], sz = Math.min(w * size, (h * 0.86) / chars.length);
        g.font = `${weight} ${Math.floor(sz)}px ${font}`;
        chars.forEach((c, i) => g.fillText(c, w / 2, h / 2 + (i - (chars.length - 1) / 2) * sz * 1.02));
      } else {
        let px = Math.floor(h * size); g.font = `${weight} ${px}px ${font}`;
        const m = g.measureText(text).width, max = w * 0.9;
        if (m > max) { px = Math.floor((px * max) / m); g.font = `${weight} ${px}px ${font}`; }
        g.fillText(text, w / 2, h / 2 + h * 0.03);
      }
    }, { repeat: false });
    const m = basic({ map: tex, color: hdr('#ffffff', k), transparent: !bg || alpha, side: THREE.DoubleSide });
    labels.set(key, m);
    return m;
  };

  // facades
  K.apts = [0, 1, 2].map((win) => { const tex = aptTex({ win, litChance: win === 2 ? 0.42 : 0.5, mosaic: win === 2 }); return { tex, mat: facadeMat(tex, { k: 0.95 }) }; });
  K.baroque = [false, true].map((brick) => { const tex = baroqueTex({ brick }); return { tex, mat: facadeMat(tex, { k: 0.9 }), brick }; });
  K.office = windowTex({ cols: 6, rows: 12, cw: 32, ch: 40, wall: '#26323f', glass: '#0d1824', lit: OFFICE, litChance: 0.6, band: true });
  K.officeMat = facadeMat(K.office, { k: 0.85, rough: 0.35, metal: 0.5 });
  K.office2 = windowTex({ cols: 8, rows: 12, cw: 24, ch: 40, wall: '#3a4250', glass: '#101a26', lit: OFFICE, litChance: 0.55, frame: '#5a6474' });
  K.office2Mat = facadeMat(K.office2, { k: 0.8, rough: 0.4, metal: 0.4 });
  // shopfronts and their signs
  K.winMat = basic({ map: shopWinTex(), vertexColors: true, color: hdr('#ffffff', 0.9) });
  const hs = atlas(H_SIGNS, 384, 96, 4, (g, e, w, h) => drawH(g, e, w, h));
  K.hRects = hs.rects; K.hMat = basic({ map: hs.tex, vertexColors: true, color: hdr('#ffffff', 0.86) });
  const vs = atlas(V_SIGNS, 96, 384, 12, (g, e, w, h) => drawV(g, e, w, h));
  K.vRects = vs.rects; K.V_SIGNS = V_SIGNS;
  K.vMat = basic({ map: vs.tex, vertexColors: true, color: hdr('#ffffff', 0.92) });
  K.vFlick = basic({ map: vs.tex, vertexColors: true, color: hdr('#ffffff', 0.92) });   // the ones on the blink
  const st = streetAtlas();
  K.streetRects = st.rects; K.streetMat = basic({ map: st.tex, color: hdr('#ffffff', 0.85), side: THREE.DoubleSide });
  const sa = stallAtlas();
  K.stallMat = basic({ map: sa.tex, color: hdr('#ffffff', 0.9), side: THREE.DoubleSide });
  K.stallRects = sa.rects.slice(0, STALLS.length); K.priceRects = sa.rects.slice(STALLS.length); K.priceMat = K.stallMat;
  // the hawkers' fire: gas flames licking round the woks, flickering out of step; the charcoal glowing under the grills
  const ft = flameTex();
  K.flames = [basic({ map: ft, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })];
  K.ember = VC.glow;
  K.steams = [];   // the steam off the pots and griddles: one cloud of puffs per scene, all run from K.update
  K.steam = (pts, { color = '#e8ece8', opacity = 0.42, size = 0.42, rise = 2.4, life = 3.4, n = 5, drift = 0.5 } = {}) => {
    const m = puffs(pts, { size, grow: 2.6, rise, drift, life, n, color, opacity });
    K.steams.push(m); return m;
  };
  // road paint, worn by the scooters: the white zebras, the stop lines, the rainbow at Ximen
  K.paintMat = basic({ map: canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const v = randi(120, 215); g.fillStyle = `rgba(${v},${v},${v},${rand(0.3, 0.8)})`; g.fillRect(rand(0, w), rand(0, h), rand(1, 3), rand(1, 4)); }
  }), vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  K.screen = screenMat(adAtlas(), ADS.length, 1.5, 0.17);
  const walk = walkTex(); walk.repeat.set(1 / 6, 1);
  K.walkMat = basic({ map: walk, color: hdr('#ffffff', 1.6) });
  const count = countTex(); count.repeat.set(1 / 30, 1);
  K.countMat = basic({ map: count, color: hdr('#ffffff', 1.5) });
  K.marquee = basic({ map: marqueeTex(), color: hdr('#ffffff', 1.5) });
  K.chase = [0, 1, 2].map(() => basic({ vertexColors: true }));
  const fall = canvasTex(64, 128, (g, w, h) => {   // water falling: long streaks, brightest down the middle of the sheet
    g.clearRect(0, 0, w, h);
    for (let k = 0; k < 26; k++) { const x = w / 2 + (Math.random() - 0.5) * w * 0.8, len = rand(50, 120), y = rand(-30, h); const gr = g.createLinearGradient(0, y, 0, y + len); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${rand(0.3, 0.75).toFixed(2)})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, y, rand(1.5, 4), len); }
  });
  fall.repeat.set(1, 1);
  K.fallMat = basic({ map: fall, color: hdr('#cfe8ff', 0.45), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });   // the betel nut kiosks' chasing tubes, recoloured every frame
  // ironwork, tin and tiles
  K.grilleMat = std({ map: canvasTex(64, 64, (g, w, h) => {   // a window cage's grille: a frame round straight bars and a band of scrolls
    g.clearRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
    g.lineWidth = 1.8; g.beginPath(); for (let x = 8; x < w; x += 8) { g.moveTo(x, 0); g.lineTo(x, h); } g.moveTo(0, 22); g.lineTo(w, 22); g.stroke();
    g.lineWidth = 1.4; for (let x = 4; x < w; x += 16) { g.beginPath(); g.arc(x + 4, 14, 4, 0, 7); g.stroke(); }
  }), vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4 });
  K.tinMat = std({ map: canvasTex(64, 64, (g, w, h) => {   // corrugated sheet: the ribs catching the light, a little rust
    for (let x = 0; x < w; x += 4) { const gr = g.createLinearGradient(x, 0, x + 4, 0); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(0.5, '#f4f4f4'); gr.addColorStop(1, '#8a8a8a'); g.fillStyle = gr; g.fillRect(x, 0, 4, h); }
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(140,70,30,${rand(0.1, 0.3).toFixed(2)})`; g.fillRect(rand(0, w), rand(0, h), rand(2, 8), rand(4, 20)); }
  }), vertexColors: true, roughness: 0.55, metalness: 0.45 });
  K.floorMat = std({ map: canvasTex(64, 64, (g, w, h) => {   // the arcades' floor tiles, a different one in front of every house
    g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { const v = randi(-14, 14); g.fillStyle = `rgb(${236 + v},${236 + v},${236 + v})`; g.fillRect(x + 1, y + 1, 14, 14); }
  }), vertexColors: true, roughness: 0.35, metalness: 0.05 });
  // the road's edge, 7 m across (the track's side strip on either side): wet asphalt, the white boxes the scooters park in,
  // the red no-parking line along the kerb. Drawn mirrored on both halves, so each side shows its own.
  const asph = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#2a2c30'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2400; i++) { const v = randi(20, 70); g.fillStyle = `rgba(${v},${v},${v + 4},0.5)`; g.fillRect(rand(0, w), rand(0, h), 1.5, 1.5); }
    g.fillStyle = 'rgba(232,232,226,0.75)';
    for (const [a, b2] of [[8, 116], [140, 248]]) { g.fillRect(a === 8 ? a : b2 - 3, 0, 3, h); for (let y = 0; y < h; y += 32) g.fillRect(a, y, b2 - a, 3); }
    g.fillStyle = '#c8202a'; g.fillRect(122, 0, 5, h); g.fillRect(129, 0, 5, h);
  });
  asph.repeat.set(1, 20);
  K.asphalt = std({ map: asph, roughness: 0.32, metalness: 0.18 });
  K.paveMat = std({ map: canvasTex(128, 128, (g, w, h) => {   // granite pavers
    g.fillStyle = '#4a4a50'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 32) { const v = randi(-8, 8); g.fillStyle = `rgb(${96 + v},${94 + v},${98 + v})`; g.fillRect(x + 1, y + 1, 30, 14); }
  }), roughness: 0.4, metalness: 0.1 });
  K.water = waterMat('#060a10', 4);
  K.water.metalness = 0.7; K.water.roughness = 0.16; K.water.envMapIntensity = 0.4; K.water.normalScale.set(0.5, 0.5);
  K.water.emissive = new THREE.Color('#0a0e18'); K.water.emissiveIntensity = 0.5;
  // the temples' roofs: glazed tiles and the red ridge
  K.roofTile = std({ map: canvasTex(64, 64, (g, w, h) => {
    for (let x = 0; x < w; x += 8) { const gr = g.createLinearGradient(x, 0, x + 8, 0); gr.addColorStop(0, '#5a5a5a'); gr.addColorStop(0.5, '#f4f4f4'); gr.addColorStop(1, '#4a4a4a'); g.fillStyle = gr; g.fillRect(x, 0, 8, h); }
    g.fillStyle = 'rgba(0,0,0,0.3)'; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 2);
  }), vertexColors: true, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide });

  // ---------- buildings ----------
  // a row of shophouses and walk-ups, each one to three houses wide, the arcade under them all
  K.row = (b, s, z0, z1, { x0 = X0, floors = [3, 6], shops = ARCADE_SHOPS, vsigns = 1, cage = 0.28, ac = 0.38, laundry = 0.06, shack = 0.5, tall = 0.15, marquee = 0.25 } = {}) => {
    let z = z0;
    while (z1 - z >= BAY * 1.5) {
      const nb = Math.min(pick([2, 2, 2, 4, 4, 6, 3]), Math.floor((z1 - z) / BAY)), L = nb * BAY, d = rand(13, 17);
      const fl = chance(tall) ? randi(8, 12) : randi(...floors), T = pick(K.apts), H = GF + fl * FH, f = s * x0, cz = -(z + L / 2);
      b.addM(buildingGeo(d, fl * FH, L, T.tex, BAY, FH), T.mat, at(s * (x0 + d / 2), GF, cz), pick(TILES));
      b.block(VC.solid, '#24242a', s * (x0 + ARC + (d - ARC) / 2), 0, cz, d - ARC, GF, L);   // the ground floor behind its shops
      const i = { x: s * (x0 + d / 2), z: cz, d, len: L, h: H, side: s, face: f, z0: z, z1: z + L, n: nb, floors: fl };
      K.arcade(b, i, shops, { marquee });
      K.upper(b, i, { cage, ac, laundry });
      K.roof(b, i, { shack });
      for (let k = 0; k < Math.round(vsigns * rand(0.4, 1.8) + (fl > 6 ? vsigns : 0)); k++) K.vsignStack(b, i);
      z += L + (chance(0.15) ? rand(0.1, 0.4) : 0.02);
    }
  };
  // the arcade: columns at the building line, the slab and its tubes overhead, the house's own floor and step, the shops
  K.arcade = (b, i, shops, { marquee = 0.25, signs = true } = {}) => {
    const s = i.side, x0 = Math.abs(i.face), L = i.len, units = Math.max(1, Math.round(i.n / 2)), ul = L / units;
    const fy = rand(0.08, 0.32), fc = pick(FLOORS), col = shade(pick(TILES), rand(0.8, 1.0));
    b.block(VC.solid, shade(fc, 0.7), s * (x0 + ARC / 2), 0, i.z, ARC, fy - 0.01, L);   // the floor and its step up from the road
    b.add(K.tiled2(8, Math.max(1, Math.round(L / 0.4))), K.floorMat, s * (x0 + ARC / 2), fy, i.z, ARC, L, 1, -Math.PI / 2, 0, 0, fc);
    b.box(VC.solid, '#cfcbc2', s * (x0 + ARC / 2), GF - 0.1, i.z, ARC, 0.2, L);   // the ceiling
    b.box(VC.solid, col, s * (x0 + 0.16), GF - 0.45, i.z, 0.32, 0.9, L);   // the beam over the opening, where the boards go
    for (let k = 0; k <= units; k++) b.box(VC.solid, col, s * (x0 + 0.3), GF / 2, -(i.z0 + k * ul), 0.56, GF, 0.56);   // the columns
    for (let k = 0; k < units; k++) {
      const zc = -(i.z0 + (k + 0.5) * ul), kind = pickW(shops), sh = SHOPS[kind];
      b.box(VC.glow, hdr(pick(FLUO), 1.4), s * (x0 + ARC * 0.55), GF - 0.24, zc, 0.08, 0.05, Math.min(1.4, ul - 1));   // a tube on the ceiling
      K.shop(b, s * (x0 + ARC), zc, ul - 0.6, s, kind, fy);
      if (signs) {
        const bw = Math.min(ul - 0.5, 4.2), rect = K.hRects[pick(sh.boards)];
        b.add(planeUV(rect), K.hMat, s * x0 - s * 0.03, GF - 0.45, zc, bw, 0.78, 1, 0, face(s), 0, sh.dim ? hdr('#ffffff', 0.55) : hdr('#ffffff', rand(0.9, 1.05)));
        if (!sh.dim) K.wet(b, s * (x0 - 0.6), zc, 5, bw * 0.7, hdr(sh.light || '#ffffff', 0.12));
        if (!sh.dim && chance(marquee)) b.add(G.plane, K.marquee, s * x0 - s * 0.03, GF + 0.12, zc, bw * 0.8, 0.22, 1, 0, face(s), 0);
      }
    }
  };
  K.shop = (b, f, zc, L, s, kind, fy = 0.1) => {
    const k = SHOPS[kind];
    b.add(K.tiled(Math.max(1, Math.round(L / 2.4)), WIN[kind], NWIN), K.winMat, f - s * 0.02, fy + 1.45, zc, L, 2.8, 1, 0, face(s), 0, k.dim ? '#5a5a5a' : 0xffffff);
    b.box(VC.metal, '#3a3e44', f - s * 0.04, fy + 2.9, zc, 0.06, 0.12, L + 0.2);
    if (k.light) { K.pool(b, f - s * 1.4, zc, 2.6, L + 0.6, hdr(k.light, k.k || 0.17), fy + 0.02); K.wet(b, s * (Math.abs(f) - ARC - 0.4), zc, 4, L * 0.5, hdr(k.light, 0.08)); }
    if (k.goods === 'sacks') for (let z = zc - L / 2 + 0.5; z < zc + L / 2 - 0.3; z += rand(0.6, 0.9)) {   // sacks and baskets of dried goods out in the arcade
      const x = f - s * rand(0.5, 1.1);
      b.cyl(VC.solid, '#c8b088', x, fy + 0.3, z, 0.26, 0.6, 'cyl8');
      b.cyl(VC.solid, pick(['#d88a2a', '#8a4a1a', '#e8c070', '#5a3018', '#c8603a']), x, fy + 0.62, z, 0.24, 0.06, 'cyl8');
    }
    if (k.goods === 'rolls') for (let z = zc - L / 2 + 0.5; z < zc + L / 2 - 0.3; z += 0.5) b.cyl(VC.solid, pick(LAUNDRY), f - s * 0.5, fy + 0.8, z, 0.14, 1.6, 'cyl8');   // bolts of cloth stood on end
    if (k.goods === 'jars') for (let z = zc - L / 2 + 0.6; z < zc + L / 2 - 0.4; z += 0.9) { b.cyl(VC.solid, '#6a4a30', f - s * 0.6, fy + 0.35, z, 0.25, 0.7, 'cyl8'); b.cyl(VC.solid, '#c8202c', f - s * 0.6, fy + 0.74, z, 0.2, 0.08, 'cyl8'); }
    if (k.goods === 'standee') { const z = zc + rand(-L / 3, L / 3); b.box(VC.solid, '#2a2a2e', f - s * 1.2, fy + 0.5, z, 0.05, 1.0, 0.05); b.box(VC.glow, hdr('#fff4d8', 0.9), f - s * 1.2, fy + 1.15, z, 0.04, 0.7, 0.55); }
    if (k.goods === 'scooter') K.scooter(b, f - s * 1.4, zc + rand(-0.6, 0.6), -s * Math.PI / 2 + rand(-0.3, 0.3));
    if (k.goods === 'plants') for (let z = zc - L / 2 + 0.4; z < zc + L / 2; z += 0.8) K.pot(b, f - s * 0.4, z, fy);
    if (k.goods === 'banner') { b.box(VC.solid, '#c8101e', f - s * 0.08, fy + 2.4, zc, 0.03, 0.5, L * 0.8); b.box(VC.glow, hdr('#ffd23d', 0.9), f - s * 0.1, fy + 2.4, zc, 0.02, 0.2, L * 0.6); }
  };
  K.pot = (b, x, z, y = 0, big = chance(0.3)) => {   // a potted plant: the pot, the leafy top
    const r = big ? 0.3 : 0.2;
    b.cyl(VC.solid, pick(['#a8583a', '#6a6a70', '#e8e4dc', '#3a5a8a', '#8a6a4a']), x, y + r * 0.8, z, r, r * 1.6, 'cyl8');
    if (big) b.sph(VC.solid, pick(['#2f6a32', '#3a7a3a', '#4a8a40', '#2a5a2a']), x, y + r * 2.1, z, r * 1.8, true);
    else b.box(VC.solid, pick(['#2f6a32', '#3a7a3a', '#4a8a40', '#2a5a2a']), x, y + r * 2.1, z, r * 2.4, r * 2.2, r * 2.4, rand(0, 1));
  };
  // the upper floors: window cages full of plants and laundry, air-conditioners
  K.upper = (b, i, { cage, ac, laundry }) => {
    const s = i.side, f = i.face, cageCol = pick(['#e8e8e2', '#d8dcd8', '#8a6a4a', '#a8aeb4', '#5a5e60']);
    for (let r = 0; r < i.floors; r++) for (let c = 0; c < i.n; c++) {
      const y = (i.base ?? GF) + r * FH, z = -(i.z0 + (c + 0.5) * BAY), q = Math.random();
      if (q < cage) K.cage(b, f, y, z, s, cageCol, chance(laundry * 4));
      else if (q < cage + ac) K.ac(b, f, y, z + rand(-0.5, 0.5), s);
    }
  };
  K.ac = (b, f, y, z, s) => {   // a window unit poking out under the glass, or a split unit's box on its bracket
    if (chance(0.5)) { b.box(VC.solid, pick(['#d8dad6', '#cfd2ce', '#e2e2dc', '#c4c8c4']), f - s * 0.22, y + 0.55, z, 0.44, 0.42, 0.62); b.box(VC.solid, '#4e5254', f - s * 0.445, y + 0.55, z, 0.01, 0.3, 0.46); }
    else { b.box(VC.solid, pick(['#e8e8e4', '#d0d4d0']), f - s * 0.3, y + 0.35, z, 0.36, 0.6, 0.8); b.cyl(VC.solid, '#3a3e40', f - s * 0.49, y + 0.35, z, 0.22, 0.02, 'cyl8', 0, Math.PI / 2); }
  };
  K.cage = (b, f, y, z, s, col = '#e8e8e2', wash = false) => {   // 鐵窗: an iron cage over the window, pot plants on its floor, laundry inside
    const x = f - s * 0.3;
    b.add(G.box, K.grilleMat, x, y + 1.55, z, 0.6, 2.2, 2.0, 0, 0, 0, col);
    b.box(VC.metal, shade(col, 0.7), x, y + 0.42, z, 0.64, 0.05, 2.04);
    for (let k = randi(1, 3); k > 0; k--) { const r = rand(0.22, 0.4); b.box(VC.solid, pick(['#3a7a3a', '#2a6a32', '#5a8a3a', '#2f5a2a', '#c8202c']), x + rand(-0.1, 0.1), y + 0.48 + r / 2, z + rand(-0.7, 0.7), r, r, r, rand(0, 1)); }
    if (wash) for (let k = 0; k < 4; k++) b.box(VC.solid, pick(LAUNDRY), x + rand(-0.1, 0.1), y + 1.95, z - 0.7 + k * 0.45, 0.03, rand(0.4, 0.7), 0.36);
  };
  // a stack of lightboxes hung out over the street at one point along the facade, their faces up and down the street
  K.vsign = (b, f, y, z, s, { i, w = rand(0.9, 1.3), h = w * 4, flick = chance(0.08), tint = 1 } = {}) => {
    const rect = K.vRects[i ?? randi(0, V_SIGNS.length - 1)], xc = f - s * (0.35 + w / 2), yc = y + h / 2, c = hdr('#ffffff', tint * rand(0.9, 1.08)), mat = flick ? K.vFlick : K.vMat;
    b.box(VC.metal, '#1a1a1e', xc, yc, z, w + 0.12, h + 0.12, 0.26);
    b.add(planeUV(rect), mat, xc, yc, z + 0.135, w, h, 1, 0, 0, 0, c);
    b.add(planeUV(rect), mat, xc, yc, z - 0.135, w, h, 1, 0, Math.PI, 0, c);
    beam(b, VC.metal, f, y + h - 0.2, z, f - s * 0.35, y + h - 0.2, z, 0.08, '#2a2a30');
    beam(b, VC.metal, f, y + 0.3, z, f - s * 0.35, y + 0.3, z, 0.08, '#2a2a30');
    if (y < 9) K.wet(b, xc, z, 6, w * 0.9, hdr('#ffffff', 0.07));
    return y + h;
  };
  K.vsignStack = (b, i) => {
    const s = i.side, top = i.h - 0.5;
    if (top < GF + 3.4) return;
    const z = Math.min(-i.z0 - 0.35, Math.max(-i.z1 + 0.35, -(i.z0 + BAY * 2 * randi(0, Math.max(1, Math.round(i.n / 2)))) + rand(-0.2, 0.2)));
    const w = rand(0.95, 1.3);
    let y = GF + 0.25 + rand(0, 1.2);
    for (let k = randi(1, 3); k > 0 && y < Math.min(top, 24) - 2.6; k--) {
      const h = Math.min(rand(2.6, 5.4), Math.min(top, 24) - y);
      y = K.vsign(b, i.face, y, z, s, { w, h }) + rand(0.15, 0.5);
    }
  };
  // the roof: a parapet, a tin shack built on top, water tanks on their stands, aerials, a solar heater
  K.roof = (b, i, { shack = 0.5 } = {}) => {
    const s = i.side, f = i.face, H = i.h;
    b.box(VC.solid, '#c4c0b8', f - s * 0.1, H + 0.5, i.z, 0.2, 1.0, i.len);
    if (chance(shack)) {   // 頂樓加蓋: a tin room on the roof, its window lit
      const w = i.d * rand(0.5, 0.75), L = i.len - rand(0.4, 1.2), x = s * (Math.abs(f) + 0.8 + w / 2), col = pick(['#4a7ab0', '#4a8a6a', '#d8dce0', '#a86a4a', '#5a9ac8', '#e8e4d8']);
      b.addM(new THREE.BoxGeometry(w, 2.5, L).translate(0, 1.25, 0), K.tinMat, at(x, H, i.z), col);
      b.add(G.box, K.tinMat, x, H + 2.6, i.z, w + 0.6, 0.08, L + 0.4, 0, 0, s * 0.08, shade(col, 0.85));
      if (chance(0.6)) b.box(VC.glow, hdr(pick([...FLUO, ...WARMW]), 0.9), x - s * (w / 2 + 0.01), H + 1.3, i.z + rand(-L / 4, L / 4), 0.02, 0.8, 1.0);
    }
    for (let k = randi(1, 2); k > 0; k--) {   // stainless water tanks, the dome on top
      const x = i.x + s * rand(1, i.d / 2 - 1), z = i.z + rand(-i.len / 3, i.len / 3);
      for (const [dx, dz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) b.box(VC.metal, '#5a5e60', x + dx, H + 0.7, z + dz, 0.07, 1.4, 0.07);
      b.cyl(VC.metal, '#c8ccd2', x, H + 2.2, z, 0.7, 1.6, 'cyl8');
      b.add(G.sphLow, VC.metal, x, H + 3.0, z, 1.4, 0.5, 1.4, 0, 0, 0, '#c8ccd2');
    }
    if (chance(0.3)) { const x = i.x + s * rand(-2, 2), z = i.z + rand(-i.len / 3, i.len / 3); b.add(G.box, VC.solid, x, H + 0.9, z, 1.6, 0.06, 1.0, 0, 0, s * 0.6, '#1a2a3a'); b.cyl(VC.solid, '#e8e8e4', x + s * 0.7, H + 1.4, z, 0.2, 1.6, 'cyl8', 0, Math.PI / 2); }   // a solar water heater
    if (chance(0.5)) { const x = i.x + s * rand(-3, 3), z = i.z + rand(-i.len / 3, i.len / 3); b.box(VC.metal, '#4a4e52', x, H + 2, z, 0.06, 4, 0.06); for (let k = 0; k < 3; k++) b.box(VC.metal, '#4a4e52', x, H + 2.6 + k * 0.5, z, 0.04, 0.04, 1.4 - k * 0.3); }
    if (chance(0.3)) for (let k = 0; k < 4; k++) K.pot(b, f - s * 0.4, i.z + rand(-i.len / 2.5, i.len / 2.5), H);
  };
  // Dihua Street: two or three storeys of baroque front, the arcade under it, the name raised on the parapet
  K.dihuaRow = (b, s, z0, z1, { x0 = X0, shops = DIHUA_SHOPS } = {}) => {
    let z = z0;
    while (z1 - z >= 2.6 * 1.5) {
      const nb = Math.min(pick([2, 2, 3]), Math.floor((z1 - z) / 2.6)), L = nb * 2.6, d = rand(14, 18), fl = randi(1, 2), H = GF + fl * 3.8, f = s * x0, cz = -(z + L / 2);
      const T = pick(K.baroque), wall = T.brick ? '#ffffff' : pick(['#f4e8d0', '#f0d8c0', '#dce8d4', '#d8e4ec', '#f0e0b0', '#ecd8d0', '#e8e0d8']);
      b.addM(buildingGeo(d, fl * 3.8, L, T.tex, 2.6, 3.8), T.mat, at(s * (x0 + d / 2), GF, cz), wall);
      b.block(VC.solid, '#24242a', s * (x0 + ARC + (d - ARC) / 2), 0, cz, d - ARC, GF, L);
      const i = { x: s * (x0 + d / 2), z: cz, d, len: L, h: H, side: s, face: f, z0: z, z1: z + L, n: nb, floors: 0 };
      K.arcade(b, i, shops, { marquee: 0 });
      const trim = T.brick ? '#f0e8dc' : shade(wall, 1.04);
      b.box(VC.solid, trim, f - s * 0.18, GF + 0.15, cz, 0.36, 0.3, L);   // the string course
      for (let r = 0; r < fl; r++) {   // the balconies' cast-iron rails
        const y = GF + r * 3.8;
        b.box(VC.solid, trim, f - s * 0.35, y + 0.08, cz, 0.7, 0.16, L - 0.3);
        b.add(K.tiled(Math.max(1, Math.round(L / 0.9))), K.railTex, f - s * 0.68, y + 0.6, cz, L - 0.4, 0.9, 1, 0, face(s), 0);
      }
      // the parapet: a shaped gable over the cornice, the shop's name moulded into it
      const gw = L - 0.2, gh = rand(1.8, 2.6);
      b.box(VC.solid, trim, f - s * 0.2, H + 0.25, cz, 0.4, 0.5, L);
      b.add(planeUV(K.gableRects[randi(0, K.gableRects.length - 1)]), K.gableMat, f - s * 0.02, H + 0.5 + gh / 2, cz, gw, gh, 1, 0, face(s), 0, T.brick ? '#f4ece0' : wall);
      for (let k = 0; k < nb; k++) if (chance(0.7)) K.lantern(b, s * (x0 + 1.2), GF - 0.8, -(z + (k + 0.5) * 2.6), 0.28);   // red lanterns in the arcade
      z += L + 0.02;
    }
  };
  const gableNames = ['乾元行', '瑞記', '林五湖', '捷茂行', '建昌行', '永昌號', '合成', '金泰', '協和行', '源興'];
  const gable = atlas(gableNames.map((n, k) => [n, k]), 256, 96, 2, (g, [name, k], w, h) => {   // a baroque gable: scrolls rising to a pediment, the name in its panel
    g.clearRect(0, 0, w, h); g.fillStyle = '#f4f0e8';
    g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * 0.62); g.quadraticCurveTo(w * 0.12, h * 0.62, w * 0.18, h * 0.42);
    if (k % 2) { g.quadraticCurveTo(w * 0.3, h * 0.4, w * 0.36, h * 0.18); g.quadraticCurveTo(w / 2, h * 0.02, w * 0.64, h * 0.18); g.quadraticCurveTo(w * 0.7, h * 0.4, w * 0.82, h * 0.42); }
    else { g.lineTo(w * 0.34, h * 0.3); g.lineTo(w / 2, h * 0.04); g.lineTo(w * 0.66, h * 0.3); g.lineTo(w * 0.82, h * 0.42); }
    g.quadraticCurveTo(w * 0.88, h * 0.62, w, h * 0.62); g.lineTo(w, h); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(110,90,60,0.45)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(200,190,170,0.9)'; roundRect(g, w * 0.3, h * 0.52, w * 0.4, h * 0.38, 6); g.fill();
    g.fillStyle = '#5a4a32'; g.font = `900 ${Math.floor(h * 0.3)}px ${MING}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, w / 2, h * 0.72, w * 0.36);
    g.fillStyle = 'rgba(110,90,60,0.5)'; g.beginPath(); g.arc(w / 2, h * 0.36, h * 0.07, 0, 7); g.fill();
  });
  K.gableRects = gable.rects; K.gableMat = std({ map: gable.tex, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8, emissive: '#ffffff', emissiveMap: gable.tex, emissiveIntensity: 0.12 });
  K.railTex = std({ map: canvasTex(64, 32, (g, w, h) => {   // a balcony's cast-iron rail: bars between two rails, a scroll in each panel
    g.clearRect(0, 0, w, h); g.fillStyle = '#2a2e2c'; g.fillRect(0, 1, w, 3); g.fillRect(0, h - 4, w, 3);
    for (let x = 2; x < w; x += 6) g.fillRect(x, 3, 1.6, h - 6);
    g.strokeStyle = '#2a2e2c'; g.lineWidth = 1.4; for (let x = 16; x < w; x += 32) { g.beginPath(); g.arc(x, h / 2, 6, 0, 7); g.stroke(); }
  }), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.5 });
  // a lane of walk-up apartments: cages on every floor, iron doors and shutters at the bottom
  K.alleyRow = (b, s, z0, z1, { x0 = X0 - 0.6 } = {}) => {
    let z = z0;
    while (z1 - z >= BAY * 2) {
      const nb = Math.min(pick([4, 4, 6, 8]), Math.floor((z1 - z) / BAY)), L = nb * BAY, d = rand(12, 15), fl = randi(3, 4), H = 3.4 + fl * FH, f = s * x0, cz = -(z + L / 2), T = pick(K.apts);
      b.addM(buildingGeo(d, fl * FH, L, T.tex, BAY, FH), T.mat, at(s * (x0 + d / 2), 3.4, cz), pick(TILES));
      b.block(VC.solid, shade(pick(TILES), 0.75), s * (x0 + d / 2), 0, cz, d, 3.4, L);
      const i = { x: s * (x0 + d / 2), z: cz, d, len: L, h: H, side: s, face: f, z0: z, z1: z + L, n: nb, floors: fl, base: 3.4 };
      for (let k = 0; k < nb / 2; k++) {   // the doors: red or green iron doors, a shutter, now and then a little shop
        const zc = -(z + (k + 0.5) * 2 * BAY), q = Math.random();
        if (q < 0.22) K.shop(b, f, zc, 2 * BAY - 0.6, s, pickW(ALLEY_SHOPS), 0.05);
        else {
          b.box(VC.solid, q < 0.6 ? pick(['#a8282a', '#2a6a4a', '#8a6a3a', '#5a5e64']) : '#8a9096', f - s * 0.04, 1.2, zc, 0.06, 2.4, 1.6);
          b.box(VC.glow, hdr(pick(WARMW), 1.0), f - s * 0.1, 2.75, zc + 1.0, 0.1, 0.18, 0.18);   // the bulb over the door
          if (chance(0.4)) K.pot(b, f - s * 0.4, zc + rand(-1.2, 1.2), 0);
        }
        b.add(G.box, VC.solid, f - s * 0.6, 3.1, zc, 1.2, 0.06, 2 * BAY - 0.2, 0, 0, s * 0.18, pick(['#d8dce0', '#4a7ab0', '#c8b088', '#7a8a7a']));   // an awning
      }
      K.upper(b, i, { cage: 0.7, ac: 0.2, laundry: 0.15 });
      K.roof(b, i, { shack: 0.55 });
      if (chance(0.5)) K.vsignStack(b, i);
      z += L + 0.02;
    }
  };
  // glass towers over their podiums: the lit lobby, a department store's screens and canopy, the tower above
  K.towerRow = (b, s, z0, z1, { x0 = EDGE + 9 } = {}) => {
    let z = z0;
    while (z1 - z > 8) {
      const L = Math.min(rand(18, 32), z1 - z), d = rand(20, 28), cx = s * (x0 + d / 2), cz = -(z + L / 2), f = s * x0, hp = rand(10, 16), ht = rand(50, 130);
      const tex = chance(0.6) ? [K.office, K.officeMat] : [K.office2, K.office2Mat], store = chance(0.45);
      b.block(VC.solid, store ? '#2a2830' : '#3a3e48', cx, 0, cz, d, hp, L);
      b.add(K.tiled(Math.max(1, Math.round(L / 9))), K.lobbyMat, f - s * 0.04, 3.0, cz, L - 1.2, 5.2, 1, 0, face(s), 0, hdr('#ffffff', rand(0.85, 1.1)));
      for (let zz = -z - 1.5; zz > -z - L + 1; zz -= 2.2) b.box(VC.metal, '#2a2e36', f - s * 0.08, 3.0, zz, 0.08, 5.4, 0.12);
      b.box(VC.solid, '#5a6070', f - s * 1.0, 5.9, cz, 2.0, 0.25, L - 2);   // the canopy
      b.box(VC.glow, hdr('#fff4e0', 0.9), f - s * 1.0, 5.76, cz, 1.6, 0.03, L - 3);
      if (store) { K.led(b, { side: s, face: f, z: cz, len: L, h: 7 }); b.box(VC.glow, hdr(pick(['#ff4fa8', '#3dd6ff', '#ffd23d', '#ffffff']), 1.4), f - s * 0.05, hp - 0.8, cz, 0.04, 0.5, L * 0.6); }
      b.addM(buildingGeo(d - 2, ht, L - 2, tex[0], 1.5, 3.8), tex[1], at(cx + s * 1, hp, cz), pick(['#ffffff', '#d8e4ff', '#e8f0ff', '#c8d8f0']));
      K.pool(b, f - s * 2.4, cz, 4, L, hdr('#fff0d8', 0.09), 0.18);
      z += L + rand(1, 4);
    }
  };
  K.lobbyMat = basic({ map: canvasTex(256, 128, (g, w, h) => {   // a lobby or a store's ground floor at night: the lit ceiling, the counters, a few people
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff4e0'); gr.addColorStop(0.35, '#b8a890'); gr.addColorStop(1, '#3a3430'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let x = 16; x < w; x += 32) { g.fillStyle = '#ffffff'; g.fillRect(x - 8, 4, 16, 3); }
    for (let x = 20; x < w; x += 60) { g.fillStyle = 'rgba(40,36,32,0.85)'; g.fillRect(x, h * 0.62, 34, h * 0.22); g.fillStyle = pick(['#ffd0e0', '#e8f0ff', '#fff0c0']); g.fillRect(x + 2, h * 0.56, 30, h * 0.06); }
    for (let k = 0; k < 5; k++) { const x = rand(10, w - 10); g.fillStyle = 'rgba(20,16,16,0.85)'; g.beginPath(); g.arc(x, h * 0.6, 4, 0, 7); g.fill(); g.fillRect(x - 4, h * 0.64, 8, 22); }
    g.fillStyle = 'rgba(16,18,24,0.9)'; for (let x = 0; x <= w; x += 32) g.fillRect(x - 1.5, 0, 3, h); g.fillRect(0, h * 0.5, w, 2);
  }), vertexColors: true, color: hdr('#ffffff', 0.6) });
  K.led = (b, i) => {   // a big LED screen up on a podium, cycling its adverts
    const s = i.side, w = Math.min(i.len - 2, rand(8, 12)), h = w * 0.625;
    b.box(VC.metal, '#1a1c22', i.face - s * 0.15, i.h + h / 2, i.z, 0.3, h + 0.4, w + 0.4);
    b.add(G.plane, K.screen, i.face - s * 0.31, i.h + h / 2, i.z, w, h, 1, 0, face(s), 0, screenTint(1));
    K.wet(b, i.face - s * 1, i.z, 12, w * 0.5, hdr('#c8b8ff', 0.07));
  };
  // Xinyi's skywalks: a covered deck on columns along the pavement, lit underneath, people on it
  K.skywalk = (b, s, z0, z1, { x = EDGE + 5.4, y = 11.2 } = {}) => {
    const L = z1 - z0, zc = -(z0 + z1) / 2;
    b.box(VC.solid, '#5a606c', s * x, y, zc, 3.6, 0.45, L);
    b.box(VC.glow, hdr('#fff4dc', 0.85), s * x, y - 0.24, zc, 2.6, 0.03, L - 1);
    for (const e of [-1, 1]) { b.box(VC.glow, hdr('#d8ecff', 0.35), s * x + e * 1.75, y + 0.75, zc, 0.04, 1.05, L); b.box(VC.metal, '#c8ccd2', s * x + e * 1.75, y + 1.3, zc, 0.08, 0.08, L); }
    for (let z = z0 + 4; z < z1; z += 10) b.cyl(VC.metal, '#8a909a', s * x, y / 2, -z, 0.3, y, 'cyl8');
    for (let z = z0; z <= z1; z += 3) b.box(VC.metal, '#e8ecf0', s * x, y + 2.6, -z, 3.8, 0.12, 0.12);   // the canopy's white ribs
    b.add(G.box, VC.glow, s * x, y + 2.7, zc, 3.6, 0.03, L, 0, 0, 0, hdr('#c8e0f0', 0.18));
    for (let k = 0; k < L / 4; k++) K.person(b, s * (x + rand(-1.2, 1.2)), -rand(z0 + 1, z1 - 1), { y: y + 0.22, umbrella: false });
  };
  K.skybridge = (b, z, { y = 11.2, W = 13 } = {}) => {   // a skywalk over the road between two podiums, a glass tube on its trusses, up clear of the jetpack
    b.box(VC.solid, '#5a606c', 0, y, z, 2 * W, 0.45, 3.6);
    b.box(VC.glow, hdr('#fff4dc', 0.9), 0, y - 0.24, z, 2 * W - 1, 0.03, 2.6);
    for (const e of [-1, 1]) { b.box(VC.glow, hdr('#d8ecff', 0.5), 0, y + 1.3, z + e * 1.78, 2 * W - 0.4, 2.0, 0.04); for (let x = -W + 1; x < W; x += 2) b.box(VC.metal, '#e8ecf0', x, y + 1.3, z + e * 1.8, 0.08, 2.1, 0.06); }
    for (let x = -W; x <= W; x += 2.6) b.add(G.box, VC.metal, x, y + 2.55, z, 0.12, 0.12, 3.9, 0, 0, 0, '#e8ecf0');
    b.box(VC.solid, '#2a3a5a', 0, y + 0.1, z + 1.82, 7, 0.4, 0.04);
    b.add(G.plane, K.label('信義商圈空橋', { w: 512, h: 64, color: '#ffffff', size: 0.7, k: 1.3 }), 0, y + 0.1, z + 1.85, 5, 0.32, 1);
    for (const e of [-1, 1]) b.box(VC.metal, '#8a909a', e * (EDGE + 1.0), y / 2, z, 0.6, y, 0.6);
    for (let k = 0; k < 6; k++) K.person(b, rand(-W + 2, W - 2), z + rand(-0.9, 0.9), { y: y + 0.22, umbrella: false });
  };

  // ---------- street furniture ----------
  K.lamp = (b, x, z, s, { col = '#ffe8c8', k = 2.6 } = {}) => {   // a tall grey post at the kerb, its arm over the road and a flat LED head
    b.cyl(VC.metal, '#5a6068', x, 3.95, z, 0.1, 7.9, 'cyl8');
    b.cyl(VC.metal, '#5a6068', x, 0.4, z, 0.17, 0.8, 'cyl8');
    beam(b, VC.metal, x, 7.6, z, x - s * 1.6, 7.95, z, 0.08, '#5a6068');   // (its head kept under the jetpack's flight)
    b.box(VC.metal, '#3a4048', x - s * 1.75, 7.92, z, 0.8, 0.12, 0.34);
    b.box(VC.glow, hdr(col, k), x - s * 1.75, 7.84, z, 0.66, 0.04, 0.24);
    K.pool(b, x - s * 1.2, z, 7, 7, hdr(col, 0.07));
    K.wet(b, x - s * 1.6, z, 14, 1.0, hdr(col, 0.1));
  };
  K.signal = (b, x, z, s, lit = randi(0, 2)) => {   // the signals: red, amber, green and the arrows; the walking green man and his countdown
    b.cyl(VC.metal, '#5a6068', x, 3.1, z, 0.09, 6.2, 'cyl8');
    beam(b, VC.metal, x, 6.0, z, x - s * 2.6, 6.0, z, 0.08, '#5a6068');   // (high enough to run under on a train's roof)
    b.box(VC.metal, '#1a1c20', x - s * 2.4, 6.0, z + 0.14, 1.0, 0.34, 0.2);
    ['#ff2a2a', '#ffb020', '#39ff6a'].forEach((c, k) => b.cyl(VC.glow, hdr(c, k === lit ? 3 : 0.12), x - s * (2.06 + k * 0.32), 6.0, z + 0.25, 0.11, 0.03, 'cyl8', Math.PI / 2));
    b.box(VC.metal, '#1a1c20', x, 2.7, z + 0.16, 0.36, 0.8, 0.22);
    b.add(G.plane, K.walkMat, x, 2.9, z + 0.28, 0.27, 0.36, 1);
    b.add(G.plane, K.countMat, x, 2.5, z + 0.28, 0.3, 0.22, 1);
  };
  // a zebra crossing centred on (x, z): bars `along` long, laid side by side over `across` metres. dir 'x': people walk
  // along x (a crossing over the track); 'z': along z (over a side street). colors: the rainbow at Ximen, else white
  K.RAINBOW = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'];
  K.crossing = (b, x, z, across, along, { dir = 'x', colors = null, w = 0.45, gap = 0.45, y = 0.036, k = 0.8 } = {}) => {
    const n = Math.max(1, Math.floor((across + gap) / (w + gap))), o0 = -((n - 1) * (w + gap)) / 2;
    for (let i = 0; i < n; i++) {
      const o = o0 + i * (w + gap), col = colors ? hdr(colors[i % colors.length], k) : hdr('#e8e8e2', 0.62);
      if (dir === 'x') b.add(G.plane, K.paintMat, x + o, y, z, w, along, 1, -Math.PI / 2, 0, 0, col);
      else b.add(G.plane, K.paintMat, x, y, z + o, along, w, 1, -Math.PI / 2, 0, 0, col);
    }
  };
  K.paint = (b, x, z, w, d, col = hdr('#e8e8e2', 0.62), y = 0.036) => b.add(G.plane, K.paintMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0, col);   // a line, a box edge
  K.streetSign = (b, x, z, i = randi(0, STREETS.length - 1)) => {
    b.cyl(VC.metal, '#5a6068', x, 1.5, z, 0.05, 3.0, 'cyl6');
    b.add(planeUV(K.streetRects[i]), K.streetMat, x, 3.1, z, 1.6, 0.6, 1, 0, 0, 0);
  };
  K.busStop = (b, x, z, s) => {   // a bus stop: the shelter, its lit panel, the arrivals board counting the minutes
    for (const dz of [-1.8, 1.8]) b.box(VC.metal, '#7a8088', x + s * 0.6, 1.3, z + dz, 0.08, 2.6, 0.08);
    b.box(VC.metal, '#9aa0a8', x, 2.65, z, 1.8, 0.08, 4.0);
    b.box(VC.glow, hdr('#e8f0ff', 1.0), x + s * 0.7, 1.4, z, 0.04, 1.6, 2.8);
    b.box(VC.solid, '#1a1a1e', x - s * 0.1, 2.35, z - 2.25, 0.1, 0.5, 0.9);
    b.add(G.plane, K.marquee, x - s * 0.1, 2.35, z - 2.19, 0.8, 0.3, 1);
    b.box(VC.solid, '#5a5a62', x + s * 0.3, 0.45, z, 0.4, 0.06, 2.8);
  };
  K.mrt = (b, x, z, s, name = '捷運 市政府站') => {   // an MRT entrance: the glass canopy over the stairs going down, the tall white sign
    b.block(VC.solid, '#1a1c22', x, 0, z, 2.6, 0.1, 6);
    b.box(VC.glow, hdr('#f4f8ff', 0.35), x, 0.3, z, 2.2, 0.4, 5.2);
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#d8ecff', 0.1), x + e * 1.3, 1.5, z, 0.04, 2.6, 5.8);
    b.add(G.box, VC.solid, x, 2.9, z, 3.0, 0.12, 6.4, 0, 0, 0, '#c8ccd2');
    b.box(VC.solid, '#f4f4f0', x - s * 1.8, 2.4, z - 3.6, 0.3, 4.8, 0.8);
    b.box(VC.solid, '#1f5fb4', x - s * 1.8, 4.6, z - 3.6, 0.32, 0.4, 0.82);
    b.add(G.plane, K.label(name, { w: 128, h: 512, color: '#1f2a44', font: HEI, size: 0.7, vertical: true, bg: '#f4f4f0', k: 1.2 }), x - s * 1.96, 2.2, z - 3.6, 0.6, 3.2, 1, 0, face(s), 0);
  };
  K.postboxes = (b, x, z) => {   // the post office's pair: green for ordinary letters, red for express
    for (const [dz, col] of [[-0.35, '#2a7a3a'], [0.35, '#c8202a']]) {
      b.block(VC.solid, col, x, 0, z + dz, 0.55, 1.05, 0.6);
      b.add(G.cyl, VC.solid, x, 1.05, z + dz, 0.55, 0.6, 0.3, Math.PI / 2, 0, 0, col);
      b.box(VC.solid, '#141414', x, 0.86, z + dz, 0.57, 0.05, 0.26);
    }
  };
  K.vending = (b, x, z, s) => {   // a drinks machine glowing in the lane
    b.block(VC.solid, pick(['#c8202a', '#1f4aa8', '#f4f4f0', '#2a7a3a']), x, 0, z, 0.8, 1.8, 1.0);
    b.box(VC.glow, hdr('#f4f8ff', 1.2), x - s * 0.41, 1.2, z, 0.02, 0.7, 0.8);
    for (let k = 0; k < 6; k++) b.box(VC.glow, hdr(pick(['#ff3a2a', '#ffd23d', '#3ad8ff', '#39ff88', '#ffffff']), 1.3), x - s * 0.42, 1.0 + (k % 2) * 0.3, z - 0.3 + Math.floor(k / 2) * 0.3, 0.02, 0.18, 0.08);
    K.pool(b, x - s * 0.9, z, 1.8, 1.6, hdr('#e8f4ff', 0.12));
  };
  K.ubike = (b, x, z, s, n = randi(4, 8)) => {   // a row of the city's yellow hire bikes in their docks
    for (let k = 0; k < n; k++) {
      const zz = z + (k - n / 2) * 0.7;
      b.box(VC.metal, '#8a9098', x + s * 0.6, 0.45, zz, 0.18, 0.9, 0.14);
      for (const dx of [-0.5, 0.5]) b.cyl(VC.solid, '#1a1a1a', x + dx * s, 0.33, zz, 0.32, 0.05, 'cyl8', Math.PI / 2, 0);
      beam(b, VC.solid, x - s * 0.5, 0.33, zz, x + s * 0.2, 0.85, zz, 0.06, '#ffb81c');
      beam(b, VC.solid, x + s * 0.5, 0.33, zz, x + s * 0.2, 0.85, zz, 0.06, '#ffb81c');
      b.box(VC.solid, '#ffb81c', x + s * 0.48, 0.9, zz, 0.3, 0.2, 0.32);
      b.box(VC.solid, '#1a1a1a', x - s * 0.15, 0.95, zz, 0.28, 0.06, 0.14);
    }
  };
  // a scooter, nose along local -z: the leg shield, the seat, the tail, two small wheels. rider: someone in a helmet on it
  K.scooter = (b, x, z, ry, col = pick(SCOOTERS), { rider = false, lit = false } = {}) => {
    const c = Math.cos(ry), sn = Math.sin(ry);
    const P = (dx, dz) => [x + dx * c + dz * sn, z - dx * sn + dz * c];
    const box = (dx, y, dz, w, h, d, color, rx = 0, mat = VC.solid) => { const [px, pz] = P(dx, dz); b.add(G.box, mat, px, y, pz, w, h, d, rx, ry, 0, color); };
    box(0, 0.3, -0.2, 0.44, 0.07, 0.52, '#2a2a2e');            // the floorboard, low between the shield and the seat
    box(0, 0.66, -0.62, 0.5, 0.74, 0.12, col, 0.28);           // the leg shield, leaning back
    box(0, 0.54, 0.42, 0.42, 0.44, 0.86, col);                 // the body under the seat
    box(0, 0.82, 0.34, 0.34, 0.11, 0.7, '#141414');            // the seat
    box(0, 1.03, -0.74, 0.62, 0.12, 0.14, col);                // the handlebar and the headlight's cowl
    box(0, 1.0, -0.82, 0.15, 0.08, 0.02, lit ? hdr('#fff4d8', 2.5) : '#cfd4d8', 0, lit ? VC.glow : VC.solid);
    box(0, 0.7, 0.86, 0.22, 0.06, 0.03, lit ? hdr('#ff2a2a', 2) : '#7a1414', 0, lit ? VC.glow : VC.solid);
    if (chance(0.3)) box(0, 1.03, 0.66, 0.36, 0.26, 0.36, pick(['#c8ccd0', '#141414', '#e8e8e4']));   // a top box
    for (const dz of [-0.64, 0.6]) box(0, 0.22, dz, 0.1, 0.42, 0.42, '#141414');   // the wheels
    if (rider) {   // a raincoat over the knees, the arms out to the bars, the helmet and its dark visor
      const [px, pz] = P(0, 0.25), coat = pick(['#f0d040', '#2a6ad8', '#c8202a', '#dfe8ee', '#1a1a1e', '#8a5ad8', '#3a8a5a']), [vx, vz] = P(0, 0.08), [ax, az] = P(0, -0.62);
      b.add(G.box, VC.solid, px, 1.2, pz, 0.46, 0.66, 0.34, 0.2, ry, 0, coat);
      b.add(G.box, VC.solid, px, 0.86, pz - 0.0, 0.5, 0.2, 0.7, 0, ry, 0, coat);
      beam(b, VC.solid, px, 1.36, pz, ax, 1.06, az, 0.09, coat);
      b.add(G.sphLow, VC.solid, px, 1.7, pz, 0.34, 0.34, 0.36, 0, 0, 0, pick(['#f4f4f0', '#c8202a', '#141414', '#e8c040', '#5a8ad8', '#ff8ab8']));   // the helmet
      b.add(G.box, VC.solid, vx, 1.68, vz, 0.24, 0.12, 0.06, 0, ry, 0, '#141418');
    }
  };
  K.scooters = (b, s, z0, z1, x, { gap = 0.4, skip = [] } = {}) => {   // scooters parked nose to the kerb, tails to the road, packed tight
    for (let z = z0 + rand(0, 0.6); z < z1 - 0.4; z += rand(0.8, 1.0)) {
      if (skip.some(([a, c]) => z > a && z < c)) continue;
      if (chance(gap)) { z += rand(0.5, 2.5); continue; }
      K.scooter(b, s * x + rand(-0.15, 0.15), -z, -s * Math.PI / 2 + rand(-0.18, 0.18));
    }
  };
  K.taxi = (b, x, z) => {   // a yellow taxi, nose toward the runner, its roof light on
    b.block(VC.solid, '#f2c230', x, 0.3, z, 1.76, 0.74, 4.5);
    b.block(VC.solid, '#f2c230', x, 1.04, z - 0.2, 1.56, 0.56, 2.5);
    b.box(VC.glow, hdr('#d8e8ff', 0.3), x, 1.3, z - 0.2, 1.58, 0.34, 2.3);
    b.box(VC.glow, hdr('#fff4dc', 1.8), x, 1.7, z - 0.2, 0.62, 0.16, 0.22);
    for (const dx of [-0.6, 0.6]) { b.box(VC.glow, hdr('#fff4d6', 2), x + dx, 0.72, z + 2.26, 0.34, 0.12, 0.04); b.box(VC.glow, hdr('#ff2a2a', 2), x + dx, 0.78, z - 2.26, 0.3, 0.12, 0.04); }
    for (const dz of [-1.4, 1.4]) for (const dx of [-0.78, 0.78]) b.cyl(VC.solid, '#141414', x + dx, 0.32, z + dz, 0.32, 0.2, 'cyl8', 0, Math.PI / 2);
    K.wet(b, x, z + 2.3, 10, 1.4, hdr('#fff4d6', 0.12));
  };
  K.bus = (b, x, z) => {   // a city bus: big lit windows, a coloured band, the route number in orange LEDs
    const band = pick(['#2a8a5a', '#1f5aa8', '#c8202c', '#f2a020']);
    b.block(VC.solid, '#f2f2ee', x, 0.35, z, 2.5, 2.9, 11.5);
    b.box(VC.glow, hdr('#f0f4ff', 0.75), x, 1.85, z - 0.2, 2.52, 1.0, 10.6);
    b.box(VC.solid, band, x, 0.9, z, 2.53, 0.35, 11.4);
    b.box(VC.glow, hdr('#ff9a2a', 2.2), x, 2.95, z + 5.76, 1.6, 0.3, 0.03);
    for (const dx of [-0.9, 0.9]) b.box(VC.glow, hdr('#fff4d6', 2), x + dx, 0.8, z + 5.76, 0.3, 0.14, 0.03);
    for (const dz of [-3.8, 3.6]) for (const dx of [-1.1, 1.1]) b.cyl(VC.solid, '#141414', x + dx, 0.5, z + dz, 0.5, 0.3, 'cyl8', 0, Math.PI / 2);
  };
  // a betel nut kiosk: a glass box framed in chasing neon tubes, its sign, the fridge of drinks
  K.betel = (b, x, z, s) => {
    b.block(VC.solid, '#2a2a30', x, 0, z, 1.8, 0.9, 2.4);
    b.box(VC.glow, hdr('#9affd8', 0.42), x, 1.65, z, 1.7, 1.5, 2.3);
    for (let k = 0; k < 3; k++) b.box(VC.solid, pick(['#c8202a', '#2a8a3a', '#e8c040', '#f4f4f0']), x + s * 0.2, 1.2 + k * 0.4, z + rand(-0.6, 0.6), 0.3, 0.3, 0.6);   // the drinks and packets on its shelves
    K.seated(b, x - s * 0.1, z - 0.5, { y: 0.9 });   // the seller
    b.block(VC.solid, '#1a1a1e', x, 2.4, z, 1.9, 0.3, 2.5);
    for (let k = 0; k < 3; k++) {
      const y = 2.48 - k * 0.6, m = K.chase[k];
      b.box(m, 0xffffff, x - s * 0.96, y, z, 0.04, 0.06, 2.4);
      for (const e of [-1, 1]) b.box(m, 0xffffff, x - s * 0.96, y - 0.3, z + e * 1.2, 0.04, 0.6, 0.06);
    }
    b.add(G.plane, K.label('檳榔', { w: 256, h: 128, color: '#ffffff', font: HEI, size: 0.7, bg: '#c8102e', border: '#ffe23d', k: 1.3 }), x - s * 0.97, 2.85, z, 1.4, 0.7, 1, 0, face(s), 0);
    b.add(G.plane, K.label('香菸 · 飲料 · 冰涼', { w: 512, h: 64, color: '#ffe23d', font: HEI, size: 0.7, bg: '#141418', k: 1.3 }), x - s * 0.97, 2.4, z, 2.0, 0.25, 1, 0, face(s), 0);
    K.pool(b, x - s * 1.6, z, 3, 3, hdr('#7affd0', 0.12));
    K.wet(b, x - s * 1.2, z, 8, 1.4, hdr('#ff4fa8', 0.1));
  };
  // a neighbourhood shrine to the Earth God: a little red temple with its swallowtail ridge, lanterns, the incense burner
  const shrineRoof = roofGeo(3.0, 2.6, 1.0, { hip: false, lift: 0.9, eave: 0.45, tile: 0.5 });
  K.shrine = (b, x, z, s) => {
    b.block(VC.solid, '#c8bca8', x, 0, z, 3.0, 0.4, 3.4);
    b.block(VC.solid, '#b8282a', x + s * 0.4, 0.4, z, 2.4, 2.4, 2.8);
    b.box(VC.glow, hdr('#ffb070', 1.1), x - s * 0.82, 1.5, z, 0.02, 1.6, 1.2);
    b.add(G.plane, K.label('福德宮', { w: 512, h: 160, color: '#ffe08a', font: KAI, weight: 400, size: 0.72, bg: '#1a1a1a', border: '#d8a830', k: 1.3 }), x - s * 0.84, 2.45, z, 1.5, 0.45, 1, 0, face(s), 0);
    for (const e of [-1, 1]) b.add(G.plane, K.label(e > 0 ? '國泰民安' : '風調雨順', { w: 96, h: 384, color: '#1a1a1a', font: KAI, weight: 400, size: 0.7, bg: '#e8202a', vertical: true, k: 1.0 }), x - s * 0.84, 1.5, z + e * 0.95, 0.3, 1.3, 1, 0, face(s), 0);
    b.addM(shrineRoof.roof, K.roofTile, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(x + s * 0.4, 2.8, z), '#3a6a5a');
    for (const e of [-1, 1]) beam(b, VC.solid, x + s * 0.4, 3.75, z + e * 1.4, x + s * 0.4, 4.35, z + e * 2.0, 0.12, '#c8202a');   // the swallowtail's upswept ends
    b.box(VC.solid, '#c8202a', x + s * 0.4, 3.8, z, 0.18, 0.16, 2.8);
    for (const e of [-1, 1]) K.lantern(b, x - s * 1.1, 2.3, z + e * 1.0, 0.26);
    b.cyl(VC.metal, '#b89040', x - s * 1.4, 0.55, z, 0.32, 0.7, 'cyl8'); b.box(VC.glow, hdr('#ff7a2a', 1.6), x - s * 1.4, 0.95, z, 0.4, 0.06, 0.4);
    K.pool(b, x - s * 1.6, z, 3.4, 3.4, hdr('#ff8a3a', 0.14));
  };
  // ---------- the night market ----------
  // a hawker behind the counter, facing the track from side s: a coat under the apron, both arms out over the counter
  // (a spatula or tongs in one hand), a cap, a headscarf, a chef's hat, a towel round the head, or just the hair
  const APRONS = ['#f0f0ea', '#f0f0ea', '#c8202a', '#2a5aa8', '#2a7a4a', '#1a1a1e', '#e8a0b8', '#f0c030'];
  K.vendor = (b, x, z, s, { coat = pick(COATS), apron = pick(APRONS), hat = pick(['cap', 'cap', 'scarf', 'chef', 'towel', 'none']), tool = pick([null, 'spatula', 'tongs']), reach = rand(0.4, 0.6), y = 0 } = {}) => {
    const q = rand(0.96, 1.04), skin = pick(SKIN), hx = x - s * reach;
    b.box(VC.solid, pick(TROUSERS), x, y + 0.47 * q, z, 0.24, 0.94 * q, 0.36);
    b.box(VC.solid, coat, x, y + 1.27 * q, z, 0.26, 0.62 * q, 0.44);
    b.box(VC.solid, apron, x - s * 0.14, y + 1.12 * q, z, 0.03, 0.8 * q, 0.38);   // the apron, its bib up to the chest
    for (const e of [-1, 1]) {
      const hy = y + (1.02 + rand(0, 0.14)) * q, hz = z + e * 0.2;
      beam(b, VC.solid, x, y + 1.48 * q, z + e * 0.24, hx, hy, hz, 0.1, coat);
      b.box(VC.solid, skin, hx - s * 0.04, hy, hz, 0.09, 0.09, 0.09);
      if (e > 0 && tool === 'spatula') b.box(VC.metal, '#c8ccd0', hx - s * 0.2, hy - 0.06, hz, 0.3, 0.02, 0.12, 0, 0, s * 0.3);
      if (e > 0 && tool === 'tongs') for (const d of [-0.03, 0.03]) b.box(VC.metal, '#c8ccd0', hx - s * 0.18, hy - 0.04, hz + d, 0.32, 0.02, 0.02, 0, 0, s * 0.35);
    }
    b.sph(VC.solid, skin, x, y + 1.73 * q, z, 0.15 * q, true);
    const hc = pick(['#c8202a', '#141414', '#f4f4f0', '#1f4aa8', '#e8c040', '#2a7a4a']);
    if (hat === 'cap') { b.box(VC.solid, hc, x, y + 1.85 * q, z, 0.3, 0.12, 0.3); b.box(VC.solid, hc, x - s * 0.2, y + 1.8 * q, z, 0.16, 0.03, 0.24); }
    else if (hat === 'scarf') b.box(VC.solid, pick(['#c8202a', '#e8a0b8', '#2a5aa8', '#f0c030', '#7a3aa8']), x + s * 0.02, y + 1.83 * q, z, 0.32, 0.17, 0.32);
    else if (hat === 'chef') b.cyl(VC.solid, '#f4f4f0', x, y + 1.97 * q, z, 0.15, 0.3, 'cyl6');
    else { b.box(VC.solid, pick(HAIR), x + s * 0.02, y + 1.82 * q, z, 0.3, 0.14, 0.3); if (hat === 'towel') b.box(VC.solid, '#f0f0ea', x, y + 1.8 * q, z, 0.32, 0.06, 0.32); }
  };
  // fire for the woks: two crossed sheets of flame, flickering
  K.flame = (b, x, y, z, h = 0.6, w = 0.6) => { const m = pick(K.flames); for (const ry of [0, Math.PI / 2]) b.add(G.plane, m, x, y + h / 2, z, w, h, 1, 0, ry + rand(-0.4, 0.4), 0, hdr('#ffffff', rand(0.8, 1.05))); };
  const ICO = new THREE.IcosahedronGeometry(0.5, 0), OCT = new THREE.OctahedronGeometry(0.5);
  const ball = (b, mat, col, x, y, z, r, geo = OCT) => b.add(geo, mat, x, y, z, r * 2, r * 2, r * 2, 0, rand(0, 3), 0, col);
  const trough = (b, x, z, T, L = 1.2) => { b.block(VC.solid, '#1a1a1c', x, T, z, 0.6, 0.16, L); b.box(K.ember, hdr('#ff4a10', 1.1), x, T + 0.165, z, 0.5, 0.01, L - 0.1); };
  const fryer = (b, x, z, T, L = 0.9) => { b.block(VC.metal, '#9aa0a8', x, T, z, 0.7, 0.22, L); b.box(VC.glow, hdr('#d89a30', 0.5), x, T + 0.225, z, 0.6, 0.01, L - 0.1); };
  const pot = (b, x, z, T, soup, r = 0.27) => { b.cyl(VC.metal, '#b8bcc4', x, T + 0.25, z, r, 0.5, 'cyl8'); b.cyl(VC.solid, soup, x, T + 0.505, z, r - 0.03, 0.01, 'cyl8'); };
  // what's on the counter (T is its height, x its middle, the track toward -s); st collects where steam rises
  const GEAR = {
    grill(b, x, z, s, T, st) {   // sausages over charcoal; the sticky-rice ones waiting on the board
      trough(b, x, z - 0.3, T);
      for (let j = 0; j < 8; j++) b.box(VC.solid, pick(['#9a2a1a', '#a8341e', '#8a2414']), x, T + 0.21, z - 0.78 + j * 0.135, 0.44, 0.08, 0.08);
      b.box(VC.solid, '#d8c090', x - s * 0.05, T + 0.02, z + 0.6, 0.5, 0.04, 0.7);
      for (let j = 0; j < 3; j++) b.box(VC.solid, '#ece4d4', x - s * 0.05, T + 0.09, z + 0.42 + j * 0.15, 0.4, 0.09, 0.09);
      st && st.push([x, T + 0.3, z - 0.3]);
    },
    griddle(b, x, z, s, T, st, k) {   // the big iron plate: oyster omelettes in their red sauce, or spring-onion pancakes
      b.block(VC.solid, '#2a2a2e', x, T, z - 0.15, 0.9, 0.06, 1.5);
      for (let j = 0; j < 4; j++) {
        const oz = z - 0.7 + j * 0.36, ox = x + rand(-0.15, 0.15);
        b.add(G.cyl6, VC.solid, ox, T + 0.07, oz, 0.32, 0.03, 0.3, 0, rand(0, 1), 0, k === 1 ? '#e0d4a4' : '#e0b860');
        if (k === 1) b.box(VC.solid, '#c83a24', ox, T + 0.09, oz, 0.14, 0.01, 0.1);
      }
      b.cyl(VC.solid, '#f4f4f0', x - s * 0.1, T + 0.07, z + 0.75, 0.16, 0.14, 'cyl8');   // the plates
      st && st.push([x, T + 0.15, z - 0.2]);
    },
    fryer(b, x, z, s, T, st) {   // stinky tofu: the fryer, the cubes waiting, the tub of pickled cabbage
      fryer(b, x + s * 0.05, z - 0.4, T);
      for (let j = 0; j < 8; j++) b.box(VC.solid, pick(['#b8823a', '#c8923a', '#a8722a']), x - s * rand(0, 0.3), T + 0.05, z + 0.25 + rand(0, 0.6), 0.12, 0.1, 0.12, rand(0, 1));
      b.cyl(VC.solid, '#f0f0ea', x + s * 0.25, T + 0.08, z + 0.6, 0.14, 0.16, 'cyl8'); b.cyl(VC.solid, '#e8e0a0', x + s * 0.25, T + 0.165, z + 0.6, 0.12, 0.01, 'cyl8');
      st && st.push([x + s * 0.05, T + 0.3, z - 0.4]);
    },
    cutlet(b, x, z, s, T, st) {   // fried chicken cutlets as big as your face, stood up in the window under the heat lamp
      fryer(b, x + s * 0.15, z - 0.45, T, 0.8);
      for (let j = 0; j < 3; j++) b.add(G.cyl8, VC.solid, x - s * 0.3, T + 0.3, z + 0.15 + j * 0.3, 0.5, 0.05, 0.34, 0, 0, Math.PI / 2, pick(['#c8862a', '#d0902e', '#b87822']));
      b.box(VC.glow, hdr('#ffb060', 1.2), x - s * 0.3, T + 0.72, z + 0.45, 0.2, 0.04, 0.9);
      st && st.push([x + s * 0.15, T + 0.3, z - 0.45]);
    },
    oven(b, x, z, s, T, st) {   // the clay drum oven, the buns lined up beside it
      b.cyl(VC.solid, '#8a5a3a', x, T + 0.4, z - 0.35, 0.4, 0.8, 'cyl8'); b.cyl(K.ember, hdr('#ff8a2a', 1.3), x, T + 0.805, z - 0.35, 0.3, 0.01, 'cyl8');
      for (let j = 0; j < 8; j++) b.add(OCT, VC.solid, x - s * (j % 2 ? 0.1 : -0.15), T + 0.05, z + 0.25 + Math.floor(j / 2) * 0.17, 0.16, 0.09, 0.16, 0, rand(0, 3), 0, '#e8b060');
      st && st.push([x, T + 0.9, z - 0.35]);
    },
    balls(b, x, z, s, T, st) {   // sweet-potato balls puffing up in the wok, a tray of them done
      b.add(G.sphLow, VC.solid, x, T + 0.12, z - 0.3, 0.9, 0.24, 0.9, 0, 0, 0, '#1a1a1c');
      b.cyl(VC.glow, hdr('#d89a30', 0.45), x, T + 0.2, z - 0.3, 0.36, 0.01, 'cyl8');
      for (let j = 0; j < 7; j++) ball(b, VC.solid, '#e8a030', x + rand(-0.2, 0.2), T + 0.22, z - 0.3 + rand(-0.2, 0.2), 0.06);
      b.box(VC.metal, '#c8ccd0', x - s * 0.1, T + 0.02, z + 0.55, 0.5, 0.04, 0.6);
      for (let j = 0; j < 9; j++) ball(b, VC.solid, '#f0b040', x - s * 0.1 + rand(-0.18, 0.18), T + 0.08, z + 0.55 + rand(-0.24, 0.24), 0.06);
      st && st.push([x, T + 0.25, z - 0.3]);
    },
    corn(b, x, z, s, T, st) {   // corn on the charcoal, brushed with soy as it chars
      trough(b, x, z - 0.2, T, 1.4);
      for (let j = 0; j < 7; j++) b.box(VC.solid, j % 2 ? '#c8902a' : '#e8b830', x, T + 0.23, z - 0.75 + j * 0.18, 0.36, 0.12, 0.12);
      b.box(VC.solid, '#3a2410', x - s * 0.2, T + 0.08, z + 0.75, 0.16, 0.16, 0.16);
      st && st.push([x, T + 0.3, z - 0.2]);
    },
    basket(b, x, z, s, T, st, k) {   // pick your own: trays of everything on the steps, the baskets, the fryer (or the braising pot) behind
      for (let t = 0; t < 2; t++) {
        b.box(VC.metal, '#9aa0a8', x - s * (0.25 - t * 0.28), T + 0.03 + t * 0.26, z - 0.2, 0.3, 0.04 + t * 0.52, 1.5);
        for (let j = 0; j < 5; j++) b.box(VC.solid, pick(['#5a9a3a', '#f0e8d8', '#e8a0a0', '#f0c840', '#8a5a3a', '#c8402a', '#d8d0b0', '#3a6a2a']), x - s * (0.25 - t * 0.28), T + 0.1 + t * 0.52, z - 0.78 + j * 0.29, 0.24, 0.07, 0.25);
      }
      b.box(VC.glow, hdr('#f4f8ff', 1.6), x - s * 0.1, T + 1.05, z - 0.2, 0.05, 0.04, 1.3);
      if (k === 9) pot(b, x + s * 0.2, z + 0.75, T, '#3a2412', 0.24); else fryer(b, x + s * 0.15, z + 0.75, T, 0.5);
      for (let j = 0; j < 3; j++) b.box(VC.solid, '#d8202a', x - s * 0.35, T + 0.04 + j * 0.05, z + 0.75, 0.24, 0.05, 0.24);   // the stack of baskets
      st && st.push([x + s * 0.15, T + 0.4, z + 0.75]);
    },
    wok(b, x, z, s, T, st) {   // stir-fried squid on a roaring flame, the ingredients in their bowls
      b.block(VC.metal, '#4a4e56', x + s * 0.05, T, z - 0.3, 0.62, 0.26, 0.7);
      b.add(G.sphLow, VC.metal, x + s * 0.05, T + 0.4, z - 0.3, 0.72, 0.24, 0.72, 0, 0, 0, '#2a2a2e');
      b.box(VC.metal, '#1a1a1c', x - s * 0.36, T + 0.48, z - 0.3, 0.4, 0.04, 0.05);
      K.flame(b, x + s * 0.05, T + 0.28, z - 0.3, rand(0.5, 0.8), 0.75);
      for (let j = 0; j < 3; j++) { b.cyl(VC.solid, '#f4f4f0', x - s * 0.15, T + 0.06, z + 0.3 + j * 0.25, 0.1, 0.12, 'cyl6'); b.box(VC.solid, pick(['#f0d8d0', '#5a9a3a', '#e8c040', '#c83a24']), x - s * 0.15, T + 0.125, z + 0.3 + j * 0.25, 0.13, 0.01, 0.13); }
      for (let j = 0; j < 4; j++) b.box(VC.solid, '#f4f4f0', x + s * 0.2, T + 0.04 + j * 0.07, z + 0.6, 0.22, 0.06, 0.28);   // the takeaway boxes
      st && st.push([x, T + 0.6, z - 0.3]);
    },
    pots(b, x, z, s, T, st, k) {   // the big pots of herbal pork-rib soup or oyster vermicelli, the ladle, the bowls
      const soup = k === 11 ? '#3a2010' : '#8a5a34';
      pot(b, x, z - 0.45, T, soup); pot(b, x, z + 0.2, T, soup, 0.24);
      beam(b, VC.metal, x, T + 0.5, z - 0.45, x - s * 0.3, T + 0.9, z - 0.35, 0.03, '#c8ccd0');
      b.cyl(VC.solid, '#f4f0e8', x - s * 0.2, T + 0.12, z + 0.75, 0.12, 0.24, 'cyl8');
      st && st.push([x, T + 0.55, z - 0.45], [x, T + 0.55, z + 0.2]);
    },
    steamer(b, x, z, s, T, st) {   // gua bao: the bamboo steamers stacked up, the braised pork, the buns
      b.cyl(VC.solid, '#c8a060', x, T + 0.28, z - 0.4, 0.3, 0.56, 'cyl8'); b.cyl(VC.solid, '#a88048', x, T + 0.21, z - 0.4, 0.31, 0.03, 'cyl8'); b.cyl(VC.solid, '#a88048', x, T + 0.35, z - 0.4, 0.31, 0.03, 'cyl8');
      b.add(G.sphLow, VC.solid, x, T + 0.62, z - 0.4, 0.6, 0.16, 0.6, 0, 0, 0, '#c8a060');
      b.cyl(VC.metal, '#9aa0a8', x - s * 0.1, T + 0.06, z + 0.35, 0.24, 0.12, 'cyl8'); b.cyl(VC.solid, '#6a3014', x - s * 0.1, T + 0.125, z + 0.35, 0.21, 0.01, 'cyl8');
      for (let j = 0; j < 3; j++) b.add(OCT, VC.solid, x - s * 0.2, T + 0.06, z + 0.7 + j * 0.1, 0.18, 0.08, 0.14, 0, 0, 0, '#f4f0e4');
      st && st.push([x, T + 0.7, z - 0.4]);
    },
    tray(b, x, z, s, T) {   // mochi in every colour
      for (let t = 0; t < 2; t++) {
        b.box(VC.solid, '#e8e4dc', x - s * 0.05, T + 0.02, z - 0.45 + t * 0.9, 0.6, 0.04, 0.8);
        for (let j = 0; j < 10; j++) ball(b, VC.solid, pick(['#f4f4f0', '#a8d8a0', '#f0b0c8', '#f0d890', '#8a6a4a']), x - s * 0.05 + rand(-0.24, 0.24), T + 0.1, z - 0.45 + t * 0.9 + rand(-0.32, 0.32), 0.07);
      }
    },
    cane(b, x, z, s, T) {   // sugarcane stood in a bundle, the press, the cups of green juice
      for (let j = 0; j < 8; j++) b.add(G.box, VC.solid, x + s * 0.35 + rand(-0.12, 0.12), T + 0.9, z - 0.7 + rand(-0.2, 0.2), 0.07, 1.8, 0.07, rand(-0.06, 0.06), rand(0, 1), rand(-0.08, 0.08), pick(['#6a3a4a', '#7a4a3a', '#8a8a3a']));
      b.block(VC.metal, '#c8ccd0', x - s * 0.05, T, z - 0.05, 0.5, 0.4, 0.5); b.box(VC.metal, '#5a5e66', x - s * 0.05, T + 0.45, z - 0.05, 0.3, 0.1, 0.3);
      for (let j = 0; j < 5; j++) b.box(VC.glow, hdr('#b8d860', 0.6), x - s * 0.2, T + 0.09, z + 0.4 + j * 0.13, 0.09, 0.18, 0.09);
    },
    fruit(b, x, z, s, T, st, k) {   // fruit piled up under a white tube: pineapples, watermelons, papayas, wax apples, guavas; the cut fruit chilled
      b.box(VC.glow, hdr('#f4fbff', 1.8), x - s * 0.1, T + 1.15, z, 0.05, 0.04, 1.6);
      for (let j = 0; j < 3; j++) { const pz = z - 0.75 + j * 0.24; b.add(G.cone8, VC.solid, x + s * 0.25, T + 0.17, pz, 0.2, 0.34, 0.2, 0, 0, 0, '#d8a030'); b.box(VC.solid, '#3a7a2a', x + s * 0.25, T + 0.4, pz, 0.08, 0.16, 0.08); }
      for (let j = 0; j < 2; j++) ball(b, VC.solid, '#2a5a2a', x + s * 0.2, T + 0.18, z + 0.1 + j * 0.36, 0.18, ICO);
      for (let j = 0; j < 10; j++) ball(b, VC.solid, pick(['#d8202a', '#c8f080', '#f08a2a', '#e8202a', '#b8e070']), x - s * rand(0.05, 0.4), T + 0.08, z - 0.6 + rand(0, 1.4), 0.08);
      if (k === 15) for (let j = 0; j < 4; j++) b.box(VC.glow, hdr('#ffb070', 0.55), x - s * 0.35, T + 0.1, z + 0.4 + j * 0.13, 0.09, 0.2, 0.09);
      else { b.box(VC.glow, hdr('#e8fff4', 0.26), x - s * 0.25, T + 0.12, z + 0.55, 0.36, 0.22, 0.6); for (let j = 0; j < 4; j++) b.box(VC.glow, hdr(pick(['#ff5a3a', '#ffd23d', '#8ae05a', '#ff9a3a']), 0.6), x - s * 0.44, T + 0.1, z + 0.34 + j * 0.14, 0.02, 0.1, 0.1); }
    },
    drinks(b, x, z, s, T) {   // bubble tea: the urns, the sealing machine, a row of cups with their pearls
      for (let j = 0; j < 2; j++) b.cyl(VC.metal, '#c8ccd0', x + s * 0.25, T + 0.3, z - 0.6 + j * 0.4, 0.15, 0.6, 'cyl8');
      b.block(VC.solid, '#f4f4f0', x + s * 0.2, T, z + 0.55, 0.36, 0.5, 0.36); b.box(VC.glow, hdr('#ffd060', 1.0), x - s * 0.0, T + 0.3, z + 0.55, 0.02, 0.08, 0.2);
      for (let j = 0; j < 6; j++) { const cz = z - 0.6 + j * 0.2; b.box(VC.solid, pick(['#c8a070', '#d8b888', '#b88a58', '#e8d0b0']), x - s * 0.3, T + 0.13, cz, 0.1, 0.18, 0.1); b.box(VC.solid, '#1a120c', x - s * 0.3, T + 0.025, cz, 0.105, 0.05, 0.105); }
    },
    ice(b, x, z, s, T) {   // mango shaved ice: the shaver, the bowls heaped up, a crate of mangoes
      b.block(VC.metal, '#c8ccd0', x + s * 0.2, T, z - 0.55, 0.36, 0.55, 0.36); b.cyl(VC.metal, '#8a9098', x + s * 0.2, T + 0.62, z - 0.55, 0.15, 0.08, 'cyl8', Math.PI / 2);
      for (let j = 0; j < 3; j++) { const cz = z - 0.05 + j * 0.3; b.cyl(VC.solid, '#f4f4f0', x - s * 0.2, T + 0.05, cz, 0.12, 0.1, 'cyl8'); ball(b, VC.solid, '#f8b020', x - s * 0.2, T + 0.16, cz, 0.12, ICO); }
      b.block(VC.solid, '#8a5a30', x + s * 0.2, T, z + 0.55, 0.4, 0.16, 0.5);
      for (let j = 0; j < 6; j++) ball(b, VC.solid, pick(['#f8a020', '#e88a1a', '#f0b840']), x + s * 0.2 + rand(-0.12, 0.12), T + 0.2, z + 0.4 + rand(0, 0.3), 0.08);
    },
    tanghulu(b, x, z, s, T) {   // candied strawberries and tomatoes on their sticks, stuck in a bale of straw, shining
      const bx = x + s * 0.05, bz = z - 0.35;
      b.cyl(VC.solid, '#c8a060', bx, T + 0.45, bz, 0.13, 0.9, 'cyl6');
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * Math.PI * 2, y0 = T + 0.35 + (j % 3) * 0.2, dx = Math.cos(a), dz = Math.sin(a);
        beam(b, VC.solid, bx + dx * 0.1, y0, bz + dz * 0.1, bx + dx * 0.4, y0 + 0.2, bz + dz * 0.4, 0.015, '#e8d8b0');
        for (let q = 0; q < 3; q++) ball(b, VC.glow, hdr(j % 4 ? '#e8102a' : '#ff3a1a', 0.85), bx + dx * (0.19 + q * 0.085), y0 + 0.06 + q * 0.055, bz + dz * (0.19 + q * 0.085), 0.058, ICO);
      }
      for (let j = 0; j < 5; j++) for (let q = 0; q < 3; q++) ball(b, VC.glow, hdr('#e8102a', 0.8), x - s * (0.05 + q * 0.11), T + 0.06, z + 0.3 + j * 0.14, 0.055);
    },
    wheel(b, x, z, s, T, st) {   // wheel cakes in their iron moulds, red bean and custard, a stack of them done
      b.block(VC.solid, '#2a2a2e', x, T, z - 0.25, 0.7, 0.1, 1.2);
      for (let j = 0; j < 10; j++) b.cyl(VC.solid, j % 3 ? '#e0a850' : '#3a3a3e', x + (j % 2 ? 0.16 : -0.16), T + 0.11, z - 0.73 + Math.floor(j / 2) * 0.24, 0.09, 0.03, 'cyl6');
      b.cyl(VC.solid, '#d89a48', x - s * 0.15, T + 0.13, z + 0.65, 0.1, 0.25, 'cyl8');
      st && st.push([x, T + 0.2, z - 0.25]);
    },
    squid(b, x, z, s, T, st) {   // whole squid grilling, more hung up on the rail to show you
      trough(b, x, z - 0.3, T);
      for (let j = 0; j < 4; j++) b.add(G.box, VC.solid, x, T + 0.2, z - 0.7 + j * 0.27, 0.42, 0.02, 0.16, 0, 0, 0, '#d8a878');
      b.box(VC.metal, '#5a5e66', x - s * 0.3, T + 1.3, z + 0.1, 0.03, 0.03, 1.6);
      for (let j = 0; j < 4; j++) { const hz = z - 0.5 + j * 0.34; b.add(OCT, VC.solid, x - s * 0.3, T + 1.05, hz, 0.05, 0.42, 0.18, 0, 0, 0, '#e8c8a0'); b.box(VC.solid, '#d8b890', x - s * 0.3, T + 0.74, hz, 0.03, 0.22, 0.14); }
      st && st.push([x, T + 0.3, z - 0.3]);
    },
  };
  // a night-market stall facing the track from side s: the tarp on its poles and the lightbox under it, a bare bulb, the
  // steel cart with its price card and whatever's cooking, the hawker (sometimes two), customers queueing in front.
  // cart: a hawker's push cart under a beach umbrella instead. steam: an array collecting where steam rises.
  K.stall = (b, x, z, s, k = randi(0, STALLS.length - 1), { steam = null, queue = chance(0.2), cart = false } = {}) => {
    const W = 2.2, gear = STALLS[k][3], game = GAMES.has(gear), T = 0.92;
    if (cart) {
      b.add(UMB, VC.solid, x, 2.7, z, 2.3, 1.2, 2.3, 0, rand(0, 1), 0, pick(TARPS));
      b.box(VC.metal, '#8a9098', x + s * 0.3, 1.7, z, 0.04, 3.4, 0.04);
      b.block(VC.solid, '#a9aeb4', x, 0.25, z, 0.8, T - 0.25, 1.6);
      for (const e of [-1, 1]) b.cyl(VC.solid, '#1a1a1a', x, 0.25, z + e * 0.8, 0.25, 0.06, 'cyl8', Math.PI / 2);
      b.box(VC.metal, '#5a5e66', x + s * 0.55, 0.95, z, 0.3, 0.04, 1.2);   // the handle
      b.add(planeUV(K.stallRects[k]), K.stallMat, x - s * 0.41, 0.6, z, 1.5, 0.48, 1, 0, face(s), 0);
      b.box(VC.metal, '#2a2a2e', x, 2.75, z, 0.01, 0.7, 0.01); b.box(VC.glow, hdr('#fff0c8', 2.6), x, 2.35, z, 0.1, 0.12, 0.1);
      GEAR[gear](b, x, z, s, T, steam, k);
      K.vendor(b, x + s * 0.75, z + rand(-0.4, 0.4), s, { hat: pick(['cap', 'scarf', 'towel']) });
      K.pool(b, x - s * 0.6, z, 3, 3, hdr('#fff0d0', 0.14));
      return;
    }
    const col = pick(TARPS);
    for (const dz of [-W / 2, W / 2]) b.box(VC.metal, '#8a9098', x + s * 0.5, 1.4, z + dz, 0.05, 2.8, 0.05);
    b.add(G.box, VC.solid, x, 2.85, z, 2.0, 0.05, W + 0.2, 0, 0, s * 0.12, col);
    b.box(VC.solid, col, x - s * 1.0, 2.7, z, 0.03, 0.26, W + 0.2);
    b.add(planeUV(K.stallRects[k]), K.stallMat, x - s * 0.6, 2.32, z, W - 0.2, 0.62, 1, 0, face(s), 0);
    b.box(VC.glow, hdr('#f4f8ff', 2.2), x - s * 0.2, 2.62, z, 0.06, 0.04, W - 0.4);   // the white tube
    if (!game) {
      const zb = z + pick([-0.55, 0.55]);
      b.box(VC.metal, '#2a2a2e', x - s * 0.15, 2.34, zb, 0.01, 0.4, 0.01); b.box(VC.glow, hdr('#fff0c8', 2.6), x - s * 0.15, 2.08, zb, 0.09, 0.11, 0.09);   // a bare bulb on its flex
      b.block(VC.solid, '#a9aeb4', x, 0, z, 1.0, T, W - 0.2);   // the stainless cart
      b.box(VC.solid, '#d4d8dc', x, T - 0.01, z, 1.04, 0.03, W - 0.16);
      b.box(VC.solid, STALLS[k][1] === '#ffffff' ? STALLS[k][2] : STALLS[k][1], x - s * 0.505, 0.75, z, 0.01, 0.16, W - 0.3);   // a band of the sign's colour along it
      b.add(planeUV(pick(K.priceRects)), K.priceMat, x - s * 0.515, 0.45, z + rand(-0.6, 0.6), 0.4, 0.15, 1, 0, face(s), 0);
      const n0 = steam ? steam.length : 0;
      GEAR[gear](b, x, z, s, T, steam, k);
      if (steam) for (let i = n0; i < steam.length; i++) steam[i][0] -= s * 0.55;   // it billows out from under the tarp's edge
      K.vendor(b, x + s * 0.88, z + rand(-0.45, 0.2), s, { tool: /grill|griddle|wok|corn|squid|wheel/.test(gear) ? pick(['spatula', 'tongs']) : null });
      if (chance(0.15)) K.vendor(b, x + s * 0.88, z + 0.75, s, { hat: 'none', reach: 0.3 });   // the one taking the money
      if (queue) for (let j = randi(1, 3); j > 0; j--) K.person(b, x - s * rand(1.15, 1.45), z + rand(-0.8, 0.8), { umbrella: chance(0.45), phone: chance(0.5), bag: false });
    } else if (gear === 'balloons') {   // darts at a wall of balloons
      b.block(VC.solid, '#1a1a1e', x + s * 0.6, 0, z, 0.2, 2.4, W - 0.2);
      for (let j = 0; j < 30; j++) ball(b, VC.solid, pick(['#ff3d6a', '#3dbfff', '#ffe23d', '#39ff88', '#ff8a2a', '#b26bff', '#ffffff']), x + s * 0.45, 0.7 + (j % 5) * 0.32, z - 0.9 + Math.floor(j / 5) * 0.36, 0.15, ICO);
      b.block(VC.solid, '#c8202c', x - s * 0.6, 0, z, 0.4, 0.95, W - 0.2);
      K.vendor(b, x - s * 0.1, z + 0.7, s, { hat: 'cap', reach: 0.3 });
    } else if (gear === 'goldfish') {   // goldfish scooping: the blue tub, the fish, stools round it
      b.block(VC.solid, '#1a6ad8', x, 0, z, 1.5, 0.4, W - 0.2);
      b.box(VC.glow, hdr('#7ad8ff', 0.8), x, 0.41, z, 1.3, 0.02, W - 0.4);
      for (let j = 0; j < 12; j++) b.box(VC.glow, hdr('#ff7a1a', 1.4), x + rand(-0.5, 0.5), 0.43, z + rand(-0.9, 0.9), 0.08, 0.01, 0.04);
      for (let j = 0; j < 3; j++) K.seated(b, x - s * 1.0, z - 0.7 + j * 0.7, { y: 0.3 });
    } else {   // ring toss (the prizes in rows on the ground) or the pinball boards, both with their prize shelves behind
      b.block(VC.solid, '#2a2a30', x + s * 0.5, 0, z, 0.4, 2.0, W - 0.2);
      for (let j = 0; j < 12; j++) b.box(VC.solid, pick(['#ff3d6a', '#3dbfff', '#ffe23d', '#39ff88', '#f4f4f0', '#ff8ab8']), x + s * 0.25, 0.6 + (j % 3) * 0.55, z - 0.8 + Math.floor(j / 3) * 0.53, 0.3, 0.3, 0.3);
      if (gear === 'pinball') for (const dz of [-0.5, 0.5]) {   // a board on its legs tilted up toward the player, pins and lit pockets
        b.box(VC.solid, '#5a3a24', x - s * 0.35, 0.45, z + dz, 0.08, 0.9, 0.08);
        b.add(G.box, VC.solid, x - s * 0.35, 1.05, z + dz, 0.75, 0.06, 0.8, 0, 0, s * 0.5, '#7a4a2a');
        b.add(G.box, VC.glow, x - s * 0.36, 1.085, z + dz, 0.66, 0.02, 0.7, 0, 0, s * 0.5, hdr('#4a2a8a', 0.8));
        for (let q = 0; q < 6; q++) b.add(G.box, VC.glow, x - s * (0.12 + (q % 3) * 0.17), 1.2 - (q % 3) * 0.09, z + dz - 0.22 + Math.floor(q / 3) * 0.44, 0.05, 0.03, 0.05, 0, 0, s * 0.5, hdr(pick(['#ffe23d', '#39ff88', '#ff3d9a', '#3dd6ff']), 1.6));
      }
      else for (let j = 0; j < 9; j++) b.box(VC.solid, pick(['#ff3d6a', '#3dbfff', '#ffe23d', '#39ff88', '#f4f4f0', '#ff8ab8']), x - s * (0.05 + (j % 3) * 0.3), 0.12, z - 0.7 + Math.floor(j / 3) * 0.7, 0.2, 0.24, 0.2);   // the prizes to throw the rings over
      K.vendor(b, x + s * 0.05, z + 0.85, s, { hat: 'cap', reach: 0.25 });
    }
    K.pool(b, x - s * 1.1, z, 3.6, 3.2, hdr('#fff4e0', 0.14));
    K.wet(b, x - s * 0.6, z, 6, 1.4, hdr('#fff4e0', 0.08));
  };
  // a folding table out in the arcade, the red plastic stools round it, people eating
  K.table = (b, x, z, { n = randi(1, 3), col = pick(['#e8e0d0', '#f4f4f0', '#c8202a', '#3a6aa8']) } = {}) => {
    b.box(VC.solid, col, x, 0.72, z, 0.7, 0.04, 1.0); b.box(VC.metal, '#8a9098', x, 0.36, z, 0.06, 0.72, 0.06);
    for (let j = 0; j < 4; j++) {
      const sx = x + (j % 2 ? 0.55 : -0.55), sz = z + (j < 2 ? -0.3 : 0.3);
      b.cyl(VC.solid, pick(['#d8202a', '#d8202a', '#2a6ad8', '#e8c040']), sx, 0.21, sz, 0.15, 0.42, 'cyl6');
      if (j < n) K.seated(b, sx, sz);
    }
    for (let j = 0; j < n; j++) b.cyl(VC.solid, '#f4f0e8', x + rand(-0.2, 0.2), 0.77, z + rand(-0.3, 0.3), 0.09, 0.06, 'cyl8');   // the bowls
  };
  K.lantern = (b, x, y, z, r = 0.35, col = '#e8202a') => {   // a red lantern, gold caps and tassel, lit inside
    b.add(LANTERN, VC.glow, x, y, z, r * 2, r * 1.7, r * 2, 0, 0, 0, hdr(col, 1.25));
    for (const e of [-1, 1]) b.box(VC.solid, '#d8a830', x, y + e * r * 0.82, z, r * 0.8, 0.07, r * 0.8);
    b.box(VC.solid, '#d8a830', x, y - r * 1.25, z, 0.04, r * 0.7, 0.04);
  };
  K.festoon = (b, z, { y = 7.4, sag = 0.6, w = 10.4, lanterns = false, lr = 0.3 } = {}) => {   // bulbs (or lanterns) strung across the street
    wire(b, -w, y, z, w, y, z, sag, { color: '#1a1a1e', t: 0.03, n: 10 });
    for (let k = 1; k < 16; k++) {
      const t = k / 16, x = -w + 2 * w * t, yy = y - sag * 4 * t * (1 - t);
      if (lanterns && k % 2) K.lantern(b, x, yy - lr * 1.5, z, lr);
      else b.box(VC.glow, hdr(pick(['#ffd28a', '#fff0c0', '#ffb860', '#ff8a6a']), 2.6), x, yy - 0.12, z, 0.16, 0.16, 0.16);
    }
  };
  K.cables = (b, z0, z1, w = 9) => {   // the lanes' tangle of black cables strung between the houses
    for (let k = randi(3, 6); k > 0; k--) {
      const za = -rand(z0, z1), zb = za + rand(-6, 6), y0 = rand(4.6, 7.5);
      wire(b, -w, y0, za, w, y0 + rand(-0.8, 0.8), zb, rand(0.4, 1.2), { color: '#141418', t: 0.03, n: 8 });
    }
  };

  // ---------- the riverside ----------
  // light moving along a strip in dashes (the scooters pouring over a bridge): u runs along the strip in metres
  K.flowMat = (col, speed = 6, k = 2.4) => {
    const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { time: { value: 0 }, speed: { value: speed }, uCol: { value: hdr(col, k) } }]);
    u.uCurveY = curveUniforms.uCurveY; u.uCurveX = curveUniforms.uCurveX;
    const m = new THREE.ShaderMaterial({
      uniforms: u, fog: true, transparent: true, depthWrite: false,
      vertexShader: `uniform float uCurveY, uCurveX; varying vec2 vUv;
        #include <fog_pars_vertex>
        void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); ${CURVE_GLSL} gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform float time, speed; uniform vec3 uCol; varying vec2 vUv;
        #include <fog_pars_fragment>
        void main(){
          float f = fract(vUv.x * 0.31 - time * speed * 0.31 + floor(vUv.y * 3.0) * 0.37);
          float a = smoothstep(0.0, 0.05, f) * smoothstep(0.2, 0.06, f) * (0.6 + 0.4 * fract(sin(floor(vUv.x * 0.31 - time * speed * 0.31) * 91.7) * 437.0));
          gl_FragColor = vec4(uCol, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    });
    K.flows.push(m);
    return m;
  };
  K.flows = [];
  K.muralMat = std({ map: canvasTex(256, 64, (g, w, h) => {   // a children's mural of the river: waves, fish, boats, egrets and a sun, faded by the weather
    g.fillStyle = '#7aa8c0'; g.fillRect(0, 0, w, h); g.fillStyle = '#9ac8a0'; g.fillRect(0, h * 0.7, w, h * 0.3);
    g.strokeStyle = '#f4f4f0'; g.lineWidth = 2; for (let x = 0; x < w; x += 16) { g.beginPath(); g.arc(x + 8, h * 0.68, 7, Math.PI, 0); g.stroke(); }
    g.fillStyle = '#ffd23d'; g.beginPath(); g.arc(rand(20, 60), 16, 9, 0, 7); g.fill();
    for (let k = 0; k < 6; k++) { const x = rand(10, w - 10), y = rand(h * 0.74, h * 0.92); g.fillStyle = pick(['#ff8a3a', '#e8202a', '#ffd23d', '#f4f4f0']); g.beginPath(); g.ellipse(x, y, 6, 3, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 5, y); g.lineTo(x + 10, y - 3); g.lineTo(x + 10, y + 3); g.fill(); }
    for (let k = 0; k < 2; k++) { const x = rand(70, w - 40); g.fillStyle = pick(['#c8202a', '#f4f4f0', '#2a5aa8']); g.fillRect(x, h * 0.5, 26, 7); g.fillStyle = '#f4f4f0'; g.beginPath(); g.moveTo(x + 12, h * 0.5); g.lineTo(x + 12, h * 0.18); g.lineTo(x + 24, h * 0.46); g.fill(); }
    for (let k = 0; k < 3; k++) { const x = rand(40, w - 20), y = rand(10, 26); g.strokeStyle = '#f4f4f0'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 7, y + 3); g.quadraticCurveTo(x, y - 4, x + 7, y + 3); g.stroke(); }
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(60,60,60,${rand(0.05, 0.2).toFixed(2)})`; g.fillRect(rand(0, w), rand(0, h), rand(1, 3), rand(2, 8)); }
  }), roughness: 0.85, emissive: '#ffffff', emissiveIntensity: 0.06 });
  K.headlights = K.flowMat('#fff2d8', 7);
  K.taillights = K.flowMat('#ff3a2a', -6, 2.2);
  K.bikeMat = std({ map: canvasTex(128, 64, (g, w, h) => {   // the riverside path: red asphalt, the yellow centre line, the bike symbols
    g.fillStyle = '#6a2a26'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const v = randi(-20, 20); g.fillStyle = `rgba(${120 + v},${60 + v},${54 + v},0.5)`; g.fillRect(rand(0, w), rand(0, h), 1.5, 1.5); }
    g.fillStyle = '#e8c040'; for (let y = 0; y < h; y += 16) g.fillRect(w / 2 - 1.5, y, 3, 9);
  }), roughness: 0.35, metalness: 0.1 });
  const reflMat = basic({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  K.refl = (b, x, z, len, w, col, { y = WY + 0.04, x0 = EDGE + 16 } = {}) => {   // a light's reflection on the river, drawn out toward the runner
    const dx = -x, dz = 40, d = Math.hypot(dx, dz), L = Math.min(len, ((Math.abs(x) - x0) * d) / Math.abs(dx));
    if (L > 2) b.add(G.plane, reflMat, x + (dx / d) * L / 2, y, z + (dz / d) * L / 2, w, L, 1, -Math.PI / 2, Math.atan2(-dx, -dz), 0, hdr(col, 0.5));
  };
  // the riverside park on side s: the bike path and its lamps, the railing, the grassy bank down to the river
  K.riverside = (b, s, z0 = 0, z1 = 80) => {
    const L = z1 - z0, zc = -(z0 + z1) / 2;
    b.add(G.plane, K.bikeMat, s * (EDGE + 3.4), 0.045, zc, 6.0, L, 1, -Math.PI / 2, 0, 0);
    b.add(G.plane, K.paveMat, s * (EDGE + 0.2), 0.04, zc, 0.8, L, 1, -Math.PI / 2, 0, 0);
    for (let z = z0 + rand(3, 8); z < z1 - 2; z += 16) {   // the path's lamps: short posts with warm globes, doubled in the water
      b.cyl(VC.metal, '#4a4e56', s * (EDGE + 6.8), 1.8, -z, 0.06, 3.6, 'cyl8');
      b.sph(VC.glow, hdr('#ffe0b0', 2.4), s * (EDGE + 6.8), 3.75, -z, 0.24, true);
      K.pool(b, s * (EDGE + 5.6), -z, 6, 6, hdr('#ffd8a0', 0.08));
    }
    const rx = s * (EDGE + 7.4);
    b.box(VC.metal, '#8a9098', rx, 1.1, zc, 0.06, 0.06, L); b.box(VC.metal, '#8a9098', rx, 0.6, zc, 0.05, 0.05, L);
    for (let z = z0; z <= z1 + 0.01; z += 2.4) b.box(VC.metal, '#8a9098', rx, 0.55, -z, 0.07, 1.1, 0.07);
    b.add(G.box, VC.solid, s * (EDGE + 12), (WY + 0.1) / 2, zc, 9.6, 0.2, L, 0, 0, -s * Math.atan2(-WY, 9.4), '#1c2a1e');   // the bank
    b.add(G.plane, K.water, s * (EDGE + 16 + 200), WY, zc, 400, L, 1, -Math.PI / 2, 0, 0);
    for (let k = randi(2, 4); k > 0; k--) b.sph(VC.solid, pick(['#1e3a22', '#24442a']), s * (EDGE + rand(9, 14)), 0.3, -rand(z0 + 3, z1 - 3), rand(0.8, 1.6), true);   // shrubs on the bank
  };
  // across the river: the far bank's lit towers, their long reflections, the expressway's lights along the shore
  K.farShore = (b, s, { x0 = 150, x1 = 210 } = {}) => {
    b.box(VC.solid, '#16181c', s * ((x0 + x1) / 2 + 30), WY - 0.1, -40, x1 - x0 + 60, 2, 80);
    for (let k = randi(6, 9); k > 0; k--) {
      const x = s * rand(x0 + 8, x1), z = -rand(4, 76), tall = chance(0.4), h = tall ? rand(50, 100) : rand(18, 40), w = rand(12, 22), dz = rand(10, 18);
      const T = tall ? [K.office, K.officeMat, 1.5, 3.8] : [pick(K.apts).tex, pick(K.apts).mat, BAY, FH];
      b.addM(buildingGeo(w, h, dz, T[0], T[2], T[3]), T[1], at(x, WY + 0.9, z), pick(['#ffffff', '#c8d8ff', '#ffe0c0', '#e0ffe8', '#d8c8b0']));
      for (let j = 0; j < 4; j++) K.refl(b, x - s * (w / 2 + 1), z + rand(-dz / 2.2, dz / 2.2), rand(36, 80), rand(0.8, 2.0), pick(['#ffd9a0', '#9fd8ff', '#ff9ad5', '#fff0d0', '#a0ffd8', '#ffb060']), { x0: EDGE + 18 });
    }
    b.add(K.tiled2(80, 2), K.headlights, s * (x0 - 7.6), WY + 3.4, -40, 80, 0.4, 1, 0, -s * Math.PI / 2, 0);   // the expressway along the far bank
    b.add(K.tiled2(80, 2), K.taillights, s * (x0 - 7.55), WY + 3.8, -40, 80, 0.4, 1, 0, -s * Math.PI / 2, 0);
    b.box(VC.solid, '#2a2c32', s * (x0 - 6), WY + 2.8, -40, 3, 0.6, 80);
  };
  // a long bridge over the riverside and the river at z, deck high over the path, its piers in the water, streams of
  // scooters' head and tail lights pouring along it
  K.bridge = (b, z, s, { y = 13 } = {}) => {
    const xa = -s * 30, xb = s * 190, L = Math.abs(xb - xa), xc = (xa + xb) / 2;
    b.box(VC.solid, '#3a3e46', xc, y, z, L, 1.4, 14);
    b.box(VC.solid, '#5a5e66', xc, y + 1.2, z + 6.6, L, 1.0, 0.4); b.box(VC.solid, '#5a5e66', xc, y + 1.2, z - 6.6, L, 1.0, 0.4);
    for (let x = Math.min(xa, xb) + 6; x < Math.max(xa, xb); x += 12) b.box(VC.glow, hdr('#ffe0b0', 1.4), x, y - 0.74, z, 0.8, 0.05, 0.4);
    b.add(K.tiled2(Math.round(L), 2), K.headlights, xc, y + 1.0, z + 6.86, L, 0.36, 1, 0, 0, 0);   // seen through the parapet: the scooters' lamps coming, their tail lights going
    b.add(K.tiled2(Math.round(L), 2), K.taillights, xc, y + 1.4, z + 6.84, L, 0.36, 1, 0, 0, 0);
    for (let x = Math.min(xa, xb) + 10; x < Math.max(xa, xb); x += 30) { if (Math.abs(x) < EDGE + 9) continue; b.box(VC.solid, '#2e3238', x, (y + WY) / 2 - 0.5, z, 3, y - WY, 8); }
    for (let x = Math.min(xa, xb) + 4; x < Math.max(xa, xb); x += 14) { b.cyl(VC.metal, '#5a5e66', x, y + 3, z + 6.6, 0.12, 4, 'cyl8'); b.sph(VC.glow, hdr('#ffd8a0', 2.6), x, y + 5.1, z + 6.6, 0.3, true); K.refl(b, x, z + 6, 50, 1.2, '#ffd8a0', { x0: EDGE + 18 }); }
  };
  // the floodwall between the riverside and the city: grey concrete, a gate through it with its number, a mural, the
  // path along its foot; the city's upper floors over the top
  K.floodwall = (b, s, z0 = 0, z1 = 80) => {
    const L = z1 - z0, zc = -(z0 + z1) / 2, x = s * (EDGE + 6.4), gz = -rand(24, 56);
    b.add(G.plane, K.paveMat, s * (EDGE + 3.2), 0.045, zc, 6.0, L, 1, -Math.PI / 2, 0, 0);
    for (const [a, c] of [[z0, -gz - 4], [-gz + 4, z1]]) b.block(VC.solid, '#6a6c6e', x + s * 0.8, 0, -(a + c) / 2, 1.6, 6.6, c - a);
    b.block(VC.solid, '#6a6c6e', x + s * 0.8, 4.6, gz, 1.6, 2.0, 8);
    b.box(VC.solid, '#1a1c20', x + s * 0.9, 2.3, gz, 1.4, 4.6, 7.8);   // the tunnel through it, lit at the far end
    b.box(VC.glow, hdr('#e8f0ff', 0.28), x + s * 1.6, 2.3, gz, 0.04, 4.4, 7.4);
    b.add(G.plane, K.label('5號水門', { w: 512, h: 128, color: '#ffffff', font: HEI, size: 0.66, bg: '#1f4e9a', k: 1.1 }), x - s * 0.02, 5.6, gz, 3, 0.75, 1, 0, -s * Math.PI / 2, 0);
    for (const [a, c] of [[z0 + 1, -gz - 5], [-gz + 5, z1 - 1]]) if (c - a > 4) b.add(K.tiled(Math.max(1, Math.round((c - a) / 10))), K.muralMat, x - s * 0.02, 2.4, -(a + c) / 2, c - a, 2.6, 1, 0, -s * Math.PI / 2, 0);   // the children's mural along it
    for (let z = z0 + rand(4, 10); z < z1 - 2; z += 18) { b.box(VC.glow, hdr('#ffe0b0', 1.4), x - s * 0.06, 5.4, -z, 0.1, 0.2, 0.6); K.pool(b, x - s * 1.6, -z, 4, 4, hdr('#ffd8a0', 0.08)); }
  };

  // ---------- people ----------
  K.person = (b, x, z, { s = rand(0.9, 1.04), y = 0, coat = pick(COATS), phone = chance(0.3), bag = chance(0.25), umbrella = chance(0.42), poncho = chance(0.04), trash = false } = {}) => {
    b.add(G.cyl8, VC.solid, x, y + 0.47 * s, z, 0.27 * s, 0.94 * s, 0.22 * s, 0, 0, 0, pick(TROUSERS));
    if (poncho) b.add(G.cone8, VC.solid, x, y + 1.1 * s, z, 0.7 * s, 1.1 * s, 0.6 * s, 0, 0, 0, pick(['#f0d040', '#2a6ad8', '#c8202a', '#dfe8ee', '#8a5ad8']));
    else {
      b.add(G.cyl8, VC.solid, x, y + 1.0 * s, z, 0.42 * s, 0.48 * s, 0.28 * s, 0, 0, 0, coat);
      b.box(VC.solid, coat, x, y + 1.3 * s, z, 0.43 * s, 0.5 * s, 0.26 * s);
    }
    b.sph(VC.solid, pick(SKIN), x, y + 1.73 * s, z, 0.15 * s, true);
    b.box(VC.solid, pick(HAIR), x, y + 1.82 * s, z - 0.03, 0.3 * s, 0.14 * s, 0.3 * s);
    if (phone) b.box(VC.glow, hdr('#cfe6ff', 1.5), x + 0.06, y + 1.22 * s, z + 0.2 * s, 0.07, 0.12, 0.02);
    if (bag) b.box(VC.solid, pick(['#141414', '#c8a070', '#8a2a1a', '#f4f0e8', '#2a3a5a', '#e8e0f0']), x + 0.27 * s, y + 0.95 * s, z, 0.1, 0.34, 0.32);
    if (trash) b.sph(VC.solid, pick(['#ff9ac0', '#f4b0c8', '#f4f4f0']), x - 0.3 * s, y + 0.7 * s, z + 0.1, 0.2 * s, true);
    if (umbrella) { b.add(UMB, VC.solid, x, y + 1.82 * s, z, 1, 0.7, 1, 0, rand(0, 1), 0, pick(UMBRELLAS)); b.box(VC.metal, '#2a2a2e', x, y + 1.72 * s, z, 0.03, 0.6, 0.03); }
  };
  K.crowd = (b, x0, x1, z0, z1, n, { umbrellaP, ...opts } = {}) => { for (let i = 0; i < n; i++) K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1), umbrellaP === undefined ? opts : { ...opts, umbrella: chance(umbrellaP) }); };
  K.seated = (b, x, z, { y = 0.42 } = {}) => {   // someone on a stool
    b.box(VC.solid, pick(TROUSERS), x, y + 0.12, z, 0.42, 0.14, 0.3);
    b.box(VC.solid, pick(COATS), x, y + 0.5, z, 0.42, 0.56, 0.27);
    b.sph(VC.solid, pick(SKIN), x, y + 0.95, z, 0.15, true);
    b.box(VC.solid, pick(HAIR), x, y + 1.06, z - 0.02, 0.3, 0.12, 0.3);
  };
  K.trashQueue = (b, x, z, s) => {   // waiting at the corner for the garbage truck and its Für Elise, bags in hand
    for (let k = randi(3, 6); k > 0; k--) K.person(b, x + s * rand(-0.4, 0.4), z + rand(-2, 2), { trash: true, umbrella: chance(0.4), phone: chance(0.4) });
  };

  K.update = (t) => {
    K.water.userData.scroll.offset.y = -t * 0.02;
    for (const m of K.flows) m.uniforms.time.value = t;
    K.screen.uniforms.time.value = t;
    K.marquee.map.offset.x = (t * 0.06) % 1;
    K.fallMat.map.offset.y = (t * 0.9) % 1;
    K.walkMat.map.offset.x = Math.floor(t * 5) % 6 / 6;
    K.countMat.map.offset.x = (Math.floor(t) % 30) / 30;
    const on = Math.sin(t * 2.1) > -0.6 || Math.sin(t * 15) > 0.3;   // a lightbox's tube going
    K.vFlick.color.set('#ffffff').multiplyScalar(on ? 0.92 : 0.2);
    const CH = ['#ff3d9a', '#39ff88', '#3da8ff', '#ffe23d'], ph = Math.floor(t * 4);
    K.chase.forEach((m, k) => m.color.set(CH[(ph + k) % CH.length]).multiplyScalar(2.2));
    K.flames.forEach((m, k) => m.color.setScalar(1.15 + 0.3 * Math.sin(t * (23 + k * 7) + k) + 0.2 * Math.sin(t * (41 - k * 9))));
    for (const m of K.steams) m.userData.update(t);
  };
  return K;
}
