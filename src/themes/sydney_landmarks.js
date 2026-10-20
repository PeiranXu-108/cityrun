// Sydney landmark scenes: Circular Quay with the Opera House across the cove, The Rocks and the Argyle Cut, running across
// the Harbour Bridge through the New Year's Eve waterfall, Luna Park under the bridge, the QVB and Town Hall on George
// Street, Darling Harbour on fireworks night, and Bondi Beach with the Icebergs pool.
import {
  THREE,
  Batcher,
  VC,
  G,
  std,
  basic,
  hdr,
  canvasTex,
  buildingGeo,
  rand,
  randi,
  pick,
} from "../core.js";
import { at, EDGE, farGround, waterMat, textTex } from "./common.js";
import { beam, wire } from "./tokyo_kit.js";
import { tiledBox } from "./beijing_kit.js";
import { SparkCurtain, Fireworks } from "../fx.js";

// indexed grid surface P(u, v), u and v in [0, 1], with smooth normals
function gridGeo(nu, nv, P) {
  const pos = [],
    uv = [],
    idx = [];
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      pos.push(...P(i / nu, j / nv));
      uv.push(i / nu, j / nv);
    }
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i,
        c = a + nu + 1;
      idx.push(a, a + 1, c + 1, a, c + 1, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// an Opera House shell: a spherical-triangle hood on a curved base, its tip leaning out toward +z
export const sailGeo = (w, h, depth, lean, bulge) =>
  gridGeo(10, 14, (uu, v) => {
    const u = uu * 2 - 1,
      e = 1 - u * u,
      k = bulge * Math.sin(Math.PI * v) * e;
    return [
      ((u * w) / 2) * (1 - v ** 1.6),
      h * v + k * 0.4,
      -depth * e * (1 - v) + lean * v * v - k,
    ];
  });
// the glass wall filling a hood's mouth
const hoodGeo = (w, h, lean) =>
  gridGeo(1, 10, (u, v) => [
    (u * 2 - 1) * (w / 2) * (1 - v ** 1.6) * 0.96,
    h * v * 0.97,
    lean * v * v - 0.2,
  ]);

function tileTex() {
  // the shells' cream tiles in chevrons
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = "#f2eee4";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(150,140,120,0.4)";
    g.lineWidth = 1.5;
    for (let y = -w; y < h; y += 12) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w / 2, y + 18);
      g.lineTo(w, y);
      g.stroke();
    }
  });
}
function vividTex() {
  // Vivid Sydney on the sails: drifting colour fields under rings of dots and dotted waves
  return canvasTex(512, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h);
    [
      ["#4a1a8a", 0],
      ["#c8306a", 0.3],
      ["#ff8a3a", 0.5],
      ["#1aa8b8", 0.75],
      ["#4a1a8a", 1],
    ].forEach(([c, o]) => gr.addColorStop(o, c));
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    const cols = [
      "#ffffff",
      "#ffd23d",
      "#ff9a3a",
      "#fff0c0",
      "#3dfff0",
      "#ff5a7a",
    ];
    const dot = (x, y, r) => {
      for (const [ox, oy] of [
        [0, 0],
        [w, 0],
        [-w, 0],
        [0, h],
        [0, -h],
      ]) {
        g.beginPath();
        g.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        g.fill();
      }
    };
    for (let c = 0; c < 10; c++) {
      const cx = rand(0, w),
        cy = rand(0, h),
        R = rand(36, 100);
      for (let r = 8, i = 0; r < R; r += 10, i++) {
        g.fillStyle = cols[(i + c) % cols.length];
        const n = Math.floor((2 * Math.PI * r) / 9);
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2;
          dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2.6);
        }
      }
    }
    for (let k = 0; k < 7; k++) {
      g.fillStyle = pick(cols);
      const y0 = rand(0, h),
        amp = rand(10, 28),
        f = (Math.PI * 2 * randi(2, 4)) / w;
      for (let x = 0; x < w; x += 8)
        dot(x, y0 + Math.sin(x * f + k) * amp, 2.2);
    }
  });
}
function mullionTex() {
  // amber glass walls under the hoods
  return canvasTex(128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, h, 0, 0);
    gr.addColorStop(0, "#ffcf8a");
    gr.addColorStop(1, "#7a4a2e");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(24,16,12,0.85)";
    for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 2, h);
    for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 2);
  });
}
function trailTex(col, dir) {
  // car light streaks running along v; dir puts the bright head toward -v (oncoming) or +v
  return canvasTex(32, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) {
      const y = rand(0, h - 60),
        len = rand(20, 56),
        x = 4 + (i % 3) * 10,
        gr = g.createLinearGradient(
          0,
          dir > 0 ? y : y + len,
          0,
          dir > 0 ? y + len : y,
        );
      gr.addColorStop(0, "rgba(255,255,255,0)");
      gr.addColorStop(0.75, col);
      gr.addColorStop(1, "#ffffff");
      g.fillStyle = gr;
      g.fillRect(x, y, 3, len);
    }
  });
}
function faceTex() {
  // Luna Park's grinning face under its crown of rays
  return canvasTex(
    512,
    600,
    (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const cx = w / 2,
        cy = h * 0.58;
      for (let k = 0; k < 15; k++) {
        const a = Math.PI * (1.08 + (k / 14) * 0.84);
        g.fillStyle = k % 2 ? "#ffd23d" : "#e83a3a";
        g.beginPath();
        g.moveTo(
          cx + Math.cos(a - 0.07) * 150,
          cy - 40 + Math.sin(a - 0.07) * 150,
        );
        g.lineTo(cx + Math.cos(a) * 300, cy - 40 + Math.sin(a) * 300);
        g.lineTo(
          cx + Math.cos(a + 0.07) * 150,
          cy - 40 + Math.sin(a + 0.07) * 150,
        );
        g.fill();
      }
      g.fillStyle = "#f6dfa0";
      g.beginPath();
      g.ellipse(cx, cy, 220, 240, 0, 0, Math.PI * 2);
      g.fill();
      for (const s of [-1, 1]) {
        g.fillStyle = "#ffffff";
        g.beginPath();
        g.ellipse(cx + s * 86, cy - 70, 54, 66, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#2a6ad8";
        g.beginPath();
        g.arc(cx + s * 84, cy - 62, 30, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#101014";
        g.beginPath();
        g.arc(cx + s * 84, cy - 60, 14, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "#2a1a10";
        g.lineWidth = 14;
        g.beginPath();
        g.arc(cx + s * 86, cy - 118, 58, Math.PI * 1.15, Math.PI * 1.85);
        g.stroke();
        g.fillStyle = "rgba(255,110,120,0.55)";
        g.beginPath();
        g.arc(cx + s * 145, cy + 40, 38, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = "#b8202c";
      g.beginPath();
      g.ellipse(cx, cy + 100, 165, 108, 0, 0, Math.PI);
      g.fill();
      g.fillStyle = "#1a0a0a";
      g.beginPath();
      g.ellipse(cx, cy + 108, 136, 86, 0, 0, Math.PI);
      g.fill();
      g.fillStyle = "#ffffff";
      for (let k = -4; k <= 4; k++)
        g.fillRect(cx + k * 29 - 12, cy + 98, 24, 28);
    },
    { repeat: false },
  );
}
function foamTex() {
  // rolling lines of surf, broken along their length
  return canvasTex(128, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const f = (Math.PI * 2) / w;
    for (let k = 0; k < 4; k++) {
      const y = k * 64 + rand(0, 16);
      for (let x = 0; x < w; x += 8) {
        const a = 0.3 + 0.7 * Math.abs(Math.sin(x * f * 3 + k * 1.7)),
          yy = y + Math.sin(x * f * 2 + k) * 3;
        const gr = g.createLinearGradient(0, yy, 0, yy + 18);
        gr.addColorStop(0, "rgba(255,255,255,0)");
        gr.addColorStop(0.7, `rgba(255,255,255,${a.toFixed(2)})`);
        gr.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = gr;
        g.fillRect(x, yy, 8, 18);
      }
    }
  });
}
function muralTex() {
  // Bondi's graffiti wall
  return canvasTex(512, 96, (g, w, h) => {
    g.fillStyle = "#d8d0c4";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) {
      g.fillStyle = pick([
        "#ff3a5a",
        "#3dfff0",
        "#ffd23d",
        "#39ff88",
        "#b26bff",
        "#ff9a3a",
        "#2a6ad8",
      ]);
      g.beginPath();
      g.ellipse(
        rand(0, w),
        rand(0, h),
        rand(20, 60),
        rand(10, 30),
        rand(0, 3),
        0,
        Math.PI * 2,
      );
      g.fill();
    }
    g.font = '900 64px "Russo One", Impact, sans-serif';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineJoin = "round";
    g.lineWidth = 10;
    g.strokeStyle = "#141418";
    g.strokeText("BONDI", w / 2, h / 2);
    g.fillStyle = "#ffffff";
    g.fillText("BONDI", w / 2, h / 2);
  });
}
function cobbleTex() {
  // The Rocks' cobbled footpaths
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#2a2622";
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16)
      for (let x = (y / 16) % 2 ? -12 : 0; x < w; x += 24) {
        const c = 64 + randi(0, 40);
        g.fillStyle = `rgb(${c + 22},${c + 10},${c - 6})`;
        g.fillRect(x + 1.5, y + 1.5, 21, 13);
      }
  });
}
function flagTex(kind) {
  // the two flags flown on the top of the arch
  return canvasTex(
    192,
    96,
    (g, w, h) => {
      if (kind === "au") {
        g.fillStyle = "#00247d";
        g.fillRect(0, 0, w, h);
        const cw = w / 2,
          ch = h / 2;
        g.save();
        g.beginPath();
        g.rect(0, 0, cw, ch);
        g.clip();
        g.strokeStyle = "#ffffff";
        g.lineWidth = 10;
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(cw, ch);
        g.moveTo(cw, 0);
        g.lineTo(0, ch);
        g.stroke();
        g.strokeStyle = "#cf142b";
        g.lineWidth = 3.5;
        g.stroke();
        g.fillStyle = "#ffffff";
        g.fillRect(cw / 2 - 8, 0, 16, ch);
        g.fillRect(0, ch / 2 - 8, cw, 16);
        g.fillStyle = "#cf142b";
        g.fillRect(cw / 2 - 5, 0, 10, ch);
        g.fillRect(0, ch / 2 - 5, cw, 10);
        g.restore();
        const star = (cx, cy, r, n = 7) => {
          g.beginPath();
          for (let i = 0; i < n * 2; i++) {
            const a = (i * Math.PI) / n - Math.PI / 2,
              rr = i % 2 ? r * 0.45 : r;
            g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
          }
          g.closePath();
          g.fill();
        };
        g.fillStyle = "#ffffff";
        star(cw / 2, h * 0.75, 11);
        for (const [px, py] of [
          [0.75, 0.83],
          [0.62, 0.45],
          [0.75, 0.18],
          [0.87, 0.38],
        ])
          star(px * w, py * h, 6);
        star(0.81 * w, 0.56 * h, 3.5, 5);
      } else {
        g.fillStyle = "#000000";
        g.fillRect(0, 0, w, h / 2);
        g.fillStyle = "#cc0000";
        g.fillRect(0, h / 2, w, h / 2);
        g.fillStyle = "#ffcc00";
        g.beginPath();
        g.arc(w / 2, h / 2, h * 0.25, 0, Math.PI * 2);
        g.fill();
      }
    },
    { repeat: false },
  );
}

export function sydLandmarks(K) {
  const harbour = waterMat("#0e1630"),
    sea = waterMat("#0e1c3a"),
    pool = waterMat("#1aa0c0");
  harbour.normalMap.repeat.set(24, 8);
  sea.normalMap.repeat.set(13, 8);
  pool.normalMap.repeat.set(4, 2);
  pool.emissive.set("#0a7a98");
  for (const m of [harbour, sea]) { m.color.set('#0a1230'); m.metalness = 0.6; m.roughness = 0.3; m.envMapIntensity = 0.25; m.normalScale.set(0.3, 0.3); }
  pool.emissiveIntensity = 0.9;
  pool.metalness = 0.3;
  const vivid = vividTex(),
    tiles = tileTex();
  tiles.repeat.set(3, 3);
  const sailMat = std({
    map: tiles,
    emissive: "#ffffff",
    emissiveMap: vivid,
    emissiveIntensity: 0.8,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  const ohGlass = basic({
    map: mullionTex(),
    color: hdr("#ffffff", 0.85),
    side: THREE.DoubleSide,
  });
  const steel = std({ color: '#565d66', roughness: 0.55, metalness: 0.5, emissive: '#ffcf9a', emissiveIntensity: 0.05 });
  // pale grey granite ashlar for the bridge pylons
  const granTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#8e8a84'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 16 - 16; x < w; x += 32) {
      const v = randi(-12, 12); g.fillStyle = `rgb(${176 + v},${172 + v},${164 + v})`; g.fillRect(x + 1, y + 1, 30, 14);
    }
  });
  const granMat = std({ map: granTex, roughness: 0.8, emissive: '#ffe0b0', emissiveMap: granTex, emissiveIntensity: 0.1 });
  const gran = (b, x, y, z, w, h, d) => b.addM(tiledBox(w, h, d, 2.6), granMat, at(x, y + h / 2, z), 0xffffff);
  const copper = std({
    color: "#4a9a7a",
    roughness: 0.5,
    metalness: 0.4,
    emissive: "#1f4a3a",
    emissiveIntensity: 0.7,
  });
  const trails = [trailTex("#fff2d0", 1), trailTex("#ff3a2a", -1)];
  trails.forEach((t) => t.repeat.set(1, 3));
  const trailMats = trails.map((t, i) =>
    basic({
      map: t,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: hdr(i ? "#ff5a4a" : "#fff6e6", 1.8),
    }),
  );
  const foam = foamTex();
  foam.repeat.set(4, 2);
  const foamMat = basic({
    map: foam,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: hdr('#d8ecff', 1.1),
  });
  const cobble = cobbleTex();
  cobble.repeat.set(2, 24);
  const cobbleMat = std({ map: cobble, roughness: 0.75 });
  const flagMats = ["au", "abo"].map((k) => {
    const t = flagTex(k);
    return std({
      map: t,
      emissive: "#ffffff",
      emissiveMap: t,
      emissiveIntensity: 0.45,
      side: THREE.DoubleSide,
    });
  });
  const curtains = [],
    wheels = [],
    bursts = [];

  // ---------- shared builders ----------
  const streakMats = new Map();
  const streak = (b, x0, z0, x1, z1, w, y, col) => {
    // a light's reflection laid on the water
    let m = streakMats.get(col);
    if (!m)
      streakMats.set(
        col,
        (m = basic({
          color: hdr(col, 0.3),
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })),
      );
    b.add(
      G.plane,
      m,
      (x0 + x1) / 2,
      y,
      (z0 + z1) / 2,
      w,
      Math.hypot(x1 - x0, z1 - z0),
      1,
      -Math.PI / 2,
      Math.atan2(-(x1 - x0), -(z1 - z0)),
      0,
    );
  };
  const refl = (b, x, z, len, w, col, y = -1.15) => {
    // streak from a light toward the approaching runner, stopping short of the quay
    const dx = -x,
      dz = 40,
      d = Math.hypot(dx, dz),
      L = Math.min(len, ((Math.abs(x) - 13) * d) / Math.abs(dx));
    if (L > 2) streak(b, x, z, x + (dx / d) * L, z + (dz / d) * L, w, y, col);
  };
  const seawall = (b, s) => {
    // sandstone sea wall and railing along the water's edge
    b.box(VC.solid, "#6a5e50", s * (EDGE + 7.4), -0.6, -40, 0.8, 1.6, 80);
    b.box(VC.metal, "#1f1f24", s * (EDGE + 7.1), 1.1, -40, 0.08, 0.08, 80);
    for (let z = 1; z < 80; z += 2)
      b.box(VC.metal, "#1f1f24", s * (EDGE + 7.1), 0.55, -z, 0.06, 1.1, 0.06);
  };
  const endCap = (b, s, y0, x1 = 250) => b.box(VC.solid, '#3a342e', s * (11 + (x1 - 11) / 2), (y0 - 0.1) / 2, -79.9, x1 - 11, -0.1 - y0, 0.2);   // far edge of open water under the next chunk's ground
  const operaHouse = (b, x, y, z, s = 1) => {
    const S = (v) => v * s;
    b.block(VC.solid, "#9a7a66", x, y, z, S(46), S(6), S(84));
    b.box(
      VC.glow,
      hdr("#ffd9a0", 0.5),
      x,
      y + S(3),
      z + S(42.03),
      S(40),
      S(2.6),
      0.05,
    );
    for (let k = 0; k < 5; k++)
      b.block(
        VC.solid,
        "#c4a888",
        x,
        y,
        z - S(42.55 + k * 1.1),
        S(36 - k * 0.8),
        S(5.4 - k),
        S(1.1),
      );
    const shell = (dx, dz, H, W, D, back = false) =>
      b.addM(
        sailGeo(S(W), S(H), S(D), S(H * 0.45), S(H * 0.16)),
        sailMat,
        new THREE.Matrix4()
          .makeRotationY(back ? Math.PI : 0)
          .setPosition(x + S(dx), y + S(6), z + S(dz)),
        0xffffff,
      );
    for (const [dx, list] of [
      [
        -11,
        [
          [30, 20, 6],
          [26, 18, 5],
          [21, 15, 4.5],
          [15, 12, 3.5],
        ],
      ],
      [
        11,
        [
          [26, 18, 5.5],
          [22, 16, 4.5],
          [18, 13, 4],
          [13, 10, 3],
        ],
      ],
    ]) {
      list.forEach(([H, W, D], k) => shell(dx, 22 - k * 9, H, W, D));
      const [H, W] = list[list.length - 1];
      shell(dx, 22 - list.length * 9 + 1, H * 0.85, W * 0.95, 3, true);
      const [H0, W0] = list[0];
      b.addM(
        hoodGeo(S(W0), S(H0), S(H0 * 0.45)),
        ohGlass,
        at(x + S(dx), y + S(6), z + S(22)),
        0xffffff,
      );
    }
    shell(-15, -30, 11, 9, 2.5);
    shell(-15, -33, 8, 8, 2, true); // Bennelong restaurant by the steps
    for (let k = 0; k < 14; k++)
      b.box(
        VC.glow,
        hdr("#fff0d0", 2.2),
        x + S(rand(-22, 22)),
        y + S(6.1),
        z + S(rand(-40, 40)),
        S(0.5),
        S(0.25),
        S(0.5),
      );
  };
  const ferry = (b, x, z, ry = 0) => {
    // green-and-gold harbour ferry
    const c = Math.cos(ry),
      s = Math.sin(ry),
      P = (lx, lz) => [x + c * lx + s * lz, z - s * lx + c * lz];
    b.add(G.box, VC.solid, x, -0.6, z, 6, 1.8, 22, 0, ry, 0, "#1f4a2a");
    b.add(G.box, VC.solid, x, 1.2, z, 5.6, 1.9, 18, 0, ry, 0, "#f2e6b8");
    b.add(
      G.box,
      VC.glow,
      x,
      1.3,
      z,
      5.7,
      0.8,
      16.5,
      0,
      ry,
      0,
      hdr("#ffd9a0", 1.0),
    );
    b.add(G.box, VC.solid, x, 2.3, z, 5.8, 0.25, 18.4, 0, ry, 0, "#1f4a2a");
    b.add(G.box, VC.solid, x, 3.1, z, 4.2, 1.4, 6, 0, ry, 0, "#f2e6b8");
    b.add(
      G.box,
      VC.glow,
      x,
      3.2,
      z,
      4.3,
      0.6,
      5.4,
      0,
      ry,
      0,
      hdr("#ffe6c0", 1.1),
    );
    const [fx, fz] = P(0, -2);
    b.cyl(VC.solid, "#1f4a2a", fx, 4.6, fz, 0.6, 1.8);
    for (const lz of [-10.5, 10.5]) {
      const [px, pz] = P(0, lz);
      b.sph(
        VC.glow,
        hdr(lz > 0 ? "#39ff88" : "#ff3a3a", 3),
        px,
        1.2,
        pz,
        0.25,
        true,
      );
    }
  };
  const ferris = (R, cols) => {
    // Ferris wheel turning in the y-z plane
    const b = new Batcher();
    let prev = null;
    for (let k = 0; k <= 48; k++) {
      const a = (k / 48) * Math.PI * 2,
        y = Math.cos(a) * R,
        z = Math.sin(a) * R;
      if (prev)
        for (const dx of [-0.8, 0.8])
          beam(b, VC.metal, dx, prev[0], prev[1], dx, y, z, 0.25, "#e8e8ec");
      b.sph(VC.glow, hdr(cols[k % cols.length], 2.6), 0, y, z, 0.2, true);
      prev = [y, z];
    }
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      beam(
        b,
        VC.metal,
        0,
        0,
        0,
        0,
        Math.cos(a) * R,
        Math.sin(a) * R,
        0.14,
        "#d8d8de",
      );
    }
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      b.block(
        VC.solid,
        pick(["#ff3a5a", "#1f6fd0", "#ffd23d", "#39b54a"]),
        0,
        Math.cos(a) * (R + 0.9) - 1.0,
        Math.sin(a) * (R + 0.9),
        1.4,
        1.2,
        1.0,
      );
    }
    b.sph(VC.glow, hdr("#ffd23d", 2.4), 0, 0, 0, 0.9);
    return b.build();
  };
  // the coathanger seen side-on: an arch spanning along x at depth z, with its granite pylons
  const archBridge = (
    b,
    xa,
    xb,
    z,
    {
      deck = 16.7,
      base = -1.2,
      rise = 41,
      top0 = 30,
      topRise = 16,
      hw = 5,
      N = 24,
    } = {},
  ) => {
    const L = xb - xa,
      xc = (xa + xb) / 2,
      u = (x) => (x - xc) / (L / 2);
    const bot = (x) => base + rise * (1 - u(x) ** 2),
      top = (x) => top0 + topRise * (1 - u(x) ** 2),
      xs = (k) => xa + (L * k) / N;
    for (const s of [-1, 1]) {
      const zz = z + s * hw;
      for (let k = 0; k <= N; k++) {
        const x = xs(k),
          yt = top(x),
          yb = bot(x);
        beam(b, steel, x, yt, zz, x, yb, zz, 0.6, 0xffffff);
        if (yb > deck + 0.5)
          beam(b, steel, x, yb, zz, x, deck, zz, 0.25, 0xffffff);
        b.sph(
          VC.glow,
          hdr(k % 4 === 0 ? "#ffd23d" : "#fff0d0", 2.6),
          x,
          yt + 0.4,
          zz + s * 0.6,
          0.3,
          true,
        );
        if (k === N) continue;
        const x2 = xs(k + 1);
        beam(b, steel, x, yt, zz, x2, top(x2), zz, 1.0, 0xffffff, 1.0);
        beam(b, steel, x, yb, zz, x2, bot(x2), zz, 1.6, 0xffffff, 1.2);
        if (k % 2) beam(b, steel, x, yt, zz, x2, bot(x2), zz, 0.4, 0xffffff);
        else beam(b, steel, x, yb, zz, x2, top(x2), zz, 0.4, 0xffffff);
      }
    }
    for (let k = 0; k <= N; k++) {
      const x = xs(k);
      beam(b, steel, x, top(x), z - hw, x, top(x), z + hw, 0.5, 0xffffff);
    }
    b.box(VC.solid, "#3a3c42", xc, deck - 0.6, z, L, 1.2, hw * 2 + 3);
    for (let x = xa + 3; x < xb; x += 6)
      for (const s of [-1, 1])
        b.sph(
          VC.glow,
          hdr("#ffe6b0", 2.2),
          x,
          deck + 1.2,
          z + s * (hw + 1.4),
          0.18,
          true,
        );
    for (const x of [xa, xb]) {
      gran(b, x, base, z, 12, top0 + 4 - base, hw * 2 + 6);
      b.box(VC.solid, "#c8c4bc", x, top0 + 4.3, z, 12.8, 0.8, hw * 2 + 6.8);
      gran(b, x, top0 + 4.7, z, 10, 5, hw * 2 + 4);
      for (const dx of [-3, 0, 3])
        b.box(
          VC.glow,
          hdr("#ffd9a0", 0.9),
          x + dx,
          top0 + 7,
          z + hw + 2.03,
          1.4,
          3,
          0.05,
        );
      b.box(
        VC.glow,
        hdr("#ffd9a0", 1.8),
        x,
        base + 1,
        z + hw + 3.2,
        0.4,
        0.4,
        0.4,
      );
    }
  };

  // ---------- 环形码头 · 悉尼歌剧院 ----------
  const quay = () => {
    const b = new Batcher();
    // Sydney Cove on the right with the Opera House out on Bennelong Point; ferries at the far wharves
    b.add(G.plane, harbour, 130, -1.2, -40, 240, 80, 1, -Math.PI / 2, 0, 0);
    seawall(b, 1); endCap(b, 1, -1.4);
    operaHouse(b, 46, -1.2, -46.5, 0.7);
    for (const [x, z, c] of [
      [38, -20, "#ffd9a0"],
      [52, -18, "#ff9ad5"],
      [30, -30, "#fff0d0"],
      [60, -24, "#ffb45a"],
    ])
      refl(b, x, z, 30, 2.2, c);
    for (const [z, n] of [
      [-60, "4"],
      [-73, "5"],
    ]) {
      b.box(VC.solid, "#3a3630", 16, -0.5, z, 9, 1.2, 10);
      for (const dx of [-3.6, 3.6])
        for (const dz of [-4.4, 0, 4.4])
          b.cyl(VC.metal, "#1f4a2a", 16 + dx, 1.9, z + dz, 0.12, 3.6, "cyl8");
      b.box(VC.solid, "#e8dca0", 16, 3.95, z, 8.6, 0.5, 10.6);
      b.box(VC.solid, "#1f4a2a", 16, 4.35, z, 8.8, 0.3, 10.8);
      b.box(VC.glow, hdr("#ffe6c0", 0.9), 16, 3.67, z, 7.6, 0.05, 9.4);
      b.block(VC.glow, hdr("#ffd9a0", 0.7), 16, 0.1, z, 2, 2.4, 3);
      b.add(
        G.plane,
        basic({
          map: textTex("WHARF " + n, {
            w: 256,
            h: 64,
            color: "#f2e6b8",
            bg: "#1f4a2a",
            size: 0.62,
          }),
          color: hdr("#ffffff", 1.1),
        }),
        11.65,
        3.95,
        z,
        3.4,
        0.5,
        1,
        0,
        -Math.PI / 2,
        0,
      );
      ferry(b, 23.6, z - 1, 0);
    }
    ferry(b, 92, -26, 0.9);
    b.add(
      G.plane,
      foamMat,
      92 + 9,
      -1.15,
      -26 + 11,
      3,
      16,
      1,
      -Math.PI / 2,
      0.9,
      0,
    );
    for (let z = 6; z < 56; z += 10) {
      K.lamp(b, EDGE + 6.4, -z, 1);
      K.cockatoo(b, EDGE + 7.1, 1.15, -z - 4);
    }
    // the quay: sandstone Customs House with its clock and flag, CBD towers behind, palms, buskers, the evening crowd
    farGround(b, -1, "#15161c");
    K.sand(b, -22, 0, -20, 18, 17, 26);
    for (let k = -2; k <= 2; k++)
      for (const y of [3.4, 8.2, 12.6])
        b.box(
          VC.glow,
          hdr("#ffd9a0", 0.8),
          -12.97,
          y,
          -20 + k * 4.6,
          0.05,
          2.8,
          2.0,
        );
    b.box(VC.solid, "#b8945a", -12.7, 17.2, -20, 0.8, 0.8, 26.6);
    b.add(
      G.cyl,
      VC.glow,
      -12.85,
      15.1,
      -20,
      2.4,
      0.1,
      2.4,
      0,
      0,
      Math.PI / 2,
      hdr("#fff4dc", 1.2),
    );
    b.cyl(VC.metal, "#d8d8de", -20, 20.5, -20, 0.08, 7);
    b.add(G.plane, flagMats[0], -18.7, 22.8, -20, 2.6, 1.3, 1);
    K.cbdRow(b, -1, 36, 80);
    for (let z = 4; z < 80; z += 12)
      K.palm(b, -(EDGE + 5.4), -z, rand(0.95, 1.1));
    K.bin(b, -(EDGE + 6.4), -30, true);
    K.bin(b, -(EDGE + 6.4), -58, false);
    K.busker(b, EDGE + 4.6, -24, 1);
    K.busker(b, -(EDGE + 3.8), -50, -1);
    K.crowd(b, 4.6, 10, 2, 78, 26);
    K.crowd(b, -4.6, -9.6, 2, 78, 22);
    return b.build();
  };

  // ---------- 岩石区 · 阿盖尔隧道 ----------
  const rocks = () => {
    const b = new Batcher();
    for (const s of [-1, 1]) {
      farGround(b, s, "#17151a");
      K.sandRow(b, s, 0, 54);
      b.add(
        G.plane,
        cobbleMat,
        s * (EDGE + 3.5),
        0.05,
        -40,
        6.8,
        80,
        1,
        -Math.PI / 2,
        0,
        0,
      );
      for (let z = 5; z < 54; z += 10) K.gasLamp(b, s * (EDGE + 0.7), -z);
    }
    // weekend market stalls along the right footpath, festoon lights strung across the lane
    for (let z = 6; z < 50; z += 5.5) K.stall(b, EDGE + 2.4, -z);
    for (const z of [-12, -26, -40, -52]) {
      wire(b, -11, 11.8, z, 11, 11.8, z, 0.6, {
        color: "#1a1a1e",
        t: 0.03,
        n: 10,
      });
      for (let k = 1; k < 18; k++) {
        const s = k / 18;
        b.sph(
          VC.glow,
          hdr(pick(["#ffd28a", "#ffcf8a", "#fff0c0"]), 2.4),
          -11 + 22 * s,
          11.8 - 0.6 * 4 * s * (1 - s) - 0.12,
          z,
          0.1,
          true,
        );
      }
    }
    // the Argyle Cut: the lane runs into a rough sandstone cutting under an old stone bridge
    for (const s of [-1, 1])
      for (let z = 55; z < 80; z += 4.2) {
        const h = rand(16.6, 17.6),
          x0 = 11 + rand(0, 0.7);
        K.sand(
          b,
          s * (x0 + 8),
          0,
          -(z + 2.1),
          16,
          h,
          4.3,
          pick(["#c8a878", "#bfa070", "#d0b080"]),
        );
        if (Math.random() < 0.5)
          b.box(
            VC.solid,
            pick(["#3a5a2a", "#2f4a24"]),
            s * (x0 - 0.05),
            h - rand(0.5, 2.5),
            -(z + 2.1),
            0.2,
            rand(0.8, 2),
            rand(1.2, 3),
          );
      }
    for (const s of [-1, 1])
      for (const z of [-60, -76])
        b.box(VC.glow, hdr("#ffcf8a", 1.8), s * 10.9, 5, z, 0.3, 0.5, 0.3);
    const R = 14.6,
      zb = -68,
      th0 = Math.asin(11 / R),
      NV = 15;
    for (let k = 0; k < NV; k++) {
      const th = -th0 + ((k + 0.5) / NV) * 2 * th0;
      b.add(
        G.box,
        K.sandMat,
        (R + 0.7) * Math.sin(th),
        0.4 + (R + 0.7) * Math.cos(th),
        zb,
        ((2 * th0) / NV) * (R + 0.7) + 0.05,
        1.4,
        6.4,
        0,
        0,
        -th,
        pick(["#e8d0a0", "#d8bc8a", "#f0d8a8"]),
      );
    }
    for (let x = -10.5; x <= 10.5; x += 1) {
      const y0 = 0.4 + Math.sqrt((R + 1.4) ** 2 - x * x) - 0.3;
      if (y0 < 16.4)
        b.box(
          K.sandMat,
          "#d8bc8a",
          x,
          (y0 + 16.4) / 2,
          zb,
          1.02,
          16.4 - y0,
          6.2,
        );
    }
    b.box(VC.solid, "#a88a5a", 0, 16.8, zb, 24, 0.8, 6.8);
    for (const dz of [-3.1, 3.1]) {
      b.box(K.sandMat, "#e0c898", 0, 17.75, zb + dz, 24, 1.1, 0.5);
      for (const x of [-7, 0, 7]) {
        b.box(K.sandMat, "#e0c898", x, 18.6, zb + dz, 0.6, 0.6, 0.6);
        K.lantern(b, x, 19.3, zb + dz);
      }
    }
    K.crowd(b, 7.6, 10.4, 2, 50, 16);
    K.crowd(b, -4.6, -9.6, 2, 52, 18);
    return b.build();
  };

  // ---------- 悉尼海港大桥（在桥面上奔跑） ----------
  const bridge = () => {
    const b = new Batcher();
    const XT = 19, Z0 = -2, L = 76, zc = -40, N = 16;
    const u = (z) => (z - zc) / (L / 2), zs = (k) => Z0 - (L * k) / N;
    // flat top chord from the pylon tops, the main arch springing from below the deck: low enough to loom over the track ahead
    const top = (z) => 24 + 10 * (1 - u(z) ** 2), bot = (z) => -20 + 47 * (1 - u(z) ** 2);
    // the deck: the railway in the middle, road lanes streaming with traffic, the walkways outside the arch
    b.box(VC.solid, '#34363c', 0, -0.86, -40, 55, 1.6, 80);
    for (const s of [-1, 1]) {
      b.box(VC.metal, '#4a4e56', s * 27.6, -1.1, -40, 0.5, 2.4, 80);
      b.box(VC.solid, '#202126', s * 14.75, 0.0, -40, 7.5, 0.08, 80);
      for (let z = 2; z < 80; z += 6) b.box(VC.solid, '#e8e4dc', s * 14.75, 0.05, -z, 0.14, 0.02, 3);
      b.box(VC.solid, '#8a8a90', s * 10.95, 0.4, -40, 0.4, 0.8, 80);
      b.box(VC.metal, '#3a3e46', s * 18.6, 0.6, -40, 0.25, 1.2, 80);
      b.add(G.plane, trailMats[s > 0 ? 0 : 1], s * 14.75, 0.55, -40, 7, 80, 1, -Math.PI / 2, 0, 0);
      for (const y of [1.2, 2.6]) b.box(VC.metal, '#2a2c32', s * 27.1, y, -40, 0.08, 0.08, 80);
      for (let z = 1; z < 80; z += 2.5) b.box(VC.metal, '#2a2c32', s * 27.1, 1.3, -z, 0.07, 2.6, 0.07);
      for (let z = 6; z < 80; z += 12) b.box(VC.glow, hdr('#fff0d0', 2.0), s * 18.6, 1.3, -z, 0.3, 0.2, 0.3);
    }
    // the coathanger: twin arched trusses, hangers down to the deck, lateral bracing overhead
    for (const s of [-1, 1]) {
      const x = s * XT;
      for (let k = 0; k <= N; k++) {
        const z = zs(k), yt = top(z), yb = bot(z);
        beam(b, steel, x, yt, z, x, yb, z, 0.7, 0xffffff);
        if (yb > 0.5) beam(b, steel, x, yb, z, x, 0, z, 0.28, 0xffffff);
        b.sph(VC.glow, hdr(k % 4 === 0 ? '#ffd23d' : '#fff0d0', 2.6), x + s * 0.8, yt + 0.2, z, 0.3, true);
        if (k === N) continue;
        const z2 = zs(k + 1), zm = (z + z2) / 2;
        beam(b, steel, x, yt, z, x, top(z2), z2, 1.1, 0xffffff, 1.4);
        beam(b, steel, x, yb, z, x, bot(z2), z2, 1.3, 0xffffff, 2.0);
        if (k % 2) beam(b, steel, x, yb, z, x, top(z2), z2, 0.45, 0xffffff);
        else beam(b, steel, x, yt, z, x, bot(z2), z2, 0.45, 0xffffff);
        b.sph(VC.glow, hdr('#ffe6b0', 2.2), x + s * 0.85, bot(zm), zm, 0.24, true);
      }
    }
    for (let k = 0; k <= N; k++) {
      const z = zs(k), yt = top(z), yb = bot(z);
      beam(b, steel, -XT, yt, z, XT, yt, z, 0.55, 0xffffff);
      if (k < N) { const z2 = zs(k + 1), y2 = top(z2); beam(b, steel, -XT, yt, z, XT, y2, z2, 0.3, 0xffffff); beam(b, steel, XT, yt, z, -XT, y2, z2, 0.3, 0xffffff); }
      if (yb > 16) beam(b, steel, -XT, yb, z, XT, yb, z, 0.7, 0xffffff);
    }
    // the flags on top of the arch, and a BridgeClimb party with head torches on the way up
    for (const [s, m] of [[-1, 0], [1, 1]]) {
      b.cyl(VC.metal, '#d8d8de', s * XT, top(zc) + 4.4, zc, 0.09, 7.2);
      b.add(G.plane, flagMats[m], s * (XT - 1.9), top(zc) + 6.6, zc, 3.6, 1.8, 1);
    }
    for (let k = 0; k < 8; k++) {
      const z = -15 - k * 1.8, y = top(z) + 0.7;
      b.box(VC.solid, '#5a6a80', -XT, y + 0.5, z, 0.4, 0.9, 0.3);
      b.sph(VC.solid, '#e0b890', -XT, y + 1.12, z, 0.15, true);
      b.sph(VC.glow, hdr('#ffffff', 3), -XT, y + 1.2, z - 0.15, 0.06, true);
    }
    // granite pylons at both ends, the walkway passing through an arch at their foot
    for (const z of [-6, -74]) for (const s of [-1, 1]) {
      gran(b, s * 29.3, -49, z, 5.4, 73, 10);
      gran(b, s * 23.3, 4.4, z, 6.6, 19.6, 10);
      b.box(VC.solid, '#c8c4bc', s * 26, 24.3, z, 12.8, 0.8, 10.8);
      gran(b, s * 26, 24.7, z, 10.4, 7.2, 8.6);
      b.box(VC.solid, '#c8c4bc', s * 26, 32.2, z, 11, 0.8, 9.2);
      for (const dz of [-2.6, 0, 2.6]) b.box(VC.glow, hdr('#ffd9a0', 0.9), s * 20.77, 28.3, z + dz, 0.05, 3.2, 1.3);
      b.box(VC.glow, hdr('#ffcf8a', 0.6), s * 26.55, 2.2, z, 0.05, 3.6, 8);
      for (const dz of [-4.4, 4.4]) b.box(VC.glow, hdr('#ffd9a0', 1.8), s * 19.9, 0.25, z + dz, 0.25, 0.25, 0.25);
    }
    K.crowd(b, 20, 26, 12, 68, 12); K.crowd(b, -20, -26, 12, 68, 12);
    const g = b.build();
    // New Year's Eve: a waterfall of sparks pouring off both edges of the deck, shells bursting over the crown
    for (const s of [-1, 1]) { const c = new SparkCurtain({ x: s * 27.4, z0: -11.5, z1: -68.5, y: 7.5, drop: 16, count: 1300, k: 3 }); g.add(c.obj); curtains.push(c); }
    const fw = new Fireworks({ shells: 4, sparks: 90, center: [0, 66, -40], spread: [70, 14, 50], radius: [14, 24], period: [3, 5], curved: true });
    g.add(fw.obj); bursts.push(fw);
    return g;
  };

  // ---------- 月神公园 ----------
  const face = faceTex();
  const faceMat = std({
    map: face,
    alphaTest: 0.3,
    roughness: 0.6,
    emissive: "#ffffff",
    emissiveMap: face,
    emissiveIntensity: 0.55,
  });
  const lunaText = basic({
    map: textTex("LUNA PARK", {
      w: 1024,
      h: 160,
      color: "#ffffff",
      glow: "#ff3a8a",
      size: 0.62,
    }),
    transparent: true,
    depthWrite: false,
    color: hdr("#ffffff", 1.4),
  });
  const coaster = (b, cx, cz, rx, rz) => {
    // the Wild Mouse: a looping ribbon of track on red stilts
    const N = 72,
      P = [];
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2,
        r = 1 + 0.22 * Math.sin(3 * a);
      P.push([
        cx + Math.cos(a) * rx * r,
        6 + 4 * Math.sin(2 * a) + 2.4 * Math.cos(5 * a),
        cz + Math.sin(a) * rz * r,
      ]);
    }
    for (let k = 0; k < N; k++) {
      const p = P[k],
        q = P[(k + 1) % N],
        dx = q[0] - p[0],
        dz = q[2] - p[2],
        d = Math.hypot(dx, dz),
        nx = (-dz / d) * 0.45,
        nz = (dx / d) * 0.45;
      for (const o of [-1, 1])
        beam(
          b,
          VC.metal,
          p[0] + nx * o,
          p[1],
          p[2] + nz * o,
          q[0] + nx * o,
          q[1],
          q[2] + nz * o,
          0.12,
          "#e8e8ec",
        );
      if (k % 2 === 0)
        beam(
          b,
          VC.metal,
          p[0] - nx,
          p[1] - 0.05,
          p[2] - nz,
          p[0] + nx,
          p[1] - 0.05,
          p[2] + nz,
          0.08,
          "#c8c8cc",
        );
      if (k % 4 === 0)
        beam(
          b,
          VC.metal,
          p[0],
          0,
          p[2],
          p[0],
          p[1] - 0.1,
          p[2],
          0.22,
          "#c8202c",
        );
      if (k % 3 === 0)
        b.sph(
          VC.glow,
          hdr(pick(["#ffd23d", "#ff3a5a", "#3dfff0", "#ffffff"]), 2.4),
          p[0] + nx * 1.4,
          p[1] + 0.1,
          p[2] + nz * 1.4,
          0.11,
          true,
        );
    }
  };
  const luna = () => {
    const b = new Batcher();
    // Lavender Bay on the left with the Harbour Bridge leaping across it; its approach viaduct strides over the line
    b.add(G.plane, harbour, -125, -1.2, -40, 230, 80, 1, -Math.PI / 2, 0, 0);
    seawall(b, -1); endCap(b, -1, -1.4);
    archBridge(b, -200, -30, -70);
    for (let x = -46; x > -190; x -= 13)
      refl(b, x, -64, 40, 1.6, pick(["#ffe6b0", "#fff0d0", "#ffd23d"]));
    b.box(VC.solid, "#3a3c42", 17, 16.1, -70, 94, 1.2, 13);
    for (const s of [-1, 1])
      b.box(VC.metal, "#2a2c32", 17, 17.3, -70 + s * 6.4, 94, 1.2, 0.15);
    for (const x of [-16, 14, 34, 54])
      gran(b, x, -1.2, -70, 3, 16.8, 11);
    for (let x = -28; x < 64; x += 6)
      for (const s of [-1, 1])
        b.sph(VC.glow, hdr("#ffe6b0", 2.2), x, 17.9, -70 + s * 6.4, 0.18, true);
    ferry(b, -60, -30, -0.3);
    // the grinning face gate between its lit towers, the Coney Island funhouse, the Wild Mouse and the Ferris wheel
    farGround(b, 1, "#17151a");
    const fx = 15.6,
      fz = -30;
    b.block(VC.solid, "#2a2028", fx + 6, 0, fz, 12, 16, 22);
    b.add(
      G.plane,
      faceMat,
      fx - 0.05,
      9.2,
      fz,
      15,
      17.6,
      1,
      0,
      -Math.PI / 2,
      0,
    );
    b.add(
      G.plane,
      lunaText,
      fx - 0.3,
      19.4,
      fz,
      13,
      2.0,
      1,
      0,
      -Math.PI / 2,
      0,
    );
    for (const dz of [-12, 12]) {
      b.block(VC.solid, "#e8e0d0", fx + 2, 0, fz + dz, 4, 22, 4);
      b.block(VC.solid, "#e8e0d0", fx + 2, 22, fz + dz, 2.8, 4, 2.8);
      b.add(
        G.cone4,
        VC.solid,
        fx + 2,
        27.4,
        fz + dz,
        3,
        2.8,
        3,
        0,
        0,
        0,
        "#c8202c",
      );
      for (let y = 1; y < 26; y += 1.2)
        for (const o of [-1.7, 1.7])
          b.sph(
            VC.glow,
            hdr(pick(["#ffd23d", "#ff3a5a", "#3dfff0", "#ffffff"]), 2.6),
            fx - 0.05,
            y,
            fz + dz + o,
            0.14,
            true,
          );
    }
    b.block(VC.solid, "#3a2a4a", 28, 0, -9, 12, 9, 10);
    b.box(VC.glow, hdr("#ff9ad5", 0.9), 21.97, 4.5, -9, 0.05, 7, 8.4);
    for (let k = 0; k < 9; k++)
      b.box(
        VC.glow,
        hdr(pick(["#ffd23d", "#3dfff0", "#39ff88", "#ff5a7a"]), 1.6),
        21.9,
        1 + k * 0.9,
        -9 + (k % 2 ? 3 : -3),
        0.08,
        0.5,
        1.6,
      );
    coaster(b, 44, -10, 10, 7);
    for (let z = 4; z < 18; z += 6) K.stall(b, EDGE + 4.6, -z);
    K.crowd(b, 4.6, 12, 2, 78, 30);
    for (let z = 6; z < 80; z += 14) K.lamp(b, EDGE + 1.4, -z, 1);
    for (let z = 6; z < 80; z += 14) K.lamp(b, -(EDGE + 1.4), -z, -1);
    const g = b.build();
    const wheel = ferris(13, [
      "#ff3a5a",
      "#ffd23d",
      "#3dfff0",
      "#39ff88",
      "#ffffff",
    ]);
    wheel.position.set(42, 16, -44);
    g.add(wheel);
    wheels.push(wheel);
    const legs = new Batcher();
    for (const dz of [-5, 5])
      for (const dx of [-1, 1])
        beam(
          legs,
          VC.metal,
          42 + dx * 3,
          0,
          -44 + dz,
          42 + dx * 0.9,
          16,
          -44,
          0.45,
          "#d8d8de",
        );
    g.add(legs.build());
    return g;
  };

  // ---------- 维多利亚女王大厦 · 市政厅 ----------
  const dome = (b, x, y, z, r) => {
    b.cyl(VC.solid, "#c8a46a", x, y + r * 0.45, z, r * 0.95, r * 0.9);
    b.addM(
      new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      copper,
      at(x, y + r * 0.9, z),
      0xffffff,
    );
    b.cyl(VC.solid, "#c8a46a", x, y + r * 2.0, z, r * 0.22, r * 0.4);
    b.add(G.cone, copper, x, y + r * 2.5, z, r * 0.4, r * 0.7, r * 0.4);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      b.box(
        VC.glow,
        hdr("#ffe6b0", 1.0),
        x + Math.cos(a) * r * 0.96,
        y + r * 0.5,
        z + Math.sin(a) * r * 0.96,
        0.25,
        r * 0.4,
        0.25,
      );
    }
  };
  const george = () => {
    const b = new Batcher();
    for (const side of [-1, 1]) farGround(b, side, "#17151a");
    K.catenary(b);
    // the Queen Victoria Building: a long sandstone arcade with arched windows and copper domes
    K.sand(b, 21, 0, -40, 18, 14, 68);
    for (let k = 0; k < 15; k++) {
      const z = -9.2 - k * 4.4;
      b.box(VC.glow, hdr("#ffd9a0", 0.75), 11.97, 1.7, z, 0.05, 2.8, 3.4);
      for (const y of [5.4, 9.8]) {
        b.box(VC.glow, hdr("#ffd9a0", 0.85), 11.97, y, z, 0.05, 2.6, 2.2);
        b.cyl(
          VC.glow,
          hdr("#ffd9a0", 0.85),
          11.97,
          y + 1.3,
          z,
          1.1,
          0.05,
          "cyl",
          0,
          Math.PI / 2,
        );
      }
    }
    b.box(VC.solid, "#a8844a", 11.7, 14.2, -40, 0.8, 0.8, 68.4);
    b.box(VC.solid, "#a8844a", 11.8, 3.6, -40, 0.6, 0.4, 68.2);
    dome(b, 21, 14, -40, 7.5);
    for (const z of [-10, -70]) dome(b, 21, 14, z, 3.6);
    for (const z of [-22, -30, -50, -58]) dome(b, 14.5, 14, z, 1.6);
    K.lightRailStop(b, EDGE + 2.6, -24, 1);
    // Town Hall with its clock tower, St Andrew's Cathedral with its twin Gothic towers
    K.sand(b, -24, 0, -36, 20, 15, 32);
    for (let k = -3; k <= 3; k++) {
      b.box(
        VC.glow,
        hdr("#ffd9a0", 0.8),
        -13.97,
        8,
        -36 + k * 4.2,
        0.05,
        6,
        2.2,
      );
      b.cyl(
        VC.glow,
        hdr("#ffd9a0", 0.8),
        -13.97,
        11,
        -36 + k * 4.2,
        1.1,
        0.05,
        "cyl",
        0,
        Math.PI / 2,
      );
    }
    for (let k = 0; k < 6; k++)
      b.block(
        VC.solid,
        "#c0a070",
        -13.4 + k * 0.4,
        0,
        -36,
        0.4,
        1.2 - k * 0.2,
        14,
      );
    K.sand(b, -18, 0, -24, 7, 46, 7);
    b.add(
      G.cyl,
      VC.glow,
      -14.45,
      38,
      -24,
      2.6,
      0.1,
      2.6,
      0,
      0,
      Math.PI / 2,
      hdr("#fff4dc", 1.2),
    );
    b.add(G.cone4, copper, -18, 49, -24, 8, 6, 8, 0, Math.PI / 4, 0);
    b.cyl(VC.metal, "#d8d2c4", -18, 54, -24, 0.15, 4);
    K.sand(b, -24, 0, -66, 16, 18, 20);
    b.add(
      G.box,
      VC.solid,
      -24,
      21,
      -66,
      11.4,
      6,
      20,
      0,
      0,
      Math.PI / 4,
      "#5a5048",
    );
    for (const z of [-57.5, -74.5]) {
      K.sand(b, -16.5, 0, z, 5, 30, 5);
      b.add(
        G.cone4,
        VC.solid,
        -16.5,
        33,
        z,
        4.6,
        6,
        4.6,
        0,
        Math.PI / 4,
        0,
        "#b8945a",
      );
      for (const [dx, dz] of [
        [-2.3, -2.3],
        [2.3, -2.3],
        [-2.3, 2.3],
        [2.3, 2.3],
      ])
        b.add(
          G.cone4,
          VC.solid,
          -16.5 + dx,
          31.4,
          z + dz,
          0.7,
          2.8,
          0.7,
          0,
          Math.PI / 4,
          0,
          "#c8a878",
        );
      b.box(VC.glow, hdr("#ffcf8a", 0.9), -13.97, 9, z, 0.05, 5, 1.6);
    }
    for (let k = -2; k <= 2; k++)
      b.box(
        VC.glow,
        hdr(pick(["#ff9a5a", "#7ab8ff", "#ffd36a", "#c87aff"]), 0.85),
        -15.97,
        8,
        -66 + k * 2.6,
        0.05,
        7,
        1.3,
      );
    b.cyl(
      VC.glow,
      hdr("#ff9a5a", 0.9),
      -15.97,
      14,
      -66,
      2.2,
      0.05,
      "cyl",
      0,
      Math.PI / 2,
    );
    K.sandRow(b, -1, 0, 7);
    for (const side of [-1, 1])
      for (let z = 10; z < 80; z += 14)
        K.lamp(b, side * (EDGE + 1.4), -z, side);
    for (const z of [-4, -78]) {
      K.walkSignal(b, EDGE + 0.6, z, 1);
      K.walkSignal(b, -(EDGE + 0.6), z, -1);
    }
    K.streetSign(b, -(EDGE + 1.0), -16, 0, 1);
    K.bin(b, EDGE + 6.6, -40, true);
    K.crowd(b, 4.6, 10, 2, 78, 24);
    K.crowd(b, -4.6, -10, 2, 78, 18);
    return b.build();
  };

  // ---------- 达令港 ----------
  const crown = (b, x, z) => {
    // Crown Sydney: three glass petals twisting as they rise
    const H = 120,
      N = 24;
    for (let p = 0; p < 3; p++)
      for (let k = 0; k < N; k++) {
        const t = k / N,
          a = (p / 3) * Math.PI * 2 + t * 0.9,
          r = 6 * (1 - 0.35 * t),
          w = 12 * (1 - 0.3 * t) * (1 + 0.15 * Math.sin(Math.PI * t));
        b.addM(
          buildingGeo(w, H / N + 0.05, 7, K.glass, 1.3, 2.6),
          K.glassMat,
          at(x + Math.cos(a) * r, t * H, z + Math.sin(a) * r, -a),
          pick(["#ffffff", "#e0e8ff"]),
        );
      }
    b.sph(VC.glow, hdr("#ff2a2a", 4), x, H + 2, z, 0.4);
    b.cyl(VC.glow, hdr("#e8f0ff", 1.2), x, H + 0.3, z, 4, 0.4);
  };
  const pyrmont = (b, z) => {
    // the old swing bridge across Cockle Bay
    b.box(VC.solid, "#5a5048", -66, 1.3, z, 108, 0.6, 7);
    for (let x = -14; x > -118; x -= 4)
      for (const dz of [-3.4, 3.4]) {
        beam(b, VC.metal, x, 1.6, z + dz, x - 2, 4.2, z + dz, 0.15, "#3a3e46");
        beam(
          b,
          VC.metal,
          x - 2,
          4.2,
          z + dz,
          x - 4,
          1.6,
          z + dz,
          0.15,
          "#3a3e46",
        );
      }
    for (const dz of [-3.4, 3.4])
      b.box(VC.metal, "#3a3e46", -66, 4.2, z + dz, 104, 0.2, 0.2);
    for (let x = -20; x > -116; x -= 12)
      b.cyl(VC.metal, "#3a3e46", x, -0.2, z, 0.6, 2.4);
    b.block(VC.solid, "#e8e0d0", -66, 1.6, z, 4, 3.6, 4);
    b.box(VC.glow, hdr("#ffe0a8", 1.0), -66, 3.4, z, 4.1, 1.0, 4.1);
    b.add(G.cone4, VC.solid, -66, 6.0, z, 5, 1.6, 5, 0, 0, 0, "#c8202c");
    for (let x = -16; x > -118; x -= 6)
      for (const dz of [-3.6, 3.6])
        b.sph(VC.glow, hdr("#ffe0a8", 2.4), x, 4.6, z + dz, 0.16, true);
  };
  const tallShip = (b, x, z) => {
    // the barque moored at the Maritime Museum, rigging strung with lights
    b.add(G.sph, VC.solid, x, -0.4, z, 5, 3.4, 26, 0, 0, 0, "#2a1a12");
    b.box(VC.solid, "#5a3a24", x, 1.4, z, 4.6, 0.3, 22);
    for (const [dz, h] of [
      [-7, 20],
      [0, 24],
      [7, 18],
    ]) {
      b.cyl(VC.solid, "#3a2a1e", x, 1.4 + h / 2, z + dz, 0.2, h);
      for (const y of [8, 13, 18])
        if (y < h)
          b.box(VC.solid, "#3a2a1e", x, 1.4 + y, z + dz, 7, 0.15, 0.15);
      for (const s of [-1, 1])
        beam(
          b,
          VC.metal,
          x,
          1.4 + h,
          z + dz,
          x + s * 2.2,
          1.6,
          z + dz + s * 4,
          0.03,
          "#1a1a1e",
        );
      for (let k = 1; k <= 8; k++)
        for (const s of [-1, 1])
          b.sph(
            VC.glow,
            hdr("#ffe0a8", 2.6),
            x + s * 2.2 * (k / 9),
            1.4 + h - (h - 0.2) * (k / 9),
            z + dz + s * 4 * (k / 9),
            0.12,
            true,
          );
    }
    beam(b, VC.solid, x, 1.8, z - 12, x, 4.4, z - 18, 0.2, "#3a2a1e");
  };
  const darling = () => {
    const b = new Batcher();
    // Cockle Bay: the swing bridge, the tall ship, the lights of the far shore and Saturday's fireworks over the water
    b.add(G.plane, harbour, -120, -1.2, -40, 220, 80, 1, -Math.PI / 2, 0, 0);
    seawall(b, -1); endCap(b, -1, -1.4);
    pyrmont(b, -58);
    tallShip(b, -26, -24);
    b.addM(
      buildingGeo(26, 16, 60, K.glass, 1.3, 2.6),
      K.glassMat,
      at(-112, -1.2, -36),
      "#ffe6c0",
    );
    b.addM(
      buildingGeo(20, 30, 18, K.glass, 1.3, 2.6),
      K.glassMat,
      at(-104, -1.2, -72),
      "#c9d6ff",
    );
    for (const [x, z, c] of [
      [-99, -16, "#ffd9a0"],
      [-99, -34, "#9fd8ff"],
      [-99, -50, "#ffd9a0"],
      [-94, -70, "#ff9ad5"],
      [-66, -55, "#ffe0a8"],
      [-40, -55, "#ffe0a8"],
    ])
      refl(b, x, z, 60, 2.6, c);
    // the promenade: restaurants under neon, palms, Crown Sydney twisting above them all
    farGround(b, 1, "#15161c");
    crown(b, 34, -44);
    for (let z = 2; z < 30; z += 9) {
      const zc = -(z + 4);
      b.block(VC.solid, "#2a2a30", 15, 0, zc, 8, 5, 8);
      b.box(VC.glow, hdr("#ffd9a0", 0.8), 10.97, 1.8, zc, 0.04, 2.8, 6.4);
      b.add(
        G.box,
        VC.solid,
        10.4,
        3.3,
        zc,
        1.4,
        0.1,
        7.6,
        0,
        0,
        0.3,
        pick(["#1f8aa8", "#e86a3a", "#3ab8a0"]),
      );
      K.neon(b, 10.9, 4.2, zc, 1, 5, randi(0, 11));
    }
    K.cbdRow(b, 1, 58, 80);
    for (let z = 4; z < 80; z += 9)
      K.palm(b, -(EDGE + 3.6), -z, rand(0.95, 1.1));
    for (let z = 34; z < 56; z += 7) K.palm(b, EDGE + 5.4, -z, rand(0.95, 1.1));
    for (let z = 6; z < 80; z += 14) K.lamp(b, EDGE + 1.4, -z, 1);
    K.busker(b, -(EDGE + 4.4), -40, -1);
    K.crowd(b, 4.6, 10, 2, 78, 24);
    K.crowd(b, -4.6, -9.6, 2, 78, 22);
    const g = b.build();
    const fw = new Fireworks({
      shells: 5,
      sparks: 90,
      center: [-72, 50, -40],
      spread: [60, 16, 50],
      radius: [14, 22],
      period: [3, 5.2],
      curved: true,
    });
    g.add(fw.obj);
    bursts.push(fw);
    return g;
  };

  // ---------- 邦迪海滩 ----------
  const mural = muralTex();
  const muralMat = std({
    map: mural,
    roughness: 0.8,
    emissive: "#ffffff",
    emissiveMap: mural,
    emissiveIntensity: 0.3,
  });
  const bondi = () => {
    const b = new Batcher(), sand = new Batcher(), SY = -1.6;   // `sand` is laid out with y = 0 on the beach
    // the sea wall down to the beach, the Pacific rolling in, Norfolk pines along the promenade
    b.box(VC.solid, '#d8d0c4', -(EDGE + 7.5), -0.7, -40, 0.7, 2.2, 80);
    b.box(VC.metal, '#3a3e46', -(EDGE + 7.4), 1.1, -40, 0.07, 0.07, 80);
    for (let z = 1; z < 80; z += 2) b.box(VC.metal, '#3a3e46', -(EDGE + 7.4), 0.75, -z, 0.05, 0.7, 0.05);
    b.box(VC.solid, '#ac9a76', -37, SY - 0.15, -40, 51, 0.3, 80);
    b.add(G.box, VC.solid, -69, SY - 0.12, -40, 15, 0.1, 80, 0, 0, 0.02, '#5a5444');
    b.add(G.plane, sea, -138, SY - 0.15, -40, 140, 80, 1, -Math.PI / 2, 0, 0);
    endCap(b, -1, SY - 0.3, 208);
    b.add(G.plane, foamMat, -84, SY - 0.1, -40, 80, 36, 1, -Math.PI / 2, -Math.PI / 2, 0);
    for (let z = 8; z < 80; z += 16) K.norfolk(b, -(EDGE + 5.8), -z, rand(0.75, 0.9));
    // the graffiti wall by the beach ramp, the Pavilion, the lifeguard tower, flags, boards and bathers on the sand
    b.addM(tiledBox(22, 3.2, 0.6, 3.2), muralMat, at(-23, SY + 1.6, -6), 0xffffff);
    K.sand(b, -19.5, SY, -46, 12, 6.4, 16, '#fbf4ea');
    for (let k = -2; k <= 2; k++) {
      b.box(VC.glow, hdr('#ffcf8a', 0.9), -13.47, SY + 2.4, -46 + k * 3, 0.05, 2.6, 1.8);
      b.cyl(VC.glow, hdr('#ffcf8a', 0.9), -13.47, SY + 3.7, -46 + k * 3, 0.9, 0.05, 'cyl', 0, Math.PI / 2);
    }
    b.add(G.cone4, VC.solid, -19.5, SY + 7.9, -46, 18.4, 3, 24, 0, 0, 0, '#b8603a');
    const lx = -36, lz = -16;
    for (const [dx, dz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) sand.box(VC.metal, '#d8d8de', lx + dx, 1.5, lz + dz, 0.2, 3, 0.2);
    sand.block(VC.solid, '#f4f2ec', lx, 3, lz, 4.2, 3.2, 4.2);
    sand.box(VC.glow, hdr('#e8f4ff', 1.1), lx, 4.8, lz, 4.3, 0.9, 4.3);
    sand.box(VC.solid, '#c8202c', lx, 6.4, lz, 4.6, 0.3, 4.6);
    for (const z of [-26, -52]) K.flags(sand, -46, z);
    for (let k = 0; k < 10; k++) sand.add(G.sph, VC.solid, -rand(18, 54), 1.0, -rand(8, 60), 0.12, 2.0, 0.5, 0.2, rand(0, 3), 0, pick(['#ffd23d', '#3dfff0', '#ff6a8a', '#f4f4f0']));
    for (let k = 0; k < 8; k++) sand.box(VC.solid, pick(['#ff6a8a', '#3dd8ff', '#ffd23d', '#9d6bff', '#f4f4f0']), -rand(16, 50), 0.02, -rand(6, 60), 0.9, 0.03, 1.8, rand(0, 3));
    K.crowd(sand, -16, -56, 6, 60, 22);
    // Icebergs at the south end: the ocean pool glowing turquoise below the white clubhouse, surf breaking over its rim
    b.box(VC.solid, '#5a5650', -40, SY + 0.6, -71, 32, 1.4, 18);
    b.addM(new THREE.PlaneGeometry(20, 9).rotateX(-Math.PI / 2), pool, at(-40, SY + 1.32, -71), 0xffffff);
    for (let k = -3; k <= 3; k++) b.box(VC.glow, hdr('#3dfff0', 0.8), -40 + k * 2.8, SY + 1.34, -71, 0.06, 0.03, 8.6);
    b.add(G.plane, foamMat, -58, SY - 0.05, -71, 18, 10, 1, -Math.PI / 2, -Math.PI / 2, 0);
    K.sand(b, -18, SY, -73, 12, 10.6, 14, '#fbf6ee');
    for (let k = 0; k < 3; k++) b.box(VC.glow, hdr('#ffe6c0', 1.0), -11.97, SY + 2.6 + k * 2.6, -73, 0.05, 1.2, 11);
    b.box(VC.glow, hdr('#3dfff0', 1.2), -11.9, SY + 9.7, -73, 0.08, 0.6, 9);
    // Campbell Parade: art deco shops, palms, surfboards in racks
    farGround(b, 1, '#15161c');
    K.beachShops(b, 1, 0, 80);
    for (let z = 5; z < 80; z += 10) K.palm(b, EDGE + 3.6, -z, rand(0.9, 1.05));
    for (const z of [-14, -44, -66]) K.surfRack(b, EDGE + 5.6, z);
    for (const side of [-1, 1]) for (let z = 10; z < 80; z += 16) K.lamp(b, side * (EDGE + 1.4), -z, side);
    K.crowd(b, 4.6, 10, 2, 78, 18); K.crowd(b, -4.6, -9.6, 2, 78, 12);
    const g = b.build(), gs = sand.build();
    gs.position.y = SY;
    g.add(gs);
    return g;
  };

  return {
    kit: { harbour, sea, foamMat, cobbleMat, streak, refl, seawall, endCap, ferry },
    landmarks: [
      {
        name: "环形码头 · 悉尼歌剧院",
        en: "CIRCULAR QUAY · OPERA HOUSE",
        build: quay,
      },
      {
        name: "岩石区 · 阿盖尔隧道",
        en: "THE ROCKS · ARGYLE CUT",
        build: rocks,
      },
      { name: "悉尼海港大桥", en: "SYDNEY HARBOUR BRIDGE", build: bridge },
      { name: "月神公园", en: "LUNA PARK", build: luna },
      {
        name: "维多利亚女王大厦 · 市政厅",
        en: "QVB · TOWN HALL",
        build: george,
      },
      { name: "达令港", en: "DARLING HARBOUR", build: darling },
      { name: "邦迪海滩", en: "BONDI BEACH", build: bondi },
    ],
    update(t) {
      vivid.offset.set(t * 0.012, t * 0.02);
      harbour.userData.scroll.offset.set(t * 0.01, t * 0.024);
      sea.userData.scroll.offset.set(t * 0.014, t * 0.03);
      pool.userData.scroll.offset.set(t * 0.02, t * 0.01);
      foam.offset.y = -t * 0.08;
      trails[0].offset.y = t * 1.6;
      trails[1].offset.y = -t * 1.3;
      for (const c of curtains) c.update(t);
      for (const f of bursts) f.update(t);
      for (const w of wheels) w.rotation.x = t * 0.08;
    },
  };
}
