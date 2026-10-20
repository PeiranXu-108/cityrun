// Tokyo: a spring night after a late snow, cherry petals drifting through the neon. Zakkyo buildings with stacked
// signboards, vending machines, utility poles and wires, footbridges, railway viaducts, shrines and torii tunnels,
// cherry trees and koinobori, railroad crossings, Yamanote trains and Shinkansen, Mt. Fuji and the Skytree on the horizon.
import {
  THREE,
  Batcher,
  VC,
  G,
  std,
  hdr,
  stripeTex,
  buildingGeo,
  canvasTex,
  CHUNK_LEN,
  TRAIN_H,
  rand,
  randi,
  pick,
  chance,
} from "../core.js";
import { barrierStyle, coinGeometry, coinMaterial, blink } from "../props.js";
import {
  makeTrack,
  skyline,
  skyTex,
  SKY_VC,
  polar,
  at,
  EDGE,
  farGround,
  textTex,
} from "./common.js";
import { makeKit, wire, JP, SNOW, GLYPHS } from "./tokyo_kit.js";
import { tokyoLandmarks } from "./tokyo_landmarks.js";
import { springKit } from "./tokyo_spring.js";

export { GLYPHS };

// ---------- Mt. Fuji ----------
// Straight ahead on the horizon (the Tokyo skyline turns with the track's curve, so it stays at the far end of the
// rails): a concave lathe cone with a flat crater rim, spring snow running down the gullies, a pink rim of afterglow.
const FUJI_R = 1020,
  FUJI_BASE = -205,
  FUJI_H = 426,
  FUJI_SNOW = 0.62;
const fujiR = (t) => {
  const u = 1 - t;
  return (0.035 + 1.2 * u + 0.6 * u * u * u) * FUJI_H;
};

function fujiTex() {
  const tex = canvasTex(1024, 512, (g, w, h) => {
    // canvas top = summit
    const rock = g.createLinearGradient(0, 0, 0, h);
    rock.addColorStop(0, "#454b86");
    rock.addColorStop(0.5, "#2b3168");
    rock.addColorStop(1, "#3b3168");
    g.fillStyle = rock;
    g.fillRect(0, 0, w, h);
    const line = (x) =>
      h *
      (1 -
        FUJI_SNOW +
        0.03 * Math.sin((x / w) * Math.PI * 16) +
        0.02 * Math.sin((x / w) * Math.PI * 38 + 1.3));
    const snow = g.createLinearGradient(0, 0, 0, h * 0.62);
    snow.addColorStop(0, "#fff3f8");
    snow.addColorStop(0.65, "#eee8ff");
    snow.addColorStop(1, "#c9d0ff");
    g.fillStyle = snow;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(w, 0);
    for (let x = w; x >= 0; x -= 4) g.lineTo(x, line(x));
    g.closePath();
    g.fill();
    for (let i = 0; i < 110; i++) {
      // snow left in the gullies
      const x = rand(0, w),
        y = line(x) - 6,
        L = rand(18, 120) * (chance(0.25) ? 1.7 : 1),
        hw = rand(1.5, 5);
      g.beginPath();
      g.moveTo(x - hw, y);
      g.lineTo(x + hw, y);
      g.lineTo(x + rand(-4, 4), y + L);
      g.closePath();
      g.fill();
    }
    g.lineCap = "round";
    for (let i = 0; i < 50; i++) {
      // faint ridge shadows running down through the snow
      const x = rand(0, w),
        y0 = rand(4, 40),
        y1 = line(x) + rand(-10, 20);
      g.strokeStyle = `rgba(70, 80, 150, ${rand(0.04, 0.1)})`;
      g.lineWidth = rand(1, 2.5);
      g.beginPath();
      g.moveTo(x, y0);
      g.quadraticCurveTo(x + rand(-6, 6), (y0 + y1) / 2, x + rand(-8, 8), y1);
      g.stroke();
    }
  });
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function mtFuji(b) {
  const pts = [];
  for (let j = 0; j <= 40; j++) {
    const t = j / 40;
    pts.push(new THREE.Vector2(fujiR(t), FUJI_BASE + t * FUJI_H));
  }
  pts.push(new THREE.Vector2(0.5, FUJI_BASE + FUJI_H - 7)); // shallow crater behind the rim
  const geo = new THREE.LatheGeometry(pts, 128);
  geo.rotateY(Math.PI); // texture seam to the back
  const pos = geo.attributes.position,
    nor = geo.attributes.normal,
    uv = geo.attributes.uv;
  const col = new Float32Array(pos.count * 3),
    L = new THREE.Vector3(-0.6, 0.5, 0.62).normalize();
  const n = new THREE.Vector3(),
    c = new THREE.Color();
  const warm = new THREE.Color("#ffc4d8"),
    cool = new THREE.Color("#a9b4ff"),
    rim = new THREE.Color("#ff8fb8");
  for (let i = 0; i < pos.count; i++) {
    uv.setY(i, (pos.getY(i) - FUJI_BASE) / FUJI_H);
    n.fromBufferAttribute(nor, i);
    const lit = Math.max(0, n.dot(L));
    const edge = 1 - Math.abs(n.z) / Math.max(1e-4, Math.hypot(n.x, n.z)); // 0 facing the camera, 1 at the silhouette
    // afterglow-pink on the lit flank, cold blue in the shadow, a pink rim along the outline
    c.setRGB(1, 1, 1)
      .lerp(cool, 0.45 * (1 - lit))
      .lerp(warm, 0.4 * lit)
      .lerp(rim, Math.pow(edge, 1.5) * 0.5)
      .multiplyScalar(0.42 + 0.58 * lit);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.MeshBasicMaterial({
    map: fujiTex(),
    vertexColors: true,
    fog: false,
  });
  mat.color.setScalar(0.6); // moonlit snow, kept under the bloom threshold
  b.addM(geo, mat, at(0, 0, -FUJI_R), null);
}
// skyline buildings in front of the mountain stay below its snow line
const FUJI_SNOW_E =
  Math.atan(
    (FUJI_BASE + FUJI_SNOW * FUJI_H - 4.5) / (FUJI_R - fujiR(FUJI_SNOW)),
  ) - 0.012;
const FUJI_CAP_A = Math.asin(fujiR(FUJI_SNOW) / FUJI_R) + 0.05;
const fujiClear = (a, rr) =>
  Math.abs(a) < FUJI_CAP_A ? 4.5 + rr * Math.tan(FUJI_SNOW_E) : Infinity;

export default {
  id: "tokyo",
  name: "东京",
  en: "TOKYO",
  tagline: "春雪夜樱 · 不眠之都",
  blurb:
    "春雪初停的东京夜晚，樱花瓣漫天飞舞：电线杆、自动贩卖机、层层叠叠的竖招牌和屋顶的鲤鱼旗。穿过涩谷十字路口、雷门大灯笼和千本鸟居，沿着目黒川夜樱和上野公园的赏樱人群，远处是晴空塔和富士山。",
  sights: [
    "涩谷十字路口",
    "浅草寺 · 雷门",
    "目黒川夜樱",
    "东京塔",
    "上野赏樱",
    "歌舞伎町",
    "彩虹大桥",
  ],
  accent: "#ff2d55",
  accent2: "#7cf8ff",
  portal: "#ff2d55",
  sky: {
    top: "#070b26",
    mid: "#28306c",
    bot: "#ff9a7a",
    glow: "#ff6a8a",
    glowK: 0.45,
    sun: "#000000",
    sunK: 0,
    sunDir: [0, -0.06, -1],
    sunSize: 0.0001,
    cloud: 0.3,
    cloudColor: "#5a4a7a",
    horizon: -0.08,
    stars: true,
  },
  fog: { color: "#2a2c5c", near: 24, far: 240 },
  light: {
    hemiSky: "#9fb0ff",
    hemiGround: "#2a2440",
    hemi: 0.85,
    dir: "#ffb9a8",
    dirK: 0.55,
    dirPos: [-0.1, 0.35, -1],
  },
  exposure: 0.95,
  bloom: { strength: 0.85, radius: 0.55, threshold: 0.82 },
  weather: [
    {
      mode: "fall",
      count: 850,
      colors: ["#ffb3cc", "#ffc6d9", "#ff9fbf", "#ffd9e6"],
      size: 0.42,
      k: 1.15,
      box: [46, 20, 90],
      speed: 0.8,
      shape: 2,
    },
  ],
  coin: "yen",
  music: "tokyo",
  jingle: "station",
  crossingBell: true,

  build() {
    const K = makeKit();
    const spring = springKit(K);
    const track = makeTrack({
      gravel: "#2a2b31",
      spots: ["#383a42", "#1d1e23", "#4a4c55"],
      sleeper: "#8a8d94",
      rail: "#b8bcc6",
      railMatte: true,
      edge: "#7cf8ff",
      edgeK: 1.8,
      side: "#24252b",
    });

    const decor = () => {
      const b = new Batcher();
      const zv = chance(0.2) ? rand(24, 56) : 0; // brick railway viaduct crossing overhead
      const zf = !zv && chance(0.35) ? rand(16, 64) : 0; // pedestrian footbridge
      const shrineSide = !zv && chance(0.2) ? pick([-1, 1]) : 0,
        zs = rand(22, 58);
      const illum = chance(0.3);
      const near = (z, c, r) => c && Math.abs(z - c) < r;
      // spring additions: a torii tunnel where no bridge crosses, cherry rows where no illumination trees stand
      const zt = !zv && !zf && chance(0.25) ? rand(10, 44) : 0,
        TL = 22;
      const inT = (z, pad = 0) => zt && z > zt - pad && z < zt + TL + pad;
      const bloom = !illum && chance(0.65);
      for (const side of [-1, 1]) {
        farGround(b, side, "#15161c");
        if (zv) {
          K.row(b, side, 0, zv - 4);
          K.row(b, side, zv + 4, CHUNK_LEN);
        } else if (side === shrineSide) {
          K.row(b, side, 0, zs - 7);
          K.shrine(b, side, -zs);
          K.row(b, side, zs + 7, CHUNK_LEN);
        } else K.row(b, side, 0, CHUNK_LEN);
        b.box(
          VC.solid,
          "#d9b31a",
          side * (EDGE + 0.85),
          0.03,
          -CHUNK_LEN / 2,
          0.3,
          0.03,
          CHUNK_LEN,
        ); // tactile paving
        for (let z = rand(2, 10); z < CHUNK_LEN; z += rand(6, 14))
          b.box(
            VC.solid,
            SNOW,
            side * (EDGE + 6.6),
            0.04,
            -z,
            rand(0.5, 0.9),
            0.06,
            rand(1.5, 4),
          );
        K.poleLine(
          b,
          side,
          (z) => near(z, zf, 4) || near(z, zv, 5) || inT(z, 2),
        );
        let z = rand(4, 12);
        while (z < CHUNK_LEN - 4) {
          if (
            near(z, zv, 6) ||
            near(z, zf, 3) ||
            inT(z, 1) ||
            (side === shrineSide && near(z, zs, 8))
          ) {
            z += 4;
            continue;
          }
          const r = Math.random();
          if (r < 0.32) {
            K.vending(b, side * (EDGE + 6.2), -z, side, randi(2, 4));
            z += 5;
          } else if (r < 0.45) {
            for (let k = 0; k < randi(2, 5); k++)
              K.bike(b, side * (EDGE + 5.8), -z - k * 0.7);
            z += 4;
          } else if (r < 0.55) {
            K.postbox(b, side * (EDGE + 5.6), -z);
            z += 2;
          } else if (r < 0.7) {
            K.taxi(b, side * (EDGE + 4.6), -z - 2);
            z += 6;
          }
          z += rand(4, 10);
        }
        if (illum)
          for (let zz = 6; zz < CHUNK_LEN; zz += 10.5)
            if (!near(zz, zf, 3) && !near(zz, zv, 5) && !inT(zz, 2))
              K.ledTree(b, side * (EDGE + 3.3), -zz, rand(0.9, 1.1));
        if (bloom) {
          for (let zz = rand(3, 8); zz < CHUNK_LEN - 2; zz += rand(8.5, 11)) {
            if (
              near(zz, zf, 4) ||
              near(zz, zv, 6) ||
              inT(zz, 3) ||
              (side === shrineSide && near(zz, zs, 9))
            )
              continue;
            K.sakura(b, side * (EDGE + 3.4), -zz, rand(0.85, 1.05));
          }
          if (!zv && !zf && !zt && chance(0.4))
            K.lanternLine(b, side * (EDGE + 1.6), 3.3, 0, CHUNK_LEN);
        }
        if (chance(0.5)) K.signal(b, side * (EDGE + 1.6), -rand(8, 70), side);
        K.crowd(
          b,
          side * (EDGE + 1.3),
          side * (EDGE + 6.0),
          2,
          CHUNK_LEN - 2,
          randi(4, 10),
        );
      }
      for (const z of [18, 50])
        if (chance(0.35) && !near(z, zf, 4) && !near(z, zv, 5) && !inT(z, 2))
          wire(b, -(EDGE + 2.2), 9.5, -z, EDGE + 2.2, 9.5, -z, 0.6);
      if (zv) K.viaduct(b, -zv);
      else if (zf) K.footbridge(b, -zf);
      else if (zt) K.toriiTunnel(b, zt, zt + TL);
      return b.build();
    };

    const LM = tokyoLandmarks(K);

    const sky = skyline({
      tex: skyTex({
        wall: "#0b0d1e",
        lit: ["#fff1d6", "#d6ecff", "#ffd9a8", "#ff9ad5"],
        chance: 0.34,
      }),
      colors: ["#ffffff", "#c7d2ff", "#b0b9e6", "#9aa4d9"],
      count: 150,
      h: [40, 190],
      k: 1.6,
      heightCap: fujiClear,
      follow: 190,
      landmarks: [
        mtFuji,
        (b) => {
          // Tokyo Skytree with its blue and purple lighting
          const [x, z] = polar(24, 600);
          const shaft = new THREE.CylinderGeometry(4.5, 15, 330, 12, 1);
          shaft.translate(0, 165 - 95, 0);
          b.addM(shaft, SKY_VC, at(x, 0, z), "#9aa6c8");
          for (let y = -80, k = 0; y < 230; y += 14, k++) {
            const r = 15 - (10.5 * (y + 95)) / 330;
            b.add(
              G.cyl,
              SKY_VC,
              x,
              y,
              z,
              2 * r + 0.6,
              1.2,
              2 * r + 0.6,
              0,
              0,
              0,
              hdr(k % 2 ? "#b26bff" : "#59d8ff", 1.6),
            );
          }
          b.add(G.cyl, SKY_VC, x, 120, z, 26, 12, 26, 0, 0, 0, "#3a4060");
          b.add(
            G.cyl,
            SKY_VC,
            x,
            120,
            z,
            26.6,
            4,
            26.6,
            0,
            0,
            0,
            hdr("#cfe6ff", 2.2),
          );
          b.add(G.cyl, SKY_VC, x, 178, z, 18, 6, 18, 0, 0, 0, "#3a4060");
          b.add(
            G.cyl,
            SKY_VC,
            x,
            178,
            z,
            18.6,
            2.4,
            18.6,
            0,
            0,
            0,
            hdr("#cfe6ff", 2.2),
          );
          b.add(
            G.cyl,
            SKY_VC,
            x,
            270,
            z,
            2,
            80,
            2,
            0,
            0,
            0,
            hdr("#e8ecff", 1.6),
          );
          b.sph(SKY_VC, hdr("#ff2a2a", 6), x, 312, z, 2.4);
        },
        (b, mat) => {
          // Tokyo Metropolitan Government Building, twin towers
          const [x, z, ry] = polar(-36, 700);
          b.addM(
            buildingGeo(80, 235, 40, { cols: 8, rows: 16 }, 3.4, 4.2),
            mat,
            at(x, -95, z, ry),
            "#d9dcf0",
          );
          for (const o of [-22, 22]) {
            const ox = x + Math.cos(ry) * o,
              oz = z - Math.sin(ry) * o;
            b.addM(
              buildingGeo(30, 110, 30, { cols: 8, rows: 16 }, 3.4, 4.2),
              mat,
              at(ox, 140, oz, ry),
              "#ffffff",
            );
            b.add(
              G.box,
              SKY_VC,
              ox,
              251,
              oz,
              22,
              4,
              22,
              0,
              ry,
              0,
              hdr("#bfe3ff", 1.8),
            );
          }
        },
        (b) => {
          // Mode Gakuen Cocoon Tower
          const [x, z] = polar(-47, 640);
          b.add(G.sph, SKY_VC, x, 60, z, 44, 300, 38, 0, 0, 0, "#1c2440");
          for (let y = -60; y <= 190; y += 25) {
            const r = 22 * Math.sqrt(Math.max(0, 1 - ((y - 60) / 150) ** 2));
            if (r > 2)
              b.add(
                G.tor,
                SKY_VC,
                x,
                y,
                z,
                2 * r,
                2 * r,
                0.6,
                Math.PI / 2,
                0,
                0,
                hdr("#e8f0ff", 1.5),
              );
          }
        },
        (b) => {
          // NTT Docomo Yoyogi-style tower with its spire
          const [x, z, ry] = polar(-24, 760);
          [
            [44, 140],
            [32, 200],
            [22, 236],
          ].forEach(([w, top], i, arr) => {
            const prev = i ? arr[i - 1][1] : -95;
            b.add(
              G.box,
              SKY_VC,
              x,
              (top + prev) / 2,
              z,
              w,
              top - prev,
              w * 0.8,
              0,
              ry,
              0,
              "#1e2442",
            );
            b.add(
              G.box,
              SKY_VC,
              x,
              top - 1,
              z,
              w + 0.6,
              1.2,
              w * 0.8 + 0.6,
              0,
              ry,
              0,
              hdr("#ffd9a0", 1.6),
            );
          });
          b.add(G.cone4, SKY_VC, x, 270, z, 8, 70, 8, 0, ry, 0, "#3a4060");
          b.sph(SKY_VC, hdr("#ff2a2a", 6), x, 306, z, 2.2);
        },
        (b) => {
          // Roppongi-style tower with light bands
          const [x, z] = polar(36, 720);
          b.add(G.cyl8, SKY_VC, x, 70, z, 60, 330, 50, 0, 0, 0, "#202840");
          for (let y = -60; y < 230; y += 24)
            b.add(
              G.cyl8,
              SKY_VC,
              x,
              y,
              z,
              61,
              1.4,
              51,
              0,
              0,
              0,
              hdr("#cfe6ff", 1.2),
            );
        },
      ],
    });

    // Yamanote-style commuter trains (green stripe, pantographs) parked; Shinkansen come at you
    const trainStyle = {
      body: "#cfd4dc",
      bodyMetal: true,
      roof: "#a8aeb8",
      under: "#1a1c20",
      stripe: "#7dc242",
      stripe2: "#2f8a3a",
      doors: true,
      door: "#bcc2cc",
      window: "#eaf4ff",
      windowK: 1.6,
      frame: "#101318",
      light: "#f4f8ff",
      sign: "#ff9a3c",
      roofUnit: "#8f96a2",
      rampMat: std({ map: stripeTex("#1e2026", "#ffcc00", 6), roughness: 0.6 }),
      rampGlow: "#7cf8ff",
      extra: (b, c) => {
        if (c.idx % 2) return;
        const zc = c.zb0 - c.bl * 0.3,
          H = TRAIN_H;
        b.box(VC.metal, "#3a3d44", 0, H + 0.18, zc, 1.2, 0.12, 1.4);
        for (const s of [-1, 1])
          b.add(
            G.box,
            VC.metal,
            0,
            H + 0.6,
            zc + s * 0.32,
            0.06,
            0.9,
            0.06,
            s * 0.75,
            0,
            0,
            "#2a2c30",
          );
        b.box(VC.metal, "#c9ced6", 0, H + 0.98, zc, 1.6, 0.06, 0.12);
      },
      movingStyle: {
        body: "#f4f6f8",
        roof: "#e1e5ea",
        stripe: "#1f4fa6",
        stripe2: "#1f4fa6",
        nose: "bullet",
        window: "#d6e6ff",
        windowK: 1.5,
        doors: false,
        light: "#ffffff",
        extra: null,
      },
    };

    // railroad crossing (踏切) bars with crossbucks and alternating lamps; road-works barricades (工事中)
    const barrier = barrierStyle({
      c1: "#ffcc00",
      c2: "#141414",
      label: "踏切",
      signBg: "#ffcc00",
      signFg: "#141414",
      glow: "#ff2d55",
      post: "#e8e8ea",
    });
    const kojiTex = textTex("工事中", {
      w: 256,
      h: 128,
      color: "#d81e2b",
      bg: "#ffffff",
      border: "#d81e2b",
      font: JP,
      weight: 400,
      size: 0.55,
    });
    const koji = std({
      map: kojiTex,
      roughness: 0.6,
      emissive: "#ffffff",
      emissiveMap: kojiTex,
      emissiveIntensity: 0.25,
    });
    barrier.lowExtra = (b) => {
      b.add(G.box, koji, 0, 1.45, 0, 0.9, 0.45, 0.05);
      b.box(VC.metal, "#888888", 0, 1.15, 0, 0.05, 0.2, 0.05);
    };
    barrier.highExtra = (b) => {
      for (const s of [-1, 1]) {
        const x = s * 1.15;
        b.box(VC.metal, "#e8e8ea", x, 3.25, 0, 0.16, 0.7, 0.16);
        b.add(
          G.box,
          barrier.barMat,
          x,
          3.45,
          0.12,
          1.25,
          0.2,
          0.05,
          0,
          0,
          0.62,
        );
        b.add(
          G.box,
          barrier.barMat,
          x,
          3.45,
          0.12,
          1.25,
          0.2,
          0.05,
          0,
          0,
          -0.62,
        );
        b.box(VC.solid, "#141414", x, 2.95, 0.12, 0.9, 0.08, 0.08);
        b.cyl(
          blink.cross1,
          0xffffff,
          x - 0.32,
          2.95,
          0.2,
          0.15,
          0.06,
          "cyl",
          Math.PI / 2,
        );
        b.cyl(
          blink.cross2,
          0xffffff,
          x + 0.32,
          2.95,
          0.2,
          0.15,
          0.06,
          "cyl",
          Math.PI / 2,
        );
      }
    };

    return {
      track,
      decor,
      skyline: sky,
      trainStyle,
      barrier,
      // the blossom landmarks are interleaved with the existing ones
      landmarks: [
        LM.landmarks[0],
        LM.landmarks[1],
        spring.landmarks.meguro,
        LM.landmarks[2],
        spring.landmarks.ueno,
        LM.landmarks[3],
        LM.landmarks[4],
      ],
      coinGeo: coinGeometry("yen"),
      coinMat: coinMaterial("#f2c94c", "#ffae00"),
      update(t) {
        K.screen.uniforms.time.value = t;
        LM.update(t);
        spring.update(t);
      },
    };
  },
};
