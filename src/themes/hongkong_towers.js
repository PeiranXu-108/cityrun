// Hong Kong's skyline pieces: the Bank of China Tower (four triangular shafts stopping at different heights under their
// sloping glass tops, every face crossed by the great lit X-braces, two masts), Two IFC and its crown, Central Plaza's
// neon bands, The Center's rainbow bands, Cheung Kong Center's grid of light, Hopewell Centre, the ICC; the island's
// ridge behind them with the Mid-Levels' towers climbing its slopes and the Peak Tower on top; and the Symphony of
// Lights, lasers sweeping out from the rooftops over the harbour.
import { THREE, G, hdr, canvasTex, buildingGeo, rand, pick } from '../core.js';
import { at } from './common.js';
import { beam } from './tokyo_kit.js';

const _m = new THREE.Matrix4();

// ---------- the Bank of China Tower ----------
// Real proportions in metres: a 52 m square whose quarters end at the 44th, 51st, 63rd and 70th floors. The quarter
// facing the viewer (+z) is the lowest, so the steps climb away; each sloping cap rises toward the tower's centre.
const BOC_H = [186, 214, 305, 266];   // front, right, back, left
export function bocTower(b, { glass, line, x = 0, y = 0, z = 0, s = 1, ry = 0, glassCol = '#18263c', lineCol = hdr('#eaf4ff', 2), lw = 1.2, mast = '#c8ccd4' }) {
  const W = 26, drop = W * 0.7, c = Math.cos(ry), sn = Math.sin(ry);
  const P = (px, py, pz) => [x + (px * c + pz * sn) * s, y + py * s, z + (-px * sn + pz * c) * s];
  const C = [[-W, W], [W, W], [W, -W], [-W, -W]];   // front-left, front-right, back-right, back-left
  const pos = [];
  const tri = (a, b2, c2) => pos.push(...a, ...b2, ...c2);
  const quad = (a, b2, c2, d) => { tri(a, b2, c2); tri(a, c2, d); };
  const L = (p0, p1, t = lw) => beam(b, line, ...p0, ...p1, t * s, lineCol);
  for (let k = 0; k < 4; k++) {
    const [ax, az] = C[k], [bx, bz] = C[(k + 1) % 4], h = BOC_H[k], he = h - drop;
    const nx = (ax + bx) / 2 / W, nz = (az + bz) / 2 / W, o = 0.35;   // the face's outward normal, the lines' offset
    quad(P(ax, 0, az), P(bx, 0, bz), P(bx, he, bz), P(ax, he, az));
    quad(P(0, 0, 0), P(ax, 0, az), P(ax, he, az), P(0, h, 0));
    quad(P(0, 0, 0), P(bx, 0, bz), P(bx, he, bz), P(0, h, 0));
    tri(P(ax, he, az), P(bx, he, bz), P(0, h, 0));
    // the X-braces, one per square module, and the bands between them
    const A = (yy) => P(ax + nx * o, yy, az + nz * o), B = (yy) => P(bx + nx * o, yy, bz + nz * o), M = 2 * W;
    for (let y0 = 0; y0 + M <= he + 1; y0 += M) { L(A(y0), B(y0 + M)); L(B(y0), A(y0 + M)); L(A(y0), B(y0)); }
    const top = Math.floor((he + 1) / M) * M;
    if (he - top > 8) { L(A(top), B(he)); L(B(top), A(he)); }
    L(A(0), A(he)); L(A(he), B(he)); L(A(he), P(0, h + 0.3, 0)); L(B(he), P(0, h + 0.3, 0));
  }
  L(P(0, 0, 0), P(0, BOC_H[2], 0));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  b.addM(g, glass, _m.identity(), glassCol);
  // the two masts on the last shaft, their red lights
  const mt = BOC_H[2];
  for (const e of [-1, 1]) {
    const [mx, my, mz] = P(e * 5, mt - 6, -6);
    b.add(G.cyl8, line, mx, my + 34 * s, mz, 1.6 * s, 68 * s, 1.6 * s, 0, 0, 0, mast);
    b.sph(line, hdr('#ff2a2a', 6), mx, my + 69 * s, mz, 1.3 * s, true);
  }
  return { top: P(0, mt + 60, -6), roof: P(0, mt, 0) };
}

// ---------- the other towers ----------
// Two IFC: the shaft in setbacks, white light up its notched corners, the crown of fins round the roof
export function ifcTower(b, { mat, solid, x, y, z, s = 1, ry = 0, body = '#9aa8c8' }) {
  const tiers = [[60, 300], [55, 350], [49, 384], [43, 400]];
  let y0 = 0;
  for (const [w, top] of tiers) {
    b.addM(buildingGeo(w * s, (top - y0) * s, w * s, { cols: 8, rows: 16 }, 3.4, 4.2), mat, at(x, y + y0 * s, z, ry), body);
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const px = x + (cx * Math.cos(ry) + cz * Math.sin(ry)) * w * s * 0.5, pz = z + (-cx * Math.sin(ry) + cz * Math.cos(ry)) * w * s * 0.5;
      b.add(G.box, solid, px, y + (y0 + top) / 2 * s, pz, 1.4 * s, (top - y0) * s, 1.4 * s, 0, ry, 0, hdr('#f0f6ff', 1.6));
    }
    b.add(G.box, solid, x, y + top * s, z, (w + 1) * s, 1.6 * s, (w + 1) * s, 0, ry, 0, hdr('#dfe8ff', 1.4));
    y0 = top;
  }
  for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {   // the crown's four fins leaning out a little
    const px = x + (cx * Math.cos(ry) + cz * Math.sin(ry)) * 19 * s, pz = z + (-cx * Math.sin(ry) + cz * Math.cos(ry)) * 19 * s;
    b.add(G.box, solid, px, y + 412 * s, pz, 7 * s, 26 * s, 7 * s, cz * 0.08, ry, -cx * 0.08, hdr('#cfe0ff', 1.8));
  }
  b.add(G.box, solid, x, y + 404 * s, z, 30 * s, 8 * s, 30 * s, 0, ry, 0, hdr('#9fc0ff', 1.2));
  return { top: [x, y + 424 * s, z] };
}
// Central Plaza: a triangle with clipped corners, its neon bands round every few floors, the pyramid and mast on top.
// The top bands (in `neon`) change colour through the night.
const TRI = new THREE.CylinderGeometry(1, 1, 1, 3), TRI_RING = new THREE.CylinderGeometry(1, 1, 1, 3, 1, true), TRI_CONE = new THREE.ConeGeometry(1, 1, 3);
export function centralPlaza(b, { solid, neon, x, y, z, s = 1, ry = 0 }) {
  const R = 40, H = 310;
  b.add(TRI, solid, x, y + H / 2 * s, z, R * s, H * s, R * s, 0, ry, 0, '#3a3424');
  for (let yy = 14; yy < H - 4; yy += 14) b.add(TRI_RING, yy > H - 64 ? neon : solid, x, y + yy * s, z, (R + 0.6) * s, 2.2 * s, (R + 0.6) * s, 0, ry, 0, yy > H - 64 ? 0xffffff : hdr('#ffd890', 1.3));
  b.add(TRI_CONE, solid, x, y + (H + 14) * s, z, (R - 4) * s, 28 * s, (R - 4) * s, 0, ry, 0, hdr('#ffe0a0', 1.1));
  b.add(G.cyl8, solid, x, y + (H + 52) * s, z, 1.6 * s, 50 * s, 1.6 * s, 0, 0, 0, '#c8ccd4');
  b.sph(solid, hdr('#ff2a2a', 6), x, y + (H + 78) * s, z, 1.5 * s, true);
  return { top: [x, y + (H + 30) * s, z] };
}
// The Center: horizontal bands of light that run through the colours of the rainbow (vertex colour r = hue offset)
export function theCenter(b, { mat, solid, rainbow, x, y, z, s = 1, ry = 0 }) {
  const W = 46, H = 290;
  b.addM(buildingGeo(W * s, H * s, W * s, { cols: 8, rows: 16 }, 3.4, 4.2), mat, at(x, y, z, ry), '#7a86a8');
  for (let k = 0; k < 13; k++) {
    const yy = 40 + k * 19;
    b.add(G.box, rainbow, x, y + yy * s, z, (W + 1.2) * s, 2.4 * s, (W + 1.2) * s, 0, ry, 0, new THREE.Color(k * 0.07, 1, 0));
  }
  for (let k = 0; k < 3; k++) b.add(G.box, solid, x, y + (H + 6 + k * 10) * s, z, (W - 8 - k * 12) * s, 10 * s, (W - 8 - k * 12) * s, 0, ry + Math.PI / 4, 0, k % 2 ? '#2a3050' : hdr('#e8ecff', 1.3));
  b.add(G.cyl8, solid, x, y + (H + 56) * s, z, 1.2 * s, 40 * s, 1.2 * s, 0, 0, 0, '#c8ccd4');
  return { top: [x, y + (H + 30) * s, z] };
}
// Cheung Kong Center: a plain box whose facade is a uniform grid of lights
export const gridTex = () => canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = '#10141e'; g.fillRect(0, 0, w, h);
  for (let y = 2; y < h; y += 8) for (let x = 2; x < w; x += 8) { g.fillStyle = Math.random() < 0.92 ? '#f4f8ff' : '#7a8aa8'; g.fillRect(x, y, 4, 4); }
});
export function ckcTower(b, { solid, x, y, z, s = 1, ry = 0, grid }) {
  const W = 50, H = 283;
  b.addM(buildingGeo(W * s, H * s, W * s, { cols: 1, rows: 1 }, 24 * s, 24 * s), grid, at(x, y, z, ry), hdr('#ffffff', 1.1));
  b.add(G.box, solid, x, y + (H + 3) * s, z, (W + 2) * s, 6 * s, (W + 2) * s, 0, ry, 0, hdr('#e8f0ff', 1.6));
  return { top: [x, y + (H + 6) * s, z] };
}
// bands that run through the rainbow: vertex colour r is the band's hue offset, g its brightness
export function rainbowMat(k = 1.8) {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, k: { value: k } }, vertexColors: true,
    vertexShader: 'varying vec3 vC; void main(){ vC = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float time, k; varying vec3 vC;
      vec3 hue(float h){ return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
      void main(){
        gl_FragColor = vec4(hue(fract(vC.r + time * 0.05)) * k * vC.g, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}
// Hopewell Centre: a round tower, its revolving restaurant lit on top
export function hopewell(b, { mat, solid, x, y, z, s = 1 }) {
  b.add(G.cyl, mat, x, y + 108 * s, z, 46 * s, 216 * s, 46 * s, 0, 0, 0, '#9aa4c0');
  for (let yy = 12; yy < 212; yy += 6) b.add(G.cyl, solid, x, y + yy * s, z, 46.6 * s, 1.2 * s, 46.6 * s, 0, 0, 0, hdr(pick(['#ffe8c0', '#fff4e0', '#ffd8a0']), rand(0.5, 1.0)));
  b.add(G.cyl, solid, x, y + 220 * s, z, 52 * s, 8 * s, 52 * s, 0, 0, 0, hdr('#ffd27a', 1.8));
  b.add(G.cyl, solid, x, y + 226 * s, z, 30 * s, 6 * s, 30 * s, 0, 0, 0, '#2a3050');
  return { top: [x, y + 230 * s, z] };
}
// the ICC across the water: the tallest of them, slim, its corners and its crown lit
export function iccTower(b, { mat, solid, x, y, z, s = 1, ry = 0 }) {
  const W = 66, H = 470;
  b.addM(buildingGeo(W * s, H * s, W * s, { cols: 8, rows: 16 }, 3.4, 4.2), mat, at(x, y, z, ry), '#8a9ac0');
  for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const px = x + (cx * Math.cos(ry) + cz * Math.sin(ry)) * W * s * 0.5, pz = z + (-cx * Math.sin(ry) + cz * Math.cos(ry)) * W * s * 0.5;
    b.add(G.box, solid, px, y + H / 2 * s, pz, 1.6 * s, H * s, 1.6 * s, 0, ry, 0, hdr('#bfe0ff', 1.6));
  }
  b.add(G.box, solid, x, y + (H + 10) * s, z, (W - 6) * s, 20 * s, (W - 6) * s, 0.12, ry, 0, hdr('#8ab8ff', 1.5));
  return { top: [x, y + (H + 22) * s, z] };
}

// ---------- the island's ridge ----------
// Victoria Peak and its neighbours as a dark silhouette, the Mid-Levels' towers lit on the slopes below
const PEAKS = [[-70, 210, 16], [-48, 290, 13], [-30, 360, 10], [-15, 470, 9], [-4, 430, 7], [9, 405, 9], [22, 420, 8], [36, 385, 11], [52, 320, 12], [70, 250, 14], [95, 190, 20], [140, 150, 24], [-110, 170, 22], [180, 240, 30], [-150, 200, 25]];
export function ridgeHeight(deg) {
  let h = 90;
  for (const [p, ph, w] of PEAKS) { let d = deg - p; d -= 360 * Math.round(d / 360); h = Math.max(h, ph * Math.exp(-((d / w) ** 2))); }
  return h + 12 * Math.sin(deg * 0.31) + 7 * Math.sin(deg * 0.83 + 1.3);
}
export function ridge(b, mat, { r = 1320, base = -100, top = '#0c1224', foot = '#1c1a38' } = {}) {
  const pos = [], col = [], ct = new THREE.Color(top), cf = new THREE.Color(foot);
  const P = (deg, y) => { const a = (deg * Math.PI) / 180; return [Math.sin(a) * r, y, -Math.cos(a) * r]; };
  for (let deg = -180; deg < 180; deg += 1.5) {
    const h0 = ridgeHeight(deg) + base, h1 = ridgeHeight(deg + 1.5) + base;
    const a0 = P(deg, base), a1 = P(deg + 1.5, base), b0 = P(deg, h0), b1 = P(deg + 1.5, h1);
    pos.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1);
    for (const c of [cf, ct, ct, cf, ct, cf]) col.push(c.r, c.g, c.b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  b.addM(g, mat, _m.identity(), null);
}

// ---------- A Symphony of Lights ----------
// Laser beams from the rooftops, drawn as camera-facing ribbons in one draw call; each sweeps on its own phase and the
// whole show swells every minute. Positions are in the skyline's frame (which follows the camera).
export function lasers(sources, { len = 620, width = 1.6 } = {}) {
  const P = [], Q = [], A = [], C = [];
  for (const { p, n, colors, yaw = 0, spread = 1.2 } of sources) for (let i = 0; i < n; i++) {
    const c = new THREE.Color(pick(colors)), base = yaw + (i / Math.max(1, n - 1) - 0.5) * spread, ph = rand(0, 6.28), sp = rand(0.25, 0.55), amp = rand(0.25, 0.6);
    for (const [u, v] of [[0, -1], [0, 1], [1, 1], [0, -1], [1, 1], [1, -1]]) { P.push(...p); Q.push(u, v); A.push(base, ph, sp, amp); C.push(c.r, c.g, c.b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aQuad', new THREE.Float32BufferAttribute(Q, 2));
  g.setAttribute('aBeam', new THREE.Float32BufferAttribute(A, 4));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, show: { value: 1 }, len: { value: len }, width: { value: width } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `attribute vec2 aQuad; attribute vec4 aBeam; attribute vec3 aCol; uniform float time, show, len, width; varying vec3 vC; varying vec2 vQ;
      void main(){
        float yaw = aBeam.x + aBeam.w * sin(time * aBeam.z + aBeam.y);
        float pitch = 0.16 + 0.22 * (0.5 + 0.5 * sin(time * aBeam.z * 0.63 + aBeam.y * 2.1));
        vec3 dir = mat3(modelMatrix) * vec3(sin(yaw) * cos(pitch), sin(pitch), -cos(yaw) * cos(pitch));
        vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz + dir * aQuad.x * len;
        vec3 side = normalize(cross(dir, normalize(wp - cameraPosition)));
        wp += side * aQuad.y * width * (0.6 + aQuad.x * 2.4);
        vC = aCol; vQ = aQuad;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: `uniform float show; varying vec3 vC; varying vec2 vQ;
      void main(){
        float a = (1.0 - abs(vQ.y)) * pow(1.0 - vQ.x, 1.3) * show;
        gl_FragColor = vec4(vC * a * 2.4, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -4;
  // the show: the beams idle for half a minute, then fan out together, sweeping faster, for twenty seconds
  let last = 0, clock = 0;
  mesh.userData.update = (t, k = 1) => {
    const p = t % 50, on = p < 20 ? Math.min(1, p / 1.5, (20 - p) / 1.5) : 0;
    clock += Math.min(0.1, Math.max(0, t - last)) * (0.6 + on * 0.9); last = t;
    mat.uniforms.time.value = clock;
    mat.uniforms.show.value = (0.22 + on * 0.78) * k;
    mesh.visible = k > 0.01;
  };
  return mesh;
}
