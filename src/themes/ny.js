// New York: rainy neon night. Midtown walk-ups with fire escapes and water towers, sidewalk sheds, subway entrances and
// food carts, Brooklyn brownstones, SoHo cast-iron lofts, Little Italy's light arches, graffiti subway cars, silver trains
// coming at you, and the Empire State Building lit at the far end of the track.
import { THREE, Batcher, VC, G, std, basic, hdr, windowTex, signAtlas, planeUV, canvasTex, stripeTex, buildingGeo,
  CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { buildTrain, buildLowBarrier, buildHighBarrier, barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, facadeMat, buildingRow, lamp, skyline, skyTex, SKY_VC, polar, at, EDGE, DISC,
  farGround, screenMat, screenTint, textTex, people, TAPER, waterMat } from './common.js';
import { makeKit, LINES } from './ny_kit.js';
import { nyLandmarks } from './ny_landmarks.js';

const NEON = ['#ff3df0', '#00e5ff', '#ffe23d', '#39ff88', '#ff6a3d', '#b26bff'];

function graffitiTex() {
  return canvasTex(512, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const c1 = pick(NEON), c2 = pick(NEON.filter((c) => c !== c1));
    for (let i = 0; i < 16; i++) {
      const x = rand(0, w), y = rand(20, h - 20), r = rand(14, 46), col = pick(NEON);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, col + 'bb'); gr.addColorStop(1, col + '00');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const word = pick(['DASH', 'NYC', 'RUN!', 'WILD', 'BOOM', 'FLY', 'KAI', 'METRO', 'YO!', 'BX', 'QNS']);
    g.save();
    g.translate(w / 2, h / 2); g.rotate(rand(-0.08, 0.08));
    g.font = '900 104px "Russo One", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#0d0d12'; g.strokeText(word, 0, 0);
    const gr = g.createLinearGradient(0, -50, 0, 50); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.fillStyle = gr; g.fillText(word, 0, 0);
    g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.8)'; g.strokeText(word, 0, -2);
    g.fillStyle = c2;
    for (let i = 0; i < 9; i++) g.fillRect(rand(-w * 0.35, w * 0.35), rand(25, 40), 4, rand(12, 38));
    g.restore();
  }, { repeat: false });
}

export default {
  id: 'ny', name: '纽约', en: 'NEW YORK', tagline: '不夜城 · 霓虹雨夜',
  blurb: '雨夜的曼哈顿：霓虹招牌、消防梯、冒着蒸汽的街道和满身涂鸦的地铁。从时代广场出发，穿过中央公园、中央车站与克莱斯勒大厦、熨斗大厦和华尔街，冲过布鲁克林大桥，望见自由女神，一路跑到康尼岛的摩天轮下；跑道尽头，帝国大厦亮着红白蓝。',
  sights: ['时代广场', '中央公园', '中央车站', '熨斗大厦', '华尔街', '布鲁克林大桥', '自由女神像', '康尼岛'],
  accent: '#ff3df0', accent2: '#00e5ff', portal: '#ff3df0',
  sky: { top: '#04051a', mid: '#150f3b', bot: '#3d1f5f', glow: '#ff3d8b', glowK: 0.55, sun: '#e8edff', sunK: 1.2,
    sunDir: [0.42, 0.3, -1], sunSize: 0.004, moon: true, horizon: -0.09, stars: true },
  fog: { color: '#1d1239', near: 25, far: 250 },
  light: { hemiSky: '#8f86ff', hemiGround: '#24132c', hemi: 0.8, dir: '#c2ccff', dirK: 0.75, dirPos: [-0.4, 1, 0.3] },
  exposure: 0.92, bloom: { strength: 0.8, radius: 0.5, threshold: 0.85 },
  weather: [{ mode: 'rain', count: 650, colors: ['#9fb4ff'], k: 0.9, box: [44, 26, 90], speed: 1 }],
  coin: 'token', music: 'ny', jingle: 'subway',

  build() {
    const brick = windowTex({ wall: '#7a3b2e', glass: '#0d0f18', lit: ['#ffcc75', '#ffb35c', '#fff0c2', '#7fd1ff'], litChance: 0.42, frame: '#c9b8a0', ledge: '#55281e' });
    const stone = windowTex({ wall: '#5e4636', glass: '#0d0f18', lit: ['#ffcc75', '#ffd9a0'], litChance: 0.38, arch: true, frame: '#a8927a', ledge: '#3f2f25', cols: 6 });
    const glass = windowTex({ wall: '#1b2233', glass: '#26344d', lit: ['#cfe6ff', '#ffffff', '#9fd0ff'], litChance: 0.33, band: true });
    const brickMat = facadeMat(brick, { k: 0.9 }), stoneMat = facadeMat(stone, { k: 0.85 });
    const glassMat = facadeMat(glass, { k: 0.75, rough: 0.25, metal: 0.6 });
    const signs = signAtlas([
      { text: 'PIZZA', color: '#ff3b3b' }, { text: 'DELI', color: '#3dff9b' }, { text: 'BAGELS', color: '#ffb13d' },
      { text: 'JAZZ', color: '#3d8bff', border: true }, { text: 'HOTEL', color: '#ff3df0' }, { text: '24 HRS', color: '#00e5ff', border: true },
      { text: 'BROADWAY', color: '#ffe23d', border: true }, { text: 'NOODLES', color: '#ff6a3d' }, { text: 'CAFE', color: '#ff9ad5', border: true },
      { text: 'LIVE MUSIC', color: '#b26bff' }, { text: 'DINER', color: '#ff2a6d', border: true }, { text: 'TICKETS', color: '#3dfff0' },
    ], { cols: 2 });
    const signMat = basic({ map: signs.tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hdr('#ffffff', 1.3) });
    const signPlane = (b, x, y, z, side, w, i = randi(0, signs.rects.length - 1)) =>
      b.add(planeUV(signs.rects[i]), signMat, x, y, z, w, w / 4, 1, 0, -side * Math.PI / 2);

    const track = makeTrack({ gravel: '#1b1a22', spots: ['#2a2933', '#121117', '#383745'], sleeper: '#2d2622', rail: '#d4d9e6', edge: '#00e5ff', side: '#141319' });

    const K = makeKit();
    const fireEscape = K.fireEscape, waterTower = K.waterTower;
    const shopFront = (b, info) => {
      const x = info.face - info.side * 0.05;
      const aw = pick(['#b3202c', '#1d6b3a', '#1f3f8a', '#222222']);
      b.add(G.box, VC.solid, x - info.side * 0.7, 3.1, info.z, 1.5, 0.12, Math.min(info.len - 1, 6), 0, 0, info.side * 0.35, aw);
      b.box(VC.glow, hdr(pick(['#ffd9a0', '#ffb36b', '#9fd8ff']), 0.7), x - info.side * 0.02, 1.4, info.z, 0.04, 2.2, Math.min(info.len - 1.5, 5));
      if (chance(0.8)) signPlane(b, x - info.side * 0.12, 4.3, info.z, info.side, Math.min(4, info.len - 1));
    };
    const types = [
      { mat: brickMat, tex: brick, colors: ['#ffffff', '#e0c9b9', '#c9a28c', '#b88576'], w: [7, 13], h: [13, 26], weight: 3,
        roof: (b, i) => { if (chance(0.45)) waterTower(b, i); else b.block(VC.solid, '#2a2c33', i.x, i.h, i.z, 2.5, 1.2, 2.5); },
        front: (b, i) => { if (chance(0.6)) fireEscape(b, i); shopFront(b, i); } },
      { mat: stoneMat, tex: stone, colors: ['#ffffff', '#d8c3ae', '#b9a28c'], w: [6, 9], h: [9, 14], weight: 1.5, cellW: 1.7,
        roof: (b, i) => b.block(VC.solid, '#3a2c22', i.x, i.h, i.z, i.d + 0.4, 0.6, i.len + 0.2),
        front: (b, i) => { b.block(VC.solid, '#4a3a2e', i.face - i.side * 0.9, 0, i.z, 1.8, 1.2, 2.2); shopFront(b, i); } },
      { mat: glassMat, tex: glass, colors: ['#ffffff', '#c9d6ff', '#a9b8d9'], w: [12, 20], h: [38, 75], weight: 1.4, cellW: 1.3, cellH: 2.6,
        roof: (b, i) => {
          b.block(VC.metal, '#2b3242', i.x, i.h, i.z, i.d * 0.6, 3, i.len * 0.6);
          b.cyl(VC.metal, '#9aa3b5', i.x, i.h + 7, i.z, 0.15, 8);
          b.sph(VC.glow, hdr('#ff2a2a', 4), i.x, i.h + 11.2, i.z, 0.35);
        },
        front: (b, i) => { if (chance(0.5)) signPlane(b, i.face - i.side * 0.1, rand(9, 16), i.z, i.side, Math.min(9, i.len - 2)); } },
      { mat: brickMat, tex: brick, colors: ['#9a8a99', '#7f7690'], w: [14, 20], h: [24, 40], weight: 0.8,
        front: (b, i) => {
          for (let k = 0; k < 3; k++) signPlane(b, i.face - i.side * (0.15 + k * 0.02), 7 + k * 4.5, i.z + rand(-2, 2), i.side, Math.min(12, i.len - 2));
          b.box(VC.glow, hdr(pick(NEON), 2.4), i.face - i.side * 0.1, 5.2, i.z, 0.05, 0.12, i.len - 1);
        } },
    ];

    // Little Italy: walk-ups with tricolour awnings, lit trattorias, sidewalk tables
    const italianFront = (b, info) => {
      const x = info.face - info.side * 0.05, L = Math.min(info.len - 1, 6);
      b.add(G.box, pick(K.umbrellaMats), x - info.side * 0.7, 3.1, info.z, 1.5, 0.12, L, 0, 0, info.side * 0.35);
      b.box(VC.glow, hdr(pick(['#ffcf8a', '#ffb36b', '#ffd9a0']), 0.75), x - info.side * 0.02, 1.4, info.z, 0.04, 2.2, Math.min(info.len - 1.5, 5));
      if (chance(0.8)) signPlane(b, x - info.side * 0.12, 4.3, info.z, info.side, Math.min(4, info.len - 1), pick([0, 8, 10, 3]));
    };
    const italyTypes = [
      { ...types[0], front: (b, i) => { if (chance(0.6)) fireEscape(b, i); italianFront(b, i); } },
      { ...types[1], front: (b, i) => italianFront(b, i) },
    ];
    // regular blocks: midtown, brownstone Brooklyn, SoHo lofts or Little Italy, sometimes crossed by the elevated line
    const decor = () => {
      const b = new Batcher();
      const r = Math.random(), kind = r < 0.42 ? 'midtown' : r < 0.64 ? 'brownstone' : r < 0.84 ? 'soho' : 'italy';
      const shedSide = (kind === 'midtown' || kind === 'soho') && chance(0.45) ? pick([-1, 1]) : 0;
      for (const side of [-1, 1]) {
        farGround(b, side, '#121116');
        if (kind === 'midtown') buildingRow(b, side, types, { x0: 11, depth: [9, 15] });
        else if (kind === 'brownstone') K.brownstones(b, side, 0, CHUNK_LEN);
        else if (kind === 'soho') K.lofts(b, side, 0, CHUNK_LEN);
        else buildingRow(b, side, italyTypes, { x0: 11, depth: [9, 14] });
        const busy = [];
        const take = (z, rr) => { if (busy.some((c) => Math.abs(c - z) < rr)) return false; busy.push(z); return true; };
        for (let z = rand(2, 10); z < CHUNK_LEN; z += 17) lamp(b, side * (EDGE + 1.5), -z, side, { light: '#ffcf8a', k: 3.4 });
        if (kind !== 'midtown') for (let z = rand(4, 9); z < CHUNK_LEN - 3; z += rand(10, 13)) K.tree(b, side * (EDGE + 3.1), -z, rand(0.72, 0.85), chance(kind === 'brownstone' ? 0.4 : 0.25));
        if (side === shedSide) { const z0 = rand(4, 30); K.scaffold(b, side, z0, z0 + rand(18, 34)); }
        if (kind === 'midtown') {
          if (chance(0.5)) { const z = rand(10, 60); take(z, 7); K.subwayEntrance(b, side * (EDGE + 3.6), -z, side); }
          if (chance(0.5)) { const z = rand(6, 74); if (take(z, 4)) K.cart(b, side * (EDGE + 4.4), -z); }
          for (let k = 0; k < 2; k++) if (chance(0.55)) K.kiosk(b, side * (EDGE + 1.2), -rand(6, 74));
          if (chance(0.5)) { const z = rand(6, 70); if (take(z, 3)) K.newsBoxes(b, side * (EDGE + 6.2), -z, side); }
          if (chance(0.5)) K.mailbox(b, side * (EDGE + 1.2), -rand(6, 74));
          K.walkSignal(b, side * (EDGE + 1.1), -rand(2, 5), side);
          K.streetSign(b, side * (EDGE + 1.0), -rand(66, 74));
        } else if (kind === 'brownstone') {
          if (chance(0.5)) { const z = rand(8, 50); take(z + 3, 6); K.citibikes(b, side * (EDGE + 5.6), z, randi(5, 9)); }
          if (chance(0.5)) K.trash(b, side * (EDGE + 1.4), -rand(6, 74));
          K.streetSign(b, side * (EDGE + 1.0), -rand(2, 8));
        } else if (kind === 'soho') {
          if (chance(0.4)) { const z = rand(6, 74); if (take(z, 4)) K.cart(b, side * (EDGE + 4.4), -z, 'hotdog'); }
          K.streetSign(b, side * (EDGE + 1.0), -rand(2, 8));
        } else for (let z = rand(4, 10); z < CHUNK_LEN - 4; z += rand(5, 8)) { take(z, 2.5); K.cafe(b, side * (EDGE + 5.6), -z); }
        // cabs, squad cars and hydrants along the curb
        for (let z = rand(5, 20); z < CHUNK_LEN - 4; z += rand(14, 30)) {
          if (!take(z, 3.5)) continue;
          const x = side * (EDGE + 4.9), q = Math.random();
          if (q < 0.45) K.taxi(b, x, -z); else if (q < 0.58) K.nypd(b, x, -z); else K.hydrant(b, x, -z);
        }
        K.crowd(b, side * (EDGE + 1.0), side * (EDGE + 6.4), 2, CHUNK_LEN - 2, kind === 'brownstone' ? randi(3, 7) : randi(6, 12), 0.6);
        if (chance(0.32)) {   // Con Ed steam stack, or steam pouring out of a manhole
          const x = side * (EDGE + 2.6), z = rand(10, 70);
          if (take(z, 3)) { if (chance(0.5)) K.steamStack(b, x, -z); else K.manholeSteam(b, x, -z); }
        }
      }
      if (kind === 'italy') { K.festaArch(b, -rand(12, 22)); K.festaArch(b, -rand(54, 64)); K.bulbString(b, 30, 36); K.bulbString(b, 40, 47); }
      if (chance(0.08)) K.fdny(b, pick([-1, 1]) * (EDGE + 4.9), -rand(14, 66));
      if (chance(0.28)) { // elevated steel structure crossing over the tracks
        const z0 = -rand(10, 40), green = '#3d6a52';
        for (let k = 0; k < 3; k++) {
          const z = z0 - k * 12;
          for (const s of [-1, 1]) b.box(VC.metal, green, s * (EDGE + 0.7), 3.8, z, 0.5, 7.6, 0.5);
          b.box(VC.metal, green, 0, 7.6, z, 2 * EDGE + 2.4, 0.7, 0.6);
          for (let x = -4; x <= 4; x += 2) b.box(VC.glow, hdr('#ffe9b0', 3), x, 7.2, z, 0.4, 0.06, 0.25);
        }
        for (const s of [-1, 1]) b.box(VC.metal, green, s * (EDGE + 0.7), 8.2, z0 - 12, 0.9, 0.8, 26);
        b.box(VC.metal, '#2a3a32', 0, 8.6, z0 - 12, 2 * EDGE + 2.2, 0.3, 26);
      }
      return b.build();
    };

    // ---------- landmarks ----------
    const ADS = [
      { bg: ['#ff2a6d', '#7b2ff7'], text: 'CITY DASH', sub: 'RUN THE CITY', icon: 'bolt' },
      { bg: ['#00c2ff', '#0040ff'], text: 'SODA POP', sub: 'ICE COLD', icon: 'bubbles' },
      { bg: ['#ffb000', '#ff3d00'], text: 'BROADWAY', sub: 'TONIGHT 8PM', icon: 'stars' },
      { bg: ['#12c27e', '#04402c'], text: 'NOODLES', sub: 'OPEN 24/7', icon: 'bowl' },
      { bg: ['#1a1a1a', '#3a0a0a'], text: 'BREAKING', sub: 'LIVE FROM TIMES SQ', icon: 'bar', fg: '#ff3b3b' },
      { bg: ['#ff5fa2', '#ffd23d'], text: 'BIG APPLE', sub: 'NEW YORK CITY', icon: 'apple' },
      { bg: ['#5a00ff', '#00e5ff'], text: 'LIVE MUSIC', sub: 'ALL NIGHT LONG', icon: 'eq' },
      { bg: ['#f2f4ff', '#a9b8ff'], text: 'SUPER KICKS', sub: 'JUMP HIGHER', icon: 'shoe', fg: '#141414' },
    ];
    const CW = 384, CH = 240;
    const adTex = canvasTex(CW * ADS.length, CH, (g) => {
      ADS.forEach((a, i) => {
        const x0 = i * CW;
        const gr = g.createLinearGradient(x0, 0, x0 + CW, CH); gr.addColorStop(0, a.bg[0]); gr.addColorStop(1, a.bg[1]);
        g.fillStyle = gr; g.fillRect(x0, 0, CW, CH);
        g.save(); g.beginPath(); g.rect(x0, 0, CW, CH); g.clip();
        g.globalAlpha = 0.35; g.fillStyle = '#ffffff';
        if (a.icon === 'bubbles') for (let k = 0; k < 18; k++) { g.beginPath(); g.arc(x0 + rand(0, CW), rand(0, CH), rand(4, 22), 0, 7); g.fill(); }
        if (a.icon === 'stars') for (let k = 0; k < 14; k++) { g.font = `${randi(18, 40)}px sans-serif`; g.fillText('★', x0 + rand(0, CW), rand(20, CH)); }
        if (a.icon === 'eq') for (let k = 0; k < 16; k++) { const hh = rand(30, 180); g.fillRect(x0 + 10 + k * 23, CH - hh, 16, hh); }
        if (a.icon === 'bolt') for (let k = 0; k < 7; k++) g.fillRect(x0 + rand(0, CW), rand(0, CH), rand(60, 160), 4);
        if (a.icon === 'bar') { g.globalAlpha = 0.9; g.fillStyle = '#ff2a2a'; g.fillRect(x0, CH - 52, CW, 52); }
        if (a.icon === 'apple') { g.globalAlpha = 0.5; g.fillStyle = '#ff2a2a'; g.beginPath(); g.arc(x0 + CW * 0.8, CH * 0.5, 70, 0, 7); g.fill(); }
        if (a.icon === 'bowl') { g.globalAlpha = 0.5; g.beginPath(); g.arc(x0 + CW * 0.82, CH * 0.45, 60, 0, Math.PI); g.fill(); }
        if (a.icon === 'shoe') { g.globalAlpha = 0.25; g.fillStyle = '#ff3df0'; g.fillRect(x0 + 230, 120, 130, 50); g.fillRect(x0 + 230, 90, 70, 40); }
        g.restore();
        g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
        g.fillStyle = a.fg || '#ffffff';
        g.font = '900 64px "Russo One", "Arial Black", sans-serif';
        const m = g.measureText(a.text).width, sc = Math.min(1, (CW - 40) / m);
        g.save(); g.translate(x0 + 20, 128); g.scale(sc, 1); g.fillText(a.text, 0, 0); g.restore();
        g.font = '700 24px "Chakra Petch", sans-serif'; g.globalAlpha = 0.9;
        g.fillText(a.sub, x0 + 22, 168);
        g.globalAlpha = 1;
      });
    }, { repeat: false });
    const screen = screenMat(adTex, ADS.length, 1.35);
    const tickerTex = canvasTex(2048, 64, (g, w, h) => {
      g.fillStyle = '#050505'; g.fillRect(0, 0, w, h);
      g.font = '700 40px "Chakra Petch", "PingFang SC", sans-serif'; g.textBaseline = 'middle'; g.fillStyle = '#ff3b3b';
      g.fillText('  ★ WELCOME TO TIMES SQUARE ★ 纽约 · 时代广场 ★ CITY DASH LIVE ★ RECORD RUN TONIGHT ★ 雨夜霓虹 ★ NYC  ', 0, h / 2);
    });
    tickerTex.wrapS = THREE.RepeatWrapping;
    const tickerMat = basic({ map: tickerTex, color: hdr('#ffffff', 1.6) });
    const panel = (b, x, y, z, side, w, h) => b.add(G.plane, screen, x, y, z, w, h, 1, 0, -side * Math.PI / 2, 0, screenTint());
    const taxi = (b, x, z) => {
      b.block(VC.solid, '#f5c400', x, 0.35, z, 1.9, 0.75, 4.2);
      b.block(VC.solid, '#f5c400', x, 1.1, z + 0.3, 1.7, 0.6, 2.2);
      b.box(VC.glow, hdr('#ffffff', 1.4), x, 1.45, z + 0.3, 1.72, 0.3, 1.6);
      b.box(VC.glow, hdr('#fff4c0', 2.5), x, 1.85, z + 0.3, 0.6, 0.16, 0.25);
    };

    const timesSquare = () => {
      const b = new Batcher();
      for (const side of [-1, 1]) {
        farGround(b, side, '#121116');
        let z = 0;
        const zEnd = side < 0 ? 59 : CHUNK_LEN;
        while (z < zEnd - 6) {
          const len = Math.min(rand(13, 21), zEnd - z), d = rand(10, 16), h = rand(38, 72), xIn = 11 + rand(0, 0.8);
          const cx = side * (xIn + d / 2), cz = -(z + len / 2), face = side * xIn - side * 0.12;
          b.addM(buildingGeo(d, h, len, glass, 1.3, 2.6), glassMat, at(cx, 0, cz), pick(['#6d7390', '#59607a', '#7a6d8a']));
          let y = 6.2;
          while (y < h - 8) {
            const sh = rand(5, 11);
            panel(b, face, y + sh / 2, cz + rand(-0.8, 0.8), side, len - rand(1.2, 3), sh);
            y += sh + rand(0.5, 2.2);
          }
          b.box(VC.glow, hdr(pick(NEON), 2.2), face - side * 0.05, h / 2, cz - len / 2 + 0.5, 0.08, h - 6, 0.3);
          b.box(VC.glow, hdr(pick(['#ffd9a0', '#ff9ad5', '#9fd8ff']), 0.9), face + side * 0.05, 1.6, cz, 0.04, 2.6, len - 1.5);
          z += len + rand(0.4, 1.2);
        }
        b.add(G.plane, tickerMat, side * (11 - 0.25), 4.6, -CHUNK_LEN / 2, CHUNK_LEN - 2, 1.1, 1, 0, -side * Math.PI / 2);
        for (let k = 0; k < 9; k++) signPlane(b, side * (11 - 0.35), 5.6 + (k % 2) * 0.4, -4 - k * 8.5, side, 3.6);
        people(b, side * (EDGE + 1.4), side * (EDGE + 6.6), 2, CHUNK_LEN - 2, 34);
        for (let z = 6; z < CHUNK_LEN - 6; z += rand(10, 16)) taxi(b, side * (EDGE + 5.4), -z);
        for (let z = 3; z < CHUNK_LEN; z += 14) lamp(b, side * (EDGE + 0.9), -z, side, { light: '#ffffff', k: 3, h: 6 });
      }
      // One Times Square with the New Year's ball
      const tx = -16.2, tz = -66;
      b.addM(buildingGeo(10, 64, 9, glass, 1.3, 2.6), glassMat, at(tx, 0, tz), '#4a4f66');
      b.addM(buildingGeo(12, 30, 7, glass, 1.3, 2.6), glassMat, at(-17, 0, -76.5), '#59607a');
      panel(b, -11.1, 14, -76.5, -1, 6, 9);
      for (let y = 9; y < 58; y += 8.6) {
        panel(b, tx + 5.12, y, tz, -1, 8.4, 7.6);
        b.add(G.plane, screen, tx, y, tz + 4.62, 9.4, 7.6, 1, 0, 0, 0, screenTint());
      }
      b.cyl(VC.metal, '#b8bfcc', tx, 70, tz, 0.18, 12);
      b.add(new THREE.IcosahedronGeometry(0.5, 1), VC.glow, tx, 76.5, tz, 3.4, 3.4, 3.4, 0, 0, 0, hdr('#cfe8ff', 2.6));
      b.add(G.sph, VC.glowAdd, tx, 76.5, tz, 7, 7, 7, 0, 0, 0, hdr('#7fb8ff', 0.12));
      // TKTS red steps
      for (let k = 0; k < 9; k++) b.box(VC.glow, hdr('#ff2244', 0.75 + k * 0.05), EDGE + 4.2, 0.22 + k * 0.42, -38 - k * 0.75, 4.6, 0.44, 0.75);
      b.box(VC.solid, '#1a1418', EDGE + 4.2, 1.9, -38 - 9 * 0.75 + 0.2, 4.6, 3.8, 0.6);
      // green street sign
      const sgn = basic({ map: textTex('TIMES SQ', { w: 512, h: 128, color: '#ffffff', bg: '#0b6b3a', border: '#ffffff', size: 0.5 }), color: hdr('#ffffff', 1.1) });
      b.cyl(VC.metal, '#3a3f48', EDGE + 1.2, 2.5, -20, 0.08, 5);
      b.add(G.plane, sgn, EDGE + 1.2, 4.7, -20, 2.6, 0.65, 1, 0, -Math.PI / 2);
      b.add(G.plane, sgn, EDGE + 1.2, 4.7, -20.01, 2.6, 0.65, 1, 0, Math.PI / 2);
      return b.build();
    };

    const harbor = waterMat('#16203a', 10);
    const statueMat = std({ color: '#6aa592', roughness: 0.6, metalness: 0.25, emissive: '#1f4a3e', emissiveIntensity: 1 });
    const graniteMat = std({ color: '#8e897c', roughness: 0.8, emissive: '#2a2216', emissiveIntensity: 0.8 });
    const torch = basic({ color: hdr('#ffc94d', 5) });
    const statue = (b, x, y0, z, s) => {
      b.cyl(VC.solid, '#2f3a2c', x, y0 + 0.6, z, 30 * s, 1.6);
      const star = new THREE.Shape();
      for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, r = (i % 2 ? 13 : 19) * s; i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      const sg = new THREE.ExtrudeGeometry(star, { depth: 5 * s, bevelEnabled: false }); sg.rotateX(-Math.PI / 2);
      b.addM(sg, graniteMat, at(x, y0 + 1.2, z));
      let y = y0 + 1.2 + 5 * s;
      for (const [w, h] of [[16, 9], [12.5, 15], [14, 2], [11, 5]]) { b.add(G.box, graniteMat, x, y + h * s / 2, z, w * s, h * s, w * s); y += h * s; }
      // figure faces +x (toward the track); her right arm is on the +z side
      b.add(TAPER, statueMat, x, y + 11 * s, z, 11 * s, 22 * s, 11 * s);
      b.add(TAPER, statueMat, x, y + 26 * s, z, 7.4 * s, 9 * s, 7.4 * s);
      b.add(G.sph, statueMat, x + 0.4 * s, y + 33.2 * s, z, 4 * s, 4.6 * s, 4 * s);
      b.cyl(statueMat, 0, x, y + 35 * s, z, 2.3 * s, 1.1 * s);
      for (let k = 0; k < 7; k++) {
        const a = (k - 3) * 0.42;
        b.add(G.cone, statueMat, x + 0.5 * s, y + 36 * s + Math.cos(a) * 2.2 * s, z + Math.sin(a) * 2.6 * s, 0.7 * s, 4.4 * s, 0.7 * s, a, 0, 0);
      }
      b.add(G.cyl, statueMat, x + 0.8 * s, y + 36 * s, z + 3.9 * s, 1.7 * s, 13 * s, 1.7 * s, 0.22, 0, -0.12);
      b.add(TAPER, statueMat, x + 1.6 * s, y + 43 * s, z + 5.3 * s, 2.2 * s, 2.6 * s, 2.2 * s, Math.PI, 0, 0);
      b.add(G.cone, torch, x + 1.6 * s, y + 45.6 * s, z + 5.3 * s, 1.8 * s, 3.2 * s, 1.8 * s);
      b.add(G.sph, VC.glowAdd, x + 1.6 * s, y + 45.6 * s, z + 5.3 * s, 9 * s, 9 * s, 9 * s, 0, 0, 0, hdr('#ffb347', 0.25));
      b.add(G.box, statueMat, x + 2.4 * s, y + 24 * s, z - 3.6 * s, 1.4 * s, 7.5 * s, 4.6 * s, -0.25, 0, 0.1);
      b.add(G.box, statueMat, x + 2.2 * s, y + 25 * s, z - 2.6 * s, 1.6 * s, 7 * s, 1.6 * s, 0.5, 0, 0);
      for (const dz of [-14, 14]) b.add(G.cone, VC.glowAdd, x + 10 * s, y0 + 20 * s, z + dz * s, 6 * s, 36 * s, 6 * s, 0, 0, dz > 0 ? 0.35 : -0.35, hdr('#9fe0d0', 0.05));
    };
    const libertyHarbor = () => {
      const b = new Batcher();
      b.add(G.plane, harbor, -90, -1.6, -65, 170, 130, 1, -Math.PI / 2);
      b.box(VC.solid, '#5a5a62', -(EDGE + 7.2), -0.8, -CHUNK_LEN / 2, 0.8, 1.8, CHUNK_LEN);
      for (let z = 1; z < CHUNK_LEN; z += 2.5) b.box(VC.metal, '#1f1f24', -(EDGE + 7), 0.6, -z, 0.08, 1.2, 0.08);
      b.box(VC.metal, '#1f1f24', -(EDGE + 7), 1.18, -CHUNK_LEN / 2, 0.1, 0.1, CHUNK_LEN);
      for (let z = 4; z < CHUNK_LEN; z += 16) lamp(b, -(EDGE + 5.6), -z, -1, { light: '#ffe0a8', k: 3.2, h: 5 });
      people(b, -(EDGE + 1.5), -(EDGE + 6.2), 2, CHUNK_LEN - 2, 14);
      statue(b, -60, -1.6, -102, 0.95);
      // Staten Island ferry
      b.block(VC.solid, '#e8862a', -46, -1.6, -18, 7, 2.2, 22);
      b.block(VC.solid, '#e8862a', -46, 0.6, -18, 6, 2, 17);
      b.box(VC.glow, hdr('#ffe0a8', 2), -46, 1.6, -18, 6.05, 0.6, 15);
      b.box(VC.glow, hdr('#ffe0a8', 2), -46, -0.4, -18, 7.05, 0.5, 19);
      farGround(b, 1, '#121116');
      buildingRow(b, 1, types, { x0: 11, depth: [9, 15] });
      for (let z = 6; z < CHUNK_LEN; z += 17) lamp(b, EDGE + 1.5, -z, 1, { light: '#ffcf8a', k: 3.4 });
      return b.build();
    };

    const bridgeStone = std({ color: '#8f8474', roughness: 0.85, emissive: '#3a2a18', emissiveIntensity: 0.55 });
    const brooklyn = () => {
      const b = new Batcher();
      const W = EDGE + 7;
      for (const side of [-1, 1]) {
        b.add(G.plane, harbor, side * (W + 80), -28, -CHUNK_LEN / 2, 160, CHUNK_LEN + 0.5, 1, -Math.PI / 2);
        b.box(VC.metal, '#3a3536', side * (W + 0.3), -1.4, -CHUNK_LEN / 2, 0.6, 3, CHUNK_LEN);
        for (let z = 0.5; z < CHUNK_LEN; z += 1.6) b.add(G.box, VC.metal, side * (W + 0.3), 0.7, -z, 0.06, 1.4, 0.06, 0.6, 0, 0, '#4a4446');
        b.box(VC.metal, '#4a4446', side * (W + 0.3), 1.4, -CHUNK_LEN / 2, 0.12, 0.12, CHUNK_LEN);
        for (let z = 6; z < CHUNK_LEN; z += 14) if (Math.abs(z - 36) > 7) lamp(b, side * (W - 0.5), -z, side, { light: '#ffe0a8', k: 3.2, h: 4.6 });
      }
      b.box(VC.solid, '#241f20', 0, -1.7, -CHUNK_LEN / 2, 2 * W, 3, CHUNK_LEN);
      // stone tower with twin pointed arches straddling the deck
      const tz = -36, top = 46, pier = 7, half = 13;
      for (const s of [-1, 1]) {
        b.add(G.box, bridgeStone, s * (half - pier / 2), (top - 28) / 2, tz, pier, top + 28, 10);
        for (const fz of [5.05, -5.05]) {
          b.box(VC.solid, '#3e352c', s * (half - pier / 2), 30, tz + fz, 2.4, 9, 0.1);
          b.add(G.cone4, VC.solid, s * (half - pier / 2), 35.4, tz + fz, 2.4, 2, 0.12, 0, 0, 0, '#3e352c');
        }
      }
      b.add(G.box, bridgeStone, 0, (top + 22) / 2, tz, 2 * (half - pier), top - 22, 10);
      for (const s of [-1, 1]) b.add(G.box, bridgeStone, s * 3.3, 19.6, tz, 3, 9, 10, 0, 0, s * 0.62);
      b.add(G.box, bridgeStone, 0, top + 0.6, tz, 2 * half + 1, 1.2, 11);
      b.box(VC.glow, hdr('#ffd9a0', 1.6), 0, 1.2, tz + 5.1, 2 * (half - pier) - 1, 0.12, 0.05);
      // main cables, suspenders and the diagonal stays (with necklace lights)
      for (const cx of [-10.5, -7, 7, 10.5]) {
        let prev = null;
        for (let z = 0; z >= -CHUNK_LEN; z -= 2) {
          const dz = Math.abs(z - tz), y = 4 + (top - 4) * Math.pow(Math.max(0, 1 - dz / 70), 2);
          if (prev) b.add(G.box, VC.metal, cx, (y + prev[1]) / 2, (z + prev[0]) / 2, 0.22, 0.22, Math.hypot(2, y - prev[1]) + 0.05, Math.atan2(y - prev[1], 2), 0, 0, '#5a5052');
          if (z % 4 === 0 && y > 2.2) b.box(VC.metal, '#5a5052', cx, (y + 1.4) / 2, z, 0.05, y - 1.4, 0.05);
          if (z % 6 === 0) b.sph(VC.glow, hdr('#fff1c4', 3.2), cx, y + 0.3, z, 0.22, true);
          prev = [z, y];
        }
        for (let k = 1; k <= 6; k++) for (const dir of [-1, 1]) {
          const ez = tz + dir * k * 6, len = Math.hypot(k * 6, top - 3);
          b.add(G.box, VC.metal, cx, (top + 3) / 2, (tz + ez) / 2, 0.06, 0.06, len, dir * Math.atan2(top - 3, k * 6), 0, 0, '#5a5052');
        }
      }
      return b.build();
    };

    const LM = nyLandmarks(K, {
      types, signPlane, glass, glassMat,
      row: (b, side, z0, z1, { h } = {}) => { if (z1 - z0 > 3) buildingRow(b, side, h ? types.map((t) => ({ ...t, h })) : types, { x0: 11, depth: [9, 15], z0, z1 }); },
      lamp: (b, x, z, side) => lamp(b, x, z, side, { light: '#ffcf8a', k: 3.4 }),
    });

    const sky = skyline({
      tex: skyTex({ wall: '#090b1c', lit: ['#ffd27a', '#bfe3ff', '#ffffff', '#ff9ad5'], chance: 0.3 }),
      colors: ['#ffffff', '#c7c2ff', '#a59ad9', '#8f84c9'], count: 140, h: [50, 210], k: 1.7,
      gapAhead: 0.05, follow: 190,
      heightCap: (a, rr) => (Math.abs(a) < 0.2 ? 4.5 + rr * Math.tan(0.07) : Infinity),
      landmarks: [
        (b, mat) => { // Empire State Building at the far end of the track, its crown lit red, white and blue
          const [x, z, ry] = polar(0, 900), base = -95;
          [[84, -10], [62, 120], [48, 160], [34, 182]].forEach(([w, top], i, arr) => {
            const prev = i ? arr[i - 1][1] : base;
            b.addM(buildingGeo(w, top - prev, w * 0.8, { cols: 8, rows: 16 }, 3.4, 4.2), mat, at(x, prev, z, ry), '#ffffff');
          });
          b.add(G.box, SKY_VC, x, 186, z, 26, 8, 21, 0, ry, 0, hdr('#ff3a4a', 1.9));
          b.add(G.box, SKY_VC, x, 193, z, 20, 6, 16, 0, ry, 0, hdr('#f4f6ff', 1.7));
          b.add(G.box, SKY_VC, x, 199, z, 14, 6, 11, 0, ry, 0, hdr('#4d7bff', 2.1));
          b.add(G.cyl, SKY_VC, x, 208, z, 6, 12, 6, 0, 0, 0, hdr('#cfe0ff', 1.4));
          b.add(G.cyl, SKY_VC, x, 236, z, 2.2, 44, 2.2, 0, 0, 0, hdr('#e8ecff', 1.6));
          b.sph(SKY_VC, hdr('#ff2a2a', 6), x, 259, z, 3);
        },
        (b, mat) => { // Chrysler
          const [x, z, ry] = polar(17, 720), base = -95;
          b.addM(buildingGeo(36, 200 - base, 36, { cols: 8, rows: 16 }, 3.4, 4.2), mat, at(x, base, z, ry), '#d9d4ff');
          for (let k = 0; k < 6; k++) {
            const s = 30 - k * 4.5, y = 200 + k * 11;
            b.add(G.box, SKY_VC, x, y + 5, z, s, 10, s, 0, ry + Math.PI / 4, 0, '#2a2a3a');
            b.add(G.box, SKY_VC, x, y + 9.6, z, s + 0.6, 1.2, s + 0.6, 0, ry + Math.PI / 4, 0, hdr('#fff3d6', 3));
          }
          b.add(G.cone4, SKY_VC, x, 300, z, 8, 50, 8, 0, ry, 0, hdr('#d7dcf0', 1.8));
        },
        (b) => { // One World Trade Center
          const [x, z, ry] = polar(-26, 820);
          const g = new THREE.CylinderGeometry(15, 32, 420, 4, 1); g.rotateY(Math.PI / 4); g.translate(0, 210 - 95, 0);
          b.addM(g, SKY_VC, at(x, 0, z, ry), '#1b2340');
          b.add(G.cyl, SKY_VC, x, 370, z, 2.4, 80, 2.4, 0, 0, 0, hdr('#ffffff', 2.4));
          b.sph(SKY_VC, hdr('#ffffff', 7), x, 412, z, 3);
          for (let y = -60; y < 320; y += 38) b.add(G.box, SKY_VC, x, y, z, 30 - (y + 95) * 0.04, 0.8, 0.8, 0, ry, 0, hdr('#7fb3ff', 1.6));
        },
        (b) => { // Statue of Liberty
          const [x, z, ry] = polar(57, 560), base = -95;
          b.add(G.box, SKY_VC, x, base + 40, z, 36, 80, 36, 0, ry, 0, '#1f2638');
          b.add(G.cone8, SKY_VC, x, 0, z, 26, 80, 26, 0, ry, 0, '#3e6b62');
          b.sph(SKY_VC, '#3e6b62', x, 46, z, 12);
          b.add(G.box, SKY_VC, x + 9, 64, z, 4, 34, 4, 0, ry, 0.2, '#3e6b62');
          b.sph(SKY_VC, hdr('#ffc94d', 6), x + 12.5, 84, z, 4.5);
          for (let k = 0; k < 7; k++) b.add(G.box, SKY_VC, x, 56, z, 1.2, 12, 1.2, 0, ry, (k - 3) * 0.4, '#3e6b62');
        },
        (b) => { // Brooklyn Bridge
          for (const deg of [-64, -80]) {
            const [x, z, ry] = polar(deg, 600);
            b.add(G.box, SKY_VC, x, 0, z, 18, 190, 10, 0, ry, 0, '#3a2f3a');
            b.add(G.box, SKY_VC, x, 40, z, 6, 30, 11, 0, ry, 0, '#120e1c');
            b.add(G.box, SKY_VC, x, 60, z, 18.2, 1, 10.2, 0, ry, 0, hdr('#ffd27a', 2.4));
          }
          const [x1, z1] = polar(-64, 600), [x2, z2] = polar(-80, 600);
          const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, len = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(x2 - x1, z2 - z1);
          b.add(G.box, SKY_VC, mx, -20, mz, 4, 5, len, 0, ang, 0, '#2a2236');
          for (let k = 0; k < 18; k++) {
            const t = k / 17;
            b.add(G.sph, SKY_VC, x1 + (x2 - x1) * t, -14 + 70 * Math.pow(Math.abs(t - 0.5) * 2, 2), z1 + (z2 - z1) * t, 2, 2, 2, 0, 0, 0, hdr('#ffe9b0', 3.5));
          }
        },
      ],
    });

    const graffiti = Array.from({ length: 4 }, () => std({ map: graffitiTex(), transparent: true, roughness: 0.55, metalness: 0.2, depthWrite: false }));
    const trainStyle = {
      body: '#aeb5c2', bodyMetal: true, roof: '#8d94a1', under: '#1b1d22', stripe: '#2f6bff', stripe2: '#ff6319',
      window: '#fff1c4', windowK: 2.0, frame: '#1d2027', light: '#fff4d6', sign: '#ff9a3c', badge: '#ff6319',
      doors: true, door: '#8f96a3', graffiti,
      rampMat: std({ map: stripeTex('#262832', '#ffcc00', 6), roughness: 0.6 }), rampGlow: '#00e5ff',
      // clean stainless cars with a route bullet come at you
      movingStyle: { body: '#c9ced6', roof: '#a8aeb8', stripe: '#3a3e46', stripe2: null, graffiti: null, badge: pick(LINES).color, sign: '#ffb03a', window: '#eaf4ff', windowK: 1.6 },
    };
    const barrier = barrierStyle({ c1: '#ff6a00', c2: '#ffffff', label: 'DETOUR', signBg: '#ff6a00', signFg: '#141414', glow: '#ff3df0' });
    barrier.lowBarMat = K.nypdBar;   // blue NYPD sawhorses
    barrier.lowExtra = (b) => { for (const x of [-0.95, 0.95]) for (const dz of [-0.3, 0.3]) b.add(G.box, VC.solid, x, 0.5, dz * 0.5, 0.08, 1.05, 0.08, dz, 0, 0, '#1f3f8a'); };

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: [
        { name: '时代广场', en: 'TIMES SQUARE', build: timesSquare },
        LM.landmarks.centralPark, LM.landmarks.grandCentral, LM.landmarks.flatiron, LM.landmarks.wallStreet,
        { name: '布鲁克林大桥', en: 'BROOKLYN BRIDGE', build: brooklyn },
        { name: '自由女神像', en: 'STATUE OF LIBERTY', build: libertyHarbor },
        LM.landmarks.coney,
      ],
      coinGeo: coinGeometry('token'), coinMat: coinMaterial('#e8b84a', '#c88a20'),
      update(t) {
        K.update(t); LM.update(t);
        screen.uniforms.time.value = t;
        tickerTex.offset.x = t * 0.06;
        harbor.userData.scroll.offset.set(t * 0.01, t * 0.025);
        torch.color.set('#ffc94d').multiplyScalar(4.4 + Math.sin(t * 13) * 0.5 + Math.sin(t * 7.3) * 0.4);
        const f = Math.sin(t * 31) > 0.97 ? 0.5 : 1;
        signMat.color.setScalar((1.25 + Math.sin(t * 3) * 0.15) * f);
      },
    };
  },
};
