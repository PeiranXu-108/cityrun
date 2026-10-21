// Lijiang at dusk: the Naxi old town's timber-and-plaster houses with lattice windows and red lanterns, canals with
// slab bridges and river lanterns, the bar street under strings of lanterns, earthen Baisha-style lanes hung with corn,
// and lakes fringed with willows; Green Giant trains parked, a mock-steam tourist train coming at you, sky lanterns
// rising, and the Jade Dragon Snow Mountain glowing gold at the far end of the track.
import { THREE, Batcher, VC, G, std, basic, hdr, stripeTex, canvasTex, buildingGeo, CHUNK_LEN, TRAIN_W, rand, randi, pick, chance } from '../core.js';
import { barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, skyline, skyTex, SKY_VC, polar, at, EDGE, farGround, waterMat, textTex } from './common.js';
import { roofGeo } from './beijing_kit.js';
import { makeKit, cobbleTex, CN } from './lijiang_kit.js';
import { ljLandmarks } from './lijiang_landmarks.js';
import { snowMountain, mountainMist } from './lijiang_mountain.js';
import { finishFlowerScene } from './lijiang_flowers.js';

const EYE = 4.5;

// a ring of low blue foothills, dipping in front of the snow mountain, villages twinkling at their feet
function foothills(b) {
  const N = 360, pos = [], cols = [], idx = [], lo = new THREE.Color('#141830'), hi = new THREE.Color('#353c6a');
  for (let i = 0; i <= N; i++) {
    const deg = -180 + (360 * i) / N, a = (deg * Math.PI) / 180, r = 700 + 40 * Math.sin(deg * 0.11);
    let h = 30 + 16 * Math.sin(deg * 0.07 + 1) + 10 * Math.sin(deg * 0.23) + 5 * Math.sin(deg * 0.9);
    if (Math.abs(deg) < 44) h *= 0.3 + 0.7 * Math.min(1, (Math.abs(deg) / 44) ** 2);
    for (const [y, c] of [[-70, lo], [h, hi]]) { pos.push(Math.sin(a) * r, y, -Math.cos(a) * r); cols.push(c.r, c.g, c.b); }
  }
  for (let i = 0; i < N; i++) { const p = i * 2; idx.push(p, p + 2, p + 1, p + 1, p + 2, p + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.setIndex(idx); g.computeVertexNormals();
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  b.addM(g, SKY_VC, new THREE.Matrix4(), null);
  for (let k = 0; k < 160; k++) {
    const deg = rand(-180, 180);
    if (Math.abs(deg) < 8) continue;
    const [x, z] = polar(deg, 690);
    b.add(G.box, SKY_VC, x, rand(-8, 6), z, rand(0.8, 2.2), rand(0.6, 1.4), 0.4, 0, (-deg * Math.PI) / 180, 0, hdr(pick(['#ffc870', '#ffd9a0', '#ff9a50', '#fff0d0']), rand(1.2, 2.2)));
  }
}

export default {
  id: 'lj', name: '丽江', en: 'LIJIANG', tagline: '日照金山 · 纳西古城',
  blurb: '黄昏的丽江，玉龙雪山的十三座雪峰还亮着最后一抹金光。纳西古城的木楼挂满红灯笼，五花石路边的水渠里漂着许愿河灯，酒吧街灯笼串成河。从古城口转动的大水车出发，经过四方街的篝火打跳、木府的「天雨流芳」牌坊、狮子山上的万古楼和黑龙潭的五孔桥，穿过挂满玉米串的白沙古镇，一路跑进雪山脚下碧蓝的蓝月谷；孔明灯一盏盏升上夜空，北斗七星和月亮挂在雪山之上。',
  sights: ['丽江古城 · 大水车', '四方街', '木府', '万古楼', '黑龙潭', '白沙古镇', '玉龙雪山 · 蓝月谷'],
  accent: '#1fc8e0', accent2: '#ffc04a', portal: '#1fc8e0',
  sky: { top: '#0a1338', mid: '#24407e', bot: '#c88a80', glow: '#ffa870', glowK: 0.4, sun: '#fff4e0', sunK: 0.8,
    sunDir: [0.42, 0.34, -1], sunSize: 0.0012, moon: true, cloud: 0.16, cloudColor: '#7a6a9a', horizon: -0.07, stars: true },
  fog: { color: '#3a4674', near: 30, far: 270 },
  light: { hemiSky: '#b8c8ff', hemiGround: '#4a3a34', hemi: 0.95, dir: '#ffcf9a', dirK: 0.7, dirPos: [-0.8, 0.35, -0.5] },
  exposure: 1.0, bloom: { strength: 0.8, radius: 0.55, threshold: 0.84 },
  weather: [
    { mode: 'rise', count: 60, colors: ['#ffb050', '#ffc46a', '#ff9a3a'], size: 1.6, k: 1.5, box: [70, 30, 120], speed: 0.32, shape: 6 },
    { mode: 'fall', count: 240, colors: ['#ffffff', '#fff4e4'], size: 0.12, k: 1.1, box: [44, 14, 90], speed: 0.22, shape: 0 },
  ],
  coin: 'qixing', music: 'lj', jingle: 'fengling',

  build() {
    const K = makeKit();
    const LM = ljLandmarks(K);
    const cob = cobbleTex(); cob.repeat.set(2, 24);
    const track = makeTrack({ gravel: '#3a342e', spots: ['#4a423a', '#2a2420', '#5a5248'], sleeper: '#5a4030', rail: '#c0c4cc', railMatte: true,
      edge: '#ffb84a', edgeK: 1.5, sideMat: std({ map: cob, roughness: 0.6 }) });
    const lake = waterMat('#16384a', 6);
    lake.metalness = 0.6; lake.roughness = 0.22; lake.envMapIntensity = 0.55; lake.normalScale.set(0.3, 0.3);
    const reflMats = new Map();
    const refl = (b, x, z, len, w, col, y) => {
      let m = reflMats.get(col);
      if (!m) reflMats.set(col, (m = basic({ color: hdr(col, 0.3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
      const dx = -x, dz = 40, d = Math.hypot(dx, dz), L = Math.min(len, ((Math.abs(x) - 12) * d) / Math.abs(dx));
      if (L > 2) b.add(G.plane, m, x + ((dx / d) * L) / 2, y, z + ((dz / d) * L) / 2, w, L, 1, -Math.PI / 2, Math.atan2(-dx, -dz), 0);
    };
    const marble = std({ color: '#e8e6e0', roughness: 0.5, emissive: '#fff0dc', emissiveIntensity: 0.1 });

    // a lakeshore like Lashi Hai: willows, a white balustrade, a pavilion out on the water, lit houses on the far shore
    const lakeSide = (b, s) => {
      b.add(G.plane, lake, s * 81, -0.4, -40, 140, 80, 1, -Math.PI / 2, 0, 0);
      b.box(VC.solid, '#2e2c26', s * 141, -1.4, -40, 60, 2.2, 80);   // the far shore the houses stand on
      for (let z = 2; z < 80; z += 4) { b.box(VC.solid, '#e8e6e0', s * 11.3, 0.5, -z, 0.25, 1.0, 0.25); b.add(G.box, marble, s * 11.3, 0.95, -z - 2, 0.14, 0.12, 4); }
      for (let z = rand(3, 7); z < CHUNK_LEN - 2; z += rand(7, 10)) K.willow(b, s * (EDGE + 6.2), -z, rand(0.95, 1.12), { ry: s > 0 ? Math.PI : 0 });
      if (chance(0.6)) { const z = -rand(20, 60), x = s * rand(26, 40); b.box(VC.solid, '#8a8478', x, -0.1, z, 7, 0.6, 7); K.tower(b, x, 0.2, z, { w: 5, tiers: 1, tierH: 3.0, open: true }); refl(b, x, z, 60, 4, '#ffc870', -0.35); }
      for (let k = randi(2, 4); k > 0; k--) {   // little wooden boats with a lantern
        const x = s * rand(16, 60), z = -rand(8, 72);
        b.add(G.sph, VC.solid, x, -0.35, z, 1.4, 0.5, 4.2, 0, rand(-0.4, 0.4), 0, '#3a2414');
        K.lantern(b, x, 0.9, z, 0.5); refl(b, x, z, 30, 1.2, '#ff7a3a', -0.35);
      }
      for (let k = randi(4, 6); k > 0; k--) {
        const x = s * rand(115, 160), z = -rand(8, 72);
        b.addM(buildingGeo(rand(8, 12), 6.6, rand(8, 12), K.house, 2.4, 6.6), K.houseMat, at(x, -0.4, z), '#ffffff');
        refl(b, x - s * 5, z, 70, 2.2, pick(['#ffc870', '#ff8a4a', '#ffe0a8']), -0.35);
      }
      K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 5.4), 2, CHUNK_LEN - 2, randi(4, 8));
    };
    // the old town's lanes: lanterns on the kerb, a caravan or a flower-cake cart, visitors and Naxi women in their capes
    const oldStreet = (b, s, kind) => {
      for (let z = rand(4, 8); z < CHUNK_LEN - 8; z += 10) { b.cyl(VC.solid, '#3a2414', s * (EDGE + 0.7), 1.6, -z, 0.08, 3.2, 'cyl8'); K.lantern(b, s * (EDGE + 0.7), 3.1, -z, 0.7); }
      if (kind !== 'bar' && chance(0.3)) K.caravan(b, s * (EDGE + 2.6), -rand(16, 64), randi(3, 5), pick([-1, 1]));
      if (chance(0.4)) K.shopGoods(b, s * (EDGE + 4.5), -rand(10, 70), s, 3);
      if (kind === 'bar' && chance(0.6)) K.singer(b, s * (EDGE + 4.2), -rand(10, 70), s);
      K.crowd(b, s * (EDGE + 1.2), s * (EDGE + (kind === 'canal' ? 3 : 6.2)), 2, CHUNK_LEN - 2, randi(5, 10));
    };
    // Baisha-style village lanes: caravans and tethered horses, a yak, cosmos along the walls
    const villageStreet = (b, s) => {
      if (chance(0.5)) K.caravan(b, s * (EDGE + 2.6), -rand(16, 64), randi(3, 5), pick([-1, 1]));
      if (chance(0.35)) K.yak(b, s * (EDGE + 3.4), -rand(10, 70));
      if (chance(0.5)) K.horse(b, s * (EDGE + 5.6), -rand(8, 72), s * Math.PI / 2, { pack: false });
      for (let z = rand(6, 12); z < CHUNK_LEN - 8; z += 16) { b.cyl(VC.solid, '#3a2414', s * (EDGE + 0.7), 1.6, -z, 0.08, 3.2, 'cyl8'); K.lantern(b, s * (EDGE + 0.7), 3.1, -z, 0.65); }
      K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 6), 2, CHUNK_LEN - 2, randi(2, 5));
    };

    const decor = () => {
      const b = new Batcher();
      const r = Math.random(), kind = r < 0.3 ? 'old' : r < 0.54 ? 'canal' : r < 0.68 ? 'bar' : r < 0.86 ? 'village' : 'lake';
      const wet = pick([-1, 1]), lakeVillage = chance(0.5);
      for (const side of [-1, 1]) {
        farGround(b, side, '#1e1c1c');
        if (kind === 'lake' && side === wet) { lakeSide(b, side); continue; }
        if (kind === 'village' || (kind === 'lake' && lakeVillage)) { K.villageRow(b, side, 0, CHUNK_LEN); villageStreet(b, side); continue; }
        const canal = (kind === 'canal' && side === wet) || (kind === 'bar' && side === wet && chance(0.6));
        if (canal) { K.canal(b, side); for (let z = rand(4, 8); z < CHUNK_LEN - 4; z += rand(9, 12)) K.willow(b, side * (EDGE + 3.6), -z, rand(0.9, 1.05), { ry: side > 0 ? Math.PI : 0 }); }
        K.oldRow(b, side, 0, CHUNK_LEN, { bar: kind === 'bar' });
        oldStreet(b, side, canal ? 'canal' : kind);
      }
      if (kind === 'bar') for (const z of [12, 32, 52, 72]) K.lanternSpan(b, -z);
      else if (kind === 'old' && chance(0.4)) for (const z of [20, 56]) K.lanternSpan(b, -z);
      return finishFlowerScene(b, kind);
    };

    const sky = skyline({
      tex: skyTex({ wall: '#0b0d1e', lit: ['#ffd9a0'], chance: 0.3 }), colors: ['#ffffff'], count: 0, follow: 190,
      landmarks: [
        snowMountain,
        foothills,
        (b) => {   // the Big Dipper over the mountain: the seven stars of the Naxi cape (披星戴月)
          for (const [deg, el, r] of [[10, 12.6, 1.6], [11.2, 15.6, 1.5], [14.6, 15.0, 1.3], [13.8, 12.0, 1.4], [17.6, 15.8, 1.5], [20.6, 16.6, 1.5], [23.6, 15.4, 1.6]]) {
            const [x, z] = polar(deg, 1300);
            b.sph(SKY_VC, hdr('#f4f6ff', 4), x, EYE + 1300 * Math.tan((el * Math.PI) / 180), z, r * 0.8, true);
          }
        },
      ],
    });
    const mist = mountainMist();
    sky.add(mist.group);

    // CR200J "Green Giant" trains parked; the old town's mock-steam tourist train comes at you
    const trainStyle = {
      body: '#1f7a4a', bodyMetal: false, roof: '#c8ccc8', under: '#1a1c20', stripe: '#f2f2ea', stripe2: '#f2c230', doors: true, door: '#185c38',
      window: '#eaf6ff', windowK: 1.5, frame: '#101814', light: '#f4f8ff', sign: '#ff9a3c', roofUnit: '#9aa0a0',
      rampMat: std({ map: stripeTex('#1e2026', '#ffcc00', 6), roughness: 0.6 }), rampGlow: '#ffb84a',
      extra: (b, c) => {   // the white waist band, a green cab with its white stripe
        for (const sx of [-1, 1]) b.box(VC.solid, '#f2f2ea', sx * (TRAIN_W / 2 + 0.008), 2.7, c.zb0 - c.bl / 2, 0.02, 0.12, c.bl - 0.2);
        if (c.front) { b.box(VC.solid, '#1f7a4a', 0, 1.2, c.z0 + 0.025, TRAIN_W - 0.1, 1.5, 0.01); b.box(VC.solid, '#f2f2ea', 0, 1.15, c.z0 + 0.032, TRAIN_W - 0.1, 0.22, 0.01); }
      },
      movingStyle: { body: '#b8302a', bodyMetal: false, roof: '#f2ece0', under: '#2a1a14', stripe: '#e8b84a', stripe2: '#e8b84a', frame: '#5a1a12',
        windows: false, doors: false, roofUnits: false, gangway: false, strobe: false, light: '#fff4d6', sign: '#ffd23d', window: '#ffe0b0', windowK: 1.0,
        extra: (b, c) => {   // open carriages lit inside, a striped canopy; a mock steam engine at the head
          for (const sx of [-1, 1]) {
            const x = sx * (TRAIN_W / 2 + 0.006);
            b.box(VC.glow, hdr('#ffd8a0', 0.75), x, 2.1, c.zb0 - c.bl / 2, 0.02, 0.9, c.bl - 0.8);
            for (let k = 0; k <= 5; k++) b.box(VC.solid, '#e8b84a', x + sx * 0.01, 2.1, c.zb0 - 0.4 - ((c.bl - 0.8) * k) / 5, 0.04, 1.0, 0.1);
          }
          for (let k = 0; k < 6; k++) b.box(VC.solid, k % 2 ? '#c8202a' : '#f2ece0', 0, 3.33, c.zb0 - (c.bl * (k + 0.5)) / 6, TRAIN_W - 0.2, 0.04, c.bl / 6);
          if (c.front) {
            b.add(G.cyl, VC.solid, 0, 1.75, c.z0 - 1.2, 1.7, 2.4, 1.7, Math.PI / 2, 0, 0, '#1a1a1e');
            for (const dz of [-0.15, -1.0, -2.0]) b.add(G.cyl, VC.metal, 0, 1.75, c.z0 + dz, 1.76, 0.08, 1.76, Math.PI / 2, 0, 0, '#e8b84a');
            b.cyl(VC.solid, '#1a1a1e', 0, 3.3, c.z0 - 1.0, 0.3, 1.3, 'cyl8');
            b.add(G.cone8, VC.solid, 0, 4.1, c.z0 - 1.0, 0.9, 0.5, 0.9, Math.PI, 0, 0, '#1a1a1e');
            b.add(G.cyl, VC.glow, 0, 1.75, c.z0 + 0.02, 0.62, 0.05, 0.62, Math.PI / 2, 0, 0, hdr('#fff4d6', 4));
            b.add(G.box, VC.solid, 0, 0.42, c.z0 - 0.25, TRAIN_W - 0.2, 0.5, 0.5, 0.6, 0, 0, '#c8202a');
          }
        } },
    };

    // timber gantries with a little tiled roof and lanterns (小心碰头) to slide under; caravan-road rails to jump
    const barrier = barrierStyle({ c1: '#8a2a1a', c2: '#e8c070', label: '小心碰头', signBg: '#5a1a12', signFg: '#ffd890', glow: '#ff6a3a', post: '#5a3a24' });
    const { roof: gantryRoof } = roofGeo(2.9, 0.7, 0.42, { hip: false, lift: 0.4, eave: 0.25 });
    barrier.highExtra = (b) => {
      b.addM(gantryRoof, K.tileMat, new THREE.Matrix4().makeTranslation(0, 2.78, 0), 0xffffff);
      b.box(VC.solid, '#25272d', 0, 3.25, 0, 3.6, 0.1, 0.12);
      for (const x of [-1.2, 1.2]) K.lantern(b, x, 1.45, 0.25, 0.42);
      K.windChime(b, 0, 2.7, 0.2);
    };
    barrier.lowBarMat = std({ map: stripeTex('#4a2a18', '#8a6038', 6), roughness: 0.7 });
    const roadTex = textTex('茶马古道', { w: 384, h: 128, color: '#f2cf72', bg: '#2a1610', font: CN, weight: 700, size: 0.6, border: '#c8a050' });
    const roadMat = std({ map: roadTex, roughness: 0.6, emissive: '#ffffff', emissiveMap: roadTex, emissiveIntensity: 0.4 });
    barrier.lowExtra = (b) => {
      b.box(VC.metal, '#5a3a24', 0, 1.15, 0, 0.06, 0.3, 0.06);
      b.add(G.plane, roadMat, 0, 1.55, 0.035, 1.0, 0.33, 1);
      b.add(G.plane, roadMat, 0, 1.55, -0.035, 1.0, 0.33, 1, 0, Math.PI, 0);
    };

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: LM.landmarks,
      coinGeo: coinGeometry('qixing'), coinMat: coinMaterial('#ffd04a', '#ffa000'),
      update(t) { K.update(t); LM.update(t); mist.update(t); lake.userData.scroll.offset.y = -t * 0.01; },
    };
  },
};
