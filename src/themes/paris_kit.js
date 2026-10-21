// Paris street kit for a spring evening at the blue hour: Haussmann limestone with continuous wrought-iron balconies under
// zinc mansards and chimney pots, café terraces under their awnings, boulangeries, pharmacies with the green cross and the
// tabac's red carrot, Morris columns, Wallace fountains, Guimard Métro entrances, kiosks, Vélib' bikes and 2CVs; the
// Seine's quays with the bouquinistes' green boxes, bateaux-mouches and stone arch bridges; Montmartre's pastel houses and
// painters, the Marais' old stone and half-timbering, the formal gardens' clipped trees; and the Eiffel Tower itself.
import { THREE, VC, G, std, basic, hdr, signAtlas, planeUV, canvasTex, buildingGeo, CURVE_GLSL, curveUniforms, rand, randi, pick, chance } from '../core.js';
import { buildingRow, facadeMat, EDGE, waterMat, textTex, at } from './common.js';
import { beam, wire } from './tokyo_kit.js';
import { parisTreeKit } from './trees.js';
import { tiledBox } from './beijing_kit.js';
import { pointScale } from '../fx.js';

export const SERIF = 'Didot, "Bodoni 72", "Bodoni MT", Georgia, "Times New Roman", serif';
const SANS = '"Chakra Petch", "Helvetica Neue", Arial, sans-serif';
export const WARM = ['#ffd9a0', '#ffe6c0', '#ffcf8a', '#fff0d8', '#ffc878'];
export const IRON = '#1c2622';    // the city's dark green-black cast iron
export const GREEN = '#2a5a3e';   // Davioud green: kiosks, benches, fountains, Morris columns, the bouquinistes' boxes
export const ZINC = '#56607a';
export const WY = -5.2;           // the Seine, well below the quays
const STONE = ['#ffffff', '#f6eee0', '#f0e6d2', '#fbf4e8', '#ece0c8', '#f2e8d8'];
const PASTEL = ['#ffffff', '#fbe0e0', '#f8eec4', '#dff0e2', '#fbe8d4', '#e2ecf6', '#f4e4f0'];
const COATS = ['#c8b08a', '#1f2a44', '#1a1a1e', '#b08a5a', '#6a6a72', '#a8202a', '#e8e0d0', '#5a5a3a', '#2a3a5a', '#8a4a3a', '#f0ece4', '#3a2a3a'];
const TROUSERS = ['#1c1c22', '#2a3a5a', '#3a3030', '#d8d0c0', '#4a4a52'];
const SKIN = ['#f0d0b0', '#e8c4a0', '#d9a07a', '#a87a5a', '#7a5238', '#f4dcc4'];
const SCARF = ['#c8202c', '#1f2a44', '#e8b030', '#f4f0e8', '#2a6a4a', '#d85a8a', '#7a4ad8'];
const RATTAN = ['#c8202c', '#1f4a8a', '#2a6a4a', '#e8d8b0', '#141414', '#d8a030'];

// ---------- textures ----------
// Haussmann facade pair: tall French windows in moulded surrounds under little cornices, each with its wrought-iron guard,
// over ashlar courses and a string course at every floor. A cell is one bay by one storey; the sill sits just above the
// cell's floor line so balconies at floor + 0.3 m meet the windows.
function haussTex({ cols = 4, rows = 6, wall = '#e6d8bc', litChance = 0.55, rail = true, cw = 32, ch = 48, narrow = 0 } = {}) {
  const W = cols * cw, H = rows * ch, cells = [];
  for (let r = 0; r < rows; r++) { const rl = Math.random() < 0.15 ? 0.85 : litChance; for (let c = 0; c < cols; c++) cells.push(Math.random() < rl ? pick(WARM) : null); }
  const R = (c, r) => [c * cw + 9 + narrow, r * ch + 8, cw - 18 - narrow * 2, ch - 14];
  const guard = (g, x, y, w, h, col) => {
    g.strokeStyle = col; g.lineWidth = 1;
    const y0 = y + h * 0.68;
    g.beginPath(); g.moveTo(x - 1, y0); g.lineTo(x + w + 1, y0); g.moveTo(x - 1, y + h - 0.5); g.lineTo(x + w + 1, y + h - 0.5); g.stroke();
    for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(x + (k + 0.5) * w / 3, y0 + h * 0.16, w / 7.5, h * 0.12, 0, 0, 7); g.stroke(); }
  };
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(90,72,48,0.16)'; g.lineWidth = 1;
    for (let y = 0, row = 0; y < H; y += 6, row++) {
      g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke();
      for (let x = (row % 2) * 7; x < W; x += 14) { g.beginPath(); g.moveTo(x + 0.5, y); g.lineTo(x + 0.5, y + 6); g.stroke(); }
    }
    for (let i = 0; i < W * H / 50; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(60,48,30,0.07)' : 'rgba(255,255,255,0.06)'; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r);
      g.fillStyle = 'rgba(244,236,216,0.95)'; g.fillRect(x - 3, y - 3, w + 6, h + 4);
      g.fillStyle = 'rgba(80,64,40,0.28)'; g.fillRect(x - 4, y - 6, w + 8, 2);
      g.fillStyle = '#fbf5e6'; g.fillRect(x - 5, y - 8.5, w + 10, 2.5);
      g.fillStyle = '#16161c'; g.fillRect(x, y, w, h);
      g.strokeStyle = '#efe6d2'; g.lineWidth = 1.2; g.beginPath();
      g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); for (const f of [0.24, 0.47]) { g.moveTo(x, y + h * f); g.lineTo(x + w, y + h * f); }
      g.stroke();
      if (rail) guard(g, x, y, w, h, '#121212');
    }
    for (let r = 1; r <= rows; r++) { g.fillStyle = 'rgba(255,250,236,0.55)'; g.fillRect(0, r * ch - 2.5, W, 1.6); g.fillStyle = 'rgba(70,56,36,0.24)'; g.fillRect(0, r * ch - 0.9, W, 0.9); }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const col = cells[r * cols + c];
      if (!col) continue;
      const [x, y, w, h] = R(c, r), gr = g.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, col); gr.addColorStop(1, `#${new THREE.Color(col).multiplyScalar(0.5).getHexString()}`);
      g.fillStyle = gr; g.fillRect(x, y, w, h);
      if (Math.random() < 0.55) { g.fillStyle = 'rgba(40,10,10,0.55)'; g.fillRect(x, y, w * 0.22, h); g.fillRect(x + w * 0.78, y, w * 0.22, h); }   // drawn curtains
      g.strokeStyle = '#000'; g.lineWidth = 1.2; g.beginPath();
      g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); for (const f of [0.24, 0.47]) { g.moveTo(x, y + h * f); g.lineTo(x + w, y + h * f); }
      g.stroke();
      if (rail) guard(g, x, y, w, h, '#000');
    }
  });
  return { map, emissive, cols, rows };
}
// Montmartre's plastered houses: casements between open louvred shutters
function shutterTex(shut) {
  const cols = 3, rows = 4, cw = 32, ch = 40, W = cols * cw, H = rows * ch, cells = [];
  for (let i = 0; i < cols * rows; i++) cells.push(Math.random() < 0.5 ? pick(WARM) : null);
  const R = (c, r) => [c * cw + 11, r * ch + 8, cw - 22, ch - 14];
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(150,130,100,${rand(0.03, 0.08).toFixed(2)})`; g.beginPath(); g.ellipse(rand(0, W), rand(0, H), rand(6, 18), rand(4, 12), 0, 0, 7); g.fill(); }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r);
      g.fillStyle = '#fbf8f2'; g.fillRect(x - 2, y - 2, w + 4, h + 3);
      g.fillStyle = '#15161c'; g.fillRect(x, y, w, h);
      g.strokeStyle = '#f4f0e8'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.5); g.lineTo(x + w, y + h * 0.5); g.stroke();
      for (const sx of [x - w / 2 - 2.5, x + w + 2.5]) {
        g.fillStyle = shut; g.fillRect(sx, y - 1, w / 2, h + 2);
        g.fillStyle = 'rgba(0,0,0,0.25)'; for (let yy = y + 1; yy < y + h; yy += 2.5) g.fillRect(sx, yy, w / 2, 0.8);
      }
      g.fillStyle = '#e8e2d6'; g.fillRect(x - 3, y + h + 1, w + 6, 2);
    }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const col = cells[r * cols + c];
      if (!col) continue;
      const [x, y, w, h] = R(c, r);
      g.fillStyle = col; g.fillRect(x, y, w, h);
      g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.5); g.lineTo(x + w, y + h * 0.5); g.stroke();
    }
  });
  return { map, emissive, cols, rows };
}
// the Marais' half-timbering: dark oak posts and braces over cream plaster, small windows
function colombTex() {
  const cols = 3, rows = 4, cw = 32, ch = 40, W = cols * cw, H = rows * ch, cells = [];
  for (let i = 0; i < cols * rows; i++) cells.push(Math.random() < 0.5 ? pick(WARM) : null);
  const R = (c, r) => [c * cw + 10, r * ch + 10, cw - 20, ch - 20];
  const timber = (g, col) => {
    g.fillStyle = col;
    for (let r = 0; r <= rows; r++) g.fillRect(0, r * ch - 2, W, 4);
    for (let c = 0; c <= cols; c++) g.fillRect(c * cw - 2, 0, 4, H);
    g.strokeStyle = col; g.lineWidth = 3;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      g.beginPath();
      if ((r + c) % 2) { g.moveTo(c * cw + 2, r * ch + 2); g.lineTo(c * cw + 9, r * ch + ch - 2); g.moveTo(c * cw + cw - 2, r * ch + 2); g.lineTo(c * cw + cw - 9, r * ch + ch - 2); }
      else { g.moveTo(c * cw + 2, r * ch + ch - 2); g.lineTo(c * cw + 9, r * ch + 2); g.moveTo(c * cw + cw - 2, r * ch + ch - 2); g.lineTo(c * cw + cw - 9, r * ch + 2); }
      g.stroke();
    }
  };
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = '#efe4cc'; g.fillRect(0, 0, W, H);
    timber(g, '#4a3020');
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r);
      g.fillStyle = '#3a2618'; g.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
      g.fillStyle = '#15161c'; g.fillRect(x, y, w, h);
      g.strokeStyle = '#6a5a40'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke();
    }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const col = cells[r * cols + c];
      if (!col) continue;
      const [x, y, w, h] = R(c, r);
      g.fillStyle = col; g.fillRect(x, y, w, h);
      g.strokeStyle = '#000'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke();
    }
  });
  return { map, emissive, cols, rows };
}
// Shop windows, one display per row so a window can tile its row across its length
const WIN = { boulangerie: 0, patisserie: 1, cafe: 2, librairie: 3, fleuriste: 4, fromagerie: 5, boutique: 6, cave: 7, presse: 8, chocolatier: 9, pharmacie: 10 };
function shopWinTex() {
  const RW = 256, RH = 64, N = 11;
  return canvasTex(RW, RH * N, (g) => {
    const shelf = (y0, ys) => { g.fillStyle = 'rgba(90,60,30,0.85)'; for (const y of ys) g.fillRect(0, y0 + y, RW, 2.5); };
    for (let r = 0; r < N; r++) {
      const y0 = r * RH, gr = g.createLinearGradient(0, y0, 0, y0 + RH);
      gr.addColorStop(0, r === 10 ? '#f4fff8' : '#fff2d8'); gr.addColorStop(1, r === 10 ? '#c8e8d8' : '#e8b070');
      g.fillStyle = gr; g.fillRect(0, y0, RW, RH);
      if (r === 0) {   // bread: country loaves on the shelves, baguettes standing in baskets, croissants
        shelf(y0, [26, 46]);
        for (let x = 6; x < RW; x += 16) { g.fillStyle = pick(['#c88a40', '#b8762e', '#d89a50']); g.beginPath(); g.ellipse(x, y0 + 21, 6.5, 4.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,240,200,0.5)'; g.fillRect(x - 3, y0 + 19, 6, 1); }
        for (let x = 4; x < RW; x += 9) { g.fillStyle = '#7a5030'; g.fillRect(x, y0 + 52, 7, 10); g.strokeStyle = '#d8a050'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 2, y0 + 52); g.lineTo(x + 1 + rand(-2, 2), y0 + 30); g.moveTo(x + 5, y0 + 52); g.lineTo(x + 6 + rand(-2, 2), y0 + 32); g.stroke(); }
        for (let x = 8; x < RW; x += 13) { g.fillStyle = '#d8963a'; g.beginPath(); g.arc(x, y0 + 43, 4, Math.PI, 0); g.fill(); }
      } else if (r === 1) {   // pâtisserie: towers of macarons, tarts and cakes
        shelf(y0, [30, 50]);
        for (let x = 8; x < RW; x += 22) for (let k = 0; k < 6; k++) { g.fillStyle = pick(['#f4a6c0', '#b8e8c8', '#c8b0f0', '#fff0a0', '#8a5a3a', '#ffd0a0']); g.beginPath(); g.ellipse(x, y0 + 28 - k * 3.6, 6 - k * 0.6, 1.8, 0, 0, 7); g.fill(); }
        for (let x = 18; x < RW; x += 22) { g.fillStyle = '#e8b860'; g.beginPath(); g.ellipse(x, y0 + 47, 8, 2.5, 0, 0, 7); g.fill(); for (let k = 0; k < 5; k++) { g.fillStyle = '#d81e3a'; g.beginPath(); g.arc(x - 5 + k * 2.5, y0 + 45.5, 1.3, 0, 7); g.fill(); } }
        for (let x = 6; x < RW; x += 14) { g.fillStyle = pick(['#5a3020', '#f4e8d8', '#e890a8']); g.fillRect(x, y0 + 54, 9, 6); }
      } else if (r === 2) {   // a café: the zinc bar, bottles against the mirror, globe lamps, people
        g.fillStyle = 'rgba(255,230,170,0.6)'; g.fillRect(0, y0 + 6, RW, 22);
        for (let x = 3; x < RW; x += 5) { g.fillStyle = pick(['#2a6a3a', '#8a2a1a', '#d8a030', '#3a3a6a', '#e8e0c0']); g.fillRect(x, y0 + 14 + rand(-2, 2), 3, 12); }
        g.fillStyle = '#4a2a18'; g.fillRect(0, y0 + 40, RW, 24); g.fillStyle = '#c8ccd0'; g.fillRect(0, y0 + 38, RW, 3);
        for (let x = 20; x < RW; x += 40) { g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(x, y0 + 6, 4.5, 0, 7); g.fill(); }
        for (let x = 10; x < RW; x += rand(18, 30)) { g.fillStyle = 'rgba(30,20,20,0.85)'; g.beginPath(); g.arc(x, y0 + 30, 4, 0, 7); g.fill(); g.fillRect(x - 5, y0 + 34, 10, 10); }
      } else if (r === 3) {   // books, spines on the shelves
        shelf(y0, [22, 42, 62]);
        for (const yb of [2, 24, 44]) for (let x = 0; x < RW; x += rand(2.5, 4.5)) { const hh = rand(13, 19); g.fillStyle = pick(['#8a2a1a', '#2a4a7a', '#d8c8a0', '#3a6a3a', '#e8b030', '#5a2a5a', '#f4f0e8', '#1a1a1e']); g.fillRect(x, y0 + yb + 19 - hh, rand(2, 3.6), hh); }
      } else if (r === 4) {   // flowers in buckets on stepped stands
        for (let x = 6; x < RW; x += 13) for (const [yy, rr] of [[18, 6], [34, 7], [50, 7.5]]) { const col = pick(['#e82a4a', '#ff8ab0', '#ffd23a', '#ffffff', '#b06ad8', '#ff6a2a', '#e8287a']); for (let k = 0; k < 6; k++) { g.fillStyle = k < 2 ? '#3a7a32' : col; g.beginPath(); g.arc(x + rand(-rr, rr) * 0.7, y0 + yy + rand(-rr, rr) * 0.5, rand(2.2, 3.4), 0, 7); g.fill(); } }
      } else if (r === 5) {   // cheese: wheels and wedges, sausages hanging over them
        shelf(y0, [36, 56]);
        for (let x = 10; x < RW; x += 20) { g.fillStyle = pick(['#f2d890', '#f8eec8', '#e8b850', '#fff6d8']); g.beginPath(); g.ellipse(x, y0 + 30, 9, 6, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(160,110,40,0.5)'; g.fillRect(x - 9, y0 + 30, 18, 1); }
        for (let x = 4; x < RW; x += 9) { g.fillStyle = pick(['#8a3a2a', '#6a2a1a', '#a85a3a']); g.fillRect(x, y0 + 2, 3, rand(10, 16)); }
        for (let x = 6; x < RW; x += 12) { g.fillStyle = pick(['#f8eec8', '#e8b850']); g.beginPath(); g.moveTo(x, y0 + 54); g.lineTo(x + 10, y0 + 54); g.lineTo(x + 2, y0 + 46); g.closePath(); g.fill(); }
      } else if (r === 6) {   // a boutique: dresses on mannequins under spots
        for (let x = 18; x < RW; x += 36) {
          g.fillStyle = 'rgba(255,255,240,0.5)'; g.beginPath(); g.ellipse(x, y0 + 40, 16, 26, 0, 0, 7); g.fill();
          g.fillStyle = pick(['#c8202c', '#141414', '#e8d8c0', '#2a4a7a', '#d85a8a', '#3a6a4a']);
          g.beginPath(); g.moveTo(x - 4, y0 + 14); g.lineTo(x + 4, y0 + 14); g.lineTo(x + 9, y0 + 52); g.lineTo(x - 9, y0 + 52); g.closePath(); g.fill();
          g.fillStyle = '#e8dcc8'; g.beginPath(); g.arc(x, y0 + 10, 3.5, 0, 7); g.fill();
        }
      } else if (r === 7) {   // a wine merchant: bottles racked by the dozen, crates below
        for (let x = 2; x < RW; x += 5) for (const yy of [4, 22]) { g.fillStyle = pick(['#1e3a24', '#3a1420', '#2a2418', '#5a1a2a']); g.fillRect(x, y0 + yy + 4, 3.4, 12); g.fillRect(x + 1, y0 + yy, 1.4, 5); }
        for (let x = 4; x < RW; x += 26) { g.fillStyle = '#a87a4a'; g.fillRect(x, y0 + 44, 22, 16); g.fillStyle = '#7a5030'; g.fillRect(x, y0 + 50, 22, 1.5); }
      } else if (r === 8) {   // the newsstand: magazines and papers under bright mastheads
        for (let x = 1; x < RW; x += 12) for (const yy of [2, 22, 42]) { g.fillStyle = pick(['#d81e2a', '#1a4a9a', '#f4e030', '#f4f0e8', '#2a8a4a', '#e85aa0', '#141414']); g.fillRect(x, y0 + yy, 10.5, 18); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(x + 1, y0 + yy + 1.5, 8.5, 3); }
      } else if (r === 9) {   // a chocolatier: boxes tied with ribbons, a fountain of eggs
        shelf(y0, [30, 52]);
        for (let x = 4; x < RW; x += 16) { g.fillStyle = pick(['#5a3020', '#c8a050', '#3a1a10', '#e8d8b0']); g.fillRect(x, y0 + 16, 12, 13); g.fillStyle = pick(['#c8202c', '#e8c060', '#f4f0e8']); g.fillRect(x + 5, y0 + 16, 2, 13); }
        for (let x = 8; x < RW; x += 11) { g.fillStyle = pick(['#6a3a20', '#3a1a10', '#c89a50']); g.beginPath(); g.ellipse(x, y0 + 45, 4, 5.5, 0, 0, 7); g.fill(); }
      } else {   // a pharmacy: white shelves of little boxes
        shelf(y0, [20, 40, 60]);
        for (const yb of [6, 26, 46]) for (let x = 2; x < RW; x += rand(4, 7)) { g.fillStyle = pick(['#ffffff', '#c8e8f8', '#d8f0d8', '#f8d8e0', '#2a8a4a']); g.fillRect(x, y0 + yb, rand(3, 5), rand(9, 13)); }
      }
      g.fillStyle = 'rgba(24,20,18,0.88)';
      for (let x = 0; x <= RW; x += 64) g.fillRect(x - 2, y0, 4, RH);
      g.fillRect(0, y0, RW, 3); g.fillRect(0, y0 + RH - 5, RW, 5);
    }
  });
}
// Painted fascia boards with gilt serif capitals
const BOARDS = ['BOULANGERIE', 'PÂTISSERIE', 'CAFÉ', 'LIBRAIRIE', 'FLEURISTE', 'FROMAGERIE', 'BOUTIQUE', 'CAVE À VINS', 'PRESSE', 'CHOCOLATIER',
  'BRASSERIE', 'BISTROT', 'PHARMACIE', 'TABAC', 'CRÊPERIE', 'ANTIQUITÉS', 'PARFUMERIE', 'MACARONS'];
function boardAtlas() {
  const cols = 2, rows = Math.ceil(BOARDS.length / cols), cw = 512, ch = 80;
  const tex = canvasTex(cw * cols, ch * rows, (g) => {
    BOARDS.forEach((name, i) => {
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
      g.fillStyle = name === 'PHARMACIE' ? '#f4f4ee' : pick(['#173a2a', '#14223e', '#4a1420', '#121214', '#2a1a12']); g.fillRect(x, y, cw, ch);
      g.strokeStyle = name === 'PHARMACIE' ? '#2a8a4a' : '#c8a050'; g.lineWidth = 3; g.strokeRect(x + 6, y + 6, cw - 12, ch - 12);
      g.font = `700 46px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = name === 'PHARMACIE' ? '#1e7a3e' : '#f0d488'; g.fillText(name, x + cw / 2, y + ch / 2 + 3, cw - 40);
    });
  }, { repeat: false });
  const rects = BOARDS.map((_, i) => { const c = i % cols, r = Math.floor(i / cols); return { u0: c / cols, u1: (c + 1) / cols, v0: 1 - (r + 1) / rows, v1: 1 - r / rows }; });
  return { tex, rects };
}
// Awnings: striped and plain canvas; one style per row so an awning can tile its row along its length
const AWN = 8;
function awningTex() {
  return canvasTex(64, 32 * AWN, (g) => {
    const rows = [['#c8202c', '#f4f0e8'], ['#1e5a3a', '#f4f0e8'], ['#1a2a5a', '#f4f0e8'], ['#6a1424', null], ['#1e4a32', null], ['#b81e28', null], ['#16224a', null], ['#e8b030', '#f4f0e8']];
    rows.forEach(([a, b2], r) => {
      g.fillStyle = a; g.fillRect(0, r * 32, 64, 32);
      if (b2) { g.fillStyle = b2; for (let x = 8; x < 64; x += 16) g.fillRect(x, r * 32, 8, 32); }
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, r * 32 + 28, 64, 4);
    });
  });
}
const AWN_COL = ['#c8202c', '#1e5a3a', '#1a2a5a', '#6a1424', '#1e4a32', '#b81e28', '#16224a', '#e8b030'];
// the names printed on the awnings' valances, white on clear
const VALANCE = ['CAFÉ', 'BRASSERIE', 'BISTROT', 'CRÊPERIE', 'BOULANGERIE', 'PÂTISSERIE', 'FROMAGERIE', 'FLEURISTE', 'CAFÉ · TABAC', 'LIBRAIRIE', 'GLACES', 'VINS · CAVE'];
function valanceAtlas() {
  const cols = 2, rows = Math.ceil(VALANCE.length / cols), cw = 512, ch = 64;
  const tex = canvasTex(cw * cols, ch * rows, (g) => {
    g.clearRect(0, 0, cw * cols, ch * rows);
    VALANCE.forEach((t, i) => {
      g.font = `700 40px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fbf6ea';
      g.fillText(t, (i % cols) * cw + cw / 2, Math.floor(i / cols) * ch + ch / 2 + 2, cw - 30);
    });
  }, { repeat: false });
  const rects = VALANCE.map((_, i) => { const c = i % cols, r = Math.floor(i / cols); return { u0: c / cols, u1: (c + 1) / cols, v0: 1 - (r + 1) / rows, v1: 1 - r / rows }; });
  return { tex, rects };
}
function railTex() {   // a balcony's wrought iron: bars between two rails, a frieze of loops
  return canvasTex(64, 32, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#141616'; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(0, 2); g.lineTo(w, 2); g.moveTo(0, h - 2); g.lineTo(w, h - 2); g.moveTo(0, h * 0.66); g.lineTo(w, h * 0.66); g.stroke();
    g.lineWidth = 1.6;
    for (let x = 4; x < w; x += 8) { g.beginPath(); g.moveTo(x, 2); g.lineTo(x, h * 0.66); g.stroke(); }
    for (let x = 8; x < w; x += 16) { g.beginPath(); g.ellipse(x, h * 0.83, 6, 4, 0, 0, 7); g.stroke(); }
  });
}
function guimardRailTex() {   // Guimard's cast iron: sinuous stems between the rails, shields in the middle
  return canvasTex(64, 32, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#2c5a3e'; g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(0, 2); g.lineTo(w, 2); g.moveTo(0, h - 2); g.lineTo(w, h - 2); g.stroke();
    g.lineWidth = 2;
    for (let x = 0; x < w; x += 32) {
      g.beginPath(); g.moveTo(x + 4, h - 2); g.bezierCurveTo(x + 4, h * 0.3, x + 16, h * 0.7, x + 16, 2); g.moveTo(x + 28, h - 2); g.bezierCurveTo(x + 28, h * 0.3, x + 16, h * 0.7, x + 16, 2); g.stroke();
      g.beginPath(); g.ellipse(x + 16, h * 0.55, 4, 6, 0, 0, 7); g.stroke();
    }
  });
}
function fenceTex() {   // the gardens' railings: black bars with gilded spear tips
  return canvasTex(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#121414';
    for (let x = 3; x < w; x += 8) g.fillRect(x, 10, 2.4, h - 10);
    g.fillRect(0, 16, w, 2.6); g.fillRect(0, h - 6, w, 3);
    g.fillStyle = '#e8c060';
    for (let x = 4.2; x < w; x += 8) { g.beginPath(); g.moveTo(x - 2.6, 11); g.lineTo(x + 2.6, 11); g.lineTo(x, 3); g.closePath(); g.fill(); }
  });
}
function posterTex() {   // the posters round a Morris column: theatre, cabaret, circus, jazz, cinema and the exhibition
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#2a3a30'; g.fillRect(0, 0, w, h);
    const P = [['#e8c060', '#141414', 'OPÉRA'], ['#141414', '#f4e8d0', 'CABARET'], ['#c8202c', '#ffe680', 'CIRQUE'], ['#1a3a8a', '#ffb030', 'JAZZ'], ['#f4e8d0', '#c8202c', 'CINÉMA'], ['#2a7a5a', '#f4f0e8', 'EXPO']];
    P.forEach(([bg, fg, t], k) => {
      const x = 4 + k * (w / 6), pw = w / 6 - 8;
      g.fillStyle = bg; g.fillRect(x, 6, pw, h - 12);
      g.fillStyle = fg;
      if (k === 1) { g.beginPath(); g.ellipse(x + pw / 2, 64, 12, 9, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x + pw / 2 - 9, 52, 6, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + pw / 2 - 14, 46); g.lineTo(x + pw / 2 - 11, 40); g.lineTo(x + pw / 2 - 8, 47); g.fill(); g.fillRect(x + pw / 2 + 8, 52, 2, 22); }   // the black cat
      else if (k === 2) { for (let i = 0; i < 8; i++) { g.fillRect(x + pw / 2 - 1, 40, 2, 34); g.save(); g.translate(x + pw / 2, 57); g.rotate(i * 0.4); g.fillRect(-1, -17, 2, 34); g.restore(); } }
      else { g.beginPath(); g.arc(x + pw / 2, 58, 13, 0, 7); g.fill(); }
      g.font = `900 13px ${SANS}`; g.textAlign = 'center'; g.fillStyle = fg; g.fillText(t, x + pw / 2, 26, pw - 4);
      g.font = `700 8px ${SANS}`; g.fillText('PARIS', x + pw / 2, h - 20, pw - 4);
    });
  });
}
const STREETS = [['RUE DE RIVOLI', '1er'], ['BD SAINT-GERMAIN', '6e'], ['AV. MONTAIGNE', '8e'], ['RUE DE LA PAIX', '2e'], ['QUAI DE CONTI', '6e'], ['RUE LEPIC', '18e'],
  ['RUE DES ROSIERS', '4e'], ['PLACE DES VOSGES', '4e'], ['RUE CLER', '7e'], ['RUE MOUFFETARD', '5e'], ['BD HAUSSMANN', '9e'], ['RUE DU BAC', '7e']];
function streetSignAtlas() {   // blue enamel plaques: a white rule inside a green frame, the arrondissement over the name
  const cols = 2, rows = 6, cw = 256, ch = 96;
  const tex = canvasTex(cw * cols, ch * rows, (g) => {
    STREETS.forEach(([name, arr], i) => {
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
      g.fillStyle = '#2a6a4a'; g.fillRect(x, y, cw, ch);
      g.fillStyle = '#1c3c8a'; g.fillRect(x + 6, y + 6, cw - 12, ch - 12);
      g.strokeStyle = '#f4f4f0'; g.lineWidth = 2.5; g.strokeRect(x + 11, y + 11, cw - 22, ch - 22);
      g.fillStyle = '#f4f4f0'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `600 17px ${SANS}`; g.fillText(`${arr} ARRt`, x + cw / 2, y + 30);
      g.font = `800 28px ${SANS}`; g.fillText(name, x + cw / 2, y + 62, cw - 34);
    });
  }, { repeat: false });
  const rects = STREETS.map((_, i) => { const c = i % cols, r = Math.floor(i / cols); return { u0: c / cols, u1: (c + 1) / cols, v0: 1 - (r + 1) / rows, v1: 1 - r / rows }; });
  return { tex, rects };
}
function paintingTex() {   // the painters' canvases: the tower at dusk, the basilica, the river, flowers, a portrait, the rooftops
  return canvasTex(256, 64, (g) => {
    for (let k = 0; k < 4; k++) {
      const x = k * 64;
      const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, pick(['#3a4a9a', '#f0a070', '#6a8ad8', '#d85a7a'])); gr.addColorStop(1, pick(['#f8d090', '#ffd8a8', '#e8b070']));
      g.fillStyle = gr; g.fillRect(x + 2, 2, 60, 60);
      g.fillStyle = 'rgba(30,30,50,0.85)';
      if (k === 0) { g.beginPath(); g.moveTo(x + 32, 8); g.lineTo(x + 44, 58); g.lineTo(x + 38, 58); g.quadraticCurveTo(x + 32, 44, x + 26, 58); g.lineTo(x + 20, 58); g.closePath(); g.fill(); }
      else if (k === 1) { g.fillStyle = '#f4f0e8'; g.beginPath(); g.arc(x + 32, 30, 10, Math.PI, 0); g.fill(); g.fillRect(x + 20, 30, 24, 16); g.beginPath(); g.arc(x + 22, 34, 5, Math.PI, 0); g.arc(x + 42, 34, 5, Math.PI, 0); g.fill(); }
      else if (k === 2) { g.fillStyle = '#2a4a8a'; g.fillRect(x + 2, 40, 60, 22); for (let i = 0; i < 12; i++) { g.fillStyle = pick(['#ffd890', '#ffffff', '#ff9a50']); g.fillRect(x + rand(4, 60), rand(42, 60), rand(3, 8), 1.4); } }
      else for (let i = 0; i < 26; i++) { g.fillStyle = pick(['#e82a4a', '#ffd23a', '#ffffff', '#b06ad8', '#3a8a3a', '#ff8ab0']); g.beginPath(); g.arc(x + rand(8, 56), rand(22, 58), rand(2, 5), 0, 7); g.fill(); }
      g.strokeStyle = '#c8a050'; g.lineWidth = 3; g.strokeRect(x + 2, 2, 60, 60);
    }
  }, { repeat: false });
}
function stallTex() {   // a bouquiniste's open box: prints and posters pinned in the lid, old books in rows
  return canvasTex(128, 64, (g) => {
    g.fillStyle = '#2a4a36'; g.fillRect(0, 0, 128, 64);
    for (let k = 0; k < 5; k++) { g.fillStyle = pick(['#f0e4c8', '#e8d8b0', '#f4ecd8']); g.fillRect(4 + k * 25, 4, 21, 28); g.fillStyle = pick(['#8a3a2a', '#2a4a7a', '#3a5a3a', '#5a4a3a']); g.fillRect(8 + k * 25, 10, 13, 15); }
    for (let x = 2; x < 126; x += rand(2.5, 4)) { const hh = rand(16, 26); g.fillStyle = pick(['#8a2a1a', '#2a4a7a', '#d8c8a0', '#3a6a3a', '#6a4a2a', '#5a2a5a', '#e8dcc0']); g.fillRect(x, 62 - hh, rand(2, 3.4), hh); }
  }, { repeat: false });
}
function latticeTex() {   // the tower's riveted lattice: a panel frame crossed by two diagonals and a finer cross
  return canvasTex(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.lineCap = 'square';
    g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    g.lineWidth = 2.6; g.beginPath(); g.moveTo(3, 3); g.lineTo(w - 3, h - 3); g.moveTo(w - 3, 3); g.lineTo(3, h - 3); g.stroke();
    g.lineWidth = 1.2; g.beginPath(); g.moveTo(w / 2, 3); g.lineTo(w / 2, h - 3); g.moveTo(3, h / 2); g.lineTo(w - 3, h / 2); g.stroke();
  });
}

// ---------- the kit ----------
const KINDS = {
  boulangerie: { win: WIN.boulangerie, boards: [0], paint: ['#173a2a', '#14223e', '#4a1420', '#2a2018'], awn: 0.25, val: [4] },
  patisserie: { win: WIN.patisserie, boards: [1, 17], paint: ['#e8c8d0', '#c8e0d8', '#14223e', '#3a1430'], awn: 0.3, val: [5] },
  cafe: { win: WIN.cafe, boards: [2, 10, 11], paint: ['#4a1420', '#173a2a', '#121214', '#3a2014'], awn: 1, val: [0, 1, 2], terrace: true },
  librairie: { win: WIN.librairie, boards: [3, 15], paint: ['#14223e', '#173a2a', '#2a2018'], awn: 0.2, val: [9] },
  fleuriste: { win: WIN.fleuriste, boards: [4], paint: ['#173a2a', '#2a4a3a', '#e8e4dc'], awn: 0.5, val: [7], buckets: true },
  fromagerie: { win: WIN.fromagerie, boards: [5], paint: ['#e8dcc0', '#173a2a', '#3a2014'], awn: 0.4, val: [6] },
  boutique: { win: WIN.boutique, boards: [6, 16], paint: ['#121214', '#e8e4dc', '#14223e'], awn: 0.15, val: [] },
  cave: { win: WIN.cave, boards: [7], paint: ['#3a1420', '#2a2018'], awn: 0.3, val: [11] },
  chocolatier: { win: WIN.chocolatier, boards: [9, 17], paint: ['#3a2014', '#14223e'], awn: 0.3, val: [] },
  pharmacie: { win: WIN.pharmacie, boards: [12], paint: ['#f0f0ec', '#e4ece4'], awn: 0, val: [], cross: true },
  tabac: { win: WIN.presse, boards: [13], paint: ['#4a1420', '#121214'], awn: 0.6, val: [8], carotte: true },
  creperie: { win: WIN.cafe, boards: [14], paint: ['#1e3a6a', '#4a1420'], awn: 0.7, val: [3], terrace: true },
};
const SHOP_W = [['cafe', 0.24], ['boulangerie', 0.11], ['patisserie', 0.08], ['pharmacie', 0.05], ['tabac', 0.06], ['fleuriste', 0.07], ['librairie', 0.08], ['fromagerie', 0.05], ['boutique', 0.12], ['cave', 0.04], ['chocolatier', 0.05], ['creperie', 0.05]];
const pickShop = () => { let r = Math.random(); for (const [k, w] of SHOP_W) { r -= w; if (r <= 0) return k; } return 'cafe'; };

export function makeKit() {
  const K = parisTreeKit();
  // facades
  K.hauss = haussTex({ wall: '#e6d8bc' });
  K.haussMat = facadeMat(K.hauss, { k: 0.85 });
  K.haussB = haussTex({ wall: '#ece2cc', litChance: 0.6 });
  K.haussBMat = facadeMat(K.haussB, { k: 0.85 });
  K.old = haussTex({ cols: 3, rows: 5, wall: '#d8cab0', rail: false, narrow: 1.5, litChance: 0.5 });
  K.oldMat = facadeMat(K.old, { k: 0.85 });
  K.shutG = shutterTex('#3a6a4a'); K.shutGMat = facadeMat(K.shutG, { k: 0.85 });
  K.shutB = shutterTex('#4a6a8a'); K.shutBMat = facadeMat(K.shutB, { k: 0.85 });
  K.colomb = colombTex(); K.colombMat = facadeMat(K.colomb, { k: 0.85 });
  const stoneTile = canvasTex(128, 128, (g, w, h) => {   // floodlit limestone ashlar for the monuments
    g.fillStyle = '#c8b898'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 16 - 16; x < w; x += 32) { const v = randi(-10, 10); g.fillStyle = `rgb(${230 + v},${218 + v},${192 + v})`; g.fillRect(x + 1, y + 1, 30, 14); }
  });
  K.ashlarMat = std({ map: stoneTile, vertexColors: true, roughness: 0.85, emissive: '#ffd8a8', emissiveMap: stoneTile, emissiveIntensity: 0.22 });
  K.ashlar = (b, x, y, z, w, h, d, col = 0xffffff, ry = 0) => b.addM(tiledBox(w, h, d, 4.0), K.ashlarMat, at(x, y + h / 2, z, ry), col);
  // shops and signs
  K.shopWinMat = basic({ map: shopWinTex(), color: hdr('#ffffff', 0.85) });
  const boards = boardAtlas();
  K.boardRects = boards.rects; K.boardMat = std({ map: boards.tex, roughness: 0.6, emissive: '#ffffff', emissiveMap: boards.tex, emissiveIntensity: 0.5 });
  const awn = awningTex();
  K.awnMat = std({ map: awn, roughness: 0.8, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: awn, emissiveIntensity: 0.22 });
  const val = valanceAtlas();
  K.valRects = val.rects; K.valMat = basic({ map: val.tex, alphaTest: 0.35, color: hdr('#ffffff', 0.95) });
  K.railMat = std({ map: railTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.45, metalness: 0.5 });
  K.guimardRailMat = std({ map: guimardRailTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.3 });
  K.fenceMat = std({ map: fenceTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.5 });
  K.guimardMat = basic({ map: textTex('METROPOLITAIN', { w: 512, h: 96, color: '#1e4a30', bg: '#e8b04a', font: SERIF, weight: 700, size: 0.58, border: '#1e4a30' }), color: hdr('#ffffff', 1.15), side: THREE.DoubleSide });
  const poster = posterTex();
  K.posterMat = std({ map: poster, roughness: 0.7, emissive: '#ffffff', emissiveMap: poster, emissiveIntensity: 0.55 });
  const ss = streetSignAtlas();
  K.signRects = ss.rects; K.signMat = basic({ map: ss.tex, color: hdr('#ffffff', 0.9), side: THREE.DoubleSide });
  K.paintMat = basic({ map: paintingTex(), color: hdr('#ffffff', 0.8), side: THREE.DoubleSide });
  K.stallMat = basic({ map: stallTex(), color: hdr('#ffffff', 0.75), side: THREE.DoubleSide });
  const neon = signAtlas([
    { text: 'CAFÉ', color: '#ff4a6a', border: true }, { text: 'BAR', color: '#7cf8ff' }, { text: 'HÔTEL', color: '#ffd23d', border: true }, { text: 'BRASSERIE', color: '#ff9a3d' },
    { text: 'CINÉMA', color: '#ff3df0', border: true }, { text: 'JAZZ CLUB', color: '#3d9bff' }, { text: 'CABARET', color: '#ff5fa2', border: true }, { text: 'BISTRO', color: '#39ff88' },
    { text: 'CRÊPES', color: '#ffe23d', border: true }, { text: 'VINS', color: '#b26bff' }, { text: 'PARIS', color: '#ff3b4a', border: true }, { text: 'HÔTEL ★★★', color: '#fff0c0' },
  ].map((e) => ({ ...e, font: SERIF, weight: 700 })), { cols: 2 });
  K.neonRects = neon.rects;
  K.neonMat = basic({ map: neon.tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hdr('#ffffff', 1.3) });
  K.neon = (b, x, y, z, side, w, i = randi(0, K.neonRects.length - 1)) => b.add(planeUV(K.neonRects[i]), K.neonMat, x, y, z, w, w / 4, 1, 0, -side * Math.PI / 2);
  K.cross = basic({ color: hdr('#22ff66', 3) });   // the pharmacies' green crosses, flashing
  K.seine = waterMat('#0b1830');
  K.seine.metalness = 0.6; K.seine.roughness = 0.28; K.seine.envMapIntensity = 0.4; K.seine.normalScale.set(0.32, 0.32);
  const tiles = new Map();   // planes whose UVs repeat a texture n times across (row v of an atlas of rows)
  K.tiled = (n, v = 0, rows = 1) => {
    const key = `${n}|${v}|${rows}`;
    if (!tiles.has(key)) tiles.set(key, planeUV({ u0: 0, u1: n, v0: 1 - (v + 1) / rows, v1: 1 - v / rows }));
    return tiles.get(key);
  };
  const face = (s) => -s * Math.PI / 2;   // rotation turning a plane to face the track from side s

  // ---------- Haussmann buildings ----------
  // the zinc mansard: a cornice, the steep slope with its dormers in line with the bays, chimney stacks with their
  // terracotta pots on the party walls
  K.mansard = (b, i, { dormers = true } = {}) => {
    const s = i.side, f = i.face, L = i.len, H = i.h;
    b.box(VC.solid, '#efe4cc', f - s * 0.32, H + 0.22, i.z, 0.64, 0.44, L);
    b.box(VC.solid, '#d8ccb0', f - s * 0.18, H - 0.14, i.z, 0.36, 0.28, L);
    b.add(G.box, VC.solid, f + s * 0.62, H + 1.95, i.z, 0.22, 3.4, L - 0.06, 0, 0, -s * 0.33, ZINC);
    b.block(VC.solid, '#4a5468', i.x + s * 1.2, H, i.z, i.d - 2.4, 3.5, L - 0.1);
    b.add(G.cone4, VC.solid, i.x + s * 1.2, H + 4.1, i.z, (i.d - 2.4) * 1.42, 1.3, (L - 0.1) * 1.42, 0, 0, 0, '#5e687e');
    b.box(VC.solid, '#7a849a', f + s * 1.18, H + 3.55, i.z, 0.16, 0.1, L - 0.1);
    if (dormers) for (let dz = -L / 2 + 1.5; dz < L / 2 - 1.0; dz += 2.6) {
      const z = i.z + dz;
      b.block(VC.solid, '#efe6d2', f + s * 0.72, H + 0.75, z, 0.9, 1.7, 1.15);
      b.box(VC.glow, hdr(pick(WARM), chance(0.55) ? 0.95 : 0.12), f + s * 0.26, H + 1.55, z, 0.04, 0.95, 0.62);
      b.add(G.cone4, VC.solid, f + s * 0.72, H + 2.68, z, 0.95, 0.42, 1.45, 0, 0, 0, '#5e687e');
    }
    for (const e of [-1, 1]) if (chance(0.75)) {   // a chimney stack along the party wall, its row of pots
      const ze = i.z + e * (L / 2 - 0.35), w = rand(2.2, 4), xc = i.x + s * rand(0, 2);
      b.block(VC.solid, pick(['#d8c8aa', '#c8a888', '#b89070']), xc, H + 2.6, ze, w, 2.3, 0.75);
      for (let k = 0, n = Math.floor(w / 0.42); k < n; k++) b.cyl(VC.solid, pick(['#c8683a', '#b85a32', '#d87a48']), xc - w / 2 + 0.25 + k * 0.42, H + 5.15, ze, 0.12, 0.5, 'cyl6');
    }
  };
  // a continuous balcony: the stone slab on its brackets and the wrought-iron railing
  K.balcony = (b, f, y, zc, s, L) => {
    b.box(VC.solid, '#efe4cc', f - s * 0.38, y, zc, 0.76, 0.16, L);
    b.add(K.tiled(Math.max(1, Math.round(L / 1.25))), K.railMat, f - s * 0.74, y + 0.55, zc, L, 1.0, 1, 0, face(s), 0);
  };
  // the carriage entrance (porte-cochère): a tall painted door with a lit fanlight
  K.porte = (b, f, z, s) => {
    b.box(VC.solid, '#e8dcc2', f - s * 0.12, 2.35, z, 0.24, 4.7, 3.0);
    b.box(VC.solid, pick(['#14223e', '#173a2a', '#121214', '#4a1420']), f - s * 0.25, 2.0, z, 0.08, 4.0, 2.4);
    b.box(VC.glow, hdr('#ffd9a0', 0.75), f - s * 0.27, 4.25, z, 0.05, 0.5, 2.1);
    b.box(VC.metal, '#c8a050', f - s * 0.3, 1.6, z, 0.04, 0.12, 0.12);
  };
  // the awning over a shopfront and its valance with the name
  K.awning = (b, f, zc, L, s, row, valIdx) => {
    const out = 2.3, drop = 0.75, y0 = 3.55, len = Math.hypot(out, drop), a = Math.atan2(drop, out);
    b.add(K.tiled(Math.max(1, Math.round(L / 1.4)), row, AWN), K.awnMat, f - s * out / 2, y0 - drop / 2, zc, L, len, 1, -(Math.PI / 2 - a), face(s), 0);
    b.box(VC.solid, AWN_COL[row], f - s * out, y0 - drop - 0.17, zc, 0.04, 0.36, L);
    if (valIdx !== undefined) b.add(planeUV(K.valRects[valIdx]), K.valMat, f - s * (out + 0.03), y0 - drop - 0.17, zc, Math.min(L * 0.8, 5), 0.36, 1, 0, face(s), 0);
  };
  // a rattan bistro chair facing the street, and the café's round marble tables
  K.chair = (b, x, z, s, col = pick(RATTAN)) => {
    b.box(VC.solid, col, x, 0.46, z, 0.42, 0.06, 0.42);
    b.box(VC.solid, col, x + s * 0.2, 0.75, z, 0.05, 0.55, 0.42);
    b.box(VC.metal, '#2a2a2e', x, 0.22, z, 0.36, 0.44, 0.04);
  };
  K.seated = (b, x, z, s, { coat = pick(COATS) } = {}) => {   // someone on a terrace chair at (x, z) watching the street (-s)
    const tr = pick(TROUSERS);
    b.box(VC.solid, tr, x - s * 0.2, 0.56, z, 0.46, 0.15, 0.3);
    b.box(VC.solid, tr, x - s * 0.42, 0.28, z, 0.14, 0.5, 0.28);
    b.box(VC.solid, coat, x + s * 0.02, 0.9, z, 0.27, 0.58, 0.42);
    b.sph(VC.solid, pick(SKIN), x, 1.34, z, 0.15, true);
    if (chance(0.25)) b.add(G.sphLow, VC.solid, x, 1.45, z, 0.34, 0.11, 0.34, 0, 0, 0.2, pick(['#141414', '#c8202c', '#1f2a44']));
    else b.sph(VC.solid, pick(['#141414', '#e8c878', '#6a4a2a', '#2a1a12', '#8a3a1a']), x + s * 0.02, 1.4, z, 0.16, true);
  };
  K.terrace = (b, f, zc, L, s) => {
    const n = Math.max(2, Math.floor((L - 0.6) / 1.3));
    for (let k = 0; k < n; k++) {
      const z = zc - (L - 0.6) / 2 + (k + 0.5) * (L - 0.6) / n;
      for (const row of [0, 1]) {
        const x = f - s * (1.25 + row * 1.25);
        b.cyl(VC.metal, '#2a2a2e', x, 0.37, z, 0.035, 0.72, 'cyl6');
        b.cyl(VC.solid, '#e0d8c8', x, 0.75, z, 0.3, 0.035, 'cyl8');
        if (chance(0.6)) b.cyl(VC.glow, hdr(pick(['#ffd28a', '#c8202c', '#f4e8c8']), 0.9), x + rand(-0.1, 0.1), 0.82, z + rand(-0.1, 0.1), 0.04, 0.1, 'cyl6');
        for (const dz of [-0.3, 0.3]) {
          K.chair(b, x + s * 0.5, z + dz, s);
          if (chance(0.45)) K.seated(b, x + s * 0.52, z + dz, s);
        }
      }
    }
    b.add(G.box, VC.solid, f - s * 0.6, 0.55, zc + (L / 2 - 0.4), 0.05, 0.8, 0.5, 0, 0, s * 0.2, '#1a1a1a');   // the chalkboard
    b.add(G.box, VC.glow, f - s * 0.62, 0.6, zc + (L / 2 - 0.4), 0.03, 0.5, 0.38, 0, 0, s * 0.2, hdr('#f4f0e0', 0.35));
  };
  K.waiter = (b, x, z, s) => {   // long white apron, black waistcoat, a tray of drinks held high
    b.add(G.cyl8, VC.solid, x, 0.47, z, 0.28, 0.94, 0.22, 0, 0, 0, '#141416');
    b.box(VC.solid, '#f6f4ee', x - s * 0.14, 0.7, z, 0.04, 0.9, 0.34);
    b.box(VC.solid, '#f6f4ee', x, 1.3, z, 0.42, 0.52, 0.26);
    b.box(VC.solid, '#141416', x - s * 0.02, 1.3, z, 0.4, 0.5, 0.24);
    b.sph(VC.solid, pick(SKIN), x, 1.74, z, 0.15, true); b.sph(VC.solid, '#1a1410', x, 1.8, z, 0.16, true);
    b.box(VC.solid, '#f6f4ee', x, 1.62, z + 0.28, 0.1, 0.36, 0.1);
    b.cyl(VC.metal, '#c8ccd4', x, 1.82, z + 0.32, 0.22, 0.02, 'cyl8');
    for (const dx of [-0.08, 0.08]) b.cyl(VC.glow, hdr('#ffd28a', 1.2), x + dx, 1.9, z + 0.32, 0.035, 0.14, 'cyl6');
  };

  // shopfronts: painted frames, the lit window, the gilt fascia and, for some, an awning and a terrace
  K.shop = (b, f, zc, L, s, kind = pickShop()) => {
    const k = KINDS[kind];
    b.box(VC.solid, pick(k.paint), f - s * 0.1, 2.2, zc, 0.2, 4.4, L);
    b.add(K.tiled(Math.max(1, Math.round(L / 3)), k.win, 11), K.shopWinMat, f - s * 0.22, 1.8, zc, L - 0.6, 2.8, 1, 0, face(s), 0);
    b.add(planeUV(K.boardRects[pick(k.boards)]), K.boardMat, f - s * 0.23, 3.82, zc, Math.min(L - 0.6, 6.4), 0.58, 1, 0, face(s), 0);
    const awn = Math.random() < k.awn;
    if (awn) K.awning(b, f, zc, L - 0.2, s, kind === 'cafe' || kind === 'tabac' || kind === 'creperie' ? pick([0, 3, 4, 5, 6, 1]) : randi(0, AWN - 1), k.val.length ? pick(k.val) : undefined);
    if (k.terrace && awn) K.terrace(b, f, zc, L - 0.4, s);
    if (k.terrace && chance(0.4)) K.waiter(b, f - s * 3.6, zc + rand(-L / 3, L / 3), s);
    if (k.cross) {   // the green cross on its bracket
      const zz = zc + pick([-1, 1]) * (L / 2 - 0.6);
      b.box(VC.metal, IRON, f - s * 0.45, 4.95, zz, 0.9, 0.06, 0.06);
      for (const [w, h] of [[0.14, 0.9], [0.9, 0.14]]) b.box(K.cross, 0xffffff, f - s * 0.95, 4.95, zz, w, h, 0.08);
    }
    if (k.carotte) {   // the tabac's red "carrot", a lozenge on a bracket
      const zz = zc + pick([-1, 1]) * (L / 2 - 0.5);
      b.box(VC.metal, IRON, f - s * 0.4, 5.2, zz, 0.8, 0.05, 0.05);
      b.add(G.cone4, VC.glow, f - s * 0.85, 5.35, zz, 0.5, 0.45, 0.5, 0, 0, 0, hdr('#ff2a1a', 2));
      b.add(G.cone4, VC.glow, f - s * 0.85, 4.9, zz, 0.5, 0.45, 0.5, Math.PI, 0, 0, hdr('#ff2a1a', 2));
    }
    if (k.buckets) for (let z = zc - L / 2 + 0.6; z < zc + L / 2 - 0.4; z += 0.55) {   // flowers in zinc buckets on the pavement
      const x = f - s * rand(0.6, 1.4);
      b.cyl(VC.metal, '#9aa0a8', x, 0.22, z, 0.2, 0.44, 'cyl6');
      const col = pick(['#e82a4a', '#ff8ab0', '#ffd23a', '#ffffff', '#b06ad8', '#ff6a2a']);
      for (let j = 0; j < 4; j++) b.sph(VC.solid, j ? col : '#3a7a32', x + rand(-0.12, 0.12), 0.55 + rand(0, 0.25), z + rand(-0.12, 0.12), 0.1, true);
    }
  };
  // a Haussmann front: the porte-cochère at one end, shops along the rest, balconies on the second and fifth floors
  K.haussFront = (b, i) => {
    const s = i.side, f = i.face, L = i.len, e = pick([-1, 1]);
    K.porte(b, f, i.z + e * (L / 2 - 1.8), s);
    const za = e > 0 ? i.z - L / 2 + 0.2 : i.z - L / 2 + 3.6, zb = e > 0 ? i.z + L / 2 - 3.6 : i.z + L / 2 - 0.2;
    const n = zb - za > 11 ? 2 : 1, sl = (zb - za) / n;
    for (let k = 0; k < n; k++) K.shop(b, f, za + sl * (k + 0.5), sl - 0.25, s);
    for (const y of [6.9, 16.8]) if (y + 1.5 < i.h) K.balcony(b, f, y, i.z, s, L - 0.3);
    if (chance(0.55)) for (let dz = -L / 2 + 1.6; dz < L / 2 - 1.2; dz += rand(2.2, 4)) K.geraniums(b, f - s * 0.5, 6.98, i.z + dz, 1.3, face(s));
    if (chance(0.12)) K.wisteria(b, f - s * 0.3, 7.0, i.z + e * (L / 2 - 1.8), 3.6, 3.0, face(s));
    if (chance(0.2)) K.tricolore(b, f - s * 0.2, 9.0, i.z + rand(-L / 3, L / 3), s);
    if (chance(0.3)) K.streetSign(b, f - s * 0.05, 4.9, i.z + e * (L / 2 - 0.9), s);
    if (chance(0.12)) K.neon(b, f - s * 0.04, 5.6, i.z - e * L / 4, s, 3.2);
  };
  K.haussType = { mat: K.haussMat, tex: K.hauss, colors: STONE, w: [14, 22], h: [19.8, 19.8], weight: 1, cellW: 2.6, cellH: 3.3,
    roof: (b, i) => K.mansard(b, i), front: (b, i) => K.haussFront(b, i) };
  K.haussRow = (b, side, z0, z1, { x0 = 12.2 } = {}) => buildingRow(b, side, [
    K.haussType,
    { ...K.haussType, mat: K.haussBMat, tex: K.haussB, h: [23.1, 23.1], weight: 0.4 },
    { ...K.haussType, mat: K.haussBMat, tex: K.haussB, h: [16.5, 16.5], weight: 0.35 },
  ], { x0, depth: [12, 16], gap: [0, 0.05], z0, z1, setback: [0, 0.05] });

  // ---------- street furniture ----------
  K.lamp = (b, x, z, double = false) => {   // the cast-iron lamp post: fluted base, slim shaft, glass lantern(s) under a crown
    b.cyl(VC.metal, IRON, x, 0.35, z, 0.17, 0.7, 'cyl8');
    b.cyl(VC.metal, IRON, x, 0.82, z, 0.11, 0.24, 'cyl8');
    b.cyl(VC.metal, IRON, x, 2.3, z, 0.06, 3.3, 'cyl8');
    if (double) b.box(VC.metal, IRON, x, 3.92, z, 0.07, 0.07, 1.5);
    for (const dz of double ? [-0.68, 0.68] : [0]) {
      const zz = z + dz;
      b.box(VC.glow, hdr('#ffd28a', 2.4), x, 4.2, zz, 0.3, 0.44, 0.3);
      b.add(G.cone4, VC.metal, x, 4.55, zz, 0.48, 0.26, 0.48, 0, 0, 0, IRON);
      b.cyl(VC.metal, IRON, x, 3.95, zz, 0.08, 0.08, 'cyl6');
      b.sph(VC.metal, IRON, x, 4.74, zz, 0.05, true);
    }
  };
  K.wallLamp = (b, x, y, z, s) => { b.box(VC.metal, IRON, x - s * 0.25, y + 0.3, z, 0.5, 0.05, 0.05); b.box(VC.glow, hdr('#ffcf8a', 2.2), x - s * 0.48, y, z, 0.22, 0.34, 0.22); b.add(G.cone4, VC.metal, x - s * 0.48, y + 0.25, z, 0.34, 0.16, 0.34, 0, 0, 0, IRON); };
  K.bollard = (b, x, z) => { b.cyl(VC.metal, '#3a2a22', x, 0.42, z, 0.06, 0.84, 'cyl6'); b.box(VC.metal, '#3a2a22', x, 0.86, z, 0.1, 0.06, 0.1); };
  K.grille = (b, x, z) => b.cyl(VC.metal, '#24282a', x, 0.02, z, 0.9, 0.03, 'cyl8');   // the cast-iron grille round a tree's foot
  K.morris = (b, x, z) => {   // the Morris column: the poster drum lit from inside, a fringed cornice and its little dome
    b.cyl(VC.solid, GREEN, x, 0.25, z, 0.74, 0.5, 'cyl');
    b.add(G.cyl, K.posterMat, x, 1.72, z, 1.3, 2.45, 1.3, 0, rand(0, 6), 0);
    b.cyl(VC.solid, GREEN, x, 3.02, z, 0.76, 0.16, 'cyl');
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; b.box(VC.solid, GREEN, x + Math.cos(a) * 0.74, 2.88, z + Math.sin(a) * 0.74, 0.12, 0.14, 0.12); }
    b.add(G.sph, VC.solid, x, 3.12, z, 1.36, 0.86, 1.36, 0, 0, 0, GREEN);
    b.sph(VC.metal, '#c8a050', x, 3.6, z, 0.09, true);
  };
  K.wallace = (b, x, z) => {   // a Wallace fountain: four caryatids holding up a dome over a thread of water
    b.cyl(VC.solid, GREEN, x, 0.32, z, 0.42, 0.64, 'cyl8');
    b.cyl(VC.solid, GREEN, x, 0.72, z, 0.3, 0.16, 'cyl8');
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4, cx = x + Math.cos(a) * 0.17, cz = z + Math.sin(a) * 0.17; b.cyl(VC.solid, GREEN, cx, 1.2, cz, 0.06, 0.8, 'cyl6'); b.sph(VC.solid, GREEN, cx, 1.65, cz, 0.07, true); }
    b.cyl(VC.glow, hdr('#bfe4ff', 0.6), x, 1.2, z, 0.025, 0.8, 'cyl6');
    b.add(G.sph, VC.solid, x, 1.92, z, 0.62, 0.46, 0.62, 0, 0, 0, GREEN);
    b.sph(VC.solid, GREEN, x, 2.2, z, 0.07, true);
  };
  K.kiosk = (b, x, z, s) => {   // a newsstand: a green booth under a domed roof, magazines pegged across its front
    b.block(VC.solid, GREEN, x, 0, z, 1.7, 2.3, 2.4);
    b.add(K.tiled(1, WIN.presse, 11), K.shopWinMat, x - s * 0.86, 1.35, z, 2.1, 1.3, 1, 0, face(s), 0);
    b.box(VC.solid, GREEN, x, 2.36, z, 2.1, 0.12, 2.8);
    b.add(G.sph, VC.solid, x, 2.42, z, 2.0, 0.9, 2.6, 0, 0, 0, GREEN);
    b.sph(VC.metal, '#c8a050', x, 2.92, z, 0.08, true);
    b.add(planeUV(K.boardRects[8]), K.boardMat, x - s * 0.87, 2.15, z, 1.8, 0.28, 1, 0, face(s), 0);
  };
  // a Guimard entrance: stairs going down behind green railings, two lamp stems arching over the opening with their
  // orange "eyes", the METROPOLITAIN sign held between them, facing the approaching runner
  K.metro = (b, x, z) => {
    const W = 1.9, L = 4.6, zf = z + L / 2;
    b.box(VC.solid, '#08080a', x, 0.012, z, W, 0.02, L);
    for (const sx of [-1, 1]) b.add(K.tiled(4), K.guimardRailMat, x + sx * W / 2, 0.5, z, L, 1.0, 1, 0, Math.PI / 2, 0);
    b.add(K.tiled(2), K.guimardRailMat, x, 0.5, z - L / 2, W, 1.0, 1);
    for (const sx of [-1, 1]) {
      const px = x + sx * W / 2, P = [[px, 0, zf], [px, 1.7, zf], [px - sx * 0.04, 2.45, zf], [px - sx * 0.18, 2.95, zf], [px - sx * 0.36, 3.12, zf]];
      for (let k = 0; k < P.length - 1; k++) beam(b, VC.metal, ...P[k], ...P[k + 1], 0.08, '#2f5a3e');
      b.add(G.sph, VC.glow, px - sx * 0.42, 2.92, zf, 0.2, 0.32, 0.2, 0, 0, 0, hdr('#ff7a2a', 2.8));
    }
    b.add(G.plane, K.guimardMat, x, 2.62, zf + 0.02, W + 0.1, 0.34, 1);
    b.box(VC.metal, '#2f5a3e', x, 2.62, zf - 0.01, W + 0.3, 0.44, 0.03);
  };
  K.bench = (b, x, z, s) => {   // a Davioud bench: green iron ends, wooden slats, the back toward the buildings
    for (const dz of [-0.7, 0.7]) b.box(VC.metal, GREEN, x, 0.25, z + dz, 0.6, 0.5, 0.08);
    b.box(VC.solid, '#5a3a24', x, 0.47, z, 0.55, 0.05, 1.6);
    b.add(G.box, VC.solid, x + s * 0.3, 0.8, z, 0.05, 0.5, 1.6, 0, 0, -s * 0.15, '#5a3a24');
  };
  K.velib = (b, x, z, s, n = 6) => {   // a Vélib' station: grey-green and blue bikes nosed into their docks, baskets toward the street
    b.box(VC.metal, '#5a6068', x + s * 0.95, 0.06, z, 0.12, 0.12, n * 0.75);
    for (let k = 0; k < n; k++) {
      if (chance(0.15)) continue;
      const zz = z + (k - (n - 1) / 2) * 0.75, col = chance(0.3) ? '#2a7ab8' : '#7aa058';
      for (const dx of [-0.5, 0.5]) b.cyl(VC.solid, '#1a1a1e', x + dx, 0.34, zz, 0.32, 0.05, 'cyl8', Math.PI / 2, 0);
      beam(b, VC.solid, x - 0.5, 0.34, zz, x + 0.05, 0.82, zz, 0.06, col);
      beam(b, VC.solid, x + 0.05, 0.82, zz, x + 0.5, 0.34, zz, 0.06, col);
      b.box(VC.solid, '#2a2a30', x + 0.32, 0.92, zz, 0.24, 0.05, 0.12);
      b.box(VC.solid, '#3a3e44', x - s * 0.62, 0.95, zz, 0.3, 0.22, 0.34);
      b.box(VC.metal, '#5a6068', x + s * 0.95, 0.5, zz, 0.12, 0.9, 0.14);
    }
  };
  K.scooter = (b, x, z) => {   // a Vespa parked along the kerb
    const col = pick(['#e8e0c8', '#c8202c', '#7ab8a8', '#1a1a1e', '#f4c8a0', '#9ac0d8']);
    b.add(G.sph, VC.solid, x, 0.55, z - 0.2, 0.62, 0.55, 1.1, 0, 0, 0, col);
    b.box(VC.solid, col, x, 0.85, z + 0.48, 0.5, 0.75, 0.08);
    b.box(VC.solid, '#2a2420', x, 0.86, z - 0.25, 0.3, 0.1, 0.6);
    for (const dz of [-0.55, 0.55]) b.cyl(VC.solid, '#141414', x, 0.22, z + dz, 0.2, 0.1, 'cyl8', 0, Math.PI / 2);
    b.sph(VC.glow, hdr('#fff4d6', 2), x, 1.08, z + 0.54, 0.07, true);
  };
  K.car = (b, x, z, kind = pick(['2cv', '2cv', 'taxi', 'car'])) => {   // parked along the kerb, nose toward the runner
    if (kind === '2cv') {   // the Citroën 2CV: a round little body, its canvas roof, often two-tone
      const [c1, c2] = pick([['#9ac0d8', '#9ac0d8'], ['#c8202c', '#141414'], ['#e8dcc0', '#e8dcc0'], ['#8ab88a', '#8ab88a'], ['#f2c230', '#141414'], ['#7a2a3a', '#141414']]);
      b.add(G.sph, VC.solid, x, 0.86, z, 1.5, 1.25, 3.8, 0, 0, 0, c1);
      b.box(VC.solid, c2, x, 0.6, z, 1.52, 0.46, 3.5);
      b.add(G.sph, VC.solid, x, 1.28, z - 0.2, 1.24, 0.66, 1.9, 0, 0, 0, '#2a2a30');
      for (const dx of [-0.48, 0.48]) b.add(G.sph, VC.glow, x + dx, 0.84, z + 1.72, 0.24, 0.24, 0.1, 0, 0, 0, hdr('#fff4d6', 2));
    } else {
      const col = kind === 'taxi' ? pick(['#141416', '#2a2a30', '#e8e8ec']) : pick(['#e8e8ec', '#8a8a92', '#1a2a4a', '#5a1420', '#2a4a3a', '#c8c0b0']);
      b.block(VC.solid, col, x, 0.3, z, 1.7, 0.72, 4.0);
      b.block(VC.solid, col, x, 1.02, z - 0.25, 1.5, 0.55, 2.2);
      b.box(VC.glow, hdr('#e8f0ff', 0.35), x, 1.3, z - 0.25, 1.52, 0.36, 2.0);
      for (const dx of [-0.6, 0.6]) b.box(VC.glow, hdr('#fff4d6', 2), x + dx, 0.75, z + 2.01, 0.34, 0.12, 0.04);
      if (kind === 'taxi') { b.box(VC.solid, '#1a1a1e', x, 1.62, z - 0.2, 0.6, 0.06, 0.3); b.box(VC.glow, hdr('#7cf8a0', 2.2), x, 1.72, z - 0.2, 0.5, 0.14, 0.22); }
    }
    for (const dz of [-1.25, 1.25]) for (const dx of [-0.74, 0.74]) b.cyl(VC.solid, '#141414', x + dx, 0.32, z + dz, 0.32, 0.18, 'cyl8', 0, Math.PI / 2);
  };
  const flag = canvasTex(96, 64, (g) => { g.fillStyle = '#1e3a8a'; g.fillRect(0, 0, 32, 64); g.fillStyle = '#f4f4f0'; g.fillRect(32, 0, 32, 64); g.fillStyle = '#d8202a'; g.fillRect(64, 0, 32, 64); }, { repeat: false });
  K.flagMat = std({ map: flag, roughness: 0.7, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: flag, emissiveIntensity: 0.3 });
  K.tricolore = (b, x, y, z, s, w = 1.6) => {   // the tricolour on a short pole out from a facade, seen along the street
    b.box(VC.metal, '#c8c8cc', x - s * 0.9, y, z, 1.9, 0.05, 0.05);
    b.sph(VC.metal, '#d9b44a', x - s * 1.86, y, z, 0.06, true);
    b.add(G.plane, K.flagMat, x - s * 1.0, y - w * 0.34, z, w, w * 0.66, 1);
  };
  K.streetSign = (b, x, y, z, s, i = randi(0, STREETS.length - 1)) => b.add(planeUV(K.signRects[i]), K.signMat, x, y, z, 1.6, 0.6, 1, 0, face(s), 0);
  K.festoon = (b, z, y = 7.4, sag = 0.7, w = 9.8) => {   // a guinguette's string of bulbs across the street
    wire(b, -w, y, z, w, y, z, sag, { color: '#1a1a1e', t: 0.03, n: 10 });
    for (let k = 1; k < 16; k++) { const t = k / 16; b.sph(VC.glow, hdr(pick(['#ffd28a', '#fff0c0', '#ffb860', '#ff8a6a']), 2.6), -w + 2 * w * t, y - sag * 4 * t * (1 - t) - 0.12, z, 0.11, true); }
  };

  // ---------- people ----------
  K.person = (b, x, z, { s = rand(0.92, 1.06), y = 0, coat = pick(COATS), hat = pick([null, null, null, 'beret', 'beret', 'hat']), scarf = chance(0.5) ? pick(SCARF) : null, bag = chance(0.35), baguette = chance(0.12) } = {}) => {
    b.add(G.cyl8, VC.solid, x, y + 0.48 * s, z, 0.28 * s, 0.96 * s, 0.22 * s, 0, 0, 0, pick(TROUSERS));
    b.add(G.cyl8, VC.solid, x, y + 1.02 * s, z, 0.44 * s, 0.52 * s, 0.3 * s, 0, 0, 0, coat);
    b.box(VC.solid, coat, x, y + 1.32 * s, z, 0.44 * s, 0.5 * s, 0.27 * s);
    if (scarf) b.box(VC.solid, scarf, x, y + 1.6 * s, z, 0.32 * s, 0.1 * s, 0.29 * s);
    b.sph(VC.solid, pick(SKIN), x, y + 1.76 * s, z, 0.15 * s, true);
    if (hat === 'beret') b.add(G.sphLow, VC.solid, x + 0.02, y + 1.89 * s, z, 0.36 * s, 0.11 * s, 0.36 * s, 0, 0, 0.25, pick(['#141414', '#c8202c', '#1f2a44', '#3a2a3a']));
    else if (hat === 'hat') { b.cyl(VC.solid, '#2a2420', x, y + 1.88 * s, z, 0.2 * s, 0.03 * s, 'cyl8'); b.cyl(VC.solid, '#2a2420', x, y + 1.97 * s, z, 0.13 * s, 0.16 * s, 'cyl8'); }
    else b.sph(VC.solid, pick(['#141414', '#e8c878', '#6a4a2a', '#2a1a12', '#8a3a1a', '#c8c0b8']), x, y + 1.82 * s, z + 0.02, 0.16 * s, true);
    if (bag) b.box(VC.solid, pick(['#141414', '#c8a070', '#8a2a1a', '#f4f0e8', '#2a3a5a']), x + 0.27 * s, y + 0.95 * s, z, 0.1, 0.34, 0.3);
    if (baguette) b.add(G.cyl6, VC.solid, x - 0.25 * s, y + 1.25 * s, z, 0.07, 0.75, 0.07, 0.25, 0, 0.6, '#d8a050');
  };
  K.crowd = (b, x0, x1, z0, z1, n, opts = {}) => { for (let i = 0; i < n; i++) K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1), opts); };
  K.mime = (b, x, z, s) => {   // a mime: striped top, black beret, white face and gloves pressed against an invisible wall
    b.add(G.cyl8, VC.solid, x, 0.48, z, 0.26, 0.96, 0.2, 0, 0, 0, '#141416');
    for (let k = 0; k < 6; k++) b.box(VC.solid, k % 2 ? '#141416' : '#f4f2ee', x, 1.06 + k * 0.09, z, 0.42, 0.09, 0.25);
    for (const dz of [-0.12, 0.12]) b.box(VC.solid, '#c8202c', x - s * 0.13, 1.3, z + dz, 0.02, 0.56, 0.04);
    for (const dz of [-0.19, 0.19]) { b.add(G.box, VC.solid, x - s * 0.18, 1.6, z + dz, 0.1, 0.5, 0.1, 0, 0, s * 0.55, '#f4f2ee'); b.sph(VC.solid, '#ffffff', x - s * 0.34, 1.84, z + dz, 0.08, true); }
    b.sph(VC.solid, '#f8f8f4', x, 1.74, z, 0.15, true);
    b.add(G.sphLow, VC.solid, x + 0.03, 1.87, z, 0.36, 0.11, 0.36, 0, 0, 0.3, '#141414');
    b.box(VC.solid, '#c8202c', x - s * 0.14, 1.68, z, 0.02, 0.025, 0.07);
  };
  K.accordionist = (b, x, z, s) => {   // a busker in a beret squeezing a red accordion, his hat upturned for coins
    K.person(b, x, z, { s: 1, hat: 'beret', coat: '#2a2a30', scarf: '#c8202c', bag: false, baguette: false });
    b.box(VC.solid, '#b81e2a', x - s * 0.27, 1.22, z, 0.3, 0.44, 0.5);
    b.box(VC.solid, '#f4f2ec', x - s * 0.27, 1.22, z - 0.26, 0.24, 0.4, 0.03);
    for (let k = 0; k < 4; k++) b.box(VC.solid, '#5a0a14', x - s * 0.43, 1.22, z - 0.16 + k * 0.1, 0.02, 0.42, 0.02);
    b.cyl(VC.solid, '#2a2420', x - s * 0.85, 0.05, z + 0.35, 0.18, 0.1, 'cyl8');
    for (let k = 0; k < 4; k++) b.sph(VC.metal, '#e8c060', x - s * (0.85 + rand(-0.08, 0.08)), 0.1, z + 0.35 + rand(-0.08, 0.08), 0.03, true);
  };
  const PR = [0, 1, 2, 3].map((k) => ({ u0: k / 4, u1: (k + 1) / 4, v0: 0, v1: 1 }));
  K.painting = (b, x, y, z, w, ry, k = randi(0, 3)) => b.add(planeUV(PR[k]), K.paintMat, x, y, z, w, w, 1, 0, ry, 0);
  K.painter = (b, x, z, s) => {   // a painter at the easel in a beret and smock, the canvas turned toward the street
    K.person(b, x, z, { hat: 'beret', coat: pick(['#e8e0d0', '#c8d8e8', '#f4f0e8', '#d8c8a8']), bag: false, baguette: false });
    const ex = x - s * 0.55, ez = z + 0.55, ry = face(s) + s * 0.7;
    for (const [dx, dz] of [[-0.25, 0.15], [0.25, 0.15], [0, -0.25]]) beam(b, VC.solid, ex + dx, 0, ez + dz, ex, 1.7, ez, 0.035, '#8a6a4a');
    K.painting(b, ex - s * 0.04, 1.3, ez + 0.06, 0.72, ry);
    b.box(VC.solid, '#c8a070', x - s * 0.24, 1.1, z - 0.2, 0.04, 0.22, 0.32);
  };

  // ---------- Montmartre and the Marais ----------
  K.montFront = (b, i) => {
    const s = i.side, f = i.face, L = i.len, r = Math.random();
    if (r < 0.42) K.shop(b, f, i.z, L - 0.4, s, pick(['cafe', 'cafe', 'creperie', 'boutique', 'cave', 'boulangerie', 'fromagerie']));
    else if (r < 0.62) {   // an artist's gallery, canvases in the window
      b.box(VC.solid, pick(['#173a2a', '#4a1420', '#14223e']), f - s * 0.1, 1.7, i.z, 0.2, 3.4, L - 0.6);
      b.box(VC.glow, hdr('#fff0d8', 0.6), f - s * 0.21, 1.6, i.z, 0.02, 2.4, L - 1.4);
      for (let dz = -L / 2 + 1.4; dz < L / 2 - 1; dz += 1.3) K.painting(b, f - s * 0.24, 1.7, i.z + dz, 0.9, face(s));
    } else {   // a front door between potted plants, wisteria climbing over it
      b.box(VC.solid, pick(['#14223e', '#173a2a', '#6a1420', '#2a2018']), f - s * 0.06, 1.15, i.z, 0.1, 2.3, 1.1);
      b.box(VC.glow, hdr('#ffd9a0', 0.7), f - s * 0.08, 2.5, i.z, 0.05, 0.3, 0.9);
      for (const dz of [-0.9, 0.9]) { b.cyl(VC.solid, '#a85a3a', f - s * 0.35, 0.22, i.z + dz, 0.2, 0.44, 'cyl8'); b.sph(VC.solid, '#3a7a32', f - s * 0.35, 0.62, i.z + dz, 0.26, true); }
      if (chance(0.55)) K.wisteria(b, f - s * 0.25, 4.4, i.z, 3.0, 3.6, face(s));
    }
    for (let dz = -L / 2 + 1.2; dz < L / 2 - 0.8; dz += 2.4) if (chance(0.45)) K.geraniums(b, f - s * 0.18, 3.42, i.z + dz, 1.0, face(s), '#7a3a24');
    K.wallLamp(b, f, 3.0, i.z + L / 2 - 0.6, s);
  };
  const montType = (mat, tex) => ({ mat, tex, colors: PASTEL, w: [6, 10], h: [7.5, 12.5], weight: 1, cellW: 2.4, cellH: 3.0,
    roof: (b, i) => {
      b.add(G.cone4, VC.solid, i.x, i.h + 1.0, i.z, i.d * 1.3, 2.0, i.len * 1.42, 0, 0, 0, chance(0.5) ? '#a8583a' : ZINC);
      b.box(VC.solid, '#f0ece4', i.face - i.side * 0.15, i.h + 0.12, i.z, 0.3, 0.24, i.len);
      if (chance(0.7)) { const xc = i.x + rand(-1, 1), zc = i.z + rand(-i.len / 3, i.len / 3); b.block(VC.solid, '#d8c8b0', xc, i.h, zc, 0.8, 2.2, 0.8); for (let k = 0; k < 2; k++) b.cyl(VC.solid, '#c8683a', xc, i.h + 2.4, zc - 0.18 + k * 0.36, 0.11, 0.45, 'cyl6'); }
    },
    front: (b, i) => K.montFront(b, i) });
  K.montRow = (b, side, z0, z1) => buildingRow(b, side, [montType(K.shutGMat, K.shutG), montType(K.shutBMat, K.shutB)], { x0: 10.4, depth: [8, 12], gap: [0, 0.2], z0, z1, setback: [0, 0.5] });
  K.maraisFront = (b, i) => {
    const s = i.side, f = i.face, L = i.len, n = L > 9 ? 2 : 1, sl = (L - 0.4) / n;
    for (let k = 0; k < n; k++) K.shop(b, f, i.z - (L - 0.4) / 2 + sl * (k + 0.5), sl - 0.2, s, pick(['patisserie', 'chocolatier', 'fromagerie', 'librairie', 'boutique', 'cafe', 'cave', 'boulangerie']));
    if (chance(0.45)) {   // a painted sign hanging out over the pavement from a wrought-iron bracket
      const zz = i.z + rand(-L / 3, L / 3), rect = planeUV(pick(K.boardRects));
      b.box(VC.metal, IRON, f - s * 0.55, 4.95, zz, 1.1, 0.05, 0.05);
      for (const dx of [-0.3, 0.3]) b.box(VC.metal, IRON, f - s * (0.95 + dx), 4.89, zz, 0.02, 0.12, 0.02);
      b.add(rect, K.boardMat, f - s * 0.95, 4.58, zz + 0.015, 0.8, 0.5, 1);
      b.add(rect, K.boardMat, f - s * 0.95, 4.58, zz - 0.015, 0.8, 0.5, 1, 0, Math.PI, 0);
    }
    for (let dz = -L / 2 + 1.2; dz < L / 2 - 0.8; dz += 2.4) if (chance(0.35)) K.geraniums(b, f - s * 0.18, 3.68, i.z + dz, 1.0, face(s));
    if (chance(0.5)) K.wallLamp(b, f, 4.6, i.z + pick([-1, 1]) * (L / 2 - 0.5), s);
  };
  K.maraisTypes = [
    { mat: K.oldMat, tex: K.old, colors: ['#ffffff', '#f4ead8', '#ece2cc', '#e8dcc4'], w: [8, 14], h: [13.2, 16.5], weight: 1, cellW: 2.5, cellH: 3.3,
      roof: (b, i) => K.mansard(b, i), front: (b, i) => K.maraisFront(b, i) },
    { mat: K.colombMat, tex: K.colomb, colors: ['#ffffff', '#f8eedc'], w: [6, 9], h: [12, 12], weight: 0.35, cellW: 2.2, cellH: 3.0,
      roof: (b, i) => b.add(G.cone4, VC.solid, i.x, i.h + 1.4, i.z, i.d * 1.3, 2.8, i.len * 1.42, 0, 0, 0, '#6a5a50'), front: (b, i) => K.maraisFront(b, i) },
  ];
  K.maraisRow = (b, side, z0, z1) => buildingRow(b, side, K.maraisTypes, { x0: 10.2, depth: [10, 14], gap: [0, 0.1], z0, z1, setback: [0, 0.2] });

  // ---------- the Seine ----------
  const reflMats = new Map();
  K.refl = (b, x, z, len, w, col, y = WY + 0.05) => {   // a light's reflection on the river, pointing at the approaching runner
    let m = reflMats.get(col);
    if (!m) reflMats.set(col, (m = basic({ color: hdr(col, 0.3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
    const dx = -x, dz = 40, d = Math.hypot(dx, dz), L = Math.min(len, ((Math.abs(x) - 13) * d) / Math.abs(dx));
    if (L > 2) b.add(G.plane, m, x + (dx / d) * L / 2, y, z + (dz / d) * L / 2, w, L, 1, -Math.PI / 2, Math.atan2(-dx, -dz), 0);
  };
  K.bouquiniste = (b, x, z, s) => {   // a green box on the parapet, its lid propped open over prints and second-hand books
    b.box(VC.solid, GREEN, x, 1.48, z, 0.66, 0.62, 2.0);
    b.add(G.plane, K.stallMat, x - s * 0.34, 1.48, z, 1.9, 0.56, 1, 0, face(s), 0);
    b.add(G.box, VC.solid, x + s * 0.27, 2.2, z, 0.06, 0.95, 2.0, 0, 0, -s * 0.35, GREEN);
    b.add(G.plane, K.stallMat, x + s * 0.22, 2.2, z, 1.9, 0.86, 1, -0.35, face(s), 0);
  };
  // the quay: the parapet with the bouquinistes' boxes, the wall down to the cobbled lower quay, the river
  K.quay = (b, s, z0 = 0, z1 = 80, { stalls = true } = {}) => {
    const L = z1 - z0, zc = -(z0 + z1) / 2, px = s * (EDGE + 7.4);
    b.box(VC.solid, '#b4a890', px, 0.55, zc, 0.6, 1.1, L);
    b.box(VC.solid, '#d8cdb6', px, 1.14, zc, 0.8, 0.1, L);
    b.box(VC.solid, '#8e836e', s * (EDGE + 7.6), -2.2, zc, 1.2, 4.4, L);
    b.box(VC.solid, '#5e5a52', s * (EDGE + 10.8), -4.5, zc, 5.2, 0.2, L);
    b.box(VC.solid, '#7e7462', s * (EDGE + 13.3), -4.85, zc, 0.3, 0.9, L);
    b.add(G.plane, K.seine, s * (EDGE + 13.3 + 70), WY, zc, 140, L, 1, -Math.PI / 2, 0, 0);
    if (stalls) for (let z = z0 + rand(2, 5); z < z1 - 2.5; z += rand(2.3, 3.6)) if (chance(0.8)) K.bouquiniste(b, px, -z, s);
    for (let z = z0 + rand(5, 10); z < z1 - 3; z += rand(12, 18)) {   // lamps on the lower quay, doubled in the water
      const x = s * (EDGE + 9.2);
      b.cyl(VC.metal, IRON, x, -2.9, -z, 0.06, 3.2, 'cyl8'); b.box(VC.glow, hdr('#ffd28a', 2.4), x, -1.1, -z, 0.3, 0.42, 0.3);
      K.refl(b, s * (EDGE + 13.5), -z, 30, 1.0, '#ffd28a');
    }
    for (let k = randi(1, 4); k > 0; k--) {   // couples sitting on the edge of the lower quay, legs over the water
      const z = -rand(z0 + 4, z1 - 4);
      for (const dz of [-0.25, 0.25]) {
        b.box(VC.solid, pick(COATS), s * (EDGE + 12.95), -4.05, z + dz, 0.3, 0.6, 0.4);
        b.sph(VC.solid, pick(SKIN), s * (EDGE + 12.95), -3.6, z + dz, 0.14, true);
        b.box(VC.solid, pick(TROUSERS), s * (EDGE + 13.4), -4.5, z + dz, 0.5, 0.14, 0.26);
      }
    }
  };
  K.bateau = (b, x, z, kind = pick(['mouche', 'mouche', 'peniche']), y = WY) => {
    if (kind === 'mouche') {   // a bateau-mouche: long and low, its glazed saloon glowing, people on the open deck
      b.block(VC.solid, '#e8eaee', x, y - 0.5, z, 5.4, 1.4, 32);
      b.block(VC.solid, '#1c2a4a', x, y - 0.5, z, 5.46, 0.5, 32.1);
      b.block(VC.solid, '#e8eaee', x, y + 0.9, z + 2, 5.0, 1.2, 22);
      b.box(VC.glow, hdr('#ffe2b8', 1.05), x, y + 1.5, z + 2, 5.06, 0.75, 21);
      b.box(VC.solid, '#c8d0dc', x, y + 2.2, z + 2, 5.1, 0.14, 22.4);
      for (let k = 0; k < 12; k++) K.person(b, x + rand(-2, 2), z - 12 + rand(-3, 3), { y: y + 0.9, s: 0.95, bag: false, baguette: false });
      for (let k = 0; k <= 22; k++) b.sph(VC.glow, hdr('#fff0c8', 2.4), x + (k % 2 ? 2.6 : -2.6), y + 2.38, z - 9 + k, 0.08, true);
      b.sph(VC.glow, hdr('#ff2a2a', 3), x - 2.7, y + 1.0, z + 15.5, 0.14, true); b.sph(VC.glow, hdr('#39ff88', 3), x + 2.7, y + 1.0, z + 15.5, 0.14, true);
    } else {   // a péniche moored as a houseboat: the long black hull, the wheelhouse aft, flowerpots and warm portholes
      b.block(VC.solid, '#141416', x, y - 0.5, z, 5.0, 1.6, 34);
      b.box(VC.solid, '#7a1a1a', x, y + 1.14, z, 5.02, 0.12, 34.02);
      b.block(VC.solid, '#3a3a40', x, y + 1.1, z + 2, 4.2, 0.6, 24);
      b.block(VC.solid, '#e8e2d6', x, y + 1.1, z - 13, 3.4, 2.2, 4);
      b.box(VC.glow, hdr('#ffd28a', 1.0), x, y + 2.4, z - 13, 3.44, 0.7, 3);
      for (let k = 0; k < 9; k++) b.cyl(VC.glow, hdr('#ffcf8a', 1.4), x + 2.51 * (k % 2 ? 1 : -1), y + 0.4, z - 10 + k * 2.5, 0.16, 0.04, 'cyl8', 0, Math.PI / 2);
      for (let k = 0; k < 8; k++) { const px = x + rand(-1.6, 1.6), pz = z + rand(-6, 12); b.cyl(VC.solid, '#a85a3a', px, y + 1.85, pz, 0.18, 0.3, 'cyl6'); b.sph(VC.solid, pick(['#e82a4a', '#3a7a32', '#ffd23a', '#ff8ab0']), px, y + 2.15, pz, 0.22, true); }
    }
    K.refl(b, x, z, 40, 2.6, '#ffe2b8');
  };
  // a stone bridge striding across the river from this quay, its arches facing the runner, lamps along its parapets
  const bridgeGeos = new Map();
  const bridgeGeo = (n, span) => {
    const key = `${n}|${span}`;
    if (bridgeGeos.has(key)) return bridgeGeos.get(key);
    const pier = 3.4, w = (span - pier * (n + 1)) / n, top = 1.2, bot = WY - 1.5, sp = WY + 0.6;
    const sh = new THREE.Shape(); sh.moveTo(0, bot); sh.lineTo(span, bot); sh.lineTo(span, top); sh.lineTo(0, top); sh.closePath();
    for (let k = 0; k < n; k++) {
      const x0 = pier + k * (w + pier), x1 = x0 + w, h = new THREE.Path();
      h.moveTo(x0, bot + 0.4); h.lineTo(x0, sp); h.absellipse((x0 + x1) / 2, sp, w / 2, Math.min(4.4, top - sp - 0.9), Math.PI, 0, true); h.lineTo(x1, bot + 0.4); h.closePath();
      sh.holes.push(h);
    }
    const g = new THREE.ExtrudeGeometry(sh, { depth: 14, bevelEnabled: false, curveSegments: 10 });
    g.translate(0, 0, -7);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.4, uv.getY(i) / 2.4);
    bridgeGeos.set(key, g);
    return g;
  };
  K.bridge = (b, s, z, n = pick([4, 5]), span = 96) => {
    const x0 = s * (EDGE + 7.9);
    b.addM(bridgeGeo(n, span), K.ashlarMat, at(x0, 0, z, s < 0 ? Math.PI : 0), '#e8dcc4');
    for (const e of [-1, 1]) b.box(VC.solid, '#d8ccb4', x0 + s * span / 2, 1.7, z + e * 6.7, span, 1.0, 0.6);
    for (let k = 1; k * 12 < span; k++) for (const e of [-1, 1]) {
      const lx = x0 + s * k * 12;
      b.cyl(VC.metal, IRON, lx, 3.2, z + e * 6.7, 0.07, 2.6, 'cyl8');
      b.box(VC.glow, hdr('#ffd28a', 2.4), lx, 4.65, z + e * 6.7, 0.3, 0.4, 0.3);
      if (e > 0) K.refl(b, lx, z + 7.5, 40, 0.8, '#ffd28a');
    }
  };

  // ---------- the formal gardens ----------
  K.statue = (b, x, z) => {   // a white marble figure on its plinth, one arm raised
    b.block(VC.solid, '#d8d0c0', x, 0, z, 1.1, 1.6, 1.1);
    b.add(G.cyl8, VC.solid, x, 2.25, z, 0.5, 1.3, 0.4, 0, 0, 0, '#f0ece4');
    b.box(VC.solid, '#f0ece4', x, 3.0, z, 0.5, 0.45, 0.3);
    b.sph(VC.solid, '#f4f0e8', x, 3.38, z, 0.17, true);
    b.add(G.box, VC.solid, x + 0.25, 3.1, z, 0.12, 0.55, 0.12, 0, 0, 0.7, '#f0ece4');
  };
  K.garden = (b, s, z0 = 0, z1 = 80) => {
    const L = z1 - z0, zc = -(z0 + z1) / 2;
    b.box(VC.solid, '#b8ac8c', s * (EDGE + 46), -0.08, zc, 78, 0.2, L);
    b.add(K.tiled(Math.round(L / 1.5)), K.fenceMat, s * (EDGE + 6.6), 1.1, zc, L, 2.2, 1, 0, Math.PI / 2, 0);
    for (let z = z0 + 8; z < z1; z += 16) { K.ashlar(b, s * (EDGE + 6.6), 0, -z, 0.7, 2.6, 0.7, '#f0e6d2'); b.sph(VC.solid, '#e8dcc4', s * (EDGE + 6.6), 2.85, -z, 0.3, true); }
    for (let z = z0 + 2.5; z < z1 - 1; z += 5) for (const x of [EDGE + 11, EDGE + 19]) K.pleached(b, s * x, -z, { w: 3.6, d: 4.4, h: 3.0, trunk: 2.9 });
    const px0 = EDGE + 25, px1 = EDGE + 45, pc = (px0 + px1) / 2;
    for (let z = z0 + 4; z < z1 - 12; z += 20) {   // parterres: lawns inside low box hedges, yew cones at the corners
      const zz = -(z + 7);
      b.box(VC.solid, '#2e5a2a', s * pc, 0.03, zz, px1 - px0, 0.06, 12);
      for (const e of [-1, 1]) K.hedge(b, s * pc, zz + e * 6, px1 - px0, 0.55, 0.5);
      for (const xx of [px0, px1]) K.hedge(b, s * xx, zz, 0.5, 0.55, 12);
      for (const xx of [px0, px1]) for (const e of [-1, 1]) K.topiary(b, s * xx, zz + e * 6, 'cone', 1.0);
      if (chance(0.5)) K.statue(b, s * pc, zz); else K.topiary(b, s * pc, zz, 'ball', 1.4);
    }
    for (let z = z0 + 6; z < z1 - 2; z += 9) K.orange(b, s * (EDGE + 22.5), -z, 1.0);
    for (let k = randi(6, 10); k > 0; k--) K.chair(b, s * rand(EDGE + 13, EDGE + 21.5), -rand(z0 + 2, z1 - 2), pick([-1, 1]), '#3a6a4a');
    for (let z = z0 + 14; z < z1; z += 28) K.statue(b, s * (EDGE + 15), -z);
    K.crowd(b, s * (EDGE + 8), s * (EDGE + 21), z0 + 2, z1 - 2, randi(4, 8));
  };

  K.update = (t) => {
    K.seine.userData.scroll.offset.y = -t * 0.02;
    K.cross.color.set('#22ff66').multiplyScalar(Math.sin(t * 3.1) > -0.3 ? 3 : 0.35);
  };
  return K;
}

// ---------- the Eiffel Tower ----------
// Real proportions in metres: the outer half-width up the tower (a smooth curve through these points) and the width of
// each of the four legs, which lean in until they merge above the second floor into a single shaft.
const EW = [[0, 62.5], [20, 51.5], [40, 42.5], [57.6, 35], [80, 28], [115.7, 20.5], [150, 16.5], [200, 12.8], [250, 10.2], [276, 9], [292, 6.5], [300, 5]];
const EL = [[0, 26], [57.6, 19], [115.7, 20.5]];
function hermite(tab, y) {
  const n = tab.length;
  if (y <= tab[0][0]) return tab[0][1];
  if (y >= tab[n - 1][0]) return tab[n - 1][1];
  let i = 1; while (y > tab[i][0]) i++;
  const [y0, a] = tab[i - 1], [y1, c] = tab[i], h = y1 - y0, t = (y - y0) / h;
  const m = (k) => { const p = tab[Math.max(0, k - 1)], q = tab[Math.min(n - 1, k + 1)]; return (q[1] - p[1]) / (q[0] - p[0]); };
  const m0 = m(i - 1) * h, m1 = m(i) * h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * c + (t3 - t2) * m1;
}
export const eiffelW = (y) => hermite(EW, y);
const eiffelL = (y) => {
  if (y >= 115.7) return eiffelW(y);
  let i = 1; while (y > EL[i][0]) i++;
  const [y0, a] = EL[i - 1], [y1, c] = EL[i];
  return Math.min(eiffelW(y), a + ((c - a) * (y - y0)) / (y1 - y0));
};
// Build the tower into a batcher at (x, y, z), scaled by s: the lattice skin in `lattice` (UVs tile one panel per `cell`
// real metres), the corner chords and floor girders in `solid` coloured `gold` / `bright`. Returns points spread over the
// skin for the sparkle.
export function eiffel(b, { lattice, solid, gold, bright, deck = new THREE.Color('#3a2410'), x = 0, y = 0, z = 0, s = 1, seg = 9, cell = 11, density = 0.06 }) {
  const pos = [], uv = [], pts = [], W = eiffelW, L = eiffelL;
  const P = (p) => [x + p[0] * s, y + p[1] * s, z + p[2] * s];
  const quad = (a0, a1, b0, b1, va, vb) => {   // a0-a1 the bottom edge, b0-b1 the top edge, in real metres
    const wa = Math.hypot(a1[0] - a0[0], a1[2] - a0[2]), wb = Math.hypot(b1[0] - b0[0], b1[2] - b0[2]), u1 = Math.max(1, Math.round((wa + wb) / 2 / cell));
    const V = [a0, a1, b1, a0, b1, b0], U = [[0, va], [u1, va], [u1, vb], [0, va], [u1, vb], [0, vb]];
    for (let k = 0; k < 6; k++) { pos.push(...P(V[k])); uv.push(U[k][0], U[k][1]); }
    const n = Math.round(((wa + wb) / 2) * Math.abs(b0[1] - a0[1]) * density * s * s) + (Math.random() < 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const u = Math.random(), v = Math.random(), lo = a0.map((c, j) => c + (a1[j] - c) * u), hi = b0.map((c, j) => c + (b1[j] - c) * u);
      pts.push(...P(lo.map((c, j) => c + (hi[j] - c) * v)));
    }
  };
  const chord = (p0, p1, t = 1.6, col = gold) => beam(b, solid, ...P(p0), ...P(p1), t * s, col);
  // the four legs, ground to the second floor
  const Y2 = 115.7;
  for (let k = 0; k < seg; k++) {
    const ya = (Y2 * k) / seg, yb = (Y2 * (k + 1)) / seg, Wa = W(ya), Wb = W(yb), Ia = Wa - L(ya), Ib = Wb - L(yb), va = ya / cell, vb = yb / cell;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      quad([sx * Wa, ya, sz * Ia], [sx * Wa, ya, sz * Wa], [sx * Wb, yb, sz * Ib], [sx * Wb, yb, sz * Wb], va, vb);
      quad([sx * Ia, ya, sz * Wa], [sx * Wa, ya, sz * Wa], [sx * Ib, yb, sz * Wb], [sx * Wb, yb, sz * Wb], va, vb);
      quad([sx * Ia, ya, sz * Ia], [sx * Ia, ya, sz * Wa], [sx * Ib, yb, sz * Ib], [sx * Ib, yb, sz * Wb], va, vb);
      quad([sx * Ia, ya, sz * Ia], [sx * Wa, ya, sz * Ia], [sx * Ib, yb, sz * Ib], [sx * Wb, yb, sz * Ib], va, vb);
      for (const [xa, za, xb, zb] of [[Wa, Wa, Wb, Wb], [Wa, Ia, Wb, Ib], [Ia, Wa, Ib, Wb], [Ia, Ia, Ib, Ib]]) chord([sx * xa, ya, sz * za], [sx * xb, yb, sz * zb], xa === Wa && za === Wa ? 2.2 : 1.4);
    }
  }
  // the shaft, second floor to the top
  const Y3 = 292, n2 = seg + 2;
  for (let k = 0; k < n2; k++) {
    const ya = Y2 + ((Y3 - Y2) * k) / n2, yb = Y2 + ((Y3 - Y2) * (k + 1)) / n2, Wa = W(ya), Wb = W(yb), va = ya / cell, vb = yb / cell;
    for (const sx of [-1, 1]) {
      quad([sx * Wa, ya, -Wa], [sx * Wa, ya, Wa], [sx * Wb, yb, -Wb], [sx * Wb, yb, Wb], va, vb);
      quad([-Wa, ya, sx * Wa], [Wa, ya, sx * Wa], [-Wb, yb, sx * Wb], [Wb, yb, sx * Wb], va, vb);
      for (const sz of [-1, 1]) chord([sx * Wa, ya, sz * Wa], [sx * Wb, yb, sz * Wb], 1.6);
    }
  }
  // the four great arches between the legs, set in the outer faces under the first floor
  const ys = 15, yc = 40, A = W(ys) - L(ys), th = 6.5, NA = 14;
  for (const [ax, sg] of [[0, 1], [0, -1], [1, 1], [1, -1]]) {
    for (let k = 0; k < NA; k++) {
      const t0 = Math.PI * (k / NA), t1 = Math.PI * ((k + 1) / NA);
      const pt = (t, dy) => { const u = A * Math.cos(t), yy = ys + (yc - ys) * Math.sin(t) + dy, w = sg * W(yy); return ax ? [w, yy, u] : [u, yy, w]; };
      quad(pt(t0, 0), pt(t1, 0), pt(t0, th), pt(t1, th), 0, th / cell);
      chord(pt(t0, 0), pt(t1, 0), 1.2);
    }
  }
  // the floors: girdered galleries round the first and second floors, the top cabin, the campanile and the antenna
  for (const [yf, hf] of [[57.6, 7], [Y2, 4.5]]) {   // each floor's gallery: a lattice band between gilded girders, its deck below
    const y0 = yf - hf, w = W(yf - hf / 2) + 1, v0 = y0 / cell, v1 = yf / cell;
    for (const e of [-1, 1]) {
      quad([e * w, y0, -w], [e * w, y0, w], [e * w, yf, -w], [e * w, yf, w], v0, v1);
      quad([-w, y0, e * w], [w, y0, e * w], [-w, yf, e * w], [w, yf, e * w], v0, v1);
      for (const yy of [y0 + 0.5, yf - 0.4]) {
        b.add(G.box, solid, ...P([e * w, yy, 0]), 1.2 * s, 0.9 * s, 2 * w * s, 0, 0, 0, bright);
        b.add(G.box, solid, ...P([0, yy, e * w]), 2 * w * s, 0.9 * s, 1.2 * s, 0, 0, 0, bright);
      }
    }
    b.add(G.box, solid, ...P([0, y0 - 0.5, 0]), 2 * w * s, 1 * s, 2 * w * s, 0, 0, 0, deck);
  }
  b.add(G.box, solid, ...P([0, 282, 0]), 19 * s, 12 * s, 19 * s, 0, 0, 0, bright);
  b.add(G.box, solid, ...P([0, 289, 0]), 21 * s, 1.2 * s, 21 * s, 0, 0, 0, gold);
  b.add(G.cone4, solid, ...P([0, 298, 0]), 12 * s, 14 * s, 12 * s, 0, 0, 0, gold);
  b.add(G.cyl8, solid, ...P([0, 312, 0]), 3 * s, 22 * s, 3 * s, 0, 0, 0, gold);
  b.add(G.cyl8, solid, ...P([0, 327, 0]), 1.2 * s, 10 * s, 1.2 * s, 0, 0, 0, bright);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  b.addM(g, lattice, new THREE.Matrix4(), null);
  return { pts, top: P([0, 300, 0]) };
}
// the hourly sparkle: thousands of white bulbs flickering over the golden lattice; `on` fades it in and out
export function sparkles(pts, { size = 0.6, curved = true } = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const ph = new Float32Array(pts.length / 3);
  for (let i = 0; i < ph.length; i++) ph[i] = Math.random() * 100;
  g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, on: { value: 0 }, size: { value: size }, uScale: pointScale, uCurveY: curveUniforms.uCurveY, uCurveX: curveUniforms.uCurveX },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aPh; uniform float time, on, size, uScale, uCurveY, uCurveX; varying float vA;
      void main(){
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        ${curved ? CURVE_GLSL : ''}
        float f = fract(aPh * 13.7 + time * (1.6 + fract(aPh * 7.3) * 2.4));
        vA = on * step(0.6, f) * (0.6 + 0.4 * fract(aPh * 3.1));
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = vA > 0.0 ? clamp(size * uScale / max(-mvPosition.z, 1.0), 2.0, 18.0) : 0.0;
      }`,
    fragmentShader: `varying float vA;
      void main(){
        vec2 q = gl_PointCoord - 0.5; float r = length(q);
        float a = (smoothstep(0.5, 0.0, r) * 0.7 + (smoothstep(0.07, 0.0, abs(q.x)) + smoothstep(0.07, 0.0, abs(q.y))) * smoothstep(0.5, 0.0, r) * 0.6) * vA;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(1.0, 0.97, 0.9) * a * 2.2, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const p = new THREE.Points(g, mat);
  p.frustumCulled = false;
  return p;
}
// the searchlight on the top: two beams turning slowly over the city
export function beacon(len = 600, r = 22, k = 0.22, curved = false) {
  const grp = new THREE.Group(), geo = new THREE.ConeGeometry(r, len, 16, 1, true);
  geo.translate(0, -len / 2, 0); geo.rotateZ(Math.PI / 2);
  const P = geo.attributes.position, col = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) { const f = Math.pow(1 - Math.min(1, P.getX(i) / len), 1.5) * k; col.set([f, f * 0.95, f * 0.82], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  let mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
  if (curved) mat = basic({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
  for (const ry of [0, Math.PI]) { const m = new THREE.Mesh(geo, mat); m.rotation.y = ry; m.frustumCulled = false; m.renderOrder = 2; grp.add(m); }
  return grp;
}
export const latticeTexture = latticeTex;
// the tower sparkles for eight seconds every thirty-six, fading in and out over a second
export const sparkleOn = (t) => { const p = t % 36; return p < 8 ? Math.min(1, p / 0.8, (8 - p) / 0.8) : 0; };
