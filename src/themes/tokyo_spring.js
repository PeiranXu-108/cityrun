// Spring in Tokyo: cherry trees, koinobori, paper lanterns, festival stalls, hanami picnics, a torii tunnel,
// plus two blossom landmarks (Meguro River at night and Ueno Park hanami).
import {
  THREE,
  Batcher,
  VC,
  G,
  std,
  basic,
  hdr,
  foliageMat,
  canvasTex,
  CHUNK_LEN,
  rand,
  randi,
  pick,
} from "../core.js";
import { buildingRow, EDGE, farGround, waterMat, textTex } from "./common.js";
import { beam, wire, vText, JP, SNOW } from "./tokyo_kit.js";
import { sakuraKit } from "./trees.js";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0),
  _q = new THREE.Quaternion(),
  _m = new THREE.Matrix4();
const YATAI = [
  "たこ焼き",
  "やきそば",
  "りんご飴",
  "わたあめ",
  "チョコバナナ",
  "かき氷",
];

// carp streamer skin: scales, a white eye ring near the mouth, striped tail
function carpTex(body, scale) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = body;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = scale;
    g.lineWidth = 3;
    for (let y = 18; y < h - 18; y += 12)
      for (let x = (y / 12) % 2 ? 0 : 8; x < w + 16; x += 16) {
        g.beginPath();
        g.arc(x, y, 8, 0, Math.PI);
        g.stroke();
      }
    g.fillStyle = "#ffffff";
    g.fillRect(0, h - 18, w, 18); // mouth ring (uv.y = 0 is the mouth)
    for (const u of [0.25, 0.75]) {
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.arc(u * w, h - 30, 10, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#141414";
      g.beginPath();
      g.arc(u * w, h - 30, 5, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "rgba(255,255,255,0.35)";
    for (let x = 0; x < w; x += 10) g.fillRect(x, 0, 4, 16); // tail fin stripes
  });
}
function streamerTex() {
  return canvasTex(128, 64, (g, w, h) => {
    ["#1f5fbf", "#ffffff", "#d81e2b", "#ffd23d", "#2fa84f"].forEach((c, k) => {
      g.fillStyle = c;
      g.fillRect((k * w) / 5, 0, w / 5 + 1, h);
    });
  });
}
function awningTex() {
  return canvasTex(128, 32, (g, w, h) => {
    for (let x = 0; x < w; x += 16) {
      g.fillStyle = (x / 16) % 2 ? "#ffffff" : "#d81e2b";
      g.fillRect(x, 0, 16, h);
    }
  });
}

export function springKit(K) {
  const SK = sakuraKit();
  K.sakura = SK.sakura;
  K.shidare = SK.shidare;
  K.petals = SK.petals;

  // ---------- koinobori (鯉のぼり) on apartment roofs ----------
  const CARP_L = 2.4;
  const carpGeo = (() => {
    const g = new THREE.CylinderGeometry(0.07, 0.34, CARP_L, 10, 4, true);
    const uv = g.attributes.uv,
      sway = new Float32Array(uv.count);
    for (let i = 0; i < uv.count; i++) sway[i] = uv.getY(i); // 0 at the mouth, 1 at the tail
    g.setAttribute("aSway", new THREE.BufferAttribute(sway, 1));
    g.rotateZ(-Math.PI / 2);
    g.translate(CARP_L / 2, 0, 0); // mouth at the pole, streaming along +x
    return g;
  })();
  const carpMats = [
    foliageMat(streamerTex(), { sway: 0.4, alphaTest: 0.01 }),
    foliageMat(carpTex("#1a1a22", "#4a4a5a"), { sway: 0.34, alphaTest: 0.01 }),
    foliageMat(carpTex("#d81e2b", "#ff7a6a"), { sway: 0.34, alphaTest: 0.01 }),
    foliageMat(carpTex("#1f5fbf", "#6fa8ff"), { sway: 0.34, alphaTest: 0.01 }),
  ];
  K.koinobori = (b, x, y, z, side) => {
    const H = 7.5,
      top = y + H,
      ry = side > 0 ? Math.PI : 0; // stream out over the street
    b.cyl(VC.solid, "#d8d4c8", x, y + H / 2, z, 0.07, H);
    b.sph(VC.metal, "#ffd23d", x, top + 0.18, z, 0.16);
    for (let k = 0; k < 6; k++)
      b.add(
        G.box,
        VC.solid,
        x,
        top - 0.05,
        z,
        0.04,
        0.5,
        0.06,
        (k / 6) * Math.PI,
        0,
        0,
        pick(["#d81e2b", "#ffd23d", "#1f5fbf", "#ffffff"]),
      );
    [
      [top - 0.55, 1.2],
      [top - 1.35, 1.25],
      [top - 2.35, 1.05],
      [top - 3.25, 0.85],
    ].forEach(([yy, sc], k) => {
      _m.compose(
        V(x, yy, z),
        _q.setFromAxisAngle(UP, ry + rand(-0.15, 0.15)),
        V(sc, sc, sc),
      );
      b.addM(carpGeo, carpMats[k], _m, 0xffffff);
    });
  };

  // ---------- paper lanterns ----------
  K.bonbori = (b, x, z, col = pick(["#ffe0ea", "#fff4f8", "#ffd0de"])) => {
    b.box(VC.solid, "#5a3a24", x, 0.8, z, 0.08, 1.6, 0.08);
    b.box(VC.solid, "#2a1a12", x, 1.56, z, 0.36, 0.05, 0.36);
    b.add(
      G.cyl8,
      VC.glow,
      x,
      1.85,
      z,
      0.36,
      0.55,
      0.36,
      0,
      0,
      0,
      hdr(col, 1.6),
    );
    b.add(G.cone8, VC.solid, x, 2.22, z, 0.5, 0.2, 0.5, 0, 0, 0, "#2a1a12");
  };
  // a string of pink and white lanterns along the street (z0..z1 are distances into the chunk)
  K.lanternLine = (b, x, y, z0, z1, step = 1.6) => {
    const sag = 0.35;
    wire(b, x, y + 0.35, -z0, x, y + 0.35, -z1, sag);
    for (let z = z0 + step / 2; z < z1; z += step) {
      const t = (z - z0) / (z1 - z0);
      b.add(
        G.sph,
        VC.glow,
        x,
        y - sag * 4 * t * (1 - t),
        -z,
        0.34,
        0.44,
        0.34,
        0,
        0,
        0,
        hdr(pick(["#ffd6e4", "#fff4f8", "#ff9ec0"]), 1.7),
      );
    }
  };

  // ---------- festival stalls (屋台) ----------
  const awning = std({ map: awningTex(), roughness: 0.7 });
  const signs = YATAI.map((t) =>
    basic({
      map: textTex(t, {
        w: 512,
        h: 128,
        color: "#141414",
        bg: "#fff4e0",
        border: "#d81e2b",
        font: JP,
        weight: 400,
        size: 0.6,
      }),
      color: hdr("#ffffff", 1.1),
    }),
  );
  K.yatai = (b, x, z, side, k = randi(0, YATAI.length - 1)) => {
    const s = side,
      fx = x - s * 1.12;
    b.block(VC.solid, "#6a4a30", x, 0, z, 2.2, 1.0, 3.0);
    b.box(VC.glow, hdr("#ffd9a0", 1.1), fx - s * 0.02, 0.6, z, 0.04, 0.5, 2.6);
    for (const dx of [-1.0, 1.0])
      for (const dz of [-1.4, 1.4])
        b.box(VC.solid, "#4a3020", x + dx, 1.4, z + dz, 0.08, 2.8, 0.08);
    b.add(G.box, awning, x, 2.85, z, 2.7, 0.12, 3.4, 0, 0, s * 0.22);
    b.add(
      G.plane,
      signs[k % signs.length],
      fx - s * 0.08,
      2.25,
      z,
      2.4,
      0.6,
      1,
      0,
      (-s * Math.PI) / 2,
    );
    for (const dz of [-1.1, 1.1]) K.chochin(b, fx - s * 0.25, 2.0, z + dz, 0.5);
    b.sph(VC.glowAdd, hdr("#ffe6cc", 0.04), x, 3.6, z, 0.9, true);
  };
  // ---------- hanami picnic on a blue tarp ----------
  K.hanami = (b, x, z) => {
    const w = rand(3, 4.4),
      d = rand(3, 4);
    b.box(VC.solid, "#2f6fd0", x, 0.03, z, w, 0.04, d);
    for (let k = 0; k < randi(4, 7); k++) {
      const a = (k / 7) * Math.PI * 2 + rand(-0.3, 0.3),
        px = x + Math.cos(a) * w * 0.32,
        pz = z + Math.sin(a) * d * 0.32;
      b.box(
        VC.solid,
        pick([
          "#23252e",
          "#5a2b33",
          "#2a3550",
          "#c9c0b0",
          "#d86a8a",
          "#3a5a3a",
        ]),
        px,
        0.45,
        pz,
        0.44,
        0.6,
        0.3,
      );
      b.box(VC.solid, "#1c1c22", px, 0.12, pz, 0.5, 0.2, 0.5);
      b.sph(VC.solid, "#d9b08c", px, 0.92, pz, 0.15, true);
      b.sph(VC.solid, "#141414", px, 0.99, pz + 0.02, 0.16, true);
    }
    for (let k = 0; k < 6; k++)
      b.box(
        VC.solid,
        pick(["#ff3b3b", "#ffd23d", "#ffffff", "#39c0ff", "#e8862a"]),
        x + rand(-0.6, 0.6),
        0.1,
        z + rand(-0.6, 0.6),
        0.22,
        0.12,
        0.3,
      );
  };
  // ---------- strollers in kimono, some under paper umbrellas (和傘) ----------
  K.kimono = (b, x, z) => {
    const c = pick([
      "#d81e5b",
      "#7a3fb0",
      "#1f6fd0",
      "#e8862a",
      "#2f8a5a",
      "#f2a6c0",
    ]);
    b.add(G.cone8, VC.solid, x, 0.75, z, 0.62, 1.5, 0.5, 0, 0, 0, c);
    b.box(VC.solid, c, x, 1.35, z, 0.42, 0.5, 0.26);
    b.box(
      VC.solid,
      pick(["#ffd23d", "#ffffff", "#141414", "#c41a16"]),
      x,
      1.12,
      z,
      0.44,
      0.16,
      0.28,
    );
    b.sph(VC.solid, "#e8c4a8", x, 1.75, z, 0.15, true);
    b.sph(VC.solid, "#141414", x, 1.84, z + 0.02, 0.17, true);
    b.sph(VC.solid, "#141414", x, 1.98, z + 0.06, 0.08, true);
    if (Math.random() < 0.5) {
      b.cyl(VC.solid, "#5a3a24", x + 0.12, 1.75, z, 0.015, 0.8);
      b.add(
        G.cone,
        VC.solid,
        x + 0.12,
        2.24,
        z,
        1.25,
        0.36,
        1.25,
        0,
        0,
        0,
        pick(["#c41a16", "#7a1b4a", "#1d2a4a", "#e8a33a"]),
      );
    }
  };
  // ---------- 千本鳥居: a tunnel of vermilion torii over the tracks (z0..z1 are distances) ----------
  K.toriiTunnel = (b, z0, z1) => {
    for (let z = z0; z <= z1; z += 1.6) {
      for (const s of [-1, 1]) {
        b.cyl(VC.solid, "#d23a1e", s * 4.25, 3.4, -z, 0.2, 6.8, "cyl8");
        b.cyl(VC.solid, "#141414", s * 4.25, 0.2, -z, 0.24, 0.4, "cyl8");
      }
      b.box(VC.solid, "#d23a1e", 0, 6.2, -z, 9.2, 0.26, 0.3);
      b.box(VC.solid, "#d23a1e", 0, 6.95, -z, 10.2, 0.3, 0.38);
      b.box(VC.solid, "#141414", 0, 7.2, -z, 10.6, 0.2, 0.44);
      b.box(VC.solid, SNOW, 0, 7.32, -z, 10.4, 0.05, 0.4);
    }
    for (let z = z0; z <= z1; z += 4.8)
      for (const s of [-1, 1])
        b.box(VC.glow, hdr("#ffb35c", 1.4), s * 4.0, 1.0, -z, 0.06, 0.6, 0.3);
    for (const s of [-1, 1]) {
      K.toro(b, s * 5.6, -z0 + 1.5);
      K.toro(b, s * 5.6, -z1 - 1.5);
    }
  };

  // ---------- landmark: 目黒川 · 夜桜 ----------
  const canal = waterMat("#1a1430", 4);
  const meguroSign = basic({
    map: vText("目黒川", { color: "#2a1a12", bg: "#d9d0c0" }),
    color: hdr("#ffffff", 0.9),
  });
  const uenoSign = basic({
    map: vText("上野恩賜公園", { color: "#2a1a12", bg: "#d9d0c0" }),
    color: hdr("#ffffff", 0.9),
  });
  const meguro = () => {
    const b = new Batcher();
    farGround(b, 1, "#15161c");
    K.row(b, 1, 0, CHUNK_LEN);
    K.poleLine(b, 1);
    for (let z = 6; z < CHUNK_LEN; z += 9.5)
      K.sakura(b, EDGE + 3.4, -z, rand(0.9, 1.05));
    K.crowd(b, EDGE + 1.2, EDGE + 6.2, 2, 78, 10, 0.2);
    // the canal on the left, lined with cherry trees that meet over the water
    const w0 = EDGE + 7.4,
      w1 = w0 + 10,
      wy = -2.4;
    b.add(
      G.plane,
      canal,
      -(w0 + w1) / 2,
      wy,
      -CHUNK_LEN / 2,
      w1 - w0,
      CHUNK_LEN + 0.5,
      1,
      -Math.PI / 2,
    );
    for (const x of [w0, w1])
      b.box(
        VC.solid,
        "#5a5a62",
        -x,
        wy / 2,
        -CHUNK_LEN / 2,
        0.6,
        -wy + 0.1,
        CHUNK_LEN,
      );
    b.box(
      VC.solid,
      "#24252b",
      -(w1 + 4),
      -0.05,
      -CHUNK_LEN / 2,
      8,
      0.12,
      CHUNK_LEN,
    );
    b.box(
      VC.solid,
      "#15161c",
      -(w1 + 48),
      -0.2,
      -CHUNK_LEN / 2,
      80,
      0.2,
      CHUNK_LEN,
    );
    buildingRow(b, -1, K.types, {
      x0: w1 + 8,
      depth: [8, 12],
      gap: [0.05, 0.6],
    });
    for (const x of [w0 - 0.2, w1 + 0.2]) {
      for (let z = 0.5; z < CHUNK_LEN; z += 2.2)
        b.box(VC.metal, "#2a2c32", -x, 0.55, -z, 0.06, 1.1, 0.06);
      b.box(
        VC.metal,
        "#2a2c32",
        -x,
        1.1,
        -CHUNK_LEN / 2,
        0.08,
        0.08,
        CHUNK_LEN,
      );
      for (let z = 1.5; z < CHUNK_LEN; z += 3)
        b.add(
          G.cyl8,
          VC.glow,
          -x,
          1.42,
          -z,
          0.3,
          0.42,
          0.3,
          0,
          0,
          0,
          hdr(pick(["#ffd6e4", "#ff9ec0", "#fff0f5"]), 1.8),
        );
    }
    for (let z = 3; z < CHUNK_LEN; z += 7) {
      K.sakura(b, -(w0 - 1.6), -z, rand(1.0, 1.15));
      K.sakura(b, -(w1 + 1.6), -z - 3.5, rand(1.0, 1.15), { carpet: false });
    }
    for (let k = 0; k < 14; k++)
      K.petals(b, -rand(w0 + 1, w1 - 1), -rand(0, CHUNK_LEN), rand(2, 4.5), wy); // 花筏, petal rafts
    for (const zc of [-24, -58]) {
      b.box(VC.solid, "#8a8780", -(w0 + w1) / 2, 0.3, zc, w1 - w0 + 1, 0.4, 3);
      for (const dz of [-1.4, 1.4])
        b.box(
          VC.metal,
          "#2a2c32",
          -(w0 + w1) / 2,
          1.0,
          zc + dz,
          w1 - w0 + 1,
          0.08,
          0.08,
        );
      K.crowd(b, -(w0 + 1), -(w1 - 1), -zc - 1, -zc + 1, 5, 0.1);
    }
    b.block(VC.solid, "#7d7a72", -(w0 - 0.8), 0, -10, 0.6, 1.8, 0.6);
    b.add(
      G.plane,
      meguroSign,
      -(w0 - 1.11),
      0.95,
      -10,
      0.4,
      1.5,
      1,
      0,
      Math.PI / 2,
    );
    K.crowd(b, -(EDGE + 1.2), -(w0 - 0.6), 2, 78, 26, 0.2);
    return b.build();
  };

  // ---------- landmark: 上野公園 · お花見 ----------
  const ueno = () => {
    const b = new Batcher();
    for (const side of [-1, 1]) {
      farGround(b, side, "#22241e");
      b.box(
        VC.solid,
        "#3a3a30",
        side * 22,
        0,
        -CHUNK_LEN / 2,
        22,
        0.06,
        CHUNK_LEN,
      );
      for (let z = 3, k = 0; z < CHUNK_LEN; z += 6.5, k++)
        (k % 4 === 2 ? K.shidare : K.sakura)(
          b,
          side * (EDGE + 4.2),
          -z,
          rand(1.05, 1.2),
        );
      for (let z = 1.5; z < CHUNK_LEN; z += 3.25)
        K.bonbori(b, side * (EDGE + 1.5), -z);
      K.lanternLine(b, side * (EDGE + 1.5), 3.6, 0, CHUNK_LEN);
      for (let z = 6; z < CHUNK_LEN; z += 9)
        K.sakura(b, side * rand(22, 27), -z, rand(1.1, 1.35));
      K.crowd(b, side * (EDGE + 1.2), side * (EDGE + 6.5), 2, 78, 14, 0.15);
      for (let k = 0; k < 8; k++)
        K.kimono(b, side * rand(EDGE + 1.4, EDGE + 6.5), -rand(4, 76));
    }
    for (let z = 8; z < CHUNK_LEN - 6; z += rand(11, 15))
      K.hanami(b, -rand(13.5, 17), -z);
    for (let k = 0; k < 6; k++) K.yatai(b, 12.4, -(10 + k * 9.5), 1, k);
    for (let z = 10; z < CHUNK_LEN - 6; z += rand(12, 16))
      K.hanami(b, rand(18, 22), -z);
    b.block(VC.solid, "#7d7a72", -(EDGE + 6.8), 0, -4, 0.7, 3.2, 0.7);
    b.add(
      G.plane,
      uenoSign,
      -(EDGE + 6.43),
      1.75,
      -4,
      0.5,
      2.8,
      1,
      0,
      Math.PI / 2,
    );
    return b.build();
  };

  return {
    landmarks: {
      meguro: {
        name: "目黒川 · 夜樱",
        en: "MEGURO RIVER · YOZAKURA",
        build: meguro,
      },
      ueno: { name: "上野公园 · 赏樱", en: "UENO PARK · HANAMI", build: ueno },
    },
    update(t) {
      canal.userData.scroll.offset.set(t * 0.006, t * 0.018);
    },
  };
}
