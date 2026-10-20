// Tokyo landmark scenes: Shibuya Scramble, Senso-ji & Kaminarimon, Tokyo Tower & Zojo-ji, Kabukicho, Odaiba & Rainbow Bridge.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, planeUV, buildingGeo, CHUNK_LEN, rand, randi, pick } from '../core.js';
import { at, EDGE, farGround, lamp, textTex, screenTint } from './common.js';
import { beam, wire, vText, JP, SNOW, VERMILION } from './tokyo_kit.js';

const LANTERN = new THREE.SphereGeometry(1, 28, 18);

function lanternMat(text) {
  const tex = canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#c41a16'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < h; y += 22) g.fillRect(0, y, w, 3);
    g.fillStyle = '#141414'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const chars = [...text], size = Math.min(200, (h * 0.86) / chars.length);
    g.font = `400 ${Math.floor(size)}px ${JP}`;
    for (const cx of [w * 0.25, w * 0.75]) chars.forEach((c, k) => g.fillText(c, cx, h / 2 + (k - (chars.length - 1) / 2) * size));
  }, { repeat: false });
  return std({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.6, roughness: 0.75 });
}

export function tokyoLandmarks(K) {
  const wheels = [];

  // ---------- 渋谷スクランブル交差点 ----------
  const stationTex = canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7dc242'; g.fillRect(0, h - 22, w, 22);
    g.fillStyle = '#141414'; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.font = `400 64px ${JP}`; g.fillText('渋谷駅', 40, 56);
    g.font = '700 30px "Chakra Petch", sans-serif'; g.fillText('SHIBUYA STATION', 330, 60);
  }, { repeat: false });
  const stationMat = basic({ map: stationTex, color: hdr('#ffffff', 1.05) });
  const shibuyaV = basic({ map: vText('渋谷', { color: '#ffffff', glow: '#ff3df0', bg: '#2a0a2a' }), color: hdr('#ffffff', 1.5) });

  const hachiko = (b, x, z) => {
    const bronze = '#6b5a3c';
    b.block(VC.solid, '#8f8a80', x, 0, z, 1.5, 1.2, 1.1);
    b.box(VC.solid, SNOW, x, 1.24, z, 1.52, 0.06, 1.12);
    const y = 1.25;
    b.add(G.sph, VC.metal, x - 0.15, y + 0.45, z, 0.75, 0.8, 0.55, 0, 0, 0.35, bronze);
    b.add(G.box, VC.metal, x + 0.15, y + 0.75, z, 0.4, 0.7, 0.45, 0, 0, -0.2, bronze);
    for (const dz of [-0.12, 0.12]) b.box(VC.metal, bronze, x + 0.25, y + 0.25, z + dz, 0.12, 0.5, 0.12);
    b.box(VC.metal, bronze, x + 0.32, y + 1.18, z, 0.38, 0.34, 0.34);
    b.box(VC.metal, bronze, x + 0.55, y + 1.12, z, 0.2, 0.16, 0.2);
    for (const dz of [-0.11, 0.11]) b.add(G.cone4, VC.metal, x + 0.28, y + 1.43, z + dz, 0.12, 0.2, 0.1, 0, 0, 0, bronze);
    b.add(G.tor, VC.metal, x - 0.55, y + 0.65, z, 0.35, 0.35, 0.35, 0, Math.PI / 2, 0, bronze);
    b.box(VC.solid, SNOW, x + 0.32, y + 1.36, z, 0.36, 0.04, 0.32);
  };
  const shibuya = () => {
    const b = new Batcher();
    const Z0 = 24, Z1 = 56;
    for (const side of [-1, 1]) {
      farGround(b, side, '#17171d');
      b.box(VC.solid, '#202027', side * 40, 0, -(Z0 + Z1) / 2, 60, 0.06, Z1 - Z0);
      for (let z = Z0 + 1; z < Z1 - 0.5; z += 1.3) b.box(VC.solid, '#e6e8ec', side * 15.5, 0.05, -z, 6, 0.03, 0.65);
      for (let k = 0; k < 10; k++) { const t = k / 9; b.add(G.box, VC.solid, side * (21 + t * 15), 0.05, -(Z0 + 3 + t * 26), 6, 0.03, 0.65, 0, side * 0.7, 0, '#e6e8ec'); }
      K.crowd(b, side * (EDGE + 1.2), side * 32, Z0 - 2, Z1 + 2, 70, 0.45);
      K.signal(b, side * (EDGE + 1.6), -(Z0 - 1), side);
      K.signal(b, side * (EDGE + 1.6), -(Z1 + 1), side);
      // corner buildings with giant screens facing the crossing and the runner
      const bx = side * 22, bz = -72, w = 20, d = 14, h = 44;
      b.addM(buildingGeo(w, h, d, K.office, 1.3, 2.6), K.officeMat, at(bx, 0, bz), '#9aa4c0');
      b.add(G.plane, K.screen, bx, 24, bz + d / 2 + 0.08, w * 0.86, 14, 1, 0, 0, 0, screenTint(1.1));
      b.add(G.plane, K.screen, bx, 9, bz + d / 2 + 0.08, w * 0.6, 4.5, 1, 0, 0, 0, screenTint());
      b.add(G.plane, K.screen, side * 11.9, 18, bz, d * 0.8, 10, 1, 0, -side * Math.PI / 2, 0, screenTint());
      b.box(VC.solid, SNOW, bx, h + 0.06, bz, w + 0.06, 0.12, d + 0.06);
      K.roofBoard(b, bx, h + 1, bz + d / 2 - 0.6, 12);
    }
    // the right corner before the crossing; the station and Hachiko on the left
    K.row(b, 1, 0, Z0 - 3);
    K.row(b, -1, 0, 4);
    b.addM(buildingGeo(14, 12, 16, K.office, 1.3, 2.6), K.officeMat, at(-18, 0, -13), '#c9d0dc');
    b.add(G.plane, stationMat, -10.9, 9.5, -13, 12, 1.5, 1, 0, Math.PI / 2);
    b.box(VC.glow, hdr('#f2faff', 1.2), -10.95, 2.2, -13, 0.05, 3.6, 10);
    b.box(VC.glow, hdr('#7dc242', 1.6), -10.95, 4.4, -13, 0.06, 0.3, 14);
    b.box(VC.solid, SNOW, -18, 12.06, -13, 14.06, 0.12, 16.06);
    hachiko(b, -7.2, -19);
    // cylindrical fashion tower on the right corner of the crossing
    const cx = 16.5, cz = -60;
    b.cyl(VC.metal, '#b9c0cc', cx, 18, cz, 4.6, 36);
    b.add(G.plane, shibuyaV, cx - 4.66, 20, cz, 2.2, 8.8, 1, 0, -Math.PI / 2);
    b.box(VC.glow, hdr('#ff3df0', 1.8), cx - 4.62, 20, cz, 0.06, 30, 0.25);
    for (let y = 4; y < 34; y += 4) b.cyl(VC.glow, hdr('#ffffff', 0.9), cx, y, cz, 4.66, 0.12);
    b.cyl(VC.glow, hdr('#ff3df0', 2.2), cx, 36.4, cz, 4.7, 0.6);
    b.cyl(VC.solid, SNOW, cx, 36.8, cz, 4.5, 0.1);
    // zebra stripes over the tracks at both edges of the crossing
    for (const zc of [Z0 + 2, Z1 - 2]) for (let x = -3.4; x <= 3.5; x += 1.3) b.box(VC.solid, '#e6e8ec', x, 0.035, -zc, 0.65, 0.03, 3.2);
    if (K.sakura) for (const side of [-1, 1]) for (const z of [30, 40, 50]) K.sakura(b, side * rand(38, 46), -z, rand(0.9, 1.05));
    return b.build();
  };

  // ---------- 浅草寺 · 雷門 ----------
  const guardian = (b, x, z, col) => {
    b.block(VC.solid, '#2a2a2a', x, 0, z, 2.4, 0.8, 1.6);
    const y = 0.8;
    b.add(G.cyl8, VC.solid, x, y + 1.5, z, 1.6, 2.6, 1.1, 0, 0, 0, col);
    b.sph(VC.solid, col, x, y + 3.2, z, 0.55);
    b.add(G.box, VC.solid, x - 0.9, y + 2.6, z, 0.35, 1.5, 0.35, 0, 0, 0.9, col);
    b.add(G.box, VC.solid, x + 0.9, y + 2.8, z, 0.35, 1.5, 0.35, 0, 0, -1.0, col);
    b.add(G.tor, VC.solid, x, y + 3.5, z - 0.35, 3.0, 2.2, 1.6, 0, 0, 0, '#d9d4c0');
    for (const dx of [-0.18, 0.18]) b.box(VC.glow, hdr('#ffe066', 2.4), x + dx, y + 3.3, z + 0.5, 0.12, 0.06, 0.04);
  };
  const templeGate = (b, gz, { text, top = 15, half = EDGE + 1.6, bay = 7, statues = false, stories = 1 }) => {
    const outer = half + bay, W = 2 * outer + 1.2;
    for (const s of [-1, 1]) {
      for (const dz of [-1.8, 1.8]) for (const px of [half, outer]) b.cyl(VC.solid, VERMILION, s * px, (top - 2.2) / 2, gz + dz, 0.4, top - 2.2, 'cyl8');
      if (statues) {
        const bx = s * (half + bay / 2);
        b.box(VC.solid, '#2a1a14', bx, 3.6, gz - 0.6, bay - 1, 7.2, 2.4);
        b.box(VC.glow, hdr('#ffb35c', 0.75), bx, 3.6, gz + 0.62, bay - 1.4, 6.6, 0.04);
        guardian(b, bx, gz + 0.3, s < 0 ? '#3a9a5a' : '#c83a2a');
        for (let k = 0; k < 13; k++) b.box(VC.solid, '#3a2a1a', bx - (bay - 1.4) / 2 + (k * (bay - 1.4)) / 12, 3.6, gz + 1.25, 0.07, 6.8, 0.07);
      }
    }
    b.box(VC.solid, VERMILION, 0, top - 2.6, gz, W, 0.9, 4.2);
    b.box(VC.solid, '#1e1510', 0, top - 1.8, gz, W + 0.6, 0.7, 4.8);
    b.box(VC.glow, hdr('#ffcf6b', 1.6), 0, top - 2.15, gz + 2.12, W, 0.1, 0.05);
    b.add(G.cone4, VC.solid, 0, top + 0.6, gz, W * 1.18, 3.0, 8.6, 0, 0, 0, '#34373d');
    b.add(G.cone4, VC.solid, 0, top + 0.95, gz, W * 1.02, 2.4, 7.2, 0, 0, 0, SNOW);
    b.box(VC.solid, '#25272c', 0, top + 2.0, gz, W * 0.5, 0.5, 0.6);
    if (stories > 1) {
      b.box(VC.solid, VERMILION, 0, top + 3.4, gz, W * 0.78, 2.8, 3.6);
      b.box(VC.glow, hdr('#ffcf8a', 0.9), 0, top + 3.4, gz + 1.82, W * 0.6, 1.4, 0.04);
      b.add(G.cone4, VC.solid, 0, top + 6.0, gz, W * 1.0, 2.8, 7.8, 0, 0, 0, '#34373d');
      b.add(G.cone4, VC.solid, 0, top + 6.3, gz, W * 0.86, 2.2, 6.6, 0, 0, 0, SNOW);
    }
    if (text) {
      b.add(LANTERN, lanternMat(text), 0, top - 5.6, gz, 2.2, 2.5, 2.2);
      b.cyl(VC.solid, '#141414', 0, top - 3.15, gz, 1.5, 0.5);
      b.cyl(VC.solid, '#141414', 0, top - 8.05, gz, 1.4, 0.45);
      b.cyl(VC.metal, '#c9a227', 0, top - 8.45, gz, 0.9, 0.35);
      b.cyl(VC.solid, '#141414', 0, top - 2.65, gz, 0.15, 0.6);
    }
  };
  const nakamise = (b, side, z0, z1) => {
    for (let z = z0; z < z1 - 3; z += 4.6) {
      const x = side * 13.2, zc = -(z + 2.2);
      b.block(VC.solid, '#e9e2d4', x, 0, zc, 4.4, 4.0, 4.3);
      b.box(VC.solid, VERMILION, x - side * 2.21, 2.0, zc, 0.06, 4.0, 4.3);
      b.box(VC.glow, hdr(pick(['#ffcf8a', '#ffe0b0', '#ffd6e2']), 1.0), x - side * 2.24, 1.5, zc, 0.04, 2.4, 3.6);
      b.add(G.box, VC.solid, x - side * 2.6, 4.25, zc, 1.6, 0.18, 4.6, 0, 0, side * 0.35, '#34373d');
      b.add(G.cone4, VC.solid, x, 4.9, zc, 5.0, 1.8, 4.9, 0, 0, 0, '#34373d');
      b.add(G.cone4, VC.solid, x, 5.15, zc, 4.3, 1.4, 4.2, 0, 0, 0, SNOW);
      K.chochin(b, x - side * 2.7, 3.3, zc + 1.2, 0.7);
      K.chochin(b, x - side * 2.7, 3.3, zc - 1.2, 0.7);
    }
  };
  const pagoda5 = (b, x, z, s = 1) => {
    let y = 1.4 * s;
    b.block(VC.solid, '#8d8a84', x, 0, z, 10 * s, 1.4 * s, 10 * s);
    for (let k = 0; k < 5; k++) {
      const w = (6.6 - k * 0.6) * s, h = (3.3 - k * 0.12) * s, ew = w + 4.4 * s;
      b.block(VC.solid, VERMILION, x, y, z, w, h, w);
      for (const [fx, fz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        b.box(VC.glow, hdr('#ffd9a0', 1.3), x + fx * (w / 2 + 0.03), y + h * 0.45, z + fz * (w / 2 + 0.03), fx ? 0.04 : w * 0.3, h * 0.55, fz ? 0.04 : w * 0.3);
      }
      b.block(VC.solid, '#2b2e33', x, y + h, z, ew, 0.32 * s, ew);
      b.add(G.cone4, VC.solid, x, y + h + 0.82 * s, z, ew * 0.97, 1.0 * s, ew * 0.97, 0, 0, 0, '#2b2e33');
      b.add(G.cone4, VC.solid, x, y + h + 0.94 * s, z, ew * 0.8, 0.8 * s, ew * 0.8, 0, 0, 0, SNOW);
      b.box(VC.glow, hdr('#ffcf6b', 1.9), x, y + h - 0.06, z, w + 0.12, 0.12, w + 0.12);
      y += h + 1.32 * s;
    }
    b.cyl(VC.metal, '#c9a227', x, y + 4 * s, z, 0.2 * s, 8 * s);
    for (let k = 0; k < 9; k++) b.cyl(VC.glow, hdr('#ffd77a', 1.8), x, y + 1.2 * s + k * 0.7 * s, z, (0.75 - k * 0.03) * s, 0.12 * s);
    b.add(G.sph, VC.glowAdd, x, y * 0.55, z, 34 * s, 54 * s, 34 * s, 0, 0, 0, hdr('#ff7a4a', 0.035));
  };
  const mainHall = (b, x, z) => {
    const s = Math.sign(x), fx = x - s * 10;
    b.block(VC.solid, '#8d8a84', x, 0, z, 26, 1.8, 22);
    b.block(VC.solid, VERMILION, x, 1.8, z, 20, 7.5, 16);
    for (let k = 0; k < 8; k++) b.cyl(VC.solid, '#a3221a', fx - s * 0.4, 5.5, z - 7 + k * 2, 0.4, 7.4, 'cyl8');
    b.box(VC.glow, hdr('#ffcf8a', 1.1), fx - s * 0.05, 5.2, z, 0.05, 5.6, 13);
    b.add(G.cone4, VC.solid, x, 13.4, z, 36, 9, 28, 0, 0, 0, '#2b2e33');
    b.add(G.cone4, VC.solid, x, 14.2, z, 30, 7.4, 23, 0, 0, 0, SNOW);
    b.box(VC.glow, hdr('#ffcf6b', 1.8), fx - s * 0.6, 9.4, z, 0.1, 0.12, 16);
    b.add(G.sph, VC.glow, fx - s * 1.2, 6.2, z, 2.0, 2.6, 2.0, 0, 0, 0, hdr('#ff3a2a', 2.4));
  };
  const incense = (b, x, z) => {
    b.cyl(VC.metal, '#4a4030', x, 0.5, z, 0.9, 1.0, 'cyl8');
    b.cyl(VC.metal, '#5a4c38', x, 1.3, z, 1.3, 0.8, 'cyl8');
    for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2 + Math.PI / 4; b.cyl(VC.metal, '#4a4030', x + Math.cos(a) * 0.9, 2.2, z + Math.sin(a) * 0.9, 0.08, 1.2); }
    b.add(G.cone4, VC.metal, x, 3.2, z, 2.6, 1.0, 2.6, 0, 0, 0, '#4a4030');
    b.box(VC.glow, hdr('#ff8a3a', 2.2), x, 1.75, z, 1.6, 0.1, 1.6);
    for (let k = 0; k < 6; k++) b.sph(VC.glowAdd, hdr('#d8d4e8', 0.06 - k * 0.007), x + rand(-0.3, 0.3), 3.8 + k * 1.1, z + k * 0.25, 0.7 + k * 0.4, true);
  };
  const asakusa = () => {
    const b = new Batcher();
    for (const side of [-1, 1]) {
      farGround(b, side, '#1b1918');
      nakamise(b, side, 16, 64);
      K.crowd(b, side * (EDGE + 1.2), side * (EDGE + 6.6), 4, 76, 16, 0.3);
    }
    templeGate(b, -9, { text: '雷門', statues: true });
    templeGate(b, -68, { text: '小舟町', top: 14, stories: 2, bay: 6 });
    pagoda5(b, -27, -54, 1.0);
    mainHall(b, 30, -74);
    incense(b, 7.6, -77);
    if (K.sakura) { K.sakura(b, -38, -40, 1.1); K.shidare(b, -38, -68, 1.1); K.sakura(b, 47, -52, 1.1); }
    return b.build();
  };

  // ---------- 東京タワー · 増上寺 ----------
  const sangedatsumon = (b, x, z) => {
    const s = Math.sign(x), fx = x - s * 3.0;
    b.block(VC.solid, '#8d8a84', x, 0, z, 7.4, 0.8, 15);
    b.block(VC.solid, VERMILION, x, 0.8, z, 6, 6.2, 13.4);
    for (const dz of [-4.4, 0, 4.4]) {
      b.box(VC.solid, '#1a1210', fx - s * 0.02, 3.2, z + dz, 0.06, 4.4, 3.0);
      b.box(VC.glow, hdr('#ffb35c', 0.7), fx - s * 0.04, 2.6, z + dz, 0.04, 3.0, 2.2);
    }
    b.block(VC.solid, '#2b2e33', x, 7.0, z, 9.4, 0.4, 17);
    b.block(VC.solid, VERMILION, x, 7.4, z, 5.2, 3.6, 12);
    b.box(VC.glow, hdr('#ffcf8a', 0.8), fx + s * 0.38, 9.0, z, 0.04, 1.4, 10);
    b.add(G.cone4, VC.solid, x, 12.4, z, 10, 3.2, 18, 0, 0, 0, '#2b2e33');
    b.add(G.cone4, VC.solid, x, 12.75, z, 8.6, 2.6, 15.6, 0, 0, 0, SNOW);
    b.box(VC.glow, hdr('#ffcf6b', 1.7), fx - s * 0.05, 6.9, z, 0.08, 0.1, 14);
  };
  // lattice tower in the orange and white of Tokyo Tower's landmark lighting
  const tokyoTower = (b, cx, cz, s = 1) => {
    const H = 100 * s, levels = 16;
    const half = (y) => 14 * s * Math.pow(1 - y / H, 1.7) + 1.2 * s;
    const orange = hdr('#ff5a1a', 1.6), white = hdr('#ffe6d6', 0.85);
    let prev = null;
    for (let k = 0; k <= levels; k++) {
      const y = (H * k) / levels, w = half(y), col = Math.floor(k / 2) % 2 ? white : orange;
      const c = [[-w, -w], [w, -w], [w, w], [-w, w]];
      if (prev) {
        for (let i = 0; i < 4; i++) {
          const j = (i + 1) % 4, p0 = prev.c[i], p1 = prev.c[j];
          beam(b, VC.glow, cx + p0[0], prev.y, cz + p0[1], cx + c[i][0], y, cz + c[i][1], 0.55 * s, col);
          beam(b, VC.glow, cx + p0[0], prev.y, cz + p0[1], cx + c[j][0], y, cz + c[j][1], 0.16 * s, col);
          beam(b, VC.glow, cx + p1[0], prev.y, cz + p1[1], cx + c[i][0], y, cz + c[i][1], 0.16 * s, col);
          beam(b, VC.glow, cx + c[i][0], y, cz + c[i][1], cx + c[j][0], y, cz + c[j][1], 0.2 * s, col);
        }
      }
      prev = { y, c };
    }
    for (const [f, dw, dh] of [[0.45, 1.25, 4.5], [0.74, 1.15, 2.4]]) {
      const y = H * f, w = half(y) * dw + 1;
      b.box(VC.solid, '#3a3e46', cx, y, cz, 2 * w, dh * s, 2 * w);
      b.box(VC.glow, hdr('#fff4dc', 1.6), cx, y, cz, 2 * w + 0.1, dh * s * 0.5, 2 * w + 0.1);
    }
    b.cyl(VC.glow, white, cx, H + 9 * s, cz, 0.5 * s, 18 * s);
    b.sph(VC.glow, hdr('#ff2a2a', 5), cx, H + 18.5 * s, cz, 0.6 * s, true);
    b.addM(buildingGeo(34 * s, 8 * s, 28 * s, K.zak, 1.2, 2.5), K.zakMat, at(cx, 0, cz), '#ffffff');
    b.box(VC.solid, SNOW, cx, 8 * s + 0.06, cz, 34 * s + 0.06, 0.12, 28 * s + 0.06);
    b.add(G.sph, VC.glowAdd, cx, H * 0.4, cz, 50 * s, 110 * s, 50 * s, 0, 0, 0, hdr('#ff6a2a', 0.035));
  };
  const towerScene = () => {
    const b = new Batcher();
    for (const side of [-1, 1]) farGround(b, side, '#17171d');
    K.row(b, -1, 0, CHUNK_LEN);
    K.poleLine(b, -1);
    sangedatsumon(b, 16.5, -20);
    for (let k = 0; k < 34; k++) K.jizo(b, EDGE + 5.3 + (k % 2) * 0.9, -(32 + Math.floor(k / 2) * 1.0));
    for (let k = 0; k < 7; k++) {
      const x = rand(13, 20), z = -rand(30, 47);
      b.cyl(VC.solid, '#2a2420', x, 1.4, z, 0.2, 2.8, 'cyl8');
      b.add(G.cone8, VC.solid, x, 4.0, z, 3.4, 4.2, 3.4, 0, 0, 0, '#22402c');
      b.add(G.cone8, VC.solid, x, 4.9, z, 2.4, 2.6, 2.4, 0, 0, 0, SNOW);
    }
    tokyoTower(b, 31, -64, 1);
    if (K.sakura) { K.sakura(b, 21.5, -33, 1.0); K.sakura(b, 20, -45, 0.95); }
    K.crowd(b, EDGE + 1.2, EDGE + 4.2, 2, 78, 10, 0.4);
    return b.build();
  };

  // ---------- 新宿 · 歌舞伎町 ----------
  const kabukiMat = basic({ map: textTex('歌舞伎町一番街', { w: 1024, h: 160, color: '#ffffff', glow: '#ff2240', bg: '#200810', font: JP, weight: 400, size: 0.6 }), color: hdr('#ffffff', 1.4) });
  const kabukiGate = (b, z) => {
    const W = EDGE + 1.0, H = 6.4, peak = 8.2, red = hdr('#ff2240', 2.4);
    for (const s of [-1, 1]) {
      b.box(VC.solid, '#1a1418', s * W, H / 2, z, 0.5, H, 0.5);
      b.box(VC.glow, red, s * W, H / 2, z + 0.27, 0.16, H, 0.04);
    }
    let px = -W, py = H;
    for (let k = 1; k <= 16; k++) {
      const t = k / 16, x = -W + 2 * W * t, y = H + (peak - H) * Math.sin(Math.PI * t);
      beam(b, VC.solid, px, py, z, x, y, z, 0.42, '#1a1418');
      beam(b, VC.glow, px, py, z + 0.27, x, y, z + 0.27, 0.16, red);
      b.sph(VC.glow, hdr('#fff4e0', 3), x, y + 0.3, z + 0.27, 0.09, true);
      px = x; py = y;
    }
    b.add(G.plane, kabukiMat, 0, H + 0.45, z + 0.3, 7.4, 1.16, 1);
    b.add(G.plane, kabukiMat, 0, H + 0.45, z - 0.3, 7.4, 1.16, 1, 0, Math.PI, 0);
  };
  // Omoide Yokocho: tiny izakaya shacks under strings of lanterns
  const yokocho = (b, side, z0, z1) => {
    for (let z = z0; z < z1 - 2; z += 2.6) {
      const zc = -(z + 1.3), x = side * 12.6, h = rand(3.8, 5.2);
      b.block(VC.solid, pick(['#3a2a20', '#4a3426', '#2e2622']), x, 0, zc, 3.2, h, 2.5);
      b.add(G.box, VC.metal, x, h + 0.25, zc, 3.6, 0.1, 2.8, 0, 0, side * 0.2, '#5a5f66');
      b.box(VC.solid, SNOW, x, h + 0.38, zc, 3.0, 0.05, 2.5);
      b.box(VC.glow, hdr('#ffb35c', 1.0), x - side * 1.61, 1.3, zc, 0.04, 1.8, 1.9);
      b.add(planeUV(K.noren.rects[randi(1, 3)]), K.norenMat, x - side * 1.68, 2.05, zc, 1.9, 0.6, 1, 0, -side * Math.PI / 2);
      K.chochin(b, x - side * 1.95, 2.7, zc + 0.7, 0.6);
      b.add(pick(K.vgeos), K.vsMat, x - side * 1.85, 3.4, zc - 0.6, 0.32, 0.3, 1);
      if (Math.random() < 0.4) for (let k = 0; k < 3; k++) b.sph(VC.glowAdd, hdr('#ffd9c0', 0.03 - k * 0.008), x - side * 1.9, 3.2 + k * 0.8, zc, 0.3 + k * 0.22, true);
    }
    for (let z = z0; z < z1; z += 1.6) K.chochin(b, side * (EDGE + 6.4), 4.4, -z, 0.45);
    wire(b, side * (EDGE + 6.4), 4.75, -z0, side * (EDGE + 6.4), 4.75, -z1, 0.3);
  };
  const kabukicho = () => {
    const b = new Batcher();
    for (const side of [-1, 1]) farGround(b, side, '#141418');
    K.row(b, 1, 0, CHUNK_LEN);
    for (let z = 6; z < CHUNK_LEN; z += 9) K.hSign(b, 10.7, rand(6, 14), -z, 1, rand(4, 7));
    b.add(G.plane, K.screen, 10.75, 13, -46, 9, 6, 1, 0, -Math.PI / 2, 0, screenTint());
    K.row(b, -1, 0, 18);
    yokocho(b, -1, 20, 66);
    K.row(b, -1, 68, CHUNK_LEN);
    kabukiGate(b, -12);
    for (const side of [-1, 1]) K.crowd(b, side * (EDGE + 1.2), side * (EDGE + 6.0), 2, 78, 22, 0.35);
    return b.build();
  };

  // ---------- お台場 · レインボーブリッジ ----------
  const rainbowBridge = (b, z) => {
    const y = 13, xr = -15, xl = -175, towers = [-50, -128], th = 46;
    b.box(VC.solid, '#dfe3ea', (xl + xr) / 2, y, z, xr - xl, 1.6, 9);
    b.box(VC.solid, '#b9c0cc', (xl + xr) / 2, y - 3.4, z, xr - xl, 1.2, 7);
    for (const dz of [-4.4, 4.4]) b.box(VC.glow, hdr('#ffffff', 1.6), (xl + xr) / 2, y + 0.9, z + dz, xr - xl, 0.1, 0.1);
    for (const tx of towers) for (const dz of [-3.8, 3.8]) {
      b.box(VC.solid, '#eef1f5', tx, (th - 1.6) / 2, z + dz, 2.4, th + 1.6, 2.4);
      b.sph(VC.glow, hdr('#ff2a2a', 4), tx, th + 1.2, z + dz, 0.5, true);
    }
    for (const tx of towers) for (const yy of [y + 8, th - 2]) b.box(VC.solid, '#eef1f5', tx, yy, z, 2.2, 1.6, 9);
    const [ta, tb] = towers;
    const cableY = (x) => {
      if (x > ta) return th - ((th - y - 2) * (x - ta)) / (xr - ta);
      if (x < tb) return th - ((th - y - 2) * (tb - x)) / (tb - xl);
      const m = (ta + tb) / 2, hw = (ta - tb) / 2;
      return y + 3 + (th - y - 3) * ((x - m) / hw) ** 2;
    };
    for (const dz of [-3.8, 3.8]) {
      let px = xr, py = cableY(xr);
      for (let x = xr - 3; x >= xl; x -= 3) {
        const yy = cableY(x);
        beam(b, VC.solid, px, py, z + dz, x, yy, z + dz, 0.25, '#dfe3ea');
        if (Math.abs(Math.round(x)) % 6 === 0) {
          if (yy - y > 1) b.box(VC.solid, '#c9ced6', x, (yy + y) / 2, z + dz, 0.06, yy - y, 0.06);
          b.sph(VC.glow, new THREE.Color().setHSL(((x - xl) / (xr - xl)) * 0.85, 0.9, 0.6).multiplyScalar(2.4), x, yy + 0.35, z + dz, 0.3, true);
        }
        px = x; py = yy;
      }
    }
    b.block(VC.solid, '#9aa0aa', xr - 2, -1.6, z, 6, y + 1.6, 12);
  };
  // Odaiba's replica of the Statue of Liberty, a wink at New York
  const libertyMini = (b, x, z) => {
    const c = '#6aa592';
    b.block(VC.solid, '#8e897c', x, 0, z, 2.2, 2.6, 2.2);
    b.add(G.cyl8, VC.solid, x, 4.0, z, 1.3, 3.0, 1.3, 0, 0, 0, c);
    b.add(G.cyl8, VC.solid, x, 6.0, z, 0.9, 1.4, 0.9, 0, 0, 0, c);
    b.sph(VC.solid, c, x, 7.0, z, 0.42);
    for (let k = 0; k < 7; k++) b.add(G.cone, VC.solid, x + 0.05, 7.35, z, 0.08, 0.5, 0.08, (k - 3) * 0.4, 0, 0, c);
    b.add(G.box, VC.solid, x + 0.1, 7.3, z + 0.55, 0.22, 1.6, 0.22, 0.25, 0, 0, c);
    b.add(G.cone, VC.glow, x + 0.15, 8.4, z + 0.75, 0.3, 0.45, 0.3, 0, 0, 0, hdr('#ffc94d', 4));
    b.box(VC.solid, c, x + 0.4, 5.6, z - 0.5, 0.15, 0.8, 0.55);
    b.box(VC.solid, SNOW, x, 2.64, z, 2.22, 0.06, 2.22);
  };
  // two slabs joined by a lattice with a silver sphere in between
  const sphereFrame = (b, x, z) => {
    for (const dx of [-7, 7]) {
      b.addM(buildingGeo(7, 30, 9, K.office, 1.3, 2.6), K.officeMat, at(x + dx, 0, z), '#c9d0dc');
      b.box(VC.solid, SNOW, x + dx, 30.06, z, 7.06, 0.12, 9.06);
    }
    for (const y of [8, 16, 24, 30]) b.box(VC.metal, '#c9ced6', x, y, z, 7, 0.8, 9);
    for (const y of [8, 16, 24]) for (const s of [-1, 1]) beam(b, VC.metal, x - 3.5, y, z + s * 4.4, x + 3.5, y + 8, z + s * 4.4, 0.3, '#c9ced6');
    b.add(G.sph, std({ color: '#d9dde6', metalness: 1, roughness: 0.15, emissive: '#2a3550', emissiveIntensity: 0.5 }), x, 26, z, 9, 9, 9);
    b.cyl(VC.glow, hdr('#cfe6ff', 1.6), x, 26, z, 4.6, 0.2);
  };
  const ferris = () => {
    const b2 = new Batcher(), R = 22, n = 48;
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
      const col = new THREE.Color().setHSL(k / n, 0.9, 0.55).multiplyScalar(1.4);
      for (const zz of [0.6, -0.6]) beam(b2, VC.glow, Math.cos(a0) * R, Math.sin(a0) * R, zz, Math.cos(a1) * R, Math.sin(a1) * R, zz, 0.3, col);
      if (k % 2 === 0) for (const zz of [0.6, -0.6]) beam(b2, VC.metal, 0, 0, zz, Math.cos(a0) * R, Math.sin(a0) * R, zz, 0.1, '#c9ced6');
      if (k % 3 === 0) {
        const gx = Math.cos(a0) * (R + 1.1), gy = Math.sin(a0) * (R + 1.1);
        b2.box(VC.solid, '#e8eef6', gx, gy, 0, 1.4, 1.6, 1.6);
        b2.box(VC.glow, hdr('#fff4dc', 1.5), gx, gy + 0.15, 0, 1.42, 0.6, 1.62);
      }
    }
    b2.cyl(VC.metal, '#9aa0aa', 0, 0, 0, 1.6, 2.6, 'cyl', Math.PI / 2);
    return b2.build();
  };
  const odaiba = () => {
    const b = new Batcher();
    b.add(G.plane, K.bay, -90, -1.6, -65, 170, 130, 1, -Math.PI / 2);
    b.box(VC.solid, '#5a5a62', -(EDGE + 7.2), -0.8, -CHUNK_LEN / 2, 0.8, 1.8, CHUNK_LEN);
    for (let z = 1; z < CHUNK_LEN; z += 2.5) b.box(VC.metal, '#2a2c32', -(EDGE + 7), 0.6, -z, 0.08, 1.2, 0.08);
    b.box(VC.metal, '#2a2c32', -(EDGE + 7), 1.18, -CHUNK_LEN / 2, 0.1, 0.1, CHUNK_LEN);
    for (let z = 4; z < CHUNK_LEN; z += 14) lamp(b, -(EDGE + 5.6), -z, -1, { light: '#dfeaff', k: 3, h: 5 });
    K.crowd(b, -(EDGE + 1.2), -(EDGE + 6.4), 2, 78, 12, 0.4);
    libertyMini(b, -(EDGE + 5.2), -30);
    rainbowBridge(b, -74);
    farGround(b, 1, '#18181f');
    K.row(b, 1, 0, 24);
    sphereFrame(b, 22, -38);
    const wx = 34, wz = -62, R = 22;
    for (const s of [-1, 1]) for (const dx of [-9, 9]) beam(b, VC.metal, wx + dx, 0, wz + s * 3, wx, R + 4, wz + s * 1.2, 0.7, '#c9ced6');
    b.block(VC.solid, '#2a2c34', wx, 0, wz, 16, 3, 10);
    b.box(VC.glow, hdr('#fff4dc', 1.3), wx, 1.6, wz + 5.02, 12, 1.4, 0.04);
    K.crowd(b, EDGE + 1.2, EDGE + 6.2, 2, 78, 14, 0.4);
    const g = b.build();
    const wheel = ferris();
    wheel.position.set(wx, R + 4, wz);
    g.add(wheel);
    wheels.push(wheel);
    return g;
  };

  return {
    landmarks: [
      { name: '涩谷十字路口', en: 'SHIBUYA SCRAMBLE CROSSING', build: shibuya },
      { name: '浅草寺 · 雷门', en: 'SENSO-JI · KAMINARIMON', build: asakusa },
      { name: '东京塔 · 增上寺', en: 'TOKYO TOWER · ZOJO-JI', build: towerScene },
      { name: '新宿 · 歌舞伎町', en: 'SHINJUKU KABUKICHO', build: kabukicho },
      { name: '台场 · 彩虹大桥', en: 'ODAIBA · RAINBOW BRIDGE', build: odaiba },
    ],
    update(t) {
      for (const w of wheels) w.rotation.z = t * 0.05;
      K.bay.userData.scroll.offset.set(t * 0.01, t * 0.025);
    },
  };
}
