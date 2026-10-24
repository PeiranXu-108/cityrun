// Taipei's skyline pieces: Taipei 101 (the tapering base with its golden ruyi medallions, eight flaring segments stacked
// like bamboo, the stepped top and the pinnacle, the segments' rims lit in the colour of the day), Xinyi's other towers
// (Nan Shan Plaza's tapering crown, Cathay Landmark, the Sky Tower, the twisting Tao Zhu Yin Yuan), the Shin Kong tower
// by the station, the Taipei Dome, the Grand Hotel's red palace on its hill, Miramar's Ferris wheel, the gondola's
// cabins climbing to Maokong; the mountains round the basin, low cloud dragging over them, and steam for the hot springs.
import { THREE, G, hdr, canvasTex, buildingGeo, curveUniforms, CURVE_GLSL, rand, pick } from '../core.js';
import { at } from './common.js';
import { beam } from './tokyo_kit.js';
import { roofGeo } from './beijing_kit.js';

const _m = new THREE.Matrix4();

// a chamfered square (half-width a, corners cut by the fraction c), counter-clockwise seen from above
function chamfer(a, c) { const k = a * (1 - c); return [[a, -k], [a, k], [k, a], [-k, a], [-a, k], [-a, -k], [-k, -a], [k, -a]]; }
// the prism between two chamfered squares, UVs in world units over `tile` metres (for the curtain wall's floors)
export function frustum(a0, a1, y0, y1, { c = 0.18, cap = true, tile = 32 } = {}) {
  const P0 = chamfer(a0, c), P1 = chamfer(a1, c), pos = [], uv = [];
  let u = 0;
  for (let i = 0; i < 8; i++) {
    const [ax, az] = P0[i], [bx, bz] = P0[(i + 1) % 8], [cx, cz] = P1[(i + 1) % 8], [dx, dz] = P1[i], w = Math.hypot(bx - ax, bz - az) / tile, h = (y1 - y0) / tile;
    pos.push(ax, y0, az, bx, y0, bz, cx, y1, cz, ax, y0, az, cx, y1, cz, dx, y1, dz);
    uv.push(u, 0, u + w, 0, u + w, h, u, 0, u + w, h, u, h);
    u += w;
  }
  if (cap) for (let i = 0; i < 8; i++) { const [ax, az] = P1[i], [bx, bz] = P1[(i + 1) % 8]; pos.push(0, y1, 0, bx, y1, bz, ax, y1, az); uv.push(0, 0, 0, 0, 0, 0); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
// the curtain wall of Taipei 101: green-blue glass, a floor every 4.2 m, the offices lit here and there
export function glassTex() {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    const fl = h / 7.6;
    for (let r = 0; r < 7.6; r++) for (let x = 0; x < w; x += 8) {
      const y = r * fl;
      g.fillStyle = Math.random() < 0.18 ? '#f0fff8' : Math.random() < 0.5 ? '#9ab8b4' : '#7a9a98';
      g.fillRect(x + 1, y + 2, 6, fl - 5);
    }
    g.fillStyle = '#5a7a78'; for (let r = 0; r < 8; r++) g.fillRect(0, r * fl, w, 2);
  });
}

// ---------- Taipei 101 ----------
// In metres: the base tapers in over the first 25 floors, eight segments of eight floors each flare out like bamboo
// joints (or stacked sycee), the ruyi medallions sit at the top of the base, then the stepped crown and the pinnacle.
// glass: the faces; line: the lit rims and corner lines (its colour is the day's); gold: the medallions.
export const T101 = { base: 108, seg: 33.6, n: 8, crown: 377, top: 425, tip: 508 };
export function taipei101(b, { glass, line, gold, x = 0, y = 0, z = 0, s = 1, ry = 0, lw = 1.2, glassCol = '#2a5a58', lineCol = hdr('#ffffff', 1), tile = 32 }) {
  const M = new THREE.Matrix4().makeRotationY(ry).scale(new THREE.Vector3(s, s, s)).setPosition(x, y, z);
  const c = Math.cos(ry), sn = Math.sin(ry);
  const P = (px, py, pz) => [x + (px * c + pz * sn) * s, y + py * s, z + (-px * sn + pz * c) * s];
  const L = (p0, p1, t = lw) => beam(b, line, ...p0, ...p1, t * s, lineCol);
  const rim = (a, yy, t = lw) => { const q = chamfer(a + 0.4, 0.18); for (let i = 0; i < 8; i++) L(P(q[i][0], yy, q[i][1]), P(q[(i + 1) % 8][0], yy, q[(i + 1) % 8][1]), t); };
  const corners = (a0, a1, y0, y1, t = lw * 0.6) => { const q0 = chamfer(a0 + 0.4, 0.18), q1 = chamfer(a1 + 0.4, 0.18); for (const i of [1, 3, 5, 7]) L(P(q0[i][0], y0, q0[i][1]), P(q1[i][0], y1, q1[i][1]), t); };
  b.addM(frustum(31, 24.5, 0, T101.base, { tile }), glass, M, glassCol);
  rim(24.5, T101.base, lw * 1.2); corners(31, 24.5, 0, T101.base);
  for (const [fx, fz, r] of [[0, 1, 0], [1, 0, Math.PI / 2], [0, -1, Math.PI], [-1, 0, -Math.PI / 2]]) {   // the four ruyi medallions
    const d = 25.6, [px, py, pz] = P(fx * d, 92, fz * d);
    b.add(G.cyl, gold, px, py, pz, 16 * s, 1.2 * s, 16 * s, Math.PI / 2, ry + r, 0, hdr('#ffd060', 1.1));
    b.add(G.cyl, glass, ...P(fx * (d + 0.4), 92, fz * (d + 0.4)), 7 * s, 1.0 * s, 7 * s, Math.PI / 2, ry + r, 0, glassCol);
  }
  for (let i = 0; i < T101.n; i++) {
    const y0 = T101.base + i * T101.seg, y1 = y0 + T101.seg;
    b.addM(frustum(20, 24.2, y0, y1, { tile }), glass, M, glassCol);
    rim(24.2, y1 - 0.4); rim(22.6, y1 - 5, lw * 0.5); corners(20, 24.2, y0, y1);
  }
  for (const [a, y0, y1] of [[15, 377, 392], [13, 392, 404], [11, 404, 414], [8.5, 414, 425]]) { b.addM(frustum(a, a, y0, y1, { tile, c: 0.24 }), glass, M, glassCol); rim(a, y1, lw * 0.8); }
  const sp = P(0, T101.top, 0), tip = P(0, T101.tip, 0);
  b.add(G.cyl8, glass, sp[0], sp[1] + 2 * s, sp[2], 7 * s, 4 * s, 7 * s, 0, 0, 0, glassCol);
  beam(b, line, ...sp, ...tip, 3.2 * s, hdr('#e8eef0', 0.35));
  for (let k = 0; k < 4; k++) b.add(G.sph, line, ...P(0, T101.top + 12 + k * 18, 0), 2.6 * s, 2.6 * s, 2.6 * s, 0, 0, 0, hdr('#ff2a2a', 3));   // the aviation lights
  return { top: tip };
}

// ---------- the other towers ----------
// Nan Shan Plaza: a slim slab whose top tapers into a split crown, lit along its edges
export function nanShan(b, { mat, tex, line, x, y, z, s = 1, ry = 0 }) {
  b.addM(buildingGeo(46, 214, 34, tex, 3.4, 4.2), mat, at(x, y, z, ry).scale(new THREE.Vector3(s, s, s)), '#e8f0ff');
  const c = Math.cos(ry), sn = Math.sin(ry), P = (px, py, pz) => [x + (px * c + pz * sn) * s, y + py * s, z + (-px * sn + pz * c) * s];
  for (const e of [-1, 1]) {
    beam(b, line, ...P(e * 23, 214, 17.5), ...P(e * 6, 272, 17.5), 1.4 * s, hdr('#f4f8ff', 1.6));
    beam(b, line, ...P(e * 23.5, 0, 17.5), ...P(e * 23.5, 214, 17.5), 0.9 * s, hdr('#f4f8ff', 1.2));
  }
  b.add(G.cone4, mat, ...P(0, 243, 0), 46 * s, 58 * s, 34 * s, 0, ry, 0, '#c8d4e8');
  return { top: P(0, 272, 0) };
}
export function slimTower(b, { mat, tex, line, x, y, z, s = 1, ry = 0, w = 36, h = 200, d = 36, crown = 'frame', col = '#ffffff', lit = '#f4f8ff' }) {
  const c = Math.cos(ry), sn = Math.sin(ry), P = (px, py, pz) => [x + (px * c + pz * sn) * s, y + py * s, z + (-px * sn + pz * c) * s];
  b.addM(buildingGeo(w, h, d, tex, 3.4, 4.2), mat, at(x, y, z, ry).scale(new THREE.Vector3(s, s, s)), col);
  if (crown === 'frame') {   // Cathay Landmark: a lit frame standing on the roof
    for (const [px, pz] of [[-w / 2, d / 2], [w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]]) beam(b, line, ...P(px, h, pz), ...P(px * 0.7, h + 22, pz * 0.7), 1.2 * s, hdr(lit, 1.6));
    for (const yy of [h + 8, h + 22]) for (const [a, bb] of [[[-1, 1], [1, 1]], [[1, -1], [-1, -1]]]) beam(b, line, ...P(a[0] * w * 0.4, yy, a[1] * d * 0.4), ...P(bb[0] * w * 0.4, yy, bb[1] * d * 0.4), 1 * s, hdr(lit, 1.6));
  } else if (crown === 'round') {   // the Sky Tower: a rounded top washed in light
    b.add(G.sph, mat, ...P(0, h, 0), w * s, 30 * s, d * s, 0, ry, 0, col);
    beam(b, line, ...P(0, h + 14, 0), ...P(0, h + 44, 0), 1.6 * s, hdr(lit, 1.4));
  } else if (crown === 'notch') {   // the Shin Kong tower: a dark slab, its corners notched, a band of light at the top
    for (const e of [-1, 1]) b.addM(buildingGeo(6, h + 10, d - 8, tex, 3.4, 4.2).translate(e * (w / 2 + 3), 0, 0), mat, at(x, y, z, ry).scale(new THREE.Vector3(s, s, s)), col);
    beam(b, line, ...P(-w / 2, h - 3, d / 2 + 0.5), ...P(w / 2, h - 3, d / 2 + 0.5), 2.4 * s, hdr(lit, 1.4));
  }
  for (const e of [-1, 1]) beam(b, line, ...P(e * (w / 2 + 0.4), 0, d / 2 + 0.4), ...P(e * (w / 2 + 0.4), h, d / 2 + 0.4), 0.7 * s, hdr(lit, 0.9));
  return { top: P(0, h + 30, 0) };
}
// Tao Zhu Yin Yuan: twenty-one floors, each turned a little further, gardens spilling from every terrace
export function taoZhu(b, { mat, solid, x, y, z, s = 1, ry = 0 }) {
  for (let k = 0; k < 21; k++) {
    const yy = y + k * 4.4 * s, a = ry + (k * 4.5 * Math.PI) / 180;
    b.add(G.box, solid, x, yy + 2.2 * s, z, 34 * s, 4.0 * s, 26 * s, 0, a, 0, hdr(k % 3 ? '#c8a878' : '#ffe0b0', k % 3 ? 0.55 : 1.1));
    b.add(G.box, solid, x, yy + 0.2 * s, z, 40 * s, 0.6 * s, 30 * s, 0, a, 0, '#1e3a24');
    b.add(G.box, solid, x, yy + 0.9 * s, z, 39 * s, 1.0 * s, 29 * s, 0, a, 0, '#2a5a32');
  }
}
// the Grand Hotel on its hill: fourteen red storeys under a vast golden roof, all floodlit
export function grandHotel(b, { mat, solid, roof, x, y, z, s = 1, ry = 0 }) {
  b.add(G.box, solid, x, y + 32 * s, z, 150 * s, 64 * s, 34 * s, 0, ry, 0, hdr('#b8282a', 1.1));
  b.add(G.box, mat, x, y + 30 * s, z + 17.5 * s, 140 * s, 52 * s, 1 * s, 0, ry, 0, '#ffe0b0');
  const { roof: rg } = roofGeo(150, 34, 16, { hip: true, lift: 0.7, eave: 5, tile: 4 });
  b.addM(rg, roof, new THREE.Matrix4().makeRotationY(ry).scale(new THREE.Vector3(s, s, s)).setPosition(x, y + 64 * s, z), hdr('#f2b030', 1.2));
  const { roof: rg2 } = roofGeo(70, 20, 12, { hip: true, lift: 0.8, eave: 4, tile: 4 });
  b.add(G.box, solid, x, y + 84 * s, z, 70 * s, 10 * s, 20 * s, 0, ry, 0, hdr('#b8282a', 1.1));
  b.addM(rg2, roof, new THREE.Matrix4().makeRotationY(ry).scale(new THREE.Vector3(s, s, s)).setPosition(x, y + 89 * s, z), hdr('#f2b030', 1.2));
}
// the National Chiang Kai-shek Memorial Hall at the end of Liberty Square: white terraces and stairs, the white hall,
// the blue octagonal double roof and its gilded finial
export function memorialHall(b, { mat, x, y, z, s = 1 }) {
  const W = (v) => v * s, white = hdr('#f2f4f6', 1.05), blue = hdr('#2a5ac8', 1.0);
  for (const [w, y0, h] of [[110, 0, 6], [92, 6, 6], [76, 12, 6]]) b.add(G.box, mat, x, y + W(y0 + h / 2), z, W(w), W(h), W(w * 0.8), 0, 0, 0, white);
  b.add(G.box, mat, x, y + W(10), z + W(40), W(26), W(20), W(30), -0.55, 0, 0, hdr('#c8ccd4', 1));   // the great stair
  b.add(G.box, mat, x, y + W(34), z, W(46), W(32), W(46), 0, 0, 0, white);
  b.add(G.box, mat, x, y + W(30), z + W(23.2), W(12), W(20), W(0.6), 0, 0, 0, hdr('#ffd8a0', 1.6));   // the doorway, lit inside
  b.add(G.cone8, mat, x, y + W(55), z, W(70), W(10), W(70), 0, Math.PI / 8, 0, blue);
  b.add(G.cyl8, mat, x, y + W(62), z, W(34), W(8), W(34), 0, 0, 0, white);
  b.add(G.cone8, mat, x, y + W(71), z, W(48), W(14), W(48), 0, Math.PI / 8, 0, blue);
  b.add(G.sph, mat, x, y + W(79), z, W(4), W(4), W(4), 0, 0, 0, hdr('#ffd060', 1.8));
}

// ---------- the mountains round the basin ----------
const PEAKS = [[-8, 200, 9], [7, 230, 8], [18, 260, 10], [-22, 170, 9], [-48, 380, 16], [-70, 470, 14], [-92, 420, 18], [38, 300, 12], [60, 340, 14], [84, 260, 16], [120, 220, 22], [160, 360, 20], [-140, 300, 22], [180, 250, 26]];
export function ridgeHeight(deg, peaks = PEAKS) {
  let h = 70;
  for (const [p, ph, w] of peaks) { let d = deg - p; d -= 360 * Math.round(d / 360); h = Math.max(h, ph * Math.exp(-((d / w) ** 2))); }
  return h + 10 * Math.sin(deg * 0.37) + 6 * Math.sin(deg * 0.91 + 1.3);
}
export function ridge(b, mat, { r = 1380, base = -100, top = '#0a1218', foot = '#16202a', peaks = PEAKS } = {}) {
  const pos = [], col = [], ct = new THREE.Color(top), cf = new THREE.Color(foot);
  const P = (deg, yy) => { const a = (deg * Math.PI) / 180; return [Math.sin(a) * r, yy, -Math.cos(a) * r]; };
  for (let deg = -180; deg < 180; deg += 1.5) {
    const h0 = ridgeHeight(deg, peaks) + base, h1 = ridgeHeight(deg + 1.5, peaks) + base;
    const a0 = P(deg, base), a1 = P(deg + 1.5, base), b0 = P(deg, h0), b1 = P(deg + 1.5, h1);
    pos.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1);
    for (const cc of [cf, ct, ct, cf, ct, cf]) col.push(cc.r, cc.g, cc.b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  b.addM(g, mat, _m.identity(), null);
}

// ---------- Miramar's Ferris wheel ----------
// 70 m across on the roof of its mall; the rim's LEDs run through colours, the wheel turns slowly. Returns a Group.
export function ferrisWheel({ R = 35, n = 48 } = {}) {
  const grp = new THREE.Group(), wheel = new THREE.Group();
  const rimMat = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false }), spoke = new THREE.MeshBasicMaterial({ color: hdr('#9ab0c8', 0.6), fog: false });
  const cab = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }), base = new THREE.MeshBasicMaterial({ color: '#141820', fog: false });
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(R, 0.9, 6, 96), rimMat));
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(R * 0.55, 0.5, 6, 64), rimMat));
  const sp = [], cp = [], cc = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const g = new THREE.BoxGeometry(0.4, R, 0.4).translate(0, R / 2, 0).rotateZ(a); sp.push(g);
    const c = new THREE.BoxGeometry(2.6, 3.2, 2.6).translate(Math.cos(a) * (R + 2.2), Math.sin(a) * (R + 2.2), 0); const col = new THREE.Color(pick(['#ffe0a0', '#a0e0ff', '#ffb0d8', '#c0ffb0'])).multiplyScalar(1.6);
    const arr = new Float32Array(c.attributes.position.count * 3); for (let i = 0; i < arr.length; i += 3) arr.set([col.r, col.g, col.b], i);
    c.setAttribute('color', new THREE.BufferAttribute(arr, 3)); cp.push(c);
  }
  wheel.add(new THREE.Mesh(mergeAll(sp), spoke), new THREE.Mesh(mergeAll(cp), cab));
  wheel.position.y = R + 8;
  grp.add(wheel);
  for (const e of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(1.6, R + 12, 1.6), spoke); leg.position.set(e * 9, (R + 8) / 2, 0); leg.rotation.z = e * 0.22; grp.add(leg); }
  const mall = new THREE.Mesh(new THREE.BoxGeometry(110, 34, 50).translate(0, -17, 0), base); grp.add(mall);
  const band = new THREE.Mesh(new THREE.BoxGeometry(110.4, 3, 50.4).translate(0, -4, 0), new THREE.MeshBasicMaterial({ color: hdr('#ff6ac8', 1.4), fog: false })); grp.add(band);
  grp.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.renderOrder = -5; } });
  grp.userData.update = (t) => { wheel.rotation.z = t * 0.035; rimMat.color.setHSL((t * 0.03) % 1, 0.85, 0.62).multiplyScalar(1.7); };
  return grp;
}
function mergeAll(list) {
  const pos = [], col = [];
  for (const g of list) {
    const ng = g.index ? g.toNonIndexed() : g, p = ng.attributes.position.array, c = ng.attributes.color;
    pos.push(...p);
    if (c) col.push(...c.array);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

// ---------- puffs of steam or cloud ----------
// Soft camera-facing billboards rising from their sources, growing and fading, each on its own phase. curved: bend
// with the world (for things in the street); otherwise drawn on the skyline.
export function puffs(sources, { size = 2, grow = 2.5, rise = 6, drift = 1, life = 6, n = 6, color = '#ffffff', opacity = 0.35, curved = true } = {}) {
  const P = [], Q = [], A = [];
  for (const p of sources) for (let i = 0; i < n; i++) {
    const ph = Math.random(), dx = rand(-1, 1) * drift, dz = rand(-1, 1) * drift * 0.5, sz = size * rand(0.7, 1.3);
    for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) { P.push(...p); Q.push(u, v); A.push(ph, dx, dz, sz); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aQuad', new THREE.Float32BufferAttribute(Q, 2));
  g.setAttribute('aPuff', new THREE.Float32BufferAttribute(A, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, show: { value: 1 }, life: { value: life }, rise: { value: rise }, grow: { value: grow }, uColor: { value: new THREE.Color(color) }, opacity: { value: opacity }, uCurveY: curveUniforms.uCurveY, uCurveX: curveUniforms.uCurveX },
    transparent: true, depthWrite: false,
    vertexShader: `attribute vec2 aQuad; attribute vec4 aPuff; uniform float time, life, rise, grow, uCurveY, uCurveX; varying vec2 vQ; varying float vA;
      void main(){
        float t = fract(time / life + aPuff.x);
        vec3 p = position + vec3(aPuff.y * t, rise * t, aPuff.z * t);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        ${curved ? CURVE_GLSL : ''}
        mvPosition.xy += aQuad * aPuff.w * (0.6 + grow * t);
        vQ = aQuad; vA = sin(3.14159 * t) * (1.0 - t * 0.3);
        gl_Position = projectionMatrix * mvPosition;
      }`,
    fragmentShader: `uniform vec3 uColor; uniform float opacity, show; varying vec2 vQ; varying float vA;
      void main(){
        float r = length(vQ); float a = smoothstep(1.0, 0.1, r) * vA * opacity * show;
        if (a < 0.003) discard;
        gl_FragColor = vec4(uColor, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  mesh.userData.update = (t, k = 1) => { mat.uniforms.time.value = t; mat.uniforms.show.value = k; mesh.visible = k > 0.01; };
  return mesh;
}
// a soft cloud texture: blobs of mist, for the low cloud dragging over the mountains and round the tower's top
export function cloudTex() {
  return canvasTex(256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let k = 0; k < 26; k++) {
      const x = rand(30, w - 30), y = rand(h * 0.35, h * 0.7), r = rand(18, 46), gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.32)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }, { repeat: false });
}
