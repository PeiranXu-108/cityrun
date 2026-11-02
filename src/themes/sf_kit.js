// San Francisco's street kit for a foggy summer evening: the Painted Ladies' rows of Victorians with their bay windows,
// cornices and gables, their stoops climbing to the doors and the garages under them; the Haight's psychedelic paint and
// shops; the Mission's murals, papel picado and taquerías; the parking lane with its cars, Muni trolley buses under their
// wires, lowriders and a flowered VW bus; plane trees, palms and the cypress; streetlights, fire hydrants with coloured
// bonnets, stop signs, newsstands, flower stands, food carts and parklets; people in their fog layers, tourists in new
// hoodies, cyclists, dogs; the bay with its sailboats; and the fog drifting through all of it.
// Every sign is in English, or in Spanish in the Mission.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, planeUV, windowTex, buildingGeo, shade, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { facadeMat, EDGE, at, waterMat } from './common.js';
import { beam } from './tokyo_kit.js';
import { sydneyTreeKit, parkTreeKit, sfTreeKit } from './trees.js';
import { frame } from './ny_icons.js';
import { puffs } from './taipei_towers.js';
import { tiledBox } from './beijing_kit.js';

export const SANS = '"Oswald", "Arial Narrow", sans-serif';
export const DISPLAY = '"Russo One", "Arial Black", sans-serif';
export const SERIF = '"Playfair Display", Georgia, "Times New Roman", serif';
export const WEST = '"Rye", "Playfair Display", Georgia, serif';          // painted boards of the wharf and the old shops
export const GROOVY = '"Righteous", "Russo One", sans-serif';             // the Haight
export const NEON = '"Monoton", "Righteous", sans-serif';                 // neon tubes
// the accented letters the Mission's signs draw (main.js loads the fonts for them)
export const GLYPHS = 'ÁÉÍÓÚÑáéíóúñ¡¿';
export const X0 = 14;        // the building line of the residential streets: stoops and little gardens in front of it
export const KERB = 6.6;     // the kerb: the parking lane lies between it and the track, the pavement beyond it
export const face = (s) => (-s * Math.PI) / 2;   // turns a plane (or a frame) on side s to face the track
export const WARM = ['#ffd9a0', '#ffe6bc', '#ffc880', '#fff0d8', '#ffdcb0'];

// ---------- textures ----------
function pavementTex() {   // the pale concrete of the pavements, scored into squares, a few stains and spots of old gum
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#bab4aa'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = randi(-16, 14); g.fillStyle = `rgba(${178 + v},${172 + v},${162 + v},0.7)`; g.fillRect(rand(0, w), rand(0, h), rand(1, 3), rand(1, 3)); }
    for (let i = 0; i < 7; i++) { const x = rand(0, w), y = rand(0, h), r = rand(10, 34), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(120,112,100,0.18)'); gr.addColorStop(1, 'rgba(120,112,100,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(60,58,56,0.35)'; g.beginPath(); g.arc(rand(0, w), rand(0, h), rand(1, 2.2), 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(96,90,82,0.75)';
    for (const p of [0, 128]) { g.fillRect(p, 0, 2, h); g.fillRect(0, p, w, 2); }
    g.strokeStyle = 'rgba(90,84,76,0.4)'; g.lineWidth = 1;
    for (let i = 0; i < 3; i++) { g.beginPath(); let x = rand(0, w), y = rand(0, h); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rand(-14, 14); y += rand(4, 14); g.lineTo(x, y); } g.stroke(); }
  });
}
function asphaltTex() {   // the road: dark asphalt, patched, the grit in it catching the light
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#3c3c42'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) { const v = randi(-12, 18); g.fillStyle = `rgb(${58 + v},${58 + v},${64 + v})`; g.fillRect(rand(0, w), rand(0, h), rand(1, 2.5), rand(1, 2.5)); }
    for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(${pick([30, 74])},${pick([30, 72])},${pick([34, 78])},0.35)`; g.fillRect(rand(0, w), rand(0, h), rand(30, 90), rand(20, 70)); }
  });
}
function sidingTex() {   // painted clapboard: a board every few centimetres, its shadow line under it (tinted by the house's colour)
  return canvasTex(64, 128, (g, w, h) => {
    g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 10.67) { g.fillStyle = '#c6c2ba'; g.fillRect(0, y + 8.6, w, 2); g.fillStyle = '#ffffff'; g.fillRect(0, y, w, 1.2); }
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(0,0,0,${rand(0.02, 0.06)})`; g.fillRect(rand(0, w), rand(0, h), rand(2, 10), 1); }
  });
}
function shingleTex() {   // fish-scale shingles for the gables
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#d8d4cc'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 5; r++) for (let c = -1; c < 5; c++) {
      const x = c * 16 + (r % 2) * 8 + 8, y = r * 16;
      g.fillStyle = '#f6f4f0'; g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x - 8, y + 8); g.arc(x, y + 8, 8, Math.PI, 0, true); g.lineTo(x + 8, y); g.closePath(); g.fill();
      g.strokeStyle = '#b8b4ac'; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y + 8, 7.4, Math.PI, 0, true); g.stroke();
    }
  });
}
function brickTex() {   // the red brick of the old warehouses
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#5a2a22'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) for (let x = ((y / 8) % 2) * 8 - 8; x < w; x += 16) { const v = randi(-16, 14); g.fillStyle = `rgb(${150 + v},${70 + v * 0.5},${54 + v * 0.4})`; g.fillRect(x + 1, y + 1, 14, 6); }
  });
}
// the Mission's murals: suns, mountains and pyramids, flowers, birds, hearts and faces in bold colours, outlined dark
const MURAL_COLS = ['#ff3d7f', '#ffd23d', '#39c8e8', '#7cd84a', '#b46bff', '#ff7a2a', '#e8302a', '#2a6ad8', '#f4f0e0', '#1a8a6a'];
function drawMural(g, w, h, seed) {
  const C = () => pick(MURAL_COLS);
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, pick(['#2a4ab0', '#5a2a8a', '#1a8ab0', '#e85a2a'])); sky.addColorStop(1, pick(['#ffb04a', '#ff6a8a', '#ffd23d', '#7ad8e8']));
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.lineWidth = 4; g.strokeStyle = '#1a1420';
  const sx = rand(0.2, 0.8) * w, sy = rand(0.18, 0.38) * h, sr = rand(0.1, 0.16) * w;   // the sun and its rays
  g.fillStyle = '#ffd23d';
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; g.beginPath(); g.moveTo(sx + Math.cos(a - 0.12) * sr, sy + Math.sin(a - 0.12) * sr); g.lineTo(sx + Math.cos(a) * sr * 1.7, sy + Math.sin(a) * sr * 1.7); g.lineTo(sx + Math.cos(a + 0.12) * sr, sy + Math.sin(a + 0.12) * sr); g.fill(); }
  g.fillStyle = '#ff9a2a'; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill(); g.stroke();
  const m = seed % 3;
  if (m === 0) {   // a stepped pyramid on green hills
    g.fillStyle = '#3a9a4a'; g.beginPath(); g.moveTo(0, h); g.quadraticCurveTo(w * 0.3, h * 0.45, w * 0.6, h * 0.7); g.quadraticCurveTo(w * 0.85, h * 0.55, w, h * 0.65); g.lineTo(w, h); g.fill(); g.stroke();
    for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? '#c8803a' : '#e8a050'; const pw = w * (0.42 - k * 0.07), py = h * (0.88 - k * 0.07); g.fillRect(w * 0.5 - pw / 2, py, pw, h * 0.07); g.strokeRect(w * 0.5 - pw / 2, py, pw, h * 0.07); }
  } else if (m === 1) {   // waves and a bird over them
    for (let k = 0; k < 4; k++) { g.fillStyle = ['#1a6ab0', '#2a8ad8', '#39c8e8', '#f4f0e0'][k]; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * (0.6 + k * 0.09) + Math.sin(x * 0.05 + k) * 10); g.lineTo(w, h); g.fill(); }
    g.fillStyle = C(); const bx = rand(0.3, 0.7) * w, by = h * 0.42; g.beginPath(); g.moveTo(bx - 60, by - 20); g.quadraticCurveTo(bx - 20, by - 10, bx, by + 10); g.quadraticCurveTo(bx + 20, by - 10, bx + 60, by - 26); g.quadraticCurveTo(bx + 10, by + 6, bx, by + 26); g.quadraticCurveTo(bx - 10, by + 6, bx - 60, by - 20); g.fill(); g.stroke();
  } else {   // a face in profile, hair flowing into flowers
    g.fillStyle = pick(['#a8603a', '#c88a5a', '#7a4a2a']); g.beginPath(); g.ellipse(w * 0.42, h * 0.6, w * 0.15, h * 0.26, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#1a1420'; g.beginPath(); g.ellipse(w * 0.36, h * 0.48, w * 0.2, h * 0.24, -0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f4f0e0'; g.beginPath(); g.ellipse(w * 0.5, h * 0.55, 8, 5, 0, 0, Math.PI * 2); g.fill();
  }
  for (let k = 0; k < 7; k++) {   // flowers
    const fx = rand(0.05, 0.95) * w, fy = rand(0.55, 0.95) * h, fr = rand(8, 18), c = C();
    for (let p = 0; p < 6; p++) { const a = (p / 6) * Math.PI * 2; g.fillStyle = c; g.beginPath(); g.ellipse(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr, fr * 0.7, fr * 0.45, a, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.fillStyle = '#ffd23d'; g.beginPath(); g.arc(fx, fy, fr * 0.5, 0, Math.PI * 2); g.fill(); g.stroke();
  }
  if (chance(0.6)) { g.fillStyle = '#e8302a'; const hx = rand(0.2, 0.8) * w, hy = rand(0.25, 0.5) * h, r = 16; g.beginPath(); g.moveTo(hx, hy + r * 1.4); g.bezierCurveTo(hx - r * 2, hy, hx - r, hy - r * 1.4, hx, hy - r * 0.4); g.bezierCurveTo(hx + r, hy - r * 1.4, hx + r * 2, hy, hx, hy + r * 1.4); g.fill(); g.stroke(); }
  g.fillStyle = '#1a1420'; g.fillRect(0, h - 14, w, 14);   // a zigzag border along the foot
  for (let x = 0; x < w; x += 16) { g.fillStyle = (x / 16) % 2 ? '#ffd23d' : '#e8302a'; g.beginPath(); g.moveTo(x, h); g.lineTo(x + 8, h - 12); g.lineTo(x + 16, h); g.fill(); }
}
function muralAtlas() {
  const cw = 256, ch = 192, cols = 3, rows = 2;
  const tex = canvasTex(cw * cols, ch * rows, (g) => { for (let i = 0; i < cols * rows; i++) { g.save(); g.translate((i % cols) * cw, Math.floor(i / cols) * ch); g.beginPath(); g.rect(0, 0, cw, ch); g.clip(); drawMural(g, cw, ch, i); g.restore(); } }, { repeat: false });
  return { tex, rects: Array.from({ length: cols * rows }, (_, i) => ({ u0: (i % cols) / cols + 0.002, u1: ((i % cols) + 1) / cols - 0.002, v0: 1 - (Math.floor(i / cols) + 1) / rows + 0.003, v1: 1 - Math.floor(i / cols) / rows - 0.003 })) };
}
// papel picado: tissue-paper flags with their patterns cut out and a scalloped hem
const PAPEL = ['#ff3d9a', '#ff8a1a', '#ffd23d', '#39d86a', '#2a9aff', '#b45aff', '#ff2a3a', '#2ad8c8'];
function papelAtlas() {
  const cw = 64, ch = 80;
  const tex = canvasTex(cw * PAPEL.length, ch, (g) => PAPEL.forEach((c, i) => {
    const x0 = i * cw;
    g.fillStyle = c; g.fillRect(x0 + 2, 0, cw - 4, ch - 8);
    for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x0 + 2 + (k + 0.5) * ((cw - 4) / 6), ch - 8, (cw - 4) / 12, 0, Math.PI); g.fill(); }
    g.globalCompositeOperation = 'destination-out';
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const x = x0 + 10 + k * 14 + (r % 2) * 7, y = 12 + r * 14; g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + 3.5, y); g.lineTo(x, y + 4); g.lineTo(x - 3.5, y); g.fill(); }
    g.beginPath(); g.arc(x0 + cw / 2, ch * 0.45, 9, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = c; g.beginPath(); g.arc(x0 + cw / 2, ch * 0.45, 5, 0, Math.PI * 2); g.fill();
  }), { repeat: false });
  return { tex, rects: PAPEL.map((_, i) => ({ u0: i / PAPEL.length, u1: (i + 1) / PAPEL.length, v0: 0, v1: 1 })) };
}

// ---------- signs ----------
// shop boards, each with the goods to show in its window
export const SIGNS = [
  { t: 'COFFEE', fg: '#f4e4c4', bg: '#3a2418', f: SERIF, goods: 'cafe' }, { t: 'SOURDOUGH', fg: '#5a2a10', bg: '#f4e4c0', f: WEST, goods: 'bakery' },
  { t: 'BOOKS', fg: '#f0d890', bg: '#1f3a5a', f: SERIF, goods: 'books' }, { t: 'RECORDS', fg: '#ffd23d', bg: '#c8302a', f: GROOVY, goods: 'records' },
  { t: 'VINTAGE', fg: '#ff7ab8', bg: '#2a1a3a', f: GROOVY, goods: 'vintage' }, { t: 'FLOWERS', fg: '#d81e5a', bg: '#fff4f8', f: SERIF, goods: 'flowers' },
  { t: 'WINE BAR', fg: '#f0c860', bg: '#4a1424', f: SERIF, goods: 'wine' }, { t: 'DELI', fg: '#ffffff', bg: '#2a7a4a', f: SANS, goods: 'grocery' },
  { t: 'TIE-DYE', fg: '#ffffff', bg: '#8a3ab4', f: GROOVY, goods: 'tiedye' }, { t: 'POSTERS', fg: '#141414', bg: '#ffd23d', f: GROOVY, goods: 'gallery' },
  { t: 'ICE CREAM', fg: '#c8306a', bg: '#fff0f4', f: GROOVY, goods: 'icecream' }, { t: 'GALLERY', fg: '#141414', bg: '#f2f0ea', f: SERIF, goods: 'gallery' },
  { t: 'JEWELRY', fg: '#f0c860', bg: '#1a1a24', f: SERIF, goods: 'jewel' }, { t: 'HARDWARE', fg: '#ffffff', bg: '#c8302a', f: SANS, goods: 'shop' },
  { t: 'MARKET', fg: '#ffffff', bg: '#1a4a8a', f: SANS, goods: 'grocery' }, { t: 'CHOCOLATE', fg: '#f0d8a0', bg: '#3a2014', f: WEST, goods: 'sweets' },
  { t: 'SEAFOOD', fg: '#ffffff', bg: '#1a5a8a', f: WEST, goods: 'seafood' }, { t: 'CLAM CHOWDER', fg: '#1a3a5a', bg: '#f4ecd8', f: WEST, goods: 'seafood' },
  { t: 'GIFTS', fg: '#ffffff', bg: '#c8302a', f: SANS, goods: 'gifts' }, { t: 'BOUTIQUE', fg: '#f4e8f0', bg: '#5a3a5a', f: SERIF, goods: 'vintage' },
  { t: 'BEADS', fg: '#ffd23d', bg: '#2a6a8a', f: GROOVY, goods: 'jewel' }, { t: 'PIZZA', fg: '#ffffff', bg: '#2a6a3a', f: WEST, goods: 'cafe' },
  { t: 'BURGERS', fg: '#ffd23d', bg: '#c8202a', f: DISPLAY, goods: 'cafe' }, { t: 'BICYCLES', fg: '#ffffff', bg: '#2a2a30', f: SANS, goods: 'shop' },
  { t: 'TAQUERÍA', fg: '#ffd23d', bg: '#c8202a', f: WEST, goods: 'taqueria' }, { t: 'PANADERÍA', fg: '#7a1a3a', bg: '#ffd8e8', f: WEST, goods: 'pandulce' },
  { t: 'FRUTERÍA', fg: '#ffffff', bg: '#2a9a4a', f: SANS, goods: 'fruit' }, { t: 'CARNICERÍA', fg: '#ffffff', bg: '#a8201a', f: SANS, goods: 'grocery' },
  { t: 'BOTÁNICA', fg: '#ffd23d', bg: '#3a1a5a', f: SERIF, goods: 'botanica' }, { t: 'PUPUSERÍA', fg: '#1a3a8a', bg: '#f4f0e0', f: WEST, goods: 'taqueria' },
  { t: 'MERCADO', fg: '#ffffff', bg: '#e86a1a', f: SANS, goods: 'grocery' }, { t: 'JOYERÍA', fg: '#f0c860', bg: '#1a1a24', f: SERIF, goods: 'jewel' },
  { t: 'PALETERÍA', fg: '#ff3d9a', bg: '#e8fff4', f: GROOVY, goods: 'icecream' }, { t: 'MARISCOS', fg: '#ffffff', bg: '#1a8ab0', f: WEST, goods: 'seafood' },
  { t: 'LIBRERÍA', fg: '#f0d890', bg: '#2a4a2a', f: SERIF, goods: 'books' }, { t: 'TORTILLERÍA', fg: '#7a3a10', bg: '#ffe8a0', f: WEST, goods: 'pandulce' },
].map((s, i) => ({ ...s, i }));
const bySigns = (...names) => SIGNS.filter((s) => names.includes(s.t));
export const VIC_SIGNS = bySigns('COFFEE', 'SOURDOUGH', 'BOOKS', 'FLOWERS', 'WINE BAR', 'DELI', 'GALLERY', 'HARDWARE', 'MARKET', 'BOUTIQUE', 'PIZZA', 'BICYCLES', 'ICE CREAM', 'CHOCOLATE');
export const HAIGHT_SIGNS = bySigns('RECORDS', 'VINTAGE', 'TIE-DYE', 'POSTERS', 'BOOKS', 'COFFEE', 'ICE CREAM', 'BEADS', 'BOUTIQUE', 'BURGERS', 'GIFTS', 'PIZZA');
export const MISSION_SIGNS = bySigns('TAQUERÍA', 'PANADERÍA', 'FRUTERÍA', 'CARNICERÍA', 'BOTÁNICA', 'PUPUSERÍA', 'MERCADO', 'JOYERÍA', 'PALETERÍA', 'MARISCOS', 'LIBRERÍA', 'TORTILLERÍA', 'COFFEE', 'RECORDS', 'BOOKS');
export const DOWNTOWN_SIGNS = bySigns('COFFEE', 'FLOWERS', 'JEWELRY', 'GIFTS', 'DELI', 'WINE BAR', 'CHOCOLATE', 'BOUTIQUE', 'BOOKS', 'BURGERS', 'MARKET');
export const WHARF_SIGNS = bySigns('SEAFOOD', 'CLAM CHOWDER', 'SOURDOUGH', 'GIFTS', 'CHOCOLATE', 'ICE CREAM', 'BURGERS', 'COFFEE', 'GALLERY');
function signAtlas() {
  const cw = 512, ch = 112, cols = 2, rows = Math.ceil(SIGNS.length / cols);
  const tex = canvasTex(cw * cols, ch * rows, (g) => SIGNS.forEach((s) => {
    const x = (s.i % cols) * cw, y = Math.floor(s.i / cols) * ch;
    g.fillStyle = s.bg; g.fillRect(x, y, cw, ch);
    g.strokeStyle = s.fg; g.globalAlpha = 0.6; g.lineWidth = 4; g.strokeRect(x + 8, y + 8, cw - 16, ch - 16); g.globalAlpha = 1;
    let px = 70;
    const weight = s.f === SANS ? 700 : 400;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = s.fg;
    do g.font = `${weight} ${px--}px ${s.f}`; while (g.measureText(s.t).width > cw - 48 && px > 18);
    g.fillText(s.t, x + cw / 2, y + ch / 2 + 3);
  }), { repeat: false });
  return { tex, rects: SIGNS.map((s) => ({ u0: (s.i % cols) / cols + 0.002, u1: ((s.i % cols) + 1) / cols - 0.002, v0: 1 - (Math.floor(s.i / cols) + 1) / rows + 0.003, v1: 1 - Math.floor(s.i / cols) / rows - 0.003 })) };
}
// what each kind of shop shows in its window, warm light behind
const GOODS = ['cafe', 'bakery', 'books', 'records', 'vintage', 'flowers', 'wine', 'grocery', 'tiedye', 'gallery', 'icecream', 'jewel', 'shop', 'sweets', 'seafood', 'gifts', 'taqueria', 'pandulce', 'fruit', 'botanica'];
export const GI = Object.fromEntries(GOODS.map((k, i) => [k, i]));
function drawGoods(g, k, w, h) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe6b8'); gr.addColorStop(1, '#f0b870');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const shelf = (y) => { g.fillStyle = '#6a4a2a'; g.fillRect(0, y, w, 4); };
  const dots = (cols, n, r, y0, y1) => { for (let i = 0; i < n; i++) { g.fillStyle = pick(cols); g.beginPath(); g.arc(rand(6, w - 6), rand(y0, y1), r * rand(0.7, 1.2), 0, Math.PI * 2); g.fill(); } };
  const rack = (cols) => { g.fillStyle = '#3a3a3a'; g.fillRect(4, 22, w - 8, 3); for (let x = 8; x < w - 8; x += 9) { g.fillStyle = pick(cols); g.beginPath(); g.moveTo(x, 26); g.lineTo(x + 8, 26); g.lineTo(x + 10, 90); g.lineTo(x - 2, 90); g.fill(); } };
  if (k === 'cafe') { g.fillStyle = 'rgba(80,40,20,0.35)'; for (let i = 0; i < 5; i++) { const x = rand(10, w - 10); g.beginPath(); g.arc(x, h - 40, 9, 0, Math.PI * 2); g.fill(); g.fillRect(x - 10, h - 32, 20, 32); } g.fillStyle = '#2a1a14'; g.fillRect(8, 8, w - 16, 26); g.fillStyle = '#f4f0e0'; for (let i = 0; i < 4; i++) g.fillRect(14, 13 + i * 5, rand(30, w - 30), 2); }
  else if (k === 'bakery') { for (const y of [44, 88]) { shelf(y); for (let x = 12; x < w - 10; x += 24) { g.fillStyle = pick(['#c8843a', '#b06a2a', '#d89a50']); g.beginPath(); g.ellipse(x, y - 10, 11, 9, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#f0d8a8'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 6, y - 14); g.lineTo(x + 6, y - 6); g.stroke(); } } }   // sourdough boules, scored
  else if (k === 'books') { for (const y of [32, 64, 96]) { shelf(y); for (let x = 2; x < w - 4; x += 6) { g.fillStyle = pick(['#7a1a1a', '#1a3a6a', '#2a5a2a', '#c8a040', '#3a2a1a', '#e8dcc0']); g.fillRect(x, y - rand(16, 24), 5, 24); } } }
  else if (k === 'records') { for (let i = 0; i < 12; i++) { const x = 6 + (i % 4) * 30, y = 10 + Math.floor(i / 4) * 32; g.fillStyle = pick(['#e8302a', '#ffd23d', '#2a6ad8', '#1a1a1a', '#f4f0e0', '#8a3ab4', '#3ab46a']); g.fillRect(x, y, 26, 26); g.fillStyle = pick(['#1a1a1a', '#ffffff', '#ff7a2a']); g.beginPath(); g.arc(x + 13, y + 13, rand(4, 9), 0, Math.PI * 2); g.fill(); } }   // album covers in the window
  else if (k === 'vintage') rack(['#c8302a', '#e8c040', '#3a6ab0', '#f4e4d0', '#5a3a2a', '#ff7ab8', '#2a8a6a', '#8a5a3a']);
  else if (k === 'tiedye') { rack(['#ff3d7f', '#ffd23d', '#39d8ff', '#7cff5a', '#b46bff']); for (let i = 0; i < 4; i++) { const x = 16 + i * 30, y = 100; const c = g.createRadialGradient(x, y, 1, x, y, 14); for (let k2 = 0; k2 <= 5; k2++) c.addColorStop(k2 / 5, ['#ff3d7f', '#ffd23d', '#39d8ff', '#7cff5a', '#b46bff', '#ff7a2a'][k2]); g.fillStyle = c; g.beginPath(); g.arc(x, y, 14, 0, Math.PI * 2); g.fill(); } }
  else if (k === 'flowers') { g.fillStyle = '#2a5a2a'; g.fillRect(0, h - 40, w, 40); dots(['#e8205a', '#ff6a9a', '#fff0f4', '#ffd23d', '#c81e3a', '#ff8a3a', '#8a5ad8'], 70, 5, h - 70, h - 20); }
  else if (k === 'wine') { for (const y of [40, 80, 112]) { shelf(y); for (let x = 6; x < w - 6; x += 9) { g.fillStyle = pick(['#2a3a1a', '#4a1a1a', '#1a2a1a', '#c8a050']); g.fillRect(x, y - 26, 6, 26); g.fillRect(x + 2, y - 32, 2, 6); } } }
  else if (k === 'grocery') { for (const y of [28, 58, 88]) { shelf(y); for (let x = 4; x < w - 8; x += 11) { g.fillStyle = pick(['#c8202a', '#2a6ad0', '#f2c230', '#3a9a4a', '#f4f0e8', '#e86a1a']); g.fillRect(x, y - 16, 9, 16); } } }
  else if (k === 'gallery') { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3; i++) { const x = 8 + i * ((w - 16) / 3); g.fillStyle = pick(['#ffd23d', '#ff3d7f', '#39c8e8', '#b46bff']); g.fillRect(x, 20, (w - 40) / 3, 64); g.fillStyle = pick(['#1a1a1a', '#e8302a', '#2a6ad8']); g.beginPath(); g.arc(x + (w - 40) / 6, 52, 12, 0, Math.PI * 2); g.fill(); } }   // psychedelic concert posters
  else if (k === 'icecream') { g.fillStyle = '#f8f4f0'; g.fillRect(0, h - 44, w, 44); for (let x = 8; x < w - 8; x += 20) { g.fillStyle = pick(['#ffd8e8', '#fff4d0', '#8a5a3a', '#c8f0d8', '#ff9ab8', '#f4e8a0']); g.fillRect(x, h - 40, 18, 16); } dots(['#ff9ab8', '#fff4d0', '#8a5a3a', '#c8f0d8'], 8, 9, 20, 50); }
  else if (k === 'jewel') { g.fillStyle = '#1a1420'; g.fillRect(0, 0, w, h); for (let i = 0; i < 30; i++) { g.fillStyle = pick(['#ffe080', '#ffffff', '#ff8aa0', '#a0d8ff', '#39d8a0']); g.beginPath(); g.arc(rand(6, w - 6), rand(h * 0.3, h - 10), rand(1.5, 3.5), 0, Math.PI * 2); g.fill(); } }
  else if (k === 'sweets') { for (const y of [56, 104]) { shelf(y); for (let x = 12; x < w - 12; x += 26) { g.fillStyle = pick(['#5a2a14', '#8a4a2a', '#c8a050', '#e8302a']); g.fillRect(x - 10, y - 20, 20, 20); g.fillStyle = '#f0c860'; g.fillRect(x - 10, y - 13, 20, 3); } } }
  else if (k === 'seafood') { g.fillStyle = '#dfe8f0'; g.fillRect(0, h - 50, w, 50); for (let i = 0; i < 8; i++) { const x = rand(12, w - 12), y = rand(h - 42, h - 12); g.fillStyle = '#e8502a'; g.beginPath(); g.ellipse(x, y, 11, 7, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#c83a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 10, y - 2); g.lineTo(x - 16, y - 8); g.moveTo(x + 10, y - 2); g.lineTo(x + 16, y - 8); g.stroke(); } }   // crabs on ice
  else if (k === 'gifts') { for (let i = 0; i < 9; i++) { const x = rand(8, w - 30), y = rand(h * 0.4, h - 26), c = pick(['#c8202a', '#2a8a4a', '#f2c230', '#2a5ab0']); g.fillStyle = c; g.fillRect(x, y, 24, 24); g.fillStyle = '#ffd23d'; g.fillRect(x + 10, y, 4, 24); g.fillRect(x, y + 10, 24, 4); } g.fillStyle = '#c8302a'; g.fillRect(10, 10, 34, 26); g.fillStyle = '#e8e8ec'; g.fillRect(52, 10, 34, 26); }   // hoodies for the tourists who came in shorts
  else if (k === 'taqueria') { g.fillStyle = '#2a1a14'; g.fillRect(6, 6, w - 12, 44); g.fillStyle = '#ffd23d'; for (let i = 0; i < 5; i++) g.fillRect(12, 12 + i * 7, rand(40, w - 30), 3); for (let x = 0; x < w; x += 16) { g.fillStyle = pick(PAPEL); g.fillRect(x + 2, 54, 12, 12); } g.fillStyle = 'rgba(80,40,20,0.35)'; for (let i = 0; i < 4; i++) { const x = rand(10, w - 10); g.beginPath(); g.arc(x, h - 30, 8, 0, Math.PI * 2); g.fill(); g.fillRect(x - 9, h - 22, 18, 22); } }
  else if (k === 'pandulce') { for (const y of [44, 88]) { shelf(y); for (let x = 12; x < w - 10; x += 22) { g.fillStyle = pick(['#ff9ab8', '#f4e0a0', '#8a5a3a', '#ffd8a0']); g.beginPath(); g.arc(x, y - 9, 9, Math.PI, 0); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 6, y - 12); g.lineTo(x + 6, y - 12); g.stroke(); } } }   // conchas
  else if (k === 'fruit') { for (const y of [50, 100]) { g.fillStyle = '#8a6a3a'; g.fillRect(0, y - 4, w, 8); dots(['#e8201a', '#ffa01a', '#ffd23d', '#6ab43a', '#f2e070', '#ff5a2a'], 24, 6, y - 24, y - 8); } }
  else if (k === 'botanica') { g.fillStyle = '#2a1a2a'; g.fillRect(0, 0, w, h); for (let x = 8; x < w - 8; x += 13) for (const y of [40, 86]) { g.fillStyle = pick(['#e8302a', '#ffd23d', '#2a6ad8', '#f4f0e0', '#3ab46a', '#b46bff']); g.fillRect(x, y - 26, 9, 26); g.fillStyle = '#ffe080'; g.beginPath(); g.arc(x + 4.5, y - 30, 3, 0, Math.PI * 2); g.fill(); } }   // tall saints' candles
  else { for (const y of [40, 86]) { shelf(y); dots(['#2a2a30', '#8a2a2a', '#3a5a8a', '#c8a070', '#f4f0e8'], 16, 6, y - 16, y - 6); } }
}
function goodsAtlas() {
  const cw = 128, ch = 112, cols = 4, rows = Math.ceil(GOODS.length / cols);
  const tex = canvasTex(cw * cols, ch * rows, (g) => GOODS.forEach((k, i) => { g.save(); g.translate((i % cols) * cw, Math.floor(i / cols) * ch); g.beginPath(); g.rect(0, 0, cw, ch); g.clip(); drawGoods(g, k, cw, ch); g.restore(); }), { repeat: false });
  return { tex, rects: GOODS.map((_, i) => ({ u0: (i % cols) / cols + 0.003, u1: ((i % cols) + 1) / cols - 0.003, v0: 1 - (Math.floor(i / cols) + 1) / rows + 0.004, v1: 1 - Math.floor(i / cols) / rows - 0.004 })) };
}
// the city's street plates: white with black letters, the hundred-block on the end
export const STREETS = [['HAIGHT ST', '1500'], ['ASHBURY ST', '700'], ['VALENCIA ST', '800'], ['MISSION ST', '2400'], ['MARKET ST', '400'], ['POWELL ST', '100'],
  ['HYDE ST', '1200'], ['LOMBARD ST', '1000'], ['CASTRO ST', '400'], ['DOLORES ST', '300'], ['DIVISADERO ST', '1100'], ['FILLMORE ST', '1900'], ['STEINER ST', '700'],
  ['CALIFORNIA ST', '1100'], ['LEAVENWORTH ST', '2200'], ['COLUMBUS AVE', '600'], ['GRANT AVE', '900'], ['FRANCISCO ST', '800'], ['GREEN ST', '2100'], ['FELL ST', '1300'],
  ['GUERRERO ST', '700'], ['UNION ST', '1800'], ['FILBERT ST', '1000'], ['JACKSON ST', '2400']];
function streetAtlas() {
  const cw = 320, ch = 72;
  const tex = canvasTex(cw, ch * STREETS.length, (g) => STREETS.forEach(([st, no], i) => {
    const y = i * ch;
    g.fillStyle = '#f6f6f2'; g.fillRect(0, y, cw, ch);
    g.strokeStyle = '#1a1a1a'; g.lineWidth = 3; g.strokeRect(4, y + 4, cw - 8, ch - 8);
    g.fillStyle = '#141414'; g.textBaseline = 'middle';
    g.textAlign = 'right'; g.font = `500 22px ${SANS}`; g.fillText(no, cw - 14, y + ch / 2 + 1);
    g.textAlign = 'left'; let px = 44; do g.font = `500 ${px--}px ${SANS}`; while (g.measureText(st).width > cw - 100 && px > 14);
    g.fillText(st, 14, y + ch / 2 + 2);
  }), { repeat: false });
  return { tex, rects: STREETS.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / STREETS.length + 0.003, v1: 1 - i / STREETS.length - 0.003 })) };
}
// boards for kiosks, stands and carts
export const KIOSKS = [['NEWS', '#1a4a2a', '#f4f0e0'], ['FLOWERS', '#fff4f8', '#d81e5a'], ['ELOTES', '#ffd23d', '#a8201a'], ['MANGOS', '#ff8a1a', '#ffffff'], ['PALETAS', '#39c8e8', '#ffffff'],
  ['HOT DOGS', '#c8202a', '#ffd23d'], ['TACOS', '#2a8a4a', '#ffffff'], ['CRAB', '#1a5a8a', '#ffffff'], ['CHOWDER', '#f4ecd8', '#1a3a5a'], ['COFFEE', '#3a2418', '#f4e4c4'],
  ['TOURS', '#ffd23d', '#141414'], ['TICKETS', '#c8302a', '#ffffff'], ['ICE CREAM', '#fff0f4', '#c8306a'], ['SOURDOUGH', '#f4e4c0', '#5a2a10']];
function kioskAtlas() {
  const cw = 256, ch = 64;
  const tex = canvasTex(cw, ch * KIOSKS.length, (g) => KIOSKS.forEach(([t, bg, fg], i) => {
    const y = i * ch;
    g.fillStyle = bg; g.fillRect(0, y, cw, ch);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    let px = 44; do g.font = `400 ${px--}px ${WEST}`; while (g.measureText(t).width > cw - 20 && px > 12);
    g.fillText(t, cw / 2, y + ch / 2 + 2);
  }), { repeat: false });
  return { tex, rects: KIOSKS.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / KIOSKS.length + 0.004, v1: 1 - i / KIOSKS.length - 0.004 })) };
}
export const KI = Object.fromEntries(KIOSKS.map(([t], i) => [t, i]));

// ---------- palettes ----------
const SKIN = ['#f0d0b4', '#e8c4a4', '#d8a888', '#c08a68', '#8a5a3a', '#6a4028', '#f4dcc4', '#b07850'];
const HAIR = ['#2a1e16', '#4a3424', '#6a5038', '#c8a878', '#1a1410', '#8a8a88', '#a85a2a', '#e8d090'];
const LAYERS = ['#2a3448', '#3a3a40', '#5a4a3a', '#6a7a5a', '#8a2a2a', '#c8a070', '#2a4a6a', '#1a1a1e', '#e8e4dc', '#7a5a8a', '#d8602a', '#3a6a5a', '#4a5a6a'];   // fog layers: jackets, fleeces, sweaters
const HOODIES = ['#c8302a', '#f2c230', '#2a5ab0', '#e8e8ec', '#1a1a1e', '#ff8a3a', '#3ab4a0'];   // the tourists' new hoodies
export const TIEDYE = ['#ff3d7f', '#ffd23d', '#39d8ff', '#7cff5a', '#b46bff', '#ff7a2a'];
const LEGS = ['#2a3a5a', '#3a4a6a', '#1a1c24', '#5a5040', '#8a7a5a', '#2a2a30', '#4a5a7a'];
const CARS = ['#c8ccd2', '#e8e8ea', '#1a1c20', '#2a3a5a', '#8a1a1a', '#5a5e66', '#3a5a4a', '#d8c8a0', '#2a5a8a', '#f2f0ea', '#6a2a2a', '#9aa0a8'];
export const PAINTED = ['#a8c4e0', '#f2c4cc', '#f4dfa0', '#c4e0c0', '#dcc8ec', '#f6eadc', '#b4d8d0', '#f2c0a0', '#d4bca0', '#9ab0c8', '#e8a898', '#f4f2ea', '#5a7a9a', '#7a4a5a', '#4a6a5a', '#9a4a42', '#e8d070', '#c8a8d8'];
export const TRIM = ['#fbf8f0', '#f6efe0', '#fff8e8', '#ece8e0'];
export const ACCENT = ['#c8902a', '#7a2a3a', '#2a5a6a', '#2a3a5a', '#3a5a3a', '#a83a2a', '#5a3a6a', '#d8b048', '#1a1a20'];
export const PSYCHE = ['#8a3ab4', '#ff7a2a', '#2ab4a0', '#e83a6a', '#f2c230', '#3a7ad8', '#6ab43a', '#d8402a', '#b45ad8', '#ff5aa0'];
export const STUCCO = ['#f4ecdc', '#f0dcc0', '#e8d0b0', '#f6f0e4', '#dcd4c4', '#f2d8c8', '#e4e0d0', '#d8c8b0'];
const ROOFS = ['#4a4a52', '#3a3a40', '#5a4a44', '#6a3a32', '#2e3a44'];
const BONNET = ['#2a5ab0', '#c8302a', '#1a1a1e', '#e8c030'];   // the fire hydrants' tops

export function makeKit() {
  const K = {};
  K.face = face;
  // ---------- materials ----------
  const pave = pavementTex();
  K.sideMat = std({ map: pave, roughness: 0.85 }); K.sideMat.map = pave.clone(); K.sideMat.map.repeat.set(2, 23); K.sideMat.map.needsUpdate = true;   // the track's side strips
  K.paveMat = std({ map: pave, roughness: 0.85 });
  K.roadMat = std({ map: asphaltTex(), roughness: 0.9 });
  K.sidingMat = std({ map: sidingTex(), vertexColors: true, roughness: 0.8 });
  K.shingleMat = std({ map: shingleTex(), vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });
  const bt = brickTex();
  K.brickMat = std({ map: bt, vertexColors: true, roughness: 0.85 });
  const tiledP = new Map(), tiledB = new Map();
  K.tiledPlane = (w, d, k) => { const key = `${w.toFixed(2)}|${d.toFixed(2)}|${k}`; if (!tiledP.has(key)) tiledP.set(key, planeUV({ u0: 0, u1: w / k, v0: 0, v1: d / k })); return tiledP.get(key); };
  K.tiledBox = (w, h, d, k = 2) => { const key = `${w.toFixed(1)}|${h.toFixed(1)}|${d.toFixed(1)}|${k}`; if (!tiledB.has(key)) tiledB.set(key, tiledBox(+w.toFixed(1), +h.toFixed(1), +d.toFixed(1), k)); return tiledB.get(key); };
  K.pave = (b, x, z, w, d, y = 0.03) => b.add(K.tiledPlane(w, d, 3.5), K.paveMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0);
  K.road = (b, x, z, w, d, y = 0.035) => b.add(K.tiledPlane(w, d, 6), K.roadMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0);
  K.lawn = (b, x, z, w, d, col = '#5a7a3a', y = 0.04) => b.add(G.plane, VC.solid, x, y, z, w, d, 1, -Math.PI / 2, 0, 0, col);
  const sg = signAtlas();
  K.signRects = sg.rects; K.signMat = basic({ map: sg.tex, color: hdr('#ffffff', 0.92) });
  const gd = goodsAtlas();
  K.goodsRects = gd.rects; K.goodsMat = basic({ map: gd.tex, color: hdr('#ffffff', 1.0) });
  const st = streetAtlas();
  K.streetRects = st.rects; K.streetMat = basic({ map: st.tex, color: hdr('#ffffff', 0.85), side: THREE.DoubleSide });
  const ks = kioskAtlas();
  K.kioskRects = ks.rects; K.kioskMat = basic({ map: ks.tex, color: hdr('#ffffff', 1.0), side: THREE.DoubleSide });
  const mu = muralAtlas();
  K.muralRects = mu.rects; K.muralMat = std({ map: mu.tex, roughness: 0.85, emissive: '#ffffff', emissiveMap: mu.tex, emissiveIntensity: 0.12 });
  const pp = papelAtlas();
  K.papelRects = pp.rects; K.papelMat = std({ map: pp.tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9, emissive: '#ffffff', emissiveMap: pp.tex, emissiveIntensity: 0.35 });
  K.sailMat = std({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide });
  K.poolMat = basic({ map: canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { repeat: false }),
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  K.pool = (b, x, z, w, d, col, y = 0.06) => b.add(G.plane, K.poolMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0, col);   // lamplight on the ground
  K.water = waterMat('#34506a', 8);
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
  // builds fn(temp) on its own and sets it into b through the matrix m (for things that lean with a slope)
  K.place = (b, fn, m) => { const t = new Batcher(); fn(t); for (const [mat, list] of t.buckets) for (const g of list) b.addM(g, mat, m, null); };
  // the style the icons are built with in the streets: lit materials, the colours of the evening
  K.S = {
    lo: false, wall: VC.solid, glow: VC.glow, metal: VC.metal, dark: VC.solid, roof: VC.solid, glass: VC.metal, steel: VC.metal, paint: VC.solid, bronze: VC.metal, light: VC.glow,
    cWall: '#efe8dc', cTrim: '#fbf8f2', cWin: hdr('#ffd890', 1.3), cDark: '#1a1a20', cRed: hdr('#ff2a1a', 2.6), cOrange: '#c0402e', cSteel: '#8a9098', cGold: '#d8b048', cGlass: '#3a4a64',
  };

  // ---------- trees ----------
  const SY = sydneyTreeKit(), PT = parkTreeKit({ plane: ['#4a7a3a', '#5a8a44', '#3e6e34', '#6a9a4a', '#527e3c'] }), SFT = sfTreeKit();
  K.palm = SY.palm; K.gum = SY.gum; K.plane = PT.planeTree; K.cypress = SFT.cypress;
  K.streetTree = (b, x, z, s = rand(0.42, 0.55)) => {   // a young plane in its tree well
    b.box(VC.solid, '#5a4a3a', x, 0.04, z, 1.2, 0.04, 1.2);
    K.plane(b, x, z, s);
  };
  K.hydrangea = (b, x, z, { y = 0, n = 5, col = pick(['#8aa8f0', '#c898e0', '#f0a0c8', '#a8c8ff']) } = {}) => {   // a hydrangea bush: dark leaves, big round heads
    b.add(G.sphLow, VC.solid, x, y + 0.45, z, 1.3, 0.9, 1.3, 0, rand(0, 3), 0, '#2a4a2a');
    for (let k = 0; k < n; k++) { const r = rand(0.34, 0.48); b.add(G.sphLow, VC.solid, x + rand(-0.55, 0.55), y + rand(0.7, 1.0), z + rand(-0.55, 0.55), r, r, r, 0, 0, 0, shade(col, rand(0.85, 1.1))); }
  };
  K.shrub = (b, x, z, { y = 0, s = rand(0.7, 1.1), col = pick(['#2a4a2a', '#3a5a32', '#2e5a3a']) } = {}) => b.add(G.sphLow, VC.solid, x, y + 0.4 * s, z, 1.2 * s, 0.9 * s, 1.2 * s, 0, rand(0, 3), 0, col);
  K.fanPalm = (b, x, z, s = 1, { y = 0 } = {}) => {   // a Mexican fan palm: a tall thin trunk, the skirt of dead fronds, a small round head of fans (about 2.2·s across)
    const H = y + rand(11, 14.5) * s;
    b.add(G.cyl8, VC.solid, x, (y + H) / 2, z, 0.5 * s, H - y, 0.5 * s, 0, 0, 0, '#8a7a66');
    b.add(G.cyl8, VC.solid, x, y + 0.5 * s, z, 0.8 * s, 1.0 * s, 0.8 * s, 0, 0, 0, '#7a6a58');   // its swollen foot
    b.add(G.cone8, VC.solid, x, H - 1.2 * s, z, 1.7 * s, 2.6 * s, 1.7 * s, Math.PI, 0, 0, '#9a8058');   // the skirt of dead fronds
    const n = 10, a0 = rand(0, Math.PI * 2);
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * Math.PI * 2 + rand(-0.15, 0.15), up = k % 3 === 0 ? rand(-0.35, -0.1) : rand(0.15, 0.6), r = 1.05 * s;
      b.add(G.sphLow, VC.solid, x + Math.cos(a) * r, H + 0.15 * s + Math.sin(up) * r * 0.5, z + Math.sin(a) * r, 2.2 * s, 0.14 * s, 1.5 * s, 0, -a, up, pick(['#3a6a34', '#46783a', '#2f5c30', '#527e40']));
    }
    b.add(G.sphLow, VC.solid, x, H + 0.3 * s, z, 1.0 * s, 0.9 * s, 1.0 * s, 0, 0, 0, '#3a6a34');   // the heart of the head
    return H;
  };

  // ---------- people and animals ----------
  K.person = (b, x, z, { s = rand(0.92, 1.06), y = 0, top = null, legs = null, hat = null, ry = null, seated = false, bag = chance(0.2), phone = chance(0.14), kid = false, hippie = false, camera = false, shorts = false } = {}) => {
    const a = ry ?? rand(-0.5, 0.5) + (chance(0.5) ? Math.PI : 0), ca = Math.cos(a), sa = Math.sin(a), skin = pick(SKIN);
    const P = (fx, fy, fz) => [x + fx * ca + fz * sa, y + fy, z - fx * sa + fz * ca];
    if (kid) s *= 0.62;
    const c = top || (hippie ? pick(TIEDYE) : camera ? pick(HOODIES) : pick(LAYERS)), lg = legs || (hippie ? pick(['#3a5a8a', '#5a7aaa', '#8a6a4a']) : pick(LEGS));
    const hk = hat || (hippie ? pick(['flowers', 'flowers', 'band', 'long']) : kid ? pick(['none', 'cap']) : pick(['none', 'none', 'none', 'beanie', 'cap', 'hood', 'long']));
    if (seated) {
      for (const e of [-1, 1]) { b.add(G.box, VC.solid, ...P(e * 0.09 * s, 0.5 * s, -0.18 * s), 0.15 * s, 0.14 * s, 0.42 * s, 0, a, 0, lg); b.add(G.box, VC.solid, ...P(e * 0.09 * s, 0.24 * s, -0.36 * s), 0.13 * s, 0.48 * s, 0.14 * s, 0, a, 0, shorts ? skin : lg); }
      b.add(G.box, VC.solid, ...P(0, 0.9 * s, 0.02), 0.46 * s, 0.62 * s, 0.28 * s, 0, a, 0, c);
    } else {
      for (const e of [-1, 1]) {
        b.add(G.box, VC.solid, ...P(e * 0.085 * s, 0.6 * s, 0), 0.15 * s, 0.42 * s, 0.18 * s, 0, a, 0, lg);
        b.add(G.box, VC.solid, ...P(e * 0.085 * s, 0.2 * s, 0), (hippie ? 0.2 : 0.14) * s, 0.4 * s, (hippie ? 0.22 : 0.17) * s, 0, a, 0, shorts ? skin : lg);   // bell-bottoms flare at the ankle
      }
      b.add(G.box, VC.solid, ...P(0, 0.04 * s, -0.04), 0.38 * s, 0.08 * s, 0.3 * s, 0, a, 0, pick(['#1a1a1a', '#e8e8e8', '#5a3a2a']));
      b.add(G.box, VC.solid, ...P(0, 1.1 * s, 0), 0.46 * s, 0.62 * s, 0.28 * s, 0, a, 0, c);
      if (hippie) { for (const e of [-1, 1]) b.add(G.box, VC.solid, ...P(e * 0.17 * s, 1.08 * s, 0.01), 0.14 * s, 0.6 * s, 0.31 * s, 0, a, 0, pick(['#8a5a2a', '#a8703a', '#6a4a2a'])); }   // a fringed suede vest
      else if (chance(0.3)) b.add(G.box, VC.solid, ...P(0, 1.1 * s, 0), 0.47 * s, 0.2 * s, 0.29 * s, 0, a, 0, shade(c, 0.7));
    }
    const hy = seated ? 1.36 : 1.62;
    b.add(G.sphLow, VC.solid, ...P(0, hy * s, 0), 0.28 * s, 0.32 * s, 0.28 * s, 0, a, 0, skin);
    const hc = pick(HAIR);
    if (hk === 'beanie') b.add(G.sphLow, VC.solid, ...P(0, (hy + 0.09) * s, 0), 0.3 * s, 0.24 * s, 0.3 * s, 0, a, 0, pick(['#1a1a1e', '#c8302a', '#2a4a6a', '#e8c030', '#5a5a5a']));
    else if (hk === 'cap') { b.add(G.box, VC.solid, ...P(0, (hy + 0.13) * s, 0), 0.3 * s, 0.1 * s, 0.3 * s, 0, a, 0, pick(['#c8302a', '#1a1a1e', '#2a4a8a', '#f2c230'])); b.add(G.box, VC.solid, ...P(0, (hy + 0.1) * s, -0.2 * s), 0.24 * s, 0.03 * s, 0.16 * s, 0, a, 0, '#1a1a1e'); }
    else if (hk === 'hood') b.add(G.sphLow, VC.solid, ...P(0, (hy + 0.04) * s, 0.04), 0.36 * s, 0.38 * s, 0.36 * s, 0, a, 0, c);
    else if (hk === 'long' || hk === 'flowers' || hk === 'band') {   // long hair, parted in the middle
      b.add(G.box, VC.solid, ...P(0, (hy + 0.1) * s, 0.02), 0.31 * s, 0.14 * s, 0.31 * s, 0, a, 0, hc);
      b.add(G.box, VC.solid, ...P(0, (hy - 0.16) * s, 0.08 * s), 0.32 * s, 0.46 * s, 0.14 * s, 0, a, 0, hc);
      if (hk === 'flowers') for (let k = 0; k < 6; k++) { const t = (k / 6) * Math.PI * 2; b.sph(VC.solid, k % 2 ? '#ffffff' : pick(['#ff5a8a', '#ffd23d', '#ff8a2a', '#8ac8ff']), ...P(Math.cos(t) * 0.15 * s, (hy + 0.15) * s, Math.sin(t) * 0.15 * s), 0.045 * s, true); }
      if (hk === 'band') b.add(G.box, VC.solid, ...P(0, (hy + 0.06) * s, 0), 0.32 * s, 0.05 * s, 0.32 * s, 0, a, 0, pick(TIEDYE));
    } else b.add(G.box, VC.solid, ...P(0, (hy + 0.12) * s, 0.025), 0.29 * s, 0.12 * s, 0.29 * s, 0, a, 0, hc);
    if (camera) b.add(G.box, VC.solid, ...P(0, (hy - 0.02) * s, -0.24 * s), 0.18 * s, 0.11 * s, 0.1 * s, 0, a, 0, '#141414');
    else if (phone && !seated) b.box(VC.glow, hdr('#cfe6ff', 1.4), ...P(0.06, 1.2 * s, -0.2 * s), 0.07, 0.12, 0.02);
    if (bag && !seated) b.add(G.box, VC.solid, ...P(0.28 * s, 0.88 * s, 0), 0.1, 0.32, 0.3, 0, a, 0, pick(['#141414', '#c8a070', '#8a2a1a', '#2a3a5a']));
  };
  K.crowd = (b, x0, x1, z0, z1, n, opts = {}) => { for (let i = 0; i < n; i++) K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1), opts); };
  K.throng = (b, x0, x1, z0, z1, n, gaps = [], opts = {}) => {   // a crowd kept out of the given stretches
    for (let i = 0, t = 0; i < n && t < n * 4; t++) { const z = rand(z0, z1); if (gaps.some(([a, c]) => z > a && z < c)) continue; K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -z, opts); i++; }
  };
  K.tourist = (b, x, z, ry) => K.person(b, x, z, { camera: true, ry, shorts: chance(0.4), hat: pick(['cap', 'none', 'hood']) });
  K.dog = (b, x, z, ry = rand(0, Math.PI * 2)) => {   // a dog out on its walk
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + fx * ca + fz * sa, fy, z - fx * sa + fz * ca], c = pick(['#c8a070', '#3a2a1a', '#e8e0d0', '#6a5a4a', '#1a1a1a']);
    b.add(G.sphLow, VC.solid, ...P(0, 0.42, 0), 0.32, 0.3, 0.7, 0, ry, 0, c);
    b.add(G.sphLow, VC.solid, ...P(0, 0.62, -0.38), 0.24, 0.24, 0.3, 0, ry, 0, c);
    for (const [fx, fz] of [[-0.1, -0.22], [0.1, -0.22], [-0.1, 0.22], [0.1, 0.22]]) b.add(G.box, VC.solid, ...P(fx, 0.18, fz), 0.07, 0.36, 0.07, 0, ry, 0, c);
  };
  K.bike = (b, x, z, ry, { y = 0, col = pick(['#c8302a', '#2a2a30', '#2a6ab0', '#e8e8ec', '#3a8a5a']) } = {}) => {   // a bicycle standing (or ridden) along ry
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fz, fy) => [x + fz * sa, y + fy, z + fz * ca];
    for (const e of [-0.52, 0.52]) b.add(G.tor, VC.solid, ...P(e, 0.34), 0.66, 0.66, 0.66, 0, ry + Math.PI / 2, 0, '#1a1a1a');
    beam(b, VC.metal, ...P(-0.52, 0.34), ...P(0.05, 0.62), 0.04, col); beam(b, VC.metal, ...P(0.05, 0.62), ...P(0.5, 0.72), 0.04, col);
    beam(b, VC.metal, ...P(0.52, 0.34), ...P(0.45, 0.85), 0.035, col); beam(b, VC.metal, ...P(-0.52, 0.34), ...P(-0.05, 0.72), 0.035, col);
    b.add(G.box, VC.solid, ...P(-0.1, 0.78), 0.08, 0.04, 0.2, 0, ry, 0, '#1a1a1a');
  };
  K.cyclist = (b, x, z, ry) => { K.bike(b, x, z, ry); K.person(b, x, z + 0.05 * Math.cos(ry), { y: 0.22, ry: ry + Math.PI, bag: false, phone: false, hat: 'cap', s: 0.95 }); };

  // ---------- cars ----------
  K.car = (b, x, z, dir = pick([-1, 1]), { col = pick(CARS), len = rand(4.1, 4.7), lit = chance(0.15), y = 0 } = {}) => {   // a parked car; lit: headlamps on, someone about to pull out
    const w = 1.78;
    b.block(VC.solid, col, x, y + 0.28, z, w, 0.62, len);
    b.block(VC.solid, col, x, y + 0.9, z + dir * 0.12, w - 0.14, 0.52, len * 0.52);
    b.box(VC.glow, hdr('#3a4a5e', 0.9), x, y + 1.14, z + dir * 0.12, w - 0.1, 0.3, len * 0.5);
    for (const dz of [-len * 0.33, len * 0.33]) for (const e of [-1, 1]) b.cyl(VC.solid, '#141414', x + e * (w / 2 - 0.08), y + 0.3, z + dz, 0.3, 0.22, 'cyl8', 0, Math.PI / 2);
    for (const e of [-1, 1]) { b.box(VC.glow, hdr('#ff2a2a', lit ? 1.6 : 0.6), x + e * 0.62, y + 0.66, z + dir * (len / 2 + 0.01), 0.3, 0.14, 0.04); b.box(VC.glow, hdr('#fff4d0', lit ? 2.2 : 0.35), x + e * 0.6, y + 0.62, z - dir * (len / 2 + 0.01), 0.3, 0.14, 0.04); }
  };
  K.muniBus = (b, x, z, dir = 1) => {   // a Muni trolley bus: silver and white, the red stripe low down, its two poles up to the wires
    b.block(VC.solid, '#e8eaec', x, 0.32, z, 2.55, 2.9, 12);
    b.box(VC.solid, '#c8202a', x, 0.72, z, 2.57, 0.5, 12);
    for (const e of [-1, 1]) { b.box(VC.glow, hdr('#2a3446', 1), x + e * 1.28, 2.0, z, 0.03, 1.1, 10.6); b.box(VC.glow, hdr('#fff0d0', 0.7), x + e * 1.285, 2.0, z + rand(-3, 3), 0.03, 1.0, 3.2); }
    b.box(VC.glow, hdr('#2a3446', 1), x, 2.0, z - dir * 6.01, 2.3, 1.4, 0.03);
    b.box(VC.glow, hdr('#ffb02a', 1.8), x, 2.95, z - dir * 6.02, 1.6, 0.26, 0.03);
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#fff4d0', 1.6), x + e * 0.9, 0.7, z - dir * 6.02, 0.3, 0.16, 0.03);
    for (const dz of [-4, 3.8]) for (const e of [-1, 1]) b.cyl(VC.solid, '#141414', x + e * 1.15, 0.5, z + dz, 0.5, 0.36, 'cyl8', 0, Math.PI / 2);
    b.box(VC.metal, '#8a9098', x, 3.32, z + dir * 1.5, 1.6, 0.25, 3);
    const wx = x > 0 ? x - 0.2 : x + 0.2;   // the poles reach the wires over the parking lane
    for (const dx of [-0.3, 0.3]) beam(b, VC.metal, x + dx, 3.4, z + dir * 3, wx + dx, 5.92, z - dir * 2.5, 0.04, '#2a2a2e');
  };
  K.vwBus = (b, x, z, dir = pick([-1, 1])) => {   // a split-window bus painted with flowers and peace signs
    const col = pick(['#ff7a2a', '#39b8d8', '#e8c030', '#e8506a', '#6ab43a']);
    b.block(VC.solid, col, x, 0.32, z, 1.75, 1.0, 4.3);
    b.block(VC.solid, '#f4f0e4', x, 1.32, z, 1.7, 0.85, 4.3);
    b.box(VC.solid, '#f4f0e4', x, 2.2, z, 1.6, 0.06, 4.0);
    for (const e of [-1, 1]) for (let k = 0; k < 4; k++) b.box(VC.glow, hdr('#3a4a5e', 0.9), x + e * 0.86, 1.55, z - 1.45 + k * 0.95, 0.03, 0.42, 0.75);
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#3a4a5e', 0.9), x + e * 0.38, 1.55, z - dir * 2.16, 0.68, 0.45, 0.03);
    b.add(G.cone4, VC.solid, x, 0.95, z - dir * 2.16, 1.1, 0.75, 0.04, 0, 0, Math.PI, '#f4f0e4');   // the V on its nose
    for (let k = 0; k < 14; k++) { const e = pick([-1, 1]), fz = z + rand(-1.9, 1.9), fy = rand(0.5, 1.5), c = pick(['#ffffff', '#ff3d7f', '#ffd23d', '#39d8ff', '#7cff5a']); b.add(G.cyl8, VC.solid, x + e * 0.885, fy, fz, rand(0.16, 0.34), 0.02, rand(0.16, 0.34), 0, 0, Math.PI / 2, c); }
    for (const dz of [-1.45, 1.45]) for (const e of [-1, 1]) b.cyl(VC.solid, '#141414', x + e * 0.78, 0.33, z + dz, 0.33, 0.2, 'cyl8', 0, Math.PI / 2);
  };
  K.lowrider = (b, x, z, dir = pick([-1, 1]), { up = chance(0.25) } = {}) => {   // a long, low candy-painted cruiser on wire wheels; some sit with the nose up on the hydraulics
    const col = pick(['#c8104a', '#2a3ab4', '#7a1ab4', '#0a8a8a', '#e8a018', '#1a1a1e', '#d82a8a']);
    K.place(b, (t) => {
      t.block(VC.metal, col, 0, 0.26, 0, 1.92, 0.56, 5.5);
      t.block(VC.metal, col, 0, 0.82, dir * 0.3, 1.8, 0.44, 2.4);
      t.box(VC.glow, hdr('#2a3446', 0.9), 0, 1.02, dir * 0.3, 1.82, 0.26, 2.3);
      t.box(VC.metal, '#e8eaec', 0, 0.3, -dir * 2.76, 1.9, 0.14, 0.06);
      for (const dz of [-1.8, 1.8]) for (const e of [-1, 1]) { t.cyl(VC.solid, '#f4f4f0', e * 0.88, 0.3, dz, 0.3, 0.2, 'cyl', 0, Math.PI / 2); t.cyl(VC.metal, '#e8eaec', e * 0.99, 0.3, dz, 0.2, 0.02, 'cyl', 0, Math.PI / 2); }
      for (const e of [-1, 1]) t.box(VC.glow, hdr('#fff4d0', 0.5), e * 0.7, 0.42, -dir * 2.76, 0.3, 0.12, 0.04);
    }, new THREE.Matrix4().makeRotationX(up ? dir * 0.12 : 0).setPosition(x, up ? 0.32 : 0, z));
  };
  K.carRow = (b, x, z0, z1, { gaps = [], dir = null, n = 99, p = 0.75, kinds = null } = {}) => {   // cars parked nose to tail along the kerb lane
    let k = 0;
    for (let z = z0 + rand(0, 3); z < z1 - 2.5 && k < n; z += rand(5.4, 7.5)) {
      if (gaps.some(([a, c]) => z + 2.5 > a && z - 2.5 < c) || !chance(p)) continue;
      (kinds ? pick(kinds) : K.car)(b, x, -z, dir ?? pick([-1, 1]));
      k++;
    }
  };

  // ---------- street furniture ----------
  K.lamp = (b, x, z, side, { h = 8.4, reach = 2.7, col = '#ffe6b8', k = 2.2, pool = 0.1 } = {}) => {   // a grey-green pole, its curved mast arm out over the parking lane, the head lit
    b.cyl(VC.metal, '#5a6460', x, h / 2, z, 0.09, h, 'cyl8');
    b.cyl(VC.metal, '#5a6460', x, 0.4, z, 0.16, 0.8, 'cyl8');
    const ex = x - side * reach;
    beam(b, VC.metal, x, h - 0.5, z, x - side * reach * 0.5, h + 0.15, z, 0.07, '#5a6460');
    beam(b, VC.metal, x - side * reach * 0.5, h + 0.15, z, ex, h + 0.05, z, 0.07, '#5a6460');
    b.add(G.box, VC.metal, ex, h - 0.05, z, 0.95, 0.2, 0.42, 0, 0, side * 0.05, '#6a7470');
    b.box(VC.glow, hdr(col, k), ex, h - 0.17, z, 0.8, 0.05, 0.32);
    if (pool) K.pool(b, ex, z, 7, 7, hdr(col, pool));
  };
  K.pathOfGold = (b, x, z, side) => {   // Market Street's Path of Gold: a bronze base of tritons, a fluted shaft, three lamps on top
    b.cyl(VC.metal, '#5a4a30', x, 0.5, z, 0.42, 1.0, 'cyl8');
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.5; b.add(G.box, VC.metal, x + Math.cos(a) * 0.36, 1.1, z + Math.sin(a) * 0.36, 0.18, 0.9, 0.22, 0.2, -a, 0, '#6a5838'); }   // the tritons
    b.cyl(VC.metal, '#4a3e28', x, 1.6, z, 0.3, 0.4, 'cyl8');
    b.cyl(VC.metal, '#4a3e28', x, 4.6, z, 0.12, 6.0, 'cyl8');
    b.cyl(VC.metal, '#5a4a30', x, 7.6, z, 0.2, 0.3, 'cyl8');
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.3, lx = x + Math.cos(a) * 0.5, lz = z + Math.sin(a) * 0.5; beam(b, VC.metal, x, 7.6, z, lx, 7.9, lz, 0.05, '#4a3e28'); b.sph(VC.glow, hdr('#ffd890', 2.0), lx, 8.15, lz, 0.26, true); }
    b.sph(VC.glow, hdr('#ffd890', 2.2), x, 8.5, z, 0.3, true);
    K.pool(b, x - side * 0.6, z, 6, 6, hdr('#ffd890', 0.12));
  };
  K.hydrant = (b, x, z, col = pick(BONNET)) => {   // the city's fire hydrants: a white body, its bonnet painted by the system it draws on
    b.cyl(VC.solid, '#f2f0ea', x, 0.36, z, 0.17, 0.72, 'cyl8');
    b.cyl(VC.solid, col, x, 0.78, z, 0.15, 0.14, 'cyl8');
    b.sph(VC.solid, col, x, 0.86, z, 0.1, true);
    for (const e of [-1, 1]) b.cyl(VC.solid, '#f2f0ea', x + e * 0.2, 0.45, z, 0.07, 0.16, 'cyl8', 0, Math.PI / 2);
  };
  K.wires = (b, x, z0, z1, side) => {   // Muni's trolley wires over the parking lane, hung from bracket arms on poles at the kerb
    for (const dx of [0, 0.6]) b.box(VC.metal, '#1a1a1e', x + side * dx, 5.92, -(z0 + z1) / 2, 0.03, 0.03, z1 - z0);
    for (let z = z0 + 6; z < z1; z += 28) {
      b.cyl(VC.metal, '#4a4e46', x + side * 2.0, 3.6, -z, 0.12, 7.2, 'cyl8'); beam(b, VC.metal, x + side * 2.0, 6.7, -z, x - side * 0.2, 6.1, -z, 0.04, '#4a4e46');
      for (const dx of [0, 0.6]) { const ya = 6.1 + ((dx + 0.2) / 2.2) * 0.6; b.box(VC.metal, '#1a1a1e', x + side * dx, (5.92 + ya) / 2, -z, 0.03, ya - 5.92, 0.03); }   // the hangers
    }
  };
  K.streetSign = (b, x, z, side, i = randi(0, STREETS.length - 1), j = randi(0, STREETS.length - 1)) => {   // a corner pole: the cross street's plate across the view, the street's own along it
    b.cyl(VC.metal, '#4a4e46', x, 1.6, z, 0.05, 3.2, 'cyl6');
    b.add(planeUV(K.streetRects[i]), K.streetMat, x, 3.2, z, 1.5, 0.34, 1, 0, 0, 0);
    b.add(planeUV(K.streetRects[j]), K.streetMat, x, 3.62, z, 1.5, 0.34, 1, 0, face(side), 0);
  };
  K.stop = (b, x, z, side) => {   // the four-way stop on every corner: the red octagon, ALL WAY under it
    b.cyl(VC.metal, '#4a4e46', x, 1.2, z, 0.04, 2.4, 'cyl6');
    b.add(OCT8, VC.solid, x, 2.6, z - 0.03, 0.76, 0.76, 0.04, 0, 0, 0, '#c8202a');
    b.add(G.plane, K.label('STOP', { w: 128, h: 64, font: SANS, weight: 700, size: 0.7, k: 1.2 }), x, 2.6, z + 0.0, 0.56, 0.28, 1, 0, 0, 0);
    b.add(G.plane, K.label('ALL WAY', { w: 128, h: 48, color: '#ffffff', bg: '#c8202a', font: SANS, weight: 700, size: 0.6, k: 1.0 }), x, 2.06, z, 0.5, 0.18, 1, 0, 0, 0);
  };
  K.bench = (b, x, z, side, { people = chance(0.35) } = {}) => {
    b.box(VC.solid, '#5a4a3a', x, 0.45, z, 0.5, 0.08, 1.8); b.box(VC.solid, '#5a4a3a', x + side * 0.24, 0.75, z, 0.06, 0.45, 1.8);
    for (const e of [-1, 1]) b.box(VC.metal, '#2a2e2a', x, 0.22, z + e * 0.75, 0.5, 0.44, 0.06);
    if (people) K.person(b, x - side * 0.05, z + rand(-0.5, 0.5), { seated: true, ry: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
  };
  K.bin = (b, x, z) => { b.block(VC.solid, '#2a4a3a', x, 0, z, 0.62, 1.15, 0.62); b.box(VC.solid, '#1e3a2c', x, 1.2, z, 0.66, 0.1, 0.66); };
  K.newsstand = (b, x, z, side) => {   // a green newsstand at the kerb, the papers racked in front, its board on top
    const fx = x - side * 0.9;
    b.block(VC.solid, '#2a4a32', x, 0, z, 1.8, 2.3, 2.6);
    b.box(VC.glow, hdr('#fff0d0', 0.9), fx - side * 0.01, 1.4, z, 0.04, 1.0, 2.1);
    for (let k = 0; k < 6; k++) b.add(G.box, VC.solid, fx - side * 0.12, 0.6 + (k % 2) * 0.3, z - 1.0 + Math.floor(k / 2) * 0.7, 0.04, 0.32, 0.5, 0, 0, side * 0.3, pick(['#f4f0e8', '#e8e0d0', '#f2c230', '#c8302a']));
    b.add(planeUV(K.kioskRects[KI.NEWS]), K.kioskMat, fx - side * 0.03, 2.05, z, 2.2, 0.55, 1, 0, face(side), 0);
    b.box(VC.solid, '#1e3a24', x, 2.36, z, 2.0, 0.12, 2.8);
  };
  K.flowerStand = (b, x, z, side) => {   // buckets of flowers on tiered steps under a striped awning
    for (let k = 0; k < 3; k++) {
      b.block(VC.solid, '#5a4030', x + side * k * 0.4, 0, z, 0.4, 0.4 + k * 0.35, 2.6);
      for (let j = 0; j < 6; j++) { const fz = z - 1.1 + j * 0.44, fy = 0.4 + k * 0.35; b.cyl(VC.solid, '#3a4a5a', x + side * k * 0.4, fy + 0.15, fz, 0.13, 0.3, 'cyl6'); b.add(G.sphLow, VC.solid, x + side * k * 0.4, fy + 0.45, fz, 0.38, 0.3, 0.38, 0, 0, 0, pick(['#e8205a', '#ffd23d', '#ff8a3a', '#f4f0f4', '#c84aa8', '#ff6a9a', '#8a5ad8'])); }
    }
    b.add(G.box, VC.solid, x + side * 0.6, 2.5, z, 2.2, 0.06, 3.0, 0, 0, side * -0.25, '#2a6a4a');
    for (const e of [-1, 1]) b.cyl(VC.metal, '#3a3a3a', x - side * 0.4, 1.2, z + e * 1.4, 0.03, 2.4, 'cyl6');
    b.add(planeUV(K.kioskRects[KI.FLOWERS]), K.kioskMat, x - side * 0.45, 2.3, z, 1.8, 0.45, 1, 0, face(side), 0);
    K.person(b, x + side * 1.4, z + rand(-0.8, 0.8), { ry: side < 0 ? -Math.PI / 2 : Math.PI / 2, top: '#5a6a4a' });
  };
  K.cart = (b, x, z, side, kind = pick(['ELOTES', 'MANGOS', 'PALETAS', 'HOT DOGS', 'TACOS', 'COFFEE'])) => {   // a street cart under its umbrella, the vendor beside it
    b.block(VC.solid, kind === 'PALETAS' ? '#f4f4f0' : '#c8ccd2', x, 0.3, z, 0.9, 0.8, 1.6);
    for (const e of [-1, 1]) b.cyl(VC.solid, '#1a1a1a', x + e * 0.4, 0.22, z + 0.5, 0.2, 0.08, 'cyl8', 0, Math.PI / 2);
    b.add(planeUV(K.kioskRects[KI[kind]]), K.kioskMat, x - side * 0.46, 0.75, z, 1.4, 0.35, 1, 0, face(side), 0);
    if (kind === 'MANGOS') for (let k = 0; k < 6; k++) b.add(G.sphLow, VC.solid, x + rand(-0.25, 0.25), 1.3, z + rand(-0.6, 0.6), 0.14, 0.24, 0.14, 0, 0, 0, '#ffa01a');
    else if (kind === 'ELOTES') for (let k = 0; k < 5; k++) b.add(G.cyl8, VC.solid, x + rand(-0.2, 0.2), 1.25, z + rand(-0.6, 0.6), 0.1, 0.32, 0.1, 0, 0, rand(-0.5, 0.5), '#f2d050');
    b.cyl(VC.metal, '#8a8a8a', x, 1.6, z, 0.025, 2.0, 'cyl6');
    b.add(G.cone8, VC.solid, x, 2.75, z, 2.2, 0.5, 2.2, 0, 0, 0, pick(['#e8302a', '#2a8ad8', '#ffd23d', '#2a9a4a', '#ff7a2a']));
    K.person(b, x + side * 0.85, z + rand(-0.4, 0.4), { ry: side < 0 ? -Math.PI / 2 : Math.PI / 2, hat: pick(['cap', 'none']) });
  };
  K.parklet = (b, x, z, side, { len = 9 } = {}) => {   // a parklet: a wooden deck built out over two parking spaces, planters round it, café tables, people
    b.block(VC.solid, '#a8784a', x, 0, z, 2.4, 0.2, len);
    for (let k = 0; k <= Math.round(len / 0.3); k++) b.box(VC.solid, '#8a603a', x, 0.205, z - len / 2 + k * 0.3, 2.38, 0.005, 0.03);
    for (const e of [-1, 1]) { b.block(VC.solid, '#6a4a2a', x, 0.2, z + e * (len / 2 - 0.25), 2.4, 0.6, 0.5); K.shrub(b, x, z + e * (len / 2 - 0.25), { y: 0.8, s: 0.6 }); }
    b.block(VC.solid, '#6a4a2a', x - side * 1.0, 0.2, z, 0.4, 0.6, len - 1);
    for (let k = 0; k < len - 1; k += 1.4) b.add(G.sphLow, VC.solid, x - side * 1.0, 1.0, z - len / 2 + 1 + k, 0.5, 0.4, 0.5, 0, 0, 0, pick(['#3a6a3a', '#4a7a3a', '#e8508a']));
    for (let k = 0; k < 3; k++) {
      const tz = z - len / 2 + 2 + k * ((len - 4) / 2);
      b.cyl(VC.metal, '#2a2a2a', x + side * 0.3, 0.6, tz, 0.04, 0.8, 'cyl6'); b.cyl(VC.solid, '#f4f0e8', x + side * 0.3, 1.0, tz, 0.35, 0.04, 'cyl8');
      if (chance(0.7)) K.person(b, x + side * 0.85, tz, { seated: true, y: 0.2, ry: side < 0 ? Math.PI / 2 : -Math.PI / 2 });
    }
  };
  K.bikeDock = (b, x, z, n = randi(4, 8)) => {   // a row of shared bikes in their dock
    b.box(VC.metal, '#3a3e44', x, 0.05, z - (n * 0.75) / 2, 0.3, 0.1, n * 0.75 + 0.4);
    for (let k = 0; k < n; k++) K.bike(b, x, z - k * 0.75, Math.PI / 2, { col: '#2a2a2e' });
  };

  // ---------- the street's cross-section ----------
  // the parking lane (road over the track's side strip), the kerb, the pavement out to x1
  K.kerbLane = (b, s, { z0 = 0, z1 = CHUNK_LEN, x1 = EDGE + 7 } = {}) => {
    K.road(b, s * (EDGE + KERB) / 2, -(z0 + z1) / 2, KERB - EDGE, z1 - z0, 0.032);
    b.box(VC.solid, '#a8a49c', s * (KERB + 0.06), 0.08, -(z0 + z1) / 2, 0.14, 0.16, z1 - z0);
    if (x1 > EDGE + 7) K.pave(b, s * (EDGE + 7 + x1) / 2, -(z0 + z1) / 2, x1 - EDGE - 7, z1 - z0);
  };

  // ---------- houses ----------
  // One Victorian, built in its own frame: local x along the street, z out of the front toward the track, y up. The front
  // stands at s·xf, centred at distance zc along the street, w wide and d deep; base lifts it (a terrace).
  // style: 'italianate' (slanted bay, bracketed cornice), 'stick' (square bay, cornice with a little pediment), 'queen'
  // (a gable over the bay, fish-scale shingles, sometimes a turret). shop: the ground floor is a shopfront, the flats over it.
  const prisms = new Map();
  const prism = (w, h, d) => {   // a gable roof: a triangle w wide and h high standing on y = 0, running back from z = 0 to z = -d
    const key = `${w.toFixed(1)}|${h.toFixed(1)}|${d.toFixed(1)}`;
    if (!prisms.has(key)) { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d); prisms.set(key, g); }
    return prisms.get(key);
  };
  const gables = new Map();
  const gableFace = (w, h) => {   // the gable's front, its UVs in metres for the shingles
    const key = `${w.toFixed(1)}|${h.toFixed(1)}`;
    if (!gables.has(key)) { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.closePath(); const g = new THREE.ShapeGeometry(sh); const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 0.9, p.getY(i) / 0.9); gables.set(key, g); }
    return gables.get(key);
  };
  const glass = (lit, sunny) => (chance(lit) ? hdr(pick(WARM), rand(0.85, 1.25)) : sunny && chance(0.45) ? hdr(pick(['#ffb878', '#ffc890', '#ffa868']), rand(0.75, 1.0)) : hdr(pick(['#2a3448', '#34405a', '#3a4a66', '#283040']), 1));
  // a window in the frame F at (x, y) on the plane z, w × h, its frame and its hood in the trim colour
  const win = (F, x, y, z, w, h, trim, g, { hood = true, ry = 0, nx = 0, nz = 1 } = {}) => {
    F.add(G.box, VC.solid, x, y, z, w + 0.24, h + 0.26, 0.06, 0, ry, 0, trim);
    F.add(G.box, VC.glow, x + nx * 0.035, y, z + nz * 0.035, w, h, 0.04, 0, ry, 0, g);
    F.add(G.box, VC.solid, x + nx * 0.04, y, z + nz * 0.04, w, 0.06, 0.05, 0, ry, 0, trim);   // the meeting rail of the sashes
    if (hood) F.add(G.box, VC.solid, x + nx * 0.08, y + h / 2 + 0.2, z + nz * 0.08, w + 0.42, 0.16, 0.18, 0, ry, 0, trim);
  };
  K.house = (b, s, xf, zc, { w = 7.6, d = rand(11, 14), floors = randi(2, 3), style = pick(['italianate', 'italianate', 'stick', 'queen', 'queen']), col = pick(PAINTED), trim = pick(TRIM), acc = pick(ACCENT),
    base = 0, yd = xf - EDGE - 7, garage = chance(0.45), shop = null, lit = 0.42, turret = null, yard = true, flip = false, foot = 2, stoop = true } = {}) => {
    const F = frame(b, s * xf, base, zc, 1, face(s)), sunny = s > 0;
    const deep = yd >= 2.8;   // a front garden deep enough for a full stoop (otherwise a few steps up to a garden flat)
    const G0 = shop ? 3.8 : deep ? 2.3 : 0.75, FH = 3.4, top = G0 + floors * FH, hw = w / 2;
    if (turret === null) turret = style === 'queen' && floors > 1 && chance(0.3);
    if (!deep) garage = false;
    // the body in clapboard, carried down below the ground so it never shows a gap on a slope or a terrace
    F.addM(K.tiledBox(w, top + foot, d, 2), K.sidingMat, new THREE.Matrix4().makeTranslation(0, (top - foot) / 2, -d / 2), col);
    for (const e of [-1, 1]) F.box(VC.solid, trim, e * (hw - 0.12), (G0 + top) / 2, 0.06, 0.24, top - G0, 0.12);   // corner boards
    // the bay: on the left half of the front
    const mx = flip ? -1 : 1, bx = mx * (-hw + 2.15), bp = style === 'stick' ? 0.8 : 0.85, ba = 1.9, by0 = G0 + 0.1, by1 = top - (style === 'queen' ? 0.2 : 0.6);
    if (style === 'stick') {
      F.box(VC.solid, col, bx, (by0 + by1) / 2, bp / 2, 3.4, by1 - by0, bp);
      for (let f = 0; f < floors; f++) { const y = G0 + f * FH + 1.75; for (const dx of [-1.05, 0, 1.05]) win(F, bx + dx, y, bp + 0.03, 0.78, 2.0, trim, glass(lit, sunny), { hood: dx === 0 }); }
      for (let e = -1; e <= 1; e += 2) F.box(VC.solid, trim, bx + e * 1.7, (by0 + by1) / 2, bp + 0.02, 0.14, by1 - by0, 0.08);
      F.box(VC.solid, trim, bx, by1 + 0.12, bp / 2 + 0.05, 3.7, 0.26, bp + 0.2);
      F.box(VC.solid, acc, bx, by0 - 0.1, bp / 2, 3.3, 0.3, bp);
    } else {
      F.box(VC.solid, col, bx, (by0 + by1) / 2, bp, ba, by1 - by0, 0.14);
      for (const e of [-1, 1]) F.add(G.box, VC.solid, bx + e * (ba / 2 + bp / 2), (by0 + by1) / 2, bp / 2, bp * Math.SQRT2, by1 - by0, 0.14, 0, e * Math.PI / 4, 0, col);
      for (let f = 0; f < floors; f++) {
        const y = G0 + f * FH + 1.75;
        win(F, bx, y, bp + 0.08, 0.95, 2.05, trim, glass(lit, sunny));
        for (const e of [-1, 1]) { const nx = e / Math.SQRT2, nz = 1 / Math.SQRT2; win(F, bx + e * (ba / 2 + bp / 2) + nx * 0.08, y, bp / 2 + nz * 0.08, 0.55, 2.05, trim, glass(lit, sunny), { hood: false, ry: e * Math.PI / 4, nx, nz }); }
        if (f) F.box(VC.solid, trim, bx, G0 + f * FH, bp / 2 + 0.06, ba + 2 * bp + 0.1, 0.2, bp + 0.16);   // the band between the floors
      }
      F.box(VC.solid, trim, bx, by1 + 0.14, bp / 2 + 0.06, ba + 2 * bp + 0.4, 0.28, bp + 0.3);
      F.box(VC.solid, acc, bx, by0 - 0.1, bp / 2, ba + 2 * bp - 0.2, 0.3, bp);
    }
    // the right half: the door (up its stoop) and a window over it on every floor (a turret takes the upper floors' corner)
    const dx = mx * (hw - 1.75);
    for (let f = shop ? 1 : 0; f < (turret ? 1 : floors); f++) win(F, dx, G0 + f * FH + 1.75, 0.05, 0.9, 2.0, trim, glass(lit, sunny));
    if (shop) {   // the shopfront: the window of goods, the door, the board over it
      const sign = pick(shop), L = w - 1.8;
      F.add(planeUV(K.goodsRects[GI[sign.goods]]), K.goodsMat, -mx * 0.55, 1.65, 0.07, L - 1.4, 2.4, 1, 0, 0, 0);
      F.box(VC.solid, acc, -mx * 0.55, 1.65, 0.04, L - 1.2, 2.6, 0.06);
      F.box(VC.solid, '#2a2420', mx * (hw - 0.85), 1.25, 0.05, 1.0, 2.5, 0.06);
      F.box(VC.glow, hdr(pick(WARM), 0.8), mx * (hw - 0.85), 2.75, 0.07, 0.9, 0.4, 0.04);
      F.add(planeUV(K.signRects[sign.i]), K.signMat, 0, 3.3, 0.12, Math.min(w - 0.6, 5.6), (Math.min(w - 0.6, 5.6) * 112) / 512, 1, 0, 0, 0);
      F.box(VC.solid, trim, 0, 3.75, 0.2, w, 0.2, 0.4);
      if (chance(0.5)) F.add(G.box, VC.solid, -mx * 0.55, 2.95, 0.6, L - 1.0, 0.05, 1.3, -0.28, 0, 0, pick(['#c8302a', '#2a6a4a', '#2a3a6a', '#e8c030', '#7a2a3a']));   // an awning
      K.pool(b, s * (xf - 1.6), zc, 3, w - 1, hdr('#ffd9a0', 0.09));
    } else {
      F.box(VC.solid, '#1e1a18', dx, G0 + 1.3, 0.02, 1.5, 2.6, 0.06);   // the recessed doorway
      F.box(VC.solid, acc, dx, G0 + 1.15, 0.04, 1.0, 2.3, 0.06);
      F.box(VC.glow, hdr(pick(WARM), 0.9), dx, G0 + 2.45, 0.05, 1.0, 0.32, 0.04);   // the transom
      F.box(VC.solid, trim, dx, G0 + 2.85, 0.35, 1.9, 0.18, 0.7);   // the hood over the door on its brackets
      for (const e of [-1, 1]) F.box(VC.solid, trim, dx + e * 0.85, G0 + 2.55, 0.25, 0.12, 0.45, 0.5);
      if (style === 'italianate' && deep) for (const e of [-1, 1]) F.cyl(VC.solid, trim, dx + e * 0.85, G0 + 1.2, 0.3, 0.09, 2.4, 'cyl8');   // porch columns
      if (garage) {   // the garage cut in under the bay, its apron of concrete across the garden
        F.box(VC.solid, shade(col, 0.9), bx, G0 / 2, 0.04, 3.0, G0 - 0.05, 0.08);
        const door = pick(['#f4f2ee', acc, '#8a8a88']);
        F.box(VC.solid, door, bx, (G0 - 0.25) / 2, 0.09, 2.6, G0 - 0.35, 0.04);
        for (let k = 1; k < 4; k++) F.box(VC.solid, shade(door, 0.75), bx, (k * (G0 - 0.35)) / 4, 0.115, 2.6, 0.03, 0.02);
        if (yard) F.add(G.plane, K.paveMat, bx, 0.035, yd / 2, 3.0, yd, 1, -Math.PI / 2, 0, 0);
      } else if (deep) for (const e of [-1, 1]) F.box(VC.glow, glass(lit * 0.5, sunny), bx + e * 0.8, G0 * 0.5, 0.05, 0.8, 0.6, 0.04);   // the basement's little windows
      // the stoop: steps from the pavement to the door, the railings either side
      const n = Math.max(3, Math.round(G0 / 0.19)), L = Math.min(3.15, yd - 0.1), run = L / n;
      if (stoop && L > 0.3) {
        for (let k = 1; k <= n; k++) F.box(VC.solid, k === n ? trim : '#d8d4cc', dx, (k * G0) / n / 2 - 0.02, (n - k + 0.5) * run, 1.5, (k * G0) / n + 0.04, run);
        if (deep) for (const e of [-1, 1]) {
          F.beam(VC.solid, trim, [dx + e * 0.78, 1.0, L - 0.05], [dx + e * 0.78, G0 + 1.0, 0.1], 0.07);
          F.box(VC.solid, trim, dx + e * 0.78, 0.55, L - 0.05, 0.18, 1.1, 0.18);
          for (let k = 1; k < n; k += 2) F.box(VC.solid, trim, dx + e * 0.78, (k * G0) / n + 0.45, (n - k) * run, 0.04, 0.9, 0.04);
        }
      }
      if (yard && deep && !garage) {   // the little front garden: a low iron fence, a hydrangea or two
        const fx0 = Math.min(mx * (-hw + 0.1), dx - mx * 0.85), fx1 = Math.max(mx * (-hw + 0.1), dx - mx * 0.85);
        F.add(G.plane, VC.solid, (fx0 + fx1) / 2, 0.04, yd / 2, fx1 - fx0, yd, 1, -Math.PI / 2, 0, 0, '#5a7a3a');
        F.box(VC.metal, '#1a1c1e', (fx0 + fx1) / 2, 0.95, yd - 0.08, fx1 - fx0, 0.04, 0.04);
        for (let x = fx0; x <= fx1 + 0.01; x += 0.5) F.box(VC.metal, '#1a1c1e', x, 0.48, yd - 0.08, 0.03, 0.96, 0.03);
        if (chance(0.75)) K.hydrangea(F, bx + rand(-0.8, 0.8), yd / 2);
      }
    }
    // the top
    if (style === 'queen') {   // a gable over the front, shingled, its attic window; the roof running back
      const gh = 3.4;
      F.addM(prism(w + 0.5, gh, d + 0.3), VC.solid, new THREE.Matrix4().makeTranslation(0, top, 0.25), pick(ROOFS));
      F.addM(gableFace(w - 0.1, gh - 0.25), K.shingleMat, new THREE.Matrix4().makeTranslation(0, top + 0.02, 0.28), pick([acc, col, trim]));
      for (const e of [-1, 1]) F.add(G.box, VC.solid, e * (w / 4 + 0.06), top + gh / 2 + 0.05, 0.34, Math.hypot(w / 2 + 0.25, gh) + 0.2, 0.22, 0.14, 0, 0, -e * Math.atan2(gh, w / 2 + 0.25), trim);   // the bargeboards
      win(F, 0, top + 1.25, 0.32, 0.8, 1.1, trim, glass(lit * 0.7, sunny), { hood: false });
      F.box(VC.solid, trim, 0, top + 0.08, 0.3, w + 0.5, 0.26, 0.5);
      if (turret) {   // a round turret on the corner over the door, on its corbel, under a witch's-hat roof
        const tx = mx * (hw - 1.3), r = 1.2, ty0 = G0 + FH, ty1 = top + 1.2;
        F.cyl(VC.solid, col, tx, (ty0 + ty1) / 2, 0.5, r, ty1 - ty0, 'cyl');
        F.add(G.cone8, VC.solid, tx, ty0 - 0.45, 0.5, r * 2, 0.9, r * 2, Math.PI, 0, 0, trim);
        for (let f = 1; f < floors; f++) for (const a of [-0.7, 0, 0.7]) F.add(G.box, VC.glow, tx + Math.sin(a) * (r + 0.02), G0 + f * FH + 1.7, 0.5 + Math.cos(a) * (r + 0.02), 0.5, 1.8, 0.04, 0, a, 0, glass(lit, sunny));
        F.add(G.cone, VC.solid, tx, ty1 + 1.9, 0.5, r * 2.5, 3.8, r * 2.5, 0, 0, 0, pick(ROOFS));
        F.cyl(VC.solid, trim, tx, ty1 + 0.1, 0.5, r + 0.15, 0.25, 'cyl');
        F.cyl(VC.metal, '#c8a050', tx, ty1 + 4.2, 0.5, 0.05, 1.0, 'cyl6');
      }
      return { top: top + gh, door: zc + s * dx };
    }
    // a flat roof behind a bracketed cornice, the frieze under it; a stick house's little pediment on top
    F.box(VC.solid, acc, 0, top - 0.45, 0.07, w, 0.7, 0.14);
    F.box(VC.solid, trim, 0, top + 0.4, 0.3, w + 0.4, 0.5, 0.75);
    for (let x = -hw + 0.4; x <= hw - 0.3; x += 0.85) F.box(VC.solid, trim, x, top - 0.15, 0.3, 0.16, 0.6, 0.55);
    F.box(VC.solid, shade(col, 0.95), 0, top + 0.95, -d / 2, w, 0.6, d);
    if (style === 'stick' && chance(0.7)) F.addM(prism(w * 0.55, 1.1, 0.4), VC.solid, new THREE.Matrix4().makeTranslation(0, top + 0.65, 0.3), trim);
    return { top: top + 1.3, door: zc + s * dx };
  };
  // a row of houses along one side, each on its lot (gaps: stretches to leave empty); returns the lots
  K.houseRow = (b, s, z0, z1, { x0 = X0, colors = PAINTED, accents = ACCENT, styles = null, shopP = 0, signs = VIC_SIGNS, base = 0, floors = [2, 3], lit = 0.42, garageP = 0.45, gaps = [], opts = {} } = {}) => {
    const lots = [];
    for (let z = z0 + rand(0, 0.6); z < z1 - 5.5;) {
      const w = Math.min(pick([7.6, 7.6, 7.6, 6.4, 8.4]), z1 - z);
      if (gaps.some(([a, c]) => z + w > a && z < c)) { z += 1; continue; }
      const shop = chance(shopP) ? signs : null, bz = typeof base === 'function' ? base(z, w) : base;
      const h = K.house(b, s, x0 + rand(0, 0.2), -(z + w / 2), { w, col: pick(colors), acc: pick(accents), style: styles ? pick(styles) : undefined, shop, base: bz, floors: randi(floors[0], floors[1]), lit, garage: !shop && chance(garageP), flip: chance(0.3), ...opts });
      lots.push({ z0: z, z1: z + w, shop: !!shop, base: bz, door: -h.door });
      z += w + rand(0.02, 0.15);
    }
    return lots;
  };
  // The uphill side of a street along a hill: each lot raised on its own terrace, its retaining wall stepping up and
  // down the street, a flight of steps climbing along the wall's face to the garden; the houses' stoops go on from there.
  K.terraceRow = (b, s, z0, z1, { gaps = [] } = {}) => {
    let hh = rand(1.0, 2.6);
    const lots = K.houseRow(b, s, z0, z1, { x0: X0, gaps, garageP: 0, base: () => (hh = Math.min(3.8, Math.max(0.9, hh + rand(-0.9, 1.1)))) });
    for (const L of lots) {
      const zc = -(L.z0 + L.z1) / 2, w = L.z1 - L.z0, h = L.base, wall = pick(['#b8b0a2', '#a8a296', '#c4bca8']);
      b.block(VC.solid, wall, s * (EDGE + 7 + 1.6), -0.5, zc, 3.2, h + 0.5, w + 0.02);   // the terrace, its face the retaining wall
      b.box(VC.solid, shade(wall, 1.08), s * (EDGE + 7.1), h + 0.08, zc, 0.36, 0.16, w + 0.04);
      const n = Math.max(3, Math.ceil(h / 0.19)), run = 0.27, dir = Math.sign(-zc - L.door) || 1, zt = L.door;   // the steps run away from the door along the wall
      if (n * run > w - 1.2) continue;
      for (let k = 1; k <= n; k++) b.block(VC.solid, '#c8c2b4', s * (EDGE + 6.55), 0, -(zt + dir * (n - k + 0.5) * run), 0.9, (k * h) / n, run + 0.01);
      beam(b, VC.metal, s * (EDGE + 6.12), 0.95, -(zt + dir * n * run), s * (EDGE + 6.12), h + 0.95, -zt, 0.05, '#2a2c2e');
    }
    return lots;
  };
  K.mural = (b, x, y, z, side, w, h, i = randi(0, 5)) => b.add(planeUV(K.muralRects[i]), K.muralMat, x - side * 0.03, y, z, w, h, 1, 0, face(side), 0);
  K.papel = (b, x0, x1, y, z, { sag = 0.6, step = 0.42, size = 0.34 } = {}) => {   // a string of papel picado between two points across the view (x0 → x1 at distance z)
    const n = Math.max(2, Math.round(Math.abs(x1 - x0) / step));
    beam(b, VC.solid, x0, y, z, (x0 + x1) / 2, y - sag, z, 0.015, '#f4f0e8'); beam(b, VC.solid, (x0 + x1) / 2, y - sag, z, x1, y, z, 0.015, '#f4f0e8');
    for (let k = 1; k < n; k++) { const t = k / n, x = x0 + (x1 - x0) * t, yy = y - sag * 4 * t * (1 - t); b.add(planeUV(pick(K.papelRects)), K.papelMat, x, yy - size * 0.62, z, size, size * 1.25, 1, 0, rand(-0.25, 0.25), rand(-0.1, 0.1)); }
  };
  K.papelZ = (b, x, y, z0, z1, { sag = 0.5, step = 0.42, size = 0.34, to = null } = {}) => {   // a string of papel picado running along the street at x, from distance z0 to z1, its ends tied back to the fronts at x = to
    const n = Math.max(2, Math.round(Math.abs(z1 - z0) / step));
    for (let k = 1; k < n; k++) { const t = k / n, z = z0 + (z1 - z0) * t, yy = y - sag * 4 * t * (1 - t); b.add(planeUV(pick(K.papelRects)), K.papelMat, x, yy - size * 0.62, -z, size, size * 1.25, 1, 0, Math.PI / 2 + rand(-0.25, 0.25), rand(-0.1, 0.1)); }
    beam(b, VC.solid, x, y, -z0, x, y - sag, -(z0 + z1) / 2, 0.015, '#f4f0e8'); beam(b, VC.solid, x, y - sag, -(z0 + z1) / 2, x, y, -z1, 0.015, '#f4f0e8');
    if (to !== null) for (const z of [z0, z1]) beam(b, VC.solid, x, y, -z, to, y + 0.5, -z, 0.015, '#f4f0e8');
  };

  // ---------- the Mission ----------
  K.muralWall = (b, s, xf, zc, w, { h = rand(5.5, 7.5), col = pick(STUCCO), i = randi(0, 5), shop = null } = {}) => {   // a low stucco building, its whole front painted
    b.block(VC.solid, col, s * (xf + 6), 0, zc, 12, h, w);
    b.box(VC.solid, shade(col, 0.9), s * (xf - 0.1), h + 0.25, zc, 0.5, 0.5, w + 0.1);
    const y0 = shop ? 3.4 : 0.4;
    K.mural(b, s * xf, (y0 + h - 0.2) / 2, zc, s, w - 0.3, h - 0.2 - y0, i);
    if (shop) {
      const sign = pick(shop), L = w - 1.2;
      b.add(planeUV(K.goodsRects[GI[sign.goods]]), K.goodsMat, s * (xf - 0.04), 1.5, zc, L, 2.2, 1, 0, face(s), 0);
      b.add(planeUV(K.signRects[sign.i]), K.signMat, s * (xf - 0.06), 3.05, zc, Math.min(L, 5.2), (Math.min(L, 5.2) * 112) / 512, 1, 0, face(s), 0);
      K.pool(b, s * (xf - 1.5), zc, 3, L, hdr('#ffd9a0', 0.09));
    }
  };
  K.mariachi = (b, x, z, side) => {   // a trio in their charro suits and wide sombreros: guitar, trumpet, violin
    const ry = side < 0 ? -Math.PI / 2 : Math.PI / 2;
    for (let k = 0; k < 3; k++) {
      const pz = z + (k - 1) * 0.8;
      K.person(b, x, pz, { ry, top: '#1a1a1e', legs: '#1a1a1e', hat: 'none', bag: false, phone: false });
      b.add(G.cyl8, VC.solid, x, 1.85, pz, 0.9, 0.06, 0.9, 0, 0, 0, '#2a2420'); b.add(G.cone8, VC.solid, x, 2.0, pz, 0.36, 0.34, 0.36, 0, 0, 0, '#2a2420');
      for (let j = 0; j < 4; j++) b.box(VC.solid, '#e8c060', x + side * 0.235, 1.3 - j * 0.12, pz, 0.01, 0.04, 0.04);
      if (k === 0) b.add(G.sphLow, VC.solid, x - side * 0.3, 1.0, pz, 0.12, 0.42, 0.34, 0, 0, 0, '#c8803a');
      else if (k === 1) b.add(G.cyl8, VC.metal, x - side * 0.4, 1.62, pz, 0.08, 0.4, 0.08, 0, 0, Math.PI / 2 * side, '#e8c060');
      else b.add(G.box, VC.solid, x - side * 0.2, 1.45, pz + 0.15, 0.06, 0.12, 0.42, 0.3, 0, 0, '#8a4a2a');
    }
  };

  // ---------- downtown ----------
  const stoneT = windowTex({ cols: 6, rows: 14, cw: 34, ch: 46, wall: '#f2ece2', glass: '#141a24', lit: ['#ffd9a0', '#ffe6bc', '#ffc27a', '#fff2dc', '#e8f0ff'], litChance: 0.45, frame: '#fbf6ec', ledge: '#ddd2c0' });
  const glassT = windowTex({ cols: 8, rows: 16, cw: 32, ch: 40, wall: '#2e3a4e', glass: '#46587a', lit: ['#cfe6ff', '#ffffff', '#ffe8c0'], litChance: 0.3, band: true });
  const loftT = windowTex({ cols: 5, rows: 6, cw: 40, ch: 56, wall: '#f4ece4', glass: '#181c24', lit: WARM, litChance: 0.5, arch: true, frame: '#f8f4ec', ledge: '#e8dccc' });
  K.stoneMat = facadeMat(stoneT, { k: 0.8 }); K.glassMat = facadeMat(glassT, { k: 0.7, rough: 0.3, metal: 0.5 }); K.loftMat = facadeMat(loftT, { k: 0.8 });
  const towerFront = (b, i, signs) => {   // the ground floor of an office tower: granite, the shops' windows and boards, a canopy at the door
    const s = i.side, L = Math.min(i.len - 2, 9), sign = pick(signs);
    b.box(VC.solid, '#5a5450', i.face - s * 0.2, 2.6, i.z, 0.4, 5.2, i.len);
    b.add(planeUV(K.goodsRects[GI[sign.goods]]), K.goodsMat, i.face - s * 0.43, 2.0, i.z + i.len / 4, L / 2, 2.6, 1, 0, face(s), 0);
    b.add(planeUV(K.signRects[sign.i]), K.signMat, i.face - s * 0.44, 3.75, i.z + i.len / 4, Math.min(L / 2, 4.5), (Math.min(L / 2, 4.5) * 112) / 512, 1, 0, face(s), 0);
    b.box(VC.glow, hdr('#ffe8c8', 0.42), i.face - s * 0.43, 2.2, i.z - i.len / 4, 0.04, 3.4, L / 2);   // the lit lobby behind its mullions
    for (let k = 0; k <= 4; k++) b.box(VC.solid, '#2a2a30', i.face - s * 0.46, 2.2, i.z - i.len / 4 - L / 4 + (k * L) / 8, 0.05, 3.4, 0.12);
    b.box(VC.metal, '#3a3a40', i.face - s * 1.4, 4.6, i.z - i.len / 4, 2.4, 0.18, Math.min(5, L / 2));
    K.pool(b, i.face - s * 1.5, i.z, 3, L, hdr('#ffe6c0', 0.1));
  };
  const towerTop = (b, i) => {   // a cornice, a setback crown lit from below on some, a flagpole
    b.box(VC.solid, shade(i.col, 0.96), i.x, i.h + 0.4, i.z, i.d + 0.6, 0.8, i.len + 0.6);
    if (i.crown && chance(0.6)) {
      const cw = i.len * 0.6, cd = i.d * 0.6, ch = rand(5, 10);
      b.block(VC.solid, i.col, i.x, i.h + 0.8, i.z, cd, ch, cw);
      b.box(VC.glow, hdr(pick(['#ffe8c0', '#ffd890', '#fff4dc']), 1.3), i.x, i.h + 0.9 + ch * 0.5, i.z, cd + 0.1, ch * 0.7, cw + 0.1);
      b.add(G.cone4, VC.solid, i.x, i.h + 0.8 + ch + 1.4, i.z, cd * 1.2, 2.8, cw * 1.2, 0, 0, 0, '#3a6a5a');
    } else if (chance(0.4)) { b.cyl(VC.metal, '#d8dce0', i.x, i.h + 4, i.z, 0.05, 7, 'cyl6'); b.add(G.plane, VC.solid, i.x, i.h + 6.6, i.z + 0.8, 1.5, 0.9, 1, 0, Math.PI / 2, 0, pick(['#c8302a', '#2a4a8a', '#e8c030'])); }
  };
  K.towerRow = (b, s, z0, z1, { x0 = 12.4, signs = DOWNTOWN_SIGNS, gaps = [] } = {}) => {
    for (let z = z0 + rand(0, 2); z < z1 - 8;) {
      const r = Math.random(), len = Math.min(rand(14, 26), z1 - z);
      if (gaps.some(([a, c]) => z + len > a && z < c)) { z += 2; continue; }
      const d = rand(16, 22), cx = s * (x0 + d / 2), cz = -(z + len / 2);
      if (r < 0.18) {   // a Beaux-Arts bank: a temple front of columns under its pediment
        const h = rand(12, 16), col = pick(['#ece4d6', '#e4dccc', '#f0e8da']);
        b.block(VC.solid, col, cx, 0, cz, d, h, len);
        b.block(VC.solid, shade(col, 0.92), s * (x0 - 0.6), 0, cz, 1.2, 1.2, len);
        const nc = Math.max(4, Math.round(len / 3));
        for (let k = 0; k < nc; k++) b.cyl(VC.solid, col, s * (x0 - 0.7), (1.2 + h - 2) / 2 + 0.6, cz - len / 2 + 1.2 + (k * (len - 2.4)) / (nc - 1), 0.42, h - 3, 'cyl8');
        b.box(VC.solid, col, s * (x0 - 0.7), h - 1.2, cz, 1.6, 1.6, len);
        b.addM(prism(len, 2.6, 1.6), VC.solid, new THREE.Matrix4().makeRotationY(face(s)).setPosition(s * (x0 - 1.5), h - 0.4, cz), col);
        b.box(VC.glow, hdr('#ffe6c0', 0.9), s * (x0 - 0.05), 4.0, cz, 0.04, 5.5, len - 3);
      } else {
        const glassy = r > 0.62, h = glassy ? rand(55, 110) : rand(30, 75), col = glassy ? pick(['#ffffff', '#e8f0ff', '#dce8f4']) : pick(['#f2e8d8', '#e8dcc8', '#f4ecdc', '#e0d4c0', '#d8ccb8']);
        b.addM(buildingGeo(d, h, len, glassy ? glassT : stoneT, glassy ? 1.6 : 1.9, glassy ? 3.6 : 3.3), glassy ? K.glassMat : K.stoneMat, at(cx, 0, cz), col);
        const info = { x: cx, z: cz, d, len, h, side: s, face: s * x0, col, crown: !glassy };
        towerFront(b, info, signs); towerTop(b, info);
      }
      z += len + rand(0, 0.6);
    }
  };
  K.muniEntrance = (b, x, z, side) => {   // the stairs down to Muni and BART: the opening in the pavement, its railings, the sign on its post
    b.box(VC.solid, '#14161a', x, 0.05, z, 2.0, 0.02, 5.0);
    for (const e of [-1, 1]) { b.box(VC.metal, '#3a3e44', x + e * 1.05, 0.55, z, 0.06, 1.1, 5.0); b.box(VC.metal, '#3a3e44', x + e * 1.05, 1.1, z, 0.08, 0.06, 5.0); }
    b.box(VC.metal, '#3a3e44', x, 0.55, z + 2.5, 2.1, 1.1, 0.06);
    b.cyl(VC.metal, '#3a3e44', x - side * 1.3, 1.6, z - 2.2, 0.06, 3.2, 'cyl6');
    b.add(G.plane, K.label('MUNI · BART', { w: 512, h: 128, color: '#ffffff', bg: '#1a3a7a', font: SANS, weight: 700, size: 0.5, k: 1.2 }), x - side * 1.3, 3.0, z - 2.2, 1.6, 0.4, 1, 0, 0, 0);
    for (let k = 0; k < 6; k++) b.box(VC.glow, hdr('#e8f0ff', 0.5), x, 0.06, z - 2.2 + k * 0.85, 1.6, 0.01, 0.3);
  };

  // ---------- the waterfront ----------
  K.pierShed = (b, s, xb, z0, z1, { no = randi(1, 40) * 2 + 1 } = {}) => {   // a pier shed: its long roof out over the water, its arched bulkhead front facing the street
    const zc = -(z0 + z1) / 2, L = z1 - z0, D = 140, col = pick(['#ece6d8', '#e4dccc', '#f0e8d8']), x = s * (xb + D / 2);
    b.block(VC.solid, '#d8d2c4', x, -0.6, zc, D, 9.4, L - 1);
    b.add(G.cone4, VC.solid, x, 10.4, zc, D * 1.4, 3, (L - 1) * 1.4, 0, 0, 0, '#7a7e84');
    b.block(VC.solid, col, s * (xb + 0.6), 0, zc, 1.2, 12.5, L);   // the bulkhead front
    const ar = Math.min(5, L * 0.18);
    b.box(VC.solid, '#1e2024', s * (xb - 0.02), 3.2, zc, 0.04, 6.4, ar * 2);
    b.add(G.cyl, VC.solid, s * (xb - 0.02), 6.4, zc, ar * 2, 0.04, ar * 2, 0, 0, Math.PI / 2, '#1e2024');
    b.box(VC.glow, hdr('#ffe0b0', 0.6), s * (xb - 0.03), 2.4, zc, 0.03, 4.4, ar * 1.6);
    for (const e of [-1, 1]) for (const f of [0.55, 0.85]) b.box(VC.solid, shade(col, 1.03), s * (xb - 0.05), 6.2, zc + e * L * f / 2, 0.15, 12.4, 0.8);
    b.box(VC.solid, shade(col, 1.04), s * (xb - 0.1), 12.2, zc, 0.3, 0.6, L + 0.3);
    b.addM(prism(ar * 3.4, 2.4, 0.5), VC.solid, new THREE.Matrix4().makeRotationY(face(s)).setPosition(s * (xb + 0.3), 12.5, zc), col);
    b.add(G.plane, K.label(`PIER ${no}`, { w: 512, h: 128, color: '#2a2a30', font: SERIF, weight: 700, size: 0.7, k: 1.0 }), s * (xb - 0.04), 9.6, zc, ar * 2.6, ar * 0.65, 1, 0, face(s), 0);
  };
  K.quay = (b, s, xb, z0 = 0, z1 = CHUNK_LEN, { gulls = 2 } = {}) => {   // the bulkhead's granite edge and its rail, the bay beyond it
    const zc = -(z0 + z1) / 2, L = z1 - z0;
    b.box(VC.solid, '#a8a094', s * (xb + 0.4), -0.7, zc, 0.8, 1.6, L);
    b.add(G.plane, K.water, s * (xb + 200), -1.25, zc, 400, L, 1, -Math.PI / 2, 0, 0);
    b.box(VC.metal, '#3a4044', s * (xb + 0.2), 1.05, zc, 0.06, 0.06, L);
    for (let z = z0 + 1; z < z1; z += 2.4) b.box(VC.metal, '#3a4044', s * (xb + 0.2), 0.55, -z, 0.07, 1.1, 0.07);
    for (let k = 0; k < gulls; k++) K.gull(b, s * (xb + 0.2), 1.08, -rand(z0 + 2, z1 - 2));
  };
  K.farShore = (b, s, { x = 260, z0 = 0, z1 = CHUNK_LEN } = {}) => {   // across the bay: the East Bay's low hills in the evening sun, houses and their first lights along the shore
    const zc = -(z0 + z1) / 2, L = z1 - z0;
    b.add(G.sphLow, VC.solid, s * (x + 80), -18, zc, 180, 60, L + 60, 0, 0, 0, '#8a8a5e');
    for (let k = 0; k < 18; k++) { const d = rand(-6, 40), y0 = -1.2 + Math.max(0, d) * 0.3; b.block(VC.solid, pick(['#d8c8b0', '#c8b8a0', '#e8dcc8', '#b8a890']), s * (x + d), y0, -rand(z0, z1), rand(5, 10), rand(3, 7), rand(5, 10)); }
    for (let k = 0; k < 24; k++) b.box(VC.glow, hdr(pick(['#ffd9a0', '#fff0d0', '#ffb070']), rand(1.0, 1.6)), s * (x - 4), -0.7, -rand(z0, z1), 0.1, 0.3, rand(0.6, 2));
  };
  const loftRoof = (b, i) => { b.box(VC.solid, shade(i.col, 0.9), i.x, i.h + 0.35, i.z, i.d + 0.3, 0.7, i.len + 0.3); if (chance(0.4)) b.block(VC.solid, '#4a3a30', i.x, i.h + 0.7, i.z + rand(-i.len / 4, i.len / 4), 3, 3.4, 3); };
  K.loftRow = (b, s, z0, z1, { x0 = 11.4, signs = VIC_SIGNS, gaps = [] } = {}) => {   // old brick warehouses turned into offices and shops
    for (let z = z0 + rand(0, 2); z < z1 - 6;) {
      const len = Math.min(rand(16, 30), z1 - z);
      if (gaps.some(([a, c]) => z + len > a && z < c)) { z += 2; continue; }
      const d = rand(14, 20), h = rand(12, 20), cx = s * (x0 + d / 2), cz = -(z + len / 2), col = pick(['#c8826a', '#b8705a', '#d0907a', '#a86a58']);
      b.addM(buildingGeo(d, h, len, loftT, 2.2, 3.6), K.loftMat, at(cx, 0, cz), col);
      const info = { x: cx, z: cz, d, len, h, side: s, face: s * x0, col };
      loftRoof(b, info);
      b.box(VC.solid, shade(col, 0.8), info.face - s * 0.1, 2.0, cz, 0.2, 4, len);
      const sign = pick(signs), L = Math.min(len - 2, 7);
      b.add(planeUV(K.goodsRects[GI[sign.goods]]), K.goodsMat, info.face - s * 0.22, 1.8, cz, L, 2.4, 1, 0, face(s), 0);
      b.add(planeUV(K.signRects[sign.i]), K.signMat, info.face - s * 0.24, 3.4, cz, Math.min(L, 5), (Math.min(L, 5) * 112) / 512, 1, 0, face(s), 0);
      z += len + rand(0.2, 1);
    }
  };
  // A hillside of houses climbing away behind a street (Telegraph Hill over the Embarcadero): stepped terraces of
  // earth and rock, stucco houses packed on each, their windows lit, trees between; the steps are solid down to the ground.
  K.hillside = (b, s, z0, z1, { x0 = 34, x1 = 110, y1 = 46, steps = 6 } = {}) => {
    const zc = -(z0 + z1) / 2, L = z1 - z0;
    for (let k = 0; k < steps; k++) {
      const xa = x0 + ((x1 - x0) * k) / steps, xb = x0 + ((x1 - x0) * (k + 1)) / steps, y = (y1 * (k + 1)) / steps;
      b.block(VC.solid, pick(['#6a6a4a', '#7a6a50', '#5a6a46']), s * (xa + xb) / 2, -1, zc, xb - xa + 0.4, y + 1, L);
      b.box(VC.solid, '#8a8070', s * (xa + 0.1), y / 2, zc, 0.3, y, L);   // the retaining wall's face
      for (let z = z0 + rand(0, 3); z < z1 - 4; z += rand(6, 9)) {
        const w = rand(5, 7.5), dd = rand(5, xb - xa - 1), hh = rand(5, 9), hx = s * (xa + 0.5 + dd / 2), hz = -(z + w / 2), col = pick(STUCCO.concat(PAINTED));
        b.block(VC.solid, col, hx, y, hz, dd, hh, w);
        b.box(VC.solid, shade(col, 0.9), hx, y + hh + 0.2, hz, dd + 0.3, 0.4, w + 0.3);
        for (let f = 0; f < Math.floor(hh / 3); f++) for (const dz of [-w / 4, w / 4]) b.box(VC.glow, glass(0.5, s > 0), s * (xa + 0.47), y + 1.6 + f * 3, hz + dz, 0.04, 1.3, 1.0);
      }
      if (chance(0.6)) K.cypress(b, s * rand(xa + 2, xb - 2), -rand(z0 + 4, z1 - 4), rand(0.6, 0.9), { y, ry: s > 0 ? Math.PI : 0 });
    }
  };

  // ---------- cable cars ----------
  // A Powell Street cable car at the origin, its front toward -z: the open grip section with its outward benches up
  // front, the closed cabin behind, the clerestory roof, maroon and cream with gold lines; riders on the benches and
  // hanging off the running boards. Returns nothing; build it into its own batcher and place it (K.place).
  K.cableCar = (t, { riders = 0.7, sign = 'POWELL & HYDE' } = {}) => {
    const M = '#7a1a24', C = '#efe4c8', Gd = '#d8b048', L = 8.3, hl = L / 2;
    t.block(VC.solid, '#2a2420', 0, 0.2, 0, 2.2, 0.35, L - 0.4);   // the truck frame and wheels
    for (const dz of [-2.6, 2.6]) for (const e of [-1, 1]) t.cyl(VC.metal, '#3a3a3e', e * 0.75, 0.3, dz, 0.3, 0.14, 'cyl8', 0, Math.PI / 2);
    for (const e of [-1, 1]) t.box(VC.solid, '#6a4a2a', e * 1.32, 0.5, 0, 0.4, 0.08, L - 0.6);   // the running boards
    t.block(VC.solid, M, 0, 0.55, 0, 2.44, 0.95, L);   // the lower body
    for (const e of [-1, 1]) { t.box(VC.solid, Gd, e * 1.225, 1.38, 0, 0.02, 0.06, L - 0.2); t.box(VC.solid, Gd, e * 1.225, 0.72, 0, 0.02, 0.05, L - 0.2); }
    // the open grip section, -z end: benches back to back down the middle, facing out
    const g0 = -hl, g1 = -hl + 3.2;
    t.block(VC.solid, '#8a5a2a', 0, 1.5, (g0 + g1) / 2, 0.3, 0.75, g1 - g0 - 0.4);
    for (const e of [-1, 1]) t.box(VC.solid, '#a8743a', e * 0.6, 1.55, (g0 + g1) / 2, 0.8, 0.08, g1 - g0 - 0.4);
    for (let z = g0 + 0.25; z <= g1; z += (g1 - g0 - 0.5) / 3) for (const e of [-1, 1]) t.cyl(VC.metal, '#c8a050', e * 1.1, 2.3, z, 0.035, 1.5, 'cyl6');   // brass stanchions
    beam(t, VC.metal, 0.2, 1.5, g0 + 1.4, 0.35, 2.3, g0 + 1.2, 0.06, '#2a2a2e');   // the grip lever
    // the closed cabin and the rear platform
    t.block(VC.solid, C, 0, 1.5, (g1 + hl - 0.9) / 2, 2.44, 1.5, hl - 0.9 - g1);
    for (const e of [-1, 1]) for (let k = 0; k < 4; k++) { const z = g1 + 0.45 + k * ((hl - 1.3 - g1) / 4); t.box(VC.glow, hdr(pick(WARM), 1.0), e * 1.23, 2.25, z + 0.4, 0.03, 0.85, 0.7); }
    t.box(VC.solid, M, 0, 1.55, hl - 0.45, 2.44, 0.2, 0.9);
    for (const e of [-1, 1]) t.cyl(VC.metal, '#c8a050', e * 1.1, 2.3, hl - 0.1, 0.035, 1.5, 'cyl6');
    // the roof: a long low roof, the clerestory along its middle, the sign at the front
    t.box(VC.solid, '#f2ece0', 0, 3.08, 0, 2.6, 0.12, L + 0.2);
    t.box(VC.solid, C, 0, 3.26, 0, 1.3, 0.26, L - 1.2);
    for (const e of [-1, 1]) t.box(VC.glow, hdr('#ffe0a8', 0.9), e * 0.66, 3.26, 0, 0.02, 0.14, L - 1.6);
    t.add(G.plane, K.label(sign, { w: 512, h: 96, color: '#1a1a24', bg: '#f4f0e4', font: SANS, weight: 700, size: 0.62, k: 0.95 }), 0, 3.5, -hl - 0.05, 2.0, 0.38, 1, 0, Math.PI, 0);
    t.box(VC.solid, M, 0, 3.42, -hl, 2.1, 0.56, 0.06);
    t.cyl(VC.glow, hdr('#fff0c8', 2.4), 0, 1.25, -hl - 0.04, 0.2, 0.06, 'cyl', Math.PI / 2);   // the headlamp
    t.cyl(VC.glow, hdr('#ff3a2a', 1.6), 0, 1.25, hl + 0.04, 0.12, 0.06, 'cyl', Math.PI / 2);
    // the riders: on the benches facing out, hanging off the boards, a gripman at his lever
    for (const e of [-1, 1]) for (let z = g0 + 0.5; z < g1 - 0.2; z += 0.75) {
      if (chance(riders)) K.person(t, e * 0.75, z, { seated: true, y: 0.62, ry: e > 0 ? -Math.PI / 2 : Math.PI / 2, bag: false, phone: false, camera: chance(0.3) });
      if (chance(riders * 0.6)) K.person(t, e * 1.38, z + 0.3, { y: 0.52, ry: e > 0 ? -Math.PI / 2 : Math.PI / 2, s: 0.95, bag: false, phone: false });
    }
    K.person(t, 0.3, g0 + 1.0, { y: 0.55, ry: 0, top: '#2a3a5a', hat: 'cap', bag: false, phone: false });
  };
  // a crosswalk across a street that runs along local axis `along` ('x' or 'z'): the white bars of a continental crossing
  K.crosswalk = (b, x, z, len, w, along = 'x', y = 0.045) => {
    const n = Math.max(2, Math.floor(len / 0.9));
    for (let k = 0; k < n; k++) { const o = -len / 2 + (k + 0.5) * (len / n); if (along === 'x') b.box(VC.solid, '#e8e6e0', x, y, z + o, w, 0.01, 0.45); else b.box(VC.solid, '#e8e6e0', x + o, y, z, 0.45, 0.01, w); }
  };
  // a cheap house for the far slopes and hillsides: a box in its colour, a gable or a flat roof, a few lit windows facing ry
  K.smallHouse = (b, x, y, z, w, d, h, ry, { col = pick(STUCCO.concat(PAINTED)), gable = chance(0.5), lit = 0.45 } = {}) => {
    const F = frame(b, x, y, z, 1, ry);
    F.box(VC.solid, col, 0, (h - 5) / 2, -d / 2, w, h + 5, d);
    if (gable) F.addM(prism(w + 0.4, w * 0.4, d + 0.4), VC.solid, new THREE.Matrix4().makeTranslation(0, h, 0.2), pick(ROOFS));
    else F.box(VC.solid, shade(col, 0.9), 0, h + 0.2, -d / 2, w + 0.3, 0.4, d + 0.3);
    for (let f = 0; f < Math.max(1, Math.floor(h / 3)); f++) for (const dx of w > 6 ? [-w / 4, w / 4] : [0]) F.box(VC.glow, glass(lit, true), dx, 1.6 + f * 3, 0.03, 1.0, 1.4, 0.04);
  };
  // The downhill side of a street along a hill, left open: a balustrade at the pavement's edge, and beyond it the city
  // falling away toward the bay, its roofs stepping down below the eye, trees between them, the water and its boats at
  // the foot. Sometimes Hyde Street runs straight down through it from the main street, a cable car grinding up it.
  // Returns where Hyde Street leaves the main street (or null).
  K.vista = (b, s, { D = 28, U = 100, hyde = chance(0.7) } = {}) => {
    // the hill's profile: steep just past the balustrade, flattening toward the shore, so that from the street the eye
    // passes over the steep part and comes down on the lower roofs, the shore and the water
    const x0 = EDGE + 7.25, yAt = (u) => { const t = Math.min(1, Math.max(0, u / U)); return -D * (1 - (1 - t) * (1 - t)); }, slope = (u) => Math.atan((2 * D * (1 - Math.min(1, u / U))) / U);
    const zj = hyde ? rand(26, 54) : null, R = 7.5;
    // the slope: a grid a little wider than the chunk, rumpled, its colour the dry summer grass and the gardens
    const nu = 16, nz = 12, z0 = -6, z1 = CHUNK_LEN + 6, pos = [], col = [], idx = [], c0 = new THREE.Color('#7a7a50'), c1 = new THREE.Color('#5a6a42');
    const hAt = (u, z) => yAt(u) + (u > 4 && !(hyde && Math.abs(z - zj) < R + 5) ? Math.sin(z * 0.11 + u * 0.05) * 1.2 : 0);   // rumpled, but smooth under Hyde Street
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nu; i++) { const u = (U * i) / nu, z = z0 + ((z1 - z0) * j) / nz, c = c0.clone().lerp(c1, Math.random()); pos.push(s * (x0 + u), hAt(u, z) - 0.05, -z); col.push(c.r, c.g, c.b); }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nu; i++) { const a0 = j * (nu + 1) + i, a1 = a0 + 1, b0 = a0 + nu + 1, b1 = b0 + 1; if (s > 0) idx.push(a0, a1, b0, a1, b1, b0); else idx.push(a0, b0, a1, a1, b0, b1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    b.addM(g, VC.solid, new THREE.Matrix4(), null);
    // the balustrade at the pavement's edge, people leaning on it to look at the view
    for (const [za, zb] of hyde ? [[0, zj - R], [zj + R, CHUNK_LEN]] : [[0, CHUNK_LEN]]) {
      b.block(VC.solid, '#c8c0b0', s * (x0 - 0.15), -1.5, -(za + zb) / 2, 0.3, 2.2, zb - za);
      b.box(VC.solid, '#d8d0c0', s * (x0 - 0.15), 0.76, -(za + zb) / 2, 0.42, 0.12, zb - za);
    }
    for (let k = randi(3, 6); k > 0; k--) { const z = rand(3, 77); if (!hyde || Math.abs(z - zj) > R + 1) K.person(b, s * (x0 - 0.7), -z, { ry: s < 0 ? Math.PI / 2 : -Math.PI / 2, camera: chance(0.5) }); }
    // the roofs stepping down: rows along the slope, kept low enough near the top to look over
    const far = (z) => hyde && Math.abs(z - zj) < R + 2.5;
    for (let u = 18; u < U - 8; u += rand(11, 15)) for (let z = rand(-4, 2); z < CHUNK_LEN + 4;) {
      const w = rand(6, 9), d = rand(8, 11), h = rand(5.5, 8.5) - (u < 30 ? 2.5 : 0), zc = z + w / 2;
      if (!far(zc) && !far(z) && !far(z + w)) K.smallHouse(b, s * (x0 + u), hAt(u, zc) - 0.6, -zc, w, d, h, face(s));
      else if (chance(0.3)) K.cypress(b, s * (x0 + u), -zc, rand(0.5, 0.7), { y: hAt(u, zc) - 0.3, lo: true });
      z += w + rand(0.1, 1.5);
    }
    for (let k = randi(4, 8); k > 0; k--) { const u = rand(3, 16), z = rand(0, CHUNK_LEN); if (far(z)) continue; if (chance(0.5)) K.cypress(b, s * (x0 + u), -z, rand(0.5, 0.75), { y: hAt(u, z) - 0.2, lo: true }); else K.shrub(b, s * (x0 + u), -z, { y: hAt(u, z) - 0.2, s: rand(1.2, 1.8) }); }
    // the bay at the foot of it all, the boats out on it
    const yb = yAt(U) - 1.2;
    b.add(G.plane, K.water, s * (x0 + U - 6 + 220), yb, -(CHUNK_LEN + 240) / 2 + 60, 440, CHUNK_LEN + 300, 1, -Math.PI / 2, 0, 0);   // carried on well ahead, so it shows past the corner of the view
    b.box(VC.solid, '#6a6448', s * (x0 + U - 4), yb - 1, -CHUNK_LEN / 2, 10, 3, CHUNK_LEN + 12);   // the shore at the slope's foot
    for (let k = randi(4, 7); k > 0; k--) K.sailboat(b, s * (x0 + U + rand(30, 300)), -rand(0, 300), rand(0, Math.PI * 2), { y: yb, sails: chance(0.75), s: rand(1.0, 1.6) });
    if (!hyde) return null;
    // Hyde Street, straight down the slope: built along local -z (u), then turned into place
    const sb = new Batcher(), P = 2.6, L = U - 4, n = 12;
    for (let i = 0; i < n; i++) {   // the street in straight lengths following the curve: the roadway, its pavements, the rails
      const u0 = (L * i) / n, u1 = (L * (i + 1)) / n, y0 = yAt(u0), y1 = yAt(u1), len = Math.hypot(u1 - u0, y1 - y0) + 0.05, a = Math.atan2(y0 - y1, u1 - u0), um = (u0 + u1) / 2, ym = (y0 + y1) / 2;
      const slab = (x, w, mat, k, dy = 0.06) => sb.add(K.tiledPlane(w, len, k), mat, x, ym + dy, -um, w, len, 1, -Math.PI / 2 - a, 0, 0);
      slab(0, 2 * R - 2 * P, K.roadMat, 6);
      for (const k of [-1, 1]) slab(k * (R - P / 2), P, K.paveMat, 3.5);
      for (const e of [-0.72, 0.72]) sb.add(G.box, VC.metal, e, ym + 0.09, -um, 0.08, 0.04, len, -a, 0, 0, '#c8ccd4');   // the cable car's rails
    }
    const tilt = (u) => new THREE.Matrix4().makeRotationX(-slope(u));
    for (const k of [-1, 1]) for (let u = rand(5, 9); u < L - 6; u += rand(5.5, 8)) if (chance(0.6)) K.place(sb, (t) => K.car(t, 0, 0, pick([-1, 1])), tilt(u).setPosition(k * (R - P - 1.05), yAt(u) + 0.03, -u));
    for (const k of [-1, 1]) for (let u = 4; u < L - 6;) {   // its houses, each lot's floor at its downhill end, so they step down the street
      const w = pick([6.4, 7.6, 8.4]);
      if (u > 14) K.house(sb, k, R + 0.25, -(u + w / 2), { w, base: yAt(u + w), yd: 0.9, floors: u < 30 ? 1 : 2, lit: 0.45, yard: false, foot: 7, flip: k > 0 });
      u += w + 0.05;
    }
    { const u = rand(22, 50); K.place(sb, (t) => K.cableCar(t, { sign: 'POWELL & HYDE' }), new THREE.Matrix4().makeRotationY(Math.PI).premultiply(tilt(u)).setPosition(0, yAt(u) + 0.05, -u)); }
    for (const k of [-1, 1]) for (let u = rand(8, 14); u < L - 4; u += rand(24, 30)) K.place(sb, (t) => K.lamp(t, k * (R - P + 0.35), 0, k, { pool: 0 }), new THREE.Matrix4().makeTranslation(0, yAt(u), -u));
    for (const k of [-1, 1]) for (let i = randi(2, 5); i > 0; i--) { const u = rand(2, L - 6); K.person(sb, k * rand(R - P + 0.5, R - 0.4), -u, { y: yAt(u) + 0.05 }); }
    const hg = sb.build(), m = new THREE.Matrix4().makeRotationY(-s * Math.PI / 2).setPosition(s * x0, 0, -zj);
    for (const mesh of hg.children) { b.addM(mesh.geometry, mesh.material, m, null); mesh.geometry.dispose(); }
    // its mouth: the gap in the balustrade, the crossing, the stop signs
    b.box(VC.solid, '#3c3c42', s * (KERB + x0) / 2, 0.034, -zj, x0 - KERB, 0.02, 2 * R - 2 * P);
    K.crosswalk(b, s * (KERB + 1.6), -zj, 2 * R - 2 * P - 0.6, 2.4, 'x', 0.046);
    for (const k of [-1, 1]) K.stop(b, s * (KERB + 0.5), -zj + k * (R - P + 0.4), s);
    return zj;
  };

  // ---------- the bay ----------
  K.sailboat = (b, x, z, ry = rand(0, Math.PI * 2), { s = rand(0.8, 1.2), y = -1.2, sails = chance(0.5) } = {}) => {   // moored with its sails furled, or out on the bay with them set
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + (fx * ca + fz * sa) * s, y + fy * s, z + (-fx * sa + fz * ca) * s];
    b.add(G.sphLow, VC.solid, ...P(0, 0.35, 0), 2.2 * s, 1.0 * s, 8 * s, 0, ry, 0, '#f4f4f0');
    b.add(G.box, VC.solid, ...P(0, 0.9, 0.6), 1.3 * s, 0.6 * s, 2.6 * s, 0, ry, 0, '#e8e4dc');
    b.add(G.cyl8, VC.solid, ...P(0, 6.2, -0.6), 0.12 * s, 11 * s, 0.12 * s, 0, ry, 0, '#d8dce0');
    if (sails) {
      b.addM(SAIL, K.sailMat, new THREE.Matrix4().compose(new THREE.Vector3(...P(0, 1.4, -0.5)), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry + Math.PI / 2), new THREE.Vector3(3.2 * s, 9.5 * s, 1)), '#f8f6f0');
      b.addM(SAIL, K.sailMat, new THREE.Matrix4().compose(new THREE.Vector3(...P(0, 1.4, -0.75)), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry - Math.PI / 2), new THREE.Vector3(2.6 * s, 8.6 * s, 1)), pick(['#f8f6f0', '#e8e4dc', '#f8f6f0', '#e8506a', '#2a6ab0']));
    } else b.add(G.cyl8, VC.solid, ...P(0, 1.7, 0.6), 0.32 * s, 0.32 * s, 2.6 * s, Math.PI / 2, ry, 0, '#2a4a7a');   // the furled main on its boom, under its blue cover
    b.box(VC.glow, hdr('#ffe0b0', 1.2), ...P(0, 11.7, -0.6), 0.1, 0.1, 0.1);
  };
  K.seaLion = (b, x, y, z, ry = rand(0, Math.PI * 2), { up = chance(0.4) } = {}) => {   // a sea lion hauled out, asleep or with its head up barking
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + fx * ca + fz * sa, y + fy, z - fx * sa + fz * ca], c = pick(['#5a4434', '#4a3a2c', '#6a5240', '#3a2e24']);
    b.add(G.sphLow, VC.solid, ...P(0, 0.28, 0), 0.75, 0.55, 2.0, 0, ry, 0, c);
    if (up) { b.add(G.sphLow, VC.solid, ...P(0, 0.72, -0.85), 0.42, 0.75, 0.42, -0.5, ry, 0, c); b.add(G.sphLow, VC.solid, ...P(0, 1.08, -1.05), 0.3, 0.28, 0.4, 0, ry, 0, c); }
    else b.add(G.sphLow, VC.solid, ...P(0, 0.3, -1.05), 0.38, 0.34, 0.5, 0, ry, 0, c);
    for (const e of [-1, 1]) b.add(G.box, VC.solid, ...P(e * 0.42, 0.1, -0.4), 0.5, 0.06, 0.3, 0, ry + e * 0.5, 0, shade(c, 0.8));
  };
  K.gull = (b, x, y, z, ry = rand(0, Math.PI * 2)) => {   // a gull standing on a rail or a post
    b.add(G.sphLow, VC.solid, x, y + 0.14, z, 0.16, 0.16, 0.36, 0, ry, 0, '#f4f4f2');
    b.add(G.sphLow, VC.solid, x - Math.sin(ry) * 0.18, y + 0.24, z - Math.cos(ry) * 0.18, 0.12, 0.12, 0.12, 0, 0, 0, '#ffffff');
    b.add(G.box, VC.solid, x, y + 0.2, z + Math.cos(ry) * 0.04, 0.17, 0.08, 0.26, 0, ry, 0, '#9aa0a8');
  };

  // ---------- fog ----------
  // drifting banks of fog through the streets: each chunk gathers where its fog rises, then one mesh of soft puffs takes them
  K.fogs = []; K.fogBuf = [];
  K.fog = (pts) => { const m = puffs(pts, { size: 5, grow: 1.5, rise: 1.0, drift: 3, life: 22, n: 1, color: '#fff2ea', opacity: 0.15 }); K.fogs.push(m); return m; };
  K.flushFog = (g) => { if (K.fogBuf.length) g.add(K.fog(K.fogBuf.splice(0))); return g; };
  K.fogBank = (z0, z1, n = 10, { x1 = 13 } = {}) => {   // fog drifting down the street: low over the pavements and the parked cars, higher over the track
    for (let k = 0; k < n; k++) { const x = rand(-x1, x1); K.fogBuf.push([x, Math.abs(x) < 4.5 ? rand(9, 15) : rand(3, 10), -rand(z0, z1)]); }
  };

  K.update = (t) => {
    K.water.userData.scroll.offset.set(t * 0.006, t * 0.018);
    for (const m of K.fogs) m.userData.update(t);
  };
  return K;
}
const OCT8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8).rotateY(Math.PI / 8).rotateX(Math.PI / 2);   // an octagon facing +z, flat on top (the stop sign)
const SAIL = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1, 0); s.lineTo(0, 1); s.closePath(); return new THREE.ShapeGeometry(s); })();   // a sail: the luff up the mast, the foot along the boom
