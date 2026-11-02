// Los Angeles at sunset in June: the sun going down into the Pacific on the left, the sky from tangerine through pink to
// violet, the fan palms standing up black against it in rows down every street; the neon and the roadside signs just
// coming on, the premiere searchlights beginning to sweep, the jets' landing lights strung out over the basin. Beverly
// Hills' villas behind their lawns and hedges, the roadside of the fifties, Hollywood Boulevard's stars and marquees,
// downtown's towers and picture palaces, the Eastside's murals and lowriders, the beach towns' bungalows and surf
// shops. Metro trains wait on the line; an old Red Car of the Pacific Electric comes at you, its whistle blowing. Twelve
// landmarks, two of them on the beach from Venice to Santa Monica, which the run follows (la_beach.js).
import { THREE, Batcher, VC, G, std, hdr, stripeTex, canvasTex, CHUNK_LEN, TRAIN_W, TRAIN_H, rand, randi, pick, chance } from '../core.js';
import { barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, skyline, skyTex, polar, polarXZ, below, farGround } from './common.js';
import { frame, bakeShade } from './ny_icons.js';
import { ridge, ridgeHeight } from './taipei_towers.js';
import { sparkles } from './paris_kit.js';
import { tower } from './sf_icons.js';
import { hollywoodSign, griffith, getty, cityHall, wilshireGrand, usBank, aon, gasCo, mast, searchlight } from './la_icons.js';
import { makeBeach } from './la_beach.js';
import { laLandmarks } from './la_landmarks.js';
import { beam } from './tokyo_kit.js';
import { makeKit, X0, SANS, BLADE, STUCCO, PASTEL, STRIP_SIGNS, HOLLY_SIGNS, EAST_SIGNS, BEACH_SIGNS } from './la_kit.js';

const BLURB = '六月的洛杉矶，太阳正沉进左边的太平洋，天从橘红烧到粉紫，一街又一街高高的蒲葵变成黑色剪影；霓虹灯和五六十年代的路边招牌刚刚亮起，好莱坞首映的探照灯开始在天上扫，进近机场的飞机一架接一架亮着着陆灯排在天边。比佛利山庄的西班牙式白墙红瓦别墅藏在草坪和高高的绿篱后面，九重葛从墙角垂下来；公路边是回旋镖屋顶的咖啡店、屋顶顶着巨型甜甜圈的得来速、洗车房和霓虹箭头的汽车旅馆；好莱坞大道的人行道上嵌着星星，剧院遮檐的灯泡在跑；市中心有石砌高楼和老电影宫，东区满墙壁画、西班牙文招牌和液压顶起车头的 lowrider，海边小镇是工匠风小平房和冲浪店。从联合车站和奥维拉街出发，经过迪士尼音乐厅和天使铁路、第六街高架桥、纪念体育场和机场的光柱，然后跑上海滩：穿过威尼斯运河、木栈道和肌肉海滩，从圣莫尼卡码头底下的木桩间钻过去，摩天轮就在头顶亮着；再沿威尔希尔大道经过城市之光，到比佛利山庄、日落大道、好莱坞星光大道和中国剧院，最后上格里菲斯天文台俯瞰整片灯海。天边一直看得到山上的 HOLLYWOOD 白字、天文台和市中心的高楼。';
const SIGHTS = ['联合车站 · 奥维拉街', '迪士尼音乐厅 · 天使铁路', '第六街高架桥', '洛杉矶纪念体育场', '洛杉矶国际机场', '威尼斯海滩', '圣莫尼卡码头', '城市之光 · 艺术博物馆', '比佛利山庄 · 罗迪欧大道', '日落大道', '星光大道 · 中国剧院', '格里菲斯天文台'];

// the skyline's models: unlit, their shading baked; white walls and glass catching the sunset, the hills going violet
const skyMat = (o = {}) => new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, ...o });
const SKY = {
  wall: skyMat(), glow: skyMat(), dark: skyMat(), metal: skyMat(), sign: skyMat(),
  cWhite: hdr('#f6e2d8', 0.95), cWhite2: hdr('#e4cecc', 0.9), cStone: hdr('#f2e2cc', 0.92), cDome: hdr('#8aa89c', 0.9), cSign: hdr('#fff6ee', 1.25),
  cWin: hdr('#ffd9a0', 1.25), cWinDim: hdr('#ffd9a0', 0.55), cArch: hdr('#ffd9a0', 1.15), cCrown: hdr('#fff0d8', 1.6), cRed: hdr('#ff2a1a', 2.6), cDark: hdr('#3a3442', 1),
  cGlass: hdr('#e8eef8', 1), cGlass2: hdr('#b8c4dc', 0.9), cDarkGlass: hdr('#3a3a48', 1), cBlueGlass: hdr('#a8c8f0', 1), cSteel: hdr('#a8acb8', 0.9),
  cSail: hdr('#ffe8c8', 2.2), cFlame: hdr('#5aa8ff', 2.0),
};
const LAMP = skyMat();   // the red lamps on the masts and the towers, blinking
const RIDGE = skyMat({ side: THREE.DoubleSide });   // the hills' ring (its geometry has no normals, so it keeps a material of its own; it faces outward, so both sides)
// the hills round the basin: [degrees, height, width] (taipei_towers.js ridge); the sea from -112° to -23°, where the
// ridge stays below the horizon
const LA_PEAKS = [[0, 235, 9], [-9, 190, 7], [10, 210, 9], [-17, 175, 8], [-24, 150, 6], [25, 175, 9], [40, 300, 13], [55, 330, 15], [72, 310, 15], [92, 260, 18],
  [130, 150, 30], [175, 120, 30], [-150, 130, 25], [-128, 150, 12]];
const SEA = [-112, -23];   // the bearings of the open sea on the horizon
const isSea = (d) => d > SEA[0] && d < SEA[1];
// the icons that stand clear of the ring of houses: [degrees, radius]
const ICONS = [[0, 1300], [9.5, 1240], [30, 1000], [36, 1060], [-21, 1200]];
const SIGN_R = 1340, SIGN_S = 2.5;

// The loop: twelve landmarks, each heading four chunks (world.js LANDMARK_EVERY), in this order. The beach takes seven
// chunks in a row (la_beach.js): the Venice canals, Venice Beach (a landmark), the boardwalk, Muscle Beach, the open
// sand, the Santa Monica Pier (a landmark), the bluffs; the beach towns' streets either side of it.
const ROUTE = ['union', 'bunker', 'viaduct', 'coliseum', 'lax', 'venice', 'pier', 'urbanLight', 'beverly', 'sunset', 'hollywood', 'griffith'];
const LOOP = ROUTE.length * 4;
const ZONES = Array.from({ length: LOOP }, (_, k) => ({ 17: 'coast', 18: 'coast', 19: 'canals', 21: 'boardwalk', 22: 'muscle', 23: 'strand', 25: 'palisades', 26: 'coast', 27: 'coast' })[k] || (k < 16 ? 'east' : 'west'));
// the streets each part of town runs to: downtown, the Eastside and the roadside south of it; the beach towns; Beverly
// Hills to Hollywood
const KINDS = {
  east: [['downtown', 0.3], ['eastside', 0.32], ['googie', 0.24], ['palms', 0.14]],
  coast: [['beachtown', 0.55], ['googie', 0.25], ['palms', 0.2]],
  west: [['palms', 0.36], ['hollywood', 0.34], ['googie', 0.3]],
};

export default {
  id: 'la', name: '洛杉矶', en: 'LOS ANGELES', tagline: '棕榈日落 · 星光大道',
  blurb: BLURB, sights: SIGHTS,
  accent: '#ff3d8a', accent2: '#ffc23d', portal: '#ff5aa8',
  sky: { top: '#28245e', mid: '#c25a9a', bot: '#ff9a4a', glow: '#ff7a3a', glowK: 0.6, sun: '#ff8a3a', sunK: 1.15, sunDir: [-0.6, 0.0, -1], sunSize: 0.002,
    cloud: 0.12, cloudColor: '#ff9ab0', horizon: -0.06, stars: false, follow: true },
  envSky: { bot: '#8a7ab8', glow: '#a07ab0', glowK: 0.2, sunK: 0.4 },
  fog: { color: '#f0a890', near: 40, far: 330 },
  light: { hemiSky: '#a8a0ff', hemiGround: '#b08070', hemi: 0.9, dir: '#ff9a5a', dirK: 1.35, dirPos: [-0.85, 0.22, -0.5] },
  exposure: 1.0, bloom: { strength: 0.6, radius: 0.5, threshold: 0.9 },
  weather: [{ mode: 'fall', count: 80, colors: ['#9d7ae0', '#b394f0', '#8a6ad8', '#c4aaf8'], size: 0.34, k: 1.0, box: [44, 18, 90], speed: 0.6, shape: 4 }],
  coin: 'star', music: 'la', jingle: 'premiere', horn: 'redCar',

  build() {
    const K = makeKit();
    const track = makeTrack({ gravel: '#3e3c40', spots: ['#4a4848', '#302e32', '#58565a'], sleeper: '#3e3c40', rail: '#c8ccd4', edge: '#ffb07a', edgeK: 0.8, sideMat: K.sideMat });

    // ---------- the street kinds ----------
    const clear = (gaps, z, r = 0) => !gaps.some(([a, c]) => z > a - r && z < c + r);
    const palmsSide = (b, s) => {   // Beverly Hills: villas behind their lawns and hedges, the palms in a row down the parkway
      K.kerbLane(b, s, { red: 0.15 });
      K.lawn(b, s * 7.7, -CHUNK_LEN / 2, 1.9, CHUNK_LEN, '#4a7a34', 0.04);   // the parkway between the kerb and the pavement
      K.lawn(b, s * 16.5, -CHUNK_LEN / 2, 11.5, CHUNK_LEN, pick(['#4a7a34', '#527e38', '#5a8a3e']), 0.035);   // the front lawns
      const trees = [];
      if (chance(0.3)) for (let z = rand(3, 7); z < CHUNK_LEN - 2; z += rand(10, 13)) { K.jacaranda(b, s * 9.2, -z, rand(0.62, 0.7)); trees.push(z); }   // (their spread kept 4 m clear of the track)
      else for (let z = rand(2, 9); z < CHUNK_LEN - 1; z += rand(13, 16)) { K.fanPalm(b, s * 7.7, -z, rand(1.0, 1.2)); trees.push(z); }
      for (let z = rand(0, 3); z < CHUNK_LEN - 12;) {
        const L = Math.min(rand(16, 22), CHUNK_LEN - z), zc = -(z + L / 2), w = Math.min(L - 3.5, rand(11, 15));
        K.villa(b, s, rand(17.5, 20.5), zc, { w, floors: randi(1, 2) });
        const hedge = Math.random();
        if (hedge < 0.3) K.hedge(b, s * 11.2, zc + 1.4, 0.9, L - 3.2, rand(2.6, 3.8));   // a tall ficus hedge, for privacy
        else if (hedge < 0.6) K.hedge(b, s * 11.0, zc + 1.4, 0.6, L - 3.2, rand(0.8, 1.1));
        const dz = -(z + L - 1.5);   // the driveway at the lot's edge
        K.pave(b, s * 15, dz, 8.6, 2.6, 0.045);
        if (chance(0.5)) K.place(b, (t) => K.car(t, 0, 0, 1, { kind: pick(['suv', 'convertible', 'classic', 'sedan']) }), new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(s * 16.6, 0, dz));
        z += L;
      }
      K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.35 });
      for (let z = rand(6, 12); z < CHUNK_LEN - 2; z += rand(26, 32)) if (clear(trees.map((t) => [t - 1.5, t + 1.5]), z)) K.lamp(b, s * 7.0, -z, s);
      for (let k = randi(1, 3); k > 0; k--) K.person(b, s * rand(9, 10.2), -rand(4, 76), { ry: chance(0.5) ? 0 : Math.PI, top: pick(['#ff5aa0', '#2a6ad8', '#f4f0e8', '#141414']), shorts: true });   // joggers
      if (chance(0.4)) K.dog(b, s * rand(9, 10), -rand(6, 74));
      if (chance(0.25)) K.cart(b, s * 9.4, -rand(10, 70), s, 'STAR MAPS');
      if (chance(0.3)) K.streetSign(b, s * 7.0, -rand(4, 76), s, pick([4, 9, 8, 6]), pick([9, 4]));
    };
    const googieSide = (b, s, poles) => {   // the roadside: one business after another behind its car park, the pole signs, the palms, the wires
      K.kerbLane(b, s, { x1: 10.8, red: 0.6 });
      const MAKE = { coffee: [22, 24, K.coffeeShop], donut: [15, 20, K.donutShop], wash: [24, 22, K.carWash], motel: [30, 28, K.motel], gas: [24, 18, K.gasStation], hotdog: [15, 18, K.hotDogStand] };
      for (let z = rand(0, 3); z < CHUNK_LEN - 12;) {
        const kind = pick(['coffee', 'donut', 'wash', 'motel', 'gas', 'hotdog', 'strip', 'strip']);
        const len = kind === 'strip' ? Math.min(rand(26, 40), CHUNK_LEN - z) : MAKE[kind][0];
        if (z + len > CHUNK_LEN + 2 || len < 20) break;
        if (kind === 'strip') K.stripMall(b, s, z, z + len);
        else { const [, xc, fn] = MAKE[kind]; K.carPark(b, s, 10.8, xc - 4, z, z + len, { cars: 0.4 }); fn(b, s, xc, -(z + len / 2)); }
        z += len + rand(1, 3);
      }
      K.powerLine(b, s * 10.4, 0, CHUNK_LEN, poles);
      for (let z = rand(5, 12); z < CHUNK_LEN - 2; z += rand(18, 26)) if (clear(poles.map((p) => [p - 2, p + 2]), z)) K.fanPalm(b, s * 9.6, -z, rand(1.0, 1.2));
      for (let z = rand(10, 16); z < CHUNK_LEN - 2; z += rand(28, 34)) K.lamp(b, s * 7.0, -z, s);
      K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.5, lit: true });
      if (chance(0.6)) K.busStop(b, s * 8.0, -rand(10, 70), s);
      if (chance(0.5)) K.parkingSigns(b, s * 7.1, -rand(4, 76));
      if (chance(0.5)) K.hydrant(b, s * 7.1, -rand(6, 74));
      if (chance(0.3)) K.mailbox(b, s * 7.3, -rand(6, 74));
      K.throng(b, s * 7.6, s * 10.2, 2, CHUNK_LEN - 2, randi(2, 5));
    };
    const hollywoodSide = (b, s) => {   // Hollywood Boulevard: the stars in the pavement, the marquees and blade signs, the crowds and the characters
      K.kerbLane(b, s, { x1: X0, red: 0.3 });
      K.stars(b, s, 0, CHUNK_LEN);
      const gaps = [];
      if (chance(0.5)) { const L = rand(16, 20), z0 = rand(10, 50); K.theatre(b, s, X0, -(z0 + L / 2), L); gaps.push([z0 - 0.3, z0 + L + 0.3]); }
      K.shopRow(b, s, 0, CHUNK_LEN, { signs: HOLLY_SIGNS, floors: [1, 3], styles: ['deco', 'deco', 'stucco', 'mission'], gaps, blade: 0.45 });
      const palms = [];
      for (let z = rand(4, 10); z < CHUNK_LEN - 2; z += rand(14, 18)) { K.fanPalm(b, s * 7.5, -z, rand(1.0, 1.15)); palms.push(z); }
      for (let z = rand(8, 14); z < CHUNK_LEN - 2; z += rand(20, 24)) if (clear(palms.map((p) => [p - 1.5, p + 1.5]), z)) K.lamp(b, s * 7.0, -z, s, { kind: 'deco' });
      K.throng(b, s * 7.6, s * 10.8, 2, CHUNK_LEN - 2, randi(12, 18), [], { camera: chance(0.5) });
      for (let k = randi(1, 3); k > 0; k--) K.person(b, s * rand(7.4, 8.4), -rand(6, 74), { costume: pick(['cowboy', 'pirate', 'robot', 'showgirl']), ry: s < 0 ? -Math.PI / 2 : Math.PI / 2 });
      if (chance(0.5)) K.cart(b, s * 8.6, -rand(10, 70), s, pick(['HOT DOGS', 'STAR MAPS', 'CHURROS']));
      if (chance(0.5)) K.tourVan(b, s * 5.2, -rand(12, 68), pick([-1, 1]));
      else K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.5, lit: true });
      if (chance(0.4)) K.billboard(b, s * rand(23, 27), -rand(16, 64), s, { y: rand(10, 13), ry: -s * 0.5 });
      if (chance(0.4)) K.streetSign(b, s * 7.1, -rand(4, 76), s, pick([2, 3, 29]), 0);
    };
    const downtownSide = (b, s) => {   // Broadway and Bunker Hill: stone towers, the old picture palaces, the Metro, the trucks and the carts
      K.kerbLane(b, s, { x1: 12.4 });
      K.towerRow(b, s, 0, CHUNK_LEN, { x0: 12.4 });
      const taken = [];
      if (chance(0.5)) { const z = rand(14, 62); K.metroEntrance(b, s * 9.6, -z, s); taken.push(z); }
      for (let k = randi(1, 2); k > 0; k--) { const z = rand(8, 72); if (clear(taken.map((t) => [t - 4, t + 4]), z)) { K.cart(b, s * 9.2, -z, s, pick(['MANGOS', 'HOT DOGS', 'FRUTA', 'ELOTES', 'TAMALES'])); taken.push(z); } }
      for (let z = rand(5, 10); z < CHUNK_LEN - 2; z += rand(20, 24)) if (clear(taken.map((t) => [t - 3, t + 3]), z)) K.lamp(b, s * 7.3, -z, s, { kind: 'twin' });
      const r = Math.random();
      if (r < 0.45) K.tacoTruck(b, s * 5.2, -rand(12, 66), s); else if (r < 0.7) K.metroBus(b, s * 5.3, -rand(14, 66), s); else K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.45 });
      K.throng(b, s * 7.8, s * 12, 2, CHUNK_LEN - 2, randi(12, 18), taken.map((t) => [t - 2, t + 2]));
      if (chance(0.4)) K.parkingSigns(b, s * 7.1, -rand(4, 76));
      if (chance(0.3)) K.streetSign(b, s * 7.1, -rand(4, 76), s, pick([10, 11, 12, 13]), pick([10, 11]));
    };
    const eastSide = (b, s, poles) => {   // the Eastside: painted shops and murals, Spanish on every board, lowriders, carts, the mariachis
      K.kerbLane(b, s, { red: 0.4 });
      for (let z = rand(0, 1); z < CHUNK_LEN - 5;) {
        const w = pick([7, 8, 9, 10, 12]);
        if (chance(0.3)) K.muralWall(b, s, X0, -(z + w / 2), w, { shop: chance(0.5) ? EAST_SIGNS : null });
        else K.shop(b, s, X0, -(z + w / 2), w, { style: pick(['stucco', 'mission', 'mission']), floors: randi(1, 2), col: pick([...STUCCO, '#f2c230', '#39b8a8', '#e8708a', '#ff9a4a', '#8ad8f0', '#b8e0a0']), sign: pick(EAST_SIGNS) });
        z += w + rand(0.02, 0.2);
      }
      K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.6, kinds: [K.lowrider, K.lowrider, K.car, K.car] });
      const taken = [];
      for (let k = randi(1, 2); k > 0; k--) { const z = rand(8, 72); if (clear(taken.map((t) => [t - 4, t + 4]), z)) { K.cart(b, s * 8.4, -z, s); taken.push(z); } }
      if (chance(0.35)) { const z = rand(10, 70); if (clear(taken.map((t) => [t - 4, t + 4]), z)) { K.mariachi(b, s * 9.4, -z, s); taken.push(z); } }
      for (let z = rand(4, 10); z < CHUNK_LEN - 4; z += rand(14, 18)) if (clear(taken.map((t) => [t - 2, t + 2]).concat(poles.map((p) => [p - 2, p + 2])), z)) K.fanPalm(b, s * 8.4, -z, rand(0.95, 1.15));
      for (let z = rand(10, 16); z < CHUNK_LEN - 2; z += rand(26, 30)) K.lamp(b, s * 7.0, -z, s);
      K.powerLine(b, s * 10.4, 0, CHUNK_LEN, poles);
      K.throng(b, s * 7.9, s * 10.6, 2, CHUNK_LEN - 2, randi(7, 12), taken.map((t) => [t - 1.5, t + 1.5]));
      K.papelZ(b, s * 9.2, 4.8, rand(0, 4), rand(36, 44), { to: s * 11.45 });
      if (chance(0.5)) K.papelZ(b, s * 9.2, 4.8, rand(40, 46), rand(76, 80), { to: s * 11.45 });
    };
    const beachtownSide = (b, s, poles) => {   // Venice and Santa Monica a few blocks in: bungalows and dingbats, surf shops and juice bars, bikes
      K.kerbLane(b, s, { x1: 12, red: 0.3 });
      for (let z = rand(0, 2); z < CHUNK_LEN - 6;) {
        if (chance(0.45)) {   // a run of shops
          const L = Math.min(rand(16, 30), CHUNK_LEN - z);
          const lots = K.shopRow(b, s, z, z + L, { signs: BEACH_SIGNS, floors: [1, 2], styles: ['stucco', 'stucco', 'mission'], colors: [...STUCCO, ...PASTEL] });
          for (const [a, c] of lots) if (chance(0.35)) K.surfRack(b, s * 10.7, -(a + c) / 2, s);
          z += L + rand(0.5, 2);
        } else {
          const dg = chance(0.3), w = dg ? rand(13, 15) : rand(9, 11);
          if (z + w > CHUNK_LEN) break;
          const zc = -(z + w / 2);
          if (dg) K.dingbat(b, s, 13.4, zc, { w });
          else {
            K.bungalow(b, s, rand(15.5, 17), zc, { w });
            K.lawn(b, s * 13.8, zc, 3.6, w, pick(['#5a7a3a', '#7a8a5a', '#8a8060']), 0.04);
            for (let k = 0; k < 3; k++) (chance(0.5) ? K.agave : K.strelitzia)(b, s * rand(12.6, 14.8), zc + rand(-w / 2 + 1, w / 2 - 1), rand(0.8, 1.1));
          }
          z += w + rand(0.6, 2);
        }
      }
      for (let z = rand(4, 9); z < CHUNK_LEN - 2; z += rand(14, 18)) if (clear(poles.map((p) => [p - 2, p + 2]), z)) K.fanPalm(b, s * 7.6, -z, rand(0.95, 1.15));   // (the date palms' fronds would reach over the track here)
      for (let z = rand(10, 16); z < CHUNK_LEN - 2; z += rand(26, 32)) K.lamp(b, s * 7.0, -z, s);
      K.powerLine(b, s * 10.4, 0, CHUNK_LEN, poles);
      K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.55 });
      for (let k = randi(2, 4); k > 0; k--) K.person(b, s * rand(7.6, 10.4), -rand(4, 76), { surf: chance(0.6), shorts: true, ry: chance(0.5) ? 0 : Math.PI });
      if (chance(0.6)) K.skater(b, s * rand(8, 10), -rand(6, 74));
      for (let k = randi(1, 3); k > 0; k--) K.bike(b, s * 10.9, -rand(6, 74), 0);
      K.throng(b, s * 7.8, s * 10.8, 2, CHUNK_LEN - 2, randi(4, 8));
    };
    const cityDecor = (zone) => {
      const b = new Batcher(), W = KINDS[zone] || KINDS.east;
      let r = Math.random(), kind = W[W.length - 1][0];
      for (const [k, w] of W) { if (r < w) { kind = k; break; } r -= w; }
      const poles = []; for (let z = rand(4, 16); z < CHUNK_LEN; z += rand(32, 40)) poles.push(z);
      for (const s of [-1, 1]) {
        farGround(b, s, kind === 'palms' ? '#5a6a40' : '#8a7a62');
        if (kind === 'palms') palmsSide(b, s);
        else if (kind === 'googie') googieSide(b, s, poles);
        else if (kind === 'hollywood') hollywoodSide(b, s);
        else if (kind === 'downtown') downtownSide(b, s);
        else if (kind === 'eastside') eastSide(b, s, poles);
        else beachtownSide(b, s, poles);
      }
      if (kind === 'eastside' && chance(0.7)) for (const z of [rand(14, 24), rand(52, 64)]) {   // strung right across, high over the track, between two masts at the kerbs
        for (const e of [-1, 1]) { b.cyl(VC.metal, '#5a5c60', e * 7.25, 6.75, -z, 0.07, 13.5, 'cyl8'); b.sph(VC.metal, '#d8b048', e * 7.25, 13.55, -z, 0.12); }
        K.papel(b, -7.25, 7.25, 13.2, -z, { sag: 0.9 });
      }
      if ((kind === 'googie' || kind === 'eastside' || kind === 'beachtown') && chance(0.6)) K.span(b, pick(poles), 10.4);   // wires across, high over the track
      const g = K.flushSmoke(b.build());
      g.userData.kind = kind;
      return g;
    };

    const B = makeBeach(K);
    const decor = (zone) => (B.zones[zone] ? B.zones[zone]() : cityDecor(zone));
    const LM = laLandmarks(K);
    const byKey = { ...B.landmarks, ...LM.landmarks };

    // ---------- the horizon ----------
    // The Hollywood Hills straight ahead, the white letters on Mount Lee, Griffith Observatory on its ridge to the right
    // of them; the Santa Monica Mountains running down to the sea on the left, the Getty on its hill; downtown's towers
    // and City Hall over on the right, the San Gabriels high behind them with Mount Wilson's masts; the Pacific on the
    // left with the sun going down into it, Catalina far out; a ring of low stucco houses and palms all round
    const stex = skyTex({ wall: '#d8c4bc', lit: ['#ffd9a0', '#fff0d0', '#ffc880', '#ffe0b0'], chance: 0.35, cols: 8, rows: 16 });
    const capH = (a, rr) => { const d = (a * 180) / Math.PI; return isSea(d) && rr > 520 ? 0 : Math.abs(d) < 4 || ICONS.some(([id, ir]) => Math.abs(d - id) < 3.5 && rr < ir + 100) ? 0 : Math.abs(d) < 14 ? 16 : 40; };
    const lamp = { mat: LAMP, col: 0xffffff };
    const towers = [];
    const sky = skyline({
      tex: stex, colors: ['#f4e2d6', '#f2dace', '#f6e8dc', '#e8d8d4', '#f4d8cc', '#ecd8e0', '#f6e4d0'], count: 360, r: [520, 1000], h: [6, 24], w: [12, 26], k: 1.0,
      heightCap: capH, follow: 190,
      landmarks: [
        (b) => ridge(b, RIDGE, { r: 1400, base: -100, top: '#7a5a8a', foot: '#9a7a96', peaks: LA_PEAKS }),
        (b) => {   // the letters on Mount Lee, most of the way up its slope, a little out of line with each other
          const top = (ridgeHeight(0, LA_PEAKS) - 100) * (SIGN_R / 1400), y0 = top * 0.6;
          const F = frame(b, ...polarXZ(0, SIGN_R, 0), SIGN_S, 0);
          hollywoodSign(F, SKY, { yAt: (x) => (y0 + rand(-2.5, 2.5)) / SIGN_S - x * 0.025, foot: 14 });
        },
        (b) => {   // Griffith Observatory on its ridge
          const r = 1240, y = (ridgeHeight(9.5, LA_PEAKS) - 100) * (r / 1400) - 14;
          griffith(frame(b, ...polarXZ(9.5, r, y), 1.5, polar(9.5, r)[2]), SKY, { foot: 30 });
        },
        (b) => {   // the Getty on its hilltop
          const r = 1200, y = (ridgeHeight(-21, LA_PEAKS) - 100) * (r / 1400) - 10;
          getty(frame(b, ...polarXZ(-21, r, y), 1.0, polar(-21, r)[2] + 0.4), SKY, { foot: 30 });
        },
        (b, mat) => {   // downtown: City Hall in front, the Wilshire Grand, the U.S. Bank Tower, the Aon Center, the Gas Company, the rest
          cityHall(frame(b, ...polarXZ(28.5, 900, 0), 0.5, polar(28.5, 900)[2]), SKY, { foot: below(0, 0.5, 900) });
          wilshireGrand(frame(b, ...polarXZ(33, 1060, 0), 0.4, polar(33, 1060)[2] + 0.3), SKY, mat, { foot: below(0, 0.4, 1060) });
          usBank(frame(b, ...polarXZ(36.5, 1040, 0), 0.4, polar(36.5, 1040)[2]), SKY, mat, { foot: below(0, 0.4, 1040) });
          aon(frame(b, ...polarXZ(34.8, 1000, 0), 0.4, polar(34.8, 1000)[2] - 0.2), SKY, { foot: below(0, 0.4, 1000) });
          gasCo(frame(b, ...polarXZ(38.6, 1080, 0), 0.4, polar(38.6, 1080)[2]), SKY, mat, { foot: below(0, 0.4, 1080) });
          for (const [d, r, w, h, crown] of [[31, 980, 40, 170, 'lit'], [32.2, 1120, 44, 210, null], [35.6, 1150, 36, 180, 'lit'], [37.8, 960, 40, 140, null], [39.8, 1000, 34, 160, 'lit'], [30, 1060, 46, 130, null], [40.8, 1100, 40, 190, null], [33.8, 940, 36, 120, 'lit']])
            tower(frame(b, ...polarXZ(d, r, 0), 0.4, polar(d, r)[2] + rand(-0.3, 0.3)), { ...SKY, cCrown: SKY.cCrown }, mat, { w, d: w * 0.8, h, crown, col: pick(['#f4ecf0', '#e8eef8', '#f2e8dc']), foot: below(0, 0.4, r) });
        },
        (b) => {   // Mount Wilson's masts on the San Gabriels
          for (const [d, h] of [[44, 120], [45.5, 90], [47, 140]]) mast(frame(b, ...polarXZ(d, 1390, ridgeHeight(d, LA_PEAKS) - 100 - 6), 1, 0), SKY, lamp, { h, foot: 10 });
        },
        (b) => {   // Catalina, far out on the sea
          const [x, z] = polar(-64, 1500); b.add(G.sphLow, SKY.dark, x, -50, z, 620, 120, 160, 0, polar(-64, 1500)[2], 0, '#8a6a8a');
        },
      ],
    });
    bakeShade(sky, [SKY.wall, SKY.dark, SKY.metal, SKY.sign], new THREE.Vector3(-0.8, 0.3, 0.5), 0.62, 0.5);
    // The sea under the horizon on the left: a shallow cone from 520 m out (low, to meet the water of the beach) rising to
    // the horizon, violet near and peach far, a road of light down it toward the sun; solid, drawn after the skyline's
    // models so it hides their feet, never in front of the near world.
    const SUN_DEG = (Math.atan2(-0.6, 1) * 180) / Math.PI;
    const sea = (() => {
      const pos = [], col = [], idx = [], near = new THREE.Color('#5a4a7a'), far = new THREE.Color('#f0a890'), gold = new THREE.Color('#ffd090'), R = [520, 700, 900, 1150, 1500];
      const D = []; for (let d = SEA[0]; d <= SEA[1]; d += 1.5) D.push(Math.min(d, SEA[1]));
      for (const d of D) for (const rr of R) {
        const [x, z] = polar(d, rr), f = (rr - 520) / 980; pos.push(x, -26 + 28 * Math.pow(f, 1.5), z);   // rising to the eye's height at its far edge, so the sun sinks into it
        const c = near.clone().lerp(far, Math.pow(f, 0.7)), g = Math.exp(-(((d - SUN_DEG) / 3.2) ** 2));
        c.lerp(gold, g * (0.35 + 0.6 * f)); col.push(c.r, c.g, c.b);
      }
      for (let i = 0; i < D.length - 1; i++) for (let j = 0; j < R.length - 1; j++) { const a0 = i * R.length + j, a1 = a0 + 1, b0 = a0 + R.length, b1 = b0 + 1; idx.push(a0, b0, a1, a1, b0, b1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
      m.renderOrder = -4.5; m.frustumCulled = false; return m;
    })();
    sky.add(sea);
    const glitter = (() => {   // the sun's road on the water: points of light twinkling along it
      const pts = [];
      for (let k = 0; k < 160; k++) { const rr = rand(560, 1480), d = SUN_DEG + rand(-1, 1) * (1.2 + (rr - 520) / 600), [x, z] = polar(d, rr); pts.push(x, -26 + 28 * Math.pow((rr - 520) / 980, 1.5) + 0.6, z); }
      const m = sparkles(pts, { size: 3.0, curved: false }); m.material.uniforms.on.value = 1; m.renderOrder = -4; m.frustumCulled = false; return m;
    })();
    sky.add(glitter);
    // the haze lying along the horizon all round: thick under the eye, thinning to nothing just above it
    const haze = (() => {
      const g = new THREE.CylinderGeometry(500, 500, 150, 72, 6, true), P = g.attributes.position, C = new Float32Array(P.count * 4), c = new THREE.Color('#f2b098');
      for (let i = 0; i < P.count; i++) { const y = P.getY(i) - 70, f = Math.min(1, Math.max(0, (5 - y) / 40)); C.set([c.r, c.g, c.b, Math.pow(f, 0.9) * 0.85], i * 4); P.setY(i, y); }
      g.setAttribute('color', new THREE.BufferAttribute(C, 4));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, fog: false, depthWrite: false, side: THREE.BackSide }));
      m.renderOrder = -4; m.frustumCulled = false; return m;
    })();
    sky.add(haze);
    // palms standing up black against the sky over the roofs all round the basin (not out on the sea)
    const palmCards = (() => {
      const tex = canvasTex(64, 256, (g, w, h) => {
        g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff';
        g.beginPath(); g.moveTo(w / 2 - 2.5, h); g.quadraticCurveTo(w / 2 + 4, h * 0.5, w / 2, 40); g.lineTo(w / 2 + 2, 40); g.quadraticCurveTo(w / 2 + 6, h * 0.5, w / 2 + 2.5, h); g.fill();
        for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, L = rand(16, 26); g.beginPath(); g.moveTo(w / 2 + 1, 40); g.lineTo(w / 2 + 1 + Math.cos(a) * L, 40 + Math.sin(a) * L * 0.75 + 4); g.lineTo(w / 2 + 1 + Math.cos(a + 0.2) * L * 0.8, 40 + Math.sin(a + 0.2) * L * 0.6 + 4); g.fill(); }
      }, { repeat: false });
      const mat = new THREE.MeshBasicMaterial({ map: tex, color: '#2a1a3a', transparent: true, alphaTest: 0.4, fog: false, side: THREE.DoubleSide, depthWrite: true, forceSinglePass: true });
      const spots = [];
      for (let k = 0; k < 420 && spots.length < 220; k++) { const d = rand(-180, 180); if (isSea(d) || Math.abs(d) < 3) continue; spots.push([d, rand(470, 760), rand(18, 34)]); }
      const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, spots.length), M = new THREE.Matrix4(), q = new THREE.Quaternion();
      spots.forEach(([d, rr, h], i) => { const [x, z, ry] = polar(d, rr); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry); M.compose(new THREE.Vector3(x, h / 2 - 4, z), q, new THREE.Vector3(h * 0.25, h, 1)); m.setMatrixAt(i, M); });
      m.renderOrder = -4.6; m.frustumCulled = false; return m;
    })();
    sky.add(palmCards);
    // the searchlights of a premiere at the foot of the hills, swinging across the sky
    const beams = [[-7, 1000, 0], [3, 1060, 2.1], [13, 980, 4.4]].map(([d, rr, ph]) => { const m = searchlight(1000, 18, 0.12); m.position.set(...polarXZ(d, rr, -10)); m.userData.ph = ph; sky.add(m); return m; });
    // jets coming in to land, their lights strung out over the basin and sinking toward the left: four of them, drawn
    // as one of each part (the body, the landing lights, their glow, the beacon)
    const NJ = 4, J0 = new THREE.Vector3(...polarXZ(-14, 1350, 260)), J1 = new THREE.Vector3(...polarXZ(-62, 900, 30)), JD = J1.clone().sub(J0);
    const jq = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.asin(JD.y / JD.length()), Math.atan2(JD.x, JD.z), 0, 'YXZ'));
    const jets = [
      [new THREE.BoxGeometry(4, 3, 30).translate(0, 0, -14), new THREE.MeshBasicMaterial({ color: '#4a4058', fog: false })],
      [new THREE.SphereGeometry(2.2, 8, 6), new THREE.MeshBasicMaterial({ color: hdr('#fff8e8', 4), fog: false })],
      [new THREE.SphereGeometry(7, 10, 8), new THREE.MeshBasicMaterial({ color: hdr('#fff0d8', 0.35), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })],
      [new THREE.SphereGeometry(1.2, 6, 4).translate(0, 3, -6), LAMP],
    ].map(([g, m]) => { const im = new THREE.InstancedMesh(g, m, NJ); im.frustumCulled = false; im.renderOrder = -2; sky.add(im); return im; });
    const _jm = new THREE.Matrix4(), _jp = new THREE.Vector3(), _js = new THREE.Vector3();

    // ---------- the trains ----------
    // Metro light rail waiting on the line: stainless steel, the dark band round the windows, the yellow cab end, the
    // line's letter in its colour by the destination; an old Red Car of the Pacific Electric coming at you, its whistle
    // blowing: the red body, the cream window frames, the trolley pole, the round headlamp, the board saying where it's bound
    const LINES = [['A', '#0072bc', 'DOWNTOWN LA'], ['E', '#fdb913', 'SANTA MONICA'], ['K', '#e470ab', 'EXPO / CRENSHAW'], ['C', '#58a738', 'NORWALK'], ['L', '#a05da5', 'APU / CITRUS']];
    let line = LINES[0];
    const metro = (b, c) => {
      if (c.idx === 0) line = pick(LINES);
      const zc = c.zb0 - c.bl / 2;
      for (const e of [-1, 1]) {
        b.box(VC.solid, '#2a2c32', e * (TRAIN_W / 2 + 0.008), 2.05, zc, 0.02, 1.15, c.bl - 0.3);   // the dark band round the windows
        b.box(VC.solid, '#f2c21a', e * (TRAIN_W / 2 + 0.01), 1.42, zc, 0.02, 0.07, c.bl - 0.3);   // a thin yellow line under it
      }
      b.add(G.box, VC.metal, 0, TRAIN_H + 0.18, c.zb0 - c.bl / 2, 1.4, 0.06, 0.06);   // the pantograph, folded down
      beam(b, VC.metal, -0.6, TRAIN_H + 0.12, zc + 0.8, 0.2, TRAIN_H + 0.42, zc - 0.4, 0.05, '#3a3a40');
      beam(b, VC.metal, 0.2, TRAIN_H + 0.42, zc - 0.4, 0.6, TRAIN_H + 0.12, zc + 0.6, 0.05, '#3a3a40');
      b.box(VC.metal, '#2a2a30', 0, TRAIN_H + 0.46, zc - 0.4, 1.6, 0.05, 0.12);
      if (!c.front) return;
      b.box(VC.solid, '#f2c21a', 0, 0.98, c.z0 + 0.03, TRAIN_W - 0.02, 1.26, 0.02);   // the yellow cab end (over the stock front, under its lamps)
      for (const e of [-1, 1]) b.box(VC.solid, '#f2c21a', e * (TRAIN_W / 2 + 0.012), 1.5, c.z0 - 1.0, 0.02, 2.2, 2.0);
      K.sign(b, line[2], { w: 512, h: 96, color: '#ff9a2a', bg: '#141414', font: SANS, weight: 700, size: 0.62, k: 1.6 }, 0.18, 3.0, c.z0 + 0.05, 1.3, 0.25, 1);   // in front of the stock sign box
      b.cyl(VC.glow, hdr(line[1], 1.8), -0.62, 3.0, c.z0 + 0.05, 0.15, 0.03, 'cyl', Math.PI / 2);
      K.sign(b, line[0], { w: 64, h: 64, color: '#ffffff', font: SANS, weight: 700, size: 0.8, k: 1.4 }, -0.62, 3.0, c.z0 + 0.07, 0.22, 0.22, 1);
    };
    const RED_CAR = ['HOLLYWOOD', 'VENICE SHORT LINE', 'SANTA MONICA', 'SAN FERNANDO VALLEY', 'GLENDALE'], redCarSign = { w: 512, h: 96, color: '#141414', bg: '#f4ecd4', font: SANS, weight: 700, size: 0.6, k: 1.0 };
    const peLetters = { w: 1024, h: 96, color: '#e8c060', font: '"Playfair Display", Georgia, serif', weight: 700, size: 0.66, k: 1.1 };
    const redCar = (b, c) => {
      const zc = c.zb0 - c.bl / 2;
      for (const e of [-1, 1]) {
        b.box(VC.solid, '#f0e4c8', e * (TRAIN_W / 2 + 0.008), 2.05, zc, 0.02, 1.05, c.bl - 0.3);   // the cream round the windows
        b.box(VC.solid, '#8a1a1a', e * (TRAIN_W / 2 + 0.012), 1.42, zc, 0.02, 0.1, c.bl - 0.3);   // the belt rail
        K.sign(b, 'PACIFIC ELECTRIC', peLetters, e * (TRAIN_W / 2 + 0.03), 1.05, zc, Math.min(c.bl - 2, 7), 0.42, 1, 0, (e * Math.PI) / 2, 0);
      }
      b.box(VC.solid, '#3a2a24', 0, TRAIN_H + 0.04, zc, TRAIN_W - 0.5, 0.1, c.bl - 0.6);
      beam(b, VC.metal, 0, TRAIN_H + 0.12, c.zb0 - c.bl + 1.4, 0, TRAIN_H + 0.42, c.zb0 - 2.6, 0.06, '#2a2a2e');   // the trolley pole, hooked down
      if (!c.front) return;
      b.box(VC.solid, '#b8282a', 0, 0.8, c.z0 + 0.06, TRAIN_W - 0.04, 0.75, 0.04);   // the dash, over the stock lamps: a Red Car has one, big and round
      b.cyl(VC.glow, hdr('#fff0c8', 6.5), 0, 1.2, c.z0 + 0.1, 0.26, 0.08, 'cyl', Math.PI / 2);
      b.cyl(VC.metal, '#c8a050', 0, 1.2, c.z0 + 0.07, 0.33, 0.06, 'cyl', Math.PI / 2);
      for (let k = 0; k < 6; k++) b.box(VC.solid, '#1a1a1e', -0.95 + k * 0.38, 0.28, c.z0 + 0.25, 0.08, 0.32, 0.36);   // the fender's slats
      K.sign(b, pick(RED_CAR), redCarSign, 0, 3.0, c.z0 + 0.03, 1.6, 0.3, 1);
    };
    const trainStyle = {
      body: '#d8dce2', bodyMetal: true, roof: '#b8bcc4', under: '#2a2c32', stripe: '#c8ccd2', stripe2: null, doors: true, door: '#5a5e66',
      window: '#ffe8c8', windowK: 1.05, frame: '#1a1c22', light: '#fff4dc', sign: '#1a1a1a', roofUnit: '#8a909a', extra: metro,
      rampMat: std({ map: stripeTex('#2a2c32', '#ffc23d', 6), roughness: 0.6 }), rampGlow: '#ffc23d',
      movingStyle: { body: '#b8282a', bodyMetal: false, roof: '#3a2a24', stripe: '#b8282a', stripe2: null, windows: true, doors: false, strobe: false, roofUnits: false, light: '#fff0c8', sign: '#f4ecd4', window: '#ffe0a8', windowK: 1.0, frame: '#6a1414', extra: redCar },
    };

    // ---------- the obstacles ----------
    // the famous parking sign, TOW-AWAY NO STOPPING, to slide under; a film shoot's barricade, CLOSED SET, to jump
    const towTex = canvasTex(256, 104, (g, w, h) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d8202a'; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10);
      g.lineWidth = 6; g.beginPath(); g.arc(46, 52, 28, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#141414'; g.font = `700 36px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', 46, 54);
      g.beginPath(); g.moveTo(26, 32); g.lineTo(66, 72); g.stroke();
      g.fillStyle = '#d8202a'; g.font = `700 24px ${SANS}`; g.fillText('TOW-AWAY', 164, 26); g.fillText('NO STOPPING', 164, 54);
      g.font = `500 18px ${SANS}`; g.fillText('4 PM – 7 PM  MON–FRI', 164, 82);
    }, { repeat: false });
    const barrier = barrierStyle({ c1: '#ff7a1a', c2: '#ffffff', label: '', signBg: '#ffffff', signFg: '#d8202a', glow: '#ff5a3a', post: '#8a8e94' });
    barrier.signMat = std({ map: towTex, roughness: 0.6, emissive: '#ffffff', emissiveMap: towTex, emissiveIntensity: 0.3 });
    const closedSet = { w: 512, h: 96, color: '#141414', bg: '#ffd23d', font: SANS, weight: 700, size: 0.66, k: 1.2 };
    barrier.lowExtra = (b) => {
      K.sign(b, 'CLOSED SET', closedSet, 0, 0.82, 0.07, 1.5, 0.28, 1);
      for (const x of [-1.1, 1.1]) b.add(G.sphLow, VC.solid, x, 0.12, 0.25, 0.7, 0.24, 0.4, 0, 0.3, 0, '#7a6a48');   // sandbags on its feet
      b.add(G.box, VC.solid, 0.55, 0.32, 0.32, 0.5, 0.42, 0.04, -0.25, 0, 0, '#1a1a1e');   // a clapperboard leaning on it
      for (let k = 0; k < 5; k++) b.add(G.box, VC.solid, 0.35 + k * 0.1, 0.55, 0.38, 0.08, 0.08, 0.05, -0.25, 0, 0, k % 2 ? '#f4f4f0' : '#1a1a1e');
    };

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: ROUTE.map((k) => byKey[k]),
      zoneAt: (k) => (k < 0 ? 'east' : ZONES[k % LOOP]),
      zonePool: { east: [5, 8], coast: [3, 4], west: [5, 8], canals: [1, 1], boardwalk: [1, 1], muscle: [1, 1], strand: [1, 1], palisades: [1, 1] },
      coinGeo: coinGeometry('star'), coinMat: coinMaterial('#ffc87a', '#ff6a5a'),
      update(t) {
        K.update(t); B.update(t); LM.update(t, sky.position.z);
        LAMP.color.set('#ff2a1a').multiplyScalar(Math.sin(t * 2.4) > 0.1 ? 3.2 : 0.35);
        glitter.material.uniforms.time.value = t;
        for (const m of beams) m.rotation.set(0.22 + 0.1 * Math.sin(t * 0.21 + m.userData.ph), 0, 0.42 * Math.sin(t * 0.33 + m.userData.ph));   // leaning out over the city toward you, swinging
        for (let k = 0; k < NJ; k++) { const f = (t / 80 + k / NJ) % 1; _jm.compose(_jp.lerpVectors(J0, J1, f), jq, _js.setScalar(f < 0.94 ? 1 : 0.0001)); for (const im of jets) im.setMatrixAt(k, _jm); }
        for (const im of jets) im.instanceMatrix.needsUpdate = true;
      },
    };
  },
};
