// Dubai at the blue hour of a winter evening: the sun gone down into the Gulf on the left, its afterglow still lying
// sand-gold along the water under a deepening indigo sky, the whole city lit gold. Sheikh Zayed Road's canyon of towers
// with the traffic streaming beside the track and the Metro on its viaduct; Downtown's arabesque boulevard and its cafés
// under palms wrapped in lights; the water canal; Deira's crowded streets of boards, cafeterias and taxis; the souks under
// their wooden shades; Al Fahidi's wind towers; the creek with its abras and dhows; the Marina's yachts and towers; the
// beach and Jumeirah's villas; the dunes past the edge of town. The Metro's trains wait on the line, the tram comes at you
// sounding its horn; flecks of gold sand drift in the air. Burj Khalifa stands at the far end of the track.
import { THREE, Batcher, VC, G, std, basic, hdr, stripeTex, canvasTex, CHUNK_LEN, TRAIN_W, TRAIN_H, rand, randi, pick, chance } from '../core.js';
import { barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, skyline, skyTex, SKY_VC, polar, at, EDGE, farGround } from './common.js';
import { beam } from './tokyo_kit.js';
import { makeKit, KERB, X0, KUFI, SANS, MARINA_SIGNS, BLVD_SIGNS } from './dubai_kit.js';
import { addBuildings, WY } from './dubai_build.js';

const BLURB = '冬日傍晚的蓝调时刻：太阳刚沉进左边的海湾，沙金色的余晖还铺在水面上，天顶渐渐变成靛蓝，整座城市亮起金色的灯。谢赫扎耶德路两侧是玻璃高楼的峡谷，车流在轨道旁流淌，高架上的地铁站像一枚金色的贝壳；市中心大道两旁是阿拉伯风格的拱廊和咖啡馆，海枣树的树干缠满暖光灯串；德拉老城的双语招牌层层叠叠，卡拉克奶茶和沙威玛的香味混在出租车的车流里；香料和黄金市场在木格栅的遮棚下灯火通明，法希迪的风塔、迪拜河上往返的阿布拉、码头里的游艇和朱美拉的海滩一路排开，再往外就是起伏的红色沙丘。从迪拜相框出发，经过未来博物馆，在哈利法塔下看迪拜喷泉起舞，穿过歌剧院和运河瀑布，沿海岸经过朱美拉清真寺、阿拉伯塔、卓美亚古城、棕榈岛和亚特兰蒂斯、码头的旋转塔和迪拜之眼，到沙漠营地看坦努拉舞，再回到法希迪老城、迪拜河、香料市场和黄金市场；空中飘着金色的细沙，跑道尽头始终是哈利法塔。';
const SIGHTS = ['迪拜相框', '未来博物馆 · 阿联酋塔', '哈利法塔 · 迪拜喷泉', '迪拜歌剧院', '迪拜水运河 · 瀑布桥', '朱美拉清真寺', '阿拉伯塔 · 朱美拉海滩', '卓美亚古城', '棕榈岛 · 亚特兰蒂斯', '迪拜码头 · 旋转塔', '迪拜之眼 · JBR', '红沙漠营地', '阿尔法希迪历史街区', '迪拜河 · 阿布拉渡口', '香料市场', '黄金市场'];

// The loop: sixteen landmarks, each heading four chunks (world.js LANDMARK_EVERY), from the Dubai Frame (the menu's
// backdrop: Burj Khalifa framed in it on the horizon) south through Downtown to the canal, along the coast to the Marina,
// out to the desert, and back through the old town to the Frame. Everything that depends on where a landmark falls is
// counted from it (kOf).
export const ROUTE = ['frame', 'future', 'fountain', 'opera', 'canal', 'jumeirahMosque', 'burjAlArab', 'madinat', 'palm', 'marina', 'ainDubai', 'desert', 'fahidi', 'creek', 'spiceSouk', 'goldSouk'];
export const LOOP = ROUTE.length * 4;
export const kOf = (key) => ROUTE.indexOf(key) * 4;
// the streets either side of the landmarks that want their own (named zones, built for them alone)
const FORCED = { [kOf('burjAlArab') - 1]: 'beach', [kOf('burjAlArab') + 1]: 'beach', [kOf('marina') - 1]: 'marina', [kOf('marina') + 1]: 'marina', [kOf('creek') - 1]: 'creek', [kOf('creek') + 1]: 'creek' };
const ZONES = Array.from({ length: LOOP }, (_, k) => FORCED[k] || (k < kOf('jumeirahMosque') ? 'down' : k < kOf('desert') - 2 ? 'coast' : k < kOf('fahidi') ? 'desert' : 'old'));
// the streets each part of town runs to
const KINDS = {
  down: [['szr', 0.5], ['boulevard', 0.35], ['canal', 0.15]],
  coast: [['beach', 0.35], ['marina', 0.35], ['villa', 0.3]],
  old: [['deira', 0.35], ['souk', 0.3], ['heritage', 0.2], ['creek', 0.15]],
  desert: [['dunes', 1]], beach: [['beach', 1]], marina: [['marina', 1]], creek: [['creek', 1]],
};

export default {
  id: 'dubai', name: '迪拜', en: 'DUBAI', tagline: '沙海明珠 · 金色不夜城',
  blurb: BLURB, sights: SIGHTS,
  accent: '#ffc23d', accent2: '#2fd8e0', portal: '#ffc23d',
  sky: { top: '#0a0e2e', mid: '#2c2f6c', bot: '#e8a070', glow: '#ffb070', glowK: 0.55, sun: '#ffd8a0', sunK: 0.3, sunDir: [-0.78, -0.05, -1], sunSize: 0.004,
    cloud: 0.1, cloudColor: '#c88a8a', horizon: -0.06, stars: false, follow: true },
  fog: { color: '#3a3052', near: 40, far: 300 },
  light: { hemiSky: '#9aa8e0', hemiGround: '#6a4a3a', hemi: 0.85, dir: '#ffc890', dirK: 0.45, dirPos: [-0.8, 0.15, -0.6] },
  exposure: 1.0, bloom: { strength: 0.85, radius: 0.55, threshold: 0.82 },
  weather: [{ mode: 'float', count: 150, colors: ['#ffd27a', '#ffe6a8', '#ffc860', '#fff0c8'], size: 0.12, k: 1.6, box: [50, 16, 90], speed: 0.4, shape: 0 }],
  coin: 'dirham', music: 'dubai', jingle: 'majlis', horn: 'tramHorn',

  build() {
    const K = makeKit();
    addBuildings(K);
    const track = makeTrack({ gravel: '#3a3632', spots: ['#46423c', '#2e2a26', '#524c44'], sleeper: '#4a4038', rail: '#c8ccd4', edge: '#ffc23d', edgeK: 0.9, sideMat: K.sideMat });

    // ---------- the street kinds ----------
    const clear = (gaps, z, r = 0) => !gaps.some(([a, c]) => z > a - r && z < c + r);
    const lane = (s) => s * (EDGE + (KERB - EDGE) / 2);   // the middle of the lane by the track
    const dirOf = (s) => (s > 0 ? 1 : -1);                  // the traffic keeps right: away on the right, toward you on the left
    const lamps = (b, s, x, opts = {}, gaps = [], step = [24, 30]) => { for (let z = rand(6, 14); z < CHUNK_LEN - 2; z += rand(...step)) if (clear(gaps, z, 1.5)) K.lamp(b, x, -z, s, opts); };
    const bits = (b, s, gaps = []) => {   // the pavement's furniture: a bin, a parking machine, a hydrant, a street plate, a flag
      const free = () => { for (let t = 0; t < 12; t++) { const z = rand(4, 76); if (clear(gaps, z, 1.6)) { gaps.push([z - 1, z + 1]); return z; } } return null; };
      let z;
      if (chance(0.6) && (z = free())) K.bin(b, s * (KERB + 0.6), -z);
      if (chance(0.4) && (z = free())) K.meter(b, s * (KERB + 0.5), -z, s);
      if (chance(0.3) && (z = free())) K.hydrant(b, s * (KERB + 0.5), -z);
      if (chance(0.45) && (z = free())) K.streetPlate(b, s * (KERB + 0.4), -z, s);
      if (chance(0.25) && (z = free())) K.flagPole(b, s * (KERB + 0.8), -z);
    };
    const S = {
      // Sheikh Zayed Road: the highway on one side under its gantries, the Metro's viaduct on the other, towers both sides
      szr(b) {
        const hw = pick([-1, 1]);
        for (const s of [-1, 1]) {
          farGround(b, s, '#2a2622');
          if (s === hw) {
            const xe = K.highway(b, s, 0, CHUNK_LEN, { lanes: 4 });
            K.pave(b, s * (xe + 4), -CHUNK_LEN / 2, 8, CHUNK_LEN);
            K.towerRow(b, s, 0, CHUNK_LEN, { x0: xe + 7 });
            const r = Math.random();
            if (r < 0.35) K.gantry(b, s * (EDGE + 1.2), s * (xe - 0.4), -rand(15, 65));
            else if (r < 0.6) K.salik(b, s * (EDGE + 1.2), s * (xe - 0.4), -rand(15, 65));
            if (chance(0.65)) K.billboard(b, s * (xe + 5.5), -rand(10, 70), s, { y: rand(12, 16) });
            lamps(b, s, s * (EDGE + 0.45), {}, [], [30, 36]);
          } else {
            K.kerbLane(b, s, 0, CHUNK_LEN, { x1: 24 });
            K.jam(b, lane(s), 0, CHUNK_LEN, dirOf(s), { fill: 0.45 });
            K.viaduct(b, s * 16, 0, CHUNK_LEN);
            if (chance(0.35)) K.station(b, s * 16, -CHUNK_LEN / 2, s); else if (chance(0.45)) K.metroTrain(b, s * 16, rand(0, 20), rand(50, 80));
            K.towerRow(b, s, 0, CHUNK_LEN, { x0: 24 });
            const palms = K.palmRow(b, s * (KERB + 1.0), 0, CHUNK_LEN, { step: [12, 16], lit: chance(0.5) });
            lamps(b, s, s * (KERB + 0.4), {}, palms.map((p) => [p - 1, p + 1]));
            if (chance(0.5)) K.busShelter(b, s * (KERB + 2.4), -rand(12, 68), s);
            K.throng(b, s * (KERB + 1.6), s * 21, 1, CHUNK_LEN - 1, randi(10, 18), { mix: K.MIX.street });
            bits(b, s, palms.map((p) => [p - 1, p + 1]));
          }
          K.backRow(b, s, { x0: 75 });
        }
        if (chance(0.35)) K.skywalk(b, -rand(20, 60));
      },
      // Downtown's boulevard: the arabesque low-rise and its arcades of cafés, palms wrapped in lights, the cars to be seen in
      boulevard(b) {
        for (const s of [-1, 1]) {
          farGround(b, s, '#2a2622');
          K.kerbLane(b, s, 0, CHUNK_LEN, { x1: X0 + 2.6 });
          K.jam(b, lane(s), 0, CHUNK_LEN, dirOf(s), { fill: 0.45, mix: { lux: 3, super: 3, suv: 4, gwagon: 2, taxi: 3, police: 0.6, sedan: 2 } });
          const palms = K.palmRow(b, s * (KERB + 1.2), 0, CHUNK_LEN, { step: [9, 12], lit: true });
          for (const z of palms) b.block(VC.solid, '#d8ccb4', s * (KERB + 1.2), 0, -z, 1.6, 0.35, 1.6);   // their planters
          K.arabesqueRow(b, s, 0, CHUNK_LEN);
          K.backRow(b, s, { x0: 38 });
          lamps(b, s, s * (KERB + 0.4), { kind: 'lantern' }, palms.map((p) => [p - 1.2, p + 1.2]), [14, 18]);
          K.throng(b, s * (KERB + 2.2), s * (X0 - 2.4), 1, CHUNK_LEN - 1, randi(14, 22), { mix: K.MIX.blvd });
          if (chance(0.35)) K.busShelter(b, s * (KERB + 2.6), -rand(12, 68), s);
          if (chance(0.25)) K.dallah(b, s * (X0 - 3.2), -rand(20, 60), 0.8);
          bits(b, s, palms.map((p) => [p - 1, p + 1]));
        }
      },
      // the water canal: its promenade and joggers, the water taxis, Business Bay's towers across the water
      canal(b) {
        const ws = pick([-1, 1]);
        for (const s of [-1, 1]) {
          farGround(b, s, '#2a2622');
          if (s === ws) {
            K.pave(b, s * (EDGE + 3.5), -CHUNK_LEN / 2, 7, CHUNK_LEN);
            K.wharf(b, s, EDGE + 7, 0, CHUNK_LEN);
            K.waterPlane(b, s * (EDGE + 7.4), s * (EDGE + 56), 0, CHUNK_LEN);
            K.towerRow(b, s, 0, CHUNK_LEN, { x0: EDGE + 56 });
            for (let z = rand(4, 10); z < CHUNK_LEN - 4; z += rand(14, 20)) K.refl(b, s * (EDGE + 54), -z, pick(['#ffd9a0', '#bfe6ff', '#fff0d8']), 44, s);
            for (let k = randi(1, 2); k > 0; k--) K.yacht(b, s * rand(EDGE + 16, EDGE + 46), WY, -rand(10, 70), { ry: chance(0.5) ? 0 : Math.PI, L: rand(8, 11) });
            const palms = K.palmRow(b, s * (EDGE + 2.2), 0, CHUNK_LEN, { step: [12, 15], lit: chance(0.5) });
            lamps(b, s, s * (EDGE + 5.5), { kind: 'blade' }, palms.map((p) => [p - 1, p + 1]));
            for (let k = randi(3, 6); k > 0; k--) K.person(b, s * rand(EDGE + 3, EDGE + 6.5), -rand(4, 76), { outfit: pick(['casual', 'tourist', 'kandura', 'abaya']), pose: 'walk', ry: chance(0.5) ? 0 : Math.PI });
          } else {
            K.kerbLane(b, s, 0, CHUNK_LEN, { x1: 16 });
            K.jam(b, lane(s), 0, CHUNK_LEN, dirOf(s), { fill: 0.5 });
            K.towerRow(b, s, 0, CHUNK_LEN, { x0: 16 });
            const palms = K.palmRow(b, s * (KERB + 1.0), 0, CHUNK_LEN, { step: [12, 16] });
            lamps(b, s, s * (KERB + 0.4), {}, palms.map((p) => [p - 1, p + 1]));
            K.throng(b, s * (KERB + 1.6), s * 15, 1, CHUNK_LEN - 1, randi(8, 14), { mix: K.MIX.blvd });
            bits(b, s, palms.map((p) => [p - 1, p + 1]));
          }
          K.backRow(b, s, { x0: s === ws ? 110 : 60 });
        }
      },
      // Deira: the 1980s blocks over their shops and boards, the taxis queueing, the pavements full, carts and karak
      deira(b) {
        for (const s of [-1, 1]) {
          farGround(b, s, '#24201c');
          K.kerbLane(b, s);
          K.jam(b, lane(s), 0, CHUNK_LEN, dirOf(s), { fill: 0.65, mix: { taxi: 8, sedan: 3, suv: 2, bus: 0.8, moto: 1.6, gwagon: 0.4 } });
          const mz = chance(0.25) ? rand(20, 56) : -99;
          if (mz > 0) { K.deiraRow(b, s, 0, mz - 10); K.mosque(b, s, s * (X0 + 7.5), -mz, { w: 15, d: 13 }); K.deiraRow(b, s, mz + 9, CHUNK_LEN); }
          else K.deiraRow(b, s, 0, CHUNK_LEN);
          K.backRow(b, s, { x0: 30, kind: 'low' });
          K.backRow(b, s, { x0: 80 });
          const gaps = [];
          for (let k = randi(0, 2); k > 0; k--) { const z = rand(8, 72); if (clear(gaps, z, 3)) { (chance(0.5) ? K.karak : K.juice)(b, s * (KERB + 1.6), -z, s); gaps.push([z - 2, z + 2]); } }
          for (let k = randi(1, 3); k > 0; k--) { const z = rand(6, 74); if (clear(gaps, z, 2.5)) { K.cart(b, s * rand(KERB + 1.6, X0 - 1.5), -z); gaps.push([z - 2, z + 2]); } }
          lamps(b, s, s * (KERB + 0.4), {}, gaps);
          K.throng(b, s * (KERB + 0.8), s * (X0 - 0.8), 1, CHUNK_LEN - 1, randi(30, 42), { gaps, mix: K.MIX.street });
          if (chance(0.3)) K.busShelter(b, s * (KERB + 2.4), -rand(12, 68), s);
          if (chance(0.4)) K.cat(b, s * (X0 - 0.5), -rand(5, 75));
          bits(b, s, gaps);
        }
      },
      // the souk: arcades both sides under their shades, the goods out on the paving, the shoppers and porters, no cars
      souk(b) {
        for (const s of [-1, 1]) {
          farGround(b, s, '#24201c');
          K.pave(b, s * (EDGE + X0) / 2, -CHUNK_LEN / 2, X0 - EDGE, CHUNK_LEN);
          K.soukRow(b, s, 0, CHUNK_LEN);
          K.backRow(b, s, { x0: 26, kind: 'low' });
          if (chance(0.4)) K.minaret(b, s * rand(32, 46), -rand(15, 65), rand(24, 32));
          const gaps = [];
          for (let k = randi(1, 3); k > 0; k--) { const z = rand(6, 74); if (clear(gaps, z, 2.5)) { K.cart(b, s * rand(EDGE + 1.5, KERB), -z); gaps.push([z - 2, z + 2]); } }
          K.throng(b, s * (EDGE + 0.8), s * (KERB + 0.4), 1, CHUNK_LEN - 1, randi(18, 26), { gaps, mix: K.MIX.souk });
          for (let k = randi(3, 6); k > 0; k--) K.person(b, s * rand(KERB + 0.8, X0 - 1.8), -rand(3, 77), { outfit: pick(['tourist', 'tourist', 'kandura', 'abaya', 'casual']), pose: pick(['stand', 'camera', 'phone']), ry: s < 0 ? -Math.PI / 2 : Math.PI / 2 });
          if (chance(0.4)) K.cat(b, s * (EDGE + 1.2), -rand(5, 75));
        }
      },
      // Al Fahidi: coral-stone houses, wind towers, carved doors, lanes; lanterns and the tourists
      heritage(b) {
        for (const s of [-1, 1]) {
          farGround(b, s, '#2a241e');
          K.pave(b, s * (EDGE + X0 + 0.5) / 2, -CHUNK_LEN / 2, X0 + 0.5 - EDGE, CHUNK_LEN);
          K.heritageRow(b, s, 0, CHUNK_LEN);
          K.backRow(b, s, { x0: 30, kind: 'low' });
          const palms = [];
          for (let z = rand(5, 12); z < CHUNK_LEN - 4; z += rand(14, 20)) { K.datePalm(b, s * (EDGE + 2.4), -z, rand(0.65, 0.85)); b.block(VC.solid, '#c8b898', s * (EDGE + 2.4), 0, -z, 1.4, 0.4, 1.4); palms.push(z); }
          lamps(b, s, s * (EDGE + 4.2), { kind: 'lantern' }, palms.map((p) => [p - 1.2, p + 1.2]), [16, 22]);
          K.throng(b, s * (EDGE + 4.6), s * (X0 - 1.4), 1, CHUNK_LEN - 1, randi(8, 14), { mix: K.MIX.souk });
          if (chance(0.4)) K.cat(b, s * (X0 - 0.4), -rand(5, 75));
        }
      },
      // the creek: the wharf on the right, the abras moored and crossing, the dhows at the far wharf, Deira's lights beyond;
      // the textile souk's arcade or the old houses on the left
      creek(b) {
        const ws = 1;
        for (const s of [-1, 1]) {
          if (s === ws) {
            K.pave(b, s * (EDGE + 2.6), -CHUNK_LEN / 2, 5.2, CHUNK_LEN);
            K.wharf(b, s, EDGE + 5.2, 0, CHUNK_LEN);
            K.waterPlane(b, s * (EDGE + 5.6), s * (EDGE + 82), 0, CHUNK_LEN);
            for (let z = rand(4, 8); z < CHUNK_LEN - 4; z += rand(8.5, 10)) if (chance(0.7)) K.abra(b, s * (EDGE + 6.8), WY + 0.15, -z, { ry: 0 });
            for (let k = randi(2, 4); k > 0; k--) K.abra(b, s * rand(EDGE + 18, EDGE + 66), WY + 0.15, -rand(6, 74), { ry: Math.PI / 2 + rand(-0.4, 0.4) });
            K.farShore(b, s, EDGE + 82);
            lamps(b, s, s * (EDGE + 4.8), { kind: 'lantern' }, [], [12, 16]);
            K.queue(b, s * (EDGE + 3.6), -rand(20, 50), randi(4, 8), 0.62, { mix: K.MIX.souk });
            K.throng(b, s * (EDGE + 1.0), s * (EDGE + 4.2), 1, CHUNK_LEN - 1, randi(8, 14), { mix: K.MIX.souk });
          } else {
            farGround(b, s, '#24201c');
            K.pave(b, s * (EDGE + X0) / 2, -CHUNK_LEN / 2, X0 - EDGE, CHUNK_LEN);
            if (chance(0.5)) K.soukRow(b, s, 0, CHUNK_LEN); else K.heritageRow(b, s, 0, CHUNK_LEN);
            K.backRow(b, s, { x0: 28, kind: 'low' });
            K.throng(b, s * (EDGE + 0.8), s * (X0 - 1.6), 1, CHUNK_LEN - 1, randi(14, 22), { mix: K.MIX.souk });
          }
        }
      },
      // the Marina: the water on the left with its pontoons and yachts, the towers across it; the Marina Walk's cafés under
      // the residential towers on the right
      marina(b) {
        const ws = -1;
        for (const s of [-1, 1]) {
          if (s === ws) {
            K.pave(b, s * (EDGE + 4), -CHUNK_LEN / 2, 8, CHUNK_LEN);
            const palms = [];
            for (let z = rand(3, 8); z < CHUNK_LEN - 2; z += rand(11, 14)) { (chance(0.5) ? K.fanPalm : K.datePalm)(b, s * (EDGE + 2.0), -z, rand(0.8, 0.95)); palms.push(z); }
            lamps(b, s, s * (EDGE + 6.2), { kind: 'blade' }, palms.map((p) => [p - 1, p + 1]), [16, 20]);
            K.wharf(b, s, EDGE + 8, 0, CHUNK_LEN);
            K.marinaWater(b, s, EDGE + 8.4, EDGE + 66);
            for (let z = rand(0, 10); z < CHUNK_LEN - 10; z += rand(30, 40)) K.resTower(b, s * (EDGE + 82), -(z + 12), { w: rand(22, 30), d: rand(22, 28) });
            for (let z = rand(4, 12); z < CHUNK_LEN - 4; z += rand(14, 20)) K.refl(b, s * (EDGE + 66), -z, pick(['#ffd9a0', '#bfe6ff', '#ff9ad8']), 56, s);
            for (let k = randi(4, 8); k > 0; k--) K.person(b, s * rand(EDGE + 3, EDGE + 7.4), -rand(3, 77), { outfit: pick(['tourist', 'casual', 'abaya', 'kandura']), pose: pick(['walk', 'walk', 'phone', 'camera']), ry: chance(0.5) ? 0 : Math.PI });
          } else {
            farGround(b, s, '#24201c');
            K.kerbLane(b, s, 0, CHUNK_LEN, { x1: 18 });
            K.jam(b, lane(s), 0, CHUNK_LEN, dirOf(s), { fill: 0.45, mix: { lux: 2, super: 3, suv: 4, gwagon: 2, taxi: 4, sedan: 2 } });
            for (let z = rand(0, 6); z < CHUNK_LEN - 10;) { const w = rand(22, 28); K.resTower(b, s * (18 + 12 + 5), -(z + w / 2), { w, d: rand(22, 26) }); z += w + rand(8, 14); }
            for (let z = rand(4, 10); z < CHUNK_LEN - 6; z += rand(12, 18)) { K.shopSign(b, pick(MARINA_SIGNS), s * 13.05, 3.4, -z, s, 3.2, 0.92); K.cafe(b, s * 12.0, -z, s, { n: 2 }); }
            const palms = K.palmRow(b, s * (KERB + 1.0), 0, CHUNK_LEN, { step: [12, 15] });
            lamps(b, s, s * (KERB + 0.4), { kind: 'blade' }, palms.map((p) => [p - 1, p + 1]));
            K.throng(b, s * (KERB + 1.6), s * 11, 1, CHUNK_LEN - 1, randi(10, 16), { mix: K.MIX.beach });
          }
        }
      },
      // the beach on the left (the Gulf), its running track and parasols; the beach road's villas and cafés on the right
      beach(b) {
        for (const s of [-1, 1]) {
          if (s < 0) {
            K.pave(b, s * (EDGE + 3.5), -CHUNK_LEN / 2, 7, CHUNK_LEN);
            K.beach(b);
            for (let z = rand(3, 8); z < CHUNK_LEN - 2; z += rand(13, 17)) K.datePalm(b, s * (EDGE + 1.6), -z, rand(0.8, 1.0), { lit: chance(0.3) });
            for (let k = randi(3, 6); k > 0; k--) K.person(b, s * rand(EDGE + 4.6, EDGE + 6.0), -rand(3, 77), { outfit: pick(['casual', 'tourist']), pose: 'walk', ry: chance(0.5) ? 0 : Math.PI });   // runners on the track
          } else {
            farGround(b, s, '#2a2620');
            K.kerbLane(b, s, 0, CHUNK_LEN, { x1: X0 + 1 });
            K.jam(b, lane(s), 0, CHUNK_LEN, dirOf(s), { fill: 0.35, mix: { suv: 5, lux: 2, super: 2, gwagon: 2, taxi: 3, sedan: 2 } });
            K.villaRow(b, s, 0, CHUNK_LEN);
            const palms = K.palmRow(b, s * (KERB + 1.0), 0, CHUNK_LEN, { step: [12, 16] });
            lamps(b, s, s * (KERB + 0.4), {}, palms.map((p) => [p - 1, p + 1]));
            K.throng(b, s * (KERB + 1.6), s * (X0 - 0.4), 1, CHUNK_LEN - 1, randi(4, 8), { mix: K.MIX.beach });
          }
        }
      },
      // Jumeirah's villas behind their walls, the bougainvillea, a mosque; the towers of the new town far off
      villa(b) {
        for (const s of [-1, 1]) {
          farGround(b, s, '#2a2620');
          K.kerbLane(b, s, 0, CHUNK_LEN, { x1: X0 + 1 });
          K.jam(b, lane(s), 0, CHUNK_LEN, dirOf(s), { fill: 0.3, mix: { suv: 6, lux: 2, gwagon: 2, taxi: 2, sedan: 2, super: 1 } });
          const mz = chance(0.25) ? rand(24, 56) : -99;
          if (mz > 0) { K.villaRow(b, s, 0, mz - 12); K.mosque(b, s, s * (X0 + 9), -mz, { w: 16, d: 14 }); K.villaRow(b, s, mz + 12, CHUNK_LEN); }
          else K.villaRow(b, s, 0, CHUNK_LEN);
          const palms = K.palmRow(b, s * (KERB + 1.0), 0, CHUNK_LEN, { step: [11, 15] });
          for (let z = rand(6, 14); z < CHUNK_LEN - 4; z += rand(24, 30)) if (clear(palms.map((p) => [p - 2, p + 2]), z)) K.ghaf(b, s * (KERB + 1.6), -z, rand(0.75, 0.9));
          lamps(b, s, s * (KERB + 0.4), {}, palms.map((p) => [p - 1, p + 1]));
          if (chance(0.5)) K.backRow(b, s, { x0: 90, kind: 'res' });
          K.throng(b, s * (KERB + 1.4), s * (X0 - 0.4), 1, CHUNK_LEN - 1, randi(3, 6), { mix: K.MIX.blvd });
          bits(b, s, palms.map((p) => [p - 1, p + 1]));
        }
      },
      // the desert: dunes either side, a string of camels, the warning sign, the power line, 4x4s up on the crests
      dunes(b) {
        for (const s of [-1, 1]) {
          K.sand(b, s * (EDGE + 1.6), -CHUNK_LEN / 2, 3.2, CHUNK_LEN, 0.02, '#f0d8b8');
          const h = K.dunes(b, s, 0, CHUNK_LEN);
          if (chance(0.6)) { const x0 = rand(14, 22), z0 = rand(10, 30), ry = s > 0 ? rand(-0.3, 0.3) : Math.PI + rand(-0.3, 0.3); for (let k = 0; k < randi(3, 6); k++) { const x = x0 + k * 1.2, z = z0 + k * 3.6; K.camel(b, s * x, -z, { ry: ry + (Math.PI / 2) * s, y: h(x, z) - 0.1 }); } }
          for (let k = randi(1, 3); k > 0; k--) { const x = rand(12, 40), z = rand(5, 75); K.ghaf(b, s * x, -z, rand(0.8, 1.1), { y: h(x, z) - 0.2 }); }
          if (chance(0.5)) { const x = rand(30, 60), z = rand(10, 70), y = h(x, z); K.place(b, (t) => K.car(t, 0, 0, 1, { kind: 'suv', col: pick(['#f4f4f2', '#e8e4dc', '#c8a050']), lit: true }), new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rand(-0.25, 0.25), rand(0, 6), rand(-0.2, 0.2))).setPosition(s * x, y, -z)); }
          for (let z = rand(5, 20); z < CHUNK_LEN; z += 40) { b.cyl(VC.solid, '#5a4632', s * (EDGE + 9), 5, -z, 0.14, 10, 'cyl6'); b.box(VC.solid, '#5a4632', s * (EDGE + 9), 9.4, -z, 0.12, 0.14, 2.4); }   // the poles of the power line
          if (chance(0.45)) K.camelSign(b, s * (EDGE + 2.2), -rand(10, 70), s);
        }
      },
    };
    const decor = (zone) => {
      const b = new Batcher(), W = KINDS[zone] || KINDS.down;
      let r = Math.random(), kind = W[W.length - 1][0];
      for (const [k, w] of W) { if (r < w) { kind = k; break; } r -= w; }
      S[kind](b);
      const g = K.flush(b.build());
      g.userData.kind = kind;
      return g;
    };

    // ---------- the camel-crossing sign (the low barrier's, and the desert road's) ----------
    const camelTex = canvasTex(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#ffffff'; g.strokeStyle = '#d8202a'; g.lineWidth = 22; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(w / 2, 20); g.lineTo(w - 18, h * 0.66); g.lineTo(18, h * 0.66); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#141414';   // the camel: the body and its hump, the legs, the neck up to its head
      g.beginPath(); g.ellipse(124, 120, 34, 14, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(124, 104, 16, 14, 0, 0, Math.PI * 2); g.fill();
      for (const x of [100, 110, 138, 148]) g.fillRect(x, 124, 5, 30);
      g.lineWidth = 7; g.strokeStyle = '#141414'; g.beginPath(); g.moveTo(92, 116); g.quadraticCurveTo(76, 96, 84, 78); g.stroke(); g.beginPath(); g.ellipse(80, 76, 9, 5, -0.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff'; g.fillRect(28, h * 0.72, w - 56, 58); g.strokeStyle = '#141414'; g.lineWidth = 3; g.strokeRect(28, h * 0.72, w - 56, 58);
      g.fillStyle = '#141414'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.direction = 'rtl'; g.font = `900 24px ${KUFI}`; g.fillText('انتبه جمال', w / 2, h * 0.72 + 18);
      g.direction = 'ltr'; g.font = `700 18px ${SANS}`; g.fillText('CAMEL CROSSING', w / 2, h * 0.72 + 44);
    }, { repeat: false });
    const camelMat = std({ map: camelTex, alphaTest: 0.5, roughness: 0.5, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: camelTex, emissiveIntensity: 0.3 });
    K.camelSign = (b, x, z, s) => { b.cyl(VC.metal, '#8a8e94', x, 1.2, z, 0.05, 2.4, 'cyl6'); b.add(G.plane, camelMat, x, 2.6, z, 1.5, 1.5, 1, 0, -s * Math.PI / 2, 0); };

    // ---------- the horizon ----------
    // (placeholder: the towers of the city in a ring, Burj Khalifa dead ahead; dubai_icons.js and dubai_show.js replace it)
    const bkClear = (a, rr) => (Math.abs((a * 180) / Math.PI) < 5 ? 12 : Infinity);
    const sky = skyline({
      tex: skyTex({ wall: '#141626', lit: ['#ffe2b0', '#fff0d8', '#ffd090', '#e8f0ff'], chance: 0.45 }),
      colors: ['#ffffff', '#f0e8ff', '#e8f0ff', '#fff0e0'], count: 220, r: [560, 1000], h: [40, 190], w: [20, 50], k: 1.4,
      heightCap: bkClear, follow: 190,
      landmarks: [
        (b) => {   // a stand-in Burj Khalifa: stacked shafts narrowing to a spire
          const [x, z] = polar(0, 1150);
          let y = -95, w = 60;
          for (let k = 0; k < 9; k++) { const h = 50 - k * 2; b.add(G.box, SKY_VC, x, y + h / 2, z, w, h, w, 0, (k * Math.PI) / 9, 0, hdr('#c8d8f0', 1.1)); y += h; w *= 0.82; }
          b.add(G.cone8, SKY_VC, x, y + 60, z, 8, 120, 8, 0, 0, 0, hdr('#e8f0ff', 1.4));
        },
      ],
    });

    // ---------- the trains ----------
    // the Metro's driverless trains standing on the line: blue and silver, the Gold Class car in front with its panoramic
    // window (no driver: the passengers look out down the line); the tram coming at you: pearl white, a band of gold dunes
    // along its side, its diamond of a nose, no pantograph (it draws its power from the rail)
    const metro = (b, c) => {
      const zc = c.zb0 - c.bl / 2;
      for (const e of [-1, 1]) {
        b.box(VC.solid, '#1a3a8a', e * (TRAIN_W / 2 + 0.008), 2.05, zc, 0.02, 1.0, c.bl - 0.3);
        if (c.front) b.box(VC.solid, '#c8a050', e * (TRAIN_W / 2 + 0.012), 2.72, zc, 0.02, 0.12, c.bl - 0.3);
        K.bi(b, 'مترو دبي', 'DUBAI METRO', { w: 384, h: 128, color: '#1a3a8a' }, e * (TRAIN_W / 2 + 0.02), 1.15, zc, 2.4, 0.8, 1, 0, (e * Math.PI) / 2, 0);
      }
      if (!c.front) return;
      b.box(VC.glow, hdr('#2e3a4e', 1.0), 0, 2.05, c.z0 + 0.04, TRAIN_W - 0.3, 1.15, 0.02);
      b.box(VC.solid, '#1a3a8a', 0, 1.2, c.z0 + 0.04, TRAIN_W - 0.1, 0.3, 0.02);
    };
    const tram = (b, c) => {
      const zc = c.zb0 - c.bl / 2;
      for (const e of [-1, 1]) {
        for (let k = 0; k < 12; k++) { const u = -c.bl / 2 + 0.6 + k * ((c.bl - 1.2) / 11), y = 0.95 + 0.18 * Math.sin(k * 0.9); b.box(VC.solid, '#c8a060', e * (TRAIN_W / 2 + 0.01), y, zc + u, 0.02, 0.3, c.bl / 11 + 0.05); }   // the dunes along her side
        K.bi(b, 'ترام دبي', 'DUBAI TRAM', { w: 384, h: 128, color: '#3a3a40' }, e * (TRAIN_W / 2 + 0.02), 2.75, zc, 2.0, 0.66, 1, 0, (e * Math.PI) / 2, 0);
      }
      b.box(VC.metal, '#b8bcc4', 0, TRAIN_H + 0.2, zc, 1.4, 0.3, 3.2);   // the air conditioning on the roof
      if (!c.front) return;
      b.add(G.cone4, VC.solid, 0, 1.75, c.z0 + 0.55, 2.0, 1.2, 2.2, Math.PI / 2, 0, 0, '#f2f0ea');   // the diamond nose
      b.add(G.box, VC.glow, 0, 2.35, c.z0 + 0.35, TRAIN_W - 0.4, 1.0, 0.04, -0.35, 0, 0, hdr('#2e3a4e', 1));
    };
    const trainStyle = {
      body: '#d8dce2', bodyMetal: true, roof: '#b8bcc4', under: '#2a2c32', stripe: '#1a3a8a', stripe2: '#c8ccd2', doors: true, door: '#c8ccd2',
      window: '#eaf4ff', windowK: 1.3, frame: '#1a1c22', light: '#f4f8ff', sign: '#ff9a3c', roofUnit: '#9aa0a8', extra: metro,
      rampMat: std({ map: stripeTex('#2a2c32', '#ffc23d', 6), roughness: 0.6 }), rampGlow: '#ffc23d',
      movingStyle: { body: '#f2f0ea', bodyMetal: false, roof: '#d8d4cc', stripe: '#c8a060', stripe2: null, windows: true, doors: false, strobe: false, roofUnits: false,
        light: '#fff4dc', sign: '#ffd86a', window: '#ffe8c0', windowK: 1.0, frame: '#3a3a40', extra: tram },
    };

    // ---------- the obstacles ----------
    // a souk's carved teak arch hung with brass lanterns, "mind your head", to slide under; an orange water barrier of the
    // roadworks with the camel-crossing sign on it, to jump
    const headTex = canvasTex(256, 96, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6a3e1e'); gr.addColorStop(1, '#4a2a12'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#c8a050'; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = '#ffd88a'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.direction = 'rtl'; g.font = `900 34px ${KUFI}`; g.fillText('انتبه لرأسك', w / 2, 36);
      g.direction = 'ltr'; g.font = `700 20px ${SANS}`; g.fillText('MIND YOUR HEAD', w / 2, 72);
    }, { repeat: false });
    const barrier = barrierStyle({ c1: '#6a3e1e', c2: '#c8a050', label: '', signBg: '#4a2a12', signFg: '#ffd88a', glow: '#ffb040', post: '#5a3418' });
    barrier.signMat = std({ map: headTex, roughness: 0.6, emissive: '#ffffff', emissiveMap: headTex, emissiveIntensity: 0.35 });
    barrier.highExtra = (b) => {   // the arch over the bar: carved posts, the pointed arch, lanterns hanging under it
      for (const sx of [-1, 1]) { b.box(VC.solid, '#5a3418', sx * 1.3, 1.8, 0, 0.3, 3.6, 0.3); b.box(VC.metal, '#c8a050', sx * 1.3, 3.0, 0, 0.36, 0.08, 0.36); b.add(G.box, VC.solid, sx * 0.72, 3.95, 0, 1.4, 0.24, 0.26, 0, 0, -sx * 0.5, '#5a3418'); }
      for (const x of [-0.7, 0, 0.7]) { b.box(VC.solid, '#3a2a1a', x, 3.3 - Math.abs(x) * 0.3, 0, 0.02, 0.4, 0.02); b.add(G.sphLow, VC.glow, x, 2.98 - Math.abs(x) * 0.3, 0, 0.22, 0.3, 0.22, 0, 0, 0, hdr(pick(['#ffb040', '#ff8a3a', '#ffd070']), 2.6)); }
    };
    barrier.lowBarMat = std({ map: stripeTex('#ff7a1a', '#f4f4f0', 6), roughness: 0.6 });
    barrier.lowExtra = (b) => {
      b.add(G.box, barrier.lowBarMat, 0, 0.3, 0.18, 2.3, 0.6, 0.34);   // the water-filled barrier's body
      b.box(VC.metal, '#888888', 0, 1.2, 0, 0.05, 0.4, 0.05);
      b.add(G.plane, camelMat, 0, 1.75, 0.04, 0.9, 0.9, 1);
      b.add(G.plane, camelMat, 0, 1.75, -0.04, 0.9, 0.9, 1, 0, Math.PI, 0);
    };

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: [],
      zoneAt: (k) => (k < 0 ? 'down' : ZONES[k % LOOP]),
      zonePool: { down: [5, 8], coast: [5, 8], old: [5, 8], desert: [3, 4], beach: [2, 3], marina: [2, 3], creek: [2, 3] },
      coinGeo: coinGeometry('dirham'), coinMat: coinMaterial('#ffd04a', '#ffa000'),
      update(t) {
        K.update(t);
        K.gulfU.uTime.value = t;
        K.gulfU.uSunAz.value = Math.atan2(-0.78, 1) - sky.rotation.y;
      },
      K,
      debugKind: (kind) => { const b = new Batcher(); S[kind](b); const g = K.flush(b.build()); g.userData.kind = kind; return g; },   // (for screenshots of one kind of street)
    };
  },
};
