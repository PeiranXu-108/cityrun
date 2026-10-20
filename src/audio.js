// Procedural audio: a small step sequencer with one song per city, plus synthesized sound effects.
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

class Engine {
  constructor() {
    this.ctx = null;
    this.musicOn = true;
    this.sfxOn = true;
    this.song = null;
    this.step = 0;
    this.energy = 0.5;
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    comp.connect(ctx.destination);
    this.master = ctx.createGain(); this.master.gain.value = 0.85; this.master.connect(comp);
    this.musicFilter = ctx.createBiquadFilter(); this.musicFilter.type = 'lowpass'; this.musicFilter.frequency.value = 900;
    this.music = ctx.createGain(); this.music.gain.value = this.musicOn ? 0.5 : 0;
    this.music.connect(this.musicFilter); this.musicFilter.connect(this.master);
    this.sfx = ctx.createGain(); this.sfx.gain.value = this.sfxOn ? 0.75 : 0; this.sfx.connect(this.master);
    // echo send for melodic parts
    this.delay = ctx.createDelay(1); this.delay.delayTime.value = 0.28;
    const fb = ctx.createGain(); fb.gain.value = 0.32;
    const dl = ctx.createGain(); dl.gain.value = 0.35;
    this.delay.connect(fb); fb.connect(this.delay); this.delay.connect(dl); dl.connect(this.music);
    this.send = this.delay;
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.drive = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 3.5); }
    this.drive.curve = curve;
    this.drive.connect(this.music);
    this.timer = setInterval(() => this.tick(), 25);
  }

  get t() { return this.ctx ? this.ctx.currentTime : 0; }

  setMusic(on) {
    this.musicOn = on;
    if (this.music) this.music.gain.setTargetAtTime(on ? 0.5 : 0, this.t, 0.1);
  }
  setSfx(on) {
    this.sfxOn = on;
    if (this.sfx) this.sfx.gain.setTargetAtTime(on ? 0.75 : 0, this.t, 0.05);
  }
  muffle(on) {
    if (this.musicFilter) this.musicFilter.frequency.setTargetAtTime(on ? 850 : 16000, this.t, 0.25);
  }

  play(id) {
    const s = SONGS[id];
    if (!s || this.song === s) return;
    this.song = s;
    this.step = 0;
    if (this.ctx) this.next = this.t + 0.08;
  }

  tick() {
    const s = this.song;
    if (!s || !this.ctx || this.ctx.state !== 'running') return;
    if (!this.next || this.next < this.t - 0.2) this.next = this.t + 0.05;
    const sixteenth = 60 / s.bpm / 4;
    while (this.next < this.t + 0.12) {
      const st = this.step % 16, bar = Math.floor(this.step / 16);
      const sw = st % 2 === 1 ? sixteenth * (s.swing || 0) : 0;
      try { s.step(this, st, bar, this.next + sw, sixteenth); } catch (e) { /* keep sequencer alive */ }
      this.next += sixteenth;
      this.step++;
    }
  }

  // ---------- building blocks ----------
  env(g, t, a, peak, dec, sus = 0.0001) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + dec);
  }
  osc(type, f, t, dur, out) {
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    o.connect(out); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  gain(out, v = 1) { const g = this.ctx.createGain(); g.gain.value = v; g.connect(out); return g; }
  noiseSrc(t, dur, out) {
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    n.loop = true; n.connect(out); n.start(t, Math.random() * 0.5); n.stop(t + dur + 0.05);
    return n;
  }
  filt(type, f, q, out) {
    const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(out); return b;
  }

  // ---------- instruments (music bus) ----------
  kick(t, v = 1) {
    const g = this.gain(this.music); this.env(g, t, 0.003, v, 0.32);
    const o = this.osc('sine', 150, t, 0.4, g);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
  }
  snare(t, v = 0.5) {
    const g = this.gain(this.music); this.env(g, t, 0.002, v, 0.18);
    this.noiseSrc(t, 0.2, this.filt('highpass', 1400, 0.7, g));
    const g2 = this.gain(this.music); this.env(g2, t, 0.002, v * 0.6, 0.08);
    this.osc('triangle', 210, t, 0.1, g2);
  }
  clap(t, v = 0.45) {
    const f = this.filt('bandpass', 1300, 1.2, this.music);
    for (let i = 0; i < 3; i++) {
      const g = this.gain(f); const tt = t + i * 0.011;
      this.env(g, tt, 0.001, v, i === 2 ? 0.16 : 0.02);
      this.noiseSrc(tt, 0.2, g);
    }
  }
  hat(t, v = 0.18, open = false) {
    const g = this.gain(this.music); this.env(g, t, 0.001, v, open ? 0.22 : 0.035);
    this.noiseSrc(t, 0.3, this.filt('highpass', 7500, 0.8, g));
  }
  shaker(t, v = 0.07) {
    const g = this.gain(this.music); this.env(g, t, 0.01, v, 0.05);
    this.noiseSrc(t, 0.1, this.filt('bandpass', 6000, 1.5, g));
  }
  wood(t, v = 0.25, f = 900) {
    const g = this.gain(this.music); this.env(g, t, 0.001, v, 0.07);
    this.osc('sine', f, t, 0.1, g);
    const g2 = this.gain(this.music); this.env(g2, t, 0.001, v * 0.5, 0.03);
    this.osc('square', f * 2.3, t, 0.05, this.filt('bandpass', f * 2.3, 4, g2));
  }
  clank(t, v = 0.18) {
    const g = this.gain(this.music); this.env(g, t, 0.001, v, 0.25);
    const car = this.osc('square', 520, t, 0.3, this.filt('bandpass', 2400, 3, g));
    const mod = this.ctx.createOscillator(); mod.frequency.value = 1347;
    const mg = this.ctx.createGain(); mg.gain.value = 900; mod.connect(mg); mg.connect(car.frequency);
    mod.start(t); mod.stop(t + 0.35);
  }
  bass(t, m, dur, v = 0.35, type = 'sawtooth', cut = 700, dist = false) {
    const out = dist ? this.drive : this.music;
    const g = this.gain(out); this.env(g, t, 0.005, v, dur);
    const f = this.filt('lowpass', cut, 6, g);
    f.frequency.setValueAtTime(cut * 3, t); f.frequency.exponentialRampToValueAtTime(cut, t + 0.12);
    this.osc(type, mtof(m), t, dur, f);
    this.osc('sine', mtof(m - 12), t, dur, f);
  }
  pluck(t, m, dur = 0.7, v = 0.22) {
    const g = this.gain(this.music); this.env(g, t, 0.002, v, dur);
    g.connect(this.send);
    const f = this.filt('lowpass', 5000, 1, g);
    f.frequency.setValueAtTime(6000, t); f.frequency.exponentialRampToValueAtTime(900, t + dur * 0.8);
    const o = this.osc('triangle', mtof(m) * 1.02, t, dur, f);
    o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.05);
    const g2 = this.gain(f, 0.35); this.osc('sawtooth', mtof(m) * 2, t, dur * 0.4, g2);
  }
  lead(t, m, dur, v = 0.12, type = 'square', cut = 2600) {
    const g = this.gain(this.music); this.env(g, t, 0.01, v, dur);
    g.connect(this.send);
    const f = this.filt('lowpass', cut, 2, g);
    this.osc(type, mtof(m), t, dur, f);
    this.osc(type, mtof(m) * 1.006, t, dur, f);
  }
  flute(t, m, dur, v = 0.12) {
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.08);
    g.gain.setValueAtTime(v, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.send);
    const o = this.osc('sine', mtof(m), t, dur, g);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 5.5;
    const lg = this.ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(mtof(m) * 0.012, t + dur * 0.5);
    lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
    const gn = this.gain(this.music); this.env(gn, t, 0.03, v * 0.15, dur * 0.5);
    this.noiseSrc(t, dur, this.filt('bandpass', mtof(m) * 2, 6, gn));
  }
  stab(t, chord, v = 0.07, dur = 0.35, type = 'triangle') {
    const g = this.gain(this.music); this.env(g, t, 0.005, v, dur);
    const f = this.filt('lowpass', 2200, 1, g);
    chord.forEach((m) => { this.osc(type, mtof(m), t, dur, f); this.osc('sine', mtof(m + 12), t, dur * 0.6, f); });
  }
  pad(t, chord, dur, v = 0.045) {
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = this.filt('lowpass', 1100, 0.7, g);
    chord.forEach((m) => { this.osc('sawtooth', mtof(m), t, dur, f); this.osc('sawtooth', mtof(m) * 1.008, t, dur, f); });
  }

  // ---------- Japanese / modern instruments ----------
  taiko(t, v = 0.8, f = 80) {
    const g = this.gain(this.music); this.env(g, t, 0.004, v, 0.6);
    const o = this.osc('sine', f * 1.7, t, 0.65, g);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.09);
    const g2 = this.gain(this.music); this.env(g2, t, 0.001, v * 0.35, 0.12);
    this.noiseSrc(t, 0.15, this.filt('lowpass', 900, 0.7, g2));
  }
  sub(t, m, dur, v = 0.42) {        // 808-style sub bass with a short downward glide
    const g = this.gain(this.music); this.env(g, t, 0.004, v, dur);
    const o = this.osc('sine', mtof(m) * 1.5, t, dur, g);
    o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.06);
    const g2 = this.gain(this.drive, 0.25); this.env(g2, t, 0.004, v * 0.3, dur * 0.6);
    this.osc('triangle', mtof(m), t, dur, g2);
  }
  koto(t, m, dur = 0.9, v = 0.15, bend = 0) {
    const g = this.gain(this.music); this.env(g, t, 0.002, v, dur);
    g.connect(this.send);
    const f = this.filt('lowpass', 6000, 1, g);
    f.frequency.setValueAtTime(7000, t); f.frequency.exponentialRampToValueAtTime(1100, t + dur * 0.7);
    const o = this.osc('triangle', mtof(m), t, dur, f);
    const o2 = this.osc('square', mtof(m) * 2, t, dur * 0.35, this.gain(f, 0.12));
    if (bend) for (const x of [o, o2]) {      // oshide: press the string to bend the note up
      const base = x === o ? mtof(m) : mtof(m) * 2;
      x.frequency.setValueAtTime(base, t + 0.12);
      x.frequency.linearRampToValueAtTime(base * Math.pow(2, bend / 12), t + 0.32);
    }
  }
  shamisen(t, m, v = 0.1) {
    const g = this.gain(this.music); this.env(g, t, 0.001, v, 0.22);
    this.osc('sawtooth', mtof(m), t, 0.25, this.filt('bandpass', mtof(m) * 3, 1.2, g));
    const g2 = this.gain(this.music); this.env(g2, t, 0.001, v * 0.6, 0.03);
    this.noiseSrc(t, 0.05, this.filt('highpass', 3000, 1, g2));      // bachi click
  }
  pumpPad(t, chord, dur, v = 0.035) {   // short swelling chord on every beat, like a side-chained pad
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = this.filt('lowpass', 2400, 0.8, g);
    chord.forEach((m) => { for (const d of [1, 1.01, 0.99]) this.osc('sawtooth', mtof(m) * d, t, dur, f); });
  }

  // ---------- Australian instruments ----------
  didge(t, m, dur, v = 0.1, pulse = 2.2) {   // didgeridoo: a buzzing drone with a wandering mouth formant
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.08);
    g.gain.setValueAtTime(v, t + dur * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f1 = this.filt('bandpass', 520, 3.5, g), f2 = this.filt('bandpass', 1450, 5, this.gain(g, 0.35)), lp = this.filt('lowpass', 260, 0.7, this.gain(g, 0.9));
    const o = this.osc('sawtooth', mtof(m), t, dur, f1); o.connect(f2); o.connect(lp);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = pulse;
    const lg = this.ctx.createGain(); lg.gain.value = 260; lfo.connect(lg); lg.connect(f1.frequency); lfo.start(t); lfo.stop(t + dur);
  }
  clapsticks(t, v = 0.22, out = this.music) {   // two hardwood sticks struck together
    const g = this.gain(out); this.env(g, t, 0.001, v, 0.05);
    const o = this.osc('sine', 2600, t, 0.07, g); o.frequency.exponentialRampToValueAtTime(2100, t + 0.04);
    this.osc('sine', 3900, t, 0.04, this.gain(g, 0.4));
    const g2 = this.gain(out); this.env(g2, t, 0.001, v * 0.7, 0.02);
    this.noiseSrc(t, 0.03, this.filt('bandpass', 5200, 3, g2));
  }

  // ---------- a British Christmas: church bells, celesta, sleigh bells, organ, brass band, choir ----------
  bell(t, m, dur = 2.5, v = 0.06, out = this.music) {   // church bell: hum, prime, tierce, quint, nominal... each fading at its own rate
    const f = mtof(m);
    for (const [k, a, d] of [[0.5, 0.5, 1], [1, 1, 0.8], [1.2, 0.45, 0.55], [1.5, 0.3, 0.45], [2, 0.5, 0.4], [2.52, 0.22, 0.3], [3, 0.16, 0.22], [4.07, 0.08, 0.15]]) {
      const g = this.gain(out); this.env(g, t, 0.003, v * a, dur * d);
      this.osc('sine', f * k, t, dur * d, g);
    }
    const gs = this.gain(out); this.env(gs, t, 0.001, v * 0.35, 0.04);   // the clapper's strike
    this.noiseSrc(t, 0.05, this.filt('bandpass', f * 3, 2, gs));
  }
  celesta(t, m, dur = 0.8, v = 0.07) {   // music-box sparkle: a sine with a bright overtone that fades at once
    const g = this.gain(this.music); this.env(g, t, 0.002, v, dur); g.connect(this.send);
    this.osc('sine', mtof(m), t, dur, g);
    this.osc('triangle', mtof(m) * 2, t, dur * 0.5, this.gain(g, 0.25));
    const g2 = this.gain(this.music); this.env(g2, t, 0.001, v * 0.4, dur * 0.2);
    this.osc('sine', mtof(m) * 4, t, dur * 0.25, g2);
  }
  sleigh(t, v = 0.04) {   // a shake of sleigh bells: jingling metal over a hiss
    const g = this.gain(this.music); this.env(g, t, 0.004, v, 0.15);
    this.noiseSrc(t, 0.2, this.filt('bandpass', 7200, 2.5, g));
    const g2 = this.gain(this.music); this.env(g2, t, 0.002, v * 0.5, 0.12);
    for (const f of [4600, 5900, 7300]) this.osc('square', f * (0.98 + Math.random() * 0.04), t, 0.14, this.filt('bandpass', f, 12, g2));
  }
  organ(t, chord, dur, v = 0.03) {   // a garage organ stab: drawbars at 8', 4' and 2 2/3'
    const g = this.gain(this.music); this.env(g, t, 0.004, v, dur);
    const f = this.filt('lowpass', 3200, 0.7, g);
    chord.forEach((m) => { const fr = mtof(m); this.osc('sine', fr, t, dur, f); this.osc('sine', fr * 2, t, dur, this.gain(f, 0.6)); this.osc('sine', fr * 3, t, dur, this.gain(f, 0.3)); });
  }
  brass(t, m, dur, v = 0.05) {   // brass-band cornet: buzzy saws, the filter flaring open on the attack, a little vibrato
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.04);
    g.gain.setValueAtTime(v * 0.85, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.send);
    const f = this.filt('lowpass', 900, 1.4, g);
    f.frequency.setValueAtTime(700, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.06); f.frequency.exponentialRampToValueAtTime(1700, t + Math.max(0.12, dur * 0.6));
    const o1 = this.osc('sawtooth', mtof(m), t, dur, f), o2 = this.osc('sawtooth', mtof(m) * 1.004, t, dur, f);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 5;
    const lg = this.ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(mtof(m) * 0.008, t + Math.min(0.4, dur * 0.7));
    lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency); lfo.start(t); lfo.stop(t + dur);
  }
  choir(t, chord, dur, v = 0.02) {   // "aah" voices: detuned saws through two vowel formants, swelling slowly
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.35);
    g.gain.setValueAtTime(v, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.send);
    const f1 = this.filt('bandpass', 750, 4, g), f2 = this.filt('bandpass', 1150, 5, this.gain(g, 0.6));
    chord.forEach((m) => { for (const d of [0.996, 1.004]) this.osc('sawtooth', mtof(m) * d, t, dur, f1).connect(f2); });
  }

  // ---------- Lijiang: hulusi, jaw harp, hand drums, steel-string guitar, caravan bells, wind chimes ----------
  hulusi(t, m, dur, v = 0.06) {   // 葫芦丝: a reedy, nasal gourd flute that slides up into each note, with a slow vibrato
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.05);
    g.gain.setValueAtTime(v * 0.9, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.send);
    const bp = this.filt('bandpass', mtof(m) * 2, 1.3, g), lp = this.filt('lowpass', 2400, 0.7, this.gain(g, 0.7));
    const o = this.ctx.createOscillator(); o.type = 'square';
    o.frequency.setValueAtTime(mtof(m - 2), t); o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.07);
    o.connect(bp); o.connect(lp); o.start(t); o.stop(t + dur + 0.05);
    this.osc('triangle', mtof(m), t, dur, this.gain(g, 0.9));
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 5.4;
    const lg = this.ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(mtof(m) * 0.012, t + Math.min(0.5, dur * 0.7));
    lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
  }
  drone(t, m, dur, v = 0.016) {   // the hulusi's drone pipe holding the tonic
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.3);
    g.gain.setValueAtTime(v, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    this.osc('square', mtof(m), t, dur, this.filt('lowpass', 900, 0.7, g));
  }
  jawHarp(t, m = 45, dur = 0.32, v = 0.07) {   // 口弦: a twanging metal tongue, the mouth sweeping its overtones
    const g = this.gain(this.music); this.env(g, t, 0.002, v, dur);
    const f = this.filt('bandpass', 700, 7, g);
    f.frequency.setValueAtTime(480, t); f.frequency.exponentialRampToValueAtTime(1900, t + dur * 0.45); f.frequency.exponentialRampToValueAtTime(650, t + dur);
    this.osc('sawtooth', mtof(m), t, dur, f);
    this.osc('square', mtof(m), t, dur * 0.4, this.filt('lowpass', 380, 1, this.gain(g, 0.45)));
  }
  djembe(t, kind = 'tone', v = 0.3) {   // hand drum: the bass in the middle of the skin, the open tone at its edge, the slap
    const g = this.gain(this.music);
    if (kind === 'bass') { this.env(g, t, 0.003, v, 0.3); const o = this.osc('sine', 125, t, 0.32, g); o.frequency.exponentialRampToValueAtTime(62, t + 0.12); return; }
    if (kind === 'tone') {
      this.env(g, t, 0.002, v * 0.7, 0.17); const o = this.osc('sine', 340, t, 0.2, g); o.frequency.exponentialRampToValueAtTime(265, t + 0.08);
      const g2 = this.gain(this.music); this.env(g2, t, 0.001, v * 0.22, 0.04); this.noiseSrc(t, 0.05, this.filt('bandpass', 1300, 1.5, g2));
      return;
    }
    this.env(g, t, 0.001, v * 0.6, 0.07); this.noiseSrc(t, 0.09, this.filt('bandpass', 2700, 1.2, g));
    const g2 = this.gain(this.music); this.env(g2, t, 0.001, v * 0.4, 0.05); this.osc('triangle', 480, t, 0.06, g2);
  }
  guitar(t, m, dur = 1.1, v = 0.055) {   // a steel-string note: a bright pick attack mellowing at once
    const g = this.gain(this.music); this.env(g, t, 0.002, v, dur); g.connect(this.send);
    const f = this.filt('lowpass', 4000, 1.2, g); f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(900, t + dur * 0.5);
    this.osc('sawtooth', mtof(m), t, dur, this.gain(f, 0.45));
    this.osc('triangle', mtof(m) * 1.002, t, dur, f);
    this.osc('sine', mtof(m) * 2, t, dur * 0.3, this.gain(f, 0.2));
  }
  strum(t, chord, down = true, v = 0.04, dur = 0.9) { (down ? chord : [...chord].reverse()).forEach((m, i) => this.guitar(t + i * 0.013, m, dur, v)); }
  horseBells(t, v = 0.045, out = this.music) {   // 马铃: the caravan's bells, two or three jangling together
    for (let k = 0; k < 3; k++) {
      const tt = t + k * 0.025 * Math.random(), g = this.gain(out); this.env(g, tt, 0.001, v, 0.32);
      for (const f of [2300, 3420, 4870]) this.osc('sine', f * (0.97 + Math.random() * 0.06), tt, 0.36, this.gain(g, 0.45));
    }
  }
  windChime(t, m, v = 0.05, out = this.sfx) {   // 风铃: a small bronze bell with a long, shimmering tail
    const f = mtof(m);
    for (const [k, a, d] of [[1, 1, 1.6], [2.76, 0.45, 0.9], [5.4, 0.25, 0.5], [8.9, 0.1, 0.3]]) {
      const g = this.gain(out); this.env(g, t, 0.002, v * a, d);
      this.osc('sine', f * k, t, d, g);
    }
  }

  // ---------- jazz instruments for New York ----------
  rhodes(t, chord, dur, v = 0.05) {   // electric piano: soft tine attack with a slow tremolo
    const g = this.gain(this.music); this.env(g, t, 0.004, v, dur);
    g.connect(this.send);
    const trem = this.ctx.createOscillator(); trem.frequency.value = 4.6;
    const tg = this.ctx.createGain(); tg.gain.value = v * 0.25; trem.connect(tg); tg.connect(g.gain); trem.start(t); trem.stop(t + dur);
    const f = this.filt('lowpass', 2600, 0.8, g);
    chord.forEach((m) => {
      this.osc('sine', mtof(m), t, dur, f);
      this.osc('sine', mtof(m) * 2, t, dur * 0.25, this.gain(f, 0.18));
    });
  }
  upright(t, m, dur, v = 0.3) {   // plucked upright bass: a finger thump and a round, short body
    const g = this.gain(this.music); this.env(g, t, 0.006, v, dur);
    const f = this.filt('lowpass', 900, 1.2, g);
    f.frequency.setValueAtTime(1500, t); f.frequency.exponentialRampToValueAtTime(420, t + 0.15);
    const o = this.osc('triangle', mtof(m) * 1.01, t, dur, f); o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.04);
    this.osc('sine', mtof(m), t, dur, this.gain(f, 0.8));
    const gk = this.gain(this.music); this.env(gk, t, 0.001, v * 0.35, 0.03);
    this.noiseSrc(t, 0.04, this.filt('bandpass', 700, 2, gk));
  }
  sax(t, m, dur, v = 0.06) {   // breathy tenor sax: sawtooth through a formant, a scoop into the note, vibrato
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.05);
    g.gain.setValueAtTime(v * 0.85, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.send);
    const f1 = this.filt('bandpass', 1100, 1.6, g), f2 = this.filt('lowpass', 2400, 0.7, this.gain(g, 0.35));
    const o = this.ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(mtof(m - 1), t); o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.07);
    o.connect(f1); o.connect(f2); o.start(t); o.stop(t + dur + 0.05);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 5.2;
    const lg = this.ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(mtof(m) * 0.01, t + Math.min(0.4, dur * 0.7));
    lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
    const gn = this.gain(this.music); this.env(gn, t, 0.03, v * 0.25, dur * 0.6);
    this.noiseSrc(t, dur, this.filt('bandpass', mtof(m) * 2.5, 3, gn));
  }
  crackle(t, dur, v = 0.05) {   // vinyl crackle: a few random clicks
    for (let i = 0; i < 6; i++) {
      const tt = t + Math.random() * dur, g = this.gain(this.music); this.env(g, tt, 0.0005, v * Math.random() + 0.002, 0.004);
      this.noiseSrc(tt, 0.01, this.filt('highpass', 2500, 0.7, g));
    }
  }

  // ---------- Peking opera percussion (京剧锣鼓) and Chinese instruments ----------
  bangu(t, v = 0.3, out = this.music) {        // 板鼓 "da": a dry, very high crack
    const g = this.gain(out); this.env(g, t, 0.001, v, 0.06);
    const o = this.osc('sine', 2100, t, 0.08, g); o.frequency.exponentialRampToValueAtTime(1400, t + 0.05);
    const g2 = this.gain(out); this.env(g2, t, 0.001, v * 0.9, 0.025);
    this.noiseSrc(t, 0.05, this.filt('bandpass', 4200, 2.2, g2));
  }
  daluo(t, v = 0.28, out = this.music) {       // 大锣 "kuang": big gong whose pitch sags after the hit
    const g = this.gain(out); this.env(g, t, 0.004, v, 1.5);
    const f = this.filt('lowpass', 2800, 0.7, g);
    [1, 1.47, 2.09, 2.76, 3.41].forEach((k, i) => {
      const o = this.osc(i % 2 ? 'triangle' : 'sine', 160 * k, t, 1.6, this.gain(f, 1 / (1 + i * 0.7)));
      o.frequency.setValueAtTime(160 * k * 1.07, t); o.frequency.exponentialRampToValueAtTime(160 * k * 0.9, t + 0.55);
    });
    const g2 = this.gain(out); this.env(g2, t, 0.002, v * 0.45, 0.45);
    this.noiseSrc(t, 0.5, this.filt('bandpass', 1400, 0.8, g2));
  }
  xiaoluo(t, v = 0.16, out = this.music) {     // 小锣 "tai": small gong that rises in pitch
    const g = this.gain(out); this.env(g, t, 0.002, v, 0.5);
    [1, 1.53, 2.31].forEach((k, i) => {
      const o = this.osc('sine', 840 * k, t, 0.55, this.gain(g, i ? 0.32 : 1));
      o.frequency.setValueAtTime(840 * k * 0.9, t); o.frequency.exponentialRampToValueAtTime(840 * k * 1.04, t + 0.14);
    });
  }
  nao(t, v = 0.14, dur = 0.35, out = this.music) {   // 铙钹 "qi / cai": clashing cymbals
    const g = this.gain(out); this.env(g, t, 0.001, v, dur);
    this.noiseSrc(t, dur + 0.1, this.filt('highpass', 4500, 0.6, g));
    const g2 = this.gain(out); this.env(g2, t, 0.001, v * 0.45, dur * 0.6);
    for (const f of [3150, 4470, 5320]) this.osc('square', f, t, dur, this.filt('bandpass', f, 9, g2));
  }
  cang(t, v = 1, out = this.music) { this.daluo(t, 0.26 * v, out); this.nao(t, 0.11 * v, 0.45, out); }   // 仓 = gong + cymbals
  jinghu(t, m, dur, v = 0.07, slide = 0) {     // 京胡: piercing, nasal bowed fiddle that slides into its notes
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.025);
    g.gain.setValueAtTime(v * 0.8, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.send);
    const bp = this.filt('bandpass', 2300, 1.1, g), lp = this.filt('lowpass', 3600, 0.7, this.gain(g, 0.4));
    const o = this.ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(mtof(m - slide), t);
    if (slide) o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.08);
    o.connect(bp); o.connect(lp); o.start(t); o.stop(t + dur + 0.05);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 6.4;
    const lg = this.ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(mtof(m) * 0.016, t + Math.min(0.25, dur * 0.6));
    lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
  }
  pipa(t, m, dur = 0.45, v = 0.11) {           // 琵琶: bright, quickly decaying pluck
    const g = this.gain(this.music); this.env(g, t, 0.001, v, dur);
    g.connect(this.send);
    const f = this.filt('lowpass', 5000, 1.4, g);
    f.frequency.setValueAtTime(6500, t); f.frequency.exponentialRampToValueAtTime(1300, t + dur * 0.6);
    this.osc('sawtooth', mtof(m), t, dur, this.gain(f, 0.45));
    this.osc('triangle', mtof(m), t, dur, f);
    this.osc('sine', mtof(m) * 3.01, t, dur * 0.25, this.gain(f, 0.25));
  }
  lunzhi(t, m, n, gap, v = 0.09) {             // 轮指: the pipa's rolling tremolo
    for (let i = 0; i < n; i++) this.pipa(t + i * gap, m, gap * 1.8, v * (i ? 0.72 : 1));
  }
  dizi(t, m, dur, v = 0.08) {                  // 笛子: flute with the buzzing membrane (笛膜)
    this.flute(t, m, dur, v);
    const gn = this.gain(this.music); this.env(gn, t, 0.04, v * 0.22, dur * 0.8);
    this.noiseSrc(t, dur, this.filt('bandpass', mtof(m) * 3, 9, gn));
  }

  // ---------- sound effects (sfx bus) ----------
  fx(fn) { if (this.ctx && this.sfxOn && this.ctx.state === 'running') try { fn(this.t); } catch (e) { /* ignore */ } }
  tone(t, type, f0, f1, dur, v, out = this.sfx) {
    const g = this.gain(out); this.env(g, t, 0.004, v, dur);
    const o = this.osc(type, f0, t, dur, g);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  }
  whoosh(t, f0, f1, dur, v, q = 1.2) {
    const g = this.gain(this.sfx); this.env(g, t, dur * 0.3, v, dur * 0.7);
    const f = this.filt('bandpass', f0, q, g);
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    this.noiseSrc(t, dur, f);
  }
  coin(n = 0) {
    this.fx((t) => {
      const k = Math.pow(2, (n % 12) / 24);
      this.tone(t, 'square', 988 * k, 988 * k, 0.05, 0.05);
      this.tone(t + 0.05, 'square', 1319 * k, 1319 * k, 0.12, 0.05);
      this.tone(t, 'sine', 1976 * k, 1976 * k, 0.15, 0.06);
    });
  }
  jump(big = false) { this.fx((t) => { this.tone(t, 'sine', big ? 220 : 320, big ? 900 : 640, 0.16, 0.14); this.whoosh(t, 600, 2400, 0.22, 0.12); }); }
  roll() { this.fx((t) => this.whoosh(t, 2200, 380, 0.3, 0.2, 0.9)); }
  swipe() { this.fx((t) => this.whoosh(t, 900, 2800, 0.12, 0.09, 1.5)); }
  land() { this.fx((t) => { this.tone(t, 'sine', 140, 50, 0.12, 0.25); this.whoosh(t, 500, 200, 0.1, 0.08); }); }
  stumble() {
    this.fx((t) => {
      this.tone(t, 'square', 180, 90, 0.18, 0.12);
      const g = this.gain(this.sfx); this.env(g, t, 0.001, 0.25, 0.3);
      this.noiseSrc(t, 0.3, this.filt('bandpass', 2600, 4, g));
    });
  }
  crash() {
    this.fx((t) => {
      this.tone(t, 'sine', 110, 28, 0.7, 0.6);
      this.tone(t, 'sawtooth', 70, 30, 0.4, 0.2);
      const g = this.gain(this.sfx); this.env(g, t, 0.001, 0.6, 0.6);
      this.noiseSrc(t, 0.7, this.filt('lowpass', 1800, 0.5, g));
    });
  }
  shatter() {
    this.fx((t) => {
      for (let i = 0; i < 6; i++) this.tone(t + i * 0.025, 'sine', 2400 + Math.random() * 3000, 1800, 0.12, 0.05);
      const g = this.gain(this.sfx); this.env(g, t, 0.001, 0.3, 0.35);
      this.noiseSrc(t, 0.4, this.filt('highpass', 3500, 0.7, g));
    });
  }
  powerup() {
    this.fx((t) => [523, 659, 784, 1047, 1319].forEach((f, i) => {
      this.tone(t + i * 0.055, 'triangle', f, f, 0.16, 0.12);
      this.tone(t + i * 0.055, 'sine', f * 2, f * 2, 0.1, 0.04);
    }));
  }
  powerdown() { this.fx((t) => [784, 659, 523].forEach((f, i) => this.tone(t + i * 0.07, 'triangle', f, f, 0.12, 0.08))); }
  nearMiss() { this.fx((t) => { this.whoosh(t, 300, 3000, 0.25, 0.18, 1.2); this.tone(t + 0.1, 'sine', 1568, 2093, 0.18, 0.08); }); }
  horn() {
    this.fx((t) => {
      const g = this.gain(this.sfx); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.05); g.gain.setValueAtTime(0.09, t + 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
      const f = this.filt('lowpass', 1600, 1, g);
      [311, 370, 466].forEach((fr) => this.osc('sawtooth', fr, t, 0.95, f));
    });
  }
  portal() {
    this.fx((t) => {
      this.whoosh(t, 200, 5000, 1.2, 0.35, 0.8);
      [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(t + 0.25 + i * 0.07, 'sine', f, f, 0.6, 0.07));
    });
  }
  click() { this.fx((t) => this.tone(t, 'square', 1200, 900, 0.04, 0.05)); }
  // short station departure melody (発車メロディ)
  station() {
    this.fx((t) => [84, 88, 91, 96, 95, 91, 88, 91, 96].forEach((m, i) => {
      this.tone(t + i * 0.15, 'sine', mtof(m), mtof(m), 0.5, 0.07);
      this.tone(t + i * 0.15, 'triangle', mtof(m + 12), mtof(m + 12), 0.22, 0.025);
    }));
  }
  // railroad crossing bell (カンカン)
  crossing() {
    this.fx((t) => {
      for (let i = 0; i < 6; i++) {
        const tt = t + i * 0.32;
        this.tone(tt, 'square', 760, 760, 0.16, 0.035);
        this.tone(tt, 'sine', 1520, 1480, 0.28, 0.035);
      }
    });
  }
  // the laughing kookaburra: low chuckles building to a cackle, then dying away
  kookaburra() {
    this.fx((t) => {
      const notes = [];
      let d = 0;
      for (let i = 0; i < 5; i++) { notes.push([d, 620 + i * 40, 0.09]); d += 0.12 - i * 0.008; }
      for (let i = 0; i < 9; i++) { notes.push([d, 1250 + (i % 2) * 380, 0.08]); d += 0.085; }
      for (let i = 0; i < 4; i++) { notes.push([d, 900 - i * 80, 0.1]); d += 0.13 + i * 0.02; }
      for (const [dd, f, dur] of notes) {
        const g = this.gain(this.sfx); this.env(g, t + dd, 0.004, 0.07, dur);
        const o = this.osc('sawtooth', f * 1.25, t + dd, dur, this.filt('bandpass', f * 1.6, 2.5, g));
        o.frequency.exponentialRampToValueAtTime(f * 0.8, t + dd + dur);
      }
    });
  }
  // Big Ben: the first two changes of the Westminster Quarters, then the hour bell
  bigben() {
    this.fx((t) => {
      const o = this.sfx;
      [[64, 68, 66, 59], [64, 66, 68, 64]].forEach((ch, i) => ch.forEach((m, k) => this.bell(t + i * 1.4 + k * 0.28, m, k === 3 ? 2.4 : 1.6, 0.06, o)));
      this.bell(t + 2.95, 52, 4.5, 0.11, o);
    });
  }
  // Lijiang: a breeze through the wind chimes hanging under the eaves, then the caravan's bells passing
  fengling() {
    this.fx((t) => {
      const o = this.sfx, notes = [81, 84, 86, 88, 91, 93, 88, 84, 86];
      notes.forEach((m, i) => this.windChime(t + i * 0.13 + Math.random() * 0.05, m, 0.055, o));
      this.horseBells(t + 1.35, 0.05, o); this.horseBells(t + 1.75, 0.04, o);
    });
  }
  // New York subway door chime: two soft descending tones
  subway() {
    this.fx((t) => [[76, 0], [72, 0.42]].forEach(([m, d]) => {
      this.tone(t + d, 'sine', mtof(m), mtof(m), 0.75, 0.09);
      this.tone(t + d, 'triangle', mtof(m + 12), mtof(m + 12), 0.3, 0.025);
    }));
  }
  // Peking opera "si ji tou" (四击头): da da · cang · cang · qi tai · CANG
  jingju() {
    this.fx((t) => {
      const o = this.sfx;
      this.bangu(t, 0.3, o); this.bangu(t + 0.12, 0.3, o);
      this.cang(t + 0.32, 0.9, o); this.cang(t + 0.6, 0.9, o);
      this.nao(t + 0.84, 0.12, 0.12, o); this.xiaoluo(t + 0.96, 0.16, o);
      this.cang(t + 1.2, 1.25, o);
    });
  }
  chime() { this.fx((t) => [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(t + i * 0.09, 'sine', f, f, 0.5, 0.08))); }
  beep(hi = false) { this.fx((t) => this.tone(t, 'square', hi ? 1320 : 880, hi ? 1320 : 880, 0.12, 0.07)); }
  jetStart() { this.fx((t) => { this.whoosh(t, 150, 1800, 0.8, 0.4, 0.7); this.tone(t, 'sawtooth', 60, 140, 0.6, 0.1); }); }
  jetLoop(on) {
    if (!this.ctx) return;
    if (on && !this.jet) {
      const g = this.gain(this.sfx, 0); g.gain.setTargetAtTime(0.12, this.t, 0.2);
      const f = this.filt('bandpass', 700, 0.8, g);
      const n = this.ctx.createBufferSource(); n.buffer = this.noise; n.loop = true; n.connect(f); n.start();
      this.jet = { g, n };
    } else if (!on && this.jet) {
      const { g, n } = this.jet; this.jet = null;
      g.gain.setTargetAtTime(0, this.t, 0.15); n.stop(this.t + 0.6);
    }
  }
}

// ---------- songs ----------
// New York: jazz-hop for a rainy night. Boom-bap drums with swing, an upright bass walking through Am7-Fmaj7-Dm7-E7,
// Rhodes chords on the off-beats, a tenor sax in A minor blues, vinyl crackle; 16-bar cycle (intro -> beat -> sax ->
// sax answer, the drums dropping out for the last half bar).
const NY_CH = [[57, 60, 64, 67], [53, 57, 60, 64], [50, 53, 57, 60], [52, 56, 59, 62]];
const NY_WALK = [[45, 43, 40, 42], [41, 45, 48, 39], [38, 41, 45, 39], [40, 44, 47, 44]];
const BLUES = [69, 72, 74, 75, 76, 79, 81];   // A C D Eb E G A
const SAX_A = [[0, 4, 3], [4, 5, 2], [6, 4, 2], [8, 3, 1], [9, 2, 3], [12, 1, 4], [18, 0, 2], [20, 1, 2], [22, 2, 6]];
const SAX_B = [[0, 6, 4], [6, 5, 2], [8, 4, 2], [10, 3, 2], [12, 2, 4], [16, 1, 2], [18, 2, 2], [20, 4, 8]];
const PGH_ROOT = [28, 24, 31, 26];
const PGH_RIFF = [[0, 0, 12, 0, 10, 0, 7, 5], [0, 0, 12, 0, 15, 12, 10, 7]];
const HZ_CH = [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]];
const HZ_ROOT = [38, 35, 31, 33];
// pentatonic melodies (D major pentatonic), null = rest
const HZ_MEL = [
  [74, null, 76, null, 78, null, 81, null, 78, null, 76, 74, 76, null, null, null],
  [81, null, 83, 81, 78, null, 76, null, 74, null, 71, null, 74, null, null, null],
  [69, null, 71, null, 74, null, 76, 78, 76, null, 74, null, 71, null, 69, null],
  [78, null, 81, null, 86, null, 83, 81, 78, null, 76, null, 78, null, null, null],
];

// Tokyo: a koto / shakuhachi melody in the Japanese Hirajoshi minor scale (D E F A Bb) over the J-pop
// "Komuro" minor progression (i - VI - VII - III: Dm Bb C F), with taiko, 808 sub, trap hats and pumping pads.
// 16-bar cycle: intro (taiko + koto), build (beat + shakuhachi), drop (koto arpeggios + shamisen), lead.
const TK_ROOT = [38, 34, 36, 41];
const TK_CH = [[62, 65, 69], [58, 62, 65], [60, 64, 67], [65, 69, 72]];
const HIRA = [62, 64, 65, 69, 70, 74, 76, 77, 81, 82];
const KOTO_A = [5, -1, 4, -1, 3, -1, 2, 3, 4, -1, 3, 2, 0, -1, -1, -1];
const KOTO_B = [7, -1, 8, 7, 5, -1, 4, -1, 5, -1, 3, -1, 4, -1, -1, -1];
const SHAKU = [[74, 8], [77, 6], [76, 4], [74, 8], [70, 6], [69, 8]];
const SHAMI_S = [0, 3, 6, 8, 11, 14], SHAMI_N = [50, 50, 57, 53, 52, 50];

// Beijing: Peking-opera percussion (板鼓 大锣 小锣 铙钹) and a jinghu melody in G major pentatonic over an Em-C-G-D
// hip-hop progression with a boom-bap kit and 808; pipa tremolos in the drop, a dizi lead, and a 四击头 fill
// closing each 16-bar cycle (opening gongs -> beat + jinghu -> drop -> dizi).
const BJ_ROOT = [40, 36, 43, 38];
const BJ_CH = [[64, 67, 71], [60, 64, 67], [62, 67, 71], [62, 66, 69]];
const GONG = [64, 67, 69, 71, 74, 76, 79, 81, 83, 86];   // E G A B D E G A B D
const JH = [
  [6, -1, 5, 6, 7, -1, 6, 5, 4, -1, 5, -1, 3, -1, -1, -1],
  [4, -1, 3, 4, 5, -1, 4, 3, 2, -1, 1, -1, 0, -1, -1, -1],
  [7, -1, 8, -1, 9, 8, 7, -1, 6, -1, 7, 6, 5, -1, -1, -1],
  [5, 6, 5, 4, 3, -1, 4, -1, 2, -1, 3, 2, 1, -1, 0, -1],
];
const DIZI = [79, 81, 83, 86, 83, 81, 79, 76];
const BJ_OPEN = { 0: 'cang', 3: 'da', 4: 'tai', 6: 'tai', 8: 'cang', 10: 'qi', 11: 'tai', 12: 'cang', 14: 'da', 15: 'da' };
const BJ_SJT = { 0: 'da', 2: 'da', 4: 'cang', 7: 'cang', 9: 'qi', 10: 'tai', 12: 'CANG' };
const BJ_FILL = { 8: 'da', 9: 'da', 10: 'cang', 12: 'cang', 13: 'qi', 14: 'tai' };
const BJ_HIT = {
  da: (e, t) => e.bangu(t, 0.26), cang: (e, t) => e.cang(t, 0.75), CANG: (e, t) => e.cang(t, 1.1),
  tai: (e, t) => e.xiaoluo(t, 0.12), qi: (e, t) => e.nao(t, 0.09, 0.12), cai: (e, t) => e.nao(t, 0.1, 0.32),
};

// Sydney: a didgeridoo drone and clapsticks under a summery tropical-house groove - soft four-on-the-floor, off-beat
// marimba plucks, pumping chords and a bright synth hook in A major pentatonic (Amaj7 - F#m7 - Dmaj7 - E6).
const SYD_ROOT = [33, 30, 26, 28];
const SYD_CH = [[57, 61, 64, 68], [54, 57, 61, 64], [50, 54, 57, 61], [52, 56, 59, 61]];
const SYD_PENT = [69, 71, 73, 76, 78, 81, 83, 85];
const SYD_A = [[0, 4, 2], [2, 3, 2], [4, 4, 3], [8, 5, 2], [10, 4, 2], [12, 3, 4], [16, 2, 2], [18, 3, 2], [20, 1, 4], [26, 0, 6]];
const SYD_B = [[0, 5, 2], [2, 6, 2], [4, 5, 2], [6, 4, 2], [8, 3, 4], [16, 4, 2], [18, 3, 2], [20, 2, 2], [22, 3, 2], [24, 4, 8]];
const STICKS = [0, 3, 6, 8, 10, 12, 14];

// London: a Christmas carol meets UK garage. The Westminster chime rung over a choir opens each cycle and the hour bell
// strikes as the beat drops: a shuffled 2-step kit with a rolling sub, organ stabs, sleigh bells and celesta, then a
// brass-band carol tune in G harmonic minor over Gm7 - Ebmaj7 - Cm7 - D7, taken up by the celesta and the choir.
const LDN_ROOT = [43, 39, 36, 38];
const LDN_CH = [[55, 58, 62, 65], [55, 58, 62, 63], [55, 58, 60, 63], [54, 57, 60, 62]];
const LDN_SC = [66, 67, 69, 70, 72, 74, 75, 78, 79, 81, 82, 84, 86];   // F# G A Bb C D Eb F# G A Bb C D
const LDN_A = [[0, 5, 4], [4, 5, 2], [6, 4, 2], [8, 3, 4], [12, 2, 2], [14, 1, 2], [16, 3, 4], [20, 6, 4], [24, 5, 8]];
const LDN_B = [[0, 6, 4], [4, 5, 2], [6, 4, 2], [8, 3, 2], [10, 4, 2], [12, 5, 4], [16, 2, 4], [20, 0, 4], [24, 2, 8]];
const WM = [[74, 72, 70, 65], [70, 74, 72, 65], [70, 72, 74, 70], [74, 70, 72, 65], [65, 72, 74, 70]];   // the five changes, in Bb

// Lijiang: Naxi folk under the eaves meets a folk-pop groove. Jaw harp, caravan bells and fingerpicked guitar open each
// cycle, then hand drums and a soft kick, guitar strums and a sub; a hulusi melody in A minor pentatonic over
// Am - F - C - G, the bamboo flute answering it, the bells coming back at the turn of the cycle.
const LJ_ROOT = [33, 29, 36, 31];
const LJ_CH = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 60, 64, 67], [55, 59, 62, 67]];
const LJ_PENT = [64, 67, 69, 72, 74, 76, 79, 81];   // E G A C D E G A
const LJ_A = [[0, 5, 6], [6, 4, 2], [8, 3, 4], [12, 2, 4], [16, 3, 3], [19, 4, 1], [20, 5, 4], [24, 4, 8]];
const LJ_B = [[0, 6, 4], [4, 5, 2], [6, 4, 2], [8, 5, 6], [14, 4, 2], [16, 3, 4], [20, 2, 4], [24, 1, 4], [28, 2, 4]];
const DJEMBE = { 0: 'bass', 3: 'tone', 4: 'slap', 6: 'tone', 7: 'tone', 10: 'bass', 12: 'slap', 14: 'tone', 15: 'slap' };

const SONGS = {
  lj: {
    bpm: 104, swing: 0.1,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, r = LJ_ROOT[c], ch = LJ_CH[c];
      const brk = B === 15 && s >= 8;
      // intro: jaw harp twangs on the tonic, the caravan's bells, fingerpicked chord tones, the drone
      if (sec === 0) {
        if (s % 4 === 0 || s === 6 || s === 14) e.jawHarp(t, 45, dt * (s % 4 ? 1.6 : 2.6), s % 4 ? 0.05 : 0.07);
        if (s === 4 || s === 12) e.horseBells(t, 0.04);
        if (s % 2 === 0) e.guitar(t, ch[[0, 2, 1, 3, 2, 1, 3, 2][s / 2]], 1.2, 0.045);
        if (s === 0) { e.drone(t, 57, dt * 16, 0.014); e.pad(t, ch, dt * 16, 0.02); }
      }
      // the groove: hand drums, a soft kick and clap, shaker, guitar strums, the sub
      if (sec >= 1 && !brk) {
        const hit = DJEMBE[s];
        if (hit) e.djembe(t, hit, hit === 'bass' ? 0.32 : 0.26);
        if (s === 0 || s === 8 || (sec >= 2 && s === 11)) e.kick(t, sec >= 2 ? 0.85 : 0.6);
        if (sec >= 2 && (s === 4 || s === 12)) e.clap(t, 0.22);
        e.shaker(t, s % 2 ? 0.03 : 0.05);
        if ([0, 3, 6, 10, 12, 14].includes(s)) e.strum(t, ch, s % 4 !== 2, s === 0 ? 0.045 : 0.032, 0.7);
        if (s === 0) e.sub(t, r, dt * 6, 0.36);
        if (s === 10) e.sub(t, r + 7, dt * 3, 0.24);
        if (s === 0 && sec !== 2) e.drone(t, 57, dt * 16, 0.012);
      }
      if (sec >= 2 && s === 0) e.pad(t, ch, dt * 16, 0.02);
      // the hulusi melody in the drop, the bamboo flute taking it up an octave in the last section
      if (sec >= 2 && !brk) {
        const off = (c % 2) * 16;
        for (const [st, n, len] of c < 2 ? LJ_A : LJ_B) if (st === s + off) {
          if (sec === 2) e.hulusi(t, LJ_PENT[n], dt * len * 0.95, 0.06);
          else if (bar % 2 === 0) e.dizi(t, LJ_PENT[n] + 12, dt * len * 0.9, 0.05);
          else e.hulusi(t, LJ_PENT[n], dt * len * 0.95, 0.05);
        }
      }
      // the turn of the cycle: a drum roll and the bells
      if (brk) { if (s % 2 === 0) e.djembe(t, s >= 12 ? 'slap' : 'tone', 0.2 + (s - 8) * 0.02); if (s === 8) e.horseBells(t, 0.05); }
    },
  },
  ldn: {
    bpm: 132, swing: 0.18,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, r = LDN_ROOT[c];
      const brk = B === 15 && s >= 8;
      // intro: the hour chime (changes 2-5) over the choir, F instead of D7 so the bells fit
      if (sec === 0) {
        if (s % 4 === 0) e.bell(t, WM[c + 1][s / 4], s === 12 ? 3.2 : 2.2, 0.1);
        if (s === 0) e.choir(t, c === 3 ? [53, 57, 60, 65] : LDN_CH[c], dt * 16, 0.032);
        if (s % 2 === 0) e.sleigh(t, s % 4 ? 0.028 : 0.045);
      }
      if (B === 4 && s === 0) e.bell(t, 46, 4.5, 0.14);
      // the 2-step beat: kick on one and the skip, snare and clap on two and four, shuffled hats, rimshots
      if (sec >= 1 && !brk) {
        if (s === 0 || s === 10 || (s === 7 && bar % 2) || (s === 15 && c === 3)) e.kick(t, 0.92);
        if (s === 4 || s === 12) { e.snare(t, 0.3); e.clap(t, 0.2); }
        if (s === 14 && c === 1) e.snare(t, 0.1);
        if (s % 2 === 1) e.hat(t, s % 4 === 3 ? 0.085 : 0.055);
        if (s % 4 === 2) e.hat(t, 0.075, true);
        if (s === 6 || s === 13) e.wood(t, 0.07, 1700);
        if (s === 0) e.sub(t, r, dt * 5, 0.4);
        if (s === 6) e.sub(t, r, dt * 2, 0.26);
        if (s === 10) e.sub(t, r + 12, dt * 3, 0.24);
        if (s === 14) e.sub(t, r + 7, dt * 2, 0.2);
        if (s === 3 || s === 6 || s === 11 || (s === 14 && bar % 2)) e.organ(t, LDN_CH[c].map((m) => m + 12), dt * 1.4, 0.024);
        if (sec <= 2 && s % 4 === 2) e.sleigh(t, 0.028);
      }
      if (sec === 2 && s === 0) e.pad(t, LDN_CH[c], dt * 16, 0.02);
      if (sec === 3 && s === 0) e.choir(t, LDN_CH[c], dt * 16, 0.018);
      // celesta arpeggios twinkling through the build
      if (sec === 1 && s % 2 === 0) e.celesta(t, LDN_CH[c][(s / 2) % 4] + 24, 0.4, 0.032);
      // the carol tune: the brass band in the drop, the celesta an octave up in the last section with the band below
      if (sec >= 2 && !brk) {
        const off = (c % 2) * 16;
        for (const [st, n, len] of c < 2 ? LDN_A : LDN_B) if (st === s + off) {
          if (sec === 2) e.brass(t, LDN_SC[n], dt * len * 0.95, 0.05);
          else { e.celesta(t, LDN_SC[n] + 12, dt * len, 0.065); if (len >= 4) e.brass(t, LDN_SC[n] - 12, dt * len * 0.9, 0.028); }
        }
      }
      // the breakdown: the first change rung quickly over the last half bar
      if (brk && s % 2 === 0) e.bell(t, WM[0][(s - 8) / 2], 1.6, 0.05);
    },
  },
  syd: {
    bpm: 116, swing: 0.04,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, r = SYD_ROOT[c];
      const brk = B === 15 && s >= 8;
      // the didgeridoo: long breaths in the intro and the last section, pulsing under the groove
      if (sec === 0 || sec === 3) { if (s === 0 && bar % 2 === 0) e.didge(t, 33, dt * 32, 0.11, 2.2); }
      else if (s % 8 === 0) e.didge(t, 33, dt * 7, 0.08, 4.4);
      // clapsticks keep the pulse
      if (STICKS.includes(s) && !(sec === 2 && s % 4 !== 0)) e.clapsticks(t, s === 0 ? 0.24 : 0.15);
      // tropical house kit
      if (sec >= 1 && !brk) {
        if (s % 4 === 0) e.kick(t, 0.8);
        if (s === 4 || s === 12) e.clap(t, 0.26);
        if (s % 4 === 2) e.hat(t, 0.11, true);
        e.shaker(t, s % 2 ? 0.03 : 0.05);
        if (s === 0) e.sub(t, r, dt * 7, 0.34);
        if (s === 8) e.sub(t, r + (c === 3 ? 7 : 12), dt * 5, 0.24);
      }
      // marimba plucks on the off-beats walking the chord; pumping chords in the drop
      if (sec >= 1 && s % 2 === 1 && !brk) e.pluck(t, SYD_CH[c][((s - 1) / 2) % 4] + 12, 0.35, 0.09);
      if (sec === 2) { if (s % 4 === 0) e.pumpPad(t, SYD_CH[c], dt * 4, 0.03); }
      else if (s === 0) e.pad(t, SYD_CH[c], dt * 16, 0.026);
      // the hook, in two-bar phrases
      if (sec >= 2) {
        const off = (B % 2) * 16;
        for (const [st, n, len] of sec === 2 ? SYD_A : SYD_B) if (st === s + off) e.lead(t, SYD_PENT[n], dt * len, 0.05, 'sawtooth', 2400);
      }
    },
  },
  bj: {
    bpm: 112, swing: 0.05,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, r = BJ_ROOT[c];
      const fill = B === 15 && s >= 8;
      // opera percussion: the opening 锣鼓, accents over the beat, a 四击头 closing the cycle
      let hit = null;
      if (sec === 0) hit = (c === 3 ? BJ_SJT : BJ_OPEN)[s];
      else if (fill) hit = BJ_FILL[s];
      else if (sec === 2) hit = s === 0 ? 'cang' : s === 6 || s === 14 ? 'tai' : s === 10 ? 'qi' : null;
      else if (s === 0 && bar % 2 === 0) hit = 'cai';
      else if (sec === 3 && (s === 6 || s === 14)) hit = 'tai';
      if (B === 0 && s === 0) hit = 'CANG';
      if (hit) BJ_HIT[hit](e, t);
      // the hip-hop kit and 808 from the second section on
      if (sec >= 1 && !fill) {
        if (s === 0 || s === 10 || (sec >= 2 && s === 7)) e.kick(t, 0.95);
        if (s === 4 || s === 12) { e.snare(t, 0.3); if (sec >= 2) e.clap(t, 0.28); }
        if (s % 2 === 0) e.hat(t, s % 4 === 2 ? 0.1 : 0.06);
        else if (sec === 2) e.hat(t, 0.035);
        if (sec === 2 && s >= 14) { e.hat(t, 0.05); e.hat(t + dt / 2, 0.04); }
        if (s === 0) e.sub(t, r, dt * 6, 0.4);
        if (sec >= 2 && s === 10) e.sub(t, r + 7, dt * 3, 0.26);
        if (sec === 2 && s === 14) e.sub(t, r + 12, dt * 2, 0.2);
      } else if (sec === 0 && s % 4 === 2) e.shaker(t, 0.04);
      // harmony
      if (sec === 2) { if (s % 4 === 0 && !fill) e.pumpPad(t, BJ_CH[c], dt * 4, 0.028); }
      else if (s === 0) e.pad(t, BJ_CH[c], dt * 16, 0.024);
      // jinghu melody, answering the dizi in the last section
      const ph = JH[bar % 4];
      if ((sec <= 1 || (sec === 3 && bar % 2 === 1)) && !fill && ph[s] >= 0) {
        let n = 1;
        while (s + n < 16 && ph[s + n] < 0) n++;
        e.jinghu(t, GONG[ph[s]], dt * Math.min(n, 4) * 1.1, sec === 3 ? 0.05 : 0.065, s === 0 || ph[s - 1] < 0 ? 2 : 0);
      }
      // the drop: pipa tremolos on chord tones with single plucks in between
      if (sec === 2 && !fill) {
        if (s === 0 || s === 8) e.lunzhi(t, BJ_CH[c][s ? 2 : 1] + 12, 7, dt / 2, 0.075);
        else if ([3, 6, 11, 14].includes(s)) e.pipa(t, BJ_CH[c][[3, 6, 11, 14].indexOf(s) % 3] + 12, 0.4, 0.08);
      }
      // dizi lead with a grace note from above
      if (sec === 3 && bar % 2 === 0 && (s === 0 || s === 8)) {
        const m = DIZI[((B - 12) * 2 + (s ? 1 : 0)) % DIZI.length];
        e.dizi(t, m + 2, dt * 0.5, 0.05);
        e.dizi(t + dt * 0.5, m, dt * 7, 0.075);
      }
    },
  },
  ny: {
    bpm: 100, swing: 0.16,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, ch = NY_CH[c].map((m) => m + 12);
      const brk = B === 15 && s >= 8;
      if (s === 0) e.crackle(t, dt * 16, 0.04);
      // drums enter after the intro and drop out for the closing half bar
      if (sec >= 1 && !brk) {
        if (s === 0 || s === 10 || (s === 7 && bar % 2)) e.kick(t, 0.95);
        if (s === 4 || s === 12) e.snare(t, 0.42);
        if (s === 15 && bar % 4 === 3) e.snare(t, 0.12);
      }
      if (s % 2 === 0) e.hat(t, s % 4 === 2 ? 0.14 : 0.08);
      else if (e.energy > 0.6 && sec >= 2) e.hat(t, 0.04);
      if (s === 14 && bar % 4 === 3) e.hat(t, 0.1, true);
      // upright bass: half notes in the intro, then walking quarters
      if (s % 4 === 0 && (sec >= 1 || s % 8 === 0)) e.upright(t, NY_WALK[c][s / 4], dt * (sec >= 1 ? 3.6 : 7), 0.3);
      // Rhodes: one long chord per bar in the intro, off-beat comping afterwards
      if (sec === 0) { if (s === 0) e.rhodes(t, ch, dt * 14, 0.045); }
      else if (s === 6 || s === 12 || (s === 3 && bar % 2)) e.rhodes(t, ch, dt * 2.6, 0.04);
      // tenor sax: two-bar phrases over the second half of the cycle
      if (sec >= 2) {
        const off = (B % 2) * 16;
        for (const [st, n, len] of sec === 2 ? SAX_A : SAX_B) if (st === s + off) e.sax(t, BLUES[n], dt * len, 0.055);
      }
    },
  },
  pgh: {
    bpm: 126, swing: 0,
    step(e, s, bar, t, dt) {
      const c = bar % 4;
      if (s % 4 === 0) e.kick(t, 1);
      if (s === 4 || s === 12) e.clap(t, 0.4);
      if (s % 4 === 2) e.hat(t, 0.13, true);
      if (s === 3 || s === 11 || (s === 14 && bar % 2)) e.clank(t, 0.12);
      if (s % 2 === 0) {
        const r = PGH_RIFF[Math.floor(bar / 4) % 2][s / 2];
        e.bass(t, PGH_ROOT[c] + r, dt * 1.7, 0.26, 'sawtooth', 900, true);
      }
      if (bar % 4 >= 2 && [0, 3, 6, 8, 11, 14].includes(s)) {
        const notes = [64, 67, 71, 69, 67, 62];
        e.lead(t, notes[[0, 3, 6, 8, 11, 14].indexOf(s)] + (c === 3 ? 2 : 0), dt * 2.4, 0.045, 'sawtooth', 1800);
      }
    },
  },
  tokyo: {
    bpm: 124, swing: 0,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, r = TK_ROOT[c];
      // taiko on the downbeat, fills at the end of every section, rim "ka" off the beat
      if (s === 0) e.taiko(t, sec === 0 ? 0.75 : 0.5, 70);
      if (B % 4 === 3 && (s === 12 || s === 14 || s === 15)) e.taiko(t, 0.55, s === 15 ? 110 : 85);
      if (s === 8 && sec !== 2) e.wood(t, 0.12, 1500);
      // the modern kit comes in with the build
      if (sec >= 1) {
        if (s === 0 || s === 10 || (sec >= 2 && s === 7)) e.kick(t, 0.9);
        if (s === 4 || s === 12) { e.clap(t, 0.32); if (sec >= 2) e.snare(t, 0.16); }
        if (s % 2 === 0) e.hat(t, s % 4 === 2 ? 0.1 : 0.06);
        if (sec >= 2 && (s === 14 || s === 15 || (s === 6 && bar % 2))) { e.hat(t, 0.06); e.hat(t + dt / 2, 0.05); }   // trap rolls
        if (s === 0) e.sub(t, r, dt * 6, 0.42);
        if (sec >= 2 && s === 10) e.sub(t, r + 12, dt * 3, 0.26);
        if (sec >= 2 && s === 14) e.sub(t, r + 7, dt * 2, 0.22);
      } else if (s % 4 === 2) e.shaker(t, 0.05);
      // harmony: soft pad, then pumping chords from the drop on
      if (sec >= 2) { if (s % 4 === 0) e.pumpPad(t, TK_CH[c], dt * 4, 0.032); }
      else if (s === 0) e.pad(t, TK_CH[c], dt * 16, 0.026);
      // koto melody in Hirajoshi (with an occasional string bend)
      if (sec !== 2) {
        const ki = (bar % 2 ? KOTO_B : KOTO_A)[s];
        if (ki >= 0) e.koto(t, HIRA[ki], 0.9, sec === 3 ? 0.1 : 0.15, s === 0 && bar % 4 === 1 ? 1 : 0);
      } else {
        e.koto(t, HIRA[[0, 2, 3, 5, 3, 2][s % 6] + (c % 2)], 0.35, 0.07);
        const k = SHAMI_S.indexOf(s);
        if (k >= 0) e.shamisen(t, SHAMI_N[k] + (c === 3 ? 3 : 0), 0.1);
      }
      // shakuhachi lines over the build and the last section
      if ((sec === 1 || sec === 3) && s === 0 && bar % 2 === 0) {
        const [m, len] = SHAKU[(bar / 2) % SHAKU.length];
        e.flute(t, m, dt * len * 2, 0.07);
      }
    },
  },
  hz: {
    bpm: 108, swing: 0.08,
    step(e, s, bar, t, dt) {
      const c = bar % 4;
      if (s === 0 || s === 8 || (s === 11 && bar % 2)) e.kick(t, 0.7);
      if (s === 4 || s === 12) e.wood(t, 0.2, 820);
      if (s === 14 && bar % 2) e.wood(t, 0.12, 1250);
      e.shaker(t, s % 2 ? 0.035 : 0.06);
      if (s === 0) { e.pad(t, HZ_CH[c], dt * 16, 0.035); e.bass(t, HZ_ROOT[c], dt * 6, 0.25, 'triangle', 600); }
      if (s === 10) e.bass(t, HZ_ROOT[c] + 7, dt * 4, 0.2, 'triangle', 600);
      const mel = HZ_MEL[(Math.floor(bar / 2) + c) % 4];
      const n = mel[s];
      if (n && bar % 2 === 0) e.pluck(t, n, 0.8, 0.16);
      if (n && bar % 2 === 1 && s % 4 === 0) e.pluck(t, n - 12, 0.9, 0.12);
      if (bar % 8 === 6 && s === 0) e.flute(t, 81, dt * 12, 0.07);
      if (bar % 8 === 7 && s === 0) e.flute(t, 78, dt * 14, 0.07);
    },
  },
};

export const audio = new Engine();
