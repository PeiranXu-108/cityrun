// Los Angeles's street kit for a summer sunset: the fan palms standing in rows down every street, Spanish Colonial
// villas under red tile and bougainvillea, Craftsman bungalows, dingbat apartments over their carports; the roadside
// of the fifties (coffee shops under boomerang roofs, a doughnut the size of a car on a drive-in's roof, car washes,
// motels with their neon arrows, the gas station's swooping canopy, pole signs full of tenants); Hollywood Boulevard's
// stars in the pavement, its marquees and blade signs; downtown's stone towers and old theatres; the Eastside's painted
// shops and murals, lowriders and carts; surf shops and juice bars by the beach. Wooden power poles and their wires,
// the stacked parking signs, the blue street plates, bus benches, hydrants; people in sunglasses, with surfboards,
// skateboards, roller skates; dogs.
// Every sign is in English, or in Spanish on the Eastside and Olvera Street; every business name is made up.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, planeUV, windowTex, buildingGeo, shade, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { facadeMat, EDGE, at, waterMat } from './common.js';
import { beam } from './tokyo_kit.js';
import { sydneyTreeKit, lijiangTreeKit, laTreeKit } from './trees.js';
import { frame } from './ny_icons.js';
import { puffs } from './taipei_towers.js';
import { tiledBox } from './beijing_kit.js';

export const SANS = '"Oswald", "Arial Narrow", sans-serif';
export const DISPLAY = '"Russo One", "Arial Black", sans-serif';
export const SERIF = '"Playfair Display", Georgia, "Times New Roman", serif';
export const SCRIPT = '"Pacifico", "Brush Script MT", cursive';            // surf shops, diners, the names on the dingbats
export const BLADE = '"Bungee", "Russo One", sans-serif';                  // the tall blade signs
export const DECO = '"Limelight", "Playfair Display", Georgia, serif';     // the theatres
export const NEON = '"Monoton", "Righteous", sans-serif';                  // neon tubes
export const GROOVY = '"Righteous", "Russo One", sans-serif';
// the accented letters the Spanish signs need (main.js loads the fonts for them)
export const GLYPHS = 'ÁÉÍÓÚÑáéíóúñ¡¿';
export const KERB = 6.6;     // the kerb: the parking lane lies between it and the track, the pavement beyond it
export const X0 = 11.4;      // the building line of the shopping streets
export const face = (s) => (-s * Math.PI) / 2;   // turns a plane (or a frame) on side s to face the track
export const WARM = ['#ffd9a0', '#ffe6bc', '#ffc880', '#fff0d8', '#ffdcb0'];

// ---------- textures ----------
function pavementTex() {   // the pale, sun-bleached concrete of the pavements, scored into squares
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c4bcb0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = randi(-16, 14); g.fillStyle = `rgba(${190 + v},${182 + v},${170 + v},0.7)`; g.fillRect(rand(0, w), rand(0, h), rand(1, 3), rand(1, 3)); }
    for (let i = 0; i < 6; i++) { const x = rand(0, w), y = rand(0, h), r = rand(10, 34), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(120,110,96,0.16)'); gr.addColorStop(1, 'rgba(120,110,96,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.fillStyle = 'rgba(104,96,86,0.7)';
    for (const p of [0, 128]) { g.fillRect(p, 0, 2, h); g.fillRect(0, p, w, 2); }
    g.strokeStyle = 'rgba(96,88,78,0.4)'; g.lineWidth = 1;
    for (let i = 0; i < 3; i++) { g.beginPath(); let x = rand(0, w), y = rand(0, h); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rand(-14, 14); y += rand(4, 14); g.lineTo(x, y); } g.stroke(); }
  });
}
function asphaltTex() {   // the road: dark asphalt, patched, the grit in it catching the light
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#3e3c40'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) { const v = randi(-12, 18); g.fillStyle = `rgb(${60 + v},${58 + v},${62 + v})`; g.fillRect(rand(0, w), rand(0, h), rand(1, 2.5), rand(1, 2.5)); }
    for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(${pick([30, 76])},${pick([30, 72])},${pick([34, 78])},0.35)`; g.fillRect(rand(0, w), rand(0, h), rand(30, 90), rand(20, 70)); }
  });
}
function stuccoTex() {   // smooth trowelled stucco, faintly mottled (tinted by the wall's colour)
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#f2f0ec'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { const v = randi(-14, 8); g.fillStyle = `rgba(${236 + v},${232 + v},${226 + v},0.6)`; g.fillRect(rand(0, w), rand(0, h), rand(1, 4), rand(1, 3)); }
    for (let i = 0; i < 5; i++) { const x = rand(0, w), y = rand(0, h), r = rand(14, 40), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(180,170,160,0.14)'); gr.addColorStop(1, 'rgba(180,170,160,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  });
}
function tileTex() {   // red clay barrel tiles in courses, each tile's round back catching the light
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#6a2a1a'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 3; r++) for (let c = -1; c < 4; c++) {
      const x = c * 16 + (r % 2) * 8, y = r * 21.3, gr = g.createLinearGradient(x, 0, x + 16, 0);
      gr.addColorStop(0, '#8a3a24'); gr.addColorStop(0.45, '#d8784a'); gr.addColorStop(1, '#7a3020');
      g.fillStyle = gr; g.fillRect(x + 1, y, 14, 20);
      g.fillStyle = 'rgba(40,14,8,0.5)'; g.fillRect(x + 1, y + 17, 14, 4);   // (one repeat a metre: 25 cm tiles in 33 cm courses)
    }
  });
}
function sidingTex() {   // painted clapboard for the bungalows: a board every few centimetres, its shadow line under it
  return canvasTex(64, 128, (g, w, h) => {
    g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 12.8) { g.fillStyle = '#c6c2ba'; g.fillRect(0, y + 10.4, w, 2.4); g.fillStyle = '#ffffff'; g.fillRect(0, y, w, 1.2); }
  });
}
function starTex() {   // a Walk of Fame square: a coral terrazzo star edged in brass on charcoal, the brass emblem in its middle, the name left blank
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#3a3638'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) { g.fillStyle = pick(['#4a4648', '#2a2628', '#5a5658', '#6a6466']); g.fillRect(rand(0, w), rand(0, h), rand(1, 2.5), rand(1, 2.5)); }
    g.strokeStyle = '#c8a050'; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6);
    const cx = w / 2, cy = h / 2 + 6, R = 112, r = 46;
    g.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r : R; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    g.closePath(); g.fillStyle = '#e88a8a'; g.fill();
    g.save(); g.clip(); for (let i = 0; i < 900; i++) { g.fillStyle = pick(['#f0a0a0', '#d87878', '#f8b8b0', '#c86868']); g.fillRect(rand(0, w), rand(0, h), rand(1, 2.5), rand(1, 2.5)); } g.restore();
    g.strokeStyle = '#d8b060'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#d8b060'; g.fillRect(cx - 40, cy - 52, 80, 9); g.fillRect(cx - 30, cy - 38, 60, 6);   // where the name goes
    g.beginPath(); g.arc(cx, cy + 14, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a3638'; g.fillRect(cx - 12, cy + 7, 18, 13); g.beginPath(); g.moveTo(cx + 6, cy + 13); g.lineTo(cx + 14, cy + 7); g.lineTo(cx + 14, cy + 20); g.fill();   // a film camera
  }, { repeat: false });
}
// the Eastside's murals and the beach's: a sun going down behind palms, a pyramid under the sun, waves and a surfer,
// a face among flowers, a lowrider under the mountains, bold shapes; bright colours, outlined dark
const MURAL_COLS = ['#ff3d7f', '#ffd23d', '#39c8e8', '#7cd84a', '#b46bff', '#ff7a2a', '#e8302a', '#2a6ad8', '#f4f0e0', '#1a8a6a'];
function drawMural(g, w, h, m) {
  const C = () => pick(MURAL_COLS);
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, pick(['#2a2a8a', '#5a2a8a', '#1a6ab0', '#c83a6a'])); sky.addColorStop(1, pick(['#ffb04a', '#ff6a8a', '#ffd23d', '#ff8a3a']));
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.lineWidth = 4; g.strokeStyle = '#1a1420';
  const sun = (sx, sy, sr) => {
    g.fillStyle = '#ffd23d';
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; g.beginPath(); g.moveTo(sx + Math.cos(a - 0.12) * sr, sy + Math.sin(a - 0.12) * sr); g.lineTo(sx + Math.cos(a) * sr * 1.7, sy + Math.sin(a) * sr * 1.7); g.lineTo(sx + Math.cos(a + 0.12) * sr, sy + Math.sin(a + 0.12) * sr); g.fill(); }
    g.fillStyle = '#ff8a2a'; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill(); g.stroke();
  };
  const palm = (x, y, H) => {
    g.strokeStyle = '#1a1420'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + 10, (h + y) / 2, x + 4, y); g.stroke();
    g.fillStyle = '#1a1420';
    for (let k = 0; k < 9; k++) { const a = -Math.PI + (k / 8) * Math.PI, L = H * rand(0.7, 1); g.beginPath(); g.moveTo(x + 4, y); g.quadraticCurveTo(x + 4 + Math.cos(a) * L * 0.6, y + Math.sin(a) * L * 0.5 - 10, x + 4 + Math.cos(a) * L, y + Math.sin(a) * L * 0.4 + 8); g.lineTo(x + 4 + Math.cos(a) * L * 0.8, y + Math.sin(a) * L * 0.3 + 2); g.fill(); }
    g.lineWidth = 4;
  };
  if (m === 0) {   // the sun going down into the sea behind two palms
    sun(w * 0.5, h * 0.62, w * 0.16);
    for (let k = 0; k < 5; k++) { g.fillStyle = ['#ff6a8a', '#e85a9a', '#b44ab4', '#5a3aa8', '#2a2a7a'][k]; g.fillRect(0, h * (0.66 + k * 0.07), w, h * 0.07); }
    palm(w * 0.18, h * 0.3, 52); palm(w * 0.8, h * 0.22, 60);
  } else if (m === 1) {   // a stepped pyramid on green hills, the sun over it
    sun(rand(0.25, 0.75) * w, h * 0.28, w * 0.12);
    g.fillStyle = '#3a9a4a'; g.beginPath(); g.moveTo(0, h); g.quadraticCurveTo(w * 0.3, h * 0.45, w * 0.6, h * 0.7); g.quadraticCurveTo(w * 0.85, h * 0.55, w, h * 0.65); g.lineTo(w, h); g.fill(); g.stroke();
    for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? '#c8803a' : '#e8a050'; const pw = w * (0.42 - k * 0.07), py = h * (0.88 - k * 0.07); g.fillRect(w * 0.5 - pw / 2, py, pw, h * 0.07); g.strokeRect(w * 0.5 - pw / 2, py, pw, h * 0.07); }
  } else if (m === 2) {   // a wave curling over, a surfer in it
    sun(w * 0.8, h * 0.22, w * 0.08);
    for (let k = 0; k < 4; k++) { g.fillStyle = ['#1a4a9a', '#2a7ad8', '#39c8e8', '#f4f0e0'][k]; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * (0.55 + k * 0.1) + Math.sin(x * 0.04 + k) * 12); g.lineTo(w, h); g.fill(); }
    g.fillStyle = '#1a4a9a'; g.beginPath(); g.moveTo(w * 0.1, h * 0.7); g.quadraticCurveTo(w * 0.3, h * 0.12, w * 0.55, h * 0.3); g.quadraticCurveTo(w * 0.42, h * 0.32, w * 0.4, h * 0.5); g.quadraticCurveTo(w * 0.36, h * 0.66, w * 0.1, h * 0.7); g.fill(); g.stroke();
    g.fillStyle = '#f4f0e0'; g.beginPath(); g.ellipse(w * 0.62, h * 0.6, 28, 6, -0.3, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#1a1420'; g.fillRect(w * 0.6, h * 0.42, 8, 26); g.beginPath(); g.arc(w * 0.6 + 4, h * 0.39, 7, 0, Math.PI * 2); g.fill();
  } else if (m === 3) {   // a face in profile, the hair flowing into flowers
    g.fillStyle = pick(['#a8603a', '#c88a5a', '#7a4a2a']); g.beginPath(); g.ellipse(w * 0.42, h * 0.6, w * 0.15, h * 0.26, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#1a1420'; g.beginPath(); g.ellipse(w * 0.36, h * 0.48, w * 0.2, h * 0.24, -0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f4f0e0'; g.beginPath(); g.ellipse(w * 0.5, h * 0.55, 8, 5, 0, 0, Math.PI * 2); g.fill();
  } else if (m === 4) {   // a lowrider on the boulevard, the mountains purple behind it
    g.fillStyle = '#5a3a8a'; g.beginPath(); g.moveTo(0, h * 0.62); for (let x = 0; x <= w; x += 32) g.lineTo(x, h * (0.42 + Math.sin(x * 0.03) * 0.08)); g.lineTo(w, h * 0.62); g.fill();
    g.fillStyle = '#3a3a44'; g.fillRect(0, h * 0.72, w, h * 0.28);
    const c = C(); g.fillStyle = c; g.beginPath(); g.moveTo(w * 0.14, h * 0.76); g.lineTo(w * 0.2, h * 0.64); g.lineTo(w * 0.36, h * 0.62); g.lineTo(w * 0.44, h * 0.52); g.lineTo(w * 0.66, h * 0.52); g.lineTo(w * 0.74, h * 0.62); g.lineTo(w * 0.88, h * 0.64); g.lineTo(w * 0.9, h * 0.76); g.closePath(); g.fill(); g.stroke();
    for (const x of [0.28, 0.76]) { g.fillStyle = '#f4f0e0'; g.beginPath(); g.arc(w * x, h * 0.77, 13, 0, Math.PI * 2); g.fill(); g.stroke(); }
    palm(w * 0.06, h * 0.2, 40);
  } else {   // bold shapes: stripes, circles, zigzags
    for (let k = 0; k < 6; k++) { g.fillStyle = C(); g.beginPath(); g.arc(rand(0, w), rand(0, h), rand(20, 60), 0, Math.PI * 2); g.fill(); g.stroke(); }
    for (let k = 0; k < 3; k++) { g.fillStyle = C(); g.beginPath(); const y = rand(0.2, 0.8) * h; g.moveTo(0, y); for (let x = 0; x <= w; x += 24) g.lineTo(x, y + ((x / 24) % 2 ? -14 : 14)); g.lineTo(w, y + 18); g.lineTo(0, y + 18); g.fill(); g.stroke(); }
  }
  if (m === 1 || m === 3) for (let k = 0; k < 7; k++) {   // flowers
    const fx = rand(0.05, 0.95) * w, fy = rand(0.55, 0.95) * h, fr = rand(8, 18), c = C();
    for (let p = 0; p < 6; p++) { const a = (p / 6) * Math.PI * 2; g.fillStyle = c; g.beginPath(); g.ellipse(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr, fr * 0.7, fr * 0.45, a, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.fillStyle = '#ffd23d'; g.beginPath(); g.arc(fx, fy, fr * 0.5, 0, Math.PI * 2); g.fill(); g.stroke();
  }
  g.fillStyle = '#1a1420'; g.fillRect(0, h - 14, w, 14);   // a zigzag border along the foot
  for (let x = 0; x < w; x += 16) { g.fillStyle = (x / 16) % 2 ? '#ffd23d' : '#e8302a'; g.beginPath(); g.moveTo(x, h); g.lineTo(x + 8, h - 12); g.lineTo(x + 16, h); g.fill(); }
}
const atlasRects = (n, cols, rows, pad = 0.002) => Array.from({ length: n }, (_, i) => ({ u0: (i % cols) / cols + pad, u1: ((i % cols) + 1) / cols - pad, v0: 1 - (Math.floor(i / cols) + 1) / rows + pad * 1.5, v1: 1 - Math.floor(i / cols) / rows - pad * 1.5 }));
function muralAtlas() {
  const cw = 256, ch = 192, cols = 3, rows = 2;
  const tex = canvasTex(cw * cols, ch * rows, (g) => { for (let i = 0; i < cols * rows; i++) { g.save(); g.translate((i % cols) * cw, Math.floor(i / cols) * ch); g.beginPath(); g.rect(0, 0, cw, ch); g.clip(); drawMural(g, cw, ch, i); g.restore(); } }, { repeat: false });
  return { tex, rects: atlasRects(cols * rows, cols, rows) };
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
  { t: 'SURF SHOP', fg: '#ffffff', bg: '#1a8ab0', f: SCRIPT, goods: 'surf' }, { t: 'BOARDS', fg: '#ffd23d', bg: '#1a1a24', f: BLADE, goods: 'surf' },
  { t: 'TACOS', fg: '#ffd23d', bg: '#c8202a', f: SCRIPT, goods: 'taqueria' }, { t: 'DONUTS', fg: '#ff5aa0', bg: '#fff4f8', f: SCRIPT, goods: 'donuts' },
  { t: 'LIQUOR', fg: '#ff2a3a', bg: '#141418', f: BLADE, goods: 'liquor' }, { t: 'NAILS', fg: '#ff4a9a', bg: '#fff0f6', f: SCRIPT, goods: 'nails' },
  { t: 'LAUNDROMAT', fg: '#ffffff', bg: '#2a5ab0', f: SANS, goods: 'laundry' }, { t: 'COFFEE', fg: '#f4e4c4', bg: '#3a2418', f: SCRIPT, goods: 'cafe' },
  { t: 'BURGERS', fg: '#ffd23d', bg: '#c8202a', f: DISPLAY, goods: 'cafe' }, { t: 'PIZZA', fg: '#ffffff', bg: '#2a6a3a', f: SCRIPT, goods: 'cafe' },
  { t: 'JUICE BAR', fg: '#ff7a2a', bg: '#f4ffe8', f: GROOVY, goods: 'juice' }, { t: 'VINTAGE', fg: '#ff7ab8', bg: '#2a1a3a', f: GROOVY, goods: 'vintage' },
  { t: 'THRIFT', fg: '#141414', bg: '#ffd23d', f: BLADE, goods: 'vintage' }, { t: 'TATTOO', fg: '#ff2a3a', bg: '#141414', f: BLADE, goods: 'tattoo' },
  { t: 'SOUVENIRS', fg: '#ffd23d', bg: '#7a1a8a', f: GROOVY, goods: 'gifts' }, { t: 'T-SHIRTS', fg: '#ffffff', bg: '#e8302a', f: BLADE, goods: 'tshirts' },
  { t: 'SUNGLASSES', fg: '#141414', bg: '#39d8e8', f: GROOVY, goods: 'shades' }, { t: 'RECORDS', fg: '#ffd23d', bg: '#c8302a', f: GROOVY, goods: 'records' },
  { t: 'BOOKS', fg: '#f0d890', bg: '#1f3a5a', f: SERIF, goods: 'books' }, { t: 'DINER', fg: '#ff3a5a', bg: '#f4f2ea', f: SCRIPT, goods: 'cafe' },
  { t: 'COCKTAILS', fg: '#39e8ff', bg: '#1a1424', f: NEON, goods: 'liquor' }, { t: 'ARCADE', fg: '#ffd23d', bg: '#2a1a5a', f: BLADE, goods: 'shop' },
  { t: 'COSTUMES', fg: '#ffffff', bg: '#a81a5a', f: DECO, goods: 'costumes' }, { t: 'STAR MAPS', fg: '#ffd23d', bg: '#1a1a3a', f: DECO, goods: 'gifts' },
  { t: 'JEWELRY', fg: '#f0c860', bg: '#1a1a24', f: SERIF, goods: 'jewel' }, { t: 'FLOWERS', fg: '#d81e5a', bg: '#fff4f8', f: SCRIPT, goods: 'flowers' },
  { t: 'MARKET', fg: '#ffffff', bg: '#1a4a8a', f: SANS, goods: 'grocery' }, { t: 'BOUTIQUE', fg: '#f4e8f0', bg: '#5a3a5a', f: SERIF, goods: 'vintage' },
  { t: 'GALLERY', fg: '#141414', bg: '#f2f0ea', f: SERIF, goods: 'gallery' }, { t: 'SKATE SHOP', fg: '#ffffff', bg: '#141414', f: BLADE, goods: 'skate' },
  { t: 'ICE CREAM', fg: '#c8306a', bg: '#fff0f4', f: SCRIPT, goods: 'icecream' }, { t: 'BIKES', fg: '#ffffff', bg: '#2a8a6a', f: SANS, goods: 'shop' },
  { t: 'TAQUERÍA', fg: '#ffd23d', bg: '#c8202a', f: SCRIPT, goods: 'taqueria' }, { t: 'PANADERÍA', fg: '#7a1a3a', bg: '#ffd8e8', f: SCRIPT, goods: 'pandulce' },
  { t: 'CARNICERÍA', fg: '#ffffff', bg: '#a8201a', f: SANS, goods: 'grocery' }, { t: 'MERCADO', fg: '#ffffff', bg: '#e86a1a', f: SANS, goods: 'grocery' },
  { t: 'PALETERÍA', fg: '#ff3d9a', bg: '#e8fff4', f: GROOVY, goods: 'icecream' }, { t: 'ZAPATERÍA', fg: '#ffd23d', bg: '#2a3a8a', f: SANS, goods: 'shoes' },
  { t: 'JOYERÍA', fg: '#f0c860', bg: '#1a1a24', f: SERIF, goods: 'jewel' }, { t: 'MARISCOS', fg: '#ffffff', bg: '#1a8ab0', f: SCRIPT, goods: 'fruit' },
  { t: 'LLANTERA', fg: '#141414', bg: '#ffd23d', f: BLADE, goods: 'tires' }, { t: 'FLORERÍA', fg: '#d81e5a', bg: '#f4fff0', f: SCRIPT, goods: 'flowers' },
  { t: 'DULCERÍA', fg: '#ffffff', bg: '#ff4a9a', f: GROOVY, goods: 'icecream' }, { t: 'MUEBLERÍA', fg: '#ffffff', bg: '#5a3a2a', f: SANS, goods: 'furniture' },
  { t: 'BOTÁNICA', fg: '#ffd23d', bg: '#3a1a5a', f: SERIF, goods: 'botanica' }, { t: 'TORTILLERÍA', fg: '#7a3a10', bg: '#ffe8a0', f: SCRIPT, goods: 'pandulce' },
].map((s, i) => ({ ...s, i }));
const bySigns = (...names) => SIGNS.filter((s) => names.includes(s.t));
export const BEACH_SIGNS = bySigns('SURF SHOP', 'BOARDS', 'TACOS', 'COFFEE', 'JUICE BAR', 'VINTAGE', 'TATTOO', 'SUNGLASSES', 'T-SHIRTS', 'ICE CREAM', 'PIZZA', 'SKATE SHOP', 'BIKES', 'BOOKS', 'GALLERY');
export const STRIP_SIGNS = bySigns('DONUTS', 'LIQUOR', 'NAILS', 'LAUNDROMAT', 'TACOS', 'BURGERS', 'PIZZA', 'COFFEE', 'MARKET', 'DINER', 'THRIFT', 'TATTOO', 'BIKES');
export const HOLLY_SIGNS = bySigns('SOUVENIRS', 'T-SHIRTS', 'COSTUMES', 'STAR MAPS', 'SUNGLASSES', 'TATTOO', 'RECORDS', 'COCKTAILS', 'ARCADE', 'BURGERS', 'PIZZA', 'JEWELRY', 'DINER', 'VINTAGE', 'COFFEE');
export const DOWNTOWN_SIGNS = bySigns('COFFEE', 'JEWELRY', 'FLOWERS', 'MARKET', 'BOOKS', 'GALLERY', 'COCKTAILS', 'BOUTIQUE', 'BURGERS', 'TACOS', 'ZAPATERÍA', 'JOYERÍA');
export const EAST_SIGNS = bySigns('TAQUERÍA', 'PANADERÍA', 'CARNICERÍA', 'MERCADO', 'PALETERÍA', 'ZAPATERÍA', 'JOYERÍA', 'MARISCOS', 'LLANTERA', 'FLORERÍA', 'DULCERÍA', 'MUEBLERÍA', 'BOTÁNICA', 'TORTILLERÍA', 'DONUTS', 'LIQUOR');
// The painted boards (shop signs, window goods, street plates, kiosk boards, parking plates, bench adverts, billboards) are
// drawn at full size into the labels' atlas in makeKit, one cell each; these paint one cell at the origin.
function drawSign(g, s, cw, ch) {
  g.fillStyle = s.bg; g.fillRect(0, 0, cw, ch);
  g.strokeStyle = s.fg; g.globalAlpha = 0.6; g.lineWidth = 4; g.strokeRect(8, 8, cw - 16, ch - 16); g.globalAlpha = 1;
  let px = s.f === SCRIPT ? 60 : 68;
  const weight = s.f === SANS ? 700 : 400;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = s.fg;
  do g.font = `${weight} ${px--}px ${s.f}`; while (g.measureText(s.t).width > cw - 48 && px > 18);
  g.fillText(s.t, cw / 2, ch / 2 + (s.f === SCRIPT ? -2 : 3));
}
// what each kind of shop shows in its window, warm light behind
const GOODS = ['cafe', 'books', 'records', 'vintage', 'flowers', 'grocery', 'gallery', 'icecream', 'jewel', 'shop', 'gifts', 'taqueria', 'pandulce', 'fruit', 'botanica',
  'surf', 'donuts', 'liquor', 'nails', 'laundry', 'juice', 'tattoo', 'tshirts', 'shades', 'skate', 'costumes', 'shoes', 'furniture', 'tires'];
export const GI = Object.fromEntries(GOODS.map((k, i) => [k, i]));
function drawGoods(g, k, w, h) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe6b8'); gr.addColorStop(1, '#f0b870');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const shelf = (y) => { g.fillStyle = '#6a4a2a'; g.fillRect(0, y, w, 4); };
  const dots = (cols, n, r, y0, y1) => { for (let i = 0; i < n; i++) { g.fillStyle = pick(cols); g.beginPath(); g.arc(rand(6, w - 6), rand(y0, y1), r * rand(0.7, 1.2), 0, Math.PI * 2); g.fill(); } };
  const rack = (cols, y0 = 26, y1 = 90) => { g.fillStyle = '#3a3a3a'; g.fillRect(4, y0 - 4, w - 8, 3); for (let x = 8; x < w - 8; x += 9) { g.fillStyle = pick(cols); g.beginPath(); g.moveTo(x, y0); g.lineTo(x + 8, y0); g.lineTo(x + 10, y1); g.lineTo(x - 2, y1); g.fill(); } };
  const people = (n) => { g.fillStyle = 'rgba(80,40,20,0.35)'; for (let i = 0; i < n; i++) { const x = rand(10, w - 10); g.beginPath(); g.arc(x, h - 40, 9, 0, Math.PI * 2); g.fill(); g.fillRect(x - 10, h - 32, 20, 32); } };
  if (k === 'cafe') { people(5); g.fillStyle = '#2a1a14'; g.fillRect(8, 8, w - 16, 26); g.fillStyle = '#f4f0e0'; for (let i = 0; i < 4; i++) g.fillRect(14, 13 + i * 5, rand(30, w - 30), 2); }
  else if (k === 'books') { for (const y of [32, 64, 96]) { shelf(y); for (let x = 2; x < w - 4; x += 6) { g.fillStyle = pick(['#7a1a1a', '#1a3a6a', '#2a5a2a', '#c8a040', '#3a2a1a', '#e8dcc0']); g.fillRect(x, y - rand(16, 24), 5, 24); } } }
  else if (k === 'records') { for (let i = 0; i < 12; i++) { const x = 6 + (i % 4) * 30, y = 10 + Math.floor(i / 4) * 32; g.fillStyle = pick(['#e8302a', '#ffd23d', '#2a6ad8', '#1a1a1a', '#f4f0e0', '#8a3ab4', '#3ab46a']); g.fillRect(x, y, 26, 26); g.fillStyle = pick(['#1a1a1a', '#ffffff', '#ff7a2a']); g.beginPath(); g.arc(x + 13, y + 13, rand(4, 9), 0, Math.PI * 2); g.fill(); } }
  else if (k === 'vintage') rack(['#c8302a', '#e8c040', '#3a6ab0', '#f4e4d0', '#5a3a2a', '#ff7ab8', '#2a8a6a', '#8a5a3a']);
  else if (k === 'tshirts') { rack(['#ffffff', '#141414', '#e8302a', '#2a6ad8', '#ffd23d', '#39c8a8'], 20, 56); rack(['#ff7ab8', '#ffffff', '#141414', '#7a3ab4', '#ff8a2a'], 66, 104); }
  else if (k === 'flowers') { g.fillStyle = '#2a5a2a'; g.fillRect(0, h - 40, w, 40); dots(['#e8205a', '#ff6a9a', '#fff0f4', '#ffd23d', '#c81e3a', '#ff8a3a', '#8a5ad8'], 70, 5, h - 70, h - 20); }
  else if (k === 'grocery') { for (const y of [28, 58, 88]) { shelf(y); for (let x = 4; x < w - 8; x += 11) { g.fillStyle = pick(['#c8202a', '#2a6ad0', '#f2c230', '#3a9a4a', '#f4f0e8', '#e86a1a']); g.fillRect(x, y - 16, 9, 16); } } }
  else if (k === 'gallery') { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3; i++) { const x = 8 + i * ((w - 16) / 3); g.fillStyle = pick(['#ffd23d', '#ff3d7f', '#39c8e8', '#b46bff']); g.fillRect(x, 20, (w - 40) / 3, 64); g.fillStyle = pick(['#1a1a1a', '#e8302a', '#2a6ad8']); g.beginPath(); g.arc(x + (w - 40) / 6, 52, 12, 0, Math.PI * 2); g.fill(); } }
  else if (k === 'icecream') { g.fillStyle = '#f8f4f0'; g.fillRect(0, h - 44, w, 44); for (let x = 8; x < w - 8; x += 20) { g.fillStyle = pick(['#ffd8e8', '#fff4d0', '#8a5a3a', '#c8f0d8', '#ff9ab8', '#f4e8a0']); g.fillRect(x, h - 40, 18, 16); } dots(['#ff9ab8', '#fff4d0', '#8a5a3a', '#c8f0d8'], 8, 9, 20, 50); }
  else if (k === 'jewel') { g.fillStyle = '#1a1420'; g.fillRect(0, 0, w, h); for (let i = 0; i < 30; i++) { g.fillStyle = pick(['#ffe080', '#ffffff', '#ff8aa0', '#a0d8ff', '#39d8a0']); g.beginPath(); g.arc(rand(6, w - 6), rand(h * 0.3, h - 10), rand(1.5, 3.5), 0, Math.PI * 2); g.fill(); } }
  else if (k === 'gifts') { for (let i = 0; i < 9; i++) { const x = rand(8, w - 30), y = rand(h * 0.4, h - 26); g.fillStyle = pick(['#c8202a', '#2a8a4a', '#f2c230', '#2a5ab0', '#ff7ab8']); g.fillRect(x, y, 24, 24); } g.fillStyle = '#ffd23d'; for (let i = 0; i < 5; i++) { const x = 14 + i * 22, y = 24; g.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + (j * Math.PI) / 5, r = j % 2 ? 4 : 10; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); } }   // little gold stars, snow globes, mugs
  else if (k === 'taqueria') { g.fillStyle = '#2a1a14'; g.fillRect(6, 6, w - 12, 44); g.fillStyle = '#ffd23d'; for (let i = 0; i < 5; i++) g.fillRect(12, 12 + i * 7, rand(40, w - 30), 3); for (let x = 0; x < w; x += 16) { g.fillStyle = pick(PAPEL); g.fillRect(x + 2, 54, 12, 12); } people(4); }
  else if (k === 'pandulce') { for (const y of [44, 88]) { shelf(y); for (let x = 12; x < w - 10; x += 22) { g.fillStyle = pick(['#ff9ab8', '#f4e0a0', '#8a5a3a', '#ffd8a0']); g.beginPath(); g.arc(x, y - 9, 9, Math.PI, 0); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 6, y - 12); g.lineTo(x + 6, y - 12); g.stroke(); } } }   // conchas
  else if (k === 'fruit') { for (const y of [50, 100]) { g.fillStyle = '#8a6a3a'; g.fillRect(0, y - 4, w, 8); dots(['#e8201a', '#ffa01a', '#ffd23d', '#6ab43a', '#f2e070', '#ff5a2a'], 24, 6, y - 24, y - 8); } }
  else if (k === 'botanica') { g.fillStyle = '#2a1a2a'; g.fillRect(0, 0, w, h); for (let x = 8; x < w - 8; x += 13) for (const y of [40, 86]) { g.fillStyle = pick(['#e8302a', '#ffd23d', '#2a6ad8', '#f4f0e0', '#3ab46a', '#b46bff']); g.fillRect(x, y - 26, 9, 26); g.fillStyle = '#ffe080'; g.beginPath(); g.arc(x + 4.5, y - 30, 3, 0, Math.PI * 2); g.fill(); } }   // tall saints' candles
  else if (k === 'surf') { for (let x = 8; x < w - 6; x += 15) { g.fillStyle = pick(['#f4f0e8', '#ffd23d', '#39c8e8', '#ff7a2a', '#ff5aa0', '#7cd84a']); g.beginPath(); g.ellipse(x, h * 0.5, 6, h * 0.42, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - 0.5, h * 0.1, 1, h * 0.8); } }   // boards standing in a row
  else if (k === 'donuts') { for (const y of [40, 86]) { shelf(y); for (let x = 12; x < w - 10; x += 20) { g.fillStyle = pick(['#c8843a', '#ff9ab8', '#5a3018', '#f4f0e8', '#ffd23d']); g.beginPath(); g.arc(x, y - 9, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f0b870'; g.beginPath(); g.arc(x, y - 9, 2.6, 0, Math.PI * 2); g.fill(); } } }
  else if (k === 'liquor') { for (const y of [40, 80, 112]) { shelf(y); for (let x = 6; x < w - 6; x += 9) { g.fillStyle = pick(['#2a3a1a', '#4a1a1a', '#c8a050', '#1a2a4a', '#e8e0d0']); g.fillRect(x, y - 26, 6, 26); g.fillRect(x + 2, y - 32, 2, 6); } } }
  else if (k === 'nails') { g.fillStyle = '#ffe8f0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { const x = 12 + i * 30; g.fillStyle = '#ff9ac0'; g.fillRect(x, 60, 22, 30); g.fillRect(x - 2, 52, 26, 10); } for (let x = 8; x < w - 8; x += 7) { g.fillStyle = pick(['#ff3d7f', '#e8302a', '#b46bff', '#ff8aa0', '#39c8e8', '#ffd23d']); g.fillRect(x, 16, 5, 14); } }
  else if (k === 'laundry') { g.fillStyle = '#e8eef4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { const x = 18 + i * 30; g.fillStyle = '#c8ccd2'; g.fillRect(x - 13, 50, 26, 50); g.fillStyle = '#5a6a7a'; g.beginPath(); g.arc(x, 76, 9, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(160,200,255,0.6)'; g.beginPath(); g.arc(x, 76, 6, 0, Math.PI * 2); g.fill(); } }
  else if (k === 'juice') { g.fillStyle = '#f4ffe8'; g.fillRect(0, 0, w, h); for (let x = 10; x < w - 8; x += 16) { g.fillStyle = pick(['#ff7a2a', '#7cd84a', '#ff3d7f', '#ffd23d', '#b46bff']); g.fillRect(x, 70, 10, 22); g.fillStyle = '#f4f4f0'; g.fillRect(x + 4, 62, 2, 10); } dots(['#ffa01a', '#7cd84a', '#ffd23d', '#e8201a'], 18, 6, 20, 46); }
  else if (k === 'tattoo') { g.fillStyle = '#f2ece0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { const x = 6 + (i % 4) * 30, y = 8 + Math.floor(i / 4) * 50; g.strokeStyle = '#1a1a1a'; g.lineWidth = 2; g.strokeRect(x, y, 26, 40); g.fillStyle = pick(['#e8302a', '#2a6ad8', '#3a9a4a', '#ffd23d']); g.beginPath(); g.arc(x + 13, y + 18, 8, 0, Math.PI * 2); g.fill(); } }   // flash sheets on the wall
  else if (k === 'shades') { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, h); for (let y = 18; y < h - 10; y += 22) for (let x = 10; x < w - 14; x += 26) { g.fillStyle = pick(['#141414', '#c8302a', '#ff7ab8', '#2a6ad8', '#e8c040']); g.beginPath(); g.ellipse(x, y, 6, 5, 0, 0, Math.PI * 2); g.ellipse(x + 13, y, 6, 5, 0, 0, Math.PI * 2); g.fill(); } }
  else if (k === 'skate') { for (let x = 10; x < w - 8; x += 14) { g.fillStyle = pick(['#e8302a', '#ffd23d', '#39c8e8', '#141414', '#7cd84a', '#ff7ab8']); g.beginPath(); g.ellipse(x, 56, 5, 40, 0, 0, Math.PI * 2); g.fill(); } }   // decks on the wall
  else if (k === 'costumes') { rack(['#c8202a', '#141414', '#ffd23d', '#2a5ab0', '#f4f0e8', '#7a3ab4']); for (let i = 0; i < 4; i++) { g.fillStyle = pick(['#ffd23d', '#141414', '#ff7ab8', '#f4f0e8']); g.beginPath(); g.arc(20 + i * 30, 104, 9, Math.PI, 0); g.fill(); } }
  else if (k === 'shoes') { for (const y of [40, 80, 112]) { shelf(y); for (let x = 8; x < w - 14; x += 18) { g.fillStyle = pick(['#141414', '#8a5a2a', '#f4f0e8', '#c8302a', '#2a4a8a']); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14, y); g.lineTo(x + 14, y - 6); g.lineTo(x + 4, y - 12); g.lineTo(x, y - 12); g.fill(); } } }
  else if (k === 'furniture') { for (let i = 0; i < 2; i++) { const x = 10 + i * 60; g.fillStyle = pick(['#c8302a', '#2a5a8a', '#8a6a3a', '#3a7a5a']); g.fillRect(x, 64, 50, 26); g.fillRect(x, 50, 50, 16); g.fillRect(x - 4, 56, 8, 34); g.fillRect(x + 46, 56, 8, 34); } }
  else if (k === 'tires') { g.fillStyle = '#d8d2c8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { g.fillStyle = '#1a1a1c'; g.fillRect(8 + i * 24, h - 18 - j * 18, 20, 16); g.fillStyle = '#3a3a3e'; g.fillRect(12 + i * 24, h - 14 - j * 18, 12, 8); } }
  else { for (const y of [40, 86]) { shelf(y); dots(['#2a2a30', '#8a2a2a', '#3a5a8a', '#c8a070', '#f4f0e8'], 16, 6, y - 16, y - 6); } }
}
// the city's street plates: white letters on blue, the hundred-block on the end
export const STREETS = [['HOLLYWOOD BL', '6800'], ['SUNSET BL', '8400'], ['VINE ST', '1700'], ['HIGHLAND AV', '1600'], ['WILSHIRE BL', '5900'], ['LA BREA AV', '400'],
  ['FAIRFAX AV', '700'], ['MELROSE AV', '7300'], ['SANTA MONICA BL', '9400'], ['RODEO DR', '300'], ['FIGUEROA ST', '800'], ['BROADWAY', '600'], ['SPRING ST', '200'],
  ['GRAND AV', '100'], ['ALAMEDA ST', '800'], ['CESAR E CHAVEZ AV', '2400'], ['WHITTIER BL', '4500'], ['SOTO ST', '300'], ['WESTERN AV', '1100'], ['VERMONT AV', '2800'],
  ['LOS FELIZ BL', '2000'], ['ABBOT KINNEY BL', '1300'], ['MAIN ST', '2700'], ['OCEAN AV', '1500'], ['PICO BL', '1200'], ['OLYMPIC BL', '9000'], ['CENTURY BL', '9800'],
  ['CRENSHAW BL', '4300'], ['ROSE AV', '200'], ['CAHUENGA BL', '1600']];
function drawStreet(g, [st, no], cw, ch) {
  g.fillStyle = '#1a4aa0'; g.fillRect(0, 0, cw, ch);
  g.strokeStyle = '#f4f4f0'; g.lineWidth = 3; g.strokeRect(5, 5, cw - 10, ch - 10);
  g.fillStyle = '#f4f4f0'; g.textBaseline = 'middle';
  g.textAlign = 'right'; g.font = `500 20px ${SANS}`; g.fillText(no, cw - 14, ch / 2 + 1);
  g.textAlign = 'left'; let px = 42; do g.font = `500 ${px--}px ${SANS}`; while (g.measureText(st).width > cw - 96 && px > 14);
  g.fillText(st, 14, ch / 2 + 2);
}
// boards for kiosks, stands and carts
export const KIOSKS = [['ELOTES', '#ffd23d', '#a8201a'], ['MANGOS', '#ff8a1a', '#ffffff'], ['PALETAS', '#39c8e8', '#ffffff'], ['HOT DOGS', '#c8202a', '#ffd23d'], ['TACOS', '#2a8a4a', '#ffffff'],
  ['CHURROS', '#8a4a1a', '#ffe8a0'], ['FRUTA', '#e8302a', '#ffffff'], ['TAMALES', '#f4e8c8', '#8a2a1a'], ['STAR MAPS', '#1a1a3a', '#ffd23d'], ['TOURS', '#ffd23d', '#141414'],
  ['SUNGLASSES', '#39d8e8', '#141414'], ['HENNA', '#7a2a1a', '#ffd8a0'], ['COFFEE', '#3a2418', '#f4e4c4'], ['ICE CREAM', '#fff0f4', '#c8306a'], ['LEMONADE', '#ffe83a', '#2a6a2a'],
  ['FLOWERS', '#fff4f8', '#d81e5a'], ['NEWS', '#1a4a2a', '#f4f0e0'], ['T-SHIRTS', '#e8302a', '#ffffff']];
function drawKiosk(g, [t, bg, fg], cw, ch) {
  g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let px = 42; do g.font = `400 ${px--}px ${SCRIPT}`; while (g.measureText(t).width > cw - 20 && px > 12);
  g.fillText(t, cw / 2, ch / 2);
}
export const KI = Object.fromEntries(KIOSKS.map(([t], i) => [t, i]));
// the parking signs stacked up a pole, each plate with its own rule; the famous puzzle of the city's kerbs
const PLATES = [['#d8202a', [['TOW-AWAY', 22], ['NO STOPPING', 22], ['4 PM – 7 PM', 24], ['MON – FRI', 20]]], ['#1a8a3a', [['2 HOUR', 26], ['PARKING', 24], ['8 AM – 6 PM', 22], ['EXCEPT SUNDAY', 16]]],
  ['#d8202a', [['NO PARKING', 22], ['8 AM – 10 AM', 22], ['TUESDAY', 22], ['STREET CLEANING', 15]], true], ['#1a1a1a', [['PERMIT', 24], ['PARKING', 24], ['ONLY', 24], ['DISTRICT 74', 18]]]];
function drawPlate(g, [fg, lines, icon], cw, ch) {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, cw, ch); g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(4, 4, cw - 8, ch - 8);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(([t, px], k) => { g.font = `700 ${px}px ${SANS}`; g.fillText(t, cw / 2, 22 + k * (ch - 34) / Math.max(1, lines.length - 1)); });
  if (icon) { g.lineWidth = 5; g.strokeStyle = '#d8202a'; g.beginPath(); g.arc(26, 30, 14, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#141414'; g.font = `700 20px ${SANS}`; g.fillText('P', 26, 31); g.beginPath(); g.moveTo(16, 20); g.lineTo(36, 40); g.stroke(); }
}
// the big painted billboards for pictures nobody has made: a planet, palms in the night, a wave, a heart in neon, a
// desert road, a robot; the title, the line under it
const BILLBOARDS = [['STARFALL', 'IN THEATERS JUNE 13'], ['PALM NIGHTS', 'A STORY OF THE CITY'], ['THE LAST WAVE', 'SUMMER IS COMING'], ['NEON HEARTS', 'NOW PLAYING'],
  ['DESERT KING', 'ONE ROAD. NO WAY BACK.'], ['ROBOT SUMMER', 'COMING SOON']];
function drawBillboard(g, i, cw, ch) {
  const [t, sub] = BILLBOARDS[i];
  const sky = g.createLinearGradient(0, 0, 0, ch);
  const pal = [['#0a0a2a', '#4a2a8a'], ['#1a0a2a', '#e83a6a'], ['#1a6ab0', '#ffd23d'], ['#2a0a1a', '#ff3a7a'], ['#ff8a2a', '#ffe0a0'], ['#39c8e8', '#ffd8e8']][i];
  sky.addColorStop(0, pal[0]); sky.addColorStop(1, pal[1]); g.fillStyle = sky; g.fillRect(0, 0, cw, ch);
  if (i === 0) { g.fillStyle = '#ff8a3a'; g.beginPath(); g.arc(cw * 0.78, ch * 0.42, 70, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffffff'; for (let k = 0; k < 60; k++) g.fillRect(rand(0, cw), rand(0, ch), 2, 2); }
  else if (i === 1) { g.fillStyle = '#0a0a14'; for (const px of [60, 420]) { g.fillRect(px, 40, 8, ch); for (let k = 0; k < 9; k++) { const a = -Math.PI + (k / 8) * Math.PI; g.beginPath(); g.moveTo(px + 4, 40); g.lineTo(px + 4 + Math.cos(a) * 70, 40 + Math.sin(a) * 30 + 26); g.lineTo(px + 4 + Math.cos(a) * 56, 40 + Math.sin(a) * 26 + 14); g.fill(); } } }
  else if (i === 2) { g.fillStyle = '#1a4a9a'; g.beginPath(); g.moveTo(0, ch); g.quadraticCurveTo(cw * 0.4, -20, cw * 0.75, ch * 0.5); g.quadraticCurveTo(cw * 0.55, ch * 0.5, cw * 0.5, ch); g.fill(); g.fillStyle = '#f4f0e0'; g.beginPath(); g.ellipse(cw * 0.66, ch * 0.62, 50, 8, -0.4, 0, Math.PI * 2); g.fill(); }
  else if (i === 3) { g.strokeStyle = '#ff5aa0'; g.lineWidth = 9; g.shadowColor = '#ff5aa0'; g.shadowBlur = 20; const hx = cw * 0.78, hy = ch * 0.5, r = 40; g.beginPath(); g.moveTo(hx, hy + r); g.bezierCurveTo(hx - r * 2, hy, hx - r, hy - r * 1.4, hx, hy - r * 0.4); g.bezierCurveTo(hx + r, hy - r * 1.4, hx + r * 2, hy, hx, hy + r); g.stroke(); g.shadowBlur = 0; }
  else if (i === 4) { g.fillStyle = '#c86a3a'; g.fillRect(0, ch * 0.62, cw, ch); g.fillStyle = '#3a3a40'; g.beginPath(); g.moveTo(cw * 0.46, ch * 0.62); g.lineTo(cw * 0.54, ch * 0.62); g.lineTo(cw * 0.9, ch); g.lineTo(cw * 0.1, ch); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(cw * 0.495, ch * 0.7, 6, 20); g.fillRect(cw * 0.49, ch * 0.86, 8, 26); }
  else { g.fillStyle = '#c8ccd4'; g.fillRect(cw * 0.7, 40, 70, 80); g.fillRect(cw * 0.72, ch * 0.62, 56, 70); g.fillStyle = '#39e8ff'; g.fillRect(cw * 0.73, 64, 16, 12); g.fillRect(cw * 0.79, 64, 16, 12); }
  g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 8;
  let px = 74; do g.font = `400 ${px--}px ${i % 2 ? DECO : BLADE}`; while (g.measureText(t).width > cw * 0.62 && px > 20);
  g.fillText(t, 26, ch * 0.42);
  g.font = `500 22px ${SANS}`; g.fillText(sub, 28, ch * 0.74);
}
// the bus benches' adverts (all invented)
const ADS = [['PALM REALTY', 'SELL YOUR HOME TODAY', '#1a5a8a', '#ffffff'], ['INJURED? CALL SAM', '(213) 555-0147', '#ffd23d', '#141414'], ['STAR CAR WASH', '$9.99 EXPRESS', '#e8302a', '#ffffff'], ['SUNNY DENTAL', 'SMILE, LOS ANGELES', '#39c8a8', '#ffffff']];
function drawAd(g, [t, sub, bg, fg], cw, ch) {
  g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let px = 58; do g.font = `700 ${px--}px ${SANS}`; while (g.measureText(t).width > cw - 40 && px > 16);
  g.fillText(t, cw / 2, 46); g.font = `500 28px ${SANS}`; g.fillText(sub, cw / 2, 98);
}

// ---------- palettes ----------
const SKIN = ['#f0d0b4', '#e8c4a4', '#d8a888', '#c08a68', '#8a5a3a', '#6a4028', '#f4dcc4', '#b07850', '#a86a48'];
const HAIR = ['#2a1e16', '#4a3424', '#6a5038', '#c8a878', '#1a1410', '#8a8a88', '#a85a2a', '#e8d090', '#f2dc90'];
const TOPS = ['#ffffff', '#141414', '#e8302a', '#2a6ad8', '#ffd23d', '#39c8a8', '#ff7ab8', '#7a3ab4', '#ff8a2a', '#3a8a5a', '#f4e8d0', '#5a6a8a', '#e8e4dc', '#9ad8f0'];   // T-shirts and tank tops
const LEGS = ['#2a3a5a', '#3a4a6a', '#1a1c24', '#5a5040', '#c8b490', '#2a2a30', '#4a5a7a', '#e8e4dc', '#6a6a70'];
const SWIM = ['#e8302a', '#ffd23d', '#2a6ad8', '#ff5aa0', '#39c8e8', '#141414', '#ff8a2a', '#7cd84a', '#f4f0e8'];
export const BOARDS = ['#f4f0e8', '#ffd23d', '#39c8e8', '#ff7a2a', '#ff5aa0', '#f4f0e8', '#7cd84a', '#e8e4dc'];
const CARS = ['#e8e8ea', '#1a1c20', '#c8ccd2', '#5a5e66', '#8a1a1a', '#2a3a5a', '#f2f0ea', '#9aa0a8', '#2a5a8a', '#3a3a40', '#c8302a', '#d8c8a0'];
const CLASSIC = ['#39b8b0', '#ff8aa8', '#f4e8c8', '#a8d8c0', '#e8302a', '#2a4a8a', '#f2c230', '#1a1a1e'];   // the classic cars' two-tones
export const STUCCO = ['#f4ecdc', '#f6f0e4', '#f2e2cc', '#f0dcc0', '#e8d8c4', '#f4e4d8', '#f8f2e8', '#ecdcc8'];
export const PASTEL = ['#9ad8d0', '#f8b8c8', '#f4e0a0', '#b8e0c0', '#c8d8f4', '#f8c8a0', '#e8c8e8', '#f4f0e8', '#ffd8b0'];
const CRAFT = ['#8a9a7a', '#7a5a3a', '#e8dcc0', '#c8a050', '#3a5a4a', '#b0705a', '#5a6a7a', '#a8a088', '#6a4a3a'];
const BONNET = ['#e8c030', '#e8c030', '#e8e4dc'];   // the hydrants: yellow, a few white

export function makeKit() {
  const K = {};
  K.face = face;
  // ---------- materials ----------
  const pave = pavementTex();
  K.sideMat = std({ map: pave, roughness: 0.85 }); K.sideMat.map = pave.clone(); K.sideMat.map.repeat.set(2, 23); K.sideMat.map.needsUpdate = true;   // the track's side strips
  K.paveMat = std({ map: pave, roughness: 0.85 });
  K.roadMat = std({ map: asphaltTex(), roughness: 0.9 });
  K.stuccoMat = std({ map: stuccoTex(), vertexColors: true, roughness: 0.85 });
  K.tileMat = std({ map: tileTex(), vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
  K.sidingMat = std({ map: sidingTex(), vertexColors: true, roughness: 0.8 });
  const sp = starTex();
  K.starMat = std({ map: sp, roughness: 0.4, metalness: 0.2 });
  const tiledP = new Map(), tiledB = new Map();
  K.tiledPlane = (w, d, k) => { const key = `${w.toFixed(2)}|${d.toFixed(2)}|${k}`; if (!tiledP.has(key)) tiledP.set(key, planeUV({ u0: 0, u1: w / k, v0: 0, v1: d / k })); return tiledP.get(key); };
  K.tiledBox = (w, h, d, k = 2) => { const key = `${w.toFixed(1)}|${h.toFixed(1)}|${d.toFixed(1)}|${k}`; if (!tiledB.has(key)) tiledB.set(key, tiledBox(+w.toFixed(1), +h.toFixed(1), +d.toFixed(1), k)); return tiledB.get(key); };
  K.pave = (b, x, z, w, d, y = 0.03) => b.add(K.tiledPlane(w, d, 3.5), K.paveMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0);
  K.road = (b, x, z, w, d, y = 0.035) => b.add(K.tiledPlane(w, d, 6), K.roadMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0);
  K.lawn = (b, x, z, w, d, col = '#5a7a3a', y = 0.04) => b.add(G.plane, VC.solid, x, y, z, w, d, 1, -Math.PI / 2, 0, 0, col);
  const mu = muralAtlas();
  K.muralRects = mu.rects; K.muralMat = std({ map: mu.tex, roughness: 0.85, emissive: '#ffffff', emissiveMap: mu.tex, emissiveIntensity: 0.12 });
  const pp = papelAtlas();
  K.papelRects = pp.rects; K.papelMat = std({ map: pp.tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9, emissive: '#ffffff', emissiveMap: pp.tex, emissiveIntensity: 0.35 });
  K.poolMat = basic({ map: canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { repeat: false }),
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  K.pool = (b, x, z, w, d, col, y = 0.06) => b.add(G.plane, K.poolMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0, col);   // lamplight on the ground
  K.water = waterMat('#2a4a6a', 8);
  // the marquees' running bulbs: two sets that light in turn
  K.chaseA = basic({ color: hdr('#ffe0a0', 3) }); K.chaseB = basic({ color: hdr('#ffe0a0', 3) });
  // Every label, blade sign and painted board is drawn once into one atlas (labels at half size) and set with one material,
  // so all the words and boards in a chunk cost a single draw; their brightness rides in the vertex colour. K.sign / K.vsign /
  // K.board take the place of add(G.plane, someMat) on a Batcher or a frame.
  const AW = 2048, AH = 4096, atlas = document.createElement('canvas'); atlas.width = AW; atlas.height = AH;
  const actx = atlas.getContext('2d'), atex = new THREE.CanvasTexture(atlas);
  atex.colorSpace = THREE.SRGBColorSpace; atex.anisotropy = 4;
  K.labelMat = basic({ map: atex, vertexColors: true, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, forceSinglePass: true });
  // cells sit on shelves: the first shelf as tall as the cell (or up to a third taller) with room left, else a new one below;
  // gap 0 butts the opaque boards together, a label keeps clear of its neighbours
  const slots = new Map(), shelves = [], NONE = { u0: 1 - 1 / AW, u1: 1 - 0.5 / AW, v0: 0.5 / AH, v1: 1 / AH };   // a corner never drawn: clear
  let top = 0, full = false;
  const slot = (key, w, h, draw, gap = 4) => {
    if (slots.has(key)) return slots.get(key);
    const at = (s) => (s.x ? s.x + Math.max(gap, s.gap) : 0);
    let s = shelves.find((s) => s.h >= h && s.h <= h * 1.34 && at(s) + w <= AW);
    if (!s) {
      if (top + h > AH - 2) { if (!full) console.warn('la label atlas is full'); full = true; slots.set(key, NONE); return NONE; }
      shelves.push((s = { y: top, h, x: 0, gap })); top += h + 4;
    }
    const ax = at(s), ay = s.y, e = gap ? 0.5 : 1.5;
    s.x = ax + w; s.gap = gap;
    actx.save(); actx.translate(ax, ay); actx.beginPath(); actx.rect(0, 0, w, h); actx.clip(); actx.clearRect(0, 0, w, h); draw(actx, w, h); actx.restore();
    const r = { u0: (ax + e) / AW, u1: (ax + w - e) / AW, v0: 1 - (ay + h - e) / AH, v1: 1 - (ay + e) / AH };
    atex.needsUpdate = true;
    slots.set(key, r); return r;
  };
  // the boards first, tallest first, so their shelves come out full
  const board = (key, w, h, k, draw) => ({ ...slot(key, w, h, draw, 0), k });
  K.billRects = BILLBOARDS.map((_, i) => board('b' + i, 512, 224, 1.05, (g, w, h) => drawBillboard(g, i, w, h)));
  K.plateRects = PLATES.map((p, i) => board('p' + i, 128, 128, 0.8, (g, w, h) => drawPlate(g, p, w, h)));
  K.adRects = ADS.map((a, i) => board('a' + i, 512, 128, 0.85, (g, w, h) => drawAd(g, a, w, h)));
  K.goodsRects = GOODS.map((k, i) => board('g' + i, 128, 112, 1.0, (g, w, h) => drawGoods(g, k, w, h)));
  K.signRects = SIGNS.map((sg) => board('s' + sg.i, 384, 78, 0.92, (g) => { g.scale(0.75, 0.75); drawSign(g, sg, 512, 104); }));   // seen edge-on from the track: three-quarter size does
  K.streetRects = STREETS.map((st, i) => board('st' + i, 320, 72, 0.85, (g, w, h) => drawStreet(g, st, w, h)));
  K.kioskRects = KIOSKS.map((ks, i) => board('k' + i, 256, 64, 1.0, (g, w, h) => drawKiosk(g, ks, w, h)));
  K.board = (t, r, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => t.add(planeUV(r), K.labelMat, x, y, z, sx, sy, sz, rx, ry, rz, hdr('#ffffff', r.k));
  const drawLabel = (g, w, h, text, { color = '#ffffff', font = DISPLAY, weight = 400, size = 0.6, bg = null, border = null, glow = null }) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    if (border) { const m = Math.min(w, h); g.strokeStyle = border; g.lineWidth = m * 0.05; g.strokeRect(m * 0.07, m * 0.07, w - m * 0.14, h - m * 0.14); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color;
    if (glow) { g.shadowColor = glow; g.shadowBlur = Math.min(w, h) * 0.12; }
    let px = Math.floor(h * size); g.font = `${weight} ${px}px ${font}`;
    const m = g.measureText(text).width, max = w * 0.88;
    if (m > max) { px = Math.floor((px * max) / m); g.font = `${weight} ${px}px ${font}`; }
    g.fillText(text, w / 2, h / 2 + h * 0.04);
    if (glow) { g.shadowBlur = Math.min(w, h) * 0.03; g.fillText(text, w / 2, h / 2 + h * 0.04); }
  };
  K.sign = (t, text, o = {}, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => {
    const w = Math.round((o.w || 512) / 2), h = Math.round((o.h || 128) / 2);
    const r = slot(['h', text, w, h, o.color, o.font, o.weight, o.size, o.bg, o.border, o.glow].join('|'), w, h, (g) => drawLabel(g, w, h, text, o));
    return t.add(planeUV(r), K.labelMat, x, y, z, sx, sy, sz, rx, ry, rz, hdr('#ffffff', o.k ?? 1.1));
  };
  K.vsign = (t, text, { color = '#ffffff', font = BLADE, bg = null, glow = null, k = 1.4 } = {}, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => {   // its letters stacked one under another
    // painted lying on its side, first letter on the right, so it packs on a low shelf; the plane turned a quarter in its own
    // plane stands it up again
    const n = text.length, cw = 48;
    const r = slot(['v', text, color, font, bg, glow].join('|'), cw * n, cw, (g) => {
      if (bg) { g.fillStyle = bg; g.fillRect(0, 0, cw * n, cw); }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color; g.font = `400 38px ${font}`;
      if (glow) { g.shadowColor = glow; g.shadowBlur = 7; }
      [...text].forEach((c, i) => { g.save(); g.translate(cw * (n - 1 - i) + cw / 2, cw / 2); g.rotate(Math.PI / 2); g.fillText(c, 0, 2); g.restore(); });
    });
    return t.add(planeUV(r), K.labelMat, x, y, z, sy, sx, sz, rx, ry, rz + Math.PI / 2, hdr('#ffffff', k));
  };
  // builds fn(temp) on its own and sets it into b through the matrix m (for things that tilt)
  K.place = (b, fn, m) => { const t = new Batcher(); fn(t); for (const [mat, list] of t.buckets) for (const g of list) b.addM(g, mat, m, null); };

  // ---------- trees and plants ----------
  const SY = sydneyTreeKit(), LJ = lijiangTreeKit(), LT = laTreeKit();
  K.fanPalm = LT.fanPalm; K.strelitzia = LT.strelitzia; K.palm = SY.palm; K.jacaranda = SY.jacaranda; K.fig = SY.fig; K.bougain = LJ.bougain;
  // a row of fan palms down the street at x, their crowns all of a height or near it
  K.palmRow = (b, x, z0, z1, { step = [12, 16], gaps = [], s = [0.95, 1.15] } = {}) => {
    for (let z = z0 + rand(1, step[0] * 0.6); z < z1 - 1; z += rand(...step)) if (!gaps.some(([a, c]) => z > a - 1.2 && z < c + 1.2)) K.fanPalm(b, x, -z, rand(...s));
  };
  K.shrub = (b, x, z, { y = 0, s = rand(0.7, 1.1), col = pick(['#2a4a2a', '#3a5a32', '#2e5a3a', '#4a6a3a']) } = {}) => b.add(G.sphLow, VC.solid, x, y + 0.4 * s, z, 1.2 * s, 0.9 * s, 1.2 * s, 0, rand(0, 3), 0, col);
  K.hedge = (b, x, z, w, d, h = 1.4, col = pick(['#2e4e2a', '#36582e', '#2a4626'])) => { b.block(VC.solid, col, x, 0, z, w, h, d); b.box(VC.solid, shade(col, 1.15), x, h, z, w + 0.06, 0.08, d + 0.06); };
  K.agave = (b, x, z, s = 1, { y = 0, col = pick(['#6a8a8a', '#7a9a90', '#5a7a74']) } = {}) => {   // a blue agave: its stiff leaves thrown up in a rosette
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2 + rand(-0.2, 0.2), t = rand(0.5, 0.95); b.add(G.cone4, VC.solid, x + Math.cos(a) * 0.32 * s, y + 0.45 * s, z + Math.sin(a) * 0.32 * s, 0.22 * s, 1.0 * s, 0.1 * s, 0, -a, t * (k % 2 ? 1 : 0.8), col); }
  };

  // ---------- people and animals ----------
  // costume: 'cowboy', 'pirate', 'robot' or 'showgirl' (Hollywood Boulevard's characters); beach: dressed for the sand;
  // surf: a board under the arm; skate: riding a skateboard; skates: on roller skates; buff: Muscle Beach
  K.person = (b, x, z, { s = rand(0.92, 1.06), y = 0, top = null, legs = null, hat = null, ry = null, seated = false, bag = chance(0.16), phone = chance(0.14), kid = false, camera = false,
    shorts = chance(0.45), beach = false, surf = false, skate = false, skates = false, buff = false, shades = chance(0.45), costume = null } = {}) => {
    const a = ry ?? rand(-0.5, 0.5) + (chance(0.5) ? Math.PI : 0), ca = Math.cos(a), sa = Math.sin(a), skin = pick(SKIN);
    const P = (fx, fy, fz) => [x + fx * ca + fz * sa, y + fy, z - fx * sa + fz * ca];
    if (kid) s *= 0.62;
    if (skate || skates) { y += skate ? 0.13 : 0.09; if (skate) { b.add(G.box, VC.solid, x, y - 0.06, z, 0.24, 0.03, 0.82, 0, a + Math.PI / 2, 0, pick(['#c8302a', '#141414', '#ffd23d', '#39c8e8'])); for (const e of [-0.28, 0.28]) b.add(G.box, VC.solid, ...P(e, -0.1, 0), 0.24, 0.06, 0.06, 0, a, 0, '#f4f0e8'); } }
    const robot = costume === 'robot', c = top || (robot ? '#b8bcc4' : beach ? (chance(0.4) ? skin : pick(SWIM)) : costume === 'pirate' ? '#f4f0e8' : costume === 'showgirl' ? '#ff4a9a' : pick(TOPS));
    const bare = beach || shorts || costume === 'showgirl', lg = legs || (beach ? pick(SWIM) : costume === 'cowboy' ? '#3a4a6a' : costume === 'pirate' ? '#1a1a1e' : pick(LEGS));
    const W = buff ? 0.62 : 0.46, bodyMat = robot ? VC.metal : VC.solid;
    if (seated) {
      for (const e of [-1, 1]) { b.add(G.box, VC.solid, ...P(e * 0.09 * s, 0.5 * s, -0.18 * s), 0.15 * s, 0.14 * s, 0.42 * s, 0, a, 0, lg); b.add(G.box, VC.solid, ...P(e * 0.09 * s, 0.24 * s, -0.36 * s), 0.13 * s, 0.48 * s, 0.14 * s, 0, a, 0, bare ? skin : lg); }
      b.add(G.box, VC.solid, ...P(0, 0.9 * s, 0.02), 0.46 * s, 0.62 * s, 0.28 * s, 0, a, 0, c);
    } else {
      for (const e of [-1, 1]) {
        b.add(G.box, bodyMat, ...P(e * 0.085 * s, 0.6 * s, 0), 0.15 * s, 0.42 * s, 0.18 * s, 0, a, 0, robot ? c : lg);
        b.add(G.box, bodyMat, ...P(e * 0.085 * s, 0.2 * s, 0), 0.14 * s, 0.4 * s, 0.17 * s, 0, a, 0, robot ? c : bare ? skin : lg);
      }
      b.add(G.box, VC.solid, ...P(0, 0.04 * s, -0.04), 0.38 * s, 0.08 * s, 0.3 * s, 0, a, 0, skates ? '#f4f0e8' : costume === 'cowboy' ? '#5a3a1a' : beach ? skin : pick(['#1a1a1a', '#e8e8e8', '#5a3a2a', '#f4f0e8']));
      if (skates) for (const e of [-1, 1]) for (const f of [-0.1, 0.1]) b.add(G.box, VC.solid, ...P(e * 0.085 * s, -0.04, f), 0.08, 0.08, 0.08, 0, a, 0, pick(['#ff5aa0', '#39e8ff', '#ffd23d']));
      b.add(G.box, bodyMat, ...P(0, 1.1 * s, 0), W * s, (buff ? 0.66 : 0.62) * s, (buff ? 0.34 : 0.28) * s, 0, a, 0, c);
      if (buff) for (const e of [-1, 1]) {   // a bodybuilder's double biceps: the upper arms out level, the forearms up
        b.add(G.box, VC.solid, ...P(e * 0.46 * s, 1.32 * s, 0), 0.34 * s, 0.17 * s, 0.17 * s, 0, a, 0, skin);
        b.add(G.box, VC.solid, ...P(e * 0.6 * s, 1.55 * s, 0), 0.14 * s, 0.34 * s, 0.14 * s, 0, a, 0, skin);
      }
      if (costume === 'cowboy') b.add(G.box, VC.solid, ...P(0, 1.12 * s, 0.01), 0.48 * s, 0.5 * s, 0.3 * s, 0, a, 0, '#7a4a2a');   // his leather vest
      else if (costume === 'pirate') b.add(G.box, VC.solid, ...P(0, 0.86 * s, 0), 0.48 * s, 0.1 * s, 0.3 * s, 0, a, 0, '#c8202a');   // the red sash
      else if (!beach && chance(0.25)) b.add(G.box, VC.solid, ...P(0, 1.1 * s, 0), (W + 0.01) * s, 0.2 * s, 0.29 * s, 0, a, 0, shade(c, 0.7));
    }
    const hy = seated ? 1.36 : 1.62;
    if (robot) { b.add(G.box, VC.metal, ...P(0, (hy + 0.02) * s, 0), 0.3 * s, 0.32 * s, 0.3 * s, 0, a, 0, '#c8ccd4'); for (const e of [-1, 1]) b.box(VC.glow, hdr('#39e8ff', 2.4), ...P(e * 0.07 * s, (hy + 0.04) * s, -0.16 * s), 0.06 * s, 0.05 * s, 0.02); b.add(G.cyl6, VC.metal, ...P(0, (hy + 0.3) * s, 0), 0.03, 0.24 * s, 0.03, 0, 0, 0, '#c8ccd4'); return; }
    b.add(G.sphLow, VC.solid, ...P(0, hy * s, 0), 0.28 * s, 0.32 * s, 0.28 * s, 0, a, 0, skin);
    const hc = pick(HAIR), hk = hat || (costume === 'cowboy' ? 'cowboy' : costume === 'pirate' ? 'pirate' : costume === 'showgirl' ? 'plumes' : kid ? pick(['none', 'cap']) : pick(['none', 'none', 'none', 'cap', 'long', 'long', 'sunhat', 'bucket']));
    if (hk === 'cap') { b.add(G.box, VC.solid, ...P(0, (hy + 0.13) * s, 0), 0.3 * s, 0.1 * s, 0.3 * s, 0, a, 0, pick(['#c8302a', '#1a1a1e', '#2a4a8a', '#f2c230', '#f4f0e8'])); b.add(G.box, VC.solid, ...P(0, (hy + 0.1) * s, -0.2 * s), 0.24 * s, 0.03 * s, 0.16 * s, 0, a, 0, '#1a1a1e'); }
    else if (hk === 'sunhat' || hk === 'cowboy') { const col = hk === 'cowboy' ? '#7a4a24' : pick(['#e8d8a8', '#f4f0e0', '#d8c08a']); b.add(G.cyl8, VC.solid, ...P(0, (hy + 0.12) * s, 0), 0.62 * s, 0.03 * s, 0.62 * s, 0, 0, 0, col); b.add(G.cyl8, VC.solid, ...P(0, (hy + 0.2) * s, 0), 0.3 * s, 0.16 * s, 0.3 * s, 0, 0, 0, col); }
    else if (hk === 'bucket') b.add(G.cyl8, VC.solid, ...P(0, (hy + 0.15) * s, 0), 0.38 * s, 0.14 * s, 0.38 * s, 0, 0, 0, pick(['#f4f0e8', '#3a5a8a', '#c8a070']));
    else if (hk === 'pirate') { b.add(G.cone4, VC.solid, ...P(0, (hy + 0.2) * s, 0), 0.5 * s, 0.22 * s, 0.4 * s, 0, a, 0, '#141414'); b.add(G.box, VC.solid, ...P(0, (hy + 0.08) * s, 0), 0.3 * s, 0.06 * s, 0.3 * s, 0, a, 0, '#c8202a'); }
    else if (hk === 'plumes') { for (let k = 0; k < 5; k++) { const t = (k - 2) * 0.35; b.add(G.sphLow, VC.solid, ...P(Math.sin(t) * 0.22 * s, (hy + 0.4 + Math.cos(t) * 0.12) * s, 0.02), 0.12 * s, 0.6 * s, 0.06 * s, 0, a, t, pick(['#ff5aa0', '#ffd8f0', '#ffd23d'])); } }
    else if (hk === 'long') { b.add(G.box, VC.solid, ...P(0, (hy + 0.1) * s, 0.02), 0.31 * s, 0.14 * s, 0.31 * s, 0, a, 0, hc); b.add(G.box, VC.solid, ...P(0, (hy - 0.16) * s, 0.08 * s), 0.32 * s, 0.46 * s, 0.14 * s, 0, a, 0, hc); }
    else b.add(G.box, VC.solid, ...P(0, (hy + 0.12) * s, 0.025), 0.29 * s, 0.12 * s, 0.29 * s, 0, a, 0, hc);
    if (shades && !kid) b.add(G.box, VC.solid, ...P(0, (hy + 0.03) * s, -0.145 * s), 0.25 * s, 0.06 * s, 0.03 * s, 0, a, 0, '#101014');
    if (surf && !seated) b.add(G.sphLow, VC.solid, ...P(0.3 * s, 1.05 * s, 0.05 * s), 0.08 * s, 2.1 * s, 0.52 * s, 0, a, 0.08, pick(BOARDS));   // the board under the arm, nose up
    if (camera) b.add(G.box, VC.solid, ...P(0, (hy - 0.02) * s, -0.24 * s), 0.18 * s, 0.11 * s, 0.1 * s, 0, a, 0, '#141414');
    else if (phone && !seated && !beach) b.box(VC.glow, hdr('#cfe6ff', 1.4), ...P(0.06, 1.2 * s, -0.2 * s), 0.07, 0.12, 0.02);
    if (bag && !seated && !beach && !surf) b.add(G.box, VC.solid, ...P(0.28 * s, 0.88 * s, 0), 0.1, 0.32, 0.3, 0, a, 0, pick(['#141414', '#c8a070', '#8a2a1a', '#2a3a5a', '#f4f0e8']));
  };
  K.crowd = (b, x0, x1, z0, z1, n, opts = {}) => { for (let i = 0; i < n; i++) K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1), opts); };
  K.throng = (b, x0, x1, z0, z1, n, gaps = [], opts = {}) => {   // a crowd kept out of the given stretches
    for (let i = 0, t = 0; i < n && t < n * 4; t++) { const z = rand(z0, z1); if (gaps.some(([a, c]) => z > a && z < c)) continue; K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -z, opts); i++; }
  };
  K.tourist = (b, x, z, ry) => K.person(b, x, z, { camera: true, ry, shorts: chance(0.6), hat: pick(['cap', 'none', 'sunhat', 'bucket']) });
  K.dog = (b, x, z, ry = rand(0, Math.PI * 2)) => {   // a dog out on its walk
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fy, fz) => [x + fx * ca + fz * sa, fy, z - fx * sa + fz * ca], c = pick(['#c8a070', '#3a2a1a', '#e8e0d0', '#6a5a4a', '#1a1a1a', '#d8b888']);
    b.add(G.sphLow, VC.solid, ...P(0, 0.42, 0), 0.32, 0.3, 0.7, 0, ry, 0, c);
    b.add(G.sphLow, VC.solid, ...P(0, 0.62, -0.38), 0.24, 0.24, 0.3, 0, ry, 0, c);
    for (const [fx, fz] of [[-0.1, -0.22], [0.1, -0.22], [-0.1, 0.22], [0.1, 0.22]]) b.add(G.box, VC.solid, ...P(fx, 0.18, fz), 0.07, 0.36, 0.07, 0, ry, 0, c);
  };
  K.bike = (b, x, z, ry, { y = 0, col = pick(['#ff8aa8', '#39c8b0', '#f4e8c8', '#2a2a30', '#ffd23d', '#8ad8f0', '#c8302a']) } = {}) => {   // a beach cruiser standing (or ridden) along ry
    const ca = Math.cos(ry), sa = Math.sin(ry), P = (fz, fy) => [x + fz * sa, y + fy, z + fz * ca];
    for (const e of [-0.55, 0.55]) b.add(G.tor, VC.solid, ...P(e, 0.36), 0.7, 0.7, 1.4, 0, ry + Math.PI / 2, 0, '#1a1a1a');
    beam(b, VC.metal, ...P(-0.55, 0.36), ...P(0.05, 0.6), 0.045, col); beam(b, VC.metal, ...P(0.05, 0.6), ...P(0.5, 0.78), 0.045, col);
    beam(b, VC.metal, ...P(0.55, 0.36), ...P(0.42, 0.98), 0.04, col); beam(b, VC.metal, ...P(-0.55, 0.36), ...P(-0.08, 0.76), 0.04, col);
    b.add(G.box, VC.metal, ...P(0.36, 1.0), 0.6, 0.04, 0.05, 0, ry, 0, '#c8ccd2');   // the swept-back bars
    b.add(G.box, VC.solid, ...P(-0.12, 0.8), 0.12, 0.05, 0.24, 0, ry, 0, '#3a2a1a');
  };
  K.cyclist = (b, x, z, ry) => { K.bike(b, x, z, ry); K.person(b, x, z + 0.05 * Math.cos(ry), { y: 0.24, ry: ry + Math.PI, bag: false, phone: false, s: 0.95 }); };
  K.skater = (b, x, z, ry = chance(0.5) ? 0 : Math.PI) => K.person(b, x, z, { ry, skate: true, bag: false, phone: false, shades: chance(0.6), hat: pick(['cap', 'none', 'long']) });

  // ---------- cars ----------
  // kind: 'sedan', 'suv', 'convertible' (top down, someone in it), 'classic' (long and low, its fins and chrome); dir: which way it faces (-1: toward you)
  K.car = (b, x, z, dir = pick([-1, 1]), { kind = pick(['sedan', 'sedan', 'suv', 'suv', 'convertible', 'classic']), col = null, len = null, lit = chance(0.15), y = 0 } = {}) => {
    const w = kind === 'classic' ? 1.95 : kind === 'suv' ? 1.9 : 1.8;
    len = len || (kind === 'classic' ? rand(5.2, 5.6) : kind === 'suv' ? rand(4.6, 4.9) : rand(4.2, 4.7));
    col = col || (kind === 'classic' ? pick(CLASSIC) : pick(CARS));
    const lowH = kind === 'suv' ? 0.82 : kind === 'classic' ? 0.56 : 0.62, y0 = y + (kind === 'suv' ? 0.34 : 0.26);
    b.block(VC.solid, col, x, y0, z, w, lowH, len);
    if (kind === 'convertible') {   // the top down: the screen, the seats, a driver
      b.add(G.box, VC.glow, x, y0 + lowH + 0.2, z - dir * len * 0.12, w - 0.2, 0.42, 0.04, -dir * 0.5, 0, 0, hdr('#3a4a5e', 0.8));
      b.block(VC.solid, pick(['#e8dcc8', '#3a2a24', '#c8302a']), x, y0 + lowH - 0.05, z + dir * len * 0.08, w - 0.3, 0.42, len * 0.4);
      if (chance(0.6)) K.person(b, x - 0.38, z + dir * len * 0.02, { seated: true, y: y0 - 0.45, ry: dir > 0 ? Math.PI : 0, s: 0.92, shades: true });
    } else {
      const cabH = kind === 'suv' ? 0.62 : 0.5, cabL = kind === 'suv' ? len * 0.66 : kind === 'classic' ? len * 0.42 : len * 0.52;
      b.block(VC.solid, kind === 'classic' ? pick(['#f4f0e8', col]) : col, x, y0 + lowH, z + dir * 0.12, w - 0.14, cabH, cabL);
      b.box(VC.glow, hdr('#3a4a5e', 0.9), x, y0 + lowH + cabH * 0.55, z + dir * 0.12, w - 0.1, cabH * 0.55, cabL - 0.08);
    }
    if (kind === 'classic') {   // chrome bumpers, the tail fins
      for (const e of [-1, 1]) b.box(VC.metal, '#e8eaec', x, y0 + 0.12, z + e * (len / 2 + 0.04), w + 0.04, 0.14, 0.1);
      for (const e of [-1, 1]) b.add(G.box, VC.solid, x + e * (w / 2 - 0.12), y0 + lowH + 0.08, z + dir * (len / 2 - 0.5), 0.1, 0.3, 1.0, -dir * 0.3, 0, 0, col);
    }
    for (const dz of [-len * 0.33, len * 0.33]) for (const e of [-1, 1]) b.cyl(VC.solid, '#141414', x + e * (w / 2 - 0.08), y + (kind === 'suv' ? 0.36 : 0.3), z + dz, kind === 'suv' ? 0.36 : 0.3, 0.22, 'cyl8', 0, Math.PI / 2);
    for (const e of [-1, 1]) { b.box(VC.glow, hdr('#ff2a2a', lit ? 1.6 : 0.6), x + e * 0.62, y0 + lowH - 0.18, z + dir * (len / 2 + 0.01), 0.3, 0.14, 0.04); b.box(VC.glow, hdr('#fff4d0', lit ? 2.2 : 0.35), x + e * 0.6, y0 + lowH - 0.22, z - dir * (len / 2 + 0.01), 0.3, 0.14, 0.04); }
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
  K.carRow = (b, x, z0, z1, { gaps = [], dir = null, n = 99, p = 0.75, kinds = null, lit = null } = {}) => {   // cars parked nose to tail along the kerb lane
    let k = 0;
    for (let z = z0 + rand(0, 3); z < z1 - 2.5 && k < n; z += rand(5.6, 7.8)) {
      if (gaps.some(([a, c]) => z + 2.8 > a && z - 2.8 < c) || !chance(p)) continue;
      const f = kinds ? pick(kinds) : K.car;
      if (f === K.car) K.car(b, x, -z, dir ?? pick([-1, 1]), lit === null ? {} : { lit }); else f(b, x, -z, dir ?? pick([-1, 1]));
      k++;
    }
  };
  K.tacoTruck = (b, x, z, side, dir = pick([-1, 1])) => {   // a lonchera at the kerb, its window open to the pavement, the queue in front of it
    const w = 2.3, fx = x + side * (w / 2 + 0.01);
    b.block(VC.solid, '#f4f2ec', x, 0.45, z, w, 2.7, 6.2);
    b.block(VC.solid, '#f4f2ec', x, 0.45, z + dir * 3.8, w - 0.1, 1.6, 1.6);   // the cab
    b.box(VC.glow, hdr('#3a4a5e', 0.9), x, 1.75, z + dir * 4.61, w - 0.3, 0.6, 0.04);
    b.box(VC.solid, pick(['#e8302a', '#2a8a4a', '#ffd23d', '#2a6ad8']), x, 0.8, z, w + 0.02, 0.36, 6.22);   // the stripe
    b.box(VC.glow, hdr('#ffe0b0', 1.3), fx, 2.0, z - dir * 0.6, 0.04, 1.0, 2.8);   // the serving window, lit
    b.add(G.box, VC.solid, x + side * (w / 2 + 0.5), 2.72, z - dir * 0.6, 1.1, 0.05, 3.2, 0, 0, side * 0.35, '#e8e4dc');   // its flap, propped up
    K.board(b, K.kioskRects[KI.TACOS], fx + side * 0.02, 3.0, z + dir * 1.5, 1.8, 0.45, 1, 0, -face(side), 0);
    for (let k = 0; k < 7; k++) b.sph(VC.glow, hdr(pick(['#ffd23d', '#ff5a5a', '#5aff8a', '#5ac8ff']), 2.2), fx + side * 0.6, 3.1 - Math.sin((k / 6) * Math.PI) * 0.25, z - dir * (2 - k * 0.6), 0.06, true);   // string lights
    for (let k = 0; k < 6; k++) beam(b, VC.solid, fx + side * 0.6, 3.1 - Math.sin((k / 6) * Math.PI) * 0.25, z - dir * (2 - k * 0.6), fx + side * 0.6, 3.1 - Math.sin(((k + 1) / 6) * Math.PI) * 0.25, z - dir * (2 - (k + 1) * 0.6), 0.015, '#1a1a1a');
    for (const e of [0, 6]) beam(b, VC.solid, fx + side * 0.6, 3.1, z - dir * (2 - e * 0.6), fx, 2.9, z - dir * (2 - e * 0.6), 0.015, '#1a1a1a');
    for (const dz of [-2.2, 1.8, 3.8]) for (const e of [-1, 1]) b.cyl(VC.solid, '#141414', x + e * 1.0, 0.42, z + dz * dir, 0.42, 0.24, 'cyl8', 0, Math.PI / 2);
    for (let k = randi(2, 5); k > 0; k--) K.person(b, x + side * rand(1.9, 3.2), z - dir * rand(-1.8, 2.4), { ry: side < 0 ? Math.PI / 2 : -Math.PI / 2 });
    K.pool(b, fx + side * 1.6, z - dir * 0.6, 4, 5, hdr('#ffd9a0', 0.14));
  };
  K.tourVan = (b, x, z, dir = pick([-1, 1])) => {   // an open-top van taking tourists past the stars' houses, its canopy frame over the rows of seats
    b.block(VC.solid, pick(['#f4f2ec', '#39b8b0', '#2a2a30']), x, 0.4, z, 2.0, 1.3, 6.4);
    b.block(VC.solid, '#f4f2ec', x, 1.7, z + dir * 2.6, 1.95, 0.7, 1.2);
    b.box(VC.glow, hdr('#3a4a5e', 0.8), x, 2.0, z + dir * 3.2, 1.8, 0.5, 0.04);
    for (let r = 0; r < 4; r++) for (const e of [-0.45, 0.45]) if (chance(0.8)) K.person(b, x + e, z + dir * (1.4 - r * 1.15), { seated: true, y: 0.55, ry: dir > 0 ? Math.PI : 0, s: 0.92, camera: chance(0.3), shades: true });
    for (const e of [-1, 1]) for (const dz of [-3, 0, 2]) b.cyl(VC.metal, '#c8ccd2', x + e * 0.95, 2.4, z + dz * dir, 0.03, 1.4, 'cyl6');
    b.box(VC.solid, '#e8e4dc', x, 3.12, z - dir * 0.5, 2.0, 0.05, 5.4);
    K.sign(b, 'HOLLYWOOD TOURS', { w: 512, h: 96, color: '#ffd23d', bg: '#1a1a24', font: BLADE, size: 0.56, k: 1.2 }, x + 1.01, 1.1, z, 3.6, 0.68, 1, 0, Math.PI / 2, 0);
    for (const dz of [-2.4, 2.4]) for (const e of [-1, 1]) b.cyl(VC.solid, '#141414', x + e * 0.9, 0.4, z + dz, 0.4, 0.22, 'cyl8', 0, Math.PI / 2);
  };
  K.metroBus = (b, x, z, dir = 1) => {   // a Metro Local bus: orange below, silver above, its sign glowing amber
    b.block(VC.solid, '#d8dce0', x, 0.32, z, 2.55, 2.9, 12);
    b.box(VC.solid, '#e8652a', x, 0.95, z, 2.57, 1.1, 12);
    for (const e of [-1, 1]) { b.box(VC.glow, hdr('#2a3446', 1), x + e * 1.28, 2.15, z, 0.03, 1.0, 10.6); b.box(VC.glow, hdr('#fff0d0', 0.7), x + e * 1.285, 2.15, z + rand(-3, 3), 0.03, 0.9, 3.2); }
    b.box(VC.glow, hdr('#2a3446', 1), x, 2.0, z - dir * 6.01, 2.3, 1.4, 0.03);
    b.box(VC.glow, hdr('#ffb02a', 1.8), x, 2.95, z - dir * 6.02, 1.6, 0.26, 0.03);
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#fff4d0', 1.6), x + e * 0.9, 0.7, z - dir * 6.02, 0.3, 0.16, 0.03);
    for (const dz of [-4, 3.8]) for (const e of [-1, 1]) b.cyl(VC.solid, '#141414', x + e * 1.15, 0.5, z + dz, 0.5, 0.36, 'cyl8', 0, Math.PI / 2);
    b.box(VC.metal, '#8a9098', x, 3.32, z + dir * 1.5, 1.6, 0.25, 3);
  };

  // ---------- street furniture ----------
  // kind: 'cobra' (the city's steel pole, the cobra head out over the parking lane), 'twin' (downtown's old iron post
  // with its two acorn globes), 'deco' (Hollywood Boulevard's lantern with the star on top)
  K.lamp = (b, x, z, side, { kind = 'cobra', h = null, col = '#ffe2b0', k = 2.2, pool = 0.1 } = {}) => {
    if (kind === 'cobra') {
      const H = h || 9.0, reach = 2.6, ex = x - side * reach;
      b.cyl(VC.metal, '#8a8e94', x, H / 2, z, 0.1, H, 'cyl8');
      beam(b, VC.metal, x, H - 0.6, z, x - side * reach * 0.55, H + 0.2, z, 0.07, '#8a8e94');
      beam(b, VC.metal, x - side * reach * 0.55, H + 0.2, z, ex, H + 0.05, z, 0.07, '#8a8e94');
      b.add(G.box, VC.metal, ex, H - 0.02, z, 0.95, 0.2, 0.42, 0, 0, side * 0.05, '#9aa0a6');
      b.box(VC.glow, hdr(col, k), ex, H - 0.14, z, 0.8, 0.05, 0.32);
      if (pool) K.pool(b, ex, z, 7, 7, hdr(col, pool));
    } else if (kind === 'twin') {
      const H = h || 5.6;
      b.cyl(VC.metal, '#2a3a32', x, 0.6, z, 0.2, 1.2, 'cyl8'); b.cyl(VC.metal, '#2a3a32', x, H / 2 + 0.3, z, 0.09, H - 0.6, 'cyl8');
      b.box(VC.metal, '#2a3a32', x, H - 0.2, z, 0.08, 0.08, 1.3);
      for (const e of [-1, 1]) { b.sph(VC.glow, hdr(col, k * 0.9), x, H + 0.15, z + e * 0.62, 0.24); b.cyl(VC.metal, '#2a3a32', x, H + 0.45, z + e * 0.62, 0.08, 0.2, 'cyl8'); }
      b.sph(VC.glow, hdr(col, k), x, H + 0.28, z, 0.26);
      if (pool) K.pool(b, x, z, 6, 6, hdr(col, pool));
    } else {
      const H = h || 6.2;
      b.cyl(VC.metal, '#3a3a3e', x, 0.5, z, 0.22, 1.0, 'cyl8'); b.cyl(VC.metal, '#3a3a3e', x, H / 2, z, 0.1, H, 'cyl8');
      b.box(VC.glow, hdr(col, k), x, H + 0.5, z, 0.42, 0.9, 0.42);
      b.box(VC.metal, '#3a3a3e', x, H + 1.0, z, 0.56, 0.1, 0.56); b.box(VC.metal, '#3a3a3e', x, H, z, 0.5, 0.1, 0.5);
      b.add(G.cone4, VC.metal, x, H + 1.35, z, 0.3, 0.6, 0.3, 0, 0, 0, '#c8a050');
      if (pool) K.pool(b, x, z, 6, 6, hdr(col, pool));
    }
  };
  // the wooden poles at the back of the pavement: the crossarm and its three wires, the phone line under them, a
  // transformer can on some; poles: where they stand (the same on both sides, so a span can cross between a pair)
  K.powerLine = (b, x, z0, z1, poles, { h = 10.6 } = {}) => {
    for (const dx of [-0.7, 0, 0.7]) b.box(VC.metal, '#1a1a1e', x + dx, h + 0.12, -(z0 + z1) / 2, 0.03, 0.03, z1 - z0);
    b.box(VC.metal, '#1a1a1e', x, h - 1.6, -(z0 + z1) / 2, 0.04, 0.04, z1 - z0);
    for (const z of poles) {
      if (z < z0 || z > z1) continue;
      b.cyl(VC.solid, '#5a4632', x, (h + 0.8) / 2, -z, 0.15, h + 0.8, 'cyl6');
      b.box(VC.solid, '#5a4632', x, h, -z, 1.9, 0.14, 0.14);
      for (const dx of [-0.7, 0, 0.7]) b.cyl(VC.solid, '#c8d4c8', x + dx, h + 0.1, -z, 0.04, 0.14, 'cyl6');
      if (chance(0.45)) b.cyl(VC.metal, '#8a9096', x + Math.sign(x) * 0.32, h - 1.0, -z, 0.3, 1.0, 'cyl8');
    }
  };
  K.span = (b, z, x = 10.6, h = 10.6) => { for (const dy of [1.6, 2.1]) b.box(VC.metal, '#1a1a1e', 0, h + dy, -z, 2 * x, 0.03, 0.03); for (const e of [-1, 1]) b.cyl(VC.solid, '#5a4632', e * x, h + 1.4, -z, 0.15, 1.6, 'cyl6'); };   // wires over the street at 12 m
  K.parkingSigns = (b, x, z, { n = randi(2, 3) } = {}) => {   // the stack of rules on one pole, read from the top down
    b.cyl(VC.metal, '#8a8e94', x, 1.75, z, 0.04, 3.5, 'cyl6');
    [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, n).forEach((i, k) => K.board(b, K.plateRects[i], x, 3.15 - k * 0.66, z + 0.05, 0.6, 0.6, 1, 0, 0, 0));
  };
  K.streetSign = (b, x, z, side, i = randi(0, STREETS.length - 1), j = randi(0, STREETS.length - 1)) => {   // a corner pole: the cross street's plate across the view, the street's own along it
    b.cyl(VC.metal, '#5a6460', x, 1.8, z, 0.05, 3.6, 'cyl6');
    K.board(b, K.streetRects[i], x, 3.35, z, 1.5, 0.34, 1, 0, 0, 0);
    K.board(b, K.streetRects[j], x, 3.76, z, 1.5, 0.34, 1, 0, face(side), 0);
  };
  K.busStop = (b, x, z, side) => {   // the Metro sign on its post; a bench with an advert along its back, facing the street
    b.cyl(VC.metal, '#8a8e94', x, 1.6, z, 0.04, 3.2, 'cyl6');
    K.sign(b, 'M', { w: 128, h: 128, color: '#ffffff', bg: '#141414', font: SANS, weight: 700, size: 0.8, k: 1.1 }, x, 3.0, z + 0.03, 0.5, 0.5, 1, 0, 0, 0);
    K.sign(b, 'METRO 2 · 302', { w: 256, h: 64, color: '#141414', bg: '#e8e4dc', font: SANS, weight: 700, size: 0.6, k: 0.9 }, x, 2.6, z + 0.03, 0.8, 0.2, 1, 0, 0, 0);
    const bz = z - 2.6, bx = x + side * 0.9;
    b.box(VC.solid, '#7a7a7e', bx, 0.45, bz, 0.5, 0.08, 2.1); b.box(VC.solid, '#7a7a7e', bx + side * 0.26, 0.86, bz, 0.06, 0.72, 2.1);
    for (const e of [-1, 1]) b.box(VC.metal, '#3a3a3e', bx, 0.22, bz + e * 0.9, 0.5, 0.44, 0.06);
    K.board(b, pick(K.adRects), bx + side * 0.22, 0.86, bz, 2.05, 0.6, 1, 0, face(side), 0);
    if (chance(0.5)) K.person(b, bx, bz + rand(-0.5, 0.5), { seated: true, ry: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
  };
  K.hydrant = (b, x, z, col = pick(BONNET)) => {   // a wet-barrel hydrant: squat, yellow, its silver outlets
    b.cyl(VC.solid, col, x, 0.32, z, 0.2, 0.64, 'cyl8');
    b.cyl(VC.metal, '#c8ccd2', x, 0.7, z, 0.15, 0.14, 'cyl8');
    for (const e of [-1, 1]) b.cyl(VC.metal, '#c8ccd2', x + e * 0.24, 0.4, z, 0.08, 0.14, 'cyl8', 0, Math.PI / 2);
    b.cyl(VC.metal, '#c8ccd2', x, 0.4, z + 0.24, 0.1, 0.14, 'cyl8', Math.PI / 2);
  };
  K.mailbox = (b, x, z) => { b.block(VC.solid, '#2a4a9a', x, 0.35, z, 0.52, 0.8, 0.52); b.cyl(VC.solid, '#2a4a9a', x, 1.15, z, 0.26, 0.52, 'cyl8', Math.PI / 2); for (const e of [-1, 1]) b.box(VC.solid, '#1a2a5a', x + e * 0.2, 0.17, z, 0.06, 0.34, 0.46); };
  K.bench = (b, x, z, side, { people = chance(0.35) } = {}) => {
    b.box(VC.solid, '#6a5038', x, 0.45, z, 0.5, 0.08, 1.8); b.box(VC.solid, '#6a5038', x + side * 0.24, 0.75, z, 0.06, 0.45, 1.8);
    for (const e of [-1, 1]) b.box(VC.metal, '#2a2e2a', x, 0.22, z + e * 0.75, 0.5, 0.44, 0.06);
    if (people) K.person(b, x - side * 0.05, z + rand(-0.5, 0.5), { seated: true, ry: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
  };
  K.bin = (b, x, z) => { b.cyl(VC.solid, '#3a4a3e', x, 0.55, z, 0.32, 1.1, 'cyl8'); b.cyl(VC.solid, '#2a3a2e', x, 1.14, z, 0.34, 0.08, 'cyl8'); };
  // the parking lane (road over the track's side strip), the kerb (painted red here and there), the pavement out to x1
  K.kerbLane = (b, s, { z0 = 0, z1 = CHUNK_LEN, x1 = EDGE + 7, red = 0.5 } = {}) => {
    K.road(b, s * (EDGE + KERB) / 2, -(z0 + z1) / 2, KERB - EDGE, z1 - z0, 0.032);
    b.box(VC.solid, '#b8b0a4', s * (KERB + 0.06), 0.08, -(z0 + z1) / 2, 0.14, 0.16, z1 - z0);
    if (chance(red)) { const a = rand(z0, z1 - 12), L = rand(6, 12), c = pick(['#c8202a', '#c8202a', '#e8c030', '#2a8a4a', '#f4f4f0']); b.box(VC.solid, c, s * (KERB + 0.05), 0.09, -(a + L / 2), 0.16, 0.17, L); }
    if (x1 > EDGE + 7) K.pave(b, s * (EDGE + 7 + x1) / 2, -(z0 + z1) / 2, x1 - EDGE - 7, z1 - z0);
  };
  K.stars = (b, s, z0, z1, { x = 7.9 } = {}) => {   // the Walk of Fame: two rows of stars down the pavement
    for (const [dx, off] of [[0, 0], [1.75, 0.95]]) for (let z = z0 + 1 + off; z < z1 - 0.8; z += 1.9) b.add(G.plane, K.starMat, s * (x + dx), 0.036, -z, 1.5, 1.5, 1, -Math.PI / 2, 0, 0);
  };

  // ---------- houses ----------
  const glass = (lit, sunny) => (chance(lit) ? hdr(pick(WARM), rand(0.85, 1.25)) : sunny && chance(0.45) ? hdr(pick(['#ffb878', '#ffc890', '#ff9a78']), rand(0.7, 0.95)) : hdr(pick(['#2a3448', '#34405a', '#3a4a66', '#283040']), 1));
  K.glass = glass;
  const archWin = (F, x, y, z, w, h, g, fc) => {   // a window with a round head: its frame, the glass, the arch
    F.box(VC.solid, fc, x, y, z, w + 0.2, h + 0.1, 0.06);
    F.add(G.cyl, VC.solid, x, y + h / 2, z, w + 0.2, 0.06, w + 0.2, Math.PI / 2, 0, 0, fc);
    F.box(VC.glow, g, x, y, z + 0.035, w, h, 0.04);
    F.add(G.cyl, VC.glow, x, y + h / 2, z + 0.035, w, 0.04, w, Math.PI / 2, 0, 0, g);
  };
  K.archWin = archWin;
  const xz = (F, x, z) => { const p = F.at(x, 0, z); return [p.x, p.z]; };   // where a point of a frame's ground lies in the chunk
  K.xz = xz;
  // a Spanish Colonial Revival house, built in its own frame (local x along the street, z out of the front toward the
  // track, y up): white or cream stucco, red tile on a hip or a gable, round-headed windows below, iron balconettes
  // above, the arched door, sometimes a stair tower, bougainvillea spilling over a corner
  K.villa = (b, s, xf, zc, { w = rand(11, 15), d = rand(10, 13), floors = randi(1, 2), col = pick(STUCCO), lit = 0.5, tower = chance(0.3), hip = chance(0.5), bougain = chance(0.65), y = 0 } = {}) => {
    const F = frame(b, s * xf, y, zc, 1, face(s)), sunny = s > 0, FH = 3.3, top = floors * FH + 0.5, hw = w / 2, fc = shade(col, 0.86);
    const foot = 1 + y * 0.6;   // carried down into the ground (deeper on a slope)
    F.addM(K.tiledBox(w, top + foot, d, 2.5), K.stuccoMat, new THREE.Matrix4().makeTranslation(0, (top - foot) / 2, -d / 2), col);
    const rh = rand(1.8, 2.6);
    if (hip) F.addM(hipRoof(w + 0.9, d + 0.9, rh), K.tileMat, new THREE.Matrix4().makeTranslation(0, top, 0.45), '#ffffff');
    else { F.addM(gableRoof(w + 0.7, d + 0.7, rh), K.tileMat, new THREE.Matrix4().makeTranslation(0, top, 0.35), '#ffffff'); F.addM(gableFace(w - 0.1, rh - 0.1), K.stuccoMat, new THREE.Matrix4().makeTranslation(0, top, 0.02), col); }
    const nW = Math.max(2, Math.floor((w - 2.2) / 2.6)), door = randi(0, nW - 1);
    for (let f = 0; f < floors; f++) for (let k = 0; k < nW; k++) {
      const x = -hw + 1.6 + (k * (w - 3.2)) / Math.max(1, nW - 1), y = f * FH + 1.9;
      if (f === 0 && k === door) {   // the arched door under its lamp
        F.box(VC.solid, '#3a2418', x, 1.15, 0.04, 1.3, 2.3, 0.06); F.add(G.cyl, VC.solid, x, 2.3, 0.04, 1.3, 0.06, 1.3, Math.PI / 2, 0, 0, '#3a2418');
        F.box(VC.glow, hdr(pick(WARM), 1.6), x + 0.95, 2.2, 0.1, 0.16, 0.26, 0.12);
        F.box(VC.solid, '#b8a890', x, 0.08, 0.6, 1.8, 0.16, 1.2);
        continue;
      }
      if (f === 0) archWin(F, x, y - 0.1, 0.03, 1.1, 1.6, glass(lit, sunny), fc);
      else {
        F.box(VC.solid, fc, x, y, 0.03, 1.2, 1.5, 0.06); F.box(VC.glow, glass(lit, sunny), x, y, 0.065, 1.0, 1.3, 0.04);
        if (chance(0.5)) { F.box(VC.metal, '#1a1a1e', x, y - 0.75, 0.32, 1.5, 0.06, 0.6); F.box(VC.metal, '#1a1a1e', x, y - 0.12, 0.6, 1.5, 0.04, 0.04); for (let j = 0; j <= 5; j++) F.box(VC.metal, '#1a1a1e', x - 0.72 + j * 0.29, y - 0.44, 0.6, 0.03, 0.62, 0.03); }
      }
    }
    if (tower) {   // a square tower at one end, a floor higher, under its own pyramid of tile
      const tx = pick([-1, 1]) * (hw - 1.6), th = top + FH * 0.9;
      F.addM(K.tiledBox(3.2, th + 1, 3.2, 2.5), K.stuccoMat, new THREE.Matrix4().makeTranslation(tx, (th - 1) / 2, -1.7), col);
      F.addM(hipRoof(3.8, 3.8, 1.8), K.tileMat, new THREE.Matrix4().makeTranslation(tx, th, 0.2), '#ffffff');
      archWin(F, tx, th - 1.2, 0.03, 0.7, 0.9, glass(lit, sunny), fc);
    } else if (chance(0.6)) F.box(VC.solid, col, pick([-1, 1]) * (hw - 1.2), top + rh * 0.7, -d * 0.6, 0.9, 2.4, 0.9);   // the chimney
    if (bougain) { const p = F.at(pick([-1, 1]) * (hw - 1.3), top - 0.2, 0.12); K.bougain(b, p.x, p.y, p.z, 2.6, rand(2.4, 3.6), face(s)); }
    if (chance(0.6)) (chance(0.5) ? K.strelitzia : K.agave)(b, ...xz(F, rand(-hw + 1, hw - 1), 0.9), rand(0.9, 1.2), { y });
    return { top: top + rh };
  };
  // a Craftsman bungalow: clapboard, a low gable with wide eaves, the porch under its own gable on tapered posts
  K.bungalow = (b, s, xf, zc, { w = rand(9, 11), d = rand(10, 12), col = pick(CRAFT), trim = pick(['#f4f0e4', '#e8dcc0', '#3a2a20', '#f2ece0']), lit = 0.5 } = {}) => {
    const F = frame(b, s * xf, 0, zc, 1, face(s)), sunny = s > 0, H = 3.6, hw = w / 2, roof = pick(['#4a4440', '#5a4a3e', '#3a3a3c', '#6a5a4a']);
    F.addM(K.tiledBox(w, H + 0.6, d, 2), K.sidingMat, new THREE.Matrix4().makeTranslation(0, (H - 0.6) / 2, -d / 2), col);
    F.box(VC.solid, '#8a7a6a', 0, 0.3, -d / 2, w + 0.12, 0.62, d + 0.12);   // its plinth
    F.addM(prism(w + 1.6, 2.0, d + 1.2), VC.solid, new THREE.Matrix4().makeTranslation(0, H, 0.6), roof);
    F.addM(gableFace(w - 0.1, 1.9), K.sidingMat, new THREE.Matrix4().makeTranslation(0, H, 0.02), col);
    const px = pick([-1, 1]) * (hw / 2 - 0.2), pw = hw + 0.6;
    F.addM(prism(pw + 0.8, 1.3, 2.9), VC.solid, new THREE.Matrix4().makeTranslation(px, H - 0.3, 2.9), roof);
    F.box(VC.solid, trim, px, H - 0.45, 2.55, pw + 0.4, 0.3, 0.22);
    for (const e of [-1, 1]) { F.block(VC.solid, '#7a6a5a', px + (e * pw) / 2, 0, 2.4, 0.62, 1.1, 0.62); F.limb(VC.solid, trim, [px + (e * pw) / 2, 1.1, 2.4], [px + (e * pw) / 2, H - 0.6, 2.4], 0.24, 0.15, 6); }
    F.box(VC.solid, '#a89888', px, 0.55, 1.3, pw + 0.4, 0.1, 2.4);   // the porch floor
    F.box(VC.solid, '#3a2a20', px + 0.8, 1.15, 0.04, 1.0, 2.3, 0.06);
    F.box(VC.glow, hdr(pick(WARM), 1.5), px - 0.3, 2.5, 0.1, 0.18, 0.22, 0.1);
    const wx = -px * 0.95;
    for (let k = -1; k <= 1; k++) { F.box(VC.solid, trim, wx + k * 0.95, 1.85, 0.03, 0.95, 1.5, 0.06); F.box(VC.glow, glass(lit, sunny), wx + k * 0.95, 1.85, 0.065, 0.78, 1.3, 0.04); }
    F.box(VC.glow, glass(lit * 0.6, sunny), 0, H + 0.8, 0.06, 1.0, 0.5, 0.04);   // the attic vent's window
    return { top: H + 2 };
  };
  // a dingbat: a stucco box of flats standing over its open carport, the name in script across the front, a starburst or two
  const DINGBATS = ['The Capri', 'Sea Breeze', 'The Starlite', 'Palm Royale', 'The Tahitian', 'Lanai', 'Kona Gardens', 'The Biscayne', 'Sunset Arms', 'The Mariner'];
  K.dingbat = (b, s, xf, zc, { w = rand(13, 16), d = 13, col = pick(PASTEL), lit = 0.5, storeys = randi(1, 2) } = {}) => {
    const F = frame(b, s * xf, 0, zc, 1, face(s)), sunny = s > 0, G0 = 2.7, FH = 2.9, top = G0 + storeys * FH, hw = w / 2;
    F.addM(K.tiledBox(w, storeys * FH, d, 2.5), K.stuccoMat, new THREE.Matrix4().makeTranslation(0, G0 + (storeys * FH) / 2, -d / 2), col);
    F.box(VC.solid, '#2a2624', 0, G0 / 2, -d + 0.6, w - 0.2, G0, 1.0);   // the back of the carport
    F.box(VC.solid, shade(col, 0.8), 0, G0 + 0.12, -d / 2, w, 0.25, d);
    for (let x = -hw + 0.3; x <= hw - 0.2; x += (w - 0.6) / 4) F.cyl(VC.metal, '#3a3a3e', x, G0 / 2, -0.3, 0.07, G0, 'cyl6');
    for (let k = 0; k < 3; k++) if (chance(0.75)) K.place(b, (t) => K.car(t, 0, 0, 1, {}), new THREE.Matrix4().multiplyMatrices(F.M, new THREE.Matrix4().makeTranslation(-hw + 2.2 + k * ((w - 4.4) / 2), 0, -d / 2 + 1)));
    for (let f = 0; f < storeys; f++) for (let k = 0; k < 3; k++) { const x = -hw + 2 + k * ((w - 4) / 2), y = G0 + f * FH + 1.5; F.box(VC.solid, '#e8e8ea', x, y, 0.03, 2.2, 1.3, 0.05); F.box(VC.glow, glass(lit, sunny), x, y, 0.06, 2.0, 1.1, 0.04); F.box(VC.solid, '#e8e8ea', x, y, 0.07, 0.05, 1.1, 0.03); }
    const name = pick(DINGBATS);
    K.sign(F, name, { w: 512, h: 160, color: pick(['#ffffff', '#ffd23d', '#1a1a24', '#ff5aa0', '#2a6ad8']), font: SCRIPT, size: 0.62, k: 1.0 }, pick([-1, 1]) * hw * 0.35, top - 0.75, 0.08, 4.6, 1.4, 1, 0, 0, 0);
    for (let k = randi(1, 2); k > 0; k--) {   // the starbursts
      const sx = rand(-hw + 1, hw - 1), sy = rand(G0 + 0.9, top - 1.2);
      for (let j = 0; j < 8; j++) { const a = (j / 8) * Math.PI * 2; F.add(G.box, VC.metal, sx + Math.cos(a) * 0.3, sy + Math.sin(a) * 0.3, 0.1, 0.6, 0.04, 0.04, 0, 0, a, '#d8b048'); }
      F.ell(VC.metal, '#d8b048', sx, sy, 0.1, 0.09, 0.09, 0.05, true);
    }
    F.beam(VC.metal, '#3a3a3e', [hw + 0.6, 0.1, -2], [hw + 0.6, G0 + 0.2, -d + 3], 0.12, 1.0);   // the open stair up the side
    return { top };
  };

  // ---------- shops ----------
  // one shop, 1–4 floors: 'stucco' (a flat parapet), 'deco' (pilasters, a stepped top, zigzags, maybe a blade sign),
  // 'mission' (a scalloped parapet and a tile awning); the goods in its window, its board, an awning
  K.shop = (b, s, xf, zc, w, { style = 'stucco', floors = 1, col = pick(STUCCO), sign = pick(STRIP_SIGNS), lit = 0.5, blade = false, d = rand(12, 16) } = {}) => {
    const F = frame(b, s * xf, 0, zc, 1, face(s)), sunny = s > 0, G0 = 4.2, FH = 3.3, top = G0 + (floors - 1) * FH, hw = w / 2, L = w - 1.4, acc = shade(col, 0.62);
    F.addM(K.tiledBox(w, top + 1, d, 2.5), K.stuccoMat, new THREE.Matrix4().makeTranslation(0, (top - 1) / 2, -d / 2), col);
    K.board(F, K.goodsRects[GI[sign.goods]], -0.55, 1.6, 0.07, L - 1.3, 2.4, 1, 0, 0, 0);
    F.box(VC.solid, acc, -0.55, 1.6, 0.04, L - 1.1, 2.6, 0.06);
    F.box(VC.solid, '#2a2420', hw - 0.85, 1.25, 0.05, 0.95, 2.5, 0.06);
    F.box(VC.glow, hdr(pick(WARM), 0.8), hw - 0.85, 2.7, 0.07, 0.85, 0.35, 0.04);
    const sw = Math.min(w - 0.8, 5.4);
    K.board(F, K.signRects[sign.i], 0, 3.5, 0.08, sw, (sw * 104) / 512, 1, 0, 0, 0);
    if (style === 'mission') { F.add(G.box, K.tileMat, 0, 3.0, 0.75, w - 0.4, 0.08, 1.5, -0.35, 0, 0, '#ffffff'); for (const e of [-1, 1]) F.box(VC.solid, shade(col, 0.8), e * (hw - 0.3), 2.6, 1.3, 0.12, 0.8, 0.12); }
    else if (chance(0.55)) F.add(G.box, VC.solid, -0.55, 2.95, 0.65, L - 0.9, 0.05, 1.3, -0.28, 0, 0, pick(['#c8302a', '#2a6a4a', '#2a3a6a', '#e8c030', '#ff7a2a', '#39b8b0', '#1a1a1e']));
    for (let f = 1; f < floors; f++) for (let k = 0; k < Math.max(1, Math.floor(w / 2.4)); k++) {
      const n = Math.max(1, Math.floor(w / 2.4)), x = -hw + w / (2 * n) + (k * w) / n, y = G0 + (f - 1) * FH + 1.7;
      F.box(VC.solid, acc, x, y, 0.03, 1.2, 1.6, 0.05); F.box(VC.glow, glass(lit, sunny), x, y, 0.06, 1.0, 1.4, 0.04);
    }
    if (style === 'deco') {   // pilasters up the front, a zigzag band, the stepped top
      for (const x of [-hw + 0.25, hw - 0.25, ...(w > 9 ? [0] : [])]) F.box(VC.solid, shade(col, 1.06), x, (G0 + top + 1.6) / 2, 0.12, 0.5, top + 1.6 - G0, 0.24);
      for (let x = -hw + 0.5; x < hw - 0.4; x += 0.7) F.add(G.box, VC.solid, x + 0.17, top + 0.3, 0.1, 0.45, 0.06, 0.06, 0, 0, 0.8, acc), F.add(G.box, VC.solid, x + 0.52, top + 0.3, 0.1, 0.45, 0.06, 0.06, 0, 0, -0.8, acc);
      F.box(VC.solid, col, 0, top + 1.05, -0.5, w, 1.3, 1.0); F.box(VC.solid, col, 0, top + 2.0, -0.6, w * 0.45, 0.8, 0.9); F.box(VC.solid, shade(col, 1.06), 0, top + 2.55, -0.6, w * 0.22, 0.4, 0.8);
      if (blade) { const p = F.at(0, 0, 0); K.bladeSign(b, s * xf, G0 + 0.6, p.z, s, pick(BLADES)); }
    } else if (style === 'mission') {   // a scalloped parapet over the middle
      F.box(VC.solid, col, 0, top + 0.6, 0, w, 1.2, 0.3);
      F.add(G.cyl, K.stuccoMat, 0, top + 1.2, 0, w * 0.4, 0.3, w * 0.4, Math.PI / 2, 0, 0, col);
      F.box(VC.solid, acc, 0, top + 1.15 + w * 0.2, 0, 0.4, 0.4, 0.32);
    } else F.box(VC.solid, shade(col, 0.95), 0, top + 0.45, 0, w, 0.9, 0.3);
    K.pool(b, s * (xf - 1.6), zc, 3, w - 1, hdr('#ffd9a0', 0.09));
    return { top };
  };
  const BLADES = ['RIALTO', 'VISTA', 'STARLITE', 'PALACE', 'TOWER', 'CAPRI', 'ROXIE', 'DELUXE', 'ELITE', 'MONTE'];
  K.shopRow = (b, s, z0, z1, { x0 = X0, signs = STRIP_SIGNS, floors = [1, 2], styles = ['stucco', 'stucco', 'deco', 'mission'], colors = STUCCO, gaps = [], blade = 0.3, lit = 0.5 } = {}) => {
    const lots = [];
    for (let z = z0 + rand(0, 0.8); z < z1 - 4;) {
      const w = Math.min(rand(6.5, 12), z1 - z);
      if (gaps.some(([a, c]) => z + w > a && z < c)) { z += 1; continue; }
      const style = pick(styles), fl = randi(...floors) + (style === 'deco' ? randi(0, 2) : 0);
      const col = style === 'deco' ? pick(['#f2e6d0', '#e8d8b8', '#f4ecdc', '#d8e4e0', '#f0d8c8', '#e8e0f0']) : pick(colors);
      K.shop(b, s, x0, -(z + w / 2), w, { style, floors: fl, col, sign: pick(signs), lit, blade: style === 'deco' && chance(blade) });
      lots.push([z, z + w]);
      z += w + rand(0.02, 0.3);
    }
    return lots;
  };
  // a blade sign standing out from a front at x: tall, its letters stacked, outlined in neon, read from up the street
  K.bladeSign = (b, x, y0, z, side, text, { col = pick(['#ff3a5a', '#39e8ff', '#ffd23d', '#ff7ab8', '#7cff8a']), bg = '#1a1a24', W = 1.1 } = {}) => {
    const h = text.length * 0.92 + 0.5, cx = x - side * (W / 2 + 0.05), c = hdr(col, 2.2);
    b.box(VC.solid, bg, cx, y0 + h / 2, z, W, h, 0.28);
    K.vsign(b, text, { color: col, glow: col }, cx, y0 + h / 2, z + 0.15, W - 0.22, h - 0.35, 1, 0, 0, 0);
    for (const e of [-1, 1]) b.box(VC.glow, c, cx + e * (W / 2 - 0.04), y0 + h / 2, z + 0.15, 0.05, h - 0.1, 0.03);
    for (const y of [y0 + 0.05, y0 + h - 0.05]) b.box(VC.glow, c, cx, y, z + 0.15, W - 0.1, 0.05, 0.03);
    return h;
  };
  // a cinema: a deco front, the marquee out over the pavement with its running bulbs and the film in black letters,
  // the name up the blade sign over it, the posters by the doors, the box office
  K.theatre = (b, s, xf, zc, w, { name = pick(BLADES), film = pick(BILLBOARDS)[0], col = pick(['#f2e6d0', '#e8d8b8', '#f0d8c8', '#e8e4f0']), floors = 3 } = {}) => {
    K.shop(b, s, xf, zc, w, { style: 'deco', floors, col, sign: pick(HOLLY_SIGNS) });
    const F = frame(b, s * xf, 0, zc, 1, face(s)), mw = Math.min(w - 1, 9);
    F.box(VC.solid, '#2a2228', 0, 4.65, 1.6, mw, 1.3, 3.0);
    F.box(VC.glow, hdr('#fff0d0', 1.6), 0, 3.99, 1.6, mw - 0.3, 0.02, 2.7);   // its lit underside
    K.sign(F, `NOW SHOWING · ${film}`, { w: 1024, h: 128, color: '#141414', bg: '#fff4e0', font: SANS, weight: 700, size: 0.5, k: 1.3 }, 0, 4.65, 3.11, mw - 0.4, 0.8, 1, 0, 0, 0);
    for (const e of [-1, 1]) K.sign(F, name, { w: 512, h: 128, color: '#ffd23d', bg: '#2a2228', font: DECO, size: 0.6, k: 1.4 }, e * (mw / 2 + 0.01), 4.65, 1.6, 2.6, 0.8, 1, 0, e * Math.PI / 2, 0);
    for (let k = 0; k < Math.round(mw / 0.4); k++) for (const zz of [0.2, 3.1]) F.box(k % 2 ? K.chaseA : K.chaseB, 0xffffff, -mw / 2 + 0.2 + k * 0.4, 4.0, zz, 0.12, 0.12, 0.12);
    const bp = F.at(0, 0, 0);
    K.bladeSign(b, s * xf, 5.4, bp.z, s, name, { col: pick(['#ff3a5a', '#ffd23d', '#39e8ff']), W: 1.4 });
    for (const e of [-1, 1]) { F.box(VC.solid, '#c8a050', e * (mw / 2 - 0.7), 1.7, 0.08, 1.2, 1.8, 0.06); K.board(F, pick(K.billRects), e * (mw / 2 - 0.7), 1.7, 0.12, 1.0, 1.6, 1, 0, 0, 0); }   // the posters, cut from the billboards
    F.box(VC.glow, hdr('#ffe0b0', 1.2), 0, 1.3, 0.5, 1.4, 1.6, 1.0);   // the box office
    K.person(b, ...xz(F, 0, 0.5), { seated: true, y: 0.3, ry: s < 0 ? Math.PI / 2 : -Math.PI / 2, shades: false });
    K.pool(b, s * (xf - 2.2), zc, 5, mw, hdr('#fff0d0', 0.2));
  };
  // a billboard on its steel legs over the roofs, lit from below by its lamps
  K.billboard = (b, x, z, side, { y = 9, w = 12, h = 5.2, ry = 0 } = {}) => {
    const F = frame(b, x, 0, z, 1, ry);
    for (const e of [-1, 1]) F.box(VC.metal, '#3a3a40', e * w * 0.3, y / 2, -0.3, 0.3, y, 0.3);
    F.box(VC.metal, '#2a2a30', 0, y, -0.25, w + 0.3, 0.2, 0.6);
    K.board(F, pick(K.billRects), 0, y + h / 2 + 0.1, 0, w, h, 1, 0, 0, 0);
    F.box(VC.solid, '#2a2a30', 0, y + h / 2 + 0.1, -0.08, w + 0.2, h + 0.2, 0.12);
    for (let k = -1; k <= 1; k++) { F.box(VC.metal, '#3a3a40', k * w * 0.33, y + 0.2, 0.7, 0.08, 0.08, 1.2); F.box(VC.glow, hdr('#fff4dc', 2.0), k * w * 0.33, y + 0.25, 1.3, 0.5, 0.12, 0.25); }
  };

  // ---------- downtown ----------
  const stoneT = windowTex({ cols: 6, rows: 14, cw: 34, ch: 46, wall: '#f2ece2', glass: '#141a24', lit: ['#ffd9a0', '#ffe6bc', '#ffc27a', '#fff2dc', '#e8f0ff'], litChance: 0.45, frame: '#fbf6ec', ledge: '#ddd2c0' });
  const glassT = windowTex({ cols: 8, rows: 16, cw: 32, ch: 40, wall: '#2e3a4e', glass: '#46587a', lit: ['#cfe6ff', '#ffffff', '#ffe8c0'], litChance: 0.3, band: true });
  K.stoneMat = facadeMat(stoneT, { k: 0.8 }); K.glassMat = facadeMat(glassT, { k: 0.7, rough: 0.3, metal: 0.5 });
  K.stoneT = stoneT; K.glassT = glassT;
  const towerFront = (b, i, signs) => {   // the ground floor of an office building: granite, the shops' windows and boards, a canopy at the door
    const s = i.side, L = Math.min(i.len - 2, 9), sign = pick(signs);
    b.box(VC.solid, '#5a5048', i.face - s * 0.2, 2.6, i.z, 0.4, 5.2, i.len);
    K.board(b, K.goodsRects[GI[sign.goods]], i.face - s * 0.43, 2.0, i.z + i.len / 4, L / 2, 2.6, 1, 0, face(s), 0);
    K.board(b, K.signRects[sign.i], i.face - s * 0.44, 3.75, i.z + i.len / 4, Math.min(L / 2, 4.5), (Math.min(L / 2, 4.5) * 104) / 512, 1, 0, face(s), 0);
    b.box(VC.glow, hdr('#ffe8c8', 0.42), i.face - s * 0.43, 2.2, i.z - i.len / 4, 0.04, 3.4, L / 2);
    for (let k = 0; k <= 4; k++) b.box(VC.solid, '#2a2a30', i.face - s * 0.46, 2.2, i.z - i.len / 4 - L / 4 + (k * L) / 8, 0.05, 3.4, 0.12);
    b.box(VC.metal, '#3a3a40', i.face - s * 1.4, 4.6, i.z - i.len / 4, 2.4, 0.18, Math.min(5, L / 2));
    K.pool(b, i.face - s * 1.5, i.z, 3, L, hdr('#ffe6c0', 0.1));
  };
  const towerTop = (b, i) => {   // a cornice; a crown lit from below on some, or the old rooftop sign
    b.box(VC.solid, shade(i.col, 0.96), i.x, i.h + 0.4, i.z, i.d + 0.6, 0.8, i.len + 0.6);
    if (i.crown && chance(0.45)) {
      const cw = i.len * 0.5, cd = i.d * 0.5, ch = rand(6, 11), tq = chance(0.4);   // some in turquoise terracotta and gold, a clock on the tower
      b.block(VC.solid, tq ? '#3ab4a8' : i.col, i.x, i.h + 0.8, i.z, cd, ch, cw);
      b.box(VC.glow, hdr(tq ? '#9af0e0' : pick(['#ffe8c0', '#ffd890']), 1.2), i.x, i.h + 0.9 + ch * 0.55, i.z, cd + 0.1, ch * 0.6, cw + 0.1);
      if (tq) b.cyl(VC.glow, hdr('#fff4dc', 1.6), i.x - i.side * (cd / 2 + 0.06), i.h + 0.8 + ch - 2, i.z, 1.4, 0.1, 'cyl', 0, Math.PI / 2);
      b.add(G.cone4, VC.metal, i.x, i.h + 0.8 + ch + 1.2, i.z, cd * 1.1, 2.4, cw * 1.1, 0, 0, 0, '#c8a050');
    } else if (i.crown && chance(0.5)) {   // the old rooftop sign, its letters on a steel frame
      const t = pick(['HOTEL', 'BANK', 'JEWELRY', 'FURNITURE', 'BROADWAY']);
      K.sign(b, t, { w: 512, h: 128, color: '#ff3a3a', font: BLADE, size: 0.7, glow: '#ff3a3a', k: 2.0 }, i.x - i.side * (i.d / 2 - 1), i.h + 2.6, i.z, Math.min(i.len - 2, 10), 2.5, 1, 0, face(i.side), 0);
      for (const e of [-1, 1]) b.box(VC.metal, '#2a2a30', i.x - i.side * (i.d / 2 - 1.08), i.h + 1.6, i.z + e * 3, 0.1, 3, 0.1);
    }
  };
  K.towerRow = (b, s, z0, z1, { x0 = 12.4, signs = DOWNTOWN_SIGNS, gaps = [] } = {}) => {
    for (let z = z0 + rand(0, 2); z < z1 - 8;) {
      const r = Math.random(), len = Math.min(rand(14, 26), z1 - z);
      if (gaps.some(([a, c]) => z + len > a && z < c)) { z += 2; continue; }
      if (r < 0.2 && len > 11) { K.theatre(b, s, x0, -(z + len / 2), len); z += len + rand(0, 0.6); continue; }   // one of Broadway's old picture palaces
      const d = rand(16, 22), cx = s * (x0 + d / 2), cz = -(z + len / 2);
      const glassy = r > 0.7, h = glassy ? rand(55, 110) : rand(30, 46), col = glassy ? pick(['#ffffff', '#e8f0ff', '#dce8f4']) : pick(['#f2e8d8', '#e8dcc8', '#f4ecdc', '#e0d4c0', '#f0d8c0', '#e8d0b8']);
      b.addM(buildingGeo(d, h, len, glassy ? glassT : stoneT, glassy ? 1.6 : 1.9, glassy ? 3.6 : 3.3), glassy ? K.glassMat : K.stoneMat, at(cx, 0, cz), col);
      const info = { x: cx, z: cz, d, len, h, side: s, face: s * x0, col, crown: !glassy };
      towerFront(b, info, signs); towerTop(b, info);
      z += len + rand(0, 0.6);
    }
  };
  K.metroEntrance = (b, x, z, side) => {   // the stairs down to the Metro: the opening, its railings, the M on its post
    b.box(VC.solid, '#14161a', x, 0.05, z, 2.0, 0.02, 5.0);
    for (const e of [-1, 1]) { b.box(VC.metal, '#3a3e44', x + e * 1.05, 0.55, z, 0.06, 1.1, 5.0); b.box(VC.metal, '#3a3e44', x + e * 1.05, 1.1, z, 0.08, 0.06, 5.0); }
    b.box(VC.metal, '#3a3e44', x, 0.55, z + 2.5, 2.1, 1.1, 0.06);
    b.cyl(VC.metal, '#3a3e44', x - side * 1.3, 1.8, z - 2.2, 0.08, 3.6, 'cyl6');
    K.sign(b, 'M', { w: 128, h: 128, color: '#ffffff', bg: '#141414', font: SANS, weight: 700, size: 0.8, k: 1.4 }, x - side * 1.3, 3.9, z - 2.2, 0.9, 0.9, 1, 0, 0, 0);
    for (let k = 0; k < 6; k++) b.box(VC.glow, hdr('#e8f0ff', 0.5), x, 0.06, z - 2.2 + k * 0.85, 1.6, 0.01, 0.3);
  };

  // ---------- the roadside ----------
  // set back behind their car parks: the coffee shop under its upswept roof, the drive-in with the doughnut on top, the
  // car wash, the motel, the gas station's canopy, the stand shaped like a hot dog; each with its sign out by the kerb
  K.carPark = (b, s, x0, x1, z0, z1, { cars = 0.55 } = {}) => {   // asphalt from x0 out to x1, the stalls along its far side (and its near side, if it is deep)
    K.road(b, s * (x0 + x1) / 2, -(z0 + z1) / 2, x1 - x0, z1 - z0, 0.034);
    for (const xs of x1 - x0 > 14 ? [x1 - 2.8, x0 + 2.8] : [x1 - 2.8]) for (let z = z0 + 1.5; z < z1 - 1.5; z += 2.8) {
      b.box(VC.solid, '#e8e4dc', s * xs, 0.04, -z, 5.2, 0.01, 0.1);
      if (chance(cars)) K.place(b, (t) => K.car(t, 0, 0, 1), new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(s * xs, 0, -z - 1.4));
    }
  };
  K.poleSign = (b, x, z, signs, { name = pick(['PALM PLAZA', 'SUNSET PLAZA', 'VISTA CENTER', 'STAR PLAZA', 'MIRACLE CENTER']), h = 10 } = {}) => {   // the strip mall's pylon: its name on top, the tenants stacked under it
    for (const e of [-1, 1]) b.box(VC.metal, '#4a4a50', x, h / 2, z + e * 1.3, 0.3, h, 0.3);
    const n = Math.min(4, signs.length);
    for (let k = 0; k < n; k++) { const sg = signs[k]; b.box(VC.solid, '#2a2a30', x, h - 2.4 - k * 1.05, z, 0.4, 0.95, 3.2); K.board(b, K.signRects[sg.i], x, h - 2.4 - k * 1.05, z + 1.62, 3.0, 0.62, 1, 0, 0, 0); }
    b.box(VC.solid, '#f4f0e8', x, h - 0.9, z, 0.5, 1.6, 3.6);
    K.sign(b, name, { w: 512, h: 160, color: '#e8302a', bg: '#f4f0e8', font: SCRIPT, size: 0.6, k: 1.3 }, x, h - 0.9, z + 1.82, 3.4, 1.4, 1, 0, 0, 0);
  };
  K.stripMall = (b, s, z0, z1, { x0 = 26 } = {}) => {   // one storey of little units behind the car park, every one lit
    const signs = [...STRIP_SIGNS].sort(() => Math.random() - 0.5);
    K.carPark(b, s, 10.8, x0, z0, z1);
    let k = 0;
    for (let z = z0 + 0.5; z < z1 - 4; z += 6.4) {
      const sg = signs[k++ % signs.length], F = frame(b, s * x0, 0, -(z + 3.1), 1, face(s));
      F.addM(K.tiledBox(6.3, 5.0, 12, 2.5), K.stuccoMat, new THREE.Matrix4().makeTranslation(0, 2.5, -6), pick(STUCCO));
      K.board(F, K.goodsRects[GI[sg.goods]], -0.5, 1.5, 0.07, 4.2, 2.4, 1, 0, 0, 0);
      K.board(F, K.signRects[sg.i], 0, 3.9, 0.1, 5.2, 1.06, 1, 0, 0, 0);
      F.box(VC.solid, '#d8d0c4', 0, 4.9, 1.2, 6.4, 0.25, 2.5); for (const e of [-1, 1]) F.box(VC.metal, '#5a5a60', e * 3.0, 2.4, 2.3, 0.12, 4.8, 0.12);
    }
    K.pool(b, s * (x0 - 2), -(z0 + z1) / 2, 4, z1 - z0, hdr('#ffd9a0', 0.12));
    K.poleSign(b, s * 10.6, -rand(z0 + 6, z1 - 6), signs);
  };
  K.coffeeShop = (b, s, xc, zc) => {   // glass all round under the roof that flies up toward the street, the booths inside, the sign on its tower
    const F = frame(b, s * xc, 0, zc, 1, face(s));
    F.box(VC.solid, '#c8b8a0', 0, 0.3, -5, 16, 0.6, 11);
    F.box(VC.glow, hdr('#ffe6c0', 1.0), 0, 2.2, 0.4, 15.4, 3.2, 0.05); F.box(VC.glow, hdr('#ffe6c0', 0.9), 7.7, 2.2, -5, 0.05, 3.2, 10.6);
    for (let x = -7.5; x <= 7.5; x += 1.5) F.box(VC.metal, '#3a3a3e', x, 2.2, 0.45, 0.08, 3.2, 0.08);
    for (let k = 0; k < 5; k++) { F.box(VC.solid, '#c8202a', -6 + k * 3, 0.9, -1.2, 1.6, 0.8, 0.5); if (chance(0.7)) K.person(b, ...xz(F, -6 + k * 3, -1.6), { seated: true, y: 0.15, ry: s < 0 ? Math.PI / 2 : -Math.PI / 2 }); }
    F.add(G.box, VC.solid, 0, 4.6, -4.6, 18, 0.35, 13, 0.22, 0, 0, '#f4f0e8');   // the roof, sweeping up over the front
    F.add(G.box, VC.solid, 0, 4.62, -4.6, 18.1, 0.12, 13.1, 0.22, 0, 0, '#ff7a2a');
    F.box(VC.solid, '#5a4a40', -6, 2.5, -8, 2.2, 5, 2.2);   // the stone chimney through the roof
    const px = 6.5; F.box(VC.metal, '#d8dce0', px, 6, 3.5, 0.5, 12, 0.5);   // the sign tower and its starburst
    K.sign(F, pick(['COFFEE SHOP', 'DINER']), { w: 512, h: 160, color: '#ff3a5a', bg: '#f4f2ea', font: SCRIPT, size: 0.6, k: 1.4 }, px, 9, 3.8, 4.6, 1.5, 1, 0, 0, 0);
    K.sign(F, 'OPEN 24 HRS', { w: 512, h: 96, color: '#39e8ff', font: SANS, weight: 700, size: 0.6, glow: '#39e8ff', k: 2.0 }, px, 7.6, 3.8, 3.4, 0.6, 1, 0, 0, 0);
    for (let j = 0; j < 12; j++) { const a = (j / 12) * Math.PI * 2; F.add(G.box, VC.glow, px + Math.cos(a) * 0.9, 12.4 + Math.sin(a) * 0.9, 3.8, 1.6, 0.08, 0.08, 0, 0, a, hdr('#ffd23d', 2.4)); }
    K.pool(b, ...xz(F, 0, 2.5), 16, 6, hdr('#ffd9a0', 0.14));
  };
  const DONUT = new THREE.TorusGeometry(1, 0.42, 10, 22);
  K.donutShop = (b, s, xc, zc) => {   // a drive-in stand with a doughnut nine metres across standing on its roof
    const F = frame(b, s * xc, 0, zc, 1, face(s));
    F.addM(K.tiledBox(7, 4.2, 7, 2.5), K.stuccoMat, new THREE.Matrix4().makeTranslation(0, 2.1, -3.5), '#f4f0e8');
    F.box(VC.glow, hdr('#ffe6c0', 1.2), 0, 1.6, 0.06, 5.6, 1.8, 0.04);
    K.board(F, K.signRects[SIGNS.find((x) => x.t === 'DONUTS').i], 0, 3.4, 0.1, 5.6, 1.14, 1, 0, 0, 0);
    F.addM(DONUT, VC.solid, new THREE.Matrix4().compose(new THREE.Vector3(0, 9.2, -3.5), new THREE.Quaternion(), new THREE.Vector3(3.2, 3.2, 3.2)), '#b8763a');
    for (const e of [-1, 1]) F.box(VC.metal, '#5a5a60', e * 1.6, 5.2, -3.5, 0.2, 2.4, 0.2);
    K.person(b, ...xz(F, 1.5, 1.4), { ry: s < 0 ? -Math.PI / 2 : Math.PI / 2 });
  };
  K.carWash = (b, s, xc, zc) => {   // the long low tunnel, its brushes, the cars waiting; the giant sign with its rocket
    const F = frame(b, s * xc, 0, zc, 1, face(s));
    F.addM(K.tiledBox(18, 4.6, 6, 2.5), K.stuccoMat, new THREE.Matrix4().makeTranslation(0, 2.3, -3), '#f4f0e8');
    F.box(VC.solid, '#2a8ad8', 0, 4.8, -3, 18.4, 0.5, 6.4);
    F.box(VC.solid, '#1a1a20', 8.2, 1.8, 0.02, 3.2, 3.6, 0.06);
    for (const e of [-1, 1]) F.cyl(VC.solid, pick(['#ff5aa0', '#39c8e8', '#ffd23d']), 8.2 + e * 1.1, 1.8, -0.6, 0.5, 3.2, 'cyl8');
    K.place(b, (t) => K.car(t, 0, 0, 1, { lit: true }), new THREE.Matrix4().multiplyMatrices(F.M, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(12.5, 0, 0.8)));
    F.box(VC.metal, '#d8dce0', -6, 6.5, 2.5, 0.6, 13, 0.6);
    K.sign(F, 'CAR WASH', { w: 512, h: 128, color: '#ffffff', bg: '#e8302a', font: BLADE, size: 0.66, k: 1.5 }, -6, 10.5, 2.85, 6, 1.5, 1, 0, 0, 0);
    F.add(G.cone, VC.solid, -6, 13.8, 2.6, 0.9, 2.2, 0.9, 0, 0, 0, '#f4f0e8');   // its rocket
    F.add(G.cyl8, VC.glow, -6, 12.5, 2.6, 0.7, 0.6, 0.7, 0, 0, 0, hdr('#ff8a2a', 2.6));
  };
  K.motel = (b, s, xc, zc, { L = 26 } = {}) => {   // two storeys round the car park, the open walkway and its rail, the numbered doors; the neon arrow out front
    const F = frame(b, s * xc, 0, zc, 1, face(s)), col = pick(PASTEL);
    F.addM(K.tiledBox(L, 6.2, 9, 2.5), K.stuccoMat, new THREE.Matrix4().makeTranslation(0, 3.1, -4.5), col);
    F.box(VC.solid, '#e8e4dc', 0, 3.1, 0.7, L + 0.4, 0.2, 1.6); F.box(VC.metal, '#3a3a3e', 0, 4.1, 1.45, L + 0.4, 0.05, 0.05);
    for (let x = -L / 2 + 0.6; x < L / 2; x += 1.2) F.box(VC.metal, '#3a3a3e', x, 3.6, 1.45, 0.03, 1.0, 0.03);
    for (let k = 0; k < Math.floor(L / 3.2); k++) for (const y of [0, 3.2]) { const x = -L / 2 + 1.6 + k * 3.2; F.box(VC.solid, pick(['#e8302a', '#2a6ad8', '#f4f0e8', '#39b8b0']), x - 0.6, y + 1.1, 0.04, 0.9, 2.1, 0.05); F.box(VC.glow, glass(0.6, s > 0), x + 0.6, y + 1.6, 0.05, 1.0, 0.9, 0.04); F.box(VC.glow, hdr('#ffe6b0', 1.4), x - 0.1, y + 2.4, 0.08, 0.12, 0.16, 0.06); }
    const px = L / 2 - 2; F.box(VC.metal, '#3a3a3e', px, 5, 6, 0.4, 10, 0.4);
    K.sign(F, 'MOTEL', { w: 512, h: 128, color: '#ff3a5a', font: NEON, size: 0.66, glow: '#ff3a5a', k: 2.2 }, px, 9, 6.25, 4.4, 1.2, 1, 0, 0, 0);
    K.sign(F, 'VACANCY', { w: 512, h: 96, color: '#39ff8a', font: SANS, weight: 700, size: 0.6, glow: '#39ff8a', k: 2.0 }, px, 7.7, 6.25, 3, 0.56, 1, 0, 0, 0);
    F.box(VC.glow, hdr('#ffd23d', 2.4), px - 1.1, 6.5, 6.25, 2.6, 0.12, 0.04);   // the arrow, pointing the way in
    F.add(G.cone4, VC.glow, px - 2.6, 6.5, 6.25, 0.6, 0.7, 0.05, 0, 0, Math.PI / 2, hdr('#ffd23d', 2.4));
    F.box(VC.glow, hdr('#39c8e8', 1.1), -L / 2 + 5, 0.1, 4.5, 6, 0.1, 4);   // the pool
  };
  K.gasStation = (b, s, xc, zc) => {   // the canopy folded up into a wing over the pumps, the kiosk of glass, the price on its post
    const F = frame(b, s * xc, 0, zc, 1, face(s));
    for (const e of [-1, 1]) F.add(G.box, VC.solid, e * 5.2, 5.6, 0, 10.6, 0.3, 8, 0, 0, -e * 0.22, '#f4f0e8');
    for (const e of [-1, 1]) F.add(G.box, VC.glow, e * 5.2, 5.43, 0, 10.2, 0.04, 7.6, 0, 0, -e * 0.22, hdr('#f4f8ff', 0.85));
    F.box(VC.metal, '#d8dce0', 0, 2.8, 0, 0.8, 5.6, 0.8);
    for (const x of [-4, 4]) { F.block(VC.solid, '#e8302a', x, 0, 0, 0.8, 1.7, 1.3); F.box(VC.glow, hdr('#e8f0ff', 1.2), x, 1.3, 0.66, 0.5, 0.3, 0.02); }
    F.box(VC.glow, hdr('#ffe6c0', 1.0), 0, 1.6, -7, 7, 3.2, 4);
    F.box(VC.metal, '#3a3a3e', 9, 3, 4, 0.3, 6, 0.3);
    K.sign(F, 'GAS  5.89', { w: 512, h: 128, color: '#ffffff', bg: '#141418', font: SANS, weight: 700, size: 0.6, k: 1.6 }, 9, 6.4, 4.2, 3.2, 0.8, 1, 0, 0, 0);
    K.pool(b, ...xz(F, 0, 0), 14, 10, hdr('#e8f0ff', 0.18));
  };
  K.hotDogStand = (b, s, xc, zc) => {   // the stand itself shaped like a hot dog in its bun
    const F = frame(b, s * xc, 0, zc, 1, face(s));
    F.block(VC.solid, '#f4f0e8', 0, 0, -1, 7, 1.4, 2.6);
    F.ell(VC.solid, '#d89a5a', 0, 2.3, -1, 4.2, 1.0, 1.5);
    F.add(G.cyl, VC.solid, 0, 2.9, -0.9, 0.9, 9, 0.9, 0, 0, Math.PI / 2, '#a8402a');
    for (const e of [-1, 1]) F.ell(VC.solid, '#a8402a', e * 4.5, 2.9, -0.9, 0.45, 0.45, 0.45);
    F.box(VC.glow, hdr('#ffe6c0', 1.3), 0, 1.0, 0.32, 5, 0.9, 0.04);
    K.board(F, K.kioskRects[KI['HOT DOGS']], 0, 4.2, -0.6, 3.2, 0.8, 1, 0, 0, 0);
    K.person(b, ...xz(F, -1.4, 1.2), { ry: s < 0 ? -Math.PI / 2 : Math.PI / 2 });
  };

  // ---------- the Eastside ----------
  K.mural = (b, x, y, z, side, w, h, i = randi(0, 5)) => b.add(planeUV(K.muralRects[i]), K.muralMat, x - side * 0.03, y, z, w, h, 1, 0, face(side), 0);
  K.muralWall = (b, s, xf, zc, w, { h = rand(5.5, 7.5), col = pick(STUCCO), i = randi(0, 5), shop = null } = {}) => {   // a low stucco building, its whole front painted
    b.block(VC.solid, col, s * (xf + 6), 0, zc, 12, h, w);
    b.box(VC.solid, shade(col, 0.9), s * (xf - 0.1), h + 0.25, zc, 0.5, 0.5, w + 0.1);
    const y0 = shop ? 3.4 : 0.4;
    K.mural(b, s * xf, (y0 + h - 0.2) / 2, zc, s, w - 0.3, h - 0.2 - y0, i);
    if (shop) {
      const sign = pick(shop), L = w - 1.2;
      K.board(b, K.goodsRects[GI[sign.goods]], s * (xf - 0.04), 1.5, zc, L, 2.2, 1, 0, face(s), 0);
      K.board(b, K.signRects[sign.i], s * (xf - 0.06), 3.05, zc, Math.min(L, 5.2), (Math.min(L, 5.2) * 104) / 512, 1, 0, face(s), 0);
      K.pool(b, s * (xf - 1.5), zc, 3, L, hdr('#ffd9a0', 0.09));
    }
  };
  K.papel = (b, x0, x1, y, z, { sag = 0.6, step = 0.42, size = 0.34 } = {}) => {   // a string of papel picado between two points across the view (x0 → x1 at distance z)
    const n = Math.max(2, Math.round(Math.abs(x1 - x0) / step));
    beam(b, VC.solid, x0, y, z, (x0 + x1) / 2, y - sag, z, 0.015, '#f4f0e8'); beam(b, VC.solid, (x0 + x1) / 2, y - sag, z, x1, y, z, 0.015, '#f4f0e8');
    for (let k = 1; k < n; k++) { const t = k / n, x = x0 + (x1 - x0) * t, yy = y - sag * 4 * t * (1 - t); b.add(planeUV(pick(K.papelRects)), K.papelMat, x, yy - size * 0.62, z, size, size * 1.25, 1, 0, rand(-0.25, 0.25), rand(-0.1, 0.1)); }
  };
  K.papelZ = (b, x, y, z0, z1, { sag = 0.5, step = 0.42, size = 0.34, to = null } = {}) => {   // a string along the street at x from distance z0 to z1, its ends tied back to the fronts at x = to
    const n = Math.max(2, Math.round(Math.abs(z1 - z0) / step));
    for (let k = 1; k < n; k++) { const t = k / n, z = z0 + (z1 - z0) * t, yy = y - sag * 4 * t * (1 - t); b.add(planeUV(pick(K.papelRects)), K.papelMat, x, yy - size * 0.62, -z, size, size * 1.25, 1, 0, Math.PI / 2 + rand(-0.25, 0.25), rand(-0.1, 0.1)); }
    beam(b, VC.solid, x, y, -z0, x, y - sag, -(z0 + z1) / 2, 0.015, '#f4f0e8'); beam(b, VC.solid, x, y - sag, -(z0 + z1) / 2, x, y, -z1, 0.015, '#f4f0e8');
    if (to !== null) for (const z of [z0, z1]) beam(b, VC.solid, x, y, -z, to, y + 0.5, -z, 0.015, '#f4f0e8');
  };
  K.cart = (b, x, z, side, kind = pick(['ELOTES', 'MANGOS', 'PALETAS', 'HOT DOGS', 'TACOS', 'CHURROS', 'FRUTA', 'TAMALES'])) => {   // a street cart under its umbrella, the vendor beside it
    b.block(VC.solid, kind === 'PALETAS' ? '#f4f4f0' : '#c8ccd2', x, 0.3, z, 0.9, 0.8, 1.6);
    for (const e of [-1, 1]) b.cyl(VC.solid, '#1a1a1a', x + e * 0.4, 0.22, z + 0.5, 0.2, 0.08, 'cyl8', 0, Math.PI / 2);
    K.board(b, K.kioskRects[KI[kind]], x - side * 0.46, 0.75, z, 1.4, 0.35, 1, 0, face(side), 0);
    if (kind === 'MANGOS' || kind === 'FRUTA') for (let k = 0; k < 6; k++) b.add(G.sphLow, VC.solid, x + rand(-0.25, 0.25), 1.3, z + rand(-0.6, 0.6), 0.14, 0.24, 0.14, 0, 0, 0, pick(['#ffa01a', '#ff5a3a', '#7cd84a', '#ffd23d']));
    else if (kind === 'ELOTES') for (let k = 0; k < 5; k++) b.add(G.cyl8, VC.solid, x + rand(-0.2, 0.2), 1.25, z + rand(-0.6, 0.6), 0.1, 0.32, 0.1, 0, 0, rand(-0.5, 0.5), '#f2d050');
    else if (kind === 'HOT DOGS') { b.box(VC.metal, '#3a3a3e', x, 1.16, z, 0.8, 0.06, 1.2); K.smokeBuf.push([x, 1.6, z]); }   // its griddle smoking
    b.cyl(VC.metal, '#8a8a8a', x, 1.6, z, 0.025, 2.0, 'cyl6');
    b.add(G.cone8, VC.solid, x, 2.75, z, 2.2, 0.5, 2.2, 0, 0, 0, pick(['#e8302a', '#2a8ad8', '#ffd23d', '#2a9a4a', '#ff7a2a']));
    K.person(b, x + side * 0.85, z + rand(-0.4, 0.4), { ry: side < 0 ? -Math.PI / 2 : Math.PI / 2, hat: pick(['cap', 'none', 'sunhat']) });
  };
  K.mariachi = (b, x, z, side) => {   // a trio in their charro suits and wide sombreros: guitar, trumpet, violin
    const ry = side < 0 ? -Math.PI / 2 : Math.PI / 2;
    for (let k = 0; k < 3; k++) {
      const pz = z + (k - 1) * 0.8;
      K.person(b, x, pz, { ry, top: '#1a1a1e', legs: '#1a1a1e', hat: 'none', bag: false, phone: false, shorts: false, shades: false });
      b.add(G.cyl8, VC.solid, x, 1.85, pz, 0.9, 0.06, 0.9, 0, 0, 0, '#2a2420'); b.add(G.cone8, VC.solid, x, 2.0, pz, 0.36, 0.34, 0.36, 0, 0, 0, '#2a2420');
      for (let j = 0; j < 4; j++) b.box(VC.solid, '#e8c060', x + side * 0.235, 1.3 - j * 0.12, pz, 0.01, 0.04, 0.04);
      if (k === 0) b.add(G.sphLow, VC.solid, x - side * 0.3, 1.0, pz, 0.12, 0.42, 0.34, 0, 0, 0, '#c8803a');
      else if (k === 1) b.add(G.cyl8, VC.metal, x - side * 0.4, 1.62, pz, 0.08, 0.4, 0.08, 0, 0, (Math.PI / 2) * side, '#e8c060');
      else b.add(G.box, VC.solid, x - side * 0.2, 1.45, pz + 0.15, 0.06, 0.12, 0.42, 0.3, 0, 0, '#8a4a2a');
    }
  };
  K.surfRack = (b, x, z, side) => {   // a rack of boards standing outside a surf shop
    b.box(VC.solid, '#6a5038', x, 0.5, z, 0.3, 0.1, 3.2);
    for (let k = 0; k < 7; k++) b.add(G.sphLow, VC.solid, x - side * 0.1, 1.15, z - 1.4 + k * 0.46, 0.08, 2.3, 0.5, 0, 0, side * 0.12, pick(BOARDS));
  };

  // ---------- smoke ----------
  // the grills' and the bonfires' smoke: each chunk gathers its points, then one mesh of soft puffs takes them
  K.smokes = []; K.smokeBuf = [];
  K.smoke = (pts) => { const m = puffs(pts, { size: 0.9, grow: 2.4, rise: 1.4, drift: 0.8, life: 5, n: 3, color: '#e0d4cc', opacity: 0.22 }); K.smokes.push(m); return m; };
  K.flushSmoke = (g) => { if (K.smokeBuf.length) g.add(K.smoke(K.smokeBuf.splice(0))); return g; };

  K.update = (t) => {
    K.water.userData.scroll.offset.set(t * 0.006, t * 0.018);
    for (const m of K.smokes) m.userData.update(t);
    const on = Math.floor(t * 3.2) % 2;
    K.chaseA.color.set('#ffe0a0').multiplyScalar(on ? 3.4 : 0.5); K.chaseB.color.set('#ffe0a0').multiplyScalar(on ? 0.5 : 3.4);
  };
  return K;
}

// ---------- roof geometry ----------
const prisms = new Map();
function prism(w, h, d) {   // a gable roof: a triangle w wide and h high standing on y = 0, running back from z = 0 to z = -d
  const key = `${w.toFixed(1)}|${h.toFixed(1)}|${d.toFixed(1)}`;
  if (!prisms.has(key)) { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d); prisms.set(key, g); }
  return prisms.get(key);
}
const gables = new Map();
function gableFace(w, h) {   // a gable's end wall, its UVs in metres
  const key = `${w.toFixed(1)}|${h.toFixed(1)}`;
  if (!gables.has(key)) { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.closePath(); const g = new THREE.ShapeGeometry(sh); const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 2.5, p.getY(i) / 2.5); gables.set(key, g); }
  return gables.get(key);
}
const hips = new Map();
// a slope a→b→c(→d), counter-clockwise from outside, a→b along its eave: UVs in metres along the eave and up the slope
function slope(P, U, pts) {
  const v = pts.map((p) => new THREE.Vector3(...p)), e = v[1].clone().sub(v[0]).normalize();
  const n = new THREE.Vector3().crossVectors(e, v[2].clone().sub(v[0])).normalize(), up = new THREE.Vector3().crossVectors(n, e);
  const tri = (i, j, k) => { for (const q of [v[i], v[j], v[k]]) { const r = q.clone().sub(v[0]); P.push(q.x, q.y, q.z); U.push(r.dot(e), r.dot(up)); } };
  tri(0, 1, 2); if (v.length > 3) tri(0, 2, 3);
}
const roofGeo = (P, U) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals(); return g; };
export function hipRoof(w, d, h) {   // a hip roof on a w × d plan from z = 0 back to z = -d, its ridge h up
  const key = `${w.toFixed(1)}|${d.toFixed(1)}|${h.toFixed(1)}`;
  if (hips.has(key)) return hips.get(key);
  const hw = w / 2, A = [-hw, 0, 0], B = [hw, 0, 0], C = [hw, 0, -d], D = [-hw, 0, -d], P = [], U = [];
  if (w >= d) {   // the ridge along the street
    const r = (w - d) / 2, R0 = [-r, h, -d / 2], R1 = [r, h, -d / 2];
    slope(P, U, [A, B, R1, R0]); slope(P, U, [C, D, R0, R1]); slope(P, U, [B, C, R1]); slope(P, U, [D, A, R0]);
  } else {   // the ridge running back from the street
    const R0 = [0, h, -w / 2], R1 = [0, h, -d + w / 2];
    slope(P, U, [A, B, R0]); slope(P, U, [B, C, R1, R0]); slope(P, U, [C, D, R1]); slope(P, U, [D, A, R0, R1]);
  }
  const g = roofGeo(P, U);
  hips.set(key, g);
  return g;
}
const gableRoofs = new Map();
export function gableRoof(w, d, h) {   // a gable roof of tile: two slopes from the eaves along z up to the ridge h up, its ends closed
  const key = `${w.toFixed(1)}|${d.toFixed(1)}|${h.toFixed(1)}`;
  if (gableRoofs.has(key)) return gableRoofs.get(key);
  const hw = w / 2, E0 = [-hw, 0, 0], E1 = [hw, 0, 0], F0 = [-hw, 0, -d], F1 = [hw, 0, -d], R = [0, h, 0], S = [0, h, -d], P = [], U = [];
  slope(P, U, [E1, F1, S, R]); slope(P, U, [F0, E0, R, S]); slope(P, U, [E0, E1, R]); slope(P, U, [F1, F0, S]);
  const g = roofGeo(P, U);
  gableRoofs.set(key, g);
  return g;
}
