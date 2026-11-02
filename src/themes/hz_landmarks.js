// Hangzhou's new scenes on the Qiantang:
// 城市阳台, the City Balcony: the long, low platform folded out over the river from the end of Qianjiang New City's axis.
// Its face toward the street is folded dark perforated steel, warm light showing through the holes and through round
// "moon" windows of different sizes; frameless glass balustrades run along the deck under a line of blue light, the
// deck's grid of trees and its lamps above them, and a glass ramp climbs to it from the riverside walk. The end toward
// the runner is glazed, the yellow V-shaped trusses that carry the 60 m cantilever lit inside, and a glass pavilion on
// the deck plays the light show on its film screens. Across the track the axis plaza: a shallow reflecting pool with a
// dancing fountain, trees in planters, and at the far end the Citizen Center's six round towers tied together by a ring
// of skybridges, the light-show towers behind.
// 钱江灯光秀, the Qianjiang light show: the river between two banks of towers all playing the same picture, the far bank
// pulled close and its colours streaking across the water, a cruise boat passing, a crowd at the railing holding up
// their phones.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, curveUniforms, CURVE_GLSL, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { EDGE, DISC, at } from './common.js';
import { roundGeo, SIGN } from './hz_kit.js';

const DECK = 6.0;   // the balcony's deck above the street
const DISK = new THREE.CircleGeometry(0.5, 20);
const perfBoxes = new Map();
function perfBox(w, h, d, s = 1.2) {   // a box whose UVs tile the perforated steel in metres
  const key = `${w.toFixed(2)}|${h.toFixed(2)}|${d.toFixed(2)}`;
  if (perfBoxes.has(key)) return perfBoxes.get(key);
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / s, (uv.getY(i) * dims[f][1]) / s); }
  perfBoxes.set(key, g);
  return g;
}
// perforated steel: dark grey sheet, a staggered grid of holes; the halls' light comes through the holes
function perfTex() {
  const holes = (g, col) => { g.fillStyle = col; for (let y = 4; y < 64; y += 8) for (let x = ((y / 8) % 2) * 4 + 2; x < 64; x += 8) { g.beginPath(); g.arc(x, y, 1.8, 0, 7); g.fill(); } };
  const map = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#4c5058'; g.fillRect(0, 0, w, h); holes(g, '#24262c'); });
  const glow = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#000000'; g.fillRect(0, 0, w, h); holes(g, '#ffcf8a'); });
  return { map, glow };
}
// dancing fountain jets: soft additive columns, each rising and falling on its own phase, colours drifting
// (vertex colour r = phase, b = hue; the jets' feet sit on the water at poolY)
function jetMat(time, poolY) {
  return new THREE.ShaderMaterial({
    uniforms: { time, poolY: { value: poolY }, uCurveY: curveUniforms.uCurveY, uCurveX: curveUniforms.uCurveX },
    vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `uniform float time, poolY, uCurveY, uCurveX; varying vec2 vUv; varying vec3 vC;
      void main(){
        vUv = uv; vC = color;
        float k = 0.22 + 0.78 * pow(0.5 + 0.5 * sin(time * 1.8 + color.r * 6.2832 + sin(time * 0.37) * 2.5), 1.6);
        vec3 p = position; p.y = poolY + (p.y - poolY) * k;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); ${CURVE_GLSL}
        gl_Position = projectionMatrix * mvPosition;
      }`,
    fragmentShader: `uniform float time; varying vec2 vUv; varying vec3 vC;
      vec3 hue(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
      void main(){
        float a = pow(1.0 - abs(vUv.x * 2.0 - 1.0), 2.2) * (1.0 - smoothstep(0.72, 1.0, vUv.y)) * (0.75 + 0.25 * sin(vUv.y * 40.0 - time * 9.0));
        vec3 c = mix(vec3(1.0), hue(fract(vC.b + time * 0.04)), 0.6);
        gl_FragColor = vec4(c * a * 0.85, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function hzLandmarks(K, S, { lakeSide, kit }) {
  const time = { value: 0 };
  const pt = perfTex();
  const perfMat = std({ map: pt.map, emissive: '#ffffff', emissiveMap: pt.glow, emissiveIntensity: 0.24, roughness: 0.45, metalness: 0.55 });
  const glassMat = basic({ color: hdr('#9ad8ff', 1.0), transparent: true, opacity: 0.16, depthWrite: false });
  const poolMat = std({ color: '#06090e', metalness: 0.95, roughness: 0.06 });
  const jets = jetMat(time, 0.08);
  const jet = (b, x, z, h, ph, hue) => {   // two crossed soft columns
    const c = new THREE.Color(ph, 0, hue);
    for (const ry of [0, Math.PI / 2]) b.add(G.plane, jets, x, 0.08 + h / 2, z, 0.55, h, 1, 0, ry, 0, c);
  };
  // a slab between two points on the ground plan (x, distance), at height y, w wide (along the line)
  const along = (b, mat, x0, d0, x1, d1, y, h, t, color) => {
    const dx = x1 - x0, dz = -(d1 - d0), len = Math.hypot(dx, dz);
    b.add(G.box, mat, (x0 + x1) / 2, y, -(d0 + d1) / 2, t, h, len, 0, Math.atan2(dx, dz), 0, color);
  };

  // ---------- 城市阳台 ----------
  const balcony = () => {
    const b = new Batcher();
    lakeSide(b, { willows: false, lotus: 0, modern: true });
    const NX = -11.4, FX = -66, plan = [[NX, 14], [FX, 22], [FX, 70], [NX, 76]];
    // the deck: a slab folded back at both ends, on the halls under its land side, cantilevered out over the river
    const deck = new THREE.ExtrudeGeometry(new THREE.Shape(plan.map(([x, d]) => new THREE.Vector2(x, d))), { depth: 1.2, bevelEnabled: false });
    deck.rotateX(-Math.PI / 2); deck.translate(0, DECK - 1.2, 0);
    b.addM(deck, VC.solid, new THREE.Matrix4(), '#5a5e66');
    b.block(VC.solid, '#24262c', -23, -0.8, -46.5, 23, DECK - 1.2 + 0.8, 55);
    // the folded face toward the street: perforated steel panels zigzagging, moon windows glowing in some of them
    for (let k = 0, d = 16.2; d < 74; k++, d += 2.42) {
      const e = k % 2 ? 1 : -1, ry = Math.PI / 2 + e * 0.22, px = NX + 0.18, pz = -(d + 1.21);
      b.addM(perfBox(0.1, DECK - 0.4, 2.46), perfMat, new THREE.Matrix4().makeRotationY(ry - Math.PI / 2).setPosition(px, (DECK - 0.4) / 2 - 0.8, pz), null);
      if (k % 3 === 1 || (k % 7 === 3)) {
        const r = rand(0.45, 1.05), wy = rand(0.9 + r, DECK - 1.6 - r), nx = Math.sin(ry) * 0.07, nz = Math.cos(ry) * 0.07;
        b.add(DISK, VC.glow, px + nx, wy, pz + nz, r * 2, r * 2, 1, 0, ry, 0, hdr(pick(['#ffd9a0', '#ffe8c0', '#ffcf8a']), 1.05));
        b.add(G.tor, VC.solid, px + nx * 1.3, wy, pz + nz * 1.3, r * 2.1, r * 2.1, r * 1.6, 0, ry, 0, '#1a1c20');
      }
    }
    // glass balustrades with a steel rail along the deck's edges, a line of blue light under them
    const rail = (x0, d0, x1, d1) => {
      along(b, glassMat, x0, d0, x1, d1, DECK + 0.55, 1.1, 0.04);
      along(b, VC.metal, x0, d0, x1, d1, DECK + 1.12, 0.06, 0.08, '#c8ccd2');
      along(b, VC.glow, x0, d0, x1, d1, DECK - 1.25, 0.1, 0.1, hdr('#3ab0ff', 2.2));
    };
    rail(NX, 14, NX, 30.8); rail(NX, 35.2, NX, 76); rail(NX, 14, FX, 22); rail(FX, 22, FX, 70); rail(FX, 70, NX, 76);
    // on the deck: a row of trees, lamps, people at the rail looking at the city and over the river
    for (let d = 19; d < 72; d += rand(8, 10)) kit.camphor(b, NX - rand(5, 7), -d, rand(0.55, 0.7), { y: DECK });
    for (let d = 18; d < 74; d += 12) { b.cyl(VC.metal, '#c8ccd0', NX - 1.6, DECK + 2, -d, 0.05, 4, 'cyl8'); b.box(VC.glow, hdr('#f0f6ff', 2.4), NX - 1.6, DECK + 4.05, -d, 0.5, 0.1, 0.3); }
    for (let k = 0; k < 16; k++) K.person(b, NX - rand(0.5, 2.6), -rand(16, 74), { y: DECK, ry: chance(0.6) ? Math.PI / 2 + rand(-0.6, 0.6) : -Math.PI / 2 + rand(-0.6, 0.6), phone: chance(0.4), hanfu: chance(0.08) });
    // the glass pavilion on the deck, its film screens playing the show
    b.block(VC.solid, '#1e2228', -40, DECK, -47, 14, 0.3, 10);
    b.box(glassMat, '#ffffff', -40, DECK + 2.9, -47, 14, 5.2, 10);
    b.add(G.plane, S.street, -32.98, DECK + 2.8, -47, 9.6, 5, 1, 0, Math.PI / 2, 0, S.tint(30, 0.85, 9.6));
    b.add(G.plane, S.street, -40, DECK + 2.8, -41.98, 13.6, 5, 1, 0, 0, 0, S.tint(46, 0.85, 13.6));
    b.add(G.box, VC.solid, -40, DECK + 5.9, -47, 15, 0.25, 11, 0, 0, 0.12, '#2a2e36');
    b.box(VC.glow, hdr('#3ab0ff', 2.0), -32.5, DECK + 6.35, -47, 0.12, 0.12, 11);
    // the glazed end toward the runner: the halls' yellow V trusses lit behind the glass
    along(b, glassMat, NX, 15.6, -34, 17.1, 2.0, 5.6, 0.05);
    b.box(VC.glow, hdr('#fff0d8', 1.1), -22.7, DECK - 1.6, -17.6, 22, 0.15, 1.2);
    for (let k = 0; k < 7; k++) {
      const vx = NX - 1.8 - k * 3.2;
      for (const e of [-1, 1]) b.add(G.box, VC.glow, vx + e * 0.75, 2.0, -17.4, 0.35, 5.8, 0.35, 0, 0, -e * 0.28, hdr('#ffb81a', 1.05));
    }
    // the ramp from the riverside walk to the deck: glass sides, lit handrails, on three columns
    const R0 = 1.5, R1 = 31, RX = -9.0, slope = Math.atan(DECK / (R1 - R0)), len = Math.hypot(R1 - R0, DECK);
    b.add(G.box, VC.solid, RX, DECK / 2 - 0.15, -(R0 + R1) / 2, 2.8, 0.3, len, slope, 0, 0, '#6a6e76');
    for (const e of [-1, 1]) {
      b.add(G.box, glassMat, RX + e * 1.38, DECK / 2 + 0.55, -(R0 + R1) / 2, 0.04, 1.1, len, slope, 0, 0, '#ffffff');
      b.add(G.box, VC.glow, RX + e * 1.38, DECK / 2 + 1.12, -(R0 + R1) / 2, 0.06, 0.06, len, slope, 0, 0, hdr('#e8f4ff', 1.8));
    }
    for (const d of [10, 18, 26]) { const y = (DECK * (d - R0)) / (R1 - R0); b.block(VC.solid, '#5a5e66', RX, 0, -d, 0.6, y - 0.3, 0.6); }
    b.block(VC.solid, '#6a6e76', -9.5, DECK - 0.3, -33, 4.0, 0.3, 4.4);   // the landing onto the deck
    for (let k = 0; k < 6; k++) { const d = rand(R0 + 2, R1 - 1); K.person(b, RX + rand(-0.8, 0.8), -d, { y: (DECK * (d - R0)) / (R1 - R0), ry: chance(0.7) ? Math.PI : 0, phone: chance(0.3) }); }
    // the name at the foot of the ramp
    b.block(VC.solid, '#8a8a84', -6.1, 0, -0.6, 3.4, 1.1, 0.6);
    K.sign(b, SIGN['城市阳台'], -6.1, 0.62, -0.28, 3.0, 0.75, 0);
    K.glowSeller(b, -5.2, -4.6, -1);
    K.strollers(b, -(EDGE + 0.6), -(EDGE + 3.3), 2, 78, 12, { gaps: [[0, 3], [3, 7]] });

    // ---------- across the track: the axis plaza, the pool and its fountain, the Citizen Center ----------
    b.box(VC.solid, '#5e5c58', 37.4, 0.03, -42, 53.3, 0.04, 72);
    b.add(G.plane, poolMat, 30, 0.07, -40, 22, 34, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#8a8880', 30, 0.08, -23, 22.4, 0.14, 0.3); b.box(VC.solid, '#8a8880', 30, 0.08, -57, 22.4, 0.14, 0.3);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 7; j++) jet(b, 22 + j * 2.6, -(28 + i * 6), i === 1 ? rand(4, 6.5) : rand(2, 3.6), (j / 7 + i * 0.13) % 1, (j * 0.08 + i * 0.3) % 1);
    for (const x of [14.5, 45.5]) for (let d = 8; d < 77; d += 9) {
      b.block(VC.solid, '#8a8880', x, 0, -d, 1.8, 0.5, 1.8);
      kit.camphor(b, x, -d, rand(0.85, 1.0), { y: 0.5 });
      b.addM(DISC, VC.glowAdd, new THREE.Matrix4().makeScale(3, 1, 3).setPosition(x, 0.08, -d), hdr('#ffd9a0', 0.1));
    }
    for (let d = 4; d < 78; d += 18) { b.cyl(VC.metal, '#c8ccd0', 11.6, 4, -d, 0.07, 8, 'cyl8'); b.box(VC.glow, hdr('#e8f4ff', 2.6), 11.0, 7.95, -d, 1.4, 0.08, 0.22); }
    K.strollers(b, EDGE + 0.6, EDGE + 6.4, 2, 78, 12);
    K.strollers(b, 18, 42, 8, 74, 10);
    // the Citizen Center: six round towers on a ring, joined at the top by skybridges, the round podium between them
    const CX = 92, CZ = -62, RR = 34, TH = 82;
    b.add(G.cyl, VC.solid, CX, 5, CZ, RR * 2 - 6, 10, RR * 2 - 6, 0, 0, 0, '#2a2e36');
    const pts = [];
    for (let k = 0; k < 6; k++) {
      const a = ((k + 0.5) / 6) * Math.PI * 2, x = CX + Math.cos(a) * RR, z = CZ + Math.sin(a) * RR;
      pts.push([x, z]);
      b.addM(roundGeo(10, TH, K.officeTex, 1.6, 3.6), K.officeMat, at(x, 0, z), '#e8eef8');
      b.add(G.sphLow, VC.solid, x, TH, z, 20, 3, 20, 0, 0, 0, '#3a4048');
      b.add(G.cyl, VC.glow, x, TH - 1, z, 20.4, 0.8, 20.4, 0, 0, 0, hdr('#ffffff', 1.6));
    }
    for (let k = 0; k < 6; k++) {
      const [x0, z0] = pts[k], [x1, z1] = pts[(k + 1) % 6], len = Math.hypot(x1 - x0, z1 - z0);
      b.add(G.box, VC.solid, (x0 + x1) / 2, TH - 6, (z0 + z1) / 2, 7, 6, len - 14, 0, Math.atan2(x1 - x0, z1 - z0), 0, '#3a4048');
      b.add(G.box, VC.glow, (x0 + x1) / 2, TH - 6, (z0 + z1) / 2, 7.1, 0.5, len - 14, 0, Math.atan2(x1 - x0, z1 - z0), 0, hdr('#bfe8ff', 1.6));
    }
    for (const [d, w] of [[14, 22], [44, 26]]) K.tower(b, 132 + w / 2, -(d + w / 2), { s: 1, w, d: w, h: rand(160, 230), kind: 'slab', name: true });
    return K.flushSteam(b.build());
  };

  // ---------- 钱江灯光秀 ----------
  const lightshow = () => {
    const b = new Batcher();
    lakeSide(b, { willows: false, lotus: 0, modern: true });
    K.farBank(b, { x0: 92, n: 6, z0: 2, z1: 79 });
    for (let z = rand(0, 8); z < 72; ) {   // a taller row behind the far bank's waterfront
      const w = rand(20, 30), d = rand(16, 24);
      K.tower(b, -(150 + rand(0, 26) + w / 2), -(z + d / 2), { s: -1, w, d, h: rand(110, 210), kind: pick(['slab', 'slab', 'round', 'sail', 'twin']), far: true, name: chance(0.5), refl: true });
      z += d + rand(6, 14);
    }
    K.cruise(b, -48, -38, { len: 32 });
    K.refl(b, -70, -64, 40, 2.2, '#ffe0a8', { x0: 11.6 });
    // the near bank: a crowd along the railing holding up their phones, night vendors among them
    K.spectators(b, -(EDGE + 2.2), -(EDGE + 6.7), 1, 79, 34, -1, [[20, 23], [52, 55]]);
    K.glowSeller(b, -(EDGE + 1.6), -21.5, -1);
    K.glowSeller(b, -(EDGE + 1.6), -53.5, -1);
    K.strollers(b, -(EDGE + 0.6), -(EDGE + 1.8), 2, 78, 6);
    K.riverPark(b, 1, 0, CHUNK_LEN);
    K.cityRow(b, 1, { show: S.hero, bright: 1.1, names: 0.8 });
    K.strollers(b, EDGE + 0.6, EDGE + 2.8, 2, 78, 12, { ry: -Math.PI / 2 });
    return K.flushSteam(b.build());
  };

  return {
    landmarks: [
      { key: 'balcony', name: '城市阳台', en: 'CITY BALCONY', build: balcony },
      { key: 'lightshow', name: '钱江灯光秀', en: 'QIANJIANG LIGHT SHOW', build: lightshow },
    ],
    update(t) { time.value = t; },
  };
}
