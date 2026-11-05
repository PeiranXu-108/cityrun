// The Qianjiang light show (钱江新城灯光秀): the towers along both banks of the Qiantang become one screen and play the
// same picture together, a program at a time: 最忆是杭州 in gold on red, the tide rolling from tower to tower, lotus,
// West Lake in blue ink (Leifeng Pagoda, the Broken Bridge, the Three Pools, the moon), koi, fireworks, each wiped into
// the next by a sweep of white light. The pictures are painted once into an atlas; every facade and the reflections
// streaking across the river read the same clock, so the whole city changes at once.
//
// A show surface carries its tower in the vertex colour (the Batcher bakes it): r = where the face starts along the
// picture (one picture spans a chunk, 80 m wide and 40 m high, so neighbouring chunks join up; it repeats up a tall
// tower), g = brightness, b = the face's width as a fraction of the picture. 最忆是杭州 runs down every tower instead,
// a square character to each storey band as wide as the face.
import { THREE, canvasTex, curveUniforms, CURVE_GLSL, CHUNK_LEN, rand, pick } from '../core.js';

export const SHOW_GLYPHS = '最忆是杭州';
const CN = '"Ma Shan Zheng", "STKaiti", "KaiTi", serif';
const PW = 512, PH = 256, N = 6;
export const PIC_W = CHUNK_LEN;   // metres of towers one picture spans (and twice its height)

function paintPrograms() {
  return canvasTex(PW, PH * N, (g) => {
    const band = (i, draw) => { g.save(); g.translate(0, i * PH); g.beginPath(); g.rect(0, 0, PW, PH); g.clip(); draw(); g.restore(); };
    const grad = (c0, c1) => { const gr = g.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, 0, PW, PH); };
    // 0 最忆是杭州: five square characters side by side across the middle (the shader stacks them down a tower), on red
    band(0, () => {
      grad('#c8141e', '#ff5a14');
      for (let k = 0; k < 140; k++) { g.fillStyle = `rgba(255,215,120,${rand(0.2, 0.7)})`; g.fillRect(rand(0, PW), rand(0, PH), 2, 2); }
      g.font = `900 84px ${CN}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      [...'最忆是杭州'].forEach((c, k) => {
        const x = ((k + 0.5) * PW) / 5;
        g.shadowColor = '#ffd27a'; g.shadowBlur = 14; g.fillStyle = '#fff2c0'; g.fillText(c, x, PH / 2 + 4);
        g.shadowBlur = 0; g.strokeStyle = 'rgba(255,230,160,0.6)'; g.lineWidth = 2; g.strokeRect(x - 47, PH / 2 - 47, 94, 94);
      });
    });
    // 1 钱江潮: the tidal bore, a white-crested wall of water rolling in from the sea over deep blue
    band(1, () => {
      grad('#02122e', '#0a3a6e');
      const crest = (x) => PH * 0.4 + Math.sin(x * 0.022) * PH * 0.1 + Math.sin(x * 0.07 + 1) * PH * 0.035;
      const water = g.createLinearGradient(0, PH * 0.3, 0, PH); water.addColorStop(0, '#2ad4ff'); water.addColorStop(1, '#064a8a');
      g.fillStyle = water; g.beginPath(); g.moveTo(0, PH);
      for (let x = 0; x <= PW; x += 4) g.lineTo(x, crest(x));
      g.lineTo(PW, PH); g.closePath(); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.shadowColor = '#bff4ff'; g.shadowBlur = 14;
      g.beginPath(); for (let x = 0; x <= PW; x += 4) g.lineTo(x, crest(x)); g.stroke();
      g.shadowBlur = 0;
      for (let k = 0; k < 360; k++) { const x = rand(0, PW), y = crest(x) - rand(-8, 34); g.fillStyle = `rgba(235,252,255,${rand(0.4, 1)})`; g.beginPath(); g.arc(x, y, rand(1, 3.6), 0, 7); g.fill(); }
      for (let k = 0; k < 12; k++) { g.strokeStyle = 'rgba(160,230,255,0.35)'; g.lineWidth = 3; g.beginPath(); const y0 = PH * 0.6 + k * 8; for (let x = 0; x <= PW; x += 8) g.lineTo(x, y0 + Math.sin(x * 0.05 + k) * 4); g.stroke(); }
    });
    // 2 荷: pink lotus flowers among round leaves on dark teal
    band(2, () => {
      grad('#032a30', '#06484a');
      for (let k = 0; k < 16; k++) { g.fillStyle = pick(['#1f7a40', '#2f8a4a', '#3aa058', '#256e3a']); g.beginPath(); g.ellipse(rand(0, PW), rand(PH * 0.55, PH), rand(30, 52), rand(12, 22), rand(-0.3, 0.3), 0, 7); g.fill(); }
      for (let k = 0; k < 5; k++) {
        const x = ((k + rand(0.25, 0.75)) * PW) / 5, y = rand(PH * 0.3, PH * 0.55), r = rand(30, 42);
        g.strokeStyle = '#2f8a4a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y + 8); g.lineTo(x + rand(-8, 8), PH); g.stroke();
        for (let p = 0; p < 9; p++) {
          const a = -Math.PI / 2 + (p - 4) * 0.36, gr = g.createLinearGradient(x, y, x + Math.cos(a) * r, y + Math.sin(a) * r);
          gr.addColorStop(0, '#fff0f6'); gr.addColorStop(1, '#ff6a9c');
          g.fillStyle = gr; g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.5, r * 0.2, a, 0, 7); g.fill();
        }
        g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill();
      }
    });
    // 3 西湖: West Lake in blue ink, the moon over the hills, Leifeng Pagoda, the Broken Bridge, the Three Pools
    band(3, () => {
      grad('#041a40', '#16508e');
      g.fillStyle = '#fff4d0'; g.shadowColor = '#fff4d0'; g.shadowBlur = 22; g.beginPath(); g.arc(PW * 0.44, PH * 0.2, 20, 0, 7); g.fill(); g.shadowBlur = 0;
      for (const [y0, c, a] of [[0.46, '#2a5a9a', 0.9], [0.56, '#3a74b8', 1.0], [0.64, '#5a94d4', 1.1]]) {
        g.fillStyle = c; g.beginPath(); g.moveTo(0, PH);
        for (let x = 0; x <= PW; x += 8) g.lineTo(x, PH * y0 - Math.abs(Math.sin(x * 0.012 * a + y0 * 9)) * PH * 0.2 - Math.sin(x * 0.04 + y0) * 5);
        g.lineTo(PW, PH); g.closePath(); g.fill();
      }
      g.fillStyle = 'rgba(160,210,255,0.3)'; g.fillRect(0, PH * 0.74, PW, PH * 0.26);
      const px = PW * 0.18, py = PH * 0.62;   // Leifeng Pagoda on its hill, lit gold
      for (let k = 0; k < 5; k++) { const w = 30 - k * 4, y = py - k * 15; g.fillStyle = '#ffd27a'; g.fillRect(px - w / 2, y - 11, w, 11); g.fillStyle = '#3a2a24'; g.fillRect(px - w / 2 - 6, y - 14, w + 12, 4); }
      g.fillStyle = '#ffd27a'; g.fillRect(px - 2, py - 92, 4, 18);
      g.strokeStyle = '#e8f4ff'; g.lineWidth = 5; g.beginPath(); g.ellipse(PW * 0.62, PH * 0.78, 56, 30, 0, Math.PI, 2 * Math.PI); g.stroke();   // the Broken Bridge and its reflection
      g.strokeStyle = 'rgba(232,244,255,0.4)'; g.beginPath(); g.ellipse(PW * 0.62, PH * 0.78, 56, 22, 0, 0, Math.PI); g.stroke();
      g.strokeStyle = '#e8f4ff'; g.lineWidth = 4; g.beginPath(); g.moveTo(PW * 0.62 - 90, PH * 0.78); g.lineTo(PW * 0.62 + 90, PH * 0.78); g.stroke();
      for (const x of [0.8, 0.86, 0.92]) { const cx = PW * x, cy = PH * 0.72; g.fillStyle = '#fff0c0'; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill(); g.fillRect(cx - 2, cy - 18, 4, 11); g.fillRect(cx - 3, cy, 6, 12); }
    });
    // 4 锦鲤: koi on deep water (the shader swims them along)
    band(4, () => {
      grad('#021230', '#04306a');
      for (let k = 0; k < 30; k++) { g.strokeStyle = 'rgba(120,190,255,0.18)'; g.lineWidth = 2; g.beginPath(); g.arc(rand(0, PW), rand(0, PH), rand(10, 34), 0, 7); g.stroke(); }
      for (let k = 0; k < 6; k++) {
        const x = ((k + rand(0.2, 0.8)) * PW) / 6, y = rand(PH * 0.25, PH * 0.75), dir = Math.random() < 0.5 ? -1 : 1, body = pick(['#ff6a1a', '#ffffff', '#ff3a2a', '#ffb02a']);
        g.save(); g.translate(x, y); g.scale(dir, 1); g.rotate(rand(-0.3, 0.3));
        g.fillStyle = body; g.beginPath(); g.ellipse(0, 0, 30, 11, 0, 0, 7); g.fill();
        g.beginPath(); g.moveTo(-24, 0); g.lineTo(-46, -13); g.lineTo(-40, 0); g.lineTo(-46, 13); g.closePath(); g.fill();
        if (body === '#ffffff') { g.fillStyle = '#ff3a1a'; g.beginPath(); g.ellipse(7, -2, 11, 6, 0.3, 0, 7); g.fill(); }
        g.restore();
      }
    });
    // 5 烟花: fireworks bursting over the river (the shader makes them twinkle)
    band(5, () => {
      grad('#03061e', '#0a1640');
      for (let k = 0; k < 7; k++) {
        const x = ((k + rand(0.15, 0.85)) * PW) / 7, y = rand(PH * 0.2, PH * 0.6), r = rand(26, 44), col = pick(['#ffd23d', '#ff5a9a', '#5ae0ff', '#ffffff', '#ff7a2a', '#b07aff', '#7aff8a']);
        g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2;
        for (let s = 0; s < 22; s++) { const a = (s / 22) * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); g.beginPath(); g.arc(x + Math.cos(a) * r * 1.08, y + Math.sin(a) * r * 1.08, 2.2, 0, 7); g.fill(); }
      }
      g.fillStyle = 'rgba(255,240,200,0.12)'; g.fillRect(0, PH * 0.85, PW, PH * 0.15);
    });
  }, { repeat: false });
}

const PROG = `
  uniform sampler2D map; uniform float time;
  const float N = ${N}.0, DUR = 9.0, PICH = ${(PIC_W / 2).toFixed(1)};
  float showHash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  vec3 tap(float i, float u, float v) { return texture2D(map, vec2(fract(u), 1.0 - (i + 1.0 - clamp(v, 0.01, 0.99)) / N)).rgb; }
  // program i at U along the picture, height y (m), on a face wM metres wide, ux across it
  vec3 prog(float i, float U, float y, float wM, float ux) {
    float V = fract(y / PICH);
    if (i < 0.5) { float cell = max(wM, 8.0), row = floor(y / cell); return tap(0.0, (mod(-row, 5.0) + ux) / 5.0, 0.3 + 0.4 * fract(y / cell)); }
    if (i < 1.5) return tap(1.0, U - time * 0.05, V);                                     // the tide rolls along the bank
    if (i < 3.5) return tap(i, U, V);
    if (i < 4.5) return tap(4.0, U + time * 0.03, V + 0.03 * sin(time * 1.3 + U * 9.0));   // the koi swim
    return tap(5.0, U, V) * (0.55 + 0.9 * showHash(floor(vec2(U * 240.0, V * 60.0)) + floor(time * 7.0)));   // twinkling bursts
  }
  // the picture now, with the next one swept in by a band of white light near the end of each program
  vec3 showAt(float U, float y, float wM, float ux) {
    float t = time / DUR, f = fract(t), cur = mod(floor(t), N), nxt = mod(cur + 1.0, N);
    vec3 col = prog(cur, U, y, wM, ux);
    float w = clamp((f - 0.88) / 0.12, 0.0, 1.0);
    if (w > 0.0) {
      float s = fract(U) * 0.75 + fract(y / PICH) * 0.25, e = w * 1.3 - 0.15;
      if (s < e) col = prog(nxt, U, y, wM, ux);
      col += vec3(1.0, 0.96, 0.9) * (1.0 - smoothstep(0.0, 0.06, abs(s - e))) * 1.6;
    }
    return col;
  }`;

function uniforms(extra) {
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, extra]);
  u.uCurveY = curveUniforms.uCurveY; u.uCurveX = curveUniforms.uCurveX;
  return u;
}

export function makeShow() {
  const tex = paintPrograms();
  tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;
  const time = { value: 0 };
  // a facade screen in the street: curved with the world, thinned fog so the far bank still shines, an LED grain of
  // dark floor lines every 3.6 m and window mullions
  const facade = ({ fogK = 0.5, k = 1.0, floorH = 3.6 } = {}) => {
    const u = uniforms({ time: { value: 0 }, k: { value: k } });
    u.time = time; u.map = { value: tex };
    return new THREE.ShaderMaterial({
      uniforms: u, vertexColors: true, fog: true,
      vertexShader: `uniform float uCurveY, uCurveX; varying vec2 vUv; varying vec3 vC; varying float vY;
        #include <fog_pars_vertex>
        void main(){ vUv = uv; vC = color; vY = position.y; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); ${CURVE_GLSL}
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `${PROG}
        uniform float k; varying vec2 vUv; varying vec3 vC; varying float vY;
        #include <fog_pars_fragment>
        void main(){
          float wM = vC.b * ${PIC_W.toFixed(1)}, U = vC.r + vUv.x * vC.b;
          vec3 col = showAt(U, vY, wM, vUv.x);
          float led = (0.7 + 0.3 * step(0.16, fract(vY / ${floorH.toFixed(1)}))) * (0.86 + 0.14 * step(0.1, fract(vUv.x * wM / 1.6)));
          gl_FragColor = vec4((col * 0.92 + 0.035) * led * k * vC.g, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #ifdef USE_FOG
            gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vFogDepth) * ${fogK.toFixed(2)});
          #endif
        }`,
    });
  };
  // the show's light on the water: an additive streak lying from a tower's foot toward the runner, its colour the
  // middle of that tower's slice of the picture, broken by ripples
  const refl = (() => {
    const u = uniforms({ time: { value: 0 }, k: { value: 1.8 } });
    u.time = time; u.map = { value: tex };
    return new THREE.ShaderMaterial({
      uniforms: u, vertexColors: true, fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `uniform float uCurveY, uCurveX; varying vec2 vUv; varying vec3 vC;
        void main(){ vUv = uv; vC = color; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); ${CURVE_GLSL} gl_Position = projectionMatrix * mvPosition; }`,
      fragmentShader: `${PROG}
        uniform float k; varying vec2 vUv; varying vec3 vC;
        void main(){
          float wM = vC.b * ${PIC_W.toFixed(1)}, U = vC.r + 0.5 * vC.b;
          vec3 c = 0.5 * (showAt(U, 8.0, wM, 0.5) + showAt(U, 22.0, wM, 0.5));
          float along = vUv.y, across = 1.0 - abs(vUv.x * 2.0 - 1.0);
          float ripple = 0.5 + 0.5 * sin(along * 70.0 - time * 2.6 + vC.r * 31.0) * sin(vUv.x * 7.0 + along * 17.0 + time * 0.9);
          float a = pow(across, 1.6) * pow(1.0 - along, 0.7) * smoothstep(0.0, 0.06, along) * ripple * vC.g * k;
          gl_FragColor = vec4(c * a, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
  })();
  const S = {
    tex, time,
    street: facade({ fogK: 0.55 }),           // towers along the near bank and in the scenes
    far: facade({ fogK: 0.3, k: 1.05 }),      // the far bank across the river
    hero: facade({ fogK: 0.35, k: 1.15 }),    // the light-show scene, at full brightness
    refl,
    // a tower face's baked data: where it starts along the picture (m), its brightness, its width (m)
    tint: (startM, bright, widthM) => new THREE.Color(((startM / PIC_W) % 1 + 1) % 1, bright, widthM / PIC_W),
    update(t) { time.value = t; },
  };
  return S;
}
