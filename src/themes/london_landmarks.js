// London landmark scenes on a snowy Christmas night: Big Ben over the Palace of Westminster with the Abbey across the
// street, Trafalgar Square's Norwegian tree, Piccadilly Circus's curved screens and the Regent Street angels, Buckingham
// Palace and its guards, running across Tower Bridge between the towers, the London Eye turning over the South Bank's
// Christmas market, and the dome of St Paul's above the Millennium Bridge.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, buildingGeo, rand, randi, pick } from '../core.js';
import { at, EDGE, farGround, facadeMat, buildingRow } from './common.js';
import { beam } from './tokyo_kit.js';
import { tiledBox } from './beijing_kit.js';
import { SNOW, SNOW_ROOF, PED, facadeTex, unionJack } from './london_kit.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const JEWEL = ['#d82a3a', '#2a5ad8', '#e8b030', '#3aa860', '#8a3ad8', '#ff7a2a'];
const lancet = (g, x, y, w, h) => {   // a pointed Gothic window
  g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w * 0.9);
  g.quadraticCurveTo(x, y, x + w / 2, y - w * 0.2); g.quadraticCurveTo(x + w, y, x + w, y + w * 0.9);
  g.lineTo(x + w, y + h); g.closePath();
};
// Perpendicular Gothic panelling with tall pointed windows; the walls glow a little as if floodlit.
function gothicTex({ wall = '#cdb88c', lit = ['#ffd9a0', '#ffe6c0', '#ffcf8a'], litChance = 0.6, jewel = false, glow = 0.3 } = {}) {
  const cols = 4, rows = 3, cw = 32, ch = 96, W = cols * cw, H = rows * ch, cells = [];
  for (let i = 0; i < cols * rows; i++) cells.push(Math.random() < litChance ? pick(lit) : null);
  const R = (c, r) => [c * cw + 9, r * ch + 18, cw - 18, ch - 32];
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(90,70,40,0.35)'; g.lineWidth = 1;
    for (let x = 0; x < W; x += 8) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); }
    for (let y = 0; y < H; y += 24) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
    for (let c = 0; c <= cols; c++) { g.fillStyle = 'rgba(255,240,210,0.35)'; g.fillRect(c * cw - 2, 0, 4, H); }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r);
      g.fillStyle = '#e8d8b0'; lancet(g, x - 2, y - 2, w + 4, h + 4); g.fill();
      g.fillStyle = '#16140f'; lancet(g, x, y, w, h); g.fill();
    }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = `#${new THREE.Color(wall).multiplyScalar(glow).getHexString()}`; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const [x, y, w, h] = R(c, r), col = cells[r * cols + c];
      g.fillStyle = '#000'; lancet(g, x, y, w, h); g.fill();
      if (!col) continue;
      g.save(); lancet(g, x, y, w, h); g.clip();
      if (jewel) for (let k = 0; k < 10; k++) { g.fillStyle = pick(JEWEL); g.fillRect(x, y - 4 + (k * (h + 4)) / 10, w, (h + 4) / 10 + 1); }
      else { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, col); gr.addColorStop(1, `#${new THREE.Color(col).multiplyScalar(0.55).getHexString()}`); g.fillStyle = gr; g.fillRect(x, y - 6, w, h + 6); }
      g.restore();
      g.strokeStyle = '#000'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h);
      for (const f of [0.35, 0.65]) { g.moveTo(x, y + h * f); g.lineTo(x + w, y + h * f); }
      g.stroke();
    }
  });
  return { map, emissive, cols, rows };
}
export function clockTex() {   // Big Ben's dial: backlit opal glass, gilt Roman numerals, the hands at five to midnight
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#3a3020'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d8b060'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    for (const [x, y] of [[22, 22], [w - 22, 22], [22, h - 22], [w - 22, h - 22]]) { g.fillStyle = '#d8b060'; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); }
    const cx = w / 2, cy = h / 2, R = 108;
    g.fillStyle = '#d8b060'; g.beginPath(); g.arc(cx, cy, R + 7, 0, 7); g.fill();
    const gr = g.createRadialGradient(cx, cy, 8, cx, cy, R); gr.addColorStop(0, '#fffae8'); gr.addColorStop(1, '#f2dca8');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.strokeStyle = 'rgba(70,50,20,0.45)'; g.lineWidth = 1.4;
    for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34); g.lineTo(cx + Math.cos(a) * R * 0.74, cy + Math.sin(a) * R * 0.74); g.stroke(); }
    for (const rr of [34, R * 0.74]) { g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.stroke(); }
    g.fillStyle = '#1a1410';
    for (let k = 0; k < 60; k++) { const a = (k / 60) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * R * 0.96, cy + Math.sin(a) * R * 0.96, k % 5 ? 1.4 : 2.6, 0, 7); g.fill(); }
    g.font = `700 21px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((t, k) => {
      const a = (k / 12) * Math.PI * 2 - Math.PI / 2;
      g.save(); g.translate(cx + Math.cos(a) * R * 0.85, cy + Math.sin(a) * R * 0.85); g.rotate(a + Math.PI / 2); g.fillText(t, 0, 0); g.restore();
    });
    const hand = (a, L, wd) => { g.save(); g.translate(cx, cy); g.rotate(a); g.beginPath(); g.moveTo(-wd, 12); g.lineTo(0, -L); g.lineTo(wd, 12); g.closePath(); g.fill(); g.restore(); };
    hand(((11 + 55 / 60) / 12) * Math.PI * 2, R * 0.52, 5.5);
    hand((55 / 60) * Math.PI * 2, R * 0.82, 3.5);
    g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill();
  }, { repeat: false });
}
function greatWinTex(jewel) {   // a tall traceried Gothic window: three lights under a head of circles
  return canvasTex(128, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.save(); lancet(g, 6, 40, w - 12, h - 46); g.clip();
    if (jewel) for (let y = 0; y < h; y += 12) for (let x = 0; x < w; x += 12) { g.fillStyle = pick(JEWEL); g.fillRect(x, y, 12, 12); }
    else { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff2d0'); gr.addColorStop(1, '#ffb860'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    g.restore();
    g.strokeStyle = '#2a2018'; g.lineWidth = 5; lancet(g, 6, 40, w - 12, h - 46); g.stroke();
    g.lineWidth = 4;
    for (const x of [w * 0.36, w * 0.64]) { g.beginPath(); g.moveTo(x, 96); g.lineTo(x, h - 6); g.stroke(); }
    for (const y of [140, 190]) { g.beginPath(); g.moveTo(8, y); g.lineTo(w - 8, y); g.stroke(); }
    for (const [x, y, r] of [[w / 2, 62, 16], [w * 0.3, 92, 11], [w * 0.7, 92, 11]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); }
  }, { repeat: false });
}
function roseTex() {   // the Abbey's rose window in jewel glass
  return canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    for (let ring = 0; ring < 4; ring++) {
      const r0 = 16 + ring * 27, r1 = r0 + 27, n = 8 * (ring + 1);
      for (let k = 0; k < n; k++) { const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2; g.fillStyle = pick(JEWEL); g.beginPath(); g.arc(cx, cy, r1, a0, a1); g.arc(cx, cy, r0, a1, a0, true); g.closePath(); g.fill(); }
    }
    g.fillStyle = '#ffd86a'; g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.fill();
    g.strokeStyle = '#141210'; g.lineWidth = 3;
    for (let ring = 0; ring <= 4; ring++) { g.beginPath(); g.arc(cx, cy, 16 + ring * 27, 0, 7); g.stroke(); }
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16); g.lineTo(cx + Math.cos(a) * 124, cy + Math.sin(a) * 124); g.stroke(); }
  }, { repeat: false });
}
function latticeTex() {   // Tower Bridge's walkway girders: blue X-bracing edged in white
  return canvasTex(128, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#5a8ac8'; g.lineWidth = 5;
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 4); g.lineTo(x + 32, h - 4); g.moveTo(x + 32, 4); g.lineTo(x, h - 4); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.fillStyle = '#e8eef4'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
  }, { repeat: true });
}
function standardTex() {   // the Royal Standard, quartered: lions, the rampant lion, the harp
  return canvasTex(256, 128, (g, w, h) => {
    const q = (x, y, bg, fg, kind) => {
      g.fillStyle = bg; g.fillRect(x, y, w / 2, h / 2); g.fillStyle = fg;
      if (kind === 'lions') for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(x + 64, y + 14 + k * 18, 26, 6, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x + 88, y + 12 + k * 18, 6, 0, 7); g.fill(); }
      if (kind === 'rampant') { g.beginPath(); g.ellipse(x + 64, y + 34, 12, 22, 0.3, 0, 7); g.fill(); g.beginPath(); g.arc(x + 70, y + 12, 8, 0, 7); g.fill(); g.lineWidth = 3; g.strokeStyle = fg; g.strokeRect(x + 8, y + 6, w / 2 - 16, h / 2 - 12); }
      if (kind === 'harp') { g.lineWidth = 5; g.strokeStyle = fg; g.beginPath(); g.moveTo(x + 50, y + 54); g.lineTo(x + 50, y + 10); g.quadraticCurveTo(x + 76, y + 6, x + 84, y + 30); g.lineTo(x + 50, y + 54); g.stroke(); for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + 56 + k * 6, y + 14 + k * 2); g.lineTo(x + 56 + k * 6, y + 46 - k * 4); g.lineWidth = 1.5; g.stroke(); } }
    };
    q(0, 0, '#c8102e', '#f2c230', 'lions'); q(w / 2, 0, '#f2c230', '#c8102e', 'rampant');
    q(0, h / 2, '#1c3f94', '#f2c230', 'harp'); q(w / 2, h / 2, '#c8102e', '#f2c230', 'lions');
  }, { repeat: false });
}
// dome profile turned on a lathe: an ellipse of radius r rising to height h
const domeGeo = (r, h, seg = 24) => new THREE.LatheGeometry(Array.from({ length: 13 }, (_, k) => { const a = (k / 12) * Math.PI / 2; return new THREE.Vector2(Math.max(r * Math.cos(a), 0.001), h * Math.sin(a)); }), seg);

export function ldnLandmarks(K) {
  const GT = gothicTex(), gothMat = facadeMat(GT, { k: 1 });
  const AT = gothicTex({ wall: '#c8bca0', lit: JEWEL, litChance: 0.85, jewel: true, glow: 0.26 }), abbeyMat = facadeMat(AT, { k: 1 });
  const clockMat = basic({ map: clockTex(), color: hdr('#ffffff', 1.5) });
  const roseMat = basic({ map: roseTex(), alphaTest: 0.5, color: hdr('#ffffff', 1.4), side: THREE.DoubleSide });
  const westWinMat = basic({ map: greatWinTex(true), alphaTest: 0.5, color: hdr('#ffffff', 1.3), side: THREE.DoubleSide });
  const warmWinMat = basic({ map: greatWinTex(false), alphaTest: 0.5, color: hdr('#ffffff', 0.95), side: THREE.DoubleSide });
  const lat = latticeTex(); lat.repeat.set(6, 1);
  const latticeMat = std({ map: lat, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.3, emissive: '#5a8ac8', emissiveMap: lat, emissiveIntensity: 0.35 });
  const eyeSignMat = basic({ map: (() => canvasTex(512, 96, (g, w, h) => { g.fillStyle = '#10204a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ff4a8a'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#ffffff'; g.font = '700 54px "Chakra Petch", "Helvetica Neue", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('THE LONDON EYE', w / 2, h / 2 + 3); }, { repeat: false }))(), color: hdr('#ffffff', 1.2), side: THREE.DoubleSide });
  const stdTex = standardTex(), standardMat = std({ map: stdTex, side: THREE.DoubleSide, roughness: 0.7, emissive: '#ffffff', emissiveMap: stdTex, emissiveIntensity: 0.35 });
  const flood = (tex) => std({ map: tex.map, emissiveMap: tex.emissive, emissive: '#ffffff', emissiveIntensity: 1, vertexColors: true, roughness: 0.85 });
  const PALACE = facadeTex({ cols: 5, rows: 6, wall: '#e8e0cc', bond: 'ashlar', glass: '#1a1814', lit: ['#ffe8c0', '#fff2d8'], litChance: 0.3, frame: '#f4eedc', sill: '#dcd2bc', lintel: '#d4c8ac', glow: 0.3 });
  const palaceMat = flood(PALACE);
  const domeMat = std({ color: '#8a909c', roughness: 0.6, metalness: 0.3, emissive: '#ffe6c0', emissiveIntensity: 0.14 });
  const bronze = '#3a3a30', gold = '#e8b840';
  const plazaTex = canvasTex(256, 256, (g, w, h) => {   // granite paving dusted with snow
    g.fillStyle = '#5a5c64'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { const v = randi(-8, 8); g.fillStyle = `rgb(${110 + v},${112 + v},${120 + v})`; g.fillRect(x + 1, y + 1, 30, 30); }
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(232,238,248,${rand(0.3, 0.8).toFixed(2)})`; g.beginPath(); g.ellipse(rand(0, w), rand(0, h), rand(6, 26), rand(4, 14), rand(0, 3), 0, 7); g.fill(); }
  });
  plazaTex.repeat.set(4, 4);
  const plazaMat = std({ map: plazaTex, roughness: 0.8 });
  const lawnMat = std({ color: '#dfe6f2', roughness: 0.9, emissive: '#8a9ac0', emissiveIntensity: 0.12 });   // snow-covered grass
  const wheels = [];

  // ---------- shared builders ----------
  const pinnacle = (b, x, y, z, h = 2.4, w = 0.5, col = '#d8c49a') => { b.box(VC.solid, col, x, y + 0.3, z, w * 1.2, 0.6, w * 1.2); b.add(G.cone4, VC.solid, x, y + 0.6 + h / 2, z, w * 1.414, h, w * 1.414, 0, 0, 0, col); };
  const railing = (b, x, z0, z1, h = 1.6) => b.add(G.plane, K.railMat, x, h / 2, -(z0 + z1) / 2, z1 - z0, h, 1, 0, Math.PI / 2, 0);
  const lamps = (b, x, z0, z1, step, wreath = true) => { for (let z = z0; z < z1; z += step) K.vicLamp(b, x, -z, wreath); };
  const statue = (b, x, y, z, col = bronze, s = 1) => {   // a bronze figure in a greatcoat on top of its plinth
    b.add(G.cyl8, VC.metal, x, y + 0.9 * s, z, 0.9 * s, 1.8 * s, 0.7 * s, 0, 0, 0, col);
    b.add(G.cyl8, VC.metal, x, y + 2.15 * s, z, 0.75 * s, 0.8 * s, 0.6 * s, 0, 0, 0, col);
    b.sph(VC.metal, col, x, y + 2.75 * s, z, 0.24 * s);
    b.add(G.sph, VC.solid, x, y + 2.9 * s, z, 0.42 * s, 0.12 * s, 0.4 * s, 0, 0, 0, SNOW);
  };
  const plinth = (b, x, z, w, h, col = '#a8a8b0') => { K.ashlar(b, x, 0, z, w, h, w, col); b.box(VC.solid, SNOW, x, h + 0.05, z, w + 0.1, 0.1, w + 0.1); };
  const guardsman = (b, x, z, ry = 0) => {   // a sentry in red tunic and bearskin, rifle at the shoulder
    const fx = Math.sin(ry), fz = Math.cos(ry);
    b.add(G.cyl8, VC.solid, x, 0.5, z, 0.32, 1.0, 0.26, 0, ry, 0, '#14161e');
    b.add(G.box, VC.solid, x, 1.3, z, 0.48, 0.62, 0.3, 0, ry, 0, '#c8102e');
    b.add(G.box, VC.solid, x, 1.02, z, 0.5, 0.08, 0.32, 0, ry, 0, '#f4f4f0');
    b.sph(VC.solid, '#f0c8a8', x, 1.76, z, 0.15, true);
    b.add(G.sph, VC.solid, x, 2.08, z, 0.36, 0.56, 0.36, 0, 0, 0, '#101012');
    beam(b, VC.metal, x - fz * 0.28 + fx * 0.05, 0.9, z + fx * 0.28 + fz * 0.05, x - fz * 0.3, 2.0, z + fx * 0.3, 0.05, '#2a2a2e');
  };
  const sentryBox = (b, x, z, side) => {
    b.block(VC.solid, '#16181c', x + side * 0.1, 0, z, 1.3, 2.9, 1.3);
    b.box(VC.solid, '#0a0a0c', x - side * 0.56, 1.35, z, 0.05, 2.4, 0.9);
    b.add(G.cone4, VC.solid, x + side * 0.1, 3.3, z, 2.0, 0.8, 2.0, 0, 0, 0, '#16181c');
    b.add(G.cone4, VC.solid, x + side * 0.1, 3.36, z, 1.8, 0.62, 1.8, 0, 0, 0, SNOW);
    guardsman(b, x - side * 1.0, z, -side * Math.PI / 2);
  };
  const lion = (b, x, z, ry) => {   // one of Landseer's bronze lions, couchant, with snow on its back
    const P = (f, y, s = 0) => [x + Math.sin(ry) * f + Math.cos(ry) * s, y, z + Math.cos(ry) * f - Math.sin(ry) * s];
    K.ashlar(b, x, 0, z, 2.6, 1.4, 2.6, '#a8a8b0', 0);
    b.addM(tiledBox(2.6, 1.4, 5.4, 2.4), K.ashlarMat, at(...P(0.6, 0.7), ry), '#a8a8b0');
    b.add(G.sph, VC.metal, ...P(-0.6, 2.2), 1.5, 1.3, 3.6, 0, ry, 0, bronze);
    b.add(G.sph, VC.metal, ...P(-1.6, 2.0), 1.7, 1.3, 1.7, 0, ry, 0, bronze);
    b.add(G.sph, VC.metal, ...P(1.3, 2.9), 1.9, 1.9, 1.4, 0, ry, 0, bronze);
    b.add(G.sph, VC.metal, ...P(1.85, 3.0), 1.1, 1.0, 1.1, 0, ry, 0, bronze);
    for (const sd of [-0.45, 0.45]) b.add(G.box, VC.metal, ...P(2.3, 1.65, sd), 0.5, 0.4, 1.6, 0, ry, 0, bronze);
    b.add(G.sph, VC.solid, ...P(-0.7, 2.86), 1.0, 0.25, 2.8, 0, ry, 0, SNOW);
  };
  // Elizabeth Tower: the panelled shaft, the four lit dials, the belfry, the spire with its lantern and gilt finial
  const elizabeth = (b, x, z) => {
    b.addM(buildingGeo(6.4, 22, 6.4, GT, 1.6, 4.8), gothMat, at(x, 0, z), '#ffffff');
    b.box(VC.solid, '#d8c49a', x, 22.2, z, 7.0, 0.4, 7.0);
    b.block(VC.solid, '#d2bc8c', x, 22.4, z, 7.6, 6.6, 7.6);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2, nx = Math.sin(a), nz = Math.cos(a);
      b.add(G.plane, clockMat, x + nx * 3.82, 25.7, z + nz * 3.82, 5.7, 5.7, 1, 0, a, 0);
      b.add(G.box, VC.glow, x + nx * 3.84, 28.75, z + nz * 3.84, 7.0, 0.14, 0.05, 0, a, 0, hdr('#ffcf6a', 1.3));
    }
    for (const [dx, dz] of [[-3.6, -3.6], [3.6, -3.6], [-3.6, 3.6], [3.6, 3.6]]) pinnacle(b, x + dx, 29, z + dz, 2.2, 0.55);
    b.block(VC.solid, '#c8b48a', x, 29, z, 6.8, 4.2, 6.8);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2, nx = Math.sin(a), nz = Math.cos(a), tx = Math.cos(a), tz = -Math.sin(a);
      for (const o of [-2, 0, 2]) b.add(G.box, VC.glow, x + nx * 3.42 + tx * o, 31.1, z + nz * 3.42 + tz * o, 1.1, 3.0, 0.05, 0, a, 0, hdr('#ffd28a', 0.55));
    }
    b.add(G.cone4, VC.solid, x, 33.2 + 1.9, z, 9.8, 3.8, 9.8, 0, 0, 0, '#3a3c4a');
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) beam(b, VC.glow, x + dx * 3.4, 33.2, z + dz * 3.4, x + dx * 1.3, 37, z + dz * 1.3, 0.12, hdr('#ffcf6a', 1.3));
    b.block(VC.solid, '#3a3c4a', x, 36.8, z, 2.8, 0.4, 2.8);
    b.block(VC.glow, hdr('#fff0c8', 1.8), x, 37.2, z, 2.2, 1.8, 2.2);
    b.add(G.cone4, VC.solid, x, 39 + 1.8, z, 3.6, 3.6, 3.6, 0, 0, 0, '#3a3c4a');
    b.cyl(VC.glow, hdr('#ffcf6a', 1.6), x, 43.4, z, 0.08, 1.6, 'cyl8');
    b.sph(VC.glow, hdr('#ffd86a', 2), x, 44.3, z, 0.22, true);
  };

  // ---------- Westminster: Big Ben, the Palace and the Abbey ----------
  const westminster = () => {
    const b = new Batcher();
    farGround(b, 1, '#1a1c24'); farGround(b, -1, '#1a1c24');
    // right: railings, the red bus and phone box, the Palace's river of pinnacles, the north wing and the tower
    railing(b, EDGE + 6.6, 2, 78, 1.8);
    lamps(b, EDGE + 0.9, 6, 78, 13);
    K.bus(b, EDGE + 2.9, -24, 0);
    K.phoneBox(b, EDGE + 5.4, -8, -Math.PI / 2); K.pillarBox(b, EDGE + 5.4, -11.5);
    b.addM(buildingGeo(20, 14, 46, GT, 1.6, 4.8), gothMat, at(23, 0, -27), '#ffffff');
    b.box(VC.solid, '#d8c49a', 13.1, 14.3, -27, 0.4, 0.6, 46);
    for (let z = 5; z < 50; z += 2.3) pinnacle(b, 13.15, 14.4, -z, 2.2, 0.42);
    b.add(PED, VC.solid, 23, 14, -27, 18, 5.0, 45.6, 0, 0, 0, SNOW_ROOF);
    for (const z of [4, 15.5, 38.5, 50]) {
      b.cyl(VC.solid, '#cdb88c', 13.7, 8.5, -z, 1.2, 17, 'cyl8');
      b.add(G.cone8, VC.solid, 13.7, 19, -z, 2.6, 4, 2.6, 0, 0, 0, '#3a3c4a');
      b.cyl(VC.glow, hdr('#ffcf6a', 1.4), 13.7, 21.6, -z, 0.06, 1.2, 'cyl8');
    }
    b.block(VC.solid, '#cdb88c', 12.6, 0, -27, 1.6, 11, 7);
    b.add(G.plane, warmWinMat, 11.78, 5.6, -27, 3.0, 7.6, 1, 0, -Math.PI / 2, 0);
    b.add(PED, VC.solid, 12.6, 11, -27, 7.4, 3.0, 1.6, 0, Math.PI / 2, 0, '#cdb88c');
    b.cyl(VC.solid, '#cdb88c', 26, 18, -27, 4.0, 8, 'cyl8');
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; b.add(G.box, VC.glow, 26 + Math.sin(a) * 3.88, 18.5, -27 + Math.cos(a) * 3.88, 0.9, 4, 0.06, 0, a, 0, hdr('#ffd9a0', 0.9)); }
    b.add(G.cone8, VC.solid, 26, 26, -27, 8.2, 8, 8.2, 0, 0, 0, '#3a3c4a');
    b.cyl(VC.glow, hdr('#ffcf6a', 1.4), 26, 30.8, -27, 0.08, 1.6, 'cyl8');
    b.addM(buildingGeo(17, 10, 12, GT, 1.6, 4.8), gothMat, at(21.5, 0, -56), '#ffffff');
    for (let z = 51; z < 62; z += 2.3) pinnacle(b, 13.15, 10, -z, 2.0, 0.4);
    b.add(PED, VC.solid, 21.5, 10, -56, 15, 4.0, 11.6, 0, 0, 0, SNOW_ROOF);
    elizabeth(b, 16, -68);
    // left: the Abbey's west towers and Great West Window, the nave with flying buttresses, the rose window, its tree
    for (const x of [-16, -28]) {
      b.addM(buildingGeo(6, 32, 6, AT, 1.6, 4.8), abbeyMat, at(x, 0, -8), '#ffffff');
      for (const [dx, dz] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) pinnacle(b, x + dx, 32, -8 + dz, 3.6, 0.7, '#d0c4a8');
      b.box(VC.solid, '#d0c4a8', x, 32.2, -8, 6.2, 0.4, 6.2);
    }
    b.addM(buildingGeo(6, 25, 6, AT, 1.6, 4.8), abbeyMat, at(-22, 0, -8), '#ffffff');
    b.add(PED, VC.solid, -22, 25, -8, 6, 4, 6, 0, 0, 0, '#d0c4a8');
    b.add(G.plane, westWinMat, -22, 14.5, -4.96, 4.4, 9.5, 1);
    b.box(VC.glow, hdr('#ffd9a0', 0.8), -22, 2.5, -4.97, 2.6, 5, 0.05);
    b.addM(buildingGeo(14, 21, 38, AT, 1.6, 4.8), abbeyMat, at(-22, 0, -30), '#ffffff');
    b.add(PED, VC.solid, -22, 21, -30, 13.6, 6, 37.6, 0, 0, 0, SNOW_ROOF);
    for (let z = 13; z < 49; z += 5) {
      if (z > 27 && z < 41) continue;
      b.block(VC.solid, '#d0c4a8', -12.6, 0, -z, 1.0, 13, 1.4);
      pinnacle(b, -12.6, 13, -z, 2.4, 0.6, '#d0c4a8');
      beam(b, VC.solid, -12.6, 11.5, -z, -15, 18, -z, 0.5, '#d0c4a8', 0.9);
    }
    b.addM(buildingGeo(3, 24, 12, AT, 1.6, 4.8), abbeyMat, at(-13.5, 0, -34.5), '#ffffff');
    b.add(PED, VC.solid, -13.5, 24, -34.5, 12, 5, 3, 0, Math.PI / 2, 0, '#d0c4a8');
    b.add(G.plane, roseMat, -11.96, 15, -34.5, 7, 7, 1, 0, -Math.PI / 2, 0);
    for (const z of [28.4, 40.6]) { b.cyl(VC.solid, '#d0c4a8', -12.4, 14, -z, 0.9, 28, 'cyl8'); b.add(G.cone8, VC.solid, -12.4, 29.6, -z, 2, 3.2, 2, 0, 0, 0, '#d0c4a8'); }
    K.spruce(b, -22, -1.2, 2.2, { lights: 'warm', w: 0.75 });
    // Parliament Square: snow on the lawn, statues, trees in lights, black cabs going round
    b.add(G.plane, lawnMat, -36, 0.05, -66, 46, 26, 1, -Math.PI / 2, 0, 0);
    for (const [x, z, h] of [[-21, -62, 3.2], [-31, -57, 2.8], [-36, -72, 2.8], [-46, -60, 2.8]]) { plinth(b, x, -z, 2.2, h); statue(b, x, h, -z); }
    for (const z of [55, 64, 73]) K.bareTree(b, -13.6, -z, 1.15, { lights: 'warm' });
    for (const x of [-24, -36, -48]) K.bareTree(b, x, -79, 1.1, { lights: 'warm' });
    lamps(b, -(EDGE + 0.9), 6, 78, 13);
    K.cab(b, -(EDGE + 2.6), -30, Math.PI); K.cab(b, -(EDGE + 2.6), -62, Math.PI);
    K.crowd(b, EDGE + 1.2, EDGE + 5.6, 2, 78, 12); K.crowd(b, -(EDGE + 1.2), -(EDGE + 5.6), 2, 78, 12);
    return b.build();
  };

  // ---------- Trafalgar Square ----------
  const trafalgar = () => {
    const b = new Batcher();
    farGround(b, 1, '#1a1c24');
    // right: St Martin-in-the-Fields, the National Gallery's portico and dome, the Norwegian tree with its carollers
    K.ashlar(b, 20, 0, -9, 14, 14, 14, '#f4ecdc');
    b.box(VC.glow, hdr('#ffd9a0', 0.8), 12.97, 6, -9, 0.05, 6, 3);
    for (let k = 0; k < 3; k++) b.block(VC.solid, '#e6dcc6', 12.6 - k * 0.5, 0, -9, 0.6 + k * 0.5, 1.5 - k * 0.5, 14.4);
    for (let k = 0; k < 6; k++) b.cyl(VC.solid, '#f4eedc', 11.7, 1.5 + 5.5, -2.8 - k * 2.48, 0.55, 11, 'cyl');
    b.block(VC.solid, '#e6dcc6', 12.3, 12.5, -9, 2.4, 1.2, 14.4);
    b.add(PED, VC.solid, 12.3, 13.7, -9, 14.4, 3.4, 2.4, 0, Math.PI / 2, 0, '#e6dcc6');
    b.add(PED, VC.solid, 12.3, 13.68, -9, 14.8, 3.6, 2.2, 0, Math.PI / 2, 0, SNOW);
    K.ashlar(b, 21, 14, -9, 4.4, 8, 4.4, '#f4ecdc');
    b.cyl(VC.solid, '#f4ecdc', 21, 24, -9, 1.9, 4, 'cyl8'); b.cyl(VC.solid, '#f4ecdc', 21, 27.5, -9, 1.4, 3, 'cyl8');
    b.add(G.cone8, VC.solid, 21, 33.5, -9, 2.6, 9, 2.6, 0, 0, 0, '#f4ecdc');
    b.cyl(VC.glow, hdr('#ffcf6a', 1.4), 21, 38.6, -9, 0.06, 1.2, 'cyl8');
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.add(G.box, VC.glow, 21 + Math.sin(a) * 1.92, 24, -9 + Math.cos(a) * 1.92, 0.5, 2.4, 0.05, 0, a, 0, hdr('#ffd9a0', 1.0)); }
    b.addM(buildingGeo(14, 13, 60, PALACE, 2.0, 3.4), palaceMat, at(23, 0, -50), '#ffffff');
    b.box(VC.solid, '#e6dcc6', 16, 13.3, -50, 0.6, 0.6, 60); b.box(VC.solid, SNOW, 16, 13.65, -50, 0.7, 0.1, 60);
    b.block(VC.solid, '#d8ccb4', 14.4, 0, -50, 3.2, 3, 16);
    for (let k = 0; k < 6; k++) b.cyl(VC.solid, '#f4eedc', 13.6, 3 + 4.5, -44 - k * 2.4, 0.5, 9, 'cyl');
    b.block(VC.solid, '#e6dcc6', 14.4, 12, -50, 2.6, 1.0, 13.6);
    b.add(PED, VC.solid, 14.4, 13, -50, 13.6, 2.8, 2.6, 0, Math.PI / 2, 0, '#e6dcc6');
    b.add(PED, VC.solid, 14.4, 12.98, -50, 14, 3, 2.4, 0, Math.PI / 2, 0, SNOW);
    b.cyl(VC.solid, '#e6dcc6', 21, 15, -50, 3.2, 4, 'cyl');
    b.add(G.sph, VC.solid, 21, 17, -50, 6.6, 5.4, 6.6, 0, 0, 0, '#c8ccd4');
    b.cyl(VC.glow, hdr('#ffe0b0', 1.2), 21, 20.6, -50, 0.6, 1.6, 'cyl8');
    for (const z of [30, 70]) { b.cyl(VC.solid, '#e6dcc6', 18, 14, -z, 1.4, 2, 'cyl8'); b.add(G.sph, VC.solid, 18, 15, -z, 2.8, 2.2, 2.8, 0, 0, 0, '#c8ccd4'); }
    K.spruce(b, 9.6, -36, 3.6, { lights: 'strings', baubles: false, w: 0.55, ry: 0.3 });
    K.carolers(b, 6.2, -27, 1); K.brassBand(b, 6.6, -46, 1);
    lamps(b, EDGE + 0.9, 54, 80, 12);
    K.crowd(b, EDGE + 1.2, EDGE + 4.5, 50, 78, 8, { bags: true });
    // left: the square, Nelson on his column above the four lions, the two fountains lit blue, buses and cabs
    b.add(G.plane, plazaMat, -37, 0.04, -40, 52, 80, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#c8c0aa', -11.3, 0.5, -40, 0.5, 1.0, 76); b.box(VC.solid, SNOW, -11.3, 1.05, -40, 0.6, 0.1, 76);
    const nx = -22, nz = -58;
    b.block(VC.solid, '#9a9aa2', nx, 0, nz, 12, 0.5, 12); b.block(VC.solid, '#9a9aa2', nx, 0.5, nz, 10, 0.5, 10);
    K.ashlar(b, nx, 1, nz, 6, 6, 6, '#b8b8c0');
    for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; b.add(G.box, VC.metal, nx + Math.sin(a) * 3.04, 4, nz + Math.cos(a) * 3.04, 4.2, 3, 0.08, 0, a, 0, bronze); }
    K.ashlar(b, nx, 7, nz, 3.6, 1.4, 3.6, '#c8c4b8');
    b.cyl(VC.solid, '#e2dac6', nx, 9.0, nz, 1.45, 1.2, 'cyl');
    b.cyl(VC.solid, '#e2dac6', nx, 9.6 + 11, nz, 1.05, 22, 'cyl');
    b.add(G.cone, VC.metal, nx, 32.3, nz, 3.2, 1.6, 3.2, Math.PI, 0, 0, bronze);
    b.block(VC.metal, bronze, nx, 33.1, nz, 2.8, 0.5, 2.8);
    b.cyl(VC.solid, '#e2dac6', nx, 34.1, nz, 0.9, 1.0, 'cyl');
    statue(b, nx, 34.6, nz, '#2e2c26', 1.1);
    b.add(G.box, VC.metal, nx, 37.9, nz, 1.0, 0.28, 0.32, 0, 0.3, 0, '#2e2c26');
    for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; lion(b, nx + Math.sin(a) * 8.2, nz + Math.cos(a) * 8.2, a); }
    for (const [fx, fz] of [[-22, -20], [-40, -30]]) {   // the fountains, lit blue for winter
      b.cyl(VC.solid, '#c8c0aa', fx, 0.4, fz, 5.2, 0.8);
      b.cyl(VC.glow, hdr('#3a7aff', 0.45), fx, 0.78, fz, 4.8, 0.05);
      b.cyl(VC.solid, '#c8c0aa', fx, 1.3, fz, 0.6, 2.2, 'cyl8');
      b.add(G.cone, VC.solid, fx, 2.6, fz, 4.4, 0.6, 4.4, Math.PI, 0, 0, '#c8c0aa');
      b.cyl(VC.glow, hdr('#5a9aff', 0.55), fx, 2.92, fz, 2.0, 0.04);
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
        beam(b, VC.glowAdd, fx, 3.0, fz, fx + c * 1.2, 6.0, fz + sn * 1.2, 0.09, hdr('#9fd0ff', 0.3));
        beam(b, VC.glowAdd, fx + c * 1.2, 6.0, fz + sn * 1.2, fx + c * 2.1, 3.1, fz + sn * 2.1, 0.09, hdr('#9fd0ff', 0.25));
      }
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; beam(b, VC.glowAdd, fx + Math.cos(a) * 4.6, 0.8, fz + Math.sin(a) * 4.6, fx + Math.cos(a) * 3.0, 2.4, fz + Math.sin(a) * 3.0, 0.1, hdr('#9fd0ff', 0.35)); }
    }
    for (const z of [8, 30, 58, 76]) { b.cyl(VC.metal, '#16181c', -12.4, 2.6, -z, 0.12, 5.2, 'cyl8'); for (const dz of [-0.6, 0.6]) b.box(VC.glow, hdr('#ffd28a', 1.3), -12.4, 5.3, -z + dz, 0.4, 0.55, 0.4); }
    for (let z = 6; z < 80; z += 12) K.bareTree(b, -60, -z, 1.2, { lights: 'warm' });
    buildingRow(b, -1, [K.westType], { x0: 64, depth: [12, 16], gap: [0, 0.4], z0: 0, z1: 80 });
    K.bus(b, -(EDGE + 2.9), -14, Math.PI); K.bus(b, -(EDGE + 2.9), -62, Math.PI); K.cab(b, -(EDGE + 2.6), -36, Math.PI);
    K.crowd(b, -12.5, -48, 4, 76, 26);
    K.snowman(b, -46, -48); K.snowman(b, -16, -40);
    return b.build();
  };

  // ---------- Piccadilly Circus and the Regent Street angels ----------
  const piccadilly = () => {
    const b = new Batcher();
    farGround(b, 1, '#1a1c24'); farGround(b, -1, '#1a1c24');
    // right: the curved wall of screens on the corner building, shops beneath
    buildingRow(b, 1, [{ ...K.westType, h: [24, 26], front: (bb, i) => K.shopFront(bb, i) }], { x0: 15.5, depth: [12, 16], gap: [0, 0.2], z0: 4, z1: 46 });
    for (let k = 0; k < 7; k++) {
      const th = ((k - 3) / 3) * 0.95, px = 40 - 26 * Math.cos(th), pz = -26 + 26 * Math.sin(th), ry = Math.atan2(-Math.cos(th), Math.sin(th));
      b.add(G.box, VC.solid, px + Math.cos(th) * 0.25, 10.2, pz - Math.sin(th) * 0.25, 7.6, 8.6, 0.3, 0, ry, 0, '#0c0c10');
      b.add(G.plane, K.screen, px - Math.cos(th) * 0.02, 10.2, pz + Math.sin(th) * 0.02, 7.2, 8, 1, 0, ry, 0, new THREE.Color(k / 7, 1.05, 0));
    }
    K.bus(b, EDGE + 2.9, -14, 0); K.cab(b, EDGE + 2.6, -34, 0);
    // left: Eros above the fountain steps, the Criterion behind the circus
    b.add(G.plane, plazaMat, -17, 0.04, -24, 12, 48, 1, -Math.PI / 2, 0, 0);
    buildingRow(b, -1, [{ ...K.westType, h: [20, 23] }], { x0: 23, depth: [12, 16], gap: [0, 0.2], z0: 0, z1: 48 });
    const ex = -15, ez = -24;
    b.cyl(VC.solid, '#9a9aa2', ex, 0.25, ez, 3.8, 0.5, 'cyl8'); b.cyl(VC.solid, '#9a9aa2', ex, 0.75, ez, 3.1, 0.5, 'cyl8'); b.cyl(VC.solid, '#9a9aa2', ex, 1.25, ez, 2.4, 0.5, 'cyl8');
    b.cyl(VC.metal, bronze, ex, 1.75, ez, 2.0, 0.5, 'cyl8');
    b.cyl(VC.metal, bronze, ex, 3.2, ez, 0.7, 2.4, 'cyl8');
    b.add(G.cone8, VC.metal, ex, 4.6, ez, 2.4, 0.5, 2.4, Math.PI, 0, 0, bronze);
    b.cyl(VC.metal, bronze, ex, 5.1, ez, 0.35, 0.6, 'cyl8');
    b.add(G.cyl8, VC.metal, ex, 6.2, ez, 0.36, 1.4, 0.3, 0, 0, 0.15, '#c8ccd4');
    b.sph(VC.metal, '#c8ccd4', ex + 0.12, 7.05, ez, 0.2);
    for (const s of [-1, 1]) b.add(G.box, VC.metal, ex - 0.1, 6.9, ez + s * 0.55, 0.06, 1.0, 0.9, s * 0.5, 0, 0.4, '#c8ccd4');
    beam(b, VC.metal, ex + 0.2, 6.8, ez, ex + 1.0, 6.4, ez, 0.04, '#c8ccd4');
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; K.person(b, ex + Math.cos(a) * 3.3, ez + Math.sin(a) * 3.3, { s: 0.85 }); }
    K.cab(b, -(EDGE + 2.6), -36, Math.PI); K.bus(b, -(EDGE + 2.9), -46, Math.PI);
    K.streetSign(b, -22.95, 3.2, -42, -1, 10);
    // Regent Street: stone on both sides and the angels overhead
    K.westRow(b, 1, 48, 80); K.westRow(b, -1, 48, 80);
    for (const z of [54, 66, 78]) K.angel(b, -z);
    for (const s of [-1, 1]) { lamps(b, s * (EDGE + 0.9), 6, 78, 12, false); K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 6.4), 2, 78, 16, { bags: true }); }
    return b.build();
  };

  // ---------- Buckingham Palace ----------
  const buckingham = () => {
    const b = new Batcher();
    farGround(b, 1, '#1a1c24'); farGround(b, -1, '#1a1c24');
    // the Mall: Union flags on both sides, plane trees in lights
    for (let z = 4; z < 36; z += 8) for (const s of [-1, 1]) {
      const x = s * (EDGE + 1.6);
      b.cyl(VC.metal, '#d8d8de', x, 4.6, -z, 0.07, 9.2, 'cyl8');
      b.sph(VC.glow, hdr('#ffcf6a', 1.6), x, 9.3, -z, 0.14, true);
      b.add(G.plane, K.flagMat, x, 8.3, -z - 1.3, 2.6, 1.4, 1, 0, Math.PI / 2, 0);
      if (s < 0 || z < 28) K.bareTree(b, s * (EDGE + 5.4), -z - 4, 1.2, { lights: 'warm' });
    }
    // right: gilt-tipped railings and gates, sentries, the forecourt, the East Front with its balcony and the Standard
    b.add(G.plane, plazaMat, 19.5, 0.03, -52, 13, 56, 1, -Math.PI / 2, 0, 0);
    for (const [z0, z1] of [[32, 40], [44, 66], [70, 80]]) { railing(b, 13, z0, z1, 3.0); b.box(VC.metal, gold, 13, 3.02, -(z0 + z1) / 2, 0.08, 0.08, z1 - z0); }
    for (const z of [32, 40, 44, 66, 70]) { K.ashlar(b, 13, 0, -z, 1.6, 4.4, 1.6, '#f0e8d8'); b.sph(VC.glow, hdr('#ffe0a0', 1.6), 13, 5.1, -z, 0.4); b.add(G.cone4, VC.metal, 13, 4.7, -z, 1.0, 0.3, 1.0, 0, 0, 0, gold); }
    for (const zc of [42, 68]) for (const dz of [-0.95, 0.95]) {
      b.box(VC.metal, '#16181c', 13, 1.7, -zc + dz, 0.12, 3.4, 1.8);
      b.cyl(VC.metal, gold, 12.9, 2.2, -zc + dz, 0.45, 0.06, 'cyl', 0, Math.PI / 2);
      b.box(VC.metal, gold, 13, 3.5, -zc + dz, 0.14, 0.25, 1.8);
    }
    for (const z of [50, 60]) sentryBox(b, 16, -z, 1);
    guardsman(b, 20, -38, Math.PI); guardsman(b, 21, -74, 0);
    b.addM(buildingGeo(18, 24, 60, PALACE, 2.0, 3.4), palaceMat, at(35, 0, -50), '#fff8ee');
    b.box(VC.solid, '#e6dcc6', 26, 24.4, -50, 0.6, 0.8, 60); b.box(VC.solid, SNOW, 26, 24.86, -50, 0.7, 0.12, 60);
    b.block(VC.solid, '#3a3e48', 35, 24, -50, 16, 1.6, 58);
    b.box(VC.solid, SNOW, 35, 25.65, -50, 16, 0.1, 58);
    for (let k = 0; k < 8; k++) b.cyl(VC.solid, '#f4eedc', 25.4, 6 + 6, -45.2 - k * 1.95, 0.5, 12, 'cyl');
    b.block(VC.solid, '#e6dcc6', 25.6, 18, -52, 1.6, 1.0, 16);
    b.add(PED, VC.solid, 25.6, 19, -52, 16, 3.6, 1.6, 0, Math.PI / 2, 0, '#e6dcc6');
    b.add(PED, VC.solid, 25.6, 18.98, -52, 16.4, 3.8, 1.4, 0, Math.PI / 2, 0, SNOW);
    b.box(VC.solid, '#e6dcc6', 24.9, 6.8, -52, 1.4, 0.3, 6);
    b.box(VC.glow, hdr('#d8202a', 0.8), 25.94, 8.3, -52, 0.05, 2.6, 1.6);
    b.cyl(VC.metal, '#d8d8de', 35, 30.5, -52, 0.12, 9.6, 'cyl8');
    b.add(G.plane, standardMat, 35, 33.8, -54.2, 4.4, 2.2, 1, 0, Math.PI / 2, 0);
    for (const z of [30, 74]) { b.cyl(VC.metal, '#16181c', 14.4, 3, -z, 0.14, 6, 'cyl8'); b.sph(VC.glow, hdr('#ffe0a0', 1.8), 14.4, 6.3, -z, 0.42); b.add(G.cone8, VC.metal, 14.4, 6.85, -z, 0.6, 0.4, 0.6, 0, 0, 0, gold); }
    // left: the Victoria Memorial in white marble under the gilded Winged Victory
    const vx = -26, vz = -54;
    b.cyl(VC.solid, '#c8c4bc', vx, 0.3, vz, 13, 0.6); b.cyl(VC.solid, SNOW, vx, 0.62, vz, 12.6, 0.05);
    b.cyl(VC.solid, '#e8e6e2', vx, 0.9, vz, 10, 0.6);
    for (const s of [-1, 1]) { b.cyl(VC.solid, '#c8c4bc', vx + 4, 1.1, vz + s * 6, 3.2, 1.0); b.cyl(VC.glow, hdr('#4a8aff', 0.5), vx + 4, 1.62, vz + s * 6, 2.8, 0.04); }
    K.ashlar(b, vx, 1.2, vz, 7, 6, 7, '#f8f6f2'); K.ashlar(b, vx, 7.2, vz, 5, 4, 5, '#f8f6f2');
    b.cyl(VC.solid, '#f4f2ee', vx, 14.2, vz, 1.8, 6, 'cyl8');
    const gilt = hdr('#ffc850', 1.25);   // the floodlit gilded Victory with her wings spread
    b.add(G.cone8, VC.glow, vx, 18.1, vz, 1.6, 1.8, 1.6, 0, 0, 0, gilt);
    b.sph(VC.glow, gilt, vx, 19.4, vz, 0.35);
    for (const s of [-1, 1]) b.add(G.box, VC.glow, vx, 19.6, vz + s * 0.9, 0.08, 1.6, 1.4, s * 0.5, 0, 0, gilt);
    b.cyl(VC.glow, hdr('#ffd86a', 1.6), vx, 20.0, vz, 0.05, 0.8, 'cyl8');
    b.block(VC.solid, '#f4f2ee', vx + 4.1, 1.2, vz, 1.6, 1.4, 2.2); b.add(G.cyl8, VC.solid, vx + 4.0, 3.4, vz, 1.0, 2.0, 0.9, 0, 0, 0, '#f4f2ee'); b.sph(VC.solid, '#f4f2ee', vx + 4.0, 4.7, vz, 0.42);
    for (const [dx, dz] of [[-3.8, -3.8], [3.8, -3.8], [-3.8, 3.8], [3.8, 3.8]]) { b.sph(VC.solid, '#f4f2ee', vx + dx, 2.2, vz + dz, 1.0); b.add(G.sph, VC.solid, vx + dx, 3.2, vz + dz, 0.8, 1.6, 0.8, 0, 0, 0, '#f4f2ee'); }
    b.add(G.plane, lawnMat, -30, 0.05, -66, 30, 28, 1, -Math.PI / 2, 0, 0);
    for (const z of [42, 58, 74]) K.bareTree(b, -13.8, -z, 1.15, { lights: 'warm' });
    for (const s of [-1, 1]) K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 5.6), 2, 78, 10);
    K.snowman(b, -15, -64);
    for (let z = 4; z < 80; z += 9) { K.spruce(b, -56 + rand(-3, 3), -z, 2.1, { lights: false, baubles: false, star: false, w: 0.8 }); K.bareTree(b, -45, -z - 4, 1.2, { lights: 'warm' }); }
    return b.build();
  };

  // ---------- Tower Bridge ----------
  const shape = new THREE.Shape();   // a tower's front: two piers joined above the road by a pointed arch
  shape.moveTo(-13.5, 0); shape.lineTo(-6.6, 0); shape.lineTo(-6.6, 9.5);
  shape.quadraticCurveTo(-6.4, 14.4, 0, 15.8); shape.quadraticCurveTo(6.4, 14.4, 6.6, 9.5);
  shape.lineTo(6.6, 0); shape.lineTo(13.5, 0); shape.lineTo(13.5, 27); shape.lineTo(-13.5, 27); shape.closePath();
  const towerGeo = new THREE.ExtrudeGeometry(shape, { depth: 12, bevelEnabled: false, curveSegments: 10 });
  towerGeo.translate(0, 0, -6);
  { const uv = towerGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.4, uv.getY(i) / 2.4); }
  const ring = new THREE.Shape();   // the moulded frame round each arch
  ring.moveTo(-8, 0); ring.lineTo(-8, 9.5); ring.quadraticCurveTo(-7.8, 15.6, 0, 17.6); ring.quadraticCurveTo(7.8, 15.6, 8, 9.5); ring.lineTo(8, 0);
  ring.lineTo(6.6, 0); ring.lineTo(6.6, 9.5); ring.quadraticCurveTo(6.4, 14.4, 0, 15.8); ring.quadraticCurveTo(-6.4, 14.4, -6.6, 9.5); ring.lineTo(-6.6, 0); ring.closePath();
  const ringGeo = new THREE.ExtrudeGeometry(ring, { depth: 0.5, bevelEnabled: false, curveSegments: 10 });
  ringGeo.translate(0, 0, -0.25);
  { const uv = ringGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.4, uv.getY(i) / 2.4); }
  const BLUE = '#4a7ab0', WHITE = '#e8eef4';
  const towerBridge = () => {   // running across Tower Bridge, through both towers, under the walkways
    const b = new Batcher(), WY = -7;
    b.box(VC.solid, '#2a2e38', 0, -1.4, -40, 24, 2.6, 80);
    for (const s of [-1, 1]) {
      b.add(G.plane, K.thames, s * 131, WY, -40, 238, 80, 1, -Math.PI / 2, 0, 0);
      b.box(VC.solid, '#3a3a40', s * 131, (WY - 0.2) / 2, -79.9, 238, -0.2 - WY, 0.2);
      b.box(VC.solid, BLUE, s * 11.3, 0.55, -40, 0.3, 1.1, 80); b.box(VC.solid, WHITE, s * 11.3, 1.14, -40, 0.4, 0.08, 80);
      b.box(VC.solid, SNOW, s * 11.3, 1.2, -40, 0.34, 0.05, 80);
      for (let z = 4; z < 78; z += 10) if (Math.abs(z - 22) > 7 && Math.abs(z - 58) > 7) K.vicLamp(b, s * 10.4, -z, false);
      K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 6.2), 2, 78, 8);
    }
    for (const zc of [-22, -58]) {
      b.addM(towerGeo, K.ashlarMat, at(0, 0, zc), '#ece6da');
      b.box(VC.solid, '#5a5a62', 0, (WY - 2) / 2 - 1, zc, 30, -WY, 16);
      for (const fz of [-1, 1]) {
        b.addM(ringGeo, K.ashlarMat, at(0, 0, zc + fz * 6.2), '#fffaf0');
        for (const sx of [-1, 1]) b.box(VC.solid, '#f4eee2', sx * 10.1, 9.6, zc + fz * 6.1, 7.0, 0.6, 0.4);
        b.box(VC.solid, '#f4eee2', 0, 27.2, zc + fz * 6.1, 27.4, 0.6, 0.4);
        for (const ox of [-10, 10]) { b.add(G.plane, warmWinMat, ox, 5.2, zc + fz * 6.03, 1.6, 4.6, 1, 0, fz > 0 ? 0 : Math.PI, 0); b.add(G.plane, warmWinMat, ox, 19, zc + fz * 6.03, 1.8, 6.4, 1, 0, fz > 0 ? 0 : Math.PI, 0); }
        b.add(G.plane, warmWinMat, 0, 21.5, zc + fz * 6.03, 2.4, 6.0, 1, 0, fz > 0 ? 0 : Math.PI, 0);
      }
      b.addM(tiledBox(24, 11, 11, 2.4), K.ashlarMat, at(0, 32.5, zc), '#ece6da');
      for (const fz of [-1, 1]) for (const ox of [-6, 0, 6]) b.add(G.plane, warmWinMat, ox, 32.4, zc + fz * 5.53, 1.4, 5, 1, 0, fz > 0 ? 0 : Math.PI, 0);
      b.add(G.cone4, VC.solid, 0, 41.5, zc, 24 * 1.414, 7, 11 * 1.414, 0, 0, 0, '#3a3e4a');
      b.cyl(VC.glow, hdr('#ffcf6a', 1.5), 0, 46.5, zc, 0.1, 3, 'cyl8');
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const x = sx * 12.2, z = zc + sz * 5.2;
        b.cyl(VC.solid, '#e2dcd0', x, 21, z, 1.6, 42, 'cyl8');
        b.add(G.cone8, VC.solid, x, 45, z, 3.6, 6, 3.6, 0, 0, 0, '#3a3e4a');
        b.cyl(VC.glow, hdr('#ffcf6a', 1.5), x, 48.8, z, 0.07, 1.6, 'cyl8');
        b.cyl(VC.glow, hdr('#bcd8ff', 0.5), x, 36.5, z, 1.62, 1.2, 'cyl8');
      }
    }
    // the high-level walkways between the towers, glass floors lit blue
    for (const sx of [-5, 5]) {
      for (const fx of [-1.6, 1.6]) b.add(G.plane, latticeMat, sx + fx, 29.3, -40, 24, 3.6, 1, 0, Math.PI / 2, 0);
      b.box(VC.glow, hdr('#7ab8ff', 0.9), sx, 27.6, -40, 3.2, 0.2, 24);
      b.box(VC.solid, BLUE, sx, 31.1, -40, 3.4, 0.3, 24); b.box(VC.solid, SNOW, sx, 31.3, -40, 3.2, 0.1, 24);
    }
    // the side spans' suspension chains, blue lattice girders curving down to the abutment turrets
    for (const sx of [-12.9, 12.9]) for (const [za, zb] of [[-16, -1], [-64, -79]]) {
      const P = (t, dy = 0) => [sx, 26 + (5 - 26) * t - 3 * 4 * t * (1 - t) + dy, za + (zb - za) * t];
      for (let k = 0; k < 8; k++) {
        const t0 = k / 8, t1 = (k + 1) / 8;
        beam(b, VC.solid, ...P(t0), ...P(t1), 0.45, BLUE, 0.8);
        beam(b, VC.solid, ...P(t0, -2.2), ...P(t1, -2.2), 0.4, BLUE, 0.7);
        beam(b, VC.solid, ...P(t0), ...P(t1, -2.2), 0.18, WHITE);
        beam(b, VC.solid, ...P(t1), ...P(t1, -2.2), 0.2, BLUE);
        const [hx, hy, hz] = P(t1, -2.2);
        if (hy > 2) beam(b, VC.metal, hx, hy, hz, hx, 0.6, hz, 0.08, '#c8ccd4');
        b.sph(VC.glow, hdr('#fff0d0', 2), ...P(t0, 0.35), 0.13, true);
      }
      b.cyl(VC.solid, '#e2dcd0', sx, 3.6, zb, 1.4, 7.2, 'cyl8');
      b.add(G.cone8, VC.solid, sx, 8.6, zb, 3, 2.8, 3, 0, 0, 0, '#3a3e4a');
    }
    for (const zc of [-22, -58]) for (const s of [-1, 1]) K.refl(b, s * 14, zc, 70, 5, '#ffe6b0', WY + 0.1);
    // the Tower of London floodlit on the left bank; HMS Belfast moored on the right, dressed overall in lights
    b.block(VC.solid, '#3a3a40', -150, WY - 4, 4, 180, 6, 40);
    K.ashlar(b, -80, WY + 2, -10, 24, 26, 26, '#ece4d0');
    for (const [dx, dz, round] of [[-12, -13, 0], [12, -13, 1], [-12, 13, 0], [12, 13, 0]]) {
      if (round) b.cyl(VC.solid, '#ece4d0', -80 + dx, WY + 17, -10 + dz, 3.2, 30, 'cyl8'); else K.ashlar(b, -80 + dx, WY + 2, -10 + dz, 5, 30, 5, '#ece4d0');
      b.add(G.sph, VC.solid, -80 + dx, WY + 33, -10 + dz, 4.4, 3.4, 4.4, 0, 0, 0, '#4a4e58');
      b.add(G.cone8, VC.solid, -80 + dx, WY + 35.4, -10 + dz, 1.2, 2.6, 1.2, 0, 0, 0, '#4a4e58');
    }
    for (const [x, z, w, d] of [[-62, -6, 2.4, 22], [-98, -6, 2.4, 22], [-80, 4, 38, 2.4], [-80, -18, 38, 2.4]]) K.ashlar(b, x, WY + 2, z, w, 9, d, '#c8c0b0');
    K.refl(b, -70, -10, 70, 4, '#ffe6b0', WY + 0.1);
    const BX = 44;
    b.block(VC.solid, '#5a5e66', BX, WY - 3, -44, 9, 6.5, 58);
    b.block(VC.solid, '#7a7e86', BX, WY + 3.5, -44, 7, 3, 30); b.block(VC.solid, '#7a7e86', BX, WY + 6.5, -40, 5, 4, 14);
    for (const z of [-38, -48]) b.cyl(VC.solid, '#6a6e76', BX, WY + 12.5, z, 1.3, 5, 'cyl8');
    for (const z of [-24, -64]) { b.block(VC.solid, '#5a5e66', BX, WY + 3.5, z, 4, 1.6, 5); b.box(VC.solid, '#3a3e46', BX, WY + 5.5, z + (z < -40 ? -4 : 4), 0.4, 0.4, 8); }
    b.cyl(VC.metal, '#5a5e66', BX, WY + 12, -42, 0.3, 18, 'cyl8');
    for (const [z0, z1] of [[-16, -42], [-42, -72]]) for (let k = 0; k <= 12; k++) { const t = k / 12; b.sph(VC.glow, hdr(pick(['#ffd28a', '#ff4a4a', '#6ab0ff', '#4aff8a']), 2.6), BX, WY + 20 - Math.abs(t - (z0 > -30 ? 1 : 0)) * 12, z0 + (z1 - z0) * t, 0.18, true); }
    K.refl(b, BX, -44, 40, 4, '#ffd28a', WY + 0.1);
    // the far banks: lamps along the water and low lit buildings, all doubled on the river
    for (const s of [-1, 1]) {
      for (let z = 4; z < 78; z += 8) { const x = s * rand(96, 104); b.sph(VC.glow, hdr('#ffd9a0', 2), x, WY + 2.2, -z, 0.35, true); K.refl(b, x, -z, 60, 1.4, '#ffd9a0', WY + 0.1); }
      for (let k = 0; k < 6; k++) {
        const x = s * rand(115, 170), z = -rand(6, 74);
        if (s < 0 && z > -24 && x > -104) continue;
        b.addM(buildingGeo(rand(14, 22), rand(10, 22), rand(12, 18), pick([K.stone, K.brick]), 2.0, 3.3), pick([K.stoneMat, K.brickMat]), at(x, WY, z), '#ffffff');
        K.refl(b, x - s * 8, z, 80, 2.4, pick(['#ffd9a0', '#fff0d0', '#ffcf8a']), WY + 0.1);
      }
    }
    K.boat(b, -40, -60, 'party', WY); K.boat(b, 76, -20, 'clipper', WY);
    K.bus(b, EDGE + 2.9, -72, 0);
    return b.build();
  };

  // ---------- the London Eye over the South Bank ----------
  const ferris = () => {   // the wheel in its own group so it can turn: twin rims, spoke cables, 32 glass capsules
    const b = new Batcher(), R = 18;
    for (const dz of [-1.4, 1.4]) b.add(G.tor, VC.metal, 0, 0, dz, R * 2, R * 2, 2.4, 0, 0, 0, '#e8eaee');
    b.add(G.tor, VC.glow, 0, 0, 0, (R + 0.7) * 2, (R + 0.7) * 2, 1.2, 0, 0, 0, hdr('#ff4a8a', 1.6));
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      beam(b, VC.metal, c * 1.6, s * 1.6, k % 2 ? 1.2 : -1.2, c * R, s * R, k % 2 ? -1.4 : 1.4, 0.06, '#d8dce4');
      beam(b, VC.metal, c * R, s * R, -1.4, c * R, s * R, 1.4, 0.2, '#e8eaee');
      b.add(G.sph, VC.glow, c * (R + 1.9), s * (R + 1.9), 0, 2.0, 2.0, 4.0, 0, 0, 0, hdr(k % 4 ? '#cfe8ff' : '#ffd0e8', 0.75));
      b.add(G.box, VC.metal, c * (R + 1.0), s * (R + 1.0), 0, 0.3, 0.3, 2.6, 0, 0, a, '#c8ccd4');
    }
    b.add(G.cyl, VC.metal, 0, 0, -1.5, 3.2, 8, 3.2, Math.PI / 2, 0, 0, '#d8dce4');
    return b.build();
  };
  const eye = () => {
    const b = new Batcher();
    farGround(b, -1, '#1a1c24');
    // right: the embankment, blue-lit trees, the river with the wheel, its A-frame and boarding pier
    K.embankment(b, 1);
    b.add(G.plane, K.thames, 131, -2.2, -40, 238, 80, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#3a3a40', 131, -1.2, -79.9, 238, 2.2, 0.2);
    for (let z = 6; z < 80; z += 14) { K.dolphinLamp(b, EDGE + 6.4, -z); if (z + 14 < 80) K.lightChain(b, EDGE + 6.4, -z, -z - 14); }
    for (let z = 4; z < 36; z += 9) K.bareTree(b, EDGE + 3.2, -z, 1.15, { lights: 'ice' });
    for (let z = 40; z < 78; z += 9) K.bench(b, EDGE + 5.4, -z, 1);
    b.block(VC.solid, '#4a4a52', 40, -2.2, -70, 40, 2.2, 19);
    b.block(VC.solid, '#6a6a72', 40, 0, -60, 8, 1.8, 6);
    for (const s of [-1, 1]) b.box(VC.metal, '#c8ccd4', 40 + s * 3.9, 2.3, -60, 0.06, 1.0, 6);
    K.crowd(b, 37, 43, 58, 62, 6);
    for (const s of [-1, 1]) {
      beam(b, VC.metal, 40, 22, -63.2, 40 + s * 11, 0, -77, 1.2, '#e8eaee');
      beam(b, VC.metal, 40 + s * 5.5, 11, -70.1, 40, 0, -79.5, 0.14, '#c8ccd4');
    }
    beam(b, VC.metal, 34.5, 11, -70.1, 45.5, 11, -70.1, 0.5, '#e8eaee');
    b.sph(VC.glow, hdr('#ff2a2a', 4), 40, 41.6, -60, 0.3, true);
    for (let k = 0; k < 6; k++) { const x = rand(140, 180), z = -rand(6, 74); b.addM(buildingGeo(rand(14, 22), rand(10, 22), rand(12, 18), K.stone, 2.0, 3.4), K.stoneMat, at(x, -2.2, z), '#ffffff'); K.refl(b, x - 9, z, 90, 2.6, pick(['#ffd9a0', '#fff0d0', '#ffcf8a']), -2.1); }
    K.boat(b, 64, -18, 'clipper'); K.boat(b, 92, -66, 'party');
    K.refl(b, 40, -60, 40, 2.4, '#ff6a9a', -2.1);
    // left: County Hall with its curved colonnade, then the Christmas market and a carousel
    b.addM(buildingGeo(22, 20, 42, PALACE, 2.0, 3.4), palaceMat, at(-25, 0, -25), '#f4ece0');
    b.add(PED, VC.solid, -25, 20, -25, 21.6, 5, 41.6, 0, 0, 0, SNOW_ROOF);
    b.block(VC.solid, '#0e0e12', -14.2, 0, -25, 0.6, 14, 14);
    for (let k = 0; k < 8; k++) { const a = ((k - 3.5) / 3.5) * 1.1; b.cyl(VC.solid, '#f4eedc', -13.6 - (1 - Math.cos(a)) * 3, 2 + 6, -25 + Math.sin(a) * 7, 0.5, 12, 'cyl'); }
    b.box(VC.glow, hdr('#ffe0b0', 0.7), -14.5, 3, -25, 0.05, 4, 10);
    b.add(G.plane, eyeSignMat, -13.9, 15.3, -25, 6, 1.1, 1, 0, Math.PI / 2, 0);
    for (let z = 50; z < 79; z += 3.6) K.chalet(b, -(EDGE + 2.6), -z, -1);
    for (const z of [52, 62, 72]) K.festoon(b, -z);
    K.snowman(b, -12.6, -47.5); K.brassBand(b, -(EDGE + 1.0), -8, -1);
    K.crowd(b, -(EDGE + 0.8), -(EDGE + 1.6), 48, 78, 10); K.crowd(b, EDGE + 1.0, EDGE + 2.6, 2, 78, 12);
    const g = b.build();
    const wheel = ferris(); wheel.position.set(40, 22, -60); g.add(wheel); wheels.push(wheel);
    const cb = new Batcher();   // a Victorian carousel turning in the market
    cb.cyl(VC.solid, '#7a1418', 0, 0.35, 0, 4.6, 0.5); cb.cyl(VC.metal, gold, 0, 3, 0, 0.5, 5);
    cb.add(G.cone, VC.solid, 0, 5.9, 0, 10.4, 2.2, 10.4, 0, 0, 0, '#c8202c'); cb.add(G.cone, VC.solid, 0, 6.0, 0, 9.6, 2.1, 9.6, 0, 0, 0, SNOW_ROOF);
    cb.cyl(VC.solid, '#f2e6c8', 0, 4.6, 0, 5.2, 0.5);
    for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2; cb.sph(VC.glow, hdr(k % 2 ? '#ffd890' : '#fff4dc', 2.6), Math.cos(a) * 5.25, 4.6, Math.sin(a) * 5.25, 0.1, true); }
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2, x = Math.cos(a) * 3.4, z = Math.sin(a) * 3.4, y = 1.5 + (k % 2) * 0.4;
      cb.cyl(VC.metal, gold, x, 2.5, z, 0.04, 4);
      cb.add(G.box, VC.solid, x, y, z, 0.36, 0.55, 1.3, 0, -a, 0, pick(['#f4f2ec', '#e8c8a0', '#c8202c', '#2a3a5a']));
      cb.add(G.box, VC.solid, x - Math.sin(a) * 0.62, y + 0.42, z + Math.cos(a) * 0.62, 0.26, 0.5, 0.3, 0.5, -a, 0, '#f4f2ec');
    }
    const carousel = cb.build(); carousel.position.set(-20, 0, -64); g.add(carousel); wheels.push(carousel);
    carousel.userData.axis = 'y';
    return g;
  };

  // ---------- St Paul's Cathedral and the Millennium Bridge ----------
  const stpauls = () => {
    const b = new Batcher();
    farGround(b, -1, '#1a1c24');
    const cx = -24, wf = -36, dz = -64;
    // left: the churchyard, then the west front facing us, two towers and the double portico, the dome rising behind
    b.add(G.plane, plazaMat, -26, 0.04, -16, 30, 32, 1, -Math.PI / 2, 0, 0);
    railing(b, -11.6, 2, 30, 1.2);
    for (let z = 4; z < 30; z += 8) K.bareTree(b, -14, -z, 1.15, { lights: 'warm' });
    buildingRow(b, -1, [K.westType], { x0: 42, depth: [12, 16], gap: [0, 0.3], z0: 0, z1: 34 });
    plinth(b, cx, -27, 2.4, 3); statue(b, cx, 3, -27, '#f4f2ee');
    K.spruce(b, cx - 8.5, -31, 2.2, { lights: 'warm', w: 0.75 }); K.carolers(b, cx + 9, -30, -1);
    for (let k = 0; k < 4; k++) b.block(VC.solid, '#e0d8c4', cx, 0, wf + 4.4 - k * 0.8, 20 - k * 0.8, 1.5 - k * 0.4, 0.8);
    for (const x of [cx + 9, cx - 9]) {
      K.ashlar(b, x, 0, wf - 3, 5.6, 18, 5.6, '#f2ecdf');
      b.cyl(VC.solid, '#f2ecdf', x, 20.5, wf - 3, 2.2, 5, 'cyl8');
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.cyl(VC.solid, '#fff8ec', x + Math.cos(a) * 2.4, 20.5, wf - 3 + Math.sin(a) * 2.4, 0.18, 5, 'cyl8'); }
      b.cyl(VC.glow, hdr('#ffe0b0', 0.8), x, 20.5, wf - 3, 2.1, 3.6);
      b.add(G.sph, VC.solid, x, 23.6, wf - 3, 4.8, 3.2, 4.8, 0, 0, 0, '#8a909c');
      b.add(G.cone8, VC.metal, x, 26.2, wf - 3, 0.8, 2.2, 0.8, 0, 0, 0, gold);
    }
    K.ashlar(b, cx, 0, wf - 3, 13, 17, 6, '#f2ecdf');
    for (let k = 0; k < 8; k++) b.cyl(VC.solid, '#fff8ec', cx - 6.3 + k * 1.8, 1.5 + 4, wf + 0.8, 0.5, 8, 'cyl');
    b.block(VC.solid, '#e8e0cc', cx, 9.5, wf + 0.6, 14, 0.9, 2.4);
    for (let k = 0; k < 6; k++) b.cyl(VC.solid, '#fff8ec', cx - 4.5 + k * 1.8, 10.4 + 3, wf + 0.4, 0.45, 6, 'cyl');
    b.block(VC.solid, '#e8e0cc', cx, 16.4, wf + 0.4, 11, 0.9, 2.2);
    b.add(PED, VC.solid, cx, 17.3, wf + 0.4, 11, 3.2, 2.2, 0, 0, 0, '#e8e0cc'); b.add(PED, VC.solid, cx, 17.28, wf + 0.3, 11.4, 3.4, 2.0, 0, 0, 0, SNOW);
    b.box(VC.glow, hdr('#ffd9a0', 0.8), cx, 4, wf - 0.02, 3, 5, 0.05);
    b.addM(buildingGeo(20, 16, 36, PALACE, 2.0, 3.4), palaceMat, at(cx, 0, -60), '#fff8ee');
    b.box(VC.solid, '#e8e0cc', cx, 16.4, -60, 20.4, 0.8, 36.4); b.box(VC.solid, SNOW, cx, 16.86, -60, 20.4, 0.12, 36.4);
    b.add(PED, VC.solid, cx, 16.8, -60, 16, 3.4, 34, 0, 0, 0, '#5a5e68');
    K.ashlar(b, -12.8, 0, dz, 2.6, 17, 12, '#f2ecdf');
    for (let k = 0; k < 6; k++) b.cyl(VC.solid, '#fff8ec', -11.2, 1 + 5, dz + 5 - k * 2, 0.45, 10, 'cyl');
    b.block(VC.solid, '#e8e0cc', -11.8, 11, dz, 2.0, 0.9, 12.4);
    b.add(PED, VC.solid, -11.8, 11.9, dz, 12.4, 2.8, 2.0, 0, Math.PI / 2, 0, '#e8e0cc'); b.add(PED, VC.solid, -11.8, 11.88, dz, 12.8, 3.0, 1.8, 0, Math.PI / 2, 0, SNOW);
    b.cyl(VC.solid, '#e8e0cc', cx, 17.5, dz, 10.4, 3);
    b.cyl(VC.glow, hdr('#ffd9a0', 0.55), cx, 21.8, dz, 8.6, 5.5);
    for (let k = 0; k < 26; k++) { const a = (k / 26) * Math.PI * 2; b.cyl(VC.solid, '#fff8ec', cx + Math.cos(a) * 9.8, 21.8, dz + Math.sin(a) * 9.8, 0.38, 5.5, 'cyl8'); }
    b.cyl(VC.solid, '#e8e0cc', cx, 25, dz, 10.5, 0.9); b.cyl(VC.solid, SNOW, cx, 25.48, dz, 10.3, 0.05);
    b.cyl(VC.solid, '#ece4d2', cx, 26.8, dz, 8.4, 2.8);
    b.addM(domeGeo(8.4, 9.8), domeMat, at(cx, 28.2, dz), 0xffffff);
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      for (let j = 0; j < 6; j++) { const t0 = (j / 6) * Math.PI / 2, t1 = ((j + 1) / 6) * Math.PI / 2; beam(b, VC.solid, cx + Math.cos(a) * 8.42 * Math.cos(t0), 28.2 + 9.82 * Math.sin(t0), dz + Math.sin(a) * 8.42 * Math.cos(t0), cx + Math.cos(a) * 8.42 * Math.cos(t1), 28.2 + 9.82 * Math.sin(t1), dz + Math.sin(a) * 8.42 * Math.cos(t1), 0.15, '#c8ccd4'); }
    }
    b.cyl(VC.solid, '#ece4d2', cx, 39.8, dz, 1.5, 3.5, 'cyl8');
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.2; b.add(G.box, VC.glow, cx + Math.sin(a) * 1.52, 39.8, dz + Math.cos(a) * 1.52, 0.55, 2.2, 0.05, 0, a, 0, hdr('#ffe0b0', 1.1)); }
    b.add(G.sph, VC.solid, cx, 41.8, dz, 3.0, 2.0, 3.0, 0, 0, 0, '#8a909c');
    b.sph(VC.glow, hdr('#ffd86a', 1.8), cx, 43.2, dz, 0.6);
    b.box(VC.glow, hdr('#ffd86a', 1.8), cx, 44.6, dz, 0.2, 1.8, 0.2); b.box(VC.glow, hdr('#ffd86a', 1.8), cx, 44.9, dz, 1.1, 0.2, 0.2);
    for (let z = 6; z < 78; z += 16) K.vicLamp(b, -(EDGE + 0.9), -z, true);
    K.crowd(b, -(EDGE + 1.2), -(EDGE + 6.2), 6, 78, 12); K.crowd(b, -16, -34, 4, 26, 10);
    // right: the Thames, the Millennium Bridge's blade of light out to Tate Modern, the embankment walk
    K.embankment(b, 1);
    b.add(G.plane, K.thames, 131, -2.2, -40, 238, 80, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#3a3a40', 131, -1.2, -79.9, 238, 2.2, 0.2);
    const by = -0.6;
    b.box(VC.solid, '#c8ccd4', 120, by, -62, 216, 0.3, 4.2);
    for (const s of [-1, 1]) {
      b.box(VC.glow, hdr('#dfeeff', 1.6), 120, by + 0.2, -62 + s * 2.05, 216, 0.08, 0.08);
      for (let x = 14; x < 228; x += 8) beam(b, VC.metal, x, by - 0.1, -62 + s * 2.1, x, by + 1.0, -62 + s * 3.2, 0.12, '#c8ccd4');
      b.box(VC.metal, '#d8dce4', 120, by + 0.9, -62 + s * 3.25, 216, 0.25, 0.25);
    }
    for (const px of [62, 140]) {
      b.cyl(VC.solid, '#8a8e96', px, -6.5, -62, 1.4, 9, 'cyl8');
      for (const s of [-1, 1]) beam(b, VC.solid, px, -2.6, -62, px, by - 0.2, -62 + s * 3.4, 0.5, '#9aa0a8');
    }
    b.box(VC.solid, '#5a5e66', 12.6, by / 2, -62, 3.2, -by + 0.2, 4.6);
    b.block(VC.solid, '#5a3a2e', 188, -2.2, -62, 40, 24, 70);
    b.block(VC.solid, '#5a3a2e', 172, -2.2, -62, 8, 54, 8);
    b.box(VC.glow, hdr('#ffe6b0', 1.6), 172, 52.6, -62, 8.2, 2.4, 8.2);
    K.refl(b, 168, -62, 110, 3, '#ffe6b0', -2.1);
    for (let k = 0; k < 4; k++) { const x = rand(150, 175), z = -rand(4, 40); b.addM(buildingGeo(rand(14, 22), rand(10, 22), rand(12, 18), K.brick, 2.1, 3.2), K.brickMat, at(x, -2.2, z), '#ffffff'); K.refl(b, x - 9, z, 80, 2.4, pick(['#ffd9a0', '#fff0d0']), -2.1); }
    for (let z = 6; z < 80; z += 14) { if (Math.abs(z - 62) < 5) continue; K.dolphinLamp(b, EDGE + 6.4, -z); if (z + 14 < 80 && Math.abs(z + 7 - 62) > 6) K.lightChain(b, EDGE + 6.4, -z, -z - 14); }
    for (let z = 4; z < 78; z += 10) if (Math.abs(z - 62) > 6) K.bareTree(b, EDGE + 3.3, -z, 1.15, { lights: 'warm' });
    K.boat(b, 84, -30, 'party');
    K.crowd(b, EDGE + 1.2, EDGE + 5.6, 2, 78, 10);
    return b.build();
  };

  return {
    landmarks: [
      { name: '威斯敏斯特 · 大本钟', en: 'BIG BEN · WESTMINSTER', build: westminster },
      { name: '特拉法加广场', en: 'TRAFALGAR SQUARE', build: trafalgar },
      { name: '皮卡迪利广场 · 摄政街', en: 'PICCADILLY CIRCUS', build: piccadilly },
      { name: '白金汉宫', en: 'BUCKINGHAM PALACE', build: buckingham },
      { name: '伦敦塔桥', en: 'TOWER BRIDGE', build: towerBridge },
      { name: '伦敦眼 · 南岸', en: 'LONDON EYE · SOUTH BANK', build: eye },
      { name: '圣保罗大教堂 · 千禧桥', en: "ST PAUL'S CATHEDRAL", build: stpauls },
    ],
    update(t) {
      for (const w of wheels) { if (w.userData.axis === 'y') w.rotation.y = t * 0.35; else w.rotation.z = t * 0.05; }
    },
    unionJack,
  };
}
