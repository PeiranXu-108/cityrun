// Istanbul on an April evening just after sunset: the domes and minarets floodlit gold against a turquoise sky going
// orange over the Golden Horn, the young crescent moon low in the west with the evening star beside it, gulls wheeling
// over the street. Five kinds of street: the stone fronts of Pera with their bay windows and flags, the painted wooden
// houses of Balat with their cumbas, the bazaar quarter's arcades spilling spices, lamps and carpets, the apartment
// blocks of the neighbourhoods, and the quays of the Golden Horn and the Bosphorus with the fishermen at the rail and the
// ferries crossing. Süleymaniye stands at the far end of the track on its hill; modern trams wait on the line and the
// red nostalgic tram of İstiklal comes at you ringing its bell.
import { THREE, Batcher, VC, G, std, basic, hdr, stripeTex, canvasTex, planeUV, CHUNK_LEN, TRAIN_W, TRAIN_H, rand, randi, pick, chance } from '../core.js';
import { barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, skyline, skyTex, SKY_VC, polar, EDGE, farGround } from './common.js';
import { beam } from './tokyo_kit.js';
import { frame, bakeShade } from './ny_icons.js';
import { makeKit, X0, SANS, SERIF, PERA_SIGNS, iznikTex } from './istanbul_kit.js';
import { suleymaniye, blueMosque, hagiaSophia, yeniCami, galataTower, bosphorusBridge, camlica, mahalleMosque } from './istanbul_icons.js';
import { istLandmarks } from './istanbul_landmarks.js';

const BLURB = '四月傍晚的伊斯坦布尔：太阳刚落下金角湾，天空从青绿过渡到橘红，清真寺的圆顶和宣礼塔一座座亮起金色的灯；一弯新月挂在西边的天上，旁边一颗亮星，正像国旗上的星月。贝伊奥卢的石头老楼探出凸窗、挂满红色国旗，巴拉特的木屋涂成芥黄、珊瑚红和青绿，大巴扎一带的店铺堆满香料塔、马赛克吊灯、地毯和土耳其软糖；路边推着芝麻圈、烤栗子和土耳其冰淇淋的小车，茶园里人们端着郁金香形的小玻璃杯，海边的栏杆站满钓鱼的人，海鸥盘旋，渡轮来来往往，街猫在台阶上打盹。从苏丹艾哈迈德广场出发，从蓝色清真寺和圣索菲亚之间穿过，下到地下水宫的石柱林，钻进大巴扎，经过埃米诺努的新清真寺、走上加拉塔大桥，爬上加拉塔塔下的老街，沿独立大街跟着红色怀旧电车，经过多尔玛巴赫切宫和奥塔科伊清真寺头顶的博斯普鲁斯大桥，最后在于斯屈达尔看少女塔亮灯；街道尽头的苏莱曼尼耶清真寺一直在山上等你。';
const SIGHTS = ['苏丹艾哈迈德广场 · 蓝色清真寺', '地下水宫', '大巴扎', '埃米诺努 · 新清真寺', '加拉塔大桥', '加拉塔塔', '独立大街 · 怀旧电车', '多尔玛巴赫切宫', '奥塔科伊 · 博斯普鲁斯大桥', '少女塔'];

// the skyline's models: unlit, their shading baked; floodlit stone, lead domes warmed by the lights, lit windows
const skyMat = (o = {}) => new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, ...o });
const SKY = {
  lo: true, wall: skyMat(), dome: skyMat(), glow: skyMat(), gold: skyMat(), steel: skyMat(), hill: skyMat(), tower: skyMat(), rock: skyMat(), dark: skyMat(),
  cWall: hdr('#f0d8a8', 1.0), cWall2: hdr('#f8e4bc', 1.05), cWall3: hdr('#d8b088', 0.95), cDome: hdr('#a8a094', 0.95), cWin: hdr('#ffc870', 1.5), cLight: hdr('#fff0c8', 2.4),
  cGold: hdr('#f0c860', 1.5), cArch: hdr('#ffd090', 1.2), cSteel: hdr('#6a7080', 0.9), cHill: hdr('#1a2030', 1), cTower: hdr('#d8dce8', 1.0), cRed: hdr('#ff3a2a', 2.5), cBrick: hdr('#c87a5a', 1.0),
};
const fading = () => ({ ...SKY, wall: skyMat({ transparent: true }), dome: skyMat({ transparent: true }), glow: skyMat({ transparent: true }), gold: skyMat({ transparent: true }) });
const SUL = fading(), GT = fading();   // Süleymaniye, and the Galata Tower that takes its place at the end of the street
const SHADED = [SKY.wall, SKY.dome, SKY.steel, SKY.hill, SKY.tower, SUL.wall, SUL.dome];
// floodlights at the foot of the walls: brighter low down, the domes and minarets darkening as they rise
function floodGrad(obj, mats, y0, y1, lo = 1.2, hi = 0.55) {
  obj.traverse((m) => {
    if (!m.isMesh || !mats.includes(m.material)) return;
    const p = m.geometry.attributes.position, c = m.geometry.attributes.color;
    for (let i = 0; i < c.count; i++) { const t = Math.min(1, Math.max(0, (p.getY(i) - y0) / (y1 - y0))), f = lo + (hi - lo) * Math.pow(t, 0.8); c.setXYZ(i, c.getX(i) * f, c.getY(i) * f, c.getZ(i) * f); }
    c.needsUpdate = true;
  });
}
const LED = skyMat();   // the Bosphorus Bridge's cables, lit in slowly changing colours
const MOON = skyMat({ color: hdr('#fff2d0', 2.2) });
// the icons that stand clear of the random towers: [degrees, radius]
const ICONS = [[0, 900], [16, 800], [25, 860], [-10, 700], [-22, 620]];
const clear = (a, rr) => (Math.abs(a) < 0.1 || ICONS.some(([d, r]) => Math.abs(a - (d * Math.PI) / 180) < 0.055 && rr < r + 60) ? 0 : Math.abs(a) < 0.22 ? 4.5 + rr * Math.tan(0.055) : 22);   // a low city: nothing over 22 m

export default {
  id: 'ist', name: '伊斯坦布尔', en: 'ISTANBUL', tagline: '金角湾暮色 · 新月初升',
  blurb: BLURB, sights: SIGHTS,
  accent: '#3ad6d0', accent2: '#ffc65a', portal: '#3ad6d0',
  sky: { top: '#0b1a44', mid: '#1f6a8a', bot: '#ff9a62', glow: '#ff7a48', glowK: 0.45, sun: '#ffb070', sunK: 0.55, sunDir: [-0.05, -0.035, -1], sunSize: 0.0006,
    cloud: 0.3, cloudColor: '#7a5a7a', horizon: -0.07, stars: false, follow: true },
  envSky: { bot: '#4a5a80', glow: '#7a6a90', glowK: 0.2, sunK: 0.3 },
  fog: { color: '#6a6488', near: 30, far: 260 },
  light: { hemiSky: '#9ab8e0', hemiGround: '#4a3a3a', hemi: 0.9, dir: '#ffb27a', dirK: 0.75, dirPos: [-0.25, 0.3, -1] },
  exposure: 1.0, bloom: { strength: 0.7, radius: 0.5, threshold: 0.86 },
  weather: [{ mode: 'fall', shape: 1, count: 70, colors: ['#e070b0', '#d860a0', '#f0a0cc'], size: 0.26, k: 0.9, box: [40, 16, 90], speed: 0.6 }],
  coin: 'tulip', music: 'ist', jingle: 'vapur', horn: 'tramBell',

  build() {
    const K = makeKit();
    const LM = istLandmarks(K);
    const track = makeTrack({ gravel: '#4a4640', spots: ['#5a564e', '#3a3632', '#6a645a'], sleeper: '#3e3a36', rail: '#c8ccd4', edge: '#3ad6d0', edgeK: 1.0, sideMat: K.sideMat });
    const lit = { wall: VC.solid, dome: VC.solid, glow: VC.glow, gold: VC.metal, steel: VC.metal, dark: VC.solid,
      cWall: '#e8d8bc', cWall2: '#f0e4cc', cWall3: '#d8c0a0', cDome: '#8a9098', cWin: hdr('#ffc870', 1.6), cLight: hdr('#fff0c8', 2.4), cGold: '#e8c060', cArch: hdr('#ffd090', 1.2), cSteel: '#5a6070', cDark: '#1a1a1e' };

    // ---------- the street kinds ----------
    const lamps = (b, s, { x = EDGE + 0.8, heads = 1, skip = [] } = {}) => {
      for (let z = rand(5, 12); z < CHUNK_LEN - 2; z += rand(22, 28)) if (!skip.some(([a, c]) => z > a && z < c)) K.lamp(b, s * x, -z, { heads });
    };
    const free = (taken, z, r) => !taken.some((t) => Math.abs(t - z) < r);
    const peraSide = (b, s) => {   // Pera: stone fronts, flags, and the pavement thick with people, carts and cats
      K.peraRow(b, s);
      const taken = [];
      const put = (fn, r = 3) => { for (let k = 0; k < 6; k++) { const z = rand(6, 74); if (free(taken, z, r)) { taken.push(z); fn(z); return; } } };
      if (chance(0.55)) put((z) => K.simitCart(b, s * (EDGE + 2.0), -z, s));
      if (chance(0.4)) put((z) => K.chestnutCart(b, s * (EDGE + 2.2), -z, s));
      if (chance(0.25)) put((z) => K.dondurma(b, s * (X0 - 1.6), -z, s), 4);
      if (chance(0.2)) put((z) => K.musician(b, s * (X0 - 1.2), -z, s));
      if (chance(0.15)) put((z) => K.shoeShine(b, s * (X0 - 1.0), -z, s));
      if (chance(0.3)) put((z) => K.streetSign(b, s * (EDGE + 0.5), -z, s));
      lamps(b, s, { skip: taken.map((z) => [z - 2, z + 2]) });
      K.throng(b, s * (EDGE + 0.6), s * (X0 - 0.6), 2, CHUNK_LEN - 2, randi(14, 22), taken.map((z) => [z - 1.4, z + 1.4]));
      for (let k = randi(1, 3); k > 0; k--) K.cat(b, s * rand(EDGE + 1, X0 - 0.6), -rand(4, 76));
    };
    const woodenSide = (b, s) => {   // Balat: the painted houses on the cobbles, a little mosque between them now and then
      const X = 9;
      if (chance(0.22)) {   // a neighbourhood mosque behind its wall, the minaret over the roofs
        const zm = rand(26, 50);
        K.woodRow(b, s, 0, zm - 13, { x0: X }); K.woodRow(b, s, zm + 13, CHUNK_LEN, { x0: X });
        b.block(VC.solid, '#d8ccb4', s * (X + 0.3), 0, -zm, 0.5, 2.2, 24);
        mahalleMosque(frame(b, s * (X + 12.5), 0, -zm, 1, (-s * Math.PI) / 2), lit, { minaretSide: -1, h: rand(26, 32) });
        K.cypress(b, s * (X + 2.5), -zm - 8); K.cypress(b, s * (X + 2.5), -zm + 9);
      } else K.woodRow(b, s, 0, CHUNK_LEN, { x0: X });
      const taken = [];
      if (chance(0.3)) { const z = rand(10, 70); K.fountain(b, s * (X - 0.4), -z, s); taken.push(z); }
      if (chance(0.45)) { const z = rand(8, 72); if (free(taken, z, 5)) { K.planeTree(b, s * (EDGE + 2.6), -z, rand(0.9, 1.1)); taken.push(z); } }
      if (chance(0.35)) { const z = rand(8, 72); if (free(taken, z, 4)) { K.judas(b, s * (EDGE + 2.6), -z, rand(0.75, 0.95)); K.petals(b, s * (EDGE + 2.6), -z, 2.2); taken.push(z); } }
      for (let k = randi(3, 6); k > 0; k--) K.cat(b, s * rand(EDGE + 0.8, X - 0.4), -rand(3, 77));
      for (let k = randi(2, 4); k > 0; k--) { const z = rand(4, 76); if (free(taken, z, 1.5)) { b.block(VC.solid, pick(['#3a6aa8', '#c8302a', '#2a8a5a']), s * (X - 0.8), 0, -z, 0.32, 0.34, 0.32); K.person(b, s * (X - 0.8), -z, { seated: true, ry: s < 0 ? -Math.PI / 2 : Math.PI / 2 }); } }   // neighbours on their stools at the door
      K.crowd(b, s * (EDGE + 0.6), s * (X - 0.8), 2, CHUNK_LEN - 2, randi(3, 7));
      for (let z = rand(6, 14); z < CHUNK_LEN - 2; z += rand(16, 22)) { b.box(VC.metal, '#1a1c20', s * (X - 0.5), 3.6, -z, 0.9, 0.06, 0.06); b.add(G.cyl6, VC.glow, s * (X - 0.95), 3.35, -z, 0.26, 0.4, 0.26, 0, 0, 0, hdr('#ffd890', 2.2)); K.pool(b, s * (X - 1.4), -z, 4, 4, hdr('#ffd890', 0.1)); }   // lanterns on brackets
    };
    const bazaarSide = (b, s) => {   // the bazaar quarter: low hans, the goods out on the pavement, porters and a crush of shoppers
      K.bazaarRow(b, s);
      const taken = [];
      for (let k = randi(1, 2); k > 0; k--) { const z = rand(8, 72); if (free(taken, z, 3)) { K.hamal(b, s * rand(EDGE + 1, EDGE + 3), -z); taken.push(z); } }
      if (chance(0.5)) { const z = rand(8, 72); if (free(taken, z, 3)) { K.nazarTree(b, s * (EDGE + 1.5), -z); taken.push(z); } }
      if (chance(0.35)) { const z = rand(8, 72); if (free(taken, z, 3)) { K.simitCart(b, s * (EDGE + 2.0), -z, s); taken.push(z); } }
      lamps(b, s, { skip: taken.map((z) => [z - 2, z + 2]) });
      K.throng(b, s * (EDGE + 0.6), s * (X0 - 2.0), 2, CHUNK_LEN - 2, randi(16, 24), taken.map((z) => [z - 1.4, z + 1.4]));
      for (let k = randi(0, 2); k > 0; k--) K.cat(b, s * rand(EDGE + 1, X0 - 2), -rand(4, 76));
    };
    const mahalleSide = (b, s) => {   // the apartment blocks: cabs and dolmuş at the kerb, plane trees, a sleeping dog, a simit seller
      K.aptRow(b, s);
      const taken = [];
      for (let k = randi(1, 3); k > 0; k--) { const z = rand(6, 74); if (free(taken, z, 6)) { (chance(0.6) ? K.taxi : K.dolmus)(b, s * (EDGE + 1.3), -z, pick([-1, 1])); taken.push(z); } }
      for (let z = rand(6, 12); z < CHUNK_LEN - 4; z += rand(14, 20)) if (free(taken, z, 3.5)) K.planeTree(b, s * (EDGE + 3.6), -z, rand(0.85, 1.05));
      if (chance(0.4)) K.dog(b, s * rand(EDGE + 4, X0 - 1.5), -rand(8, 72));
      if (chance(0.5)) K.person(b, s * rand(EDGE + 4, X0 - 1), -rand(8, 72), { tray: true, coat: '#f4f4f0' });
      lamps(b, s, { x: EDGE + 2.8, skip: taken.map((z) => [z - 3.5, z + 3.5]) });
      K.crowd(b, s * (EDGE + 4.2), s * (X0 - 0.6), 2, CHUNK_LEN - 2, randi(5, 10));
      for (let k = randi(1, 3); k > 0; k--) K.cat(b, s * rand(EDGE + 4, X0 - 0.6), -rand(4, 76));
    };
    const shoreSide = (b, s) => {   // the quay: fishermen at the rail, benches, a tea garden, boats, a ferry crossing, the far shore
      K.quay(b, s, { x: EDGE + 6.5, gulls: randi(2, 4) });
      const taken = [];
      for (let k = randi(5, 9); k > 0; k--) { const z = rand(3, 77); if (free(taken, z, 1.6)) { K.person(b, s * (EDGE + 6.1), -z, { rod: true, ry: s < 0 ? Math.PI / 2 : -Math.PI / 2, cap: chance(0.5) }); taken.push(z); if (chance(0.4)) b.cyl(VC.solid, pick(['#2a6ab0', '#e8e4dc']), s * (EDGE + 5.5), 0.2, -z + 0.4, 0.15, 0.4, 'cyl8'); } }
      if (chance(0.4)) { K.teaGarden(b, s * (EDGE + 1.2), s * (EDGE + 4.6), 20, 50, randi(4, 6)); K.samovar(b, s * (EDGE + 4.8), -16); taken.push(25, 35, 45); }
      else for (let z = rand(8, 16); z < CHUNK_LEN - 4; z += rand(14, 20)) K.bench(b, s * (EDGE + 4.6), -z, -s);
      if (chance(0.4)) { const z = rand(10, 70); if (free(taken, z, 3)) K.simitCart(b, s * (EDGE + 2.5), -z, -s); }
      for (let z = rand(6, 12); z < CHUNK_LEN - 2; z += rand(24, 30)) { K.lamp(b, s * (EDGE + 6.0), -z, { heads: 2 }); if (chance(0.5)) K.gull(b, s * (EDGE + 6.0), 4.32, -z); }
      for (let k = randi(2, 4); k > 0; k--) K.boat(b, s * rand(EDGE + 12, EDGE + 30), -rand(5, 75), rand(-0.4, 0.4) + (chance(0.5) ? Math.PI : 0));
      if (chance(0.5)) K.ferry(b, s * rand(EDGE + 70, EDGE + 120), -rand(20, 60), (s * Math.PI) / 2 + rand(-0.3, 0.3), 1);
      K.farShore(b, s, { x: 220 });
      K.crowd(b, s * (EDGE + 0.6), s * (EDGE + 4.5), 2, CHUNK_LEN - 2, randi(5, 9));
      for (let k = randi(1, 2); k > 0; k--) K.cat(b, s * rand(EDGE + 1, EDGE + 5), -rand(4, 76));
    };
    const decor = () => {
      const b = new Batcher();
      const r = Math.random(), kind = r < 0.26 ? 'pera' : r < 0.46 ? 'wooden' : r < 0.64 ? 'bazaar' : r < 0.82 ? 'mahalle' : 'shore';
      const wet = pick([-1, 1]);
      for (const s of [-1, 1]) {
        if (kind === 'shore' && s === wet) { shoreSide(b, s); continue; }
        farGround(b, s, '#1e1c22');
        if (kind === 'pera' || kind === 'shore') peraSide(b, s);
        else if (kind === 'wooden') woodenSide(b, s);
        else if (kind === 'bazaar') bazaarSide(b, s);
        else mahalleSide(b, s);
      }
      if (kind === 'pera') { if (chance(0.6)) for (const z of [18, 58]) K.bunting(b, -z - rand(-4, 4), { y: 15.6, w: X0 }); else for (const z of [14, 38, 62]) K.lights(b, -z, { y: 15.2, w: X0 }); }
      if (kind === 'bazaar') for (let z = 8; z < CHUNK_LEN; z += 12) K.lights(b, -z, { y: 15.2, w: X0, n: 18 });
      const g = b.build();
      g.userData.kind = kind;
      return g;
    };

    // ---------- the horizon: the hills of the old city under their domes and minarets, Süleymaniye at the far end ----------
    const stex = skyTex({ wall: '#1a1a24', lit: ['#ffd9a0', '#fff0d0', '#ffc880', '#ffe0b0', '#ffb070'], chance: 0.3, cols: 8, rows: 6 });
    const hillY = (deg) => 16 + 12 * Math.sin(deg * 0.075 + 0.6) + 8 * Math.sin(deg * 0.19 + 2.1) + 4 * Math.sin(deg * 0.43 + 0.3);   // the seven hills, more or less
    const sky = skyline({
      tex: stex,
      colors: ['#ffffff', '#f4e4d0', '#e8d8c8', '#f0d8c0'], count: 300, r: [560, 940], h: [6, 20], w: [18, 44], k: 1.2,
      heightCap: clear, follow: 190,
      landmarks: [
        (b) => {   // the hills all round, the houses climbing them with a lit window or two, mosques on the tops
          const R = 1020, seg = 180, pos = [], col = [], c = new THREE.Color(SKY.cHill);
          const P = (d, y) => { const [x, z] = polar(d, R); return [x, y, z]; };
          for (let i = 0; i < seg; i++) {
            const d0 = -180 + (i / seg) * 360, d1 = d0 + 360 / seg;
            for (const [d, y] of [[d0, -95], [d0, hillY(d0)], [d1, hillY(d1)], [d0, -95], [d1, hillY(d1)], [d1, -95]]) { pos.push(...P(d, y)); col.push(c.r, c.g, c.b); }
          }
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
          b.addM(g, SKY.hill, new THREE.Matrix4(), null);
          for (let k = 0; k < 360; k++) {
            const deg = rand(-180, 180), [x, z, ry] = polar(deg, rand(975, 1005)), top = hillY(deg) - rand(0, 30), h = rand(5, 12), w = rand(6, 14);
            b.add(G.box, SKY_VC, x, top - h / 2 + 2, z, w, h, 6, 0, ry, 0, hdr(pick(['#2a2a36', '#322e38', '#26283a']), 1));
            for (let n = randi(0, 2); n > 0; n--) { const o = rand(-w / 3, w / 3); b.add(G.box, SKY_VC, x + o * Math.cos(ry), top - rand(1, h - 2) + 2, z - o * Math.sin(ry), 1.8, 1.4, 6.4, 0, ry, 0, hdr(pick(['#ffd9a0', '#fff0d0', '#ffc880', '#ffb070']), rand(1.1, 1.8))); }
          }
          for (let k = 0; k < 12; k++) {
            const deg = rand(-170, 170); if (Math.abs(deg) < 9 || ICONS.some(([d]) => Math.abs(deg - d) < 5)) continue;
            const [x, z, ry] = polar(deg, 990);
            mahalleMosque(frame(b, x, hillY(deg) - 6, z, rand(2.2, 3.0), ry), SKY, { minaretSide: pick([-1, 1]), h: rand(26, 34) });
          }
        },
        (b) => {   // neighbourhood mosques among the roofs nearer in, a dome and a minaret each
          for (let k = 0; k < 16; k++) {
            const deg = rand(-110, 110); if (Math.abs(deg) < 7 || ICONS.some(([d]) => Math.abs(deg - d) < 4)) continue;
            const [x, z, ry] = polar(deg, rand(600, 900));
            mahalleMosque(frame(b, x, -6, z, rand(1.4, 2.0), ry), SKY, { minaretSide: pick([-1, 1]), h: rand(26, 34) });
          }
        },
        (b) => { const [x, z, ry] = polar(0, 900); b.add(G.sphLow, SKY.hill, x, -120, z, 640, 190, 420, 0, 0, 0, SKY.cHill); suleymaniye(frame(b, x, -32, z, 2.3, ry + Math.PI / 2 + 0.28), SUL); },
        (b) => { const [x, z, ry] = polar(16, 800); hagiaSophia(frame(b, x, -14, z, 1.45, ry + 0.5), SKY); },
        (b) => { const [x, z, ry] = polar(25, 860); blueMosque(frame(b, x, -12, z, 1.5, ry - 0.25), SKY); },
        (b) => { const [x, z, ry] = polar(-10, 700); yeniCami(frame(b, x, -10, z, 1.35, ry + 0.4), SKY); },
        (b) => { const [x, z, ry] = polar(-22, 620); galataTower(frame(b, x, -14, z, 1.7, ry), SKY); },
        (b) => { const [x, z, ry] = polar(62, 1500); camlica(frame(b, x, -40, z, 0.85, ry), SKY); },
        (b) => {   // Levent's towers, far off to the left
          for (let k = 0; k < 6; k++) {
            const deg = rand(-62, -50), [x, z, ry] = polar(deg, rand(1550, 1700)), h = rand(140, 260), w = rand(26, 40);
            b.add(G.box, SKY.steel, x, -60 + h / 2, z, w, h, w * rand(0.6, 1), 0, ry + rand(-0.3, 0.3), 0, hdr(pick(['#3a4a6a', '#2a3a58', '#4a5a7a']), 1));
            for (let f = 0; f < h / 9; f++) if (chance(0.5)) b.add(G.box, SKY_VC, x, -60 + f * 9 + 4, z, w * 1.02, 0.8, w * 0.6, 0, ry, 0, hdr(pick(['#cfe6ff', '#fff0d8']), 1.1));
          }
        },
      ],
    });
    // the Bosphorus Bridge off to the right, its cables lit in slow colours; the crescent and the evening star
    const bridge = new Batcher();
    { const [x, z, ry] = polar(36, 1300); bosphorusBridge(frame(bridge, x, -50, z, 0.62, ry - 0.3), SKY, { lights: LED, cLights: 0xffffff, span: 1074, back: 230 }); }
    const crescent = new THREE.Shape(); crescent.absarc(0, 0, 1, 0, Math.PI * 2, false);
    const bite = new THREE.Path(); bite.absarc(0.34, 0.04, 0.84, 0, Math.PI * 2, true); crescent.holes.push(bite);   // opening toward the star, as on the flag
    { const [x, z, ry] = polar(-8, 950); bridge.add(new THREE.ShapeGeometry(crescent, 32), MOON, x, 150, z, 15, 15, 1, 0, ry, 0.25); }
    { const [x, z, ry] = polar(-6.6, 950); bridge.add(G.sph, MOON, x, 154, z, 3.0, 3.0, 3.0, 0, ry, 0); }
    // while the Galata landmark comes up the tower stands at the end of the street in Süleymaniye's place
    const gal = new Batcher();
    galataTower(frame(gal, 0, -46, -250, 1.4, 0.3), GT);
    const galSky = gal.build();
    floodGrad(sky, [SKY.wall, SKY.dome, SUL.wall, SUL.dome], -30, 150);
    floodGrad(galSky, [GT.wall, GT.dome], -46, 60);
    bakeShade(sky, SHADED, new THREE.Vector3(-0.3, 0.6, 0.75), 0.62, 0.5);
    bakeShade(galSky, [GT.wall, GT.dome], new THREE.Vector3(-0.3, 0.6, 0.75), 0.62, 0.5);
    const extra = bridge.build();
    bakeShade(extra, [SKY.steel], new THREE.Vector3(-0.6, 0.5, 0.6), 0.6, 0.5);
    for (const g of [extra, galSky]) { g.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.renderOrder = -5; } }); sky.add(g); }
    galSky.visible = false;
    const galLM = LM.landmarks.find((l) => l.key === 'galata');
    // the gulls: a body and two wings each, gliding round in loops above the street (they keep pace with the runner)
    const GULLS = Array.from({ length: 22 }, (_, i) => ({ cx: rand(-60, 60) + (i % 2 ? 25 : -25), cy: rand(20, 46), cz: -rand(40, 220), r: rand(8, 26), w: rand(0.25, 0.5) * pick([-1, 1]), ph: rand(0, 6.28), flap: rand(0.6, 1.2) }));
    const gullMat = new THREE.MeshBasicMaterial({ color: hdr('#e8e8f0', 0.85), fog: false });
    const wingGeo = new THREE.BufferGeometry(); wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.25, 1.1, 0.05, 0.05, 0, 0, 0.3], 3)); wingGeo.computeVertexNormals();
    const gBody = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 6, 4), gullMat, GULLS.length);
    const gWing = new THREE.InstancedMesh(wingGeo, new THREE.MeshBasicMaterial({ color: hdr('#d8dce4', 0.8), fog: false, side: THREE.DoubleSide }), GULLS.length * 2);
    for (const m of [gBody, gWing]) { m.frustumCulled = false; m.renderOrder = -4; sky.add(m); }
    const _m = new THREE.Matrix4(), _w = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _e = new THREE.Euler();
    const updateGulls = (t) => {
      GULLS.forEach((u, i) => {
        const a = u.ph + t * u.w, x = u.cx + Math.cos(a) * u.r, z = u.cz + Math.sin(a) * u.r, y = u.cy + Math.sin(t * 0.4 + u.ph) * 2;
        const head = u.w > 0 ? -a : Math.PI - a, bank = -0.35 * Math.sign(u.w);   // flying along the loop, banked into it
        _q.setFromEuler(_e.set(0, head, bank, 'YXZ'));
        _m.compose(_p.set(x, y, z), _q, _s.set(0.5, 0.42, 1.3)); gBody.setMatrixAt(i, _m);
        const f = Math.sin(t * 7 * u.flap + u.ph), beat = Math.max(0, Math.sin(t * 0.7 + u.ph * 3)) > 0.6 ? f * 0.7 : 0.15;   // gliding, with a few beats now and then
        for (const sd of [-1, 1]) {
          _w.makeRotationZ(0.12 + beat).premultiply(_m.compose(_p.set(x, y, z), _q, _s.set(sd * 1.6, 1.6, 1.6)));   // the left wing is the right one mirrored
          gWing.setMatrixAt(i * 2 + (sd > 0 ? 1 : 0), _w);
        }
      });
      gBody.instanceMatrix.needsUpdate = true; gWing.instanceMatrix.needsUpdate = true;
    };

    // ---------- the trains ----------
    // T1's modern trams parked on the line, white with the red band and the turquoise; the nostalgic tram of İstiklal
    // coming at you, red and cream, its trolley pole up, ringing its bell
    const DESTS = ['KABATAŞ', 'BAĞCILAR', 'EMİNÖNÜ', 'SİRKECİ', 'ZEYTİNBURNU', 'SULTANAHMET'];
    const destTex = canvasTex(512, 80 * DESTS.length, (g, w) => {
      g.fillStyle = '#060606'; g.fillRect(0, 0, w, 80 * DESTS.length);
      DESTS.forEach((d, i) => { g.fillStyle = '#ffa02a'; g.shadowColor = '#ffa02a'; g.shadowBlur = 6; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 50px ${SANS}`; g.fillText('T1  ' + d, w / 2, i * 80 + 42, w - 30); });
    }, { repeat: false });
    const destRects = DESTS.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / DESTS.length + 0.003, v1: 1 - i / DESTS.length - 0.003 }));
    const destMat = basic({ map: destTex, color: hdr('#ffffff', 1.5) });
    const nostalgic = K.label('TAKSİM — TÜNEL', { w: 512, h: 96, color: '#141414', bg: '#f4ecd4', font: SERIF, weight: 900, size: 0.6, k: 1.3 });
    const tram = (b, c) => {   // the nostalgic tram: wooden windows, the cream band, the trolley pole, its headlamp and destination
      const zc = c.zb0 - c.bl / 2;
      for (const sx of [-1, 1]) {
        const x = sx * (TRAIN_W / 2 + 0.012);
        b.box(VC.solid, '#f0e6c8', x, 1.12, zc, 0.02, 0.42, c.bl - 0.3);
        b.box(VC.solid, '#d8a830', x + sx * 0.004, 0.9, zc, 0.02, 0.05, c.bl - 0.3);
        for (let k = 0; k < 7; k++) { const wz = c.zb0 - 0.8 - k * ((c.bl - 1.6) / 6.5); b.box(VC.solid, '#5a2a14', x + sx * 0.004, 2.05, wz, 0.02, 1.0, 1.15); b.box(VC.glow, hdr('#ffd890', 1.3), x + sx * 0.01, 2.08, wz, 0.02, 0.82, 0.95); }
      }
      b.box(VC.solid, '#7a1a1a', 0, TRAIN_H + 0.1, zc, TRAIN_W * 0.6, 0.28, c.bl * 0.8);   // the clerestory
      beam(b, VC.metal, 0, TRAIN_H + 0.25, zc + 2.0, 0, TRAIN_H + 2.0, zc - 1.8, 0.05, '#2a2a2e');   // the trolley pole up to the wire
      b.box(VC.metal, '#2a2a2e', 0, TRAIN_H + 2.05, zc - 1.9, 0.5, 0.06, 0.1);
      if (c.front) {
        b.add(G.plane, nostalgic, 0, 3.0, c.z0 + 0.05, 1.5, 0.28, 1);
        b.sph(VC.glow, hdr('#fff4d6', 4), 0, 1.0, c.z0 + 0.05, 0.16, true);
        b.box(VC.metal, '#e8c060', 0.7, 2.75, c.z0 + 0.08, 0.14, 0.14, 0.14);   // the bell
        b.box(VC.solid, '#2a2a2a', 0, 0.35, c.z0 + 0.2, TRAIN_W - 0.2, 0.2, 0.3);
      }
    };
    const trainStyle = {
      body: '#f2f2ee', bodyMetal: false, roof: '#d8dcdc', under: '#2a2c30', stripe: '#c8102e', stripe2: '#1ab0b8', doors: true, door: '#e4e8e8',
      window: '#d8ecff', windowK: 1.05, frame: '#1a1c20', light: '#f4f8ff', sign: '#ffa02a', roofUnit: '#a0a4a8',
      rampMat: std({ map: stripeTex('#1e2026', '#3ad6d0', 6), roughness: 0.6 }), rampGlow: '#3ad6d0',
      extra: (b, c) => {   // the cab end: the destination; the pantograph
        if (c.front) { b.add(planeUV(pick(destRects)), destMat, 0, 3.0, c.z0 + 0.045, 1.4, 0.24, 1); b.box(VC.solid, '#c8102e', 0, 1.15, c.z0 + 0.03, TRAIN_W - 0.1, 0.3, 0.02); }
        if (c.idx === 0) { const zp = c.z0 - c.len / 2; beam(b, VC.metal, -0.4, TRAIN_H + 0.2, zp + 0.5, 0, TRAIN_H + 1.0, zp, 0.04, '#2a2a2e'); beam(b, VC.metal, 0.4, TRAIN_H + 0.2, zp + 0.5, 0, TRAIN_H + 1.0, zp, 0.04, '#2a2a2e'); b.box(VC.metal, '#2a2a2e', 0, TRAIN_H + 1.02, zp, 1.2, 0.05, 0.12); }
      },
      movingStyle: { body: '#cc2028', bodyMetal: false, roof: '#8a1c1c', under: '#1a1a1a', stripe: '#f0e6c8', stripe2: null, frame: '#4a2414', windows: false, doors: false, gangway: false, roofUnits: false,
        light: '#fff0c8', sign: '#ffd23d', window: '#ffd890', windowK: 1.2, extra: tram },
    };

    // ---------- the obstacles ----------
    // a kilim hung across the line on its frame to slide under; a planter of tulips to jump
    const kilimTex = canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = '#a8201a'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1a2a5a'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10);
      g.fillStyle = '#e8c070'; for (let x = 0; x < w; x += 8) { g.fillRect(x, 3, 4, 4); g.fillRect(x + 4, h - 7, 4, 4); }
      for (let k = 0; k < 5; k++) {
        const cx = 26 + k * 51, cy = h / 2;
        for (const [r, c] of [[26, '#1a2a5a'], [19, '#f0e8d8'], [13, '#2a5a3a'], [6, '#e8c070']]) { g.fillStyle = c; g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r * 0.9, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r * 0.9, cy); g.closePath(); g.fill(); }
      }
    }, { repeat: false });
    const barrier = barrierStyle({ c1: '#5a3a20', c2: '#e8c070', label: '', signBg: '#a8201a', signFg: '#e8c070', glow: '#3ad6d0', post: '#4a3020' });
    barrier.signMat = std({ map: kilimTex, roughness: 0.85, emissive: '#ffffff', emissiveMap: kilimTex, emissiveIntensity: 0.3 });
    barrier.highExtra = (b) => {
      b.box(VC.solid, '#5a3a20', 0, 2.82, 0, 2.7, 0.16, 0.2);
      for (const sx of [-1, 1]) b.sph(VC.solid, '#5a3a20', sx * 1.38, 2.84, 0, 0.13, true);
      for (let k = 0; k < 12; k++) b.add(G.cone8, VC.solid, -1.05 + k * 0.19, 1.72, 0.02, 0.06, 0.12, 0.06, Math.PI, 0, 0, pick(['#e8c070', '#1a2a5a', '#f0e8d8']));   // the fringe
      for (const sx of [-1, 1]) { b.box(VC.metal, '#3a2a14', sx * 1.32, 2.55, 0.1, 0.015, 0.5, 0.015); b.sph(VC.glow, hdr(sx < 0 ? '#3ad6ff' : '#ff4a4a', 2.2), sx * 1.32, 2.25, 0.1, 0.12, true); }
    };
    const band = iznikTex(); band.repeat.set(4, 1);
    barrier.lowBarMat = std({ map: band, roughness: 0.35 });
    barrier.lowExtra = (b) => {
      b.box(VC.solid, '#c8b898', 0, 1.06, 0, 2.1, 0.2, 0.3);
      b.box(VC.solid, '#3a2a1e', 0, 1.17, 0, 2.0, 0.03, 0.24);
      b.add(G.plane, K.tulipMat, 0, 1.18 + 0.27, 0, 2.0, 0.55, 1, 0, 0, 0);
    };

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: LM.landmarks,
      coinGeo: coinGeometry('tulip'), coinMat: coinMaterial('#ffd04a', '#ff9a00'),
      update(t) {
        K.update(t);
        LM.update(t);
        updateGulls(t);
        LED.color.setHSL((t * 0.02) % 1, 0.8, 0.62).multiplyScalar(2.2);
        // nearing Galata, the tower comes up at the end of the street and Süleymaniye fades; both swap back as its square arrives
        const ch = galLM.obj && galLM.obj.parent, D = ch && ch.parent ? sky.position.z - ch.position.z : 1e9;
        const kG = D > 300 || D < 40 ? 0 : D > 250 ? (300 - D) / 50 : D < 90 ? (D - 40) / 50 : 1;
        if (sky.userData.kG !== kG) {
          sky.userData.kG = kG;
          for (const m of [GT.wall, GT.dome, GT.glow, GT.gold]) m.opacity = kG;
          for (const m of [SUL.wall, SUL.dome, SUL.glow, SUL.gold]) { m.opacity = 1 - kG; m.visible = kG < 0.99; }
          galSky.visible = kG > 0.01;
          const g = Math.min(1, Math.max(0, (250 - D) / 160)), sc = 1 + 0.2 * g * g * (3 - 2 * g);   // growing a little, about its foot, as we run up to it
          galSky.scale.setScalar(sc); galSky.position.set(0, -46 * (1 - sc), -250 * (1 - sc));
        }
      },
    };
  },
};
