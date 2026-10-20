// Sydney street kit: Paddington terraces with iron-lace balconies, sandstone pubs of The Rocks, CBD towers with vertical
// gardens, beachfront shops, light rail stops and wires, gas lamps, green-man crossings, bins with their ibis,
// cockatoos on the lamps, buskers, surfboards and the red-and-yellow flags.
import { THREE, VC, G, std, basic, hdr, windowTex, signAtlas, planeUV, canvasTex, rand, randi, pick, chance } from '../core.js';
import { facadeMat, buildingRow, EDGE, screenMat, at } from './common.js';
import { beam, wire } from './tokyo_kit.js';
import { sydneyTreeKit } from './trees.js';
import { tiledBox } from './beijing_kit.js';

const FONT = '"Chakra Petch", "Helvetica Neue", Arial, sans-serif';
const STREETS = ['GEORGE ST', 'PITT ST', 'OXFORD ST', 'MACQUARIE ST', 'CAMPBELL PDE', 'CROWN ST', 'KING ST', 'HARRIS ST'];
const PUBS = ['HOTEL', 'ALE HOUSE', 'TAVERN', 'THE ROCKS', 'BAR & GRILL', 'OYSTER BAR'];
const NEON = [
  { text: 'SURF', color: '#3dfff0', border: true }, { text: 'GELATO', color: '#ff9ad5' }, { text: 'BAR', color: '#b26bff', border: true },
  { text: 'FISH & CHIPS', color: '#ffd23d' }, { text: 'PIES', color: '#ff6a3d', border: true }, { text: 'COFFEE', color: '#ffcf8a' },
  { text: 'BOTTLE SHOP', color: '#39ff88', border: true }, { text: 'KEBAB', color: '#ff3b3b' }, { text: 'SUSHI', color: '#7cf8ff', border: true },
  { text: 'OPEN 24/7', color: '#ffe23d' }, { text: 'LIVE MUSIC', color: '#ff3df0', border: true }, { text: 'SYDNEY', color: '#00e5ff' },
];
const ADS = [
  { bg: ['#ff2a6d', '#7b2ff7'], text: 'SYDNEY', sub: 'HARBOUR CITY', icon: 'bridge' },
  { bg: ['#00c2ff', '#0040ff'], text: "SURF'S UP", sub: 'BONDI · MANLY', icon: 'waves' },
  { bg: ['#1a1440', '#5a2a8a'], text: 'VIVID', sub: 'LIGHT · MUSIC · IDEAS', icon: 'stars' },
  { bg: ['#ffb000', '#ff3d00'], text: 'MEAT PIE', sub: 'HOT & FRESH', icon: 'steam' },
  { bg: ['#12c27e', '#04402c'], text: "G'DAY", sub: 'CITY DASH', icon: 'bolt' },
  { bg: ['#141414', '#3a0a0a'], text: 'NYE', sub: 'FIREWORKS TONIGHT', icon: 'stars', fg: '#ffd23d' },
  { bg: ['#ff5fa2', '#ffd23d'], text: 'GELATO', sub: 'SUMMER SPECIAL', icon: 'bubbles' },
  { bg: ['#f2f4ff', '#a9b8ff'], text: 'SURF CLUB', sub: 'SWIM BETWEEN THE FLAGS', icon: 'flags', fg: '#c8202c' },
];

// ---------- textures ----------
function sandTex() {   // honey-gold sandstone blocks
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#c8ae70'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 20 - 20; x < w; x += 40) {
      const v = randi(-14, 14); g.fillStyle = `rgb(${206 + v},${180 + v},${118 + v})`; g.fillRect(x + 1, y + 1, 38, 14);
    }
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(120,80,40,${rand(0.05, 0.15).toFixed(2)})`; g.fillRect(rand(0, w), rand(0, h), rand(2, 8), rand(1, 3)); }
  });
}
function laceTex() {   // white cast-iron lace for verandahs
  return canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#f4f2ec'; g.lineWidth = 3;
    g.strokeRect(2, 2, w - 4, h - 4);
    for (const [cx, cy] of [[32, 32], [96, 32], [32, 96], [96, 96]]) {
      g.beginPath(); g.arc(cx, cy, 20, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(cx, cy, 9, 0, Math.PI * 2); g.stroke();
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9); g.lineTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20); g.stroke(); }
    }
    g.beginPath(); g.moveTo(64, 0); g.lineTo(64, h); g.moveTo(0, 64); g.lineTo(w, 64); g.stroke();
  }, { repeat: false });
}
function pubAtlas() {   // hanging pub boards: cream letters on dark green or maroon
  const cw = 384, ch = 128, n = PUBS.length;
  const tex = canvasTex(cw, ch * n, (g) => {
    PUBS.forEach((t, i) => {
      const y = i * ch;
      g.fillStyle = i % 2 ? '#5a1a1a' : '#1a3a2a'; g.fillRect(0, y, cw, ch);
      g.strokeStyle = '#d9b44a'; g.lineWidth = 6; g.strokeRect(10, y + 10, cw - 20, ch - 20);
      g.fillStyle = '#f2e6c8'; g.font = '700 54px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(t, cw / 2, y + ch / 2 + 4);
    });
  }, { repeat: false });
  return { tex, rects: PUBS.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / n, v1: 1 - i / n })) };
}
function streetSigns() {   // blue street-name blades
  const cw = 512, ch = 112, n = STREETS.length;
  const tex = canvasTex(cw, ch * n, (g) => {
    STREETS.forEach((t, i) => {
      const y = i * ch;
      g.fillStyle = '#1d4a8a'; g.fillRect(0, y, cw, ch);
      g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.strokeRect(8, y + 8, cw - 16, ch - 16);
      g.fillStyle = '#ffffff'; g.font = `700 56px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(t, cw / 2, y + ch / 2 + 3);
    });
  }, { repeat: false });
  return { tex, rects: STREETS.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / n, v1: 1 - i / n })) };
}
function walkTex(walk) {   // Australian pedestrian lights: green walking man, red standing man
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, w, h);
    g.fillStyle = walk ? '#39ff88' : '#ff3a3a'; g.strokeStyle = g.fillStyle; g.lineCap = 'round'; g.lineWidth = 12;
    g.beginPath(); g.arc(64, 24, 10, 0, Math.PI * 2); g.fill();
    g.beginPath();
    if (walk) { g.moveTo(62, 40); g.lineTo(58, 74); g.lineTo(42, 106); g.moveTo(58, 74); g.lineTo(78, 106); g.moveTo(60, 50); g.lineTo(40, 64); g.moveTo(60, 50); g.lineTo(82, 62); }
    else { g.moveTo(64, 40); g.lineTo(64, 76); g.lineTo(54, 108); g.moveTo(64, 76); g.lineTo(74, 108); g.moveTo(64, 48); g.lineTo(46, 74); g.moveTo(64, 48); g.lineTo(82, 74); }
    g.stroke();
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
      if (a.icon === 'bridge') { g.lineWidth = 6; g.beginPath(); g.arc(x0 + CW * 0.72, CH * 1.05, 120, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); g.fillRect(x0 + 150, CH * 0.78, 230, 6); }
      if (a.icon === 'waves') for (let k = 0; k < 5; k++) { g.lineWidth = 5; g.beginPath(); for (let x = 0; x <= CW; x += 8) g.lineTo(x0 + x, 60 + k * 36 + Math.sin(x * 0.05 + k) * 10); g.stroke(); }
      if (a.icon === 'stars') for (let k = 0; k < 14; k++) { g.font = `${randi(18, 40)}px sans-serif`; g.fillText('✦', x0 + rand(0, CW), rand(20, CH)); }
      if (a.icon === 'steam') for (let k = 0; k < 5; k++) { g.lineWidth = 6; g.beginPath(); for (let y = 30; y < 150; y += 6) g.lineTo(x0 + 250 + k * 22 + Math.sin(y * 0.08 + k) * 8, y); g.stroke(); }
      if (a.icon === 'bolt') for (let k = 0; k < 7; k++) g.fillRect(x0 + rand(0, CW), rand(0, CH), rand(60, 160), 4);
      if (a.icon === 'bubbles') for (let k = 0; k < 18; k++) { g.beginPath(); g.arc(x0 + rand(0, CW), rand(0, CH), rand(4, 22), 0, Math.PI * 2); g.fill(); }
      if (a.icon === 'flags') { g.globalAlpha = 0.9; for (const fx of [270, 330]) { g.fillStyle = '#c8202c'; g.fillRect(x0 + fx, 40, 40, 30); g.fillStyle = '#ffd23d'; g.fillRect(x0 + fx, 70, 40, 30); } }
      g.restore();
      g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = a.fg || '#ffffff';
      g.font = '900 62px "Russo One", "Arial Black", sans-serif';
      const m = g.measureText(a.text).width, sc = Math.min(1, (CW - 40) / m);
      g.save(); g.translate(x0 + 20, 128); g.scale(sc, 1); g.fillText(a.text, 0, 0); g.restore();
      g.font = `700 24px ${FONT}`; g.globalAlpha = 0.9; g.fillText(a.sub, x0 + 22, 168); g.globalAlpha = 1;
    });
  }, { repeat: false });
}

// ---------- the kit ----------
export function makeKit() {
  const K = {};
  Object.assign(K, sydneyTreeKit());
  const st = sandTex();
  K.sandMat = std({ map: st, vertexColors: true, roughness: 0.85, emissive: '#ffd9a0', emissiveMap: st, emissiveIntensity: 0.12 });
  K.sand = (b, x, y, z, w, h, d, col = 0xffffff) => b.addM(tiledBox(w, h, d, 2.4), K.sandMat, at(x, y + h / 2, z), col);
  K.laceMat = std({ map: laceTex(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.12 });
  const pb = pubAtlas();
  K.pubRects = pb.rects; K.pubMat = std({ map: pb.tex, roughness: 0.6, emissive: '#ffffff', emissiveMap: pb.tex, emissiveIntensity: 0.4, side: THREE.DoubleSide });
  const ss = streetSigns();
  K.signRects = ss.rects; K.signMat = basic({ map: ss.tex, color: hdr('#ffffff', 0.95), side: THREE.DoubleSide });
  K.walkMats = [walkTex(true), walkTex(false)].map((t) => basic({ map: t, color: hdr('#ffffff', 1.6) }));
  const neon = signAtlas(NEON.map((e) => ({ ...e, font: '"Russo One", "Arial Black", sans-serif' })), { cols: 2 });
  K.neonRects = neon.rects;
  K.neonMat = basic({ map: neon.tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hdr('#ffffff', 1.3) });
  K.screen = screenMat(adAtlas(), ADS.length, 1.3);
  K.neon = (b, x, y, z, side, w, i = randi(0, K.neonRects.length - 1)) => b.add(planeUV(K.neonRects[i]), K.neonMat, x, y, z, w, w / 4, 1, 0, -side * Math.PI / 2);
  K.ledScreen = (b, x, y, z, side, w, h) => {
    b.box(VC.solid, '#101014', x + side * 0.12, y, z, 0.2, h + 0.3, w + 0.3);
    b.add(G.plane, K.screen, x - side * 0.01, y, z, w, h, 1, 0, -side * Math.PI / 2, 0, new THREE.Color(Math.random(), rand(0.85, 1.05), 0));
  };

  // ---------- facades ----------
  K.terr = windowTex({ wall: '#e8e0d0', glass: '#14161c', lit: ['#ffd9a0', '#ffe6c0', '#ffcf8a'], litChance: 0.6, frame: '#ffffff', cols: 2, rows: 2 });
  K.terrMat = facadeMat(K.terr, { k: 0.9 });
  K.sandWin = windowTex({ wall: '#ceb274', glass: '#141210', lit: ['#ffd9a0', '#ffe6c0'], litChance: 0.5, frame: '#e8d4a8', arch: true, ledge: '#a8844a', cols: 5, rows: 6 });
  K.sandWinMat = facadeMat(K.sandWin, { k: 0.85 });
  K.glass = windowTex({ wall: '#16202e', glass: '#22344c', lit: ['#e6f2ff', '#ffffff', '#cfe4ff'], litChance: 0.42, band: true });
  K.glassMat = facadeMat(K.glass, { k: 0.8, rough: 0.25, metal: 0.6 });
  K.green = windowTex({ wall: '#2a4a2a', glass: '#1a2a24', lit: ['#e6f2ff', '#ffe6c0'], litChance: 0.35, ledge: '#4a7a3a', cols: 6 });
  K.greenMat = facadeMat(K.green, { k: 0.7 });
  K.deco = windowTex({ wall: '#e8dcc8', glass: '#14161c', lit: ['#ffe0b0', '#fff4dc', '#cfe6ff'], litChance: 0.55, frame: '#ffffff', cols: 4, rows: 3 });
  K.decoMat = facadeMat(K.deco, { k: 0.85 });

  // Paddington terrace: verandah with iron lace, a front fence and garden, chimneys and a decorated parapet
  K.terraceType = { mat: K.terrMat, tex: K.terr, colors: ['#ffffff', '#cfe4d0', '#e8d0c8', '#d0dce8', '#f0e0b8', '#d8e8d0'], w: [4.8, 5.8], h: [7.4, 8.2], weight: 1, cellW: 2.4, cellH: 3.6,
    roof: (b, i) => {
      b.box(VC.solid, '#e8e4dc', i.face - i.side * 0.1, i.h + 0.5, i.z, 0.25, 1.0, i.len);
      b.add(G.cone4, VC.solid, i.face - i.side * 0.1, i.h + 1.2, i.z, 0.6, 0.5, 0.3, 0, 0, 0, '#e8e4dc');
      b.block(VC.solid, '#7a4a3a', i.x + rand(-1, 1), i.h, i.z + i.len * 0.3, 0.7, 1.4, 0.5);
    },
    front: (b, i) => {
      const s = i.side, xv = i.face - s * 2.0, L = i.len - 0.2;
      for (const dz of [-L / 2 + 0.1, L / 2 - 0.1]) b.box(VC.solid, '#f4f2ec', xv, 3.6, i.z + dz, 0.12, 7.2, 0.12);
      b.box(VC.solid, '#e8e4dc', (xv + i.face) / 2, 3.6, i.z, 2.0, 0.18, L);
      b.add(G.box, VC.solid, (xv + i.face) / 2, 7.25, i.z, 2.2, 0.08, L, 0, 0, s * 0.18, '#8a9098');
      b.add(G.plane, K.laceMat, xv, 4.15, i.z, L - 0.3, 0.9, 1, 0, -s * Math.PI / 2, 0);
      b.add(G.plane, K.laceMat, xv, 6.75, i.z, L - 0.3, 0.5, 1, 0, -s * Math.PI / 2, 0);
      const zd = i.z + pick([-1, 1]) * (L / 2 - 1.1);
      b.box(VC.solid, pick(['#1f3a5a', '#5a1a1a', '#1a3a2a', '#2a2a2e']), i.face - s * 0.05, 1.2, zd, 0.06, 2.3, 1.0);
      b.box(VC.glow, hdr('#ffcf8a', 1.0), i.face - s * 0.07, 2.55, zd, 0.04, 0.35, 0.95);
      const xf = i.face - s * 3.2;
      b.box(VC.metal, '#1a1a1e', xf, 0.55, i.z, 0.05, 1.1, L);
      b.box(VC.metal, '#1a1a1e', xf, 1.08, i.z, 0.06, 0.05, L);
      b.box(VC.solid, '#24402a', (xf + i.face - s * 2.1) / 2, 0.25, i.z - (zd - i.z) * 0.3, 0.9, 0.5, L * 0.5);
    } };
  K.terraces = (b, side, z0, z1) => buildingRow(b, side, [K.terraceType], { x0: 12.6, depth: [10, 14], gap: [0, 0.05], z0, z1, setback: [0, 0.1] });

  // sandstone heritage block of The Rocks; the corner pub gets a lace verandah over the footpath and its hanging sign
  K.sandType = { mat: K.sandWinMat, tex: K.sandWin, colors: ['#ffffff', '#f0e0c8', '#e8d4b4'], w: [9, 14], h: [11, 16], weight: 1, cellW: 1.8, cellH: 3.2,
    roof: (b, i) => { b.box(VC.solid, '#b8945a', i.face - i.side * 0.3, i.h - 0.3, i.z, 0.7, 0.6, i.len); },
    front: (b, i) => {
      const s = i.side;
      b.box(VC.glow, hdr(pick(['#ffcf8a', '#ffb870', '#ffd9a0']), 0.7), i.face - s * 0.03, 1.7, i.z, 0.05, 2.8, i.len - 1.4);
      if (chance(0.55)) {
        const xv = i.face - s * 3.0, L = i.len - 0.4;
        for (let k = 0; k <= Math.round(L / 3); k++) b.cyl(VC.metal, '#1f2a22', xv, 1.8, i.z - L / 2 + (L * k) / Math.round(L / 3), 0.08, 3.6, 'cyl8');
        b.box(VC.solid, '#3a2a20', (xv + i.face) / 2, 3.65, i.z, 3.0, 0.14, L);
        b.add(G.plane, K.laceMat, xv, 4.3, i.z, L, 1.0, 1, 0, -s * Math.PI / 2, 0);
        b.add(G.box, VC.solid, (xv + i.face) / 2, 4.95, i.z, 3.1, 0.08, L, 0, 0, s * 0.12, '#6a7078');
        b.add(planeUV(pick(K.pubRects)), K.pubMat, xv + s * 0.4, 2.75, i.z + L / 2 - 0.6, 1.6, 0.53, 1);
        for (const dz of [-L / 3, L / 3]) K.lantern(b, xv + s * 0.6, 3.2, i.z + dz);
      }
    } };
  K.sandRow = (b, side, z0, z1) => buildingRow(b, side, [K.sandType], { x0: 11, depth: [10, 14], gap: [0.05, 0.6], z0, z1 });
  // CBD: glass towers with LED crowns, vertical-garden towers, sandstone heritage between them
  K.cbdTypes = [
    { mat: K.glassMat, tex: K.glass, colors: ['#ffffff', '#c9d6ff', '#a9b8d9'], w: [12, 20], h: [32, 70], weight: 1.5, cellW: 1.3, cellH: 2.6,
      roof: (b, i) => { for (const dz of [-i.len / 2, i.len / 2]) b.box(VC.glow, hdr('#7cf8ff', 1.3), i.x, i.h + 0.1, i.z + dz, i.d, 0.12, 0.12); b.sph(VC.glow, hdr('#ff2a2a', 4), i.x, i.h + 4, i.z, 0.3); },
      front: (b, i) => { if (chance(0.35)) K.ledScreen(b, i.face - i.side * 0.15, rand(8, 14), i.z, i.side, Math.min(10, i.len - 2), 5.6); else if (chance(0.5)) K.neon(b, i.face - i.side * 0.1, rand(6, 12), i.z, i.side, Math.min(7, i.len - 2)); K.shopGlow(b, i); } },
    { mat: K.greenMat, tex: K.green, colors: ['#ffffff', '#d8f0d0'], w: [14, 20], h: [36, 60], weight: 0.8, cellW: 1.5, cellH: 3,
      roof: (b, i) => { b.box(VC.metal, '#c9ced6', i.x - i.side * 3, i.h + 4, i.z, 1.2, 0.3, i.len * 0.9); for (let k = -1; k <= 1; k++) b.box(VC.glow, hdr('#e8f4ff', 1.4), i.x - i.side * 3, i.h + 3.7, i.z + k * i.len * 0.3, 1.0, 0.1, 1.0); },
      front: (b, i) => { for (let y = 4; y < i.h - 2; y += 3) b.box(VC.solid, pick(['#3a6a2a', '#4a7a32', '#2f5a24']), i.face - i.side * 0.5, y, i.z, 1.0, 0.7, i.len - 0.6); K.shopGlow(b, i); } },
    { ...K.sandType, h: [12, 20], weight: 0.9 },
  ];
  K.cbdRow = (b, side, z0, z1) => buildingRow(b, side, K.cbdTypes, { x0: 12, depth: [10, 16], gap: [0.3, 1.5], z0, z1 });
  // beachfront art deco shops with neon and awnings
  K.decoType = { mat: K.decoMat, tex: K.deco, colors: ['#ffffff', '#f4e0d0', '#d8ecf0', '#f0e8c8', '#e8d8f0'], w: [8, 12], h: [7, 10], weight: 1, cellW: 2.2, cellH: 3.2,
    roof: (b, i) => b.box(VC.solid, '#f4f2ec', i.face - i.side * 0.2, i.h + 0.4, i.z, 0.5, 0.8, i.len),
    front: (b, i) => {
      const s = i.side;
      b.box(VC.glow, hdr(pick(['#ffe0b0', '#d6ecff', '#ffd0e6']), 0.65), i.face - s * 0.03, 1.6, i.z, 0.05, 2.6, i.len - 1.2);
      b.add(G.box, VC.solid, i.face - s * 0.8, 3.1, i.z, 1.6, 0.1, i.len - 0.6, 0, 0, s * 0.3, pick(['#1f8aa8', '#e86a3a', '#f2c230', '#3ab8a0']));
      K.neon(b, i.face - s * 0.1, 4.6, i.z, s, Math.min(5, i.len - 1.5), pick([0, 1, 3, 4, 5, 9]));
    } };
  K.beachShops = (b, side, z0, z1) => buildingRow(b, side, [K.decoType], { x0: 11.5, depth: [10, 14], gap: [0.1, 0.8], z0, z1 });
  K.shopGlow = (b, i) => {
    b.box(VC.glow, hdr(pick(['#e6f2ff', '#ffe0b0', '#ffd0e6']), 0.55), i.face - i.side * 0.04, 1.6, i.z, 0.05, 2.8, Math.min(i.len - 0.8, 8));
    b.box(VC.solid, '#1a1a1e', i.face - i.side * 0.14, 3.3, i.z, 0.2, 0.5, i.len - 0.2);
  };

  // ---------- street furniture ----------
  K.lantern = (b, x, y, z) => { b.cyl(VC.metal, '#1a1a1e', x, y + 0.35, z, 0.02, 0.3); b.cyl(VC.glow, hdr('#ffcf8a', 2.0), x, y, z, 0.16, 0.38, 'cyl6'); };
  K.gasLamp = (b, x, z) => {   // heritage street lamp: green post, four-sided lantern
    b.cyl(VC.metal, '#1f3a2a', x, 1.9, z, 0.09, 3.8, 'cyl8');
    b.cyl(VC.metal, '#1f3a2a', x, 0.3, z, 0.18, 0.6, 'cyl8');
    b.add(G.cone4, VC.metal, x, 4.25, z, 0.55, 0.3, 0.55, 0, 0, 0, '#1f3a2a');
    b.box(VC.glow, hdr('#ffd28a', 1.25), x, 3.95, z, 0.3, 0.42, 0.3);
    for (const [dx, dz] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]]) b.box(VC.metal, '#1f3a2a', x + dx, 3.95, z + dz, 0.04, 0.46, 0.04);
    b.box(VC.metal, '#1f3a2a', x, 4.4, z, 0.44, 0.06, 0.44);
  };
  K.lamp = (b, x, z, side) => {   // modern street light
    b.cyl(VC.metal, '#6a6e76', x, 3.4, z, 0.09, 6.8, 'cyl8');
    b.box(VC.metal, '#6a6e76', x - side * 0.7, 6.8, z, 1.4, 0.1, 0.12);
    b.box(VC.glow, hdr('#fff0d0', 2.4), x - side * 1.35, 6.7, z, 0.6, 0.08, 0.3);
  };
  K.walkSignal = (b, x, z, side) => {
    b.cyl(VC.metal, '#3a3e46', x, 1.8, z, 0.07, 3.6, 'cyl8');
    b.block(VC.solid, '#e8c547', x, 1.0, z + 0.12, 0.18, 0.3, 0.12);
    const go = chance(0.5);
    b.block(VC.solid, '#1a1a1e', x, 2.6, z + 0.05, 0.44, 0.9, 0.3);
    b.add(G.plane, K.walkMats[go ? 0 : 1], x, 3.05, z + 0.21, 0.36, 0.36, 1);
    for (const [k, col] of [[0, '#ff2a2a'], [1, '#ffb020'], [2, '#19e080']]) b.cyl(VC.glow, hdr(col, (go ? k === 2 : k === 0) ? 3 : 0.25), x - side * 0.5, 3.9 - k * 0.32, z + 0.2, 0.11, 0.05, 'cyl', Math.PI / 2);
    b.block(VC.solid, '#1a1a1e', x - side * 0.5, 3.15, z + 0.05, 0.36, 1.0, 0.28);
  };
  K.streetSign = (b, x, z, i = randi(0, STREETS.length - 1), j = randi(0, STREETS.length - 1)) => {
    b.cyl(VC.metal, '#4a4e56', x, 2.5, z, 0.06, 5.0, 'cyl8');
    b.add(planeUV(K.signRects[i]), K.signMat, x, 4.75, z, 2.2, 0.48, 1);
    b.add(planeUV(K.signRects[j]), K.signMat, x, 4.25, z, 2.2, 0.48, 1, 0, Math.PI / 2, 0);
  };
  K.bin = (b, x, z, ibis = false) => {   // council wheelie bin, often guarded by an ibis
    b.block(VC.solid, '#2a4a2a', x, 0, z, 0.6, 1.0, 0.7);
    b.box(VC.solid, pick(['#f2c230', '#c8202c', '#2a6ad8']), x, 1.03, z, 0.64, 0.06, 0.74);
    if (ibis) K.ibis(b, x, 1.06, z);
  };
  K.ibis = (b, x, y, z) => {
    for (const dx of [-0.06, 0.06]) b.box(VC.solid, '#2a2a2e', x + dx, y + 0.18, z, 0.03, 0.36, 0.03);
    b.add(G.sph, VC.solid, x, y + 0.48, z, 0.28, 0.28, 0.5, 0, 0, 0, '#ecebe6');
    b.add(G.sph, VC.solid, x, y + 0.5, z + 0.22, 0.2, 0.16, 0.2, 0, 0, 0, '#1e1e22');
    beam(b, VC.solid, x, y + 0.6, z - 0.2, x, y + 0.82, z - 0.32, 0.06, '#1e1e22');
    b.sph(VC.solid, '#1e1e22', x, y + 0.86, z - 0.34, 0.07, true);
    beam(b, VC.solid, x, y + 0.84, z - 0.4, x, y + 0.66, z - 0.62, 0.025, '#1e1e22');
  };
  K.cockatoo = (b, x, y, z) => {   // sulphur-crested cockatoo
    b.add(G.sph, VC.solid, x, y + 0.2, z, 0.22, 0.34, 0.22, 0, 0, 0, '#f4f4f0');
    b.sph(VC.solid, '#f4f4f0', x, y + 0.42, z - 0.04, 0.1, true);
    b.add(G.cone, VC.solid, x, y + 0.56, z + 0.02, 0.08, 0.22, 0.06, -0.5, 0, 0, '#ffd23d');
    b.sph(VC.solid, '#2a2a2e', x, y + 0.4, z - 0.13, 0.035, true);
  };
  K.busker = (b, x, z, side) => {   // didgeridoo player sitting on the pavement
    K.person(b, x, z, { seated: true, coat: '#8a3a2a' });
    beam(b, VC.solid, x - side * 0.15, 1.05, z, x - side * 1.6, 0.15, z, 0.1, '#7a4a2a');
    for (let k = 0; k < 4; k++) b.box(VC.solid, pick(['#ffd23d', '#c8202c', '#f4f0ea']), x - side * (0.5 + k * 0.3), 0.62 - k * 0.12, z, 0.12, 0.06, 0.13);
  };
  K.lightRailStop = (b, x, z, side) => {   // shelter with a lit roof and a route sign
    b.box(VC.solid, '#c9ced6', x, 0.15, z, 2.6, 0.3, 12);
    for (const dz of [-5, 0, 5]) b.cyl(VC.metal, '#3a3e46', x + side * 1.0, 1.6, z + dz, 0.06, 3.0);
    b.box(VC.metal, '#3a3e46', x, 3.1, z, 2.6, 0.12, 11);
    b.box(VC.glow, hdr('#e8f4ff', 0.9), x, 3.0, z, 2.2, 0.05, 10);
    b.box(VC.glow, hdr('#c8202c', 1.5), x, 3.35, z + 5.6, 1.4, 0.45, 0.1);
    K.person(b, x + rand(-0.6, 0.6), z + rand(-4, 4)); K.person(b, x + rand(-0.6, 0.6), z + rand(-4, 4));
  };
  K.catenary = (b) => {   // light rail poles and the contact wire over the track
    for (const z of [6, 30, 54]) {
      for (const s of [-1, 1]) b.cyl(VC.metal, '#5a5e66', s * (EDGE + 0.9), 4.2, -z, 0.1, 8.4, 'cyl8');
      b.box(VC.metal, '#5a5e66', 0, 8.2, -z, 2 * EDGE + 1.8, 0.08, 0.08);
    }
    for (const x of [-2.5, 0, 2.5]) b.box(VC.metal, '#2a2a2e', x, 8.0, -40, 0.03, 0.03, 80);
  };
  K.surfRack = (b, x, z) => {
    b.box(VC.metal, '#8a8e96', x, 0.9, z, 0.08, 1.8, 2.4);
    for (let k = 0; k < 5; k++) b.add(G.sph, VC.solid, x + 0.15, 1.15, z - 1.0 + k * 0.5, 0.12, 2.1, 0.5, 0, 0, 0.12, pick(['#ffd23d', '#3dfff0', '#ff6a8a', '#f4f4f0', '#ff9a3a']));
  };
  K.flags = (b, x, z) => {   // red-and-yellow lifesaver flags
    b.cyl(VC.metal, '#d8d8de', x, 1.6, z, 0.03, 3.2);
    b.box(VC.solid, '#d8202c', x, 2.9, z + 0.4, 0.02, 0.4, 0.8);
    b.box(VC.solid, '#ffd23d', x, 2.5, z + 0.4, 0.02, 0.4, 0.8);
  };
  K.stall = (b, x, z) => {   // weekend market stall under a white tent
    b.block(VC.solid, '#5a4a3a', x, 0, z, 1.6, 0.9, 2.6);
    for (const [dx, dz] of [[-0.8, -1.3], [0.8, -1.3], [-0.8, 1.3], [0.8, 1.3]]) b.cyl(VC.metal, '#d8d8de', x + dx, 1.2, z + dz, 0.03, 2.4);
    b.add(G.cone4, VC.solid, x, 2.75, z, 2.4, 0.7, 3.4, 0, 0, 0, '#f4f2ec');
    b.box(VC.glow, hdr('#ffe0b0', 1.0), x, 2.3, z, 1.4, 0.05, 2.2);
    for (let k = 0; k < 4; k++) b.box(VC.solid, pick(['#c8202c', '#ffd23d', '#3a8a5a', '#2a6ad8']), x + rand(-0.5, 0.5), 0.95, z + rand(-1, 1), 0.3, 0.12, 0.3);
  };
  const COATS = ['#2b2d3a', '#3a2f3f', '#1f2a3a', '#4a3a34', '#2f3a2f', '#5a2b33', '#2a3550', '#e8e2d6', '#3ab8a0', '#e86a3a'];
  K.person = (b, x, z, { s = rand(0.92, 1.06), coat = pick(COATS), seated = false } = {}) => {
    const y = seated ? -0.45 : 0;
    if (!seated) b.add(G.cyl8, VC.solid, x, 0.55 * s, z, 0.3 * s, 1.1 * s, 0.24 * s, 0, 0, 0, pick(['#1c1c22', '#2a3a5a', '#c8b08a']));
    b.box(VC.solid, coat, x, y + 1.25 * s, z, 0.46 * s, 0.62 * s, 0.28 * s);
    b.sph(VC.solid, pick(['#e8c4a0', '#d9a07a', '#a87a5a', '#7a5238']), x, y + 1.72 * s, z, 0.15 * s, true);
    b.sph(VC.solid, pick(['#141414', '#e8c878', '#6a4a2a', '#2a1a12']), x, y + 1.79 * s, z + 0.02, 0.16 * s, true);
  };
  K.crowd = (b, x0, x1, z0, z1, n) => { for (let i = 0; i < n; i++) K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1)); };
  K.update = (t) => { K.screen.uniforms.time.value = t; };
  return K;
}
