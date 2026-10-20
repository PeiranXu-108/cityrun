// Tokyo street kit: signage, facades and street furniture shared by the Tokyo decor and landmark scenes.
import {
  THREE,
  VC,
  G,
  std,
  basic,
  hdr,
  windowTex,
  signAtlas,
  planeUV,
  canvasTex,
  CHUNK_LEN,
  rand,
  randi,
  pick,
  chance,
} from "../core.js";
import { facadeMat, buildingRow, EDGE, screenMat, waterMat } from "./common.js";

export const JP =
  '"Dela Gothic One", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif';
export const SNOW = "#eef3fa";
export const RED = "#d81e2b";
export const VERMILION = "#c8281e";

// vertical shop boards (縦看板) that stick out from the facades
const V_SIGNS = [
  { t: "居酒屋", bg: "#ffffff", fg: "#d81e2b" },
  { t: "カラオケ", bg: "#151518", fg: "#ff3df0", neon: true },
  { t: "ラーメン", bg: "#ffd23d", fg: "#141414" },
  { t: "焼肉", bg: "#d81e2b", fg: "#ffffff" },
  { t: "寿司", bg: "#ffffff", fg: "#1f4fa6" },
  { t: "麻雀", bg: "#0f6b3a", fg: "#ffffff" },
  { t: "BAR", bg: "#151518", fg: "#00e5ff", neon: true },
  { t: "喫茶", bg: "#5a3a24", fg: "#ffe6c4" },
  { t: "ホテル", bg: "#151518", fg: "#ff2d55", neon: true },
  { t: "歯科", bg: "#ffffff", fg: "#1f8a4a" },
  { t: "整体", bg: "#1f4fa6", fg: "#ffffff" },
  { t: "牛丼", bg: "#ff8a1a", fg: "#ffffff" },
  { t: "ゲーム", bg: "#151518", fg: "#ffd23d", neon: true },
  { t: "占い", bg: "#3a1a5a", fg: "#ffd6ff" },
  { t: "古本", bg: "#e8dcc4", fg: "#141414" },
  { t: "酒", bg: "#d81e2b", fg: "#ffffff" },
];
// neon signs mounted flat on facades or on rooftop frames
const H_SIGNS = [
  { text: "カラオケ", color: "#ff3df0" },
  { text: "居酒屋", color: "#ff3b3b", border: true },
  { text: "ゲームセンター", color: "#00e5ff" },
  { text: "24時間営業", color: "#39ff88", border: true },
  { text: "ラーメン", color: "#ffb13d" },
  { text: "TOKYO", color: "#ff2d55", border: true },
  { text: "焼き鳥", color: "#ff6a3d" },
  { text: "ドラッグストア", color: "#ffe23d", border: true },
  { text: "BAR", color: "#b26bff", border: true },
  { text: "寿司", color: "#3dfff0" },
  { text: "新宿", color: "#ff9ad5", border: true },
  { text: "渋谷", color: "#7cf8ff" },
].map((e) => ({ ...e, font: JP, weight: 400 }));
// giant LED screens
const ADS = [
  {
    bg: ["#ff2d55", "#7b2ff7"],
    text: "東京",
    sub: "TOKYO NIGHT",
    icon: "circle",
  },
  {
    bg: ["#ffb000", "#ff3d00"],
    text: "ラーメン",
    sub: "一杯 ¥980",
    icon: "steam",
  },
  {
    bg: ["#00c2ff", "#0040ff"],
    text: "新発売",
    sub: "ソーダ SODA",
    icon: "bubbles",
  },
  {
    bg: ["#ff5fa2", "#ffd23d"],
    text: "LIVE",
    sub: "アイドル 今夜",
    icon: "stars",
  },
  {
    bg: ["#141414", "#3a0a0a"],
    text: "SALE",
    sub: "50%OFF 本日限り",
    icon: "bar",
    fg: "#ffd23d",
  },
  {
    bg: ["#12c27e", "#04402c"],
    text: "CITY DASH",
    sub: "シティダッシュ",
    icon: "bolt",
  },
  {
    bg: ["#1a1440", "#5a2a8a"],
    text: "夜景",
    sub: "YAKEI 東京",
    icon: "skyline",
  },
  {
    bg: ["#f2f4ff", "#a9b8ff"],
    text: "寿司",
    sub: "SUSHI 回転",
    icon: "fish",
    fg: "#141414",
  },
];
const NOREN = [
  { t: "らーめん", bg: "#1d2a4a" },
  { t: "酒", bg: "#7a1b1b" },
  { t: "やきとり", bg: "#1a1a1a" },
  { t: "そば", bg: "#2a3a2a" },
];
const EXTRA =
  "雷門小舟町歌舞伎町一番街渋谷駅工事中踏切新宿浅草寺仲見世｜ShinjukuShibuyaSTATIONたこ焼きやきそばりんご飴わたあめチョコバナナかき氷目黒川上野恩賜公園桜";
// every glyph the Tokyo canvases draw, so the Japanese web font can be fetched before textures are built
export const GLYPHS = [
  ...new Set(
    [
      ...V_SIGNS.map((s) => s.t),
      ...H_SIGNS.map((s) => s.text),
      ...ADS.map((a) => a.text + a.sub),
      ...NOREN.map((n) => n.t),
      EXTRA,
    ].join(""),
  ),
].join("");

// ---------- geometry helpers ----------
const _a = new THREE.Vector3(),
  _q = new THREE.Quaternion(),
  _m = new THREE.Matrix4(),
  _s = new THREE.Vector3(),
  _c = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
// box stretched between two points (lattices, cables, stairs); t / t2 are the cross-section sizes
export function beam(
  b,
  mat,
  x0,
  y0,
  z0,
  x1,
  y1,
  z1,
  t = 0.12,
  color = 0xffffff,
  t2 = t,
) {
  _a.set(x1 - x0, y1 - y0, z1 - z0);
  const len = _a.length();
  if (len < 1e-5) return;
  _q.setFromUnitVectors(UP, _a.multiplyScalar(1 / len));
  _m.compose(
    _c.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2),
    _q,
    _s.set(t, len, t2),
  );
  b.addM(G.box, mat, _m, color);
}
// sagging cable; only segments overlapping [zMin, zMax] are drawn (so spans can cross chunk seams)
export function wire(
  b,
  x0,
  y0,
  z0,
  x1,
  y1,
  z1,
  sag = 0.5,
  {
    color = "#121317",
    t = 0.035,
    n = 6,
    zMin = -Infinity,
    zMax = Infinity,
  } = {},
) {
  let px = x0,
    py = y0,
    pz = z0;
  for (let i = 1; i <= n; i++) {
    const s = i / n,
      x = x0 + (x1 - x0) * s,
      z = z0 + (z1 - z0) * s,
      y = y0 + (y1 - y0) * s - sag * 4 * s * (1 - s);
    if (Math.max(pz, z) >= zMin && Math.min(pz, z) <= zMax)
      beam(b, VC.solid, px, py, pz, x, y, z, t, color);
    px = x;
    py = y;
    pz = z;
  }
}
// vertical text (top to bottom) on a tall canvas
export function vText(
  text,
  { w = 128, h = 512, color = "#ffffff", glow = null, bg = null } = {},
) {
  return canvasTex(
    w,
    h,
    (g) => {
      if (bg) {
        g.fillStyle = bg;
        g.fillRect(0, 0, w, h);
      } else g.clearRect(0, 0, w, h);
      const chars = [...text],
        size = Math.min(w * 0.8, (h * 0.9) / chars.length);
      g.font = `400 ${Math.floor(size)}px ${JP}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      if (glow) {
        g.shadowColor = glow;
        g.shadowBlur = size * 0.25;
      }
      g.fillStyle = color;
      chars.forEach((c, k) =>
        g.fillText(c, w / 2, h / 2 + (k - (chars.length - 1) / 2) * size),
      );
    },
    { repeat: false },
  );
}

// ---------- textures ----------
function vSignAtlas() {
  const cw = 96,
    ch = 384,
    n = V_SIGNS.length;
  const tex = canvasTex(
    cw * n,
    ch,
    (g) => {
      V_SIGNS.forEach((s, i) => {
        const x = i * cw;
        g.shadowBlur = 0;
        g.fillStyle = s.bg;
        g.fillRect(x + 4, 4, cw - 8, ch - 8);
        if (s.neon) {
          g.shadowColor = s.fg;
          g.shadowBlur = 14;
        }
        g.strokeStyle = s.neon ? s.fg : "rgba(0,0,0,0.35)";
        g.lineWidth = s.neon ? 5 : 3;
        g.strokeRect(x + 11, 11, cw - 22, ch - 22);
        const chars = [...s.t.replace(/ー/g, "｜")];
        const size = Math.min(62, ((ch - 54) / chars.length) * 0.92);
        g.font = `400 ${Math.floor(size)}px ${JP}`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = s.fg;
        chars.forEach((c, k) =>
          g.fillText(
            c,
            x + cw / 2,
            ch / 2 + (k - (chars.length - 1) / 2) * size * 1.06,
          ),
        );
      });
      g.shadowBlur = 0;
    },
    { repeat: false },
  );
  const geos = V_SIGNS.map((_, i) => {
    const geo = new THREE.PlaneGeometry(1, 4),
      uv = geo.attributes.uv,
      u0 = i / n,
      u1 = (i + 1) / n;
    uv.setXY(0, u0, 1);
    uv.setXY(1, u1, 1);
    uv.setXY(2, u0, 0);
    uv.setXY(3, u1, 0);
    return geo;
  });
  return { tex, geos };
}

function adAtlas() {
  const CW = 384,
    CH = 240;
  return canvasTex(
    CW * ADS.length,
    CH,
    (g) => {
      ADS.forEach((a, i) => {
        const x0 = i * CW;
        const gr = g.createLinearGradient(x0, 0, x0 + CW, CH);
        gr.addColorStop(0, a.bg[0]);
        gr.addColorStop(1, a.bg[1]);
        g.fillStyle = gr;
        g.fillRect(x0, 0, CW, CH);
        g.save();
        g.beginPath();
        g.rect(x0, 0, CW, CH);
        g.clip();
        g.globalAlpha = 0.35;
        g.fillStyle = "#ffffff";
        if (a.icon === "circle") {
          g.globalAlpha = 0.6;
          g.fillStyle = "#ffffff";
          g.beginPath();
          g.arc(x0 + CW * 0.78, CH * 0.45, 62, 0, 7);
          g.fill();
        }
        if (a.icon === "steam")
          for (let k = 0; k < 5; k++) {
            g.lineWidth = 6;
            g.strokeStyle = "#ffffff";
            g.beginPath();
            for (let y = 30; y < 150; y += 6)
              g.lineTo(x0 + 250 + k * 22 + Math.sin(y * 0.08 + k) * 8, y);
            g.stroke();
          }
        if (a.icon === "bubbles")
          for (let k = 0; k < 18; k++) {
            g.beginPath();
            g.arc(x0 + rand(0, CW), rand(0, CH), rand(4, 22), 0, 7);
            g.fill();
          }
        if (a.icon === "stars")
          for (let k = 0; k < 14; k++) {
            g.font = `${randi(18, 40)}px sans-serif`;
            g.fillText("★", x0 + rand(0, CW), rand(20, CH));
          }
        if (a.icon === "bar") {
          g.globalAlpha = 0.9;
          g.fillStyle = "#ff2a2a";
          g.fillRect(x0, CH - 52, CW, 52);
        }
        if (a.icon === "bolt")
          for (let k = 0; k < 7; k++)
            g.fillRect(x0 + rand(0, CW), rand(0, CH), rand(60, 160), 4);
        if (a.icon === "skyline") {
          g.globalAlpha = 0.55;
          g.fillStyle = "#0a0820";
          for (let k = 0; k < 14; k++) {
            const w = rand(16, 34),
              h = rand(40, 140);
            g.fillRect(x0 + k * 28, CH - h, w, h);
          }
          g.fillStyle = "#ff6a2a";
          g.fillRect(x0 + 300, CH - 190, 8, 190);
        }
        if (a.icon === "fish") {
          g.globalAlpha = 0.5;
          g.fillStyle = "#ff6a3d";
          g.beginPath();
          g.ellipse(x0 + CW * 0.8, CH * 0.45, 60, 26, 0, 0, 7);
          g.fill();
        }
        g.restore();
        g.globalAlpha = 1;
        g.textAlign = "left";
        g.textBaseline = "alphabetic";
        g.fillStyle = a.fg || "#ffffff";
        g.font = `400 66px ${JP}`;
        const m = g.measureText(a.text).width,
          sc = Math.min(1, (CW - 40) / m);
        g.save();
        g.translate(x0 + 20, 128);
        g.scale(sc, 1);
        g.fillText(a.text, 0, 0);
        g.restore();
        g.font = `400 26px ${JP}`;
        g.globalAlpha = 0.92;
        g.fillText(a.sub, x0 + 22, 172);
        g.globalAlpha = 1;
      });
    },
    { repeat: false },
  );
}

function norenAtlas() {
  const cw = 256,
    ch = 128,
    n = NOREN.length;
  const tex = canvasTex(
    cw * n,
    ch,
    (g) => {
      NOREN.forEach((s, i) => {
        const x = i * cw;
        g.fillStyle = s.bg;
        g.fillRect(x, 0, cw, ch);
        g.fillStyle = "rgba(0,0,0,0.45)";
        for (let k = 1; k < 4; k++)
          g.fillRect(x + (k * cw) / 4 - 2, ch * 0.35, 4, ch * 0.65);
        g.fillStyle = "#ffffff";
        g.font = `400 ${[...s.t].length > 2 ? 46 : 72}px ${JP}`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(s.t, x + cw / 2, ch * 0.52);
      });
    },
    { repeat: false },
  );
  return {
    tex,
    rects: NOREN.map((_, i) => ({ u0: i / n, u1: (i + 1) / n, v0: 0, v1: 1 })),
  };
}

function ledDotsTex() {
  return canvasTex(
    128,
    128,
    (g, w, h) => {
      g.clearRect(0, 0, w, h);
      for (let i = 0; i < 170; i++) {
        const a = Math.random() * Math.PI * 2,
          r = Math.sqrt(Math.random()) * 60;
        const x = w / 2 + Math.cos(a) * r,
          y = h / 2 + Math.sin(a) * r * 0.9;
        const gr = g.createRadialGradient(x, y, 0, x, y, 3.4);
        gr.addColorStop(0, "rgba(255,255,255,1)");
        gr.addColorStop(1, "rgba(120,190,255,0)");
        g.fillStyle = gr;
        g.fillRect(x - 4, y - 4, 8, 8);
      }
    },
    { repeat: false },
  );
}

function roadSignTex() {
  return canvasTex(
    1024,
    128,
    (g, w, h) => {
      g.fillStyle = "#1f5fbf";
      g.fillRect(0, 0, w, h);
      g.strokeStyle = "#ffffff";
      g.lineWidth = 6;
      g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = "#ffffff";
      g.textBaseline = "middle";
      g.textAlign = "left";
      g.font = `400 52px ${JP}`;
      g.fillText("新宿", 48, 54);
      g.fillText("渋谷", 572, 54);
      g.font = '700 24px "Chakra Petch", sans-serif';
      g.fillText("Shinjuku", 52, 100);
      g.fillText("Shibuya", 576, 100);
      const arrow = (x, y, dir) => {
        g.save();
        g.translate(x, y);
        g.rotate(dir);
        g.fillRect(-6, -10, 12, 46);
        g.beginPath();
        g.moveTo(-24, -6);
        g.lineTo(0, -40);
        g.lineTo(24, -6);
        g.closePath();
        g.fill();
        g.restore();
      };
      arrow(330, 70, 0);
      arrow(860, 64, Math.PI / 2);
    },
    { repeat: false },
  );
}

// ---------- the kit ----------
export function makeKit() {
  const K = {};
  // facades
  K.zak = windowTex({
    wall: "#4a4c55",
    glass: "#0e1118",
    lit: ["#fff1d6", "#d8ecff", "#ffd9a8", "#ffe6f0"],
    litChance: 0.5,
    frame: "#7a7e88",
    cols: 6,
  });
  K.zakMat = facadeMat(K.zak, { k: 0.95 });
  K.office = windowTex({
    wall: "#1c2230",
    glass: "#22314a",
    lit: ["#e6f2ff", "#ffffff", "#cfe4ff"],
    litChance: 0.45,
    band: true,
  });
  K.officeMat = facadeMat(K.office, { k: 0.8, rough: 0.25, metal: 0.6 });
  K.mansion = windowTex({
    wall: "#cfc6b8",
    glass: "#1a1d24",
    lit: ["#ffe2b0", "#fff4dc"],
    litChance: 0.45,
    ledge: "#9a9284",
    cols: 5,
  });
  K.mansionMat = facadeMat(K.mansion, { k: 0.8 });
  // signage
  const v = vSignAtlas();
  K.vgeos = v.geos;
  K.vsMat = basic({ map: v.tex, color: hdr("#ffffff", 1.25) });
  const hs = signAtlas(H_SIGNS, { cols: 2 });
  K.hsRects = hs.rects;
  K.hsMat = basic({
    map: hs.tex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: hdr("#ffffff", 1.3),
  });
  K.screen = screenMat(adAtlas(), ADS.length, 1.3);
  K.noren = norenAtlas();
  K.norenMat = std({
    map: K.noren.tex,
    side: THREE.DoubleSide,
    roughness: 0.9,
    emissive: "#ffffff",
    emissiveMap: K.noren.tex,
    emissiveIntensity: 0.25,
  });
  K.ledMat = basic({
    map: ledDotsTex(),
    color: hdr("#3f9cff", 0.9),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  K.roadMat = basic({ map: roadSignTex(), color: hdr("#ffffff", 1.05) });
  K.bay = waterMat("#141c38", 10);

  K.hSign = (b, x, y, z, side, w, i = randi(0, K.hsRects.length - 1)) =>
    b.add(
      planeUV(K.hsRects[i]),
      K.hsMat,
      x,
      y,
      z,
      w,
      w / 4,
      1,
      0,
      (-side * Math.PI) / 2,
    );
  // billboard on a rooftop frame, facing the runner (+z)
  K.roofBoard = (b, x, y, z, w) => {
    const i = randi(0, K.hsRects.length - 1);
    b.box(VC.solid, "#121216", x, y + w / 8, z, w + 0.2, w / 4 + 0.2, 0.15);
    b.add(planeUV(K.hsRects[i]), K.hsMat, x, y + w / 8, z + 0.09, w, w / 4, 1);
    for (const dx of [-w * 0.35, w * 0.35])
      b.box(VC.metal, "#2a2a2e", x + dx, y - 0.6, z - 0.3, 0.12, 1.4, 0.12);
  };
  // stack of vertical boards sticking out of a facade, readable along the street
  K.signStack = (b, face, side, z, y0, yMax) => {
    let y = y0,
      n = 0;
    while (y < yMax - 1.6 && n < 6) {
      const sh = rand(1.7, 2.6),
        sw = (sh / 4) * rand(0.9, 1.1);
      if (y + sh > yMax) break;
      const sx = face - side * (0.3 + sw / 2),
        sy = y + sh / 2,
        geo = pick(K.vgeos);
      b.box(VC.solid, "#18181c", sx, sy, z, sw + 0.08, sh + 0.08, 0.1);
      b.add(geo, K.vsMat, sx, sy, z + 0.055, sw, sh / 4, 1);
      b.add(geo, K.vsMat, sx, sy, z - 0.055, sw, sh / 4, 1, 0, Math.PI);
      y += sh + 0.22;
      n++;
    }
    if (n)
      b.box(
        VC.metal,
        "#2a2a2e",
        face - side * 0.15,
        (y0 + y) / 2,
        z,
        0.3,
        y - y0,
        0.06,
      );
  };
  // red paper lantern (赤提灯)
  K.chochin = (b, x, y, z, s = 1) => {
    b.add(
      G.sph,
      VC.glow,
      x,
      y,
      z,
      0.5 * s,
      0.75 * s,
      0.5 * s,
      0,
      0,
      0,
      hdr("#ff3a2a", 2.6),
    );
    b.cyl(VC.solid, "#151515", x, y + 0.38 * s, z, 0.17 * s, 0.07 * s);
    b.cyl(VC.solid, "#151515", x, y - 0.38 * s, z, 0.17 * s, 0.07 * s);
    b.cyl(VC.solid, "#151515", x, y + 0.55 * s, z, 0.02, 0.3 * s);
  };
  // ground-floor shops: convenience store, izakaya / ramen with noren and lanterns, or a lit shop window
  K.shopFront = (b, i) => {
    const x = i.face - i.side * 0.04,
      L = Math.min(i.len - 0.8, 6.5),
      s = i.side;
    const kind = pick([
      "konbini",
      "izakaya",
      "ramen",
      "shop",
      "shop",
      "konbini",
    ]);
    b.box(VC.solid, "#1a1a1e", x, 3.15, i.z, 0.12, 0.5, i.len - 0.2);
    if (kind === "konbini") {
      b.box(
        VC.glow,
        hdr("#e6f2ff", 0.55),
        x - s * 0.02,
        1.45,
        i.z,
        0.05,
        2.5,
        L,
      );
      const bands = pick([
        ["#1f6fd0", "#ffffff", "#1f6fd0"],
        ["#2fa84f", "#ffffff", "#1f6fd0"],
        ["#ff8a1a", "#2fa84f", "#d81e2b"],
      ]);
      bands.forEach((c, k) =>
        b.box(
          VC.glow,
          hdr(c, 1.0),
          x - s * 0.08,
          3.0 + k * 0.22,
          i.z,
          0.05,
          0.22,
          L + 0.4,
        ),
      );
      for (let k = 0; k < 3; k++)
        b.box(
          VC.glow,
          hdr(pick(["#ffd23d", "#ff6a8a", "#7cf8ff", "#ffffff"]), 1.0),
          x - s * 0.03,
          0.6 + k * 0.55,
          i.z + rand(-L / 3, L / 3),
          0.03,
          0.35,
          rand(0.8, 1.6),
        );
    } else if (kind === "izakaya" || kind === "ramen") {
      b.box(VC.solid, "#4a3020", x - s * 0.02, 1.45, i.z, 0.06, 2.9, L);
      b.box(
        VC.glow,
        hdr("#ffcf8a", 0.9),
        x - s * 0.05,
        1.15,
        i.z,
        0.04,
        1.6,
        L * 0.55,
      );
      b.add(
        planeUV(K.noren.rects[kind === "ramen" ? 0 : randi(1, 3)]),
        K.norenMat,
        x - s * 0.1,
        2.35,
        i.z,
        Math.min(L * 0.55, 3.4),
        0.85,
        1,
        0,
        (-s * Math.PI) / 2,
      );
      for (const dz of [-L * 0.38, L * 0.38])
        K.chochin(b, x - s * 0.45, 2.45, i.z + dz, 0.8);
    } else {
      b.box(
        VC.glow,
        hdr(pick(["#ffe0b0", "#ffd0e6", "#d6ecff"]), 0.5),
        x - s * 0.02,
        1.4,
        i.z,
        0.05,
        2.3,
        L,
      );
    }
  };

  // building types for buildingRow
  const snowTop = (b, i) =>
    b.box(VC.solid, SNOW, i.x, i.h + 0.06, i.z, i.d + 0.06, 0.12, i.len + 0.06);
  K.types = [
    {
      mat: K.zakMat,
      tex: K.zak,
      colors: [
        "#ffffff",
        "#ddd3c6",
        "#b9c4cf",
        "#c9b0a0",
        "#a0a6b0",
        "#d6c0c0",
      ],
      w: [5, 9],
      h: [14, 34],
      weight: 3.2,
      cellW: 1.2,
      cellH: 2.5,
      roof: (b, i) => {
        snowTop(b, i);
        if (chance(0.35))
          K.roofBoard(
            b,
            i.x,
            i.h + 1.0,
            i.z + i.len / 2 - 0.6,
            Math.min(i.len - 1, 7),
          );
        else if (chance(0.5)) {
          b.cyl(VC.metal, "#8a9098", i.x, i.h + 1.2, i.z, 1.0, 2.4);
          b.cyl(VC.solid, SNOW, i.x, i.h + 2.45, i.z, 1.0, 0.1);
        }
      },
      front: (b, i) => {
        K.signStack(b, i.face, i.side, i.z + i.len / 2 - 0.6, 3.7, i.h - 0.5);
        if (i.len > 6 && chance(0.5))
          K.signStack(b, i.face, i.side, i.z - i.len / 2 + 0.6, 4.4, i.h - 0.5);
        K.shopFront(b, i);
      },
    },
    {
      mat: K.officeMat,
      tex: K.office,
      colors: ["#ffffff", "#c9d6ff", "#a9b8d9"],
      w: [12, 18],
      h: [30, 62],
      weight: 1.1,
      cellW: 1.3,
      cellH: 2.6,
      roof: (b, i) => {
        snowTop(b, i);
        b.cyl(VC.metal, "#9aa3b5", i.x, i.h + 4, i.z, 0.12, 8);
        b.sph(VC.glow, hdr("#ff2a2a", 4), i.x, i.h + 8.2, i.z, 0.3);
      },
      front: (b, i) => {
        if (chance(0.6))
          K.hSign(
            b,
            i.face - i.side * 0.1,
            rand(8, 16),
            i.z,
            i.side,
            Math.min(9, i.len - 2),
          );
        K.shopFront(b, i);
      },
    },
    {
      mat: K.mansionMat,
      tex: K.mansion,
      colors: ["#ffffff", "#e8e0d4", "#d6d0c6"],
      w: [8, 13],
      h: [10, 22],
      weight: 1.4,
      cellW: 1.5,
      cellH: 2.7,
      roof: (b, i) => {
        snowTop(b, i);
        if (K.koinobori && chance(0.22)) K.koinobori(b, i.x, i.h, i.z, i.side);
      },
      front: (b, i) => {
        for (let y = 3.6; y < i.h - 1; y += 2.7) {
          b.box(
            VC.solid,
            "#c9c2b6",
            i.face - i.side * 0.55,
            y,
            i.z,
            1.1,
            0.12,
            i.len - 0.4,
          );
          b.box(
            VC.solid,
            "#e6e0d6",
            i.face - i.side * 1.05,
            y + 0.5,
            i.z,
            0.08,
            1.0,
            i.len - 0.4,
          );
          b.box(
            VC.solid,
            SNOW,
            i.face - i.side * 0.6,
            y + 0.08,
            i.z,
            1.0,
            0.04,
            i.len - 0.5,
          );
          if (chance(0.5))
            b.block(
              VC.solid,
              "#d8d8d4",
              i.face - i.side * 0.7,
              y + 0.06,
              i.z + rand(-i.len / 3, i.len / 3),
              0.5,
              0.55,
              0.8,
            );
        }
        K.shopFront(b, i);
      },
    },
  ];
  K.row = (b, side, z0, z1) => {
    if (z1 - z0 > 3)
      buildingRow(b, side, K.types, {
        x0: 11,
        depth: [8, 14],
        gap: [0.05, 0.6],
        z0,
        z1,
      });
  };

  // ---------- street furniture ----------
  K.pole = (b, x, z, side) => {
    b.cyl(VC.solid, "#a3a39e", x, 5, z, 0.17, 10, "cyl8");
    for (let k = 0; k < 4; k++)
      b.cyl(
        VC.solid,
        k % 2 ? "#141414" : "#f2c200",
        x,
        0.25 + k * 0.5,
        z,
        0.21,
        0.5,
        "cyl8",
      );
    b.box(VC.solid, "#55565a", x, 9.45, z, 2.4, 0.14, 0.14);
    b.box(VC.solid, "#55565a", x, 8.7, z, 1.4, 0.12, 0.12);
    for (const dx of [-1, 0, 1])
      b.cyl(VC.solid, "#e8e2d6", x + dx, 9.6, z, 0.06, 0.2, "cyl6");
    b.cyl(VC.metal, "#7d8288", x + side * 0.42, 7.3, z, 0.34, 1.1);
    b.box(VC.solid, "#55565a", x - side * 0.55, 6.05, z, 1.1, 0.07, 0.07);
    b.box(
      VC.glow,
      hdr("#fff0d0", 2.6),
      x - side * 1.05,
      5.95,
      z,
      0.45,
      0.1,
      0.22,
    );
    b.box(VC.solid, SNOW, x, 9.54, z, 2.3, 0.05, 0.16);
  };
  // poles sit at the same spots in every chunk, so the wire spans continue across chunk seams
  const POLE_Z = [2, 18, 34, 50, 66];
  K.poleLine = (b, side, skip = () => false) => {
    const x = side * (EDGE + 2.2);
    const att = [
      [x - 1.0, 9.6],
      [x, 9.6],
      [x + 1.0, 9.55],
      [x, 8.75],
    ];
    for (const z of POLE_Z) if (!skip(z)) K.pole(b, x, -z, side);
    const all = [
      POLE_Z[POLE_Z.length - 1] - CHUNK_LEN,
      ...POLE_Z,
      POLE_Z[0] + CHUNK_LEN,
    ];
    for (let i = 0; i < all.length - 1; i++) {
      const za = all[i],
        zb = all[i + 1];
      if (skip(za) || skip(zb)) continue;
      for (const [ax, ay] of att)
        wire(b, ax, ay, -za, ax, ay, -zb, 0.45, {
          zMin: -CHUNK_LEN - 0.5,
          zMax: 0.5,
        });
    }
  };
  K.vending = (b, x, z, side, n = 3) => {
    for (let k = 0; k < n; k++) {
      const zz = z - k * 1.08,
        body = pick([
          "#f4f4f4",
          RED,
          "#1f5fbf",
          "#f4f4f4",
          "#2a2a2e",
          "#e8e0c8",
        ]);
      b.block(VC.solid, body, x, 0, zz, 0.85, 1.9, 1.0);
      b.box(
        VC.glow,
        hdr("#f4fbff", 1.0),
        x - side * 0.43,
        1.3,
        zz,
        0.02,
        0.78,
        0.86,
      );
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 4; c++) {
          b.box(
            VC.glow,
            hdr(
              pick([
                "#ff3b3b",
                "#ffd23d",
                "#39c0ff",
                "#39ff88",
                "#ff8a2a",
                "#ffffff",
                "#b26bff",
              ]),
              1.7,
            ),
            x - side * 0.445,
            1.02 + r * 0.25,
            zz - 0.3 + c * 0.2,
            0.02,
            0.15,
            0.09,
          );
        }
      b.box(VC.solid, "#101012", x - side * 0.43, 0.5, zz, 0.02, 0.22, 0.6);
      b.box(VC.solid, SNOW, x, 1.93, zz, 0.86, 0.06, 1.02);
    }
  };
  const COATS = [
    "#23252e",
    "#3a2f3f",
    "#1f2a3a",
    "#4a3a34",
    "#2f3a2f",
    "#5a2b33",
    "#2a3550",
    "#8a7a6a",
    "#c9c0b0",
  ];
  // pedestrians, some under clear vinyl umbrellas (ビニール傘)
  K.crowd = (b, x0, x1, z0, z1, n, umb = 0.35) => {
    for (let i = 0; i < n; i++) {
      const x = rand(Math.min(x0, x1), Math.max(x0, x1)),
        z = -rand(z0, z1),
        s = rand(0.9, 1.08);
      b.add(
        G.cyl8,
        VC.solid,
        x,
        0.55 * s,
        z,
        0.3 * s,
        1.1 * s,
        0.24 * s,
        0,
        0,
        0,
        "#1c1c22",
      );
      b.box(
        VC.solid,
        pick(COATS),
        x,
        1.25 * s,
        z,
        0.46 * s,
        0.62 * s,
        0.28 * s,
      );
      b.sph(VC.solid, "#d9b08c", x, 1.72 * s, z, 0.15 * s, true);
      b.sph(
        VC.solid,
        pick(["#141414", "#2a1a12", "#3a2a1a"]),
        x,
        1.79 * s,
        z + 0.02,
        0.16 * s,
        true,
      );
      if (Math.random() < umb) {
        b.cyl(VC.solid, "#333333", x + 0.12, 1.75, z, 0.015, 0.8);
        b.add(
          G.cone,
          VC.solid,
          x + 0.12,
          2.22,
          z,
          1.15,
          0.32,
          1.15,
          0,
          0,
          0,
          pick([
            "#e9eef5",
            "#e9eef5",
            "#e9eef5",
            "#1a1a1e",
            "#2a3a6a",
            "#b3202c",
          ]),
        );
      }
    }
  };
  K.taxi = (b, x, z) => {
    const body = pick(["#1d2540", "#1d2540", "#f2c200", "#2a6b3a", "#e8e8ea"]);
    b.block(VC.solid, body, x, 0.3, z, 1.7, 0.75, 4.0);
    b.block(VC.solid, body, x, 1.05, z + 0.2, 1.6, 0.68, 2.3);
    b.box(VC.glow, hdr("#bcd6ff", 0.5), x, 1.4, z + 0.2, 1.62, 0.32, 2.05);
    b.box(VC.glow, hdr("#ffcf5a", 2.4), x, 1.92, z + 0.35, 0.55, 0.22, 0.22);
    b.box(VC.solid, SNOW, x, 1.76, z + 0.2, 1.52, 0.05, 2.15);
    for (const dz of [-1.3, 1.3])
      for (const dx of [-0.8, 0.8])
        b.cyl(
          VC.solid,
          "#111111",
          x + dx,
          0.3,
          z + dz,
          0.3,
          0.22,
          "cyl",
          0,
          Math.PI / 2,
        );
    b.box(VC.glow, hdr("#fff4d6", 2.4), x, 0.62, z + 2.01, 1.3, 0.12, 0.04);
    b.box(VC.glow, hdr("#ff2a2a", 2.0), x, 0.62, z - 2.01, 1.3, 0.12, 0.04);
  };
  // zelkova wrapped in blue winter illumination
  K.ledTree = (b, x, z, s = 1) => {
    b.cyl(VC.solid, "#2a2420", x, 1.5 * s, z, 0.16 * s, 3 * s, "cyl8");
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + rand(0, 1);
      beam(
        b,
        VC.solid,
        x,
        2.6 * s,
        z,
        x + Math.cos(a) * 1.6 * s,
        4.4 * s,
        z + Math.sin(a) * 1.6 * s,
        0.09 * s,
        "#2a2420",
      );
    }
    for (let k = 0; k < 7; k++) {
      const cx = x + rand(-1.5, 1.5) * s,
        cy = rand(2.7, 5.4) * s,
        cz = z + rand(-1.5, 1.5) * s,
        ry = rand(0, Math.PI);
      b.add(G.plane, K.ledMat, cx, cy, cz, 2.3 * s, 2.3 * s, 1, 0, ry, 0);
      b.add(
        G.plane,
        K.ledMat,
        cx,
        cy,
        cz,
        2.3 * s,
        2.3 * s,
        1,
        0,
        ry + Math.PI / 2,
        0,
      );
    }
  };
  K.bike = (b, x, z) => {
    for (const dz of [-0.55, 0.55])
      b.add(
        G.tor,
        VC.metal,
        x,
        0.36,
        z + dz,
        0.72,
        0.72,
        0.72,
        0,
        Math.PI / 2,
        0,
        "#2a2a2e",
      );
    beam(
      b,
      VC.metal,
      x,
      0.36,
      z - 0.55,
      x,
      0.8,
      z + 0.1,
      0.05,
      pick(["#d81e2b", "#e8e8ea", "#1f5fbf", "#3a8a5a"]),
    );
    beam(b, VC.metal, x, 0.36, z + 0.55, x, 0.95, z + 0.4, 0.05, "#555555");
    beam(b, VC.metal, x, 0.8, z + 0.1, x, 0.92, z + 0.45, 0.05, "#555555");
    b.box(VC.metal, "#888888", x, 0.98, z + 0.55, 0.32, 0.22, 0.28);
    b.box(VC.solid, "#151515", x, 0.88, z - 0.15, 0.12, 0.06, 0.28);
  };
  K.postbox = (b, x, z) => {
    b.cyl(VC.solid, RED, x, 0.65, z, 0.3, 1.3);
    b.sph(VC.solid, RED, x, 1.3, z, 0.3);
    b.box(VC.solid, "#151515", x, 1.05, z, 0.62, 0.05, 0.2);
    b.cyl(VC.solid, SNOW, x, 1.58, z, 0.18, 0.06);
  };
  // horizontal Japanese traffic signal (blue / yellow / red) facing the runner
  K.signal = (b, x, z, side) => {
    b.cyl(VC.metal, "#7a7e86", x, 3.2, z, 0.1, 6.4);
    b.box(VC.metal, "#7a7e86", x - side * 1.1, 5.9, z, 2.2, 0.1, 0.1);
    const hx = x - side * 2.0;
    b.box(VC.solid, "#2a2c30", hx, 5.9, z, 1.5, 0.42, 0.4);
    b.cyl(
      VC.glow,
      hdr("#19e0a0", 3.2),
      hx - 0.5,
      5.9,
      z + 0.21,
      0.16,
      0.05,
      "cyl",
      Math.PI / 2,
    );
    b.cyl(
      VC.solid,
      "#5a4a20",
      hx,
      5.9,
      z + 0.21,
      0.16,
      0.05,
      "cyl",
      Math.PI / 2,
    );
    b.cyl(
      VC.solid,
      "#5a2020",
      hx + 0.5,
      5.9,
      z + 0.21,
      0.16,
      0.05,
      "cyl",
      Math.PI / 2,
    );
    b.box(VC.solid, SNOW, hx, 6.13, z, 1.5, 0.05, 0.4);
  };
  // pedestrian bridge (歩道橋) with a blue road sign facing the runner
  K.footbridge = (b, z) => {
    const col = pick(["#3d7bd1", "#3a8a5a", "#7f8c98", "#2f6f9f"]),
      y = 6.4,
      W = 10.6;
    b.box(VC.metal, col, 0, y, z, 2 * W, 0.6, 3);
    b.box(VC.solid, SNOW, 0, y + 0.32, z, 2 * W, 0.05, 2.8);
    for (const s of [-1, 1]) {
      b.box(VC.metal, col, 0, y + 1.0, z + s * 1.45, 2 * W, 0.1, 0.1);
      for (let x = -W + 0.2; x <= W; x += 0.55)
        b.box(VC.metal, col, x, y + 0.65, z + s * 1.45, 0.05, 0.7, 0.05);
      for (const px of [4.5, W - 0.6])
        b.box(VC.metal, "#5a6068", s * px, y / 2, z, 0.45, y, 0.45);
      const sx = s * (W - 1.6);
      beam(b, VC.metal, sx, y, z - 1.5, sx, 0.1, z - 12.5, 1.5, col, 0.35);
      for (const o of [-0.75, 0.75])
        beam(
          b,
          VC.metal,
          sx + o,
          y + 0.9,
          z - 1.5,
          sx + o,
          1.0,
          z - 12.5,
          0.06,
          col,
        );
    }
    b.add(G.plane, K.roadMat, 0, y, z + 1.53, 9.6, 1.2, 1);
    b.box(VC.glow, hdr("#fff4dc", 0.8), 0, y - 0.32, z, 2 * W - 1, 0.06, 1.2);
  };
  // brick railway viaduct (ガード下) with little bars in its arches and a Yamanote train on top
  K.viaduct = (b, z) => {
    const y1 = 8.8,
      dz = 6;
    b.box(VC.metal, "#3b4a3f", 0, 7.9, z, 23, 1.8, dz);
    for (let x = -10; x <= 10; x += 2)
      beam(
        b,
        VC.metal,
        x,
        7.05,
        z + dz / 2 + 0.03,
        x + 1,
        8.75,
        z + dz / 2 + 0.03,
        0.08,
        "#2e3a32",
      );
    b.box(VC.glow, hdr("#fff4dc", 1.4), 0, 6.95, z, 20, 0.08, 4);
    for (const s of [-1, 1]) {
      for (let k = 0; k < 11; k++) {
        const x0 = s * (11.5 + k * 5.4);
        b.block(VC.solid, "#7a3a2a", x0 + s * 0.7, 0, z, 1.4, y1, dz);
        b.box(
          VC.solid,
          "#6e3426",
          x0 + s * 3.4,
          6.4 + (y1 - 6.4) / 2,
          z,
          4.0,
          y1 - 6.4,
          dz,
        );
        b.box(
          VC.glow,
          hdr("#ffb35c", 0.85),
          x0 + s * 3.4,
          3.0,
          z - dz / 2 + 0.6,
          3.8,
          6.0,
          0.1,
        );
        b.add(
          planeUV(K.noren.rects[randi(0, 3)]),
          K.norenMat,
          x0 + s * 3.4,
          5.6,
          z + dz / 2 - 0.1,
          3.2,
          0.8,
          1,
        );
        K.chochin(b, x0 + s * 2.0, 5.0, z + dz / 2 + 0.25, 0.7);
      }
      b.box(VC.solid, "#2a2a2e", s * 41, y1 + 0.4, z, 60, 0.8, dz + 0.4);
    }
    b.box(VC.solid, "#2a2a2e", 0, y1 + 0.4, z, 23, 0.8, dz + 0.4);
    b.box(VC.metal, "#c9ced6", -10, y1 + 2.4, z, 60, 3, 2.8);
    b.box(VC.solid, "#7dc242", -10, y1 + 1.6, z + 1.41, 60, 0.3, 0.02);
    for (let x = -38; x < 18; x += 2.2)
      b.box(
        VC.glow,
        hdr("#eaf4ff", 1.5),
        x,
        y1 + 2.7,
        z + 1.41,
        1.5,
        0.9,
        0.02,
      );
    b.box(VC.solid, SNOW, -10, y1 + 3.93, z, 59, 0.06, 2.7);
  };
  // stone lantern (灯籠)
  K.toro = (b, x, z) => {
    b.cyl(VC.solid, "#8a877e", x, 0.2, z, 0.45, 0.4, "cyl6");
    b.cyl(VC.solid, "#8a877e", x, 1.0, z, 0.16, 1.3, "cyl6");
    b.block(VC.solid, "#8a877e", x, 1.65, z, 0.75, 0.6, 0.75);
    b.box(VC.glow, hdr("#ffcf8a", 2.2), x, 1.95, z, 0.5, 0.3, 0.78);
    b.add(G.cone4, VC.solid, x, 2.55, z, 1.2, 0.5, 1.2, 0, 0, 0, "#7a776e");
    b.add(G.cone4, VC.solid, x, 2.62, z, 1.0, 0.4, 1.0, 0, 0, 0, SNOW);
  };
  // small neighbourhood shrine with a torii, stone lanterns and a snow-capped hall
  K.shrine = (b, side, zc) => {
    const tx = side * 12.5;
    for (const dz of [-1.7, 1.7])
      b.cyl(VC.solid, VERMILION, tx, 2.3, zc + dz, 0.22, 4.6, "cyl8");
    b.box(VC.solid, VERMILION, tx, 3.6, zc, 0.3, 0.3, 4.2);
    b.box(VC.solid, VERMILION, tx, 4.45, zc, 0.45, 0.35, 5.0);
    b.box(VC.solid, "#151515", tx, 4.72, zc, 0.55, 0.22, 5.6);
    b.box(VC.solid, SNOW, tx, 4.86, zc, 0.5, 0.06, 5.5);
    b.box(VC.solid, VERMILION, tx, 4.0, zc, 0.12, 0.8, 0.5);
    b.box(VC.solid, "#8a8780", side * 18, 0.03, zc, 12, 0.06, 2.0);
    for (const dz of [-2.4, 2.4]) K.toro(b, side * 15.5, zc + dz);
    const hx = side * 24;
    b.block(VC.solid, "#6a5a4a", hx, 0, zc, 6, 1, 6.5);
    b.block(VC.solid, "#8a6a4a", hx, 1, zc, 5, 3, 5.5);
    b.box(
      VC.glow,
      hdr("#ffd9a0", 1.0),
      hx - side * 2.52,
      2.2,
      zc,
      0.04,
      1.8,
      3.2,
    );
    b.add(G.cone4, VC.solid, hx, 5.3, zc, 7.5, 2.6, 8.2, 0, 0, 0, "#3a3c40");
    b.add(G.cone4, VC.solid, hx, 5.6, zc, 6.6, 2.0, 7.2, 0, 0, 0, SNOW);
    b.box(VC.solid, "#e8dcc4", hx - side * 2.6, 3.4, zc, 0.14, 0.18, 4.2);
    for (let k = 0; k < 4; k++)
      b.box(
        VC.solid,
        "#ffffff",
        hx - side * 2.62,
        3.1,
        zc - 1.5 + k,
        0.03,
        0.4,
        0.14,
      );
    for (const dz of [-6, 6]) {
      b.sph(VC.solid, "#24402c", hx + side * 2, 4.5, zc + dz, 3.2, true);
      b.sph(VC.solid, SNOW, hx + side * 2, 6.4, zc + dz, 1.9, true);
    }
    if (K.sakura)
      for (const dz of [-4.4, 4.4]) K.sakura(b, side * 19.5, zc + dz, 0.85);
  };
  // stone Jizo with a red cap, bib and pinwheel
  K.jizo = (b, x, z) => {
    b.cyl(VC.solid, "#7d7a72", x, 0.18, z, 0.22, 0.36);
    b.add(G.sph, VC.solid, x, 0.62, z, 0.34, 0.6, 0.3, 0, 0, 0, "#9a968c");
    b.sph(VC.solid, "#a8a49a", x, 1.0, z, 0.15, true);
    b.add(G.sph, VC.solid, x, 1.1, z, 0.32, 0.18, 0.32, 0, 0, 0, RED);
    b.box(VC.solid, RED, x, 0.76, z + 0.13, 0.28, 0.22, 0.05);
    b.cyl(VC.solid, "#dddddd", x + 0.25, 0.75, z, 0.01, 0.9);
    b.cyl(
      VC.glow,
      hdr(pick(["#ff6a8a", "#ffd23d", "#7cf8ff", "#39ff88"]), 1.4),
      x + 0.25,
      1.22,
      z + 0.02,
      0.14,
      0.02,
      "cyl8",
      Math.PI / 2,
    );
  };
  return K;
}
