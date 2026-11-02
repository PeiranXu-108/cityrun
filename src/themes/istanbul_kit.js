// Istanbul's street kit for an April evening: the stone fronts of Pera with their bay windows, balconies and flags, the
// painted wooden houses of Balat and Fener with their cumbas over the cobbles, the apartment blocks of the
// neighbourhoods with their balconies and satellite dishes, the bazaar's arcades spilling spices, lamps, carpets and
// Turkish delight; simit, chestnut and ice-cream carts, tea gardens, fishermen on the quays, ferries and fishing boats,
// street cats and gulls, tulip beds, Judas trees in flower, plane trees and cypresses, yellow taxis and dolmuş.
// Every sign is in Turkish.
import { THREE, VC, G, std, basic, hdr, canvasTex, planeUV, windowTex, buildingGeo, foliageMat, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { facadeMat, EDGE, at, waterMat } from './common.js';
import { beam } from './tokyo_kit.js';
import { parkTreeKit } from './trees.js';

export const SANS = '"Chakra Petch", "Helvetica Neue", Arial, sans-serif';
export const DISPLAY = '"Russo One", "Arial Black", sans-serif';
export const SERIF = '"Playfair Display", Georgia, "Times New Roman", serif';
export const GLYPHS = 'ÇĞİÖŞÜçğıöşüÂâ';   // the Turkish letters on the signs: main.js loads the fonts' latin-ext subsets for them
export const X0 = 11;   // the building line
export const face = (s) => (-s * Math.PI) / 2;   // turns a plane on side s to face the track

// ---------- textures ----------
function cobbleTex() {   // Arnavut kaldırımı: rough, rounded setts, the joints dark
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#2c2824'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h + 14; y += 14) for (let x = (y / 14) % 2 ? 0 : 8; x < w + 16; x += 16) {
      const cx = x + rand(-2.5, 2.5), cy = y + rand(-2.5, 2.5), rx = rand(6, 8), ry = rand(5, 7), v = randi(-14, 14);
      const c = pick([[122, 116, 106], [132, 124, 112], [108, 102, 94], [146, 138, 124], [98, 92, 84]]);
      g.fillStyle = `rgb(${c[0] + v},${c[1] + v},${c[2] + v})`;
      g.beginPath(); g.ellipse(cx % w, cy % h, rx, ry, rand(-0.5, 0.5), 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.ellipse((cx % w) - 1.5, (cy % h) - 1.5, rx * 0.55, ry * 0.45, 0, 0, 7); g.fill();
    }
  });
}
function paveTex() {   // the squares' big pale flagstones
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#6a645c'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? 0 : 24; x < w + 48; x += 48) {
      const v = randi(-10, 10); g.fillStyle = `rgb(${168 + v},${160 + v},${148 + v})`; g.fillRect((x % w) + 1, y + 1, 46, 30);
      if (x + 46 > w) g.fillRect(0, y + 1, (x + 46) % w, 30);
    }
  });
}
function woodTex() {   // clapboards painted white (each house tints them), tall sash windows in white frames
  const cols = 4, rows = 8, cw = 40, ch = 52, W = cols * cw, H = rows * ch;
  const lit = Array.from({ length: cols * rows }, () => (chance(0.48) ? pick(['#ffd9a0', '#ffe8c0', '#ffc880', '#fff0d8']) : null));
  const win = (c, r) => [c * cw + 11, r * ch + 10, cw - 22, ch - 20];
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = '#f2eee6'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 4) { g.fillStyle = `rgba(0,0,0,${rand(0.06, 0.13)})`; g.fillRect(0, y + 3, W, 1); }
    for (let r = 0; r < rows; r++) {
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(0, r * ch, W, 3);
      for (let c = 0; c < cols; c++) {
        const [x, y, w, h] = win(c, r);
        g.fillStyle = '#fbfaf6'; g.fillRect(x - 3, y - 4, w + 6, h + 8);
        g.fillStyle = '#1a1e26'; g.fillRect(x, y, w, h);
        g.fillStyle = '#fbfaf6'; g.fillRect(x + w / 2 - 1, y, 2, h); g.fillRect(x, y + h * 0.42, w, 2);
        if (chance(0.3)) { g.fillStyle = pick(['#3a5a3a', '#5a3a2a', '#2a4a5a']); g.fillRect(x - 8, y - 2, 6, h + 4); g.fillRect(x + w + 2, y - 2, 6, h + 4); }   // shutters
      }
    }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const col = lit[r * cols + c]; if (!col) continue;
      const [x, y, w, h] = win(c, r);
      g.fillStyle = col; g.fillRect(x, y, w, h);
      g.fillStyle = '#000'; g.fillRect(x + w / 2 - 1, y, 2, h); g.fillRect(x, y + h * 0.42, w, 2);
      if (chance(0.4)) { g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x, y, w * rand(0.3, 0.6), h); }   // a curtain half drawn
    }
  });
  return { map, emissive, cols, rows };
}
export function flagTex() {   // the crescent and star, to the law's proportions
  return canvasTex(192, 128, (g, w, h) => {
    g.fillStyle = '#e30a17'; g.fillRect(0, 0, w, h);
    const cx = 0.5 * h, cy = h / 2;
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy, 0.25 * h, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e30a17'; g.beginPath(); g.arc(cx + 0.0625 * h, cy, 0.2 * h, 0, Math.PI * 2); g.fill();
    const sx = cx + 0.0625 * h + h / 3 + 0.125 * h, R = 0.125 * h, r = R * 0.382;
    g.fillStyle = '#ffffff'; g.beginPath();
    for (let k = 0; k < 10; k++) { const a = Math.PI + (k * Math.PI) / 5, rr = k % 2 ? r : R; g.lineTo(sx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    g.closePath(); g.fill();
  }, { repeat: false });
}
const TULIP = ['#e8202a', '#ffd23d', '#ff6aa0', '#f4ece0', '#8a2a9a', '#ff7a1a', '#c8102e', '#ff4a6a'];
function tulipTex() {   // a bed of tulips: leaves, stems and the cups with their three pointed petals
  return canvasTex(256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let layer = 0; layer < 2; layer++) for (let i = 0; i < 18; i++) {
      const x = rand(8, w - 8), top = rand(14, 44) + layer * 16, col = pick(TULIP), r = rand(8, 11);
      g.fillStyle = pick(['#3a7a3a', '#4a8a40', '#2f6a34', '#5a9a48']);
      for (const e of [-1, 1]) { g.beginPath(); g.ellipse(x + e * rand(3, 7), h - rand(16, 26), rand(3.5, 5.5), rand(16, 26), e * rand(0.15, 0.4), 0, 7); g.fill(); }
      g.strokeStyle = '#3f7a38'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + rand(-4, 4), (h + top) / 2, x, top + r); g.stroke();
      const gr = g.createLinearGradient(x - r, 0, x + r, 0); gr.addColorStop(0, col); gr.addColorStop(0.7, col); gr.addColorStop(1, 'rgba(0,0,0,0.35)');
      g.fillStyle = col; g.beginPath();
      g.moveTo(x - r, top - r * 0.3); g.quadraticCurveTo(x - r * 1.05, top + r * 1.1, x, top + r * 1.15); g.quadraticCurveTo(x + r * 1.05, top + r * 1.1, x + r, top - r * 0.3);
      g.lineTo(x + r * 0.5, top + r * 0.15); g.lineTo(x, top - r * 0.62); g.lineTo(x - r * 0.5, top + r * 0.15); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.moveTo(x + r * 0.15, top); g.quadraticCurveTo(x + r * 0.9, top + r, x, top + r * 1.15); g.lineTo(x + r * 0.15, top); g.fill();
    }
  }, { repeat: false });
}
const KILIM = [['#a8201a', '#1a2a5a', '#e8c070', '#f0e8d8', '#2a5a3a'], ['#1a3a6a', '#c8302a', '#f0d890', '#f4ece0', '#5a2a1a'],
  ['#c8601a', '#2a1a1a', '#f0e0b0', '#8a1a2a', '#3a6a7a'], ['#6a1a3a', '#e8b040', '#1a4a5a', '#f2e8d4', '#c83a2a']];
function kilimAtlas() {   // flat-woven kilims: a border, a column of stepped lozenges with hooks, the fringe at both ends
  const cw = 64, ch = 128;
  const tex = canvasTex(cw * KILIM.length, ch, (g) => {
    KILIM.forEach(([field, dark, gold, ivory, acc], i) => {
      const x0 = i * cw;
      g.fillStyle = field; g.fillRect(x0, 8, cw, ch - 16);
      g.fillStyle = dark; g.fillRect(x0 + 3, 11, cw - 6, 6); g.fillRect(x0 + 3, ch - 17, cw - 6, 6); g.fillRect(x0 + 3, 11, 6, ch - 22); g.fillRect(x0 + cw - 9, 11, 6, ch - 22);
      g.fillStyle = gold; for (let y = 14; y < ch - 14; y += 6) { g.fillRect(x0 + 5, y, 2, 2); g.fillRect(x0 + cw - 7, y, 2, 2); }
      for (let k = 0; k < 3; k++) {
        const cy = 30 + k * 34, cx = x0 + cw / 2;
        for (const [r, c] of [[18, dark], [13, ivory], [9, acc], [4, gold]]) {
          g.fillStyle = c; g.beginPath();
          for (let s = 0; s < 8; s++) { const a = (s / 8) * Math.PI * 2, rr = s % 2 ? r * 0.82 : r; g.lineTo(cx + Math.sin(a) * rr * 0.9, cy - Math.cos(a) * rr * 0.9); }
          g.closePath(); g.fill();
        }
        g.fillStyle = ivory; for (const e of [-1, 1]) g.fillRect(cx + e * 21 - 2, cy - 2, 4, 4);
      }
      g.strokeStyle = ivory; g.lineWidth = 1;
      for (let x = x0 + 3; x < x0 + cw - 2; x += 3) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + rand(-1, 1), 8); g.moveTo(x, ch - 8); g.lineTo(x + rand(-1, 1), ch); g.stroke(); }
    });
  }, { repeat: false });
  return { tex, rects: KILIM.map((_, i) => ({ u0: i / KILIM.length + 0.002, u1: (i + 1) / KILIM.length - 0.002, v0: 0, v1: 1 })) };
}
export function iznikTex() {   // an İznik tile: cobalt rings and turquoise leaves on white, red tulips toward the corners
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1f4aa8'; g.lineWidth = 4;
    g.beginPath(); g.arc(32, 32, 14, 0, 7); g.stroke();
    for (const [x, y] of [[0, 0], [64, 0], [0, 64], [64, 64]]) { g.beginPath(); g.arc(x, y, 18, 0, 7); g.stroke(); }
    g.fillStyle = '#2ab0a8'; for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; g.beginPath(); g.ellipse(32 + Math.cos(a) * 22, 32 + Math.sin(a) * 22, 6, 3, a, 0, 7); g.fill(); }
    g.fillStyle = '#c8302a'; for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; g.beginPath(); g.arc(32 + Math.cos(a) * 24, 32 + Math.sin(a) * 24, 3.5, 0, 7); g.fill(); }
    g.fillStyle = '#1f4aa8'; g.beginPath(); g.arc(32, 32, 5, 0, 7); g.fill();
  });
}
// the goods filling the shop windows, one cell each
const GOODS = ['lamps', 'spices', 'lokum', 'gold', 'ceramics', 'carpets', 'baklava', 'textiles', 'books', 'fruit'];
export const GI = Object.fromEntries(GOODS.map((k, i) => [k, i]));
const LAMP_COLS = ['#ff4a4a', '#ffb03a', '#3ad6ff', '#3a6aff', '#c84aff', '#39d88a', '#ff6ad8', '#ffe23d'];
const SPICE = ['#c83a1a', '#e8a81a', '#7a2a3a', '#5a7a2a', '#8a4a2a', '#d8c8a0', '#3a2a1a', '#e86a1a', '#b81a2a'];
function drawGoods(g, k, w, h) {
  const fill = (c) => { g.fillStyle = c; };
  if (k === 'lamps') {   // mosaic lamps hanging close, glowing every colour
    fill('#140a06'); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) {
      const x = rand(4, w - 4), y = rand(6, h - 4), r = rand(4, 8), c = pick(LAMP_COLS);
      const gr = g.createRadialGradient(x, y, 0, x, y, r * 1.8); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, c); gr.addColorStop(1, 'rgba(0,0,0,0)');
      fill(gr); g.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
      fill('#3a2a14'); g.fillRect(x - 1, y - r - 5, 2, 5);
    }
  } else if (k === 'spices') {   // shelves of spice mounds in their bins
    fill('#2a1a10'); g.fillRect(0, 0, w, h);
    for (let row = 0; row < 3; row++) for (let x = 6; x < w; x += 20) {
      const y = 30 + row * 30; fill(pick(SPICE)); g.beginPath(); g.ellipse(x + 4, y, 9, 10, 0, Math.PI, 0); g.fill();
      fill('#5a4030'); g.fillRect(x - 6, y, 20, 4); fill('#f0ece0'); g.fillRect(x, y - 3, 8, 3);
    }
  } else if (k === 'lokum') {   // Turkish delight in trays, dusted with sugar
    fill('#3a2418'); g.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) for (let x = 4; x < w - 4; x += 30) {
      const y = 10 + row * 21, c = pick(['#ff9ac0', '#a8e070', '#f4f0e8', '#ffd860', '#ff6a8a', '#c8a070']);
      fill('#8a6a4a'); g.fillRect(x - 2, y + 13, 28, 3);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { fill(c); g.fillRect(x + i * 6.5, y + j * 6.5, 5.5, 5.5); fill('rgba(255,255,255,0.35)'); g.fillRect(x + i * 6.5, y + j * 6.5, 5.5, 1.5); }
    }
  } else if (k === 'gold') {   // the jewellers' gold: chains, bangles and coins on dark velvet
    fill('#1a0808'); g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffcf5a'; g.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) { const x = rand(6, w - 6), y = rand(6, 40); g.beginPath(); g.arc(x, y, rand(6, 14), 0.2, Math.PI - 0.2); g.stroke(); }
    for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(rand(8, w - 8), rand(50, h - 8), rand(5, 8), rand(3, 5), 0, 0, 7); g.stroke(); }
    for (let i = 0; i < 70; i++) { fill(pick(['#fff4c0', '#ffd870', '#ffffff'])); g.fillRect(rand(0, w), rand(0, h), 1.5, 1.5); }
  } else if (k === 'ceramics') {   // İznik plates and bowls on the shelves
    fill('#2a1e18'); g.fillRect(0, 0, w, h);
    for (let row = 0; row < 3; row++) for (let x = 12; x < w; x += 24) {
      const y = 16 + row * 30; fill('#f4f0e6'); g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill();
      g.strokeStyle = pick(['#1f4aa8', '#2ab0a8', '#c8302a']); g.lineWidth = 2; g.beginPath(); g.arc(x, y, 7, 0, 7); g.stroke();
      fill(pick(['#1f4aa8', '#2ab0a8'])); g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill();
      fill('#5a4030'); g.fillRect(x - 12, y + 11, 24, 3);
    }
  } else if (k === 'carpets') {   // carpets folded in stacks, kilims hanging behind
    fill('#2a1810'); g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 18) { fill(pick(['#a8201a', '#1a3a6a', '#c8601a', '#6a1a3a'])); g.fillRect(x + 1, 0, 16, 50); fill(pick(['#e8c070', '#f0e8d8'])); for (let y = 6; y < 46; y += 10) g.fillRect(x + 6, y, 6, 5); }
    for (let i = 0; i < 9; i++) { fill(pick(['#a8201a', '#1a3a6a', '#c8601a', '#6a1a3a', '#2a5a3a'])); g.fillRect(rand(0, w - 40), 52 + i * 5, rand(40, 80), 4); }
  } else if (k === 'baklava') {   // trays of baklava, pistachio green on gold
    fill('#3a2010'); g.fillRect(0, 0, w, h);
    for (let row = 0; row < 3; row++) {
      const y = 14 + row * 28; fill('#c8c8c0'); g.fillRect(4, y + 16, w - 8, 3);
      for (let x = 6; x < w - 8; x += 9) { fill(pick(['#d8a040', '#e8b450', '#c88a30'])); g.beginPath(); g.moveTo(x, y + 8); g.lineTo(x + 4.5, y); g.lineTo(x + 9, y + 8); g.lineTo(x + 4.5, y + 16); g.closePath(); g.fill(); fill('#7ab040'); g.fillRect(x + 3.5, y + 6, 2, 2); }
    }
  } else if (k === 'textiles') {   // scarves and peştamals hanging in stripes, tassels at their ends
    fill('#1a1410'); g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 11) { const c = pick(['#e8202a', '#2a6ad0', '#ffd23d', '#2ab0a8', '#ff6aa0', '#f4f0e8', '#8a2a9a', '#3a8a3a']); fill(c); g.fillRect(x + 1, 4, 9, h - 14); fill('rgba(255,255,255,0.3)'); for (let y = 8; y < h - 12; y += 7) g.fillRect(x + 1, y, 9, 2); fill(c); for (let t = 0; t < 3; t++) g.fillRect(x + 2 + t * 3, h - 10, 1, 7); }
  } else if (k === 'books') {   // books and old records, a saz and an oud hanging
    fill('#2a1c14'); g.fillRect(0, 0, w, h);
    for (let row = 0; row < 3; row++) for (let x = 2; x < w - 2; x += rand(4, 7)) { fill(pick(['#8a2a1a', '#1a3a5a', '#d8c8a0', '#2a5a2a', '#5a2a5a', '#c8902a', '#f0e8d8'])); g.fillRect(x, 12 + row * 28, rand(3, 6), 22); }
    fill('#8a5a2a'); g.beginPath(); g.ellipse(100, 40, 10, 14, 0, 0, 7); g.fill(); g.fillRect(98, 6, 4, 24);
  } else {   // the greengrocer's crates: oranges, pomegranates, lemons, apples, greens
    fill('#2a2014'); g.fillRect(0, 0, w, h);
    for (let row = 0; row < 3; row++) for (let x = 2; x < w - 20; x += 25) {
      const y = 18 + row * 28, c = pick(['#ff8a1a', '#c8202a', '#ffe23d', '#7ac83a', '#a82a3a', '#4a8a2a']);
      for (let i = 0; i < 9; i++) { fill(c); g.beginPath(); g.arc(x + 4 + (i % 4) * 5.5, y + Math.floor(i / 4) * 5, 3, 0, 7); g.fill(); }
      fill('#8a6a3a'); g.fillRect(x, y + 12, 24, 5);
    }
  }
}
function goodsAtlas() {
  const cw = 128, ch = 96, cols = 5, rows = 2;
  const tex = canvasTex(cw * cols, ch * rows, (g) => GOODS.forEach((k, i) => { g.save(); g.translate((i % cols) * cw, Math.floor(i / cols) * ch); g.beginPath(); g.rect(0, 0, cw, ch); g.clip(); drawGoods(g, k, cw, ch); g.restore(); }), { repeat: false });
  return { tex, rects: GOODS.map((_, i) => ({ u0: (i % cols) / cols + 0.003, u1: ((i % cols) + 1) / cols - 0.003, v0: 1 - (Math.floor(i / cols) + 1) / rows + 0.004, v1: 1 - Math.floor(i / cols) / rows - 0.004 })) };
}
// shop signs: gold on green or maroon for the old trades, lightboxes for the rest
export const SIGNS = [
  { t: 'LOKUM · BAKLAVA', bg: '#1f4a2a', fg: '#f0c860', f: SERIF, goods: 'lokum' }, { t: 'KUYUMCU', bg: '#3a0a14', fg: '#f0c860', f: SERIF, goods: 'gold' },
  { t: 'BAHARAT', bg: '#6a1a10', fg: '#ffd890', f: SERIF, goods: 'spices' }, { t: 'HALI · KİLİM', bg: '#1a2a4a', fg: '#f0d8a0', f: SERIF, goods: 'carpets' },
  { t: 'ECZANE', bg: '#f4f4f0', fg: '#d8101a', f: DISPLAY, goods: 'books', e: true }, { t: 'BERBER', bg: '#1a3a6a', fg: '#ffffff', f: DISPLAY, goods: 'books' },
  { t: 'BAKKAL', bg: '#c81a1a', fg: '#ffffff', f: DISPLAY, goods: 'fruit' }, { t: 'KAFE', bg: '#2a1a10', fg: '#f0e0c0', f: SERIF, goods: 'baklava' },
  { t: 'ÇAY · KAHVE', bg: '#5a1a10', fg: '#ffe0a0', f: SERIF, goods: 'ceramics' }, { t: 'DÖNER · KEBAP', bg: '#d82a1a', fg: '#ffe23d', f: DISPLAY, goods: 'fruit' },
  { t: 'PASTANE', bg: '#f0d8e0', fg: '#8a1a3a', f: SERIF, goods: 'baklava' }, { t: 'BÜFE', bg: '#ffd23d', fg: '#c81a1a', f: DISPLAY, goods: 'fruit' },
  { t: 'TATLICI', bg: '#3a1a3a', fg: '#f0c860', f: SERIF, goods: 'baklava' }, { t: 'SİMİT', bg: '#c8501a', fg: '#fff0d0', f: DISPLAY, goods: 'baklava' },
  { t: 'KİTAPÇI', bg: '#2a3a2a', fg: '#f0e8d0', f: SERIF, goods: 'books' }, { t: 'MÜZİK', bg: '#1a1a1a', fg: '#ff4a8a', f: DISPLAY, goods: 'books' },
  { t: 'OTEL', bg: '#1a1a3a', fg: '#ffe0a0', f: SERIF, goods: 'textiles' }, { t: 'LOKANTA', bg: '#5a2a10', fg: '#ffd890', f: SERIF, goods: 'ceramics' },
  { t: 'TÜRK KAHVESİ', bg: '#3a2010', fg: '#f0c890', f: SERIF, goods: 'ceramics' }, { t: 'NARGİLE', bg: '#2a0a2a', fg: '#ff8ad8', f: SERIF, goods: 'lamps' },
  { t: 'ANTİKA', bg: '#2a2a1a', fg: '#e8d8a8', f: SERIF, goods: 'lamps' }, { t: 'MANAV', bg: '#2a6a2a', fg: '#ffffff', f: DISPLAY, goods: 'fruit' },
  { t: 'FIRIN', bg: '#8a3a1a', fg: '#ffe8c0', f: DISPLAY, goods: 'baklava' }, { t: 'KUAFÖR', bg: '#e8a0c0', fg: '#2a1a2a', f: SERIF, goods: 'textiles' },
  { t: 'EMLAK', bg: '#1a4a8a', fg: '#ffffff', f: DISPLAY, goods: 'books' }, { t: 'AYDINLATMA', bg: '#1a1410', fg: '#ffc860', f: SERIF, goods: 'lamps' },
  { t: 'SERAMİK', bg: '#1f4aa8', fg: '#ffffff', f: SERIF, goods: 'ceramics' }, { t: 'TEKSTİL', bg: '#6a1a3a', fg: '#ffe0f0', f: SERIF, goods: 'textiles' },
  { t: 'BALIK', bg: '#1a5a8a', fg: '#ffffff', f: DISPLAY, goods: 'fruit' }, { t: 'MEYHANE', bg: '#1a2a1a', fg: '#ffd890', f: SERIF, goods: 'ceramics' },
];
SIGNS.forEach((s, i) => (s.i = i));
const byText = (...ts) => SIGNS.filter((s) => ts.includes(s.t));
export const PERA_SIGNS = byText('LOKUM · BAKLAVA', 'KUYUMCU', 'KAFE', 'ÇAY · KAHVE', 'DÖNER · KEBAP', 'PASTANE', 'TATLICI', 'SİMİT', 'KİTAPÇI', 'MÜZİK', 'OTEL', 'LOKANTA', 'TÜRK KAHVESİ', 'NARGİLE', 'ANTİKA', 'ECZANE', 'MEYHANE', 'BÜFE');
export const BAZAAR_SIGNS = byText('LOKUM · BAKLAVA', 'KUYUMCU', 'BAHARAT', 'HALI · KİLİM', 'TATLICI', 'AYDINLATMA', 'SERAMİK', 'TEKSTİL', 'ANTİKA', 'NARGİLE', 'BAHARAT', 'AYDINLATMA');
export const MAHALLE_SIGNS = byText('BAKKAL', 'BERBER', 'ECZANE', 'KUAFÖR', 'EMLAK', 'BÜFE', 'FIRIN', 'MANAV', 'DÖNER · KEBAP', 'PASTANE', 'BALIK', 'ÇAY · KAHVE');
function signAtlasTR() {
  const cw = 512, ch = 112, cols = 2, rows = Math.ceil(SIGNS.length / cols);
  const tex = canvasTex(cw * cols, ch * rows, (g) => SIGNS.forEach((s, i) => {
    const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
    g.fillStyle = s.bg; g.fillRect(x, y, cw, ch);
    g.strokeStyle = s.fg; g.globalAlpha = 0.7; g.lineWidth = 4; g.strokeRect(x + 8, y + 8, cw - 16, ch - 16); g.globalAlpha = 1;
    let px = 70, pad = s.e ? 120 : 40;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = s.fg;
    do g.font = `${s.f === SERIF ? 900 : 400} ${px--}px ${s.f}`; while (g.measureText(s.t).width > cw - pad && px > 20);
    g.fillText(s.t, x + cw / 2 + (s.e ? 40 : 0), y + ch / 2 + 4);
    if (s.e) {   // the pharmacy's red E
      g.fillStyle = '#d8101a'; g.fillRect(x + 30, y + 20, 72, 72); g.fillStyle = '#ffffff'; g.font = `400 62px ${DISPLAY}`; g.fillText('E', x + 66, y + 58);
    }
  }), { repeat: false });
  return { tex, rects: SIGNS.map((_, i) => ({ u0: (i % cols) / cols + 0.002, u1: ((i % cols) + 1) / cols - 0.002, v0: 1 - (Math.floor(i / cols) + 1) / rows + 0.003, v1: 1 - Math.floor(i / cols) / rows - 0.003 })) };
}
// the city's navy street plates
export const STREETS = [['İSTİKLAL CD.', 'BEYOĞLU'], ['GALİP DEDE CD.', 'BEYOĞLU'], ['YÜKSEK KALDIRIM', 'BEYOĞLU'], ['VODİNA CD.', 'FATİH'], ['DİVANYOLU CD.', 'FATİH'],
  ['MİMAR SİNAN CD.', 'FATİH'], ['HOCA ALİ RIZA SK.', 'BEYOĞLU'], ['ÇUKURCUMA CD.', 'BEYOĞLU'], ['BALIKPAZARI SK.', 'BEYOĞLU'], ['ÇIRAĞAN CD.', 'BEŞİKTAŞ'], ['SALACAK SK.', 'ÜSKÜDAR'], ['KARAKÖY CD.', 'BEYOĞLU']];
function streetAtlas() {
  const cw = 256, ch = 96;
  const tex = canvasTex(cw, ch * STREETS.length, (g) => STREETS.forEach(([st, dist], i) => {
    const y = i * ch;
    g.fillStyle = '#1a2a6a'; g.fillRect(0, y, cw, ch);
    g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(5, y + 5, cw - 10, ch - 10);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let px = 34; do g.font = `700 ${px--}px ${SANS}`; while (g.measureText(st).width > cw - 24 && px > 12);
    g.fillText(st, cw / 2, y + 38);
    g.font = `600 18px ${SANS}`; g.fillText(dist, cw / 2, y + 72);
  }), { repeat: false });
  return { tex, rects: STREETS.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / STREETS.length + 0.003, v1: 1 - i / STREETS.length - 0.003 })) };
}

// ---------- palettes ----------
const SKIN = ['#e8c4a0', '#d8a882', '#c89070', '#f0d0b0', '#b07a58', '#dcb08a'];
const HAIR = ['#1a1410', '#2a1e16', '#3a2a1c', '#141414', '#5a4030', '#8a8a88', '#6a4a2a'];
const COATS = ['#2a2d3a', '#3a3f4a', '#5a4a3a', '#7a2a2a', '#2a4a5a', '#8a7a5a', '#4a5a3a', '#1f2a40', '#c8b898', '#6a3a5a', '#b85a3a', '#e8e0d0', '#3a6a8a', '#d8c070', '#a83a4a'];
const TROUSERS = ['#1a1c24', '#2a2e3a', '#3a3428', '#4a4a50', '#1f2a40', '#5a4a3a', '#2a3a5a'];
const SCARF = ['#c8202a', '#2a4a8a', '#e8d8c0', '#6a2a5a', '#2a6a5a', '#d8a030', '#1a1a1e', '#f0c0c8', '#8a5a9a', '#4a6a8a'];
export const STONE = ['#fff4e4', '#ffd8b4', '#f6c8bc', '#ecdca0', '#cfdcc4', '#d8d2e8', '#f0e0c8', '#ffc8a4', '#dce4ec', '#e8c8a0'];
export const WOOD = ['#f2c84a', '#e8806a', '#5ac0c0', '#9ad08a', '#c8a0d8', '#ee7a98', '#f4f0e8', '#c8603a', '#7aa8d8', '#f0a050', '#88c8a8', '#e8d070'];
const APT = ['#f4ece0', '#f0d8c0', '#d8e4e0', '#f2e0a8', '#e8c8c0', '#c8d8e8', '#e0e0d8', '#f0c8a0', '#e4d4c4'];
const TILE = ['#b8603a', '#a85434', '#c06a40', '#9a4a30'];
const CATS = [['#d8883a', '#f0c890'], ['#8a8a88', '#c8c8c4'], ['#1a1a1c', '#2a2a2c'], ['#f0ece4', '#ffffff'], ['#6a5a4a', '#a89070'], ['#e8e0d0', '#d8883a'], ['#4a4a4c', '#e8e4dc']];
const LEAF = ['#5a8a3a', '#6a9a40', '#4a7a34', '#7aa848', '#5a9040', '#689a3c'];   // plane trees in new leaf
const JUDAS = ['#c8408a', '#d8509a', '#b83a7a', '#e070a8', '#c04890', '#a83a78', '#d45aa0'];   // erguvan, the Judas tree, in flower
const ICO = new THREE.IcosahedronGeometry(0.5, 0);
const HALF = new THREE.SphereGeometry(0.5, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2);   // a dome, its base on y = 0
const PENNANT = new THREE.BufferGeometry();
PENNANT.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, -1, 0, 0.5, 0, 0, -0.5, 0, 0, 0, -1, 0], 3));
PENNANT.computeVertexNormals();
const CARD = new THREE.PlaneGeometry(1, 1); CARD.translate(0, 0.5, 0);
CARD.setAttribute('aSway', new THREE.Float32BufferAttribute([1, 1, 0, 0], 1));
export { HALF, ICO };

export function makeKit() {
  const K = {};
  K.face = face;
  // ---------- materials ----------
  const stoneA = windowTex({ cols: 6, rows: 12, cw: 34, ch: 48, wall: '#ece2cc', glass: '#161a24', lit: ['#ffd9a0', '#ffe6bc', '#ffc27a', '#fff2dc'], litChance: 0.42, arch: true, frame: '#fbf6ea', ledge: '#c8b898' });
  const stoneB = windowTex({ cols: 6, rows: 12, cw: 34, ch: 46, wall: '#e8dcc6', glass: '#161a24', lit: ['#ffd9a0', '#ffe6bc', '#ffc27a', '#fff2dc'], litChance: 0.4, frame: '#f8f2e4', ledge: '#bcae96' });
  const brick = windowTex({ cols: 4, rows: 8, cw: 36, ch: 50, wall: '#b05a40', glass: '#161a24', lit: ['#ffd9a0', '#ffe6bc', '#ffc27a'], litChance: 0.42, arch: true, frame: '#ece0cc', ledge: '#e0d4bc' });
  const apt = windowTex({ cols: 8, rows: 16, cw: 32, ch: 40, wall: '#e6e2da', glass: '#12161e', lit: ['#fff0d0', '#ffe0a8', '#e8f4ff', '#ffd090'], litChance: 0.5, frame: '#d6d2ca', ledge: '#cfcac0' });
  const wood = woodTex();
  K.tex = { stoneA, stoneB, brick, apt, wood };
  K.stoneMatA = facadeMat(stoneA, { k: 0.85 }); K.stoneMatB = facadeMat(stoneB, { k: 0.85 });
  K.brickMat = facadeMat(brick, { k: 0.85 }); K.aptMat = facadeMat(apt, { k: 0.8 }); K.woodMat = facadeMat(wood, { k: 0.85 });
  const cobble = cobbleTex();
  K.sideMat = std({ map: cobble, roughness: 0.92 }); K.sideMat.map = cobble.clone(); K.sideMat.map.repeat.set(2, 23); K.sideMat.map.needsUpdate = true;   // the track's side strips
  K.cobbleMat = std({ map: cobble, roughness: 0.92 });
  K.paveMat = std({ map: paveTex(), roughness: 0.85 });
  const tiled = new Map();   // planes whose UVs repeat a texture every k metres
  K.tiledPlane = (w, d, k) => { const key = `${w}|${d}|${k}`; if (!tiled.has(key)) tiled.set(key, planeUV({ u0: 0, u1: w / k, v0: 0, v1: d / k })); return tiled.get(key); };
  K.pave = (b, x, z, w, d, y = 0.06) => b.add(K.tiledPlane(w, d, 3), K.paveMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0);   // a square's flagstones
  K.cobbles = (b, x, z, w, d, y = 0.06) => b.add(K.tiledPlane(w, d, 3.5), K.cobbleMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0);
  K.iznikMat = std({ map: iznikTex(), roughness: 0.3, metalness: 0.05, vertexColors: true });
  K.iznik = iznikTex();
  K.water = waterMat('#1a3656', 10);
  const flag = flagTex();
  K.flagMat = std({ map: flag, roughness: 0.7, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: flag, emissiveIntensity: 0.28 });
  const goods = goodsAtlas();
  K.goodsRects = goods.rects; K.goodsMat = basic({ map: goods.tex, color: hdr('#ffffff', 1.05) });
  const signs = signAtlasTR();
  K.signRects = signs.rects; K.signMat = basic({ map: signs.tex, color: hdr('#ffffff', 0.95) });
  const kil = kilimAtlas();
  K.kilimRects = kil.rects; K.kilimMat = std({ map: kil.tex, roughness: 0.9, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: kil.tex, emissiveIntensity: 0.18 });
  const st = streetAtlas();
  K.streetRects = st.rects; K.streetMat = basic({ map: st.tex, color: hdr('#ffffff', 0.9), side: THREE.DoubleSide });
  K.tulipMat = foliageMat(tulipTex(), { sway: 0.05, alphaTest: 0.5, emissive: 0.12 });
  K.poolMat = basic({ map: canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { repeat: false }),
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  K.pool = (b, x, z, w, d, col, y = 0.05) => b.add(G.plane, K.poolMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0, col);   // light spilt on the ground
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

  // ---------- trees and flowers ----------
  const T = parkTreeKit({ plane: LEAF, maple: JUDAS, elm: ['#3a6a34', '#2f5a2c', '#4a7a3a', '#3f6a30'] });
  K.planeTree = T.planeTree; K.judas = T.maple; K.elm = T.elm;
  K.cypress = (b, x, z, s = 1, y = 0) => {   // a Mediterranean cypress, a dark green flame
    b.cyl(VC.solid, '#4a3a2a', x, y + 0.6 * s, z, 0.14 * s, 1.2 * s, 'cyl6');
    const h = rand(8, 11) * s, c = pick(['#1f3a2a', '#24402e', '#1a3424']);
    b.add(G.cone8, VC.solid, x, y + 0.9 * s + h * 0.42, z, 1.7 * s, h * 0.84, 1.7 * s, 0, 0, 0, c);
    b.add(G.sphLow, VC.solid, x, y + 0.9 * s + h * 0.22, z, 1.5 * s, h * 0.42, 1.5 * s, 0, 0, 0, c);
  };
  K.tulips = (b, x, z, w, d, { y = 0, soil = true, edge = '#d8d0c0' } = {}) => {   // a bed of tulips, its rows facing the track
    if (soil) { b.block(VC.solid, edge, x, y, z, w + 0.3, 0.3, d + 0.3); b.block(VC.solid, '#3a2a1e', x, y + 0.3, z, w, 0.02, d); }
    for (let k = 0, n = Math.max(1, Math.round(d / 0.45)); k < n; k++) b.add(CARD, K.tulipMat, x + rand(-0.1, 0.1), y + 0.28, z + d / 2 - (k + 0.5) * (d / n), w, rand(0.5, 0.62), 1, 0, rand(-0.08, 0.08), 0, null);
    for (const e of [-1, 1]) b.add(CARD, K.tulipMat, x + (e * w) / 2.6, y + 0.28, z, d, 0.55, 1, 0, Math.PI / 2, 0, null);
  };
  K.petals = (b, x, z, r) => { for (let k = 0; k < 7; k++) b.add(G.plane, VC.solid, x + rand(-r, r), 0.04, z + rand(-r, r), rand(0.6, 1.4), rand(0.6, 1.4), 1, -Math.PI / 2, 0, rand(0, 3), pick(['#c8509a', '#d870a8', '#b84a88'])); };   // fallen erguvan blossom

  // ---------- people and animals ----------
  K.person = (b, x, z, { s = rand(0.9, 1.05), y = 0, coat = pick(COATS), scarf = chance(0.18) ? pick(SCARF) : null, cap = !scarf && chance(0.1), bag = chance(0.25), phone = chance(0.18), seated = false, rod = false, tray = false, fez = false, ry = null } = {}) => {
    const a = ry ?? rand(-0.5, 0.5) + (chance(0.5) ? Math.PI : 0), ca = Math.cos(a), sa = Math.sin(a), legs = pick(TROUSERS), skin = pick(SKIN);
    const P = (fx, fy, fz) => [x + fx * ca + fz * sa, y + fy, z - fx * sa + fz * ca];
    if (seated) {   // on a stool: thighs forward, shins down
      for (const e of [-1, 1]) { b.add(G.box, VC.solid, ...P(e * 0.09 * s, 0.5 * s, -0.18 * s), 0.15 * s, 0.14 * s, 0.42 * s, 0, a, 0, legs); b.add(G.box, VC.solid, ...P(e * 0.09 * s, 0.24 * s, -0.36 * s), 0.13 * s, 0.48 * s, 0.14 * s, 0, a, 0, legs); }
      b.add(G.box, VC.solid, ...P(0, 0.88 * s, 0.02), 0.44 * s, 0.62 * s, 0.26 * s, 0, a, 0, coat);
      b.add(ICO, VC.solid, ...P(0, 1.36 * s, 0), 0.3 * s, 0.34 * s, 0.3 * s, 0, a, 0, skin);
      b.add(G.box, VC.solid, ...P(0, 1.47 * s, 0.03), 0.31 * s, 0.12 * s, 0.31 * s, 0, a, 0, scarf || pick(HAIR));
      return;
    }
    for (const e of [-1, 1]) b.add(G.box, VC.solid, ...P(e * 0.085 * s, 0.43 * s, 0), 0.15 * s, 0.86 * s, 0.19 * s, 0, a, 0, scarf ? coat : legs);
    b.add(G.box, VC.solid, ...P(0, 1.17 * s, 0), 0.44 * s, 0.68 * s, 0.27 * s, 0, a, 0, coat);
    if (scarf) b.add(G.box, VC.solid, ...P(0, 0.62 * s, 0), 0.4 * s, 0.4 * s, 0.26 * s, 0, a, 0, coat);   // a long coat to the shins
    b.add(ICO, VC.solid, ...P(0, 1.68 * s, 0), 0.3 * s, 0.34 * s, 0.3 * s, 0, a, 0, skin);
    if (scarf) { b.add(ICO, VC.solid, ...P(0, 1.72 * s, 0.03), 0.36 * s, 0.38 * s, 0.36 * s, 0, a, 0, scarf); b.add(G.box, VC.solid, ...P(0, 1.5 * s, 0.05), 0.34 * s, 0.16 * s, 0.3 * s, 0, a, 0, scarf); }
    else b.add(G.box, VC.solid, ...P(0, 1.8 * s, 0.025), 0.31 * s, 0.13 * s, 0.31 * s, 0, a, 0, pick(HAIR));
    if (cap) b.add(G.box, VC.solid, ...P(0, 1.87 * s, -0.03), 0.33 * s, 0.07 * s, 0.38 * s, 0, a, 0, pick(['#3a3a3e', '#5a4a3a', '#2a2a2e']));
    if (fez) { b.add(G.cyl8, VC.solid, ...P(0, 1.92 * s, 0), 0.22 * s, 0.2 * s, 0.22 * s, 0, a, 0, '#c8102e'); b.box(VC.solid, '#141414', ...P(0.06 * s, 1.9 * s, 0.08 * s), 0.02, 0.16, 0.02); }
    if (phone) b.box(VC.glow, hdr('#cfe6ff', 1.5), ...P(0.06, 1.22 * s, -0.2 * s), 0.07, 0.12, 0.02);
    if (bag) b.add(G.box, VC.solid, ...P(0.27 * s, 0.95 * s, 0), 0.1, 0.34, 0.32, 0, a, 0, pick(['#141414', '#c8a070', '#8a2a1a', '#f4f0e8', '#2a3a5a', '#e8e0f0']));
    if (tray) { b.add(G.cyl, VC.solid, ...P(0, 1.95 * s, 0), 0.9, 0.05, 0.9, 0, 0, 0, '#5a3a20'); for (let k = 0; k < 8; k++) { const t = (k / 8) * Math.PI * 2; b.add(G.tor, VC.solid, ...P(Math.cos(t) * 0.26, 2.02 * s, Math.sin(t) * 0.26), 0.3, 0.3, 0.42, Math.PI / 2, 0, 0, '#c88a40'); } }   // a simit seller's tray on his head
    if (rod) {   // a fishing rod out over the water, its line dropping in
      const tip = P(0, 4.4 * s, -3.4 * s);
      beam(b, VC.metal, ...P(0.1, 1.15 * s, -0.25 * s), ...tip, 0.025, '#2a2a2e');
      beam(b, VC.glow, ...tip, tip[0], -1.2, tip[2], 0.006, hdr('#e8e8f0', 0.6));
    }
  };
  K.crowd = (b, x0, x1, z0, z1, n, opts = {}) => { for (let i = 0; i < n; i++) K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1), opts); };
  K.throng = (b, x0, x1, z0, z1, n, gaps = [], opts = {}) => {   // a crowd kept out of the given stretches
    for (let i = 0, t = 0; i < n && t < n * 4; t++) { const z = rand(z0, z1); if (gaps.some(([a, c]) => z > a && z < c)) continue; K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -z, opts); i++; }
  };
  K.cat = (b, x, z, { y = 0, sit = chance(0.55), ry = rand(0, Math.PI * 2), s = rand(0.85, 1.1) } = {}) => {   // a street cat, sitting up or curled in a loaf
    const [c, c2] = pick(CATS), ca = Math.cos(ry), sa = Math.sin(ry);
    const P = (fx, fy, fz) => [x + (fx * ca + fz * sa) * s, y + fy * s, z + (-fx * sa + fz * ca) * s];
    if (sit) {
      b.add(G.sphLow, VC.solid, ...P(0, 0.16, 0.02), 0.22 * s, 0.32 * s, 0.26 * s, 0, ry, 0, c);
      b.add(G.sphLow, VC.solid, ...P(0, 0.08, -0.08), 0.16 * s, 0.14 * s, 0.12 * s, 0, ry, 0, c2);
      b.add(G.sphLow, VC.solid, ...P(0, 0.38, -0.05), 0.17 * s, 0.15 * s, 0.16 * s, 0, ry, 0, c);
      for (const e of [-1, 1]) b.add(G.cone4, VC.solid, ...P(e * 0.05, 0.48, -0.05), 0.06 * s, 0.08 * s, 0.04 * s, 0, ry, 0, c);
      b.add(G.box, VC.solid, ...P(0.1, 0.03, 0.08), 0.04 * s, 0.04 * s, 0.28 * s, 0, ry + 0.7, 0, c);
    } else {
      b.add(G.sphLow, VC.solid, ...P(0, 0.1, 0), 0.24 * s, 0.2 * s, 0.4 * s, 0, ry, 0, c);
      b.add(G.sphLow, VC.solid, ...P(0, 0.15, -0.2), 0.15 * s, 0.13 * s, 0.14 * s, 0, ry, 0, c2);
      for (const e of [-1, 1]) b.add(G.cone4, VC.solid, ...P(e * 0.045, 0.24, -0.21), 0.05 * s, 0.07 * s, 0.035 * s, 0, ry, 0, c);
      b.add(G.box, VC.solid, ...P(0.1, 0.05, 0.12), 0.04 * s, 0.04 * s, 0.3 * s, 0, ry - 0.5, 0, c);
    }
  };
  K.gull = (b, x, y, z, ry = rand(0, Math.PI * 2)) => {   // a gull standing on a post or a rail
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + fx * ca + fz * sa, y + fy, z - fx * sa + fz * ca];
    b.add(G.sphLow, VC.solid, ...P(0, 0.2, 0), 0.2, 0.2, 0.42, 0, ry, 0, '#f2f2f0');
    b.add(G.box, VC.solid, ...P(0, 0.27, 0.06), 0.22, 0.06, 0.36, 0, ry, 0, '#9aa0a8');
    b.add(G.box, VC.solid, ...P(0, 0.26, 0.24), 0.1, 0.04, 0.12, 0, ry, 0, '#1a1a1c');
    b.add(G.sphLow, VC.solid, ...P(0, 0.36, -0.17), 0.13, 0.12, 0.14, 0, ry, 0, '#f6f6f4');
    b.add(G.box, VC.solid, ...P(0, 0.35, -0.27), 0.03, 0.03, 0.09, 0, ry, 0, '#e8b81a');
    for (const e of [-1, 1]) b.add(G.box, VC.solid, ...P(e * 0.04, 0.05, 0), 0.02, 0.1, 0.02, 0, ry, 0, '#d89a7a');
  };
  K.dog = (b, x, z, ry = rand(0, Math.PI * 2)) => {   // one of the big, tagged street dogs, asleep on the pavement
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + fx * ca + fz * sa, fy, z - fx * sa + fz * ca], c = pick(['#c8a070', '#8a6a4a', '#e8dcc8', '#4a3a2a']);
    b.add(G.sphLow, VC.solid, ...P(0, 0.2, 0), 0.5, 0.36, 0.9, 0, ry, 0, c);
    b.add(G.sphLow, VC.solid, ...P(0.05, 0.18, -0.5), 0.3, 0.26, 0.34, 0, ry, 0, c);
    b.add(G.box, VC.solid, ...P(0.05, 0.14, -0.7), 0.14, 0.12, 0.16, 0, ry, 0, c);
    b.add(G.box, VC.solid, ...P(0.0, 0.32, -0.42), 0.06, 0.04, 0.03, 0, ry, 0, '#e8c818');   // the ear tag
  };

  // ---------- street furniture ----------
  K.lamp = (b, x, z, { h = 4.3, heads = 1, col = '#ffd890', k = 2.4, pool = 0.14 } = {}) => {   // the old city's black cast-iron lamp posts
    b.cyl(VC.metal, '#1a1c20', x, 0.35, z, 0.17, 0.7, 'cyl8');
    b.cyl(VC.metal, '#1a1c20', x, h / 2, z, 0.06, h, 'cyl8');
    b.add(G.sphLow, VC.metal, x, 0.78, z, 0.24, 0.14, 0.24, 0, 0, 0, '#1a1c20');
    const heads_ = heads === 1 ? [[0, 0]] : heads === 2 ? [[-0.55, 0], [0.55, 0]] : [[-0.55, 0], [0.55, 0], [0, 0]];
    if (heads > 1) b.box(VC.metal, '#1a1c20', x, h - 0.1, z, 1.2, 0.06, 0.06);
    for (const [dx, dz] of heads_) {
      const lx = x + dx, lz = z + dz, ly = h + (dx || heads === 1 ? 0.3 : 0.6);
      b.add(G.cyl6, VC.glow, lx, ly, lz, 0.3, 0.48, 0.3, 0, 0, 0, hdr(col, k));
      b.add(G.cone8, VC.metal, lx, ly + 0.36, lz, 0.42, 0.24, 0.42, 0, 0, 0, '#1a1c20');
      b.add(G.sph, VC.metal, lx, ly + 0.52, lz, 0.07, 0.1, 0.07, 0, 0, 0, '#1a1c20');
      b.add(G.cyl6, VC.metal, lx, ly - 0.27, lz, 0.2, 0.06, 0.2, 0, 0, 0, '#1a1c20');
    }
    if (pool) K.pool(b, x, z, 6, 6, hdr(col, pool));
  };
  K.bench = (b, x, z, side, { people = chance(0.5) } = {}) => {
    b.box(VC.solid, '#6a4a2a', x, 0.45, z, 0.5, 0.08, 1.8); b.box(VC.solid, '#6a4a2a', x + side * 0.24, 0.75, z, 0.06, 0.45, 1.8);
    for (const e of [-1, 1]) b.box(VC.metal, '#1a1c20', x, 0.22, z + e * 0.75, 0.5, 0.44, 0.06);
    if (people) K.person(b, x - side * 0.05, z + rand(-0.5, 0.5), { seated: true, ry: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
  };
  K.flag = (b, x, y, z, side, w = 1.6) => {   // a Turkish flag on a pole out from a facade
    const ex = x - side * 1.7, ey = y + 0.9;
    beam(b, VC.metal, x, y, z, ex, ey, z, 0.04, '#d8d8d4');
    b.add(G.sph, VC.metal, ex, ey, z, 0.08, 0.08, 0.08, 0, 0, 0, '#e8c040');
    b.add(G.plane, K.flagMat, (x + ex) / 2, y + 0.45 - (w / 1.5) * 0.5 + 0.05, z, -side * w, w / 1.5, 1, 0, 0, -side * 0.49);   // the hoist along the wall
  };
  K.banner = (b, x, y, z, side, h = 6) => b.add(G.plane, K.flagMat, x - side * 0.06, y, z, h * 1.5, h, 1, 0, face(side), Math.PI / 2);   // a great flag hung down a front
  K.bunting = (b, z, { y = 14, w = X0, n = 26, colors = ['#e30a17', '#ffffff'] } = {}) => {   // pennants across the street, high over the jetpack
    for (let k = 0; k <= n; k++) {
      const t = k / n, x = -w + 2 * w * t, yy = y - Math.sin(t * Math.PI) * 1.2;
      b.add(PENNANT, VC.solid, x, yy, z, 0.5, 0.7, 1, 0, 0, 0, colors[k % colors.length]);
    }
    beam(b, VC.metal, -w, y, z, 0, y - 1.25, z, 0.02, '#2a2a2e'); beam(b, VC.metal, 0, y - 1.25, z, w, y, z, 0.02, '#2a2a2e');
  };
  K.lights = (b, z, { y = 14, w = X0, n = 22 } = {}) => {   // a string of warm bulbs across the street
    for (let k = 0; k <= n; k++) { const t = k / n; b.sph(VC.glow, hdr(pick(['#ffe8b0', '#ffd890', '#fff4d8']), 2.4), -w + 2 * w * t, y - Math.sin(t * Math.PI) * 1.4 - 0.1, z, 0.1, true); }
    beam(b, VC.metal, -w, y, z, 0, y - 1.45, z, 0.02, '#2a2a2e'); beam(b, VC.metal, 0, y - 1.45, z, w, y, z, 0.02, '#2a2a2e');
  };
  K.streetSign = (b, x, z, side, i = randi(0, STREETS.length - 1)) => {   // the navy plate on its post at a corner
    b.cyl(VC.metal, '#3a3e46', x, 1.4, z, 0.04, 2.8, 'cyl6');
    b.add(planeUV(K.streetRects[i]), K.streetMat, x, 2.6, z, 1.3, 0.49, 1, 0, 0, 0);
  };
  K.fountain = (b, x, z, side) => {   // an Ottoman street fountain: a marble niche with its tap and basin, a little eave over it
    const fx = x - side * 0.1;
    b.block(VC.solid, '#e8e0d0', fx, 0, z, 0.9, 3.0, 2.6);
    b.box(VC.solid, '#3a3630', fx - side * 0.46, 1.6, z, 0.04, 1.6, 1.3);
    b.box(VC.solid, '#d8d0c0', fx - side * 0.62, 0.45, z, 0.5, 0.9, 1.6);
    b.box(VC.metal, '#c8a050', fx - side * 0.52, 1.3, z, 0.18, 0.06, 0.06);
    b.box(VC.solid, '#7a7a7a', fx - side * 0.2, 3.1, z, 1.6, 0.14, 3.2);
    b.add(G.plane, K.iznikMat, fx - side * 0.462, 2.6, z, 1.2, 0.4, 1, 0, face(side), 0, '#ffffff');
  };

  // ---------- carts, stands and stalls ----------
  K.simitCart = (b, x, z, side) => {   // the red simit cart: its glass case of sesame rings, more on the pegs on top
    b.block(VC.solid, '#c8202a', x, 0.45, z, 0.8, 0.62, 1.3);
    for (const e of [-1, 1]) b.cyl(VC.solid, '#1a1a1a', x + e * 0.43, 0.32, z + 0.35, 0.3, 0.06, 'cyl8', 0, Math.PI / 2);
    b.box(VC.metal, '#d8d8d4', x, 0.25, z - 0.55, 0.06, 0.5, 0.06);
    b.box(VC.glow, hdr('#fff0d0', 0.35), x, 1.35, z, 0.74, 0.5, 1.2);
    b.box(VC.solid, '#c8202a', x, 1.64, z, 0.86, 0.06, 1.32);
    for (let k = 0; k < 10; k++) b.add(G.tor, VC.solid, x + rand(-0.22, 0.22), 1.16 + (k % 3) * 0.08, z + rand(-0.45, 0.45), 0.3, 0.3, 0.42, Math.PI / 2, 0, 0, '#c88a40');
    for (let k = 0; k < 4; k++) b.add(G.tor, VC.solid, x, 1.84, z - 0.45 + k * 0.3, 0.32, 0.32, 0.45, 0, Math.PI / 2, 0, '#c07a34');
    b.box(VC.metal, '#d8d8d4', x, 1.78, z, 0.03, 0.26, 1.0);
    K.person(b, x - side * 0.75, z + 0.3, { coat: '#f4f4f0', ry: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
  };
  K.chestnutCart = (b, x, z, side, embers) => {   // roast chestnuts and corn: the brass dome, the glowing coals
    b.block(VC.solid, '#b81a24', x, 0.4, z, 0.8, 0.55, 1.4);
    b.block(VC.solid, '#f4f0e8', x, 0.95, z, 0.84, 0.1, 1.44);
    for (const e of [-1, 1]) b.cyl(VC.solid, '#1a1a1a', x + e * 0.43, 0.3, z + 0.4, 0.28, 0.06, 'cyl8', 0, Math.PI / 2);
    b.box(VC.glow, hdr('#ff6a1a', 2.2), x, 1.08, z + 0.2, 0.6, 0.06, 0.6);
    for (let k = 0; k < 14; k++) b.sph(VC.solid, '#5a2a14', x + rand(-0.25, 0.25), 1.14, z + 0.2 + rand(-0.25, 0.25), 0.05, true);
    for (let k = 0; k < 5; k++) b.add(G.cyl8, VC.solid, x - 0.15 + k * 0.08, 1.15, z - 0.35, 0.07, 0.36, 0.07, Math.PI / 2, 0, 0.3, '#e8b830');
    b.add(HALF, VC.metal, x, 1.05, z + 0.2, 0.7, 0.55, 0.7, 0, 0, 0, '#c8a050');
    b.add(G.sph, VC.metal, x, 1.62, z + 0.2, 0.09, 0.12, 0.09, 0, 0, 0, '#e8c060');
    b.cyl(VC.metal, '#3a3a3e', x - 0.25, 1.8, z - 0.55, 0.04, 1.4, 'cyl6');
    K.person(b, x - side * 0.75, z, { coat: pick(['#3a3a3e', '#5a4a3a']), cap: true, ry: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
    K.pool(b, x, z, 3, 3, hdr('#ff8a3a', 0.16));
    if (embers) embers.push([x, 1.3, z + 0.2]);
  };
  K.dondurma = (b, x, z, side) => {   // the Maraş ice-cream stand: tubs in the counter, the brass bells, the vendor in his fez with the long paddle
    const fx = x - side * 0.3;
    b.block(VC.solid, '#f4f0e8', fx, 0, z, 1.0, 1.0, 2.2);
    b.box(VC.solid, '#c8102e', fx - side * 0.51, 0.55, z, 0.02, 0.5, 2.2);
    b.box(VC.glow, hdr('#e8f4ff', 0.5), fx, 1.08, z, 0.9, 0.1, 2.0);
    for (let k = 0; k < 6; k++) b.cyl(VC.solid, pick(['#f8f4ec', '#ff9ac0', '#8a5a3a', '#a8e070', '#ffe8a0']), fx + rand(-0.2, 0.2), 1.12, z - 0.8 + k * 0.32, 0.13, 0.06, 'cyl8');
    for (const e of [-1, 1]) b.box(VC.metal, '#c8a050', fx, 1.9, z + e * 1.0, 0.06, 1.8, 0.06);
    b.box(VC.solid, '#c8102e', fx, 2.85, z, 1.3, 0.12, 2.5);
    b.add(G.plane, K.label('DONDURMA', { w: 512, h: 128, color: '#ffe8a0', bg: '#8a1428', border: '#f0c860', font: SERIF, weight: 900, size: 0.6, k: 1.2 }), fx - side * 0.66, 2.55, z, 2.2, 0.55, 1, 0, face(side), 0);
    for (let k = 0; k < 3; k++) b.sph(VC.metal, '#e8c060', fx - side * 0.62, 2.15, z - 0.6 + k * 0.6, 0.07, true);
    const vx = fx + side * 0.75;
    K.person(b, vx, z, { coat: '#8a1428', fez: true, ry: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
    beam(b, VC.metal, vx - side * 0.25, 1.2, z - 0.1, vx - side * 1.3, 2.3, z - 0.3, 0.03, '#d8dce0');
    b.sph(VC.solid, '#f8f4ec', vx - side * 1.32, 2.35, z - 0.3, 0.12, true);
  };
  K.teaGarden = (b, x0, x1, z0, z1, n) => {   // little tables and low stools, tea in tulip glasses
    for (let i = 0; i < n; i++) {
      const x = rand(Math.min(x0, x1), Math.max(x0, x1)), z = -rand(z0, z1);
      b.cyl(VC.solid, '#e8e0d0', x, 0.55, z, 0.32, 0.04, 'cyl8'); b.cyl(VC.metal, '#3a3a3e', x, 0.28, z, 0.03, 0.55, 'cyl6');
      for (let k = 0; k < 3; k++) b.add(G.cyl6, VC.glow, x + rand(-0.15, 0.15), 0.62, z + rand(-0.15, 0.15), 0.06, 0.1, 0.06, 0, 0, 0, hdr('#c8401a', 1.1));
      const m = randi(1, 3);
      for (let k = 0; k < m; k++) {
        const a = (k / m) * Math.PI * 2 + rand(-0.3, 0.3), px = x + Math.cos(a) * 0.62, pz = z + Math.sin(a) * 0.62;
        b.block(VC.solid, pick(['#3a6aa8', '#c8302a', '#2a8a5a', '#d8a030']), px, 0, pz, 0.3, 0.32, 0.3);
        K.person(b, px, pz, { seated: true, y: -0.1, ry: Math.PI / 2 - a });
      }
    }
  };
  K.samovar = (b, x, z) => {   // the tea maker's double kettle over its burner
    b.block(VC.solid, '#5a3a20', x, 0, z, 0.9, 0.9, 1.6);
    b.cyl(VC.metal, '#d8d8d4', x, 1.15, z - 0.3, 0.2, 0.5); b.cyl(VC.metal, '#d8d8d4', x, 1.5, z - 0.3, 0.13, 0.25);
    b.cyl(VC.metal, '#c8a050', x, 1.1, z + 0.3, 0.16, 0.4);
    for (let k = 0; k < 6; k++) b.add(G.cyl6, VC.glow, x + 0.25, 0.97, z - 0.2 + k * 0.1, 0.06, 0.1, 0.06, 0, 0, 0, hdr('#c8401a', 1.2));
  };
  K.shoeShine = (b, x, z, side) => {   // the shoeshine's brass box, domed bottles in a row
    b.block(VC.solid, '#6a3a1a', x, 0, z, 0.5, 0.45, 0.7);
    b.add(G.plane, K.iznikMat, x - side * 0.26, 0.24, z, 0.6, 0.3, 1, 0, face(side), 0, '#ffffff');
    for (let k = 0; k < 4; k++) { b.cyl(VC.metal, '#e8c060', x + side * 0.1, 0.55, z - 0.24 + k * 0.16, 0.05, 0.2, 'cyl6'); b.sph(VC.metal, '#e8c060', x + side * 0.1, 0.68, z - 0.24 + k * 0.16, 0.06, true); }
    K.person(b, x + side * 0.55, z, { seated: true, ry: side < 0 ? -Math.PI / 2 : Math.PI / 2, cap: true });
  };
  K.musician = (b, x, z, side) => {   // a street musician with a bağlama, the case open in front of him
    K.person(b, x, z, { seated: chance(0.5), ry: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
    beam(b, VC.solid, x - side * 0.2, 1.0, z - 0.3, x - side * 0.25, 1.5, z + 0.5, 0.05, '#8a5a2a');
    b.add(G.sphLow, VC.solid, x - side * 0.2, 0.95, z - 0.35, 0.28, 0.22, 0.32, 0, 0, 0, '#a8682a');
    b.block(VC.solid, '#2a1a14', x - side * 0.8, 0, z, 0.5, 0.08, 1.0);
  };
  K.hamal = (b, x, z) => {   // a porter bent under his load
    const back = chance(0.5) ? 1 : -1;
    K.person(b, x, z, { coat: '#4a3a2a', cap: true, ry: back > 0 ? 0 : Math.PI });
    b.block(VC.solid, pick(['#c8a070', '#8a6a4a', '#d8c8a0']), x, 1.1, z + back * 0.3, 0.7, 0.8, 0.5);
    b.block(VC.solid, pick(['#a8201a', '#1a3a6a', '#e8d8b0']), x, 1.9, z + back * 0.3, 0.6, 0.5, 0.45);
  };
  K.nazarTree = (b, x, z) => {   // a little tree hung with blue evil eyes
    b.cyl(VC.solid, '#5a4030', x, 0.8, z, 0.05, 1.6, 'cyl6');
    for (let k = 0; k < 12; k++) { const a = rand(0, 6.28), r = rand(0.2, 0.5), y = rand(1.0, 1.7); b.sph(VC.glow, hdr('#2a6ae8', 1.3), x + Math.cos(a) * r, y, z + Math.sin(a) * r, 0.07, true); b.sph(VC.glow, hdr('#ffffff', 1.4), x + Math.cos(a) * r * 1.12, y, z + Math.sin(a) * r * 1.12, 0.03, true); }
  };
  K.lampCluster = (b, x, y, z, n = 7, spread = 0.7) => {   // mosaic lamps hanging close together, every colour
    for (let k = 0; k < n; k++) {
      const px = x + rand(-spread, spread) * 0.4, pz = z + rand(-spread, spread), py = y - rand(0, 0.9), r = rand(0.13, 0.22);
      b.box(VC.metal, '#3a2a14', px, (y + 0.3 + py) / 2, pz, 0.015, y + 0.3 - py, 0.015);
      b.add(G.sphLow, VC.glow, px, py, pz, r * 2, r * 2.3, r * 2, 0, 0, 0, hdr(pick(LAMP_COLS), rand(1.6, 2.4)));
      b.add(G.cone8, VC.metal, px, py + r * 1.2, pz, r * 1.2, r * 0.5, r * 1.2, 0, 0, 0, '#c8a050');
    }
  };
  K.spices = (b, x, z, side, L) => {   // the spice seller's bins on the pavement, each heaped into a cone
    for (let k = 0, n = Math.floor(L / 0.55); k < n; k++) for (let r = 0; r < 2; r++) {
      const px = x - side * r * 0.5, pz = z - L / 2 + 0.3 + k * 0.55;
      b.cyl(VC.solid, '#6a4a2a', px, 0.3 + r * 0.25, pz, 0.24, 0.6 + r * 0.5, 'cyl8');
      b.add(G.cone8, VC.solid, px, 0.75 + r * 0.5, pz, 0.45, 0.32, 0.45, 0, 0, 0, pick(SPICE));
    }
  };
  K.carpets = (b, x, z, side, n = 3, y = 1.6) => {   // kilims hung on the front, a pile on the pavement
    for (let k = 0; k < n; k++) b.add(planeUV(pick(K.kilimRects)), K.kilimMat, x - side * 0.04, y + rand(-0.2, 0.3), z - (n - 1) * 0.7 + k * 1.4, 1.2, 2.4, 1, 0, face(side), 0);
    for (let k = 0; k < 4; k++) b.block(VC.solid, pick(KILIM)[k % 3], x - side * 0.9, k * 0.09, z + rand(-0.1, 0.1), 1.2, 0.09, 1.8);
  };
  K.ceramics = (b, x, z, side, L) => {   // a table of İznik plates and bowls
    b.block(VC.solid, '#5a3a20', x, 0, z, 0.8, 0.8, L);
    for (let k = 0; k < Math.floor(L / 0.35); k++) b.add(G.cyl, VC.solid, x + rand(-0.2, 0.2), 0.84, z - L / 2 + 0.2 + k * 0.35, 0.3, 0.03, 0.3, 0, 0, 0, pick(['#f4f0e6', '#2ab0a8', '#1f4aa8', '#c8302a']));
    for (let k = 0; k < 5; k++) b.add(G.plane, K.iznikMat, x - side * 0.05, 1.3 + rand(0, 0.5), z - L / 2 + 0.3 + k * (L - 0.6) / 4, 0.38, 0.38, 1, 0, face(side), 0, '#ffffff');
  };
  K.crates = (b, x, z, side, L) => {   // the greengrocer's crates out front
    for (let k = 0; k < Math.floor(L / 0.6); k++) for (let r = 0; r < 2; r++) {
      const px = x - side * r * 0.45, pz = z - L / 2 + 0.3 + k * 0.6, c = pick(['#ff8a1a', '#c8202a', '#ffe23d', '#7ac83a', '#a82a3a']);
      b.block(VC.solid, '#8a6a3a', px, r * 0.3, pz, 0.45, 0.32, 0.55); b.block(VC.solid, c, px, r * 0.3 + 0.32, pz, 0.4, 0.08, 0.5);
    }
  };

  // ---------- vehicles and boats ----------
  K.taxi = (b, x, z, dir = pick([-1, 1])) => {   // a yellow cab, its TAKSİ light on the roof
    const c = '#f2c418';
    b.block(VC.solid, c, x, 0.32, z, 1.8, 0.6, 4.3);
    b.block(VC.solid, c, x, 0.92, z + dir * 0.2, 1.6, 0.5, 2.3);
    b.box(VC.glow, hdr('#1a2030', 0.6), x, 1.17, z + dir * 0.2, 1.62, 0.36, 2.0);
    b.box(VC.solid, '#1a1a1c', x, 0.55, z, 1.82, 0.08, 4.32);
    for (const e of [-1, 1]) for (const f of [-1.3, 1.3]) b.cyl(VC.solid, '#141414', x + e * 0.86, 0.32, z + f, 0.32, 0.22, 'cyl8', 0, Math.PI / 2);
    b.box(VC.glow, hdr('#fff4d6', 3), x, 0.62, z + dir * 2.16, 1.4, 0.12, 0.04);
    b.box(VC.glow, hdr('#ff2a2a', 1.6), x, 0.66, z - dir * 2.16, 1.4, 0.1, 0.04);
    b.block(VC.glow, hdr('#fff8e0', 1.6), x, 1.18, z + dir * 0.2, 0.7, 0.18, 0.28);
    b.add(G.plane, K.label('TAKSİ', { w: 256, h: 64, color: '#141414', bg: '#fff4c0', size: 0.66 }), x, 1.27, z + dir * 0.2 + dir * 0.145, 0.66, 0.16, 1, 0, dir > 0 ? 0 : Math.PI, 0);
  };
  K.dolmus = (b, x, z, dir = pick([-1, 1])) => {   // a yellow dolmuş minibus
    b.block(VC.solid, '#f2c418', x, 0.35, z, 2.0, 2.0, 5.6);
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#2a3040', 0.7), x + e * 1.01, 1.75, z, 0.02, 0.6, 4.6);
    b.box(VC.glow, hdr('#2a3040', 0.7), x, 1.75, z + dir * 2.81, 1.8, 0.7, 0.02);
    b.box(VC.solid, '#1a1a1c', x, 0.45, z, 2.02, 0.1, 5.62);
    for (const e of [-1, 1]) for (const f of [-1.9, 1.9]) b.cyl(VC.solid, '#141414', x + e * 0.95, 0.35, z + f, 0.35, 0.24, 'cyl8', 0, Math.PI / 2);
    b.box(VC.glow, hdr('#fff4d6', 3), x, 0.75, z + dir * 2.81, 1.6, 0.14, 0.04);
    b.add(G.plane, K.label('DOLMUŞ', { w: 256, h: 64, color: '#ffffff', bg: '#1a3a8a', size: 0.62 }), x, 2.25, z + dir * 2.82, 1.1, 0.27, 1, 0, dir > 0 ? 0 : Math.PI, 0);
  };
  K.boat = (b, x, z, ry = 0, { col = pick(['#2a6ab0', '#c8302a', '#f4f0e8', '#2a8a6a', '#e8c040']), y = -1.4, s = 1 } = {}) => {   // a little fishing boat at her mooring
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + (fx * ca + fz * sa) * s, y + fy * s, z + (-fx * sa + fz * ca) * s];
    b.add(G.box, VC.solid, ...P(0, 0.3, 0), 1.8 * s, 0.6 * s, 5.2 * s, 0, ry, 0, col);
    b.add(G.cone4, VC.solid, ...P(0, 0.3, -3.0), 2.5 * s, 0.85 * s, 0.85 * s, -Math.PI / 2, ry, 0, col);
    b.add(G.box, VC.solid, ...P(0, 0.62, 0), 1.9 * s, 0.08 * s, 5.4 * s, 0, ry, 0, '#f4f0e8');
    b.add(G.box, VC.solid, ...P(0, 1.1, 0.8), 1.1 * s, 0.9 * s, 1.4 * s, 0, ry, 0, '#f4f0e8');
    b.add(G.box, VC.glow, ...P(0, 1.2, 0.09), 0.9 * s, 0.3 * s, 0.02, 0, ry, 0, hdr('#ffe0a0', 1.2));
    b.add(G.box, VC.metal, ...P(0, 2.1, 0.8), 0.05, 1.4 * s, 0.05, 0, ry, 0, '#c8c8c4');
  };
  K.ferry = (b, x, z, ry = 0, s = 1, y = -1.2) => {   // a city-lines ferry: dark hull, white decks of lit windows, the funnel
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + (fx * ca + fz * sa) * s, y + fy * s, z + (-fx * sa + fz * ca) * s];
    const add = (geo, mat, fx, fy, fz, w, h, d, col) => b.add(geo, mat, ...P(fx, fy, fz), w * s, h * s, d * s, 0, ry, 0, col);
    add(G.box, VC.solid, 0, 0.9, 0, 8.4, 2.2, 36, '#1e2430');
    add(G.cyl, VC.solid, 0, 0.9, 18, 8.4, 2.2, 8.4, '#1e2430'); add(G.cyl, VC.solid, 0, 0.9, -18, 8.4, 2.2, 8.4, '#1e2430');
    add(G.box, VC.solid, 0, 2.6, 0, 8.6, 1.2, 40, '#f4f2ec');
    add(G.box, VC.solid, 0, 4.2, 0, 7.6, 2.0, 30, '#f4f2ec');
    add(G.box, VC.solid, 0, 6.0, 0, 6.4, 1.6, 20, '#f4f2ec');
    for (const e of [-1, 1]) {
      add(G.box, VC.glow, e * 3.82, 4.3, 0, 0.04, 0.9, 28, hdr('#ffe8b8', 1.4));
      add(G.box, VC.glow, e * 3.22, 6.1, 0, 0.04, 0.7, 18, hdr('#ffe8b8', 1.2));
      add(G.box, VC.glow, e * 4.32, 2.7, 0, 0.04, 0.5, 36, hdr('#fff0d0', 0.8));
    }
    add(G.cyl, VC.solid, 0, 8.4, 2, 2.4, 3.2, 2.4, '#f2c418'); add(G.cyl, VC.solid, 0, 10.1, 2, 2.42, 0.6, 2.42, '#1a1a1c');
    add(G.cyl, VC.solid, 0, 7.6, -8, 3.2, 0.8, 3.2, '#3a4250');
    add(G.sph, VC.glow, 0, 7.2, -10, 0.4, 0.4, 0.4, hdr('#ff3a2a', 2)); add(G.sph, VC.glow, 0, 7.2, 10, 0.4, 0.4, 0.4, hdr('#3aff6a', 2));
  };
  K.balikBoat = (b, x, z, side, y = -0.6) => {   // a fish-sandwich boat at the quay: gilded and painted, the grill smoking on deck
    const c = pick(['#c8202a', '#1a4a8a', '#2a6a3a']);
    b.box(VC.solid, c, x, y + 0.6, z, 4.2, 1.4, 9);
    b.box(VC.solid, '#e8c040', x, y + 1.3, z, 4.3, 0.16, 9.1);
    for (const e of [-1, 1]) b.add(G.cone4, VC.solid, x, y + 0.6, z + e * 5.0, 5.9, 1.4, 1.98, (e * Math.PI) / 2, 0, 0, c);
    b.box(VC.solid, '#f4ece0', x, y + 2.4, z, 3.6, 2.0, 5.6);
    for (let k = 0; k < 5; k++) b.box(VC.glow, hdr('#ffe0a0', 1.4), x - side * 1.81, y + 2.6, z - 2.2 + k * 1.1, 0.02, 0.8, 0.8);
    b.box(VC.solid, '#c8202a', x, y + 3.5, z, 4.0, 0.2, 6.2);
    for (let k = 0; k < 8; k++) b.sph(VC.glow, hdr(pick(['#ff4a4a', '#ffe23d', '#3ad6ff']), 2), x - side * 2.0, y + 3.65, z - 3 + k * 0.85, 0.08, true);
    b.box(VC.glow, hdr('#ff7a2a', 2.0), x - side * 0.6, y + 1.5, z + 3.2, 1.6, 0.1, 1.2);
    b.add(G.plane, K.label('BALIK EKMEK', { w: 512, h: 112, color: '#ffe8a0', bg: '#8a1a14', border: '#e8c040', font: SERIF, weight: 900, size: 0.6 }), x - side * 1.82, y + 3.0, z, 3.2, 0.7, 1, 0, face(side), 0);
    return [x - side * 0.6, y + 1.8, z + 3.2];
  };

  // ---------- buildings ----------
  const rect = (b, mat, col, x, y, z, w, h, side) => b.add(G.plane, mat, x, y, z, w, h, 1, 0, face(side), 0, col);
  // a shop on the ground floor: stone pilasters, the window full of goods, the sign over it, sometimes an awning
  K.shopfront = (b, i, { signs = PERA_SIGNS, h = 3.3, awning = chance(0.45), x0 = 0 } = {}) => {
    const s = i.side, x = i.face - s * 0.02, L = Math.min(i.len - 1.4, 7.5), sign = pick(signs);
    if (L < 2) return null;
    for (const e of [-1, 1]) b.box(VC.solid, '#d8ccb4', x - s * 0.13, h / 2, i.z + e * (L / 2 + 0.2), 0.3, h, 0.4);
    b.box(VC.solid, '#d8ccb4', x - s * 0.13, h + 0.12, i.z, 0.3, 0.28, L + 0.8);
    b.add(planeUV(K.goodsRects[GI[sign.goods]]), K.goodsMat, x - s * 0.03, h * 0.47, i.z, L, h * 0.86, 1, 0, face(s), 0);
    for (let k = 1; k < Math.round(L / 1.6); k++) b.box(VC.solid, '#2a2420', x - s * 0.05, h * 0.47, i.z - L / 2 + (k * L) / Math.round(L / 1.6), 0.04, h * 0.86, 0.06);
    const sw = Math.min(L, 5.4);
    b.add(planeUV(K.signRects[sign.i]), K.signMat, x - s * 0.06, h + 0.72, i.z, sw, (sw * 112) / 512, 1, 0, face(s), 0);
    if (awning) b.add(G.box, VC.solid, x - s * 0.75, h - 0.05, i.z, 1.6, 0.06, L + 0.3, 0, 0, s * 0.3, pick(['#a8201a', '#1f5a3a', '#1a3a6a', '#c8902a', '#6a1a3a']));
    K.pool(b, x - s * 1.2, i.z, 2.6, L, hdr('#ffd9a0', 0.1));
    return sign;
  };
  K.bay = (b, i, { y0 = 3.8, w = Math.min(i.len - 2, 3.6), d = 0.9, col = '#e8dcc6', mat = VC.solid, top = i.h - 1.5, z = i.z } = {}) => {   // a bay window (cumba) jutting over the street
    const s = i.side, x = i.face - (s * d) / 2;
    if (top - y0 < 2.4 || w < 1.6) return;
    b.box(mat, col, x, (y0 + top) / 2, z, d, top - y0, w);
    const floors = Math.max(1, Math.round((top - y0) / 3.2)), fh = (top - y0) / floors;
    const n = Math.max(2, Math.round(w / 1.05)), ox = x - (s * d) / 2 - s * 0.012;
    for (let f = 0; f < floors; f++) {
      const y = y0 + fh * (f + 0.52), room = chance(0.6) ? hdr(pick(['#ffd9a0', '#ffe8c0', '#ffc880']), 0.95) : null;
      for (let k = 0; k < n; k++) {   // a row of tall sash windows round the bay, a room lit behind some of them
        const wz = z - w / 2 + (k + 0.5) * (w / n);
        rect(b, VC.solid, '#f6f2ea', ox + s * 0.004, y, wz, (w / n) * 0.78, fh * 0.66, s);
        rect(b, VC.glow, room && chance(0.8) ? room : hdr('#1a1e28', 1), ox, y, wz, (w / n) * 0.6, fh * 0.56, s);
      }
      for (const e of [-1, 1]) b.add(G.plane, VC.glow, x, y, z + e * (w / 2 + 0.01), d * 0.42, fh * 0.52, 1, 0, e > 0 ? 0 : Math.PI, 0, room || hdr('#1a1e28', 1));
      b.box(VC.solid, '#f4f0e6', ox - s * 0.01, y0 + fh * f + 0.05, z, 0.06, 0.12, w + 0.05);
    }
    b.box(VC.solid, '#f4f0e6', x, top + 0.08, z, d + 0.25, 0.16, w + 0.25);
    b.box(VC.solid, '#f4f0e6', x, y0 - 0.06, z, d + 0.1, 0.12, w + 0.1);
    for (let k = 0; k <= 3; k++) { const bz = z - w / 2 + 0.15 + (k * (w - 0.3)) / 3; beam(b, VC.solid, i.face, y0 - 0.75, bz, x - (s * d) / 2 + s * 0.12, y0 - 0.08, bz, 0.08, col); }   // the brackets under it
  };
  K.balcony = (b, i, y, { w = Math.min(i.len - 2, 4), z = i.z, glazed = false } = {}) => {   // a slab and its railing; or glazed in
    const s = i.side, x = i.face - s * 0.55;
    b.box(VC.solid, '#d8d4cc', x, y, z, 1.1, 0.14, w);
    if (glazed) { b.box(VC.glow, hdr(chance(0.5) ? '#ffe0b0' : '#2a3040', 0.7), x - s * 0.02, y + 1.15, z, 1.0, 2.1, w - 0.1); b.box(VC.metal, '#c8ccd0', x - s * 0.53, y + 1.15, z, 0.04, 2.15, w); return; }
    b.box(VC.metal, '#2a2a2e', x - s * 0.53, y + 0.55, z, 0.04, 0.04, w); b.box(VC.metal, '#2a2a2e', x - s * 0.53, y + 0.3, z, 0.02, 0.5, w);
    if (chance(0.4)) for (let k = 0; k < 3; k++) b.sph(VC.solid, pick(['#e8202a', '#ff6aa0', '#3a7a3a', '#f4f0e8']), x - s * 0.35, y + 0.3, z - w / 3 + k * (w / 3), 0.18, true);
    if (chance(0.3)) for (let k = 0; k < 4; k++) b.add(G.plane, VC.solid, x - s * 0.2, y + 1.2, z - w / 2.5 + k * (w / 5), 0.45, 0.6, 1, 0, face(s), 0, pick(['#f4f0e8', '#3a6ab0', '#e8a0b0', '#f2c84a', '#8a2a2a']));   // the washing
  };
  K.dish = (b, x, y, z, side) => b.add(G.sphLow, VC.solid, x, y, z, 0.12, 0.7, 0.7, 0, 0, side * 0.5, '#e8e8e4');   // a satellite dish
  K.ac = (b, i, n = randi(1, 3)) => { for (let k = 0; k < n; k++) b.box(VC.solid, '#e8e8e4', i.face - i.side * 0.25, rand(4, i.h - 2), i.z + rand(-i.len / 2 + 1, i.len / 2 - 1), 0.5, 0.6, 0.9); };
  K.hipRoof = (b, i, { h = rand(1.6, 2.4), col = pick(TILE), eave = 0.5 } = {}) => {   // a tiled hip roof over the eaves board
    b.box(VC.solid, '#f0e8dc', i.x, i.h - 0.1, i.z, i.d + eave * 1.2, 0.22, i.len + eave * 1.2);
    b.add(G.cone4, VC.solid, i.x, i.h + h / 2, i.z, (i.d + eave * 2) * 1.414, h, (i.len + eave * 2) * 1.414, 0, 0, 0, col);
    if (chance(0.4)) b.block(VC.solid, '#c8b8a8', i.x + rand(-1, 1), i.h + h * 0.4, i.z + rand(-1, 1), 0.6, h * 0.9, 0.6);
  };
  K.dome = (b, x, y, z, r, { col = '#8a9098', drum = 0.3, finial = true, lit = null } = {}) => {   // a lead dome on its drum, a crescent finial
    if (drum) b.cyl(VC.solid, lit || '#e0d8c8', x, y + (r * drum) / 2, z, r * 1.0, r * drum, 'cyl');
    b.add(HALF, VC.solid, x, y + r * drum, z, r * 2, r * 1.9, r * 2, 0, 0, 0, col);
    if (finial) { b.cyl(VC.metal, '#e8c060', x, y + r * (drum + 0.95) + 0.3, z, 0.05 * Math.max(1, r / 3), 0.6, 'cyl6'); b.add(G.tor, VC.metal, x, y + r * (drum + 0.95) + 0.75, z, 0.35, 0.35, 0.6, 0, 0, 0, '#e8c060'); }
  };
  // a row of buildings along one side: common.js's buildingRow, except that each front is told its building's colour
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
  // stone fronts of Pera: cornices, bay windows, balconies, flags, a shop below
  const peraRoof = (b, i) => {
    b.box(VC.solid, '#d8ccb4', i.x, i.h + 0.22, i.z, i.d + 0.5, 0.44, i.len + 0.5);
    const r = Math.random();
    if (r < 0.22) { b.box(VC.solid, '#4a4e58', i.x, i.h + 1.3, i.z, i.d - 1, 1.8, i.len - 1); for (let k = 0; k < Math.floor(i.len / 2.6); k++) b.box(VC.glow, hdr(chance(0.5) ? '#ffd9a0' : '#1a1e28', 0.9), i.face + i.side * 0.42, i.h + 1.3, i.z - i.len / 2 + 1.5 + k * 2.6, 0.3, 0.8, 0.6); }   // a mansard with dormers
    else if (r < 0.34) K.dome(b, i.face + i.side * 2.2, i.h + 0.4, i.z - i.len / 2 + 2.2, 1.8, { col: '#5a6068', drum: 0.6, finial: false });   // a corner turret
    else for (let k = randi(1, 4); k > 0; k--) K.dish(b, i.x + rand(-i.d / 3, i.d / 3), i.h + 0.9, i.z + rand(-i.len / 3, i.len / 3), i.side);
    if (chance(0.35)) b.cyl(VC.solid, '#e8e8e4', i.x + rand(-1, 1), i.h + 1.2, i.z + rand(-1, 1), 0.6, 1.6);
  };
  const peraFront = (b, i, signs = PERA_SIGNS) => {
    K.shopfront(b, i, { signs });
    const s = i.side, trim = '#f4ecdc';
    for (let y = 3.75; y < i.h - 1; y += 3.4) b.box(VC.solid, trim, i.face - s * 0.1, y, i.z, 0.22, 0.2, i.len - 0.2);   // a string course at every floor
    for (const e of [-1, 1]) b.box(VC.solid, trim, i.face - s * 0.09, i.h / 2, i.z + e * (i.len / 2 - 0.35), 0.18, i.h, 0.55);   // pilasters at the corners
    if (i.h > 12 && chance(0.55)) K.bay(b, i, { y0: 4.6, col: i.col, top: i.h - 2.6 });
    else if (chance(0.6)) for (let y = 4.6; y < i.h - 3; y += 3.4) K.balcony(b, i, y, { w: Math.min(i.len - 2, 5) });
    if (chance(0.3)) K.flag(b, i.face, rand(6, i.h - 3), i.z + rand(-i.len / 3, i.len / 3), i.side);
    if (chance(0.5)) K.ac(b, i);
  };
  K.peraTypes = (signs = PERA_SIGNS) => [
    { mat: K.stoneMatA, tex: stoneA, colors: STONE, w: [8, 14], h: [13, 22], weight: 2, cellW: 1.9, cellH: 3.4, roof: peraRoof, front: (b, i) => peraFront(b, i, signs) },
    { mat: K.stoneMatB, tex: stoneB, colors: STONE, w: [7, 12], h: [12, 20], weight: 2, cellW: 1.8, cellH: 3.3, roof: peraRoof, front: (b, i) => peraFront(b, i, signs) },
  ];
  K.peraRow = (b, s, z0 = 0, z1 = CHUNK_LEN, { x0 = X0, signs } = {}) => row(b, s, K.peraTypes(signs), { x0, depth: [10, 14], gap: [0, 0.3], z0, z1, setback: [0, 0.3] });
  // painted wooden houses with their cumbas, and brick row houses with stone bays, on narrow cobbled streets
  const woodFront = (b, i, bay) => {
    const s = i.side, dz = i.z + i.len / 4;
    b.box(VC.solid, '#3a2418', i.face - s * 0.04, 1.15, dz, 0.06, 2.3, 1.1);   // the door, its lamp, the step
    b.box(VC.glow, hdr('#ffd9a0', 1.6), i.face - s * 0.3, 2.6, dz, 0.12, 0.18, 0.14);
    b.block(VC.solid, '#a8a49c', i.face - s * 0.4, 0, dz, 0.8, 0.2, 1.4);
    if (chance(0.78)) K.bay(b, i, { y0: 3.2, top: i.h - 0.4, w: Math.min(i.len - 1.4, 3.4), d: 0.85, ...bay, z: i.z - i.len / 8 });
    if (chance(0.35)) for (let k = 0; k < 3; k++) b.sph(VC.solid, pick(['#e8202a', '#ff6aa0', '#f4f0e8', '#ff8a2a']), i.face - s * 0.2, 1.4, i.z - i.len / 3 + k * 0.4, 0.14, true);   // geraniums on the sill
    else if (chance(0.25)) K.shopfront(b, i, { signs: MAHALLE_SIGNS, h: 2.8, awning: true });
    if (chance(0.3)) b.add(G.box, VC.solid, i.face - s * 0.1, rand(3, 6), i.z + i.len / 3, 0.12, rand(2, 4), rand(1, 2), 0, 0, 0, pick(['#3a6a2a', '#4a7a30']));   // ivy
  };
  K.woodTypes = () => [
    { mat: K.woodMat, tex: wood, colors: WOOD, w: [5, 8], h: [7, 11], weight: 3, cellW: 1.6, cellH: 3.0, roof: (b, i) => K.hipRoof(b, i), front: (b, i) => woodFront(b, i, { col: i.col }) },
    { mat: K.brickMat, tex: brick, colors: ['#ffffff', '#f0d8c8', '#e8c8b0'], w: [5, 8], h: [8, 12], weight: 1.2, cellW: 1.7, cellH: 3.1, roof: (b, i) => K.hipRoof(b, i, { h: rand(1.2, 1.8) }),
      front: (b, i) => woodFront(b, i, { col: '#e8dcc6', y0: 3.4, top: i.h - 0.6, d: 0.8 }) },
  ];
  K.woodRow = (b, s, z0 = 0, z1 = CHUNK_LEN, { x0 = 9 } = {}) => row(b, s, K.woodTypes(), { x0, depth: [8, 11], gap: [0, 0.15], z0, z1, setback: [0, 0.4] });
  // the neighbourhoods' apartment blocks: balconies, glazed or open, dishes, a shop on the ground floor
  const aptRoof = (b, i) => {
    if (chance(0.45)) K.hipRoof(b, i, { h: rand(1.4, 2.0), eave: 0.3 });
    else {
      b.box(VC.solid, '#d8d4cc', i.x, i.h + 0.4, i.z, i.d, 0.8, i.len);
      for (let k = randi(2, 5); k > 0; k--) K.dish(b, i.x + rand(-i.d / 3, i.d / 3), i.h + 1.2, i.z + rand(-i.len / 3, i.len / 3), i.side);
      if (chance(0.5)) b.cyl(VC.solid, '#e8e8e4', i.x, i.h + 1.4, i.z, 0.7, 1.4);
    }
  };
  const aptFront = (b, i) => {
    K.shopfront(b, i, { signs: MAHALLE_SIGNS, h: 2.9, awning: chance(0.6) });
    const glazed = chance(0.5);
    for (let y = 3.6; y < i.h - 2; y += 2.9) {
      if (i.len > 11) { for (const e of [-1, 1]) K.balcony(b, i, y, { w: 3, z: i.z + e * i.len * 0.25, glazed: glazed && chance(0.7) }); }
      else K.balcony(b, i, y, { w: Math.min(i.len - 2, 4), glazed: glazed && chance(0.7) });
      if (chance(0.15)) K.dish(b, i.face - i.side * 1.0, y + 0.8, i.z + rand(-1, 1), i.side);
    }
    if (chance(0.6)) K.ac(b, i, randi(1, 4));
    if (chance(0.15)) K.flag(b, i.face, rand(6, i.h - 3), i.z, i.side);
  };
  K.aptTypes = () => [{ mat: K.aptMat, tex: apt, colors: APT, w: [10, 16], h: [14, 23], weight: 1, cellW: 1.7, cellH: 2.9, roof: aptRoof, front: aptFront }];
  K.aptRow = (b, s, z0 = 0, z1 = CHUNK_LEN, { x0 = X0 } = {}) => row(b, s, K.aptTypes(), { x0, depth: [10, 14], gap: [0.2, 1.0], z0, z1, setback: [0, 0.6] });
  // the bazaar quarter: low stone hans with domes, deep shops spilling their goods onto the pavement
  const bazaarFront = (b, i) => {
    const sign = K.shopfront(b, i, { signs: BAZAAR_SIGNS, h: 3.4, awning: chance(0.7) });
    if (!sign) return;
    const s = i.side, ox = i.face - s * 1.0, L = Math.min(i.len - 1.6, 6);
    if (sign.goods === 'spices') K.spices(b, ox, i.z, s, L);
    else if (sign.goods === 'lamps') { for (let k = 0; k < 3; k++) K.lampCluster(b, i.face - s * 0.7, 3.0, i.z - L / 3 + k * (L / 3), 6, 0.5); }
    else if (sign.goods === 'carpets') K.carpets(b, i.face, i.z, s, 2, 1.8);
    else if (sign.goods === 'ceramics') K.ceramics(b, ox, i.z, s, L * 0.7);
    else if (sign.goods === 'textiles') for (let k = 0; k < 5; k++) b.add(G.plane, VC.solid, i.face - s * 0.3, 2.2, i.z - L / 2 + k * (L / 4), 0.5, 1.6, 1, 0, face(s), 0, pick(['#e8202a', '#2a6ad0', '#ffd23d', '#2ab0a8', '#ff6aa0', '#8a2a9a']));
    else { b.block(VC.solid, '#5a3a20', ox, 0, i.z, 0.7, 0.9, L * 0.6); b.box(VC.glow, hdr('#fff0d0', 0.4), ox, 1.1, i.z, 0.66, 0.4, L * 0.6 - 0.1); }   // a glass counter of gold, lokum or baklava
  };
  const bazaarRoof = (b, i) => {
    b.box(VC.solid, '#c8b898', i.x, i.h + 0.2, i.z, i.d + 0.3, 0.4, i.len + 0.3);
    if (chance(0.6)) for (let k = 0, n = Math.max(1, Math.floor(i.len / 4)); k < n; k++) K.dome(b, i.x, i.h + 0.4, i.z - i.len / 2 + (k + 0.5) * (i.len / n), 1.5, { col: '#7a828c', drum: 0.25, finial: false });
    else for (let k = randi(1, 3); k > 0; k--) b.block(VC.solid, '#b8a888', i.x + rand(-1.5, 1.5), i.h, i.z + rand(-1, 1), 0.5, 1.6, 0.5);
  };
  K.bazaarTypes = () => [{ mat: K.stoneMatB, tex: stoneB, colors: ['#f4e4c4', '#e8d4b4', '#f8ecd4', '#dcc8a8'], w: [6, 10], h: [8, 13], weight: 1, cellW: 2.2, cellH: 3.6, roof: bazaarRoof, front: bazaarFront }];
  K.bazaarRow = (b, s, z0 = 0, z1 = CHUNK_LEN, { x0 = X0 } = {}) => row(b, s, K.bazaarTypes(), { x0, depth: [9, 12], gap: [0, 0.2], z0, z1, setback: [0, 0.2] });

  // ---------- the waterfront ----------
  K.quay = (b, s, { x = EDGE + 6.5, z0 = 0, z1 = CHUNK_LEN, gulls = 3 } = {}) => {   // the quay's stone edge and its railing, the water beyond
    const L = z1 - z0, zc = -(z0 + z1) / 2;
    b.box(VC.solid, '#a8a094', s * (x + 0.4), -0.6, zc, 0.8, 1.4, L);
    b.add(G.plane, K.water, s * (x + 160), -1.15, zc, 320, L, 1, -Math.PI / 2, 0, 0);
    b.box(VC.metal, '#1f2a2a', s * (x + 0.2), 1.05, zc, 0.06, 0.06, L);
    b.box(VC.metal, '#1f2a2a', s * (x + 0.2), 0.6, zc, 0.03, 0.03, L);
    for (let z = z0 + 1; z < z1; z += 2.2) b.box(VC.metal, '#1f2a2a', s * (x + 0.2), 0.55, -z, 0.06, 1.1, 0.06);
    for (let k = 0; k < gulls; k++) K.gull(b, s * (x + 0.2), 1.08, -rand(z0 + 2, z1 - 2), s < 0 ? Math.PI / 2 : -Math.PI / 2);
  };
  K.farShore = (b, s, { x = 210, z0 = 0, z1 = CHUNK_LEN, mosque = chance(0.6) } = {}) => {   // the shore across the water: low houses climbing a hill, lit windows, a mosque
    const zc = -(z0 + z1) / 2, L = z1 - z0;
    b.add(G.sphLow, VC.solid, s * (x + 70), -14, zc, 140, 52, L + 40, 0, 0, 0, '#262a36');
    for (let k = 0; k < 26; k++) {
      const d = rand(-4, 46), bx = s * (x + d), bz = -rand(z0, z1), h = rand(4, 9), w = rand(8, 16), y0 = -1.2 + Math.max(0, d) * 0.32;
      b.block(VC.solid, pick(['#5a5060', '#665862', '#4e4a5a', '#6a5e5a', '#585068']), bx, y0, bz, w * 0.7, h, w);
      if (chance(0.5)) b.add(G.cone4, VC.solid, bx, y0 + h + 0.9, bz, w * 0.99, 1.8, w * 1.41, 0, 0, 0, '#6a3a2e');
      for (let n = randi(1, 3); n > 0; n--) b.box(VC.glow, hdr(pick(['#ffd9a0', '#fff0d0', '#ffc880']), rand(1.2, 1.8)), bx - s * w * 0.36, y0 + rand(1, h - 1.5), bz + rand(-w / 3, w / 3), 0.1, 0.9, 1.1);
    }
    for (let k = 0; k < 30; k++) b.box(VC.glow, hdr(pick(['#ffd9a0', '#fff0d0', '#ffb070']), rand(1.0, 1.8)), s * (x - 5), -0.6, -rand(z0, z1), 0.1, 0.3, rand(0.6, 2));   // the shore road's lights on the water's edge
    if (mosque) {
      const mx = s * (x + 30), mz = zc, my = -1.2 + 30 * 0.32;
      b.block(VC.solid, '#d8ccb4', mx, my, mz, 14, 10, 14);
      K.dome(b, mx, my + 10, mz, 6, { col: '#9aa0a8', drum: 0.35, lit: '#e8dcc0' });
      for (const e of [-1, 1]) { b.cyl(VC.solid, '#ece4d4', mx + e * 8, my + 13, mz - 7, 0.7, 26, 'cyl8'); b.cyl(VC.glow, hdr('#ffe0a0', 1.6), mx + e * 8, my + 19, mz - 7, 0.95, 0.4, 'cyl8'); b.add(G.cone8, VC.solid, mx + e * 8, my + 28, mz - 7, 1.5, 4, 1.5, 0, 0, 0, '#7a828c'); }
    }
  };
  K.update = (t) => { K.water.userData.scroll.offset.y = t * 0.02; };
  return K;
}
