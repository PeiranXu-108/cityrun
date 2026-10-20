// New York street kit: Brooklyn brownstones with stoops, SoHo cast-iron lofts, sidewalk sheds, subway entrances with their
// green globes, food carts, street signs and WALK signals, cabs, squad cars and fire trucks, steam rising from the street,
// umbrellas in the rain, and the light arches of Little Italy.
import { THREE, VC, G, std, basic, hdr, windowTex, canvasTex, planeUV, stripeTex, rand, randi, pick, chance } from '../core.js';
import { facadeMat, buildingRow, EDGE, at } from './common.js';
import { beam, wire } from './tokyo_kit.js';
import { parkTreeKit } from './trees.js';
import { blink } from '../props.js';

export const NEON = ['#ff3df0', '#00e5ff', '#ffe23d', '#39ff88', '#ff6a3d', '#b26bff'];
const STREETS = ['BROADWAY', 'W 42 ST', '5 AV', 'BLEECKER ST', 'MULBERRY ST', 'PARK AV', 'CANAL ST', 'W 4 ST', 'LEXINGTON AV', 'SPRING ST'];
export const LINES = [
  { lines: ['N', 'Q', 'R', 'W'], color: '#fccc0a', fg: '#141414' }, { lines: ['4', '5', '6'], color: '#00933c' },
  { lines: ['A', 'C', 'E'], color: '#0039a6' }, { lines: ['1', '2', '3'], color: '#ee352e' },
  { lines: ['7'], color: '#b933ad' }, { lines: ['B', 'D', 'F', 'M'], color: '#ff6319' },
];
const FONT = '"Chakra Petch", "Helvetica Neue", Arial, sans-serif';

// ---------- textures ----------
function streetSigns() {   // green street-name blades
  const cw = 512, ch = 112, n = STREETS.length;
  const tex = canvasTex(cw, ch * n, (g) => {
    STREETS.forEach((t, i) => {
      const y = i * ch;
      g.fillStyle = '#0b6b3a'; g.fillRect(0, y, cw, ch);
      g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.strokeRect(8, y + 8, cw - 16, ch - 16);
      g.fillStyle = '#ffffff'; g.font = `700 58px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(t, cw / 2, y + ch / 2 + 3);
    });
  }, { repeat: false });
  return { tex, rects: STREETS.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / n, v1: 1 - i / n })) };
}
function subwaySigns() {   // black "SUBWAY" band with the route bullets
  const cw = 512, ch = 96, n = LINES.length;
  const tex = canvasTex(cw, ch * n, (g) => {
    LINES.forEach((L, i) => {
      const y = i * ch, cy = y + ch / 2 + 4;
      g.fillStyle = '#111114'; g.fillRect(0, y, cw, ch);
      g.fillStyle = '#ffffff'; g.fillRect(0, y + 8, cw, 3);
      g.font = `700 46px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('SUBWAY', 20, cy);
      L.lines.forEach((l, k) => {
        const cx = 250 + k * 64;
        g.fillStyle = L.color; g.beginPath(); g.arc(cx, cy, 26, 0, Math.PI * 2); g.fill();
        g.fillStyle = L.fg || '#ffffff'; g.font = `700 34px ${FONT}`; g.textAlign = 'center'; g.fillText(l, cx, cy + 1);
      });
    });
  }, { repeat: false });
  return { tex, rects: LINES.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / n, v1: 1 - i / n })) };
}
function walkTex(walk) {   // pedestrian signal: white walker or orange hand
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, w, h);
    if (walk) {
      g.fillStyle = '#f4f6ff'; g.beginPath(); g.arc(64, 26, 10, 0, Math.PI * 2); g.fill();
      g.lineCap = 'round'; g.strokeStyle = '#f4f6ff'; g.lineWidth = 12;
      g.beginPath(); g.moveTo(62, 42); g.lineTo(58, 76); g.lineTo(42, 108); g.moveTo(58, 76); g.lineTo(78, 106);
      g.moveTo(60, 52); g.lineTo(40, 66); g.moveTo(60, 52); g.lineTo(82, 64); g.stroke();
    } else {
      g.fillStyle = '#ff7a1a'; g.fillRect(44, 54, 42, 46); g.fillRect(28, 62, 18, 10);
      for (let k = 0; k < 4; k++) g.fillRect(46 + k * 10, 26 + Math.abs(k - 1.5) * 4, 8, 34);
    }
  }, { repeat: false });
}
function steamTex() {   // soft billows that scroll upward
  const t = canvasTex(64, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = w / 2 + rand(-10, 10), y = rand(0, h), r = rand(10, 22);
      for (const oy of [0, h, -h]) {
        const gr = g.createRadialGradient(x, y + oy, 0, x, y + oy, r);
        gr.addColorStop(0, 'rgba(255,255,255,0.32)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(x - r, y + oy - r, r * 2, r * 2);
      }
    }
  });
  t.wrapS = THREE.ClampToEdgeWrapping;
  return t;
}
function fadeTex() {   // alpha mask: dense at the vent, thinning out upward and toward the edges
  return canvasTex(64, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.65, '#5a5a5a'); gr.addColorStop(1, '#000000');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const sx = g.createLinearGradient(0, 0, w, 0);
    sx.addColorStop(0, 'rgba(0,0,0,1)'); sx.addColorStop(0.32, 'rgba(0,0,0,0)'); sx.addColorStop(0.68, 'rgba(0,0,0,0)'); sx.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = sx; g.fillRect(0, 0, w, h);
  }, { repeat: false });
}
function fairyTex() {   // warm string lights wound through a tree
  return canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 150; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 60, x = w / 2 + Math.cos(a) * r, y = h / 2 + Math.sin(a) * r * 0.9;
      const gr = g.createRadialGradient(x, y, 0, x, y, 3.4);
      gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = gr; g.fillRect(x - 4, y - 4, 8, 8);
    }
  }, { repeat: false });
}
function checkerTex() {   // red-and-white checked tablecloth
  return canvasTex(64, 64, (g, w, h) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#f4f0ea' : '#c8202c'; g.fillRect(x * 8, y * 8, 8, 8); }
  });
}
function italyTex() {
  return canvasTex(1024, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.font = '900 78px "Russo One", "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = '#1f8a3a'; g.strokeText('WELCOME TO LITTLE ITALY', w / 2, h / 2);
    g.lineWidth = 4; g.strokeStyle = '#d8202c'; g.strokeText('WELCOME TO LITTLE ITALY', w / 2, h / 2);
    g.fillStyle = '#ffffff'; g.fillText('WELCOME TO LITTLE ITALY', w / 2, h / 2);
  }, { repeat: false });
}
function nypdBarTex() {   // blue NYPD sawhorse rail
  return canvasTex(512, 64, (g, w, h) => {
    g.fillStyle = '#1f3f8a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.font = `700 34px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('POLICE LINE · DO NOT CROSS', w / 2, h / 2 + 2);
  }, { repeat: false });
}

// ---------- the kit ----------
export function makeKit() {
  const K = {};
  Object.assign(K, parkTreeKit());
  const ss = streetSigns();
  K.signRects = ss.rects; K.signMat = basic({ map: ss.tex, color: hdr('#ffffff', 0.95), side: THREE.DoubleSide });
  const sw = subwaySigns();
  K.subwayRects = sw.rects; K.subwayMat = basic({ map: sw.tex, color: hdr('#ffffff', 1.05), side: THREE.DoubleSide });
  K.walkMats = [walkTex(true), walkTex(false)].map((t) => basic({ map: t, color: hdr('#ffffff', 1.6) }));
  K.steam = steamTex();
  K.steamMat = basic({ map: K.steam, alphaMap: fadeTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide, color: hdr('#d4d8e8', 0.6) });
  K.fairyMat = basic({ map: fairyTex(), color: hdr('#ffd9a0', 1.1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  K.umbrellaMats = [['#1f5fbf', '#ffd23d'], ['#c8202c', '#f4f0ea'], ['#1f8a3a', '#f4f0ea']].map(([a, c]) => std({ map: stripeTex(a, c, 8), roughness: 0.7, side: THREE.DoubleSide }));
  K.checkerMat = std({ map: checkerTex(), roughness: 0.8 });
  const it = italyTex();
  K.italyMat = basic({ map: it, transparent: true, color: hdr('#ffffff', 1.25), side: THREE.DoubleSide });
  K.nypdBar = std({ map: nypdBarTex(), roughness: 0.55, emissive: '#ffffff', emissiveMap: nypdBarTex(), emissiveIntensity: 0.25 });

  // ---------- facades ----------
  K.brown = windowTex({ wall: '#5a3428', glass: '#0d0f18', lit: ['#ffcc75', '#ffb35c', '#ffe0a8'], litChance: 0.55, frame: '#3a2018', ledge: '#4a2a20', cols: 3, rows: 4 });
  K.brownMat = facadeMat(K.brown, { k: 0.95 });
  K.iron = windowTex({ wall: '#d9d0bf', glass: '#14161c', lit: ['#ffe0a8', '#fff4dc', '#cfe6ff'], litChance: 0.5, arch: true, frame: '#f4eee2', ledge: '#b8ae9c', cols: 5, rows: 8 });
  K.ironMat = facadeMat(K.iron, { k: 0.85 });

  K.fireEscape = (b, i) => {
    const x = i.face - i.side * 0.55, zc = i.z + rand(-i.len * 0.2, i.len * 0.2), L = Math.min(4.2, i.len - 1);
    for (let y = 4; y < i.h - 2; y += 2.7) {
      b.box(VC.metal, '#25262b', x, y, zc, 1.1, 0.08, L);
      b.box(VC.metal, '#25262b', x - i.side * 0.5, y + 0.5, zc, 0.05, 0.05, L);
      b.add(G.box, VC.metal, x, y + 1.35, zc, 0.5, 0.06, 3.3, 0.72, 0, 0, '#25262b');
    }
  };
  K.waterTower = (b, i) => {
    const x = i.x + rand(-1.5, 1.5), z = i.z + rand(-1, 1), y = i.h;
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.cyl(VC.solid, '#2a211b', x + dx, y + 1.1, z + dz, 0.1, 2.2, 'cyl6');
    b.cyl(VC.solid, '#6b4a32', x, y + 3.6, z, 1.6, 2.8);
    b.add(G.cone, VC.solid, x, y + 5.6, z, 3.4, 1.3, 3.4, 0, 0, 0, '#3d2a1e');
  };
  // Brooklyn brownstone: stoop with iron rails, glowing transom, bay window, heavy cornice
  K.brownType = { mat: K.brownMat, tex: K.brown, colors: ['#ffffff', '#e8d6c8', '#d6c0b0', '#c8b0a0'], w: [5.6, 7.2], h: [12, 16], weight: 1, cellW: 1.9, cellH: 3.3,
    roof: (b, i) => {
      b.box(VC.solid, '#3a2018', i.face - i.side * 0.3, i.h - 0.35, i.z, 0.75, 0.7, i.len + 0.05);
      for (let k = -1; k <= 1; k++) b.box(VC.solid, '#2e1a14', i.face - i.side * 0.35, i.h - 0.95, i.z + k * (i.len / 2 - 0.5), 0.6, 0.5, 0.25);
    },
    front: (b, i) => {
      const s = i.side, zd = i.z + pick([-1, 1]) * (i.len / 2 - 1.5);
      for (let k = 0; k < 8; k++) b.block(VC.solid, '#5e3a2c', i.face - s * (0.45 + k * 0.42), 0, zd, 0.43, Math.max(0.2, 1.95 - k * 0.24), 2.0);
      for (const dz of [-1.05, 1.05]) {
        beam(b, VC.metal, i.face - s * 0.3, 2.95, zd + dz, i.face - s * 3.7, 1.05, zd + dz, 0.06, '#141418');
        b.cyl(VC.metal, '#141418', i.face - s * 3.75, 0.55, zd + dz, 0.07, 1.1);
        b.sph(VC.metal, '#141418', i.face - s * 3.75, 1.15, zd + dz, 0.1, true);
      }
      b.box(VC.solid, '#6a4030', i.face - s * 0.05, 3.35, zd, 0.12, 2.9, 1.95);
      b.box(VC.solid, '#2a1810', i.face - s * 0.1, 3.0, zd, 0.06, 2.1, 1.3);
      b.box(VC.glow, hdr('#ffcf8a', 1.1), i.face - s * 0.12, 4.3, zd, 0.04, 0.4, 1.2);
      const fz = i.z - (zd - i.z) * 0.15, fl = i.len - 2.6;
      b.box(VC.metal, '#141418', i.face - s * 1.6, 0.55, fz, 0.05, 1.1, fl);
      b.box(VC.metal, '#141418', i.face - s * 1.6, 1.1, fz, 0.07, 0.06, fl);
      if (chance(0.3)) {
        const zw = i.z - (zd - i.z) * 0.9;
        b.box(VC.solid, '#5a3428', i.face - s * 0.5, 6.6, zw, 1.0, 6.8, 2.6);
        for (const y of [5.2, 8.4]) b.box(VC.glow, hdr(pick(['#ffcc75', '#ffe0a8']), 0.85), i.face - s * 1.02, y, zw, 0.04, 1.6, 1.8);
      }
      if (chance(0.5)) for (const dz of [-0.4, 0.4]) b.cyl(VC.solid, '#3a3c40', i.face - s * 4.3, 0.45, zd + 1.6 + dz, 0.28, 0.9);
      if (chance(0.25)) K.person(b, i.face - s * 2.5, zd, { seated: true, y: 0.9 });
    } };
  K.brownstones = (b, side, z0, z1) => buildingRow(b, side, [K.brownType], { x0: 11.6, depth: [12, 16], gap: [0, 0.05], z0, z1, setback: [0, 0.1] });
  // SoHo cast-iron loft: pilasters, floor bands, cornice, fire escape, a lit boutique window
  K.ironType = { mat: K.ironMat, tex: K.iron, colors: ['#ffffff', '#e8e2d8', '#d8d0c4', '#c8c0b4'], w: [10, 16], h: [20, 28], weight: 1, cellW: 1.7, cellH: 3.4,
    roof: (b, i) => {
      b.box(VC.solid, '#e8e2d6', i.face - i.side * 0.35, i.h - 0.4, i.z, 0.9, 0.8, i.len + 0.1);
      if (chance(0.4)) K.waterTower(b, i);
    },
    front: (b, i) => {
      const s = i.side, n = Math.max(2, Math.round(i.len / 1.7));
      for (let k = 0; k <= n; k++) b.box(VC.solid, '#f0ebe0', i.face - s * 0.1, i.h / 2, i.z - i.len / 2 + (i.len * k) / n, 0.2, i.h - 0.6, 0.22);
      for (let y = 4.6; y < i.h - 1; y += 3.4) b.box(VC.solid, '#e0d8ca', i.face - s * 0.12, y, i.z, 0.24, 0.26, i.len);
      if (chance(0.7)) K.fireEscape(b, i);
      b.box(VC.glow, hdr(pick(['#ffe0b0', '#fff4dc', '#ffd0e6']), 0.6), i.face - s * 0.03, 1.8, i.z, 0.05, 3.0, i.len - 1.4);
      b.box(VC.solid, '#141418', i.face - s * 0.2, 3.6, i.z, 0.3, 0.5, i.len - 0.6);
    } };
  K.lofts = (b, side, z0, z1) => buildingRow(b, side, [K.ironType], { x0: 11, depth: [12, 16], gap: [0.05, 0.4], z0, z1 });

  // ---------- people ----------
  const COATS = ['#23252e', '#3a2f3f', '#1f2a3a', '#4a3a34', '#2f3a2f', '#5a2b33', '#2a3550', '#8a7a6a', '#c9a227'];
  K.person = (b, x, z, { s = rand(0.92, 1.06), coat = pick(COATS), seated = false, y = 0, umb = false } = {}) => {
    const yy = y + (seated ? -0.45 : 0);
    if (!seated) b.add(G.cyl8, VC.solid, x, y + 0.55 * s, z, 0.3 * s, 1.1 * s, 0.24 * s, 0, 0, 0, '#1c1c22');
    b.box(VC.solid, coat, x, yy + 1.25 * s, z, 0.46 * s, 0.62 * s, 0.28 * s);
    b.sph(VC.solid, pick(['#d9b08c', '#a87a5a', '#7a5238', '#e8c4a0']), x, yy + 1.72 * s, z, 0.15 * s, true);
    b.sph(VC.solid, pick(['#141414', '#2a1a12', '#3a2a1a', '#6a4a2a']), x, yy + 1.79 * s, z + 0.02, 0.16 * s, true);
    if (umb) {
      b.cyl(VC.solid, '#333333', x + 0.12, yy + 1.75, z, 0.015, 0.8);
      b.add(G.cone, VC.solid, x + 0.12, yy + 2.22, z, 1.2, 0.34, 1.2, 0, 0, 0, pick(['#141418', '#141418', '#141418', '#b3202c', '#2a3a6a', '#e8c547', '#3a6a4a']));
    }
  };
  K.crowd = (b, x0, x1, z0, z1, n, umb = 0.6) => {
    for (let i = 0; i < n; i++) K.person(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1), { umb: Math.random() < umb });
  };

  // ---------- street furniture ----------
  K.hydrant = (b, x, z) => {
    b.cyl(VC.solid, '#c8202c', x, 0.45, z, 0.18, 0.9);
    b.sph(VC.solid, '#c8202c', x, 0.92, z, 0.2);
    b.cyl(VC.solid, '#c8202c', x, 0.62, z, 0.07, 0.52, 'cyl', 0, Math.PI / 2);
    b.cyl(VC.solid, '#d8d4c8', x, 1.1, z, 0.08, 0.1);
  };
  K.mailbox = (b, x, z) => {   // blue mailbox
    b.block(VC.solid, '#1f4fa6', x, 0.25, z, 0.55, 0.85, 0.5);
    b.cyl(VC.solid, '#1f4fa6', x, 1.1, z, 0.27, 0.5, 'cyl', Math.PI / 2);
    for (const [dx, dz] of [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]]) b.box(VC.solid, '#1a3a7a', x + dx, 0.12, z + dz, 0.06, 0.25, 0.06);
  };
  K.newsBoxes = (b, x, z, side) => {
    for (let k = 0; k < 3; k++) b.block(VC.solid, pick(['#c8202c', '#e8c547', '#1f4fa6', '#2f8a4a', '#e8e8ea']), x, 0, z - k * 0.55, 0.45, 1.0, 0.45);
    b.box(VC.glow, hdr('#fff4dc', 0.5), x - side * 0.23, 0.75, z - 0.55, 0.02, 0.3, 1.4);
  };
  K.trash = (b, x, z) => { b.cyl(VC.metal, '#2f5a3a', x, 0.45, z, 0.3, 0.9, 'cyl8'); b.cyl(VC.metal, '#3a6a4a', x, 0.92, z, 0.33, 0.06, 'cyl8'); };
  K.kiosk = (b, x, z) => {   // street wifi kiosk with a screen on each face
    b.block(VC.metal, '#b9bec8', x, 0, z, 0.32, 2.9, 0.95);
    const c = pick(['#2a8adf', '#ff3df0', '#39ff88', '#ffb13d']);
    for (const dz of [-0.48, 0.48]) b.box(VC.glow, hdr(c, 0.9), x, 1.75, z + dz, 0.26, 1.7, 0.02);
  };
  K.streetSign = (b, x, z, i = randi(0, STREETS.length - 1), j = randi(0, STREETS.length - 1)) => {
    b.cyl(VC.metal, '#4a4e56', x, 2.6, z, 0.07, 5.2, 'cyl8');
    b.add(planeUV(K.signRects[i]), K.signMat, x, 4.95, z, 2.4, 0.52, 1);
    b.add(planeUV(K.signRects[j]), K.signMat, x, 4.4, z, 2.4, 0.52, 1, 0, Math.PI / 2, 0);
  };
  K.walkSignal = (b, x, z, side) => {   // traffic lights and a WALK / DON'T WALK head, facing the runner
    b.cyl(VC.metal, '#3a3e46', x, 2.2, z, 0.08, 4.4, 'cyl8');
    b.block(VC.solid, '#e0b020', x, 3.5, z + 0.2, 0.42, 1.25, 0.32);
    const go = chance(0.5);
    for (const [k, col] of [[0, '#ff2a2a'], [1, '#ffb020'], [2, '#19e080']]) {
      const on = go ? k === 2 : k === 0;
      b.cyl(VC.glow, hdr(col, on ? 3 : 0.25), x, 4.5 - k * 0.38, z + 0.37, 0.13, 0.05, 'cyl', Math.PI / 2);
    }
    b.block(VC.solid, '#1a1a1e', x - side * 0.3, 2.2, z, 0.5, 0.5, 0.3);
    b.add(G.plane, K.walkMats[go ? 0 : 1], x - side * 0.3, 2.45, z + 0.16, 0.42, 0.42, 1);
  };
  K.scaffold = (b, side, z0, z1, x1 = 11) => {   // sidewalk shed, lit from below
    const xa = side * (EDGE + 2.0), len = z1 - z0, zc = -(z0 + len / 2), xm = (xa + side * x1) / 2, w = Math.abs(side * x1 - xa);
    b.box(VC.solid, pick(['#2f5a3a', '#2a3f6a', '#3a3c40']), xm, 3.55, zc, w, 0.3, len);
    b.box(VC.solid, '#d8c27a', xm, 3.3, zc, w - 0.1, 0.18, len - 0.1);
    for (let z = z0 + 0.3; z <= z1 - 0.2; z += 2.4) {
      b.cyl(VC.metal, '#8a8e96', xa, 1.7, -z, 0.06, 3.4, 'cyl6');
      b.box(VC.glow, hdr('#fff0d0', 0.9), xm, 3.18, -z - 1.2, 0.5, 0.06, 0.5);
    }
    b.box(VC.metal, '#8a8e96', xa, 3.25, zc, 0.08, 0.08, len);
    for (let k = 0; k < Math.floor(len / 6); k++) b.box(VC.glow, hdr(pick(NEON), 0.5), xa + side * 0.04, 1.5, -(z0 + 2 + k * 6), 0.02, 1.4, 1.0);
  };
  K.subwayEntrance = (b, x, z, side, i = randi(0, LINES.length - 1)) => {   // stairs down with green globes and the line bullets
    b.box(VC.solid, '#060608', x, 0.02, z - 2.2, 1.9, 0.04, 4.4);
    for (let k = 0; k < 6; k++) b.box(VC.solid, '#2a2a30', x, 0.045, z - 0.6 - k * 0.65, 1.7, 0.02, 0.12);
    for (const dx of [-1, 1]) {
      b.box(VC.metal, '#2f5a3a', x + dx * 1.0, 0.95, z - 2.2, 0.06, 0.06, 4.4);
      for (let k = 0; k <= 5; k++) b.box(VC.metal, '#2f5a3a', x + dx * 1.0, 0.48, z - 0.05 - k * 0.86, 0.05, 0.95, 0.05);
      b.cyl(VC.metal, '#2f5a3a', x + dx * 1.0, 1.25, z, 0.05, 2.5, 'cyl6');
      b.sph(VC.glow, hdr('#39d26a', 2.2), x + dx * 1.0, 2.6, z, 0.24);
    }
    b.box(VC.metal, '#2f5a3a', x, 0.95, z - 4.4, 2.0, 0.06, 0.06);
    b.add(planeUV(K.subwayRects[i]), K.subwayMat, x, 2.15, z + 0.02, 2.1, 0.4, 1);
  };
  K.cart = (b, x, z, kind = pick(['hotdog', 'halal'])) => {
    if (kind === 'hotdog') {
      b.block(VC.metal, '#c9ced6', x, 0.3, z, 1.0, 0.9, 1.8);
      for (const dz of [-0.6, 0.6]) b.cyl(VC.solid, '#1a1a1e', x - 0.52, 0.28, z + dz, 0.28, 0.08, 'cyl', 0, Math.PI / 2);
      b.cyl(VC.metal, '#8a8e96', x, 1.7, z, 0.03, 1.6);
      b.add(G.cone, pick(K.umbrellaMats), x, 2.55, z, 2.2, 0.6, 2.2);
      b.box(VC.glow, hdr('#ffd9a0', 1.1), x, 1.25, z, 0.9, 0.06, 1.6);
    } else {
      b.block(VC.metal, '#b9bec8', x, 0.25, z, 1.3, 1.9, 2.3);
      b.box(VC.glow, hdr('#ffd23d', 1.2), x + 0.66, 1.7, z, 0.02, 0.7, 1.9);
      b.box(VC.glow, hdr('#ff3b3b', 1.2), x + 0.66, 2.2, z, 0.02, 0.25, 1.9);
      b.add(G.box, VC.solid, x, 2.35, z, 1.6, 0.06, 2.5, 0, 0, 0.12, '#c8202c');
      b.add(G.plane, K.steamMat, x, 3.6, z - 0.5, 1.4, 3.2, 1);
    }
    K.person(b, x - 0.9, z, { coat: pick(['#2a3550', '#3a2f3f', '#4a3a34']) });
  };
  K.citibikes = (b, x, z0, n) => {
    b.box(VC.metal, '#8a8e96', x, 0.06, -(z0 + n * 0.35), 0.5, 0.12, n * 0.7);
    for (let k = 0; k < n; k++) {
      const z = -(z0 + 0.35 + k * 0.7);
      for (const dx of [-0.5, 0.5]) b.add(G.tor, VC.metal, x + dx, 0.36, z, 0.7, 0.7, 0.7, 0, 0, 0, '#2a2a2e');
      beam(b, VC.metal, x - 0.5, 0.36, z, x + 0.1, 0.85, z, 0.06, '#1f6fd0');
      beam(b, VC.metal, x + 0.5, 0.36, z, x + 0.4, 1.0, z, 0.06, '#1f6fd0');
      b.box(VC.solid, '#1f6fd0', x + 0.45, 0.95, z, 0.3, 0.2, 0.32);
    }
  };
  K.steamStack = (b, x, z) => {   // orange-and-white chimney venting street steam
    for (let k = 0; k < 4; k++) b.cyl(VC.solid, k % 2 ? '#ffffff' : '#ff6a00', x, 0.4 + k * 0.5, z, 0.45, 0.5);
    for (const ry of [0, Math.PI / 2]) b.add(G.plane, K.steamMat, x, 2.0 + 3.6, z, 2.4, 7.2, 1, 0, ry, 0);
  };
  K.manholeSteam = (b, x, z) => {
    b.cyl(VC.metal, '#2a2a2e', x, 0.03, z, 0.5, 0.04);
    for (const ry of [0.4, 0.4 + Math.PI / 2]) b.add(G.plane, K.steamMat, x, 2.4, z, 2.0, 4.8, 1, 0, ry, 0);
  };
  K.taxi = (b, x, z) => {
    b.block(VC.solid, '#f5c400', x, 0.35, z, 1.9, 0.75, 4.2);
    b.block(VC.solid, '#f5c400', x, 1.1, z + 0.3, 1.7, 0.6, 2.2);
    b.box(VC.glow, hdr('#ffffff', 1.4), x, 1.45, z + 0.3, 1.72, 0.3, 1.6);
    b.box(VC.glow, hdr('#fff4c0', 2.5), x, 1.85, z + 0.3, 0.6, 0.16, 0.25);
    for (const dz of [-1.3, 1.3]) for (const dx of [-0.8, 0.8]) b.cyl(VC.solid, '#111', x + dx, 0.32, z + dz, 0.32, 0.25, 'cyl', 0, Math.PI / 2);
    b.box(VC.glow, hdr('#fff4d6', 2.2), x, 0.62, z + 2.11, 1.4, 0.12, 0.04);
  };
  K.nypd = (b, x, z) => {   // squad car with its strobing light bar
    b.block(VC.solid, '#eef0f4', x, 0.35, z, 1.9, 0.75, 4.4);
    b.block(VC.solid, '#eef0f4', x, 1.1, z + 0.2, 1.7, 0.6, 2.3);
    b.box(VC.glow, hdr('#9fb4d8', 0.35), x, 1.45, z + 0.2, 1.72, 0.3, 1.9);
    for (const sx of [-1, 1]) { b.box(VC.solid, '#1f3f8a', x + sx * 0.96, 0.75, z, 0.02, 0.16, 4.3); b.box(VC.solid, '#1f3f8a', x + sx * 0.96, 0.52, z, 0.02, 0.06, 4.3); }
    b.box(blink.strobe, 0xffffff, x, 1.82, z + 0.25, 1.3, 0.14, 0.32);
    for (const dz of [-1.35, 1.35]) for (const dx of [-0.8, 0.8]) b.cyl(VC.solid, '#111', x + dx, 0.32, z + dz, 0.32, 0.25, 'cyl', 0, Math.PI / 2);
  };
  K.fdny = (b, x, z) => {   // ladder truck
    b.block(VC.solid, '#c8202c', x, 0.45, z, 2.4, 2.1, 8.4);
    b.block(VC.solid, '#c8202c', x, 0.45, z + 4.9, 2.4, 2.6, 2.2);
    b.box(VC.glow, hdr('#bcd6ff', 0.4), x, 2.3, z + 5.95, 2.2, 0.8, 0.04);
    b.box(VC.solid, '#f2f2ea', x, 1.2, z, 2.42, 0.18, 8.4);
    for (const dx of [-0.5, 0.5]) b.box(VC.metal, '#c9ced6', x + dx, 2.75, z - 0.5, 0.1, 0.1, 9.5);
    for (let k = 0; k < 13; k++) b.box(VC.metal, '#c9ced6', x, 2.75, z - 5 + k * 0.75, 1.0, 0.06, 0.06);
    b.box(blink.warn, 0xffffff, x, 3.2, z + 5.4, 1.6, 0.14, 0.3);
    for (const dz of [-3, -1.6, 4.6]) for (const dx of [-1.0, 1.0]) b.cyl(VC.solid, '#111', x + dx, 0.48, z + dz, 0.48, 0.32, 'cyl', 0, Math.PI / 2);
  };
  K.tree = (b, x, z, s = 1, lights = false) => {
    K.planeTree(b, x, z, s);
    b.cyl(VC.metal, '#1a1a1e', x, 0.25, z, 0.75, 0.5, 'cyl8');
    if (lights) for (const ry of [0, Math.PI / 2]) b.add(G.plane, K.fairyMat, x, 4.6 * s, z, 4.4 * s, 3.6 * s, 1, 0, ry + 0.3, 0);
  };
  // ---------- Little Italy: light arches across the street, sidewalk tables ----------
  K.festaArch = (b, z) => {
    const cols = ['#ff3a3a', '#fff4dc', '#39d26a'], N = 44;
    for (const sx of [-1, 1]) b.cyl(VC.metal, '#3a3e46', sx * 10.4, 3.5, z, 0.12, 7, 'cyl8');
    let prev = null;
    for (let k = 0; k <= N; k++) {
      const t = k / N, x = -10.4 + 20.8 * t, y = 7 + 5.6 * Math.sin(Math.PI * t);
      if (prev) beam(b, VC.metal, prev[0], prev[1], z, x, y, z, 0.05, '#3a3e46');
      b.sph(VC.glow, hdr(cols[k % 3], 2.6), x, y - 0.12, z, 0.13, true);
      prev = [x, y];
    }
    b.add(G.plane, K.italyMat, 0, 12.15, z + 0.06, 6.4, 1.0, 1);
    b.add(G.plane, K.italyMat, 0, 12.15, z - 0.06, 6.4, 1.0, 1, 0, Math.PI, 0);
  };
  K.bulbString = (b, za, zb, y = 11.6) => {   // a string of bulbs zigzagging high across the street
    const n = 20;
    wire(b, -10.5, y, -za, 10.5, y, -zb, 0.6, { n: 8 });
    for (let k = 1; k < n; k++) {
      const t = k / n, x = -10.5 + 21 * t, z = -(za + (zb - za) * t), yy = y - 0.6 * 4 * t * (1 - t) - 0.15;
      b.sph(VC.glow, hdr(['#ff3a3a', '#fff4dc', '#39d26a'][k % 3], 2.2), x, yy, z, 0.1, true);
    }
  };
  K.cafe = (b, x, z) => {   // sidewalk table with a checked cloth, a candle and two chairs
    b.cyl(VC.metal, '#2a2a2e', x, 0.38, z, 0.05, 0.76);
    b.add(G.cyl, K.checkerMat, x, 0.78, z, 1.0, 0.04, 1.0);
    b.sph(VC.glow, hdr('#ffb04a', 2.4), x, 0.86, z, 0.05, true);
    for (const dz of [-0.75, 0.75]) { b.block(VC.metal, '#3a2a20', x, 0, z + dz, 0.4, 0.45, 0.4); b.box(VC.metal, '#3a2a20', x, 0.75, z + dz * 1.25, 0.4, 0.6, 0.05); }
  };
  K.update = (t) => { K.steam.offset.y = -t * 0.22; };
  return K;
}
