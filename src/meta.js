// Persistent progress (best scores, coins, unlocks, settings) and the mission ladder.
import { pick } from './core.js';

const KEY = 'citydash.save.v1';
const DEFAULTS = () => ({
  coins: 0, best: 0, bestBy: {}, unlocked: ['jay'], char: 'jay', city: 'ny', tour: false,
  sound: true, music: true, quality: null, missions: null, completed: 0, runs: 0,
  totals: { jumps: 0, rolls: 0, powerups: 0, near: 0, roof: 0, jets: 0, coins: 0, dist: 0 },
});

export const save = {
  data: DEFAULTS(),
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        this.data = { ...DEFAULTS(), ...d, totals: { ...DEFAULTS().totals, ...(d.totals || {}) } };
      }
    } catch (e) { /* storage unavailable: play without persistence */ }
  },
  write() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ } },
};

const POOL = [
  { id: 'coins', text: '单局收集 {n} 枚金币', stat: 'coins', n: [60, 150, 260, 400], mode: 'run' },
  { id: 'dist', text: '单局奔跑 {n} 米', stat: 'dist', n: [500, 1200, 2200, 3500], mode: 'run' },
  { id: 'jumps', text: '累计跳跃 {n} 次', stat: 'jumps', n: [20, 60, 120], mode: 'total' },
  { id: 'rolls', text: '累计滑铲 {n} 次', stat: 'rolls', n: [15, 40, 90], mode: 'total' },
  { id: 'power', text: '累计拾取 {n} 个道具', stat: 'powerups', n: [3, 8, 16], mode: 'total' },
  { id: 'roof', text: '在列车顶上跑 {n} 米', stat: 'roof', n: [80, 250, 600], mode: 'total' },
  { id: 'near', text: '与迎面列车擦身而过 {n} 次', stat: 'near', n: [2, 6, 12], mode: 'total' },
  { id: 'jets', text: '使用喷气背包 {n} 次', stat: 'jets', n: [1, 3, 6], mode: 'total' },
];

export class Missions {
  constructor() {
    const d = save.data;
    if (!Array.isArray(d.missions) || d.missions.length !== 3 || d.missions.some((m) => !m || !POOL.find((p) => p.id === m.id))) {
      d.missions = [];
      for (let i = 0; i < 3; i++) d.missions.push(this.fresh());
    }
  }
  get list() { return save.data.missions; }
  get baseMult() { return Math.min(10, 1 + Math.floor(save.data.completed / 3)); }
  fresh() {
    const used = new Set((save.data.missions || []).filter(Boolean).map((m) => m.id));
    const def = pick(POOL.filter((p) => !used.has(p.id)));
    const tier = Math.min(def.n.length - 1, Math.floor(save.data.completed / 4));
    return { id: def.id, tier, base: save.data.totals[def.stat] || 0 };
  }
  info(m, run) {
    const def = POOL.find((p) => p.id === m.id);
    const goal = def.n[m.tier];
    const r = run ? run[def.stat] || 0 : 0;
    const v = def.mode === 'run' ? r : (save.data.totals[def.stat] || 0) + r - m.base;
    return { text: def.text.replace('{n}', goal), goal, value: Math.min(goal, Math.floor(v)), done: v >= goal, reward: 60 * (m.tier + 1) + 40 };
  }
  // returns completed missions (already rewarded and replaced)
  check(run) {
    const out = [];
    this.list.forEach((m, i) => {
      const inf = this.info(m, run);
      if (!inf.done) return;
      out.push(inf);
      save.data.coins += inf.reward;
      save.data.completed++;
      this.list[i] = null;
    });
    if (out.length) {
      for (let i = 0; i < 3; i++) if (!this.list[i]) {
        const f = this.fresh();
        // total-mode missions start counting from the current run too
        const def = POOL.find((p) => p.id === f.id);
        if (def.mode === 'total' && run) f.base += run[def.stat] || 0;
        this.list[i] = f;
      }
      save.write();
    }
    return out;
  }
  commitTotals(run) {
    for (const k in save.data.totals) save.data.totals[k] += Math.floor(run[k] || 0);
  }
}
