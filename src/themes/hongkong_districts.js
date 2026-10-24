// More of Hong Kong on a winter night: the Central–Mid-Levels Escalator, its covered walkway crossing over the street and climbing
// the hill beside a stepped lane, the Mid-Levels' blocks stacked up the slope behind; Happy Valley on a race night, the horses
// coming round the turn under the floodlights below the packed stands and the valley's towers; Causeway Bay's crossroads by SOGO,
// crowds banked up at every kerb, the giant screens, the trams and the buses; and Quarry Bay's "Monster Building", its courtyard
// walled in by a thousand windows.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, planeUV, buildingGeo, rand, randi, pick, chance } from '../core.js';
import { at, EDGE, farGround, textTex, screenTint } from './common.js';
import { beam } from './tokyo_kit.js';
import { HEI, SUNG, GF, KERB, STREET, NEON_SHOPS, COATS } from './hongkong_kit.js';

const ICO = new THREE.IcosahedronGeometry(0.5, 0), OCT = new THREE.OctahedronGeometry(0.5);
const PASTEL = ['#f4c8d4', '#c8dcf0', '#f4e4a8', '#d4ecd0', '#f0e8e0', '#e8d0f0'];
const SILKS = ['#e8202a', '#1f5aa8', '#f2c230', '#2aa860', '#f4f4f0', '#e86a1a', '#7a3aa8', '#2a2a2e', '#3dc8e8', '#ff6ab0'];

// A box (base at y) whose sides tile a facade texture in world units from a fixed origin, so neighbouring boxes' windows line up
function alignedBox(w, h, d, x, y, z, tex, cw, ch, y0 = 0) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  g.translate(x, y + h / 2, z);
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, TW = tex.cols * cw, TH = tex.rows * ch;
  for (let i = 0; i < p.count; i++) {
    if (Math.abs(n.getY(i)) > 0.5) { uv.setXY(i, 0.002, 0.002); continue; }
    const u = Math.abs(n.getZ(i)) > 0.5 ? p.getX(i) : p.getZ(i);
    uv.setXY(i, u / TW, (p.getY(i) - y0) / TH);
  }
  return g;
}

export function hkDistricts(K) {
  const label = (text, opts) => basic({ map: textTex(text, opts), transparent: true, color: hdr('#ffffff', opts.k || 1.2), side: THREE.DoubleSide, depthWrite: false });
  const movers = [];

  // ---------- Happy Valley racecourse ----------
  const turfTex = canvasTex(256, 32, (g, w, h) => {   // floodlit turf, mown in bands
    for (let x = 0; x < w; x += 32) { g.fillStyle = (x / 32) % 2 ? '#3a8a3a' : '#4a9a44'; g.fillRect(x, 0, 32, h); }
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(20,60,20,${rand(0.1, 0.3).toFixed(2)})`; g.fillRect(rand(0, w), rand(0, h), 2, 2); }
  });
  const turf = std({ map: turfTex, color: '#b8c8b0', roughness: 0.9, emissive: '#ffffff', emissiveMap: turfTex, emissiveIntensity: 0.16 });
  const infieldTex = canvasTex(256, 256, (g, w, h) => {   // the infield's pitches, their white lines
    g.fillStyle = '#3a7a38'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 24) { g.fillStyle = (y / 24) % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'; g.fillRect(0, y, w, 24); }
    g.strokeStyle = 'rgba(245,245,240,0.85)'; g.lineWidth = 2;
    g.strokeRect(58, 40, 140, 176); g.beginPath(); g.moveTo(58, 128); g.lineTo(198, 128); g.stroke();
    g.beginPath(); g.arc(128, 128, 18, 0, 7); g.stroke(); g.strokeRect(98, 40, 60, 24); g.strokeRect(98, 192, 60, 24);
  }, { repeat: false });
  const infield = std({ map: infieldTex, color: '#b8c8b0', roughness: 0.9, emissive: '#ffffff', emissiveMap: infieldTex, emissiveIntensity: 0.14 });
  const standTex = canvasTex(256, 64, (g, w, h) => {   // a tier of the stands, packed: heads and shoulders in rows under the lights
    g.fillStyle = '#2a2830'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 2; row++) for (let x = rand(0, 4); x < w; x += rand(5.5, 8)) {
      const y = 22 + row * 30 - (row ? 0 : 4);
      g.fillStyle = pick(COATS); g.fillRect(x - 3, y, 7, 14);
      g.fillStyle = pick(['#f0d0b0', '#e8c4a0', '#c8946a', '#1a1410', '#141414']); g.beginPath(); g.arc(x + 0.5, y - 4, 3.2, 0, 7); g.fill();
      if (Math.random() < 0.12) { g.fillStyle = '#ece6d6'; g.fillRect(x - 4, y + 2, 8, 6); }   // a racing paper
    }
  });
  standTex.repeat.set(1, 1);
  const stands = std({ map: standTex, roughness: 0.9, emissive: '#ffffff', emissiveMap: standTex, emissiveIntensity: 0.4 });
  const raceTex = canvasTex(512, 192, (g, w, h) => {   // the big screen in the infield: the race, the runners and their odds
    g.fillStyle = '#081438'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd23d'; g.fillRect(0, 0, w, 34);
    g.fillStyle = '#081438'; g.font = `900 24px ${HEI}`; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillText('跑馬地  第七場  RACE 7', 12, 18); g.textAlign = 'right'; g.fillText('1650米', w - 12, 18);
    const gr = g.createLinearGradient(0, 40, 0, 120); gr.addColorStop(0, '#3a9a4a'); gr.addColorStop(1, '#1a5a2a');
    g.fillStyle = gr; g.fillRect(10, 42, 300, 140);
    g.strokeStyle = '#f4f4f0'; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 150); g.lineTo(310, 150); g.stroke();
    for (let k = 0; k < 8; k++) { g.fillStyle = SILKS[k]; g.beginPath(); g.ellipse(60 + k * 30 + rand(-8, 8), 128 + rand(-10, 10), 9, 6, 0, 0, 7); g.fill(); }
    g.font = `700 18px ${HEI}`; g.textAlign = 'left';
    for (let k = 0; k < 7; k++) {
      const y = 52 + k * 19;
      g.fillStyle = SILKS[k]; g.fillRect(322, y - 7, 14, 14);
      g.fillStyle = '#ffffff'; g.fillText(String(k + 1), 344, y); g.fillStyle = '#ffe08a'; g.textAlign = 'right'; g.fillText(rand(2.1, 39).toFixed(1), w - 14, y); g.textAlign = 'left';
    }
    g.fillStyle = '#ffffff'; g.font = `700 14px ${HEI}`; g.fillText('獨贏 WIN', 370, 52);
  }, { repeat: false });
  const raceMat = basic({ map: raceTex, color: hdr('#ffffff', 1.15) });
  const RING_T = new THREE.RingGeometry(25, 33, 72, 1);
  const RAIL_RING = new THREE.CylinderGeometry(1, 1, 1, 72, 1, true);
  // a galloping horse, nose toward -z, its coat white so each takes its colour from its instance; and its jockey, crouched, in white
  // so his silks take theirs
  const horseGeo = (() => {
    const b = new Batcher(), c = '#ffffff', leg = '#b8b0a8';
    b.add(G.sph, VC.solid, 0, 1.38, 0, 0.72, 0.86, 2.1, 0, 0, 0, c);
    beam(b, VC.solid, 0, 1.55, -0.8, 0, 2.15, -1.3, 0.34, c);
    b.add(G.box, VC.solid, 0, 2.08, -1.55, 0.26, 0.28, 0.66, 0.5, 0, 0, c);
    beam(b, VC.solid, 0, 2.2, -1.0, 0, 1.75, -0.6, 0.12, '#2a2420');   // the mane
    for (const [x, z0, z1] of [[-0.2, -0.65, -1.3], [0.2, -0.6, -0.9], [-0.2, 0.62, 1.15], [0.2, 0.6, 0.85]]) beam(b, VC.solid, x, 1.15, z0, x, 0.08, z1, 0.13, leg);
    beam(b, VC.solid, 0, 1.6, 1.0, 0, 1.0, 1.55, 0.1, '#2a2420');   // the tail streaming
    b.box(VC.solid, '#f4f4f0', 0, 1.72, 0.05, 0.76, 0.3, 0.7);   // the saddle cloth
    return b.build().children[0].geometry;
  })();
  const jockeyGeo = (() => {
    const b = new Batcher(), c = '#ffffff';
    b.add(G.box, VC.solid, 0, 2.35, -0.15, 0.4, 0.52, 0.34, -1.0, 0, 0, c);
    b.add(ICO, VC.solid, 0, 2.62, -0.48, 0.28, 0.28, 0.3, 0, 0, 0, c);
    for (const e of [-1, 1]) beam(b, VC.solid, e * 0.18, 2.3, -0.3, e * 0.14, 2.05, -0.75, 0.08, c);
    for (const e of [-1, 1]) beam(b, VC.solid, e * 0.22, 2.12, 0.05, e * 0.3, 1.75, -0.2, 0.11, '#e8e4dc');
    return b.build().children[0].geometry;
  })();
  const CX = 48, CZ = -40;
  const happyValley = () => {
    const b = new Batcher();
    K.tramWires(b);
    // left: Wong Nai Chung Road's kerb, the race crowd, the stands rising away over the concourse
    farGround(b, -1, '#18171e');
    K.kerbLane(b, -1); K.jam(b, -1, 0, 80, { fill: 0.5, mix: { taxi: 8, minibus: 3, car: 2 } });
    K.rails(b, -1, [[30, 36]], -(KERB + 0.3));
    for (let z = 8; z < 78; z += 24) K.lamp(b, -(KERB + 0.35), -z, -1);
    K.throng(b, -(KERB + 0.45), -10.8, 1, 79, 46);
    for (let k = 0; k < 14; k++) K.person(b, -rand(KERB + 0.6, 10.8), -rand(2, 78), { paper: true });
    const Z0 = -4, Z1 = -76, LZ = Z0 - Z1, ZC = (Z0 + Z1) / 2;
    b.block(VC.solid, '#3a3640', -14.2, 0, ZC, 5.2, 4.6, LZ);   // the concourse under the stands: betting windows lit along it
    b.box(VC.glow, hdr('#ffe8c0', 0.85), -11.58, 1.6, ZC, 0.04, 1.8, LZ - 6);
    for (let z = Z0 - 3; z > Z1 + 2; z -= 3) b.box(VC.solid, '#2a2830', -11.55, 1.6, z, 0.06, 1.9, 0.2);
    const bet = label('投注站  BETTING', { w: 512, h: 96, color: '#1a3a7a', bg: '#ffd23d', font: HEI, size: 0.6, k: 0.9 });
    for (let z = Z0 - 6; z > Z1 + 4; z -= 12) b.add(G.plane, bet, -11.5, 3.3, z, 3.2, 0.6, 1, 0, Math.PI / 2, 0);
    for (let k = 0; k < 11; k++) {   // the tiers
      const x1 = -16.8 - k * 2.3, y = 4.6 + k * 1.45;
      b.block(VC.solid, '#5a5660', x1 - 1.15, 0, ZC, 2.3, y, LZ);
      b.add(K.tiled2(Math.round((LZ - 0.6) / 9.6), 1), stands, x1 + 0.02, y + 0.55, ZC, LZ - 0.6, 1.1, 1, 0, Math.PI / 2, 0);
      b.box(VC.metal, '#9aa0a8', x1 + 0.1, y + 1.1, ZC, 0.05, 0.05, LZ);
    }
    const RY = 4.6 + 11 * 1.45 + 4.5;   // the roof cantilevered over them, its fascia lit, floodlights along its edge
    b.box(VC.solid, '#d8d8d0', -27, RY, ZC, 34, 0.9, LZ + 2);
    b.box(VC.solid, '#2a3a6a', -10.1, RY - 0.6, ZC, 0.3, 2.0, LZ + 2);
    b.add(G.plane, label('跑馬地馬場  HAPPY VALLEY RACECOURSE', { w: 1024, h: 96, color: '#ffffff', font: HEI, size: 0.56, k: 1.1 }), -9.93, RY - 0.6, ZC, 34, 1.6, 1, 0, Math.PI / 2, 0);
    for (let z = Z0 - 4; z > Z1 + 2; z -= 6) b.box(VC.glow, hdr('#f4f8ff', 2.4), -11, RY - 1.75, z, 0.5, 0.25, 1.6);
    for (let z = Z0 - 1; z > Z1; z -= 12) b.box(VC.solid, '#c8c8c0', -42, RY / 2, z, 0.8, RY, 0.8);
    b.add(G.plane, label('跑馬地', { w: 512, h: 160, color: '#ffe08a', font: SUNG, size: 0.7, bg: '#14285a', border: '#d8a830', k: 1.2 }), -24, 12, Z0 + 0.06, 9, 2.8, 1);   // on its end wall
    for (let z = -2; z > -70;) {   // the valley's towers behind, their windows lit
      const L = rand(10, 16);
      b.addM(buildingGeo(rand(14, 20), rand(70, 120), L, K.dense, 2.0, 2.8), K.denseMat, at(-rand(50, 60), 0, z - L / 2), pick(PASTEL));
      z -= L + rand(1, 4);
    }
    // right: the pavement, the hedge and the course's white rail, the turf ring round the infield
    farGround(b, 1, '#14201a');
    K.kerbLane(b, 1); K.jam(b, 1, 0, 80, { fill: 0.25, mix: { taxi: 6, car: 3 } });
    K.throng(b, KERB + 0.45, 11, 1, 79, 26);
    for (let z = 8; z < 78; z += 24) K.lamp(b, KERB + 0.35, -z, 1);
    b.box(VC.solid, '#1c3a22', 12.6, 0.6, -40, 0.9, 1.2, 80);
    for (let z = 1; z < 80; z += 2) b.box(VC.metal, '#e8e8e4', 12.0, 0.6, -z, 0.08, 1.2, 0.08);
    b.box(VC.metal, '#f4f4f0', 12.0, 1.2, -40, 0.1, 0.1, 80);
    b.box(VC.solid, '#24342a', 46, -0.05, -40, 68, 0.1, 80);
    b.addM(RING_T, turf, new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(CX, 0.04, CZ), 0xffffff);
    b.addM(new THREE.CircleGeometry(24.6, 48), infield, new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(CX, 0.04, CZ), 0xffffff);
    for (const [r, k] of [[33.3, 1], [24.7, 0.8]]) {
      b.addM(RAIL_RING, VC.solid, new THREE.Matrix4().makeScale(r, 0.12, r).setPosition(CX, 1.1, CZ), hdr('#f4f4f0', k));
      for (let a = 0; a < Math.PI * 2; a += 0.11) b.box(VC.solid, '#e8e8e4', CX + Math.cos(a) * r, 0.55, CZ + Math.sin(a) * r, 0.08, 1.1, 0.08);
    }
    for (const a of [0.2, 1.2, 2.3, 3.6, 4.6, 5.5]) {   // the floodlight masts round the course, the light they throw on it
      const x = CX + Math.cos(a) * 37.5, z = CZ + Math.sin(a) * 37.5, ry = -a + Math.PI / 2;
      if (x < 16) continue;
      b.cyl(VC.metal, '#8a9098', x, 16, z, 0.35, 32, 'cyl8');
      b.add(G.box, VC.metal, x, 32.4, z, 4.6, 2.4, 0.4, 0.5, ry, 0, '#3a3e44');
      b.add(G.box, VC.glow, x - Math.cos(a) * 0.25, 32.3, z - Math.sin(a) * 0.25, 4.2, 2.0, 0.1, 0.5, ry, 0, hdr('#f4f8ff', 3.2));
      K.pool(b, CX + Math.cos(a) * 26, CZ + Math.sin(a) * 26, 26, 26, hdr('#e8f4ff', 0.2), 0.06);
    }
    for (const e of [-1, 1]) b.box(VC.metal, '#3a3e44', CX + 12, 3.5, CZ + e * 8, 0.6, 7, 0.6);   // the big screen in the infield, facing the stands
    b.box(VC.metal, '#1a1c22', CX + 12.3, 10.5, CZ, 0.5, 9.4, 24.4);
    b.add(G.plane, raceMat, CX + 12, 10.5, CZ, 23.4, 8.6, 1, 0, -Math.PI / 2, 0);
    for (let k = 0; k < 10; k++) {   // across the valley: the towers walling it in
      const z = -3 - k * 7.6, h = rand(60, 115), x = rand(94, 110);
      if (z < -77) break;
      b.addM(buildingGeo(rand(16, 24), h, 7, K.dense, 2.0, 2.8), K.denseMat, at(x, 0, z), pick(PASTEL));
    }
    for (let k = 0; k < 5; k++) b.addM(buildingGeo(rand(18, 26), rand(90, 150), 13, K.office, 1.5, 3.8), K.officeMat, at(rand(126, 140), 0, -8 - k * 16), pick(['#ffffff', '#d8e4ff']));
    const g = b.build();
    // the field: ten runners and their jockeys, round and round under the lights
    const mat = std({ vertexColors: true, roughness: 0.55 });
    const horses = new THREE.InstancedMesh(horseGeo, mat, 10), riders = new THREE.InstancedMesh(jockeyGeo, mat, 10);
    const coats = ['#6a3a1a', '#8a4a20', '#4a2a14', '#b8b0a8', '#2a2018', '#7a4a2a'];
    const field = [];
    for (let i = 0; i < 10; i++) {
      horses.setColorAt(i, new THREE.Color(pick(coats))); riders.setColorAt(i, new THREE.Color(SILKS[i]));
      field.push({ a: -i * 0.034 - rand(0, 0.02) - (i > 6 ? 0.08 : 0), r: 26.4 + (i % 4) * 1.4 + rand(0, 0.5), ph: rand(0, 6.28) });
    }
    for (const m of [horses, riders]) { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); g.add(m); }
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, 'YXZ'), P = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1);
    let lead = 0, last = 0;
    movers.push((t, cam) => {   // while the runner passes the field comes round the near turn alongside; otherwise it laps on its own
      const dt = Math.min(0.1, Math.max(0, t - last)); last = t;
      const v = cam !== null && cam < 120 && cam > -110 ? Math.PI - 1.0 + 2.1 * Math.min(1, Math.max(0, (120 - cam) / 230)) : null;
      lead = v === null ? lead + dt * 0.62 : lead + (v - lead) * Math.min(1, dt * 3);
      for (let i = 0; i < field.length; i++) {
        const f = field[i], a = lead + f.a, gait = t * 9 + f.ph;
        P.set(CX + Math.cos(a) * f.r, 0.1 * Math.abs(Math.sin(gait)), CZ + Math.sin(a) * f.r);
        E.set(0.06 * Math.sin(gait), Math.PI - a, 0);   // nose along the way round
        M.compose(P, Q.setFromEuler(E), S1);
        horses.setMatrixAt(i, M); riders.setMatrixAt(i, M);
      }
      horses.instanceMatrix.needsUpdate = riders.instanceMatrix.needsUpdate = true;
    });
    return g;
  };

  // ---------- Causeway Bay: the crossroads by SOGO ----------
  const deptTex = canvasTex(128, 128, (g, w, h) => {   // a department store's skin: bands of warm light behind the glass between stone spandrels
    g.fillStyle = '#4a4650'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      const gr = g.createLinearGradient(0, y + 6, 0, y + 22); gr.addColorStop(0, '#f4e2c4'); gr.addColorStop(1, '#a89478'); g.fillStyle = gr; g.fillRect(0, y + 6, w, 16);
      g.fillStyle = 'rgba(30,30,40,0.7)'; for (let x = 0; x < w; x += 16) g.fillRect(x, y + 6, 2.5, 16);
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, y + 26, w, 2);
    }
  });
  const dept = { map: deptTex, emissive: deptTex, cols: 1, rows: 1 };
  const deptMat = std({ map: deptTex, emissive: '#ffffff', emissiveMap: deptTex, emissiveIntensity: 0.42, vertexColors: true, roughness: 0.6 });
  const sogo = (b, s, z0, z1, { x0 = 10.8, d = 30, h = 46 } = {}) => {   // the department store on the corner: its lit bands, the red name, the giant screen on the corner
    const L = z1 - z0, cx = s * (x0 + d / 2), cz = -(z0 + z1) / 2, f = s * x0;
    b.block(VC.solid, '#2a2a30', cx, 0, cz, d, GF, L);
    b.addM(alignedBox(d, h - GF, L, cx, GF, cz, dept, 8, 8, GF), deptMat, new THREE.Matrix4(), 0xffffff);
    K.ground(b, { side: s, face: f, len: L, z0, z: cz, n: Math.floor(L / 2.4) }, { fashion: 6, gold: 3, pharmacy: 3, electronics: 2 });
    b.box(VC.solid, '#f4f4f0', f - s * 0.2, h - 5, cz, 0.3, 7, L - 4);
    b.add(G.plane, label('崇光百貨  SOGO', { w: 1024, h: 192, color: '#d8101e', font: HEI, size: 0.66, k: 1.0 }), f - s * 0.37, h - 5, cz, L - 6, (L - 6) / 5.3, 1, 0, K.face(s), 0);
    b.box(VC.metal, '#14161c', s * (x0 + 8), 24, -z0 + 0.2, 14.4, 9.4, 0.3);   // the screen on the corner, facing the crossing
    b.add(G.plane, K.screen, s * (x0 + 8), 24, -z0 + 0.37, 13.6, 8.5, 1, 0, 0, 0, screenTint(0.8));
    b.box(VC.solid, '#d8101e', s * (x0 + 23), 33, -z0 + 0.12, 12.6, 4.2, 0.2);
    b.add(G.plane, label('SOGO 崇光', { w: 1024, h: 320, color: '#ffffff', font: HEI, size: 0.6, k: 0.95 }), s * (x0 + 23), 33, -z0 + 0.25, 12, 3.75, 1);
  };
  const plaza = (b, s, z0, z1, { x0 = 10.8 } = {}) => {   // a tower over a podium of shops, a giant screen on the podium and another up the tower
    const L = z1 - z0, cz = -(z0 + z1) / 2, f = s * x0, hp = 18, d = 28;
    b.block(VC.solid, '#30323a', s * (x0 + d / 2), 0, cz, d, hp, L);
    K.ground(b, { side: s, face: f, len: L, z0, z: cz, n: Math.floor(L / 2.4) }, { fashion: 6, electronics: 4, cafe: 3, dessert: 2 });
    b.box(VC.metal, '#14161c', f - s * 0.2, 10.6, cz, 0.3, 9, L - 6);
    b.add(G.plane, K.screen, f - s * 0.37, 10.6, cz, L - 7, 8.2, 1, 0, K.face(s), 0, screenTint(0.75));
    b.add(G.plane, label('時代廣場  TIMES SQUARE', { w: 1024, h: 128, color: '#ffffff', glow: '#3da8ff', font: HEI, size: 0.6, k: 1.2 }), f - s * 0.3, 16.75, cz, Math.min(L - 4, 26), 2.5, 1, 0, K.face(s), 0);
    b.addM(alignedBox(d - 6, 120, L - 6, s * (x0 + 3 + d / 2), hp, cz, K.office, 1.5, 3.8, hp), K.officeMat, new THREE.Matrix4(), '#e8f0ff');
    b.box(VC.metal, '#14161c', s * (x0 + 5.8), 46, cz, 0.3, 14, L - 8);
    b.add(G.plane, K.screen, s * (x0 + 5.63), 46, cz, L - 9, 13, 1, 0, K.face(s), 0, screenTint(0.8));
  };
  const causewayBay = () => {
    const b = new Batcher(), ZJ = 36, W = 13, R = W / 2, gaps = [[ZJ - R, ZJ + R]];
    K.tramWires(b);
    for (const s of [-1, 1]) {
      farGround(b, s, '#16151c');
      K.kerbLane(b, s, 0, 80, { gaps });
      K.jam(b, s, 0, 80, { fill: 0.72, mix: { bus: 3, taxi: 6, minibus: 3, car: 2 }, gaps: [[ZJ - R - 6, ZJ + R + 6]] });
      K.rails(b, s, [[ZJ - R - 5, ZJ + R + 5]], s * (KERB + 0.3));
      K.row(b, s, 0, ZJ - R, { shops: NEON_SHOPS, signs: 2.2, floors: [10, 18], roofSign: 0.4, upper: 0.7, kiosk: 0.15, reach: 34, vert: 0.5 });
      K.sideStreet(b, s, ZJ, W, { shops: NEON_SHOPS, signs: 2.0, crowd: 2.6, plate: s < 0 ? STREET.eastPoint : STREET.percival, floors: [8, 16] });
      K.backRow(b, s, { gaps: [[ZJ - R - 17, 80]], office: 0.6 });
      K.throng(b, s * (KERB + 0.45), s * 10.2, 1, 79, 58, { gaps: [[ZJ - R - 4, ZJ + R + 4]] });
      for (let z = 6; z < 78; z += 24) if (Math.abs(z - ZJ) > R + 4) K.lamp(b, s * (KERB + 0.35), -z, s);
      for (const e of [-1, 1]) {   // the crossings over the main road: the crowd banked up at the kerb on both sides of each
        const zc = ZJ + e * (R + 2.2);
        K.throng(b, s * (KERB + 0.3), s * (KERB + 3.6), zc - 1.8, zc + 1.8, randi(22, 30));
        K.signal(b, s * (KERB + 0.35), -(zc - e * 2.2), s);
        K.look(b, s * (KERB - 1.1), -zc, -s, s > 0 ? Math.PI / 2 : -Math.PI / 2);
      }
    }
    for (const e of [-1, 1]) K.zebra(b, 0, -(ZJ + e * (R + 2.2)), 3.6, 2 * KERB - 0.8, 'z');
    sogo(b, -1, ZJ + R, 80);
    plaza(b, 1, ZJ + R, 80);
    K.streetSign(b, KERB + 0.5, -(ZJ - R - 1.4), STREET.yeeWo);
    K.streetSign(b, -(KERB + 0.5), -(ZJ + R + 1.4), 4);
    return K.flushSteam(b.build());
  };

  // ---------- Quarry Bay: the Monster Building ----------
  const XI = 8.6, H = GF + 16 * 2.8, PASS = 14;
  const wallDetail = (b, { x, z, ux, uz, nx, nz, len, floors = 10, y0 = GF }) => {   // air-conditioners, window cages, laundry poles over a wall
    for (let r = 0; r < floors; r++) for (let c = 0; c < Math.floor(len / 2.0); c++) {
      const t = (c + 0.5) * 2.0, px = x + ux * t, pz = z + uz * t, y = y0 + r * 2.8, q = Math.random(), sp = r < 6 ? 1 : 0.55;
      if (q < 0.34 * sp) { b.add(G.box, VC.solid, px + nx * 0.25, y + 0.5, pz + nz * 0.25, 0.68, 0.46, 0.5, 0, Math.atan2(nx, nz), 0, pick(['#d8dad6', '#cfd2ce', '#e2e2dc', '#c4c8c4'])); }
      else if (q < 0.44 * sp) { b.add(G.box, K.grilleMat, px + nx * 0.26, y + 1.45, pz + nz * 0.26, 1.6, 1.7, 0.5, 0, Math.atan2(nx, nz), 0); b.add(OCT, VC.solid, px + nx * 0.3, y + 0.8, pz + nz * 0.3, 0.4, 0.4, 0.4, 0, 0, 0, pick(['#3a7a3a', '#2a6a32', '#c8202c'])); }
      if (Math.random() < 0.13 * sp) {   // a bamboo pole poked out, the washing along it
        const L = rand(1.2, 1.8), yy = y + 1.9;
        beam(b, VC.solid, px, yy, pz, px + nx * L, yy + 0.2, pz + nz * L, 0.035, '#c8b078');
        for (let k = 1; k <= 3; k++) { const tt = k / 3.6; b.add(G.box, VC.solid, px + nx * L * tt, yy - 0.35, pz + nz * L * tt, 0.42, 0.6, 0.03, 0, Math.atan2(ux, uz), 0, pick(['#f4f4f0', '#e8e8ff', '#c8202c', '#1f5aa8', '#f0d040', '#2a8a5a', '#f0a0c0', '#1a1a1e'])); }
      }
    }
  };
  const monster = () => {
    const b = new Batcher(), D = K.dense, BOX = (w, h, d, x, y, z, col) => b.addM(alignedBox(w, h, d, x, y, z, D, 2.0, 2.8, GF), K.denseMat, new THREE.Matrix4(), col);
    const GFB = (w, d, x, z) => b.block(VC.solid, '#3a3836', x, 0, z, w, GF, d);
    // the front block across the end of the street: its passage, 14 m high, the track running through it into the courtyard
    for (const e of [-1, 1]) { GFB(44 - XI, 10, e * (XI + (44 - XI) / 2), -7); BOX(44 - XI, H - GF, 10, e * (XI + (44 - XI) / 2), GF, -7, PASTEL[e > 0 ? 0 : 1]); }
    BOX(2 * XI, H - PASS, 10, 0, PASS, -7, PASTEL[2]);
    for (const e of [-1, 1]) for (let k = 0; k < 3; k++) K.shopZ(b, e * (XI + 2 + k * 11 + 5.5), -2, 1, 10.4, pick(['cafe', 'noodles', 'bakery', 'pharmacy', 'herbal', 'shutter', 'roast']));
    wallDetail(b, { x: -44, z: -1.98, ux: 1, uz: 0, nx: 0, nz: 1, len: 44 - XI, floors: 14 });
    wallDetail(b, { x: XI, z: -1.98, ux: 1, uz: 0, nx: 0, nz: 1, len: 44 - XI, floors: 14 });
    wallDetail(b, { x: -XI, z: -1.98, ux: 1, uz: 0, nx: 0, nz: 1, len: 2 * XI, floors: 10, y0: PASS + 0.2 });
    b.box(VC.solid, '#f4f4f0', 0, PASS + 1.3, -1.9, 9.6, 1.9, 0.1);
    b.add(G.plane, label('益昌大廈  YICK CHEONG BUILDING', { w: 1024, h: 128, color: '#c8101e', font: HEI, size: 0.58, k: 0.85 }), 0, PASS + 1.3, -1.83, 9.2, 1.4, 1);
    for (const x of [-4, 0, 4]) b.box(VC.glow, hdr('#eef6ff', 1.6), x, PASS - 0.06, -7, 0.12, 0.06, 8.4);   // the tubes along the passage's ceiling
    // the courtyard: the two wings, the right one opening into a second court
    const W0 = 12, W1 = 66, LW = W1 - W0;
    GFB(16, LW, -(XI + 8), -(W0 + W1) / 2); BOX(16, H - GF, LW, -(XI + 8), GF, -(W0 + W1) / 2, PASTEL[3]);
    for (const [z0, z1, col] of [[W0, 30, PASTEL[0]], [46, W1, PASTEL[5]]]) { GFB(36 - XI, z1 - z0, (XI + 36) / 2, -(z0 + z1) / 2); BOX(36 - XI, H - GF, z1 - z0, (XI + 36) / 2, GF, -(z0 + z1) / 2, col); }
    GFB(16, 34, 44, -38); BOX(16, H - GF, 34, 44, GF, -38, PASTEL[4]);   // the second court's far wall
    K.ground(b, { side: -1, face: -XI, len: LW, z0: W0, z: -(W0 + W1) / 2 }, { cafe: 4, noodles: 3, bakery: 2, herbal: 2, shutter: 4, medicine: 2 }, 0.2);
    for (const [z0, z1] of [[W0, 30], [46, W1]]) K.ground(b, { side: 1, face: XI, len: z1 - z0, z0, z: -(z0 + z1) / 2 }, { cafe: 3, noodles: 2, shutter: 4, fruit: 2, roast: 2 }, 0.15);
    wallDetail(b, { x: -XI + 0.02, z: -W0, ux: 0, uz: -1, nx: 1, nz: 0, len: LW });
    for (const [z0, z1] of [[W0, 30], [46, W1]]) wallDetail(b, { x: XI - 0.02, z: -z0, ux: 0, uz: -1, nx: -1, nz: 0, len: z1 - z0 });
    wallDetail(b, { x: XI, z: -30.02, ux: 1, uz: 0, nx: 0, nz: -1, len: 36 - XI, floors: 8 });
    wallDetail(b, { x: XI, z: -45.98, ux: 1, uz: 0, nx: 0, nz: 1, len: 36 - XI, floors: 8 });
    wallDetail(b, { x: 35.98, z: -30, ux: 0, uz: -1, nx: -1, nz: 0, len: 16, floors: 8 });
    // the far block, its passage out
    for (const e of [-1, 1]) { GFB(44 - XI, 12, e * (XI + (44 - XI) / 2), -72); BOX(44 - XI, H - GF, 12, e * (XI + (44 - XI) / 2), GF, -72, PASTEL[e > 0 ? 2 : 0]); }
    BOX(2 * XI, H - PASS, 12, 0, PASS, -72, PASTEL[1]);
    wallDetail(b, { x: -XI, z: -65.98, ux: 1, uz: 0, nx: 0, nz: 1, len: 2 * XI, floors: 10, y0: PASS + 0.2 });
    for (const e of [-1, 1]) wallDetail(b, { x: e > 0 ? XI : -44, z: -65.98, ux: 1, uz: 0, nx: 0, nz: 1, len: 44 - XI, floors: 12 });
    for (const x of [-4, 0, 4]) b.box(VC.glow, hdr('#eef6ff', 1.6), x, PASS - 0.06, -72, 0.12, 0.06, 10.4);
    // the court's floor: concrete, the parking bays, a few cars, the residents and the visitors with their phones up
    for (const e of [-1, 1]) {
      b.add(K.tiled2(2, 38), K.paveMat, e * (EDGE + 0.2 + (XI - EDGE - 0.2) / 2), 0.025, -39, XI - EDGE - 0.2, 76, 1, -Math.PI / 2, 0, 0);
      K.paint(b, e * (EDGE + 3.1), -39, 0.08, 52, hdr('#e8e8e2', 0.5));
      for (let z = W0 + 2; z < W1; z += 6) K.paint(b, e * (EDGE + 1.65), -z, 2.9, 0.08, hdr('#e8e8e2', 0.5));
    }
    for (const e of [-1, 1]) for (let z = W0 + 4; z < W1 - 6; z += rand(7, 14)) if (chance(0.55)) pick([K.car, K.van, K.car])(b, e * (EDGE + 1.6), -z, e);
    const side = () => pick([-1, 1]) * rand(EDGE + 0.5, XI - 0.6);   // (off the track)
    for (let k = 0; k < 12; k++) K.person(b, side(), -rand(3, 77));
    for (let k = 0; k < 8; k++) K.person(b, side(), -rand(16, 62), { phone: true });
    for (let k = 0; k < 4; k++) K.person(b, side(), -rand(14, 64), { s: rand(0.55, 0.7), coat: pick(['#e8202a', '#ffd23d', '#3dc8e8', '#ff6ab0']) });
    for (let k = 0; k < 5; k++) K.seated(b, (k % 2 ? 1 : -1) * (XI - 0.9), -rand(14, 64), { y: 0.42 });
    for (let k = 0; k < 6; k++) K.person(b, rand(XI + 2, 34), -rand(32, 44), { phone: chance(0.6) });
    K.trolley(b, -(XI - 1.4), -rand(20, 60));
    b.add(K.tiled2(14, 8), K.paveMat, (XI + 36) / 2, 0.025, -38, 36 - XI, 16, 1, -Math.PI / 2, 0, 0);
    return K.flushSteam(b.build());
  };

  // ---------- Central: the Mid-Levels Escalator ----------
  // The hill rises from the back of the street on the left; a stepped lane climbs it between buildings stacked up the slope, and
  // the covered escalator, crossing over the street from the old Central Market on the right, runs up beside it.
  const TAN = Math.tan((22 * Math.PI) / 180), SL = (x) => Math.max(0, -x - 10.8) * TAN, ZS = 50, WS = 8;
  const stepTex = canvasTex(32, 32, (g, w, h) => {   // granite steps: the worn tread, the shadowed riser, a lit nosing
    g.fillStyle = '#9a968c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4a4640'; g.fillRect(w * 0.62, 0, w * 0.38, h);
    g.fillStyle = 'rgba(255,240,210,0.35)'; g.fillRect(w * 0.6, 0, 2, h);
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(60,56,50,${rand(0.1, 0.3).toFixed(2)})`; g.fillRect(rand(0, w * 0.6), rand(0, h), 2, 2); }
  });
  const steps = std({ map: stepTex, roughness: 0.85, emissive: '#ffd8a0', emissiveMap: stepTex, emissiveIntensity: 0.12 });
  const marketTex = canvasTex(128, 64, (g, w, h) => {   // the old Central Market's streamlined bands: cream render, long strip windows
    g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a3a3a'; g.fillRect(0, 22, w, 14); g.fillStyle = 'rgba(255,230,180,0.85)'; for (let x = 2; x < w; x += 8) g.fillRect(x, 24, 6, 10);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 44, w, 2);
  });
  const marketMat = std({ map: marketTex, roughness: 0.8, emissive: '#ffffff', emissiveMap: marketTex, emissiveIntensity: 0.18 });
  const slopeAt = (x0, x1, ...rest) => {   // a matrix laying a unit plane on the hill's slope between x0 and x1 (x1 further up), rest: z, width
    const [z, w] = rest, c = Math.cos(Math.atan(TAN)), sn = Math.sin(Math.atan(TAN)), L = (x0 - x1) / c;
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(-c, sn, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(sn, c, 0));
    m.scale(new THREE.Vector3(L, w, 1)).setPosition((x0 + x1) / 2, (SL(x0) + SL(x1)) / 2 + 0.04, z);
    return { m, L };
  };
  const escalator = () => {
    const b = new Batcher(), za = ZS - WS / 2, zb = ZS + WS / 2, ze = -(ZS + 1.9);
    // the street: Queen's Road Central, its traffic and its crowd
    for (const s of [-1, 1]) {
      farGround(b, s, s < 0 ? '#18201a' : '#16151c');
      K.kerbLane(b, s); K.jam(b, s, 0, 80, { fill: 0.55, mix: { taxi: 7, minibus: 3, car: 2, van: 1 } });
      K.rails(b, s, s < 0 ? [[za - 1, zb + 1]] : [], s * (KERB + 0.3));
      for (let z = 8; z < 78; z += 24) K.lamp(b, s * (KERB + 0.35), -z, s);
      K.throng(b, s * (KERB + 0.45), s * 10.2, 1, 79, 36, { gaps: s < 0 ? [[za - 0.5, zb + 0.5]] : [] });
    }
    K.row(b, -1, 0, za, { shops: NEON_SHOPS, signs: 1.4, floors: [5, 8], tall: 0, roofSign: 0.2, upper: 0.5, kiosk: 0.1 });
    K.row(b, -1, zb, 80, { shops: NEON_SHOPS, signs: 1.4, floors: [5, 8], tall: 0, roofSign: 0.2, upper: 0.5, kiosk: 0.1 });
    K.row(b, 1, 0, ZS - 15, { shops: NEON_SHOPS, signs: 1.2, floors: [7, 12], upper: 0.4 });
    K.row(b, 1, ZS + 15, 80, { shops: NEON_SHOPS, signs: 1.2, floors: [7, 12], upper: 0.4 });
    K.backRow(b, 1, { x0: 44, office: 0.9, sign: 0.1 });
    // Central Market on the right, the walkway leaving it high over the street
    b.block(VC.solid, '#3a3836', 25, 0, -ZS, 28, GF, 30);
    b.addM(alignedBox(28, 16, 30, 25, GF, -ZS, { cols: 1, rows: 1 }, 8, 4, GF), marketMat, new THREE.Matrix4(), 0xffffff);
    b.box(VC.solid, '#d8d0bc', 10.9, GF + 16.4, -ZS, 0.6, 0.8, 30.4);
    K.ground(b, { side: 1, face: 10.8, len: 30, z0: ZS - 15, z: -ZS }, { fruit: 3, roast: 2, cafe: 2, bakery: 2 });
    b.add(G.plane, label('中環街市  CENTRAL MARKET', { w: 1024, h: 128, color: '#1a6a4a', font: HEI, size: 0.56, k: 0.9 }), 10.74, 19.4, -ZS - 4, 12, 1.5, 1, 0, -Math.PI / 2, 0);
    // the hill: its slope behind the street's row, the stepped lane up it, the blocks of the Mid-Levels in tiers
    const HX = 130;
    for (const [z0, z1] of [[0, za], [zb, 80]]) {
      const { m } = slopeAt(-10.8, -HX, -(z0 + z1) / 2, z1 - z0);
      b.addM(G.plane, VC.solid, m, '#1a261e');
    }
    const st = slopeAt(-10.8, -HX, -ZS, WS);
    b.addM(planeUV({ u0: 0, u1: Math.round(st.L / 0.45), v0: 0, v1: 1 }), steps, st.m, 0xffffff);
    for (let k = 1; k <= 4; k++) {   // each tier's row up the slope, the stepped lane running between them
      const x0 = 26 + (k - 1) * 21, yb = SL(-x0), d = 14, hmax = 24 + k * 10;
      for (const [z0, z1] of [[1, za - 0.4], [zb + 0.4, 79]]) {
        for (let z = z0; z < z1 - 4;) {
          const L = Math.min(rand(8, 16), z1 - z), h = rand(hmax * 0.7, hmax), dense = chance(0.55);
          const T = dense ? [K.dense, K.denseMat, 2.0, 2.8] : (() => { const t = pick(K.tongs); return [t.tex, t.mat, 2.4, 3.0]; })();
          b.addM(buildingGeo(d, h + 6, L, T[0], T[2], T[3]), T[1], at(-(x0 + d / 2), yb - 6, -(z + L / 2)), pick(['#f4e8c8', '#e0ecf4', '#f4dcd8', '#dcecd8', '#f0f0e8', '#c8c8c2', '#c4a8b0']));
          if (chance(0.25)) K.roofSign(b, { x: -(x0 + d / 2), z: -(z + L / 2), d, h: yb + h, len: L });
          z += L + rand(0.6, 3);
        }
      }
      for (let n = 0; n < 6; n++) { const x = -(x0 - rand(2, 5)), z = -rand(2, 78); if (Math.abs(-z - ZS) > WS) b.add(G.sphLow, VC.solid, x, SL(x) + 1, z, rand(3, 5), rand(2.5, 4), rand(3, 5), 0, 0, 0, pick(['#1c3a22', '#22442a', '#2a4a30'])); }
    }
    // the lane: lanterns over it, stalls at its foot, signs hung out across it, people climbing
    for (let x = -13; x > -118; x -= 6) {
      const y = SL(x) + 5.4;
      beam(b, VC.metal, x, y + 0.6, -za + 0.3, x, y + 0.6, -zb - 0.3, 0.025, '#1a1a1e');
      K.lantern(b, x, y, -(ZS - 1.6), 0.32);
    }
    for (let x = -16; x > -36; x -= 4.5) {   // (on the steps' side; the escalator's columns stand on the other)
      const zz = -ZS + (WS / 2 - 0.8), y = SL(x);
      b.block(VC.solid, '#5a4a38', x, y, zz, 1.6, 0.9, 1.2);
      b.add(G.box, VC.solid, x, y + 2.3, zz, 2.0, 0.05, 1.6, 0, 0, 0.1, pick(['#c8202c', '#1f5aa8', '#e8b020', '#2a7a4a']));
      b.box(VC.glow, hdr('#fff0c0', 2.4), x, y + 2.05, zz, 0.12, 0.14, 0.12);
      for (let q = 0; q < 3; q++) b.box(VC.solid, pick(['#ff3d6a', '#3dbfff', '#ffe23d', '#f4f4f0', '#c8202c']), x + rand(-0.6, 0.6), y + 1.0, zz + rand(-0.4, 0.4), 0.3, 0.16, 0.3);
    }
    for (let q = 0; q < 8; q++) { const x = -rand(16, 100), side = pick([-1, 1]); K.neonZ(b, -ZS + side * (WS / 2), SL(x) + rand(3, 9), x, -side, { v: chance(0.7), max: WS / 2 }); }
    for (let q = 0; q < 16; q++) { const x = -rand(11.5, 90); K.person(b, x, -(ZS - rand(0.6, 3.4)), { y: SL(x) }); }
    // the escalator: the covered bridge over the street from the market, then up the hill beside the steps
    const XB = -(10.8 + 14.4 / TAN);   // where the bridge meets the slope
    const walk = (b2, x0, x1, y0, y1) => {   // a covered walkway segment from (x0, y0) to (x1, y1) along x at ze
      const L = Math.hypot(x1 - x0, y1 - y0), rz = Math.atan2(Math.sign(x1 - x0) * (y1 - y0), Math.abs(x1 - x0)), xc = (x0 + x1) / 2, yc = (y0 + y1) / 2, c = Math.cos(rz), sn = Math.sin(rz);   // (rz kept within ±90° so "up" is up)
      const up = (h) => [xc - sn * h, yc + c * h];
      b2.add(G.box, VC.solid, xc, yc, ze, L, 0.35, 3.4, 0, 0, rz, '#6a6e78');
      for (const e of [-1, 1]) {
        b2.add(G.box, VC.glow, ...up(1.15), ze + e * 1.62, L, 1.5, 0.05, 0, 0, rz, hdr('#dfeaf4', 0.32));
        b2.add(G.box, VC.metal, ...up(2.0), ze + e * 1.66, L, 0.12, 0.1, 0, 0, rz, '#9aa0a8');
      }
      b2.add(G.box, VC.solid, ...up(2.4), ze, L, 0.25, 3.9, 0, 0, rz, '#c8ccd2');
      b2.add(G.box, VC.glow, ...up(2.24), ze, L, 0.05, 1.4, 0, 0, rz, hdr('#f4f8ff', 1.1));
      for (let t = 2; t < L; t += 4) { const [px, py] = [x0 + (x1 - x0) * (t / L), y0 + (y1 - y0) * (t / L)]; for (const e of [-1, 1]) b2.box(VC.metal, '#8a9098', px, py + 1.2, ze + e * 1.6, 0.1, 2.4, 0.1); }
      for (let t = 1.5; t < L; t += rand(1.6, 2.6)) { const px = x0 + (x1 - x0) * (t / L), py = y0 + (y1 - y0) * (t / L); K.person(b2, px, ze + rand(-0.5, 0.5), { y: py + 0.18 }); }
    };
    walk(b, 14.6, XB, 14.4, 14.4);
    walk(b, XB, -HX + 6, 14.4, SL(-HX + 6) + 0.4);
    for (const x of [KERB + 0.4, -(KERB + 0.4)]) b.box(VC.metal, '#6a707c', x, 7.2, ze, 0.6, 14.4, 0.6);
    for (let x = -14; x > XB; x -= 8) b.box(VC.metal, '#6a707c', x, (14.4 + SL(x)) / 2, ze, 0.5, 14.4 - SL(x), 0.5);
    b.box(VC.solid, '#1a3a6a', 0, 13.95, ze + 1.75, 9.6, 0.9, 0.06);
    b.add(G.plane, label('中環至半山自動扶梯  CENTRAL–MID-LEVELS ESCALATOR', { w: 1024, h: 64, color: '#ffffff', font: HEI, size: 0.6, k: 1.0 }), 0, 13.95, ze + 1.79, 9.4, 0.62, 1);
    K.streetSign(b, KERB + 0.5, -6, STREET.qrc);
    K.streetSign(b, -(KERB + 0.5), -(za - 1.2), STREET.cochrane);
    return K.flushSteam(b.build());
  };

  return {
    happyValley, causewayBay, monster, escalator,
    update(t, cams = {}) { for (const f of movers) f(t, cams.valley ?? null); },
  };
}
