// Taipei on a rainy autumn night: the arcades under the shophouses with their lightboxes stacked up the walls and the
// scooters packed along the kerb, hawkers' carts, the night markets' cooks at their woks and griddles, Xinyi's towers and
// skywalks, Dihua Street's baroque fronts, the lanes of walk-ups and shrines, the riverside under the floodwall and the
// bridge; Taipei 101 at the far end of the track lit in the colour of the day, low cloud dragging over the mountains
// round the basin; the metro's trains parked, and the garbage trucks coming at you playing Für Elise, the recycling
// truck behind.
import { THREE, Batcher, VC, G, std, basic, hdr, stripeTex, canvasTex, planeUV, CHUNK_LEN, TRAIN_W, TRAIN_H, rand, randi, pick, chance } from '../core.js';
import { barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, skyline, skyTex, SKY_VC, polar, EDGE, farGround } from './common.js';
import { beam } from './tokyo_kit.js';
import { makeKit, HEI, KAI, X0, ARC, DESTS, ARCADE_SHOPS, MARKET_SHOPS } from './taipei_kit.js';
import { taipei101, glassTex, nanShan, slimTower, taoZhu, grandHotel, memorialHall, ridge, ridgeHeight, ferrisWheel, puffs, cloudTex } from './taipei_towers.js';
import { tpLandmarks } from './taipei_landmarks.js';

const EYE = 4.5;
const T101_BASE = [0, -95, -980];   // where the horizon's Taipei 101 stands (it is scaled about this point)
// the horizon's Taipei 101 has its own materials, so its meshes can be found and scaled up as Xinyi nears, and faded out
// while the Presidential Office stands in its place
const TPG = new THREE.MeshBasicMaterial({ map: glassTex(), vertexColors: true, fog: false, transparent: true });
const TPL = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true });
const TPAU = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true });
const LINE = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
// the Memorial Hall rises at the end of Liberty Square's axis, Yangmingshan's fumaroles over Beitou
const HALL = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true });
const VOLC = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true });
const CLOUD = new THREE.MeshBasicMaterial({ map: cloudTex(), color: hdr('#5a5058', 1.0), fog: false, transparent: true, depthWrite: false, opacity: 0.7 });
const fade = (D) => (D > 330 || D < -90 ? 1 : D > 250 ? (D - 250) / 80 : D < -40 ? (-40 - D) / 50 : 0);
// Taipei 101 wears a colour for each day of the week: red, orange, yellow, green, blue, indigo, violet
const DAYS = ['#ff3a3a', '#ff8a2a', '#ffe23d', '#39ff6a', '#3d9aff', '#5a5aff', '#c84aff'].map((c) => new THREE.Color(c));
const _dc = new THREE.Color();
function dayColor(t) {
  const p = t / 24, i = Math.floor(p) % 7, f = Math.min(1, (p % 1) * 12);   // each day holds for 24 s, then fades to the next
  return _dc.copy(DAYS[(i + 6) % 7]).lerp(DAYS[i], f).multiplyScalar(1.7);
}
// nothing tall stands right in front of Taipei 101
const tpClear = (a, rr) => (Math.abs((a * 180) / Math.PI) < 6 ? EYE + rr * Math.tan(0.03) : Infinity);

export default {
  id: 'taipei', name: '台北', en: 'TAIPEI', tagline: '细雨骑楼 · 夜市灯火',
  blurb: '秋雨夜的台北：骑楼一家连着一家，牙医、补习班、KTV 的灯箱招牌一路叠上楼，机车在骑楼前排得满满的；便利商店、手摇饮、娃娃机和牛肉面亮到深夜，槟榔摊的霓虹绕着灯管跑；夜市的摊贩守着炭火、铁板和窜着火苗的炒锅，热气直冒。从艋舺龙山寺出发，经过 101 脚下的信义商圈，踩过西门町的彩虹斑马线来到红楼，跑过总统府门前，穿过自由广场的白色牌楼，钻进饶河街夜市，再到迪化街和北投地热谷；雨丝里撑满了伞，101 每天换一种颜色亮着，迎面开来的垃圾车放着《给爱丽丝》。',
  sights: ['艋舺龙山寺', '台北 101 · 信义商圈', '西门町 · 西门红楼', '总统府 · 凯达格兰大道', '自由广场 · 两厅院', '饶河街夜市', '大稻埕 · 迪化街', '北投温泉 · 地热谷'],
  accent: '#ffb43a', accent2: '#46e0d0', portal: '#46e0d0',
  sky: { top: '#06090f', mid: '#161c28', bot: '#2c2c38', glow: '#ff8a4a', glowK: 0.12, sun: '#000000', sunK: 0, sunDir: [0, -0.2, -1], sunSize: 0.0001,
    cloud: 0.6, cloudColor: '#2a2a34', horizon: -0.07, stars: false },
  fog: { color: '#1a222c', near: 26, far: 250 },
  light: { hemiSky: '#9ab4cc', hemiGround: '#2a2a2e', hemi: 0.8, dir: '#ffd8b0', dirK: 0.3, dirPos: [-0.4, 0.6, -1] },
  exposure: 1.0, bloom: { strength: 0.75, radius: 0.5, threshold: 0.95 },
  weather: [{ mode: 'rain', count: 480, colors: ['#bcd4e8'], k: 0.55, box: [44, 26, 90], speed: 0.8 }],
  coin: 'boba', music: 'taipei', jingle: 'furElise', horn: 'garbageTruck',

  build() {
    const K = makeKit();
    const LM = tpLandmarks(K);
    const track = makeTrack({ gravel: '#26282c', spots: ['#34363c', '#1c1e22', '#44464c'], sleeper: '#3a3634', rail: '#b8bcc4', railMatte: true, edge: '#ffd23a', edgeK: 1.1, sideMat: K.asphalt });

    // ---------- the street kinds ----------
    const kerb = (b, s, { lamps = true, scooters = 0.8, signal = 0.4, skip = [] } = {}) => {   // lamps, a signal at the crossing, puddles, the scooters in their boxes
      if (lamps) for (let z = rand(6, 14); z < CHUNK_LEN - 2; z += rand(24, 30)) K.lamp(b, s * (EDGE + 0.45), -z, s);
      const zs = rand(30, 50);
      if (chance(signal)) { K.signal(b, s * (EDGE + 0.6), -zs, s); skip.push([zs - 4, zs + 4]); }
      if (chance(scooters)) K.scooters(b, s, 1, CHUNK_LEN - 1, EDGE + 1.7, { skip });
      for (let k = randi(0, 2); k > 0; k--) K.puddle(b, s * (EDGE + rand(0.6, 3.0)), -rand(4, 76), rand(1, 2.4), rand(1.5, 3.5));
    };
    const arcadeSide = (b, s) => {   // the arcades: shophouses and walk-ups, the lightboxes, a kiosk or a taxi at the kerb
      K.row(b, s, 0, CHUNK_LEN, { shops: ARCADE_SHOPS });
      const skip = [];
      if (chance(0.3)) { const z = rand(10, 68); K.betel(b, s * (EDGE + 2.1), -z, s); skip.push([z - 1.8, z + 1.8]); }
      if (chance(0.25)) { const z = rand(16, 62); K.busStop(b, s * (EDGE + 2.4), -z, s); K.bus(b, s * (EDGE + 1.9), -z - 1); skip.push([z - 6, z + 6]); }
      else if (chance(0.4)) { const z = rand(10, 70); K.taxi(b, s * (EDGE + 1.6), -z); skip.push([z - 3, z + 3]); }
      if (chance(0.3)) { const z = rand(8, 72); K.postboxes(b, s * (EDGE + 3.0), -z); skip.push([z - 1, z + 1]); }
      if (chance(0.45)) { const z = rand(10, 70); K.streetSign(b, s * (EDGE + 0.6), -z); }
      if (chance(0.35)) {   // a hawker's push cart at the kerb: sausages, sugarcane, candied strawberries, corn, wheel cakes
        const z = rand(10, 70);
        if (!skip.some(([a, c]) => z > a - 2 && z < c + 2)) { K.stall(b, s * (EDGE + 1.6), -z, s, pick([18, 14, 24, 7, 26]), { cart: true }); skip.push([z - 1.6, z + 1.6]); }
      }
      kerb(b, s, { skip });
      K.crowd(b, s * (X0 + 0.6), s * (X0 + ARC - 0.5), 2, CHUNK_LEN - 2, randi(8, 14), { umbrella: false });
      K.crowd(b, s * (EDGE + 0.3), s * (EDGE + 0.8), 2, CHUNK_LEN - 2, randi(2, 5), { umbrellaP: 0.7 });
    };
    const marketSide = (b, s, steam) => {   // a night market: the hawkers' carts and the games all along the kerb, people eating in the arcade
      K.row(b, s, 0, CHUNK_LEN, { shops: MARKET_SHOPS, floors: [3, 6], vsigns: 0.8 });
      for (let z = rand(2, 4); z < CHUNK_LEN - 2; z += 2.6) if (chance(0.86)) K.stall(b, s * (EDGE + 1.7), -z, s, undefined, { steam });
      for (let z = rand(6, 14); z < CHUNK_LEN - 4; z += rand(10, 16)) K.table(b, s * (X0 + 1.6), -z);
      K.crowd(b, s * (EDGE + 0.25), s * (EDGE + 0.7), 2, CHUNK_LEN - 2, randi(3, 5), { umbrellaP: 0.5 });
      K.crowd(b, s * (X0 + 0.4), s * (X0 + ARC - 0.4), 2, CHUNK_LEN - 2, randi(7, 11), { umbrella: false });
    };
    const xinyiSide = (b, s, walk) => {   // Xinyi: the towers and the stores, the broad pavement, golden-rain trees, the skywalk
      K.towerRow(b, s, 0, CHUNK_LEN, { x0: EDGE + 10.4 });
      b.add(G.plane, K.paveMat, s * (EDGE + 5.4), 0.1, -CHUNK_LEN / 2, 10.2, CHUNK_LEN, 1, -Math.PI / 2, 0, 0);
      b.block(VC.solid, '#7a7a76', s * (EDGE + 0.42), 0, -CHUNK_LEN / 2, 0.3, 0.16, CHUNK_LEN);
      if (walk) K.skywalk(b, s, 0, CHUNK_LEN, { x: EDGE + 5.6 });
      for (let z = rand(4, 10); z < CHUNK_LEN - 3; z += rand(13, 18)) { K.luan(b, s * (EDGE + 2.4), -z, rand(0.85, 1.0)); b.block(VC.solid, '#5a5a5e', s * (EDGE + 2.4), 0, -z, 1.6, 0.4, 1.6); }
      for (let z = rand(8, 14); z < CHUNK_LEN - 2; z += rand(26, 32)) K.lamp(b, s * (EDGE + 0.6), -z, s);
      if (chance(0.35)) { const z = rand(16, 62); K.busStop(b, s * (EDGE + 4.6), -z, s); K.bus(b, s * (EDGE + 1.9), -z - 1); }
      else if (chance(0.5)) K.taxi(b, s * (EDGE + 1.6), -rand(10, 70));
      if (chance(0.25)) K.mrt(b, s * (EDGE + 7.2), -rand(14, 66), s, pick(['捷運 市政府站', '捷運 象山站', '捷運 台北101/世貿站']));
      if (chance(0.3)) K.ubike(b, s * (EDGE + 4.2), -rand(14, 66), s);
      K.crowd(b, s * (EDGE + 1.0), s * (EDGE + 9.6), 2, CHUNK_LEN - 2, randi(10, 16), { umbrellaP: 0.6 });
    };
    const dihuaSide = (b, s) => {   // Dihua Street: the baroque fronts, the arcade full of goods, lanterns
      K.dihuaRow(b, s, 0, CHUNK_LEN);
      kerb(b, s, { signal: 0.1, scooters: 0.6 });
      K.crowd(b, s * (X0 + 0.6), s * (X0 + ARC - 0.5), 2, CHUNK_LEN - 2, randi(8, 12), { umbrella: false });
    };
    const alleySide = (b, s) => {   // a lane: walk-ups in their cages, iron doors, a shrine, scooters along the walls
      K.alleyRow(b, s, 0, CHUNK_LEN);
      const skip = [];
      if (chance(0.3)) { const z = rand(14, 66); K.shrine(b, s * (EDGE + 1.6), -z, s); skip.push([z - 2.6, z + 2.6]); }
      if (chance(0.5)) { const z = rand(8, 72); K.vending(b, s * (X0 - 1.2), -z, s); skip.push([z - 1, z + 1]); }
      if (chance(0.35)) { const z = rand(10, 70); K.trashQueue(b, s * (EDGE + 1.0), -z, s); skip.push([z - 2.5, z + 2.5]); }
      K.scooters(b, s, 1, CHUNK_LEN - 1, EDGE + 1.5, { gap: 0.3, skip });
      for (let z = rand(8, 16); z < CHUNK_LEN - 2; z += rand(18, 26)) { b.box(VC.metal, '#4a4e56', s * (X0 - 0.75), 4.6, -z, 0.9, 0.06, 0.06); b.box(VC.glow, hdr('#ffe8c8', 2.2), s * (X0 - 1.2), 4.55, -z, 0.3, 0.06, 0.18); K.pool(b, s * (X0 - 1.6), -z, 4, 4, hdr('#ffe0b0', 0.08)); }   // lamps on the walls
      for (let k = randi(1, 3); k > 0; k--) K.puddle(b, s * (EDGE + rand(0.4, 2.0)), -rand(4, 76), rand(1, 2.2), rand(1.4, 3.0));
      K.crowd(b, s * (EDGE + 0.3), s * (EDGE + 1.0), 2, CHUNK_LEN - 2, randi(2, 5), { umbrellaP: 0.7 });
    };
    const floodSide = (b, s) => {   // the city side of the riverside: the floodwall, the houses rising behind it
      K.floodwall(b, s);
      K.row(b, s, 0, CHUNK_LEN, { x0: EDGE + 9, floors: [5, 10], tall: 0.3, vsigns: 0.7 });
    };
    const decor = () => {
      const b = new Batcher();
      const r = Math.random(), kind = r < 0.28 ? 'arcade' : r < 0.48 ? 'market' : r < 0.62 ? 'xinyi' : r < 0.72 ? 'dihua' : r < 0.88 ? 'alley' : 'river';
      const wet = pick([-1, 1]), walk = pick([-1, 1]), steam = kind === 'market' ? [] : null;
      for (const s of [-1, 1]) {
        if (kind === 'river') { if (s === wet) { K.riverside(b, s); K.farShore(b, s); } else { farGround(b, s, '#121418'); floodSide(b, s); } continue; }
        farGround(b, s, '#121418');
        if (kind === 'arcade') arcadeSide(b, s);
        else if (kind === 'market') marketSide(b, s, steam);
        else if (kind === 'xinyi') xinyiSide(b, s, s === walk && chance(0.7));
        else if (kind === 'dihua') dihuaSide(b, s);
        else alleySide(b, s);
      }
      if (kind === 'market') for (let z = 6; z < CHUNK_LEN; z += 10) K.festoon(b, -z, { y: 6.8, w: EDGE + 3, lanterns: chance(0.5) });
      if (kind === 'dihua') for (let z = 6; z < CHUNK_LEN; z += 10) K.festoon(b, -z, { y: 7.0, w: X0, sag: 0.5, lanterns: true, lr: 0.24 });
      if (kind === 'xinyi' && chance(0.55)) K.skybridge(b, -rand(18, 62), { W: EDGE + 6 });
      if (kind === 'alley') K.cables(b, 4, CHUNK_LEN - 4);
      if (kind === 'river' && chance(0.6)) K.bridge(b, -rand(24, 56), wet);
      if (kind === 'river') { const s = wet; for (let z = rand(6, 12); z < CHUNK_LEN - 2; z += rand(20, 30)) K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 6), z, z + 4, randi(1, 3), { umbrellaP: 0.6 }); }
      const g = b.build();
      if (steam && steam.length) g.add(K.steam(steam));
      g.userData.kind = kind;
      return g;
    };

    // ---------- the horizon: the basin's mountains, Taipei 101 at the far end of the track ----------
    const stex = skyTex({ wall: '#0a0e16', lit: ['#eaf4ff', '#fff0d8', '#d8f0ff', '#ffe0b0', '#c8ffe8'], chance: 0.4 });
    const sky = skyline({
      tex: stex,
      colors: ['#ffffff', '#d8e0ff', '#c8d0e0', '#b8c4d4'], count: 190, r: [560, 900], h: [30, 120], w: [22, 50], k: 1.4,
      heightCap: tpClear, follow: 190,
      landmarks: [
        (b) => ridge(b, SKY_VC, { r: 1380 }),
        (b) => {   // houses' lights scattered up the slopes, a temple lit here and there
          for (let k = 0; k < 170; k++) {
            const deg = rand(-100, 100), [x, z] = polar(deg, 1350), y = -100 + ridgeHeight(deg) * rand(0.1, 0.75);
            b.add(G.box, SKY_VC, x, y, z, rand(1.5, 4), rand(1, 2.4), 0.5, 0, (-deg * Math.PI) / 180, 0, hdr(pick(['#ffd9a0', '#fff0d0', '#cfe6ff', '#ffb070']), rand(1.0, 1.8)));
          }
        },
        (b) => { taipei101(b, { glass: TPG, line: TPL, gold: TPAU, x: T101_BASE[0], y: T101_BASE[1], z: T101_BASE[2], s: 0.78, lw: 2.6, glassCol: '#5a9a94', tile: 40 }); },
        (b, mat) => { const [x, z, ry] = polar(-9, 1040); nanShan(b, { mat, tex: stex, line: LINE, x, y: -95, z, s: 0.85, ry }); },
        (b, mat) => { const [x, z, ry] = polar(8, 1010); slimTower(b, { mat, tex: stex, line: LINE, x, y: -95, z, s: 0.85, ry, w: 34, h: 215, d: 34, crown: 'frame' }); },
        (b, mat) => { const [x, z, ry] = polar(-16, 1080); slimTower(b, { mat, tex: stex, line: LINE, x, y: -95, z, s: 0.8, ry, w: 36, h: 250, d: 32, crown: 'round', lit: '#cfe8ff' }); },
        (b, mat) => { const [x, z, ry] = polar(-36, 900); slimTower(b, { mat, tex: stex, line: LINE, x, y: -95, z, s: 0.85, ry, w: 54, h: 230, d: 40, crown: 'notch', col: '#8a7a68', lit: '#ff8a3a' }); },
        (b, mat) => { const [x, z, ry] = polar(13, 900); taoZhu(b, { mat, solid: SKY_VC, x, y: -60, z, s: 1.3, ry }); },
        (b) => { const [x, z] = polar(-4, 930); b.add(G.sph, SKY_VC, x, -80, z, 260, 90, 200, 0, 0, 0, hdr('#9aa4b0', 0.7)); b.add(G.cyl, SKY_VC, x, -48, z, 262, 3, 202, 0, 0, 0, hdr('#d8e8ff', 1.6)); },   // the Dome
        (b) => { const [x, z, ry] = polar(-50, 1150); b.add(G.sphLow, SKY_VC, x, -100, z, 420, 300, 260, 0, 0, 0, '#0c1418'); grandHotel(b, { mat: SKY_VC, solid: SKY_VC, roof: SKY_VC, x, y: 20, z, s: 0.95, ry }); },   // the Grand Hotel on Jiantan hill
        (b) => memorialHall(b, { mat: HALL, x: 0, y: -12, z: -540, s: 0.95 }),
        (b) => {   // Yangmingshan's volcanic cones over Beitou, the fumaroles' plumes
          for (const [deg, h, w] of [[-14, 380, 520], [0, 470, 620], [16, 360, 520]]) { const [x, z] = polar(deg, 1150); b.add(G.sph, VOLC, x, -100, z, w, h * 2, w * 0.6, 0, 0, 0, '#0e1614'); }
          for (let k = 0; k < 60; k++) { const deg = rand(-25, 25), [x, z] = polar(deg, 1100); b.add(G.box, VOLC, x, rand(-60, 140), z, rand(2, 4), rand(1.2, 2.2), 0.5, 0, (-deg * Math.PI) / 180, 0, hdr(pick(['#ffd9a0', '#fff0d0']), rand(0.9, 1.5))); }
        },
        (b) => {   // the city's lights low along the horizon
          for (let k = 0; k < 150; k++) {
            const deg = rand(-80, 80);
            if (Math.abs(deg) < 5) continue;
            const [x, z] = polar(deg, 548);
            b.add(G.box, SKY_VC, x, rand(-30, -6), z, rand(1.2, 3.2), rand(0.8, 2), 0.5, 0, (-deg * Math.PI) / 180, 0, hdr(pick(['#ffd9a0', '#fff0d0', '#ffcf8a', '#cfe6ff', '#ff9ad5', '#9fffe0']), rand(1.2, 2.2)));
          }
        },
      ],
    });
    // Miramar's wheel turning on its mall, the gondola climbing to Maokong, the low cloud, the fumaroles
    const wheel = ferrisWheel({ R: 50, n: 48 });
    { const [x, z] = polar(27, 860); wheel.position.set(x, -40, z); wheel.rotation.y = (-27 * Math.PI) / 180; }
    // (the gondola's cabins and the clouds are instanced, one draw each)
    const A = new THREE.Vector3(...((p) => [p[0], -40, p[1]])(polar(33, 1240))), B = new THREE.Vector3(...((p) => [p[0], 150, p[1]])(polar(45, 1290)));
    const cabins = new THREE.InstancedMesh(new THREE.BoxGeometry(6, 6, 6), new THREE.MeshBasicMaterial({ color: hdr('#ffe0b0', 2.0), fog: false }), 16);
    const pylons = new Batcher(), pylonMat = new THREE.MeshBasicMaterial({ color: hdr('#ff4a3a', 2), fog: false });
    for (let k = 0; k <= 12; k++) { const p = A.clone().lerp(B, k / 12); pylons.add(G.box, pylonMat, p.x, p.y + 9, p.z, 2.5, 2.5, 2.5); }
    const gondola = new THREE.Group().add(cabins, pylons.build());
    gondola.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.renderOrder = -5; } });
    const CLOUDS = [[2, 950, 190, 360, 110], [-4, 940, 240, 300, 90], [-46, 1250, 120, 700, 200], [40, 1250, 110, 640, 180], [-80, 1250, 90, 600, 160], [75, 1250, 100, 600, 160], [180, 1250, 100, 900, 200]].map(([deg, r, y, w, h]) => ({ deg, r, y, w, h, ph: rand(0, 6.28) }));
    const clouds = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), CLOUD, CLOUDS.length);
    clouds.frustumCulled = false; clouds.renderOrder = -4;
    const _m4 = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
    const fumes = puffs([[-120, 160, -1080], [60, 230, -1100], [210, 120, -1060], [-260, 90, -1040]].map(([x, y, z]) => [x, y, z]), { size: 40, grow: 3, rise: 160, drift: 40, life: 14, n: 7, color: '#c8ccd0', opacity: 0.22, curved: false });
    fumes.renderOrder = -4;
    sky.add(wheel, gondola, clouds, fumes);
    // on the way to the Presidential Office it stands at the end of the street in Taipei 101's place, growing; gone again
    // (and 101 back) by the time its own front comes alongside the track
    const po = LM.poSky();
    po.position.set(0, -28, -200); po.rotation.y = Math.PI / 2;
    po.visible = false;
    sky.add(po);

    // ---------- the trains ----------
    // the metro's trains parked: white, the blue band, the black mask with its destination in orange; the garbage trucks
    // coming at you, a yellow compactor up front and the white recycling truck behind
    const destTex = canvasTex(512, 96 * DESTS.length, (g, w, h) => {
      g.fillStyle = '#060606'; g.fillRect(0, 0, w, h);
      DESTS.forEach(([cn, en], i) => {
        const y = i * 96 + 48; g.fillStyle = '#ff9a2a'; g.shadowColor = '#ff9a2a'; g.shadowBlur = 6; g.textBaseline = 'middle';
        g.textAlign = 'left'; g.font = `900 50px ${HEI}`; g.fillText(cn, 18, y + 2, w * 0.42);
        g.textAlign = 'right'; g.font = `700 26px ${HEI}`; g.fillText(en, w - 14, y + 2, w * 0.5);
      });
    }, { repeat: false });
    const destRects = DESTS.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / DESTS.length + 0.002, v1: 1 - i / DESTS.length - 0.002 }));
    const destMat = basic({ map: destTex, color: hdr('#ffffff', 1.5) });
    const truckWords = (text, ink, bg, size = 0.7) => K.label(text, { w: 512, h: 128, color: ink, font: HEI, size, bg, k: 1.0 });
    const garbage = truckWords('垃圾車', '#1a6a3a', '#ffcc22'), sorting = truckWords('請做好垃圾分類', '#1a1a1a', '#ffcc22', 0.5);
    const ledSign = K.label('垃圾車', { w: 256, h: 64, color: '#39ff6a', font: HEI, size: 0.78, bg: '#050806', k: 1.8 });
    const recycle = truckWords('資源回收', '#1f4aa8', '#f4f4f0'), squad = truckWords('清潔隊', '#ffffff', '#1a6a3a', 0.62);
    const truck = (b, c) => {   // one car of the convoy: a cab up front, the body, the big wheels; idx 0 is the garbage truck
      const W = TRAIN_W, zc = c.zb0 - c.bl / 2, rec = c.idx > 0;
      if (rec) {   // the recycling truck: white, its own cab, the cage of sorted bags behind
        b.box(VC.solid, '#f4f4f0', 0, 1.8, zc - 1.2, W + 0.02, 2.7, c.bl - 3.2);
        b.box(VC.solid, '#e8ecee', 0, 1.6, c.z0 - 1.4, W + 0.02, 2.3, 2.6);
        b.box(VC.glow, hdr('#cfe0ff', 0.4), 0, 2.2, c.z0 - 0.08, W - 0.4, 0.8, 0.04);
        for (const lx of [-0.75, 0.75]) b.box(VC.glow, hdr('#fff4d6', 5), lx, 0.95, c.z0 - 0.07, 0.3, 0.16, 0.04);
        for (let k = 0; k < 8; k++) b.sph(VC.solid, pick(['#3a8ad8', '#f4f4f0', '#2a8a3a', '#d8c8a0', '#e8e0d0']), rand(-0.8, 0.8), TRAIN_H + 0.1, zc - 1.2 + rand(-3, 3), rand(0.3, 0.45), true);
      }
      for (const sx of [-1, 1]) {
        const x = sx * (W / 2 + 0.012);
        b.box(VC.glow, hdr('#cfe0ff', 0.35), x, 2.25, c.z0 - 1.2, 0.02, 0.8, 1.2);   // the cab's side window
        b.add(G.plane, rec ? recycle : garbage, x + sx * 0.01, 1.9, zc - 1.0, 4.2, 1.05, 1, 0, (sx * Math.PI) / 2, 0);
        b.add(G.plane, rec ? squad : sorting, x + sx * 0.01, 1.0, zc - 1.0, 3.6, 0.5, 1, 0, (sx * Math.PI) / 2, 0);
        for (const dz of [-1.7, -c.bl + 2.2, -c.bl + 3.4]) b.cyl(VC.solid, '#141414', x, 0.5, c.z0 + dz, 0.5, 0.3, 'cyl8', 0, Math.PI / 2);
      }
      // the cab: the seam behind it, the door, the mirrors; the compactor's ribs; marker lights along the top
      const seam = c.z0 - 2.5;
      b.box(VC.solid, '#1a1a1e', 0, 1.75, seam, W + 0.04, 2.7, 0.08);
      b.box(VC.solid, '#1a1a1e', 0, TRAIN_H - 0.12, seam, W + 0.04, 0.3, 0.1);
      for (const sx of [-1, 1]) {
        const x = sx * (W / 2 + 0.014);
        b.box(VC.solid, '#1a1a1e', x, 1.7, c.z0 - 2.0, 0.02, 1.6, 0.04);
        beam(b, VC.metal, sx * (W / 2), 2.6, c.z0 - 0.15, sx * (W / 2 + 0.35), 2.5, c.z0 + 0.1, 0.04, '#2a2a2e');
        b.box(VC.solid, '#141414', sx * (W / 2 + 0.38), 2.25, c.z0 + 0.1, 0.06, 0.4, 0.18);
        for (let z = seam - 0.6; z > c.zb0 - c.bl + 0.6; z -= 0.9) b.box(VC.solid, rec ? '#d8dcd8' : '#e0a818', x + sx * 0.012, 1.9, z, 0.03, 2.3, 0.08);
        for (const z of [c.z0 - 0.2, seam - 0.3, c.zb0 - c.bl + 0.3]) b.box(VC.glow, hdr('#ffb030', 2.4), x, TRAIN_H - 0.2, z, 0.04, 0.08, 0.16);
      }
      if (c.front) { b.box(VC.solid, '#0a0a0c', 0, 3.0, c.z0 + 0.02, 1.5, 0.36, 0.03); b.add(G.plane, ledSign, 0, 3.0, c.z0 + 0.04, 1.4, 0.3, 1); }
      if (!rec) {
        b.box(VC.solid, '#1a1a1e', 0, 1.6, c.zb0 - c.bl + 0.05, W - 0.3, 2.0, 0.1);   // the hopper at the back
        for (const sx of [-1, 1]) { b.cyl(VC.solid, sx < 0 ? '#2a8a3a' : '#1f4aa8', sx * 0.85, 0.75, c.zb0 - c.bl - 0.35, 0.3, 0.7, 'cyl8'); }   // the kitchen-waste buckets
      }
      b.sph(VC.glow, hdr('#ff9a1a', 3), 0.6, TRAIN_H + 0.12, c.z0 - 0.7, 0.16, true);   // the beacon on the cab
    };
    const trainStyle = {
      body: '#e4e8ec', bodyMetal: false, roof: '#c8ccd0', under: '#2a2c30', stripe: '#1f5fb4', stripe2: '#3ab0e8', doors: true, door: '#d4d8dc',
      window: '#dff0ff', windowK: 1.1, frame: '#141618', light: '#f4f8ff', sign: '#ff9a3c', roofUnit: '#9aa0a8',
      rampMat: std({ map: stripeTex('#1e2026', '#ffcc00', 6), roughness: 0.6 }), rampGlow: '#ffd23a',
      extra: (b, c) => {   // the cab end: the blue band carried round, the destination on the black mask
        if (!c.front) return;
        b.box(VC.solid, '#1f5fb4', 0, 1.15, c.z0 + 0.03, TRAIN_W - 0.1, 0.3, 0.02);
        b.add(planeUV(pick(destRects)), destMat, 0, 3.0, c.z0 + 0.045, 1.4, 0.26, 1);
      },
      movingStyle: { body: '#ffcc22', bodyMetal: false, roof: '#f2c230', under: '#141416', stripe: '#1a6a3a', stripe2: null, frame: '#e8b820',
        windows: false, doors: false, gangway: false, roofUnits: false, strobe: false, light: '#fff4d6', sign: '#39ff6a', window: '#cfe0ff', windowK: 0.7,
        extra: truck },
    };

    // ---------- the obstacles ----------
    // a temple procession's arch to slide under, "peace upon the whole neighbourhood"; roadworks barriers to jump, the
    // little worker bowing his apology
    const bannerTex = canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = '#c8101e'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#ffd060'; g.lineWidth = 5; g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = '#ffd060'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `400 54px ${KAI}`; g.fillText('合境平安', w / 2, h / 2 + 3, w - 30);
    }, { repeat: false });
    const barrier = barrierStyle({ c1: '#c8101e', c2: '#ffd060', label: '', signBg: '#c8101e', signFg: '#ffd060', glow: '#ffd060', post: '#b8202a' });
    barrier.signMat = std({ map: bannerTex, roughness: 0.6, emissive: '#ffffff', emissiveMap: bannerTex, emissiveIntensity: 0.35 });
    barrier.highExtra = (b) => {
      b.box(VC.solid, '#8a1a1a', 0, 3.0, 0, 2.9, 0.22, 0.24);
      for (const sx of [-1, 1]) {
        beam(b, VC.solid, sx * 1.45, 3.0, 0, sx * 1.9, 3.5, 0, 0.16, '#8a1a1a');   // the ends curling up like a temple's ridge
        for (let k = 0; k < 9; k++) b.cyl(VC.solid, k % 2 ? '#e8202a' : '#c8101e', sx * 1.32, 2.8 - k * 0.2, 0.14, 0.05, 0.16, 'cyl6');   // a string of firecrackers
      }
      for (const x of [-0.8, 0, 0.8]) K.lantern(b, x, 1.15, 0.1, 0.17);
    };
    barrier.lowBarMat = std({ map: stripeTex('#d8202a', '#f4f4f0', 6), roughness: 0.6 });
    const worksTex = canvasTex(128, 160, (g, w, h) => {   // the roadworks sign: the worker bowing, "under construction, our apologies"
      g.fillStyle = '#ffd23a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#141414'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
      g.fillStyle = '#141414'; g.beginPath(); g.arc(78, 40, 9, 0, 7); g.fill();
      g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(70, 50); g.lineTo(46, 70); g.moveTo(46, 70); g.lineTo(48, 104); g.moveTo(58, 62); g.lineTo(66, 82); g.stroke();
      g.fillStyle = '#d8202a'; g.beginPath(); g.ellipse(80, 30, 13, 6, -0.4, 0, 7); g.fill();
      g.fillStyle = '#141414'; g.font = `900 20px ${HEI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('施工中', w / 2, 124); g.font = `700 15px ${HEI}`; g.fillText('敬請見諒', w / 2, 144);
    }, { repeat: false });
    const worksMat = std({ map: worksTex, roughness: 0.5, emissive: '#ffffff', emissiveMap: worksTex, emissiveIntensity: 0.3 });
    barrier.lowExtra = (b) => {
      b.box(VC.metal, '#888888', 0, 1.25, 0, 0.05, 0.4, 0.05);
      b.add(G.plane, worksMat, 0, 1.8, 0.035, 0.66, 0.82, 1);
      b.add(G.plane, worksMat, 0, 1.8, -0.035, 0.66, 0.82, 1, 0, Math.PI, 0);
    };

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: LM.landmarks,
      coinGeo: coinGeometry('boba'), coinMat: coinMaterial('#ffd04a', '#ffa000'),
      update(t) {
        K.update(t);
        // how near landmark i is: 1 from 210 m before it until 80 m into it, easing in and out either side
        const near = (i) => { const ch = LM.landmarks[i].obj && LM.landmarks[i].obj.parent; return ch && ch.parent ? 1 - fade(sky.position.z - ch.position.z + 40) : 0; };
        // nearing Xinyi, Taipei 101 at the end of the road grows as if we were running up to it
        const k1 = near(1), sc = 1 + 0.35 * k1 * k1 * (3 - 2 * k1);
        if (sky.userData.s101 !== sc) {
          sky.userData.s101 = sc;
          for (const m of sky.children) if (m.material === TPG || m.material === TPL || m.material === TPAU) { m.scale.setScalar(sc); m.position.set(0, (1 - sc) * T101_BASE[1], (1 - sc) * T101_BASE[2]); }
        }
        const col = dayColor(t);
        TPL.color.copy(col);
        const kH = near(4); HALL.opacity = kH; HALL.visible = kH > 0.01;
        const kV = near(7); VOLC.opacity = kV; VOLC.visible = kV > 0.01; fumes.userData.update(t, kV);
        const lp = LM.landmarks[3].obj && LM.landmarks[3].obj.parent, Dc = lp && lp.parent ? sky.position.z - lp.position.z : 1e9;   // metres to the Presidential Office's scene
        const kP = Dc > 240 || Dc < 30 ? 0 : Dc > 190 ? (240 - Dc) / 50 : Dc < 70 ? (Dc - 30) / 40 : 1;
        po.visible = kP > 0.01;
        if (po.visible) { for (const m of po.userData.mats) m.opacity = kP; const g = Math.min(1, Math.max(0, (190 - Dc) / 120)); po.scale.setScalar(1.25 + 0.25 * g * g * (3 - 2 * g)); }
        TPG.opacity = TPL.opacity = TPAU.opacity = 1 - kP; TPG.visible = TPL.visible = TPAU.visible = kP < 0.99;
        wheel.userData.update(t);
        for (let k = 0; k < 16; k++) { const f = (t * 0.01 + k / 16) % 1; _p.lerpVectors(A, B, f); _p.y += 4 - 30 * f * (1 - f); cabins.setMatrixAt(k, _m4.makeTranslation(_p.x, _p.y, _p.z)); }
        cabins.instanceMatrix.needsUpdate = true;
        CLOUDS.forEach((u, k) => { const [x, z, ry] = polar(u.deg + Math.sin(t * 0.02 + u.ph) * 3, u.r); clouds.setMatrixAt(k, _m4.compose(_p.set(x, u.y, z), _q.setFromAxisAngle(_up, ry), _s.set(u.w, u.h, 1))); });
        clouds.instanceMatrix.needsUpdate = true;
        LM.update(t, col);
      },
    };
  },
};
