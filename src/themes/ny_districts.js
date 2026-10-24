// New York landmark scenes built around the icons in ny_icons.js and the street kit: the Battery and the harbour with
// the Statue of Liberty out on her island, Washington Square's arch, DUMBO under the Manhattan Bridge.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, windowTex, planeUV, buildingGeo, foliageMat, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { EDGE, at, farGround, waterMat, buildingRow, facadeMat, textTex, lamp } from './common.js';
import { beam } from './tokyo_kit.js';
import { tiledBox } from './beijing_kit.js';
import { liberty, tabletTex, graniteTex, thinFog, frame, oneWTC } from './ny_icons.js';

function marbleTex() {   // white marble courses, floodlit
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#cfc8bc'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 20 - 20; x < w; x += 40) {
      const v = randi(-8, 8); g.fillStyle = `rgb(${236 + v},${232 + v},${224 + v})`; g.fillRect(x + 1, y + 1, 38, 14);
    }
  });
}
function victoryTex() {   // a winged Victory lying along the curve of the arch, carved in low relief
  return canvasTex(256, 128, (g) => {
    g.clearRect(0, 0, 256, 128);
    g.fillStyle = 'rgba(214,206,194,0.97)'; g.strokeStyle = 'rgba(120,110,100,0.75)'; g.lineWidth = 2;
    for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(112 - k * 8, 52 - k * 3, 46 - k * 3, 7, -0.5 - k * 0.08, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.beginPath(); g.ellipse(150, 88, 72, 15, -0.3, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(216, 60, 11, 0, Math.PI * 2); g.fill(); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.arc(240, 40, 10, 0, Math.PI * 2); g.stroke();
  }, { repeat: false });
}
function cobbleTex() {   // Belgian blocks, worn
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#26221e'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 10) for (let x = ((y / 10) % 2) * 8 - 8; x < w; x += 16) {
      const v = randi(-14, 14); g.fillStyle = `rgb(${88 + v},${80 + v},${72 + v})`; g.fillRect(x + 1, y + 1, 14, 8);
    }
  });
}
function chessTex() {
  return canvasTex(64, 64, (g) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#e8e2d4' : '#2a2620'; g.fillRect(x * 8, y * 8, 8, 8); } }, { repeat: false });
}
function grassTex() {   // the High Line's planting: grasses gone gold at the tips, coneflowers, rudbeckia, Queen Anne's lace
  return canvasTex(128, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 170; i++) {
      const x = rand(0, w), hh = rand(h * 0.3, h * 0.95);
      g.strokeStyle = pick(['#6a8a3a', '#8aa04a', '#5a7a34', '#b8a858', '#7a9a44', '#a89a50']); g.lineWidth = rand(1, 2.2);
      g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + rand(-6, 6), h - hh * 0.5, x + rand(-10, 10), h - hh); g.stroke();
    }
    for (let i = 0; i < 28; i++) { g.fillStyle = pick(['#b05ab8', '#e8c040', '#f0ece0', '#d86aa0', '#e8a030']); g.beginPath(); g.arc(rand(4, w - 4), rand(4, h * 0.55), rand(2, 3.6), 0, 7); g.fill(); }
  }, { repeat: false });
}
function plankTex() {   // the High Line's walk: long precast planks, combed into the planting at their ends
  return canvasTex(64, 256, (g, w, h) => {
    g.fillStyle = '#4a4844'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) {
      const v = randi(-10, 10); g.fillStyle = `rgb(${168 + v},${162 + v},${152 + v})`; g.fillRect(x + 1, 0, 6, h);
      for (let y = rand(0, 60); y < h; y += rand(40, 90)) { g.fillStyle = '#4a4844'; g.fillRect(x + 1, y, 6, 1.5); }
    }
  });
}
function roseTex() {   // the cathedral's rose window lit from inside: rings of coloured glass in stone tracery
  return canvasTex(256, 256, (g, w, h) => {
    const c = w / 2;
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#2a2420'; g.beginPath(); g.arc(c, c, 124, 0, 7); g.fill();
    for (let ring = 0; ring < 4; ring++) {
      const r0 = 18 + ring * 26, r1 = r0 + 22, n = 8 + ring * 8;
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * Math.PI * 2 + 0.02, a1 = ((k + 1) / n) * Math.PI * 2 - 0.02;
        g.fillStyle = pick(['#3a6aff', '#ff3a4a', '#ffc040', '#2ac0a0', '#8a4aff', '#ff8a3a']);
        g.beginPath(); g.arc(c, c, r1, a0, a1); g.arc(c, c, r0, a1, a0, true); g.closePath(); g.fill();
      }
    }
    g.fillStyle = '#ffe8a0'; g.beginPath(); g.arc(c, c, 14, 0, 7); g.fill();
  }, { repeat: false });
}
function flagAtlas() {   // flags round the Plaza
  const designs = [
    (g, w, h) => { g.fillStyle = '#5b92e5'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.arc(w / 2, h / 2, h * 0.28, 0, 7); g.stroke(); },
    (g, w, h) => { for (const [i, c] of ['#0055a4', '#ffffff', '#ef4135'].entries()) { g.fillStyle = c; g.fillRect((i * w) / 3, 0, w / 3 + 1, h); } },
    (g, w, h) => { for (const [i, c] of ['#009246', '#ffffff', '#ce2b37'].entries()) { g.fillStyle = c; g.fillRect((i * w) / 3, 0, w / 3 + 1, h); } },
    (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#bc002d'; g.beginPath(); g.arc(w / 2, h / 2, h * 0.3, 0, 7); g.fill(); },
    (g, w, h) => { for (const [i, c] of ['#000000', '#dd0000', '#ffce00'].entries()) { g.fillStyle = c; g.fillRect(0, (i * h) / 3, w, h / 3 + 1); } },
    (g, w, h) => { g.fillStyle = '#009c3b'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffdf00'; g.beginPath(); g.moveTo(w / 2, 6); g.lineTo(w - 8, h / 2); g.lineTo(w / 2, h - 6); g.lineTo(8, h / 2); g.fill(); g.fillStyle = '#002776'; g.beginPath(); g.arc(w / 2, h / 2, h * 0.2, 0, 7); g.fill(); },
    (g, w, h) => { g.fillStyle = '#ff0000'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.fillRect(w / 4, 0, w / 2, h); g.fillStyle = '#ff0000'; g.fillRect(w / 2 - 6, h / 2 - 10, 12, 20); g.fillRect(w / 2 - 12, h / 2 - 4, 24, 8); },
    (g, w, h) => { for (const [i, c] of ['#ff9933', '#ffffff', '#138808'].entries()) { g.fillStyle = c; g.fillRect(0, (i * h) / 3, w, h / 3 + 1); } g.strokeStyle = '#000080'; g.lineWidth = 2; g.beginPath(); g.arc(w / 2, h / 2, h * 0.12, 0, 7); g.stroke(); },
  ];
  const cw = 96, ch = 64;
  const tex = canvasTex(cw * designs.length, ch, (g) => designs.forEach((d, i) => { g.save(); g.translate(i * cw, 0); d(g, cw, ch); g.restore(); }), { repeat: false });
  return { tex, rects: designs.map((_, i) => ({ u0: i / designs.length, u1: (i + 1) / designs.length, v0: 0, v1: 1 })) };
}
function fallTex() {   // water falling down the memorial's walls: streaks that scroll downward
  const t = canvasTex(64, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { const x = rand(0, w), y = rand(0, h), l = rand(10, 40); const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(235,242,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, y, rand(1, 2.5), l); g.fillRect(x, y - h, rand(1, 2.5), l); }
  });
  return t;
}
const GHOST = ['EMPIRE STORES', 'ARBUCKLE BROS · COFFEE', 'KIRBY & SONS · TEAS', 'GAIR · PAPER BOXES', 'SWEENEY TIN WARE'];
function ghostAtlas() {   // old advertisements painted on the warehouse brick, faded
  const cw = 512, ch = 96;
  const tex = canvasTex(cw, ch * GHOST.length, (g) => {
    g.clearRect(0, 0, cw, ch * GHOST.length);
    GHOST.forEach((t, i) => {
      g.fillStyle = 'rgba(238,228,206,0.62)'; g.font = '900 54px "Russo One", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const m = g.measureText(t).width; g.save(); g.translate(cw / 2, i * ch + ch / 2); g.scale(Math.min(1, (cw - 30) / m), 1); g.fillText(t, 0, 2); g.restore();
    });
  }, { repeat: false });
  return { tex, rects: GHOST.map((_, i) => ({ u0: 0, u1: 1, v0: 1 - (i + 1) / GHOST.length, v1: 1 - i / GHOST.length })) };
}

export function nyDistricts(K, ctx) {
  const { types } = ctx;
  const harbor = waterMat('#1a2442', 10);
  // Liberty's materials keep most of their colour through the haze: she stands 180 m out over the water
  const copper = thinFog(std({ color: '#86c0aa', roughness: 0.5, metalness: 0.25, emissive: '#22584a', emissiveIntensity: 0.6 }));
  const tabletMat = thinFog(std({ map: tabletTex(), roughness: 0.5, metalness: 0.2, emissive: '#22584a', emissiveIntensity: 0.6 }));
  const gT = graniteTex();
  const granite = thinFog(std({ map: gT, vertexColors: true, roughness: 0.85, emissive: '#ffd8b0', emissiveMap: gT, emissiveIntensity: 0.1 }));
  const flame = thinFog(basic({ color: hdr('#ffc04a', 4) }));   // flickers in update

  // ---------- harbour furniture ----------
  const globeLamp = (b, x, z) => {   // the Battery's lamps: a dark green post, a white globe
    b.cyl(VC.metal, '#1f2a24', x, 1.9, z, 0.08, 3.8, 'cyl8');
    b.cyl(VC.metal, '#1f2a24', x, 0.25, z, 0.18, 0.5, 'cyl8');
    b.sph(VC.glow, hdr('#fff0d0', 2.2), x, 4.05, z, 0.3, true);
  };
  const bench = (b, x, z, ry = 0) => {
    b.box(VC.solid, '#5a4030', x, 0.45, z, 0.5, 0.08, 1.8, ry);
    b.box(VC.solid, '#5a4030', x - Math.cos(ry) * 0.25, 0.75, z + Math.sin(ry) * 0.25, 0.08, 0.5, 1.8, ry);
    for (const d of [-0.75, 0.75]) b.box(VC.metal, '#1a1a1e', x, 0.22, z + d, 0.45, 0.44, 0.06, ry);
  };
  const viewer = (b, x, z, side) => {   // a coin-operated binocular on its post, aimed out at the statue
    b.cyl(VC.metal, '#3a6a5a', x, 0.6, z, 0.08, 1.2, 'cyl8');
    b.box(VC.metal, '#3a6a5a', x, 1.32, z, 0.34, 0.3, 0.4);
    for (const d of [-0.09, 0.09]) b.cyl(VC.metal, '#2a4a40', x + side * 0.24, 1.36, z + d, 0.06, 0.2, 'cyl8', 0, Math.PI / 2);
  };
  const ferry = (b, x, z) => {   // the Staten Island Ferry: orange hull, two decks of lit windows, a wheelhouse at each end
    const y = -1.6;
    b.block(VC.solid, '#e8762a', x, y - 0.6, z, 8.4, 2.6, 30);
    b.block(VC.solid, '#1e1e22', x, y + 1.9, z, 8.6, 0.25, 30.4);
    b.block(VC.solid, '#e8762a', x, y + 2.1, z, 7.6, 2.4, 25);
    b.block(VC.solid, '#e8762a', x, y + 4.5, z, 6.8, 2.2, 19);
    for (const dy of [3.2, 5.5]) for (const s of [-1, 1]) b.box(VC.glow, hdr('#ffe2a8', 1.6), x + s * (dy < 4 ? 3.82 : 3.42), y + dy, z, 0.04, 0.9, dy < 4 ? 22 : 16);
    for (const e of [-1, 1]) {
      b.block(VC.solid, '#f2ece0', x, y + 6.7, z + e * 6.5, 3.4, 1.6, 3.2);
      b.box(VC.glow, hdr('#cfe6ff', 0.8), x, y + 7.5, z + e * 8.12, 2.6, 0.6, 0.04);
    }
    b.cyl(VC.solid, '#f2ece0', x, y + 8.6, z, 0.5, 2.4, 'cyl8');
    b.box(VC.solid, '#1e1e22', x, y + 0.2, z, 8.5, 0.3, 30.2);
    b.box(VC.glow, hdr('#ff3a2a', 3), x - 4.3, y + 2.4, z - 14, 0.2, 0.2, 0.2);
    b.box(VC.glow, hdr('#3aff6a', 3), x + 4.3, y + 2.4, z - 14, 0.2, 0.2, 0.2);
  };
  const tug = (b, x, z) => {   // a red tug pushing up the harbour
    b.block(VC.solid, '#a82a22', x, -2.2, z, 3.2, 2, 9);
    b.block(VC.solid, '#f2ece0', x, -0.2, z + 0.8, 2.4, 2, 3.4);
    b.box(VC.glow, hdr('#ffe2a8', 1.4), x, 1.2, z - 0.92, 2, 0.5, 0.04);
    b.cyl(VC.solid, '#1e1e22', x, 2.4, z + 1.6, 0.35, 1.6, 'cyl8');
  };
  const livingStatue = (b, x, z) => {   // a street performer painted green, torch up, on a crate
    b.block(VC.solid, '#5a4a3a', x, 0, z, 0.8, 0.5, 0.8);
    b.add(G.cone8, VC.solid, x, 1.3, z, 0.9, 1.6, 0.9, 0, 0, 0, '#7fb8a4');
    b.sph(VC.solid, '#7fb8a4', x, 2.25, z, 0.17, true);
    for (let k = 0; k < 5; k++) b.add(G.cone4, VC.solid, x, 2.45, z + (k - 2) * 0.08, 0.06, 0.26, 0.06, (k - 2) * 0.35, 0, 0, '#7fb8a4');
    b.add(G.box, VC.solid, x, 2.5, z + 0.3, 0.1, 0.8, 0.1, 0.2, 0, 0, '#7fb8a4');
    b.sph(VC.glow, hdr('#ffc04a', 2.5), x, 2.95, z + 0.38, 0.1, true);
  };
  const castleClinton = (b, x, z) => {   // the round sandstone fort in the park, its gun ports, the gate
    b.cyl(VC.solid, '#a8705a', x, 3.6, z, 13, 7.2, 'cyl');
    b.cyl(VC.solid, '#8a5a48', x, 7.35, z, 13.2, 0.3, 'cyl');
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2;
      b.box(VC.solid, '#2a1c16', x + Math.cos(a) * 13.02, 3.2, z + Math.sin(a) * 13.02, 0.05, 1.6, 1.0, -a);
    }
    b.box(VC.solid, '#3a2a22', x + 13.05, 2.3, z, 0.1, 4.6, 3.2);
    b.cyl(VC.metal, '#c8ccd8', x + 6, 10, z, 0.06, 8, 'cyl6');
    b.add(G.plane, ctx.flagMat, x + 6, 12.6, z + 1.0, 2.0, 1.1, 1, 0, Math.PI / 2, 0);
  };

  const marbleT = marbleTex();
  const marble = std({ map: marbleT, vertexColors: true, roughness: 0.6, emissive: '#fff0dc', emissiveMap: marbleT, emissiveIntensity: 0.42 });
  const marbleBox = (b, x, y, z, w, h, d, col = 0xffffff) => b.addM(tiledBox(w, h, d, 3.2), marble, at(x, y + h / 2, z), col);
  const parkLamp = (b, x, z) => {   // the Village's lamps: a fluted post, a lantern with a cap
    b.cyl(VC.metal, '#1e2420', x, 1.9, z, 0.09, 3.8, 'cyl8');
    b.cyl(VC.metal, '#1e2420', x, 0.3, z, 0.2, 0.6, 'cyl8');
    b.cyl(VC.glow, hdr('#ffd690', 2.2), x, 4.15, z, 0.2, 0.55, 'cyl6');
    b.add(G.cone, VC.metal, x, 4.6, z, 0.6, 0.35, 0.6, 0, 0, 0, '#1e2420');
  };

  // ---------- Washington Square: the park, its fountain, through the arch up Fifth Avenue ----------
  const ARCH = (() => {   // the arch's face, its opening 9.8 m wide and 14.6 m to the crown, extruded through 3.8 m
    const HW = 9.8, H = 23.6, VW = 4.9, VS = 9.7, D = 3.8;
    const sh = new THREE.Shape();
    sh.moveTo(-HW, 0); sh.lineTo(-VW, 0); sh.lineTo(-VW, VS); sh.absarc(0, VS, VW, Math.PI, 0, true); sh.lineTo(VW, 0); sh.lineTo(HW, 0); sh.lineTo(HW, H); sh.lineTo(-HW, H); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false, curveSegments: 18 });
    g.translate(0, 0, -D / 2);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3.2, uv.getY(i) / 3.2);
    return { g, HW, H, VW, VS, D };
  })();
  const wsqText = basic({ map: textTex('LET US RAISE A STANDARD TO WHICH THE WISE AND THE HONEST CAN REPAIR', { w: 2048, h: 96, color: '#4a4038', font: 'Georgia, "Times New Roman", serif', weight: 700, size: 0.5 }), transparent: true, color: hdr('#ffffff', 0.9) });
  const victory = basic({ map: victoryTex(), transparent: true, side: THREE.DoubleSide, color: hdr('#ffffff', 0.9) });
  const chessMat = std({ map: chessTex(), roughness: 0.6 });
  const rowWin = windowTex({ wall: '#8a3a2a', glass: '#10121a', lit: ['#ffd9a0', '#ffe8c0', '#ffcf8a'], litChance: 0.5, frame: '#f2ece2', ledge: '#ece4d8', cols: 3, rows: 4 });
  // Washington Square North: Greek Revival red brick, white marble porches with their columns, iron railings
  const rowType = { mat: facadeMat(rowWin, { k: 0.9 }), tex: rowWin, colors: ['#ffffff', '#f0dcd0', '#e8d0c4'], w: [7, 8.4], h: [14, 17], weight: 1, cellW: 2.1, cellH: 3.6,
    roof: (b, i) => b.box(VC.solid, '#f0ece4', i.face - i.side * 0.3, i.h - 0.3, i.z, 0.7, 0.6, i.len + 0.05),
    front: (b, i) => {
      const s = i.side, zd = i.z + (i.len / 2 - 1.8) * pick([-1, 1]);
      for (let k = 0; k < 5; k++) b.block(VC.solid, '#e8e2d6', i.face - s * (0.4 + k * 0.4), 0, zd, 0.42, 1.25 - k * 0.24, 2.6);
      for (const dz of [-1.0, 1.0]) b.cyl(VC.solid, '#f4f0e8', i.face - s * 1.15, 2.6, zd + dz, 0.16, 2.8, 'cyl8');
      b.box(VC.solid, '#f4f0e8', i.face - s * 0.75, 4.2, zd, 1.6, 0.45, 2.7);
      b.box(VC.glow, hdr('#ffcf8a', 1.0), i.face - s * 0.06, 2.6, zd, 0.04, 2.2, 1.2);
      b.box(VC.metal, '#141418', i.face - s * 2.2, 0.55, i.z, 0.05, 1.1, i.len - 3);
    } };
  const fountain = (b, x, z) => {   // the round fountain: granite rim, the pool, the jet in the middle and the ring of spouts
    b.add(G.cyl, VC.solid, x, 0.35, z, 22, 0.7, 22, 0, 0, 0, '#8a847a');
    b.add(G.cyl, harbor, x, 0.55, z, 20.6, 0.3, 20.6);
    b.add(G.cyl, VC.solid, x, 0.9, z, 3, 0.9, 3, 0, 0, 0, '#8a847a');
    for (const ry of [0, Math.PI / 3, (2 * Math.PI) / 3]) b.add(G.plane, K.steamMat, x, 4.6, z, 2.4, 7.4, 1, 0, ry, 0);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; b.add(G.plane, K.steamMat, x + Math.cos(a) * 7.6, 1.6, z + Math.sin(a) * 7.6, 0.9, 2.2, 1, 0, -a, 0.3); }
    for (let k = 0; k < 14; k++) { const a = rand(0, Math.PI * 2); K.person(b, x + Math.cos(a) * 11.4, z + Math.sin(a) * 11.4, { seated: true, y: 0.75 }); }
  };
  const piano = (b, x, z) => {   // the fountain's pianist at his grand piano, its lid up
    b.block(VC.solid, '#141416', x, 0.62, z, 1.5, 0.36, 1.9);
    b.add(G.box, VC.solid, x - 0.35, 1.3, z - 0.2, 0.05, 1.5, 1.7, 0, 0, 0.55, '#141416');
    for (const [dx, dz] of [[-0.6, -0.8], [0.6, -0.8], [0, 0.8]]) b.box(VC.solid, '#141416', x + dx, 0.31, z + dz, 0.1, 0.62, 0.1);
    b.box(VC.solid, '#f2f0ea', x, 0.98, z + 0.95, 1.3, 0.04, 0.18);
    b.block(VC.solid, '#141416', x, 0, z + 1.6, 0.9, 0.5, 0.4);
    K.person(b, x, z + 1.6, { seated: true, y: 0.5, coat: '#2a2a30' });
  };
  const chess = (b, x, z) => {   // a stone chess table with its players
    b.cyl(VC.solid, '#7a766e', x, 0.36, z, 0.18, 0.72, 'cyl8');
    b.block(VC.solid, '#8a867e', x, 0.72, z, 0.9, 0.06, 0.9);
    b.add(G.plane, chessMat, x, 0.79, z, 0.7, 0.7, 1, -Math.PI / 2);
    for (const dz of [-0.85, 0.85]) { b.cyl(VC.solid, '#7a766e', x, 0.22, z + dz, 0.2, 0.44, 'cyl8'); if (chance(0.85)) K.person(b, x, z + dz, { seated: true, y: 0.45 }); }
  };
  const washington = () => {
    const b = new Batcher(), AZ = -46, { HW, H, VW, VS, D } = ARCH;
    for (const s of [-1, 1]) {
      farGround(b, s, '#2c4228');
      b.box(VC.solid, '#5e5a52', s * (EDGE + 3.5), 0.03, -22, 7, 0.06, 44);   // the paths and the plaza round the arch
      for (let z = 3; z < 42; z += rand(7, 10)) for (const x of [EDGE + rand(10, 14), rand(20, 28)]) K.elm(b, s * x, -z, rand(1.05, 1.3));
      for (let z = 4; z < 44; z += 12) parkLamp(b, s * (EDGE + 1.1), -z);
      for (let z = 6; z < 40; z += 11) bench(b, s * (EDGE + 6.4), -z, s > 0 ? Math.PI : 0);
      // the Village round the park, then Washington Square North's row houses either side of Fifth Avenue
      buildingRow(b, s, types.filter((t) => t.h[1] < 30), { x0: 34, depth: [10, 14], z0: 0, z1: 44 });
      buildingRow(b, s, [rowType], { x0: 11.6, depth: [12, 15], gap: [0, 0.05], z0: 50, z1: 80, setback: [0, 0.1] });
      for (let z = 54; z < 80; z += 10) K.tree(b, s * (EDGE + 3.1), -z, rand(0.8, 0.95));
      for (let z = 52; z < 80; z += 14) parkLamp(b, s * (EDGE + 1.1), -z);
      K.crowd(b, s * (EDGE + 1.1), s * (EDGE + 6.5), 2, 78, 16);
      // NYU's violet flags out from the walls
      for (let k = 0; k < 4; k++) { const z = -rand(4, 40), x = s * 34; b.add(G.box, VC.metal, x - s * 1.2, 9, z, 2.4, 0.06, 0.06, 0, 0, 0, '#c8ccd8'); b.add(G.plane, VC.solid, x - s * 1.4, 7.85, z, 1.6, 2.2, 1, 0, 0, 0, '#57068c'); }
    }
    fountain(b, -24, -24);
    piano(b, -(EDGE + 5.2), -30);
    for (let k = 0; k < 5; k++) chess(b, EDGE + 4.2 + (k % 2) * 2.2, -8 - k * 3.4);
    // the arch: floodlit marble, the archivolt and its keystone eagle, the Victories in the spandrels, the frieze, the
    // cornice, the attic and its inscription; Washington on each pier
    b.addM(ARCH.g, marble, at(0, 0, AZ), '#ffffff');
    for (const sx of [-1, 1]) {
      b.box(VC.solid, '#e8e2d6', sx * (VW + HW) / 2, VS - 0.25, AZ, HW - VW + 0.2, 0.5, D + 0.4);
      b.box(VC.solid, '#e2dccf', sx * (HW + 0.15), 0.6, AZ, 0.4, 1.2, D + 0.6);
    }
    for (let k = 0; k <= 14; k++) { const a = Math.PI * (k / 14), r = VW + 0.4; b.add(G.box, marble, Math.cos(a) * r, VS + Math.sin(a) * r, AZ, 0.95, 0.75, D + 0.3, 0, 0, a - Math.PI / 2, '#f4f0e8'); }
    b.box(VC.solid, '#f4f0e8', 0, VS + VW + 0.9, AZ, 1.5, 2.2, D + 0.6);
    for (const e of [-1, 1]) {
      const fz = AZ + e * (D / 2 + 0.36), ry = e > 0 ? 0 : Math.PI;
      for (const sx of [-1, 1]) b.add(G.sph, VC.solid, sx * 0.9, VS + VW + 1.3, fz, 1.9, 0.5, 0.2, 0, 0, sx * 0.35, '#e8e2d6');   // the eagle's wings
      for (const sx of [-1, 1]) b.add(G.plane, victory, sx * (VW + 2.5), VS + VW * 0.62, AZ + e * (D / 2 + 0.03), sx * 4.8, 2.4, 1, 0, ry, 0);
      b.add(G.plane, wsqText, 0, 21.7, AZ + e * (D / 2 + 0.03), 2 * HW - 2.4, 1.0, 1, 0, ry, 0);
    }
    b.box(VC.solid, '#e8e2d6', 0, 17.8, AZ, 2 * HW + 0.3, 1.2, D + 0.3);
    b.box(VC.solid, '#f0ece4', 0, 19.5, AZ, 2 * HW + 1.2, 0.8, D + 1.2);
    b.box(VC.solid, '#f0ece4', 0, H + 0.25, AZ, 2 * HW + 0.6, 0.5, D + 0.6);
    for (const sx of [-1, 1]) {   // George Washington in War and in Peace, on the north face
      const px = sx * 7.35, pz = AZ + D / 2 + 1.1;
      marbleBox(b, px, 0, pz, 3.4, 2.6, 2.0);
      b.add(G.cone8, marble, px, 4.5, pz + 0.2, 1.5, 3.8, 1.2, 0, 0, 0, '#f4f0e8');
      b.sph(marble, '#f4f0e8', px, 6.75, pz + 0.2, 0.42);
      b.add(G.box, marble, px - sx * 0.4, 5.6, pz + 0.3, 1.6, 0.35, 0.35, 0, 0, sx * 0.5, '#f4f0e8');
      for (const o of [-1.2, 1.2]) b.add(G.cone8, marble, px + o, 4.1, pz - 0.4, 0.9, 3.0, 0.8, 0, 0, 0, '#e8e2d6');
      b.box(VC.glow, hdr('#ffe8c0', 2.2), px, 0.15, pz + 1.6, 1.2, 0.3, 0.4);
    }
    return b.build();
  };

  // ---------- DUMBO: Washington Street under the Manhattan Bridge ----------
  const cobT = cobbleTex(); cobT.repeat.set(1.4, 16);
  const cobbles = std({ map: cobT, roughness: 0.8 });
  const whWin = windowTex({ wall: '#7a3424', glass: '#14161c', lit: ['#ffd9a0', '#ffe8c0', '#fff4dc'], litChance: 0.45, arch: true, frame: '#3a1a12', ledge: '#5a2a1e', cols: 4, rows: 8 });
  const ghosts = ghostAtlas();
  const ghostMat = basic({ map: ghosts.tex, transparent: true, depthWrite: false, color: hdr('#ffffff', 0.75) });
  const warehouse = { mat: facadeMat(whWin, { k: 0.9 }), tex: whWin, colors: ['#ffffff', '#ead2c4', '#d8baa8'], w: [16, 26], h: [20, 32], weight: 1, cellW: 2.4, cellH: 3.6,
    roof: (b, i) => { if (chance(0.5)) K.waterTower(b, i); },
    front: (b, i) => {   // a loading dock with its steel canopy on rods, the doors lit, an old painted sign up on the brick
      const s = i.side, L = i.len - 1.2;
      b.block(VC.solid, '#4a4846', i.face - s * 0.7, 0, i.z, 1.4, 1.1, L);
      b.box(VC.metal, '#3a3c40', i.face - s * 1.3, 4.4, i.z, 2.6, 0.12, L);
      for (let dz = -L / 2 + 0.6; dz <= L / 2 - 0.6; dz += Math.max(2, L / 4)) beam(b, VC.metal, i.face - s * 0.05, 6.4, i.z + dz, i.face - s * 2.5, 4.46, i.z + dz, 0.05, '#2a2c30');
      const n = Math.max(2, Math.floor(L / 4.5));   // the dock doors, some open onto lit shops and studios
      for (let k = 0; k < n; k++) b.box(VC.glow, chance(0.6) ? hdr(pick(['#ffc880', '#ffd9a0', '#ffb870']), 0.62) : hdr('#2a2420', 1), i.face - s * 0.05, 2.5, i.z - L / 2 + (k + 0.5) * (L / n), 0.04, 2.2, Math.min(3, L / n - 0.8));
      if (chance(0.65)) b.add(planeUV(pick(ghosts.rects)), ghostMat, i.face - s * 0.07, rand(12, Math.max(13, i.h - 5)), i.z, Math.min(L, 14), 2.6, 1, 0, -s * Math.PI / 2);
    } };
  const BLUE = '#7a8ca0';
  const train = () => {   // a Q train crossing on the bridge's lower deck
    const t = new Batcher();
    for (let k = 0; k < 6; k++) {
      const x = k * 15.6;
      t.block(VC.metal, '#b8bec8', x, 0, 0, 15, 3.2, 2.9);
      t.box(VC.glow, hdr('#fff0d0', 1.3), x, 1.9, 1.46, 13, 0.8, 0.04);
      t.box(VC.glow, hdr('#fff0d0', 1.3), x, 1.9, -1.46, 13, 0.8, 0.04);
      t.box(VC.solid, '#fccc0a', x, 2.95, 1.47, 15, 0.12, 0.04);
    }
    t.box(VC.glow, hdr('#fff4d6', 3), 5 * 15.6 + 7.55, 1.2, 0, 0.1, 0.4, 2.2);
    return t.build();
  };
  const trains = [];
  const dumbo = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) {
      farGround(b, s, '#2a2220');
      b.add(G.plane, cobbles, s * (EDGE + 3.5), 0.04, -40, 7, 80, 1, -Math.PI / 2);
      for (const o of [-0.72, 0.72]) b.box(VC.metal, '#5a5a60', s * (EDGE + 3.5) + o, 0.06, -40, 0.1, 0.04, 80);   // the old freight rails in the cobbles
      buildingRow(b, s, [warehouse], { x0: 11, depth: [16, 22], gap: [0, 0.3], z0: 0, z1: 80 });
      for (let z = 6; z < 80; z += 16) parkLamp(b, s * (EDGE + 1.0), -z);
      K.crowd(b, s * (EDGE + 1.1), s * (EDGE + 6.6), 2, 78, 14);
    }
    // the photo spot: people out in the street with their phones up toward the bridge
    for (let k = 0; k < 9; k++) { const x = rand(-8.5, -4.6) * pick([-1, 1]), z = -rand(10, 26); K.person(b, x, z); b.box(VC.glow, hdr('#cfe6ff', 1.6), x, 1.85, z - 0.25, 0.14, 0.24, 0.02); }
    // the approach span overhead: a double-deck stiffening truss, painted blue-grey, its lamps along the rail
    const BZ = -58, BY = 25, BW = 24;
    b.box(VC.solid, '#3a4048', 0, BY + 0.3, BZ, 340, 0.6, BW);
    b.box(VC.solid, '#3a4048', 0, BY + 7.3, BZ, 340, 0.5, BW);
    for (const dz of [-BW / 2, BW / 2]) {
      b.box(VC.metal, BLUE, 0, BY, BZ + dz, 340, 0.9, 0.9);
      b.box(VC.metal, BLUE, 0, BY + 7.2, BZ + dz, 340, 0.9, 0.9);
      for (let x = -168; x < 168; x += 8) {
        beam(b, VC.metal, x, BY, BZ + dz, x + 4, BY + 7.2, BZ + dz, 0.45, BLUE);
        beam(b, VC.metal, x + 4, BY + 7.2, BZ + dz, x + 8, BY, BZ + dz, 0.45, BLUE);
        b.box(VC.glow, hdr('#ffe0a0', 2), x, BY + 8.1, BZ + dz, 0.25, 0.25, 0.25);
      }
    }
    for (let x = -168; x < 168; x += 8) b.box(VC.metal, BLUE, x, BY - 0.7, BZ, 0.7, 1.4, BW);
    // the Brooklyn tower beyond, straddling the street: battered steel legs on granite piers, X-bracing, the arched portal
    const TZ = -79, LX = (y) => 8.6 - (y / 98) * 1.6;   // the legs' centres, leaning in a little as they rise
    for (const sx of [-1, 1]) {
      b.block(VC.solid, '#6a645e', sx * 8.6, -0.5, TZ, 5.4, 3.5, 7);
      beam(b, VC.metal, sx * LX(3), 3, TZ, sx * LX(98), 98, TZ, 3.4, BLUE, 5.0);
      b.add(G.cone4, VC.metal, sx * LX(98), 101.5, TZ, 3.8, 7, 3.8, 0, 0, 0, BLUE);
      b.sph(VC.metal, BLUE, sx * LX(98), 105.4, TZ, 0.8);
      for (let y = 6; y < 96; y += 4) b.box(VC.glow, hdr('#ffe0a0', 1.4), sx * (LX(y) - 1.75), y, TZ + 2.55, 0.18, 0.18, 0.18);
    }
    for (const [y0, y1] of [[34, 54], [54, 72], [72, 86]]) {
      const w0 = LX(y0) - 1.7, w1 = LX(y1) - 1.7;
      beam(b, VC.metal, -w0, y0, TZ, w1, y1, TZ, 1.0, BLUE); beam(b, VC.metal, w0, y0, TZ, -w1, y1, TZ, 1.0, BLUE);
      b.box(VC.metal, BLUE, 0, y0, TZ, 2 * w0, 1.4, 1.6);
    }
    const portal = new THREE.Shape();   // the arched crown between the legs
    portal.moveTo(-8.4, 0); portal.lineTo(-5.4, 0); portal.absarc(0, 0, 5.4, Math.PI, 0, true); portal.lineTo(8.4, 0); portal.lineTo(8.4, 9); portal.lineTo(-8.4, 9); portal.closePath();
    const pg = new THREE.ExtrudeGeometry(portal, { depth: 2.4, bevelEnabled: false, curveSegments: 14 }); pg.translate(0, 0, -1.2);
    b.addM(pg, VC.metal, at(0, 86, TZ), BLUE);
    b.box(VC.metal, BLUE, 0, 95.6, TZ, 19, 1.2, 3.2);
    const g = b.build();
    const q = train(); q.position.set(-300, BY + 0.6, BZ + BW / 2 - 3.4); g.add(q); trains.push(q);
    return g;
  };

  // ---------- the High Line: the old freight viaduct turned park, nine metres over the West Side, out to the Vessel ----------
  const grassMat = foliageMat(grassTex(), { sway: 0.18, alphaTest: 0.45 });
  const GRASS = (() => { const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0); g.setAttribute('aSway', new THREE.BufferAttribute(new Float32Array([1, 1, 0, 0]), 1)); return g; })();
  const plankT = plankTex(); plankT.repeat.set(1, 8);
  const plankMat = std({ map: plankT, roughness: 0.85 });
  const stdWin = windowTex({ wall: '#c8c4bc', glass: '#1a1e28', lit: ['#ffe0b0', '#fff0d0', '#ffd090'], litChance: 0.55, cols: 8, rows: 16, frame: '#e8e4dc' });
  const stdMat = facadeMat(stdWin, { k: 0.9, rough: 0.4, metal: 0.3 });
  const lowered = (b, dy, fn) => {   // build at ground level, then drop it into place (the streets under the High Line)
    const low = new Batcher(); fn(low);
    const g = low.build(), m = new THREE.Matrix4().makeTranslation(0, dy, 0);
    for (const mesh of g.children) b.addM(mesh.geometry, mesh.material, m, null);
  };
  const vessel = (b, x, y0, z) => {   // the Vessel: flights of stairs crossing each other in a bowl of copper diamonds
    const N = 14, R0 = 7.5, R1 = 21, H = 45, L = 7;
    const P = (a, t) => { const r = R0 + (R1 - R0) * Math.pow(t, 1.3); return new THREE.Vector3(x + Math.cos(a) * r, y0 + H * t, z + Math.sin(a) * r); };
    const M = new THREE.Matrix4(), X = new THREE.Vector3(), Yv = new THREE.Vector3(), Z = new THREE.Vector3(), S = new THREE.Vector3();
    for (const d of [-1, 1]) for (let i = 0; i < N; i++) for (let k = 0; k < L; k++) {
      const a = ((i + (k % 2 ? 0.5 : 0) * 0) / N) * Math.PI * 2 + (d * k * Math.PI) / N;
      const p0 = P(a, k / L), p1 = P(a + (d * Math.PI) / N, (k + 1) / L);
      Yv.subVectors(p1, p0); const len = Yv.length(); Yv.normalize();
      const mid = p0.clone().add(p1).multiplyScalar(0.5);
      Z.set(mid.x - x, 0, mid.z - z).normalize(); X.crossVectors(Yv, Z).normalize(); Z.crossVectors(X, Yv).normalize();
      M.makeBasis(X, Yv, Z).scale(S.set(2.3, len + 0.7, 0.45)).setPosition(mid);
      b.addM(G.box, VC.metal, M, '#c07a40');
      if (d > 0) { const q = P(a + Math.PI / N, (k + 1) / L); b.add(G.box, VC.solid, q.x, q.y - 0.1, q.z, 2.6, 0.3, 2.6, 0, -a, 0, '#a86a38'); b.add(G.box, VC.glow, q.x, q.y - 0.32, q.z, 1.6, 0.06, 1.6, 0, -a, 0, hdr('#ffd8a0', 1.2)); }
    }
    b.add(G.cyl, VC.solid, x, y0 + 0.2, z, R0 * 2 + 3, 0.4, R0 * 2 + 3, 0, 0, 0, '#8a8478');
  };
  const highLine = () => {
    const b = new Batcher(), Y = -9, W = EDGE + 7, PB = EDGE + 3.2;   // the street below, the deck's edge, where the beds give way to the walk
    // the West Side below: its buildings, the traffic, the lamps, the people
    lowered(b, Y, (low) => {
      for (const s of [-1, 1]) {
        low.box(VC.solid, '#222226', s * 46, -0.1, -40, 92, 0.2, 80);
        buildingRow(low, s, types, { x0: 15, depth: [10, 16], z0: 0, z1: s > 0 ? 42 : 80 });   // on the right the block opens onto Hudson Yards' square
        for (let z = rand(4, 12); z < 76; z += rand(8, 13)) K.taxi(low, s * rand(4.5, 9), -z);
        for (let z = 6; z < 80; z += 16) lamp(low, s * 13.6, -z, s, { light: '#ffcf8a', k: 3.2 });
        K.crowd(low, s * 12.2, s * 14.6, 2, 78, 10);
      }
    });
    // where the next block's ground comes back up: a wall of shopfronts closing the street
    b.box(VC.solid, '#3a302c', 0, Y / 2 - 0.1, -79.4, 182, -Y, 1.2);
    for (let x = -88; x < 88; x += 7) if (Math.abs(x) > W + 2) b.box(VC.glow, hdr(pick(['#ffd9a0', '#ffcf8a', '#fff0d0', '#cfe6ff']), 0.7), x, Y + 2.2, -78.75, 4.6, 2.6, 0.06);
    // the viaduct: the deck, the riveted edge girders, the steel columns down to the street
    b.box(VC.solid, '#2e302e', 0, -0.95, -40, 2 * W, 1.7, 80);
    for (const s of [-1, 1]) {
      b.box(VC.metal, '#2a2e2a', s * (W + 0.1), -0.9, -40, 0.4, 1.9, 80);
      for (let z = 0.6; z < 80; z += 1.2) b.box(VC.metal, '#3a3e3a', s * (W + 0.32), -0.9, -z, 0.06, 1.7, 0.1);
      for (let z = 5; z < 80; z += 12) { b.box(VC.metal, '#262a26', s * (W - 0.8), (Y - 1.8) / 2, -z, 0.9, -Y - 1.8, 0.9); b.box(VC.metal, '#262a26', 0, -2.2, -z, 2 * W, 0.7, 0.6); }
      // the railing, its light strip under the handrail
      b.box(VC.metal, '#1e211e', s * (W - 0.15), 1.05, -40, 0.08, 0.08, 80);
      for (let z = 0.6; z < 80; z += 1.6) b.box(VC.metal, '#1e211e', s * (W - 0.15), 0.52, -z, 0.05, 1.04, 0.05);
      b.box(VC.glow, hdr('#fff0d0', 1.2), s * (W - 0.22), 0.86, -40, 0.03, 0.05, 80);
      // the planting: soil, grasses and perennials swaying, young trees, the old rails left in among them
      b.box(VC.solid, '#3a2e24', s * (EDGE + PB) / 2, 0.08, -40, PB - EDGE, 0.16, 80);
      for (let z = 0.5; z < 80; z += 1.3) for (const ry of [0.35, -0.55]) b.add(GRASS, grassMat, s * rand(EDGE + 0.4, PB - 0.3), 0.12, -z - rand(0, 1), rand(1.6, 2.4), rand(0.7, 1.15), 1, 0, ry + rand(-0.3, 0.3), 0);
      for (const o of [-0.55, 0.55]) b.box(VC.metal, '#6a5a4a', s * (EDGE + PB) / 2 + o, 0.2, -40, 0.1, 0.1, 80);
      for (let z = rand(4, 10); z < 80; z += rand(10, 16)) K.maple(b, s * (PB - 0.9), -z, 0.55);
      // the walk: concrete planks, the wooden loungers that peel up out of them, people out for the sunset
      b.add(G.plane, plankMat, s * (PB + W) / 2, 0.07, -40, W - PB - 0.2, 80, 1, -Math.PI / 2);
      for (let z = rand(6, 14); z < 76; z += rand(14, 22)) { b.add(G.box, VC.solid, s * (PB + 1.0), 0.32, -z, 0.7, 0.1, 2.6, 0.22, 0, 0, '#8a5a34'); if (chance(0.6)) K.person(b, s * (PB + 1.0), -z, { seated: true, y: 0.42 }); }
      K.crowd(b, s * (PB + 0.6), s * (W - 0.7), 2, 78, 14);
    }
    // the Standard, standing over the High Line on its concrete legs
    const SZ = -34;
    for (const sx of [-1, 1]) for (const dz of [-5, 5]) b.box(VC.solid, '#b8b4ac', sx * (W + 1.7), (Y + 14.5) / 2, SZ + dz, 1.6, 14.5 - Y, 1.6);
    b.addM(buildingGeo(72, 46, 14, stdWin, 2.0, 3.0), stdMat, at(0, 14.5, SZ), '#ffffff');
    b.box(VC.solid, '#d8d4cc', 0, 14.15, SZ, 72.2, 0.7, 14.4);
    for (let x = -30; x <= 30; x += 6) b.box(VC.glow, hdr('#fff0d0', 1.4), x, 13.75, SZ, 1.2, 0.08, 1.2);
    // Hudson Yards: the Vessel in its square, the towers going up behind
    for (let k = 0; k < 10; k++) K.elm(b, rand(18, 30), -rand(46, 78), rand(0.8, 1.0), { y: Y });
    vessel(b, 54, -0.1, -98);   // out past the block, where the line of sight from the High Line clears the next street's buildings
    b.addM(buildingGeo(34, 210, 46, ctx.glass, 1.3, 2.6), ctx.glassMat, at(74, Y, -152), '#c8d4f0');
    b.addM(buildingGeo(30, 170, 30, ctx.glass, 1.3, 2.6), ctx.glassMat, at(-58, Y, -128), '#b8c8e8');
    return b.build();
  };

  // ---------- Rockefeller Center and St. Patrick's, facing each other across Fifth Avenue ----------
  const rockWin = windowTex({ wall: '#d0c8b6', glass: '#1c2028', lit: ['#ffe0a8', '#fff0d0', '#ffd890'], litChance: 0.5, cols: 6, rows: 16, frame: '#e4dccc' });
  const rockMat = facadeMat(rockWin, { k: 0.9 });
  const gold = std({ color: '#e8b04a', roughness: 0.3, metalness: 0.85, emissive: '#c88a20', emissiveIntensity: 0.7 });
  const bronze = std({ color: '#6a5232', roughness: 0.4, metalness: 0.75, emissive: '#2a1a08', emissiveIntensity: 0.6 });
  const rose = basic({ map: roseTex(), transparent: true, color: hdr('#ffffff', 1.25) });
  const flags = flagAtlas();
  const flagM = std({ map: flags.tex, side: THREE.DoubleSide, roughness: 0.8, emissive: '#ffffff', emissiveMap: flags.tex, emissiveIntensity: 0.45 });
  const rockBlock = (b, s, z0, z1, h, x0 = 11, d = 20) => b.addM(buildingGeo(d, h, z1 - z0, rockWin, 1.6, 3.2), rockMat, at(s * (x0 + d / 2), 0, -(z0 + z1) / 2), '#ffffff');
  const atlas = (b, x, z) => {   // Atlas holding up the heavens: the armillary sphere's rings on his shoulders, facing the cathedral
    b.block(VC.solid, '#5a5650', x, 0, z, 3.4, 2.6, 3.4);
    const F = frame(b, x, 2.6, z, 1, Math.PI);   // he faces -x, across the avenue
    F.limb(bronze, 0xffffff, [0, 0, 0.7], [0.5, 2.0, 0.6], 0.42, 0.34);   // the front leg stepping forward, bent
    F.limb(bronze, 0xffffff, [-0.9, 0, -0.6], [-0.1, 2.2, -0.5], 0.42, 0.34);
    F.limb(bronze, 0xffffff, [0.2, 2.0, 0], [0.4, 4.0, 0], 0.75, 0.9);   // the body leaning into the load
    F.ell(bronze, 0xffffff, 0.9, 4.1, 0, 0.36, 0.42, 0.36);
    for (const e of [-1, 1]) F.limb(bronze, 0xffffff, [0.4, 4.0, e * 0.85], [0.2, 5.6, e * 1.5], 0.3, 0.24);
    const C = [0.0, 6.6, 0];   // the sphere: three great rings, the ecliptic band, the axis pointing at the pole star
    for (const [rx, rz] of [[0, 0], [Math.PI / 2, 0], [Math.PI / 2, Math.PI / 2]]) F.add(G.tor, bronze, ...C, 6.2, 6.2, 3, rx, 0, rz);
    F.add(G.tor, bronze, ...C, 6.4, 6.4, 7, Math.PI / 2, 0, 0.41);
    F.limb(bronze, 0xffffff, [C[0] - 1.6, C[1] - 3.7, 0], [C[0] + 1.6, C[1] + 3.7, 0], 0.08, 0.08, 6);
    b.box(VC.glow, hdr('#ffe8c0', 2.2), x - 2, 0.15, z, 0.4, 0.3, 1.2);
  };
  const cathedral = (b, fx, zc) => {   // St. Patrick's: the twin towers and spires, the gable with its rose window, the portals, the nave
    const TW = 9, SP = 27;
    for (const e of [-1, 1]) {
      const tz = zc + e * SP / 2, tx = fx - TW / 2;
      marbleBox(b, tx, 0, tz, TW, 40, TW);
      for (const o of [-1.6, 1.6]) { b.box(VC.glow, hdr(pick(['#5a7aff', '#ff6a5a', '#ffc860']), 0.75), fx + 0.04, 22, tz + o, 0.05, 9, 1.4); b.add(G.cone4, VC.glow, fx + 0.04, 27.3, tz + o, 1.4, 1.6, 0.06, 0, Math.PI / 2, 0, hdr('#ffc860', 0.75)); }
      for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { b.cyl(marble, '#f4f0e8', tx + dx * (TW / 2 - 0.4), 42, tz + dz * (TW / 2 - 0.4), 0.5, 4, 'cyl8'); b.add(G.cone8, marble, tx + dx * (TW / 2 - 0.4), 45.5, tz + dz * (TW / 2 - 0.4), 1.0, 3.2, 1.0, 0, 0, 0, '#f4f0e8'); }
      b.cyl(marble, '#f0ece4', tx, 43, tz, TW * 0.42, 6, 'cyl8');
      b.add(G.cone8, marble, tx, 46 + 18, tz, TW * 0.78, 36, TW * 0.78, 0, Math.PI / 8, 0, '#f0ece4');
      for (let k = 0; k < 8; k++) b.add(G.cone4, marble, tx + Math.cos((k * Math.PI) / 4) * 3.0, 50 + (k % 2) * 6, tz + Math.sin((k * Math.PI) / 4) * 3.0, 0.5, 1.6, 0.5, 0, 0, 0, '#f4f0e8');
      b.add(G.box, VC.metal, tx, 83, tz, 0.15, 2.2, 0.15, 0, 0, 0, '#c8a040'); b.add(G.box, VC.metal, tx, 83.4, tz, 0.15, 0.15, 1.2, 0, 0, 0, '#c8a040');
    }
    // the middle of the front: the great portal under its gable, the rose window over it
    marbleBox(b, fx - 2.5, 0, zc, 5, 31, SP - TW);
    const tri = new THREE.Shape(); tri.moveTo(-(SP - TW) / 2, 0); tri.lineTo((SP - TW) / 2, 0); tri.lineTo(0, 10); tri.closePath();
    const tg = new THREE.ExtrudeGeometry(tri, { depth: 5, bevelEnabled: false }); tg.rotateY(Math.PI / 2); tg.translate(-5, 0, 0);
    b.addM(tg, marble, at(fx, 31, zc), '#f0ece4');
    b.add(G.plane, rose, fx + 0.06, 22.5, zc, 9, 9, 1, 0, Math.PI / 2, 0);
    b.box(VC.solid, '#2a2420', fx + 0.03, 6, zc, 0.06, 12, 6.4);
    b.add(G.cone4, VC.solid, fx + 0.03, 13.4, zc, 6.4, 3.2, 0.06, 0, Math.PI / 2, 0, '#2a2420');
    b.box(VC.glow, hdr('#d8a050', 0.9), fx + 0.06, 4.4, zc, 0.04, 8.6, 4.4);
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#d8a050', 0.7), fx + 0.06, 3.6, zc + e * SP / 2, 0.04, 6.4, 2.6);
    // the nave and its steep roof running back from the avenue, buttresses down its sides
    marbleBox(b, fx - 45, 0, zc, 80, 30, SP - TW + 2, '#ece8e0');
    b.add(G.cone4, VC.solid, fx - 45, 34.5, zc, 80 * 1.42, 9, (SP - TW + 3) * 1.42, 0, Math.PI / 4, 0, '#4a5a5a');
    for (let k = 0; k < 8; k++) for (const e of [-1, 1]) { const x = fx - 12 - k * 9; marbleBox(b, x, 0, zc + e * ((SP - TW) / 2 + 2.6), 1.6, 22, 2.2); b.add(G.box, marble, x, 25, zc + e * ((SP - TW) / 2 + 1.6), 1.2, 6, 1.2, e * 0.5, 0, 0, '#ece8e0'); }
    for (let k = 0; k < 7; k++) marbleBox(b, fx + 1.2 + k * 0.5, 0, zc, 0.5, 1.6 - k * 0.22, SP + 4);   // the steps up from the sidewalk
    for (let k = 0; k < 14; k++) K.person(b, fx + rand(1.4, 4.0), zc + rand(-SP / 2, SP / 2), { seated: chance(0.5), y: 0.7 });
    for (const e of [-1, 1]) b.box(VC.glow, hdr('#ffe8c0', 2.2), fx + 4.6, 0.15, zc + e * SP / 2, 0.4, 0.3, 1.0);
  };
  const rockefeller = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) {
      farGround(b, s, '#26242a');
      for (let z = 6; z < 80; z += 16) lamp(b, s * (EDGE + 1.4), -z, s, { light: '#ffcf8a', k: 3.4 });
      K.crowd(b, s * (EDGE + 1.1), s * (EDGE + 6.6), 2, 78, 22);
    }
    // the west side: La Maison Française, the Channel Gardens opening onto the Plaza, the British Empire Building, the
    // International Building with Atlas in its forecourt; 30 Rockefeller Plaza rising behind
    rockBlock(b, 1, 0, 14, 26);
    rockBlock(b, 1, 26, 40, 26);
    rockBlock(b, 1, 42, 48, 16, 11, 26);
    rockBlock(b, 1, 48, 72, 16, 22, 15);   // set back round Atlas's forecourt
    rockBlock(b, 1, 72, 80, 16, 11, 26);
    b.addM(buildingGeo(20, 110, 30, rockWin, 1.6, 3.2), rockMat, at(36, 16, -62), '#ffffff');
    for (let k = 0; k < 6; k++) {   // the gardens' pools, their fountains and flower beds, stepping down toward the Plaza
      const x = 13 + k * 3.6;
      b.block(VC.solid, '#8a8478', x, 0, -20, 2.8, 0.5, 3.6);
      b.add(G.plane, harbor, x, 0.52, -20, 2.4, 3.2, 1, -Math.PI / 2);
      b.add(G.plane, K.steamMat, x, 1.0, -20, 0.6, 1.0, 1, 0, Math.PI / 2, 0);
      for (const e of [-1, 1]) b.block(VC.solid, pick(['#c83a5a', '#e8c040', '#f0ece0', '#8a4ad0']), x, 0, -20 + e * 3.4, 2.6, 0.55, 1.6);
    }
    K.crowd(b, 12, 33, 15, 25, 10);
    // the Plaza: sunken, café umbrellas out for the summer, golden Prometheus over his fountain, the flags all round
    b.box(VC.solid, '#5a564e', 45, -2.6, -20, 22, 0.2, 20);
    for (const [x, z, w, d] of [[34, -20, 0.6, 20], [56, -20, 0.6, 20], [45, -10, 22, 0.6], [45, -30, 22, 0.6]]) b.box(VC.solid, '#7a766c', x, -1.3, z, w, 2.8, d);
    for (let k = 0; k < 8; k++) { const x = 38 + (k % 4) * 4, z = -15 - Math.floor(k / 4) * 7; b.cyl(VC.metal, '#c8ccd8', x, -1.4, z, 0.04, 2.4, 'cyl6'); b.add(G.cone8, VC.solid, x, -0.3, z, 2.6, 0.6, 2.6, 0, 0, 0, pick(['#e8e2d4', '#c83a3a', '#2a5aa0'])); }
    b.box(VC.glow, hdr('#ffe0a8', 1.1), 55.6, -0.4, -20, 0.1, 4, 14);
    const PF = frame(b, 54.2, 1.6, -20, 1.4, Math.PI);   // Prometheus, flying down with the stolen fire
    PF.ell(gold, 0xffffff, 0, 0.3, 0, 2.4, 0.8, 0.7);
    PF.ell(gold, 0xffffff, 1.9, 0.9, 0, 0.5, 0.5, 0.5);
    PF.limb(gold, 0xffffff, [1.2, 0.6, 0.3], [2.6, 2.0, 0.8], 0.26, 0.2);
    PF.limb(gold, 0xffffff, [-1.6, 0.2, 0.2], [-3.2, -0.6, 0.6], 0.3, 0.22);
    PF.limb(gold, 0xffffff, [-1.6, 0.2, -0.2], [-2.8, 0.9, -0.9], 0.3, 0.22);
    PF.ell(VC.glow, hdr('#ffb040', 3), 2.75, 2.25, 0.85, 0.28, 0.4, 0.28, true);
    b.add(G.tor, gold, 52.4, 1.8, -20, 7.6, 7.6, 2, 0, Math.PI / 2, 0);
    for (let k = 0; k < 26; k++) {
      const a = (k / 26) * Math.PI * 2, x = 45 + Math.cos(a) * 13.5, z = -20 + Math.sin(a) * 11.5;
      b.cyl(VC.metal, '#d8dce4', x, 4.5, z, 0.06, 9, 'cyl6');
      b.add(planeUV(flags.rects[k % flags.rects.length]), flagM, x + 0.75, 8.2, z, 1.5, 1.0, 1, 0, -a + Math.PI / 2, 0);
    }
    // 30 Rockefeller Plaza: the slab's slim end toward the avenue, its setbacks, the Top of the Rock
    b.addM(buildingGeo(56, 150, 24, rockWin, 1.6, 3.2), rockMat, at(92, 0, -20), '#f4ece0');
    b.addM(buildingGeo(40, 26, 18, rockWin, 1.6, 3.2), rockMat, at(98, 150, -20), '#f4ece0');
    for (const [y, w] of [[150, 56], [176, 40]]) b.box(VC.glow, hdr('#fff0d0', 1.6), 92 + (56 - w) / 2, y + 0.3, -20, w + 0.3, 0.4, 24.3 - (56 - w) * 0.15);
    atlas(b, 16, -60);
    // the east side: Saks with its lit windows and flags, then the cathedral
    rockBlock(b, -1, 0, 30, 34);
    for (let z = 2; z < 28; z += 4.2) b.box(VC.glow, hdr(pick(['#ffe8c0', '#ffd0d8', '#d8f0ff']), 0.85), -11.02, 2.2, -z - 1.6, 0.04, 2.8, 3.2);
    for (let z = 4; z < 28; z += 8) { b.add(G.box, VC.metal, -12.2, 9.5, -z, 2.4, 0.06, 0.06, 0, 0, 0, '#c8ccd8'); b.add(G.plane, ctx.flagMat, -12.6, 8.6, -z, 1.6, 1.0, 1); }
    cathedral(b, -(EDGE + 13.5), -56);
    return b.build();
  };

  // ---------- the World Trade Center: the Oculus's white wings, the memorial, One WTC going up out of sight ----------
  const oculusMat = std({ color: '#e8e6e2', roughness: 0.45, emissive: '#fff4e8', emissiveIntensity: 0.16 });
  const wtcGlass = std({ vertexColors: true, roughness: 0.12, metalness: 0.85, emissive: '#1a2034', emissiveIntensity: 0.4 });
  const fallT = fallTex(); fallT.repeat.set(4, 1);
  const fallMat = basic({ map: fallT, transparent: true, depthWrite: false, color: hdr('#e8f0ff', 0.85), side: THREE.DoubleSide });
  const wtc = () => {
    const b = new Batcher();
    const MX = -36, MZ = -36, MS = 26;
    farGround(b, 1, '#2a2c32');
    b.box(VC.solid, '#4a4a4e', 48, -0.08, -40, 76, 0.06, 80);   // the plaza's granite; on the left, round the pool's void
    for (const [x0, x1, z0, z1] of [[10.75, -MX - MS / 2, 0, 80], [-MX + MS / 2, 91, 0, 80], [-MX - MS / 2, -MX + MS / 2, 0, -MZ - MS / 2], [-MX - MS / 2, -MX + MS / 2, -MZ + MS / 2, 80]])
      b.box(VC.solid, '#4a4a4e', -(x0 + x1) / 2, -0.12, -(z0 + z1) / 2, x1 - x0, 0.14, z1 - z0);
    for (const s of [-1, 1]) {
      for (let z = 6; z < 80; z += 16) lamp(b, s * (EDGE + 1.4), -z, s, { light: '#fff0d8', k: 3.2 });
      K.crowd(b, s * (EDGE + 1.1), s * (EDGE + 6.6), 2, 78, 14);
    }
    // the Oculus: the white ribs rising from its spine and leaning out, a bird let go from a pair of hands
    const OX = 31, OZ = -40, LEN = 66, N = 13;
    b.add(G.sph, oculusMat, OX, -1, OZ, 22, 13, LEN);
    b.box(VC.glow, hdr('#fff4e0', 1.8), OX, 5.4, OZ, 1.4, 0.3, LEN * 0.8);
    for (let k = 0; k < 9; k++) b.box(VC.glow, hdr('#ffe8c8', 0.9), OX - 10.2, 1.6, OZ - 24 + k * 6, 0.05, 2.2, 3.6);   // the hall's glass doors along the street
    const F = frame(b, 0, 0, 0);
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1), z = OZ + (t - 0.5) * LEN * 0.84, lift = Math.sin(Math.PI * t);
      for (const sx of [-1, 1]) {
        const p0 = [OX + sx * 2.5, 3, z], p1 = [OX + sx * (7 + 4 * lift), 11 + 9 * lift, z + (t - 0.5) * 8], p2 = [OX + sx * (10 + 11 * lift), 17 + 24 * lift, z + (t - 0.5) * 22];
        F.limb(oculusMat, 0xffffff, p0, p1, 0.8, 0.6, 6);
        F.limb(oculusMat, 0xffffff, p1, p2, 0.6, 0.18, 6);
      }
    }
    for (const e of [-1, 1]) F.limb(oculusMat, 0xffffff, [OX, 2, OZ + e * LEN * 0.44], [OX, 14, OZ + e * LEN * 0.62], 0.7, 0.2, 6);
    // the South Pool: water falling down all four walls into the void, its bronze parapet, white oaks in rows round it
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2, cx = MX + Math.cos(a) * MS / 2, cz = MZ + Math.sin(a) * MS / 2;
      b.add(G.box, VC.solid, cx, 0.5, cz, 1.4, 1.0, MS + 1.4, 0, -a, 0, '#2a2622');
      b.add(G.box, VC.solid, MX + Math.cos(a) * (MS / 2 + 0.2), -3, MZ + Math.sin(a) * (MS / 2 + 0.2), 0.4, 6.2, MS, 0, -a, 0, '#1a1a1e');
      b.add(G.plane, fallMat, MX + Math.cos(a) * (MS / 2 - 0.8), -3, MZ + Math.sin(a) * (MS / 2 - 0.8), MS - 1.6, 6, 1, 0, -a - Math.PI / 2, 0);
    }
    b.box(VC.solid, '#101216', MX, -6.1, MZ, MS, 0.2, MS);
    b.add(G.plane, harbor, MX, -5.9, MZ, MS - 1.6, MS - 1.6, 1, -Math.PI / 2);
    b.box(VC.solid, '#060708', MX, -6, MZ, 8, 0.4, 8);
    for (let x = -16; x > -66; x -= 9) for (let z = -6; z > -80; z -= 9) if (Math.abs(x - MX) > MS / 2 + 3 || Math.abs(z - MZ) > MS / 2 + 3) K.elm(b, x, z, rand(0.85, 1.0));
    // One World Trade Center, set back on the left: its base, the facets climbing away above the trees
    oneWTC(b, { x: -76, y: 0, z: -118, s: 0.42, glass: wtcGlass, solid: VC.solid, glow: VC.glow, sun: new THREE.Vector3(-1, 0, 0.35), lo: '#5a6a8a', hi: '#e8b0a0' });
    return b.build();
  };

  // ---------- the Battery: the harbour on the right, Liberty out on her island ----------
  const harbour = () => {
    const b = new Batcher(), W = EDGE + 7;
    b.add(G.plane, harbor, W + 150, -1.6, -140, 300, 330, 1, -Math.PI / 2);
    b.box(VC.solid, '#5a5a62', W + 0.4, -0.8, -40, 0.8, 1.8, 80);
    for (let z = 1; z < 80; z += 2.5) b.box(VC.metal, '#1f1f24', W + 0.1, 0.6, -z, 0.08, 1.2, 0.08);
    b.box(VC.metal, '#1f1f24', W + 0.1, 1.18, -40, 0.1, 0.1, 80);
    for (let z = 5; z < 80; z += 14) globeLamp(b, W - 0.8, -z);
    for (const z of [18, 34, 52]) viewer(b, W - 0.5, -z, 1);
    for (const z of [11, 27, 44, 61]) bench(b, W - 1.6, -z, Math.PI);
    livingStatue(b, EDGE + 3.4, -40);
    K.cart(b, EDGE + 2.6, -66, 'hotdog');
    K.crowd(b, EDGE + 1.2, W - 1.2, 2, 78, 26);
    // Liberty Island: the seawall, the lawn, a few trees, the statue facing the runner as they come along the Battery
    const IX = 86, IZ = -176;
    b.add(G.cyl, VC.solid, IX, -0.65, IZ, 104, 2.2, 84, 0, 0, 0, '#6a665e');
    b.add(G.cyl, VC.solid, IX, 0.25, IZ, 101, 0.4, 81, 0, 0, 0, '#2e4a2a');
    for (let k = 0; k < 14; k++) { const a = rand(0, Math.PI * 2), r = rand(36, 46); K.elm(b, IX + Math.cos(a) * r, IZ + Math.sin(a) * r * 0.8, rand(1.2, 1.5)); }
    for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; b.sph(VC.glow, hdr('#fff0d0', 2), IX + Math.cos(a) * 49, 1.0, IZ + Math.sin(a) * 39, 0.35, true); }
    liberty(b, { x: IX, y: 0.45, z: IZ, s: 0.82, ry: -2.42, copper, stone: granite, flame, glow: VC.glow, tablet: tabletMat, gc: hdr('#ffd890', 2.4) });
    ferry(b, 36, -42);
    tug(b, 64, -112);
    // the park on the left: trees, Castle Clinton, the Financial District's towers behind
    farGround(b, -1, '#2a4228');
    for (const [x, z, w, d] of [[-(EDGE + 14), -40, 1.8, 80], [-30, -60, 24, 1.6], [-30, -12, 24, 1.6]]) b.box(VC.solid, '#5a5650', x, -0.08, z, w, 0.06, d);   // the park's paths
    for (let z = 3; z < 80; z += rand(6, 9)) K.tree(b, -(EDGE + rand(8, 12)), -z, rand(0.95, 1.15));
    for (let z = 4; z < 80; z += rand(9, 13)) if (Math.abs(z - 34) > 15) K.elm(b, -rand(19, 30), -z, rand(1.0, 1.25));
    castleClinton(b, -36, -34);
    for (let z = 5; z < 80; z += 14) globeLamp(b, -(EDGE + 1.0), -z);
    K.crowd(b, -(EDGE + 1.2), -(EDGE + 6.2), 2, 78, 12);
    buildingRow(b, -1, types.filter((t) => t.h[0] > 30).map((t) => ({ ...t, h: [60, 130] })), { x0: 52, depth: [14, 20] });
    return b.build();
  };

  return {
    landmarks: {
      harbour: { key: 'liberty', name: '自由女神像', en: 'STATUE OF LIBERTY', build: harbour },
      washington: { key: 'washington', name: '华盛顿广场', en: 'WASHINGTON SQUARE', build: washington },
      dumbo: { key: 'dumbo', name: 'DUMBO · 曼哈顿大桥', en: 'DUMBO · MANHATTAN BRIDGE', build: dumbo },
      highLine: { key: 'highLine', name: '高线公园 · 哈德逊城市广场', en: 'HIGH LINE · HUDSON YARDS', build: highLine },
      rockefeller: { key: 'rockefeller', name: '洛克菲勒中心 · 圣帕特里克大教堂', en: "ROCKEFELLER CENTER · ST. PATRICK'S", build: rockefeller },
      wtc: { key: 'wtc', name: '世贸中心 · 飞鸟车站', en: 'WORLD TRADE CENTER · OCULUS', build: wtc },
    },
    update(t) {
      harbor.userData.scroll.offset.set(t * 0.01, t * 0.025);
      for (const q of trains) q.position.x = ((t * 24) % 700) - 350;
      fallT.offset.y = t * 0.35;
      flame.color.set('#ffc04a').multiplyScalar(3.6 + Math.sin(t * 13) * 0.4 + Math.sin(t * 7.3) * 0.3);
    },
  };
}
