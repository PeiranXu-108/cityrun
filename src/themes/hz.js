// Hangzhou: misty blue-hour West Lake, white-wall black-tile houses, lanterns, pagodas, Fuxing bullet trains.
// The run goes round a loop of three stretches: West Lake's streets (now with their vendors, kiosks and newsstands), the
// plane-tree avenue of Beishan Street, and the Qiantang at Qianjiang New City, where the towers of both banks play the
// light show (hz_kit.js, hz_show.js, hz_landmarks.js); then back through the avenue to the lake.
import { THREE, Batcher, VC, G, std, basic, hdr, windowTex, stripeTex, buildingGeo, canvasTex,
  CHUNK_LEN, rand, randi, pick, chance, clamp, smooth } from '../core.js';
import { barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { treeKit, wutongKit } from './trees.js';
import { makeTrack, facadeMat, lamp, skyline, skyTex, SKY_VC, polar, at, EDGE, DISC, waterMat, screenMat, screenTint, people, RING } from './common.js';
import { makeKit, GLYPHS as KIT_GLYPHS, SIGN } from './hz_kit.js';
import { makeShow } from './hz_show.js';
import { hzLandmarks } from './hz_landmarks.js';

const RED = '#d7262e', TILE = '#2b2f36', WALL = '#d6d1c4';
const SIGNS = ['龙井茶', '酒', '客栈', '丝绸', '面馆', '西湖', '河坊街', '茶', '药铺', '书局'];
// every character the city's canvases draw (main.js loads them before the textures are painted)
export const GLYPHS = [...new Set(KIT_GLYPHS + SIGNS.join('') + '西湖断桥苏堤灵隐钱塘最忆是杭州亚运')].join('');

// The loop, chunk by chunk (each landmark heads four chunks, ROUTE gives their order): West Lake, the avenue on its lake
// side and its city side, the Qiantang, the avenue again. The run starts at the Three Pools.
const ROUTE = ['santan', 'leifeng', 'balcony', 'qianjiang', 'lightshow'];
const ZONES = ['lake', 'lake', 'lake', 'lake', 'lake', 'lake', 'avenueL', 'avenueR',
  'river', 'river', 'river', 'river', 'river', 'river', 'river', 'river', 'river', 'river', 'avenueR', 'avenueL'];

// vertical shop-sign atlas (dark lacquer boards with gold characters)
function verticalSigns() {
  const cw = 128, ch = 384, cols = SIGNS.length;
  const tex = canvasTex(cw * cols, ch, (g) => {
    SIGNS.forEach((s, i) => {
      const x = i * cw;
      g.fillStyle = i % 3 === 0 ? '#7a1b1b' : '#2a1a12'; g.fillRect(x + 8, 6, cw - 16, ch - 12);
      g.strokeStyle = '#c9a227'; g.lineWidth = 6; g.strokeRect(x + 16, 14, cw - 32, ch - 28);
      g.fillStyle = '#ffd77a'; g.shadowColor = '#ffb347'; g.shadowBlur = 10;
      g.font = '900 72px "Ma Shan Zheng", "STKaiti", "KaiTi", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const chars = [...s], step = Math.min(96, (ch - 60) / chars.length);
      chars.forEach((c, k) => g.fillText(c, x + cw / 2, ch / 2 + (k - (chars.length - 1) / 2) * step));
      g.shadowBlur = 0;
    });
  }, { repeat: false });
  const rects = SIGNS.map((_, i) => ({ u0: i / cols, u1: (i + 1) / cols, v0: 0, v1: 1 }));
  return { tex, rects };
}

function plaqueTex(text) {
  return canvasTex(512, 160, (g, w, h) => {
    g.fillStyle = '#1d2f4a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d9b44a'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#ffd77a'; g.shadowColor = '#ffb347'; g.shadowBlur = 14;
    g.font = '900 96px "Ma Shan Zheng", "STKaiti", "KaiTi", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 4);
  }, { repeat: false });
}

export default {
  id: 'hz', name: '杭州', en: 'HANGZHOU', tagline: '人间天堂 · 西湖烟雨',
  blurb: '暮色里的西湖，红灯笼、白墙黛瓦，复兴号从湖边疾驰而过。湖边有糖画摊、卖莲蓬的阿婆、葱包桧和定胜糕的小车、灰色的小商亭、墨绿色的报刊亭和成排的小红车，三潭映月的烛光、雷峰塔和断桥一路相伴；穿过北山街两侧树冠合拢的梧桐大道，来到钱塘江边的钱江新城：城市阳台悬在江上，金球与新月形的大剧院“日月同辉”，两岸几十栋高楼连成一幅灯光秀，倒映在江面上，再沿着梧桐大道回到西湖。',
  sights: ['三潭映月', '雷峰塔 · 断桥', '北山街 · 梧桐大道', '城市阳台', '钱江新城 金球 · 大剧院', '钱江灯光秀'],
  accent: '#ff5a6e', accent2: '#ffd77a', portal: '#ff5a6e',
  sky: { top: '#0c1d3d', mid: '#3a6a8a', bot: '#f0b3ae', glow: '#ff9aa8', glowK: 0.4, sun: '#fff4dc',
    sunDir: [0.32, 0.22, -1], sunSize: 0.005, sunK: 1.1, moon: true, cloud: 0.35, cloudColor: '#6f8aa8', horizon: -0.08, stars: true },
  fog: { color: '#5d7c93', near: 22, far: 235 },
  light: { hemiSky: '#bcd8ff', hemiGround: '#2a3a3a', hemi: 0.8, dir: '#ffd9c4', dirK: 0.95, dirPos: [0.4, 0.8, -0.6] },
  exposure: 0.95, bloom: { strength: 0.85, radius: 0.55, threshold: 0.86 },
  weather: [
    { mode: 'fall', count: 260, colors: ['#ffb7c9', '#ffd1dc', '#ff9fb8'], size: 0.32, k: 1.5, box: [44, 18, 90], speed: 1, shape: 1 },
    { mode: 'float', count: 110, colors: ['#d9ff7a', '#fff3a0'], size: 0.2, k: 3.2, box: [40, 10, 90], speed: 1 },
  ],
  coin: 'cash', music: 'hz',

  build() {
    const wall = windowTex({ wall: WALL, glass: '#2a2420', lit: ['#ffcf8a', '#ffb35c', '#ffe0a8'], litChance: 0.55, frame: '#5a3a28', cols: 5, rows: 8 });
    const wallMat = facadeMat(wall, { k: 0.9, rough: 0.9 });
    const tower = windowTex({ wall: '#16202c', glass: '#22344a', lit: ['#bfe3ff', '#ffffff'], litChance: 0.35, band: true });
    const towerMat = facadeMat(tower, { k: 1.4, rough: 0.25, metal: 0.6 });
    const vs = verticalSigns();
    const vsMat = std({ map: vs.tex, roughness: 0.6, emissive: '#ffffff', emissiveMap: vs.tex, emissiveIntensity: 0.6 });
    const vsGeo = vs.rects.map((r) => { const g = new THREE.PlaneGeometry(1, 3); const uv = g.attributes.uv; uv.setXY(0, r.u0, 1); uv.setXY(1, r.u1, 1); uv.setXY(2, r.u0, 0); uv.setXY(3, r.u1, 0); return g; });
    const plaques = ['西湖', '断桥', '苏堤', '灵隐', '钱塘'].map((t) => std({ map: plaqueTex(t), roughness: 0.5, emissive: '#ffffff', emissiveMap: plaqueTex(t), emissiveIntensity: 0.7 }));
    const water = waterMat('#2e4f63', 8);
    const stoneTex = canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#8d8a84'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 * 32; x < w + 64; x += 64) { g.strokeStyle = '#6f6c66'; g.lineWidth = 3; g.strokeRect(x - 32, y, 64, 32); }
    });
    stoneTex.repeat.set(2, 24);
    const track = makeTrack({ gravel: '#2a2e33', spots: ['#383d44', '#1d2024', '#4a4f57'], sleeper: '#4a4038', rail: '#d6dbe2', edge: '#ff5a6e', edgeK: 2.2, sideMat: std({ map: stoneTex, roughness: 0.85 }), ground: [null, '#3c4440'] });

    const lantern = (b, x, y, z, s = 1) => {
      b.cyl(VC.metal, '#3a2a18', x, y + 0.45 * s, z, 0.03, 0.4 * s);
      b.add(G.sph, VC.glow, x, y, z, 0.62 * s, 0.72 * s, 0.62 * s, 0, 0, 0, hdr('#ff3a2a', 3.2));
      b.cyl(VC.solid, '#c9a227', x, y + 0.36 * s, z, 0.2 * s, 0.08 * s);
      b.cyl(VC.solid, '#c9a227', x, y - 0.36 * s, z, 0.2 * s, 0.08 * s);
      b.cyl(VC.glow, hdr('#ffd77a', 2), x, y - 0.6 * s, z, 0.04 * s, 0.4 * s);
    };
    const roofAlong = (b, x, y, z, w, len, col = TILE) => {
      for (const s of [-1, 1]) b.add(G.box, VC.solid, x + s * w * 0.27, y + w * 0.17, z, w * 0.62, 0.22, len + 1.2, 0, 0, -s * 0.55, col);
      b.box(VC.solid, '#1d2026', x, y + w * 0.34, z, 0.35, 0.35, len + 1.4);
    };
    const horseWall = (b, x, y, zEdge, w) => {
      for (let k = 0; k < 3; k++) {
        const ww = w * (1 - k * 0.3), hh = y + 0.8 + k * 1.1;
        b.block(VC.solid, WALL, x, 0, zEdge, ww, hh, 0.5);
        b.box(VC.solid, TILE, x, hh + 0.15, zEdge, ww + 0.3, 0.3, 0.9);
      }
    };
    const kit = treeKit();
    const S = makeShow(), K = makeKit(S, { treeKit: kit }), WT = wutongKit();
    const willow = (b, x, z, s = 1, o) => kit.willow(b, x, z, s, o);
    const pavilion = (b, x, z) => {
      b.block(VC.solid, '#9a968e', x, -0.6, z, 6, 1.0, 6);
      for (const [dx, dz] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) b.cyl(VC.solid, '#a3262a', x + dx, 2.0, z + dz, 0.22, 4.2);
      b.add(G.cone4, VC.solid, x, 5.1, z, 8.5, 2.0, 8.5, 0, 0, 0, TILE);
      b.add(G.cone4, VC.solid, x, 6.3, z, 4, 1.6, 4, 0, 0, 0, TILE);
      b.sph(VC.glow, hdr('#ffd77a', 2.6), x, 7.3, z, 0.35);
      for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) b.add(G.cone, VC.solid, x + dx, 4.4, z + dz, 0.4, 0.9, 0.4, (dz > 0 ? 0.6 : -0.6), 0, (dx > 0 ? -0.6 : 0.6), TILE);
      lantern(b, x - 2.2, 3.4, z - 3.2, 0.9); lantern(b, x + 2.2, 3.4, z - 3.2, 0.9);
    };
    const boat = (b, x, z) => {
      b.block(VC.solid, '#5a2a1e', x, -0.9, z, 3.2, 1.0, 12);
      b.add(G.box, VC.solid, x, -0.4, z - 6.4, 2.8, 0.6, 2, 0.4, 0, 0, '#5a2a1e');
      b.block(VC.solid, '#a3262a', x, 0.1, z, 2.6, 2.2, 6.5);
      b.box(VC.glow, hdr('#ffcf8a', 2.4), x, 1.2, z, 2.65, 0.7, 5.5);
      roofAlong(b, x, 2.3, z, 3.2, 6.5);
      lantern(b, x - 1.5, 2.3, z - 3.6, 0.7); lantern(b, x + 1.5, 2.3, z - 3.6, 0.7);
    };
    const bamboo = (b, x, z) => { kit.bamboo(b, x, z, rand(0.9, 1.1)); kit.bamboo(b, x + rand(-2.5, 2.5), z + rand(2.5, 4), rand(0.8, 1)); };

    const houses = (b, side) => {
      let z = rand(0, 3);
      while (z < CHUNK_LEN - 5) {
        const len = rand(7, 13), d = rand(7, 10), h = rand(4.5, 7.5);
        const x0 = 10.5 + rand(0, 1.5), cx = side * (x0 + d / 2), cz = -(z + len / 2);
        b.addM(buildingGeo(d, h, len, wall, 2.2, 3.1), wallMat, at(cx, 0, cz), pick(['#d8d4cb', '#cdc8bd', '#c4bfb3']));
        b.box(VC.solid, '#3a3a40', cx, 0.35, cz, d + 0.05, 0.7, len + 0.05);
        if (chance(0.6)) roofAlong(b, cx, h, cz, d, len);
        else { b.box(VC.solid, TILE, cx, h + 0.15, cz, d + 0.4, 0.3, len + 0.4); horseWall(b, cx, h, cz - len / 2, d); horseWall(b, cx, h, cz + len / 2, d); }
        const face = side * x0;
        b.add(G.box, VC.solid, face - side * 0.6, 3.1, cz, 1.4, 0.16, len, 0, 0, side * 0.35, TILE);
        for (let k = 0; k < Math.floor(len / 3); k++) lantern(b, face - side * 1.05, 2.35, cz - len / 2 + 1.5 + k * 3, 0.85);
        // shop boards stick out from the upper wall above the eave, facing along the street
        const top = Math.min(h - 0.3, 6.4), bot = 3.65, sh = top - bot;
        if (sh > 1.3 && chance(0.85)) {
          const sw = Math.min(0.85, sh / 2.8), sz = cz + rand(-len / 3, len / 3), out = sw + 0.3;
          const sx = face - side * (0.3 + sw / 2), sy = (top + bot) / 2, geo = vsGeo[randi(0, vsGeo.length - 1)];
          b.box(VC.solid, '#2a1a12', sx, sy, sz, sw + 0.1, sh + 0.1, 0.06);
          b.add(geo, vsMat, sx, sy, sz + 0.035, sw, sh / 3, 1);
          b.add(geo, vsMat, sx, sy, sz - 0.035, sw, sh / 3, 1, 0, Math.PI);
          for (const y of [top + 0.1, bot + 0.3]) b.box(VC.metal, '#3a2a18', face - side * out / 2, y, sz, out, 0.07, 0.07);
          b.box(VC.glow, hdr('#ffd77a', 1.6), sx, top + 0.1, sz, sw + 0.12, 0.05, 0.1);
        }
        z += len + rand(0.3, 2.5);
      }
      if (chance(0.5)) { // Qianjiang modern towers behind
        for (let k = 0; k < 2; k++) {
          const w = rand(10, 16), h = rand(40, 85), x = side * rand(30, 45), zc = -rand(10, 70);
          b.addM(buildingGeo(w, h, w, tower, 1.6, 3.2), towerMat, at(x, 0, zc), '#ffffff');
          const col = hdr(pick(['#ff5a6e', '#59d8ff', '#ffd77a', '#b26bff']), 3);
          for (let y = 8; y < h; y += 12) b.box(VC.glow, col, x, y, zc, w + 0.1, 0.25, w + 0.1);
        }
      }
    };

    const lakeDecor = () => {
      const b = new Batcher();
      const L = lakeSide(b), R = [];   // distances taken on the lakeside walk and along the houses
      if (chance(0.35)) pavilion(b, -rand(16, 24), -rand(15, 65));
      else if (chance(0.5)) boat(b, -rand(16, 30), -rand(15, 65));
      // street side (right)
      houses(b, 1);
      if (chance(0.5)) { const bz = rand(10, 70); bamboo(b, EDGE + 4.5, -bz); R.push(bz, bz - 3.2); }
      // overhead: lantern strings or a paifang gate
      if (chance(0.4)) {
        const z = -rand(10, 70);
        L.push(-z); R.push(-z);
        for (const s of [-1, 1]) b.box(VC.solid, '#5a2a22', s * (EDGE + 0.6), 3.6, z, 0.25, 7.2, 0.25);
        for (let k = 0; k <= 10; k++) {
          const t = k / 10, x = -(EDGE + 0.6) + t * 2 * (EDGE + 0.6);
          lantern(b, x, 6.6 - Math.sin(t * Math.PI) * 0.9, z, 0.75);
        }
      } else if (chance(0.35)) {
        const z = -rand(12, 66), W = EDGE + 1.6;
        L.push(-z); R.push(-z);
        for (const s of [-1, 1]) { b.box(VC.solid, '#a3262a', s * W, 4.4, z, 0.8, 8.8, 0.8); b.block(VC.solid, '#8d8a84', s * W, 0, z, 1.5, 1.2, 1.5); }
        b.box(VC.solid, '#a3262a', 0, 7.2, z, W * 2 + 1.2, 0.6, 0.7);
        b.box(VC.solid, '#1d2f4a', 0, 8.3, z, W * 2 + 0.6, 0.35, 0.6);
        b.add(G.box, pick(plaques), 0, 8.6, z + 0.36, 3.2, 1.0, 0.04);
        b.add(G.cone4, VC.solid, 0, 9.9, z, W * 2 + 3.5, 1.6, 2.6, 0, 0, 0, TILE);
        b.box(VC.glow, hdr('#ffd77a', 2.6), 0, 7.5, z + 0.36, W * 2 + 1.2, 0.08, 0.02);
        for (const s of [-1, 1]) lantern(b, s * (W - 1.2), 6.3, z + 0.2, 0.8);
      }
      lakeLife(b, L, R);
      return K.flushSteam(b.build());
    };

    // ---------- landmarks ----------
    // returns the distances its trees and lamps took on the walk
    const lakeSide = (b, { willows = true, lotus = 40, modern = false, lamps = true } = {}) => {
      const taken = [];
      b.add(G.plane, water, -80, -0.8, -CHUNK_LEN / 2, 150, CHUNK_LEN + 0.5, 1, -Math.PI / 2);
      b.box(VC.solid, modern ? '#5a5f66' : '#9a968e', -(EDGE + 7.2), -0.45, -CHUNK_LEN / 2, 0.6, 0.9, CHUNK_LEN);
      if (modern) {
        b.box(VC.metal, '#2b2f36', -(EDGE + 7.0), 0.5, -CHUNK_LEN / 2, 0.1, 1.0, CHUNK_LEN);
        b.box(VC.glow, hdr('#59d8ff', 2.2), -(EDGE + 7.0), 1.02, -CHUNK_LEN / 2, 0.12, 0.06, CHUNK_LEN);
      } else {
        for (let z = 1; z < CHUNK_LEN; z += 2.2) b.box(VC.solid, '#e4e0d6', -(EDGE + 7.0), 0.45, -z, 0.22, 0.9, 0.22);
        b.box(VC.solid, '#e4e0d6', -(EDGE + 7.0), 0.92, -CHUNK_LEN / 2, 0.18, 0.12, CHUNK_LEN);
      }
      // Su-causeway style: willows and peach trees alternate along the embankment
      if (willows) for (let z = rand(2, 6), k = randi(0, 1); z < CHUNK_LEN - 1; z += rand(7.5, 10.5), k++) {
        if (k % 2) kit.peach(b, -(EDGE + 4.4), -z, rand(0.9, 1.15));
        else willow(b, -(EDGE + 4.8), -z, rand(0.95, 1.15));
        taken.push(z);
      }
      for (let k = 0; k < lotus; k++) {
        const x = -rand(EDGE + 9, 40), z = -rand(0, CHUNK_LEN);
        b.addM(DISC, VC.solid, new THREE.Matrix4().makeScale(rand(1, 2.2), 1, rand(1, 2.2)).setPosition(x, -0.76, z), pick(['#2f6b3a', '#3b7a42', '#2a5e34']));
        if (chance(0.25)) b.add(G.cone8, VC.glow, x, -0.4, z, 0.5, 0.6, 0.5, Math.PI, 0, 0, hdr('#ff8fb0', 1.8));
      }
      if (lamps) for (let z = rand(6, 14); z < CHUNK_LEN; z += 20) { lamp(b, -(EDGE + 1.2), -z, -1, { light: modern ? '#cfe6ff' : '#ffd9a0', k: 3, h: 4.6, pole: '#1d2026' }); taken.push(z); }
      return taken;
    };

    // 三潭映月: three stone lantern-pagodas standing in the lake, candlelight through five round holes
    const stonePagoda = (b, x, z, s) => {
      const y0 = -0.8, st = '#a19c90';
      b.cyl(VC.solid, st, x, y0 + 0.8 * s, z, 0.32 * s, 1.6 * s, 'cyl8');
      const y = y0 + 1.6 * s;
      b.cyl(VC.solid, st, x, y + 0.08 * s, z, 0.55 * s, 0.16 * s, 'cyl8');
      const cy = y + 0.76 * s;
      b.add(G.sph, VC.solid, x, cy, z, 1.26 * s, 1.12 * s, 1.26 * s, 0, 0, 0, st);
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * Math.PI * 2 + 0.3;
        b.add(G.cyl, VC.glow, x + Math.sin(a) * 0.6 * s, cy, z + Math.cos(a) * 0.6 * s, 0.24 * s, 0.06 * s, 0.24 * s, Math.PI / 2, a, 0, hdr('#ffb347', 3.6));
        b.addM(DISC, VC.glowAdd, new THREE.Matrix4().makeScale(0.5 * s, 1, 2.4 * s).setPosition(x + Math.sin(a) * 1.4 * s, -0.75, z + Math.cos(a) * 1.4 * s + 1.2 * s), hdr('#ffb347', 0.4));
      }
      b.cyl(VC.solid, st, x, cy + 0.62 * s, z, 0.85 * s, 0.14 * s, 'cyl8');
      b.add(G.cone8, VC.solid, x, cy + 0.86 * s, z, 1.3 * s, 0.34 * s, 1.3 * s, 0, 0, 0, st);
      b.add(G.sph, VC.solid, x, cy + 1.16 * s, z, 0.42 * s, 0.4 * s, 0.42 * s, 0, 0, 0, st);
      b.add(G.sph, VC.solid, x, cy + 1.43 * s, z, 0.26 * s, 0.3 * s, 0.26 * s, 0, 0, 0, st);
      b.add(G.cone, VC.solid, x, cy + 1.68 * s, z, 0.12 * s, 0.32 * s, 0.12 * s, 0, 0, 0, st);
      b.add(G.sph, VC.glowAdd, x, cy, z, 3.2 * s, 3.2 * s, 3.2 * s, 0, 0, 0, hdr('#ffb347', 0.07));
    };
    const island = (b, x, z) => {
      b.add(G.sphLow, VC.solid, x, -2.4, z, 34, 5, 40, 0, 0, 0, '#2c4a30');
      pavilion(b, x + 2, z + 3);
      const onIsland = (dx, dz) => -2.4 + 2.5 * Math.sqrt(Math.max(0, 1 - (dx / 17) ** 2 - (dz / 20) ** 2)) - 0.2;
      for (const [dx, dz, s] of [[-7, -9, 1.05], [8, -11, 1.1], [-9, 10, 0.95], [9, 12, 1]]) willow(b, x + dx, z + dz, s, { ry: rand(0, 6.28), y: onIsland(dx, dz) });
      for (const [dx, dz] of [[-2, -14], [-12, 1], [4, 15]]) kit.camphor(b, x + dx, z + dz, rand(0.9, 1.2), { y: onIsland(dx, dz) });
      kit.peach(b, x + 11, z - 2, 1, { y: onIsland(11, -2) });
      let bx = x + 13, bz = z + 8;
      for (let k = 0; k < 6; k++) {
        const nx = bx + 3.4, nz = bz + (k % 2 ? 2.4 : -2.4), len = Math.hypot(nx - bx, nz - bz), ry = Math.atan2(nx - bx, nz - bz);
        b.add(G.box, VC.solid, (bx + nx) / 2, -0.35, (bz + nz) / 2, 1.5, 0.3, len + 0.4, 0, ry, 0, '#d8d3c8');
        for (const o of [-0.7, 0.7]) b.add(G.box, VC.solid, (bx + nx) / 2 + Math.cos(ry) * o, 0.1, (bz + nz) / 2 - Math.sin(ry) * o, 0.08, 0.6, len, 0, ry, 0, '#ece8df');
        lantern(b, nx, 0.9, nz, 0.5);
        bx = nx; bz = nz;
      }
    };
    const santan = () => {
      const b = new Batcher();
      lakeSide(b, { lotus: 24 });
      for (const [x, z] of [[-17, -20], [-27, -38], [-17, -56]]) stonePagoda(b, x, z, 2.4);
      island(b, -56, -40);
      houses(b, 1);
      return b.build();
    };

    // 钱江新城: the golden sphere (conference center), the crescent-moon grand theatre, LED-show towers
    const goldMat = std({ color: '#d9a032', metalness: 1, roughness: 0.28, emissive: '#ff8a00', emissiveIntensity: 0.5 });
    const silverMat = std({ color: '#dfe6f0', metalness: 1, roughness: 0.18, emissive: '#3a4a66', emissiveIntensity: 0.5 });
    const LED = 8, LW = 256, LH = 512;
    const ledTex = canvasTex(LW * LED, LH, (g) => {
      const cn = '"Ma Shan Zheng", "STKaiti", "KaiTi", serif';
      for (let i = 0; i < LED; i++) {
        const x0 = i * LW;
        g.save(); g.beginPath(); g.rect(x0, 0, LW, LH); g.clip();
        const vert = (txt, col, size = 120) => {
          g.fillStyle = col; g.font = `900 ${size}px ${cn}`; g.textAlign = 'center'; g.textBaseline = 'middle';
          const ch = [...txt]; ch.forEach((c, k) => g.fillText(c, x0 + LW / 2, LH / 2 + (k - (ch.length - 1) / 2) * size * 0.95));
        };
        if (i === 0) { const gr = g.createLinearGradient(0, 0, 0, LH); gr.addColorStop(0, '#ff3a3a'); gr.addColorStop(1, '#ffb000'); g.fillStyle = gr; g.fillRect(x0, 0, LW, LH); vert('最忆是杭州', '#fff6d6', 86); }
        if (i === 1) { g.fillStyle = '#021a3a'; g.fillRect(x0, 0, LW, LH); g.strokeStyle = '#59d8ff'; g.lineWidth = 8; for (let k = 0; k < 9; k++) { g.beginPath(); for (let y = 0; y <= LH; y += 8) g.lineTo(x0 + LW / 2 + Math.sin(y * 0.03 + k) * 70, y); g.globalAlpha = 0.3 + k * 0.07; g.stroke(); } g.globalAlpha = 1; }
        if (i === 2) { g.fillStyle = '#b3141f'; g.fillRect(x0, 0, LW, LH); vert('杭州', '#ffd77a', 170); }
        if (i === 3) { g.fillStyle = '#0a0f2a'; g.fillRect(x0, 0, LW, LH); ['#2f6bff', '#ffd23d', '#e8253f', '#14c7a5', '#ff7ac6'].forEach((c, k) => { g.strokeStyle = c; g.lineWidth = 12; g.beginPath(); g.arc(x0 + 70 + (k % 3) * 58, 150 + Math.floor(k / 3) * 60, 46, 0, 7); g.stroke(); }); vert('亚运', '#ffffff', 96); }
        if (i === 4) { g.fillStyle = '#1a0a1f'; g.fillRect(x0, 0, LW, LH); g.fillStyle = '#ff8fb0'; for (let k = 0; k < 8; k++) { g.save(); g.translate(x0 + LW / 2, LH * 0.55); g.rotate(k / 8 * Math.PI * 2); g.beginPath(); g.ellipse(0, -60, 34, 70, 0, 0, 7); g.globalAlpha = 0.85; g.fill(); g.restore(); } g.fillStyle = '#ffe066'; g.beginPath(); g.arc(x0 + LW / 2, LH * 0.55, 26, 0, 7); g.fill(); }
        if (i === 5) { ['#ff3a3a', '#ff9a1a', '#ffe23d', '#39ff88', '#00e5ff', '#3d6bff', '#b26bff'].forEach((c, k) => { g.fillStyle = c; g.fillRect(x0 + k * LW / 7, 0, LW / 7 + 1, LH); }); }
        if (i === 6) { g.fillStyle = '#04122a'; g.fillRect(x0, 0, LW, LH); g.save(); g.translate(x0 + LW / 2, LH / 2); g.rotate(-Math.PI / 2); g.fillStyle = '#59d8ff'; g.font = '900 64px "Russo One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HANGZHOU', 0, 0); g.restore(); }
        if (i === 7) { g.fillStyle = '#071230'; g.fillRect(x0, 0, LW, LH); g.fillStyle = '#fff4dc'; g.beginPath(); g.arc(x0 + LW / 2, 160, 70, 0, 7); g.fill(); g.fillStyle = '#071230'; g.beginPath(); g.arc(x0 + LW / 2 + 30, 140, 62, 0, 7); g.fill(); g.fillStyle = '#ffffff'; for (let k = 0; k < 40; k++) g.fillRect(x0 + rand(0, LW), rand(0, LH), 3, 3); vert('钱塘', '#ffd77a', 90); }
        g.restore();
      }
    }, { repeat: false });
    const ledScreen = screenMat(ledTex, LED, 1.25, 0.16);
    const crescent = (() => {
      const R1 = 18, R2 = 15, c = 6, ix = (R1 * R1 - R2 * R2 + c * c) / (2 * c), iy = Math.sqrt(R1 * R1 - ix * ix);
      const t1 = Math.atan2(iy, ix), t2 = Math.atan2(-iy, ix - c);
      const sh = new THREE.Shape();
      sh.absarc(0, 0, R1, t1, Math.PI * 2 - t1, false);
      sh.absarc(c, 0, R2, t2, -t2, true);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 5, bevelEnabled: true, bevelSize: 0.6, bevelThickness: 0.6, bevelSegments: 2, curveSegments: 40 });
      g.translate(0, 0, -2.5); g.rotateZ(Math.PI / 2);
      return g;
    })();
    const qianjiang = () => {
      const b = new Batcher();
      lakeSide(b, { willows: false, lotus: 0, modern: true });
      b.box(VC.solid, '#4a5052', EDGE + 7 + 30, -0.08, -CHUNK_LEN / 2, 60, 0.12, CHUNK_LEN);
      const sx = 34, sz = -26, R = 15;
      b.cyl(VC.solid, '#c9c4b8', sx, 1.5, sz, R + 7, 3);
      b.box(VC.glow, hdr('#ffe0a8', 1.2), sx - R - 7.05, 1.6, sz, 0.1, 1.2, 14);
      b.add(G.sph, goldMat, sx, 3 + R * 0.92, sz, 2 * R, 2 * R * 0.95, 2 * R);
      for (let k = -3; k <= 4; k++) {
        const yy = k * R * 0.2, rr = Math.sqrt(Math.max(0, R * R - yy * yy)) * 1.006;
        b.add(RING, VC.glow, sx, 3 + R * 0.92 + yy * 0.95, sz, rr, 10, rr, 0, 0, 0, hdr('#ffd27a', 0.85));
      }
      b.add(G.sph, VC.glowAdd, sx, 3 + R * 0.92, sz, 2.8 * R, 2.8 * R, 2.8 * R, 0, 0, 0, hdr('#ffb000', 0.05));
      b.addM(crescent, silverMat, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(40, 16, -64));
      b.add(G.sph, VC.glowAdd, 40, 16, -64, 46, 40, 20, 0, 0, 0, hdr('#bfd8ff', 0.05));
      b.box(VC.glow, hdr('#cfe6ff', 1.4), 32, 0.6, -64, 0.2, 0.4, 30);
      for (let k = 0; k < 7; k++) {
        const w = rand(12, 16), h = rand(60, 96), x = 62 + (k % 2) * 15, z = -4 - k * 11.5;
        b.addM(buildingGeo(w, h, w, tower, 1.6, 3.2), towerMat, at(x, 0, z), '#ffffff');
        b.add(G.plane, ledScreen, x - w / 2 - 0.12, h * 0.5, z, w * 0.94, h * 0.9, 1, 0, -Math.PI / 2, 0, screenTint());
      }
      for (let z = 6; z < CHUNK_LEN; z += 16) lamp(b, EDGE + 1.4, -z, 1, { light: '#cfe6ff', k: 3, h: 5, pole: '#2b2f36' });
      people(b, EDGE + 1.4, EDGE + 6.5, 2, CHUNK_LEN - 2, 18);
      return b.build();
    };

    // 雷峰塔 · 断桥
    const leifeng = (b, x, y0, z, s) => {
      let y = y0;
      b.cyl(VC.solid, '#8d8a84', x, y + s, z, 11 * s, 2 * s, 'cyl8'); y += 2 * s;
      for (let k = 0; k < 5; k++) {
        const r = (8 - k * 0.9) * s, h = (6.4 - k * 0.5) * s, er = r + 3.2 * s;
        b.add(G.cyl8, VC.solid, x, y + h / 2, z, 2 * r, h, 2 * r, 0, 0, 0, '#c98a3a');
        for (let f = 0; f < 8; f++) { const a = f / 8 * Math.PI * 2 + Math.PI / 8; b.add(G.box, VC.glow, x + Math.sin(a) * r * 0.93, y + h * 0.45, z + Math.cos(a) * r * 0.93, 0.9 * s, 1.8 * s, 0.1, 0, a, 0, hdr('#ffd27a', 2.2)); }
        b.add(G.cone8, VC.solid, x, y + h + 0.8 * s, z, 2 * er, 1.8 * s, 2 * er, 0, 0, 0, '#3a2a24');
        b.add(G.cyl8, VC.glow, x, y + h + 0.05, z, 2 * er - 0.6 * s, 0.25 * s, 2 * er - 0.6 * s, 0, 0, 0, hdr('#ffcf6b', 2.4));
        for (let f = 0; f < 8; f++) { const a = f / 8 * Math.PI * 2; b.add(G.cone, VC.solid, x + Math.sin(a) * er, y + h + 0.4 * s, z + Math.cos(a) * er, 0.35 * s, 1.1 * s, 0.35 * s, 0, 0, 0, '#3a2a24'); }
        y += h + 1.6 * s;
      }
      for (let k = 0; k < 4; k++) b.cyl(VC.glow, hdr('#ffd27a', 2.4), x, y + 1 + k * 1.6 * s, z, (1.2 - k * 0.22) * s, 0.5 * s);
      b.add(G.cone8, VC.glow, x, y + 8 * s, z, 1.2 * s, 6 * s, 1.2 * s, 0, 0, 0, hdr('#ffd27a', 2.6));
      b.add(G.sph, VC.glowAdd, x, y0 + 22 * s, z, 60 * s, 60 * s, 60 * s, 0, 0, 0, hdr('#ffb347', 0.045));
    };
    const archBridge = (b, x, d0, d1) => {
      const n = 26, L = d1 - d0, H = 4.4, seg = L / n;
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n, ya = H * Math.sin(Math.PI * t0), yb = H * Math.sin(Math.PI * t1);
        const za = -(d0 + L * t0), zb = -(d0 + L * t1), zc = (za + zb) / 2, yc = (ya + yb) / 2, rx = Math.atan2(yb - ya, seg), len = Math.hypot(seg, yb - ya) + 0.05;
        b.add(G.box, VC.solid, x, yc - 0.3, zc, 4.4, 0.6, len, rx, 0, 0, '#cfc9bc');
        if (Math.abs((t0 + t1) / 2 - 0.5) > 0.22) b.box(VC.solid, '#bdb6a8', x, (yc - 0.6 - 0.8) / 2, zc, 4.2, yc - 0.6 + 0.8, seg);
        for (const o of [-2.05, 2.05]) {
          b.add(G.box, VC.solid, x + o, yc + 0.55, zc, 0.16, 0.12, len, rx, 0, 0, '#ece8df');
          if (k % 2 === 0) b.box(VC.solid, '#ece8df', x + o, yc + 0.25, za, 0.2, 0.7, 0.2);
        }
      }
      lantern(b, x - 2.05, 1.6, -d0, 0.8); lantern(b, x + 2.05, 1.6, -d0, 0.8);
      lantern(b, x - 2.05, 1.6, -d1, 0.8); lantern(b, x + 2.05, 1.6, -d1, 0.8);
    };
    const leifengScene = () => {
      const b = new Batcher();
      lakeSide(b, { lotus: 26 });
      b.add(G.sphLow, VC.solid, -64, -16, -48, 70, 44, 64, 0, 0, 0, '#22382c');
      for (let k = 0; k < 16; k++) {
        const dx = rand(-30, 30), dz = rand(-27, 27), y = -16 + 22 * Math.sqrt(Math.max(0, 1 - (dx / 35) ** 2 - (dz / 32) ** 2)) - 0.4;
        if (y < -0.5 || Math.hypot(dx, dz) < 11) continue;
        kit.camphor(b, -64 + dx, -48 + dz, rand(1.1, 1.6), { y });
      }
      leifeng(b, -64, 5.5, -48, 1.1);
      archBridge(b, -24, 6, 44);
      houses(b, 1);
      return b.build();
    };

    // ---------- the life of the lakeside: vendors on the walk, newsstands, snack carts and bikes along the houses ----------
    const free = (taken, z, r) => !taken.some((t) => Math.abs(t - z) < r);
    const slot = (taken, r, z0 = 4, z1 = CHUNK_LEN - 4) => {   // a distance at least r from the taken ones (now taken too)
      for (let t = 0; t < 14; t++) { const z = rand(z0, z1); if (free(taken, z, r)) { taken.push(z); return z; } }
      return null;
    };
    const lakeLife = (b, L, R) => {
      const gapsL = [], gapsR = [];
      // on the walk, between the lamps and the trees: one to three of the lake's vendors; benches facing the water
      for (let k = randi(1, 3); k > 0; k--) {
        const kind = pick(['sugarArt', 'lotusSeller', 'kiosk', 'kiosk', 'balloons', 'wreaths', 'portrait', 'serviceDesk']), wide = kind === 'kiosk';
        const z = slot(L, wide ? 2.7 : 1.9);
        if (z === null) continue;
        K[kind](b, -(EDGE + (wide ? 3.0 : 2.65)), -z, -1);
        gapsL.push([z - 2.2, z + 2.2]);
      }
      for (let k = randi(0, 2); k > 0; k--) { const z = slot(L, 1.4); if (z !== null) K.bench(b, -(EDGE + 5.85), -z, Math.PI / 2); }
      K.strollers(b, -(EDGE + 0.6), -(EDGE + 3.4), 2, CHUNK_LEN - 2, randi(6, 10), { gaps: gapsL });
      // along the houses: a newsstand, snack carts with their queues, the red bikes, the sorting bins
      if (chance(0.55)) { const z = slot(R, 2.3); if (z !== null) { K.newsstand(b, EDGE + 4.25, -z, 1); gapsR.push([z - 2, z + 2]); } }
      for (let k = randi(1, 2); k > 0; k--) { const z = slot(R, 1.9); if (z !== null) { K.snackCart(b, EDGE + 3.25, -z, 1); gapsR.push([z - 1.8, z + 1.8]); } }
      if (chance(0.35)) {
        const n = randi(5, 9), z = slot(R, n * 0.36 + 1.4);
        if (z !== null) { K.bikes(b, EDGE + 4.75, -z + n * 0.36, n, 1); gapsR.push([z - n * 0.36 - 1, z + n * 0.36 + 1]); }
      }
      if (chance(0.4)) { const z = slot(R, 1.3); if (z !== null) K.bins(b, EDGE + 5.6, -z, 1); }
      K.strollers(b, EDGE + 0.6, EDGE + 2.6, 2, CHUNK_LEN - 2, randi(5, 9), { gaps: gapsR });
    };

    // ---------- the plane-tree avenue (北山街) between the lake and the river ----------
    // The planes on both kerbs meet in a green tunnel high over the track. On the left the walk under them: lantern lamps
    // by the track, benches facing the water, West Lake's white balustrade and lotus, an old willow at the edge (or, on
    // the city side, the river's steel railing and the far bank's lights); on the right the villa walls and their gates,
    // villas on terraces up the wooded hill (or newer blocks, the towers of Qianjiang New City showing above the trees),
    // a bus stop, bikes, a sightseeing cart waiting.
    const avenueDecor = (toward) => {
      const b = new Batcher(), city = toward === 'river';
      lakeSide(b, city ? { willows: false, lotus: 0, modern: true, lamps: false } : { willows: false, lotus: 14, lamps: false });
      if (city) K.farBank(b);
      const L = [], R = [], gapsR = [];
      for (let z = rand(1.5, 4.5); z < CHUNK_LEN; z += rand(8.6, 10.4)) { WT.wutong(b, -(EDGE + 2.9 + rand(-0.2, 0.2)), -z); L.push(z); }
      for (let z = rand(5.5, 8.5); z < CHUNK_LEN; z += rand(8.6, 10.4)) { WT.wutong(b, EDGE + 2.9 + rand(-0.2, 0.2), -z); R.push(z); }
      // the walk by the water
      for (let z = rand(3, 7); z < CHUNK_LEN - 1; z += rand(17, 21)) if (free(L, z, 1.3)) { K.lampWL(b, -(EDGE + 0.9), -z); L.push(z); }
      for (let k = randi(1, 3); k > 0; k--) { const z = slot(L, 1.6); if (z !== null) K.bench(b, -(EDGE + 5.6), -z, Math.PI / 2); }
      if (!city) for (let k = randi(0, 2); k > 0; k--) { const z = slot(L, 2.4); if (z !== null) kit.willow(b, -(EDGE + 6.3), -z, rand(0.85, 1.0)); }
      else if (chance(0.5)) { const z = slot(L, 1.4); if (z !== null) K.tideSign(b, -(EDGE + 6.6), -z, -1); }
      K.strollers(b, -(EDGE + 0.5), -(EDGE + 5.0), 2, CHUNK_LEN - 2, randi(4, 8));
      // the pavement: lamps, a bus stop, bikes, a newsstand, the cart, a street sign
      for (let z = rand(12, 16); z < CHUNK_LEN - 1; z += rand(17, 21)) if (free(R, z, 1.3)) { K.lampWL(b, EDGE + 0.9, -z); R.push(z); }
      if (chance(0.3)) { const z = slot(R, 2.4); if (z !== null) { K.busStop(b, EDGE + 5.0, -z, 1); gapsR.push([z - 2, z + 2]); } }
      if (chance(0.3)) {
        const n = randi(5, 8), z = slot(R, n * 0.36 + 1.4);
        if (z !== null) { K.bikes(b, EDGE + 5.4, -z + n * 0.36, n, 1); gapsR.push([z - n * 0.36 - 1, z + n * 0.36 + 1]); }
      }
      if (chance(0.25)) { const z = slot(R, 2.3); if (z !== null) { K.newsstand(b, EDGE + 5.4, -z, 1); gapsR.push([z - 2, z + 2]); } }
      if (!city && chance(0.35)) { const z = slot(R, 3.3); if (z !== null) K.tourCart(b, EDGE + 1.15, -z, 1); }
      if (chance(0.5)) { const z = slot(R, 1.2); if (z !== null) K.signpost(b, EDGE + 1.3, -z, 1, SIGN[city ? '之江路' : pick(['北山街', '断桥 →'])]); }
      if (chance(0.4)) { const z = slot(R, 1.0); if (z !== null) K.hydrant(b, EDGE + 1.0, -z); }
      if (chance(0.35)) { const z = slot(R, 1.3); if (z !== null) K.bins(b, EDGE + 6.0, -z, 1); }
      K.strollers(b, EDGE + 0.5, EDGE + 4.6, 2, CHUNK_LEN - 2, randi(4, 8), { gaps: gapsR });
      // behind the wall
      if (!city) {
        K.villaWall(b, 1, 0, CHUNK_LEN);
        for (let z = rand(2, 8); z < CHUNK_LEN - 8; z += rand(20, 28)) K.villa(b, 1, rand(19, 24), -(z + 6));
        b.block(VC.solid, '#3e4a3c', 36, 0, -40, 14, 2.6, CHUNK_LEN);   // the wooded hill rising behind in terraces
        b.block(VC.solid, '#36423a', 51, 0, -40, 16, 5.4, CHUNK_LEN);
        for (let z = rand(1, 5); z < CHUNK_LEN; z += rand(7, 10)) kit.camphor(b, rand(31, 41), -z, rand(1.1, 1.4), { y: 2.6 });
        for (let z = rand(1, 5); z < CHUNK_LEN; z += rand(8, 12)) kit.camphor(b, rand(45, 57), -z, rand(1.3, 1.7), { y: 5.4 });
      } else {
        K.villaWall(b, 1, 0, CHUNK_LEN, { gates: false, h: 1.5 });
        for (let z = rand(0, 4); z < CHUNK_LEN - 6; ) {
          const len = rand(14, 22), d = rand(10, 14), h = rand(12, 22);
          b.addM(buildingGeo(d, h, len, K.officeTex, 1.6, 3.6), K.blockMat, at(14 + d / 2 + rand(0, 4), 0, -(z + len / 2)), pick(['#ffffff', '#e8f0ff', '#f0ece4']));
          z += len + rand(3, 8);
        }
        K.cityRow(b, 1, { front: false, x0: 34 });
      }
      return K.flushSteam(b.build());
    };

    // ---------- the Qiantang at Qianjiang New City ----------
    // The river on the left: its steel railing under a line of blue light, a tide warning, people at the railing, a
    // cruise boat now and then, the far bank's towers playing the show and streaking the water with its colours. On the
    // right the riverside park and its cycle lane, and behind it the towers of the new city, every one of them in the show.
    const riverDecor = () => {
      const b = new Batcher();
      const L = lakeSide(b, { willows: false, lotus: 0, modern: true }), gl = [];
      K.farBank(b);
      if (chance(0.45)) K.cruise(b, -rand(40, 85), -rand(22, 58));
      if (chance(0.4)) { const z = slot(L, 1.4); if (z !== null) K.tideSign(b, -(EDGE + 6.6), -z, -1); }
      if (chance(0.35)) { const z = slot(L, 1.8); if (z !== null) { K.glowSeller(b, -(EDGE + 2.2), -z, -1); gl.push([z - 1.6, z + 1.6]); } }
      K.spectators(b, -(EDGE + 2.6), -(EDGE + 6.6), 2, CHUNK_LEN - 2, randi(5, 10), -1, gl);
      K.strollers(b, -(EDGE + 0.5), -(EDGE + 2.0), 2, CHUNK_LEN - 2, randi(2, 5), { gaps: gl });
      K.riverPark(b, 1, 0, CHUNK_LEN);
      K.cityRow(b, 1);
      K.strollers(b, EDGE + 0.5, EDGE + 2.8, 2, CHUNK_LEN - 2, randi(4, 8));
      return K.flushSteam(b.build());
    };
    const decor = (zone) => (zone === 'river' ? riverDecor() : zone === 'avenueL' ? avenueDecor('lake') : zone === 'avenueR' ? avenueDecor('river') : lakeDecor());

    const LM = hzLandmarks(K, S, { lakeSide, kit });
    const byKey = {
      santan: { key: 'santan', name: '三潭映月', en: 'THREE POOLS MIRRORING THE MOON', build: santan },
      qianjiang: { key: 'qianjiang', name: '钱江新城 · 金球与大剧院', en: 'QIANJIANG NEW CITY', build: qianjiang },
      leifeng: { key: 'leifeng', name: '雷峰塔 · 断桥', en: 'LEIFENG PAGODA · BROKEN BRIDGE', build: leifengScene },
    };
    for (const l of LM.landmarks) byKey[l.key] = l;

    const sky = skyline({
      tex: skyTex({ wall: '#0e1a28', lit: ['#bfe3ff', '#ffd27a', '#ffffff'], chance: 0.3 }),
      colors: ['#c7d8ff', '#9db4d6'], count: 40, r: [640, 820], h: [60, 170], k: 1.6, gapAhead: 1.1,
      landmarks: [
        (b) => { // layered ink-wash mountains
          const layers = [[520, '#2c4658', 70, 130], [610, '#3e5d72', 90, 170], [700, '#57778c', 110, 210]];
          layers.forEach(([r, c, h0, h1], li) => {
            for (let i = 0; i < 34; i++) {
              const deg = i * 360 / 34 + rand(-4, 4) + li * 3;
              const [x, z] = polar(deg, r + rand(-30, 30));
              b.add(G.sphLow, SKY_VC, x, -95, z, rand(130, 220), rand(h0, h1) * 2, rand(110, 180), 0, rand(0, 3), 0, c);
            }
          });
        },
        (b) => { // Leifeng Pagoda glowing on its hill
          const [x, z, ry] = polar(-22, 500);
          b.add(G.sphLow, SKY_VC, x, -60, z, 160, 110, 120, 0, 0, 0, '#26404f');
          let y = -10;
          for (let k = 0; k < 6; k++) {
            const r = 15 - k * 1.6, h = 11 - k * 0.6;
            b.add(G.cyl8, SKY_VC, x, y + h / 2, z, r * 2, h, r * 2, 0, ry, 0, hdr('#ffb347', 1.1 + k * 0.05));
            b.add(G.cone8, SKY_VC, x, y + h + 1.2, z, r * 2 + 10, 3.2, r * 2 + 10, 0, ry, 0, '#3a2a2a');
            b.add(G.cyl8, SKY_VC, x, y + h - 0.2, z, r * 2 + 9.6, 0.7, r * 2 + 9.6, 0, ry, 0, hdr('#ffd77a', 3));
            y += h + 2;
          }
          b.add(G.cone8, SKY_VC, x, y + 7, z, 9, 14, 9, 0, ry, 0, hdr('#ffd77a', 2.5));
        },
        (b) => { // Baochu Pagoda (slender)
          const [x, z, ry] = polar(14, 560);
          b.add(G.sphLow, SKY_VC, x, -70, z, 140, 100, 110, 0, 0, 0, '#2c4658');
          b.add(G.cyl6, SKY_VC, x, 40, z, 7, 90, 7, 0, ry, 0, '#4a4a55');
          b.add(G.cone, SKY_VC, x, 92, z, 3, 16, 3, 0, ry, 0, hdr('#ffd77a', 2));
        },
        (b, mat) => { // Qianjiang CBD with the "sun and moon"
          for (let i = 0; i < 12; i++) {
            const [x, z, ry] = polar(40 + i * 3.2, 760 + rand(-30, 30)), h = rand(110, 230), w = rand(20, 34);
            b.addM(buildingGeo(w, h + 95, w, { cols: 8, rows: 16 }, 3.4, 4.2), mat, at(x, -95, z, ry), '#ffffff');
            const col = hdr(pick(['#ff5a6e', '#59d8ff', '#ffd77a', '#b26bff']), 2.2);
            for (let y = -40; y < h; y += 26) b.add(G.box, SKY_VC, x, y, z, w + 0.6, 1.4, w + 0.6, 0, ry, 0, col);
          }
          const [sx, sz] = polar(52, 680);
          b.sph(SKY_VC, hdr('#ffc94d', 2.8), sx, -55, sz, 36);
          const [mx, mz, mry] = polar(60, 690);
          b.add(G.cyl, SKY_VC, mx, -50, mz, 80, 10, 80, Math.PI / 2 - 0.2, mry, 0, hdr('#dfe8ff', 1.8));
        },
      ],
    });

    // ---------- the river's horizon, faded in while the run is by the Qiantang ----------
    // Both banks' towers playing the show, the Gate of Hangzhou (two towers leaning together into a gate) across the river
    // left of the track's end, the Olympic Center's "Big Lotus" further left, the Fuxing Bridge's lit arches across the
    // river at the far end. Leifeng Pagoda (-22°) and Baochu Pagoda (14°) are left clear.
    const rsMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true, opacity: 0, depthWrite: false });
    const riverSky = (() => {
      const b = new Batcher();
      const showFace = (x, z, ry, w, y0, y1, deg, r) => {   // a show screen on the face toward the camera
        const a = -ry, wd = ((w / r) * 180) / Math.PI;
        b.add(G.plane, S.sky, x - Math.sin(a) * 0.4, (y0 + y1) / 2, z + Math.cos(a) * 0.4, w * 0.94, y1 - y0, 1, 0, ry, 0, S.tint(((deg - wd / 2) / 30) * 80, rand(0.85, 1.1), (wd / 30) * 80));
      };
      const tower = (deg, r, w, h) => {
        const [x, z, ry] = polar(deg, r), a = -ry, d = w * 0.8;
        b.add(G.box, rsMat, x, (h - 95) / 2, z, w, h + 95, d, 0, ry, 0, '#141c28');
        showFace(x - Math.sin(a) * d / 2, z + Math.cos(a) * d / 2, ry, w, 2, h - 4, deg, r);
        b.add(G.box, rsMat, x, h + 1, z, w + 0.6, 2, d + 0.6, 0, ry, 0, hdr(pick(['#bfe8ff', '#ffffff', '#ffd27a']), 1.6));
      };
      for (const deg of [7, 10, 19, 23, 27, 31, 35, 39, 43, 47, 51]) tower(deg + rand(-1, 1), rand(400, 600), rand(22, 40), rand(90, 220));
      for (const deg of [-74, -68, -62, -56, -50, -44, -27]) tower(deg + rand(-1, 1), rand(480, 650), rand(22, 36), rand(70, 170));
      { // the Gate of Hangzhou: two towers of stacked blocks whose inner edges lean together as they rise
        const deg = -13, r = 640, [gx, gz, gry] = polar(deg, r), ca = Math.cos(gry), sa = Math.sin(gry);
        for (const e of [-1, 1]) for (let k = 0; k < 9; k++) {
          const off = e * (30 - k * k * 0.22), y = -40 + k * 18 + 9, x = gx + ca * off, z = gz - sa * off;
          b.add(G.box, rsMat, x, y, z, 20, 18, 16, 0, gry, 0, '#18202c');
          b.add(G.box, rsMat, x, y + 8.6, z, 20.3, 0.8, 16.3, 0, gry, 0, hdr('#ffe2b0', 1.3));
          if (k > 1) showFace(x - Math.sin(-gry) * 8, z + Math.cos(-gry) * 8, gry, 20, y - 8.5, y + 8, deg + (off / r) * (180 / Math.PI), r);
        }
      }
      { // the Big Lotus: the stadium's ring of white petals, lit warm
        const [cx, cz] = polar(-34, 470);
        for (let k = 0; k < 28; k++) {
          const a = (k / 28) * Math.PI * 2;
          b.add(G.cone8, rsMat, cx + Math.cos(a) * 44, 12, cz + Math.sin(a) * 44, 14, 60, 5, 0.45, Math.PI / 2 - a, 0, hdr(k % 2 ? '#f4f0ff' : '#fff0dc', 1.25));
        }
        b.add(G.cyl, rsMat, cx, -20, cz, 96, 30, 96, 0, 0, 0, '#1a1e28');
      }
      { // the Fuxing Bridge across the river: two decks on their piers, lit arches springing over them
        const [x1, z1] = polar(-40, 430), [x2, z2] = polar(4, 360), dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
        const P = (t) => [x1 + dx * t, z1 + dz * t];
        for (const y of [8, 14]) { b.add(G.box, rsMat, x1 + dx / 2, y, z1 + dz / 2, 3, 2.4, L, 0, ry, 0, '#1a1e26'); b.add(G.box, rsMat, x1 + dx / 2, y + 1.3, z1 + dz / 2, 3.2, 0.5, L, 0, ry, 0, hdr('#bfe0ff', 1.8)); }
        for (let k = 0; k <= 6; k++) { const [px, pz] = P(k / 6); b.add(G.box, rsMat, px, -30, pz, 6, 76, 6, 0, ry, 0, '#141820'); }
        for (let k = 0; k < 6; k++) for (let j = 0; j < 12; j++) {
          const [ax, az] = P((k + j / 12) / 6), [bx, bz] = P((k + (j + 1) / 12) / 6);
          const y0 = 14 + Math.sin((Math.PI * j) / 12) * 22, y1 = 14 + Math.sin((Math.PI * (j + 1)) / 12) * 22, hz = Math.hypot(bx - ax, bz - az);
          b.add(G.box, rsMat, (ax + bx) / 2, (y0 + y1) / 2, (az + bz) / 2, 1.6, 1.6, Math.hypot(hz, y1 - y0), -Math.atan2(y1 - y0, hz), ry, 0, hdr('#9ad8ff', 1.5));
        }
      }
      const g = b.build();
      g.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.renderOrder = -4; } });
      g.visible = false;
      return g;
    })();
    sky.add(riverSky);
    let riverK = 0;

    const trainStyle = {
      body: '#eef1f5', bodyMetal: true, roof: '#d4d9e0', under: '#2a2f38', stripe: RED, stripe2: '#c9a227', nose: 'bullet',
      window: '#d6ecff', windowK: 1.7, frame: '#1d2a3a', light: '#e8f4ff', sign: RED, doors: true, door: '#c8ced8', roofUnit: '#aab2bf',
      rampMat: std({ map: stripeTex('#7a1b1b', '#f2d27a', 6), roughness: 0.6 }), rampGlow: '#ff5a6e',
    };
    const barrier = barrierStyle({ c1: '#c8202c', c2: '#f2d27a', label: '限高', signBg: '#c8202c', signFg: '#ffe9a8', glow: '#ff5a5a', post: '#5a2a22' });

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      zoneAt: (k) => (k < 0 ? 'lake' : ZONES[k % ZONES.length]),
      zonePool: { lake: [4, 6], avenueL: [2, 3], avenueR: [2, 3], river: [5, 8] },
      coinGeo: coinGeometry('cash'), coinMat: coinMaterial('#ffcf4a', '#ff9a1a'),
      landmarks: ROUTE.map((k) => byKey[k]),
      update(t) {
        water.userData.scroll.offset.set(t * 0.008, t * 0.02); ledScreen.uniforms.time.value = t;
        S.update(t); K.update(t); LM.update(t);
        // where the camera is on the loop: the river's horizon comes up through the avenue and goes again on the way back
        const n = ZONES.length, p = ((((-sky.position.z) / CHUNK_LEN) % n) + n) % n;
        const k = smooth(clamp((p - 6.2) / 1.6, 0, 1)) * (1 - smooth(clamp((p - 18.2) / 1.6, 0, 1)));
        if (k !== riverK) { riverK = k; rsMat.opacity = k; S.sky.uniforms.fade.value = k; riverSky.visible = k > 0.003; }
      },
    };
  },
};
