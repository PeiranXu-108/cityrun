// Moscow on a frosty winter evening, the sun just going down at the end of the street and the snow turning pink: the
// Stalinist avenues with their light garlands strung high over the road, the pastel merchant houses of the Arbat and the
// old lanes under snowy roofs and icicles, little churches with gold and blue domes in their churchyards, the panel
// blocks of the outer districts round their snowed-in courtyards, the boulevards' lime trees wound with lights. Moscow
// University's spire stands at the far end of the track among the Stalinist high-rises, Moscow-City's glass to the left,
// the Ostankino tower to the right, the power stations' plumes of steam standing straight up in the cold. Metro trains
// wait on the line; a green elektrichka comes at you sounding its horn.
import { THREE, Batcher, VC, G, std, basic, hdr, stripeTex, canvasTex, planeUV, CHUNK_LEN, TRAIN_W, TRAIN_H, rand, randi, pick, chance } from '../core.js';
import { barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, skyline, skyTex, SKY_VC, polar, polarXZ, below, EDGE, farGround } from './common.js';
import { beam } from './tokyo_kit.js';
import { frame, bakeShade } from './ny_icons.js';
import { makeKit, X0, SANS, SERIF, SNOW, STALIN_SIGNS, ARBAT_SIGNS, PANEL_SIGNS, OLD_SIGNS, STALIN, PASTEL } from './moscow_kit.js';
import { mgu, vysotka, ostankino, cityTower, CITY, chimney, church } from './moscow_icons.js';
import { mskLandmarks } from './moscow_landmarks.js';

const BLURB = '冬日傍晚的莫斯科：太阳正落在街道尽头，雪地被晚霞染成粉色，空气冷得发亮。斯大林式大楼沿着特维尔大街排开，头顶高高挂着新年灯串；阿尔巴特街和老城小巷里是粉黄、薄荷绿、淡蓝的老房子，屋顶积着雪、檐下挂着冰凌；街角的小教堂顶着金色和蓝底金星的洋葱顶，远处是一圈圈苏联时代的板楼和雪中的院子，林荫道上的椴树缠满灯串。路边有亮着灯的报亭和花亭、地铁口的红色 М、无轨电车、积雪的拉达和黄色出租车，戴毛皮帽的行人、裹着头巾的老奶奶、拉着雪橇的小孩。从红场的圣瓦西里大教堂出发，沿莫斯科河看克里姆林宫，经过大剧院，钻进共青团地铁站的金色穹顶大厅，走过阿尔巴特街和救世主大教堂，穿过高尔基公园的大门、从克里米亚大桥下跑过，再到新圣女修道院、莫斯科城的玻璃大楼和全俄展览中心的东方号火箭；街道尽头，莫斯科大学的尖顶一直立在晚霞里。';
const SIGHTS = ['红场 · 圣瓦西里大教堂', '克里姆林宫 · 莫斯科河', '大剧院', '共青团地铁站', '阿尔巴特街', '救世主大教堂', '高尔基公园 · 克里米亚大桥', '新圣女修道院', '莫斯科城', '全俄展览中心 · 东方号火箭'];

// the skyline's models: unlit, their shading baked; floodlit stone, gold spires catching the last of the sun
const skyMat = (o = {}) => new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, ...o });
const SKY = {
  lo: true, wall: skyMat(), brick: skyMat(), glow: skyMat(), gold: skyMat(), dark: skyMat(), roof: skyMat(), star: skyMat({ side: THREE.DoubleSide }), glass: skyMat(), steam: skyMat({ transparent: true, opacity: 0.82, depthWrite: false }), bronze: skyMat(), clock: skyMat(),
  cWall: hdr('#e8d4c0', 0.86), cTrim: hdr('#f4e8d8', 0.95), cCream: hdr('#f0d8a8', 0.9), cBrick: hdr('#c86a54', 0.8), cBrick2: hdr('#b85a48', 0.8), cRoof: hdr('#3a6a5a', 0.7), cGold: hdr('#ffd060', 1.6),
  cWin: hdr('#ffd090', 1.4), cBell: hdr('#ffc870', 1.2), cDark: hdr('#1a1a24', 1), cStar: hdr('#ff3a2a', 2.8), cSpire: hdr('#f0c050', 1.5), cTower: hdr('#d8d0d8', 0.9), cRedBand: hdr('#d8403a', 0.95),
  cOffice: hdr('#e8f2ff', 1.25), cCrown: hdr('#bfe8ff', 1.7), cSteam: hdr('#ffe4ec', 1.05), cBronze: hdr('#5a4a3a', 1), cClock: hdr('#1a1e30', 1),
  tint: (c) => hdr(c, 0.75),
};
const LED = skyMat();   // the Ostankino tower's ring of lights, slowly changing colour
// the icons that stand clear of the random towers: [degrees, radius]
const ICONS = [[0, 900], [-13, 760], [13, 820], [-27, 1150], [30, 1400], [21, 700], [42, 860], [-42, 840]];
const clear = (a, rr) => (Math.abs(a) < 0.12 || ICONS.some(([d, r]) => Math.abs(a - (d * Math.PI) / 180) < (Math.abs(d + 27) < 1 ? 0.13 : 0.06) && rr < r + 80) ? 0 : Math.abs(a) < 0.3 ? 4.5 + rr * Math.tan(0.06) : 90);
// floodlights at the foot of the walls: brighter low down, the towers darkening as they rise into the dusk
function floodGrad(obj, mats, y0, y1, lo = 1.2, hi = 0.6) {
  obj.traverse((m) => {
    if (!m.isMesh || !mats.includes(m.material)) return;
    const p = m.geometry.attributes.position, c = m.geometry.attributes.color;
    for (let i = 0; i < c.count; i++) { const t = Math.min(1, Math.max(0, (p.getY(i) - y0) / (y1 - y0))), f = lo + (hi - lo) * Math.pow(t, 0.8); c.setXYZ(i, c.getX(i) * f, c.getY(i) * f, c.getZ(i) * f); }
    c.needsUpdate = true;
  });
}

export default {
  id: 'msk', name: '莫斯科', en: 'MOSCOW', tagline: '冬日霞光 · 金顶红墙',
  blurb: BLURB, sights: SIGHTS,
  accent: '#ff5a6a', accent2: '#ffd060', portal: '#ff6a7a',
  sky: { top: '#24306a', mid: '#8a74b0', bot: '#ffb48c', glow: '#ff8a5a', glowK: 0.55, sun: '#ffb060', sunK: 0.9, sunDir: [0.06, 0.018, -1], sunSize: 0.0013,
    cloud: 0.28, cloudColor: '#d890a8', horizon: -0.07, stars: false, follow: true },
  envSky: { bot: '#6a74a8', glow: '#8a7aa8', glowK: 0.2, sunK: 0.35 },
  fog: { color: '#9a88a8', near: 34, far: 280 },
  light: { hemiSky: '#b0c0ff', hemiGround: '#a898a8', hemi: 0.95, dir: '#ffb080', dirK: 0.85, dirPos: [0.06, 0.14, -1] },
  exposure: 1.0, bloom: { strength: 0.6, radius: 0.5, threshold: 0.9 },
  weather: [
    { mode: 'fall', shape: 5, count: 260, colors: ['#ffffff', '#f4f0ff', '#ffe8f0'], size: 0.22, k: 0.9, box: [44, 18, 90], speed: 0.55 },
    { mode: 'float', shape: 0, count: 150, colors: ['#ffffff', '#fff0d8', '#e0e8ff'], size: 0.07, k: 2.2, box: [30, 12, 60], speed: 0.4 },
  ],
  coin: 'matryoshka', music: 'msk', jingle: 'kolokola', horn: 'elektrichka',

  build() {
    const K = makeKit();
    const LM = mskLandmarks(K);
    const track = makeTrack({ gravel: '#b8bcc8', spots: ['#9a9ea8', '#d8dce6', '#7a7a82'], sleeper: '#3a3436', rail: '#c8ccd4', edge: '#ffcf8a', edgeK: 1.2, sideMat: K.sideMat });

    // ---------- the street kinds ----------
    const free = (taken, z, r) => !taken.some((t) => Math.abs(t - z) < r);
    const kerb = (b, s, { cars = true, bus = false } = {}) => {   // the kerb lane: slush, cars and cabs, the snow bank, the trolleybus wires over it
      b.box(VC.solid, '#4a4a52', s * 5.3, 0.03, -40, 3.0, 0.03, 80);
      K.snowBank(b, s * 7.0, 1, CHUNK_LEN);
      const taken = [];
      if (bus && chance(0.5)) { const z = rand(14, 60); K.trolleybus(b, s * 5.3, -z, s); taken.push(z - 5, z, z + 5); }
      if (cars) for (let k = randi(1, 3); k > 0; k--) { const z = rand(4, 76); if (free(taken, z, 6)) { (chance(0.35) ? K.taxi : K.lada)(b, s * 5.3, -z, s); taken.push(z); } }
      if (bus) K.wires(b, s * 4.7, 0, CHUNK_LEN, s);
    };
    const pavement = (b, s, x1) => K.snowField(b, s * (10.75 + x1) / 2, -40, x1 - 10.75, 80, 0.035);
    const tverskayaSide = (b, s) => {   // the Stalinist avenue: grand blocks, the kerb lane and its wires, kiosks, the metro
      K.stalinRow(b, s, 0, CHUNK_LEN, { x0: 14 });
      pavement(b, s, 14);
      kerb(b, s, { bus: true });
      const taken = [];
      if (chance(0.45)) { const z = rand(10, 70); K.metro(b, s * 8.2, -z, s); taken.push(z); }
      for (let k = randi(0, 2); k > 0; k--) { const z = rand(8, 72); if (free(taken, z, 4)) { K.kiosk(b, s * 9.4, -z, s); taken.push(z); } }
      for (let z = rand(4, 10); z < CHUNK_LEN - 2; z += rand(20, 24)) if (free(taken, z, 2.5)) K.lamp(b, s * 7.8, -z, s);
      if (chance(0.35)) K.dvornik(b, s * rand(8, 12), -rand(6, 74), rand(0, 6));
      K.throng(b, s * 7.8, s * 13.2, 2, CHUNK_LEN - 2, randi(10, 16), taken.map((z) => [z - 2, z + 2]));
      if (chance(0.25)) K.dog(b, s * rand(8, 12), -rand(6, 74));
    };
    const arbatSide = (b, s, signs = ARBAT_SIGNS) => {   // the pedestrian old town: pastel houses, lanterns, stalls, painters, the crowd
      K.mansionRow(b, s, 0, CHUNK_LEN, { signs });
      const taken = [];
      for (let k = randi(1, 2); k > 0; k--) { const z = rand(8, 72); if (free(taken, z, 5)) { K.stall(b, s * 8.8, -z, s, { kind: chance(0.7) ? 'matryoshka' : 'hats' }); taken.push(z); } }
      if (chance(0.5)) { const z = rand(8, 72); if (free(taken, z, 4)) { K.painter(b, s * 9.2, -z, s); taken.push(z); } }
      if (chance(0.35)) { const z = rand(8, 72); if (free(taken, z, 4)) { K.musician(b, s * 9.6, -z, s); taken.push(z); } }
      for (let z = rand(5, 9); z < CHUNK_LEN - 2; z += rand(13, 16)) if (free(taken, z, 2)) K.lantern(b, s * 5.6, -z);
      K.throng(b, s * (EDGE + 0.6), s * 10.4, 2, CHUNK_LEN - 2, randi(14, 22), taken.map((z) => [z - 1.6, z + 1.6]));
      if (chance(0.4)) K.snowman(b, s * rand(6, 9), -rand(6, 74));
    };
    const churchSide = (b, s) => {   // Zamoskvorechye: a church in its yard, the merchant houses on either side, birches, babushkas
      const zc = rand(30, 50);
      K.mansionRow(b, s, 0, zc - 17, { signs: OLD_SIGNS }); K.mansionRow(b, s, zc + 17, CHUNK_LEN, { signs: OLD_SIGNS });
      K.churchyard(b, s, -zc, { x: 20 });
      pavement(b, s, 14);
      for (let z = rand(5, 9); z < CHUNK_LEN - 2; z += rand(15, 19)) K.lantern(b, s * 5.6, -z);
      for (let k = randi(2, 4); k > 0; k--) K.babushka(b, s * rand(6, 10), -rand(4, 76));
      K.crowd(b, s * (EDGE + 0.6), s * 10.2, 2, CHUNK_LEN - 2, randi(3, 6));
      for (let k = randi(1, 2); k > 0; k--) K.birch(b, s * rand(8.5, 10.2), -rand(6, 74));
    };
    const panelSide = (b, s) => {   // the outer districts: panel blocks round snowy courtyards, sodium lamps, a kiosk at the kerb
      K.panelRow(b, s, 0, CHUNK_LEN, { x0: 24 });
      K.courtyard(b, s, 2, CHUNK_LEN - 2, { x0: EDGE + 7, x1: 24 });
      kerb(b, s, { bus: false });
      for (let z = rand(5, 12); z < CHUNK_LEN - 2; z += rand(24, 30)) K.sodium(b, s * 7.6, -z, s);
      if (chance(0.6)) K.kiosk(b, s * 9.4, -rand(10, 70), s);
      K.crowd(b, s * 7.6, s * 10.4, 2, CHUNK_LEN - 2, randi(3, 7));
      if (chance(0.4)) K.dog(b, s * rand(8, 11), -rand(6, 74));
    };
    const boulevardSide = (b, s) => {   // the Boulevard Ring: lime trees wound with lights, benches, a poet on his plinth, balls of light, hot drinks
      K.snowField(b, s * 18, -40, 22, 80, 0.035);
      for (let z = rand(3, 6); z < CHUNK_LEN - 2; z += rand(8, 10)) for (const x of [9.5, 22]) K.bareTree(b, s * (x + rand(-0.5, 0.5)), -z, rand(0.95, 1.15), { lights: chance(0.7) ? 'warm' : 'ice' });
      const taken = [];
      if (chance(0.55)) { const z = rand(18, 62); K.statue(b, s * 16, -z, s); taken.push(z); }
      if (chance(0.6)) { const z = rand(10, 70); if (free(taken, z, 6)) { K.drinks(b, s * 13.5, -z, s); taken.push(z); } }
      for (let k = randi(1, 3); k > 0; k--) { const z = rand(6, 74); if (free(taken, z, 5)) { K.lightBall(b, s * rand(14, 20), -z, rand(0.9, 1.6)); taken.push(z); } }
      if (chance(0.5)) for (let z = rand(6, 20), n = randi(4, 7); n > 0; n--, z += 4.2) K.lightArch(b, s * 16, -z, s, { w: 4.4 });
      for (let z = rand(6, 14); z < CHUNK_LEN - 4; z += rand(12, 16)) if (free(taken, z, 3)) K.bench(b, s * 11.2, -z, s);
      for (let z = rand(5, 10); z < CHUNK_LEN - 2; z += rand(16, 20)) K.lantern(b, s * 5.6, -z);
      K.stalinRow(b, s, 0, CHUNK_LEN, { x0: 30 });
      K.crowd(b, s * (EDGE + 0.6), s * 24, 2, CHUNK_LEN - 2, randi(8, 14));
      if (chance(0.5)) K.sled(b, s * rand(12, 20), -rand(6, 74));
    };
    const decor = () => {
      const b = new Batcher();
      const r = Math.random(), kind = r < 0.25 ? 'tverskaya' : r < 0.45 ? 'arbat' : r < 0.63 ? 'church' : r < 0.82 ? 'panel' : 'boulevard';
      const one = pick([-1, 1]);
      for (const s of [-1, 1]) {
        farGround(b, s, '#a8acbc');
        if (kind === 'tverskaya') tverskayaSide(b, s);
        else if (kind === 'arbat') arbatSide(b, s);
        else if (kind === 'church') (s === one ? churchSide : (bb, ss) => arbatSide(bb, ss, OLD_SIGNS))(b, s);
        else if (kind === 'panel') panelSide(b, s);
        else (s === one ? boulevardSide : tverskayaSide)(b, s);
      }
      if (kind === 'tverskaya') for (const z of [12, 36, 60]) K.garland(b, -z - rand(-3, 3), { y: 16.2, w: 14 });
      if (kind === 'arbat' && chance(0.7)) for (const z of [20, 54]) K.garland(b, -z, { y: 15.6, w: X0, col: ['#ffe8b0', '#ffd890', '#fff4d8'], posts: true });
      if (kind === 'arbat' && chance(0.4)) K.yolka(b, pick([-1, 1]) * 8.6, -rand(20, 60), rand(1.0, 1.3));
      const g = b.build();
      g.userData.kind = kind;
      return g;
    };

    // ---------- the horizon: the high-rises round Moscow University, the City's glass, Ostankino, plumes of steam ----------
    const stex = skyTex({ wall: '#2a2834', lit: ['#ffd9a0', '#fff0d0', '#ffc880', '#e8f0ff', '#ffe0b0'], chance: 0.34, cols: 8, rows: 16 });
    const sky = skyline({
      tex: stex,
      colors: ['#e8dcd8', '#d8d0d8', '#e0d4cc', '#cfcad8'], count: 260, r: [560, 980], h: [24, 90], w: [18, 46], k: 1.1,
      heightCap: clear, follow: 190,
      landmarks: [
        (b) => mgu(frame(b, ...polarXZ(0, 900, -26), 0.88, polar(0, 900)[2]), SKY, { foot: below(-26, 0.88, 900) }),
        (b) => vysotka(frame(b, ...polarXZ(-13, 760, -24), 0.8, polar(-13, 760)[2] + 0.4), SKY, { tiers: [[44, 54], [28, 22], [18, 16], [12, 10]], wings: [[22, 46, 44, 24], [46, 70, 28, 20]], spire: 34, foot: below(-24, 0.8, 760) }),   // Kotelnicheskaya
        (b) => vysotka(frame(b, ...polarXZ(13, 820, -24), 0.78, polar(13, 820)[2] - 0.3), SKY, { tiers: [[38, 60], [26, 26], [18, 18], [12, 12]], wings: [[19, 44, 40, 24]], spire: 40, foot: below(-24, 0.78, 820) }),   // the Ukraina
        (b) => vysotka(frame(b, ...polarXZ(21, 700, -20), 0.7, polar(21, 700)[2] + 0.2), SKY, { tiers: [[40, 70], [26, 30], [16, 20]], wings: [[20, 34, 46, 26]], spire: 22, foot: below(-20, 0.7, 700) }),   // the Foreign Ministry
        (b) => vysotka(frame(b, ...polarXZ(42, 860, -22), 0.66, polar(42, 860)[2]), SKY, { tiers: [[30, 62], [20, 26], [13, 18]], wings: [[15, 36, 34, 20]], spire: 30, foot: below(-22, 0.66, 860) }),   // Leningradskaya
        (b) => vysotka(frame(b, ...polarXZ(-42, 840, -22), 0.68, polar(-42, 840)[2]), SKY, { tiers: [[36, 50], [24, 20], [16, 14]], wings: [[18, 40, 30, 22]], spire: 26, foot: below(-22, 0.68, 840) }),   // the Red Gates
        (b) => { const F = frame(b, ...polarXZ(-27, 1150, -60), 0.5, polar(-27, 1150)[2]); for (const t of CITY) cityTower(F, SKY, t, { lit: 0.55, foot: below(-60, 0.5, 1150) }); },
        (b) => ostankino(frame(b, ...polarXZ(30, 1400, -70), 0.62, polar(30, 1400)[2]), SKY, LED, { foot: below(-70, 0.62, 1400) }),
        (b) => { for (const [d, r, h, pl] of [[-62, 1100, 150, 1], [-71, 1250, 170, 1.2], [58, 1150, 160, 0.9], [66, 1050, 140, 1.1], [-100, 900, 150, 1], [104, 980, 150, 1]]) chimney(frame(b, ...polarXZ(d, r, -40), 0.9, polar(d, r)[2]), SKY, { h, plume: pl, foot: below(-40, 0.9, r) }); },
        (b) => {   // churches here and there among the roofs, their gilded domes catching the sun
          for (let k = 0; k < 14; k++) {
            const deg = rand(-75, 75); if (Math.abs(deg) < 7 || ICONS.some(([d]) => Math.abs(deg - d) < 5)) continue;
            const rr = rand(480, 760), [x, z, ry] = polar(deg, rr), sc = rand(1.5, 2.1);
            church(frame(b, x, -4, z, sc, ry + rand(-0.5, 0.5)), SKY, { w: 10, h: 9, col: pick([SKY.cWall, hdr('#f0d890', 0.85), hdr('#e8c0b8', 0.85)]), domes: chance(0.5) ? 5 : 1, bell: chance(0.6), foot: below(-4, sc, rr) });
          }
        },
      ],
    });
    floodGrad(sky, [SKY.wall, SKY.brick], -40, 220, 1.15, 0.55);
    bakeShade(sky, [SKY.wall, SKY.brick, SKY.roof, SKY.glass], new THREE.Vector3(0.1, 0.5, 0.85), 0.62, 0.45);

    // ---------- the trains ----------
    // the metro's blue trains parked on the line; a green elektrichka coming at you, its windows lit, snow on its roof
    const routes = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#060606'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffa02a'; g.shadowColor = '#ffa02a'; g.shadowBlur = 6; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 40px ${SANS}`; g.fillText('ЭЛЕКТРИЧКА', w / 2, h / 2 + 2, w - 16); }, { repeat: false });
    const routeMat = basic({ map: routes, color: hdr('#ffffff', 1.5) });
    const elektrichka = (b, c) => {   // the ER2's face: the yellow and red chevrons, the headlamp up top, snow on the roof
      const zc = c.zb0 - c.bl / 2;
      b.box(VC.solid, SNOW, 0, TRAIN_H + 0.05, zc, TRAIN_W - 0.3, 0.12, c.bl - 0.4);
      if (!c.front) return;
      const fz = c.z0 + 0.03;
      for (const e of [-1, 1]) { b.add(G.box, VC.solid, e * 0.6, 1.2, fz, 1.2, 0.16, 0.02, 0, 0, e * 0.42, '#e8c030'); b.add(G.box, VC.solid, e * 0.6, 0.92, fz, 1.2, 0.12, 0.02, 0, 0, e * 0.42, '#c8302a'); }
      b.cyl(VC.glow, hdr('#fff6dc', 7), 0, TRAIN_H - 0.25, fz + 0.02, 0.2, 0.05, 'cyl', Math.PI / 2);
      b.add(G.plane, routeMat, 0, 2.95, fz + 0.03, 1.3, 0.3, 1);
    };
    const trainStyle = {
      body: '#3a72b4', bodyMetal: false, roof: '#c8ccd4', under: '#1e2026', stripe: '#e8ecf2', stripe2: '#c8202a', doors: true, door: '#2a5a96',
      window: '#e8f2ff', windowK: 1.1, frame: '#14171d', light: '#f4f8ff', sign: '#ffa02a', roofUnit: '#8a909a',
      rampMat: std({ map: stripeTex('#1e2026', '#ffcf8a', 6), roughness: 0.6 }), rampGlow: '#ffcf8a',
      extra: (b, c) => {   // the cab end: the red М in its roundel, the route number; snow along the roof
        const zc = c.zb0 - c.bl / 2;
        b.box(VC.solid, SNOW, 0, TRAIN_H + 0.04, zc, TRAIN_W - 0.5, 0.1, c.bl - 1.0);
        if (c.front) { b.add(G.plane, K.metroM, 0, 1.55, c.z0 + 0.05, 0.6, 0.6, 1); b.cyl(VC.solid, '#f4f4f4', 0, 1.55, c.z0 + 0.035, 0.36, 0.02, 'cyl', Math.PI / 2); }
      },
      movingStyle: { body: '#2f7a4c', bodyMetal: false, roof: '#e8ecf0', under: '#1a1a1a', stripe: '#e8c030', stripe2: '#c8302a', frame: '#14171d', doors: true, door: '#2a6a42',
        light: '#fff0c8', sign: '#ffd23d', window: '#ffe8b8', windowK: 1.2, extra: elektrichka },
    };

    // ---------- the obstacles ----------
    // a board warning of falling icicles, icicles hanging under it, to slide under; a snowed-over road barrier to jump
    const iceTex = canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d8201a'; g.lineWidth = 7; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = '#d8201a'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `700 30px ${SANS}`; g.fillText('ОСТОРОЖНО!', w / 2, 32);
      g.font = `700 36px ${SANS}`; g.fillText('СОСУЛЬКИ', w / 2, 66);
    }, { repeat: false });
    const barrier = barrierStyle({ c1: '#d8201a', c2: '#ffffff', label: '', signBg: '#ffffff', signFg: '#d8201a', glow: '#ff6a6a', post: '#e8e8ea' });
    barrier.signMat = std({ map: iceTex, roughness: 0.6, emissive: '#ffffff', emissiveMap: iceTex, emissiveIntensity: 0.3 });
    barrier.highExtra = (b) => {
      b.box(VC.solid, SNOW, 0, 2.78, 0, 2.4, 0.14, 0.24);
      for (let k = 0; k < 14; k++) { const l = rand(0.18, 0.42); b.add(G.cone8, VC.glow, -1.08 + k * 0.166, 1.47 - l / 2, 0.02, 0.07, l, 0.07, Math.PI, 0, 0, hdr('#d8ecff', 0.75)); }
    };
    barrier.lowExtra = (b) => {
      b.add(G.sphLow, VC.solid, 0, 1.02, 0, 2.3, 0.34, 0.5, 0, 0, 0, SNOW);
      b.add(G.sphLow, VC.solid, 0.7, 0.18, 0.1, 1.4, 0.5, 0.8, 0, 0, 0, '#e4e8f2');
    };

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: LM.landmarks,
      coinGeo: coinGeometry('matryoshka'), coinMat: coinMaterial('#ffd04a', '#ff8a00'),
      update(t) {
        K.update(t);
        LM.update(t);
        LED.color.setHSL((t * 0.025) % 1, 0.75, 0.6).multiplyScalar(2.0);
      },
    };
  },
};
