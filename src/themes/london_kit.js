// London street kit for a snowy Christmas night: stucco terraces with porticoes and spear railings, Portland-stone West
// End shops under Christmas lights, red-brick pubs with hanging signs, City glass towers and banks, red phone boxes,
// pillar boxes, Belisha beacons, Victorian and Embankment dolphin lamps, black cabs and red buses, Tube entrances,
// Christmas market chalets, snowmen, carol singers and a Salvation Army brass band.
import { THREE, VC, G, std, basic, hdr, signAtlas, planeUV, canvasTex, rand, randi, pick, chance } from '../core.js';
import { buildingRow, facadeMat, EDGE, screenMat, waterMat, textTex, at } from './common.js';
import { beam, wire } from './tokyo_kit.js';
import { londonTreeKit } from './trees.js';
import { tiledBox } from './beijing_kit.js';

export const SNOW = '#e4eaf6', SNOW_ROOF = '#c9d2e2';
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '"Chakra Petch", "Helvetica Neue", Arial, sans-serif';
const STREETS = [['OXFORD STREET', 'W1'], ['BAKER STREET', 'NW1'], ['ABBEY ROAD', 'NW8'], ['CARNABY STREET', 'W1'], ['PORTOBELLO ROAD', 'W11'],
  ['FLEET STREET', 'EC4'], ['BRICK LANE', 'E1'], ["KING'S ROAD", 'SW3'], ['SAVILE ROW', 'W1'], ['DRURY LANE', 'WC2'], ['PICCADILLY', 'W1'], ['STRAND', 'WC2']];
const PUBS = ['THE RED LION', 'THE CROWN', 'ROSE & CROWN', "THE KING'S ARMS", 'THE WHITE HART', 'THE GEORGE', 'THE PRINCE ALBERT', 'THE LAMB & FLAG'];
const SHOPS = ['TOYS & GAMES', 'TEA MERCHANTS', 'BOOKSELLERS', 'CHOCOLATIER', 'JEWELLERS', 'HATTERS', 'TAILORS', 'BAKERY', 'GIFTS', 'PERFUMERY'];
const STALLS = ['MULLED WINE', 'CHESTNUTS', 'MINCE PIES', 'GINGERBREAD', 'HOT CHOCOLATE', 'XMAS GIFTS', 'BRATWURST', 'CHURROS'];
const NEON = [
  { text: 'THEATRE', color: '#ffd23d', border: true }, { text: 'PUB', color: '#ff6a3d' }, { text: 'SOHO', color: '#ff3df0', border: true },
  { text: 'GIN BAR', color: '#7cf8ff' }, { text: 'OPEN', color: '#ff3b3b', border: true }, { text: 'PIE & MASH', color: '#ffcf8a' },
  { text: 'CURRY HOUSE', color: '#39ff88', border: true }, { text: 'COCKTAILS', color: '#b26bff' }, { text: 'FISH & CHIPS', color: '#ffe23d', border: true },
  { text: 'LIVE JAZZ', color: '#3d9bff' }, { text: 'TONIGHT', color: '#ff5fa2', border: true }, { text: 'LONDON', color: '#ff3b4a' },
];
export const ADS = [
  { bg: ['#d8202a', '#6a0a10'], text: 'LONDON', sub: 'CITY DASH · CHRISTMAS', icon: 'snow' },
  { bg: ['#1c3f94', '#08153a'], text: 'MIND THE GAP', sub: 'UNDERGROUND', icon: 'roundel' },
  { bg: ['#ffc21a', '#ff7a00'], text: 'FISH & CHIPS', sub: 'SINCE 1860', icon: 'steam' },
  { bg: ['#0e5a3a', '#03261a'], text: 'MERRY XMAS', sub: "SEASON'S GREETINGS", icon: 'snow' },
  { bg: ['#c8d4f4', '#7a8ed8'], text: 'TEA TIME', sub: 'SCONES · JAM · CREAM', icon: 'bubbles', fg: '#10245a' },
  { bg: ['#141414', '#3a0a3a'], text: 'WEST END', sub: 'NOW SHOWING', icon: 'stars', fg: '#ffd23d' },
  { bg: ['#ff5fa2', '#7b2ff7'], text: 'BOXING DAY', sub: 'SALE · 50% OFF', icon: 'bolt' },
  { bg: ['#00a0e0', '#003a7a'], text: 'THAMES', sub: 'RIVER BOAT TOURS', icon: 'waves' },
];

// ---------- textures ----------
// Facade pair (colour + lit windows) with sash windows and their glazing bars over brick, ashlar or smooth stucco.
// glow > 0 also lights the wall itself in the emissive map, for floodlit monuments.
export function facadeTex({ cols, rows, cw = 32, ch = 48, wall, bond = null, glass = '#14161c', lit, litChance = 0.5, frame = '#f4f2ec', arch = false, sill = '#ece6da', lintel = null, glow = 0 }) {
  const W = cols * cw, H = rows * ch, cells = [];
  for (let r = 0; r < rows; r++) { const rl = Math.random() < 0.15 ? 0.85 : litChance; for (let c = 0; c < cols; c++) cells.push(Math.random() < rl ? pick(lit) : null); }
  const R = (c, r) => [c * cw + cw * 0.24, r * ch + ch * 0.18, cw * 0.52, ch * 0.6];
  const shape = (g, x, y, w, h) => {
    g.beginPath();
    if (arch) { g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); } else g.rect(x, y, w, h);
  };
  const bars = (g, x, y, w, h, col, lw) => {   // sash glazing bars: a centre bar and the rails of the two sashes
    g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
    g.moveTo(x + w / 2, y + (arch ? w * 0.5 : 0)); g.lineTo(x + w / 2, y + h);
    for (const f of [0.3, 0.55, 0.8]) { g.moveTo(x, y + h * f); g.lineTo(x + w, y + h * f); }
    g.stroke();
  };
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    const base = new THREE.Color(wall);
    if (bond === 'brick') for (let y = 0, row = 0; y < H; y += 3, row++) for (let x = row % 2 ? -3 : 0; x < W; x += 6) {
      const c = base.clone().multiplyScalar(rand(0.82, 1.12)); g.fillStyle = `#${c.getHexString()}`; g.fillRect(x, y, 5, 2);
    }
    if (bond === 'ashlar') {
      g.strokeStyle = 'rgba(80,70,50,0.18)'; g.lineWidth = 1;
      for (let y = 0, row = 0; y < H; y += 8, row++) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let x = row % 2 ? 8 : 0; x < W; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 8); g.stroke(); } }
    }
    for (let i = 0; i < W * H / 60; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r);
      g.fillStyle = frame; shape(g, x - 1.5, y - 1.5, w + 3, h + 3); g.fill();
      g.fillStyle = glass; shape(g, x, y, w, h); g.fill();
      bars(g, x, y, w, h, frame, 1.2);
      g.fillStyle = sill; g.fillRect(x - 3, y + h + 1, w + 6, 2.5);
      if (lintel) { g.fillStyle = lintel; g.fillRect(x - 2, y - 5, w + 4, 3.5); }
    }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = glow ? `#${new THREE.Color(wall).multiplyScalar(glow).getHexString()}` : '#000'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const col = cells[r * cols + c];
      if (glow) { const [x, y, w, h] = R(c, r); g.fillStyle = '#000'; shape(g, x, y, w, h); g.fill(); }
      if (!col) continue;
      const [x, y, w, h] = R(c, r), gr = g.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, col); gr.addColorStop(1, `#${new THREE.Color(col).multiplyScalar(0.55).getHexString()}`);
      g.fillStyle = gr; shape(g, x, y, w, h); g.fill();
      if (Math.random() < 0.3) { g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x, y, w * rand(0.25, 0.5), h); }
      bars(g, x, y, w, h, '#000', 1.2);
    }
  });
  return { map, emissive, cols, rows };
}
function railTex() {   // black iron railings with spear tips
  return canvasTex(128, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#121214';
    g.fillRect(0, 12, w, 3); g.fillRect(0, h - 8, w, 3);
    for (let x = 2; x < w; x += 8) { g.fillRect(x, 6, 2, h - 6); g.beginPath(); g.moveTo(x - 2, 8); g.lineTo(x + 1, 0); g.lineTo(x + 4, 8); g.fill(); }
  }, { repeat: false });
}
function kioskTex() {   // K6 phone-box glazing: red glazing bars over warm-lit panes
  return canvasTex(64, 128, (g, w, h) => {
    g.fillStyle = '#c81a1e'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 3; c++) { g.fillStyle = r === 0 ? '#ffe6a8' : '#ffd88a'; g.fillRect(4 + c * 19.5, 4 + r * 15.5, 16, 12); }
  }, { repeat: false });
}
function roundelTex() {   // the Underground roundel: red ring, blue bar
  return canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#dc241f'; g.lineWidth = 34; g.beginPath(); g.arc(w / 2, h / 2, 82, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(w / 2, h / 2, 65, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1c3f94'; g.fillRect(8, h / 2 - 22, w - 16, 44);
    g.fillStyle = '#ffffff'; g.font = `700 30px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('UNDERGROUND', w / 2, h / 2 + 2);
  }, { repeat: false });
}
function streetSignTex() {   // white enamel street names with the red postal district
  const cw = 512, ch = 112, n = STREETS.length;
  const tex = canvasTex(cw, ch * n, (g) => {
    STREETS.forEach(([t, d], i) => {
      const y = i * ch;
      g.fillStyle = '#f4f4f0'; g.fillRect(0, y, cw, ch);
      g.strokeStyle = '#141414'; g.lineWidth = 6; g.strokeRect(8, y + 8, cw - 16, ch - 16);
      g.fillStyle = '#141414'; g.font = `700 50px ${SANS}`; g.textAlign = 'left'; g.textBaseline = 'middle';
      const m = Math.min(1, 360 / g.measureText(t).width);
      g.save(); g.translate(30, y + ch / 2 + 3); g.scale(m, 1); g.fillText(t, 0, 0); g.restore();
      g.fillStyle = '#d8202a'; g.font = `700 40px ${SANS}`; g.textAlign = 'right'; g.fillText(d, cw - 28, y + ch / 2 + 3);
    });
  }, { repeat: false });
  return { tex, rects: STREETS.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / n, v1: 1 - i / n })) };
}
function boardAtlas(names, cols, { font = SERIF, fg = '#f2d27a', h = 128 } = {}) {   // painted fascia boards with gilt lettering
  const cw = 512, n = names.length;
  const tex = canvasTex(cw, h * n, (g) => {
    names.forEach((t, i) => {
      const y = i * h;
      g.fillStyle = cols[i % cols.length]; g.fillRect(0, y, cw, h);
      g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(10, y + 10, cw - 20, h - 20);
      g.fillStyle = fg; g.font = `700 ${Math.round(h * 0.42)}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const m = Math.min(1, (cw - 60) / g.measureText(t).width);
      g.save(); g.translate(cw / 2, y + h / 2 + 3); g.scale(m, 1); g.fillText(t, 0, 0); g.restore();
    });
  }, { repeat: false });
  return { tex, rects: names.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / n, v1: 1 - i / n })) };
}
function pubSignTex() {   // swinging pub signs: a painted emblem over the name
  const cw = 192, ch = 256, n = PUBS.length;
  return canvasTex(cw * n, ch, (g) => {
    PUBS.forEach((t, i) => {
      const x = i * cw;
      g.fillStyle = ['#1a3a2a', '#5a1a1a', '#1a2a4a', '#3a2a1a'][i % 4]; g.fillRect(x, 0, cw, ch);
      g.strokeStyle = '#d9b44a'; g.lineWidth = 8; g.strokeRect(x + 8, 8, cw - 16, ch - 16);
      const cx = x + cw / 2, cy = 104;
      g.fillStyle = ['#c8202c', '#f2c230', '#e8e0d0', '#f4f4f0', '#2a6ad8', '#f2c230', '#c8202c', '#f4f4f0'][i];
      if (i === 1 || i === 2) { g.beginPath(); g.moveTo(cx - 44, cy + 30); g.lineTo(cx - 50, cy - 26); g.lineTo(cx - 22, cy); g.lineTo(cx, cy - 40); g.lineTo(cx + 22, cy); g.lineTo(cx + 50, cy - 26); g.lineTo(cx + 44, cy + 30); g.fill(); }
      else if (i === 4) { g.beginPath(); g.ellipse(cx, cy, 36, 26, 0, 0, 7); g.fill(); g.fillRect(cx - 4, cy - 50, 8, 30); }
      else { g.beginPath(); g.arc(cx, cy, 40, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(cx + 8, cy - 6, 14, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#f2e6c8'; g.font = `700 22px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const m = Math.min(1, (cw - 30) / g.measureText(t).width);
      g.save(); g.translate(cx, 200); g.scale(m, 1); g.fillText(t, 0, 0); g.restore();
    });
  }, { repeat: false });
}
export function unionJack(w = 256, h = 128) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = '#012169'; g.fillRect(0, 0, w, h);
    const diag = (lw, col) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke(); };
    diag(h * 0.2, '#ffffff');
    g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip();
    g.strokeStyle = '#c8102e'; g.lineWidth = h * 0.066;
    const o = h * 0.033;
    g.beginPath(); g.moveTo(0, -o); g.lineTo(w / 2, h / 2 - o); g.moveTo(w, h + o); g.lineTo(w / 2, h / 2 + o);
    g.moveTo(w + o * 2, 0 + o); g.lineTo(w / 2 + o * 2, h / 2 + o); g.moveTo(-o * 2, h - o); g.lineTo(w / 2 - o * 2, h / 2 - o); g.stroke();
    g.restore();
    g.fillStyle = '#ffffff'; g.fillRect(w / 2 - h * 0.17, 0, h * 0.34, h); g.fillRect(0, h / 2 - h * 0.17, w, h * 0.34);
    g.fillStyle = '#c8102e'; g.fillRect(w / 2 - h * 0.1, 0, h * 0.2, h); g.fillRect(0, h / 2 - h * 0.1, w, h * 0.2);
  }, { repeat: false });
}
function angelTex() {   // Regent Street's Christmas angels: a figure of light with sweeping wings
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.lineCap = 'round'; g.shadowColor = '#ffe6a0'; g.shadowBlur = 10;
    const cx = w / 2;
    for (const s of [-1, 1]) for (let k = 0; k < 9; k++) {   // feathers fanning out of each shoulder
      const a = -0.25 - k * 0.13, L = 210 - k * 14;
      g.strokeStyle = k % 2 ? '#fff4d0' : '#ffd88a'; g.lineWidth = 3.2;
      g.beginPath(); g.moveTo(cx + s * 14, 92);
      g.quadraticCurveTo(cx + s * (40 + L * 0.5), 92 + Math.sin(a) * L * 0.9 - 30, cx + s * L * Math.cos(a * 0.7), 92 + Math.sin(a) * L * 0.55 + 70 - k * 6);
      g.stroke();
    }
    g.strokeStyle = '#ffffff'; g.lineWidth = 4;
    g.beginPath(); g.arc(cx, 54, 16, 0, Math.PI * 2); g.stroke();                       // head
    g.beginPath(); g.ellipse(cx, 30, 20, 6, 0, 0, Math.PI * 2); g.stroke();             // halo
    g.beginPath(); g.moveTo(cx, 72); g.lineTo(cx - 34, 236); g.moveTo(cx, 72); g.lineTo(cx + 34, 236);   // the gown
    g.moveTo(cx - 34, 236); g.quadraticCurveTo(cx, 248, cx + 34, 236); g.stroke();
    for (let y = 100; y < 230; y += 22) { g.beginPath(); g.moveTo(cx - (y - 72) * 0.2, y); g.lineTo(cx + (y - 72) * 0.2, y + 8); g.stroke(); }
    g.fillStyle = '#fff8e0';
    for (let i = 0; i < 120; i++) { g.globalAlpha = rand(0.3, 1); g.beginPath(); g.arc(rand(0, w), rand(0, h), rand(0.8, 2), 0, 7); g.fill(); }
  }, { repeat: false });
}
function snowflakeTex() {   // a big hanging snowflake decoration
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffffff'; g.lineCap = 'round'; g.lineWidth = 5; g.shadowColor = '#bfe4ff'; g.shadowBlur = 8;
    g.translate(w / 2, h / 2);
    for (let k = 0; k < 6; k++) {
      g.rotate(Math.PI / 3);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -54);
      for (const [y, l] of [[-24, 14], [-40, 10]]) { g.moveTo(0, y); g.lineTo(-l, y - l); g.moveTo(0, y); g.lineTo(l, y - l); }
      g.stroke();
    }
  }, { repeat: false });
}
function adAtlas() {
  const CW = 384, CH = 240;
  return canvasTex(CW * ADS.length, CH, (g) => {
    ADS.forEach((a, i) => {
      const x0 = i * CW;
      const gr = g.createLinearGradient(x0, 0, x0 + CW, CH); gr.addColorStop(0, a.bg[0]); gr.addColorStop(1, a.bg[1]);
      g.fillStyle = gr; g.fillRect(x0, 0, CW, CH);
      g.save(); g.beginPath(); g.rect(x0, 0, CW, CH); g.clip();
      g.globalAlpha = 0.4; g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff';
      if (a.icon === 'snow') for (let k = 0; k < 16; k++) { g.font = `${randi(16, 42)}px sans-serif`; g.fillText('❄', x0 + rand(0, CW), rand(20, CH)); }
      if (a.icon === 'roundel') { g.globalAlpha = 0.9; g.lineWidth = 16; g.strokeStyle = '#dc241f'; g.beginPath(); g.arc(x0 + 300, 70, 44, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#ffffff'; g.fillRect(x0 + 238, 60, 124, 20); }
      if (a.icon === 'waves') for (let k = 0; k < 5; k++) { g.lineWidth = 5; g.beginPath(); for (let x = 0; x <= CW; x += 8) g.lineTo(x0 + x, 60 + k * 36 + Math.sin(x * 0.05 + k) * 10); g.stroke(); }
      if (a.icon === 'stars') for (let k = 0; k < 14; k++) { g.font = `${randi(18, 40)}px sans-serif`; g.fillText('✦', x0 + rand(0, CW), rand(20, CH)); }
      if (a.icon === 'steam') for (let k = 0; k < 5; k++) { g.lineWidth = 6; g.beginPath(); for (let y = 30; y < 150; y += 6) g.lineTo(x0 + 250 + k * 22 + Math.sin(y * 0.08 + k) * 8, y); g.stroke(); }
      if (a.icon === 'bolt') for (let k = 0; k < 7; k++) g.fillRect(x0 + rand(0, CW), rand(0, CH), rand(60, 160), 4);
      if (a.icon === 'bubbles') for (let k = 0; k < 18; k++) { g.beginPath(); g.arc(x0 + rand(0, CW), rand(0, CH), rand(4, 22), 0, Math.PI * 2); g.fill(); }
      g.restore();
      g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = a.fg || '#ffffff';
      g.font = '900 60px "Russo One", "Arial Black", sans-serif';
      const m = g.measureText(a.text).width, sc = Math.min(1, (CW - 40) / m);
      g.save(); g.translate(x0 + 20, 128); g.scale(sc, 1); g.fillText(a.text, 0, 0); g.restore();
      g.font = `700 24px ${SANS}`; g.globalAlpha = 0.9; g.fillText(a.sub, x0 + 22, 168); g.globalAlpha = 1;
    });
  }, { repeat: false });
}
function shopWinTex() {   // Christmas shop windows: painted joinery, warm panes, presents, trees and toys on display
  const W = 512, H = 128, n = 4;
  return canvasTex(W, H * n, (g) => {
    for (let v = 0; v < n; v++) {
      const y0 = v * H, frame = ['#123a26', '#141414', '#16224a', '#4a1418'][v];
      g.fillStyle = frame; g.fillRect(0, y0, W, H);
      for (let k = 0; k < 4; k++) {
        const x = 8 + k * 126, w = 118, y = y0 + 10, h = H - 26;
        const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#fff2d0'); gr.addColorStop(1, '#e8a860');
        g.fillStyle = gr; g.fillRect(x, y, w, h);
        for (let i = 0; i < 6; i++) {   // the display
          const px = x + 8 + rand(0, w - 30), ph = rand(14, 40), pw = rand(12, 26), base = y + h;
          const kind = (v + k + i) % 4;
          g.fillStyle = pick(['#c8202c', '#2a6a3a', '#2a5ad8', '#d8a020', '#f4f4f0', '#8a3ad8']);
          if (kind === 0) { g.fillRect(px, base - ph, pw, ph); g.fillStyle = '#ffd86a'; g.fillRect(px + pw / 2 - 1.5, base - ph, 3, ph); g.fillRect(px, base - ph * 0.6, pw, 3); }
          else if (kind === 1) { g.fillStyle = '#1f5a30'; g.beginPath(); g.moveTo(px + pw / 2, base - ph * 1.4); g.lineTo(px + pw, base); g.lineTo(px, base); g.fill(); g.fillStyle = '#ffd86a'; for (let j = 0; j < 5; j++) g.fillRect(px + rand(4, pw - 4), base - rand(4, ph * 1.2), 2, 2); }
          else if (kind === 2) { g.fillStyle = '#2a2420'; g.fillRect(px + pw / 2 - 5, base - ph * 1.5, 10, ph * 1.5); g.beginPath(); g.arc(px + pw / 2, base - ph * 1.5 - 6, 6, 0, 7); g.fill(); }
          else { g.fillStyle = '#a8784a'; g.beginPath(); g.arc(px + pw / 2, base - 10, 10, 0, 7); g.fill(); g.beginPath(); g.arc(px + pw / 2, base - 24, 7, 0, 7); g.fill(); }
        }
        g.fillStyle = frame; g.fillRect(x + w / 2 - 2, y, 4, h);
        g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x + 4, y + 4, w * 0.3, 3);
      }
      g.fillStyle = frame; g.fillRect(0, y0 + H - 16, W, 16);
    }
  });
}
function bulbLineTex() {   // a string of warm bulbs, tiled along cornices
  return canvasTex(128, 16, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 4; k++) { const gr = g.createRadialGradient(16 + k * 32, 8, 0, 16 + k * 32, 8, 8); gr.addColorStop(0, '#fff6e0'); gr.addColorStop(0.4, '#ffd890'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(k * 32, 0, 32, 16); }
  });
}
// unit pediment: a triangle (base 1 along x, apex at y = 1) extruded 1 along z, centred on z
export const PED = (() => {
  const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 1); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  return g;
})();

// ---------- the kit ----------
export function makeKit() {
  const K = {};
  Object.assign(K, londonTreeKit());
  const WARM = ['#ffd9a0', '#ffe6c0', '#ffcf8a', '#fff0d8'];
  K.stucco = facadeTex({ cols: 3, rows: 5, wall: '#f4f1ea', lit: WARM, litChance: 0.55, frame: '#ffffff' });
  K.stuccoMat = facadeMat(K.stucco, { k: 0.85 });
  K.stone = facadeTex({ cols: 5, rows: 6, wall: '#e2d8c2', bond: 'ashlar', glass: '#13120f', lit: ['#ffe0b0', '#fff2d8', '#ffd28a'], litChance: 0.5, frame: '#efe8d6', sill: '#d8cdb4', lintel: '#d0c4a8' });
  K.stoneMat = facadeMat(K.stone, { k: 0.85 });
  K.brick = facadeTex({ cols: 4, rows: 4, wall: '#8a3e2c', bond: 'brick', glass: '#141210', lit: WARM, litChance: 0.55, frame: '#efe6d6', sill: '#e0d6c4', lintel: '#d8ccb6' });
  K.brickMat = facadeMat(K.brick, { k: 0.85 });
  K.yellow = facadeTex({ cols: 4, rows: 4, wall: '#b8a070', bond: 'brick', glass: '#141210', lit: WARM, litChance: 0.5, frame: '#f4eee0', arch: true, sill: '#e8e0cc' });
  K.yellowMat = facadeMat(K.yellow, { k: 0.85 });
  K.glass = facadeTex({ cols: 6, rows: 16, cw: 24, ch: 32, wall: '#16202e', glass: '#22344c', lit: ['#e6f2ff', '#ffffff', '#cfe4ff'], litChance: 0.42, frame: '#2a3648', sill: '#2a3648' });
  K.glassMat = facadeMat(K.glass, { k: 0.8, rough: 0.25, metal: 0.6 });
  const stoneTile = canvasTex(128, 128, (g, w, h) => {   // floodlit Portland stone ashlar for the monuments
    g.fillStyle = '#c8bea6'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 16 - 16; x < w; x += 32) { const v = randi(-10, 10); g.fillStyle = `rgb(${226 + v},${218 + v},${198 + v})`; g.fillRect(x + 1, y + 1, 30, 14); }
  });
  K.ashlarMat = std({ map: stoneTile, vertexColors: true, roughness: 0.85, emissive: '#ffe2b8', emissiveMap: stoneTile, emissiveIntensity: 0.16 });
  K.ashlar = (b, x, y, z, w, h, d, col = 0xffffff, ry = 0) => b.addM(tiledBox(w, h, d, 2.4), K.ashlarMat, at(x, y + h / 2, z, ry), col);
  K.railMat = std({ map: railTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.6 });
  K.kioskMat = basic({ map: kioskTex(), color: hdr('#ffffff', 1.05) });
  K.roundelMat = basic({ map: roundelTex(), alphaTest: 0.5, side: THREE.DoubleSide, color: hdr('#ffffff', 1.25) });
  K.ugMat = basic({ map: textTex('UNDERGROUND', { w: 512, h: 96, color: '#ffffff', bg: '#1c3f94', size: 0.58 }), color: hdr('#ffffff', 1.2), side: THREE.DoubleSide });
  K.telMat = basic({ map: textTex('TELEPHONE', { w: 512, h: 96, color: '#141414', bg: '#f4f4ec', size: 0.6 }), color: hdr('#ffffff', 1.3) });
  const ss = streetSignTex();
  K.signRects = ss.rects; K.signMat = basic({ map: ss.tex, color: hdr('#ffffff', 0.9), side: THREE.DoubleSide });
  const pubs = boardAtlas(PUBS, ['#123a26', '#4a1418', '#141a30', '#161616']);
  K.pubRects = pubs.rects; K.pubMat = std({ map: pubs.tex, roughness: 0.6, emissive: '#ffffff', emissiveMap: pubs.tex, emissiveIntensity: 0.45 });
  const shops = boardAtlas(SHOPS, ['#141414', '#123a26', '#3a1430', '#16224a']);
  K.shopRects = shops.rects; K.shopMat = std({ map: shops.tex, roughness: 0.6, emissive: '#ffffff', emissiveMap: shops.tex, emissiveIntensity: 0.5 });
  const stalls = boardAtlas(STALLS, ['#7a1418', '#123a26'], { font: SANS, fg: '#fff2d6', h: 96 });
  K.stallRects = stalls.rects; K.stallMat = basic({ map: stalls.tex, color: hdr('#ffffff', 1.1) });
  const ps = pubSignTex();
  K.pubSignRects = PUBS.map((_, i) => ({ u0: i / PUBS.length, u1: (i + 1) / PUBS.length, v0: 0, v1: 1 }));
  K.pubSignMat = std({ map: ps, roughness: 0.6, emissive: '#ffffff', emissiveMap: ps, emissiveIntensity: 0.4, side: THREE.DoubleSide });
  const neon = signAtlas(NEON.map((e) => ({ ...e, font: '"Russo One", "Arial Black", sans-serif' })), { cols: 2 });
  K.neonRects = neon.rects;
  K.neonMat = basic({ map: neon.tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hdr('#ffffff', 1.3) });
  K.neon = (b, x, y, z, side, w, i = randi(0, K.neonRects.length - 1)) => b.add(planeUV(K.neonRects[i]), K.neonMat, x, y, z, w, w / 4, 1, 0, -side * Math.PI / 2);
  K.screen = screenMat(adAtlas(), ADS.length, 1.05);
  K.ledScreen = (b, x, y, z, side, w, h) => {
    b.box(VC.solid, '#101014', x + side * 0.12, y, z, 0.2, h + 0.3, w + 0.3);
    b.add(G.plane, K.screen, x - side * 0.01, y, z, w, h, 1, 0, -side * Math.PI / 2, 0, new THREE.Color(Math.random(), rand(0.85, 1.05), 0));
  };
  const flag = unionJack();
  K.flagMat = std({ map: flag, roughness: 0.7, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: flag, emissiveIntensity: 0.3 });
  K.angelMat = basic({ map: angelTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: hdr('#ffe8b8', 1.5) });
  K.flakeMat = basic({ map: snowflakeTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: hdr('#d8ecff', 1.6) });
  K.amber = basic({ color: hdr('#ffa020', 3) });   // Belisha beacons, blinking
  K.shopWinMat = basic({ map: shopWinTex(), color: hdr('#ffffff', 0.82) });
  K.bulbMat = basic({ map: bulbLineTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hdr('#ffffff', 1.6) });
  const tiles = new Map();   // planes whose UVs repeat a texture n times across (row v of an atlas of rows)
  K.tiled = (n, v = 0, rows = 1) => {
    const key = `${n}|${v}|${rows}`;
    if (!tiles.has(key)) tiles.set(key, planeUV({ u0: 0, u1: n, v0: 1 - (v + 1) / rows, v1: 1 - v / rows }));
    return tiles.get(key);
  };
  K.bulbLine = (b, x, y, z, side, L) => b.add(K.tiled(Math.max(1, Math.round(L / 1.6))), K.bulbMat, x, y, z, L, 0.28, 1, 0, -side * Math.PI / 2, 0);
  K.thames = waterMat('#0a1226');
  K.thames.metalness = 0.6; K.thames.roughness = 0.3; K.thames.envMapIntensity = 0.3; K.thames.normalScale.set(0.3, 0.3);

  // ---------- facades ----------
  const doors = ['#141414', '#1a2a4a', '#5a1418', '#1a3a26', '#2a2a2e', '#d8202a'];
  K.wreath = (b, x, y, z, ry) => {   // holly wreath with a few lights and a red bow; ry turns the ring to face its wall
    b.add(G.tor, VC.solid, x, y, z, 0.66, 0.66, 1.4, 0, ry, 0, '#1f4a2a');
    const ux = Math.cos(ry), uz = -Math.sin(ry);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; b.sph(VC.glow, hdr(k % 2 ? '#ff3a3a' : '#ffd890', 2), x + ux * Math.cos(a) * 0.33, y + Math.sin(a) * 0.33, z + uz * Math.cos(a) * 0.33, 0.04, true); }
    b.box(VC.solid, '#c8202c', x, y - 0.33, z, 0.2, 0.14, 0.08, ry);
  };
  // a little Christmas tree glowing in a front window
  K.windowTree = (b, x, z, s) => {
    b.add(G.cone8, VC.solid, x, 1.75, z, 0.25, 1.4, 0.9, 0, 0, 0, '#1e4a30');
    for (let k = 0; k < 7; k++) b.sph(VC.glow, hdr(pick(['#ffd890', '#ff4a4a', '#6ab0ff']), 2.4), x - s * 0.08, 1.2 + k * 0.17, z + rand(-0.32, 0.32) * (1 - k / 8), 0.035, true);
    b.sph(VC.glow, hdr('#ffd86a', 3), x - s * 0.06, 2.5, z, 0.07, true);
  };
  K.terraceType = { mat: K.stuccoMat, tex: K.stucco, colors: ['#ffffff', '#ffffff', '#f6dfe4', '#dbe8f4', '#f4ecc8', '#dcefe0', '#e8e0f2', '#f8e6d0'], w: [6.4, 7.6], h: [13, 15.5], weight: 1, cellW: 2.3, cellH: 3.2,
    roof: (b, i) => {
      b.box(VC.solid, '#f2f0ea', i.face - i.side * 0.2, i.h + 0.35, i.z, 0.55, 0.7, i.len);
      b.box(VC.solid, SNOW, i.face - i.side * 0.22, i.h + 0.75, i.z, 0.64, 0.12, i.len + 0.02);
      b.add(G.cone4, VC.solid, i.x, i.h + 1.0, i.z, i.d * 1.3, 2.0, i.len * 1.42, 0, 0, 0, SNOW_ROOF);
      const xc = i.x + rand(-1.5, 1.5), zc = i.z + i.len / 2 - 0.05;
      b.block(VC.solid, '#8a4a3a', xc, i.h, zc, 1.0, 2.3, 1.7);
      b.box(VC.solid, SNOW, xc, i.h + 2.36, zc, 1.1, 0.12, 1.8);
      for (let k = 0; k < 3; k++) b.cyl(VC.solid, '#b0603e', xc, i.h + 2.6, zc - 0.5 + k * 0.5, 0.11, 0.5, 'cyl8');
    },
    front: (b, i) => {
      const s = i.side, f = i.face, L = i.len, zd = i.z + pick([-1, 1]) * (L / 2 - 1.3), xr = f - s * 2.2;
      for (let k = 0; k < 3; k++) { const w = 2.2 - k * 0.5; b.box(VC.solid, '#e6e4de', f - s * w / 2, (k + 1) * 0.15, zd, w, (k + 1) * 0.3, 1.6); }
      for (const dz of [-0.75, 0.75]) b.cyl(VC.solid, '#f6f4ee', f - s * 1.35, 2.5, zd + dz, 0.13, 3.2, 'cyl8');
      b.box(VC.solid, '#f4f2ec', f - s * 0.78, 4.3, zd, 1.6, 0.5, 2.0);
      b.box(VC.solid, SNOW, f - s * 0.8, 4.6, zd, 1.72, 0.12, 2.12);
      b.box(VC.solid, pick(doors), f - s * 0.04, 2.05, zd, 0.08, 2.3, 1.05);
      b.box(VC.glow, hdr('#ffd9a0', 1.1), f - s * 0.05, 3.42, zd, 0.06, 0.38, 0.95);
      K.wreath(b, f - s * 0.12, 2.5, zd, Math.PI / 2);
      for (const [a, c] of [[i.z - L / 2 + 0.05, zd - 0.85], [zd + 0.85, i.z + L / 2 - 0.05]]) if (c - a > 0.3) b.add(G.plane, K.railMat, xr, 0.55, (a + c) / 2, c - a, 1.1, 1, 0, Math.PI / 2, 0);
      b.box(VC.solid, '#101014', f - s * 1.1, 0.03, i.z, 2.1, 0.04, L - 0.2);
      if (chance(0.35)) K.windowTree(b, f - s * 0.14, i.z - (zd - i.z) * 0.7, s);
    } };
  K.terraces = (b, side, z0, z1) => buildingRow(b, side, [K.terraceType], { x0: 12.6, depth: [10, 14], gap: [0, 0.05], z0, z1, setback: [0, 0.1] });

  // Regent Street: Portland stone, shopfronts under gilt fascias, a snowy mansard with dormers, the odd theatre
  K.shopFront = (b, i, sign = true) => {
    const s = i.side, L = Math.min(i.len - 1.2, 14);
    b.add(K.tiled(Math.max(1, Math.round(L / 5)), randi(0, 3), 4), K.shopWinMat, i.face - s * 0.04, 1.75, i.z, L, 3.1, 1, 0, -s * Math.PI / 2, 0);
    b.box(VC.solid, '#1a1a1e', i.face - s * 0.12, 3.75, i.z, 0.22, 0.75, i.len - 0.2);
    if (sign) b.add(planeUV(pick(K.shopRects)), K.shopMat, i.face - s * 0.24, 3.75, i.z, Math.min(6, L * 0.6), 0.6, 1, 0, -s * Math.PI / 2, 0);
  };
  K.theatre = (b, i) => {   // marquee canopy fringed with bulbs, and a vertical sign
    const s = i.side, L = Math.min(i.len - 2, 10), xc = i.face - s * 1.4;
    b.box(VC.solid, '#1a1a1e', xc, 4.3, i.z, 2.8, 0.5, L);
    b.box(VC.glow, hdr('#fff2d0', 1.2), xc, 4.02, i.z, 2.6, 0.04, L - 0.2);
    for (let dz = -L / 2; dz <= L / 2; dz += 0.5) b.sph(VC.glow, hdr('#ffe08a', 2.6), i.face - s * 2.82, 4.3, i.z + dz, 0.07, true);
    for (let dx = 0.4; dx < 2.8; dx += 0.5) for (const e of [-1, 1]) b.sph(VC.glow, hdr('#ffe08a', 2.6), i.face - s * dx, 4.3, i.z + e * L / 2, 0.07, true);
    b.add(planeUV(K.neonRects[0]), K.neonMat, i.face - s * 0.15, 7.5, i.z, 6, 1.5, 1, 0, -s * Math.PI / 2, 0);
    K.shopFront(b, i, false);
  };
  K.westType = { mat: K.stoneMat, tex: K.stone, colors: ['#ffffff', '#f4ecdc', '#ece4d4', '#f8f0e4'], w: [16, 24], h: [19, 23], weight: 1, cellW: 2.0, cellH: 3.4,
    roof: (b, i) => {
      const s = i.side;
      b.box(VC.solid, '#ddd2bc', i.face - s * 0.3, i.h + 0.3, i.z, 0.8, 0.6, i.len);
      b.box(VC.solid, SNOW, i.face - s * 0.32, i.h + 0.66, i.z, 0.9, 0.12, i.len + 0.02);
      b.add(G.box, VC.solid, i.face + s * 1.3, i.h + 1.6, i.z, 0.3, 3.6, i.len - 0.4, 0, 0, -s * 0.42, SNOW_ROOF);
      b.block(VC.solid, '#3a3e48', i.x + s * 0.95, i.h, i.z, i.d - 1.9, 3.2, i.len - 0.4);
      b.box(VC.solid, SNOW, i.x + s * 0.95, i.h + 3.25, i.z, i.d - 1.9, 0.1, i.len - 0.4);
      for (let dz = -i.len / 2 + 2; dz < i.len / 2 - 1.5; dz += 3.6) {
        b.block(VC.solid, '#e6dcc6', i.face + s * 1.0, i.h + 0.6, i.z + dz, 1.0, 1.6, 1.3);
        b.box(VC.glow, hdr(pick(WARM), chance(0.6) ? 0.9 : 0.15), i.face + s * 0.48, i.h + 1.3, i.z + dz, 0.04, 0.9, 0.7);
        b.box(VC.solid, SNOW, i.face + s * 1.0, i.h + 2.25, i.z + dz, 1.1, 0.12, 1.4);
      }
    },
    front: (b, i) => {
      if (chance(0.18)) K.theatre(b, i); else K.shopFront(b, i);
      K.bulbLine(b, i.face - i.side * 0.36, 4.78, i.z, i.side, i.len - 0.6);   // a string of lights along the first-floor cornice
      for (let dz = -i.len / 2 + 1.5; dz < i.len / 2 - 1; dz += 3) { b.sph(VC.solid, '#1f4a2a', i.face - i.side * 0.32, 4.7, i.z + dz, 0.22, true); b.box(VC.solid, '#c8202c', i.face - i.side * 0.45, 4.5, i.z + dz, 0.08, 0.2, 0.26); }
      if (chance(0.3)) K.flag(b, i.face - i.side * 1.1, 9.5, i.z + rand(-i.len / 3, i.len / 3), i.side);
    } };
  K.westRow = (b, side, z0, z1) => buildingRow(b, side, [K.westType], { x0: 11.3, depth: [12, 16], gap: [0, 0.2], z0, z1, setback: [0, 0.3] });

  // red-brick Victorian pubs and shops
  K.brickType = { mat: K.brickMat, tex: K.brick, colors: ['#ffffff', '#e8d0c8', '#f0e0d8', '#d8c0b0'], w: [7, 12], h: [10.5, 13], weight: 1, cellW: 2.1, cellH: 3.2,
    roof: (b, i) => {
      b.box(VC.solid, '#d8ccb6', i.face - i.side * 0.15, i.h + 0.25, i.z, 0.45, 0.5, i.len);
      b.box(VC.solid, SNOW, i.face - i.side * 0.16, i.h + 0.56, i.z, 0.5, 0.12, i.len + 0.02);
      const xc = i.x + rand(-2, 2), zc = i.z + rand(-i.len / 3, i.len / 3);
      b.block(VC.solid, '#7a3a2a', xc, i.h, zc, 1.2, 1.8, 1.2);
      b.box(VC.solid, SNOW, xc, i.h + 1.86, zc, 1.3, 0.12, 1.3);
      for (let k = 0; k < 2; k++) b.cyl(VC.solid, '#b0603e', xc, i.h + 2.1, zc - 0.25 + k * 0.5, 0.12, 0.5, 'cyl8');
    },
    front: (b, i) => {
      const s = i.side;
      if (chance(0.55)) K.pubFront(b, i);
      else {
        K.shopFront(b, i);
        if (chance(0.5)) b.add(G.box, VC.solid, i.face - s * 0.9, 3.3, i.z, 1.8, 0.08, Math.min(i.len - 1, 8), 0, 0, s * 0.3, pick(['#123a26', '#5a1418', '#16224a', '#c8a030']));
      }
      if (chance(0.25)) K.streetSign(b, i.face - s * 0.06, 3.0, i.z + rand(-i.len / 3, i.len / 3), s);
    } };
  K.pubFront = (b, i) => {   // painted fascia with gilt letters, etched windows glowing amber, a swinging sign and holly baskets
    const s = i.side, L = i.len - 0.6;
    b.box(VC.solid, pick(['#123a26', '#4a1418', '#141a30', '#161616']), i.face - s * 0.1, 1.9, i.z, 0.2, 3.8, L);
    b.box(VC.glow, hdr(pick(['#ffb860', '#ffc878', '#ffa850']), 0.6), i.face - s * 0.22, 1.7, i.z, 0.04, 2.2, L - 1.2);
    for (let dz = -L / 2 + 1.2; dz < L / 2 - 0.6; dz += 1.5) b.box(VC.solid, '#2a1a10', i.face - s * 0.24, 1.7, i.z + dz, 0.04, 2.2, 0.12);
    b.add(planeUV(pick(K.pubRects)), K.pubMat, i.face - s * 0.22, 3.42, i.z, Math.min(7, L - 0.6), 0.6, 1, 0, -s * Math.PI / 2, 0);
    const zs = i.z + pick([-1, 1]) * (L / 2 - 0.8);
    b.box(VC.metal, '#1a1a1e', i.face - s * 0.8, 5.0, zs, 1.6, 0.06, 0.06);
    b.add(planeUV(pick(K.pubSignRects)), K.pubSignMat, i.face - s * 1.15, 4.2, zs, 1.1, 1.45, 1, 0, 0, 0);
    for (const dz of [-L / 3, L / 3]) {
      b.cyl(VC.metal, '#1a1a1e', i.face - s * 0.5, 4.2, i.z + dz, 0.02, 0.6);
      b.sph(VC.solid, '#1f4a2a', i.face - s * 0.5, 3.85, i.z + dz, 0.38, true);
      for (let k = 0; k < 5; k++) b.sph(VC.glow, hdr(k % 2 ? '#ff3a3a' : '#ffd890', 2.4), i.face - s * (0.5 + rand(-0.3, 0.3)), 3.85 + rand(-0.25, 0.25), i.z + dz + rand(-0.3, 0.3), 0.045, true);
    }
    K.lantern(b, i.face - s * 0.35, 3.1, i.z - L / 2 + 0.3); K.lantern(b, i.face - s * 0.35, 3.1, i.z + L / 2 - 0.3);
  };
  K.brickRow = (b, side, z0, z1) => buildingRow(b, side, [K.brickType, { ...K.brickType, mat: K.yellowMat, tex: K.yellow, colors: ['#ffffff', '#f0e8d8'], weight: 0.5 }], { x0: 11, depth: [10, 14], gap: [0, 0.3], z0, z1 });

  // the City: glass towers between Portland-stone banks with columned porticoes
  K.portico = (b, x, z, side, len, h = 8) => {
    const n = Math.max(4, Math.min(8, Math.round(len / 2.6))), span = len - 1.2;
    b.box(VC.solid, '#e6dcc6', x - side * 1.6, 0.4, z, 3.6, 0.8, len);
    for (let k = 0; k < n; k++) b.cyl(VC.solid, '#efe6d2', x - side * 2.8, 0.8 + h / 2, z - span / 2 + (span * k) / (n - 1), 0.42, h, 'cyl');
    b.box(VC.solid, '#e6dcc6', x - side * 1.6, h + 1.3, z, 3.4, 1.0, len);
    b.add(PED, VC.solid, x - side * 1.6, h + 1.8, z, len, 2.2, 3.2, 0, Math.PI / 2, 0, '#e6dcc6');
    b.add(PED, VC.solid, x - side * 1.6, h + 1.78, z, len + 0.35, 2.4, 3.0, 0, Math.PI / 2, 0, SNOW);
    b.box(VC.glow, hdr('#ffe0b0', 0.7), x - side * 0.05, 3.2, z, 0.05, 5.0, len * 0.5);
  };
  K.cityTypes = [
    { mat: K.glassMat, tex: K.glass, colors: ['#ffffff', '#c9d6ff', '#a9b8d9'], w: [14, 22], h: [28, 54], weight: 1.1, cellW: 1.3, cellH: 2.6,
      roof: (b, i) => { for (const dz of [-i.len / 2, i.len / 2]) b.box(VC.glow, hdr('#bfe4ff', 1.3), i.x, i.h + 0.1, i.z + dz, i.d, 0.12, 0.12); b.box(VC.solid, SNOW, i.x, i.h + 0.05, i.z, i.d - 0.2, 0.1, i.len - 0.2); b.sph(VC.glow, hdr('#ff2a2a', 4), i.x, i.h + 4, i.z, 0.3); },
      front: (b, i) => { if (chance(0.3)) K.ledScreen(b, i.face - i.side * 0.15, rand(8, 14), i.z, i.side, Math.min(10, i.len - 2), 5.6); else if (chance(0.3)) K.neon(b, i.face - i.side * 0.1, rand(6, 10), i.z, i.side, Math.min(7, i.len - 2)); K.shopFront(b, i, false); } },
    { mat: K.stoneMat, tex: K.stone, colors: ['#ffffff', '#f0e8d8'], w: [16, 22], h: [18, 24], weight: 0.9, cellW: 2.0, cellH: 3.4,
      roof: (b, i) => { b.box(VC.solid, '#ddd2bc', i.face - i.side * 0.3, i.h + 0.3, i.z, 0.8, 0.6, i.len); b.box(VC.solid, SNOW, i.x, i.h + 0.05, i.z, i.d - 0.2, 0.1, i.len - 0.2); },
      front: (b, i) => { if (chance(0.6)) K.portico(b, i.face, i.z, i.side, Math.min(i.len - 2, 14)); else K.shopFront(b, i); } },
  ];
  K.cityRow = (b, side, z0, z1) => buildingRow(b, side, K.cityTypes, { x0: 12, depth: [12, 16], gap: [0.4, 1.6], z0, z1 });

  // ---------- street furniture ----------
  K.lantern = (b, x, y, z) => { b.cyl(VC.metal, '#1a1a1e', x, y + 0.35, z, 0.02, 0.3); b.box(VC.glow, hdr('#ffcf8a', 2.0), x, y, z, 0.22, 0.34, 0.22); b.add(G.cone4, VC.metal, x, y + 0.24, z, 0.36, 0.16, 0.36, 0, 0, 0, '#1a1a1e'); };
  K.vicLamp = (b, x, z, wreath = false) => {   // Westminster-pattern cast-iron lamp: fluted base, ladder bar, lantern and crown
    b.cyl(VC.metal, '#16181c', x, 0.45, z, 0.2, 0.9, 'cyl8');
    b.cyl(VC.metal, '#16181c', x, 2.3, z, 0.08, 3.0, 'cyl8');
    b.box(VC.metal, '#16181c', x, 3.3, z, 0.07, 0.07, 0.8);
    b.box(VC.glow, hdr('#ffd28a', 1.35), x, 4.05, z, 0.34, 0.5, 0.34);
    for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) b.box(VC.metal, '#16181c', x + dx, 4.05, z + dz, 0.04, 0.54, 0.04);
    b.add(G.cone4, VC.metal, x, 4.5, z, 0.62, 0.36, 0.62, 0, 0, 0, '#16181c');
    b.add(G.cone4, VC.solid, x, 4.56, z, 0.5, 0.2, 0.5, 0, 0, 0, SNOW);
    b.cyl(VC.metal, '#16181c', x, 4.85, z, 0.03, 0.3);
    if (wreath) K.wreath(b, x, 2.6, z + 0.1, 0);
  };
  K.dolphinLamp = (b, x, z) => {   // the Embankment's lamp standards, dolphins coiled round the base
    b.cyl(VC.metal, '#1c2a26', x, 0.7, z, 0.26, 1.4, 'cyl8');
    for (const a of [0, Math.PI]) b.add(G.sph, VC.metal, x + Math.cos(a) * 0.24, 0.9, z + Math.sin(a) * 0.24, 0.24, 1.2, 0.24, 0.35, a, 0.3, '#2a3a34');
    b.cyl(VC.metal, '#1c2a26', x, 2.6, z, 0.09, 2.6, 'cyl8');
    b.sph(VC.glow, hdr('#ffe0a8', 1.6), x, 4.2, z, 0.3);
    b.add(G.cone8, VC.metal, x, 4.62, z, 0.5, 0.3, 0.5, 0, 0, 0, '#1c2a26');
    b.add(G.cone8, VC.solid, x, 4.68, z, 0.4, 0.16, 0.4, 0, 0, 0, SNOW);
  };
  K.lightChain = (b, x, z0, z1, y = 3.9) => {   // the "chain of lights" strung between the lamps
    const n = Math.max(4, Math.round(Math.abs(z1 - z0) / 0.8));
    wire(b, x, y, z0, x, y, z1, 0.45, { color: '#1a1a1e', t: 0.025, n: 6 });
    for (let k = 1; k < n; k++) { const s = k / n; b.sph(VC.glow, hdr('#fff0c8', 2.2), x, y - 0.45 * 4 * s * (1 - s) - 0.08, z0 + (z1 - z0) * s, 0.07, true); }
  };
  K.phoneBox = (b, x, z, ry = 0) => {   // the K6 kiosk
    b.block(VC.solid, '#c81a1e', x, 0, z, 1.0, 2.45, 1.0, ry);
    b.block(VC.solid, '#c81a1e', x, 2.45, z, 1.12, 0.2, 1.12, ry);
    b.add(G.sph, VC.solid, x, 2.68, z, 1.0, 0.36, 1.0, 0, ry, 0, '#c81a1e');
    for (let k = 0; k < 4; k++) {
      const a = ry + (k * Math.PI) / 2, nx = Math.sin(a), nz = Math.cos(a);
      b.add(G.plane, K.kioskMat, x + nx * 0.505, 1.25, z + nz * 0.505, 0.72, 1.7, 1, 0, a, 0);
      b.add(G.plane, K.telMat, x + nx * 0.565, 2.55, z + nz * 0.565, 0.78, 0.15, 1, 0, a, 0);
    }
  };
  K.pillarBox = (b, x, z) => {
    b.cyl(VC.solid, '#141414', x, 0.08, z, 0.33, 0.16);
    b.cyl(VC.solid, '#c81a1e', x, 0.8, z, 0.3, 1.3);
    b.add(G.sph, VC.solid, x, 1.45, z, 0.66, 0.32, 0.66, 0, 0, 0, '#c81a1e');
    b.add(G.sph, VC.solid, x, 1.5, z, 0.5, 0.18, 0.5, 0, 0, 0, SNOW);
    b.box(VC.solid, '#141414', x, 1.22, z, 0.62, 0.05, 0.25);
    b.box(VC.solid, '#d9b44a', x, 0.95, z, 0.61, 0.16, 0.18);
  };
  K.belisha = (b, x, z) => {   // black-and-white pole under a blinking amber globe
    for (let k = 0; k < 8; k++) b.cyl(VC.solid, k % 2 ? '#141414' : '#f4f4f0', x, 0.16 + k * 0.32, z, 0.06, 0.32, 'cyl8');
    b.sph(K.amber, 0xffffff, x, 2.85, z, 0.22);
  };
  K.bench = (b, x, z, side) => {
    for (const dz of [-0.8, 0.8]) b.block(VC.metal, '#1a1a1e', x, 0, z + dz, 0.5, 0.45, 0.08);
    b.box(VC.solid, '#1f3a2a', x, 0.47, z, 0.48, 0.06, 1.9);
    b.box(VC.solid, '#1f3a2a', x + side * 0.24, 0.8, z, 0.06, 0.5, 1.9);
    b.box(VC.solid, SNOW, x, 0.53, z, 0.46, 0.05, 1.86);
  };
  K.bollard = (b, x, z) => { b.cyl(VC.solid, '#141414', x, 0.45, z, 0.12, 0.9, 'cyl8'); b.cyl(VC.metal, '#c8a030', x, 0.75, z, 0.13, 0.08, 'cyl8'); b.sph(VC.solid, SNOW, x, 0.92, z, 0.12, true); };
  K.streetSign = (b, x, y, z, side, i = randi(0, STREETS.length - 1)) => b.add(planeUV(K.signRects[i]), K.signMat, x, y, z, 2.2, 0.48, 1, 0, -side * Math.PI / 2, 0);
  K.roundel = (b, x, y, z, ry, size = 1.2) => b.add(G.plane, K.roundelMat, x, y, z, size, size, 1, 0, ry, 0);
  K.tubeEntrance = (b, x, z, side) => {   // stairs down to the Underground behind railings, the roundel on a post
    b.box(VC.solid, '#0c0c10', x, 0.03, z, 2.2, 0.04, 5.0);
    for (let k = 0; k < 6; k++) b.box(VC.glow, hdr('#d8e4ff', 0.25 + k * 0.05), x, 0.05, z + 2.2 - k * 0.8, 1.8, 0.02, 0.1);
    for (const dx of [-1.15, 1.15]) b.add(G.plane, K.railMat, x + dx, 0.55, z, 5.0, 1.1, 1, 0, Math.PI / 2, 0);
    b.add(G.plane, K.railMat, x, 0.55, z - 2.5, 2.3, 1.1, 1, 0, 0, 0);
    for (const dx of [-1.15, 1.15]) b.cyl(VC.metal, '#16181c', x + dx, 1.3, z + 2.5, 0.05, 2.6, 'cyl8');
    b.add(G.plane, K.ugMat, x, 2.4, z + 2.52, 2.3, 0.42, 1);
    b.cyl(VC.metal, '#16181c', x - side * 1.15, 2.95, z + 2.5, 0.05, 0.7, 'cyl8');
    K.roundel(b, x - side * 1.15, 3.6, z + 2.5, -side * 0.6, 1.1);
  };
  K.cab = (b, x, z, ry = 0) => {   // the black taxi: rounded body, yellow TAXI light
    const f = (dx, dz) => [x + Math.cos(ry) * dx + Math.sin(ry) * dz, z - Math.sin(ry) * dx + Math.cos(ry) * dz];
    b.block(VC.metal, '#141418', x, 0.3, z, 1.85, 0.8, 4.4, ry);
    b.block(VC.metal, '#141418', ...((p) => [p[0], 1.1, p[1]])(f(0, -0.2)), 1.7, 0.72, 2.5, ry);
    b.add(G.box, VC.glow, ...((p) => [p[0], 1.45, p[1]])(f(0, -0.2)), 1.72, 0.36, 2.0, 0, ry, 0, hdr('#9fb4d8', 0.25));
    b.add(G.box, VC.glow, ...((p) => [p[0], 1.52, p[1]])(f(0, 1.06)), 1.5, 0.42, 0.03, 0, ry, 0, hdr('#9fb4d8', 0.35));   // windscreen
    b.add(G.sph, VC.metal, ...((p) => [p[0], 0.95, p[1]])(f(0, 1.6)), 1.84, 0.5, 1.6, 0, ry, 0, '#141418');   // the rounded bonnet
    b.add(G.box, VC.glow, ...((p) => [p[0], 1.88, p[1]])(f(0, 0.5)), 0.42, 0.12, 0.16, 0, ry, 0, hdr('#ffb400', 2.2));
    for (const dx of [-0.62, 0.62]) b.add(G.cyl, VC.glow, ...((p) => [p[0], 0.75, p[1]])(f(dx, 2.21)), 0.24, 0.04, 0.24, Math.PI / 2, ry, 0, hdr('#fff4d6', 2.4));
    for (const dz of [-1.4, 1.4]) for (const dx of [-0.82, 0.82]) b.add(G.cyl, VC.solid, ...((p) => [p[0], 0.32, p[1]])(f(dx, dz)), 0.6, 0.24, 0.6, 0, ry, Math.PI / 2, '#0c0c0e');
    b.add(G.box, VC.solid, ...((p) => [p[0], 1.49, p[1]])(f(0, -0.2)), 1.6, 0.06, 2.3, 0, ry, 0, SNOW);
  };
  K.bus = (b, x, z, ry = 0) => {   // a red Routemaster: two decks of lit windows, the cream band, the blind
    const f = (dx, dz) => [x + Math.cos(ry) * dx + Math.sin(ry) * dz, z - Math.sin(ry) * dx + Math.cos(ry) * dz];
    const at3 = (dx, y, dz) => { const p = f(dx, dz); return [p[0], y, p[1]]; };
    b.block(VC.solid, '#d01e24', x, 0.35, z, 2.45, 4.0, 8.4, ry);
    b.add(G.box, VC.solid, ...at3(0, 2.42, 0), 2.47, 0.14, 8.42, 0, ry, 0, '#e8dcc0');
    for (const sx of [-1, 1]) for (const [y, h] of [[1.55, 0.95], [3.2, 0.85]]) {
      for (let k = 0; k < 5; k++) b.add(G.box, VC.glow, ...at3(sx * 1.235, y, -3.2 + k * 1.55), 0.03, h, 1.25, 0, ry, 0, hdr('#ffe6c0', 0.9));
    }
    b.add(G.box, VC.glow, ...at3(0, 1.6, 4.21), 2.1, 1.0, 0.03, 0, ry, 0, hdr('#ffe6c0', 0.6));
    b.add(G.box, VC.glow, ...at3(0, 3.2, 4.21), 2.1, 0.8, 0.03, 0, ry, 0, hdr('#ffe6c0', 0.8));
    b.add(G.box, VC.glow, ...at3(0, 2.42, 4.22), 1.4, 0.3, 0.03, 0, ry, 0, hdr('#fff2c0', 2.2));
    for (const dx of [-0.85, 0.85]) b.add(G.cyl, VC.glow, ...at3(dx, 0.8, 4.22), 0.26, 0.04, 0.26, Math.PI / 2, ry, 0, hdr('#fff4d6', 2.6));
    for (const dz of [-2.9, 2.6]) for (const dx of [-1.0, 1.0]) b.add(G.cyl, VC.solid, ...at3(dx, 0.48, dz), 0.96, 0.3, 0.96, 0, ry, Math.PI / 2, '#0c0c0e');
    b.add(G.box, VC.solid, ...at3(0, 4.4, 0), 2.3, 0.1, 8.2, 0, ry, 0, SNOW);
  };
  K.chalet = (b, x, z, side, i = randi(0, STALLS.length - 1)) => {   // Christmas market hut: lit counter, snowy roof, fairy lights
    b.block(VC.solid, '#5a3e28', x + side * 0.6, 0, z, 1.6, 2.5, 3.0);
    b.block(VC.solid, '#6a4a30', x - side * 0.45, 0, z, 0.5, 1.0, 3.0);
    b.box(VC.glow, hdr('#ffd08a', 1.1), x - side * 0.23, 1.75, z, 0.05, 1.3, 2.7);
    b.add(PED, VC.solid, x + side * 0.35, 2.5, z, 2.6, 1.1, 3.4, 0, 0, 0, '#4a3222');
    b.add(PED, VC.solid, x + side * 0.35, 2.48, z, 2.8, 1.2, 3.3, 0, 0, 0, SNOW_ROOF);
    b.add(planeUV(K.stallRects[i]), K.stallMat, x - side * 0.96, 2.62, z, 2.2, 0.42, 1, 0, -side * Math.PI / 2, 0);
    for (let k = 0; k <= 8; k++) b.sph(VC.glow, hdr(pick(['#ffd890', '#ff4a4a', '#ffd890', '#6ab0ff']), 2.4), x - side * 0.9, 2.44, z - 1.6 + k * 0.4, 0.05, true);
    for (let k = 0; k < 5; k++) b.box(VC.solid, pick(['#c8202c', '#ffd23d', '#2a6ad8', '#f4f0ea', '#1f6a3a']), x - side * 0.45, 1.1, z - 1.1 + k * 0.55, 0.3, 0.2, 0.3);
    b.box(VC.solid, '#1f4a2a', x - side * 0.92, 2.32, z, 0.2, 0.16, 3.0);
  };
  K.snowman = (b, x, z, ry = rand(0, Math.PI * 2)) => {
    b.sph(VC.solid, '#f4f8ff', x, 0.5, z, 0.55); b.sph(VC.solid, '#f4f8ff', x, 1.25, z, 0.4); b.sph(VC.solid, '#f4f8ff', x, 1.85, z, 0.28);
    const fx = Math.sin(ry), fz = Math.cos(ry);
    for (const s of [-1, 1]) b.sph(VC.solid, '#141414', x + fx * 0.25 + fz * s * 0.1, 1.92, z + fz * 0.25 - fx * s * 0.1, 0.035, true);
    b.add(G.cone8, VC.solid, x + fx * 0.36, 1.84, z + fz * 0.36, 0.08, 0.3, 0.08, Math.PI / 2, ry, 0, '#ff7a1a');
    b.add(G.tor, VC.solid, x, 1.58, z, 0.62, 0.62, 1.4, Math.PI / 2, 0, 0, '#c8202c');
    b.cyl(VC.solid, '#141414', x, 2.1, z, 0.26, 0.04); b.cyl(VC.solid, '#141414', x, 2.3, z, 0.17, 0.38);
    for (const s of [-1, 1]) beam(b, VC.solid, x + fz * s * 0.35, 1.3, z - fx * s * 0.35, x + fz * s * 0.85, 1.65, z - fx * s * 0.85, 0.04, '#4a3020');
    for (let k = 0; k < 3; k++) b.sph(VC.solid, '#141414', x + fx * 0.4, 1.1 + k * 0.17, z + fz * 0.4, 0.035, true);
  };
  K.carolers = (b, x, z, side) => {   // Victorian carol singers round a lantern on a pole
    for (let k = 0; k < 5; k++) {
      const a = -0.9 + k * 0.45, px = x - side * Math.cos(a) * 1.5, pz = z + Math.sin(a) * 1.5;
      K.person(b, px, pz, { coat: pick(['#5a1418', '#1a2a4a', '#2a3a2a', '#3a2a3a', '#4a3a2a']), hat: k % 2 ? 'top' : 'bonnet', scarf: '#c8202c' });
      b.box(VC.solid, '#f4f0e0', px + side * 0.2, 1.35, pz, 0.05, 0.22, 0.3);
    }
    b.cyl(VC.metal, '#2a2a2e', x - side * 0.4, 1.3, z, 0.03, 2.6);
    b.box(VC.glow, hdr('#ffd28a', 2.2), x - side * 0.4, 2.7, z, 0.22, 0.3, 0.22);
  };
  K.brassBand = (b, x, z, side) => {   // a Salvation Army band playing carols, the red collecting kettle in front
    for (let k = 0; k < 4; k++) {
      const pz = z - 1.8 + k * 1.2;
      K.person(b, x, pz, { coat: '#14182e', hat: 'cap', scarf: null });
      if (k % 2) { b.add(G.tor, VC.metal, x - side * 0.3, 1.3, pz, 0.5, 0.5, 0.5, 0, Math.PI / 2, 0, '#e8b840'); b.cyl(VC.metal, '#e8b840', x - side * 0.3, 1.7, pz, 0.12, 0.4); }
      else b.add(G.cyl, VC.metal, x - side * 0.45, 1.5, pz, 0.08, 0.6, 0.08, 0, 0, side * 1.2, '#e8b840');
    }
    b.cyl(VC.solid, '#c8202c', x - side * 1.2, 0.85, z, 0.25, 0.4);
    for (const dz of [-0.4, 0.4]) beam(b, VC.metal, x - side * 1.2, 0, z + dz, x - side * 1.2, 0.7, z, 0.03, '#3a3a3e');
  };
  K.flag = (b, x, y, z, side, w = 1.6) => {   // a Union flag hanging from a short pole out from a facade
    b.box(VC.metal, '#c8c8cc', x + side * 0.2, y, z, 1.9, 0.05, 0.05);
    b.sph(VC.metal, '#d9b44a', x - side * 0.78, y, z, 0.06, true);
    b.add(G.plane, K.flagMat, x + side * 0.05, y - w * 0.27, z, w, w * 0.5, 1);
  };
  // Christmas lights across the street, all hung above the jetpack's flight line
  K.angel = (b, z) => {
    for (const s of [-1, 1]) wire(b, s * 11, 21.6, z, s * 1.5, 21.8, z, 0.3, { color: '#1a1a1e', t: 0.03, n: 4 });
    b.add(G.plane, K.angelMat, 0, 17.6, z, 17, 8.5, 1);
  };
  K.garland = (b, z, y = 15) => {   // a sagging string of bulbs, snowflakes hanging clear of the jetpack's line, a star on top
    wire(b, -11, y, z, 11, y, z, 1.0, { color: '#1a1a1e', t: 0.03, n: 10 });
    for (let k = 1; k < 24; k++) { const s = k / 24; b.sph(VC.glow, hdr(k % 3 ? '#fff0c8' : '#bfe4ff', 2.4), -11 + 22 * s, y - 4 * s * (1 - s) - 0.1, z, 0.09, true); }
    for (const s of [0.2, 0.8]) b.add(G.plane, K.flakeMat, -11 + 22 * s, y - 4 * s * (1 - s) - 1.2, z, 1.9, 1.9, 1);
    b.add(G.plane, K.flakeMat, 0, y + 0.4, z, 2.6, 2.6, 1);
  };
  K.festoon = (b, z, y = 11.8, sag = 0.6) => {
    wire(b, -11, y, z, 11, y, z, sag, { color: '#1a1a1e', t: 0.03, n: 10 });
    for (let k = 1; k < 18; k++) { const s = k / 18; b.sph(VC.glow, hdr(pick(['#ffd28a', '#ff4a4a', '#fff0c0', '#6ab0ff', '#4aff8a']), 2.4), -11 + 22 * s, y - sag * 4 * s * (1 - s) - 0.12, z, 0.1, true); }
  };
  // ---------- people in winter coats ----------
  const COATS = ['#1a1c26', '#2a2a30', '#3a2a24', '#a8845a', '#5a1a20', '#1f2a3a', '#2f3a2f', '#6a6a70', '#c8202c', '#1a3a5a', '#e8e2d6'];
  K.person = (b, x, z, { s = rand(0.92, 1.06), coat = pick(COATS), hat = pick([null, null, 'beanie', 'beanie', 'santa', null]), scarf = chance(0.55) ? pick(['#c8202c', '#1f6a3a', '#f2c230', '#e8e2d6', '#2a5ad8']) : null, bags = false } = {}) => {
    b.add(G.cyl8, VC.solid, x, 0.5 * s, z, 0.3 * s, 1.0 * s, 0.24 * s, 0, 0, 0, pick(['#1c1c22', '#2a3a5a', '#3a3030']));
    b.add(G.cyl8, VC.solid, x, 1.05 * s, z, 0.46 * s, 0.5 * s, 0.32 * s, 0, 0, 0, coat);
    b.box(VC.solid, coat, x, 1.32 * s, z, 0.46 * s, 0.5 * s, 0.28 * s);
    if (scarf) b.box(VC.solid, scarf, x, 1.6 * s, z, 0.34 * s, 0.1 * s, 0.3 * s);
    b.sph(VC.solid, pick(['#e8c4a0', '#d9a07a', '#a87a5a', '#7a5238', '#f0d0b0']), x, 1.76 * s, z, 0.15 * s, true);
    if (hat === 'beanie') b.sph(VC.solid, pick(['#c8202c', '#1f2a3a', '#e8e2d6', '#1f6a3a', '#f2c230']), x, 1.86 * s, z, 0.155 * s, true);
    else if (hat === 'santa') { b.add(G.cone8, VC.solid, x, 2.0 * s, z, 0.3 * s, 0.34 * s, 0.3 * s, 0, 0, 0.3, '#d8202a'); b.cyl(VC.solid, '#f4f4f0', x, 1.84 * s, z, 0.16 * s, 0.07 * s); b.sph(VC.solid, '#f4f4f0', x + 0.06, 2.14 * s, z, 0.05 * s, true); }
    else if (hat === 'top') { b.cyl(VC.solid, '#141414', x, 1.9 * s, z, 0.18 * s, 0.03 * s); b.cyl(VC.solid, '#141414', x, 2.02 * s, z, 0.12 * s, 0.24 * s); }
    else if (hat === 'bonnet') b.add(G.sph, VC.solid, x, 1.84 * s, z - 0.02, 0.36 * s, 0.3 * s, 0.36 * s, 0, 0, 0, pick(['#5a1418', '#2a3a2a', '#e8e2d6']));
    else if (hat === 'cap') { b.cyl(VC.solid, '#14182e', x, 1.9 * s, z, 0.16 * s, 0.1 * s); b.box(VC.solid, '#c8202c', x, 1.88 * s, z, 0.33 * s, 0.03 * s, 0.33 * s); }
    else b.sph(VC.solid, pick(['#141414', '#e8c878', '#6a4a2a', '#2a1a12', '#8a3a1a']), x, 1.82 * s, z + 0.02, 0.16 * s, true);
    if (bags) for (const d of [-1, 1]) if (chance(0.6)) b.box(VC.solid, pick(['#c8202c', '#1f6a3a', '#f2c230', '#f4f4f0', '#141414', '#7a4ad8']), x, 0.72 * s, z + d * 0.3, 0.12, 0.4, 0.3);
  };
  K.crowd = (b, x0, x1, z0, z1, n, opts = {}) => { for (let i = 0; i < n; i++) K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1), { bags: opts.bags && chance(0.6) }); };

  // ---------- the Thames ----------
  const reflMats = new Map();
  K.refl = (b, x, z, len, w, col, y) => {   // a light's reflection on the water, pointing at the approaching runner
    let m = reflMats.get(col);
    if (!m) reflMats.set(col, (m = basic({ color: hdr(col, 0.3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
    const dx = -x, dz = 40, d = Math.hypot(dx, dz), L = Math.min(len, ((Math.abs(x) - 13) * d) / Math.abs(dx));
    if (L > 2) b.add(G.plane, m, x + (dx / d) * L / 2, y, z + (dz / d) * L / 2, w, L, 1, -Math.PI / 2, Math.atan2(-dx, -dz), 0);
  };
  K.embankment = (b, s, wy = -2.2) => {   // granite river wall with its parapet, the water far below
    b.box(VC.solid, '#7a7a80', s * (EDGE + 7.3), (wy - 0.1 + 1.0) / 2, -40, 0.9, 1.1 - wy, 80);
    b.box(VC.solid, '#9a9aa0', s * (EDGE + 7.3), 1.05, -40, 1.1, 0.12, 80);
    b.box(VC.solid, SNOW, s * (EDGE + 7.3), 1.14, -40, 1.0, 0.06, 80);
  };
  K.boat = (b, x, z, kind = pick(['clipper', 'party']), y = -2.2) => {
    if (kind === 'clipper') {   // a Thames Clipper catamaran
      for (const dx of [-1.6, 1.6]) b.block(VC.solid, '#e8eaee', x + dx, y - 0.2, z, 1.2, 1.2, 22);
      b.block(VC.solid, '#1c3f94', x, y + 0.9, z, 4.6, 0.25, 21);
      b.block(VC.solid, '#e8eaee', x, y + 1.1, z + 1, 4.2, 2.2, 15);
      b.box(VC.glow, hdr('#e8f4ff', 1.1), x, y + 2.2, z + 1, 4.24, 0.8, 14);
      b.sph(VC.glow, hdr('#ff2a2a', 3), x - 2.2, y + 3.6, z + 9, 0.15, true); b.sph(VC.glow, hdr('#39ff88', 3), x + 2.2, y + 3.6, z + 9, 0.15, true);
    } else {   // a party boat strung with lights
      b.block(VC.solid, '#1a1c22', x, y - 0.3, z, 5.5, 1.5, 26);
      b.block(VC.solid, '#e8e2d6', x, y + 1.2, z, 4.8, 2.6, 18);
      b.box(VC.glow, hdr(pick(['#ffd28a', '#ff7ab0', '#7cf8ff']), 1.2), x, y + 2.4, z, 4.84, 1.0, 17);
      for (let k = 0; k <= 16; k++) for (const dx of [-2.6, 2.6]) b.sph(VC.glow, hdr(pick(['#ffd28a', '#ff4a4a', '#6ab0ff', '#4aff8a']), 2.6), x + dx, y + 4.1 - Math.abs(k - 8) * 0.06, z - 12 + k * 1.5, 0.09, true);
    }
  };
  K.update = (t) => { K.screen.uniforms.time.value = t; K.amber.color.set('#ffa020').multiplyScalar(Math.sin(t * 4.2) > 0 ? 3.2 : 0.25); K.thames.userData.scroll.offset.y = -t * 0.02; };
  return K;
}
