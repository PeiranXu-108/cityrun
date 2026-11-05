// Across the Qiantang from Qianjiang New City, each on the far bank of its own river chunk (hz.js picks them by the
// chunk's zone), shaped after photographs:
//   杭州之门 the Gate of Hangzhou: two glass towers rising out of one U, turned toward the runner coming along the river,
//     a white line of light running down one tower, round the U and up the other, an arch through its foot;
//   大莲花 the Big Lotus, the Olympic stadium: a ring of 28 white petals leaning out over its plaza, floodlit pale blue,
//     the grey small petals showing between their rounded tops and the lit entrances between their points;
// and the two bridges the run passes under, both carried on over the walk and the track high enough for the jetpack:
//   彭埠大桥 the New Pengbu Bridge: a steel truss on five portal towers, the rigid chords swinging from each tower's top
//     down to the deck and up to the next like a run of tide waves, white hangers under them;
//   钱江三桥 the Third Bridge: a concrete deck hung from two red-and-white pylons, a harp of cables either side of each.
// Their materials thin the fog as the far bank's towers do, so they show from well up the river. A bridge returns the
// stretch of the chunk it crosses, for the city's towers on the right to leave it clear.
import { THREE, VC, G, std, basic, hdr, windowTex } from '../core.js';
import { facadeMat } from './common.js';
import { thinFog } from './ny_icons.js';

const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 40);
const TUBE = new THREE.CylinderGeometry(0.5, 0.5, 1, 40, 1, true);

export function acrossKit(K) {
  const FS = thinFog(std({ vertexColors: true, roughness: 0.78, metalness: 0.05, envMapIntensity: 0.55 }), 0.45);   // concrete, stone
  const FM = thinFog(std({ vertexColors: true, roughness: 0.38, metalness: 0.7 }), 0.45);                          // steel
  const FG = thinFog(basic({ vertexColors: true }), 0.3);                                                          // lights
  const FP = thinFog(basic({ vertexColors: true, side: THREE.DoubleSide }), 0.3);                                  // floodlit petals
  // the Gate's dark glass: ribbon windows, a floor lit right across now and then
  const gateTex = windowTex({ wall: '#141c28', glass: '#1a2a3e', lit: ['#bcd8ff', '#e8f2ff', '#ffe2b8'], litChance: 0.16, band: true, cols: 8, rows: 16 });
  const gateMat = thinFog(facadeMat(gateTex, { k: 1.05, rough: 0.25, metal: 0.65 }), 0.4);
  const _m = new THREE.Matrix4(), _t = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
  // a bar from (x0, y0) to (x1, y1) in the plane z (t thick in the plane, d deep across it), and one in the plane x
  const xy = (b, mat, col, x0, y0, x1, y1, z, t = 0.5, d = t) => b.add(G.box, mat, (x0 + x1) / 2, (y0 + y1) / 2, z, Math.hypot(x1 - x0, y1 - y0) + t * 0.5, t, d, 0, 0, Math.atan2(y1 - y0, x1 - x0), col);
  const yz = (b, mat, col, x, y0, z0, y1, z1, t = 0.5, d = t) => b.add(G.box, mat, x, (y0 + y1) / 2, (z0 + z1) / 2, d, t, Math.hypot(y1 - y0, z1 - z0) + t * 0.5, Math.atan2(-(y1 - y0), z1 - z0), 0, 0, col);
  const ROAD = '#1c2026', CONC = '#8a8f96';

  // a bridge's road lamps along both edges of its deck (top gives the road's height at x)
  const lamps = (b, x0, x1, zc, half, top, step = 14) => {
    for (let x = x0 + 4; x < x1; x += step) for (const z of [zc + half, zc - half]) { b.box(VC.metal, '#3a3f48', x, top(x) + 3, z, 0.2, 6, 0.2); b.box(FG, hdr('#ffe2b8', 2.2), x, top(x) + 6, z, 0.9, 0.25, 0.5); }
  };
  // the far end of a bridge comes down onto the south bank as a sloping viaduct on piers; the near end meets an
  // embankment block at the edge of the city's ground
  const ends = (b, zc, yb, yt, w, xa) => {
    const xg = -256, xe = 84, dx = xg - xa, a = Math.atan2(-(yt + 0.4), dx);
    b.add(G.box, FS, (xa + xg) / 2, (yt + 0.4) / 2 - 1.3, zc, Math.hypot(dx, yt + 0.4), 2.6, w, 0, 0, a + Math.PI, '#5a5e64');
    for (let x = xa - 22; x > xg + 10; x -= 22) { const y = (yt + 0.4) * (1 - (x - xa) / dx) - 2.6; b.block(FS, CONC, x, 0, zc, 3, y, w * 0.6); }
    b.block(FS, '#4a4e54', xe, 0, zc, 10, yt + 0.6, w + 2);
    b.box(FS, '#5a5e64', (40 + xe) / 2, yt - 1.7, zc, xe - 40, 3.4, w);
    b.box(FS, ROAD, (40 + xe) / 2, yt + 0.2, zc, xe - 40, 0.4, w - 0.6);
    b.block(FS, CONC, 30, 0, zc, 3.4, yb, w * 0.7);
    b.block(FS, CONC, 60, 0, zc, 3.4, yt - 3.4, w * 0.7);
    return (x) => (x < xa ? (yt + 0.4) * (1 - (x - xa) / dx) : yt + 0.4);
  };

  // ---------- 杭州之门 ----------
  const gate = (b) => {
    K.farBank(b, { n: 0 });
    const H = 112, D = 17, G2 = 0.116 * H, UB = 0.1 * H, X = -176, ZC = -40, Y0 = 3.2, RY = 0.74;
    const F = new THREE.Matrix4().makeRotationY(RY).setPosition(X, Y0, ZC);
    const inner = (y) => G2 * Math.sqrt(Math.max(0, 1 - (1 - (y - UB) / (0.885 * H)) ** 3));
    const outer = [[0.25, 0], [0.258, 0.3], [0.262, 0.55], [0.258, 0.8], [0.25, 0.935]].map(([u, v]) => [u * H, v * H]);
    const U = [];   // the inner edge, from the right tower's shoulder down to the bottom of the U
    for (let i = 0; i <= 24; i++) { const y = UB + (1 - i / 24) ** 2 * 0.885 * H; U.push([inner(y), y]); }
    const s = new THREE.Shape();
    s.moveTo(-0.25 * H, 0);
    for (let i = 0; i <= 12; i++) { const a = Math.PI * (1 - i / 12); s.lineTo(Math.cos(a) * 0.13 * H, Math.sin(a) * 0.07 * H); }   // the arch through its foot
    for (const [u, v] of outer) s.lineTo(u, v);
    s.quadraticCurveTo(0.245 * H, 0.99 * H, 0.185 * H, H); s.quadraticCurveTo(0.13 * H, H, G2, 0.985 * H);
    for (const [u, v] of U) s.lineTo(u, v);
    for (let i = U.length - 2; i >= 0; i--) s.lineTo(-U[i][0], U[i][1]);
    s.quadraticCurveTo(-0.13 * H, H, -0.185 * H, H); s.quadraticCurveTo(-0.245 * H, 0.99 * H, -0.25 * H, 0.935 * H);
    for (let i = outer.length - 2; i > 0; i--) s.lineTo(-outer[i][0], outer[i][1]);
    const g = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.5, bevelSegments: 1, curveSegments: 6 });
    g.translate(0, 0, -D / 2);
    const P = g.attributes.position, N = g.attributes.normal, UV = g.attributes.uv;   // the glass's windows in metres, on every face
    for (let i = 0; i < P.count; i++) UV.setXY(i, (Math.abs(N.getZ(i)) > 0.5 ? P.getX(i) : P.getX(i) + P.getZ(i)) / 11.2, P.getY(i) / 57.6);
    b.addM(g, gateMat, F, '#8ea2c0');
    // lines of light on its face toward the river
    const bar = (mat, col, x0, y0, x1, y1, w, z = D / 2 + 0.75) => {
      _t.compose(_v.set((x0 + x1) / 2, (y0 + y1) / 2, z), _q.setFromAxisAngle(Z, Math.atan2(y1 - y0, x1 - x0)), _s.set(Math.hypot(x1 - x0, y1 - y0) + w * 0.6, w, 0.25));
      b.addM(G.box, mat, _m.multiplyMatrices(F, _t), col);
    };
    const path = (pts, w, col) => { for (let i = 1; i < pts.length; i++) bar(FG, col, ...pts[i - 1], ...pts[i], w); };
    const onFace = U.map(([u, v]) => [u * (1 + 0.6 / G2), v]);
    path([[0.185 * H, 0.999 * H], [0.15 * H, 0.994 * H], ...onFace, ...onFace.slice(0, -1).reverse().map(([u, v]) => [-u, v]), [-0.15 * H, 0.994 * H], [-0.185 * H, 0.999 * H]], 0.8, hdr('#f4f8ff', 2.6));
    for (const e of [-1, 1]) path([...outer.map(([u, v]) => [e * (u - 0.4), v]), [e * 0.235 * H, 0.975 * H], [e * 0.185 * H, 0.999 * H]], 0.5, hdr('#bcd6ff', 1.1));
    const arch = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI * (i / 12); arch.push([Math.cos(a) * (0.13 * H - 0.3), Math.sin(a) * (0.07 * H - 0.3)]); }
    path(arch, 0.6, hdr('#ffe8c8', 1.8));
    for (const e of [-1, 1]) { bar(FM, '#3a4452', e * 0.185 * H, H - 1, e * 0.185 * H, H + 8, 0.5, 0); bar(FG, hdr('#ff3030', 4), e * 0.185 * H, H + 8.4, e * 0.185 * H, H + 8.4, 0.9, 0); }
    // the plaza it stands on, its edge lit
    _t.compose(_v.set(0, -Y0 / 2, 0), _q.identity(), _s.set(0.62 * H, Y0, D + 20)); b.addM(G.box, FS, _m.multiplyMatrices(F, _t), '#2a2e36');
    _t.compose(_v.set(0, -0.3, (D + 20) / 2 + 0.1), _q.identity(), _s.set(0.62 * H, 0.3, 0.2)); b.addM(G.box, FG, _m.multiplyMatrices(F, _t), hdr('#ffd9a8', 1.2));
    K.refl(b, X + 14, ZC + 6, 160, 3.2, '#eef4ff', { x0: 11.6 });
    K.refl(b, X - 12, ZC - 4, 150, 2.4, '#9fc0ff', { x0: 11.6 });
  };

  // ---------- 大莲花 ----------
  const lotus = (b) => {
    K.farBank(b, { n: 0 });
    const X = -164, ZC = -40, Y0 = 2.2, R0 = 33, R1 = 41, HP = 40, N = 28, A = (Math.PI / N) * 1.2;
    const r = (v) => R0 + (R1 - R0) * v ** 1.4;
    b.add(CYL, FS, X, Y0 / 2, ZC, 2 * (R1 + 4.5), Y0, 2 * (R1 + 4.5), 0, 0, 0, '#2c3038');
    b.add(TUBE, FG, X, Y0 + 0.2, ZC, 2 * (R1 + 4.1), 0.35, 2 * (R1 + 4.1), 0, 0, 0, hdr('#ffd9a8', 1.1));
    b.add(CYL, FS, X, Y0 + 0.21 * HP, ZC, 2 * (R0 - 1.2), 0.42 * HP, 2 * (R0 - 1.2), 0, 0, 0, '#141a22');   // the concourse
    b.add(TUBE, FG, X, Y0 + 4.5, ZC, 2 * (R0 - 1.1), 3, 2 * (R0 - 1.1), 0, 0, 0, hdr('#ffcf8a', 0.95));
    const band = new THREE.CylinderGeometry(r(0.97) - 1.4, r(0.42) - 1.4, 0.55 * HP, 56, 1, true);   // the small petals
    b.add(band, FG, X, Y0 + 0.695 * HP, ZC, 1, 1, 1, 0, 0, 0, hdr('#8a98ae', 0.5));
    // one big petal: pointed at its foot, widest a little above the middle, narrowing to a round top (so the grey
    // small petals show as wedges between the tops, the entrances as gaps a third of the way up); leaning out, bulging
    const f = (v) => (v <= 0.6 ? Math.sin((Math.PI / 2) * (v / 0.6)) ** 0.8 : v <= 0.9 ? 1 - 0.35 * ((v - 0.6) / 0.3) ** 2 : 0.65 * Math.sqrt(Math.max(0, 1 - ((v - 0.9) / 0.1) ** 2)));
    const pt = (u, v) => {   // the top curls in a little toward the roof
      const a = u * A * f(v), rr = r(v) + 1.5 * (1 - u * u) * Math.sin(Math.PI * Math.min(1, v * 1.08)) - 3 * Math.max(0, (v - 0.88) / 0.12) ** 2;
      return [Math.cos(a) * rr, Y0 + v * HP, Math.sin(a) * rr];
    };
    const lit = (u, v) => hdr('#cfe0ff', (0.6 + 0.34 * (1 - Math.abs(u))) * (0.8 + 0.2 * (1 - v)));
    const pos = [], col = [], V = (j) => Math.sin((Math.PI / 2) * (j / 14));   // rows closer together toward the round top
    for (let j = 0; j < 14; j++) for (let i = 0; i < 6; i++) {
      const u0 = -1 + i / 3, u1 = -1 + (i + 1) / 3, v0 = V(j), v1 = V(j + 1);
      for (const [u, v] of [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]]) { pos.push(...pt(u, v)); const c = lit(u, v); col.push(c.r, c.g, c.b); }
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    pg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    pg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
    pg.computeVertexNormals();
    for (let k = 0; k < N; k++) b.addM(pg, FP, _m.makeRotationY((k / N) * Math.PI * 2 + 0.06).setPosition(X, 0, ZC), null);
    K.refl(b, X + 36, ZC + 4, 150, 12, '#cfe0ff', { x0: 11.6 });
  };

  // ---------- 彭埠大桥 ----------
  const pengbu = (b) => {
    K.farBank(b, { n: 0 });
    const ZC = -40, ZE = [ZC + 12.5, ZC - 12.5], YB = 20, YT = 27, XA = -168, XB = 40, PN = 7.6;
    const T = [-148, -115, -82, -49, -16], SP = 33, TOP = YT + 16, STEEL = '#2e3644', WHITE = '#c9ced6';
    const top = ends(b, ZC, YB, YT, 26, XA);
    // the truss: chords, posts and diagonals on both faces, cross beams under it, the road on top
    for (const z of ZE) {
      b.box(FM, STEEL, (XA + XB) / 2, YB + 0.5, z, XB - XA, 1.0, 1.2);
      b.box(FM, STEEL, (XA + XB) / 2, YT - 0.5, z, XB - XA, 1.0, 1.2);
      for (let x = XA, k = 0; x < XB - 1; x += PN, k++) {
        b.box(FM, STEEL, x, (YB + YT) / 2, z, 0.6, YT - YB, 0.7);
        xy(b, FM, WHITE, x, k % 2 ? YB + 0.9 : YT - 0.9, x + PN, k % 2 ? YT - 0.9 : YB + 0.9, z, 0.45);
      }
      b.box(FM, STEEL, XB, (YB + YT) / 2, z, 0.6, YT - YB, 0.7);
      b.box(FG, hdr('#cfe6ff', 1.3), (XA + XB) / 2, YB - 0.06, z, XB - XA, 0.15, 0.4);
    }
    for (let x = XA; x <= XB; x += PN) b.box(FM, '#262c36', x, YB + 0.4, ZC, 0.6, 0.7, 25);
    b.box(FS, ROAD, (XA + XB) / 2, YT + 0.35, ZC, XB - XA, 0.7, 27);
    lamps(b, -256, 88, ZC, 13.2, top);
    for (const tx of T) {
      // the portal: two legs beside the truss, an arched head joining them, a red light on it
      for (const z of ZE) b.box(FM, STEEL, tx, (YB - 1 + TOP - 3) / 2, z + Math.sign(z - ZC) * 1.2, 2.4, TOP - 2 - YB, 2.4);
      for (let i = 0; i < 10; i++) {
        const z0 = ZE[0] + 1.2 - 27.4 * (i / 10), z1 = ZE[0] + 1.2 - 27.4 * ((i + 1) / 10);
        yz(b, FM, STEEL, tx, TOP - 3 + 2.5 * Math.sin((Math.PI * i) / 10), z0, TOP - 3 + 2.5 * Math.sin((Math.PI * (i + 1)) / 10), z1, 1.6, 2.0);
      }
      b.box(FG, hdr('#ff3030', 4), tx, TOP + 0.4, ZC, 0.8, 0.8, 0.8);
      // the chords from its top down to the deck halfway to the next tower, the hangers under them
      for (const z0 of ZE) for (const e of [-1, 1]) {
        const z = z0 + Math.sign(z0 - ZC) * 1.2, zo = z + Math.sign(z0 - ZC) * 0.62, pts = [];
        for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([tx + (e * SP * (1 - t)) / 2, YT + 0.5 + (TOP - 3.5 - YT - 0.5) * t * t]); }
        for (let i = 1; i < pts.length; i++) {
          xy(b, FM, STEEL, ...pts[i - 1], ...pts[i], z, 1.1);
          xy(b, FG, hdr('#d6ecff', 1.4), pts[i - 1][0], pts[i - 1][1] + 0.45, pts[i][0], pts[i][1] + 0.45, zo, 0.22);
          if (i % 2 === 0 && pts[i][1] - YT > 2.5) b.box(FS, '#c8ccd2', pts[i][0], (pts[i][1] + YT + 0.7) / 2, z, 0.22, pts[i][1] - YT - 0.7, 0.22);
        }
      }
      // its pier in the river (or on the far bank): a column under each leg, a cap beam across
      const y0 = tx < -118 ? 0 : -1.5;
      for (const z of ZE) b.block(FS, CONC, tx, y0, z + Math.sign(z - ZC) * 1.2, 3.6, YB - 2.2 - y0, 3.6);
      b.block(FS, '#9a9ea4', tx, YB - 2.2, ZC, 4.6, 1.2, 31);
      if (tx > -118) K.refl(b, tx, ZC + 15, 130, 2.2, '#d6ecff', { x0: 11.6 });
    }
    return [24, 56];
  };

  // ---------- 钱江三桥 ----------
  const third = (b) => {
    K.farBank(b, { n: 0 });
    const ZC = -40, YB = 20, YT = 24, XA = -160, XB = 40, P = [-50, -122], HT = 56, RED = '#c8323a', WHITE = '#eeeae4';
    const top = ends(b, ZC, YB, YT, 26, XA);
    b.box(FS, '#9a9da2', (XA + XB) / 2, (YB + YT) / 2, ZC, XB - XA, YT - YB, 26);   // the box girder
    b.box(FS, ROAD, (XA + XB) / 2, YT + 0.2, ZC, XB - XA, 0.4, 25.4);
    for (const e of [-1, 1]) b.box(FG, hdr('#ffd8a0', 0.9), (XA + XB) / 2, YB + 1.2, ZC + e * 13.05, XB - XA, 0.3, 0.1);
    b.block(FS, CONC, -86, -1.5, ZC, 4, YB + 1.5, 12); b.block(FS, '#9a9ea4', -86, YB - 0.8, ZC, 5, 0.8, 16);   // the pier between the pylons
    lamps(b, -256, 88, ZC, 12.4, top, 16);
    for (const px of P) {
      const y0 = -1.5;
      b.block(FS, CONC, px, y0, ZC, 9, 3, 16);   // its footing in the river
      b.block(FS, RED, px, y0 + 3, ZC, 4.2, YT + HT - y0 - 3, 5.6);
      for (let y = YT + 6; y < YT + HT - 6; y += 10) b.block(FS, WHITE, px, y, ZC, 4.32, 2.4, 5.72);
      for (let y = 6; y < YT - 2; y += 10) b.block(FS, WHITE, px, y, ZC, 4.32, 2.4, 5.72);
      b.block(FS, '#7a2228', px, YT + HT, ZC, 4.6, 1.6, 6);
      b.box(FG, hdr('#ff3030', 4), px, YT + HT + 2.2, ZC, 0.8, 0.8, 0.8);
      for (const e of [-1, 1]) b.box(FG, hdr('#ffd0c8', 0.7), px + e * 2.15, (YT + HT) / 2 + 4, ZC + 2.9, 0.12, YT + HT - 8, 0.12);   // floodlit edges
      // the harp: parallel cables either side, from the pylon's faces down to the middle of the deck
      for (let i = 0; i < 13; i++) {
        const yp = YT + 8 + (i * (HT - 10)) / 12, d = (yp - YT) * 0.64;
        for (const e of [-1, 1]) xy(b, FG, hdr('#efe6e0', 0.75), px + e * 2.2, yp, px + e * d, YT + 0.4, ZC, 0.3);
      }
      K.refl(b, px, ZC + 4, 150, 3, '#e05a62', { x0: 11.6 });
    }
    return [24, 56];
  };

  return { gate, lotus, pengbu, third };
}
