// Moscow's landmark scenes, in the order the run meets them: Red Square with St Basil's, the Spasskaya Tower and the GUM
// rink; the Kremlin's wall and towers along the frozen Moskva; the Bolshoi on Theatre Square; the gilded vault of Komsomolskaya station; the
// Arbat; Christ the Saviour by the river with the Patriarch's Bridge overhead; Gorky Park's gate, its rink and the
// Crimean Bridge; the Novodevichy Convent over its frozen pond; Moscow-City's glass and the Bagration Bridge; VDNKh's
// arch, the Friendship of Nations fountain and the Vostok rocket. Every sign is in Russian.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, rand, randi, pick, chance } from '../core.js';
import { at, EDGE, farGround, waterMat } from './common.js';
import { beam } from './tokyo_kit.js';
import { frame, taperGeo } from './ny_icons.js';
import { SANS, SERIF, OLD, SNOW, ARBAT_SIGNS, OLD_SIGNS, face } from './moscow_kit.js';
import { stBasil, basilDomes, kremlinWall, kremlinTower, ivanBell, kremlinCathedral, bolshoi, christSaviour, church, dome, cityTower, STAR, ONION } from './moscow_icons.js';

const I4 = new THREE.Matrix4();
// floodlighting: the emissive glow is strongest at the foot of a wall and fades with height, scaled by the vertex colour
function uplit(mat, h = 16, lo = 1.4, hi = 0.35) {
  const prev = mat.onBeforeCompile, key = mat.customProgramCacheKey();
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.vertexShader = 'varying float vUpY;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vUpY = (modelMatrix * vec4(transformed, 1.0)).y;');
    sh.fragmentShader = 'varying float vUpY;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance *= mix(${lo.toFixed(2)}, ${hi.toFixed(2)}, smoothstep(0.0, ${h.toFixed(1)}, abs(vUpY)));
  #ifdef USE_COLOR
    totalEmissiveRadiance *= vColor;
  #endif`);
  };
  mat.customProgramCacheKey = () => `${key}|up${h}|${lo}|${hi}`;
  return mat;
}
// a box whose UVs tile a texture every s metres
function tiled(w, h, d, s = 2) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / s, (uv.getY(i) * dims[f][1]) / s); }
  return g;
}

// ---------- textures ----------
function settsTex() {   // Red Square's dark setts in their rows, snow swept into the joints and lying in soft drifts
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#34323a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 12) for (let x = -randi(0, 12); x < w;) { const sw = randi(9, 16), v = randi(-12, 12); g.fillStyle = `rgb(${70 + v},${64 + v},${66 + v})`; g.fillRect(x + 1, y + 1, sw - 2, 10); x += sw; }
    for (let y = 0; y < h; y += 12) { g.fillStyle = `rgba(214,220,234,${rand(0.15, 0.4).toFixed(2)})`; g.fillRect(0, y, w, 1.5); }
    for (let i = 0; i < 26; i++) {   // drifts, drawn wrapped so the tile repeats cleanly
      const x = rand(0, w), y = rand(0, h), r = rand(12, 46), sx = rand(0.6, 1.6);
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
        const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        gr.addColorStop(0, 'rgba(232,236,246,0.8)'); gr.addColorStop(0.6, 'rgba(226,230,242,0.35)'); gr.addColorStop(1, 'rgba(226,230,242,0)');
        g.save(); g.translate(x + dx, y + dy); g.scale(sx, 1); g.translate(-x - dx, -y - dy); g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r); g.restore();
      }
    }
  });
}
function floorTex() {   // the station's polished floor: slabs of grey and red granite laid as a chequer
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#6a6670'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { const v = randi(-8, 8); g.fillStyle = (x + y) % 64 ? `rgb(${150 + v},${146 + v},${148 + v})` : `rgb(${132 + v},${66 + v},${58 + v})`; g.fillRect(x + 1, y + 1, 30, 30); }
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${rand(0.04, 0.18).toFixed(2)})`; g.fillRect(rand(0, w), rand(0, h), 1, 1); }
  });
}
function iceTex() {   // a rink's ice, scratched by the skates
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c8dcee'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(255,255,255,${rand(0.15, 0.45)})`; g.lineWidth = rand(0.5, 1.5); g.beginPath(); const x = rand(0, w), y = rand(0, h), a = rand(0, 6.28), l = rand(20, 90); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + rand(-10, 10), y + Math.sin(a) * l * 0.5 + rand(-10, 10), x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  });
}
function mosaicTex() {   // a metro mosaic: a gilded ground, an ornament of fruit and laurel in smalt, a frame
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c89a3a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 6) for (let x = 0; x < w; x += 6) { g.fillStyle = `rgba(${255},${randi(200, 240)},${randi(110, 160)},${rand(0.15, 0.45)})`; g.fillRect(x, y, 5, 5); }
    g.strokeStyle = '#7a1a1a'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20);
    g.strokeStyle = '#f4ecd0'; g.lineWidth = 3; g.strokeRect(20, 20, w - 40, h - 40);
    const cx = w / 2, cy = h / 2;
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.fillStyle = k % 2 ? '#2a6a3a' : '#3a8a4a'; g.beginPath(); g.ellipse(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62, 22, 9, a + Math.PI / 2, 0, Math.PI * 2); g.fill(); }
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.26; g.fillStyle = pick(['#c8302a', '#e8802a', '#8a2a6a']); g.beginPath(); g.arc(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40, 11, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#1a3a8a'; g.beginPath(); g.arc(cx, cy, 26, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f0d070'; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24); g.lineTo(cx + Math.cos(a + 0.3) * 12, cy + Math.sin(a + 0.3) * 12); g.closePath(); g.fill(); }
  });
}
function vaultTex() {   // the station's vault: cream stucco, coffers picked out in white and gold
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f2d890'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) {
      g.fillStyle = '#fbf2d8'; g.fillRect(x + 6, y + 6, 52, 52);
      g.fillStyle = '#ecd088'; g.fillRect(x + 14, y + 14, 36, 36);
      g.fillStyle = '#d8a840'; g.beginPath(); g.arc(x + 32, y + 32, 8, 0, Math.PI * 2); g.fill();
    }
  });
}
function graffitiTex() {   // the Tsoi wall: years of messages in marker and spray, ЦОЙ ЖИВ over all of it
  return canvasTex(512, 160, (g, w, h) => {
    g.fillStyle = '#6a6460'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.fillStyle = pick(['#ff3d6a', '#3dd6ff', '#ffd23d', '#7cff5a', '#ffffff', '#1a1a1a', '#b46bff', '#ff7a2a']); g.globalAlpha = rand(0.4, 0.9); g.font = `700 ${randi(10, 26)}px ${SANS}`; g.save(); g.translate(rand(0, w), rand(10, h)); g.rotate(rand(-0.4, 0.4)); g.fillText(pick(['КИНО', 'ЗВЕЗДА', 'ГРУППА КРОВИ', 'ЛЕТО', 'ПЕРЕМЕН', 'СПАСИБО', '♥', '1962', 'ВИКТОР', 'КУКУШКА', 'МЫ ЖДЁМ']), 0, 0); g.restore(); }
    g.globalAlpha = 1; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 92px ${SANS}`; g.lineWidth = 10; g.strokeStyle = '#141414'; g.strokeText('ЦОЙ ЖИВ', w / 2, h / 2 + 6); g.fillStyle = '#ffffff'; g.fillText('ЦОЙ ЖИВ', w / 2, h / 2 + 6);
  });
}
function gumTex() {   // GUM's front: pale stone, two tiers of round-headed windows lit warm, the shop arcade below
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#ece4d6'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) for (const [y0, y1] of [[40, 96], [122, 178]]) {
      g.fillStyle = '#5a4a3a'; g.fillRect(x + 7, y0 - 2, 18, y1 - y0 + 4); g.beginPath(); g.arc(x + 16, y0, 9, Math.PI, 0); g.fill();
      const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#ffe6b0'); gr.addColorStop(1, '#ffc070');
      g.fillStyle = gr; g.fillRect(x + 9, y0, 14, y1 - y0); g.beginPath(); g.arc(x + 16, y0, 7, Math.PI, 0); g.fill();
      g.fillStyle = '#d8ccb8'; g.fillRect(x, y0 - 12, 3, y1 - y0 + 16);
    }
    g.fillStyle = '#d8ccb8'; g.fillRect(0, 108, w, 8); g.fillRect(0, 196, w, 10);
    for (let x = 0; x < w; x += 64) { g.fillStyle = '#ffd890'; g.fillRect(x + 8, 212, 48, 44); g.fillStyle = '#5a4a3a'; g.fillRect(x + 30, 212, 4, 44); }
  });
}
function inscriptionTex(text, { w = 2048, h = 128, color = '#f0c860', bg = '#2a2230', font = SANS, weight = 700 } = {}) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    let px = Math.floor(h * 0.62); g.font = `${weight} ${px}px ${font}`;
    const m = g.measureText(text).width; if (m > w * 0.94) { px = Math.floor((px * w * 0.94) / m); g.font = `${weight} ${px}px ${font}`; }
    g.fillText(text, w / 2, h / 2 + 4);
  }, { repeat: false });
}

export function mskLandmarks(K) {
  const upd = [];
  // the scenes' materials: floodlit stone and brick, gold, a frozen river, rinks of ice
  const wallLit = uplit(std({ vertexColors: true, roughness: 0.8, emissive: '#ffd8b0', emissiveIntensity: 0.2 }), 26, 1.1, 0.3);
  const brickLit = uplit(std({ vertexColors: true, roughness: 0.85, emissive: '#ff9a70', emissiveIntensity: 0.3 }), 16, 1.3, 0.4);
  const goldLit = uplit(std({ vertexColors: true, metalness: 0.55, roughness: 0.32, emissive: '#ffb848', emissiveIntensity: 0.45 }), 80, 1, 1);   // gilding that keeps the last of the sun
  const S = { ...K.S, wall: wallLit, brick: brickLit, gold: goldLit, cWall: '#e6dfd2', cTrim: '#f2eee6', cBrick: '#b4503e', cBrick2: '#963c30' };
  const brickFace = uplit(std({ map: K.brickMat.map, vertexColors: true, roughness: 0.85, emissive: '#ff9a70', emissiveMap: K.brickMat.map, emissiveIntensity: 0.3 }), 16, 1.3, 0.4);   // brickwork for the long faces of the Kremlin wall
  const domeMat = (t) => std({ map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.42, roughness: 0.45, metalness: 0.25 });
  const D = basilDomes(domeMat);
  const st = settsTex(); st.repeat.set(1, 1);
  const settsMat = std({ map: st, roughness: 0.7 });
  const it = iceTex();
  const iceMat = std({ map: it, roughness: 0.15, metalness: 0.3, emissive: '#cfe0ff', emissiveMap: it, emissiveIntensity: 0.25 });
  const river = waterMat('#141c30', 8);
  upd.push((t) => { river.userData.scroll.offset.set(t * 0.004, t * 0.02); });
  const plane = (b, mat, x, z, w, d, y = 0.05, k = 6) => b.add(K.tiledPlane(w, d, k), mat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0);
  const sides = (b, mat, x1, y = 0.035, k = 6) => { for (const s of [-1, 1]) plane(b, mat, s * (EDGE + x1) / 2, -40, x1 - EDGE, 80, y, k); };   // ground either side of the track, out to x1
  const reflGold = basic({ map: streak(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hdr('#ffc870', 0.9) });
  const skater = (b, x, z) => {   // someone on skates, gliding, leaning, arms out
    const ry = rand(0, Math.PI * 2), ca = Math.cos(ry), sa = Math.sin(ry);
    K.person(b, x, z, { ry, puffer: chance(0.6), hat: pick(['knit', 'knit', 'fur', 'none']), bag: false });
    for (const e of [-1, 1]) beam(b, VC.solid, x + e * 0.26 * ca, 1.42, z - e * 0.26 * sa, x + e * 0.75 * ca, 1.15, z - e * 0.75 * sa, 0.1, pick(['#c8202a', '#2a4a9a', '#1a1a1e']));
  };
  const floes = (b, x0, x1, z0, z1, n, y) => {   // plates of ice drifting on the river
    for (let k = 0; k < n; k++) b.add(G.cyl6, VC.solid, rand(x0, x1), y + 0.05, -rand(z0, z1), rand(2, 7), 0.12, rand(1.5, 5), 0, rand(0, 3), 0, pick(['#e8ecf4', '#dde2ee', '#f2f4fa']));
  };

  // ---------- 0 · 红场 · 圣瓦西里大教堂 ----------
  const gt = gumTex(), gumMat = uplit(std({ map: gt, emissiveMap: gt, emissive: '#ffffff', emissiveIntensity: 0.5, roughness: 0.8 }), 20, 1.0, 0.5);
  const bulbs = (b, x0, y0, z0, x1, y1, z1, step = 0.8) => {   // the outline lamps GUM is strung with
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0, z1 - z0) / step));
    for (let k = 0; k <= n; k++) { const t = k / n; b.box(VC.glow, hdr('#fff0c8', 2.4), x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t, 0.12, 0.12, 0.12); }
  };
  const gum = (b, x, z0, z1) => {   // the Upper Trading Rows: three storeys of arcades, little towers along the roof, lamps on every line
    const L = z1 - z0, zc = -(z0 + z1) / 2, H = 15;
    b.addM(new THREE.BoxGeometry(14, H, L), VC.solid, at(x - 7, H / 2, zc), '#d8ccb8');
    const g = new THREE.PlaneGeometry(L, H), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (uv.getX(i) * L) / 16);
    b.addM(g, gumMat, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(x + 0.02, H / 2, zc), 0xffffff);
    for (const zz of [z0 + 1, (z0 + z1) / 2, z1 - 1]) {   // the towers with their tent roofs
      b.block(VC.solid, '#e8dcc8', x - 2, H, -zz, 5, 4, 5);
      b.add(G.cone4, VC.solid, x - 2, H + 4 + 2.6, -zz, 5.2, 5.2, 5.2, 0, 0, 0, '#5a6a6a');
      b.add(G.cone4, VC.solid, x - 2, H + 4 + 2.7, -zz, 4.6, 4.8, 4.6, 0, 0, 0, SNOW);
      bulbs(b, x + 0.12, H, -zz - 2.5, x + 0.12, H + 4, -zz - 2.5); bulbs(b, x + 0.12, H, -zz + 2.5, x + 0.12, H + 4, -zz + 2.5);
    }
    b.box(VC.solid, '#f0e8d8', x + 0.2, H, zc, 0.6, 0.6, L);
    b.box(VC.solid, SNOW, x - 6, H + 0.32, zc, 13, 0.14, L);
    bulbs(b, x + 0.1, H + 0.35, -z0, x + 0.1, H + 0.35, -z1);
    bulbs(b, x + 0.1, 0.4, -z0, x + 0.1, H, -z0); bulbs(b, x + 0.1, 0.4, -z1, x + 0.1, H, -z1);
    for (let zz = z0 + 4; zz < z1 - 2; zz += 8) bulbs(b, x + 0.1, 7.2, -zz, x + 0.1, 7.2, -zz - 4);
  };
  const museum = (b, x, z) => {   // the State Historical Museum: red brick, white trim, its towers with silver tents and gold eagles' perches
    const F = frame(b, x, 0, z, 1, -Math.PI / 2);
    F.block(S.brick, '#c86a54', 0, 0, 0, 28, 14, 14);
    F.box(S.wall, S.cTrim, 0, 14, 0, 28.6, 0.6, 14.6);
    for (const [tx, h, w] of [[-11, 26, 4.4], [-5, 22, 3.4], [5, 22, 3.4], [11, 26, 4.4]]) {
      F.block(S.brick, '#c86a54', tx, 14, 6.4, w, h - 14, w);
      F.add(G.cone8, S.roof, tx, h + 3.2, 6.4, w * 0.9, 6.4, w * 0.9, 0, 0, 0, '#a8b0b8');
      F.add(G.sphLow, S.gold, tx, h + 6.8, 6.4, 0.8, 0.8, 0.8, 0, 0, 0, S.cGold);
    }
    for (let k = -3; k <= 3; k++) for (const y of [4.6, 10]) { F.box(S.glow, hdr('#ffc878', 0.8), k * 3.6, y, 7.02, 1.0, 2.4, 0.05); F.box(S.wall, S.cTrim, k * 3.6, y + 1.45, 7.05, 1.5, 0.3, 0.1); }
    F.add(G.cone4, S.roof, 0, 14 + 2, 0, 30, 4, 18, 0, 0, 0, SNOW);
  };
  const redSquare = () => {
    const b = new Batcher();
    sides(b, settsMat, 56, 0.035, 8);
    // the right: the museum, then the Kremlin wall with its blue spruces, the Senate Tower and Spasskaya at the far end
    museum(b, 26, -14);
    kremlinWall(frame(b, 32, 0, -55, 1, Math.PI / 2), S, -25, 25, { h: 10, t: 3.4 });
    kremlinTower(frame(b, 33, 0, -36, 0.9, 0), S, { w: 7, h: 13, star: false, tiers: 1, round: true });
    kremlinTower(frame(b, 33, 0, -74, 0.7, -Math.PI / 2), S, { w: 10, h: 16, star: true, clock: true });
    for (let z = 33; z < 72; z += 6.5) K.spruce(b, 28.4, -z, rand(1.1, 1.3), { lights: false, baubles: false, star: false });
    for (let z = 20; z < 76; z += 10) b.box(VC.glow, hdr('#ffd8a8', 2.0), 30.2, 0.15, -z, 0.4, 0.2, 0.6);
    // the left: GUM strung with lights, its rink and the great tree; St Basil's at the far end
    gum(b, -26, 0, 40);
    plane(b, iceMat, -14, -24, 14, 34, 0.06, 6);
    for (const [x, z, w, d] of [[-7, -24, 0.3, 34], [-21, -24, 0.3, 34], [-14, -7, 14, 0.3], [-14, -41, 14, 0.3]]) b.block(VC.solid, '#e8e8f0', x, 0, z, w, 1.0, d);
    for (let k = 0; k < 18; k++) skater(b, rand(-20, -8), -rand(9, 39));
    K.yolka(b, -14, -24, 2.4);
    for (let z = 8; z < 40; z += 3.2) for (const x of [-7, -21]) b.sph(VC.glow, hdr(pick(['#ff4a4a', '#ffd890', '#4ad8ff']), 2.2), x, 1.15, -z, 0.08, true);
    stBasil(frame(b, -26, 0, -64, 0.9, Math.PI * 0.85), S, D);
    for (let z = 4; z < 78; z += 18) K.lamp(b, -5.4, -z, -1);
    K.crowd(b, -4.6, -6.5, 2, 78, 12); K.crowd(b, 4.6, 22, 2, 78, 22);
    return b.build();
  };

  // ---------- 1 · 克里姆林宫 · 莫斯科河 ----------
  const kremlinRiver = () => {
    const b = new Batcher(), yw = -1.4, hill = 6, run = 6, wx = 19.9, x0 = wx + 1.7, x1 = x0 + run;
    // the left: the granite parapet, the river and its floes, the old houses of the Sofiyskaya embankment, their lamps in the water
    b.box(VC.solid, '#8a8a90', -11.4, -1.4, -40, 1.0, 3.2, 80);
    b.box(VC.solid, '#a8a8b0', -11.4, 0.55, -40, 1.2, 0.5, 80);
    b.box(VC.solid, SNOW, -11.4, 0.85, -40, 1.1, 0.12, 80);
    b.add(G.plane, river, -36.5, yw, -40, 50, 80, 1, -Math.PI / 2, 0, 0);
    b.box(VC.solid, '#5a5a62', -36.5, -0.8, -79.95, 50, 1.4, 0.1);
    floes(b, -14, -58, 2, 78, 18, yw);
    b.box(VC.solid, '#5a5a62', -61.5, -0.9, -40, 1.0, 3, 80);
    plane(b, K.snowMat, -100, -40, 76, 80, 0.04, 6);
    K.mansionRow(b, -1, 0, 80, { x0: 68, signs: OLD_SIGNS });
    for (let z = 10; z < 80; z += 16) {
      K.lamp(b, -64, -z, 1, { pool: 0 });
      b.add(G.plane, reflGold, -48.4, yw + 0.04, -z + 12.6, 2.4, 40, 1, -Math.PI / 2, 0.89, 0);   // each lamp's streak on the water, running toward the track
    }
    for (let z = 6; z < 80; z += 16) K.lamp(b, -9.2, -z, -1, { heads: 2 });
    // the right: the pavement under the Kremlin wall and its towers, the wooded hill rising behind
    K.snowField(b, 14.5, -40, 7.5, 80, 0.035);
    kremlinWall(frame(b, wx, 0, -40, 1, -Math.PI / 2), S, -40, 40, { h: 7, t: 3.4 });   // low here by the river, so the hill shows over it
    b.add(K.tiledPlane(80, 7, 3), brickFace, wx - 1.72, 3.5, -40, 80, 7, 1, 0, -Math.PI / 2, 0, '#ffffff');
    b.box(VC.solid, '#b8aca0', wx - 1.75, 0.3, -40, 0.1, 0.6, 80);   // the white-stone plinth
    for (const [z, o] of [[-5, { w: 9, h: 15, round: true, star: true }], [-25, { w: 6.4, h: 12, tiers: 2 }], [-45, { w: 8, h: 14 }], [-62, { w: 6, h: 11 }], [-76, { w: 7, h: 12, tiers: 2 }]]) kremlinTower(frame(b, wx, 0, z, 1, -Math.PI / 2), S, o);
    for (let z = 12; z < 80; z += 16) K.lamp(b, 12.6, -z, 1);
    b.add(G.box, VC.solid, (x0 + x1) / 2, hill / 2 - 0.25, -40, Math.hypot(run, hill), 0.5, 80, 0, 0, Math.atan2(hill, run), SNOW);
    b.block(VC.solid, '#c8ccd8', x1 + 55, 0, -40, 110, hill, 80);
    plane(b, K.snowMat, x1 + 55, -40, 110, 80, hill + 0.03, 8);
    for (let z = 3; z < 78; z += rand(4, 7)) { const x = rand(x0 + 1, x1 - 0.5); K.bareTree(b, x, -z, rand(0.8, 1.0), { y: ((x - x0) * hill) / run - 0.3 }); }
    // on the hill: the Grand Kremlin Palace along the brow, the cathedrals' gold beside and behind it, Ivan the Great over everything
    const pal = frame(b, x1 + 13, hill, -22, 1, -Math.PI / 2), ph = 17;
    pal.block(S.wall, '#ecd8a8', 0, 0, 0, 40, ph, 16);
    pal.box(S.wall, S.cTrim, 0, ph, 0, 40.6, 0.8, 16.6);
    pal.box(S.wall, S.cTrim, 0, 6.2, 0, 40.4, 0.5, 16.4);
    for (let k = 0; k < 15; k++) for (const y of [9.0, 13.4]) { pal.box(S.glow, S.cWin, -18.2 + k * 2.6, y, 8.02, 1.0, 2.8, 0.05); pal.box(S.wall, S.cTrim, -18.2 + k * 2.6, y + 1.7, 8.05, 1.5, 0.35, 0.1); }
    pal.add(G.cone4, S.roof, 0, ph + 2.2, 0, 40 * 1.414, 3.6, 16 * 1.414, 0, 0, 0, SNOW);
    pal.block(S.wall, '#ecd8a8', 0, ph, 0, 7, 5.5, 7);   // the belvedere, the flag over it
    pal.add(G.cone4, S.roof, 0, ph + 6.9, 0, 10, 2.8, 10, 0, 0, 0, '#5a6a62');
    pal.cyl(S.gold, S.cGold, 0, ph + 9.8, 0, 0.08, 3.2);
    for (const [y, c] of [[11.0, '#f4f4f4'], [10.6, '#2a5ab0'], [10.2, '#d8202a']]) pal.box(S.wall, c, 0.95, ph + y, 0, 1.8, 0.4, 0.05);
    kremlinCathedral(frame(b, x1 + 12, hill, -52, 0.9, -Math.PI / 2), S, { w: 15, h: 12 });   // the Annunciation
    ivanBell(frame(b, x1 + 9, hill, -72, 1, 0), S, 1.35);   // Ivan the Great, near the brow past the palace's end, where the run sees it between the towers
    kremlinCathedral(frame(b, x1 + 30, hill, -58, 0.8, -Math.PI / 2), S, { w: 14, h: 11 });   // the Archangel
    kremlinCathedral(frame(b, x1 + 30, hill, -34, 1.0, -Math.PI / 2), S, { w: 16, h: 13 });   // the Dormition
    K.crowd(b, -4.6, -9.8, 2, 78, 14); K.crowd(b, 4.6, 14.5, 2, 78, 16);
    return b.build();
  };
  function streak() {   // light on water: a rippled streak fading toward the viewer
    return canvasTex(32, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      for (let y = 0; y < h; y += 3) { const a = Math.pow(1 - y / h, 1.5) * rand(0.4, 1), ww = w * rand(0.3, 1) * (1 - (y / h) * 0.5); g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; g.fillRect((w - ww) / 2, y, ww, 2); }
    }, { repeat: false });
  }

  // ---------- 2 · 大剧院 ----------
  const metropol = (b, x, z0, z1) => {   // the Metropol: an Art Nouveau front, its curved gables over the roof line, a band of majolica
    const L = z1 - z0, zc = -(z0 + z1) / 2;
    b.addM(new THREE.BoxGeometry(16, 22, L), K.stalMat, at(x - 8, 11, zc), '#f0e4cc');
    b.box(VC.solid, '#e8dcc0', x - 0.2, 2.8, zc, 0.4, 5.6, L);
    for (let k = 0; k < Math.floor(L / 9); k++) {
      const gz = zc + L / 2 - 4.5 - k * 9;
      b.add(G.cyl, VC.solid, x - 0.4, 22, gz, 7.6, 0.8, 7.6, Math.PI / 2, Math.PI / 2, 0, '#f0e4cc');
      b.add(G.plane, mosaic, x + 0.02, 22.6, gz, 5.6, 2.6, 1, 0, Math.PI / 2, 0);
      b.box(VC.solid, SNOW, x - 0.9, 25.9, gz, 1.0, 0.14, 2.2);
    }
    for (let z = z0 + 2.5; z < z1 - 2; z += 5) {   // the ground floor's café windows, warm but dim, their frames
      b.box(VC.glow, hdr('#ffc888', 0.6), x + 0.03, 2.4, -z, 0.05, 3.0, 3.2);
      b.box(VC.solid, '#3a3430', x + 0.06, 2.4, -z, 0.05, 3.0, 0.12); b.box(VC.solid, '#3a3430', x + 0.06, 3.1, -z, 0.05, 0.1, 3.2);
    }
    b.add(G.plane, metropolSign, x + 0.05, 6.6, zc, 12, 1.2, 1, 0, Math.PI / 2, 0);
  };
  const mosaic = std({ map: mosaicTex(), emissive: '#ffffff', emissiveMap: mosaicTex(), emissiveIntensity: 0.4, roughness: 0.4 });
  const metropolSign = K.label('МЕТРОПОЛЬ', { w: 1024, h: 128, color: '#f0c860', font: SERIF, size: 0.7, k: 1.3 });
  const bolshoiScene = () => {
    const b = new Batcher();
    farGround(b, -1, '#a8acbc'); farGround(b, 1, '#a8acbc');
    K.snowField(b, 20, -40, 22, 80, 0.035); K.snowField(b, -14, -40, 8, 80, 0.035);
    bolshoi(frame(b, 34, 0, -55, 1, -Math.PI / 2 + 0.3), S);   // turned a little toward the run so the portico shows
    for (let z = 6; z < 80; z += 14) for (const x of [12.5, 25]) if (Math.abs(z - 55) > 18 || x < 20) K.lamp(b, x, -z, 1);
    // Theatre Square: the fountain frozen in its basin, the New Year tree, trees of lights, the crowd going in
    const fx = 16, fz = -52;
    b.add(G.cyl, VC.solid, fx, 0.4, fz, 9, 0.8, 9, 0, 0, 0, '#a8a8b0');
    b.add(G.cyl, VC.solid, fx, 0.84, fz, 8, 0.1, 8, 0, 0, 0, '#dfe8f4');
    b.add(G.cyl, VC.solid, fx, 2.0, fz, 1.4, 2.4, 1.4, 0, 0, 0, '#a8a8b0');
    b.add(G.cyl, VC.solid, fx, 3.3, fz, 3.4, 0.3, 3.4, 0, 0, 0, '#b8b8c0');
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; b.add(G.cone8, VC.glow, fx + Math.cos(a) * 1.45, 3.0, fz + Math.sin(a) * 1.45, 0.14, 0.8, 0.14, Math.PI, 0, 0, hdr('#d8ecff', 0.8)); }
    K.yolka(b, 15, -10, 1.8);
    for (const [x, z] of [[12, -64], [18, -68], [14, -74]]) K.bareTree(b, x, z, 1.1, { lights: 'warm' });
    K.crowd(b, 6, 10.4, 30, 62, 10); K.crowd(b, 20.5, 23, 34, 60, 10); K.crowd(b, 4.6, 10, 2, 78, 10);
    metropol(b, -12, 6, 60);
    K.mansionRow(b, -1, 62, 80, { x0: 12 });
    for (let z = 8; z < 80; z += 16) K.lamp(b, -6.5, -z, -1);
    K.crowd(b, -4.6, -10, 2, 78, 12);
    return b.build();
  };

  // ---------- 3 · 共青团地铁站 ----------
  const vt = vaultTex(); vt.repeat.set(1, 1);
  const vaultMat = std({ map: vt, emissive: '#ffffff', emissiveMap: vt, emissiveIntensity: 0.55, roughness: 0.6, side: THREE.BackSide });
  const marbleMat = uplit(std({ vertexColors: true, roughness: 0.4, metalness: 0.1, emissive: '#fff0d0', emissiveIntensity: 0.12 }), 10, 1.0, 0.6);
  const ft = floorTex(), floorMat = std({ map: ft, roughness: 0.3, metalness: 0.1 });
  const mosaicMat = std({ map: mosaicTex(), emissive: '#ffffff', emissiveMap: mosaicTex(), emissiveIntensity: 0.55, roughness: 0.35, side: THREE.DoubleSide });
  const stationSign = K.label('КОМСОМОЛЬСКАЯ', { w: 1024, h: 128, color: '#f0c860', bg: '#2a1a14', font: SERIF, size: 0.66, k: 1.2 });
  const chandelier = (b, x, y, z) => {   // a baroque chandelier: a gilded ring of candles round a glowing bowl
    beam(b, VC.metal, x, y + 1.6, z, x, y + 3.4, z, 0.06, '#c89a40');
    b.add(G.tor, VC.metal, x, y, z, 3.2, 3.2, 1.4, Math.PI / 2, 0, 0, '#c89a40');
    b.add(G.tor, VC.metal, x, y + 0.7, z, 2.2, 2.2, 1.2, Math.PI / 2, 0, 0, '#c89a40');
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; b.box(VC.glow, hdr('#fff0c0', 2.6), x + Math.cos(a) * 1.6, y + 0.25, z + Math.sin(a) * 1.6, 0.1, 0.3, 0.1); }
    b.add(G.sphLow, VC.glow, x, y + 0.2, z, 1.2, 0.9, 1.2, 0, 0, 0, hdr('#ffe8b0', 1.8));
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; beam(b, VC.metal, x, y + 1.6, z, x + Math.cos(a) * 1.6, y + 0.1, z + Math.sin(a) * 1.6, 0.04, '#c89a40'); }
  };
  const metroHall = () => {
    const b = new Batcher(), R = 11, H0 = 11, HV = 6.6, L = 80;
    // the vault, an ellipse over the whole hall, coffered; ribs of white and gold across it
    const vg = new THREE.CylinderGeometry(1, 1, L, 40, 1, true, -Math.PI / 2, Math.PI);
    const uv = vg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i) * 10);
    sides(b, floorMat, 8.6, 0.05, 3.2);
    b.addM(vg, vaultMat, new THREE.Matrix4().makeRotationX(-Math.PI / 2).premultiply(new THREE.Matrix4().makeScale(R, HV, 1)).premultiply(new THREE.Matrix4().makeTranslation(0, H0, -L / 2)), 0xffffff);
    for (let z = 2; z < L; z += 8) {
      const rib = new THREE.TorusGeometry(1, 0.025, 4, 24, Math.PI);
      b.addM(rib, VC.solid, new THREE.Matrix4().makeScale(R - 0.05, HV - 0.05, 8).premultiply(new THREE.Matrix4().makeTranslation(0, H0, -z)), '#fbf6e8');
      b.add(G.plane, mosaicMat, 0, H0 + HV - 0.12, -z - 4, 3.6, 3.6, 1, Math.PI / 2, 0, 0);
      chandelier(b, 0, H0 + HV - 3.2, -z - 4);
    }
    // the arcades either side: octagonal marble piers, the arches between them, the gilded cornice where the vault springs
    for (const s of [-1, 1]) {
      const x = s * 8.6;
      for (let z = 0; z <= L; z += 5) {
        b.add(G.cyl8, marbleMat, x, 4.4, -z, 1.4, 8.8, 1.4, 0, Math.PI / 8, 0, '#e2d8c4');
        b.add(taperGeo(1.6, 8), VC.metal, x, 8.3, -z, 1.4, 0.9, 1.4, 0, Math.PI / 8, 0, '#d8a840');   // the gilded capital
        b.box(VC.metal, '#d8a840', x, 8.9, -z, 1.7, 0.3, 1.7);
        b.box(VC.metal, '#d8a840', x, 0.15, -z, 1.7, 0.3, 1.7);
      }
      for (let z = 0; z < L; z += 5) {
        const arc = new THREE.TorusGeometry(2.5, 0.35, 4, 14, Math.PI);
        b.addM(arc, wallLit, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(x, 8.6, -z - 2.5), '#fbf2dc');
      }
      b.box(VC.solid, '#f2e2b8', x, 10.0, -L / 2, 1.6, 2.2, L);
      b.box(VC.metal, '#d8a840', x - s * 0.82, 10.9, -L / 2, 0.12, 0.3, L);
      b.box(VC.metal, '#d8a840', x - s * 0.82, 9.2, -L / 2, 0.12, 0.2, L);
      // the platform behind the arcade, its marble floor, the wall with the name and the mosaics, the waiting crowd
      b.box(VC.solid, '#c8beb0', s * 12, 0.5, -L / 2, 7, 1.0, L);
      b.box(VC.solid, '#e8dcc8', s * 15.6, H0 / 2, -L / 2, 0.4, H0, L);
      b.box(VC.solid, '#efe4c8', s * 12.5, H0 + 0.1, -L / 2, 6.4, 0.3, L);   // the platform's ceiling, out to where the vault springs
      b.add(G.plane, stationSign, s * 15.38, 7.4, -L / 2, 12, 1.5, 1, 0, face(s), 0);
      for (let z = 8; z < L; z += 16) b.add(G.plane, mosaicMat, s * 15.38, 4.2, -z, 3.2, 3.2, 1, 0, face(s), 0);
      K.crowd(b, s * 10.2, s * 14.6, 2, L - 2, 18, { y: 1.0 });
      for (let z = 10; z < L; z += 20) { b.box(VC.solid, '#5a3a24', s * 14.8, 1.45, -z, 0.6, 0.12, 3.2); for (const e of [-1.3, 1.3]) b.box(VC.metal, '#3a3a40', s * 14.8, 1.2, -z + e, 0.5, 0.4, 0.08); b.box(VC.solid, '#5a3a24', s * 15.1, 1.8, -z, 0.1, 0.6, 3.2); }
    }
    // the entrance arch with the red М over it, and the station's name
    for (const z of [0.4, -L + 0.4]) {
      const sh = new THREE.Shape();   // the wall with the arch cut up into it, as one outline
      sh.moveTo(-16, 0); sh.lineTo(-R, 0); sh.lineTo(-R, H0); sh.absellipse(0, H0, R, HV, Math.PI, 0, true); sh.lineTo(R, 0); sh.lineTo(16, 0); sh.lineTo(16, 20); sh.lineTo(-16, 20); sh.lineTo(-16, 0);
      const g = new THREE.ShapeGeometry(sh, 20);
      b.addM(g, wallLit, new THREE.Matrix4().makeTranslation(0, 0, z), '#e8d4a8');
      b.addM(g, wallLit, new THREE.Matrix4().makeRotationY(Math.PI).setPosition(0, 0, z - 0.3), '#e8d4a8');
    }
    for (const x of [-13.5, 13.5]) b.add(G.plane, K.metroM, x, 13.5, 0.45, 3.2, 3.2, 1);
    b.add(G.plane, K.label('МЕТРО', { w: 512, h: 128, color: '#e8202a', font: SANS, weight: 700, size: 0.7, k: 1.6 }), 0, 18.8, 0.45, 6, 1.4, 1);
    return b.build();
  };

  // ---------- 4 · 阿尔巴特街 ----------
  const gfx = graffitiTex(), tsoiMat = std({ map: gfx, emissive: '#ffffff', emissiveMap: gfx, emissiveIntensity: 0.32, roughness: 0.9 });
  const arbat = () => {
    const b = new Batcher();
    farGround(b, -1, '#a8acbc'); farGround(b, 1, '#a8acbc');
    K.mansionRow(b, -1, 0, 18, { signs: ARBAT_SIGNS }); K.mansionRow(b, -1, 42, 80, { signs: ARBAT_SIGNS });
    // the Tsoi wall: years of messages, flowers and candles at its foot
    b.block(VC.solid, '#6a6460', -11.4, 0, -30, 0.6, 3.6, 22);
    b.add(G.plane, tsoiMat, -11.08, 1.8, -30, 22, 3.6, 1, 0, Math.PI / 2, 0);
    for (let k = 0; k < 22; k++) { const z = -rand(20, 40); b.cyl(VC.glow, hdr('#ffc060', 2.2), -10.7, 0.15, z, 0.05, 0.1, 'cyl6'); if (k % 2) b.add(G.cone8, VC.solid, -10.8, 0.25, z + 0.3, 0.2, 0.5, 0.2, 0.5, 0, 0, pick(['#c8202a', '#ff6a9a', '#ffffff'])); }
    K.crowd(b, -8, -10.4, 20, 40, 9);
    // the Vakhtangov Theatre's columns, Princess Turandot gilded on her fountain
    K.mansionRow(b, 1, 0, 34, { signs: ARBAT_SIGNS }); K.mansionRow(b, 1, 62, 80, { signs: ARBAT_SIGNS });
    const vt2 = frame(b, 22, 0, -48, 1, -Math.PI / 2);
    vt2.block(S.wall, '#e8e0d4', 0, 0, -6, 26, 14, 14);
    for (let k = 0; k < 6; k++) vt2.cyl(S.wall, S.cTrim, -8.75 + k * 3.5, 6.2, 1.8, 0.55, 11);
    vt2.box(S.wall, S.cTrim, 0, 12.4, 1.2, 23, 1.6, 2.4);
    vt2.add(G.plane, K.label('ТЕАТР ИМ. ВАХТАНГОВА', { w: 1024, h: 96, color: '#f0c860', font: SERIF, size: 0.66, k: 1.2 }), 0, 12.4, 2.45, 16, 1.4, 1);
    vt2.box(S.glow, hdr('#ffd0a0', 0.55), 0, 4, -0.95, 18, 6, 0.05);   // the foyer glowing behind the columns
    b.add(G.cyl, VC.solid, 13.5, 0.45, -48, 3.4, 0.9, 3.4, 0, 0, 0, '#a8a8b0');
    b.block(VC.solid, '#8a8a90', 13.5, 0.9, -48, 0.8, 1.2, 0.8);
    b.add(G.cone8, VC.metal, 13.5, 2.8, -48, 0.9, 1.6, 0.9, 0, 0, 0, '#e8c060');
    b.sph(VC.metal, '#e8c060', 13.5, 3.85, -48, 0.3);
    b.box(VC.glow, hdr('#ffe0a0', 2.2), 12.4, 0.2, -48, 0.4, 0.2, 0.4);
    // the street itself: lanterns, stalls, painters and musicians, garlands overhead, the crowd
    for (const s of [-1, 1]) for (let z = 6; z < 80; z += 13) K.lantern(b, s * 5.6, -z);
    K.stall(b, 8.6, -12, 1); K.stall(b, -8.6, -50, -1, { kind: 'hats' }); K.stall(b, 8.6, -70, 1);
    K.painter(b, -9, -60, -1); K.painter(b, 9.2, -24, 1); K.musician(b, 9.4, -38, 1);
    for (const z of [10, 30, 50, 70]) K.garland(b, -z, { y: 15.6, w: X0W, col: ['#ffe8b0', '#ffd890', '#fff4d8'], posts: true });
    K.yolka(b, -8.4, -8, 1.3);
    K.crowd(b, 4.6, 10, 2, 78, 22); K.crowd(b, -4.6, -10, 2, 78, 18);
    return b.build();
  };
  const X0W = 11;

  // ---------- 5 · 救世主大教堂 ----------
  const christScene = () => {
    const b = new Batcher(), yw = -1.4;
    farGround(b, -1, '#a8acbc');
    K.snowField(b, -14, -40, 8, 80, 0.035);
    // the cathedral on its terrace, the gardens' lamps; the river on the right with the Red October factory across it
    christSaviour(frame(b, -38, 0, -60, 0.55, Math.PI / 2), S);   // near enough to show over the street before it, far enough for the dome to fit
    plane(b, settsMat, -32, -60, 36, 46, 0.04, 8);
    for (let z = 40; z < 80; z += 8) b.box(VC.glow, hdr('#ffd8a8', 2.2), -21, 0.2, -z, 0.5, 0.25, 0.5);
    for (let z = 10; z < 80; z += 16) K.lamp(b, -8.6, -z, -1);
    for (const [x, z] of [[-14, -10], [-20, -18], [-16, -26]]) K.spruce(b, x, z, rand(1.0, 1.2), { lights: 'warm', baubles: false, star: false });
    b.box(VC.solid, '#8a8a90', 11.4, -1.4, -40, 1.0, 3.2, 80);
    b.box(VC.solid, '#a8a8b0', 11.4, 0.55, -40, 1.2, 0.5, 80);
    b.box(VC.solid, SNOW, 11.4, 0.85, -40, 1.1, 0.12, 80);
    b.add(G.plane, river, 50, yw, -40, 78, 80, 1, -Math.PI / 2, 0, 0);
    floes(b, 14, 86, 2, 78, 24, yw);
    b.box(VC.solid, '#5a5a62', 89.5, -0.5, -40, 1.0, 1.9, 80);   // the far embankment's wall
    b.box(VC.solid, '#5a5a62', 50, -0.8, -79.95, 78, 1.4, 0.1);
    plane(b, K.snowMat, 110, -40, 40, 80, 0.4, 6);
    const ro = frame(b, 104, 0.4, -36, 1, -Math.PI / 2);   // Red October: the chocolate factory's red brick and its sign on the roof
    ro.block(S.brick, '#b85a44', 0, 0, 0, 40, 16, 16);
    for (let k = 0; k < 10; k++) for (const y of [4, 9, 13]) ro.box(S.glow, S.cWin, -18 + k * 4, y, 8.02, 1.6, 2.2, 0.05);
    ro.add(G.plane, K.label('КРАСНЫЙ ОКТЯБРЬ', { w: 1024, h: 128, color: '#ff3a2a', glow: '#ff3a2a', font: SANS, weight: 700, size: 0.72, k: 2.2 }), 0, 19.2, 7.5, 26, 3.2, 1);
    for (const x of [-12, 12]) ro.box(S.dark, S.cDark, x, 17.5, 7.4, 0.2, 3, 0.2);
    for (const z of [-30, -50]) b.add(G.plane, reflGold, 50, yw + 0.04, z, 3, 70, 1, -Math.PI / 2, 0, 0);
    // the Patriarch's Bridge over the track: its steel arch, the lamps along it
    const bz = -74, by = 14.6;
    b.box(VC.solid, '#5a5e66', 10, by, bz, 160, 0.7, 6);
    for (const dz of [-2.9, 2.9]) { b.box(VC.metal, '#8a8e96', 10, by + 0.9, bz + dz, 160, 0.08, 0.08); for (let x = -70; x <= 90; x += 2) b.box(VC.metal, '#8a8e96', x, by + 0.55, bz + dz, 0.06, 0.7, 0.06); }
    for (let x = -60; x <= 90; x += 10) { b.cyl(VC.metal, '#2a2a2e', x, by + 1.85, bz - 2.6, 0.06, 3); b.add(G.cyl6, VC.glow, x, by + 3.6, bz - 2.6, 0.36, 0.5, 0.36, 0, 0, 0, hdr('#fff0c8', 2.4)); }
    for (const x of [-24, 30]) { b.box(VC.solid, '#5a5e66', x, by / 2, bz, 1.6, by, 4); }
    for (let k = 0; k <= 20; k++) { const t = k / 20, x = 30 + t * 60, y = by - 0.3 - Math.sin(t * Math.PI) * 5.5; b.box(VC.metal, '#7a7e86', x, (by + y) / 2, bz, 0.3, by - y, 0.3); }
    K.crowd(b, -4.6, -10, 2, 78, 12); K.crowd(b, 4.6, 10, 2, 78, 10);
    return b.build();
  };

  // ---------- 6 · 高尔基公园 · 克里米亚大桥 ----------
  const gorkyText = inscriptionTex('ЦЕНТРАЛЬНЫЙ ПАРК КУЛЬТУРЫ И ОТДЫХА ИМЕНИ М. ГОРЬКОГО', { w: 2048, h: 96 });
  const gorkyMat = std({ map: gorkyText, emissive: '#ffffff', emissiveMap: gorkyText, emissiveIntensity: 0.55, roughness: 0.5 });
  const gorky = () => {
    const b = new Batcher();
    farGround(b, -1, '#a8acbc'); farGround(b, 1, '#a8acbc');
    sides(b, K.snowMat, 50);
    // the gate: two colonnaded pylons, the attic with its letters over the opening, high clear of the track
    const gz = -8;
    for (const s of [-1, 1]) {
      b.block(wallLit, '#e8e4dc', s * 13, 0, gz, 12, 14.6, 6);
      for (let k = 0; k < 4; k++) b.cyl(wallLit, '#e6e2da', s * (7.6 + k * 3.6), 7.0, gz + 3.4, 0.62, 14);
      b.box(VC.solid, '#5a5260', s * 13, 6.5, gz + 3.03, 10, 12, 0.05);   // the loggia in shadow behind the columns, its ticket windows lit
      b.box(VC.glow, hdr('#ffd8a0', 0.7), s * 13, 1.4, gz + 3.05, 9, 2.0, 0.05);
    }
    b.box(wallLit, '#e8e4dc', 0, 16.6, gz, 38, 4.0, 6.6);
    b.add(G.plane, gorkyMat, 0, 16.6, gz + 3.32, 36, 1.7, 1);
    b.box(VC.solid, SNOW, 0, 18.7, gz, 38.4, 0.2, 6.8);
    for (const x of [-16, -8, 0, 8, 16]) { b.cyl(VC.metal, '#d8d8dc', x, 21, gz, 0.06, 4.4); b.add(G.plane, VC.solid, x + 0.9, 22.4, gz, 1.8, 1.0, 1, 0, 0, 0, pick(['#c8202a', '#2a4a9a', '#e8c030'])); }
    for (let x = -18; x <= 18; x += 0.9) b.box(VC.glow, hdr('#fff0c8', 2.4), x, 14.52, gz + 3.2, 0.12, 0.12, 0.12);
    // the rinks either side of the main alley, skaters, light arches over the paths, the trees in lights, the hot drinks
    for (const s of [-1, 1]) {
      plane(b, iceMat, s * 24, -42, 34, 56, 0.06, 6);
      for (let k = 0; k < 22; k++) skater(b, s * rand(8.5, 40), -rand(16, 70));
      for (let z = 18; z < 70; z += 4.5) K.lightArch(b, s * 7.4, -z, s, { w: 3.6, h: 4 });
      for (let z = 20; z < 72; z += 9) K.bareTree(b, s * 43, -z, 1.1, { lights: 'ice' });
      K.drinks(b, s * 6.6, -rand(24, 60), s, pick([8, 9, 4, 10]));
    }
    K.yolka(b, -26, -40, 2.0);
    b.add(G.plane, K.label('КАТОК', { w: 512, h: 160, color: '#ffffff', glow: '#3ad6ff', font: SANS, weight: 700, size: 0.7, k: 1.8 }), 26, 7, -30, 8, 2.5, 1, 0, -0.4, 0);
    for (const e of [-1, 1]) b.cyl(VC.metal, '#2a2a2e', 26 + e * 3.5, 2.95, -30 + e * 1.48, 0.08, 5.9);   // the rink sign's posts
    // the Crimean Bridge over the far end: its red pylons and chains, the hangers, the deck high over the track
    const cz = -70, deck = 15.2;
    b.box(VC.solid, '#a8302a', 0, deck, cz, 220, 1.0, 10);
    b.box(VC.metal, '#c8402a', 0, deck + 1.0, cz + 4.6, 220, 0.6, 0.3); b.box(VC.metal, '#c8402a', 0, deck + 1.0, cz - 4.6, 220, 0.6, 0.3);
    for (const s of [-1, 1]) for (const dz of [-4.6, 4.6]) {
      b.box(VC.metal, '#c8302a', s * 30, 17, cz + dz, 2.2, 34, 2.2);
      for (let k = 0; k < 24; k++) {   // the chain, sagging from the pylon tops to the middle and out to the anchorages
        const t0 = k / 24, t1 = (k + 1) / 24, X = (t) => s * (30 - t * 30), Y = (t) => deck + 2 + (34 - deck - 2) * Math.pow(1 - t, 2);
        beam(b, VC.metal, X(t0), Y(t0), cz + dz, X(t1), Y(t1), cz + dz, 0.5, '#c8302a');
        if (k % 2 === 0) beam(b, VC.metal, X(t0), Y(t0), cz + dz, X(t0), deck + 0.5, cz + dz, 0.12, '#c8302a');
      }
      beam(b, VC.metal, s * 30, 34, cz + dz, s * 80, deck + 1, cz + dz, 0.5, '#c8302a');
      b.box(VC.glow, hdr('#fff0d0', 2.4), s * 30, deck - 0.6, cz + dz * 1.3, 0.5, 0.3, 0.5);
    }
    for (const s of [-1, 1]) b.box(VC.solid, '#a8302a', s * 30, 34, cz, 2, 1.4, 9.4);
    K.crowd(b, 4.6, 7, 2, 78, 10); K.crowd(b, -4.6, -7, 2, 78, 10);
    return b.build();
  };

  // ---------- 7 · 新圣女修道院 ----------
  const convent = (b) => {   // the white walls with red-trimmed battlements and towers, the bell tower, the Smolensky Cathedral
    const wx = -30;
    b.block(wallLit, '#d6cfc4', wx, 0, -40, 1.6, 7.0, 64);
    for (let z = 9; z < 72; z += 1.8) b.block(wallLit, '#d6cfc4', wx, 7.0, -z, 1.6, 1.0, 1.0);
    b.box(VC.solid, '#c8302a', wx + 0.82, 6.6, -40, 0.04, 0.3, 64);
    b.box(VC.solid, SNOW, wx - 0.1, 7.1, -40, 1.4, 0.08, 64);
    for (const z of [8, 40, 72]) {
      b.add(G.cyl8, wallLit, wx, 6.5, -z, 4, 13, 4, 0, Math.PI / 8, 0, '#d6cfc4');
      b.add(G.cyl8, VC.solid, wx, 13.2, -z, 4.4, 0.5, 4.4, 0, Math.PI / 8, 0, '#c8302a');
      b.add(G.cyl8, wallLit, wx, 14.6, -z, 2.4, 2.4, 2.4, 0, Math.PI / 8, 0, '#d6cfc4');
      dome(frame(b, wx, 15.8, -z, 1, 0), S, 0, 0, 0, 1.1, { drum: 0, neck: 0.2 });
    }
    // the bell tower: six tiers of red and white octagons, the gold dome on top
    const bx = -40, bz = -40;
    let y = 0;
    for (const [r, h] of [[4.6, 8], [4.0, 6.5], [3.4, 5.5], [2.9, 5], [2.4, 4.5], [1.9, 4]]) {
      b.add(G.cyl8, wallLit, bx, y + h / 2, bz, r * 2, h, r * 2, 0, Math.PI / 8, 0, '#e8584a');
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; b.box(VC.solid, '#e4ded4', bx + Math.sin(a) * r * 0.93, y + h / 2, bz + Math.cos(a) * r * 0.93, r * 0.3, h * 0.7, 0.08, a); b.box(VC.glow, hdr('#ffd890', 1.0), bx + Math.sin(a) * r * 0.95, y + h * 0.5, bz + Math.cos(a) * r * 0.95, r * 0.16, h * 0.4, 0.05, a); }
      b.add(G.cyl8, VC.solid, bx, y + h, bz, r * 2 + 0.6, 0.4, r * 2 + 0.6, 0, Math.PI / 8, 0, '#e4ded4');
      y += h;
    }
    dome(frame(b, bx, y, bz, 1, 0), S, 0, 0, 0, 1.6, { drum: 1.2, drumCol: '#e8584a' });
    // the Smolensky Cathedral, white, the gold dome over four silver ones
    const cf = frame(b, -56, 0, -58, 1, Math.PI / 2);
    cf.block(S.wall, '#e8e4da', 0, 0, 0, 16, 14, 16);
    for (const z of [8.05]) for (const k of [-1, 0, 1]) cf.add(G.cyl, S.wall, k * 5.3, 14, z, 5, 0.3, 5, Math.PI / 2, 0, 0, '#e8e4da');
    for (const k of [-1, 1]) cf.box(S.glow, S.cWin, k * 4, 7, 8.04, 1.2, 3.4, 0.05);
    dome(cf, S, 0, 14, 0, 2.8, { drum: 4.0, drumCol: '#e8e4da' });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) dome(cf, S, sx * 4.4, 14, sz * 4.4, 1.7, { drum: 2.6, drumCol: '#e8e4da', mat: VC.metal, col: '#c8ccd4', win: false });
  };
  const novodevichy = () => {
    const b = new Batcher();
    farGround(b, 1, '#a8acbc');
    plane(b, K.snowMat, -40, -40, 60, 80, 0.035, 6);
    convent(b);
    for (let z = 8; z < 80; z += 12) K.birch(b, -16 - rand(0, 6), -z);
    for (let z = 10; z < 80; z += 18) K.lantern(b, -6, -z);
    // the frozen pond: skaters, the snowy island, birches round it, the convent's lights on the ice
    plane(b, iceMat, 36, -42, 50, 70, 0.06, 6);
    b.add(G.sphLow, VC.solid, 42, 0, -48, 10, 1.6, 8, 0, 0, 0, SNOW);
    for (let k = 0; k < 4; k++) K.birch(b, 42 + rand(-3, 3), -48 + rand(-2, 2), rand(0.9, 1.1));
    for (let k = 0; k < 20; k++) skater(b, rand(13, 60), -rand(10, 74));
    for (let z = 6; z < 80; z += 9) K.birch(b, 10.6 + rand(0, 1), -z);
    for (let z = 8; z < 80; z += 16) K.bench(b, 9.2, -z, 1);
    K.crowd(b, -4.6, -10, 2, 78, 8); K.crowd(b, 4.6, 9, 2, 78, 8);
    for (let k = 0; k < 4; k++) K.babushka(b, rand(-9, -5), -rand(6, 74));
    return b.build();
  };

  // ---------- 8 · 莫斯科城 ----------
  const GLASS = { ...S, glass: VC.metal, glow: VC.glow, lo: false, tint: null, cOffice: hdr('#dfeaff', 0.75), cCrown: hdr('#bfe8ff', 1.2) };
  const moscowCity = () => {
    const b = new Batcher(), yw = -1.4;
    farGround(b, -1, '#3a3e4a');
    plane(b, K.snowMat, -20, -40, 18, 80, 0.035, 6);
    const F = frame(b, -62, 0, -48, 0.24, Math.PI / 2 + 0.25);
    for (const t of [CITYNEAR[0], CITYNEAR[1], CITYNEAR[2], CITYNEAR[3], CITYNEAR[4], CITYNEAR[5]]) cityTower(F, GLASS, t, { lit: 0.6 });
    for (let z = 6; z < 80; z += 10) { b.box(VC.solid, '#3a3e48', -13, 0.25, -z, 1.2, 0.5, 4.6); b.box(VC.glow, hdr('#bfe8ff', 1.2), -12.38, 0.08, -z, 0.04, 0.1, 4.2); }   // granite benches, a strip of light under each
    for (let z = 8; z < 80; z += 14) K.lamp(b, -8.2, -z, -1, { col: '#e8f2ff' });
    // the river and the Bagration Bridge over it, a lit glass gallery high over the track
    b.box(VC.solid, '#8a8a90', 11.4, -1.4, -40, 1.0, 3.2, 80);
    b.box(VC.solid, '#a8a8b0', 11.4, 0.55, -40, 1.2, 0.5, 80);
    b.add(G.plane, river, 60, yw, -40, 98, 80, 1, -Math.PI / 2, 0, 0);
    floes(b, 14, 100, 2, 78, 22, yw);
    const bz = -40, by = 14.8;
    b.box(VC.solid, '#3a3e48', 20, by, bz, 140, 0.8, 9);
    b.box(VC.metal, '#3a5470', 20, by + 2.6, bz, 140, 4.4, 8.4);   // the gallery's tinted glass, the shops' light along it
    for (const dz of [-4.22, 4.22]) { b.box(VC.glow, hdr('#ffe0b0', 0.95), 20, by + 1.3, bz + dz, 140, 1.1, 0.03); b.box(VC.glow, hdr('#e8f4ff', 1.4), 20, by + 4.3, bz + dz, 140, 0.12, 0.03); }
    b.box(VC.metal, '#c8ccd4', 20, by + 5.0, bz, 140, 0.4, 9.2);
    for (let x = -50; x <= 90; x += 4) b.box(VC.metal, '#8a8e96', x, by + 2.6, bz + 4.3, 0.12, 4.6, 0.12);
    for (const x of [-20, 40, 80]) b.box(VC.solid, '#3a3e48', x, by / 2, bz, 2.2, by, 6);
    plane(b, K.snowMat, 130, -40, 40, 80, 0.4, 6);
    for (const [x, z, h, w] of [[120, -20, 46, 18], [128, -58, 60, 20], [146, -36, 38, 24]]) { b.addM(new THREE.BoxGeometry(w, h, w), K.panelMat, at(x, h / 2, z), '#cfd8e8'); }
    K.crowd(b, -4.6, -11, 2, 78, 14); K.crowd(b, 4.6, 10, 2, 78, 8);
    return b.build();
  };
  const CITYNEAR = [
    { x: 0, z: 0, w: 52, h: 374, plan: 'tri', col: '#8aa8c8', spire: 40 }, { x: 70, z: 40, w: 44, h: 242, plan: 'tri', col: '#94b0cc' },
    { x: -80, z: -10, w: 42, h: 338, plan: 'chamfer', col: '#c08a5a' }, { x: 120, z: -60, w: 40, h: 354, plan: 'pinch', col: '#6a9aa8' },
    { x: -150, z: 50, w: 38, h: 246, plan: 'twist', col: '#a8c4dc' }, { x: 40, z: -120, w: 40, h: 345, plan: 'box', col: '#5a7aa0' },
  ];

  // ---------- 9 · 全俄展览中心 · 东方号火箭 ----------
  const vt9 = inscriptionTex('ВДНХ', { w: 512, h: 160, color: '#e8b440', bg: '#9a8e7c', font: SERIF, weight: 400 });   // gilt letters on the attic's stone
  const vdnkhMat = std({ map: vt9, emissive: '#ffffff', emissiveMap: vt9, emissiveIntensity: 0.5, roughness: 0.5 });
  const goldFig = (b, x, y, z, ry, s = 1) => {   // a gilded statue: a woman in a national dress, the full skirt, one arm raised
    const g = '#e8c060', ca = Math.cos(ry), sa = Math.sin(ry);
    b.add(taperGeo(0.42, 8), VC.metal, x, y + 0.8 * s, z, 1.1 * s, 1.6 * s, 1.1 * s, 0, ry, 0, g);
    b.box(VC.metal, g, x, y + 1.95 * s, z, 0.46 * s, 0.7 * s, 0.3 * s, ry);
    b.sph(VC.metal, g, x, y + 2.52 * s, z, 0.19 * s);
    beam(b, VC.metal, x + ca * 0.2 * s, y + 2.2 * s, z - sa * 0.2 * s, x + ca * 0.42 * s, y + 3.1 * s, z - sa * 0.42 * s, 0.1 * s, g);   // the raised arm
    beam(b, VC.metal, x - ca * 0.2 * s, y + 2.2 * s, z + sa * 0.2 * s, x - ca * 0.36 * s, y + 1.5 * s, z + sa * 0.36 * s, 0.1 * s, g);
  };
  const vostok = (b, x, z) => {   // the Vostok rocket on its pad: the core, the four flaring boosters, the third stage and the craft's shroud
    b.block(VC.solid, '#5a5e66', x, 0, z, 10, 2.0, 10);
    const w = '#d4d8e0', y0 = 2.0;
    b.add(G.cyl, VC.solid, x, y0 + 13, z, 2.6, 26, 2.6, 0, 0, 0, w);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4, bx = x + Math.cos(a) * 2.2, bz = z + Math.sin(a) * 2.2;
      b.add(G.cyl, VC.solid, bx, y0 + 7, bz, 2.2, 14, 2.2, 0, 0, 0, w);
      b.add(G.cone, VC.solid, bx, y0 + 16, bz, 2.2, 4, 2.2, 0, 0, 0, w);
      b.add(G.cone, VC.metal, bx, y0 - 0.4, bz, 2.8, 1.6, 2.8, Math.PI, 0, 0, '#5a5e66');
      b.box(VC.solid, '#c8302a', bx, y0 + 0.6, bz, 1.0, 0.4, 0.06, -a);
    }
    b.add(G.cyl, VC.metal, x, y0 + 27.5, z, 2.4, 3, 2.4, 0, 0, 0, '#c8ccd4');
    b.add(G.cone, VC.solid, x, y0 + 31.5, z, 2.6, 5, 2.6, 0, 0, 0, w);
    b.cyl(VC.metal, '#c8ccd4', x, y0 + 34.6, z, 0.12, 1.4);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.box(VC.glow, hdr('#e8f0ff', 2.4), x + Math.cos(a) * 4.2, 2.15, z + Math.sin(a) * 4.2, 0.5, 0.3, 0.5); }
  };
  const vdnkh = () => {
    const b = new Batcher();
    farGround(b, -1, '#a8acbc'); farGround(b, 1, '#a8acbc');
    sides(b, K.snowMat, 56);
    // the main arch: three openings, the middle one high over the track, the sheaf held up on top, ВДНХ in gold
    const az = -6;
    for (const s of [-1, 1]) {
      b.block(wallLit, '#e2dacb', s * 9.5, 0, az, 4, 15.4, 5);
      b.block(wallLit, '#e2dacb', s * 15.5, 0, az, 4, 12, 5);
      for (const x of [s * 7.3, s * 11.7]) b.cyl(wallLit, '#e8e2d6', x, 7.4, az + 2.7, 0.6, 14.8);
    }
    b.box(wallLit, '#e2dacb', 0, 17.4, az, 36, 4.0, 5.6);
    b.add(G.plane, vdnkhMat, 0, 17.4, az + 2.82, 10, 3.1, 1);
    for (const s of [-1, 1]) { const g = '#e8c060'; b.add(G.cone8, VC.metal, s * 1.2, 20.6, az, 1.2, 2.2, 1.2, 0, 0, 0, g); b.box(VC.metal, g, s * 1.2, 22.3, az, 0.7, 1.2, 0.5); b.sph(VC.metal, g, s * 1.2, 23.1, az, 0.32); beam(b, VC.metal, s * 1.2, 22.8, az, s * 0.3, 24.6, az, 0.16, g); }
    b.add(G.cone8, VC.metal, 0, 25.6, az, 1.6, 3.0, 1.6, Math.PI, 0, 0, '#e8c060');
    for (let k = 0; k < 9; k++) beam(b, VC.metal, 0, 24.4, az, (k - 4) * 0.35, 27.2, az, 0.06, '#e8c060');
    for (let x = -18; x <= 18; x += 0.9) b.box(VC.glow, hdr('#fff0c8', 2.4), x, 15.25, az + 2.85, 0.12, 0.12, 0.12);
    // the alley: lamps, the Friendship of Nations fountain with its gilded maidens, the rocket, the Central Pavilion's spire
    for (const s of [-1, 1]) for (let z = 14; z < 80; z += 12) K.lamp(b, s * 6.8, -z, s);
    const fx = -26, fz = -46;
    b.add(G.cyl8, VC.solid, fx, 0.5, fz, 26, 1.0, 26, 0, Math.PI / 8, 0, '#d8d4cc');
    b.add(G.cyl8, VC.solid, fx, 1.02, fz, 24, 0.06, 24, 0, Math.PI / 8, 0, '#dfe8f4');
    b.add(G.cyl8, VC.solid, fx, 2.4, fz, 9, 2.8, 9, 0, Math.PI / 8, 0, '#d8d4cc');   // the granite drum the maidens stand round
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; goldFig(b, fx + Math.cos(a) * 3.6, 3.8, fz + Math.sin(a) * 3.6, -a - Math.PI / 2, 0.9); }
    for (let k = 0; k < 16; k++) {   // the gilded sheaf in the middle, its ears spraying out at the top
      const a = (k / 16) * Math.PI * 2 + rand(-0.15, 0.15), r = rand(0.9, 1.6), tx = fx + Math.cos(a) * r, tz = fz + Math.sin(a) * r, ty = rand(8.6, 10);
      beam(b, VC.metal, fx + Math.cos(a) * 0.25, 3.8, fz + Math.sin(a) * 0.25, tx, ty, tz, 0.09, '#e8c060');
      b.add(G.sphLow, VC.metal, tx, ty + 0.3, tz, 0.22, 0.7, 0.22, 0, 0, 0, '#f0cc68');
    }
    b.add(G.cyl8, VC.metal, fx, 5.2, fz, 1.1, 0.4, 1.1, 0, 0, 0, '#d8a840');
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; b.box(VC.glow, hdr('#ffe0a0', 2.2), fx + Math.cos(a) * 11.6, 1.1, fz + Math.sin(a) * 11.6, 0.5, 0.2, 0.5); }
    vostok(b, 22, -40);
    const cp = frame(b, 34, 0, -72, 1, -Math.PI / 2);
    cp.block(S.wall, '#e6d6b6', 0, 0, 0, 30, 12, 16);
    for (let k = 0; k < 8; k++) cp.cyl(S.wall, S.cTrim, -10.5 + k * 3, 5.6, 8.6, 0.5, 11);
    cp.block(S.wall, '#e6d6b6', 0, 12, 0, 12, 8, 10);
    cp.add(G.cyl8, S.wall, 0, 23, 0, 7, 6, 7, 0, Math.PI / 8, 0, '#e6d6b6');
    cp.add(G.cone8, S.gold, 0, 26 + 10, 0, 3, 20, 3, 0, 0, 0, S.cGold);
    cp.add(STAR, S.star, 0, 46.9, 0, 2.6, 2.6, 1, 0, 0, 0, S.cStar).add(STAR, S.star, 0, 46.9, 0, 2.6, 2.6, 1, 0, Math.PI / 2, 0, S.cStar);
    cp.box(S.glow, hdr('#ffd0a0', 0.55), 0, 5, 8.05, 24, 6, 0.05);
    for (const s of [-1, 1]) { plane(b, iceMat, s * 12, -60, 6, 34, 0.06, 6); for (let k = 0; k < 6; k++) skater(b, s * rand(9.5, 14.5), -rand(44, 76)); }
    K.crowd(b, 4.6, 10, 2, 78, 12); K.crowd(b, -4.6, -12, 2, 78, 12);
    return b.build();
  };

  return {
    landmarks: [
      { key: 'redSquare', name: '红场 · 圣瓦西里大教堂', en: "RED SQUARE · ST BASIL'S", build: redSquare },
      { key: 'kremlin', name: '克里姆林宫 · 莫斯科河', en: 'THE KREMLIN · MOSKVA RIVER', build: kremlinRiver },
      { key: 'bolshoi', name: '大剧院', en: 'BOLSHOI THEATRE', build: bolshoiScene },
      { key: 'metro', name: '共青团地铁站', en: 'KOMSOMOLSKAYA STATION', build: metroHall },
      { key: 'arbat', name: '阿尔巴特街', en: 'ARBAT STREET', build: arbat },
      { key: 'christ', name: '救世主大教堂', en: 'CHRIST THE SAVIOUR', build: christScene },
      { key: 'gorky', name: '高尔基公园 · 克里米亚大桥', en: 'GORKY PARK · CRIMEAN BRIDGE', build: gorky },
      { key: 'novodevichy', name: '新圣女修道院', en: 'NOVODEVICHY CONVENT', build: novodevichy },
      { key: 'city', name: '莫斯科城', en: 'MOSCOW-CITY', build: moscowCity },
      { key: 'vdnkh', name: '全俄展览中心 · 东方号火箭', en: 'VDNKH · VOSTOK ROCKET', build: vdnkh },
    ],
    update(t) { for (const f of upd) f(t); },
  };
}
