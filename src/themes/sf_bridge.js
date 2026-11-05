// The run across the Golden Gate Bridge: seven chunks in a row on the loop (sf.js ZONES). Out of the Presidio's
// eucalyptus and cypress past the visitor plaza, between the south anchorage's art-deco pylons and onto the deck; up the
// side span to the south tower standing across the road; the main span, the cables swinging down beside the railing and
// up again to the north tower coming out of the fog; down to the Marin anchorage and onto the headlands at Vista Point.
// Under the deck the fog lies like a sea all the way, a freighter's masts standing up out of it.
// Stylised: the towers are about half their height and the spans about a quarter of their length, so the cables run
// steeper than the real ones. Everything is measured along the stretch: S, in metres from the start of its first chunk.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { EDGE } from './common.js';
import { beam } from './tokyo_kit.js';
import { frame, thinFog, figure } from './ny_icons.js';
import { GG, ggTower, cable } from './sf_icons.js';

export const STRETCH = { first: 19, len: 7 };   // its first chunk on the 48-chunk loop, and how many chunks it takes
const SA = 62, ST = 140, SM = 280, SN = 420, SB = 500;   // the south anchorage, the south tower, mid-span, the north tower, the north anchorage
const DECK = [73, 491];   // where the deck leaves the bluff and lands again
const YS = GG.saddle + 0.4, YA = 7, YLOW = 4.4, X = GG.legX, SEA = -28;
// the main cables' height over the roadway at S (null where there are none)
export function cableY(S) {
  if (S < SA || S > SB) return null;
  if (S <= ST) { const t = (S - SA) / (ST - SA); return YA + (YS - YA) * t - 28 * t * (1 - t); }
  if (S >= SN) { const t = (SB - S) / (SB - SN); return YA + (YS - YA) * t - 28 * t * (1 - t); }
  const u = (S - SM) / (SM - ST); return YLOW + (YS - YLOW) * u * u;
}

function seaTex() {   // the top of the fog bank: soft billows, their shadows faintly lilac
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#d6c8cc'; g.fillRect(0, 0, w, h);
    const blob = (x, y, r, c) => { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2); } };
    for (let i = 0; i < 40; i++) blob(rand(0, w), rand(0, h), rand(14, 40), 'rgba(170,150,175,0.35)');
    for (let i = 0; i < 70; i++) blob(rand(0, w), rand(0, h), rand(12, 44), 'rgba(255,248,244,0.55)');
  });
}
function trussTex() {   // the stiffening truss under the deck's edge: its chords and diagonals (alpha-tested)
  return canvasTex(256, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
    for (let x = 0; x <= w; x += 32) { g.fillRect(x - 2, 0, 4, h); g.save(); g.translate(x, 0); g.rotate(Math.atan2(h, 32)); g.fillRect(0, -2, Math.hypot(h, 32), 4); g.restore(); }
  });
}

export function makeBridge(K) {
  const paint = thinFog(std({ vertexColors: true, roughness: 0.6, metalness: 0.15 }), 0.5);   // international orange, seen through the fog
  const S = { paint, cOrange: '#c4442e', cOrange2: '#a8382a' };
  const lampMat = basic({ color: hdr('#ff2a1a', 3) });
  const st = seaTex();
  const seaMat = std({ map: st, color: '#ffffff', roughness: 1, metalness: 0, emissive: '#ead4d4', emissiveMap: st, emissiveIntensity: 0.55 });
  const tt = trussTex();
  const trussMat = std({ map: tt, alphaTest: 0.5, color: '#c4442e', roughness: 0.6, side: THREE.DoubleSide });
  const groundCol = '#8a8468', rock = '#6a6258', grass = '#a89a5e', WARM_P = ['#ffd9a0', '#ffe6bc', '#ffc880'];

  // the bridge between S0 and S0 + 80 in a chunk whose start is S0: deck, railings, cables, suspenders, lamps, traffic,
  // people, the sea of fog beside and below, the towers and anchorages that fall in it
  const piece = (b, S0) => {
    const z = (Sv) => -(Sv - S0), W = frame(b, 0, 0, 0, 1, 0), a = Math.max(S0, DECK[0] - 10), c = Math.min(S0 + CHUNK_LEN, DECK[1] + 10);
    // the roadway either side of the track, its kerb, the pavement out to the railing
    for (const s of [-1, 1]) {
      K.road(b, s * (EDGE + 7.3) / 2, -CHUNK_LEN / 2, 7.3 - EDGE, CHUNK_LEN, 0.032);
      b.box(VC.solid, '#a8a49c', s * 7.36, 0.08, -CHUNK_LEN / 2, 0.14, 0.16, CHUNK_LEN);
      for (let k = 0; k < 10; k++) b.box(VC.solid, '#e8e4dc', s * 5.5, 0.036, -(k * 8 + 2), 0.12, 0.01, 3);   // lane lines
    }
    if (c > a) for (const s of [-1, 1]) {   // over the water: the girder and its truss, the railing on it
      b.box(paint, S.cOrange2, s * 11.2, -3.2, -(a + c) / 2 + S0, 0.9, 7, c - a);
      b.add(G.plane, trussMat, s * 11.66, -3.6, -(a + c) / 2 + S0, c - a, 6.6, 1, 0, Math.PI / 2, 0);
      b.box(paint, S.cOrange, s * 10.95, 1.25, -(a + c) / 2 + S0, 0.12, 0.1, c - a);
      b.box(paint, S.cOrange, s * 10.95, 0.32, -(a + c) / 2 + S0, 0.12, 0.12, c - a);
      for (let Sv = Math.ceil(a / 0.6) * 0.6; Sv < c; Sv += 0.6) b.box(paint, S.cOrange, s * 10.95, 0.78, z(Sv), 0.05, 0.92, 0.05);
      for (let Sv = Math.ceil(a / 12) * 12; Sv < c; Sv += 12) b.box(paint, S.cOrange2, s * 10.95, 0.75, z(Sv), 0.22, 1.5, 0.22);
      b.add(G.plane, seaMat, s * (11.7 + 210), SEA, -(a + c) / 2 + S0, 420, c - a, 1, -Math.PI / 2, 0, 0);
      b.add(G.plane, seaMat, 0, SEA - 0.2, -(a + c) / 2 + S0, 24, c - a, 1, -Math.PI / 2, 0, 0);
    }
    // the main cables, the suspenders hung from them in pairs
    for (const s of [-1, 1]) {
      const pts = [];
      for (let Sv = S0 - 1; Sv <= S0 + CHUNK_LEN + 1; Sv += 3) { const y = cableY(Sv); if (y !== null) pts.push([s * X, y, z(Sv)]); else if (pts.length) break; }
      if (pts.length > 1) {
        cable(W, paint, S.cOrange, pts, 0.48);
        for (const e of [-1, 1]) cable(W, paint, S.cOrange2, pts.map(([x, y, zz]) => [x + e * 0.5, y + 1.0, zz]), 0.03);   // the handropes along its top
      }
      for (let Sv = Math.ceil(S0 / 7.5) * 7.5; Sv < S0 + CHUNK_LEN; Sv += 7.5) {
        const y = cableY(Sv);
        if (y === null || y < 1.8 || Math.abs(Sv - ST) < 4 || Math.abs(Sv - SN) < 4 || Sv < DECK[0] || Sv > DECK[1]) continue;
        for (const dz of [-0.14, 0.14]) b.box(paint, S.cOrange2, s * X, (y + 0.3) / 2, z(Sv) + dz, 0.08, y - 0.3, 0.08);
        b.box(paint, S.cOrange2, s * X, 0.2, z(Sv), 0.5, 0.4, 0.6);
        const ya = cableY(Sv - 0.3), yb = cableY(Sv + 0.3);   // the cable band they hang from, its handrope post
        if (ya !== null && yb !== null) W.span(G.cyl8, paint, S.cOrange2, [s * X, ya, z(Sv - 0.3)], [s * X, yb, z(Sv + 0.3)], 1.25);
        if (Math.round(Sv / 7.5) % 2 === 0) for (const e of [-1, 1]) b.box(paint, S.cOrange2, s * X + e * 0.5, y + 0.55, z(Sv), 0.05, 0.9, 0.05);
      }
    }
    // the roadway lights on the railing; the traffic, slow in the fog, headlamps toward you, tail lamps away
    for (let Sv = Math.ceil(S0 / 25) * 25 + 6; Sv < S0 + CHUNK_LEN; Sv += 25) for (const s of [-1, 1]) {
      if (Sv < DECK[0] - 10 || Sv > DECK[1] + 10) continue;
      b.cyl(paint, S.cOrange, s * 10.7, 3.6, z(Sv), 0.11, 7.2, 'cyl8'); b.cyl(paint, S.cOrange2, s * 10.7, 0.5, z(Sv), 0.2, 1.0, 'cyl8');
      for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; b.box(paint, S.cOrange2, s * 10.7 + Math.cos(a) * 0.11, 3.8, z(Sv) + Math.sin(a) * 0.11, 0.05, 5.6, 0.05); }   // its flutes
      beam(b, paint, s * 10.7, 6.9, z(Sv), s * 8.3, 7.4, z(Sv), 0.09, S.cOrange);
      beam(b, paint, s * 10.7, 6.2, z(Sv), s * 9.4, 7.2, z(Sv), 0.05, S.cOrange);
      b.box(paint, S.cOrange2, s * 8.1, 7.38, z(Sv), 0.84, 0.16, 0.46);
      b.box(VC.glow, hdr('#ffc070', 2.4), s * 8.1, 7.25, z(Sv), 0.7, 0.12, 0.36);
      K.pool(b, s * 8.0, z(Sv), 6, 6, hdr('#ffb060', 0.12));
    }
    for (const s of [-1, 1]) for (let zz = rand(2, 8); zz < CHUNK_LEN - 3; zz += rand(8, 14)) if (chance(0.7)) K.car(b, s * 5.5, -zz, s, { lit: true });
    for (const s of [-1, 1]) {
      for (let k = randi(2, 5); k > 0; k--) K.person(b, s * rand(7.9, 10.3), -rand(2, 78), { camera: chance(0.4), ry: chance(0.5) ? 0 : Math.PI });
      if (chance(0.7)) K.cyclist(b, s * rand(8.4, 9.8), -rand(4, 76), chance(0.5) ? 0 : Math.PI);
    }
    // the towers and the anchorages that fall in this chunk
    for (const St of [ST, SN]) if (St >= S0 && St < S0 + CHUNK_LEN) ggTower(frame(b, 0, 0, z(St), 1, 0), S, { foot: 80, lamp: { mat: lampMat, col: 0xffffff } });
    for (const Sa of [SA, SB]) if (Sa >= S0 && Sa < S0 + CHUNK_LEN) anchorage(b, z(Sa), Sa === SA ? 1 : -1);
    // fog drifting across the deck, billows rising off the sea beside it
    for (let k = 0; k < 9; k++) { const x = rand(-13, 13); K.fogBuf.push([x, Math.abs(x) < 4.5 ? rand(9, 16) : rand(3, 12), -rand(2, 78)]); }
    if (c > a) for (let k = 0; k < 7; k++) K.fogBuf.push([pick([-1, 1]) * rand(16, 70), SEA + rand(1, 8), -rand(a - S0, c - S0)]);
  };
  // an anchorage where the cables go down into the rock: the concrete housing either side, an art-deco pylon over each,
  // facing the road; dir: which way the span leaves it (+1: on toward greater S)
  const anchorage = (b, za, dir) => {
    for (const s of [-1, 1]) {
      b.block(VC.solid, '#c8c0b0', s * (X + 3.1), -12, za + dir * 4, 8.4, 20, 18);
      b.box(VC.solid, '#b8b0a0', s * (X + 3.1), 8.4, za + dir * 4, 9.0, 0.8, 18.6);
      const px = s * 17.5, pz = za + dir * 10;
      for (const [y0, y1, w, d] of [[0, 9, 6, 8], [9, 17, 5, 7], [17, 23, 4, 6], [23, 27, 3, 5]]) {
        b.block(VC.solid, '#d8d0c0', px, y0, pz, w, y1 - y0, d);
        for (const e of [-1, 1]) for (const o of [-0.25, 0.25]) { b.box(VC.solid, '#bcb4a4', px + e * (w / 2 + 0.04), (y0 + y1) / 2, pz + o * d, 0.1, y1 - y0 - 0.6, 0.36); b.box(VC.solid, '#bcb4a4', px + o * w, (y0 + y1) / 2, pz + e * (d / 2 + 0.04), 0.36, y1 - y0 - 0.6, 0.1); }   // its grooves
        b.box(VC.solid, '#e4dccc', px, y1 - 0.2, pz, w + 0.3, 0.4, d + 0.3);   // the ledge at the setback
      }
      b.block(VC.solid, '#c8c0b0', px, 27, pz, 2.2, 1.2, 4); b.box(VC.glow, hdr('#ffd9a0', 1.4), px, 28.35, pz, 1.4, 0.3, 2.6);   // the cap, its lamp
    }
  };
  // the ground of a land end: z from zA to zB (chunk-local), a cliff face at zA dropping into the fog
  const land = (b, zA, zB, { cliff = true, col = groundCol } = {}) => {
    for (const s of [-1, 1]) {
      b.box(VC.solid, col, s * (EDGE + 7 + 45), -0.2, (zA + zB) / 2, 90, 0.2, Math.abs(zB - zA));
      if (cliff) b.box(VC.solid, rock, s * (11.6 + 45), (SEA - 2) / 2, zA, 90, -SEA + 2, 3);
    }
    if (cliff) b.box(VC.solid, rock, 0, (SEA - 2) / 2 - 0.2, zA, 23.2, -SEA + 1.6, 3);
  };

  // ---------- the chunks ----------
  const approach = () => {   // the Presidio: the visitor plaza, the Round House, Strauss on his plinth, the trees; the bluff's edge
    const b = new Batcher();
    piece(b, 0);
    land(b, -DECK[0], 0);
    K.pave(b, -26, -30, 30, 40);
    b.cyl(VC.solid, '#e8e2d6', -30, 2.4, -24, 8.5, 4.8, 'cyl');   // the Round House: its band of windows and their mullions, the roof's deep overhang, the canopy over its door
    b.cyl(VC.glow, hdr('#ffe0b0', 1.0), -30, 2.6, -24, 8.55, 1.8, 'cyl');
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; b.box(VC.solid, '#e8e2d6', -30 + Math.sin(a) * 8.56, 2.6, -24 + Math.cos(a) * 8.56, 0.16, 1.82, 0.16, a); }   // (at the band's corners)
    b.cyl(VC.solid, '#d8d0c4', -30, 5.0, -24, 9.4, 0.5, 'cyl'); b.cyl(VC.solid, '#c8c0b2', -30, 4.7, -24, 9.0, 0.2, 'cyl');
    b.box(VC.solid, '#d8d0c4', -21.2, 3.1, -24, 1.6, 0.2, 3.4);
    b.block(VC.solid, '#6a645a', 13.6, 0, -34, 2.6, 0.5, 2.6); b.block(VC.solid, '#7a7468', 13.6, 0.5, -34, 2.2, 2.1, 2.2);   // Joseph Strauss in bronze on his plinth, the plaque on it
    b.box(VC.solid, '#a88a4a', 13.6 - 1.11, 1.5, -34, 0.02, 0.6, 1.0);
    figure(frame(b, 13.6, 2.6, -34, 1.6, Math.PI), VC.metal, '#5a4a34', { arms: 'out' });
    b.cyl(VC.metal, '#8a8e94', -14.5, 1.0, -44, 1.0, 0.7, 'cyl', Math.PI / 2);   // a slice of the main cable, its wires showing
    b.add(G.plane, K.label('GOLDEN GATE BRIDGE', { w: 1024, h: 160, color: '#f4ecd8', bg: '#5a3a24', font: '"Playfair Display", Georgia, serif', weight: 700, size: 0.5, k: 0.95 }), -13.2, 2.4, -12, 5.4, 0.85, 1, 0, Math.PI / 2, 0);
    b.box(VC.solid, '#5a3a24', -13.3, 1.0, -12, 0.2, 2.0, 0.3);
    K.crowd(b, -14, -38, 14, 50, 14, { camera: true });
    for (let k = 0; k < 16; k++) { const s = pick([-1, 1]), x = s * rand(18, 70), zz = -rand(2, 66); (chance(0.55) ? K.gum : K.cypress)(b, x, zz, rand(0.9, 1.3), chance(0.5) ? undefined : { ry: s > 0 ? Math.PI : 0 }); }
    return b;
  };
  const span = (S0) => () => { const b = new Batcher(); piece(b, S0); if (S0 === 240) freighter(b, 74, -36); return b; };
  const freighter = (b, x, zc) => {   // a container ship passing under the bridge, its bridge house and masts standing up out of the fog
    b.block(VC.solid, '#e8e4dc', x, SEA - 6, zc, 14, 14, 12);
    for (let k = 0; k < 4; k++) b.box(VC.glow, hdr('#ffe8c0', 1.2), x - 7.05, SEA + 4 + k * 1.6, zc + rand(-4, 4), 0.1, 0.8, 1.4);
    b.block(VC.solid, '#c83a2a', x + 2, SEA + 8, zc, 4, 5, 4);
    b.block(VC.solid, '#1a1a1e', x + 2, SEA + 13, zc, 4, 1, 4);
    for (const dz of [-30, 26]) { b.cyl(VC.solid, '#d8d4cc', x, SEA + 6, zc + dz, 0.4, 20, 'cyl8'); b.box(VC.solid, '#d8d4cc', x, SEA + 14, zc + dz, 8, 0.4, 0.4); b.box(VC.glow, hdr('#fff0d0', 2.2), x, SEA + 16.2, zc + dz, 0.4, 0.4, 0.4); }
    for (let k = 0; k < 6; k++) b.block(VC.solid, pick(['#c83a2a', '#2a5ab0', '#e8a030', '#3a8a5a', '#8a8a90']), x + rand(-5, 5), SEA - 2, zc + rand(-26, 22), 2.4, rand(1, 3), 6);
  };
  const marin = () => {   // the north end: the anchorage, the deck landing on the headlands, Vista Point, the golden hills
    const b = new Batcher(), S0 = 480;
    piece(b, S0);
    land(b, -(DECK[1] - S0), -CHUNK_LEN, { col: grass });
    K.road(b, -30, -46, 34, 40, 0.04);   // Vista Point's car park
    for (let k = 0; k < 8; k++) K.car(b, -18 - k * 2.6, -34 - (k % 2) * 16, 1, { y: 0.0 });
    b.block(VC.solid, '#b8b0a0', -13.2, 0, -46, 0.5, 1.0, 40);
    K.crowd(b, -12, -15, 26, 66, 16, { camera: true, ry: Math.PI });   // turned round to photograph the bridge
    b.cyl(VC.metal, '#d8dce0', -22, 7, -26, 0.1, 14, 'cyl6');
    b.add(G.plane, VC.solid, -21, 13, -26, 2.2, 1.2, 1, 0, 0, 0, '#c8202a');
    for (const s of [-1, 1]) for (const [x, zz, sx, sy, sz] of [[120, -40, 200, 130, 160], [70, -78, 120, 80, 90], [180, -10, 160, 90, 120]]) b.add(G.sphLow, VC.solid, s * (x + (s < 0 ? 60 : 0)), -24, zz, sx, sy, sz, 0, rand(0, 3), 0, s > 0 ? grass : '#9a8e58');   // (kept clear of Vista Point on the left)
    for (let k = 0; k < 10; k++) { const s = pick([-1, 1]); K.cypress(b, s * rand(16, 40), -rand(16, 76), rand(0.7, 1.1), { ry: s > 0 ? Math.PI : 0, lo: true }); }
    for (let k = 0; k < 8; k++) K.fogBuf.push([pick([-1, 1]) * rand(40, 120), rand(20, 50), -rand(10, 80)]);   // the fog spilling over the headlands
    return b;
  };
  // the Presidio's woods either side of the stretch: the road between groves of eucalyptus and cypress, a split-rail
  // fence, joggers and cyclists, now and then one of the old Army post's brick barracks with its white porch
  const forest = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) {
      K.kerbLane(b, s);
      b.box(VC.solid, '#5a5a3c', s * (EDGE + 7 + 45), -0.2, -CHUNK_LEN / 2, 90, 0.2, CHUNK_LEN);
      b.box(VC.solid, '#6a5038', s * 10.9, 0.9, -CHUNK_LEN / 2, 0.1, 0.1, CHUNK_LEN);
      b.box(VC.solid, '#6a5038', s * 10.9, 0.5, -CHUNK_LEN / 2, 0.1, 0.1, CHUNK_LEN);
      for (let zz = 1; zz < CHUNK_LEN; zz += 2.6) b.box(VC.solid, '#5a4430', s * 10.9, 0.55, -zz, 0.16, 1.1, 0.16);
      const bz = chance(0.4) ? rand(20, 60) : null;
      if (bz !== null) {   // a barracks: red brick, two storeys, the long white porch, its columns
        const x = s * 30;
        b.block(K.brickMat, '#c8826a', x, 0, -bz, 12, 8, 26);
        b.add(G.cone4, VC.solid, x, 9.2, -bz, 17, 2.4, 36.8, 0, 0, 0, '#4a4440');
        b.box(VC.solid, '#f4f0e8', x - s * 7, 3.2, -bz, 2.2, 0.25, 24);
        for (let k = 0; k < 9; k++) b.cyl(VC.solid, '#f4f0e8', x - s * 7.9, 1.6, -bz - 11 + k * 2.75, 0.12, 3.2, 'cyl8');
        for (let k = 0; k < 8; k++) for (const y of [2.2, 5.6]) b.box(VC.glow, hdr(pick(WARM_P), 0.9), x - s * 6.05, y, -bz - 10.5 + k * 3, 0.05, 1.4, 0.9);
      }
      for (let zz = rand(0, 4); zz < CHUNK_LEN; zz += rand(7, 10)) for (const xx of [rand(14, 22), rand(28, 46)]) {
        if (bz !== null && Math.abs(zz - bz) < 16 && xx < 40) continue;
        (chance(0.6) ? K.gum : K.cypress)(b, s * xx, -zz, rand(1.0, 1.6), { ry: (s > 0 ? 0 : Math.PI) + rand(-0.4, 0.4), lo: xx > 26 });   // the cypresses lean away from the road
      }
      for (let zz = rand(0, 5); zz < CHUNK_LEN; zz += rand(5, 8)) {   // the woods going on behind them: cheap dark crowns on bare trunks
        const xx = s * rand(50, 80), h = rand(9, 15);
        b.cyl(VC.solid, '#4a3a2c', xx, h * 0.35, -zz, 0.35, h * 0.7, 'cyl6');
        b.add(G.sphLow, VC.solid, xx, h * 0.78, -zz, rand(7, 10), h * 0.55, rand(7, 10), 0, rand(0, 3), 0, pick(['#2e4a2c', '#36532e', '#3e5a34', '#4a6038']));
      }
      for (let zz = rand(8, 14); zz < CHUNK_LEN - 2; zz += rand(26, 32)) K.lamp(b, s * 7.0, -zz, s);
      for (let k = randi(1, 3); k > 0; k--) K.person(b, s * rand(7.6, 10.2), -rand(3, 77), { ry: chance(0.5) ? 0 : Math.PI, top: pick(['#2a6ab0', '#e8502a', '#3a8a5a', '#1a1a1e']), legs: '#1a1a1e' });
      if (chance(0.6)) K.cyclist(b, s * rand(8, 10), -rand(4, 76), chance(0.5) ? 0 : Math.PI);
      if (chance(0.3)) K.dog(b, s * rand(8, 10), -rand(6, 74));
    }
    K.carRow(b, 5.25, 0, CHUNK_LEN, { p: 0.3 }); K.carRow(b, -5.25, 0, CHUNK_LEN, { p: 0.3 });
    for (let k = 0; k < 10; k++) { const x = rand(-13, 13); K.fogBuf.push([x, Math.abs(x) < 4.5 ? rand(9, 15) : rand(3, 11), -rand(2, 78)]); }
    return b;
  };
  // the two landmark chunks: the south tower and the north
  const southTower = () => { const b = new Batcher(); piece(b, 80); return b; };
  const northTower = () => { const b = new Batcher(); piece(b, 400); return b; };
  const done = (fn) => () => K.flushFog(fn().build());
  return {
    zones: { forest: done(forest), approach: done(approach), span1: done(span(160)), span2: done(span(240)), span3: done(span(320)), marin: done(marin) },
    landmarks: {
      goldenGate: { key: 'goldenGate', name: '金门大桥', en: 'GOLDEN GATE BRIDGE', build: done(southTower) },
      vista: { key: 'vista', name: '马林岬角 · 观景台', en: 'MARIN HEADLANDS · VISTA POINT', build: done(northTower) },
    },
    update(t) {
      st.offset.set(t * 0.0035, t * 0.0012);
      lampMat.color.set('#ff2a1a').multiplyScalar(Math.sin(t * 2.4) > 0.1 ? 3.2 : 0.35);
    },
  };
}
