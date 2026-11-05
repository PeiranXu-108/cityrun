// The Pacific for the beach from Venice to Santa Monica (la_beach.js) and for the open sea on the skyline (la.js). Both
// take their colour from the direction you look in, as the real sea does at sunset (the sky's glow along the horizon,
// rose and mauve below it, deep violet looking down, the sun's road under the sunset), so the near water and the far
// water meet without a seam wherever the curved world's horizon happens to fall. The near water also knows how far it
// is from the shore (uv.x: metres out to sea from the mean waterline; uv.y: along the stretch): the swell lifting as it
// comes in, breaking in lines of foam, the whitewater rolling in; the swash running up the sand and sliding back, the
// sand darkened where it has been. The far water has the glitter and a faint grain of swell lines.
import { THREE, curveUniforms, CURVE_GLSL } from '../core.js';

export const SEA = -1.0;   // the sea's level (the walk is at 0)
export const seaU = { uTime: { value: 0 }, uSunAz: { value: 0 } };   // shared by every sea material: the clock, the sun's bearing
const col = (hex, k = 1) => ({ value: new THREE.Color(hex).multiplyScalar(k) });
const COLS = {
  cHorizon: col('#eea488'), cRose: col('#cc7c96'), cMauve: col('#8e5088'), cViolet: col('#563a7a'), cDeep: col('#342a5e'),
  cHaze: col('#eaa890'), cGold: col('#ffca80', 1.2), cShallow: col('#a87888'), cFoam: col('#fff0ea', 0.8), cWet: col('#5a3e40'),
};

// Los Angeles's own uniforms; another sea (Dubai's Gulf) brings its own clock, sun bearing and colours: seaUniforms()
const LA_U = { ...seaU, ...COLS };
export const seaUniforms = (cols) => ({ uTime: { value: 0 }, uSunAz: { value: 0 },
  ...Object.fromEntries(Object.entries(cols).map(([k, [hex, m = 1]]) => [k, { value: new THREE.Color(hex).multiplyScalar(m) }])) });

const COMMON = `
  #define PI 3.14159265
  uniform float uTime, uSunAz;
  uniform vec3 cHorizon, cRose, cMauve, cViolet, cDeep, cHaze, cGold, cShallow, cFoam, cWet;
  float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  // open water seen along d (world space); e: how far below the horizon (its sine), road: on the sun's road
  vec3 seaColor(vec3 d, out float e, out float road) {
    d = normalize(d); e = max(-d.y, 0.0);
    vec3 c = mix(cHorizon, cRose, smoothstep(0.0, 0.03, e));
    c = mix(c, cMauve, smoothstep(0.02, 0.07, e));
    c = mix(c, cViolet, smoothstep(0.05, 0.14, e));
    c = mix(c, cDeep, smoothstep(0.12, 0.36, e));
    float az = atan(d.x, -d.z), da = abs(mod(az - uSunAz + PI, 2.0 * PI) - PI), w = 0.018 + e * 0.6;
    road = exp(-da * da / (w * w)) * (1.0 - smoothstep(0.0, 0.2, e));
    return mix(c, cGold, road * 0.62);
  }
  float seaHaze(float e) { return 0.55 * exp(-e / 0.016); }
  // the swell coming in: its phase d metres out at z along the shore (crests where it is whole), the crest's profile
  // (u = fract(phase): just behind a crest u is small, just in front of the next one it nears 1), its height
  float wavePhase(float d, float z, float t) { return (d + 2.1 * t) / 14.0 + 0.32 * sin(z * 0.023) + 0.15 * sin(z * 0.061 + 1.3); }
  float crest(float u) { return max(exp(-u * 4.0), smoothstep(0.86, 1.0, u)); }
  float liftAmp(float d) { return (0.08 + 0.24 * exp(-pow((d - 19.0) / 7.0, 2.0))) * smoothstep(-0.5, 6.0, d); }
`;

// The near water, bent with the world. Its geometry carries uv = (metres out from the waterline, metres along the stretch).
export function seaMat(U = LA_U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uCurveY: curveUniforms.uCurveY, uCurveX: curveUniforms.uCurveX },
    vertexShader: `${COMMON}
      uniform float uCurveY, uCurveX;
      varying vec3 vDir; varying vec3 vW; varying float vD, vLift, vDepth;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        float d = uv.x, u = fract(wavePhase(d, w.z, uTime));
        vLift = crest(u); w.y += liftAmp(d) * (vLift - 0.3);
        vec4 mvPosition = viewMatrix * w;
        ${CURVE_GLSL}
        vDir = (vec4(mvPosition.xyz, 0.0) * viewMatrix).xyz;
        vW = w.xyz; vD = d; vDepth = -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
      }`,
    fragmentShader: `${COMMON}
      varying vec3 vDir; varying vec3 vW; varying float vD, vLift, vDepth;
      void main() {
        float e, road, d = vD, z = vW.z, t = uTime;
        vec3 c = seaColor(vDir, e, road);
        float near = 1.0 - smoothstep(55.0, 115.0, vDepth);   // the detail fades before the water reaches its horizon
        c = mix(c, cShallow, exp(-max(d, 0.0) / 4.5) * 0.55);   // the sand showing through the shallows
        c *= 1.0 + (vnoise(vec2(vW.x * 0.7, z * 0.045 + t * 0.05)) - 0.5) * 0.16 * near;   // swell lines along the shore
        c *= 1.0 + (vLift - 0.35) * 0.12 * near * smoothstep(45.0, 20.0, d);   // the crests catching the light
        // foam: the crests breaking on the bar and the whitewater rolling in behind them; a few whitecaps further out
        float ph = wavePhase(d, z, t), u = fract(ph), brk = smoothstep(23.0, 15.0, d) * smoothstep(0.2, 2.2, d);
        brk *= 0.45 + 0.55 * smoothstep(0.2, 0.7, vnoise(vec2(z * 0.035, floor(ph) * 0.9)));   // this wave breaks harder here than there
        c *= 1.0 - 0.16 * smoothstep(0.86, 0.99, u) * smoothstep(30.0, 18.0, d) * near;   // the dark face of the wave standing up
        float n = vnoise(vec2(z * 0.7, d * 1.1 - t * 0.5)) * 0.5 + vnoise(vec2(z * 2.3, d * 2.9 + t * 0.8)) * 0.32 + vnoise(vec2(z * 6.0, d * 6.5)) * 0.18;
        float f = (exp(-u * 11.0) + 0.42 * exp(-u * 3.2)) * brk;
        float foam = smoothstep(0.42, 0.85, f * (0.3 + 1.15 * n));
        foam += smoothstep(0.92, 0.98, vnoise(vec2(vW.x * 0.35 - t * 0.2, z * 0.18))) * 0.35 * smoothstep(30.0, 60.0, d);
        c = mix(c, cFoam, clamp(foam, 0.0, 1.0) * near);
        // glitter on the sun's road
        float g = smoothstep(0.88, 0.97, vnoise(vec2(vW.x * 2.2 + t * 1.1, z * 0.9 - t * 0.6)));
        c += cGold * g * (road * 1.2 + 0.15 * smoothstep(0.25, 0.08, e)) * near;
        c = mix(c, cHaze, seaHaze(e));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

// The swash, laid over the sand along the waterline (the same uv): each wave's whitewater running up the beach,
// its lace of foam at the front, the film of water sliding back; the sand dark and glossy where the waves have been.
export function swashMat(U = LA_U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uCurveY: curveUniforms.uCurveY, uCurveX: curveUniforms.uCurveX },
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    vertexShader: `${COMMON}
      uniform float uCurveY, uCurveX;
      varying vec3 vDir; varying vec3 vW; varying float vD, vDepth;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vec4 mvPosition = viewMatrix * w;
        ${CURVE_GLSL}
        vDir = (vec4(mvPosition.xyz, 0.0) * viewMatrix).xyz;
        vW = w.xyz; vD = uv.x; vDepth = -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
      }`,
    fragmentShader: `${COMMON}
      varying vec3 vDir; varying vec3 vW; varying float vD, vDepth;
      void main() {
        float e, road, d = vD, z = vW.z, t = uTime;
        // this wave's run-up: the bore reaches the waterline as its crest arrives, rushes up the sand, slides back
        float ph = wavePhase(0.0, z, t), q = fract(ph), k = floor(ph);
        float R = 2.4 + 2.4 * vnoise(vec2(z * 0.05, k * 1.7)), Rmax = 4.8;
        float L = q < 0.2 ? R * sin(q / 0.2 * PI * 0.5) : R * pow(1.0 - (q - 0.2) / 0.8, 1.7);
        float front = -L + (vnoise(vec2(z * 0.9, k)) - 0.5) * 0.8;
        float water = smoothstep(front - 0.05, front + 0.35, d);   // 1 behind the front, toward the sea
        float lace = vnoise(vec2(z * 1.6, (d - front) * 2.8 - t * 0.3)) * 0.5 + vnoise(vec2(z * 4.5, d * 5.5 + k)) * 0.3 + vnoise(vec2(z * 11.0, d * 9.0 - k)) * 0.2;
        float edge = exp(-pow((d - front) / 0.42, 2.0)) * (1.0 - smoothstep(0.45, 0.95, q));
        float trail = water * exp(-max(d - front, 0.0) / 1.3) * (1.0 - smoothstep(0.25, 0.8, q));
        float foam = clamp(smoothstep(0.35, 0.8, (edge + trail * 0.75) * (0.25 + 1.3 * lace)), 0.0, 1.0);
        float wet = smoothstep(-(Rmax + 1.4), -(Rmax - 1.2), d) * (0.62 + 0.38 * vnoise(vec2(z * 0.3, d * 0.6)));
        vec3 film = mix(seaColor(vDir, e, road), cShallow, 0.45) * 1.06;
        film += cGold * road * 0.5;
        float a = mix(wet * 0.42, mix(0.42, 0.85, smoothstep(0.0, 2.0, d - front)), water);
        vec3 c = mix(cWet, film, water);
        c = mix(c, cFoam, foam); a = max(a, foam * 0.95);
        a *= 1.0 - smoothstep(1.2, 2.6, d);   // gone into the sea's own colour a little way out
        c = mix(c, cHaze, seaHaze(e) * 0.5);
        gl_FragColor = vec4(c, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

// The open sea on the skyline: not bent, it follows the camera; the same colour, the glitter of the sun's road, a faint
// grain of swell lines drawn closer together toward the horizon.
export function farSeaMat(U = LA_U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U },
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec3 vDir;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vDir = w.xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `${COMMON}
      varying vec3 vDir;
      void main() {
        float e, road;
        vec3 c = seaColor(vDir, e, road), d = normalize(vDir);
        float az = atan(d.x, -d.z), s = 0.06 / (e + 0.003);
        c *= 1.0 + (vnoise(vec2(az * 38.0, s * 4.0)) - 0.5) * 0.1 * smoothstep(0.004, 0.03, e);
        c = mix(c, cHaze, seaHaze(e));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

// The sea's surface over a stretch of shore, x0(S) the waterline's x at S metres along it: rows every `dz` metres from
// S0 to S1 (chunk-local z = -(S - Sc), Sc the chunk's own start), columns at the distances D out from the waterline.
const DIST = [-2.5, ...Array.from({ length: 31 }, (_, i) => i), 32, 35, 38, 42, 47, 54, 63, 75, 92, 115, 145, 185, 240, 320, 430, 580];
export function seaGeo(x0, S0, S1, Sc, { D = DIST, dz = 5, y = SEA } = {}) {
  const rows = Math.max(1, Math.round((S1 - S0) / dz)), pos = [], uv = [], idx = [];
  for (let r = 0; r <= rows; r++) {
    const S = S0 + ((S1 - S0) * r) / rows, xs = x0(S);
    for (const d of D) { pos.push(xs - d, y, -(S - Sc)); uv.push(d, S); }
  }
  const n = D.length;
  for (let r = 0; r < rows; r++) for (let i = 0; i < n - 1; i++) { const a = r * n + i, b = a + 1, c = a + n, e = c + 1; idx.push(a, c, b, b, c, e); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
