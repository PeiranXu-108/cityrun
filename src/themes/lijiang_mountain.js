// Photo-informed Jade Dragon massif, viewed from the old town / Baisha side.
// Visual references (geometry and colour study; no photographs bundled):
// https://k.sina.cn/article_6799021963_19540d78b00100s6f7.html
// https://gs.ctrip.com/html5/you/sight/yulong1446279/17968.html
// https://www.sohu.com/a/611061316_121612311
// A connected limestone wall: uneven summit towers, fluted buttresses, snow-filled
// couloirs and broad glacial aprons. Heights are composed for the game's skyline,
// not surveyed terrain. Keep the warm dusk light used by the Lijiang theme.
import { THREE } from '../core.js';

// Angle / elevation control points. Shanzidou has a broken, broad fan-shaped crown;
// lower shoulders overlap asymmetrically rather than repeating identical cones.
const CREST = [
  [-39, -16], [-35, 38], [-32, 73], [-29, 90], [-27.3, 126],
  [-25.8, 114], [-23.5, 149], [-22.3, 166], [-21.2, 150],
  [-19.2, 157], [-17.5, 188], [-16.1, 173], [-14.8, 194],
  [-13.5, 180], [-12.4, 159], [-10.5, 176], [-9.1, 207],
  [-7.8, 198], [-6.4, 221], [-5.2, 212], [-3.5, 245],
  [-2.1, 253], [-1.3, 247], [-0.3, 269], [0.6, 272],
  [1.6, 259], [2.8, 264], [4.0, 241], [4.7, 225],
  [6.1, 238], [7.3, 220], [8.2, 226], [9.5, 194],
  [11.2, 181], [12.4, 202], [13.8, 194], [15.3, 169],
  [17.0, 178], [18.2, 158], [19.6, 161], [21.2, 131],
  [23.1, 145], [25.0, 119], [27.4, 110], [30, 65],
  [33, 46], [36, -12],
];
const clamp = THREE.MathUtils.clamp;
const smooth = THREE.MathUtils.smoothstep;
const mix = THREE.MathUtils.lerp;
const fract = (v) => v - Math.floor(v);
const hash = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);

function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return mix(mix(hash(ix, iy), hash(ix + 1, iy), u),
    mix(hash(ix, iy + 1), hash(ix + 1, iy + 1), u), v);
}

function ridgeHeight(deg) {
  let i = 0;
  while (i < CREST.length - 2 && deg > CREST[i + 1][0]) i++;
  const [a, h] = CREST[i], [b, k] = CREST[i + 1];
  const t = clamp((deg - a) / (b - a), 0, 1);
  // Almost linear interpolation preserves the sharp rock towers and saddles.
  return mix(h, k, t) + (noise(deg * 5.4, 2.7) - 0.5) * 5.5;
}

// Each summit has its own depth, transverse width and downhill reach. Their
// intersecting slopes make diagonal arêtes and deep cirques, not an extruded wall.
const MASSIFS = [
  [-29, 1050, 7, 230], [-23, 1085, 8, 260], [-17.5, 1050, 8, 290],
  [-14.8, 1100, 7, 250], [-9.1, 1040, 8, 310], [-6.4, 1060, 7, 280],
  [-2.1, 1020, 7, 330], [0.6, 1030, 9.6, 370], [2.8, 1090, 7, 290], [6.1, 1095, 7, 300],
  [12.4, 1050, 8, 320], [17, 1100, 7, 260], [23.1, 1040, 8, 280],
  [28, 1100, 8, 260],
].map(([deg, r, w, d]) => ({ deg, r, w, d, h: ridgeHeight(deg) }));

function terrain(deg, v) {
  const r = 590 + v * 760;
  const warp = deg + (noise(deg * 0.45, r * 0.014) - 0.5) * 0.9;
  let y = -125, h = 0, t = 0, cut = 0;
  for (const peak of MASSIFS) {
    const dx = (warp - peak.deg) / (peak.w * 2.5);
    const dz = (r - peak.r) / peak.d;
    // Diamond-like rock ribs, with a little torsion down each individual spur.
    const skew = dx + dz * 0.28 * Math.sin(peak.deg * 0.73);
    const dist = Math.pow(Math.pow(Math.abs(skew), 1.15)
      + Math.pow(Math.abs(dz), 1.5), 1 / 1.5);
    const py = peak.h - Math.pow(dist, 1.28) * (peak.h + 120);
    if (py > y) {
      y = py; h = peak.h; t = clamp(1 - dist, 0, 1);
      cut = Math.pow(Math.abs(Math.sin(Math.atan2(skew, dz) * 3.5)), 6);
    }
  }
  const envelope = smooth(y, -110, 30) * (0.3 + 0.7 * (1 - t));
  // Multi-scale erosion breaks the broad slopes into ledges, fissures and scree.
  const crags = (noise(warp * 0.9, r * 0.055) - 0.5) * 28
    + (noise(warp * 2.3, r * 0.13) - 0.5) * 13
    + (noise(warp * 5.8, r * 0.31) - 0.5) * 6;
  y += (crags - cut * 12) * envelope;
  const edgeFade = (1 - smooth(-deg, 30, 39)) * (1 - smooth(deg, 28, 36));
  y = -125 + (y + 125) * edgeFade;
  const a = deg * Math.PI / 180;
  return { x: Math.sin(a) * r, y, z: -Math.cos(a) * r, t, cut, warp, h };
}

export function snowMountain(b) {
  // Static geometry and baked lighting: no terrain work in the animation loop.
  const NU = 480, NV = 120;
  const positions = [], indices = [], samples = [];
  for (let i = 0; i <= NU; i++) {
    const deg = -39 + 75 * i / NU;
    for (let j = 0; j <= NV; j++) {
      const p = terrain(deg, j / NV);
      samples.push(p); positions.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const p = i * (NV + 1) + j, q = p + NV + 1;
    // Upward-facing normals are essential for slope-dependent snow.
    indices.push(p, q, p + 1, p + 1, q, q + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices); geo.computeVertexNormals();
  const normals = geo.attributes.normal, colors = new Float32Array(samples.length * 3);
  const light = new THREE.Vector3(-0.65, 0.64, 0.4).normalize();
  const n = new THREE.Vector3(), c = new THREE.Color(), snowColor = new THREE.Color();
  const rockShade = new THREE.Color('#303e57'), rockSun = new THREE.Color('#8d8680');
  const snowShade = new THREE.Color('#a7bdd9'), snowSun = new THREE.Color('#fff0d7');
  const summitGold = new THREE.Color('#ffd29b'), haze = new THREE.Color('#505c83');
  for (let k = 0; k < samples.length; k++) {
    const p = samples[k];
    n.fromBufferAttribute(normals, k);
    const lit = clamp(n.dot(light) * 0.82 + 0.18, 0, 1);
    const grain = noise(p.warp * 7.2, p.t * 110);
    const snowline = 74 + 17 * Math.sin(p.warp * 0.58)
      + (noise(p.warp * 1.6, p.t * 9) - 0.5) * 26;
    const altitude = smooth(p.y, snowline - 22, snowline + 34);
    // Rock remains exposed on vertical faces; snow collects in gullies and bowls,
    // with narrow snow ribbons continuing well below the summit snowfields.
    const ledge = smooth(n.y, 0.48, 0.83);
    const channel = smooth(p.cut, 0.48, 0.90) * smooth(p.y, 20, 110) * 0.50;
    const deposit = noise(p.warp * 0.85, p.t * 12);
    const snow = clamp(altitude * (0.08 + ledge * 0.92)
      + channel * (0.18 + ledge * 0.82) + (deposit - 0.5) * 0.35 - grain * 0.08, 0, 1);
    const strata = Math.sin(p.y * 0.52 + p.warp * 1.8) * 0.035;
    c.copy(rockShade).lerp(rockSun, lit).multiplyScalar(0.84 + grain * 0.23 + strata);
    snowColor.copy(snowShade).lerp(snowSun, lit);
    snowColor.lerp(summitGold, smooth(p.y, 175, 270) * lit * 0.36);
    c.lerp(snowColor, smooth(snow, 0.12, 0.85));
    c.lerp(haze, (1 - smooth(p.y, -25, 125)) * 0.72);
    c.toArray(colors, k * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(samples.length * 2), 2));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
  mat.name = 'Yulong limestone and snow';
  b.addM(geo, mat, new THREE.Matrix4(), null);
  geo.dispose();
}

export function mountainMist() {
  const time = { value: 0 };
  const mat = new THREE.ShaderMaterial({
    name: 'Yulong thin drifting mist',
    uniforms: { time, tint: { value: new THREE.Color('#c7d1e2') } },
    transparent: true, depthWrite: false, fog: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform float time;
      uniform vec3 tint;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
          mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
      }
      void main() {
        vec2 p = vUv * vec2(7.0, 3.0) + vec2(time * 0.018, 0.0);
        float cloud = noise(p) * 0.58 + noise(p*2.03+7.0) * 0.28
          + noise(p*4.07+19.0) * 0.14;
        vec2 edge = abs(vUv * 2.0 - 1.0);
        float fade = (1.0-smoothstep(0.45, 1.0, edge.x))
          * (1.0-smoothstep(0.15, 1.0, edge.y));
        float alpha = smoothstep(0.30, 0.76, cloud) * fade * 0.24;
        gl_FragColor = vec4(tint, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const group = new THREE.Group();
  group.name = 'Yulong mountain mist';
  const plane = new THREE.PlaneGeometry(1, 1);
  // Small separated veils across lower shoulders; the central crown stays clear.
  for (const [x, y, z, w, h, angle] of [
    [-245, 89, -853, 270, 42, -0.08],
    [192, 60, -876, 320, 48, 0.06],
    [-42, 34, -808, 230, 29, 0.02],
  ]) {
    const mesh = new THREE.Mesh(plane, mat);
    mesh.position.set(x, y, z); mesh.scale.set(w, h, 1); mesh.rotation.z = angle;
    mesh.renderOrder = -4; mesh.frustumCulled = false;
    group.add(mesh);
  }
  return { group, update(t) { time.value = t; } };
}
