// Sydney: a warm New Year's Eve on the harbour. Paddington terraces with iron lace under purple jacarandas, the CBD's
// glass towers and light rail, sandstone pubs of The Rocks, harbourside walks under Moreton Bay figs and Bondi's surf;
// silver double-deck trains parked, light-rail trams coming at you, flying foxes over the city, fireworks bursting over
// the skyline, and Sydney Tower glowing gold at the far end of the track.
import { THREE, Batcher, VC, G, std, hdr, stripeTex, canvasTex, buildingGeo, CHUNK_LEN, TRAIN_W, rand, randi, pick, chance } from '../core.js';
import { barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, skyline, skyTex, SKY_VC, polar, at, EDGE, farGround } from './common.js';
import { beam, wire } from './tokyo_kit.js';
import { makeKit } from './sydney_kit.js';
import { sydLandmarks, sailGeo } from './sydney_landmarks.js';
import { Fireworks, Flock } from '../fx.js';

const EYE = 4.5;
const SKY2 = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide });   // two-sided skyline pieces
const SHORE = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });                // fogged-out far shores

// Sydney Tower: the slender shaft in its cable net, the golden turret and the spire
function sydneyTower(b) {
  const [x, z] = polar(0, 900);
  b.add(G.cyl, SKY_VC, x, (196 - 95) / 2, z, 8.4, 291, 8.4, 0, 0, 0, '#8a90a8');
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2, a2 = a + 0.7;
    beam(b, SKY_VC, x + Math.cos(a) * 5, 194, z + Math.sin(a) * 5, x + Math.cos(a2) * 20, 40, z + Math.sin(a2) * 20, 0.9, hdr('#aab4d8', 0.9));
  }
  [[196, 4, 15, '#2a2e44'], [200, 6, 17, hdr('#ffc860', 1.7)], [206, 3, 18, '#2a2e44'], [209, 6, 17, hdr('#ffd27a', 1.8)],
    [215, 5, 15.5, hdr('#ffe0a0', 1.5)], [220, 4, 13, '#2a2e44'], [224, 2, 9, hdr('#ffc860', 1.4)]]
    .forEach(([y, h, r, c]) => b.add(G.cyl, SKY_VC, x, y + h / 2, z, r * 2, h, r * 2, 0, 0, 0, c));
  b.add(G.cyl, SKY_VC, x, 258, z, 3.2, 64, 3.2, 0, 0, 0, '#8a90a8');
  for (const y of [236, 248, 262, 276]) b.add(G.cyl, SKY_VC, x, y, z, 4.2, 1.2, 4.2, 0, 0, 0, hdr('#fff0d0', 2));
  b.sph(SKY_VC, hdr('#ff2a2a', 6), x, 292, z, 2.4);
}
// the Harbour Bridge on the horizon, its arch spanning across the line of sight
function skyBridge(b, deg, r, span) {
  const a = (deg * Math.PI) / 180, cx = Math.sin(a) * r, cz = -Math.cos(a) * r, tx = Math.cos(a), tz = Math.sin(a);
  const P = (s, y) => [cx + tx * s, y, cz + tz * s], W = -18, deck = 30, N = 20, u = (s) => (2 * s) / span;
  const top = (s) => 64 + 36 * (1 - u(s) ** 2), bot = (s) => W + 82 * (1 - u(s) ** 2), steel = '#343a54';
  for (let k = 0; k <= N; k++) {
    const s = -span / 2 + (span * k) / N;
    beam(b, SKY_VC, ...P(s, top(s)), ...P(s, Math.max(bot(s), W)), 1.6, steel);
    if (bot(s) > deck) beam(b, SKY_VC, ...P(s, bot(s)), ...P(s, deck), 0.8, steel);
    b.sph(SKY_VC, hdr(k % 4 ? '#fff0d0' : '#ffd23d', 3), ...P(s, top(s) + 1.5), 1.3, true);
    if (k === N) continue;
    const s2 = s + span / N;
    beam(b, SKY_VC, ...P(s, top(s)), ...P(s2, top(s2)), 3, steel, 3);
    beam(b, SKY_VC, ...P(s, bot(s)), ...P(s2, bot(s2)), 4.5, steel, 4.5);
    beam(b, SKY_VC, ...P(s, k % 2 ? top(s) : bot(s)), ...P(s2, k % 2 ? bot(s2) : top(s2)), 1.2, steel);
  }
  beam(b, SKY_VC, ...P(-span / 2 - 90, deck), ...P(span / 2 + 90, deck), 4, '#262a40', 14);
  for (let s = -span / 2 - 80; s < span / 2 + 80; s += 12) b.sph(SKY_VC, hdr('#ffe6b0', 2.4), ...P(s, deck + 3), 1.0, true);
  for (const s of [-span / 2 - 8, span / 2 + 8]) {
    const [px, , pz] = P(s, 0);
    b.add(G.box, SKY_VC, px, (W + 67) / 2, pz, 22, 67 - W, 40, 0, -a, 0, '#4a4458');
    b.add(G.box, SKY_VC, px, 69, pz, 18, 4, 34, 0, -a, 0, hdr('#ffd9a0', 1.2));
  }
}
// the Opera House across the water, seen side-on
function skyOpera(b, deg, r, s) {
  const a = (deg * Math.PI) / 180, [cx, cz] = polar(deg, r), th = Math.PI / 2 - a, base = -30;
  const place = (dx, dz) => [cx + (Math.cos(th) * dx + Math.sin(th) * dz) * s, cz + (-Math.sin(th) * dx + Math.cos(th) * dz) * s];
  b.add(G.box, SKY_VC, cx, base + 3 * s, cz, 46 * s, 6 * s, 84 * s, 0, th, 0, '#6a5a50');
  const lit = hdr('#f6eedc', 0.95), sc = new THREE.Vector3(s, s, s);
  for (const [dx, list] of [[-11, [[30, 20, 6], [26, 18, 5], [21, 15, 4.5], [15, 12, 3.5]]], [11, [[26, 18, 5.5], [22, 16, 4.5], [18, 13, 4], [13, 10, 3]]]]) {
    const shells = list.map(([H, W, D], k) => [22 - k * 9, H, W, D, false]);
    const [H, W] = list[list.length - 1];
    shells.push([22 - list.length * 9 + 1, H * 0.85, W * 0.95, 3, true]);
    for (const [dz, H2, W2, D2, back] of shells) {
      const [px, pz] = place(dx, dz);
      b.addM(sailGeo(W2, H2, D2, H2 * 0.45, H2 * 0.16), SKY2, new THREE.Matrix4().makeRotationY(th + (back ? Math.PI : 0)).scale(sc).setPosition(px, base + 6 * s, pz), lit);
    }
  }
}
// skyline buildings: low in front of Sydney Tower, none on the water under the bridge
const sydClear = (a, rr) => {
  const deg = (a * 180) / Math.PI;
  if (Math.abs(deg) < 11) return EYE + rr * Math.tan(0.07);
  if (deg > -45 && deg < -11 && rr < 800) return 0;
  if (Math.abs(deg - 30) < 8) return EYE + rr * Math.tan(0.03);
  return Infinity;
};

export default {
  id: 'syd', name: '悉尼', en: 'SYDNEY', tagline: '跨年烟花 · 海港之夜',
  blurb: '跨年夜的悉尼海港：帕丁顿露台屋的铸铁花边阳台下开满紫色蓝花楹，岩石区的砂岩老酒馆挂着吊牌，CBD 玻璃塔下轻轨缓缓驶过。从环形码头的歌剧院出发，穿过阿盖尔隧道，冲上海港大桥看烟花瀑布倾泻而下，经过月神公园的大笑脸、维多利亚女王大厦和达令港，一路跑到邦迪海滩的冲浪与冰山泳池；跑道尽头，悉尼塔金光闪耀。',
  sights: ['环形码头 · 歌剧院', '岩石区 · 阿盖尔隧道', '海港大桥', '月神公园', '维多利亚女王大厦', '达令港', '邦迪海滩'],
  accent: '#9d6bff', accent2: '#3dd8ff', portal: '#9d6bff',
  sky: { top: '#050a24', mid: '#182c6a', bot: '#b8708e', glow: '#ff7ab0', glowK: 0.4, sun: '#fff0d8', sunK: 0.75,
    sunDir: [-0.36, 0.2, -1], sunSize: 0.0011, moon: true, cloud: 0.18, cloudColor: '#4a3a6a', horizon: -0.07, stars: true },
  fog: { color: '#1a2450', near: 24, far: 240 },
  light: { hemiSky: '#a8b8ff', hemiGround: '#2a2440', hemi: 0.85, dir: '#ffe6c8', dirK: 0.55, dirPos: [-0.3, 0.35, -1] },
  exposure: 0.95, bloom: { strength: 0.85, radius: 0.55, threshold: 0.82 },
  weather: [{ mode: 'fall', count: 520, colors: ['#9d7ae0', '#b394f0', '#8a6ad8', '#c4aaf8'], size: 0.42, k: 1.1, box: [46, 20, 90], speed: 0.7, shape: 4 }],
  coin: 'southern', music: 'syd', jingle: 'kookaburra',

  build() {
    const K = makeKit();
    const LM = sydLandmarks(K), LK = LM.kit;
    const pave = canvasTex(128, 128, (g, w, h) => {   // sandstone paving slabs beside the track
      g.fillStyle = '#3e3830'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32) for (let x = ((y / 32) % 2) * 32; x < w + 64; x += 64) {
        const v = randi(-8, 8); g.fillStyle = `rgb(${92 + v},${82 + v},${68 + v})`; g.fillRect(x - 31, y + 1, 62, 30);
      }
    });
    pave.repeat.set(2, 24);
    const track = makeTrack({ gravel: '#2a2a30', spots: ['#383840', '#1d1d22', '#4a4a52'], sleeper: '#4a4038', rail: '#c9ced8', railMatte: true,
      edge: '#ffd23d', edgeK: 1.6, sideMat: std({ map: pave, roughness: 0.85 }) });

    const festoon = (b, z, y = 11.8, sag = 0.6) => {   // a string of warm bulbs across the lane
      wire(b, -11, y, z, 11, y, z, sag, { color: '#1a1a1e', t: 0.03, n: 10 });
      for (let k = 1; k < 18; k++) { const s = k / 18; b.sph(VC.glow, hdr(pick(['#ffd28a', '#ffcf8a', '#fff0c0']), 2.4), -11 + 22 * s, y - sag * 4 * s * (1 - s) - 0.12, z, 0.1, true); }
    };
    // harbourside walk: the water with the far shore's lights, a ferry, Moreton Bay figs along the sea wall
    const harbourSide = (b, s) => {
      b.add(G.plane, LK.harbour, s * 130, -1.2, -40, 240, 80, 1, -Math.PI / 2, 0, 0);
      LK.seawall(b, s); LK.endCap(b, s, -1.4);
      for (let k = randi(4, 7); k > 0; k--) {
        const x = s * rand(120, 170), z = -rand(6, 74);
        b.addM(buildingGeo(rand(10, 18), rand(12, 46), rand(10, 16), K.glass, 1.3, 2.6), K.glassMat, at(x, -1.2, z), pick(['#ffffff', '#c9d6ff', '#ffe6c0']));
        LK.refl(b, x - s * 6, z, 80, 2.2, pick(['#ffd9a0', '#9fd8ff', '#ff9ad5', '#fff0d0']));
      }
      if (chance(0.5)) LK.ferry(b, s * rand(34, 70), -rand(16, 64), rand(-0.3, 0.3));
      for (let z = rand(4, 10); z < CHUNK_LEN - 4; z += rand(15, 20)) K.fig(b, s * (EDGE + 4.2), -z, rand(0.6, 0.72));
      for (let z = rand(6, 12); z < CHUNK_LEN; z += 16) K.lamp(b, s * (EDGE + 6.4), -z, s);
      for (let k = randi(1, 3); k > 0; k--) K.cockatoo(b, s * (EDGE + 7.1), 1.15, -rand(4, 76));
      K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 6.4), 2, CHUNK_LEN - 2, randi(4, 9));
    };
    // beachfront: sea wall down to the sand, the surf rolling in, Norfolk pines, a lifeguard tower and the flags
    const beachSide = (b, s) => {
      const SY = -1.6, sand = new Batcher();
      b.box(VC.solid, '#d8d0c4', s * (EDGE + 7.5), -0.7, -40, 0.7, 2.2, 80);
      b.box(VC.metal, '#3a3e46', s * (EDGE + 7.4), 1.1, -40, 0.07, 0.07, 80);
      for (let z = 1; z < 80; z += 2) b.box(VC.metal, '#3a3e46', s * (EDGE + 7.4), 0.75, -z, 0.05, 0.7, 0.05);
      b.box(VC.solid, '#ac9a76', s * 37, SY - 0.15, -40, 51, 0.3, 80);
      b.add(G.box, VC.solid, s * 69, SY - 0.12, -40, 15, 0.1, 80, 0, 0, -s * 0.02, '#5a5444');
      b.add(G.plane, LK.sea, s * 138, SY - 0.15, -40, 140, 80, 1, -Math.PI / 2, 0, 0);
      b.add(G.plane, LK.foamMat, s * 84, SY - 0.1, -40, 80, 36, 1, -Math.PI / 2, (s * Math.PI) / 2, 0);
      LK.endCap(b, s, SY - 0.3, 208);
      for (let z = rand(3, 8); z < CHUNK_LEN - 2; z += rand(11, 15)) K.norfolk(b, s * (EDGE + 5.2), -z, rand(0.78, 0.95));
      if (chance(0.6)) {
        const lx = s * rand(30, 42), lz = -rand(14, 66);
        for (const [dx, dz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) sand.box(VC.metal, '#d8d8de', lx + dx, 1.5, lz + dz, 0.2, 3, 0.2);
        sand.block(VC.solid, '#f4f2ec', lx, 3, lz, 4.2, 3.2, 4.2);
        sand.box(VC.glow, hdr('#e8f4ff', 1.1), lx, 4.8, lz, 4.3, 0.9, 4.3);
        sand.box(VC.solid, '#c8202c', lx, 6.4, lz, 4.6, 0.3, 4.6);
        K.flags(sand, lx + s * 8, lz - 10); K.flags(sand, lx + s * 8, lz + 12);
      }
      for (let k = randi(4, 9); k > 0; k--) sand.add(G.sph, VC.solid, s * rand(16, 54), 1.0, -rand(6, 74), 0.12, 2.0, 0.5, 0.2, rand(0, 3), 0, pick(['#ffd23d', '#3dfff0', '#ff6a8a', '#f4f4f0']));
      K.crowd(sand, s * 16, s * 56, 4, 76, randi(8, 16));
      K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 6.4), 2, CHUNK_LEN - 2, randi(4, 8));
      const gs = sand.build();
      gs.position.y = SY;
      return gs;
    };

    // regular blocks: Paddington terraces, CBD towers, sandstone Rocks lanes, a harbourside walk or the beachfront
    const decor = () => {
      const b = new Batcher(), extra = [];
      const r = Math.random(), kind = r < 0.3 ? 'terrace' : r < 0.56 ? 'cbd' : r < 0.7 ? 'rocks' : r < 0.86 ? 'harbour' : 'beach';
      const wetSide = pick([-1, 1]), dry = kind === 'harbour' ? pick(['terrace', 'cbd']) : 'shops';
      const rail = kind === 'cbd' && chance(0.65), stopSide = pick([-1, 1]), zStop = rand(20, 60);
      for (const side of [-1, 1]) {
        const sk = kind === 'harbour' || kind === 'beach' ? (side === wetSide ? kind : dry) : kind;
        if (sk === 'harbour') { harbourSide(b, side); continue; }
        if (sk === 'beach') { extra.push(beachSide(b, side)); continue; }
        farGround(b, side, '#16171d');
        if (sk === 'terrace') {
          K.terraces(b, side, 0, CHUNK_LEN);
          for (let z = rand(3, 8); z < CHUNK_LEN - 2; z += rand(8.5, 11)) K.jacaranda(b, side * (EDGE + 3.4), -z, rand(0.85, 1.02));
          for (let z = rand(5, 9); z < CHUNK_LEN; z += 14) K.gasLamp(b, side * (EDGE + 0.8), -z);
          if (chance(0.6)) K.bin(b, side * (EDGE + 4.9), -rand(6, 74), chance(0.6));
          for (let k = randi(0, 3); k > 0; k--) K.cockatoo(b, side * 9.4, 1.1, -rand(4, 76));
          if (chance(0.3)) K.streetSign(b, side * (EDGE + 0.8), -rand(10, 70));
          K.crowd(b, side * (EDGE + 1.2), side * (EDGE + 5.2), 2, CHUNK_LEN - 2, randi(3, 7));
        } else if (sk === 'cbd') {
          K.cbdRow(b, side, 0, CHUNK_LEN);
          for (let z = rand(3, 8); z < CHUNK_LEN - 2; z += rand(9, 12)) {
            if (rail && side === stopSide && Math.abs(z - zStop) < 8) continue;
            if (chance(0.75)) K.palm(b, side * (EDGE + 4.8), -z, rand(0.85, 1.0)); else K.gum(b, side * (EDGE + 4.8), -z, rand(0.7, 0.85));
          }
          for (let z = rand(6, 12); z < CHUNK_LEN; z += 16) K.lamp(b, side * (EDGE + 1.4), -z, side);
          if (chance(0.7)) K.walkSignal(b, side * (EDGE + 0.5), -pick([3, 77]), side);
          if (chance(0.5)) K.streetSign(b, side * (EDGE + 0.9), -rand(10, 70));
          if (chance(0.4)) K.bin(b, side * (EDGE + 6.2), -rand(6, 74), chance(0.5));
          if (chance(0.3)) K.busker(b, side * (EDGE + 5.0), -rand(10, 70), side);
          K.crowd(b, side * (EDGE + 1.2), side * (EDGE + 6.4), 2, CHUNK_LEN - 2, randi(6, 12));
        } else if (sk === 'rocks') {
          K.sandRow(b, side, 0, CHUNK_LEN);
          b.add(G.plane, LK.cobbleMat, side * (EDGE + 3.5), 0.05, -40, 6.8, 80, 1, -Math.PI / 2, 0, 0);
          for (let z = rand(4, 8); z < CHUNK_LEN; z += 10) K.gasLamp(b, side * (EDGE + 0.7), -z);
          const stalls = side > 0 && chance(0.5);
          if (stalls) { const z1 = rand(30, 74); for (let z = rand(6, 12); z < z1; z += 5.5) K.stall(b, EDGE + 2.4, -z); }
          K.crowd(b, side * (stalls ? EDGE + 3.9 : EDGE + 1.2), side * (EDGE + 6.6), 2, CHUNK_LEN - 2, randi(5, 10));
        } else {
          K.beachShops(b, side, 0, CHUNK_LEN);
          for (let z = rand(3, 8); z < CHUNK_LEN; z += rand(9, 12)) K.palm(b, side * (EDGE + 3.6), -z, rand(0.9, 1.05));
          for (const z of [rand(10, 30), rand(45, 70)]) K.surfRack(b, side * (EDGE + 5.6), -z);
          for (let z = rand(6, 12); z < CHUNK_LEN; z += 16) K.lamp(b, side * (EDGE + 1.4), -z, side);
          K.crowd(b, side * (EDGE + 1.2), side * (EDGE + 6.4), 2, CHUNK_LEN - 2, randi(5, 10));
        }
      }
      if (rail) { K.catenary(b); K.lightRailStop(b, stopSide * (EDGE + 2.6), -zStop, stopSide); }
      if (kind === 'rocks' && chance(0.6)) for (const z of [12, 30, 48, 66]) if (chance(0.7)) festoon(b, -z);
      const g = b.build();
      for (const e of extra) g.add(e);
      return g;
    };

    const fireworks = [
      new Fireworks({ shells: 8, sparks: 110, center: [0, 150, -840], spread: [600, 90, 160] }),
      new Fireworks({ shells: 4, sparks: 110, center: [...((p) => [p[0], 150, p[1]])(polar(-28, 760))], spread: [220, 50, 60], radius: [40, 70], period: [3, 5] }),
    ];
    const bats = new Flock({ count: 30, center: [0, 70, -380], spread: [700, 60, 260] });
    const sky = skyline({
      tex: skyTex({ wall: '#0b0d1e', lit: ['#fff1d6', '#d6ecff', '#ffd9a8', '#ffb8e0'], chance: 0.34 }),
      colors: ['#ffffff', '#c7d2ff', '#b0b9e6', '#9aa4d9'], count: 150, h: [40, 180], k: 1.6,
      heightCap: sydClear, follow: 190,
      landmarks: [
        sydneyTower,
        (b) => skyBridge(b, -28, 780, 300),
        (b) => skyOpera(b, 30, 540, 2),
        (b, mat) => {   // Chifley Tower with its stepped crown and mast
          const [x, z, ry] = polar(-7, 780);
          b.addM(buildingGeo(44, 150 + 95, 40, { cols: 8, rows: 16 }, 3.4, 4.2), mat, at(x, -95, z, ry), '#d9dcf0');
          for (let k = 0; k < 3; k++) b.add(G.box, SKY_VC, x, 152 + k * 6, z, 36 - k * 8, 6, 32 - k * 7, 0, ry, 0, k % 2 ? '#2a3050' : hdr('#e8f0ff', 1.4));
          b.add(G.cyl, SKY_VC, x, 184, z, 2, 30, 2, 0, 0, 0, hdr('#e8ecff', 1.4));
          b.sph(SKY_VC, hdr('#ff2a2a', 6), x, 200, z, 2.2);
        },
        (b) => {   // Australia Square: the round tower with its lit crown
          const [x, z] = polar(6, 720);
          b.add(G.cyl, SKY_VC, x, (80 - 95) / 2, z, 46, 175, 46, 0, 0, 0, '#262c48');
          for (let y = -80; y < 78; y += 9) b.add(G.cyl, SKY_VC, x, y, z, 46.6, 1.6, 46.6, 0, 0, 0, hdr('#ffe2b0', 1.0));
          b.add(G.cyl, SKY_VC, x, 82, z, 40, 4, 40, 0, 0, 0, hdr('#ffd27a', 1.8));
        },
        (b) => {   // Crown Sydney: three petals twisting up from Barangaroo
          const [x, z] = polar(13, 680), H = 255;
          for (let k = 0; k < 14; k++) for (let p = 0; p < 3; p++) {
            const t = k / 14, a = (p / 3) * Math.PI * 2 + t * 0.9, rr = 9 * (1 - 0.3 * t);
            b.add(G.box, SKY_VC, x + Math.cos(a) * rr, -95 + (t + 0.5 / 14) * H, z + Math.sin(a) * rr, 18 * (1 - 0.3 * t), H / 14 + 0.5, 10, 0, -a, 0, k % 2 ? '#2a3050' : hdr('#cfe0ff', 0.8));
          }
          b.sph(SKY_VC, hdr('#ff2a2a', 6), x, H - 92, z, 2.2);
        },
        (b) => {   // the Southern Cross and the Pointers above the city
          for (const [deg, el, r] of [[15.5, 14.0, 2.6], [15.5, 18.6, 2.3], [13.4, 16.6, 2.3], [17.4, 17.1, 2.0], [16.6, 15.3, 1.4], [10.6, 14.8, 2.6], [8.6, 14.1, 2.4]]) {
            const [x, z] = polar(deg, 950);
            b.sph(SKY_VC, hdr('#f4f6ff', 4), x, EYE + 950 * Math.tan((el * Math.PI) / 180), z, r * 0.5);
          }
        },
        (b) => {   // the far shores of the harbour fading into the haze, scattered with lights
          b.addM(new THREE.CylinderGeometry(520, 520, 140, 72, 1, true), SHORE, at(0, -80, 0), '#1a2450');
          for (let k = 0; k < 140; k++) {
            const deg = rand(-70, 70);
            if (Math.abs(deg) < 6) continue;
            const [x, z] = polar(deg, 514);
            b.add(G.box, SKY_VC, x, rand(-34, -13), z, rand(1.2, 3), rand(0.8, 2), 0.5, 0, (-deg * Math.PI) / 180, 0, hdr(pick(['#ffd9a0', '#fff0d0', '#ffcf8a', '#cfe6ff']), rand(1.2, 2.2)));
          }
        },
      ],
    });
    for (const f of fireworks) sky.add(f.obj);
    sky.add(bats.obj);

    // Sydney Trains double-deckers (stainless, yellow doors and cab) parked; light-rail trams come at you
    const trainStyle = {
      body: '#c9ced6', bodyMetal: true, roof: '#a8aeb8', under: '#1a1c20', stripe: '#c9ced6', stripe2: null, doors: true, door: '#f2c230',
      window: '#eaf2ff', windowK: 1.5, frame: '#14171d', light: '#f4f8ff', sign: '#ff9a3c', roofUnit: '#8f96a2',
      rampMat: std({ map: stripeTex('#1e2026', '#ffcc00', 6), roughness: 0.6 }), rampGlow: '#ffd23d',
      extra: (b, c) => {   // the lower deck's windows, and the yellow cab front
        const n = Math.max(1, Math.floor((c.bl - 1.6) / 1.75)), step = (c.bl - 1.2) / n;
        for (const sx of [-1, 1]) {
          const x = sx * (TRAIN_W / 2 + 0.006);
          for (let i = 0; i < n; i++) {
            if (i % 3 === 1) continue;
            const wz = c.zb0 - 0.6 - step * (i + 0.5);
            b.box(VC.solid, '#14171d', x, 1.08, wz, 0.025, 0.62, step * 0.82);
            b.box(VC.glow, hdr('#eaf2ff', 1.3), x + sx * 0.01, 1.08, wz, 0.03, 0.46, step * 0.7);
          }
          b.box(VC.solid, '#2a2d33', x, 1.56, c.zb0 - c.bl / 2, 0.02, 0.08, c.bl - 0.2);
        }
        if (c.front) {
          b.box(VC.solid, '#f2c230', 0, 1.2, c.z0 + 0.025, TRAIN_W - 0.1, 1.5, 0.01);
          for (const sx of [-1, 1]) b.box(VC.solid, '#f2c230', sx * 0.99, 2.42, c.z0 + 0.025, 0.22, 0.95, 0.01);
        }
      },
      movingStyle: { body: '#f2f2f0', bodyMetal: false, roof: '#d8dadc', stripe: '#d8202c', stripe2: '#5a5e66', nose: 'bullet', window: '#d6e6ff', windowK: 1.5,
        doors: true, door: '#d8202c', light: '#ffffff', sign: '#ffd166', extra: null },
    };

    // GIVE WAY gantries to slide under; red-and-yellow lifesaver barriers with a kangaroo sign to jump
    const barrier = barrierStyle({ c1: '#d8202c', c2: '#ffffff', label: 'GIVE WAY', signBg: '#ffffff', signFg: '#d8202c', glow: '#ffcc00', post: '#e8e8ea' });
    barrier.lowBarMat = std({ map: stripeTex('#d8202c', '#ffd23d', 6), roughness: 0.6 });
    const gwTex = canvasTex(128, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const tri = (i) => { g.beginPath(); g.moveTo(6 + i * 1.7, 12 + i); g.lineTo(w - 6 - i * 1.7, 12 + i); g.lineTo(w / 2, h - 8 - i * 2); g.closePath(); };
      g.fillStyle = '#d8202c'; tri(0); g.fill();
      g.fillStyle = '#ffffff'; tri(11); g.fill();
      g.fillStyle = '#141414'; g.font = '900 17px "Russo One", "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('GIVE', w / 2, 42); g.fillText('WAY', w / 2, 60);
    }, { repeat: false });
    const gwMat = std({ map: gwTex, alphaTest: 0.5, roughness: 0.5, emissive: '#ffffff', emissiveMap: gwTex, emissiveIntensity: 0.3 });
    barrier.highExtra = (b) => {
      b.box(VC.metal, '#e8e8ea', 0, 3.0, 0, 0.08, 0.6, 0.08);
      b.add(G.plane, gwMat, 0, 3.6, 0.06, 1.0, 1.0, 1);
      b.add(G.plane, gwMat, 0, 3.6, -0.06, 1.0, 1.0, 1, 0, Math.PI, 0);
    };
    const rooTex = canvasTex(128, 128, (g, w, h) => {   // the yellow kangaroo-crossing diamond
      g.clearRect(0, 0, w, h);
      g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI / 4);
      g.fillStyle = '#141414'; g.fillRect(-44, -44, 88, 88);
      g.fillStyle = '#ffc800'; g.fillRect(-40, -40, 80, 80);
      g.restore();
      g.fillStyle = '#141414';
      const el = (x, y, rx, ry, r) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, Math.PI * 2); g.fill(); };
      el(60, 66, 13, 18, -0.55); el(72, 50, 6, 10, 0.5); el(79, 41, 8, 5.5, -0.25);
      el(75, 33, 2.4, 6, -0.2); el(79, 32, 2.4, 6, 0.1);
      el(58, 82, 11, 9, 0.2); el(66, 92, 15, 3.6, -0.15); el(73, 62, 5, 2, 0.9);
      g.lineCap = 'round'; g.strokeStyle = '#141414'; g.lineWidth = 6;
      g.beginPath(); g.moveTo(50, 80); g.quadraticCurveTo(36, 92, 24, 96); g.stroke();
    }, { repeat: false });
    const rooMat = std({ map: rooTex, alphaTest: 0.5, roughness: 0.5, emissive: '#ffffff', emissiveMap: rooTex, emissiveIntensity: 0.3 });
    barrier.lowExtra = (b) => {
      b.box(VC.metal, '#888888', 0, 1.2, 0, 0.05, 0.3, 0.05);
      b.add(G.plane, rooMat, 0, 1.68, 0.035, 0.8, 0.8, 1);
      b.add(G.plane, rooMat, 0, 1.68, -0.035, 0.8, 0.8, 1, 0, Math.PI, 0);
    };

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: LM.landmarks,
      coinGeo: coinGeometry('southern'), coinMat: coinMaterial('#ffd04a', '#ffa000'),
      update(t) { K.update(t); LM.update(t); for (const f of fireworks) f.update(t); bats.update(t); },
    };
  },
};
