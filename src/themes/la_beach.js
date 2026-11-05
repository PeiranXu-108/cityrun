// The run along the beach from Venice to Santa Monica: seven chunks in a row on the loop (la.js ZONES). Between the
// Venice canals and their footbridges; down Windward Avenue, under the VENICE sign hung across it, past the car park
// and its seawall out onto the beach (a landmark); the boardwalk; Muscle Beach, the courts and the skate park; the open
// sand with its towers, nets and fires; under the Santa Monica Pier among its pilings (a landmark), the Ferris wheel and
// the coaster lit up over you; along the foot of the Palisades' bluffs to the groin of boulders where the beach ends.
// The sea is on the left all the way: the sand runs down from the walk's low wall over the berm and the beach face into
// the water some thirty metres out, the swell breaking on the bar, the whitewater rolling in and running up the sand
// (la_sea.js), the sun going down into it. The waterline, the bluffs and the coast road are measured along the stretch
// (S, metres from the start of the canals) so each chunk carries them on where the last one left off.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, planeUV, CHUNK_LEN, rand, randi, pick, chance, clamp, smooth } from '../core.js';
import { beam } from './tokyo_kit.js';
import { frame } from './ny_icons.js';
import { mirrorInto, mergeInto, clearWater } from './beijing_sights.js';
import { SANS, BLADE, DECO, BEACH_SIGNS, BOARDS, PASTEL, STUCCO, X0, GI, face } from './la_kit.js';
import { SEA, seaMat, swashMat, seaGeo } from './la_sea.js';

const ARCH = new THREE.TorusGeometry(0.5, 0.08, 6, 12, Math.PI);   // a half ring: an arch springing from y = 0, in the xy plane
const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);

export const STRETCH = { first: 19, len: 7 };
const WALL = -11;      // the low wall between the walk and the sand
const BERM = 12;       // the berm's crest, this far up the beach from the waterline
const COAST = -92;     // the waterline behind the towns either side of the beach: past their back lots, out of sight
// the waterline's x at S: about thirty metres out from the walk, wider at Muscle Beach, a little wobble in it
const SHORE = [[120, -30], [200, -30], [280, -35], [360, -29], [440, -31], [520, -27], [560, -27]];
export function shoreX(S) {
  let i = 0;
  while (i < SHORE.length - 2 && S > SHORE[i + 1][0]) i++;
  const [s0, x0] = SHORE[i], [s1, x1] = SHORE[i + 1], t = clamp((S - s0) / (s1 - s0), 0, 1);
  return x0 + (x1 - x0) * smooth(t) + 1.3 * Math.sin(S * 0.037 + 0.4) + 0.6 * Math.sin(S * 0.091 + 2.2);
}
// the sand h metres up the beach from the waterline (the walk's wall hw up): under the water, the beach face, the berm
export function sandAt(h, hw = 19) {
  if (h <= 0) return SEA + h * 0.09;
  if (h <= BERM) return SEA + (-0.18 - SEA) * Math.pow(h / BERM, 0.9);
  return -0.18 + 0.13 * smooth(clamp((h - BERM) / Math.max(1, hw - BERM), 0, 1));
}
export const sandY = (x, S) => { const xs = shoreX(S); return sandAt(x - xs, WALL - 0.2 - xs); };
// the bluffs on the right from the strand to the end: their foot's x and their height at S (rising out of the car park,
// the pier's bridge meeting them at the top, highest along the Palisades, falling away to the incline at the end)
const BLUFF = [[320, 30.5, 0.4], [352, 30.5, 7], [392, 30.5, 10], [412, 30.5, 13], [470, 30, 14.5], [505, 29.5, 24], [530, 29.5, 26], [548, 29.5, 18], [560, 29.5, 7]];
function bluffAt(S) {
  let i = 0;
  while (i < BLUFF.length - 2 && S > BLUFF[i + 1][0]) i++;
  const [s0, x0, h0] = BLUFF[i], [s1, x1, h1] = BLUFF[i + 1], t = smooth(clamp((S - s0) / (s1 - s0), 0, 1));
  return [x0 + (x1 - x0) * t, h0 + (h1 - h0) * t];
}

// ---------- textures ----------
function sandTex() {   // dry sand: fine grain, wind ripples, footprints, a shell or two
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#d8bc96'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 7000; i++) { const v = randi(-18, 14); g.fillStyle = `rgba(${216 + v},${188 + v},${150 + v},0.8)`; g.fillRect(rand(0, w), rand(0, h), rand(1, 2), rand(1, 2)); }
    g.strokeStyle = 'rgba(150,120,90,0.16)'; g.lineWidth = 2;
    for (let i = 0; i < 18; i++) { g.beginPath(); const y = rand(0, h); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 4); g.stroke(); }
    for (let k = 0; k < 6; k++) {   // a line of footprints
      let x = rand(0, w), y = rand(0, h); const a = rand(0, 6.28);
      for (let j = 0; j < 7; j++) { g.fillStyle = 'rgba(140,108,78,0.26)'; g.beginPath(); g.ellipse(((x % w) + w) % w, ((y % h) + h) % h, 2.6, 4.4, a, 0, Math.PI * 2); g.fill(); x += Math.cos(a) * 9 + (j % 2 ? 3 : -3); y += Math.sin(a) * 9; }
    }
    for (let i = 0; i < 14; i++) { g.fillStyle = pick(['rgba(250,240,230,0.8)', 'rgba(230,200,190,0.8)']); g.fillRect(rand(0, w), rand(0, h), 2, 1.5); }
  });
}
function plankTex() {   // the pier's planks, weathered grey-brown
  return canvasTex(128, 128, (g, w, h) => {
    for (let y = 0; y < h; y += 8) { const v = randi(-16, 16); g.fillStyle = `rgb(${140 + v},${118 + v},${96 + v})`; g.fillRect(0, y, w, 7); g.fillStyle = '#4a3a2c'; g.fillRect(0, y + 7, w, 1); }
    for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(60,44,30,0.25)'; g.fillRect(rand(0, w), rand(0, h), rand(4, 20), 1); }
    for (let y = 3; y < h; y += 8) for (let x = rand(0, 20); x < w; x += rand(30, 50)) { g.fillStyle = 'rgba(40,30,24,0.55)'; g.fillRect(x, y, 1.5, 1.5); }   // the nails
  });
}
function netTex() {   // a volleyball net: the mesh, the white tape along its top
  return canvasTex(64, 32, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#1a1a1e'; g.lineWidth = 1.2;
    for (let x = 0; x <= w; x += 4) { g.beginPath(); g.moveTo(x, 4); g.lineTo(x, h); g.stroke(); }
    for (let y = 4; y <= h; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#f4f0e8'; g.fillRect(0, 0, w, 4);
  });
}
function bluffTex() {   // the Palisades' sandstone: soft layers, runnels down its face
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#c8a078'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += rand(3, 9)) { g.fillStyle = `rgba(${pick([150, 200, 120])},${pick([110, 150, 90])},${pick([80, 100, 60])},${rand(0.1, 0.3)})`; g.fillRect(0, y, w, rand(1, 4)); }
    for (let i = 0; i < 26; i++) { const x = rand(0, w); g.strokeStyle = `rgba(110,80,56,${rand(0.15, 0.35)})`; g.lineWidth = rand(1, 2.5); g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 8) g.lineTo(x + Math.sin(y * 0.1 + i) * 2, y); g.stroke(); }
    for (let i = 0; i < 900; i++) { const v = randi(-20, 20); g.fillStyle = `rgba(${200 + v},${160 + v},${120 + v},0.5)`; g.fillRect(rand(0, w), rand(0, h), 2, 2); }
  });
}
// three boulders: icosahedra knocked out of true (the same corner moved the same way on every face it belongs to)
const ROCKS = Array.from({ length: 3 }, (_, k) => {
  const g = new THREE.IcosahedronGeometry(0.5, 0), p = g.attributes.position, key = (v) => Math.round(v * 97);
  const jit = new Map();
  for (let i = 0; i < p.count; i++) {
    const id = `${key(p.getX(i))}|${key(p.getY(i))}|${key(p.getZ(i))}`;
    if (!jit.has(id)) jit.set(id, 0.78 + Math.random() * 0.4);
    const f = jit.get(id); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * (k === 2 ? 0.75 : 1), p.getZ(i) * f);
  }
  g.computeVertexNormals();
  return g;
});
// a grid of (R + 1) × (C + 1) vertices at(r, c) → [x, y, z, u, v, colour?]; columns run landward (+x), rows away (-z)
function gridGeo(R, C, at, colours = false) {
  const pos = [], uv = [], cl = [], idx = [];
  for (let r = 0; r <= R; r++) for (let c = 0; c <= C; c++) { const v = at(r, c); pos.push(v[0], v[1], v[2]); uv.push(v[3], v[4]); if (colours) cl.push(v[5].r, v[5].g, v[5].b); }
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const a = r * (C + 1) + c, b = a + 1, d = a + C + 1, e = d + 1; idx.push(a, b, d, b, e, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (colours) g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// a quad from (x0, y0) across to (x1, y1) (x0 < x1), running from z0 back to z1 (chunk-local, z1 < z0); UVs in metres / ku, kv
export function quad(b, mat, x0, y0, x1, y1, z0, z1, { ku = 4, kv = 4, col = 0xffffff, c0 = null, c1 = null } = {}) {
  const P = [[x0, y0, z0], [x1, y1, z0], [x1, y1, z1], [x0, y0, z0], [x1, y1, z1], [x0, y0, z1]], g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P.flat(), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(P.flat().filter((_, i) => i % 3 !== 1).map((v, i) => (i % 2 ? -v / kv : (v - x0) / ku)), 2));
  if (c0) { const a = new THREE.Color(c0), c = new THREE.Color(c1 || c0); g.setAttribute('color', new THREE.Float32BufferAttribute(P.flatMap((p) => (p[0] === x0 ? [a.r, a.g, a.b] : [c.r, c.g, c.b])), 3)); }
  g.computeVertexNormals();
  b.addM(g, mat, new THREE.Matrix4(), c0 ? null : col);
}

const TOWELS = ['#e8302a', '#ffd23d', '#39c8e8', '#ff7ab8', '#f4f0e8', '#7cd84a', '#ff8a2a', '#2a6ad8', '#b46bff'];
const PARASOL = ['#e8302a', '#ffd23d', '#2a6ad8', '#ff7ab8', '#3ab4a0', '#f4f0e8', '#ff8a2a'];

export function makeBeach(K) {
  const sandMat = std({ map: sandTex(), vertexColors: true, roughness: 0.95 });
  const sea = seaMat(), swash = swashMat();
  const plankMat = std({ map: plankTex(), vertexColors: true, roughness: 0.85 });
  const netMat = std({ map: netTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
  netMat.map.repeat.set(1, 1);
  const bluffMat = std({ map: bluffTex(), vertexColors: true, roughness: 0.95 });
  const canalMat = clearWater('#1a2a4a', 4, 0.55);
  const DRY = new THREE.Color('#ffffff'), WET = new THREE.Color('#c4a69c');
  const rock = (b, x, y, z, s, col = pick(['#9a9086', '#a89c90', '#8a8278', '#b0a698', '#7e766c'])) => b.add(pick(ROCKS), VC.solid, x, y, z, s * rand(0.9, 1.3), s * rand(0.7, 1.0), s * rand(0.9, 1.3), rand(0, 3), rand(0, 6.28), rand(0, 3), col);

  // ---------- the beach ----------
  // The sand from the wall down into the water, the swash along the waterline, the sea out to the horizon, between
  // chunk-local z0 and z1 in a chunk that starts at Sc along the stretch.
  const HS = [-4.5, -2, -0.7, 0.3, 1.2, 2.3, 3.6, 5, 6.6, 8.4, 10.2, BERM];   // the sand's columns up the beach (then four more to the wall)
  const SW = [-2.8, -1.8, -1.0, -0.4, 0, 0.3, 0.8, 1.5, 2.3, 3.2, 4.2, 5.2, 6.2, 7.2];   // the swash's
  const beach = (b, Sc, z0 = 0, z1 = -CHUNK_LEN, { wall = true } = {}) => {
    const R = Math.max(1, Math.round((z0 - z1) / 4)), zr = (r) => z0 + ((z1 - z0) * r) / R;
    if (wall) { b.box(VC.solid, '#c8bcae', WALL, 0.2, (z0 + z1) / 2, 0.45, 0.5, z0 - z1); b.box(VC.solid, '#d8ccbe', WALL, 0.47, (z0 + z1) / 2, 0.55, 0.06, z0 - z1); }
    b.addM(gridGeo(R, HS.length + 3, (r, c) => {
      const z = zr(r), S = Sc - z, xs = shoreX(S), hw = WALL - 0.2 - xs, h = c < HS.length ? HS[c] : BERM + ((hw - BERM) * (c - HS.length + 1)) / 4;
      const x = c === HS.length + 3 ? WALL - 0.2 : xs + h;
      return [x, sandAt(h, hw), z, x / 8, -z / 8, WET.clone().lerp(DRY, smooth(clamp((h - 1.5) / 6, 0, 1)))];
    }, true), sandMat, new THREE.Matrix4(), null);
    const R2 = Math.max(1, Math.round((z0 - z1) / 2.5));
    b.addM(gridGeo(R2, SW.length - 1, (r, c) => {
      const z = z0 + ((z1 - z0) * r) / R2, S = Sc - z, xs = shoreX(S), h = SW[c];
      return [xs + h, Math.max(sandAt(h), SEA) + 0.03, z, -h, S];
    }), swash, new THREE.Matrix4(), null);
    b.addM(seaGeo(shoreX, Sc - z0, Sc - z1, Sc), sea, new THREE.Matrix4(), null);
    for (let k = randi(3, 6); k > 0; k--) {   // kelp left along the high-water line
      const z = rand(z1 + 2, z0 - 2), S = Sc - z, h = rand(5.6, 6.8), x = shoreX(S) + h;
      b.add(G.sphLow, VC.solid, x, sandAt(h) + 0.02, z, rand(0.5, 1.2), 0.08, rand(0.3, 0.6), 0, rand(0, 3), 0, pick(['#3a3020', '#4a3a24', '#2e2a1c']));
    }
  };
  // the sea beyond the towns either side of the beach: the riprap along the back lots' edge, the water past it
  const coastSea = (b, z0 = 0, z1 = -CHUNK_LEN) => {
    for (let z = z0 - rand(0, 1); z > z1; z -= rand(1.2, 1.9)) rock(b, COAST + 0.6 + rand(-0.6, 0.6), rand(-0.9, -0.3), z, rand(1.4, 2.4));
    b.addM(seaGeo(() => COAST, -z0, -z1, 0, { D: [-1, 0, 2, 5, 9, 14, 20, 28, 40, 60, 90, 140, 220, 340, 520] }), sea, new THREE.Matrix4(), null);
  };
  // a breakwater of boulders across the beach and out into the sea at chunk-local z (from the wall to x1)
  const groin = (b, z, Sc, x1 = -104) => {
    for (let x = WALL - 0.9; x > x1; x -= rand(1.1, 1.7)) {   // (smaller where it leaves the walk, bigger out in the surf)
      const S = Sc - z, top = x > shoreX(S) ? sandY(x, S) : SEA, k = clamp((WALL - x) / 20, 0.55, 1);
      for (const dz of [-1.1, 0.4]) rock(b, x, top + rand(0.1, 0.6) * k + (dz < 0 ? 0.25 : 0), z + dz + rand(-0.4, 0.4), rand(1.6, 2.6) * k);
    }
  };

  // ---------- on the sand ----------
  // an LA County lifeguard tower: the hut up on its braced legs, glazed all round, the deck toward the sea with its rail,
  // the ramp down behind, the number on its side, a flag on the roof
  const tower = (b, x, z, S, { col = pick(['#8ac8e8', '#8ac8e8', '#9ad0ec', '#f4f0e8', '#ffd23d']), rainbow = chance(0.12) } = {}) => {
    const F = frame(b, x, sandY(x, S) - 0.1, z, 1, -Math.PI / 2), white = '#f2eee6', leg = '#d8d4cc';   // its front (local +z) to the sea
    for (const [lx, lz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) F.box(VC.solid, leg, lx, 1.05, lz, 0.2, 2.3, 0.2);
    for (const lx of [-1.3, 1.3]) { F.beam(VC.solid, leg, [lx, 0.25, 1.3], [lx, 1.95, -1.3], 0.09, 0.09); F.beam(VC.solid, leg, [lx, 0.25, -1.3], [lx, 1.95, 1.3], 0.09, 0.09); }
    F.beam(VC.solid, leg, [-1.3, 0.25, -1.3], [1.3, 1.95, -1.3], 0.09, 0.09);
    F.box(VC.solid, '#e2ded6', 0, 2.2, 0.55, 3.6, 0.16, 4.5);   // the deck
    if (rainbow) ['#e8302a', '#ff8a2a', '#ffd23d', '#3aa84a', '#2a6ad8', '#7a3ab4'].forEach((c, k) => F.box(VC.solid, c, 0, 2.48 + k * 0.4, -0.55, 2.8, 0.4, 2.4));
    else F.box(VC.solid, col, 0, 3.5, -0.55, 2.8, 2.4, 2.4);
    F.box(VC.glow, hdr('#4a5a7a', 0.95), 0, 3.75, 0.66, 2.5, 1.05, 0.04);   // the glazing: the sea side, the two ends
    for (const lx of [-1.41, 1.41]) F.box(VC.glow, hdr('#4a5a7a', 0.95), lx, 3.75, -0.45, 0.04, 1.05, 1.9);
    for (const k of [-1.25, -0.42, 0.42, 1.25]) F.box(VC.solid, white, k, 3.75, 0.69, 0.07, 1.12, 0.05);
    for (const lx of [-1.43, 1.43]) for (const k of [-1.35, -0.45, 0.45]) F.box(VC.solid, white, lx, 3.75, k, 0.05, 1.12, 0.07);
    F.box(VC.solid, white, 0, 3.17, -0.55, 2.86, 0.08, 2.46); F.box(VC.solid, white, 0, 4.33, -0.55, 2.86, 0.08, 2.46);
    F.box(VC.solid, white, 0, 4.78, -0.45, 3.5, 0.16, 3.2);   // the roof: its fascia, the shallow hip over it
    F.add(G.cone4, VC.solid, 0, 5.12, -0.45, 4.9, 0.55, 4.5, 0, 0, 0, '#e8e4dc');
    for (const [a, c] of [[[-1.75, 2.6, 2.75], [1.75, 2.6, 2.75]], [[-1.75, 2.6, 0.7], [-1.75, 2.6, 2.75]], [[1.75, 2.6, 0.7], [1.75, 2.6, 2.75]]]) {   // the deck's rail
      for (const y of [2.62, 3.25]) F.beam(VC.solid, white, [a[0], y, a[2]], [c[0], y, c[2]], 0.06, 0.06);
      for (let t = 0; t <= 1.001; t += 0.25) F.box(VC.solid, white, a[0] + (c[0] - a[0]) * t, 2.75, a[2] + (c[2] - a[2]) * t, 0.06, 0.95, 0.06);
    }
    F.beam(VC.solid, '#d8d4cc', [0.75, 2.2, -1.75], [0.75, 0.0, -6.4], 1.1, 0.12);   // the ramp down the back, its handrails
    for (const e of [0.2, 1.3]) { F.beam(VC.solid, white, [e, 3.1, -1.75], [e, 0.9, -6.4], 0.06, 0.06); F.box(VC.solid, white, e, 0.45, -6.3, 0.06, 0.9, 0.06); }
    F.cyl(VC.metal, '#d8d8dc', 1.25, 6.0, -1.7, 0.03, 2.4, 'cyl6');   // the flag
    F.box(VC.solid, pick(['#e8302a', '#ffd23d', '#e8302a']), 1.25, 6.85, -1.25, 0.02, 0.5, 0.85);
    K.sign(F, String(randi(12, 29)), { w: 128, h: 96, color: '#1a2a5a', font: SANS, weight: 700, size: 0.7, k: 1.0 }, 1.44, 2.85, -0.55, 0.85, 0.55, 1, 0, Math.PI / 2, 0);
    const lg = F.at(0.4, 0, 1.6);
    if (chance(0.5)) K.person(b, lg.x, lg.z, { y: sandY(x, S) + 2.2, ry: Math.PI / 2, top: '#e8302a', shorts: true, legs: '#e8302a', hat: 'cap', shades: true, bag: false, phone: false });   // the lifeguard on watch
    if (chance(0.4)) { const p = F.at(1.0, 0, -3.5); b.add(G.box, VC.solid, p.x, sandY(p.x, S) + 0.45, p.z, 0.6, 0.8, 2.0, 0, 0, 0.3, '#e8302a'); }   // a rescue board leaning on the ramp
  };
  const sunbather = (b, x, z, S) => {   // a towel, someone lying on it or sitting up facing the sea; a parasol, a chair, a cooler
    const y = sandY(x, S), a = rand(-0.4, 0.4);
    b.add(G.box, VC.solid, x, y + 0.025, z, 1.0, 0.03, 1.9, 0, a, 0, pick(TOWELS));
    if (chance(0.55)) K.person(b, x, z, { lying: true, beach: true, y: y + 0.05, ry: a + (chance(0.5) ? 0 : Math.PI), shades: chance(0.6) });
    else K.person(b, x + 0.15, z, { seated: true, beach: true, y: y - 0.32, ry: Math.PI / 2 + a, shades: true });
    if (chance(0.45)) {   // the parasol, leaning toward the sun: its pole, the canopy, the valance, the finial
      const px = x + 0.7, pz = z + 0.5, c = pick(PARASOL);
      b.add(G.cyl6, VC.metal, px, y + 1.15, pz, 0.05, 2.4, 0.05, 0, 0, -0.12, '#d8d8d8');
      b.add(G.cone8, VC.solid, px - 0.15, y + 2.42, pz, 2.5, 0.55, 2.5, 0, rand(0, 1), -0.12, c);
      b.add(G.cyl8, VC.solid, px - 0.12, y + 2.17, pz, 2.52, 0.12, 2.52, 0, 0, -0.12, '#f4f0e8');
      b.sph(VC.solid, c, px - 0.18, y + 2.75, pz, 0.07, true);
    }
    if (chance(0.3)) {   // a low beach chair
      const cx = x - 0.4, cz = z - 1.6;
      b.box(VC.metal, '#c8ccd2', cx, y + 0.18, cz, 0.6, 0.04, 0.55); b.add(G.box, VC.solid, cx + 0.22, y + 0.4, cz, 0.06, 0.55, 0.55, 0, 0, -0.35, pick(TOWELS));
      b.box(VC.solid, pick(TOWELS), cx - 0.05, y + 0.22, cz, 0.5, 0.04, 0.5);
    }
    if (chance(0.3)) { b.block(VC.solid, pick(['#2a6ad8', '#e8302a', '#f4f0e8']), x + 0.7, y, z - 0.9, 0.5, 0.36, 0.35); b.box(VC.solid, '#f4f0e8', x + 0.7, y + 0.38, z - 0.9, 0.52, 0.05, 0.37); }   // a cooler
  };
  const volleyball = (b, x, z, S) => {   // the net between its posts and their guy ropes, the lines in the sand, the players
    const y = sandY(x, S);
    for (const e of [-1, 1]) { b.cyl(VC.metal, '#e8e4dc', x, y + 1.3, z + e * 4.6, 0.06, 2.8, 'cyl8'); beam(b, VC.solid, x, y + 2.6, z + e * 4.6, x, y, z + e * 6.2, 0.01, '#e8e4dc'); }
    b.add(planeUV({ u0: 0, u1: 9, v0: 0, v1: 1 }), netMat, x, y + 2.05, z, 9.0, 1.0, 1, 0, Math.PI / 2, 0);
    for (const [w, d, dx, dz] of [[16, 0.06, 0, 4.0], [16, 0.06, 0, -4.0], [0.06, 8, 8, 0], [0.06, 8, -8, 0]]) b.box(VC.solid, '#f4f0e8', x + dx, y + 0.03, z + dz, w, 0.01, d);
    for (const e of [-1, 1]) for (let k = 0; k < 2; k++) K.person(b, x + e * rand(2, 5), z + rand(-3, 3), { beach: true, y: sandY(x + e * 3, S), ry: e > 0 ? Math.PI / 2 : -Math.PI / 2, shades: false, reach: chance(0.5) });
    b.sph(VC.solid, '#f4f0e8', x + rand(-1, 1), y + rand(3.2, 4.5), z + rand(-2, 2), 0.14, true);
  };
  const bonfire = (b, x, z, S) => {   // a fire ring at sundown: the concrete ring, the logs, the flames, people round it
    const y = sandY(x, S);
    b.cyl(VC.solid, '#a8a29a', x, y + 0.3, z, 0.95, 0.6, 'cyl'); b.cyl(VC.solid, '#2a2420', x, y + 0.58, z, 0.8, 0.06, 'cyl');
    for (let k = 0; k < 4; k++) b.add(G.cyl6, VC.solid, x, y + 0.66, z, 0.16, 1.1, 0.16, 0, (k * Math.PI) / 4, Math.PI / 2 - 0.25, '#4a3020');
    b.add(G.cone8, VC.glow, x, y + 1.15, z, 0.9, 1.1, 0.9, 0, 0, 0, hdr('#ff7a2a', 3.2));
    b.add(G.cone8, VC.glow, x, y + 1.0, z, 0.5, 0.8, 0.5, 0, 0, 0, hdr('#ffd25a', 4.0));
    K.pool(b, x, z, 9, 9, hdr('#ff9a4a', 0.35), y + 0.08);
    K.smokeBuf.push([x, y + 1.7, z]);
    for (let k = 0; k < 6; k++) { if (chance(0.25)) continue; const a = (k / 6) * Math.PI * 2; K.person(b, x + Math.cos(a) * 2.1, z + Math.sin(a) * 2.1, { seated: true, y: y - 0.25, ry: -a - Math.PI / 2, beach: chance(0.5), shades: false }); }
  };
  const surfer = (b, d, z, S, { ride = false } = {}) => {   // out past the break waiting for a set, paddling, or up and riding the whitewater in
    const x = shoreX(S) - d, c = pick(BOARDS);
    if (ride) {
      b.add(G.sphLow, VC.solid, x, SEA + 0.12, z, 0.55, 0.1, 2.2, 0, rand(-0.3, 0.3), 0, c);
      K.person(b, x, z, { y: SEA + 0.16, beach: true, ry: chance(0.5) ? 0 : Math.PI, shades: false, reach: true, crouch: true });
    } else if (chance(0.4)) {
      b.add(G.sphLow, VC.solid, x, SEA + 0.06, z, 0.55, 0.1, 2.2, 0, -Math.PI / 2 + rand(-0.3, 0.3), 0, c);
      K.person(b, x, z, { lying: true, paddle: true, y: SEA + 0.12, beach: true, ry: -Math.PI / 2, shades: false });
    } else {
      const a = rand(0, 6.28);
      b.add(G.sphLow, VC.solid, x, SEA + 0.06, z, 0.55, 0.1, 2.2, 0, a, 0, c);
      K.person(b, x, z, { seated: true, y: SEA - 0.36, beach: true, ry: a, shades: false });
    }
  };
  const gull = (b, x, y, z, fly = false) => {   // a western gull standing on the sand, or gliding over the water
    const a = rand(0, 6.28), ca = Math.cos(a), sa = Math.sin(a);
    b.add(G.sphLow, VC.solid, x, y + 0.22, z, 0.2, 0.18, 0.42, 0, a, 0, '#f4f2ee');
    b.add(G.sphLow, VC.solid, x + sa * 0.2, y + 0.36, z + ca * 0.2, 0.13, 0.13, 0.15, 0, a, 0, '#f4f2ee');
    b.add(G.cone4, VC.solid, x + sa * 0.3, y + 0.35, z + ca * 0.3, 0.04, 0.12, 0.04, Math.PI / 2, a, 0, '#e8c040');
    if (fly) for (const e of [-1, 1]) b.add(G.box, VC.solid, x + ca * e * 0.45, y + 0.26, z - sa * e * 0.45, 0.8, 0.02, 0.22, 0, a + Math.PI / 2, e * 0.18, '#b8bcc4');
    else { b.add(G.box, VC.solid, x - sa * 0.05, y + 0.27, z - ca * 0.05, 0.22, 0.1, 0.34, 0, a, 0, '#9aa0a8'); for (const e of [-0.05, 0.05]) b.box(VC.solid, '#e8b890', x + ca * e, y + 0.05, z - sa * e, 0.02, 0.12, 0.02); }
  };
  // what's on the sand between distances z0 and z1 into a chunk starting at Sc
  const sandLife = (b, Sc, z0, z1, { towers = 1, nets = 0, fires = 0, towels = 6, surf = 3, ride = 1, gulls = 3 } = {}) => {
    const spot = (h0, h1, m = 2) => { const z = rand(z0 + m, z1 - m), S = Sc + z; return [shoreX(S) + rand(h0, h1), -z, S]; };
    for (let k = 0; k < towers; k++) { const [x, z, S] = spot(9, 11.5, 7); tower(b, x, z, S); }
    for (let k = 0; k < nets; k++) { const [x, z, S] = spot(9, 11, 8); volleyball(b, x, z, S); }
    for (let k = 0; k < fires; k++) { const [x, z, S] = spot(7, 12, 5); bonfire(b, x, z, S); }
    for (let k = 0; k < towels; k++) { const [x, z, S] = spot(3.5, 15); sunbather(b, x, z, S); }
    for (let k = randi(2, 4); k > 0; k--) { const [x, z, S] = spot(2, 16); K.person(b, x, z, { beach: true, y: sandY(x, S), surf: chance(0.4) }); }
    for (let k = randi(2, 4); k > 0; k--) { const [x, z, S] = spot(0.4, 2.6); K.person(b, x, z, { beach: true, y: sandY(x, S), ry: chance(0.5) ? 0 : Math.PI, kid: chance(0.3) }); }   // walking along the water
    if (chance(0.5)) { const [x, z, S] = spot(1, 3); K.dog(b, x, z, rand(0, 6), { y: sandY(x, S) }); }
    for (let k = 0; k < surf; k++) { const z = rand(z0, z1); surfer(b, rand(24, 40), -z, Sc + z); }
    for (let k = 0; k < ride; k++) { const z = rand(z0 + 4, z1 - 4); surfer(b, rand(7, 13), -z, Sc + z, { ride: true }); }
    for (let k = 0; k < gulls; k++) { const [x, z, S] = spot(0.5, 6); gull(b, x, sandY(x, S), z); }
    if (chance(0.6)) { const z = -rand(z0, z1), y = rand(5, 8), d = rand(14, 30); for (let k = 0; k < 4; k++) gull(b, shoreX(-z + Sc) - d - k * 1.6, y, z - k * 2.2, true); }   // pelicans skimming the swell in a line
  };
  // the walk: people, skaters, roller skaters and cyclists up and down beside the track
  const walkLife = (b, n = 10) => {
    for (const s of [-1, 1]) {
      K.throng(b, s * 4.6, s * 10.2, 2, CHUNK_LEN - 2, n, [], { shorts: true });
      for (let k = randi(1, 3); k > 0; k--) K.skater(b, s * rand(5, 9.5), -rand(4, 76));
      for (let k = randi(1, 2); k > 0; k--) K.person(b, s * rand(5, 9.5), -rand(4, 76), { skates: true, shorts: true, ry: chance(0.5) ? 0 : Math.PI });
    }
  };
  // the bike path along the top of the sand, its yellow line, the cyclists and skaters on it
  const bikePath = (b, Sc, z0 = 0, z1 = -CHUNK_LEN) => {
    const R = Math.max(1, Math.round((z0 - z1) / 8));
    b.addM(gridGeo(R, 1, (r, c) => { const z = z0 + ((z1 - z0) * r) / R, x = c ? -12.9 : -16.1; return [x, sandY(x, Sc - z) + 0.04, z, x / 6, -z / 6]; }), K.roadMat, new THREE.Matrix4(), null);
    for (let z = z0 - 1; z > z1 + 1; z -= 4) b.box(VC.solid, '#ffd23d', -14.5, sandY(-14.5, Sc - z) + 0.055, z - 1, 0.1, 0.01, 1.8);
    for (let k = randi(1, 3); k > 0; k--) { const z = rand(z1 + 4, z0 - 4); K.cyclist(b, rand(-13.6, -15.4), z, chance(0.5) ? 0 : Math.PI, { y: sandY(-14.5, Sc - z) + 0.04 }); }
  };
  // the palms at the walk's sea edge, the vendors' tables on the walk
  const seaEdge = (b, z0 = 0, z1 = CHUNK_LEN) => {
    for (let z = z0 + rand(3, 8); z < z1 - 2; z += rand(13, 17)) K.fanPalm(b, -12.1, -z, rand(1.0, 1.2), { y: -0.1 });
    for (let z = z0 + rand(4, 10); z < z1 - 3; z += rand(12, 18)) if (chance(0.6)) {
      b.box(VC.solid, '#e8e4dc', -9.6, 0.75, -z, 0.8, 0.06, 1.8); for (const e of [-0.8, 0.8]) b.box(VC.metal, '#5a5a60', -9.6, 0.37, -z + e, 0.7, 0.74, 0.04);
      for (let k = 0; k < 5; k++) b.box(VC.solid, pick(['#ff5aa0', '#39c8e8', '#ffd23d', '#7cd84a', '#f4f0e8', '#e8302a']), -9.6 + rand(-0.25, 0.25), 0.82, -z - 0.7 + k * 0.35, 0.22, rand(0.04, 0.12), 0.28);
      b.cyl(VC.metal, '#c8c8c8', -9.9, 1.3, -z, 0.025, 2.6, 'cyl6'); b.add(G.cone8, VC.solid, -9.9, 2.6, -z, 2.0, 0.45, 2.0, 0, 0, 0, pick(PARASOL));
      K.person(b, -10.4, -z + 0.4, { seated: true, ry: -Math.PI / 2 });
    }
  };
  // the back of the beach-town blocks on the right: their back lots and the ground out to the side
  const backLand = (b, s, x0 = 26) => b.box(VC.solid, '#8a7a62', s * (x0 + 40), -0.2, -CHUNK_LEN / 2, 80, 0.2, CHUNK_LEN);
  // a row of beach-town buildings on the right, their shops under them (the boardwalk's landward side)
  const shops = (b, z0, z1) => {
    const lots = K.shopRow(b, 1, z0, z1, { x0: X0, signs: BEACH_SIGNS, floors: [2, 3], styles: ['stucco', 'stucco', 'deco', 'mission'], colors: [...PASTEL, ...STUCCO, '#ff8a5a', '#39b8b0', '#f2c230'], blade: 0.2 });
    for (const [a, c] of lots) {
      if (chance(0.35)) K.mural(b, X0 + 0.02, rand(5.8, 7.2), -(a + c) / 2, 1, c - a - 1, 2.6);
      if (chance(0.4)) K.surfRack(b, 10.6, -(a + c) / 2, 1);
    }
    for (let z = z0 + rand(2, 6); z < z1 - 3; z += rand(9, 14)) if (chance(0.6)) K.cart(b, 9.6, -z, 1, pick(['SUNGLASSES', 'HENNA', 'T-SHIRTS', 'LEMONADE', 'CHURROS']));
    backLand(b, 1);
  };

  // ---------- the bluffs and the coast road ----------
  // the Palisades' sandstone from Sc + a to Sc + c (distances into the chunk): its face in soft steps of rock, scrub and
  // ice plant on the ledges, its top running back to the park and Ocean Avenue
  const PROF = [[0, -1.2], [1.2, 0.08], [3, 0.26], [4.4, 0.4], [5.6, 0.58], [7, 0.74], [8.4, 0.88], [9.6, 0.97], [10.4, 1.0], [130, 1.0]];
  const bluff = (b, Sc, a = 0, c = CHUNK_LEN, { park = true, houses = false } = {}) => {
    const R = Math.max(1, Math.round((c - a) / 4));
    b.addM(gridGeo(R, PROF.length - 1, (r, k) => {
      const z = -(a + ((c - a) * r) / R), [x0, h] = bluffAt(Sc - z), [px, py] = PROF[k], y = py < 0 ? py : py * h;
      const v = k % 2 ? 0.92 : 1.06, tint = new THREE.Color(k === PROF.length - 1 || k === PROF.length - 2 ? '#8a8a5a' : '#ffffff').multiplyScalar(v);
      return [x0 + px + (k > 0 && k < 8 ? Math.sin(z * 0.21 + k) * 0.5 : 0), y, z, (px + y) / 7, -z / 7, tint];
    }, true), bluffMat, new THREE.Matrix4(), null);
    for (let z = a + rand(1, 4); z < c - 1; z += rand(3, 6)) {   // ice plant and scrub on the face
      const [x0, h] = bluffAt(Sc + z), t = rand(0.1, 0.85), k = PROF.findIndex(([, py]) => py >= t), [px] = PROF[Math.max(1, k)];
      b.add(G.sphLow, VC.solid, x0 + px + 0.3, t * h, -z, rand(1.2, 3), rand(0.5, 1.4), rand(1.2, 3), 0, rand(0, 3), 0, pick(['#5a7a3a', '#6a8a42', '#7a6a3a', '#8a5a6a', '#6a7a3a']));
    }
    if (houses) for (let z = a + rand(2, 6); z < c - 10; z += rand(12, 16)) {
      const [x0, h] = bluffAt(Sc + z + 5); if (h < 6) continue;
      const H = rand(5, 9); b.addM(K.tiledBox(12, H, 10, 2.5), K.stuccoMat, T(x0 + 18, h + H / 2, -z - 5), pick([...PASTEL, ...STUCCO]));
      b.box(VC.glow, K.glass(0.6, false), x0 + 11.97, h + H * 0.55, -z - 5, 0.04, H * 0.5, 7);
      b.add(G.box, K.tileMat, x0 + 18, h + H + 0.6, -z - 5, 12.6, 0.1, 10.6, 0, 0, 0, '#ffffff');
    }
    if (!park) return;
    for (let z = a; z < c; z += 20) {   // Palisades Park on top: the lawn, the palms along the edge, the rail, the people at it, Ocean Avenue's hotels
      const [x0, h] = bluffAt(Sc + z + 10); if (h < 10) continue;
      K.lawn(b, x0 + 26, -z - 10, 30, 20.2, '#4a6a34', h + 0.03);
      K.pave(b, x0 + 14.2, -z - 10, 3.2, 20.2, h + 0.04);
      for (let zz = z + rand(1, 5); zz < z + 19; zz += rand(9, 13)) (chance(0.7) ? K.fanPalm : K.palm)(b, x0 + 11.6, -zz, rand(1.0, 1.25), { y: h });
      b.box(VC.metal, '#3a3a3e', x0 + 10.7, h + 0.95, -z - 10, 0.05, 0.05, 20); b.box(VC.metal, '#3a3a3e', x0 + 10.7, h + 0.5, -z - 10, 0.04, 0.04, 20);
      for (let zz = z; zz < z + 20; zz += 2.5) b.box(VC.metal, '#3a3a3e', x0 + 10.7, h + 0.48, -zz, 0.05, 0.96, 0.05);
      K.crowd(b, x0 + 11.4, x0 + 16, z + 1, z + 19, randi(1, 4), { y: h, ry: -Math.PI / 2 + rand(-0.4, 0.4), camera: chance(0.3) });
      if (chance(0.4)) K.bench(b, x0 + 13.4, -z - rand(4, 16), -1, { y: h });
      if (chance(0.35)) K.lamp(b, x0 + 15.5, -z - rand(4, 16), -1, { kind: 'twin', h: 4.4, y: h });
    }
    for (let z = a + rand(0, 6); z < c - 10;) {   // Ocean Avenue's hotels and flats behind the park, their windows lit
      const L = rand(14, 24), [x0, h] = bluffAt(Sc + z + L / 2); if (h < 10) { z += L; continue; }
      const H = rand(14, 40), col = pick([...STUCCO, '#e8e0f0', '#f4e0d0']), xf = x0 + 44;
      b.addM(K.tiledBox(14, H, L, 2.5), K.stuccoMat, T(xf, h + H / 2, -(z + L / 2)), col);
      for (let y = h + 2; y < h + H - 1.5; y += 3.2) for (let zz = z + 1.5; zz < z + L - 1.2; zz += 2.4) b.box(VC.glow, K.glass(0.5, false), xf - 7.02, y, -zz, 0.04, 1.4, 1.4);
      b.box(VC.solid, col, xf, h + H + 0.4, -(z + L / 2), 14.4, 0.8, L + 0.4);
      if (chance(0.5)) { b.cyl(VC.metal, '#8a9098', xf + 2, h + H + 1.4, -(z + L / 2), 1.0, 2.0, 'cyl8'); b.box(VC.glow, hdr('#ff3a2a', 2), xf, h + H + 3, -(z + L / 2), 0.2, 0.2, 0.2); }
      z += L + rand(2, 6);
    }
  };
  // the coast road at the bluffs' foot (from the walk to the bluff): two lanes each way and the median, the traffic lit
  const pch = (b, Sc) => {
    const [x1] = bluffAt(Sc + 40), xr = x1 - 1.4, xm = (10.75 + xr) / 2;
    K.road(b, xm, -CHUNK_LEN / 2, xr - 10.75, CHUNK_LEN, 0.03);
    for (const x of [10.75 + (xr - 10.75) * 0.25, 10.75 + (xr - 10.75) * 0.75]) for (let z = 2; z < CHUNK_LEN; z += 6) b.box(VC.solid, '#e8e4dc', x, 0.04, -z, 0.12, 0.01, 3);
    b.box(VC.solid, '#c8c0b4', xm, 0.12, -CHUNK_LEN / 2, 0.6, 0.24, CHUNK_LEN); b.box(VC.solid, '#5a6a3a', xm, 0.25, -CHUNK_LEN / 2, 0.4, 0.04, CHUNK_LEN);   // the median
    for (const x of [10.9, xr]) b.box(VC.solid, '#c8c0b4', x, 0.1, -CHUNK_LEN / 2, 0.3, 0.2, CHUNK_LEN);
    for (const [x, dir] of [[10.75 + (xr - 10.75) * 0.12, 1], [10.75 + (xr - 10.75) * 0.38, 1], [10.75 + (xr - 10.75) * 0.62, -1], [10.75 + (xr - 10.75) * 0.88, -1]]) for (let z = rand(2, 9); z < CHUNK_LEN - 3; z += rand(8, 14)) K.car(b, x, -z, dir, { lit: true });
    for (let z = rand(6, 14); z < CHUNK_LEN - 2; z += rand(26, 32)) K.lamp(b, xm, -z, 1, { kind: 'cobra', pool: 0.06 });
  };

  // ---------- the chunks ----------
  // the Venice canals: a canal either side of the walk, the bridges arching over them to the houses on the far banks,
  // their gardens down to the water, boats at the docks, the palms; all of it in the still water. The sea beyond.
  const canals = () => {
    const b = new Batcher(), r = new Batcher(), yw = -1.15;
    for (const s of [-1, 1]) {
      b.box(VC.solid, '#c8bcae', s * 11.1, -0.6, -CHUNK_LEN / 2, 0.7, 1.3, CHUNK_LEN);   // the canal's edge
      b.box(VC.solid, '#c8bcae', s * 21.2, -0.6, -CHUNK_LEN / 2, 0.6, 1.3, CHUNK_LEN);
      b.add(G.plane, canalMat, s * 16.15, yw, -CHUNK_LEN / 2, 9.4, CHUNK_LEN, 1, -Math.PI / 2, 0, 0);
      b.box(VC.solid, '#0a0e18', s * 16.15, yw - 14, -CHUNK_LEN / 2, 10.4, 0.4, CHUNK_LEN);   // the dark bed far below
      b.box(VC.solid, '#7a8a5a', s * 56, -0.2, -CHUNK_LEN / 2, 69.6, 0.2, CHUNK_LEN);   // the far bank's ground
      K.pave(r, s * 22.6, -CHUNK_LEN / 2, 2.2, CHUNK_LEN, 0.03);   // the far bank's path
      for (let z = rand(0, 3); z < CHUNK_LEN - 8;) {   // the houses: bungalows, a few boxes of glass and white stucco
        const w = rand(9, 12), zc = -(z + w / 2);
        if (chance(0.35)) {
          const col = pick(['#f4f2ec', '#e8e4dc', ...PASTEL]), H = rand(6, 9);
          r.addM(K.tiledBox(10, H, w - 1, 2.5), K.stuccoMat, T(s * 29.5, H / 2, zc), col);
          r.box(VC.glow, K.glass(0.6, s > 0), s * 24.47, H * 0.55, zc, 0.04, H * 0.6, w - 2.4);
          for (let k = 0; k <= 4; k++) r.box(VC.solid, '#e8e8ea', s * 24.44, H * 0.55, zc - (w - 2.4) / 2 + (k * (w - 2.4)) / 4, 0.05, H * 0.6, 0.08);
          r.box(VC.solid, '#3a3a3e', s * 29.5, H + 0.15, zc, 10.4, 0.3, w - 0.6);
          r.box(VC.metal, '#5a5e64', s * 24.0, H * 0.25 + 0.6, zc, 0.9, 0.06, w - 2); r.box(VC.metal, '#5a5e64', s * 23.6, H * 0.25 + 1.6, zc, 0.04, 0.04, w - 2);   // a balcony over the garden
        } else K.bungalow(r, s, 25, zc, { w });
        K.lawn(r, s * 23.95, zc, 0.6, w - 0.4, '#5a8a3e', 0.035);
        if (chance(0.5)) { r.box(VC.solid, '#8a6a4a', s * 20.4, yw + 0.3, zc, 1.6, 0.15, 3.2); r.add(G.sphLow, VC.solid, s * 19.4, yw + 0.15, zc + 1, 0.9, 0.35, 3.2, 0, rand(-0.3, 0.3), 0, pick(['#c8302a', '#2a6ad8', '#f4f0e8', '#ffd23d'])); }   // a dock, a canoe
        for (let k = 0; k < 2; k++) (chance(0.5) ? K.strelitzia : K.agave)(r, s * rand(22.6, 23.6), zc + rand(-w / 2 + 1, w / 2 - 1), 0.9);
        z += w + rand(0.3, 1.2);
      }
      for (const zb of [rand(14, 26), rand(52, 64)]) {   // the white footbridges arching over the canal
        const N = 8, F = frame(r, 0, 0, 0, 1, 0);
        for (let k = 0; k < N; k++) {   // its deck in a shallow arch, the white rails either side, their balusters
          const t0 = k / N, t1 = (k + 1) / N, x0 = s * (11.4 + t0 * 9.4), x1 = s * (11.4 + t1 * 9.4), y0 = Math.sin(t0 * Math.PI) * 1.6 + 0.1, y1 = Math.sin(t1 * Math.PI) * 1.6 + 0.1;
          F.beam(VC.solid, '#f4f2ec', [x0, y0, -zb], [x1, y1, -zb], 0.22, 1.9);
          for (const e of [-1, 1]) { F.beam(VC.solid, '#f4f2ec', [x0, y0 + 0.9, -zb + e * 0.95], [x1, y1 + 0.9, -zb + e * 0.95], 0.08, 0.08); F.box(VC.solid, '#f4f2ec', x0, y0 + 0.45, -zb + e * 0.95, 0.05, 0.9, 0.05); }
        }
        for (const e of [-1, 1]) for (const x of [11.4, 20.8]) r.cyl(VC.solid, '#f4f2ec', s * x, 0.6, -zb + e * 0.95, 0.07, 1.2, 'cyl6');
      }
      for (let z = rand(4, 10); z < CHUNK_LEN - 2; z += rand(16, 22)) (chance(0.6) ? K.fanPalm : K.palm)(r, s * 22.8, -z, rand(0.95, 1.15));
      for (let k = randi(2, 4); k > 0; k--) r.add(G.sphLow, VC.solid, s * rand(13, 19), yw + 0.1, -rand(5, 75), 0.3, 0.22, 0.45, 0, rand(0, 6), 0, pick(['#f4f2ec', '#5a4a3a', '#3a6a3a']));   // ducks
      for (let z = rand(6, 12); z < CHUNK_LEN - 2; z += rand(18, 24)) { b.cyl(VC.metal, '#2a2a2e', s * 10.4, 1.4, -z, 0.05, 2.8, 'cyl6'); b.box(VC.glow, hdr('#ffe0a8', 2.2), s * 10.4, 3.0, -z, 0.3, 0.4, 0.3); b.box(VC.metal, '#2a2a2e', s * 10.4, 3.25, -z, 0.4, 0.06, 0.4); }   // the walk's lanterns
      K.throng(b, s * 4.6, s * 10.2, 2, CHUNK_LEN - 2, randi(4, 7), [], { shorts: true });
      if (chance(0.5)) K.dog(b, s * rand(6, 9), -rand(6, 74));
    }
    mergeInto(b, r);
    mirrorInto(b, r, yw, 0.5);
    for (const s of [-1, 1]) for (const z of [-0.2, -79.8]) b.box(VC.solid, '#1a1a1e', s * 16.15, yw - 7, z, 10, 13.6, 0.4);   // the water's ends, so nothing below shows
    coastSea(b);
    return b;
  };
  // Venice Beach: Windward Avenue's arcades, the VENICE sign hung over the street; the car park behind the arcades on the
  // left, its seawall, then the beach opening out
  const venice = () => {
    const b = new Batcher(), Sc = 80, OPEN = 48;
    for (const s of [-1, 1]) {
      const end = s < 0 ? OPEN : 80;
      K.kerbLane(b, s, { z1: s < 0 ? OPEN + 2 : CHUNK_LEN, x1: X0 });
      for (let z = 0; z < end - 0.5;) {   // the old Venice of America blocks: a colonnade of round arches along the front, the shops behind
        let w = rand(12, 18); if (end - z - w < 9) w = end - z;
        const zc = -(z + w / 2), H = rand(9, 13), col = pick(['#f2e2c8', '#e8d0b0', '#f4e8d8', '#e8c8b8', '#d8c0a0']), trim = '#f4ecdc';
        b.addM(K.tiledBox(14, H + 1, w, 2.5), K.stuccoMat, T(s * (X0 + 7), (H - 1) / 2, zc), col);
        const n = Math.round(w / 3), bay = (w - 0.8) / n;
        for (let k = 0; k <= n; k++) {   // the columns: base, shaft, capital
          const zz = -(z + 0.4 + k * bay);
          b.box(VC.solid, trim, s * 9.0, 0.15, zz, 0.6, 0.3, 0.6);
          b.cyl(VC.solid, trim, s * 9.0, 1.95, zz, 0.2, 3.4, 'cyl8');
          b.add(G.cone8, VC.solid, s * 9.0, 3.72, zz, 0.62, 0.3, 0.62, Math.PI, 0, 0, trim);
          b.box(VC.solid, trim, s * 9.0, 3.95, zz, 0.64, 0.22, 0.64);
          if (k < n) b.addM(ARCH, VC.solid, new THREE.Matrix4().compose(new THREE.Vector3(s * 9.0, 4.06, zz - bay / 2), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), new THREE.Vector3(bay, bay, 4)), trim);
        }
        b.box(VC.solid, col, s * 9.0, 4.45 + bay / 2, zc, 0.6, 0.7, w);   // the frieze over the arches, its dentils, the cornice
        for (let zz = z + 0.3; zz < z + w - 0.2; zz += 0.5) b.box(VC.solid, trim, s * (9.0 - 0.32), 4.15 + bay / 2, -zz, 0.08, 0.12, 0.22);
        b.box(VC.solid, trim, s * 9.1, 4.86 + bay / 2, zc, 0.85, 0.14, w);
        b.box(VC.solid, '#e8dcc8', s * 10.2, 4.15 + bay / 2, zc, 2.4, 0.2, w);   // the arcade's ceiling, its lamps
        for (let zz = z + bay / 2 + 0.4; zz < z + w; zz += bay * 2) b.sph(VC.glow, hdr('#ffe0b0', 2.0), s * 10.2, 3.8 + bay / 2, -zz, 0.16, true);
        const sign = pick(BEACH_SIGNS);
        K.board(b, K.goodsRects[GI[sign.goods]], s * (X0 - 0.03), 1.8, zc, Math.min(w - 2, 8), 2.4, 1, 0, face(s), 0);
        for (let k = 0; k <= 4; k++) b.box(VC.solid, '#3a2a24', s * (X0 - 0.05), 1.8, zc - Math.min(w - 2, 8) / 2 + (k * Math.min(w - 2, 8)) / 4, 0.05, 2.5, 0.08);   // the shop window's mullions
        K.board(b, K.signRects[sign.i], s * (X0 - 0.05), 3.4, zc, 4.4, 0.9, 1, 0, face(s), 0);
        for (let y = 6.4; y < H - 1; y += 3.2) for (let zz = z + 1.4; zz < z + w - 1; zz += 2.6) {   // the upper windows: frame, glass, sill
          b.box(VC.solid, trim, s * (X0 - 0.02), y, -zz, 0.05, 1.7, 1.45); b.box(VC.glow, K.glass(0.45, s > 0), s * (X0 - 0.05), y, -zz, 0.04, 1.5, 1.25);
          b.box(VC.solid, trim, s * (X0 - 0.1), y - 0.88, -zz, 0.2, 0.08, 1.6);
        }
        b.box(VC.solid, trim, s * (X0 - 0.05), H - 0.2, zc, 0.3, 0.4, w + 0.1);   // the parapet's coping
        if (chance(0.5)) K.mural(b, s * (X0 + 0.0), (6.2 + H) / 2, zc, s, w - 1, H - 6.6);
        z += w + 0.2;
      }
      for (let z = rand(6, 12); z < end - 4; z += rand(16, 20)) K.fanPalm(b, s * 7.6, -z, rand(1.0, 1.15));
    }
    // the VENICE sign: its letters lit on a frame hung from wires over the street, well clear of the track
    for (const e of [-1, 1]) { b.cyl(VC.metal, '#3a3a3e', e * 8.6, 7.6, -26, 0.12, 15.2, 'cyl8'); b.cyl(VC.metal, '#3a3a3e', e * 8.6, 0.3, -26, 0.3, 0.6, 'cyl8'); beam(b, VC.metal, e * 8.6, 15.0, -26, e * 4.6, 13.6, -26, 0.03, '#1a1a1e'); }
    b.box(VC.solid, '#1a1a20', 0, 12.6, -26, 9.4, 1.8, 0.25);
    for (let k = 0; k < 24; k++) for (const y of [11.65, 13.55]) b.sph(VC.glow, hdr('#ffd890', 2.6), -4.6 + k * 0.4, y, -25.84, 0.06, true);
    K.sign(b, 'VENICE', { w: 1024, h: 192, color: '#fff4e0', font: BLADE, size: 0.8, glow: '#ffd890', k: 2.4 }, 0, 12.6, -25.85, 9.2, 1.75, 1);
    K.sign(b, 'VENICE', { w: 1024, h: 192, color: '#fff4e0', font: BLADE, size: 0.8, glow: '#ffd890', k: 2.4 }, 0, 12.6, -26.15, 9.2, 1.75, 1, 0, Math.PI, 0);
    // the left behind the arcades: the beach car park out to the riprap, the sea past it, the seawall where the beach opens
    b.box(VC.solid, '#7a7468', -58.5, -0.2, -OPEN / 2, 66, 0.2, OPEN);
    K.road(b, -50, -OPEN / 2 + 1, 46, OPEN - 4, -0.08);
    for (let z = 3; z < OPEN - 3; z += 2.8) for (const x of [-34, -46, -58, -70]) { b.box(VC.solid, '#e8e4dc', x, -0.07, -z, 5.2, 0.01, 0.1); if (chance(0.5)) K.place(b, (t) => K.car(t, 0, 0, 1), new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(x, -0.09, -z - 1.4)); }
    for (const x of [-40, -64]) for (const z of [12, 34]) K.lamp(b, x, -z, 1, { kind: 'twin', h: 5.2 });
    coastSea(b, 0, -OPEN - 0.5);
    b.box(VC.solid, '#a8a094', -58, -0.7, -OPEN - 0.3, 66, 1.4, 0.7); b.box(VC.solid, '#c8c0b4', -58, 0.05, -OPEN - 0.3, 66, 0.1, 0.9);   // the seawall
    groin(b, -OPEN - 1.6, Sc, -110);
    // the beach: the sand and the sea on the left, the boardwalk's shops go on on the right
    beach(b, Sc, -OPEN - 0.5, -CHUNK_LEN);
    bikePath(b, Sc, -OPEN - 3, -CHUNK_LEN);
    seaEdge(b, OPEN + 4, CHUNK_LEN);
    sandLife(b, Sc, OPEN + 4, CHUNK_LEN, { towers: 1, towels: 3, surf: 2, ride: 1 });
    K.throng(b, -4.6, -10.2, 2, 78, 10, [], { shorts: true }); K.throng(b, 4.6, 10.2, 2, 78, 12, [], { shorts: true });
    for (let k = 0; k < 4; k++) K.skater(b, pick([-1, 1]) * rand(5, 9.5), -rand(4, 76));
    for (let k = 0; k < 2; k++) K.person(b, pick([-1, 1]) * rand(5, 9), -rand(6, 74), { costume: 'robot', ry: Math.PI / 2 });   // a silver robot mime or two
    backLand(b, 1);
    return b;
  };
  const boardwalk = () => {   // Ocean Front Walk: the shops and murals on the right, the palms, vendors and the sand on the left
    const b = new Batcher(), Sc = 160;
    K.kerbLane(b, 1, { x1: X0 });
    shops(b, 0, CHUNK_LEN);
    beach(b, Sc); bikePath(b, Sc); seaEdge(b); sandLife(b, Sc, 0, CHUNK_LEN, { towers: 1, towels: 7, surf: 3, nets: chance(0.5) ? 1 : 0 });
    walkLife(b, 12);
    const dz = rand(20, 60);   // a drum circle on the walk's sea edge
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; K.person(b, -8.6 + Math.cos(a) * 1.6, -dz + Math.sin(a) * 1.6, { seated: true, ry: -a - Math.PI / 2, shorts: true }); b.cyl(VC.solid, pick(['#8a5a2a', '#c8a050', '#5a3a1a']), -8.6 + Math.cos(a) * 1.15, 0.35, -dz + Math.sin(a) * 1.15, 0.2, 0.7, 'cyl8'); }
    return b;
  };
  // Muscle Beach: the pen of weights and the bodybuilders, the basketball court, the skate park's bowls, the art walls
  const muscle = () => {
    const b = new Batcher(), Sc = 240;
    K.kerbLane(b, 1, { x1: X0 });
    shops(b, 0, CHUNK_LEN);
    beach(b, Sc, 0, -CHUNK_LEN, { wall: false });
    b.block(VC.solid, '#3a3638', -19.5, -0.7, -18, 15.4, 0.76, 26.4);   // the gym's floor on its pad, its fence, the sign over the gate
    for (const [x0, z0, x1, z1] of [[-12, -5, -27, -5], [-27, -5, -27, -31], [-27, -31, -12, -31], [-12, -31, -12, -23]]) {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 2.5);
      for (const y of [0.3, 2.3]) b.box(VC.metal, '#5a5e64', (x0 + x1) / 2, y, (z0 + z1) / 2, Math.abs(x1 - x0) + 0.06, 0.06, Math.abs(z1 - z0) + 0.06);
      for (let k = 0; k <= n; k++) b.box(VC.metal, '#5a5e64', x0 + ((x1 - x0) * k) / n, 1.2, z0 + ((z1 - z0) * k) / n, 0.07, 2.4, 0.07);
    }
    for (const e of [-1, 1]) b.cyl(VC.metal, '#3a3a3e', -12, 2.2, -11 + e * 3, 0.1, 4.4, 'cyl8');
    b.box(VC.solid, '#1a1a20', -12, 4.6, -11, 0.2, 1.2, 7);
    K.sign(b, 'MUSCLE BEACH', { w: 1024, h: 160, color: '#ffd23d', bg: '#1a1a20', font: BLADE, size: 0.62, k: 1.4 }, -11.88, 4.6, -11, 6.8, 1.06, 1, 0, Math.PI / 2, 0);
    for (let k = 0; k < 6; k++) {   // benches, racks, the lifters
      const x = rand(-15, -24), z = -rand(8, 28);
      b.box(VC.solid, '#2a2a30', x, 0.45, z, 0.5, 0.15, 1.6); for (const e of [-0.6, 0.6]) b.box(VC.metal, '#3a3a3e', x, 0.22, z + e, 0.4, 0.4, 0.08);
      for (const e of [-1, 1]) b.box(VC.metal, '#3a3a3e', x + e * 0.62, 0.68, z, 0.08, 1.3, 0.08);
      b.cyl(VC.metal, '#b8bcc4', x, 1.3, z, 0.04, 2.2, 'cyl6', 0, Math.PI / 2);
      for (const e of [-1, 1]) for (const f of [0.8, 0.95]) b.cyl(VC.solid, '#1a1a1e', x + e * f, 1.3, z, f < 0.9 ? 0.32 : 0.24, 0.1, 'cyl8', 0, Math.PI / 2);
      K.person(b, x + rand(-1, 1), z + rand(1, 2), { buff: true, beach: true, ry: rand(0, 6), shades: chance(0.5) });
    }
    const cz = -45;   // the court: its pad, lines, the hoops on their posts, a game on
    b.block(VC.solid, '#2a6a8a', -19.5, -0.8, cz, 13, 0.85, 15);
    for (const [w, d] of [[12, 0.08], [0.08, 14]]) b.box(VC.solid, '#f4f0e8', -19.5, 0.06, cz, w, 0.01, d);
    b.add(G.tor, VC.solid, -19.5, 0.06, cz, 3.2, 3.2, 1, Math.PI / 2, 0, 0, '#f4f0e8');
    for (const e of [-1, 1]) { b.cyl(VC.metal, '#5a5e64', -19.5, 1.6, cz + e * 7.8, 0.08, 3.2, 'cyl8'); b.box(VC.metal, '#5a5e64', -19.5, 3.2, cz + e * 7.55, 0.1, 0.1, 0.5); b.box(VC.solid, '#f4f0e8', -19.5, 3.3, cz + e * 7.3, 1.8, 1.1, 0.06); b.box(VC.solid, '#e8302a', -19.5, 3.18, cz + e * 7.26, 0.6, 0.45, 0.02); b.add(G.tor, VC.solid, -19.5, 3.0, cz + e * 6.9, 0.9, 0.9, 0.9, Math.PI / 2, 0, 0, '#ff6a1a'); }
    for (let k = randi(4, 7); k > 0; k--) K.person(b, -19.5 + rand(-5, 5), cz + rand(-6, 6), { shorts: true, ry: rand(0, 6), shades: false, reach: chance(0.4) });
    b.sph(VC.solid, '#e8702a', -19.5 + rand(-3, 3), rand(1.5, 3), cz + rand(-4, 4), 0.12, true);
    for (const [x, z, r] of [[-17, -62, 3.6], [-24.5, -70, 3.2], [-16.5, -74, 2.6]]) {   // the skate park's bowls, their coping, a skater up over each
      const y = sandY(x, Sc - z);
      b.add(G.cyl, VC.solid, x, y - 0.1, z, r * 2, 0.32, r * 2, 0, 0, 0, '#5a5658');
      b.add(G.cyl, VC.solid, x, y + 0.02, z, r * 1.7, 0.1, r * 1.7, 0, 0, 0, '#3a3638');
      b.add(G.tor, VC.metal, x, y + 0.12, z, r * 2.05, r * 2.05, 3, Math.PI / 2, 0, 0, '#c8c4bc');
      K.skater(b, x + rand(-1, 1), z + rand(-1, 1), rand(0, 6));
      K.person(b, x - r + 0.8, z, { skate: true, y: y + rand(1.4, 2.6), ry: rand(0, 6), reach: true });
    }
    for (let k = 0; k < 3; k++) { const z = -rand(36, 66), x = -27.5, y = sandY(x, Sc - z); b.box(VC.solid, '#c8c4bc', x, y + 1.6, z, 0.35, 3.2, 6); K.mural(b, x + 0.2, y + 1.7, z, -1, 5.8, 3.0, randi(0, 5)); }   // the art walls, painted over and over
    for (let z = rand(3, 8); z < CHUNK_LEN - 2; z += rand(15, 19)) K.fanPalm(b, -12.1, -z, rand(1.0, 1.2), { y: -0.04 });
    sandLife(b, Sc, 0, CHUNK_LEN, { towers: 1, towels: 3, surf: 3, ride: 1, gulls: 2 });
    walkLife(b, 10);
    return b;
  };
  // the open sand: the towers, the nets, the fire rings, the surfers going out; the beach car park and the bluffs rising on the right
  const strand = () => {
    const b = new Batcher(), Sc = 320;
    beach(b, Sc); bikePath(b, Sc); seaEdge(b, 40, CHUNK_LEN);
    sandLife(b, Sc, 0, CHUNK_LEN, { towers: 2, nets: 2, fires: 2, towels: 9, surf: 5, ride: 2 });
    K.road(b, 19.6, -CHUNK_LEN / 2, 17.7, CHUNK_LEN, 0.03);   // the beach car park
    for (let z = 2; z < CHUNK_LEN - 2; z += 2.8) { b.box(VC.solid, '#e8e4dc', 24, 0.04, -z, 5.2, 0.01, 0.1); if (chance(0.55)) K.place(b, (t) => K.car(t, 0, 0, 1), new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(24, 0, -z - 1.4)); }
    b.box(VC.solid, '#c8c0b4', 28.6, 0.1, -CHUNK_LEN / 2, 0.3, 0.2, CHUNK_LEN);
    for (let z = rand(3, 8); z < CHUNK_LEN - 2; z += rand(13, 17)) K.fanPalm(b, 12.2, -z, rand(1.0, 1.2));
    b.box(VC.solid, '#7a8a5a', 30.4, -0.15, -CHUNK_LEN / 2, 3.4, 0.2, CHUNK_LEN);   // the scrub at the bluffs' foot
    for (let z = rand(1, 4); z < CHUNK_LEN; z += rand(3, 6)) b.add(G.sphLow, VC.solid, rand(29, 31), 0.1, -z, rand(1.5, 3), rand(0.6, 1.2), rand(1.5, 3), 0, rand(0, 3), 0, pick(['#5a6a3a', '#6a7a42', '#7a6a4a']));
    bluff(b, Sc, 0, CHUNK_LEN, { park: false, houses: true });
    walkLife(b, 9);
    return b;
  };
  // the pier: the deck high over the walk on its bents of pilings, Pacific Park on it, the old carousel's hall at the land
  // end, the arch with the famous sign at the top of the bridge from the bluff; the coast road, the bluffs and the park on the right
  const ledMats = [0, 1, 2].map(() => basic({ color: hdr('#ffffff', 3) }));
  const RIM = new THREE.TorusGeometry(13, 0.2, 6, 64);
  const pier = () => {
    const b = new Batcher(), Sc = 400, D0 = -34, D1 = -52, DY = 12, ZC = (D0 + D1) / 2, X1 = 44, X2 = -262, SP = Sc - ZC;
    beach(b, Sc); bikePath(b, Sc);
    sandLife(b, Sc, 0, 28, { towers: 1, towels: 4, surf: 2, ride: 1, gulls: 2 }); sandLife(b, Sc, 58, CHUNK_LEN, { towers: 0, towels: 3, surf: 2, ride: 0, gulls: 2 });
    // the deck, its white fascia either side, the stringers under it
    b.addM(K.tiledBox(X1 - X2, 0.5, D0 - D1, 3), plankMat, T((X1 + X2) / 2, DY - 0.25, ZC), '#ffffff');
    for (const z of [D0, D1]) b.box(VC.solid, '#e8e2d6', (X1 + X2) / 2, DY - 0.45, z, X1 - X2, 0.8, 0.16);
    for (const z of [D0 - 4.5, ZC, D1 + 4.5]) b.box(VC.solid, '#4a3c30', (X1 + X2) / 2, DY - 0.7, z, X1 - X2, 0.5, 0.35);
    // the bents: four pilings, the cap over them, crossed braces between each pair (heavier concrete piers over the road)
    for (const x of [10.2, 30]) for (const z of [D0 - 2, D1 + 2]) { b.block(VC.solid, '#b8b0a4', x, 0, z, 1.0, DY - 0.9, 1.4); b.box(VC.solid, '#a8a094', x, DY - 1.2, ZC, 1.2, 0.8, D0 - D1 - 1); }
    for (let x = X1 - 6; x > X2; x -= 6) {
      if (Math.abs(x) < 5 || (x > 8 && x < 32)) continue;
      const y0 = x > 32 ? 0 : x > WALL ? -0.3 : x > shoreX(SP) + 0.5 ? sandY(x, SP) - 0.3 : SEA - 3, wet = x < shoreX(SP) + 3;
      const zs = [D0 - 0.6, D0 - 6.2, D1 + 6.2, D1 + 0.6];
      const seg = x > -70 ? 'cyl8' : 'cyl6';
      for (const z of zs) { b.cyl(VC.solid, '#5a4a3c', x, (y0 + DY - 0.9) / 2, z, 0.3, DY - 0.9 - y0, seg); if (wet) b.cyl(VC.solid, '#2e3a32', x, SEA + 0.2, z, 0.33, 1.2, seg); }   // (the barnacled band at the water)
      b.box(VC.solid, '#4a3c30', x, DY - 1.05, ZC, 0.45, 0.6, D0 - D1 + 0.4);
      if (x < 6) for (const [za, zb] of [[zs[0], zs[1]], [zs[2], zs[3]]]) { beam(b, VC.solid, x, y0 + 1, za, x, DY - 1.4, zb, 0.13, '#4a3c30'); beam(b, VC.solid, x, y0 + 1, zb, x, DY - 1.4, za, 0.13, '#4a3c30'); }
    }
    // the rails, their posts, the lamps along the near side, the benches, the people, the anglers at the rail
    for (const z of [D0 - 0.1, D1 + 0.1]) {
      for (const y of [DY + 0.55, DY + 1.0]) b.box(VC.solid, '#ece8e0', (X1 + X2) / 2, y, z, X1 - X2, 0.07, 0.07);
      for (let x = X1 - 1; x > X2; x -= x > -80 ? 2.4 : 3.6) b.box(VC.solid, '#ece8e0', x, DY + 0.5, z, 0.08, 1.0, 0.08);
    }
    for (let x = X1 - 8; x > X2 + 6; x -= 14) for (const z of [D0 - 0.35, D1 + 0.35]) {
      b.cyl(VC.metal, '#2a2a2e', x, DY + 2.2, z, 0.06, 4.4, 'cyl8'); b.box(VC.metal, '#2a2a2e', x, DY + 4.2, z, 0.06, 0.06, 0.9);
      for (const e of [-0.42, 0.42]) b.sph(VC.glow, hdr('#ffe8c0', 2.4), x, DY + 4.48, z + e, 0.2, true);
    }
    for (let x = -20; x > X2 + 10; x -= rand(16, 24)) K.bench(b, x, D1 + 1.2, -1, { y: DY, along: true });
    K.crowd(b, -150, 26, 36, 45.5, 26, { y: DY, camera: chance(0.5) });
    for (let k = 0; k < 10; k++) { const x = rand(X2 + 4, -160), z = chance(0.5) ? D0 - 0.8 : D1 + 0.8; K.person(b, x, z, { y: DY, ry: z > ZC ? Math.PI : 0 }); beam(b, VC.solid, x, DY + 1.2, z, x - rand(-1, 1), DY + 3.4, z + (z > ZC ? 2.2 : -2.2), 0.02, '#1a1a1e'); }
    // game booths down the middle under their striped awnings, the arcade's hall at the land end of the park
    for (let x = -20; x > -66; x -= 7.5) {
      const c = pick(['#e8302a', '#2a6ad8', '#ffd23d', '#3ab4a0', '#ff7ab8']), z = D1 + 3.5;
      b.block(VC.solid, '#f4f0e8', x, DY, z, 5.6, 2.6, 3.2); b.box(VC.glow, hdr('#ffe8c8', 1.0), x, DY + 1.5, z + 1.62, 4.6, 1.2, 0.04);
      for (let k = 0; k < 6; k++) b.add(G.box, VC.solid, x - 2.35 + k * 0.94, DY + 2.85, z + 2.3, 0.94, 0.06, 1.6, -0.35, 0, 0, k % 2 ? '#f4f0e8' : c);
      for (let k = 0; k < 6; k++) b.sph(VC.solid, pick(['#ff5aa0', '#ffd23d', '#39c8e8', '#7cd84a', '#b46bff']), x - 2 + k * 0.8, DY + 2.2, z + 1.78, 0.22, true);   // the prizes hung up
      K.person(b, x + rand(-1, 1), z + 2.6, { y: DY, ry: 0 });
    }
    b.addM(K.tiledBox(16, 7, 12, 2.5), K.stuccoMat, T(-4, DY + 3.5, D1 + 7), '#f2e6d8');
    b.box(VC.glow, hdr('#ffe0c0', 1.0), -4, DY + 2.2, D1 + 13.05, 13, 3.4, 0.04);
    K.sign(b, 'ARCADE', { w: 512, h: 128, color: '#39e8ff', font: BLADE, size: 0.7, glow: '#39e8ff', k: 2.2 }, -4, DY + 5.6, D1 + 13.08, 7, 1.6, 1);
    for (let k = 0; k < 18; k++) b.sph(VC.glow, hdr(pick(['#ff5aa0', '#ffd23d', '#39e8ff']), 2.6), -11.6 + k * 0.9, DY + 6.9, D1 + 13.1, 0.09, true);
    // the Ferris wheel on the deck's near edge: its two rims, the spokes, the gondolas, the LEDs running patterns; the A-frame
    const W = frame(b, -36, DY + 15, D0 - 3.5, 1, 0), R = 13;
    for (const e of [-0.65, 0.65]) W.addM(RIM, VC.metal, T(0, 0, e), '#e8e8ec');
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      for (const e of [-0.65, 0.65]) W.beam(VC.metal, '#d8dce0', [0, 0, e * 0.6], [c * R, s * R, e], 0.09, 0.09);
      W.beam(VC.metal, '#c8ccd0', [c * R, s * R, -0.65], [c * R, s * R, 0.65], 0.1, 0.1);
      W.box(ledMats[k % 3], 0xffffff, c * R * 0.6, s * R * 0.6, 0.72, 0.3, 0.3, 0.08);
      W.box(ledMats[(k + 1) % 3], 0xffffff, c * (R + 0.28), s * (R + 0.28), 0, 0.36, 0.36, 1.5);
      if (k % 2) continue;
      const gx = c * (R - 0.2), gy = s * (R - 0.2), gc = pick(['#e8302a', '#ffd23d', '#2a6ad8', '#3ab4a0', '#ff7ab8']);   // a gondola under its pivot
      W.beam(VC.metal, '#3a3a40', [gx, gy, 0], [gx, gy - 0.8, 0], 0.07, 0.07);
      W.box(VC.solid, gc, gx, gy - 1.65, 0, 1.3, 1.0, 1.4);
      W.box(VC.glow, hdr('#ffe8c8', 0.7), gx, gy - 1.45, 0.71, 1.0, 0.45, 0.02);
      W.add(G.cone4, VC.solid, gx, gy - 0.95, 0, 2.0, 0.45, 2.1, 0, 0, 0, '#f4f0e8');
    }
    for (const e of [-1, 1]) for (const f of [-1, 1]) { W.beam(VC.metal, '#d8dce0', [0, 0, f * 0.9], [e * 6.5, -15, f * 2.8], 0.42, 0.42); W.beam(VC.metal, '#c8ccd0', [e * 3.2, -7.5, f * 1.85], [-e * 3.2, -7.5, f * 1.85], 0.18, 0.18); }
    W.cyl(VC.metal, '#d8dce0', 0, 0, 0, 0.8, 2.6, 'cyl8', Math.PI / 2); W.cyl(VC.glow, hdr('#ffffff', 2.4), 0, 0, 1.32, 0.5, 0.04, 'cyl8', Math.PI / 2);
    // the roller coaster: a loop of red track on white trestles over the far part of the deck, its ties, the train on it
    const path = [];
    for (let k = 0; k <= 64; k++) { const t = (k / 64) * Math.PI * 2; path.push([-92 + Math.cos(t) * 26, DY + 10.5 + 6 * Math.sin(t * 2 + 0.6) + 3 * Math.sin(t), D0 - 8 + Math.sin(t) * 6]); }
    for (let k = 1; k < path.length; k++) {
      const [x0, y0, z0] = path[k - 1], [x1, y1, z1] = path[k], dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L;
      for (const o of [-0.55, 0.55]) beam(b, VC.metal, x0 + nx * o, y0, z0 + nz * o, x1 + nx * o, y1, z1 + nz * o, 0.12, '#e8402a');
      beam(b, VC.metal, x0, y0 - 0.25, z0, x1, y1 - 0.25, z1, 0.2, '#c8302a');   // the spine under the rails
      b.add(G.box, VC.metal, x0, y0 - 0.06, z0, 1.3, 0.08, 0.14, 0, Math.atan2(dx, dz), 0, '#8a8e94');   // a tie
      if (k % 3 === 0) { b.box(VC.metal, '#f4f0e8', x1, (DY + y1) / 2, z1, 0.28, y1 - DY, 0.28); if (k % 6 === 0) beam(b, VC.metal, x1, DY + 0.5, z1, x1 + nx * 1.6, DY + 0.1, z1 + nz * 1.6, 0.12, '#f4f0e8'); }
    }
    for (let k = 0; k < 4; k++) {   // its train: four cars, two riders in each
      const [x, y, z] = path[30 + k * 2], [xn, , zn] = path[31 + k * 2], a = Math.atan2(xn - x, zn - z);
      b.add(G.box, VC.solid, x, y + 0.45, z, 1.3, 0.7, 2.0, 0, a, 0, pick(['#ffd23d', '#2a6ad8', '#e8302a']));
      for (const e of [-0.3, 0.3]) b.add(G.sphLow, VC.solid, x + Math.cos(a) * e, y + 1.1, z - Math.sin(a) * e, 0.28, 0.32, 0.28, 0, 0, 0, pick(['#f0d0b4', '#c08a68', '#8a5a3a']));
    }
    // the Hippodrome: the old carousel's hall at the land end, its turrets, the arched windows lit, the band of bulbs
    const hx = 18, hz = ZC;
    b.addM(K.tiledBox(22, 9, 16, 2.5), K.stuccoMat, T(hx, DY + 4.5, hz), '#d8c8b4');
    for (const e of [-1, 1]) for (const f of [-1, 1]) { b.cyl(VC.solid, '#d8c8b4', hx + e * 10.6, DY + 6, hz + f * 7.6, 1.3, 12, 'cyl8'); b.add(G.cone8, VC.solid, hx + e * 10.6, DY + 13.4, hz + f * 7.6, 3.2, 2.8, 3.2, 0, 0, 0, '#3a7a7a'); b.cyl(VC.solid, '#c8b8a0', hx + e * 10.6, DY + 11.8, hz + f * 7.6, 1.45, 0.3, 'cyl8'); }
    for (let k = 0; k < 6; k++) K.archWin(frame(b, hx - 8.5 + k * 3.4, DY, hz + 8, 1, 0), 0, 4.2, 0.02, 1.5, 3.0, hdr('#ffd9a0', 0.85), '#c8b8a0');
    for (let k = 0; k < 28; k++) b.sph(VC.glow, hdr('#ffe0a0', 2.2), hx - 10 + k * 0.74, DY + 7.4, hz + 8.06, 0.07, true);
    b.addM(new THREE.ConeGeometry(9, 3, 8, 1), VC.solid, T(hx, DY + 10.5, hz), '#a8503a');
    b.box(VC.solid, '#c8b8a0', hx, DY + 9.1, hz, 22.4, 0.4, 16.4);
    // the sign at the top of the bridge from the bluff, turned to face the walk: SANTA MONICA YACHT HARBOR · SPORT FISHING · BOATING · CAFES
    const sx = 47, sy = bluffAt(SP)[1] + 0.02, sz = D0 + 0.5, A = frame(b, sx, sy, sz, 1.35, 0);
    for (const e of [-1, 1]) { A.box(VC.metal, '#2a2a30', e * 6.2, 3.5, -0.3, 0.4, 7, 0.4); A.box(VC.metal, '#2a2a30', e * 6.2, 0.2, -0.3, 0.8, 0.4, 0.8); }
    const arch = new THREE.Shape(); arch.moveTo(-6.6, 3.2); arch.lineTo(6.6, 3.2); arch.lineTo(6.6, 6.2); arch.absarc(0, 6.2, 6.6, 0, Math.PI, false); arch.lineTo(-6.6, 3.2);
    A.addM(new THREE.ShapeGeometry(arch, 16), VC.solid, T(0, 0, -0.04), '#2a4a8a');
    A.addM(new THREE.ShapeGeometry(arch, 16), VC.solid, new THREE.Matrix4().makeRotationY(Math.PI).setPosition(0, 0, -0.08), '#2a4a8a');
    for (let k = 0; k <= 20; k++) { const a = (k / 20) * Math.PI; A.ell(VC.glow, hdr('#fff0d0', 2.6), Math.cos(a) * 6.7, 6.2 + Math.sin(a) * 6.7, 0.02, 0.09, 0.09, 0.09, true); }
    K.sign(A, 'SANTA MONICA', { w: 1024, h: 160, color: '#fff8f0', font: DECO, size: 0.72, glow: '#ffe0b0', k: 2.4 }, 0, 10.2, 0, 9.6, 1.5, 1);
    K.sign(A, 'YACHT HARBOR', { w: 1024, h: 160, color: '#fff8f0', font: DECO, size: 0.72, glow: '#ffe0b0', k: 2.4 }, 0, 7.6, 0, 11, 1.7, 1);
    K.sign(A, 'SPORT FISHING · BOATING · CAFES', { w: 1024, h: 96, color: '#ffd890', font: SANS, weight: 700, size: 0.6, glow: '#ffd890', k: 2.0 }, 0, 5.2, 0, 11.6, 1.1, 1);
    // the land side under the deck: the coast road, the bluffs, the park on top, Ocean Avenue
    pch(b, Sc);
    bluff(b, Sc);
    return b;
  };
  // the foot of the bluffs: the coast road and its traffic, the cliff and the palms along its top on the right; the sand
  // and the sea going on on the left to the groin of boulders where the beach ends, the pier behind
  const palisades = () => {
    const b = new Batcher(), Sc = 480;
    beach(b, Sc, 0, -CHUNK_LEN + 1); bikePath(b, Sc, 0, -CHUNK_LEN + 3); seaEdge(b, 0, CHUNK_LEN - 4);
    sandLife(b, Sc, 0, CHUNK_LEN - 14, { towers: 1, towels: 4, fires: 1, surf: 3, ride: 1 });
    groin(b, -CHUNK_LEN + 1.6, Sc);
    for (let k = 0; k < 3; k++) gull(b, rand(-14, -40), sandY(-20, Sc + 78) + 1.6, -rand(77, 79));   // gulls on the rocks
    pch(b, Sc);
    bluff(b, Sc);
    walkLife(b, 8);
    return b;
  };
  const done = (fn) => () => K.flush(fn().build());
  return {
    zones: { canals: done(canals), boardwalk: done(boardwalk), muscle: done(muscle), strand: done(strand), palisades: done(palisades) },
    landmarks: {
      venice: { key: 'venice', name: '威尼斯海滩', en: 'VENICE BEACH', build: done(venice) },
      pier: { key: 'pier', name: '圣莫尼卡码头', en: 'SANTA MONICA PIER', build: done(pier) },
    },
    coastSea,
    update(t) {
      canalMat.userData.scroll.offset.set(t * 0.004, t * 0.01);
      const h = (t * 0.08) % 1;   // the wheel's lights: three sets chasing through the colours
      ledMats.forEach((m, i) => m.color.setHSL((h + i / 3) % 1, 0.9, 0.55).multiplyScalar(2.6 + 1.4 * Math.sin(t * 3 + i * 2.1)));
    },
  };
}
