// DOM layer: menus, HUD, toasts and modal sheets.
import { POWERUPS } from "./props.js";

const $ = (id) => document.getElementById(id);
const S = (p) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
export const ICONS = {
  magnet: S('<path d="M6 3v8a6 6 0 0 0 12 0V3"/><path d="M6 7h3M15 7h3"/>'),
  jetpack: S(
    '<rect x="6" y="3" width="5" height="12" rx="2"/><rect x="13" y="3" width="5" height="12" rx="2"/><path d="M8.5 15l-1 5M15.5 15l1 5"/>',
  ),
  sneakers: S('<path d="M3 16l1-7 5 2 3-4 4 5 5 1v3H3z"/><path d="M3 19h18"/>'),
  multiplier: "<b>×2</b>",
  shield: S('<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>'),
};
const SCREENS = ["loading", "menu", "hud", "pause", "revive", "over", "help"];

export const ui = {
  show(...names) {
    for (const s of SCREENS) $(s).hidden = !names.includes(s);
  },
  isOpen(name) {
    return !$(name).hidden;
  },
  loading(p, msg) {
    $("loadBar").style.width = `${Math.round(p * 100)}%`;
    if (msg) $("loadMsg").textContent = msg;
  },
  setAccent(t) {
    const r = document.documentElement.style;
    r.setProperty("--accent", t.accent);
    r.setProperty("--accent2", t.accent2);
  },

  // carousel: `per` full cards with half a card peeking in on each side;
  // arrows or a drag move a whole page and wrap around the list
  cities(cards, selected, onPick) {
    const nav = $("cities");
    const c = (this._car ??= { start: 0 });
    Object.assign(c, { cards, selected, onPick });
    const n = cards.length;
    const per = Math.min(n, matchMedia("(max-width: 820px)").matches ? 2 : 3);
    c.per = per;
    nav.style.setProperty("--per", per);
    const sel = cards.findIndex((x) => x.id === selected);
    if (sel >= 0 && (sel - c.start + n) % n >= per) c.start = sel;
    this._drawCities();
    if (c.bound) return;
    c.bound = true;

    const track = () => nav.firstElementChild;
    const unit = () => nav.clientWidth / (c.per + 1);
    const go = (d) => {
      if (c.busy) return;
      c.busy = true;
      const t = track();
      t.classList.add("anim");
      t.style.setProperty("--off", -d * c.per);
      const done = () => {
        clearTimeout(c.timer);
        t.removeEventListener("transitionend", done);
        const m = c.cards.length;
        c.start = (((c.start + d * c.per) % m) + m) % m;
        c.busy = false;
        this._drawCities();
      };
      t.addEventListener("transitionend", done);
      c.timer = setTimeout(done, 600);
    };
    $("cityPrev").onclick = () => go(-1);
    $("cityNext").onclick = () => go(1);

    let drag = null;
    nav.addEventListener("pointerdown", (e) => {
      if (c.busy || e.button !== 0) return;
      drag = { x: e.clientX, id: e.pointerId, moved: false };
    });
    nav.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        nav.setPointerCapture(e.pointerId);
        nav.classList.add("drag");
        track().classList.remove("anim");
      }
      const lim = c.per + 0.5;
      const off = Math.max(-lim, Math.min(lim, dx / unit()));
      track().style.setProperty("--off", off);
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const moved = drag.moved;
      const dx = e.clientX - drag.x;
      drag = null;
      if (!moved) return;
      nav.classList.remove("drag");
      // ignore the click that follows a drag
      c.dragged = true;
      setTimeout(() => (c.dragged = false), 0);
      if (Math.abs(dx) > unit() * 0.3) go(dx < 0 ? 1 : -1);
      else {
        const t = track();
        t.classList.add("anim");
        t.style.setProperty("--off", 0);
      }
    };
    nav.addEventListener("pointerup", end);
    nav.addEventListener("pointercancel", end);
    matchMedia("(max-width: 820px)").addEventListener("change", () =>
      this.cities(c.cards, c.selected, c.onPick),
    );
  },
  _drawCities() {
    const c = this._car;
    const nav = $("cities");
    const n = c.cards.length;
    const t = document.createElement("div");
    t.className = "city-track";
    // one extra page on each side so a page move slides real cards in
    for (let i = -c.per - 1; i <= 2 * c.per; i++) {
      const k = (((c.start + i) % n) + n) % n;
      const d = c.cards[k];
      const b = document.createElement("button");
      const shown = i >= 0 && i < c.per;
      b.className = "city" + (d.id === c.selected ? " on" : "");
      if (shown) b.id = "city-" + d.id;
      else b.tabIndex = -1;
      b.style.setProperty("--grad", d.grad);
      b.style.setProperty("--c", d.color);
      b.innerHTML = `<span class="cn">${d.name}</span><span class="en">${d.en}</span><span class="tag">${d.tag}</span>${d.best ? `<span class="best">最高 ${d.best}</span>` : ""}`;
      b.addEventListener("click", () => {
        if (c.dragged) return;
        if (shown) c.onPick(d.id);
        else if (!c.busy) {
          // tapping a peeking card pages toward it
          $(i < 0 ? "cityPrev" : "cityNext").click();
        }
      });
      t.appendChild(b);
    }
    nav.replaceChildren(t);
  },
  cityHead(t, tour, cityCount) {
    $("cityEn").textContent = tour ? "WORLD TOUR" : t.en;
    $("cityCn").textContent = tour
      ? `环游模式 · ${cityCount} 城随机连跑`
      : `${t.name} · ${t.tagline}`;
  },
  stats(best, mult, coins) {
    $("bestScore").textContent = best.toLocaleString();
    $("baseMult").textContent = `×${mult}`;
    $("menuCoins").textContent = coins.toLocaleString();
  },
  char(def, i, n, owned, coins, onBuy) {
    $("charName").innerHTML = `${def.name}<small>${def.en}</small>`;
    $("charDesc").textContent = def.desc;
    $("charDots").innerHTML = Array.from(
      { length: n },
      (_, k) => `<i class="${k === i ? "on" : ""}"></i>`,
    ).join("");
    const buy = $("charBuy");
    buy.hidden = owned;
    if (!owned) {
      buy.disabled = coins < def.price;
      buy.innerHTML =
        coins < def.price
          ? `需要 <span class="coin-ico"></span> ${def.price}`
          : `解锁 <span class="coin-ico"></span> ${def.price}`;
      buy.onclick = onBuy;
    }
    $("playBtn").disabled = !owned;
    $("playBtn").textContent = owned ? "开始奔跑" : "先解锁这个角色";
  },
  missions(items, completed) {
    $("missionInfo").textContent = `已完成 ${completed}`;
    $("missionList").innerHTML = items
      .map(
        (m) =>
          `<div class="mission${m.done ? " done" : ""}"><span>${m.text}</span><span class="num">${m.value}/${m.goal}</span><div class="prog"><i style="width:${(m.value / m.goal) * 100}%"></i></div></div>`,
      )
      .join("");
  },
  setToggles(sound, music, quality) {
    $("btnSound").classList.toggle("off", !sound);
    $("btnMusic").classList.toggle("off", !music);
    $("qLabel").textContent = quality === "high" ? "高" : "低";
  },

  // ---------- HUD ----------
  _last: {},
  hud(run) {
    const L = this._last;
    const sc = Math.floor(run.score),
      co = run.coins,
      m = run.mult,
      di = Math.floor(run.d);
    if (L.sc !== sc) $("score").textContent = (L.sc = sc).toLocaleString();
    if (L.co !== co) $("coins").textContent = (L.co = co).toLocaleString();
    if (L.m !== m) {
      $("mult").textContent = `×${(L.m = m)}`;
      $("mult").classList.toggle("x2", run.power.multiplier > 0);
    }
    if (L.di !== di) $("dist").textContent = `${(L.di = di)} m`;
    this.powers(run.power);
    $("chaseWarn").classList.toggle(
      "on",
      run.danger && run.chase > 0 && !run.dead,
    );
  },
  resetHud() {
    this._last = {};
    $("powers").innerHTML = "";
    $("toasts").innerHTML = "";
    this._pw = {};
  },
  _pw: {},
  powers(p) {
    const box = $("powers");
    for (const k in POWERUPS) {
      let el = this._pw[k];
      if (p[k] > 0) {
        if (!el) {
          el = this._pw[k] = document.createElement("div");
          el.className = "pw";
          el.style.setProperty("--c", POWERUPS[k].color);
          el.innerHTML = ICONS[k];
          box.appendChild(el);
        }
        el.style.setProperty("--p", (p[k] / POWERUPS[k].dur).toFixed(3));
        el.classList.toggle("ending", p[k] < 2);
      } else if (el) {
        el.remove();
        delete this._pw[k];
      }
    }
  },
  toast(text, sub = "", color = null) {
    const box = $("toasts");
    const el = document.createElement("div");
    el.className = "toast";
    if (color) el.style.setProperty("--c", color);
    el.innerHTML = `${text}${sub ? `<small>${sub}</small>` : ""}`;
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.remove(), 1500);
  },
  banner(t) {
    const b = $("cityBanner");
    b.innerHTML = `<div class="en">${t.en}</div><div class="cn">${t.name}</div>`;
    b.classList.remove("go");
    void b.offsetWidth;
    b.classList.add("go");
  },
  place(name, en) {
    const p = $("place");
    p.innerHTML = `${S('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>')}<span><b>${name}</b><small>${en}</small></span>`;
    p.classList.remove("go");
    void p.offsetWidth;
    p.classList.add("go");
  },
  hint(text, ms = 3500) {
    const h = $("hint");
    h.textContent = text;
    h.classList.add("on");
    clearTimeout(this._ht);
    this._ht = setTimeout(() => h.classList.remove("on"), ms);
  },
  hit() {
    const v = $("hitVig");
    v.classList.add("on");
    clearTimeout(this._hv);
    this._hv = setTimeout(() => v.classList.remove("on"), 260);
  },

  // ---------- modals ----------
  revive(cause, cost, can) {
    $("reviveTitle").innerHTML =
      `${cause === "caught" ? "被保安抓住了！" : "撞车了！"}<small>CONTINUE?</small>`;
    const b = $("reviveBtn");
    b.disabled = !can;
    b.innerHTML = can
      ? `复活 · <span class="coin-ico"></span> ${cost}`
      : `金币不足（需要 ${cost}）`;
  },
  reviveTick(p, sec) {
    $("reviveRing").style.setProperty("--p", p.toFixed(3));
    $("reviveCount").textContent = sec;
  },
  over(d) {
    $("overTitle").innerHTML =
      `${d.cause === "caught" ? "被抓住了" : "游戏结束"}<small>${d.city}</small>`;
    $("oScore").textContent = d.score.toLocaleString();
    $("oDist").textContent = `${d.dist} m`;
    $("oCoins").textContent = d.coins.toLocaleString();
    $("oBest").textContent = d.best.toLocaleString();
    $("oNear").textContent = d.near;
    $("newRecord").hidden = !d.record;
  },
  help() {
    const rows = [
      [
        "#00e5ff",
        S('<path d="M15 6l-6 6 6 6"/>'),
        "<b>← → / A D / 左右滑</b>　切换轨道",
      ],
      [
        "#39ff88",
        S('<path d="M6 15l6-6 6 6"/>'),
        "<b>↑ / W / 空格 / 上滑</b>　跳过低栏",
      ],
      [
        "#ff3df0",
        S('<path d="M6 9l6 6 6-6"/>'),
        "<b>↓ / S / 下滑</b>　滑铲穿过高栏，空中按下可急降",
      ],
      ...Object.entries(POWERUPS).map(([k, p]) => [
        p.color,
        ICONS[k],
        `<b>${p.name}</b>　${
          {
            magnet: "自动吸附附近金币",
            jetpack: "飞上高空收集空中金币",
            sneakers: "超级弹跳，可直接跳上列车顶",
            multiplier: "得分翻倍",
            shield: "抵挡一次正面撞击",
          }[k]
        }`,
      ]),
    ];
    $("helpList").innerHTML = rows
      .map(
        ([c, ic, t]) =>
          `<li><span class="sw" style="--c:${c}">${ic}</span><span>${t}</span></li>`,
      )
      .join("");
  },
};
