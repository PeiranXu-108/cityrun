// Building blocks shared by the city themes: track bed, facades, lamps, trees, water, far skyline.
import {
  THREE, Batcher, VC, G, std, hdr, buildingGeo, trackTex, canvasTex, curveUniforms, CURVE_GLSL,
  CHUNK_LEN, LANE_W, rand, randi, pick,
} from '../core.js';

export const EDGE = 3.75;               // outer edge of the track bed
export const DISC = new THREE.CircleGeometry(0.5, 24);
DISC.rotateX(-Math.PI / 2);
const _t = new THREE.Matrix4();
export const at = (x, y, z, ry = 0) => (ry ? _t.makeRotationY(ry).setPosition(x, y, z) : _t.makeTranslation(x, y, z));

// Uncurved materials for the far skyline (it follows the camera, so it never bends).
export const SKY_VC = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });

export function makeTrack({ gravel, spots, sleeper, rail = '#c3c8d2', railMatte = false, edge = null, edgeK = 2.6, side = '#2a2a30', sideW = 7, sideMat = null, ground = [null, null] }) {
  const b = new Batcher();
  const tex = trackTex({ gravel, spots, sleeper });
  tex.repeat.set(1, CHUNK_LEN / 3.2);
  const bedMat = std({ map: tex, roughness: 0.85, metalness: 0.1 });
  for (let l = 0; l < 3; l++) b.add(G.plane, bedMat, (l - 1) * LANE_W, 0.01, -CHUNK_LEN / 2, LANE_W, CHUNK_LEN, 1, -Math.PI / 2);
  for (let l = 0; l < 3; l++) for (const o of [-0.72, 0.72]) {
    b.box(railMatte ? VC.solid : VC.metal, rail, (l - 1) * LANE_W + o, 0.09, -CHUNK_LEN / 2, 0.1, 0.14, CHUNK_LEN);
  }
  for (const s of [-1, 1]) {
    b.box(VC.solid, '#3a3c44', s * (EDGE + 0.08), 0.12, -CHUNK_LEN / 2, 0.16, 0.24, CHUNK_LEN);
    if (edge) for (let z = 1; z < CHUNK_LEN; z += 5) b.box(VC.glow, hdr(edge, edgeK * 0.7), s * (EDGE + 0.08), 0.25, -z - 0.6, 0.06, 0.03, 1.2);
    if (sideMat) b.add(G.plane, sideMat, s * (EDGE + sideW / 2), 0.02, -CHUNK_LEN / 2, sideW, CHUNK_LEN, 1, -Math.PI / 2);
    else b.box(VC.solid, side, s * (EDGE + sideW / 2), -0.05, -CHUNK_LEN / 2, sideW, 0.12, CHUNK_LEN);
    const gc = ground[s < 0 ? 0 : 1];
    if (gc) b.box(VC.solid, gc, s * (EDGE + sideW + 40), -0.2, -CHUNK_LEN / 2, 80, 0.2, CHUNK_LEN);
  }
  return b.build();
}

export function facadeMat(tex, { k = 1.8, rough = 0.85, metal = 0 } = {}) {
  return std({ map: tex.map, emissiveMap: tex.emissive, emissive: '#ffffff', emissiveIntensity: k, vertexColors: true, roughness: rough, metalness: metal });
}

// Fill one side of a chunk with buildings. types: [{mat, tex, colors, w:[a,b], h:[a,b], weight, cellW, cellH, roof, front}]
export function buildingRow(b, side, types, { x0 = 11, depth = [8, 14], gap = [0.2, 1.4], z0 = 0, z1 = CHUNK_LEN, setback = [0, 1.5] } = {}) {
  const total = types.reduce((s, t) => s + (t.weight || 1), 0);
  let z = z0;
  while (z < z1 - 2.5) {
    let r = Math.random() * total, ty = types[0];
    for (const t of types) { r -= t.weight || 1; if (r <= 0) { ty = t; break; } }
    const len = Math.min(rand(...ty.w), z1 - z);
    const d = rand(...depth), h = rand(...ty.h);
    const xIn = x0 + rand(...setback);
    const cx = side * (xIn + d / 2), cz = -(z + len / 2);
    const g = buildingGeo(d, h, len, ty.tex, ty.cellW || 1.35, ty.cellH || 2.2);
    b.addM(g, ty.mat, at(cx, 0, cz), pick(ty.colors));
    const info = { x: cx, z: cz, d, len, h, side, face: side * xIn, z0: z, z1: z + len };
    if (ty.roof) ty.roof(b, info);
    if (ty.front) ty.front(b, info);
    z += len + rand(...gap);
  }
}

export function lamp(b, x, z, side, { pole = '#2b2f38', light = '#ffd28a', k = 3.2, h = 5.6, arm = 1.3, pool = 0 } = {}) {
  b.cyl(VC.metal, pole, x, h / 2, z, 0.08, h);
  b.box(VC.metal, pole, x - side * arm / 2, h, z, arm, 0.1, 0.1);
  b.box(VC.glow, hdr(light, k), x - side * arm, h - 0.1, z, 0.55, 0.1, 0.28);
  if (pool) {
    b.addM(DISC, VC.glowAdd, new THREE.Matrix4().makeScale(3.6, 1, 3.6).setPosition(x - side * arm, 0.06, z), hdr(light, pool * 0.6));
  }
}

export function tree(b, x, z, { trunk = '#4a3626', leaf = '#2f6b3a', s = 1, kind = 'round', y = 0 } = {}) {
  b.cyl(VC.solid, trunk, x, y + 1.2 * s, z, 0.14 * s, 2.4 * s, 'cyl8');
  if (kind === 'round') {
    b.sph(VC.solid, leaf, x, y + 3.0 * s, z, 1.3 * s, true);
    b.sph(VC.solid, leaf, x + 0.6 * s, y + 2.6 * s, z + 0.3 * s, 0.9 * s, true);
    b.sph(VC.solid, leaf, x - 0.5 * s, y + 2.7 * s, z - 0.4 * s, 0.85 * s, true);
  } else if (kind === 'pine') {
    b.add(G.cone8, VC.solid, x, y + 3.0 * s, z, 2.2 * s, 2.6 * s, 2.2 * s, 0, 0, 0, leaf);
    b.add(G.cone8, VC.solid, x, y + 4.2 * s, z, 1.6 * s, 2.0 * s, 1.6 * s, 0, 0, 0, leaf);
  }
}

// Procedural ripple normal map for rivers and lakes.
export function waterNormal(size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const img = g.createImageData(size, size);
  const waves = Array.from({ length: 7 }, () => ({ a: rand(0, Math.PI * 2), f: randi(1, 5), p: rand(0, 6.28), amp: rand(0.4, 1) }));
  const hgt = (x, y) => waves.reduce((s, w) => s + Math.sin((Math.cos(w.a) * x + Math.sin(w.a) * y) * w.f * Math.PI * 2 / size * 2 + w.p) * w.amp, 0);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = hgt(x + 1, y) - hgt(x - 1, y), dy = hgt(x, y + 1) - hgt(x, y - 1);
    const n = new THREE.Vector3(-dx * 0.6, -dy * 0.6, 1).normalize();
    const i = (y * size + x) * 4;
    img.data[i] = (n.x * 0.5 + 0.5) * 255; img.data[i + 1] = (n.y * 0.5 + 0.5) * 255; img.data[i + 2] = (n.z * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function waterMat(color, rep = 6) {
  const n = waterNormal();
  n.repeat.set(rep, rep * 4);
  const m = std({ color, metalness: 0.9, roughness: 0.12, normalMap: n, normalScale: new THREE.Vector2(0.6, 0.6) });
  m.userData.scroll = n;
  return m;
}

// Lit-window dots for the skyline silhouettes (one composite texture).
export function skyTex({ wall = '#0a0c18', lit = ['#ffd27a'], chance = 0.3, cols = 8, rows = 16 } = {}) {
  const cw = 16, ch = 20;
  const map = canvasTex(cols * cw, rows * ch, (g, w, h) => {
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (Math.random() > chance) continue;
      g.fillStyle = pick(lit); g.globalAlpha = rand(0.5, 1);
      g.fillRect(c * cw + 4, r * ch + 5, cw - 8, ch - 10);
    }
  });
  return { map, cols, rows };
}

// Ring of far silhouettes around the camera. Landmark functions draw into the same batcher.
// heightCap(angle, dist) limits building heights (e.g. to keep a mountain behind them visible);
// follow = distance where the track fades out: main.js then turns the ring so that "straight ahead" stays on the
// far end of the curving track.
export function skyline({ count = 120, r = [560, 860], h = [40, 200], w = [18, 50], base = -95, colors = ['#ffffff'], tex, k = 1.6, landmarks = [], gapAhead = 0, heightCap = null, follow = 0 }) {
  const b = new Batcher();
  const mat = new THREE.MeshBasicMaterial({ map: tex.map, vertexColors: true, fog: false });
  mat.color.setScalar(k);
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2), aw = Math.atan2(Math.sin(a), Math.cos(a));
    if (gapAhead && Math.abs(aw) < gapAhead) continue;
    const rr = rand(...r), ww = rand(...w);
    let hh = rand(...h) * (Math.random() < 0.15 ? 1.6 : 1);
    if (heightCap) { hh = Math.min(hh, heightCap(aw, rr)); if (hh < 20) continue; }
    const g = buildingGeo(ww, hh - base, ww * rand(0.6, 1.2), tex, 3.4, 4.2);
    b.addM(g, mat, at(Math.sin(a) * rr, base, -Math.cos(a) * rr, -a), pick(colors));
  }
  landmarks.forEach((fn) => fn(b, mat));
  const grp = b.build();
  grp.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.renderOrder = -5; } });
  grp.userData.follow = follow;
  return grp;
}

// place helper for skyline landmarks: angle in degrees from straight ahead (negative = left)
export function polar(deg, r) {
  const a = deg * Math.PI / 180;
  return [Math.sin(a) * r, -Math.cos(a) * r, -a];
}
// a skyline frame's position: polar() gives x and z, the model stands with its foot at y0
export function polarXZ(deg, r, y0) { const [x, z] = polar(deg, r); return [x, y0, z]; }
// The skyline's icons stand with their feet only a little below the eye, and where the street opens out (a pond, a
// river, a park, the water) the ground falls away and the sky showed under them; so their walls carry on down until
// they are 10° below the eye at their distance r, as deep as the plain skyline blocks reach (to -95 from 560 m out).
// This is how far, in the icon's own units (frame scale s).
export function below(y0, s, r) { return (y0 - Math.min(-100, 4.5 - r * Math.tan((10 * Math.PI) / 180))) / s; }

// ---------- landmark helpers ----------
export function farGround(b, side, color, y = -0.2) {
  b.box(VC.solid, color, side * (EDGE + 7 + 40), y, -CHUNK_LEN / 2, 80, 0.2, CHUNK_LEN);
}

// Animated LED screen: an atlas of `cells` ads side by side; each screen cycles through them.
// Vertex colour r = phase offset, g = brightness (both baked by the Batcher).
export function screenMat(tex, cells, k = 1.5, speed = 0.2) {
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { time: { value: 0 }, cells: { value: cells }, k: { value: k }, speed: { value: speed } }]);
  u.map = { value: tex };
  u.uCurveY = curveUniforms.uCurveY; u.uCurveX = curveUniforms.uCurveX;
  return new THREE.ShaderMaterial({
    uniforms: u, vertexColors: true, fog: true,
    vertexShader: `uniform float uCurveY, uCurveX; varying vec2 vUv; varying vec3 vC;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vC = color; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); ${CURVE_GLSL}
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform sampler2D map; uniform float time, cells, k, speed; varying vec2 vUv; varying vec3 vC;
      #include <fog_pars_fragment>
      void main(){
        float t = time * speed + vC.r * 7.0;
        float idx = floor(t), f = fract(t);
        float cur = mod(idx + floor(vC.r * cells), cells), nxt = mod(cur + 1.0, cells);
        vec2 uv = clamp(vUv, 0.002, 0.998);
        vec3 a = texture2D(map, vec2((uv.x + cur) / cells, uv.y)).rgb;
        vec3 b = texture2D(map, vec2((uv.x + nxt) / cells, uv.y)).rgb;
        float w = step(vUv.y, 1.0 - (f - 0.88) / 0.12);
        vec3 col = f > 0.88 ? mix(b, a, w) : a;
        float led = 0.8 + 0.2 * step(0.3, fract(vUv.y * 64.0));
        gl_FragColor = vec4(col * led * k * vC.g, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}
export const screenTint = (bright = 1) => new THREE.Color(Math.random(), bright * rand(0.8, 1.1), 0);

// Single label texture (signs, letters on towers).
export function textTex(text, { w = 1024, h = 256, color = '#ffffff', glow = null, bg = null, font = '"Russo One", "Arial Black", sans-serif', weight = 900, size = 0.62, border = null } = {}) {
  return canvasTex(w, h, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } else g.clearRect(0, 0, w, h);
    if (border) { g.strokeStyle = border; g.lineWidth = h * 0.05; g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12); }
    let px = Math.floor(h * size);
    g.font = `${weight} ${px}px ${font}`;
    const m = g.measureText(text).width, max = w * 0.92;
    if (m > max) { px = Math.floor(px * max / m); g.font = `${weight} ${px}px ${font}`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (glow) { g.shadowColor = glow; g.shadowBlur = h * 0.12; }
    g.fillStyle = color; g.fillText(text, w / 2, h / 2 + h * 0.03);
    if (glow) { g.shadowBlur = h * 0.03; g.fillText(text, w / 2, h / 2 + h * 0.03); }
  }, { repeat: false });
}

// Little crowd silhouettes on sidewalks and plazas.
const PEOPLE = ['#2b2d3a', '#3a2f3f', '#1f2a3a', '#4a3a34', '#2f3a2f', '#5a2b33', '#2a3550'];
export function people(b, x0, x1, z0, z1, n, colors = PEOPLE) {
  for (let i = 0; i < n; i++) {
    const x = rand(Math.min(x0, x1), Math.max(x0, x1)), z = -rand(z0, z1), s = rand(0.9, 1.1);
    const c = pick(colors);
    b.add(G.cyl8, VC.solid, x, 0.55 * s, z, 0.32 * s, 1.1 * s, 0.26 * s, 0, 0, 0, c);
    b.box(VC.solid, c, x, 1.25 * s, z, 0.44 * s, 0.6 * s, 0.26 * s);
    b.sph(VC.solid, '#c99a7c', x, 1.72 * s, z, 0.15 * s, true);
  }
}

export const TAPER = new THREE.CylinderGeometry(0.3, 0.5, 1, 12);   // unit tapered column (top radius 60%)
export const RING = new THREE.TorusGeometry(1, 0.012, 6, 72);         // unit thin ring, scale by radius
RING.rotateX(Math.PI / 2);
