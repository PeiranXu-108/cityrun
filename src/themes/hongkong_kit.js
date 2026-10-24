// Hong Kong street kit for a clear winter night. Tong lau and 1960s composite buildings in faded mosaic tile, crowded with
// air-conditioners, window cages and laundry poles over their shopfronts (roast meats, goldsmiths, pharmacies, dried
// seafood, cha chaan tengs, fruit stalls under red lamps, goldfish in their bags) and painted fascias; the great neon
// signs hung out over the street on their steel frames, rooftop billboards, bamboo scaffolding in green netting; verandah
// shophouses and tram wires in the Western District, Central's glass towers, footbridges and LED screens, public housing
// estates, the night markets' stalls and dai pai dongs, the harbourfront with the Star Ferry and a red-sailed junk;
// red taxis, minibuses, double-deckers, the kerbside railings, amber lamps and the crowds.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, planeUV, buildingGeo, windowTex, roundRect, shade, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { EDGE, at, facadeMat, waterMat, screenMat, screenTint } from './common.js';
import { beam, wire } from './tokyo_kit.js';
import { hongkongTreeKit } from './trees.js';
import { puffs } from './taipei_towers.js';

// Hong Kong's own type: Chiron Sung HK for the signboards, Chiron Hei HK for the modern ones, a kaishu for the temples
export const SUNG = '"Chiron Sung HK", "Noto Serif TC", "Songti TC", "PMingLiU", serif';
export const HEI = '"Chiron Hei HK", "Noto Sans TC", "PingFang HK", "PingFang TC", "Microsoft JhengHei", sans-serif';
export const KAI = '"LXGW WenKai TC", "Kaiti TC", "BiauKai", "DFKai-SB", serif';
export const NEON = { red: '#ff2d3a', pink: '#ff4fa8', mag: '#ff3df0', cyan: '#3dfff0', blue: '#3da8ff', green: '#39ff88', yellow: '#ffe23d', orange: '#ff9a2a', white: '#fff2d8', purple: '#b26bff' };
export const WY = -1.6;                      // the harbour, below the promenade
export const GF = 4.6, FH = 3.0, BAY = 2.4;  // ground-floor height, storey height, window bay
const FLUO = ['#eaf6ff', '#e2fbef', '#f4fbff', '#e6f0ff', '#f0fff4'];   // the cool white tubes lighting most flats
const WARMW = ['#ffe2b0', '#ffd496', '#fff0d0', '#ffc878'];
const OFFICE = ['#e8f2ff', '#d8e8ff', '#f4f8ff', '#cfe0f0', '#fff4e0'];
const WALLS = ['#c8c8c2', '#a8bcae', '#a4b4c4', '#c8b0a8', '#c8bfa4', '#b0c0a0', '#c4a8b0', '#b4b8be', '#ccc4a0', '#a4bcb6', '#bcae9c', '#d4d2ca', '#98a4a0'];
export const COATS = ['#1a1a1e', '#2a2a32', '#3a3a44', '#e8e8ec', '#c8c0b0', '#2a3a5a', '#5a1a20', '#8a8a92', '#1f2a44', '#d8d0c0', '#4a3a30', '#c8202c', '#f0e8d8', '#2a4a3a', '#e8c040', '#6a7a9a'];
const TROUSERS = ['#1c1c22', '#2a3a5a', '#3a3a40', '#d8d0c0', '#4a4a52', '#1a2030', '#5a6a8a'];
export const SKIN = ['#f0d0b0', '#e8c4a0', '#dcb08a', '#c8946a', '#f4dcc4', '#a87a5a'];
const HAIR = ['#141414', '#1a1410', '#141414', '#2a1e16', '#3a2a1e', '#5a3a24', '#8a6a4a', '#c8c0b8'];
const LAUNDRY = ['#f4f4f0', '#e8e8ff', '#c8202c', '#1f5aa8', '#f0d040', '#2a8a5a', '#f0a0c0', '#1a1a1e', '#8a8a92', '#ff8a3a', '#a0d0f0'];
const TARPS = ['#c8202c', '#1f5aa8', '#2a7a4a', '#e8b020', '#e86a1a', '#7a3aa8', '#e8e8e0', '#2a8ab8'];
const LANTERN = new THREE.SphereGeometry(0.5, 10, 7);
const ICO = new THREE.IcosahedronGeometry(0.5, 0), OCT = new THREE.OctahedronGeometry(0.5);   // heads, fruit, bulbs: few faces where many are needed
const mix = (a, b2, k) => '#' + new THREE.Color(a).lerp(new THREE.Color(b2), k).getHexString();
export const KERB = EDGE + 3.1;   // a lane of road runs beside the track to the kerb; the pavement lies beyond it
const LANE = KERB - EDGE - 0.2;

// ---------- signs ----------
// vertical boxes hung out over the street: [text, colour, border, style]
const V_NEON = [
  ['大押', 'red', 'yellow', 'pawn'], ['酒家', 'red', 'yellow'], ['茶餐廳', 'yellow', 'red'], ['冰室', 'cyan', 'pink'], ['金行', 'yellow', 'red', 'box'],
  ['藥房', 'green', 'white'], ['涼茶', 'orange', 'yellow'], ['燒臘', 'red', 'orange', 'box'], ['麻雀', 'pink', 'cyan'], ['時裝', 'mag', 'blue'],
  ['鐘錶', 'blue', 'white', 'box'], ['眼鏡', 'cyan', 'blue'], ['找換', 'green', 'yellow'], ['跌打', 'white', 'red', 'box'], ['賓館', 'pink', 'purple'],
  ['酒店', 'white', 'red'], ['桌球', 'green', 'pink'], ['蛇王', 'yellow', 'green'], ['甜品', 'pink', 'yellow'], ['海鮮', 'blue', 'red'],
  ['粥麵', 'orange', 'red', 'box'], ['餅家', 'yellow', 'orange'], ['中藥', 'red', 'yellow', 'box'], ['參茸', 'purple', 'yellow'], ['電器', 'cyan', 'white'],
  ['茶樓', 'red', 'green'], ['火鍋', 'orange', 'pink'], ['牙科', 'white', 'blue', 'box'], ['補習', 'blue', 'yellow', 'box'], ['雀館', 'mag', 'green'],
  ['夜市', 'pink', 'yellow'], ['士多', 'green', 'red', 'box'],
];
// horizontal boards: [name, colour, border, style, English]
const H_NEON = [
  ['新興大押', 'red', 'yellow', 'pawn', 'PAWN'], ['龍門酒家', 'red', 'yellow', 'neon', 'RESTAURANT'], ['好運茶餐廳', 'yellow', 'red', 'neon', 'CAFÉ'],
  ['金寶珠寶', 'yellow', 'pink', 'box', 'JEWELLERY'], ['永泰藥房', 'green', 'white', 'neon', 'PHARMACY'], ['雀館', 'pink', 'green', 'neon', 'MAHJONG'],
  ['東方桌球', 'green', 'cyan', 'neon', 'BILLIARDS'], ['卡拉OK', 'mag', 'blue', 'neon', 'KARAOKE'], ['酒吧', 'blue', 'pink', 'neon', 'BAR'],
  ['海鮮酒家', 'blue', 'red', 'neon', 'SEAFOOD'], ['萬年時裝', 'mag', 'yellow', 'neon', 'FASHION'], ['萬利找換', 'green', 'yellow', 'neon', 'MONEY EXCHANGE'],
  ['旺角', 'cyan', 'pink', 'neon', 'MONG KOK'], ['香港', 'red', 'cyan', 'neon', 'HONG KONG'], ['金城鐘錶', 'blue', 'white', 'box', 'WATCHES'],
  ['明星眼鏡', 'cyan', 'blue', 'neon', 'OPTICAL'], ['甜蜜蜜甜品', 'pink', 'yellow', 'neon', 'DESSERT'], ['蛇王林', 'yellow', 'green', 'neon', 'SNAKE SOUP'],
  ['火鍋', 'orange', 'red', 'neon', 'HOT POT'], ['光明電器', 'cyan', 'white', 'neon', 'ELECTRONICS'], ['大利粥麵', 'orange', 'yellow', 'box', 'CONGEE'],
  ['新華賓館', 'pink', 'purple', 'neon', 'GUEST HOUSE'], ['夜總會', 'purple', 'mag', 'neon', 'NIGHT CLUB'], ['彌敦道', 'white', 'blue', 'neon', 'NATHAN ROAD'],
];
// shop fascias: [name, board, letters]
const BOARDS = [
  ['福記燒臘', '#8a1010', '#ffd86a'], ['金寶珠寶金行', '#c8101e', '#ffe08a'], ['永泰藥房', '#f4f4f0', '#1a7a3a'], ['利源海味', '#2a1a10', '#f0c860'],
  ['光明電器', '#103a8a', '#ffffff'], ['好運茶餐廳', '#f4e8c8', '#c8101e'], ['新香園餅家', '#7a1010', '#ffe8a0'], ['萬年時裝', '#141418', '#ffd0e8'],
  ['鴻發生果', '#1a5a2a', '#ffe23d'], ['百福涼茶', '#5a2a10', '#ffd86a'], ['保和堂藥材', '#1a1a1a', '#e8c060'], ['水族金魚', '#0a4a7a', '#ffffff'],
  ['雄記雲吞麵', '#f0e0b0', '#8a1010'], ['新興大押', '#1a1a1a', '#ffd23d'], ['甜蜜蜜甜品', '#ff8ab8', '#ffffff'], ['萬利找換', '#0a5a3a', '#ffe23d'],
  ['明星眼鏡', '#0a2a5a', '#ffffff'], ['金城鐘錶', '#1a1a1a', '#f0d080'], ['大利粥麵', '#c8101e', '#ffffff'], ['美華士多', '#e8d020', '#c8101e'],
  ['新華書局', '#2a3a2a', '#f0e8c0'], ['勝利跌打', '#f4f0e0', '#c8101e'], ['龍門酒家', '#8a1010', '#ffd86a'], ['港島茶樓', '#1a3a1a', '#ffd86a'],
];
const STREETS = [['彌敦道', 'NATHAN ROAD'], ['廟街', 'TEMPLE STREET'], ['德輔道西', 'DES VOEUX ROAD WEST'], ['皇后大道中', "QUEEN'S ROAD CENTRAL"], ['軒尼詩道', 'HENNESSY ROAD'], ['通菜街', 'TUNG CHOI STREET'],
  ['西洋菜南街', 'SAI YEUNG CHOI STREET SOUTH'], ['上海街', 'SHANGHAI STREET'], ['砵蘭街', 'PORTLAND STREET'], ['花園街', 'FA YUEN STREET'], ['干諾道中', 'CONNAUGHT ROAD CENTRAL'], ['金巴利道', 'KIMBERLEY ROAD'],
  ['東角道', 'EAST POINT ROAD'], ['怡和街', 'YEE WO STREET'], ['春秧街', 'CHUN YEUNG STREET'], ['黃泥涌道', 'WONG NAI CHUNG ROAD'], ['英皇道', "KING'S ROAD"], ['波斯富街', 'PERCIVAL STREET'],
  ['亞皆老街', 'ARGYLE STREET'], ['山東街', 'SHANTUNG STREET'], ['登打士街', 'DUNDAS STREET'], ['奶路臣街', 'NELSON STREET'], ['閣麟街', 'COCHRANE STREET'], ['砵典乍街', 'POTTINGER STREET']];
export const STREET = { qrc: 3, eastPoint: 12, yeeWo: 13, chunYeung: 14, wongNaiChung: 15, kings: 16, percival: 17, cochrane: 22, pottinger: 23 };
export const SIDE_STREETS = [0, 4, 5, 6, 7, 8, 9, 11, 18, 19, 20, 21];   // the Kowloon streets a junction's plate may name
const UPPER = [   // the upper-floor shops' lightboxes across their windows: [name, English, ground, ink]
  ['髮型屋', 'HAIR SALON', '#f4f4f0', '#c8101e'], ['按摩足浴', 'FOOT MASSAGE', '#ffd23d', '#8a1010'], ['補習中心', 'TUTORIAL CENTRE', '#1f5aa8', '#ffffff'],
  ['牙科診所', 'DENTAL CLINIC', '#f4f8ff', '#1f5aa8'], ['西醫診所', 'MEDICAL CLINIC', '#ffffff', '#1a7a3a'], ['卡拉OK', 'KARAOKE', '#5a2a8a', '#ffe8ff'],
  ['健身中心', 'FITNESS', '#141418', '#39ff88'], ['旅行社', 'TRAVEL AGENCY', '#e86a1a', '#ffffff'], ['麻雀耍樂', 'MAHJONG', '#1a5a2a', '#ffe23d'],
  ['眼科中心', 'EYE CENTRE', '#0a2a5a', '#ffffff'], ['律師行', 'SOLICITORS', '#2a2a30', '#f0d080'], ['樓上書店', 'BOOKSHOP', '#f0e8c0', '#2a3a2a'],
  ['影樓', 'PHOTO STUDIO', '#c8202c', '#ffffff'], ['美甲', 'NAIL BAR', '#ff8ab8', '#ffffff'], ['裝修工程', 'RENOVATION', '#ffd23d', '#141414'], ['駕駛學院', 'DRIVING SCHOOL', '#1a3a8a', '#ffe23d'],
];
const SNACKS = [   // the street-food counters' boards: [name, English, ground, ink]
  ['雞蛋仔', 'EGG WAFFLES', '#ffd23d', '#c8101e'], ['咖喱魚蛋', 'CURRY FISH BALLS', '#ff8a1a', '#ffffff'], ['燒賣', 'SIU MAI', '#ffe08a', '#8a1010'],
  ['車仔麵', 'CART NOODLES', '#c8101e', '#ffe08a'], ['臭豆腐', 'STINKY TOFU', '#2a2a2a', '#ffd23d'], ['碗仔翅', 'STREET SOUP', '#5a2a10', '#ffe0a0'],
  ['格仔餅', 'WAFFLES', '#ffb0d0', '#8a1040'], ['糖炒栗子', 'ROAST CHESTNUTS', '#3a1a10', '#ffb04a'],
];
const ADS = [   // the LED screens: [headline, line, colours, icon, ink]
  ['城市酷跑', 'CITY DASH', ['#ff3df0', '#3d6bff'], 'bolt'], ['港式奶茶', 'SILKY MILK TEA', ['#c87a2a', '#4a1e0a'], 'cup'], ['點心', 'DIM SUM 24 HRS', ['#d8202a', '#ff8a3a'], 'steamer'],
  ['大減價', 'SALE 50% OFF', ['#141414', '#3a0a0a'], 'bar', '#ffe23d'], ['演唱會', 'LIVE TONIGHT', ['#3a1a8a', '#ff3df0'], 'stars'], ['維港夜色', 'HARBOUR NIGHTS', ['#0a1a4a', '#2a4a9a'], 'skyline'],
  ['菠蘿包', 'PINEAPPLE BUN', ['#ffb020', '#ff6a1a'], 'bun'], ['新手機', 'NEW PHONE', ['#f2f4ff', '#a9b8ff'], 'phone', '#141414'],
];
export const TRAM_ADS = [   // the trams' body ads: [name, line, ground, ink, art]
  ['香港電車', 'HONG KONG TRAMWAYS', '#1e5a3a', '#f4ecd0', 'classic'], ['港式奶茶', 'SILKY MILK TEA', '#d8782a', '#ffffff', 'cup'], ['點心', 'DIM SUM ALL DAY', '#c8202a', '#ffe8a0', 'steamer'],
  ['雞蛋仔', 'EGG WAFFLES', '#ffd23d', '#c8202a', 'waffle'], ['城市酷跑', 'CITY DASH', '#e83ae0', '#ffffff', 'bolt'], ['維港夜遊', 'HARBOUR CRUISE', '#14285a', '#ffd86a', 'boat'],
  ['菠蘿油', 'PINEAPPLE BUN', '#f4a020', '#5a2a10', 'bun'], ['香港電車', 'DING DING', '#1e5a3a', '#f4ecd0', 'classic'],
];
const DESTS = [['跑馬地', 'HAPPY VALLEY'], ['筲箕灣', 'SHAU KEI WAN'], ['堅尼地城', 'KENNEDY TOWN'], ['北角', 'NORTH POINT'], ['上環', 'SHEUNG WAN'], ['銅鑼灣', 'CAUSEWAY BAY']];
// everything else the Hong Kong canvases write, so the web fonts can be fetched for exactly these glyphs first
const EXTRA = '恒指押廟街天后古廟彩虹邨寶蓮禪寺天壇大佛凌霄閣山頂纜車太平山尖沙咀鐘樓天星小輪碼頭中環金紫荆廣場灣仔會議展覽中心匯豐銀行中國銀行昂坪電車站往碼頭睇相算命掌相占卜大笪地粵劇小心碰頭前面修路施工中請勿靠近的士香港電車叮叮港鐵東涌線荃灣線觀塘線月台入口出口籃球場遊樂場邨市場茶果嶺天后宮福德祠風調雨順國泰民安普渡眾生萬佛同歸彌勒佛韋馱十二神將山門蓮花香火紅磡九龍維多利亚港香港島山頂纜車站登山必經之路金紫荊紫荆' +
  '樓望右望左旺角站銅鑼灣站北角站太古站油麻地佐敦崇光百貨時代廣場跑馬地馬場第七場米獨贏投注站益昌大廈中環街市至半山自動扶梯–';
export const GLYPHS = [...new Set([V_NEON.map((e) => e[0]), H_NEON.map((e) => e[0]), BOARDS.map((e) => e[0]), STREETS.map((e) => e[0]), ADS.map((e) => e[0]), TRAM_ADS.map((e) => e[0]), DESTS.map((e) => e[0]),
  UPPER.map((e) => e[0]), SNACKS.map((e) => e[0]), EXTRA].flat().join(''))].join('');

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
function bat(g, cx, cy, s, col) {   // the pawnbroker's bat (蝠, a pun on 福, fortune) with the coin hanging from its mouth
  g.save(); g.translate(cx, cy); g.scale(s, s);
  g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 10;
  g.beginPath(); g.moveTo(0, -4); g.bezierCurveTo(10, -16, 26, -18, 40, -8);
  g.quadraticCurveTo(33, -6, 31, 2); g.quadraticCurveTo(25, -2, 21, 6); g.quadraticCurveTo(16, 1, 11, 8); g.quadraticCurveTo(6, 4, 0, 9);
  g.quadraticCurveTo(-6, 4, -11, 8); g.quadraticCurveTo(-16, 1, -21, 6); g.quadraticCurveTo(-25, -2, -31, 2); g.quadraticCurveTo(-33, -6, -40, -8);
  g.bezierCurveTo(-26, -18, -10, -16, 0, -4); g.fill();
  g.beginPath(); g.moveTo(-5, -6); g.lineTo(-7, -14); g.lineTo(-1, -8); g.moveTo(5, -6); g.lineTo(7, -14); g.lineTo(1, -8); g.fill();
  g.shadowColor = '#ffd23d'; g.fillStyle = '#ffd23d'; g.beginPath(); g.arc(0, 22, 11, 0, 7); g.fill();
  g.shadowBlur = 0; g.fillStyle = '#0b0a12'; g.fillRect(-3.5, 18.5, 7, 7); g.fillStyle = '#ffd23d'; g.fillRect(-0.8, 8, 1.6, 4);
  g.restore();
}
function drawNeon(g, [text, cn, bn, style = 'neon', en], w, h, vertical) {
  const col = NEON[cn], bcol = NEON[bn], box = style === 'box', pawn = style === 'pawn';
  g.fillStyle = '#0b0a12'; g.fillRect(0, 0, w, h);
  if (box) {   // a lightbox: the translucent face lit from inside, the letters painted on
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, col); gr.addColorStop(1, shade(col, 0.74));
    g.fillStyle = gr; roundRect(g, 5, 5, w - 10, h - 10, 6); g.fill();
    g.strokeStyle = bcol; g.lineWidth = 4; roundRect(g, 10, 10, w - 20, h - 20, 5); g.stroke();
  } else tube(g, 10, 10, w - 20, h - 20, bcol);
  const ink = box ? (cn === 'white' || cn === 'yellow' ? '#c8101e' : '#fffaf0') : col;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (vertical) {
    let top = 18;
    if (pawn) { bat(g, w / 2, h * 0.1, w / 96, col); top = h * 0.25; }
    const chars = [...text], n = chars.length, size = Math.min(w * 0.72, ((h - 18 - top) / n) * 0.94);
    g.font = `900 ${Math.floor(size)}px ${SUNG}`;
    chars.forEach((c, k) => glyph(g, c, w / 2, top + ((h - 18 - top) * (k + 0.5)) / n + size * 0.04, size, ink, !box));
  } else {
    const x0 = pawn ? h * 0.75 : 0, cx = (w + x0) / 2, size = Math.min(h * 0.5, ((w - x0 - 50) / [...text].length) * 0.98);
    if (pawn) bat(g, h * 0.46, h * 0.36, h / 110, col);
    g.font = `900 ${Math.floor(size)}px ${SUNG}`;
    glyph(g, text, cx, en ? h * 0.42 : h / 2 + 3, size, ink, !box, w - x0 - 40);
    if (en) { g.font = `700 ${Math.floor(h * 0.15)}px ${HEI}`; glyph(g, en, cx, h * 0.77, h * 0.15, box ? ink : bcol, !box, w - x0 - 50); }
  }
}
function atlas(entries, cw, ch, cols, draw) {
  const rows = Math.ceil(entries.length / cols), W = cw * cols, H = ch * rows;
  const tex = canvasTex(W, H, (g) => entries.forEach((e, i) => { g.save(); g.translate((i % cols) * cw, Math.floor(i / cols) * ch); draw(g, e, cw, ch, i); g.restore(); }), { repeat: false });
  const rects = entries.map((_, i) => { const c = i % cols, r = Math.floor(i / cols); return { u0: c / cols + 1 / W, u1: (c + 1) / cols - 1 / W, v0: 1 - (r + 1) / rows + 1 / H, v1: 1 - r / rows - 1 / H }; });
  return { tex, rects };
}

// ---------- facades ----------
// tong lau and composite buildings: mosaic tiles between the floor slabs, aluminium windows (barred in some), grime running
// down from the sills. A cell is one window bay by one storey. win 0: sliding panes under a transom, 1: a wide strip of
// four panes, 2: barred throughout.
function tongTex({ cols = 4, rows = 6, cw = 40, ch = 50, litChance = 0.5, win = 0 } = {}) {
  const W = cols * cw, H = rows * ch, n = cols * rows, cells = [], bars = [], altar = [];
  for (let r = 0; r < rows; r++) {
    const rl = Math.random() < 0.12 ? 0.9 : litChance;
    for (let c = 0; c < cols; c++) { cells.push(Math.random() < rl ? (Math.random() < 0.75 ? pick(FLUO) : pick(WARMW)) : null); bars.push(win === 2 || Math.random() < 0.2); altar.push(Math.random() < 0.07); }
  }
  const R = (c, r) => (win === 1 ? [c * cw + 4, r * ch + 12, cw - 8, ch - 24] : [c * cw + 8, r * ch + 10, cw - 16, ch - 20]);
  const frames = (g, i, x, y, w, h, col) => {
    g.strokeStyle = col; g.lineWidth = 1.4; g.beginPath();
    g.moveTo(x, y + h * 0.3); g.lineTo(x + w, y + h * 0.3);
    const np = win === 1 ? 4 : 2;
    for (let k = 1; k < np; k++) { g.moveTo(x + (w * k) / np, y + h * 0.3); g.lineTo(x + (w * k) / np, y + h); }
    g.stroke();
    if (bars[i]) { g.lineWidth = 0.8; g.beginPath(); for (let k = 3; k < w; k += 3.5) { g.moveTo(x + k, y); g.lineTo(x + k, y + h); } g.stroke(); }
  };
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(80,70,60,0.08)';
    for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
    for (let x = 0; x < W; x += 4) g.fillRect(x, 0, 1, H);
    for (let r = 0; r < rows; r++) { g.fillStyle = 'rgba(206,202,192,0.95)'; g.fillRect(0, r * ch + ch - 6, W, 6); g.fillStyle = 'rgba(70,60,50,0.3)'; g.fillRect(0, r * ch + ch - 1, W, 1); }
    for (let i = 0; i < n * 1.6; i++) {
      const x = rand(0, W), y = rand(0, H), len = rand(8, 46), gr = g.createLinearGradient(0, y, 0, y + len);
      gr.addColorStop(0, `rgba(${pick(['70,58,44', '110,70,40', '50,50,50'])},${rand(0.12, 0.3).toFixed(2)})`); gr.addColorStop(1, 'rgba(60,50,40,0)');
      g.fillStyle = gr; g.fillRect(x, y, rand(1.5, 4.5), len);
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r), i = r * cols + c;
      g.fillStyle = '#c4c8cc'; g.fillRect(x - 2, y - 2, w + 4, h + 4);
      g.fillStyle = '#12161e'; g.fillRect(x, y, w, h);
      frames(g, i, x, y, w, h, '#aeb4ba');
      g.fillStyle = 'rgba(236,234,226,0.95)'; g.fillRect(x - 3, y + h + 2, w + 6, 2);
    }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r), i = r * cols + c, col = cells[i];
      if (col) {
        const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, col); gr.addColorStop(1, shade(col, 0.62));
        g.fillStyle = gr; g.fillRect(x, y, w, h);
        if (Math.random() < 0.45) { g.fillStyle = pick(['rgba(40,60,120,0.6)', 'rgba(140,40,60,0.5)', 'rgba(150,120,40,0.5)', 'rgba(20,20,20,0.7)', 'rgba(60,120,80,0.5)']); g.fillRect(x + (Math.random() < 0.5 ? 0 : w * 0.5), y, w * 0.5, h); }
        frames(g, i, x, y, w, h, '#000');
      }
      if (altar[i]) { g.fillStyle = '#ff2a14'; g.fillRect(x + w * 0.32, y + h - 7, w * 0.36, 5); }   // the red lamp of a family altar
    }
  });
  return { map, emissive, cols, rows };
}
// public housing and the "monster" blocks: small windows packed tight, the air-conditioners and drying racks drawn in
function denseTex() {
  const cols = 6, rows = 8, cw = 30, ch = 42, W = cols * cw, H = rows * ch, cells = [], ac = [];
  for (let i = 0; i < cols * rows; i++) { cells.push(Math.random() < 0.58 ? (Math.random() < 0.8 ? pick(FLUO) : pick(WARMW)) : null); ac.push(Math.random()); }
  const R = (c, r) => [c * cw + 6, r * ch + 8, cw - 12, ch - 22];
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = '#f0eee8'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) { g.fillStyle = 'rgba(186,182,174,0.95)'; g.fillRect(0, r * ch + ch - 5, W, 5); }
    for (let c = 0; c <= cols; c++) { g.fillStyle = 'rgba(160,156,148,0.6)'; g.fillRect(c * cw - 1, 0, 2, H); }
    for (let i = 0; i < 90; i++) { const x = rand(0, W), y = rand(0, H), len = rand(6, 30), gr = g.createLinearGradient(0, y, 0, y + len); gr.addColorStop(0, 'rgba(70,60,48,0.25)'); gr.addColorStop(1, 'rgba(70,60,48,0)'); g.fillStyle = gr; g.fillRect(x, y, 2, len); }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r), q = ac[r * cols + c];
      g.fillStyle = '#b8bcc0'; g.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
      g.fillStyle = '#12161e'; g.fillRect(x, y, w, h);
      g.strokeStyle = '#a8aeb4'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.stroke();
      if (q < 0.5) { g.fillStyle = '#d8dad6'; g.fillRect(x + 1, y + h + 3, w * 0.7, 8); g.fillStyle = '#6a6e70'; g.fillRect(x + 3, y + h + 5, w * 0.5, 4); }   // an air-conditioner
      else if (q < 0.72) { g.strokeStyle = '#8a7a5a'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 4, y + h + 5); g.lineTo(x + w + 4, y + h + 2); g.stroke(); for (let k = 0; k < 4; k++) { g.fillStyle = pick(LAUNDRY); g.fillRect(x - 2 + k * 5, y + h + 4, 3.5, rand(5, 9)); } }   // laundry
    }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r), col = cells[r * cols + c];
      if (!col) continue;
      g.fillStyle = col; g.fillRect(x, y, w, h);
      if (Math.random() < 0.4) { g.fillStyle = 'rgba(30,40,70,0.55)'; g.fillRect(x, y, w / 2, h); }
      g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.stroke();
    }
  });
  return { map, emissive, cols, rows };
}
// the shophouses' upper floors behind their verandahs: tall French doors between green louvred shutters
function verandahTex() {
  const cols = 4, rows = 3, cw = 32, ch = 44, W = cols * cw, H = rows * ch, cells = [];
  for (let i = 0; i < cols * rows; i++) cells.push(Math.random() < 0.55 ? pick(WARMW) : null);
  const R = (c, r) => [c * cw + 10, r * ch + 9, cw - 20, ch - 9];
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = '#f2ecdc'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(140,120,90,${rand(0.04, 0.1).toFixed(2)})`; g.beginPath(); g.ellipse(rand(0, W), rand(0, H), rand(6, 16), rand(4, 12), 0, 0, 7); g.fill(); }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r);
      g.fillStyle = '#e8e0cc'; g.fillRect(x - 2, y - 3, w + 4, h + 3);
      g.fillStyle = '#14161c'; g.fillRect(x, y, w, h);
      g.strokeStyle = '#d8d0bc'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + 8); g.lineTo(x + w, y + 8); g.stroke();
      for (const sx of [x - w / 2 - 2, x + w + 2]) { g.fillStyle = '#2f6a4a'; g.fillRect(sx, y, w / 2, h); g.fillStyle = 'rgba(0,0,0,0.3)'; for (let yy = y + 1; yy < y + h; yy += 2.5) g.fillRect(sx, yy, w / 2, 0.8); }
    }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r), col = cells[r * cols + c];
      if (!col) continue;
      g.fillStyle = col; g.fillRect(x, y, w, h);
      g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + 8); g.lineTo(x + w, y + 8); g.stroke();
    }
  });
  return { map, emissive, cols, rows };
}

// ---------- shop windows: one display per row, so a window can tile its row along its length ----------
const WIN = { roast: 0, gold: 1, pharmacy: 2, seafood: 3, electronics: 4, cafe: 5, bakery: 6, fashion: 7, fruit: 8, herbal: 9, medicine: 10, shutter: 11, goldfish: 12, noodles: 13, pawn: 14, dessert: 15 };
const NWIN = 16;
function shopWinTex() {
  const RW = 256, RH = 64;
  return canvasTex(RW, RH * NWIN, (g) => {
    const shelf = (y0, ys, col = 'rgba(80,60,40,0.85)') => { g.fillStyle = col; for (const y of ys) g.fillRect(0, y0 + y, RW, 2.5); };
    const bg = (y0, a, b2) => { const gr = g.createLinearGradient(0, y0, 0, y0 + RH); gr.addColorStop(0, a); gr.addColorStop(1, b2); g.fillStyle = gr; g.fillRect(0, y0, RW, RH); };
    const dot = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    for (let r = 0; r < NWIN; r++) {
      const y0 = r * RH;
      if (r === WIN.roast) {   // glazed geese and ducks on their hooks, strips of char siu, the chopping block
        bg(y0, '#fff6e0', '#ffc878');
        g.fillStyle = 'rgba(255,255,255,0.4)'; for (let x = 0; x < RW; x += 8) g.fillRect(x, y0, 1, 30);
        g.fillStyle = '#7a7e84'; g.fillRect(0, y0 + 5, RW, 2);
        for (let x = 12; x < RW; x += 21) {
          g.fillStyle = '#5a5e64'; g.fillRect(x - 0.5, y0 + 6, 1, 6);
          const gr = g.createLinearGradient(x - 8, 0, x + 8, 0); gr.addColorStop(0, '#5a1e08'); gr.addColorStop(0.45, '#c86a20'); gr.addColorStop(1, '#4a1806');
          g.fillStyle = gr; g.beginPath(); g.moveTo(x, y0 + 11); g.quadraticCurveTo(x + 10, y0 + 22, x + 7, y0 + 38); g.quadraticCurveTo(x, y0 + 45, x - 7, y0 + 38); g.quadraticCurveTo(x - 10, y0 + 22, x, y0 + 11); g.fill();
          g.fillStyle = 'rgba(255,230,170,0.55)'; g.fillRect(x - 3, y0 + 19, 2, 10);
          g.fillStyle = pick(['#a0201a', '#8a1a14', '#b82a1e']); g.fillRect(x + 9, y0 + 8, 3, rand(14, 24));
        }
        g.fillStyle = '#c8a070'; g.fillRect(0, y0 + 50, RW, 9);
        g.fillStyle = 'rgba(120,80,40,0.6)'; for (let x = 30; x < RW; x += 64) { g.beginPath(); g.ellipse(x, y0 + 50, 16, 4, 0, 0, 7); g.fill(); }
      } else if (r === WIN.gold) {   // a goldsmith: red under hot lights, chains and bangles behind the glass counters
        bg(y0, '#ff6a48', '#a01018');
        for (let x = 6; x < RW; x += 14) { g.strokeStyle = pick(['#ffe27a', '#ffd040', '#fff0b0']); g.lineWidth = 1.5; g.beginPath(); g.arc(x, y0 + 8, 6, 0.2, Math.PI - 0.2); g.stroke(); g.beginPath(); g.arc(x + 7, y0 + 23, 5, 0, 7); g.stroke(); }
        g.fillStyle = 'rgba(220,240,255,0.55)'; g.fillRect(0, y0 + 36, RW, 2); g.fillRect(0, y0 + 52, RW, 2);
        for (let x = 3; x < RW; x += 7) { g.fillStyle = pick(['#ffe27a', '#ffd040', '#ffffff']); g.fillRect(x, y0 + 41 + rand(0, 6), 4, 3); }
        for (let i = 0; i < 50; i++) { g.fillStyle = '#ffffff'; g.fillRect(rand(0, RW), y0 + rand(2, 60), 1.5, 1.5); }
      } else if (r === WIN.pharmacy) {   // shelves packed with boxes and tins, yellow price cards
        bg(y0, '#ffffff', '#e0f0ff'); shelf(y0, [20, 40, 60], 'rgba(150,160,170,0.9)');
        for (const yb of [5, 25, 45]) for (let x = 1; x < RW; x += rand(4, 7)) { g.fillStyle = pick(['#e82a4a', '#2a6ad8', '#f4f4f4', '#ffd23d', '#2ab86a', '#ff8ac0', '#7a4ad8', '#ff8a1a']); g.fillRect(x, y0 + yb + rand(0, 4), rand(3, 5), rand(9, 14)); }
        for (let x = 10; x < RW; x += 36) { g.fillStyle = '#ffe23d'; g.fillRect(x, y0 + 14, 14, 7); g.fillStyle = '#d8101e'; g.fillRect(x + 2, y0 + 16, 10, 3); }
      } else if (r === WIN.seafood) {   // dried seafood: jars, baskets of scallops and mushrooms, fish hanging, sacks
        bg(y0, '#ffe8c0', '#d8964a'); shelf(y0, [22]);
        for (let x = 6; x < RW; x += 13) { g.fillStyle = 'rgba(240,250,255,0.45)'; g.fillRect(x, y0 + 6, 10, 15); g.fillStyle = pick(['#c87a2a', '#8a4a1a', '#e8b060', '#5a3018']); g.fillRect(x + 1, y0 + 12, 8, 8); }
        for (let x = 14; x < RW; x += 28) { g.fillStyle = '#a87a40'; g.beginPath(); g.ellipse(x, y0 + 44, 13, 6, 0, 0, 7); g.fill(); for (let k = 0; k < 9; k++) dot(x + rand(-9, 9), y0 + 41 + rand(-2, 2), rand(2, 3), pick(['#f0a040', '#e08a2a', '#5a3018', '#c8a070'])); }
        for (let x = 8; x < RW; x += 40) { g.fillStyle = '#8a8070'; g.beginPath(); g.moveTo(x, y0 + 2); g.lineTo(x + 4, y0 + 24); g.lineTo(x - 4, y0 + 24); g.fill(); }
        g.fillStyle = '#c8b088'; for (let x = 4; x < RW; x += 30) { g.beginPath(); g.ellipse(x + 12, y0 + 60, 13, 8, 0, Math.PI, 0); g.fill(); }
      } else if (r === WIN.electronics) {   // phones and televisions: lit screens in the dark, price tags
        bg(y0, '#1a2234', '#0a0e16');
        for (let x = 4; x < RW; x += 30) { const gr = g.createLinearGradient(x, y0, x + 26, y0 + 22); gr.addColorStop(0, pick(['#3dfff0', '#3d6bff', '#ff3df0', '#39ff88'])); gr.addColorStop(1, pick(['#1a3a8a', '#8a1a8a', '#0a4a3a'])); g.fillStyle = gr; g.fillRect(x, y0 + 6, 26, 18); }
        shelf(y0, [36, 54], 'rgba(200,210,230,0.7)');
        for (let x = 3; x < RW; x += 9) { g.fillStyle = '#d8e4f0'; g.fillRect(x, y0 + 40, 6, 12); g.fillStyle = pick(['#3dfff0', '#ffffff', '#ff8ac0']); g.fillRect(x + 1, y0 + 41, 4, 9); }
        for (let x = 12; x < RW; x += 32) { g.fillStyle = '#ffe23d'; g.fillRect(x, y0 + 28, 12, 6); }
      } else if (r === WIN.cafe) {   // a cha chaan teng: mirrored walls, the menu slips, booths, people at their tables
        bg(y0, '#fff4dc', '#f0d8a8');
        for (let x = 2; x < RW; x += 9) { g.fillStyle = pick(['#ffe23d', '#ff8ac0', '#8ae8a0', '#ffffff', '#ffb070']); g.fillRect(x, y0 + 4, 7, 14); g.fillStyle = 'rgba(160,20,20,0.7)'; g.fillRect(x + 1, y0 + 6, 5, 1); g.fillRect(x + 1, y0 + 9, 4, 1); }
        g.fillStyle = 'rgba(200,230,240,0.5)'; g.fillRect(0, y0 + 20, RW, 10);
        for (let x = 0; x < RW; x += 32) { g.fillStyle = pick(['#2a7a5a', '#c8202c', '#3a5aa8']); g.fillRect(x + 2, y0 + 36, 12, 20); g.fillRect(x + 18, y0 + 36, 12, 20); g.fillStyle = '#e8e0d0'; g.fillRect(x + 12, y0 + 42, 8, 3); }
        for (let x = rand(8, 20); x < RW; x += rand(20, 34)) { g.fillStyle = 'rgba(30,24,24,0.85)'; g.beginPath(); g.arc(x, y0 + 32, 4, 0, 7); g.fill(); g.fillRect(x - 5, y0 + 36, 10, 12); }
      } else if (r === WIN.bakery) {   // a bakery: trays of egg tarts and pineapple buns
        bg(y0, '#fff8e8', '#f8d8a0'); shelf(y0, [24, 46], 'rgba(170,150,120,0.9)');
        for (let x = 6; x < RW; x += 11) { dot(x, y0 + 18, 4.2, '#b8742a'); dot(x, y0 + 18, 3, '#ffd23d'); }
        for (let x = 7; x < RW; x += 13) { g.fillStyle = '#e8a040'; g.beginPath(); g.ellipse(x, y0 + 41, 6, 4.5, 0, Math.PI, 0); g.fill(); g.strokeStyle = 'rgba(140,80,20,0.6)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x - 4, y0 + 38); g.lineTo(x + 3, y0 + 41); g.moveTo(x + 4, y0 + 38); g.lineTo(x - 3, y0 + 41); g.stroke(); }
        for (let x = 4; x < RW; x += 16) { g.fillStyle = pick(['#f4e8d0', '#e8c890', '#8a4a20']); g.fillRect(x, y0 + 52, 12, 7); }
      } else if (r === WIN.fashion) {   // clothes on rails, a mannequin or two, spotlights
        bg(y0, '#ffffff', '#f0e8f4');
        g.fillStyle = '#9aa0a8'; g.fillRect(0, y0 + 10, RW, 1.5);
        for (let x = 2; x < RW; x += 6) { g.fillStyle = pick(['#c8202c', '#141414', '#e8d8c0', '#2a4a7a', '#d85a8a', '#3a6a4a', '#f0e040', '#ffffff', '#7a4ad8']); g.fillRect(x, y0 + 11, 5, rand(22, 34)); }
        for (let x = 40; x < RW; x += 90) { g.fillStyle = 'rgba(255,255,240,0.5)'; g.beginPath(); g.ellipse(x, y0 + 40, 14, 24, 0, 0, 7); g.fill(); g.fillStyle = pick(['#c8202c', '#141414', '#f0a0c0']); g.fillRect(x - 6, y0 + 22, 12, 30); g.fillStyle = '#e8dcc8'; g.beginPath(); g.arc(x, y0 + 18, 4, 0, 7); g.fill(); }
      } else if (r === WIN.fruit) {   // a fruit stall under its red lamps: oranges, apples, mangoes, dragon fruit, grapes
        bg(y0, '#ff6a4a', '#c83020');
        for (let x = 18; x < RW; x += 44) { dot(x, y0 + 5, 7, '#ff2a14'); dot(x, y0 + 5, 3, '#ffe0a0'); }
        for (let yy = 22; yy < 62; yy += 7) for (let x = rand(0, 4); x < RW; x += 6) dot(x, y0 + yy + rand(-1, 1), rand(2.6, 3.4), pick(['#ff9a1a', '#ff8a10', '#e82a2a', '#ffd23d', '#e8288a', '#6a2a8a', '#8ac83a', '#ffb02a']));
        g.fillStyle = 'rgba(90,50,20,0.8)'; for (let x = 0; x < RW; x += 42) g.fillRect(x, y0 + 58, 40, 6);
      } else if (r === WIN.herbal) {   // a herbal tea shop: great bronze gourds with their taps, bowls on the counter
        bg(y0, '#fff0c8', '#e8b060');
        for (let x = 24; x < RW; x += 52) {
          const gr = g.createLinearGradient(x - 14, 0, x + 14, 0); gr.addColorStop(0, '#6a3a10'); gr.addColorStop(0.45, '#f0b848'); gr.addColorStop(1, '#5a2a08');
          g.fillStyle = gr; g.beginPath(); g.arc(x, y0 + 36, 15, 0, 7); g.fill(); g.beginPath(); g.arc(x, y0 + 16, 9, 0, 7); g.fill(); g.fillRect(x - 3, y0 + 2, 6, 6);
          g.fillStyle = '#c8101e'; g.fillRect(x - 6, y0 + 28, 12, 8); g.fillStyle = '#3a2a1a'; g.fillRect(x + 14, y0 + 44, 6, 3);
        }
        g.fillStyle = '#3a2416'; g.fillRect(0, y0 + 52, RW, 12);
        for (let x = 8; x < RW; x += 14) dot(x, y0 + 52, 4, '#2a1a10');
      } else if (r === WIN.medicine) {   // a medicine hall: the wall of a hundred wooden drawers, jars on the counter
        bg(y0, '#f0d8a8', '#c89858');
        for (let y = 2; y < 46; y += 11) for (let x = 2; x < RW; x += 16) { g.fillStyle = '#7a4a24'; g.fillRect(x, y0 + y, 14, 9); g.fillStyle = '#e8d8b0'; g.fillRect(x + 3, y0 + y + 1, 8, 3); g.fillStyle = '#d8b050'; g.fillRect(x + 6, y0 + y + 6, 2, 2); }
        g.fillStyle = '#4a2a14'; g.fillRect(0, y0 + 50, RW, 14);
        for (let x = 10; x < RW; x += 22) { g.fillStyle = 'rgba(230,240,240,0.6)'; g.fillRect(x, y0 + 40, 9, 10); }
      } else if (r === WIN.shutter) {   // a shop shut for the night: the roller shutter, its padlock, stickers and a tag
        bg(y0, '#9aa0a6', '#6a7076');
        for (let y = 0; y < RH; y += 3) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, y0 + y, RW, 1); }
        for (let i = 0; i < 6; i++) { g.fillStyle = pick(['#f4f4f0', '#ffe23d', '#ff8ac0', '#8ae8ff']); g.fillRect(rand(0, RW - 14), y0 + rand(6, 40), rand(6, 14), rand(4, 9)); }
        g.strokeStyle = pick(['#ff3df0', '#3dfff0', '#ffe23d']); g.lineWidth = 2; g.beginPath(); g.moveTo(rand(10, 60), y0 + 40); for (let k = 0; k < 6; k++) g.lineTo(rand(20, 140), y0 + rand(30, 50)); g.stroke();
        g.fillStyle = '#c8a040'; g.fillRect(RW / 2 - 3, y0 + 54, 6, 6);
      } else if (r === WIN.goldfish) {   // goldfish in their water bags pegged in rows on a bright board
        bg(y0, '#f4fff8', '#c8ecf0');
        for (let yy = 4; yy < 60; yy += 19) for (let x = 3; x < RW; x += 12) {
          g.fillStyle = 'rgba(160,220,240,0.6)'; g.beginPath(); g.moveTo(x + 2, yy + y0); g.lineTo(x + 8, yy + y0); g.quadraticCurveTo(x + 11, yy + y0 + 15, x + 5, yy + y0 + 16); g.quadraticCurveTo(x - 1, yy + y0 + 15, x + 2, yy + y0); g.fill();
          for (let k = 0; k < randi(1, 3); k++) { g.fillStyle = pick(['#ff7a1a', '#ff5a1a', '#ffffff', '#e82a1a', '#1a1a1a']); g.beginPath(); g.ellipse(x + 5 + rand(-1.5, 1.5), yy + y0 + 9 + rand(-2, 3), 1.8, 1.1, rand(0, 3), 0, 7); g.fill(); }
        }
      } else if (r === WIN.noodles) {   // a wonton noodle shop: the cook's window, noodles hanging, steam, bowls
        bg(y0, '#fff4d8', '#f0c880');
        for (let x = 4; x < 120; x += 4) { g.strokeStyle = '#f0d060'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y0 + 4); g.quadraticCurveTo(x + 2, y0 + 20, x, y0 + 30); g.stroke(); }
        for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(rand(130, 250), y0 + rand(4, 26), rand(4, 9), 0, 7); g.fill(); }
        g.fillStyle = '#c8c8c8'; for (let x = 136; x < RW; x += 22) { g.beginPath(); g.ellipse(x, y0 + 34, 9, 4, 0, 0, 7); g.fill(); }
        g.fillStyle = '#5a3a20'; g.fillRect(0, y0 + 44, RW, 20);
        for (let x = 10; x < RW; x += 26) { dot(x, y0 + 44, 6, '#f4f4f0'); dot(x, y0 + 44, 4, '#e8c060'); }
      } else if (r === WIN.pawn) {   // a pawnshop: the tall wooden screen that hides the counter, the character for "pledge"
        bg(y0, '#5a2a14', '#2a1208');
        for (let x = 6; x < RW; x += 64) { g.fillStyle = '#3a1a0c'; g.fillRect(x, y0 + 4, 52, 56); g.strokeStyle = '#c8a050'; g.lineWidth = 1.5; g.strokeRect(x + 3, y0 + 7, 46, 50); g.fillStyle = '#e8c060'; g.font = `900 36px ${SUNG}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('押', x + 26, y0 + 33); }
      } else {   // a dessert shop: pastel walls, mango and sago bowls, tables
        bg(y0, '#fff4fa', '#ffd0e4');
        for (let x = 8; x < RW; x += 24) { g.fillStyle = pick(['#ffd23d', '#ffb0d0', '#ffffff', '#8a4a2a', '#a0e0c0']); g.beginPath(); g.ellipse(x, y0 + 16, 8, 5, 0, 0, 7); g.fill(); }
        for (let x = 0; x < RW; x += 40) { g.fillStyle = '#f4f4f0'; g.fillRect(x + 6, y0 + 38, 24, 3); g.fillStyle = '#c8c0c8'; g.fillRect(x + 16, y0 + 41, 3, 16); }
        for (let x = rand(10, 30); x < RW; x += rand(26, 40)) { g.fillStyle = 'rgba(40,30,40,0.8)'; g.beginPath(); g.arc(x, y0 + 34, 4, 0, 7); g.fill(); g.fillRect(x - 5, y0 + 38, 10, 12); }
      }
      g.fillStyle = 'rgba(28,26,24,0.9)';
      for (let x = 0; x <= RW; x += 64) g.fillRect(x - 2, y0, 4, RH);
      g.fillRect(0, y0, RW, 3); g.fillRect(0, y0 + RH - 4, RW, 4);
    }
  });
}
function boardAtlas() {
  return atlas(BOARDS, 512, 96, 2, (g, [name, bgc, fg], w, h) => {
    g.fillStyle = bgc; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.globalAlpha = 0.55; g.lineWidth = 3; g.strokeRect(8, 8, w - 16, h - 16); g.globalAlpha = 1;
    g.font = `900 64px ${SUNG}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if ([...name].length <= 4 && 'letterSpacing' in g) g.letterSpacing = '14px';
    g.fillStyle = fg; g.fillText(name, w / 2 + ('letterSpacing' in g && [...name].length <= 4 ? 7 : 0), h / 2 + 3, w - 40);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  });
}
function streetAtlas() {   // white enamel street plates: the Chinese name over the English, black on white
  return atlas(STREETS, 256, 96, 2, (g, [cn, en], w, h) => {
    g.fillStyle = '#f6f6f2'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#141414'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#141414'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 34px ${HEI}`; g.fillText(cn, w / 2, 36, w - 30);
    g.font = `700 17px ${HEI}`; g.fillText(en, w / 2, 70, w - 26);
  });
}
function adIcon(g, kind, x, y, s, col) {   // the little pictures on the screens and the trams' ads
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 6;
  if (kind === 'cup') { g.fillRect(-22, -20, 44, 48); g.beginPath(); g.arc(28, 4, 12, -1.4, 1.4); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.8)'; for (const dx of [-10, 0, 10]) { g.beginPath(); g.moveTo(dx, -30); g.quadraticCurveTo(dx + 6, -40, dx, -50); g.stroke(); } }
  else if (kind === 'steamer') { for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(0, 18 - k * 16, 40, 12, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-40, 18 - k * 16, 80, 3); g.fillStyle = col; } }
  else if (kind === 'bolt') { g.beginPath(); g.moveTo(8, -44); g.lineTo(-22, 6); g.lineTo(0, 6); g.lineTo(-10, 44); g.lineTo(24, -10); g.lineTo(2, -10); g.closePath(); g.fill(); }
  else if (kind === 'bar') { for (let k = 0; k < 4; k++) g.fillRect(-40 + k * 22, 30 - k * 18, 16, k * 18 + 10); }
  else if (kind === 'stars') for (let k = 0; k < 5; k++) { const a = rand(0, 6.28), r = rand(10, 40); g.save(); g.translate(Math.cos(a) * r, Math.sin(a) * r); g.beginPath(); for (let i = 0; i < 10; i++) { const b2 = (i / 10) * Math.PI * 2, rr = i % 2 ? 4 : 10; g.lineTo(Math.cos(b2) * rr, Math.sin(b2) * rr); } g.fill(); g.restore(); }
  else if (kind === 'skyline') { for (let k = 0; k < 9; k++) { const hh = rand(20, 70); g.fillRect(-48 + k * 11, 40 - hh, 9, hh); } g.beginPath(); g.moveTo(-6, -40); g.lineTo(4, 40); g.lineTo(-16, 40); g.closePath(); g.fill(); }
  else if (kind === 'bun') { g.beginPath(); g.ellipse(0, 10, 40, 26, 0, Math.PI, 0); g.fill(); g.strokeStyle = 'rgba(120,60,10,0.6)'; g.lineWidth = 3; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 16 - 20, -12); g.lineTo(k * 16 + 10, 10); g.moveTo(k * 16 + 20, -12); g.lineTo(k * 16 - 10, 10); g.stroke(); } }
  else if (kind === 'phone') { g.fillRect(-18, -40, 36, 76); g.fillStyle = 'rgba(80,160,255,0.85)'; g.fillRect(-14, -34, 28, 62); }
  else if (kind === 'waffle') { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(-30 + i * 20, -18 + j * 18, 9, 0, 7); g.fill(); } }
  else if (kind === 'boat') { g.beginPath(); g.moveTo(-44, 14); g.lineTo(44, 14); g.lineTo(32, 30); g.lineTo(-34, 30); g.closePath(); g.fill(); g.fillStyle = '#e83a2a'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-26 + k * 24, 10); g.lineTo(-26 + k * 24, -36 + k * 6); g.quadraticCurveTo(-8 + k * 24, -20, -10 + k * 24, 10); g.closePath(); g.fill(); } }
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
      g.font = `900 70px ${HEI}`; g.fillText(cn, x0 + 24, 100, 230);
      g.font = `700 26px ${HEI}`; g.fillText(en, x0 + 26, 168, 230);
    });
  }, { repeat: false });
}
function tramAdAtlas() {   // a tram's sides, window bands left to the geometry: the classic green and the adverts
  return atlas(TRAM_ADS, 512, 128, 2, (g, [cn, en, bgc, ink, art], w, h) => {
    g.fillStyle = bgc; g.fillRect(0, 0, w, h);
    if (art === 'classic') {
      g.fillStyle = '#f4ecd0'; g.fillRect(0, h * 0.44, w, h * 0.16);
      g.fillStyle = '#1e5a3a'; g.font = `900 15px ${HEI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${cn}  ${en}`, w / 2, h * 0.52);
      g.fillStyle = '#d8b860'; g.fillRect(0, h * 0.94, w, 3); g.font = `700 13px ${HEI}`; g.fillText(String(randi(1, 170)), w * 0.9, h * 0.86);
      return;
    }
    adIcon(g, art, w * 0.84, h * 0.52, 0.85, ink);
    g.fillStyle = ink; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = `900 34px ${HEI}`; g.fillText(cn, 28, h * 0.5, w * 0.48);
    g.font = `700 15px ${HEI}`; g.fillText(en, 30, h * 0.8, w * 0.5);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, h * 0.06, w, 3);
  });
}
function destAtlas() {   // the trams' destination blinds
  return atlas(DESTS, 512, 96, 1, (g, [cn, en], w, h) => {
    g.fillStyle = '#101012'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.textBaseline = 'middle';
    g.textAlign = 'left'; g.font = `900 56px ${HEI}`; g.fillText(cn, 18, h / 2 + 2, w * 0.45);
    g.textAlign = 'right'; g.font = `700 30px ${HEI}`; g.fillText(en, w - 16, h / 2 + 2, w * 0.48);
  });
}
// The lightboxes in one atlas, 512x128 a cell: the upper floors' (the name big, the English under it, the floor to climb to), the snack
// counters' and the MTR's signs over its exits (the red symbol, the station, the exit)
const STATIONS = [['旺角站', 'MONG KOK'], ['油麻地站', 'YAU MA TEI'], ['佐敦站', 'JORDAN'], ['銅鑼灣站', 'CAUSEWAY BAY'], ['北角站', 'NORTH POINT'], ['太古站', 'TAI KOO']];
function boxAtlas() {
  const E = [...UPPER.map((e) => ['up', ...e]), ...SNACKS.map((e) => ['snack', ...e]), ...STATIONS.map((e) => ['mtr', ...e])];
  const a = atlas(E, 512, 128, 2, (g, [kind, cn, en, bgc, fg], w, h) => {
    if (kind === 'up') {
      g.fillStyle = bgc; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(0, 0, w, h * 0.14);
      g.strokeStyle = fg; g.globalAlpha = 0.5; g.lineWidth = 3; g.strokeRect(7, 7, w - 14, h - 14); g.globalAlpha = 1;
      g.fillStyle = fg; g.textBaseline = 'middle'; g.textAlign = 'left';
      g.font = `900 64px ${HEI}`; g.fillText(cn, 24, h * 0.42, w * 0.6);
      g.font = `700 19px ${HEI}`; g.fillText(en, 26, h * 0.83, w * 0.6);
      g.fillRect(w * 0.71, 20, 3, h - 40);
      g.textAlign = 'center'; g.font = `900 48px ${HEI}`; g.fillText(`${randi(2, 9)}樓`, w * 0.86, h * 0.5);
    } else if (kind === 'snack') {
      g.fillStyle = bgc; g.fillRect(0, 0, w, h);
      g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
      g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `900 64px ${SUNG}`; g.fillText(cn, w / 2, h * 0.42, w - 50);
      g.font = `700 19px ${HEI}`; g.fillText(en, w / 2, h * 0.82, w - 50);
    } else {
      g.fillStyle = '#f6f6f4'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#c8102e'; roundRect(g, 12, 12, 104, 104, 16); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.lineCap = 'butt';
      g.beginPath(); g.moveTo(64, 24); g.lineTo(64, 104); g.stroke();
      g.beginPath(); g.arc(64, 64, 30, -1.05, 1.05); g.stroke(); g.beginPath(); g.arc(64, 64, 30, Math.PI - 1.05, Math.PI + 1.05); g.stroke();
      g.fillStyle = '#141414'; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.font = `900 50px ${HEI}`; g.fillText(cn, 136, 46, 250);
      g.font = `700 26px ${HEI}`; g.fillText(en, 138, 96, 250);
      g.fillStyle = '#ffd23d'; g.fillRect(w - 104, 22, 84, 84); g.fillStyle = '#141414'; g.textAlign = 'center';
      g.font = `900 46px ${HEI}`; g.fillText(pick(['A1', 'A2', 'B1', 'C3', 'D2', 'E1', 'E2']), w - 62, 66);
    }
  });
  const n1 = UPPER.length, n2 = n1 + SNACKS.length;
  return { tex: a.tex, upper: a.rects.slice(0, n1), snack: a.rects.slice(n1, n2), mtr: a.rects.slice(n2) };
}
// the paint on the roads: a cell of worn white for the lines and bars, and LOOK RIGHT / LOOK LEFT with the arrow, as painted at the kerbs
function paintAtlas() {
  const a = atlas([['', '', 0], ['望右', 'LOOK RIGHT', 1], ['望左', 'LOOK LEFT', -1]], 256, 128, 1, (g, [cn, en, d], w, h) => {
    g.clearRect(0, 0, w, h);
    if (!d) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(90,90,96,${rand(0.2, 0.6).toFixed(2)})`; g.fillRect(rand(0, w), rand(0, h), rand(1, 4), rand(1, 4)); }
      return;
    }
    g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `900 50px ${HEI}`; g.fillText(cn, w / 2 - 30 * d, 42);
    g.font = `900 30px ${HEI}`; g.fillText(en, w / 2, 100);
    const ax = w / 2 + 62 * d; g.lineWidth = 7; g.beginPath(); g.moveTo(ax - 26 * d, 42); g.lineTo(ax + 18 * d, 42); g.stroke();
    g.beginPath(); g.moveTo(ax + 30 * d, 42); g.lineTo(ax + 8 * d, 26); g.lineTo(ax + 8 * d, 58); g.closePath(); g.fill();
  });
  const r = a.rects[0], m = 0.02;   // (the white cell, kept clear of its edges)
  return { tex: a.tex, white: { u0: r.u0 + m, u1: r.u1 - m, v0: r.v0 + m, v1: r.v1 - m }, look: a.rects.slice(1) };
}
function goodsAtlas() {   // what hangs over the market stalls: T-shirts, handbags, toys, phone cases, fans and lanterns
  return atlas([0, 1, 2, 3, 4, 5, 6, 7], 128, 128, 4, (g, k, w, h) => {
    g.clearRect(0, 0, w, h);
    const shirt = (col, ink, draw) => {
      g.fillStyle = col; g.beginPath(); g.moveTo(36, 14); g.lineTo(50, 10); g.quadraticCurveTo(64, 22, 78, 10); g.lineTo(92, 14); g.lineTo(118, 38); g.lineTo(102, 52); g.lineTo(94, 44);
      g.lineTo(94, 120); g.lineTo(34, 120); g.lineTo(34, 44); g.lineTo(26, 52); g.lineTo(10, 38); g.closePath(); g.fill();
      g.fillStyle = ink; draw();
    };
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (k === 0) shirt('#d8202a', '#ffffff', () => { g.font = `900 22px ${HEI}`; g.fillText('I ♥ HK', 64, 66); });
    else if (k === 1) shirt('#141418', '#e8c060', () => { g.lineWidth = 5; g.strokeStyle = '#e8c060'; g.beginPath(); g.moveTo(44, 90); g.bezierCurveTo(54, 40, 74, 110, 86, 56); g.stroke(); g.beginPath(); g.arc(86, 54, 6, 0, 7); g.fill(); });
    else if (k === 2) shirt('#f4f4f0', '#1a3a8a', () => { for (let i = 0; i < 7; i++) { const hh = rand(10, 34); g.fillRect(40 + i * 7, 96 - hh, 6, hh); } g.font = `900 13px ${HEI}`; g.fillText('HONG KONG', 64, 106); });
    else if (k === 3) shirt('#ffd23d', '#c8202a', () => { for (let i = 0; i < 5; i++) { g.save(); g.translate(64, 70); g.rotate((i / 5) * Math.PI * 2); g.beginPath(); g.ellipse(0, -12, 6, 12, 0.5, 0, 7); g.fill(); g.restore(); } });
    else if (k === 4) for (let i = 0; i < 3; i++) { g.fillStyle = pick(['#c8202a', '#8a5a2a', '#141414', '#e8c8a0', '#2a4a8a', '#f0a0c0']); g.fillRect(6 + i * 40, 50, 36, 34); g.strokeStyle = g.fillStyle; g.lineWidth = 4; g.beginPath(); g.arc(24 + i * 40, 50, 12, Math.PI, 0); g.stroke(); }
    else if (k === 5) { g.fillStyle = '#e8e0d0'; g.fillRect(4, 4, 120, 120); for (let i = 0; i < 16; i++) { g.fillStyle = pick(['#ff3d6a', '#3dbfff', '#ffe23d', '#39ff88', '#ff8a2a', '#b26bff']); g.beginPath(); g.arc(18 + (i % 4) * 30, 18 + Math.floor(i / 4) * 30, 10, 0, 7); g.fill(); } }
    else if (k === 6) { g.fillStyle = '#2a2a30'; g.fillRect(4, 4, 120, 120); for (let i = 0; i < 12; i++) { g.fillStyle = pick(['#ff4fa8', '#3dfff0', '#ffe23d', '#f4f4f0', '#ff8a2a', '#7a8aff', '#141414']); g.fillRect(10 + (i % 4) * 29, 10 + Math.floor(i / 4) * 38, 22, 34); } }
    else { for (let i = 0; i < 3; i++) { g.fillStyle = pick(['#e8202a', '#ffd23d', '#e8202a']); g.beginPath(); g.ellipse(24 + i * 40, 56, 16, 22, 0, 0, 7); g.fill(); g.fillStyle = '#e8c060'; g.fillRect(18 + i * 40, 30, 12, 5); g.fillRect(18 + i * 40, 78, 12, 5); g.fillRect(23 + i * 40, 83, 2, 22); } }
  });
}

// ---------- the kit ----------
const SHOPS = {
  roast: { boards: [0], neon: [7], paint: ['#8a1010', '#c8b8a0'], light: '#ffcf8a', canopy: 0.6 },
  gold: { boards: [1, 17], neon: [4, 10], paint: ['#c8101e', '#d8b060'], light: '#ff6a4a', canopy: 0 },
  pharmacy: { boards: [2], neon: [5], paint: ['#f4f4f0', '#1a7a3a'], light: '#e8f6ff', canopy: 0.2 },
  seafood: { boards: [3, 10], neon: [22, 23], paint: ['#2a1a10', '#5a3a20'], light: '#ffd8a0', canopy: 0.6, goods: 'sacks' },
  electronics: { boards: [4], neon: [24], paint: ['#103a8a', '#1a1a20'], light: '#cfe6ff', canopy: 0.1 },
  cafe: { boards: [5, 23], neon: [2, 3, 25], paint: ['#2a6a4a', '#c8101e', '#f4e8c8'], light: '#fff0d0', canopy: 0.3 },
  bakery: { boards: [6], neon: [21], paint: ['#7a1010', '#f4e8c8'], light: '#fff0c8', canopy: 0.3 },
  fashion: { boards: [7], neon: [9], paint: ['#141418', '#f4f4f4'], light: '#fff4f8', canopy: 0.1, goods: 'rack' },
  fruit: { boards: [8], neon: [], paint: ['#1a5a2a', '#c8101e'], light: '#ff5a3a', canopy: 1, goods: 'fruit' },
  herbal: { boards: [9], neon: [6], paint: ['#5a2a10', '#2a1a10'], light: '#ffd890', canopy: 0.2 },
  medicine: { boards: [10], neon: [22, 23], paint: ['#1a1a1a', '#5a3a20'], light: '#ffe8c0', canopy: 0.2 },
  shutter: { boards: [19, 20, 21], neon: [], paint: ['#3a3a40', '#5a5a60'], light: null, canopy: 0, dim: true },
  goldfish: { boards: [11], neon: [], paint: ['#0a4a7a', '#f4f4f0'], light: '#d8fff4', canopy: 0.5, goods: 'tanks' },
  noodles: { boards: [12, 18], neon: [20], paint: ['#f0e0b0', '#8a1010'], light: '#ffe0a8', canopy: 0.3 },
  pawn: { boards: [13], neon: [0], paint: ['#1a1a1a', '#3a1a10'], light: '#ffb870', canopy: 0 },
  dessert: { boards: [14], neon: [18], paint: ['#ff8ab8', '#f4f4f0'], light: '#fff0f8', canopy: 0.3 },
};
export const NEON_SHOPS = { gold: 14, pharmacy: 14, electronics: 10, cafe: 12, fashion: 10, pawn: 5, roast: 6, dessert: 6, noodles: 6, bakery: 5, shutter: 6, herbal: 3, fruit: 3 };
export const TRAM_SHOPS = { seafood: 24, medicine: 16, herbal: 8, roast: 10, cafe: 10, noodles: 8, shutter: 10, pawn: 6, bakery: 8 };
export const LANE_SHOPS = { fruit: 10, seafood: 12, roast: 10, bakery: 8, cafe: 8, noodles: 6, medicine: 6, herbal: 4, shutter: 6, pharmacy: 6, goldfish: 2 };
export const MARKET_SHOPS = { fruit: 14, goldfish: 10, cafe: 12, dessert: 10, noodles: 10, fashion: 12, electronics: 8, roast: 8, bakery: 6, shutter: 5, pharmacy: 5 };
export const ESTATE_SHOPS = { cafe: 16, bakery: 12, pharmacy: 12, fruit: 10, noodles: 10, roast: 8, shutter: 14, herbal: 6, medicine: 6, dessert: 6 };
const pickW = (w) => { let r = Math.random() * Object.values(w).reduce((a, b2) => a + b2, 0); for (const k in w) { r -= w[k]; if (r <= 0) return k; } return Object.keys(w)[0]; };

export function makeKit() {
  const K = hongkongTreeKit();
  const face = (s) => -s * Math.PI / 2;   // rotation turning a plane to face the track from side s
  K.face = face;
  K.poolMat = basic({ map: canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { repeat: false }),
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  K.pool = (b, x, z, w, d, col, y = 0.05) => b.add(G.plane, K.poolMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0, col);   // light spilt on the ground
  const tiles = new Map();   // planes whose UVs repeat a texture n times across (row v of an atlas of rows)
  K.tiled2 = (nu, nv) => {   // a plane whose UVs repeat a texture nu times across and nv times up
    const key = `t2|${nu}|${nv}`;
    if (!tiles.has(key)) tiles.set(key, planeUV({ u0: 0, u1: nu, v0: 0, v1: nv }));
    return tiles.get(key);
  };
  K.tiled = (n, v = 0, rows = 1) => {
    const key = `${n}|${v}|${rows}`;
    if (!tiles.has(key)) tiles.set(key, planeUV({ u0: 0, u1: n, v0: 1 - (v + 1) / rows, v1: 1 - v / rows }));
    return tiles.get(key);
  };
  // facades
  K.tongs = [0, 1, 2].map((win) => { const tex = tongTex({ win, litChance: win === 2 ? 0.45 : 0.52 }); return { tex, mat: facadeMat(tex, { k: 0.95 }) }; });
  K.dense = denseTex(); K.denseMat = facadeMat(K.dense, { k: 0.9 });
  K.ver = verandahTex(); K.verMat = facadeMat(K.ver, { k: 0.9 });
  K.office = windowTex({ cols: 6, rows: 12, cw: 32, ch: 40, wall: '#26323f', glass: '#0d1824', lit: OFFICE, litChance: 0.62, band: true });
  K.officeMat = facadeMat(K.office, { k: 0.85, rough: 0.35, metal: 0.5 });
  K.office2 = windowTex({ cols: 8, rows: 12, cw: 24, ch: 40, wall: '#3a4250', glass: '#101a26', lit: OFFICE, litChance: 0.55, frame: '#5a6474' });
  K.office2Mat = facadeMat(K.office2, { k: 0.8, rough: 0.4, metal: 0.4 });
  // shopfronts and their signs
  K.winMat = basic({ map: shopWinTex(), vertexColors: true, color: hdr('#ffffff', 0.9) });
  const boards = boardAtlas();
  K.boardRects = boards.rects; K.boardMat = std({ map: boards.tex, roughness: 0.6, emissive: '#ffffff', emissiveMap: boards.tex, emissiveIntensity: 0.55 });
  const vn = atlas(V_NEON, 96, 384, 16, (g, e, w, h) => drawNeon(g, e, w, h, true));
  const hn = atlas(H_NEON, 384, 160, 4, (g, e, w, h) => drawNeon(g, e, w, h, false));
  K.vRects = vn.rects; K.hRects = hn.rects; K.V_NEON = V_NEON; K.H_NEON = H_NEON;
  const nm = (tex) => basic({ map: tex, vertexColors: true, color: hdr('#ffffff', 1.3) });
  K.neonMat = [nm(vn.tex), nm(hn.tex)];
  K.neonFlick = [nm(vn.tex), nm(hn.tex)];   // the ones on the blink
  const st = streetAtlas();
  K.streetRects = st.rects; K.streetMat = basic({ map: st.tex, color: hdr('#ffffff', 0.85), side: THREE.DoubleSide });
  K.screen = screenMat(adAtlas(), ADS.length, 1.5, 0.17);
  const ta = tramAdAtlas(), da = destAtlas(), ga = goodsAtlas();
  K.tramAdRects = ta.rects; K.tramAdMat = std({ map: ta.tex, roughness: 0.5, emissive: '#ffffff', emissiveMap: ta.tex, emissiveIntensity: 0.35 });
  K.destRects = da.rects; K.destMat = basic({ map: da.tex, color: hdr('#ffffff', 1.6) });
  K.goodsRects = ga.rects; K.goodsMat = std({ map: ga.tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8, emissive: '#ffffff', emissiveMap: ga.tex, emissiveIntensity: 0.4 });
  // ironwork, bamboo and netting
  K.grilleMat = std({ map: canvasTex(64, 64, (g, w, h) => {   // the window cages' grilles: a frame round a lattice of diamonds and scrolls
    g.clearRect(0, 0, w, h); g.strokeStyle = '#2a2e30'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
    g.lineWidth = 1.6; g.beginPath(); for (let k = -64; k < 64; k += 16) { g.moveTo(k, 0); g.lineTo(k + 64, 64); g.moveTo(k + 64, 0); g.lineTo(k, 64); } g.stroke();
    g.beginPath(); g.arc(32, 32, 7, 0, 7); g.stroke();
  }), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4 });
  K.railMat = std({ map: canvasTex(64, 32, (g, w, h) => {   // the kerbside railing: bars between a top and a bottom rail
    g.clearRect(0, 0, w, h); g.fillStyle = '#b8c0c4'; g.fillRect(0, 2, w, 3); g.fillRect(0, h - 4, w, 3);
    for (let x = 3; x < w; x += 8) g.fillRect(x, 2, 2, h - 4);
  }), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.45, metalness: 0.6 });
  K.bambooMat = std({ map: canvasTex(64, 128, (g, w, h) => {   // bamboo poles lashed in a grid, the black nylon ties at the crossings
    g.clearRect(0, 0, w, h);
    for (const x of [6, 38]) { g.fillStyle = '#c8a868'; g.fillRect(x, 0, 5, h); g.fillStyle = 'rgba(90,60,20,0.5)'; for (let y = 10; y < h; y += 26) g.fillRect(x, y, 5, 2); }
    for (const y of [20, 84]) { g.fillStyle = '#b89858'; g.fillRect(0, y, w, 4); for (const x of [6, 38]) { g.fillStyle = '#141414'; g.fillRect(x - 1, y - 2, 7, 8); } }
    g.strokeStyle = '#a88848'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, h); g.lineTo(w, 0); g.stroke();
  }), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
  K.balMat = std({ map: canvasTex(64, 32, (g, w, h) => {   // the verandahs' balusters
    g.clearRect(0, 0, w, h); g.fillStyle = '#f0ece0'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
    for (let x = 4; x < w; x += 10) { g.beginPath(); g.moveTo(x, 3); g.quadraticCurveTo(x - 3, h / 2, x + 1, h - 3); g.lineTo(x + 5, h - 3); g.quadraticCurveTo(x + 9, h / 2, x + 6, 3); g.fill(); }
  }), vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
  const net = canvasTex(32, 32, (g, w, h) => { g.fillStyle = 'rgba(40,140,80,0.62)'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(20,90,50,0.8)'; for (let k = 0; k < w; k += 4) { g.fillRect(k, 0, 1, h); g.fillRect(0, k, w, 1); } });
  K.netMat = std({ map: net, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.9, emissive: '#1a6a3a', emissiveIntensity: 0.25 });
  K.sea = waterMat('#060a16', 4);
  K.sea.metalness = 0.7; K.sea.roughness = 0.16; K.sea.envMapIntensity = 0.38; K.sea.normalScale.set(0.45, 0.45);
  K.sea.emissive = new THREE.Color('#0c0c22'); K.sea.emissiveIntensity = 0.5;
  const starTex = canvasTex(64, 64, (g, w, h) => {   // the Star Ferry's white star
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 12 : 30; g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + 2 + Math.sin(a) * r); }
    g.fill();
  }, { repeat: false });
  K.starMat = basic({ map: starTex, alphaTest: 0.5, color: hdr('#ffffff', 1.6), side: THREE.DoubleSide });
  const sailTex = canvasTex(128, 192, (g, w, h) => {   // a junk's battened sail, lit red from the deck
    g.clearRect(0, 0, w, h);
    const path = () => { g.beginPath(); g.moveTo(6, h - 4); g.lineTo(6, 30); g.quadraticCurveTo(40, 2, 92, 6); g.quadraticCurveTo(128, 70, 122, h - 4); g.closePath(); };
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8a1018'); gr.addColorStop(1, '#ff4a2a');
    path(); g.fillStyle = gr; g.fill();
    g.save(); path(); g.clip(); g.strokeStyle = 'rgba(40,10,10,0.75)'; g.lineWidth = 3;
    for (let k = 1; k < 7; k++) { const y = 20 + k * 26; g.beginPath(); g.moveTo(0, y + 6); g.quadraticCurveTo(64, y - 6, 128, y + 4); g.stroke(); }
    g.restore();
  }, { repeat: false });
  K.sailMat = basic({ map: sailTex, alphaTest: 0.4, color: hdr('#ffffff', 1.1), side: THREE.DoubleSide });
  // the road: asphalt patched and oil-stained, the double yellow line along the kerb; the paint on it
  K.laneMat = std({ map: canvasTex(64, 256, (g, w, h) => {
    g.fillStyle = '#2c2c30'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { const v = randi(-12, 16); g.fillStyle = `rgba(${58 + v},${58 + v},${64 + v},0.55)`; g.fillRect(rand(0, w), rand(0, h), 1.5, 1.5); }
    for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(14,14,16,${rand(0.2, 0.4).toFixed(2)})`; g.beginPath(); g.ellipse(rand(8, w - 18), rand(0, h), rand(4, 11), rand(10, 34), 0, 0, 7); g.fill(); }
    g.fillStyle = '#d8aa22'; g.fillRect(w - 10, 0, 2.6, h); g.fillRect(w - 5.4, 0, 2.6, h);
  }), roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  // the side streets' roads: the same asphalt short of its yellow line, running along z or (turned) along x
  K.road = (b, x, z, w, d, along = 'z') => along === 'z'
    ? b.add(planeUV({ u0: 0.03, u1: 0.78, v0: 0, v1: Math.max(1, Math.round(d / 4)) }), K.laneMat, x, 0.03, z, w, d, 1, -Math.PI / 2, 0, 0)
    : b.add(planeUV({ u0: 0.03, u1: 0.78, v0: 0, v1: Math.max(1, Math.round(w / 4)) }), K.laneMat, x, 0.03, z, d, w, 1, -Math.PI / 2, Math.PI / 2, 0);
  const pa = paintAtlas();
  K.paintMat = basic({ map: pa.tex, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const white = planeUV(pa.white), looks = pa.look.map((r) => planeUV(r));
  K.paint = (b, x, z, w, d, col = hdr('#e8e8e2', 0.6), y = 0.045) => b.add(white, K.paintMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0, col);
  K.look = (b, x, z, d = 1, ry = 0) => b.add(looks[d > 0 ? 0 : 1], K.paintMat, x, 0.05, z, 1.9, 0.95, 1, -Math.PI / 2, ry, 0, hdr('#ffffff', 0.55));   // LOOK RIGHT painted at a kerb
  // the upper floors' lightboxes, the snack counters', the MTR's signs, all in one material (their brightness in the vertex colour)
  const bx = boxAtlas();
  K.boxMat = basic({ map: bx.tex, vertexColors: true });
  K.upperRects = bx.upper; K.snackRects = bx.snack; K.mtrRects = bx.mtr;
  // steam off the snack counters' pots: points gathered while a scene is built, a billboard cloud added once it is
  K.steams = []; K.steamBuf = [];
  K.steam = (pts) => { const m = puffs(pts, { size: 0.42, grow: 2.6, rise: 2.4, drift: 0.5, life: 3.4, n: 5, color: '#e8ece8', opacity: 0.4 }); K.steams.push(m); return m; };
  K.flushSteam = (g) => { if (K.steamBuf.length) g.add(K.steam(K.steamBuf.splice(0))); return g; };

  // ---------- buildings ----------
  // a row of tong lau and composite buildings, n bays wide each, the ground floor given to shops
  // (upper: how often a building's lower floors carry lightboxes; kiosk: how often a shop puts a snack counter out; reach: how high
  // its projecting signs climb; vert: the share of them that are tall vertical boxes) Returns where the row actually ended.
  K.row = (b, s, z0, z1, { x0 = 10.8, floors = [5, 11], shops = NEON_SHOPS, signs = 1, ac = 0.32, cage = 0.12, laundry = 0.08, scaffold = 0.12, roofSign = 0.15, dense = 0.15, tall = 0.2,
    upper = 0.3, kiosk = 0, reach = 26, vert = 0.62, signMax } = {}) => {
    let z = z0;
    while (z1 - z >= BAY) {   // down to a last building one bay wide that takes up what is left, so the row ends where it was asked to
      const n = Math.min(randi(3, 6), Math.floor((z1 - z) / BAY)), last = z1 - z - n * BAY < BAY, L = last ? z1 - z : n * BAY, d = rand(12, 16), xIn = x0 + (chance(0.25) ? rand(0.1, 0.5) : 0);
      const isDense = chance(dense), fl = isDense ? randi(14, 20) : chance(tall) ? randi(floors[1], floors[1] + 6) : randi(...floors);
      const T = isDense ? { tex: K.dense, mat: K.denseMat } : pick(K.tongs), cw = isDense ? 2.0 : BAY, ch = isDense ? 2.8 : FH;
      const h = GF + fl * ch, cx = s * (xIn + d / 2), cz = -(z + L / 2), f = s * xIn;
      b.block(VC.solid, '#2e2c2c', cx, 0, cz, d, GF, L);
      b.addM(buildingGeo(d, fl * ch, L, T.tex, cw, ch), T.mat, at(cx, GF, cz), pick(WALLS));
      const i = { x: cx, z: cz, d, len: L, h, side: s, face: f, z0: z, z1: z + L, n, floors: fl, dense: isDense, signMax };
      K.roof(b, i, { sign: roofSign });
      K.ground(b, i, shops, kiosk);
      if (!isDense) K.upper(b, i, { ac, cage, laundry, skip: K.upperBoards(b, i, upper) });
      if (chance(scaffold) && !isDense) K.scaffold(b, i);
      else for (let k = 0; k < Math.round(signs * rand(1, 3) + (h > 26 ? signs : 0)); k++) K.hangSign(b, i, { v: chance(vert), reach });
      z += L + (last ? 0 : chance(0.2) ? rand(0.3, 1.0) : 0.02);
    }
    return z;
  };
  // the shops along the ground floor and the pilasters between them; now and then a snack counter out front, a shrine by a door
  K.ground = (b, i, shops, kiosk = 0) => {
    const s = i.side, f = i.face, L = i.len, n = L > 11 ? Math.max(3, Math.round(L / 4.8)) : L > 6 ? 2 : 1, sl = L / n;
    for (let k = 0; k <= n; k++) b.box(VC.solid, '#d8d4cc', f - s * 0.12, GF / 2, -(i.z0 + k * sl), 0.3, GF, 0.35);
    for (let k = 0; k < n; k++) {
      const zc = -(i.z0 + sl * (k + 0.5)), kind = pickW(shops);
      K.shop(b, f, zc, sl - 0.4, s, kind);
      if (SHOPS[kind].dim || SHOPS[kind].goods) continue;
      if (chance(kiosk)) K.kiosk(b, f, zc, s);
      else if (chance(0.16)) K.shrine(b, f, zc + (sl / 2 - 0.55) * pick([-1, 1]), s);
    }
    b.box(VC.solid, '#c8c4bc', f - s * 0.3, GF - 0.1, i.z, 0.6, 0.2, L);   // the canopy slab over the shopfronts
  };
  // the lightboxes of the shops upstairs, across a few floors' windows: hair salons, clinics, mahjong, tutors. Returns the cells they cover.
  K.upperBoards = (b, i, p = 0.3) => {
    const skip = new Set();
    if (i.floors < 3 || i.n < 2 || !chance(p)) return skip;
    const s = i.side, f = i.face;
    for (let r = 0; r < Math.min(4, i.floors - 1); r++) {
      if (!chance(r ? 0.45 : 0.7)) continue;
      const bays = Math.min(i.n, randi(2, 4)), c0 = randi(0, i.n - bays), w = bays * BAY - 0.3, h = Math.min(FH - 0.5, w / 4), z = -(i.z0 + (c0 + bays / 2) * BAY), y = GF + r * FH + FH * 0.52;
      b.box(VC.metal, '#1a1a1e', f - s * 0.07, y, z, 0.1, h + 0.14, w + 0.14);
      b.add(planeUV(K.upperRects[randi(0, K.upperRects.length - 1)]), K.boxMat, f - s * 0.13, y, z, w, h, 1, 0, face(s), 0, hdr('#ffffff', 0.78));
      for (let c = c0; c < c0 + bays; c++) skip.add(r * 64 + c);
    }
    return skip;
  };
  K.shop = (b, f, zc, L, s, kind) => {
    const k = SHOPS[kind];
    b.box(VC.solid, pick(k.paint), f - s * 0.06, 2.2, zc, 0.12, 4.4, L);
    b.add(K.tiled(Math.max(1, Math.round(L / 3)), WIN[kind], NWIN), K.winMat, f - s * 0.14, 1.65, zc, L - 0.4, 3.1, 1, 0, face(s), 0, k.dim ? '#606060' : 0xffffff);
    b.add(planeUV(K.boardRects[pick(k.boards)]), K.boardMat, f - s * 0.16, 3.78, zc, Math.min(L - 0.2, 6.4), Math.min(L - 0.2, 6.4) / 5.33, 1, 0, face(s), 0);
    if (k.light) K.pool(b, f - s * 1.4, zc, 3.4, L + 1.2, hdr(k.light, 0.16), 0.04);
    if (chance(k.canopy)) {   // a little sloping canopy of painted sheet metal or canvas
      const col = pick(TARPS);
      b.add(G.box, VC.solid, f - s * 0.75, 3.25, zc, 1.5, 0.05, L, 0, 0, s * 0.25, col);
      b.box(VC.solid, col, f - s * 1.48, 3.03, zc, 0.04, 0.22, L);
    }
    if (k.goods === 'fruit') for (let z = zc - L / 2 + 0.6; z < zc + L / 2 - 0.4; z += 0.8) {   // crates of fruit on the pavement, red lamps over them
      const x = f - s * rand(0.6, 1.4);
      b.block(VC.solid, '#8a6a3a', x, 0, z, 0.7, 0.5 + rand(0, 0.3), 0.7);
      for (let j = 0; j < 4; j++) b.add(OCT, VC.solid, x + rand(-0.2, 0.2), 0.95, z + rand(-0.2, 0.2), 0.26, 0.24, 0.26, 0, rand(0, 1), 0, pick(['#ff9a1a', '#e82a2a', '#ffd23d', '#e8288a', '#8ac83a']));
    }
    if (k.goods === 'fruit') for (let z = zc - L / 2 + 0.8; z < zc + L / 2; z += 1.6) { b.add(G.cone8, VC.solid, f - s * 1.0, 2.72, z, 0.5, 0.3, 0.5, 0, 0, 0, '#c8101e'); b.sph(VC.glow, hdr('#ff3a20', 2.4), f - s * 1.0, 2.55, z, 0.12, true); }
    if (k.goods === 'sacks') for (let z = zc - L / 2 + 0.5; z < zc + L / 2 - 0.3; z += rand(0.6, 0.9)) {   // sacks and baskets of dried goods
      const x = f - s * rand(0.5, 1.1);
      b.cyl(VC.solid, '#c8b088', x, 0.3, z, 0.26, 0.6, 'cyl8');
      b.cyl(VC.solid, pick(['#d88a2a', '#8a4a1a', '#e8c070', '#5a3018', '#c8603a']), x, 0.62, z, 0.24, 0.06, 'cyl8');
    }
    if (k.goods === 'tanks') for (let z = zc - L / 2 + 0.7; z < zc + L / 2 - 0.5; z += 1.1) {   // fish tanks stacked on racks
      const x = f - s * 0.7;
      b.box(VC.metal, '#5a6068', x, 0.4, z, 0.6, 0.8, 0.9);
      b.box(VC.glow, hdr(pick(['#7ad8ff', '#8affd8', '#bfe8ff']), 1.1), x, 1.05, z, 0.5, 0.5, 0.8);
    }
    if (k.goods === 'rack') for (let z = zc - L / 2 + 0.8; z < zc + L / 2 - 0.6; z += 1.6) {   // a rail of clothes outside
      const x = f - s * 1.0;
      b.box(VC.metal, '#9aa0a8', x, 1.5, z, 0.04, 0.04, 1.2);
      for (let j = 0; j < 6; j++) b.box(VC.solid, pick(LAUNDRY), x, 1.05, z - 0.5 + j * 0.2, 0.36, 0.85, 0.05);
    }
  };
  // a shopfront on a wall facing nz (along z): its painted surround, the lit window, the board, the light spilt in front
  K.shopZ = (b, xc, zw, nz, L, kind = pickW(NEON_SHOPS)) => {
    const S = SHOPS[kind], ry = nz > 0 ? 0 : Math.PI;
    b.box(VC.solid, pick(S.paint), xc, 2.2, zw + nz * 0.06, L - 0.1, 4.4, 0.12);
    b.add(K.tiled(Math.max(1, Math.round(L / 3)), WIN[kind], NWIN), K.winMat, xc, 1.65, zw + nz * 0.14, L - 0.5, 3.1, 1, 0, ry, 0, S.dim ? '#606060' : 0xffffff);
    b.add(planeUV(K.boardRects[pick(S.boards)]), K.boardMat, xc, 3.78, zw + nz * 0.16, Math.min(L - 0.3, 6.4), Math.min(L - 0.3, 6.4) / 5.33, 1, 0, ry, 0);
    if (S.light) K.pool(b, xc, zw + nz * 1.4, L + 1, 3.2, hdr(S.light, 0.16), 0.04);
  };
  // the upper floors: air-conditioners under the windows, window cages full of plants, laundry poles
  K.upper = (b, i, { ac, cage, laundry, skip = null }) => {
    const s = i.side, f = i.face;
    for (let r = 0; r < i.floors; r++) for (let c = 0; c < i.n; c++) {
      if (skip && skip.has(r * 64 + c)) continue;
      const y = GF + r * FH, z = -(i.z0 + (c + 0.5) * BAY), q = Math.random();
      if (q < cage) K.cage(b, f, y, z, s);
      else if (q < cage + ac) K.ac(b, f - s * 0.25, y + 0.33, z + rand(-0.3, 0.3), s);
      if (chance(laundry)) K.laundry(b, f, y + 1.0, z, s);
    }
  };
  K.ac = (b, x, y, z, s) => {
    b.box(VC.solid, pick(['#d8dad6', '#cfd2ce', '#e2e2dc', '#c4c8c4', '#b8bcb8']), x, y, z, 0.5, 0.48, 0.7);
    b.box(VC.solid, '#4e5254', x - s * 0.252, y, z, 0.01, 0.34, 0.52);
  };
  K.cage = (b, f, y, z, s) => {
    const x = f - s * 0.26;
    b.add(G.box, K.grilleMat, x, y + 1.5, z, 0.52, 1.9, 1.7);
    b.box(VC.metal, '#3a3e40', x, y + 0.55, z, 0.56, 0.05, 1.74);
    for (let k = randi(1, 3); k > 0; k--) { const r = rand(0.28, 0.46); b.add(OCT, VC.solid, x + rand(-0.08, 0.08), y + 0.78, z + rand(-0.6, 0.6), r, r, r, 0, rand(0, 1), 0, pick(['#3a7a3a', '#2a6a32', '#5a8a3a', '#c8202c'])); }
  };
  K.laundry = (b, f, y, z, s) => {   // a bamboo pole poked out of a window, shirts and trousers hung along it
    const x0 = f - s * 0.1, x1 = f - s * rand(1.3, 1.9), yy = y + rand(0, 0.25);
    beam(b, VC.solid, x0, yy, z, x1, yy + 0.25, z, 0.04, '#c8b078');
    for (let t = 0.22; t < 0.95; t += rand(0.18, 0.3)) {
      const x = x0 + (x1 - x0) * t, y2 = yy + 0.25 * t, q = Math.random(), col = pick(LAUNDRY);
      if (q < 0.5) b.box(VC.solid, col, x, y2 - 0.32, z, 0.46, 0.6, 0.03);
      else if (q < 0.8) b.box(VC.solid, col, x, y2 - 0.45, z, 0.32, 0.9, 0.03);
      else b.box(VC.solid, col, x, y2 - 0.25, z, 0.3, 0.5, 0.02);
    }
  };
  // a neon sign hung out from the facade at f, its faces toward the two ends of the street; y is its bottom
  K.neon = (b, f, y, z, s, { v = true, i, w, flick = chance(0.14), tint = 1 } = {}) => {
    const rect = v ? K.vRects[i ?? randi(0, V_NEON.length - 1)] : K.hRects[i ?? randi(0, H_NEON.length - 1)];
    w = w ?? (v ? rand(1.3, 2.1) : rand(3.4, 6.0));
    const h = v ? w * 4 : w / 2.4, mat = (flick ? K.neonFlick : K.neonMat)[v ? 0 : 1], xc = f - s * (0.45 + w / 2), yc = y + h / 2, xo = xc - s * w / 2;
    const c = hdr('#ffffff', tint * rand(0.9, 1.1));
    b.box(VC.metal, '#16141a', xc, yc, z, w + 0.18, h + 0.18, 0.24);
    b.add(planeUV(rect), mat, xc, yc, z + 0.125, w, h, 1, 0, 0, 0, c);
    b.add(planeUV(rect), mat, xc, yc, z - 0.125, w, h, 1, 0, Math.PI, 0, c);
    beam(b, VC.metal, f, y + h + 0.13, z, xo, y + h + 0.13, z, 0.08, '#2a2a30');
    beam(b, VC.metal, f, y + h + 1.4 + w * 0.15, z, xo, y + h + 0.18, z, 0.06, '#2a2a30');
    beam(b, VC.metal, f, y - 0.06, z, f - s * 0.45, y - 0.06, z, 0.08, '#2a2a30');
    return { top: y + h, xo };
  };
  // the same hung from a wall that faces nz (along z) out over a side street, its faces up and down that street (along x)
  K.neonZ = (b, fz, y, x, nz, { v = true, w, max = 6 } = {}) => {
    const rect = v ? K.vRects[randi(0, V_NEON.length - 1)] : K.hRects[randi(0, H_NEON.length - 1)], mat = (chance(0.14) ? K.neonFlick : K.neonMat)[v ? 0 : 1];
    w = Math.min(w ?? (v ? rand(1.3, 2.1) : rand(3.0, 4.6)), max - 0.45);
    const h = v ? w * 4 : w / 2.4, zc = fz + nz * (0.45 + w / 2), yc = y + h / 2, c = hdr('#ffffff', rand(0.9, 1.1));
    b.box(VC.metal, '#16141a', x, yc, zc, 0.24, h + 0.18, w + 0.18);
    b.add(planeUV(rect), mat, x + 0.125, yc, zc, w, h, 1, 0, Math.PI / 2, 0, c);
    b.add(planeUV(rect), mat, x - 0.125, yc, zc, w, h, 1, 0, -Math.PI / 2, 0, c);
    beam(b, VC.metal, x, y + h + 0.13, fz, x, y + h + 0.13, zc + nz * w / 2, 0.08, '#2a2a30');
    beam(b, VC.metal, x, y + h + 1.2 + w * 0.15, fz, x, y + h + 0.18, zc + nz * w / 2, 0.06, '#2a2a30');
  };
  // a projecting sign somewhere up a building, matched now and then to a shop below
  K.hangSign = (b, i, { v = chance(0.62), y, reach = 26 } = {}) => {
    const s = i.side, top = i.h - 1.2, lim = i.signMax ?? Math.abs(i.face) - 4.85;   // horizontal boards stop short of the track (or the side street's middle)
    if (top < GF + 4) return;
    const z = -(i.z0 + BAY * randi(0, i.n) + rand(-0.2, 0.2)), w = v ? rand(1.3, 2.4) : rand(Math.min(3.4, lim * 0.6), Math.min(6.2, lim));
    const h = v ? w * 4 : w / 2.4, yy = y ?? GF + 1.2 + Math.pow(Math.random(), 1.35) * Math.max(0.1, Math.min(top - h, reach) - GF - 1.2);
    K.neon(b, i.face, yy, Math.min(-i.z0 - 0.3, Math.max(-i.z1 + 0.3, z)), s, { v, w });
  };
  // the roof: a parapet, water tanks on their stands, the stair hut, aerials, perhaps a great neon billboard
  K.roof = (b, i, { sign = 0.15 } = {}) => {
    const s = i.side, f = i.face, H = i.h;
    b.box(VC.solid, '#bcb8b0', f - s * 0.12, H + 0.45, i.z, 0.24, 0.9, i.len);
    if (chance(0.7)) {
      const x = i.x + s * rand(-2, 3), z = i.z + rand(-i.len / 3, i.len / 3);
      for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) b.box(VC.metal, '#5a5e60', x + dx, H + 0.7, z + dz, 0.08, 1.4, 0.08);
      b.cyl(VC.solid, pick(['#d8dce0', '#3a6ab8', '#e8e8e4']), x, H + 2.2, z, 0.9, 1.6, 'cyl');
    }
    if (chance(0.5)) b.block(VC.solid, '#b8b4ac', i.x + s * rand(0, 3), H, i.z + rand(-i.len / 4, i.len / 4), 3, 2.6, 2.6);
    if (chance(0.5)) { const x = i.x + s * rand(-3, 3), z = i.z + rand(-i.len / 3, i.len / 3); b.box(VC.metal, '#4a4e52', x, H + 2, z, 0.06, 4, 0.06); for (let k = 0; k < 3; k++) b.box(VC.metal, '#4a4e52', x, H + 2.6 + k * 0.5, z, 0.04, 0.04, 1.4 - k * 0.3); }
    if (chance(sign)) K.roofSign(b, i);
  };
  K.roofSign = (b, i) => {   // a rooftop billboard on its lattice frame, its faces up and down the street
    const w = Math.min(i.d - 1.5, rand(7, 11)), h = w / 2.4, y = i.h + 1.4, k = randi(0, H_NEON.length - 1), c = hdr('#ffffff', rand(0.95, 1.15));
    b.box(VC.metal, '#16141a', i.x, y + h / 2, i.z, w + 0.24, h + 0.24, 0.3);
    b.add(planeUV(K.hRects[k]), K.neonMat[1], i.x, y + h / 2, i.z + 0.16, w, h, 1, 0, 0, 0, c);
    b.add(planeUV(K.hRects[k]), K.neonMat[1], i.x, y + h / 2, i.z - 0.16, w, h, 1, 0, Math.PI, 0, c);
    for (let x = -w / 2; x <= w / 2 + 0.01; x += w / 4) { beam(b, VC.metal, i.x + x, i.h, i.z - 1.2, i.x + x, y, i.z, 0.08, '#2a2a30'); beam(b, VC.metal, i.x + x, i.h, i.z + 1.2, i.x + x, y, i.z, 0.08, '#2a2a30'); }
  };
  // bamboo scaffolding over a facade, the green netting, a catch fan sloping out over the pavement
  K.scaffold = (b, i) => {
    const s = i.side, f = i.face, L = i.len, H = i.h + 1;
    b.add(K.tiled(Math.max(1, Math.round(L / 2))), K.bambooMat, f - s * 0.9, H / 2, i.z, L, H, 1, 0, face(s), 0);
    for (let k = 0; k <= Math.round(L / 2); k++) b.cyl(VC.solid, '#c8a868', f - s * 0.95, H / 2, i.z - L / 2 + (k * L) / Math.round(L / 2), 0.05, H, 'cyl6');
    const y0 = GF + FH * randi(1, 3);
    b.add(G.plane, K.netMat, f - s * 1.0, (y0 + H) / 2, i.z, L, H - y0, 1, 0, face(s), 0);
    b.add(G.box, K.bambooMat, f - s * 1.9, 5.2, i.z, 2.2, 0.06, L, 0, 0, -s * 0.6, 0xffffff);
    b.add(G.box, K.netMat, f - s * 1.92, 5.24, i.z, 2.2, 0.03, L, 0, 0, -s * 0.6, 0xffffff);
    if (chance(0.6)) K.hangSign(b, i, { v: true });
  };
  // verandah shophouses: the arcade's columns at the kerb, a balcony on every floor with its balustrade
  K.verandahRow = (b, s, z0, z1, { shops = TRAM_SHOPS, x0 = 12.6, col = EDGE + 5.8 } = {}) => {
    let z = z0;
    b.add(G.plane, K.paveMat, s * (EDGE + 7 + (x0 - EDGE - 7) / 2), 0.02, -(z0 + z1) / 2, x0 - EDGE - 7, z1 - z0, 1, -Math.PI / 2, 0, 0);
    while (z1 - z >= BAY) {
      const n = Math.min(2 * randi(1, 2), Math.floor((z1 - z) / BAY)), L = n * BAY, d = 12, fl = randi(3, 4), h = GF + fl * 3.4;
      const cx = s * (x0 + d / 2), cz = -(z + L / 2), f = s * x0, wall = pick(['#c8bca4', '#bcb4a0', '#c4b8a8', '#b8b8ac', '#ccc0a8', '#b4bca8']);
      b.block(VC.solid, '#2e2c2c', cx, 0, cz, d, GF, L);
      b.addM(buildingGeo(d, fl * 3.4, L, K.ver, BAY, 3.4), K.verMat, at(cx, GF, cz), wall);
      const i = { x: cx, z: cz, d, len: L, h, side: s, face: f, z0: z, z1: z + L, n, floors: fl };
      K.ground(b, i, shops);
      const xc = s * col, xf = (s * col + f) / 2, dw = Math.abs(f - xc);
      for (let k = 0; k <= n; k += 2) { const zz = -(z + k * BAY); b.box(VC.solid, wall, xc, h / 2, zz, 0.5, h, 0.5); }   // the columns
      for (let r = 0; r < fl; r++) {
        const y = GF + r * 3.4;
        b.box(VC.solid, wall, xf, y, cz, dw + 0.6, 0.3, L);   // the floor slab over the arcade
        b.box(VC.solid, shade(wall, 0.92), xc, y + 0.95, cz, 0.22, 0.1, L - 0.2);   // the balustrade
        b.add(K.tiled(Math.max(1, Math.round(L / 0.9))), K.balMat, xc, y + 0.55, cz, L - 0.3, 0.75, 1, 0, Math.PI / 2, 0, wall);
        if (chance(0.25)) for (let k = 0; k < 4; k++) b.box(VC.solid, pick(LAUNDRY), xc - s * 0.1, y + 1.9, cz + rand(-L / 2.5, L / 2.5), 0.03, 0.6, 0.5);
        if (chance(0.3)) b.box(VC.glow, hdr(pick(WARMW), 0.9), xf, y + 2.9, cz + rand(-L / 3, L / 3), 0.4, 0.06, 0.4);
      }
      b.box(VC.solid, shade(wall, 0.85), xf, h + 0.4, cz, dw + 0.8, 0.8, L);   // the parapet
      for (let k = 0; k < n; k++) if (chance(0.5)) {   // a vertical signboard hung under the verandah
        const zz = -(z + (k + 0.5) * BAY), sb = pick(BOARDS);
        b.box(VC.solid, sb[1], xc - s * 0.02, 2.9, zz, 0.05, 2.2, 0.55);
        b.box(VC.glow, hdr(sb[2], 0.7), xc - s * 0.05, 2.9, zz, 0.02, 1.9, 0.3);
      }
      z += L;
    }
  };
  // glass towers over their podiums: the lit lobby, the tower set back above
  K.towerRow = (b, s, z0, z1, { x0 = 11.4 } = {}) => {
    let z = z0;
    while (z1 - z > 8) {
      const L = Math.min(rand(16, 30), z1 - z), d = rand(18, 26), cx = s * (x0 + d / 2), cz = -(z + L / 2), f = s * x0, hp = rand(9, 14), ht = rand(60, 140);
      const tex = chance(0.6) ? [K.office, K.officeMat] : [K.office2, K.office2Mat];
      b.block(VC.solid, '#3a3e48', cx, 0, cz, d, hp, L);
      b.add(K.tiled(Math.max(1, Math.round(L / 9))), K.lobbyMat, f - s * 0.04, 3.2, cz, L - 1.2, 5.6, 1, 0, face(s), 0, hdr('#ffffff', rand(0.85, 1.1)));   // the lobby behind its glass
      for (let zz = -z - 1.5; zz > -z - L + 1; zz -= 2.2) b.box(VC.metal, '#2a2e36', f - s * 0.08, 3.2, zz, 0.08, 5.8, 0.12);
      b.box(VC.solid, '#5a6070', f - s * 0.6, 6.3, cz, 1.2, 0.3, L);
      if (chance(0.3)) b.add(K.tiled(Math.max(1, Math.round(L / 7))), K.screenBand, f - s * 0.05, 8.3, cz, L - 2, 0.8, 1, 0, face(s), 0);
      b.addM(buildingGeo(d - 2, ht, L - 2, tex[0], 1.5, 3.8), tex[1], at(cx + s * 1, hp, cz), pick(['#ffffff', '#d8e4ff', '#e8f0ff', '#c8d8f0']));
      const i = { x: cx, z: cz, d, len: L, h: hp, side: s, face: f, z0: z, z1: z + L };
      if (chance(0.35)) K.led(b, i);
      z += L + rand(0.5, 3);
    }
  };
  K.lobbyMat = basic({ map: canvasTex(256, 128, (g, w, h) => {   // a tower's lobby at night: the lit ceiling, marble, the reception desk, a few late workers
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff4e0'); gr.addColorStop(0.35, '#a89880'); gr.addColorStop(1, '#3a3430'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let x = 16; x < w; x += 32) { g.fillStyle = '#ffffff'; g.fillRect(x - 8, 4, 16, 3); }
    g.fillStyle = '#2a2420'; g.fillRect(w * 0.35, h * 0.66, w * 0.3, h * 0.2); g.fillStyle = '#e8c890'; g.fillRect(w * 0.35, h * 0.64, w * 0.3, 3);
    for (let k = 0; k < 4; k++) { const x = rand(10, w - 10); g.fillStyle = 'rgba(20,16,16,0.85)'; g.beginPath(); g.arc(x, h * 0.6, 4, 0, 7); g.fill(); g.fillRect(x - 4, h * 0.64, 8, 22); }
    g.fillStyle = 'rgba(16,18,24,0.9)'; for (let x = 0; x <= w; x += 32) g.fillRect(x - 1.5, 0, 3, h); g.fillRect(0, h * 0.5, w, 2);
  }), vertexColors: true, color: hdr('#ffffff', 0.55) });
  K.screenBand = basic({ map: canvasTex(512, 32, (g, w, h) => {   // a bank's ticker: the index and the stocks, up in green, down in red
    g.fillStyle = '#05070c'; g.fillRect(0, 0, w, h); g.font = `900 20px ${HEI}`; g.textBaseline = 'middle';
    let x = 6; for (const [t, up] of [['恒指 HSI ▲ 1.24%', 1], ['0005 ▼ 0.6', 0], ['0700 ▲ 2.3', 1], ['0388 ▲ 0.9', 1], ['1299 ▼ 1.1', 0]]) { g.fillStyle = up ? '#39ff88' : '#ff3a4a'; g.fillText(t, x, h / 2); x += g.measureText(t).width + 18; }
  }), color: hdr('#ffffff', 1.3) });
  K.led = (b, i) => {   // a big LED screen on the podium, cycling its adverts
    const s = i.side, w = Math.min(i.len - 2, rand(8, 12)), h = w * 0.625;
    b.box(VC.metal, '#1a1c22', i.face - s * 0.15, i.h + h / 2 - 0.5, i.z, 0.3, h + 0.4, w + 0.4);
    b.add(G.plane, K.screen, i.face - s * 0.31, i.h + h / 2 - 0.5, i.z, w, h, 1, 0, face(s), 0, screenTint(1));
  };
  // public housing slabs: the dense facade, corridor lights along each floor, a name on the end wall
  K.estateRow = (b, s, z0, z1, { x0 = 12 } = {}) => {
    let z = z0;
    while (z1 - z > 10) {
      const L = Math.min(rand(24, 40), z1 - z), d = 14, fl = randi(14, 22), h = GF + fl * 2.8, cx = s * (x0 + d / 2), cz = -(z + L / 2), f = s * x0;
      b.block(VC.solid, '#3a3836', cx, 0, cz, d, GF, L);
      b.addM(buildingGeo(d, fl * 2.8, L, K.dense, 2.0, 2.8), K.denseMat, at(cx, GF, cz), pick(['#f4e8c8', '#e0ecf4', '#f4dcd8', '#dcecd8', '#f0f0e8']));
      for (let r = 0; r < fl; r += 1) if (chance(0.5)) b.box(VC.glow, hdr('#e8fff4', 0.9), f - s * 0.03, GF + r * 2.8 + 2.4, cz + rand(-L / 4, L / 4), 0.04, 0.05, rand(2, 6));   // corridor tubes
      const i = { x: cx, z: cz, d, len: L, h, side: s, face: f, z0: z, z1: z + L, n: Math.floor(L / BAY) };
      K.ground(b, i, ESTATE_SHOPS);
      b.box(VC.solid, '#c8c4bc', f - s * 0.12, h + 0.5, cz, 0.24, 1, L);
      z += L + rand(6, 12);
    }
  };

  // the towers behind a street's row, rising over its roofs further down the street (kept out of the gaps, distances, where side streets run)
  K.backRow = (b, s, { gaps = [], x0 = 28.5, office = 0.25, sign = 0.3 } = {}) => {
    let z = rand(0.5, 5);
    while (z < CHUNK_LEN - 8) {
      const L = Math.min(rand(12, 22), CHUNK_LEN - 0.5 - z), d = rand(12, 20), xi = x0 + rand(0, 10);
      if (!gaps.some(([a, c]) => z + L > a && z < c)) {
        const off = chance(office), h = off ? rand(60, 130) : GF + randi(18, 36) * 2.8, cx = s * (xi + d / 2), cz = -(z + L / 2);
        const T = off ? [K.office2, K.office2Mat, 1.5, 3.8] : [K.dense, K.denseMat, 2.0, 2.8];
        b.addM(buildingGeo(d, h, L, T[0], T[2], T[3]), T[1], at(cx, 0, cz), pick(off ? ['#ffffff', '#d8e4ff', '#e8f0ff'] : ['#f4e8c8', '#e0ecf4', '#f4dcd8', '#dcecd8', '#f0f0e8', '#e8e0d0']));
        K.roof(b, { x: cx, z: cz, d, len: L, h, side: s, face: s * xi, z0: z, z1: z + L }, { sign });
      }
      z += L + rand(1.5, 8);
    }
  };
  // A side street opening off the main one on side s, centred at distance zj and W wide: the road running away between rows of tong
  // lau and their signs (built as a street of its own, then turned into place), and at its mouth the corners, the lights, the zebra
  // and the crowd waiting at the kerb. Its rows begin at x1, behind the main street's corner buildings.
  K.sideStreet = (b, s, zj, W, { x1 = 27.6, L = 44, shops = NEON_SHOPS, signs = 1.4, floors = [6, 12], crowd = 1, plate = pick(SIDE_STREETS) } = {}) => {
    const sb = new Batcher(), R = W / 2, P = 2.2, n0 = K.steamBuf.length;
    for (const k of [-1, 1]) {
      K.row(sb, k, 0, L, { x0: R, floors, shops, signs, roofSign: 0.1, scaffold: 0.06, kiosk: 0.1, upper: 0.25, signMax: R - 1.3, reach: 22 });
      sb.add(K.tiled2(1, Math.round(L / 2)), K.paveMat, k * (R - P / 2), 0.035, -L / 2, P, L, 1, -Math.PI / 2, 0, 0);
      sb.box(VC.solid, '#8a8a88', k * (R - P), 0.05, -L / 2, 0.2, 0.1, L);
      K.throng(sb, k * (R - 0.5), k * (R - P + 0.3), 1, L - 1, Math.round(rand(6, 11) * crowd));
      for (let z = rand(5, 10); z < L - 4; z += rand(16, 22)) K.lamp(sb, k * (R - P + 0.3), -z, k);
    }
    K.road(sb, 0, -L / 2, W - 2 * P, L);
    for (let z = 2; z < L; z += 4) K.paint(sb, 0, -z, 0.12, 1.8, hdr('#e8e8e2', 0.45));
    for (let k = randi(0, 2); k > 0; k--) { const e = pick([-1, 1]); pick([K.taxi, K.van, K.car])(sb, e * (R - P - 1.0), -rand(8, L - 6), -e); }
    const g = sb.build(), m = new THREE.Matrix4().makeRotationY(-s * Math.PI / 2).setPosition(s * x1, 0, -zj), v = new THREE.Vector3();
    for (const mesh of g.children) { b.addM(mesh.geometry, mesh.material, m, null); mesh.geometry.dispose(); }
    for (let k = n0; k < K.steamBuf.length; k++) K.steamBuf[k] = v.fromArray(K.steamBuf[k]).applyMatrix4(m).toArray();
    // the mouth, from the main street's kerb to where the rows begin
    const xm = (s * (KERB + x1)) / 2, Lm = x1 - KERB, xz = s * (KERB + 2.5);
    K.road(b, xm, -zj, Lm, W - 2 * P, 'x');
    for (const k of [-1, 1]) {
      b.add(K.tiled2(Math.round((x1 - EDGE - 7) / 2), 1), K.paveMat, (s * (EDGE + 7 + x1)) / 2, 0.035, -zj + k * (R - P / 2), x1 - EDGE - 7, P, 1, -Math.PI / 2, 0, 0);
      b.box(VC.solid, '#8a8a88', xm, 0.05, -zj + k * (R - P), Lm, 0.1, 0.2);
      K.signal(b, s * (KERB + 0.35), -zj + k * (R - P + 0.5), s);
      const zk = zj - k * (R - P);   // the kerb's distance; the crowd waits on the pavement side of it
      K.throng(b, s * (KERB + 0.6), s * (KERB + 3.9), zk - k * 0.25, zk - k * 2.6, Math.round(rand(5, 10) * crowd));
      K.look(b, xz, -zj + k * (R - P - 0.75), k);
    }
    for (const k of [-1, 1]) {   // the corner buildings' flanks along the mouth: their shopfronts lit, signs hung out over the side street
      const zw = -zj - k * R, nz = k, n = 2, sl = (22.6 - (EDGE + 7.4)) / n;   // (as deep as the shallowest building)
      for (let q = 0; q < n; q++) K.shopZ(b, s * (EDGE + 7.4 + sl * (q + 0.5)), zw, nz, sl - 0.2, pickW(shops));
      for (let q = randi(1, 3); q > 0; q--) K.neonZ(b, zw, rand(GF + 0.8, 14), s * rand(EDGE + 8.5, 21.5), nz, { v: chance(0.65), max: R - 1.4 });
    }
    K.zebra(b, xz, -zj, 2.8, W - 2 * P - 0.5, 'x');
    K.throng(b, s * (KERB + 1.4), s * (KERB + 3.6), zj - R + P + 0.4, zj + R - P - 0.4, randi(1, 4));
    K.streetSign(b, s * (KERB + 0.5), -zj - (R - P + 1.2), plate);
  };

  // ---------- street furniture ----------
  K.paveMat = std({ map: canvasTex(128, 128, (g, w, h) => {   // the arcades' and squares' paving: grey squares
    g.fillStyle = '#4a4a50'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { const v = randi(-8, 8); g.fillStyle = `rgb(${92 + v},${92 + v},${96 + v})`; g.fillRect(x + 1, y + 1, 14, 14); }
  }), roughness: 0.85 });
  K.lamp = (b, x, z, s) => {   // a tall grey lamp post at the kerb, its arm out over the road and an amber sodium lantern
    b.cyl(VC.metal, '#6a7078', x, 4, z, 0.1, 8, 'cyl8');
    b.cyl(VC.metal, '#6a7078', x, 0.4, z, 0.17, 0.8, 'cyl8');
    beam(b, VC.metal, x, 7.7, z, x - s * 1.1, 8.15, z, 0.08, '#6a7078');
    b.box(VC.metal, '#4a5058', x - s * 1.25, 8.12, z, 0.62, 0.16, 0.3);
    b.box(VC.glow, hdr('#ffb04a', 2.8), x - s * 1.25, 8.02, z, 0.5, 0.06, 0.22);
    K.pool(b, x - s * 0.9, z, 6, 6, hdr('#ffa040', 0.09));
  };
  K.railing = (b, s, z0, z1, x = s * (EDGE + 0.3)) => {   // the kerbside guard rail
    const L = z1 - z0, zc = -(z0 + z1) / 2;
    b.add(K.tiled(Math.max(1, Math.round(L / 1.2))), K.railMat, x, 0.55, zc, L, 1.0, 1, 0, Math.PI / 2, 0);
    b.box(VC.metal, '#a8b0b4', x, 1.08, zc, 0.06, 0.06, L);
    for (let z = z0; z <= z1 + 0.01; z += 2.4) b.box(VC.metal, '#98a0a4', x, 0.55, -z, 0.07, 1.1, 0.07);
  };
  K.rails = (b, s, gaps = [], x = s * (EDGE + 0.3)) => {   // the kerb railing along a whole chunk, gaps left at the crossings
    let z = 0;
    for (const [g0, g1] of [...gaps, [80, 80]].sort((a, c) => a[0] - c[0])) { if (g0 - z > 2.5) K.railing(b, s, z + 0.3, g0 - 0.3, x); z = Math.max(z, g1); }
  };
  K.bin = (b, x, z) => {   // an orange litter bin with its ashtray lid
    b.cyl(VC.solid, '#e8741a', x, 0.45, z, 0.27, 0.9, 'cyl8');
    b.cyl(VC.solid, '#2a2a2e', x, 0.95, z, 0.29, 0.1, 'cyl8');
    b.box(VC.solid, '#f4f4f0', x, 0.6, z, 0.56, 0.08, 0.56);
  };
  K.postbox = (b, x, z) => {   // a green pillar box
    b.cyl(VC.solid, '#1f6a3a', x, 0.6, z, 0.3, 1.2, 'cyl');
    b.add(G.sph, VC.solid, x, 1.2, z, 0.62, 0.36, 0.62, 0, 0, 0, '#1f6a3a');
    b.box(VC.solid, '#141414', x, 0.95, z, 0.62, 0.05, 0.22);
  };
  K.newsstand = (b, x, z, s) => {   // a newspaper stall: magazines fanned out on a sloping board under a tarpaulin
    b.block(VC.solid, '#3a4a5a', x, 0, z, 1.0, 1.1, 2.0);
    b.add(planeUV(K.goodsRects[6]), K.goodsMat, x - s * 0.6, 1.08, z, 1.9, 0.75, 1, -0.5, face(s), 0);
    b.add(G.box, VC.solid, x, 2.2, z, 1.8, 0.05, 2.3, 0, 0, s * 0.2, pick(['#1f5aa8', '#2a7a4a', '#c8202c']));
    for (const dz of [-1, 1]) b.box(VC.metal, '#5a6068', x + s * 0.4, 1.1, z + dz, 0.05, 2.2, 0.05);
    K.person(b, x + s * 0.2, z + 0.4, { phone: false });
  };
  K.signal = (b, x, z, s) => {   // traffic signals: the red, amber and green, the green man, the yellow push-button box
    b.cyl(VC.metal, '#3a3e44', x, 2.0, z, 0.07, 4, 'cyl8');
    b.box(VC.metal, '#1a1c20', x, 3.6, z + 0.12, 0.32, 0.9, 0.22);
    const lit = randi(0, 2);
    ['#ff2a2a', '#ffb020', '#39ff88'].forEach((c, k) => b.cyl(VC.glow, hdr(c, k === lit ? 3 : 0.15), x, 3.9 - k * 0.3, z + 0.24, 0.09, 0.03, 'cyl8', Math.PI / 2));
    b.box(VC.metal, '#1a1c20', x, 2.5, z + 0.12, 0.26, 0.5, 0.2);
    b.box(VC.glow, hdr(chance(0.5) ? '#39ff88' : '#ff2a2a', 2.2), x, 2.5, z + 0.23, 0.14, 0.3, 0.02);
    b.box(VC.solid, '#f2c230', x - s * 0.1, 1.1, z, 0.12, 0.3, 0.16);
  };
  K.streetSign = (b, x, z, i = randi(0, STREETS.length - 1)) => {
    b.cyl(VC.metal, '#5a6068', x, 1.4, z, 0.04, 2.8, 'cyl6');
    b.add(planeUV(K.streetRects[i]), K.streetMat, x, 2.9, z, 1.5, 0.56, 1, 0, 0, 0);
  };
  K.busStop = (b, x, z, s) => {   // a bus stop: the shelter, the route board, a bench
    for (const dz of [-1.8, 1.8]) b.box(VC.metal, '#7a8088', x + s * 0.6, 1.3, z + dz, 0.08, 2.6, 0.08);
    b.box(VC.metal, '#9aa0a8', x, 2.65, z, 1.8, 0.08, 4.0);
    b.box(VC.glow, hdr('#e8f0ff', 1.0), x + s * 0.7, 1.4, z, 0.04, 1.6, 2.8);
    b.box(VC.solid, '#c8202c', x - s * 0.7, 2.4, z + 2.2, 0.04, 0.9, 0.5);
    b.box(VC.solid, '#5a5a62', x + s * 0.3, 0.45, z, 0.4, 0.06, 2.8);
  };
  // pedestrian footbridge over the road between podiums: a glazed corridor under its roof
  K.footbridge = (b, z, { y = 13.8, W = 16 } = {}) => {   // (high enough that the jetpack and its camera pass under)
    b.box(VC.solid, '#5a606c', 0, y + 0.2, z, 2 * W, 0.4, 3.4);
    b.box(VC.glow, hdr('#e0ecff', 0.75), 0, y + 1.0, z + 1.62, 2 * W - 0.4, 1.2, 0.04);
    b.box(VC.glow, hdr('#e0ecff', 0.75), 0, y + 1.0, z - 1.62, 2 * W - 0.4, 1.2, 0.04);
    for (let x = -W + 1; x < W; x += 2) for (const e of [-1, 1]) b.box(VC.metal, '#3a3e48', x, y + 1.0, z + e * 1.64, 0.08, 1.3, 0.06);
    b.box(VC.solid, '#7a808c', 0, y + 1.75, z, 2 * W, 0.28, 3.8);
    b.box(VC.glow, hdr('#fff4dc', 0.8), 0, y - 0.02, z, 2 * W - 2, 0.04, 1.2);
    for (const e of [-1, 1]) { b.box(VC.metal, '#6a707c', e * (KERB + 0.4), y / 2, z, 0.5, y, 0.5); b.box(VC.solid, '#5a606c', e * (W - 1), y / 2, z, 1.4, y, 2.6); }
    for (let k = 0; k < 5; k++) K.person(b, rand(-W + 2, W - 2), z + rand(-0.8, 0.8), { y: y + 0.4 });
    b.box(VC.solid, '#1a2a5a', 0, y + 0.2, z + 1.72, 5, 0.42, 0.04);
    b.box(VC.glow, hdr('#ffffff', 1.1), 0, y + 0.2, z + 1.75, 4.4, 0.08, 0.02);
  };

  // the lane beside the track, between the track's edge and the kerb (its stones cut where side streets open: gaps in distance)
  K.kerbLane = (b, s, z0 = 0, z1 = CHUNK_LEN, { gaps = [] } = {}) => {
    const L = z1 - z0;
    b.add(K.tiled2(1, Math.max(1, Math.round(L / 4))), K.laneMat, s * (EDGE + 0.2 + LANE / 2), 0.03, -(z0 + z1) / 2, LANE, L, 1, -Math.PI / 2, 0, s > 0 ? 0 : Math.PI);
    let z = z0;
    for (const [g0, g1] of [...gaps, [z1, z1]].sort((a, c) => a[0] - c[0])) {
      if (g0 - z > 0.5) b.box(VC.solid, '#8a8a88', s * (KERB + 0.06), 0.05, -(z + g0) / 2, 0.22, 0.1, g0 - z);
      z = Math.max(z, g1);
    }
  };
  // a zebra crossing: white bars `along` long laid side by side across a road `across` wide; dir is the bars' long axis
  K.zebra = (b, x, z, along, across, dir = 'x', { w = 0.5, gap = 0.5, col } = {}) => {
    const n = Math.max(1, Math.floor((across + gap) / (w + gap))), o = -((n - 1) * (w + gap)) / 2;
    for (let k = 0; k < n; k++) { const t = o + k * (w + gap); if (dir === 'x') K.paint(b, x, z + t, along, w, col); else K.paint(b, x + t, z, w, along, col); }
  };
  K.shrine = (b, f, z, s) => {   // a doorway shrine to the earth god: the little red altar on the step, its lamp, three joss sticks glowing
    const x = f - s * 0.22;
    b.block(VC.solid, '#a8141e', x, 0, z, 0.3, 0.42, 0.42);
    b.box(VC.glow, hdr('#ff3a1a', 2.4), x - s * 0.16, 0.24, z, 0.02, 0.16, 0.24);
    for (const dz of [-0.07, 0, 0.07]) b.box(VC.glow, hdr('#ff8a3a', 3), x - s * 0.06, 0.53, z + dz, 0.02, 0.22, 0.02);
  };
  K.trolley = (b, x, z, { pusher = chance(0.65), card = chance(0.4) } = {}) => {   // a hand trolley stacked with cartons, or with the cardboard an old woman has gathered
    b.box(VC.metal, '#5a6068', x, 0.08, z, 0.62, 0.06, 0.92);
    for (const e of [-1, 1]) beam(b, VC.metal, x + e * 0.26, 0.1, z + 0.46, x + e * 0.26, 1.15, z + 0.52, 0.03, '#5a6068');
    b.box(VC.metal, '#5a6068', x, 1.15, z + 0.52, 0.56, 0.03, 0.03);
    if (card) for (let k = 0; k < 6; k++) b.box(VC.solid, pick(['#b88a4a', '#a87a3a', '#c8a060']), x + rand(-0.04, 0.04), 0.15 + k * 0.12, z - 0.02, 0.6 + rand(-0.06, 0.1), 0.1, 0.86);
    else for (let k = randi(2, 4); k > 0; k--) b.box(VC.solid, pick(['#b88a4a', '#c89a5a', '#a87a3a', '#d8c8a8', '#f0ece0']), x + rand(-0.03, 0.03), 0.3 + (k - 1) * 0.38, z - 0.04, 0.56, 0.36, 0.78);
    if (pusher) K.person(b, x, z + 0.95, { phone: false, bag: false, coat: card ? pick(['#5a4a3a', '#3a3a44', '#8a6a5a']) : pick(COATS), s: card ? 0.86 : rand(0.92, 1.02) });
  };
  K.mtrExit = (b, x, z, st = randi(0, STATIONS.length - 1)) => {   // an MTR exit on the pavement: the glazed hood over the stairs going down, the station's sign on its roof
    const W = 2.3, Lz = 5.0, H = 2.7;
    for (const e of [-1, 1]) {
      b.box(VC.metal, '#c8ccd0', x + e * W / 2, H / 2, z, 0.08, H, Lz);
      b.box(VC.glow, hdr('#dfeaf0', 0.3), x + e * (W / 2 - 0.03), 1.45, z, 0.03, 1.7, Lz - 0.3);
    }
    b.box(VC.solid, '#d8d8d4', x, H + 0.08, z, W + 0.3, 0.16, Lz + 0.3);
    b.box(VC.solid, '#c8c8c4', x, H / 2, z - Lz / 2, W, H, 0.12);
    b.box(VC.glow, hdr('#f4f8ff', 1.2), x, H - 0.05, z, W - 0.5, 0.04, Lz - 1.2);
    b.box(VC.solid, '#3a3a40', x, 0.04, z + 0.2, W - 0.2, 0.04, Lz - 0.5);   // the stairs, going down into the light
    for (let k = 0; k < 6; k++) b.box(VC.glow, hdr('#e8f0ff', 0.6), x, 0.07, z + Lz / 2 - 0.6 - k * 0.7, W - 0.4, 0.02, 0.06);
    b.box(VC.metal, '#2a2a30', x, H + 0.55, z + Lz / 2 - 0.3, W + 0.2, 0.62, 0.12);
    b.add(planeUV(K.mtrRects[st]), K.boxMat, x, H + 0.55, z + Lz / 2 - 0.235, W + 0.1, 0.54, 1, 0, 0, 0, hdr('#ffffff', 0.85));
  };
  // a street-food counter put out in front of a shop: the steel counter and its lit hot cabinet, the pots, the cook in white, a lightbox
  // hung out over the pavement so it reads down the street, the steam and a queue
  K.kiosk = (b, f, zc, s, k = randi(0, SNACKS.length - 1)) => {
    const x = f - s * 0.8, L = 1.8;
    b.box(VC.metal, '#b8bcc0', x, 0.5, zc, 0.8, 1.0, L);
    b.box(VC.glow, hdr('#ffe8b8', 1.0), x - s * 0.06, 1.14, zc, 0.66, 0.28, L - 0.2);
    for (let j = -1; j <= 1; j++) b.cyl(VC.metal, '#9aa0a6', x + s * 0.14, 1.12, zc + j * 0.52, 0.16, 0.2, 'cyl6');
    K.person(b, f - s * 0.3, zc + rand(-0.4, 0.4), { coat: '#f4f4f0', phone: false, bag: false, mask: chance(0.3) });
    const xs = f - s * 1.05, y = 2.55;
    b.box(VC.metal, '#1a1a1e', xs, y, zc, 1.5, 0.56, 0.1);
    b.add(planeUV(K.snackRects[k]), K.boxMat, xs, y, zc + 0.055, 1.4, 0.47, 1);
    b.add(planeUV(K.snackRects[k]), K.boxMat, xs, y, zc - 0.055, 1.4, 0.47, 1, 0, Math.PI, 0);
    beam(b, VC.metal, f, y + 0.3, zc, f - s * 1.8, y + 0.3, zc, 0.05, '#2a2a30');
    K.steamBuf.push([x + s * 0.14, 1.35, zc]);
    K.queue(b, f - s * rand(1.5, 1.8), zc + L / 2 + 0.4, randi(2, 5));
  };

  // ---------- vehicles ----------
  // each faces dir (+1: its nose toward +z, the runner); headlamps at the nose, tail lamps behind
  const lamps = (b, x, z, dir, half, y, dx) => {
    for (const e of [-1, 1]) {
      b.box(VC.glow, hdr('#fff4d6', 2), x + e * dx, y, z + dir * half, 0.32, 0.13, 0.04);
      b.box(VC.glow, hdr('#ff2a2a', 2), x + e * dx, y + 0.06, z - dir * half, 0.28, 0.12, 0.04);
    }
  };
  const wheels = (b, x, z, dx, zs, r) => { for (const dz of zs) for (const e of [-1, 1]) b.cyl(VC.solid, '#141414', x + e * dx, r, z + dz, r, 0.22, 'cyl6', 0, Math.PI / 2); };
  K.taxi = (b, x, z, dir = 1, col = '#c8102e') => {   // a taxi: red in town (green in the New Territories, blue on Lantau), the silver roof, the roof sign lit
    b.block(VC.solid, col, x, 0.3, z, 1.72, 0.72, 4.4);
    b.block(VC.solid, '#d8dce0', x, 1.02, z - dir * 0.2, 1.52, 0.56, 2.3);
    b.box(VC.glow, hdr('#d8e8ff', 0.35), x, 1.3, z - dir * 0.2, 1.54, 0.34, 2.1);
    b.box(VC.glow, hdr('#fff4dc', 1.8), x, 1.68, z - dir * 0.2, 0.55, 0.16, 0.24);
    lamps(b, x, z, dir, 2.21, 0.75, 0.6);
    wheels(b, x, z, 0.76, [-1.35, 1.35], 0.32);
  };
  K.car = (b, x, z, dir = 1, col = pick(['#d8dce0', '#141418', '#f4f4f0', '#5a6068', '#2a3a5a', '#8a1a1a', '#c8c0b0'])) => {   // a private saloon
    b.block(VC.solid, col, x, 0.28, z, 1.78, 0.64, 4.6);
    b.block(VC.solid, col, x, 0.92, z - dir * 0.15, 1.58, 0.5, 2.4);
    b.box(VC.solid, '#121418', x, 1.17, z - dir * 0.15, 1.6, 0.3, 2.2);
    lamps(b, x, z, dir, 2.31, 0.7, 0.62);
    wheels(b, x, z, 0.78, [-1.45, 1.4], 0.31);
  };
  K.van = (b, x, z, dir = 1) => {   // a white van, a company's stripe down its side
    b.block(VC.solid, pick(['#f2f2ee', '#f2f2ee', '#e4e6e8', '#c8ccd0']), x, 0.32, z, 1.86, 1.66, 4.8);
    b.box(VC.solid, '#121418', x, 1.62, z + dir * 1.55, 1.88, 0.5, 1.5);
    b.box(VC.solid, pick(['#c8202c', '#1f5aa8', '#2a8a4a', '#e8a020']), x, 1.0, z - dir * 0.7, 1.88, 0.16, 3.2);
    lamps(b, x, z, dir, 2.41, 0.8, 0.66);
    wheels(b, x, z, 0.82, [-1.6, 1.5], 0.33);
  };
  K.truck = (b, x, z, dir = 1) => {   // a five-tonne lorry: its cab, the canvas tilt over the load
    b.block(VC.solid, pick(['#f2f2ee', '#1f5aa8', '#2a6a4a', '#d8d4c8', '#c8202c']), x, 0.55, z + dir * 2.65, 2.2, 1.85, 1.8);
    b.box(VC.solid, '#121418', x, 1.95, z + dir * 3.56, 2.0, 0.62, 0.04);
    b.block(VC.solid, pick(['#2a6a4a', '#1f5aa8', '#c8b88a', '#8a2a20', '#5a5e64']), x, 0.75, z - dir * 0.95, 2.36, 2.45, 5.2);
    b.box(VC.solid, '#242428', x, 0.5, z, 2.0, 0.3, 7.0);
    lamps(b, x, z, dir, 3.57, 0.85, 0.82);
    wheels(b, x, z, 0.95, [dir * 2.6, -dir * 0.6, -dir * 2.2], 0.45);
  };
  K.minibus = (b, x, z, green = chance(0.5), dir = 1) => {   // a public light bus: cream body, red or green roof, the route card in the windscreen
    const roof = green ? '#1e7a3a' : '#c8202c';
    b.block(VC.solid, '#f2ead6', x, 0.35, z, 2.0, 2.2, 6.6);
    b.box(VC.solid, roof, x, 2.42, z, 2.04, 0.36, 6.4);
    b.box(VC.glow, hdr('#e8f0ff', 0.45), x, 1.75, z - dir * 0.3, 2.04, 0.6, 5.2);
    b.box(VC.glow, hdr('#ffffff', 1.3), x, 2.3, z + dir * 3.32, 0.9, 0.22, 0.03);
    b.box(VC.glow, hdr(green ? '#39ff88' : '#ff4a4a', 1.6), x, 2.05, z + dir * 3.32, 0.4, 0.16, 0.03);
    lamps(b, x, z, dir, 3.31, 0.75, 0.7);
    wheels(b, x, z, 0.9, [-2.2, 2.2], 0.36);
  };
  K.bus = (b, x, z, dir = 1) => {   // a double-decker bus, two decks of lit windows, the route display
    const col = pick(['#c8202c', '#f2c230', '#e8e8e4']), band = col === '#e8e8e4' ? '#c8202c' : '#f4f4f0';
    b.block(VC.solid, col, x, 0.35, z, 2.5, 4.1, 11.5);
    for (const y of [1.7, 3.42]) {   // each deck's glass, dark between the lit panes
      b.box(VC.solid, '#16181e', x, y, z - dir * 0.2, 2.52, 0.92, 10.6);
      for (let k = 0; k < 7; k++) b.box(VC.glow, hdr(pick(['#ffe8c8', '#f0f4ff', '#fff0d8']), rand(0.32, 0.5)), x, y + 0.02, z - dir * 0.2 + (k - 3) * 1.48, 2.54, 0.72, 1.24);
    }
    b.box(VC.glow, hdr('#f4f0e0', 0.45), x, 3.42, z + dir * 5.76, 2.2, 0.7, 0.03);   // the upper deck's front window
    b.box(VC.solid, band, x, 2.55, z, 2.53, 0.3, 11.4);
    b.box(VC.glow, hdr('#ffb020', 1.5), x, 4.12, z + dir * 5.76, 1.6, 0.26, 0.03);
    lamps(b, x, z, dir, 5.76, 0.8, 0.9);
    wheels(b, x, z, 1.1, [dir * 3.6, -dir * 3.8], 0.5);
  };
  // the lane beside the track jammed with traffic for stretches, kept clear of the side streets' mouths (gaps in distance);
  // keeping left, the near side's traffic heads away from the runner (tail lamps), the far side's comes on (headlamps)
  const VEH = { taxi: 4.4, car: 4.6, van: 4.8, truck: 7.2, minibus: 6.6, bus: 11.5 };
  K.jam = (b, s, z0 = 0, z1 = CHUNK_LEN, { fill = 0.55, mix = { taxi: 7, car: 3, van: 2, truck: 1, minibus: 3, bus: 1.2 }, gaps = [] } = {}) => {
    const x = s * (EDGE + 0.2 + LANE / 2);
    let z = z0 + rand(0, 5);
    while (z < z1 - 4.5) {
      const k = pickW(mix), len = VEH[k];
      if (z + len > z1 - 0.3) { z += 2; continue; }
      if (gaps.some(([a, c]) => z + len > a - 0.8 && z < c + 0.8)) { z += 1.5; continue; }
      if (!chance(fill)) { z += rand(5, 12); continue; }
      const zc = -(z + len / 2);
      if (k === 'minibus') K.minibus(b, x, zc, chance(0.5), s); else K[k](b, x, zc, s);
      z += len + rand(0.6, 1.8);
    }
  };

  // the trams' overhead: poles at the kerb, span wires across, a contact wire over every lane
  K.tramWires = (b, z0 = 0, z1 = 80, px = KERB + 0.15) => {   // (the poles stand at the kerb, clear of the lane)
    const L = z1 - z0, zc = -(z0 + z1) / 2;
    for (const x of [-2.5, 0, 2.5]) b.box(VC.metal, '#2a2c30', x, 6.4, zc, 0.04, 0.04, L);
    for (let z = z0 + 10; z < z1; z += 25) {
      for (const s of [-1, 1]) { b.cyl(VC.metal, '#3a4048', s * px, 3.9, -z, 0.12, 7.8, 'cyl8'); b.cyl(VC.metal, '#3a4048', s * px, 7.85, -z, 0.08, 0.12, 'cyl8'); }
      beam(b, VC.metal, -px, 7.3, -z, px, 7.3, -z, 0.03, '#2a2c30');
      for (const x of [-2.5, 0, 2.5]) beam(b, VC.metal, x, 7.3, -z, x, 6.4, -z, 0.025, '#2a2c30');
    }
  };
  K.tramStop = (b, x, z, s) => {   // a tram stop's narrow island: railings, the shelter, the green-and-white sign
    b.block(VC.solid, '#6a6a70', x, 0, z, 1.4, 0.22, 14);
    b.box(VC.metal, '#b8c0c4', x + s * 0.65, 0.75, z, 0.05, 0.05, 14);
    for (let dz = -7; dz <= 7; dz += 1.75) b.box(VC.metal, '#98a0a4', x + s * 0.65, 0.5, z + dz, 0.05, 1.0, 0.05);
    for (const dz of [-4, 4]) b.box(VC.metal, '#5a6068', x + s * 0.4, 1.4, z + dz, 0.08, 2.6, 0.08);
    b.box(VC.solid, '#2a6a4a', x, 2.75, z, 1.6, 0.1, 10);
    b.box(VC.glow, hdr('#e8fff0', 0.9), x, 2.66, z, 1.2, 0.05, 9);
    b.box(VC.solid, '#f4f4f0', x + s * 0.4, 3.2, z + 5, 0.06, 0.6, 1.4);
    b.box(VC.solid, '#2a6a4a', x + s * 0.38, 3.2, z + 5, 0.04, 0.4, 1.2);
    for (let k = randi(2, 5); k > 0; k--) K.person(b, x + rand(-0.3, 0.3), z + rand(-5, 5), { y: 0.22 });
  };

  // ---------- people ----------
  // (built cheaply, since the pavements take hundreds: two legs, the coat, a faceted head and its hair, turned a little)
  K.person = (b, x, z, { s = rand(0.9, 1.04), y = 0, coat = pick(COATS), phone = chance(0.3), bag = chance(0.3), suit = false, mask = chance(0.06), umbrella = chance(0.04), paper = false } = {}) => {
    const a = rand(-0.45, 0.45), ca = Math.cos(a), sa = Math.sin(a), legs = suit ? '#1a1c22' : pick(TROUSERS), top = suit ? '#1a1c22' : coat;
    for (const e of [-1, 1]) b.add(G.box, VC.solid, x + e * 0.085 * s * ca, y + 0.43 * s, z - e * 0.085 * s * sa, 0.15 * s, 0.86 * s, 0.19 * s, 0, a, 0, legs);
    b.add(G.box, VC.solid, x, y + 1.17 * s, z, 0.44 * s, 0.68 * s, 0.27 * s, 0, a, 0, top);
    if (suit) b.add(G.box, VC.solid, x + 0.14 * s * sa, y + 1.36 * s, z + 0.14 * s * ca, 0.12 * s, 0.26 * s, 0.02, 0, a, 0, '#f4f4f0');
    b.add(ICO, VC.solid, x, y + 1.68 * s, z, 0.3 * s, 0.34 * s, 0.3 * s, 0, a, 0, pick(SKIN));
    b.add(G.box, VC.solid, x - 0.025 * s * sa, y + 1.8 * s, z - 0.025 * s * ca, 0.31 * s, 0.13 * s, 0.31 * s, 0, a, 0, pick(HAIR));
    if (mask) b.add(G.box, VC.solid, x + 0.13 * s * sa, y + 1.64 * s, z + 0.13 * s * ca, 0.18 * s, 0.1 * s, 0.03, 0, a, 0, '#e8f0f4');
    if (phone) b.box(VC.glow, hdr('#cfe6ff', 1.5), x + 0.06, y + 1.22 * s, z + 0.2 * s, 0.07, 0.12, 0.02);
    if (paper) b.add(G.box, VC.solid, x + 0.2 * s * sa, y + 1.3 * s, z + 0.2 * s * ca, 0.36, 0.26, 0.02, 0, a, 0, '#ece6d6');   // a racing paper held open
    if (bag) b.box(VC.solid, pick(['#141414', '#c8a070', '#8a2a1a', '#f4f0e8', '#2a3a5a', '#e8e0f0']), x + 0.27 * s, y + 0.95 * s, z, 0.1, 0.34, 0.32);
    if (umbrella) { b.add(G.cone8, VC.solid, x, y + 2.15 * s, z, 1.1, 0.35, 1.1, 0, 0, 0, pick(['#141414', '#1f5aa8', '#c8202c', '#f0d040'])); b.box(VC.metal, '#2a2a2e', x, y + 1.85 * s, z, 0.03, 0.6, 0.03); }
  };
  K.crowd = (b, x0, x1, z0, z1, n, opts = {}) => { for (let i = 0; i < n; i++) K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1), opts); };
  K.throng = (b, x0, x1, z0, z1, n, { gaps = [], ...opts } = {}) => {   // a crowd kept out of the given stretches (distances along the street)
    for (let i = 0, t = 0; i < n && t < n * 4; t++) {
      const z = rand(z0, z1);
      if (gaps.some(([a, c]) => z > a && z < c)) continue;
      K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -z, opts); i++;
    }
  };
  K.queue = (b, x, z, n, dz = 0.62, opts = {}) => { for (let k = 0; k < n; k++) K.person(b, x + rand(-0.12, 0.12), z + k * dz, { phone: chance(0.5), ...opts }); };   // a line along z
  K.seated = (b, x, z, { y = 0.42 } = {}) => {   // someone on a stool, at a table
    b.box(VC.solid, pick(TROUSERS), x, y + 0.12, z, 0.42, 0.14, 0.3);
    b.box(VC.solid, pick(COATS), x, y + 0.5, z, 0.42, 0.56, 0.27);
    b.add(ICO, VC.solid, x, y + 0.95, z, 0.3, 0.34, 0.3, 0, rand(0, 1), 0, pick(SKIN));
    b.box(VC.solid, pick(HAIR), x, y + 1.07, z - 0.02, 0.31, 0.13, 0.31);
  };

  // ---------- markets ----------
  // a night-market stall opening toward the track: a frame, a sloping tarpaulin, goods hung along its front, bare bulbs
  K.stall = (b, x, z, s, kind = pick(['clothes', 'clothes', 'toys', 'bags', 'phone', 'souvenir'])) => {
    const W = 2.4, D = 1.5, col = pick(TARPS);
    for (const dz of [-W / 2, W / 2]) for (const dx of [-D / 2, D / 2]) b.box(VC.metal, '#5a6068', x + dx, 1.3, z + dz, 0.05, 2.6, 0.05);
    b.block(VC.solid, '#5a4a38', x, 0, z, D * 0.8, 0.85, W - 0.1);
    b.add(G.box, VC.solid, x, 2.62, z, D + 1.0, 0.04, W + 0.1, 0, 0, s * 0.2, col);
    b.box(VC.solid, col, x - s * (D / 2 + 0.48), 2.44, z, 0.03, 0.3, W + 0.1);
    for (const dz of [-0.6, 0.6]) { b.box(VC.glow, hdr('#fff0c0', 3), x - s * 0.2, 2.28, z + dz, 0.12, 0.14, 0.12); b.box(VC.metal, '#2a2a2a', x - s * 0.2, 2.45, z + dz, 0.01, 0.3, 0.01); }
    const g = kind === 'clothes' ? [0, 1, 2, 3] : kind === 'bags' ? [4] : kind === 'toys' ? [5] : kind === 'phone' ? [6] : [7, 0];
    for (let k = 0; k < 3; k++) b.add(planeUV(K.goodsRects[pick(g)]), K.goodsMat, x - s * (D / 2 + 0.05), 1.75, z - 0.8 + k * 0.8, 0.75, 0.75, 1, 0, face(s), 0);
    for (let k = 0; k < 5; k++) b.box(VC.solid, pick(['#ff3d6a', '#3dbfff', '#ffe23d', '#39ff88', '#ff8a2a', '#f4f4f0', '#141414', '#b26bff']), x + rand(-0.4, 0.4), 0.95, z + rand(-1, 1), rand(0.18, 0.34), 0.18, rand(0.18, 0.34));
    K.pool(b, x - s * 0.8, z, 3.6, 3.6, hdr('#ffd890', 0.16));
    K.person(b, x + s * 0.3, z + rand(-0.6, 0.6), { phone: false });
  };
  // a dai pai dong: the green steel stall with its kitchen, a canvas awning over folding tables and plastic stools
  K.dpd = (b, x, z, s) => {
    b.block(VC.metal, '#2a6a4a', x + s * 0.8, 0, z, 1.8, 2.4, 2.8);
    b.box(VC.glow, hdr('#ff8a3a', 1.8), x - s * 0.12, 1.25, z, 0.04, 0.7, 2.0);
    b.box(VC.solid, '#f4f0e4', x + s * 0.8, 2.75, z, 1.9, 0.6, 2.9);
    b.box(VC.glow, hdr('#ffe8b0', 0.9), x - s * 0.17, 2.75, z, 0.02, 0.4, 2.4);
    b.add(G.box, VC.solid, x - s * 1.6, 2.8, z, 3.6, 0.05, 4.4, 0, 0, s * 0.1, pick(['#e8e0c8', '#2a6a4a', '#1f5aa8']));
    for (const dz of [-1.8, 1.8]) b.box(VC.metal, '#5a6068', x - s * 3.3, 1.4, z + dz, 0.05, 2.8, 0.05);
    for (let k = 0; k < 3; k++) b.sph(VC.glow, hdr('#fff0c0', 3), x - s * (0.6 + k * 1.1), 2.5, z, 0.08, true);
    for (const [dx, dz] of [[1.4, -1], [2.6, 0.9], [1.6, 1.4]]) {
      const tx = x - s * dx, tz = z + dz;
      b.cyl(VC.solid, '#e8e4dc', tx, 0.72, tz, 0.5, 0.04, 'cyl');
      b.cyl(VC.metal, '#5a5a60', tx, 0.36, tz, 0.04, 0.72, 'cyl6');
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + rand(-0.3, 0.3), sx = tx + Math.cos(a) * 0.72, sz = tz + Math.sin(a) * 0.72;
        b.cyl(VC.solid, pick(['#c8202c', '#1f5aa8', '#e8b020', '#2a7a4a']), sx, 0.22, sz, 0.17, 0.44, 'cyl8');
        if (chance(0.7)) K.seated(b, sx, sz, { y: 0.44 });
      }
      for (let k = 0; k < 3; k++) b.cyl(VC.solid, '#2a8a3a', tx + rand(-0.3, 0.3), 0.86, tz + rand(-0.3, 0.3), 0.04, 0.24, 'cyl6');
    }
  };
  K.lantern = (b, x, y, z, r = 0.35, col = '#e8202a') => {   // a red silk lantern, gold caps and tassel, lit inside
    b.add(LANTERN, VC.glow, x, y, z, r * 2, r * 1.7, r * 2, 0, 0, 0, hdr(col, 1.25));
    for (const e of [-1, 1]) b.cyl(VC.solid, '#d8a830', x, y + e * r * 0.82, z, r * 0.42, 0.07, 'cyl8');
    b.box(VC.solid, '#d8a830', x, y - r * 1.25, z, 0.04, r * 0.7, 0.04);
  };
  K.festoon = (b, z, { y = 7.6, sag = 0.6, w = 10.4, lanterns = false } = {}) => {   // bulbs (or lanterns) strung across the street
    wire(b, -w, y, z, w, y, z, sag, { color: '#1a1a1e', t: 0.03, n: 10 });
    for (let k = 1; k < 16; k++) {
      const t = k / 16, x = -w + 2 * w * t, yy = y - sag * 4 * t * (1 - t);
      if (lanterns && k % 2) K.lantern(b, x, yy - 0.45, z, 0.3);
      else b.add(OCT, VC.glow, x, yy - 0.12, z, 0.2, 0.22, 0.2, 0, 0, 0, hdr(pick(['#ffd28a', '#fff0c0', '#ffb860', '#ff8a6a']), 2.6));
    }
  };

  // a wet-market stall at the kerb: the counter of fish, meat or greens under its red lamp, the canvas sloping out over the road (stopping
  // short of the trams), the vendor behind
  const WET = ['fish', 'fish', 'meat', 'veg', 'veg', 'fruit', 'dried', 'flowers', 'tofu'];
  K.wetStall = (b, x, z, s, kind = pick(WET)) => {
    const W = rand(2.0, 2.5), T = 0.8;
    b.block(VC.solid, '#4a4642', x, 0, z, 1.25, T, W);
    b.add(G.box, VC.solid, x + s * 0.15, 2.45, z, 1.7, 0.04, W + 0.1, 0, 0, s * 0.2, pick(TARPS));
    for (const dz of [-W / 2 + 0.1, W / 2 - 0.1]) b.box(VC.metal, '#5a6068', x + s * 0.55, 1.25, z + dz, 0.04, 2.5, 0.04);
    b.add(G.cone8, VC.solid, x - s * 0.05, 2.12, z, 0.42, 0.26, 0.42, 0, 0, 0, '#c8101e');   // the red lamp that makes the meat look fresh
    b.add(OCT, VC.glow, x - s * 0.05, 1.97, z, 0.2, 0.2, 0.2, 0, 0, 0, hdr('#ff4a2a', 2.6));
    K.pool(b, x - s * 0.4, z, 2.8, 2.8, hdr('#ff5a3a', 0.2), 0.05);
    if (kind === 'fish') {   // polystyrene boxes of fish on ice, the aerated tank lit blue behind
      for (let k = -1; k <= 1; k++) {
        const zz = z + (k * W) / 3.2;
        b.box(VC.solid, '#eef2f4', x - s * 0.2, T + 0.1, zz, 0.7, 0.2, W / 3.4);
        b.box(VC.glow, hdr('#cfe8ff', 0.5), x - s * 0.2, T + 0.205, zz, 0.62, 0.02, W / 3.8);
        for (let j = 0; j < 3; j++) b.add(G.box, VC.solid, x - s * (0.2 + rand(-0.2, 0.2)), T + 0.23, zz + rand(-0.15, 0.15), 0.12, 0.05, 0.42, 0, rand(-0.6, 0.6), 0, pick(['#9aa4ac', '#c8ccd0', '#c87a6a', '#5a6a7a']));
      }
      b.box(VC.glow, hdr('#3a9aff', 0.9), x + s * 0.42, T + 0.45, z, 0.36, 0.9, W - 0.3);
    } else if (kind === 'meat') {   // joints on hooks along a rail, the chopping block
      b.box(VC.metal, '#8a9098', x + s * 0.1, 1.95, z, 0.04, 0.04, W);
      for (let k = 0; k < 5; k++) b.box(VC.solid, pick(['#c84a4a', '#e88a7a', '#b83a3a', '#f0c0a8']), x + s * 0.1, 1.55, z - W / 2 + 0.3 + (k * (W - 0.6)) / 4, 0.18, 0.6, 0.26);
      b.box(VC.solid, '#8a6a4a', x - s * 0.25, T + 0.08, z, 0.6, 0.16, 0.8);
    } else if (kind === 'veg' || kind === 'fruit') {
      const cols = kind === 'veg' ? ['#3a8a2a', '#5aa83a', '#2a6a22', '#e8e0c0', '#c84a2a', '#8ac83a'] : ['#ff9a1a', '#e82a2a', '#ffd23d', '#e8288a', '#8ac83a', '#7a2a8a'];
      for (let k = 0; k < 9; k++) { const r = rand(0.28, 0.42); b.add(OCT, VC.solid, x - s * rand(-0.35, 0.35), T + 0.12, z + rand(-W / 2 + 0.25, W / 2 - 0.25), r, r * 0.8, r, 0, rand(0, 1), 0, pick(cols)); }
    } else if (kind === 'dried') {   // open sacks of mushrooms, scallops, shrimps
      for (let k = 0; k < 4; k++) {
        const zz = z - W / 2 + 0.35 + (k * (W - 0.7)) / 3, xx = x - s * rand(-0.3, 0.3);
        b.box(VC.solid, '#c8b088', xx, T + 0.14, zz, 0.42, 0.28, 0.42);
        b.box(VC.solid, pick(['#d88a2a', '#8a4a1a', '#e8c070', '#5a3018']), xx, T + 0.29, zz, 0.38, 0.04, 0.38);
      }
    } else if (kind === 'flowers') {
      for (let k = 0; k < 6; k++) { const zz = z - W / 2 + 0.3 + (k * (W - 0.6)) / 5; b.box(VC.metal, '#5a6a7a', x, T + 0.15, zz, 0.3, 0.3, 0.3); b.add(OCT, VC.solid, x, T + 0.5, zz, 0.42, 0.42, 0.42, 0, rand(0, 1), 0, pick(['#e83a6a', '#ffd23d', '#f4f4f0', '#ff8a2a', '#c83ad8'])); }
    } else for (let k = 0; k < 6; k++) b.box(VC.solid, '#f4f0e0', x - s * rand(-0.3, 0.3), T + 0.06, z + rand(-W / 2 + 0.2, W / 2 - 0.2), 0.3, 0.1, 0.3);   // tofu in its trays
    b.box(VC.solid, '#ffe23d', x - s * 0.635, T - 0.15, z + rand(-0.6, 0.6), 0.02, 0.16, 0.28);   // a price card
    K.person(b, x + s * 0.95, z + rand(-0.5, 0.5), { coat: pick(['#2a2a30', '#f4f4f0', '#1f5aa8', '#c8202c', '#3a5a3a']), phone: false, bag: false });
  };

  // ---------- the harbour ----------
  const reflMats = new Map();
  K.refl = (b, x, z, len, w, col, { y = WY + 0.04, x0 = EDGE + 9 } = {}) => {   // a light's reflection on the water, pointing at the runner
    let m = reflMats.get(col);
    if (!m) reflMats.set(col, (m = basic({ color: hdr(col, 0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
    const dx = -x, dz = 40, d = Math.hypot(dx, dz), L = Math.min(len, ((Math.abs(x) - x0) * d) / Math.abs(dx));
    if (L > 2) b.add(G.plane, m, x + (dx / d) * L / 2, y, z + (dz / d) * L / 2, w, L, 1, -Math.PI / 2, Math.atan2(-dx, -dz), 0);
  };
  // the promenade beside the water: paving, the railing with its timber handrail, lamps, the sea wall and the harbour
  K.harbour = (b, s, z0 = 0, z1 = 80, { rail = EDGE + 8.6, lamps = true } = {}) => {
    const L = z1 - z0, zc = -(z0 + z1) / 2, rx = s * rail;
    b.add(G.plane, K.paveMat, s * (EDGE + 7 + (rail - EDGE - 7) / 2), 0.02, zc, rail - EDGE - 7 + 0.4, L, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#5a3a24', rx, 1.12, zc, 0.16, 0.08, L);
    b.box(VC.metal, '#8a9098', rx, 0.62, zc, 0.05, 0.05, L);
    for (let z = z0; z <= z1 + 0.01; z += 2) b.box(VC.metal, '#8a9098', rx, 0.56, -z, 0.08, 1.12, 0.08);
    b.box(VC.solid, '#4e4c48', s * (rail + 0.5), (WY - 1) / 2, zc, 1.0, 1 - WY, L);
    b.add(G.plane, K.sea, s * (rail + 1 + 170), WY, zc, 340, L, 1, -Math.PI / 2, 0, 0);
    if (lamps) for (let z = z0 + rand(3, 8); z < z1 - 2; z += 13) {   // the promenade's lamps, a white globe on a slim post, doubled in the water
      b.cyl(VC.metal, '#c8ccd0', rx - s * 0.4, 2.0, -z, 0.06, 4, 'cyl8');
      b.sph(VC.glow, hdr('#fff4e0', 2.6), rx - s * 0.4, 4.15, -z, 0.26, true);
      K.refl(b, rx + s * 1.2, -z, 30, 0.9, '#fff0d0', { x0: rail + 1 });
    }
  };
  // the far shore across the harbour: lit towers and their long reflections
  K.farShore = (b, s, { x0 = 120, x1 = 175 } = {}) => {
    b.box(VC.solid, '#24242a', s * ((x0 + x1) / 2 + 30), WY - 0.1, -40, x1 - x0 + 60, 2, 80);
    for (let k = randi(5, 8); k > 0; k--) {
      const x = s * rand(x0 + 8, x1), z = -rand(4, 76), tall = chance(0.5), h = tall ? rand(60, 120) : rand(24, 50), w = rand(14, 24);
      const T = tall ? [K.office, K.officeMat, 1.5, 3.8] : [K.dense, K.denseMat, 2.0, 2.8];
      const dz = rand(12, 20);
      b.addM(buildingGeo(w, h, dz, T[0], T[2], T[3]), T[1], at(x, WY + 0.9, z), pick(['#ffffff', '#c8d8ff', '#ffe0c0', '#e0ffe8']));
      for (let j = 0; j < 5; j++) K.refl(b, x - s * (w / 2 + 1), z + rand(-dz / 2.2, dz / 2.2), rand(36, 80), rand(0.8, 2.0), pick(['#ffd9a0', '#9fd8ff', '#ff9ad5', '#fff0d0', '#a0ffd8', '#ffb060']), { x0: EDGE + 10 });
    }
  };
  // a Star Ferry: double-ended, green hull and white decks glowing, the star at each end; length along z
  K.ferry = (b, x, z, y = WY) => {
    const L = 30, W = 8;
    b.block(VC.solid, '#1c5a3c', x, y - 1.0, z, W, 2.1, L);
    b.block(VC.solid, '#f0f0ea', x, y + 1.1, z, W - 0.3, 0.25, L - 1);
    b.block(VC.solid, '#e8ece6', x, y + 1.35, z, W - 0.8, 1.6, L - 4);
    b.box(VC.glow, hdr('#ffe8c0', 1.0), x, y + 2.15, z, W - 0.76, 0.72, L - 5);
    b.block(VC.solid, '#e8ece6', x, y + 2.95, z, W - 1.2, 1.4, L - 8);
    b.box(VC.glow, hdr('#fff0d0', 1.1), x, y + 3.62, z, W - 1.16, 0.58, L - 9);
    b.block(VC.solid, '#1c5a3c', x, y + 4.35, z, W - 0.6, 0.18, L - 6);
    for (const e of [-1, 1]) {
      b.block(VC.solid, '#f0f0ea', x, y + 4.53, z + e * (L / 2 - 5), 2.4, 1.1, 2.0);
      b.box(VC.glow, hdr('#e8f4ff', 1.2), x, y + 5.1, z + e * (L / 2 - 5), 2.44, 0.4, 2.04);
      b.add(G.plane, K.starMat, x, y + 0.2, z + e * (L / 2 + 0.03), 1.3, 1.3, 1, 0, e > 0 ? 0 : Math.PI, 0);
      b.sph(VC.glow, hdr(e > 0 ? '#39ff88' : '#ff2a2a', 3), x + W / 2, y + 3.0, z + e * (L / 2 - 2), 0.15, true);
    }
    for (let k = 0; k <= 12; k++) b.sph(VC.glow, hdr('#fff4d0', 2.4), x + (k % 2 ? 0.45 : -0.45) * W, y + 4.5, z - L / 2 + 3 + (k * (L - 6)) / 12, 0.08, true);
    K.refl(b, x, z, 40, 3.2, '#ffe8c0', { x0: EDGE + 10 });
  };
  // a junk with red battened sails, the teak hull rising to a high stern; length along z, sails turned to face the track
  K.junk = (b, x, z, s, y = WY) => {
    b.block(VC.solid, '#3a2416', x, y - 0.9, z, 5, 2.0, 20);
    b.block(VC.solid, '#4a2e1a', x, y + 1.1, z - 7.6, 4.6, 1.6, 5);
    b.add(G.box, VC.solid, x, y + 0.9, z + 9.2, 4.2, 1.2, 3, -0.3, 0, 0, '#3a2416');
    for (const [dz, h, w] of [[5.5, 11, 7], [0, 13, 8.5], [-5.5, 9.5, 6]]) {
      b.cyl(VC.solid, '#2a1a10', x, y + 1.1 + h / 2, z + dz, 0.12, h, 'cyl6');
      b.add(G.plane, K.sailMat, x - s * w * 0.3, y + 1.6 + h * 0.48, z + dz - 0.4, w, h * 0.88, 1, 0, -s * 1.15, 0);
    }
    for (let k = 0; k < 9; k++) b.sph(VC.glow, hdr('#ffb070', 2.6), x + (k % 2 ? 2.55 : -2.55), y + 1.2, z - 8 + k * 2, 0.1, true);
    K.refl(b, x, z, 40, 2.6, '#ff6a4a', { x0: EDGE + 10 });
  };
  K.sampan = (b, x, z, y = WY) => {   // a little sampan under its arched canopy, a lamp at the stern
    b.block(VC.solid, '#4a3a2a', x, y - 0.3, z, 1.8, 0.7, 6);
    b.add(G.cyl, VC.solid, x, y + 0.5, z - 0.5, 1.6, 1.4, 1.2, Math.PI / 2, 0, 0, '#2a2420');
    b.sph(VC.glow, hdr('#ffd890', 2.6), x, y + 1.2, z - 2.8, 0.1, true);
    K.refl(b, x, z, 20, 0.8, '#ffd890', { x0: EDGE + 10 });
  };

  K.update = (t) => {
    for (const m of K.steams) m.userData.update(t);
    K.sea.userData.scroll.offset.y = -t * 0.02;
    K.screen.uniforms.time.value = t;
    const blinkA = Math.sin(t * 2.3) > -0.55 || Math.sin(t * 17.0) > 0.2;   // neon that cuts out and stutters back
    const blinkB = Math.sin(t * 1.1 + 1.0) > 0;
    K.neonFlick[0].color.set('#ffffff').multiplyScalar(blinkA ? 1.3 : 0.18);
    K.neonFlick[1].color.set('#ffffff').multiplyScalar(blinkB ? 1.3 : 0.2);
  };
  return K;
}
