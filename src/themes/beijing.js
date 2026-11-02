// Beijing: a golden-autumn night under the Mid-Autumn moon. Hutong courtyards with persimmons over their grey walls,
// old shopping streets with plaques and lanterns, red palace walls under golden ginkgo, Chang'an Avenue lamps,
// archways and ring-road overpasses; Beijing subway trains parked, green-skin trains coming at you, and the Great Wall
// lit along the Yanshan ridges at the far end of the track.
import { THREE, Batcher, VC, G, std, hdr, stripeTex, canvasTex, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, skyline, skyTex, SKY_VC, polar, at, EDGE, farGround, textTex } from './common.js';
import { makeKit, GLYPHS as KIT_GLYPHS, CN_SIGN, roofGeo } from './beijing_kit.js';
import { bjLandmarks } from './beijing_landmarks.js';
import { bjSights, SIGHT_GLYPHS } from './beijing_sights.js';

export const GLYPHS = [...new Set(KIT_GLYPHS + SIGHT_GLYPHS)].join('');

// the landmark scenes in the order the run meets them: round the centre, out to the Summer Palace in the north-west,
// back by the Olympic Green and the north-east, the CBD, Wangfujing, and south to the Temple of Heaven
const ROUTE = ['qianmen', 'dahuitang', 'tiananmen', 'jiaolou', 'shichahai', 'yiheyuan', 'yuanmingyuan', 'olympic', 'yonghegong', 'art798', 'cbd', 'wangfujing', 'tiantan'];

// ---------- the Yanshan ridges and the Great Wall, centred on the far end of the track ----------
const gauss = (a, c, w, h) => h * Math.exp(-(((a - c) / w) ** 2));
// elevation (degrees above the runner's eye) of each ridge line at an azimuth (degrees, 0 = straight ahead)
const WALL_RIDGE = (a) => 0.6 + gauss(a, 0, 5.5, 7.2) + gauss(a, -11, 4.5, 3.8) + gauss(a, 12, 5, 4.6) + gauss(a, -23, 6, 3.2)
  + gauss(a, 25, 6.5, 2.9) + gauss(a, -36, 8, 2) + gauss(a, 38, 8, 1.8) + 0.35 * Math.sin(a * 0.9) + 0.2 * Math.sin(a * 2.3 + 1);
const FAR_RIDGE = (a) => 1.6 + gauss(a, -6, 7, 4.4) + gauss(a, 8, 6, 5.4) + gauss(a, -19, 7, 4.0) + gauss(a, 20, 8, 4.2)
  + gauss(a, -32, 9, 3) + gauss(a, 33, 9, 3.2) + 0.4 * Math.sin(a * 1.3 + 2);
const HILLS = (a) => 0.35 + gauss(a, -5, 4, 1.3) + gauss(a, 6, 5, 1.0) + gauss(a, -15, 6, 1.5) + gauss(a, 16, 6, 1.3)
  + gauss(a, -27, 7, 1.1) + gauss(a, 28, 7, 1.2) + 0.15 * Math.sin(a * 3.1);
const EYE = 4.5, WALL_R = 1050;
const ridgeY = (R, deg) => EYE + R * Math.tan((deg * Math.PI) / 180);
const dir = (deg) => { const a = (deg * Math.PI) / 180; return [Math.sin(a), -Math.cos(a)]; };

// layered mountain silhouette (ink-wash style): dark crest fading into the moonlit mist of the valleys
function ridgeCurtain(b, R, fn, cols, a0 = -52, a1 = 52, step = 0.5) {
  const C = cols.map((c) => new THREE.Color(c)), pos = [], col = [];
  const rows = (a) => { const y = ridgeY(R, fn(a)); return [y, y - 30, y - 95, -240]; };
  for (let a = a0; a < a1; a += step) {
    const [x0, z0] = dir(a), [x1, z1] = dir(a + step), ra = rows(a), rb = rows(a + step);
    for (let k = 0; k < 3; k++) {
      const p = [[x0 * R, ra[k], z0 * R, k], [x1 * R, rb[k], z1 * R, k], [x1 * R, rb[k + 1], z1 * R, k + 1], [x0 * R, ra[k + 1], z0 * R, k + 1]];
      for (const i of [0, 2, 1, 0, 3, 2]) { pos.push(p[i][0], p[i][1], p[i][2]); const c = C[p[i][3]]; col.push(c.r, c.g, c.b); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  b.addM(g, SKY_VC, new THREE.Matrix4(), null);
}

// the Great Wall riding the crest, floodlit warm, a bright line of lamps along its top, watchtowers on the high points
function greatWall(b) {
  const R = WALL_R - 4, pos = [], col = [];
  const body = [new THREE.Color('#4a3830'), new THREE.Color('#e0aa70')], lamp = hdr('#ffcf7a', 1.0);
  const push = (p, c) => { pos.push(...p); col.push(c.r, c.g, c.b); };
  const step = 0.25;
  for (let a = -44; a < 44; a += step) {
    const [x0, z0] = dir(a), [x1, z1] = dir(a + step), y0 = ridgeY(WALL_R, WALL_RIDGE(a)), y1 = ridgeY(WALL_R, WALL_RIDGE(a + step));
    for (const [lo, hi, cl, ch] of [[-3, 9, body[0], body[1]], [9, 10.4, lamp, lamp]]) {
      const P = [[x0 * R, y0 + lo, z0 * R], [x1 * R, y1 + lo, z1 * R], [x1 * R, y1 + hi, z1 * R], [x0 * R, y0 + hi, z0 * R]];
      const Cc = [cl, cl, ch, ch];
      for (const i of [0, 1, 2, 0, 2, 3]) push(P[i], Cc[i]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  b.addM(g, SKY_VC, new THREE.Matrix4(), null);
  // watchtowers (敌楼) at the local high points and every few degrees in between
  let last = -99;
  for (let a = -42; a <= 42; a += 0.5) {
    const e = WALL_RIDGE(a), peak = e >= WALL_RIDGE(a - 0.5) && e >= WALL_RIDGE(a + 0.5);
    if (!peak && a - last < 4.5) continue;
    last = a;
    const [x, z] = dir(a), y = ridgeY(WALL_R, e), big = Math.abs(a) < 1;
    const w = big ? 26 : 17, h = big ? 22 : 16;
    b.add(G.box, SKY_VC, x * R, y + h / 2, z * R, w, h, 10, 0, (-a * Math.PI) / 180, 0, '#a87c52');
    b.add(G.box, SKY_VC, x * (R - 5.2), y + h * 0.55, z * (R - 5.2), w * 0.55, h * 0.18, 0.4, 0, (-a * Math.PI) / 180, 0, hdr('#ffd28a', 1.6));
    if (big) b.add(G.cone4, SKY_VC, x * R, y + h + 6, z * R, w * 1.15, 12, 14, 0, (-a * Math.PI) / 180, 0, '#3a2a28');
  }
}

// skyline buildings stay under the wall in front of the mountains, and leave the sky clear behind Longevity Hill
const wallClear = (a, rr) => {
  const deg = (a * 180) / Math.PI;
  if (deg > -52 && deg < -20) return 18;
  return Math.abs(deg) < 36 ? EYE + rr * Math.tan(((WALL_RIDGE(deg) - 0.9) * Math.PI) / 180) : Infinity;
};

// ---------- Longevity Hill across Kunming Lake ----------
// The dark wooded hill, the Long Corridor's lamps along its foot, the Paiyun halls climbing its axis and the Tower of
// Buddhist Incense floodlit gold on its great stone terrace. Modelled facing +z (toward the runner); it stands on the
// skyline only while the Summer Palace is near (beijing update fades its material in and out).
const HILL = { A: 84, H: 82, D: 66, Y0: -32 };
const hillY = (x, z) => HILL.Y0 + HILL.H * Math.sqrt(Math.max(0, 1 - (x / HILL.A) ** 2 - (z / HILL.D) ** 2));
function longevityHill(mat) {
  const b = new Batcher(), I = new THREE.Matrix4();
  const g = new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position;
  const col = new Float32Array(p.count * 3), c = new THREE.Color(), lo = new THREE.Color('#10182a'), hi = new THREE.Color('#283452');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), bump = 1 + 0.05 * Math.sin(x * 9 + z * 5) + 0.035 * Math.sin(x * 23 - z * 17);
    p.setXYZ(i, x * HILL.A, HILL.Y0 + y * HILL.H * bump, z * HILL.D);
    c.copy(lo).lerp(hi, y * y).multiplyScalar(0.9 + 0.2 * Math.random());
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  b.addM(g, mat, I, null);
  const box = (x, y, z, w, h, d, color) => b.add(G.box, mat, x, y + h / 2, z, w, h, d, 0, 0, 0, color);
  const face = (x, y, z, w, h, color) => b.add(G.plane, mat, x, y + h / 2, z, w, h, 1, 0, 0, 0, color);
  const roof = (y, z, w, d, h, color) => b.addM(roofGeo(w, d, h, { lift: 0.55, eave: 1.0 }).roof, mat, new THREE.Matrix4().makeTranslation(0, y, z), color);
  const gold = hdr('#e8b848', 0.95), lit = hdr('#ffb256', 1.1), stone = hdr('#9a7254', 0.62), wall = hdr('#b8442a', 0.75);
  // the great terrace, its stair up the middle, and the tower on it: three storeys under four tiers of eaves
  const TZ = 44;
  box(0, 18, TZ, 30, 22, 16, hdr('#3e3028', 0.8));
  face(0, 18, TZ + 8.05, 30, 22, hdr('#6a5040', 0.55));
  face(0, 18, TZ + 8.1, 4, 22, hdr('#d89868', 0.62));
  for (let k = 0; k < 4; k++) face(-10.5 + k * 7, 30, TZ + 8.12, 1.4, 2.2, hdr('#ffc070', 1.1));
  box(0, 40, TZ + 7.6, 30, 1.0, 0.8, hdr('#a88a68', 0.8));
  const oct = (r, h, y, color) => b.add(G.cyl8, mat, 0, y + h / 2, TZ, r * 2, h, r * 2, 0, 0, 0, color);
  const skirt = (r0, r1, h, y) => {
    b.addM(new THREE.LatheGeometry([new THREE.Vector2(r0 + 0.8, 0.5), new THREE.Vector2(r0, 0), new THREE.Vector2(r0 - (r0 - r1) * 0.55, h * 0.4), new THREE.Vector2(r1, h)], 8), mat, new THREE.Matrix4().makeTranslation(0, y, TZ), gold);
    b.add(G.cyl8, mat, 0, y + 0.1, TZ, (r0 + 0.8) * 2, 0.5, (r0 + 0.8) * 2, 0, 0, 0, hdr('#3a8a5a', 0.9));
  };
  oct(13, 2, 41.2, stone);
  oct(9.5, 8, 43.2, lit); skirt(13.5, 9.0, 3.0, 51.2);
  oct(8.4, 2.4, 53.6, wall); skirt(12.0, 7.8, 2.6, 55.8);
  oct(7.2, 5.6, 58.2, lit); skirt(10.2, 6.2, 2.4, 63.6);
  oct(5.6, 4.6, 65.8, lit); skirt(8.6, 0.3, 7.6, 70.2);
  b.add(G.sph, mat, 0, 78.4, TZ, 1.8, 2.2, 1.8, 0, 0, 0, hdr('#ffd870', 1.8));
  // Hall of Virtuous Light, Hall of Dispelling Clouds, Paiyun Gate, the archway on the shore
  for (const [z, w, d, h, y] of [[54, 16, 8, 6, 15], [59, 22, 10, 7.5, 5.5], [63.5, 18, 5, 5, 0]]) {
    if (y > 0) { box(0, -2, z, w + 6, y + 2, d + 4, hdr('#6a5040', 0.6)); face(0, 0, z + d / 2 + 2.05, w + 6, y, stone); }
    box(0, y, z, w, h, d, wall);
    face(0, y + 0.6, z + d / 2 + 0.05, w - 1.4, h * 0.65, lit);
    roof(y + h, z, w + 1, d + 1, h * 0.55, gold);
  }
  for (const x of [-5, -1.8, 1.8, 5]) box(x, 0, 67, 0.7, 7, 0.7, wall);
  box(0, 6.5, 67, 12, 1.2, 1.0, hdr('#3a7a8a', 0.9));
  roof(7.7, 67, 12, 1.6, 1.6, gold);
  // the Long Corridor along the shore: lamplight between its columns, a red lantern every bay
  box(0, 0, 64.5, 150, 3.4, 3.2, hdr('#2a2228', 1));
  face(0, 0.5, 66.15, 150, 2.2, hdr('#ffb060', 1.05));
  box(0, 3.4, 64.5, 152, 0.7, 4.4, hdr('#2c3a38', 1));
  for (let x = -72; x <= 72; x += 6) box(x, 2.3, 66.4, 0.5, 0.6, 0.5, hdr('#ff3a24', 2.2));
  // the Sea of Wisdom on the crown, glazed green and gold, barely lit
  box(0, hillY(0, 8) - 2, 8, 14, 9, 8, hdr('#4a6a5a', 0.7));
  roof(hillY(0, 8) + 7, 8, 15, 9, 3.4, hdr('#8a7a3a', 0.8));
  return b.build();
}

export default {
  id: 'bj', name: '北京', en: 'BEIJING', tagline: '金秋月夜 · 千年古都',
  blurb: '中秋满月下的北京：胡同里柿子挂满枝头，红墙下银杏金黄，长安街华灯初上。从前门五牌楼出发，经过人民大会堂和湖中的国家大剧院、天安门、故宫角楼，到什刹海的银锭桥和酒吧灯影；再去颐和园，十七孔桥倒映在昆明湖里，对岸佛香阁一片金黄；然后是月光下的圆明园大水法、鸟巢水立方、香火缭绕的雍和宫、798 艺术区、CBD 的中国尊、王府井的东堂，最后到天坛；跑道尽头，长城在燕山山脊上亮起灯火。',
  sights: ['前门大街', '人民大会堂 · 国家大剧院', '天安门', '故宫角楼', '什刹海 · 银锭桥', '颐和园 · 十七孔桥', '圆明园 · 大水法', '鸟巢 · 水立方', '雍和宫', '798 艺术区', 'CBD · 中国尊', '王府井 · 东堂', '天坛祈年殿'],
  accent: '#e8382f', accent2: '#ffd166', portal: '#ffb020',
  sky: { top: '#040a22', mid: '#172c64', bot: '#c87a48', glow: '#ff9a4a', glowK: 0.38, sun: '#ffc860', sunK: 0.8,
    sunDir: [-0.13, 0.21, -1], sunSize: 0.0011, moon: true, cloud: 0.22, cloudColor: '#3a4a7a', horizon: -0.07, stars: true },
  fog: { color: '#1c2650', near: 24, far: 240 },
  light: { hemiSky: '#a8b8ff', hemiGround: '#3a2a1a', hemi: 0.85, dir: '#ffe0b0', dirK: 0.6, dirPos: [-0.13, 0.3, -1] },
  exposure: 0.95, bloom: { strength: 0.85, radius: 0.55, threshold: 0.82 },
  weather: [{ mode: 'fall', count: 640, colors: ['#ffcf3a', '#ffdb5c', '#f5bd2a', '#ffe98a'], size: 0.44, k: 1.05, box: [46, 20, 90], speed: 0.7, shape: 3 }],
  coin: 'ingot', music: 'bj', jingle: 'jingju',

  build() {
    const K = makeKit();
    const pave = canvasTex(128, 128, (g, w, h) => {   // grey stone slabs beside the track
      g.fillStyle = '#5a5a5e'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32) for (let x = ((y / 32) % 2) * 32; x < w + 64; x += 64) {
        const v = randi(-8, 8); g.fillStyle = `rgb(${84 + v},${84 + v},${90 + v})`; g.fillRect(x - 31, y + 1, 62, 30);
      }
    });
    pave.repeat.set(2, 24);
    const track = makeTrack({ gravel: '#2a2a30', spots: ['#383840', '#1d1d22', '#4a4a52'], sleeper: '#4a4038', rail: '#c9ced8', railMatte: true,
      edge: '#ffcf5a', edgeK: 1.6, sideMat: std({ map: pave, roughness: 0.85 }) });

    // regular blocks: hutong courtyards, old shopping streets, modern avenues, or a red palace wall on one side
    const decor = () => {
      const b = new Batcher();
      const r = Math.random(), kind = r < 0.36 ? 'hutong' : r < 0.6 ? 'shops' : r < 0.86 ? 'avenue' : 'palace';
      const zo = kind !== 'hutong' && chance(0.24) ? rand(24, 56) : 0;          // ring-road overpass
      const zp = !zo && kind !== 'avenue' && chance(0.32) ? rand(16, 64) : 0;    // archway over the street
      const near = (z, c, rr) => c && Math.abs(z - c) < rr;
      const wallSide = pick([-1, 1]);
      for (const side of [-1, 1]) {
        farGround(b, side, '#16171d');
        const sk = kind === 'palace' ? (side === wallSide ? 'palace' : pick(['hutong', 'avenue'])) : kind;
        const segs = zo ? [[0, zo - 9], [zo + 9, CHUNK_LEN]] : [[0, CHUNK_LEN]];
        for (const [z0, z1] of segs) {
          if (z1 - z0 < 4) continue;
          if (sk === 'hutong') { K.hutong(b, side, z0, z1); if (chance(0.5)) K.modernRow(b, side, z0, z1, 36); }
          else if (sk === 'shops') K.shops(b, side, z0, z1);
          else if (sk === 'avenue') K.modernRow(b, side, z0, z1);
          else K.redWall(b, side, z0, z1);
        }
        b.box(VC.solid, sk === 'hutong' ? '#34353a' : '#2c2d33', side * (EDGE + 3.0), 0.03, -CHUNK_LEN / 2, 5.6, 0.02, CHUNK_LEN);
        for (let z = rand(3, 9); z < CHUNK_LEN; z += sk === 'avenue' || sk === 'palace' ? 16 : 14) {
          if (near(z, zo, 9) || near(z, zp, 2.5)) continue;
          if (sk === 'avenue') K.huadeng(b, side * (EDGE + 1.6), -z, 0.95);
          else K.gongdeng(b, side * (EDGE + 1.2), -z, side);
        }
        if (sk === 'avenue' || sk === 'palace' || (sk === 'shops' && chance(0.3))) {
          for (let z = rand(3, 8); z < CHUNK_LEN - 2; z += rand(8.5, 10.5)) {
            if (near(z, zo, 10) || near(z, zp, 3)) continue;
            K.ginkgo(b, side * (EDGE + 3.4), -z, rand(0.9, 1.08));
          }
        }
        if (sk === 'shops' && !zo) K.lanternRun(b, side * (EDGE + 4.6), 6.0, 0, CHUNK_LEN);
        K.crowd(b, side * (EDGE + 1.0), side * (EDGE + 5.4), 2, CHUNK_LEN - 2, sk === 'avenue' ? randi(5, 10) : randi(4, 9));
        if (sk !== 'avenue' && chance(0.35)) K.rickshaw(b, side * (EDGE + 4.6), -rand(8, 72));
        if (chance(0.25)) K.tanghulu(b, side * (EDGE + 4.2), -rand(6, 74));
        if (sk === 'hutong' && chance(0.45)) K.elder(b, side * (EDGE + 4.8), -rand(6, 74), side);
        if (sk === 'hutong' && chance(0.3)) K.chess(b, side * (EDGE + 4.4), -rand(8, 72));
        if (sk === 'avenue' && chance(0.6)) K.sharedBikes(b, side * (EDGE + 5.2), -rand(6, 60), randi(4, 9), side);
      }
      if (zo) K.overpass(b, -zo);
      else if (zp) K.pailou(b, -zp);
      return b.build();
    };

    const LM = bjLandmarks(K), SG = bjSights(K);
    const byKey = Object.fromEntries([...LM.landmarks, ...SG.landmarks].map((l) => [l.key, l]));

    const sky = skyline({
      tex: skyTex({ wall: '#0b0d1e', lit: ['#fff1d6', '#d6ecff', '#ffd9a8', '#ffe2b0'], chance: 0.32 }),
      colors: ['#ffffff', '#c7d2ff', '#b0b9e6', '#9aa4d9'], count: 150, h: [40, 180], k: 1.6,
      gapAhead: 0.21, heightCap: wallClear, follow: 190,
      landmarks: [
        (b) => {   // far ridges, the wall's ridge and the foothills, back to front
          ridgeCurtain(b, 1300, FAR_RIDGE, ['#2c3866', '#34406e', '#46528a', '#4c5890']);
          ridgeCurtain(b, WALL_R, WALL_RIDGE, ['#1a2248', '#1e2750', '#34406e', '#3c4876']);
          ridgeCurtain(b, 820, HILLS, ['#121834', '#151c3c', '#222c56', '#1c2650']);
          greatWall(b);
        },
        (b) => {   // Central Radio & TV Tower in the west
          const [x, z] = polar(-19, 720);
          b.addM(new THREE.CylinderGeometry(5, 13, 260, 12, 1).translate(0, 130 - 95, 0), SKY_VC, at(x, 0, z), '#8a92aa');
          b.add(G.cyl, SKY_VC, x, 112, z, 34, 22, 34, 0, 0, 0, '#3a4060');
          for (const y of [104, 118]) b.add(G.cyl, SKY_VC, x, y, z, 35, 2, 35, 0, 0, 0, hdr('#cfe6ff', 2.0));
          b.add(G.cyl, SKY_VC, x, 190, z, 2.4, 70, 2.4, 0, 0, 0, hdr('#e8ecff', 1.4));
          b.sph(SKY_VC, hdr('#ff2a2a', 6), x, 226, z, 2.4);
        },
        (b) => {   // CITIC Tower (中国尊) and China World Tower in the CBD
          const [x, z, ry] = polar(25, 680);
          b.add(G.box, SKY_VC, x, 35, z, 34, 260, 34, 0, ry, 0, '#1e2442');
          b.add(G.box, SKY_VC, x, 168, z, 40, 6, 40, 0, ry, 0, hdr('#d6ecff', 1.6));
          for (const y of [-40, 0, 40, 80, 120]) b.add(G.box, SKY_VC, x, y, z, 34.6, 1.2, 34.6, 0, ry, 0, hdr('#bfe3ff', 1.1));
          b.sph(SKY_VC, hdr('#ff2a2a', 6), x, 170, z, 2.2);
          const [x2, z2, r2] = polar(30, 650);
          b.add(G.box, SKY_VC, x2, 15, z2, 26, 220, 26, 0, r2, 0, '#232a48');
          b.add(G.box, SKY_VC, x2, 128, z2, 18, 6, 18, 0, r2, 0, hdr('#ffe9c4', 1.6));
        },
        (b) => {   // CCTV Headquarters' loop on the skyline
          const [x, z, ry] = polar(19.5, 640), c = Math.cos(ry), s = Math.sin(ry);
          for (const o of [-14, 14]) b.add(G.box, SKY_VC, x + c * o, 20, z - s * o, 16, 230, 16, 0, ry, o > 0 ? 0.08 : -0.08, '#262c46');
          b.add(G.box, SKY_VC, x, 128, z, 46, 22, 16, 0, ry, 0, '#262c46');
          b.add(G.box, SKY_VC, x, 117, z, 46.4, 0.8, 16.4, 0, ry, 0, hdr('#cfe6ff', 1.4));
        },
        (b) => {   // Wangjing SOHO's three rounded towers with their light seams
          for (const [deg, r, h] of [[39, 700, 200], [42, 720, 170], [44.5, 690, 140]]) {
            const [x, z] = polar(deg, r);
            b.add(G.sph, SKY_VC, x, -95 + h / 2, z, 34, h * 1.1, 24, 0, 0, 0, '#2a3050');
            for (const k of [0.3, 0.55, 0.8]) b.add(G.tor, SKY_VC, x, -95 + h * k, z, 30 * (1 - Math.abs(k - 0.5)), 30 * (1 - Math.abs(k - 0.5)), 1.4, Math.PI / 2, 0, 0, hdr('#bfe8ff', 1.5));
          }
        },
      ],
    });
    // Longevity Hill rises across Kunming Lake, left of the street's end, while the Summer Palace is near
    const hillMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const hill = longevityHill(hillMat);
    { const [x, z, ry] = polar(-36, 380); hill.position.set(x, 0, z); hill.rotation.y = ry; }
    hill.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.renderOrder = -4; } });
    hill.visible = false;
    sky.add(hill);
    const summer = byKey.yiheyuan;
    let hillK = 0;

    // Beijing subway trains (white with the red stripe) parked; old green-skin passenger trains come at you
    const trainStyle = {
      body: '#dfe3e9', bodyMetal: true, roof: '#b9bec8', under: '#1a1c20', stripe: '#d7262e', stripe2: '#1f3a8a', doors: true, door: '#cfd3da',
      window: '#eaf2ff', windowK: 1.5, frame: '#14171d', light: '#f4f8ff', sign: '#ff6a3d', roofUnit: '#8f96a2',
      rampMat: std({ map: stripeTex('#1e2026', '#ffcc00', 6), roughness: 0.6 }), rampGlow: '#ffd23d',
      movingStyle: { body: '#1e5c3e', bodyMetal: false, roof: '#4a5058', stripe: '#e8c547', stripe2: '#e8c547', window: '#ffe2a8', windowK: 1.3,
        door: '#1a4a32', light: '#fff4d0', sign: '#ffd166', badge: '#d7262e', roofUnit: '#3a3f45' },
    };

    // height-limit gantries (限高) to slide under, road-works barriers (施工) to jump
    const barrier = barrierStyle({ c1: '#ffcc00', c2: '#141414', label: '限高', signBg: '#ffcc00', signFg: '#141414', glow: '#ff3355', post: '#e8e8ea' });
    const limitTex = canvasTex(128, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(w / 2, h / 2, 62, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#d7262e'; g.lineWidth = 14; g.beginPath(); g.arc(w / 2, h / 2, 54, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#141414'; g.font = '900 38px "Russo One", "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('2.2m', w / 2, h / 2 + 3);
    }, { repeat: false });
    const limitMat = std({ map: limitTex, transparent: true, roughness: 0.5, emissive: '#ffffff', emissiveMap: limitTex, emissiveIntensity: 0.3 });
    barrier.highExtra = (b) => {
      b.box(VC.metal, '#e8e8ea', 0, 3.0, 0, 0.08, 0.6, 0.08);
      b.add(G.plane, limitMat, 0, 3.45, 0.06, 0.8, 0.8, 1);
      b.add(G.plane, limitMat, 0, 3.45, -0.06, 0.8, 0.8, 1, 0, Math.PI, 0);
    };
    const sgTex = textTex('施工', { w: 256, h: 128, color: '#ffffff', bg: '#d7262e', border: '#ffffff', font: CN_SIGN, weight: 400, size: 0.6 });
    const sgMat = std({ map: sgTex, roughness: 0.6, emissive: '#ffffff', emissiveMap: sgTex, emissiveIntensity: 0.3 });
    barrier.lowExtra = (b) => {
      b.add(G.box, sgMat, 0, 1.45, 0, 0.9, 0.45, 0.05);
      b.box(VC.metal, '#888888', 0, 1.15, 0, 0.05, 0.2, 0.05);
    };

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: ROUTE.map((k) => byKey[k]),
      coinGeo: coinGeometry('ingot'), coinMat: coinMaterial('#ffd04a', '#ffa000'),
      update(t) {
        K.update(t); LM.update(t); SG.update(t);
        // fade Longevity Hill in as the Summer Palace comes up, out again once its lake is behind
        const ch = summer.obj && summer.obj.parent, D = ch && ch.parent ? sky.position.z - ch.position.z : 1e9;
        const k = D > 250 ? 0 : D > 170 ? (250 - D) / 80 : D > -60 ? 1 : D > -100 ? (D + 100) / 40 : 0;
        if (k !== hillK) { hillK = k; hillMat.opacity = k; hill.visible = k > 0.005; }
      },
    };
  },
};
