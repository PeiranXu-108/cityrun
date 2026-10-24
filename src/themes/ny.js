// New York at dusk on a summer evening: the sun going down at the far end of the street beside the Empire State
// Building (Manhattanhenge), gold on one side of the canyon and blue shade on the other, the windows and the neon coming
// on. Midtown walk-ups with fire escapes, water towers, rooftop billboards and bars, sidewalk sheds, subway entrances,
// carts, bodegas and newsstands; Brooklyn brownstones, SoHo cast-iron lofts, Little Italy's light arches and Chinatown;
// cabs, buses and the ice-cream van; graffiti subway cars, silver trains coming at you. Thirteen landmarks (see
// ny_landmarks.js and ny_districts.js); the icons on the skyline and in the scenes are modelled in ny_icons.js.
import { THREE, Batcher, VC, G, std, basic, hdr, windowTex, signAtlas, planeUV, canvasTex, stripeTex, buildingGeo,
  CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { buildTrain, buildLowBarrier, buildHighBarrier, barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, facadeMat, buildingRow, lamp, skyline, skyTex, SKY_VC, polar, at, EDGE, DISC,
  farGround, screenMat, screenTint, textTex, people, TAPER, waterMat } from './common.js';
import { makeKit, LINES } from './ny_kit.js';
import { nyLandmarks, flagTex } from './ny_landmarks.js';
import { nyDistricts } from './ny_districts.js';
import { empireState, esbTex, liberty, chrysler, oneWTC, woolworth, citigroup, park432, vanderbilt, hudsonYards, bakeShade, graniteTex } from './ny_icons.js';
import { tiledBox } from './beijing_kit.js';

const NEON = ['#ff3df0', '#00e5ff', '#ffe23d', '#39ff88', '#ff6a3d', '#b26bff'];
const BLURB = '夏日傍晚的曼哈顿：夕阳正好落进街道尽头，挂在帝国大厦的剪影旁边（曼哈顿悬日）。街道一侧的楼面被晒成金色，另一侧沉进蓝色的阴影，窗户和霓虹一盏盏亮起来；路边停着黄色出租车、公交车和冰淇淋车，熟食店门口摆满鲜花，消防栓喷着水花，屋顶的水塔、广告牌和屋顶酒吧映在晚霞里，唐人街的红灯笼横过街头。从时代广场出发，经过洛克菲勒中心的金色普罗米修斯和对面的圣帕特里克大教堂，穿过中央公园、中央车站与克莱斯勒大厦、熨斗大厦，在高线公园的花草间跑向哈德逊城市广场的 Vessel，钻过华盛顿广场的拱门，路过世贸中心的飞鸟车站和华尔街的铜牛，冲过布鲁克林大桥的哥特式石拱，在 DUMBO 的石板街上看曼哈顿大桥框住帝国大厦；临近港口时，街道尽头的帝国大厦换成了举着火炬的自由女神，最后一路跑到康尼岛的摩天轮下。';
const SIGHTS = ['时代广场', '洛克菲勒中心 · 圣帕特里克大教堂', '中央公园', '中央车站 · 克莱斯勒大厦', '熨斗大厦', '高线公园 · 哈德逊城市广场', '华盛顿广场', '世贸中心 · 飞鸟车站', '华尔街', '布鲁克林大桥', 'DUMBO · 曼哈顿大桥', '自由女神像', '康尼岛'];

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
  id: 'ny', name: '纽约', en: 'NEW YORK', tagline: '曼哈顿悬日 · 华灯初上',
  blurb: BLURB,
  sights: SIGHTS,
  accent: '#ff7a45', accent2: '#5ec8ff', portal: '#ff7a45',
  // dusk: the sun going down at the far end of the street (it turns with the skyline, see main.js), gold on one side
  // of the canyon, blue shade on the other
  sky: { top: '#0b1a50', mid: '#3a4ca0', bot: '#ff9a5a', glow: '#ff7040', glowK: 0.42, sun: '#ff8a4a', sunK: 1.5,
    sunDir: [-0.042, 0.046, -1], sunSize: 0.00074, cloud: 0.32, cloudColor: '#5a4a7a', horizon: -0.07, stars: false, follow: true },
  envSky: { bot: '#46487a', glow: '#8a6a9a', glowK: 0.2, sunK: 0.5 },   // the shade side is lit by the blue half of the sky
  fog: { color: '#b87a74', near: 30, far: 270 },
  light: { hemiSky: '#8fa0ff', hemiGround: '#5a3c34', hemi: 0.85, dir: '#ffa462', dirK: 1.7, dirPos: [-0.9, 0.34, -0.6] },
  exposure: 1.0, bloom: { strength: 0.72, radius: 0.55, threshold: 0.86 },
  weather: [{ mode: 'float', count: 130, colors: ['#ffd890', '#ffe6b0', '#ffc070'], size: 0.16, k: 1.5, box: [44, 14, 90], speed: 1 }],
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
      K.shopWindow(b, x - info.side * 0.02, 1.4, info.z, info.side, Math.min(info.len - 1.5, 5), 2.2, pick(['#ffd9a0', '#ffb36b', '#9fd8ff']), 0.5);
      if (chance(0.8)) signPlane(b, x - info.side * 0.12, 4.3, info.z, info.side, Math.min(4, info.len - 1));
    };
    const types = [
      { mat: brickMat, tex: brick, colors: ['#ffffff', '#e0c9b9', '#c9a28c', '#b88576'], w: [7, 13], h: [13, 26], weight: 3,
        roof: (b, i) => {
          const r = Math.random();
          if (r < 0.4) waterTower(b, i);
          else if (r < 0.58 && i.h < 22) K.billboard(b, i);
          else if (r < 0.72 && i.h < 20) K.rooftopBar(b, i);
          else b.block(VC.solid, '#2a2c33', i.x, i.h, i.z, 2.5, 1.2, 2.5);
        },
        front: (b, i) => { if (chance(0.6)) fireEscape(b, i); if (chance(0.7)) K.acUnits(b, i); if (chance(0.18)) K.bodega(b, i); else shopFront(b, i); } },
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
      K.shopWindow(b, x - info.side * 0.02, 1.4, info.z, info.side, Math.min(info.len - 1.5, 5), 2.2, pick(['#ffcf8a', '#ffb36b', '#ffd9a0']), 0.55);
      if (chance(0.8)) signPlane(b, x - info.side * 0.12, 4.3, info.z, info.side, Math.min(4, info.len - 1), pick([0, 8, 10, 3]));
    };
    const italyTypes = [
      { ...types[0], front: (b, i) => { if (chance(0.6)) fireEscape(b, i); if (chance(0.5)) K.acUnits(b, i); italianFront(b, i); } },
      { ...types[1], front: (b, i) => italianFront(b, i) },
    ];
    // Chinatown: the same tenements, their ground floors full of signs in two scripts
    const chinaTypes = [
      { ...types[0], roof: (b, i) => { if (chance(0.45)) waterTower(b, i); }, front: (b, i) => { if (chance(0.75)) fireEscape(b, i); if (chance(0.6)) K.acUnits(b, i); K.chinaSign(b, i); } },
      { ...types[1], front: (b, i) => K.chinaSign(b, i) },
    ];
    // regular blocks: midtown, brownstone Brooklyn, SoHo lofts, Little Italy or Chinatown, sometimes crossed by the elevated line
    const decor = () => {
      const b = new Batcher();
      const r = Math.random(), kind = r < 0.36 ? 'midtown' : r < 0.56 ? 'brownstone' : r < 0.72 ? 'soho' : r < 0.86 ? 'italy' : 'chinatown';
      const shedSide = (kind === 'midtown' || kind === 'soho') && chance(0.45) ? pick([-1, 1]) : 0;
      for (const side of [-1, 1]) {
        farGround(b, side, '#121116');
        if (kind === 'midtown') buildingRow(b, side, types, { x0: 11, depth: [9, 15] });
        else if (kind === 'brownstone') K.brownstones(b, side, 0, CHUNK_LEN);
        else if (kind === 'soho') K.lofts(b, side, 0, CHUNK_LEN);
        else if (kind === 'italy') buildingRow(b, side, italyTypes, { x0: 11, depth: [9, 14] });
        else buildingRow(b, side, chinaTypes, { x0: 11, depth: [9, 14] });
        const busy = [];
        const take = (z, rr) => { if (busy.some((c) => Math.abs(c - z) < rr)) return false; busy.push(z); return true; };
        const free = (rr, z0 = 6, z1 = 74) => { for (let k = 0; k < 6; k++) { const z = rand(z0, z1); if (take(z, rr)) return z; } return null; };
        for (let z = rand(2, 10); z < CHUNK_LEN; z += 17) lamp(b, side * (EDGE + 1.5), -z, side, { light: '#ffcf8a', k: 3.4 });
        if (kind !== 'midtown' && kind !== 'chinatown') for (let z = rand(4, 9); z < CHUNK_LEN - 3; z += rand(10, 13)) K.tree(b, side * (EDGE + 3.1), -z, rand(0.72, 0.85), chance(kind === 'brownstone' ? 0.4 : 0.25));
        if (side === shedSide) { const z0 = rand(4, 30); K.scaffold(b, side, z0, z0 + rand(18, 34)); }
        let z;
        if (kind === 'midtown') {
          if (chance(0.5)) { z = rand(10, 60); take(z, 7); K.subwayEntrance(b, side * (EDGE + 3.6), -z, side); }
          if (chance(0.5) && (z = free(4)) !== null) K.cart(b, side * (EDGE + 4.4), -z);
          for (let k = 0; k < 2; k++) if (chance(0.55)) K.kiosk(b, side * (EDGE + 1.2), -rand(6, 74));
          if (chance(0.45) && (z = free(3)) !== null) K.newsBoxes(b, side * (EDGE + 6.2), -z, side);
          if (chance(0.35) && (z = free(3.5)) !== null) K.newsstand(b, side * (EDGE + 6.0), -z, side);
          if (chance(0.5)) K.mailbox(b, side * (EDGE + 1.2), -rand(6, 74));
          if (chance(0.3) && (z = free(8, 10, 66)) !== null) K.bus(b, side * (EDGE + 4.9), -z, pick([-1, 1]));
          K.walkSignal(b, side * (EDGE + 1.1), -rand(2, 5), side);
          K.streetSign(b, side * (EDGE + 1.0), -rand(66, 74));
        } else if (kind === 'brownstone') {
          if (chance(0.5)) { z = rand(8, 50); take(z + 3, 6); K.citibikes(b, side * (EDGE + 5.6), z, randi(5, 9)); }
          if (chance(0.5)) K.trash(b, side * (EDGE + 1.4), -rand(6, 74));
          if (chance(0.3) && (z = free(5)) !== null) K.hydrantSpray(b, side * (EDGE + 4.9), -z, side);   // a hot evening
          K.streetSign(b, side * (EDGE + 1.0), -rand(2, 8));
        } else if (kind === 'soho') {
          if (chance(0.4) && (z = free(4)) !== null) K.cart(b, side * (EDGE + 4.4), -z, 'hotdog');
          K.streetSign(b, side * (EDGE + 1.0), -rand(2, 8));
        } else if (kind === 'italy') {
          for (let z2 = rand(4, 10); z2 < CHUNK_LEN - 4; z2 += rand(5, 8)) { take(z2, 2.5); K.cafe(b, side * (EDGE + 5.6), -z2); }
        } else {   // Chinatown: fruit stands, a pagoda phone booth, the crowds
          for (let k = 0; k < randi(2, 4); k++) if ((z = free(5)) !== null) K.fruitStand(b, side * (EDGE + 5.8), -z, side);
          if (chance(0.6) && (z = free(2)) !== null) K.pagodaBooth(b, side * (EDGE + 1.4), -z);
          K.streetSign(b, side * (EDGE + 1.0), -rand(2, 8), 6, pick([10, 11]));
        }
        // the summer street: the ice-cream van, dog walkers, pigeons, trash bags out at the curb
        if (chance(kind === 'brownstone' ? 0.2 : 0.1) && (z = free(7, 10, 66)) !== null) K.softee(b, side * (EDGE + 4.9), -z, side, pick([-1, 1]));
        if (chance(0.35)) K.dogWalker(b, side * (EDGE + rand(1.5, 4)), -rand(8, 72));
        if (chance(0.4)) K.pigeons(b, side * (EDGE + rand(1.5, 5)), -rand(6, 74));
        for (let k = 0; k < (kind === 'italy' ? 0 : randi(0, 2)); k++) if ((z = free(2.5)) !== null) K.bags(b, side * (EDGE + 0.95), -z);
        // cabs, squad cars and hydrants along the curb
        for (let z2 = rand(5, 20); z2 < CHUNK_LEN - 4; z2 += rand(12, 26)) {
          if (!take(z2, 3.5)) continue;
          const x = side * (EDGE + 4.9), q = Math.random();
          if (q < 0.55) K.taxi(b, x, -z2); else if (q < 0.66) K.nypd(b, x, -z2); else K.hydrant(b, x, -z2);
        }
        const n = { midtown: randi(14, 22), brownstone: randi(5, 9), soho: randi(9, 15), italy: randi(8, 13), chinatown: randi(14, 20) }[kind];
        K.crowd(b, side * (EDGE + 1.0), side * (EDGE + 6.4), 2, CHUNK_LEN - 2, n);
        if (chance(0.32)) {   // Con Ed steam stack, or steam pouring out of a manhole
          const x = side * (EDGE + 2.6), z2 = rand(10, 70);
          if (take(z2, 3)) { if (chance(0.5)) K.steamStack(b, x, -z2); else K.manholeSteam(b, x, -z2); }
        }
      }
      if (kind === 'italy') { K.festaArch(b, -rand(12, 22)); K.festaArch(b, -rand(54, 64)); K.bulbString(b, 30, 36); K.bulbString(b, 40, 47); }
      if (kind === 'chinatown') for (const z of [14, 34, 54, 72]) if (chance(0.75)) K.lanterns(b, -z - rand(-3, 3));
      if (chance(0.08)) K.fdny(b, pick([-1, 1]) * (EDGE + 4.9), -rand(14, 66));
      if (chance(0.28)) { // the elevated line crossing high over the tracks on its green steel bents
        const z0 = -rand(10, 40), green = '#3d6a52';
        for (let k = 0; k < 3; k++) {
          const z = z0 - k * 12;
          for (const s of [-1, 1]) b.box(VC.metal, green, s * (EDGE + 0.7), 7.1, z, 0.5, 14.2, 0.5);
          b.box(VC.metal, green, 0, 14.2, z, 2 * EDGE + 2.4, 0.7, 0.6);
          for (let x = -4; x <= 4; x += 2) b.box(VC.glow, hdr('#ffe9b0', 3), x, 13.8, z, 0.4, 0.06, 0.25);
        }
        for (const s of [-1, 1]) b.box(VC.metal, green, s * (EDGE + 0.7), 14.8, z0 - 12, 0.9, 0.8, 26);
        b.box(VC.metal, '#2a3a32', 0, 15.2, z0 - 12, 2 * EDGE + 2.2, 0.3, 26);
      }
      const g = b.build();
      g.userData.kind = kind;
      return g;
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
    const policeSign = basic({ map: textTex('POLICE · TIMES SQUARE', { w: 1024, h: 160, color: '#ffffff', glow: '#3d6bff', size: 0.5 }), transparent: true, color: hdr('#ffffff', 1.6) });
    const character = (b, x, z, kind) => {   // the costumed characters working the crowd
      const body = { elmo: '#e8202c', mouse: '#1a1a1a', spidey: '#c8202c' }[kind];
      if (kind === 'spidey') { K.person(b, x, z, { coat: body }); b.box(VC.solid, '#2a4ac8', x, 0.55, z, 0.32, 1.0, 0.26); return; }
      b.sph(VC.solid, body, x, 0.75, z, 0.5, true);
      b.sph(VC.solid, body, x, 1.55, z, 0.42, true);
      for (const e of [-1, 1]) b.sph(VC.solid, kind === 'elmo' ? '#ffffff' : body, x + e * (kind === 'elmo' ? 0.13 : 0.34), kind === 'elmo' ? 1.78 : 1.98, z + 0.3, kind === 'elmo' ? 0.1 : 0.2, true);
      if (kind === 'elmo') b.sph(VC.solid, '#ff8a1a', x, 1.55, z + 0.42, 0.11, true);
      else { b.sph(VC.solid, '#f2d8b8', x, 1.45, z + 0.32, 0.2, true); b.box(VC.solid, '#d8202c', x, 0.7, z, 0.9, 0.5, 0.9); }
    };
    const tickerTex = canvasTex(2048, 64, (g, w, h) => {
      g.fillStyle = '#050505'; g.fillRect(0, 0, w, h);
      g.font = '700 40px "Chakra Petch", "Helvetica Neue", Arial, sans-serif'; g.textBaseline = 'middle'; g.fillStyle = '#ff3b3b';
      g.fillText('  ★ WELCOME TO TIMES SQUARE ★ NEW YORK CITY ★ CITY DASH LIVE ★ MANHATTANHENGE ★ NYC  ', 0, h / 2);
    });
    tickerTex.wrapS = THREE.RepeatWrapping;
    const tickerMat = basic({ map: tickerTex, color: hdr('#ffffff', 1.6) });
    const panel = (b, x, y, z, side, w, h) => b.add(G.plane, screen, x, y, z, w, h, 1, 0, -side * Math.PI / 2, 0, screenTint());
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
        for (let z = 6; z < CHUNK_LEN - 6; z += rand(10, 16)) if (side > 0 || Math.abs(z - 30) > 6) K.taxi(b, side * (EDGE + 5.4), -z);
        for (let k = 0; k < 2; k++) character(b, side * rand(EDGE + 1.6, EDGE + 4.2), -rand(8, 70), pick(['elmo', 'mouse', 'spidey']));
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
      // the TKTS booth under its red glass steps, people sitting up them watching the screens
      for (let k = 0; k < 9; k++) b.box(VC.glow, hdr('#ff2244', 0.75 + k * 0.05), EDGE + 4.2, 0.22 + k * 0.42, -38 - k * 0.75, 4.6, 0.44, 0.75);
      b.box(VC.solid, '#1a1418', EDGE + 4.2, 1.9, -38 - 9 * 0.75 + 0.2, 4.6, 3.8, 0.6);
      for (let k = 1; k < 9; k++) for (let j = 0; j < 3; j++) if (chance(0.5)) K.person(b, EDGE + 2.6 + j * 1.5, -38 - k * 0.75 + 0.1, { seated: true, y: 0.44 + k * 0.42 });
      // the NASDAQ tower's screen curving round its corner, seven storeys of it
      b.add(new THREE.CylinderGeometry(6.5, 6.5, 24, 28, 1, true, Math.PI, Math.PI), screen, 13.6, 18, -58, 1, 1, 1, 0, 0, 0, screenTint(1.1));
      b.add(new THREE.CylinderGeometry(6.6, 6.6, 0.6, 28, 1, false, Math.PI, Math.PI), VC.solid, 13.6, 30.3, -58, 1, 1, 1, 0, 0, 0, '#2a2a30');
      // the police station on the island, its neon bands in red, white and blue
      const PS = -(EDGE + 5.6);
      b.block(VC.solid, '#1a1c24', PS, 0, -30, 3.2, 3.4, 6.4);
      for (const [y, c] of [[1.2, '#3d6bff'], [2.0, '#ffffff'], [2.8, '#ff3a4a']]) for (const e of [-1, 1]) {
        b.box(VC.glow, hdr(c, 2.4), PS + e * 1.62, y, -30, 0.06, 0.16, 6.4);
        b.box(VC.glow, hdr(c, 2.4), PS, y, -30 + e * 3.22, 3.2, 0.16, 0.06);
      }
      b.add(G.plane, policeSign, PS + 1.64, 3.0, -30, 4.4, 0.7, 1, 0, Math.PI / 2, 0);
      // green street sign
      const sgn = basic({ map: textTex('TIMES SQ', { w: 512, h: 128, color: '#ffffff', bg: '#0b6b3a', border: '#ffffff', size: 0.5 }), color: hdr('#ffffff', 1.1) });
      b.cyl(VC.metal, '#3a3f48', EDGE + 1.2, 2.5, -20, 0.08, 5);
      b.add(G.plane, sgn, EDGE + 1.2, 4.7, -20, 2.6, 0.65, 1, 0, -Math.PI / 2);
      b.add(G.plane, sgn, EDGE + 1.2, 4.7, -20.01, 2.6, 0.65, 1, 0, Math.PI / 2);
      return b.build();
    };

    const harbor = waterMat('#16203a', 10);
    // ---------- the Brooklyn Bridge ----------
    // The granite tower with its two pointed arches, the runner on the left-hand deck through one of them and the
    // traffic through the other; the four cables with their web of stays and suspenders and the necklace lights; the
    // Manhattan anchorage closing the far end.
    const gT = graniteTex(); gT.repeat.set(1, 1);
    const bridgeStone = std({ map: gT, vertexColors: true, roughness: 0.85, emissive: '#ffd8b0', emissiveMap: gT, emissiveIntensity: 0.14 });
    const TOWER = (() => {   // the tower's face with its two lancet arches, extruded through its depth
      const L = [-11.4, -4.6, 12.4, 21.6, 28.4], S = 14, top = 48, w = 9.2, rise = w * Math.sqrt(3) / 2;
      const sh = new THREE.Shape();
      sh.moveTo(L[0], -30); sh.lineTo(L[4], -30); sh.lineTo(L[4], top); sh.lineTo(L[0], top); sh.lineTo(L[0], -30);
      const hole = (a, b2) => {   // an opening: up the left jamb, over the pointed head, down the right jamb
        const h = new THREE.Path(); h.moveTo(a, -0.01); h.lineTo(a, S); h.absarc(b2, S, w, Math.PI, (2 * Math.PI) / 3, true); h.absarc(a, S, w, Math.PI / 3, 0, true); h.lineTo(b2, -0.01); h.lineTo(a, -0.01); return h; };
      sh.holes.push(hole(L[1], L[1] + w), hole(L[2], L[3]));
      const g = new THREE.ExtrudeGeometry(sh, { depth: 14, bevelEnabled: false, curveSegments: 10 });
      g.translate(0, 0, -7);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 5, uv.getY(i) / 5);
      return { g, L, S, top, w, rise };
    })();
    const brooklyn = () => {
      const b = new Batcher(), TZ = -36, { L, S, top } = TOWER, XL = -11.6, XR = 23.4;
      // the harbour far below, out to the sides
      b.add(G.plane, harbor, XL - 90, -28, -40, 180, 84, 1, -Math.PI / 2);
      b.add(G.plane, harbor, XR + 90, -28, -40, 180, 84, 1, -Math.PI / 2);
      // the decks: the runner's on the left, the other carriageway through the right-hand arch, the girders under them
      b.box(VC.solid, '#241f20', (XL + XR) / 2, -1.7, -40, XR - XL, 3, 80);
      b.box(VC.solid, '#2a2a30', 17, 0.02, -40, 9.6, 0.1, 80);
      for (let z = 6; z < 80; z += rand(9, 16)) if (Math.abs(z - 36) > 9) K.taxi(b, 17 + pick([-2.2, 2.2]), -z, pick([-1, 1]));
      for (const x of [XL + 0.3, XR - 0.3, 11.2]) {
        b.box(VC.metal, '#3a3536', x, -1.4, -40, 0.6, 3, 80);
        for (let z = 0.5; z < 80; z += 1.6) if (Math.abs(z - 36) > 7.5) b.add(G.box, VC.metal, x, 0.7, -z, 0.06, 1.4, 0.06, 0.6, 0, 0, '#4a4446');
        b.box(VC.metal, '#4a4446', x, 1.4, -40, 0.12, 0.12, 80);
      }
      for (let z = 6; z < 80; z += 14) if (Math.abs(z - 36) > 9) for (const [x, sd] of [[XL + 0.8, -1], [10.6, 1]]) lamp(b, x, -z, sd, { light: '#ffe0a8', k: 3.2, h: 4.6 });
      K.crowd(b, -(EDGE + 1.1), XL + 1.2, 2, 78, 14);
      K.crowd(b, EDGE + 1.1, 10.4, 2, 78, 12);
      // the tower: granite, the cornice, the tall blind lancets on each pier, floodlit from the deck
      b.addM(TOWER.g, bridgeStone, at(0, 0, TZ), '#e8dccc');
      b.box(VC.solid, '#8a7e70', (L[0] + L[4]) / 2, top + 0.6, TZ, L[4] - L[0] + 1.2, 1.2, 15.2);
      b.box(VC.solid, '#8a7e70', (L[0] + L[4]) / 2, S + TOWER.rise + 7.5, TZ, L[4] - L[0] + 0.6, 0.8, 14.6);
      for (const [a, c] of [[L[0], L[1]], [L[1] + TOWER.w, L[2]], [L[3], L[4]]]) for (const fz of [7.05, -7.05]) {
        const m = (a + c) / 2, pw = Math.min(2.4, (c - a) * 0.4);
        b.box(VC.solid, '#3e352c', m, 34.5, TZ + fz, pw, 9, 0.12);
        b.add(G.cone4, VC.solid, m, 40.2, TZ + fz, pw, 2.4, 0.14, 0, 0, 0, '#3e352c');
      }
      for (const x of [-8, 8.5, 17]) b.box(VC.glow, hdr('#ffd9a0', 2.2), x, 0.25, TZ + 7.6, 1.2, 0.3, 0.6);
      // the cables, sagging between the towers over the tower top, the suspenders, the diagonal stays, the necklace lights
      for (const cx of [-8, 6.6, 10.2, 25]) {
        let prev = null;
        for (let z = 2; z >= -80; z -= 2) {
          const dz = Math.abs(z - TZ), y = 4 + (top - 4) * Math.pow(Math.max(0, 1 - dz / 70), 2);
          if (prev) b.add(G.box, VC.metal, cx, (y + prev[1]) / 2, (z + prev[0]) / 2, 0.26, 0.26, Math.hypot(2, y - prev[1]) + 0.05, Math.atan2(y - prev[1], 2), 0, 0, '#5a5052');
          if (z % 4 === 0 && y > 2.2 && dz > 6) b.box(VC.metal, '#5a5052', cx, (y + 1.4) / 2, z, 0.05, y - 1.4, 0.05);
          if (z % 6 === 0 && (cx === -8 || cx === 25)) b.sph(VC.glow, hdr('#fff1c4', 3.2), cx, y + 0.3, z, 0.22, true);
          prev = [z, y];
        }
        for (let k = 1; k <= 7; k++) for (const dir of [-1, 1]) {
          const ez = TZ + dir * (7 + k * 5.2), len = Math.hypot(ez - TZ, top - 2);
          b.add(G.box, VC.metal, cx, (top + 2) / 2, (TZ + ez) / 2, 0.06, 0.06, len, dir * Math.atan2(top - 2, Math.abs(ez - TZ)), 0, 0, '#5a5052');
        }
      }
      // the Manhattan anchorage, a mountain of granite closing the far end
      b.addM(tiledBox(150, 30, 10, 5), bridgeStone, at(6, -15.25, -85), '#d8ccbc');
      for (let x = -60; x <= 70; x += 13) if (x < XL - 4 || x > XR + 4) b.box(VC.solid, '#2a2420', x, -12, -79.95, 5, 10, 0.1);
      return b.build();
    };

    const LM = nyLandmarks(K, {
      types, signPlane, glass, glassMat,
      row: (b, side, z0, z1, { h } = {}) => { if (z1 - z0 > 3) buildingRow(b, side, h ? types.map((t) => ({ ...t, h })) : types, { x0: 11, depth: [9, 15], z0, z1 }); },
      lamp: (b, x, z, side) => lamp(b, x, z, side, { light: '#ffcf8a', k: 3.4 }),
    });
    const flagMat = std({ map: flagTex(), roughness: 0.8, emissive: '#ffffff', emissiveMap: flagTex(), emissiveIntensity: 0.45, side: THREE.DoubleSide });
    const D = nyDistricts(K, { types, flagMat, glass, glassMat });

    // ---------- the skyline ----------
    // Unlit and out of the fog, its shading baked in. Straight ahead the sun goes down beside the Empire State Building;
    // while the harbour comes up, the Statue of Liberty stands there in its place.
    const skyMat = (o = {}) => new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true, ...o });
    const esbT = esbTex({ pier: '#62668a', win: '#1a1e34', chance: 0.3 });
    const ESB = { wall: skyMat({ map: esbT.map }), solid: skyMat(), glow: skyMat() };
    const LIB = { copper: skyMat(), stone: skyMat(), glow: skyMat() };
    const ICON = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
    const BAND = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.BackSide });
    const ringTex = skyTex({ wall: '#20223e', lit: ['#ffd27a', '#ffe8b0', '#ffb070', '#cfe0ff'], chance: 0.16 });
    const ICONS = [[17, 720], [-26, 820], [-17, 760], [12, 780], [25, 840], [32, 900], [-40, 880]];   // [bearing, distance] of the towers below
    const sky = skyline({
      tex: ringTex,
      colors: ['#ffffff', '#d8d0f0', '#c0b8e0', '#e0c8d8'], count: 140, h: [50, 210], k: 1.2,
      gapAhead: 0.05, follow: 190,
      heightCap: (a, rr) => (Math.abs(a) < 0.085 || ICONS.some(([d, r]) => Math.abs(a - (d * Math.PI) / 180) < 0.05 && rr < r + 40) ? 0
        : Math.abs(a) < 0.2 ? 4.5 + rr * Math.tan(0.07) : Infinity),   // clear behind the sun, and in front of the icons
      landmarks: [
        (b) => {   // the far shore: dusk haze under the towers, the street lights along its top
          const g = new THREE.CylinderGeometry(545, 545, 240, 96, 4, true);
          g.translate(0, -46 - 120, 0);
          const P = g.attributes.position, c = new Float32Array(P.count * 3), top = new THREE.Color('#3c3452'), bot = new THREE.Color('#141222'), t = new THREE.Color();
          for (let i = 0; i < P.count; i++) { t.copy(bot).lerp(top, Math.pow((P.getY(i) + 286) / 240, 3)); c.set([t.r, t.g, t.b], i * 3); }
          g.setAttribute('color', new THREE.BufferAttribute(c, 3));
          b.addM(g, BAND, at(0, 0, 0), null);
          for (let k = 0; k < 420; k++) {
            const deg = rand(-180, 180), [x, z] = polar(deg, 543);
            b.add(G.box, SKY_VC, x, rand(-50, -46.5), z, rand(1, 3), rand(0.6, 1.4), 0.4, 0, (-deg * Math.PI) / 180, 0, hdr(pick(['#ffd9a0', '#fff0d0', '#ffcf8a', '#cfe6ff']), rand(1, 1.8)));
          }
        },
        (b) => {   // the Empire State Building at the far end of the track, its mast lit red, white and blue
          const [x, z, ry] = polar(0, 900);
          empireState(b, { x, y: -95, z, s: 0.8, ry, wall: ESB.wall, solid: ESB.solid, glow: ESB.glow, tex: esbT, dc: '#2c3050',
            crown: [hdr('#ff3a4a', 1.9), hdr('#f4f6ff', 1.7), hdr('#4d7bff', 2.1)] });
        },
        (b) => {   // ...and Liberty in its place, her torch held up over the setting sun
          const [x, z, ry] = polar(0, 700);
          liberty(b, { x, y: -52, z, s: 2.5, ry: ry - Math.PI / 2, copper: LIB.copper, stone: LIB.stone, flame: LIB.glow, glow: LIB.glow,
            cc: '#47746a', sc: '#564e5e', gc: hdr('#ffd890', 2), fc: hdr('#ffc04a', 3.2) });
        },
        (b, mat) => {   // the Chrysler Building's crown of lit arches
          const [x, z, ry] = polar(17, 720);
          chrysler(b, { x, y: -95, z, s: 0.8, ry, wall: mat, tex: ringTex, steel: ICON, solid: ICON, glow: SKY_VC, wc: '#d8d4f0', mc: '#a8aec8', gc: hdr('#fff1c4', 2.4) });
        },
        (b) => {   // One World Trade Center, its west faces catching the sunset
          const [x, z, ry] = polar(-26, 820);
          oneWTC(b, { x, y: -95, z, s: 0.8, ry, glass: ICON, solid: ICON, glow: SKY_VC, sun: new THREE.Vector3(-1, 0, 0.35).applyAxisAngle(new THREE.Vector3(0, 1, 0), -ry), lo: '#262c4a', hi: '#d88a8e' });
        },
        (b, mat) => { const [x, z, ry] = polar(-17, 760); woolworth(b, { x, y: -95, z, s: 0.8, ry, mat, tex: ringTex, solid: ICON, glow: SKY_VC }); },
        (b, mat) => { const [x, z, ry] = polar(12, 780); vanderbilt(b, { x, y: -95, z, s: 0.8, ry, mat, tex: ringTex, solid: ICON, glow: SKY_VC }); },
        (b, mat) => { const [x, z, ry] = polar(25, 840); citigroup(b, { x, y: -95, z, s: 0.8, ry, mat, tex: ringTex, solid: ICON, glow: SKY_VC }); },
        (b) => { const [x, z, ry] = polar(32, 900); park432(b, { x, y: -95, z, s: 0.8, ry, solid: ICON, glow: SKY_VC }); },
        (b, mat) => { const [x, z, ry] = polar(-40, 880); hudsonYards(b, { x, y: -95, z, s: 0.8, ry, mat, tex: ringTex, solid: ICON, glow: SKY_VC }); },
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
    // the light comes from the sunset, low on the left
    bakeShade(sky, [ESB.wall, ESB.solid, LIB.copper, LIB.stone, ICON], new THREE.Vector3(-0.7, 0.45, 0.55), 0.62, 0.55);
    bakeShade(sky, [sky.children.find((m) => m.material.map === ringTex.map)?.material], new THREE.Vector3(-0.7, 0.45, 0.55), 0.8, 0.35);

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
        { key: 'times', name: '时代广场', en: 'TIMES SQUARE', build: timesSquare },
        D.landmarks.rockefeller, LM.landmarks.centralPark, LM.landmarks.grandCentral, LM.landmarks.flatiron,
        D.landmarks.highLine, D.landmarks.washington, D.landmarks.wtc, LM.landmarks.wallStreet,
        { key: 'brooklyn', name: '布鲁克林大桥', en: 'BROOKLYN BRIDGE', build: brooklyn },
        D.landmarks.dumbo,
        D.landmarks.harbour,
        LM.landmarks.coney,
      ],
      coinGeo: coinGeometry('token'), coinMat: coinMaterial('#e8b84a', '#c88a20'),
      update(t) {
        K.update(t); LM.update(t); D.update(t);
        // the horizon's Empire State Building gives way to Liberty while the harbour comes up, and is back once she is in sight
        const hb = D.landmarks.harbour.obj, ch = hb && hb.parent;
        const p = ch && ch.parent ? 7.6 - (sky.position.z - ch.position.z) : -1e4;   // how far into the harbour the runner is
        const sm = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
        const kL = sm((p + 285) / 35) * (1 - sm((p + 45) / 30)), kE = 1 - sm((p + 320) / 35) * (1 - sm((p + 15) / 35));   // one, then the other
        for (const m of Object.values(LIB)) { m.opacity = kL; m.visible = kL > 0.01; }
        for (const m of Object.values(ESB)) { m.opacity = kE; m.visible = kE > 0.01; }
        screen.uniforms.time.value = t;
        tickerTex.offset.x = t * 0.06;
        harbor.userData.scroll.offset.set(t * 0.01, t * 0.025);
        const f = Math.sin(t * 31) > 0.97 ? 0.5 : 1;
        signMat.color.setScalar((1.25 + Math.sin(t * 3) * 0.15) * f);
      },
    };
  },
};
