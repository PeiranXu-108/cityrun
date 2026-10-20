// Lijiang landmark scenes at dusk: the great water wheels at the gate of the old town, the circle dance round a bonfire
// in Sifang Square, the stone archway and halls of the Mu Mansion, Wangu Tower on Lion Hill above terraces of roofs,
// the marble bridge and Moon-Embracing Pavilion of Black Dragon Pool, the earthen lanes and murals of Baisha, and the
// turquoise terraces of Blue Moon Valley under the Jade Dragon Snow Mountain.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, buildingGeo, rand, randi, pick } from '../core.js';
import { at, EDGE, farGround, waterMat, textTex } from './common.js';
import { beam } from './tokyo_kit.js';
import { tiledBox } from './beijing_kit.js';
import { CN, cobbleTex } from './lijiang_kit.js';

function muralTex() {   // the Baisha murals: rows of haloed figures among clouds and lotus, in mineral reds, greens and gold
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#6a3a22'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c8a070'; g.fillRect(8, 8, w - 16, h - 16);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,60,30,${rand(0.05, 0.15).toFixed(2)})`; g.beginPath(); g.arc(rand(0, w), rand(0, h), rand(6, 30), 0, 7); g.fill(); }
    for (let row = 0; row < 2; row++) for (let k = 0; k < 7; k++) {
      const x = 40 + k * 72, y = 70 + row * 110;
      g.fillStyle = pick(['#d8b040', '#e8c860']); g.beginPath(); g.arc(x, y - 28, 22, 0, 7); g.fill();
      g.fillStyle = pick(['#a8281a', '#2a6a4a', '#1a4a8a', '#c86a2a']); g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x - 22, y + 34); g.lineTo(x + 22, y + 34); g.closePath(); g.fill();
      g.fillStyle = '#e8c8a0'; g.beginPath(); g.arc(x, y - 28, 9, 0, 7); g.fill();
      g.strokeStyle = '#f4ecd8'; g.lineWidth = 3; g.beginPath(); for (let a = 0; a < 6.3; a += 0.4) g.lineTo(x + 30 + Math.cos(a) * 10, y + 30 + Math.sin(a * 2) * 4); g.stroke();
    }
    g.strokeStyle = '#2a1a10'; g.lineWidth = 3; g.strokeRect(8, 8, w - 16, h - 16);
  });
}
function fallTex() {   // a sheet of falling water
  const t = canvasTex(32, 128, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const x = rand(0, w), y = rand(0, h), L = rand(16, 60); const gr = g.createLinearGradient(0, y, 0, y + L); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(230,250,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, y, rand(1, 3), L); }
  });
  return t;
}

export function ljLandmarks(K) {
  const stoneTex = canvasTex(128, 128, (g, w, h) => {   // grey ashlar for archways, platforms and banks
    g.fillStyle = '#5a5850'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 16 - 16; x < w; x += 32) { const v = randi(-10, 10); g.fillStyle = `rgb(${150 + v},${146 + v},${136 + v})`; g.fillRect(x + 1, y + 1, 30, 14); }
  });
  const stoneMat = std({ map: stoneTex, vertexColors: true, roughness: 0.85, emissive: '#ffd9a8', emissiveMap: stoneTex, emissiveIntensity: 0.1 });
  const stone = (b, x, y, z, w, h, d, col = 0xffffff, ry = 0) => b.addM(tiledBox(w, h, d, 2.2), stoneMat, at(x, y + h / 2, z, ry), col);
  const marble = std({ color: '#e8e6e0', roughness: 0.5, emissive: '#fff0dc', emissiveIntensity: 0.12 });
  const cob = cobbleTex(); cob.repeat.set(6, 6);
  const plazaMat = std({ map: cob, roughness: 0.6 });
  const pool = waterMat('#16384a', 6);
  pool.metalness = 0.6; pool.roughness = 0.22; pool.envMapIntensity = 0.55; pool.normalScale.set(0.3, 0.3);
  const blue = waterMat('#1ab8b4', 4);   // Blue Moon Valley's milky turquoise, glowing a little
  blue.metalness = 0.3; blue.roughness = 0.2; blue.emissive = new THREE.Color('#0c7a78'); blue.emissiveIntensity = 0.7; blue.normalScale.set(0.25, 0.25);
  const ft = fallTex(); ft.repeat.set(4, 1);
  const fallMat = basic({ map: ft, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: hdr('#d8f4ff', 1.2) });
  const muralMat = std({ map: muralTex(), roughness: 0.8, emissive: '#ffffff', emissiveMap: muralTex(), emissiveIntensity: 0.4 });
  const plates = new Map();
  const plaque = (text, { bg = '#1a2a3a', fg = '#f2cf72', w = 512, h = 128 } = {}) => {
    const key = text + bg;
    if (!plates.has(key)) { const t = textTex(text, { w, h, color: fg, bg, font: CN, weight: 700, size: 0.66, border: fg }); plates.set(key, std({ map: t, roughness: 0.5, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.6, side: THREE.DoubleSide })); }
    return plates.get(key);
  };
  const reflMats = new Map();
  const refl = (b, x, z, len, w, col, y) => {   // a light's reflection laid on the water, pointing at the approaching runner
    let m = reflMats.get(col);
    if (!m) reflMats.set(col, (m = basic({ color: hdr(col, 0.3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
    const dx = -x, dz = 40, d = Math.hypot(dx, dz), L = Math.min(len, ((Math.abs(x) - 12) * d) / Math.abs(dx));
    if (L > 2) b.add(G.plane, m, x + ((dx / d) * L) / 2, y, z + ((dz / d) * L) / 2, w, L, 1, -Math.PI / 2, Math.atan2(-dx, -dz), 0);
  };
  const turners = [];
  const lamps = (b, x, z0, z1, step) => { for (let z = z0; z < z1; z += step) { b.cyl(VC.solid, '#3a2414', x, 1.6, -z, 0.08, 3.2, 'cyl8'); K.lantern(b, x, 3.1, -z, 0.7); } };
  // a timber hall on a stone platform: red columns, lit lattice, one or two swept hip roofs
  const hall = (b, x, z, { w = 14, d = 9, h = 5, base = 1.2, y = 0, double = false, ry = 0 } = {}) => {
    const bw = ry ? d + 3 : w + 3, bd = ry ? w + 3 : d + 3, y0 = y + base;
    stone(b, x, y, z, bw, base, bd);
    for (let k = 0; k < 3; k++) {   // steps down from the platform on the street side
      const hh = base * (1 - k / 3), off = (ry ? bw : bd) / 2 + 0.25 + k * 0.5;
      b.box(VC.solid, '#8a867c', x - (ry ? off * Math.sign(Math.sin(ry)) : 0), y + hh / 2, z + (ry ? 0 : off), ry ? 0.5 : 4, hh, ry ? 4 : 0.5);
    }
    b.add(G.box, K.latticeMat, x, y0 + h * 0.45, z, w - 1.2, h * 0.9, d - 1.2, 0, ry, 0);
    const c = Math.cos(ry), s = Math.sin(ry), n = Math.max(3, Math.round(w / 2.4));
    for (let i = 0; i <= n; i++) for (const lz of [d / 2 - 0.3, -d / 2 + 0.3]) { const lx = -w / 2 + 0.3 + ((w - 0.6) * i) / n; b.cyl(VC.solid, '#8a2a1e', x + c * lx + s * lz, y0 + h / 2, z - s * lx + c * lz, 0.24, h, 'cyl8'); }
    b.add(G.box, VC.solid, x, y0 + h - 0.3, z, w, 0.6, d, 0, ry, 0, '#3a1e14');
    const rh = Math.min(w, d) * 0.3;
    if (double) {
      K.hipRoof(b, x, y0 + h, z, w + 1.0, d + 1.0, rh * 0.45, { ry, lift: 0.6, eave: 1.3 });
      b.add(G.box, K.latticeMat, x, y0 + h + rh * 0.45 + 0.9, z, w - 2.4, 1.8, d - 2.4, 0, ry, 0);
      K.hipRoof(b, x, y0 + h + rh * 0.45 + 1.8, z, w - 1.6, d - 1.6, rh, { ry, lift: 0.7, eave: 1.3 });
    } else K.hipRoof(b, x, y0 + h, z, w, d, rh, { ry, lift: 0.6, eave: 1.3 });
  };
  // a roof-line terrace: Naxi houses on a stone-faced step at height y0, from z0 to z1
  const terraceRow = (b, x0, y0, z0, z1, side = 1) => {
    if (y0 > 0) stone(b, side * (x0 + 5), 0, -(z0 + z1) / 2, 10, y0, z1 - z0, 0xffffff);
    for (let z = z0; z < z1 - 3;) {
      const len = Math.min(rand(7, 10), z1 - z), d = rand(8, 9.5), cx = side * (x0 + d / 2), cz = -(z + len / 2);
      b.addM(buildingGeo(d, 6.6, len, K.house, 2.4, 6.6), K.houseMat, at(cx, y0, cz), pick(['#ffffff', '#f6eadc', '#fff2e4']));
      K.gableRoof(b, cx, y0 + 6.6, cz, len, d, 2.3, Math.PI / 2);
      for (let k = 0; k < 2; k++) K.lantern(b, cx - side * (d / 2 + 0.7), y0 + 3.1, cz - len / 4 + (k * len) / 2, 0.55);
      b.add(G.box, VC.solid, cx - side * (d / 2 + 0.5), y0 + 3.95, cz, 1.1, 0.1, len, 0, 0, side * 0.32, '#2e3036');
      z += len + rand(0, 0.6);
    }
  };
  const bonfire = (b, x, z, s = 1) => {
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI; beam(b, VC.solid, x + Math.cos(a) * 0.9 * s, 0.1, z + Math.sin(a) * 0.9 * s, x - Math.cos(a) * 0.9 * s, 0.3, z - Math.sin(a) * 0.9 * s, 0.16 * s, '#3a2414'); }
    b.add(G.cone8, VC.glowAdd, x, 1.0 * s, z, 1.3 * s, 2.0 * s, 1.3 * s, 0, 0, 0, hdr('#ff7a1a', 1.2));
    b.add(G.cone8, VC.glowAdd, x, 1.3 * s, z, 0.8 * s, 2.4 * s, 0.8 * s, 0, 0.6, 0, hdr('#ffc04a', 1.4));
    b.add(G.cone8, VC.glow, x, 0.6 * s, z, 0.7 * s, 1.0 * s, 0.7 * s, 0, 0, 0, hdr('#ff9a30', 1.2));
    b.add(G.plane, VC.glowAdd, x, 0.06, z, 9 * s, 9 * s, 1, -Math.PI / 2, 0, 0, hdr('#ff8a2a', 0.25));
  };

  // ---------- the old town gate: the great water wheels on the Jade River ----------
  const wheelGroup = (R = 5.4) => {   // turns about x in update()
    const b = new Batcher(), wood = '#5a3a22';
    const rim = new THREE.TorusGeometry(R, 0.16, 6, 64);
    for (const dx of [-0.7, 0.7]) b.add(rim, VC.solid, dx, 0, 0, 1, 1, 1, 0, Math.PI / 2, 0, wood);
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; for (const dx of [-0.7, 0.7]) beam(b, VC.solid, dx, Math.cos(a) * 0.6, Math.sin(a) * 0.6, dx, Math.cos(a) * R, Math.sin(a) * R, 0.16, wood); }
    for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2; b.add(G.box, VC.solid, 0, Math.cos(a) * (R + 0.25), Math.sin(a) * (R + 0.25), 1.6, 0.9, 0.12, a, 0, 0, '#6a4428'); }
    b.add(G.cyl, VC.solid, 0, 0, 0, 1.2, 2.2, 1.2, 0, 0, Math.PI / 2, '#3a2414');
    return b.build();
  };
  const waterWheels = () => {
    const b = new Batcher();
    farGround(b, -1, '#1e1c1c'); farGround(b, 1, '#1e1c1c');
    // right: the Jade River in its stone channel, three wheels turning in it, willows and houses on the far bank
    b.box(VC.solid, '#16262a', 15.3, -0.7, -29, 7.6, 0.2, 58);
    b.add(G.plane, K.canalWater, 15.3, -0.55, -29, 7.4, 58, 1, -Math.PI / 2, 0, 0);
    for (const x of [11.3, 19.3]) stone(b, x, -0.7, -29, 0.6, 1.0, 58, 0xffffff);
    stone(b, 15.3, -0.7, -58.3, 8.6, 1.0, 0.6, 0xffffff);
    for (const zc of [-14, -26, -38]) {
      for (const dx of [-1.25, 1.25]) { K.wood(b, 15.3 + dx, -0.6, zc, 0.35, 6.0, 0.35, '#3a2414'); beam(b, VC.solid, 15.3 + dx, 5.4, zc, 15.3 + dx, -0.6, zc + 3.4, 0.25, '#3a2414'); }
      beam(b, VC.solid, 22.5, 11.4, zc - 4.5, 15.3, 11.1, zc - 0.8, 0.9, '#4a2e1a', 0.7);   // the timber flume feeding it
      b.cyl(VC.solid, '#3a2414', 19.6, 5.7, zc - 2.8, 0.12, 11.4, 'cyl8');
      b.add(G.plane, fallMat, 15.3, 10.65, zc - 0.6, 1.0, 0.9, 1, 0, Math.PI / 2, 0);
      b.add(G.plane, VC.glowAdd, 15.3, -0.45, zc, 4, 9, 1, -Math.PI / 2, 0, 0, hdr('#bfe8ff', 0.18));
    }
    for (let z = 6; z < 56; z += 9) K.willow(b, 21.2, -z, 1.05, { ry: Math.PI });
    K.oldRow(b, 1, 0, 80, { x0: 23.5 });
    b.add(G.plane, plazaMat, 17, 0.04, -69, 13, 22, 1, -Math.PI / 2, 0, 0);
    stone(b, 11.8, 0, -70, 1.2, 5.6, 14, 0xffffff);
    b.add(G.plane, plaque('丽江古城', { bg: '#20262a', fg: '#f2cf72', w: 768, h: 192 }), 11.17, 3.2, -70, 9, 2.25, 1, 0, -Math.PI / 2, 0);
    K.hipRoof(b, 11.8, 5.6, -70, 14.4, 1.6, 0.8, { ry: Math.PI / 2, lift: 0.5, eave: 0.5 });
    lamps(b, EDGE + 0.8, 4, 78, 10);
    // left: the first streets of the old town
    K.oldRow(b, -1, 0, 80);
    K.caravan(b, -(EDGE + 2.4), -20, 4, -1);
    K.crowd(b, EDGE + 1.2, EDGE + 6.2, 2, 78, 14); K.crowd(b, -(EDGE + 1.2), -(EDGE + 6.2), 2, 78, 14);
    const g = b.build();
    for (const zc of [-14, -26, -38]) { const w = wheelGroup(); w.position.set(15.3, 4.9, zc); g.add(w); turners.push([w, 'x', 0.32]); }
    return g;
  };

  // ---------- Sifang Square: the circle dance round a bonfire ----------
  const sifang = () => {
    const b = new Batcher();
    farGround(b, 1, '#1e1c1c'); farGround(b, -1, '#1e1c1c');
    b.add(G.plane, plazaMat, -26.9, 0.04, -40, 32.3, 80, 1, -Math.PI / 2, 0, 0);
    bonfire(b, -26, -38, 1.1);
    for (let k = 0; k < 22; k++) { const a = (k / 22) * Math.PI * 2; K.person(b, -26 + Math.cos(a) * 5.6, -38 + Math.sin(a) * 5.6, { kind: k % 3 ? 'naxi' : 'naxiMan', ry: -a - Math.PI / 2 }); }
    for (let k = 0; k < 10; k++) { const a = rand(0, Math.PI * 2), r = rand(8.5, 12); K.person(b, -26 + Math.cos(a) * r, -38 + Math.sin(a) * r, { kind: 'tourist' }); }
    K.tower(b, -30, 0, -72, { w: 9, tiers: 3, tierH: 3.4, shrink: 0.82 });
    b.add(G.plane, plaque('四方街'), -30, 4.0, -67.4, 3.2, 0.8, 1);
    K.oldRow(b, -1, 0, 60, { x0: 43 });
    for (const [x, z] of [[-14, -14], [-14, -62], [-40, -14]]) { b.cyl(VC.solid, '#3a2414', x, 2.6, z, 0.1, 5.2, 'cyl8'); for (let k = 0; k < 3; k++) K.lantern(b, x + (k - 1) * 0.6, 4.6 - k * 0.6, z, 0.6); }
    for (const z of [10, 24]) { b.cyl(VC.solid, '#d8d4cc', -18, 1.2, -z, 0.04, 2.4); b.add(G.cone8, VC.solid, -18, 2.6, -z, 3.2, 0.7, 3.2, 0, 0, 0, pick(['#c8202c', '#2a6ad8', '#f2c230'])); K.shopGoods(b, -18, -z, -1, 3); }
    // right: the West River with its slab bridges, houses behind
    K.canal(b, 1); K.oldRow(b, 1, 0, 80);
    for (let z = 5; z < 78; z += 10) K.willow(b, EDGE + 3.4, -z, 0.95);
    K.crowd(b, EDGE + 1.2, EDGE + 2.6, 2, 78, 10); K.crowd(b, -(EDGE + 1.2), -(EDGE + 6), 2, 78, 10);
    return b.build();
  };

  // ---------- the Mu Mansion: the stone archway over the street, the council hall behind red walls ----------
  const mufu = () => {
    const b = new Batcher();
    farGround(b, 1, '#1e1c1c'); farGround(b, -1, '#1e1c1c');
    const za = -14;   // 天雨流芳: three bays of stone, the central one high enough for the jetpack
    for (const x of [-11.2, -5.2, 5.2, 11.2]) { stone(b, x, 0, za, 1.1, 16.4, 1.1, '#e8e2d6'); stone(b, x, 0, za, 1.8, 1.4, 2.6, '#d8d2c6'); }
    stone(b, 0, 13.8, za, 11.6, 0.9, 1.2, '#e8e2d6');
    for (const s of [-1, 1]) stone(b, s * 8.2, 11.6, za, 6.2, 0.8, 1.1, '#e8e2d6');
    b.add(G.plane, plaque('天雨流芳', { bg: '#14303a' }), 0, 15.4, za + 0.62, 5.4, 1.35, 1);
    b.add(G.plane, plaque('天雨流芳', { bg: '#14303a' }), 0, 15.4, za - 0.62, 5.4, 1.35, 1, 0, Math.PI, 0);
    K.hipRoof(b, 0, 16.4, za, 12.6, 2.2, 1.5, { lift: 0.7, eave: 0.9, finial: true });
    for (const s of [-1, 1]) K.hipRoof(b, s * 8.2, 13.2, za, 6.6, 2.0, 1.1, { lift: 0.7, eave: 0.8 });
    for (const x of [-8.2, 8.2]) K.lantern(b, x, 10.4, za + 0.9, 0.9);
    // right: the vermilion wall and gate, the council hall on its terrace, the library tower behind
    for (const [z0, z1] of [[22, 36], [44, 80]]) { b.addM(tiledBox(0.8, 5, z1 - z0, 3), K.plasterMat, at(12.2, 2.5, -(z0 + z1) / 2), '#b03a28'); K.gableRoof(b, 12.2, 5, -(z0 + z1) / 2, z1 - z0, 1.2, 0.5, Math.PI / 2, { gable: false, eave: 0.25 }); }
    hall(b, 13.8, -40, { w: 8, d: 4, h: 4.6, base: 0.6, ry: Math.PI / 2, double: true });
    b.add(G.plane, plaque('木府'), 11.4, 7.4, -40, 2.6, 0.9, 1, 0, -Math.PI / 2, 0);
    for (const dz of [-3.4, 3.4]) {   // a pair of stone lions on their plinths
      b.block(VC.solid, '#c8c2b6', 10.6, 0, -40 + dz, 0.9, 1.0, 1.1);
      b.add(G.sph, VC.solid, 10.75, 1.45, -40 + dz, 0.7, 0.9, 0.8, 0, 0, 0, '#d8d2c6');
      b.add(G.sph, VC.solid, 10.45, 2.05, -40 + dz, 0.72, 0.66, 0.74, 0, 0, 0, '#cec8bc');
      b.sph(VC.solid, '#d8d2c6', 10.2, 2.12, -40 + dz, 0.26);
      for (const s2 of [-0.2, 0.2]) b.box(VC.solid, '#cec8bc', 10.3, 1.2, -40 + dz + s2, 0.2, 0.5, 0.16);
    }
    hall(b, 28, -58, { w: 16, d: 11, h: 5.6, base: 2.4, ry: Math.PI / 2, double: true });
    K.tower(b, 30, 0, -26, { w: 8, tiers: 3, tierH: 3.4 });
    b.add(G.plane, plazaMat, 24, 0.04, -50, 22, 56, 1, -Math.PI / 2, 0, 0);
    // left: the mansion square, shops, a caravan coming in
    b.add(G.plane, plazaMat, -18, 0.04, -40, 14, 80, 1, -Math.PI / 2, 0, 0);
    K.oldRow(b, -1, 0, 80, { x0: 25 });
    K.caravan(b, -(EDGE + 3), -48, 5, 1);
    lamps(b, -(EDGE + 0.8), 24, 78, 12); lamps(b, EDGE + 0.8, 24, 78, 12);
    K.crowd(b, EDGE + 1.2, EDGE + 6.2, 2, 78, 10); K.crowd(b, -(EDGE + 1.2), -24, 2, 78, 18);
    return b.build();
  };

  // ---------- Wangu Tower on Lion Hill, a stair of lanterns up to it, terraces of roofs opposite ----------
  const wangu = () => {
    const b = new Batcher();
    farGround(b, 1, '#1e1c1c'); farGround(b, -1, '#1e1c1c');
    const hx = -60, hz = -44;
    b.add(G.sph, VC.solid, hx, -30, hz, 104, 92, 80, 0, 0, 0, '#26402c');   // a broad mound, most of the sphere sunk below the ground
    const hillY = (x, z) => { const u = (x - hx) / 52, v = (z - hz) / 40, q = 1 - u * u - v * v; return q > 0 ? -30 + 46 * Math.sqrt(q) : -1; };
    for (let k = 0; k < 90; k++) { const x = rand(-100, -18), z = -rand(6, 80), y = hillY(x, z); if (y > 0.8) K.pine(b, x, z, rand(0.9, 1.3), { y: y - 0.3 }); }
    const tx = -48, ty = hillY(tx, hz) - 0.4;
    stone(b, tx, ty - 1.2, hz, 16, 2.2, 16, 0xffffff);
    const top = K.tower(b, tx, ty + 1, hz, { w: 9.5, tiers: 5, tierH: 3.4, shrink: 0.84 });
    b.cyl(VC.metal, '#e8b84a', tx, top + 1.2, hz, 0.2, 2.4, 'cyl8');
    for (let k = 0; k < 14; k++) {   // the stair up the hill, lanterns either side
      const x = -12 - k * 2.6, y = Math.max(0, hillY(x, hz)) - 0.2;
      stone(b, x, Math.max(0, y - 0.6), hz, 2.6, 0.6 + Math.min(y, 0.6), 4, 0xffffff);
      if (k % 2 === 0) for (const s of [-1, 1]) K.lantern(b, x, y + 1.6, hz + s * 2.4, 0.55);
    }
    // right: house roofs climbing the slope in terraces, every eave hung with lanterns
    for (let k = 0; k < 5; k++) terraceRow(b, 11.5 + k * 9.5, k * 2.4, k % 2 ? 2 : 0, 80);
    K.oldRow(b, -1, 0, 30); K.oldRow(b, -1, 58, 80);
    lamps(b, EDGE + 0.8, 4, 78, 10);
    K.crowd(b, EDGE + 1.2, EDGE + 6.2, 2, 78, 10); K.crowd(b, -(EDGE + 1.2), -(EDGE + 6.2), 2, 78, 12);
    return b.build();
  };

  // ---------- Black Dragon Pool: the five-arched marble bridge out to the Moon-Embracing Pavilion ----------
  const bridgeGeo = (() => {   // side elevation of a humped bridge with five arches, extruded 4 m
    const L = 36, sh = new THREE.Shape(), deck = (x) => 0.4 + 2.8 * Math.sin((Math.PI * x) / L), arches = [[4.5, 1.2], [11, 2.0], [18, 2.6], [25, 2.0], [31.5, 1.2]];
    sh.moveTo(0, -0.6);
    for (let k = 0; k <= 24; k++) { const x = (L * k) / 24; sh.lineTo(x, deck(x)); }
    sh.lineTo(L, -0.6);
    for (let i = arches.length - 1; i >= 0; i--) {
      const [cx, r] = arches[i];
      sh.lineTo(cx + r, -0.6);
      for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI; sh.lineTo(cx + Math.cos(a) * r, -0.6 + Math.sin(a) * r * 1.05); }
    }
    sh.lineTo(0, -0.6);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 4, bevelEnabled: false, curveSegments: 4 });
    g.translate(0, 0, -2);
    return { g, deck, L };
  })();
  const blackDragon = () => {
    const b = new Batcher();
    farGround(b, 1, '#1e1c1c'); farGround(b, -1, '#14181c', -0.8);
    b.add(G.plane, pool, -80.9, -0.4, -40, 140.3, 80, 1, -Math.PI / 2, 0, 0);
    const { g: bg, deck, L } = bridgeGeo, bz = -44;
    b.addM(bg, marble, new THREE.Matrix4().makeRotationY(Math.PI).setPosition(-11.5, 0, bz), 0xffffff);
    for (let k = 0; k <= 18; k++) { const x = (L * k) / 18; for (const s of [-1, 1]) { b.box(VC.solid, '#f4f2ec', -11.5 - x, deck(x) + 0.5, bz + s * 1.9, 0.18, 1.0, 0.18); } }
    for (const s of [-1, 1]) for (let k = 0; k < 18; k++) { const x0 = (L * k) / 18, x1 = (L * (k + 1)) / 18; beam(b, VC.solid, -11.5 - x0, deck(x0) + 0.95, bz + s * 1.9, -11.5 - x1, deck(x1) + 0.95, bz + s * 1.9, 0.12, '#f4f2ec'); }
    const px = -11.5 - L - 7;
    stone(b, px, -0.6, bz, 14, 1.8, 14, 0xffffff);
    K.tower(b, px, 1.2, bz, { w: 8.5, tiers: 3, tierH: 3.2, shrink: 0.8 });
    for (const [dx, dz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) K.willow(b, px + dx, bz + dz, 1.0, { ry: rand(0, 6), y: 1.2 });
    refl(b, px, bz, 70, 6, '#ffc870', -0.35); refl(b, px + 4, bz - 4, 60, 3, '#ff6a3a', -0.35);
    for (let z = 3; z < 78; z += 4) if (Math.abs(z + bz) > 3.5) { b.box(VC.solid, '#e8e6e0', -11.3, 0.5, -z, 0.25, 1.0, 0.25); beam(b, VC.solid, -11.3, 0.95, -z, -11.3, 0.95, -Math.min(z + 4, 79), 0.12, '#e8e6e0'); }
    for (let z = 4; z < 78; z += 9) if (z < 14 || z > 66) K.willow(b, -(EDGE + 6.3), -z, rand(0.95, 1.1), { ry: 0 });   // left open toward the bridge and the pavilion
    // right: the park, the Five Phoenix Tower among pines, a small pavilion by the path
    b.add(G.plane, plazaMat, 24, 0.04, -40, 26, 80, 1, -Math.PI / 2, 0, 0);
    K.tower(b, 28, 0.6, -50, { w: 10, tiers: 3, tierH: 3.4, shrink: 0.78 });
    stone(b, 28, 0, -50, 14, 0.6, 14, 0xffffff);
    K.tower(b, 17, 0, -18, { w: 5, tiers: 1, tierH: 3.2, open: true });
    for (let k = 0; k < 14; k++) K.pine(b, rand(16, 44), -rand(4, 78), rand(0.9, 1.2));
    for (let z = 6; z < 78; z += 11) K.willow(b, EDGE + 4.6, -z, 0.95);
    lamps(b, EDGE + 0.8, 4, 78, 12);
    K.crowd(b, EDGE + 1.2, EDGE + 6.2, 2, 78, 10); K.crowd(b, -(EDGE + 1.2), -(EDGE + 5.6), 2, 78, 10);
    return b.build();
  };

  // ---------- Baisha: earthen lanes running at the snow mountain, the great tree, the murals ----------
  const baisha = () => {
    const b = new Batcher();
    farGround(b, 1, '#2a2420'); farGround(b, -1, '#2a2420');
    K.villageRow(b, -1, 0, 26); K.villageRow(b, -1, 54, 80);
    // left: the little square under the great old tree, women embroidering in its shade
    b.add(G.plane, plazaMat, -22, 0.04, -40, 22, 26, 1, -Math.PI / 2, 0, 0);
    b.cyl(VC.solid, '#8a8478', -22, 0.3, -40, 5.2, 0.6); b.cyl(VC.solid, '#6a6458', -22, 0.62, -40, 4.6, 0.05);
    K.walnut(b, -22, -40, 2.4, { y: 0.6 });
    for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; K.person(b, -22 + Math.cos(a) * 5.6, -40 + Math.sin(a) * 5.6, { kind: 'naxi', seated: true, ry: -a - Math.PI / 2, y0: 0.6 }); }
    K.horse(b, -14, -30, Math.PI / 2, { pack: false }); K.horse(b, -14, -33, Math.PI / 2, { pack: false });
    b.add(G.plane, plaque('白沙刺绣', { bg: '#3a1a12' }), -11.3, 2.6, -56, 2.4, 0.6, 1, 0, Math.PI / 2, 0);
    // right: the temple court of the murals, its gate on the lane, the hall open on to the painted walls
    K.villageRow(b, 1, 0, 34); K.villageRow(b, 1, 70, 80);
    K.adobe(b, 11.5, 0, -52, 0.7, 3.2, 36, '#e8d4bc');
    K.gableRoof(b, 11.5, 3.2, -52, 36, 0.9, 0.35, Math.PI / 2, { gable: false, eave: 0.15 });
    hall(b, 13.2, -52, { w: 5, d: 3, h: 3.6, base: 0.5, ry: Math.PI / 2 });
    b.add(G.plane, plaque('大宝积宫'), 10.15, 3.4, -52, 2.6, 0.65, 1, 0, -Math.PI / 2, 0);
    hall(b, 26, -54, { w: 14, d: 9, h: 5, base: 1.0, ry: Math.PI / 2 });
    b.add(G.plane, muralMat, 21.95, 3.6, -54, 12, 4.2, 1, 0, -Math.PI / 2, 0);
    for (const z of [42, 66]) K.walnut(b, 34, -z, 1.4);
    K.rapeseed(b, -50, -34, 26, 54);
    K.caravan(b, EDGE + 2.6, -20, 3, -1);
    K.yak(b, EDGE + 3.2, -70, Math.PI * 0.2);
    K.crowd(b, EDGE + 1.2, EDGE + 6, 2, 78, 8); K.crowd(b, -(EDGE + 1.2), -(EDGE + 6), 2, 78, 8);
    return b.build();
  };

  // ---------- Blue Moon Valley: turquoise terraces under the snow mountain ----------
  const blueMoon = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {   // three terraces stepping down and away from the track, waterfalls over each dam
        const x0 = 11 + k * 10, wy = -0.5 - k * 1.6, ww = k === 2 ? 15.5 : 10;
        b.add(G.plane, blue, s * (x0 + ww / 2), wy, -40, ww, 80, 1, -Math.PI / 2, 0, 0);
        for (let z = 0; z < 80; z += 8) {
          const zz = -(z + 4), dx = rand(-0.4, 0.4), top = k ? -0.5 - (k - 1) * 1.6 : 0.25;
          b.box(VC.solid, '#e8eef0', s * (x0 + dx), (top + wy - 0.4) / 2, zz, 1.2, top - wy + 0.4, 8.2);
          if (k) b.add(G.plane, fallMat, s * (x0 + dx + 0.62), (top + wy) / 2, zz, 7.6, top - wy, 1, 0, Math.PI / 2, 0);
        }
      }
      b.box(VC.solid, '#3a4248', s * 47.2, -3, -40, 2, 5, 80);
      for (let k = 0; k < 7; k++) {   // rocky slopes with snow patches closing the valley
        const x = s * rand(52, 90), z = -rand(4, 76), h = rand(18, 42), w = rand(16, 30);
        b.add(G.cone4, VC.solid, x, h / 2 - 4, z, w, h, w * rand(0.8, 1.3), 0, rand(0, 3), 0, pick(['#4a4e58', '#565a62', '#3e424a']));
        b.add(G.cone4, VC.solid, x, h - 4 - h * 0.18, z, w * 0.36, h * 0.36, w * 0.4, 0, rand(0, 3), 0, '#e8eef8');
      }
      for (let k = 0; k < 10; k++) K.pine(b, s * rand(44, 70), -rand(4, 78), rand(1.0, 1.4), { y: -2 });
      for (let k = 0; k < 6; k++) K.peach(b, s * (EDGE + rand(5, 6.5)), -rand(4, 78), rand(0.55, 0.75));
      refl(b, s * 18, -40, 60, 4, '#fff0d0', -0.45);
    }
    K.yak(b, EDGE + 3, -24); K.yak(b, -(EDGE + 3.4), -46); K.yak(b, EDGE + 2.6, -62);
    b.add(G.sph, VC.solid, -(EDGE + 4.2), 1.2, -16, 4.2, 3.2, 3, 0, 0.3, 0, '#7a7a74');
    b.add(G.plane, plaque('玉龙雪山', { bg: '#7a7a74', fg: '#c8201a', w: 512, h: 160 }), -(EDGE + 1.75), 1.5, -16.4, 2.6, 0.8, 1, 0, Math.PI / 2 + 0.3, 0);
    b.add(G.plane, plaque('蓝月谷'), EDGE + 1.4, 2.4, -6, 2.2, 0.55, 1, 0, -Math.PI / 2, 0);
    b.cyl(VC.solid, '#3a2414', EDGE + 1.4, 1.1, -6, 0.08, 2.2, 'cyl8');
    K.crowd(b, EDGE + 1.2, EDGE + 5.4, 4, 78, 6, { kind: 'tourist' }); K.crowd(b, -(EDGE + 1.2), -(EDGE + 5.4), 4, 78, 6, { kind: 'tourist' });
    return b.build();
  };

  return {
    landmarks: [
      { name: '丽江古城 · 大水车', en: 'LIJIANG OLD TOWN', build: waterWheels },
      { name: '四方街', en: 'SIFANG SQUARE', build: sifang },
      { name: '木府', en: 'MU MANSION', build: mufu },
      { name: '万古楼 · 狮子山', en: 'WANGU TOWER', build: wangu },
      { name: '黑龙潭 · 得月楼', en: 'BLACK DRAGON POOL', build: blackDragon },
      { name: '白沙古镇', en: 'BAISHA OLD TOWN', build: baisha },
      { name: '玉龙雪山 · 蓝月谷', en: 'BLUE MOON VALLEY', build: blueMoon },
    ],
    update(t) {
      for (const [o, ax, k] of turners) o.rotation[ax] = t * k;
      pool.userData.scroll.offset.y = -t * 0.01; blue.userData.scroll.offset.y = -t * 0.03; ft.offset.y = t * 1.6;
    },
  };
}
