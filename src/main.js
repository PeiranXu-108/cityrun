// Bootstrap and state machine: loading → menu → run → (revive) → game over.
import {
  THREE,
  curveUniforms,
  windTime,
  laneX,
  damp,
  clamp,
  lerp,
  smooth,
  rand,
} from "./core.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  makeSky,
  makeStars,
  Particles,
  Ambient,
  SpeedLines,
  Trail,
  FXShader,
  pointScale,
} from "./fx.js";
import {
  CHARACTERS,
  buildCharacter,
  Animator,
  buildGuard,
  buildDog,
  buildJetpack,
  buildShield,
  buildMagnetAura,
} from "./characters.js";
import { World, THEMES, THEME_ORDER } from "./world.js";
import { GLYPHS } from "./themes/tokyo.js";
import { GLYPHS as BJ_GLYPHS } from "./themes/beijing.js";
import { POWERUPS } from "./props.js";
import { Run } from "./game.js";
import { audio } from "./audio.js";
import { ui } from "./ui.js";
import { save, Missions } from "./meta.js";

save.load();
const missions = new Missions();
const touch = matchMedia("(pointer: coarse)").matches;
let quality = save.data.quality || (touch ? "low" : "high");

// ---------- renderer & scene ----------
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 30, 250);
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 1500);
const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1);
const sun = new THREE.DirectionalLight(0xffffff, 1);
scene.add(hemi, sun, sun.target);
const sky = makeSky();
const stars = makeStars();
scene.add(sky.mesh, stars);
const envScene = new THREE.Scene();
envScene.add(
  new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), sky.mesh.material),
);
const pmrem = new THREE.PMREMGenerator(renderer);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 1, 0.6, 0.65);
composer.addPass(bloom);
const fxPass = new ShaderPass(FXShader);
composer.addPass(fxPass);
composer.addPass(new OutputPass());
const fxu = fxPass.uniforms;

let fovBase = 62,
  prScale = 1;
function resize() {
  const w = innerWidth,
    h = innerHeight;
  const pr =
    Math.min(devicePixelRatio, quality === "high" ? 2 : 1.25) * prScale;
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
  composer.setPixelRatio(pr);
  composer.setSize(w, h);
  camera.aspect = w / h;
  fovBase = camera.aspect < 1 ? 62 + (1 - camera.aspect) * 34 : 62;
  camera.fov = fovBase;
  camera.updateProjectionMatrix();
  pointScale.value = (h * pr) / (2 * Math.tan((camera.fov * Math.PI) / 360));
}
addEventListener("resize", resize);
resize();

// ---------- actors ----------
const world = new World(scene);
const guard = buildGuard(),
  guardAnim = new Animator(guard),
  dog = buildDog();
const gear = {
  jet: buildJetpack(),
  shield: buildShield(),
  magnet: buildMagnetAura(),
};
const particles = new Particles(1200);
const trails = [new Trail(), new Trail()];
const speedLines = new SpeedLines();
scene.add(
  guard.root,
  dog.root,
  gear.shield,
  gear.magnet,
  particles.points,
  speedLines.obj,
  ...trails.map((t) => t.mesh),
);
guard.root.visible =
  dog.root.visible =
  gear.shield.visible =
  gear.magnet.visible =
    false;
let rig = null,
  anim = null,
  charIndex = Math.max(
    0,
    CHARACTERS.findIndex((c) => c.id === save.data.char),
  );

function setCharacter(i) {
  charIndex = (i + CHARACTERS.length) % CHARACTERS.length;
  const def = CHARACTERS[charIndex];
  if (rig) scene.remove(rig.root);
  rig = buildCharacter(def);
  anim = new Animator(rig);
  scene.add(rig.root);
  rig.torso.add(gear.jet);
  gear.jet.visible = false;
  trails.forEach((t) => {
    t.setColor(def.trail);
    t.ready = false;
  });
}

// ---------- environment per city ----------
const envCache = {},
  weatherCache = {};
let envId = null,
  weather = [],
  skylineObj = null;
function applyEnv(id) {
  const t = THEMES[id];
  envId = id;
  sky.apply(t.sky);
  stars.visible = !!t.sky.stars;
  scene.fog.color.set(t.fog.color);
  scene.fog.near = t.fog.near;
  scene.fog.far = t.fog.far;
  hemi.color.set(t.light.hemiSky);
  hemi.groundColor.set(t.light.hemiGround);
  hemi.intensity = t.light.hemi;
  sun.color.set(t.light.dir);
  sun.intensity = t.light.dirK;
  sun.position.set(...t.light.dirPos).multiplyScalar(50);
  renderer.toneMappingExposure = t.exposure;
  bloom.strength = t.bloom.strength;
  bloom.radius = t.bloom.radius;
  bloom.threshold = t.bloom.threshold;
  if (!envCache[id]) envCache[id] = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envCache[id];
  weather.forEach((w) => scene.remove(w.obj));
  weather =
    weatherCache[id] ||
    (weatherCache[id] = t.weather.map((w) => new Ambient(w)));
  weather.forEach((w) => scene.add(w.obj));
  if (skylineObj) scene.remove(skylineObj);
  skylineObj = world.ensureTheme(id).skyline;
  scene.add(skylineObj);
  audio.play(t.music);
  ui.setAccent(t);
}

// compile shaders and fill pools for a city so the first obstacles don't hitch
function warmup(id) {
  world.ensureTheme(id);
  const keep = world.obstacles.length;
  world.addObstacle("train", 0, 30, id, { cars: 1, ramp: true });
  world.addObstacle("train", 1, 40, id, { cars: 2, moving: true });
  world.addObstacle("train", 2, 40, id, { cars: 3 });
  world.addObstacle("low", 1, 20, id);
  world.addObstacle("high", 2, 22, id);
  Object.keys(POWERUPS).forEach((k, i) =>
    world.addPowerup(k, 0, 1, 10 + i * 2),
  );
  world.addCoin(0, 1, 5, id);
  world.updateCoins(0, 0, 0);
  renderer.compile(scene, camera);
  world.obstacles.splice(keep).forEach((o) => world.release(o.key, o.obj));
  world.powerups.splice(0).forEach((p) => world.release("pu" + p.type, p.obj));
  world.coins.length = 0;
}

// ---------- state ----------
let state = "loading",
  run = null,
  T = 0,
  last = performance.now();
let city = THEMES[save.data.city] ? save.data.city : "ny",
  tour = !!save.data.tour;
let shake = 0,
  flash = 0,
  aberr = 0,
  timeScale = 1,
  deadT = 0,
  introT = 0,
  reviveT = 0,
  missionT = 0;
let fpsAcc = 0,
  fpsN = 0,
  slowWindows = 0;
const camLook = new THREE.Vector3(),
  camFrom = new THREE.Vector3(),
  lookFrom = new THREE.Vector3();
const MENU_A = 0.72;

const wallet = () => save.data.coins + (run ? run.coins : 0);
const reviveCost = () => 60 * Math.pow(2, run.revives);
const baseTheme = () => (tour ? world.themeAt(0) : city); // the tour's first city is drawn at random on every reset

function refreshMenu() {
  const cards = THEME_ORDER.map((id) => {
    const t = THEMES[id];
    return {
      id,
      name: t.name,
      en: t.en,
      tag: t.tagline,
      color: t.accent,
      best: save.data.bestBy[id] || 0,
      grad: `linear-gradient(160deg, ${t.sky.top}, ${t.sky.mid} 55%, ${t.sky.bot})`,
    };
  });
  const n = THEME_ORDER.length;
  cards.push({
    id: "tour",
    name: "环游",
    en: "WORLD TOUR",
    tag: "随机顺序 · 九城轮番登场",
    color: "#b26bff",
    best: save.data.bestBy.tour || 0,
    grad: `linear-gradient(120deg, ${THEME_ORDER.map((id, i) => `${THEMES[id].sky.mid} ${Math.round((i / (n - 1)) * 100)}%`).join(", ")})`,
  });
  ui.cities(cards, tour ? "tour" : city, pickCity);
  ui.cityHead(THEMES[baseTheme()], tour);
  ui.stats(
    tour ? save.data.bestBy.tour || 0 : save.data.bestBy[city] || 0,
    missions.baseMult,
    save.data.coins,
  );
  const def = CHARACTERS[charIndex];
  const owned = save.data.unlocked.includes(def.id);
  ui.char(def, charIndex, CHARACTERS.length, owned, save.data.coins, () =>
    buyChar(def),
  );
  ui.missions(
    missions.list.map((m) => missions.info(m)),
    save.data.completed,
  );
  ui.setToggles(save.data.sound, save.data.music, quality);
}

function buyChar(def) {
  if (save.data.coins < def.price) return;
  save.data.coins -= def.price;
  save.data.unlocked.push(def.id);
  save.data.char = def.id;
  save.write();
  audio.chime();
  refreshMenu();
}

const frameWait = () => new Promise((r) => requestAnimationFrame(() => r()));

async function loadCity(ids, msg) {
  const todo = ids.filter((id) => !world.assets[id]);
  if (!todo.length) return;
  ui.show("loading");
  for (let i = 0; i < todo.length; i++) {
    ui.loading(
      0.3 + 0.6 * (i / todo.length),
      msg || `正在搭建${THEMES[todo[i]].name}…`,
    );
    await frameWait();
    await frameWait();
    world.ensureTheme(todo[i]);
    warmup(todo[i]);
  }
  ui.loading(1);
}

async function pickCity(id) {
  audio.click();
  const nextTour = id === "tour";
  const nextCity = nextTour ? city : id;
  if (nextTour === tour && nextCity === city) return;
  tour = nextTour;
  city = nextCity;
  save.data.city = city;
  save.data.tour = tour;
  save.write();
  await loadCity(
    tour ? THEME_ORDER : [city],
    tour ? "正在准备所有城市…" : null,
  );
  resetWorld();
  enterMenu();
}

function resetWorld() {
  world.reset({ theme: city, tour, startD: -170 });
  applyEnv(baseTheme());
  particles.clear();
}

function enterMenu() {
  state = "menu";
  run = null;
  ui.show("menu");
  refreshMenu();
  audio.muffle(true);
  audio.jetLoop(false);
  rig.root.position.set(0, 0, 0);
  rig.root.visible = true;
  guard.root.visible =
    dog.root.visible =
    gear.shield.visible =
    gear.magnet.visible =
    gear.jet.visible =
      false;
  timeScale = 1;
}

function startRun(fromMenu = true) {
  const def = CHARACTERS[charIndex];
  if (!save.data.unlocked.includes(def.id)) return;
  save.data.char = def.id;
  save.write();
  audio.init();
  audio.click();
  audio.muffle(false);
  if (!fromMenu) resetWorld();
  world.startRun();
  run = new Run({
    world,
    rig,
    anim,
    guard,
    guardAnim,
    dog,
    gear,
    particles,
    trails,
    baseMult: missions.baseMult,
  });
  trails.forEach((t) => (t.ready = false));
  ui.resetHud();
  ui.show("hud");
  ui.banner(THEMES[baseTheme()]);
  const jt = THEMES[baseTheme()].jingle;
  if (jt) setTimeout(() => audio[jt](), 350);
  ui.hint(
    touch
      ? "左右滑动换道 · 上滑跳跃 · 下滑滑铲"
      : "← → 换道 · ↑ 跳跃 · ↓ 滑铲 · P 暂停",
    4200,
  );
  state = "intro";
  introT = fromMenu ? 0 : 1;
  camFrom.copy(camera.position);
  lookFrom.copy(camLook);
  timeScale = 1;
  deadT = 0;
  missionT = 0;
}

function pause() {
  if (state !== "play" && state !== "intro") return;
  state = "paused";
  ui.show("hud", "pause");
  audio.muffle(true);
  audio.jetLoop(false);
}
function resume() {
  if (state !== "paused") return;
  state = "play";
  ui.show("hud");
  audio.muffle(false);
  if (run.flying) audio.jetLoop(true);
}

function gameOver() {
  state = "over";
  const r = run,
    score = Math.floor(r.score),
    id = tour ? "tour" : city;
  const record = score > (save.data.bestBy[id] || 0);
  save.data.bestBy[id] = Math.max(save.data.bestBy[id] || 0, score);
  save.data.best = Math.max(save.data.best, score);
  save.data.coins += r.coins;
  save.data.runs++;
  missions
    .check(r.stats)
    .forEach((m) =>
      ui.toast("任务完成", `${m.text} · +${m.reward} 金币`, "#39ff88"),
    );
  missions.commitTotals(r.stats);
  save.write();
  ui.over({
    cause: r.cause,
    city: tour ? "WORLD TOUR" : THEMES[city].en,
    score,
    dist: Math.floor(r.d),
    coins: r.coins,
    best: save.data.bestBy[id],
    near: r.stats.near,
    record,
  });
  ui.show("hud", "over");
  audio.muffle(true);
  if (record) audio.chime();
}

function offerRevive() {
  const cost = reviveCost();
  if (run.revives >= 3) return gameOver();
  state = "revive";
  reviveT = 5;
  ui.revive(run.cause, cost, wallet() >= cost);
  ui.show("hud", "revive");
}
function doRevive() {
  const cost = reviveCost();
  if (state !== "revive" || wallet() < cost) return;
  const fromSave = Math.min(save.data.coins, cost);
  save.data.coins -= fromSave;
  run.coins -= cost - fromSave;
  save.write();
  run.revive();
  state = "play";
  timeScale = 1;
  deadT = 0;
  ui.show("hud");
  audio.muffle(false);
}

function setQuality(q, persist = true) {
  quality = q;
  if (persist) {
    save.data.quality = q;
    save.write();
  }
  prScale = 1;
  resize();
  ui.setToggles(save.data.sound, save.data.music, quality);
}

// ---------- events from the run ----------
function handleRunEvents() {
  for (const e of run.events) {
    switch (e.type) {
      case "shake":
        shake = Math.max(shake, e.k);
        break;
      case "stumble":
        ui.hit();
        ui.toast("小心！", "保安追上来了", "#ff3355");
        aberr = 0.012;
        break;
      case "power":
        ui.toast(POWERUPS[e.kind].name, "", POWERUPS[e.kind].color);
        aberr = 0.01;
        if (e.kind === "jetpack") flash = 0.25;
        break;
      case "near":
        ui.toast("擦身而过！", "+50", THEMES[envId].accent2);
        break;
      case "shield":
        ui.toast("护盾破碎", "", "#59d8ff");
        flash = 0.3;
        break;
      case "bump":
        shake = Math.max(shake, 0.2);
        break;
      case "landmark":
        ui.place(e.lm.name, e.lm.en);
        break;
      case "land":
        shake = Math.max(shake, 0.12);
        break;
      case "dead":
        state = "dead";
        deadT = 0;
        timeScale = 0.3;
        aberr = 0.025;
        flash = 0.35;
        ui.hit();
        break;
      default:
        break;
    }
  }
  run.events.length = 0;
}

// ---------- camera ----------
const _mc = new THREE.Vector3();
function menuCam(dt) {
  const portrait = camera.aspect < 1;
  const a = MENU_A + Math.sin(T * 0.18) * 0.08,
    R = portrait ? 6.4 : 6.2;
  camera.position.set(
    -Math.sin(a) * R,
    1.55 + Math.sin(T * 0.3) * 0.05,
    Math.cos(a) * R,
  );
  camLook.set(0, 1.05, 0);
  camera.lookAt(camLook);
  camera.rotateY(portrait ? 0.02 : 0.2);
  camera.rotateX(portrait ? -0.16 : 0.06);
  camera.getWorldDirection(_mc);
  camLook.copy(camera.position).addScaledVector(_mc, 8);
  rig.root.rotation.y = damp(rig.root.rotation.y, Math.PI - a, 4, dt);
  anim.update(dt, { mode: "idle", speed: 0 });
  rig.root.position.set(0, 0, 0);
}

const _tp = new THREE.Vector3(),
  _tl = new THREE.Vector3();
function followCam(dt) {
  const r = run;
  const ty = r.flying ? r.y + 3.6 : 4.5 + Math.max(0, r.y) * 0.62;
  _tp.set(r.x * 0.82, ty, -r.d + 7.6);
  _tl.set(r.x * 0.55, (r.flying ? r.y - 1 : r.y * 0.5) + 1.2, -r.d - 10);
  if (state === "intro") {
    introT = Math.min(1, introT + dt / 1.1);
    const k = smooth(introT);
    camera.position.lerpVectors(camFrom, _tp, k);
    camLook.lerpVectors(lookFrom, _tl, k);
    rig.root.rotation.y = lerp(rig.root.rotation.y, 0, k);
    if (introT >= 1) state = "play";
  } else {
    rig.root.rotation.y = damp(rig.root.rotation.y, 0, 10, dt);
    camera.position.x = damp(camera.position.x, _tp.x, 7, dt);
    camera.position.y = damp(camera.position.y, _tp.y, 5, dt);
    camera.position.z =
      state === "dead" ? damp(camera.position.z, _tp.z - 2, 2, dt) : _tp.z;
    camLook.x = damp(camLook.x, _tl.x, 8, dt);
    camLook.y = damp(camLook.y, _tl.y, 6, dt);
    camLook.z = _tl.z;
  }
  camera.lookAt(camLook);
  if (shake > 0.001) {
    camera.position.x += (Math.random() - 0.5) * shake * 0.5;
    camera.position.y += (Math.random() - 0.5) * shake * 0.5;
    shake *= Math.exp(-dt * 8);
  }
  camera.rotation.z += (r.x - laneX(r.lane)) * 0.025;
  const fov = fovBase + (r.speed - 15) * 0.42 + (r.flying ? 7 : 0);
  if (Math.abs(camera.fov - fov) > 0.05) {
    camera.fov = damp(camera.fov, fov, 3, dt);
    camera.updateProjectionMatrix();
  }
}

// ---------- main loop ----------
function tick(now) {
  requestAnimationFrame(tick);
  const raw = (now - last) / 1000,
    real = Math.min(0.05, raw);
  last = now;
  if (state === "loading") return;
  if (state === "paused") {
    render();
    return;
  }
  const dt = real * timeScale;
  T += dt;
  sky.u.time.value = T;
  stars.material.uniforms.time.value = T;
  windTime.value = T;

  if (state === "menu") {
    world.update(dt, T, 0, 0, 1);
    menuCam(dt);
    curveUniforms.uCurveX.value = damp(curveUniforms.uCurveX.value, 0, 2, dt);
  } else if (run) {
    world.update(dt, T, run.d, run.dead ? 0 : run.speed, run.lane);
    if (state !== "over" && state !== "revive") run.update(dt);
    else run.pose(dt);
    handleRunEvents();
    followCam(dt);
    curveUniforms.uCurveX.value = Math.sin(T * 0.08) * 0.00055;
    for (const p of world.portals) {
      if (!p.crossed && run.d >= p.d) {
        p.crossed = true;
        applyEnv(p.theme);
        flash = 1;
        aberr = 0.03;
        audio.portal();
        ui.banner(THEMES[p.theme]);
        if (THEMES[p.theme].jingle)
          setTimeout(() => audio[THEMES[p.theme].jingle](), 600);
      }
    }
    if (state === "play") {
      ui.hud(run);
      missionT += real;
      if (missionT > 1) {
        missionT = 0;
        missions.check(run.stats).forEach((m) => {
          ui.toast("任务完成", `${m.text} · +${m.reward} 金币`, "#39ff88");
          audio.chime();
        });
      }
      // adaptive quality: ignore hitches and hidden tabs, act only after two slow 5-second windows
      if (!document.hidden && raw < 0.25) {
        fpsAcc += raw;
        fpsN++;
      }
      if (fpsAcc > 5) {
        const fps = fpsN / fpsAcc;
        fpsAcc = 0;
        fpsN = 0;
        slowWindows = fps < 30 ? slowWindows + 1 : 0;
        if (slowWindows >= 2) {
          slowWindows = 0;
          if (quality === "high") {
            setQuality("low", false);
            ui.toast("已自动切换为流畅画质", "可在菜单里改回高画质", "#00e5ff");
          } else if (prScale > 0.7) {
            prScale = 0.7;
            resize();
          }
        }
      }
    }
    if (state === "dead") {
      deadT += real;
      timeScale = deadT > 0.7 ? 1 : 0.3;
      if (deadT > 1.3) offerRevive();
    }
    if (state === "revive") {
      reviveT -= real;
      ui.reviveTick(Math.max(0, reviveT / 5), Math.max(0, Math.ceil(reviveT)));
      if (reviveT <= 0) gameOver();
    }
  }

  const spd = run && !run.dead ? run.speed : state === "menu" ? 0 : 0;
  for (const w of weather) w.update(dt, T, spd, camera);
  speedLines.update(
    dt,
    spd,
    run && !run.dead ? (run.flying ? 0.85 : clamp((spd - 24) / 14, 0, 0.6)) : 0,
    camera,
  );
  particles.update(dt);
  sky.mesh.position.copy(camera.position);
  stars.position.copy(camera.position);
  if (skylineObj) {
    skylineObj.position.set(camera.position.x, 0, camera.position.z);
    // a following skyline keeps its centre (Tokyo: Mt. Fuji) on the far end of the curving track
    const D = skylineObj.userData.follow;
    skylineObj.rotation.y = D
      ? Math.atan(camera.position.x / D) -
        Math.atan(curveUniforms.uCurveX.value * D)
      : 0;
  }

  flash *= Math.exp(-real * 3.2);
  aberr *= Math.exp(-real * 4);
  fxu.uFlash.value = flash;
  fxu.uAberr.value = 0.0012 + aberr + (spd > 20 ? (spd - 20) * 0.00008 : 0);
  fxu.uBlur.value =
    run && run.flying && !run.dead ? 0.9 : clamp((spd - 27) / 11, 0, 1) * 0.45;
  render();
}

function render() {
  if (quality === "high") composer.render();
  else renderer.render(scene, camera);
}

// ---------- input ----------
const act = {
  left: () => run && run.move(-1),
  right: () => run && run.move(1),
  up: () => run && run.jump(),
  down: () => run && run.roll(),
};
const KEYMAP = {
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
  ArrowUp: "up",
  w: "up",
  W: "up",
  " ": "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
};
addEventListener("keydown", (e) => {
  audio.init();
  const k = KEYMAP[e.key];
  if (k && (state === "play" || state === "intro")) {
    e.preventDefault();
    if (!e.repeat) act[k]();
    return;
  }
  if (e.key === "p" || e.key === "P" || e.key === "Escape") {
    if (state === "play" || state === "intro") pause();
    else if (state === "paused") resume();
    else if (ui.isOpen("help")) {
      ui.show("menu");
    }
    return;
  }
  if (state === "menu" && e.key === "Enter") startRun();
  if (
    state === "menu" &&
    (e.key === "ArrowLeft" || e.key === "ArrowRight") &&
    document.activeElement === document.body
  ) {
    setCharacter(charIndex + (e.key === "ArrowLeft" ? -1 : 1));
    refreshMenu();
  }
  if (state === "revive" && e.key === "Enter") doRevive();
});

let sw = null;
addEventListener("pointerdown", (e) => {
  audio.init();
  if (e.target.closest("button")) return;
  sw = { x: e.clientX, y: e.clientY, done: false };
});
addEventListener("pointermove", (e) => {
  if (!sw || sw.done || (state !== "play" && state !== "intro")) return;
  const dx = e.clientX - sw.x,
    dy = e.clientY - sw.y;
  if (Math.hypot(dx, dy) < 26) return;
  sw.done = true;
  if (Math.abs(dx) > Math.abs(dy)) act[dx > 0 ? "right" : "left"]();
  else act[dy > 0 ? "down" : "up"]();
});
addEventListener("pointerup", () => {
  sw = null;
});
addEventListener("pointercancel", () => {
  sw = null;
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});

const $ = (id) => document.getElementById(id);
$("playBtn").addEventListener("click", () => startRun());
$("charPrev").addEventListener("click", () => {
  audio.click();
  setCharacter(charIndex - 1);
  refreshMenu();
});
$("charNext").addEventListener("click", () => {
  audio.click();
  setCharacter(charIndex + 1);
  refreshMenu();
});
$("pauseBtn").addEventListener("click", pause);
$("resumeBtn").addEventListener("click", resume);
$("restartBtn").addEventListener("click", () => {
  audio.jetLoop(false);
  startRun(false);
});
$("quitBtn").addEventListener("click", () => {
  audio.jetLoop(false);
  resetWorld();
  enterMenu();
});
$("againBtn").addEventListener("click", () => startRun(false));
$("menuBtn").addEventListener("click", () => {
  resetWorld();
  enterMenu();
});
$("reviveBtn").addEventListener("click", doRevive);
$("skipBtn").addEventListener("click", () => {
  if (state === "revive") gameOver();
});
$("btnSound").addEventListener("click", () => {
  save.data.sound = !save.data.sound;
  audio.setSfx(save.data.sound);
  save.write();
  audio.click();
  refreshMenu();
});
$("btnMusic").addEventListener("click", () => {
  save.data.music = !save.data.music;
  audio.init();
  audio.setMusic(save.data.music);
  save.write();
  refreshMenu();
});
$("btnQuality").addEventListener("click", () => {
  audio.click();
  setQuality(quality === "high" ? "low" : "high");
});
$("btnHelp").addEventListener("click", () => {
  audio.click();
  ui.help();
  ui.show("menu", "help");
});
$("helpClose").addEventListener("click", () => ui.show("menu"));

// ---------- boot ----------
async function boot() {
  ui.show("loading");
  ui.loading(0.05, "加载字体…");
  audio.setSfx(save.data.sound);
  audio.setMusic(save.data.music);
  try {
    const fonts = [
      "Russo One",
      "ZCOOL QingKe HuangYou",
      "Ma Shan Zheng",
      "Chakra Petch",
    ].map((f) => document.fonts.load(`40px "${f}"`, "城市酷跑西湖茶ABC"));
    fonts.push(document.fonts.load('40px "Dela Gothic One"', GLYPHS));
    for (const f of ["Ma Shan Zheng", "ZCOOL QingKe HuangYou"])
      fonts.push(document.fonts.load(`40px "${f}"`, BJ_GLYPHS));
    await Promise.race([
      Promise.all(fonts),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (e) {
    /* fallback fonts are fine */
  }
  setCharacter(charIndex);
  await loadCity(tour ? THEME_ORDER : [city]);
  resetWorld();
  enterMenu();
  requestAnimationFrame((t) => {
    last = t;
    tick(t);
  });
  // build the other cities in the background so switching is instant
  let delay = 1200;
  for (const id of THEME_ORDER) {
    if (world.assets[id]) continue;
    setTimeout(() => {
      if (state === "menu" && !world.assets[id]) {
        world.ensureTheme(id);
        warmup(id);
      }
    }, delay);
    delay += 1500;
  }
}
window.__cd = {
  get run() {
    return run;
  },
  get state() {
    return state;
  },
  world,
  camera,
  scene,
  renderer,
  startRun,
  applyEnv,
  pickCity,
  setCharacter: (i) => {
    setCharacter(i);
    refreshMenu();
  },
};
boot().catch((err) => {
  console.error(err);
  ui.loading(1, "加载失败：" + err.message);
});
