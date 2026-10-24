// New York landmark scenes: Central Park (Bow Bridge, Bethesda, rowboats on the Lake, the Plaza Hotel), Grand Central
// with the Glory of Commerce over its clock and the Chrysler Building across the street, the Flatiron by Madison Square
// with the Worth obelisk, Wall Street (the Exchange, Federal Hall with Washington, the Charging Bull and the Fearless
// Girl, Trinity Church), and Coney Island's Wonder Wheel, Cyclone, Parachute Jump and Nathan's.
import {
  THREE,
  Batcher,
  VC,
  G,
  std,
  basic,
  hdr,
  windowTex,
  canvasTex,
  buildingGeo,
  rand,
  randi,
  pick,
  chance,
} from "../core.js";
import { at, EDGE, farGround, facadeMat, waterMat, textTex } from "./common.js";
import { beam } from "./tokyo_kit.js";
import { tiledBox } from "./beijing_kit.js";
import { frame, figure, frustum4, chrysler as chryslerTower } from "./ny_icons.js";

// vertical prism over a footprint (x, z pairs, counter-clockwise seen from above) with facade UVs like buildingGeo
function prismGeo(pts, H, tex, cellW = 1.6, cellH = 3) {
  const pos = [],
    uv = [],
    tw = tex.cols * cellW,
    th = tex.rows * cellH;
  let u = 0;
  for (let k = 0; k < pts.length; k++) {
    const a = pts[k],
      c = pts[(k + 1) % pts.length],
      len = Math.hypot(c[0] - a[0], c[1] - a[1]);
    const P = [
      [a, 0, u],
      [c, H, u + len],
      [c, 0, u + len],
      [a, 0, u],
      [a, H, u],
      [c, H, u + len],
    ];
    for (const [p, y, uu] of P) {
      pos.push(p[0], y, p[1]);
      uv.push(uu / tw, y / th);
    }
    u += len;
  }
  for (let k = 1; k < pts.length - 1; k++)
    for (const p of [pts[0], pts[k + 1], pts[k]]) {
      pos.push(p[0], H, p[1]);
      uv.push(0.002, 0.002);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

export function flagTex() {
  // the Stars and Stripes
  return canvasTex(
    512,
    270,
    (g, w, h) => {
      for (let k = 0; k < 13; k++) {
        g.fillStyle = k % 2 ? "#f4f2ec" : "#b22234";
        g.fillRect(0, (k * h) / 13, w, h / 13 + 1);
      }
      const cw = w * 0.4,
        chh = (h * 7) / 13;
      g.fillStyle = "#3c3b6e";
      g.fillRect(0, 0, cw, chh);
      g.fillStyle = "#ffffff";
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < (r % 2 ? 5 : 6); c++) {
          const x = (r % 2 ? (cw / 12) * 2 : cw / 12) + (c * cw) / 6,
            y = ((r + 0.5) * chh) / 9;
          g.beginPath();
          for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + (i * Math.PI) / 5,
              rr = i % 2 ? 2.4 : 6;
            g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
          }
          g.fill();
        }
    },
    { repeat: false },
  );
}
function limestoneTex() {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = "#d8cfbc";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(120,108,90,0.35)";
    g.lineWidth = 2;
    for (let y = 0; y <= h; y += 21) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    for (let y = 0; y < h; y += 21)
      for (let x = ((y / 21) % 2) * 32; x < w; x += 64) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y + 21);
        g.stroke();
      }
  });
}
function tickerTex(text, col) {
  const t = canvasTex(2048, 64, (g, w, h) => {
    g.fillStyle = "#050505";
    g.fillRect(0, 0, w, h);
    g.font = '700 40px "Chakra Petch", sans-serif';
    g.textBaseline = "middle";
    let x = 10;
    for (const part of text) {
      g.fillStyle = part.includes("▼")
        ? "#ff3b3b"
        : part.includes("▲")
          ? "#39ff88"
          : col;
      g.fillText(part, x, h / 2);
      x += g.measureText(part).width + 36;
    }
  });
  t.wrapS = THREE.RepeatWrapping;
  return t;
}
function plankTex() {
  // boardwalk boards
  return canvasTex(128, 128, (g, w, h) => {
    for (let y = 0; y < h; y += 16) {
      const v = randi(-12, 12);
      g.fillStyle = `rgb(${92 + v},${66 + v},${44 + v})`;
      g.fillRect(0, y, w, 15);
    }
    g.fillStyle = "rgba(20,12,6,0.6)";
    for (let y = 15; y < h; y += 16) g.fillRect(0, y, w, 1);
  });
}

export function nyLandmarks(K, ctx) {
  const { types, signPlane } = ctx;
  const stoneTex = limestoneTex();
  const lime = std({
    map: stoneTex,
    vertexColors: true,
    roughness: 0.8,
    emissive: "#ffe6c0",
    emissiveMap: stoneTex,
    emissiveIntensity: 0.16,
  });
  const limeBox = (b, x, y, z, w, h, d, col = 0xffffff) =>
    b.addM(tiledBox(w, h, d, 3.2), lime, at(x, y + h / 2, z), col);
  const bronze = std({
    color: "#5f8a76",
    roughness: 0.5,
    metalness: 0.45,
    emissive: "#1f3a30",
    emissiveIntensity: 0.8,
  });
  const polished = std({ color: "#c8a060", roughness: 0.25, metalness: 0.85, emissive: "#3a2a10", emissiveIntensity: 0.5 });
  const darkBronze = std({
    color: "#6a4a2a",
    roughness: 0.35,
    metalness: 0.7,
    emissive: "#2a1808",
    emissiveIntensity: 0.6,
  });
  const plazaWin = windowTex({ wall: "#ece6da", glass: "#141820", lit: ["#ffe0a8", "#fff0d0"], litChance: 0.55, frame: "#f8f4ec", ledge: "#d8d0c0", cols: 8, rows: 16 });
  const plazaMat = facadeMat(plazaWin, { k: 0.9 });
  const lake = waterMat("#141c34", 8),
    ocean = waterMat("#101a32", 12);
  const lampPost = (b, x, z, side) => {
    // Central Park's bishop's-crook lamppost
    b.cyl(VC.metal, "#1f2a22", x, 2.0, z, 0.07, 4.0, "cyl8");
    beam(b, VC.metal, x, 3.9, z, x - side * 0.35, 4.35, z, 0.06, "#1f2a22");
    beam(
      b,
      VC.metal,
      x - side * 0.35,
      4.35,
      z,
      x - side * 0.7,
      4.2,
      z,
      0.06,
      "#1f2a22",
    );
    b.cyl(
      VC.glow,
      hdr("#ffd28a", 2.0),
      x - side * 0.72,
      3.95,
      z,
      0.17,
      0.36,
      "cyl6",
    );
    b.add(
      G.cone,
      VC.metal,
      x - side * 0.72,
      4.22,
      z,
      0.42,
      0.2,
      0.42,
      0,
      0,
      0,
      "#1f2a22",
    );
  };
  const horse = (b, x, z) => {
    // horse and white carriage waiting by the path
    b.add(
      G.sph,
      VC.solid,
      x,
      1.35,
      z - 1.6,
      0.7,
      0.75,
      1.6,
      0,
      0,
      0,
      "#3a2a20",
    );
    for (const [dx, dz] of [
      [-0.22, -2.1],
      [0.22, -2.1],
      [-0.22, -1.1],
      [0.22, -1.1],
    ])
      b.box(VC.solid, "#2a1e16", x + dx, 0.6, z + dz, 0.12, 1.2, 0.12);
    beam(b, VC.solid, x, 1.6, z - 2.3, x, 2.15, z - 2.85, 0.32, "#3a2a20");
    b.add(
      G.box,
      VC.solid,
      x,
      2.15,
      z - 3.05,
      0.26,
      0.3,
      0.6,
      0.5,
      0,
      0,
      "#3a2a20",
    );
    b.block(VC.solid, "#f2f0ea", x, 0.7, z + 0.6, 1.5, 0.8, 2.0);
    b.block(VC.solid, "#b3202c", x, 1.5, z + 1.0, 1.3, 0.25, 1.0);
    b.add(
      G.box,
      VC.solid,
      x,
      2.3,
      z + 1.25,
      1.5,
      0.08,
      1.4,
      0.3,
      0,
      0,
      "#141418",
    );
    for (const dz of [0, 1.3])
      for (const dx of [-0.78, 0.78])
        b.add(
          G.tor,
          VC.metal,
          x + dx,
          0.55,
          z + dz,
          1.1,
          1.1,
          1.1,
          0,
          Math.PI / 2,
          0,
          "#e8c547",
        );
  };

  // ---------- 中央公园 ----------
  const centralPark = () => {
    const b = new Batcher();
    farGround(b, 1, "#16231a");
    for (const [x, z, w, d] of [
      [-14.4, -40, 7.2, 80],
      [-54, -10, 72, 20],
      [-76, -50, 28, 60],
    ])
      b.box(VC.solid, "#16231a", x, -0.1, z, w, 0.2, d);
    for (const side of [-1, 1])
      b.box(VC.solid, "#3a3836", side * 7.2, 0.035, -40, 6.4, 0.03, 80);
    // the Lake with Bow Bridge running along it and the towers of Central Park South beyond the trees
    b.box(VC.solid, "#0c1220", -40, -1.6, -50, 44, 0.2, 60);
    for (const [x, z, w, d] of [
      [-18, -50, 0.6, 60],
      [-62, -50, 0.6, 60],
      [-40, -20, 44, 0.6],
    ])
      b.box(VC.solid, "#4a4844", x, -0.55, z, w, 1.1, d);
    b.add(G.plane, lake, -40, -0.8, -50, 44, 60, 1, -Math.PI / 2, 0, 0);
    const bridge = (t) => [
      -31,
      1.0 + 2.2 * Math.sin(Math.PI * t),
      -26 - 48 * t,
    ];
    for (let k = 0; k < 24; k++) {
      const [x, y, z] = bridge(k / 24),
        [, y1, z1] = bridge((k + 1) / 24);
      beam(b, VC.solid, x, y, z, x, y1, z1, 3.2, "#e6dfcf", 0.35);
      for (const dx of [-1.5, 1.5]) {
        beam(
          b,
          VC.solid,
          x + dx,
          y + 1.0,
          z,
          x + dx,
          y1 + 1.0,
          z1,
          0.08,
          "#efe8d8",
        );
        b.box(VC.solid, "#efe8d8", x + dx, y + 0.5, z, 0.08, 1.0, 0.08);
      }
    }
    for (const t of [0.4, 0.6]) {
      const [x, y, z] = bridge(t);
      for (const dx of [-1.5, 1.5]) {
        b.cyl(VC.metal, "#1f2a22", x + dx, y + 1.6, z, 0.05, 1.2);
        b.cyl(
          VC.glow,
          hdr("#ffd28a", 2.2),
          x + dx,
          y + 2.3,
          z,
          0.14,
          0.3,
          "cyl6",
        );
      }
    }
    for (const [x, z] of [
      [-22, -60],
      [-46, -36],
      [-40, -70],
    ]) {
      b.add(
        G.sph,
        VC.solid,
        x,
        -0.7,
        z,
        1.2,
        0.5,
        3.2,
        0,
        rand(0, 3),
        0,
        "#5a3a24",
      );
    }
    for (const [x, z, h] of [
      [-84, -30, 118],
      [-88, -52, 150],
      [-82, -72, 104],
    ]) {
      b.addM(
        buildingGeo(10, h, 10, ctx.glass, 1.3, 2.6),
        ctx.glassMat,
        at(x, 0, z),
        "#c9d6ff",
      );
      b.box(VC.glow, hdr("#e8f4ff", 1.6), x, h + 0.2, z, 10.2, 0.3, 10.2);
    }
    // Bethesda Fountain with the Angel of the Waters, the terrace arcade behind it, the elm-lined Mall
    const fx = 24,
      fz = -44;
    b.addM(
      new THREE.CylinderGeometry(9, 9, 0.9, 40, 1, true),
      lime,
      at(fx, 0.45, fz),
      0xffffff,
    );
    b.addM(
      new THREE.RingGeometry(8.5, 9, 40).rotateX(-Math.PI / 2),
      lime,
      at(fx, 0.9, fz),
      0xffffff,
    );
    b.add(
      new THREE.CircleGeometry(8.6, 32).rotateX(-Math.PI / 2),
      lake,
      fx,
      0.6,
      fz,
    );
    b.addM(
      new THREE.CylinderGeometry(3.4, 2.2, 0.8, 24),
      lime,
      at(fx, 1.6, fz),
      0xffffff,
    );
    b.cyl(lime, 0xffffff, fx, 2.6, fz, 0.6, 2.2);
    b.addM(
      new THREE.CylinderGeometry(1.8, 1.2, 0.5, 20),
      lime,
      at(fx, 3.8, fz),
      0xffffff,
    );
    b.cyl(bronze, 0xffffff, fx, 4.6, fz, 0.35, 1.2);
    b.add(G.sph, bronze, fx, 5.9, fz, 0.7, 1.6, 0.6);
    b.sph(bronze, 0xffffff, fx, 7.0, fz, 0.28);
    for (const dz of [-1, 1])
      b.add(
        G.sph,
        bronze,
        fx + 0.2,
        6.5,
        fz + dz * 0.75,
        0.25,
        1.6,
        0.9,
        0,
        0,
        dz * 0.4,
      );
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      b.add(
        G.plane,
        K.steamMat,
        fx + Math.cos(a) * 2.6,
        2.6,
        fz + Math.sin(a) * 2.6,
        0.9,
        1.6,
        1,
        0,
        -a,
        0,
      );
    }
    for (let k = 0; k < 6; k++)
      b.box(
        VC.glow,
        hdr("#ffe6c0", 1.6),
        fx + Math.cos(k) * 9.5,
        0.2,
        fz + Math.sin(k) * 9.5,
        0.5,
        0.3,
        0.5,
      );
    limeBox(b, 44, 0, fz, 6, 7, 34);
    for (let k = -3; k <= 3; k++) {
      b.box(
        VC.glow,
        hdr("#ffcf8a", 0.9),
        40.96,
        2.6,
        fz + k * 4.4,
        0.05,
        4.2,
        2.6,
      );
      b.cyl(
        VC.glow,
        hdr("#ffcf8a", 0.9),
        40.96,
        4.7,
        fz + k * 4.4,
        1.3,
        0.05,
        "cyl",
        0,
        Math.PI / 2,
      );
    }
    for (let z = 2; z < 30; z += 4.5)
      for (const x of [12, 19]) K.elm(b, x, -z, rand(0.95, 1.15));
    // trees in full leaf everywhere else, lampposts, the carriages, people out for the evening
    for (let i = 0; i < 26; i++) {
      const side = i % 2 ? 1 : -1,
        x = side * rand(11, 34),
        z = -rand(2, 78);
      if (side < 0 && x < -14 && z < -18) continue;
      if (side > 0 && Math.hypot(x - fx, z - fz) < 12) continue;
      (i % 3 ? K.maple : K.elm)(b, x, z, rand(0.95, 1.25));
    }
    for (const side of [-1, 1])
      for (let z = 5; z < 80; z += 13)
        lampPost(b, side * (EDGE + 1.4), -z, side);
    horse(b, 7.2, -16);
    horse(b, -7.2, -58);
    K.crowd(b, 4.6, 10, 2, 78, 14);
    K.crowd(b, -4.6, -10, 2, 78, 12);
    // rowboats out on the Lake from the boathouse, urns of flowers along Bow Bridge
    for (const [x, z, a] of [[-26, -34, 0.4], [-34, -52, -0.8], [-48, -40, 1.6], [-28, -66, 2.4], [-54, -70, -0.3]]) {
      b.add(G.sphLow, VC.solid, x, -0.7, z, 1.3, 0.55, 3.4, 0, a, 0, "#c8b89a");
      b.add(G.sphLow, VC.solid, x, -0.62, z, 1.1, 0.4, 3.0, 0, a, 0, "#5a3a24");
      K.person(b, x, z, { seated: true, y: -0.6 });
      if (chance(0.6)) K.person(b, x + Math.sin(a) * 0.9, z + Math.cos(a) * 0.9, { seated: true, y: -0.6 });
      for (const e of [-1, 1]) beam(b, VC.solid, x, -0.2, z, x + Math.cos(a) * e * 1.8, -0.8, z - Math.sin(a) * e * 1.8, 0.05, "#8a6a44");
    }
    for (let k = 1; k < 8; k++) {
      const t = k / 8, [x, y, z] = [-31, 1.0 + 2.2 * Math.sin(Math.PI * t), -26 - 48 * t];
      for (const dx of [-1.6, 1.6]) { b.cyl(VC.solid, "#e6dfcf", x + dx, y + 1.25, z, 0.22, 0.5, "cyl8"); b.sph(VC.solid, pick(["#e83a5a", "#ffd23d", "#c85ad8"]), x + dx, y + 1.6, z, 0.26, true); }
    }
    // the Plaza Hotel at the corner of the park: white stone, the green copper mansard with its gables and turrets
    const PX = -64, PZ = -100;
    b.addM(buildingGeo(26, 52, 34, plazaWin, 1.5, 3.0), plazaMat, at(PX, 0, PZ), "#ffffff");
    b.add(G.cone4, VC.solid, PX, 56, PZ, 26 * 1.36, 8, 34 * 1.36, 0, 0, 0, "#3e7a6a");
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { b.cyl(VC.solid, "#f2ece2", PX + dx * 12, 54, PZ + dz * 16, 2.2, 6, "cyl8"); b.add(G.cone8, VC.solid, PX + dx * 12, 59, PZ + dz * 16, 5, 4.4, 5, 0, 0, 0, "#3e7a6a"); }
    for (let k = -2; k <= 2; k++) b.add(G.cone4, VC.solid, PX + 13.2, 55, PZ + k * 6, 1.2, 3, 3.4, 0, 0, 0, "#f2ece2");
    b.box(VC.glow, hdr("#ffe8c0", 1.6), PX + 13.1, 52.4, PZ, 0.1, 0.5, 33);
    b.add(G.plane, flagMat, PX + 13.6, 8, PZ + 6, 2, 1.1, 1, 0, Math.PI / 2, 0);
    return b.build();
  };

  // ---------- 中央车站 · 克莱斯勒大厦 ----------
  const gcText = basic({
    map: textTex("GRAND CENTRAL TERMINAL", {
      w: 1024,
      h: 96,
      color: "#3a2e20",
      size: 0.55,
      font: '"Chakra Petch", serif',
      weight: 700,
    }),
    transparent: true,
    color: hdr("#ffffff", 1),
  });
  const clockTex = canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = "#fff4dc";
      g.beginPath();
      g.arc(w / 2, h / 2, 120, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#2a2014";
      g.lineWidth = 10;
      g.stroke();
      g.fillStyle = "#2a2014";
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        g.fillRect(
          w / 2 + Math.cos(a) * 100 - 4,
          h / 2 + Math.sin(a) * 100 - 4,
          8,
          8,
        );
      }
      g.lineCap = "round";
      g.lineWidth = 9;
      g.beginPath();
      g.moveTo(w / 2, h / 2);
      g.lineTo(w / 2 + 50, h / 2 - 30);
      g.stroke();
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(w / 2, h / 2);
      g.lineTo(w / 2 - 12, h / 2 - 88);
      g.stroke();
    },
    { repeat: false },
  );
  const clockMat = basic({
    map: clockTex,
    transparent: true,
    color: hdr("#ffffff", 0.85),
  });
  const chryWin = windowTex({
    wall: "#c9c4bc",
    glass: "#141820",
    lit: ["#fff1c4", "#e6f0ff"],
    litChance: 0.45,
    frame: "#e8e4dc",
    cols: 8,
    rows: 16,
  });
  const chryMat = facadeMat(chryWin, { k: 0.8 });
  const metlife = basic({ map: textTex("MetLife", { w: 1024, h: 192, color: "#6ab0ff", glow: "#2a6aff", font: '"Helvetica Neue", Arial, sans-serif', weight: 700, size: 0.7 }), transparent: true, color: hdr("#ffffff", 1.5) });
  const grandCentral = () => {
    const b = new Batcher();
    for (const side of [-1, 1]) farGround(b, side, "#121116");
    // the terminal's Beaux-Arts front: three arched windows, paired columns, the clock and its sculptures
    const fx = 24,
      zc = -40;
    limeBox(b, fx + 13, 0, zc, 26, 22, 48);
    for (const dz of [-12, 0, 12]) {
      b.box(VC.solid, "#1a140e", fx - 0.02, 9, zc + dz, 0.06, 13, 8.6);
      b.box(
        VC.glow,
        hdr("#ffd38a", 0.9),
        fx - 0.05,
        9,
        zc + dz,
        0.04,
        12.6,
        8.2,
      );
      b.cyl(
        VC.glow,
        hdr("#ffd38a", 0.9),
        fx - 0.05,
        15.4,
        zc + dz,
        4.1,
        0.04,
        "cyl",
        0,
        Math.PI / 2,
      );
      for (let k = -2; k <= 2; k++)
        b.box(
          VC.solid,
          "#3a2e20",
          fx - 0.08,
          10.5,
          zc + dz + k * 1.6,
          0.05,
          15,
          0.12,
        );
      for (let y = 4; y < 19; y += 2.6)
        b.box(VC.solid, "#3a2e20", fx - 0.08, y, zc + dz, 0.05, 0.1, 8.2);
    }
    for (const dz of [-18, -6, 6, 18])
      for (const o of [-1.1, 1.1]) {
        b.cyl(lime, 0xffffff, fx - 0.9, 10.5, zc + dz + o, 0.7, 17, "cyl");
        b.box(VC.solid, "#cfc6b2", fx - 0.9, 19.2, zc + dz + o, 1.8, 0.6, 1.8);
      }
    limeBox(b, fx - 0.6, 19.5, zc, 1.6, 3.2, 48);
    b.add(G.plane, gcText, fx - 1.45, 21.1, zc, 22, 2.1, 1, 0, -Math.PI / 2, 0);
    limeBox(b, fx + 1, 22, zc, 4, 6, 18);
    b.add(
      G.plane,
      clockMat,
      fx - 1.05,
      26,
      zc,
      5.4,
      5.4,
      1,
      0,
      -Math.PI / 2,
      0,
    );
    // the Glory of Commerce on top of the clock: Mercury with his winged helmet, Hercules and Minerva seated either side
    const c = 0xffffff;
    const M = figure(frame(b, fx - 0.4, 28, zc, 3.4, Math.PI), lime, c, { arms: "out", cloak: true });
    for (const e of [-1, 1]) M.add(G.cone4, lime, 0, 1.9, e * 0.15, 0.06, 0.22, 0.14, 0, 0, e * 0.9, c);
    M.limb(lime, c, [0.05, 0.4, -0.32], [0.08, 1.6, -0.34], 0.025, 0.025, 6);   // the caduceus
    for (const [e, helmet] of [[1, false], [-1, true]]) {
      const S = frame(b, fx - 0.6, 28.1, zc - e * 5.2, 3.0, Math.PI);
      S.limb(lime, c, [0, 0.45, 0], [-0.05, 1.3, e * 0.35], 0.24, 0.2, 8);
      S.ell(lime, c, -0.05, 1.55, e * 0.45, 0.14, 0.17, 0.14);
      if (helmet) S.add(G.cone8, lime, -0.05, 1.76, e * 0.47, 0.3, 0.26, 0.3, 0, 0, 0, c);
      for (const k of [-1, 1]) { S.limb(lime, c, [0, 0.45, k * 0.12], [0.5, 0.48, k * 0.14], 0.12, 0.1, 6); S.limb(lime, c, [0.5, 0.48, k * 0.14], [0.55, -0.1, k * 0.16], 0.09, 0.07, 6); }
      S.limb(lime, c, [-0.02, 1.2, e * 0.55], [0.3, 0.7, e * 0.75], 0.08, 0.06, 6);
      if (helmet) S.cyl(lime, c, 0.25, 0.75, -e * 0.25, 0.32, 0.06, "cyl", 0, Math.PI / 2);   // Minerva's shield
      else S.limb(lime, c, [0.3, 0.7, e * 0.75], [0.35, -0.1, e * 0.8], 0.06, 0.09, 6);   // Hercules' club
    }
    for (let k = -4; k <= 4; k++)
      b.box(
        VC.glow,
        hdr("#ffd9a8", 2.2),
        fx - 3,
        0.2,
        zc + k * 5,
        0.5,
        0.3,
        0.5,
      );
    // the MetLife slab rising behind it
    b.addM(
      buildingGeo(26, 96, 56, ctx.glass, 1.3, 2.6),
      ctx.glassMat,
      at(fx + 36, 0, zc),
      "#a9b8d9",
    );
    b.box(VC.glow, hdr("#e8f4ff", 1.4), fx + 36, 96.2, zc, 26.2, 0.3, 56.2);
    b.add(G.plane, metlife, fx + 22.9, 90, zc, 24, 4.6, 1, 0, -Math.PI / 2, 0);
    for (let z = 4; z < 78; z += rand(5, 7)) K.taxi(b, EDGE + 2.7, -z);
    K.crowd(b, 6, 11, 4, 76, 22);
    // across the street: the Chrysler Building up close, midtown towers around it
    ctx.row(b, -1, 0, 30);
    ctx.row(b, -1, 64, 80);
    chryslerTower(b, { x: -30, y: 0, z: -48, s: 0.53, wall: chryMat, tex: chryWin, steel: VC.metal, solid: VC.solid, glow: VC.glow, mc: "#c9ced6", gc: hdr("#fff1c4", 2.2) });
    for (let z = 4; z < 80; z += 16) ctx.lamp(b, -(EDGE + 1.5), -z, -1);
    K.crowd(b, -4.6, -10, 2, 78, 14);
    return b.build();
  };

  // ---------- 熨斗大厦 · 麦迪逊广场 ----------
  const flatWin = windowTex({
    wall: "#cdbfa6",
    glass: "#14161c",
    lit: ["#ffe0a8", "#fff4dc"],
    litChance: 0.5,
    frame: "#e8dcc4",
    ledge: "#a8987e",
    cols: 8,
    rows: 16,
  });
  const flatMat = facadeMat(flatWin, { k: 0.85 });
  const flatBase = windowTex({ wall: "#c4b494", glass: "#14161c", lit: ["#ffe0a8", "#fff0d0"], litChance: 0.6, arch: true, frame: "#e0d4bc", ledge: "#9a8a6e", cols: 8, rows: 16 });
  const flatBaseMat = facadeMat(flatBase, { k: 0.85 });
  const flatTop = windowTex({ wall: "#bcaa8c", glass: "#14161c", lit: ["#ffe0a8", "#fff4dc"], litChance: 0.5, arch: true, frame: "#e8dcc4", cols: 8, rows: 16 });
  const flatTopMat = facadeMat(flatTop, { k: 0.85 });
  const metWin = windowTex({
    wall: "#e8e4dc",
    glass: "#14161c",
    lit: ["#fff4dc", "#e6f0ff"],
    litChance: 0.45,
    frame: "#f4f0e8",
    cols: 6,
    rows: 16,
  });
  const metMat = facadeMat(metWin, { k: 0.9 });
  const flatiron = () => {
    const b = new Batcher();
    for (const side of [-1, 1]) farGround(b, side, "#121116");
    // the wedge, its rounded prow pointing at the runner: rusticated limestone base, the shaft with its bays down
    // Broadway, the arched top floors under the heavy cornice; the glass "cowcatcher" shop at the tip
    const tip = [];
    for (let k = 1; k < 6; k++) { const a = (k / 6) * Math.PI; tip.push([14.1 + Math.cos(a) * 1.1, -23.2 + Math.sin(a) * 1.1]); }
    const foot = [[13, -23.2], [13, -74], [40, -74], [15.2, -23.2], ...tip];
    const grow = (d) => foot.map(([x, z]) => { const dx = x - 22, dz = z + 52, l = Math.hypot(dx, dz); return [x + (dx / l) * d, z + (dz / l) * d]; });
    const H = 58;
    b.addM(prismGeo(foot, 17, flatBase, 1.6, 3.2), flatBaseMat, at(0, 0, 0), "#ffffff");
    b.addM(prismGeo(foot, 33, flatWin, 1.6, 3.2), flatMat, at(0, 17, 0), "#ffffff");
    b.addM(prismGeo(foot, 8, flatTop, 1.6, 3.2), flatTopMat, at(0, 50, 0), "#ffffff");
    b.addM(prismGeo(grow(0.4), 0.7, flatWin, 1.6, 3.2), VC.solid, at(0, 16.7, 0), "#b8a888");
    b.addM(prismGeo(grow(0.3), 0.6, flatWin, 1.6, 3.2), VC.solid, at(0, 49.8, 0), "#b8a888");
    b.addM(prismGeo(grow(0.9), 1.4, flatWin, 1.6, 3.2), VC.solid, at(0, H, 0), "#a8987e");
    for (let z = -30; z > -72; z -= 8) b.addM(buildingGeo(0.8, 33, 3.0, flatWin, 1.6, 3.2), flatMat, at(12.6, 17, z), "#f4ece0");
    K.shopWindow(b, 12.95, 2.2, -48, 1, 48, 3.2, "#ffd9a0", 0.5);
    b.box(VC.glow, hdr("#ffe0b0", 0.75), 14.1, 2.3, -21.6, 2.3, 4.2, 1.3);
    b.box(VC.solid, "#2a2622", 14.1, 4.55, -21.6, 2.6, 0.5, 1.6);
    for (let k = 0; k < 6; k++)
      b.box(VC.glow, hdr("#ffe6c0", 2.0), 11.6, 0.2, -24 - k * 9, 0.5, 0.3, 0.5);
    // the plaza in front of the prow: green umbrellas over the tables, and the Worth monument's obelisk
    for (let k = 0; k < 4; k++) {
      const x = 6.2 + (k % 2) * 2.6, z = -4 - k * 4;
      b.cyl(VC.metal, "#c8ccd0", x, 1.2, z, 0.04, 2.4, "cyl6");
      b.add(G.cone8, VC.solid, x, 2.5, z, 2.4, 0.55, 2.4, 0, 0, 0, "#2a6a3a");
      b.cyl(VC.metal, "#3a3a3e", x, 0.38, z, 0.4, 0.06, "cyl8");
      for (const e of [-0.7, 0.7]) K.person(b, x + e, z, { seated: true, y: 0.42 });
    }
    b.block(VC.solid, "#7a766c", 8.2, 0, -14, 2.8, 1.2, 2.8);
    b.block(VC.solid, "#8a8478", 8.2, 1.2, -14, 2.1, 1.4, 2.1);
    b.addM(frustum4(0.85, 1.45, 11), VC.solid, at(8.2, 2.6, -14), "#9a948a");
    b.add(G.cone4, VC.solid, 8.2, 14.2, -14, 1.2, 1.2, 1.2, 0, 0, 0, "#9a948a");
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; b.box(VC.metal, "#1a1a1e", 8.2 + Math.cos(a) * 2.2, 0.5, -14 + Math.sin(a) * 2.2, 0.06, 1.0, 0.06); }
    // Madison Square Park across the street: elms, a lit burger kiosk, the Met Life clock tower behind
    for (let i = 0; i < 12; i++)
      K.elm(b, -rand(12, 30), -rand(4, 76), rand(0.95, 1.2));
    b.block(VC.solid, "#2a3a2a", -16, 0, -36, 4, 3, 4);
    b.add(G.cone4, VC.solid, -16, 3.6, -36, 5.6, 1.2, 5.6, 0, 0, 0, "#1f5a3a");
    b.box(VC.glow, hdr("#ffd9a0", 1.0), -13.98, 1.5, -36, 0.04, 1.8, 3.2);
    signPlane(b, -13.9, 3.3, -36, -1, 3.2, 10);
    const mx = -38,
      mz = -56;
    b.addM(
      buildingGeo(17, 62, 17, metWin, 1.4, 2.8),
      metMat,
      at(mx, 0, mz),
      "#ffffff",
    );
    for (let f = 0; f < 4; f++) {
      const a = (f * Math.PI) / 2;
      b.add(
        G.plane,
        clockMat,
        mx + Math.sin(a) * 8.6,
        56,
        mz + Math.cos(a) * 8.6,
        6,
        6,
        1,
        0,
        a,
        0,
      );
    }
    b.add(G.cone4, VC.solid, mx, 68, mz, 17.5, 12, 17.5, 0, 0, 0, "#d8d2c4");
    b.cyl(VC.glow, hdr("#ffd36a", 2.0), mx, 75.5, mz, 2.2, 3.2, "cyl8");
    b.add(
      G.cone,
      VC.glow,
      mx,
      79,
      mz,
      3.4,
      4,
      3.4,
      0,
      0,
      0,
      hdr("#ffd36a", 1.6),
    );
    b.cyl(VC.metal, "#e8e2d0", mx, 83, mz, 0.15, 4);
    for (const side of [-1, 1])
      for (let z = 4; z < 80; z += 16)
        ctx.lamp(b, side * (EDGE + 1.5), -z, side);
    for (let z = 8; z < 72; z += rand(9, 14)) K.taxi(b, -(EDGE + 2.7), -z);
    K.crowd(b, 5, 10.5, 4, 76, 18);
    K.crowd(b, -5, -10, 4, 76, 12);
    return b.build();
  };

  // ---------- 华尔街 ----------
  const flagMat = std({
    map: flagTex(),
    roughness: 0.8,
    emissive: "#ffffff",
    emissiveMap: flagTex(),
    emissiveIntensity: 0.45,
    side: THREE.DoubleSide,
  });
  const nyseText = basic({
    map: textTex("NEW YORK STOCK EXCHANGE", {
      w: 1024,
      h: 96,
      color: "#2a2418",
      size: 0.55,
      font: '"Chakra Petch", serif',
      weight: 700,
    }),
    transparent: true,
  });
  const tick = tickerTex(
    [
      "DASH ▲2.41",
      "CITY ▲1.86",
      "NYC ▼0.42",
      "TAXI ▲0.95",
      "PIZZA ▲3.10",
      "METRO ▼1.05",
      "BAGEL ▲0.37",
      "RAIN ▼0.88",
      "NEON ▲5.20",
      "JAZZ ▲1.64",
      "LOFT ▼0.21",
      "DELI ▲0.73",
    ],
    "#ffd23d",
  );
  const tickMat = basic({ map: tick, color: hdr("#ffffff", 1.5) });
  const temple = (
    b,
    x,
    z0,
    z1,
    { cols = 6, h = 16, r = 0.9, face = -1 } = {},
  ) => {
    // classical portico facing the track
    const len = z1 - z0,
      zc = -(z0 + len / 2);
    limeBox(b, x - face * 1.2, 0, zc, 6, 2.2, len + 2);
    for (let k = 0; k < cols; k++) {
      const z = -(z0 + (len * (k + 0.5)) / cols);
      b.cyl(lime, 0xffffff, x, 2.2 + h / 2, z, r, h, "cyl");
      b.box(VC.solid, "#cfc6b2", x, 2.2 + h + 0.35, z, r * 2.6, 0.7, r * 2.6);
    }
    limeBox(b, x - face * 0.4, 2.2 + h + 0.7, zc, 2.6, 2.6, len + 1);
    const tri = new THREE.Shape();
    tri.moveTo(-len / 2 - 0.6, 0);
    tri.lineTo(len / 2 + 0.6, 0);
    tri.lineTo(0, 5);
    tri.closePath();
    const tg = new THREE.ExtrudeGeometry(tri, {
      depth: 2.2,
      bevelEnabled: false,
    });
    tg.rotateY(Math.PI / 2);
    b.addM(tg, lime, at(x - 1.1, 2.2 + h + 3.3, zc), 0xffffff);
    return { top: 2.2 + h, zc, len };
  };
  const bull = (b, x, z) => {
    // the Charging Bull, head down and horns out toward the runner, his weight thrown forward, the tail whipped up
    b.block(VC.solid, "#4a4844", x, 0, z, 2.9, 0.3, 5.8);
    const F = frame(b, x, 0.3, z, 1, -Math.PI / 2), c = 0xffffff;
    F.ell(darkBronze, c, 0.2, 1.62, 0, 1.55, 0.82, 0.74);   // the barrel
    F.ell(darkBronze, c, 1.0, 1.82, 0, 0.88, 0.92, 0.78);   // the shoulders, bunched
    F.ell(darkBronze, c, -1.25, 1.78, 0, 0.82, 0.84, 0.7);   // the haunches, raised
    F.limb(darkBronze, c, [1.5, 1.95, 0], [2.35, 1.15, 0], 0.62, 0.44, 10);   // the neck, driven down
    F.ell(darkBronze, c, 2.6, 0.98, 0, 0.56, 0.36, 0.34);   // the head
    F.ell(polished, c, 3.0, 0.78, 0, 0.26, 0.22, 0.27, true);   // the muzzle, rubbed bright by the crowds
    for (const e of [-1, 1]) {
      F.limb(polished, c, [2.45, 1.22, e * 0.26], [2.6, 1.48, e * 0.82], 0.11, 0.08, 6);   // the horns, out and forward
      F.limb(polished, c, [2.6, 1.48, e * 0.82], [3.15, 1.44, e * 0.98], 0.08, 0.02, 6);
      F.limb(darkBronze, c, [1.15, 1.35, e * 0.42], [1.55, 0.7, e * 0.46], 0.25, 0.17, 8);   // the forelegs, braced out in front
      F.limb(darkBronze, c, [1.55, 0.7, e * 0.46], [1.95, 0.05, e * 0.48], 0.16, 0.12, 8);
      F.limb(darkBronze, c, [-1.35, 1.4, e * 0.38], [-1.95, 0.75, e * 0.4], 0.3, 0.18, 8);   // the hind legs, pushing off
      F.limb(darkBronze, c, [-1.95, 0.75, e * 0.4], [-1.85, 0.05, e * 0.42], 0.15, 0.12, 8);
    }
    F.limb(darkBronze, c, [-1.95, 2.1, 0], [-2.35, 2.7, 0.1], 0.1, 0.07, 6);   // the tail, curling up over his back
    F.limb(darkBronze, c, [-2.35, 2.7, 0.1], [-1.95, 3.15, 0.3], 0.07, 0.05, 6);
    F.ell(darkBronze, c, -1.85, 3.25, 0.34, 0.14, 0.2, 0.12, true);
    b.box(VC.glow, hdr("#ffe0b0", 2.0), x + 2, 0.2, z, 0.5, 0.3, 0.5);
    b.box(VC.glow, hdr("#ffe0b0", 2.0), x - 2, 0.2, z - 2, 0.5, 0.3, 0.5);
  };
  const trinity = (b, x, z) => {
    // Trinity Church: brownstone nave, tower and lit spire
    b.block(VC.solid, "#4a3428", x, 0, z, 12, 13, 20);
    b.add(
      G.cone4,
      VC.solid,
      x,
      15.5,
      z,
      12.5,
      5,
      20.5,
      0,
      Math.PI / 4,
      0,
      "#3a2a22",
    );
    for (let k = -3; k <= 3; k++) {
      b.box(
        VC.glow,
        hdr(pick(["#ff9a5a", "#7ab8ff", "#ffd36a", "#c86aff"]), 0.8),
        x + 6.02,
        6.5,
        z + k * 2.6,
        0.05,
        5.5,
        1.1,
      );
      b.add(
        G.cone4,
        VC.glow,
        x + 6.02,
        9.6,
        z + k * 2.6,
        0.8,
        1.2,
        0.1,
        0,
        Math.PI / 2,
        0,
        hdr("#ffd36a", 0.8),
      );
    }
    const tz = z + 13.5;
    b.block(VC.solid, "#4a3428", x, 0, tz, 7, 32, 7);
    b.box(VC.glow, hdr("#ffd9a8", 1.0), x + 3.52, 22, tz, 0.05, 6, 2.2);
    b.add(
      G.cone4,
      VC.solid,
      x,
      32 + 11,
      tz,
      6,
      22,
      6,
      0,
      Math.PI / 4,
      0,
      "#5a4234",
    );
    b.box(VC.glow, hdr("#ffd9a8", 1.6), x + 4, 0.2, tz, 0.5, 0.3, 0.5);
    for (let k = 0; k < 10; k++)
      b.block(
        VC.solid,
        "#6a6660",
        x + rand(7, 11),
        0,
        z + rand(-9, 9),
        0.5,
        0.9,
        0.12,
      );
  };
  const wallStreet = () => {
    const b = new Batcher();
    for (const side of [-1, 1]) farGround(b, side, "#121116");
    // the Exchange: six columns with the giant flag behind them, its name on the frieze
    ctx.row(b, 1, 0, 24, { h: [40, 80] });
    const T = temple(b, 13, 28, 58, { cols: 6, h: 15, r: 0.95, face: -1 });
    limeBox(b, 22, 0, T.zc, 16, 30, T.len + 1);
    b.add(
      G.plane,
      flagMat,
      13.97,
      10.2,
      T.zc,
      T.len - 4,
      12,
      1,
      0,
      -Math.PI / 2,
      0,
    );
    b.add(
      G.plane,
      nyseText,
      12.0,
      T.top + 1.95,
      T.zc,
      18,
      1.7,
      1,
      0,
      -Math.PI / 2,
      0,
    );
    for (let k = -3; k <= 3; k++)
      b.box(
        VC.glow,
        hdr("#ffe6c0", 2.2),
        9.4,
        0.2,
        T.zc + k * 4,
        0.5,
        0.3,
        0.5,
      );
    ctx.row(b, 1, 62, 80, { h: [40, 80] });
    // Federal Hall with George Washington on its steps, the Bull, Trinity Church closing the street
    ctx.row(b, -1, 0, 26, { h: [40, 80] });
    bull(b, -7.4, -12);
    const F = temple(b, -13.5, 30, 54, { cols: 8, h: 11, r: 0.65, face: 1 });
    limeBox(b, -23, 0, F.zc, 16, 16, F.len + 1);
    for (let k = 0; k < 5; k++)
      b.block(
        VC.solid,
        "#cfc6b2",
        -11.5 + k * 0.5,
        0,
        F.zc,
        0.6,
        2.2 - k * 0.42,
        F.len - 2,
      );
    b.block(VC.solid, "#cfc6b2", -11.6, 0, F.zc, 2.2, 2.6, 2.2);
    figure(frame(b, -11.6, 2.6, F.zc, 1.7, 0), darkBronze, 0xffffff, { arms: "out", cloak: true });   // Washington, where he took the oath
    figure(frame(b, 9.4, 0.12, T.zc + 7, 0.68, 0), darkBronze, 0xffffff, { arms: "hips", skirt: true, hair: true });   // the Fearless Girl, staring down the Exchange
    b.block(VC.solid, "#6a6660", 9.4, 0, T.zc + 7, 1.1, 0.12, 1.1);
    trinity(b, -24, -70);
    // stock tickers running along the canyon
    for (const side of [-1, 1]) {
      b.add(
        G.plane,
        tickMat,
        side * 10.8,
        5.2,
        -12,
        22,
        0.9,
        1,
        0,
        (-side * Math.PI) / 2,
      );
      b.add(
        G.plane,
        tickMat,
        side * 10.8,
        5.2,
        -70,
        18,
        0.9,
        1,
        0,
        (-side * Math.PI) / 2,
      );
      for (let z = 4; z < 80; z += 16)
        ctx.lamp(b, side * (EDGE + 1.5), -z, side);
    }
    K.nypd(b, EDGE + 2.8, -64);
    K.nypd(b, -(EDGE + 2.8), -24);
    K.crowd(b, 5, 9.5, 2, 78, 20);
    K.crowd(b, -5, -9.5, 2, 78, 20);
    return b.build();
  };

  // ---------- 康尼岛 ----------
  const nathans = basic({ map: textTex("NATHAN'S FAMOUS", { w: 1024, h: 192, color: "#ffd23d", bg: "#1f6a3a", border: "#ffd23d", size: 0.56 }), color: hdr("#ffffff", 1.3) });
  const cycloneSign = basic({ map: textTex("CYCLONE", { w: 1024, h: 256, color: "#ffffff", bg: "#c8202c", border: "#ffffff", size: 0.62 }), color: hdr("#ffffff", 1.25), side: THREE.DoubleSide });
  const planks = plankTex();
  planks.repeat.set(4, 30);
  const boardMat = std({ map: planks, roughness: 0.9 });
  const wheels = [];
  const wonderWheel = (R = 20) => {
    // the Wonder Wheel: twin rims, spokes, cars, rings of bulbs
    const b = new Batcher(),
      cols = ["#ff3a5a", "#ffd23d", "#3dfff0", "#39ff88", "#ff9ad5", "#ffffff"];
    for (const dx of [-1.2, 1.2]) {
      let prev = null;
      for (let k = 0; k <= 64; k++) {
        const a = (k / 64) * Math.PI * 2,
          y = Math.cos(a) * R,
          z = Math.sin(a) * R;
        if (prev)
          beam(b, VC.metal, dx, prev[0], prev[1], dx, y, z, 0.35, "#e8e8ec");
        if (k % 2 === 0)
          b.sph(
            VC.glow,
            hdr(cols[(k / 2) % cols.length], 2.6),
            dx * 1.05,
            y,
            z,
            0.22,
            true,
          );
        prev = [y, z];
      }
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        beam(
          b,
          VC.metal,
          dx,
          0,
          0,
          dx,
          Math.cos(a) * R,
          Math.sin(a) * R,
          0.18,
          "#d8d8de",
        );
      }
      let p2 = null;
      for (let k = 0; k <= 32; k++) {
        const a = (k / 32) * Math.PI * 2,
          y = Math.cos(a) * R * 0.55,
          z = Math.sin(a) * R * 0.55;
        if (p2) beam(b, VC.metal, dx, p2[0], p2[1], dx, y, z, 0.25, "#e8e8ec");
        p2 = [y, z];
      }
    }
    b.cyl(VC.metal, "#c9ced6", 0, 0, 0, 1.0, 3, "cyl", 0, Math.PI / 2);
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2,
        y = Math.cos(a) * (R + 1.4),
        z = Math.sin(a) * (R + 1.4);
      b.block(
        VC.solid,
        pick(["#ff3a5a", "#1f6fd0", "#ffd23d", "#39b54a"]),
        0,
        y - 1.2,
        z,
        1.8,
        1.6,
        1.4,
      );
      b.box(VC.glow, hdr("#fff4dc", 1.1), 0, y - 0.4, z, 1.82, 0.5, 1.2);
    }
    return b.build();
  };
  const cyclone = (b, x0, x1, z0, z1) => {
    // wooden coaster: white trestles under a hilly track lined with bulbs
    const H = (t) =>
      4 +
      17 * Math.exp(-(((t - 0.18) / 0.07) ** 2)) +
      11 * Math.exp(-(((t - 0.45) / 0.08) ** 2)) +
      7 * Math.exp(-(((t - 0.72) / 0.07) ** 2)) +
      2.2 * Math.sin(t * 25);
    for (const x of [x0, x1]) {
      let prev = null;
      for (let k = 0; k <= 60; k++) {
        const t = k / 60,
          z = -(z0 + (z1 - z0) * t),
          y = H(x === x0 ? t : 1 - t);
        if (prev) {
          beam(
            b,
            VC.solid,
            x - 0.6,
            prev[1],
            prev[0],
            x - 0.6,
            y,
            z,
            0.18,
            "#d8202c",
          );
          beam(
            b,
            VC.solid,
            x + 0.6,
            prev[1],
            prev[0],
            x + 0.6,
            y,
            z,
            0.18,
            "#d8202c",
          );
        }
        if (k % 2 === 0) {
          for (const dx of [-0.8, 0.8])
            b.box(VC.solid, "#e8e4dc", x + dx, y / 2, z, 0.2, y, 0.2);
          beam(
            b,
            VC.solid,
            x - 0.8,
            0.2,
            z,
            x + 0.8,
            y * 0.9,
            z,
            0.1,
            "#d8d2c6",
          );
          b.sph(
            VC.glow,
            hdr(pick(["#ffd23d", "#ff3a5a", "#ffffff"]), 2.4),
            x,
            y + 0.35,
            z,
            0.14,
            true,
          );
        }
        prev = [z, y];
      }
    }
  };
  const parachute = (b, x, z) => {
    // Parachute Jump: red lattice tower with its crown of arms, lit
    const H = 58;
    for (const [dx, dz] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ])
      beam(
        b,
        VC.metal,
        x + dx * 5,
        0,
        z + dz * 5,
        x + dx * 1.5,
        H,
        z + dz * 1.5,
        0.45,
        "#b8302a",
      );
    for (let y = 4; y < H; y += 5) {
      const w = 5 - (3.5 * y) / H;
      for (const [ax, az, bx, bz] of [
        [-1, -1, 1, -1],
        [1, -1, 1, 1],
        [1, 1, -1, 1],
        [-1, 1, -1, -1],
      ])
        beam(
          b,
          VC.metal,
          x + ax * w,
          y,
          z + az * w,
          x + bx * w,
          y + 5,
          z + bz * w,
          0.18,
          "#b8302a",
        );
    }
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2,
        ex = x + Math.cos(a) * 10,
        ez = z + Math.sin(a) * 10;
      beam(b, VC.metal, x, H + 2, z, ex, H - 1, ez, 0.25, "#b8302a");
      b.sph(
        VC.glow,
        hdr(k % 2 ? "#ff3a3a" : "#fff4dc", 3),
        ex,
        H - 1.2,
        ez,
        0.35,
        true,
      );
    }
    b.cyl(VC.metal, "#b8302a", x, H + 3, z, 0.5, 6);
    b.sph(VC.glow, hdr("#ff3a3a", 4), x, H + 6.4, z, 0.5);
  };
  const coney = () => {
    const b = new Batcher();
    // the boardwalk, the beach and the Atlantic on the left
    b.addM(
      tiledBox(8, 0.3, 80, 1),
      boardMat,
      at(-(EDGE + 4), 0.0, -40),
      0xffffff,
    );
    b.box(VC.solid, "#3a3428", -40, -0.15, -40, 60, 0.2, 80);
    b.add(G.plane, ocean, -110, -0.9, -40, 100, 82, 1, -Math.PI / 2, 0, 0);
    for (let z = 1; z < 80; z += 2)
      b.box(VC.metal, "#2a2420", -(EDGE + 8.1), 0.6, -z, 0.08, 1.2, 0.08);
    b.box(VC.metal, "#2a2420", -(EDGE + 8.1), 1.2, -40, 0.1, 0.1, 80);
    for (let z = 4; z < 80; z += 14) ctx.lamp(b, -(EDGE + 7.4), -z, -1);
    parachute(b, -30, -58);
    // amusement park on the right: arcades and food stands, the Cyclone, the Wonder Wheel
    farGround(b, 1, "#17151a");
    // Nathan's Famous on the corner: green and yellow, its sign along the roof, a line at the counter
    b.block(VC.solid, "#1f6a3a", 18, 0, -8, 14, 5, 12);
    b.box(VC.solid, "#ffd23d", 10.95, 4.4, -8, 0.1, 1.2, 12);
    b.add(G.plane, nathans, 10.88, 6.3, -8, 12, 2.4, 1, 0, -Math.PI / 2, 0);
    K.shopWindow(b, 10.97, 2.0, -8, 1, 10, 2.4, "#fff0c0", 0.7);
    for (let k = 0; k < 6; k++) K.person(b, 10.2 - (k % 2) * 0.5, -4 - k * 1.3);
    for (let z = 16; z < 46; z += 9) {
      const zc = -(z + 4);
      b.block(
        VC.solid,
        pick(["#2a1a2a", "#1a2a3a", "#2a2a1a"]),
        14.5,
        0,
        zc,
        7,
        4.2,
        8,
      );
      b.box(
        VC.glow,
        hdr(pick(["#ffd9a0", "#ff9ad5", "#9fd8ff"]), 0.8),
        10.98,
        1.7,
        zc,
        0.04,
        2.6,
        6.6,
      );
      b.add(
        G.box,
        VC.solid,
        10.3,
        3.1,
        zc,
        1.4,
        0.1,
        7.4,
        0,
        0,
        0.35,
        pick(["#c8202c", "#1f8a3a", "#e8c547"]),
      );
      for (let k = 0; k < 8; k++)
        b.sph(
          VC.glow,
          hdr(pick(["#ffd23d", "#ff3a5a", "#3dfff0"]), 2.4),
          10.9,
          4.0,
          zc - 3.5 + k,
          0.1,
          true,
        );
      signPlane(b, 10.9, 5.0, zc, 1, 5, pick([0, 1, 4, 8, 10]));
    }
    cyclone(b, 18, 24, 50, 80);
    b.add(G.plane, cycloneSign, 15.2, 9, -50, 9, 2.2, 1, 0, -Math.PI / 2, 0);
    for (const x of [12, 18.4]) b.box(VC.metal, "#d8d2c6", x - 2, 4, -50, 0.2, 8, 0.2);
    K.crowd(b, -1 - EDGE, -(EDGE + 7), 2, 78, 18);
    K.crowd(b, 5, 10, 2, 78, 16);
    const g = b.build();
    const wheel = wonderWheel();
    wheel.position.set(38, 24, -34);
    g.add(wheel);
    wheels.push(wheel);
    const base = new Batcher();
    for (const dz of [-6, 6])
      for (const dx of [-1.5, 1.5])
        beam(
          base,
          VC.metal,
          38 + dx * 3,
          0,
          -34 + dz,
          38 + dx * 0.4,
          24,
          -34,
          0.6,
          "#d8d8de",
        );
    base.block(VC.solid, "#2a2c34", 38, 0, -34, 10, 2, 16);
    g.add(base.build());
    return g;
  };

  return {
    landmarks: {
      centralPark: { name: "中央公园", en: "CENTRAL PARK", build: centralPark },
      grandCentral: {
        name: "中央车站 · 克莱斯勒大厦",
        en: "GRAND CENTRAL · CHRYSLER",
        build: grandCentral,
      },
      flatiron: { name: "熨斗大厦", en: "FLATIRON BUILDING", build: flatiron },
      wallStreet: { name: "华尔街", en: "WALL STREET", build: wallStreet },
      coney: { name: "康尼岛", en: "CONEY ISLAND", build: coney },
    },
    update(t) {
      for (const w of wheels) w.rotation.x = t * 0.06;
      lake.userData.scroll.offset.set(t * 0.008, t * 0.02);
      ocean.userData.scroll.offset.set(t * 0.012, t * 0.03);
      tick.offset.x = t * 0.05;
    },
  };
}
