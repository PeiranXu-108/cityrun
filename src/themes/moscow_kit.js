// Moscow's street kit for a frosty winter sunset: the Stalinist blocks of Tverskaya with their cornices and rusticated
// shopfronts, the pastel merchant houses of the Arbat and Zamoskvorechye under snowy roofs hung with icicles, the panel
// blocks of the outer districts with their glazed balconies and snowed-in courtyards, the boulevards' trees wound with
// lights; kiosks, the metro's red М, trolleybuses under their wires, Ladas and yellow cabs, snow banks, New Year trees
// and garlands high over the street, babushkas in shawls, people in fur hats, children pulling sledges.
// Every sign is in Russian.
import { THREE, VC, G, std, basic, hdr, canvasTex, planeUV, windowTex, buildingGeo, shade, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { facadeMat, EDGE, at } from './common.js';
import { beam } from './tokyo_kit.js';
import { londonTreeKit } from './trees.js';
import { frame } from './ny_icons.js';
import { church } from './moscow_icons.js';

export const SANS = '"Oswald", "Russo One", "Arial Narrow", sans-serif';
export const DISPLAY = '"Russo One", "Arial Black", sans-serif';
export const SERIF = '"Yeseva One", "Playfair Display", Georgia, serif';
export const OLD = '"Ruslan Display", "Yeseva One", Georgia, serif';
// the Cyrillic the signs draw: main.js fetches the fonts' cyrillic subsets for it
export const GLYPHS = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя№«»—·';
export const X0 = 11;   // the building line
export const face = (s) => (-s * Math.PI) / 2;   // turns a plane on side s to face the track
export const SNOW = '#eef1f8';

// ---------- textures ----------
function snowTex() {   // trodden snow on the pavement: footprints, the grey of the slush, a scatter of grit
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#d6dae6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { const v = randi(-18, 14); g.fillStyle = `rgba(${222 + v},${226 + v},${238 + v},0.6)`; g.fillRect(rand(0, w), rand(0, h), rand(1, 4), rand(1, 4)); }
    for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(112,112,128,0.16)'; g.lineWidth = rand(6, 14); g.beginPath(); g.moveTo(rand(0, w), 0); g.lineTo(rand(0, w), h); g.stroke(); }
    for (let i = 0; i < 30; i++) {
      const x = rand(0, w), y = rand(0, h);
      for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(118,122,140,0.2)'; g.beginPath(); g.ellipse((x + (k % 2) * 6) % w, (y + k * 14) % h, 2.6, 5, 0, 0, Math.PI * 2); g.fill(); }
    }
    for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(90,76,64,0.3)'; g.fillRect(rand(0, w), rand(0, h), 1.5, 1.5); }
  });
}
function brickTex() {   // the Kremlin's red brick, a little worn
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#7a2a22'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) for (let x = ((y / 8) % 2) * 8 - 8; x < w; x += 16) { const v = randi(-14, 14); g.fillStyle = `rgb(${176 + v},${70 + v * 0.5},${54 + v * 0.4})`; g.fillRect(x + 1, y + 1, 14, 6); }
  });
}
function birchTex() {   // white birch bark with its black dashes
  return canvasTex(64, 128, (g, w, h) => {
    g.fillStyle = '#eceae4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = pick(['#1a1a1a', '#2a2622', '#3a3430']); g.fillRect(rand(-8, w), rand(0, h), rand(6, 22), rand(1.5, 4)); }
    for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(180,170,150,0.3)'; g.fillRect(rand(0, w), rand(0, h), rand(2, 8), 1); }
  });
}

// ---------- signs ----------
// shop boards, each with the goods to show in its window
export const SIGNS = [
  { t: 'АПТЕКА', fg: '#14864a', bg: '#f4f6f2', f: SANS, icon: 'cross', goods: 'pharmacy' }, { t: 'ПРОДУКТЫ', fg: '#ffffff', bg: '#1a4a9a', f: SANS, goods: 'grocery' },
  { t: 'ГАСТРОНОМ', fg: '#f0c860', bg: '#5a1a1a', f: SERIF, goods: 'grocery' }, { t: 'БУЛОЧНАЯ', fg: '#5a2a10', bg: '#f4e4c0', f: SERIF, goods: 'bakery' },
  { t: 'КАФЕ', fg: '#ffd890', bg: '#2a1a14', f: SERIF, goods: 'cafe' }, { t: 'РЕСТОРАН', fg: '#f0c860', bg: '#141414', f: SERIF, goods: 'cafe' },
  { t: 'КНИГИ', fg: '#ffffff', bg: '#1f5a3a', f: SANS, goods: 'books' }, { t: 'ЦВЕТЫ', fg: '#d81e5a', bg: '#fff4f8', f: SANS, goods: 'flowers' },
  { t: 'ЧАЙ · КОФЕ', fg: '#f0d8a0', bg: '#3a2414', f: SERIF, goods: 'tea' }, { t: 'ОПТИКА', fg: '#1a3a7a', bg: '#f0f4fa', f: SANS, goods: 'shop' },
  { t: 'ЧАСЫ', fg: '#f0c860', bg: '#1a2a4a', f: SERIF, goods: 'clocks' }, { t: 'ПЕЛЬМЕННАЯ', fg: '#ffffff', bg: '#a8201a', f: SANS, goods: 'cafe' },
  { t: 'БЛИНЫ', fg: '#a8201a', bg: '#ffe8a0', f: OLD, goods: 'cafe' }, { t: 'СУВЕНИРЫ', fg: '#f0c860', bg: '#8a1a1a', f: OLD, goods: 'souvenir' },
  { t: 'ПОДАРКИ', fg: '#ffffff', bg: '#c8102e', f: SERIF, goods: 'gifts' }, { t: 'ОБУВЬ', fg: '#ffffff', bg: '#2a2a30', f: SANS, goods: 'shop' },
  { t: 'ХЛЕБ', fg: '#5a2a10', bg: '#f0d8a0', f: SANS, goods: 'bakery' }, { t: 'МЕХА', fg: '#f4ecdc', bg: '#3a2a20', f: SERIF, goods: 'furs' },
  { t: 'ЮВЕЛИР', fg: '#f0c860', bg: '#1a1a24', f: SERIF, goods: 'jewel' }, { t: 'ПОЧТА', fg: '#ffffff', bg: '#1a5ab0', f: SANS, goods: 'shop' },
  { t: 'КОНДИТЕРСКАЯ', fg: '#8a1a4a', bg: '#ffe8f0', f: SERIF, goods: 'cakes' }, { t: 'ОВОЩИ · ФРУКТЫ', fg: '#ffffff', bg: '#2a8a3a', f: SANS, goods: 'fruit' },
  { t: 'ШАУРМА', fg: '#ffd23d', bg: '#c8201a', f: SANS, goods: 'cafe' }, { t: '24 ЧАСА', fg: '#ffffff', bg: '#d8201a', f: DISPLAY, goods: 'grocery' },
  { t: 'ХОЗТОВАРЫ', fg: '#1a1a1a', bg: '#f2c230', f: SANS, goods: 'shop' }, { t: 'ПИРОЖКИ', fg: '#5a2a10', bg: '#ffd8a0', f: OLD, goods: 'bakery' },
  { t: 'АНТИКВАРИАТ', fg: '#e8d8b0', bg: '#2a1e18', f: SERIF, goods: 'clocks' }, { t: 'ГАЛЕРЕЯ', fg: '#141414', bg: '#f2f0ea', f: SERIF, goods: 'gallery' },
  { t: 'ГОСТИНИЦА', fg: '#f0c860', bg: '#2a1a2a', f: SERIF, goods: 'cafe' }, { t: 'МАТРЁШКИ', fg: '#ffffff', bg: '#c8202a', f: OLD, goods: 'souvenir' },
].map((s, i) => ({ ...s, i }));
const pickSigns = (...names) => SIGNS.filter((s) => names.includes(s.t));
export const STALIN_SIGNS = pickSigns('АПТЕКА', 'ГАСТРОНОМ', 'КАФЕ', 'РЕСТОРАН', 'КНИГИ', 'ОПТИКА', 'ЧАСЫ', 'МЕХА', 'ЮВЕЛИР', 'КОНДИТЕРСКАЯ', 'ОБУВЬ', 'ЦВЕТЫ', 'ГОСТИНИЦА', 'ПОДАРКИ');
export const ARBAT_SIGNS = pickSigns('СУВЕНИРЫ', 'МАТРЁШКИ', 'ПОДАРКИ', 'БЛИНЫ', 'КАФЕ', 'ЧАЙ · КОФЕ', 'КНИГИ', 'ПЕЛЬМЕННАЯ', 'АНТИКВАРИАТ', 'ГАЛЕРЕЯ', 'ЦВЕТЫ', 'БУЛОЧНАЯ');
export const PANEL_SIGNS = pickSigns('ПРОДУКТЫ', '24 ЧАСА', 'АПТЕКА', 'ХЛЕБ', 'ОВОЩИ · ФРУКТЫ', 'ШАУРМА', 'ХОЗТОВАРЫ', 'ЦВЕТЫ', 'ПИРОЖКИ', 'ПОЧТА', 'БУЛОЧНАЯ');
export const OLD_SIGNS = pickSigns('БУЛОЧНАЯ', 'ЧАЙ · КОФЕ', 'КНИГИ', 'ПИРОЖКИ', 'АНТИКВАРИАТ', 'ЦВЕТЫ', 'КАФЕ', 'АПТЕКА', 'ПОЧТА');
function signAtlas() {
  const cw = 512, ch = 112, cols = 2, rows = Math.ceil(SIGNS.length / cols);
  const tex = canvasTex(cw * cols, ch * rows, (g) => SIGNS.forEach((s) => {
    const x = (s.i % cols) * cw, y = Math.floor(s.i / cols) * ch;
    g.fillStyle = s.bg; g.fillRect(x, y, cw, ch);
    g.strokeStyle = s.fg; g.globalAlpha = 0.55; g.lineWidth = 4; g.strokeRect(x + 8, y + 8, cw - 16, ch - 16); g.globalAlpha = 1;
    const pad = s.icon ? 130 : 44, weight = s.f === SANS ? 700 : 400;
    let px = 74;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = s.fg;
    do g.font = `${weight} ${px--}px ${s.f}`; while (g.measureText(s.t).width > cw - pad && px > 20);
    g.fillText(s.t, x + cw / 2 + (s.icon ? 44 : 0), y + ch / 2 + 3);
    if (s.icon === 'cross') { g.fillStyle = '#14b45a'; g.fillRect(x + 54, y + 22, 28, 68); g.fillRect(x + 34, y + 42, 68, 28); }
  }), { repeat: false });
  return { tex, rects: SIGNS.map((s) => ({ u0: (s.i % cols) / cols + 0.002, u1: ((s.i % cols) + 1) / cols - 0.002, v0: 1 - (Math.floor(s.i / cols) + 1) / rows + 0.003, v1: 1 - Math.floor(s.i / cols) / rows - 0.003 })) };
}
// what each kind of shop shows in its window, warm light behind
const GOODS = ['pharmacy', 'grocery', 'bakery', 'cafe', 'books', 'flowers', 'tea', 'clocks', 'souvenir', 'gifts', 'furs', 'jewel', 'cakes', 'fruit', 'gallery', 'shop'];
const GI = Object.fromEntries(GOODS.map((k, i) => [k, i]));
function drawGoods(g, k, w, h) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe6b8'); gr.addColorStop(1, '#f0b870');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const shelf = (y) => { g.fillStyle = '#6a4a2a'; g.fillRect(0, y, w, 4); };
  const dots = (cols, n, r, y0, y1) => { for (let i = 0; i < n; i++) { g.fillStyle = pick(cols); g.beginPath(); g.arc(rand(6, w - 6), rand(y0, y1), r * rand(0.7, 1.2), 0, Math.PI * 2); g.fill(); } };
  if (k === 'pharmacy') { g.fillStyle = '#f2f6f4'; g.fillRect(0, 0, w, h); for (const y of [30, 62, 94]) { shelf(y); dots(['#ffffff', '#3ab46a', '#e8e8f0', '#2a8ad8'], 14, 5, y - 12, y - 4); } }
  else if (k === 'grocery') { for (const y of [28, 58, 88]) { shelf(y); for (let x = 4; x < w - 8; x += 11) { g.fillStyle = pick(['#c8202a', '#2a6ad0', '#f2c230', '#3a9a4a', '#f4f0e8', '#e86a1a']); g.fillRect(x, y - 16, 9, 16); } } }
  else if (k === 'bakery') { for (const y of [40, 80]) { shelf(y); for (let x = 10; x < w - 10; x += 22) { g.fillStyle = pick(['#c8843a', '#a86428', '#d89a50']); g.beginPath(); g.ellipse(x, y - 9, 10, 8, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#8a5020'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 9, 4, 0, Math.PI * 2); g.stroke(); } } }
  else if (k === 'cafe') { g.fillStyle = 'rgba(80,40,20,0.35)'; for (let i = 0; i < 5; i++) { const x = rand(10, w - 10); g.beginPath(); g.arc(x, h - 40, 9, 0, Math.PI * 2); g.fill(); g.fillRect(x - 10, h - 32, 20, 32); } g.fillStyle = '#ffcf7a'; for (let i = 0; i < 6; i++) g.fillRect(rand(4, w - 16), rand(8, 30), 10, 4); }
  else if (k === 'books') { for (const y of [32, 64, 96]) { shelf(y); for (let x = 2; x < w - 4; x += 6) { g.fillStyle = pick(['#7a1a1a', '#1a3a6a', '#2a5a2a', '#c8a040', '#3a2a1a', '#e8dcc0']); g.fillRect(x, y - rand(16, 24), 5, 24); } } }
  else if (k === 'flowers') { g.fillStyle = '#2a5a2a'; g.fillRect(0, h - 40, w, 40); dots(['#e8205a', '#ff6a9a', '#fff0f4', '#ffd23d', '#c81e3a', '#ff8a3a'], 70, 5, h - 70, h - 20); }
  else if (k === 'tea') { for (const y of [44, 92]) { shelf(y); for (let x = 12; x < w - 12; x += 26) { g.fillStyle = pick(['#c8902a', '#e8c060', '#b87a3a']); g.fillRect(x - 6, y - 26, 12, 22); g.beginPath(); g.ellipse(x, y - 30, 9, 6, 0, 0, Math.PI * 2); g.fill(); } } }   // samovars and tins
  else if (k === 'clocks') { for (let i = 0; i < 8; i++) { const x = 14 + (i % 4) * ((w - 28) / 3), y = 30 + Math.floor(i / 4) * 52; g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(x, y, 14, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f8f0dc'; g.beginPath(); g.arc(x, y, 11, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6, y - 3); g.moveTo(x, y); g.lineTo(x, y - 8); g.stroke(); } }
  else if (k === 'souvenir') { for (const y of [50, 100]) { shelf(y); for (let x = 10; x < w - 8; x += 16) { const c = pick(['#c8202a', '#e8b030', '#2a5ab0', '#2a8a4a']), s = rand(0.7, 1.1); g.fillStyle = c; g.beginPath(); g.ellipse(x, y - 12 * s, 7 * s, 12 * s, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(x, y - 26 * s, 5 * s, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f8e0c8'; g.beginPath(); g.arc(x, y - 26 * s, 3 * s, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffd23d'; g.fillRect(x - 4 * s, y - 14 * s, 8 * s, 4 * s); } } }   // matryoshkas in rows
  else if (k === 'gifts') { for (let i = 0; i < 9; i++) { const x = rand(8, w - 30), y = rand(h * 0.4, h - 26), c = pick(['#c8202a', '#2a8a4a', '#f2c230', '#2a5ab0']); g.fillStyle = c; g.fillRect(x, y, 24, 24); g.fillStyle = '#ffd23d'; g.fillRect(x + 10, y, 4, 24); g.fillRect(x, y + 10, 24, 4); } }
  else if (k === 'furs') { for (let i = 0; i < 4; i++) { const x = 14 + i * ((w - 28) / 3); g.fillStyle = pick(['#5a3a2a', '#8a6a4a', '#2a2420', '#c8b8a0']); g.beginPath(); g.moveTo(x - 10, 24); g.lineTo(x + 10, 24); g.lineTo(x + 16, h - 10); g.lineTo(x - 16, h - 10); g.closePath(); g.fill(); g.beginPath(); g.ellipse(x, 18, 9, 7, 0, 0, Math.PI * 2); g.fill(); } }
  else if (k === 'jewel') { g.fillStyle = '#1a1420'; g.fillRect(0, 0, w, h); for (let i = 0; i < 30; i++) { g.fillStyle = pick(['#ffe080', '#ffffff', '#ff8aa0', '#a0d8ff']); g.beginPath(); g.arc(rand(6, w - 6), rand(h * 0.3, h - 10), rand(1.5, 3.5), 0, Math.PI * 2); g.fill(); } }
  else if (k === 'cakes') { for (const y of [56, 104]) { shelf(y); for (let x = 14; x < w - 12; x += 28) { g.fillStyle = pick(['#f8e8f0', '#e8c8a0', '#a85a3a', '#fff4e0']); g.fillRect(x - 11, y - 18, 22, 18); g.fillStyle = pick(['#e83a5a', '#ffffff', '#ffd23d']); g.fillRect(x - 11, y - 20, 22, 4); } } }
  else if (k === 'fruit') { for (const y of [50, 100]) { g.fillStyle = '#8a6a3a'; g.fillRect(0, y - 4, w, 8); dots(['#e8201a', '#ffa01a', '#ffd23d', '#6ab43a', '#f2e070'], 24, 6, y - 24, y - 8); } }
  else if (k === 'gallery') { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3; i++) { const x = 8 + i * ((w - 16) / 3); g.fillStyle = '#c8a050'; g.fillRect(x, 24, (w - 40) / 3, 50); g.fillStyle = pick(['#3a5a8a', '#8a3a2a', '#2a6a4a', '#c8803a']); g.fillRect(x + 4, 28, (w - 40) / 3 - 8, 42); } }
  else { for (const y of [40, 86]) { shelf(y); dots(['#2a2a30', '#8a2a2a', '#3a5a8a', '#c8a070', '#f4f0e8'], 16, 6, y - 16, y - 6); } }
  g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(0, 0, w, h * 0.08);   // the frost at the top of the pane
}
function goodsAtlas() {
  const cw = 128, ch = 112, cols = 4, rows = Math.ceil(GOODS.length / cols);
  const tex = canvasTex(cw * cols, ch * rows, (g) => GOODS.forEach((k, i) => { g.save(); g.translate((i % cols) * cw, Math.floor(i / cols) * ch); g.beginPath(); g.rect(0, 0, cw, ch); g.clip(); drawGoods(g, k, cw, ch); g.restore(); }), { repeat: false });
  return { tex, rects: GOODS.map((_, i) => ({ u0: (i % cols) / cols + 0.003, u1: ((i % cols) + 1) / cols - 0.003, v0: 1 - (Math.floor(i / cols) + 1) / rows + 0.004, v1: 1 - Math.floor(i / cols) / rows - 0.004 })) };
}
// the city's street plates: the name, and the house number
export const STREETS = [['ТВЕРСКАЯ УЛИЦА', '12'], ['УЛИЦА АРБАТ', '27'], ['ПОКРОВКА', '9'], ['НИКОЛЬСКАЯ УЛИЦА', '4'], ['ПЯТНИЦКАЯ УЛИЦА', '31'], ['НЕГЛИННАЯ УЛИЦА', '15'],
  ['ПЕТРОВКА', '20'], ['СРЕТЕНКА', '7'], ['ПРЕЧИСТЕНКА', '18'], ['ОСТОЖЕНКА', '5'], ['МАРОСЕЙКА', '11'], ['КУЗНЕЦКИЙ МОСТ', '3'], ['ВАРВАРКА', '6'], ['БОЛЬШАЯ ОРДЫНКА', '24'],
  ['ЧИСТОПРУДНЫЙ БУЛЬВАР', '14'], ['ГОГОЛЕВСКИЙ БУЛЬВАР', '8']];
function streetAtlas() {
  const cw = 256, ch = 96;
  const tex = canvasTex(cw, ch * STREETS.length, (g) => STREETS.forEach(([st, no], i) => {
    const y = i * ch;
    g.fillStyle = '#1a3a8a'; g.fillRect(0, y, cw, ch);
    g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(5, y + 5, cw - 10, ch - 10);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let px = 34; do g.font = `500 ${px--}px ${SANS}`; while (g.measureText(st).width > cw - 24 && px > 12);
    g.fillText(st, cw / 2, y + 36);
    g.font = `700 30px ${SANS}`; g.fillText(no, cw / 2, y + 70);
  }), { repeat: false });
  return { tex, rects: STREETS.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / STREETS.length + 0.003, v1: 1 - i / STREETS.length - 0.003 })) };
}
// kiosk and stall boards
export const KIOSKS = [['ЦВЕТЫ 24', '#d81e5a', '#ffffff'], ['ГАЗЕТЫ', '#1a4a9a', '#ffffff'], ['МОРОЖЕНОЕ', '#2a7ad8', '#ffffff'], ['ШАУРМА', '#c8201a', '#ffd23d'], ['ГОРЯЧИЙ ЧАЙ', '#3a2414', '#ffd890'],
  ['БЛИНЫ', '#ffd23d', '#a8201a'], ['КОФЕ', '#2a1a14', '#ffd890'], ['СУВЕНИРЫ', '#8a1a1a', '#f0c860'], ['ГЛИНТВЕЙН', '#5a0a1a', '#ffd890'], ['СБИТЕНЬ', '#a8501a', '#fff0c8'], ['КАТОК', '#1a5ab0', '#ffffff'], ['ПИРОЖКИ', '#ffd8a0', '#5a2a10']];
function kioskAtlas() {
  const cw = 256, ch = 64;
  const tex = canvasTex(cw, ch * KIOSKS.length, (g) => KIOSKS.forEach(([t, bg, fg], i) => {
    const y = i * ch;
    g.fillStyle = bg; g.fillRect(0, y, cw, ch);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    let px = 44; do g.font = `700 ${px--}px ${SANS}`; while (g.measureText(t).width > cw - 20 && px > 12);
    g.fillText(t, cw / 2, y + ch / 2 + 2);
  }), { repeat: false });
  return { tex, rects: KIOSKS.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / KIOSKS.length + 0.004, v1: 1 - i / KIOSKS.length - 0.004 })) };
}

// ---------- palettes ----------
const SKIN = ['#f0d0b4', '#e8c4a4', '#f4dcc4', '#d8b090', '#e0b898'];
const HAIR = ['#2a1e16', '#4a3424', '#6a5038', '#c8a878', '#1a1410', '#8a8a88'];
const COATS = ['#1a1c24', '#2a2a30', '#3a2e28', '#4a3a30', '#1f2a40', '#5a1a1e', '#2a3a2a', '#6a5a4a', '#3a3a44', '#8a2a2a', '#1a2a3a', '#4a2a3a'];
const PUFFER = ['#c8202a', '#2a6ad0', '#f2c230', '#e8e8ec', '#1a1a1e', '#3ab4a0', '#ff6a9a', '#7a4ac8', '#2a8a4a'];
const SHAWL = ['#c8202a', '#a8182a', '#2a4a9a', '#e8c040', '#1a1a1e', '#6a2a5a', '#2a6a4a'];
const HATS = ['#3a2a20', '#5a4030', '#1a1a1a', '#8a7a6a', '#2a2420', '#c8b8a0', '#6a5a4a'];
const KNIT = ['#c8202a', '#2a4a9a', '#e8e8ec', '#f2c230', '#2a8a4a', '#ff6a9a', '#1a1a1e'];
export const STALIN = ['#f0e2c4', '#ecd4a8', '#f2dcb4', '#e8c8a8', '#dcd0bc', '#f4e8cc', '#e4c898', '#e8d8c8'];
export const PASTEL = ['#f0cc78', '#eba892', '#a6d2b8', '#a8c4e6', '#ecc080', '#e2a4ae', '#bed898', '#f2d8a4', '#e89a78', '#98c6d6', '#f0ba86', '#c8b0de'];
const PANEL = ['#f0ece4', '#e8e4dc', '#dcd8d0', '#e8e0d4', '#d8dce0', '#ece4d8'];
const ROOF = ['#3a6a4a', '#2f5a40', '#8a3a2a', '#7a8088', '#5a6a7a', '#6a2a24'];
const LADA = ['#e8e4dc', '#e8dcc0', '#c8b890', '#3a5a8a', '#a8282a', '#3a6a4a', '#4a2a4a', '#8a8a90', '#1a2a4a', '#d8c870'];

export function makeKit() {
  const K = {};
  K.face = face;
  // ---------- materials ----------
  const stal = windowTex({ cols: 6, rows: 12, cw: 34, ch: 48, wall: '#f2e8d4', glass: '#161a24', lit: ['#ffd9a0', '#ffe6bc', '#ffc27a', '#fff2dc'], litChance: 0.5, frame: '#fbf6ea', ledge: '#d8c8a8' });
  const stalArch = windowTex({ cols: 6, rows: 12, cw: 34, ch: 48, wall: '#f2e8d4', glass: '#161a24', lit: ['#ffd9a0', '#ffe6bc', '#ffc27a', '#fff2dc'], litChance: 0.48, arch: true, frame: '#fbf6ea', ledge: '#d8c8a8' });
  const mans = windowTex({ cols: 4, rows: 6, cw: 40, ch: 56, wall: '#f6f2ea', glass: '#161a24', lit: ['#ffd9a0', '#ffe8c0', '#ffc880', '#fff0d8'], litChance: 0.55, frame: '#ffffff', ledge: '#ffffff' });
  const mansArch = windowTex({ cols: 4, rows: 6, cw: 40, ch: 56, wall: '#f6f2ea', glass: '#161a24', lit: ['#ffd9a0', '#ffe8c0', '#ffc880', '#fff0d8'], litChance: 0.55, arch: true, frame: '#ffffff', ledge: '#ffffff' });
  const panel = windowTex({ cols: 10, rows: 18, cw: 26, ch: 30, wall: '#d8d4cc', glass: '#14161c', lit: ['#fff0d0', '#ffe0a8', '#e8f4ff', '#ffd090', '#cfe0ff', '#ffe8c8'], litChance: 0.58, frame: '#bdb9b0', ledge: '#c4c0b6' });
  K.tex = { stal, stalArch, mans, mansArch, panel };
  K.stalMat = facadeMat(stal, { k: 0.85 }); K.stalArchMat = facadeMat(stalArch, { k: 0.85 });
  K.mansMat = facadeMat(mans, { k: 0.85 }); K.mansArchMat = facadeMat(mansArch, { k: 0.85 });
  K.panelMat = facadeMat(panel, { k: 0.8 });
  const snow = snowTex();
  K.sideMat = std({ map: snow, roughness: 0.75 }); K.sideMat.map = snow.clone(); K.sideMat.map.repeat.set(2, 23); K.sideMat.map.needsUpdate = true;   // the track's side strips
  K.snowMat = std({ map: snow, roughness: 0.75 });
  const tiled = new Map();
  K.tiledPlane = (w, d, k) => { const key = `${w}|${d}|${k}`; if (!tiled.has(key)) tiled.set(key, planeUV({ u0: 0, u1: w / k, v0: 0, v1: d / k })); return tiled.get(key); };
  K.snowField = (b, x, z, w, d, y = 0.04) => b.add(K.tiledPlane(w, d, 6), K.snowMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0);
  const bt = brickTex();
  K.brickMat = std({ map: bt, vertexColors: true, roughness: 0.85, emissive: '#ffb880', emissiveMap: bt, emissiveIntensity: 0.32 });
  K.birchMat = std({ map: birchTex(), vertexColors: true, roughness: 0.8 });
  const sg = signAtlas();
  K.signRects = sg.rects; K.signMat = basic({ map: sg.tex, color: hdr('#ffffff', 0.95) });
  const gd = goodsAtlas();
  K.goodsRects = gd.rects; K.goodsMat = basic({ map: gd.tex, color: hdr('#ffffff', 1.0) });
  const st = streetAtlas();
  K.streetRects = st.rects; K.streetMat = basic({ map: st.tex, color: hdr('#ffffff', 0.9), side: THREE.DoubleSide });
  const ks = kioskAtlas();
  K.kioskRects = ks.rects; K.kioskMat = basic({ map: ks.tex, color: hdr('#ffffff', 1.1) });
  K.poolMat = basic({ map: canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { repeat: false }),
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  K.pool = (b, x, z, w, d, col, y = 0.06) => b.add(G.plane, K.poolMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0, col);   // lamplight on the snow
  K.metroM = basic({ map: canvasTex(128, 128, (g, w, h) => {   // the metro's red М
    g.clearRect(0, 0, w, h); g.fillStyle = '#e8202a'; g.font = `700 112px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('М', w / 2, h / 2 + 6);
  }, { repeat: false }), transparent: true, color: hdr('#ffffff', 2.2), side: THREE.DoubleSide });
  const labels = new Map();
  K.label = (text, { w = 512, h = 128, color = '#ffffff', font = DISPLAY, weight = 400, size = 0.6, bg = null, border = null, glow = null, k = 1.1 } = {}) => {
    const key = [text, w, h, color, font, weight, size, bg, border, glow, k].join('|');
    if (labels.has(key)) return labels.get(key);
    const tex = canvasTex(w, h, (g) => {
      if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } else g.clearRect(0, 0, w, h);
      if (border) { const m = Math.min(w, h); g.strokeStyle = border; g.lineWidth = m * 0.05; g.strokeRect(m * 0.07, m * 0.07, w - m * 0.14, h - m * 0.14); }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color;
      if (glow) { g.shadowColor = glow; g.shadowBlur = Math.min(w, h) * 0.12; }
      let px = Math.floor(h * size); g.font = `${weight} ${px}px ${font}`;
      const m = g.measureText(text).width, max = w * 0.88;
      if (m > max) { px = Math.floor((px * max) / m); g.font = `${weight} ${px}px ${font}`; }
      g.fillText(text, w / 2, h / 2 + h * 0.04);
    }, { repeat: false });
    const mat = basic({ map: tex, color: hdr('#ffffff', k), transparent: !bg, side: THREE.DoubleSide });
    labels.set(key, mat);
    return mat;
  };
  // the style the icons are built with in the streets: lit materials, the colours of the evening
  K.S = {
    lo: false, wall: VC.solid, brick: K.brickMat, glow: VC.glow, gold: VC.metal, dark: VC.solid, roof: VC.solid, star: VC.glow, glass: VC.metal, steam: VC.solid, bronze: VC.metal, clock: VC.solid,
    cWall: '#f2ece0', cTrim: '#fbf8f2', cCream: '#f0dcae', cBrick: '#d8a090', cBrick2: '#c88878', cRoof: '#3a6a4a', cGold: '#e8c060', cWin: hdr('#ffd890', 1.5), cBell: hdr('#ffc870', 1.2),
    cDark: '#1a1a20', cStar: hdr('#ff2a2a', 3), cSpire: '#e8c060', cTower: '#d8dce4', cRedBand: '#c8302a', cOffice: hdr('#e8f2ff', 1.3), cCrown: hdr('#bfe8ff', 1.8), cSteam: '#f4f0f4', cBronze: '#5a4a30', cClock: '#14182a', cRelief: '#5a5448',
  };

  // ---------- trees ----------
  const LT = londonTreeKit();
  K.bareTree = LT.bareTree; K.spruce = LT.spruce;
  K.birch = (b, x, z, s = rand(0.9, 1.15), { y = 0 } = {}) => {   // a bare birch: the white trunk, thin dark branches drooping, snow along them
    const h = rand(7, 9.5) * s, lean = rand(-0.12, 0.12);
    b.add(G.cyl8, K.birchMat, x, y + h / 2, z, 0.34 * s, h, 0.34 * s, lean, 0, rand(-0.1, 0.1), '#ffffff');
    for (let k = 0; k < 7; k++) {
      const a = rand(0, Math.PI * 2), y0 = y + h * rand(0.42, 0.9), len = rand(1.8, 3.2) * s, tx = x + Math.cos(a) * len, tz = z + Math.sin(a) * len, ty = y0 + len * 0.6;
      beam(b, VC.solid, x, y0, z, tx, ty, tz, 0.07 * s, '#4a3a3a');
      beam(b, VC.solid, tx, ty, tz, tx + Math.cos(a) * 0.9, ty - 1.4 * s, tz + Math.sin(a) * 0.9, 0.035 * s, '#5a4848');   // the drooping twigs
      if (k % 2) beam(b, VC.solid, x, y0 + 0.06, z, tx, ty + 0.06, tz, 0.05 * s, SNOW);
    }
  };

  // ---------- people and animals ----------
  K.person = (b, x, z, { s = rand(0.9, 1.05), y = 0, coat = null, hat = null, puffer = chance(0.3), seated = false, ry = null, bag = chance(0.25), phone = chance(0.12), kid = false } = {}) => {
    const a = ry ?? rand(-0.5, 0.5) + (chance(0.5) ? Math.PI : 0), ca = Math.cos(a), sa = Math.sin(a), skin = pick(SKIN);
    const P = (fx, fy, fz) => [x + fx * ca + fz * sa, y + fy, z - fx * sa + fz * ca];
    if (kid) s *= 0.6;
    const c = coat || (puffer ? pick(PUFFER) : pick(COATS)), legs = pick(['#1a1c24', '#2a2e3a', '#3a3428', '#1f2a40']);
    const hk = hat || (kid ? 'knit' : pick(['ushanka', 'fur', 'fur', 'knit', 'knit', 'shawl', 'none', 'hood']));
    if (seated) {
      for (const e of [-1, 1]) { b.add(G.box, VC.solid, ...P(e * 0.09 * s, 0.5 * s, -0.18 * s), 0.15 * s, 0.14 * s, 0.42 * s, 0, a, 0, legs); b.add(G.box, VC.solid, ...P(e * 0.09 * s, 0.24 * s, -0.36 * s), 0.13 * s, 0.48 * s, 0.14 * s, 0, a, 0, legs); }
      b.add(G.box, VC.solid, ...P(0, 0.9 * s, 0.02), 0.48 * s, 0.64 * s, 0.3 * s, 0, a, 0, c);
    } else {
      for (const e of [-1, 1]) b.add(G.box, VC.solid, ...P(e * 0.085 * s, 0.4 * s, 0), 0.15 * s, 0.8 * s, 0.19 * s, 0, a, 0, legs);
      b.add(G.box, VC.solid, ...P(0, 0.12 * s, -0.04), 0.4 * s, 0.24 * s, 0.32 * s, 0, a, 0, '#1a1414');   // felt boots
      b.add(G.box, VC.solid, ...P(0, 1.12 * s, 0), (puffer ? 0.52 : 0.48) * s, 0.74 * s, (puffer ? 0.34 : 0.3) * s, 0, a, 0, c);
      if (!puffer) b.add(G.box, VC.solid, ...P(0, 0.62 * s, 0), 0.46 * s, 0.4 * s, 0.3 * s, 0, a, 0, c);   // the long winter coat to the knees
    }
    const hy = seated ? 1.38 : 1.66;
    b.add(G.sphLow, VC.solid, ...P(0, hy * s, 0), 0.3 * s, 0.34 * s, 0.3 * s, 0, a, 0, skin);
    if (chance(0.45)) b.add(G.box, VC.solid, ...P(0, (hy - 0.2) * s, 0), 0.34 * s, 0.12 * s, 0.32 * s, 0, a, 0, pick(['#c8202a', '#2a4a9a', '#e8e4dc', '#3a3a3e', '#6a2a3a']));   // a scarf
    const hc = pick(HATS);
    if (hk === 'ushanka') { b.add(G.box, VC.solid, ...P(0, (hy + 0.16) * s, 0), 0.36 * s, 0.2 * s, 0.36 * s, 0, a, 0, hc); for (const e of [-1, 1]) b.add(G.box, VC.solid, ...P(e * 0.17 * s, (hy - 0.02) * s, 0), 0.06 * s, 0.2 * s, 0.22 * s, 0, a, 0, hc); }
    else if (hk === 'fur') b.add(G.cyl8, VC.solid, ...P(0, (hy + 0.18) * s, 0), 0.34 * s, 0.22 * s, 0.34 * s, 0, a, 0, hc);
    else if (hk === 'knit') { b.add(G.sphLow, VC.solid, ...P(0, (hy + 0.1) * s, 0), 0.32 * s, 0.26 * s, 0.32 * s, 0, a, 0, pick(KNIT)); b.sph(VC.solid, '#f4f0e8', ...P(0, (hy + 0.25) * s, 0), 0.07 * s, true); }
    else if (hk === 'shawl') { const c2 = pick(SHAWL); b.add(G.sphLow, VC.solid, ...P(0, (hy + 0.04) * s, 0.02), 0.36 * s, 0.4 * s, 0.36 * s, 0, a, 0, c2); b.add(G.box, VC.solid, ...P(0, (hy - 0.22) * s, 0.06), 0.4 * s, 0.14 * s, 0.32 * s, 0, a, 0, c2); }
    else if (hk === 'hood') b.add(G.sphLow, VC.solid, ...P(0, (hy + 0.05) * s, 0.04), 0.38 * s, 0.4 * s, 0.38 * s, 0, a, 0, c);
    else b.add(G.box, VC.solid, ...P(0, (hy + 0.12) * s, 0.025), 0.31 * s, 0.13 * s, 0.31 * s, 0, a, 0, pick(HAIR));
    if (phone && !seated) b.box(VC.glow, hdr('#cfe6ff', 1.5), ...P(0.06, 1.22 * s, -0.2 * s), 0.07, 0.12, 0.02);
    if (bag && !seated) b.add(G.box, VC.solid, ...P(0.29 * s, 0.9 * s, 0), 0.1, 0.34, 0.32, 0, a, 0, pick(['#141414', '#c8a070', '#8a2a1a', '#2a3a5a']));
  };
  K.crowd = (b, x0, x1, z0, z1, n, opts = {}) => { for (let i = 0; i < n; i++) K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1), opts); };
  K.throng = (b, x0, x1, z0, z1, n, gaps = [], opts = {}) => {   // a crowd kept out of the given stretches
    for (let i = 0, t = 0; i < n && t < n * 4; t++) { const z = rand(z0, z1); if (gaps.some(([a, c]) => z > a && z < c)) continue; K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -z, opts); i++; }
  };
  K.babushka = (b, x, z, ry) => { K.person(b, x, z, { s: 0.92, hat: 'shawl', puffer: false, coat: pick(['#3a2a24', '#2a2a30', '#4a3a2a', '#5a1a1e']), bag: true, ry }); };
  K.sled = (b, x, z, ry = rand(0, Math.PI * 2)) => {   // a child pulling a sledge with a smaller one on it
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fz) => [x + fx * ca + fz * sa, z - fx * sa + fz * ca];
    const [kx, kz] = P(0, -1.2);
    K.person(b, kx, kz, { kid: true, puffer: true, ry });
    const [sx, sz] = P(0, 0.2);
    b.add(G.box, VC.solid, sx, 0.22, sz, 0.5, 0.06, 1.1, 0, ry, 0, pick(['#a8401a', '#c8202a', '#2a6ad0']));
    for (const e of [-1, 1]) { const [rx, rz] = P(e * 0.22, 0.2); b.add(G.box, VC.metal, rx, 0.1, rz, 0.04, 0.12, 1.2, 0, ry, 0, '#8a8a90'); }
    const [ex, ez] = P(0, -0.4), [hx, hz] = P(0.1, -1.0);
    beam(b, VC.solid, ex, 0.26, ez, hx, 0.62, hz, 0.02, '#2a2a2a');   // the rope
    K.person(b, sx, sz, { kid: true, seated: true, puffer: true, ry });
  };
  K.dvornik = (b, x, z, ry) => {   // the yard keeper in his orange vest, shovelling snow
    K.person(b, x, z, { coat: '#ff6a1a', puffer: true, hat: 'knit', ry, bag: false, phone: false });
    const a = ry ?? 0, ca = Math.cos(a), sa = Math.sin(a);
    beam(b, VC.solid, x + 0.2 * ca, 1.2, z - 0.2 * sa, x + 0.25 * ca - 0.9 * sa, 0.15, z - 0.25 * sa - 0.9 * ca, 0.04, '#8a6a3a');
    b.add(G.box, VC.solid, x + 0.25 * ca - 0.95 * sa, 0.1, z - 0.25 * sa - 0.95 * ca, 0.5, 0.05, 0.4, 0, a, 0, '#e86a1a');
  };
  K.dog = (b, x, z, ry = rand(0, Math.PI * 2)) => {   // a dog out on its walk
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + fx * ca + fz * sa, fy, z - fx * sa + fz * ca], c = pick(['#c8a070', '#3a2a1a', '#e8e0d0', '#6a5a4a', '#1a1a1a']);
    b.add(G.sphLow, VC.solid, ...P(0, 0.42, 0), 0.32, 0.3, 0.7, 0, ry, 0, c);
    b.add(G.sphLow, VC.solid, ...P(0, 0.62, -0.38), 0.24, 0.24, 0.3, 0, ry, 0, c);
    for (const [fx, fz] of [[-0.1, -0.22], [0.1, -0.22], [-0.1, 0.22], [0.1, 0.22]]) b.add(G.box, VC.solid, ...P(fx, 0.18, fz), 0.07, 0.36, 0.07, 0, ry, 0, c);
  };

  // ---------- snow and ice ----------
  K.snowBank = (b, x, z0, z1, { h = 0.42, w = 0.95 } = {}) => {   // the bank of ploughed snow along the kerb, lumpy, greyed by the road
    for (let z = z0; z < z1 - 1; z += rand(1.4, 2.6)) b.add(G.sphLow, VC.solid, x + rand(-0.2, 0.2), 0.02, -z - 1, w * rand(0.7, 1.15), h * rand(0.6, 1.4) * 2, rand(1.8, 3.2), 0, rand(-0.3, 0.3), 0, pick([SNOW, '#e4e8f2', '#dfe2ee', '#d4d2d6', '#c8c6cc']));
  };
  K.icicles = (b, x, y, z0, z1, side, { step = 0.42, max = 0.8 } = {}) => {   // icicles hanging from an eave or a cornice
    for (let z = z0 + 0.3; z < z1 - 0.2; z += step * rand(0.7, 1.3)) { const l = rand(0.15, max); b.add(G.cone8, VC.glow, x - side * rand(0, 0.08), y - l / 2, -z, 0.08, l, 0.08, Math.PI, 0, 0, hdr('#d8ecff', rand(0.5, 0.75))); }
  };
  K.snowman = (b, x, z, ry = rand(0, Math.PI * 2)) => {
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + fx * ca + fz * sa, fy, z - fx * sa + fz * ca];
    for (const [y, r] of [[0.45, 0.55], [1.15, 0.4], [1.68, 0.28]]) b.sph(VC.solid, SNOW, x, y, z, r);
    b.add(G.cone8, VC.solid, ...P(0, 1.68, -0.36), 0.08, 0.3, 0.08, -Math.PI / 2, ry, 0, '#ff7a1a');
    b.add(G.cyl8, VC.solid, ...P(0, 2.0, 0), 0.34, 0.3, 0.34, 0, 0, 0.2, '#3a5a8a');   // a bucket for a hat
    for (const e of [-1, 1]) beam(b, VC.solid, ...P(e * 0.35, 1.2, 0), ...P(e * 0.9, 1.55, 0), 0.04, '#5a3a24');
    for (const fy of [1.0, 1.2, 1.4]) b.sph(VC.solid, '#1a1a1a', ...P(0, fy, -0.39), 0.04, true);
  };

  // ---------- street furniture ----------
  K.lamp = (b, x, z, side, { h = 7.2, heads = 2, col = '#ffd890', k = 2.4, pool = 0.12 } = {}) => {   // Moscow's tall lamps: a fluted post, curved arms, lanterns
    b.cyl(VC.metal, '#1a1c22', x, 0.4, z, 0.2, 0.8, 'cyl8');
    b.cyl(VC.metal, '#1a1c22', x, h / 2, z, 0.08, h, 'cyl8');
    const arms = heads === 1 ? [-side] : [-1, 1];
    for (const e of arms) {
      const ex = x + e * 1.1;
      beam(b, VC.metal, x, h - 0.3, z, ex, h + 0.2, z, 0.05, '#1a1c22');
      b.add(G.cyl6, VC.glow, ex, h - 0.2, z, 0.34, 0.5, 0.34, 0, 0, 0, hdr(col, k));
      b.add(G.cone8, VC.metal, ex, h + 0.15, z, 0.48, 0.22, 0.48, 0, 0, 0, '#1a1c22');
      b.add(G.cyl6, VC.metal, ex, h - 0.48, z, 0.22, 0.06, 0.22, 0, 0, 0, '#1a1c22');
      b.box(VC.solid, SNOW, ex, h + 0.28, z, 0.3, 0.05, 0.3);
    }
    if (pool) K.pool(b, x - side * 0.8, z, 6, 6, hdr(col, pool));
  };
  K.lantern = (b, x, z, { h = 3.8, col = '#ffe0a8' } = {}) => {   // the Arbat's lanterns: a cast-iron post, a glass lantern under its little roof
    b.cyl(VC.metal, '#1a1c22', x, 0.3, z, 0.18, 0.6, 'cyl8');
    b.cyl(VC.metal, '#1a1c22', x, h / 2, z, 0.06, h, 'cyl8');
    b.add(G.cyl6, VC.glow, x, h + 0.32, z, 0.44, 0.6, 0.44, 0, 0, 0, hdr(col, 2.2));
    b.add(G.cone8, VC.metal, x, h + 0.75, z, 0.6, 0.3, 0.6, 0, 0, 0, '#1a1c22');
    b.box(VC.solid, SNOW, x, h + 0.92, z, 0.32, 0.06, 0.32);
    K.pool(b, x, z, 5, 5, hdr(col, 0.12));
  };
  K.sodium = (b, x, z, side) => {   // a concrete post with a sodium lamp, the outer districts' orange light
    b.cyl(VC.solid, '#8a8a88', x, 4.5, z, 0.12, 9, 'cyl8');
    beam(b, VC.solid, x, 8.8, z, x - side * 1.6, 9.0, z, 0.08, '#8a8a88');
    b.box(VC.glow, hdr('#ffa040', 2.6), x - side * 1.7, 8.9, z, 0.6, 0.14, 0.32);
    K.pool(b, x - side * 1.6, z, 8, 8, hdr('#ff9a3a', 0.14));
  };
  K.bench = (b, x, z, side, { people = chance(0.3) } = {}) => {
    b.box(VC.solid, '#4a3020', x, 0.45, z, 0.5, 0.08, 1.8); b.box(VC.solid, '#4a3020', x + side * 0.24, 0.75, z, 0.06, 0.45, 1.8);
    b.box(VC.solid, SNOW, x, 0.52, z, 0.46, 0.06, 1.7);
    for (const e of [-1, 1]) b.box(VC.metal, '#1a1c20', x, 0.22, z + e * 0.75, 0.5, 0.44, 0.06);
    if (people) K.person(b, x - side * 0.05, z + rand(-0.5, 0.5), { seated: true, ry: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
  };
  K.streetSign = (b, x, y, z, side, i = randi(0, STREETS.length - 1)) => b.add(planeUV(K.streetRects[i]), K.streetMat, x - side * 0.04, y, z, 1.4, 0.53, 1, 0, face(side), 0);
  K.kiosk = (b, x, z, side, i = randi(0, KIOSKS.length - 1)) => {   // a lit kiosk at the kerb, its board on top
    const fx = x - side * 1.05;
    b.block(VC.solid, pick(['#e8e4dc', '#2a5a8a', '#3a6a4a', '#8a2a2a', '#f2c230']), x, 0, z, 2.1, 2.6, 2.8);
    b.box(VC.glow, hdr(pick(['#fff0d0', '#ffe0b0']), 1.0), fx - side * 0.01, 1.4, z, 0.05, 1.3, 2.3);
    b.box(VC.solid, '#3a3a3e', fx - side * 0.1, 0.75, z, 0.3, 0.1, 2.6);
    b.add(planeUV(K.kioskRects[i]), K.kioskMat, fx - side * 0.03, 2.35, z, 2.6, 0.65, 1, 0, face(side), 0);
    b.box(VC.solid, SNOW, x, 2.68, z, 2.3, 0.16, 3.0);
    K.pool(b, fx - side * 1.2, z, 3, 3.4, hdr('#ffe0b0', 0.12));
  };
  K.metro = (b, x, z, side) => {   // the metro: the red М on its pole, lit
    b.cyl(VC.metal, '#2a2a30', x, 2.4, z, 0.1, 4.8, 'cyl8');
    b.add(OCT8, VC.solid, x, 5.4, z, 1.6, 0.3, 1.3, Math.PI / 2, face(side), 0, '#f4f4f4');   // the white octagon, upright on the pole's top
    b.add(G.plane, K.metroM, x - side * 0.17, 5.42, z, 1.2, 1.2, 1, 0, face(side), 0);
    b.add(G.plane, K.metroM, x + side * 0.17, 5.42, z, 1.2, 1.2, 1, 0, face(side) + Math.PI, 0);
    K.pool(b, x, z, 4, 4, hdr('#ff4a4a', 0.12));
  };
  K.wires = (b, x, z0, z1, side) => {   // a trolleybus's two wires along the kerb, on brackets from posts on the pavement
    for (const dx of [0, 0.6]) b.box(VC.metal, '#1a1a1e', x + side * dx, 6.6, -(z0 + z1) / 2, 0.03, 0.03, z1 - z0);
    for (let z = z0 + 4; z < z1; z += 26) { b.cyl(VC.metal, '#3a3e46', x + side * 3.2, 4, -z, 0.1, 8, 'cyl8'); beam(b, VC.metal, x + side * 3.2, 7.4, -z, x - side * 0.2, 6.75, -z, 0.04, '#3a3e46'); }
  };
  K.trolleybus = (b, x, z, dir = 1) => {   // blue and white, its two poles up to the wires
    b.block(VC.solid, '#e8ecf0', x, 0.3, z, 2.5, 2.9, 11.5);
    b.box(VC.solid, '#2a5ab0', x, 0.9, z, 2.52, 0.9, 11.5);
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#fff0d0', 0.9), x + e * 1.26, 2.1, z, 0.03, 1.1, 9.8);
    b.box(VC.glow, hdr('#dfeaff', 0.6), x, 2.1, z - dir * 5.76, 2.2, 1.2, 0.03);
    b.box(VC.glow, hdr('#ffa02a', 2.0), x, 3.0, z - dir * 5.77, 1.4, 0.24, 0.03);
    for (const dz of [-3.8, 3.6]) for (const e of [-1, 1]) b.cyl(VC.solid, '#141414', x + e * 1.15, 0.5, z + dz, 0.5, 0.36, 'cyl', 0, Math.PI / 2);
    for (const dx of [0.2, -0.4]) beam(b, VC.metal, x + dx, 3.3, z + dir * 3, x + dx * 1.5 + (x > 0 ? 0.3 : -0.3), 6.62, z - dir * 3.5, 0.04, '#2a2a2e');
    b.box(VC.solid, SNOW, x, 3.28, z, 2.2, 0.1, 10);
  };
  K.lada = (b, x, z, dir = pick([-1, 1]), { snowed = chance(0.5), col = pick(LADA) } = {}) => {   // a boxy old Lada, often under a cap of snow
    b.block(VC.solid, col, x, 0.32, z, 1.62, 0.58, 4.1);
    b.block(VC.solid, col, x, 0.9, z + dir * 0.15, 1.5, 0.5, 2.1);
    b.box(VC.glow, hdr('#2a3040', 1), x, 1.12, z + dir * 0.15, 1.52, 0.32, 1.9);
    for (const dz of [-1.3, 1.3]) for (const e of [-1, 1]) b.cyl(VC.solid, '#141414', x + e * 0.74, 0.3, z + dz, 0.29, 0.2, 'cyl', 0, Math.PI / 2);
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#fff4d0', snowed ? 0.4 : 2.0), x + e * 0.55, 0.58, z - dir * 2.06, 0.3, 0.18, 0.04);
    if (snowed) { b.add(G.sphLow, VC.solid, x, 1.18, z + dir * 0.15, 1.5, 0.28, 2.0, 0, 0, 0, SNOW); b.add(G.sphLow, VC.solid, x, 0.64, z - dir * 1.4, 1.5, 0.2, 1.2, 0, 0, 0, SNOW); b.add(G.sphLow, VC.solid, x, 0.64, z + dir * 1.55, 1.5, 0.2, 1.0, 0, 0, 0, SNOW); }
  };
  K.taxi = (b, x, z, dir = pick([-1, 1])) => {   // a Moscow taxi: yellow, the band of checks, the ТАКСИ light on the roof
    b.block(VC.solid, '#f2c200', x, 0.32, z, 1.8, 0.62, 4.5);
    b.block(VC.solid, '#f2c200', x, 0.94, z + dir * 0.1, 1.66, 0.56, 2.5);
    b.box(VC.glow, hdr('#2a3040', 1), x, 1.18, z + dir * 0.1, 1.68, 0.36, 2.3);
    for (let k = 0; k < 10; k++) for (const e of [-1, 1]) b.box(VC.solid, k % 2 ? '#141414' : '#f2c200', x + e * 0.91, 0.74, z - 1.9 + k * 0.42, 0.02, 0.14, 0.42);
    for (const dz of [-1.4, 1.4]) for (const e of [-1, 1]) b.cyl(VC.solid, '#141414', x + e * 0.8, 0.3, z + dz, 0.3, 0.22, 'cyl', 0, Math.PI / 2);
    b.box(VC.glow, hdr('#ffe060', 2.0), x, 1.32, z, 0.7, 0.2, 0.26);
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#fff4d0', 2.0), x + e * 0.6, 0.6, z - dir * 2.26, 0.3, 0.16, 0.04);
  };
  K.yolka = (b, x, z, s = 1, { lights = 'multi', star = true } = {}) => {   // a New Year tree, its lights, the red star on top
    const top = K.spruce(b, x, z, s, { lights, baubles: true, star: false });
    if (star) { const y = top + 0.3 * s; b.add(STAR5, VC.glow, x, y, z, 0.9 * s, 0.9 * s, 1, 0, 0, 0, hdr('#ff3030', 2.6)); b.add(STAR5, VC.glow, x, y, z, 0.9 * s, 0.9 * s, 1, 0, Math.PI / 2, 0, hdr('#ff3030', 2.6)); }
    K.pool(b, x, z, 7 * s, 7 * s, hdr('#ffd890', 0.12));
  };
  K.garland = (b, z, { y = 15.6, w = X0, n = 26, col = ['#fff4d8', '#ffe8b0', '#dff0ff'], drops = true, posts = false } = {}) => {   // New Year lights across the street, high over the jetpack; posts: poles up the fronts where the houses are lower than the lights
    for (let k = 0; k <= n; k++) {
      const t = k / n, x = -w + 2 * w * t, yy = y - Math.sin(t * Math.PI) * 1.3;
      b.sph(VC.glow, hdr(pick(col), 2.4), x, yy, z, 0.1, true);
      if (drops && k % 3 === 1 && Math.abs(x) > 4.5) {   // icicle lights hanging from it on their strand, clear of the flight path
        b.box(VC.metal, '#2a2a2e', x, yy - 0.63, z, 0.02, 1.26, 0.02);
        for (let d = 1; d <= 3; d++) b.sph(VC.glow, hdr(pick(col), 2.0), x, yy - d * 0.42, z, 0.07, true);
      }
    }
    beam(b, VC.metal, -w, y, z, 0, y - 1.35, z, 0.02, '#2a2a2e'); beam(b, VC.metal, 0, y - 1.35, z, w, y, z, 0.02, '#2a2a2e');
    for (const e of [-1, 1]) {
      if (posts) b.cyl(VC.metal, '#2a2a2e', e * (w - 0.1), (y + 0.4) / 2, z, 0.07, y + 0.4, 'cyl6');
      else beam(b, VC.metal, e * w, y, z, e * (w + 1.2), y + 0.3, z, 0.03, '#2a2a2e');   // the brackets into the fronts either side
    }
    b.add(SNOWFLAKE, VC.glow, 0, y - 0.6, z, 1.6, 1.6, 1, 0, 0, 0, hdr('#dff0ff', 2.2));   // a snowflake of lights in the middle
  };
  K.lightBall = (b, x, z, r = 1.2) => {   // a great ball of lights on the boulevard: a soft glow inside, the bulbs on its wires
    const col = pick(['#ffe0a0', '#dff0ff', '#ffc0d8']), n = Math.round(r * 22);
    b.add(G.sphLow, VC.glow, x, r, z, r * 1.9, r * 1.9, r * 1.9, 0, rand(0, 3), 0, hdr(col, 0.55));
    for (let k = 0; k < n; k++) { const yy = 1 - (2 * (k + 0.5)) / n, rr = Math.sqrt(1 - yy * yy), a = k * 2.39996; b.sph(VC.glow, hdr(col, 2.2), x + Math.cos(a) * rr * r, r + yy * r, z + Math.sin(a) * rr * r, 0.05, true); }
    K.pool(b, x, z, r * 5, r * 5, hdr('#ffe0b0', 0.14));
  };
  K.lightArch = (b, x, z, side, { w = 4, h = 4.4 } = {}) => {   // an arch of lights over a walk, parallel to the track
    const P = (k) => { const a = (k / 10) * Math.PI; return [x - side * Math.cos(a) * (w / 2), Math.sin(a) * h + 0.2, z]; };
    for (let k = 0; k <= 10; k++) { b.sph(VC.glow, hdr(pick(['#fff4d8', '#ffd890']), 2.4), ...P(k), 0.09, true); if (k) beam(b, VC.metal, ...P(k - 1), ...P(k), 0.025, '#2a2a2e'); }
    for (const k of [0, 10]) b.box(VC.metal, '#2a2a2e', P(k)[0], 0.1, z, 0.05, 0.2, 0.05);   // the wire's feet in the snow
  };
  K.stall = (b, x, z, side, { kind = 'matryoshka' } = {}) => {   // a wooden stall on the Arbat: matryoshkas, ushankas, painted boxes
    b.block(VC.solid, '#7a4a2a', x, 0, z, 1.0, 1.1, 2.4);
    b.box(VC.solid, '#a8201a', x, 2.6, z, 1.5, 0.1, 2.8);
    for (const e of [-1, 1]) b.cyl(VC.solid, '#5a3a20', x + side * 0.4, 1.8, z + e * 1.3, 0.05, 1.6, 'cyl6');
    if (kind === 'matryoshka') b.box(VC.solid, '#6a4020', x + side * 0.05, 1.62, z, 0.8, 0.05, 2.65);   // the shelf for the second row
    if (kind === 'matryoshka') for (let r = 0; r < 2; r++) for (let k = 0; k < 7; k++) {
      const mz = z - 1.0 + k * 0.33, my = 1.1 + r * 0.55, s = rand(0.7, 1.1), c = pick(['#c8202a', '#e8b030', '#2a5ab0', '#2a8a4a', '#a8102a']);
      b.add(G.sphLow, VC.solid, x - side * 0.15, my + 0.14 * s, mz, 0.2 * s, 0.28 * s, 0.2 * s, 0, 0, 0, c);
      b.add(G.sphLow, VC.solid, x - side * 0.15, my + 0.34 * s, mz, 0.14 * s, 0.14 * s, 0.14 * s, 0, 0, 0, c);
      b.add(G.plane, VC.solid, x - side * 0.25, my + 0.34 * s, mz, 0.08 * s, 0.08 * s, 1, 0, face(side), 0, '#f8e0c8');
    }
    else for (let k = 0; k < 6; k++) b.add(G.cyl8, VC.solid, x - side * 0.1, 1.25, z - 0.9 + k * 0.36, 0.3, 0.24, 0.3, 0, 0, 0, pick(['#3a2a20', '#5a4030', '#c8b8a0', '#1a1a1a']));   // fur hats
    K.person(b, x + side * 0.9, z + rand(-0.6, 0.6), { hat: 'ushanka', puffer: false, ry: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
  };
  K.painter = (b, x, z, side) => {   // a painter at an easel, a few canvases leaning against it
    for (const e of [-1, 1]) beam(b, VC.solid, x + e * 0.3, 0, z, x, 1.7, z, 0.04, '#6a4a2a');
    b.add(G.box, VC.solid, x - side * 0.08, 1.3, z, 0.04, 0.8, 1.0, 0, 0, side * 0.1, pick(['#3a5a8a', '#c8803a', '#2a6a4a', '#e8d8c0']));
    for (let k = 0; k < 3; k++) b.add(G.box, VC.solid, x - side * 0.2, 0.4, z + 0.8 + k * 0.5, 0.04, 0.7, 0.6, 0, 0, side * 0.2, pick(['#8a3a2a', '#3a6a9a', '#e8c040', '#2a5a3a']));
    K.person(b, x + side * 0.7, z, { hat: pick(['fur', 'knit']), ry: side < 0 ? Math.PI / 2 : -Math.PI / 2 });
  };
  K.musician = (b, x, z, side) => {   // a street musician with a bayan, the case open on the snow
    K.person(b, x, z, { hat: 'ushanka', puffer: false, ry: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
    b.box(VC.solid, '#a8201a', x - side * 0.28, 1.15, z, 0.3, 0.4, 0.5);
    b.box(VC.solid, '#f0f0f0', x - side * 0.3, 1.15, z, 0.32, 0.38, 0.12);
    b.box(VC.solid, '#3a2a1a', x - side * 0.8, 0.06, z, 0.6, 0.12, 0.9);
  };
  K.statue = (b, x, z, side) => {   // a poet in a long coat on his granite pedestal, snow on his shoulders
    b.block(VC.solid, '#4a4a50', x, 0, z, 2.2, 0.4, 2.2);
    b.block(VC.solid, '#5a5a62', x, 0.4, z, 1.5, 2.6, 1.5);
    const br = '#3a3a34';
    b.block(VC.metal, br, x, 3.0, z, 0.9, 1.8, 0.7);
    b.add(G.box, VC.metal, x, 2.0 + 3.0, z, 0.8, 1.0, 0.6, 0, 0, 0, br);
    b.sph(VC.metal, br, x, 5.85, z, 0.32);
    for (const e of [-1, 1]) b.box(VC.solid, SNOW, x + e * 0.3, 5.5, z, 0.3, 0.06, 0.5);
    b.box(VC.solid, SNOW, x, 6.18, z, 0.34, 0.06, 0.34);
    b.box(VC.glow, hdr('#ffe0b0', 2.0), x - side * 1.3, 0.12, z, 0.4, 0.16, 0.4);
  };
  K.drinks = (b, x, z, side, i = pick([8, 9, 4])) => {   // a stand of hot drinks: mulled wine, sbiten, tea, steam over the urn
    b.block(VC.solid, '#7a4a2a', x, 0, z, 1.4, 1.1, 2.6);
    b.add(G.cone4, VC.solid, x, 3.0, z, 2.4, 1.1, 3.6, 0, 0, 0, SNOW);
    for (const e of [-1, 1]) b.cyl(VC.solid, '#5a3a20', x, 1.7, z + e * 1.2, 0.06, 2.5, 'cyl6');
    b.add(planeUV(K.kioskRects[i]), K.kioskMat, x - side * 0.72, 2.25, z, 2.4, 0.6, 1, 0, face(side), 0);
    b.cyl(VC.metal, '#c89a40', x, 1.45, z - 0.6, 0.25, 0.7);
    b.box(VC.glow, hdr('#ffd890', 1.4), x - side * 0.7, 1.0, z, 0.04, 0.3, 2.2);
    K.pool(b, x - side, z, 3, 3, hdr('#ffd8a0', 0.14));
  };

  // ---------- facades ----------
  K.shopfront = (b, i, { signs = STALIN_SIGNS, h = 3.6, inset = 0 } = {}) => {   // big panes of warm light with the goods in them, the board above; inset: how far the ground floor stands out
    const s = i.side, x = i.face - s * (0.02 + inset), L = Math.min(i.len - 1.6, 8), sign = pick(signs);
    if (L < 2) return null;
    b.add(planeUV(K.goodsRects[GI[sign.goods]]), K.goodsMat, x - s * 0.03, h * 0.47 + 0.2, i.z, L, h * 0.8, 1, 0, face(s), 0);
    for (let k = 1; k < Math.round(L / 1.8); k++) b.box(VC.solid, '#3a3a40', x - s * 0.05, h * 0.47 + 0.2, i.z - L / 2 + (k * L) / Math.round(L / 1.8), 0.05, h * 0.8, 0.07);
    b.box(VC.solid, '#3a3a40', x - s * 0.05, h * 0.87 + 0.2, i.z, 0.06, 0.08, L);
    const sw = Math.min(L, 5.6);
    b.add(planeUV(K.signRects[sign.i]), K.signMat, x - s * 0.06, h + 0.62, i.z, sw, (sw * 112) / 512, 1, 0, face(s), 0);
    if (chance(0.4)) for (let k = 0; k <= 16; k++) b.sph(VC.glow, hdr(pick(['#ffe0a0', '#dff0ff', '#ff8a8a']), 2.0), x - s * 0.08, h * 0.9 + 0.3 - Math.sin((k / 16) * Math.PI) * 0.35, i.z - L / 2 + (k * L) / 16, 0.05, true);   // New Year lights round the window
    K.pool(b, x - s * 1.4, i.z, 2.8, L, hdr('#ffd9a0', 0.1));
    return sign;
  };
  // a row of buildings along one side: each front is told its building's colour
  const row = (b, side, types, { x0 = X0, depth = [8, 14], gap = [0.2, 1.4], z0 = 0, z1 = CHUNK_LEN, setback = [0, 1.5] } = {}) => {
    const total = types.reduce((n, t) => n + (t.weight || 1), 0);
    for (let z = z0; z < z1 - 2.5;) {
      let r = Math.random() * total, ty = types[0];
      for (const t of types) { r -= t.weight || 1; if (r <= 0) { ty = t; break; } }
      const len = Math.min(rand(...ty.w), z1 - z), d = rand(...depth), h = rand(...ty.h), xIn = x0 + rand(...setback), col = pick(ty.colors);
      const cx = side * (xIn + d / 2), cz = -(z + len / 2);
      b.addM(buildingGeo(d, h, len, ty.tex, ty.cellW || 1.35, ty.cellH || 2.2), ty.mat, at(cx, 0, cz), col);
      const info = { x: cx, z: cz, d, len, h, side, face: side * xIn, z0: z, z1: z + len, col };
      if (ty.roof) ty.roof(b, info);
      if (ty.front) ty.front(b, info);
      z += len + rand(...gap);
    }
  };
  K.row = row;
  // Stalinist blocks: the rusticated ground floor of shops, cornices, pilasters, balconies on balusters, a turret now and then
  const stalinRoof = (b, i) => {
    b.box(VC.solid, shade(i.col, 1.04), i.x, i.h + 0.5, i.z, i.d + 0.3, 1.0, i.len + 0.3);
    b.box(VC.solid, SNOW, i.x, i.h + 1.06, i.z, i.d + 0.4, 0.14, i.len + 0.4);
    b.box(VC.solid, SNOW, i.x, i.h + 0.1, i.z, i.d - 0.4, 0.3, i.len - 0.4);
    if (chance(0.22) && i.len > 14) {   // a corner turret with its spire
      const tx = i.face + i.side * 3.2, tz = i.z - i.len / 2 + 3.2;
      b.block(VC.solid, i.col, tx, i.h, tz, 5, 5, 5);
      b.box(VC.solid, '#fbf6ea', tx, i.h + 5, tz, 5.6, 0.5, 5.6);
      b.add(OCT8, VC.solid, tx, i.h + 6.6, tz, 3.4, 3.2, 3.4, 0, Math.PI / 8, 0, i.col);
      b.add(G.cone8, VC.metal, tx, i.h + 8.2 + 2.5, tz, 1.4, 5, 1.4, 0, 0, 0, '#c8a050');
      b.box(VC.solid, SNOW, tx, i.h + 5.3, tz, 5.2, 0.12, 5.2);
    }
  };
  const stalinFront = (b, i) => {
    const s = i.side, trim = '#fbf6ea', dark = shade(i.col, 0.8);
    b.box(VC.solid, dark, i.face - s * 0.15, 2.7, i.z, 0.3, 5.4, i.len);   // the rusticated granite of the ground floor
    for (let y = 0.9; y < 5.2; y += 0.9) b.box(VC.solid, shade(i.col, 0.6), i.face - s * 0.31, y, i.z, 0.02, 0.06, i.len);
    K.shopfront(b, i, { signs: STALIN_SIGNS, h: 4.2, inset: 0.32 });
    b.box(VC.solid, trim, i.face - s * 0.32, 5.55, i.z, 0.64, 0.36, i.len);
    b.box(VC.solid, trim, i.face - s * 0.48, i.h - 0.7, i.z, 0.96, 0.9, i.len + 0.6);
    b.box(VC.solid, shade(i.col, 0.9), i.face - s * 0.08, i.h - 1.8, i.z, 0.16, 1.2, i.len);   // the frieze under the cornice
    K.icicles(b, i.face - s * 0.95, i.h - 1.15, i.z0, i.z1, s, { step: 0.6, max: 0.9 });
    for (let z = i.z - i.len / 2 + 1.8; z < i.z + i.len / 2 - 1; z += 3.6) b.box(VC.solid, trim, i.face - s * 0.12, (6 + i.h - 1.8) / 2, z, 0.24, i.h - 7.8, 0.5);   // pilasters
    if (chance(0.6)) for (const y of [8.8, 18.4]) if (y < i.h - 4) {   // balconies on balusters
      const w = Math.min(i.len - 3, 5), bx = i.face - s * 0.6;
      b.box(VC.solid, trim, bx, y, i.z, 1.2, 0.2, w);
      for (let k = 0; k <= Math.round(w / 0.35); k++) b.box(VC.solid, trim, bx - s * 0.5, y + 0.45, i.z - w / 2 + k * 0.35, 0.12, 0.7, 0.12);
      b.box(VC.solid, trim, bx - s * 0.5, y + 0.85, i.z, 0.2, 0.12, w);
      b.box(VC.solid, SNOW, bx, y + 0.13, i.z, 1.1, 0.06, w - 0.1);
    }
    if (chance(0.25) && i.len > 12) {   // an arch through to the courtyard
      const az = i.z + i.len / 2 - 2.6;
      b.box(VC.solid, '#14141a', i.face - s * 0.32, 2.4, az, 0.04, 4.8, 3.2);
      b.box(VC.glow, hdr('#ffc070', 0.5), i.face + s * 0.4, 1.4, az, 0.04, 2.8, 2.6);
    }
    if (chance(0.3)) K.streetSign(b, i.face - s * 0.32, 4.6, i.z + i.len / 2 - 0.9, s);
  };
  K.stalinTypes = (signs) => [
    { mat: K.stalMat, tex: stal, colors: STALIN, w: [14, 26], h: [24, 34], weight: 2, cellW: 1.9, cellH: 3.3, roof: stalinRoof, front: stalinFront },
    { mat: K.stalArchMat, tex: stalArch, colors: STALIN, w: [12, 22], h: [22, 30], weight: 1.4, cellW: 1.9, cellH: 3.2, roof: stalinRoof, front: stalinFront },
  ];
  K.stalinRow = (b, s, z0 = 0, z1 = CHUNK_LEN, { x0 = 14 } = {}) => row(b, s, K.stalinTypes(), { x0, depth: [14, 18], gap: [0, 0.3], z0, z1, setback: [0, 0.3] });
  // the old town's merchant houses: pastel stucco, white pilasters and pediments, painted roofs under snow, icicles
  const mansionRoof = (b, i) => {
    const col = pick(ROOF), h = rand(1.6, 2.6);
    b.box(VC.solid, '#f6f2ea', i.x, i.h - 0.06, i.z, i.d + 0.7, 0.3, i.len + 0.7);
    b.box(VC.solid, col, i.x, i.h + 0.14, i.z, i.d + 0.9, 0.1, i.len + 0.9);   // the painted iron showing at the edge
    b.add(G.cone4, VC.solid, i.x, i.h + 0.18 + h / 2, i.z, (i.d + 0.9) * 1.414, h, (i.len + 0.9) * 1.414, 0, 0, 0, chance(0.75) ? SNOW : col);
    K.icicles(b, i.face - i.side * 0.24, i.h - 0.2, i.z0, i.z1, i.side);
    for (let k = randi(1, 2); k > 0; k--) { const cx = i.x + rand(-1, 1), cz = i.z + rand(-i.len / 3, i.len / 3); b.block(VC.solid, '#a86a5a', cx, i.h + 0.6, cz, 0.6, h + 0.4, 0.6); b.box(VC.solid, SNOW, cx, i.h + h + 1.05, cz, 0.7, 0.1, 0.7); }
    if (chance(0.4)) { const dz = i.z + rand(-i.len / 4, i.len / 4), dx = i.face + i.side * 1.6; b.block(VC.solid, '#f6f2ea', dx, i.h + 0.3, dz, 1.0, 1.2, 1.2); b.box(VC.glow, hdr(chance(0.6) ? '#ffd9a0' : '#1a1e28', 1.1), dx - i.side * 0.51, i.h + 0.85, dz, 0.04, 0.6, 0.5); }
  };
  const mansionFront = (b, i, signs) => {
    const s = i.side, trim = '#fbf8f2';
    for (const e of [-1, 1]) b.box(VC.solid, trim, i.face - s * 0.09, i.h / 2, i.z + e * (i.len / 2 - 0.3), 0.18, i.h, 0.5);
    b.box(VC.solid, trim, i.face - s * 0.15, i.h - 0.5, i.z, 0.3, 0.5, i.len);
    if (i.len > 9 && chance(0.6)) {   // a portico of half-columns under a pediment
      const w = Math.min(i.len * 0.55, 7);
      for (let k = 0; k < 4; k++) b.cyl(VC.solid, trim, i.face - s * 0.12, (4 + i.h - 1) / 2, i.z - w / 2 + (k * w) / 3, 0.22, i.h - 5, 'cyl8');
      const ped = new THREE.Shape(); ped.moveTo(-w / 2 - 0.4, 0); ped.lineTo(w / 2 + 0.4, 0); ped.lineTo(0, 1.4); ped.lineTo(-w / 2 - 0.4, 0);
      b.addM(new THREE.ExtrudeGeometry(ped, { depth: 0.4, bevelEnabled: false }), VC.solid, new THREE.Matrix4().makeRotationY(face(s) + Math.PI).setPosition(i.face - s * 0.02, i.h - 0.3, i.z), trim);
      b.box(VC.solid, SNOW, i.face - s * 0.22, i.h + 0.35, i.z, 0.3, 0.06, w);
    }
    if (chance(0.55)) K.shopfront(b, i, { signs, h: 3.2 });
    else {   // a door under a wrought-iron canopy, its lamp
      const dz = i.z + rand(-i.len / 4, i.len / 4);
      b.box(VC.solid, '#3a2418', i.face - s * 0.04, 1.2, dz, 0.06, 2.4, 1.3);
      b.box(VC.metal, '#1a1c20', i.face - s * 0.6, 2.7, dz, 1.2, 0.06, 1.8);
      b.box(VC.solid, SNOW, i.face - s * 0.6, 2.76, dz, 1.15, 0.06, 1.75);
      b.box(VC.glow, hdr('#ffd9a0', 1.8), i.face - s * 0.3, 2.45, dz + 1.0, 0.12, 0.2, 0.14);
    }
    if (chance(0.25)) K.streetSign(b, i.face - s * 0.1, 3.6, i.z + i.len / 2 - 0.9, s);
  };
  K.mansionTypes = (signs = ARBAT_SIGNS) => [
    { mat: K.mansMat, tex: mans, colors: PASTEL, w: [7, 13], h: [8, 14], weight: 2, cellW: 2.0, cellH: 3.4, roof: mansionRoof, front: (b, i) => mansionFront(b, i, signs) },
    { mat: K.mansArchMat, tex: mansArch, colors: PASTEL, w: [6, 11], h: [7, 12], weight: 1.4, cellW: 2.0, cellH: 3.4, roof: mansionRoof, front: (b, i) => mansionFront(b, i, signs) },
  ];
  K.mansionRow = (b, s, z0 = 0, z1 = CHUNK_LEN, { x0 = X0, signs } = {}) => row(b, s, K.mansionTypes(signs), { x0, depth: [9, 13], gap: [0, 0.5], z0, z1, setback: [0, 0.5] });
  // the panel blocks: rows of glazed balconies, the stairwells lit, the entrances' canopies, antennas on the roof
  const panelRoof = (b, i) => {
    b.box(VC.solid, SNOW, i.x, i.h + 0.15, i.z, i.d, 0.3, i.len);
    b.block(VC.solid, '#c8c4bc', i.x, i.h, i.z + rand(-i.len / 4, i.len / 4), 4, 2.6, 4);
    for (let k = randi(2, 5); k > 0; k--) { const ax = i.x + rand(-i.d / 3, i.d / 3), az = i.z + rand(-i.len / 2.5, i.len / 2.5); b.cyl(VC.metal, '#5a5e66', ax, i.h + 1.4, az, 0.04, 2.8, 'cyl6'); b.box(VC.metal, '#5a5e66', ax, i.h + 2.4, az, 1.4, 0.04, 0.04); }
  };
  const panelFront = (b, i) => {
    const s = i.side, sect = Math.max(1, Math.round(i.len / 14));
    for (let k = 0; k < sect; k++) {
      const sz = i.z - i.len / 2 + (k + 0.5) * (i.len / sect);
      for (let y = 2.9; y < i.h - 0.5; y += 2.8) b.box(VC.glow, hdr(chance(0.7) ? '#ffe8c0' : '#2a2e38', 0.85), i.face - s * 0.03, y + 1.3, sz, 0.05, 1.0, 1.1);   // the stairwell
      b.box(VC.solid, '#a8a49c', i.face - s * 0.9, 2.5, sz, 1.8, 0.14, 2.6);   // the entrance canopy
      b.box(VC.solid, SNOW, i.face - s * 0.9, 2.6, sz, 1.75, 0.06, 2.5);
      b.box(VC.solid, '#5a4a3a', i.face - s * 0.04, 1.1, sz, 0.06, 2.2, 1.3);
      b.box(VC.glow, hdr('#fff0d0', 1.8), i.face - s * 0.2, 2.3, sz, 0.14, 0.14, 0.3);
      for (const e of [-1, 1]) {   // a column of balconies either side of it, glazed in all sorts of ways
        const bz = sz + e * Math.min(4.2, i.len / sect / 3);
        for (let y = 3.4; y < i.h - 1.6; y += 2.8) {
          const r = Math.random();
          b.box(VC.solid, '#d8d4cc', i.face - s * 0.6, y, bz, 1.2, 0.14, 2.6);
          if (r < 0.55) { b.box(VC.glow, hdr(chance(0.45) ? '#ffe4b8' : '#2a3040', 0.7), i.face - s * 0.62, y + 1.05, bz, 1.1, 1.8, 2.5); b.box(VC.solid, pick(['#e8e4dc', '#c8c4bc', '#a8b4c0', '#d8c8a8']), i.face - s * 1.2, y + 0.45, bz, 0.04, 0.8, 2.6); }
          else { b.box(VC.solid, pick(['#b8b4ac', '#8a8a8e', '#a89a8a']), i.face - s * 1.2, y + 0.5, bz, 0.06, 0.9, 2.6); if (chance(0.25)) b.box(VC.solid, SNOW, i.face - s * 0.7, y + 0.15, bz, 0.9, 0.12, 2.4); }
        }
      }
    }
  };
  K.panelTypes = () => [{ mat: K.panelMat, tex: panel, colors: PANEL, w: [22, 40], h: [25, 46], weight: 1, cellW: 1.5, cellH: 2.8, roof: panelRoof, front: panelFront }];
  K.panelRow = (b, s, z0 = 0, z1 = CHUNK_LEN, { x0 = 22 } = {}) => row(b, s, K.panelTypes(), { x0, depth: [12, 14], gap: [6, 14], z0, z1, setback: [0, 4] });
  // a little church set back in its churchyard, behind a low white wall
  K.churchyard = (b, s, zc, { x = 26, w = rand(8, 11) } = {}) => {
    const col = pick(['#f4ece0', '#f0dca0', '#f2c8c0', '#c8dcec', '#d8ead8', '#f8f4ee']);
    const dk = pick([['gold', K.S.gold, K.S.cGold], ['green', VC.solid, '#2a7a5a'], ['blue', VC.solid, '#2a4ab0']]);
    church(frame(b, s * (x + 1.75 * w - 1), 0, zc, 1, face(s)), K.S, { w, h: rand(8, 10), col, domeMat: dk[1], domeCol: dk[2], domes: chance(0.6) ? 5 : 1, tentBell: chance(0.6) });
    if (dk[0] === 'blue') for (let k = 0; k < 7; k++) b.sph(VC.glow, hdr('#ffe080', 2.0), s * (x + 1.75 * w - 1) + rand(-1, 1), rand(10.6, 12), zc + rand(-1, 1), 0.06, true);   // gold stars on the blue
    b.block(VC.solid, '#f4f0ea', s * (x - 6), 0, zc, 0.5, 1.6, 34);
    b.box(VC.solid, SNOW, s * (x - 6), 1.66, zc, 0.6, 0.12, 34.2);
    b.box(VC.solid, '#2a2a30', s * (x - 6), 1.0, zc + 2, 0.56, 2.0, 2.0);
    K.snowField(b, s * (x + 14), zc, 40, 40, 0.05);
    for (let k = 0; k < 4; k++) (chance(0.5) ? K.birch : (bb, xx, zz) => K.spruce(bb, xx, zz, rand(0.9, 1.2), { lights: false, baubles: false, star: false }))(b, s * rand(x - 2, x + 18), zc + pick([-1, 1]) * rand(10, 15));
    K.pool(b, s * (x + 3), zc, 14, 14, hdr('#ffd9a0', 0.08));
  };
  // a snowed-in courtyard among the panel blocks: a rocket climbing frame, swings, a bench, cars under snow, tin garages
  K.courtyard = (b, s, z0, z1, { x0 = EDGE + 7, x1 = 22 } = {}) => {
    const xc = s * (x0 + x1) / 2, zc = -(z0 + z1) / 2;
    K.snowField(b, xc, zc, x1 - x0, z1 - z0, 0.05);
    const pz = zc + rand(-8, 8), px = s * rand(x0 + 4, x1 - 4);
    b.cyl(VC.metal, '#c8302a', px, 2.4, pz, 0.5, 4.8, 'cyl8');   // the rocket
    b.add(G.cone8, VC.metal, px, 5.4, pz, 1.0, 1.4, 1.0, 0, 0, 0, '#c8302a');
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; beam(b, VC.metal, px, 1.4, pz, px + Math.cos(a) * 1.1, 0, pz + Math.sin(a) * 1.1, 0.08, '#2a5ab0'); }
    const sz = pz + pick([-6, 6]);
    for (const e of [-1, 1]) beam(b, VC.metal, px + e * 1.2, 0, sz, px + e * 1.2, 2.4, sz, 0.07, '#e8c030');
    b.box(VC.metal, '#e8c030', px, 2.4, sz, 2.6, 0.07, 0.07);
    for (const e of [-0.5, 0.5]) { beam(b, VC.metal, px + e, 2.4, sz, px + e, 0.6, sz, 0.02, '#5a5e66'); b.box(VC.solid, '#3a3a3e', px + e, 0.55, sz, 0.4, 0.05, 0.25); }
    K.bench(b, s * (x0 + 1.4), zc + rand(-6, 6), s);
    for (let k = randi(2, 4); k > 0; k--) K.lada(b, s * rand(x0 + 1.5, x1 - 2), -rand(z0 + 3, z1 - 3), pick([-1, 1]), { snowed: chance(0.7) });
    if (chance(0.6)) for (let k = 0, n = randi(2, 4); k < n; k++) {   // a row of tin garages, their doors to the yard, snow on the roofs
      const gz = -(z0 + 4 + k * 3.3), gx = s * (x1 - 3.4), col = pick(['#7a8088', '#5a6a5a', '#8a6a4a', '#4a5a6a', '#9a9a90']);
      b.block(VC.metal, col, gx, 0, gz, 5.2, 2.3, 3.1);
      b.box(VC.solid, shade(col, 0.7), gx - s * 2.61, 1.05, gz, 0.04, 2.0, 2.6);
      b.box(VC.solid, SNOW, gx, 2.36, gz, 5.3, 0.14, 3.2);
    }
    for (let k = randi(1, 3); k > 0; k--) K.birch(b, s * rand(x0 + 1, x1 - 1), -rand(z0 + 2, z1 - 2));
    if (chance(0.5)) K.snowman(b, s * rand(x0 + 2, x1 - 3), -rand(z0 + 3, z1 - 3));
    for (let k = randi(1, 2); k > 0; k--) K.sled(b, s * rand(x0 + 2, x1 - 2), -rand(z0 + 3, z1 - 3));
  };

  K.update = () => {};
  return K;
}
// a little octagonal prism and the two light shapes used above
const OCT8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const STAR5 = (() => {
  const s = new THREE.Shape();
  for (let k = 0; k < 10; k++) { const r = k % 2 ? 0.2 : 0.5, a = Math.PI / 2 + (k * Math.PI) / 5; k ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  return new THREE.ShapeGeometry(s);
})();
const SNOWFLAKE = (() => {   // six arms of bulbs (two crossed boxes per arm), flat
  const parts = [];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2, g = new THREE.BoxGeometry(0.06, 0.5, 0.02);
    g.translate(0, 0.25, 0); g.rotateZ(a); parts.push(g.toNonIndexed());
    for (const e of [-1, 1]) { const h = new THREE.BoxGeometry(0.04, 0.16, 0.02); h.translate(0, 0.08, 0); h.rotateZ(e * 0.7); h.translate(0, 0.3, 0); h.rotateZ(a); parts.push(h.toNonIndexed()); }
  }
  const pos = [], nor = [], uv = [];
  for (const p of parts) { pos.push(...p.attributes.position.array); nor.push(...p.attributes.normal.array); uv.push(...p.attributes.uv.array); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
})();
