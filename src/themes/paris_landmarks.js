// Paris landmark scenes at the blue hour: the Seine's quays under Notre-Dame, running right beneath the Eiffel Tower across
// the Champ de Mars, the Champs-Élysées and the Arc de Triomphe with the great flag hanging in its vault, the Louvre's
// glass pyramid, Sacré-Cœur on the butte above the Moulin Rouge's turning sails, the Pont Alexandre III between its
// gilded Pegasus pylons with the dome of the Invalides beyond, and the Opéra Garnier.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, foliageMat, rand, randi, pick, chance } from '../core.js';
import { at, EDGE, farGround, textTex } from './common.js';
import { beam } from './tokyo_kit.js';
import { SERIF, IRON, GREEN, WY, eiffel, sparkles, beacon, latticeTexture, sparkleOn } from './paris_kit.js';

const STONE = '#d8c8a4';
// the height of the surface of a scaled low-poly mesh (a hill) under (x, z): things standing on it sit on its facets,
// which lie below the smooth shape the mesh approximates
const _ray = new THREE.Raycaster(), _down = new THREE.Vector3(0, -1, 0), _from = new THREE.Vector3();
function surfaceY(mesh, x, z, fallback) { _ray.set(_from.set(x, 1000, z), _down); const h = _ray.intersectObject(mesh, false)[0]; return h ? h.point.y : fallback; }
const pointed = (g, x, y, w, h) => {   // a Gothic pointed arch from its springing line down to the bottom
  g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w * 0.55);
  g.quadraticCurveTo(x, y, x + w / 2, y - w * 0.15); g.quadraticCurveTo(x + w, y, x + w, y + w * 0.55);
  g.lineTo(x + w, y + h); g.closePath();
};
const joints = (g, w, h, step = 8) => {
  g.strokeStyle = 'rgba(90,70,40,0.22)'; g.lineWidth = 1;
  for (let y = 0, r = 0; y < h; y += step, r++) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke(); for (let x = (r % 2) * step; x < w; x += step * 2) { g.beginPath(); g.moveTo(x + 0.5, y); g.lineTo(x + 0.5, y + step); g.stroke(); } }
};
// Notre-Dame's west front up to the towers: three portals, the gallery of kings, the rose between pairs of lancets, the
// open gallery
function ndFrontTex() {
  return canvasTex(256, 272, (g, w, h) => {
    g.fillStyle = '#e2d2aa'; g.fillRect(0, 0, w, h); joints(g, w, h);
    for (const x of [0, 82, 174, 248]) { g.fillStyle = 'rgba(255,248,220,0.5)'; g.fillRect(x, 0, 8, h); }   // the buttresses
    // the open gallery at the top
    g.fillStyle = '#2a2018'; for (let x = 10; x < w - 10; x += 12) { pointed(g, x, 10, 8, 34); g.fill(); }
    g.fillStyle = '#f0e4c4'; g.fillRect(0, 46, w, 6);
    // the rose window, its tracery over jewelled glass, a pair of lancets each side
    const cx = w / 2, cy = 104, R = 40;
    const gr = g.createRadialGradient(cx, cy, 4, cx, cy, R);
    gr.addColorStop(0, '#ffe08a'); gr.addColorStop(0.35, '#d84a6a'); gr.addColorStop(0.7, '#3a5ad8'); gr.addColorStop(1, '#6a2a9a');
    g.fillStyle = '#efe2c0'; g.beginPath(); g.arc(cx, cy, R + 5, 0, 7); g.fill();
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.strokeStyle = '#efe2c0'; g.lineWidth = 2;
    for (const r of [12, 26]) { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); }
    for (const x of [18, 50, 178, 210]) { g.fillStyle = '#3a3050'; pointed(g, x, 70, 26, 70); g.fill(); g.strokeStyle = '#efe2c0'; g.beginPath(); g.moveTo(x + 13, 72); g.lineTo(x + 13, 140); g.stroke(); }
    // the gallery of kings: a row of niches, each with its statue
    g.fillStyle = '#f0e4c4'; g.fillRect(0, 150, w, 4); g.fillRect(0, 180, w, 4);
    for (let x = 4; x < w - 6; x += 9) { g.fillStyle = '#3a2e22'; pointed(g, x, 158, 7, 22); g.fill(); g.fillStyle = '#c8b890'; g.fillRect(x + 2, 164, 3, 14); g.beginPath(); g.arc(x + 3.5, 163, 2, 0, 7); g.fill(); }
    // the three portals: deep archivolts round the lit doors
    for (const [x, pw] of [[14, 58], [92, 72], [184, 58]]) {
      for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#c8b48a' : '#e8dab8'; pointed(g, x + k * 3.5, 192 + k * 4, pw - k * 7, h - 192 - k * 4); g.fill(); }
      g.fillStyle = '#2a1e14'; pointed(g, x + 14, 208, pw - 28, h - 208); g.fill();
      g.fillStyle = 'rgba(255,200,120,0.55)'; g.fillRect(x + 18, 236, pw - 36, h - 236);
      g.fillStyle = '#c8b48a'; g.fillRect(x + pw / 2 - 1.5, 236, 3, h - 236);
    }
  }, { repeat: false });
}
function ndTowerTex() {   // a tower's face: two tall louvred lancets between buttresses, a balustrade on top
  return canvasTex(128, 224, (g, w, h) => {
    g.fillStyle = '#e2d2aa'; g.fillRect(0, 0, w, h); joints(g, w, h);
    g.fillStyle = 'rgba(255,248,220,0.5)'; g.fillRect(0, 0, 10, h); g.fillRect(w - 10, 0, 10, h);
    for (const x of [22, 70]) { g.fillStyle = '#241c14'; pointed(g, x, 40, 36, h - 70); g.fill(); g.fillStyle = 'rgba(90,70,50,0.8)'; for (let y = 70; y < h - 32; y += 7) g.fillRect(x + 3, y, 30, 2); }
    g.fillStyle = '#f0e4c4'; g.fillRect(0, 0, w, 14); g.fillStyle = '#2a2018'; for (let x = 6; x < w - 4; x += 9) g.fillRect(x, 3, 4, 8);
  }, { repeat: false });
}
function reliefTex(kind) {   // carved groups and friezes for the Arc: figures in high relief under the floodlights
  return canvasTex(128, 160, (g, w, h) => {
    g.fillStyle = '#a8946a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(60,44,20,0.7)'; g.lineWidth = 5; g.strokeRect(4, 4, w - 8, h - 8);
    const fig = (x, y, s, col) => {
      g.fillStyle = 'rgba(40,28,12,0.55)'; g.beginPath(); g.ellipse(x + 3 * s, y + 3 * s, 7 * s, 17 * s, 0.2, 0, 7); g.fill(); g.beginPath(); g.arc(x + s, y - 19 * s, 6 * s, 0, 7); g.fill();
      g.fillStyle = col; g.beginPath(); g.ellipse(x, y, 7 * s, 17 * s, 0.2, 0, 7); g.fill(); g.beginPath(); g.arc(x - 2 * s, y - 22 * s, 6 * s, 0, 7); g.fill();
      g.strokeStyle = col; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x, y - 10 * s); g.lineTo(x + rand(-14, 14) * s, y - rand(14, 26) * s); g.stroke();
    };
    for (let k = 0; k < (kind ? 9 : 5); k++) fig(rand(20, w - 20), rand(50, h - 30), rand(0.8, 1.4), pick(['#fff2d6', '#f4e6c4', '#ead8b0']));
    if (!kind) { g.fillStyle = '#f4e8cc'; g.beginPath(); g.moveTo(w / 2, 14); g.quadraticCurveTo(w - 10, 30, w - 18, 70); g.quadraticCurveTo(w / 2, 40, w / 2, 14); g.fill(); g.beginPath(); g.moveTo(w / 2, 14); g.quadraticCurveTo(10, 30, 18, 70); g.quadraticCurveTo(w / 2, 40, w / 2, 14); g.fill(); }   // the winged Genius over the group
  });
}
function shieldTex() {   // the attic's row of shields, each with a battle's name
  return canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = '#ddcca6'; g.fillRect(0, 0, w, h);
    for (let x = 16; x < w; x += 32) { g.fillStyle = '#f2e6c6'; g.beginPath(); g.arc(x, h / 2, 12, 0, 7); g.fill(); g.strokeStyle = 'rgba(80,60,30,0.6)'; g.lineWidth = 2; g.stroke(); }
    g.fillStyle = 'rgba(80,60,30,0.35)'; g.fillRect(0, 4, w, 3); g.fillRect(0, h - 7, w, 3);
  });
}
// the Louvre's floodlit facades: an arcade below, tall windows under alternating pediments, paired columns between bays
function palaceTex() {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#e0d0aa'; g.fillRect(0, 0, w, h); joints(g, w, h, 6);
    for (const x of [0, 60]) { g.fillStyle = '#f2e6c8'; g.fillRect(x + 2, 34, 5, 74); g.fillRect(x + 9, 34, 5, 74); }
    for (const [x, tri] of [[20, true], [80, false]]) {
      g.fillStyle = '#2a2018'; g.fillRect(x, 50, 26, 46);
      g.fillStyle = 'rgba(255,214,150,0.7)'; g.fillRect(x + 2, 52, 22, 42);
      g.strokeStyle = '#2a2018'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 13, 52); g.lineTo(x + 13, 94); g.moveTo(x + 2, 70); g.lineTo(x + 24, 70); g.stroke();
      g.fillStyle = '#f4e8cc';
      if (tri) { g.beginPath(); g.moveTo(x - 4, 47); g.lineTo(x + 30, 47); g.lineTo(x + 13, 37); g.closePath(); g.fill(); }
      else { g.beginPath(); g.ellipse(x + 13, 47, 17, 8, 0, Math.PI, 0); g.fill(); }
    }
    g.fillStyle = '#f0e2c2'; g.fillRect(0, 108, w, 4); g.fillRect(0, 26, w, 6);
    for (let x = 2; x < w; x += 6) { g.fillStyle = '#d2c098'; g.fillRect(x, 14, 3, 12); }   // the balustrade
    for (const x of [14, 78]) { g.fillStyle = '#2a2018'; g.beginPath(); g.moveTo(x, h); g.lineTo(x, 118); g.arc(x + 18, 118, 18, Math.PI, 0); g.lineTo(x + 36, h); g.fill(); g.fillStyle = 'rgba(255,210,140,0.5)'; g.fillRect(x + 4, 120, 28, 8); }
  });
}
// the Opéra's front: seven arches, the loggia's paired columns and tall windows, oculi with gilded busts, the attic's masks
function operaTex() {
  return canvasTex(512, 224, (g, w, h) => {
    g.fillStyle = '#e4d2a8'; g.fillRect(0, 0, w, h); joints(g, w, h, 7);
    g.fillStyle = '#c8a860'; g.fillRect(0, 26, w, 6); g.fillRect(0, 142, w, 6);
    for (let k = 0; k < 7; k++) {
      const x = 22 + k * 67;
      g.fillStyle = '#241a10'; g.beginPath(); g.moveTo(x, h); g.lineTo(x, 176); g.arc(x + 20, 176, 20, Math.PI, 0); g.lineTo(x + 40, h); g.fill();
      g.fillStyle = 'rgba(255,210,140,0.7)'; g.fillRect(x + 6, 184, 28, h - 184);
      g.fillStyle = '#f0e0b8'; g.beginPath(); g.ellipse(x - 13, 180, 6, 14, 0, 0, 7); g.fill();
      g.fillStyle = '#2a1e12'; g.fillRect(x + 6, 74, 28, 60); g.fillStyle = 'rgba(255,214,150,0.75)'; g.fillRect(x + 8, 76, 24, 56);
      g.fillStyle = '#f4e4bc'; for (const dx of [-14, -7, 43, 50]) g.fillRect(x + dx, 48, 5, 94);
      g.fillStyle = '#e8c860'; g.beginPath(); g.arc(x + 20, 58, 7, 0, 7); g.fill();
    }
    for (let x = 18; x < w; x += 24) { g.fillStyle = '#e8c860'; g.beginPath(); g.arc(x, 14, 6, 0, 7); g.fill(); }
    g.fillStyle = '#c8a860'; g.font = `700 13px ${SERIF}`; g.textAlign = 'center'; g.fillText('ACADÉMIE NATIONALE DE MUSIQUE', w / 2, 40);
  }, { repeat: false });
}
// a flag hanging in the wind: a grid of quads with its swaying growing toward the free end
function flagGeo(w, h, nx = 6, ny = 8) {
  const p = [], n = [], uv = [], c = [], s = [];
  const V = (i, j) => [-w / 2 + (w * i) / nx, -(h * j) / ny, 0];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    for (const [a, b] of [[i, j], [i + 1, j], [i + 1, j + 1], [i, j], [i + 1, j + 1], [i, j + 1]]) {
      p.push(...V(a, b)); n.push(0, 0, 1); uv.push(a / nx, 1 - b / ny); c.push(1, 1, 1); s.push(Math.pow(b / ny, 1.5));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(s, 1));
  return g;
}

export function parisLandmarks(K) {
  const towers = [], wheels = [], sails = [];
  const ashlar = K.ashlarMat;
  const white = std({ vertexColors: true, roughness: 0.7, emissive: '#fff2dc', emissiveIntensity: 0.32 });   // floodlit travertine and marble
  const gold = hdr('#ffa830', 1.15), goldHi = hdr('#ffc860', 1.5);
  const lattice = basic({ map: latticeTexture(), color: hdr('#ff8a20', 0.7), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const towerVC = basic({ vertexColors: true, fog: false, transparent: true });
  const ndFront = basic({ map: ndFrontTex(), color: hdr('#ffffff', 0.92) });
  const ndTower = basic({ map: ndTowerTex(), color: hdr('#ffffff', 0.9) });
  const PALT = palaceTex(), palMat = basic({ map: PALT, color: hdr('#ffffff', 0.85) });
  const tiles = new Map(), tile = (n) => { if (!tiles.has(n)) { const g = new THREE.PlaneGeometry(1, 1), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * n); tiles.set(n, g); } return tiles.get(n); };
  const lampsAlong = (b, x, z0, z1, step = 12, double = false) => { for (let z = z0; z < z1; z += step) K.lamp(b, x, -z, double); };
  const carousel = () => {   // a Belle Époque carousel: a red canopy fringed with bulbs, horses on brass poles, turning slowly
    const cb = new Batcher(), brass = '#d8a840';
    cb.cyl(VC.solid, '#e8dcc0', 0, 0.3, 0, 5, 0.6); cb.cyl(VC.metal, brass, 0, 3, 0, 0.45, 5);
    cb.add(G.cone, VC.solid, 0, 5.8, 0, 11, 2.2, 11, 0, 0, 0, '#c8202c');
    cb.cyl(VC.solid, '#f2e6c8', 0, 4.6, 0, 5.5, 0.5);
    for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2; cb.sph(VC.glow, hdr(k % 2 ? '#ffd890' : '#fff4dc', 2.6), Math.cos(a) * 5.55, 4.6, Math.sin(a) * 5.55, 0.1, true); }
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2, x = Math.cos(a) * 3.4, z = Math.sin(a) * 3.4, y = 1.5 + (k % 2) * 0.4;
      cb.cyl(VC.metal, brass, x, 2.5, z, 0.04, 4);
      cb.add(G.box, VC.solid, x, y, z, 0.36, 0.55, 1.3, 0, -a, 0, pick(['#f4f2ec', '#e8c8a0', '#c8202c', '#2a3a5a', '#e8a0b8']));
      cb.add(G.box, VC.solid, x - Math.sin(a) * 0.62, y + 0.42, z + Math.cos(a) * 0.62, 0.26, 0.5, 0.3, 0.5, -a, 0, '#f4f2ec');
    }
    const g = cb.build(); wheels.push(g); return g;
  };
  const addTower = (b, opts) => eiffel(b, { lattice, solid: towerVC, gold, bright: goldHi, ...opts });   // the Eiffel Tower lit gold
  const lightTower = (g, { pts, top }) => {   // ...its sparkle and its searchlight, once the scene's group exists
    const sp = sparkles(pts, { size: 1.0, curved: true }), bm = beacon(300, 14, 0.09, true);
    bm.position.set(...top);
    g.add(sp, bm); towers.push({ sp, bm });
  };

  // ---------- 0. the Seine at Notre-Dame ----------
  const seine = () => {
    const b = new Batcher();
    // left: the Latin Quarter's cafés and bookshops under their plane trees
    farGround(b, -1, '#1c1e26');
    K.haussRow(b, -1, 0, 80);
    for (let z = 5; z < 78; z += 11) { K.plane(b, -(EDGE + 3.4), -z, rand(0.95, 1.1)); K.grille(b, -(EDGE + 3.4), -z); }
    lampsAlong(b, -(EDGE + 0.9), 10, 78, 11);
    K.crowd(b, -(EDGE + 1.2), -(EDGE + 6.2), 2, 78, 10);
    K.accordionist(b, -(EDGE + 5.4), -36, -1);
    // right: the quay, its bouquinistes and lamps, a boat going by
    K.quay(b, 1, 0, 80);
    for (let z = 4; z < 78; z += 12) K.lamp(b, EDGE + 6.4, -z);
    for (let z = 46; z < 78; z += 12) K.plane(b, EDGE + 3.6, -z, rand(0.95, 1.08));   // the menu looks across the river here, so the trees start further on
    K.crowd(b, EDGE + 1.2, EDGE + 5.8, 2, 78, 8);
    K.painter(b, EDGE + 5.2, -22, 1);
    K.bateau(b, 26, -36, 'mouche');
    K.bateau(b, 37, -30, 'peniche');
    K.bridge(b, 1, -66, 2, 30);
    // the Île de la Cité across the river: its quay wall, trees along the edge, the parvis and the cathedral's west front
    const FX = 52, CZ = -32;
    b.box(VC.solid, '#8e836e', 42.2, (WY + 0.4) / 2, -38, 0.6, 0.4 - WY, 84);
    b.box(VC.solid, '#4a4640', 92, (WY + 0.4) / 2, -38, 99, 0.4 - WY, 84);
    for (let z = -2; z > -78; z -= 9) if (Math.abs(z - CZ) > 15) K.marronnier(b, 45.5, z, rand(1.0, 1.15), { y: 0.4 });
    for (let z = -4; z > -80; z -= 12) { b.cyl(VC.metal, IRON, 43.6, 2.4, z, 0.06, 4, 'cyl8'); b.box(VC.glow, hdr('#ffd28a', 2.4), 43.6, 4.5, z, 0.3, 0.42, 0.3); K.refl(b, 43.6, z, 50, 1.2, '#ffd28a'); }
    K.crowd(b, 44.5, 50, 22, 44, 9, { bag: false });
    // the west front: portals, kings, the rose, the open gallery; the two towers; the Gallery of Chimeras between them
    K.ashlar(b, FX + 3, 0.4, CZ, 6, 19.5, 18.5, '#f0e2c0');
    b.add(G.plane, ndFront, FX - 0.02, 0.4 + 19.5 / 2, CZ, 18.5, 19.5, 1, 0, -Math.PI / 2, 0);
    for (const e of [-1, 1]) {
      const tz = CZ + e * 6.02;
      K.ashlar(b, FX + 3, 19.9, tz, 6, 11.3, 6.45, '#f0e2c0');
      b.add(G.plane, ndTower, FX - 0.02, 19.9 + 11.3 / 2, tz, 6.45, 11.3, 1, 0, -Math.PI / 2, 0);
      b.box(VC.solid, '#e8dcbc', FX + 3, 31.4, tz, 6.4, 0.5, 6.9);
    }
    b.box(VC.solid, '#3a2e22', FX + 0.8, 21.2, CZ, 0.3, 2.6, 5.6);
    for (let k = 0; k < 6; k++) b.box(VC.solid, '#e8dcbc', FX + 0.6, 21.2, CZ - 2.4 + k * 0.96, 0.4, 2.6, 0.22);
    // the nave and its steep lead roof, the transept, the apse, flying buttresses, the spire and its golden rooster
    K.ashlar(b, 81, 0.4, CZ, 46, 14.4, 12, '#e4d4b0');
    b.add(G.box, VC.solid, 81, 14.8, CZ, 46, 8.5, 8.5, Math.PI / 4, 0, 0, '#3a4252');
    K.ashlar(b, 79, 0.4, CZ, 10, 14.4, 28, '#e4d4b0');
    b.add(G.box, VC.solid, 79, 14.8, CZ, 8.5, 8.5, 28, 0, 0, Math.PI / 4, '#3a4252');
    b.cyl(ashlar, '#e4d4b0', 104, 7.6, CZ, 6, 14.4, 'cyl');
    b.add(G.cone8, VC.solid, 104, 18.5, CZ, 12.4, 7.4, 12.4, 0, 0, 0, '#3a4252');
    for (let x = 62; x < 102; x += 6) {
      if (Math.abs(x - 79) < 6) continue;
      for (const e of [-1, 1]) {
        b.block(VC.solid, '#d8c8a2', x, 0.4, CZ + e * 11, 1.2, 9, 1.4);
        beam(b, VC.solid, x, 13, CZ + e * 6, x, 8.6, CZ + e * 11, 0.5, '#d8c8a2');
        b.box(VC.glow, hdr(pick(['#5a7ae8', '#e85a7a', '#ffd28a']), 0.8), x + 3, 8, CZ + e * 6.02, 1.0, 5.5, 0.05);
      }
    }
    b.cyl(VC.solid, '#3a4252', 79, 22, CZ, 1.6, 3, 'cyl8');
    b.add(G.cone8, VC.solid, 79, 33, CZ, 3.2, 21, 3.2, 0, 0, 0, '#4a5266');
    for (let y = 24; y < 36; y += 3) b.cyl(VC.glow, hdr('#ffd28a', 0.8), 79, y, CZ, 1.55 - (y - 24) * 0.1, 0.12, 'cyl8');
    b.sph(VC.glow, goldHi, 79, 43.7, CZ, 0.45, true);
    K.refl(b, FX - 6, CZ, 60, 6, '#ffe0a8');
    K.refl(b, FX - 6, CZ - 6, 60, 3, '#ffd090');
    return b.build();
  };

  // ---------- 1. the Eiffel Tower and the Champ de Mars ----------
  const champ = () => {
    const b = new Batcher();
    // the end of the Pont d'Iéna: the river on both sides, stone parapets and lamps; then the far quay
    b.add(G.plane, K.seine, 0, WY, -6, 260, 12.4, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#5e5a52', 0, (WY - 1) / 2, -6, 21.5, 1 - WY, 12.4);
    for (const s of [-1, 1]) {
      b.box(VC.solid, '#cfc4ac', s * (EDGE + 7), 0.55, -6, 0.6, 1.1, 12.4);
      for (const z of [-1, -11]) { b.block(VC.solid, '#d8ccb4', s * (EDGE + 7), 0, z, 1.4, 3.2, 1.4); b.block(VC.solid, '#3a3e44', s * (EDGE + 7), 3.2, z, 0.8, 1.6, 1.2); }   // the eagles' plinths
      b.box(VC.solid, '#8e836e', s * 70, WY / 2, -12.4, 118, -WY, 0.5);
      b.box(VC.solid, '#b0a690', s * 69.5, -0.1, -46, 118, 0.2, 67);
      K.refl(b, s * (EDGE + 7), -2, 40, 1.4, '#ffd28a');
      // the Champ de Mars: lawns, avenues of chestnuts, lamps
      b.box(VC.solid, '#2e5228', s * 52, 0.03, -73, 44, 0.06, 14);
      b.box(VC.solid, '#2e5228', s * 58, 0.03, -40, 32, 0.06, 40);
      for (let z = 16; z < 79; z += 9) { K.marronnier(b, s * 33, -z, rand(1.0, 1.15)); if (z > 60) K.marronnier(b, s * 75, -z, rand(1.0, 1.15)); }
      for (let z = 15; z < 79; z += 11) K.lamp(b, s * (EDGE + 6.6), -z, true);
      K.crowd(b, s * (EDGE + 1.2), s * 13, 14, 78, 16, { bag: true });
      for (const z of [-26, -54]) {   // a souvenir seller with rings of little golden towers
        K.person(b, s * 11, z, { hat: null, bag: false });
        for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.add(G.cone4, VC.glow, s * 11 + Math.cos(a) * 0.28, 1.15, z + 0.3 + Math.sin(a) * 0.28, 0.06, 0.2, 0.06, 0, 0, 0, gold); }
      }
    }
    // the tower over the track: its legs on their stone piers, the great arches, the lit floors high above
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.ashlar(b, sx * 19.8, 0, -40 + sz * 19.8, 11, 1.8, 11, '#e4d8bc');
    const T = addTower(b, { x: 0, y: 0, z: -40, s: 0.4, seg: 9, cell: 11, density: 0.32 });
    const g = b.build();
    const cr = carousel(); cr.position.set(-52, 0, -24); g.add(cr);
    lightTower(g, T);
    return g;
  };
  // ---------- 2. the Champs-Élysées and the Arc de Triomphe ----------
  const ARC = (() => {   // the arch's elevation with its great vault, extruded through its depth (three-quarter scale)
    const s = 0.75, HW = 22.5 * s, H = 50 * s, VW = 7.3 * s, VS = 21.9 - VW, D = 22 * s;
    const sh = new THREE.Shape();
    sh.moveTo(-HW, 0); sh.lineTo(-VW, 0); sh.lineTo(-VW, VS); sh.absarc(0, VS, VW, Math.PI, 0, true); sh.lineTo(VW, 0); sh.lineTo(HW, 0); sh.lineTo(HW, H); sh.lineTo(-HW, H); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false, curveSegments: 18 });
    g.translate(0, 0, -D / 2);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 4.5, uv.getY(i) / 4.5);
    return { g, HW, H, VW, VS, D };
  })();
  const relief = [reliefTex(0), reliefTex(1)].map((t) => basic({ map: t, color: hdr('#ffffff', 0.9) }));
  const shields = basic({ map: shieldTex(), color: hdr('#ffffff', 0.9) });
  const flagMat = foliageMat(K.flagMat.map, { sway: 0.45, alphaTest: 0.5, emissive: 0.6 });
  const champs = () => {
    const b = new Batcher(), AZ = -58, { HW, VW, VS, D } = ARC;
    for (const s of [-1, 1]) {
      farGround(b, s, '#1c1e26');
      K.haussRow(b, s, 0, 44, { x0: 15.5 });
      // the avenue's double rows of clipped trees strung with lights, lamps between, the crowds
      for (let z = 3; z < 44; z += 6) for (const x of [EDGE + 2.8, EDGE + 8.4]) {
        K.pleached(b, s * x, -z, { w: 2.6, d: 4.6, h: 2.6, trunk: 3.4 });
        for (let k = 0; k < 6; k++) { const fx = chance(0.5); b.sph(VC.glow, hdr(pick(['#fff4d6', '#ffe0a0']), 2.6), s * x + (fx ? pick([-1.33, 1.33]) : rand(-1.2, 1.2)), rand(3.6, 5.9), -z + (fx ? rand(-2.2, 2.2) : pick([-2.33, 2.33])), 0.07, true); }
      }
      for (let z = 6; z < 44; z += 12) K.lamp(b, s * (EDGE + 5.6), -z, true);
      K.crowd(b, s * (EDGE + 1.0), s * (EDGE + 11.2), 2, 44, 14, { bag: true });
      // the Étoile round the arch: paving, lamps, taxis going round
      b.box(VC.solid, '#3a3a42', s * 50, -0.05, -62, 80, 0.1, 36);
      for (let z = 48; z < 80; z += 8) K.lamp(b, s * (EDGE + 9.5), -z, true);
      for (const z of [-72, -78]) K.car(b, s * (EDGE + 2.6), z, 'taxi');
      for (let k = 0; k < 6; k++) K.car(b, s * rand(24, 40), -rand(48, 78), pick(['taxi', 'car']));
    }
    // the arch: floodlit stone, the sculpture groups on its piers, the frieze and the attic's shields, the transverse
    // arches opening off the vault, and the great flag hanging under the crown
    b.addM(ARC.g, ashlar, at(0, 0, AZ), '#f0e2c0');
    b.box(VC.solid, '#efe2c2', 0, 29.7, AZ, 2 * HW + 1.2, 1.2, D + 1.2);
    b.box(VC.solid, '#e8dab8', 0, 33.8, AZ, 2 * HW, 7.4, D);
    b.box(VC.solid, '#efe2c2', 0, 37.6, AZ, 2 * HW + 0.6, 0.4, D + 0.6);
    for (const e of [-1, 1]) {
      const fz = AZ + e * (D / 2 + 0.04), ry = e > 0 ? 0 : Math.PI;
      b.add(tile(6), relief[1], 0, 27.4, fz, 2 * HW, 2.6, 1, 0, ry, 0);
      b.add(tile(8), shields, 0, 33.2, AZ + e * (D / 2 + 0.03), 2 * HW, 2.4, 1, 0, ry, 0);
      for (const sx of [-1, 1]) {
        b.add(G.plane, relief[0], sx * 11.2, 8.6, fz, 7.4, 9.8, 1, 0, ry, 0);
        b.add(G.plane, relief[1], sx * 11.2, 20.6, fz, 8.4, 4.6, 1, 0, ry, 0);
      }
    }
    for (const sx of [-1, 1]) for (const x of [VW - 0.03, HW + 0.03]) {
      b.box(VC.solid, '#16120e', sx * x, 5.25, AZ, 0.05, 10.5, 6.3);
      b.cyl(VC.solid, '#16120e', sx * x, 10.5, AZ, 3.15, 0.05, 'cyl', 0, Math.PI / 2);
    }
    for (let k = 0; k < 9; k++) { const a = Math.PI * (0.1 + (0.8 * k) / 8); b.sph(VC.glow, hdr('#ffe0a8', 1.6), Math.cos(a) * (VW - 0.2), VS + Math.sin(a) * (VW - 0.2), AZ + D / 2 - 0.6, 0.12, true); }
    b.addM(flagGeo(7.6, 6.0), flagMat, at(0, 20.2, AZ), null);
    return b.build();
  };

  // ---------- 3. the Louvre and its pyramid ----------
  const glassTex = canvasTex(128, 128, (g, w, h) => {   // the pyramid's glass, lit from inside, under its net of diamonds
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff4d8'); gr.addColorStop(1, '#ffd28a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(40,40,52,0.85)'; g.lineWidth = 2.2;
    for (let k = -8; k <= 8; k++) { g.beginPath(); g.moveTo(k * 16, 0); g.lineTo(k * 16 + h, h); g.moveTo(k * 16, 0); g.lineTo(k * 16 - h, h); g.stroke(); }
  });
  glassTex.repeat.set(10, 4);
  const pyrGlass = basic({ map: glassTex, color: hdr('#ffffff', 0.95), side: THREE.DoubleSide });
  const PYR = new THREE.ConeGeometry(1, 1, 4, 1, true); PYR.rotateY(Math.PI / 4); PYR.translate(0, 0.5, 0);
  const palace = (b, s, x0, z0, z1, h, pz = null) => {   // a wing of the palace: floodlit facade, mansard and dormers, a pavilion
    const L = z1 - z0, zc = -(z0 + z1) / 2, f = s * x0;
    b.box(VC.solid, '#cfc0a0', s * (x0 + 8), h / 2, zc, 16, h, L);
    b.add(tile(Math.round(L / 6.5)), palMat, f - s * 0.02, h / 2, zc, L, h, 1, 0, -s * Math.PI / 2, 0);
    b.add(G.box, VC.solid, f + s * 1.3, h + 2.4, zc, 0.3, 5.2, L, 0, 0, -s * 0.3, '#46506a');
    b.block(VC.solid, '#3a4458', s * (x0 + 8.5), h, zc, 13, 4.8, L);
    for (let dz = -L / 2 + 2; dz < L / 2 - 1; dz += 3.25) { const z = zc + dz; b.block(VC.solid, '#e8dcc0', f + s * 1.2, h + 0.9, z, 0.9, 1.8, 1.2); b.box(VC.glow, hdr('#ffd9a0', chance(0.5) ? 0.9 : 0.15), f + s * 0.74, h + 1.7, z, 0.04, 0.9, 0.62); }
    if (pz !== null) {
      b.box(VC.solid, '#d8c8a8', s * (x0 + 7.5), (h + 7) / 2, pz, 17, h + 7, 18);
      b.add(tile(3), palMat, f - s * 1.02, (h + 7) / 2, pz, 18, h + 7, 1, 0, -s * Math.PI / 2, 0);
      b.add(G.cone4, VC.solid, s * (x0 + 7.5), h + 11, pz, 18.7, 8, 19.8, 0, 0, 0, '#3e4858');
      b.cyl(VC.glow, gold, s * (x0 + 7.5), h + 15.6, pz, 0.15, 2, 'cyl6');
    }
  };
  const louvre = () => {
    const b = new Batcher(), PX = -36, PZ = -40, A = 10.8, PH = 13.6;
    // the Cour Napoléon's pale paving opens wide on the left; the Richelieu wing lines the right
    b.box(VC.solid, '#b8b0a0', -58.25, -0.05, -40, 95.5, 0.1, 80);
    farGround(b, 1, '#1c1e26');
    palace(b, 1, 16, 1, 79, 20, -40);
    palace(b, -1, 92, 1, 79, 20, -40);
    // the Pavillon de l'Horloge closing the court ahead, its clock lit
    b.box(VC.solid, '#cfc0a0', -55, 11, -78, 70, 22, 4);
    b.add(tile(11), palMat, -55, 11, -75.98, 70, 22, 1);
    b.box(VC.solid, '#d8c8a8', -55, 15, -77, 16, 30, 6);
    b.add(tile(2), palMat, -55, 15, -73.98, 16, 30, 1);
    b.cyl(VC.glow, hdr('#fff0c8', 1.6), -55, 24, -73.9, 1.6, 0.1, 'cyl', Math.PI / 2, 0);
    b.add(G.cone4, VC.solid, -55, 34, -77, 17, 8, 7.5, 0, 0, 0, '#3e4858');
    // the pyramid lit from within, its three small sisters, the basins and their jets
    b.add(PYR, pyrGlass, PX, 0, PZ, A * Math.SQRT2, PH, A * Math.SQRT2);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) beam(b, VC.metal, PX + sx * A, 0, PZ + sz * A, PX, PH, PZ, 0.14, '#4a4e58');
    for (const [x, z] of [[PX + 19, PZ], [PX, PZ + 19], [PX, PZ - 19]]) b.add(PYR, pyrGlass, x, 0, z, 3.2 * Math.SQRT2, 4.2, 3.2 * Math.SQRT2);
    for (const [x, z] of [[PX + 14, PZ + 14], [PX + 14, PZ - 14], [PX - 14, PZ + 14], [PX - 14, PZ - 14]]) {
      b.add(G.plane, K.seine, x, 0.14, z, 10, 10, 1, -Math.PI / 2, 0, 0);
      for (const [dx, dz, w, d] of [[0, 5, 10.4, 0.4], [0, -5, 10.4, 0.4], [5, 0, 0.4, 10.4], [-5, 0, 0.4, 10.4]]) b.box(VC.solid, '#4a4a50', x + dx, 0.18, z + dz, w, 0.36, d);
      for (let k = 0; k < 4; k++) b.cyl(VC.glow, hdr('#d8ecff', 0.9), x + rand(-4, 4), 0.9, z + rand(-4, 4), 0.04, 1.5, 'cyl6');
    }
    b.cyl(VC.glow, hdr('#ffd890', 0.7), PX, 0.06, PZ, A * 1.4, 0.04, 'cyl');
    // the Richelieu side: lamps, people strolling, a crêpe cart
    for (let z = 6; z < 78; z += 12) K.lamp(b, EDGE + 1.0, -z, true);
    for (let z = 4; z < 78; z += 14) K.lamp(b, -(EDGE + 1.0), -z, true);
    K.crowd(b, EDGE + 1.2, EDGE + 8, 2, 78, 10, { bag: true });
    K.crowd(b, -(EDGE + 1.2), -60, 4, 76, 26, { bag: true });
    K.mime(b, -(EDGE + 6), -18, -1);
    return b.build();
  };

  // ---------- 4. Montmartre: Sacré-Cœur on the butte, the Moulin Rouge below ----------
  const moulinMat = basic({ map: textTex('MOULIN ROUGE', { w: 1024, h: 160, color: '#ff4a3a', glow: '#ff1010', font: SERIF, weight: 700, size: 0.66 }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hdr('#ffffff', 1.6), side: THREE.DoubleSide });
  const montmartre = () => {
    const b = new Batcher(), cx = -72, cz = -50, rx = 58, ry = 46, rz = 36, cy = -14;
    const hill = new THREE.Mesh(G.sph); hill.position.set(cx, cy, cz); hill.scale.set(rx * 2, ry * 2, rz * 2); hill.updateMatrixWorld();
    const hillY = (x, z) => surfaceY(hill, x, z, -99);
    // left: the butte with its chestnuts, the stairs climbing straight up between lamps, the funicular, the carousel
    farGround(b, -1, '#1e2a1e');
    b.add(G.sph, VC.solid, cx, cy, cz, rx * 2, ry * 2, rz * 2, 0, 0, 0, '#26402a');
    for (let k = 0; k < 46; k++) {
      const x = rand(-26, -76), z = -rand(4, 78), y = hillY(x, z);
      if (y < 0.6 || Math.abs(z - cz) < 7.5 || x < -62) continue;
      K.marronnier(b, x, z, rand(0.9, 1.15), { y: y - 0.4 });
    }
    for (let x = -18; x > -66; x -= 1.6) { const y = Math.max(0, hillY(x, cz)); b.block(VC.solid, '#b8b0a0', x, -0.2, cz, 1.7, y + 0.2, 7); }
    for (let x = -18 - 1.6; x > -64; x -= 6.4) {
      const y = Math.max(0, hillY(x, cz));
      b.cyl(VC.metal, IRON, x, y + 1.6, cz, 0.06, 3.2, 'cyl8'); b.box(VC.glow, hdr('#ffd28a', 2.4), x, y + 3.4, cz, 0.3, 0.42, 0.3); b.add(G.cone4, VC.metal, x, y + 3.75, cz, 0.46, 0.24, 0.46, 0, 0, 0, IRON);
      for (const e of [-1, 1]) { const x1 = x - 6.4, y1 = Math.max(0, hillY(x1, cz)); beam(b, VC.metal, x, y + 0.95, cz + e * 3.3, x1, y1 + 0.95, cz + e * 3.3, 0.05, IRON); }
      K.person(b, x - 3.2, cz + rand(-2.5, 2.5), { y: Math.max(0, hillY(x - 3.2, cz)) });
    }
    for (let x = -18; x > -62; x -= 4) {   // the funicular's sleepers, deep enough to meet the slope under all four corners
      const yt = Math.max(0, hillY(x, cz + 7.5)) + 0.41, yb = Math.min(...[[-0.15, -0.8], [-0.15, 0.8], [0.15, -0.8], [0.15, 0.8]].map(([dx, dz]) => Math.max(0, hillY(x + dx, cz + 7.5 + dz)))) - 0.1;
      b.box(VC.metal, '#3a3e44', x, (yt + yb) / 2, cz + 7.5, 0.3, yt - yb, 1.6);
    }
    for (let x = -18; x > -62; x -= 4) { const y0 = Math.max(0, hillY(x, cz + 7.5)) + 0.4, y1 = Math.max(0, hillY(x - 4, cz + 7.5)) + 0.4; for (const e of [-0.6, 0.6]) beam(b, VC.metal, x, y0, cz + 7.5 + e, x - 4, y1, cz + 7.5 + e, 0.08, '#4a4e58'); }
    { const y0 = Math.max(0, hillY(-38, cz + 7.5)) + 0.48, y1 = Math.max(0, hillY(-42, cz + 7.5)) + 0.48, a = Math.atan2(y1 - y0, 4), ym = (y0 + y1) / 2, sa = Math.sin(a), ca = Math.cos(a);
      b.add(G.box, VC.solid, -40 + 1.3 * sa, ym + 1.3 * ca, cz + 7.5, 4, 2.6, 2.2, 0, 0, -a, '#e8e2d6');
      b.add(G.box, VC.glow, -40 + 1.6 * sa, ym + 1.6 * ca, cz + 7.5, 4.04, 0.9, 2.24, 0, 0, -a, hdr('#fff0d0', 1.0)); }
    // Sacré-Cœur on the summit, white in its floodlights: the porch, the ovoid dome, four small domes, the campanile
    const SX = -78, SZ = cz, SY = hillY(SX, SZ) - 1;
    { const y0 = Math.min(SY - 4, ...[[-13, -15], [-13, 15], [13, -15], [13, 15]].map(([dx, dz]) => hillY(SX + dx, SZ + dz))) - 0.3; b.block(white, '#f4f0e6', SX, y0, SZ, 26, SY + 1 - y0, 30); }
    b.block(white, '#f2eee4', SX - 4, SY, SZ, 18, 12, 20);
    b.block(white, '#f4f0e8', SX + 7, SY, SZ, 4, 9, 14);
    for (const dz of [-4, 0, 4]) { b.box(VC.solid, '#1a1410', SX + 9.02, SY + 3.2, SZ + dz, 0.05, 5.5, 2.6); b.cyl(VC.solid, '#1a1410', SX + 9.02, SY + 6, SZ + dz, 1.3, 0.05, 'cyl', 0, Math.PI / 2); }
    for (const dz of [-5.5, 5.5]) { b.block(VC.solid, '#2a2a2e', SX + 9.4, SY + 9, SZ + dz, 1.4, 1.2, 2.2); b.box(VC.solid, '#2a2a2e', SX + 9.4, SY + 10.6, SZ + dz, 0.5, 1.4, 0.4); }
    b.cyl(white, '#f4f0e6', SX - 4, SY + 15, SZ, 5.2, 6, 'cyl');
    b.add(G.sph, white, SX - 4, SY + 18, SZ, 10.4, 15, 10.4, 0, 0, 0, '#f6f2ea');
    b.cyl(white, '#f4f0e6', SX - 4, SY + 26.5, SZ, 1.3, 3, 'cyl8');
    b.add(G.sph, white, SX - 4, SY + 28.4, SZ, 2.6, 2.4, 2.6, 0, 0, 0, '#f6f2ea');
    b.box(VC.glow, goldHi, SX - 4, SY + 30.2, SZ, 0.15, 1.4, 0.15); b.box(VC.glow, goldHi, SX - 4, SY + 30.4, SZ, 0.15, 0.15, 0.8);
    for (const [dx, dz] of [[4, -8], [4, 8], [-12, -8], [-12, 8]]) { b.cyl(white, '#f4f0e6', SX + dx, SY + 12.8, SZ + dz, 1.8, 2.8, 'cyl8'); b.add(G.sph, white, SX + dx, SY + 14.6, SZ + dz, 3.6, 4.6, 3.6, 0, 0, 0, '#f6f2ea'); }
    { const y0 = Math.min(SY, hillY(SX - 20, SZ - 3), hillY(SX - 20, SZ + 3)) - 0.3; b.block(white, '#f2eee4', SX - 17, y0, SZ, 6, SY + 24 - y0, 6); }
    b.add(G.sph, white, SX - 17, SY + 26, SZ, 5, 6, 5, 0, 0, 0, '#f6f2ea');
    b.cyl(white, '#f4f0e6', SX - 17, SY + 29.5, SZ, 0.8, 2, 'cyl8');
    // right: the boulevard de Clichy, the Moulin Rouge's red front strung with bulbs and its windmill on the roof
    farGround(b, 1, '#1c1e26');
    K.haussRow(b, 1, 0, 24); K.haussRow(b, 1, 58, 80);
    const MF = 12.2, MZ0 = -26, ML = 30, MZ = MZ0 - ML / 2, MH = 9.5;
    b.block(VC.solid, '#7a1018', MF + 7, 0, MZ, 14, MH, ML);
    for (const y of [3.4, 9.0]) for (let z = MZ0 - 0.3; z > MZ0 - ML + 0.3; z -= 0.5) b.box(VC.glow, hdr('#ffd28a', 2.4), MF - 0.08, y, z, 0.06, 0.12, 0.12);
    b.add(G.plane, moulinMat, MF - 0.04, 6.4, MZ, 12, 1.9, 1, 0, -Math.PI / 2, 0);
    b.box(VC.solid, '#1a0a0c', MF - 1.2, 4.0, MZ + 5, 2.4, 0.35, 12);
    for (let z = MZ - 1; z < MZ + 11; z += 0.4) b.box(VC.glow, hdr('#fff0c0', 2.6), MF - 2.4, 3.8, z, 0.08, 0.08, 0.08);
    b.box(VC.glow, hdr('#ffb070', 0.9), MF - 0.06, 1.7, MZ + 5, 0.05, 3.0, 6);
    for (const dz of [-9, -5]) b.add(G.plane, K.posterMat, MF - 0.03, 1.8, MZ + dz, 2.2, 2.6, 1, 0, -Math.PI / 2, 0);
    K.neon(b, MF - 0.04, 7.6, MZ0 + 6, 1, 3.6, 6);
    const WX = MF + 2.6, WZ = MZ0 - 3;
    b.cyl(VC.solid, '#a81820', WX, MH + 4, WZ, 2.2, 8, 'cyl8');
    b.add(G.cone8, VC.solid, WX, MH + 9.3, WZ, 5.2, 2.8, 5.2, 0, 0, 0, '#5a0a10');
    for (let y = MH + 1; y < MH + 8; y += 2.2) b.box(VC.glow, hdr('#ffd28a', 1.0), WX - 2.2, y, WZ, 0.05, 0.9, 0.7);
    K.crowd(b, EDGE + 1.2, EDGE + 7.4, 2, 78, 16, { bag: true });
    K.crowd(b, -(EDGE + 1.2), -(EDGE + 5), 2, 78, 8);
    const g = b.build();
    const sb = new Batcher();
    for (let k = 0; k < 4; k++) {   // the sails: lattice blades outlined in red bulbs, turning slowly
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4, dy = Math.cos(a), dz = Math.sin(a), ny = -dz, nz = dy;
      const P = (r, w) => [0, dy * r + ny * w, dz * r + nz * w];
      beam(sb, VC.solid, ...P(0.5, 0), ...P(7.6, 0), 0.16, '#b01822');
      for (const w of [0.35, 1.5]) beam(sb, VC.solid, ...P(1.2, w), ...P(7.6, w), 0.09, '#b01822');
      for (let r = 1.2; r <= 7.7; r += 0.8) beam(sb, VC.solid, ...P(r, 0), ...P(r, 1.5), 0.06, '#8a1018');
      for (let r = 1.3; r <= 7.6; r += 0.45) for (const w of [0.35, 1.5]) sb.box(VC.glow, hdr('#ff4a2a', 2.8), ...P(r, w), 0.17, 0.17, 0.17);
    }
    sb.cyl(VC.solid, '#3a1a10', 0, 0, 0, 0.5, 0.6, 'cyl8', 0, Math.PI / 2);
    const sg = sb.build(); sg.position.set(MF - 0.4, MH + 6.4, WZ); g.add(sg); sails.push(sg);
    const cr = carousel(); cr.position.set(-24, 0, -24); g.add(cr);
    return g;
  };

  // ---------- 5. the Pont Alexandre III and the Invalides ----------
  const candelabra = (b, x, z) => {   // the bridge's bronze lamps: cherubs round the post, three lanterns on top
    b.block(VC.solid, '#d8ccb4', x, 0, z, 0.9, 1.2, 0.9);
    b.cyl(VC.metal, '#3a3020', x, 2.4, z, 0.12, 2.6, 'cyl8');
    b.sph(VC.glow, gold, x, 1.65, z, 0.28, true);
    b.box(VC.metal, '#3a3020', x, 3.55, z, 0.06, 0.06, 1.2);
    for (const [dz, y] of [[0, 4.25], [-0.55, 3.75], [0.55, 3.75]]) { b.box(VC.glow, hdr('#ffe0a0', 2.4), x, y, z + dz, 0.28, 0.4, 0.28); b.add(G.cone4, VC.metal, x, y + 0.3, z + dz, 0.42, 0.2, 0.42, 0, 0, 0, '#3a3020'); }
  };
  const pylon = (b, x, z) => {   // a granite pylon: base, column ringed in gilt, and on top Fame leading her gilded Pegasus
    K.ashlar(b, x, 0, z, 4.4, 6.5, 4.4, '#efe4cc');
    b.cyl(ashlar, '#efe4cc', x, 12.5, z, 1.1, 12, 'cyl');
    for (const y of [8, 11, 14.5]) b.cyl(VC.glow, gold, x, y, z, 1.18, 0.25, 'cyl');
    b.box(VC.solid, '#efe4cc', x, 18.8, z, 3, 0.6, 3);
    const gy = 19.1;
    b.add(G.box, VC.glow, x, gy + 1.0, z, 0.9, 1.0, 2.2, 0, 0, 0, gold);
    b.add(G.box, VC.glow, x, gy + 1.9, z + 1.0, 0.5, 1.1, 0.5, 0.5, 0, 0, gold);
    for (const dz of [-0.7, 0.7]) b.add(G.box, VC.glow, x, gy + 0.3, z + dz, 0.25, 0.8, 0.25, 0, 0, 0, gold);
    for (const sx of [-1, 1]) b.add(G.box, VC.glow, x + sx * 0.9, gy + 2.0, z - 0.2, 1.6, 0.1, 1.4, 0, 0, sx * 0.6, gold);
    b.add(G.cyl8, VC.glow, x, gy + 2.6, z - 0.7, 0.4, 1.6, 0.4, 0, 0, 0, gold);
    b.sph(VC.glow, goldHi, x, gy + 3.55, z - 0.7, 0.25, true);
  };
  const invalides = (b, x, z) => {   // the Dôme des Invalides: the church front, the drum ringed with columns, the gilded dome
    K.ashlar(b, x, 0, z, 14, 10, 14, '#efe4cc');
    b.cyl(ashlar, '#efe4cc', x, 13.5, z, 6.2, 7, 'cyl');
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; b.cyl(VC.solid, '#f4ead4', x + Math.cos(a) * 6.5, 13.2, z + Math.sin(a) * 6.5, 0.25, 6.4, 'cyl6'); }
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.2; b.box(VC.glow, hdr('#ffd28a', 0.8), x + Math.cos(a) * 6.25, 13.5, z + Math.sin(a) * 6.25, 0.8, 3, 0.8); }
    b.add(G.sph, VC.glow, x, 17, z, 13, 15, 13, 0, 0, 0, hdr('#ffbf48', 1.05));
    b.cyl(VC.glow, gold, x, 25.2, z, 1.2, 3.5, 'cyl8');
    b.add(G.cone8, VC.glow, x, 29.2, z, 1.6, 4.5, 1.6, 0, 0, 0, gold);
    b.sph(VC.glow, goldHi, x, 31.8, z, 0.4, true);
  };
  const alexandre = () => {
    const b = new Batcher(), WL = WY - 1;
    // the river flowing across under the bridge, the quays at either end
    b.add(G.plane, K.seine, 0, WL, -35.5, 300, 57, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#4e4a44', 0, (WL - 1) / 2, -35.5, 22, 1 - WL, 57);
    for (const s of [-1, 1]) {
      for (const [zw, zg, dg] of [[-7, -3.5, 7], [-64, -72, 16]]) { b.box(VC.solid, '#8e836e', s * 75, WL / 2, zw, 130, -WL, 0.6); b.box(VC.solid, '#3a3a42', s * 75, -0.05, zg, 130, 0.1, dg); }
      b.box(VC.solid, '#d8ccb4', s * (EDGE + 6.6), 0.55, -35.5, 0.5, 1.1, 57);
      for (let z = 9; z < 64; z += 9) candelabra(b, s * (EDGE + 6.6), -z);
      for (const z of [-4, -68]) pylon(b, s * (EDGE + 9.5), z);
      for (let z = 9; z < 64; z += 9) K.refl(b, s * (EDGE + 8), -z, 60, 1.2, '#ffe0a0', WL + 0.05);
      K.crowd(b, s * (EDGE + 1.2), s * (EDGE + 6), 8, 62, 9, { bag: true });
      for (const z of [-1, -79]) for (let x = 16; x < 120; x += 10) { b.cyl(VC.metal, IRON, s * x, 2.0, z, 0.06, 4, 'cyl8'); b.box(VC.glow, hdr('#ffd28a', 2.4), s * x, 4.2, z, 0.3, 0.42, 0.3); }
    }
    invalides(b, -38, -73);
    for (const x of [-60, -18, 24, 70]) K.marronnier(b, x, -77.5, rand(1.0, 1.2));
    const g = b.build();
    for (const [x, z, kind] of [[-46, -26, 'mouche'], [56, -52, 'mouche'], [-90, -58, 'peniche']]) {   // boats going under the bridge
      const bb = new Batcher(); K.bateau(bb, 0, 0, kind, WL);
      const boat = bb.build(); boat.rotation.y = Math.PI / 2; boat.position.set(x, 0, z); g.add(boat);
    }
    return g;
  };

  // ---------- 6. the Opéra Garnier ----------
  const operaMat = basic({ map: operaTex(), color: hdr('#ffffff', 0.9) });
  const opera = () => {
    const b = new Batcher(), F = 14, OZ = -40, OL = 46, OH = 19;
    // left: the boulevard's Haussmann blocks and their cafés
    farGround(b, -1, '#1c1e26');
    K.haussRow(b, -1, 0, 80);
    for (let z = 6; z < 78; z += 12) K.lamp(b, -(EDGE + 1.0), -z, true);
    K.crowd(b, -(EDGE + 1.2), -(EDGE + 6.4), 2, 78, 12, { bag: true });
    // right: the Opéra facing the track over its steps, the attic's gilded groups, the dome and its lyre, the stage house
    farGround(b, 1, '#1c1e26');
    K.haussRow(b, 1, 0, 14); K.haussRow(b, 1, 66, 80);
    b.block(VC.solid, '#d8c8a8', F + 16, 0, OZ, 32, OH, OL);
    b.add(G.plane, operaMat, F - 0.02, OH / 2, OZ, OL, OH, 1, 0, -Math.PI / 2, 0);
    for (let k = 0; k < 4; k++) b.block(VC.solid, '#e4d8c0', F - 0.9 + 0.225 * k, 0, OZ, 1.8 - 0.45 * k, 0.25 * (k + 1), OL + 1);
    b.block(VC.solid, '#e0d0ac', F + 2, OH, OZ, 4, 2.6, OL);
    for (let k = 0; k <= 7; k++) for (const dz of [-0.55, 0.55]) b.cyl(VC.solid, '#f2e6c8', F - 0.45, 11.6, OZ - OL / 2 + 2.6 + (k * (OL - 5.2)) / 7 + dz, 0.34, 7.6, 'cyl8');   // the loggia's paired columns
    b.box(VC.solid, '#efe2c2', F - 0.5, 15.6, OZ, 1.2, 0.5, OL);
    for (const e of [-1, 1]) {
      const z = OZ + e * (OL / 2 - 2.5);
      b.block(VC.solid, '#e0d0ac', F + 1.5, OH + 2.6, z, 2.4, 1.0, 2.4);
      b.add(G.cyl8, VC.glow, F + 1.5, OH + 5.2, z, 0.9, 3.2, 0.9, 0, 0, 0, gold);
      b.sph(VC.glow, goldHi, F + 1.5, OH + 7.1, z, 0.45, true);
      for (const sx of [-1, 1]) b.add(G.box, VC.glow, F + 1.5, OH + 6.4, z + sx * 0.9, 0.12, 2.0, 1.4, sx * 0.4, 0, 0, gold);
    }
    b.cyl(VC.solid, '#d8c8a8', F + 18, OH + 4, OZ, 9.5, 8, 'cyl');
    b.add(G.sph, VC.solid, F + 18, OH + 8, OZ, 20, 11, 20, 0, 0, 0, '#3e7a64');
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.add(G.cone4, VC.glow, F + 18 + Math.cos(a) * 9.8, OH + 8.6, OZ + Math.sin(a) * 9.8, 0.7, 1.4, 0.7, 0, 0, 0, gold); }
    b.cyl(VC.glow, gold, F + 18, OH + 14.2, OZ, 1.0, 1.6, 'cyl8');
    b.add(G.tor, VC.glow, F + 18, OH + 16.2, OZ, 1.6, 2.2, 1.2, 0, Math.PI / 2, 0, goldHi);
    b.block(VC.solid, '#d0c0a0', F + 34, 0, OZ, 14, OH + 13, 30);
    b.add(G.box, VC.solid, F + 34, OH + 13, OZ, 14, 10, 10, Math.PI / 4, 0, 0, '#5a6a6a');
    b.add(G.cyl8, VC.glow, F + 27.4, OH + 21, OZ, 0.8, 3, 0.8, 0, 0, 0, gold);
    b.add(G.tor, VC.glow, F + 27.4, OH + 23.2, OZ, 1.4, 1.8, 1, 0, Math.PI / 2, 0, goldHi);
    // the square: bronze candelabra, the crowd on the steps and the pavement, a Métro entrance
    for (let z = 20; z < 62; z += 10) candelabra(b, F - 3.4, -z);
    for (let k = 0; k < 10; k++) { const x = rand(F - 1.6, F - 0.5), st = Math.min(3, Math.max(0, Math.floor((x - (F - 1.8)) / 0.45))); K.person(b, x, -rand(20, 60), { y: 0.25 * (st + 1) }); }
    K.crowd(b, EDGE + 1.2, F - 4.2, 2, 78, 14, { bag: true });
    K.metro(b, EDGE + 4.2, -10);
    return b.build();
  };

  return {
    landmarks: [
      { name: '塞纳河 · 巴黎圣母院', en: 'NOTRE-DAME DE PARIS', build: seine },
      { name: '埃菲尔铁塔 · 战神广场', en: 'TOUR EIFFEL', build: champ },
      { name: '凯旋门 · 香榭丽舍大街', en: 'ARC DE TRIOMPHE', build: champs },
      { name: '卢浮宫 · 玻璃金字塔', en: 'MUSÉE DU LOUVRE', build: louvre },
      { name: '蒙马特 · 圣心大教堂 · 红磨坊', en: 'MONTMARTRE · MOULIN ROUGE', build: montmartre },
      { name: '亚历山大三世桥 · 荣军院', en: 'PONT ALEXANDRE III', build: alexandre },
      { name: '加尼叶歌剧院', en: 'OPÉRA GARNIER', build: opera },
    ],
    // kT fades the Champ de Mars tower in while the horizon's tower fades out (see paris.js)
    update(t, kT = 1) {
      const on = sparkleOn(t) * kT;
      lattice.opacity = towerVC.opacity = kT; lattice.visible = towerVC.visible = kT > 0.01;
      for (const { sp, bm } of towers) {
        sp.material.uniforms.time.value = t; sp.material.uniforms.on.value = on; sp.visible = kT > 0.01;
        bm.rotation.y = t * 0.55; bm.children[0].material.opacity = kT; bm.visible = kT > 0.01;
      }
      for (const w of wheels) w.rotation.y = t * 0.45;
      for (const s of sails) s.rotation.x = t * 0.55;
    },
  };
}
