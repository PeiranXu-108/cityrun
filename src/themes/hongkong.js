// Hong Kong on a clear winter night: Mong Kok's canyons of neon over the tong lau, North Point's market street with the tram
// squeezing between its stalls, the Western District's verandah shophouses under the tram wires, Central's towers and
// footbridges, Temple Street's stalls, the public estates and the harbourfront with the Star Ferry and a red-sailed junk. A
// lane of traffic crawls beside the track, the pavements are packed to the shopfronts, side streets open off with crowds
// waiting at their crossings, towers rise behind the rows; bauhinia petals drift down; MTR trains parked, the double-decker
// ding-dings coming at you ringing their bells; and across the water the Bank of China Tower lit white at the far end of
// the track under the Peak's ridge, the Symphony of Lights' lasers sweeping out from the rooftops.
import { THREE, Batcher, VC, G, std, basic, hdr, stripeTex, canvasTex, planeUV, buildingGeo, CHUNK_LEN, TRAIN_W, TRAIN_H, rand, randi, pick, chance } from '../core.js';
import { barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, skyline, skyTex, SKY_VC, polar, at, EDGE, farGround } from './common.js';
import { beam } from './tokyo_kit.js';
import { beacon } from './paris_kit.js';
import { makeKit, HEI, TRAM_ADS, NEON_SHOPS, TRAM_SHOPS, MARKET_SHOPS, LANE_SHOPS, KERB, SIDE_STREETS } from './hongkong_kit.js';
import { bocTower, ifcTower, centralPlaza, theCenter, ckcTower, gridTex, hopewell, iccTower, ridge, ridgeHeight, lasers, rainbowMat } from './hongkong_towers.js';
import { hkLandmarks, buddha } from './hongkong_landmarks.js';

const EYE = 4.5;
// the horizon's Bank of China Tower has its own materials so it can hand over to the real one in Central
const HZ_GLASS = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true, side: THREE.DoubleSide });
const HZ_LINE = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true });
const SKY2 = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide });
// Lantau's peaks and the Big Buddha only rise on the horizon when Ngong Ping comes up
const BUD = new THREE.MeshStandardMaterial({ vertexColors: true, fog: false, transparent: true, roughness: 0.45, metalness: 0.6, emissive: '#6a4814', emissiveIntensity: 0.65 });
const LANTAU = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true });
const fade = (D) => (D > 330 || D < -90 ? 1 : D > 250 ? (D - 250) / 80 : D < -40 ? (-40 - D) / 50 : 0);
// the harbour skyline is dense, but nothing tall stands right in front of the Bank of China Tower
const hkClear = (a, rr) => {
  const deg = (a * 180) / Math.PI;
  if (Math.abs(deg) < 5) return EYE + rr * Math.tan(0.035);
  return Infinity;
};

export default {
  id: 'hk', name: '香港', en: 'HONG KONG', tagline: '霓虹不夜城 · 幻彩咏香江',
  blurb: '冬夜的香港：旺角唐楼伸出一块块霓虹招牌，把街道变成光的峡谷，路边塞满的士、小巴和双层巴士，行人道挤得水泄不通，横街路口站满等过马路的人；北角的街市里，叮叮车贴着鱼档菜档摇铃驶过；西环的骑楼下堆着海味，中环的玻璃大厦之间架着行人天桥。从尖沙咀钟楼和天星码头出发，逛庙街，从汇丰总行底下穿过，坐半山扶梯上山顶看万家灯火，经过金紫荆广场，在跑马地和赛马并肩跑，挤过铜锣湾崇光门口的十字路口，钻进鲗鱼涌「怪兽大厦」的天井，再经彩虹邨一路跑到昂坪的天坛大佛；洋紫荆花瓣飘落，维港对岸的中银大厦亮着白色的斜撑，幻彩咏香江的激光扫过夜空。',
  sights: ['尖沙咀钟楼 · 天星码头', '庙街夜市', '中环 · 汇丰总行', '中环 · 半山扶梯', '太平山顶', '金紫荆广场', '跑马地马场', '铜锣湾 · 崇光', '鲗鱼涌 · 怪兽大厦', '彩虹邨', '天坛大佛'],
  accent: '#ff3d7f', accent2: '#2ff0c8', portal: '#ff3d7f',
  sky: { top: '#04061a', mid: '#1c1a4c', bot: '#8a3a7a', glow: '#ff5aa8', glowK: 0.32, sun: '#fff4e0', sunK: 0.8,
    sunDir: [-0.42, 0.46, -1], sunSize: 0.0009, moon: true, cloud: 0.22, cloudColor: '#4a2a5a', horizon: -0.07, stars: false },
  fog: { color: '#261c44', near: 30, far: 270 },
  light: { hemiSky: '#a8b4e0', hemiGround: '#2a2232', hemi: 0.75, dir: '#ffe2cc', dirK: 0.35, dirPos: [0.3, 0.4, -1] },
  exposure: 1.0, bloom: { strength: 0.95, radius: 0.6, threshold: 0.8 },
  weather: [{ mode: 'fall', count: 240, colors: ['#e0409a', '#f060b0', '#c83a90', '#ff7ac0', '#d02888'], size: 0.4, k: 1.0, box: [46, 18, 90], speed: 0.55, shape: 2 }],
  coin: 'bauhinia', music: 'hk', jingle: 'dingding', horn: 'tramBell',

  build() {
    const K = makeKit();
    const LM = hkLandmarks(K), IDX = Object.fromEntries(LM.landmarks.map((l, i) => [l.key, i]));
    const pave = canvasTex(256, 128, (g, w, h) => {   // square grey pavers, a yellow tactile path along the pavement
      g.fillStyle = '#404046'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { const v = randi(-8, 8); g.fillStyle = `rgb(${92 + v},${92 + v},${98 + v})`; g.fillRect(x + 1, y + 1, 14, 14); }
      g.fillStyle = '#9a8434'; g.fillRect(170, 0, 30, h);
      g.fillStyle = 'rgba(255,236,150,0.3)'; for (let y = 2; y < h; y += 8) for (const x of [173, 182, 191]) g.fillRect(x, y, 6, 3);
    });
    pave.repeat.set(1, 23);
    const track = makeTrack({ gravel: '#26262c', spots: ['#34343c', '#1c1c22', '#44444c'], sleeper: '#3a3634', rail: '#b8bcc4', railMatte: true,
      edge: '#ffcf3a', edgeK: 1.3, sideMat: std({ map: pave, roughness: 0.8 }) });

    // ---------- the street kinds ----------
    // Most streets have a lane of road between the track and the kerb, jammed with traffic for stretches, the pavement beyond it packed
    // to the shopfronts; now and then a side street opens off one side, and towers rise behind the rows further down.
    const gapOf = (j, m = 0) => (j ? [[j.zj - j.W / 2 - m, j.zj + j.W / 2 + m]] : []);
    const backGaps = (j) => gapOf(j, 17);
    const freeZ = (gaps, lo = 4, hi = CHUNK_LEN - 4) => { for (let t = 0; t < 20; t++) { const z = rand(lo, hi); if (!gaps.some(([a, c]) => z > a && z < c)) return z; } return lo; };
    const rowAround = (b, s, j, opts, row = K.row) => {   // a row of buildings, broken where the side street opens
      if (!j) return row(b, s, 0, CHUNK_LEN, opts);
      row(b, s, 0, j.zj - j.W / 2, opts); row(b, s, j.zj + j.W / 2, CHUNK_LEN, opts);
    };
    const roadside = (b, s, j, { rail = 0.75, jam = 0.55, mix, gaps: extra = [] } = {}) => {   // the lane, its kerb and railing, the lamps and bins, the traffic
      const gaps = gapOf(j);
      K.kerbLane(b, s, 0, CHUNK_LEN, { gaps });
      if (chance(rail)) K.rails(b, s, gapOf(j, 0.6), s * (KERB + 0.3));
      for (let z = rand(6, 14); z < CHUNK_LEN - 2; z += rand(22, 28)) if (!gaps.some(([a, c]) => z > a - 1.5 && z < c + 1.5)) K.lamp(b, s * (KERB + 0.35), -z, s);
      for (let k = randi(0, 2); k > 0; k--) K.bin(b, s * (KERB + 0.65), -freeZ(gapOf(j, 1)));
      K.jam(b, s, 0, CHUNK_LEN, { fill: jam, mix, gaps: [...gaps, ...extra] });
    };
    const neonSide = (b, s, j) => {   // Mong Kok: the tong lau and their great signs stacked up the street, shops all along, the pavement thronged, the traffic crawling
      rowAround(b, s, j, { shops: NEON_SHOPS, signs: 2.0, floors: [6, 13], roofSign: 0.3, dense: 0.12, tall: 0.3, upper: 0.55, kiosk: 0.12, reach: 30, vert: 0.55 });
      if (j) K.sideStreet(b, s, j.zj, j.W, { shops: NEON_SHOPS, signs: 1.8 });
      K.backRow(b, s, { gaps: backGaps(j) });
      roadside(b, s, j, { jam: 0.6 });
      const gaps = gapOf(j, 1.2);
      if (chance(0.2)) { const z = freeZ(gaps, 8, 72); K.mtrExit(b, s * (KERB + 1.4), -z, randi(0, 2)); gaps.push([z - 3, z + 3]); }
      if (chance(0.3)) { const z = freeZ(gaps); K.newsstand(b, s * (KERB + 2.5), -z, s); gaps.push([z - 1.5, z + 1.5]); }
      if (chance(0.5)) K.streetSign(b, s * (KERB + 0.5), -freeZ(gaps), pick(SIDE_STREETS));
      if (chance(0.25)) K.postbox(b, s * (KERB + 0.6), -freeZ(gaps));
      for (let k = randi(0, 2); k > 0; k--) K.trolley(b, s * rand(KERB + 0.9, KERB + 2.6), -freeZ(gaps));
      K.throng(b, s * (KERB + 0.45), s * 9.3, 1, CHUNK_LEN - 1, randi(44, 58), { gaps });
    };
    const laneSide = (b, s) => {   // North Point's market street: the trams squeezing between the stalls, the buildings close, the crowd out in the road
      K.row(b, s, 0, CHUNK_LEN, { x0: 8.8, shops: LANE_SHOPS, signs: 1.7, floors: [6, 13], roofSign: 0.12, dense: 0.15, tall: 0.25, ac: 0.4, laundry: 0.14, cage: 0.15, upper: 0.4, kiosk: 0.06 });
      for (let z = rand(1.2, 2.5); z < CHUNK_LEN - 1.4; z += rand(2.5, 3.0)) if (chance(0.88)) K.wetStall(b, s * (EDGE + 1.05), -z, s);
      for (let z = rand(8, 16); z < CHUNK_LEN - 4; z += rand(26, 32)) K.lamp(b, s * (EDGE + 2.4), -z, s);
      K.throng(b, s * (EDGE + 2.35), s * 8.3, 1, CHUNK_LEN - 1, randi(32, 44));
      K.throng(b, s * (EDGE + 0.45), s * (EDGE + 0.6), 1, CHUNK_LEN - 1, randi(5, 9));   // stepping out of the tram's way
      for (let k = randi(1, 2); k > 0; k--) K.trolley(b, s * rand(EDGE + 2.6, 7.6), -rand(4, 76));
      K.backRow(b, s, { x0: 26 });
    };
    const tramSide = (b, s, j) => {   // Sheung Wan and the Western District: verandah shophouses, dried seafood, lorries unloading, the odd taller block
      const zA = chance(0.6) ? rand(30, 56) : CHUNK_LEN;
      const build = (b2, s2, z0, z1) => {   // verandahs up to zA, tong lau after
        if (z0 < zA) K.verandahRow(b2, s2, z0, Math.min(zA, z1));
        if (z1 > zA + 2.5) K.row(b2, s2, Math.max(zA + 0.5, z0), z1, { shops: TRAM_SHOPS, signs: 1.0, floors: [5, 10], roofSign: 0.1, upper: 0.35, kiosk: 0.05 });
      };
      rowAround(b, s, j, null, (b2, s2, z0, z1) => build(b2, s2, z0, z1));
      if (j) K.sideStreet(b, s, j.zj, j.W, { shops: TRAM_SHOPS, signs: 1.0, floors: [5, 10] });
      K.backRow(b, s, { gaps: backGaps(j), x0: 30 });
      const stop = chance(0.5) ? rand(18, 62) : -99, extra = stop > 0 ? [[stop - 7.6, stop + 7.6]] : [];
      if (stop > 0) K.tramStop(b, s * (EDGE + 1.3), -stop, s);
      roadside(b, s, j, { jam: 0.45, mix: { van: 4, truck: 3, taxi: 4, car: 2 }, gaps: extra });
      const gaps = gapOf(j, 1.2);
      if (chance(0.3)) K.streetSign(b, s * (KERB + 0.5), -freeZ(gaps), pick([2, 3, 10]));
      for (let k = randi(1, 3); k > 0; k--) K.trolley(b, s * rand(KERB + 0.9, KERB + 2.6), -freeZ(gaps));
      K.throng(b, s * (KERB + 0.45), s * 11.6, 1, CHUNK_LEN - 1, randi(24, 34), { gaps });
    };
    const centralSide = (b, s) => {   // Central and Admiralty: glass towers on their podiums, banyans and palms, buses at their stops, the office crowd
      K.towerRow(b, s, 0, CHUNK_LEN);
      for (let z = rand(6, 12); z < CHUNK_LEN - 4; z += rand(16, 22)) { if (chance(0.55)) K.banyan(b, s * (EDGE + 5.4), -z, rand(0.7, 0.85)); else K.palm(b, s * (EDGE + 5.4), -z, rand(0.85, 1.0)); b.cyl(VC.solid, '#6a6a70', s * (EDGE + 5.4), 0.3, -z, 1.1, 0.6, 'cyl8'); }
      K.backRow(b, s, { x0: 42, office: 0.85, sign: 0.15 });
      const stop = chance(0.45) ? rand(16, 60) : -99, extra = stop > 0 ? [[stop - 7, stop + 7]] : [];
      if (stop > 0) { K.busStop(b, s * (KERB + 1.6), -stop, s); K.bus(b, s * (EDGE + 0.2 + 1.45), -stop - 1, s); K.queue(b, s * (KERB + 2.6), -stop + 2.2, randi(5, 9), 0.6, { suit: chance(0.5) }); }
      roadside(b, s, null, { rail: 0.5, jam: 0.5, mix: { taxi: 6, car: 4, bus: 2, minibus: 2, van: 1 }, gaps: extra });
      K.throng(b, s * (KERB + 0.45), s * 10.6, 1, CHUNK_LEN - 1, randi(24, 32), { suit: chance(0.5) });
    };
    const marketSide = (b, s) => {   // a night market: stalls along the kerb opening to the street, a dai pai dong, shops behind
      K.row(b, s, 0, CHUNK_LEN, { shops: MARKET_SHOPS, signs: 1.2, floors: [5, 10], roofSign: 0.12, upper: 0.4, kiosk: 0.15 });
      const zd = chance(0.45) ? rand(12, 64) : -99;
      if (zd > 0) K.dpd(b, s * (EDGE + 4.6), -zd, s);
      for (let z = rand(2, 4); z < CHUNK_LEN - 2; z += 2.6) if (Math.abs(z - zd) > 5 && chance(0.85)) K.stall(b, s * (EDGE + 1.9), -z, s);
      for (let z = rand(6, 14); z < CHUNK_LEN - 2; z += rand(28, 34)) K.lamp(b, s * (EDGE + 0.4), -z, s);
      K.backRow(b, s, { x0: 28 });
      K.throng(b, s * (EDGE + 3.4), s * 9.6, 1, CHUNK_LEN - 1, randi(26, 36), { gaps: zd > 0 ? [[zd - 3, zd + 3]] : [] });
      K.crowd(b, s * (EDGE + 0.35), s * (EDGE + 0.8), 2, CHUNK_LEN - 2, randi(6, 10));
    };
    const harbourSide = (b, s) => {   // the harbourfront promenade: royal palms, the water, boats, the far shore's towers
      K.harbour(b, s, 0, CHUNK_LEN);
      K.farShore(b, s);
      for (let z = rand(4, 10); z < CHUNK_LEN - 2; z += rand(14, 19)) K.palm(b, s * (EDGE + 5.6), -z, rand(0.9, 1.1));
      for (let z = rand(10, 16); z < CHUNK_LEN - 4; z += rand(18, 26)) { b.box(VC.solid, '#6a4a30', s * (EDGE + 7.6), 0.45, -z, 0.5, 0.08, 1.8); b.box(VC.metal, '#5a5e64', s * (EDGE + 7.6), 0.22, -z, 0.4, 0.44, 1.6); }
      if (chance(0.6)) K.ferry(b, s * rand(34, 64), -rand(14, 66));
      if (chance(0.45)) K.junk(b, s * rand(50, 92), -rand(8, 72), s);
      for (let k = randi(0, 2); k > 0; k--) K.sampan(b, s * rand(20, 40), -rand(6, 74));
      K.crowd(b, s * (EDGE + 1.0), s * (EDGE + 8.2), 2, CHUNK_LEN - 2, randi(12, 18));
    };
    const estateSide = (b, s, j) => {   // a public housing estate: slab blocks, bauhinias in bloom, minibuses at the terminus
      K.estateRow(b, s, 0, CHUNK_LEN);
      for (let z = rand(5, 10); z < CHUNK_LEN - 3; z += rand(12, 17)) K.bauhinia(b, s * (EDGE + 5.4), -z, rand(0.9, 1.05));
      K.backRow(b, s, { x0: 30, office: 0, sign: 0 });
      roadside(b, s, null, { rail: 0.8, jam: 0.45, mix: { minibus: 6, taxi: 3, car: 2, van: 1 } });
      K.throng(b, s * (KERB + 0.45), s * 10.4, 1, CHUNK_LEN - 1, randi(12, 18));
    };
    const decor = () => {
      const b = new Batcher();
      const r = Math.random(), kind = r < 0.27 ? 'neon' : r < 0.39 ? 'lane' : r < 0.52 ? 'tram' : r < 0.64 ? 'central' : r < 0.76 ? 'market' : r < 0.89 ? 'harbour' : 'estate';
      const wet = pick([-1, 1]), js = pick([-1, 1]), J = chance({ neon: 0.6, tram: 0.35 }[kind] || 0) ? { zj: rand(24, 56), W: rand(10, 12.5) } : null;
      for (const s of [-1, 1]) {
        if (kind === 'harbour' && s === wet) { harbourSide(b, s); continue; }
        farGround(b, s, '#16151c');
        const j = s === js ? J : null;
        if (kind === 'neon') neonSide(b, s, j);
        else if (kind === 'lane') laneSide(b, s);
        else if (kind === 'tram') tramSide(b, s, j);
        else if (kind === 'market') marketSide(b, s);
        else if (kind === 'estate') estateSide(b, s);
        else centralSide(b, s);   // (and the harbour's landward side)
      }
      if (kind === 'tram' || kind === 'lane') K.tramWires(b);
      if (kind === 'central' && chance(0.6)) K.footbridge(b, -rand(18, 62));
      if (kind === 'market') for (const z of [8, 24, 40, 56, 72]) if (chance(0.75)) K.festoon(b, -z, { lanterns: chance(0.45) });
      if (kind === 'lane') for (const z of [12, 36, 60]) if (chance(0.6)) K.festoon(b, -z - rand(-4, 4), { y: 7.4, w: 8.6 });
      const g = K.flushSteam(b.build());
      g.userData.kind = kind;
      if (J && (kind === 'neon' || kind === 'tram')) g.userData.junction = { s: js, zj: J.zj };
      return g;
    };

    // ---------- the horizon: Hong Kong Island across the harbour ----------
    let hz = null;
    const rainbow = rainbowMat(1.8), cpNeon = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
    const ckc = new THREE.MeshBasicMaterial({ map: gridTex(), vertexColors: true, fog: false });
    const tops = [];
    const sky = skyline({
      tex: skyTex({ wall: '#0b0d1c', lit: ['#eaf4ff', '#fff0d8', '#d8f0ff', '#ffe0b0', '#c8ffe8'], chance: 0.42 }),
      colors: ['#ffffff', '#d0d8ff', '#c0cae8', '#b0bcd8'], count: 210, r: [560, 900], h: [40, 170], w: [24, 56], k: 1.5,
      heightCap: hkClear, follow: 190,
      landmarks: [
        (b) => ridge(b, SKY_VC, { r: 1320 }),
        (b, mat) => {   // the Mid-Levels: towers climbing the lower slopes, lights scattered higher up
          for (let k = 0; k < 70; k++) {
            const deg = rand(-62, 62), rr = rand(1150, 1250), base = -100 + ridgeHeight(deg) * rand(0.12, 0.5), [x, z, ry] = polar(deg, rr);
            if (Math.abs(deg) < 4) continue;
            b.addM(buildingGeo(rand(18, 30), rand(40, 100), rand(16, 24), { cols: 8, rows: 16 }, 3.4, 4.2), mat, at(x, base, z, ry), pick(['#ffffff', '#e0e8ff', '#ffe8d0']));
          }
          for (let k = 0; k < 160; k++) {
            const deg = rand(-75, 75), [x, z] = polar(deg, 1290), y = -100 + ridgeHeight(deg) * rand(0.4, 0.85);
            b.add(G.box, SKY_VC, x, y, z, rand(1.5, 4), rand(1, 2.4), 0.5, 0, (-deg * Math.PI) / 180, 0, hdr(pick(['#ffd9a0', '#fff0d0', '#cfe6ff']), rand(1.0, 1.8)));
          }
        },
        (b) => {   // the Peak Tower's lit "wok" up on the ridge, the Peak Tram's lights climbing to it
          const deg = -13, [x, z, ry] = polar(deg, 1300), y = -100 + ridgeHeight(deg) - 8;
          b.add(G.box, SKY_VC, x, y + 10, z, 46, 26, 30, 0, ry, 0, hdr('#c8b8d8', 0.55));
          b.add(G.sph, SKY2, x, y + 30, z, 92, 22, 46, 0, ry, 0, hdr('#ffe8f0', 1.2));
          b.add(G.box, SKY_VC, x, y + 22, z, 70, 3, 40, 0, ry, 0, hdr('#ff6ac8', 1.6));
          for (let t = 0; t < 1; t += 0.04) { const d2 = deg + 6 * t, [px, pz] = polar(d2, 1295 - 120 * t); b.sph(SKY_VC, hdr('#ffd890', 2.2), px, -100 + ridgeHeight(d2) * (0.95 - 0.7 * t), pz, 1.6, true); }
        },
        (b) => { hz = bocTower(b, { glass: HZ_GLASS, line: HZ_LINE, x: 0, y: -95, z: -900, s: 0.95, lw: 2.2 }); },
        (b, mat) => tops.push(ifcTower(b, { mat, solid: SKY_VC, x: polar(-17, 960)[0], y: -95, z: polar(-17, 960)[1], s: 0.9, ry: polar(-17, 960)[2] }).top),
        (b, mat) => tops.push(theCenter(b, { mat, solid: SKY_VC, rainbow, x: polar(-8, 880)[0], y: -95, z: polar(-8, 880)[1], s: 0.82, ry: polar(-8, 880)[2] }).top),
        (b) => tops.push(ckcTower(b, { solid: SKY_VC, grid: ckc, x: polar(7, 860)[0], y: -95, z: polar(7, 860)[1], s: 0.85, ry: polar(7, 860)[2] }).top),
        (b) => tops.push(centralPlaza(b, { solid: SKY_VC, neon: cpNeon, x: polar(19, 960)[0], y: -95, z: polar(19, 960)[1], s: 0.85, ry: polar(19, 960)[2] }).top),
        (b, mat) => tops.push(hopewell(b, { mat, solid: SKY_VC, x: polar(29, 900)[0], y: -95, z: polar(29, 900)[1], s: 0.85 }).top),
        (b, mat) => tops.push(iccTower(b, { mat, solid: SKY_VC, x: polar(-36, 1080)[0], y: -95, z: polar(-36, 1080)[1], s: 0.9, ry: polar(-36, 1080)[2] }).top),
        (b) => {   // Lantau's peaks and the Big Buddha floodlit on his platform, in the Bank of China's place when Ngong Ping is near
          for (const [deg, h, w] of [[-30, 170, 420], [-12, 120, 340], [12, 140, 340], [30, 230, 460]]) { const [x, z] = polar(deg, 1120); b.add(G.sphLow, LANTAU, x, -95, z, w, (h + 95) * 2, w * 0.6, 0, 0, 0, '#10181a'); }
          const [x, z, ry] = polar(0, 1000);
          b.add(G.sphLow, LANTAU, x, -95, z, 300, 310, 220, 0, 0, 0, '#141c1e');   // his peak
          for (const [r, h, y] of [[48, 4, 54], [40, 4, 58]]) b.add(G.cyl, BUD, x, y, z, r * 2, h, r * 2, 0, 0, 0, '#d8d0c0');   // the altar's tiers
          buddha(b, { x, y: 60, z, s: 8, ry: ry - Math.PI / 2, mat: BUD });
        },
        (b) => {   // the waterfront's lights in the haze, the harbour's boats
          for (let k = 0; k < 150; k++) {
            const deg = rand(-80, 80);
            if (Math.abs(deg) < 4) continue;
            const [x, z] = polar(deg, 548);
            b.add(G.box, SKY_VC, x, rand(-30, -6), z, rand(1.2, 3.2), rand(0.8, 2), 0.5, 0, (-deg * Math.PI) / 180, 0, hdr(pick(['#ffd9a0', '#fff0d0', '#ffcf8a', '#cfe6ff', '#ff9ad5', '#9fffe0']), rand(1.2, 2.2)));
          }
        },
      ],
    });
    // A Symphony of Lights: lasers from the rooftops, a searchlight on Two IFC
    const colors = ['#39ff88', '#3dfff0', '#3d6bff', '#ff3df0', '#ffffff', '#b26bff', '#ffe23d'];
    const laser = lasers([hz.top, ...tops].flatMap((p) => [{ p, n: 2, colors, yaw: Math.PI / 2, spread: 1.4 }, { p, n: 2, colors, yaw: -Math.PI / 2, spread: 1.4 }]));
    const search = beacon(700, 22, 0.13, false);
    search.position.set(...tops[0]); search.children.forEach((m) => (m.renderOrder = -4));
    sky.add(laser, search);

    // ---------- the trains ----------
    // MTR trains parked (stainless, the red band, the cab's name plate); double-decker trams come at you
    const mtrTex = canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = '#c8102e'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffffff'; g.font = `900 46px ${HEI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('港鐵 MTR', w / 2, h / 2 + 2);
    }, { repeat: false });
    const mtrMat = basic({ map: mtrTex, color: hdr('#ffffff', 1.2) });
    const tram = (b, c) => {   // a ding-ding: two decks of windows over its advert, the destination blind, the bow collector folded on the roof
      const ad = randi(0, TRAM_ADS.length - 1), zc = c.zb0 - c.bl / 2, n = 6, step = (c.bl - 1.0) / n;
      for (const sx of [-1, 1]) {
        const x = sx * (TRAIN_W / 2 + 0.008);
        b.add(planeUV(K.tramAdRects[ad]), K.tramAdMat, x, 1.75, zc, c.bl - 0.3, 2.5, 1, 0, (sx * Math.PI) / 2, 0);
        for (let i = 0; i < n; i++) {
          const wz = c.zb0 - 0.5 - step * (i + 0.5);
          for (const [y, h] of [[1.45, 0.78], [2.62, 0.66]]) {
            b.box(VC.solid, '#141414', x + sx * 0.006, y, wz, 0.02, h + 0.08, step * 0.86);
            b.box(VC.glow, hdr('#ffe8c0', 0.95), x + sx * 0.016, y, wz, 0.02, h, step * 0.78);
          }
        }
      }
      if (c.front) {
        b.box(VC.glow, hdr('#ffe8c0', 0.45), 0, 1.45, c.z0 + 0.03, TRAIN_W - 0.5, 0.78, 0.02);
        b.add(planeUV(K.destRects[randi(0, K.destRects.length - 1)]), K.destMat, 0, 3.0, c.z0 + 0.04, 1.5, 0.28, 1);
      }
      for (const e of [-1, 1]) beam(b, VC.metal, e * 0.35, TRAIN_H, zc + 0.8, 0, TRAIN_H + 0.42, zc - 0.4, 0.05, '#2a2a30');
      b.box(VC.metal, '#2a2a30', 0, TRAIN_H + 0.44, zc - 0.4, 1.0, 0.05, 0.08);
    };
    const trainStyle = {
      body: '#cfd4da', bodyMetal: true, roof: '#aab0b8', under: '#18191d', stripe: '#c8102e', stripe2: '#1a1a1e', doors: true, door: '#dfe2e6',
      window: '#eaf4ff', windowK: 1.5, frame: '#16181e', light: '#f4f8ff', sign: '#ff9a3c', roofUnit: '#8f96a2',
      rampMat: std({ map: stripeTex('#1e2026', '#ffcc00', 6), roughness: 0.6 }), rampGlow: '#ffcf3a',
      extra: (b, c) => {   // the cab end: its red skirt and the name plate
        if (!c.front) return;
        b.box(VC.solid, '#c8102e', 0, 0.62, c.z0 + 0.03, TRAIN_W - 0.1, 0.42, 0.02);
        b.add(G.plane, mtrMat, 0, 1.6, c.z0 + 0.045, 0.9, 0.34, 1);
      },
      movingStyle: { body: '#1e5a3a', bodyMetal: false, roof: '#e8e0c8', under: '#141416', stripe: '#1e5a3a', stripe2: null, frame: '#1e5a3a',
        windows: false, doors: false, gangway: false, roofUnits: false, strobe: false, light: '#fff4d6', sign: '#ffd86a', window: '#ffe8c0', windowK: 1.0,
        extra: tram },
    };

    // ---------- the obstacles ----------
    // bamboo scaffold gateways to slide under, "mind your head"; red-and-white roadworks barriers to jump
    const headTex = canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = '#f6f4ee'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d8202a'; g.lineWidth = 8; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = '#d8202a'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `900 40px ${HEI}`; g.fillText('小心碰頭', w / 2, 38);
      g.font = `700 17px ${HEI}`; g.fillStyle = '#141414'; g.fillText('MIND YOUR HEAD', w / 2, 72);
    }, { repeat: false });
    const bambooBar = canvasTex(128, 16, (g, w, h) => {   // a bamboo pole: its culm and the nodes
      g.fillStyle = '#c8a868'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,240,200,0.4)'; g.fillRect(0, 3, w, 3);
      g.fillStyle = '#8a6a34'; for (let x = 10; x < w; x += 32) g.fillRect(x, 0, 3, h);
    });
    const barrier = barrierStyle({ c1: '#c8a868', c2: '#8a6a3a', label: '', signBg: '#f6f4ee', signFg: '#d8202a', glow: '#ffcf3a', post: '#c8a868' });
    barrier.signMat = std({ map: headTex, roughness: 0.5, emissive: '#ffffff', emissiveMap: headTex, emissiveIntensity: 0.3 });
    barrier.barMat = std({ map: bambooBar, roughness: 0.7 });
    barrier.highExtra = (b) => {
      for (const sx of [-1, 1]) {
        b.cyl(VC.solid, '#c8a868', sx * 1.42, 1.85, 0.12, 0.05, 3.7, 'cyl6');
        beam(b, VC.solid, sx * 1.42, 0.2, -0.12, sx * 0.4, 3.5, -0.12, 0.08, '#b89858');
        for (const y of [1.62, 2.8, 3.55]) b.box(VC.solid, '#141414', sx * 1.18, y, 0, 0.16, 0.14, 0.2);
      }
      b.add(G.box, barrier.barMat, 0, 3.55, 0, 3.0, 0.1, 0.1);
      b.add(G.plane, K.netMat, 0, 3.15, 0.07, 2.8, 0.75, 1);
    };
    barrier.lowBarMat = std({ map: stripeTex('#d8202a', '#f4f4f0', 6), roughness: 0.6 });
    const worksTex = canvasTex(128, 128, (g, w, h) => {   // the roadworks triangle: a man digging, the plate under it
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#d8202a'; g.beginPath(); g.moveTo(w / 2, 4); g.lineTo(w - 6, 92); g.lineTo(6, 92); g.closePath(); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(w / 2, 20); g.lineTo(w - 20, 84); g.lineTo(20, 84); g.closePath(); g.fill();
      g.fillStyle = '#141414'; g.beginPath(); g.arc(58, 44, 5, 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = '#141414'; g.lineCap = 'round';
      g.beginPath(); g.moveTo(58, 50); g.lineTo(62, 66); g.lineTo(54, 78); g.moveTo(62, 66); g.lineTo(70, 78); g.moveTo(60, 56); g.lineTo(76, 62); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.moveTo(76, 56); g.lineTo(80, 78); g.stroke(); g.fillRect(70, 76, 18, 4);
      g.fillStyle = '#ffffff'; g.fillRect(14, 96, w - 28, 28); g.strokeStyle = '#141414'; g.lineWidth = 2; g.strokeRect(14, 96, w - 28, 28);
      g.fillStyle = '#141414'; g.font = `900 19px ${HEI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('前面修路', w / 2, 111);
    }, { repeat: false });
    const worksMat = std({ map: worksTex, alphaTest: 0.5, roughness: 0.5, emissive: '#ffffff', emissiveMap: worksTex, emissiveIntensity: 0.3 });
    barrier.lowExtra = (b) => {
      b.box(VC.metal, '#888888', 0, 1.2, 0, 0.05, 0.3, 0.05);
      b.add(G.plane, worksMat, 0, 1.68, 0.035, 0.8, 0.8, 1);
      b.add(G.plane, worksMat, 0, 1.68, -0.035, 0.8, 0.8, 1, 0, Math.PI, 0);
    };

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: LM.landmarks,
      coinGeo: coinGeometry('bauhinia'), coinMat: coinMaterial('#ffd04a', '#ffa000'),
      update(t) {
        K.update(t);
        // how near a landmark is: 1 from 210 m before it until 80 m into it, easing in and out either side
        const near = (key) => { const l = LM.landmarks[IDX[key]], ch = l && l.obj && l.obj.parent; return ch && ch.parent ? 1 - fade(sky.position.z - ch.position.z + 40) : 0; };
        // the horizon's Bank of China Tower gives way to the real one as Central comes up, and comes back once it is passed
        const kN = near('ngongPing');   // Ngong Ping: Lantau and the Buddha rise in its place
        const kH = Math.min(1 - near('central'), 1 - kN);
        HZ_GLASS.opacity = HZ_LINE.opacity = kH; HZ_GLASS.visible = HZ_LINE.visible = kH > 0.01;
        BUD.opacity = LANTAU.opacity = kN; BUD.visible = LANTAU.visible = kN > 0.01;
        const yP = -80 * near('peak');   // up on the Peak the whole city sinks below the lookout
        if (sky.userData.y !== yP) { sky.userData.y = yP; for (const m of sky.children) m.position.y = yP; }
        laser.userData.update(t, 1 - kN);
        search.rotation.y = t * 0.4;
        rainbow.uniforms.time.value = t;
        cpNeon.color.setHSL(((Math.floor(t / 15) % 5) * 0.2 + 0.02) % 1, 0.9, 0.6).multiplyScalar(1.8);   // Central Plaza's quarter-hour colours
        const hv = LM.landmarks[IDX.valley]?.obj, chV = hv && hv.parent;   // where the runner is against the racecourse, so the field can come round alongside
        LM.update(t, 1 - kH, { valley: chV && chV.parent ? sky.position.z - chV.position.z : null });
      },
    };
  },
};
