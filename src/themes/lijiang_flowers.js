// Additive flower dressing for Lijiang. Eight distinct flower silhouettes share
// one atlas and one wind-sway material; pots and beds share a second material.
import { THREE, Batcher, G, std, canvasTex, foliageMat, planeUV } from '../core.js';
import { EDGE } from './common.js';

export const FLOWER_SPECIES = ['月季', '绣球', '雏菊', '向日葵', '薰衣草', '郁金香', '天竺葵', '万寿菊'];
const TAU = Math.PI * 2;
// Flower placement never calls the gameplay random helpers.
const variation = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const facades = new WeakMap();
export function rememberFlowerFacade(b, x, z, len, side, y = 0, village = false) {
  if (!facades.has(b)) facades.set(b, []);
  facades.get(b).push({ x, z, len, side, y, village });
}

function flowerAtlas() {
  return canvasTex(1024, 512, (g) => {
    const ellipse = (x, y, rx, ry, a, col) => {
      g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); g.fill();
    };
    const petals = (x, y, n, radius, size, col, phase = 0) => {
      for (let k = 0; k < n; k++) {
        const a = k * TAU / n + phase;
        ellipse(x + Math.cos(a) * radius, y + Math.sin(a) * radius, size, size * 0.55, a, col);
      }
    };
    const bloom = (type, x, y, s, seed) => {
      if (type === 0) { // layered rose rosettes
        for (let k = 3; k > 0; k--) petals(x, y, 7, s * k * 0.26, s * k * 0.24,
          ['#ffb9ce', '#ff759e', '#db3267'][k - 1], k * 0.37);
        ellipse(x, y, s * 0.18, s * 0.14, 0, '#96314f');
      } else if (type === 1) { // rounded heads of little four-petal hydrangea florets
        for (let k = 0; k < 19; k++) {
          const a = k * 2.4, r = Math.sqrt(k / 19) * s;
          const xx = x + Math.cos(a) * r, yy = y + Math.sin(a) * r * 0.82;
          petals(xx, yy, 4, s * 0.12, s * 0.16, ['#b5a7ff', '#8dbbff', '#e4ccff'][k % 3], a);
          ellipse(xx, yy, s * 0.035, s * 0.035, 0, '#fff7c2');
        }
      } else if (type === 2 || type === 3) {
        petals(x, y, type === 2 ? 12 : 15, s * 0.62, s * 0.42, type === 2 ? '#fff9ed' : '#ffcf35', seed);
        ellipse(x, y, s * 0.36, s * 0.36, 0, type === 2 ? '#ffc52d' : '#603522');
        if (type === 3) for (let k = 0; k < 16; k++) {
          const a = k * 2.4, r = Math.sqrt(k / 16) * s * 0.29;
          ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, s * 0.035, s * 0.035, 0, '#c79a4c');
        }
      } else if (type === 4) { // upright lavender spires
        for (let k = 0; k < 8; k++) for (const sign of [-1, 1])
          ellipse(x + sign * s * (0.28 - k * 0.025), y - k * s * 0.25,
            s * (0.28 - k * 0.02), s * 0.17, sign * 0.5, k % 2 ? '#c7a3ff' : '#9363dc');
      } else if (type === 5) { // cupped tulips with pointed overlapping petals
        const col = ['#ff658a', '#ffb145', '#f18bd2'][seed % 3];
        for (let k = -1; k <= 1; k++) {
          g.fillStyle = k ? col : '#ffc2cd'; g.beginPath();
          g.moveTo(x, y + s * 0.8); g.bezierCurveTo(x - s * 1.1, y + s * 0.4, x + k * s * 0.8 - s * 0.45, y - s, x + k * s * 0.65, y - s * 0.75);
          g.bezierCurveTo(x + s * 0.9, y - s * 0.6, x + s, y + s * 0.6, x, y + s * 0.8); g.fill();
        }
      } else if (type === 6) {
        for (let k = 0; k < 7; k++) {
          const a = k * 2.4, r = Math.sqrt(k / 7) * s * 0.7;
          petals(x + Math.cos(a) * r, y + Math.sin(a) * r, 5, s * 0.19, s * 0.22, k % 2 ? '#ff657e' : '#ffafba', a);
        }
      } else {
        for (let k = 3; k > 0; k--) petals(x, y, 13, s * k * 0.22, s * 0.29,
          ['#ffdf67', '#ffb42c', '#f17a20'][k - 1], k * 0.27);
      }
    };
    for (let type = 0; type < 8; type++) {
      g.save(); g.translate((type % 4) * 256, Math.floor(type / 4) * 256);
      const count = [6, 3, 8, 3, 9, 5, 5, 7][type];
      for (let k = 0; k < count; k++) {
        const seed = type * 53 + k * 7;
        const x = 42 + variation(seed) * 172, y = 53 + variation(seed + 1) * 106;
        const size = [22, 36, 16, 29, 14, 24, 26, 20][type];
        g.strokeStyle = '#447b3c'; g.lineWidth = type === 3 ? 5 : 3;
        g.beginPath(); g.moveTo(128 + (x - 128) * 0.32, 245); g.quadraticCurveTo(x - 9, 165, x, y); g.stroke();
        for (const sign of [-1, 1]) ellipse(x + sign * 12, y + 45 + sign * 11,
          type === 5 ? 25 : 17, type === 4 ? 3 : 7, sign * -0.6, sign > 0 ? '#72a65a' : '#3b793f');
        bloom(type, x, y, size, seed);
      }
      g.restore();
    }
  }, { repeat: false });
}

let shared;
function kit() {
  if (shared) return shared;
  const plantMat = foliageMat(flowerAtlas(), { sway: 0.07, emissive: 0.28, alphaTest: 0.36 });
  plantMat.name = 'Lijiang flowers: eight species';
  const potMat = std({ vertexColors: true, roughness: 0.9, metalness: 0 });
  potMat.name = 'Lijiang flowers: planters';
  const cards = FLOWER_SPECIES.map((_, i) => {
    const u = (i % 4) / 4, v = 1 - Math.floor(i / 4) / 2;
    const geo = planeUV({u0: u + 0.002, u1: u + 0.248, v0: v - 0.498, v1: v - 0.002});
    geo.setAttribute('aSway', new THREE.Float32BufferAttribute([1, 1, 0, 0], 1));
    return geo;
  });
  const potGeo = new THREE.CylinderGeometry(0.5, 0.35, 1, 8);
  const plant = (b, x, y, z, type, size = 1, seed = 0, width = size) => {
    const a = variation(seed + x * 3 + z) * Math.PI;
    for (const angle of [a, a + Math.PI / 2])
      b.add(cards[type % 8], plantMat, x, y + size * 0.5, z, width, size, 1, 0, angle, 0, '#ffffff');
  };
  const pot = (b, x, y, z, type, scale = 1) => {
    const col = ['#b36d51', '#759f9d', '#d9c6a0'][type % 3];
    b.add(potGeo, potMat, x, y + 0.26 * scale, z, 0.75 * scale, 0.52 * scale, 0.75 * scale, 0, 0, 0, col);
    b.cyl(potMat, '#51382c', x, y + 0.525 * scale, z, 0.34 * scale, 0.035);
    for (let i = 0; i < 3; i++) {
      const a = i * TAU / 3;
      plant(b, x + Math.cos(a) * 0.15 * scale, y + 0.53 * scale, z + Math.sin(a) * 0.15 * scale,
        type, scale * (0.85 + variation(i + z) * 0.25), i);
    }
  };
  const box = (b, x, y, z, length, type, scale = 1) => {
    b.box(potMat, '#8a563b', x, y + 0.16, z, 0.46, 0.32, length);
    b.box(potMat, '#45352a', x, y + 0.325, z, 0.38, 0.02, length - 0.12);
    for (let i = 0; i < Math.ceil(length / 0.37); i++) {
      const zz = z - length / 2 + 0.18 + i * 0.37;
      plant(b, x, y + 0.33, zz, type, scale * (0.68 + variation(i + z) * 0.25), i, 0.68 * scale);
    }
  };
  const bed = (b, x, y, z, length, width, types, scale = 1) => {
    b.box(potMat, '#847b67', x, y + 0.09, z, width + 0.18, 0.18, length + 0.16);
    b.box(potMat, '#384334', x, y + 0.19, z, width, 0.025, length);
    const rows = Math.max(1, Math.round(width / 0.5)), cols = Math.ceil(length / 0.48);
    for (let row = 0; row < rows; row++) for (let i = 0; i < cols; i++) {
      const seed = i + row * 31 + z;
      plant(b, x + (row + 0.5) * width / rows - width / 2, y + 0.2,
        z + (i + 0.5) * length / cols - length / 2, types[(i + row * 3) % types.length],
        scale * (0.65 + variation(seed) * 0.3), seed, Math.min(0.7 * scale, width));
    }
  };
  const facade = (b, {x, z, len, side, y, village}) => {
    const type = Math.floor(variation(x + z) * 8);
    for (const end of [-1, 1]) {
      const zz = z + end * len * 0.36;
      pot(b, x - side * 0.65, y, zz, (type + (end > 0 ? 3 : 0)) % 8, 1.0);
      if (!village) {
        box(b, x - side * 0.56, y + 4.04, zz, Math.min(2.1, len * 0.28), (type + 6) % 8, 0.9);
        // Hanging baskets sit above the original lanterns, at the facade's ends.
        const bx = x - side * 0.95;
        b.cyl(potMat, '#4c493c', bx, y + 6.02, zz, 0.018, 0.8, 'cyl6');
        pot(b, bx, y + 5.02, zz, (type + 1) % 8, 0.72);
        for (let k = 0; k < 3; k++) plant(b, bx - side * 0.12, y + 4.83 - k * 0.22,
          zz + k * 0.13, 6, 0.55, k);
      }
    }
  };
  const dress = (b, style, anchors) => {
    for (const a of anchors) facade(b, a);
    // Low flowers occupy only the outer kerb, beyond all three running lanes.
    for (const side of [-1, 1]) for (let i = 0; i < 12; i++)
      bed(b, side * (EDGE + 0.39), 0.02, -3.2 - i * 6.4, 3.6, 0.42,
        [(i + (side > 0 ? 3 : 0)) % 8, (i + 2) % 8], 0.72);
    if (style === 'lake' || style === 'blackDragon') {
      for (const side of [-1, 1]) for (const z of [-9, -29, -49, -69])
        pot(b, side * 10.5, 0, z, z === -29 ? 1 : 4, 1.1);
    }
    if (style === 'village' || style === 'baisha') {
      for (const side of [-1, 1]) for (const z of [-8, -30, -52, -74])
        bed(b, side * 10.1, 0, z, 3.2, 0.65, [3, 7, 4], 1.1);
    }
    if (style === 'waterWheels') {
      for (const z of [-7, -21, -33, -47]) box(b, 10.75, 0.36, z, 3.8, z === -21 ? 1 : 6, 1.1);
      bed(b, 20.5, 0, -68, 8, 1.3, [0, 1, 2], 1.2);
    }
    if (style === 'sifang') {
      for (const z of [-8, -67]) bed(b, -35, 0, z, 7, 2, [0, 7, 2, 5], 1.1);
      for (const z of [-18, -52]) pot(b, -12.8, 0, z, 1, 1.5);
    }
    if (style === 'mufu' || style === 'wangu') {
      for (const side of [-1, 1]) for (const z of [-10, -28, -54, -72])
        pot(b, side * 10.6, 0, z, style === 'mufu' ? 0 : 1, 1.25);
    }
    if (style === 'blueMoon') {
      for (const side of [-1, 1]) for (const z of [-10, -30, -50, -70])
        bed(b, side * 9.7, 0, z, 4.8, 0.8, [4, 2, 1, 5], 1.0);
    }
  };
  shared = { dress };
  return shared;
}

// Build the existing scene first, then attach a separate, clearly named overlay.
// Original materials, meshes and animation objects remain in the returned group.
export function finishFlowerScene(b, style) {
  const group = b.build();
  const flowers = new Batcher();
  kit().dress(flowers, style, facades.get(b) || []);
  const overlay = flowers.build();
  overlay.name = 'Lijiang flower additions';
  overlay.userData.species = FLOWER_SPECIES;
  overlay.userData.style = style;
  group.add(overlay);
  facades.delete(b);
  return group;
}
