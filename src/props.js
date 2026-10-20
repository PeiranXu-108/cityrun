// Gameplay props shared by all cities: trains, ramps, barriers, coins, power-ups and the city portal.
import {
  THREE,
  Batcher,
  VC,
  G,
  std,
  basic,
  hdr,
  canvasTex,
  stripeTex,
  CURVE_GLSL,
  curveUniforms,
  TRAIN_H,
  TRAIN_W,
  CAR_LEN,
  CAR_GAP,
  RAMP_LEN,
} from "./core.js";

// Shared blinking materials (animated once per frame by the world).
export const blink = {
  warn: basic({ color: hdr("#ff2a2a", 4) }),
  strobe: basic({ color: hdr("#3d7bff", 4) }),
  cross1: basic({ color: hdr("#ff2a2a", 4) }), // railroad-crossing lamps, alternating
  cross2: basic({ color: hdr("#ff2a2a", 4) }),
  update(t) {
    const on = Math.sin(t * 7) > 0;
    this.cross1.color.set("#ff2a2a").multiplyScalar(on ? 5 : 0.2);
    this.cross2.color.set("#ff2a2a").multiplyScalar(on ? 0.2 : 5);
    const a = 0.5 + 0.5 * Math.sin(t * 9);
    this.warn.color.set("#ff2a2a").multiplyScalar(0.4 + a * 4.5);
    const s = Math.sin(t * 14) > 0;
    this.strobe.color.set(s ? "#ff2244" : "#2a6bff").multiplyScalar(4);
  },
};

// ---------- trains ----------
function addCar(b, s, z0, len, front, moving, idx) {
  const W = TRAIN_W,
    H = TRAIN_H;
  const bodyMat = s.bodyMetal ? VC.metal : VC.solid;
  const bullet = front && s.nose === "bullet";
  const noseL = bullet ? 3.4 : 0;
  const zb0 = z0 - noseL,
    bl = len - noseL,
    zc = zb0 - bl / 2;
  b.box(bodyMat, s.body, 0, 0.45 + (H - 0.7) / 2, zc, W, H - 0.7, bl);
  b.box(bodyMat, s.roof, 0, H - 0.13, zc, W - 0.3, 0.26, bl - 0.1);
  b.box(VC.solid, s.under, 0, 0.32, z0 - len / 2, W - 0.35, 0.36, len - 0.8);
  for (const bz of [z0 - 2, z0 - len + 2]) {
    b.box(VC.metal, "#2a2d33", 0, 0.26, bz, W - 0.55, 0.3, 2.3);
    for (const wx of [-0.78, 0.78])
      for (const wz of [-0.6, 0.6])
        b.cyl(
          VC.metal,
          "#4a4e57",
          wx,
          0.25,
          bz + wz,
          0.25,
          0.12,
          "cyl",
          0,
          Math.PI / 2,
        );
  }
  // roof gear
  if (s.roofUnits !== false) {
    b.box(
      VC.metal,
      s.roofUnit || "#7d8591",
      0,
      H + 0.12,
      zc,
      1.1,
      0.25,
      Math.min(3, bl * 0.3),
    );
  }
  for (const sx of [-1, 1]) {
    const x = sx * (W / 2 + 0.006);
    b.box(VC.solid, s.stripe, x, 1.15, zc, 0.02, 0.3, bl - 0.2);
    if (s.stripe2) b.box(VC.solid, s.stripe2, x, 0.9, zc, 0.02, 0.1, bl - 0.2);
    if (s.ribs)
      for (let z = zb0 - 0.6; z > zb0 - bl + 0.4; z -= 0.9)
        b.box(
          bodyMat,
          s.ribColor || s.body,
          x + sx * 0.03,
          1.8,
          z,
          0.06,
          2.4,
          0.12,
        );
    // windows: false leaves the sides to the style's own extra (e.g. a double-decker bus)
    const n = s.windows === false ? 0 : Math.max(1, Math.floor((bl - 1.6) / 1.75));
    const step = (bl - 1.2) / Math.max(n, 1);
    for (let i = 0; i < n; i++) {
      const wz = zb0 - 0.6 - step * (i + 0.5);
      if (s.doors && i % 3 === 1) {
        b.box(VC.solid, s.door || s.frame, x, 1.55, wz, 0.03, 2.0, 1.2);
        b.box(
          VC.glow,
          hdr(s.window, s.windowK * 0.7),
          x + sx * 0.01,
          2.0,
          wz,
          0.03,
          0.7,
          0.9,
        );
      } else {
        b.box(VC.solid, s.frame, x, 2.05, wz, 0.025, 0.95, step * 0.82);
        b.box(
          VC.glow,
          hdr(s.window, s.windowK),
          x + sx * 0.01,
          2.05,
          wz,
          0.03,
          0.75,
          step * 0.7,
        );
      }
    }
    if (s.graffiti && Math.random() < 0.85) {
      const tex = s.graffiti[(idx + (sx > 0 ? 1 : 0)) % s.graffiti.length];
      const gl = Math.min(bl - 1, 8);
      b.add(
        G.plane,
        tex,
        x + sx * 0.03,
        1.15,
        zc,
        gl,
        1.25,
        1,
        0,
        (sx * Math.PI) / 2,
      );
    }
  }
  if (s.extra) s.extra(b, { z0, len, zb0, bl, front, moving, idx });
  if (front) {
    if (bullet) {
      const ny = 0.45 + (H - 0.7) / 2;
      b.add(G.sph, bodyMat, 0, ny, zb0, W, H - 0.7, noseL * 2, 0, 0, 0, s.body);
      b.add(
        G.sph,
        VC.metal,
        0,
        ny + 0.55,
        zb0 - 0.2,
        W * 0.78,
        (H - 0.7) * 0.6,
        noseL * 1.7,
        0,
        0,
        0,
        "#141821",
      );
      b.add(
        G.sph,
        VC.solid,
        0,
        0.95,
        zb0 + 0.02,
        W * 1.01,
        0.32,
        noseL * 2.02,
        0,
        0,
        0,
        s.stripe,
      );
      for (const lx of [-0.62, 0.62])
        b.add(
          G.sph,
          VC.glow,
          lx,
          0.95,
          z0 - 1.25 + Math.abs(lx) * 0.3,
          0.36,
          0.16,
          0.12,
          0,
          0,
          0,
          hdr(s.light, moving ? 7 : 3),
        );
    } else {
      const fz = z0 + 0.012;
      b.box(VC.solid, s.frame, 0, 1.75, fz, W - 0.1, 2.5, 0.02);
      b.box(VC.metal, "#0c1018", 0, 2.4, fz + 0.01, W - 0.7, 0.85, 0.02);
      b.box(
        VC.glow,
        hdr(s.window, s.windowK * 0.18),
        0,
        2.4,
        fz + 0.015,
        W - 0.9,
        0.7,
        0.02,
      );
      b.box(VC.glow, hdr(s.sign, 2.6), 0, 3.0, fz + 0.012, 1.2, 0.26, 0.02);
      for (const lx of [-0.72, 0.72]) {
        b.cyl(
          VC.glow,
          hdr(s.light, moving ? 7 : 2.8),
          lx,
          0.95,
          fz + 0.02,
          0.16,
          0.04,
          "cyl",
          Math.PI / 2,
        );
        b.cyl(
          VC.glow,
          hdr("#ff2a2a", 2.2),
          lx,
          0.62,
          fz + 0.02,
          0.07,
          0.04,
          "cyl",
          Math.PI / 2,
        );
      }
      if (s.badge)
        b.cyl(
          VC.glow,
          hdr(s.badge, 2.2),
          0,
          1.6,
          fz + 0.02,
          0.28,
          0.03,
          "cyl",
          Math.PI / 2,
        );
    }
    if (moving) {
      if (s.strobe !== false)
        b.box(blink.strobe, 0xffffff, 0, H + 0.12, z0 - 0.4, 1.4, 0.16, 0.3);
      for (const lx of [-0.72, 0.72])
        b.add(
          G.cone,
          VC.glowAdd,
          lx,
          0.95,
          z0 + 4.2,
          1.6,
          8,
          1.6,
          -Math.PI / 2,
          0,
          0,
          hdr(s.light, 0.06),
        );
    }
  }
}

function addRamp(b, s, z0) {
  const W = TRAIN_W - 0.1,
    H = TRAIN_H;
  const g = new THREE.BoxGeometry(W, H, RAMP_LEN);
  g.translate(0, H / 2, RAMP_LEN / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++)
    if (p.getY(i) > H - 0.01 && p.getZ(i) > RAMP_LEN - 0.01) p.setY(i, 0.04);
  g.computeVertexNormals();
  b.addM(g, s.rampMat, new THREE.Matrix4().makeTranslation(0, 0, z0));
  const ang = Math.atan2(H, RAMP_LEN),
    hyp = Math.hypot(H, RAMP_LEN);
  for (const x of [-W / 2, W / 2]) {
    b.add(
      G.box,
      VC.glow,
      x,
      H / 2 + 0.06,
      z0 + RAMP_LEN / 2,
      0.08,
      0.06,
      hyp,
      -ang,
      0,
      0,
      hdr(s.rampGlow, 3),
    );
    b.box(VC.metal, "#3b3f48", x, 0.6, z0 + 1.2, 0.12, 1.2, 0.12);
  }
}

export function buildTrain(base, cars, ramp, moving) {
  const s =
    moving && base.movingStyle ? { ...base, ...base.movingStyle } : base;
  const b = new Batcher();
  let z = 0;
  for (let i = 0; i < cars; i++) {
    addCar(b, s, z, CAR_LEN, i === 0, moving, i);
    if (i < cars - 1 && s.gangway !== false)
      b.box(
        VC.solid,
        "#1a1c22",
        0,
        1.7,
        z - CAR_LEN - CAR_GAP / 2,
        1.6,
        2.4,
        CAR_GAP + 0.1,
      );
    z -= CAR_LEN + CAR_GAP;
  }
  if (ramp) addRamp(b, s, 0);
  return b.build();
}
export const trainLen = (cars) => cars * CAR_LEN + (cars - 1) * CAR_GAP;

// ---------- barriers ----------
export function buildLowBarrier(s) {
  const b = new Batcher();
  for (const x of [-0.95, 0.95]) {
    b.box(VC.metal, s.post, x, 0.5, 0, 0.12, 1.0, 0.12);
    b.box(VC.metal, s.post, x, 0.04, 0, 0.5, 0.08, 0.7);
  }
  b.add(G.box, s.lowBarMat || s.barMat, 0, 0.82, 0, 2.2, 0.32, 0.12);
  b.add(G.box, s.lowBarMat || s.barMat, 0, 0.42, 0, 2.2, 0.22, 0.12);
  b.box(blink.warn, 0xffffff, -0.95, 1.1, 0, 0.16, 0.12, 0.16);
  b.box(blink.warn, 0xffffff, 0.95, 1.1, 0, 0.16, 0.12, 0.16);
  if (s.lowExtra) s.lowExtra(b);
  return b.build();
}

export function buildHighBarrier(s) {
  const b = new Batcher();
  for (const x of [-1.15, 1.15]) {
    b.box(VC.metal, s.post, x, 1.45, 0, 0.16, 2.9, 0.16);
    b.box(VC.metal, s.post, x, 0.05, 0, 0.45, 0.1, 0.6);
  }
  b.add(G.box, s.barMat, 0, 1.62, 0, 2.3, 0.3, 0.16);
  b.add(G.box, s.signMat, 0, 2.25, 0, 2.3, 0.95, 0.12);
  b.box(VC.glow, hdr(s.glow, 3), 0, 1.45, 0.09, 2.2, 0.05, 0.02);
  b.box(VC.glow, hdr(s.glow, 3), 0, 1.45, -0.09, 2.2, 0.05, 0.02);
  if (s.highExtra) s.highExtra(b);
  return b.build();
}

// sign texture with an arrow-under icon telling the player to slide
export function slideSignTex(bg, fg, label) {
  return canvasTex(
    256,
    96,
    (g, w, h) => {
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      g.fillStyle = fg;
      for (let i = 0; i < w; i += 32) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i + 16, 0);
        g.lineTo(i, 16);
        g.closePath();
        g.fill();
      }
      g.font = '900 44px "Russo One", "Arial Black", sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(label, w / 2, h / 2 + 8);
    },
    { repeat: false },
  );
}

export function barrierStyle({
  c1,
  c2,
  post = "#8d939e",
  glow = "#ff3355",
  signBg,
  signFg,
  label = "STOP",
}) {
  return {
    post,
    glow,
    barMat: std({ map: stripeTex(c1, c2, 6), roughness: 0.6 }),
    signMat: std({
      map: slideSignTex(signBg || c1, signFg || c2, label),
      roughness: 0.5,
      emissive: "#ffffff",
      emissiveIntensity: 0.25,
      emissiveMap: slideSignTex(signBg || c1, signFg || c2, label),
    }),
  };
}

// ---------- coins ----------
export function coinGeometry(kind) {
  if (kind === "qixing") {
    // the seven stars of the Naxi cape: a ring of seven round holes around a little sun
    const s = new THREE.Shape();
    s.absarc(0, 0, 0.43, 0, Math.PI * 2, false);
    for (let i = 0; i < 7; i++) {
      // the holes are tiny, so octagons read as round and keep each coin light (there can be ~90 on screen)
      const a = Math.PI / 2 + (i / 7) * Math.PI * 2, cx = Math.cos(a) * 0.27, cy = Math.sin(a) * 0.27;
      const h = new THREE.Path();
      for (let k = 0; k < 8; k++) {
        const b = -(k / 8) * Math.PI * 2, x = cx + Math.cos(b) * 0.055, y = cy + Math.sin(b) * 0.055;
        k ? h.lineTo(x, y) : h.moveTo(x, y);
      }
      h.closePath();
      s.holes.push(h);
    }
    const sun = new THREE.Path();
    for (let i = 0; i < 16; i++) {
      const a = Math.PI / 2 - (i / 16) * Math.PI * 2, r = i % 2 ? 0.06 : 0.115;
      i ? sun.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sun.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    sun.closePath();
    s.holes.push(sun);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 2,
      curveSegments: 12,
    });
    g.translate(0, 0, -0.035);
    return g;
  }
  if (kind === "fifty") {
    // the seven-sided 50p (a Reuleaux heptagon) with a crown punched through it
    const V = Array.from({ length: 7 }, (_, i) => {
      const a = Math.PI / 2 + (i / 7) * Math.PI * 2;
      return [Math.cos(a) * 0.44, Math.sin(a) * 0.44];
    });
    const s = new THREE.Shape();
    for (let i = 0; i < 7; i++) {
      const [ax, ay] = V[i], [bx, by] = V[(i + 1) % 7], [cx, cy] = V[(i + 4) % 7];
      const r = Math.hypot(ax - cx, ay - cy);
      let a0 = Math.atan2(ay - cy, ax - cx), a1 = Math.atan2(by - cy, bx - cx);
      if (a1 - a0 > Math.PI) a1 -= Math.PI * 2;
      if (a0 - a1 > Math.PI) a1 += Math.PI * 2;
      for (let k = 0; k < 6; k++) {
        const a = a0 + ((a1 - a0) * k) / 6, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        i || k ? s.lineTo(x, y) : s.moveTo(x, y);
      }
    }
    s.closePath();
    const crown = [[-0.19, 0.11], [-0.085, 0.0], [0, 0.17], [0.085, 0.0], [0.19, 0.11], [0.15, -0.12], [-0.15, -0.12]];
    const h = new THREE.Path();
    crown.forEach(([x, y], i) => (i ? h.lineTo(x, y - 0.02) : h.moveTo(x, y - 0.02)));
    h.closePath();
    s.holes.push(h);
    for (const [x, y] of [[-0.2, 0.18], [0, 0.24], [0.2, 0.18]]) {
      const o = new THREE.Path();
      o.absarc(x, y - 0.02, 0.028, 0, Math.PI * 2, true);
      s.holes.push(o);
    }
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 2,
      curveSegments: 8,
    });
    g.translate(0, 0, -0.035);
    return g;
  }
  if (kind === "southern") {
    // twelve-sided coin with the Southern Cross punched through it
    const s = new THREE.Shape();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
      i
        ? s.lineTo(Math.cos(a) * 0.43, Math.sin(a) * 0.43)
        : s.moveTo(Math.cos(a) * 0.43, Math.sin(a) * 0.43);
    }
    s.closePath();
    for (const [cx, cy, R] of [
      [0, 0.21, 0.07],
      [0.02, -0.22, 0.075],
      [-0.17, -0.01, 0.062],
      [0.16, 0.06, 0.055],
      [0.085, -0.085, 0.036],
    ]) {
      const h = new THREE.Path();
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 - (i / 10) * Math.PI * 2,
          r = i % 2 ? R * 0.45 : R;
        i
          ? h.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
          : h.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      h.closePath();
      s.holes.push(h);
    }
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 2,
      curveSegments: 6,
    });
    g.translate(0, 0, -0.035);
    return g;
  }
  if (kind === "ingot") {
    // 元宝: a gold sycee in profile, a boat with swept-up ends and a round dome
    const s = new THREE.Shape();
    s.moveTo(-0.26, -0.24);
    s.quadraticCurveTo(0, -0.31, 0.26, -0.24);
    s.quadraticCurveTo(0.42, -0.06, 0.48, 0.17);
    s.quadraticCurveTo(0.36, 0.1, 0.2, 0.04);
    s.absarc(0, 0.04, 0.2, 0, Math.PI, false);
    s.quadraticCurveTo(-0.36, 0.1, -0.48, 0.17);
    s.quadraticCurveTo(-0.42, -0.06, -0.26, -0.24);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 16,
    });
    g.translate(0, 0.02, -0.1);
    return g;
  }
  const shape = new THREE.Shape();
  const hole = new THREE.Path();
  if (kind === "nut") {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(a) * 0.44,
        y = Math.sin(a) * 0.44;
      i ? shape.lineTo(x, y) : shape.moveTo(x, y);
    }
    shape.closePath();
    hole.absarc(0, 0, 0.17, 0, Math.PI * 2, true);
  } else {
    shape.absarc(0, 0, 0.42, 0, Math.PI * 2, false);
    if (kind === "cash") {
      const s = 0.12;
      hole.moveTo(-s, -s);
      hole.lineTo(-s, s);
      hole.lineTo(s, s);
      hole.lineTo(s, -s);
      hole.closePath();
    } else if (kind === "yen") {
      hole.absarc(0, 0, 0.12, 0, Math.PI * 2, true); // 5-yen coin
    } else if (kind === "token") {
      // old NYC subway token: brass with the Y cut out
      const Y = [
        [-0.035, -0.17],
        [0.035, -0.17],
        [0.035, -0.01],
        [0.15, 0.13],
        [0.1, 0.17],
        [0, 0.05],
        [-0.1, 0.17],
        [-0.15, 0.13],
        [-0.035, -0.01],
      ].reverse();
      Y.forEach(([x, y], i) => (i ? hole.lineTo(x, y) : hole.moveTo(x, y)));
      hole.closePath();
    } else {
      for (let i = 0; i < 10; i++) {
        const a = (-i / 10) * Math.PI * 2 + Math.PI / 2,
          r = i % 2 ? 0.09 : 0.21;
        i
          ? hole.lineTo(Math.cos(a) * r, Math.sin(a) * r)
          : hole.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      hole.closePath();
    }
  }
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
    curveSegments: 20,
  });
  g.translate(0, 0, -0.035);
  return g;
}

export function coinMaterial(color = "#ffc93c", emissive = "#ff9d00") {
  return std({
    color,
    metalness: 0.8,
    roughness: 0.3,
    emissive,
    emissiveIntensity: 0.35,
  });
}

// ---------- power-ups ----------
export const POWERUPS = {
  magnet: { name: "磁铁", color: "#ff3355", dur: 10 },
  jetpack: { name: "喷气背包", color: "#ffae3b", dur: 7 },
  sneakers: { name: "弹跳鞋", color: "#39ff88", dur: 10 },
  multiplier: { name: "双倍分数", color: "#ffd23d", dur: 15 },
  shield: { name: "护盾", color: "#59d8ff", dur: 20 },
};

function x2Tex() {
  return canvasTex(
    128,
    128,
    (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.font = '900 86px "Russo One", "Arial Black", sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.shadowColor = "#ffd23d";
      g.shadowBlur = 14;
      g.fillStyle = "#fff3b0";
      g.fillText("×2", w / 2, h / 2 + 4);
    },
    { repeat: false },
  );
}

export function buildPowerup(type) {
  const p = POWERUPS[type];
  const root = new THREE.Group();
  const spin = new THREE.Group();
  root.add(spin);
  const b = new Batcher();
  const c = p.color;
  if (type === "magnet") {
    b.add(
      new THREE.TorusGeometry(0.32, 0.12, 8, 20, Math.PI),
      VC.solid,
      0,
      0.1,
      0,
      1,
      1,
      1,
      0,
      0,
      Math.PI,
      "#e8253f",
    );
    for (const x of [-0.32, 0.32]) {
      b.box(VC.solid, "#e8253f", x, 0.1 + 0.1, 0, 0.24, 0.22, 0.24);
      b.box(VC.metal, "#e9edf5", x, 0.1 + 0.32, 0, 0.24, 0.16, 0.24);
    }
  } else if (type === "jetpack") {
    for (const x of [-0.16, 0.16]) {
      b.cyl(VC.metal, "#d7dbe6", x, 0, 0, 0.15, 0.55);
      b.sph(VC.solid, "#ff3b3b", x, 0.28, 0, 0.15);
      b.add(
        G.cone,
        VC.glow,
        x,
        -0.42,
        0,
        0.22,
        0.35,
        0.22,
        Math.PI,
        0,
        0,
        hdr("#ffae3b", 4),
      );
    }
  } else if (type === "sneakers") {
    b.box(VC.solid, "#39ff88", 0, 0, 0, 0.32, 0.26, 0.6);
    b.box(VC.solid, "#ffffff", 0, 0.12, 0.16, 0.3, 0.25, 0.28);
    b.box(VC.glow, hdr("#39ff88", 3.5), 0, -0.15, 0, 0.34, 0.07, 0.62);
    b.add(
      G.box,
      VC.glow,
      0.17,
      0.05,
      0.12,
      0.02,
      0.25,
      0.35,
      0.4,
      0,
      0,
      hdr("#ffffff", 2),
    );
  } else if (type === "multiplier") {
    const m = basic({
      map: x2Tex(),
      transparent: true,
      color: hdr("#ffffff", 2.2),
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const pl = new THREE.Mesh(G.plane, m);
    pl.scale.set(0.95, 0.95, 1);
    spin.add(pl);
    b.cyl(VC.metal, "#ffd23d", 0, 0, -0.02, 0.4, 0.04, "cyl", Math.PI / 2);
  } else if (type === "shield") {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0.4);
    sh.quadraticCurveTo(0.2, 0.32, 0.36, 0.34);
    sh.quadraticCurveTo(0.38, -0.1, 0, -0.42);
    sh.quadraticCurveTo(-0.38, -0.1, -0.36, 0.34);
    sh.quadraticCurveTo(-0.2, 0.32, 0, 0.4);
    const g = new THREE.ExtrudeGeometry(sh, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.03,
      bevelSegments: 1,
    });
    g.translate(0, 0, -0.06);
    b.add(g, VC.metal, 0, 0, 0, 1, 1, 1, 0, 0, 0, "#59d8ff");
    b.add(g, VC.glow, 0, 0, 0.02, 0.6, 0.6, 1.2, 0, 0, 0, hdr("#bff3ff", 2.5));
  }
  spin.add(b.build());
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.035, 8, 40),
    basic({ color: hdr(c, 3.2) }),
  );
  root.add(ring);
  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 32),
    basic({
      color: hdr(c, 0.55),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  halo.position.z = -0.05;
  root.add(halo);
  root.userData = { spin, ring, type };
  return root;
}

// ---------- portal between cities (World Tour) ----------
export function buildPortal(theme) {
  const root = new THREE.Group();
  const col = theme.portal || "#b26bff";
  const ringMat = basic({ color: hdr(col, 4) });
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(5.6, 0.32, 12, 64),
    ringMat,
  );
  ring.position.y = 3.2;
  root.add(ring);
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(6.3, 0.08, 8, 64),
    basic({ color: hdr("#ffffff", 3) }),
  );
  ring2.position.y = 3.2;
  root.add(ring2);
  const u = {
    time: { value: 0 },
    color: { value: hdr(col, 1.4) },
    uCurveY: curveUniforms.uCurveY,
    uCurveX: curveUniforms.uCurveX,
  };
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(5.5, 64),
    new THREE.ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `uniform float uCurveY, uCurveX; varying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); ${CURVE_GLSL} gl_Position = projectionMatrix * mvPosition; }`,
      fragmentShader: `uniform float time; uniform vec3 color; varying vec2 vUv;
      void main(){ vec2 p = vUv - 0.5; float r = length(p) * 2.0; float a = atan(p.y, p.x);
        float sw = 0.5 + 0.5 * sin(a * 6.0 + r * 14.0 - time * 5.0);
        float k = smoothstep(1.0, 0.2, r) * (0.25 + sw * 0.5) + smoothstep(0.3, 0.0, r) * 0.6;
        gl_FragColor = vec4(color * k, k * 0.8);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`,
    }),
  );
  disc.position.y = 3.2;
  root.add(disc);
  const label = canvasTex(
    1024,
    192,
    (g, w, h) => {
      g.font = '900 84px "ZCOOL QingKe HuangYou", "Russo One", sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.shadowColor = col;
      g.shadowBlur = 30;
      g.fillStyle = "#ffffff";
      g.fillText(`${theme.name} · ${theme.en}`, w / 2, h / 2);
    },
    { repeat: false },
  );
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 1.9),
    basic({
      map: label,
      transparent: true,
      color: hdr("#ffffff", 2),
      depthWrite: false,
    }),
  );
  sign.position.y = 10.4;
  root.add(sign);
  for (const x of [-7, 7]) {
    const pil = new THREE.Mesh(
      G.box,
      std({ color: "#20222b", metalness: 0.8, roughness: 0.3 }),
    );
    pil.scale.set(0.8, 9.5, 0.8);
    pil.position.set(x, 4.75, 0);
    root.add(pil);
    const strip = new THREE.Mesh(G.box, ringMat);
    strip.scale.set(0.12, 9, 0.85);
    strip.position.set(x, 4.75, 0);
    root.add(strip);
  }
  root.userData = { u, ring, ring2 };
  return root;
}
