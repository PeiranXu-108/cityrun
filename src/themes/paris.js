// Paris at the blue hour in late spring: Haussmann boulevards under their plane trees, café terraces and Guimard Métro
// gates, the Seine's quays and bouquinistes, Montmartre's painters, the Marais, the formal gardens; soap bubbles and
// chestnut petals drifting down the street; Métro trains parked, an orange TGV coming at you, and the Eiffel Tower lit
// gold at the far end of the track, sweeping its searchlight round and bursting into sparkles every half minute.
import { THREE, Batcher, VC, G, std, hdr, stripeTex, canvasTex, buildingGeo, CHUNK_LEN, TRAIN_W, rand, randi, pick, chance } from '../core.js';
import { barrierStyle, coinGeometry, coinMaterial } from '../props.js';
import { makeTrack, skyline, skyTex, SKY_VC, polar, at, EDGE, farGround, textTex } from './common.js';
import { beam } from './tokyo_kit.js';
import { makeKit, eiffel, sparkles, beacon, latticeTexture, sparkleOn, WARM, WY, SERIF } from './paris_kit.js';
import { parisLandmarks } from './paris_landmarks.js';

const EYE = 4.5;
// the horizon's tower has its own materials so it can hand over to the real one on the Champ de Mars
const HZ = new THREE.MeshBasicMaterial({ map: latticeTexture(), color: hdr('#ff9428', 0.9), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
const HZ_VC = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true });
const fade = (D) => (D > 330 || D < -90 ? 1 : D > 250 ? (D - 250) / 80 : D < -40 ? (-40 - D) / 50 : 0);
// Paris is low: a level sea of zinc roofs under the domes, nothing in front of the tower
const parisClear = (a, rr) => {
  const deg = (a * 180) / Math.PI;
  if (Math.abs(deg) < 8 || (deg > -22 && deg < -6)) return EYE + rr * Math.tan(0.01);   // the tower, and Sacré-Cœur on its butte
  return EYE + rr * Math.tan(Math.abs(deg) < 30 ? 0.022 : 0.026);
};

export default {
  id: 'paris', name: '巴黎', en: 'PARIS', tagline: '光之城 · 铁塔闪耀',
  blurb: '蓝调时分的巴黎：奥斯曼大楼的铸铁阳台上开满天竺葵，咖啡馆的藤椅坐满了人，塞纳河上的游船亮着暖光，旧书摊沿着河岸一字排开。从巴黎圣母院出发，从埃菲尔铁塔的四条腿之间穿过，冲进凯旋门下飘扬的三色旗，经过卢浮宫的玻璃金字塔、蒙马特高地的圣心大教堂和红磨坊的风车、金光闪闪的亚历山大三世桥，一路跑到加尼叶歌剧院；街头飘满肥皂泡和栗树花瓣，跑道尽头的埃菲尔铁塔扫着探照灯，每隔一会儿就闪起万点白光。',
  sights: ['巴黎圣母院', '埃菲尔铁塔', '凯旋门', '卢浮宫', '蒙马特 · 红磨坊', '亚历山大三世桥', '加尼叶歌剧院'],
  accent: '#ff6aa8', accent2: '#ffc24a', portal: '#ff6aa8',
  sky: { top: '#081236', mid: '#2a3f8a', bot: '#e89a8a', glow: '#ffb48a', glowK: 0.4, sun: '#fff2dc', sunK: 0.75,
    sunDir: [0.55, 0.36, -1], sunSize: 0.001, moon: true, cloud: 0.2, cloudColor: '#6a6aa0', horizon: -0.07, stars: true },
  fog: { color: '#34407a', near: 28, far: 270 },
  light: { hemiSky: '#c0ccff', hemiGround: '#4a3a44', hemi: 0.95, dir: '#ffd0a8', dirK: 0.55, dirPos: [0.3, 0.35, -1] },
  exposure: 1.0, bloom: { strength: 0.85, radius: 0.55, threshold: 0.82 },
  weather: [
    { mode: 'rise', count: 44, colors: ['#ffd8f0', '#d8f0ff', '#fff4c8', '#e0d8ff'], size: 0.95, k: 1.0, box: [50, 16, 110], speed: 0.16, shape: 7 },
    { mode: 'fall', count: 200, colors: ['#ffffff', '#fff6f0', '#ffeef4'], size: 0.3, k: 1.05, box: [46, 18, 90], speed: 0.55, shape: 2 },
  ],
  coin: 'eiffel', music: 'paris', jingle: 'scintille',

  build() {
    const K = makeKit();
    const LM = parisLandmarks(K);
    const paves = canvasTex(128, 128, (g, w, h) => {   // granite setts laid in fans (pavés en éventail)
      g.fillStyle = '#26262c'; g.fillRect(0, 0, w, h);
      for (let fy = -16; fy < h + 32; fy += 32) for (let fx = ((fy / 32) % 2 ? 16 : 0) - 32; fx < w + 32; fx += 32) {
        for (let r = 30; r > 2; r -= 5) for (let a = Math.PI; a < Math.PI * 2; a += 5.2 / r) {
          const v = randi(-10, 10), x = fx + Math.cos(a) * r, y = fy + 32 + Math.sin(a) * r;
          g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2);
          g.fillStyle = `rgb(${88 + v},${86 + v},${92 + v})`; g.fillRect(-2.2, -1.8, 4.4, 3.6);
          g.restore();
        }
      }
    });
    paves.repeat.set(1, 24);
    const track = makeTrack({ gravel: '#2e3036', spots: ['#3a3c44', '#1e2026', '#4a4c54'], sleeper: '#3a3430', rail: '#c9ced8', railMatte: true,
      edge: '#ffc24a', edgeK: 1.5, sideMat: std({ map: paves, roughness: 0.75 }) });

    // ---------- the street kinds ----------
    const boulevard = (b, s) => {   // a Haussmann boulevard: plane trees in their grilles, lamps, bollards, terraces, kiosks
      K.haussRow(b, s, 0, CHUNK_LEN);
      const zm = chance(0.25) ? rand(12, 66) : -99;
      for (let z = rand(3, 7); z < CHUNK_LEN - 2; z += rand(9.5, 11.5)) {
        if (Math.abs(z - zm) < 4.5) continue;
        const tx = s * (EDGE + 4.0);
        if (chance(0.75)) K.plane(b, tx, -z, rand(0.95, 1.1)); else K.marronnier(b, tx, -z, rand(0.95, 1.1));
        K.grille(b, tx, -z);
      }
      for (let z = rand(7, 11); z < CHUNK_LEN - 4; z += 14) if (Math.abs(z - zm) > 3.5) K.lamp(b, s * (EDGE + 1.0), -z, chance(0.5));
      for (let z = 2; z < CHUNK_LEN; z += 4.5) K.bollard(b, s * (EDGE + 0.35), -z);
      if (zm > 0) K.metro(b, s * (EDGE + 4.6), -zm);
      const r = Math.random(), zf = -rand(8, 72);
      if (r < 0.3) K.morris(b, s * (EDGE + 4.8), zf);
      else if (r < 0.5) K.wallace(b, s * (EDGE + 4.8), zf);
      else if (r < 0.7) K.kiosk(b, s * (EDGE + 4.8), zf, s);
      if (chance(0.3)) K.velib(b, s * (EDGE + 2.0), -rand(12, 68), s, randi(4, 7));
      if (chance(0.3)) K.scooter(b, s * (EDGE + 1.6), -rand(10, 70));
      if (chance(0.15)) K.mime(b, s * (EDGE + 4.6), -rand(14, 66), s);
      else if (chance(0.15)) K.accordionist(b, s * (EDGE + 5.0), -rand(14, 66), s);
      K.crowd(b, s * (EDGE + 1.3), s * (EDGE + 6.6), 2, CHUNK_LEN - 2, randi(6, 12));
    };
    const quaySide = (b, s) => {   // the Seine: bouquinistes on the parapet, a boat, perhaps a bridge, the far bank's lights
      K.quay(b, s, 0, CHUNK_LEN);
      for (let z = rand(4, 8); z < CHUNK_LEN - 2; z += 12) K.lamp(b, s * (EDGE + 6.5), -z);
      for (let z = rand(6, 10); z < CHUNK_LEN - 2; z += rand(10, 13)) K.plane(b, s * (EDGE + 3.8), -z, rand(0.95, 1.1));
      const bz = chance(0.35) ? -rand(58, 70) : 0;
      if (bz) K.bridge(b, s, bz);
      if (chance(0.75)) K.bateau(b, s * rand(25, 42), bz ? -rand(20, 36) : -rand(18, 62));
      b.box(VC.solid, '#8e836e', s * 108, WY / 2 + 0.4, -40, 2, -WY + 0.8, 80);
      b.box(VC.solid, '#34343c', s * 139, WY / 2, -40, 60, -WY, 80);   // the far bank, under its buildings
      for (let k = randi(4, 6); k > 0; k--) {
        const x = s * rand(118, 160), z = -rand(6, 74);
        b.addM(buildingGeo(rand(12, 18), 19.8, rand(14, 20), K.hauss, 2.6, 3.3), K.haussMat, at(x, 0, z), '#ffffff');
        K.refl(b, x - s * 6, z, 80, 2.4, pick(['#ffd9a0', '#ffe6c0', '#ffcf8a', '#fff0d8']));
      }
      for (let z = 4; z < 78; z += 8) { const x = s * 108; b.cyl(VC.metal, '#1c2622', x, 1.45, -z, 0.05, 1.3, 'cyl6'); b.sph(VC.glow, hdr('#ffd9a0', 2), x, 2.3, -z, 0.3, true); K.refl(b, x, -z, 60, 1.2, '#ffd9a0'); }
      K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 5.8), 2, CHUNK_LEN - 2, randi(4, 8));
      if (chance(0.3)) K.painter(b, s * (EDGE + 5.2), -rand(10, 70), s);
    };
    const gardenSide = (b, s) => {   // a formal garden behind its gilded railings
      K.garden(b, s, 0, CHUNK_LEN);
      for (let z = rand(5, 9); z < CHUNK_LEN - 2; z += 13) K.lamp(b, s * (EDGE + 1.0), -z, true);
      for (let z = rand(10, 14); z < CHUNK_LEN - 4; z += 18) K.bench(b, s * (EDGE + 5.6), -z, s);
      K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 5.4), 2, CHUNK_LEN - 2, randi(3, 7));
    };
    const montStreet = (b, s) => {   // Montmartre's lanes: pastel houses, painters at their easels, an accordion
      K.montRow(b, s, 0, CHUNK_LEN);
      for (let z = 2; z < CHUNK_LEN; z += 5) K.bollard(b, s * (EDGE + 0.35), -z);
      for (let k = chance(0.6) ? randi(1, 3) : 0; k > 0; k--) K.painter(b, s * (EDGE + rand(3.8, 5.2)), -rand(8, 72), s);
      if (chance(0.3)) K.accordionist(b, s * (EDGE + 5.0), -rand(10, 70), s);
      if (chance(0.25)) K.scooter(b, s * (EDGE + 1.6), -rand(10, 70));
      K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 5.6), 2, CHUNK_LEN - 2, randi(5, 9));
    };
    const maraisStreet = (b, s) => {   // the Marais: old stone and timber, pâtisseries and hanging signs, bikes, the odd 2CV
      K.maraisRow(b, s, 0, CHUNK_LEN);
      for (let z = 2; z < CHUNK_LEN; z += 4) K.bollard(b, s * (EDGE + 0.35), -z);
      if (chance(0.4)) K.car(b, s * (EDGE + 1.6), -rand(10, 70), '2cv');
      if (chance(0.3)) K.scooter(b, s * (EDGE + 1.4), -rand(10, 70));
      if (chance(0.2)) K.mime(b, s * (EDGE + 4.0), -rand(14, 66), s);
      K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 5.6), 2, CHUNK_LEN - 2, randi(7, 12));
    };
    const decor = () => {
      const b = new Batcher();
      const r = Math.random(), kind = r < 0.36 ? 'boulevard' : r < 0.56 ? 'quai' : r < 0.72 ? 'montmartre' : r < 0.88 ? 'marais' : 'jardin';
      const wet = pick([-1, 1]);
      for (const side of [-1, 1]) {
        if (kind === 'quai' && side === wet) { quaySide(b, side); continue; }
        if (kind === 'jardin' && side === wet) { gardenSide(b, side); continue; }
        farGround(b, side, '#1c1e26');
        if (kind === 'montmartre') montStreet(b, side);
        else if (kind === 'marais') maraisStreet(b, side);
        else boulevard(b, side);
      }
      if (kind === 'montmartre' && chance(0.7)) for (const z of [14, 34, 54, 74]) if (chance(0.7)) K.festoon(b, -z, 7.6, 0.6, 10.9);
      if (kind === 'marais' && chance(0.35)) for (const z of [20, 50]) K.festoon(b, -z, 8.4, 0.5, 10.5);
      return b.build();
    };

    // ---------- the horizon ----------
    let hz = null;
    const sky = skyline({
      tex: skyTex({ wall: '#0b0d1e', lit: WARM, chance: 0.34 }),
      colors: ['#ffffff', '#d8d0ff', '#c8c0e6', '#b0b0d8'], count: 210, h: [22, 60], w: [40, 90], k: 1.5,
      heightCap: parisClear, follow: 190,
      landmarks: [
        (b) => { hz = eiffel(b, { lattice: HZ, solid: HZ_VC, gold: hdr('#ffb04a', 1.3), bright: hdr('#ffd880', 1.8), x: 0, y: -40, z: -1050, s: 0.92, seg: 9, cell: 11, density: 0.022 }); },
        (b) => {   // Sacré-Cœur white on the butte, seen down the streets to the left of the tower
          const [x, z, ry] = polar(-13, 720), ux = Math.cos(ry), uz = -Math.sin(ry), P = (dx) => [x + ux * dx, z + uz * dx];
          b.add(G.sph, SKY_VC, x, -40, z, 260, 110, 160, 0, ry, 0, '#141a26');
          const c = hdr('#f6f2e8', 0.95), [mx, mz] = P(0);
          b.add(G.box, SKY_VC, mx, 18, mz, 30, 16, 24, 0, ry, 0, c);
          b.add(G.cyl, SKY_VC, mx, 31, mz, 11, 10, 11, 0, 0, 0, c);
          b.add(G.sph, SKY_VC, mx, 38, mz, 13, 22, 13, 0, 0, 0, c);
          b.cyl(SKY_VC, c, mx, 50, mz, 1.4, 4);
          for (const dx of [-11, 11]) { const [px, pz] = P(dx); b.add(G.sph, SKY_VC, px, 28, pz, 6, 9, 6, 0, 0, 0, c); }
          const [tx, tz] = P(19); b.add(G.box, SKY_VC, tx, 32, tz, 6, 26, 6, 0, ry, 0, c); b.add(G.sph, SKY_VC, tx, 46, tz, 5.5, 7, 5.5, 0, 0, 0, c);
          b.sph(SKY_VC, hdr('#ffd880', 3), mx, 53, mz, 1.1, true);
        },
        (b, mat) => {   // the Tour Montparnasse, dark, its top lit
          const [x, z, ry] = polar(24, 950);
          b.addM(buildingGeo(46, 205, 30, { cols: 8, rows: 16 }, 3.4, 4.2), mat, at(x, -95, z, ry), '#565a74');
          b.add(G.box, SKY_VC, x, 111, z, 47, 2.4, 31, 0, ry, 0, hdr('#cfe0ff', 1.1));
          b.sph(SKY_VC, hdr('#ff2a2a', 6), x, 117, z, 2, true);
        },
        (b, mat) => {   // La Défense far off on the left: glass towers round the Grande Arche
          const [ax, az, ary] = polar(-60, 1150);
          for (const [dx, w, h] of [[-60, 40, 230], [-20, 34, 280], [70, 44, 250], [110, 30, 200], [150, 38, 300]]) {
            const x = ax + Math.cos(ary) * dx, z = az - Math.sin(ary) * dx;
            b.addM(buildingGeo(w, h, w, { cols: 8, rows: 16 }, 3.4, 4.2), mat, at(x, -95, z, ary), pick(['#c8d4ff', '#a8b8e0', '#d8e0ff']));
          }
          const c = hdr('#e8ecff', 0.9);
          for (const dx of [20, 50]) b.add(G.box, SKY_VC, ax + Math.cos(ary) * dx, 20, az - Math.sin(ary) * dx, 8, 230, 40, 0, ary, 0, c);
          b.add(G.box, SKY_VC, ax + Math.cos(ary) * 35, 130, az - Math.sin(ary) * 35, 38, 10, 40, 0, ary, 0, c);
        },
        (b) => {   // the gilded dome of the Invalides
          const [x, z] = polar(12, 820);
          b.add(G.cyl, SKY_VC, x, -10, z, 40, 70, 40, 0, 0, 0, '#3a3a52');
          b.add(G.sph, SKY_VC, x, 30, z, 34, 40, 34, 0, 0, 0, hdr('#ffbf48', 1.1));
          b.add(G.cone8, SKY_VC, x, 58, z, 4, 18, 4, 0, 0, 0, hdr('#ffd880', 1.6));
        },
        (b) => {   // the Panthéon's dome on its colonnaded drum
          const [x, z] = polar(36, 880);
          b.add(G.cyl, SKY_VC, x, -20, z, 60, 80, 60, 0, 0, 0, '#3a3a52');
          b.add(G.cyl, SKY_VC, x, 30, z, 32, 22, 32, 0, 0, 0, hdr('#f0e2c0', 0.7));
          b.add(G.sph, SKY_VC, x, 44, z, 30, 26, 30, 0, 0, 0, hdr('#c8c4c0', 0.6));
          b.add(G.cyl8, SKY_VC, x, 60, z, 4, 8, 4, 0, 0, 0, hdr('#f0e2c0', 0.8));
        },
        (b) => {   // Notre-Dame's towers and spire to the left
          const [x, z, ry] = polar(-28, 760);
          const c = hdr('#e8d8b0', 0.65);
          for (const dx of [-11, 11]) b.add(G.box, SKY_VC, x + Math.cos(ry) * dx, 10, z - Math.sin(ry) * dx, 14, 110, 14, 0, ry, 0, c);
          b.add(G.box, SKY_VC, x, -10, z, 36, 90, 20, 0, ry, 0, hdr('#d8c8a0', 0.55));
          b.add(G.cone8, SKY_VC, x - Math.sin(ry) * 40, 60, z - Math.cos(ry) * 40, 5, 40, 5, 0, 0, 0, hdr('#9aa0b8', 0.8));
          b.cyl(SKY_VC, hdr('#ffc870', 1.6), x, 28, z, 4, 0.8);
        },
        (b) => {   // the far quays: lights scattered in the haze
          for (let k = 0; k < 130; k++) {
            const deg = rand(-75, 75);
            if (Math.abs(deg) < 6) continue;
            const [x, z] = polar(deg, 560);
            b.add(G.box, SKY_VC, x, rand(2, 22), z, rand(1.2, 3), rand(0.8, 2), 0.5, 0, (-deg * Math.PI) / 180, 0, hdr(pick(['#ffd9a0', '#fff0d0', '#ffcf8a', '#cfe6ff']), rand(1.0, 1.8)));
          }
        },
      ],
    });
    const hzSp = sparkles(hz.pts, { size: 4.2, curved: false }), hzBeam = beacon(720, 26, 0.16, false);
    hzBeam.position.set(...hz.top);
    hzSp.renderOrder = -4; hzBeam.children.forEach((m) => (m.renderOrder = -4));
    sky.add(hzSp, hzBeam);

    // Paris Métro trains parked (white, teal and navy bands, the yellow M); an orange TGV comes at you
    const trainStyle = {
      body: '#eef0f2', bodyMetal: false, roof: '#cfd4d8', under: '#1a1c20', stripe: '#00a0a0', stripe2: '#1a3a8a', doors: true, door: '#5a6670',
      window: '#eaf4ff', windowK: 1.5, frame: '#16181e', light: '#f4f8ff', sign: '#7cf8d8', roofUnit: '#9aa0a8', badge: '#f2c230',
      rampMat: std({ map: stripeTex('#1e2026', '#ffcc00', 6), roughness: 0.6 }), rampGlow: '#ffc24a',
      extra: (b, c) => {   // the dark cab front with its teal chevron
        if (!c.front) return;
        b.box(VC.solid, '#1e2a34', 0, 1.0, c.z0 + 0.025, TRAIN_W - 0.1, 1.1, 0.01);
        for (const sx of [-1, 1]) b.add(G.box, VC.solid, sx * 0.5, 1.02, c.z0 + 0.035, 1.1, 0.12, 0.01, 0, 0, sx * 0.35, '#00a0a0');
      },
      movingStyle: { body: '#e8661a', bodyMetal: false, roof: '#d8dadc', stripe: '#f4f2ee', stripe2: '#3a3a40', nose: 'bullet', frame: '#2a2a30',
        window: '#ffe6c0', windowK: 1.3, doors: false, light: '#ffffff', sign: '#ffd23d', extra: null },
    };

    // Guimard's Métro gate to slide under (its lamp stems and orange eyes over the METROPOLITAIN sign); roadworks to jump
    const barrier = barrierStyle({ c1: '#2f5a3e', c2: '#e8b04a', label: 'METROPOLITAIN', signBg: '#e8b04a', signFg: '#1e4a30', glow: '#ff7a2a', post: '#2f5a3e' });
    const gm = textTex('METROPOLITAIN', { w: 512, h: 192, color: '#1e4a30', bg: '#e8b04a', font: SERIF, weight: 700, size: 0.4, border: '#1e4a30' });
    barrier.signMat = std({ map: gm, roughness: 0.5, emissive: '#ffffff', emissiveMap: gm, emissiveIntensity: 0.3 });   // the stock sign's type is too big for the word
    barrier.highExtra = (b) => {
      for (const sx of [-1, 1]) {
        const x = sx * 1.15, P = [[x, 2.85, 0], [x - sx * 0.02, 3.35, 0], [x - sx * 0.16, 3.75, 0], [x - sx * 0.38, 3.9, 0]];
        for (let k = 0; k < P.length - 1; k++) beam(b, VC.metal, ...P[k], ...P[k + 1], 0.09, '#2f5a3e');
        b.add(G.sph, VC.glow, x - sx * 0.46, 3.68, 0, 0.22, 0.34, 0.22, 0, 0, 0, hdr('#ff7a2a', 3));
      }
      b.box(VC.metal, '#2f5a3e', 0, 2.82, 0, 2.5, 0.08, 0.08);
    };
    barrier.lowBarMat = std({ map: stripeTex('#d8202a', '#ffffff', 6), roughness: 0.6 });
    const devTex = canvasTex(256, 128, (g, w, h) => {   // a yellow roadworks sign: DÉVIATION and its arrow
      g.fillStyle = '#f2c230'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#141414'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = '#141414'; g.font = '900 38px "Russo One", "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('DÉVIATION', w / 2, 44);
      g.fillRect(64, 84, 104, 14); g.beginPath(); g.moveTo(166, 72); g.lineTo(198, 91); g.lineTo(166, 110); g.closePath(); g.fill();
    }, { repeat: false });
    const devMat = std({ map: devTex, roughness: 0.5, emissive: '#ffffff', emissiveMap: devTex, emissiveIntensity: 0.3 });
    barrier.lowExtra = (b) => {
      b.box(VC.metal, '#888888', 0, 1.15, 0, 0.05, 0.3, 0.05);
      b.add(G.plane, devMat, 0, 1.6, 0.035, 0.9, 0.45, 1);
      b.add(G.plane, devMat, 0, 1.6, -0.035, 0.9, 0.45, 1, 0, Math.PI, 0);
    };

    return {
      track, decor, skyline: sky, trainStyle, barrier,
      landmarks: LM.landmarks,
      coinGeo: coinGeometry('eiffel'), coinMat: coinMaterial('#ffd04a', '#ffa000'),
      update(t) {
        K.update(t);
        // the horizon's tower gives way to the real one as the Champ de Mars comes up, and comes back once it is passed
        const ch = LM.landmarks[1].obj && LM.landmarks[1].obj.parent;
        const kH = ch && ch.parent ? fade(sky.position.z - ch.position.z + 40) : 1;
        HZ.opacity = HZ_VC.opacity = kH; HZ.visible = HZ_VC.visible = kH > 0.01;
        hzSp.material.uniforms.time.value = t; hzSp.material.uniforms.on.value = sparkleOn(t) * kH; hzSp.visible = kH > 0.01;
        hzBeam.rotation.y = t * 0.55; hzBeam.children[0].material.opacity = kH; hzBeam.visible = kH > 0.01;
        LM.update(t, 1 - kH);
      },
    };
  },
};
