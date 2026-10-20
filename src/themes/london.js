// London: a snowy Christmas night. White stucco terraces with porticoes and wreaths, Regent Street's Portland stone under
// the Christmas lights, red-brick pubs and Christmas markets, the Thames Embankment's chain of lights, and the City's
// towers; Tube trains parked, red double-deckers coming at you, snow drifting down, and Big Ben glowing at the far end
// of the track.
import { THREE, Batcher, VC, G, std, basic, hdr, stripeTex, canvasTex, buildingGeo, CHUNK_LEN, TRAIN_W, rand, randi, pick, chance } from '../core.js';
import { barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, skyline, skyTex, SKY_VC, polar, at, EDGE, farGround } from './common.js';
import { beam } from './tokyo_kit.js';
import { makeKit, SNOW } from './london_kit.js';
import { ldnLandmarks, clockTex } from './london_landmarks.js';

const EYE = 4.5;
// Big Ben and the Palace on the horizon get their own materials so they can fade while the real tower is in view
const BB = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true });
const EYE_MAT = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true });
const BB_FACE = new THREE.MeshBasicMaterial({ map: clockTex(), fog: false, transparent: true, color: new THREE.Color('#ffffff').multiplyScalar(1.15) });

// Big Ben on the horizon, drawn huge: the floodlit panelled shaft, four glowing dials, the belfry and the gilded spire
function bigBen(b) {
  const [x, z] = polar(0, 900), W = 34, F = z + W / 2;
  const stone = '#8a6c46', dark = '#5a452c', light = hdr('#d8b070', 0.95), win = hdr('#ffd28a', 0.85), gold = hdr('#ffcf6a', 1.5);
  b.add(G.box, BB, x, (150 - 95) / 2, z, W, 245, W, 0, 0, 0, stone);
  for (let k = -3; k <= 3; k++) b.add(G.box, BB, x + k * 4.6, 30, F + 0.4, 0.9, 240, 0.6, 0, 0, 0, dark);
  for (const o of [-W / 2 + 1.2, W / 2 - 1.2]) b.add(G.box, BB, x + o, 30, F + 0.6, 2.4, 240, 1.2, 0, 0, 0, light);
  for (let y = -40; y < 150; y += 26) b.add(G.box, BB, x, y, F + 0.5, W, 1.4, 0.8, 0, 0, 0, light);
  for (let y = 10; y < 140; y += 26) for (const o of [-6.9, 6.9]) b.add(G.box, BB, x + o, y + 11, F + 0.7, 2.2, 9, 0.4, 0, 0, 0, win);
  b.add(G.box, BB, x, 167, z, W + 6, 34, W + 6, 0, 0, 0, stone);
  b.add(G.plane, BB_FACE, x, 167, z + (W + 6) / 2 + 0.6, 32, 32, 1);
  for (const sx of [-1, 1]) b.add(G.plane, BB_FACE, x + sx * ((W + 6) / 2 + 0.6), 167, z, 32, 32, 1, 0, sx * Math.PI / 2, 0);
  for (const y of [150.5, 184]) b.add(G.box, BB, x, y, z + (W + 6) / 2 + 0.7, W + 6, 1.4, 1, 0, 0, 0, gold);
  b.add(G.box, BB, x, 195, z, W, 20, W, 0, 0, 0, dark);
  for (const o of [-10, 0, 10]) b.add(G.box, BB, x + o, 195, F + 0.6, 6, 15, 0.6, 0, 0, 0, hdr('#ffc870', 0.8));
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add(G.cone4, BB, x + dx * (W / 2 + 2), 190, z + dz * (W / 2 + 2), 5, 14, 5, 0, 0, 0, stone);
  b.add(G.cone4, BB, x, 219, z, W * 1.42, 28, W * 1.42, 0, 0, 0, '#2a2632');
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) beam(b, BB, x + dx * W / 2, 205, z + dz * W / 2, x + dx * 5, 232, z + dz * 5, 1.3, gold);
  b.add(G.box, BB, x, 237, z, 11, 9, 11, 0, 0, 0, hdr('#fff0c8', 1.6));
  b.add(G.cone4, BB, x, 254, z, 15, 26, 15, 0, 0, 0, '#2a2632');
  b.add(G.box, BB, x, 272, z, 1.4, 14, 1.4, 0, 0, 0, gold);
  b.sph(BB, hdr('#ffd86a', 2.6), x, 280, z, 2);
  // the Palace of Westminster strung along the horizon to the left, Victoria Tower at its far end
  for (let deg = -2.4; deg > -17; deg -= 0.9) {
    const [px, pz, ry] = polar(deg, 880), h = 50 + (Math.round(deg * 3) % 3 === 0 ? 10 : 0);
    b.add(G.box, BB, px, (h - 95) / 2, pz, 15, h + 95, 30, 0, ry, 0, stone);
    b.add(G.box, BB, px + 15.5 * Math.sin(ry), h - 18, pz + 15.5 * Math.cos(ry), 9, 22, 0.5, 0, ry, 0, win);
    b.add(G.cone4, BB, px, h + 6, pz, 4, 12, 4, 0, ry, 0, stone);
  }
  const [vx, vz, vry] = polar(-18.4, 880);
  b.add(G.box, BB, vx, (170 - 95) / 2, vz, 44, 170 + 95, 44, 0, vry, 0, stone);
  for (let y = 20; y < 160; y += 18) b.add(G.box, BB, vx + 22.5 * Math.sin(vry), y, vz + 22.5 * Math.cos(vry), 26, 10, 0.5, 0, vry, 0, win);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add(G.cone4, BB, vx + dx * 20, 182, vz + dz * 20, 7, 24, 7, 0, 0, 0, stone);
}
// the London Eye, face-on, its rim and capsules glowing
function skyEye(b, deg, r) {
  const [x, z, ry] = polar(deg, r), R = 64, cy = 74, tx = Math.cos(ry), tz = -Math.sin(ry);
  const P = (a, rr) => [x + tx * Math.cos(a) * rr, cy + Math.sin(a) * rr, z + tz * Math.cos(a) * rr];
  for (let k = 0; k < 48; k++) {
    const a0 = (k / 48) * Math.PI * 2, a1 = ((k + 1) / 48) * Math.PI * 2;
    beam(b, EYE_MAT, ...P(a0, R), ...P(a1, R), 2.2, hdr('#ff4a8a', 1.5));
    if (k % 3 === 0) beam(b, EYE_MAT, ...P(a0, 3), ...P(a0, R), 0.5, '#8a8ea8');
    if (k % 3 === 0) b.sph(EYE_MAT, hdr('#d8ecff', 1.6), ...P(a0, R + 4), 2.4, true);
  }
  for (const s of [-1, 1]) beam(b, EYE_MAT, x, cy, z, x + tx * s * 30, -10, z + tz * s * 30, 3, '#9aa0b8');
}
// skyline buildings: low in front of Big Ben and the Palace, none in front of the Eye
const ldnClear = (a, rr) => {
  const deg = (a * 180) / Math.PI;
  if (deg > -21 && deg < 8) return EYE + rr * Math.tan(deg > -3 ? 0.06 : 0.035);
  if (Math.abs(deg - 21) < 6) return EYE + rr * Math.tan(0.03);
  return Infinity;
};

export default {
  id: 'ldn', name: '伦敦', en: 'LONDON', tagline: '圣诞雪夜 · 雾都灯火',
  blurb: '圣诞夜的伦敦飘着雪：白色排屋门前挂着冬青花环，摄政街的天使灯饰高悬，红砖老酒馆里透出琥珀色的灯光，泰晤士河堤上串起一条灯链。从大本钟和威斯敏斯特宫出发，穿过特拉法加广场的挪威圣诞树、皮卡迪利广场的弧形大屏和白金汉宫的卫兵，冲上伦敦塔桥，经过伦敦眼下的圣诞集市，一路跑到圣保罗大教堂的穹顶下；跑道尽头，大本钟的钟面亮着暖光。',
  sights: ['威斯敏斯特 · 大本钟', '特拉法加广场', '皮卡迪利广场', '白金汉宫', '伦敦塔桥', '伦敦眼', '圣保罗大教堂'],
  accent: '#2ee08a', accent2: '#ff4057', portal: '#2ee08a',
  sky: { top: '#050816', mid: '#1a2142', bot: '#74586a', glow: '#ffa060', glowK: 0.32, sun: '#000000', sunK: 0, sunDir: [0, -0.06, -1], sunSize: 0.0001,
    cloud: 0.5, cloudColor: '#3e3c5c', horizon: -0.07, stars: false },
  fog: { color: '#262b48', near: 22, far: 230 },
  light: { hemiSky: '#b4c4ff', hemiGround: '#3a3240', hemi: 0.9, dir: '#ffd8b4', dirK: 0.5, dirPos: [0.2, 0.4, -1] },
  exposure: 0.95, bloom: { strength: 0.85, radius: 0.55, threshold: 0.82 },
  weather: [{ mode: 'fall', count: 900, colors: ['#ffffff', '#eef4ff', '#dce8ff'], size: 0.36, k: 1.0, box: [46, 20, 90], speed: 0.9, shape: 5 }],
  coin: 'fifty', music: 'ldn', jingle: 'bigben',

  build() {
    const K = makeKit();
    const LM = ldnLandmarks(K), fades = [[LM.landmarks[0], 68, [BB, BB_FACE]], [LM.landmarks[5], 60, [EYE_MAT]]];
    const pave = canvasTex(128, 128, (g, w, h) => {   // York stone paving under a dusting of snow, drifts along the kerb
      g.fillStyle = '#3c3e46'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32) for (let x = ((y / 32) % 2) * 32; x < w + 64; x += 64) {
        const v = randi(-8, 8); g.fillStyle = `rgb(${92 + v},${94 + v},${102 + v})`; g.fillRect(x - 31, y + 1, 62, 30);
      }
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(228,236,248,${rand(0.25, 0.6).toFixed(2)})`; g.beginPath(); g.ellipse(rand(0, w), rand(0, h), rand(4, 14), rand(2, 7), rand(0, 3), 0, 7); g.fill(); }
      const gr = g.createLinearGradient(0, 0, 18, 0); gr.addColorStop(0, 'rgba(232,240,252,0.9)'); gr.addColorStop(1, 'rgba(232,240,252,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 18, h);
    });
    pave.repeat.set(1, 24);
    const track = makeTrack({ gravel: '#2e3038', spots: ['#3a3c46', '#1e2026', '#d8e0ee'], sleeper: '#3a3430', rail: '#c9ced8', railMatte: true,
      edge: '#ffd23d', edgeK: 1.6, sideMat: std({ map: pave, roughness: 0.85 }) });

    // the Thames below the Embankment: granite wall, dolphin lamps and their chain of lights, boats, the far bank
    const riverSide = (b, s) => {
      b.add(G.plane, K.thames, s * 131, -2.2, -40, 238, 80, 1, -Math.PI / 2, 0, 0);
      b.box(VC.solid, '#3a3a40', s * 131, -1.2, -79.9, 238, 2.2, 0.2);
      K.embankment(b, s);
      for (let k = randi(4, 7); k > 0; k--) {
        const x = s * rand(120, 170), z = -rand(6, 74);
        const [tx, mt] = pick([[K.stone, K.stoneMat], [K.brick, K.brickMat], [K.stucco, K.stuccoMat]]);
        b.addM(buildingGeo(rand(12, 20), rand(10, 24), rand(10, 16), tx, 2.0, 3.3), mt, at(x, -2.2, z), '#ffffff');
        K.refl(b, x - s * 6, z, 80, 2.2, pick(['#ffd9a0', '#9fd8ff', '#ff9ad5', '#fff0d0']), -2.1);
      }
      if (chance(0.55)) K.boat(b, s * rand(30, 70), -rand(16, 64));
      const z0 = rand(4, 8);
      for (let z = z0; z < CHUNK_LEN - 2; z += 14) { K.dolphinLamp(b, s * (EDGE + 6.4), -z); if (z + 14 < CHUNK_LEN) K.lightChain(b, s * (EDGE + 6.4), -z, -z - 14); }
      const blue = chance(0.4);
      for (let z = rand(3, 7); z < CHUNK_LEN - 3; z += rand(9, 12)) K.bareTree(b, s * (EDGE + 3.3), -z, rand(1.05, 1.2), { lights: blue ? 'ice' : 'warm' });
      for (let k = randi(1, 2); k > 0; k--) K.bench(b, s * (EDGE + 5.4), -rand(8, 72), s);
      K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 5.6), 2, CHUNK_LEN - 2, randi(4, 8));
    };
    // a Christmas market lane: chalets along one pavement, stalls lit under festoons
    const market = (b, s) => {
      for (let z = rand(4, 8), n = 0; z < CHUNK_LEN - 3 && n < 14; z += 3.6, n++) K.chalet(b, s * (EDGE + 2.6), -z, s);
      K.crowd(b, s * (EDGE + 0.5), s * (EDGE + 1.0), 2, CHUNK_LEN - 2, randi(6, 10));
    };

    // regular blocks: stucco terraces, Regent Street, red-brick pubs and markets, the Embankment, the City
    const decor = () => {
      const b = new Batcher();
      const r = Math.random(), kind = r < 0.28 ? 'terrace' : r < 0.52 ? 'west' : r < 0.68 ? 'pub' : r < 0.84 ? 'river' : 'city';
      const wetSide = pick([-1, 1]), dry = pick(['terrace', 'west']), mkt = kind === 'pub' && chance(0.6) ? pick([-1, 1]) : 0;
      const tube = kind === 'city' || (kind === 'west' && chance(0.5)) ? pick([-1, 1]) : 0, zTube = rand(14, 64);
      for (const side of [-1, 1]) {
        const sk = kind === 'river' ? (side === wetSide ? 'river' : dry) : kind;
        if (sk === 'river') { riverSide(b, side); continue; }
        farGround(b, side, '#1a1c24');
        if (sk === 'terrace') {
          K.terraces(b, side, 0, CHUNK_LEN);
          for (let z = rand(3, 8); z < CHUNK_LEN - 2; z += rand(10, 13)) K.bareTree(b, side * (EDGE + 5.6), -z, rand(1.0, 1.15), { lights: chance(0.5) ? 'warm' : false });
          for (let z = rand(5, 9); z < CHUNK_LEN - 8; z += 15) K.vicLamp(b, side * (EDGE + 0.8), -z, chance(0.5));
          if (chance(0.5)) K.pillarBox(b, side * (EDGE + 1.0), -rand(10, 70));
          if (chance(0.25)) K.snowman(b, side * (EDGE + 4.2), -rand(10, 70));
          if (chance(0.35)) K.carolers(b, side * (EDGE + 4.0), -rand(14, 66), side);
          K.crowd(b, side * (EDGE + 1.2), side * (EDGE + 4.6), 2, CHUNK_LEN - 2, randi(3, 7));
        } else if (sk === 'west') {
          K.westRow(b, side, 0, CHUNK_LEN);
          for (let z = rand(6, 10); z < CHUNK_LEN - 8; z += 14) K.vicLamp(b, side * (EDGE + 0.8), -z, true);
          if (chance(0.6)) K.phoneBox(b, side * (EDGE + 1.2), -rand(8, 72), side * Math.PI / 2);
          if (chance(0.4)) K.pillarBox(b, side * (EDGE + 1.0), -rand(8, 72));
          if (chance(0.25)) K.brassBand(b, side * (EDGE + 4.8), -rand(14, 66), side);
          K.crowd(b, side * (EDGE + 1.2), side * (EDGE + 6.4), 2, CHUNK_LEN - 2, randi(8, 14), { bags: true });
        } else if (sk === 'pub') {
          K.brickRow(b, side, 0, CHUNK_LEN);
          if (side === mkt) market(b, side);
          else {
            for (let z = rand(5, 9); z < CHUNK_LEN - 8; z += 13) K.vicLamp(b, side * (EDGE + 0.8), -z, chance(0.4));
            if (chance(0.5)) K.phoneBox(b, side * (EDGE + 1.2), -rand(8, 72), side * Math.PI / 2);
            for (let z = rand(6, 12); z < CHUNK_LEN - 4; z += rand(10, 16)) K.bollard(b, side * (EDGE + 0.6), -z);
            K.crowd(b, side * (EDGE + 1.2), side * (EDGE + 6.4), 2, CHUNK_LEN - 2, randi(5, 10));
          }
        } else {
          K.cityRow(b, side, 0, CHUNK_LEN);
          for (let z = rand(6, 12); z < CHUNK_LEN - 8; z += 16) K.vicLamp(b, side * (EDGE + 0.8), -z, false);
          for (let z = rand(4, 8); z < CHUNK_LEN - 2; z += rand(12, 16)) if (side !== tube || Math.abs(z - zTube) > 6) K.bareTree(b, side * (EDGE + 5.8), -z, rand(1.0, 1.15), { lights: chance(0.6) ? 'ice' : 'warm' });
          for (let z = rand(5, 9); z < CHUNK_LEN - 4; z += 8) K.bollard(b, side * (EDGE + 0.5), -z);
          if (chance(0.6)) K.cab(b, side * (EDGE + 2.8), -rand(10, 70), side > 0 ? 0 : Math.PI);
          K.crowd(b, side * (EDGE + 1.2), side * (EDGE + 6.4), 2, CHUNK_LEN - 2, randi(6, 12));
        }
        if (side === tube) K.tubeEntrance(b, side * (EDGE + 4.2), -zTube, side);
        if (chance(0.3)) K.belisha(b, side * (EDGE + 0.4), -pick([4, 76]));
      }
      if (kind === 'west') for (const z of chance(0.5) ? [14, 40, 66] : [20, 52]) chance(0.5) ? K.angel(b, -z) : K.garland(b, -z);
      if (kind === 'pub' && (mkt || chance(0.5))) for (const z of [12, 30, 48, 66]) if (chance(0.75)) K.festoon(b, -z);
      if (kind === 'terrace' && chance(0.3)) for (const z of [20, 56]) K.garland(b, -z);
      return b.build();
    };

    const sky = skyline({
      tex: skyTex({ wall: '#0b0d1c', lit: ['#fff1d6', '#d6ecff', '#ffd9a8', '#ffe8c0'], chance: 0.32 }),
      colors: ['#ffffff', '#c7d2ff', '#b0b9e6', '#9aa4d9'], count: 150, h: [36, 150], k: 1.5,
      heightCap: ldnClear, follow: 190,
      landmarks: [
        bigBen,
        (b) => skyEye(b, 21, 700),
        (b, mat) => {   // the Shard, its glass spire lit at the top
          const [x, z] = polar(33, 840);
          b.add(G.cone4, SKY_VC, x, (300 - 95) / 2, z, 64, 300 + 95, 64, 0, 0.3, 0, '#3a4468');
          b.add(G.cone4, SKY_VC, x, 275, z, 9.6, 50, 9.6, 0, 0.3, 0, hdr('#e8f0ff', 1.3));
          for (let y = -60; y < 240; y += 22) b.add(G.box, SKY_VC, x, y, z + 0.5 * 64 * 0.354 * (300 - y) / 395 + 0.6, 0.354 * 64 * (300 - y) / 395, 1.2, 0.4, 0, 0, 0, hdr('#cfe0ff', 0.6));
          b.sph(SKY_VC, hdr('#ff2a2a', 6), x, 302, z, 2.2);
          void mat;
        },
        (b) => {   // St Paul's dome floodlit on the left
          const [x, z] = polar(-31, 760);
          b.add(G.cyl, SKY_VC, x, (60 - 95) / 2, z, 90, 155, 90, 0, 0, 0, '#5a5040');
          b.add(G.cyl, SKY_VC, x, 70, z, 70, 22, 70, 0, 0, 0, hdr('#f0e2c0', 0.75));
          b.add(G.sph, SKY_VC, x, 80, z, 62, 70, 62, 0, 0, 0, hdr('#c8c4c0', 0.65));
          b.add(G.cyl, SKY_VC, x, 120, z, 8, 14, 8, 0, 0, 0, hdr('#f0e2c0', 0.9));
          b.sph(SKY_VC, hdr('#ffd86a', 2.4), x, 130, z, 3.2);
        },
        (b, mat) => {   // the City cluster: the Gherkin, the Walkie-Talkie, the Cheesegrater
          const [gx, gz] = polar(42, 800);
          b.add(G.sph, SKY_VC, gx, 40, gz, 44, 270, 44, 0, 0, 0, '#2a3a5a');
          for (let y = -60; y < 160; y += 16) b.add(G.cyl, SKY_VC, gx, y, gz, 44 * Math.sqrt(Math.max(0.05, 1 - ((y - 40) / 135) ** 2)) + 0.6, 2, 44 * Math.sqrt(Math.max(0.05, 1 - ((y - 40) / 135) ** 2)) + 0.6, 0, 0, 0, hdr('#bfe0ff', 0.7));
          const [wx, wz, wry] = polar(46.5, 780);
          for (let k = 0; k < 8; k++) b.add(G.box, SKY_VC, wx, -95 + k * 28 + 14, wz, 34 + k * 3, 28, 30, 0, wry, 0, k % 2 ? '#2a3050' : hdr('#d8e8ff', 0.6));
          const [cx, cz, cry] = polar(50, 820);
          b.addM(buildingGeo(40, 320, 40, { cols: 8, rows: 16 }, 3.4, 4.2), mat, at(cx, -95, cz, cry), '#c8d4ff');
          b.sph(SKY_VC, hdr('#ff2a2a', 6), cx, 228, cz, 2);
        },
        (b) => {   // the BT Tower with its ring of lights
          const [x, z] = polar(-44, 820);
          b.add(G.cyl, SKY_VC, x, (190 - 95) / 2, z, 18, 285, 18, 0, 0, 0, '#3a3e58');
          for (const y of [130, 142, 154]) b.add(G.cyl, SKY_VC, x, y, z, 24, 6, 24, 0, 0, 0, '#4a4e68');
          b.add(G.cyl, SKY_VC, x, 168, z, 22, 8, 22, 0, 0, 0, hdr('#3dfff0', 1.6));
          b.sph(SKY_VC, hdr('#ff2a2a', 6), x, 196, z, 2);
        },
        (b) => {   // One Canada Square far off at Canary Wharf, its pyramid light blinking
          const [x, z] = polar(62, 900);
          b.add(G.box, SKY_VC, x, (210 - 95) / 2, z, 40, 305, 40, 0, 0, 0, '#5a6280');
          b.add(G.cone4, SKY_VC, x, 222, z, 57, 24, 57, 0, 0, 0, '#8a92b0');
          b.sph(SKY_VC, hdr('#ffffff', 5), x, 236, z, 2.4);
        },
        (b) => {   // the far bank of the river, lights scattered in the haze
          for (let k = 0; k < 120; k++) {
            const deg = rand(-75, 75);
            if (Math.abs(deg) < 7) continue;
            const [x, z] = polar(deg, 560);
            b.add(G.box, SKY_VC, x, rand(2, 26), z, rand(1.2, 3), rand(0.8, 2), 0.5, 0, (-deg * Math.PI) / 180, 0, hdr(pick(['#ffd9a0', '#fff0d0', '#ffcf8a', '#cfe6ff']), rand(1.0, 1.8)));
          }
        },
      ],
    });

    // London Underground trains parked (white, red doors and cab, blue skirt); red double-deckers come at you
    const trainStyle = {
      body: '#e8eaee', bodyMetal: false, roof: '#c8ccd2', under: '#1a1c20', stripe: '#1c3f94', stripe2: '#1c3f94', doors: true, door: '#dc241f',
      window: '#eaf2ff', windowK: 1.5, frame: '#16181e', light: '#f4f8ff', sign: '#ff9a3c', roofUnit: '#9aa0a8',
      rampMat: std({ map: stripeTex('#1e2026', '#ffcc00', 6), roughness: 0.6 }), rampGlow: '#ffd23d',
      extra: (b, c) => {   // the red cab front and the roundel on each car
        for (const sx of [-1, 1]) {
          const x = sx * (TRAIN_W / 2 + 0.03);
          b.add(G.plane, K.roundelMat, x, 1.05, c.zb0 - c.bl * 0.22, 0.56, 0.56, 1, 0, sx * Math.PI / 2, 0);
          b.box(VC.solid, '#1c3f94', x - sx * 0.01, 0.62, c.zb0 - c.bl / 2, 0.02, 0.28, c.bl - 0.2);
        }
        if (c.front) {
          b.box(VC.solid, '#dc241f', 0, 1.2, c.z0 + 0.025, TRAIN_W - 0.1, 1.5, 0.01);
          for (const sx of [-1, 1]) b.box(VC.solid, '#dc241f', sx * 0.99, 2.42, c.z0 + 0.025, 0.22, 0.95, 0.01);
        }
      },
      movingStyle: { body: '#d01e24', bodyMetal: false, roof: '#c81c22', under: '#141416', stripe: '#d01e24', stripe2: null, frame: '#d01e24', windows: false, gangway: false, strobe: false,
        doors: false, roofUnits: false, light: '#fff4d6', sign: '#ffd23d', window: '#ffe6c0', windowK: 1.0,
        extra: (b, c) => {   // two decks of lit windows, the cream band, the route blind
          for (const sx of [-1, 1]) {
            const x = sx * (TRAIN_W / 2 + 0.006), n = 5, step = (c.bl - 1.4) / n;
            for (let i = 0; i < n; i++) {
              const wz = c.zb0 - 0.7 - step * (i + 0.5);
              for (const [y, h] of [[1.42, 0.8], [2.62, 0.7]]) { b.box(VC.solid, '#1a1214', x, y, wz, 0.02, h + 0.1, step * 0.86); b.box(VC.glow, hdr('#ffe6c0', 0.95), x + sx * 0.01, y, wz, 0.025, h, step * 0.78); }
            }
            b.box(VC.solid, '#e8dcc0', x + sx * 0.005, 2.05, c.zb0 - c.bl / 2, 0.02, 0.12, c.bl - 0.2);
          }
          if (c.front) {
            b.box(VC.glow, hdr('#ffe6c0', 0.32), 0, 1.5, c.z0 + 0.03, TRAIN_W - 0.5, 0.8, 0.02);
            b.box(VC.solid, '#141416', 0, 0.62, c.z0 + 0.03, TRAIN_W - 0.2, 0.3, 0.04);
            b.box(VC.solid, '#141416', 0, 2.03, c.z0 + 0.035, 1.7, 0.4, 0.02);
            b.add(G.plane, busBlind, 0, 2.03, c.z0 + 0.05, 1.5, 0.3, 1);
          }
        } },
    };
    const busBlind = basic({ map: textTex2('15  TRAFALGAR SQ'), color: hdr('#ffffff', 1.6) });

    // MIND THE GAP gantries under a roundel to slide beneath; red-and-white roadworks barriers to jump
    const barrier = barrierStyle({ c1: '#dc241f', c2: '#ffffff', label: 'MIND THE GAP', signBg: '#1c3f94', signFg: '#ffffff', glow: '#ffd23d', post: '#e8e8ea' });
    barrier.lowBarMat = std({ map: stripeTex('#dc241f', '#ffffff', 6), roughness: 0.6 });
    barrier.highExtra = (b) => {
      b.box(VC.metal, '#e8e8ea', 0, 3.0, 0, 0.08, 0.6, 0.08);
      b.add(G.plane, K.roundelMat, 0, 3.75, 0.05, 1.2, 1.2, 1);
      b.add(G.plane, K.roundelMat, 0, 3.75, -0.05, 1.2, 1.2, 1, 0, Math.PI, 0);
    };
    const closedTex = canvasTex(256, 128, (g, w, h) => {   // the ROAD CLOSED board
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#dc241f'; g.lineWidth = 12; g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = '#141414'; g.font = '900 40px "Russo One", "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('ROAD', w / 2, 46); g.fillText('CLOSED', w / 2, 88);
    }, { repeat: false });
    const closedMat = std({ map: closedTex, roughness: 0.5, emissive: '#ffffff', emissiveMap: closedTex, emissiveIntensity: 0.3 });
    barrier.lowExtra = (b) => {
      b.box(VC.metal, '#888888', 0, 1.15, 0, 0.05, 0.3, 0.05);
      b.add(G.plane, closedMat, 0, 1.6, 0.035, 0.9, 0.45, 1);
      b.add(G.plane, closedMat, 0, 1.6, -0.035, 0.9, 0.45, 1, 0, Math.PI, 0);
      b.box(VC.solid, SNOW, 0, 1.0, 0, 2.2, 0.05, 0.14);
    };

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: LM.landmarks,
      coinGeo: coinGeometry('fifty'), coinMat: coinMaterial('#ffd04a', '#ffa000'),
      update(t) {
        K.update(t); LM.update(t);
        // fade the horizon's Big Ben (and the Eye) while the real one is coming up, bring it back once passed
        for (const [lm, dz, mats] of fades) {
          const ch = lm.obj && lm.obj.parent;
          let k = 1;
          if (ch && ch.parent) {
            const D = sky.position.z - ch.position.z + dz;
            k = D > 330 || D < -90 ? 1 : D > 250 ? (D - 250) / 80 : D < -40 ? (-40 - D) / 50 : 0;
          }
          for (const m of mats) { m.opacity = k; m.visible = k > 0.01; }
        }
      },
    };
  },
};

// the bus's route blind: amber letters on black
function textTex2(text) {
  return canvasTex(512, 96, (g, w, h) => {
    g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd23d'; g.font = '700 58px "Chakra Petch", "Helvetica Neue", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 3);
  }, { repeat: false });
}
