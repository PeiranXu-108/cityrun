// Dubai's buildings and the pieces of its districts, added to the street kit (dubai_kit.js): Deira's 1980s blocks over
// their lit shops, balconies, AC units and satellite dishes; the souks' arcades under their wooden shades; Al Fahidi's
// coral-stone houses and their wind towers; Downtown's arabesque low-rise and its cafés; Sheikh Zayed Road's towers
// (twisting, crowned, stepped, half-built under their cranes); the Marina's residential towers; Jumeirah's villas behind
// their walls; the neighbourhood mosques; the Metro's viaduct and its golden shell of a station, the skywalks; the
// highway; the creek's wharves, the abras and the dhows; the Marina's yachts; the beach; the dunes.
import { THREE, Batcher, VC, G, std, basic, hdr, buildingGeo, shade, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { EDGE, at } from './common.js';
import { beam } from './tokyo_kit.js';
import { taperGeo } from './ny_icons.js';
import { HALF } from './istanbul_icons.js';
import { seaMat, seaGeo, seaUniforms, SEA } from './la_sea.js';
import { KERB, X0, face, SAND, CORAL, WARM, DEIRA_SIGNS, SOUK_SIGNS, BLVD_SIGNS, MARINA_SIGNS, HERITAGE_SIGNS, STATIONS, KUFI } from './dubai_kit.js';

// the Gulf at blue hour, for la_sea.js's shader: the afterglow on the water at the horizon, deepening to night blue below,
// the gold road under the set sun, turquoise in the shallows
export const GULF = { cHorizon: ['#e8a886'], cRose: ['#b88aa0'], cMauve: ['#6a6aa2'], cViolet: ['#3a4a86'], cDeep: ['#1e2a58'], cHaze: ['#d8a08a'], cGold: ['#ffc070', 1.2],
  cShallow: ['#3a8a98'], cFoam: ['#eaf4f4', 0.8], cWet: ['#6a5a48'] };
const RIB = new THREE.TorusGeometry(1, 0.045, 4, 36, Math.PI);   // a station's rib: a half ring arching over its platforms
export const WY = -1.4;   // the water's level (the walk is at 0)
const _m = new THREE.Matrix4();

export function addBuildings(K) {
  K.gulfU = seaUniforms(GULF);
  K.seaMat = seaMat(K.gulfU);
  const kerbStripe = ['#141414', '#f2c230'];
  // ---------- the street ----------
  // the lane of road between the track and the kerb, its markings, the kerb painted black and yellow, the pavement
  K.kerbLane = (b, s, z0 = 0, z1 = CHUNK_LEN, { gaps = [], x1 = X0, kerb = KERB } = {}) => {
    K.road(b, s * (EDGE + kerb) / 2 + s * 0.08, -(z0 + z1) / 2, kerb - EDGE - 0.1, z1 - z0);
    for (let z = z0 + 2; z < z1 - 2; z += 6) b.box(VC.solid, '#e8e4d8', s * (EDGE + 0.45), 0.045, -z, 0.12, 0.02, 3);   // the lane's edge line
    let k = 0;
    for (let z = z0; z < z1; z += 1) { if (!gaps.some(([a, c]) => z > a - 0.5 && z < c + 0.5)) b.box(VC.solid, kerbStripe[k % 2], s * kerb, 0.1, -z - 0.5, 0.22, 0.2, 1.0); k++; }
    K.pave(b, s * (kerb + x1) / 2, -(z0 + z1) / 2, x1 - kerb, z1 - z0);
  };
  // ---------- a Deira block ----------
  // 4–9 storeys of rendered concrete over a row of lit shops, balconies, the AC units and laundry, satellite dishes and
  // water tanks on the roof, the boards over the shops and up the corners
  const shopFront = (b, s, xf, zc, L, sg, kind, { awning = true } = {}) => {
    const fx = s * (xf - 0.06);
    b.add(K.win(Math.max(1, Math.round(L / 2.4)), kind), K.winMat, fx, 1.55, zc, L - 0.5, 2.5, 1, 0, face(s), 0);
    b.box(VC.metal, '#b8bcc0', fx, 2.86, zc, 0.06, 0.12, L - 0.3);
    K.shopSign(b, sg, s * (xf - 0.12), 3.5, zc, s, Math.min(L - 0.4, 4.2), Math.min(L - 0.4, 4.2) * 0.29);
    if (awning) b.add(G.box, VC.solid, s * (xf - 0.75), 2.95, zc, 1.5, 0.06, L - 0.3, 0, 0, -s * 0.12, pick(['#c8202a', '#2a6a8a', '#e8e4dc', '#2a8a4a', '#d8a030']));
    K.pool(b, s * (xf - 1.6), zc, 3.2, L, hdr('#ffe2b0', 0.42));
  };
  K.deiraRow = (b, s, z0, z1, { x0 = X0, floors = [4, 9], signs = DEIRA_SIGNS, kiosk = 0.2 } = {}) => {
    let z = z0;
    while (z < z1 - 5) {
      const L = Math.min(rand(9, 15), z1 - z), d = rand(12, 16), fl = randi(...floors), H = 4.4 + fl * 3.1, zc = -(z + L / 2), cx = s * (x0 + d / 2);
      b.block(VC.solid, '#3a3430', cx, 0, zc, d, 4.4, L);
      b.addM(buildingGeo(d, H - 4.4, L, K.deira, 1.85, 3.1), K.deiraMat, at(cx, 4.4, zc), pick(['#f4ecdc', '#ece0c8', '#f0e4d0', '#e4d4b8', '#f8f0e4', '#e8d8c4']));
      b.box(VC.solid, '#cfc3ab', cx, 4.4, zc, d + 0.3, 0.3, L + 0.1);
      const n = Math.max(1, Math.round(L / 4.6)), sl = L / n;
      for (let i = 0; i < n; i++) shopFront(b, s, x0, -(z + sl * (i + 0.5)), sl, pick(signs), pick(['grocery', 'phones', 'juice', 'shawarma', 'sweets', 'perfume', 'cloth', 'pharmacy', 'tailor', 'cafe']));
      // the balconies: a slab and a railing every other bay, an AC unit or the washing on each
      for (let f = 0; f < fl; f++) {
        const y = 4.4 + f * 3.1 + 0.15;
        for (let u = -L / 2 + 1.6; u < L / 2 - 1; u += 3.7) {
          if (chance(0.55)) {
            b.box(VC.solid, '#d8ccb4', s * (x0 - 0.55), y, zc + u, 1.1, 0.15, 2.6);
            b.box(VC.metal, '#9a9ea4', s * (x0 - 1.08), y + 0.5, zc + u, 0.05, 0.9, 2.6);
            if (chance(0.5)) b.block(VC.solid, '#e8e8e4', s * (x0 - 0.45), y + 0.08, zc + u - 0.6, 0.55, 0.6, 0.85);   // an AC unit
            if (chance(0.3)) for (let k = 0; k < 4; k++) b.add(G.plane, VC.solid, s * (x0 - 0.95), y + 1.6, zc + u - 1 + k * 0.55, 0.45, 0.65, 1, 0, face(s), 0, pick(['#f4f0e8', '#c8302a', '#2a5aa8', '#e8c040', '#3a8a5a', '#d8d0f0']));
          } else if (chance(0.5)) b.block(VC.solid, '#e8e8e4', s * (x0 - 0.3), y + 0.7, zc + u, 0.6, 0.55, 0.8);   // a window unit
        }
      }
      // the roof: parapet, water tanks, satellite dishes, a stair hut; now and then a rooftop sign
      b.box(VC.solid, '#d8ccb4', cx, H + 0.45, zc, d, 0.9, L);
      for (let k = randi(1, 3); k > 0; k--) b.cyl(VC.solid, pick(['#e8e4dc', '#d8dce0', '#c8b8a0']), cx + rand(-d / 3, d / 3), H + 1.1, zc + rand(-L / 3, L / 3), 0.7, 1.3, 'cyl8');
      for (let k = randi(2, 5); k > 0; k--) { const dx = cx + rand(-d / 3, d / 3), dz = zc + rand(-L / 3, L / 3); b.add(G.sphLow, VC.solid, dx, H + 1.3, dz, 0.9, 0.9, 0.25, rand(-0.6, -0.3), rand(0, 6), 0, '#e8e8e4'); b.box(VC.metal, '#8a8e94', dx, H + 1.0, dz, 0.06, 0.8, 0.06); }
      if (chance(0.25)) { const sg = pick(signs); K.shopSign(b, sg, s * (x0 + 0.5), H + 2.6, zc, s, Math.min(L - 1, 8), Math.min(L - 1, 8) * 0.29); b.box(VC.metal, '#5a5e64', s * (x0 + 0.7), H + 1.5, zc, 0.1, 2.2, Math.min(L - 1, 8)); }
      if (chance(0.35)) K.shopSign(b, pick(signs), s * (x0 - 0.9), 7 + rand(0, 3), zc + (chance(0.5) ? L / 2 - 0.2 : -L / 2 + 0.2), s, 3.4, 1.0);   // a board out from the corner
      if (chance(kiosk)) K.shawarma(b, s * (x0 - 2.0), zc + rand(-L / 3, L / 3), s);
      z += L + rand(0.1, 0.5);
    }
  };
  // ---------- the souk ----------
  // two storeys of shops behind an arcade, its shade of wooden lattice and palm-frond thatch over the pavement, lanterns
  // hanging under it, the goods spilling out: spice sacks, carpets, rolls of cloth, lamps
  const kindOf = { 'GOLD & JEWELLERY': 'gold', SPICES: 'spice', 'OUD & BAKHOOR': 'perfume', CARPETS: 'carpet', LANTERNS: 'lamps', TEXTILES: 'cloth', SAFFRON: 'spice', DATES: 'dates', PERFUMES: 'perfume', PASHMINA: 'cloth' };
  K.soukRow = (b, s, z0, z1, { x0 = X0, signs = SOUK_SIGNS, roof = true } = {}) => {
    let z = z0;
    while (z < z1 - 4) {
      const L = Math.min(rand(5, 8), z1 - z), d = rand(9, 12), H = rand(6.5, 8.5), zc = -(z + L / 2), cx = s * (x0 + d / 2);
      b.addM(K.tiledBox(d, H, L, 2.5), K.stuccoMat, at(cx, H / 2, zc), pick(SAND));
      const kind = pick(['gold', 'spice', 'cloth', 'perfume', 'lamps', 'carpet', 'dates', 'spice']), sg = signs.find((x) => kindOf[x.en] === kind) || pick(signs);
      shopFront(b, s, x0, zc, L, sg, kind, { awning: false });
      b.add(G.plane, K.latticeMat, s * (x0 - 0.05), 5.3, zc, L - 0.6, 1.8, 1, 0, face(s), 0, pick(['#6a4022', '#7a4a26', '#5a361c']));   // the upper floor's mashrabiya
      b.box(VC.solid, shade(pick(SAND), 0.92), cx, H + 0.25, zc, d + 0.2, 0.5, L + 0.05);
      for (let u = -L / 2 + 0.4; u < L / 2; u += 0.9) b.add(G.cone4, VC.solid, s * (x0 + 0.1), H + 0.7, zc + u, 0.45, 0.5, 0.2, 0, 0, 0, shade(pick(SAND), 0.95));   // the crenellations
      // the goods out front
      const gx = s * (x0 - 1.2);
      if (kind === 'spice' || kind === 'dates') for (let u = -L / 2 + 0.6; u < L / 2 - 0.4; u += 0.75) { b.cyl(VC.solid, '#c8b088', gx, 0.3, zc + u, 0.3, 0.6, 'cyl8'); b.add(G.cone, VC.solid, gx, 0.75, zc + u, 0.58, 0.4, 0.58, 0, 0, 0, kind === 'dates' ? pick(['#6a3a1a', '#8a4a20']) : pick(['#d84a1a', '#f2b030', '#8a5a2a', '#c8202a', '#e8d070', '#6a8a2a', '#e86a8a'])); }
      else if (kind === 'carpet') for (let u = -L / 2 + 0.8; u < L / 2 - 0.4; u += 1.3) b.add(G.plane, K.carpetMat, s * (x0 - 0.08), 2.2, zc + u, 1.2, 2.2, 1, 0, face(s), 0);
      else if (kind === 'cloth') for (let u = -L / 2 + 0.5; u < L / 2 - 0.3; u += 0.42) b.cyl(VC.solid, pick(['#c8202a', '#2a5aa8', '#e8c040', '#2a8a5a', '#a83a8a', '#f4f0e8']), gx, 0.9, zc + u, 0.16, 1.8, 'cyl8');
      else if (kind === 'lamps') for (let u = -L / 2 + 0.5; u < L / 2 - 0.3; u += 0.7) b.add(G.sphLow, VC.glow, s * (x0 - 0.6), 3.3 - rand(0, 0.6), zc + u, 0.3, 0.42, 0.3, 0, 0, 0, hdr(pick(['#ffb040', '#ff7a3a', '#6ad0ff', '#ff4a8a', '#7aff8a']), 2.4));
      else if (kind === 'perfume' && chance(0.6)) K.smokeAt(s * (x0 - 1.0), 1.1, zc);   // an incense burner smoking at the door
      z += L + 0.05;
    }
    if (!roof) return;
    // the arcade: columns at the kerb, the beams, the lattice and thatch overhead, the lanterns under it
    const xa = s * (KERB + 0.6), xm = s * (KERB + X0) / 2, w = X0 - KERB;
    for (let zz = z0 + 1; zz < z1; zz += 4) b.cyl(VC.solid, '#6a4a2a', xa, 2.2, -zz, 0.14, 4.4, 'cyl8');
    b.box(VC.solid, '#5a3a1e', xa, 4.45, -(z0 + z1) / 2, 0.24, 0.24, z1 - z0);
    for (let zz = z0 + 0.5; zz < z1; zz += 1.2) b.box(VC.solid, '#6a4424', xm, 4.6, -zz, w, 0.12, 0.14);
    b.add(G.plane, K.latticeMat, xm, 4.72, -(z0 + z1) / 2, w, z1 - z0, 1, -Math.PI / 2, 0, 0, '#c8a070');
    for (let zz = z0 + 2.5; zz < z1; zz += 3.2) b.add(G.sphLow, VC.glow, xm, 3.9, -zz, 0.34, 0.46, 0.34, 0, 0, 0, hdr(pick(['#ffb040', '#ff9a3a', '#ffd070']), 2.6));
    K.pool(b, xm, -(z0 + z1) / 2, w, z1 - z0, hdr('#ffc880', 0.28));
  };
  // ---------- Al Fahidi ----------
  // coral-stone houses of one or two storeys, their parapets crenellated, wind towers (barjeel) catching the breeze with
  // their slotted sides, carved teak doors studded with brass, the windows shuttered or screened, palm-frond shades on poles
  K.windTower = (b, x, y, z, { w = 2.6, h = 5.5, col = '#e2d4b6' } = {}) => {
    b.addM(K.tiledBox(w, h, w, 2), K.coralMat, at(x, y + h / 2, z), col);
    for (const [dx, dz, ry] of [[w / 2 + 0.02, 0, Math.PI / 2], [-w / 2 - 0.02, 0, -Math.PI / 2], [0, w / 2 + 0.02, 0], [0, -w / 2 - 0.02, Math.PI]]) for (let k = -1; k <= 1; k++) {
      const off = k * w * 0.28;
      b.add(G.box, VC.solid, x + dx + (dz ? off : 0), y + h * 0.55, z + dz + (dx ? off : 0), 0.32, h * 0.55, 0.06, 0, ry, 0, '#3a2a1a');   // the slots that scoop the wind
    }
    b.box(VC.solid, shade(col, 0.9), x, y + h + 0.15, z, w + 0.3, 0.3, w + 0.3);
    for (let k = 0; k < 4; k++) for (let e = -1; e <= 1; e += 2) { b.add(G.cone4, VC.solid, x + e * (w / 2), y + h + 0.55, z + (k - 1.5) * (w / 4), 0.3, 0.5, 0.3, 0, 0, 0, col); b.add(G.cone4, VC.solid, x + (k - 1.5) * (w / 4), y + h + 0.55, z + e * (w / 2), 0.3, 0.5, 0.3, 0, 0, 0, col); }
    for (let k = 0; k < 4; k++) b.cyl(VC.solid, '#6a4a2a', x + (k % 2 ? 1 : -1) * (w / 2 + 0.05), y + h * 0.9, z + (k < 2 ? 1 : -1) * (w / 2 + 0.05), 0.04, 0.1, 'cyl6', 0, Math.PI / 2);   // the poles' ends
  };
  K.door = (b, x, z, s, { w = 1.8, h = 2.6 } = {}) => {   // a carved teak double door, its studs, the lantern over it
    b.box(VC.solid, '#5a3418', x - s * 0.02, h / 2, z, 0.12, h, w);
    for (let k = 0; k < 2; k++) for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) b.box(VC.metal, '#c8a050', x - s * 0.09, 0.4 + r * 0.6, z + (k ? 1 : -1) * w * 0.25 + (c - 0.5) * 0.3, 0.03, 0.06, 0.06);
    b.box(VC.solid, '#3a2410', x - s * 0.07, h / 2, z, 0.04, h, 0.05);
    b.add(G.sphLow, VC.glow, x - s * 0.35, h + 0.45, z, 0.26, 0.36, 0.26, 0, 0, 0, hdr('#ffc070', 2.6));
    K.pool(b, x - s * 1.2, z, 2.6, 2.6, hdr('#ffc880', 0.35));
  };
  K.heritageRow = (b, s, z0, z1, { x0 = X0 + 0.5, signs = HERITAGE_SIGNS } = {}) => {
    let z = z0;
    while (z < z1 - 5) {
      const L = Math.min(rand(8, 13), z1 - z), d = rand(10, 14), two = chance(0.6), H = two ? 7.2 : 4.2, zc = -(z + L / 2), cx = s * (x0 + d / 2), col = pick(CORAL);
      b.addM(K.tiledBox(d, H, L, 2.2), K.coralMat, at(cx, H / 2, zc), col);
      b.box(VC.solid, shade(col, 1.04), cx, H + 0.3, zc, d, 0.6, L);
      for (let u = -L / 2 + 0.4; u < L / 2; u += 0.85) b.add(G.cone4, VC.solid, s * (x0 + 0.1), H + 0.85, zc + u, 0.4, 0.5, 0.2, 0, 0, 0, shade(col, 1.04));   // the crenellations
      K.door(b, s * x0, zc + rand(-L / 4, L / 4), s);
      for (let f = 0; f < (two ? 2 : 1); f++) for (let u = -L / 2 + 1.4; u < L / 2 - 1; u += 2.6) {   // the windows: shutters and screens
        const y = 1.9 + f * 3, zz = zc + u;
        if (Math.abs(zz - zc) < 1.4 && f === 0) continue;
        b.box(VC.solid, '#2a1c10', s * (x0 - 0.03), y, zz, 0.06, 1.3, 0.9);
        if (chance(0.5)) b.add(G.plane, K.latticeGlow, s * (x0 - 0.08), y, zz, 0.9, 1.3, 1, 0, face(s), 0, hdr('#ffb860', 1.4));
        else for (const e of [-1, 1]) b.box(VC.solid, '#3a6a7a', s * (x0 - 0.12), y, zz + e * 0.48, 0.05, 1.3, 0.42);   // open shutters, painted
        b.box(VC.solid, '#6a4a2a', s * (x0 - 0.1), y + 0.75, zz, 0.12, 0.08, 1.1);
      }
      if (chance(0.65)) K.windTower(b, cx + s * rand(-1, 1), H, zc + rand(-L / 4, L / 4), { col, h: rand(4.5, 6.5), w: rand(2.2, 3) });
      if (chance(0.45)) K.shopSign(b, pick(signs), s * (x0 - 0.06), H - 1.2, zc, s, 2.8, 0.82);
      if (chance(0.4)) {   // an areesh shade: palm fronds on a frame of poles, a bench under it
        const ax = s * (x0 - 2.0);
        for (const u of [-1.2, 1.2]) for (const e of [0, 1]) b.cyl(VC.solid, '#7a5a3a', ax + s * e * 1.4, 1.3, zc + u, 0.06, 2.6, 'cyl6');
        b.box(VC.solid, '#a88a5a', ax + s * 0.7, 2.65, zc, 1.9, 0.14, 3.0);
        for (let k = 0; k < 6; k++) b.box(VC.solid, pick(['#8a7a4a', '#9a8a5a', '#7a6a3e']), ax + s * 0.7, 2.75, zc - 1.25 + k * 0.5, 2.1, 0.06, 0.4);
        K.bench(b, ax + s * 0.6, zc, s);
      }
      if (z + L < z1 - 6 && chance(0.35)) {   // a sikka: the narrow lane between the houses, a lantern down it
        b.add(G.sphLow, VC.glow, s * (x0 + 3), 3.4, -(z + L + 1.2), 0.3, 0.42, 0.3, 0, 0, 0, hdr('#ffb860', 2.6));
        K.pool(b, s * (x0 + 2), -(z + L + 1.2), 2.4, 2.4, hdr('#ffc880', 0.3));
        z += 2.4;
      }
      z += L + 0.05;
    }
  };
  // ---------- Downtown's arabesque low-rise ----------
  // four or five storeys of sand-coloured render, the arcade of pointed arches at the foot holding the cafés, arched
  // windows behind wooden screens, crenellations and a wind tower on the roof, lights strung along the roof terraces
  K.arcade = (b, s, x, z0, z1, { h = 4.6, col = '#e6d2ae' } = {}) => {   // a run of pointed arches along x, from z0 to z1
    const n = Math.max(1, Math.round((z1 - z0) / 3.2)), w = (z1 - z0) / n;
    for (let i = 0; i <= n; i++) b.block(VC.solid, col, x, 0, -(z0 + i * w), 0.5, h, 0.5);
    b.box(VC.solid, col, x, h + 0.4, -(z0 + z1) / 2, 0.5, 0.8, z1 - z0 + 0.5);
    for (let i = 0; i < n; i++) { const zc = -(z0 + (i + 0.5) * w); for (const e of [-1, 1]) b.add(G.box, VC.solid, x, h - 0.6, zc + e * w * 0.24, 0.42, 1.4, w * 0.5, e * 0.55, 0, 0, col); }   // the arch's two sides leaning in to its point
  };
  K.cafe = (b, x, z, s, { n = 3 } = {}) => {   // tables out on the pavement, chairs round them, a shisha pipe smoking now and then
    for (let k = 0; k < n; k++) {
      const tz = z + (k - (n - 1) / 2) * 2.2;
      b.cyl(VC.metal, '#c8ccd0', x, 0.37, tz, 0.35, 0.04, 'cyl8'); b.cyl(VC.metal, '#5a5e64', x, 0.18, tz, 0.04, 0.36, 'cyl6');
      for (const e of [-1, 1]) { b.box(VC.solid, '#5a3a24', x + e * 0.62, 0.24, tz, 0.4, 0.06, 0.4); b.box(VC.solid, '#5a3a24', x + e * 0.82, 0.48, tz, 0.05, 0.5, 0.4); }
      if (chance(0.5)) K.person(b, x + 0.62, tz, { pose: 'seated', outfit: pick(['kandura', 'casual', 'tourist', 'abaya']), ry: Math.PI / 2 });
      if (chance(0.4)) { b.cyl(VC.metal, '#c8a050', x + 0.3, 0.6, tz + 0.5, 0.06, 0.5, 'cyl6'); b.sph(VC.metal, '#8a3a5a', x + 0.3, 0.42, tz + 0.5, 0.14); K.smokeAt(x + 0.3, 0.95, tz + 0.5); }   // a shisha
      b.add(G.cone8, VC.solid, x, 2.4, tz, 2.2, 0.5, 2.2, 0, 0, 0, pick(['#f4f0e8', '#e8dcc0', '#5a3a24']));   // the parasol
      b.cyl(VC.metal, '#8a8a8a', x, 1.3, tz, 0.03, 2.2, 'cyl6');
    }
  };
  K.arabesqueRow = (b, s, z0, z1, { x0 = X0 + 2.6, signs = BLVD_SIGNS, cafes = 0.6 } = {}) => {
    let z = z0;
    while (z < z1 - 8) {
      const L = Math.min(rand(14, 22), z1 - z), d = rand(12, 16), fl = randi(3, 5), H = fl * 3.6 + 1.4, zc = -(z + L / 2), cx = s * (x0 + d / 2), col = pick(SAND);
      b.addM(K.tiledBox(d, H, L, 2.8), K.stuccoMat, at(cx, H / 2, zc), col);
      K.arcade(b, s, s * (x0 - 2.4), z + 0.3, z + L - 0.3, { col: shade(col, 1.05) });
      b.box(VC.solid, shade(col, 0.9), s * (x0 - 1.2), 0.03, zc, 2.4, 0.06, L - 0.6);
      const n = Math.max(1, Math.round(L / 5.5)), sl = L / n;
      for (let i = 0; i < n; i++) shopFront(b, s, x0, -(z + sl * (i + 0.5)), sl, pick(signs), pick(['cafe', 'sweets', 'perfume', 'boutique', 'dates', 'cafe', 'gold']), { awning: false });
      for (let f = 1; f < fl; f++) for (let u = -L / 2 + 1.6; u < L / 2 - 1; u += 2.8) {   // arched windows behind their screens
        const y = f * 3.6 + 1.6;
        b.box(VC.solid, '#3a2a1a', s * (x0 - 0.03), y, zc + u, 0.06, 1.8, 1.1);
        b.add(G.cyl, VC.solid, s * (x0 - 0.04), y + 0.9, zc + u, 1.1, 0.06, 1.1, 0, 0, Math.PI / 2, '#3a2a1a');
        b.add(G.plane, chance(0.45) ? K.latticeGlow : K.latticeMat, s * (x0 - 0.09), y, zc + u, 1.0, 1.7, 1, 0, face(s), 0, chance(0.45) ? hdr('#ffc070', 1.3) : '#6a4426');
      }
      b.box(VC.solid, shade(col, 1.04), cx, H + 0.35, zc, d, 0.7, L);
      for (let u = -L / 2 + 0.4; u < L / 2; u += 0.9) b.add(G.cone4, VC.solid, s * (x0 + 0.1), H + 0.95, zc + u, 0.42, 0.55, 0.2, 0, 0, 0, shade(col, 1.04));
      if (chance(0.5)) K.windTower(b, cx + s * rand(0, 3), H, zc + rand(-L / 3, L / 3), { col, h: rand(5, 7) });
      if (chance(0.5)) K.lanterns(b, s * (x0 + 0.3), s * (x0 + d - 0.5), H + 2.2, zc + rand(-L / 3, L / 3), { sag: 0.3, cols: ['#ffd890', '#fff0c0'] });
      if (chance(cafes)) K.cafe(b, s * (x0 - 4.6), zc, s, { n: randi(2, 4) });
      z += L + rand(0.3, 1.2);
    }
  };
  // ---------- the towers ----------
  // Sheikh Zayed Road's: kind 'slab' (a glass box over its podium, a lit crown), 'twist' (its floors turning as it rises),
  // 'step' (setting back in tiers), 'spire' (a crown tapering to a mast), 'fins' (lit fins up its corners), 'build' (half
  // built: the core and bare floors, a crane on top); the red lamps blinking on all of them
  K.crane = (b, x, y, z, { h = 22, jib = 34, ry = rand(0, Math.PI * 2) } = {}) => {
    const c = Math.cos(ry), sn = Math.sin(ry);
    b.block(VC.solid, '#e8c030', x, y, z, 1.6, h, 1.6);
    for (let yy = y + 2; yy < y + h; yy += 2.4) b.box(VC.solid, '#c8a020', x, yy, z, 1.7, 0.1, 1.7);
    const jx = (u) => [x + u * c, y + h + 1.2, z - u * sn];
    beam(b, VC.solid, ...jx(-jib * 0.28), ...jx(jib), 0.9, '#e8c030');   // the jib and its counter-jib
    b.block(VC.solid, '#2a2a30', ...jx(-jib * 0.24).map((v, i) => (i === 1 ? v - 1.4 : v)), 2.2, 1.4, 2.2);
    b.block(VC.solid, '#e8c030', x, y + h + 1.6, z, 1.0, 4, 1.0);
    b.box(VC.glow, hdr('#fff4d8', 1.4), ...jx(jib * 0.06).map((v, i) => (i === 1 ? v - 1.2 : v)), 1.4, 1.2, 1.4);   // the cab, lit
    for (const u of [jib, -jib * 0.28]) b.sph(K.blinkRed, '#ffffff', ...jx(u).map((v, i) => (i === 1 ? v + 0.6 : v)), 0.35, true);
    b.sph(K.blinkRed, '#ffffff', x, y + h + 3.8, z, 0.4, true);
  };
  K.tower = (b, x, z, { w = 26, d = 26, h = 140, kind = pick(['slab', 'slab', 'twist', 'step', 'spire', 'fins', 'build']), m = randi(0, 2), podium = true } = {}) => {
    const T = K.glassT[m], mat = K.glassM[m], tint = pick(['#ffffff', '#f0f4ff', '#fff4e8', '#e8f0f8']);
    if (podium) { b.addM(buildingGeo(w + 8, 18, d + 8, T, 3.2, 4.0), mat, at(x, 0, z), '#d8d0c4'); b.box(VC.glow, hdr('#ffe8c0', 1.4), x, 2.4, z, w + 8.1, 3.6, d + 8.1); }
    const y0 = podium ? 18 : 0;
    let top = y0 + h;
    if (kind === 'twist') {   // its floors turning as it rises, a quarter turn top to bottom
      const n = 14, sh = h / n;
      for (let i = 0; i < n; i++) b.addM(buildingGeo(w, sh, d, T, 3.2, 4.0), mat, new THREE.Matrix4().makeRotationY((i / n) * (Math.PI / 2)).setPosition(x, y0 + i * sh, z), tint);
    } else if (kind === 'step') {
      let yy = y0, ww = w, dd = d;
      for (const f of [0.5, 0.3, 0.2]) { const hh = h * f; b.addM(buildingGeo(ww, hh, dd, T, 3.2, 4.0), mat, at(x, yy, z), tint); b.box(VC.glow, hdr('#ffe8c0', 1.8), x, yy + hh, z, ww + 0.2, 0.4, dd + 0.2); yy += hh; ww *= 0.78; dd *= 0.78; }
    } else if (kind === 'build') {   // half built: the glass stops, the bare slabs and the core go on up, the crane on top
      const hg = h * 0.55;
      b.addM(buildingGeo(w, hg, d, T, 3.2, 4.0), mat, at(x, y0, z), tint);
      b.block(VC.solid, '#a8a49c', x, y0 + hg, z, w * 0.3, h - hg + 6, d * 0.3);
      for (let yy = y0 + hg + 3.6; yy < y0 + h; yy += 3.6) b.box(VC.solid, '#b8b4ac', x, yy, z, w, 0.3, d);
      for (const [ex, ez] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.block(VC.solid, '#a8a49c', x + ex * (w / 2 - 0.4), y0 + hg, z + ez * (d / 2 - 0.4), 0.8, h - hg, 0.8);
      K.crane(b, x + w * 0.2, y0 + h + 4, z, { h: 18, jib: w * 1.4 });
      top = y0 + h + 26;
    } else {
      b.addM(buildingGeo(w, h, d, T, 3.2, 4.0), mat, at(x, y0, z), tint);
      if (kind === 'fins') for (const [ex, ez] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.box(VC.glow, hdr(pick(['#bfe6ff', '#ffd9a0', '#d8b0ff']), 2.4), x + ex * (w / 2 + 0.15), y0 + h / 2, z + ez * (d / 2 + 0.15), 0.3, h, 0.3);
      if (kind === 'spire') { b.add(taperGeo(0.15, 4), mat, x, top + h * 0.12, z, w * 0.9, h * 0.24, d * 0.9, 0, Math.PI / 4, 0, tint); b.cyl(VC.metal, '#c8ccd0', x, top + h * 0.24 + 8, z, 0.4, 16, 'cyl6'); top += h * 0.24 + 16; }
      else { b.box(VC.glow, hdr(pick(['#ffe2b0', '#bfe6ff', '#fff4e8']), 2.0), x, top + 1.2, z, w + 0.4, 2.4, d + 0.4); b.block(VC.solid, '#3a3a40', x, top + 2.4, z, w * 0.6, 4, d * 0.6); top += 6.4; }
    }
    for (const [ex, ez] of [[-1, -1], [1, 1]]) b.sph(K.blinkRed, '#ffffff', x + ex * w * 0.3, top + 0.4, z + ez * d * 0.3, 0.45, true);
    return top;
  };
  K.towerRow = (b, s, z0, z1, { x0 = 16, gaps = [] } = {}) => {
    let z = z0 + rand(0, 4);
    while (z < z1 - 10) {
      const w = rand(22, 32), d = rand(22, 30);
      if (!gaps.some(([a, c]) => z + w > a && z < c)) K.tower(b, s * (x0 + d / 2 + 4), -(z + w / 2), { w: d, d: w, h: rand(80, 230) });
      z += w + rand(10, 20);
    }
  };
  // the residential towers of the Marina and JBR: balconies all the way up, the podium's restaurants under their awnings
  K.resTower = (b, x, z, { w = 24, d = 24, h = rand(90, 200), crown = chance(0.6) } = {}) => {
    b.addM(buildingGeo(w, h, d, K.res, 3.0, 3.2), K.resMat, at(x, 12, z), pick(['#ffffff', '#f4ece0', '#e8f0f4', '#f8f0e8']));
    b.addM(buildingGeo(w + 10, 12, d + 10, K.glassT[1], 3.2, 4.0), K.glassM[1], at(x, 0, z), '#e8dcc8');
    if (crown) { b.add(G.box, VC.glow, x, h + 14, z, w * 0.7, 4, d * 0.7, 0, Math.PI / 4, 0, hdr(pick(['#bfe6ff', '#ffd9a0', '#ff9ad8']), 1.8)); }
    b.sph(K.blinkRed, '#ffffff', x, h + 17, z, 0.5, true);
  };
  K.backRow = (b, s, { x0 = 34, gaps = [], kind = 'glass', zs = null } = {}) => {   // the towers further back, behind the street's own buildings
    let z = rand(0, 10);
    while (z < CHUNK_LEN - 6) {
      const w = rand(18, 30), d = rand(18, 26), x = s * (x0 + d / 2 + rand(0, 26));
      if (!gaps.some(([a, c]) => z + w > a && z < c)) {
        if (kind === 'res') K.resTower(b, x, -(z + w / 2), { w, d, h: rand(70, 170), crown: chance(0.4) });
        else if (kind === 'low') b.addM(buildingGeo(d, rand(14, 30), w, K.deira, 1.85, 3.1), K.deiraMat, at(x, 0, -(z + w / 2)), pick(['#f4ecdc', '#ece0c8', '#e4d4b8']));
        else K.tower(b, x, -(z + w / 2), { w: d, d: w, h: rand(60, 200), podium: false });
      }
      z += w + rand(6, 16);
    }
  };
  // ---------- Jumeirah's villas ----------
  // the boundary wall, its crenellated coping and the arched gate under a lantern, bougainvillea spilling over it; the villa
  // behind with its arched windows and flat roof, palms and a ghaf in the garden, a Land Cruiser in the drive
  K.villaRow = (b, s, z0, z1, { x0 = X0 + 1 } = {}) => {
    let z = z0;
    while (z < z1 - 10) {
      const L = Math.min(rand(18, 26), z1 - z), zc = -(z + L / 2), col = pick(['#f4ece0', '#efe2cc', '#f8f2e6', '#e8d8bc', '#f2e6d0']);
      b.block(VC.solid, col, s * x0, 0, zc, 0.4, 2.6, L - 0.2);   // the wall
      for (let u = -L / 2 + 0.4; u < L / 2 - 0.2; u += 0.8) b.add(G.cone4, VC.solid, s * x0, 2.85, zc + u, 0.32, 0.5, 0.32, 0, 0, 0, col);
      const gz = zc + rand(-L / 4, L / 4);
      b.block(VC.solid, shade(col, 0.95), s * x0, 0, gz - 2.1, 0.7, 3.6, 0.7); b.block(VC.solid, shade(col, 0.95), s * x0, 0, gz + 2.1, 0.7, 3.6, 0.7);
      b.box(VC.solid, '#5a3a1e', s * (x0 - 0.05), 1.3, gz, 0.15, 2.6, 3.4);   // the gate
      for (const e of [-1, 1]) b.add(G.sphLow, VC.glow, s * (x0 - 0.45), 3.9, gz + e * 2.1, 0.26, 0.34, 0.26, 0, 0, 0, hdr('#ffd090', 2.6));
      if (chance(0.7)) K.bougain(b, s * (x0 - 0.25), 2.9, zc + rand(-L / 3, L / 3), rand(3, 6), rand(1.6, 2.6), face(s));
      const vd = rand(12, 16), vh = chance(0.5) ? 7.4 : 4.2, vx = s * (x0 + 6 + vd / 2);
      b.addM(K.tiledBox(vd, vh, L - 6, 2.8), K.stuccoMat, at(vx, vh / 2, zc), col);
      b.box(VC.solid, shade(col, 1.03), vx, vh + 0.35, zc, vd + 0.3, 0.7, L - 5.7);
      for (let f = 0; f < (vh > 5 ? 2 : 1); f++) for (let u = -(L - 6) / 2 + 1.6; u < (L - 6) / 2 - 1; u += 2.8) {
        const y = 1.6 + f * 3.2;
        b.box(VC.glow, hdr(chance(0.55) ? '#ffd9a0' : '#3a3440', chance(0.55) ? 1.4 : 1), s * (x0 + 5.97), y, zc + u, 0.06, 1.6, 1.0);
        b.add(G.cyl, VC.glow, s * (x0 + 5.96), y + 0.8, zc + u, 1.0, 0.06, 1.0, 0, 0, Math.PI / 2, hdr('#ffd9a0', 1.2));
      }
      K.datePalm(b, s * (x0 + 3), zc + rand(-L / 3, L / 3), rand(0.7, 0.95));
      if (chance(0.5)) K.ghaf(b, s * (x0 + 3.5), zc + rand(-L / 3, L / 3), rand(0.8, 1.0));
      if (chance(0.5)) K.place(b, (t) => K.car(t, 0, 0, 1, { kind: pick(['suv', 'suv', 'gwagon', 'lux']), lit: false }), new THREE.Matrix4().makeRotationY((s * Math.PI) / 2).setPosition(s * (x0 - 2.6), 0, gz));
      z += L;
    }
  };
  // ---------- a neighbourhood mosque ----------
  // the prayer hall under its dome on an octagonal drum, the arcade along its front, one minaret in the Gulf's way (square
  // base, octagonal shaft, a balcony ringed with light, the lantern and its dome, the crescent), lit warm
  K.minaret = (b, x, z, h = 26, { col = '#f2ead8', light = '#bfffd8' } = {}) => {
    b.block(VC.solid, col, x, 0, z, 3.2, h * 0.3, 3.2);
    b.add(G.cyl8, VC.solid, x, h * 0.3 + h * 0.25, z, 2.5, h * 0.5, 2.5, 0, Math.PI / 8, 0, col);
    b.add(G.cyl8, VC.solid, x, h * 0.8 + 0.2, z, 3.4, 0.4, 3.4, 0, Math.PI / 8, 0, shade(col, 0.95));
    b.add(G.cyl8, VC.glow, x, h * 0.8 + 0.7, z, 3.3, 0.18, 3.3, 0, Math.PI / 8, 0, hdr(light, 2.4));   // the balcony's ring of light
    b.add(G.cyl8, VC.solid, x, h * 0.8 + 2.2, z, 1.8, 3.0, 1.8, 0, Math.PI / 8, 0, col);
    b.add(G.cyl8, VC.glow, x, h * 0.8 + 2.2, z, 1.84, 1.2, 1.84, 0, Math.PI / 8, 0, hdr('#ffd9a0', 1.6));
    b.add(HALF, VC.solid, x, h * 0.8 + 3.7, z, 2.0, 2.4, 2.0, 0, 0, 0, col);
    b.cyl(VC.metal, '#d8b048', x, h * 0.8 + 6.6, z, 0.06, 1.4, 'cyl6'); b.add(G.tor, VC.metal, x, h * 0.8 + 7.5, z, 0.6, 0.6, 0.9, 0, Math.PI / 2, 0, '#d8b048');
    return h * 0.8 + 8;
  };
  K.mosque = (b, s, x, z, { w = 16, d = 14, dome = 5.5, h = 26, col = pick(['#f2ead8', '#f4f0e6', '#e8dcc4']) } = {}) => {
    b.block(VC.solid, col, x, 0, z, d, 7, w);
    b.box(VC.solid, shade(col, 0.95), x, 7.2, z, d + 0.3, 0.4, w + 0.3);
    for (let u = -w / 2 + 1.5; u < w / 2 - 1; u += 2.4) { b.box(VC.glow, hdr('#ffd9a0', 1.5), x - s * (d / 2 + 0.03), 3.6, z + u, 0.06, 3, 1.1); b.add(G.cyl, VC.glow, x - s * (d / 2 + 0.04), 5.1, z + u, 1.1, 0.06, 1.1, 0, 0, Math.PI / 2, hdr('#ffd9a0', 1.5)); }
    b.add(G.cyl8, VC.solid, x, 8.4, z, dome * 1.9, 2.4, dome * 1.9, 0, Math.PI / 8, 0, col);
    b.add(HALF, VC.solid, x, 9.6, z, dome * 2, dome * 1.9, dome * 2, 0, 0, 0, shade(col, 1.03));
    b.cyl(VC.metal, '#d8b048', x, 9.6 + dome * 0.95 + 0.8, z, 0.08, 1.6, 'cyl6'); b.add(G.tor, VC.metal, x, 9.6 + dome * 0.95 + 1.8, z, 0.7, 0.7, 1, 0, Math.PI / 2, 0, '#d8b048');
    K.minaret(b, x + s * (d / 2 - 1.5), z + w / 2 + 1.2, h, { col });
    K.pool(b, x - s * (d / 2 + 2), z, 4, w, hdr('#ffd9a0', 0.3));
  };
  // ---------- the Metro ----------
  // its viaduct on T-shaped piers by the road, the deck 11 m up; now and then the golden shell of a station on it, its
  // ribs curving over the platforms, the stairs down to the street, the skywalk across to the other side
  K.viaduct = (b, x, z0, z1, { y = 11 } = {}) => {
    b.box(VC.solid, '#d8d4cc', x, y, -(z0 + z1) / 2, 9, 1.4, z1 - z0);
    b.box(VC.solid, '#c8c4bc', x, y + 0.85, -(z0 + z1) / 2, 9.4, 0.3, z1 - z0);
    for (const e of [-1, 1]) b.box(VC.solid, '#e8e4dc', x + e * 4.5, y + 1.4, -(z0 + z1) / 2, 0.3, 1.0, z1 - z0);
    for (let z = z0 + 6; z < z1; z += 28) { b.block(VC.solid, '#d0ccc4', x, 0, -z, 2.2, y - 1.6, 2.2); b.add(taperGeo(2.6, 4), VC.solid, x, y - 1.2, -z, 3.2, 1.6, 2.4, 0, Math.PI / 4, 0, '#d0ccc4'); }
  };
  K.station = (b, x, zc, s, { y = 11, L = 64 } = {}) => {   // the shell: gold ribs over the platforms, glazed between, the name on it
    const R = 7.6;
    for (let u = -L / 2; u <= L / 2; u += 2.4) {
      const k = 1 - Math.pow((2 * u) / L, 2) * 0.35;
      b.add(RIB, VC.metal, x, y + 1.3, zc + u, R * k, R * 1.15 * k, 1, 0, 0, 0, '#a88a4a');
    }
    const shell = new THREE.CylinderGeometry(R * 0.98, R * 0.98, L, 18, 1, true, -Math.PI / 2, Math.PI);
    shell.rotateX(-Math.PI / 2);   // its axis along the track, the half arching up
    b.addM(shell, VC.glow, new THREE.Matrix4().makeScale(1, 1.15, 1).setPosition(x, y + 1.3, zc), hdr('#ffe2b0', 0.55));
    b.box(VC.solid, '#e8e4dc', x, y + 1.6, zc, 12, 0.4, L);
    const [ar, en] = STATIONS[randi(0, STATIONS.length - 1)];
    K.bi(b, ar, en, { w: 768, h: 192, color: '#ffffff', bg: '#c8202a' }, x - s * (R + 0.3), y + 4.5, zc, 6, 1.5, 1, 0, face(s), 0);
    b.block(VC.solid, '#d8d4cc', x - s * 2, 0, zc + L / 2 - 6, 5, y, 6);   // the stair tower down to the street
    b.box(VC.glow, hdr('#ffe8c0', 1.2), x - s * 4.55, y / 2, zc + L / 2 - 6, 0.06, y - 2, 4.6);
  };
  // a train standing on the viaduct (blue and silver, the gold-class car at the front)
  K.metroTrain = (b, x, z0, z1, { y = 12.6 } = {}) => {
    const n = Math.max(1, Math.floor((z1 - z0) / 17));
    for (let i = 0; i < n; i++) {
      const zc = -(z0 + 8.5 + i * 17);
      b.box(VC.metal, '#c8ccd2', x, y + 1.6, zc, 2.9, 3.2, 16.4);
      b.box(VC.solid, '#1a3a8a', x, y + 0.6, zc, 2.94, 0.5, 16.4);
      for (const e of [-1, 1]) b.box(VC.glow, hdr('#e8f0ff', 1.1), x + e * 1.46, y + 2.1, zc, 0.04, 0.9, 15.6);
      if (i === 0) b.box(VC.solid, '#c8a050', x, y + 2.9, zc, 2.95, 0.12, 16.4);
    }
  };
  // a skywalk across the track and the road, glazed, air-conditioned, lit: its soffit 14 m up (the jetpack passes under)
  K.skywalk = (b, z, { y = 14.4, x0 = -26, x1 = 26 } = {}) => {
    const L = x1 - x0, xc = (x0 + x1) / 2;
    b.box(VC.solid, '#d8dcdc', xc, y + 0.2, z, L, 0.4, 3.6);
    b.box(VC.glow, hdr('#d8ecf4', 0.75), xc, y + 1.7, z, L, 2.6, 3.4);
    b.box(VC.solid, '#c8ccd0', xc, y + 3.1, z, L + 0.2, 0.3, 3.8);
    for (let x = x0; x <= x1; x += 2.6) b.box(VC.metal, '#b8bcc0', x, y + 1.7, z, 0.08, 2.7, 3.5);
    for (const x of [x0, x1]) b.block(VC.solid, '#d8d4cc', x, 0, z, 2.4, y, 3.6);
    b.box(VC.glow, hdr('#bfe6ff', 2.4), xc, y - 0.04, z, L, 0.06, 0.2);
  };
  // ---------- the highway ----------
  // the carriageway beside the track: lanes of traffic (red tail lights going away on the right, white headlights coming on
  // the left), the light they make strung along each lane, the concrete barrier by the track
  K.highway = (b, s, z0, z1, { lanes = 4, gaps = [] } = {}) => {
    const lw = 3.6, x0 = EDGE + 0.9, W = lanes * lw;
    K.road(b, s * (x0 + W / 2), -(z0 + z1) / 2, W + 0.6, z1 - z0);
    b.block(VC.solid, '#c8c4bc', s * (EDGE + 0.45), 0, -(z0 + z1) / 2, 0.5, 0.9, z1 - z0);   // the barrier
    for (let i = 1; i < lanes; i++) for (let z = z0 + 1; z < z1; z += 9) b.box(VC.solid, '#e8e4d8', s * (x0 + i * lw), 0.045, -z, 0.15, 0.02, 4.5);
    b.box(VC.solid, '#f2c230', s * (x0 + 0.2), 0.045, -(z0 + z1) / 2, 0.15, 0.02, z1 - z0);
    const dir = s > 0 ? 1 : -1;
    for (let i = 0; i < lanes; i++) {
      const x = s * (x0 + (i + 0.5) * lw);
      K.jam(b, x, z0, z1, dir, { fill: rand(0.45, 0.75), gaps });
      b.box(VC.glowAdd, hdr(dir > 0 ? '#ff3a2a' : '#fff0d8', 0.32), x, 0.6, -(z0 + z1) / 2, 0.9, 0.05, z1 - z0);   // the streak of lamps down the lane
    }
    b.block(VC.solid, '#c8c4bc', s * (x0 + W + 0.4), 0, -(z0 + z1) / 2, 0.5, 0.9, z1 - z0);
    return x0 + W + 0.8;
  };
  // ---------- the water ----------
  // the creek: the wharf's edge at x, the water out to the far bank's wharves, abras moored and crossing, dhows at the far
  // wharf with their cargo, Deira's lights and minarets beyond, their streaks of reflection
  K.farBank = (b, s, x0, w = 90, col = '#2a2622') => b.box(VC.solid, col, s * (x0 + w / 2), -0.15, -CHUNK_LEN / 2, w, 0.3, CHUNK_LEN);   // the ground across the water
  K.waterPlane = (b, x0, x1, z0, z1, y = WY) => b.add(G.plane, K.water, (x0 + x1) / 2, y, -(z0 + z1) / 2, Math.abs(x1 - x0), z1 - z0, 1, -Math.PI / 2, 0, 0);
  K.refl = (b, x, z, col, len = 30, s = 1) => b.add(G.plane, VC.glowAdd, x - s * len / 2, WY + 0.04, z, len, rand(0.4, 1.0), 1, -Math.PI / 2, 0, 0, hdr(col, 0.5));
  K.wharf = (b, s, x, z0, z1, { wood = false } = {}) => {
    b.block(VC.solid, wood ? '#6a4a2a' : '#b8ac98', s * (x + 0.6), WY - 0.5, -(z0 + z1) / 2, 1.2, 1.5, z1 - z0);
    for (let z = z0 + 2; z < z1; z += 6) { b.cyl(VC.solid, '#2a2a2e', s * (x + 0.3), 0.25, -z, 0.16, 0.5, 'cyl8'); }   // the bollards
    for (let z = z0 + 1; z < z1; z += 2.5) b.box(VC.metal, '#8a8e94', s * (x + 0.05), 0.55, -z, 0.06, 1.1, 0.06);
    b.box(VC.metal, '#8a8e94', s * (x + 0.05), 1.08, -(z0 + z1) / 2, 0.06, 0.06, z1 - z0);
  };
  K.farShore = (b, s, x, { minarets = true, dhows = true } = {}) => {   // the other bank: its wharf, dhows, buildings and their lights
    if (dhows) for (let z = rand(4, 12); z < CHUNK_LEN - 8; z += rand(20, 28)) K.dhow(b, s * (x - 4), WY + 0.2, -z, { ry: (chance(0.5) ? 0 : Math.PI) + rand(-0.05, 0.05) });
    b.block(VC.solid, '#5a5048', s * (x + 6), WY - 1, -CHUNK_LEN / 2, 12, 2.4, CHUNK_LEN);
    K.farBank(b, s, x + 12, 70, '#24201c');
    for (let z = 0; z < CHUNK_LEN - 4;) {
      const L = rand(8, 16), h = rand(8, 30), dd = rand(10, 16);
      b.addM(buildingGeo(dd, h, L, K.deira, 1.85, 3.1), K.deiraMat, at(s * (x + 12 + dd / 2), 0, -(z + L / 2)), pick(['#e8dcc8', '#d8ccb4', '#f0e4d0']));
      if (chance(0.5)) K.refl(b, s * (x + 10), -(z + L / 2), pick(WARM), x - EDGE - 6, s);
      z += L + rand(0.5, 3);
    }
    if (minarets && chance(0.7)) K.minaret(b, s * (x + 22), -rand(20, 60), rand(22, 32));
  };
  // the Marina: pontoons along the water, yachts at their berths, a dinner dhow
  K.marinaWater = (b, s, x0, x1) => {
    K.waterPlane(b, s * x0, s * x1, 0, CHUNK_LEN);
    for (let z = rand(4, 10); z < CHUNK_LEN - 6; z += rand(10, 16)) {
      b.box(VC.solid, '#c8b8a0', s * (x0 + 6), WY + 0.4, -z, 12, 0.3, 1.6);   // a finger pontoon
      if (chance(0.75)) K.yacht(b, s * (x0 + 6), WY, -z - rand(4, 5), { ry: s > 0 ? Math.PI / 2 : -Math.PI / 2, L: rand(14, 24) });
    }
    if (chance(0.6)) K.cruise(b, s * ((x0 + x1) / 2 + 6), WY, -rand(20, 60), { ry: rand(-0.2, 0.2) });
  };
  // the beach: sand falling from the walk to the waterline, the Gulf beyond (la_sea.js's shader, Dubai's colours), always on
  // the left; the rubber running track, palm-frond parasols, sunbeds, a lifeguard tower, kites over the water
  K.beach = (b, z0 = 0, z1 = CHUNK_LEN, { xs = EDGE + 22 } = {}) => {
    const s = -1, slope = new THREE.BufferGeometry(), P = [], UV = [];
    for (const [x, y, u] of [[EDGE + 7, 0, 0], [xs - 6, -0.35, 2], [xs, SEA - 0.05, 3], [xs + 5, SEA - 0.9, 4]]) for (const z of [z0, z1]) { P.push(-x, y, -z); UV.push(x / 7, z / 7); }
    const idx = []; for (let i = 0; i < 3; i++) { const a = i * 2, c = a + 2; idx.push(a, a + 1, c, c, a + 1, c + 1); }
    slope.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); slope.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); slope.setIndex(idx); slope.computeVertexNormals();
    b.addM(slope, K.sandMat, _m.identity(), '#f2dcb8');
    b.addM(seaGeo(() => -xs, z0, z1, 0, { D: [-1, 0, 2, 5, 9, 14, 20, 28, 40, 60, 90, 140, 220, 340, 520] }), K.seaMat, _m.identity(), null);
    b.box(VC.solid, '#3a6ab8', s * (EDGE + 5.2), 0.03, -(z0 + z1) / 2, 1.6, 0.04, z1 - z0);   // the running track, rubber
    b.box(VC.solid, '#c84a3a', s * (EDGE + 6.2), 0.03, -(z0 + z1) / 2, 0.4, 0.04, z1 - z0);
    for (let z = z0 + rand(3, 8); z < z1 - 2; z += rand(7, 11)) {   // parasols of palm fronds, sunbeds under them
      const x = s * rand(EDGE + 10, xs - 7), y = -0.15;
      b.cyl(VC.solid, '#7a5a3a', x, y + 1.3, -z, 0.06, 2.6, 'cyl6'); b.add(G.cone8, VC.solid, x, y + 2.7, -z, 3.0, 0.9, 3.0, 0, 0, 0, '#a8905a');
      for (const e of [-1, 1]) b.add(G.box, VC.solid, x + e * 0.9, y + 0.35, -z, 0.7, 0.1, 1.9, 0.12, 0, 0, '#f4f4f0');
      if (chance(0.4)) K.walker(b, x + 1.6, -z + rand(-1, 1), { kind: 'tourist', y: y - 0.05 });
    }
    if (chance(0.5)) {   // the lifeguard's tower on its stilts, the flags
      const x = s * (xs - 9), z = -rand(20, 60);
      for (const [ex, ez] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.box(VC.solid, '#e8e4dc', x + ex * 0.9, 1.4, z + ez * 0.9, 0.15, 2.8, 0.15);
      b.block(VC.solid, '#d8202a', x, 2.8, z, 2.4, 1.8, 2.4); b.box(VC.solid, '#f4f0e8', x, 4.75, z, 2.8, 0.15, 2.8);
      b.cyl(VC.metal, '#c8c8c8', x + 1.2, 5.6, z, 0.03, 2, 'cyl6'); b.add(G.plane, VC.solid, x + 1.2, 6.2, z - 0.4, 0.8, 0.5, 1, 0, Math.PI / 2, 0, '#ffd23d');
    }
    for (let k = randi(0, 2); k > 0; k--) K.jetski(b, s * rand(xs + 20, xs + 80), SEA, -rand(10, 70));
    for (let k = randi(1, 2); k > 0; k--) {   // a kitesurfer's kite, its curve high over the sea
      const x = s * rand(xs + 30, xs + 120), z = -rand(10, 70), col = pick(['#ff3d7f', '#ffd23d', '#39d8ff', '#7aff5a']);
      b.add(new THREE.TorusGeometry(4, 0.6, 3, 12, Math.PI), VC.solid, x, 18 + rand(0, 6), z, 1, 0.5, 1, 0.4, rand(0, 3), 0, col);
    }
  };
  // ---------- the desert ----------
  // dunes rising and falling either side, their ridges sharp on the windward side; camels, the warning sign, 4x4s
  // climbing, quad bikes, ghafs, a fence, the power line marching across
  K.dunes = (b, s, z0 = 0, z1 = CHUNK_LEN, { x0 = EDGE + 3, x1 = 140, seed = rand(0, 100) } = {}) => {
    const NX = 18, NZ = 10, P = [], UV = [], C = [], idx = [], c0 = new THREE.Color('#ffd2a4'), c1 = new THREE.Color('#d0905e');
    const hAt = (x, z) => { const t = (x - x0) / (x1 - x0), r = Math.max(0, Math.sin(x * 0.07 + seed) * Math.cos(z * 0.045 + seed * 0.7)); return Math.min(1, t * 2.5) * (5 + t * 22) * (0.45 + 0.55 * Math.pow(r, 0.7)) + Math.sin(z * 0.11 + x * 0.05) * 0.6; };
    for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) {
      const x = x0 + (x1 - x0) * Math.pow(i / NX, 1.4), z = z0 + ((z1 - z0) * j) / NZ, h = i === 0 ? 0 : hAt(x, z);
      P.push(s * x, h, -z); UV.push(x / 9, z / 9); const c = c0.clone().lerp(c1, Math.min(1, Math.max(0, (hAt(x + 2, z) - h) * 0.4 + 0.3))); C.push(c.r, c.g, c.b);
    }
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const a = i * (NZ + 1) + j, c = a + NZ + 1; s > 0 ? idx.push(a, c, a + 1, a + 1, c, c + 1) : idx.push(a, a + 1, c, a + 1, c + 1, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(idx); g.computeVertexNormals();
    b.addM(g, K.sandMat, _m.identity(), null);
    return hAt;
  };
  return K;
}
