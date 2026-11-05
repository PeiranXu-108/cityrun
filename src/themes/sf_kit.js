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
import { frame, taperGeo } from './ny_icons.js';
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
  // A person: the limbs are boxes between the joints, the head and the hair low spheres. Poses: standing (in mid-step,
  // the arms swinging, or a camera up to the eyes, a phone, a bag), seated, lying (on a park's grass), ride (on a bike);
  // hang (one hand up on a cable car's pole behind, leaning out off its running board, the other arm out over the
  // street), push (both hands out against a cable car on the turntable), lever (the gripman's hands on his lever), drum
  // (seated, the hands down on a drum), play: 'guitar', 'trumpet' or 'violin'. Dressed for the fog: a jacket open over a
  // T-shirt, a puffer, a fleece; the tourists in new hoodies, the hood up or down, some in shorts; the hippies in tie-dye
  // and fringed suede vests, bell-bottoms, round tinted shades, flowers or a band in their long hair.
  K.person = (b, x, z, { s = rand(0.92, 1.06), y = 0, top = null, legs = null, hat = null, ry = null, skin = pick(SKIN), seated = false, lying = false, ride = false, hang = false, push = false, lever = false, drum = false, play = null,
    bag = chance(0.2), phone = chance(0.14), kid = false, hippie = false, camera = false, shorts = false } = {}) => {
    const a = ry ?? rand(-0.5, 0.5) + (chance(0.5) ? Math.PI : 0), ca = Math.cos(a), sa = Math.sin(a);
    if (kid) s *= 0.62;
    const W3 = (fx, fy, fz) => [x + (fx * ca + fz * sa) * s, y + fy * s, z + (-fx * sa + fz * ca) * s];   // a point of the body in the chunk
    const bone = (p, q, t, col) => beam(b, VC.solid, ...W3(...p), ...W3(...q), t * s, col);
    const part = (geo, fx, fy, fz, sx, sy, sz, col, rx = 0, rz = 0) => b.add(geo, VC.solid, ...W3(fx, fy, fz), sx * s, sy * s, sz * s, rx, a, rz, col);
    const c = top || (hippie ? pick(TIEDYE) : camera ? pick(HOODIES) : pick(LAYERS)), lg = legs || (hippie ? pick(['#3a5a8a', '#5a7aaa', '#8a6a4a']) : pick(LEGS));
    const hk = hat || (hippie ? pick(['flowers', 'flowers', 'band', 'long']) : kid ? pick(['none', 'cap']) : camera ? pick(['none', 'hood', 'cap', 'none']) : pick(['none', 'none', 'none', 'beanie', 'cap', 'hood', 'long']));
    const coat = top ? 'plain' : hippie ? (chance(0.7) ? 'vest' : 'plain') : camera ? 'hoodie' : pick(['jacket', 'jacket', 'puffer', 'fleece', 'hoodie']);
    const W = 0.42, D = 0.24, body = coat === 'vest' ? pick(['#8a5a2a', '#a8703a', '#6a4a2a']) : c, tee = coat === 'vest' ? c : pick(['#f2f0ea', '#e8e4dc', '#2a2a30', '#8a2a2a', '#3a5a7a', '#c8a050']);
    const sleeve = coat === 'vest' ? c : body, cuff = kid || coat === 'plain' && chance(0.5) ? skin : sleeve, shin = shorts ? skin : lg, shoe = pick(['#1a1a1a', '#e8e8e8', '#5a3a2a', '#f4f0e8', '#3a3a40']);
    // the top: a jacket open over the shirt, the puffer's quilting, a collar; the hoodie's pocket and its hood down behind the neck; the hippie's suede vest and its fringe
    const torso = (cy, h, fz = 0, rx = 0) => {
      part(G.box, 0, cy, fz, W, h, D, body, rx);
      if (coat === 'jacket' || coat === 'vest') part(G.box, 0, cy + 0.01, fz - D / 2 - 0.006, W * 0.34, h - 0.05, 0.02, tee, rx);
      if (coat === 'vest') part(G.box, 0, cy - h / 2 + 0.03, fz, W + 0.03, 0.07, D + 0.03, shade(body, 0.75), rx);
      else if (coat === 'puffer') for (const f of [-0.24, 0.1]) part(G.box, 0, cy + f * h, fz, W + 0.02, 0.025, D + 0.02, shade(c, 0.78), rx);
      else if (coat === 'hoodie') { part(G.box, 0, cy - h * 0.22, fz - D / 2 - 0.012, W * 0.6, h * 0.26, 0.03, shade(c, 0.86), rx); if (hk !== 'hood') part(G.box, 0, cy + h / 2 - 0.03, fz + D / 2 + 0.03, W * 0.7, 0.12, 0.1, shade(c, 0.9), rx); }
      if (coat === 'jacket' || coat === 'fleece') part(G.box, 0, cy + h / 2 + 0.01, fz, W * 0.62, 0.06, D + 0.02, shade(body, 0.8), rx);
    };
    const arm = (sh, el, hd) => { bone(sh, el, 0.105, sleeve); bone(el, hd, 0.095, cuff); part(G.box, hd[0], hd[1], hd[2], 0.08, 0.09, 0.08, skin); };
    let H = 1.64, Z = 0;   // the head's height and how far forward it is
    if (lying) {   // flat on the grass, the head toward local -z; some with their hands under the head
      part(G.box, 0, 0.13, -0.3, W * 0.95, 0.22, 0.52, body);
      part(G.box, 0, 0.12, 0.02, 0.34, 0.2, 0.16, lg);
      for (const e of [-1, 1]) { bone([e * 0.09, 0.11, 0.08], [e * 0.1, 0.1, 0.48], 0.15, lg); bone([e * 0.1, 0.1, 0.48], [e * 0.1, 0.09, 0.86], 0.12, shin); part(G.box, e * 0.1, 0.13, 0.91, 0.1, 0.16, 0.08, shoe); }
      const pillow = chance(0.5);
      for (const e of [-1, 1]) arm([e * 0.26, 0.13, -0.5], pillow ? [e * 0.33, 0.16, -0.66] : [e * 0.29, 0.1, -0.22], pillow ? [e * 0.08, 0.17, -0.86] : [e * 0.3, 0.08, 0.08]);
      part(G.sphLow, 0, 0.15, -0.72, 0.24, 0.26, 0.28, skin);
      part(G.sphLow, 0, 0.14, -0.8, 0.26, 0.2, 0.2, pick(HAIR));
      if (hippie) part(G.box, 0, 0.1, -0.98, 0.3, 0.06, 0.3, pick(HAIR));   // the long hair spread out
      return;
    }
    if (ride) {   // on the saddle, the knees going up and down to the pedals, leaning over the bars
      part(G.box, 0, 0.62, 0.02, 0.34, 0.14, 0.22, lg);
      for (const e of [-1, 1]) { const knee = e > 0 ? [0.1, 0.52, -0.33] : [-0.1, 0.34, -0.18], foot = e > 0 ? [0.1, 0.26, -0.2] : [-0.1, 0.07, 0.1]; bone([e * 0.09, 0.62, 0], knee, 0.15, lg); bone(knee, foot, 0.12, shin); part(G.box, foot[0], foot[1] - 0.04, foot[2] - 0.04, 0.12, 0.08, 0.24, shoe); }
      torso(0.9, 0.5, -0.1, -0.35);
      for (const e of [-1, 1]) arm([e * (W / 2 + 0.05), 1.08, -0.2], [e * 0.3, 0.86, -0.36], [e * 0.27, 0.7, -0.5]);
      H = 1.3; Z = -0.3;
    } else if (seated) {   // on a bench, a seat, the grass: the thighs forward, the shins down
      H = 1.2;
      part(G.box, 0, 0.5, 0.02, 0.36, 0.14, 0.22, lg);
      for (const e of [-1, 1]) { bone([e * 0.09, 0.5, 0], [e * 0.1, 0.5, -0.42], 0.15, lg); bone([e * 0.1, 0.5, -0.42], [e * 0.1, 0.06, -0.46], 0.12, shin); part(G.box, e * 0.1, 0.04, -0.52, 0.12, 0.08, 0.24, shoe); }
      torso(0.81, 0.52, 0.03);
      for (const e of [-1, 1]) {
        const sx = e * (W / 2 + 0.05), sh = [sx, 1.0, 0.03];
        if (drum) arm(sh, [e * 0.27, 0.8, -0.14], [e * 0.13, 0.62, -0.34]);
        else if (camera) arm(sh, [e * 0.24, 0.84, -0.16], [e * 0.07, 1.14, -0.26]);
        else if (phone && e > 0) arm(sh, [sx + 0.02, 0.78, -0.06], [0.08, 0.86, -0.3]);
        else arm(sh, [sx + e * 0.02, 0.76, -0.06], [e * 0.16, 0.6, -0.3]);
      }
      if (phone && !camera) b.box(VC.glow, hdr('#cfe6ff', 1.4), ...W3(0.08, 0.92, -0.33), 0.07 * s, 0.12 * s, 0.02, a, -0.5);
    } else {   // standing, in mid-step unless at work
      const hip = 0.9, step = push ? 0.2 : hang || lever || play ? 0.03 : rand(-1, 1) * 0.13, swing = -step / 0.13;
      for (const e of [-1, 1]) {
        const fz = e * step, knee = [e * 0.09, 0.48, fz * 0.5 - 0.02], foot = [e * 0.09, 0.08, fz];
        bone(foot, knee, 0.12, shin); bone(knee, [e * 0.095, hip, 0], 0.15, lg);
        if (hippie && !shorts) part(G.box, foot[0], 0.16, foot[2], 0.2, 0.2, 0.21, lg);   // the bell-bottoms flaring over the shoe
        part(G.box, foot[0], 0.04, foot[2] - 0.05, 0.12, 0.08, 0.26, shoe);
      }
      part(G.box, 0, hip + 0.02, 0, 0.36, 0.14, 0.22, lg);
      torso(hip + 0.33, 0.5);
      const sh = hip + 0.55;
      for (const e of [-1, 1]) {
        const sx = e * (W / 2 + 0.05), S0 = [sx, sh, 0];
        if (play === 'trumpet') arm(S0, [e * 0.22, sh - 0.14, -0.18], [e * 0.05, sh + 0.02, -0.34]);
        else if (play === 'violin') arm(S0, e < 0 ? [-0.3, sh - 0.04, -0.14] : [0.3, sh - 0.12, -0.08], e < 0 ? [-0.34, sh + 0.04, -0.36] : [0.06, sh + 0.02, -0.34]);
        else if (play === 'guitar') arm(S0, e < 0 ? [-0.27, sh - 0.16, -0.16] : [0.22, sh - 0.27, -0.12], e < 0 ? [-0.46, sh - 0.08, -0.3] : [0.04, sh - 0.4, -0.24]);
        else if (push) arm(S0, [e * (W / 2 + 0.02), sh - 0.06, -0.26], [e * 0.17, sh - 0.04, -0.54]);
        else if (lever) arm(S0, [e * 0.24, sh - 0.24, -0.2], [e * 0.06, sh - 0.18, -0.42]);
        else if (hang && e > 0) arm(S0, [sx + 0.06, sh + 0.26, 0.1], [sx + 0.02, sh + 0.56, 0.16]);   // up to the pole behind
        else if (hang) arm(S0, [sx - 0.22, sh - 0.12, -0.06], [sx - 0.46, sh - 0.02, -0.12]);   // the other out over the street
        else if (camera) arm(S0, [e * 0.24, sh - 0.2, -0.16], [e * 0.07, sh + 0.1, -0.26]);
        else if (phone && e > 0) arm(S0, [sx + 0.02, sh - 0.27, -0.04], [0.1, sh - 0.12, -0.27]);
        else arm(S0, [sx + e * 0.02, sh - 0.28, swing * e * 0.07], [sx + e * 0.01, sh - 0.56, swing * e * 0.16]);
      }
      if (phone && !camera && !hang && !push && !lever && !play) b.box(VC.glow, hdr('#cfe6ff', 1.4), ...W3(0.1, 1.33, -0.3), 0.07 * s, 0.12 * s, 0.02, a);
      if (bag && !hang && !push && !lever && !play) part(G.box, 0.29, 0.86, 0.02, 0.09, 0.3, 0.3, pick(['#141414', '#c8a070', '#8a2a1a', '#2a3a5a']));
    }
    // the head and what is on it
    const hc = pick(HAIR);
    part(G.sphLow, 0, H, Z, 0.24, 0.29, 0.25, skin);
    if (hk === 'beanie') part(G.sphLow, 0, H + 0.08, Z + 0.01, 0.27, 0.22, 0.28, pick(['#1a1a1e', '#c8302a', '#2a4a6a', '#e8c030', '#5a5a5a']));
    else if (hk === 'cap') { part(G.box, 0, H + 0.11, Z, 0.27, 0.09, 0.27, pick(['#c8302a', '#1a1a1e', '#2a4a8a', '#f2c230'])); part(G.box, 0, H + 0.08, Z - 0.18, 0.22, 0.03, 0.15, '#1a1a1e'); }
    else if (hk === 'hood') part(G.sphLow, 0, H + 0.03, Z + 0.04, 0.32, 0.35, 0.33, body);
    else if (hk === 'long' || hk === 'flowers' || hk === 'band') {   // long hair, parted in the middle, down the back
      part(G.sphLow, 0, H + 0.06, Z + 0.02, 0.27, 0.22, 0.28, hc); part(G.box, 0, H - 0.16, Z + 0.09, 0.28, 0.42, 0.1, hc);
      if (hk === 'flowers') for (let k = 0; k < 6; k++) { const t = (k / 6) * Math.PI * 2; part(G.box, Math.cos(t) * 0.14, H + 0.13, Z + Math.sin(t) * 0.14, 0.06, 0.06, 0.06, k % 2 ? '#ffffff' : pick(['#ff5a8a', '#ffd23d', '#ff8a2a', '#8ac8ff']), 0, 0.6); }
      if (hk === 'band') part(G.box, 0, H + 0.06, Z, 0.29, 0.04, 0.3, pick(TIEDYE));
    } else if (hk !== 'bald') part(G.sphLow, 0, H + 0.07, Z + 0.025, 0.26, 0.18, 0.27, hc);
    if (hippie && !kid && chance(0.5)) for (const e of [-1, 1]) part(G.box, e * 0.055, H + 0.02, Z - 0.125, 0.07, 0.06, 0.02, pick(['#e8702a', '#7a3ab4', '#2a8a7a']));   // round shades, tinted
    if (camera) part(G.box, 0, H - 0.02, Z - 0.29, 0.17, 0.1, 0.09, '#141414');
  };
  K.crowd = (b, x0, x1, z0, z1, n, opts = {}) => { for (let i = 0; i < n; i++) K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1), opts); };
  K.throng = (b, x0, x1, z0, z1, n, gaps = [], opts = {}) => {   // a crowd kept out of the given stretches
    for (let i = 0, t = 0; i < n && t < n * 4; t++) { const z = rand(z0, z1); if (gaps.some(([a, c]) => z > a && z < c)) continue; K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -z, opts); i++; }
  };
  K.tourist = (b, x, z, ry) => K.person(b, x, z, { camera: true, ry, shorts: chance(0.4), hat: pick(['cap', 'none', 'hood']) });
  K.dog = (b, x, z, ry = rand(0, Math.PI * 2), { y = 0 } = {}) => {   // a dog out on its walk: body, head and muzzle, ears, legs, tail
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + fx * ca + fz * sa, y + fy, z - fx * sa + fz * ca], c = pick(['#c8a070', '#3a2a1a', '#e8e0d0', '#6a5a4a', '#1a1a1a', '#d8b888']);
    b.add(G.sphLow, VC.solid, ...P(0, 0.42, 0), 0.32, 0.3, 0.7, 0, ry, 0, c);
    b.add(G.sphLow, VC.solid, ...P(0, 0.62, -0.38), 0.24, 0.24, 0.3, 0, ry, 0, c);
    b.add(G.box, VC.solid, ...P(0, 0.58, -0.56), 0.12, 0.1, 0.16, 0, ry, 0, shade(c, 0.8));
    for (const e of [-0.08, 0.08]) b.add(G.box, VC.solid, ...P(e, 0.74, -0.34), 0.05, 0.12, 0.08, 0, ry, e * 2, shade(c, 0.85));
    for (const [fx, fz] of [[-0.1, -0.22], [0.1, -0.22], [-0.1, 0.22], [0.1, 0.22]]) b.add(G.box, VC.solid, ...P(fx, 0.18, fz), 0.07, 0.36, 0.07, 0, ry, 0, c);
    b.add(G.box, VC.solid, ...P(0, 0.56, 0.4), 0.05, 0.05, 0.3, -0.7, ry, 0, c);
  };
  K.bike = (b, x, z, ry, { y = 0, col = pick(['#c8302a', '#2a2a30', '#2a6ab0', '#e8e8ec', '#3a8a5a']) } = {}) => {   // a bicycle standing (or ridden) along ry: the wheels and their hubs, the frame, the fork, the bars, the saddle
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fz, fy) => [x + fz * sa, y + fy, z + fz * ca];
    for (const e of [-0.52, 0.52]) { b.add(G.tor, VC.solid, ...P(e, 0.34), 0.66, 0.66, 0.66, 0, ry + Math.PI / 2, 0, '#1a1a1a'); b.add(G.cyl8, VC.metal, ...P(e, 0.34), 0.06, 0.1, 0.06, 0, ry, Math.PI / 2, '#b8bcc4'); }
    beam(b, VC.metal, ...P(-0.52, 0.34), ...P(-0.08, 0.36), 0.035, col); beam(b, VC.metal, ...P(-0.08, 0.36), ...P(0.42, 0.74), 0.045, col);   // the chainstay, the down tube
    beam(b, VC.metal, ...P(-0.08, 0.36), ...P(-0.12, 0.76), 0.04, col); beam(b, VC.metal, ...P(-0.12, 0.72), ...P(0.42, 0.74), 0.04, col);   // the seat tube, the top tube
    beam(b, VC.metal, ...P(-0.52, 0.34), ...P(-0.12, 0.72), 0.03, col); beam(b, VC.metal, ...P(0.52, 0.34), ...P(0.44, 0.86), 0.035, '#8a8e94');   // the seat stays, the fork
    b.add(G.box, VC.metal, ...P(0.42, 0.88), 0.56, 0.035, 0.04, 0, ry, 0, '#2a2a2e');
    b.add(G.box, VC.solid, ...P(-0.13, 0.8), 0.12, 0.05, 0.24, 0, ry, 0, '#1a1a1a');
    b.add(G.cyl8, VC.metal, ...P(-0.08, 0.36), 0.18, 0.04, 0.18, 0, ry, Math.PI / 2, '#5a5e64');   // the chainring
  };
  K.cyclist = (b, x, z, ry) => { K.bike(b, x, z, ry); K.person(b, x - 0.13 * Math.sin(ry), z - 0.13 * Math.cos(ry), { y: 0.2, ry: ry + Math.PI, ride: true, bag: false, phone: false, hat: pick(['cap', 'none', 'bald']), s: 0.95 }); };

  // ---------- cars ----------
  // A car is its body's side profile (length along the car, height up) extruded across its width, the cabin's glass on
  // it a little narrower, the roof panel and the pillars over the glass; the wheels and their hubs, the bumpers, the
  // grille, the lamps, the mirrors, the plate. kind: 'sedan', 'hatch' (the little hybrids the city is full of), 'suv',
  // 'pickup', 'classic' (long and low, chrome, two-tone), 'taxi', 'police' (black and white, the light bar); dir: which
  // way it faces (-1: toward you); curb: the front wheels turned (radians, + toward the car's left), into the kerb on a
  // hill; lo: a cheaper one for the far traffic. The profiles are for the car's nominal length L, its front toward +u.
  const CAR = {
    sedan: { L: 4.6, W: 1.8, wr: 0.32, wu: 1.42, belt: 0.9, top: 1.4, hl: 0.66, tl: 0.76, body: [[-2.3, 0.3], [2.3, 0.3], [2.34, 0.6], [2.14, 0.78], [0.95, 0.9], [-1.5, 0.93], [-2.26, 0.9], [-2.36, 0.62]],
      cab: [[0.97, 0.88], [0.34, 1.34], [-0.86, 1.36], [-1.54, 0.91]], roof: [[0.36, 1.33], [0.31, 1.39], [-0.85, 1.4], [-0.9, 1.35]], pil: [-0.26] },
    hatch: { L: 4.45, W: 1.76, wr: 0.31, wu: 1.35, belt: 0.92, top: 1.47, hl: 0.68, tl: 0.86, body: [[-2.2, 0.3], [2.2, 0.3], [2.25, 0.56], [2.06, 0.74], [0.95, 0.88], [-1.95, 0.98], [-2.2, 0.92], [-2.26, 0.6]],
      cab: [[0.97, 0.86], [0.3, 1.4], [-0.95, 1.47], [-2.0, 0.98]], roof: [[0.32, 1.39], [0.27, 1.45], [-0.93, 1.5], [-1.02, 1.44]], pil: [-0.36] },
    suv: { L: 4.8, W: 1.92, wr: 0.38, wu: 1.5, belt: 1.08, top: 1.74, hl: 0.84, tl: 1.0, body: [[-2.4, 0.36], [2.4, 0.36], [2.44, 0.72], [2.3, 0.98], [1.2, 1.08], [-2.36, 1.1], [-2.44, 0.74]],
      cab: [[1.22, 1.06], [0.62, 1.66], [-2.3, 1.68], [-2.36, 1.08]], roof: [[0.64, 1.65], [0.6, 1.72], [-2.32, 1.74], [-2.37, 1.67]], pil: [-0.35, -1.45] },
    pickup: { L: 5.3, W: 1.95, wr: 0.38, wu: 1.75, belt: 1.1, top: 1.71, hl: 0.86, tl: 0.98, body: [[-2.65, 0.38], [2.65, 0.38], [2.68, 0.76], [2.52, 1.02], [1.15, 1.1], [-0.55, 1.1], [-0.55, 0.86], [-2.65, 0.86]],
      cab: [[1.17, 1.08], [0.6, 1.64], [-0.45, 1.66], [-0.5, 1.08]], roof: [[0.62, 1.63], [0.58, 1.7], [-0.45, 1.71], [-0.5, 1.65]], pil: [] },
    classic: { L: 5.4, W: 1.95, wr: 0.32, wu: 1.62, belt: 0.79, top: 1.28, hl: 0.6, tl: 0.78, body: [[-2.7, 0.28], [2.7, 0.28], [2.74, 0.58], [2.5, 0.72], [0.9, 0.78], [-1.6, 0.8], [-2.66, 0.94], [-2.74, 0.6]],
      cab: [[0.92, 0.77], [0.55, 1.22], [-0.9, 1.24], [-1.4, 0.8]], roof: [[0.57, 1.21], [0.53, 1.27], [-0.88, 1.28], [-0.94, 1.23]], pil: [] },
  };
  CAR.taxi = CAR.police = CAR.sedan;
  const profiles = new Map();
  const extrude = (pts, w) => {   // a profile in (u, v) extruded across x, centred; its front toward local -z
    const key = pts.flat().join(',') + '|' + w.toFixed(2);
    if (!profiles.has(key)) {
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v))), { depth: w, bevelEnabled: false });
      g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2);
      const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); profiles.set(key, n);
    }
    return profiles.get(key);
  };
  const _cm = new THREE.Matrix4(), _cq = new THREE.Quaternion(), _ce = new THREE.Euler(0, 0, 0, 'YXZ'), _cv = new THREE.Vector3(), _cs = new THREE.Vector3();
  const GLASS = hdr('#2e3a4e', 0.95);
  K.car = (b, x, z, dir = pick([-1, 1]), { kind = pick(['sedan', 'sedan', 'hatch', 'hatch', 'hatch', 'suv', 'suv', 'pickup']), col = null, len = null, lit = chance(0.15), y = 0, lo = false, curb = 0 } = {}) => {
    if (kind === 'sedan' && chance(0.1)) kind = chance(0.6) ? 'taxi' : 'police';
    const C = CAR[kind], k = len ? len / C.L : rand(0.94, 1.04), W = C.W, hw = W / 2, F = C.L / 2;
    col = col || (kind === 'taxi' ? '#f2c230' : kind === 'police' ? '#141418' : pick(CARS));
    const roofCol = kind === 'classic' && chance(0.6) ? '#f4f0e8' : kind === 'police' ? '#f4f4f0' : col, chrome = kind === 'classic' ? '#e8eaec' : '#2a2a2e';
    const M0 = new THREE.Matrix4().makeRotationY(dir > 0 ? 0 : Math.PI).setPosition(x, y, z);
    const prof = (pts, w, mat, c) => b.addM(extrude(pts, w), mat, _cm.copy(M0).multiply(new THREE.Matrix4().makeScale(1, 1, k)), c);
    const part = (geo, mat, c, px, py, pu, sx, sy, sz, rx = 0, rz = 0, ry = 0) => { const m = new THREE.Matrix4().compose(_cv.set(px, py, -pu * k), _cq.setFromEuler(_ce.set(rx, ry, rz)), _cs.set(sx, sy, sz)); b.addM(geo, mat, m.premultiply(M0), c); };
    const at = (px, py, pu) => new THREE.Vector3(px, py, -pu * k).applyMatrix4(M0);
    prof(C.body, W, VC.solid, col);
    prof(C.cab, W - 0.14, VC.glow, GLASS); prof(C.roof, W - 0.12, VC.solid, roofCol);
    if (lo) {   // further out in the traffic: the body, its glass and roof, the wheels as blocks, the lamps
      for (const u of [C.wu, -C.wu]) part(G.box, VC.solid, '#141414', 0, C.wr, u, W - 0.12, C.wr * 2, C.wr * 1.8);
      for (const e of [-1, 1]) { part(G.box, VC.glow, hdr('#fff4d0', lit ? 2.2 : 0.5), e * (hw - 0.3), C.hl, F + 0.02, 0.36, 0.13, 0.04); part(G.box, VC.glow, hdr('#ff2a2a', lit ? 1.6 : 0.6), e * (hw - 0.24), C.tl, -F - 0.02, 0.34, 0.12, 0.04); }
      return;
    }
    const px = hw - 0.065, [a0, a1, a2, a3] = C.cab, vis = x === 0 ? 0 : -Math.sign(x) * dir, seen = (e) => !vis || e === vis;   // the side toward the track (both, for a car placed by its own matrix)
    for (const e of [-1, 1]) {   // the pillars over the glass; on the side you see, the crease along the doors and their handles
      for (const [p, q] of [[a0, a1], [a2, a3]]) { const A = at(e * px, p[1], p[0]), B = at(e * px, q[1], q[0]); beam(b, VC.solid, A.x, A.y, A.z, B.x, B.y, B.z, 0.08, roofCol); }
      for (const u of C.pil) part(G.box, VC.solid, roofCol, e * px, (C.belt + C.top) / 2, u, 0.04, C.top - C.belt, 0.1);
      if (!seen(e)) continue;
      part(G.box, VC.solid, shade(col, 0.72), e * (hw + 0.004), C.belt - 0.28, 0.1, 0.012, 0.02, C.L * 0.62);
      part(G.box, VC.solid, '#2a2a2e', e * (hw + 0.006), C.belt - 0.12, C.cab[0][0] - 0.75, 0.01, 0.04, 0.16);
    }
    if (kind === 'pickup') { for (const e of [-1, 1]) part(G.box, VC.solid, col, e * (hw - 0.05), 0.99, -1.6, 0.1, 0.26, 2.1); part(G.box, VC.solid, col, 0, 0.99, -2.62, W - 0.1, 0.26, 0.08); part(G.box, VC.solid, '#2a2a2e', 0, 0.87, -1.6, W - 0.2, 0.02, 2.1); }
    if (kind === 'police') {   // black and white: the doors white, the star on them, the light bar on the roof
      for (const e of [-1, 1]) { part(G.box, VC.solid, '#f4f4f0', e * (hw + 0.004), 0.62, -0.2, 0.02, 0.5, 2.3); part(G.cyl8, VC.solid, '#d8b048', e * (hw + 0.012), 0.66, -0.2, 0.3, 0.01, 0.3, 0, Math.PI / 2); }
      part(G.box, VC.solid, '#1a1a1e', 0, C.top + 0.07, -0.3, 1.25, 0.1, 0.26);
      part(G.box, VC.glow, hdr('#ff2a2a', lit ? 3 : 1.6), -0.36, C.top + 0.08, -0.3, 0.5, 0.11, 0.24); part(G.box, VC.glow, hdr('#2a5aff', lit ? 3 : 1.6), 0.36, C.top + 0.08, -0.3, 0.5, 0.11, 0.24);
    } else if (kind === 'taxi') { part(G.box, VC.glow, hdr('#fff0b0', 1.3), 0, C.top + 0.13, -0.3, 0.75, 0.22, 0.32); for (const e of [-1, 1]) part(G.box, VC.solid, '#1a1a1e', e * (hw + 0.004), 0.66, -0.2, 0.01, 0.12, 1.9); }
    for (const u of [C.wu, -C.wu]) for (const e of [-1, 1]) {   // the wheels: the tyres, their hubs (whitewalls on the classics), the front ones turned with curb
      const st = u > 0 ? curb : 0, hub = (o) => [e * (hw - 0.11) + e * o * Math.cos(st), C.wr, u + (e * o * Math.sin(st)) / k];
      part(WHEEL, VC.solid, '#141414', e * (hw - 0.11), C.wr, u, C.wr * 2, 0.24, C.wr * 2, 0, Math.PI / 2, st);
      if (!seen(e)) continue;
      part(G.cyl8, VC.solid, '#121214', e * (hw + 0.004), C.wr + 0.03, u, C.wr * 2.36, 0.01, C.wr * 2.36, 0, Math.PI / 2);   // the wheel arch, dark round the tyre
      part(G.cyl6, kind === 'classic' ? VC.solid : VC.metal, kind === 'classic' ? '#f4f4f0' : '#b8bcc4', ...hub(0.122), C.wr * 1.25, 0.02, C.wr * 1.25, 0, Math.PI / 2, st);
      if (kind === 'classic') part(G.cyl6, VC.metal, '#e8eaec', ...hub(0.13), C.wr * 0.8, 0.02, C.wr * 0.8, 0, Math.PI / 2, st);
    }
    for (const e of [-1, 1]) {
      part(G.plane, VC.glow, hdr('#fff4d0', lit ? 2.2 : 0.5), e * (hw - 0.3), C.hl, F + 0.035, 0.36, 0.13, 1, 0, 0, Math.PI);   // the headlamps, the tail lamps, the mirrors
      part(G.plane, VC.glow, hdr('#ff2a2a', lit ? 1.6 : 0.6), e * (hw - 0.24), C.tl, -F - 0.035, 0.34, 0.12, 1);
      part(G.box, VC.solid, col, e * (hw + 0.09), C.belt + 0.06, C.cab[0][0] - 0.1, 0.16, 0.1, 0.07);
    }
    part(G.box, kind === 'classic' ? VC.metal : VC.solid, chrome, 0, 0.42, F + 0.04, W - 0.04, 0.15, 0.12);   // the bumpers, the grille, the plate
    part(G.box, kind === 'classic' ? VC.metal : VC.solid, chrome, 0, 0.42, -F - 0.04, W - 0.04, 0.15, 0.12);
    part(G.box, kind === 'classic' ? VC.metal : VC.solid, kind === 'classic' ? '#c8ccd2' : '#1a1a1e', 0, C.hl - 0.04, F + 0.015, W * 0.42, 0.17, 0.04);
    part(G.box, VC.solid, '#e8e8f0', 0, 0.56, -F - 0.03, 0.32, 0.16, 0.02);
  };
  K.muniBus = (b, x, z, dir = 1) => {   // a Muni trolley bus: white, the red band low down, the windows between their pillars, the doors on the kerb side, the windscreen and its amber sign, the mirrors, the bike rack folded on the front, the wheels and hubs; its two poles trailing back up to the wires, the ropes down to their retrievers
    const s = Math.sign(x) || 1, fz = z - dir * 6;
    b.block(VC.solid, '#eceef0', x, 0.32, z, 2.55, 2.9, 12);
    b.box(VC.solid, '#c8202a', x, 0.68, z, 2.57, 0.46, 12);   // the red band
    b.box(VC.solid, '#3a3a40', x, 0.4, z, 2.58, 0.14, 11.6);
    b.box(VC.solid, '#c8ccd2', x, 3.27, z, 2.4, 0.08, 11.6);
    for (const e of [-1, 1]) {
      b.box(VC.glow, hdr('#2a3446', 1), x + e * 1.28, 2.15, z, 0.03, 1.0, 10.6); b.box(VC.glow, hdr('#fff0d0', 0.7), x + e * 1.285, 2.15, z + rand(-3, 3), 0.03, 0.9, 3.2);
      for (let k = 0; k <= 8; k++) b.box(VC.solid, '#d8dce0', x + e * 1.297, 2.15, z - 5.3 + k * 1.325, 0.02, 1.04, 0.1);
      const mr = e === -s ? 1.4 : 1.6;   // the mirrors (the one on the track's side kept short of it)
      beam(b, VC.metal, x + e * 1.28, 2.7, fz + dir * 0.3, x + e * mr, 2.5, fz - dir * 0.2, 0.05, '#1a1a1e'); b.box(VC.solid, '#1a1a1e', x + e * (mr + 0.02), 2.2, fz - dir * 0.25, 0.08, 0.5, 0.25);
    }
    for (const dz of [-4.4, 1.6]) { b.box(VC.glow, hdr('#3a4a5e', 1.1), x + s * 1.29, 1.55, z + dir * dz, 0.03, 2.3, 1.15); b.box(VC.solid, '#5a5e66', x + s * 1.3, 1.55, z + dir * dz, 0.02, 2.3, 0.06); }   // the doors
    b.box(VC.glow, hdr('#2a3446', 1), x, 1.95, fz - dir * 0.01, 2.3, 1.5, 0.03);
    b.add(G.plane, K.label('22 FILLMORE', { w: 512, h: 96, color: '#ffb02a', bg: '#141414', font: SANS, weight: 700, size: 0.6, k: 1.8 }), x, 2.98, fz - dir * 0.03, 1.7, 0.3, 1, 0, dir > 0 ? Math.PI : 0, 0);
    for (const e of [-1, 1]) { b.box(VC.glow, hdr('#fff4d0', 1.6), x + e * 0.9, 0.95, fz - dir * 0.02, 0.32, 0.16, 0.03); b.add(G.box, VC.solid, x + e * 0.4, 1.35, fz - dir * 0.03, 0.04, 0.7, 0.02, 0, 0, e * 0.6, '#1a1a1e'); }   // the lamps, the wipers
    b.box(VC.metal, '#5a5e64', x, 0.85, fz - dir * 0.25, 1.6, 0.06, 0.5); for (const e of [-0.5, 0.5]) b.box(VC.metal, '#5a5e64', x + e, 0.95, fz - dir * 0.45, 0.04, 0.3, 0.04);
    for (const dz of [-4, 3.8]) for (const e of [-1, 1]) { b.cyl(VC.solid, '#141414', x + e * 1.15, 0.5, z + dz, 0.5, 0.36, 'cyl', 0, Math.PI / 2); b.cyl(VC.metal, '#b8bcc4', x + e * 1.34, 0.5, z + dz, 0.3, 0.03, 'cyl8', 0, Math.PI / 2); }
    b.box(VC.metal, '#8a9098', x, 3.42, z - dir * 1.8, 1.7, 0.32, 2.6);   // the poles' base, its cover
    const wx = x > 0 ? x - 0.2 : x + 0.2;   // the poles trail back from it to the wires over the parking lane
    for (const dx of [-0.3, 0.3]) {
      beam(b, VC.metal, x + dx, 3.55, z - dir * 2.4, wx + dx, 5.92, z + dir * 4.4, 0.05, '#2a2a2e');
      b.box(VC.metal, '#1a1a1e', wx + dx, 5.96, z + dir * 4.4, 0.08, 0.1, 0.4);   // the shoe on the wire
      beam(b, VC.solid, wx + dx, 5.8, z + dir * 4.2, x + dx, 2.9, z + dir * 6.05, 0.015, '#1a1a1e');   // the rope down to the retriever
    }
    for (const e of [-0.3, 0.3]) b.box(VC.metal, '#3a3a40', x + e, 2.75, z + dir * 6.08, 0.3, 0.4, 0.12);   // the retrievers
  };
  K.vwBus = (b, x, z, dir = pick([-1, 1])) => {   // a split-window bus, two-tone, the V on its nose, painted with flowers and peace signs
    const col = pick(['#ff7a2a', '#39b8d8', '#e8c030', '#e8506a', '#6ab43a']), cream = '#f4f0e4', M0 = new THREE.Matrix4().makeRotationY(dir > 0 ? 0 : Math.PI).setPosition(x, 0, z);
    const part = (geo, mat, c, px, py, pu, sx, sy, sz, rx = 0, rz = 0) => b.addM(geo, mat, new THREE.Matrix4().compose(_cv.set(px, py, -pu), _cq.setFromEuler(_ce.set(rx, 0, rz)), _cs.set(sx, sy, sz)).premultiply(M0), c);
    b.addM(VWBODY, VC.solid, M0, cream);   // the body's side profile (a flat nose, the roof's round corners) across its width
    part(G.box, VC.solid, col, 0, 0.72, 0, 1.76, 0.84, 4.32);   // the lower colour, and the V it dips into on the nose
    for (const e of [-1, 1]) part(G.box, VC.solid, col, e * 0.32, 1.12, 2.157, 0.82, 0.22, 0.03, 0, -e * 0.62);
    part(G.cyl, VC.metal, '#e8eaec', 0, 1.0, 2.17, 0.36, 0.03, 0.36, Math.PI / 2);   // the round badge in the V
    for (const e of [-1, 1]) { part(G.box, VC.glow, hdr('#3a4a5e', 0.9), e * 0.42, 1.62, 2.16, 0.7, 0.42, 0.03); part(G.cyl, VC.glow, hdr('#fff4d0', 0.6), e * 0.66, 1.0, 2.16, 0.24, 0.03, 0.24, Math.PI / 2); }   // the split windscreen, the round headlamps
    part(G.box, VC.solid, cream, 0, 1.62, 2.165, 0.08, 0.46, 0.03);
    for (const e of [-1, 1]) for (let k = 0; k < 4; k++) part(G.box, VC.glow, hdr('#3a4a5e', 0.9), e * 0.87, 1.6, 1.25 - k * 0.92, 0.03, 0.42, 0.72);   // the side windows
    for (const e of [-1, 1]) for (let k = 0; k < 5; k++) part(G.box, VC.glow, hdr('#4a5a6e', 0.9), e * 0.6, 2.005, 1.3 - k * 0.66, 0.26, 0.02, 0.42);   // the skylights along the roof's edges
    for (const pu of [2.2, -2.2]) part(G.box, VC.metal, '#e8eaec', 0, 0.48, pu, 1.84, 0.1, 0.1);   // the bumpers
    for (const e of [-1, 1]) part(G.box, VC.glow, hdr('#ff2a2a', 0.6), e * 0.72, 1.0, -2.17, 0.1, 0.22, 0.03);
    for (const pu of [1.45, -1.45]) for (const e of [-1, 1]) { part(WHEEL, VC.solid, '#141414', e * 0.78, 0.33, pu, 0.66, 0.2, 0.66, 0, Math.PI / 2); part(G.cyl8, VC.solid, '#f4f4f0', e * 0.885, 0.33, pu, 0.4, 0.02, 0.4, 0, Math.PI / 2); }
    for (let k = 0; k < 10; k++) { const e = pick([-1, 1]), fu = rand(-1.9, 1.9), fy = rand(0.5, 1.4), c = pick(['#ffffff', '#ff3d7f', '#ffd23d', '#39d8ff', '#7cff5a']), r = rand(0.16, 0.34); part(G.cyl8, VC.solid, c, e * 0.885, fy, fu, r, 0.02, r, 0, Math.PI / 2); if (chance(0.3)) part(G.cyl8, VC.solid, col, e * 0.89, fy, fu, r * 0.35, 0.02, r * 0.35, 0, Math.PI / 2); }   // flowers, their hearts
    for (const e of [-1, 1]) {   // a peace sign on each side: a white ring, the strokes across it
      const pu = rand(-1.2, 0.6);
      part(G.cyl, VC.solid, '#ffffff', e * 0.886, 1.0, pu, 0.66, 0.012, 0.66, 0, Math.PI / 2); part(G.cyl, VC.solid, col, e * 0.89, 1.0, pu, 0.54, 0.012, 0.54, 0, Math.PI / 2);
      part(G.box, VC.solid, '#ffffff', e * 0.894, 1.0, pu, 0.012, 0.58, 0.05); for (const f of [-1, 1]) part(G.box, VC.solid, '#ffffff', e * 0.894, 0.9, pu + f * 0.09, 0.012, 0.3, 0.05, f * 0.8);
    }
  };
  K.lowrider = (b, x, z, dir = pick([-1, 1]), { up = chance(0.25) } = {}) => {   // a long, low candy-painted cruiser on wire wheels, a chrome strip down each side; some sit with the nose up on the hydraulics
    const col = pick(['#c8104a', '#2a3ab4', '#7a1ab4', '#0a8a8a', '#e8a018', '#1a1a1e', '#d82a8a']);
    K.place(b, (t) => {
      K.car(t, 0, 0, dir, { kind: 'classic', col, lit: false, y: -0.06, len: 5.4 });
      for (const e of [-1, 1]) t.box(VC.metal, '#e8eaec', e * 0.99, 0.55, 0, 0.02, 0.05, 4.8);
      for (const u of [1.62, -1.62]) for (const e of [-1, 1]) for (let j = 0; j < 6; j++) t.add(G.box, VC.metal, e * 1.0, 0.26, -u * dir, 0.01, 0.4, 0.02, (j * Math.PI) / 6, 0, 0, '#d8dce0');   // the wire wheels' spokes
    }, new THREE.Matrix4().makeRotationX(up ? dir * 0.12 : 0).setPosition(x, up ? 0.32 : 0, z));
  };
  K.carRow = (b, x, z0, z1, { gaps = [], dir = null, n = 99, p = 0.75, kinds = null, curb = false } = {}) => {   // cars parked nose to tail along the kerb lane (curb: their wheels turned into it)
    let k = 0;
    for (let z = z0 + rand(0, 3); z < z1 - 2.5 && k < n; z += rand(5.6, 7.6)) {
      if (gaps.some(([a, c]) => z + 2.5 > a && z - 2.5 < c) || !chance(p)) continue;
      const f = kinds ? pick(kinds) : K.car, d = dir ?? pick([-1, 1]);
      if (f === K.car) K.car(b, x, -z, d, curb ? { curb: -Math.sign(x) * d * 0.42 } : {}); else f(b, x, -z, d);
      k++;
    }
  };

  // ---------- street furniture ----------
  K.lamp = (b, x, z, side, { h = 8.4, reach = 2.7, col = '#ffe6b8', k = 2.2, pool = 0.1 } = {}) => {   // a grey-green pole tapering up from its base, its curved mast arm out over the parking lane on a brace, the cobra head lit
    b.add(taperGeo(0.6, 8), VC.metal, x, h / 2, z, 0.2, h, 0.2, 0, 0, 0, '#5a6460');
    b.cyl(VC.metal, '#4e5854', x, 0.45, z, 0.17, 0.9, 'cyl8'); b.box(VC.metal, '#4e5854', x, 0.03, z, 0.46, 0.06, 0.46);
    b.box(VC.metal, '#6a7470', x - side * 0.17, 0.55, z, 0.02, 0.3, 0.12);   // the access door
    const ex = x - side * reach;
    beam(b, VC.metal, x, h - 0.5, z, x - side * reach * 0.5, h + 0.15, z, 0.07, '#5a6460');
    beam(b, VC.metal, x - side * reach * 0.5, h + 0.15, z, ex, h + 0.05, z, 0.07, '#5a6460');
    beam(b, VC.metal, x, h - 1.2, z, x - side * reach * 0.4, h + 0.12, z, 0.035, '#5a6460');
    b.add(G.box, VC.metal, ex + side * 0.1, h - 0.03, z, 0.75, 0.2, 0.42, 0, 0, side * 0.05, '#6a7470');   // the head: its hood, tapering to the nose, the lens under it
    b.add(G.box, VC.metal, ex - side * 0.36, h - 0.06, z, 0.34, 0.14, 0.3, 0, 0, side * 0.12, '#6a7470');
    b.box(VC.glow, hdr(col, k), ex, h - 0.15, z, 0.8, 0.05, 0.32);
    if (pool) K.pool(b, ex, z, 7, 7, hdr(col, pool));
  };
  K.pathOfGold = (b, x, z, side) => {   // Market Street's Path of Gold: a dark iron standard on its ornate base, the plain shaft ringed, the crown of scrolled arms holding three amber globes
    const iron = '#1e2824', cast = '#2a3430';
    b.cyl(VC.metal, iron, x, 0.35, z, 0.36, 0.7, 'cyl8'); b.cyl(VC.metal, iron, x, 0.85, z, 0.28, 0.3, 'cyl8'); b.add(taperGeo(0.6, 8), VC.metal, x, 1.35, z, 0.44, 0.7, 0.44, 0, 0, 0, iron);   // the base and its mouldings
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; b.add(G.box, VC.metal, x + Math.cos(a) * 0.3, 0.6, z + Math.sin(a) * 0.3, 0.12, 0.62, 0.1, 0.15, -a, 0, cast); }   // the cast figures round it
    b.cyl(VC.metal, iron, x, 4.4, z, 0.1, 5.4, 'cyl8');
    for (const y of [2.2, 4.6, 6.9]) b.cyl(VC.metal, cast, x, y, z, 0.14, 0.12, 'cyl8');   // the shaft's rings
    b.add(taperGeo(1.7, 8), VC.metal, x, 7.5, z, 0.22, 1.0, 0.22, 0, 0, 0, iron);
    for (const e of [-1, 1]) {   // two scrolled arms along the street, a globe on each under its cap, the pendant below it
      const lz = z + e * 0.75;
      beam(b, VC.metal, x, 7.7, z, x, 7.92, z + e * 0.48, 0.06, iron); beam(b, VC.metal, x, 7.92, z + e * 0.48, x, 7.74, lz, 0.06, iron);
      b.cyl(VC.metal, iron, x, 7.72, lz, 0.1, 0.12, 'cyl8'); b.add(G.cone8, VC.metal, x, 7.42, lz, 0.14, 0.42, 0.14, Math.PI, 0, 0, iron);
      b.add(GLOBE, VC.glow, x, 8.03, lz, 0.48, 0.48, 0.48, 0, 0, 0, hdr('#ffcf7a', 2.0));
      b.add(G.cone8, VC.metal, x, 8.34, lz, 0.2, 0.16, 0.2, 0, 0, 0, iron);
    }
    b.cyl(VC.metal, iron, x, 8.14, z, 0.09, 0.5, 'cyl8');
    b.add(GLOBE, VC.glow, x, 8.62, z, 0.54, 0.54, 0.54, 0, 0, 0, hdr('#ffcf7a', 2.2));   // the top globe, its cap and finial
    b.add(G.cone8, VC.metal, x, 8.97, z, 0.24, 0.2, 0.24, 0, 0, 0, iron); b.cyl(VC.metal, iron, x, 9.14, z, 0.03, 0.18, 'cyl6');
    K.pool(b, x - side * 0.6, z, 6, 6, hdr('#ffd890', 0.12));
  };
  K.hydrant = (b, x, z, col = pick(BONNET)) => {   // the city's fire hydrants: a white body on its flange, the nozzles and their caps, the bonnet painted by the system it draws on, the pentagon nut on top
    b.cyl(VC.solid, '#e2e0da', x, 0.04, z, 0.22, 0.08, 'cyl8');
    b.cyl(VC.solid, '#f2f0ea', x, 0.38, z, 0.16, 0.62, 'cyl8');
    b.cyl(VC.solid, '#e2e0da', x, 0.69, z, 0.19, 0.06, 'cyl8');
    b.cyl(VC.solid, col, x, 0.78, z, 0.15, 0.14, 'cyl8');
    b.sph(VC.solid, col, x, 0.86, z, 0.11, true);
    b.cyl(VC.solid, shade(col, 0.8), x, 0.97, z, 0.035, 0.07, 'cyl6');
    for (const e of [-1, 1]) { b.cyl(VC.solid, '#f2f0ea', x + e * 0.2, 0.46, z, 0.07, 0.14, 'cyl6', 0, Math.PI / 2); b.cyl(VC.solid, col, x + e * 0.28, 0.46, z, 0.075, 0.04, 'cyl6', 0, Math.PI / 2); }
    b.cyl(VC.solid, '#f2f0ea', x, 0.4, z + 0.2, 0.09, 0.14, 'cyl6', Math.PI / 2); b.cyl(VC.solid, col, x, 0.4, z + 0.28, 0.095, 0.04, 'cyl6', Math.PI / 2);   // the pumper nozzle
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
  K.bin = (b, x, z) => {   // the city's green litter bin: its panelled body, the round-topped lid, the slot
    b.block(VC.solid, '#2a4a3a', x, 0, z, 0.62, 1.0, 0.62);
    for (const e of [-1, 1]) { b.box(VC.solid, '#1e3a2c', x + e * 0.315, 0.5, z, 0.02, 0.76, 0.48); b.box(VC.solid, '#1e3a2c', x, 0.5, z + e * 0.315, 0.48, 0.76, 0.02); }
    b.box(VC.solid, '#1e3a2c', x, 1.03, z, 0.68, 0.07, 0.68);
    b.add(G.cyl8, VC.solid, x, 1.06, z, 0.62, 0.62, 0.3, Math.PI / 2, 0, 0, '#2a4a3a');
    for (const e of [-1, 1]) b.box(VC.solid, '#0e1a14', x, 0.84, z + e * 0.32, 0.36, 0.08, 0.02);
  };
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
  K.bikeDock = (b, x, z, n = randi(4, 8)) => {   // a row of shared bikes in their docks, the station's kiosk and its map panel at the end
    b.box(VC.metal, '#3a3e44', x, 0.05, z - (n * 0.75) / 2, 0.3, 0.1, n * 0.75 + 0.4);
    for (let k = 0; k < n; k++) {
      b.box(VC.metal, '#5a5e64', x + 0.34, 0.45, z - k * 0.75, 0.14, 0.8, 0.2);   // the dock, its lamp
      b.box(VC.glow, hdr(chance(0.85) ? '#39ff88' : '#ff3a3a', 1.6), x + 0.34, 0.8, z - k * 0.75 + 0.102, 0.06, 0.04, 0.01);
      K.bike(b, x, z - k * 0.75, Math.PI / 2, { col: '#2a2a2e' });
    }
    const kz = z + 0.9;
    b.block(VC.metal, '#3a3e44', x + 0.1, 0, kz, 0.5, 1.6, 0.4); b.box(VC.glow, hdr('#cfe6ff', 1.2), x - 0.16, 1.25, kz, 0.02, 0.3, 0.24);
    b.box(VC.solid, '#3a3e44', x + 0.1, 1.4, kz + 0.7, 0.08, 1.6, 0.9); for (const e of [-1, 1]) b.box(VC.glow, hdr('#f4f0e8', 0.6), x + 0.1 + e * 0.045, 1.6, kz + 0.7, 0.01, 0.9, 0.78);
  };
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
  // a window in the frame F at (x, y) on the plane z, w × h: its frame, the sashes' meeting rail, the sill under it; its
  // hood in the trim colour, flat, a segmental arch over it (ped 'seg') or a little pediment ('tri')
  const win = (F, x, y, z, w, h, trim, g, { hood = true, ry = 0, nx = 0, nz = 1, ped = null, sill = true } = {}) => {
    F.add(G.plane, VC.solid, x + nx * 0.03, y, z + nz * 0.03, w + 0.24, h + 0.26, 1, 0, ry, 0, trim);
    F.add(G.plane, VC.glow, x + nx * 0.05, y, z + nz * 0.05, w, h, 1, 0, ry, 0, g);
    F.add(G.plane, VC.solid, x + nx * 0.06, y, z + nz * 0.06, w, 0.06, 1, 0, ry, 0, trim);   // the meeting rail of the sashes
    if (sill) F.add(G.box, VC.solid, x + nx * 0.07, y - h / 2 - 0.16, z + nz * 0.07, w + 0.36, 0.08, 0.16, 0, ry, 0, trim);
    if (!hood) return;
    F.add(G.box, VC.solid, x + nx * 0.08, y + h / 2 + 0.2, z + nz * 0.08, w + 0.42, 0.16, 0.18, 0, ry, 0, trim);
    if (ped === 'seg') F.add(HALFDISC, VC.solid, x + nx * 0.08, y + h / 2 + 0.27, z + nz * 0.08, w + 0.42, 0.56, 0.14, 0, ry, 0, trim);
    else if (ped === 'tri') F.addM(prism(w + 0.5, 0.42, 0.14), VC.solid, new THREE.Matrix4().makeRotationY(ry).setPosition(x + nx * 0.15, y + h / 2 + 0.27, z + nz * 0.15), trim);
  };
  K.prism = prism; K.gableFace = gableFace; K.win = win; K.glass = glass;
  K.house = (b, s, xf, zc, { w = 7.6, d = rand(11, 14), floors = randi(2, 3), style = pick(['italianate', 'italianate', 'stick', 'queen', 'queen']), col = pick(PAINTED), trim = pick(TRIM), acc = pick(ACCENT),
    base = 0, yd = xf - EDGE - 7, garage = chance(0.45), shop = null, lit = 0.42, turret = null, yard = true, flip = false, foot = 2, stoop = true, lo = false } = {}) => {   // lo: seen from far off, the small ornament left off
    const F = frame(b, s * xf, base, zc, 1, face(s)), sunny = s > 0;
    const deep = yd >= 2.8;   // a front garden deep enough for a full stoop (otherwise a few steps up to a garden flat)
    const G0 = shop ? 3.8 : deep ? 2.3 : 0.75, FH = 3.4, top = G0 + floors * FH, hw = w / 2;
    if (turret === null) turret = style === 'queen' && floors > 1 && chance(0.3);
    if (!deep) garage = false;
    // the body in clapboard, carried down below the ground so it never shows a gap on a slope or a terrace
    F.addM(K.tiledBox(w, top + foot, d, 2), K.sidingMat, new THREE.Matrix4().makeTranslation(0, (top - foot) / 2, -d / 2), col);
    const fine = !lo;
    if (style === 'italianate' && fine) for (let y = G0 + 0.4, k = 0; y < top - 0.3; y += 1.25, k++) for (const e of [-1, 1]) F.box(VC.solid, trim, e * (hw - (k % 2 ? 0.18 : 0.26)), y, 0.06, k % 2 ? 0.36 : 0.52, 0.8, 0.12);   // quoins up the corners
    else for (const e of [-1, 1]) F.box(VC.solid, trim, e * (hw - 0.12), (G0 + top) / 2, 0.06, 0.24, top - G0, 0.12);   // corner boards
    // the bay: on the left half of the front
    const mx = flip ? -1 : 1, bx = mx * (-hw + 2.15), bp = style === 'stick' ? 0.8 : 0.85, ba = 1.9, by0 = G0 + 0.1, by1 = top - (style === 'queen' ? 0.2 : 0.6);
    if (style === 'stick') {
      F.box(VC.solid, col, bx, (by0 + by1) / 2, bp / 2, 3.4, by1 - by0, bp);
      for (let f = 0; f < floors; f++) { const y = G0 + f * FH + 1.75; for (const dx of [-1.05, 0, 1.05]) win(F, bx + dx, y, bp + 0.03, 0.78, 2.0, trim, glass(lit, sunny), { hood: dx === 0, ped: dx === 0 && fine ? 'tri' : null, sill: fine }); }
      for (let e = -1; e <= 1; e += 2) F.box(VC.solid, trim, bx + e * 1.7, (by0 + by1) / 2, bp + 0.02, 0.14, by1 - by0, 0.08);
      F.box(VC.solid, trim, bx, by1 + 0.12, bp / 2 + 0.05, 3.7, 0.26, bp + 0.2);
      F.box(VC.solid, acc, bx, by0 - 0.1, bp / 2, 3.3, 0.3, bp);
    } else {
      F.box(VC.solid, col, bx, (by0 + by1) / 2, bp, ba, by1 - by0, 0.14);
      for (const e of [-1, 1]) F.add(G.box, VC.solid, bx + e * (ba / 2 + bp / 2), (by0 + by1) / 2, bp / 2, bp * Math.SQRT2, by1 - by0, 0.14, 0, e * Math.PI / 4, 0, col);
      for (let f = 0; f < floors; f++) {
        const y = G0 + f * FH + 1.75;
        win(F, bx, y, bp + 0.08, 0.95, 2.05, trim, glass(lit, sunny), { ped: style === 'italianate' && fine ? 'seg' : null, sill: fine });
        for (const e of [-1, 1]) { const nx = e / Math.SQRT2, nz = 1 / Math.SQRT2; win(F, bx + e * (ba / 2 + bp / 2) + nx * 0.08, y, bp / 2 + nz * 0.08, 0.55, 2.05, trim, glass(lit, sunny), { hood: false, ry: e * Math.PI / 4, nx, nz, sill: fine }); }
        if (fine) F.box(VC.solid, shade(col, 0.88), bx, y - 1.5, bp + 0.09, 0.9, 0.42, 0.03);   // the panel under the window
        if (f) F.box(VC.solid, trim, bx, G0 + f * FH, bp / 2 + 0.06, ba + 2 * bp + 0.1, 0.2, bp + 0.16);   // the band between the floors
      }
      F.box(VC.solid, trim, bx, by1 + 0.14, bp / 2 + 0.06, ba + 2 * bp + 0.4, 0.28, bp + 0.3);
      F.box(VC.solid, acc, bx, by0 - 0.1, bp / 2, ba + 2 * bp - 0.2, 0.3, bp);
      if (fine) for (const o of [-1, -0.5, 0, 0.5, 1]) F.box(VC.solid, trim, bx + o * (ba / 2 + bp * 0.42), by1 - 0.16, bp + 0.14, 0.12, 0.44, 0.24);   // the brackets under the bay's cornice
    }
    // the right half: the door (up its stoop) and a window over it on every floor (a turret takes the upper floors' corner)
    const dx = mx * (hw - 1.75);
    for (let f = shop ? 1 : 0; f < (turret ? 1 : floors); f++) win(F, dx, G0 + f * FH + 1.75, 0.05, 0.9, 2.0, trim, glass(lit, sunny), { ped: !fine ? null : style === 'italianate' ? 'seg' : style === 'stick' ? 'tri' : null, sill: fine });
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
      if (fine) { for (const py of [G0 + 0.45, G0 + 1.05]) F.box(VC.solid, shade(acc, 0.78), dx, py, 0.075, 0.62, 0.42, 0.02); F.box(VC.glow, hdr(pick(WARM), 0.7), dx, G0 + 1.72, 0.075, 0.62, 0.62, 0.02); }   // the door's panels, the glass over them
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
          F.box(VC.solid, trim, dx + e * 0.78, 0.55, L - 0.05, 0.18, 1.1, 0.18); if (fine) F.box(VC.solid, trim, dx + e * 0.78, 1.15, L - 0.05, 0.26, 0.1, 0.26);
          for (let k = 1; k < n; k += 3) F.box(VC.solid, trim, dx + e * 0.78, (k * G0) / n + 0.45, (n - k) * run, 0.04, 0.9, 0.04);
        }
      }
      if (yard && deep && !garage) {   // the little front garden: a low iron fence, a hydrangea or two
        const fx0 = Math.min(mx * (-hw + 0.1), dx - mx * 0.85), fx1 = Math.max(mx * (-hw + 0.1), dx - mx * 0.85);
        F.add(G.plane, VC.solid, (fx0 + fx1) / 2, 0.04, yd / 2, fx1 - fx0, yd, 1, -Math.PI / 2, 0, 0, '#5a7a3a');
        F.box(VC.metal, '#1a1c1e', (fx0 + fx1) / 2, 0.95, yd - 0.08, fx1 - fx0, 0.04, 0.04);
        for (let x = fx0; x <= fx1 + 0.01; x += 0.5) F.box(VC.metal, '#1a1c1e', x, 0.5, yd - 0.08, 0.03, 1.0, 0.03);
        if (chance(0.75)) K.hydrangea(F, bx + rand(-0.8, 0.8), yd / 2, { n: 2 });
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
      if (fine) { for (let k = 1; k < 8; k += 1) { const a = (Math.PI * k) / 8; F.box(VC.solid, trim, Math.cos(a) * 0.36, top + 2.0 + Math.sin(a) * 0.36, 0.33, 0.62, 0.06, 0.03, 0, 0, a); } F.box(VC.solid, trim, 0, top + 2.0, 0.34, 0.2, 0.2, 0.04); }   // the sunburst over the attic window
      F.cyl(VC.solid, trim, 0, top + gh + 0.32, 0.32, 0.05, 0.64, 'cyl6'); F.add(G.cone4, VC.solid, 0, top + gh + 0.74, 0.32, 0.16, 0.26, 0.16, 0, 0, 0, trim);   // the finial at its peak
      if (fine && chance(0.35)) { const cx = -mx * (hw - 0.55), ch = gh * (1 - (hw - 0.55) / (hw + 0.25)) + 1.1; F.block(VC.solid, '#a8584a', cx, top + 0.4, -d * 0.5, 0.7, ch - 0.4, 1.0); F.box(VC.solid, '#6a3a32', cx, top + ch + 0.06, -d * 0.5, 0.82, 0.12, 1.12); }   // a chimney up through the roof
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
    if (fine) for (let x = -hw + 0.82; x < hw - 0.4; x += 0.85) F.box(VC.solid, trim, x, top + 0.08, 0.5, 0.14, 0.14, 0.16);   // the dentils between the brackets
    F.box(VC.solid, shade(col, 0.95), 0, top + 0.95, -d / 2, w, 0.6, d);
    if (fine && chance(0.3)) { const cx = -mx * (hw - 0.55); F.block(VC.solid, '#a8584a', cx, top + 1.2, -d * 0.55, 0.7, 1.1, 1.0); F.box(VC.solid, '#6a3a32', cx, top + 2.36, -d * 0.55, 0.82, 0.12, 1.12); }   // a chimney
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
  K.mariachi = (b, x, z, side) => {   // a trio in their charro suits and wide sombreros, playing: guitar, trumpet, violin
    const ry = side < 0 ? -Math.PI / 2 : Math.PI / 2, gold = '#e8c060';
    ['guitar', 'trumpet', 'violin'].forEach((play, k) => {
      const pz = z + (k - 1) * 0.85, F = frame(b, x, 0, pz, 1, ry);   // in each one's frame: x across, -z the way they face
      K.person(b, x, pz, { s: 1, ry, top: '#1a1a1e', legs: '#1a1a1e', hat: 'bald', bag: false, phone: false, play });
      F.cyl(VC.solid, '#2a2420', 0, 1.86, 0, 0.46, 0.05, 'cyl'); F.add(G.cone8, VC.solid, 0, 2.02, 0, 0.34, 0.32, 0.34, 0, 0, 0, '#2a2420'); F.cyl(VC.solid, gold, 0, 1.9, 0, 0.18, 0.04, 'cyl8');   // the sombrero, its gold band
      for (const e of [-1, 1]) for (let j = 0; j < 4; j++) F.box(VC.solid, gold, e * 0.17, 0.75 - j * 0.14, 0, 0.02, 0.04, 0.04);   // the buttons down the trousers
      F.box(VC.solid, '#f4f0e8', 0, 1.42, -0.125, 0.12, 0.1, 0.01); F.box(VC.solid, '#c8202a', 0, 1.36, -0.13, 0.16, 0.05, 0.01);   // the shirt, the bow
      if (play === 'guitar') { F.add(G.sphLow, VC.solid, 0.02, 1.0, -0.22, 0.44, 0.5, 0.13, 0, 0, 0.5, '#c8803a'); F.cyl(VC.solid, '#2a1a10', 0.04, 1.02, -0.29, 0.07, 0.01, 'cyl8', Math.PI / 2); F.beam(VC.solid, '#3a2a1a', [0.1, 1.08, -0.24], [-0.46, 1.36, -0.3], 0.05); }
      else if (play === 'trumpet') { F.limb(VC.metal, gold, [0, 1.6, -0.2], [0, 1.56, -0.5], 0.025, 0.025, 6); F.add(G.cone8, VC.metal, 0, 1.55, -0.58, 0.16, 0.16, 0.16, Math.PI / 2, 0, 0, gold); }
      else { F.add(G.sphLow, VC.solid, -0.12, 1.44, -0.24, 0.16, 0.06, 0.34, 0, 0.5, 0.2, '#8a4a2a'); F.beam(VC.solid, '#d8c8a0', [0.3, 1.5, -0.14], [-0.22, 1.44, -0.42], 0.015); }
    });
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
  // a classical column from y up h, r its radius at the foot: the plinth and the torus of its base, the shaft tapering a
  // little, the necking ring, the capital's bell flaring to the square abacus (corinth: two rows of leaves round the bell)
  K.column = (b, mat, x, y, z, h, r, col, { cap = 'corinth', top = shade(col, 1.05), lo = false } = {}) => {   // lo: eight-sided, its leaves left off (a long colonnade)
    b.add(G.box, mat, x, y + 0.09, z, r * 2.7, 0.18, r * 2.7, 0, 0, 0, shade(col, 0.94));
    b.add(lo ? G.cyl8 : G.cyl, mat, x, y + 0.26, z, r * 2.4, 0.16, r * 2.4, 0, 0, 0, col);
    b.add(lo ? SHAFT8 : SHAFT, mat, x, y + 0.34 + (h - 1.0) / 2, z, r * 2, h - 1.0, r * 2, 0, 0, 0, col);
    if (!lo) b.add(G.cyl, mat, x, y + h - 0.62, z, r * 1.9, 0.08, r * 1.9, 0, 0, 0, shade(col, 1.04));
    b.add(lo ? BELL8 : BELL, mat, x, y + h - 0.36, z, r * 2.2, 0.46, r * 2.2, 0, 0, 0, top);
    if (cap === 'corinth' && !lo) for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, rr = r * (k % 2 ? 0.95 : 1.05); b.add(G.box, mat, x + Math.cos(a) * rr, y + h - (k % 2 ? 0.3 : 0.46), z + Math.sin(a) * rr, r * 0.5, 0.24, 0.06, 0.25, -a + Math.PI / 2, 0, shade(top, 0.92)); }   // the acanthus leaves
    b.add(G.box, mat, x, y + h - 0.06, z, r * 3.0, 0.12, r * 3.0, 0, 0, 0, shade(top, 0.92));
  };
  K.towerRow = (b, s, z0, z1, { x0 = 12.4, signs = DOWNTOWN_SIGNS, gaps = [] } = {}) => {
    for (let z = z0 + rand(0, 2); z < z1 - 8;) {
      const r = Math.random(), len = Math.min(rand(14, 26), z1 - z);
      if (gaps.some(([a, c]) => z + len > a && z < c)) { z += 2; continue; }
      const d = rand(16, 22), cx = s * (x0 + d / 2), cz = -(z + len / 2);
      if (r < 0.18) {   // a Beaux-Arts bank: a temple front up its steps, Corinthian columns, the entablature, the pediment; the lit hall behind its tall doors
        const h = rand(12, 16), col = pick(['#ece4d6', '#e4dccc', '#f0e8da']), fx = s * (x0 - 0.7);
        b.block(VC.solid, col, cx, 0, cz, d, h, len);
        for (let k = 0; k < 4; k++) b.block(VC.solid, shade(col, 0.9 + k * 0.02), s * (x0 - 1.2 + k * 0.3), 0, cz, 1.2 - k * 0.3 + 0.6, 0.3 * (k + 1), len);   // the steps up to the stylobate
        const nc = Math.max(4, Math.round(len / 3));
        for (let k = 0; k < nc; k++) K.column(b, VC.solid, fx, 1.2, cz - len / 2 + 1.2 + (k * (len - 2.4)) / (nc - 1), h - 3.2, 0.42, col);
        b.box(VC.solid, col, fx, h - 1.62, cz, 1.4, 0.6, len);   // the architrave, the frieze, the cornice on its dentils
        b.box(VC.solid, shade(col, 0.95), fx, h - 1.0, cz, 1.5, 0.7, len);
        for (let k = 0; k < len / 0.45 - 1; k++) b.box(VC.solid, shade(col, 1.04), fx - s * 0.78, h - 0.6, cz - len / 2 + 0.45 + k * 0.45, 0.14, 0.14, 0.2);
        b.box(VC.solid, shade(col, 1.05), fx, h - 0.42, cz, 1.85, 0.26, len + 0.3);
        b.addM(prism(len + 0.3, 2.6, 1.8), VC.solid, new THREE.Matrix4().makeRotationY(face(s)).setPosition(s * (x0 - 1.6), h - 0.3, cz), col);
        b.addM(prism(len - 1.4, 1.9, 0.3), VC.solid, new THREE.Matrix4().makeRotationY(face(s)).setPosition(s * (x0 - 1.75), h - 0.12, cz), shade(col, 0.88));   // the tympanum
        b.box(VC.glow, hdr('#ffe6c0', 0.9), s * (x0 - 0.05), 4.0, cz, 0.04, 5.5, len - 3);
        for (let k = 0; k < 3; k++) b.box(VC.solid, '#3a2a1e', s * (x0 - 0.08), 2.6, cz + (k - 1) * Math.min(4, len / 4), 0.04, 2.8, 1.5);   // the tall doors
      } else {
        const glassy = r > 0.62, h = glassy ? rand(55, 110) : rand(30, 75), col = glassy ? pick(['#ffffff', '#e8f0ff', '#dce8f4']) : pick(['#f2e8d8', '#e8dcc8', '#f4ecdc', '#e0d4c0', '#d8ccb8']);
        b.addM(buildingGeo(d, h, len, glassy ? glassT : stoneT, glassy ? 1.6 : 1.9, glassy ? 3.6 : 3.3), glassy ? K.glassMat : K.stoneMat, at(cx, 0, cz), col);
        const info = { x: cx, z: cz, d, len, h, side: s, face: s * x0, col, crown: !glassy };
        towerFront(b, info, signs); towerTop(b, info);
      }
      z += len + rand(0, 0.6);
    }
  };
  K.muniEntrance = (b, x, z, side) => {   // the stairs down to Muni and BART: the opening, its steps lit going down, the granite walls round it and the steel rails on them, the sign on its pylon
    b.box(VC.solid, '#14161a', x, 0.05, z, 2.0, 0.02, 5.0);
    for (let k = 0; k < 6; k++) b.box(VC.glow, hdr('#e8f0ff', 0.5), x, 0.065, z - 2.2 + k * 0.85, 1.6, 0.01, 0.3);
    for (const e of [-1, 1]) { b.block(VC.solid, '#8a8a8e', x + e * 1.12, 0, z, 0.22, 0.95, 5.0); b.box(VC.metal, '#c8ccd2', x + e * 1.12, 1.02, z, 0.07, 0.06, 5.0); b.box(VC.solid, '#9a9a9e', x + e * 1.12, 0.97, z, 0.28, 0.05, 5.04); }
    b.block(VC.solid, '#8a8a8e', x, 0, z + 2.6, 2.46, 0.95, 0.22); b.box(VC.metal, '#c8ccd2', x, 1.02, z + 2.6, 2.4, 0.06, 0.07);
    const px = x - side * 1.5, pz = z - 2.2;
    b.block(VC.solid, '#3a3e44', px, 0, pz, 0.22, 2.4, 0.22); b.block(VC.solid, '#1a3a7a', px, 2.4, pz, 0.3, 1.0, 1.5);
    for (const e of [-1, 1]) b.add(G.plane, K.label('MUNI · BART', { w: 512, h: 128, color: '#ffffff', bg: '#1a3a7a', font: SANS, weight: 700, size: 0.5, k: 1.2 }), px + e * 0.155, 2.9, pz, 1.4, 0.36, 1, 0, e * Math.PI / 2, 0);
  };
  K.pierShed = (b, s, xb, z0, z1, { no = randi(1, 40) * 2 + 1 } = {}) => {   // a pier shed: its long roof out over the water; its bulkhead front facing the street: pilasters, the great arch with its fanlight over the roll-up door, a smaller door either side, the cornice on its modillions, the pediment, PIER and its number
    const zc = -(z0 + z1) / 2, L = z1 - z0, D = 140, col = pick(['#ece6d8', '#e4dccc', '#f0e8d8']), x = s * (xb + D / 2), F = (o) => s * (xb - o), ry = face(s);
    b.block(VC.solid, '#d8d2c4', x, -0.6, zc, D, 9.4, L - 1);
    b.add(G.cone4, VC.solid, x, 10.4, zc, D * 1.4, 3, (L - 1) * 1.4, 0, 0, 0, '#7a7e84');
    b.block(VC.solid, col, s * (xb + 0.6), 0, zc, 1.2, 12.5, L);
    const ar = Math.min(4.4, L * 0.16), ah = 5.0;   // the great arch: its half-width, where its round head springs
    b.box(VC.solid, '#6a6e74', F(0.02), ah / 2, zc, 0.04, ah, ar * 2);   // the roll-up door and its slats
    for (let y = 0.45; y < ah; y += 0.45) b.box(VC.solid, '#565a60', F(0.045), y, zc, 0.02, 0.04, ar * 2);
    b.add(HALFDISC, VC.glow, F(0.02), ah, zc, ar * 2, ar * 2, 0.04, 0, ry, 0, hdr('#ffe0b0', 0.7));   // the fanlight over it, its bars
    for (let k = 1; k < 6; k++) { const a = (Math.PI * k) / 6; b.add(G.box, VC.solid, F(0.05), ah + Math.sin(a) * ar / 2, zc + Math.cos(a) * ar / 2, 0.03, 0.06, ar, -a, 0, 0, shade(col, 0.9)); }
    b.box(VC.solid, shade(col, 0.9), F(0.05), ah, zc, 0.04, 0.1, ar * 2);
    for (let k = 0; k < 8; k++) { const m = (Math.PI * (k + 0.5)) / 8, R = ar + 0.22; b.add(G.box, VC.solid, F(0.12), ah + Math.sin(m) * R, zc + Math.cos(m) * R, 0.2, 0.42, R * 0.41, -(m + Math.PI / 2), 0, 0, shade(col, 1.04)); }   // the arch's moulding
    b.box(VC.solid, shade(col, 1.06), F(0.18), ah + ar + 0.2, zc, 0.3, 0.8, 0.6);   // its keystone
    for (const e of [-1, 1]) {
      for (const f of [0.55, 0.85]) {   // the pilasters, their bases and capitals
        const pz = zc + e * L * f / 2;
        b.box(VC.solid, shade(col, 1.03), F(0.05), 6.2, pz, 0.15, 12.4, 0.8);
        b.box(VC.solid, shade(col, 0.95), F(0.1), 0.35, pz, 0.24, 0.7, 1.0); b.box(VC.solid, shade(col, 1.06), F(0.12), 11.4, pz, 0.3, 0.5, 1.05);
      }
      const dz = zc + e * L * 0.35, dw = Math.min(3.2, L * 0.15 - 0.9);   // a side door between them, the window over it
      b.box(VC.solid, '#5a5e64', F(0.02), 2.0, dz, 0.04, 4.0, dw); for (let y = 0.5; y < 4; y += 0.5) b.box(VC.solid, '#4a4e54', F(0.04), y, dz, 0.02, 0.04, dw);
      b.box(VC.glow, hdr('#ffe0b0', 0.55), F(0.02), 6.6, dz, 0.04, 1.6, dw); b.box(VC.solid, shade(col, 0.9), F(0.04), 6.6, dz, 0.02, 1.6, 0.06);
    }
    b.box(VC.solid, shade(col, 1.04), F(0.1), 12.2, zc, 0.3, 0.6, L + 0.3);   // the cornice on its modillions
    for (let z = zc - L / 2 + 0.5; z < zc + L / 2 - 0.3; z += 0.9) b.box(VC.solid, shade(col, 0.96), F(0.2), 11.8, z, 0.3, 0.2, 0.18);
    b.addM(prism(ar * 3.4, 2.4, 0.5), VC.solid, new THREE.Matrix4().makeRotationY(ry).setPosition(s * (xb + 0.3), 12.5, zc), col);
    b.add(G.plane, K.label(`PIER ${no}`, { w: 512, h: 128, color: '#2a2a30', font: SERIF, weight: 700, size: 0.7, k: 1.0 }), F(0.06), 10.0, zc, ar * 2.4, ar * 0.6, 1, 0, ry, 0);
  };
  K.quay = (b, s, xb, z0 = 0, z1 = CHUNK_LEN, { gulls = 2 } = {}) => {   // the bulkhead's granite edge and its rail, the iron bollards along it, the bay beyond
    const zc = -(z0 + z1) / 2, L = z1 - z0;
    b.box(VC.solid, '#a8a094', s * (xb + 0.4), -0.7, zc, 0.8, 1.6, L);
    b.add(G.plane, K.water, s * (xb + 200), -1.25, zc, 400, L, 1, -Math.PI / 2, 0, 0);
    b.box(VC.metal, '#3a4044', s * (xb + 0.2), 1.05, zc, 0.06, 0.06, L);
    b.box(VC.metal, '#3a4044', s * (xb + 0.2), 0.6, zc, 0.04, 0.04, L);
    for (let z = z0 + 1; z < z1; z += 2.4) b.box(VC.metal, '#3a4044', s * (xb + 0.2), 0.55, -z, 0.07, 1.1, 0.07);
    for (let z = z0 + rand(4, 10); z < z1 - 2; z += rand(12, 18)) { b.cyl(VC.metal, '#2a2e32', s * (xb + 0.55), 0.32, -z, 0.15, 0.44, 'cyl8'); b.add(G.sphLow, VC.metal, s * (xb + 0.55), 0.56, -z, 0.38, 0.2, 0.38, 0, 0, 0, '#2a2e32'); }   // the bollards
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
  // A Powell Street cable car's dress, for a body W wide and L long whose front face is at zf, facing f (+1: toward +z),
  // its roof's top at R: the windscreen of three panes in gold frames over the cream dash, the route board, the number
  // and the single headlamp in its ring, the bumper; the roof's hood curving down over the front, the clerestory along the
  // roof with its little windows and the lamp on its nose; the closed cabin's windows in gold frames, the letterboard
  // over them, the gold lines on the maroon; the running boards, the brass poles along the open grip section, the bell
  // under its roof; riders on the outward-facing benches and hanging off the boards. solid: the body is already there
  // (a train's), so the open section is drawn on its sides and the benches stand out from them.
  const hoods = new Map();
  const hood = (W, R) => {   // the roof's end curving down over a platform: its side profile (u forward from the end wall, v up), across the width
    const key = W.toFixed(2) + '|' + R.toFixed(2);
    if (!hoods.has(key)) {
      const s = new THREE.Shape();
      s.moveTo(-0.4, R - 0.12); s.lineTo(-0.4, R); s.quadraticCurveTo(0.24, R, 0.34, R - 0.3); s.lineTo(0.26, R - 0.32); s.quadraticCurveTo(0.16, R - 0.12, -0.4, R - 0.12);
      const g = new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: false, curveSegments: 5 });
      g.translate(0, 0, -W / 2); g.rotateY(-Math.PI / 2);   // u along +z, the depth across x
      hoods.set(key, g);
    }
    return hoods.get(key);
  };
  K.cableDress = (t, { zf, f = 1, L, W = 2.44, R = 3.05, sign = 'POWELL & HYDE', no = randi(1, 28), riders = 0.7, solid = false, front = true }) => {
    const Z = (o) => zf - f * o, hw = W / 2, M = '#7a1a24', C = '#efe4c8', Gd = '#d8b048', go = 3.2, cab0 = go + 0.15, cab1 = L - 0.95, face = f > 0 ? 0 : Math.PI, out = (e) => (e > 0 ? -Math.PI / 2 : Math.PI / 2);
    if (front) {   // the dash, its gold border, the route board, the number, the headlamp; the windscreen over it; the bumper
      const fz = zf + f * 0.035;
      t.box(VC.solid, C, 0, 1.05, fz, W - 0.08, 0.95, 0.03);
      for (const y of [0.6, 1.5]) t.box(VC.solid, Gd, 0, y, fz + f * 0.016, W - 0.12, 0.04, 0.01);
      for (const xx of [-hw + 0.06, -0.3, 0.3, hw - 0.06]) t.box(VC.solid, Gd, xx, 1.05, fz + f * 0.016, 0.04, 0.9, 0.01);
      t.add(G.plane, K.label(sign, { w: 256, h: 128, color: '#e8c060', bg: M, font: SERIF, weight: 700, size: 0.4, k: 1.0 }), -f * (hw + 0.3) / 2, 1.06, fz + f * 0.022, hw - 0.42, 0.42, 1, 0, face, 0);   // (on the left as you face it)
      t.add(G.plane, K.label(String(no), { w: 128, h: 96, color: '#a87818', font: SERIF, weight: 700, size: 0.8, k: 1.0 }), 0, 1.36, fz + f * 0.022, 0.3, 0.22, 1, 0, face, 0);
      t.cyl(VC.metal, '#c8ccd0', 0, 0.98, fz + f * 0.03, 0.17, 0.05, 'cyl', Math.PI / 2); t.cyl(VC.glow, hdr('#fff0c8', 6.5), 0, 0.98, fz + f * 0.05, 0.12, 0.03, 'cyl', Math.PI / 2);   // the headlamp in its ring
      t.box(VC.solid, C, 0, 0.34, fz + f * 0.09, W - 0.24, 0.2, 0.18);   // the bumper
      const pw = (W - 0.2) / 3;
      for (let k = 0; k < 3; k++) t.box(VC.glow, hdr('#3a4a5e', 0.9), (k - 1) * pw, 2.1, fz, pw - 0.08, 1.0, 0.02);   // the windscreen's panes, their gold frames
      for (const xx of [-hw + 0.05, -pw / 2, pw / 2, hw - 0.05]) t.box(VC.solid, Gd, xx, 2.1, fz + f * 0.012, 0.07, 1.12, 0.03);
      for (const y of [1.57, 2.64]) t.box(VC.solid, Gd, 0, y, fz + f * 0.012, W - 0.06, 0.06, 0.03);
      t.box(VC.solid, C, 0, 2.86, fz, W - 0.06, 0.38, 0.03);   // the panel under the hood
      t.sph(VC.metal, Gd, 0, R - 0.36, Z(0.7), 0.2);   // the bell under the roof
    } else t.box(VC.solid, M, 0, 1.75, zf + f * 0.03, W - 0.06, 2.6, 0.03);
    t.addM(hood(W + 0.1, R), VC.solid, new THREE.Matrix4().makeRotationY(face).setPosition(0, 0, zf), '#f2ece0');   // the roof's hood over the front
    t.addM(hood(W + 0.1, R), VC.solid, new THREE.Matrix4().makeRotationY(face + Math.PI).setPosition(0, 0, Z(L)), '#f2ece0');   // and over the back
    // the clerestory along the roof: its little windows, the lamp on its nose
    t.box(VC.solid, C, 0, R + 0.09, (Z(0.5) + Z(L - 0.5)) / 2, 1.3, 0.18, L - 1.0);
    for (const e of [-1, 1]) for (let o = 0.8; o < L - 0.7; o += 0.62) t.box(VC.glow, hdr('#ffe0a8', 0.9), e * 0.655, R + 0.09, Z(o), 0.02, 0.1, 0.42);
    t.box(VC.glow, hdr('#fff0c8', 2.2), 0, R + 0.1, Z(0.48), 0.24, 0.12, 0.04);
    for (const e of [-1, 1]) {
      const x = e * hw, sx = (d) => x + e * d;
      t.box(VC.solid, '#6a4a2a', sx(solid ? 0.3 : 0.14), 0.52, (Z(0.3) + Z(L - 0.3)) / 2, solid ? 0.62 : 0.36, 0.07, L - 0.6);   // the running board
      for (const y of [0.72, 1.24]) t.box(VC.solid, Gd, sx(0.012), y, (Z(0.1) + Z(L - 0.1)) / 2, 0.01, 0.035, L - 0.2);   // the gold lines along the lower panels
      // the open grip section: the dark under its roof (on a solid body), the bench standing out from it, the brass poles at its edge
      if (solid) { t.box(VC.solid, '#1e1612', sx(0.012), 2.1, (Z(0.15) + Z(go)) / 2, 0.01, 1.5, go - 0.15); t.box(VC.solid, '#a8743a', sx(0.22), 1.3, (Z(0.3) + Z(go - 0.1)) / 2, 0.44, 0.07, go - 0.4); t.box(VC.solid, '#7a5230', sx(0.22), 1.12, (Z(0.3) + Z(go - 0.1)) / 2, 0.4, 0.32, go - 0.45); }
      for (let o = 0.3; o <= go; o += (go - 0.3) / 4) t.cyl(VC.metal, '#c8a050', sx(-0.03), (1.34 + R - 0.12) / 2, Z(o), 0.03, R - 1.46, 'cyl6');
      // the closed cabin: its windows in their gold frames, the maroon between them, the letterboard over them
      const n = Math.max(2, Math.round((cab1 - cab0) / 1.15)), wl = (cab1 - cab0) / n;
      t.box(VC.solid, M, sx(0.006), 2.1, (Z(cab0) + Z(cab1)) / 2, 0.01, 1.12, cab1 - cab0);
      for (let k = 0; k < n; k++) {
        const o = cab0 + (k + 0.5) * wl;
        t.box(VC.glow, hdr(pick(WARM), 0.95), sx(0.014), 2.08, Z(o), 0.01, 0.92, wl - 0.24);
        t.box(VC.solid, Gd, sx(0.02), 2.08, Z(o - wl / 2 + 0.1), 0.012, 0.98, 0.05); t.box(VC.solid, Gd, sx(0.02), 2.08, Z(o + wl / 2 - 0.1), 0.012, 0.98, 0.05);
        t.box(VC.solid, Gd, sx(0.02), 2.56, Z(o), 0.012, 0.05, wl - 0.16); t.box(VC.solid, Gd, sx(0.02), 1.6, Z(o), 0.012, 0.05, wl - 0.16);
      }
      t.box(VC.solid, C, sx(0.008), 2.8, (Z(cab0) + Z(cab1)) / 2, 0.012, 0.32, cab1 - cab0);
      t.add(G.plane, K.label(sign + ' STS', { w: 512, h: 64, color: M, font: SERIF, weight: 700, size: 0.66, k: 1.0 }), sx(0.016), 2.8, (Z(cab0) + Z(cab1)) / 2, Math.min(3.4, cab1 - cab0 - 0.4), 0.26, 1, 0, e * Math.PI / 2, 0);
      for (let o = cab1 + 0.1; o < L; o += 0.42) t.cyl(VC.metal, '#c8a050', sx(-0.03), 1.75, Z(o), 0.025, 0.9, 'cyl6');   // the rear platform's rail
      // the riders: on the bench facing out, hanging off the board by a pole
      for (let o = 0.7; o < go - 0.3; o += 0.72) {
        if (chance(riders)) K.person(t, sx(solid ? 0.3 : -0.14), Z(o), { seated: true, y: 0.8, ry: out(e), bag: false, phone: false, camera: chance(0.3) });
        if (chance(riders * 0.55)) K.person(t, sx(solid ? 0.46 : 0.3), Z(o + 0.36), { y: 0.56, ry: out(e), hang: true, s: 0.95, bag: false, phone: false });
      }
    }
  };
  // A whole Powell Street cable car at the origin, its front (the open grip section) toward -z: the truck and its
  // wheels, the maroon body, the benches along the sides facing out with their backs to the aisle, the gripman at his
  // lever, the closed cabin, the conductor on the rear platform; dressed as above. Build it into its own batcher and
  // place it (K.place).
  K.cableCar = (t, { riders = 0.7, sign = 'POWELL & HYDE' } = {}) => {
    const M = '#7a1a24', C = '#efe4c8', L = 8.3, hl = L / 2, W = 2.44, go = 3.2, R = 3.05;
    t.block(VC.solid, '#2a2420', 0, 0.16, 0, 2.2, 0.36, L - 0.4);   // the truck frame and its wheels
    for (const dz of [-2.6, 2.6]) for (const e of [-1, 1]) { t.cyl(VC.metal, '#3a3a3e', e * 0.75, 0.3, dz, 0.3, 0.14, 'cyl', 0, Math.PI / 2); t.cyl(VC.metal, '#6a6a70', e * 0.83, 0.3, dz, 0.12, 0.04, 'cyl8', 0, Math.PI / 2); }
    t.block(VC.solid, M, 0, 0.45, 0, W, 0.9, L);   // the lower body, its floor at 0.85
    t.block(VC.solid, M, 0, 1.35, -hl + (go + 0.15 + L - 0.95) / 2, W, 1.62, L - 0.95 - go - 0.15);   // the cabin's walls
    t.box(VC.solid, '#f2ece0', 0, R - 0.06, 0, W + 0.1, 0.12, L - 0.6);   // the long low roof
    t.box(VC.solid, '#3a2a20', 0, R - 0.13, -hl + go / 2, W - 0.1, 0.02, go - 0.2);   // its underside over the open section
    for (const e of [-1, 1]) {   // the open section's benches, their backs, the end panels; the aisle between them
      t.box(VC.solid, '#a8743a', e * 0.93, 1.3, -hl + go / 2, 0.46, 0.07, go - 0.4);
      t.box(VC.solid, '#8a5a2a', e * 0.68, 1.58, -hl + go / 2, 0.06, 0.56, go - 0.4);
      t.box(VC.solid, M, e * 0.93, 1.06, -hl + go / 2, 0.44, 0.42, go - 0.5);
    }
    t.box(VC.solid, '#6a5440', 0, 0.86, -hl + go / 2, 1.3, 0.02, go - 0.1);
    beam(t, VC.metal, 0.12, 0.86, -hl + 1.25, 0.2, 2.05, -hl + 1.05, 0.06, '#2a2a2e'); t.sph(VC.solid, '#1a1a1a', 0.2, 2.07, -hl + 1.05, 0.06);   // the grip lever
    K.person(t, 0.05, -hl + 1.55, { y: 0.86, ry: 0, top: '#2a3a5a', hat: 'cap', lever: true, bag: false, phone: false });   // the gripman
    K.person(t, -0.3, hl - 0.45, { y: 0.86, ry: Math.PI / 2, top: '#2a3a5a', hat: 'cap', bag: false, phone: false });   // the conductor
    K.cableDress(t, { zf: -hl, f: -1, L, W, R, sign, riders });
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
    for (const k of [-1, 1]) for (let u = rand(5, 9); u < L - 6; u += rand(5.5, 8)) if (chance(0.6)) { const d = pick([-1, 1]); K.place(sb, (t) => K.car(t, 0, 0, d, { lo: u > 28, curb: -k * d * 0.42 }), tilt(u).setPosition(k * (R - P - 1.05), yAt(u) + 0.03, -u)); }   // parked down the hill, their wheels turned into the kerb (the far ones plainer)
    for (const k of [-1, 1]) for (let u = 4; u < L - 6;) {   // its houses, each lot's floor at its downhill end, so they step down the street
      const w = pick([6.4, 7.6, 8.4]);
      if (u > 52) K.smallHouse(sb, k * (R + 0.25), yAt(u + w) - 0.3, -(u + w / 2), w - 0.1, 9, 6.5, -k * Math.PI / 2);   // (far down the hill, plainer still)
      else if (u > 14) K.house(sb, k, R + 0.25, -(u + w / 2), { w, base: yAt(u + w), yd: 0.9, floors: u < 30 ? 1 : 2, lit: 0.45, yard: false, foot: 7, flip: k > 0, lo: true });
      u += w + 0.05;
    }
    { const u = rand(22, 50); K.place(sb, (t) => K.cableCar(t, { sign: 'POWELL & HYDE', riders: 0.4 }), new THREE.Matrix4().makeRotationY(Math.PI).premultiply(tilt(u)).setPosition(0, yAt(u) + 0.05, -u)); }
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
  K.sailboat = (b, x, z, ry = rand(0, Math.PI * 2), { s = rand(0.8, 1.2), y = -1.2, sails = chance(0.5) } = {}) => {   // moored with its sails furled, or out on the bay with them set: the hull and its stripe, the cabin, the mast, the boom, the stays
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + (fx * ca + fz * sa) * s, y + fy * s, z + (-fx * sa + fz * ca) * s];
    b.add(G.sphLow, VC.solid, ...P(0, 0.35, 0), 2.2 * s, 1.0 * s, 8 * s, 0, ry, 0, '#f4f4f0');
    b.add(G.box, VC.solid, ...P(0, 0.62, 0), 2.1 * s, 0.08 * s, 6.4 * s, 0, ry, 0, pick(['#2a4a7a', '#1a1a20', '#a8302a']));   // the stripe along the sheer
    b.add(G.box, VC.solid, ...P(0, 0.72, 0), 1.9 * s, 0.1 * s, 6.8 * s, 0, ry, 0, '#d8d0c0');   // the deck
    b.add(G.box, VC.solid, ...P(0, 0.95, 0.6), 1.3 * s, 0.5 * s, 2.6 * s, 0, ry, 0, '#e8e4dc');   // the cabin, its ports
    for (const e of [-1, 1]) b.add(G.box, VC.glow, ...P(e * 0.66, 1.0, 0.6), 0.02 * s, 0.14 * s, 1.6 * s, 0, ry, 0, hdr('#3a4a5e', 0.9));
    b.add(G.cyl8, VC.solid, ...P(0, 6.2, -0.6), 0.12 * s, 11 * s, 0.12 * s, 0, ry, 0, '#d8dce0');
    beam(b, VC.metal, ...P(0, 11.6, -0.6), ...P(0, 0.8, -3.6), 0.02 * s, '#c8ccd2'); beam(b, VC.metal, ...P(0, 11.6, -0.6), ...P(0, 0.8, 3.7), 0.02 * s, '#c8ccd2');   // the forestay, the backstay
    beam(b, VC.metal, ...P(0, 1.55, -0.6), ...P(0, 1.65, 2.6), 0.07 * s, '#c8ccd2');   // the boom
    if (sails) {
      b.addM(SAIL, K.sailMat, new THREE.Matrix4().compose(new THREE.Vector3(...P(0, 1.6, -0.5)), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry + Math.PI / 2), new THREE.Vector3(3.1 * s, 9.4 * s, 1)), '#f8f6f0');
      b.addM(SAIL, K.sailMat, new THREE.Matrix4().compose(new THREE.Vector3(...P(0, 1.2, -0.75)), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry - Math.PI / 2), new THREE.Vector3(2.6 * s, 8.6 * s, 1)), pick(['#f8f6f0', '#e8e4dc', '#f8f6f0', '#e8506a', '#2a6ab0']));
    } else b.add(G.cyl8, VC.solid, ...P(0, 1.75, 1.0), 0.3 * s, 0.3 * s, 3.0 * s, Math.PI / 2, ry, 0, '#2a4a7a');   // the furled main on its boom, under its blue cover
    b.box(VC.glow, hdr('#ffe0b0', 1.2), ...P(0, 11.7, -0.6), 0.1, 0.1, 0.1);
  };
  K.fishingBoat = (b, x, z, ry = rand(0, Math.PI * 2), { s = rand(0.85, 1.05), y = -1.2 } = {}) => {   // a wharf's fishing boat: the high bow, the wheelhouse aft with its windows, the mast and its trolling poles, the gear on deck
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + (fx * ca + fz * sa) * s, y + fy * s, z + (-fx * sa + fz * ca) * s], hull = pick(['#f2f0ea', '#2a5a8a', '#e8e4dc', '#3a7a5a']);
    b.add(G.sphLow, VC.solid, ...P(0, 0.45, 0), 3.0 * s, 1.4 * s, 10 * s, 0, ry, 0, hull);
    b.add(G.box, VC.solid, ...P(0, 0.98, 0), 2.6 * s, 0.14 * s, 8.4 * s, 0, ry, 0, '#c8302a');   // the rail
    b.add(G.box, VC.solid, ...P(0, 1.6, 1.6), 2.0 * s, 1.5 * s, 2.4 * s, 0, ry, 0, '#f4f2ec');   // the wheelhouse, its windows, its roof
    b.add(G.box, VC.glow, ...P(0, 1.85, 0.39), 1.6 * s, 0.5 * s, 0.02 * s, 0, ry, 0, hdr(pick(WARM), 0.9));
    for (const e of [-1, 1]) b.add(G.box, VC.glow, ...P(e * 1.01, 1.85, 1.6), 0.02 * s, 0.45 * s, 1.6 * s, 0, ry, 0, hdr('#3a4a5e', 0.9));
    b.add(G.box, VC.solid, ...P(0, 2.4, 1.6), 2.2 * s, 0.1 * s, 2.6 * s, 0, ry, 0, '#3a3a40');
    b.add(G.cyl8, VC.solid, ...P(0, 4.2, -0.6), 0.12 * s, 6.4 * s, 0.12 * s, 0, ry, 0, '#d8d4cc');
    for (const e of [-1, 1]) beam(b, VC.solid, ...P(0, 2.2, -0.6), ...P(e * 3.6, 6.4, -0.2), 0.07 * s, '#d8d4cc');   // the trolling poles, raised
    for (let k = 0; k < 3; k++) b.add(G.box, VC.solid, ...P(rand(-0.6, 0.6), 1.15, -2.4 + k * 0.9), 0.6 * s, 0.4 * s, 0.6 * s, 0, ry, 0, pick(['#3a6a8a', '#d8a030', '#5a5e64']));   // crab pots, crates
    b.box(VC.glow, hdr('#fff0d0', 2.0), ...P(0, 7.45, -0.6), 0.14, 0.14, 0.14);
  };
  K.seaLion = (b, x, y, z, ry = rand(0, Math.PI * 2), { up = chance(0.4) } = {}) => {   // a sea lion hauled out: the chest, the body tapering to the tail flippers, the fore flippers; asleep, or propped up barking with its head up
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + fx * ca + fz * sa, y + fy, z - fx * sa + fz * ca], c = pick(['#5a4434', '#4a3a2c', '#6a5240', '#3a2e24']);
    b.add(G.sphLow, VC.solid, ...P(0, 0.3, -0.25), 0.82, 0.6, 1.3, up ? -0.25 : 0, ry, 0, c);   // the chest
    b.add(G.sphLow, VC.solid, ...P(0, 0.22, 0.55), 0.6, 0.42, 1.2, 0, ry, 0, shade(c, 0.95));   // the body, tapering back
    for (const e of [-1, 1]) b.add(G.box, VC.solid, ...P(e * 0.2, 0.04, 1.18), 0.3, 0.05, 0.42, 0, ry + e * 0.45, 0, shade(c, 0.8));   // the hind flippers
    for (const e of [-1, 1]) b.add(G.box, VC.solid, ...P(e * 0.42, up ? 0.18 : 0.08, -0.4), 0.42, 0.06, 0.26, up ? e * 0.5 : 0, ry + e * 0.5, up ? e * 0.6 : 0, shade(c, 0.8));   // the fore flippers, braced when it is up
    if (up) { b.add(G.sphLow, VC.solid, ...P(0, 0.78, -0.8), 0.42, 0.7, 0.42, -0.4, ry, 0, c); b.add(G.sphLow, VC.solid, ...P(0, 1.12, -1.0), 0.3, 0.28, 0.42, 0.3, ry, 0, c); b.add(G.box, VC.solid, ...P(0, 1.08, -1.22), 0.12, 0.1, 0.14, 0.3, ry, 0, shade(c, 0.7)); }
    else { b.add(G.sphLow, VC.solid, ...P(0, 0.3, -1.05), 0.38, 0.34, 0.5, 0, ry, 0, c); b.add(G.box, VC.solid, ...P(0, 0.28, -1.32), 0.12, 0.1, 0.12, 0, ry, 0, shade(c, 0.7)); }
  };
  K.gull = (b, x, y, z, ry = rand(0, Math.PI * 2)) => {   // a gull standing on a rail or a post: the white body and head, grey wings folded along it, the black wingtips, the yellow beak, the legs
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + fx * ca + fz * sa, y + fy, z - fx * sa + fz * ca];
    b.add(G.sphLow, VC.solid, ...P(0, 0.2, 0), 0.16, 0.16, 0.36, 0, ry, 0, '#f4f4f2');
    b.add(G.sphLow, VC.solid, ...P(0, 0.31, -0.17), 0.12, 0.12, 0.13, 0, ry, 0, '#ffffff');
    b.add(G.box, VC.solid, ...P(0, 0.3, -0.26), 0.03, 0.03, 0.08, 0, ry, 0, '#f2c230');
    for (const e of [-1, 1]) { b.add(G.box, VC.solid, ...P(e * 0.075, 0.24, 0.04), 0.03, 0.08, 0.3, 0.08, ry, 0, '#9aa0a8'); b.add(G.box, VC.solid, ...P(e * 0.05, 0.23, 0.22), 0.03, 0.05, 0.12, 0.15, ry, 0, '#1a1a1e'); }
    for (const e of [-1, 1]) b.add(G.box, VC.solid, ...P(e * 0.04, 0.06, 0.02), 0.02, 0.12, 0.02, 0, ry, 0, '#e8a060');
  };
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
const WHEEL = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);   // a tyre
const SHAFT = new THREE.CylinderGeometry(0.43, 0.5, 1, 12);   // a column's shaft, a little narrower at the top
const BELL = new THREE.CylinderGeometry(0.62, 0.45, 1, 12);   // a capital's bell, flaring up to the abacus
const SHAFT8 = new THREE.CylinderGeometry(0.43, 0.5, 1, 8), BELL8 = new THREE.CylinderGeometry(0.62, 0.45, 1, 8);
const GLOBE = new THREE.SphereGeometry(0.5, 10, 7);   // a lamp's glass globe
export const HALFDISC = new THREE.CylinderGeometry(0.5, 0.5, 1, 7, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2);   // a half disc facing +z, its flat side on y = 0 (a segmental hood)
const VWBODY = (() => {   // the split-window bus's side profile (its nose toward local -z): the flat front, the roof's round corners; extruded across its width
  const s = new THREE.Shape();
  s.moveTo(-2.15, 0.3); s.lineTo(2.12, 0.3); s.lineTo(2.15, 1.55); s.absarc(1.75, 1.6, 0.4, 0, Math.PI / 2, false); s.lineTo(-1.8, 2.0); s.absarc(-1.8, 1.62, 0.38, Math.PI / 2, Math.PI, false); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.72, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -0.86); g.rotateY(Math.PI / 2);
  return g;
})();
