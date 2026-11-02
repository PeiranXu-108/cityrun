// San Francisco's landmark scenes (the two on the Golden Gate Bridge are in sf_bridge.js), in the order the run meets
// them: the Ferry Building under the Bay Bridge; the cable car turntable at Powell and Market, Union Square across the
// street; Lombard Street's eight bends; Fisherman's Wharf and Pier 39's sea lions; the Palace of Fine Arts over its
// lagoon; the Conservatory of Flowers in Golden Gate Park; Haight and Ashbury; the Painted Ladies of Alamo Square; the
// Castro Theatre and the rainbow flag; Mission Dolores and Dolores Park. Every sign is in English.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, planeUV, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { EDGE, farGround } from './common.js';
import { beam } from './tokyo_kit.js';
import { frame } from './ny_icons.js';
import { puffs } from './taipei_towers.js';
import { sparkles } from './paris_kit.js';
import { uplit, mirrorInto, mergeInto, clearWater, lastAdditive, dim } from './beijing_sights.js';
import { ferryTower, clockTex } from './sf_icons.js';
import { X0, KERB, SANS, SERIF, WEST, NEON, GROOVY, PAINTED, STUCCO, PSYCHE, TIEDYE, WARM, VIC_SIGNS, HAIGHT_SIGNS, WHARF_SIGNS, GI, face } from './sf_kit.js';

const UP = new THREE.Vector3(0, 1, 0), I4 = new THREE.Matrix4();
const _ray = new THREE.Raycaster(), _from = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0);
// the height of a hill's surface under (x, z), cast down onto a mesh standing exactly where the hill is drawn
function surfaceY(mesh, x, z, fallback = 0) { _ray.set(_from.set(x, 500, z), _down); const h = _ray.intersectObject(mesh, false)[0]; return h ? h.point.y : fallback; }
function hillMesh(geo, x, y, z, sx, sy, sz, ry = 0) { const m = new THREE.Mesh(geo); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.y = ry; m.updateMatrixWorld(true); return m; }
// a flat strip from p0 to p1 (a length of road), w wide and t thick, lying level across its width
function strip(b, mat, col, p0, p1, w, t = 0.12) {
  const d = new THREE.Vector3().subVectors(p1, p0), L = d.length(), Z = d.clone().normalize(), X = UP.clone().cross(Z).normalize(), Y = Z.clone().cross(X).normalize();
  b.addM(G.box, mat, new THREE.Matrix4().makeBasis(X, Y, Z).scale(new THREE.Vector3(w, t, L)).setPosition(p0.clone().add(p1).multiplyScalar(0.5)), col);
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ARCH = new THREE.TorusGeometry(0.5, 0.08, 6, 12, Math.PI);   // G.tor's upper half

// ---------- textures ----------
function wheelTex() {   // the Fisherman's Wharf sign: a ship's wheel, the crab in the middle, the name round the rim
  return canvasTex(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    g.fillStyle = '#1a3a6a'; g.beginPath(); g.arc(cx, cy, 200, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f4ecd8'; g.beginPath(); g.arc(cx, cy, 150, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d83a22';   // the crab
    g.beginPath(); g.ellipse(cx, cy + 10, 70, 46, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#d83a22'; g.lineWidth = 12; g.lineCap = 'round';
    for (const e of [-1, 1]) {
      for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(cx + e * 50, cy + 20 + k * 12); g.lineTo(cx + e * 100, cy + 40 + k * 18); g.lineTo(cx + e * 112, cy + 70 + k * 16); g.stroke(); }
      g.beginPath(); g.moveTo(cx + e * 40, cy - 20); g.lineTo(cx + e * 70, cy - 70); g.stroke();
      g.fillStyle = '#d83a22'; g.beginPath(); g.ellipse(cx + e * 82, cy - 90, 22, 30, e * 0.4, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = '#1a1a1a'; for (const e of [-1, 1]) { g.beginPath(); g.arc(cx + e * 16, cy - 22, 6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#f4d060'; g.font = `400 42px ${WEST}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const ring = (txt, r, a0, dir) => { const n = txt.length; for (let i = 0; i < n; i++) { const a = a0 + dir * (i - (n - 1) / 2) * 0.17; g.save(); g.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.rotate(a + (dir > 0 ? Math.PI / 2 : -Math.PI / 2)); g.fillText(txt[i], 0, 0); g.restore(); } };
    ring("FISHERMAN'S WHARF", 175, -Math.PI / 2, 1);
    g.font = `400 30px ${WEST}`; ring('OF SAN FRANCISCO', 176, Math.PI / 2, -1);
  }, { repeat: false });
}
function bladeTex() {   // the Castro Theatre's great vertical sign: CASTRO in red neon down a cream blade, bulbs round its edge
  return canvasTex(128, 512, (g, w, h) => {
    g.fillStyle = '#f2e6c8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c8302a'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#e8202a'; g.shadowColor = '#ff3a2a'; g.shadowBlur = 14; g.font = `400 62px ${NEON}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    [...'CASTRO'].forEach((c, i) => g.fillText(c, w / 2, 52 + i * 81));
    g.shadowBlur = 0; g.fillStyle = '#ffe8a0';
    for (let y = 14; y < h - 10; y += 16) { g.beginPath(); g.arc(14, y, 3, 0, Math.PI * 2); g.arc(w - 14, y, 3, 0, Math.PI * 2); g.fill(); }
  }, { repeat: false });
}
function rainbowTex() {   // the rainbow flag's six stripes
  return canvasTex(64, 96, (g, w, h) => { ['#e8202a', '#ff8a1a', '#ffd23d', '#2a9a4a', '#2a5ad8', '#7a2a9a'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, (i * h) / 6, w, h / 6 + 1); }); }, { repeat: false });
}

export function sfLandmarks(K) {
  const upd = [];
  // the scenes' materials: stone and stucco lit warm from below at dusk, the gilt, the clock faces
  const wallLit = uplit(std({ vertexColors: true, roughness: 0.82, emissive: '#ffd8b0', emissiveIntensity: 0.16 }), 24, 1.1, 0.3);
  const S = { ...K.S, wall: wallLit, paint: VC.solid, dark: VC.solid,
    cStone: '#efe6d8', cStone2: '#dcd0c0', cArch: hdr('#ffd9a0', 1.1), cClock: hdr('#f8f2e4', 1.2), cDark: '#2a2a30', cWhite: '#f2ece4', cWhite2: '#e2dcd4', cSteel: '#b8c0c8', cSteel2: '#8a9098' };
  const clockMat = basic({ map: clockTex(), color: hdr('#ffffff', 1.25) });
  const flagMat = std({ map: rainbowTex(), side: THREE.DoubleSide, roughness: 0.8, emissive: '#ffffff', emissiveMap: rainbowTex(), emissiveIntensity: 0.2 });
  const steam = (pts) => { const m = puffs(pts, { size: 0.5, grow: 2.4, rise: 2.2, drift: 0.5, life: 3.2, n: 5, color: '#f4f0ec', opacity: 0.45 }); K.fogs.push(m); return m; };
  const pave = (b, x0, x1, z0, z1) => K.pave(b, (x0 + x1) / 2, -(z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(z1 - z0), 0.035);
  const street = (b, s, { x1 = EDGE + 7, lamps = true, n = [4, 8], z1 = CHUNK_LEN - 2 } = {}) => {   // a plain side of the street: the parking lane, the pavement, lamps, people (as far as z1)
    K.kerbLane(b, s, { x1 });
    if (lamps) for (let z = rand(6, 12); z < CHUNK_LEN - 2; z += rand(24, 28)) K.lamp(b, s * 7.0, -z, s);
    K.crowd(b, s * 7.8, s * (x1 - 0.4), 2, z1, randi(...n));
  };

  // ---------- the Ferry Building and the Bay Bridge ----------
  // Along the Embarcadero toward the Ferry Building: first under the Bay Bridge's approach, its decks high over the
  // street, the suspension span striding out over the water on the right with the Bay Lights twinkling down its cables;
  // then the Ferry Building standing across the end of the street, its clock tower over the arch the run goes through,
  // into the marketplace hall with its lit shops.
  const ferry = () => {
    const b = new Batcher();
    farGround(b, -1, '#8a8478');
    street(b, -1, { x1: 16, lamps: false, n: [6, 10], z1: 55 });   // nobody past the Ferry Building's front
    for (let z = 4; z < 50; z += 15) K.palm(b, -11.2, -z, rand(1.3, 1.45));
    for (let z = 30; z < 56; z += 24) K.pathOfGold(b, -7.2, -z, -1);
    for (const [x, z, w, d, h] of [[-36, -10, 22, 16, 58], [-46, -40, 26, 20, 82]]) {   // Embarcadero Center, its edges strung with lights
      b.addM(K.tiledBox(w, h, d, 3), K.stoneMat, new THREE.Matrix4().makeTranslation(x, h / 2, z), '#f0e8dc');
      for (const [ex, ez] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) b.box(VC.glow, hdr('#fff4dc', 1.6), x + ex * (w / 2 + 0.05), h / 2, z + ez * (d / 2 + 0.05), 0.12, h, 0.12);
      for (const e of [-1, 1]) b.box(VC.glow, hdr('#fff4dc', 1.6), x, h + 0.05, z + e * (d / 2 + 0.05), w, 0.12, 0.12);
    }
    street(b, 1, { x1: 22, lamps: false, n: [6, 10], z1: 55 });
    K.quay(b, 1, 22, 0, 57, { gulls: 3 });
    for (let k = 0; k < 3; k++) {   // the farmers' market: white tents over tables of produce
      const tz = -32 - k * 8.5, tx = 17.5;
      b.add(G.cone4, VC.solid, tx, 3.2, tz, 4.2, 1.2, 4.2, 0, 0, 0, '#f4f4f0');
      for (const [ex, ez] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) b.cyl(VC.metal, '#c8ccd0', tx + ex * 1.4, 1.3, tz + ez * 1.4, 0.04, 2.6, 'cyl6');
      b.block(VC.solid, '#8a6a4a', tx, 0, tz, 2.4, 0.9, 2.6);
      for (let j = 0; j < 10; j++) b.sph(VC.solid, pick(['#e8301a', '#ff9a1a', '#ffd23d', '#6ab43a', '#8a3a8a', '#f4e070']), tx + rand(-1, 1), 1.0, tz + rand(-1.1, 1.1), 0.16, true);
    }
    // the Bay Bridge: its two decks on their piers across the street, the anchorage at the water's edge, the suspension
    // span out over the bay, its tower, the cables and the Bay Lights
    const vz = -20, vy = 26, W = frame(b, 0, 0, 0, 1, 0);
    for (const y of [vy, vy + 8]) { b.box(VC.metal, '#8a9098', 160, y, vz, 620, 1.6, 15); b.box(VC.solid, '#5a6068', 160, y - 1.1, vz, 620, 0.6, 14); }
    for (let x = -150; x < 470; x += 6) for (const e of [-1, 1]) { b.box(VC.metal, '#7a8088', x, vy + 4, vz + e * 7.6, 0.4, 8, 0.4); beam(b, VC.metal, x, vy + 0.8, vz + e * 7.6, x + 6, vy + 7.2, vz + e * 7.6, 0.25, '#7a8088'); }
    for (const x of [-110, -70, -30, 17]) b.block(VC.solid, '#b8b2a8', x, 0, vz, 3.2, vy - 1, 12);
    b.block(VC.solid, '#b0aaa0', 48, -2, vz, 16, vy + 14, 20);   // the anchorage
    const T = 172, H = 104, cy = (x) => (x <= T ? vy + 12 + ((H - vy - 12) * (x - 56)) / (T - 56) - 9 * Math.sin((Math.PI * (x - 56)) / (T - 56)) : H - (H - vy - 14) * Math.sin((Math.PI * (x - T)) / 420));
    for (const e of [-1, 1]) {
      b.block(VC.metal, '#b8bec6', T, -2, vz + e * 8, 4, H + 2, 5);
      const P = []; for (let x = 56; x <= 480; x += 8) P.push([x, cy(x), vz + e * 8]);
      for (let i = 1; i < P.length; i++) W.span(G.cyl8, VC.metal, '#c8ccd2', P[i - 1], P[i], 1.3);
    }
    for (const y of [vy + 30, vy + 54, H - 4]) b.box(VC.metal, '#b8bec6', T, y, vz, 4, 3, 20);
    b.add(G.plane, K.water, 260, -1.25, -28, 440, 56, 1, -Math.PI / 2, 0, 0);
    const pts = [];
    for (let x = 60; x < 470; x += 5) { const top = cy(x); for (let y = vy + 10; y < top; y += 2.2) pts.push(x, y, vz + 8.7); }
    const lights = sparkles(pts, { size: 1.0 }); lights.material.uniforms.on.value = 1;
    upd.push((t) => { lights.material.uniforms.time.value = t; });
    // the Ferry Building across the end of the street: its wings and their arcades, the arch, the hall, the clock tower
    const fz = -58, D = 22, sand = '#ece2d0';
    for (const s of [-1, 1]) {
      b.block(wallLit, sand, s * 25, 0, fz - D / 2, 30, 11.5, D);
      b.box(wallLit, '#f4ecdc', s * 25, 11.9, fz - D / 2, 30.4, 0.8, D + 0.4);
      for (let x = 12.5; x < 39; x += 4.3) { b.box(VC.glow, hdr('#ffd9a0', 0.85), s * x, 2.2, fz + 0.03, 2.6, 3.6, 0.05); b.add(G.cyl, VC.glow, s * x, 4.0, fz + 0.04, 2.6, 0.06, 2.6, Math.PI / 2, 0, 0, hdr('#ffd9a0', 0.85)); b.box(VC.glow, hdr(pick(WARM), 0.75), s * x, 8.2, fz + 0.03, 1.6, 2.4, 0.05); }
      b.block(wallLit, sand, s * 8.2, 0, fz - D / 2, 3.6, 13.4, D);   // the arch's piers, the hall's walls
      for (let k = 0; k < 4; k++) {   // the shops along the hall, lit
        const zz = fz - 3 - k * 5, sign = pick(VIC_SIGNS);
        b.add(planeUV(K.goodsRects[GI[sign.goods]]), K.goodsMat, s * 6.37, 2.0, zz, 3.6, 2.6, 1, 0, face(s), 0);
        b.add(planeUV(K.signRects[sign.i]), K.signMat, s * 6.36, 3.8, zz, 3.4, 0.74, 1, 0, face(s), 0);
      }
    }
    b.block(wallLit, sand, 0, 13.4, fz - D / 2, 20, 5.2, D);
    b.box(VC.glow, hdr('#ffe0b0', 0.8), 0, 13.35, fz - D / 2, 12.6, 0.06, D - 1);
    b.add(ARCH, wallLit, 0, 13.4, fz + 0.1, 13.6, 6, 6, 0, 0, 0, '#f4ecdc');   // the arch's moulding, over the opening only
    ferryTower(frame(b, 0, 18.6, fz - 6, 0.62, 0), S, { clock: { mat: clockMat } });
    K.crowd(b, 9, 12, 46, 56, 8); K.crowd(b, -9, -12, 46, 56, 8);
    const g = lastAdditive(b.build()); g.add(lights);
    return g;
  };

  // ---------- Powell Street's turntable, Union Square ----------
  const cablecar = () => {
    const b = new Batcher();
    // the right: Hallidie Plaza, the turntable at the foot of Powell Street, a cable car turned round on it by its crew,
    // the line waiting along the rope, Powell Street climbing away between the department stores with the next car on it
    farGround(b, 1, '#8a8478');
    K.kerbLane(b, 1, { x1: 13 });
    pave(b, EDGE + 7, 40, 2, 78);
    const tx = 17, tz = -32;
    b.cyl(VC.solid, '#6a4a2a', tx, 0.09, tz, 4.8, 0.14, 'cyl');
    for (let k = -4; k <= 4; k++) b.box(VC.solid, '#5a3a20', tx + k * 1.05, 0.165, tz, 0.05, 0.01, Math.sqrt(Math.max(0, 23 - (k * 1.05) ** 2)) * 2);
    K.place(b, (t) => K.cableCar(t, { riders: 0.15 }), new THREE.Matrix4().makeRotationY(0.6).setPosition(tx, 0.16, tz));
    for (const e of [-1, 1]) K.person(b, tx + e * Math.sin(0.6) * 4.6, tz + e * Math.cos(0.6) * 4.6, { ry: 0.6 + (e > 0 ? Math.PI : 0), top: '#2a3a5a', hat: 'cap', bag: false, phone: false });
    for (const e of [-0.72, 0.72]) b.box(VC.metal, '#c8ccd4', (tx + 6 + 120) / 2, 0.05, tz + e, 120 - tx, 0.04, 0.08);
    b.box(VC.solid, '#141416', (tx + 6 + 120) / 2, 0.045, tz, 120 - tx, 0.02, 0.06);
    K.place(b, (t) => K.cableCar(t, { sign: 'POWELL & MASON' }), new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(46, 0.05, tz));
    for (const [z0, z1] of [[4, 24], [40, 78]]) { const zc = -(z0 + z1) / 2; b.addM(K.tiledBox(28, 26, z1 - z0, 3), K.stoneMat, new THREE.Matrix4().makeTranslation(36, 13, zc), '#f0e4d4'); for (let k = 0; k < Math.floor((z1 - z0) / 4); k++) b.box(VC.glow, hdr('#fff0d0', 0.8), 21.97, 2.4, -(z0 + 2 + k * 4), 0.05, 3.4, 3); }
    for (let z = 36; z < 70; z += 2.4) b.cyl(VC.metal, '#c8a050', 12.2, 0.5, -z, 0.04, 1.0, 'cyl6');
    b.box(VC.solid, '#7a1a24', 12.2, 0.92, -53, 0.04, 0.04, 34);
    for (let z = 37; z < 69; z += 0.9) K.person(b, 13.0 + rand(-0.3, 0.3), -z, { ry: Math.PI + rand(-0.3, 0.3), camera: chance(0.3) });
    b.cyl(VC.metal, '#3a3e44', 11.4, 1.6, -24, 0.06, 3.2, 'cyl6');
    b.add(G.plane, K.label('POWELL ST · CABLE CAR TURNAROUND', { w: 1024, h: 128, color: '#ffffff', bg: '#7a1a24', font: SANS, weight: 700, size: 0.5, k: 1.05 }), 11.4, 3.3, -24, 3.6, 0.45, 1, 0, 0, 0);
    // the left: Union Square raised on its granite, the Dewey Monument's column and Victory on it, palms at its corners,
    // a painted heart, café tables, the stores beyond lit up
    farGround(b, -1, '#8a8478');
    K.kerbLane(b, -1, { x1: 12.5 });
    for (let z = 14; z < 78; z += 26) K.pathOfGold(b, -7.2, -z, -1);
    b.block(VC.solid, '#b8b2a8', -42, 0, -44, 58, 0.9, 64);
    for (let k = 0; k < 3; k++) b.block(VC.solid, '#c8c2b8', -13.4 - k * 0.4, 0, -44, 0.4, 0.3 * (k + 1), 64 - k);
    const mx = -30, mz = -58;
    b.block(VC.solid, '#d8d0c4', mx, 0.9, mz, 5, 4.4, 5);
    b.cyl(VC.solid, '#e8e0d4', mx, 5.3 + 14, mz, 1.1, 28, 'cyl');
    b.block(VC.solid, '#d8d0c4', mx, 33.3, mz, 3, 1.4, 3);
    K.person(b, mx, mz, { y: 34.7, s: 1.8, top: '#3a3024', legs: '#3a3024', hat: 'none', bag: false, phone: false, ry: -Math.PI / 2 });   // Victory, her trident raised
    beam(b, VC.metal, mx + 0.1, 34.7, mz + 0.62, mx + 0.25, 40.2, mz + 0.62, 0.08, '#3a3024');   // her trident, its butt on the pedestal
    for (const [x, z] of [[-16, -16], [-68, -16], [-68, -72], [-54, -40], [-58, -64]]) K.palm(b, x, z, rand(1.6, 1.9), { y: 0.9 });
    for (const [x, z] of [[-17, -40], [-17, -60]]) {   // a heart, painted all over
      b.block(VC.solid, '#c8c2b8', x, 0.9, z, 1.6, 0.6, 1.6);
      for (const e of [-1, 1]) b.sph(VC.solid, pick(['#e8302a', '#ff5a8a', '#2a6ad8', '#ffd23d']), x, 2.6, z + e * 0.6, 0.85);
      b.add(G.cone8, VC.solid, x, 1.9, z, 1.4, 1.6, 2.6, Math.PI, 0, 0, '#e8302a');
    }
    for (let k = 0; k < 8; k++) { const x = rand(-58, -20), z = -rand(18, 72); if (Math.hypot(x - mx, z - mz) < 6) continue; b.cyl(VC.metal, '#2a2a2a', x, 1.3, z, 0.04, 0.8, 'cyl6'); b.cyl(VC.solid, '#f4f0e8', x, 1.72, z, 0.4, 0.04, 'cyl8'); K.person(b, x + 0.6, z, { seated: true, y: 0.9, ry: Math.PI / 2 }); }
    K.crowd(b, -16, -66, 14, 74, 20, { y: 0.9 });
    for (const [z0, z1, col] of [[0, 40, '#e8e0d4'], [44, 80, '#f0e8dc']]) { b.addM(K.tiledBox(20, 30, z1 - z0, 3), K.stoneMat, new THREE.Matrix4().makeTranslation(-82, 15, -(z0 + z1) / 2), col); for (let k = 0; k < 8; k++) b.box(VC.glow, hdr(pick(WARM), 1.0), -71.97, 3 + (k % 2) * 6, -(z0 + 4 + Math.floor(k / 2) * 9), 0.05, 4, 6); }
    return b.build();
  };

  // ---------- Lombard Street ----------
  const lombard = () => {
    const b = new Batcher();
    farGround(b, -1, '#8a8478');
    street(b, -1);
    K.houseRow(b, -1, 0, CHUNK_LEN, { x0: X0 });
    // the hill rising ahead on the right, the crooked block climbing it: eight bends of red brick between the flower beds,
    // the houses stepping up either side, a car or two edging down, the crowd at its foot; Hyde Street across the top
    farGround(b, 1, '#8a8478');
    K.kerbLane(b, 1);
    const z0 = 10, z1 = 74, top = 18.5, gr = top / (z1 - z0), ang = Math.atan(gr), yAt = (z) => Math.min(top, Math.max(0, (z - z0) * gr));
    const Lb = (z1 - z0) / Math.cos(ang), T = 40, n = new THREE.Vector3(0, Math.cos(ang), Math.sin(ang));
    const c = V(36, top / 2, -(z0 + z1) / 2).addScaledVector(n, -T / 2);
    b.add(G.box, VC.solid, c.x, c.y, c.z, 50, T, Lb, ang, 0, 0, '#7a7a5a');
    b.block(VC.solid, '#7a7a5a', 36, -1, -(z1 + 3), 50, top + 1, 6);   // the level top, where Hyde Street runs
    const legs = 8, xa = 15.5, xb = 43, P = [];
    for (let i = 0; i <= legs; i++) { const z = z0 + 2 + ((z1 - z0 - 4) * i) / legs; P.push(V(i % 2 ? xb : xa, yAt(z) + 0.12, -z)); }
    for (let i = 1; i < P.length; i++) {
      strip(b, VC.solid, '#a8483a', P[i - 1], P[i], 4.2, 0.2);
      for (const e of [-1, 1]) { const a = P[i - 1].clone().add(V(0, 0, e * 2.5)), c2 = P[i].clone().add(V(0, 0, e * 2.5)); a.y = yAt(-a.z) + 0.15; c2.y = yAt(-c2.z) + 0.15; strip(b, VC.solid, '#2a4a28', a, c2, 0.55, 0.55); }   // the clipped hedges along it, each on the ground under it
    }
    for (const p of P) b.cyl(VC.solid, '#a8483a', p.x, p.y - 0.05, p.z, 2.6, 0.2, 'cyl');
    for (let i = 0; i < legs; i++) for (let k = 0; k < 16; k++) {   // the beds between the bends, banked with flowers
      const z = z0 + 6 + ((z1 - z0 - 8) * (i + 0.5)) / legs + rand(-1.4, 1.4), x = rand(18, 40);
      b.sph(VC.solid, pick(['#e8508a', '#ff7aa8', '#c8304a', '#8aa8f0', '#c898e0', '#f0a0c8', '#ffffff']), x, yAt(z) + 0.22, -z, rand(0.22, 0.34), true);
    }
    for (const [i, t] of [[2, 0.4], [5, 0.6]]) { const p = P[i].clone().lerp(P[i + 1], t), d = P[i + 1].clone().sub(P[i]); K.place(b, (tt) => K.car(tt, 0, 0, 1), new THREE.Matrix4().makeRotationY(Math.atan2(-d.x, -d.z) + Math.PI).setPosition(p.x, p.y - 0.02, p.z)); }
    for (let z = z0; z < z1 - 4; z += 7.7) K.house(b, 1, 50, -(z + 3.85), { w: 7.6, base: yAt(z), yd: 1.0, foot: 7, floors: 2, yard: false });   // up the far side of it, facing the block
    K.road(b, 36, -(z1 + 3), 50, 5.6, top + 0.04);
    K.place(b, (t) => K.cableCar(t, { sign: 'POWELL & HYDE' }), new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(30, top + 0.05, -(z1 + 3)));
    // the street side of the hill: a brick retaining wall stepping up with it, garages dug into it, a hedge and the
    // hydrangeas along its top, people climbing beside the crooked block; lamps along the kerb
    for (let z = z0 - 2; z < z1 + 6; z += 2) {
      const h = yAt(z + 2) + 0.5;
      b.addM(K.tiledBox(0.5, h, 2, 2), K.brickMat, new THREE.Matrix4().makeTranslation(11.1, h / 2, -(z + 1)), '#d8c0b0');
      b.box(VC.solid, '#c8c0b2', 11.1, h + 0.06, -(z + 1), 0.64, 0.12, 2.02);   // its coping
    }
    for (let z = 25; z < z1 - 3; z += rand(10, 13)) {   // a garage dug into the hill: its panelled door, the white frame
      b.box(VC.solid, '#d4ccbe', 10.83, 1.25, -z, 0.04, 2.5, 2.9);
      for (const y of [0.62, 1.25, 1.88]) b.box(VC.solid, '#a8a092', 10.81, y, -z, 0.02, 0.05, 2.9);
      b.box(VC.solid, '#f2eee6', 10.82, 2.6, -z, 0.06, 0.2, 3.3);
      for (const e of [-1, 1]) b.box(VC.solid, '#f2eee6', 10.82, 1.25, -z + e * 1.55, 0.06, 2.5, 0.2);
    }
    strip(b, VC.solid, '#2a4a28', V(11.95, yAt(z0) + 0.75, -z0), V(11.95, top + 0.75, -z1), 0.9, 1.3);
    for (let z = z0 + 3; z < z1; z += rand(3, 4.5)) K.hydrangea(b, 12.4, -z, { y: yAt(z) });
    for (let k = 0; k < 4; k++) { const z = rand(z0 + 8, z1 - 6); K.person(b, 12.95, -z, { y: yAt(z), ry: chance(0.6) ? 0 : Math.PI, camera: chance(0.4) }); }
    for (const z of [22, 48, 72]) K.lamp(b, 7.0, -z, 1);
    K.hydrant(b, 7.1, -34);
    K.crowd(b, 8.4, 10.4, 4, 14, 14, { camera: true, ry: -Math.PI / 2 - 0.4 });
    K.streetSign(b, 7.2, -9, 1, 7, 14);
    return b.build();
  };

  // ---------- Fisherman's Wharf, Pier 39 ----------
  const wharf = () => {
    const b = new Batcher(), steamPts = [];
    // the left: Jefferson Street's seafood houses and the sourdough bakery, crab pots steaming on the pavement
    farGround(b, -1, '#8a8478');
    K.kerbLane(b, -1, { x1: 12 });
    K.loftRow(b, -1, 0, CHUNK_LEN, { x0: 12, signs: WHARF_SIGNS });
    // the right: the crab stands at the wharf's edge, the wheel sign, the fishing boats in the lagoon; Pier 39's timber
    // houses out along the water, the sea lions hauled out on their floats, Alcatraz across the bay
    K.kerbLane(b, 1, { x1: 22 });
    K.quay(b, 1, 22, 0, CHUNK_LEN, { gulls: 4 });
    for (const [s, x, z] of [[-1, -9.6, -14], [-1, -9.6, -50], [1, 15.5, -10], [1, 15.5, -42]]) {   // the crab stands: a counter, the steaming pots, the board
      b.block(VC.solid, '#e8e4dc', x, 0, z, 2.2, 1.0, 4.2);
      b.add(G.cone4, VC.solid, x, 3.0, z, 3.6, 0.9, 5.6, 0, 0, 0, pick(['#c8302a', '#2a6ab0', '#f4f0e8']));
      for (const [ex, ez] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) b.cyl(VC.metal, '#c8ccd0', x + ex * 1.0, 1.8, z + ez * 1.9, 0.05, 1.6, 'cyl6');   // its posts
      for (const e of [-1, 1]) b.cyl(VC.metal, '#b8bcc4', x, 1.35, z + e * 0.9, 0.42, 0.7, 'cyl8');
      for (const e of [-1, 1]) steamPts.push([x, 1.8, z + e * 0.9]);
      for (let k = 0; k < 5; k++) b.add(G.sphLow, VC.solid, x + rand(-0.6, 0.6), 1.08, z + rand(-1.6, 1.6), 0.36, 0.16, 0.26, 0, rand(0, 3), 0, '#e8502a');
      b.add(planeUV(K.kioskRects[pick([7, 8, 13])]), K.kioskMat, x - s * 1.12, 2.3, z, 2.6, 0.65, 1, 0, face(s), 0);
      K.person(b, x + s * 1.6, z + rand(-1, 1), { ry: s < 0 ? -Math.PI / 2 : Math.PI / 2, top: '#f4f0e8', hat: 'cap' });
    }
    const wx = 13.5, wz = -27;   // the wheel sign on its post
    b.cyl(VC.metal, '#2a3a5a', wx, 3.2, wz, 0.16, 6.4, 'cyl8');
    b.add(G.plane, std({ map: wheelTex(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.6, emissive: '#ffffff', emissiveMap: wheelTex(), emissiveIntensity: 0.3 }), wx, 8.0, wz, 4.6, 4.6, 1, 0, 0, 0);
    b.add(G.tor, VC.solid, wx, 8.0, wz, 4.9, 4.9, 4.9, 0, 0, 0, '#8a5a2a');
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; beam(b, VC.solid, wx + Math.cos(a) * 2.35, 8 + Math.sin(a) * 2.35, wz - 0.02, wx + Math.cos(a) * 3.2, 8 + Math.sin(a) * 3.2, wz - 0.02, 0.22, '#8a5a2a'); }
    for (let k = 0; k < 6; k++) { const x = rand(28, 60), z = -rand(6, 40); K.sailboat(b, x, z, rand(-0.4, 0.4), { sails: false, s: rand(0.7, 0.9) }); b.cyl(VC.metal, '#2a2a2e', x, 0, z, 0.1, 2, 'cyl6'); }
    b.block(VC.solid, '#7a6a58', 32, -1.2, -64, 20, 1.8, 32);   // Pier 39's deck, and its two-storey timber houses
    for (let k = 0; k < 4; k++) {
      const hz = -50 - k * 8, col = pick(['#8a7a68', '#9a8a74', '#7a6a5a']);
      b.block(VC.solid, col, 34, 0.6, hz, 9, 6.5, 7.2);
      b.add(G.cone4, VC.solid, 34, 8.3, hz, 13, 3, 10, 0, 0, 0, '#5a4a40');
      for (const y of [2.2, 5.2]) b.box(VC.glow, hdr(pick(WARM), 1.0), 29.47, y, hz, 0.05, 1.4, 4.6);
      b.add(G.plane, VC.solid, 29.4, 9.6, hz, 0.8, 0.5, 1, 0, Math.PI / 2, 0, pick(['#c8302a', '#2a5ab0', '#ffd23d']));
    }
    for (const [x, z] of [[48, -58], [58, -66], [48, -74], [60, -50]]) {   // K-dock's floats and the sea lions on them, barking
      b.block(VC.solid, '#6a5a48', x, -1.25, z, 7, 0.4, 5);
      for (let k = randi(3, 5); k > 0; k--) K.seaLion(b, x + rand(-2.6, 2.6), -0.85, z + rand(-1.8, 1.8));
    }
    K.crowd(b, 8, 12, 2, 78, 16, { camera: true }); K.crowd(b, -8, -11.5, 2, 78, 12, { camera: true });
    // street performers: a silver robot on his box, the "bushman" crouched behind his branches
    b.block(VC.solid, '#3a3a3e', -10.6, 0, -30, 0.8, 0.5, 0.8); K.person(b, -10.6, -30, { y: 0.5, top: '#c8ccd4', legs: '#c8ccd4', hat: 'none', ry: Math.PI / 2 });
    K.shrub(b, 9.2, -58, { s: 1.4, col: '#3a5a32' }); for (const e of [-1, 1]) b.box(VC.solid, '#3a3428', 9.5, 0.25, -58 + e * 0.25, 0.14, 0.5, 0.14);
    const g = b.build(); g.add(steam(steamPts));
    return g;
  };

  // ---------- the Palace of Fine Arts ----------
  const palace = () => {
    const b = new Batcher();
    // the right: the Marina's stucco houses, a lawn along the street
    farGround(b, 1, '#8a8478');
    street(b, 1);
    K.houseRow(b, 1, 0, CHUNK_LEN, { x0: X0, colors: STUCCO, styles: ['stick', 'italianate'], floors: [2, 3] });
    // the left: the lagoon, the rotunda and its colonnade standing over their reflections, the swans, the trees round it
    K.kerbLane(b, -1, { x1: 13.4 });
    K.lawn(b, -14.4, -40, 2, 80, '#5a7a3a');
    const yw = -0.45, r = new Batcher(), rx = -44, rz = -66, pal = '#e8c0a0', pal2 = '#d8a880', dome = '#d48a52';
    for (let k = 0; k < 8; k++) {   // the rotunda: eight piers of four columns round the open drum, the entablature, the dome
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      for (const o of [-1.1, -0.37, 0.37, 1.1]) { const aa = a + o / 11; r.cyl(wallLit, pal, rx + Math.cos(aa) * 11, yw + 7.5, rz + Math.sin(aa) * 11, 0.5, 15, 'cyl8'); }
      r.add(G.box, wallLit, rx + Math.cos(a) * 11, yw + 16.2, rz + Math.sin(a) * 11, 5.2, 2.4, 2.4, 0, -a, 0, pal2);
      r.add(G.box, wallLit, rx + Math.cos(a) * 11.6, yw + 18.4, rz + Math.sin(a) * 11.6, 2.2, 2.4, 2.2, 0, -a, 0, pal2);   // the maidens' boxes atop
    }
    r.add(G.cyl8, wallLit, rx, yw + 16.4, rz, 24, 2.6, 24, 0, Math.PI / 8, 0, pal2);
    r.add(G.cyl8, wallLit, rx, yw + 20.8, rz, 19, 6, 19, 0, Math.PI / 8, 0, pal);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; r.add(G.box, VC.glow, rx + Math.cos(a) * 8.82, yw + 21, rz + Math.sin(a) * 8.82, 2.2, 3.4, 0.1, 0, Math.PI / 2 - a, 0, hdr('#ffd9a0', 0.9)); }
    r.add(G.sph, wallLit, rx, yw + 23.4, rz, 18.6, 15, 18.6, 0, 0, 0, dome);
    r.cyl(wallLit, pal, rx, yw + 31.6, rz, 1.6, 2.2, 'cyl8');
    for (let k = 0; k <= 24; k++) {   // the colonnade curving round behind it
      const a = Math.PI * (0.5 + (0.65 * k) / 24), R = 30, x = rx + Math.cos(a) * R, z = rz + Math.sin(a) * R;   // (kept within the chunk)
      for (const o of [-0.6, 0.6]) r.cyl(wallLit, pal, x + Math.cos(a) * o, yw + 6, z + Math.sin(a) * o, 0.42, 12, 'cyl8');
      r.add(G.box, wallLit, x, yw + 12.8, z, 2.8, 1.6, (Math.PI * R * 0.65) / 24 + 0.2, 0, -a, 0, pal2);
      if (k % 4 === 0) r.add(G.box, wallLit, x, yw + 14.6, z, 2.4, 2.0, 2.4, 0, -a, 0, pal2);
    }
    for (let k = 0; k < 4; k++) r.add(G.sphLow, VC.solid, rx + rand(-24, 8), yw + 0.2, rz + rand(-24, 30), 0.6, 0.5, 1.0, 0, rand(0, 6), 0, '#f8f8f4');   // swans
    mergeInto(b, r);
    mirrorInto(b, r, yw, 0.5, new Map([[wallLit, dim(wallLit, 0.7)]]));
    const lagoon = clearWater('#2a3a4a', 5, 0.62);
    upd.push((t) => lagoon.userData.scroll.offset.set(t * 0.003, t * 0.01));
    b.add(G.plane, lagoon, -60, yw, -40, 92, 80, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#101418', -60, -14, -40, 92, 0.4, 80);
    b.box(VC.solid, '#8a8070', -14.2, -7, -40, 0.6, 13.4, 80);
    for (let k = 0; k < 10; k++) (chance(0.5) ? K.gum : K.cypress)(b, rand(-100, -94), -rand(4, 76), rand(1.0, 1.4));
    b.box(VC.solid, '#5a7a3a', -110, -0.2, -40, 30, 0.2, 80);
    K.crowd(b, -8, -12.6, 2, 78, 10);
    return lastAdditive(b.build());
  };

  // ---------- Golden Gate Park: the Conservatory of Flowers ----------
  const ggpark = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) { b.box(VC.solid, '#4a6a32', s * (EDGE + 7 + 45), -0.2, -40, 90, 0.2, 80); street(b, s, { lamps: true, n: [2, 5] }); }
    // the right: the Conservatory: white wood and glass lit from inside, its domed pavilion between the long wings, the
    // flower beds banked in front of it
    const cx = 36, cz = -50, glassC = hdr('#e8f4d8', 0.85), white = '#f6f6f2';
    b.cyl(VC.solid, white, cx, 3.5, cz, 7.2, 7, 'cyl8');
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; b.add(G.box, VC.glow, cx + Math.cos(a) * 7.0, 3.6, cz + Math.sin(a) * 7.0, 4.6, 5.6, 0.1, 0, Math.PI / 2 - a, 0, glassC); }
    b.add(G.sph, VC.glow, cx, 7, cz, 14.6, 13, 14.6, 0, 0, 0, glassC);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI; b.add(G.tor, VC.solid, cx, 7, cz, 14.8, 13.2, 14.8, 0, a, 0, white); }
    b.cyl(VC.solid, white, cx, 14, cz, 1.6, 1.6, 'cyl8'); b.add(G.cone8, VC.solid, cx, 15.6, cz, 2, 1.8, 2, 0, 0, 0, white);
    for (const e of [-1, 1]) {   // the wings, their vaulted glass roofs, the pavilion at each end
      const wz = cz + e * 17;
      b.block(VC.solid, white, cx, 0, wz, 9, 1.0, 20);
      b.box(VC.glow, glassC, cx, 3.4, wz, 8.6, 4.8, 20);
      b.add(G.cyl, VC.glow, cx, 5.8, wz, 8.6, 20, 5, Math.PI / 2, 0, 0, glassC);
      for (let k = 0; k <= 10; k++) b.add(G.tor, VC.solid, cx, 5.8, wz - 10 + k * 2, 8.8, 5.2, 8.8, 0, 0, 0, white);
      const pz = cz + e * 29;
      b.cyl(VC.solid, white, cx, 3, pz, 4.6, 6, 'cyl8'); b.add(G.sph, VC.glow, cx, 6, pz, 9, 7, 9, 0, 0, 0, glassC); b.add(G.cone8, VC.solid, cx, 10.2, pz, 1.2, 1.4, 1.2, 0, 0, 0, white);
    }
    for (let k = 0; k < 60; k++) { const x = rand(14, 28), z = -rand(22, 78); b.sph(VC.solid, pick(['#e8202a', '#ff5a8a', '#ffd23d', '#ff8a1a', '#ffffff', '#c84aa8']), x, 0.5, z, rand(0.3, 0.45), true); }   // the dahlias
    for (let k = 0; k < 8; k++) K.person(b, rand(16, 28), -rand(10, 76), { seated: chance(0.6), ry: -Math.PI / 2 + rand(-0.6, 0.6) });
    // the left: the Music Concourse's pollarded planes in their rows, the bandshell, the de Young's twisted copper tower
    for (let x = -16; x > -52; x -= 6.5) for (let z = 6; z < 76; z += 7) {
      b.cyl(VC.solid, '#8a8070', x, 1.7, -z, 0.3, 3.4, 'cyl8');
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; b.sph(VC.solid, '#7a7060', x + Math.cos(a) * 0.6, 3.6, -z + Math.sin(a) * 0.6, 0.3, true); b.add(G.sphLow, VC.solid, x + Math.cos(a) * 1.0, 4.4, -z + Math.sin(a) * 1.0, 1.4, 1.2, 1.4, 0, 0, 0, pick(['#4a7a3a', '#5a8a44', '#3e6e34'])); }
    }
    const bx = -66, bz = -58;   // the bandshell: its half dome on piers, facing the concourse
    b.add(G.sph, wallLit, bx - 4, 0, bz, 16, 26, 22, 0, 0, 0, '#ece4d4');
    b.add(G.sph, VC.glow, bx - 3.4, 0.2, bz, 13, 22, 18, 0, 0, 0, hdr('#ffd9a0', 0.6));
    for (const e of [-1, 1]) b.block(wallLit, '#ece4d4', bx + 1, 0, bz + e * 11, 3, 14, 3);
    b.box(wallLit, '#ece4d4', bx + 1, 14.8, bz, 3.2, 2, 25);
    for (let k = 0; k < 6; k++) {   // the de Young's tower, each storey turned a little more than the last
      const y = k * 7.5, w = 11 - k * 0.5;
      b.add(G.box, VC.solid, -96, y + 3.75, -26, w, 7.5, w * 0.7, 0, (k * 0.12), 0, '#8a5a3a');
      b.add(G.box, VC.glow, -96, y + 3.75, -26, w + 0.05, 0.4, w * 0.7 + 0.05, 0, (k * 0.12), 0, hdr('#ffd9a0', 0.7));
    }
    for (let k = 0; k < 10; k++) K.person(b, rand(-14, -54), -rand(4, 76), { seated: chance(0.4) });
    for (let k = 0; k < 8; k++) (chance(0.5) ? K.gum : K.cypress)(b, pick([-1, 1]) * rand(60, 90), -rand(4, 76), rand(1.0, 1.5));
    return b.build();
  };

  // ---------- Haight and Ashbury ----------
  const haight = () => {
    const b = new Batcher(), zx = 40, R = 6.5;
    for (const s of [-1, 1]) {
      farGround(b, s, '#8a8478');
      K.kerbLane(b, s);
      for (const [z0, z1] of [[0, zx - R], [zx + R, CHUNK_LEN]]) K.houseRow(b, s, z0, z1, { x0: 11.4, colors: PSYCHE, accents: [...PSYCHE, '#1a1a20'], shopP: 0.8, signs: HAIGHT_SIGNS });
      K.road(b, s * (KERB + 60) / 2, -zx, 60 - KERB, 2 * R, 0.034);   // Ashbury Street crossing
      K.crosswalk(b, s * (KERB + 1.6), -zx, 2 * R - 0.8, 2.4, 'x', 0.046);
      K.streetSign(b, s * 7.4, -(zx - R - 0.8), s, 1, 0);
      K.throng(b, s * 7.6, s * 10.6, 2, CHUNK_LEN - 2, randi(8, 13), [[zx - R - 1, zx + R + 1]], { hippie: true });
      for (let z = rand(6, 12); z < CHUNK_LEN - 2; z += rand(24, 28)) if (Math.abs(z - zx) > R + 2) K.lamp(b, s * 7.0, -z, s);
    }
    for (const s of [-1, 1]) for (const zz of [zx - R, zx + R]) {   // the murals on the corner buildings' flanks, on walls of their own
      const e = Math.sign(zz - zx);
      b.box(VC.solid, pick(PSYCHE), s * 18.4, 6.2, -zz - e * 0.25, 13.8, 12.4, 0.5);
      b.add(planeUV(K.muralRects[randi(0, 5)]), K.muralMat, s * 18.4, 6.5, -zz + e * 0.02, 13.4, 9.4, 1, 0, e < 0 ? Math.PI : 0, 0);
    }
    // the legs in fishnet stockings kicking out of a first-floor window, a flowered VW bus, a drum circle, tie-dye on a rack
    const lz = -58;
    for (const e of [-1, 1]) {
      beam(b, VC.solid, -11.8, 6.25, lz + e * 0.32, -8.6, 6.9, lz + e * 0.5, 0.42, '#2a2028');   // from inside the window
      beam(b, VC.solid, -8.6, 6.9, lz + e * 0.5, -6.6, 6.3, lz + e * 0.6, 0.34, '#2a2028');
      b.add(G.box, VC.solid, -6.4, 6.1, lz + e * 0.6, 0.6, 0.3, 0.28, 0, 0, -0.5, '#e8202a');
    }
    K.vwBus(b, 5.2, -64, 1);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, x = 9 + Math.cos(a) * 1.2, z = -22 + Math.sin(a) * 1.2; K.person(b, x, z, { seated: true, hippie: true, ry: -a + Math.PI / 2 }); b.cyl(VC.solid, '#a8703a', x - Math.cos(a) * 0.4, 0.3, z - Math.sin(a) * 0.4, 0.18, 0.5, 'cyl8'); }
    b.box(VC.metal, '#3a3a3a', -10.2, 1.8, -16, 0.05, 0.05, 2.4);
    for (const e of [-1, 1]) { b.cyl(VC.metal, '#3a3a3a', -10.2, 0.91, -16 + e * 1.18, 0.025, 1.82, 'cyl6'); b.box(VC.metal, '#3a3a3a', -10.2, 0.02, -16 + e * 1.18, 0.6, 0.04, 0.05); }   // its legs
    for (let k = 0; k < 7; k++) b.add(G.plane, VC.solid, -10.2, 1.25, -15 - k * 0.3, 0.5, 0.95, 1, 0, Math.PI / 2, 0, pick(TIEDYE));
    return b.build();
  };

  // ---------- Alamo Square: the Painted Ladies ----------
  const alamo = () => {
    const b = new Batcher();
    // the right: Postcard Row, seven Queen Annes in a line up Steiner Street, each in its own colours
    farGround(b, 1, '#8a8478');
    street(b, 1, { n: [5, 9] });
    const LADY = [['#f0e2c8', '#2a5a6a'], ['#c8d8ea', '#7a2a3a'], ['#ecc8d2', '#2a3a5a'], ['#d8e8c8', '#a83a2a'], ['#f2d8a2', '#3a5a3a'], ['#d4c8e4', '#c8902a'], ['#eccebe', '#2a5a6a']];
    LADY.forEach(([col, acc], i) => K.house(b, 1, X0, -(12 + i * 7.75 + 3.8), { w: 7.6, d: 13, style: 'queen', floors: 2, col, acc, trim: '#fbf8f0', base: i * 0.42, garage: false, turret: false, lit: 0.5, foot: 4 }));
    K.house(b, 1, X0, -6, { w: 7.6, floors: 3, style: 'italianate', garage: true });
    // the left: the park's hill, people on its grass looking across at them, the dogs, cypress and pines along its top
    farGround(b, -1, '#5a7a3a');
    K.kerbLane(b, -1);
    const hx = -72, hy = -16, hz = -40, hm = hillMesh(G.sphLow, hx, hy, hz, 120, 56, 92);
    b.add(G.sphLow, VC.solid, hx, hy, hz, 120, 56, 92, 0, 0, 0, '#6a8a42');
    b.block(VC.solid, '#c8c0b0', -11.2, 0, -40, 0.6, 0.9, 80);
    for (let k = 0; k < 26; k++) {
      const x = rand(-24, -62), z = -rand(10, 72), y = surfaceY(hm, x, z, -50);
      if (y < 0.3) continue;
      K.person(b, x, z, { y, seated: chance(0.7), ry: -Math.PI / 2 + rand(-0.5, 0.5), camera: chance(0.2) });
      if (chance(0.5)) b.add(G.plane, VC.solid, x + 0.2, y + 0.04, z, 1.6, 1.3, 1, -Math.PI / 2, 0, 0, pick(['#c8302a', '#2a6ab0', '#f2c230', '#f4f0e8']));
    }
    for (let k = 0; k < 3; k++) K.dog(b, -rand(8, 10.5), -rand(6, 74));
    for (let k = 0; k < 9; k++) { const x = rand(-58, -86), z = -rand(6, 74), y = surfaceY(hm, x, z, -50); if (y > 1) K.cypress(b, x, z, rand(0.8, 1.1), { y: y - 0.3, ry: Math.PI }); }
    return b.build();
  };

  // ---------- the Castro ----------
  const castro = () => {
    const b = new Batcher(), tz = -40;
    // the left: the Castro Theatre: its Spanish baroque front, the marquee lit up over the pavement, the great blade sign
    farGround(b, -1, '#8a8478');
    K.kerbLane(b, -1, { x1: 12 });
    for (const [z0, z1] of [[0, 28], [52, CHUNK_LEN]]) K.houseRow(b, -1, z0, z1, { x0: 12, shopP: 0.85, signs: VIC_SIGNS, floors: [2, 3] });
    b.block(wallLit, '#e8dcc4', -24, 0, tz, 24, 15, 22);
    b.block(wallLit, '#e8dcc4', -12.6, 15, tz, 1.2, 4, 10); b.add(G.sph, wallLit, -12.6, 19, tz, 1.2, 4, 10, 0, 0, 0, '#e8dcc4');   // the curved gable
    for (const e of [-1, 1]) b.block(wallLit, '#d8cab0', -12.4, 0, tz + e * 9.5, 1.4, 16.4, 2.2);
    b.box(VC.glow, hdr('#ffd9a0', 1.0), -11.96, 10.5, tz, 0.06, 5, 6);
    b.add(G.cyl, VC.glow, -11.96, 13, tz, 6, 0.06, 6, 0, 0, Math.PI / 2, hdr('#ffd9a0', 1.0));
    b.box(VC.solid, '#3a2a24', -11.9, 2.1, tz, 0.1, 4.2, 12);
    b.block(VC.solid, '#2a2028', -10, 4.2, tz, 4.4, 1.6, 14);   // the marquee, its bulbs, its letters
    for (const [x, z, ry, w] of [[-7.78, tz, Math.PI / 2, 14], [-10, tz - 7.02, Math.PI, 4.4], [-10, tz + 7.02, 0, 4.4]]) b.add(G.plane, K.label(w > 5 ? 'CASTRO · FILM FESTIVAL' : 'CASTRO', { w: 1024, h: 160, color: '#ff4a3a', bg: '#f4ecd8', font: NEON, weight: 400, size: 0.55, k: 1.3 }), x, 5.0, z, w - 0.4, 1.2, 1, 0, ry, 0);
    for (let k = 0; k <= 28; k++) b.sph(VC.glow, hdr('#ffe8a0', 2.4), -7.75, 4.15, tz - 7 + k * 0.5, 0.07, true);
    const blade = basic({ map: bladeTex(), color: hdr('#ffffff', 1.35) });
    b.block(VC.solid, '#c8302a', -11.6, 6.4, tz, 2.4, 0.4, 0.6);
    b.add(G.box, VC.solid, -10.4, 15.2, tz, 2.6, 17.6, 0.5, 0, 0, 0, '#f2e6c8');
    for (const e of [-1, 1]) b.add(G.plane, blade, -10.4, 15.2, tz + e * 0.26, 2.6, 17.6, 1, 0, e > 0 ? 0 : Math.PI, 0);
    // the right: Harvey Milk Plaza and the great rainbow flag over it, the way down to Muni; rainbow flags on the lamps,
    // the rainbow crossing at the corner, the bars' neon
    farGround(b, 1, '#8a8478');
    K.kerbLane(b, 1, { x1: 13 });
    pave(b, EDGE + 7, 30, 18, 62);
    b.cyl(VC.metal, '#d8dce0', 22, 13, -40, 0.18, 26, 'cyl8');
    for (let k = 0; k < 4; k++) b.add(G.plane, flagMat, 22, 22.4, -41.3 - k * 2.4, 2.5, 6.5, 1, 0, Math.PI / 2 + (k % 2 ? 0.25 : -0.25), 0);
    K.muniEntrance(b, 15.5, -50, 1);
    for (const [z0, z1] of [[0, 16], [64, CHUNK_LEN]]) K.houseRow(b, 1, z0, z1, { x0: 12, shopP: 0.9, signs: VIC_SIGNS, floors: [2, 3] });
    for (const [z, txt, c] of [[8, 'BAR', '#ff3a8a'], [70, 'COCKTAILS', '#3ad8ff']]) b.add(G.plane, K.label(txt, { w: 512, h: 128, color: c, glow: c, font: NEON, size: 0.6, k: 1.6 }), 11.85, 6.6, -z, 3.6, 0.9, 1, 0, face(1), 0);
    const RB = ['#e8202a', '#ff8a1a', '#ffd23d', '#2a9a4a', '#2a5ad8', '#7a2a9a'];
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) b.box(VC.solid, RB[k], s * (EDGE + KERB) / 2, 0.047, -66 + k * 0.62, KERB - EDGE, 0.01, 0.6);   // the rainbow crossing over the road
    for (const s of [-1, 1]) for (let z = 8; z < 78; z += 22) { K.lamp(b, s * 7.0, -z, s); b.add(G.plane, flagMat, s * 7.0, 5.2, -z - 0.47, 0.7, 1.2, 1, 0, Math.PI / 2, 0); b.box(VC.metal, '#4a4e46', s * 7.0, 5.82, -z - 0.45, 0.04, 0.04, 0.82); }
    K.crowd(b, 7.8, 12, 2, 78, 14); K.crowd(b, -7.8, -11.5, 2, 78, 12);
    return b.build();
  };

  // ---------- Mission Dolores, Dolores Park ----------
  const mission = () => {
    const b = new Batcher();
    // the left: the old mission's white adobe chapel, its bells in the gable, the basilica beside it with its two towers;
    // palms along the street
    farGround(b, -1, '#8a8478');
    K.kerbLane(b, -1, { x1: 13 });
    for (let z = 6; z < 78; z += 14) K.fanPalm(b, -10.6, -z, rand(1.0, 1.15));
    const cz = -24;
    b.block(wallLit, '#f6f2ea', -24, 0, cz, 20, 8.6, 11);
    b.addM(new THREE.ExtrudeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-6.2, 0); s.lineTo(6.2, 0); s.lineTo(0, 2.6); s.closePath(); return s; })(), { depth: 21, bevelEnabled: false }), VC.solid, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(-34.5, 8.6, cz), '#a8583a');
    for (let k = 0; k < 4; k++) b.cyl(wallLit, '#ece6dc', -13.9, 3.6, cz - 4.2 + k * 2.8, 0.36, 7.2, 'cyl8');
    b.box(VC.solid, '#5a3a24', -13.9, 1.4, cz, 0.1, 2.8, 2.0);
    b.box(VC.solid, '#ece6dc', -13.6, 6.0, cz, 1.0, 0.25, 9);
    for (const o of [-2.6, 0, 2.6]) { b.box(VC.solid, '#3a2a24', -13.93, 7.4, cz + o, 0.06, 1.3, 1.0); b.sph(VC.metal, '#c8a050', -13.95, 7.3, cz + o, 0.38); }
    const bz = -50;
    b.block(wallLit, '#f2ece2', -28, 0, bz, 26, 14, 22);
    for (const e of [-1, 1]) {   // the basilica's towers, their domes and lanterns
      const tzz = bz + e * 9;
      b.block(wallLit, '#f2ece2', -16.5, 0, tzz, 5, 24, 5);
      b.cyl(wallLit, '#ece4d6', -16.5, 26, tzz, 2.2, 4, 'cyl8');
      b.add(G.sph, wallLit, -16.5, 28, tzz, 4.8, 4.4, 4.8, 0, 0, 0, '#e8dcc8');
      b.cyl(wallLit, '#ece4d6', -16.5, 31, tzz, 0.8, 2, 'cyl8');
      b.add(G.cone8, VC.metal, -16.5, 32.6, tzz, 0.4, 1.2, 0.4, 0, 0, 0, '#c8a050');
      for (const y of [10, 17, 21.5]) b.box(VC.glow, hdr('#ffd9a0', 0.9), -13.97, y, tzz, 0.06, 2.2, 1.2);
    }
    b.add(G.cyl, VC.glow, -14.95, 10, bz, 4.2, 0.08, 4.2, 0, 0, Math.PI / 2, hdr('#ffc880', 1.2));   // the rose window
    for (const o of [-3, 0, 3]) b.box(VC.solid, '#3a2a24', -14.97, 2.2, bz + o, 0.08, 4.4, 2.2);
    for (let z = 66; z < 78; z += 6) K.house(b, -1, 13, -z - 3, { w: 6, shop: chance(0.5) ? VIC_SIGNS : null });
    K.crowd(b, -8, -12, 2, 78, 12);
    // the right: Dolores Park, its lawns climbing away from the street covered in people, the palms, the J-Church car
    // crossing it on its own terrace, the city's towers beyond
    K.kerbLane(b, 1, { x1: 11.5 });
    const gr = 0.2, ang = Math.atan(gr), yAt = (x) => Math.max(0, (x - 12) * gr), T = 40, L = 110 / Math.cos(ang), n = new THREE.Vector3(-Math.sin(ang), Math.cos(ang), 0);
    const c = V(12 + 55, (110 * gr) / 2, -40).addScaledVector(n, -T / 2);
    b.add(G.box, VC.solid, c.x, c.y, c.z, L, T, 84, 0, 0, ang, '#6a8a3e');
    b.block(VC.solid, '#c8c0b0', 11.8, -0.5, -40, 0.4, 1.3, 80);
    for (let k = 0; k < 40; k++) {
      const x = rand(16, 90), z = -rand(4, 76), y = yAt(x);
      if (Math.abs(x - 70) < 4) continue;
      K.person(b, x, z, { y, seated: chance(0.65), ry: -Math.PI / 2 + rand(-0.8, 0.8) });
      if (chance(0.4)) b.addM(G.plane, VC.solid, new THREE.Matrix4().makeRotationZ(ang).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)).scale(V(1.6, 1.3, 1)).setPosition(x + 0.2, yAt(x + 0.2) + 0.05, z), pick(['#c8302a', '#2a6ab0', '#f2c230', '#f4f0e8', '#3a8a5a']));
    }
    for (let k = 0; k < 8; k++) { const x = rand(20, 100), z = -rand(4, 76); if (Math.abs(x - 70) > 5) K.palm(b, x, z, rand(1.4, 1.8), { y: yAt(x) - 0.2 }); }
    b.block(VC.solid, '#7a7a5a', 70, -1, -40, 9, yAt(70) + 1, 84);   // the J-Church's terrace, its rails, the car on it
    for (const e of [-0.72, 0.72]) b.box(VC.metal, '#c8ccd4', 70 + e, yAt(70) + 0.06, -40, 0.08, 0.06, 84);
    const jy = yAt(70) + 0.1, jz = -36;
    b.block(VC.solid, '#2a2a2e', 70, jy, jz, 2.2, 0.5, 13);
    b.block(VC.solid, '#e8e2d4', 70, jy + 0.45, jz, 2.6, 2.8, 14);
    b.box(VC.metal, '#1a1a1e', 70, jy + 5.35, -40, 0.04, 0.04, 84);
    for (const zz of [-12, -66]) { b.cyl(VC.metal, '#4a4e46', 74, jy + 2.9, zz, 0.1, 5.8, 'cyl8'); beam(b, VC.metal, 74, jy + 5.6, zz, 69.8, jy + 5.4, zz, 0.05, '#4a4e46'); }
    b.box(VC.solid, '#c8302a', 70, jy + 1.0, jz, 2.62, 0.5, 14);
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#ffe8c0', 1.0), 70 + e * 1.31, jy + 2.2, jz, 0.03, 1.0, 12);
    beam(b, VC.metal, 70, jy + 3.2, jz + 3, 70, jy + 5.2, jz - 2, 0.05, '#2a2a2e');
    return b.build();
  };

  return {
    landmarks: {
      ferry: { key: 'ferry', name: '渡轮大厦 · 海湾大桥', en: 'FERRY BUILDING · BAY BRIDGE', build: ferry },
      cablecar: { key: 'cablecar', name: '叮当车转盘 · 联合广场', en: 'CABLE CAR TURNAROUND · UNION SQUARE', build: cablecar },
      lombard: { key: 'lombard', name: '九曲花街', en: 'LOMBARD STREET', build: lombard },
      wharf: { key: 'wharf', name: '渔人码头 · 39 号码头', en: "FISHERMAN'S WHARF · PIER 39", build: wharf },
      palace: { key: 'palace', name: '艺术宫', en: 'PALACE OF FINE ARTS', build: palace },
      ggpark: { key: 'ggpark', name: '金门公园 · 花卉温室', en: 'GOLDEN GATE PARK · CONSERVATORY OF FLOWERS', build: ggpark },
      haight: { key: 'haight', name: '海特-阿什伯里', en: 'HAIGHT-ASHBURY', build: haight },
      alamo: { key: 'alamo', name: '阿拉莫广场 · 彩绘女士', en: 'ALAMO SQUARE · PAINTED LADIES', build: alamo },
      castro: { key: 'castro', name: '卡斯特罗区', en: 'THE CASTRO', build: castro },
      mission: { key: 'mission', name: '教会区 · 多洛雷斯公园', en: 'MISSION DOLORES · DOLORES PARK', build: mission },
    },
    update(t) { for (const f of upd) f(t); },
  };
}
