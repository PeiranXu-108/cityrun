// The run along the beach from Venice to Santa Monica: seven chunks in a row on the loop (la.js ZONES). Between the
// Venice canals and their footbridges; down Windward Avenue, under the VENICE sign hung across it, out onto the beach (a
// landmark); the boardwalk; Muscle Beach, the courts and the skate park; the open sand with its towers, nets and fires;
// under the Santa Monica Pier among its pilings (a landmark), the Ferris wheel and the coaster lit up over you; along the
// foot of the Palisades' bluffs, the hill coming down to the sea ahead. The sea is on the left all the way, the sun
// going down into it, the surf rolling in.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, planeUV, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { EDGE, waterNormal } from './common.js';
import { beam } from './tokyo_kit.js';
import { frame, thinFog } from './ny_icons.js';
import { mirrorInto, mergeInto, clearWater } from './beijing_sights.js';
import { SANS, BLADE, DECO, BEACH_SIGNS, BOARDS, PASTEL, STUCCO, X0, GI, face } from './la_kit.js';

const ARCH = new THREE.TorusGeometry(0.5, 0.08, 6, 12, Math.PI);   // a half ring: an arch springing from y = 0, in the xy plane

export const STRETCH = { first: 19, len: 7 };
const SEA = -2.4, SHORE = -97, WALL = -11;   // the sea's level, the water's edge, the low wall between the walk and the sand

function sandTex() {   // dry sand: fine grain, a few ripples, footprints
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#d8bc96'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { const v = randi(-18, 14); g.fillStyle = `rgba(${216 + v},${188 + v},${150 + v},0.8)`; g.fillRect(rand(0, w), rand(0, h), rand(1, 2), rand(1, 2)); }
    g.strokeStyle = 'rgba(150,120,90,0.18)'; g.lineWidth = 2;
    for (let i = 0; i < 14; i++) { g.beginPath(); const y = rand(0, h); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 4); g.stroke(); }
    g.fillStyle = 'rgba(140,110,80,0.22)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(rand(0, w), rand(0, h), 3, 5, rand(0, 3), 0, Math.PI * 2); g.fill(); }
  });
}
function foamTex() {   // the broken water: lines of foam along the shore, thick and thin, a scatter of bubbles (repeats both ways)
  return canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let k = 0; k < 7; k++) {
      const x0 = rand(0, w), amp = rand(3, 9), th = rand(2, 9), ph = rand(0, 6.28), a = rand(0.35, 0.8);
      for (let y = 0; y < h; y += 2) { const x = x0 + Math.sin((y / h) * Math.PI * 2 * randi(1, 2) + ph) * amp; g.fillStyle = `rgba(255,255,255,${a * rand(0.6, 1)})`; g.fillRect(((x % w) + w) % w, y, th * rand(0.6, 1.2), 2); }
    }
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${rand(0.2, 0.6)})`; g.fillRect(rand(0, w), rand(0, h), rand(1, 3), rand(1, 3)); }
  });
}
function plankTex() {   // the pier's and the boardwalk's planks, weathered grey-brown
  return canvasTex(128, 128, (g, w, h) => {
    for (let y = 0; y < h; y += 8) { const v = randi(-16, 16); g.fillStyle = `rgb(${140 + v},${118 + v},${96 + v})`; g.fillRect(0, y, w, 7); g.fillStyle = '#4a3a2c'; g.fillRect(0, y + 7, w, 1); }
    for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(60,44,30,0.25)'; g.fillRect(rand(0, w), rand(0, h), rand(4, 20), 1); }
  });
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
// the sea from the water's edge out to the haze: violet close in, pink where it holds the sky, peach far out
const SEA_STOPS = [[-1500, '#f2ac90'], [-900, '#e8909a'], [-480, '#a85a8a'], [-220, '#5a3e78'], [SHORE - 4, '#3e3266']];

export function makeBeach(K) {
  const st = sandTex(), sandMat = std({ map: st, roughness: 0.95 });
  const wetMat = std({ color: '#7a5a52', roughness: 0.2, metalness: 0.35 });
  const ft = foamTex(), ft2 = ft.clone(); ft2.needsUpdate = true;
  const foam = [ft, ft2].map((t, i) => basic({ map: t, color: hdr('#fff0ea', i ? 0.75 : 0.95), transparent: true, depthWrite: false }));
  const wn = waterNormal(); wn.repeat.set(8, 8);
  const seaMat = thinFog(std({ vertexColors: true, metalness: 0.7, roughness: 0.14, normalMap: wn, normalScale: new THREE.Vector2(0.55, 0.55), envMapIntensity: 0.7 }), 0.55);
  const pt = plankTex(), plankMat = std({ map: pt, vertexColors: true, roughness: 0.85 });
  const canalMat = clearWater('#1a2a4a', 4, 0.55);
  const cliff = '#c8a078', cliff2 = '#b08a64';

  // ---------- the beach ----------
  // the low wall at the walk's edge, the sand sloping down to the wet sand at the water, the surf, the sea
  const beach = (b, z0 = 0, z1 = -CHUNK_LEN, { wall = true } = {}) => {
    if (wall) { b.box(VC.solid, '#c8bcae', WALL, 0.2, (z0 + z1) / 2, 0.45, 0.5, z0 - z1); b.box(VC.solid, '#d8ccbe', WALL, 0.47, (z0 + z1) / 2, 0.55, 0.06, z0 - z1); }
    quad(b, sandMat, SHORE, -1.95, WALL + 0.2, -0.04, z0, z1, { ku: 7, kv: 7 });
    quad(b, wetMat, SHORE - 9, SEA + 0.08, SHORE, -1.95, z0, z1, { col: '#ffffff' });
    for (let i = 0; i < SEA_STOPS.length - 1; i++) quad(b, seaMat, SEA_STOPS[i][0], SEA, SEA_STOPS[i + 1][0], SEA, z0, z1, { ku: 22, kv: 22, c0: SEA_STOPS[i][1], c1: SEA_STOPS[i + 1][1] });
    quad(b, foam[0], SHORE - 44, SEA + 0.05, SHORE - 4, SEA + 0.05, z0, z1, { ku: 40, kv: CHUNK_LEN });
    quad(b, foam[1], SHORE - 70, SEA + 0.03, SHORE - 20, SEA + 0.03, z0, z1, { ku: 50, kv: CHUNK_LEN });
  };
  // an LA County lifeguard tower: the hut up on its legs, the deck and the ramp down to the sand, its number
  const tower = (b, x, z, { col = pick(['#8ac8e8', '#8ac8e8', '#f4f0e8', '#ffd23d']), rainbow = chance(0.15) } = {}) => {
    const y = -0.04 + ((x - WALL) / (SHORE - WALL)) * -1.9;
    for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) b.box(VC.solid, '#d8d4cc', x + dx, y + 1.0, z + dz, 0.22, 2.0, 0.22);
    b.box(VC.solid, '#e8e4dc', x, y + 2.05, z, 3.6, 0.15, 3.6);
    if (rainbow) ['#e8302a', '#ff8a2a', '#ffd23d', '#3aa84a', '#2a6ad8', '#7a3ab4'].forEach((c, k) => b.box(VC.solid, c, x + 0.4, y + 2.35 + k * 0.42, z, 2.8, 0.42, 2.8));
    else b.box(VC.solid, col, x + 0.4, y + 3.35, z, 2.8, 2.5, 2.8);
    b.box(VC.glow, hdr('#3a4a6a', 0.9), x - 1.02, y + 3.6, z, 0.04, 1.0, 2.2);   // the window to the sea
    b.box(VC.solid, '#f4f0e8', x + 0.4, y + 4.7, z, 3.2, 0.2, 3.2);
    b.box(VC.solid, '#f4f0e8', x - 1.1, y + 2.6, z, 0.06, 0.9, 3.4);   // the deck's rail
    b.add(G.box, VC.solid, x + 2.8, y + 1.0, z, 3.4, 0.12, 1.1, 0, 0, 0.55, '#d8d4cc');   // the ramp
    K.sign(b, String(randi(12, 29)), { w: 128, h: 96, color: '#1a2a5a', font: SANS, weight: 700, size: 0.7, k: 1.0 }, x + 0.4, y + 3.9, z + 1.42, 0.9, 0.7, 1);
  };
  const sandY = (x) => (x > WALL ? 0 : -0.04 + ((x - WALL) / (SHORE - WALL)) * -1.9);
  const sunbather = (b, x, z) => {   // a towel, someone on it facing the sea, an umbrella over some
    const y = sandY(x);
    b.box(VC.solid, pick(['#e8302a', '#ffd23d', '#39c8e8', '#ff7ab8', '#f4f0e8', '#7cd84a']), x, y + 0.03, z, 1.0, 0.04, 1.9);
    K.person(b, x, z, { seated: true, beach: true, y: y - 0.35, ry: Math.PI / 2, shades: true });
    if (chance(0.45)) { b.cyl(VC.metal, '#d8d8d8', x + 0.6, y + 1.2, z + 0.5, 0.03, 2.4, 'cyl6'); b.add(G.cone8, VC.solid, x + 0.6, y + 2.45, z + 0.5, 2.4, 0.55, 2.4, 0, 0, 0, pick(['#e8302a', '#ffd23d', '#2a6ad8', '#ff7ab8', '#3ab4a0'])); }
  };
  const volleyball = (b, x, z) => {   // the net between its posts, the players on the sand
    const y = sandY(x);
    for (const e of [-1, 1]) b.cyl(VC.metal, '#e8e4dc', x, y + 1.3, z + e * 4.5, 0.06, 2.6, 'cyl6');
    b.box(VC.solid, '#1a1a1e', x, y + 2.3, z, 0.03, 0.9, 9); b.box(VC.solid, '#f4f0e8', x, y + 2.76, z, 0.05, 0.07, 9);
    for (const e of [-1, 1]) for (let k = 0; k < 2; k++) K.person(b, x + e * rand(2, 4), z + rand(-3, 3), { beach: true, y, ry: e > 0 ? Math.PI / 2 : -Math.PI / 2, shades: false });
    b.sph(VC.solid, '#f4f0e8', x + rand(-1, 1), y + rand(3.2, 4.5), z + rand(-2, 2), 0.14, true);
  };
  const bonfire = (b, x, z) => {   // a fire ring on the sand at sundown: the concrete ring, the flames, people round it
    const y = sandY(x);
    b.add(G.tor, VC.solid, x, y + 0.25, z, 2.6, 2.6, 2.6, Math.PI / 2, 0, 0, '#a8a29a');
    b.add(G.cone8, VC.glow, x, y + 0.65, z, 0.9, 1.1, 0.9, 0, 0, 0, hdr('#ff7a2a', 3.2));
    b.add(G.cone8, VC.glow, x, y + 0.55, z, 0.5, 0.8, 0.5, 0, 0, 0, hdr('#ffd25a', 4.0));
    K.pool(b, x, z, 9, 9, hdr('#ff9a4a', 0.35), y + 0.08);
    K.smokeBuf.push([x, y + 1.2, z]);
    for (let k = 0; k < 6; k++) { if (chance(0.25)) continue; const a = (k / 6) * Math.PI * 2; K.person(b, x + Math.cos(a) * 2.1, z + Math.sin(a) * 2.1, { seated: true, y: y - 0.25, ry: -a - Math.PI / 2, beach: chance(0.5), shades: false }); }
  };
  const surfer = (b, x, z, { up = chance(0.25) } = {}) => {   // out on the water, sitting on the board waiting for a wave (or up and riding one)
    b.add(G.sphLow, VC.solid, x, SEA + 0.08, z, 0.6, 0.1, 2.3, 0, rand(-0.4, 0.4), 0, pick(BOARDS));
    K.person(b, x, z, up ? { y: SEA + 0.12, beach: true, ry: Math.PI / 2 + rand(-0.4, 0.4), shades: false } : { seated: true, y: SEA - 0.4, beach: true, ry: rand(0, 6), shades: false });
  };
  const sandLife = (b, z0, z1, { towers = 1, nets = 0, fires = 0, towels = 6, surf = 3 } = {}) => {   // what's on the sand between z0 and z1 (distances, positive)
    for (let k = 0; k < towers; k++) tower(b, rand(-48, -64), -rand(z0 + 6, z1 - 6));
    for (let k = 0; k < nets; k++) volleyball(b, rand(-30, -42), -rand(z0 + 8, z1 - 8));
    for (let k = 0; k < fires; k++) bonfire(b, rand(-24, -38), -rand(z0 + 5, z1 - 5));
    for (let k = 0; k < towels; k++) sunbather(b, rand(-20, -82), -rand(z0 + 2, z1 - 2));
    for (let k = randi(2, 4); k > 0; k--) { const x = rand(-16, -90); K.person(b, x, -rand(z0 + 2, z1 - 2), { beach: true, y: sandY(x), surf: chance(0.4) }); }
    for (let k = 0; k < surf; k++) surfer(b, rand(SHORE - 18, SHORE - 60), -rand(z0, z1));
    for (let k = randi(1, 3); k > 0; k--) K.person(b, rand(SHORE - 2, SHORE + 6), -rand(z0, z1), { beach: true, y: sandY(SHORE + 2) - 0.05, ry: chance(0.5) ? 0 : Math.PI });   // walking along the water
  };
  // the walk: people, skaters, roller skaters and cyclists up and down beside the track
  const walkLife = (b, n = 10) => {
    for (const s of [-1, 1]) {
      K.throng(b, s * 4.6, s * 10.2, 2, CHUNK_LEN - 2, n, [], { shorts: true });
      for (let k = randi(1, 3); k > 0; k--) K.skater(b, s * rand(5, 9.5), -rand(4, 76));
      for (let k = randi(1, 2); k > 0; k--) K.person(b, s * rand(5, 9.5), -rand(4, 76), { skates: true, shorts: true, ry: chance(0.5) ? 0 : Math.PI });
      for (let k = randi(1, 2); k > 0; k--) K.cyclist(b, s * rand(5.5, 9), -rand(4, 76), chance(0.5) ? 0 : Math.PI);
    }
  };
  // a row of beach-town buildings on the right, their shops under them (the boardwalk's landward side)
  const shops = (b, z0, z1) => {
    const lots = K.shopRow(b, 1, z0, z1, { x0: X0, signs: BEACH_SIGNS, floors: [2, 3], styles: ['stucco', 'stucco', 'deco', 'mission'], colors: [...PASTEL, ...STUCCO, '#ff8a5a', '#39b8b0', '#f2c230'], blade: 0.2 });
    for (const [a, c] of lots) {
      if (chance(0.35)) K.mural(b, X0 + 0.02, rand(5.8, 7.2), -(a + c) / 2, 1, c - a - 1, 2.6);
      if (chance(0.4)) K.surfRack(b, 10.6, -(a + c) / 2, 1);
    }
    for (let z = z0 + rand(2, 6); z < z1 - 3; z += rand(9, 14)) if (chance(0.6)) K.cart(b, 9.6, -z, 1, pick(['SUNGLASSES', 'HENNA', 'T-SHIRTS', 'LEMONADE', 'CHURROS']));
  };
  // a palm row in a strip of grass at the walk's sea edge, the vendors' tables
  const seaEdge = (b, z0 = 0, z1 = CHUNK_LEN) => {
    for (let z = z0 + rand(3, 8); z < z1 - 2; z += rand(13, 17)) K.fanPalm(b, -12.4, -z, rand(1.0, 1.2), { y: -0.2 });
    for (let z = z0 + rand(4, 10); z < z1 - 3; z += rand(12, 18)) if (chance(0.6)) {   // a vendor's table under a parasol
      b.box(VC.solid, '#e8e4dc', -9.6, 0.75, -z, 0.8, 0.06, 1.8); b.box(VC.solid, pick(['#ff5aa0', '#39c8e8', '#ffd23d', '#7cd84a']), -9.6, 0.79, -z, 0.7, 0.04, 1.6);
      b.cyl(VC.metal, '#c8c8c8', -9.9, 1.3, -z, 0.025, 2.6, 'cyl6'); b.add(G.cone8, VC.solid, -9.9, 2.6, -z, 2.0, 0.45, 2.0, 0, 0, 0, pick(['#e8302a', '#ffd23d', '#2a6ad8', '#3ab4a0']));
      K.person(b, -10.4, -z + 0.4, { seated: true, ry: -Math.PI / 2 });
    }
  };

  // ---------- the bluffs ----------
  // the Palisades: a sandstone cliff from the road up to the park on top; x0: its foot, h: its height
  const bluffs = new Map();
  const bluffGeo = (h) => {
    if (bluffs.has(h)) return bluffs.get(h);
    const sh = new THREE.Shape(); sh.moveTo(0, -1); sh.lineTo(3, h * 0.25); sh.lineTo(5.5, h * 0.55); sh.lineTo(8, h * 0.8); sh.lineTo(10, h); sh.lineTo(120, h); sh.lineTo(120, -1); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: CHUNK_LEN, bevelEnabled: false }); g.translate(0, 0, -CHUNK_LEN);
    bluffs.set(h, g); return g;
  };
  const bluff = (b, x0, h, { park = true } = {}) => {
    b.addM(bluffGeo(h), VC.solid, new THREE.Matrix4().makeTranslation(x0, 0, 0), cliff);
    for (let z = rand(2, 8); z < CHUNK_LEN; z += rand(6, 10)) b.add(G.sphLow, VC.solid, x0 + rand(1.5, 8), rand(1, h * 0.8), -z, rand(2, 4), rand(1.2, 2.5), rand(2, 4), 0, 0, 0, pick(['#5a7a3a', '#6a8a42', '#7a6a3a', cliff2]));   // ice plant and scrub on its face
    if (!park) return;
    K.lawn(b, x0 + 30, -CHUNK_LEN / 2, 40, CHUNK_LEN, '#4a6a34', h + 0.03);
    for (let z = rand(2, 8); z < CHUNK_LEN; z += rand(9, 13)) (chance(0.7) ? K.fanPalm : K.palm)(b, x0 + 12.5, -z, rand(1.0, 1.25), { y: h });
    for (let z = rand(10, 20); z < CHUNK_LEN; z += rand(24, 30)) K.lamp(b, x0 + 14, -z, -1, { kind: 'twin', h: 4.4 });
    b.box(VC.metal, '#3a3a3e', x0 + 10.6, h + 0.55, -CHUNK_LEN / 2, 0.06, 0.06, CHUNK_LEN);   // the park's rail along the edge
    for (let z = 1; z < CHUNK_LEN; z += 2.5) b.box(VC.metal, '#3a3a3e', x0 + 10.6, h + 0.28, -z, 0.05, 0.56, 0.05);
    K.crowd(b, x0 + 11.5, x0 + 16, 2, CHUNK_LEN - 2, randi(4, 8), { y: h, ry: -Math.PI / 2 + rand(-0.4, 0.4), camera: chance(0.3) });
    for (let z = rand(0, 8); z < CHUNK_LEN - 10;) {   // Ocean Avenue's hotels and flats behind the park, their windows lit
      const L = rand(14, 24), H = rand(14, 40), col = pick([...STUCCO, '#e8e0f0', '#f4e0d0']);
      b.addM(K.tiledBox(14, H, L, 2.5), K.stuccoMat, new THREE.Matrix4().makeTranslation(x0 + 44, h + H / 2, -(z + L / 2)), col);
      for (let y = h + 2; y < h + H - 1.5; y += 3.2) for (let zz = z + 1.5; zz < z + L - 1.2; zz += 2.4) b.box(VC.glow, K.glass(0.5, false), x0 + 36.98, y, -zz, 0.04, 1.4, 1.4);
      z += L + rand(2, 6);
    }
  };
  // the coast road at the bluffs' foot: two lanes each way, the traffic lit
  const pch = (b, x0, x1) => {
    K.road(b, (x0 + x1) / 2, -CHUNK_LEN / 2, x1 - x0, CHUNK_LEN, 0.03);
    for (let z = 2; z < CHUNK_LEN; z += 6) b.box(VC.solid, '#e8e4dc', (x0 + x1) / 2, 0.04, -z, 0.12, 0.01, 3);
    b.box(VC.solid, '#c8c0b4', x0, 0.1, -CHUNK_LEN / 2, 0.3, 0.2, CHUNK_LEN);
    for (const [x, dir] of [[x0 + 2, 1], [x0 + 5.2, 1], [x1 - 5.2, -1], [x1 - 2, -1]]) for (let z = rand(2, 9); z < CHUNK_LEN - 3; z += rand(8, 14)) K.car(b, x, -z, dir, { lit: true });
  };

  // ---------- the chunks ----------
  // the Venice canals: a canal either side of the walk, the bridges arching over them to the houses on the far banks,
  // their gardens down to the water, boats at the docks, the palms; all of it in the still water
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
          r.addM(K.tiledBox(10, H, w - 1, 2.5), K.stuccoMat, new THREE.Matrix4().makeTranslation(s * 29.5, H / 2, zc), col);
          r.box(VC.glow, K.glass(0.6, s > 0), s * 24.47, H * 0.55, zc, 0.04, H * 0.6, w - 2.4);
          r.box(VC.solid, '#3a3a3e', s * 29.5, H + 0.15, zc, 10.4, 0.3, w - 0.6);
        } else K.bungalow(r, s, 25, zc, { w });
        K.lawn(r, s * 23.95, zc, 0.6, w - 0.4, '#5a8a3e', 0.035);
        if (chance(0.5)) { r.box(VC.solid, '#8a6a4a', s * 20.4, yw + 0.3, zc, 1.6, 0.15, 3.2); r.add(G.sphLow, VC.solid, s * 19.4, yw + 0.15, zc + 1, 0.9, 0.35, 3.2, 0, rand(-0.3, 0.3), 0, pick(['#c8302a', '#2a6ad8', '#f4f0e8', '#ffd23d'])); }   // a dock, a canoe
        for (let k = 0; k < 2; k++) (chance(0.5) ? K.strelitzia : K.agave)(r, s * rand(22.6, 23.6), zc + rand(-w / 2 + 1, w / 2 - 1), 0.9);
        z += w + rand(0.3, 1.2);
      }
      for (const zb of [rand(14, 26), rand(52, 64)]) {   // the white footbridges arching over the canal
        const N = 8, F = frame(r, 0, 0, 0, 1, 0);
        for (let k = 0; k < N; k++) {   // its deck in a shallow arch, the white rails either side
          const t0 = k / N, t1 = (k + 1) / N, x0 = s * (11.4 + t0 * 9.4), x1 = s * (11.4 + t1 * 9.4), y0 = Math.sin(t0 * Math.PI) * 1.6 + 0.1, y1 = Math.sin(t1 * Math.PI) * 1.6 + 0.1;
          F.beam(VC.solid, '#f4f2ec', [x0, y0, -zb], [x1, y1, -zb], 0.22, 1.9);
          for (const e of [-1, 1]) F.beam(VC.solid, '#f4f2ec', [x0, y0 + 0.9, -zb + e * 0.95], [x1, y1 + 0.9, -zb + e * 0.95], 0.08, 0.08);
        }
        for (const e of [-1, 1]) for (const x of [11.4, 20.8]) r.cyl(VC.solid, '#f4f2ec', s * x, 0.6, -zb + e * 0.95, 0.07, 1.2, 'cyl6');
      }
      for (let z = rand(4, 10); z < CHUNK_LEN - 2; z += rand(16, 22)) (chance(0.6) ? K.fanPalm : K.palm)(r, s * 22.8, -z, rand(0.95, 1.15));
      for (let k = randi(2, 4); k > 0; k--) r.add(G.sphLow, VC.solid, s * rand(13, 19), yw + 0.1, -rand(5, 75), 0.3, 0.22, 0.45, 0, rand(0, 6), 0, pick(['#f4f2ec', '#5a4a3a', '#3a6a3a']));   // ducks
      for (let z = rand(6, 12); z < CHUNK_LEN - 2; z += rand(18, 24)) { b.cyl(VC.metal, '#2a2a2e', s * 10.4, 1.4, -z, 0.05, 2.8, 'cyl6'); b.box(VC.glow, hdr('#ffe0a8', 2.2), s * 10.4, 3.0, -z, 0.3, 0.4, 0.3); }   // the walk's lanterns
      K.throng(b, s * 4.6, s * 10.2, 2, CHUNK_LEN - 2, randi(4, 7), [], { shorts: true });
      if (chance(0.5)) K.dog(b, s * rand(6, 9), -rand(6, 74));
    }
    mergeInto(b, r);
    mirrorInto(b, r, yw, 0.5);
    for (const s of [-1, 1]) for (const z of [-0.2, -79.8]) b.box(VC.solid, '#1a1a1e', s * 16.15, yw - 7, z, 10, 13.6, 0.4);   // the water's ends, so nothing below shows
    return b;
  };
  // Venice Beach: Windward Avenue's arcades, the VENICE sign hung over the street, then the beach opening out on the left
  const venice = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) {
      const end = s < 0 ? 48 : 80;
      K.kerbLane(b, s, { z1: s < 0 ? 50 : CHUNK_LEN, x1: X0 });
      for (let z = 0; z < end - 6;) {   // the old Venice of America blocks: a colonnade of round arches along the front, the shops behind
        const w = Math.min(rand(12, 18), end - z), zc = -(z + w / 2), H = rand(9, 13), col = pick(['#f2e2c8', '#e8d0b0', '#f4e8d8', '#e8c8b8', '#d8c0a0']);
        b.addM(K.tiledBox(14, H, w, 2.5), K.stuccoMat, new THREE.Matrix4().makeTranslation(s * (X0 + 7), H / 2, zc), col);
        const n = Math.round(w / 3), bay = (w - 0.8) / n;
        for (let k = 0; k <= n; k++) {
          const zz = -(z + 0.4 + k * bay);
          b.cyl(VC.solid, '#f4ecdc', s * 9.0, 1.9, zz, 0.2, 3.8, 'cyl8');
          b.box(VC.solid, '#f4ecdc', s * 9.0, 3.95, zz, 0.6, 0.3, 0.6);
          if (k < n) b.addM(ARCH, VC.solid, new THREE.Matrix4().compose(new THREE.Vector3(s * 9.0, 4.1, zz - bay / 2), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), new THREE.Vector3(bay, bay, 4)), '#f4ecdc');
        }
        b.box(VC.solid, col, s * 9.0, 4.45 + bay / 2, zc, 0.6, 0.7, w);   // the frieze over the arches
        b.box(VC.solid, '#e8dcc8', s * 10.2, 4.15 + bay / 2, zc, 2.4, 0.2, w);   // the arcade's ceiling
        const sign = pick(BEACH_SIGNS);
        K.board(b, K.goodsRects[GI[sign.goods]], s * (X0 - 0.03), 1.8, zc, Math.min(w - 2, 8), 2.4, 1, 0, face(s), 0);
        K.board(b, K.signRects[sign.i], s * (X0 - 0.05), 3.4, zc, 4.4, 0.9, 1, 0, face(s), 0);
        for (let y = 6.4; y < H - 1; y += 3.2) for (let zz = z + 1.4; zz < z + w - 1; zz += 2.6) b.box(VC.glow, K.glass(0.45, s > 0), s * (X0 - 0.03), y, -zz, 0.04, 1.5, 1.3);
        if (chance(0.5)) K.mural(b, s * (X0 + 0.0), (6.2 + H) / 2, zc, s, w - 1, H - 6.6);
        z += w + 0.2;
      }
      for (let z = rand(6, 12); z < end - 4; z += rand(16, 20)) K.fanPalm(b, s * 7.6, -z, rand(1.0, 1.15));
    }
    // the VENICE sign: its letters lit on a frame hung from wires over the street, well clear of the track
    for (const e of [-1, 1]) { b.cyl(VC.metal, '#3a3a3e', e * 8.6, 7.6, -26, 0.12, 15.2, 'cyl8'); beam(b, VC.metal, e * 8.6, 15.0, -26, e * 4.6, 13.6, -26, 0.03, '#1a1a1e'); }
    b.box(VC.solid, '#1a1a20', 0, 12.6, -26, 9.4, 1.8, 0.25);
    K.sign(b, 'VENICE', { w: 1024, h: 192, color: '#fff4e0', font: BLADE, size: 0.8, glow: '#ffd890', k: 2.4 }, 0, 12.6, -25.85, 9.2, 1.75, 1);
    K.sign(b, 'VENICE', { w: 1024, h: 192, color: '#fff4e0', font: BLADE, size: 0.8, glow: '#ffd890', k: 2.4 }, 0, 12.6, -26.15, 9.2, 1.75, 1, 0, Math.PI, 0);
    // out of the street onto the beach: the sand and the sea on the left, the boardwalk's shops go on on the right
    beach(b, -50, -CHUNK_LEN);
    seaEdge(b, 52, CHUNK_LEN);
    sandLife(b, 52, CHUNK_LEN, { towers: 1, towels: 3, surf: 2 });
    K.throng(b, -4.6, -10.2, 2, 78, 10, [], { shorts: true }); K.throng(b, 4.6, 10.2, 2, 78, 12, [], { shorts: true });
    for (let k = 0; k < 4; k++) K.skater(b, pick([-1, 1]) * rand(5, 9.5), -rand(4, 76));
    for (let k = 0; k < 2; k++) K.person(b, pick([-1, 1]) * rand(5, 9), -rand(6, 74), { costume: 'robot', ry: Math.PI / 2 });   // a silver robot mime or two
    return b;
  };
  const boardwalk = () => {   // Ocean Front Walk: the shops and murals on the right, the palms, vendors and the sand on the left
    const b = new Batcher();
    K.kerbLane(b, 1, { x1: X0 });
    shops(b, 0, CHUNK_LEN);
    beach(b); seaEdge(b); sandLife(b, 0, CHUNK_LEN, { towers: 1, towels: 7, surf: 3, nets: chance(0.5) ? 1 : 0 });
    walkLife(b, 12);
    const dz = rand(20, 60);   // a drum circle on the walk's sea edge
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; K.person(b, -8.6 + Math.cos(a) * 1.6, -dz + Math.sin(a) * 1.6, { seated: true, ry: -a - Math.PI / 2, shorts: true }); b.cyl(VC.solid, pick(['#8a5a2a', '#c8a050', '#5a3a1a']), -8.6 + Math.cos(a) * 1.15, 0.35, -dz + Math.sin(a) * 1.15, 0.2, 0.7, 'cyl8'); }
    return b;
  };
  // Muscle Beach: the pen of weights and the bodybuilders, the basketball courts, the skate park's bowls on the sand, the art walls
  const muscle = () => {
    const b = new Batcher();
    K.kerbLane(b, 1, { x1: X0 });
    shops(b, 0, CHUNK_LEN);
    beach(b, 0, -CHUNK_LEN, { wall: false });
    b.block(VC.solid, '#3a3638', -21, -0.7, -21, 18.4, 0.76, 26.4);   // the gym's floor on its pad, its fence, the sign over the gate
    for (const [x0, z0, x1, z1] of [[-12, -8, -30, -8], [-30, -8, -30, -34], [-30, -34, -12, -34], [-12, -34, -12, -26]]) {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 2.5);
      for (const y of [0.3, 2.3]) b.box(VC.metal, '#5a5e64', (x0 + x1) / 2, y, (z0 + z1) / 2, Math.abs(x1 - x0) + 0.06, 0.06, Math.abs(z1 - z0) + 0.06);
      for (let k = 0; k <= n; k++) b.box(VC.metal, '#5a5e64', x0 + ((x1 - x0) * k) / n, 1.2, z0 + ((z1 - z0) * k) / n, 0.07, 2.4, 0.07);
    }
    for (const e of [-1, 1]) b.cyl(VC.metal, '#3a3a3e', -12, 2.2, -14 + e * 3, 0.1, 4.4, 'cyl8');
    b.box(VC.solid, '#1a1a20', -12, 4.6, -14, 0.2, 1.2, 7);
    K.sign(b, 'MUSCLE BEACH', { w: 1024, h: 160, color: '#ffd23d', bg: '#1a1a20', font: BLADE, size: 0.62, k: 1.4 }, -11.88, 4.6, -14, 6.8, 1.06, 1, 0, Math.PI / 2, 0);
    for (let k = 0; k < 6; k++) {   // benches, racks, the lifters
      const x = rand(-15, -27), z = -rand(11, 31);
      b.box(VC.solid, '#2a2a30', x, 0.45, z, 0.5, 0.15, 1.6); for (const e of [-0.6, 0.6]) b.box(VC.metal, '#3a3a3e', x, 0.22, z + e, 0.4, 0.4, 0.08);   // a bench on its legs
      for (const e of [-1, 1]) b.box(VC.metal, '#3a3a3e', x + e * 0.62, 0.68, z, 0.08, 1.3, 0.08);   // the rack's uprights, the bar across them
      b.cyl(VC.metal, '#b8bcc4', x, 1.3, z, 0.04, 2.2, 'cyl6', 0, Math.PI / 2);
      for (const e of [-1, 1]) b.cyl(VC.solid, '#1a1a1e', x + e * 0.9, 1.3, z, 0.32, 0.12, 'cyl8', 0, Math.PI / 2);
      K.person(b, x + rand(-1, 1), z + rand(1, 2), { buff: true, beach: true, ry: rand(0, 6), shades: chance(0.5) });
    }
    for (const cz of [-46, -62]) {   // the courts
      b.block(VC.solid, '#2a6a8a', -26, -0.8, cz, 14, 0.85, 15);
      for (const [w, d] of [[13, 0.1], [0.1, 14]]) b.box(VC.solid, '#f4f0e8', -26, 0.06, cz, w, 0.01, d);
      for (const e of [-1, 1]) { b.cyl(VC.metal, '#5a5e64', -26, 1.6, cz + e * 7.8, 0.08, 3.2, 'cyl8'); b.box(VC.metal, '#5a5e64', -26, 3.2, cz + e * 7.55, 0.1, 0.1, 0.5); b.box(VC.solid, '#f4f0e8', -26, 3.3, cz + e * 7.3, 1.8, 1.1, 0.06); b.add(G.tor, VC.solid, -26, 3.0, cz + e * 6.9, 0.9, 0.9, 0.9, Math.PI / 2, 0, 0, '#ff6a1a'); }
      for (let k = randi(3, 6); k > 0; k--) K.person(b, -26 + rand(-5, 5), cz + rand(-6, 6), { shorts: true, ry: rand(0, 6), shades: false });
    }
    for (const [x, z, r] of [[-48, -18, 5], [-58, -30, 4], [-46, -72, 6]]) {   // the skate park's bowls, a skater up over each
      const y = sandY(x);
      b.add(G.cyl, VC.solid, x, y, z, r * 2, 0.4, r * 2, 0, 0, 0, '#4a4648');
      b.add(G.tor, VC.solid, x, y + 0.12, z, r * 2.05, r * 2.05, 4, Math.PI / 2, 0, 0, '#c8c4bc');
      K.skater(b, x + rand(-1, 1), z + rand(-1, 1), rand(0, 6));
      K.person(b, x - r + 0.8, z, { skate: true, y: y + rand(1.4, 2.6), ry: rand(0, 6) });
    }
    for (let k = 0; k < 3; k++) { const z = -rand(38, 66), x = rand(-58, -70); b.box(VC.solid, '#c8c4bc', x, sandY(x) + 1.6, z, 0.35, 3.2, 6); K.mural(b, x + 0.2, sandY(x) + 1.7, z, -1, 5.8, 3.0, randi(0, 5)); }   // the art walls, painted over and over
    for (let z = rand(3, 8); z < CHUNK_LEN - 2; z += rand(15, 19)) K.fanPalm(b, -12.4, -z, rand(1.0, 1.2), { y: -0.04 });
    sandLife(b, 0, CHUNK_LEN, { towers: 1, towels: 3, surf: 3 });
    walkLife(b, 10);
    return b;
  };
  // the open sand: the towers, the nets, the fire rings, the surfers going out; the beach car park and the bluffs beginning on the right
  const strand = () => {
    const b = new Batcher();
    beach(b); seaEdge(b, 40, CHUNK_LEN);
    sandLife(b, 0, CHUNK_LEN, { towers: 2, nets: 2, fires: 2, towels: 9, surf: 5 });
    K.road(b, 22, -CHUNK_LEN / 2, 22, CHUNK_LEN, 0.03);   // the beach car park
    for (let z = 2; z < CHUNK_LEN - 2; z += 2.8) { b.box(VC.solid, '#e8e4dc', 25.8, 0.04, -z, 5.2, 0.01, 0.1); if (chance(0.55)) K.place(b, (t) => K.car(t, 0, 0, 1), new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(25.8, 0, -z - 1.4)); }
    for (let z = rand(3, 8); z < CHUNK_LEN - 2; z += rand(13, 17)) K.fanPalm(b, 12.2, -z, rand(1.0, 1.2));
    b.box(VC.solid, '#7a8a5a', 75, -0.2, -CHUNK_LEN / 2, 60, 0.2, CHUNK_LEN);
    bluff(b, 46, 9, { park: false });
    for (let z = rand(2, 8); z < CHUNK_LEN - 8; z += rand(12, 16)) { const H = rand(5, 9); b.addM(K.tiledBox(12, H, 10, 2.5), K.stuccoMat, new THREE.Matrix4().makeTranslation(64, 9 + H / 2, -z - 5), pick([...PASTEL, ...STUCCO])); b.box(VC.glow, K.glass(0.6, false), 57.97, 9 + H * 0.55, -z - 5, 0.04, H * 0.5, 7); }   // houses up on the bluff
    walkLife(b, 9);
    return b;
  };
  // the pier: the deck high over the walk on its pilings, Pacific Park on it, the old carousel's hall at the land end, the
  // arch with the famous sign at the top of the bridge from the bluff; the bluffs, the road, the park and Ocean Avenue on the right
  const ledMats = [0, 1, 2].map(() => basic({ color: hdr('#ffffff', 3) }));
  const pier = () => {
    const b = new Batcher(), D0 = -34, D1 = -52, DY = 12;
    beach(b);
    sandLife(b, 0, 30, { towers: 1, towels: 4, surf: 2 }); sandLife(b, 56, CHUNK_LEN, { towers: 0, towels: 3, surf: 2 });
    b.addM(K.tiledBox(465, 0.6, D0 - D1, 3), plankMat, new THREE.Matrix4().makeTranslation((45 - 420) / 2, DY, (D0 + D1) / 2), '#ffffff');   // the deck, from the bluff out over the sea
    for (const x of [10.6, 29.4]) for (const z of [D0 - 2, D1 + 2]) b.block(VC.solid, '#b8b0a4', x, 0, z, 1.0, DY - 0.3, 1.4);   // the bents carrying it over the road
    for (let x = 42; x > -420; x -= 6) {
      if (Math.abs(x) < 5 || (x > 9 && x < 31)) continue;
      const y0 = x > 30 ? 0 : x > WALL ? -0.5 : x > SHORE ? sandY(x) - 0.3 : SEA - 5;
      for (const z of [D0 - 0.6, D0 - 6.2, D1 + 6.2, D1 + 0.6]) b.cyl(VC.solid, '#5a4a3c', x, (y0 + DY) / 2, z, 0.3, DY - y0, 'cyl6');
      b.box(VC.solid, '#4a3c30', x, DY - 0.6, (D0 + D1) / 2, 0.4, 0.6, D0 - D1);   // the cap across the pilings
      if (x < -6 && x > -150) beam(b, VC.solid, x, y0 + 1, D0 - 0.6, x, DY - 1, D0 - 6.2, 0.15, '#4a3c30');   // the bracing, on the side toward you
    }
    for (const z of [D0 - 0.1, D1 + 0.1]) { b.box(VC.solid, '#e8e4dc', (45 - 420) / 2, DY + 0.8, z, 465, 0.08, 0.08); for (let x = 40; x > -420; x -= 2.5) b.box(VC.solid, '#e8e4dc', x, DY + 0.55, z, 0.07, 0.5, 0.07); }   // the rails
    for (let x = 36; x > -400; x -= 14) { b.cyl(VC.metal, '#2a2a2e', x, DY + 2.2, D0 - 0.3, 0.05, 4, 'cyl6'); b.sph(VC.glow, hdr('#ffe8c0', 2.4), x, DY + 4.3, D0 - 0.3, 0.2, true); }
    K.crowd(b, -150, 30, 35, 37, 22, { y: DY + 0.3, camera: chance(0.5) });
    for (let k = 0; k < 8; k++) K.person(b, rand(-400, -160), D0 - 0.8, { y: DY + 0.3, ry: Math.PI });   // fishing off the rail
    // the Ferris wheel on the deck's near edge, its LEDs running patterns; the wheel's A-frame
    const W = frame(b, -36, DY + 15, D0 - 3, 1, 0), R = 13;
    b.addM(new THREE.TorusGeometry(R, 0.28, 6, 48), VC.metal, new THREE.Matrix4().makeTranslation(-36, DY + 15, D0 - 3), '#e8e8ec');
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      W.beam(VC.metal, '#d8dce0', [0, 0, 0], [Math.cos(a) * R, Math.sin(a) * R, 0], 0.12, 0.12);
      W.box(ledMats[k % 3], 0xffffff, Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55, 0.12, 0.35, 0.35, 0.1);
      W.box(ledMats[(k + 1) % 3], 0xffffff, Math.cos(a) * (R + 0.35), Math.sin(a) * (R + 0.35), 0, 0.45, 0.45, 0.45);
      W.box(VC.solid, pick(['#e8302a', '#ffd23d', '#2a6ad8', '#3ab4a0']), Math.cos(a) * R, Math.sin(a) * R - 1.1, 0.6, 1.1, 1.3, 1.1);   // a gondola
    }
    for (const e of [-1, 1]) for (const f of [-1, 1]) W.beam(VC.metal, '#d8dce0', [0, 0, f * 0.8], [e * 6, -15, f * 2.6], 0.4, 0.4);
    W.cyl(VC.metal, '#d8dce0', 0, 0, 0, 0.9, 3.6, 'cyl8', Math.PI / 2);
    // the roller coaster: a loop of red track on white trestles over the far part of the deck
    const path = [];
    for (let k = 0; k <= 48; k++) { const t = (k / 48) * Math.PI * 2; path.push([-92 + Math.cos(t) * 26, DY + 10.5 + 6 * Math.sin(t * 2 + 0.6) + 3 * Math.sin(t), D0 - 8 + Math.sin(t) * 6]); }
    for (let k = 1; k < path.length; k++) { for (const o of [-0.5, 0.5]) beam(b, VC.metal, path[k - 1][0], path[k - 1][1], path[k - 1][2] + o, path[k][0], path[k][1], path[k][2] + o, 0.16, '#e8402a'); if (k % 3 === 0) b.box(VC.metal, '#f4f0e8', path[k][0], (DY + path[k][1]) / 2, path[k][2], 0.3, path[k][1] - DY, 0.3); }
    for (let k = 0; k < 4; k++) b.box(VC.solid, pick(['#ffd23d', '#2a6ad8', '#e8302a']), path[30 + k * 2][0], path[30 + k * 2][1] + 0.5, path[30 + k * 2][2], 2.2, 0.8, 1.2);   // its train
    // the Hippodrome: the old carousel's hall at the land end, its corner turrets, the arched windows lit
    const hx = 16, hz = (D0 + D1) / 2;
    b.addM(K.tiledBox(22, 9, 16, 2.5), K.stuccoMat, new THREE.Matrix4().makeTranslation(hx, DY + 4.8, hz), '#d8c8b4');
    for (const e of [-1, 1]) for (const f of [-1, 1]) { b.cyl(VC.solid, '#d8c8b4', hx + e * 10.6, DY + 6, hz + f * 7.6, 1.3, 12, 'cyl8'); b.add(G.cone8, VC.solid, hx + e * 10.6, DY + 13.4, hz + f * 7.6, 3.2, 2.8, 3.2, 0, 0, 0, '#3a7a7a'); }
    for (let k = 0; k < 6; k++) K.archWin(frame(b, hx - 8.5 + k * 3.4, DY, hz + 8, 1, 0), 0, 4.2, 0.02, 1.5, 3.0, hdr('#ffd9a0', 0.85), '#c8b8a0');
    b.addM(new THREE.ConeGeometry(9, 3, 8, 1), VC.solid, new THREE.Matrix4().makeTranslation(hx, DY + 10.8, hz), '#a8503a');
    // the sign at the top of the bridge from the bluff, turned to face the walk: SANTA MONICA YACHT HARBOR · SPORT FISHING · BOATING · CAFES
    const sx = 47, sy = DY + 1.5, sz = D0 + 0.5;   // up on the bluff, where the bridge comes off Ocean Avenue
    const AS = 1.35, A = frame(b, sx, sy, sz, AS, 0);
    for (const e of [-1, 1]) A.box(VC.metal, '#2a2a30', e * 6.2, 3.5, -0.3, 0.4, 7, 0.4);
    const arch = new THREE.Shape(); arch.moveTo(-6.6, 3.2); arch.lineTo(6.6, 3.2); arch.lineTo(6.6, 6.2); arch.absarc(0, 6.2, 6.6, 0, Math.PI, false); arch.lineTo(-6.6, 3.2);
    A.addM(new THREE.ShapeGeometry(arch, 16), VC.solid, new THREE.Matrix4().makeTranslation(0, 0, -0.04), '#2a4a8a');
    K.sign(A, 'SANTA MONICA', { w: 1024, h: 160, color: '#fff8f0', font: DECO, size: 0.72, glow: '#ffe0b0', k: 2.4 }, 0, 10.2, 0, 9.6, 1.5, 1);
    K.sign(A, 'YACHT HARBOR', { w: 1024, h: 160, color: '#fff8f0', font: DECO, size: 0.72, glow: '#ffe0b0', k: 2.4 }, 0, 7.6, 0, 11, 1.7, 1);
    K.sign(A, 'SPORT FISHING · BOATING · CAFES', { w: 1024, h: 96, color: '#ffd890', font: SANS, weight: 700, size: 0.6, glow: '#ffd890', k: 2.0 }, 0, 5.2, 0, 11.6, 1.1, 1);
    // the land side under the deck: the coast road, the bluffs, the park on top, Ocean Avenue
    pch(b, 12, 28);
    bluff(b, 30, DY + 1.5);
    return b;
  };
  // the foot of the bluffs: the coast road and its traffic, the cliff and the palms along its top on the right; the sand
  // and the sea going on on the left, the pier behind, and ahead the Santa Monica Mountains coming down to the water
  const palisades = () => {
    const b = new Batcher();
    beach(b); seaEdge(b, 0, CHUNK_LEN);
    sandLife(b, 0, CHUNK_LEN - 12, { towers: 1, towels: 4, fires: 1, surf: 3 });
    pch(b, 11.5, 27.5);
    bluff(b, 29.5, 26);
    for (let k = 0; k < 9; k++) b.add(G.sphLow, VC.solid, -rand(14, 70), sandY(-30) - 0.6, -rand(66, 80), rand(2, 4), rand(1.2, 2.2), rand(2, 4), 0, rand(0, 3), 0, pick(['#6a5a4a', '#7a6a58', '#5a4a3c']));   // a rock groin out into the water
    for (const [x, z, sx, sy, sz] of [[-160, -150, 260, 130, 160], [-320, -120, 300, 170, 200], [-520, -180, 340, 210, 240], [-110, -240, 200, 150, 180]]) b.add(G.sphLow, VC.solid, x, -30, z, sx, sy, sz, 0, rand(0, 3), 0, pick(['#6a5a5a', '#7a6a6a', '#5a5060']));   // the mountains coming down to the sea
    walkLife(b, 8);
    return b;
  };
  const done = (fn) => () => K.flushSmoke(fn().build());
  return {
    zones: { canals: done(canals), boardwalk: done(boardwalk), muscle: done(muscle), strand: done(strand), palisades: done(palisades) },
    landmarks: {
      venice: { key: 'venice', name: '威尼斯海滩', en: 'VENICE BEACH', build: done(venice) },
      pier: { key: 'pier', name: '圣莫尼卡码头', en: 'SANTA MONICA PIER', build: done(pier) },
    },
    update(t) {
      ft.offset.set(-t * 0.018, 0); ft2.offset.set(-t * 0.011 + 0.37, 0.5);
      wn.offset.set(t * 0.004, t * 0.01);
      canalMat.userData.scroll.offset.set(t * 0.004, t * 0.01);
      const h = (t * 0.08) % 1;   // the wheel's lights: three sets chasing through the colours
      ledMats.forEach((m, i) => m.color.setHSL((h + i / 3) % 1, 0.9, 0.55).multiplyScalar(2.6 + 1.4 * Math.sin(t * 3 + i * 2.1)));
    },
  };
}
