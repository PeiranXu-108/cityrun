// Endless world: recycles city chunks, generates fair obstacle rows, manages coins, power-ups and portals.
import {
  THREE,
  CHUNK_LEN,
  laneX,
  TRAIN_H,
  RAMP_LEN,
  JET_Y,
  rand,
  randi,
  pick,
  chance,
  clamp,
  lerp,
} from "./core.js";
import {
  buildTrain,
  trainLen,
  buildLowBarrier,
  buildHighBarrier,
  buildPowerup,
  buildPortal,
  blink,
  POWERUPS,
} from "./props.js";
import ny from "./themes/ny.js";
import pgh from "./themes/pgh.js";
import hz from "./themes/hz.js";
import tokyo from "./themes/tokyo.js";
import bj from "./themes/beijing.js";
import syd from "./themes/sydney.js";
import ldn from "./themes/london.js";
import lj from "./themes/lijiang.js";
import paris from "./themes/paris.js";
import hk from "./themes/hongkong.js";
import taipei from "./themes/taipei.js";
import ist from "./themes/istanbul.js";
import msk from "./themes/moscow.js";
import sf from "./themes/sf.js";
import la from "./themes/la.js";
import dubai from "./themes/dubai.js";

export const THEMES = { ny, pgh, hz, bj, tokyo, syd, ldn, lj, paris, hk, taipei, ist, msk, sf, la, dubai };
export const THEME_ORDER = ["ny", "pgh", "hz", "bj", "tokyo", "syd", "ldn", "lj", "paris", "hk", "taipei", "ist", "msk", "sf", "la", "dubai"];
export const TOUR_LEN = CHUNK_LEN * 15;
// The World Tour visits every city once in a random order, then shuffles again; never the same city twice in a row.
function tourOrder(prev) {
  const o = THEME_ORDER.slice();
  for (let i = o.length - 1; i > 0; i--) {
    const j = randi(0, i);
    [o[i], o[j]] = [o[j], o[i]];
  }
  if (o[0] === prev) {
    const j = randi(1, o.length - 1);
    [o[0], o[j]] = [o[j], o[0]];
  }
  return o;
}
export const MOVE_K = 0.55; // moving train speed relative to the player
export const TRIGGER = 115; // distance at which parked "moving" trains start rolling
const AHEAD = 330,
  BEHIND = 30,
  DECOR_VARIANTS = 9;
export const LANDMARK_EVERY = 4; // every 4th chunk is a hand-built landmark scene

const _m = new THREE.Matrix4(),
  _q = new THREE.Quaternion(),
  _p = new THREE.Vector3(),
  _s = new THREE.Vector3(),
  _up = new THREE.Vector3(0, 1, 0);

export class World {
  constructor(scene) {
    this.root = new THREE.Group();
    scene.add(this.root);
    this.assets = {};
    this.pools = new Map();
    this.chunks = [];
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.portals = [];
    this.events = [];
    this.gen = false;
    this.portalCache = {};
  }

  ensureTheme(id) {
    if (this.assets[id]) return this.assets[id];
    const a = THEMES[id].build();
    a.trackFree = [];
    // A theme can split its streets into stretches (Hangzhou: West Lake, the plane-tree avenue, the Qiantang): zoneAt(k)
    // names chunk k's stretch, decor(zone) builds one, and each stretch keeps its own pool, [built up front, most kept].
    // Without zoneAt there is one unnamed pool.
    const pools = a.zonePool || { "": [DECOR_VARIANTS, DECOR_VARIANTS + 3] };
    a.decorFree = {};
    a.decorCount = {};
    a.decorCap = {};
    for (const [zone, [n, cap]] of Object.entries(pools)) {
      a.decorFree[zone] = [];
      a.decorCount[zone] = n;
      a.decorCap[zone] = cap;
      for (let i = 0; i < n; i++) a.decorFree[zone].push(a.decor(zone));
    }
    for (const lm of a.landmarks || []) {
      lm.obj = lm.build();
      lm.inUse = false;
    }
    const cm = new THREE.InstancedMesh(a.coinGeo, a.coinMat, 600);
    cm.count = 0;
    cm.frustumCulled = false;
    cm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.root.add(cm);
    a.coinMesh = cm;
    this.assets[id] = a;
    return a;
  }

  themeAt(d) {
    if (!this.tour) return this.base;
    const i = Math.floor(Math.max(d, 0) / TOUR_LEN);
    while (this.order.length <= i)
      this.order.push(...tourOrder(this.order[this.order.length - 1]));
    return this.order[i];
  }

  // ---------- reset ----------
  reset({ theme, tour = false, startD = -170 }) {
    for (const c of this.chunks) this.freeChunk(c);
    for (const o of this.obstacles) this.release(o.key, o.obj);
    for (const p of this.powerups) this.release("pu" + p.type, p.obj);
    for (const p of this.portals) this.root.remove(p.obj);
    this.chunks = [];
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.portals = [];
    this.base = theme;
    this.tour = tour;
    this.order = tour ? tourOrder(null) : [theme]; // a fresh random tour every reset
    if (tour) THEME_ORDER.forEach((id) => this.ensureTheme(id));
    else this.ensureTheme(theme);
    this.chunkD = Math.floor(startD / CHUNK_LEN) * CHUNK_LEN;
    this.gen = false;
  }

  startRun() {
    this.gen = true;
    this.genD = 70;
    this.prevRowD = 40;
    this.safe = 1;
    this.prevSafe = 1;
    this.laneFree = [-1e9, -1e9, -1e9];
    this.lastPowerD = 0;
    this.rows = 0;
    for (let d = 14; d < 62; d += 2.6)
      this.addCoin(laneX(1), 1.0, d, this.base);
  }

  // ---------- pooling ----------
  take(key, make) {
    const p = this.pools.get(key);
    const obj = p && p.length ? p.pop() : make();
    obj.visible = true;
    this.root.add(obj);
    return obj;
  }
  release(key, obj) {
    this.root.remove(obj);
    if (!this.pools.has(key)) this.pools.set(key, []);
    this.pools.get(key).push(obj);
  }

  // ---------- chunks ----------
  spawnChunk(d0) {
    const theme = this.themeAt(d0 + 1),
      a = this.assets[theme];
    const k = Math.round(d0 / CHUNK_LEN);
    let decor,
      lm = null;
    if (
      k >= 0 &&
      k % LANDMARK_EVERY === 0 &&
      a.landmarks &&
      a.landmarks.length
    ) {
      lm = a.landmarks[(k / LANDMARK_EVERY) % a.landmarks.length];
      if (lm.inUse) lm = null;
      else {
        lm.inUse = true;
        decor = lm.obj;
      }
    }
    const zone = a.zoneAt ? a.zoneAt(k) : "",
      free = a.decorFree[zone];
    if (decor) {
      /* landmark scene */
    } else if (
      free.length &&
      (a.decorCount[zone] >= a.decorCap[zone] || chance(0.75))
    )
      decor = free.splice(randi(0, free.length - 1), 1)[0];
    else {
      decor = a.decor(zone);
      a.decorCount[zone]++;
    }
    const track = a.trackFree.pop() || a.track.clone();
    const g = new THREE.Group();
    g.add(track, decor);
    g.position.z = -d0;
    this.root.add(g);
    this.chunks.push({ d0, theme, g, decor, track, lm, zone, told: false });
    if (this.tour && d0 > 0 && d0 % TOUR_LEN === 0) {
      const t = THEMES[theme];
      const obj =
        this.portalCache[theme] || (this.portalCache[theme] = buildPortal(t));
      obj.position.set(0, 0, -d0);
      this.root.add(obj);
      this.portals.push({ d: d0, theme, obj, crossed: false });
    }
  }
  freeChunk(c) {
    const a = this.assets[c.theme];
    c.g.remove(c.decor);
    c.g.remove(c.track);
    if (c.lm) c.lm.inUse = false;
    else a.decorFree[c.zone].push(c.decor);
    a.trackFree.push(c.track);
    this.root.remove(c.g);
  }

  // ---------- spawning ----------
  addObstacle(
    type,
    lane,
    d0,
    theme,
    { cars = 1, ramp = false, moving = false } = {},
  ) {
    const a = this.assets[theme];
    let key, make, len;
    if (type === "train") {
      key = `${theme}t${cars}${ramp ? "r" : ""}${moving ? "m" : ""}`;
      make = () => buildTrain(a.trainStyle, cars, ramp, moving);
      len = trainLen(cars);
    } else if (type === "low") {
      key = theme + "low";
      make = () => buildLowBarrier(a.barrier);
      len = 0.4;
    } else {
      key = theme + "high";
      make = () => buildHighBarrier(a.barrier);
      len = 0.4;
    }
    const obj = this.take(key, make);
    obj.position.set(laneX(lane), 0, -d0);
    const o = {
      type,
      lane,
      x: laneX(lane),
      d0,
      len,
      obj,
      key,
      theme,
      ramp,
      moving,
      triggered: false,
      near: false,
      dead: false,
    };
    this.obstacles.push(o);
    return o;
  }
  addCoin(x, y, d, theme) {
    this.coins.push({ x, y, d, theme: theme || this.themeAt(d), st: 0, t: 0 });
  }
  addPowerup(type, x, y, d) {
    const obj = this.take("pu" + type, () => buildPowerup(type));
    obj.position.set(x, y, -d);
    this.powerups.push({ type, x, y, d, obj, taken: false });
  }
  skyCoins(fromD, toD) {
    let lane = randi(0, 2),
      next = fromD + rand(20, 40);
    for (let d = fromD; d < toD; d += 2.8) {
      if (d > next) {
        lane = clamp(lane + (chance(0.5) ? 1 : -1), 0, 2);
        next = d + rand(20, 40);
      }
      this.addCoin(laneX(lane), JET_Y + 0.4, d);
    }
  }

  nearPortal(d) {
    if (!this.tour) return false;
    const p = Math.round(d / TOUR_LEN) * TOUR_LEN;
    return p > 0 && d > p - 45 && d < p + 35;
  }

  pickPowerup() {
    const w = [
      ["magnet", 3],
      ["sneakers", 2],
      ["multiplier", 2],
      ["jetpack", 1.6],
      ["shield", 1.6],
    ];
    let r = Math.random() * w.reduce((s, x) => s + x[1], 0);
    for (const [k, v] of w) {
      r -= v;
      if (r <= 0) return k;
    }
    return "magnet";
  }

  // One row of content. A "safe" lane random-walks by at most one lane per row and never gets a train.
  genRow() {
    const d = this.genD,
      theme = this.themeAt(d);
    const diff = clamp(d / 6500, 0, 1);
    const gap = lerp(26, 15.5, diff) * rand(0.92, 1.12);
    this.rows++;
    if (this.nearPortal(d)) {
      for (let k = 0; k < 5; k++)
        this.addCoin(laneX(this.safe), 1, d + k * 2.6, theme);
      this.prevRowD = d;
      this.genD += gap;
      return;
    }
    this.prevSafe = this.safe;
    if (chance(0.42)) {
      const t = clamp(this.safe + (chance(0.5) ? 1 : -1), 0, 2);
      if (this.laneFree[t] <= this.prevRowD - 1) this.safe = t;
    }
    const shifted = this.safe !== this.prevSafe;
    // safe lane
    let safeType = "empty";
    if (!shifted && this.rows > 1) {
      const r = Math.random();
      if (r < 0.13 + 0.12 * diff) safeType = "low";
      else if (r < 0.24 + 0.24 * diff) safeType = "high";
    }
    if (safeType !== "empty") this.addObstacle(safeType, this.safe, d, theme);
    const sx = laneX(this.safe),
      px = laneX(this.prevSafe);
    let powered = false;
    if (
      safeType === "empty" &&
      d - this.lastPowerD > rand(300, 460) &&
      d > 150
    ) {
      this.addPowerup(this.pickPowerup(), sx, 1.3, d);
      this.lastPowerD = d;
      powered = true;
    } else if (chance(0.7)) {
      if (safeType === "low")
        for (let k = -3; k <= 3; k++)
          this.addCoin(
            sx,
            1.0 + 1.9 * (1 - Math.pow(k / 3.6, 2)),
            d + k * 1.5,
            theme,
          );
      else if (safeType === "high")
        for (let k = -2; k <= 2; k++)
          this.addCoin(sx, 0.55, d + k * 1.7, theme);
      else if (shifted)
        for (let k = 0; k < 6; k++) {
          const t = k / 5;
          this.addCoin(
            lerp(px, sx, t),
            1.0,
            lerp(this.prevRowD + 3, d, t),
            theme,
          );
        }
      else
        for (let k = 0; k < 5; k++)
          this.addCoin(sx, 1.0, d - 6 + k * 2.6, theme);
    }
    // other lanes
    for (let L = 0; L < 3; L++) {
      if (L === this.safe || this.laneFree[L] > d - 2) continue;
      if (shifted && L === this.prevSafe) continue;
      const r = Math.random();
      const pT = 0.3 + 0.3 * diff,
        pM = d > 450 ? 0.07 + 0.11 * diff : 0;
      if (r < pT) {
        const cars = randi(1, diff > 0.3 ? 3 : 2),
          len = trainLen(cars);
        const ramp = chance(0.45);
        this.addObstacle("train", L, d, theme, { cars, ramp });
        this.laneFree[L] = d + len + 4;
        if (ramp) {
          for (let k = 0; k < 3; k++)
            this.addCoin(
              laneX(L),
              1.0 + ((k + 1) * TRAIN_H) / 3.6,
              d - RAMP_LEN + 1.5 + k * 2.7,
              theme,
            );
          if (!powered && chance(0.22) && d - this.lastPowerD > 200) {
            this.addPowerup(
              this.pickPowerup(),
              laneX(L),
              TRAIN_H + 1.3,
              d + len * 0.5,
            );
            this.lastPowerD = d;
            powered = true;
          } else
            for (let z = d + 1.5; z < d + len - 1; z += 2.6)
              this.addCoin(laneX(L), TRAIN_H + 1.0, z, theme);
        }
      } else if (r < pT + pM) {
        const cars = randi(1, 3),
          len = trainLen(cars);
        const d0 = d + (TRIGGER * MOVE_K) / (1 + MOVE_K);
        this.addObstacle("train", L, d0, theme, { cars, moving: true });
        this.laneFree[L] = d0 + len + 4;
      } else if (r < pT + pM + 0.12) this.addObstacle("low", L, d, theme);
      else if (r < pT + pM + 0.22) this.addObstacle("high", L, d, theme);
      else if (chance(0.25))
        for (let k = 0; k < 4; k++)
          this.addCoin(laneX(L), 1.0, d - 4 + k * 2.6, theme);
    }
    this.prevRowD = d;
    this.genD += gap;
  }

  // ---------- queries ----------
  // highest walkable surface under (x, d) that the feet at footY can stand on
  support(x, d, footY) {
    let s = 0;
    for (const o of this.obstacles) {
      if (o.type !== "train" || o.dead || Math.abs(o.x - x) > 1.15) continue;
      if (d >= o.d0 && d <= o.d0 + o.len && footY >= TRAIN_H - 0.45)
        s = Math.max(s, TRAIN_H);
      else if (o.ramp && d >= o.d0 - RAMP_LEN && d < o.d0) {
        const h = (TRAIN_H * (d - (o.d0 - RAMP_LEN))) / RAMP_LEN;
        if (footY >= h - 1.0) s = Math.max(s, h);
      }
    }
    return s;
  }
  // solid box of an obstacle: [x half-width, y0, y1, d0, d1]
  box(o) {
    if (o.type === "train")
      return [1.15, 0, TRAIN_H - 0.45, o.d0, o.d0 + o.len]; // top 0.45 is a step-up zone (see support())
    if (o.type === "low") return [1.1, 0, 1.05, o.d0 - 0.2, o.d0 + 0.2];
    return [1.15, 1.42, 2.75, o.d0 - 0.2, o.d0 + 0.2];
  }
  clearAround(d0, d1) {
    this.obstacles = this.obstacles.filter((o) => {
      const far = o.moving ? o.d0 + o.len + 80 : o.d0 + o.len;
      const near = o.ramp ? o.d0 - RAMP_LEN : o.d0;
      if (far >= d0 && near <= d1) {
        this.release(o.key, o.obj);
        return false;
      }
      return true;
    });
  }
  remove(o) {
    o.dead = true;
    this.release(o.key, o.obj);
    this.obstacles.splice(this.obstacles.indexOf(o), 1);
  }

  // ---------- per frame ----------
  update(dt, t, pd, speed, playerLane) {
    while (this.chunkD < pd + AHEAD) {
      this.spawnChunk(this.chunkD);
      this.chunkD += CHUNK_LEN;
    }
    while (this.chunks.length && this.chunks[0].d0 + CHUNK_LEN < pd - BEHIND)
      this.freeChunk(this.chunks.shift());
    if (this.gen) while (this.genD < pd + AHEAD - 30) this.genRow();
    if (this.gen)
      for (const c of this.chunks)
        if (c.lm && !c.told && pd >= c.d0 + 3) {
          c.told = true;
          this.events.push({ type: "landmark", lm: c.lm, theme: c.theme });
        }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      if (o.moving) {
        if (!o.triggered && o.d0 - pd < TRIGGER) {
          o.triggered = true;
          this.events.push({ type: "horn", o, sound: THEMES[o.theme].horn }); // Hong Kong's trams ring their bells instead
        }
        if (o.triggered) {
          o.d0 -= speed * MOVE_K * dt;
          o.obj.position.z = -o.d0;
        }
        if (
          !o.near &&
          o.d0 + o.len < pd &&
          Math.abs(o.lane - playerLane) === 1
        ) {
          o.near = true;
          this.events.push({ type: "nearmiss", o });
        }
      }
      // cities with railroad crossings ring the bell as one comes up
      if (
        this.gen &&
        o.type === "high" &&
        !o.rang &&
        THEMES[o.theme].crossingBell &&
        o.d0 > pd &&
        o.d0 - pd < 38
      ) {
        o.rang = true;
        this.events.push({ type: "crossing" });
      }
      if (o.d0 + o.len < pd - 12) {
        this.release(o.key, o.obj);
        this.obstacles.splice(i, 1);
      }
    }
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      const u = p.obj.userData;
      u.spin.rotation.y = t * 2.4;
      u.ring.rotation.z = t * 1.5;
      p.obj.position.y = p.y + Math.sin(t * 3 + p.d) * 0.12;
      if (p.taken || p.d < pd - 6) {
        this.release("pu" + p.type, p.obj);
        this.powerups.splice(i, 1);
      }
    }
    for (let i = this.portals.length - 1; i >= 0; i--) {
      const p = this.portals[i];
      p.obj.userData.u.time.value = t;
      p.obj.userData.ring.rotation.z = t * 0.6;
      if (p.d < pd - 40) {
        this.root.remove(p.obj);
        this.portals.splice(i, 1);
      }
    }
    this.updateCoins(dt, t, pd);
    for (const id in this.assets)
      this.assets[id].update && this.assets[id].update(t);
    blink.update(t);
  }

  updateCoins(dt, t, pd) {
    const counts = {};
    for (const id in this.assets) counts[id] = 0;
    const spin = t * 3.2;
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      if (c.d < pd - 6 && c.st === 0) {
        this.coins[i] = this.coins[this.coins.length - 1];
        this.coins.pop();
        continue;
      }
      let sc = 1,
        y = c.y + Math.sin(t * 3 + c.d * 0.4) * 0.08,
        rot = spin;
      if (c.st === 1) {
        c.t += dt;
        if (c.t > 0.3) {
          this.coins[i] = this.coins[this.coins.length - 1];
          this.coins.pop();
          continue;
        }
        sc = 1 + c.t * 3 * (1 - c.t / 0.3);
        y = c.y + c.t * 6;
        rot = spin * 3;
        sc *= 1 - c.t / 0.3;
      }
      if (c.d > pd + 300) continue;
      const a = this.assets[c.theme];
      const n = counts[c.theme];
      if (n >= 600) continue;
      _q.setFromAxisAngle(_up, rot);
      _p.set(c.x, y, -c.d);
      _s.setScalar(sc);
      a.coinMesh.setMatrixAt(n, _m.compose(_p, _q, _s));
      counts[c.theme] = n + 1;
    }
    for (const id in this.assets) {
      const cm = this.assets[id].coinMesh;
      cm.count = counts[id];
      cm.instanceMatrix.needsUpdate = true;
    }
  }
}

export { POWERUPS };
