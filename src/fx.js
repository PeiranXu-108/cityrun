// Visual effects: sky dome, stars, burst particles, ambient weather, speed lines, light trails, post FX.
import { THREE, CURVE_GLSL, curveUniforms, rand, pick } from "./core.js";

const NOISE_GLSL = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<4;i++){ v += a*vnoise(p); p *= 2.03; a *= 0.5; } return v; }`;

// ---------- sky ----------
export function makeSky() {
  const u = {
    top: { value: new THREE.Color() },
    mid: { value: new THREE.Color() },
    bot: { value: new THREE.Color() },
    glow: { value: new THREE.Color() },
    sunColor: { value: new THREE.Color() },
    cloudColor: { value: new THREE.Color() },
    sunDir: { value: new THREE.Vector3(0, 0.1, -1) },
    sunSize: { value: 0.02 },
    horizon: { value: -0.08 },
    time: { value: 0 },
    cloud: { value: 0 },
    moon: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `
      uniform vec3 top, mid, bot, glow, sunColor, cloudColor, sunDir;
      uniform float sunSize, horizon, time, cloud, moon;
      varying vec3 vDir;
      ${NOISE_GLSL}
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y - horizon;
        vec3 col = mix(bot, mid, smoothstep(-0.03, 0.2, h));
        col = mix(col, top, smoothstep(0.16, 0.7, h));
        vec3 sd = normalize(sunDir);
        float s = max(dot(d, sd), 0.0);
        col += glow * (exp(-abs(h) * 9.0) * 0.55 + pow(s, 5.0) * 0.45);
        if (cloud > 0.0) {
          vec2 uv = d.xz / (max(d.y, 0.0) + 0.18) * 0.9 + vec2(time * 0.006, time * 0.002);
          float n = fbm(uv * 1.6);
          float c = smoothstep(0.48, 0.82, n) * cloud * smoothstep(-0.02, 0.1, h) * (1.0 - smoothstep(0.45, 0.85, h));
          vec3 cc = mix(cloudColor, sunColor * 1.2, pow(s, 3.0) * 0.7);
          col = mix(col, cc, c);
        }
        float disc = smoothstep(1.0 - sunSize, 1.0 - sunSize * 0.8, s);
        vec3 dc = sunColor;
        if (moon > 0.0) {
          vec3 r = normalize(cross(sd, vec3(0.0, 1.0, 0.0)));
          vec3 up = cross(r, sd);
          vec2 mp = vec2(dot(d, r), dot(d, up)) * 60.0;
          dc *= 0.82 + 0.18 * vnoise(mp * 0.9) - 0.12 * smoothstep(0.6, 0.9, vnoise(mp * 0.45 + 3.0));
        }
        col = mix(col, dc, disc);
        col += sunColor * pow(s, 300.0) * 0.6;
        gl_FragColor = vec4(col, 1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 40, 20), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  const apply = (s) => {
    u.top.value.set(s.top);
    u.mid.value.set(s.mid);
    u.bot.value.set(s.bot);
    u.glow.value.set(s.glow || "#000000").multiplyScalar(s.glowK ?? 1);
    u.sunColor.value.set(s.sun || "#ffffff").multiplyScalar(s.sunK ?? 1);
    u.cloudColor.value.set(s.cloudColor || "#888888");
    u.sunDir.value.set(...(s.sunDir || [0, 0.1, -1]));
    u.sunSize.value = s.sunSize ?? 0.02;
    u.horizon.value = s.horizon ?? -0.08;
    u.cloud.value = s.cloud ?? 0;
    u.moon.value = s.moon ? 1 : 0;
  };
  return { mesh, u, apply };
}

export function makeStars(count = 1400) {
  const pos = new Float32Array(count * 3),
    ph = new Float32Array(count),
    sz = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const th = Math.random() * Math.PI * 2,
      y = Math.pow(Math.random(), 0.6) * 0.95 + 0.03;
    const r = Math.sqrt(1 - y * y);
    pos.set([Math.cos(th) * r * 900, y * 900, Math.sin(th) * r * 900], i * 3);
    ph[i] = Math.random() * 6.28;
    sz[i] = rand(1, 3.2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
  g.setAttribute("aSz", new THREE.BufferAttribute(sz, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, k: { value: 1 } },
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aPh; attribute float aSz; uniform float time; varying float vA;
      void main(){ vA = 0.55 + 0.45 * sin(time * 2.0 + aPh); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; gl_PointSize = aSz; }`,
    fragmentShader: `uniform float k; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA * k; gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * a * 1.6, a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  pts.renderOrder = -9;
  return pts;
}

// ---------- burst particles ----------
const PT_VERT = `
  attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
  uniform float uScale; uniform float uCurveY; uniform float uCurveX;
  varying float vA; varying vec3 vC;
  void main(){
    vA = aAlpha; vC = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    ${CURVE_GLSL}
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = min(aSize * uScale / max(-mvPosition.z, 0.5), 48.0);
  }`;
const PT_FRAG = `
  varying float vA; varying vec3 vC;
  void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d) * vA; if (a < 0.01) discard; gl_FragColor = vec4(vC * a, a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export const pointScale = { value: 400 };

export class Particles {
  constructor(max = 900) {
    this.max = max;
    this.i = 0;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    this.v = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.s0 = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      (this.aPos = new THREE.BufferAttribute(this.pos, 3)),
    );
    g.setAttribute(
      "aColor",
      (this.aCol = new THREE.BufferAttribute(this.col, 3)),
    );
    g.setAttribute(
      "aSize",
      (this.aSize = new THREE.BufferAttribute(this.size, 1)),
    );
    g.setAttribute(
      "aAlpha",
      (this.aAlpha = new THREE.BufferAttribute(this.alpha, 1)),
    );
    [this.aPos, this.aCol, this.aSize, this.aAlpha].forEach((a) =>
      a.setUsage(THREE.DynamicDrawUsage),
    );
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uScale: pointScale,
        uCurveY: curveUniforms.uCurveY,
        uCurveX: curveUniforms.uCurveX,
      },
      vertexShader: PT_VERT,
      fragmentShader: PT_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
    this.alive = 0;
  }
  emit(x, y, z, n, o = {}) {
    const c = new THREE.Color();
    for (let k = 0; k < n; k++) {
      const i = this.i;
      this.i = (this.i + 1) % this.max;
      const sp = (o.speed ?? 6) * rand(0.4, 1);
      const th = Math.random() * Math.PI * 2,
        ph = Math.acos(rand(-1, 1));
      this.pos[i * 3] = x + rand(-1, 1) * (o.spread ?? 0.2);
      this.pos[i * 3 + 1] = y + rand(-1, 1) * (o.spread ?? 0.2);
      this.pos[i * 3 + 2] = z + rand(-1, 1) * (o.spread ?? 0.2);
      this.v[i * 3] = Math.sin(ph) * Math.cos(th) * sp + (o.vx ?? 0);
      this.v[i * 3 + 1] =
        Math.abs(Math.cos(ph)) * sp * (o.upBias ?? 0.6) + (o.up ?? 2);
      this.v[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * sp + (o.vz ?? 0);
      const L = (o.life ?? 0.8) * rand(0.6, 1.2);
      this.life[i] = L;
      this.maxLife[i] = L;
      this.s0[i] = (o.size ?? 0.35) * rand(0.6, 1.3);
      this.grav[i] = o.grav ?? 9;
      this.drag[i] = o.drag ?? 1.5;
      c.set(
        o.colors ? o.colors[k % o.colors.length] : (o.color ?? "#ffd34d"),
      ).multiplyScalar(o.k ?? 2.5);
      this.col[i * 3] = c.r;
      this.col[i * 3 + 1] = c.g;
      this.col[i * 3 + 2] = c.b;
    }
    this.alive = this.max;
  }
  update(dt) {
    if (!this.alive) return;
    let any = 0;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) {
        this.alpha[i] = 0;
        continue;
      }
      any++;
      this.life[i] -= dt;
      const f = Math.exp(-this.drag[i] * dt);
      this.v[i * 3] *= f;
      this.v[i * 3 + 1] = this.v[i * 3 + 1] * f - this.grav[i] * dt;
      this.v[i * 3 + 2] *= f;
      this.pos[i * 3] += this.v[i * 3] * dt;
      this.pos[i * 3 + 1] += this.v[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.v[i * 3 + 2] * dt;
      const t = Math.max(this.life[i] / this.maxLife[i], 0);
      this.alpha[i] = Math.min(1, t * 2.2);
      this.size[i] = this.s0[i] * (0.4 + 0.6 * t);
    }
    if (!any) this.alive = 0;
    this.aPos.needsUpdate =
      this.aCol.needsUpdate =
      this.aSize.needsUpdate =
      this.aAlpha.needsUpdate =
        true;
  }
  clear() {
    this.life.fill(0);
    this.alpha.fill(0);
    this.aAlpha.needsUpdate = true;
  }
}

// ---------- ambient weather around the camera ----------
// mode: rain (streak lines), rise (embers), fall (petals), float (fireflies)
// shape: 0 round dot, 1 spinning oval petal, 2 notched sakura petal, 3 fan-shaped ginkgo leaf, 4 five-lobed jacaranda bell,
// 5 six-armed snowflake, 6 sky lantern (upright, glowing from its burner; use with mode rise),
// 7 soap bubble (an iridescent rim with a window highlight; use with mode rise)
// (2-4 tumble and are alpha blended)
export class Ambient {
  constructor({
    mode = "rise",
    count = 500,
    box = [50, 30, 90],
    colors = ["#ff8a2a"],
    size = 0.25,
    speed = 1.5,
    k = 2.5,
    shape = 0,
  }) {
    this.mode = mode;
    const isRain = mode === "rain";
    const n = isRain ? count * 2 : count;
    const base = new Float32Array(n * 3),
      ph = new Float32Array(n),
      col = new Float32Array(n * 3),
      end = new Float32Array(n);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const b = [
        rand(-0.5, 0.5) * box[0],
        Math.random() * box[1],
        Math.random() * box[2],
      ];
      const p = Math.random() * 100;
      c.set(colors[i % colors.length]).multiplyScalar(k);
      const reps = isRain ? 2 : 1;
      for (let r = 0; r < reps; r++) {
        const j = i * reps + r;
        base.set(b, j * 3);
        ph[j] = p;
        col.set([c.r, c.g, c.b], j * 3);
        end[j] = r;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(base, 3));
    g.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
    this.u = {
      time: { value: 0 },
      zoff: { value: 0 },
      box: { value: new THREE.Vector3(...box) },
      speed: { value: speed },
      size: { value: size },
      uScale: pointScale,
      opacity: { value: 1 },
      uCurveY: curveUniforms.uCurveY,
      uCurveX: curveUniforms.uCurveX,
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      transparent: true,
      depthWrite: false,
      blending: shape >= 2 ? THREE.NormalBlending : THREE.AdditiveBlending,
      defines: {
        MODE: { rain: 0, rise: 1, fall: 2, float: 3 }[mode],
        SHAPE: shape,
      },
      vertexShader: `
        attribute float aPh; attribute vec3 aColor; attribute float aEnd;
        uniform float time, zoff, speed, size, uScale, opacity, uCurveY, uCurveX; uniform vec3 box;
        varying vec3 vC; varying float vA; varying float vRot; varying float vFlip;
        void main(){
          vec3 p = position;
          float t = time * speed;
          #if MODE == 0
            p.y = mod(p.y - t * 18.0, box.y);
            p.z = mod(p.z + zoff, box.z) - box.z * 0.85;
            p += aEnd * vec3(0.0, 0.9, -0.35);
            vA = 0.35;
          #elif MODE == 1
            p.y = mod(p.y + t * (0.6 + fract(aPh) * 0.8), box.y);
            p.x += sin(time * 0.7 + aPh) * 1.5;
            p.z = mod(p.z + zoff, box.z) - box.z * 0.85;
            #if SHAPE == 6
              vA = (0.85 + 0.15 * sin(time * 2.0 + aPh * 3.0)) * smoothstep(box.y, box.y * 0.75, p.y) * smoothstep(0.0, 5.0, p.y);
              p.y += 3.0;
            #elif SHAPE == 7
              p.x += sin(time * 0.9 + aPh * 2.0) * 0.8;
              vA = smoothstep(0.0, 1.5, p.y) * smoothstep(box.y, box.y * 0.7, p.y);
              p.y += 0.6;
            #else
              vA = (0.5 + 0.5 * sin(time * 6.0 + aPh * 3.0)) * smoothstep(box.y, box.y * 0.6, p.y);
            #endif
          #elif MODE == 2
            p.y = mod(p.y - t * (0.5 + fract(aPh) * 0.5), box.y);
            p.x += sin(time * 0.9 + aPh) * 2.0;
            p.z = mod(p.z + zoff + sin(time * 0.5 + aPh) * 2.0, box.z) - box.z * 0.85;
            vA = 0.9;
          #else
            p.y = mod(p.y, box.y * 0.4) + 0.5 + sin(time * 0.8 + aPh) * 0.6;
            p.x += sin(time * 0.4 + aPh * 2.0) * 2.0;
            p.z = mod(p.z + zoff, box.z) - box.z * 0.85;
            vA = pow(0.5 + 0.5 * sin(time * 2.5 + aPh * 5.0), 3.0);
          #endif
          vA *= opacity;
          vRot = time * (0.5 + fract(aPh * 7.0)) + aPh;
          vFlip = sin(time * (1.4 + fract(aPh * 3.0) * 1.8) + aPh * 5.0);   // the petal turning edge-on as it tumbles
          vC = aColor;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          ${CURVE_GLSL}
          gl_Position = projectionMatrix * mvPosition;
          #if SHAPE >= 2
            gl_PointSize = min(size * uScale / max(-mvPosition.z, 0.5), 40.0);
          #else
            gl_PointSize = min(size * uScale / max(-mvPosition.z, 0.5), 14.0);
          #endif
        }`,
      fragmentShader: `
        varying vec3 vC; varying float vA; varying float vRot; varying float vFlip;
        void main(){
          #if MODE == 0
            gl_FragColor = vec4(vC * vA, vA);
          #elif SHAPE == 2
            vec2 q = gl_PointCoord - 0.5;
            float c = cos(vRot), s = sin(vRot);
            q = mat2(c, -s, s, c) * q;
            float fl = max(abs(vFlip), 0.2);
            q.x /= fl;
            // obovate petal: narrow at the base, round at the top with the little notch of a cherry petal
            float rx = 0.25 * mix(0.3, 1.0, smoothstep(-0.46, 0.1, q.y));
            float e = length(vec2(q.x / rx, (q.y - 0.02) / 0.43));
            float notch = length(vec2(q.x, q.y - 0.47)) / 0.12;
            float a = smoothstep(1.0, 0.8, e) * smoothstep(0.8, 1.1, notch) * vA;
            if (a < 0.02) discard;
            vec3 col = vC * mix(vec3(1.0, 0.72, 0.82), vec3(1.0), smoothstep(-0.42, 0.25, q.y));
            col *= 0.7 + 0.4 * fl;
            gl_FragColor = vec4(col, a);
          #elif SHAPE == 3
            vec2 q = gl_PointCoord - 0.5;
            float c = cos(vRot), s = sin(vRot);
            q = mat2(c, -s, s, c) * q;
            float fl = max(abs(vFlip), 0.2);
            q.x /= fl;
            // fan opening from the stem, with the notch in the middle of its outer edge
            vec2 p = q - vec2(0.0, -0.26);
            float rho = length(p), th = atan(p.x, p.y);
            float fan = (1.0 - smoothstep(0.92, 1.0, abs(th))) * (1.0 - smoothstep(0.5, 0.56, rho)) * step(0.0, p.y + 0.02);
            float notch = 1.0 - (1.0 - smoothstep(0.03, 0.07, abs(th))) * smoothstep(0.36, 0.44, rho);
            float stem = (1.0 - smoothstep(0.012, 0.03, abs(q.x))) * step(-0.46, q.y) * step(q.y, -0.25);
            float a = max(fan * notch, stem) * vA;
            if (a < 0.02) discard;
            vec3 col = vC * mix(0.78, 1.06, smoothstep(0.0, 0.5, rho)) * (0.7 + 0.4 * fl);
            gl_FragColor = vec4(col, a);
          #elif SHAPE == 4
            vec2 q = gl_PointCoord - 0.5;
            float c = cos(vRot), s = sin(vRot);
            q = mat2(c, -s, s, c) * q;
            float fl = max(abs(vFlip), 0.25);
            q.x /= fl;
            float rr = length(q), edge = 0.3 + 0.1 * cos(5.0 * atan(q.y, q.x));
            float a = (1.0 - smoothstep(edge - 0.05, edge, rr)) * vA;
            if (a < 0.02) discard;
            vec3 col = vC * mix(0.55, 1.08, smoothstep(0.03, 0.22, rr)) * (0.7 + 0.4 * fl);
            gl_FragColor = vec4(col, a);
          #elif SHAPE == 6
            vec2 q = gl_PointCoord - 0.5;
            // the paper body: a rounded trapezoid, broad at the top, the burner glowing in its open mouth
            float yy = q.y + 0.04;
            float hw = mix(0.25, 0.16, smoothstep(-0.32, 0.3, yy));
            float body = (1.0 - smoothstep(hw - 0.03, hw, abs(q.x))) * (1.0 - smoothstep(0.3, 0.34, abs(yy)));
            float flame = smoothstep(0.11, 0.0, length(q - vec2(0.0, 0.27)));
            float a = max(body * 0.92, flame) * vA;
            if (a < 0.02) discard;
            gl_FragColor = vec4(vC * mix(1.25, 0.7, smoothstep(0.3, -0.3, yy)) + vec3(1.0, 0.85, 0.5) * flame * 1.5, a);
          #elif SHAPE == 7
            vec2 q = gl_PointCoord - 0.5;
            float r = length(q);
            // a soap bubble: a thin iridescent rim, a faint film, the window highlight up on one side
            float rim = smoothstep(0.34, 0.46, r) * (1.0 - smoothstep(0.46, 0.5, r));
            float film = (1.0 - smoothstep(0.44, 0.5, r)) * 0.08;
            float hl = smoothstep(0.1, 0.0, length(q - vec2(-0.16, -0.17)));
            float a = (rim * 0.75 + film + hl * 0.9) * vA;
            if (a < 0.01) discard;
            float th = atan(q.y, q.x) + vRot * 0.6;
            vec3 iri = 0.6 + 0.4 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + th / 6.2832 + r * 1.5));
            gl_FragColor = vec4(mix(vC * iri, vec3(1.0), hl), a);
          #elif SHAPE == 5
            vec2 q = gl_PointCoord - 0.5;
            float c = cos(vRot * 0.4), s = sin(vRot * 0.4);
            q = mat2(c, -s, s, c) * q;
            q.x /= max(abs(vFlip), 0.45);
            // six arms, each with two pairs of side branches, over a soft core so a distant flake still reads as a dot
            float rr = length(q), th = atan(q.y, q.x);
            float th6 = mod(th + 0.5236, 1.0472) - 0.5236;
            vec2 p = rr * vec2(cos(th6), abs(sin(th6)));
            float d = max(p.y - 0.028, max(p.x - 0.42, -p.x));
            for (int i = 0; i < 2; i++) {
              vec2 bp = p - vec2(0.17 + 0.11 * float(i), 0.0);
              float t = clamp(dot(bp, vec2(0.5, 0.866)), 0.0, 0.12 - 0.035 * float(i));
              d = min(d, length(bp - vec2(0.5, 0.866) * t) - 0.02);
            }
            float a = max(1.0 - smoothstep(0.0, 0.03, d), smoothstep(0.17, 0.0, rr) * 0.85) * vA;
            if (a < 0.02) discard;
            gl_FragColor = vec4(vC * (0.85 + 0.3 * smoothstep(0.3, 0.0, rr)), a);
          #else
            vec2 q = gl_PointCoord - 0.5;
            #if SHAPE == 1
              float c = cos(vRot), s = sin(vRot);
              q = mat2(c, -s, s, c) * q;
              q.x *= 2.2;
            #endif
            float a = smoothstep(0.5, 0.1, length(q)) * vA;
            if (a < 0.01) discard;
            gl_FragColor = vec4(vC * a, a);
          #endif
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
        }`,
    });
    this.obj = isRain
      ? new THREE.LineSegments(g, mat)
      : new THREE.Points(g, mat);
    this.obj.frustumCulled = false;
  }
  update(dt, time, speed, cam) {
    this.u.time.value = time;
    this.u.zoff.value += speed * dt;
    this.obj.position.set(cam.position.x, 0, cam.position.z);
  }
}

// ---------- speed lines ----------
export class SpeedLines {
  constructor(count = 160) {
    const pos = new Float32Array(count * 6),
      ph = new Float32Array(count * 2),
      base = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2,
        r = rand(2.8, 9);
      const x = Math.cos(a) * r,
        y = Math.sin(a) * r * 0.7 + 2.5;
      pos.set([x, y, 0, x, y, rand(3, 8)], i * 6);
      ph[i * 2] = ph[i * 2 + 1] = Math.random();
      base[i * 2] = base[i * 2 + 1] = Math.random() * 80;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
    g.setAttribute("aBase", new THREE.BufferAttribute(base, 1));
    this.u = {
      zoff: { value: 0 },
      opacity: { value: 0 },
      color: { value: new THREE.Color(1.6, 1.8, 2.2) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `attribute float aPh; attribute float aBase; uniform float zoff; varying float vA;
        void main(){ vec3 p = position;
          float z0 = mod(aBase + zoff * (1.5 + aPh), 80.0) - 70.0;
          p.z = z0 + position.z;
          vA = smoothstep(-70.0, -40.0, z0) * smoothstep(8.0, 0.0, z0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform float opacity; uniform vec3 color; varying float vA; void main(){ float a = vA * opacity; gl_FragColor = vec4(color * a, a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`,
    });
    this.obj = new THREE.LineSegments(g, mat);
    this.obj.frustumCulled = false;
  }
  update(dt, speed, target, cam) {
    this.u.zoff.value += speed * dt;
    this.u.opacity.value +=
      (target - this.u.opacity.value) * Math.min(1, dt * 4);
    this.obj.visible = this.u.opacity.value > 0.01;
    this.obj.position.set(cam.position.x, cam.position.y - 3, cam.position.z);
  }
}

// ---------- ribbon light trail ----------
export class Trail {
  constructor(color = "#00e5ff", len = 22, width = 0.09, k = 1.3) {
    this.len = len;
    this.width = width;
    this.pts = Array.from({ length: len }, () => new THREE.Vector3());
    this.ready = false;
    const n = len * 2;
    this.pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 4);
    const c = new THREE.Color(color).multiplyScalar(k);
    for (let i = 0; i < len; i++) {
      const a = Math.pow(1 - i / (len - 1), 1.6) * 0.85;
      for (let s = 0; s < 2; s++) col.set([c.r, c.g, c.b, a], (i * 2 + s) * 4);
    }
    const idx = [];
    for (let i = 0; i < len - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      (this.aPos = new THREE.BufferAttribute(this.pos, 3)),
    );
    g.setAttribute("color", (this.aCol = new THREE.BufferAttribute(col, 4)));
    g.setIndex(idx);
    this.aPos.setUsage(THREE.DynamicDrawUsage);
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false,
    });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uCurveY = curveUniforms.uCurveY;
      sh.uniforms.uCurveX = curveUniforms.uCurveX;
      sh.vertexShader =
        "uniform float uCurveY;\nuniform float uCurveX;\n" +
        sh.vertexShader.replace(
          "#include <project_vertex>",
          `vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);\n${CURVE_GLSL}\ngl_Position = projectionMatrix * mvPosition;`,
        );
    };
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.frustumCulled = false;
  }
  setColor(color, k = 1.3) {
    const c = new THREE.Color(color).multiplyScalar(k);
    for (let i = 0; i < this.len * 2; i++) {
      this.aCol.setXYZ(i, c.r, c.g, c.b);
    }
    this.aCol.needsUpdate = true;
  }
  reset(p) {
    this.pts.forEach((v) => v.copy(p));
    this.ready = true;
  }
  update(p) {
    if (!this.ready) this.reset(p);
    for (let i = this.len - 1; i > 0; i--) this.pts[i].copy(this.pts[i - 1]);
    this.pts[0].copy(p);
    for (let i = 0; i < this.len; i++) {
      const v = this.pts[i],
        w = this.width * (1 - i / this.len);
      this.pos.set([v.x, v.y - w, v.z, v.x, v.y + w, v.z], i * 6);
    }
    this.aPos.needsUpdate = true;
  }
}

// ---------- post FX (vignette, chromatic aberration, radial speed blur, flash) ----------
export const FXShader = {
  uniforms: {
    tDiffuse: { value: null },
    uAberr: { value: 0.002 },
    uVignette: { value: 0.55 },
    uBlur: { value: 0 },
    uFlash: { value: 0 },
    uFlashColor: { value: new THREE.Color(1, 1, 1) },
    uTint: { value: new THREE.Color(1, 1, 1) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uAberr, uVignette, uBlur, uFlash; uniform vec3 uFlashColor, uTint;
    varying vec2 vUv;
    void main(){
      vec2 c = vUv - 0.5; float r = length(c);
      vec2 off = c * uAberr * (0.5 + r * 2.0);
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      if (uBlur > 0.001) {
        vec3 acc = col;
        for (int i = 1; i < 7; i++) acc += texture2D(tDiffuse, vUv - c * uBlur * float(i) * 0.018).rgb;
        col = mix(col, acc / 7.0, smoothstep(0.12, 0.55, r));
      }
      col *= uTint;
      col *= 1.0 - uVignette * smoothstep(0.3, 0.95, r);
      col = mix(col, uFlashColor, clamp(uFlash, 0.0, 1.0));
      gl_FragColor = vec4(col, 1.0);
    }`,
};

// ---------- fireworks: shells bursting into falling, twinkling sparks over the distant skyline ----------
export class Fireworks {
  // curved: true bends it with the world (for shells bursting over a chunk rather than over the distant skyline)
  constructor({
    shells = 8,
    sparks = 110,
    center = [0, 150, -820],
    spread = [560, 80, 160],
    radius = [50, 90],
    period = [3.4, 6],
    life = 2.6,
    colors = [
      "#ff3a5a",
      "#ffd23d",
      "#3dfff0",
      "#b26bff",
      "#39ff88",
      "#ffffff",
      "#ff9a3a",
    ],
    curved = false,
  } = {}) {
    const n = shells * sparks;
    const dir = new Float32Array(n * 3),
      shell = new Float32Array(n * 4),
      col = new Float32Array(n * 3),
      misc = new Float32Array(n * 2);
    let i = 0;
    for (let s = 0; s < shells; s++) {
      const cx = center[0] + rand(-0.5, 0.5) * spread[0],
        cy = center[1] + rand(-0.5, 0.5) * spread[1],
        cz = center[2] + rand(-0.5, 0.5) * spread[2];
      const ph = rand(0, 20),
        per = rand(...period),
        rad = rand(...radius);
      const c1 = new THREE.Color(pick(colors)),
        c2 = new THREE.Color(pick(colors));
      for (let k = 0; k < sparks; k++, i++) {
        const u = Math.random() * 2 - 1,
          a = Math.random() * Math.PI * 2,
          r = Math.sqrt(1 - u * u),
          cc = Math.random() < 0.25 ? c2 : c1;
        dir.set([r * Math.cos(a), u, r * Math.sin(a)], i * 3);
        shell.set([cx, cy, cz, ph], i * 4);
        col.set([cc.r, cc.g, cc.b], i * 3);
        misc.set([per, rad * rand(0.85, 1.05)], i * 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(n * 3), 3),
    );
    g.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));
    g.setAttribute("aShell", new THREE.BufferAttribute(shell, 4));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aMisc", new THREE.BufferAttribute(misc, 2));
    this.u = {
      time: { value: 0 },
      uScale: pointScale,
      life: { value: life },
      uCurveY: curveUniforms.uCurveY,
      uCurveX: curveUniforms.uCurveX,
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute vec3 aDir; attribute vec4 aShell; attribute vec3 aColor; attribute vec2 aMisc;
        uniform float time, uScale, life, uCurveY, uCurveX;
        varying vec3 vC; varying float vA;
        void main(){
          float age = mod(time + aShell.w, aMisc.x);
          float t = clamp(age / life, 0.0, 1.0);
          vec3 p = aShell.xyz + aDir * aMisc.y * (1.0 - exp(-age * 2.8)) - vec3(0.0, 9.0 * age * age, 0.0);
          vA = (1.0 - t) * (1.0 - t) * step(age, life) * (0.65 + 0.35 * sin(time * 37.0 + aDir.x * 61.0 + aDir.z * 23.0));
          vC = aColor * (1.0 + 2.0 * exp(-age * 6.0));
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          float pz = -mvPosition.z;
          ${curved ? CURVE_GLSL : ""}
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = clamp(3.2 * uScale / max(pz, 1.0) * (1.3 - 0.7 * t), 1.0, 7.0);
        }`,
      fragmentShader: `
        varying vec3 vC; varying float vA;
        void main(){
          float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vA;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vC * a * 1.6, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.obj = new THREE.Points(g, mat);
    this.obj.frustumCulled = false;
    this.obj.renderOrder = -4;
  }
  update(t) {
    this.u.time.value = t;
  }
}

// ---------- a curtain of sparks pouring off an edge (the bridge's firework waterfall); lives in the curved world ----------
export class SparkCurtain {
  constructor({
    x = 0,
    z0 = 0,
    z1 = -80,
    y = 0,
    drop = 40,
    count = 700,
    color = "#ffd88a",
    k = 2.2,
  } = {}) {
    const pos = new Float32Array(count * 3),
      ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos.set([x + rand(-0.4, 0.4), y, rand(z1, z0)], i * 3);
      ph[i] = Math.random() * 100;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
    this.u = {
      time: { value: 0 },
      uScale: pointScale,
      drop: { value: drop },
      color: { value: new THREE.Color(color).multiplyScalar(k) },
      uCurveY: curveUniforms.uCurveY,
      uCurveX: curveUniforms.uCurveX,
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aPh; uniform float time, uScale, drop, uCurveY, uCurveX;
        varying float vA;
        void main(){
          float f = mod(time * (6.0 + fract(aPh) * 5.0) + aPh * 3.0, drop);
          vec3 p = position - vec3(0.0, f, 0.0);
          vA = (1.0 - f / drop) * (0.6 + 0.4 * sin(time * 30.0 + aPh * 17.0));
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          ${CURVE_GLSL}
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = clamp(0.6 * uScale / max(-mvPosition.z, 1.0), 1.5, 14.0);
        }`,
      fragmentShader: `
        uniform vec3 color; varying float vA;
        void main(){
          float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vA;
          if (a < 0.01) discard;
          gl_FragColor = vec4(color * a, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.obj = new THREE.Points(g, mat);
    this.obj.frustumCulled = false;
  }
  update(t) {
    this.u.time.value = t;
  }
}

// ---------- flying foxes: bat silhouettes flapping slowly across the night sky ----------
export class Flock {
  constructor({
    count = 36,
    center = [0, 70, -380],
    spread = [700, 60, 260],
    speed = 9,
    size = 7,
  } = {}) {
    const pos = new Float32Array(count * 3),
      ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos.set(
        [
          center[0] + rand(-0.5, 0.5) * spread[0],
          center[1] + rand(-0.5, 0.5) * spread[1],
          center[2] + rand(-0.5, 0.5) * spread[2],
        ],
        i * 3,
      );
      ph[i] = Math.random() * 100;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
    this.u = {
      time: { value: 0 },
      uScale: pointScale,
      span: { value: spread[0] },
      speed: { value: speed },
      size: { value: size },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      transparent: true,
      depthWrite: false,
      vertexShader: `
        attribute float aPh; uniform float time, uScale, span, speed, size;
        varying float vPh;
        void main(){
          vec3 p = position;
          p.x = mod(p.x + span * 0.5 + time * speed * (0.8 + fract(aPh) * 0.4), span) - span * 0.5;
          p.y += sin(time * 0.7 + aPh) * 6.0;
          vPh = aPh;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(size * uScale / max(-mv.z, 1.0), 2.0, 26.0);
        }`,
      fragmentShader: `
        uniform float time; varying float vPh;
        void main(){
          vec2 q = gl_PointCoord - 0.5; q.y = -q.y;
          float flap = sin(time * 7.0 + vPh * 3.0), wx = abs(q.x);
          float top = 0.05 + flap * 0.22 * wx;
          float wing = step(wx, 0.48) * step(top - 0.09 - 0.05 * abs(sin(wx * 28.0)), q.y) * step(q.y, top);
          float body = step(length(q / vec2(0.07, 0.15)), 1.0);
          float a = max(wing, body) * 0.92;
          if (a < 0.01) discard;
          gl_FragColor = vec4(0.03, 0.025, 0.05, a);
        }`,
    });
    this.obj = new THREE.Points(g, mat);
    this.obj.frustumCulled = false;
    this.obj.renderOrder = -3;
  }
  update(t) {
    this.u.time.value = t;
  }
}
