// Dubai's shows. Burj Khalifa's LED facade: one material per tower (the horizon's, the one in the fountain's scene), each
// knowing where its tower's foot is in its mesh's coordinates and how tall it is, so the programmes are painted from a
// point's height up the tower and its bearing round it: gold rising up it, the flag (green, white, black, the red band
// down one wing), a rainbow spiralling, a storm of sparkles, pink streaks falling, a heartbeat; a sweep of white light up
// the tower between them. And the drone show: hundreds of lights drawing a falcon, the flag, a heart, دبي, a dhow, the
// tower itself in the sky over the creek, easing from each picture into the next.
import { THREE, curveUniforms, CURVE_GLSL, canvasTex, rand } from '../core.js';

export const showClock = { value: 0 };
export function ledMaterial({ base, H, curved = false }) {
  const u = { time: showClock, uBase: { value: new THREE.Vector3(...base) }, uH: { value: H }, uK: { value: 1 }, uCurveY: curveUniforms.uCurveY, uCurveX: curveUniforms.uCurveX };
  return new THREE.ShaderMaterial({
    uniforms: u, transparent: true,
    vertexShader: `uniform float uCurveY, uCurveX; uniform vec3 uBase; varying vec3 vP; varying vec3 vN;
      void main(){ vP = position - uBase; vN = normal; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); ${curved ? CURVE_GLSL : ''} gl_Position = projectionMatrix * mvPosition; }`,
    fragmentShader: `uniform float time, uH, uK; varying vec3 vP; varying vec3 vN;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      vec3 hsv(float h, float s, float v){ vec3 k = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); return v * mix(vec3(1.0), k, s); }
      void main(){
        float h = clamp(vP.y / uH, 0.0, 1.0), a = atan(vP.x, vP.z) / 6.2831853 + 0.5;
        float T = 11.0, P = mod(floor(time / T), 8.0), f = fract(time / T);
        // at rest: the silvered glass, its rooms lit here and there, the spire's steel catching the last of the sky
        vec3 c = vec3(0.2, 0.25, 0.34) + vec3(1.0, 0.9, 0.72) * step(0.8, hash(floor(vec2(a * 70.0, h * 180.0)))) * 0.5;
        if (h > 0.71) c = mix(c, vec3(0.75, 0.8, 0.95), smoothstep(0.71, 0.76, h));
        if (P == 1.0) c = mix(vec3(0.05, 0.04, 0.06), vec3(1.0, 0.72, 0.25) * 2.4, smoothstep(0.5, 1.0, fract(h * 7.0 - time * 0.7)));
        else if (P == 2.0) {
          c = h > 0.62 ? vec3(0.0, 0.55, 0.25) * 2.0 : h > 0.31 ? vec3(1.7) : vec3(0.07);
          if (abs(fract(a + 0.08) - 0.5) < 0.1) c = vec3(0.95, 0.07, 0.18) * 2.2;
        }
        else if (P == 3.0) c = hsv(fract(h * 1.5 + a - time * 0.08), 0.85, 1.9);
        else if (P == 4.0) c = vec3(0.07, 0.09, 0.2) + vec3(2.6) * step(0.93, hash(floor(vec2(a * 90.0, h * 320.0)) + floor(time * 9.0)));
        else if (P == 5.0) { float r = fract(h * 3.0 + time * 0.9); c = vec3(1.0, 0.25, 0.5) * 2.2 * smoothstep(0.0, 0.25, r) * (1.0 - r); }
        else if (P == 6.0) c = mix(vec3(0.5, 0.04, 0.12), vec3(2.4, 0.3, 0.55), pow(abs(sin(time * 3.1)), 8.0));
        else if (P == 7.0) c = mix(vec3(0.1, 0.25, 0.6), vec3(0.3, 1.6, 2.2), smoothstep(0.3, 0.7, sin(h * 40.0 - time * 3.0 + a * 12.566) * 0.5 + 0.5));
        if (f < 0.09) c = mix(c, vec3(2.2), smoothstep(0.04, 0.0, abs(h - f / 0.09)));   // the sweep of white between programmes
        gl_FragColor = vec4(c * (0.72 + 0.28 * abs(vN.x)), uK);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

// ---------- the drone show ----------
// Each picture is drawn on a little canvas, and N of its lit pixels become the drones' places (and colours) in it; the
// drones ease from one picture to the next. The whole show is one Points mesh in the sky.
function sample(draw, N, W = 160, H = 96) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); draw(g, W, H);   // (a canvas kept on the CPU: reading it back is then cheap)
  const d = g.getImageData(0, 0, W, H).data, lit = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4; if (d[i] + d[i + 1] + d[i + 2] > 120) lit.push([x, y, d[i], d[i + 1], d[i + 2]]); }
  const out = [];
  for (let k = 0; k < N; k++) { const p = lit.length ? lit[Math.floor((k / N) * lit.length + rand(0, lit.length / N)) % lit.length] : [W / 2, H / 2, 255, 255, 255]; out.push([(p[0] - W / 2) / W, (H / 2 - p[1]) / W, p[2] / 255, p[3] / 255, p[4] / 255]); }
  return out;
}
export function droneShow({ N = 520, size = 240 } = {}) {
  const gold = '#ffd27a';
  const pics = [
    (g) => {   // a falcon, wings spread
      g.fillStyle = gold; g.beginPath(); g.moveTo(80, 30); g.quadraticCurveTo(50, 10, 10, 26); g.quadraticCurveTo(46, 30, 70, 46); g.lineTo(76, 72); g.lineTo(84, 72); g.lineTo(90, 46); g.quadraticCurveTo(114, 30, 150, 26); g.quadraticCurveTo(110, 10, 80, 30); g.fill();
      g.beginPath(); g.arc(80, 30, 6, 0, Math.PI * 2); g.fill();
    },
    (g) => { g.fillStyle = '#00843d'; g.fillRect(50, 24, 90, 16); g.fillStyle = '#ffffff'; g.fillRect(50, 40, 90, 16); g.fillStyle = '#5a5a60'; g.fillRect(50, 56, 90, 16); g.fillStyle = '#e8112d'; g.fillRect(24, 24, 26, 48); },   // the flag
    (g) => { g.fillStyle = '#ff3d7f'; g.beginPath(); g.moveTo(80, 80); g.bezierCurveTo(20, 40, 50, 6, 80, 32); g.bezierCurveTo(110, 6, 140, 40, 80, 80); g.fill(); },   // a heart
    (g) => { g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; g.font = '900 44px "Noto Kufi Arabic", sans-serif'; g.fillText('دبي', 80, 34); g.direction = 'ltr'; g.font = '700 22px "Oswald", sans-serif'; g.fillText('DUBAI', 80, 74); },
    (g) => {   // a dhow under her sail
      g.fillStyle = '#7ad8ff'; g.beginPath(); g.moveTo(30, 66); g.lineTo(130, 66); g.lineTo(118, 80); g.lineTo(44, 80); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(84, 14); g.lineTo(84, 62); g.lineTo(40, 62); g.quadraticCurveTo(60, 40, 84, 14); g.fill(); g.fillRect(84, 14, 3, 52);
    },
    (g) => { g.fillStyle = '#c8e4ff'; g.beginPath(); g.moveTo(80, 4); g.lineTo(84, 30); g.lineTo(92, 44); g.lineTo(98, 70); g.lineTo(104, 92); g.lineTo(56, 92); g.lineTo(62, 70); g.lineTo(68, 44); g.lineTo(76, 30); g.fill(); },   // the tower
  ].map((d) => sample(d, N));
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  const dot = canvasTex(32, 32, (c) => { const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 32); }, { repeat: false });
  const mat = new THREE.PointsMaterial({ size: 4.2, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false; pts.renderOrder = -3;
  const HOLD = 7, MOVE = 3, CY = HOLD + MOVE;
  pts.userData.update = (t, k = 1) => {
    const i = Math.floor(t / CY) % pics.length, f = (t % CY) - HOLD, e = f <= 0 ? 0 : f / MOVE, s = e * e * (3 - 2 * e);
    const A = pics[i], B = pics[(i + 1) % pics.length];
    for (let n = 0; n < N; n++) {
      const a = A[n], b = B[n], wob = Math.sin(t * 1.7 + n) * 0.004;
      pos[n * 3] = (a[0] + (b[0] - a[0]) * s) * size; pos[n * 3 + 1] = (a[1] + (b[1] - a[1]) * s + wob) * size + s * (1 - s) * 40 * Math.sin(n);
      pos[n * 3 + 2] = Math.sin(n * 7.3) * 6 * s * (1 - s) * 4;
      const br = 1.6 * k;
      col[n * 3] = (a[2] + (b[2] - a[2]) * s) * br; col[n * 3 + 1] = (a[3] + (b[3] - a[3]) * s) * br; col[n * 3 + 2] = (a[4] + (b[4] - a[4]) * s) * br;
    }
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    pts.visible = k > 0.01;
  };
  pts.userData.update(0);
  return pts;
}
