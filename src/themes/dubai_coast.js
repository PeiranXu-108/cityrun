// Dubai's landmark scenes along the coast and out in the desert: the Jumeirah Mosque floodlit in its garden; Burj Al Arab
// on its island off the beach, its sail glowing through the colours, the Jumeirah Beach Hotel's wave on the shore; Madinat
// Jumeirah's wind towers over its waterways and their abras; the Palm's trunk, the monorail gliding over it, Atlantis at the
// end of it on the horizon; the Marina's water, its yachts and the towers over it, Cayan Tower's quarter turn; Ain Dubai
// turning over Bluewaters, JBR's towers and The Walk; the desert camp among the red dunes: the rugs and cushions, the fire,
// the lanterns, the camels lying down, the falconer, the drummers, the tanoura dancer spinning in her lit skirts.
import { THREE, Batcher, VC, G, basic, hdr, buildingGeo, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { at, EDGE, farGround } from './common.js';
import { beam } from './tokyo_kit.js';
import { frame } from './ny_icons.js';
import { KERB, X0, face, MARINA_SIGNS } from './dubai_kit.js';
import { WY } from './dubai_build.js';
import { SEA } from './la_sea.js';
import { burjAlArab, jbHotel, jumeirahMosque, cayanTower, princessTower, marina101, ainDubaiLegs, ainDubaiWheel } from './dubai_icons.js';
import { sceneStyle } from './dubai_landmarks.js';

export function dubaiCoast(K) {
  const SS = sceneStyle(K);
  const done = (b, extra = []) => { const g = K.flush(b.build()); for (const m of extra) g.add(m); return g; };
  const plaque = (b, ar, en, x, y, z, s, w = 4) => K.bi(b, ar, en, { w: 512, h: 160, color: '#ffe8b0', bg: '#2a1c10', border: '#c8a050' }, x, y, z, w, w * 0.31, 1, 0, face(s), 0);
  const moving = [];   // the scenes' moving parts: [group, update(t)]

  // ---------- the Jumeirah Mosque ----------
  const mosqueScene = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) { farGround(b, s, '#2a2620'); K.kerbLane(b, s, 0, CHUNK_LEN, { x1: X0 + 1 }); K.jam(b, s * (EDGE + 1.55), 0, CHUNK_LEN, s, { fill: 0.4, mix: { suv: 5, lux: 2, taxi: 3, sedan: 2, gwagon: 1 } }); }
    jumeirahMosque(frame(b, 36, 0, -46, 0.85, -Math.PI / 2), SS);
    // its garden: the low wall, palms, the floodlights' pools, the worshippers coming and going
    b.block(VC.solid, '#efe4cc', X0 + 1, 0, -40, 0.4, 1.4, 70);
    for (let z = 8; z < CHUNK_LEN; z += 9) { K.datePalm(b, X0 + 4, -z, rand(0.8, 1.0), { lit: chance(0.5) }); K.pool(b, X0 + 6, -z, 5, 5, hdr('#fff0d0', 0.4)); }
    for (let k = 0; k < 8; k++) K.person(b, rand(X0 + 3, X0 + 12), -rand(20, 70), { outfit: pick(['kandura', 'kandura', 'casual', 'abaya']), pose: 'walk', ry: rand(0, 6) });
    plaque(b, 'مسجد جميرا', 'JUMEIRAH MOSQUE', X0 + 0.6, 2.4, -14, 1, 4.6);
    for (let z = 10; z < CHUNK_LEN; z += 20) K.flagPole(b, X0 - 0.6, -z);
    // across the road: the beach road's shops and cafés
    K.arabesqueRow(b, -1, 0, CHUNK_LEN, { x0: X0 + 2.6 });
    K.palmRow(b, -(KERB + 1.2), 0, CHUNK_LEN, { step: [10, 13], lit: true });
    K.throng(b, -(KERB + 2), -(X0 - 0.6), 1, CHUNK_LEN - 1, randi(12, 18), { mix: K.MIX.blvd });
    K.backRow(b, -1, { x0: 60, kind: 'res' });
    return done(b);
  };

  // ---------- Burj Al Arab and the beach ----------
  const sailCol = SS.sail.color;
  const arabScene = () => {
    const b = new Batcher();
    K.pave(b, -(EDGE + 3.5), -CHUNK_LEN / 2, 7, CHUNK_LEN);
    K.beach(b);
    burjAlArab(frame(b, -150, SEA, -118, 0.55, Math.PI / 2), SS);
    K.sand(b, -64, -150, 40, 40, SEA + 0.6, '#e8d0b0');   // the Jumeirah Beach Hotel's own spit of shore
    jbHotel(frame(b, -64, SEA + 0.7, -150, 0.5, Math.PI / 2 + 0.5), SS);
    for (let z = 4; z < CHUNK_LEN; z += 14) K.datePalm(b, -(EDGE + 1.6), -z, rand(0.85, 1.0));
    for (let k = 0; k < 10; k++) K.person(b, -rand(EDGE + 9, EDGE + 18), -rand(4, 76), { outfit: pick(['tourist', 'tourist', 'casual', 'abaya']), pose: pick(['camera', 'phone', 'stand']), ry: Math.PI / 2 + rand(-0.6, 0.6) });   // the sunset crowd, photographing the sail
    farGround(b, 1, '#2a2620');
    K.kerbLane(b, 1, 0, CHUNK_LEN, { x1: X0 + 1 });
    K.jam(b, EDGE + 1.55, 0, CHUNK_LEN, 1, { fill: 0.4, mix: { suv: 5, lux: 3, super: 2, taxi: 3 } });
    K.villaRow(b, 1, 0, CHUNK_LEN);
    K.palmRow(b, KERB + 1.0, 0, CHUNK_LEN, { step: [12, 15] });
    return done(b);
  };

  // ---------- Madinat Jumeirah ----------
  const madinatScene = () => {
    const b = new Batcher();
    // the left: the waterway along the walk, lit abras on it, the resort's wind towers over it
    K.pave(b, -(EDGE + 3), -CHUNK_LEN / 2, 6, CHUNK_LEN);
    K.wharf(b, -1, EDGE + 6, 0, CHUNK_LEN, { wood: true });
    K.waterPlane(b, -(EDGE + 6.4), -(EDGE + 22), 0, CHUNK_LEN);
    for (let k = 0; k < 4; k++) K.abra(b, -rand(EDGE + 10, EDGE + 18), WY + 0.15, -rand(8, 72), { ry: chance(0.5) ? 0 : Math.PI });
    K.arabesqueRow(b, -1, 0, CHUNK_LEN, { x0: EDGE + 24, cafes: 0 });
    for (let z = 8; z < CHUNK_LEN; z += 18) K.windTower(b, -(EDGE + 30), 16, -z, { h: 7, w: 3.4, col: '#e8d4b0' });
    for (let z = 6; z < CHUNK_LEN; z += 11) K.lanterns(b, -(EDGE + 6.2), -(EDGE + 22), 5, -z, { sag: 0.6, n: 9 });
    // the right: the souk's entrance and its arcade, palms
    farGround(b, 1, '#2a2620');
    K.pave(b, (EDGE + X0) / 2, -CHUNK_LEN / 2, X0 - EDGE, CHUNK_LEN);
    K.arabesqueRow(b, 1, 0, CHUNK_LEN, { x0: X0 + 2.6 });
    for (const e of [-1, 1]) b.block(VC.solid, '#e8d4b0', X0 - 2, 0, -40 + e * 4, 1.4, 8, 1.4);
    b.block(VC.solid, '#e8d4b0', X0 - 2, 8, -40, 1.4, 2.4, 9.4);
    K.bi(b, 'مدينة جميرا', 'MADINAT JUMEIRAH', { w: 512, h: 160, color: '#ffe8b0', bg: '#3a2410', border: '#c8a050' }, X0 - 2.75, 9.2, -40, 7, 2.2, 1, 0, -Math.PI / 2, 0);
    for (let z = 4; z < CHUNK_LEN; z += 12) K.datePalm(b, EDGE + 2.4, -z, rand(0.75, 0.9), { lit: true });
    for (const s of [-1, 1]) K.throng(b, s * (EDGE + 1), s * (EDGE + 5), 1, CHUNK_LEN - 1, randi(8, 14), { mix: K.MIX.blvd });
    return done(b);
  };

  // ---------- the Palm ----------
  // the trunk's boulevard: the sea either side beyond the apartments, the monorail's slim viaduct on the right with its
  // train gliding along, the fronds' villas across the water on the left; Atlantis takes Burj Khalifa's place ahead (dubai.js)
  const monoGeo = (() => { const t = new Batcher(); for (let c = 0; c < 3; c++) { const z = -c * 13; t.box(VC.solid, '#f4f4f2', 0, 1.6, z, 3, 2.6, 12.4); t.box(VC.glow, hdr('#bfe6ff', 1.4), 0, 1.9, z, 3.04, 0.9, 11.4); t.box(VC.solid, '#1a6ab8', 0, 0.55, z, 3.02, 0.4, 12.2); } t.add(G.sph, VC.solid, 0, 1.6, 6.4, 3, 2.6, 3.4, 0, 0, 0, '#f4f4f2'); return t.build(); })();
  const palmScene = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) {
      K.kerbLane(b, s, 0, CHUNK_LEN, { x1: X0 + 1 });
      K.jam(b, s * (EDGE + 1.55), 0, CHUNK_LEN, s, { fill: 0.35, mix: { suv: 4, lux: 2, super: 2, taxi: 3 } });
      K.palmRow(b, s * (KERB + 1.0), 0, CHUNK_LEN, { step: [9, 11], lit: true });
      for (let z = 0; z < CHUNK_LEN - 8;) { const L = rand(16, 24); b.addM(buildingGeo(14, rand(24, 32), L, K.res, 3.0, 3.2), K.resMat, at(s * (X0 + 10), 0, -(z + L / 2)), pick(['#f4ece0', '#efe2cc', '#f8f2e6'])); z += L + 2; }   // the shoreline apartments
      K.waterPlane(b, s * (X0 + 18), s * (X0 + 160), -10, CHUNK_LEN + 10);
    }
    K.sand(b, -(X0 + 92), -CHUNK_LEN / 2, 56, CHUNK_LEN, 0.04, '#e0c8a8');   // a frond, its villas
    for (let z = 0; z < CHUNK_LEN; z += 6) for (let k = 0; k < 3; k++) { const x = -(X0 + 70 + k * 18), zz = -z - rand(0, 4); b.block(VC.solid, '#f4ece0', x, 0, zz, 8, rand(5, 8), 5); b.box(VC.glow, hdr('#ffd9a0', 1.3), x + 4.02, 2.5, zz, 0.05, 1.4, 3); }   // the fronds' villas
    // the monorail's viaduct, 8 m up, over the right-hand road
    b.box(VC.solid, '#e8e4dc', X0 + 2, 8, -CHUNK_LEN / 2, 2.2, 1.6, CHUNK_LEN);
    for (let z = 10; z < CHUNK_LEN; z += 24) b.block(VC.solid, '#dcd8d0', X0 + 2, 0, -z, 1.4, 7.2, 1.4);
    const train = new THREE.Group(); for (const m of monoGeo.children) train.add(new THREE.Mesh(m.geometry, m.material)); train.traverse((o) => (o.frustumCulled = false));
    moving.push([train, (t) => { train.position.set(X0 + 2, 9.2, 40 - ((t * 9) % 200)); }]);
    plaque(b, 'نخلة جميرا', 'PALM JUMEIRAH', KERB + 0.6, 2.6, -16, 1, 4.6);
    return done(b, [train]);
  };

  // ---------- the Marina ----------
  const marinaScene = () => {
    const b = new Batcher();
    K.pave(b, -(EDGE + 4), -CHUNK_LEN / 2, 8, CHUNK_LEN);
    K.wharf(b, -1, EDGE + 8, 0, CHUNK_LEN);
    K.marinaWater(b, -1, EDGE + 8.4, EDGE + 70);
    for (let z = 4; z < CHUNK_LEN; z += 12) K.fanPalm(b, -(EDGE + 2.0), -z, rand(0.75, 0.9));
    for (let z = 10; z < CHUNK_LEN; z += 18) K.lamp(b, -(EDGE + 6.2), -z, -1, { kind: 'blade' });
    K.farBank(b, -1, EDGE + 70, 90);
    cayanTower(frame(b, -92, 0, -50, 0.5, 0.2), SS);
    princessTower(frame(b, -112, 0, -12, 0.42, 0), SS);
    marina101(frame(b, -118, 0, -88, 0.42, 0), SS);
    for (let z = 4; z < CHUNK_LEN; z += 14) K.refl(b, -(EDGE + 66), -z, pick(['#ffd9a0', '#bfe6ff', '#ff9ad8']), 56, -1);
    for (let k = 0; k < 10; k++) K.person(b, -rand(EDGE + 3, EDGE + 7.4), -rand(3, 77), { outfit: pick(['tourist', 'casual', 'abaya', 'kandura']), pose: pick(['walk', 'phone', 'camera']), ry: chance(0.5) ? 0 : Math.PI });
    // the right: the Marina Walk's cafés, the residential towers, the tram stop
    farGround(b, 1, '#24201c');
    K.kerbLane(b, 1, 0, CHUNK_LEN, { x1: 18 });
    K.jam(b, EDGE + 1.55, 0, CHUNK_LEN, 1, { fill: 0.4, mix: { lux: 2, super: 3, suv: 4, gwagon: 2, taxi: 4 }, gaps: [[30, 52]] });
    for (let z = 0; z < CHUNK_LEN - 10;) { const w = rand(22, 28); K.resTower(b, 35, -(z + w / 2), { w, d: rand(22, 26) }); z += w + rand(8, 14); }
    for (let z = 6; z < CHUNK_LEN - 4; z += 14) { K.shopSign(b, pick(MARINA_SIGNS), 13.05, 3.4, -z, 1, 3.2, 0.92); K.cafe(b, 12, -z, 1, { n: 2 }); }
    // the tram stop: its glass shelter and its platform screen doors
    b.block(VC.solid, '#d8dcdc', KERB + 2, 0, -41, 3, 0.4, 20);
    b.box(VC.glow, hdr('#d8ecf4', 0.6), KERB + 0.7, 1.6, -41, 0.06, 2.4, 19.6);
    b.box(VC.solid, '#f4f4f2', KERB + 2, 3.4, -41, 3.6, 0.2, 21);
    K.bi(b, 'ترام دبي', 'DUBAI TRAM', { w: 384, h: 128, color: '#ffffff', bg: '#c8202a' }, KERB + 0.6, 3.0, -33, 2.2, 0.73, 1, 0, -Math.PI / 2, 0);
    K.queue(b, KERB + 2.2, -36, 7, 0.9, { mix: K.MIX.beach });
    return done(b);
  };

  // ---------- Ain Dubai and JBR ----------
  const wheel = ainDubaiWheel({ R: 118, curve: (o) => basic({ ...o }) });
  const ainScene = () => {
    const b = new Batcher(), s0 = 0.55, wx = -130, wz = -92;
    K.pave(b, -(EDGE + 3.5), -CHUNK_LEN / 2, 7, CHUNK_LEN);
    K.beach(b);
    K.sand(b, wx, wz, 90, 90, SEA + 0.6, '#e0c8a8');   // Bluewaters
    ainDubaiLegs(frame(b, wx, SEA + 0.6, wz, s0, Math.PI / 2), SS);
    for (let k = 0; k < 6; k++) b.addM(buildingGeo(14, rand(8, 16), 20, K.res, 3.0, 3.2), K.resMat, at(wx + rand(-35, 35), SEA + 0.6, wz + rand(-35, 35)), '#f4ece0');
    for (let x = -(EDGE + 24); x > wx + 40; x -= 6) { b.box(VC.solid, '#d8d4cc', x, 3, -40, 6.2, 0.6, 7); b.box(VC.glow, hdr('#bfe6ff', 1.8), x, 3.35, -36.4, 6, 0.1, 0.1); }   // the bridge out to the island
    const g = new THREE.Group(); for (const m of wheel.children) g.add(new THREE.Mesh(m.geometry, m.material));
    g.position.set(wx, SEA + 0.6 + 130 * s0, wz); g.rotation.y = Math.PI / 2; g.scale.setScalar(s0); g.traverse((o) => (o.frustumCulled = false));
    moving.push([g, (t) => { g.rotation.z = t * 0.03; }]);
    for (let z = 4; z < CHUNK_LEN; z += 14) K.datePalm(b, -(EDGE + 1.6), -z, rand(0.85, 1.0));
    farGround(b, 1, '#24201c');
    K.pave(b, (EDGE + 18) / 2 + 1, -CHUNK_LEN / 2, 18 - EDGE, CHUNK_LEN);
    for (let z = 0; z < CHUNK_LEN - 10;) { const w = rand(24, 30); K.resTower(b, 34, -(z + w / 2), { w, d: rand(22, 26) }); z += w + rand(6, 10); }
    for (let z = 6; z < CHUNK_LEN - 4; z += 13) { K.shopSign(b, pick(MARINA_SIGNS), 15.05, 3.4, -z, 1, 3.2, 0.92); K.cafe(b, 13.5, -z, 1, { n: 2 }); }
    K.throng(b, EDGE + 1, 12, 1, CHUNK_LEN - 1, randi(20, 28), { mix: K.MIX.beach });
    plaque(b, 'عين دبي', 'AIN DUBAI', -(EDGE + 6.6), 2.6, -30, -1, 4);
    return done(b, [g]);
  };

  // ---------- the desert camp ----------
  // out among the red dunes: the camp's fence of palm fronds, the rugs and cushions round the fire, lanterns on poles, the
  // tent; camels lying down, the falconer, the drummers, the tanoura dancer whirling in her skirts of light; the 4x4s that
  // brought everyone, parked, and others still out on the crests
  const dancerGeo = (() => {
    const t = new Batcher();
    for (const [y, r, c] of [[0.35, 1.35, '#e8202a'], [0.75, 1.15, '#2a5aa8'], [1.1, 0.95, '#2a8a4a']]) {
      t.add(G.cone, VC.solid, 0, y, 0, r * 2, 0.5, r * 2, 0, 0, 0, c);
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; t.add(G.box, VC.glow, Math.cos(a) * r * 0.95, y - 0.24, Math.sin(a) * r * 0.95, 0.12, 0.06, 0.12, 0, 0, 0, hdr(pick(['#ffd23d', '#ff3d7f', '#3ad8ff', '#7aff6a']), 3)); }
    }
    t.add(G.box, VC.solid, 0, 1.55, 0, 0.42, 0.6, 0.26, 0, 0, 0, '#f4f0e8'); t.add(G.sphLow, VC.solid, 0, 2.05, 0, 0.26, 0.3, 0.27, 0, 0, 0, '#b07a52');
    t.add(G.cyl8, VC.solid, 0, 2.38, 0, 0.3, 0.42, 0.3, 0, 0, 0, '#c8202a');   // his tall hat
    for (const e of [-1, 1]) beam(t, VC.solid, e * 0.24, 1.75, 0, e * 0.85, 2.0, 0, 0.1, '#f4f0e8');   // arms out as he whirls
    return t.build();
  })();
  const desertScene = () => {
    const b = new Batcher();
    const hl = K.dunes(b, -1, 0, CHUNK_LEN), hr = K.dunes(b, 1, 0, CHUNK_LEN, { x0: 46 });
    for (const s of [-1, 1]) K.sand(b, s * (EDGE + 1.6), -CHUNK_LEN / 2, 3.2, CHUNK_LEN, 0.02, '#f0d8b8');
    K.sand(b, EDGE + 25, -40, 42, 70, 0.025, '#e8c8a0');   // the camp's floor
    // the fence
    for (let z = 6; z < 74; z += 1.1) { b.box(VC.solid, pick(['#a8905a', '#9a8250', '#b49a62']), 44.5, 1.1, -z, 0.25, 2.2, 1.0); if (z < 20 || z > 60) b.box(VC.solid, pick(['#a8905a', '#9a8250']), EDGE + 5.5, 1.1, -z, 0.25, 2.2, 1.0); }
    for (const z of [6, 74]) b.box(VC.solid, '#a8905a', EDGE + 25, 1.1, -z, 40, 2.2, 0.25);
    // the majlis round the fire: rugs, cushions, low tables, lanterns on poles, the fire and its smoke
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2, x = EDGE + 25 + Math.cos(a) * 11, z = -40 + Math.sin(a) * 15;
      b.add(G.plane, K.carpetMat, x, 0.05, z, 3.6, 2.4, 1, -Math.PI / 2, -a, 0);
      b.add(G.box, VC.solid, x + Math.cos(a) * 1.2, 0.25, z + Math.sin(a) * 1.2, 0.6, 0.5, 2.2, 0, -a, 0, pick(['#c8202a', '#e8a020', '#2a5aa8', '#8a2a5a']));
      if (chance(0.7)) K.person(b, x, z, { outfit: pick(['tourist', 'casual', 'kandura', 'abaya']), pose: 'seated', ry: -a + Math.PI / 2, y: -0.25 });
    }
    b.cyl(VC.solid, '#3a2a1a', EDGE + 25, 0.2, -40, 1.6, 0.4, 'cyl8'); b.add(G.cone8, VC.glow, EDGE + 25, 0.8, -40, 1.4, 1.4, 1.4, 0, 0, 0, hdr('#ff8a2a', 3)); K.smokeAt(EDGE + 25, 1.6, -40);
    K.pool(b, EDGE + 25, -40, 16, 16, hdr('#ff9a4a', 0.5));
    for (let k = 0; k < 8; k++) { const x = EDGE + rand(8, 42), z = -rand(8, 72); b.cyl(VC.solid, '#5a3a1e', x, 1.5, z, 0.06, 3, 'cyl6'); b.add(G.sphLow, VC.glow, x, 3.2, z, 0.3, 0.4, 0.3, 0, 0, 0, hdr('#ffb040', 2.6)); }
    // the tent: a long black goat-hair tent on poles, its front open
    b.add(G.cone4, VC.solid, EDGE + 36, 2.2, -64, 12, 3.6, 8, 0, 0, 0, '#2a1e18'); b.box(VC.glow, hdr('#ffc870', 0.8), EDGE + 36, 0.9, -60.2, 9, 1.6, 0.1);
    // the stage and the dancer (moved by update), the drummers, the falconer, camels lying down
    b.cyl(VC.solid, '#6a4a2a', EDGE + 25, 0.15, -58, 4.4, 0.3, 'cyl');
    const dancer = new THREE.Group(); for (const m of dancerGeo.children) dancer.add(new THREE.Mesh(m.geometry, m.material)); dancer.position.set(EDGE + 25, 0.3, -58); dancer.traverse((o) => (o.frustumCulled = false));
    moving.push([dancer, (t) => { dancer.rotation.y = t * 6; dancer.position.y = 0.3 + Math.abs(Math.sin(t * 6)) * 0.04; }]);
    for (let k = 0; k < 3; k++) K.person(b, EDGE + 21 + k * 1.2, -62, { outfit: 'kandura', pose: 'drum', ry: 0 });
    K.person(b, EDGE + 10, -30, { outfit: 'kandura', pose: 'falcon', ry: -Math.PI / 2 });
    for (let k = 0; k < 4; k++) K.camel(b, EDGE + rand(8, 14), -rand(46, 72), { kneel: true, ry: rand(0, 6) });
    plaque(b, 'مخيم الصحراء', 'DESERT CAMP', EDGE + 5.3, 2.8, -40, 1, 5);
    // the 4x4s parked at the gate, others out on the dunes; quad bikes
    for (let k = 0; k < 4; k++) K.place(b, (t) => K.car(t, 0, 0, 1, { kind: 'suv', col: pick(['#f4f4f2', '#e8e4dc', '#c8a050']), lit: false }), new THREE.Matrix4().makeRotationY(Math.PI / 2 + rand(-0.2, 0.2)).setPosition(EDGE + 6 + k * 0.2, 0, -8 - k * 3.2));
    for (let k = 0; k < 3; k++) { const x = rand(16, 50), z = rand(10, 70), y = hl(x, z); K.place(b, (t) => K.car(t, 0, 0, 1, { kind: 'suv', col: pick(['#f4f4f2', '#c8a050']), lit: true }), new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rand(-0.3, 0.3), rand(0, 6), rand(-0.25, 0.25))).setPosition(-x, y, -z)); }
    for (let k = 0; k < 5; k++) { const x = rand(60, 120), z = rand(5, 75), y = hr(x, z); K.camel(b, x, -z, { y: y - 0.1 }); }
    return done(b, [dancer]);
  };

  return {
    landmarks: {
      jumeirahMosque: { key: 'jumeirahMosque', name: '朱美拉清真寺', en: 'JUMEIRAH MOSQUE', build: mosqueScene },
      burjAlArab: { key: 'burjAlArab', name: '阿拉伯塔 · 朱美拉海滩', en: 'BURJ AL ARAB · JUMEIRAH BEACH', build: arabScene },
      madinat: { key: 'madinat', name: '卓美亚古城', en: 'MADINAT JUMEIRAH', build: madinatScene },
      palm: { key: 'palm', name: '棕榈岛 · 亚特兰蒂斯', en: 'THE PALM · ATLANTIS', build: palmScene },
      marina: { key: 'marina', name: '迪拜码头 · 旋转塔', en: 'DUBAI MARINA · CAYAN TOWER', build: marinaScene },
      ainDubai: { key: 'ainDubai', name: '迪拜之眼 · JBR', en: 'AIN DUBAI · JBR', build: ainScene },
      desert: { key: 'desert', name: '红沙漠营地', en: 'DESERT CAMP', build: desertScene },
    },
    update(t) {
      sailCol.setHSL((t * 0.035) % 1, 0.55, 0.62).multiplyScalar(1.5);   // Burj Al Arab's sail washing slowly through the colours
      wheel.userData.rim.color.setHSL((t * 0.04) % 1, 0.8, 0.6).multiplyScalar(1.8);
      for (const [g, fn] of moving) if (g.parent && g.parent.parent) fn(t);
    },
  };
}
