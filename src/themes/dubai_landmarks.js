// Dubai's landmark scenes downtown and in the old town (the coast's and the desert's are in dubai_coast.js): the Dubai
// Frame in Zabeel Park, the track running through it with Burj Khalifa framed in it on the horizon; the Museum of the
// Future on its hill by the Metro and the Emirates Towers over Sheikh Zayed Road; Burj Khalifa itself over its lake and the
// Dubai Fountain dancing, the mall and Souk Al Bahar, the crowd at the rail with their phones up; the Opera's dhow of glass
// and the Address Sky View's bridge; the water canal running under Sheikh Zayed Road's bridge and its waterfall (which
// stops for a boat), the twisting steel footbridge; Al Fahidi Fort with its round tower and its dhow; the creek's abra
// station, the abras crossing to Deira's wharves; the spice souk; the Gold Souk under its timber roof, City of Gold.
// Big buildings stand back from the track; anything over it is 14 m up or more (the jetpack's camera passes under).
import { THREE, Batcher, VC, G, std, basic, hdr, curve, buildingGeo, canvasTex, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { at, EDGE, farGround } from './common.js';
import { beam } from './tokyo_kit.js';
import { frame } from './ny_icons.js';
import { sparkles } from './paris_kit.js';
import { KERB, X0, face, SOUK_SIGNS, BLVD_SIGNS, DEIRA_SIGNS } from './dubai_kit.js';
import { WY, LAKE_X } from './dubai_build.js';
import { burjKhalifa, emiratesTowers, museumOfFuture, dubaiFrame, dubaiOpera, addressSkyView, theOpus, fahidiFort, plainTower, BK, frameTex, calligraphy } from './dubai_icons.js';
import { ledMaterial } from './dubai_show.js';

// the scenes' style for the icons: lit, in the fog
export function sceneStyle(K) {
  if (K.SS) return K.SS;
  const ft = frameTex(), cal = calligraphy();
  K.SS = {
    wall: VC.solid, glow: VC.glow, metal: VC.metal, dark: VC.solid, red: K.blinkRed, green: VC.solid,
    glass: std({ color: '#ffffff', vertexColors: true, metalness: 0.75, roughness: 0.18 }),
    gold: std({ map: ft, vertexColors: true, metalness: 0.7, roughness: 0.32, emissive: '#ffffff', emissiveMap: ft, emissiveIntensity: 0.38 }),
    sail: basic({ vertexColors: true, color: hdr('#ffffff', 1) }),
    steel: std({ map: cal.map, metalness: 0.8, roughness: 0.3, emissive: '#ffffff', emissiveMap: cal.glow, emissiveIntensity: 1.6 }),
    win: K.glassM[0], winTex: K.glassT[0],
    cWhite: '#f2f0ec', cGlass: '#5a6a88', cGlassHi: '#8a9ab8', cGlassDark: '#2a3040', cSteel: '#c8ccd4', cBand: hdr('#ffe2b0', 1.6), cTip: hdr('#ffffff', 3), cLobby: hdr('#ffe2b0', 1.6),
    cWin: hdr('#ffd9a0', 1.5), cEdge: hdr('#e8f0ff', 2.2), cRed: 0xffffff, cSail: hdr('#ffffff', 1), cPad: hdr('#c8ffd8', 1.6), cStone: '#e8dcc4', cStoneHi: '#f4ecdc', cGold: '#ffffff',
    cCrown: hdr('#ffd9a0', 2.2), cRes: '#ece6dc', cCoral: '#e8a890', cCoralHi: '#f2bca4', cArch: hdr('#ffc880', 0.95), cWave: '#6a9ad8', cBall: hdr('#e8f0ff', 1.8), cOpera: hdr('#ffd9a0', 1.6),
    cGreen: '#3a6a34', cCrane: '#e8c030', cDoor: '#3a2410', cGoldK: '#d8b048',
  };
  return K.SS;
}

export function dubaiLandmarks(K) {
  const SS = sceneStyle(K);
  const waterJets = [], golds = [];   // the scenes' moving parts, updated while their scene is in use
  const done = (b, extra = []) => { const g = K.flush(b.build()); for (const m of extra) g.add(m); return g; };
  const plaque = (b, ar, en, x, y, z, s, w = 4, o = {}) => K.bi(b, ar, en, { w: 512, h: 160, color: '#ffe8b0', bg: '#2a1c10', border: '#c8a050', ...o }, x, y, z, w, w * 0.31, 1, 0, face(s), 0);

  // ---------- the Dubai Frame ----------
  // Zabeel Park: lawns, the lake, palms and flower beds; the Frame's gold legs standing either side of the track, its
  // bridge 63 m up, Burj Khalifa in the opening on the horizon; the queue at the pavilion under each leg
  const frameScene = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) {
      farGround(b, s, '#2a3424');
      K.pave(b, s * (EDGE + 2), -CHUNK_LEN / 2, 4, CHUNK_LEN);
      K.lawn(b, s * (EDGE + 30), -CHUNK_LEN / 2, 52, CHUNK_LEN, '#3e6a32', 0.03);
      for (let z = 4; z < CHUNK_LEN; z += rand(9, 12)) { if (Math.abs(z - 62) < 6) continue; K.datePalm(b, s * (EDGE + 4.5), -z, rand(0.75, 0.95), { lit: true }); }
      for (let k = 0; k < 4; k++) K.flowerBed(b, s * rand(EDGE + 9, EDGE + 24), -rand(6, 50), rand(3, 6), rand(2, 3));
      for (let z = rand(8, 14); z < CHUNK_LEN; z += rand(18, 24)) K.lamp(b, s * (EDGE + 6.4), -z, s, { kind: 'lantern' });
      for (let k = 0; k < 4; k++) { const x = s * rand(EDGE + 12, EDGE + 40), z = -rand(6, 70); K.person(b, x, z, { outfit: pick(['kandura', 'abaya', 'casual']), pose: 'seated', ry: rand(0, 6) }); K.person(b, x + 1.2, z, { outfit: 'casual', pose: 'seated', ry: rand(0, 6), s: 0.62 }); b.add(G.plane, K.carpetMat, x + 0.6, 0.05, z, 2.4, 1.8, 1, -Math.PI / 2, 0, 0); }   // families on their rugs
      K.throng(b, s * (EDGE + 1.0), s * (EDGE + 3.5), 1, CHUNK_LEN - 1, randi(8, 12), { mix: K.MIX.blvd });
      // the pavilion at the foot of the leg, the queue
      const px = s * 13.6;
      b.block(VC.solid, '#e8e2d4', px, 0, -54, 9, 4, 6); b.box(VC.glow, hdr('#ffe8c0', 1.4), px - s * 4.55, 2, -54, 0.1, 3, 5.4);
      K.queue(b, px - s * 6, -58, randi(5, 9), 0.62, { mix: K.MIX.blvd });
      plaque(b, 'برواز دبي', 'DUBAI FRAME', px - s * 4.6, 4.8, -51, s);
    }
    K.waterPlane(b, -(EDGE + 22), -(EDGE + 60), 8, 44, 0.06);   // the park's lake
    for (let k = 0; k < 7; k++) b.add(G.cyl, VC.glowAdd, -(EDGE + 30 + k * 3), 2, -26, 0.4, 4, 0.4, 0, 0, 0, hdr('#d8f0ff', 0.7));   // its fountain's jets
    dubaiFrame(frame(b, 0, 0, -62, 0.34, 0), { ...SS, glass: SS.glass });   // (51 m: from 120 m out Burj Khalifa stands inside it)
    return done(b);
  };

  // ---------- the Museum of the Future and the Emirates Towers ----------
  // the Metro's viaduct and its golden station on the left, the museum's ring of calligraphy on its green hill behind it; a
  // skywalk over the track; Sheikh Zayed Road's lanes on the right and the two triangular towers over them
  const futureScene = () => {
    const b = new Batcher();
    farGround(b, -1, '#2a2622'); farGround(b, 1, '#2a2622');
    K.kerbLane(b, -1, 0, CHUNK_LEN, { x1: 26 });
    K.viaduct(b, -15, 0, CHUNK_LEN); K.station(b, -15, -38, -1);
    museumOfFuture(frame(b, -52, 0, -48, 0.62, 0), SS);
    plaque(b, 'متحف المستقبل', 'MUSEUM OF THE FUTURE', -(EDGE + 6), 3.2, -60, -1, 5);
    const xe = K.highway(b, 1, 0, CHUNK_LEN, { lanes: 4 });
    K.pave(b, xe + 4, -CHUNK_LEN / 2, 8, CHUNK_LEN);
    emiratesTowers(frame(b, 50, 0, -70, 0.42, -0.5), SS);
    K.gantry(b, EDGE + 1.2, xe - 0.4, -18);
    K.skywalk(b, -12, { x0: -15, x1: xe + 2 });
    K.palmRow(b, -(KERB + 1.0), 0, CHUNK_LEN, { step: [12, 15], lit: true });
    K.throng(b, -(KERB + 1.6), -24, 1, CHUNK_LEN - 1, randi(14, 20), { mix: K.MIX.blvd });
    K.backRow(b, -1, { x0: 80 }); K.backRow(b, 1, { x0: 90 });
    return done(b);
  };

  // ---------- Burj Khalifa and the Dubai Fountain ----------
  // the boardwalk along the lake on the left, the crowd at its rail; the fountain's jets in a long curve on the water
  // rising and swaying to its show; Souk Al Bahar's arcades on their island and the footbridge out to it; the tower across
  // the lake, its LEDs playing, the Address Downtown beside it; the mall on the right
  const N_JET = 34, jetGeo = new THREE.CylinderGeometry(0.12, 0.5, 1, 8, 1, true).translate(0, 0.5, 0);
  const jetTex = canvasTex(32, 128, (g, w, h) => {   // a jet: bright at its foot, thinning to spray at its tip, streaked
    const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(0,0,0,${rand(0.2, 0.6)})`; g.fillRect(rand(0, w), 0, rand(1, 3), h); }
  }, { repeat: false });
  const jetMat = basic({ map: jetTex, color: hdr('#eef6ff', 0.95), transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide });   // (not additive: seen along the curve, the jets overlap by the dozen)
  // Burj Khalifa stands across the lake two chunks on (dubai.js's lake chunks keep the water open all the way), at 116 m
  // small enough to stand whole in the view from the boardwalk; its LEDs play the horizon's programmes; unfogged, being
  // 240 m off, so its spire stays sharp
  const TOWER = [-110, 0.2, -222], TS = 0.14;
  const towerLed = ledMaterial({ base: TOWER, H: BK.H * TS, curved: true });
  const towerS = { ...SS, glass: towerLed, metal: basic({ vertexColors: true, fog: false, transparent: true }), glow: basic({ vertexColors: true, fog: false, transparent: true }) };   // (fading with its LEDs)
  const fountainScene = () => {
    const b = new Batcher();
    farGround(b, 1, '#2a2622');
    // the near shore, as along the rest of the lake: the boardwalk, its rail, the crowd at it with their phones up
    b.box(VC.solid, '#6a4a30', -(EDGE + 3), 0.02, -CHUNK_LEN / 2, 6, 0.08, CHUNK_LEN);
    for (let z = 0; z < CHUNK_LEN; z += 2.2) b.box(VC.metal, '#c8ccd0', -(EDGE + 6), 0.55, -z, 0.06, 1.1, 0.06);
    b.box(VC.metal, '#c8ccd0', -(EDGE + 6), 1.1, -CHUNK_LEN / 2, 0.08, 0.08, CHUNK_LEN);
    for (let k = 0; k < 26; k++) K.person(b, -(EDGE + rand(4.4, 5.6)), -rand(2, 78), { outfit: pick(['tourist', 'tourist', 'casual', 'kandura', 'abaya']), pose: pick(['camera', 'phone', 'phone', 'stand']), ry: Math.PI / 2 + rand(-0.4, 0.4) });   // watching the show, phones up
    K.throng(b, -(EDGE + 1), -(EDGE + 3.6), 1, CHUNK_LEN - 1, randi(8, 12), { mix: K.MIX.blvd });
    for (let z = 6; z < CHUNK_LEN; z += 18) K.lamp(b, -(EDGE + 1.2), -z, -1, { kind: 'lantern' });
    plaque(b, 'نافورة دبي', 'THE DUBAI FOUNTAIN', -(EDGE + 0.4), 2.4, -30, -1, 4.6);
    K.waterPlane(b, -(EDGE + 6), -LAKE_X, 0, CHUNK_LEN, -0.8);
    K.farBank(b, -1, LAKE_X, 90);
    for (let k = 0; k < 3; k++) K.abra(b, -rand(EDGE + 110, EDGE + 160), -0.7, -rand(10, 70), { ry: rand(0, 6) });
    // Souk Al Bahar on its island out in the lake, its arcades lit, a wind tower or two over them; the footbridge out to it
    b.box(VC.solid, '#b8ac98', -88, -0.4, -24, 40, 0.9, 44);
    K.pave(b, -88, -24, 38, 42, 0.06);
    K.arabesqueRow(b, -1, 8, 44, { x0: 72, cafes: 0 });
    for (const z of [-15, -33]) K.windTower(b, -80, 12.2, z, { h: 6, w: 3.2, col: '#e8d4b0' });
    b.box(VC.solid, '#d8d0c0', -(EDGE + 6 + 29), 0.5, -3, 58, 0.4, 3);   // (at the near end, clear of the jets)
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#ffd9a0', 1.6), -(EDGE + 6 + 29), 1.1, -3 + e * 1.45, 58, 0.08, 0.08);
    // the tower on its island: the podium and its park, palms in lights round it; the Address Downtown beside it
    const [tx, ty, tz] = TOWER;
    b.cyl(VC.solid, '#cfc2a8', tx, -0.35, tz, 16, 1.1, 'cyl'); b.cyl(VC.solid, '#3e6a32', tx, ty + 0.02, tz, 14.5, 0.06, 'cyl');
    b.cyl(VC.solid, '#cfc2a8', tx - 30, -0.35, tz + 14, 9, 1.1, 'cyl');
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; K.datePalm(b, tx + Math.cos(a) * 13.5, tz + Math.sin(a) * 13.5, rand(0.8, 1.0), { lit: true, y: ty }); }
    burjKhalifa(frame(b, tx, ty, tz, TS, 0.3), towerS, { led: towerLed });
    plainTower(frame(b, tx - 30, ty, tz + 14, 0.3, 0.2), SS, { w: 36, d: 36, h: 150, crown: 'spire', col: '#8a9ab8' });
    // the right: the mall's long facade and its sign, palms, the Address Boulevard
    K.kerbLane(b, 1, 0, CHUNK_LEN, { x1: 22 });
    K.jam(b, EDGE + 1.55, 0, CHUNK_LEN, 1, { fill: 0.5, mix: { lux: 3, super: 3, suv: 4, taxi: 3, police: 0.5 } });
    b.addM(K.tiledBox(40, 26, 76, 2.8), K.stuccoMat, at(44, 13, -40), '#e8d8bc');   // its long stone facade
    b.box(VC.glow, hdr('#ffe8c0', 0.85), 23.9, 2.5, -40, 0.2, 4, 74);   // its lit shopfronts
    K.bi(b, 'دبي مول', 'THE DUBAI MALL', { w: 768, h: 192, color: '#f4e8c8', font: '"Noto Kufi Arabic", sans-serif', enFont: '"Playfair Display", serif' }, 23.6, 15, -40, 18, 4.5, 1, 0, -Math.PI / 2, 0);
    K.palmRow(b, KERB + 1.0, 0, CHUNK_LEN, { step: [10, 13], lit: true });
    K.throng(b, KERB + 1.6, 21, 1, CHUNK_LEN - 1, randi(16, 24), { mix: K.MIX.blvd });
    K.backRow(b, 1, { x0: 80 });
    // the fountain's jets, a curve of them out on the lake: their own mesh, moved by update
    const jets = new THREE.InstancedMesh(jetGeo, jetMat, N_JET); jets.frustumCulled = false; jets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const spots = Array.from({ length: N_JET }, (_, i) => { const t = i / (N_JET - 1); return [-(EDGE + 26) - 14 * Math.sin(t * Math.PI), -6 - t * 78]; });
    waterJets.push({ jets, spots });
    const glowJ = []; for (const [x, z] of spots) glowJ.push(x, -0.6, z);
    const halo = sparkles(glowJ, { size: 2.4 }); halo.material.uniforms.on.value = 1; golds.push(halo);
    return done(b, [jets, halo]);
  };

  // ---------- Dubai Opera ----------
  // at the end of Burj Lake: the dhow of glass on its plaza across a basin of the lake on the left, its profile turned to
  // the runner coming along the water (dubai.js keeps the lake open before it), lit from within; palms in lights on the
  // plaza; the Address Sky View's two towers and their bridge over the boulevard on the right
  const operaScene = () => {
    const b = new Batcher(), xq = EDGE + 18;   // the plaza's quay across the basin
    // the near shore: the boardwalk and its rail, the crowd strolling
    b.box(VC.solid, '#6a4a30', -(EDGE + 3), 0.02, -CHUNK_LEN / 2, 6, 0.08, CHUNK_LEN);
    for (let z = 0; z < CHUNK_LEN; z += 2.2) b.box(VC.metal, '#c8ccd0', -(EDGE + 6), 0.55, -z, 0.06, 1.1, 0.06);
    b.box(VC.metal, '#c8ccd0', -(EDGE + 6), 1.1, -CHUNK_LEN / 2, 0.08, 0.08, CHUNK_LEN);
    for (let z = 6; z < CHUNK_LEN; z += 18) K.lamp(b, -(EDGE + 1.2), -z, -1, { kind: 'lantern' });
    K.throng(b, -(EDGE + 1), -(EDGE + 5), 1, CHUNK_LEN - 1, randi(10, 14), { mix: K.MIX.blvd });
    K.waterPlane(b, -(EDGE + 6), -xq, 0, CHUNK_LEN, -0.8);
    for (let z = 8; z < CHUNK_LEN; z += 16) K.refl(b, -(xq - 1), -z, '#ffd9a0', 10, -1);
    // the plaza: its quay along the basin and along the lake's end, palms, fountains, the crowd, the Opera on it
    K.pave(b, -(xq + 60), -CHUNK_LEN / 2, 120, CHUNK_LEN);
    b.box(VC.solid, '#b8ac98', -(xq + 0.3), -0.4, -CHUNK_LEN / 2, 0.6, 0.9, CHUNK_LEN);
    b.box(VC.solid, '#b8ac98', -(xq + 60), -0.4, -0.3, 120, 0.9, 0.6);
    K.palmRow(b, -(xq + 2.4), 0, CHUNK_LEN, { step: [9, 11], lit: true });
    for (let k = 0; k < 3; k++) { const z = -14 - k * 22; b.cyl(VC.solid, '#d8ccb4', -(xq + 8), 0.25, z, 2.2, 0.5, 'cyl'); for (let j = 0; j < 5; j++) b.add(G.cyl, VC.glowAdd, -(xq + 8) + rand(-1, 1), 1.2, z + rand(-1, 1), 0.15, 2.4, 0.15, 0, 0, 0, hdr('#d8f0ff', 0.7)); }   // the plaza's fountains
    K.throng(b, -(xq + 4), -(xq + 20), 1, CHUNK_LEN - 1, randi(16, 22), { mix: K.MIX.blvd });
    dubaiOpera(frame(b, -(xq + 58), 0, -41, 0.8, Math.PI / 2 - 0.2), SS);
    K.pool(b, -(xq + 30), -41, 20, 76, hdr('#ffd9a0', 0.35));   // its light on the plaza
    plaque(b, 'دبي أوبرا', 'DUBAI OPERA', -(xq + 1.2), 2.6, -20, -1, 5);
    b.box(VC.solid, '#2a2622', -(xq + 160), -0.2, -CHUNK_LEN / 2, 80, 0.2, CHUNK_LEN);
    // the right: the boulevard, the Address Sky View over it
    farGround(b, 1, '#2a2622');
    K.kerbLane(b, 1, 0, CHUNK_LEN, { x1: X0 + 2.6 });
    K.jam(b, EDGE + 1.55, 0, CHUNK_LEN, 1, { fill: 0.45, mix: { lux: 3, super: 3, suv: 4, gwagon: 2, taxi: 3 } });
    K.palmRow(b, KERB + 1.2, 0, CHUNK_LEN, { step: [9, 12], lit: true });
    K.arabesqueRow(b, 1, 0, CHUNK_LEN);
    K.throng(b, KERB + 2.2, X0 - 2.4, 1, CHUNK_LEN - 1, randi(14, 20), { mix: K.MIX.blvd });
    addressSkyView(frame(b, 66, 0, -56, 0.42, -0.4), SS);
    for (let z = 8; z < CHUNK_LEN; z += 16) K.lamp(b, KERB + 0.4, -z, 1, { kind: 'lantern' });
    return done(b);
  };

  // ---------- the water canal ----------
  // the canal on the left, its promenade; Sheikh Zayed Road's bridge over the track and the water (its deck 14 m up), the
  // waterfall pouring off its edge into the canal (a gap in it for the boat passing under); the twisting footbridge; the
  // Opus; joggers
  const fallMat = basic({ map: canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(230,244,255,${rand(0.3, 0.9)})`; g.fillRect(rand(0, w), rand(0, h), rand(1, 2.5), rand(20, 70)); } }), color: hdr('#d8ecff', 1.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const falls = [];
  const canalScene = () => {
    const b = new Batcher();
    farGround(b, 1, '#2a2622');
    K.pave(b, -(EDGE + 3.5), -CHUNK_LEN / 2, 7, CHUNK_LEN);
    K.wharf(b, -1, EDGE + 7, 0, CHUNK_LEN);
    K.waterPlane(b, -(EDGE + 7.4), -(EDGE + 52), 0, CHUNK_LEN);
    for (let z = 4; z < CHUNK_LEN; z += 13) K.datePalm(b, -(EDGE + 2.2), -z, rand(0.8, 0.95), { lit: true });
    for (let k = 0; k < 6; k++) K.person(b, -rand(EDGE + 3, EDGE + 6.5), -rand(4, 76), { outfit: pick(['casual', 'tourist', 'kandura']), pose: 'walk', ry: chance(0.5) ? 0 : Math.PI });
    // the bridge: its deck across everything, its piers clear of the track
    const zb = -40, y = 14.2, x0 = -(EDGE + 56), x1 = 40;
    b.box(VC.solid, '#c8c4bc', (x0 + x1) / 2, y + 0.9, zb, x1 - x0, 1.8, 24);
    for (const e of [-1, 1]) b.box(VC.solid, '#d8d4cc', (x0 + x1) / 2, y + 2.2, zb + e * 12, x1 - x0, 0.9, 0.4);
    for (const x of [x0 + 2, -(EDGE + 6), EDGE + 6, x1 - 4]) b.block(VC.solid, '#c0bcb4', x, -1, zb, 3, y, 20);
    for (let x = x0; x < x1; x += 2) b.box(VC.glow, hdr('#bfe6ff', 2), x, y - 0.05, zb + 11.9, 1.2, 0.08, 0.1);   // its lit soffit edge
    for (let x = x0 + 4; x < x1; x += 7) for (const e of [-1, 1]) K.car(b, x + rand(-1, 1), zb + e * 4, e, { kind: pick(['taxi', 'suv', 'sedan', 'lux']), lo: true, y: y + 1.8 });   // its traffic, crossing over
    // the waterfall off the deck into the canal: a curtain in sections (the one over the boat's path goes dry as it passes)
    const secs = [];
    for (let k = 0; k < 6; k++) {
      const xa = -(EDGE + 8) - k * 7.5, m = new THREE.Mesh(new THREE.PlaneGeometry(7.2, y - WY), curve(fallMat.clone()));
      m.position.set(xa - 3.6, (y + WY) / 2, zb + 12.2); m.frustumCulled = false; secs.push(m);
    }
    const boat = new THREE.Group(); { const t = new Batcher(); K.yacht(t, 0, 0, 0, { L: 10 }); boat.add(...t.build().children); }
    falls.push({ secs, boat, zb });
    // the twisting footbridge over the canal further along
    for (let k = 0; k <= 40; k++) { const t = k / 40, x = -(EDGE + 7) - t * 45, a = t * Math.PI * 4; for (const e of [0, Math.PI]) b.add(G.box, VC.metal, x, 6 + Math.cos(a + e) * 2.4, -66 + Math.sin(a + e) * 2.4, 1.2, 0.25, 0.25, 0, 0, a + e, '#e8ecf0'); }
    b.box(VC.solid, '#c8c4bc', -(EDGE + 30), 6, -66, 46, 0.4, 3.2);
    K.farBank(b, -1, EDGE + 52);
    theOpus(frame(b, 48, 0, -66, 0.5, -0.3), SS);
    K.kerbLane(b, 1, 0, CHUNK_LEN, { x1: 18 });
    K.jam(b, EDGE + 1.55, 0, CHUNK_LEN, 1, { fill: 0.5, gaps: [[30, 50]] });
    K.towerRow(b, 1, 0, 40, { x0: 20 });
    K.backRow(b, -1, { x0: 110 }); K.backRow(b, 1, { x0: 80 });
    return done(b, [...secs, boat]);
  };

  // ---------- Al Fahidi Fort ----------
  // the old fort, now the Dubai Museum: its walls, the round tower, the square one, the wind tower, the gate, a dhow
  // drawn up outside it and the old cannons; the Grand Mosque's minaret behind; the old houses opposite
  const fahidiScene = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) { farGround(b, s, '#2a241e'); K.pave(b, s * (EDGE + X0 + 0.5) / 2, -CHUNK_LEN / 2, X0 + 0.5 - EDGE, CHUNK_LEN); }
    fahidiFort(frame(b, 32, 0, -46, 1.0, -Math.PI / 2), SS);
    K.dhow(b, EDGE + 8, 0.1, -20, { ry: 0.2, L: 14, cargo: false, lights: false });
    for (const z of [-34, -58]) { b.cyl(VC.metal, '#3a3a40', EDGE + 7, 0.8, z, 0.3, 2.4, 'cyl8', Math.PI / 2, 0.2); for (const e of [-1, 1]) b.cyl(VC.solid, '#5a3a1e', EDGE + 7 + e * 0.5, 0.45, z, 0.45, 0.12, 'cyl8', 0, Math.PI / 2); }   // the cannons on their wheels
    plaque(b, 'متحف دبي', 'DUBAI MUSEUM', EDGE + 9.5, 3, -30, 1, 4.5);
    K.minaret(b, 64, -26, 46, { col: '#e8dcc4' });   // the Grand Mosque's
    K.heritageRow(b, -1, 0, CHUNK_LEN);
    for (let z = 8; z < CHUNK_LEN; z += 16) K.lamp(b, EDGE + 4.6, -z, 1, { kind: 'lantern' });
    for (const s of [-1, 1]) K.throng(b, s * (EDGE + 1), s * (EDGE + 6), 1, CHUNK_LEN - 1, randi(10, 16), { mix: K.MIX.souk });
    K.backRow(b, -1, { x0: 30, kind: 'low' });
    return done(b);
  };

  // ---------- the creek and the abra station ----------
  // the abra station's timber pier and roof on the right, the boats loading, others crossing the creek to Deira's wharves
  // and their dhows; the textile souk's arcade on the left
  const abraGeo = (() => { const t = new Batcher(); K.abra(t, 0, 0, 0, { ry: 0 }); return t.build(); })();
  const crossers = [];
  const creekScene = () => {
    const b = new Batcher();
    K.pave(b, EDGE + 2.6, -CHUNK_LEN / 2, 5.2, CHUNK_LEN);
    K.wharf(b, 1, EDGE + 5.2, 0, CHUNK_LEN, { wood: true });
    K.waterPlane(b, EDGE + 5.6, EDGE + 82, 0, CHUNK_LEN);
    // the station: its pier and roof, the sign, the queue
    b.box(VC.solid, '#6a4a2a', EDGE + 8.5, -0.2, -36, 7, 0.3, 20);
    for (let z = -27; z >= -45; z -= 4.5) for (const x of [EDGE + 5.6, EDGE + 11.4]) b.cyl(VC.solid, '#5a3a1e', x, 2, z, 0.14, 4.4, 'cyl8');
    b.box(VC.solid, '#c8a878', EDGE + 8.5, 4.3, -36, 7.4, 0.3, 20.4);
    K.bi(b, 'محطة العبرة', 'ABRA STATION', { w: 512, h: 160, color: '#ffffff', bg: '#1a6a8a', border: '#ffffff' }, EDGE + 5.4, 3.2, -36, 5, 1.55, 1, 0, -Math.PI / 2, 0);
    K.queue(b, EDGE + 3.4, -30, 10, 0.62, { mix: K.MIX.souk });
    for (let z = -28; z >= -44; z -= 8.5) K.abra(b, EDGE + 13.6, WY + 0.15, z, { ry: 0 });
    K.farShore(b, 1, EDGE + 82);
    for (let z = 6; z < CHUNK_LEN; z += 14) K.lamp(b, EDGE + 4.8, -z, 1, { kind: 'lantern' });
    // the textile souk across the track
    farGround(b, -1, '#24201c');
    K.pave(b, -(EDGE + X0) / 2, -CHUNK_LEN / 2, X0 - EDGE, CHUNK_LEN);
    K.soukRow(b, -1, 0, CHUNK_LEN, { signs: SOUK_SIGNS.filter((s) => ['TEXTILES', 'PASHMINA', 'ANTIQUES', 'PERFUMES'].includes(s.en)) });
    K.throng(b, -(EDGE + 0.8), -(X0 - 1.6), 1, CHUNK_LEN - 1, randi(14, 20), { mix: K.MIX.souk });
    K.backRow(b, -1, { x0: 28, kind: 'low' });
    // the abras crossing: their own group each, moved by update
    const boats = [];
    for (let k = 0; k < 5; k++) { const g = new THREE.Group(); for (const m of abraGeo.children) g.add(new THREE.Mesh(m.geometry, m.material)); g.traverse((o) => (o.frustumCulled = false)); boats.push({ g, z: -8 - k * 15 + rand(-3, 3), ph: rand(0, 1), sp: rand(0.016, 0.026) }); }
    crossers.push(boats);
    return done(b, boats.map((x) => x.g));
  };

  // ---------- the spice souk ----------
  // the lanes heaped with sacks of spice and dried roses, frankincense, saffron; the shops' brass lamps and burners
  // smoking; the porters; the souk's timber roof high over the lane (16 m), lanterns hanging from it
  const spiceScene = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) {
      farGround(b, s, '#24201c');
      K.pave(b, s * (EDGE + X0) / 2, -CHUNK_LEN / 2, X0 - EDGE, CHUNK_LEN);
      K.soukRow(b, s, 0, CHUNK_LEN, { signs: SOUK_SIGNS.filter((x) => ['SPICES', 'SAFFRON', 'DATES', 'OUD & BAKHOOR'].includes(x.en)) });
      for (let z = 2; z < CHUNK_LEN - 1; z += 0.85) {   // sacks out on the paving, rolled down, heaped
        const x = s * (EDGE + rand(1.2, 2.6));
        b.cyl(VC.solid, '#c8b088', x, 0.3, -z, 0.3, 0.6, 'cyl8');
        b.add(G.cone, VC.solid, x, 0.75, -z, 0.58, 0.42, 0.58, 0, 0, 0, pick(['#d84a1a', '#f2b030', '#8a5a2a', '#c8202a', '#e8d070', '#6a8a2a', '#e86a8a', '#7a3a1a', '#f4e0b0']));
        if (chance(0.12)) K.smokeAt(x, 1.2, -z);
      }
      for (let k = randi(1, 2); k > 0; k--) K.cart(b, s * (KERB + 0.6), -rand(8, 72));
      K.throng(b, s * (KERB - 0.4), s * (X0 - 1.6), 1, CHUNK_LEN - 1, randi(14, 20), { mix: K.MIX.souk });
    }
    for (let z = 3; z < CHUNK_LEN; z += 3) b.box(VC.solid, '#5a3a1e', 0, 16, -z, 2 * X0, 0.3, 0.3);   // the roof's beams over the lane
    for (let z = 0; z < CHUNK_LEN; z += 20) for (const s of [-1, 1]) b.block(VC.solid, '#5a3a1e', s * (X0 - 0.4), 0, -z - 10, 0.5, 16, 0.5);
    b.add(G.plane, K.latticeMat, 0, 16.2, -CHUNK_LEN / 2, 2 * X0, CHUNK_LEN, 1, -Math.PI / 2, 0, 0, '#c8a070');
    for (let z = 6; z < CHUNK_LEN; z += 8) K.lanterns(b, -X0 + 1, X0 - 1, 15.8, -z, { sag: 0.4, n: 7 });
    plaque(b, 'سوق التوابل', 'SPICE SOUK', 0, 17.6, -2, 1, 6);
    return done(b);
  };

  // ---------- the Gold Souk ----------
  // the timber arch over the lane, City of Gold, the roof over it all; window after window of gold glittering, the
  // giant ring in one of them; the shoppers and the touts
  const goldScene = () => {
    const b = new Batcher(), pts = [];
    for (const s of [-1, 1]) {
      farGround(b, s, '#24201c');
      K.pave(b, s * (EDGE + X0) / 2, -CHUNK_LEN / 2, X0 - EDGE, CHUNK_LEN);
      K.soukRow(b, s, 0, CHUNK_LEN, { signs: SOUK_SIGNS.filter((x) => ['GOLD & JEWELLERY', 'WATCHES'].includes(x.en)), roof: true });
      for (let z = 1; z < CHUNK_LEN; z += 0.9) for (let y = 0.6; y < 2.8; y += 0.5) if (chance(0.55)) pts.push(s * (X0 - 0.2), y + rand(-0.1, 0.1), -z + rand(-0.3, 0.3));   // the gold catching the light
      K.throng(b, s * (EDGE + 0.6), s * (X0 - 1.6), 1, CHUNK_LEN - 1, randi(18, 26), { mix: K.MIX.souk });
    }
    // the giant ring in its window on the right
    b.add(G.tor, VC.metal, X0 - 1.6, 2.2, -44, 3.4, 3.4, 3.4, 0, Math.PI / 2, 0, '#e8c050'); b.sph(VC.glow, hdr('#e8f4ff', 3), X0 - 1.6, 3.85, -44, 0.35);
    b.box(VC.glow, hdr('#ffe8b0', 0.8), X0 - 0.1, 2.2, -44, 0.1, 4.2, 4.2);
    // the entrance arch: carved teak, the gilded sign
    for (const e of [-1, 1]) b.block(VC.solid, '#5a3418', e * 9, 0, -6, 1.6, 15, 1.6);
    b.box(VC.solid, '#5a3418', 0, 15.6, -6, 20, 2.4, 1.6);
    for (let k = 0; k < 9; k++) b.add(G.cone4, VC.solid, -8 + k * 2, 17.2, -6, 1.2, 1.2, 1.2, 0, 0, 0, '#6a4022');
    K.bi(b, 'مدينة الذهب', 'CITY OF GOLD', { w: 768, h: 224, color: '#ffd870', bg: '#2a1a0a', border: '#c8a050', glow: '#ffb840' }, 0, 15.6, -5.15, 12, 3.4, 1, 0, 0, 0);
    // the roof over the lane
    for (let z = 10; z < CHUNK_LEN; z += 3) b.box(VC.solid, '#5a3a1e', 0, 16.2, -z, 2 * X0, 0.3, 0.3);
    b.add(G.plane, K.latticeMat, 0, 16.4, -(CHUNK_LEN + 8) / 2, 2 * X0, CHUNK_LEN - 8, 1, -Math.PI / 2, 0, 0, '#c8a070');
    for (let z = 14; z < CHUNK_LEN; z += 9) K.lanterns(b, -X0 + 1, X0 - 1, 16, -z, { sag: 0.5, n: 6, cols: ['#ffd070', '#ffe8a0'] });
    const sp = sparkles(pts, { size: 0.5 }); sp.material.uniforms.on.value = 1;
    golds.push(sp);
    return done(b, [sp]);
  };

  return {
    landmarks: {
      frame: { key: 'frame', name: '迪拜相框', en: 'DUBAI FRAME', build: frameScene },
      future: { key: 'future', name: '未来博物馆 · 阿联酋塔', en: 'MUSEUM OF THE FUTURE · EMIRATES TOWERS', build: futureScene },
      fountain: { key: 'fountain', name: '哈利法塔 · 迪拜喷泉', en: 'BURJ KHALIFA · DUBAI FOUNTAIN', build: fountainScene },
      opera: { key: 'opera', name: '迪拜歌剧院', en: 'DUBAI OPERA', build: operaScene },
      canal: { key: 'canal', name: '迪拜水运河 · 瀑布桥', en: 'DUBAI WATER CANAL', build: canalScene },
      fahidi: { key: 'fahidi', name: '阿尔法希迪历史街区', en: 'AL FAHIDI HISTORICAL DISTRICT', build: fahidiScene },
      creek: { key: 'creek', name: '迪拜河 · 阿布拉渡口', en: 'DUBAI CREEK · ABRA STATION', build: creekScene },
      spiceSouk: { key: 'spiceSouk', name: '香料市场', en: 'SPICE SOUK', build: spiceScene },
      goldSouk: { key: 'goldSouk', name: '黄金市场', en: 'GOLD SOUK', build: goldScene },
    },
    // the tower's LEDs in the fountain's scene fade in as the horizon's fade out (dubai.js)
    setTowerK(k) { towerLed.uniforms.uK.value = k; for (const m of [towerS.metal, towerS.glow]) { m.opacity = k; m.visible = k > 0.01; } },   // (it comes and goes as the horizon's tower goes and comes)
    update(t) {
      // the fountain's show: the jets rising and falling in waves, chasing, bursting all together
      for (const { jets, spots } of waterJets) {
        if (!jets.parent || !jets.parent.parent) continue;
        const P = Math.floor(t / 9) % 4, M = new THREE.Matrix4(), q = new THREE.Quaternion();
        spots.forEach(([x, z], i) => {
          const u = i / N_JET, h = P === 0 ? 8 + 22 * (0.5 + 0.5 * Math.sin(t * 2.2 - u * 9)) : P === 1 ? 4 + 30 * Math.max(0, Math.sin(t * 3 - u * 16)) : P === 2 ? 6 + 26 * Math.pow(Math.abs(Math.sin(t * 1.4)), 3) : 10 + 18 * (0.5 + 0.5 * Math.sin(t * 4 + (i % 2) * Math.PI));
          q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), P === 3 ? 0.25 * Math.sin(t * 2 + u * 6) : 0);
          M.compose(new THREE.Vector3(x, -0.6, z), q, new THREE.Vector3(1 + h * 0.02, h, 1 + h * 0.02));
          jets.setMatrixAt(i, M);
        });
        jets.instanceMatrix.needsUpdate = true;
      }
      // the canal: the boat comes down the canal under the bridge, the waterfall over it parting
      for (const { secs, boat, zb } of falls) {
        if (!boat.parent || !boat.parent.parent) continue;
        const f = (t * 0.03) % 1, x = -(EDGE + 12) - 30 * Math.sin(f * Math.PI * 2) * 0, z = 30 - f * 140;
        boat.position.set(-(EDGE + 20), WY, z);
        for (const m of secs) { const dry = Math.abs(z - zb) < 14 && Math.abs(m.position.x - boat.position.x) < 8; m.material.opacity = dry ? 0.0 : 1; m.material.map.offset.y = t * 0.9; }
      }
      // the abras crossing the creek and back
      for (const boats of crossers) for (const a of boats) {
        if (!a.g.parent || !a.g.parent.parent) continue;
        const f = (t * a.sp + a.ph) % 2, u = f < 1 ? f : 2 - f, x = EDGE + 18 + u * 56;
        a.g.position.set(x, WY + 0.15, a.z); a.g.rotation.y = f < 1 ? Math.PI / 2 : -Math.PI / 2;
      }
      for (const sp of golds) sp.material.uniforms.time.value = t;
    },
  };
}
