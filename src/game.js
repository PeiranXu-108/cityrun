// One run: player physics, collisions, coins, power-ups, chasers and scoring.
import {
  THREE,
  laneX,
  LANE_W,
  TRAIN_H,
  RAMP_LEN,
  JET_Y,
  clamp,
  damp,
  rand,
} from "./core.js";
import { audio } from "./audio.js";
import { POWERUPS } from "./props.js";

const GRAV = 46,
  JUMP_V = 14.8,
  SUPER_V = 19.6,
  ROLL_T = 0.62;
const PW = 0.36,
  PD = 0.34;
const ov = (a0, a1, b0, b1) => a0 < b1 && a1 > b0;

export class Run {
  constructor({
    world,
    rig,
    anim,
    guard,
    guardAnim,
    dog,
    gear,
    particles,
    trails,
    baseMult = 1,
  }) {
    Object.assign(this, {
      world,
      rig,
      anim,
      guard,
      guardAnim,
      dog,
      gear,
      particles,
      trails,
    });
    this.baseMult = baseMult;
    this.d = 0;
    this.lane = 1;
    this.prevLane = 1;
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.grounded = true;
    this.air = 0;
    this.rollT = 0;
    this.jumpBuf = 0;
    this.rollBuf = 0;
    this.speed = 0;
    this.t = 0;
    this.score = 0;
    this.coins = 0;
    this.streak = 0;
    this.lastCoin = 0;
    this.power = {
      magnet: 0,
      jetpack: 0,
      sneakers: 0,
      multiplier: 0,
      shield: 0,
    };
    this.invuln = 0;
    this.chase = 3.2;
    this.danger = false;
    this.guardDist = 3.5;
    this.guardX = 0;
    this.stumbleT = 0;
    this.flip = 0;
    this.dead = false;
    this.caught = false;
    this.revives = 0;
    this.stats = {
      jumps: 0,
      rolls: 0,
      powerups: 0,
      near: 0,
      roof: 0,
      jets: 0,
      dist: 0,
      coins: 0,
      stumbles: 0,
    };
    this.events = [];
    this.wasRoof = false;
  }
  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }
  get mult() {
    return this.baseMult * (this.power.multiplier > 0 ? 2 : 1);
  }
  get rolling() {
    return this.rollT > 0;
  }
  get flying() {
    return this.power.jetpack > 0;
  }

  // ---------- input ----------
  move(dir) {
    if (this.dead) return;
    const t = clamp(this.lane + dir, 0, 2);
    if (t === this.lane) {
      this.emit("bump");
      return;
    }
    this.prevLane = this.lane;
    this.lane = t;
    audio.swipe();
  }
  jump() {
    if (this.dead || this.flying) return;
    if (this.grounded || this.air < 0.11) this.doJump();
    else this.jumpBuf = 0.16;
  }
  doJump() {
    const sup = this.power.sneakers > 0;
    this.vy = sup ? SUPER_V : JUMP_V;
    this.grounded = false;
    this.air = 1;
    this.rollT = 0;
    this.jumpBuf = 0;
    if (sup) this.flip = 0.0001;
    this.stats.jumps++;
    audio.jump(sup);
    this.emit("jump");
  }
  roll() {
    if (this.dead || this.flying) return;
    if (!this.grounded) {
      this.vy = Math.min(this.vy, -26);
      this.rollBuf = 0.35;
      return;
    }
    this.startRoll();
  }
  startRoll() {
    if (this.rollT <= 0) {
      this.stats.rolls++;
      audio.roll();
      this.emit("roll");
    }
    this.rollT = ROLL_T;
    this.rollBuf = 0;
  }

  // ---------- power-ups ----------
  activate(type) {
    const p = POWERUPS[type];
    this.power[type] = p.dur;
    this.stats.powerups++;
    audio.powerup();
    if (type === "jetpack") {
      this.stats.jets++;
      this.rollT = 0;
      this.flip = 0;
      this.world.skyCoins(this.d + 18, this.d + this.speed * p.dur + 10);
      audio.jetStart();
      audio.jetLoop(true);
    }
    this.particles.emit(this.x, this.y + 1.2, -this.d, 40, {
      color: p.color,
      speed: 9,
      life: 0.7,
      size: 0.4,
      grav: 2,
    });
    this.emit("power", { kind: type });
  }

  // ---------- damage ----------
  stumble(o) {
    this.lane = this.prevLane;
    this.stats.stumbles++;
    audio.stumble();
    this.particles.emit(this.x, this.y + 1, -this.d, 18, {
      color: "#ffd27a",
      speed: 7,
      life: 0.4,
      size: 0.18,
      grav: 12,
    });
    this.emit("shake", { k: 0.5 });
    if (this.invuln > 0) return;
    if (this.danger && this.chase > 0) {
      this.die("caught");
      return;
    }
    this.danger = true;
    this.chase = 6.5;
    this.stumbleT = 0.45;
    this.emit("stumble");
  }
  crash(o) {
    if (this.power.shield > 0) {
      this.power.shield = 0;
      this.invuln = 1.6;
      audio.shatter();
      this.particles.emit(this.x, this.y + 1, -this.d, 60, {
        colors: ["#59d8ff", "#bff3ff", "#ffffff"],
        speed: 12,
        life: 0.8,
        size: 0.3,
        grav: 6,
      });
      if (o.type !== "train") {
        this.particles.emit(o.x, 1, -o.d0, 40, {
          colors: ["#ff6a00", "#ffffff", "#ffd27a"],
          speed: 10,
          life: 0.9,
          size: 0.35,
          grav: 14,
        });
        this.world.remove(o);
      }
      this.emit("shake", { k: 0.8 });
      this.emit("shield");
      return;
    }
    this.killer = {
      type: o.type,
      lane: o.lane,
      d0: o.d0,
      len: o.len,
      ramp: o.ramp,
      moving: o.moving,
      x: this.x,
      y: this.y,
      d: this.d,
      rolling: this.rolling,
    };
    this.die("crash");
  }
  die(cause) {
    if (this.dead) return;
    this.dead = true;
    this.cause = cause;
    this.deadT = 0;
    this.rollT = 0;
    this.flip = 0;
    audio.crash();
    audio.jetLoop(false);
    this.particles.emit(this.x, this.y + 1.2, -this.d, 50, {
      colors: ["#ffffff", "#ffd27a", "#ff6a3d"],
      speed: 10,
      life: 0.8,
      size: 0.35,
      grav: 10,
    });
    this.emit("shake", { k: 1.6 });
    this.emit("dead", { cause });
  }
  revive() {
    this.dead = false;
    this.caught = false;
    this.revives++;
    this.invuln = 3;
    this.chase = 0;
    this.danger = false;
    this.world.clearAround(this.d - 6, this.d + 70);
    this.y = Math.max(this.y, this.world.support(this.x, this.d, 99));
    this.vy = 0;
    this.grounded = this.y < 0.01 || this.y >= TRAIN_H - 0.01;
    this.lane = Math.round(this.x / LANE_W) + 1;
    this.prevLane = this.lane;
    audio.powerup();
    this.emit("revive");
  }

  // ---------- simulation ----------
  update(dt) {
    this.t += dt;
    for (const e of this.world.events) this.onWorld(e);
    this.world.events.length = 0;
    if (this.dead) {
      this.deadUpdate(dt);
      this.pose(dt);
      return;
    }
    const target = 15 + 23 * (1 - Math.exp(-this.d / 3500));
    this.speed = Math.min(target, this.speed + dt * 24);
    const steps = Math.max(1, Math.ceil((this.speed * dt) / 0.3));
    for (let i = 0; i < steps && !this.dead; i++) this.step(dt / steps);
    this.timers(dt);
    this.collect(dt);
    this.score += dt * this.speed * this.mult;
    this.stats.dist = this.d;
    this.pose(dt);
  }

  step(dt) {
    const px = this.x,
      py = this.y;
    this.d += this.speed * dt;
    const tx = laneX(this.lane);
    this.x = Math.abs(tx - this.x) < 0.01 ? tx : damp(this.x, tx, 20, dt);
    if (this.flying) {
      this.y = damp(this.y, JET_Y - 0.5, 3.5, dt);
      this.vy = 0;
      this.grounded = false;
      this.air = 1;
    } else {
      this.vy -= GRAV * dt;
      this.y += this.vy * dt;
      const sup = this.world.support(this.x, this.d, py);
      if (this.y <= sup) {
        if (!this.grounded && this.vy < -3) this.land(sup);
        this.y = sup;
        this.vy = 0;
        this.grounded = true;
        this.air = 0;
      } else if (this.grounded && this.y - sup > 0.05) {
        this.grounded = false;
      }
      if (!this.grounded) this.air += dt;
    }
    if (this.invuln > 0 || this.flying) return;
    const ph = this.rolling ? 0.9 : 1.75;
    for (const o of this.world.obstacles) {
      if (o.dead) continue;
      const [hw, y0, y1, d0, d1] = this.world.box(o);
      if (d1 < this.d - 2 || d0 > this.d + 2) {
        if (!(o.ramp && this.d > o.d0 - RAMP_LEN - 1 && this.d < o.d0))
          continue;
      }
      const ox = ov(this.x - PW, this.x + PW, o.x - hw, o.x + hw);
      const pox = ov(px - PW, px + PW, o.x - hw, o.x + hw);
      if (o.ramp && ox && !pox && this.d > o.d0 - RAMP_LEN && this.d < o.d0) {
        const h = (TRAIN_H * (this.d - (o.d0 - RAMP_LEN))) / RAMP_LEN;
        if (this.y < h - 1.0) {
          this.x = px;
          this.stumble(o);
          return;
        }
      }
      if (
        !ox ||
        !ov(this.y, this.y + ph, y0, y1) ||
        !ov(this.d - PD, this.d + PD, d0, d1)
      )
        continue;
      if (!pox) {
        this.x = px;
        this.stumble(o);
        return;
      }
      if (o.type === "low" && py >= y1 - 0.15) {
        this.y = y1;
        this.vy = 7;
        continue;
      }
      this.crash(o);
      return;
    }
  }

  land(sup) {
    audio.land();
    this.particles.emit(this.x, sup + 0.1, -this.d, 12, {
      color: "#d8d2ff",
      speed: 4,
      life: 0.4,
      size: 0.25,
      grav: 2,
      k: 0.8,
      upBias: 0.2,
      up: 1,
    });
    this.flip = 0;
    if (this.jumpBuf > 0) ((this.vy = 0), (this.doJumpLater = true));
    if (this.rollBuf > 0) this.startRoll();
    this.emit("land");
  }

  timers(dt) {
    if (this.doJumpLater) {
      this.doJumpLater = false;
      this.doJump();
    }
    if (this.grounded && this.jumpBuf > 0) this.doJump();
    this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    this.rollBuf = Math.max(0, this.rollBuf - dt);
    this.rollT = Math.max(0, this.rollT - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.stumbleT = Math.max(0, this.stumbleT - dt);
    if (this.flip > 0) this.flip = Math.min(1, this.flip + dt * 1.6);
    if (this.flip >= 1) this.flip = 0;
    this.chase = Math.max(0, this.chase - dt);
    if (this.chase <= 0) this.danger = false;
    for (const k in this.power) {
      if (this.power[k] <= 0) continue;
      this.power[k] = Math.max(0, this.power[k] - dt);
      if (this.power[k] === 0) {
        audio.powerdown();
        if (k === "jetpack") {
          audio.jetLoop(false);
          this.invuln = Math.max(this.invuln, 1.8);
          this.vy = 0;
        }
        this.emit("powerEnd", { kind: k });
      }
    }
    const onRoof = this.grounded && this.y >= TRAIN_H - 0.05;
    if (onRoof) this.stats.roof += this.speed * dt;
    if (onRoof && !this.wasRoof) this.emit("roof");
    this.wasRoof = onRoof;
  }

  collect(dt) {
    const mag = this.power.magnet > 0;
    const ph = this.rolling ? 0.9 : 1.75;
    for (const c of this.world.coins) {
      if (c.st) continue;
      const dd = c.d - this.d;
      if (dd > 22 || dd < -3) continue;
      if (mag && (c.mag || (dd < 16 && dd > -2))) {
        c.mag = true;
        const k = 1 - Math.exp(-dt * 12);
        c.x += (this.x - c.x) * k;
        c.y += (this.y + 1 - c.y) * k;
        c.d += (this.d - c.d) * k + this.speed * dt * 0.5;
      }
      if (
        Math.abs(c.x - this.x) < 0.95 &&
        Math.abs(c.d - this.d) < 0.95 &&
        c.y > this.y - 0.3 &&
        c.y < this.y + ph + 0.5
      ) {
        c.st = 1;
        c.t = 0;
        this.coins++;
        this.stats.coins++;
        this.score += 10 * this.mult;
        this.streak = this.t - this.lastCoin < 0.6 ? this.streak + 1 : 0;
        this.lastCoin = this.t;
        audio.coin(this.streak);
        this.particles.emit(c.x, c.y, -c.d, 5, {
          color: "#ffd34d",
          speed: 4,
          life: 0.35,
          size: 0.22,
          grav: 4,
        });
      }
    }
    for (const p of this.world.powerups) {
      if (p.taken) continue;
      if (
        Math.abs(p.x - this.x) < 1.1 &&
        Math.abs(p.d - this.d) < 1.2 &&
        Math.abs(p.y - (this.y + 0.9)) < 1.7
      ) {
        p.taken = true;
        this.activate(p.type);
      }
    }
  }

  onWorld(e) {
    if (this.dead) return;
    if (e.type === "landmark") this.emit("landmark", { lm: e.lm });
    if (e.type === "crossing" && this.t - (this.lastBell ?? -99) > 6) {
      audio.crossing();
      this.lastBell = this.t;
    }
    if (e.type === "horn") {
      if (e.o.d0 - this.d < 160) audio.horn();
    }
    if (e.type === "nearmiss" && !this.flying) {
      this.stats.near++;
      this.score += 50 * this.mult;
      audio.nearMiss();
      this.emit("near");
    }
  }

  deadUpdate(dt) {
    this.deadT += dt;
    if (this.cause === "crash") {
      this.d -= Math.max(0, 6 - this.deadT * 14) * dt;
      if (this.y > 0) {
        this.vy -= GRAV * dt;
        this.y = Math.max(
          this.world.support(this.x, this.d, this.y),
          this.y + this.vy * dt,
        );
      }
    }
    this.speed = damp(this.speed, 0, 6, dt);
  }

  // ---------- visuals ----------
  pose(dt) {
    const r = this.rig;
    r.root.position.set(this.x, this.y, -this.d);
    const mode = this.dead
      ? this.cause === "caught"
        ? "caught"
        : "dead"
      : this.flying
        ? "fly"
        : this.rolling
          ? "roll"
          : !this.grounded
            ? "jump"
            : this.stumbleT > 0
              ? "stumble"
              : "run";
    this.anim.update(dt, {
      mode,
      speed: this.speed,
      lean: (laneX(this.lane) - this.x) / LANE_W,
      flip: this.flip,
    });
    r.root.visible = !(
      this.invuln > 0 &&
      !this.dead &&
      Math.sin(this.t * 40) > 0.3
    );
    // chasers
    const want =
      this.dead && this.cause === "caught"
        ? 1.4
        : this.chase > 0
          ? this.danger
            ? 3.2
            : 5.2
          : 18;
    this.guardDist = damp(
      this.guardDist,
      want,
      this.chase > 0 || this.dead ? 3 : 0.8,
      dt,
    );
    this.guardX = damp(
      this.guardX,
      this.dead ? this.x : this.x + (this.x > 0.5 ? -1.15 : 1.15),
      5,
      dt,
    );
    const gd = this.d - this.guardDist;
    const show = this.guardDist < 14;
    this.guard.root.visible = this.dog.root.visible = show;
    if (show) {
      this.guard.root.position.set(
        this.guardX,
        this.dead ? 0 : Math.min(this.y, 0.2),
        -gd,
      );
      this.guardAnim.update(dt, {
        mode: this.dead && this.cause === "caught" ? "idle" : "run",
        speed: this.speed,
      });
      this.dog.root.position.set(
        this.guardX + (this.guardX > this.x ? 1.0 : -1.0),
        0,
        -(gd + 1.2),
      );
      this.dog.update(dt, this.speed);
    }
    // gear
    const g = this.gear;
    g.jet.visible = this.flying || (this.power.jetpack === 0 && false);
    if (this.flying) {
      g.jet.userData.flames.forEach(
        (f, i) =>
          (f.scale.y = (i % 2 ? 0.4 : 0.7) * (0.8 + Math.random() * 0.5)),
      );
      this.particles.emit(this.x, this.y + 0.4, -this.d + 0.6, 2, {
        colors: ["#ffae3b", "#ff6a2a"],
        speed: 2,
        life: 0.35,
        size: 0.35,
        grav: -2,
        up: -4,
        vz: 4,
      });
    }
    const sh = this.power.shield;
    g.shield.visible = sh > 0 && !(sh < 3 && Math.sin(this.t * 20) > 0);
    g.shield.position.set(this.x, this.y + (this.rolling ? 0.6 : 1.0), -this.d);
    g.shield.material.uniforms.time.value = this.t;
    g.magnet.visible = this.power.magnet > 0;
    g.magnet.position.set(this.x, this.y, -this.d);
    g.magnet.rotation.y = this.t * 5;
    if (this.power.sneakers > 0 && this.grounded && Math.random() < 0.5) {
      this.particles.emit(
        this.x + rand(-0.2, 0.2),
        this.y + 0.1,
        -this.d + 0.3,
        1,
        { color: "#39ff88", speed: 1, life: 0.4, size: 0.2, grav: -1, up: 1 },
      );
    }
    // trails from the soles
    const fl = r.L.foot.getWorldPosition(_v1),
      fr = r.R.foot.getWorldPosition(_v2);
    this.trails[0].update(fl.setY(fl.y - 0.05));
    this.trails[1].update(fr.setY(fr.y - 0.05));
  }
}
const _v1 = new THREE.Vector3(),
  _v2 = new THREE.Vector3();
