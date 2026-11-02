// San Francisco on a foggy summer evening: the sun low over the Pacific on the left, the fog pouring in through the Golden
// Gate, the bridge's towers standing up out of it at the far end of the track, gold on the faces turned to the sun and
// wisps of fog drifting down the streets. The Painted Ladies' rows of Victorians, the Haight's psychedelic shops, the
// streets running along the hills with their cross streets climbing and plunging, the Mission's murals and papel picado,
// Market Street's towers, the Embarcadero's piers. F-line streetcars wait on the line; a cable car comes at you ringing
// its bell. Twelve landmarks, two of them out on the Golden Gate Bridge, which the run crosses (sf_bridge.js).
import { THREE, Batcher, VC, G, std, basic, hdr, stripeTex, canvasTex, CHUNK_LEN, TRAIN_W, TRAIN_H, rand, randi, pick, chance } from '../core.js';
import { barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, skyline, skyTex, polar, polarXZ, below, EDGE, farGround } from './common.js';
import { frame, bakeShade } from './ny_icons.js';
import { ridge } from './taipei_towers.js';
import { sparkles, beacon } from './paris_kit.js';
import { GG, ggTower, cable, sutro, transamerica, salesforce, tower, california555, coit, alcatraz, bayBridge, fogBankTex } from './sf_icons.js';
import { makeBridge, STRETCH } from './sf_bridge.js';
import { sfLandmarks } from './sf_landmarks.js';
import { beam } from './tokyo_kit.js';
import { makeKit, X0, KERB, SANS, WEST, PSYCHE, TIEDYE, PAINTED, STUCCO, HAIGHT_SIGNS, VIC_SIGNS, MISSION_SIGNS } from './sf_kit.js';

const BLURB = '夏日傍晚的旧金山：太阳低低挂在左边的太平洋上空，海雾正从金门海峡涌进城里，金门大桥的两座红色桥塔从雾里露出塔顶，就立在街道尽头。坡道两边是一排排粉彩的维多利亚式老房子，凸窗、托架檐口和高高的门前台阶；有的路口一侧的横街一头扎下山，尽头就是海湾和帆船，叮当车正往上爬。海特街的房子刷成迷幻的颜色、画满壁画，教会区挂着剪纸彩旗、开着西班牙文招牌的小店，市场街有金色的海神灯柱和地铁口，内河码头是一座座码头仓库、棕榈和海鸥；街上飘着一团团雾，头顶是无轨电车的电线。从渡轮大厦和海湾大桥出发，经过鲍威尔街的叮当车转盘和联合广场、九曲花街、渔人码头晒太阳的海狮和艺术宫，然后真的跑上金门大桥，从桥塔下穿过、看着主缆垂到身边，脚下是翻滚的雾海，一直跑到对岸马林岬角的观景台；再折回城里，经过金门公园的花卉温室、海特-阿什伯里、阿拉莫广场的彩绘女士和卡斯特罗区的彩虹斑马线，最后到教会区和多洛雷斯公园。天边一直看得到双子峰上的苏特罗电视塔、科伊特塔、恶魔岛上转动的灯塔光束，还有海湾大桥上闪烁的灯。';
const SIGHTS = ['渡轮大厦 · 海湾大桥', '叮当车转盘 · 联合广场', '九曲花街', '渔人码头 · 39 号码头', '艺术宫', '金门大桥', '马林岬角 · 观景台', '金门公园 · 花卉温室', '海特-阿什伯里', '阿拉莫广场 · 彩绘女士', '卡斯特罗区', '教会区 · 多洛雷斯公园'];

// the skyline's models: unlit, their shading baked; the bridge in its international orange, the stone and the glass catching the sunset
const skyMat = (o = {}) => new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, ...o });
const SKY = {
  paint: skyMat(), wall: skyMat(), glow: skyMat(), dark: skyMat(), metal: skyMat(), glass: skyMat(),
  cOrange: hdr('#d0563c', 0.95), cOrange2: hdr('#b84630', 0.95), cWhite: hdr('#f0e6e0', 0.92), cWhite2: hdr('#e0d6d4', 0.88), cRed: hdr('#c84a3c', 0.95),
  cWin: hdr('#ffd9a0', 1.25), cCrown: hdr('#fff0d8', 1.5), cRock: hdr('#7a6e6a', 0.9), cCell: hdr('#e8dccc', 0.9), cDark: hdr('#3a363c', 1),
  cLamp: hdr('#fff4d8', 3), cStone: hdr('#f0e6da', 0.92), cStone2: hdr('#dcd0c2', 0.88), cArch: hdr('#ffd9a0', 1.15), cSteel: hdr('#c0c4cc', 0.9), cSteel2: hdr('#949aa4', 0.9),
  cGranite: hdr('#5a4a44', 1), cGranite2: hdr('#4a3c38', 1), cGlassTower: hdr('#f0f2f8', 1), cClock: hdr('#f8f2e4', 1.2),
};
// the far Golden Gate: hazed toward the fog it stands in
const GGS = { ...SKY, paint: skyMat({ transparent: true }), cOrange: hdr('#d2644a', 0.92), cOrange2: hdr('#bc543e', 0.92), cDeck: hdr('#a8503e', 0.9) };
const LAMP = skyMat();   // aircraft lamps on the towers, blinking
const GGLAMP = skyMat({ transparent: true });   // the far Golden Gate's lamps (they fade out with it)
const RIDGE = skyMat();   // the hills' ring (its geometry has no normals, so it keeps a material of its own)
const bayLights = [];
// the icons that stand clear of the ring of houses: [degrees, radius]
const ICONS = [[0, 1250], [-32, 980], [-45, 1060], [9, 640], [15.5, 900], [30, 860]];
// the hills round the bay: [degrees, height, width] (taipei_towers.js ridge)
const SF_PEAKS = [[-32, 150, 9], [-45, 140, 7], [-13, 210, 15], [-3, 120, 10], [7, 100, 8], [21, 120, 8], [52, 140, 22], [84, 150, 26], [140, 110, 30], [200, 125, 40], [-80, 95, 20], [-115, 85, 25], [250, 100, 30]];

// The loop: twelve landmarks, each heading four chunks (world.js LANDMARK_EVERY), in this order. The Golden Gate takes
// seven chunks in a row (sf_bridge.js): the Presidio approach, the south tower (a landmark), three of the main span,
// the north tower (a landmark), the Marin end; the Presidio's woods either side of it; every other chunk is a street.
const ROUTE = ['ferry', 'cablecar', 'lombard', 'wharf', 'palace', 'goldenGate', 'vista', 'ggpark', 'haight', 'alamo', 'castro', 'mission'];
const LOOP = ROUTE.length * 4;
const ZONES = Array.from({ length: LOOP }, (_, k) => ({ 18: 'forest', 19: 'approach', 21: 'span1', 22: 'span2', 23: 'span3', 25: 'marin', 26: 'forest', 27: 'forest' })[k] || (k < 18 ? 'east' : 'west'));
// the streets each side of town runs to: the towers, the piers and the hills down to the bay from the Ferry Building to
// the Marina; the Painted Ladies, the Haight and the Mission from the park round to Dolores
const KINDS = {
  east: [['victorian', 0.22], ['hill', 0.3], ['downtown', 0.24], ['embarcadero', 0.24]],
  west: [['victorian', 0.34], ['haight', 0.22], ['mission', 0.26], ['hill', 0.18]],
};
const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));

export default {
  id: 'sf', name: '旧金山', en: 'SAN FRANCISCO', tagline: '雾锁金门 · 叮当爬坡',
  blurb: BLURB, sights: SIGHTS,
  accent: '#ff5a3a', accent2: '#ffd27a', portal: '#ff6a4a',
  sky: { top: '#2a467e', mid: '#a08ab4', bot: '#ffc49a', glow: '#ffa868', glowK: 0.55, sun: '#ffc070', sunK: 1.0, sunDir: [-0.36, 0.04, -1], sunSize: 0.0012,
    cloud: 0.2, cloudColor: '#f0c0b0', horizon: -0.07, stars: false, follow: true },
  envSky: { bot: '#7a88b8', glow: '#9a8ab0', glowK: 0.2, sunK: 0.4 },
  fog: { color: '#e0c0b0', near: 24, far: 230 },
  light: { hemiSky: '#b4c4ff', hemiGround: '#a8908a', hemi: 0.9, dir: '#ffb47a', dirK: 1.35, dirPos: [-0.85, 0.3, -0.5] },
  exposure: 1.0, bloom: { strength: 0.55, radius: 0.5, threshold: 0.9 },
  weather: [{ mode: 'float', count: 120, colors: ['#ffe0b0', '#fff0d8', '#ffd0a0'], size: 0.14, k: 1.6, box: [44, 14, 90], speed: 0.8 }],
  coin: 'ggtower', music: 'sf', jingle: 'foghorn', horn: 'cableCar',

  build() {
    const K = makeKit();
    const track = makeTrack({ gravel: '#3c3c42', spots: ['#4a4a50', '#2e2e34', '#56565c'], sleeper: '#3c3c42', rail: '#c8ccd4', edge: '#ffcf8a', edgeK: 0.8, sideMat: K.sideMat });

    // ---------- the street kinds ----------
    const clear = (gaps, z, r = 0) => !gaps.some(([a, c]) => z > a - r && z < c + r);
    // the pavement's furniture: street trees in their wells, lamps reaching over the parking lane, a hydrant, the crowd
    const pavement = (b, s, { trees = true, n = [5, 10], gaps = [], opts = {}, lamp = K.lamp, lampX = 7.0, treeX = 7.6 } = {}) => {
      if (trees) for (let z = rand(3, 8); z < CHUNK_LEN - 3; z += rand(11, 15)) if (clear(gaps, z, 2)) K.streetTree(b, s * treeX, -z);
      for (let z = rand(6, 14); z < CHUNK_LEN - 2; z += rand(24, 30)) if (clear(gaps, z, 1.5)) lamp(b, s * lampX, -z, s);
      if (chance(0.6)) { const z = rand(6, 74); if (clear(gaps, z, 1)) K.hydrant(b, s * 7.1, -z); }
      K.throng(b, s * 7.9, s * 10.4, 2, CHUNK_LEN - 2, randi(...n), gaps, opts);
      if (chance(0.3)) { const z = rand(6, 74); if (clear(gaps, z, 1)) K.dog(b, s * rand(8, 10), -z); }
    };
    const victorianSide = (b, s) => {   // Pacific Heights, Alamo Square: the Painted Ladies, their stoops and gardens, cars at the kerb
      K.kerbLane(b, s);
      K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.7 });
      K.houseRow(b, s, 0, CHUNK_LEN, { x0: X0 });
      pavement(b, s);
      if (chance(0.3)) K.wires(b, s * 5.0, 0, CHUNK_LEN, s);
      if (chance(0.25)) K.streetSign(b, s * 7.2, -rand(4, 76), s);
    };
    const haightSide = (b, s) => {   // the Haight: psychedelic paint, the shops under the flats, the hippies, a flowered bus
      K.kerbLane(b, s);
      const busy = [];
      if (chance(0.45)) { const z = rand(12, 66); K.vwBus(b, s * 5.2, -z); busy.push([z - 5, z + 5]); }
      K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.55, gaps: busy });
      K.houseRow(b, s, 0, CHUNK_LEN, { x0: 11.4, colors: PSYCHE, accents: [...PSYCHE, '#1a1a20'], shopP: 0.75, signs: HAIGHT_SIGNS });
      pavement(b, s, { trees: chance(0.5), n: [4, 8] });
      K.throng(b, s * 7.6, s * 10.6, 2, CHUNK_LEN - 2, randi(4, 8), [], { hippie: true });
      for (let k = randi(0, 2); k > 0; k--) K.person(b, s * 10.2, -rand(6, 74), { seated: true, hippie: true, ry: s < 0 ? Math.PI / 2 : -Math.PI / 2 });
      if (chance(0.5)) K.bikeDock(b, s * 9.8, -rand(14, 60));
      if (chance(0.3)) K.streetSign(b, s * 7.2, -rand(4, 76), s, 0, 1);
    };
    // a street along the side of a hill: on the left the houses stand up on their terraces with the hillside climbing
    // behind them; on the right the ground falls away past a balustrade, the roofs stepping down to the bay, Hyde Street
    // plunging through them with a cable car on it
    const hillSide = (b, s, up) => {
      K.kerbLane(b, s);
      if (up) {
        K.terraceRow(b, s, 0, CHUNK_LEN);
        K.hillside(b, s, 0, CHUNK_LEN, { x0: 32, x1: 104, y1: 46, steps: 6 });
        K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.65 });
        pavement(b, s, { trees: false });
        return null;
      }
      const zj = K.vista(b, s), gap = zj === null ? [] : [[zj - 7.5, zj + 7.5]];
      K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.55, gaps: gap.map(([a, c]) => [a - 3, c + 3]) });
      pavement(b, s, { gaps: gap, n: [3, 6], trees: false });
      return zj;
    };
    const missionSide = (b, s) => {   // the Mission: murals, taquerías and panaderías, papel picado, palms, lowriders, carts, mariachis
      K.kerbLane(b, s);
      K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.6, kinds: [K.lowrider, K.car, K.car] });
      for (let z = rand(0, 1); z < CHUNK_LEN - 5;) {   // the row: shops under flats, and now and then a low building painted all over
        const w = pick([7.6, 7.6, 8.4, 10]);
        if (chance(0.28)) K.muralWall(b, s, 11.4, -(z + w / 2), w, { shop: chance(0.5) ? MISSION_SIGNS : null });
        else K.house(b, s, 11.4 + rand(0, 0.2), -(z + w / 2), { w, col: pick([...PAINTED, ...STUCCO, '#f2c230', '#39b8a8', '#e8708a', '#ff9a4a']), shop: chance(0.7) ? MISSION_SIGNS : null, floors: randi(1, 3), style: pick(['italianate', 'stick', 'stick']), flip: chance(0.3) });
        z += w + rand(0.02, 0.2);
      }
      const taken = [];
      for (let k = randi(1, 2); k > 0; k--) { const z = rand(8, 72); if (clear(taken.map((t) => [t - 4, t + 4]), z)) { K.cart(b, s * 8.4, -z, s); taken.push(z); } }
      if (chance(0.35)) { const z = rand(10, 70); if (clear(taken.map((t) => [t - 4, t + 4]), z)) { K.mariachi(b, s * 9.4, -z, s); taken.push(z); } }
      for (let z = rand(4, 10); z < CHUNK_LEN - 4; z += rand(14, 18)) if (clear(taken.map((t) => [t - 2, t + 2]), z)) K.fanPalm(b, s * 8.4, -z, rand(0.95, 1.1));   // tall and thin, their heads clear of the track
      for (let z = rand(10, 16); z < CHUNK_LEN - 2; z += rand(26, 30)) K.lamp(b, s * 7.0, -z, s);
      K.throng(b, s * 7.9, s * 10.6, 2, CHUNK_LEN - 2, randi(7, 12), taken.map((t) => [t - 1.5, t + 1.5]));
      K.papelZ(b, s * 9.2, 4.8, rand(0, 4), rand(36, 44), { to: s * 11.45 }); K.papelZ(b, s * 9.2, 4.8, rand(40, 46), rand(76, 80), { to: s * 11.45 });
    };
    const downtownSide = (b, s) => {   // Market Street: the towers, the Path of Gold, the streetcar wires, the way down to BART
      K.kerbLane(b, s, { x1: 12.4 });
      K.towerRow(b, s, 0, CHUNK_LEN, { x0: 12.4 });
      const taken = [];
      if (chance(0.5)) { const z = rand(14, 62); K.muniEntrance(b, s * 9.6, -z, s); taken.push(z); }
      if (chance(0.5)) { const z = rand(8, 72); if (clear(taken.map((t) => [t - 5, t + 5]), z)) { K.newsstand(b, s * 9.4, -z, s); taken.push(z); } }
      if (chance(0.4)) { const z = rand(8, 72); if (clear(taken.map((t) => [t - 5, t + 5]), z)) { K.flowerStand(b, s * 10.6, -z, s); taken.push(z); } }
      for (let z = rand(4, 10); z < CHUNK_LEN - 2; z += rand(20, 24)) if (clear(taken.map((t) => [t - 3, t + 3]), z)) K.pathOfGold(b, s * 7.3, -z, s);
      K.wires(b, s * 5.0, 0, CHUNK_LEN, s);
      if (chance(0.5)) K.muniBus(b, s * 5.3, -rand(14, 66), s);
      else K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.4 });
      K.throng(b, s * 7.9, s * 12, 2, CHUNK_LEN - 2, randi(12, 18), taken.map((t) => [t - 3, t + 3]));
      for (let k = randi(0, 2); k > 0; k--) K.bin(b, s * 7.4, -rand(4, 76));
    };
    const embarcaderoSide = (b, s, wet) => {   // the Embarcadero: the promenade and its palms, the pier sheds and the bay; across the road, the lofts and Telegraph Hill
      K.kerbLane(b, s, { x1: wet ? 20 : 11.4 });
      if (wet) {
        const zp = rand(4, 22), L = rand(28, 34);
        K.pierShed(b, s, 20, zp, zp + L);
        K.quay(b, s, 20, zp + L + 0.5, CHUNK_LEN);
        if (zp > 4) K.quay(b, s, 20, 0, zp - 0.5);
        for (let k = randi(2, 4); k > 0; k--) K.sailboat(b, s * rand(26, 60), -rand(zp + L + 6, CHUNK_LEN + 20), rand(-0.4, 0.4) + Math.PI / 2, { sails: chance(0.4) });
        for (let z = rand(3, 8); z < CHUNK_LEN - 3; z += rand(13, 16)) K.palm(b, s * 12.4, -z, rand(1.3, 1.5));   // out on the promenade, the fronds clear of the track
        for (let z = rand(8, 14); z < CHUNK_LEN - 2; z += rand(24, 28)) K.lamp(b, s * 7.0, -z, s);
        for (let z = rand(10, 20); z < CHUNK_LEN - 6; z += rand(18, 26)) K.bench(b, s * 18.8, -z, -s);
        K.throng(b, s * 8, s * 18, 2, CHUNK_LEN - 2, randi(8, 13));
        for (let k = randi(1, 3); k > 0; k--) K.cyclist(b, s * rand(13.5, 16.5), -rand(6, 74), chance(0.5) ? 0 : Math.PI);
        K.farShore(b, s);
      } else {
        K.loftRow(b, s, 0, CHUNK_LEN, { x0: 11.4 });
        K.hillside(b, s, 0, CHUNK_LEN, { x0: 34, x1: 100, y1: 44 });
        K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.6 });
        pavement(b, s, { trees: false, n: [4, 8] });
      }
    };
    const cityDecor = (zone) => {
      const b = new Batcher(), W = KINDS[zone] || KINDS.east;
      let r = Math.random(), kind = W[W.length - 1][0];
      for (const [k, w] of W) { if (r < w) { kind = k; break; } r -= w; }
      // the bay lies to the right (east) of the waterfront, and the hills rise to the left: a street along a hillside
      // climbs on its left and falls away to the water on its right
      const cross = [];
      for (const s of [-1, 1]) {
        const wet = kind === 'embarcadero' && s > 0;
        if (!wet && !(kind === 'hill' && s > 0)) farGround(b, s, '#8a8478');
        if (kind === 'victorian') victorianSide(b, s);
        else if (kind === 'haight') haightSide(b, s);
        else if (kind === 'hill') { const z = hillSide(b, s, s < 0); if (z !== null) cross.push(z); }
        else if (kind === 'mission') missionSide(b, s);
        else if (kind === 'downtown') downtownSide(b, s);
        else embarcaderoSide(b, s, wet);
      }
      if (kind === 'mission' && chance(0.7)) for (const z of [rand(14, 24), rand(52, 64)]) {   // strung right across, high over the track, between two masts at the kerbs
        for (const e of [-1, 1]) { b.cyl(VC.metal, '#5a5c60', e * 7.25, 6.75, -z, 0.07, 13.5, 'cyl8'); b.sph(VC.metal, '#d8b048', e * 7.25, 13.55, -z, 0.12); }
        K.papel(b, -7.25, 7.25, 13.2, -z, { sag: 0.9 });
      }
      K.fogBank(2, 78, kind === 'embarcadero' || kind === 'hill' ? 10 : 7, { x1: kind === 'downtown' ? 11.5 : 13 });
      const g = K.flushFog(b.build());
      g.userData.kind = kind; g.userData.cross = cross;
      return g;
    };

    const B = makeBridge(K);
    const decor = (zone) => (B.zones[zone] ? B.zones[zone]() : cityDecor(zone));
    const LM = sfLandmarks(K);
    const byKey = { ...B.landmarks, ...LM.landmarks };

    // ---------- the horizon ----------
    // the Golden Gate end-on at the far end of the street, its two towers and their cables, fog pouring through under
    // them; Sutro Tower on Twin Peaks, the cross on Mt Davidson; Coit Tower on Telegraph Hill, Alcatraz and its turning
    // light, Angel Island, downtown's towers, the Bay Bridge sparkling; a ring of pastel houses on the hills, and the bay
    const stex = skyTex({ wall: '#cfc4c8', lit: ['#ffd9a0', '#fff0d0', '#ffc880', '#ffe0b0'], chance: 0.3, cols: 8, rows: 16 });
    const bayDeg = (deg, rr) => (deg > 4 && deg < 23) || (deg > 37 && deg < 62) ? rr < 1300 : false;   // open water, no houses
    const capH = (a, rr) => { const d = (a * 180) / Math.PI; return Math.abs(d) < 6 || bayDeg(d, rr) || ICONS.some(([id, ir]) => Math.abs(d - id) < 4 && rr < ir + 120) ? 0 : Math.abs(d) < 18 ? 22 : 90; };
    const sky = skyline({
      tex: stex, colors: ['#f2e6dc', '#ecdcd4', '#f4eadc', '#e4dcd6', '#f2dace', '#e0d8d4', '#f0e2e8'], count: 340, r: [560, 1000], h: [8, 34], w: [12, 24], k: 1.0,
      heightCap: capH, follow: 190,
      landmarks: [
        (b) => ridge(b, RIDGE, { r: 1360, base: -100, top: '#8a7a98', foot: '#9a8ea4', peaks: SF_PEAKS }),
        (b) => {   // the Golden Gate: the south tower, the north tower far behind it, the deck between, the cables
          const S0 = 1250, S1 = 1465, y0 = 20, y1 = 23, sc0 = 1.9, sc1 = 1.0;
          const Fs = frame(b, ...polarXZ(0, S0, y0), sc0, 0), Fn = frame(b, ...polarXZ(0, S1, y1), sc1, 0);
          ggTower(Fs, GGS, { foot: below(y0, sc0, S0), lamp: { mat: GGLAMP, col: 0xffffff } });
          ggTower(Fn, GGS, { foot: below(y1, sc1, S1), lamp: { mat: GGLAMP, col: 0xffffff } });
          b.box(GGS.paint, GGS.cDeck, 0, y0 - 5, -(S0 - 120 + 1300) / 2, 2 * GG.legX * sc0 - 4, 10, 1300 - (S0 - 120));
          b.box(GGS.paint, GGS.cDeck, 0, y1 - 3, -(1300 + 1480) / 2, 2 * GG.legX * sc1 - 2, 6, 180);
          const W = frame(b, 0, 0, 0, 1, 0);
          for (const e of [-1, 1]) {
            const a = Fs.at(e * GG.legX, GG.saddle, 0), c = Fn.at(e * GG.legX, GG.saddle, 0), anc = [e * GG.legX * sc0, y0 + 2, -(S0 - 200)], P = [], Q = [];
            for (let k = 0; k <= 10; k++) { const t2 = k / 10; P.push([anc[0], anc[1] + (a.y - anc[1]) * t2 - 30 * t2 * (1 - t2), anc[2] + (a.z - anc[2]) * t2]); }
            for (let k = 0; k <= 16; k++) { const t2 = k / 16, x = a.x + (c.x - a.x) * t2, z = a.z + (c.z - a.z) * t2, y = a.y + (c.y - a.y) * t2 - (Math.min(a.y, c.y) - y0 - 6) * 4 * t2 * (1 - t2) * 1.05; Q.push([x, y, z]); }
            cable(W, GGS.paint, GGS.cOrange, P, 1.9); cable(W, GGS.paint, GGS.cOrange, Q, 1.6);
          }
        },
        (b) => {   // Twin Peaks, Sutro Tower standing up out of the fog on them; Mt Davidson and its cross
          const [hx, hz] = polar(-32, 980); b.add(G.sphLow, SKY.dark, hx, -70, hz, 460, 320, 320, 0, 0.3, 0, '#8a8094');
          sutro(frame(b, ...polarXZ(-32, 980, 84), 0.32, polar(-32, 980)[2]), SKY, { foot: 40, lamp: { mat: LAMP, col: 0xffffff } });
          const [dx, dz] = polar(-45, 1060); b.add(G.sphLow, SKY.dark, dx, -70, dz, 380, 300, 300, 0, 0.5, 0, '#948a9c');
          const C = frame(b, ...polarXZ(-45, 1060, 76), 1.6, polar(-45, 1060)[2]); C.box(SKY.wall, SKY.cStone, 0, 16, 0, 3, 32, 3); C.box(SKY.wall, SKY.cStone, 0, 24, 0, 16, 3, 3);
        },
        (b) => {   // Telegraph Hill and Coit Tower
          const [hx, hz] = polar(9, 640); b.add(G.sphLow, SKY.dark, hx, -40, hz, 200, 150, 160, 0, 0.2, 0, '#7a8070');
          coit(frame(b, ...polarXZ(9, 640, 30), 0.85, polar(9, 640)[2]), SKY, { foot: 30 });
        },
        (b) => {   // Alcatraz out on the water, Angel Island behind it
          alcatraz(frame(b, ...polarXZ(15.5, 900, -10), 0.9, polar(15.5, 900)[2] + 0.3), SKY, { foot: 30 });
          const [ax, az] = polar(21, 1240); b.add(G.sphLow, SKY.dark, ax, -40, az, 380, 230, 300, 0, 0.4, 0, '#7a8a6a');
        },
        (b, mat) => {   // downtown: the pyramid, the obelisk and its crown, the dark granite tower, the rest of the cluster
          transamerica(frame(b, ...polarXZ(26.5, 840, 0), 0.38, polar(26.5, 840)[2]), SKY, { foot: below(0, 0.38, 840) });
          california555(frame(b, ...polarXZ(29.2, 900, 0), 0.36, polar(29.2, 900)[2] + 0.2), SKY, { foot: below(0, 0.36, 900) });
          salesforce(frame(b, ...polarXZ(33.2, 960, 0), 0.38, polar(33.2, 960)[2]), SKY, mat, { foot: below(0, 0.38, 960) });
          for (const [d, r, w, h, crown, taper] of [[24.5, 820, 30, 150, 'lit', 1], [28, 930, 34, 190, null, 0.9], [31, 870, 40, 160, 'lit', 1], [32, 1010, 36, 240, 'brace', 0.92], [34.6, 900, 32, 170, null, 1], [35.6, 980, 40, 200, 'lit', 0.95], [30, 820, 50, 110, null, 1], [36.2, 850, 44, 120, 'lit', 1], [25.5, 950, 36, 180, null, 1]])
            tower(frame(b, ...polarXZ(d, r, 0), 0.36, polar(d, r)[2] + rand(-0.3, 0.3)), SKY, mat, { w, d: w * 0.8, h, crown, taper, col: pick(['#f4ecf0', '#e8eef8', '#f2e8dc']), foot: below(0, 0.36, r) });
        },
        (b) => {   // the Bay Bridge, from the city out to Yerba Buena; the island at its far end
          const [x0, z0] = polar(38, 780), [x1, z1] = polar(57, 1180), L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
          const F = frame(b, x0, 0, z0, 1, ry);
          bayLights.push(...bayBridge(F, SKY, { L, deck: 26, H: 100 }));
          b.add(G.sphLow, SKY.dark, x1, -50, z1, 260, 170, 220, 0, 0.3, 0, '#7a7e6a');
        },
      ],
    });
    bakeShade(sky, [SKY.wall, SKY.dark, SKY.metal, SKY.paint, GGS.paint], new THREE.Vector3(-0.8, 0.35, 0.5), 0.6, 0.55);
    // The bay under the horizon, out beyond the near water to the haze: a shallow cone, low where it starts (to meet the
    // water of the streets that open onto it) and rising to the horizon, solid, drawn after the skyline's models so it
    // hides their feet under the water, never in front of the near world (which starts nearer than it). None under downtown.
    const bay = (() => {
      const pos = [], col = [], idx = [], near = new THREE.Color('#5a6c86'), far = new THREE.Color('#d8c6c6'), R = [620, 800, 1000, 1240, 1480];
      let n = 0;
      for (const [d0, d1] of [[3, 23], [37, 64]]) {
        const D = []; for (let d = d0; d <= d1; d += 2.5) D.push(Math.min(d, d1));
        for (const d of D) for (const rr of R) { const [x, z] = polar(d, rr), f = (rr - 620) / 860; pos.push(x, -29 + 15 * f, z); const c = near.clone().lerp(far, Math.pow(f, 0.7)); col.push(c.r, c.g, c.b); }
        for (let i = 0; i < D.length - 1; i++) for (let j = 0; j < R.length - 1; j++) { const a0 = n + i * R.length + j, a1 = a0 + 1, b0 = a0 + R.length, b1 = b0 + 1; idx.push(a0, b0, a1, a1, b0, b1); }
        n += D.length * R.length;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
      m.renderOrder = -4.5; m.frustumCulled = false; return m;
    })();
    sky.add(bay);
    // the haze lying along the horizon all round: thick under the eye, thinning to nothing just above it, so the feet of
    // the far city, the islands and the bridge's towers stand in fog wherever the near world opens out
    const haze = (() => {
      const g = new THREE.CylinderGeometry(540, 540, 150, 72, 6, true), P = g.attributes.position, C = new Float32Array(P.count * 4), c = new THREE.Color('#e4c8bc');
      for (let i = 0; i < P.count; i++) { const y = P.getY(i) - 69, f = Math.min(1, Math.max(0, (6 - y) / 46)); C.set([c.r, c.g, c.b, Math.pow(f, 0.8)], i * 4); P.setY(i, y); }
      g.setAttribute('color', new THREE.BufferAttribute(C, 4));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, fog: false, depthWrite: false, side: THREE.BackSide }));
      m.renderOrder = -4; m.frustumCulled = false; return m;
    })();
    sky.add(haze);
    const lights = sparkles(bayLights.flatMap((v) => [v.x, v.y, v.z]), { size: 2.4, curved: false });
    lights.material.uniforms.on.value = 1; lights.renderOrder = -4; sky.add(lights);
    const lighthouse = beacon(520, 16, 0.18, false); lighthouse.position.copy(new THREE.Vector3(...polarXZ(15.5, 900, -10)).add(new THREE.Vector3(-12 * 0.9, 50.5 * 0.9, -10 * 0.9).applyAxisAngle(new THREE.Vector3(0, 1, 0), polar(15.5, 900)[2] + 0.3))); sky.add(lighthouse);
    // fog banks: lying across the Golden Gate under its towers, pouring over the hills on the left, round Sutro's legs
    const FOG = [[0, 1180, 34, 760, 110, 1], [-7, 1220, 70, 520, 150, 1], [7, 1240, 60, 560, 130, 0.9], [-19, 1150, 90, 640, 170, 1], [-32, 940, 70, 420, 130, 1], [-44, 1050, 80, 560, 150, 0.95],
      [-58, 1120, 70, 700, 160, 0.9], [-74, 1150, 60, 700, 150, 0.85], [18, 1300, 30, 520, 70, 0.7], [48, 1350, 40, 600, 80, 0.6], [-92, 1100, 60, 700, 140, 0.8], [96, 1300, 50, 700, 110, 0.6]].map(([deg, r, y, w, h, k]) => ({ deg, r, y, w, h, k, ph: rand(0, 6.28) }));
    const fogMat = new THREE.MeshBasicMaterial({ map: fogBankTex(), fog: false, transparent: true, depthWrite: false, color: hdr('#ffffff', 1.0) });
    const fogs = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), fogMat, FOG.length);
    FOG.forEach((u, k) => fogs.setColorAt(k, new THREE.Color(u.deg < 0 ? '#ffd8c4' : '#f0e0e4').multiplyScalar(u.k)));
    fogs.frustumCulled = false; fogs.renderOrder = -3; sky.add(fogs);
    const _m4 = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
    let ggK = -1;

    // ---------- the trains ----------
    // the F-line's heritage streetcars waiting on the line, each in the colours of a city that once ran them: the
    // streamlined nose, the single headlamp, the pole hooked down along the roof; a Powell & Hyde cable car coming at
    // you, its gripman ringing the bell, riders on its outward benches and hanging off the running boards
    const LIVERY = [['#3a6a4a', '#f0e6cc', '#c8a050'], ['#e8641a', '#f2e8d0', '#3a2a24'], ['#b8202a', '#f0e6cc', '#e8c050'], ['#2a4a8a', '#c8ccd4', '#e8e8ec'], ['#e0b02a', '#2a5a3a', '#f0e6cc'], ['#5a7a3a', '#f0e8c8', '#b8302a']];
    let liv = LIVERY[0];
    const fSign = K.label('F MARKET & WHARVES', { w: 512, h: 96, color: '#ffb02a', bg: '#141414', font: SANS, weight: 700, size: 0.6, k: 1.4 });
    const pcc = (b, c) => {
      if (c.idx === 0) liv = pick(LIVERY);
      const zc = c.zb0 - c.bl / 2;
      for (const e of [-1, 1]) {
        b.box(VC.solid, liv[0], e * (TRAIN_W / 2 + 0.008), 0.95, zc, 0.02, 1.0, c.bl - 0.2);   // the lower body in the city's colour
        b.box(VC.solid, liv[0], e * (TRAIN_W / 2 + 0.008), 2.82, zc, 0.02, 0.32, c.bl - 0.2);   // the letterboard
        b.box(VC.solid, liv[2], e * (TRAIN_W / 2 + 0.012), 1.5, zc, 0.02, 0.08, c.bl - 0.3);   // the belt rail
      }
      b.box(VC.solid, liv[1], 0, TRAIN_H - 0.08, zc, TRAIN_W - 0.34, 0.1, c.bl - 0.3);
      beam(b, VC.metal, 0, TRAIN_H + 0.12, c.zb0 - c.bl + 1.4, 0, TRAIN_H + 0.42, c.zb0 - 2.6, 0.06, '#2a2a2e');   // the trolley pole, hooked down
      b.box(VC.metal, '#2a2a2e', 0, TRAIN_H + 0.12, c.zb0 - c.bl + 1.4, 0.3, 0.2, 0.3);
      if (!c.front) return;
      b.add(G.sph, VC.solid, 0, 0.98, c.z0 - 0.12, TRAIN_W - 0.06, 1.36, 0.64, 0, 0, 0, liv[0]);   // the streamlined nose, under the windscreen
      b.cyl(VC.glow, hdr('#fff4dc', 6), 0, 1.08, c.z0 + 0.2, 0.2, 0.06, 'cyl', Math.PI / 2);   // its single headlamp
      b.add(G.plane, fSign, 0, 3.0, c.z0 + 0.03, 1.5, 0.28, 1);
    };
    const cableExtra = (b, c) => {   // the cable car on the train's body: open benches in front, the closed cabin behind
      const zc = c.zb0 - c.bl / 2, g0 = c.z0 - 0.25, g1 = c.z0 - 4.0;
      for (const e of [-1, 1]) {
        const x = e * (TRAIN_W / 2);
        b.box(VC.solid, '#1e1612', x + e * 0.01, 2.25, (g0 + g1) / 2, 0.02, 1.5, g0 - g1);   // the open side: the dark under its roof
        b.box(VC.solid, '#a8743a', x + e * 0.22, 1.45, (g0 + g1) / 2, 0.42, 0.08, g0 - g1);   // the bench facing out
        for (let z = g0 - 0.5; z > g1 + 0.2; z -= 0.95) {
          b.cyl(VC.metal, '#c8a050', x + e * 0.02, 2.25, z, 0.035, 1.5, 'cyl6');   // brass stanchions
          if (chance(0.7)) K.person(b, x + e * 0.32, z + 0.4, { seated: true, y: 0.62, ry: e > 0 ? -Math.PI / 2 : Math.PI / 2, bag: false, phone: false, camera: chance(0.3) });
        }
        b.box(VC.solid, '#6a4a2a', x + e * 0.3, 0.55, zc, 0.4, 0.08, c.bl - 0.6);   // the running board
        if (chance(0.6)) K.person(b, x + e * 0.42, c.zb0 - c.bl + 2.4, { y: 0.6, ry: e > 0 ? -Math.PI / 2 : Math.PI / 2, s: 0.95, bag: false, phone: false });
        for (let z = g1 - 0.6; z > c.zb0 - c.bl + 0.8; z -= 1.15) b.box(VC.glow, hdr('#ffe0a8', 1.0), x + e * 0.012, 2.2, z, 0.03, 0.85, 0.8);   // the cabin's windows
        b.box(VC.solid, '#efe4c8', x + e * 0.008, 2.85, zc, 0.02, 0.32, c.bl - 0.2);
        for (const y of [0.72, 1.38]) b.box(VC.solid, '#d8b048', x + e * 0.014, y, zc, 0.02, 0.06, c.bl - 0.2);
      }
      b.box(VC.solid, '#f2ece0', 0, TRAIN_H + 0.1, zc, TRAIN_W - 1.0, 0.22, c.bl - 1.4);   // the clerestory
      if (!c.front) return;
      b.add(G.plane, K.label('POWELL & HYDE', { w: 512, h: 96, color: '#1a1a24', bg: '#f4f0e4', font: SANS, weight: 700, size: 0.62, k: 1.0 }), 0, 3.05, c.z0 + 0.04, 1.8, 0.34, 1);
      b.box(VC.solid, '#7a1a24', 0, 0.78, c.z0 + 0.075, TRAIN_W - 0.06, 0.7, 0.03);   // the dash, over the stock lamps: a cable car has one
      b.cyl(VC.glow, hdr('#fff0c8', 6.5), 0, 1.25, c.z0 + 0.1, 0.22, 0.06, 'cyl', Math.PI / 2);
      b.sph(VC.metal, '#d8b048', 0, 2.75, c.z0 - 1.2, 0.22);   // the bell
    };
    const trainStyle = {
      body: '#f0e6cc', bodyMetal: false, roof: '#c8ccd4', under: '#1e2026', stripe: '#f0e6cc', stripe2: null, doors: true, door: '#3a3a40',
      window: '#ffe8c0', windowK: 1.1, frame: '#14171d', light: '#fff4dc', sign: '#1a1a1a', roofUnit: '#8a909a', extra: pcc,
      rampMat: std({ map: stripeTex('#1e2026', '#ffcf8a', 6), roughness: 0.6 }), rampGlow: '#ffcf8a',
      movingStyle: { body: '#7a1a24', roof: '#e8dcc0', stripe: '#7a1a24', stripe2: null, windows: false, doors: false, strobe: false, roofUnits: false, light: '#fff0c8', sign: '#efe4c8', window: '#ffe0a8', windowK: 1.0, extra: cableExtra },
    };

    // ---------- the obstacles ----------
    // a yellow board telling drivers on the hills to curb their wheels, to slide under; a striped barricade and its cones to jump
    const curbTex = canvasTex(256, 104, (g, w, h) => {
      g.fillStyle = '#f2c200'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#141414'; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = '#141414'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `700 30px ${SANS}`; g.fillText('CURB', 154, 34);
      g.font = `700 22px ${SANS}`; g.fillText('YOUR WHEELS', 154, 68);
      g.beginPath(); g.moveTo(18, 84); g.lineTo(84, 50); g.lineTo(84, 84); g.closePath(); g.fill();   // the hill
      g.save(); g.translate(50, 56); g.rotate(-0.47); g.fillRect(-20, -12, 40, 11); g.fillRect(-12, -20, 22, 9); g.restore();   // the car on it
      g.fillStyle = '#f2c200'; for (const dx of [-12, 12]) { g.beginPath(); g.arc(50 + dx * 0.89, 56 + dx * 0.45 + 2, 4, 0, Math.PI * 2); g.fill(); }
    }, { repeat: false });
    const barrier = barrierStyle({ c1: '#ff7a1a', c2: '#ffffff', label: '', signBg: '#f2c200', signFg: '#141414', glow: '#ffb03a', post: '#e8e8ea' });
    barrier.signMat = std({ map: curbTex, roughness: 0.6, emissive: '#ffffff', emissiveMap: curbTex, emissiveIntensity: 0.3 });
    barrier.lowExtra = (b) => { for (const x of [-0.75, 0.75]) { b.add(G.cone, VC.solid, x, 0.36, 0.35, 0.36, 0.72, 0.36, 0, 0, 0, '#ff6a1a'); b.add(G.cyl, VC.solid, x, 0.42, 0.35, 0.26, 0.1, 0.26, 0, 0, 0, '#f4f4f0'); b.box(VC.solid, '#1a1a1a', x, 0.02, 0.35, 0.5, 0.04, 0.5); } };

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: ROUTE.map((k) => byKey[k]),
      zoneAt: (k) => (k < 0 ? 'east' : ZONES[k % LOOP]),
      zonePool: { east: [5, 8], west: [5, 8], forest: [2, 3], approach: [1, 1], span1: [1, 1], span2: [1, 1], span3: [1, 1], marin: [1, 1] },
      coinGeo: coinGeometry('ggtower'), coinMat: coinMaterial('#ffb050', '#ff6a1a'),
      update(t) {
        K.update(t); B.update(t); LM.update(t);
        // where the camera is on the loop: the far Golden Gate gives way to the real one as the Presidio comes up, and is
        // back once the bridge is behind; the far bay goes with it (on the bridge the sea of fog lies there instead)
        const p = ((((-sky.position.z) / CHUNK_LEN) % LOOP) + LOOP) % LOOP, f = STRETCH.first;
        const kg = 1 - smooth((p - (f - 3)) / 1.5) * (1 - smooth((p - (f + STRETCH.len)) / 1.5));
        if (kg !== ggK) { ggK = kg; GGS.paint.opacity = kg; GGS.paint.visible = kg > 0.01; GGLAMP.opacity = kg; GGLAMP.visible = kg > 0.01; bay.visible = kg > 0.5; }
        FOG.forEach((u, k) => { const [x, z, ry] = polar(u.deg + Math.sin(t * 0.02 + u.ph) * 2.5, u.r); fogs.setMatrixAt(k, _m4.compose(_p.set(x, u.y + Math.sin(t * 0.05 + u.ph) * 4, z), _q.setFromAxisAngle(_up, ry), _s.set(u.w, u.h, 1))); });
        fogs.instanceMatrix.needsUpdate = true;
        LAMP.color.set('#ff2a1a').multiplyScalar(Math.sin(t * 2.4) > 0.1 ? 3.2 : 0.35); GGLAMP.color.copy(LAMP.color);
        lights.material.uniforms.time.value = t;
        lighthouse.rotation.y = t * 0.45;
      },
    };
  },
};
