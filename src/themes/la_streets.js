// Two more of Los Angeles's street kinds (la.js): the freeway, and a film studio's lot.
// The freeway: the line runs down the median, as the C Line runs down the 105. The evening rush has stopped it both ways
// (tail lamps going away on the right, headlamps coming on the left), a bike splitting the lanes as only California
// allows; the concrete barriers, the lanes and their raised dots, the sound walls under ivy and bougainvillea with the
// oleanders at their feet, palms and apartments and a billboard over them; the green signs on their bridges over each
// side's lanes, and sometimes an overcrossing high over everything. In the south, one wall has the Baldwin Hills behind
// it, bare slopes with the pumpjacks nodding on their pads.
// The studio: the line runs through the lot like the tour tram. Sound stages on one side, their numbers, elephant doors
// and the red lamps by them, the water tower with the studio's name, golf carts, trailers and trucks; the western street
// on the other side, false fronts propped up from behind, a shoot under the lights, and the painted sky at the end.
// Every name here is made up; the highways are real.
import { THREE, VC, G, std, hdr, canvasTex, planeUV, shade, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { EDGE, farGround, RING } from './common.js';
import { beam } from './tokyo_kit.js';
import { frame } from './ny_icons.js';
import { quad } from './la_beach.js';
import { SANS, SERIF, DECO, STUCCO, PASTEL, face } from './la_kit.js';

const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
// ---------- the freeway ----------
const KR = 4.7;                          // the median barriers, either side of the line
const LANES = [6.95, 10.55, 14.15];      // three lanes of 3.6 m
const WALL = 19, WALL_H = 5.4;           // the sound walls
const DECK = 11.5;                       // an overcrossing's soffit: clear of the jetpack
// the big green signs: a shield (I: Interstate, CA: state route, US: U.S. route), its direction and the places it goes; or an exit
const SIGNS = [
  { sh: ['I', '105'], dir: 'WEST', lines: ['El Segundo', 'LAX'] },
  { sh: ['I', '110'], dir: 'NORTH', lines: ['Los Angeles'] },
  { sh: ['US', '101'], dir: 'SOUTH', lines: ['Hollywood Fwy', 'Downtown LA'] },
  { exit: '20B', lines: ['Manchester Av'], dist: '1/2 MILE' },
  { sh: ['I', '10'], dir: 'WEST', lines: ['Santa Monica'] },
  { sh: ['CA', '110'], dir: 'NORTH', lines: ['Pasadena'] },
  { exit: '12', lines: ['Imperial Hwy', 'Wilmington Av'], dist: '1 MILE' },
  { sh: ['I', '405'], dir: 'NORTH', lines: ['Sacramento'] },
];
const GREEN = '#0b6b3c';
function rounded(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function shield(g, [kind, num], x, y, s) {   // a route shield s tall with its top left at (x, y)
  const w = s * 0.92;
  g.save(); g.translate(x, y);
  const outline = () => { g.beginPath(); g.moveTo(w * 0.04, s * 0.1); g.quadraticCurveTo(w * 0.27, s * 0.02, w * 0.5, s * 0.08); g.quadraticCurveTo(w * 0.73, s * 0.02, w * 0.96, s * 0.1); g.lineTo(w, s * 0.42); g.bezierCurveTo(w, s * 0.75, w * 0.7, s * 0.9, w * 0.5, s); g.bezierCurveTo(w * 0.3, s * 0.9, 0, s * 0.75, 0, s * 0.42); g.closePath(); };
  if (kind === 'I') {   // blue, the red crown, a white edge
    outline(); g.fillStyle = '#ffffff'; g.fill();
    g.save(); g.translate(w * 0.05, s * 0.05); g.scale(0.9, 0.9); outline(); g.clip(); g.fillStyle = '#1a3f9a'; g.fillRect(0, 0, w, s); g.fillStyle = '#c8202a'; g.fillRect(0, 0, w, s * 0.27); g.restore();
    g.fillStyle = '#ffffff'; g.font = `700 ${Math.round(s * 0.2)}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('INTERSTATE', w / 2, s * 0.17);
    g.font = `700 ${Math.round(s * (num.length > 2 ? 0.4 : 0.5))}px ${SANS}`; g.fillText(num, w / 2, s * 0.6);
  } else if (kind === 'CA') {   // the green spade with its white edge
    g.beginPath(); g.moveTo(w * 0.1, 0); g.lineTo(w * 0.9, 0); g.quadraticCurveTo(w * 0.98, s * 0.5, w * 0.5, s); g.quadraticCurveTo(w * 0.02, s * 0.5, w * 0.1, 0); g.closePath();
    g.fillStyle = GREEN; g.fill(); g.lineWidth = s * 0.05; g.strokeStyle = '#ffffff'; g.stroke();
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${Math.round(s * 0.12)}px ${SANS}`; g.fillText('CALIFORNIA', w / 2, s * 0.13);
    g.font = `700 ${Math.round(s * 0.42)}px ${SANS}`; g.fillText(num, w / 2, s * 0.5);
  } else {   // a white shield on a black square
    g.fillStyle = '#141414'; g.fillRect(0, 0, w, s);
    g.save(); g.translate(w * 0.08, s * 0.06); g.scale(0.84, 0.88); outline(); g.fillStyle = '#ffffff'; g.fill(); g.restore();
    g.fillStyle = '#141414'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${Math.round(s * 0.42)}px ${SANS}`; g.fillText(num, w / 2, s * 0.52);
  }
  g.restore();
}
function drawSign(g, sg, w, h) {   // one sign, w × h, its border, its words and its arrows
  g.clearRect(0, 0, w, h);
  const top = sg.exit ? 54 : 6;
  if (sg.exit) {   // the exit tab, up on the right
    rounded(g, w - 214, 4, 206, 60, 10); g.fillStyle = GREEN; g.fill(); g.lineWidth = 4; g.strokeStyle = '#ffffff'; g.stroke();
    g.fillStyle = '#ffffff'; g.font = `600 38px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`EXIT ${sg.exit}`, w - 111, 36);
  }
  rounded(g, 4, top, w - 8, h - top - 4, 16); g.fillStyle = GREEN; g.fill();
  rounded(g, 12, top + 8, w - 24, h - top - 20, 12); g.lineWidth = 5; g.strokeStyle = '#ffffff'; g.stroke();
  g.fillStyle = '#ffffff'; g.textBaseline = 'middle';
  if (sg.sh) {
    shield(g, sg.sh, 30, top + 24, 112);
    g.textAlign = 'left'; g.font = `600 40px ${SANS}`; g.fillText(sg.dir, 34, top + 168);
    g.font = `500 ${sg.lines.length > 1 ? 50 : 60}px ${SANS}`;
    sg.lines.forEach((l, i) => g.fillText(l, 172, top + (sg.lines.length > 1 ? 66 + i * 64 : 96)));
    g.beginPath(); const ax = w - 70, ay = top + 70; g.moveTo(ax - 9, ay); g.lineTo(ax + 9, ay); g.lineTo(ax + 9, ay + 56); g.lineTo(ax + 26, ay + 56); g.lineTo(ax, ay + 96); g.lineTo(ax - 26, ay + 56); g.lineTo(ax - 9, ay + 56); g.closePath(); g.fill();   // the lane's arrow, pointing down
  } else {
    g.textAlign = 'center'; g.font = `500 ${sg.lines.length > 1 ? 50 : 62}px ${SANS}`;
    sg.lines.forEach((l, i) => g.fillText(l, w / 2, top + (sg.lines.length > 1 ? 52 + i * 58 : 70)));
    g.font = `600 40px ${SANS}`; g.fillText(sg.dist, w / 2, h - 44);
  }
}
const IVY = ['#3e6a34', '#467238', '#3a6230', '#4e7a40'];
// ---------- the studio ----------
const STUDIOS = ['STARLIGHT STUDIOS', 'PALMWOOD PICTURES', 'SUNSET STAGES', 'GOLDEN STATE STUDIOS'];
const WEST = ['SALOON', 'HOTEL', 'GENERAL STORE', 'SHERIFF', 'BANK', 'BARBER', 'LIVERY STABLE', 'ASSAY OFFICE', 'TELEGRAPH', 'DRY GOODS', 'GUNSMITH'];
const STAGE = ['#e8dcc4', '#ece4d4', '#dcd0bc', '#e4d8c8'];
const SX = 17;   // the stages' fronts

export function makeStreets(K) {
  // ---------- materials ----------
  const atlas = canvasTex(1024, 1024, (g) => SIGNS.forEach((sg, i) => { g.save(); g.translate((i % 2) * 512, Math.floor(i / 2) * 256); drawSign(g, sg, 512, 256); g.restore(); }), { repeat: false });
  const signMat = std({ map: atlas, transparent: true, alphaTest: 0.5, roughness: 0.5, emissive: '#ffffff', emissiveMap: atlas, emissiveIntensity: 0.32 });
  const signGeo = SIGNS.map((_, i) => planeUV({ u0: (i % 2) / 2 + 0.001, u1: (i % 2) / 2 + 0.499, v0: 1 - (Math.floor(i / 2) + 1) / 4 + 0.001, v1: 1 - Math.floor(i / 2) / 4 - 0.001 }));
  const dotsMat = std({ map: canvasTex(16, 128, (g, w, h) => {   // a lane line of Botts' dots: three round ones, then a reflector, every 3.6 m
    g.clearRect(0, 0, w, h); g.fillStyle = '#f4f2ec';
    for (const v of [0.125, 0.375, 0.625]) { g.beginPath(); g.arc(w / 2, v * h, 5.5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#ffffff'; g.fillRect(w / 2 - 6, 0.875 * h - 4, 12, 8);
  }), alphaTest: 0.4, roughness: 0.4, emissive: '#ffffff', emissiveIntensity: 0.06 });
  const dotsGeo = planeUV({ u0: 0, u1: 1, v0: 0, v1: CHUNK_LEN / 3.6 });
  const blockMat = std({ map: canvasTex(256, 256, (g, w, h) => {   // split-face block, two metres of it: ten courses, running bond
    g.fillStyle = '#d8d0c4'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 10; r++) for (let c = -1; c < 5; c++) { const x = c * 51.2 + (r % 2) * 25.6, y = r * 25.6; g.fillStyle = `rgba(${randi(150, 190)},${randi(140, 175)},${randi(120, 150)},0.35)`; g.fillRect(x + 2, y + 2, 47, 21.6); }
    g.fillStyle = 'rgba(70,60,50,0.45)'; for (let r = 0; r <= 10; r++) g.fillRect(0, r * 25.6 - 1, w, 2);
    for (let r = 0; r < 10; r++) for (let c = 0; c <= 5; c++) g.fillRect(c * 51.2 + (r % 2) * 25.6 - 1, r * 25.6, 2, 25.6);
    for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(0,0,0,${rand(0.03, 0.12)})`; g.fillRect(rand(0, w), rand(0, h), 2, 2); }
  }), vertexColors: true, roughness: 0.92 });
  const skyMat = std({ map: canvasTex(512, 256, (g, w, h) => {   // the backlot's painted sky: a summer noon, clouds piled up on it
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a7ad0'); gr.addColorStop(0.7, '#8ab8e8'); gr.addColorStop(1, '#c8dcf0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 16; k++) { const x = rand(0, w), y = rand(h * 0.25, h * 0.85), r = rand(18, 46); for (let j = 0; j < 6; j++) { g.fillStyle = `rgba(255,255,255,${rand(0.5, 0.85)})`; g.beginPath(); g.ellipse(x + rand(-r, r), y + rand(-r * 0.3, r * 0.2), r * rand(0.5, 1), r * rand(0.35, 0.6), 0, 0, Math.PI * 2); g.fill(); } }
  }, { repeat: false }), roughness: 0.9, emissive: '#ffffff', emissiveIntensity: 0.3 });
  skyMat.emissiveMap = skyMat.map;
  const KRAIL = (() => {   // the median's barrier, a chunk long: the safety-shape profile
    const sh = new THREE.Shape();
    [[-0.3, 0], [0.3, 0], [0.3, 0.08], [0.13, 0.32], [0.08, 0.84], [-0.08, 0.84], [-0.13, 0.32], [-0.3, 0.08]].forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: CHUNK_LEN, bevelEnabled: false }); g.translate(0, 0, -CHUNK_LEN); return g;
  })();
  const sideOn = (s) => (s > 0 ? 0 : Math.PI);   // a sign facing its own traffic: toward us on the right

  // ---------- the freeway's pieces ----------
  // a semi: the trailer, its doors and lamps at the back, the tractor's hood, cab, sleeper and stacks; front toward -z if dir > 0
  const semi = (b, x, z, dir) => {
    const F = frame(b, x, 0, z, 1, dir > 0 ? 0 : Math.PI), col = pick(['#f4f4f0', '#e8e8e4', '#c8ccd2', '#2a4a8a', '#c8302a', '#e8e4dc']), cab = pick(['#c8302a', '#2a2a30', '#f4f4f0', '#2a5a9a', '#e8a020', '#3a6a3a']);
    F.box(VC.solid, col, 0, 2.6, 2.6, 2.6, 2.9, 13.6); F.box(VC.solid, '#3a3a3e', 0, 1.0, 2.6, 2.2, 0.3, 13.4);
    F.box(VC.solid, shade(col, 0.85), 0, 2.6, 9.42, 2.5, 2.8, 0.04); F.box(VC.metal, '#8a8e94', 0, 2.6, 9.45, 0.06, 2.8, 0.02);   // the doors at the back
    for (const e of [-1, 1]) { F.box(VC.glow, hdr('#ff2a2a', 1.8), e * 1.05, 1.25, 9.46, 0.24, 0.14, 0.04); F.box(VC.glow, hdr('#ffb040', 1.6), e * 1.25, 4.0, 9.44, 0.1, 0.1, 0.04); }
    for (const zz of [-2.5, 2.6, 8.0]) for (const e of [-1, 1]) F.box(VC.glow, hdr('#ffb040', 1.4), e * 1.31, 1.2, zz, 0.04, 0.08, 0.14);   // the marker lamps down the side
    for (const zz of [7.0, 8.3, -2.6, -3.9]) for (const e of [-1, 1]) F.add(G.cyl8, VC.solid, e * 0.95, 0.52, zz, 1.04, 0.5, 1.04, 0, 0, Math.PI / 2, '#141414');
    F.box(VC.solid, cab, 0, 1.75, -5.6, 2.45, 2.3, 2.6); F.box(VC.solid, cab, 0, 2.6, -4.2, 2.45, 2.9, 1.2);   // the cab and its sleeper
    F.box(VC.glow, hdr('#2e3a4e', 0.95), 0, 2.4, -6.92, 2.2, 0.9, 0.04);
    F.add(G.box, VC.solid, 0, 1.15, -8.0, 2.2, 1.0, 2.6, 0.12, 0, 0, cab); F.box(VC.metal, '#c8ccd2', 0, 0.95, -9.4, 2.0, 0.9, 0.1);   // the hood, the grille
    for (const e of [-1, 1]) { F.cyl(VC.metal, '#d8dce2', e * 1.32, 3.0, -4.9, 0.09, 3.6, 'cyl8'); F.box(VC.glow, hdr('#fff4d0', 2.2), e * 0.85, 0.75, -9.47, 0.34, 0.18, 0.04); F.add(G.cyl8, VC.solid, e * 1.0, 0.55, -8.2, 1.1, 0.45, 1.1, 0, 0, Math.PI / 2, '#141414'); }
  };
  // a motorbike splitting the lanes, its rider in a helmet
  const moto = (b, x, z, dir) => {
    const F = frame(b, x, 0, z, 1, dir > 0 ? 0 : Math.PI);
    for (const zz of [-0.72, 0.72]) F.add(G.cyl8, VC.solid, 0, 0.32, zz, 0.64, 0.12, 0.64, 0, 0, Math.PI / 2, '#141414');
    F.box(VC.solid, pick(['#141414', '#c8202a', '#2a4a9a', '#e8e4dc']), 0, 0.68, -0.15, 0.36, 0.38, 1.1); F.box(VC.solid, '#1a1a1e', 0, 0.9, 0.3, 0.3, 0.1, 0.7);
    F.box(VC.glow, hdr('#fff4d0', 2.4), 0, 0.85, -0.82, 0.14, 0.12, 0.04); F.box(VC.glow, hdr('#ff2a2a', 1.6), 0, 0.82, 0.72, 0.12, 0.06, 0.04);
    const p = F.at(0, 0, 0.12); K.person(b, p.x, p.z, { seated: true, y: 0.42, ry: dir > 0 ? 0 : Math.PI, bag: false, phone: false, shades: false, hat: 'none', top: '#1a1a1e', legs: '#2a2a3a' });
    b.sph(VC.solid, pick(['#141414', '#f4f4f0', '#c8202a']), p.x, 1.95, p.z, 0.17);
  };
  // the traffic on side s: three lanes of it, near nose to tail, the near lane in full, the others plainer
  const traffic = (b, s, { jam = rand(0.62, 0.9), z0 = 0, z1 = CHUNK_LEN } = {}) => {
    LANES.forEach((lx, li) => {
      for (let z = z0 + rand(0, 5); z < z1 - 3;) {
        const r = Math.random();
        if (li > 0 && r < 0.07 && z + 20 < z1) { semi(b, s * lx, -(z + 9.9), s); z += 19.8 + rand(1.5, 4); continue; }
        if (li > 0 && r < 0.1 && z + 12 < z1) { K.metroBus(b, s * lx, -(z + 6), s); z += 12 + rand(1.5, 4); continue; }
        if (chance(jam)) K.car(b, s * lx, -(z + 2.5), s, { lit: true, lo: li > 0 });
        z += 5 + (chance(jam) ? rand(1.0, 2.6) : rand(5, 12));
      }
    });
    if (chance(0.45)) moto(b, s * (LANES[0] + 1.8), -rand(z0 + 6, z1 - 6), s);
  };
  const freewayLamp = (b, s, z) => {   // a tall lamp on the outside shoulder, its arm out over the lanes
    b.cyl(VC.metal, '#8a8e94', s * 18.3, 6, z, 0.12, 12, 'cyl8'); b.box(VC.solid, '#a8a49c', s * 18.3, 0.3, z, 0.6, 0.6, 0.6);
    beam(b, VC.metal, s * 18.3, 11.7, z, s * 15.4, 12.0, z, 0.1, '#8a8e94');
    b.box(VC.metal, '#5a5e64', s * 15.2, 11.95, z, 0.9, 0.22, 0.45); b.box(VC.glow, hdr('#ffe2b0', 2.4), s * 15.2, 11.82, z, 0.7, 0.05, 0.32);
    K.pool(b, s * 13, z, 9, 9, hdr('#ffd8a0', 0.16));
  };
  const soundWall = (b, s, z0, z1) => {   // block on a footing, its cap; ivy up its face in stretches, bougainvillea over the top, oleanders at its foot
    const L = z1 - z0, zc = -(z0 + z1) / 2, col = pick(['#c8bca8', '#b8ac98', '#d0c4b0', '#bcb4a4']);
    b.addM(K.tiledBox(0.4, WALL_H, L, 2), blockMat, T(s * WALL, WALL_H / 2, zc), col);
    b.box(VC.solid, shade(col, 0.82), s * WALL, WALL_H + 0.08, zc, 0.52, 0.16, L); b.box(VC.solid, shade(col, 0.7), s * (WALL - 0.22), 0.25, zc, 0.06, 0.5, L);
    for (let z = z0; z < z1 - 1;) {
      const l = Math.min(rand(4, 10), z1 - z), h = rand(2.2, WALL_H - 0.2), c = pick(IVY);
      b.add(G.plane, VC.solid, s * (WALL - 0.22), h / 2, -(z + l / 2), l, h, 1, 0, face(s), 0, c);
      for (let k = 0; k < l / 2; k++) b.add(G.sphLow, VC.solid, s * (WALL - 0.26), h - rand(0, 0.5), -(z + rand(0.2, l - 0.2)), rand(0.25, 0.4), rand(0.5, 0.8), rand(0.9, 1.5), 0, 0, 0, c);
      z += l + (chance(0.4) ? rand(1, 5) : 0);
    }
    for (let k = 0; k < L / 9; k++) { const z = -rand(z0 + 1, z1 - 1); for (let j = 0; j < 4; j++) b.add(G.sphLow, VC.solid, s * (WALL - rand(0.1, 0.5)), WALL_H + rand(-0.4, 0.2), z + rand(-1.2, 1.2), rand(0.6, 1.0), rand(0.4, 0.7), rand(0.6, 1.0), 0, 0, 0, pick(['#c8206a', '#d8307a', '#2e5a2a'])); }
    for (let z = z0 + rand(1, 4); z < z1 - 1.5; z += rand(5, 8)) {   // the oleanders, pink and white
      const x = s * rand(17.4, 18.0), h = rand(1.6, 2.6), fl = pick(['#ff8ab8', '#f4f0f0', '#e8507a']), g = pick(['#3a6230', '#44703a', '#4a7a3e']);
      for (let k = 0; k < 2; k++) { const hh = h * rand(0.75, 1); b.add(G.sphLow, VC.solid, x + s * rand(-0.2, 0.3), hh / 2, -z + rand(-0.6, 0.6), rand(1.0, 1.6), hh, rand(1.2, 1.8), 0, rand(0, 3), 0, shade(g, rand(0.9, 1.12))); }
      for (let k = 0; k < 5; k++) b.box(VC.solid, fl, x - s * rand(0.1, 0.35), rand(0.5, h * 0.6), -z + rand(-0.5, 0.5), 0.2, 0.16, 0.2);
    }
  };
  // one side's carriageway: the lanes over the track's side strip, the barrier, the lines and dots, the wall, the lamps, the traffic
  const carriageway = (b, s, { jam, wall = true, z0 = 0, z1 = CHUNK_LEN } = {}) => {
    const L = z1 - z0, zc = -(z0 + z1) / 2;
    K.road(b, s * (EDGE + WALL - 0.2) / 2, zc, WALL - 0.2 - EDGE, L, 0.034);
    b.box(VC.solid, '#a8a49c', s * (EDGE + KR - 0.3) / 2, 0.05, zc, KR - 0.3 - EDGE, 0.06, L);
    b.addM(KRAIL, VC.solid, new THREE.Matrix4().makeScale(1, 1, L / CHUNK_LEN).setPosition(s * KR, 0, -z0), '#bcb8b0');
    for (let z = z0 + 6; z < z1; z += 12) b.box(VC.glow, hdr('#ffd890', 1.3), s * KR, 0.86, -z, 0.08, 0.04, 0.14);
    b.box(VC.solid, '#e8c030', s * (KR + 0.48), 0.042, zc, 0.12, 0.01, L); b.box(VC.solid, '#f4f2ec', s * 15.95, 0.042, zc, 0.13, 0.01, L);
    for (const x of [8.75, 12.35]) b.add(dotsGeo, dotsMat, s * x, 0.045, zc, 0.16, L, 1, -Math.PI / 2, 0, 0);
    if (wall) soundWall(b, s, z0, z1);
    for (let z = z0 + rand(6, 30); z < z1 - 2; z += 40) freewayLamp(b, s, -z);
    traffic(b, s, { jam, z0, z1 });
  };
  // a sign bridge over side s's lanes: its posts, the truss, two signs (their backs to us on the left), the lamps under them
  const gantry = (b, s, z) => {
    const x0 = s * KR, x1 = s * 18.5, col = '#9aa0a6', y0 = 7.4, y1 = 8.5;
    for (const x of [x0, x1]) { b.cyl(VC.metal, col, x, y1 / 2, z, 0.2, y1, 'cyl8'); b.box(VC.solid, '#a8a49c', x, 0.45, z, 0.8, 0.9, 0.8); for (const y of [y0, y1]) b.box(VC.metal, col, x, y, z, 0.36, 0.3, 1.1); }   // its posts, the plates the truss is bolted to
    for (const y of [y0, y1]) for (const dz of [-0.45, 0.45]) beam(b, VC.metal, x0, y, z + dz, x1, y, z + dz, 0.09, col);
    for (let k = 0; k <= 8; k++) {
      const x = x0 + ((x1 - x0) * k) / 8, xn = x0 + ((x1 - x0) * (k + 1)) / 8;
      for (const dz of [-0.45, 0.45]) { beam(b, VC.metal, x, y0, z + dz, x, y1, z + dz, 0.05, col); if (k < 8) beam(b, VC.metal, x, y0, z + dz, xn, y1, z + dz, 0.04, col); }
    }
    const f = s > 0 ? 1 : -1, picks = [randi(0, SIGNS.length - 1)]; picks.push((picks[0] + randi(1, SIGNS.length - 1)) % SIGNS.length);
    [s * 8.4, s * 14.1].forEach((x, j) => {
      b.box(VC.metal, '#7a7e84', x, y0 - 0.35, z + f * 0.55, 5.6, 2.9, 0.08);   // its back
      b.add(signGeo[picks[j]], signMat, x, y0 - 0.35, z + f * 0.6, 5.5, 2.75, 1, 0, sideOn(s), 0);
      for (let k = -1; k <= 1; k++) { b.box(VC.metal, '#3a3a3e', x + k * 1.8, y0 - 1.95, z + f * 0.82, 0.4, 0.14, 0.44); b.box(VC.glow, hdr('#f4f8ff', 2), x + k * 1.8, y0 - 1.87, z + f * 0.86, 0.32, 0.02, 0.3); }
      beam(b, VC.metal, x - 2.6, y0 - 1.95, z + f * 0.62, x + 2.6, y0 - 1.95, z + f * 0.62, 0.06, '#5a5e64');
    });
  };
  // an overcrossing high over it all: the box girder on its bents, the barriers and the curved screening fence on top, its
  // lamps and traffic, a sign hung under its face over the right's lanes; far out either side it comes down to the ground
  const overpass = (b, zc) => {
    const W = 12, D = 1.6, yt = DECK + D, c = '#c8c4bc', X = 60;
    b.box(VC.solid, c, 0, DECK + D / 2, zc, 2 * X, D, W); b.box(VC.solid, shade(c, 0.78), 0, DECK + 0.1, zc, 2 * X, 0.2, W + 0.24);
    for (const s of [-1, 1]) {
      const a = Math.atan2(yt - D / 2, 34), L = Math.hypot(34, yt - D / 2);
      b.add(G.box, VC.solid, s * (X + 17), (yt - D / 2) / 2, zc, L, D, W, 0, 0, -s * a, c);
      for (const bx of [KR, 18.2, 32, 46]) { b.cyl(VC.solid, c, s * bx, DECK / 2 - 0.1, zc, 0.5, DECK + 0.2, 'cyl'); b.box(VC.solid, shade(c, 0.92), s * bx, DECK - 0.4, zc, 1.5, 0.8, W - 1.2); }
    }
    for (const e of [-1, 1]) {
      const ze = zc + e * (W / 2 - 0.25);
      b.box(VC.solid, c, 0, yt + 0.45, ze, 2 * X, 0.9, 0.5);
      b.add(K.tiledPlane(2 * X, 2.0, 0.6), K.linkMat, 0, yt + 1.9, ze, 2 * X, 2.0, 1, 0, 0, 0);
      b.add(K.tiledPlane(2 * X, 1.0, 0.6), K.linkMat, 0, yt + 3.2, ze - e * 0.3, 2 * X, 1.0, 1, -e * 0.6, 0, 0);
      for (let x = -X + 1.5; x < X; x += 3) { b.box(VC.metal, '#8a8e94', x, yt + 1.9, ze, 0.05, 2.0, 0.05); beam(b, VC.metal, x, yt + 2.9, ze, x, yt + 3.65, ze - e * 0.55, 0.05, '#8a8e94'); }
      for (let x = -X + 8 + (e > 0 ? 0 : 12); x < X; x += 24) {   // its lamps
        b.cyl(VC.metal, '#8a8e94', x, yt + 4.4, ze, 0.08, 7.0, 'cyl8'); beam(b, VC.metal, x, yt + 7.8, ze, x, yt + 8.0, ze - e * 1.8, 0.07, '#8a8e94');
        b.box(VC.glow, hdr('#ffe2b0', 2.2), x, yt + 7.9, ze - e * 1.9, 0.3, 0.06, 0.6);
      }
    }
    for (let k = randi(2, 4); k > 0; k--) {   // the traffic across it
      const e = pick([-1, 1]), x = rand(-X + 6, X - 6);
      K.place(b, (t) => K.car(t, 0, 0, 1, { lit: true }), new THREE.Matrix4().makeRotationY(e > 0 ? Math.PI / 2 : -Math.PI / 2).setPosition(x, yt, zc + e * 1.8));
    }
    if (chance(0.5)) K.person(b, rand(-30, 30), zc + W / 2 - 0.9, { y: yt, ry: pick([Math.PI / 2, -Math.PI / 2]) });
    const i = randi(0, SIGNS.length - 1);   // a sign under its face, over the right's lanes
    for (const dx of [-1.6, 1.6]) b.box(VC.metal, '#7a7e84', 11 + dx, DECK - 0.3, zc + W / 2 + 0.25, 0.1, 0.8, 0.1);
    b.box(VC.metal, '#7a7e84', 11, DECK - 2.05, zc + W / 2 + 0.25, 5.6, 2.9, 0.08); b.add(signGeo[i], signMat, 11, DECK - 2.05, zc + W / 2 + 0.31, 5.5, 2.75, 1, 0, 0, 0);
  };
  const callBox = (b, s, z) => {   // the yellow call box on the shoulder, its number
    b.cyl(VC.metal, '#8a8e94', s * 18.1, 0.85, z, 0.05, 1.7, 'cyl6'); b.box(VC.solid, '#e8c020', s * 18.1, 1.55, z, 0.42, 0.6, 0.32);
    K.sign(b, 'CALL BOX 110-34', { w: 512, h: 128, color: '#141414', bg: '#e8c020', font: SANS, weight: 700, size: 0.5, k: 0.9 }, s * 18.1, 2.05, z, 0.8, 0.2, 1, 0, face(s), 0);
  };
  const pulledOver = (b) => {   // the Highway Patrol behind a car on the right shoulder, the officer at its window
    const z = -rand(14, 60);
    K.car(b, 17.3, z, 1, { lit: true }); K.car(b, 17.3, z + 7.5, 1, { kind: 'police', lit: true });
    K.person(b, 16.2, z + 1.2, { top: '#a89a6a', legs: '#4a4030', hat: 'none', shades: true, ry: -Math.PI / 2 });
  };
  // beyond one wall: the palms over it, the backs of the apartments, a billboard turned to the traffic
  const beyond = (b, s, zo) => {   // (clear of an overcrossing at zo)
    const clear = (z, r) => zo === null || Math.abs(-z - zo) > r;
    for (let z = rand(2, 8); z < CHUNK_LEN - 3; z += rand(15, 21)) if (clear(z, 9)) K.fanPalm(b, s * rand(22, 30), -z, rand(1.0, 1.25));
    for (let z = rand(0, 4); z < CHUNK_LEN - 8;) {
      const L = Math.min(rand(12, 20), CHUNK_LEN - z), h = rand(6.5, 9.5), x = s * rand(26, 31), col = pick([...STUCCO, ...PASTEL]);
      if (!clear(z + L / 2, L / 2 + 7)) { z += 3; continue; }
      b.addM(K.tiledBox(10, h, L, 2.5), K.stuccoMat, T(x, h / 2, -(z + L / 2)), col);
      b.box(VC.solid, shade(col, 0.85), x, h + 0.15, -(z + L / 2), 10.2, 0.3, L + 0.2);
      for (let zz = z + 1.6; zz < z + L - 1; zz += 3) b.box(VC.glow, K.glass(0.5, true), x - s * 5.02, h - 1.8, -zz, 0.04, 1.2, 1.6);
      z += L + rand(2, 6);
    }
    const bz = rand(16, 64); if (chance(0.5) && clear(bz, 12)) K.billboard(b, s * rand(26, 33), -bz, s, { y: rand(12, 15), w: 12, ry: -s * 0.55 });
  };
  // the Baldwin Hills behind one wall: bare slopes, dirt roads across them, the pumpjacks on their pads, a tank
  const baldwin = (b, s) => {
    const x0 = 21.5, x1 = 86, y1 = 30, hAt = (x) => ((x - x0) / (x1 - x0)) * y1, col = '#8a7a58', a = Math.atan2(y1, x1 - x0);
    if (s > 0) quad(b, VC.solid, x0, 0, x1, y1, 0, -CHUNK_LEN, { col }); else quad(b, VC.solid, -x1, y1, -x0, 0, 0, -CHUNK_LEN, { col });
    b.block(VC.solid, col, s * (x1 + 25), 0, -CHUNK_LEN / 2, 50, y1, CHUNK_LEN);
    for (const x of [34, 58]) b.add(G.box, VC.solid, s * x, hAt(x) + 0.05, -CHUNK_LEN / 2, 4.5 / Math.cos(a), 0.12, CHUNK_LEN, 0, 0, s * a, '#a8987a');   // the dirt roads
    for (let k = 0; k < 40; k++) { const x = rand(x0 + 1, x1 - 1); b.add(G.sphLow, VC.solid, s * x, hAt(x) + 0.2, -rand(1, 79), rand(0.8, 2.2), rand(0.5, 1.0), rand(0.8, 2.2), 0, rand(0, 3), 0, pick(['#5a5a38', '#6a6a44', '#7a7048', '#4e5232'])); }
    const taken = [];
    for (let k = 0; k < 14 && taken.length < 5; k++) {
      const x = rand(28, 74), z = -rand(9, 71);
      if (taken.some(([tx, tz]) => Math.abs(tx - x) < 8 && Math.abs(tz - z) < 14) || [34, 58].some((r) => Math.abs(r - x) < 4.5)) continue;
      taken.push([x, z]);
      const y = hAt(x);
      b.add(G.box, VC.solid, s * x, y, z, 4.4, 2.6, 12.5, 0, 0, 0, '#9a8a66');
      if (taken.length === 3) { b.cyl(VC.solid, '#e8e4dc', s * x, y + 1.3 + 2, z, 2.0, 4, 'cyl'); continue; }
      K.pumpjack(b, s * x, z, (chance(0.5) ? 0 : Math.PI) + rand(-0.15, 0.15), { y: y + 1.3, s: rand(0.9, 1.2) });
    }
  };
  const freeway = (b, zone) => {
    const hill = zone === 'south' && chance(0.5) ? pick([-1, 1]) : 0, zo = chance(0.45) ? -rand(28, 56) : null;
    for (const s of [-1, 1]) { farGround(b, s, '#7a6e58'); carriageway(b, s); if (hill === s) baldwin(b, s); else beyond(b, s, zo); }
    if (zo !== null) overpass(b, zo);
    for (const s of [-1, 1]) {
      if (!chance(0.55)) continue;
      let z = -rand(12, 68);
      if (zo !== null && Math.abs(z - zo) < 15) z = zo + (z > zo ? 16 : -16);
      if (z < -76 || z > -4) continue;
      gantry(b, s, z);
    }
    if (chance(0.5)) callBox(b, pick([-1, 1]), -rand(6, 74));
    if (chance(0.15)) pulledOver(b);
    if (zo !== null && chance(0.5)) for (const s of [-1, 1]) K.mural(b, s * (WALL - 0.24), 2.6, zo + rand(-6, 6), s, 10, 4.2);   // the murals painted on the walls by the overcrossing
  };

  // ---------- the studio's pieces ----------
  const golfCart = (b, x, z, ry) => {   // white, its canopy on four posts, a case strapped on the back
    const F = frame(b, x, 0, z, 1, ry), c = pick(['#f4f4f0', '#e8e8e4', '#e8e4dc']);
    F.box(VC.solid, c, 0, 0.55, 0, 1.2, 0.5, 2.4); F.box(VC.solid, '#2a2a2e', 0, 0.86, 0.15, 1.1, 0.12, 0.62); F.box(VC.solid, '#2a2a2e', 0, 1.2, 0.48, 1.1, 0.55, 0.1);
    for (const [e, f] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { F.cyl(VC.metal, '#c8ccd2', e * 0.52, 1.5, f * 0.78, 0.025, 1.3, 'cyl6'); F.add(G.cyl8, VC.solid, e * 0.55, 0.22, f * 0.8, 0.44, 0.18, 0.44, 0, 0, Math.PI / 2, '#141414'); }
    F.box(VC.solid, c, 0, 2.18, 0, 1.3, 0.06, 1.9); F.box(VC.glow, hdr('#3a4a5e', 0.6), 0, 1.6, -0.8, 1.1, 0.7, 0.02);
    F.box(VC.solid, pick(['#2a2a2e', '#3a3a40', '#5a4a3a']), 0, 1.0, 1.0, 0.9, 0.5, 0.5);
  };
  // a Fresnel on its stand turned on the set: the legs and their sandbag, the mast, the head with its lens lit, the barn doors
  const lightStand = (b, x, z, ry, { h = rand(3.4, 5.2), big = chance(0.4) } = {}) => {
    const F = frame(b, x, 0, z, 1, ry), k = big ? 1.4 : 1;
    for (let j = 0; j < 3; j++) { const a = (j / 3) * Math.PI * 2; F.beam(VC.metal, '#3a3a3e', [Math.cos(a) * 0.7, 0.02, Math.sin(a) * 0.7], [0, 0.9, 0], 0.04); }
    F.add(G.sphLow, VC.solid, 0.5, 0.12, 0.3, 0.45, 0.22, 0.3, 0, 0.6, 0, '#5a4a3a');
    F.cyl(VC.metal, '#5a5a5e', 0, h / 2, 0, 0.04, h, 'cyl6');
    F.box(VC.solid, '#1a1a1e', 0, h + 0.3 * k, 0.05, 0.75 * k, 0.7 * k, 0.85 * k);
    F.add(G.cyl, VC.glow, 0, h + 0.3 * k, -0.4 * k, 0.56 * k, 0.04, 0.56 * k, Math.PI / 2, 0, 0, hdr('#fff2dc', 4));
    for (const [dx, dy, rz] of [[0, 0.42, 0], [0, -0.42, 0], [0.42, 0, Math.PI / 2], [-0.42, 0, Math.PI / 2]]) F.add(G.box, VC.solid, dx * k, h + 0.3 * k + dy * k, -0.62 * k, 0.7 * k, 0.03, 0.4 * k, dy > 0 ? -0.5 : dy < 0 ? 0.5 : 0, 0, rz + (dx > 0 ? 0.5 : dx < 0 ? -0.5 : 0), '#1a1a1e');
    const p = F.at(0, 0, -6); K.pool(b, p.x, p.z, 6, 6, hdr('#fff0dc', 0.22));
  };
  const balloon = (b, x, z) => {   // a balloon light floating over the set on its mast, its lines down to the ground
    const h = rand(8, 10);
    b.cyl(VC.metal, '#5a5a5e', x, (h - 1) / 2, z, 0.06, h - 1, 'cyl6'); b.add(G.sph, VC.glow, x, h, z, 2.6, 1.9, 2.6, 0, 0, 0, hdr('#fff6ec', 1.35));
    for (const a of [0.4, 2.5, 4.6]) beam(b, VC.solid, x, h - 0.6, z, x + Math.cos(a) * 3, 0, z + Math.sin(a) * 3, 0.01, '#1a1a1a');
    K.pool(b, x, z, 12, 12, hdr('#fff0dc', 0.2));
  };
  // the Technocrane: its base on wheels, the arm reaching out over the set, the weights at the back, the camera on its head
  const crane = (b, x, z, ry) => {
    const F = frame(b, x, 0, z, 1, ry);
    F.box(VC.solid, '#2a2a2e', 0, 0.5, 0, 1.3, 0.5, 2.2); for (const [e, f] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) F.add(G.cyl8, VC.solid, e * 0.7, 0.25, f * 0.85, 0.5, 0.18, 0.5, 0, 0, Math.PI / 2, '#141414');
    F.cyl(VC.metal, '#3a3a3e', 0, 1.2, 0, 0.18, 1.2, 'cyl8');
    F.beam(VC.metal, '#4a4a50', [0, 1.8, 2.4], [0, 4.6, -5.6], 0.22);
    F.box(VC.solid, '#5a5a5e', 0, 1.6, 2.6, 0.6, 0.6, 0.8);
    F.box(VC.solid, '#1a1a1e', 0, 4.3, -5.9, 0.4, 0.4, 0.6); F.add(G.cyl8, VC.solid, 0, 4.3, -6.35, 0.22, 0.4, 0.22, Math.PI / 2, 0, 0, '#141414');
  };
  const chairs = (b, x, z, ry, n = 3) => {   // directors' chairs in a row, a name on each back
    const F = frame(b, x, 0, z, 1, ry);
    for (let k = 0; k < n; k++) {
      const cx = (k - (n - 1) / 2) * 0.75, c = pick(['#1a1a1e', '#2a3a6a', '#7a2a24', '#3a5a3a']);
      for (const e of [-1, 1]) { F.beam(VC.solid, '#2a2420', [cx + e * 0.25, 0, -0.2], [cx + e * 0.25, 1.0, 0.22], 0.03); F.beam(VC.solid, '#2a2420', [cx + e * 0.25, 0, 0.2], [cx + e * 0.25, 1.0, -0.22], 0.03); F.box(VC.solid, '#2a2420', cx + e * 0.25, 1.15, 0.2, 0.03, 0.5, 0.03); }
      F.box(VC.solid, c, cx, 0.62, 0, 0.5, 0.02, 0.42); F.box(VC.solid, c, cx, 1.18, 0.2, 0.5, 0.24, 0.02);
      if (k === 0) { const p = F.at(cx, 0, 0); K.person(b, p.x, p.z, { seated: true, y: 0.15, ry, hat: 'cap', top: '#1a1a1e' }); }
    }
  };
  const village = (b, x, z, ry) => {   // video village: a pop-up tent, the monitors on their cart, the people watching them
    const F = frame(b, x, 0, z, 1, ry);
    for (const [e, f] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) F.cyl(VC.metal, '#c8ccd2', e * 1.4, 1.2, f * 1.4, 0.03, 2.4, 'cyl6');
    F.add(G.cone4, VC.solid, 0, 2.75, 0, 4.1, 0.7, 4.1, 0, Math.PI / 4, 0, '#2a2a2e');
    F.box(VC.solid, '#3a3a3e', 0, 0.6, -0.6, 1.6, 1.1, 0.6);
    for (const e of [-0.4, 0.4]) F.box(VC.glow, hdr('#a8c8ff', 1.4), e, 1.45, -0.62, 0.7, 0.45, 0.04);
    for (const e of [-0.6, 0.6]) { const p = F.at(e, 0, 0.6); K.person(b, p.x, p.z, { seated: true, y: 0.1, ry, top: '#1a1a1e', phone: false }); }
  };
  const honeywagon = (b, x, z, s) => {   // the trailer of dressing rooms: its doors and steps, the units on its roof
    b.block(VC.solid, '#f4f2ec', x, 0.6, z, 2.6, 3.0, 11); b.box(VC.solid, '#3a3a3e', x, 0.35, z, 2.2, 0.4, 10);
    for (let k = 0; k < 3; k++) { const zz = z - 3.6 + k * 3.6; b.box(VC.solid, '#5a6a7a', x - s * 1.31, 1.9, zz, 0.04, 2.0, 0.8); b.block(VC.solid, '#8a8e94', x - s * 1.6, 0, zz, 0.6, 0.55, 0.9); b.box(VC.glow, hdr('#ffe8c0', 1.4), x - s * 1.32, 3.1, zz + 0.7, 0.04, 0.18, 0.26); }
    for (const zz of [-3, 2.5]) b.block(VC.metal, '#b8bcc4', x, 3.6, z + zz, 1.4, 0.5, 1.6);
    K.sign(b, 'CAST', { w: 256, h: 96, color: '#141414', bg: '#f4f2ec', font: SANS, weight: 700, size: 0.6, k: 0.9 }, x - s * 1.32, 2.6, z - 5.0, 0.8, 0.3, 1, 0, face(s), 0);
  };
  const gripTruck = (b, x, z, s) => {   // a white box truck, GRIP & ELECTRIC on its side, its lift gate down
    b.block(VC.solid, '#f4f4f0', x, 0.9, z, 2.5, 3.0, 7.2); b.block(VC.solid, '#f4f4f0', x, 0.5, z - 4.6, 2.4, 2.2, 2.0);
    b.box(VC.glow, hdr('#2e3a4e', 0.9), x, 2.1, z - 5.62, 2.1, 0.8, 0.04); for (const zz of [-4.4, 1.0, 2.6]) for (const e of [-1, 1]) b.cyl(VC.solid, '#141414', x + e * 1.0, 0.48, z + zz, 0.48, 0.4, 'cyl8', 0, Math.PI / 2);
    K.sign(b, 'GRIP & ELECTRIC', { w: 768, h: 96, color: '#141414', font: SANS, weight: 700, size: 0.55, k: 0.85 }, x - s * 1.27, 2.9, z, 5.2, 0.7, 1, 0, face(s), 0);
    b.box(VC.metal, '#9a9ea4', x, 0.15, z + 4.1, 2.3, 0.08, 1.4);
  };
  const rack = (b, x, z, ry) => {   // a wardrobe rack: the frame on castors, the costumes hanging from it
    const F = frame(b, x, 0, z, 1, ry);
    for (const e of [-1, 1]) F.box(VC.metal, '#8a8e94', e * 0.8, 0.9, 0, 0.04, 1.8, 0.04); F.box(VC.metal, '#8a8e94', 0, 1.78, 0, 1.64, 0.04, 0.04);
    for (let k = 0; k < 12; k++) F.box(VC.solid, pick(['#7a2a24', '#2a3a6a', '#e8dcc0', '#3a5a3a', '#1a1a1e', '#c8a050', '#8a5a9a']), -0.7 + k * 0.127, 1.2, 0, 0.1, 1.1, 0.5);
  };
  const tent = (b, x, z, ry, label) => {   // craft service: a pop-up, the table of food under it
    const F = frame(b, x, 0, z, 1, ry);
    for (const [e, f] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) F.cyl(VC.metal, '#c8ccd2', e * 1.4, 1.2, f * 1.4, 0.03, 2.4, 'cyl6');
    F.add(G.cone4, VC.solid, 0, 2.75, 0, 4.1, 0.7, 4.1, 0, Math.PI / 4, 0, '#f4f0e8');
    F.box(VC.solid, '#f4f4f0', 0, 0.75, 0, 2.2, 0.06, 0.8); for (const e of [-1, 1]) F.box(VC.metal, '#8a8e94', e * 1.0, 0.37, 0, 0.04, 0.74, 0.7);
    for (let k = 0; k < 8; k++) F.add(pick([G.cyl8, G.box, G.sphLow]), VC.solid, rand(-0.9, 0.9), 0.85, rand(-0.25, 0.25), 0.18, rand(0.1, 0.25), 0.18, 0, 0, 0, pick(['#ffd23d', '#e8302a', '#7cd84a', '#c8803a', '#f4f0e8', '#2a6ad8']));
    K.sign(F, label, { w: 512, h: 96, color: '#141414', bg: '#ffd23d', font: SANS, weight: 700, size: 0.55, k: 0.9 }, 0, 2.2, 1.42, 1.8, 0.34, 1);
  };
  // a sound stage of side s from z0, L along the street, H tall: its number, the elephant door and its lamp, a door and a
  // stair, the duct along its top, the units on its roof
  const stage = (b, s, z0, L, H, num) => {
    const zc = -(z0 + L / 2), col = pick(STAGE), F = frame(b, s * SX, 0, zc, 1, face(s));
    b.addM(K.tiledBox(34, H, L, 2.5), K.stuccoMat, T(s * (SX + 17), H / 2, zc), col);
    F.box(VC.solid, shade(col, 0.8), 0, 0.5, 0.03, L, 1.0, 0.06); F.box(VC.solid, shade(col, 0.9), 0, H + 0.1, 0.1, L + 0.2, 0.25, 0.4);
    for (let x = -L / 2; x <= L / 2 + 0.01; x += L / Math.max(2, Math.round(L / 10))) F.box(VC.solid, shade(col, 1.05), x, H / 2, 0.15, 0.8, H, 0.3);   // the pilasters
    const d = pick([-1, 1]), ed = d * (L / 2 - 10.3);   // the big door toward one end (the lamp, a door beyond it), the stair toward the other
    K.sign(F, `STAGE ${num}`, { w: 512, h: 128, color: '#7a2424', font: SANS, weight: 700, size: 0.72, k: 0.85 }, -d * L * 0.22, H - 3.2, 0.07, 8.5, 2.1, 1);
    F.box(VC.solid, '#5a5650', ed, 5.3, 0.05, 9.8, 10.6, 0.08);   // the elephant door: its opening, the two leaves, their ribs, the track over them
    for (const e of [-1, 1]) F.box(VC.solid, '#a8a8a0', ed + e * 2.35, 5.05, 0.12, 4.6, 10.1, 0.12);
    for (let y = 0.6; y < 10; y += 0.62) F.box(VC.solid, '#8a8a84', ed, y, 0.2, 9.3, 0.07, 0.04);
    F.box(VC.metal, '#5a5a5e', ed, 10.55, 0.25, 19.6, 0.25, 0.25);
    const lx = ed + d * 5.9, pd = ed + d * 8.1;
    F.box(VC.solid, '#2a2a2e', lx, 9.4, 0.2, 0.7, 0.7, 0.35); F.box(K.blinkRed, 0xffffff, lx, 9.4, 0.39, 0.5, 0.5, 0.04);   // the red lamp
    K.sign(F, 'WHEN RED LIGHT IS FLASHING · DO NOT ENTER', { w: 768, h: 80, color: '#f4f0e8', bg: '#8a2020', font: SANS, weight: 700, size: 0.5, k: 0.9 }, lx, 8.5, 0.07, 3.0, 0.3, 1);
    F.box(VC.solid, '#3a4a5a', pd, 1.15, 0.06, 1.1, 2.3, 0.08); F.box(VC.solid, '#5a5650', pd, 2.6, 0.6, 1.8, 0.1, 1.2); F.box(VC.glow, hdr('#ffe0b0', 1.8), pd, 2.5, 0.2, 0.3, 0.14, 0.1); F.box(VC.solid, '#a8a49c', pd, 0.1, 0.5, 1.8, 0.2, 1.0);   // a door, its canopy and lamp, the steps
    if (L > 27) {   // the stair up to the catwalk door: two flights climbing toward the middle, the landings, the rails
      const s0 = -d * (L / 2 - 1.5), u = d;
      F.span(G.box, VC.metal, '#6a6e74', [s0, 0.1, 0.9], [s0 + 4 * u, 3.6, 0.9], 0.14, 1.0); F.box(VC.metal, '#6a6e74', s0 + 4.6 * u, 3.6, 0.9, 1.3, 0.1, 1.2);
      F.span(G.box, VC.metal, '#6a6e74', [s0 + 5.2 * u, 3.6, 0.9], [s0 + 9.2 * u, 7.1, 0.9], 0.14, 1.0); F.box(VC.metal, '#6a6e74', s0 + 9.8 * u, 7.1, 0.9, 1.3, 0.1, 1.2);
      for (const [a, c] of [[[s0, 1.1, 1.4], [s0 + 4 * u, 4.6, 1.4]], [[s0 + 5.2 * u, 4.6, 1.4], [s0 + 9.2 * u, 8.1, 1.4]]]) F.beam(VC.metal, '#6a6e74', a, c, 0.05);
      F.box(VC.solid, '#3a4a5a', s0 + 9.8 * u, 8.25, 0.06, 1.0, 2.2, 0.08);
    }
    F.box(VC.metal, '#b8bcc4', 0, H - 1.7, 0.85, L - 4, 1.1, 1.1); F.box(VC.metal, '#b8bcc4', -d * (L / 2 - 0.6), (H - 1.7) / 2, 0.85, 1.1, H - 1.7, 1.1);   // the duct, its riser
    for (let k = 0; k < 3; k++) b.block(VC.metal, '#9a9ea4', s * rand(SX + 5, SX + 29), H, zc + rand(-L / 3, L / 3), rand(2.4, 3.6), 1.6, rand(1.8, 2.6));
  };
  const waterTower = (b, x, z, s, name) => {   // the studio's water tower on its legs, its name round the tank
    const Ht = rand(19, 22), r = 4.2, hT = 6.2, col = '#8a9298', tank = pick(['#c8ccd0', '#e8e4dc', '#b8c4c8']);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) beam(b, VC.metal, x + dx * 4.8, 0, z + dz * 4.8, x + dx * 3.0, Ht, z + dz * 3.0, 0.34, col);
    for (const f of [0.33, 0.66]) { const y = Ht * f, w = 4.8 - 1.8 * f; for (const [a, c] of [[[-w, -w], [w, -w]], [[w, -w], [w, w]], [[w, w], [-w, w]], [[-w, w], [-w, -w]]]) beam(b, VC.metal, x + a[0], y, z + a[1], x + c[0], y, z + c[1], 0.12, col); }
    for (const [a, c] of [[[-4.8, -4.8], [3.6, 3.6]], [[4.8, -4.8], [-3.6, 3.6]]]) beam(b, VC.metal, x + a[0], 0.2, z + a[1], x + c[0], Ht * 0.66, z + c[1], 0.06, col);
    b.cyl(VC.solid, tank, x, Ht + hT / 2, z, r, hT, 'cyl'); b.add(G.cone, VC.solid, x, Ht + hT + 1.1, z, 2 * r + 0.3, 2.2, 2 * r + 0.3, 0, 0, 0, shade(tank, 0.88));
    b.cyl(VC.metal, col, x, Ht - 0.05, z, r + 0.7, 0.12, 'cyl'); b.add(RING, VC.metal, x, Ht + 1.0, z, r + 0.7, r + 0.7, r + 0.7, Math.PI / 2, 0, 0, col);
    b.cyl(VC.metal, col, x, Ht + hT + 2.6, z, 0.06, 1.2, 'cyl6');
    K.curvedSign(b, name, { w: 768, h: 128, color: '#2a3a6a', font: DECO, size: 0.62, k: 0.95 }, x, Ht + hT / 2, z, r + 0.04, 1.5, 2.2, s > 0 ? -Math.PI / 2 : Math.PI / 2);
  };
  // a false front on the western street (it faces the track from side s): the front, its stepped top and cornice, the sign,
  // the boardwalk under its porch roof, the hitching rail; the braces holding it up from behind, and nothing else behind it
  const westFront = (b, s, z0, w, name) => {
    const zc = -(z0 + w / 2), F = frame(b, s * 13, 0, zc, 1, face(s)), H = rand(6.5, 9), col = pick(['#8a5a3a', '#b8a080', '#6a4a3a', '#c8b898', '#7a3a2a', '#9a8a6a', '#5a6a6a']), wood = '#6a5038';
    F.box(VC.solid, col, 0, H / 2, 0, w, H, 0.2);
    if (chance(0.5)) F.box(VC.solid, col, 0, H + 0.6, 0, w * 0.5, 1.2, 0.2);
    F.box(VC.solid, shade(col, 0.72), 0, H, 0.12, w + 0.3, 0.25, 0.32);
    K.sign(F, name, { w: 512, h: 96, color: '#3a2414', bg: '#e8d8b8', font: SERIF, weight: 700, size: 0.58, k: 0.9 }, 0, H - 1.6, 0.12, Math.min(w - 1, 6.2), 1.1, 1);
    for (const x of [-w / 4, w / 4]) { F.box(VC.glow, K.glass(0.5, false), x, 4.6, 0.11, 1.1, 1.5, 0.04); for (const e of [-1, 1]) F.box(VC.solid, shade(col, 0.6), x + e * 0.75, 4.6, 0.13, 0.3, 1.6, 0.04); }
    F.box(VC.solid, '#2a1a12', 0, 1.25, 0.11, 1.3, 2.3, 0.04); for (const x of [-w / 2 + 1.4, w / 2 - 1.4]) F.box(VC.glow, K.glass(0.6, false), x, 1.5, 0.11, 1.6, 1.5, 0.04);
    if (name === 'SALOON') for (const e of [-1, 1]) F.box(VC.solid, wood, e * 0.33, 1.1, 0.16, 0.6, 0.9, 0.05);   // the swinging doors
    F.box(VC.solid, wood, 0, 0.32, 1.3, w, 0.12, 2.6);
    for (const x of [-w / 2 + 0.2, 0, w / 2 - 0.2]) F.box(VC.solid, wood, x, 1.85, 2.48, 0.16, 3.1, 0.16);
    F.add(G.box, VC.solid, 0, 3.45, 1.3, w + 0.2, 0.08, 2.9, -0.14, 0, 0, '#5a4430');
    F.box(VC.solid, wood, 0, 0.95, 3.4, w * 0.6, 0.1, 0.1); for (const e of [-1, 1]) F.box(VC.solid, wood, e * w * 0.3, 0.5, 3.4, 0.12, 1.0, 0.12);
    for (const x of [-w / 2 + 0.6, w / 2 - 0.6]) { F.beam(VC.solid, '#8a7458', [x, H * 0.7, -0.15], [x, 0.05, -H * 0.55], 0.16); F.beam(VC.solid, '#8a7458', [x, 0.06, -0.15], [x, 0.06, -H * 0.55], 0.14); F.box(VC.solid, '#8a7458', x, H * 0.45, -0.15, 0.14, H * 0.9, 0.1); }
  };
  const gate = (b, s, name) => {   // the studio's gate by the line: the piers, the name over the way in, the guard's booth, the arm, palms
    for (const x of [6.6, 22]) { b.block(VC.solid, '#f2e8d8', s * x, 0, -4, 1.8, 7.2, 1.8); b.box(VC.solid, '#d8c8b0', s * x, 7.35, -4, 2.1, 0.3, 2.1); }
    b.box(VC.solid, '#2a2228', s * 14.3, 7.6, -4, 14.6, 1.6, 0.8);
    K.sign(b, name, { w: 768, h: 128, color: '#ffd890', font: DECO, size: 0.62, k: 1.5 }, s * 14.3, 7.6, -3.58, 13.4, 1.3, 1);
    b.block(VC.solid, '#e8dcc8', s * 14.3, 0, -8.5, 2.4, 2.6, 2.4); b.box(VC.glow, hdr('#ffe6c0', 1.0), s * 14.3, 1.7, -7.28, 1.9, 0.9, 0.04); b.box(VC.solid, '#c8302a', s * 14.3, 2.7, -8.5, 2.8, 0.2, 2.8);
    b.box(VC.solid, '#e8e4dc', s * 11.2, 1.0, -5.6, 5.4, 0.12, 0.12); b.block(VC.solid, '#e8e4dc', s * 13.8, 0, -5.6, 0.4, 1.15, 0.4); for (let k = 0; k < 5; k++) b.box(VC.solid, '#c8202a', s * (9.0 + k * 1.1), 1.0, -5.6, 0.5, 0.13, 0.13);
    K.person(b, s * 14.3, -7.0, { top: '#2a3a5a', legs: '#1a1a24', hat: 'cap', ry: 0 });
    for (const x of [4.9, 23.8]) K.fanPalm(b, s * x, -2.2, rand(1.0, 1.15));
  };
  const studio = (b) => {
    const s = pick([-1, 1]), name = pick(STUDIOS), withGate = chance(0.35);
    for (const e of [-1, 1]) farGround(b, e, '#8a8478');
    // the stages' side: the lot's lane over the side strip, the apron, two or three stages
    K.road(b, s * (EDGE + SX) / 2, -CHUNK_LEN / 2, SX - EDGE, CHUNK_LEN, 0.034);
    const stages = [];
    for (let z = withGate ? 11 : rand(1, 3); z < CHUNK_LEN - 16;) { const L = Math.min(rand(28, 36), CHUNK_LEN - z - 1); stage(b, s, z, L, rand(15, 19), pick([7, 14, 18, 27])); stages.push([z, z + L]); z += L + rand(4, 6); }
    if (withGate) gate(b, s, name);
    if (chance(0.75)) waterTower(b, s * rand(57, 61), -rand(30, 50), s, name);
    const taken = [];
    const spot = (lo, hi, r) => { for (let k = 0; k < 10; k++) { const z = rand(lo, hi); if (!taken.some((t) => Math.abs(t - z) < r)) { taken.push(z); return z; } } return null; };
    for (let k = randi(2, 4); k > 0; k--) { const z = spot(withGate ? 12 : 4, 76, 3); if (z !== null) golfCart(b, s * rand(7.5, 9.5), -z, chance(0.5) ? 0 : Math.PI); }
    let z = spot(14, 62, 8); if (z !== null) honeywagon(b, s * 13.2, -z, s);
    z = spot(14, 66, 6); if (z !== null) gripTruck(b, s * 9.8, -z, s);
    for (let k = randi(1, 2); k > 0; k--) { z = spot(8, 74, 2); if (z !== null) rack(b, s * rand(14.5, 15.8), -z, Math.PI / 2); }
    z = spot(10, 74, 4); if (z !== null) tent(b, s * 14.2, -z, 0, 'CRAFT SERVICES');
    for (let k = randi(2, 4); k > 0; k--) K.bike(b, s * rand(15.6, 16.4), -rand(6, 74), Math.PI / 2 + rand(-0.2, 0.2));
    K.crowd(b, s * 6, s * 15, 6, 76, randi(6, 10), { top: pick(['#1a1a1e', '#2a2a30', '#3a3a40']), hat: 'cap', bag: false });
    // the western street on the other side: the dirt over the side strip, the false fronts with gaps between, the shoot
    const w = -s;
    b.add(G.plane, VC.solid, w * (EDGE + 30) / 2, 0.034, -CHUNK_LEN / 2, 30 - EDGE, CHUNK_LEN, 1, -Math.PI / 2, 0, 0, '#b89a6a');
    const tank = chance(0.5), end = tank ? 52 : 72, names = [...WEST].sort(() => Math.random() - 0.5);
    for (let z = rand(1, 3), i = 0; z < end - 5; i++) { const ww = Math.min(rand(6, 9.5), end - z); westFront(b, w, z, ww, names[i % names.length]); z += ww + rand(1.6, 3.6); }
    const sz = rand(18, end - 14);   // the shoot: the lights on the set, the camera on its crane or its dolly, the chairs, the monitors, the boom
    for (const dz of [-5, 4]) lightStand(b, w * rand(5.6, 6.6), -(sz + dz), w > 0 ? -Math.PI / 2 - 0.5 * Math.sign(dz) : Math.PI / 2 + 0.5 * Math.sign(dz));
    balloon(b, w * 8.6, -(sz + rand(-2, 2)));
    if (chance(0.5)) crane(b, w * 7.0, -(sz + 9), w > 0 ? -Math.PI / 2 - 0.6 : Math.PI / 2 + 0.6);
    else { for (const e of [-0.3, 0.3]) b.box(VC.metal, '#8a8e94', w * (6.2 + e), 0.06, -(sz + 1), 0.06, 0.06, 9); const p = -(sz + rand(-2, 2)); b.box(VC.solid, '#2a2a2e', w * 6.2, 0.35, p, 0.9, 0.4, 1.3); b.box(VC.solid, '#1a1a1e', w * 6.2, 1.5, p, 0.4, 0.4, 0.6); K.person(b, w * 6.4, p + 0.6, { seated: true, y: 0.3, ry: w > 0 ? -Math.PI / 2 : Math.PI / 2, top: '#1a1a1e', hat: 'cap' }); }
    chairs(b, w * 5.6, -(sz + 13), w > 0 ? -Math.PI / 2 : Math.PI / 2);
    village(b, w * 6.0, -(sz - 11), w > 0 ? -Math.PI / 2 : Math.PI / 2);
    const bx = w * 7.2, bz = -(sz + 2); K.person(b, bx, bz, { top: '#1a1a1e', hat: 'cap', ry: w > 0 ? -Math.PI / 2 : Math.PI / 2 }); beam(b, VC.metal, bx, 1.6, bz, bx + w * 2.2, 3.2, bz - 0.6, 0.03, '#2a2a2e'); b.add(G.sphLow, VC.solid, bx + w * 2.3, 3.1, bz - 0.62, 0.22, 0.22, 0.5, 0, 0, 0, '#5a5a5e');
    for (let k = randi(2, 3); k > 0; k--) K.person(b, w * rand(9.2, 10.4), -(sz + rand(-3, 3)), { costume: 'cowboy', ry: w > 0 ? Math.PI / 2 : -Math.PI / 2 });
    b.box(VC.solid, '#f4f4f0', w * 7.4, 1.6, -(sz - 4.5), 0.02, 1.4, 1.4); b.cyl(VC.metal, '#5a5a5e', w * 7.4, 0.5, -(sz - 4.5), 0.03, 1.0, 'cyl6');   // a bounce board
    K.crowd(b, w * 5, w * 8, 4, end, randi(4, 7), { top: '#1a1a1e', bag: false });
    if (tank) {   // the painted sky at the end, its scaffold behind it, the shallow tank in front
      b.add(G.plane, skyMat, w * 26, 8.4, -77, 30, 16, 1, 0, 0, 0);
      b.box(VC.solid, '#c8c4bc', w * 26, 0.2, -77.3, 30.4, 0.4, 0.4);
      for (let x = 12; x <= 40; x += 4) { beam(b, VC.metal, w * x, 0, -78, w * x, 16.4, -77.4, 0.12, '#6a6e74'); beam(b, VC.metal, w * x, 0, -80, w * x, 12, -77.6, 0.08, '#6a6e74'); }
      b.box(VC.solid, '#b8b4ac', w * 26, 0.25, -66, 28, 0.5, 18.4); b.add(G.plane, K.water, w * 26, 0.52, -66, 27, 17.4, 1, -Math.PI / 2, 0, 0, 0xffffff);
    }
  };

  return { freeway, studio, carriageway };
}
