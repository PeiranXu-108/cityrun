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
    this.music = ctx.createGain(); this.music.gain.value = this.musicOn ? 0.5 * ((this.song && this.song.gain) || 1) : 0;
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
    if (this.music) this.music.gain.setTargetAtTime(on ? 0.5 * ((this.song && this.song.gain) || 1) : 0, this.t, 0.1);
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
    if (this.music && this.musicOn) this.music.gain.setTargetAtTime(0.5 * (s.gain || 1), this.t, 0.3);   // a song may carry its own level trim
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

  // ---------- Paris: musette accordion, gypsy-jazz guitar, violin, French-house filter chords ----------
  accordion(t, notes, dur, v = 0.045, out = this.music) {   // musette: three reeds to a note, one tuned sharp and one flat so they beat
    const g = this.gain(out);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.03);
    g.gain.setValueAtTime(v * 0.85, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (out === this.music) g.connect(this.send);
    const bp = this.filt('bandpass', 1400, 0.7, g), lp = this.filt('lowpass', 2800, 0.7, this.gain(g, 0.7));
    for (const m of Array.isArray(notes) ? notes : [notes]) for (const d of [1, 1.008, 0.992]) this.osc('sawtooth', mtof(m) * d, t, dur, bp).connect(lp);
  }
  pompe(t, chord, v = 0.05, dur = 0.13) {   // la pompe: the gypsy guitar's short, bright chop, damped straight away
    chord.forEach((m, i) => {
      const tt = t + i * 0.007, g = this.gain(this.music); this.env(g, tt, 0.002, v, dur);
      const f = this.filt('bandpass', 1700, 0.9, g);
      this.osc('sawtooth', mtof(m), tt, dur, f); this.osc('square', mtof(m) * 2, tt, dur * 0.5, this.gain(f, 0.18));
    });
    const gn = this.gain(this.music); this.env(gn, t, 0.001, v * 0.45, 0.03); this.noiseSrc(t, 0.04, this.filt('bandpass', 3200, 1.2, gn));
  }
  violin(t, m, dur, v = 0.05) {   // a bowed violin: the bow's slow bite, the body's formants, vibrato arriving late
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.12, dur * 0.3));
    g.gain.setValueAtTime(v * 0.9, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.send);
    const f1 = this.filt('bandpass', 750, 1.1, g), f2 = this.filt('bandpass', 2600, 1.5, this.gain(g, 0.8));
    const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(mtof(m), t);
    o.connect(f1); o.connect(f2); o.start(t); o.stop(t + dur + 0.05);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 5.8;
    const lg = this.ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(0, t + Math.min(0.2, dur * 0.35)); lg.gain.linearRampToValueAtTime(mtof(m) * 0.012, t + Math.min(0.55, dur * 0.8));
    lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
  }
  filterChord(t, chord, dur, cut = 900, v = 0.035) {   // a French-house stab: detuned saws through a resonant low-pass, ducking after the kick
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = this.filt('lowpass', cut, 5, g);
    chord.forEach((m) => { for (const d of [1, 1.006]) this.osc('sawtooth', mtof(m) * d, t, dur, f); });
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

  // ---------- Hong Kong: the yangqin's struck strings, the erhu's sung line ----------
  yangqin(t, m, dur = 0.8, v = 0.07) {         // 揚琴: hammered dulcimer, two strings to a note a hair apart, a bright metal strike
    const g = this.gain(this.music); this.env(g, t, 0.001, v, dur); g.connect(this.send);
    const f = this.filt('lowpass', 6500, 1, g);
    f.frequency.setValueAtTime(8000, t); f.frequency.exponentialRampToValueAtTime(1600, t + dur * 0.6);
    for (const d of [1, 1.004]) this.osc('triangle', mtof(m) * d, t, dur, f);
    this.osc('sine', mtof(m) * 3, t, dur * 0.2, this.gain(f, 0.18));
    const gk = this.gain(this.music); this.env(gk, t, 0.001, v * 0.5, 0.025);
    this.noiseSrc(t, 0.03, this.filt('bandpass', 3800, 2, gk));
  }
  erhu(t, m, dur, v = 0.05, slide = 0) {       // 二胡: the two-string fiddle, softer and more vocal than the jinghu, sliding into its notes
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.06);
    g.gain.setValueAtTime(v * 0.85, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.send);
    const bp = this.filt('bandpass', 1050, 1.0, g), lp = this.filt('lowpass', 2600, 0.7, this.gain(g, 0.5));
    const o = this.ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(mtof(m - slide), t);
    if (slide) o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.1);
    o.connect(bp); o.connect(lp); o.start(t); o.stop(t + dur + 0.05);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 5.6;
    const lg = this.ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(0, t + Math.min(0.15, dur * 0.3)); lg.gain.linearRampToValueAtTime(mtof(m) * 0.013, t + Math.min(0.45, dur * 0.8));
    lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
  }
  tramBellAt(t, v = 0.14, out = this.sfx) {    // one strike of a tram's foot gong: a bright bell with its inharmonic partials
    for (const [k, a, d] of [[1, 1, 0.9], [2.32, 0.5, 0.6], [4.1, 0.3, 0.35], [5.9, 0.15, 0.2]]) {
      const g = this.gain(out); this.env(g, t, 0.001, v * a, d);
      this.osc('sine', 1180 * k, t, d, g);
    }
  }

  // ---------- Taipei: a temple festival's suona, beiguan drums and firecrackers, a rave's supersaws ----------
  suona(t, m, dur, v = 0.05, slide = 1.5) {   // 嗩吶: a double reed in a brass bell, loud and nasal, bending up into its notes
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.03);
    g.gain.setValueAtTime(v * 0.85, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.send);
    const f1 = this.filt('bandpass', 1500, 1.6, g), f2 = this.filt('bandpass', 3100, 2.4, this.gain(g, 0.6)), lp = this.filt('lowpass', 4200, 0.8, this.gain(g, 0.35));
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 6.4;
    const lg = this.ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(mtof(m) * 0.018, t + Math.min(0.3, dur * 0.7));
    lfo.connect(lg); lfo.start(t); lfo.stop(t + dur);
    for (const [type, det] of [['sawtooth', 0], ['square', 9]]) {
      const o = this.ctx.createOscillator(); o.type = type; o.detune.value = det;
      o.frequency.setValueAtTime(mtof(m - slide), t); o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.07);
      o.connect(f1); o.connect(f2); o.connect(lp); lg.connect(o.frequency); o.start(t); o.stop(t + dur + 0.05);
    }
  }
  tonggu(t, v = 0.3) {   // 通鼓: the beiguan band's barrel drum, a round boom and the slap of the stick
    const g = this.gain(this.music); this.env(g, t, 0.002, v, 0.32);
    const o = this.osc('sine', 190, t, 0.36, g); o.frequency.exponentialRampToValueAtTime(105, t + 0.12);
    const g2 = this.gain(this.music); this.env(g2, t, 0.001, v * 0.45, 0.05);
    this.noiseSrc(t, 0.08, this.filt('bandpass', 1800, 1.2, g2));
  }
  firecrackers(t, dur = 1, v = 0.15, out = this.music) {   // 鞭炮: a string of crackers going off, sharp cracks one after another
    for (let tt = t; tt < t + dur; tt += 0.018 + Math.random() * 0.05) {
      const g = this.gain(out); this.env(g, tt, 0.0008, v * (0.4 + Math.random() * 0.6), 0.02 + Math.random() * 0.035);
      this.noiseSrc(tt, 0.07, this.filt('bandpass', 1800 + Math.random() * 3400, 0.9, g));
    }
  }
  supersaw(t, chord, dur, v = 0.025, cut = 2400) {   // a trance supersaw: detuned saws through a low-pass closing after the hit
    const g = this.gain(this.music); this.env(g, t, 0.004, v, dur);
    g.connect(this.send);
    const f = this.filt('lowpass', cut, 1.2, g);
    f.frequency.setValueAtTime(cut * 2.2, t); f.frequency.exponentialRampToValueAtTime(cut * 0.6, t + dur);
    chord.forEach((m) => [-14, -5, 5, 14].forEach((d) => { const o = this.osc('sawtooth', mtof(m), t, dur, f); o.detune.value = d; }));
  }
  truckTone(t, m, dur, v = 0.07, out = this.sfx) {   // a cheap electronic tone through a truck's horn speaker, wobbling a little
    const g = this.gain(out); this.env(g, t, 0.006, v, dur);
    const bp = this.filt('bandpass', 1900, 0.8, g);
    const o = this.osc('square', mtof(m), t, dur, bp);
    this.osc('triangle', mtof(m + 12), t, dur, this.gain(bp, 0.4));
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 5.2; const lg = this.ctx.createGain(); lg.gain.value = mtof(m) * 0.004;
    lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.05);
  }

  // ---------- Istanbul: the darbuka, the bağlama, the ney, the kanun and the zils; a ferry's horn, the gulls, tea glasses ----------
  darbuka(t, k = 'T', v = 0.25, out = this.music) {   // the goblet drum: DÜM struck in the middle of the skin, TEK and the lighter KA at its rim
    if (k === 'D') {
      const g = this.gain(out); this.env(g, t, 0.002, v, 0.34);
      const o = this.osc('sine', 165, t, 0.38, g); o.frequency.exponentialRampToValueAtTime(68, t + 0.17);
      const g2 = this.gain(out); this.env(g2, t, 0.001, v * 0.35, 0.05); this.noiseSrc(t, 0.06, this.filt('lowpass', 700, 0.8, g2));
      return;
    }
    const ka = k === 'k', g = this.gain(out); this.env(g, t, 0.001, v * (ka ? 0.5 : 1), ka ? 0.035 : 0.06);
    this.noiseSrc(t, 0.08, this.filt('bandpass', ka ? 2300 : 3100, 1.4, g));
    const g2 = this.gain(out); this.env(g2, t, 0.001, v * (ka ? 0.25 : 0.55), ka ? 0.05 : 0.09);
    this.osc('sine', ka ? 980 : 1180, t, 0.12, g2);
  }
  saz(t, m, dur = 0.3, v = 0.07) {   // the bağlama: a doubled steel course plucked hard, bright and buzzing, slipping up into the note
    const g = this.gain(this.music); this.env(g, t, 0.001, v, dur); g.connect(this.send);
    const f = this.filt('lowpass', 5200, 1.6, g); f.frequency.setValueAtTime(5600, t); f.frequency.exponentialRampToValueAtTime(1300, t + dur * 0.7);
    for (const d of [1, 1.004]) { const o = this.osc('sawtooth', mtof(m) * d * 0.985, t, dur, f); o.frequency.exponentialRampToValueAtTime(mtof(m) * d, t + 0.03); }
    this.osc('square', mtof(m) * 2, t, dur * 0.3, this.filt('bandpass', mtof(m) * 4, 3, this.gain(g, 0.25)));
  }
  ney(t, m, dur, v = 0.06) {   // the ney: an end-blown reed flute, more breath than tone, sliding up into its notes, the vibrato coming late
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.14, dur * 0.4));
    g.gain.setValueAtTime(v * 0.9, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.send);
    const o = this.osc('sine', mtof(m) * 0.982, t, dur, g); o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.16);
    const o2 = this.osc('triangle', mtof(m) * 2 * 0.982, t, dur, this.gain(g, 0.12)); o2.frequency.exponentialRampToValueAtTime(mtof(m) * 2, t + 0.16);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 5.2;
    const lg = this.ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(0, t + Math.min(0.25, dur * 0.4)); lg.gain.linearRampToValueAtTime(mtof(m) * 0.011, t + Math.min(0.7, dur * 0.8));
    lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
    const gn = this.gain(this.music); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(v * 0.45, t + 0.06); gn.gain.exponentialRampToValueAtTime(v * 0.18, t + dur * 0.5); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    this.noiseSrc(t, dur, this.filt('bandpass', mtof(m) * 1.5, 1.8, gn));   // the breath
  }
  kanun(t, m, dur = 0.5, v = 0.04) {   // the kanun: a plucked zither, quick and glassy
    const g = this.gain(this.music); this.env(g, t, 0.001, v, dur); g.connect(this.send);
    this.osc('triangle', mtof(m), t, dur, g);
    this.osc('sine', mtof(m) * 2.005, t, dur * 0.4, this.gain(g, 0.35));
    const gk = this.gain(this.music); this.env(gk, t, 0.001, v * 0.4, 0.015); this.noiseSrc(t, 0.02, this.filt('highpass', 4000, 0.7, gk));
  }
  zil(t, v = 0.05, out = this.music) {   // finger cymbals struck together, ringing
    for (const [f, a, d] of [[2730, 1, 0.7], [4120, 0.6, 0.5], [6390, 0.3, 0.3]]) { const g = this.gain(out); this.env(g, t, 0.001, v * a, d); this.osc('sine', f, t, d, g); }
    const gn = this.gain(out); this.env(gn, t, 0.001, v * 0.5, 0.03); this.noiseSrc(t, 0.04, this.filt('highpass', 6000, 0.7, gn));
  }
  shipHorn(t, dur = 1.5, v = 0.08, out = this.sfx) {   // a ferry's horn: a low brassy chord, swelling, sagging a little as it dies
    const g = this.gain(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.18); g.gain.setValueAtTime(v, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = this.filt('lowpass', 650, 1.2, g);
    for (const fr of [98, 147, 196]) { const o = this.osc('sawtooth', fr, t, dur, f); o.frequency.setValueAtTime(fr, t + dur * 0.75); o.frequency.exponentialRampToValueAtTime(fr * 0.96, t + dur); }
    this.osc('sine', 49, t, dur, this.gain(g, 0.8));
  }
  gull(t, v = 0.05, out = this.sfx) {   // a herring gull's "kee-ow": up, then falling away, harsh
    const g = this.gain(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.03); g.gain.setValueAtTime(v, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);
    const o = this.osc('sawtooth', 1350, t, 0.45, this.filt('bandpass', 1800, 1.6, g));
    o.frequency.setValueAtTime(1350, t); o.frequency.linearRampToValueAtTime(1700, t + 0.08); o.frequency.exponentialRampToValueAtTime(880, t + 0.42);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 26; const lg = this.ctx.createGain(); lg.gain.value = 60; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 0.45);
  }
  teaGlass(t, v = 0.04, out = this.sfx) {   // a spoon on a tulip glass of tea
    for (const [f, d] of [[3150, 0.35], [5240, 0.22], [7900, 0.12]]) { const g = this.gain(out); this.env(g, t, 0.001, v, d); this.osc('sine', f * (0.99 + Math.random() * 0.02), t, d, g); }
  }

  // ---------- Dubai: the oud, the tabl, a Khaleeji band's handclaps; the tram's horn ----------
  // the oud: a fretless lute, its doubled gut courses struck with an eagle-feather risha, deep and woody, sliding into the
  // note (fractional MIDI for the maqam's quarter tones); trem: the risha's tremolo, the note struck over and over
  oud(t, m, dur = 0.4, v = 0.07, { trem = false, out = this.music } = {}) {
    const f0 = mtof(m), step = 0.052, hits = trem ? Math.max(1, Math.floor(dur / step)) : 1;
    for (let i = 0; i < hits; i++) {
      const tt = t + i * step, d = trem ? Math.min(0.2, dur - i * step + 0.06) : dur, vv = v * (i ? 0.5 + 0.2 * Math.sin(i * 1.7) : 1);
      const g = this.gain(out); this.env(g, tt, 0.002, vv, d);
      if (out === this.music) g.connect(this.send);
      const body = this.filt('lowpass', 2600, 1.2, g);
      body.frequency.setValueAtTime(2900, tt); body.frequency.exponentialRampToValueAtTime(620, tt + Math.min(d, 0.32));
      for (const det of [0.997, 1.003]) { const o = this.osc('sawtooth', f0 * det * (i ? 1 : 0.972), tt, d, body); if (!i) o.frequency.exponentialRampToValueAtTime(f0 * det, tt + 0.045); }
      this.osc('triangle', f0 / 2, tt, d * 0.8, this.filt('lowpass', 480, 0.8, this.gain(g, 0.45)));   // the deep bowl of its back
      const gk = this.gain(out); this.env(gk, tt, 0.001, vv * 0.35, 0.012); this.noiseSrc(tt, 0.02, this.filt('bandpass', 2400, 1.2, gk));   // the feather on the string
    }
  }
  tabl(t, v = 0.3, out = this.music) {   // the tabl: the big double-headed drum of the Gulf's bands, a deep round boom and the stick's slap
    const g = this.gain(out); this.env(g, t, 0.002, v, 0.42);
    const o = this.osc('sine', 118, t, 0.46, g); o.frequency.exponentialRampToValueAtTime(46, t + 0.24);
    const g2 = this.gain(out); this.env(g2, t, 0.001, v * 0.4, 0.06); this.noiseSrc(t, 0.07, this.filt('lowpass', 520, 0.9, g2));
  }
  khaleejiClap(t, v = 0.12, out = this.music) {   // a row of men clapping together, never quite at once: five claps spread over a few milliseconds
    for (let k = 0; k < 5; k++) {
      const tt = t + Math.random() * 0.016, g = this.gain(out); this.env(g, tt, 0.001, v * (0.6 + Math.random() * 0.4), 0.05 + Math.random() * 0.03);
      this.noiseSrc(tt, 0.09, this.filt('bandpass', 1050 + Math.random() * 700, 1.1, g));
    }
    if (out === this.music) { const gs = this.gain(this.send); this.env(gs, t, 0.001, v * 0.35, 0.08); this.noiseSrc(t, 0.1, this.filt('bandpass', 1300, 0.9, gs)); }
  }
  tramHornAt(t, dur = 0.42, v = 0.07, out = this.sfx) {   // the Dubai tram's horn: a soft electronic two-tone, a major third
    const g = this.gain(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.03); g.gain.setValueAtTime(v, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = this.filt('bandpass', 1300, 0.7, g);
    for (const fr of [587, 740]) { this.osc('square', fr, t, dur, f); this.osc('sine', fr, t, dur, this.gain(g, 0.6)); }
  }

  // ---------- Moscow: the balalaika and the bayan, the wooden spoons, the bass choir; an elektrichka's horn ----------
  balalaika(t, m, dur = 0.22, v = 0.07) {   // a bright, thin pluck from the little triangular body, quick to die
    const g = this.gain(this.music); this.env(g, t, 0.001, v, dur); g.connect(this.send);
    const f = this.filt('bandpass', mtof(m) * 3, 0.8, g);
    this.osc('sawtooth', mtof(m), t, dur, f);
    this.osc('triangle', mtof(m) * 2.003, t, dur * 0.6, this.gain(g, 0.4));
    const gk = this.gain(this.music); this.env(gk, t, 0.001, v * 0.3, 0.012); this.noiseSrc(t, 0.015, this.filt('highpass', 3000, 0.7, gk));
  }
  tremolo(t, m, n, gap, v = 0.05) { for (let k = 0; k < n; k++) this.balalaika(t + k * gap, m, gap * 1.6, v * (0.8 + 0.2 * Math.random())); }   // the balalaika's rattling tremolo
  bayan(t, notes, dur, v = 0.04, out = this.music) {   // the bayan: free reeds, dry and a little nasal, the bellows swelling into each chord
    const g = this.gain(out);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.06); g.gain.setValueAtTime(v * 0.9, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (out === this.music) g.connect(this.send);
    const bp = this.filt('bandpass', 1100, 0.9, g), lp = this.filt('lowpass', 2400, 0.7, this.gain(g, 0.6));
    for (const m of Array.isArray(notes) ? notes : [notes]) { this.osc('square', mtof(m), t, dur, bp).connect(lp); this.osc('sawtooth', mtof(m) * 1.002, t, dur, this.gain(bp, 0.5)); }
  }
  spoons(t, v = 0.12, out = this.music) {   // the wooden spoons clacked together
    const g = this.gain(out); this.env(g, t, 0.001, v, 0.04);
    this.noiseSrc(t, 0.05, this.filt('bandpass', 2400, 3, g));
    this.osc('sine', 1650, t, 0.04, this.gain(g, 0.4));
  }
  bassChoir(t, chord, dur, v = 0.022) {   // the Russian basses: deep "oh" voices swelling slowly
    const g = this.gain(this.music);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.3); g.gain.setValueAtTime(v, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.send);
    const f1 = this.filt('bandpass', 420, 3.5, g), f2 = this.filt('bandpass', 760, 4, this.gain(g, 0.5));
    chord.forEach((m) => { for (const d of [0.995, 1.005]) this.osc('sawtooth', mtof(m) * d, t, dur, f1).connect(f2); });
  }
  hey(t, v = 0.08) {   // the dancers' shout: a burst of breath through an "ey" vowel, falling
    const g = this.gain(this.music); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    const o = this.osc('sawtooth', 330, t, 0.25, this.filt('bandpass', 1900, 3, g)); o.frequency.exponentialRampToValueAtTime(240, t + 0.22);
    this.noiseSrc(t, 0.12, this.filt('bandpass', 2600, 1.2, this.gain(g, 0.6)));
  }
  typhon(t, dur = 1.1, v = 0.08, out = this.sfx) {   // an elektrichka's horn: two harsh reed tones a little apart, swelling in
    for (const [fr, k] of [[311, 1], [370, 0.85]]) {
      const g = this.gain(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * k, t + 0.06); g.gain.setValueAtTime(v * k, t + dur * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const f = this.filt('bandpass', fr * 2.2, 1.2, g);
      this.osc('sawtooth', fr, t, dur, f); this.osc('square', fr * 1.005, t, dur, this.gain(f, 0.4));
    }
  }

  // ---------- San Francisco: a surf guitar and a combo organ, the fuzz lead, the tambourine; the foghorns, a cable car's bell ----------
  twang(t, m, dur = 0.6, v = 0.06) {   // a surf guitar drowned in its spring reverb: a bright pluck, the tremolo arm shivering the note
    const g = this.gain(this.music); this.env(g, t, 0.002, v, dur); g.connect(this.send);
    const f = this.filt('lowpass', 3400, 1.2, g); f.frequency.setValueAtTime(4400, t); f.frequency.exponentialRampToValueAtTime(1300, t + dur);
    const o = this.osc('sawtooth', mtof(m), t, dur, f); this.osc('square', mtof(m) * 1.003, t, dur, this.gain(f, 0.3));
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 7.2; const lg = this.ctx.createGain(); lg.gain.value = mtof(m) * 0.007;
    lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.05);
  }
  fuzz(t, m, dur, v = 0.03, bend = 0) {   // a fuzz guitar: the saw driven into the shaper, bending up into its note, the vibrato coming in late
    const out = this.gain(this.music, 0.0001); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(v, t + 0.012); out.gain.setValueAtTime(v * 0.85, t + dur * 0.8); out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(this.send);
    // its own odd-length curve, so silence goes through as silence (the shared one sits a hair off zero) until the note starts
    if (!this.fuzzCurve) { this.fuzzCurve = new Float32Array(1025); for (let i = 0; i < 1025; i++) this.fuzzCurve[i] = Math.tanh((i / 512 - 1) * 3.5); }
    const ws = this.ctx.createWaveShaper(); ws.curve = this.fuzzCurve; ws.connect(this.filt('lowpass', 2600, 0.9, out));
    const o = this.osc('sawtooth', mtof(m - bend), t, dur, this.gain(ws, 0.7)); if (bend) o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.1);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 5.6; const lg = this.ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(0, t + Math.min(0.2, dur * 0.4)); lg.gain.linearRampToValueAtTime(mtof(m) * 0.012, t + Math.min(0.6, dur * 0.8));
    lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
  }
  tambourine(t, v = 0.05, out = this.music) {   // a shake of the tambourine: its jingles ringing over a short hiss
    for (const [f, d] of [[5200, 0.16], [6900, 0.12], [8300, 0.09]]) { const g = this.gain(out); this.env(g, t, 0.001, v * 0.4, d); this.osc('square', f * (0.98 + Math.random() * 0.04), t, d, this.filt('highpass', 4000, 0.7, g)); }
    const gn = this.gain(out); this.env(gn, t, 0.002, v, 0.1); this.noiseSrc(t, 0.12, this.filt('bandpass', 7600, 1.0, gn));
  }
  foghornAt(t, dur = 2, v = 0.08, out = this.sfx) {   // the Golden Gate's foghorn: a deep, reedy blast whose pitch drops at its end into a grunt
    const g = this.gain(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.14); g.gain.setValueAtTime(v, t + dur * 0.76); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = this.filt('lowpass', 680, 1.4, g);
    for (const [fr, k] of [[176, 1], [177.4, 0.7], [88, 0.7]]) { const o = this.osc('sawtooth', fr, t, dur, this.gain(f, k)); o.frequency.setValueAtTime(fr, t + dur * 0.6); o.frequency.exponentialRampToValueAtTime(fr * 0.76, t + dur * 0.82); }
  }
  cableBellAt(t, v = 0.12, out = this.sfx) {   // one clang of a cable car's bell: heavy brass, lower and longer than a tram's gong
    for (const [k, a, d] of [[1, 1, 1.3], [2.0, 0.55, 0.9], [2.76, 0.42, 0.7], [4.07, 0.22, 0.45], [5.4, 0.12, 0.3]]) { const g = this.gain(out); this.env(g, t, 0.001, v * a, d); this.osc('sine', 830 * k, t, d, g); }
    const gk = this.gain(out); this.env(gk, t, 0.001, v * 0.35, 0.02); this.noiseSrc(t, 0.03, this.filt('highpass', 3000, 0.8, gk));
  }

  // ---------- Los Angeles: a G-funk whistle and a sliding synth bass, the talk box, finger snaps; the Red Car's air whistle and gong ----------
  whistle(t, m, dur, v = 0.05, from = null) {   // the high sine lead that glides into every note, the vibrato coming in late
    const g = this.gain(this.music, 0.0001); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.03); g.gain.setValueAtTime(v * 0.9, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.send);
    const o = this.osc('sine', mtof(from ?? m), t, dur, g); if (from !== null) o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.07);
    this.osc('triangle', mtof(m) * 2, t, dur, this.gain(g, 0.06));
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 5.8; const lg = this.ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(0, t + Math.min(0.15, dur * 0.4)); lg.gain.linearRampToValueAtTime(mtof(m) * 0.014, t + Math.min(0.5, dur * 0.9));
    lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
  }
  moog(t, m, dur, v = 0.2, from = null) {   // a fat mono synth bass: two saws under a closing filter, sliding in from the last note
    const g = this.gain(this.music); this.env(g, t, 0.006, v, dur);
    const f = this.filt('lowpass', 420, 4, g); f.frequency.setValueAtTime(1500, t); f.frequency.exponentialRampToValueAtTime(380, t + Math.min(0.25, dur));
    for (const [k, type] of [[1, 'sawtooth'], [1.006, 'sawtooth'], [0.5, 'square']]) { const o = this.osc(type, mtof(from ?? m) * k, t, dur, this.gain(f, type === 'square' ? 0.5 : 1)); if (from !== null) o.frequency.exponentialRampToValueAtTime(mtof(m) * k, t + 0.08); }
  }
  talkbox(t, m, dur, v = 0.035) {   // a synth spoken through a tube: the saw shaped by a mouth opening from "oo" to "ah" and closing again
    const g = this.gain(this.music, 0.0001); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.04); g.gain.setValueAtTime(v, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.send);
    const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(mtof(m - 0.6), t); o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.06); o.start(t); o.stop(t + dur + 0.05);
    for (const [f0, f1, k] of [[320, 760, 1], [860, 1250, 0.6]]) {
      const f = this.filt('bandpass', f0, 6, this.gain(g, k));
      f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.35); f.frequency.exponentialRampToValueAtTime(f0 * 1.1, t + dur);
      o.connect(f);
    }
  }
  snap(t, v = 0.1) {   // a finger snap: a sharp click and a short burst of air
    const g = this.gain(this.music); this.env(g, t, 0.001, v, 0.05); this.noiseSrc(t, 0.06, this.filt('bandpass', 2600, 2.2, g));
    const g2 = this.gain(this.music); this.env(g2, t, 0.0005, v * 0.6, 0.008); this.osc('square', 1800, t, 0.01, g2);
  }
  timpani(t, m = 43, v = 0.2, out = this.sfx) {   // a kettledrum: the head's note, a little flat as it's struck, the thud under it
    const g = this.gain(out); this.env(g, t, 0.004, v, 0.9);
    const o = this.osc('sine', mtof(m) * 1.04, t, 1.0, g); o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.08);
    this.osc('sine', mtof(m) * 1.5, t, 0.5, this.gain(g, 0.25));
    const gn = this.gain(out); this.env(gn, t, 0.002, v * 0.4, 0.08); this.noiseSrc(t, 0.1, this.filt('lowpass', 500, 0.8, gn));
  }
  trumpet(t, m, dur, v = 0.05, out = this.sfx) {   // a fanfare's trumpet: buzzy and bright, the filter flaring as it speaks
    const g = this.gain(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.03); g.gain.setValueAtTime(v * 0.85, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = this.filt('lowpass', 1200, 1.3, g); f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(4200, t + 0.05); f.frequency.exponentialRampToValueAtTime(2400, t + Math.max(0.1, dur * 0.6));
    for (const k of [1, 1.005]) this.osc('sawtooth', mtof(m) * k, t, dur, f);
  }
  clapper(t, v = 0.2, out = this.sfx) {   // a clapperboard snapping shut: wood on wood, one sharp crack
    const g = this.gain(out); this.env(g, t, 0.0005, v, 0.06); this.noiseSrc(t, 0.07, this.filt('bandpass', 1900, 1.4, g));
    const g2 = this.gain(out); this.env(g2, t, 0.0005, v * 0.7, 0.03); this.osc('triangle', 620, t, 0.04, g2);
  }
  airHorn(t, dur = 0.8, v = 0.07, out = this.sfx) {   // an old interurban's air whistle: a sweet minor third, a little breath in it
    for (const [fr, k] of [[392, 1], [466, 0.8]]) {
      const g = this.gain(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * k, t + 0.05); g.gain.setValueAtTime(v * k, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const f = this.filt('bandpass', fr * 2, 1.6, g); this.osc('square', fr, t, dur, f); this.osc('sawtooth', fr * 1.003, t, dur, this.gain(f, 0.5));
    }
    const gn = this.gain(out); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(v * 0.25, t + 0.04); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); this.noiseSrc(t, dur, this.filt('bandpass', 2400, 2, gn));
  }
  gongAt(t, v = 0.11, out = this.sfx) {   // one clang of a streetcar's foot gong: lower and darker than a tram bell, its partials beating
    for (const [k, a, d] of [[1, 1, 1.1], [1.53, 0.5, 0.8], [2.41, 0.35, 0.55], [3.9, 0.18, 0.3]]) { const g = this.gain(out); this.env(g, t, 0.001, v * a, d); this.osc('sine', 520 * k, t, d, g); this.osc('sine', 520 * k * 1.004, t, d, this.gain(g, 0.5)); }
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
  // Taipei: the garbage truck coming round the corner playing Für Elise through its loudspeaker, a little tinny
  furElise() {
    this.fx((t) => {
      const N = [[76, 1], [75, 1], [76, 1], [75, 1], [76, 1], [71, 1], [74, 1], [72, 1], [69, 2, [45, 52, 57]], [0, 1], [60, 1], [64, 1], [69, 1], [71, 2, [40, 52, 56]], [0, 1], [64, 1], [68, 1], [71, 1], [72, 3, [45, 52, 57]]];
      let d = 0; const q = 0.14;
      for (const [m, len, lh] of N) {
        if (m) this.truckTone(t + d, m, len * q * 0.95, 0.22);
        if (lh) lh.forEach((n, i) => this.truckTone(t + d + i * q, n + 12, q * 0.9, 0.09));   // the left hand's arpeggio
        d += len * q;
      }
    });
  }
  // a garbage truck coming down the line: the first bars of its tune
  garbageTruck() {
    this.fx((t) => [[76, 1], [75, 1], [76, 1], [75, 1], [76, 1], [71, 1], [74, 1], [72, 1], [69, 3]].reduce((d, [m, len]) => { this.truckTone(t + d, m, len * 0.13 * 0.95, 0.2); return d + len * 0.13; }, 0));
  }
  // a ding-ding coming down the line: the driver stamps on the bell twice
  tramBell() { this.fx((t) => { this.tramBellAt(t); this.tramBellAt(t + 0.26); }); }
  // Hong Kong: the tram's "ding ding", a yangqin rippling up the scale, the bell again
  dingding() {
    this.fx((t) => {
      this.tramBellAt(t); this.tramBellAt(t + 0.26);
      [69, 72, 74, 76, 79, 81, 84, 86].forEach((m, i) => this.tone(t + 0.62 + i * 0.07, 'triangle', mtof(m), mtof(m), 0.5, 0.075));
      this.tramBellAt(t + 1.36, 0.12); this.tramBellAt(t + 1.62, 0.12);
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
  // Paris: the accordion breathes a chord, then the tower's lights twinkle down from the top
  scintille() {
    this.fx((t) => {
      this.accordion(t, [62, 65, 69, 74], 1.5, 0.03, this.sfx);
      [91, 95, 98, 103, 100, 96, 93, 98, 102, 105, 100, 107].forEach((m, i) => {
        const tt = t + 0.35 + i * 0.075 + Math.random() * 0.02;
        this.tone(tt, 'sine', mtof(m), mtof(m), 0.35, 0.035);
        this.tone(tt, 'triangle', mtof(m + 12), mtof(m + 12), 0.12, 0.012);
      });
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
  // Istanbul: a ferry's horn across the water, the gulls answering, a spoon on a tea glass
  vapur() {
    this.fx((t) => {
      const o = this.sfx;
      this.shipHorn(t, 1.6, 0.085, o);
      this.gull(t + 1.25, 0.13, o); this.gull(t + 1.62, 0.1, o); this.gull(t + 2.1, 0.09, o);
      this.teaGlass(t + 2.55, 0.035, o); this.teaGlass(t + 2.7, 0.03, o);
    });
  }
  // Moscow: an elektrichka coming down the line sounds its horn, a short blast and a long one
  elektrichka() { this.fx((t) => { this.typhon(t, 0.45); this.typhon(t + 0.6, 1.1); }); }
  // Moscow: the church bells' peal (трезвон): the little bells' quick figure, the middle bells answering, the great bell under them
  kolokola() {
    this.fx((t) => {
      const o = this.sfx, q = 0.11;
      for (let k = 0; k < 20; k++) {
        this.bell(t + k * q, [88, 91, 86, 91, 88, 93, 86, 91][k % 8], 0.7, 0.028, o);
        if (k % 2 === 1) this.bell(t + k * q, [74, 76][(k >> 1) % 2], 1.0, 0.032, o);
      }
      for (const k of [0, 8, 16]) this.bell(t + k * q, 50, 3.0, 0.1, o);
    });
  }
  // San Francisco: the foghorns calling across the Golden Gate, one near and one far, then a cable car's bell: ding ding, ding-a-ding
  foghorn() {
    this.fx((t) => {
      const o = this.sfx;
      this.foghornAt(t, 1.8, 0.075, o); this.foghornAt(t + 1.1, 1.6, 0.038, o);
      [2.5, 2.72, 3.12, 3.24, 3.36].forEach((d, i) => this.cableBellAt(t + d, i % 2 ? 0.1 : 0.12, o));
    });
  }
  // a cable car coming down the line: the gripman rings his bell, ding ding, ding-a-ding-ding
  cableCar() { this.fx((t) => [0, 0.2, 0.55, 0.66, 0.77, 0.92].forEach((d, i) => this.cableBellAt(t + d, i < 2 ? 0.13 : 0.1))); }
  // Los Angeles: the clapperboard, a roll on the timpani, the studio fanfare (our own)
  premiere() {
    this.fx((t) => {
      const o = this.sfx;
      this.clapper(t, 0.22, o);
      for (let k = 0; k < 12; k++) this.timpani(t + 0.3 + k * 0.07 * (1 - k * 0.03), 43, 0.05 + k * 0.012, o);
      this.timpani(t + 1.15, 43, 0.22, o);
      [[0, 67, 0.22], [0.24, 72, 0.22], [0.48, 76, 0.22], [0.72, 79, 0.5], [1.26, 76, 0.18], [1.46, 79, 1.3]].forEach(([d, m, len]) => { this.trumpet(t + 1.15 + d, m, len, 0.045, o); this.trumpet(t + 1.15 + d, m - 12, len, 0.03, o); });
      [60, 64, 67].forEach((m) => this.trumpet(t + 2.61, m, 1.3, 0.025, o));
      this.timpani(t + 2.61, 36, 0.24, o); this.timpani(t + 2.61, 43, 0.12, o);
    });
  }
  // an old Red Car coming down the line: two blasts on its air whistle, then the gong
  redCar() { this.fx((t) => { this.airHorn(t, 0.42, 0.07); this.airHorn(t + 0.58, 0.95, 0.07); [1.75, 1.95, 2.3].forEach((d) => this.gongAt(t + d, 0.1)); }); }
  // Dubai: an oud running up the Bayati scale over a darbuka roll, its top note trembling under the risha; a kanun sweeping
  // down into the chord, the oud's low strings and a zil
  majlis() {
    this.fx((t) => {
      const o = this.sfx;
      [62, 63.5, 65, 67, 69, 70, 72].forEach((m, i) => this.oud(t + i * 0.085, m, 0.22, 0.09, { out: o }));
      this.oud(t + 0.6, 74, 0.8, 0.085, { trem: true, out: o });
      for (let k = 0; k < 9; k++) this.darbuka(t + 0.04 + k * 0.068, k % 2 ? 'k' : 'T', 0.05 + k * 0.013, o);
      this.darbuka(t + 0.66, 'D', 0.26, o);
      [86, 84, 81, 79, 77, 74, 72, 69, 65, 62].forEach((m, i) => this.tone(t + 1.42 + i * 0.045, 'triangle', mtof(m), mtof(m), 0.55, 0.05, o));
      [50, 57, 62].forEach((m) => this.oud(t + 1.9, m, 1.1, 0.08, { out: o }));
      this.zil(t + 1.9, 0.07, o); this.darbuka(t + 1.9, 'D', 0.22, o);
    });
  }
  // the Dubai tram coming down the line: two notes on its horn, a short and a long
  tramHorn() { this.fx((t) => { this.tramHornAt(t, 0.36); this.tramHornAt(t + 0.5, 0.75); }); }
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

// Paris: a musette accordion and gypsy-jazz guitar meet French house. A café opening (la pompe, the upright bass, the
// accordion's tune in D harmonic minor over Dm6 - Gm6 - Bb7 - A7), then four on the floor under filtered, pumping chords
// that open up into the drop, a funky octave bass, celesta sparkles, and the violin taking up the tune.
const PA_ROOT = [38, 43, 46, 45];
const PA_CH = [[62, 65, 69, 71], [55, 58, 62, 64], [58, 62, 65, 68], [57, 61, 64, 67]];
const PA_SC = [62, 64, 65, 67, 69, 70, 73, 74, 76, 77, 79, 81];   // D E F G A Bb C# D E F G A
const PA_A = [[0, 4, 2], [2, 7, 2], [4, 9, 4], [8, 8, 2], [10, 7, 2], [12, 6, 2], [14, 7, 2], [16, 5, 4], [20, 7, 2], [22, 10, 6], [28, 9, 2], [30, 8, 2]];
const PA_B = [[0, 9, 3], [3, 7, 1], [4, 5, 2], [6, 7, 2], [8, 9, 4], [12, 10, 4], [16, 8, 2], [18, 6, 2], [20, 5, 2], [22, 4, 4], [26, 6, 2], [28, 8, 4]];
const PA_BASS = { 0: [0, 2], 3: [12, 1], 6: [0, 1], 8: [0, 2], 10: [7, 1], 11: [12, 1], 14: [0, 2] };

// Hong Kong: an eighties Cantopop night drive. A yangqin rippling over the electric piano opens each cycle, then a city-pop
// groove (gated snare, sixteenth hats, a slapped octave bass, Rhodes on the off-beats) under Fmaj7 - E7 - Am7 - Gm7 C7;
// the erhu sings the tune, synth brass answers in the chorus, the yangqin takes it up an octave in the last section, and
// a run on the wood block and a little gong turn the cycle.
const HK_ROOT = [41, 40, 45, 43];
const HK_CH = [[53, 57, 60, 64], [52, 56, 59, 62], [55, 57, 60, 64], [53, 55, 58, 62]];
const HK_C7 = [52, 55, 58, 60];
const HK_ARP = [0, 1, 2, 3, 2, 1, 2, 3];
const HK_BASS = { 0: [0, 2], 3: [12, 1], 4: [0, 1], 6: [7, 1], 8: [0, 2], 10: [12, 1], 11: [10, 1], 14: [7, 2] };
const HK_A = [[0, 69, 3], [3, 72, 1], [4, 76, 4], [8, 74, 2], [10, 72, 2], [12, 69, 4], [16, 71, 3], [19, 68, 1], [20, 71, 2], [22, 74, 2], [24, 76, 6], [30, 74, 2]];
const HK_B = [[0, 76, 3], [3, 79, 1], [4, 81, 4], [8, 79, 2], [10, 76, 2], [12, 74, 4], [16, 74, 2], [18, 72, 2], [20, 70, 2], [22, 72, 2], [24, 67, 4], [28, 64, 4]];

// Taipei: a temple festival rave (台式電音), the music the Electric-Techno Neon Gods dance to. Each cycle opens with the suona
// blaring a fanfare over the beiguan drum and cymbals; firecrackers go off into the drop (four on the floor, a rolling
// off-beat bass, claps) where the suona takes the tune; the drums and gongs have a break to themselves; then the last drop
// with the supersaws, and firecrackers again to turn the cycle. D minor: Dm - B♭ - C - Am.
const TP_ROOT = [38, 34, 36, 33];
const TP_CH = [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 60, 64]];
const TP_FAN = [[[0, 74, 8], [8, 77, 4], [12, 79, 4]], [[0, 81, 12], [12, 79, 4]], [[0, 77, 8], [8, 74, 8]], [[0, 72, 4], [4, 74, 4]]];
const TP_A = [[0, 74, 3], [3, 77, 1], [4, 79, 2], [6, 77, 2], [8, 74, 4], [12, 72, 2], [14, 69, 2], [16, 67, 2], [18, 69, 2], [20, 74, 4], [24, 72, 3], [27, 69, 1], [28, 67, 4]];
const TP_B = [[0, 79, 3], [3, 81, 1], [4, 84, 2], [6, 81, 2], [8, 79, 4], [12, 77, 2], [14, 79, 2], [16, 81, 4], [20, 79, 2], [22, 77, 2], [24, 74, 6], [30, 72, 2]];
const TP_GU = [1, 0, 0.5, 0, 1, 0, 0.5, 0.5, 1, 0, 0.5, 0, 1, 0.5, 0.7, 0.9];   // the beiguan drum through a bar, its accents

// Istanbul: an oriental-electro tune in Hicaz on D (D Eb F# G A Bb C), its augmented second the city's own sound. The
// darbuka plays the maqsum (DÜM tek - tek DÜM - tek -) with a kick under its düms, the bass the 3-3-2 of Turkish pop, the
// bağlama a riff with its drone string between; the ney sings, the kanun ripples, the zils ring; 16-bar cycle (the ney
// alone -> the groove -> the ney's tune over everything -> a break of claps in the karşılama's 2-2-2-3, the drum rolling
// into the top).
const IST_ROOT = [38, 39, 36, 38];
const IST_CH = [[62, 66, 69], [63, 67, 70], [60, 63, 67], [62, 66, 69]];
const DARB = { 0: 'D', 2: 'T', 4: 'k', 6: 'T', 8: 'D', 10: 'k', 12: 'T', 14: 'k', 15: 'k' };
const SAZ_A = [[0, 62], [2, 63], [3, 66], [4, 67], [6, 69], [8, 67], [9, 66], [10, 63], [12, 66], [14, 62], [16, 63], [18, 67], [20, 70], [22, 69], [24, 67], [26, 66], [28, 63], [30, 62]];
const SAZ_B = [[0, 72], [2, 70], [4, 69], [5, 70], [6, 69], [8, 67], [10, 63], [12, 67], [14, 66], [16, 67], [17, 66], [18, 63], [20, 62], [24, 57], [26, 62], [28, 66], [30, 69]];
const NEY_A = [[0, 74, 6], [6, 75, 2], [8, 78, 4], [12, 79, 4], [16, 81, 6], [22, 79, 2], [24, 78, 4], [28, 75, 4]];
const NEY_B = [[0, 79, 4], [4, 78, 2], [6, 75, 2], [8, 74, 6], [14, 72, 2], [16, 70, 4], [20, 69, 2], [22, 70, 2], [24, 69, 8]];
const NEY_IN = [[0, 69, 12], [12, 70, 4], [16, 69, 8], [24, 66, 4], [28, 63, 4], [32, 62, 16], [48, 66, 6], [54, 67, 2], [56, 69, 8]];   // a taksim over four bars
const IST_BASS = { 0: 0, 3: 0, 6: 7, 8: 0, 11: 0, 14: 7 };
// Moscow: a Russian folk dance turned electronic, 132 BPM, A minor (Am - Dm - E7 - Am). The church bells ring in the
// cycle, the basses hold a chord and the balalaika plays the tune in tremolo; then the dance: a kick on every beat and
// the bass on the off-beats, the spoons clacking sixteenths, the balalaika's arpeggios and the bayan's chords; the bayan
// takes the tune over everything; the last section is the kazachok, the balalaika racing in sixteenths, the shouts of
// the dancers, a snare roll back to the bells.
const MSK_ROOT = [33, 38, 40, 33];
const MSK_CH = [[57, 60, 64], [62, 65, 69], [56, 59, 62, 64], [57, 60, 64]];
const MSK_A = [[0, 76, 4], [4, 74, 2], [6, 72, 2], [8, 71, 4], [12, 69, 4], [16, 72, 4], [20, 74, 2], [22, 76, 2], [24, 77, 6], [30, 76, 2]];
const MSK_B = [[0, 76, 4], [4, 77, 2], [6, 76, 2], [8, 74, 4], [12, 71, 2], [14, 68, 2], [16, 69, 8], [24, 64, 4], [28, 69, 4]];
const MSK_IN = [[0, 69, 16], [16, 72, 8], [24, 71, 8], [32, 69, 12], [44, 64, 4], [48, 68, 8], [56, 69, 8]];   // the tune slowed to half, over four bars
// San Francisco: the Summer of Love's psychedelic rock with the Mission's Latin percussion in it, 112 BPM, E Dorian
// (Em7 - A7 - Cmaj7 - B7). The fog first: foghorns far out on the bay, a combo organ's slow chords, a surf guitar's
// tremolo arpeggios, a cable car's bell counting the band in; then the groove: rock drums and the tambourine, congas,
// the bass rocking between root and fifth, the organ on the off-beats, the guitar's figure; the fuzz guitar takes the
// tune over it; the last four bars are the bell-ringers' break, the cable car's bell over the congas and the claps, a
// snare roll back into the fog.
const SF_ROOT = [40, 45, 36, 35];
const SF_CH = [[52, 55, 59, 62], [57, 61, 64, 67], [48, 52, 55, 59], [47, 51, 54, 57]];
const SF_ARP = [0, 1, 2, 3, 2, 1, 2, 3];
const SF_A = [[0, 76, 4], [4, 74, 2], [6, 71, 2], [8, 74, 3], [11, 76, 1], [12, 79, 4], [16, 78, 6], [22, 76, 2], [24, 74, 4], [28, 71, 4]];
const SF_B = [[0, 71, 2], [2, 74, 2], [4, 76, 4], [8, 79, 2], [10, 81, 2], [12, 83, 6], [18, 81, 2], [20, 79, 4], [24, 76, 6], [30, 74, 2]];
const SF_CONGA = { 0: 'bass', 3: 'tone', 6: 'slap', 7: 'tone', 10: 'tone', 11: 'slap', 14: 'tone', 15: 'tone' };
const SF_BELL = [0, 2, 3, 6, 8, 9, 10, 12, 14];   // the bell-ringer's figure through a bar
// Los Angeles: a sunset cruise down the boulevard. A minor ii-V-I-IV in E flat on the electric piano, the synth bass
// sliding under it, a boom-bap beat with claps and snaps; the whistle lead, the talk box answering it (all our own tune)
const LA_ROOT = [41, 46, 39, 44];
const LA_CH = [[56, 60, 63, 67], [56, 60, 62, 67], [55, 58, 62, 65], [56, 60, 63, 67]];
const LA_BASS = [[0, 0, 3], [3, 12, 1], [6, 0, 2], [10, 7, 2], [12, 10, 2], [14, 12, 2]];   // [step, interval over the root, length]
const LA_A = [[0, 84, 6], [6, 82, 2], [8, 80, 4], [12, 79, 4], [16, 82, 3], [19, 84, 1], [20, 86, 6], [28, 84, 4]];
const LA_B = [[0, 87, 8], [8, 86, 2], [10, 84, 2], [12, 82, 4], [16, 79, 6], [22, 80, 2], [24, 82, 8]];
const LA_TALK = [[0, 72, 2], [2, 75, 2], [4, 77, 4], [8, 75, 2], [10, 72, 5], [16, 70, 2], [18, 72, 2], [20, 75, 6], [28, 72, 4]];
// Dubai: Gulf pop (khaleeji) gone trap, 100 BPM with a lazy shuffle, in maqam Bayati on D (D E½♭ F G A B♭ C: the second
// degree a quarter tone flat, MIDI 63.5 / 75.5). The oud alone first, a taqsim over the drone, the kanun rippling in; then
// the khaleeji groove: the tabl's boom, the darbuka, the row of men clapping off the beat, the bass, the oud's riff; the
// drop under the 808 kick and the trap hats, the kanun taking the tune; the ney sings it over the groove with the zils;
// the last half bar is the claps alone, the darbuka rolling up into the top. Dm - Gm - C - Dm.
const DXB_ROOT = [38, 43, 36, 38];
const DXB_CH = [[62, 65, 69], [62, 67, 70], [60, 64, 67], [62, 65, 69]];
const DXB_TAQSIM = [[0, 62, 4], [4, 63.5, 2], [6, 65, 2], [8, 67, 6], [14, 65, 2], [16, 63.5, 4], [20, 62, 4], [24, 69, 8], [32, 70, 4], [36, 69, 2], [38, 67, 2], [40, 65, 4], [44, 63.5, 4], [48, 62, 12], [60, 57, 4]];   // over four bars
const DXB_RIFF = [[0, 62, 2], [2, 63.5, 1], [3, 65, 1], [4, 67, 2], [6, 65, 1], [7, 63.5, 1], [8, 62, 3], [11, 60, 1], [12, 62, 2], [14, 65, 2], [16, 67, 2], [18, 69, 1], [19, 70, 1], [20, 69, 2], [22, 67, 2], [24, 65, 2], [26, 63.5, 2], [28, 62, 4]];
const DXB_A = [[0, 74, 2], [2, 74, 1], [3, 75.5, 1], [4, 77, 2], [6, 75.5, 2], [8, 74, 3], [11, 72, 1], [12, 74, 4], [16, 77, 2], [18, 79, 1], [19, 77, 1], [20, 75.5, 2], [22, 74, 2], [24, 72, 2], [26, 70, 2], [28, 69, 4]];
const DXB_B = [[0, 69, 2], [2, 70, 2], [4, 72, 2], [6, 74, 2], [8, 75.5, 3], [11, 74, 1], [12, 72, 4], [16, 74, 2], [18, 72, 1], [19, 70, 1], [20, 69, 4], [24, 67, 2], [26, 69, 2], [28, 62, 4]];
const DXB_CLAP = [3, 6, 10, 11, 14];   // the claps' figure through a bar, off the beat
const DXB_DARB = { 0: 'D', 4: 'T', 6: 'k', 9: 'k', 12: 'T', 14: 'k', 15: 'k' };
const DXB_TABL = [0, 7, 8];
const DXB_BASS = [[0, 0, 3], [3, 0, 1], [7, 0, 2], [8, 7, 3], [12, 12, 2], [14, 10, 2]];   // [step, interval over the root, length]
const SONGS = {
  dubai: {
    bpm: 100, swing: 0.1,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, ch = DXB_CH[c], r = DXB_ROOT[c], brk = B === 15 && s >= 8, off = (c % 2) * 16;
      // the taqsim: the oud alone over a drone, its long notes trembling under the risha; the darbuka and the kanun join
      if (sec === 0) {
        const n = (B % 4) * 16 + s;
        for (const [st, m, len] of DXB_TAQSIM) if (st === n) e.oud(t, m, dt * len * 0.95, 0.085, { trem: len >= 4 });
        if (s === 0) { e.pad(t, [50, 57], dt * 16, 0.024); if (B === 0) e.zil(t, 0.05); }
        if (B >= 1 && (s === 0 || s === 8)) e.darbuka(t, 'D', 0.18);
        if (B >= 2 && s % 2 === 0) e.kanun(t, ch[(s / 2) % 3] + 12, dt * 3, 0.026);
      }
      // the khaleeji groove: the tabl, the darbuka, the claps off the beat, the bass; the oud's riff (an octave up in the drop)
      if (sec >= 1 && !brk) {
        if (DXB_TABL.includes(s)) e.tabl(t, s === 0 ? 0.34 : 0.26);
        const k = DXB_DARB[s];
        if (k) e.darbuka(t, k, k === 'D' ? 0.2 : k === 'T' ? 0.16 : 0.08);
        if (DXB_CLAP.includes(s)) e.khaleejiClap(t, sec === 2 ? 0.1 : 0.12);
        for (const [st, iv, len] of DXB_BASS) if (st === s) e.sub(t, r + iv, dt * len * 0.95, sec === 2 ? 0.38 : 0.3);
        if (s === 0) e.pad(t, ch, dt * 16, sec === 2 ? 0.012 : 0.018);
        if (sec !== 3) for (const [st, m, len] of DXB_RIFF) if (st === s + off) e.oud(t, sec === 2 ? m + 12 : m, dt * len * 0.9, 0.075);
      }
      // the drop: the 808's kick and the trap hats with their rolls, the kanun singing the tune
      if (sec === 2 && !brk) {
        if (s === 0 || s === 10 || (s === 7 && c % 2)) e.kick(t, 0.85);
        e.hat(t, s % 2 ? 0.02 : 0.045);
        if ((s === 6 || s === 14) && c % 2) { e.hat(t + dt / 3, 0.035); e.hat(t + (2 * dt) / 3, 0.035); }
        for (const [st, m, len] of c < 2 ? DXB_A : DXB_B) if (st === s + off) e.kanun(t, m, dt * len * 0.9, 0.05);
      }
      // the ney sings the tune over the groove, the kanun's arpeggios under it, the zils
      if (sec === 3 && !brk) {
        for (const [st, m, len] of c < 2 ? DXB_A : DXB_B) if (st === s + off) e.ney(t, m, dt * len * 0.95, 0.075);
        if (s % 2 === 0) e.kanun(t, ch[[0, 1, 2, 1][(s / 2) % 4]] + 12, dt * 2.5, 0.028);
        if (s === 6 || s === 14) e.zil(t, 0.04);
        e.hat(t, s % 4 === 2 ? 0.035 : 0.012);
      }
      // the turn: the claps alone, the darbuka rolling up into the top of the cycle
      if (brk) {
        if (s % 2 === 0 || s === 15) e.khaleejiClap(t, 0.13);
        e.darbuka(t, s % 2 ? 'k' : 'T', 0.06 + (s - 8) * 0.025);
        if (s === 15) e.zil(t, 0.06);
      }
    },
  },
  la: {
    bpm: 94, swing: 0.14, gain: 1.24,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, ch = LA_CH[c], r = LA_ROOT[c], roll = B === 15 && s >= 8, off = (c % 2) * 16;
      // the record going round: the crackle, the electric piano's chords, a Red Car's whistle far off, the snaps coming in
      if (sec === 0) {
        if (s === 0) { e.crackle(t, dt * 16, 0.02); e.rhodes(t, ch, dt * 15, 0.045); }
        if (B === 0 && s === 0) e.airHorn(t, dt * 6, 0.02, e.music);
        if (B >= 2 && (s === 4 || s === 12)) e.snap(t, 0.09);
        if (B === 3 && s >= 12) e.moog(t, r, dt * 1, 0.12);
      }
      // the groove: the beat, the bass sliding between the roots, the piano on the off-beats
      if (sec >= 1 && !roll) {
        if (s === 0 || s === 7 || s === 10) e.kick(t, 0.66);
        if (s === 4 || s === 12) { e.snare(t, 0.2); e.clap(t, 0.12); }
        if (s === 4 || s === 12 || s === 15) e.snap(t, 0.05);
        e.hat(t, s % 4 === 2 ? 0.05 : s % 2 ? 0.016 : 0.03, s === 14);
        for (const [st, iv, len] of LA_BASS) if (st === s) e.moog(t, r + iv, dt * len * 0.95, 0.17, st === 14 ? r + iv - 5 : st === 0 ? LA_ROOT[(c + 3) % 4] + 12 : null);
        if (s === 2 || s === 10) e.rhodes(t, ch, dt * 3, 0.03);
        if (sec >= 2 && s % 4 === 2) e.shaker(t, 0.03);
      }
      // the whistle sings the tune, the piano holding the chord under it
      if (sec === 2 && !roll) {
        const tune = c < 2 ? LA_A : LA_B;
        tune.forEach(([st, m, len], i) => { if (st === s + off) e.whistle(t, m, dt * len * 0.95, 0.042, i ? tune[i - 1][1] : null); });
        if (s === 0) e.rhodes(t, ch, dt * 12, 0.022);
      }
      // the talk box answers, and the whistle comes back over it to end the round
      if (sec === 3 && !roll) {
        if (B < 14) { for (const [st, m, len] of LA_TALK) if (st === s + off) e.talkbox(t, m, dt * len * 0.95, 0.034); }
        else for (const [st, m, len] of LA_A) if (st === s + off) e.whistle(t, m, dt * len * 0.95, 0.034);
      }
      if (roll) { e.snare(t, 0.05 + (s - 8) * 0.022); if (s % 2 === 0) e.moog(t, r + 12 - (s - 8), dt * 2, 0.12); if (s === 15) e.whistle(t, 91, dt * 2, 0.03, 84); }
    },
  },
  sf: {
    bpm: 112, swing: 0.08, gain: 1.22,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, ch = SF_CH[c], r = SF_ROOT[c], roll = B === 15 && s >= 8, off = (c % 2) * 16;
      // the fog: foghorns out on the bay, the organ's chords swelling, the surf guitar's tremolo arpeggios, the bell
      if (sec === 0) {
        if ((B === 0 || B === 2) && s === 0) e.foghornAt(t, dt * 20, B === 0 ? 0.05 : 0.035, e.music);
        if (s === 0) e.organ(t, ch, dt * 15, 0.018);
        if (B >= 1 && s % 2 === 0) e.twang(t, ch[SF_ARP[(s / 2) % 8]] + 12, dt * 3, 0.05);
        if (B === 3 && (s === 12 || s === 14)) e.cableBellAt(t, 0.08, e.music);
        if (B >= 2 && s % 4 === 0) e.tambourine(t, 0.02);
      }
      // the groove
      if (sec >= 1 && !roll) {
        if (s === 0 || s === 6 || s === 8) e.kick(t, 0.62);
        if (s === 4 || s === 12) { e.snare(t, 0.22); e.tambourine(t, 0.05); }
        else if (s % 2 === 0) e.tambourine(t, 0.018);
        const k = SF_CONGA[s]; if (k) e.djembe(t, k, k === 'bass' ? 0.26 : 0.18);
        if (s % 2 === 0) e.bass(t, r + [0, 7, 12, 7][(s / 2) % 4], dt * 1.7, 0.2, 'sawtooth', 600);
        if (s % 4 === 2) e.organ(t, ch, dt * 1.2, 0.02);
        if (sec !== 2 && s % 2 === 0) e.twang(t, ch[SF_ARP[(s / 2) % 8]] + 12, dt * 2, sec === 3 ? 0.025 : 0.04);
        e.hat(t, s % 2 ? 0.02 : 0.045);
      }
      // the tune on the fuzz guitar, the organ holding the chord under it
      if (sec === 2 && !roll) {
        for (const [st, m, len] of c < 2 ? SF_A : SF_B) if (st === s + off) e.fuzz(t, m, dt * len * 0.95, 0.032, len >= 4 ? 1 : 0);
        if (s === 0) e.pad(t, ch, dt * 16, 0.012);
      }
      // the bell-ringers' break: the cable car's bell over the congas and the claps
      if (sec === 3 && !roll) {
        if (SF_BELL.includes(s)) e.cableBellAt(t, s === 0 || s === 8 ? 0.07 : 0.045, e.music);
        if (s === 4 || s === 12) e.clap(t, 0.12);
      }
      if (roll) { e.snare(t, 0.05 + (s - 8) * 0.025); if (s === 15) e.cableBellAt(t, 0.07, e.music); }
    },
  },
  msk: {
    bpm: 132, swing: 0,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, ch = MSK_CH[c], r = MSK_ROOT[c], roll = B === 15 && s >= 8, off = (c % 2) * 16;
      // the bells, the basses' chord, the balalaika's tremolo
      if (sec === 0) {
        const n = (B % 4) * 16 + s;
        if (B === 0 && s === 0) { e.bell(t, 45, 3.2, 0.12); e.bell(t + dt * 2, 69, 1.2, 0.05); e.bell(t + dt * 3, 72, 1.2, 0.04); }
        if (s === 0 && B % 2 === 0) e.bassChoir(t, [45, 52, 57], dt * 32, 0.05);
        if (s === 0) e.pad(t, ch, dt * 16, 0.016);
        for (const [st, m, len] of MSK_IN) if (st === n) e.tremolo(t, m, len * 2, dt / 2, 0.07);
        if ((B === 2 && (s === 0 || s === 8)) || (B === 3 && s % 4 === 0)) e.kick(t, 0.45);   // the dance gathering itself
        if (s % 8 === 4 && B >= 1) e.bell(t, [81, 84, 79, 81][B], 0.8, 0.025);
      }
      // the dance: four on the floor, the off-beat bass, the spoons, the balalaika's arpeggios, the bayan's stabs
      if (sec >= 1 && !roll) {
        if (s % 4 === 0) e.kick(t, sec === 3 ? 0.75 : 0.65);
        if (s % 4 === 2) e.sub(t, r + 12, dt * 1.6, 0.32);
        if (s === 4 || s === 12) e.clap(t, sec === 1 ? 0.1 : 0.13);
        e.spoons(t, s % 2 === 0 ? 0.07 : 0.035);
        if (sec !== 3) { if (s % 2 === 0) e.balalaika(t, ch[[0, 1, 2, 1, 0, 2, 1, 2][(s / 2) % 8]] + 12, dt * 1.6, 0.05); if (s % 4 === 2) e.bayan(t, ch, dt * 1.2, 0.022); }
        if (s === 0) e.pad(t, ch, dt * 16, 0.012);
      }
      // the tune: the bayan over everything, the balalaika's tremolo a sixth under it, the basses swelling
      if (sec === 2 && !roll) {
        for (const [st, m, len] of c < 2 ? MSK_A : MSK_B) if (st === s + off) { e.bayan(t, m, dt * len * 0.95, 0.04); e.tremolo(t, m - 9, len * 2, dt / 2, 0.022); }
        if (s === 0 && c % 2 === 0) e.bassChoir(t, [ch[0] - 12, ch[2] - 12], dt * 32, 0.014);
        e.hat(t, s % 4 === 2 ? 0.04 : 0.015);
      }
      // the kazachok: the balalaika racing, the shouts
      if (sec === 3 && !roll) {
        e.balalaika(t, [ch[0] + 12, ch[2] + 12, ch[1] + 12, ch[2] + 12][s % 4] + (s >= 8 ? 12 : 0), dt * 1.2, 0.045);
        if (s % 8 === 0) e.bayan(t, ch.map((m) => m + 12), dt * 3, 0.02);
        if ((B === 13 && s === 12) || (B === 14 && s === 12)) e.hey(t, 0.09);
        e.hat(t, s % 2 ? 0.02 : 0.05);
      }
      if (roll) { e.snare(t, 0.06 + (s - 8) * 0.025); if (s === 15) e.hey(t, 0.1); }
    },
  },
  ist: {
    bpm: 120, swing: 0,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, ch = IST_CH[c], r = IST_ROOT[c], roll = B === 15 && s >= 8, off = (c % 2) * 16;
      // the ney alone over a drone, the drum keeping time softly, the kanun joining
      if (sec === 0) {
        const n = (B % 4) * 16 + s;
        for (const [st, m, len] of NEY_IN) if (st === n) e.ney(t, m, dt * len * 0.95, 0.1);
        if (s === 0) { e.pad(t, [50, 57], dt * 16, 0.026); if (B === 0) e.zil(t, 0.05); }
        if (s === 0 || s === 8) e.darbuka(t, 'D', 0.22);
        if (s === 12 || (s === 14 && B > 1)) e.darbuka(t, 'T', 0.13);
        if (B >= 2 && s % 2 === 0) e.kanun(t, ch[(s / 2) % 3] + (s >= 8 ? 24 : 12), dt * 3, 0.03);
      }
      // the groove: the maqsum, the kick under the düms, the 3-3-2 bass, the bağlama's riff and its drone string
      if (sec >= 1 && !roll) {
        const k = DARB[s];
        if (k) e.darbuka(t, k, k === 'D' ? 0.24 : k === 'T' ? 0.2 : 0.1);
        if (s === 0 || s === 8) e.kick(t, sec === 3 ? 0.4 : 0.6);
        if (IST_BASS[s] !== undefined) e.sub(t, r + IST_BASS[s], dt * 2.4, 0.34);
        if (s === 0 && sec !== 2) e.pad(t, ch, dt * 16, 0.02);
        if (sec === 1) { e.hat(t, s % 4 === 2 ? 0.04 : 0.015); if (s === 12) e.clap(t, 0.1); }
        for (const [st, m] of c < 2 ? SAZ_A : SAZ_B) if (st === s + off) e.saz(t, sec === 3 ? m - 12 : m, dt * 1.6, 0.08);
        if (s % 4 === 1) e.saz(t, 50, dt, 0.026);
      }
      // the tune: the ney doubled by a reedy lead, the kanun's arpeggios, zils, claps and hats
      if (sec === 2 && !roll) {
        for (const [st, m, len] of c < 2 ? NEY_A : NEY_B) if (st === s + off) { e.ney(t, m, dt * len * 0.95, 0.075); e.lead(t, m, dt * len * 0.9, 0.018, 'square', 2200); }
        if (s % 2 === 0) e.kanun(t, ch[[0, 1, 2, 1][(s / 2) % 4]] + 12, dt * 2.5, 0.032);
        if (s === 6 || s === 14) e.zil(t, 0.045);
        if (s === 4 || s === 12) e.clap(t, 0.13);
        e.hat(t, s % 4 === 2 ? 0.05 : 0.02);
        if (s === 0) e.pad(t, ch, dt * 16, 0.015);
      }
      // the break: claps in 2-2-2-3 over the drum, the ney's tune low
      if (sec === 3 && !roll) {
        if (s === 0 || s === 4 || s === 8 || s === 12 || s === 14) e.clap(t, 0.09);
        if (c >= 2) for (const [st, m, len] of NEY_B) if (st === s + off) e.ney(t, m - 12, dt * len * 0.95, 0.08);
      }
      if (roll) { e.darbuka(t, s % 2 ? 'k' : 'T', 0.08 + (s - 8) * 0.028); if (s === 8 || s === 15) e.zil(t, 0.06); }
    },
  },
  taipei: {
    bpm: 128, swing: 0,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, ch = TP_CH[c], r = TP_ROOT[c];
      const fill = (B === 3 || B === 15) && s >= 8;   // the build into a drop: a snare roll and a string of firecrackers
      // the fanfare: the suona over the beiguan drum and the cymbals, a pad, the kick creeping in
      if (sec === 0) {
        if (s === 0) { e.pad(t, ch, dt * 16, 0.024); e.nao(t, 0.12, 0.6); if (B === 0) e.daluo(t, 0.22); }
        for (const [st, n, len] of TP_FAN[c]) if (st === s) e.suona(t, n, dt * len * 0.96, 0.05, 2);
        if (TP_GU[s] && !fill) e.tonggu(t, 0.22 * TP_GU[s]);
        if (B >= 2 && s % 4 === 0 && !fill) e.kick(t, 0.35 + B * 0.12);
        if (s === 6 || s === 14) e.xiaoluo(t, 0.08);
      }
      // the drops: four on the floor, claps, the rolling off-beat bass, the suona singing the tune (the supersaws join last)
      if ((sec === 1 || sec === 3) && !fill) {
        if (s % 4 === 0) e.kick(t, 0.85);
        if (s === 4 || s === 12) e.clap(t, 0.2);
        e.hat(t, s % 4 === 2 ? 0.08 : 0.03, s % 4 === 2);
        if (s % 4 === 2) e.bass(t, r + 12, dt * 1.6, 0.2, 'sawtooth', 900);
        if (s % 4 === 3) e.bass(t, r + 24, dt * 0.8, 0.09, 'sawtooth', 1200);
        if (s === 0) e.pad(t, ch, dt * 16, 0.016);
        if (s === 0 && c === 0) e.nao(t, 0.1, 0.5);
        if (sec === 3 && s % 4 === 2) e.supersaw(t, ch, dt * 1.5, 0.022);
        const off = (c % 2) * 16;
        for (const [st, n, len] of c < 2 ? TP_A : TP_B) if (st === s + off) { e.suona(t, n, dt * len * 0.92, sec === 3 ? 0.045 : 0.05, 1.5); if (sec === 3) e.lead(t, n + 12, dt * len * 0.9, 0.022, 'square', 2800); }
      }
      // the break: drums, gongs and cymbals to themselves, the kick on the half beat, the suona answering low
      if (sec === 2) {
        if (s === 0 || s === 8) e.kick(t, 0.7);
        if (TP_GU[s]) e.tonggu(t, 0.3 * TP_GU[s]);
        if (s === 0) { e.nao(t, 0.12, 0.5); e.pad(t, ch, dt * 16, 0.022); e.bass(t, r, dt * 14, 0.16, 'triangle', 500); }
        if (s === 4 || s === 12) e.xiaoluo(t, 0.1);
        if (s === 8 && c % 2) e.daluo(t, 0.18);
        const off = (c % 2) * 16;
        if (c >= 2) for (const [st, n, len] of TP_A) if (st === s + off) e.suona(t, n - 12, dt * len * 0.95, 0.045, 2);
      }
      if (fill) {
        e.snare(t, 0.08 + (s - 8) * 0.025);
        if (s === 8) e.firecrackers(t, dt * 8, 0.12);
        if (s === 14) e.nao(t, 0.12, 0.4);
      }
    },
  },
  hk: {
    bpm: 104, swing: 0.06,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, half = c === 3 && s >= 8;
      const ch = half ? HK_C7 : HK_CH[c], r = half ? 36 : HK_ROOT[c], brk = B === 15 && s >= 8;
      // the intro: the yangqin rippling over the electric piano and a pad
      if (sec === 0) {
        if (s % 2 === 0) e.yangqin(t, ch[HK_ARP[(s / 2) % 8]] + 12, dt * 3, 0.06);
        if (s === 0) { e.pad(t, HK_CH[c], dt * 16, 0.022); e.rhodes(t, HK_CH[c], dt * 12, 0.04); }
        if (s === 4 || s === 12) e.clap(t, 0.07);
      }
      // the city-pop groove: gated snare, sixteenth hats, a slapped octave bass, Rhodes on the off-beats
      if (sec >= 1 && !brk) {
        if (s === 0 || s === 6 || s === 10) e.kick(t, 0.85);
        if (s === 4 || s === 12) { e.snare(t, 0.32); e.clap(t, 0.16); }
        e.hat(t, s % 4 === 2 ? 0.07 : 0.035, s === 14);
        const bn = HK_BASS[s];
        if (bn) e.bass(t, r + bn[0], dt * bn[1] * 0.9, 0.24, 'sawtooth', 760);
        if (s === 2 || s === 7 || s === 10 || s === 15) e.rhodes(t, ch.map((m) => m + 12), dt * 1.6, 0.032);
      }
      if (sec >= 2 && s === 0) e.pad(t, HK_CH[c], dt * 16, 0.02);
      if (sec === 2 && !brk && (s === 3 || s === 11 || (s === 14 && c % 2))) e.stab(t, ch.map((m) => m + 12), 0.05, dt * 1.2, 'sawtooth');
      // the tune: the erhu in the groove, the lead synth over it in the chorus, the yangqin an octave up at the end
      if (sec >= 1 && !brk) {
        const off = (c % 2) * 16;
        for (const [st, n, len] of c < 2 ? HK_A : HK_B) if (st === s + off) {
          if (sec === 1) e.erhu(t, n, dt * len * 0.95, 0.055, 2);
          else if (sec === 2) { e.lead(t, n, dt * len * 0.9, 0.04, 'square', 2200); e.erhu(t, n - 12, dt * len * 0.95, 0.03); }
          else { e.yangqin(t, n + 12, dt * len, 0.07); e.erhu(t, n, dt * len * 0.95, 0.045, 2); }
        }
      }
      // the turn of the cycle: a run on the wood block, the little gong
      if (brk) { if (s % 2 === 0) e.wood(t, 0.14 + (s - 8) * 0.01, 1100 + (s - 8) * 60); if (s === 14) e.xiaoluo(t, 0.12); }
    },
  },
  paris: {
    bpm: 124, swing: 0.1,
    step(e, s, bar, t, dt) {
      const B = bar % 16, sec = Math.floor(B / 4), c = bar % 4, r = PA_ROOT[c], ch = PA_CH[c];
      const brk = B === 15 && s >= 8;
      // the café: la pompe (the bass on one and three, chopped chords on two and four with their ghost upstrokes), brushes
      if (sec === 0) {
        if (s === 0 || s === 8) e.upright(t, s ? r + 7 : r, dt * 3.5, 0.3);
        if (s === 4 || s === 12) e.pompe(t, ch, 0.05);
        if (s === 3 || s === 11) e.pompe(t, ch, 0.02, 0.06);
        e.shaker(t, s % 4 === 0 ? 0.045 : 0.025);
      }
      // the house groove: four on the floor, claps, open hats on the off-beats, the octave bass, the filtered chords
      if (sec >= 1 && !brk) {
        if (s % 4 === 0) e.kick(t, sec === 1 ? 0.7 : 0.9);
        if (s === 4 || s === 12) e.clap(t, sec === 1 ? 0.16 : 0.24);
        if (s % 4 === 2) e.hat(t, 0.07, true);
        if (s % 2 === 1) e.hat(t, 0.03);
        const bn = PA_BASS[s];
        if (bn) e.bass(t, r + bn[0], dt * bn[1] * 0.9, 0.26, 'sawtooth', 520);
        if (s % 4 === 0) {
          const cut = sec === 1 ? 320 * Math.pow(5, ((B - 4) * 16 + s) / 64) : 2200 + 500 * Math.sin(bar * 0.9);
          e.filterChord(t, ch, dt * 3.6, cut, sec === 1 ? 0.03 : 0.036);
        }
        if (sec >= 2 && s % 4 === 2) e.celesta(t, ch[(s / 2 + bar) % 4] + 12, 0.5, 0.03);
        if (sec === 3 && (s === 4 || s === 12)) e.pompe(t, ch, 0.03);
      }
      // the tune: the accordion opens it and plays the drop, the violin takes it up in the last section
      if (sec !== 1 && !brk) {
        const off = (c % 2) * 16;
        for (const [st, n, len] of c < 2 ? PA_A : PA_B) if (st === s + off) {
          if (sec === 3) e.violin(t, PA_SC[n], dt * len * 0.95, 0.05);
          else e.accordion(t, PA_SC[n], dt * len * 0.92, sec === 0 ? 0.045 : 0.04);
        }
      }
      if (sec === 1 && s === 0) e.accordion(t, ch, dt * 15, 0.02);   // the accordion holding the harmony under the build
      // the turn of the cycle: a chromatic run up the accordion, F# to C#, back to the tonic
      if (brk) e.accordion(t, 66 + (s - 8), dt * 0.9, 0.035);
    },
  },
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
