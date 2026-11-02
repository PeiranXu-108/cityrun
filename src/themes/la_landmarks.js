// Los Angeles's landmark scenes (the two on the beach are in la_beach.js), in route order: Union Station and Olvera
// Street; Disney Hall's steel sails and Angels Flight; the Sixth Street Viaduct's arches over the river; the Coliseum's
// peristyle and its flame; the glowing pylons of LAX and the Theme Building, a jet coming in over them; Urban Light;
// Beverly Hills and Rodeo Drive; the Sunset Strip's billboards and clubs over the lights of the basin; the Walk of Fame,
// the Chinese Theatre and a premiere; Griffith Observatory on its hill, the whole city spread out below it.
// Big buildings stand back from the track and well ahead; anything over the track is 11 m up or more.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, planeUV, buildingGeo, shade, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { at, farGround } from './common.js';
import { beam } from './tokyo_kit.js';
import { frame, frustum4 } from './ny_icons.js';
import { roofGeo } from './beijing_kit.js';
import { searchlight } from './la_icons.js';
import { quad } from './la_beach.js';
import { SANS, SERIF, SCRIPT, BLADE, DECO, NEON, X0, STUCCO, PASTEL, HOLLY_SIGNS, DOWNTOWN_SIGNS, GI, face, hipRoof, gableRoof } from './la_kit.js';

const ARCH = new THREE.TorusGeometry(0.5, 0.08, 6, 12, Math.PI);   // a half ring springing from y = 0 in the xy plane
const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
function gridTex() {   // the basin at night from the hills: the street grid in sodium orange, the boulevards brighter and whiter, windows between, the dark parks
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#1c1630'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) { g.fillStyle = pick(['rgba(255,200,120,0.55)', 'rgba(255,240,200,0.5)', 'rgba(200,220,255,0.4)']); g.fillRect(rand(0, w), rand(0, h), 1.4, 1.4); }
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 3) { g.fillStyle = `rgba(255,${randi(150, 190)},80,${rand(0.55, 0.95)})`; g.fillRect(x, y, 1.8, 1.8); }
    for (let x = 0; x < w; x += 32) for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(255,${randi(150, 190)},80,${rand(0.55, 0.95)})`; g.fillRect(x, y, 1.8, 1.8); }
    for (const y of [64, 256, 448]) for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(255,248,230,${rand(0.7, 1)})`; g.fillRect(x, y - 1, 1.6, 2.6); }   // the boulevards
    for (const x of [160, 384]) for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(255,${randi(120, 160)},120,${rand(0.6, 1)})`; g.fillRect(x - 1, y, 2.6, 1.6); }   // a freeway, its tail lights
    for (let k = 0; k < 6; k++) { g.fillStyle = '#120e20'; g.beginPath(); g.ellipse(rand(0, w), rand(0, h), rand(14, 34), rand(10, 24), rand(0, 3), 0, Math.PI * 2); g.fill(); }
  });
}
function veilTex() {   // the Broad's white honeycomb veil (its cells cut through)
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-out';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = c * 32 + (r % 2) * 16 + 16, y = r * 32 + 16; g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x + 11, y + 2); g.lineTo(x + 4, y + 12); g.lineTo(x - 9, y + 9); g.lineTo(x - 11, y - 3); g.closePath(); g.fill(); }
    g.globalCompositeOperation = 'source-over';
  });
}
// the Morse code for HOLLYWOOD, in quarter-second steps, that the light on the record tower blinks
const MORSE = (() => {
  const code = { H: '....', O: '---', L: '.-..', Y: '-.--', W: '.--', D: '-..' }, out = [];
  for (const c of 'HOLLYWOOD') { for (const m of code[c]) { out.push(...(m === '.' ? [1] : [1, 1, 1]), 0); } out.push(0, 0); }
  out.push(0, 0, 0, 0);
  return out;
})();

export function laLandmarks(K) {
  const gt = gridTex(); gt.repeat.set(6, 6);
  const gridMat = new THREE.MeshBasicMaterial({ map: gt, color: hdr('#ffffff', 1.3), fog: false });   // not bent with the world: it lies far below, out to the horizon
  const grids = [];
  // the lights of the basin spread out below a hill, as a plane of its own that only shows while its landmark is near
  const cityLights = (y, x0, x1, z0, z1) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z0 - z1), gridMat);
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.frustumCulled = false; m.visible = false;
    grids.push(m); return m;
  };
  const vt = veilTex(); vt.repeat.set(5, 3);
  const veilMat = std({ map: vt, alphaTest: 0.5, roughness: 0.6, side: THREE.DoubleSide });
  const led = [0, 1, 2].map(() => basic({ color: hdr('#ffffff', 2) }));   // LAX's pylons and the Theme Building, running through the colours
  const flameMat = basic({ color: hdr('#ff8a2a', 3.5) });
  const flash = [0, 1].map(() => basic({ color: hdr('#ffffff', 0.2) }));   // the photographers' flashes
  const morse = basic({ color: hdr('#ff2a1a', 3) });
  const extras = { jet: null, beams: [] };
  const bronze = '#6a5a3a', coral = '#c8483a';

  // a hillside quad between (x0, y0) and (x1, y1) along the whole chunk, a scatter of scrub on it
  const slope = (b, x0, y0, x1, y1, col, { scrub = 14, z0 = 0, z1 = -CHUNK_LEN } = {}) => {
    quad(b, VC.solid, x0, y0, x1, y1, z0, z1, { col });
    for (let k = 0; k < scrub; k++) { const t = Math.random(), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; b.add(G.sphLow, VC.solid, x, y + 0.3, rand(z1, z0), rand(1.4, 3), rand(0.8, 1.6), rand(1.4, 3), 0, rand(0, 3), 0, pick(['#4a5a34', '#5a6a3a', '#6a6a44', '#3e5030'])); }
  };
  const palmRow = (b, x, z0 = 2, z1 = 78, step = [13, 17]) => { for (let z = z0 + rand(0, 4); z < z1; z += rand(...step)) K.fanPalm(b, x, -z, rand(1.0, 1.2)); };

  // ---------- Union Station · Olvera Street ----------
  const stall = (b, x, z, side) => {   // an Olvera Street stall: the counter, its goods, the awning, the vendor behind it
    b.block(VC.solid, '#6a4a2a', x, 0, z, 1.0, 1.0, 2.6);
    for (let k = 0; k < 6; k++) b.add(pick([G.cyl8, G.sphLow, G.box]), VC.solid, x - side * 0.15, 1.15, z - 1.0 + k * 0.4, 0.3, rand(0.25, 0.45), 0.3, 0, 0, 0, pick(['#c8602a', '#2a6ad8', '#e8c040', '#8a4a2a', '#3a9a5a', '#e8302a', '#f4f0e8']));
    for (const e of [-1, 1]) b.cyl(VC.solid, '#5a3a24', x - side * 1.1, 1.45, z + e * 1.25, 0.05, 2.9, 'cyl6');   // the awning's posts
    for (let k = 0; k < 2; k++) { const pz = z + rand(-1, 1); b.add(G.cone4, VC.solid, x - side * 0.3, 2.3, pz, 0.5, 0.6, 0.5, Math.PI, rand(0, 3), 0, pick(['#ff3d9a', '#ffd23d', '#39c8e8', '#ff7a2a'])); b.box(VC.solid, '#e8e4dc', x - side * 0.3, 2.75, pz, 0.02, 0.4, 0.02); }   // piñatas hung from the awning
    b.add(G.box, VC.solid, x - side * 0.3, 2.85, z, 2.0, 0.06, 2.8, 0, 0, side * 0.28, pick(['#c8302a', '#2a8a4a', '#e8a020', '#2a5ab0', '#7a2a6a']));
    K.person(b, x + side * 0.9, z + rand(-0.6, 0.6), { ry: side < 0 ? Math.PI / 2 : -Math.PI / 2, shades: false });
  };
  const union = () => {
    const b = new Batcher();
    // the right: Union Station behind its forecourt, white walls under red tile, the arched entrance, the clock tower; palms
    K.kerbLane(b, 1, { x1: 12 }); farGround(b, 1, '#8a7a62');
    K.pave(b, 21, -45, 18, 72, 0.035); K.lawn(b, 15, -46, 5, 56, '#4a7a34', 0.04);
    const F = frame(b, 30, 0, -46, 1, face(1)), wall = '#f2e6d8', L = 64, D = 18, H = 11;
    F.addM(K.tiledBox(L, H + 1, D, 2.5), K.stuccoMat, T(0, (H - 1) / 2, -D / 2), wall);
    F.addM(hipRoof(L + 1, D + 1, 3.4), K.tileMat, T(0, H, 0.5), '#ffffff');
    for (let k = 0; k < 13; k++) { const x = -29 + k * 4.8; if (Math.abs(x - 6) < 6 || Math.abs(x + 12) < 5) continue; K.archWin(F, x, 4.6, 0.03, 1.8, 3.4, hdr('#ffd9a0', rand(0.8, 1.1)), '#d8c8b0'); }
    F.addM(K.tiledBox(13, 15.5, 4, 2.5), K.stuccoMat, T(6, 7.75, 1.5), wall);   // the entrance block, its great arch, the name over it
    F.box(VC.solid, '#3a2a20', 6, 3.8, 3.54, 7, 7.6, 0.06); F.add(G.cyl, VC.solid, 6, 7.6, 3.54, 7, 0.06, 7, Math.PI / 2, 0, 0, '#3a2a20');
    F.box(VC.glow, hdr('#ffe0b0', 1.0), 6, 3.4, 3.58, 5.8, 6.2, 0.03);
    K.sign(F, 'UNION STATION', { w: 1024, h: 128, color: '#4a2a1a', font: DECO, size: 0.7, k: 1.0 }, 6, 13.3, 3.58, 10, 1.25, 1);
    F.addM(gableRoof(13.6, 5, 2.6), K.tileMat, T(6, 15.5, 3.8), '#ffffff');
    F.addM(K.tiledBox(8, 32, 8, 2.5), K.stuccoMat, T(-12, 15, -4), wall);   // the clock tower
    for (const y of [16, 20]) K.archWin(F, -12, y, 0.03, 1.2, 2.2, hdr('#ffd9a0', 0.9), '#d8c8b0');
    for (const [x, z, ry] of [[-12, 0.06, 0], [-7.94, -4, Math.PI / 2]]) {
      F.add(G.cyl, VC.glow, x, 26, z, 4.2, 0.1, 4.2, Math.PI / 2, ry, 0, hdr('#fff0d8', 0.9));
      F.add(G.box, VC.solid, x + (ry ? 0.06 : 0), 26.6, z + (ry ? 0 : 0.06), ry ? 0.03 : 0.16, 1.4, ry ? 0.16 : 0.03, 0, 0, 0, '#1a1a1a');
      F.add(G.box, VC.solid, x + (ry ? 0.06 : 0), 26, z + (ry ? -0.5 : 0.06), ry ? 0.03 : 1.1, 0.16, ry ? 1.1 : 0.03, 0, 0, 0, '#1a1a1a');
    }
    F.addM(hipRoof(9.4, 9.4, 4.6), K.tileMat, T(-12, 31, 0.7), '#ffffff');
    for (const [x, z] of [[17, -16], [24, -30], [17, -62], [24, -74]]) K.palm(b, x, z, rand(1.1, 1.3));
    palmRow(b, 9.2, 2, 78, [14, 18]);
    for (let z = 10; z < 76; z += 16) K.lamp(b, 12.6, -z, 1, { kind: 'twin' });
    K.crowd(b, 13, 26, 4, 76, 14, { bag: true });
    for (let k = 0; k < 3; k++) K.car(b, 5.2, -rand(8, 72), pick([-1, 1]), { kind: pick(['sedan', 'suv']), col: '#f2c230', lit: true });   // the taxis at the kerb
    // the left: Olvera Street's stalls under papel picado, the old adobe, the plaza with its kiosk and figs, the Plaza church
    K.kerbLane(b, -1, { x1: 12 }); farGround(b, -1, '#7a6a52');
    K.pave(b, -26, -40, 28, 80, 0.035);
    for (let z = 5; z < 46; z += 3.2) for (const x of [-13.8, -19.6]) stall(b, x, -z, x < -16 ? 1 : -1);
    K.papelZ(b, -16.7, 4.4, 3, 46, { sag: 0.4 }); K.papelZ(b, -15.9, 4.2, 3, 46, { sag: 0.35 });
    for (const x of [-13.2, -20.2]) b.cyl(VC.solid, '#6a4a2a', x, 2.2, -2.2, 0.12, 4.4, 'cyl8');
    K.sign(b, 'CALLE OLVERA', { w: 512, h: 128, color: '#ffd23d', bg: '#6a2a1a', font: SCRIPT, size: 0.6, k: 1.2 }, -16.7, 4.0, -2.2, 7.0, 1.4, 1);
    for (const [x, z] of [[-16.7, -46], [-15.9, -46]]) b.cyl(VC.solid, '#6a4a2a', x, 2.3, z, 0.07, 4.6, 'cyl6');   // the poles the papel picado is strung to
    const A = frame(b, -30, 0, -26, 1, face(-1));   // the adobe: thick walls, the vigas poking out, its porch
    A.addM(K.tiledBox(12, 4.2, 8, 2.5), K.stuccoMat, T(0, 2.1, -4), '#c8a882');
    for (let x = -5.5; x <= 5.5; x += 1.1) A.cyl(VC.solid, '#5a3a24', x, 3.9, 0.3, 0.1, 0.8, 'cyl6', Math.PI / 2);
    A.box(VC.solid, '#6a4a2a', 0, 3.0, 1.6, 12, 0.15, 3.2); for (const x of [-5.6, -1.9, 1.9, 5.6]) A.box(VC.solid, '#5a3a24', x, 1.5, 3.0, 0.2, 3.0, 0.2);
    A.box(VC.glow, hdr('#ffd9a0', 0.9), -2.5, 1.4, 0.04, 1.0, 1.6, 0.04); A.box(VC.solid, '#3a2418', 2, 1.1, 0.04, 1.0, 2.2, 0.04);
    b.block(VC.solid, '#b8b0a4', -24, 0, -46, 6, 0.6, 6);   // the kiosk in the plaza
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.cyl(VC.solid, '#f2ece0', -24 + Math.cos(a) * 2.6, 2.4, -46 + Math.sin(a) * 2.6, 0.12, 3.6, 'cyl8'); }
    b.add(G.cone8, VC.solid, -24, 5.0, -46, 7.4, 2.0, 7.4, 0, 0, 0, '#c8603a'); b.box(VC.glow, hdr('#ffe0b0', 1.6), -24, 3.9, -46, 0.4, 0.3, 0.4);
    K.mariachi(b, -21, -46, 1);
    for (const [x, z] of [[-36, -40], [-22, -66]]) K.fig(b, x, z, rand(1.0, 1.2));
    const C = frame(b, -32, 0, -62, 1, face(-1));   // the Plaza church: its white front and the bell wall over it, the tile roof behind
    C.addM(K.tiledBox(12, 10, 22, 2.5), K.stuccoMat, T(0, 5, -11), '#f4f0e8');
    C.addM(gableRoof(12.6, 22.4, 3), K.tileMat, T(0, 10, 0.2), '#ffffff');
    const bell = new THREE.Shape(); bell.moveTo(-4, 0); bell.lineTo(4, 0); bell.lineTo(4, 4); bell.lineTo(2, 4); bell.lineTo(2, 6); bell.absarc(0, 6, 2, 0, Math.PI, false); bell.lineTo(-2, 4); bell.lineTo(-4, 4); bell.closePath();
    C.addM(new THREE.ExtrudeGeometry(bell, { depth: 0.6, bevelEnabled: false }), VC.solid, T(0, 10, -0.3), '#f4f0e8');
    for (const [x, y] of [[-2, 11.8], [2, 11.8], [0, 15.4]]) { C.box(VC.solid, '#2a2420', x, y, 0.34, 1.1, 1.6, 0.04); C.ell(VC.metal, '#b8903a', x, y - 0.1, 0.4, 0.35, 0.45, 0.3, true); }
    C.box(VC.solid, '#3a2418', 0, 2.2, 0.04, 2.4, 4.4, 0.06); C.add(G.cyl, VC.solid, 0, 4.4, 0.04, 2.4, 0.06, 2.4, Math.PI / 2, 0, 0, '#3a2418');
    C.box(VC.solid, '#f4f0e8', 0, 18.6, 0, 0.2, 1.6, 0.2); C.box(VC.solid, '#f4f0e8', 0, 18.9, 0, 0.9, 0.2, 0.2);
    K.crowd(b, -14, -36, 48, 78, 16, { camera: chance(0.4) });
    for (let z = 52; z < 78; z += 10) K.lamp(b, -12.6, -z, -1, { kind: 'twin' });
    return b;
  };

  // ---------- Disney Hall · Angels Flight ----------
  // a sail of the concert hall: a curved sheet of steel, R its radius, H tall, a of arc, standing at (x, z) turned ry, leaning
  const steel = std({ vertexColors: true, roughness: 0.28, metalness: 0.8, side: THREE.DoubleSide });
  const sail = (b, x, y, z, R, H, a, ry, lean) => {
    const g = new THREE.CylinderGeometry(R, R * 1.08, H, 10, 1, true, 0, a);
    b.addM(g, steel, new THREE.Matrix4().compose(new THREE.Vector3(x, y + H / 2, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(lean, ry, 0, 'YXZ')), new THREE.Vector3(1, 1, 1)), '#e8e0dc');
  };
  const bunker = () => {
    const b = new Batcher();
    // the left: the Broad's white honeycomb veil nearest; the concert hall's steel sails over their stone base, the lobby lit
    K.kerbLane(b, -1, { x1: 12.4 }); farGround(b, -1, '#5a6250');
    K.pave(b, -26, -40, 27, 80, 0.035);
    b.block(VC.solid, '#2a2c34', -32, 0, -18, 22, 12, 22);
    b.add(G.plane, veilMat, -20.9, 6.4, -18, 22.2, 12.6, 1, 0, Math.PI / 2, 0); b.add(G.plane, veilMat, -32, 6.4, -6.9, 22.2, 12.6, 1, 0, 0, 0);
    b.box(VC.glow, hdr('#ffe8c8', 0.7), -21.2, 1.8, -18, 0.05, 3.4, 18);
    b.block(VC.solid, '#a89888', -46, 0, -60, 36, 4, 40);   // the hall's base, its lobby glazed
    b.box(VC.glow, hdr('#ffe0b0', 0.65), -27.9, 2.2, -60, 0.05, 3.4, 30);
    for (const [x, z, R, H, a, ry, lean] of [[-36, -48, 14, 26, 1.6, 2.4, 0.12], [-40, -56, 18, 34, 1.4, 2.9, -0.1], [-44, -66, 15, 30, 1.7, 3.6, 0.15], [-34, -74, 12, 22, 1.5, 2.0, -0.18], [-50, -52, 20, 38, 1.2, 1.6, 0.08], [-48, -76, 16, 28, 1.6, 4.1, 0.1], [-30, -60, 10, 18, 1.8, 2.7, 0.2]])
      sail(b, x, 4, z, R, H, a, ry, lean);
    palmRow(b, -9.4, 2, 78, [16, 20]);
    for (let z = 8; z < 76; z += 18) K.lamp(b, -12.8, -z, -1, { kind: 'twin' });
    K.crowd(b, -13.5, -26, 4, 76, 12);
    // the right: Angels Flight up the face of Bunker Hill from the street, its two little cars, the arch at its foot; the
    // hill's towers on top; Grand Central Market's neon at the street further on
    K.kerbLane(b, 1, { x1: 12 }); farGround(b, 1, '#6a6a58');
    const HY = 20, HX0 = 16, HX1 = 44, zI = -30, ang = Math.atan2(HY, HX1 - HX0);
    slope(b, HX0, 0, HX1, HY, '#5a6a42', { scrub: 22 });
    b.block(VC.solid, '#7a7a6a', 92, 0, -40, 96, HY, CHUNK_LEN);   // the hilltop
    K.lawn(b, 60, -40, 32, 80, '#4a6a34', HY + 0.03);
    for (let z = 4; z < 78; z += rand(18, 26)) { const H = rand(80, 160), W = rand(26, 36); b.addM(buildingGeo(W, H, W, K.glassT, 1.6, 3.6), K.glassMat, at(84 + W / 2, HY, -z - W / 2), pick(['#e8f0ff', '#dce8f4', '#ffffff'])); z += W; }
    const R = frame(b, HX0, 0, zI, 1, 0);   // the incline: its bed up the slope, the rails, the cars on it
    R.span(G.box, VC.solid, '#6a5a4a', [0, 0.4, 0], [HX1 - HX0, HY + 0.4, 0], 0.8, 3.2);
    for (const e of [-0.9, 0.9]) R.span(G.box, VC.metal, '#c8ccd4', [0, 0.85, e], [HX1 - HX0, HY + 0.85, e], 0.12, 0.12);
    for (const [t, name] of [[0.12, 'SINAI'], [0.72, 'OLIVET']]) {
      const cx = HX0 + (HX1 - HX0) * t, cy = HY * t + 2.2;
      b.add(G.box, VC.solid, cx, cy, zI, 4.2, 2.6, 2.4, 0, 0, ang * 0.35, '#e8652a');
      b.add(G.box, VC.solid, cx, cy - 0.95, zI, 4.25, 0.5, 2.45, 0, 0, ang * 0.35, '#1a1a1a');
      for (const e of [-1, 1]) b.add(G.box, VC.glow, cx, cy + 0.35, zI + e * 1.22, 3.4, 0.9, 0.04, 0, 0, ang * 0.35, hdr('#ffe0b0', 1.2));
      K.sign(b, name, { w: 256, h: 64, color: '#1a1a1a', font: SERIF, weight: 700, size: 0.6, k: 0.9 }, cx, cy + 1.0, zI + 1.23, 1.6, 0.4, 1, 0, 0, ang * 0.35);
    }
    const ab = frame(b, 13.4, 0, zI + 0.4, 1, -0.5);   // the arch at the foot of the incline
    for (const e of [-1, 1]) ab.box(VC.solid, '#e8652a', e * 2.6, 2.6, 0, 0.7, 5.2, 0.7);
    ab.addM(ARCH, VC.solid, new THREE.Matrix4().makeScale(5.2, 4, 4).setPosition(0, 5.2, 0), '#e8652a');
    ab.box(VC.solid, '#1a1a1a', 0, 6.2, 0.05, 4.6, 0.9, 0.2);
    K.sign(ab, 'ANGELS FLIGHT', { w: 512, h: 96, color: '#ffd890', font: DECO, size: 0.62, k: 1.6 }, 0, 6.2, 0.16, 4.4, 0.82, 1);
    b.block(VC.solid, '#e8dcc8', HX1 + 3, HY, zI, 6, 4, 6); b.add(G.cone4, VC.solid, HX1 + 3, HY + 5, zI, 6.6, 2, 6.6, 0, 0, 0, '#e8652a');   // the station at the top
    const M = frame(b, 12.4, 0, -64, 1, face(1));   // Grand Central Market: the open front under its neon
    M.addM(K.tiledBox(26, 9, 6, 2.5), K.stuccoMat, T(0, 4.5, -3), '#e8d8c0');
    M.box(VC.glow, hdr('#ffe0b0', 1.1), 0, 2.4, 0.04, 22, 4.4, 0.04);
    for (let k = 0; k < 7; k++) K.board(M, K.goodsRects[pick([GI.fruit, GI.taqueria, GI.cafe, GI.pandulce, GI.grocery])], -10 + k * 3.3, 2.2, 0.08, 3.0, 3.6, 1, 0, 0, 0);
    K.sign(M, 'GRAND CENTRAL MARKET', { w: 1024, h: 128, color: '#ff4a2a', font: NEON, size: 0.6, glow: '#ff4a2a', k: 2.4 }, 0, 7.2, 0.08, 20, 2.4, 1);
    K.crowd(b, 13, 15, 44, 78, 10);
    palmRow(b, 8.6, 2, 40, [16, 20]);
    return b;
  };

  // ---------- the Sixth Street Viaduct ----------
  const viaduct = () => {
    const b = new Batcher(), DZ = -46, DY = 16, W = 18;
    // the river on the left: its concrete channel, the far slope painted over, the thin stream down the middle; rail yards beyond
    b.box(VC.metal, '#5a5e64', -11.2, 0.6, -40, 0.06, 1.2, 80); for (let z = 1; z < 80; z += 2.5) b.box(VC.metal, '#5a5e64', -11.2, 0.6, -z, 0.06, 1.2, 0.06);
    quad(b, VC.solid, -22, -8, -11.4, 0, 0, -CHUNK_LEN, { col: '#9a948c' });
    quad(b, VC.solid, -54, -8, -22, -8, 0, -CHUNK_LEN, { col: '#8a847c' });
    quad(b, VC.solid, -64, 0, -54, -8, 0, -CHUNK_LEN, { col: '#a8a29a' });
    quad(b, K.water, -40, -7.9, -35, -7.9, 0, -CHUNK_LEN, { ku: 8, kv: 8 });
    for (let k = 0; k < 6; k++) b.add(planeUV(K.muralRects[k % 6]), K.muralMat, -58.6, -4, -6 - k * 12.5, 11, 8, 1, -0.895, Math.PI / 2, 0);   // graffiti all down the far slope
    b.box(VC.solid, '#6a6258', -100, -0.2, -40, 72, 0.2, 80);
    for (let k = 0; k < 4; k++) { const x = -70 - k * 7; b.box(VC.metal, '#5a5048', x, 0.1, -40, 1.6, 0.2, 80); if (chance(0.7)) for (let j = 0; j < 4; j++) b.block(VC.solid, pick(['#8a3a2a', '#2a4a6a', '#c88a2a', '#4a4a50']), x, 0.2, -rand(4, 76), 3, 3.6, 14); }   // the rail yard and its freight cars
    // the viaduct: the deck across the river high over the track, its arches in leaning pairs lit white, the hangers, the piers
    b.box(VC.solid, '#d8d4cc', 0, DY, DZ, 440, 1.6, W);
    for (const e of [-1, 1]) { b.box(VC.solid, '#e8e4dc', 0, DY + 1.2, DZ + e * (W / 2 - 0.2), 440, 1.0, 0.3); b.box(VC.glow, hdr('#e8f0ff', 2.0), 0, DY - 0.75, DZ + e * (W / 2 + 0.02), 440, 0.12, 0.05); }
    for (const cx of [-140, -70, 0, 70, 140]) for (const e of [-1, 1]) {
      const pts = [];
      for (let k = 0; k <= 16; k++) { const u = (k / 16) * 2 - 1, y = DY + 0.8 + 19 * (1 - u * u); pts.push([cx + u * 33, y, DZ + e * (W / 2 + (y - DY) * 0.18)]); }
      for (let k = 1; k < pts.length; k++) { beam(b, VC.solid, ...pts[k - 1], ...pts[k], 1.1, '#f0ece4'); beam(b, VC.glow, pts[k - 1][0], pts[k - 1][1] + 0.65, pts[k - 1][2], pts[k][0], pts[k][1] + 0.65, pts[k][2], 0.2, hdr('#eef4ff', 2.6)); }
      for (let k = 2; k < 15; k += 2) beam(b, VC.metal, pts[k][0], pts[k][1], pts[k][2], pts[k][0], DY + 0.8, DZ + e * (W / 2 - 0.3), 0.06, '#c8ccd4');
    }
    const channelY = (x) => (x > -11.4 ? 0 : x > -22 ? -8 + ((x + 22) / 10.6) * 8 : x > -54 ? -8 : x > -64 ? -(x + 64) * 0.8 : 0);
    for (const px of [-120, -45, -18, 16, 50, 95]) for (const e of [-1, 1]) beam(b, VC.solid, px, channelY(px) - 1, DZ, px + e * 2.5, DY - 0.8, DZ + e * 5, 1.6, '#c8c4bc');
    K.crowd(b, -60, 60, 38, 40, 10, { y: DY + 0.8, ry: 0 });
    // the right: the Arts District's old warehouses, their murals and string lights, the brewery at the corner
    K.kerbLane(b, 1, { x1: 12.4 }); farGround(b, 1, '#6a5a4a');
    for (let z = 0; z < 76;) {
      const L = Math.min(rand(16, 24), 80 - z), H = rand(9, 15), zc = -(z + L / 2), col = pick(['#a8503a', '#8a4a34', '#b8846a', '#c8b8a0', '#6a6a6a']);
      b.addM(K.tiledBox(18, H, L, 2.5), K.stuccoMat, T(12.4 + 9, H / 2, zc), col);
      for (let y = 3.6; y < H - 1; y += 3.4) for (let zz = z + 1.6; zz < z + L - 1.2; zz += 3) b.box(VC.glow, K.glass(0.4, true), 12.38, y, -zz, 0.04, 1.8, 2.0);
      if (chance(0.6)) K.mural(b, 12.4, H * 0.55, zc, 1, L - 2, H * 0.7, randi(0, 5));
      else { b.box(VC.solid, '#3a3a3e', 12.36, 1.8, zc, 0.06, 3.4, Math.min(5, L - 2)); for (let k = 0; k < 8; k++) b.box(VC.solid, '#4a4a50', 12.33, 0.3 + k * 0.42, zc, 0.02, 0.04, Math.min(5, L - 2)); }
      if (chance(0.4)) { b.cyl(VC.solid, '#6a4a2a', 21, H + 3, zc, 2.2, 4, 'cyl8'); b.add(G.cone8, VC.solid, 21, H + 5.6, zc, 4.8, 1.4, 4.8, 0, 0, 0, '#5a3a24'); for (const e of [-1, 1]) for (const f of [-1, 1]) b.cyl(VC.metal, '#3a3a3e', 21 + e * 1.6, H + 0.5, zc + f * 1.6, 0.08, 1.0, 'cyl6'); }   // a water tank on the roof
      z += L + 0.3;
    }
    for (let k = 0; k < 12; k++) b.sph(VC.glow, hdr('#ffd890', 2.2), 9.6, 4.2 - Math.sin((k / 11) * Math.PI) * 0.6, -12 - k * 1.6, 0.07, true);
    for (let k = 0; k < 11; k++) beam(b, VC.solid, 9.6, 4.2 - Math.sin((k / 11) * Math.PI) * 0.6, -12 - k * 1.6, 9.6, 4.2 - Math.sin(((k + 1) / 11) * Math.PI) * 0.6, -12 - (k + 1) * 1.6, 0.015, '#1a1a1a');
    for (const z of [-12, -29.6]) b.cyl(VC.metal, '#3a3a3e', 9.6, 2.1, z, 0.05, 4.2, 'cyl6');
    K.crowd(b, 7.5, 11.8, 4, 76, 10);
    K.carRow(b, 5.25, 0, CHUNK_LEN, { p: 0.5 });
    return b;
  };

  // ---------- the Coliseum ----------
  const coliseum = () => {
    const b = new Batcher();
    // the right: the peristyle, its colonnade of arches either side of the great arch, the cauldron burning on top; the bowl behind
    K.kerbLane(b, 1, { x1: 12 }); farGround(b, 1, '#5a6a40');
    K.lawn(b, 22, -40, 20, 80, '#4a7a34', 0.04);
    const F = frame(b, 36, 0, -54, 1, face(1)), stone = '#c8a884';
    F.box(VC.solid, shade(stone, 0.9), 0, 1, -3, 64, 2, 10);
    for (const side of [-1, 1]) for (let k = 0; k <= 6; k++) {
      const x = side * (8 + k * 3.8);
      F.box(VC.solid, stone, x, 9, 0, 1.4, 14, 2.4);
      if (k < 6) { F.addM(ARCH, VC.solid, new THREE.Matrix4().makeScale(3.8, 3.8, 4).setPosition(x + side * 1.9, 16, 0), stone); F.box(VC.glow, hdr('#ffe8c0', 0.9), x + side * 1.9, 9, -0.9, 2.2, 13, 0.1); }
    }
    for (const side of [-1, 1]) F.box(VC.solid, stone, side * 31, 17.6, 0, 46 / 2 - 1, 3.2, 2.6);   // the colonnades' entablature
    for (const side of [-1, 1]) F.box(VC.solid, stone, side * 5.5, 13, 0, 5, 24, 4);   // the great arch's piers, its opening, the attic on it
    F.addM(ARCH, VC.solid, new THREE.Matrix4().makeScale(6, 6, 6).setPosition(0, 19, 0), stone);
    F.box(VC.glow, hdr('#ffe8c0', 1.0), 0, 10, -1.6, 5.6, 18, 0.1);
    F.box(VC.solid, stone, 0, 25.5, 0, 16, 3, 4.4);
    K.sign(F, 'LOS ANGELES MEMORIAL COLISEUM', { w: 1024, h: 96, color: '#5a4a3a', font: SERIF, weight: 700, size: 0.55, k: 0.9 }, 0, 25.5, 2.22, 15, 1.4, 1);
    F.addM(frustum4(4, 6, 1.6), VC.solid, T(0, 27, 0), stone);
    F.add(new THREE.CylinderGeometry(2.6, 1.0, 1.8, 14), VC.metal, 0, 29.5, 0, 1, 1, 1, 0, 0, 0, '#a8803a');
    F.add(G.cone8, flameMat, 0, 31.6, 0, 3.2, 3.6, 3.2, 0, 0, 0, 0xffffff); F.add(G.cone8, VC.glow, 0, 31.2, 0, 1.8, 2.4, 1.8, 0, 0, 0, hdr('#ffe07a', 4));
    K.smokeBuf.push(F.at(0, 33.5, 0).toArray());
    b.addM(new THREE.CylinderGeometry(88, 80, 26, 40, 1, true, -Math.PI / 2 - 0.9, 1.8), VC.solid, T(36 + 86, 13, -54), '#c8b898');   // the bowl's outer wall
    palmRow(b, 9.4, 2, 78, [22, 28]);
    for (let z = 10; z < 76; z += 18) K.lamp(b, 12.4, -z, 1, { kind: 'twin' });
    K.crowd(b, 14, 30, 4, 76, 14, { camera: chance(0.4) });
    // the left: Exposition Park's rose garden, its beds and pergolas, the fountain; the museum's dome over the trees
    K.kerbLane(b, -1, { x1: 12 }); farGround(b, -1, '#4a6a3a');
    K.lawn(b, -38, -40, 52, 80, '#4a7a34', 0.04);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
      const bx = -20 - c * 22, bz = -10 - r * 16;
      b.block(VC.solid, '#5a4030', bx, 0, bz, 9, 0.3, 5);
      for (let k = 0; k < 18; k++) b.add(G.sphLow, VC.solid, bx + rand(-4, 4), 0.52, bz + rand(-2.2, 2.2), 0.55, 0.55, 0.55, 0, 0, 0, pick(['#e8203a', '#ff6a8a', '#f4f0f0', '#ffd23d', '#c8183a', '#ff9ab8']));
      for (let k = 0; k < 6; k++) b.add(G.sphLow, VC.solid, bx + rand(-4, 4), 0.45, bz + rand(-2.2, 2.2), 0.8, 0.6, 0.8, 0, 0, 0, '#2e5a2a');
    }
    b.cyl(VC.solid, '#c8c0b4', -31, 0.4, -42, 5, 0.8, 'cyl'); b.add(G.cyl, K.water, -31, 0.82, -42, 9, 0.02, 9, 0, 0, 0, 0xffffff);
    b.add(G.cone8, VC.glow, -31, 2.4, -42, 0.8, 3.6, 0.8, 0, 0, 0, hdr('#e8f4ff', 1.4));
    for (const x of [-14, -48]) for (let z = 6; z < 74; z += 4) { for (const e of [-1, 1]) b.box(VC.solid, '#f4f0e8', x + e * 1.4, 1.5, -z, 0.25, 3, 0.25); b.box(VC.solid, '#f4f0e8', x, 3.1, -z, 3.2, 0.2, 0.3); }   // the pergolas
    const N = frame(b, -62, 0, -70, 1, face(-1));   // the Natural History Museum: brick and tile, its dome
    N.addM(K.tiledBox(40, 14, 18, 2.5), K.stuccoMat, T(0, 7, -9), '#b8684a');
    N.cyl(VC.solid, '#c8b8a0', 0, 17, -9, 7, 6, 'cyl'); N.ell(VC.solid, '#c8603a', 0, 20, -9, 7, 6, 7);
    for (let k = -3; k <= 3; k++) K.archWin(N, k * 5, 6, 0.03, 2.2, 4.4, hdr('#ffd9a0', 0.9), '#d8c0a0');
    palmRow(b, -9.4, 2, 78, [14, 18]);
    K.crowd(b, -14, -40, 4, 76, 10);
    return b;
  };

  // ---------- LAX ----------
  const LETTERS = { L: [[0, 0, 0, 1], [0, 0, 1, 0]], A: [[0, 0, 0.5, 1], [0.5, 1, 1, 0], [0.22, 0.42, 0.78, 0.42]], X: [[0, 0, 1, 1], [0, 1, 1, 0]] };
  const lax = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) {
      K.kerbLane(b, s, { x1: 12, red: 0.8 }); farGround(b, s, '#6a6a58');
      for (let k = 0; k < 9; k++) {   // the gateway's pylons: stacks of glass rings, taller toward the airport, their colours running
        const z = -(6 + k * 8.6), H = 8 + k * 3, x = s * 12.2;
        b.cyl(VC.solid, '#3a3a40', x, H / 2, z, 0.5, H, 'cyl8');
        for (let y = 0.6, j = 0; y < H; y += 1.25, j++) b.cyl(led[(k + j) % 3], 0xffffff, x, y, z, 1.25, 1.0, 'cyl');
        b.cyl(VC.metal, '#d8dce0', x, H + 0.2, z, 1.35, 0.3, 'cyl');
      }
      for (let z = rand(6, 10); z < 78; z += rand(16, 20)) K.fanPalm(b, s * 8.6, -z, rand(1.05, 1.25));
      K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.6, lit: true });
    }
    // the big letters on the right, turned toward you
    const Lf = frame(b, 24, 0, -34, 1, -0.6);
    b.block(VC.solid, '#c8c4bc', 24, 0, -34, 26, 1.0, 5);
    let x = -11;
    for (const c of 'LAX') {
      for (const [u0, v0, u1, v1] of LETTERS[c]) Lf.beam(VC.glow, hdr('#f4f8ff', 0.95), [x + u0 * 6, 1 + v0 * 9, 0], [x + u1 * 6, 1 + v1 * 9, 0], 1.6, 1.0);
      x += 8.4;
    }
    // the Theme Building: two parabolic arches crossing over the round restaurant on its stem, lit in colour
    const TB = frame(b, -44, 0, -62, 1, 0.3);
    for (const a of [Math.PI / 4, -Math.PI / 4]) {
      const ca = Math.cos(a), sa = Math.sin(a), P = [];
      for (let k = 0; k <= 14; k++) { const u = (k / 14) * 2 - 1; P.push([u * 24 * ca, 36 * (1 - u * u), u * 24 * sa]); }
      for (let k = 1; k < P.length; k++) { TB.beam(VC.solid, '#f4f2ee', P[k - 1], P[k], 1.6, 2.4); TB.beam(led[k % 3], 0xffffff, [P[k - 1][0], P[k - 1][1] - 1.0, P[k - 1][2]], [P[k][0], P[k][1] - 1.0, P[k][2]], 0.3, 2.5); }
    }
    TB.cyl(VC.solid, '#f4f2ee', 0, 10, 0, 2.6, 20, 'cyl');
    TB.cyl(VC.solid, '#f4f2ee', 0, 20.6, 0, 11, 1.2, 'cyl'); TB.cyl(VC.glow, hdr('#ffe8c8', 1.2), 0, 22.2, 0, 10.6, 2.0, 'cyl'); TB.cyl(VC.solid, '#f4f2ee', 0, 23.6, 0, 11.4, 0.8, 'cyl');
    TB.ell(VC.solid, '#e8e4dc', 0, 24, 0, 6, 2.6, 6);
    K.crowd(b, 7.5, 11, 4, 76, 6, { bag: true }); K.crowd(b, -7.5, -11, 4, 76, 6, { bag: true });
    // a jet coming in to land over the boulevard (it moves: update)
    const jb = new Batcher();
    jb.add(G.cyl, VC.solid, 0, 0, 0, 4.4, 42, 4.4, 0, 0, Math.PI / 2, '#e8eaee');
    jb.add(G.sph, VC.solid, -21, 0, 0, 5, 4.4, 4.4, 0, 0, 0, '#e8eaee');
    jb.box(VC.solid, '#d8dce0', 2, -0.6, 0, 7, 0.5, 38);
    jb.box(VC.solid, '#d8dce0', 19, 4, 0, 5, 7, 0.5); jb.box(VC.solid, '#d8dce0', 19, 1, 0, 3, 0.4, 12);
    for (const e of [-1, 1]) { jb.cyl(VC.metal, '#b8bcc4', 0, -2.2, e * 7, 1.6, 4, 'cyl', 0, Math.PI / 2); jb.cyl(VC.solid, '#1a1a1e', 0, -3.4, e * 2, 0.6, 2.4, 'cyl8'); }
    jb.cyl(VC.solid, '#1a1a1e', -15, -3.4, 0, 0.5, 2.4, 'cyl8');
    for (const e of [-1, 1]) jb.sph(VC.glow, hdr('#fffaf0', 8), -1, -1.2, e * 4, 0.6, true);
    jb.box(VC.glow, hdr('#3a3a50', 1), -20.5, 1.0, 0, 1.6, 0.8, 3.4);
    for (let k = 0; k < 14; k++) for (const e of [-1, 1]) jb.box(VC.glow, hdr('#ffe8c0', 1.2), -15 + k * 2.2, 0.6, e * 2.22, 0.6, 0.6, 0.04);
    const jet = jb.build(); jet.position.set(0, 50, -52); extras.jet = jet;
    return { b, extra: [jet] };
  };

  // ---------- Urban Light · the museums ----------
  // one of the old lamps: a fluted post and a single globe, two globes on arms, or a lantern on a tall post
  const oldLamp = (b, x, z, kind, h) => {
    const c = '#8a8e94';
    b.cyl(VC.metal, c, x, 0.5, z, 0.22, 1.0, 'cyl8'); b.cyl(VC.metal, c, x, h / 2, z, 0.1, h, 'cyl8'); b.cyl(VC.metal, c, x, h * 0.42, z, 0.15, 0.3, 'cyl8');
    if (kind === 0) b.sph(VC.glow, hdr('#fff0d0', 2.2), x, h + 0.35, z, 0.36, true);
    else if (kind === 1) { b.box(VC.metal, c, x, h - 0.2, z, 0.08, 0.08, 1.5); for (const e of [-1, 1]) b.sph(VC.glow, hdr('#fff0d0', 2.0), x, h + 0.1, z + e * 0.7, 0.28, true); }
    else { b.box(VC.glow, hdr('#fff0d0', 2.0), x, h + 0.45, z, 0.4, 0.8, 0.4); b.add(G.cone4, VC.metal, x, h + 1.0, z, 0.7, 0.4, 0.7, 0, 0, 0, c); }
  };
  const urbanLight = () => {
    const b = new Batcher();
    // the right: Urban Light, its grid of grey lamps all lit, people among them; the museum's pavilions behind
    K.kerbLane(b, 1, { x1: 12 }); farGround(b, 1, '#6a6a5a');
    K.pave(b, 26, -42, 28, 64, 0.035);
    for (let c = 0; c < 9; c++) for (let r = 0; r < 13; r++) oldLamp(b, 14 + c * 2.9, -12 - r * 4.4, (c + r * 2) % 3, 6.5 + ((c * 7 + r * 3) % 5) * 0.5);
    K.crowd(b, 13, 37, 12, 66, 18, { camera: true });
    for (const [z, L] of [[-6, 30], [-44, 34]]) { b.addM(K.tiledBox(26, 14, L, 2.5), K.stuccoMat, T(56, 7, z - L / 2), '#e8dccc'); for (let k = 0; k < 3; k++) b.add(G.plane, VC.glow, 42.9, 9, z - 4 - k * 9, 2.4, 9, 1, 0, -Math.PI / 2, 0, hdr(pick(['#ff5a8a', '#ffd23d', '#39c8e8']), 0.9)); }   // banners
    palmRow(b, 9.4, 2, 78, [14, 18]);
    // the left: the car museum in its red skin wrapped round with ribbons of steel; the movie museum's sphere further on
    K.kerbLane(b, -1, { x1: 12 }); farGround(b, -1, '#6a6a5a');
    b.block(VC.solid, '#b82a2a', -36, 0, -40, 28, 17, 46);
    for (let k = 0; k < 6; k++) {
      const y0 = 3 + k * 2.4, ph = rand(0, 6), P = [];
      for (let z = -16; z >= -64; z -= 3) P.push([-21.6 - Math.abs(Math.sin(z * 0.08 + ph)) * 0.8, y0 + Math.sin(z * 0.11 + ph) * 1.6, z]);
      for (let i = 1; i < P.length; i++) beam(b, VC.metal, ...P[i - 1], ...P[i], 0.35, '#e8eaec');
      const Q = [];
      for (let x = -22; x >= -50; x -= 3) Q.push([x, y0 + Math.sin(x * 0.13 + ph) * 1.4, -16.6 - Math.abs(Math.sin(x * 0.1 + ph)) * 0.6]);
      for (let i = 1; i < Q.length; i++) beam(b, VC.metal, ...Q[i - 1], ...Q[i], 0.35, '#e8eaec');
    }
    b.box(VC.glow, hdr('#ffe0c0', 0.8), -21.95, 1.6, -40, 0.05, 2.8, 30);
    b.add(G.sph, VC.solid, -50, 16, -78, 24, 24, 24, 0, 0, 0, '#c8c0b4');   // the sphere on its legs, its glass dome lit
    b.add(G.sph, VC.glow, -50, 25, -78, 14, 8, 14, 0, 0, 0, hdr('#ffe8d0', 1.2));
    for (const [dx, dz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) b.cyl(VC.solid, '#a8a094', -50 + dx, 3, -78 + dz, 0.7, 6, 'cyl8');
    palmRow(b, -9.4, 2, 78, [14, 18]);
    K.crowd(b, -12, -20, 4, 76, 8);
    return b;
  };

  // ---------- Beverly Hills · Rodeo Drive ----------
  const LUX = ['BOUTIQUE', 'JEWELERS', 'COUTURE', 'FINE WATCHES', 'PARFUMS', 'MAISON', 'ATELIER', 'LEATHER'];
  const beverly = () => {
    const b = new Batcher();
    // the left: Beverly Gardens Park, the white wall with the city's name, its lily pond; the palms
    K.kerbLane(b, -1, { x1: 12 }); farGround(b, -1, '#4a6a3a');
    K.lawn(b, -40, -40, 56, 80, '#4a7a34', 0.04);
    const wall = new THREE.CylinderGeometry(11, 11, 2.0, 24, 1, true, Math.PI * 0.32, Math.PI * 0.36);
    b.addM(wall, VC.solid, new THREE.Matrix4().makeRotationY(-0.7).setPosition(-34, 1.0, -36), '#f4f2ee');   // its curve turned to face you as you come
    K.sign(b, 'BEVERLY HILLS', { w: 1024, h: 160, color: '#2a2a2a', font: SERIF, weight: 700, size: 0.62, k: 1.0 }, -25.55, 1.1, -28.87, 6.4, 1.0, 1, 0, Math.PI / 2 - 0.7, 0);
    b.box(VC.solid, '#b8b0a4', -21.5, 0.15, -36, 6, 0.3, 14); b.box(K.water, 0xffffff, -21.5, 0.32, -36, 5.4, 0.02, 13.4);
    for (let k = 0; k < 14; k++) b.add(G.cyl8, VC.solid, -21.5 + rand(-2.4, 2.4), 0.35, -36 + rand(-6, 6), rand(0.4, 0.8), 0.02, rand(0.4, 0.8), 0, 0, 0, pick(['#3a6a2a', '#4a7a34']));
    for (let k = 0; k < 4; k++) b.add(G.sphLow, VC.solid, -21.5 + rand(-2, 2), 0.4, -36 + rand(-5, 5), 0.25, 0.15, 0.25, 0, 0, 0, pick(['#ff9ac8', '#f4f0f0']));
    for (let k = 0; k < 30; k++) b.add(G.sphLow, VC.solid, rand(-16, -30), 0.4, -rand(48, 76), 0.6, 0.5, 0.6, 0, 0, 0, pick(['#e8203a', '#ffd23d', '#ff6a8a', '#f4f0f0', '#8a5ad8']));   // flower beds
    for (const x of [-14, -30, -46]) palmRow(b, x, 2, 78, [12, 15]);
    K.crowd(b, -12, -22, 4, 76, 8, { camera: true });
    // the right: Rodeo Drive's houses of fashion, stone and glass and awnings, a doorman at each; the hotel at the end
    K.kerbLane(b, 1, { x1: X0 }); farGround(b, 1, '#6a6a5a');
    for (let z = 0; z < 62;) {
      const w = rand(9, 13), zc = -(z + w / 2), F = frame(b, X0, 0, zc, 1, face(1)), col = pick(['#f4f0e8', '#e8e4dc', '#d8d0c4', '#2a2a2e', '#f2ece0']), H = rand(9, 13);
      F.addM(K.tiledBox(w, H + 1, 14, 2.5), K.stuccoMat, T(0, (H - 1) / 2, -7), col);
      F.box(VC.glow, hdr('#fff0dc', 0.75), 0, 2.6, 0.05, w - 2, 4.4, 0.04);
      for (let k = 0; k < 3; k++) F.box(VC.solid, '#c8a050', -w / 2 + 1 + k * ((w - 2) / 2), 2.6, 0.1, 0.1, 4.6, 0.1);
      K.sign(F, pick(LUX), { w: 512, h: 96, color: '#e8c878', bg: '#141414', font: SERIF, weight: 700, size: 0.55, k: 1.2 }, 0, 6.0, 0.08, Math.min(w - 2, 6), 1.1, 1);
      if (chance(0.6)) F.add(G.box, VC.solid, 0, 5.2, 0.8, w - 1.4, 0.06, 1.6, -0.25, 0, 0, pick(['#141414', '#f4f0e8', '#2a4a2a']));
      for (let y = 8; y < H - 1; y += 3) F.box(VC.glow, K.glass(0.5, true), 0, y, 0.05, w - 3, 1.8, 0.04);
      K.person(b, ...K.xz(F, w / 2 - 1.4, 0.8), { top: '#141414', legs: '#141414', ry: -Math.PI / 2, shades: true, hat: 'none' });
      z += w + 0.2;
    }
    const BW = frame(b, 30, 0, -74, 1, face(1));   // the old hotel at the foot of the drive, its copper roof
    BW.addM(K.tiledBox(40, 40, 22, 2.5), K.stuccoMat, T(0, 20, -11), '#ece0cc');
    for (let y = 6; y < 38; y += 3.2) for (let x = -18; x <= 18; x += 3) BW.box(VC.glow, K.glass(0.55, true), x, y, 0.05, 1.4, 1.8, 0.04);
    BW.addM(hipRoof(41, 23, 6), VC.solid, T(0, 40, 0.5), '#5a8a7a');
    for (let k = 0; k < 4; k++) { const z = -rand(6, 70); K.person(b, rand(8, 10.8), z, { bag: true, shades: true, top: pick(['#f4f0e8', '#141414', '#c8a070', '#e8302a']) }); }
    K.crowd(b, 7.6, 10.8, 4, 76, 8, { bag: true });
    for (let z = rand(6, 10); z < 78; z += rand(14, 18)) K.fanPalm(b, 7.6, -z, rand(1.05, 1.25));
    K.carRow(b, 5.25, 0, CHUNK_LEN, { p: 0.7, kinds: [(bb, x, z, d) => K.car(bb, x, z, d, { kind: pick(['convertible', 'classic', 'suv']) })] });
    K.carRow(b, -5.25, 0, CHUNK_LEN, { p: 0.5, kinds: [(bb, x, z, d) => K.car(bb, x, z, d, { kind: pick(['convertible', 'classic']) })] });
    return b;
  };

  // ---------- the Sunset Strip ----------
  const club = (b, z, L, name, act) => {   // a rock club: black, its marquee lit, the queue at the door
    const F = frame(b, X0, 0, -(z + L / 2), 1, face(1));
    F.addM(K.tiledBox(L, 7, 14, 2.5), K.stuccoMat, T(0, 3.5, -7), '#1a1a20');
    F.box(VC.solid, '#2a2a30', 0, 4.4, 1.2, L - 1, 1.4, 2.4);
    K.sign(F, act, { w: 1024, h: 128, color: '#141414', bg: '#fff4e0', font: SANS, weight: 700, size: 0.5, k: 1.4 }, 0, 4.4, 2.42, L - 1.6, 1.0, 1);
    K.sign(F, name, { w: 512, h: 128, color: '#ff3a5a', font: NEON, size: 0.66, glow: '#ff3a5a', k: 2.4 }, 0, 6.3, 0.1, L - 1, 1.6, 1);
    for (let k = 0; k < Math.round((L - 1.2) / 0.5); k++) F.box(k % 2 ? K.chaseA : K.chaseB, 0xffffff, -L / 2 + 0.6 + k * 0.5, 3.66, 2.4, 0.1, 0.1, 0.1);
    for (let k = 0; k < 5; k++) K.person(b, rand(7.8, 9.8), -(z + 1 + k * 1.1), { ry: 0, top: pick(['#141414', '#2a2a30', '#e8302a']), shades: chance(0.5) });
  };
  const sunset = () => {
    const b = new Batcher();
    // the right, uphill: the clubs at the street, the hill climbing behind them, houses on it, the castle hotel up there; the deco tower ahead
    K.kerbLane(b, 1, { x1: X0 }); farGround(b, 1, '#5a5a44');
    club(b, 2, 14, 'THE VIPER', 'LIVE TONIGHT · THE NEON SAINTS'); club(b, 20, 12, 'STARDUST', 'COMEDY · 8 PM · 10 PM'); club(b, 36, 14, 'ROXIE', 'SOLD OUT · PALM DRIVE');
    slope(b, 26, 0, 64, 24, '#5a5a3e', { scrub: 26 });
    b.block(VC.solid, '#5a5a3e', 110, 0, -40, 92, 24, 80);
    for (const [x, z] of [[34, -10], [42, -66], [50, -22]]) K.villa(b, 1, x, z, { y: (x - 26) * 0.63 - 1, w: 11, floors: 1 });
    const CH = frame(b, 67, 24, -48, 1, face(1)), ck = '#e8dcc4';   // the castle hotel: its steep roofs and turrets, the windows lit
    CH.addM(K.tiledBox(26, 18, 16, 2.5), K.stuccoMat, T(0, 8, -8), ck);
    CH.addM(hipRoof(26.6, 16.6, 7), VC.solid, T(0, 17, 0.3), '#3a3a44');
    for (const e of [-1, 1]) { CH.cyl(VC.solid, ck, e * 13, 10, 0, 2.6, 22, 'cyl8'); CH.add(G.cone8, VC.solid, e * 13, 23.8, 0, 6.4, 6, 6.4, 0, 0, 0, '#3a3a44'); }
    for (let y = 2; y < 16; y += 3.2) for (let x = -10; x <= 10; x += 2.6) K.archWin(CH, x, y, 0.03, 1.0, 1.7, K.glass(0.6, true), '#d8c8b0');
    const ST = frame(b, 24, 0, -78, 1, face(1));   // the deco tower: setbacks, piers up its corners, a crown
    for (const [y0, y1, w] of [[0, 30, 16], [30, 40, 13], [40, 46, 9]]) { ST.addM(K.tiledBox(w, y1 - y0, w, 2.5), K.stuccoMat, T(0, (y0 + y1) / 2, -8), '#ece2d0'); for (const e of [-1, 1]) ST.box(VC.solid, '#f4eee0', e * (w / 2 - 0.4), (y0 + y1) / 2, -8 + w / 2, 0.8, y1 - y0, 0.8); }
    for (let y = 3; y < 44; y += 3) ST.box(VC.glow, K.glass(0.55, true), 0, y, y < 30 ? 0.05 : y < 40 ? -1.45 : -3.45, 5, 1.8, 0.04);   // on each setback's face
    ST.box(VC.glow, hdr('#fff0d8', 1.6), 0, 47.5, -8, 2, 3, 2);
    // the left, downhill: low buildings and the billboards over them, and between them the lights of the basin far below
    K.kerbLane(b, -1, { x1: 12 }); K.pave(b, -18, -40, 12, CHUNK_LEN, 0.03);
    for (const [z, L] of [[0, 20], [34, 14], [62, 18]]) { b.addM(K.tiledBox(12, 6, L, 2.5), K.stuccoMat, T(-18, 3, -(z + L / 2)), pick(['#2a2a30', '#e8e0d0', '#c8b8a8'])); K.billboard(b, -19, -(z + L / 2), -1, { y: 9.5, w: Math.min(L - 2, 14), ry: 0.45 }); }
    slope(b, -90, -46, -24, 0, '#5a5040', { scrub: 18 });
    const lights = cityLights(-60, -1600, -20, 200, -1400);
    for (const z of [20, 52]) K.billboard(b, -15, -z - 4, -1, { y: 11, w: 12, ry: 0.6 });   // and two more on their legs in the gaps
    for (const s of [-1, 1]) { K.carRow(b, s * 5.25, 0, CHUNK_LEN, { p: 0.55, lit: true }); for (let z = rand(4, 10); z < 78; z += rand(16, 22)) K.fanPalm(b, s * 8.6, -z, rand(1.0, 1.2)); }
    K.crowd(b, 7.6, 10.8, 4, 76, 10); K.crowd(b, -7.6, -10.8, 4, 76, 6);
    return { b, extra: [lights] };
  };

  // ---------- the Walk of Fame · the Chinese Theatre ----------
  const elephant = (b, x, y, z, ry) => {   // one of the Babylon gate's white elephants, up on its column
    const F = frame(b, x, y, z, 1, ry), c = '#f2ece4';
    F.ell(VC.solid, c, 0, 1.6, 0, 1.1, 0.9, 1.6); F.ell(VC.solid, c, 0, 2.0, -1.6, 0.75, 0.75, 0.7);
    for (const e of [-1, 1]) { F.add(G.box, VC.solid, e * 0.7, 2.1, -1.4, 0.1, 0.9, 0.7, 0, 0, 0, c); for (const f of [-1, 1]) F.cyl(VC.solid, c, e * 0.55, 0.5, f * 0.9, 0.28, 1.2, 'cyl8'); }
    F.limb(VC.solid, c, [0, 1.8, -2.2], [0, 0.6, -2.5], 0.22, 0.1, 6);
  };
  const hollywood = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) { K.kerbLane(b, s, { x1: X0 }); K.stars(b, s, 0, CHUNK_LEN); farGround(b, s, '#6a5a50'); }
    // the right: the forecourt and its slabs of handprints, the theatre's coral columns and bronze pagoda roofs; the gate with
    // its elephants; the record-stack tower ahead
    K.pave(b, 20, -42, 17, 34, 0.04);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { b.box(VC.solid, '#9a948c', 14 + c * 3.4, 0.05, -28 - r * 4.4, 2.8, 0.03, 3.6); for (let k = 0; k < 3; k++) b.box(VC.solid, '#5a5650', 14 + c * 3.4 + rand(-0.8, 0.8), 0.07, -28 - r * 4.4 + rand(-1, 1), 0.3, 0.01, 0.35); }
    const F = frame(b, 29, 0, -42, 1, face(1));
    F.addM(K.tiledBox(26, 12, 12, 2.5), K.stuccoMat, T(0, 6, -6), '#b8483a');
    for (const e of [-1, 1]) { F.cyl(VC.solid, coral, e * 5.4, 6.5, 0.8, 0.8, 13, 'cyl'); F.box(VC.metal, bronze, e * 5.4, 13.2, 0.8, 1.6, 0.6, 1.6); }
    F.box(VC.solid, '#1a1418', 0, 3.4, 0.06, 7, 6.8, 0.06); F.box(VC.glow, hdr('#ffd8a0', 1.2), 0, 3.0, 0.1, 6, 5.6, 0.04);
    K.sign(F, 'CHINESE', { w: 1024, h: 192, color: '#ffd890', bg: '#2a1418', font: DECO, size: 0.72, k: 1.5 }, 0, 9.4, 0.12, 8, 1.5, 1);
    const R1 = roofGeo(16, 9, 4.6, { lift: 0.9, eave: 1.8 }), R2 = roofGeo(9, 6, 3.2, { lift: 0.8, eave: 1.2 });
    F.addM(R1.roof, VC.metal, T(0, 13.6, -3.5), bronze); F.addM(K.tiledBox(9, 3, 6, 2.5), K.stuccoMat, T(0, 18.5, -3.5), '#b8483a'); F.addM(R2.roof, VC.metal, T(0, 20, -3.5), bronze);
    for (const e of [-1, 1]) { F.ell(VC.solid, '#5a5048', e * 4.2, 0.8, 1.6, 0.5, 0.6, 0.7); F.ell(VC.solid, '#5a5048', e * 4.2, 1.5, 1.3, 0.4, 0.4, 0.4); }   // the guardian dogs at the doors
    for (const zz of [-62, -78]) { b.cyl(VC.solid, '#f2ece4', 13.4, 7, zz, 1.2, 14, 'cyl'); b.box(VC.solid, '#e8dcc8', 13.4, 14.3, zz, 3, 0.6, 3); elephant(b, 13.4, 14.6, zz, -Math.PI / 2); }
    b.box(VC.solid, '#e8dcc8', 13.4, 13.4, -70, 2.2, 1.6, 17);
    const CR = frame(b, 40, 0, -88, 1, 0);   // the record-stack tower: a pile of discs and their glass, the needle, the light spelling HOLLYWOOD
    for (let k = 0; k < 12; k++) { const y = 3 + k * 3.4; CR.cyl(VC.solid, '#f2f0ec', 0, y, 0, 9, 0.35, 'cyl'); CR.cyl(VC.glow, K.glass(0.6, false), 0, y + 1.6, 0, 7.4, 3.1, 'cyl'); }
    CR.cyl(VC.solid, '#e8e4dc', 0, 1.5, 0, 7.6, 3, 'cyl'); CR.cyl(VC.solid, '#e8e4dc', 0, 45, 0, 4, 4, 'cyl');
    CR.cyl(VC.metal, '#d8dce0', 0, 57, 0, 0.3, 20, 'cyl6'); CR.box(morse, 0xffffff, 0, 67.4, 0, 1, 1, 1);
    // the left: a picture palace with its marquee, the red carpet down the pavement, the photographers' flashes, the searchlights
    K.theatre(b, -1, X0, -40, 20, { name: 'STARLITE', film: 'STARFALL' });
    K.shopRow(b, -1, 0, 28, { signs: HOLLY_SIGNS, floors: [2, 3], styles: ['deco', 'stucco'] });
    K.shopRow(b, -1, 52, 80, { signs: HOLLY_SIGNS, floors: [2, 3], styles: ['deco', 'stucco'] });
    b.box(VC.solid, '#a81a24', -8.6, 0.05, -40, 2.2, 0.04, 28);
    for (let z = 27; z <= 53; z += 2) for (const x of [-7.3, -9.9]) b.cyl(VC.metal, '#c8a050', x, 0.5, -z, 0.05, 1.0, 'cyl6');
    for (const x of [-7.3, -9.9]) b.box(VC.solid, '#7a1a24', x, 0.9, -40, 0.06, 0.06, 26);
    for (let k = 0; k < 8; k++) { const z = -rand(28, 52); K.person(b, -6.6, z, { camera: true, ry: Math.PI / 2, top: '#141414' }); b.box(flash[k % 2], 0xffffff, -6.4, 1.62, z + 0.25, 0.2, 0.2, 0.1); }
    for (let k = 0; k < 5; k++) K.person(b, -8.6, -rand(30, 50), { ry: pick([0, Math.PI]), top: pick(['#141414', '#e8e4dc', '#c8a050', '#a81a24']), shades: true });   // the stars arriving
    const beams = [];
    for (const z of [-14, -66]) {   // two searchlight trucks, their beams swinging up into the sky (update)
      b.block(VC.solid, '#3a3a40', -9.4, 0.3, z, 2.2, 1.0, 3.6); b.cyl(VC.metal, '#5a5e64', -9.4, 2.1, z, 0.9, 1.4, 'cyl', Math.PI / 2);
      for (const e of [-1, 1]) for (const f of [-1, 1]) b.cyl(VC.solid, '#141414', -9.4 + e * 1.0, 0.35, z + f * 1.2, 0.35, 0.25, 'cyl8', 0, Math.PI / 2);   // its wheels
      b.cyl(VC.glow, hdr('#f4f8ff', 3), -9.4, 2.1, z + 0.75, 0.8, 0.05, 'cyl', Math.PI / 2);
      const m = searchlight(420, 9, 0.16); m.position.set(-9.4, 2.4, z); m.userData.ph = z * 0.1; beams.push(m);
    }
    extras.beams = beams;
    for (const s of [-1, 1]) { K.throng(b, s * 7.6, s * 10.8, 2, 78, 14, s < 0 ? [[24, 56]] : [], { camera: chance(0.5) }); for (let z = rand(4, 10); z < 78; z += rand(15, 19)) K.fanPalm(b, s * 7.4, -z, rand(1.0, 1.15)); }
    for (let k = 0; k < 3; k++) K.person(b, rand(7.4, 8.4), -rand(6, 74), { costume: pick(['cowboy', 'pirate', 'robot', 'showgirl']), ry: Math.PI / 2 });
    return { b, extra: beams };
  };

  // ---------- Griffith Observatory ----------
  const griffith = () => {
    const b = new Batcher(), TY = 8;
    // the right: the hill rising to the terrace, the observatory along it, white and lit: the planetarium's dome, the
    // wings and their arcades, the telescope domes; the Astronomers Monument on the lawn; people at the rails
    K.kerbLane(b, 1, { x1: 11 });
    slope(b, 11, 0, 22, TY, '#6a6a44', { scrub: 14 });
    b.block(VC.solid, '#6a6a48', 80, 0, -45, 116, TY, 110);
    K.lawn(b, 30, -40, 16, 80, '#4a6a34', TY + 0.03); K.pave(b, 46, -50, 16, 66, TY + 0.04);
    const F = frame(b, 44, TY, -54, 1, face(1)), white = '#f4f0ea', dome = '#7aa094';
    F.addM(K.tiledBox(34, 15, 28, 2.5), K.stuccoMat, T(0, 7.5, -14), white);
    F.cyl(VC.solid, white, 0, 16.5, -14, 12.6, 4, 'cyl'); F.add(G.sph, VC.metal, 0, 18.4, -14, 25, 21, 25, 0, 0, 0, dome);
    for (const e of [-1, 1]) {
      F.addM(K.tiledBox(26, 10, 12, 2.5), K.stuccoMat, T(e * 30, 5, -6), white);
      for (let k = 0; k < 6; k++) { F.box(VC.solid, white, e * (19.5 + k * 4), 4.4, 0.6, 0.9, 8.8, 0.9); F.box(VC.glow, hdr('#ffe0b0', 0.9), e * (21.5 + k * 4), 4.4, 0.05, 2.6, 7, 0.04); }
      F.cyl(VC.solid, white, e * 46, 6.5, -6, 6.4, 13, 'cyl'); F.add(G.sph, VC.metal, e * 46, 13, -6, 12.4, 10.4, 12.4, 0, 0, 0, dome);
    }
    for (let k = -2; k <= 2; k++) F.box(VC.glow, hdr('#ffe0b0', 1.0), k * 5, 6.5, 0.05, 2.6, 7.5, 0.04);
    F.box(VC.solid, white, 0, 8, 1.2, 12, 16, 2.4);
    const MO = frame(b, 30, TY, -40, 1, 0);   // the Astronomers Monument: the obelisk and the armillary on it
    MO.addM(frustum4(1.6, 3.2, 12), VC.solid, T(0, 0, 0), '#e8e4dc');
    MO.add(G.tor, VC.metal, 0, 13.4, 0, 2.4, 2.4, 2.4, 0, 0, 0, '#c8a050'); MO.add(G.tor, VC.metal, 0, 13.4, 0, 2.4, 2.4, 2.4, Math.PI / 2, 0.5, 0, '#c8a050');
    K.crowd(b, 23, 38, 10, 74, 16, { y: TY, camera: chance(0.4), ry: -Math.PI / 2 });
    b.box(VC.metal, '#3a3a3e', 22.6, TY + 0.55, -40, 0.06, 0.06, 80); for (let z = 1; z < 80; z += 2.5) b.box(VC.metal, '#3a3a3e', 22.6, TY + 0.28, -z, 0.05, 0.56, 0.05);   // the terrace's rail
    // the left: the guard rail at the road's edge, the hillside falling away, and the whole basin lit up below to the sea
    K.kerbLane(b, -1);
    b.box(VC.metal, '#c8ccd2', -11.2, 0.55, -40, 0.12, 0.3, 80); for (let z = 1; z < 80; z += 3) b.box(VC.metal, '#8a8e94', -11.2, 0.3, -z, 0.12, 0.6, 0.12);
    slope(b, -96, -80, -11.4, 0, '#5a5442', { scrub: 30 });
    const lights = cityLights(-110, -1800, -20, 300, -1600);
    K.carRow(b, -5.25, 0, CHUNK_LEN, { p: 0.4, lit: true });
    for (let k = 0; k < 6; k++) K.person(b, rand(-7.6, -10.6), -rand(4, 76), { ry: Math.PI / 2, camera: chance(0.5) });
    return { b, extra: [lights] };
  };

  const done = (fn) => () => { const r = fn(), g = K.flushSmoke((r.b || r).build()); for (const o of r.extra || []) g.add(o); return g; };
  const LIST = [['union', '联合车站 · 奥维拉街', 'UNION STATION · OLVERA STREET', union], ['bunker', '迪士尼音乐厅 · 天使铁路', 'DISNEY HALL · ANGELS FLIGHT', bunker],
    ['viaduct', '第六街高架桥', 'SIXTH STREET VIADUCT', viaduct], ['coliseum', '洛杉矶纪念体育场', 'MEMORIAL COLISEUM', coliseum], ['lax', '洛杉矶国际机场', 'LAX', lax],
    ['urbanLight', '城市之光 · 艺术博物馆', 'URBAN LIGHT · LACMA', urbanLight], ['beverly', '比佛利山庄 · 罗迪欧大道', 'BEVERLY HILLS · RODEO DRIVE', beverly],
    ['sunset', '日落大道', 'SUNSET STRIP', sunset], ['hollywood', '星光大道 · 中国剧院', 'WALK OF FAME · CHINESE THEATRE', hollywood], ['griffith', '格里菲斯天文台', 'GRIFFITH OBSERVATORY', griffith]];
  return {
    landmarks: Object.fromEntries(LIST.map(([key, name, en, fn]) => [key, { key, name, en, build: done(fn) }])),
    update(t, camZ = null) {
      if (camZ !== null) for (const m of grids) { if (!m.parent) continue; const ahead = camZ - m.parent.matrixWorld.elements[14]; m.visible = ahead > -400 && ahead < 130; }   // (its chunk's start, from the camera)
      led.forEach((m, i) => m.color.setHSL((t * 0.05 + i / 3) % 1, 0.95, 0.5).multiplyScalar(1.25));
      flameMat.color.set('#ff8a2a').multiplyScalar(3.2 + Math.sin(t * 13) * 0.6 + Math.sin(t * 29) * 0.4);
      flash.forEach((m, i) => m.color.set('#ffffff').multiplyScalar(Math.sin(t * 7.3 + i * 2.2) > 0.93 ? 9 : 0.15));
      morse.color.set('#ff2a1a').multiplyScalar(MORSE[Math.floor(t * 4) % MORSE.length] ? 3.4 : 0.2);
      if (extras.jet) extras.jet.position.x = 260 - ((t * 34) % 520);
      for (const m of extras.beams) m.rotation.set(0.15 + 0.12 * Math.sin(t * 0.4 + m.userData.ph), 0, 0.5 * Math.sin(t * 0.5 + m.userData.ph));
    },
  };
}
