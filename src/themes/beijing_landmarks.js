// Beijing landmark scenes: Qianmen Street & Zhengyangmen, Tian'anmen on Chang'an Avenue, the Forbidden City corner
// tower over its moat, the Temple of Heaven, Shichahai with the Yinding Bridge and the Drum & Bell Towers, the Bird's
// Nest & Water Cube, the CBD. (More sights in beijing_sights.js.)
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, buildingGeo, planeUV, rand, randi, pick } from '../core.js';
import { at, EDGE, farGround, textTex, waterMat } from './common.js';
import { beam } from './tokyo_kit.js';
import { treeKit } from './trees.js';
import { VERM, MARBLE, CN, CN_SIGN, tiledBox } from './beijing_kit.js';

const smooth01 = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// cylinder whose UVs tile a texture every `s` metres
function tiledCyl(r, h, seg = 48, s = 1.4, open = true, rTop = r) {
  const g = new THREE.CylinderGeometry(rTop, r, h, seg, 1, open), uv = g.attributes.uv, k = (2 * Math.PI * r) / s;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * (h / s));
  return g;
}
// round roof: concave slope from the eave ring (radius r0, slightly upturned lip) to r1 (0 = a point)
function roofCone(r0, r1, h, seg = 48, tile = 1.1) {
  const pts = [new THREE.Vector2(r0 + 0.35, 0.18)];
  for (let j = 0; j <= 6; j++) { const t = j / 6; pts.push(new THREE.Vector2(Math.max(0.02, r0 + (r1 - r0) * t), h * Math.pow(t, 1.6))); }
  const g = new THREE.LatheGeometry(pts, seg), uv = g.attributes.uv, len = Math.hypot(r0 - r1, h);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * 2 * Math.PI * r0) / tile, (uv.getY(i) * len) / tile);
  return g;
}
// box whose top square is shifted (a leaning tower); UVs tiled every `s` metres
function slantBox(x0, z0, x1, z1, hw, hd, H, s = 16) {
  const B = [[x0 - hw, z0 - hd], [x0 + hw, z0 - hd], [x0 + hw, z0 + hd], [x0 - hw, z0 + hd]];
  const T = [[x1 - hw, z1 - hd], [x1 + hw, z1 - hd], [x1 + hw, z1 + hd], [x1 - hw, z1 + hd]];
  const pos = [], uv = [];
  for (let k = 0; k < 4; k++) {
    const a0 = B[k], b0 = B[(k + 1) % 4], a1 = T[k], b1 = T[(k + 1) % 4], w = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]);
    const P = [[a0, 0, 0, 0], [b1, H, w, H], [b0, 0, w, 0], [a0, 0, 0, 0], [a1, H, 0, H], [b1, H, w, H]];
    for (const [p, y, u, v] of P) { pos.push(p[0], y, p[1]); uv.push(u / s, v / s); }
  }
  for (const k of [0, 2, 1, 0, 3, 2]) { pos.push(T[k][0], H, T[k][1]); uv.push(0, 0); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// ---------- textures ----------
function studDoorTex() {   // palace doors with nine rows of nine gilded studs (门钉)
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8a1a14'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a0806'; g.fillRect(w / 2 - 2, 0, 4, h);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) for (const ox of [0, w / 2]) {
      const x = ox + 16 + c * 12.2, y = 20 + r * 25;
      const gr = g.createRadialGradient(x - 1.5, y - 1.5, 0.5, x, y, 5);
      gr.addColorStop(0, '#fff2b0'); gr.addColorStop(1, '#b8860e');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, 4.6, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = '#e8c547'; g.lineWidth = 3;
    for (const x of [w / 2 - 18, w / 2 + 18]) { g.beginPath(); g.arc(x, h * 0.55, 9, 0, Math.PI * 2); g.stroke(); }
  }, { repeat: false });
}
function streakTex() {   // light reflected on water: a rippled streak fading toward the viewer
  return canvasTex(32, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
      const a = Math.pow(1 - y / h, 1.5) * rand(0.4, 1), ww = w * rand(0.3, 1) * (1 - (y / h) * 0.5);
      g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; g.fillRect((w - ww) / 2, y, ww, 2);
    }
  }, { repeat: false });
}
function bubbleTex() {   // the Water Cube's ETFE cushions
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#0a3a7a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = rand(0, w), y = rand(0, h), r = rand(8, 26);
      for (const [ox, oy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) {
        const gr = g.createRadialGradient(x + ox, y + oy, r * 0.2, x + ox, y + oy, r);
        gr.addColorStop(0, 'rgba(120,200,255,0.25)'); gr.addColorStop(0.85, 'rgba(160,220,255,0.55)'); gr.addColorStop(1, 'rgba(230,248,255,0.9)');
        g.fillStyle = gr; g.beginPath(); g.arc(x + ox, y + oy, r, 0, Math.PI * 2); g.fill();
      }
    }
  });
}
function diagridTex() {   // dark glass behind an irregular diagonal grid (the CCTV tower's skin)
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#1a2230'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) if (Math.random() < 0.35) {
      g.fillStyle = pick(['#e6f0ff', '#ffe6c0', '#cfe0ff']); g.globalAlpha = rand(0.3, 0.8); g.fillRect(x + 1, y + 2, 6, 4);
    }
    g.globalAlpha = 1; g.strokeStyle = '#8a92a0'; g.lineWidth = 2.5;
    for (let i = 0; i < 26; i++) { const x = rand(-w / 2, w), y = rand(0, h); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(40, 120), y + rand(-120, 120)); g.stroke(); }
    g.strokeStyle = '#6a7280'; g.lineWidth = 3;
    for (let k = 0; k <= w; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, h); g.stroke(); }
  });
}

export function bjLandmarks(K) {
  const T = treeKit();
  const streak = streakTex();
  const refl = (col, k) => basic({ map: streak, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hdr(col, k) });
  const reflWarm = refl('#ffb45a', 0.9), reflRed = refl('#ff3a2a', 0.45), reflNeon = ['#ff3df0', '#3dfff0', '#ffd23d', '#ff6a3d'].map((c) => refl(c, 0.6));
  // reflection streak lying on the water from (x0, z) toward the viewer at x1
  const reflect = (b, mat, x0, x1, z, w, y) => b.add(G.plane, mat, (x0 + x1) / 2, y, z, w, Math.abs(x0 - x1), 1, -Math.PI / 2, x0 > x1 ? -Math.PI / 2 : Math.PI / 2, 0);
  const moat = waterMat('#141a30', 6), lake = waterMat('#121a34', 8);
  const sdTex = studDoorTex();
  const studDoor = std({ map: sdTex, roughness: 0.6, emissive: '#ffffff', emissiveMap: sdTex, emissiveIntensity: 0.25 });
  const goldRim = std({ color: '#e8b84a', metalness: 0.6, roughness: 0.3, emissive: '#7a5a10', emissiveIntensity: 0.5 });

  // ---------- 前门大街 · 正阳门 ----------
  const tramSign = basic({ map: textTex('前门', { w: 256, h: 96, color: '#ffd77a', bg: '#2a1a12', font: CN_SIGN, weight: 400, size: 0.62 }), color: hdr('#ffffff', 1.1) });
  const wuPailou = (b, z) => {   // the five-bay archway; the central beam clears jetpack height
    for (const [x, h] of [[-10.2, 8.6], [-7.8, 10.6], [-4.8, 13.4], [4.8, 13.4], [7.8, 10.6], [10.2, 8.6]]) {
      b.block(VC.solid, '#8a8680', x, 0, z, 1.1, 1.2, 1.1);
      b.cyl(VC.solid, VERM, x, h / 2, z, 0.3, h, 'cyl8');
    }
    const plate = K.nameplate('正阳桥');
    b.add(G.box, K.paintMat, 0, 11.4, z, 10.2, 0.7, 0.6);
    b.add(G.box, K.paintMat, 0, 12.9, z, 10.2, 0.5, 0.55);
    b.add(G.plane, plate, 0, 12.15, z + 0.32, 3.4, 1.06, 1);
    b.add(G.plane, plate, 0, 12.15, z - 0.32, 3.4, 1.06, 1, 0, Math.PI, 0);
    b.add(G.box, K.paintMat, 0, 13.4, z, 9.8, 0.5, 1.1);
    K.roof(b, K.greenTile, 0, 13.65, z, 10.2, 1.5, 1.5, { eave: 0.9, lift: 0.65 });
    for (const sx of [-1, 1]) for (const [cx, w, y] of [[6.3, 3.0, 8.9], [9.0, 2.4, 6.9]]) {
      b.add(G.box, K.paintMat, sx * cx, y, z, w, 0.55, 0.5);
      b.add(G.box, K.paintMat, sx * cx, y + 0.95, z, w, 0.45, 0.9);
      K.roof(b, K.greenTile, sx * cx, y + 1.2, z, w, 1.2, 1.1, { eave: 0.7, lift: 0.65 });
    }
  };
  const jianlou = (b, x, z) => {   // Zhengyangmen arrow tower: brick fortress, rows of arrow windows, double eaves
    const L = 32, Dp = 15, warm = '#ffe2c0';
    K.brick(b, x, 0, z, Dp, 12, L + 2, warm);
    b.box(VC.solid, '#151214', x - Dp / 2 - 0.02, 4.2, z, 0.1, 8.4, 6.2);
    b.cyl(VC.solid, '#151214', x - Dp / 2 - 0.02, 8.4, z, 3.1, 0.1, 'cyl', 0, Math.PI / 2);
    K.brick(b, x, 12, z, Dp - 2, 13, L, warm);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
      const wz = z - L / 2 + 2 + (c * (L - 4)) / 11, wy = 14.2 + r * 2.9, fx = x - (Dp - 2) / 2;
      b.box(VC.solid, '#e8e4dc', fx - 0.03, wy, wz, 0.06, 1.25, 1.05);
      b.box(VC.solid, '#1a1414', fx - 0.07, wy, wz, 0.06, 0.85, 0.65);
    }
    b.add(G.box, K.paintMat, x, 25.3, z, Dp - 1.6, 0.6, L + 0.4);
    K.roof(b, K.tileGrey, x, 25.6, z, L + 1, Dp - 1, 2.0, { ry: Math.PI / 2, eave: 1.4, lift: 0.5 });
    K.red(b, x, 27.4, z, Dp - 5, 2.6, L - 5);
    b.add(G.box, K.paintMat, x, 29.7, z, Dp - 4.6, 0.6, L - 4.6);
    K.roof(b, K.tileGrey, x, 30.0, z, L - 4, Dp - 4, 5.2, { ry: Math.PI / 2, eave: 1.6, lift: 0.55 });
    for (let k = -2; k <= 2; k++) b.box(VC.glow, hdr('#ffd28a', 2), x - Dp / 2 - 1.2, 0.2, z + k * 6, 0.6, 0.3, 0.6);
  };
  const tram = (b, x, z) => {   // Qianmen "dangdang" tram
    for (const dx of [-0.72, 0.72]) b.box(VC.metal, '#2a2a2e', x + dx, 0.03, -40, 0.12, 0.06, 80);
    b.box(VC.solid, '#151515', x, 5.6, -40, 0.03, 0.03, 80);
    b.block(VC.solid, '#7a1b1b', x, 0.45, z, 2.3, 1.25, 10.5);
    b.block(VC.solid, '#efe6cf', x, 1.7, z, 2.32, 1.45, 10.5);
    for (let k = 0; k < 7; k++) for (const sx of [-1, 1]) b.box(VC.glow, hdr('#ffe2a8', 1.0), x + sx * 1.17, 2.25, z - 4.3 + k * 1.43, 0.03, 0.8, 1.05);
    b.block(VC.solid, '#3a3a3e', x, 3.15, z, 2.1, 0.22, 10.2);
    b.box(VC.solid, '#7a1b1b', x, 3.5, z, 1.6, 0.3, 9.6);
    beam(b, VC.metal, x, 3.6, z + 2, x, 5.55, z - 1.5, 0.05, '#2a2a2e');
    for (const s of [1, -1]) {
      const fz = z + s * 5.26;
      b.box(VC.glow, hdr('#fff4d6', 2.6), x, 1.0, fz, 0.4, 0.3, 0.05);
      b.add(G.plane, tramSign, x, 2.85, fz + s * 0.02, 1.3, 0.48, 1, 0, s > 0 ? 0 : Math.PI, 0);
    }
  };
  const qianmen = () => {
    const b = new Batcher();
    for (const side of [-1, 1]) { farGround(b, side, '#1a1a20'); b.box(VC.solid, '#3a3836', side * 7.1, 0.035, -40, 6.6, 0.03, 80); }
    K.shops(b, -1, 0, 80);
    K.shops(b, 1, 0, 44);
    wuPailou(b, -14);
    b.box(VC.solid, '#4a4642', 21, 0.04, -62, 22, 0.04, 34);
    jianlou(b, 30, -62);
    tram(b, -6.6, -34);
    for (const side of [-1, 1]) for (let z = 6; z < 80; z += 16) K.gongdeng(b, side * (EDGE + 1.2), -z, side);
    K.lanternRun(b, 7.6, 6.2, 0, 44);
    K.lanternRun(b, -8.6, 6.2, 0, 80);
    K.crowd(b, 5, 9.4, 2, 78, 26); K.crowd(b, -4.8, -5.4, 2, 26, 6); K.crowd(b, -8, -9.6, 2, 78, 14);
    K.tanghulu(b, 8.4, -24); K.tanghulu(b, -9.0, -60);
    for (let k = 0; k < 3; k++) K.rickshaw(b, 13.5 + k * 2.2, -52);
    K.crowd(b, 12, 20, 56, 76, 10);
    return b.build();
  };

  // ---------- 天安门 · 长安街 ----------
  const huabiao = (b, x, z) => {   // carved marble column with its cloud board and a crouching beast
    b.block(VC.solid, MARBLE, x, 0, z, 2.6, 1.0, 2.6);
    b.cyl(VC.solid, '#efece4', x, 5.5, z, 0.5, 9.0, 'cyl8');
    b.add(G.box, VC.solid, x, 8.3, z, 0.32, 0.55, 2.6, 0.15, 0, 0, '#efece4');
    b.cyl(VC.solid, '#efece4', x, 10.1, z, 0.95, 0.3);
    b.add(G.sph, VC.solid, x, 10.6, z, 0.8, 0.8, 0.7, 0, 0, 0, '#e2ded4');
    b.sph(VC.solid, '#e2ded4', x - 0.3, 11.05, z, 0.32, true);
    b.box(VC.glow, hdr('#ffd9a8', 1.6), x - 1.7, 0.2, z, 0.5, 0.3, 0.5);
  };
  const monument = (b, x, z) => {   // Monument to the People's Heroes on its two marble terraces
    K.marble(b, x, 0, z, 22, 1.0, 30);
    K.marble(b, x, 1.0, z, 14, 1.2, 20);
    for (const dz of [-15, 15]) K.balustrade(b, x - 11, z + dz, x + 11, z + dz, 1.0, 1.8);
    for (const dx of [-11, 11]) K.balustrade(b, x + dx, z - 15, x + dx, z + 15, 1.0, 1.8);
    K.marble(b, x, 2.2, z, 5, 4, 7);
    b.block(VC.solid, '#e8e2d6', x, 6.2, z, 2.4, 25, 3.4);
    K.roof(b, K.marbleMat, x, 31.2, z, 3.6, 2.6, 1.4, { ry: Math.PI / 2, eave: 0.4, lift: 0.4, ridge: '#d8d2c6' });
    for (const dx of [-3, 3]) b.box(VC.glow, hdr('#ffe6c0', 2.0), x + dx, 2.4, z, 0.5, 0.3, 0.5);
  };
  const tiananmen = () => {
    const b = new Batcher();
    farGround(b, -1, '#2e2c2a'); farGround(b, 1, '#24221f');
    b.box(VC.solid, '#4a4844', -50, 0.03, -40, 80, 0.03, 80);
    for (const x of [-14, -30, -46]) for (let z = 6; z < 80; z += 18) K.huadeng(b, x, -z, 0.95);
    monument(b, -68, -40);
    for (let z = 6; z < 80; z += 16) K.huadeng(b, EDGE + 2.4, -z);
    // Golden Water River with five marble bridges, the huabiao and the stone lions
    b.box(VC.solid, '#1a1c24', 21.5, -1.6, -40, 6.4, 0.2, 64);
    b.add(G.plane, moat, 21.5, -0.9, -40, 6, 64, 1, -Math.PI / 2, 0, 0);
    K.marble(b, 18.1, -1.7, -40, 0.6, 2.0, 64); K.marble(b, 24.9, -1.7, -40, 0.6, 2.0, 64);
    for (const [bz, bw] of [[-24, 3], [-32, 3.4], [-40, 4.6], [-48, 3.4], [-56, 3]]) {
      b.box(VC.solid, MARBLE, 21.5, 0.25, bz, 7.8, 0.5, bw);
      b.box(VC.solid, MARBLE, 21.5, 0.55, bz, 4.0, 0.3, bw);
      K.balustrade(b, 17.8, bz - bw / 2, 25.2, bz - bw / 2, 0.5);
      K.balustrade(b, 17.8, bz + bw / 2, 25.2, bz + bw / 2, 0.5);
    }
    huabiao(b, 14.5, -20); huabiao(b, 14.5, -60);
    K.lion(b, 15.8, -35.5, -Math.PI / 2); K.lion(b, 15.8, -44.5, -Math.PI / 2);
    // the gate: red platform on a marble plinth with five gateways, the rostrum parapet, the double-eaved tower
    K.marble(b, 36, 0, -40, 17, 0.9, 54);
    K.red(b, 36, 0.9, -40, 16, 11.4, 52);
    for (const [dz, w, h] of [[0, 4.4, 7.4], [-8, 3.6, 6.4], [8, 3.6, 6.4], [-16, 3.0, 5.4], [16, 3.0, 5.4]]) {
      b.box(VC.solid, '#3a0a08', 27.97, 0.9 + h / 2 + 0.2, -40 + dz, 0.04, h + 0.4, w + 0.4);
      b.add(G.plane, studDoor, 27.93, 0.9 + h / 2, -40 + dz, w, h, 1, 0, -Math.PI / 2, 0);
    }
    K.balustrade(b, 28.4, -14.5, 28.4, -65.5, 12.3, 1.6);
    K.hall(b, 36.5, -40, { w: 44, d: 12, h: 7.2, base: 0.7, y: 12.3, roof: K.goldTile, double: true, ry: Math.PI / 2, roofH: 6.2 });
    for (let k = 0; k < 8; k++) K.lantern(b, 29.4, 17.6, -40 + (k - 3.5) * 5.6, 1.9);
    for (let k = -4; k <= 4; k++) b.box(VC.glow, hdr('#ffd28a', 2.2), 27.0, 0.15, -40 + k * 6, 0.5, 0.3, 0.5);
    K.crowd(b, 6, 13, 4, 76, 18); K.crowd(b, -6, -40, 4, 76, 30);
    return b.build();
  };

  // ---------- 故宫角楼 · 筒子河 ----------
  const cornerTower = (b, x, y, z) => {   // cross-shaped plan, four wings, three tiers of yellow roofs, cross ridge
    K.marble(b, x, y, z, 17, 0.8, 17);
    for (const [ax, az, bx, bz] of [[-8.3, -8.3, 8.3, -8.3], [-8.3, 8.3, 8.3, 8.3], [-8.3, -8.3, -8.3, 8.3], [8.3, -8.3, 8.3, 8.3]]) K.balustrade(b, x + ax, z + az, x + bx, z + bz, y + 0.8);
    const y1 = y + 0.8;
    b.box(VC.solid, '#8a2a22', x, y1 + 3.2, z, 8.4, 6.4, 8.4);
    b.add(G.box, K.latticeMat, x, y1 + 2.8, z, 8.5, 4.4, 8.5);
    for (const [dx, dz, ry] of [[1, 0, Math.PI / 2], [-1, 0, Math.PI / 2], [0, 1, 0], [0, -1, 0]]) {
      const wx = x + dx * 5.6, wz = z + dz * 5.6;
      b.add(G.box, VC.solid, wx, y1 + 2.3, wz, 6, 4.6, 3, 0, ry, 0, '#8a2a22');
      b.add(G.box, K.latticeMat, wx, y1 + 2.1, wz, 6.1, 3.4, 3.1, 0, ry, 0);
      b.add(G.box, K.paintMat, wx, y1 + 4.4, wz, 6.3, 0.5, 3.3, 0, ry, 0);
      K.roof(b, K.goldTile, wx + dx * 0.4, y1 + 4.6, wz + dz * 0.4, 6.4, 4.2, 1.9, { ry, eave: 0.9, lift: 0.7, ridge: '#a87a12' });
    }
    K.roof(b, K.goldTile, x, y1 + 6.4, z, 10.5, 10.5, 1.6, { eave: 1.1, lift: 0.7, ridge: '#a87a12' });
    b.box(VC.solid, '#8a2a22', x, y1 + 8.8, z, 6.6, 2.6, 6.6);
    b.add(G.box, K.latticeMat, x, y1 + 8.7, z, 6.7, 1.8, 6.7);
    b.add(G.box, K.paintMat, x, y1 + 10.0, z, 7.0, 0.5, 7.0);
    K.roof(b, K.goldTile, x, y1 + 10.2, z, 9.4, 6.0, 3.4, { eave: 1.0, lift: 0.75, ridge: '#a87a12' });
    K.roof(b, K.goldTile, x, y1 + 10.2, z, 9.4, 6.0, 3.4, { eave: 1.0, lift: 0.75, ry: Math.PI / 2, ridge: '#a87a12' });
    b.sph(VC.metal, '#e8b84a', x, y1 + 14.0, z, 0.55);
    b.cyl(VC.metal, '#e8b84a', x, y1 + 14.8, z, 0.12, 1.2);
    for (const [dx, dz] of [[-9, -9], [-9, 9], [9, -9], [9, 9]]) b.box(VC.glow, hdr('#ffd28a', 2.4), x + dx, y + 0.2, z + dz, 0.6, 0.3, 0.6);
  };
  const pavilion = (b, x, y, z) => {   // Wanchun pavilion on Jingshan, three eaves
    b.block(VC.solid, '#8a2a22', x, y, z, 5, 3, 5);
    b.add(G.box, K.latticeMat, x, y + 1.4, z, 5.1, 2.0, 5.1);
    K.roof(b, K.goldTile, x, y + 3, z, 7, 7, 1.2, { eave: 1.0, lift: 0.7 });
    b.block(VC.solid, '#8a2a22', x, y + 4.0, z, 3.6, 1.4, 3.6);
    K.roof(b, K.goldTile, x, y + 5.4, z, 5, 5, 1.1, { eave: 0.9, lift: 0.7 });
    K.roof(b, K.goldTile, x, y + 6.5, z, 2.6, 2.6, 2.2, { eave: 0.7, lift: 0.7 });
    b.sph(VC.metal, '#e8b84a', x, y + 9.0, z, 0.35);
    b.box(VC.glow, hdr('#ffd28a', 2.0), x + 4, y + 0.2, z, 0.5, 0.3, 0.5);
  };
  const jiaolou = () => {
    const b = new Batcher();
    farGround(b, -1, '#18181e');
    // near bank: paving, weeping willows leaning over the water, a stone parapet
    b.box(VC.solid, '#3a3c42', 7.0, 0.03, -40, 6.5, 0.03, 80);
    for (let z = 4; z < 80; z += 8.5) T.willow(b, 8.3, -z, rand(0.95, 1.15), { ry: Math.PI + rand(-0.4, 0.4) });
    b.box(VC.solid, '#8a8780', 10.2, 0.5, -40, 0.3, 1.0, 80);
    // the moat between stone embankments
    b.box(VC.solid, '#121420', 21.5, -2.0, -40, 23, 0.2, 80);
    b.add(G.plane, moat, 21.5, -0.9, -40, 22.6, 80, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#5a5856', 10.6, -0.9, -40, 0.8, 2.2, 80);
    b.box(VC.solid, '#5a5856', 32.6, -0.9, -40, 0.8, 2.2, 80);
    // the palace wall along the far bank, turning away at the corner, crenellated and tiled
    const wallH = 9.5;
    K.red(b, 37, 0, -30, 8, wallH, 60);
    K.red(b, 65.5, 0, -56, 49, wallH, 8);
    for (let z = 0.8; z < 52; z += 1.6) b.box(VC.solid, '#8a2a22', 33.3, wallH + 0.5, -z, 0.5, 1.0, 0.9);
    K.roof(b, K.goldTile, 40.6, wallH, -26, 52, 0.9, 0.45, { hip: false, ry: Math.PI / 2, eave: 0.25, ridge: '#a87a12' });
    cornerTower(b, 37, wallH, -56);
    // its light on the water and the red wall mirrored in the moat
    reflect(b, reflWarm, 32, 12, -56, 6, -0.86);
    reflect(b, reflRed, 32, 20, -26, 50, -0.87);
    // the other side: red wall with golden ginkgo, palace lamps, Jingshan hill behind
    K.redWall(b, -1, 0, 80, { halls: false });
    for (let z = 4; z < 80; z += 9) K.ginkgo(b, -(EDGE + 3.2), -z, rand(0.95, 1.1));
    for (let z = 8; z < 80; z += 16) K.gongdeng(b, -(EDGE + 1.2), -z, -1);
    b.add(G.sph, VC.solid, -62, -4, -60, 64, 30, 50, 0, 0, 0, '#16261e');
    pavilion(b, -62, 10.4, -60);
    K.crowd(b, 4.6, 9, 2, 78, 12); K.crowd(b, -4.6, -6.5, 2, 78, 8);
    return b.build();
  };

  // ---------- 天坛 · 祈年殿 ----------
  const ringRail = (b, x, z, r, y, gap = 0.18) => {   // marble balustrade round a terrace, open toward +x (the stairs)
    const n = Math.round((2 * Math.PI * r) / 1.6);
    let prev = null;
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < gap) { prev = null; continue; }
      const p = [x + Math.cos(a) * r, z + Math.sin(a) * r];
      b.box(VC.solid, MARBLE, p[0], y + 0.55, p[1], 0.18, 1.1, 0.18);
      if (prev) beam(b, VC.solid, prev[0], y + 1.0, prev[1], p[0], y + 1.0, p[1], 0.12, MARBLE, 0.16);
      prev = p;
    }
  };
  const qinian = (b, x, z) => {   // Hall of Prayer for Good Harvests on its three-tier marble terrace
    for (const [r, y] of [[21, 0], [17, 1.5], [13.5, 3.0]]) {
      b.addM(tiledCyl(r, 1.5, 56, 2, false), K.marbleMat, at(x, y + 0.75, z), 0xffffff);
      ringRail(b, x, z, r - 0.5, y + 1.5);
    }
    for (let k = 0; k < 9; k++) b.block(VC.solid, '#d8d4ca', x + 22.4 - k * 1.0, 0, z, 1.0, 0.5 * (k + 1), 5);
    const y0 = 4.5;
    b.addM(tiledCyl(12, 0.6, 48, 2, false), K.marbleMat, at(x, y0 + 0.3, z), 0xffffff);
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; b.cyl(VC.solid, VERM, x + Math.cos(a) * 11.2, y0 + 3.6, z + Math.sin(a) * 11.2, 0.3, 6, 'cyl8'); }
    b.addM(tiledCyl(10.2, 6, 48, 1.2), K.latticeMat, at(x, y0 + 3.6, z), 0xffffff);
    b.addM(tiledCyl(11.6, 0.8, 48, 2.4), K.paintMat, at(x, y0 + 7.0, z), 0xffffff);
    // three blue roofs over two clerestory drums, gold rims, gilded finial
    const tiers = [[y0 + 7.4, 13.6, 9.4, 2.4], [y0 + 12.0, 10.8, 6.8, 2.2], [y0 + 16.2, 8.2, 0, 5.6]];
    tiers.forEach(([y, r0, r1, h], i) => {
      b.addM(roofCone(r0, r1, h), K.blueTile, at(x, y, z), 0xffffff);
      b.addM(tiledCyl(r0 + 0.3, 0.22, 48, 2), goldRim, at(x, y + 0.15, z), 0xffffff);
      if (i < 2) {
        const dr = r1 - 0.2, dh = (tiers[i + 1][0] - (y + h));
        b.addM(tiledCyl(dr, dh, 48, 1.2), K.latticeMat, at(x, y + h + dh / 2, z), 0xffffff);
        b.addM(tiledCyl(dr + 0.2, 0.6, 48, 2.4), K.paintMat, at(x, y + h + dh - 0.3, z), 0xffffff);
      }
    });
    b.sph(goldRim, 0xffffff, x, y0 + 22.4, z, 0.9);
    b.cyl(goldRim, 0xffffff, x, y0 + 23.6, z, 0.18, 1.6);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.box(VC.glow, hdr('#ffd28a', 2.2), x + Math.cos(a) * 22.5, 0.2, z + Math.sin(a) * 22.5, 0.6, 0.3, 0.6); }
  };
  const huangqiongyu = (b, x, z) => {   // Imperial Vault of Heaven inside the round Echo Wall
    b.addM(tiledCyl(18, 3.7, 64, 1.6), K.brickMat, at(x, 1.85, z), '#d0ccd8');
    const ridge = new THREE.LatheGeometry([new THREE.Vector2(18.7, 0), new THREE.Vector2(18.0, 0.6), new THREE.Vector2(17.3, 0)], 64);
    b.addM(ridge, K.blueTile, at(x, 3.7, z), 0xffffff);
    b.addM(tiledCyl(7.5, 1.2, 40, 2, false), K.marbleMat, at(x, 0.6, z), 0xffffff);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.cyl(VC.solid, VERM, x + Math.cos(a) * 6.2, 3.2, z + Math.sin(a) * 6.2, 0.25, 4, 'cyl8'); }
    b.addM(tiledCyl(5.6, 4, 40, 1.2), K.latticeMat, at(x, 3.2, z), 0xffffff);
    b.addM(tiledCyl(6.6, 0.6, 40, 2.4), K.paintMat, at(x, 5.0, z), 0xffffff);
    b.addM(roofCone(7.4, 0, 4.6), K.blueTile, at(x, 5.3, z), 0xffffff);
    b.addM(tiledCyl(7.7, 0.2, 40, 2), goldRim, at(x, 5.45, z), 0xffffff);
    b.sph(goldRim, 0xffffff, x, 10.2, z, 0.55);
  };
  const dancers = (b, x, z) => {   // the aunties' square dance (广场舞) with fans, and their speaker
    b.block(VC.solid, '#2a2a2e', x + 2.8, 0, z + 3, 0.6, 0.9, 0.5);
    b.box(VC.glow, hdr('#3dfff0', 1.4), x + 2.8, 0.55, z + 3.26, 0.4, 0.4, 0.02);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const px = x - c * 1.3, pz = z - r * 1.4;
      K.person(b, px, pz, { coat: pick(['#c8282e', '#d84a8a', '#e8b84a', '#3a8adf', '#e86a2a']) });
      b.add(G.cyl, VC.solid, px + 0.35, 1.6, pz, 0.55, 0.03, 0.55, Math.PI / 2, 0, (r + c) % 2 ? 0.4 : -0.4, pick(['#ff3a5a', '#ffd23d', '#ff6aa0']));
    }
  };
  const tiantan = () => {
    const b = new Batcher();
    farGround(b, -1, '#181c1a'); farGround(b, 1, '#181c1a');
    qinian(b, -40, -48);
    b.block(VC.solid, '#6a6862', -40, 0, -12, 10, 1.6, 22);
    for (const dx of [-5, 5]) K.balustrade(b, -40 + dx, -1, -40 + dx, -23, 1.6, 1.8);
    huangqiongyu(b, 38, -40);
    for (const [x0, x1] of [[-12, -16], [12, 17], [58, 80], [-66, -84]]) for (let k = 0; k < 4; k++) K.cypress(b, rand(x0, x1), -rand(4, 76), rand(0.9, 1.2));
    dancers(b, -13, -8);
    for (const side of [-1, 1]) for (let z = 6; z < 80; z += 16) K.gongdeng(b, side * (EDGE + 1.2), -z, side);
    K.crowd(b, 5, 10, 2, 78, 12); K.crowd(b, -5, -10, 20, 78, 10);
    return b.build();
  };

  // ---------- 什刹海 · 鼓楼 ----------
  const boat = (b, x, z, ry) => {
    const s = Math.sin(ry), c = Math.cos(ry);
    b.add(G.sph, VC.solid, x, -0.75, z, 1.8, 0.7, 5, 0, ry, 0, '#3a2418');
    b.add(G.box, VC.glow, x, 0.25, z, 1.3, 0.6, 2.2, 0, ry, 0, hdr('#ffcf8a', 0.8));
    for (const o of [-1.1, 1.1]) b.add(G.box, VC.solid, x + s * o, 0.5, z + c * o, 0.08, 0.7, 0.08, 0, ry, 0, '#5a3a24');
    b.add(G.box, VC.solid, x, 0.9, z, 1.6, 0.08, 2.8, 0, ry, 0, '#c93a2a');
    for (const o of [-1.9, 1.9]) K.lantern(b, x + s * o, 0.7, z + c * o, 0.45);
  };
  const drumTower = (b, x, z) => {   // Drum Tower: red platform with three arches, double-eaved hall, the great drum
    K.red(b, x, 0, z, 18, 12, 30);
    for (const dz of [-8, 0, 8]) {
      b.box(VC.solid, '#140c0a', x + 9.02, 3.4, z + dz, 0.06, 6.8, 4);
      b.cyl(VC.solid, '#140c0a', x + 9.02, 6.8, z + dz, 2.0, 0.06, 'cyl', 0, Math.PI / 2);
    }
    for (let dz = -14.5; dz <= 14.5; dz += 1.6) b.box(VC.solid, '#5a4a44', x + 8.8, 12.4, z + dz, 0.4, 0.8, 0.8);
    K.hall(b, x, z, { w: 26, d: 14, h: 6.6, base: 0.6, y: 12, roof: K.tileGrey, double: true, ry: Math.PI / 2, baseMat: null });
    b.cyl(VC.solid, '#a8201a', x + 6.0, 16.0, z, 1.6, 1.4, 'cyl', 0, Math.PI / 2);
    b.cyl(VC.solid, '#e8b84a', x + 6.75, 16.0, z, 1.62, 0.12, 'cyl', 0, Math.PI / 2);
    for (const dz of [-12, -4, 4, 12]) b.box(VC.glow, hdr('#ffd28a', 2.2), x + 10.5, 0.2, z + dz, 0.6, 0.3, 0.6);
  };
  const bellTower = (b, x, z) => {   // Bell Tower of grey stone with arched windows
    K.brick(b, x, 0, z, 16, 10, 16, '#e0d6c8');
    b.box(VC.solid, '#140c0a', x + 8.02, 3.2, z, 0.06, 6.4, 3.6);
    K.brick(b, x, 10, z, 11, 8, 11, '#e0d6c8');
    for (const dz of [-2.8, 0, 2.8]) b.box(VC.glow, hdr('#ffcf8a', 0.9), x + 5.52, 14, z + dz, 0.05, 2.6, 1.2);
    b.add(G.box, K.paintMat, x, 17.7, z, 11.4, 0.5, 11.4);
    K.roof(b, K.greenTile, x, 18, z, 12, 12, 1.6, { eave: 1.3, lift: 0.6 });
    K.brick(b, x, 19.6, z, 8, 2, 8, '#e0d6c8');
    K.roof(b, K.greenTile, x, 21.6, z, 8.6, 8.6, 3.6, { eave: 1.2, lift: 0.6 });
    for (const dz of [-5, 5]) b.box(VC.glow, hdr('#ffd28a', 2.0), x + 9, 0.2, z + dz, 0.6, 0.3, 0.6);
  };
  // 银锭桥: the little humped marble bridge of one arch over the neck between Qianhai and Houhai, from x0 to x1 at z
  const yinding = (b, x0, x1, z, yw) => {
    const L = x1 - x0, W = 5, R = 2.2, cx = (x0 + x1) / 2;
    const deck = (x) => { const u = ((x - x0) / L) * 2 - 1; return 0.6 + 2.6 * (1 - u * u); };
    const sh = new THREE.Shape(), bottom = -1.0, h = new THREE.Path();
    sh.moveTo(0, bottom); sh.lineTo(L, bottom);
    for (let i = 24; i >= 0; i--) sh.lineTo((L * i) / 24, deck(x0 + (L * i) / 24));
    h.moveTo(L / 2 - R, bottom + 0.3); h.lineTo(L / 2 + R, bottom + 0.3); h.lineTo(L / 2 + R, 0.2); h.absarc(L / 2, 0.2, R, 0, Math.PI, false); h.lineTo(L / 2 - R, bottom + 0.3);
    sh.holes.push(h);
    const g = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false, curveSegments: 12 }), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2);
    b.addM(g, K.marbleMat, at(x0, yw, z - W / 2), 0xffffff);
    b.add(new THREE.TorusGeometry(R, 0.06, 3, 16, Math.PI), VC.glow, cx, yw + 0.2, z + W / 2 + 0.03, 1, 1, 1, 0, 0, 0, hdr('#ffc26a', 1.6));
    for (const s of [-1, 1]) b.box(VC.glow, hdr('#ffc26a', 1.6), cx + s * R, yw + 0.1, z + W / 2 + 0.03, 0.12, 0.2, 0.05);
    b.add(G.plane, reflWarm, cx, -0.77, z + W / 2 + 6, 3.4, 12, 1, -Math.PI / 2, 0, 0);
    for (const zz of [z + W / 2 - 0.15, z - W / 2 + 0.15]) {   // humped balustrades
      let prev = null;
      for (let i = 0; i <= 12; i++) {
        const x = x0 + (L * i) / 12, y = yw + deck(x);
        b.box(VC.solid, MARBLE, x, y + 0.45, zz, 0.2, 0.9, 0.2);
        b.sph(VC.solid, MARBLE, x, y + 0.95, zz, 0.12, true);
        if (prev) beam(b, VC.solid, prev[0], prev[1] + 0.75, zz, x, y + 0.75, zz, 0.12, MARBLE, 0.16);
        prev = [x, y];
      }
    }
    for (const x of [x0 + 0.4, x1 - 0.4]) for (const zz of [z + W / 2 + 0.3, z - W / 2 - 0.3]) {   // lamp posts at its ends
      b.cyl(VC.metal, '#2a2a2e', x, 1.6, zz, 0.07, 3.2, 'cyl8');
      K.lantern(b, x, 3.4, zz, 0.55);
    }
    b.box(VC.solid, '#8a8680', x0 - 1.4, 0.3, z + W / 2 + 1.6, 0.6, 0.6, 1.8);
    b.add(G.box, yindingMat, x0 - 1.4, 1.15, z + W / 2 + 1.6, 0.22, 1.1, 2.0);
  };
  const yindingMat = (() => { const t = textTex('银锭桥', { w: 512, h: 256, color: '#a81c1c', bg: '#c8c2b6', font: CN, weight: 400, size: 0.6 }); return std({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.45, roughness: 0.9 }); })();
  const shichahai = () => {
    const b = new Batcher();
    farGround(b, -1, '#18181e');
    // the Lotus Market archway over the way in; the lakeside promenade: willows, lantern strings, railing
    K.pailou(b, -3, { text: '荷花市场', roof: K.greenTile });
    b.box(VC.solid, '#3a3a40', 7, 0.03, -40, 6.5, 0.03, 80);
    for (const z of [12, 21]) T.willow(b, 8.6, -z, rand(0.95, 1.15), { ry: Math.PI + rand(-0.4, 0.4) });
    K.lanternRun(b, 10.0, 3.4, 0, 80);
    b.box(VC.solid, '#7a7670', 10.6, 0.45, -31, 0.25, 0.9, 62);
    b.box(VC.solid, '#7a7670', 10.6, 0.45, -78, 0.25, 0.9, 4);
    // Qianhai with its boats; it narrows to the neck under the Yinding Bridge, bars along the far and the north shores
    // throw their lights across the water
    b.box(VC.solid, '#0e1020', 46, -1.8, -29, 72, 0.2, 58);
    b.add(G.plane, lake, 46, -0.8, -29, 71, 58, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#0e1020', 17.3, -1.8, -69, 13.6, 0.2, 22);
    b.add(G.plane, lake, 17.3, -0.8, -69, 13.6, 22, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#4a4844', 11.0, -0.8, -40, 0.8, 2.0, 80);
    b.box(VC.solid, '#4a4844', 53, -0.85, -58.4, 58, 1.9, 0.8);
    b.box(VC.solid, '#4a4844', 24.4, -0.85, -69.2, 0.8, 1.9, 21.6);
    b.box(VC.solid, '#202024', 53, -0.1, -69.2, 58, 0.2, 21.6);
    yinding(b, 10.6, 24.0, -68, -0.8);
    for (let k = 0; k < 5; k++) boat(b, rand(22, 56), -rand(6, 50), rand(-0.5, 0.5));
    for (let x = 27; x < 78; x += rand(7.5, 9.5)) {   // the north shore, its fronts toward the runner
      const len = rand(5.5, 7.5), xc = x + len / 2, h = rand(5, 7), zf = -59.4, i = randi(0, 11);
      K.brick(b, xc, 0, zf - 4, len - 0.3, h, 8, '#d8cfc4');
      K.roof(b, K.tileGrey, xc, h, zf - 4, len, 8, 1.6, { hip: false, eave: 0.6, gable: K.brickMat });
      b.box(VC.glow, hdr(pick(['#ffcf8a', '#ff9ad5', '#7cf8ff']), 0.8), xc, 1.8, zf + 0.03, len - 1.4, 2.6, 0.05);
      b.add(planeUV(K.neonRects[i]), K.neonMat, xc, h - 1.3, zf + 0.1, Math.min(4.2, len - 1), Math.min(4.2, len - 1) / 4, 1);
      for (const dx of [-len / 3, len / 3]) K.lantern(b, xc + dx, h - 0.3, zf + 0.5, 0.6);
      b.add(G.plane, reflNeon[i % reflNeon.length], xc, -0.76, zf + 13, 2.2, 24, 1, -Math.PI / 2, 0, 0);
    }
    for (const z of [-63, -71, -78]) {   // houses along the neck's far bank
      K.brick(b, 29, 0, z, 8, 5.2, 6.4, '#d8cfc4');
      K.roof(b, K.tileGrey, 29, 5.2, z, 6.8, 8, 1.6, { hip: false, ry: Math.PI / 2, eave: 0.5, gable: K.brickMat });
      b.box(VC.glow, hdr('#ffcf8a', 0.8), 24.97, 1.8, z, 0.05, 2.6, 4.6);
      K.lantern(b, 24.6, 4.4, z, 0.6);
    }
    for (let z = 2; z < 50; z += rand(7.5, 10)) {
      const len = rand(5.5, 7.5), zc = -(z + len / 2), h = rand(5, 7);
      K.brick(b, 84, 0, zc, 8, h, len - 0.3, '#d8cfc4');
      K.roof(b, K.tileGrey, 84, h, zc, len, 8, 1.6, { hip: false, ry: Math.PI / 2, eave: 0.6, gable: K.brickMat });
      b.box(VC.glow, hdr(pick(['#ffcf8a', '#ff9ad5', '#7cf8ff']), 0.8), 79.97, 1.8, zc, 0.05, 2.6, len - 1.4);
      const i = randi(0, 11);
      K.neon(b, 79.9, h - 1.3, zc, 1, Math.min(4.2, len - 1), i);
      for (const dz of [-len / 3, len / 3]) K.lantern(b, 79.5, h - 0.3, zc + dz, 0.6);
      reflect(b, reflNeon[i % reflNeon.length], 79, 46, zc, 2.2, -0.76);
      reflect(b, reflWarm, 79, 52, zc + len / 3, 0.9, -0.77);
    }
    // left: bar street, the Drum and Bell Towers, rickshaws waiting in the square
    K.shops(b, -1, 0, 20);
    K.shops(b, -1, 58, 80);
    for (const z of [4, 11, 17, 62, 70, 77]) K.neon(b, -10.25, 5.7, -z, -1, 3.0);
    b.box(VC.solid, '#3a3836', -18, 0.035, -40, 16, 0.03, 36);
    drumTower(b, -36, -38);
    bellTower(b, -42, -70);
    for (let k = 0; k < 5; k++) K.rickshaw(b, -12.5, -25 - k * 3.4);
    K.crowd(b, 4.6, 9.4, 2, 78, 16); K.crowd(b, -5, -24, 22, 56, 16);
    return b.build();
  };

  // ---------- 鸟巢 · 水立方 ----------
  const nestGlow = basic({ color: hdr('#ff3a24', 0.95), side: THREE.DoubleSide });
  const membrane = std({ color: '#2a2c34', roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide });
  const cubeTex = bubbleTex();
  const cubeMat = basic({ map: cubeTex, color: hdr('#7fd0ff', 1.15) });
  const nest = (b, cx, cz) => {   // Bird's Nest: woven steel lattice round a red-lit bowl, saddle-shaped rim
    const A = 28, Bz = 34, H = 24, steel = '#c3c8d0';
    const P = (th, v) => {
      const f = 1 + 0.07 * Math.sin(Math.PI * v) - 0.05 * v, lift = 2.6 * Math.cos(2 * th) * v;
      return [cx + A * f * Math.cos(th), v * H + lift, cz + Bz * f * Math.sin(th)];
    };
    const N = 34, S = 6;
    for (let k = 0; k < N; k++) for (const dir of [1, -1]) {
      const th0 = (k / N) * Math.PI * 2 + (dir < 0 ? 0.09 : 0);
      for (let j = 0; j < S; j++) {
        const v0 = j / S, v1 = (j + 1) / S;
        beam(b, VC.metal, ...P(th0 + dir * v0, v0), ...P(th0 + dir * v1, v1), 0.75, steel);
      }
    }
    const inner = (th) => [cx + A * 0.55 * Math.cos(th), H + 2.6 * Math.cos(2 * th) + 1.4, cz + Bz * 0.55 * Math.sin(th)];
    for (let k = 0; k < 40; k++) for (const dir of [1, -1]) {
      const th = (k / 40) * Math.PI * 2;
      beam(b, VC.metal, ...P(th, 1), ...inner(th + dir * 0.32), 0.65, steel);
    }
    for (let i = 0; i < 70; i++) {
      const th = rand(0, Math.PI * 2), v = rand(0, 0.85);
      beam(b, VC.metal, ...P(th, v), ...P(th + rand(-0.3, 0.3), Math.min(1, v + rand(0.12, 0.3))), 0.5, steel);
    }
    b.add(new THREE.CylinderGeometry(1, 1, 1, 48, 1, true), nestGlow, cx, H * 0.48, cz, A * 0.93, H * 0.96, Bz * 0.93);
    const ring = new THREE.RingGeometry(0.56, 0.98, 48, 1); ring.rotateX(-Math.PI / 2);
    b.add(ring, membrane, cx, H + 0.8, cz, A, 1, Bz);
    b.add(new THREE.CylinderGeometry(1, 1.04, 1, 48), VC.solid, cx, 0.9, cz, A * 1.12, 1.8, Bz * 1.12, 0, 0, 0, '#2a2c34');
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; b.box(VC.glow, hdr('#fff0d0', 2.0), cx + Math.cos(a) * A * 1.18, 0.2, cz + Math.sin(a) * Bz * 1.18, 0.7, 0.3, 0.7); }
  };
  const waterCube = (b, cx, cz) => {
    b.addM(tiledBox(46, 14, 46, 9), cubeMat, at(cx, 7.6, cz), 0xffffff);
    b.box(VC.solid, '#2a2c34', cx, 0.3, cz, 48, 0.6, 48);
    for (const [dx, dz, w, d] of [[23.05, 0, 0.12, 46], [-23.05, 0, 0.12, 46], [0, 23.05, 46, 0.12], [0, -23.05, 46, 0.12]]) b.box(VC.glow, hdr('#bfe8ff', 1.4), cx + dx, 14.6, cz + dz, w, 0.25, d);
  };
  const linglong = (b, cx, cz) => {   // Linglong broadcast tower: five twisted stacked boxes with LED skins
    b.block(VC.solid, '#3a3c44', cx, 0, cz, 3.4, 5, 3.4);
    for (let k = 0; k < 5; k++) {
      const y = 5 + k * 8.4, ry = k * 0.14;
      b.add(G.box, K.screen, cx, y + 4, cz, 7.4, 7.6, 7.4, 0, ry, 0, new THREE.Color(Math.random(), rand(0.8, 1.0), 0));
      b.add(G.box, VC.glow, cx, y + 0.1, cz, 7.6, 0.2, 7.6, 0, ry, 0, hdr('#bfe8ff', 1.4));
    }
    b.cyl(VC.metal, '#9aa3b5', cx, 51, cz, 0.15, 10);
    b.sph(VC.glow, hdr('#ff2a2a', 4), cx, 56.2, cz, 0.35);
  };
  const olympic = () => {
    const b = new Batcher();
    farGround(b, -1, '#1c1e26'); farGround(b, 1, '#1c1e26');
    for (const side of [-1, 1]) b.box(VC.solid, '#44464e', side * 30, 0.03, -40, 52, 0.03, 80);
    for (const x of [-9, -13, 9, 13]) for (let z = 2; z < 80; z += 6) b.box(VC.glow, hdr('#7cf8ff', 1.2), x, 0.05, -z, 0.2, 0.02, 3.6);
    nest(b, 60, -42);
    waterCube(b, -48, -40);
    linglong(b, -20, -73);
    for (const side of [-1, 1]) for (let z = 6; z < 80; z += 14) K.huadeng(b, side * (EDGE + 2.4), -z, 0.9);
    K.crowd(b, 6, 22, 2, 78, 30); K.crowd(b, -6, -20, 2, 62, 24);
    return b.build();
  };

  // ---------- CBD · 中国尊 · 央视大楼 ----------
  const dgTex = diagridTex();
  const diagrid = std({ map: dgTex, roughness: 0.3, metalness: 0.5, emissive: '#ffffff', emissiveMap: dgTex, emissiveIntensity: 0.55 });
  const zun = (b, cx, cz) => {   // CITIC Tower: square vessel (尊) with a slender waist and a flared crown
    const H = 150, w0 = 12, N = 30;
    const hw = (v) => w0 * (1 - 0.2 * Math.sin(Math.PI * Math.min(1, v / 0.9))) + w0 * 0.16 * smooth01(0.86, 1, v);
    const ring = (v) => { const h = hw(v), c = h * 0.3; return [[h, h - c], [h - c, h], [-(h - c), h], [-h, h - c], [-h, -(h - c)], [-(h - c), -h], [h - c, -h], [h, -(h - c)]]; };
    const pos = [], uv = [];
    for (let j = 0; j < N; j++) {
      const r0 = ring(j / N), r1 = ring((j + 1) / N), y0 = (j / N) * H, y1 = ((j + 1) / N) * H;
      let u = 0;
      for (let k = 0; k < 8; k++) {
        const a0 = r0[k], b0 = r0[(k + 1) % 8], a1 = r1[k], b1 = r1[(k + 1) % 8], du = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]);
        const A0 = [a0[0], y0, a0[1], u, y0], B0 = [b0[0], y0, b0[1], u + du, y0], A1 = [a1[0], y1, a1[1], u, y1], B1 = [b1[0], y1, b1[1], u + du, y1];
        for (const p of [A0, B1, B0, A0, A1, B1]) { pos.push(p[0], p[1], p[2]); uv.push(p[3] / 18, p[4] / 30); }
        u += du;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    b.addM(g, K.officeMat, at(cx, 0, cz), '#d9e6ff');
    for (const k of [0, 2, 4, 6]) for (let j = 0; j < N; j++) {
      const p0 = ring(j / N), p1 = ring((j + 1) / N);
      const m0 = [(p0[k][0] + p0[(k + 1) % 8][0]) / 2, (p0[k][1] + p0[(k + 1) % 8][1]) / 2];
      const m1 = [(p1[k][0] + p1[(k + 1) % 8][0]) / 2, (p1[k][1] + p1[(k + 1) % 8][1]) / 2];
      beam(b, VC.glow, cx + m0[0], (j / N) * H, cz + m0[1], cx + m1[0], ((j + 1) / N) * H, cz + m1[1], 0.3, hdr('#cfe8ff', 1.1));
    }
    const top = hw(1);
    b.box(VC.solid, '#1a2232', cx, H + 0.4, cz, top * 2, 0.8, top * 2);
    b.box(VC.glow, hdr('#e8f4ff', 1.6), cx, H + 0.9, cz, top * 2 + 0.2, 0.25, top * 2 + 0.2);
    b.sph(VC.glow, hdr('#ff2a2a', 4), cx, H + 3, cz, 0.45);
  };
  const cctv = (b, cx, cz) => {   // CCTV Headquarters: two leaning towers joined by a cantilevered loop
    const H = 84, box = (x0, x1, z0, z1, y0, y1) => b.addM(tiledBox(x1 - x0, y1 - y0, z1 - z0, 16), diagrid, at((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), 0xffffff);
    box(cx - 18, cx + 6, cz + 4, cz + 16, 0, 10);
    box(cx + 6, cx + 18, cz - 16, cz + 16, 0, 10);
    b.addM(slantBox(cx - 12, cz + 10, cx - 6, cz + 10, 6, 6, H - 16), diagrid, at(0, 10, 0), 0xffffff);
    b.addM(slantBox(cx + 12, cz - 10, cx + 12, cz - 4, 6, 6, H - 16), diagrid, at(0, 10, 0), 0xffffff);
    box(cx - 12, cx + 18, cz + 4, cz + 16, H - 6, H + 10);
    box(cx + 6, cx + 18, cz - 10, cz + 4, H - 6, H + 10);
    for (const [x0, z0, x1, z1] of [[cx - 12, cz + 16.05, cx + 18, cz + 16.05], [cx - 12.05, cz + 4, cx - 12.05, cz + 16]]) beam(b, VC.glow, x0, H + 10, z0, x1, H + 10, z1, 0.25, hdr('#cfe8ff', 1.4));
  };
  const cwtc = (b, cx, cz) => {   // China World Trade Center Tower III with its stepped crown
    const H = 110;
    b.addM(buildingGeo(18, H, 18, K.office, 1.3, 2.6), K.officeMat, at(cx, 0, cz), '#cfe0ff');
    let y = H;
    for (const [w, h] of [[16, 7], [13, 6], [9, 8]]) { b.block(VC.solid, '#1a2232', cx, y, cz, w, h, w); b.box(VC.glow, hdr('#e8f4ff', 1.5), cx, y + h, cz, w + 0.1, 0.2, w + 0.1); y += h; }
    for (const [dx, dz] of [[-9, -9], [-9, 9], [9, -9], [9, 9]]) b.box(VC.glow, hdr('#bfe3ff', 1.3), cx + dx, H / 2, cz + dz, 0.25, H, 0.25);
    b.sph(VC.glow, hdr('#ff2a2a', 4), cx, y + 1.5, cz, 0.4);
  };
  const cbd = () => {
    const b = new Batcher();
    farGround(b, -1, '#15161c'); farGround(b, 1, '#15161c');
    K.overpass(b, -12);
    zun(b, -32, -46);
    cctv(b, 44, -46);
    cwtc(b, -24, -70);
    K.modernRow(b, -1, 21, 32);
    K.modernRow(b, 1, 64, 80, 14);
    for (const [x, z, s] of [[-19.8, -46, -1], [25.8, -36, 1]]) K.ledScreen(b, x, 6, z, s, 9, 5.5);
    for (const side of [-1, 1]) {
      for (let z = 24; z < 80; z += 9) K.ginkgo(b, side * (EDGE + 3.4), -z, rand(0.9, 1.05));
      for (let z = 28; z < 80; z += 16) K.huadeng(b, side * (EDGE + 1.6), -z, 0.9);
    }
    K.taxi(b, 6.4, -30); K.taxi(b, -6.4, -48); K.taxi(b, 6.4, -66);
    K.crowd(b, 5, 9.5, 22, 78, 14); K.crowd(b, -5, -9.5, 22, 78, 14);
    return b.build();
  };

  return {
    landmarks: [
      { key: 'qianmen', name: '前门大街 · 正阳门', en: 'QIANMEN STREET · ZHENGYANGMEN', build: qianmen },
      { key: 'tiananmen', name: '天安门 · 长安街', en: "TIAN'ANMEN · CHANG'AN AVENUE", build: tiananmen },
      { key: 'jiaolou', name: '故宫角楼 · 筒子河', en: 'FORBIDDEN CITY CORNER TOWER', build: jiaolou },
      { key: 'tiantan', name: '天坛 · 祈年殿', en: 'TEMPLE OF HEAVEN', build: tiantan },
      { key: 'shichahai', name: '什刹海 · 银锭桥', en: 'SHICHAHAI · YINDING BRIDGE', build: shichahai },
      { key: 'olympic', name: '鸟巢 · 水立方', en: "BIRD'S NEST · WATER CUBE", build: olympic },
      { key: 'cbd', name: 'CBD · 中国尊', en: 'CBD · CITIC TOWER', build: cbd },
    ],
    update(t) {
      moat.userData.scroll.offset.set(t * 0.006, t * 0.016);
      lake.userData.scroll.offset.set(t * 0.008, t * 0.02);
    },
  };
}
