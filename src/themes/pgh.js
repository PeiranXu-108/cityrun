// Pittsburgh: golden-hour riverfront, yellow suspension bridges, steel mills, Mt. Washington incline.
import { THREE, Batcher, VC, G, std, basic, hdr, windowTex, stripeTex, buildingGeo, canvasTex,
  CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { buildTrain, buildLowBarrier, buildHighBarrier, barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, facadeMat, buildingRow, lamp, tree, skyline, skyTex, SKY_VC, polar, at, EDGE, waterMat, DISC, textTex, people } from './common.js';

const GOLD = '#f2b705';

export default {
  id: 'pgh', name: '匹兹堡', en: 'PITTSBURGH', tagline: '钢铁之城 · 金色黄昏',
  blurb: '三河交汇的黄昏，从金黄色的悬索桥下穿过，炼钢炉的火星在空中飞舞。路过顶着 UPMC 字样的钢铁大楼、玻璃城堡 PPG Place，再冲进卡内基梅隆的校园。',
  sights: ['UPMC 钢铁大楼', '卡内基梅隆大学', '三河交汇喷泉'],
  accent: '#ffb347', accent2: GOLD, portal: '#ffb347',
  sky: { top: '#2a1b4d', mid: '#c4502e', bot: '#ffb04a', glow: '#ff7a2a', glowK: 0.5, sun: '#fff1c4', sunK: 1.7,
    sunDir: [-0.28, 0.07, -1], sunSize: 0.009, cloud: 0.75, cloudColor: '#7d3a58', horizon: -0.08 },
  fog: { color: '#b45a3e', near: 30, far: 270 },
  light: { hemiSky: '#ffb27a', hemiGround: '#3a2230', hemi: 0.95, dir: '#ffd2a0', dirK: 1.15, dirPos: [-0.3, 0.45, -1] },
  exposure: 1.0, bloom: { strength: 0.75, radius: 0.55, threshold: 0.88 },
  weather: [{ mode: 'rise', count: 380, colors: ['#ffb347', '#ff6a2a', '#ffd27a'], size: 0.22, k: 3, box: [50, 20, 90], speed: 1 }],
  coin: 'nut', music: 'pgh',

  build() {
    const animated = [];
    const brick = windowTex({ wall: '#8a4a32', glass: '#15110f', lit: ['#ffcf8a', '#ffb35c'], litChance: 0.3, arch: true, frame: '#d9b48a', ledge: '#5e3022', cols: 6 });
    const brickMat = facadeMat(brick, { k: 0.85 });
    const mill = windowTex({ wall: '#3a2d28', glass: '#120d0b', lit: ['#ff8a2a', '#ffb347'], litChance: 0.5, band: true, cols: 6 });
    const millMat = facadeMat(mill, { k: 1.4, rough: 0.7, metal: 0.3 });
    const water = waterMat('#3b4c6e', 8);
    const track = makeTrack({ gravel: '#2c2624', spots: ['#3a322e', '#1e1a19', '#4a403a'], sleeper: '#3b2f28', rail: '#9c8f80', edge: '#ffb347', edgeK: 2, side: '#3a3432', ground: [null, '#3a302a'] });

    const house = (b, x, y, z, s) => {
      const c = pick(['#d9c3a5', '#b9785a', '#8a5a44', '#c9b28a', '#6f7d8c']);
      b.block(VC.solid, c, x, y, z, 3.2 * s, 2.6 * s, 3 * s);
      b.add(G.cone4, VC.solid, x, y + 3.2 * s, z, 3.8 * s, 1.4 * s, 3.6 * s, 0, 0, 0, '#3a2a28');
      if (chance(0.7)) b.box(VC.glow, hdr(pick(['#ffcf8a', '#ffe0a8']), 2.2), x - 1.62 * s, y + 1.4 * s, z, 0.04, 0.7 * s, 0.6 * s);
    };

    const hillSide = (b) => {
      const a = 0.52, x0 = 24, L = 80;
      b.add(G.box, VC.solid, x0 + Math.cos(a) * L / 2, Math.sin(a) * L / 2 - 1.5, -CHUNK_LEN / 2, L, 2, CHUNK_LEN + 0.6, 0, 0, a, '#4a3a2a');
      const along = (s) => [x0 + Math.cos(a) * s, Math.sin(a) * s - 0.5];
      for (let k = 0; k < 26; k++) {
        const s = rand(4, 70), [x, y] = along(s), z = -rand(2, CHUNK_LEN - 2);
        if (chance(0.45)) house(b, x, y - 0.3, z, rand(0.8, 1.2));
        else tree(b, x, z, { leaf: pick(['#c4622d', '#e0a030', '#9a5a2a', '#7a8a3a', '#b8452a']), trunk: '#3a2a20', s: rand(0.9, 1.4), y: y - 0.6 });
      }
      if (chance(0.55)) { // Duquesne-style incline
        const z = -rand(15, 65);
        for (const dz of [-0.6, 0.6]) {
          const [cx, cy] = along(L * 0.45);
          b.add(G.box, VC.metal, cx, cy + 0.4, z + dz, L * 0.9, 0.15, 0.15, 0, 0, a, '#2b2b30');
        }
        const [tx, ty] = along(L * 0.88);
        b.block(VC.solid, '#6b4a3a', tx, ty, z, 6, 4, 6);
        b.box(VC.glow, hdr('#ffcf8a', 2.5), tx - 3.02, ty + 2.4, z, 0.04, 1.2, 3);
        const car = new THREE.Group();
        const body = new THREE.Mesh(G.box, std({ color: '#b3202c', roughness: 0.5 }));
        body.scale.set(3, 2.2, 2.4); car.add(body);
        const win = new THREE.Mesh(G.box, basic({ color: hdr('#ffe0a8', 2.6) }));
        win.scale.set(3.05, 0.7, 2.45); win.position.y = 0.3; car.add(win);
        car.rotation.z = a * 0.35;
        car.userData = { z, a, x0, L, ph: Math.random() * 10 };
        animated.push(car);
        b._extras = (b._extras || []).concat(car);
      }
    };

    const steelMill = (b) => {
      const x = rand(26, 34), z = -rand(20, 60);
      b.cyl(VC.metal, '#4a3328', x, 11, z, 4.5, 22);
      b.cyl(VC.metal, '#2e221d', x, 23, z, 3, 3);
      b.box(VC.glow, hdr('#ff6a00', 4), x - 4.4, 3, z, 0.3, 3, 3.5);
      for (const [dx, dz, h] of [[9, 10, 34], [12, -8, 28], [5, -16, 38]]) {
        b.cyl(VC.metal, '#3a2b25', x + dx, h / 2, z + dz, 1.3, h);
        b.cyl(VC.glow, hdr('#ff7a1a', 3.5), x + dx, h + 0.2, z + dz, 1.35, 0.5);
        for (let k = 0; k < 4; k++) b.sph(VC.glowAdd, hdr('#ffb38a', 0.05), x + dx + k * 1.5, h + 2 + k * 2.4, z + dz + k, 1.4 + k * 0.9);
      }
      b.add(G.box, VC.metal, x - 8, 9, z + 6, 22, 1.4, 1.6, 0, 0.2, 0.5, '#2b2320');
      for (let k = 0; k < 5; k++) b.cyl(VC.metal, '#5a3a2a', x - 2 + k * 0.1, 6 + k * 3, z - 5, 0.4, 14, 'cyl8', 0, Math.PI / 2);
      buildingRow(b, 1, [{ mat: millMat, tex: mill, colors: ['#ffffff', '#c9b7a8'], w: [10, 18], h: [8, 14], cellW: 2.4, cellH: 3 }], { x0: 12, depth: [8, 12], z0: 0, z1: CHUNK_LEN });
    };

    const bridge = (b, zFix) => {
      const z = zFix ?? -rand(18, 60), y = 10.5, xl = -120, xr = 26;
      b.box(VC.metal, GOLD, (xl + xr) / 2, y, z, xr - xl, 0.9, 8);
      b.box(VC.solid, '#2b2620', (xl + xr) / 2, y + 0.5, z, xr - xl, 0.12, 7.4);
      for (const s of [-1, 1]) {
        b.box(VC.metal, GOLD, (xl + xr) / 2, y + 1.6, z + s * 3.9, xr - xl, 0.25, 0.3);
        for (let x = xl; x < xr; x += 4) b.add(G.box, VC.metal, x + 2, y + 0.9, z + s * 3.9, 0.18, 2.6, 0.18, 0, 0, (x / 4) % 2 ? 0.75 : -0.75, GOLD);
      }
      for (let x = -12; x <= 10; x += 3.5) b.box(VC.glow, hdr('#ffe0a8', 3), x, y - 0.5, z, 0.5, 0.08, 0.5);
      for (const tx of [-34, -86]) {
        for (const s of [-1, 1]) b.box(VC.metal, GOLD, tx, y + 9 - 6, z + s * 3.9, 1.2, 30, 1.2);
        b.box(VC.metal, GOLD, tx, y + 19, z, 1.2, 1.2, 9);
      }
      for (const s of [-1, 1]) {
        const pts = [];
        for (let k = 0; k <= 30; k++) { const t = k / 30, x = xl + 6 + (xr - xl - 10) * t; pts.push([x, y + 3 + 15 * Math.pow((x - (-60)) / 66, 2)]); }
        for (let k = 0; k < pts.length - 1; k++) {
          const [x1, y1] = pts[k], [x2, y2] = pts[k + 1];
          if (y1 > y + 19 || y2 > y + 19) continue;
          b.add(G.box, VC.metal, (x1 + x2) / 2, (y1 + y2) / 2, z + s * 3.9, Math.hypot(x2 - x1, y2 - y1) + 0.1, 0.22, 0.22, 0, 0, Math.atan2(y2 - y1, x2 - x1), GOLD);
          if (k % 2 === 0 && y1 > y + 2) b.box(VC.metal, GOLD, x1, (y1 + y + 1.6) / 2, z + s * 3.9, 0.08, y1 - y - 1.6, 0.08);
        }
        for (let x = xl + 8; x < xr; x += 9) b.sph(VC.glow, hdr('#fff1c4', 3), x, y + 1.9, z + s * 3.9, 0.22, true);
      }
      for (const s of [-1, 1]) b.box(VC.solid, '#6a5a4a', s > 0 ? xr + 3 : -18, y / 2, z, 4, y, 7);
    };

    const decor = () => {
      const b = new Batcher();
      riverSide(b);
      // right side
      for (let z = rand(5, 12); z < CHUNK_LEN; z += 21) lamp(b, EDGE + 1.6, -z, 1, { light: '#ffb35c', k: 3.4, h: 5 });
      if (chance(0.62)) {
        buildingRow(b, 1, [{ mat: brickMat, tex: brick, colors: ['#ffffff', '#e2c3ad', '#c99a7c', '#a87a62'], w: [8, 15], h: [7, 14], cellW: 2.3, cellH: 3,
          roof: (bb, i) => { if (chance(0.4)) bb.cyl(VC.metal, '#3a2b25', i.x, i.h + 4, i.z, 0.6, 8); } }], { x0: 11, depth: [7, 10] });
        hillSide(b);
      } else steelMill(b);
      if (chance(0.38)) bridge(b);
      const g = b.build();
      if (b._extras) b._extras.forEach((e) => g.add(e));
      return g;
    };

    // ---------- landmarks ----------
    const office = windowTex({ wall: '#2a2e38', glass: '#2c3a50', lit: ['#ffe0b0', '#cfe6ff'], litChance: 0.4, band: true });
    const officeMat = facadeMat(office, { k: 0.8, rough: 0.3, metal: 0.5 });
    const steelMat = std({ color: '#4a3026', roughness: 0.55, metalness: 0.6, emissive: '#1a0d08', emissiveIntensity: 0.4 });
    const upmcTex = textTex('UPMC', { color: '#ffffff', glow: '#7fc4ff', size: 0.72 });
    const upmcMat = basic({ map: upmcTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: hdr('#e8f4ff', 2.2) });
    const ppgGlass = std({ color: '#1c2638', metalness: 0.95, roughness: 0.08, emissive: '#0c1a33', emissiveIntensity: 0.6 });
    const cathTex = windowTex({ wall: '#b3a68e', glass: '#1d1914', lit: ['#ffd9a0', '#ffcf8a', '#fff0c2'], litChance: 0.5, frame: '#8a7c66' });
    const cathMat = facadeMat(cathTex, { k: 0.85 });
    const cmuTex = windowTex({ wall: '#c9a77a', glass: '#1a1410', lit: ['#ffd9a0', '#ffe8c0'], litChance: 0.45, arch: true, frame: '#e8d6b0', cols: 6 });
    const cmuMat = facadeMat(cmuTex, { k: 0.8 });
    const fenceMat = std({ roughness: 0.45, metalness: 0.05, map: canvasTex(1024, 160, (g, w, h) => {
      const cols = ['#e8253f', '#ffd23d', '#2f6bff', '#14c7a5', '#ff7ac6', '#7a5cff', '#ffffff', '#ff8a2a'];
      g.fillStyle = pick(cols); g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { g.fillStyle = pick(cols); g.beginPath(); g.ellipse(rand(0, w), rand(0, h), rand(20, 90), rand(14, 50), rand(0, 3), 0, 7); g.fill(); }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      ['TARTANS', 'CMU', 'BUGGY', 'CARNIVAL', 'SCS'].forEach((t, i) => {
        const x = 90 + i * 210 + rand(-20, 20), y = h / 2 + rand(-25, 25);
        g.font = `900 ${randi(46, 70)}px "Russo One", Impact, sans-serif`;
        g.lineWidth = 10; g.strokeStyle = '#111'; g.strokeText(t, x, y);
        g.fillStyle = pick(cols); g.fillText(t, x, y);
      });
      for (let i = 0; i < 30; i++) { g.fillStyle = pick(cols); g.fillRect(rand(0, w), rand(h * 0.55, h), 4, rand(10, 40)); }
    }) });
    const tartan = std({ roughness: 0.8, side: THREE.DoubleSide, map: canvasTex(64, 128, (g, w, h) => {
      g.fillStyle = '#9e1b25'; g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.55; g.fillStyle = '#141414';
      for (let x = 0; x < w; x += 32) g.fillRect(x + 8, 0, 12, h);
      for (let y = 0; y < h; y += 32) g.fillRect(0, y + 8, w, 12);
      g.globalAlpha = 0.8; g.fillStyle = '#e9e3d0';
      for (let x = 0; x < w; x += 32) g.fillRect(x + 25, 0, 2, h);
      for (let y = 0; y < h; y += 32) g.fillRect(0, y + 25, w, 2);
    }) });
    const cmuSign = std({ roughness: 0.8, emissive: '#ffffff', emissiveIntensity: 0.35,
      map: textTex('CARNEGIE MELLON UNIVERSITY', { w: 1024, h: 128, color: '#f2efe6', bg: '#3a3833', font: 'Georgia, "Times New Roman", serif', weight: 700, size: 0.42 }),
      emissiveMap: textTex('CARNEGIE MELLON UNIVERSITY', { w: 1024, h: 128, color: '#ffffff', bg: '#000000', font: 'Georgia, "Times New Roman", serif', weight: 700, size: 0.42 }) });
    const jets = [];

    const riverSide = (b, barge = true) => {
      b.add(G.plane, water, -80, -1.4, -CHUNK_LEN / 2, 150, CHUNK_LEN + 0.5, 1, -Math.PI / 2);
      b.box(VC.solid, '#6f665c', -(EDGE + 3.2), -0.7, -CHUNK_LEN / 2, 0.8, 1.6, CHUNK_LEN);
      b.box(VC.solid, '#4b4540', -(EDGE + 1.6), -0.04, -CHUNK_LEN / 2, 3.2, 0.1, CHUNK_LEN);
      for (let z = 0; z < CHUNK_LEN; z += 2.5) b.box(VC.metal, '#1f1f22', -(EDGE + 3.1), 0.6, -z, 0.08, 1.2, 0.08);
      b.box(VC.metal, '#1f1f22', -(EDGE + 3.1), 1.15, -CHUNK_LEN / 2, 0.1, 0.1, CHUNK_LEN);
      for (let z = rand(3, 9); z < CHUNK_LEN; z += 19) lamp(b, -(EDGE + 2.6), -z, -1, { light: '#ffb35c', k: 3.4, h: 5 });
      if (barge && chance(0.3)) {
        const z = -rand(10, 70), x = -rand(20, 40);
        b.block(VC.solid, '#2b2b30', x, -1.5, z, 7, 1.6, 22);
        for (let k = -2; k <= 2; k++) b.sph(VC.glow, hdr('#ff7a1a', 2.6), x, 0.3, z + k * 4, 1.6, true);
      }
    };
    const figure = (b, x, y, z, c, s = 1.15) => {
      b.box(VC.solid, '#2a2a32', x, y + 0.45 * s, z, 0.32 * s, 0.9 * s, 0.24 * s);
      b.box(VC.solid, c, x, y + 1.25 * s, z, 0.46 * s, 0.7 * s, 0.28 * s);
      b.sph(VC.solid, '#d9b08c', x, y + 1.78 * s, z, 0.17 * s, true);
    };

    const usSteel = (b, x, z) => {
      const H = 98, R = 14;
      const tri = new THREE.CylinderGeometry(R, R, H, 3); tri.translate(0, H / 2, 0);
      b.addM(tri, steelMat, at(x, 0, z));
      const band = new THREE.CylinderGeometry(R + 0.12, R + 0.12, 0.45, 3, 1, true);
      for (let y = 5; y < H - 12; y += 3.6) b.addM(band, VC.glow, at(x, y, z), hdr(chance(0.8) ? '#ffcf8a' : '#cfe6ff', rand(0.35, 0.95)));
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * Math.PI * 2;
        b.box(VC.metal, '#2a1a14', x + Math.sin(a) * R * 0.97, H / 2, z + Math.cos(a) * R * 0.97, 2.2, H, 2.2);
        b.sph(VC.glow, hdr('#ff2a2a', 5), x + Math.sin(a) * R, H + 1, z + Math.cos(a) * R, 0.5, true);
        const c = (i + 0.5) / 3 * Math.PI * 2;
        b.add(G.plane, upmcMat, x + Math.sin(c) * (R / 2 + 0.4), H - 7, z + Math.cos(c) * (R / 2 + 0.4), 19, 4.8, 1, 0, c);
      }
    };
    const ppg = (b, x, z) => {
      const tower = (cx, cz, w, h) => {
        b.add(G.box, ppgGlass, cx, h / 2, cz, w, h, w);
        for (let k = -2; k <= 2; k++) {
          b.box(VC.glow, hdr('#9fd0ff', 0.9), cx - w / 2 - 0.03, h / 2, cz + k * w / 5, 0.06, h, 0.12);
          b.box(VC.glow, hdr('#9fd0ff', 0.9), cx + k * w / 5, h / 2, cz + w / 2 + 0.03, 0.12, h, 0.06);
        }
        b.add(G.cone4, ppgGlass, cx, h + w * 0.45, cz, w * 0.9, w * 0.9, w * 0.9);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          b.add(G.cone4, ppgGlass, cx + sx * w * 0.42, h + 2.5, cz + sz * w * 0.42, 1.2, 5, 1.2);
          for (let k = 1; k < 3; k++) b.add(G.cone4, ppgGlass, cx + sx * w * 0.42 * (1 - k * 0.33), h + 1.6, cz + sz * w * 0.42, 0.7, 3.2, 0.7);
        }
        b.box(VC.glow, hdr('#bfe3ff', 1.6), cx, h + 0.1, cz, w + 0.2, 0.15, w + 0.2);
      };
      tower(x, z, 12, 66);
      tower(x + 15, z + 3, 8, 30); tower(x + 1, z - 16, 8, 26); tower(x + 15, z - 16, 8, 28);
      b.addM(DISC, VC.glow, new THREE.Matrix4().makeScale(11, 1, 11).setPosition(x + 8, 0.06, z - 7), hdr('#bfe8ff', 0.45));
      b.add(G.cone8, VC.solid, x + 8, 3, z - 7, 3.4, 6, 3.4, 0, 0, 0, '#1f5a34');
      b.sph(VC.glow, hdr('#ffd23d', 3), x + 8, 6.2, z - 7, 0.3, true);
    };
    const downtown = () => {
      const b = new Batcher();
      riverSide(b, false);
      bridge(b, -8);
      ppg(b, 22, -24);
      usSteel(b, 31, -63);
      const towers = [{ mat: officeMat, tex: office, colors: ['#ffffff', '#c9d6ff', '#e2c3ad'], w: [6, 9], h: [20, 34], cellW: 1.4, cellH: 2.8 }];
      buildingRow(b, 1, towers, { x0: 11, depth: [6, 8], z0: 0, z1: 14 });
      for (let z = 5; z < CHUNK_LEN; z += 18) lamp(b, EDGE + 1.6, -z, 1, { light: '#ffe0b0', k: 3.4, h: 5 });
      people(b, EDGE + 1.2, EDGE + 6.4, 2, CHUNK_LEN - 2, 16);
      return b.build();
    };

    const cathedral = (b, x, z) => {
      const tiers = [[34, 26, 0, 22], [24, 20, 22, 70], [18, 15, 70, 92], [11, 10, 92, 101]];
      for (const [w, d, y0, y1] of tiers) {
        b.addM(buildingGeo(w, y1 - y0, d, cathTex, 1.0, 2.6), cathMat, at(x, y0, z), '#ffffff');
        for (let k = -2; k <= 2; k++) b.box(VC.solid, '#cdbfa6', x + w / 2 + 0.25, (y0 + y1) / 2, z + k * d / 5.5, 0.5, y1 - y0, 0.6);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(G.cone4, VC.solid, x + sx * w / 2, y1 + 2, z + sz * d / 2, 1.3, 4, 1.3, 0, 0, 0, '#b9ab92');
      }
      b.add(G.cone4, VC.solid, x, 105, z, 7, 8, 7, 0, 0, 0, '#9a8c76');
      b.add(G.cone, VC.glowAdd, x + 18, 30, z, 14, 60, 14, 0, 0, 0.25, hdr('#ffd9a0', 0.05));
    };
    const hamerschlag = (b, x, z) => {
      b.add(G.sphLow, VC.solid, x + 6, -6, z, 44, 20, 54, 0, 0, 0, '#2f5a2a');
      const y0 = 3.2, rx = x - 1;
      b.addM(buildingGeo(12, 11, 30, cmuTex, 2.2, 3.1), cmuMat, at(x + 5, y0, z), '#ffffff');
      b.add(G.box, VC.solid, x + 5, y0 + 11.5, z, 13, 1, 31, 0, 0, 0, '#5fa08a');
      b.cyl(VC.solid, '#d4b88a', rx, y0 + 8, z, 6, 16);
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; b.cyl(VC.solid, '#efe2c4', rx + Math.cos(a) * 6.7, y0 + 14.5, z + Math.sin(a) * 6.7, 0.32, 7); }
      b.cyl(VC.solid, '#e3d3b0', rx, y0 + 18.6, z, 7.4, 1.3);
      b.cyl(VC.glow, hdr('#ffd9a0', 1.6), rx, y0 + 17.8, z, 6.1, 0.3);
      b.cyl(VC.solid, '#d4b88a', rx, y0 + 20.7, z, 5, 3);
      b.add(G.sph, VC.solid, rx, y0 + 22.2, z, 9, 6, 9, 0, 0, 0, '#5fa08a');
      b.cyl(VC.solid, '#efe2c4', rx, y0 + 25.6, z, 1, 2);
      b.cyl(VC.metal, '#c9ced8', rx, y0 + 29, z, 0.08, 5);
      for (let k = 0; k < 7; k++) { const a = Math.PI + (k - 3) * 0.26; b.add(G.box, VC.glow, rx + Math.cos(a) * 6.04, y0 + 7, z + Math.sin(a) * 6.04, 0.1, 3, 0.9, 0, -a, 0, hdr('#ffd9a0', 1.3)); }
    };
    const walkingSky = (b, x, z) => {
      const L = 34, a = 0.55;
      b.add(G.cyl, VC.metal, x - Math.sin(a) * L / 2, Math.cos(a) * L / 2, z, 0.55, L, 0.55, 0, 0, a, '#c9ced8');
      b.block(VC.solid, '#6a6a70', x, 0, z, 3, 0.4, 3);
      const cols = ['#e8253f', '#2f6bff', '#ffd23d', '#14c7a5', '#ff7ac6', '#f4f4f8', '#7a5cff', '#ff8a2a'];
      for (let k = 0; k < 8; k++) { const t = 0.14 + k * 0.105; figure(b, x - Math.sin(a) * L * t, Math.cos(a) * L * t + 0.3, z, cols[k]); }
      for (let k = 0; k < 4; k++) figure(b, x + 2 + k * 1.2, 0, z + (k % 2 ? 2 : -2), cols[(k + 3) % 8], 1.05);
    };
    const scotty = (b, x, z, s = 1.6) => {
      b.block(VC.solid, '#7a746a', x, 0, z, 2.6 * s, 1.2 * s, 1.6 * s);
      const y = 1.2 * s, K = '#121214';
      b.box(VC.solid, K, x, y + 0.75 * s, z, 1.7 * s, 0.8 * s, 0.75 * s);
      for (const dx of [-0.6, 0.6]) for (const dz of [-0.24, 0.24]) b.box(VC.solid, K, x + dx * s, y + 0.25 * s, z + dz * s, 0.26 * s, 0.5 * s, 0.24 * s);
      b.box(VC.solid, K, x - 1.0 * s, y + 1.3 * s, z, 0.7 * s, 0.65 * s, 0.6 * s);
      b.box(VC.solid, K, x - 1.45 * s, y + 1.1 * s, z, 0.4 * s, 0.35 * s, 0.4 * s);
      b.box(VC.solid, '#26262a', x - 1.42 * s, y + 0.88 * s, z, 0.36 * s, 0.25 * s, 0.38 * s);
      for (const dz of [-0.18, 0.18]) b.add(G.cone4, VC.solid, x - 0.95 * s, y + 1.82 * s, z + dz * s, 0.24 * s, 0.45 * s, 0.24 * s, 0, 0, 0, K);
      b.add(G.box, VC.solid, x + 0.95 * s, y + 1.3 * s, z, 0.15 * s, 0.6 * s, 0.15 * s, 0, 0, -0.4, K);
      b.box(VC.solid, '#b3202c', x - 0.62 * s, y + 1.02 * s, z, 0.24 * s, 0.5 * s, 0.82 * s);
    };
    const fence = (b, x, d0, d1) => {
      for (let d = d0; d <= d1; d += 2.2) b.add(G.box, fenceMat, x, 0.95, -d, 0.34, 1.9, 0.34);
      for (const y of [0.55, 1.05, 1.55]) b.add(G.box, fenceMat, x, y, -(d0 + d1) / 2, 0.24, 0.3, d1 - d0);
      b.add(G.plane, fenceMat, x - 0.2, 1.05, -(d0 + d1) / 2, d1 - d0, 1.5, 1, 0, -Math.PI / 2);
    };
    const gates = (b, x, z) => {
      b.box(VC.solid, '#9aa0a8', x, 7, z, 16, 14, 12);
      b.add(G.box, VC.solid, x + 2, 18.5, z - 1, 13, 9, 14, 0, -0.22, 0, '#7f868f');
      for (let k = 0; k < 8; k++) b.add(G.box, VC.glow, x - 8.05, 7, z - 5.2 + k * 1.5, 0.05, 15, 0.3, 0.5, 0, 0, hdr('#cfe6ff', 0.9));
    };
    const cmu = () => {
      const b = new Batcher();
      b.box(VC.solid, '#2f4a2c', -(EDGE + 7 + 45), -0.15, -CHUNK_LEN / 2, 90, 0.2, CHUNK_LEN);
      for (let k = 0; k < 18; k++) tree(b, -rand(13, 42), -rand(2, 78), { leaf: pick(['#c4622d', '#e0a030', '#9a5a2a', '#7a8a3a', '#b8452a']), trunk: '#3a2a20', s: rand(1, 1.6) });
      cathedral(b, -50, -62);
      b.box(VC.solid, '#355a2e', EDGE + 7 + 30, -0.08, -CHUNK_LEN / 2, 60, 0.12, CHUNK_LEN);
      fence(b, EDGE + 2.8, 4, 24);
      walkingSky(b, 21, -36);
      scotty(b, 15, -48);
      hamerschlag(b, 30, -66);
      gates(b, 47, -74);
      buildingRow(b, 1, [{ mat: cmuMat, tex: cmuTex, colors: ['#ffffff', '#e8d6b8'], w: [8, 12], h: [8, 11], cellW: 2.2, cellH: 3.1,
        roof: (bb, i) => bb.add(G.box, VC.solid, i.x, i.h + 0.6, i.z, i.d + 0.6, 1.2, i.len + 0.6, 0, 0, 0, '#5fa08a') }], { x0: 12, depth: [8, 10], z0: 0, z1: 16 });
      b.block(VC.solid, '#5a5650', EDGE + 3.8, 0, -34, 0.8, 1.6, 9);
      b.add(G.plane, cmuSign, EDGE + 3.8 - 0.42, 0.85, -34, 8.4, 1.05, 1, 0, -Math.PI / 2);
      for (const side of [-1, 1]) for (let z = 6; z < CHUNK_LEN; z += 16) {
        const x = side * (EDGE + 1.6);
        lamp(b, x, -z, side, { light: '#ffe0b0', k: 3.2, h: 5 });
        b.add(G.plane, tartan, x - side * 0.4, 3.5, -z, 0.7, 1.7, 1, 0, -side * Math.PI / 2);
      }
      people(b, EDGE + 1.2, EDGE + 6.4, 2, CHUNK_LEN - 2, 14);
      return b.build();
    };

    const point = () => {
      const b = new Batcher();
      riverSide(b, false);
      const fx = -32, fz = -44;
      b.cyl(VC.solid, '#8d877c', fx, -0.9, fz, 12, 1.4);
      b.cyl(VC.solid, '#24405a', fx, -0.6, fz, 11.2, 1.4);
      b.addM(DISC, VC.glowAdd, new THREE.Matrix4().makeScale(22, 1, 22).setPosition(fx, 0.15, fz), hdr('#9fd8ff', 0.3));
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; b.add(G.cone, VC.glow, fx + Math.cos(a) * 9.5, 1.6, fz + Math.sin(a) * 9.5, 0.4, 3.2, 0.4, 0, 0, 0, hdr('#dff4ff', 1.6)); }
      b.box(VC.solid, '#3a4a2a', 22, -0.08, -CHUNK_LEN / 2, 22, 0.12, CHUNK_LEN);
      const blk = new THREE.CylinderGeometry(3.2, 3.2, 3.4, 5); blk.translate(0, 1.7, 0);
      b.addM(blk, VC.solid, at(17, 0, -22), '#8a4a32');
      b.add(new THREE.ConeGeometry(3.8, 1.8, 5), VC.solid, 17, 4.3, -22, 1, 1, 1, 0, 0, 0, '#3a2a28');
      buildingRow(b, 1, [{ mat: officeMat, tex: office, colors: ['#ffffff', '#c9d6ff'], w: [12, 18], h: [30, 64], cellW: 1.4, cellH: 2.8 }], { x0: 30, depth: [10, 14] });
      bridge(b, -68);
      for (let k = 0; k < 6; k++) {
        const x = -104 - (k % 3) * 9, z = -14 - k * 9;
        b.cyl(VC.metal, '#3a3a40', x, 14, z, 0.4, 28);
        b.box(VC.glow, hdr('#ffffff', 4), x, 28.6, z, 3.4, 1.6, 0.5);
        b.add(G.cone, VC.glowAdd, x + 6, 18, z, 9, 22, 9, 0, 0, -0.9, hdr('#eaf4ff', 0.04));
      }
      b.add(G.cyl, VC.solid, -112, 3, -36, 40, 6, 52, 0, 0, 0, '#2a2a30');
      b.addM(DISC, VC.glow, new THREE.Matrix4().makeScale(30, 1, 40).setPosition(-112, 6.1, -36), hdr('#3fa34d', 0.6));
      const g = b.build();
      const jet = new THREE.Mesh(G.cyl, basic({ color: hdr('#e6f6ff', 2.2), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
      jet.position.set(fx, 15, fz); jet.scale.set(1.4, 30, 1.4);
      const crown = new THREE.Mesh(G.sph, basic({ color: hdr('#cfeeff', 0.5), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
      crown.position.set(fx, 30, fz); crown.scale.setScalar(7);
      g.add(jet, crown); jets.push({ jet, crown });
      return g;
    };

    const upmcSky = new THREE.MeshBasicMaterial({ map: upmcTex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, color: hdr('#e8f4ff', 2) });
    const glassPPG = new THREE.MeshBasicMaterial({ color: hdr('#2c3550', 1), fog: false });
    const sky = skyline({
      tex: skyTex({ wall: '#1b1220', lit: ['#ffcf8a', '#ffe9c4'], chance: 0.22 }),
      colors: ['#e2b9a8', '#c9928a', '#b07f7f'], count: 50, r: [600, 820], h: [30, 120], k: 1.3, gapAhead: 0.25,
      landmarks: [
        (b) => { // hills ring
          for (let i = 0; i < 46; i++) {
            const deg = i * 360 / 46 + rand(-3, 3);
            const [x, z] = polar(deg, rand(520, 640));
            b.add(G.sphLow, SKY_VC, x, -95, z, rand(160, 260), rand(110, 190), rand(120, 200), 0, 0, 0, pick(['#4a2a3e', '#3e2438', '#55304a']));
          }
        },
        (b, mat) => { // downtown across the river
          const towers = [[-14, 690, 26, 150], [-8, 720, 30, 210], [-3, 700, 22, 120], [4, 710, 28, 170], [9, 690, 20, 110], [-20, 700, 18, 100], [13, 720, 24, 140]];
          towers.forEach(([deg, r, w, h]) => { const [x, z, ry] = polar(deg, r); b.addM(buildingGeo(w, h + 95, w * 0.8, { cols: 8, rows: 16 }, 3.4, 4.2), mat, at(x, -95, z, ry), '#ffffff'); });
          { // US Steel tower (triangular)
            const [x, z, ry] = polar(-8, 760);
            const g = new THREE.CylinderGeometry(26, 26, 360, 3); g.translate(0, 180 - 95, 0);
            b.addM(g, SKY_VC, at(x, 0, z, ry), '#3a2a2c');
            for (let y = -60; y < 260; y += 22) b.add(G.cyl6, SKY_VC, x, y, z, 52.5, 1.2, 52.5, 0, ry, 0, hdr('#ffcf8a', 0.9));
            b.add(G.plane, upmcSky, x * (1 - 28 / 760), 250, z * (1 - 28 / 760), 44, 11, 1, 0, ry, 0);
          }
          { // PPG Place: glass gothic spires
            const [x, z, ry] = polar(4, 650);
            for (let i = 0; i < 9; i++) {
              const dx = (i % 3 - 1) * 12, dz = (Math.floor(i / 3) - 1) * 12, h = i === 4 ? 230 : rand(140, 190);
              b.add(G.box, glassPPG, x + dx, (h - 95) / 2 - 95 / 2, z + dz, 10, h, 10, 0, ry, 0, 0xffffff);
              b.add(G.cone4, SKY_VC, x + dx, h - 95 + 9, z + dz, 10, 18, 10, 0, ry, 0, '#2c3550');
              b.add(G.box, SKY_VC, x + dx, h - 95 + 0.5, z + dz, 10.4, 1, 10.4, 0, ry, 0, hdr('#bfe3ff', 2.4));
            }
          }
          { // Gulf Tower with weather beacon
            const [x, z, ry] = polar(-18, 720);
            b.addM(buildingGeo(28, 200, 26, { cols: 8, rows: 16 }, 3.4, 4.2), mat, at(x, -95, z, ry), '#ffffff');
            b.add(G.cone4, SKY_VC, x, 125, z, 28, 30, 26, 0, ry, 0, hdr('#ff3a3a', 2.6));
          }
        },
        (b) => { // Cathedral of Learning
          const [x, z, ry] = polar(38, 680);
          [[46, 120], [36, 210], [26, 270], [16, 300]].forEach(([w, top], i, arr) => {
            const prev = i ? arr[i - 1][1] : -95;
            b.add(G.box, SKY_VC, x, (top + prev) / 2, z, w, top - prev, w, 0, ry, 0, '#5a4a48');
            b.add(G.box, SKY_VC, x, top, z, w + 1, 1.4, w + 1, 0, ry, 0, hdr('#ffd9a0', 2.2));
          });
        },
        (b) => { // three sister bridges far ahead
          for (let i = 0; i < 3; i++) {
            const [x, z, ry] = polar(-30 + i * 6, 590 + i * 30);
            b.add(G.box, SKY_VC, x, -30, z, 110, 3, 6, 0, ry, 0, hdr(GOLD, 1.3));
            for (let k = 0; k < 14; k++) {
              const t = k / 13 - 0.5;
              b.add(G.sph, SKY_VC, x + Math.cos(ry) * t * 100, -24 + 18 * (1 - 4 * t * t), z - Math.sin(ry) * t * 100, 2, 2, 2, 0, 0, 0, hdr('#fff1c4', 3));
            }
          }
        },
      ],
    });

    const trainStyle = {
      body: '#1c1c21', bodyMetal: true, roof: '#2b2b30', under: '#121214', stripe: GOLD, stripe2: GOLD, ribs: true, ribColor: '#2a2a30',
      window: '#ffd9a0', windowK: 1.7, frame: '#0e0e10', light: '#fff1c4', sign: GOLD, badge: GOLD, roofUnit: '#3a3a40',
      rampMat: std({ map: stripeTex('#141414', GOLD, 6), roughness: 0.6 }), rampGlow: '#ffb347',
      extra: (b, c) => {
        if (!c.moving) return;
        for (const s of [-1, 1]) b.box(VC.glow, hdr('#ff6a00', 3.2), s * 1.17, 0.62, c.z0 - c.len / 2, 0.03, 0.12, c.len - 1);
      },
    };
    const barrier = barrierStyle({ c1: GOLD, c2: '#141414', label: 'CAUTION', signBg: GOLD, signFg: '#141414', glow: '#ffb347', post: '#2b2b30' });

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: [
        { name: 'UPMC 钢铁大楼 · PPG Place', en: 'DOWNTOWN PITTSBURGH', build: downtown },
        { name: '卡内基梅隆大学', en: 'CARNEGIE MELLON UNIVERSITY', build: cmu },
        { name: '三河交汇 · 尖角公园', en: 'POINT STATE PARK', build: point },
      ],
      coinGeo: coinGeometry('nut'), coinMat: coinMaterial('#ffcf3a', '#ff8a00'),
      update(t) {
        for (const { jet, crown } of jets) {
          const k = 1 + Math.sin(t * 1.7) * 0.08 + Math.sin(t * 5.3) * 0.03;
          jet.scale.set(1.4 + Math.sin(t * 9) * 0.1, 30 * k, 1.4); jet.position.y = 15 * k;
          crown.position.y = 30 * k; crown.scale.setScalar(6.5 + Math.sin(t * 3.1) * 0.8);
        }
        water.userData.scroll.offset.set(t * 0.01, t * 0.03);
        for (const car of animated) {
          const u = car.userData, s = (Math.sin(t * 0.12 + u.ph) * 0.5 + 0.5) * u.L * 0.8 + u.L * 0.05;
          car.position.set(u.x0 + Math.cos(u.a) * s, Math.sin(u.a) * s + 1.4, u.z);
        }
      },
    };
  },
};
