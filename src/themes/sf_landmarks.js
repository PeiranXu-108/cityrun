// San Francisco's landmark scenes (the two on the Golden Gate Bridge are in sf_bridge.js), in the order the run meets
// them: the Ferry Building under the Bay Bridge; the cable car turntable at Powell and Market, Union Square across the
// street; Lombard Street's eight bends; Fisherman's Wharf and Pier 39's sea lions; the Palace of Fine Arts over its
// lagoon; the Conservatory of Flowers in Golden Gate Park; Haight and Ashbury; the Painted Ladies of Alamo Square; the
// Castro Theatre and the rainbow flag; Mission Dolores and Dolores Park. Every sign is in English.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, planeUV, shade, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { EDGE, farGround } from './common.js';
import { beam } from './tokyo_kit.js';
import { frame, figure } from './ny_icons.js';
import { puffs } from './taipei_towers.js';
import { sparkles } from './paris_kit.js';
import { uplit, mirrorInto, mergeInto, clearWater, lastAdditive, dim } from './beijing_sights.js';
import { ferryTower, clockTex, rotunda } from './sf_icons.js';
import { X0, KERB, SANS, SERIF, WEST, NEON, GROOVY, PAINTED, STUCCO, PSYCHE, TIEDYE, WARM, VIC_SIGNS, HAIGHT_SIGNS, WHARF_SIGNS, GI, face, HALFDISC } from './sf_kit.js';

const UP = new THREE.Vector3(0, 1, 0), I4 = new THREE.Matrix4();
const _ray = new THREE.Raycaster(), _from = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0);
// the height of a hill's surface under (x, z), cast down onto a mesh standing exactly where the hill is drawn
function surfaceY(mesh, x, z, fallback = 0) { _ray.set(_from.set(x, 500, z), _down); const h = _ray.intersectObject(mesh, false)[0]; return h ? h.point.y : fallback; }
function hillMesh(geo, x, y, z, sx, sy, sz, ry = 0) { const m = new THREE.Mesh(geo); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.y = ry; m.updateMatrixWorld(true); return m; }
// a flat strip from p0 to p1 (a length of road), w wide and t thick, lying level across its width
function strip(b, mat, col, p0, p1, w, t = 0.12, tiled = null) {   // tiled(L): a box of that size with its texture tiled in metres
  const d = new THREE.Vector3().subVectors(p1, p0), L = d.length(), Z = d.clone().normalize(), X = UP.clone().cross(Z).normalize(), Y = Z.clone().cross(X).normalize();
  b.addM(tiled ? tiled(L) : G.box, mat, new THREE.Matrix4().makeBasis(X, Y, Z).scale(tiled ? new THREE.Vector3(1, 1, 1) : new THREE.Vector3(w, t, L)).setPosition(p0.clone().add(p1).multiplyScalar(0.5)), col);
}
const P16 = new THREE.CylinderGeometry(0.5, 0.5, 1, 16), TUBE24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24, 1, true);   // a sixteen-sided drum; a ring band
const TWIST = (() => {   // the de Young's tower: its plan turning as it rises, 11 × 7.7 m and 45 m tall, a half radian from foot to top
  const g = new THREE.BoxGeometry(11, 45, 7.7, 1, 9, 1); g.translate(0, 22.5, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), a = (y / 45) * 0.5, x = p.getX(i), z = p.getZ(i); p.setXYZ(i, x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)); }
  g.computeVertexNormals(); return g;
})();
const FLAG = (() => { const g = new THREE.PlaneGeometry(9, 5.8, 14, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const u = (p.getX(i) + 4.5) / 9; p.setZ(i, Math.sin(u * Math.PI * 3.2) * 0.45 * u); } g.computeVertexNormals(); return g; })();   // a flag 9 m long blowing out from its pole, rippling more toward its free end
const BRICKDISC = (() => { const g = new THREE.CylinderGeometry(2.6, 2.6, 0.2, 18), uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 2, p.getZ(i) / 2); return g; })();   // a bend's paving, its bricks in metres
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ARCH = new THREE.TorusGeometry(0.5, 0.08, 6, 12, Math.PI);   // G.tor's upper half
// an arch's moulding: n blocks round a half circle of radius r about (x, y, z) in the plane facing along z (ry turns it),
// each t across and d deep
function archivolt(b, mat, col, x, y, z, r, { n = 8, t = 0.4, d = 0.3, ry = 0 } = {}) {
  const c = Math.cos(ry), s = Math.sin(ry);
  for (let j = 0; j < n; j++) { const m = (Math.PI * (j + 0.5)) / n, u = Math.cos(m) * r; b.add(G.box, mat, x + u * c, y + Math.sin(m) * r, z - u * s, r * (Math.PI / n) * 1.04, t, d, 0, ry, m + Math.PI / 2, col); }
}
const HEART = (() => {   // the heart of the hearts round Union Square: its outline, extruded and rounded at the edges, standing on its point
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(-0.15, 0.2, -0.55, 0.4, -0.55, 0.7); s.bezierCurveTo(-0.55, 0.95, -0.3, 1.05, -0.15, 1.0); s.bezierCurveTo(-0.05, 0.97, 0, 0.9, 0, 0.82);
  s.bezierCurveTo(0, 0.9, 0.05, 0.97, 0.15, 1.0); s.bezierCurveTo(0.3, 1.05, 0.55, 0.95, 0.55, 0.7); s.bezierCurveTo(0.55, 0.4, 0.15, 0.2, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 2, curveSegments: 6 });
  g.translate(0, 0, -0.15); return g;
})();

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
function bladeTex() {   // the Castro Theatre's great vertical sign: CASTRO in cream letters down a red blade, a gold border, a blue line inside it
  return canvasTex(128, 512, (g, w, h) => {
    g.fillStyle = '#c41e26'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e8b84a'; g.lineWidth = 9; g.strokeRect(5, 5, w - 10, h - 10);
    g.strokeStyle = '#2a4aa0'; g.lineWidth = 4; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = '#f6ecd4'; g.shadowColor = 'rgba(40,10,10,0.8)'; g.shadowBlur = 4; g.font = `700 70px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    [...'CASTRO'].forEach((c, i) => g.fillText(c, w / 2, 50 + i * 82));
  }, { repeat: false });
}
function chevronTex() {   // the band along the top of the Castro's marquee: zigzags of red, gold and blue
  return canvasTex(256, 32, (g, w, h) => {
    g.fillStyle = '#c41e26'; g.fillRect(0, 0, w, h);
    for (const [c, o] of [['#e8b84a', 0], ['#2a4aa0', 8]]) { g.strokeStyle = c; g.lineWidth = 5; g.beginPath(); for (let x = -16; x <= w + 16; x += 16) g.lineTo(x, (x / 16) % 2 ? 6 + o : 18 + o); g.stroke(); }
  });
}
function rainbowTex() {   // the rainbow flag's six stripes
  return canvasTex(64, 96, (g, w, h) => { ['#e8202a', '#ff8a1a', '#ffd23d', '#2a9a4a', '#2a5ad8', '#7a2a9a'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, (i * h) / 6, w, h / 6 + 1); }); }, { repeat: false });
}

function crab(b, x, y, z, ry) {   // a cooked Dungeness crab: the shell, four legs a side, the claws
  const ca = Math.cos(ry), sa = Math.sin(ry), P = (fx, fz) => [x + fx * ca + fz * sa, y, z - fx * sa + fz * ca];
  b.add(G.sphLow, VC.solid, ...P(0, 0), 0.34, 0.12, 0.24, 0, ry, 0, '#e8502a');
  for (const e of [-1, 1]) {
    for (let k = 0; k < 4; k++) b.add(G.box, VC.solid, ...P(e * 0.2, -0.08 + k * 0.06), 0.16, 0.025, 0.025, 0, ry + e * (0.3 - k * 0.2), 0, '#d8442a');
    b.add(G.box, VC.solid, ...P(e * 0.12, -0.18), 0.05, 0.05, 0.12, 0, ry + e * 0.4, 0, '#c83a22');
  }
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
      for (const o of [-1, 1]) b.box(VC.metal, '#9aa0a8', T + o * 2.05, H / 2, vz + e * 8, 0.12, H - 4, 1.2);   // the legs' recessed panels
      b.box(VC.metal, '#a8aeb6', T, H + 1.2, vz + e * 8, 3.2, 2.4, 4.4);   // the saddle the cable rides over
      const P = []; for (let x = 56; x <= 480; x += 8) P.push([x, cy(x), vz + e * 8]);
      for (let i = 1; i < P.length; i++) W.span(G.cyl8, VC.metal, '#c8ccd2', P[i - 1], P[i], 1.3);
    }
    const lv = [vy + 10, vy + 30, vy + 54, H - 4];
    for (const y of lv.slice(1)) b.box(VC.metal, '#b8bec6', T, y, vz, 4, 3, 20);
    for (let i = 0; i < lv.length - 1; i++) for (const e of [-1, 1]) W.beam(VC.metal, '#a8aeb6', [T, lv[i] + 1.5, vz - e * 6.6], [T, lv[i + 1] - 1.5, vz + e * 6.6], 1.0, 1.4);   // the X bracing between the struts
    b.add(G.plane, K.water, 260, -1.25, -28, 440, 56, 1, -Math.PI / 2, 0, 0);
    const pts = [];
    for (let x = 60; x < 470; x += 5) { const top = cy(x); for (let y = vy + 10; y < top; y += 2.2) pts.push(x, y, vz + 8.7); }
    const lights = sparkles(pts, { size: 1.0 }); lights.material.uniforms.on.value = 1;
    upd.push((t) => { lights.material.uniforms.time.value = t; });
    // the Ferry Building across the end of the street: its wings and their arcades, the arch, the hall, the clock tower
    const fz = -58, D = 22, sand = '#ece2d0', trim = '#f6eee0';
    for (const s of [-1, 1]) {
      b.block(wallLit, sand, s * 25, 0, fz - D / 2, 30, 11.5, D);
      b.box(wallLit, '#f4ecdc', s * 25, 11.9, fz - D / 2, 30.4, 0.8, D + 0.4);   // the cornice, the parapet over it
      b.box(wallLit, sand, s * 25, 12.8, fz - 0.4, 30.4, 1.0, 0.5); b.box(wallLit, trim, s * 25, 13.36, fz - 0.4, 30.6, 0.12, 0.62);
      // the arcade: round-headed arches on the ground floor, each in its moulding under its keystone, the lit shops in them; an arched window over each on its sill; the pilasters between; the string course
      for (let x = 12.5; x < 39; x += 4.3) {
        b.box(VC.glow, hdr('#ffd9a0', 0.85), s * x, 2.2, fz + 0.03, 2.6, 3.6, 0.05); b.add(HALFDISC, VC.glow, s * x, 4.0, fz + 0.03, 2.6, 2.6, 0.05, 0, 0, 0, hdr('#ffd9a0', 0.85));
        archivolt(b, wallLit, trim, s * x, 4.0, fz + 0.12, 1.5, { n: 6, t: 0.3, d: 0.2 });
        b.box(wallLit, trim, s * x, 5.62, fz + 0.16, 0.42, 0.6, 0.26);
        b.box(VC.glow, hdr(pick(WARM), 0.75), s * x, 8.0, fz + 0.03, 1.5, 1.8, 0.05); b.add(HALFDISC, VC.glow, s * x, 8.9, fz + 0.03, 1.5, 1.5, 0.05, 0, 0, 0, hdr(pick(WARM), 0.75));
        archivolt(b, wallLit, trim, s * x, 8.9, fz + 0.1, 0.9, { n: 5, t: 0.18, d: 0.14 });
        b.box(wallLit, trim, s * x, 6.98, fz + 0.1, 2.0, 0.12, 0.2);
      }
      for (let x = 10.35; x < 41; x += 4.3) { b.box(wallLit, trim, s * x, 5.6, fz + 0.1, 0.55, 11.2, 0.2); b.box(wallLit, trim, s * x, 11.1, fz + 0.16, 0.8, 0.4, 0.3); b.box(wallLit, trim, s * x, 0.3, fz + 0.16, 0.8, 0.6, 0.3); }
      b.box(wallLit, trim, s * 25, 6.4, fz + 0.12, 30, 0.3, 0.24);
      b.block(wallLit, sand, s * 8.2, 0, fz - D / 2, 3.6, 13.4, D);   // the arch's piers, the hall's walls
      for (const x of [7.3, 9.1]) K.column(b, wallLit, s * x, 0, fz + 0.55, 11.2, 0.42, trim);   // the paired columns on each pier's face
      for (let k = 0; k < 4; k++) {   // the shops along the hall, lit
        const zz = fz - 3 - k * 5, sign = pick(VIC_SIGNS);
        b.add(planeUV(K.goodsRects[GI[sign.goods]]), K.goodsMat, s * 6.37, 2.0, zz, 3.6, 2.6, 1, 0, face(s), 0);
        b.add(planeUV(K.signRects[sign.i]), K.signMat, s * 6.36, 3.8, zz, 3.4, 0.74, 1, 0, face(s), 0);
      }
    }
    b.block(wallLit, sand, 0, 13.4, fz - D / 2, 20, 5.2, D);
    b.box(wallLit, trim, 0, 12.0, fz + 0.3, 20.4, 0.9, 0.7);   // the entablature over the columns
    b.box(VC.glow, hdr('#ffe0b0', 0.8), 0, 13.35, fz - D / 2, 12.6, 0.06, D - 1);
    // over the opening, under the tower: the great fanlight, its glazing bars, the moulding round it
    b.add(HALFDISC, VC.glow, 0, 13.4, fz + 0.03, 9.6, 9.6, 0.05, 0, 0, 0, hdr('#ffe0b0', 0.95));
    for (let x = -4; x <= 4; x += 1) { const h = Math.sqrt(Math.max(0, 23 - x * x)); b.box(wallLit, '#d8ccb8', x, 13.4 + h / 2, fz + 0.07, 0.1, h, 0.05); }
    for (const y of [1.4, 2.8, 4.0]) { const w = 2 * Math.sqrt(Math.max(0, 23 - y * y)); b.box(wallLit, '#d8ccb8', 0, 13.4 + y, fz + 0.07, w, 0.1, 0.05); }
    archivolt(b, wallLit, trim, 0, 13.4, fz + 0.16, 5.15, { n: 12, t: 0.5, d: 0.3 });
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
    b.cyl(VC.solid, '#6a4a2a', tx, 0.09, tz, 4.8, 0.14, 'cyl');   // the turntable: its planks, the steel rim, the rails and the cable slot across it
    for (let k = -4; k <= 4; k++) b.box(VC.solid, '#5a3a20', tx + k * 1.05, 0.165, tz, 0.05, 0.01, Math.sqrt(Math.max(0, 23 - (k * 1.05) ** 2)) * 2);
    b.add(G.tor, VC.metal, tx, 0.16, tz, 9.7, 9.7, 3, Math.PI / 2, 0, 0, '#8a8e94');
    for (const e of [-0.72, 0, 0.72]) b.add(G.box, VC.metal, tx + Math.cos(0.6) * e, 0.175, tz - Math.sin(0.6) * e, e ? 0.08 : 0.06, 0.02, 9.4, 0, 0.6, 0, e ? '#c8ccd4' : '#141416');
    K.place(b, (t) => K.cableCar(t, { riders: 0.15 }), new THREE.Matrix4().makeRotationY(0.6).setPosition(tx, 0.16, tz));
    for (const e of [-1, 1]) K.person(b, tx + e * Math.sin(0.6) * 4.6, tz + e * Math.cos(0.6) * 4.6, { ry: 0.6 + (e > 0 ? Math.PI : 0), top: '#2a3a5a', hat: 'cap', push: true, bag: false, phone: false });   // the crew pushing it round
    for (const e of [-0.72, 0.72]) b.box(VC.metal, '#c8ccd4', (tx + 6 + 120) / 2, 0.05, tz + e, 120 - tx, 0.04, 0.08);
    b.box(VC.solid, '#141416', (tx + 6 + 120) / 2, 0.045, tz, 120 - tx, 0.02, 0.06);
    K.place(b, (t) => K.cableCar(t, { sign: 'POWELL & MASON' }), new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(46, 0.05, tz));
    for (const [z0, z1] of [[4, 24], [40, 78]]) { const zc = -(z0 + z1) / 2; b.addM(K.tiledBox(28, 26, z1 - z0, 3), K.stoneMat, new THREE.Matrix4().makeTranslation(36, 13, zc), '#f0e4d4'); for (let k = 0; k < Math.floor((z1 - z0) / 4); k++) b.box(VC.glow, hdr('#fff0d0', 0.8), 21.97, 2.4, -(z0 + 2 + k * 4), 0.05, 3.4, 3); }
    for (let z = 36; z < 70; z += 2.4) b.cyl(VC.metal, '#c8a050', 12.2, 0.5, -z, 0.04, 1.0, 'cyl6');
    b.box(VC.solid, '#7a1a24', 12.2, 0.92, -53, 0.04, 0.04, 34);
    for (let z = 37; z < 69; z += 1.05) K.person(b, 13.0 + rand(-0.3, 0.3), -z, { ry: Math.PI + rand(-0.3, 0.3), camera: chance(0.3) });
    b.cyl(VC.metal, '#3a3e44', 11.4, 1.6, -24, 0.06, 3.2, 'cyl6');
    b.add(G.plane, K.label('POWELL ST · CABLE CAR TURNAROUND', { w: 1024, h: 128, color: '#ffffff', bg: '#7a1a24', font: SANS, weight: 700, size: 0.5, k: 1.05 }), 11.4, 3.3, -24, 3.6, 0.45, 1, 0, 0, 0);
    // the left: Union Square raised on its granite, the Dewey Monument's column and Victory on it, palms at its corners,
    // a painted heart, café tables, the stores beyond lit up
    farGround(b, -1, '#8a8478');
    K.kerbLane(b, -1, { x1: 12.5 });
    for (let z = 14; z < 78; z += 26) K.pathOfGold(b, -7.2, -z, -1);
    b.block(VC.solid, '#b8b2a8', -42, 0, -44, 58, 0.9, 64);
    for (let k = 0; k < 3; k++) b.block(VC.solid, '#c8c2b8', -13.4 - k * 0.4, 0, -44, 0.4, 0.3 * (k + 1), 64 - k);
    const mx = -30, mz = -58, gr = '#d8d0c4', bronze = '#4a3a24';   // the Dewey Monument: the granite pedestal, its plinth, the die and its bronze plaques, the cornice; the Corinthian column; Victory
    b.block(VC.solid, shade(gr, 0.92), mx, 0.9, mz, 6.4, 0.8, 6.4); b.block(VC.solid, gr, mx, 1.7, mz, 5.2, 3.0, 5.2); b.block(VC.solid, shade(gr, 1.04), mx, 4.7, mz, 5.8, 0.6, 5.8);
    for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; b.box(VC.metal, '#6a5a32', mx + Math.sin(a) * 2.62, 3.2, mz + Math.cos(a) * 2.62, Math.abs(Math.cos(a)) * 2.4 + 0.04, 1.6, Math.abs(Math.sin(a)) * 2.4 + 0.04); }
    K.column(b, VC.solid, mx, 5.3, mz, 28, 1.1, '#e8e0d4');
    b.block(VC.solid, gr, mx, 33.3, mz, 2.6, 1.0, 2.6); b.cyl(VC.metal, bronze, mx, 34.55, mz, 0.7, 0.5, 'cyl8');
    const Vf = frame(b, mx, 34.8, mz, 1.9, 0);   // Victory in bronze, facing the street: winged, the trident in her left hand, the wreath held out in her right
    figure(Vf, VC.metal, bronze, { arms: 'out', skirt: true, cloak: true });
    for (const e of [-1, 1]) Vf.add(G.box, VC.metal, -0.28, 1.72, e * 0.3, 0.05, 1.0, 0.42, e * 0.45, 0, -0.35, bronze);
    Vf.beam(VC.metal, bronze, [0.06, 0.05, -0.34], [0.1, 2.5, -0.34], 0.05); Vf.beam(VC.metal, bronze, [0.1, 2.46, -0.48], [0.1, 2.46, -0.2], 0.04); for (const o of [-0.12, 0, 0.12]) Vf.beam(VC.metal, bronze, [0.1, 2.45, -0.34 + o], [0.1, 2.75, -0.34 + o * 1.4], 0.035);
    Vf.add(G.tor, VC.metal, 0.86, 1.5, 0.36, 0.42, 0.42, 0.42, 0, Math.PI / 2, 0, '#6a7a3a');
    for (const [x, z] of [[-16, -16], [-68, -16], [-68, -72], [-54, -40], [-58, -64]]) K.palm(b, x, z, rand(1.6, 1.9), { y: 0.9 });
    for (const [x, z] of [[-17, -40], [-17, -60]]) {   // a heart on its plinth, painted all over
      b.block(VC.solid, '#c8c2b8', x, 0.9, z, 1.6, 0.6, 1.6);
      const hc = pick(['#e8302a', '#ff5a8a', '#2a6ad8', '#ffd23d', '#39b8a8']);
      b.add(HEART, VC.solid, x, 1.5, z, 2.4, 2.4, 2.0, 0, Math.PI / 2, 0, hc);
      for (let k = 0; k < 7; k++) b.add(G.cyl8, VC.solid, x + 0.4, rand(2.6, 3.5), z + rand(-0.55, 0.55), rand(0.16, 0.3), 0.03, rand(0.16, 0.3), 0, 0, Math.PI / 2, pick(['#ffffff', '#ffd23d', '#2a6ad8', '#7cd84a', '#ff8a1a']));
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
    // the bends in red brick: straight runs, each hairpin swept round on an arc (its centre line rt from the turn's
    // centre, tangent to both runs); the clipped hedges along both edges, round the outside of each hairpin and a round
    // one in its eye; the beds in the wedges between the runs, hydrangeas banked with flowers
    const brick = '#e0907a', RW = 4.2, rt = 2.2, hedge = '#2a4a28', on = (v, dy = 0) => V(v.x, yAt(-v.z) + 0.12 + dy, v.z);
    const dirs = []; for (let i = 1; i < P.length; i++) dirs.push(P[i].clone().sub(P[i - 1]).setY(0).normalize());
    const turns = [];
    for (let i = 1; i < P.length - 1; i++) {
      const ia = dirs[i - 1], oc = dirs[i], half = Math.acos(Math.max(-1, Math.min(1, -ia.dot(oc)))) / 2, d = rt / Math.tan(half), bis = oc.clone().sub(ia).normalize();
      const C = P[i].clone().addScaledVector(bis, rt / Math.sin(half)), T1 = P[i].clone().addScaledVector(ia, -d), T2 = P[i].clone().addScaledVector(oc, d);
      const ang = (v) => Math.atan2(v.z - C.z, v.x - C.x), wrap = (x) => Math.atan2(Math.sin(x), Math.cos(x)), t1 = ang(T1), sweep = wrap(ang(P[i]) - t1) + wrap(ang(T2) - ang(P[i]));
      turns[i] = { d, C, bis, t1, sweep, half };
    }
    const arcPt = (T, r, t) => V(T.C.x + Math.cos(T.t1 + T.sweep * t) * r, 0, T.C.z + Math.sin(T.t1 + T.sweep * t) * r);
    for (let i = 1; i < P.length; i++) {   // the straight runs, the hedges along them
      const dv = dirs[i - 1], A = P[i - 1].clone().addScaledVector(dv, turns[i - 1] ? turns[i - 1].d : 0), B = P[i].clone().addScaledVector(dv, turns[i] ? -turns[i].d : 0), nrm = V(-dv.z, 0, dv.x);
      strip(b, K.brickMat, brick, on(A), on(B), RW, 0.2, (L) => K.tiledBox(RW, 0.2, L, 2));
      const hw2 = RW / 2 + 0.35, inner = (T, e) => T && e * nrm.dot(T.bis) > 0 ? Math.max(0, (hw2 - rt) / Math.tan(T.half)) : 0;   // on a hairpin's inside the hedge stops where it meets the next run's
      for (const e of [-1, 1]) strip(b, VC.solid, hedge, on(A.clone().addScaledVector(dv, inner(turns[i - 1], e)).addScaledVector(nrm, e * hw2), 0.3), on(B.clone().addScaledVector(dv, -inner(turns[i], e)).addScaledVector(nrm, e * hw2), 0.3), 0.55, 0.55);
    }
    turns.forEach((T) => {   // each hairpin: its paving swept round as a ring sector lying on the slope, the hedge round its outside
      if (!T) return;
      const lo = Math.min(T.t1, T.t1 + T.sweep), hi = Math.max(T.t1, T.t1 + T.sweep), rg = new THREE.RingGeometry(rt - RW / 2, rt + RW / 2, 14, 1, -hi, hi - lo), rp = rg.attributes.position, ru = rg.attributes.uv;
      for (let i = 0; i < ru.count; i++) ru.setXY(i, rp.getX(i) / 2, rp.getY(i) / 2);   // its bricks in metres
      rg.rotateX(-Math.PI / 2);
      b.addM(rg, K.brickMat, new THREE.Matrix4().makeShear(0, 0, 0, -gr, 0, 0).premultiply(new THREE.Matrix4().makeTranslation(T.C.x, yAt(-T.C.z) + 0.225, T.C.z)), brick);
      for (let j = 0; j < 7; j++) strip(b, VC.solid, hedge, on(arcPt(T, rt + RW / 2 + 0.35, j / 7), 0.3), on(arcPt(T, rt + RW / 2 + 0.35, (j + 1) / 7), 0.3), 0.55, 0.55);
      const side = V(-T.bis.z, 0, T.bis.x);   // the wedge beyond it, between the two runs: the beds
      for (let k = 0; k < 3; k++) { const q = T.C.clone().addScaledVector(T.bis, 4 + k * 3.2).addScaledVector(side, rand(-0.5, 0.5)); K.hydrangea(b, q.x, q.z, { y: yAt(-q.z), n: 2 }); }
      for (let k = 0; k < 9; k++) { const sd = rand(3, 13), q = T.C.clone().addScaledVector(T.bis, sd).addScaledVector(side, rand(-1, 1) * Math.max(0.2, (rt / Math.sin(Math.PI / 12) + sd) * 0.27 - 2.6)); b.sph(VC.solid, pick(['#e8508a', '#ff7aa8', '#c8304a', '#8aa8f0', '#c898e0', '#f0a0c8', '#ffffff']), q.x, yAt(-q.z) + 0.22, q.z, rand(0.22, 0.34), true); }
    });
    for (const sx of [13.0, 46.6]) for (let z = z0; z < z1; z += 0.5) b.box(VC.solid, '#bab2a6', sx, yAt(z) + 0.1, -z, 0.9, 0.2, 0.52);   // the stairs up each side of the block
    for (const [i, t] of [[2, 0.4], [5, 0.6]]) { const p = P[i].clone().lerp(P[i + 1], t), d = P[i + 1].clone().sub(P[i]); K.place(b, (tt) => K.car(tt, 0, 0, 1), new THREE.Matrix4().makeRotationY(Math.atan2(-d.x, -d.z) + Math.PI).setPosition(p.x, p.y - 0.02, p.z)); }
    for (let z = z0; z < z1 - 4; z += 7.7) K.house(b, 1, 50, -(z + 3.85), { w: 7.6, base: yAt(z), yd: 1.0, foot: 7, floors: 2, yard: false, lo: true });   // up the far side of it, facing the block
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
      for (let k = 0; k < 5; k++) crab(b, x + rand(-0.6, 0.6), 1.04, z + rand(-1.6, 1.6), rand(0, Math.PI * 2));   // the cooked crabs on the counter
      b.add(planeUV(K.kioskRects[pick([7, 8, 13])]), K.kioskMat, x - s * 1.12, 2.3, z, 2.6, 0.65, 1, 0, face(s), 0);
      K.person(b, x + s * 1.6, z + rand(-1, 1), { ry: s < 0 ? -Math.PI / 2 : Math.PI / 2, top: '#f4f0e8', hat: 'cap' });
    }
    const wx = 13.5, wz = -27;   // the wheel sign on its post
    b.cyl(VC.metal, '#2a3a5a', wx, 3.2, wz, 0.16, 6.4, 'cyl8');
    b.add(G.plane, std({ map: wheelTex(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.6, emissive: '#ffffff', emissiveMap: wheelTex(), emissiveIntensity: 0.3 }), wx, 8.0, wz, 4.6, 4.6, 1, 0, 0, 0);
    b.add(G.tor, VC.solid, wx, 8.0, wz, 4.9, 4.9, 4.9, 0, 0, 0, '#8a5a2a');
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; beam(b, VC.solid, wx + Math.cos(a) * 2.35, 8 + Math.sin(a) * 2.35, wz - 0.02, wx + Math.cos(a) * 3.2, 8 + Math.sin(a) * 3.2, wz - 0.02, 0.22, '#8a5a2a'); b.sph(VC.solid, '#7a4a22', wx + Math.cos(a) * 3.3, 8 + Math.sin(a) * 3.3, wz - 0.02, 0.17, true); }   // the wheel's handles
    for (let k = 0; k < 5; k++) { const x = rand(30, 58), z = -rand(6, 40); K.fishingBoat(b, x, z, rand(-0.3, 0.3)); }   // the fishing fleet in the lagoon
    b.block(VC.solid, '#7a6a58', 32, -1.2, -64, 20, 1.8, 32);   // Pier 39's deck; its gate; its two-storey timber houses, gabled, a balcony along each, string lights between
    for (const x of [23.4, 27.6]) { b.block(VC.solid, '#6a5440', x, 0.6, -47.2, 0.5, 5.2, 0.5); b.box(VC.solid, '#5a4430', x, 5.95, -47.2, 0.7, 0.3, 0.7); }
    b.box(VC.solid, '#5a4430', 25.5, 5.1, -47.2, 5.2, 1.1, 0.3);
    for (const e of [-1, 1]) b.add(G.plane, K.label('PIER 39', { w: 512, h: 112, color: '#f4e8c8', bg: '#2a4a6a', font: WEST, size: 0.62, k: 1.1 }), 25.5, 5.1, -47.2 + e * 0.16, 4.6, 0.9, 1, 0, e > 0 ? 0 : Math.PI, 0);
    for (let k = 0; k < 4; k++) {
      const hz = -50 - k * 8, col = pick(['#9a8468', '#a8927a', '#8a7a68']), top = 7.1;
      b.addM(K.tiledBox(9.4, 6.5, 7.2, 2), K.sidingMat, new THREE.Matrix4().makeTranslation(34, 0.6 + 3.25, hz), col);
      b.addM(K.prism(7.8, 2.8, 9.8), VC.solid, new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(29.1, top, hz), '#5a4a40');
      b.addM(K.gableFace(7.0, 2.5), K.shingleMat, new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(29.07, top + 0.02, hz), shade(col, 0.92));
      for (const y of [2.1, 5.0]) for (const dz of [-1.9, 1.9]) K.win(frame(b, 29.28, 0, hz + dz, 1, -Math.PI / 2), 0, y, 0, 1.3, y < 3 ? 2.0 : 1.5, '#f4ecdc', hdr(pick(WARM), 1.0), { ped: null });
      b.box(VC.solid, '#7a6248', 28.7, 3.5, hz, 1.2, 0.16, 7.2);   // the balcony, its rail and posts
      b.box(VC.solid, '#f2ece0', 28.12, 4.45, hz, 0.08, 0.08, 7.2); for (let dz = -3.4; dz <= 3.41; dz += 0.85) b.box(VC.solid, '#f2ece0', 28.12, 4.0, hz + dz, 0.06, 0.9, 0.06);
      b.add(G.plane, K.label(pick(['SOURDOUGH', 'CHOWDER', 'CANDY', 'GIFTS', 'CRAB HOUSE', 'KITES']), { w: 512, h: 112, color: '#f4ecd8', bg: pick(['#2a4a6a', '#7a2a2a', '#2a5a3a']), font: WEST, size: 0.56, k: 1.05 }), 29.0, 8.15, hz, 2.8, 0.62, 1, 0, -Math.PI / 2, 0);
      if (k) for (let j = 0; j < 7; j++) { const at = (jj) => [29.2, 6.9 - Math.sin((Math.PI * jj) / 6) * 0.5, hz + 8 - (jj * 8) / 6]; b.sph(VC.glow, hdr(pick(['#ffd23d', '#ff5a5a', '#5aff8a', '#5ac8ff']), 2.0), ...at(j), 0.06, true); if (j) beam(b, VC.solid, ...at(j - 1), ...at(j), 0.012, '#1a1a1a'); }   // the string of lights from house to house
    }
    for (const [x, z] of [[48, -58], [58, -66], [48, -74], [60, -50]]) {   // K-dock's floats and the sea lions on them, barking
      b.block(VC.solid, '#6a5a48', x, -1.25, z, 7, 0.4, 5);
      for (let k = randi(3, 5); k > 0; k--) K.seaLion(b, x + rand(-2.6, 2.6), -0.85, z + rand(-1.8, 1.8));
    }
    K.crowd(b, 8, 12, 2, 78, 16, { camera: true }); K.crowd(b, -8, -11.5, 2, 78, 12, { camera: true });
    // street performers: a silver robot on his box, the "bushman" crouched behind his branches
    b.block(VC.solid, '#3a3a3e', -10.6, 0, -30, 0.8, 0.5, 0.8); K.person(b, -10.6, -30, { y: 0.5, top: '#c8ccd4', legs: '#c8ccd4', skin: '#c8ccd4', hat: 'bald', ry: Math.PI / 2, bag: false, phone: false });
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
    const yw = -0.45, r = new Batcher(), rx = -40, rz = -66, pal = '#e8c4a2', pal2 = '#d8aa84';
    rotunda(frame(r, rx, yw, rz, 1, 0), { wall: wallLit }, K, { figF: frame(b, rx, yw, rz, 1, 0) });   // the rotunda (sf_icons.js), its figures left out of the reflection
    for (let k = 0; k <= 24; k++) {   // the colonnade curving round behind it: Corinthian columns in pairs, the entablature on its modillions; a planter box over every sixth pair, a weeping maiden leaning on each of its corners
      const a = Math.PI * (0.5 + (0.65 * k) / 24), R = 30, ca = Math.cos(a), sa = Math.sin(a), x = rx + ca * R, z = rz + sa * R, L = (Math.PI * R * 0.65) / 24;   // (kept within the chunk)
      for (const o of [-0.6, 0.6]) K.column(r, wallLit, x + ca * o, yw, z + sa * o, 12, 0.42, pal, { lo: true });
      r.add(G.box, wallLit, x, yw + 12.6, z, 2.8, 1.2, L + 0.2, 0, -a, 0, pal2);
      r.add(G.box, wallLit, x, yw + 13.45, z, 3.3, 0.5, L + 0.25, 0, -a, 0, pal);
      for (const e of [-1, 1]) r.add(G.box, wallLit, x + ca * e * 1.55, yw + 13.1, z + sa * e * 1.55, 0.3, 0.22, 0.32, 0, -a, 0, pal);
      if (k % 8 === 4) {
        r.add(G.box, wallLit, x, yw + 15.0, z, 2.8, 2.6, 2.8, 0, -a, 0, pal2);
        for (const [u, v] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) { const ox = (ca * u - sa * v) * 1.2, oz = (sa * u + ca * v) * 1.2; figure(frame(b, x + ox, yw + 13.7, z + oz, 1.05, Math.atan2(oz, -ox)), wallLit, pal, { skirt: true, cloak: true }); }
      }
    }
    for (let k = 0; k < 4; k++) {   // swans: the body, the neck, the head and its orange bill
      const x = rx + rand(-20, 8), z = rz + rand(-20, 28), a = rand(0, 6.28), fx = Math.sin(a), fz = Math.cos(a);
      r.add(G.sphLow, VC.solid, x, yw + 0.2, z, 0.6, 0.5, 1.0, 0, a, 0, '#f8f8f4');
      beam(r, VC.solid, x + fx * 0.32, yw + 0.3, z + fz * 0.32, x + fx * 0.42, yw + 0.92, z + fz * 0.42, 0.1, '#f8f8f4');
      r.add(G.sphLow, VC.solid, x + fx * 0.48, yw + 0.98, z + fz * 0.48, 0.16, 0.14, 0.24, 0, a, 0, '#f8f8f4'); r.add(G.box, VC.solid, x + fx * 0.62, yw + 0.96, z + fz * 0.62, 0.05, 0.05, 0.12, 0, a, 0, '#e8802a');
    }
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
    // the right: the Conservatory of Flowers, after the photographs, white-painted wood and glass lit from inside. The
    // central pavilion on its sixteen-sided base, a tall arched window in every side; the glass dome, its white ribs and
    // rings, the cupola and its finial; the long wings, their glass vaults ribbed in white; a pavilion at each end under
    // a little dome; the flower beds laid out in bands in front of it
    const cx = 36, cz = -50, glassC = hdr('#e8f4d8', 0.85), white = '#f6f6f2';
    b.add(P16, VC.solid, cx, 0.5, cz, 15.4, 1.0, 15.4, 0, 0, 0, white);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2 + Math.PI / 16, c = Math.cos(a), sn = Math.sin(a), R = 6.95, ry = Math.PI / 2 - a, a2 = (k / 16) * Math.PI * 2;
      b.add(G.box, VC.glow, cx + c * R, 3.5, cz + sn * R, 2.3, 4.6, 0.1, 0, ry, 0, glassC);
      b.add(HALFDISC, VC.glow, cx + c * R, 5.8, cz + sn * R, 2.3, 2.3, 0.1, 0, ry, 0, glassC);
      archivolt(b, VC.solid, white, cx + c * (R + 0.08), 5.8, cz + sn * (R + 0.08), 1.2, { n: 5, t: 0.14, d: 0.1, ry });
      b.box(VC.solid, white, cx + Math.cos(a2) * 7.02, 3.9, cz + Math.sin(a2) * 7.02, 0.3, 5.8, 0.3);
    }
    b.add(P16, VC.solid, cx, 6.95, cz, 15.6, 0.5, 15.6, 0, 0, 0, white);
    b.add(G.sph, VC.glow, cx, 7.0, cz, 13.4, 14.0, 13.4, 0, 0, 0, glassC);
    const onDome = (az, el) => [cx + 6.76 * Math.cos(el) * Math.cos(az), 7.0 + 7.06 * Math.sin(el), cz + 6.76 * Math.cos(el) * Math.sin(az)];
    for (let k = 0; k < 16; k++) { const az = (k / 16) * Math.PI * 2; for (let j = 0; j < 6; j++) beam(b, VC.solid, ...onDome(az, (j * Math.PI) / 13), ...onDome(az, ((j + 1) * Math.PI) / 13), 0.14, white); }
    for (const el of [0.4, 0.8, 1.15]) b.add(TUBE24, VC.solid, cx, 7.0 + 7.06 * Math.sin(el), cz, 13.56 * Math.cos(el), 0.14, 13.56 * Math.cos(el), 0, 0, 0, white);
    b.cyl(VC.glow, glassC, cx, 14.4, cz, 1.2, 1.4, 'cyl8'); b.cyl(VC.solid, white, cx, 15.2, cz, 1.45, 0.25, 'cyl8');
    b.add(G.sphLow, VC.solid, cx, 15.3, cz, 2.2, 1.4, 2.2, 0, 0, 0, white); b.add(G.cone8, VC.solid, cx, 16.6, cz, 0.3, 1.6, 0.3, 0, 0, 0, white);
    for (const e of [-1, 1]) {
      const wz = cz + e * 17, pz = cz + e * 29;
      b.block(VC.solid, white, cx, 0, wz, 9, 1.0, 20);
      b.box(VC.glow, glassC, cx, 3.4, wz, 8.6, 4.8, 20);
      for (let k = 0; k <= 16; k++) for (const f of [-1, 1]) b.box(VC.solid, white, cx + f * 4.33, 3.4, wz - 10 + k * 1.25, 0.08, 4.8, 0.12);   // the walls' glazing bars
      b.box(VC.solid, white, cx, 5.84, wz, 9.0, 0.16, 20.2);
      b.add(G.cyl, VC.glow, cx, 5.8, wz, 8.6, 20, 5, Math.PI / 2, 0, 0, glassC);   // the vault, its ribs, its ridge
      for (let k = 0; k <= 10; k++) for (let j = 0; j < 6; j++) { const m0 = (Math.PI * j) / 6, m1 = (Math.PI * (j + 1)) / 6, zz = wz - 10 + k * 2; beam(b, VC.solid, cx + Math.cos(m0) * 4.36, 5.8 + Math.sin(m0) * 2.56, zz, cx + Math.cos(m1) * 4.36, 5.8 + Math.sin(m1) * 2.56, zz, 0.14, white); }
      b.box(VC.solid, white, cx, 8.4, wz, 0.3, 0.2, 20);
      b.add(G.cyl8, VC.solid, cx, 0.5, pz, 9.6, 1.0, 9.6, 0, Math.PI / 8, 0, white);   // the end pavilion: its glass between white posts, its little ribbed dome, the finial
      b.add(G.cyl8, VC.glow, cx, 3.4, pz, 9.0, 4.8, 9.0, 0, Math.PI / 8, 0, glassC);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; b.box(VC.solid, white, cx + Math.cos(a) * 4.5, 3.4, pz + Math.sin(a) * 4.5, 0.22, 4.8, 0.22); }
      b.add(G.cyl8, VC.solid, cx, 5.95, pz, 9.4, 0.3, 9.4, 0, Math.PI / 8, 0, white);
      b.add(G.sph, VC.glow, cx, 6.0, pz, 8.4, 6.6, 8.4, 0, 0, 0, glassC);
      for (let k = 0; k < 8; k++) { const az = (k / 8) * Math.PI * 2 + Math.PI / 8; for (let j = 0; j < 4; j++) { const e0 = (j * Math.PI) / 9, e1 = ((j + 1) * Math.PI) / 9; beam(b, VC.solid, cx + 4.22 * Math.cos(e0) * Math.cos(az), 6.0 + 3.32 * Math.sin(e0), pz + 4.22 * Math.cos(e0) * Math.sin(az), cx + 4.22 * Math.cos(e1) * Math.cos(az), 6.0 + 3.32 * Math.sin(e1), pz + 4.22 * Math.cos(e1) * Math.sin(az), 0.12, white); } }
      b.cyl(VC.solid, white, cx, 9.3, pz, 0.5, 0.4, 'cyl8'); b.add(G.cone8, VC.solid, cx, 10.2, pz, 0.24, 1.4, 0.24, 0, 0, 0, white);
    }
    const FL = ['#e8202a', '#ffd23d', '#ff8a1a', '#ffffff', '#c84aa8', '#ff5a8a'];
    for (let j = 0; j < 4; j++) for (let z = 22; z < 78; z += 2.2) b.box(VC.solid, shade(FL[j], rand(0.85, 1.1)), 16 + j * 2.6 + Math.sin(z * 0.25 + j) * 0.8, 0.2, -z, 1.9, 0.32, 2.3);   // the beds in wavy bands
    for (let k = 0; k < 20; k++) b.sph(VC.solid, pick(FL), rand(26, 29), 0.45, -rand(22, 78), rand(0.3, 0.45), true);   // the dahlias along the path
    for (let k = 0; k < 8; k++) K.person(b, rand(16, 28), -rand(10, 76), { seated: chance(0.6), ry: -Math.PI / 2 + rand(-0.6, 0.6) });
    // the left: the Music Concourse's pollarded planes in their rows, the bandshell, the de Young's twisted copper tower
    for (let x = -16; x > -52; x -= 6.5) for (let z = 6; z < 76; z += 7) {
      b.cyl(VC.solid, '#8a8070', x, 1.7, -z, 0.3, 3.4, 'cyl8');
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; b.add(G.box, VC.solid, x + Math.cos(a) * 0.6, 3.6, -z + Math.sin(a) * 0.6, 0.5, 0.5, 0.5, 0, a, 0, '#7a7060'); b.add(G.sphLow, VC.solid, x + Math.cos(a) * 1.0, 4.4, -z + Math.sin(a) * 1.0, 1.4, 1.2, 1.4, 0, 0, 0, pick(['#4a7a3a', '#5a8a44', '#3e6e34'])); }   // the knuckles of the pollards, their new shoots
    }
    const bx = -66, bz = -58, sh = '#ece4d4';   // the Spreckels Temple of Music: its half dome, lit, inside a great arch; paired Corinthian columns either side on their pedestals; the attic and its figures
    b.add(G.sph, wallLit, bx - 4, 0, bz, 16, 26, 22, 0, 0, 0, sh);
    b.add(G.sph, VC.glow, bx - 3.4, 0.2, bz, 13, 22, 18, 0, 0, 0, hdr('#ffd9a0', 0.6));
    for (const e of [-1, 1]) {
      b.block(wallLit, sh, bx + 1, 0, bz + e * 10.2, 3.4, 14.4, 3.6);
      b.block(wallLit, shade(sh, 0.92), bx + 3.1, 0, bz + e * 10.2, 2.2, 1.0, 3.4);
      for (const o of [-0.85, 0.85]) K.column(b, wallLit, bx + 3.1, 1.0, bz + e * 10.2 + o, 13.4, 0.5, sh);
    }
    archivolt(b, wallLit, shade(sh, 1.04), bx + 2.9, 8.4, bz, 6.6, { n: 12, t: 0.9, d: 0.5, ry: Math.PI / 2 });
    b.box(wallLit, sh, bx + 1.2, 16.2, bz, 4.0, 3.6, 24);
    b.box(wallLit, shade(sh, 1.05), bx + 1.4, 18.2, bz, 4.4, 0.5, 24.6);
    for (const o of [-2.2, 0, 2.2]) figure(frame(b, bx + 2.4, 18.45, bz + o, 1.5, 0), wallLit, sh, { arms: o ? 'down' : 'out', skirt: true, cloak: true });
    b.add(TWIST, VC.solid, -96, 0, -26, 1, 1, 1, 0, 0.3, 0, '#8a5e3c');   // the de Young's copper tower turning as it rises, the glass of its observation floor
    b.add(G.box, VC.glow, -96, 43.4, -26, 11.15, 1.6, 7.85, 0, 0.3 + 0.48, 0, hdr('#ffd9a0', 0.8));
    b.add(G.box, VC.solid, -96, 45.15, -26, 11.6, 0.3, 8.2, 0, 0.8, 0, '#6a4a30');
    for (let y = 4; y < 42; y += 4) b.add(G.box, VC.solid, -96, y, -26, 11.06, 0.06, 7.76, 0, 0.3 + (y / 45) * 0.5, 0, '#a8784a');   // the bands of its perforated copper
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
      b.add(G.box, VC.solid, -6.4, 6.1, lz + e * 0.6, 0.6, 0.2, 0.26, 0, 0, -0.5, '#e8202a'); beam(b, VC.solid, -6.18, 5.92, lz + e * 0.6, -6.12, 5.62, lz + e * 0.6, 0.05, '#c81a20');   // the red shoe, its heel
      b.add(G.box, VC.solid, -10.9, 6.4, lz + e * 0.36, 0.3, 0.5, 0.48, 0, 0, -0.2, '#1a1418');   // the stocking's top
    }
    K.vwBus(b, 5.2, -64, 1);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, x = 9 + Math.cos(a) * 1.2, z = -22 + Math.sin(a) * 1.2; K.person(b, x, z, { seated: true, hippie: true, drum: true, ry: -a + Math.PI / 2 }); b.cyl(VC.solid, '#a8703a', x - Math.cos(a) * 0.4, 0.3, z - Math.sin(a) * 0.4, 0.18, 0.5, 'cyl8'); }
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
      K.person(b, x, z, { y, seated: chance(0.6), lying: chance(0.25), ry: -Math.PI / 2 + rand(-0.5, 0.5), camera: chance(0.2) });
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
    // the theatre, after the photographs: its Spanish baroque front, the scrolled gable rising over the middle bay; the
    // tall arched window there in its moulding, its glazing bars; the pilasters, the oculi in the side bays; the marquee
    // out over the pavement, chevrons along its top, the letters on its white boards, the bulbs; the red blade sign
    const st = '#ece2cc', st2 = '#dccfb4';
    b.block(wallLit, st, -24, 0, tz, 24, 15, 22);
    const fs = new THREE.Shape(), half = [[-11, 0], [-11, 15.2], [-7.2, 15.2], [-7.2, 16.3]];
    fs.moveTo(-11, 0); for (const [u, v] of half.slice(1)) fs.lineTo(u, v);
    fs.quadraticCurveTo(-7.2, 17.7, -5.5, 17.9); fs.lineTo(-4.2, 18.1); fs.quadraticCurveTo(-3.0, 18.3, -2.7, 19.7); fs.lineTo(-1.5, 20.7); fs.quadraticCurveTo(-0.8, 21.4, 0, 21.7);
    fs.quadraticCurveTo(0.8, 21.4, 1.5, 20.7); fs.lineTo(2.7, 19.7); fs.quadraticCurveTo(3.0, 18.3, 4.2, 18.1); fs.lineTo(5.5, 17.9); fs.quadraticCurveTo(7.2, 17.7, 7.2, 16.3);
    fs.lineTo(7.2, 15.2); fs.lineTo(11, 15.2); fs.lineTo(11, 0); fs.closePath();
    const fg = new THREE.ExtrudeGeometry(fs, { depth: 1.0, bevelEnabled: false, curveSegments: 6 }); fg.rotateY(Math.PI / 2);
    b.addM(fg, wallLit, new THREE.Matrix4().makeTranslation(-12.9, 0, tz), st);   // the front, its gable
    b.add(G.box, wallLit, -11.85, 15.25, tz, 0.4, 0.4, 22.4, 0, 0, 0, st2);   // the cornice, the gable's coping, the finial
    for (const e of [-1, 1]) { b.add(G.box, wallLit, -11.86, 16.0, tz + e * 7.2, 0.3, 1.6, 0.4, 0, 0, 0, st2); b.add(G.box, wallLit, -11.86, 17.9, tz + e * 4.8, 0.3, 0.3, 2.4, 0, 0, 0, st2); b.add(G.box, wallLit, -11.86, 20.25, tz + e * 1.0, 0.3, 0.3, 2.3, e * 0.6, 0, 0, st2); }
    b.add(G.cone8, wallLit, -12.3, 22.6, tz, 0.5, 1.6, 0.5, 0, 0, 0, st2); b.sph(wallLit, st2, -12.3, 21.8, tz, 0.4, true);
    for (const o of [-10.2, -3.6, 3.6, 10.2]) { b.box(wallLit, st2, -11.75, 7.6, tz + o, 0.3, 15.2, 0.9); b.box(wallLit, st2, -11.7, 14.6, tz + o, 0.4, 0.6, 1.2); }   // the pilasters
    b.box(VC.glow, hdr('#ffd9a0', 1.0), -11.88, 10.2, tz, 0.06, 6.4, 4.8);   // the great window, its round head, its bars, its moulding
    b.add(HALFDISC, VC.glow, -11.88, 13.4, tz, 4.8, 4.8, 0.06, 0, Math.PI / 2, 0, hdr('#ffd9a0', 1.0));
    for (const o of [-1.2, 0, 1.2]) b.box(wallLit, st2, -11.84, 11.6, tz + o, 0.06, 9.2, 0.1);
    for (const y of [8.6, 10.6, 12.6]) b.box(wallLit, st2, -11.84, y, tz, 0.06, 0.1, 4.8);
    archivolt(b, wallLit, st2, -11.8, 13.4, tz, 2.75, { n: 9, t: 0.5, d: 0.3, ry: Math.PI / 2 });
    for (const e of [-1, 1]) { b.box(wallLit, st2, -11.8, 10.2, tz + e * 2.75, 0.3, 6.4, 0.5); b.cyl(VC.glow, hdr('#ffd9a0', 0.8), -11.88, 11.8, tz + e * 6.9, 0.9, 0.06, 'cyl', 0, Math.PI / 2); b.add(G.tor, wallLit, -11.84, 11.8, tz + e * 6.9, 2.2, 2.2, 2.2, 0, Math.PI / 2, 0, st2); }   // the oculi
    b.box(VC.solid, '#3a2a24', -11.9, 2.1, tz, 0.1, 4.2, 12);   // the doors under the marquee
    b.block(VC.solid, '#2a2028', -10, 4.2, tz, 4.4, 2.3, 14.2);   // the marquee: its white letter boards, the chevrons over them, its bulbs
    const chev = basic({ map: chevronTex(), color: hdr('#ffffff', 1.1) }); chev.map.repeat.set(6, 1);
    for (const [x, z, ry, w] of [[-7.78, tz, Math.PI / 2, 14.2], [-10, tz - 7.12, Math.PI, 4.4], [-10, tz + 7.12, 0, 4.4]]) {
      b.add(G.plane, K.label(w > 5 ? 'CLASSIC FILMS · TONIGHT' : 'CASTRO', { w: 1024, h: 160, color: '#141414', bg: '#f6f4ee', font: SANS, weight: 700, size: 0.5, k: 1.15 }), x, 4.95, z, w - 0.5, 1.0, 1, 0, ry, 0);
      b.add(G.plane, chev, x, 6.05, z, w, 0.62, 1, 0, ry, 0);
    }
    for (let k = 0; k <= 28; k++) for (const y of [4.15, 6.45]) b.sph(VC.glow, hdr('#ffe8a0', 2.4), -7.74, y, tz - 7 + k * 0.5, 0.07, true);
    const blade = basic({ map: bladeTex(), color: hdr('#ffffff', 1.25) });
    for (const y of [7.2, 22.6]) beam(b, VC.metal, -11.9, y, tz, -10.6, y, tz, 0.12, '#2a2a2e');   // the blade on its brackets: the red sign, its gilt crest, its point
    b.add(G.box, VC.solid, -10.4, 15.2, tz, 2.6, 17.6, 0.5, 0, 0, 0, '#c41e26');
    for (const e of [-1, 1]) b.add(G.plane, blade, -10.4, 15.2, tz + e * 0.26, 2.6, 17.6, 1, 0, e > 0 ? 0 : Math.PI, 0);
    b.add(HALFDISC, VC.solid, -10.4, 24.0, tz, 2.0, 2.0, 0.6, 0, 0, 0, '#e8b84a'); b.add(HALFDISC, VC.solid, -10.4, 24.05, tz, 1.4, 1.4, 0.64, 0, 0, 0, '#2a4aa0');
    b.add(G.cone4, VC.solid, -10.4, 5.85, tz, 1.84, 1.1, 0.5, Math.PI, Math.PI / 4, 0, '#c41e26');
    // the right: Harvey Milk Plaza and the great rainbow flag over it, the way down to Muni; rainbow flags on the lamps,
    // the rainbow crossing at the corner, the bars' neon
    farGround(b, 1, '#8a8478');
    K.kerbLane(b, 1, { x1: 13 });
    pave(b, EDGE + 7, 30, 18, 62);
    b.cyl(VC.metal, '#d8dce0', 22, 13, -40, 0.18, 26, 'cyl8');
    b.addM(FLAG, flagMat, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(22, 22.9, -44.6), 0xffffff);   // the great rainbow flag, its folds in the wind
    K.muniEntrance(b, 15.5, -50, 1);
    for (const [z0, z1] of [[0, 16], [64, CHUNK_LEN]]) K.houseRow(b, 1, z0, z1, { x0: 12, shopP: 0.9, signs: VIC_SIGNS, floors: [2, 3] });
    for (const [z, txt, c] of [[8, 'BAR', '#ff3a8a'], [70, 'COCKTAILS', '#3ad8ff']]) { b.box(VC.solid, '#1a1a1e', 12.1, 6.6, -z, 0.3, 0.96, 3.7); b.add(G.plane, K.label(txt, { w: 512, h: 128, color: c, glow: c, font: NEON, size: 0.6, k: 1.6 }), 11.93, 6.6, -z, 3.6, 0.9, 1, 0, face(1), 0); }   // the bars' neon on its dark backing, fixed to the front
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
    // the old mission, after the photographs: its white adobe front, the four columns, the balcony and its dark railing,
    // the three bells in their openings over it, the door; the red tile roof running far out over the front, its rows of
    // tiles; the buttresses down its side
    const cz = -24, adobe = '#f6f2ea', tile = '#a8583a';
    b.block(wallLit, adobe, -24, 0, cz, 20, 8.6, 11);
    const gs = new THREE.Shape(); gs.moveTo(-5.5, 0); gs.lineTo(5.5, 0); gs.lineTo(0, 2.3); gs.closePath();
    b.addM(new THREE.ShapeGeometry(gs).rotateY(Math.PI / 2), wallLit, new THREE.Matrix4().makeTranslation(-13.98, 8.6, cz), adobe);   // the gable wall
    const pitch = Math.atan2(2.6, 6.2), sl = Math.hypot(6.2, 2.6);
    for (const e of [-1, 1]) {   // the roof's two slopes, out over the front, the rows of tiles on them
      b.add(G.box, VC.solid, -23.4, 8.6 + 1.3 + 0.12, cz + e * 3.1, 22.2, 0.24, sl, e * pitch, 0, 0, tile);
      for (let x = -34.3; x < -12.6; x += 0.42) beam(b, VC.solid, x, 11.32, cz + e * 0.05, x, 8.74, cz + e * 6.25, 0.13, shade(tile, 0.85));
    }
    b.box(VC.solid, shade(tile, 0.8), -23.4, 11.25, cz, 22.2, 0.3, 0.5);   // the ridge
    for (const o of [-4.0, -2.4, 2.4, 4.0]) K.column(b, wallLit, -13.72, 0, cz + o, 8.4, 0.36, '#ece6dc', { cap: 'plain' });
    b.box(VC.solid, '#5a3a24', -13.95, 1.5, cz, 0.08, 3.0, 2.0); b.add(HALFDISC, VC.solid, -13.95, 3.0, cz, 2.0, 2.0, 0.08, 0, Math.PI / 2, 0, '#5a3a24');   // the door, its round head, its frame
    archivolt(b, wallLit, '#e6dfd2', -13.9, 3.0, cz, 1.15, { n: 6, t: 0.22, d: 0.14, ry: Math.PI / 2 });
    b.box(VC.solid, '#ece6dc', -13.4, 5.7, cz, 1.2, 0.22, 10.4);   // the balcony, its railing
    b.box(VC.solid, '#2a2018', -12.85, 6.6, cz, 0.06, 0.06, 10.4); for (let o = -5; o <= 5.01; o += 0.5) b.box(VC.solid, '#2a2018', -12.85, 6.2, cz + o, 0.05, 0.8, 0.05);
    for (const o of [-2.6, 0, 2.6]) { b.box(VC.solid, '#3a2a24', -13.93, 7.4, cz + o, 0.06, 1.3, 1.0); b.add(HALFDISC, VC.solid, -13.93, 8.05, cz + o, 1.0, 1.0, 0.06, 0, Math.PI / 2, 0, '#3a2a24'); b.sph(VC.metal, '#c8a050', -13.95, 7.3, cz + o, 0.38); }
    for (const x of [-18, -24, -30]) for (const [y, w, d] of [[0, 1.4, 1.6], [2.6, 1.1, 1.2], [4.8, 0.8, 0.8]]) b.block(wallLit, shade(adobe, 0.97), x, y, cz + 5.5 + d / 2, w, 6.4 - y, d);   // the buttresses
    // the basilica: its Churrigueresque front, the central bay rising to a niche and its saint; the portal in its layered
    // frame of pilasters, the great arched window over it; two towers, the one at the far end the taller, their belfries
    // arched, balconied, pinnacled, under turquoise tiled domes with lanterns and crosses; the steps across the front
    const bz = -50, pk = '#f4e8e0', pk2 = '#ead6cc', turq = '#3aa89a';
    b.block(wallLit, pk, -28, 0, bz, 26, 14, 22);
    for (let k = 0; k < 4; k++) b.block(VC.solid, shade('#d8d0c4', 0.94 + k * 0.02), -14.4 + k * 0.42, 0, bz, 1.6 - k * 0.42 + 0.4, 0.2 * (k + 1), 22);   // the steps
    const cs = new THREE.Shape(); cs.moveTo(-5.4, 0); cs.lineTo(5.4, 0); cs.lineTo(5.4, 1.2); cs.quadraticCurveTo(5.0, 2.6, 3.4, 2.8); cs.lineTo(2.6, 3.6); cs.quadraticCurveTo(1.6, 3.8, 1.4, 5.2); cs.lineTo(-1.4, 5.2); cs.quadraticCurveTo(-1.6, 3.8, -2.6, 3.6); cs.lineTo(-3.4, 2.8); cs.quadraticCurveTo(-5.0, 2.6, -5.4, 1.2); cs.closePath();
    const cg = new THREE.ExtrudeGeometry(cs, { depth: 1.0, bevelEnabled: false, curveSegments: 5 }); cg.rotateY(Math.PI / 2);
    b.addM(cg, wallLit, new THREE.Matrix4().makeTranslation(-15.9, 14, bz), pk);   // the central bay's crest over the nave
    b.box(wallLit, pk2, -14.8, 19.3, bz, 0.4, 2.0, 1.8); b.box(VC.solid, '#3a2a2a', -14.62, 19.2, bz, 0.06, 1.7, 1.2);   // the niche at its top, its saint
    figure(frame(b, -14.6, 18.4, bz, 0.8, 0), wallLit, '#f0e4dc', { skirt: true, cloak: true });
    for (const e of [-1, 1]) { b.cyl(wallLit, pk2, -14.6, 15.3, bz + e * 5.0, 0.22, 2.4, 'cyl8'); b.add(G.cone8, wallLit, -14.6, 17.1, bz + e * 5.0, 0.5, 1.2, 0.5, 0, 0, 0, pk2); }   // its pinnacles
    for (const o of [-3.2, -2.3, 2.3, 3.2]) { b.box(wallLit, pk2, -14.7, 7.0, bz + o, 0.5, 14, 0.6); for (const y of [2.8, 6.2, 10.4]) b.box(wallLit, '#e0c8bc', -14.4, y, bz + o, 0.3, 0.9, 0.5); }   // the portal's pilasters, their carved drums
    b.box(wallLit, pk2, -14.6, 8.6, bz, 0.5, 0.8, 7.4);   // the entablature over the door, the door, its round head
    b.box(VC.solid, '#3a2418', -14.94, 2.8, bz, 0.08, 5.6, 3.0); b.add(HALFDISC, VC.solid, -14.94, 5.6, bz, 3.0, 3.0, 0.08, 0, Math.PI / 2, 0, '#3a2418');
    archivolt(b, wallLit, pk2, -14.8, 5.6, bz, 1.75, { n: 7, t: 0.35, d: 0.25, ry: Math.PI / 2 });
    b.box(VC.glow, hdr('#ffc880', 0.9), -14.94, 11.0, bz, 0.06, 3.6, 2.6); b.add(HALFDISC, VC.glow, -14.94, 12.8, bz, 2.6, 2.6, 0.06, 0, Math.PI / 2, 0, hdr('#ffc880', 0.9));   // the great window, its bars, its frame
    for (const o of [-0.65, 0.65]) b.box(VC.solid, '#3a2a24', -14.9, 11.4, bz + o, 0.04, 4.6, 0.08);
    archivolt(b, wallLit, pk2, -14.8, 12.8, bz, 1.55, { n: 7, t: 0.3, d: 0.25, ry: Math.PI / 2 });
    for (const [e, tall] of [[1, false], [-1, true]]) {   // the towers: the near one, and the taller one at the far end
      const tzz = bz + e * 9, x = -16.5, T0 = 18, stages = tall ? 2 : 1;
      b.block(wallLit, pk, x, 0, tzz, 5, T0, 5);
      for (const y of [6, 10.5]) b.box(VC.glow, hdr('#ffd9a0', 0.8), -13.97, y, tzz, 0.06, 1.6, 0.8);
      let y = T0;
      for (let k = 0; k < stages; k++) {   // a belfry stage: its arched opening on each face, the balcony under it, the pilasters at its corners, pinnacles round its top
        const w = 4.6 - k * 0.7, h = 5.6 - k * 0.6;
        b.box(wallLit, pk2, x, y + 0.2, tzz, w + 0.8, 0.4, w + 0.8);
        b.block(wallLit, pk, x, y + 0.4, tzz, w, h, w);
        for (let f = 0; f < 4; f++) {
          const a = (f * Math.PI) / 2, c = Math.cos(a), sn = Math.sin(a);
          b.add(G.box, VC.solid, x + c * (w / 2 + 0.02), y + 0.4 + h * 0.42, tzz + sn * (w / 2 + 0.02), 0.04, h * 0.5, w * 0.42, 0, -a, 0, '#4a2e28');
          b.add(HALFDISC, VC.solid, x + c * (w / 2 + 0.02), y + 0.4 + h * 0.67, tzz + sn * (w / 2 + 0.02), w * 0.42, w * 0.42, 0.04, 0, Math.PI / 2 - a, 0, '#4a2e28');
          b.add(G.box, wallLit, x + c * (w / 2 + 0.3), y + 0.5 + h * 0.17, tzz + sn * (w / 2 + 0.3), 0.6, 0.14, w * 0.55, 0, -a, 0, pk2);
        }
        for (const ex of [-1, 1]) for (const ez of [-1, 1]) { b.block(wallLit, pk2, x + ex * (w / 2 - 0.2), y + 0.4, tzz + ez * (w / 2 - 0.2), 0.5, h, 0.5); b.add(G.cone8, wallLit, x + ex * (w / 2 - 0.2), y + h + 1.0, tzz + ez * (w / 2 - 0.2), 0.42, 1.0, 0.42, 0, 0, 0, pk2); }
        y += h + 0.4;
      }
      const r = tall ? 1.7 : 2.0;
      b.cyl(wallLit, pk2, x, y + 0.4, tzz, r + 0.3, 0.8, 'cyl');
      b.add(G.sph, VC.solid, x, y + 0.8, tzz, 2 * r, 2.6 * r, 2 * r, 0, 0, 0, turq);   // the dome, its lantern, its cross
      b.cyl(wallLit, pk2, x, y + 0.8 + 1.3 * r + 0.3, tzz, 0.35, 0.8, 'cyl8');
      b.add(G.sphLow, VC.solid, x, y + 0.8 + 1.3 * r + 0.85, tzz, 0.6, 0.6, 0.6, 0, 0, 0, turq);
      b.box(VC.metal, '#c8a050', x, y + 0.8 + 1.3 * r + 1.6, tzz, 0.08, 1.0, 0.08); b.box(VC.metal, '#c8a050', x, y + 0.8 + 1.3 * r + 1.75, tzz, 0.08, 0.08, 0.5);
    }
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
      K.person(b, x, z, { y, seated: chance(0.55), lying: chance(0.3), ry: -Math.PI / 2 + rand(-0.8, 0.8) });
      if (chance(0.4)) b.addM(G.plane, VC.solid, new THREE.Matrix4().makeRotationZ(ang).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)).scale(V(1.6, 1.3, 1)).setPosition(x + 0.2, yAt(x + 0.2) + 0.05, z), pick(['#c8302a', '#2a6ab0', '#f2c230', '#f4f0e8', '#3a8a5a']));
    }
    for (let k = 0; k < 8; k++) { const x = rand(20, 100), z = -rand(4, 76); if (Math.abs(x - 70) > 5) K.palm(b, x, z, rand(1.4, 1.8), { y: yAt(x) - 0.2 }); }
    b.block(VC.solid, '#7a7a5a', 70, -1, -40, 9, yAt(70) + 1, 84);   // the J-Church's terrace, its rails, the car on it
    for (const e of [-0.72, 0.72]) b.box(VC.metal, '#c8ccd4', 70 + e, yAt(70) + 0.06, -40, 0.08, 0.06, 84);
    const jy = yAt(70) + 0.1, jz = -36, fz = jz - 7.2;
    b.block(VC.solid, '#2a2a2e', 70, jy, jz, 2.2, 0.5, 13);   // the light rail car: its trucks, the silver body and its red band, its windows between their pillars, the doors, the windscreen and lamps, the pantograph up to the wire
    b.block(VC.solid, '#d8dcdf', 70, jy + 0.45, jz, 2.65, 3.0, 14.4);
    b.box(VC.solid, '#c8302a', 70, jy + 1.05, jz, 2.67, 0.46, 14.4);
    for (const e of [-1, 1]) {
      b.box(VC.glow, hdr('#ffe8c0', 1.0), 70 + e * 1.335, jy + 2.3, jz, 0.03, 1.0, 13);
      for (let k = 0; k <= 10; k++) b.box(VC.solid, '#b8bcc0', 70 + e * 1.35, jy + 2.3, jz - 6.5 + k * 1.3, 0.02, 1.04, 0.12);
      for (const dz of [-3.5, 3.5]) b.box(VC.solid, '#5a5e64', 70 + e * 1.345, jy + 1.9, jz + dz, 0.02, 2.4, 1.3);
    }
    b.box(VC.glow, hdr('#2a3446', 1), 70, jy + 2.4, fz - 0.01, 2.3, 1.3, 0.03); b.box(VC.glow, hdr('#ffb02a', 1.6), 70, jy + 3.2, fz - 0.02, 1.4, 0.24, 0.03);
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#fff4d0', 1.8), 70 + e * 0.9, jy + 1.0, fz - 0.02, 0.3, 0.16, 0.03);
    b.box(VC.metal, '#5a5e64', 70, jy + 3.55, jz, 1.2, 0.2, 2.0);
    for (const e of [-1, 1]) { beam(b, VC.metal, 70, jy + 3.65, jz + e * 0.8, 70, jy + 4.6, jz - e * 0.2, 0.05, '#2a2a2e'); beam(b, VC.metal, 70, jy + 4.6, jz - e * 0.2, 70, jy + 5.3, jz + e * 0.3, 0.05, '#2a2a2e'); }
    b.box(VC.metal, '#2a2a2e', 70, jy + 5.32, jz, 1.4, 0.05, 0.1);
    b.box(VC.metal, '#1a1a1e', 70, jy + 5.35, -40, 0.04, 0.04, 84);   // the overhead wire, its poles
    for (const zz of [-12, -66]) { b.cyl(VC.metal, '#4a4e46', 74, jy + 2.9, zz, 0.1, 5.8, 'cyl8'); beam(b, VC.metal, 74, jy + 5.6, zz, 69.8, jy + 5.4, zz, 0.05, '#4a4e46'); }
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
