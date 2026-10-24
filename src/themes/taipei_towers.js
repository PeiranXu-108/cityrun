import { THREE, curveUniforms, CURVE_GLSL, rand } from '../core.js';

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
