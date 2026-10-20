// Runner characters, the security guard + dog chasers, and gear (jetpack, shield, magnet aura).
import { THREE, std, basic, hdr, curve, CURVE_GLSL, curveUniforms, damp } from './core.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const CHARACTERS = [
  { id: 'jay', name: '阿杰', en: 'JAY', price: 0, desc: '街头涂鸦少年，反戴棒球帽', style: 'cap',
    skin: '#d9a07a', top: '#ff3b5c', pants: '#25345e', shoes: '#f4f4f8', sole: '#00e5ff', hat: '#1f6fff', hair: '#2a1a12', accent: '#00e5ff', pack: '#ffb020', trail: '#00e5ff' },
  { id: 'mia', name: '米娅', en: 'MIA', price: 300, desc: '滑板女孩，粉色马尾', style: 'ponytail',
    skin: '#f0c4a4', top: '#14c7a5', pants: '#3a2a5c', shoes: '#ff5fa2', sole: '#ff5fa2', hat: '#ff7ac6', hair: '#ff7ac6', accent: '#ffe66d', pack: '#7a5cff', trail: '#ff5fa2' },
  { id: 'robo', name: '零号', en: 'UNIT-0', price: 800, desc: '原型机器人，荧光面罩', style: 'robot',
    skin: '#9aa6bd', top: '#c9d2e3', pants: '#58627a', shoes: '#2b3142', sole: '#39ff88', hat: '#c9d2e3', hair: '#39ff88', accent: '#39ff88', pack: '#58627a', trail: '#39ff88' },
  { id: 'panda', name: '滚滚', en: 'GUNGUN', price: 1500, desc: '来自西湖边的熊猫', style: 'panda',
    skin: '#f7f7f2', top: '#f7f7f2', pants: '#1b1b1f', shoes: '#1b1b1f', sole: '#ffd166', hat: '#1b1b1f', hair: '#1b1b1f', accent: '#ffd166', pack: '#2fbf71', trail: '#ffd166' },
  { id: 'fuku', name: '福猫', en: 'FUKU', price: 2000, desc: '浅草来的招财猫，戴着金铃铛', style: 'neko',
    skin: '#fbf7ee', top: '#fbf7ee', pants: '#fbf7ee', shoes: '#f4a6b8', sole: '#ffd166', hat: '#e8862a', hair: '#2b2b2b', accent: '#e8253f', pack: '#e8253f', trail: '#ffd166' },
  { id: 'tuer', name: '兔儿爷', en: "TU'ERYE", price: 2500, desc: '老北京中秋的兔儿爷，金盔红袍，背插靠旗', style: 'rabbit',
    skin: '#fbf6ee', top: '#d7262e', pants: '#2f7a4a', shoes: '#1b1b1f', sole: '#ffd166', hat: '#f2c230', hair: '#f4a6b8', accent: '#ffd166', pack: '#2f6fd0', trail: '#ffd166' },
  { id: 'liberty', name: '自由女神', en: 'LIBERTY', price: 3000, desc: '从自由岛跑出来的自由女神，高举火炬', style: 'liberty',
    skin: '#a0dcc2', top: '#78c0a2', pants: '#6cb096', shoes: '#5a9a82', sole: '#ffd166', hat: '#8ccfb4', hair: '#6cb096', accent: '#ffc94d', pack: '#78c0a2', trail: '#ffc94d' },
  { id: 'koala', name: '考拉', en: 'KOALA', price: 3500, desc: '从桉树上溜下来的考拉，手里攥着一片桉叶', style: 'koala',
    skin: '#a4a4ac', top: '#a4a4ac', pants: '#94949c', shoes: '#6a6a72', sole: '#ffd166', hat: '#f4f2ee', hair: '#1e1e22', accent: '#7ab86a', pack: '#ecebe6', trail: '#7ab86a' },
  { id: 'guardsman', name: '皇家卫兵', en: 'GUARDSMAN', price: 4000, desc: '白金汉宫门前站岗的皇家卫兵，红上衣、白腰带，头戴高高的黑熊皮帽', style: 'guardsman',
    skin: '#f0c8a8', top: '#c8102e', pants: '#15171f', shoes: '#0c0c10', sole: '#ffd166', hat: '#101012', hair: '#3a2a1a', accent: '#ffd166', pack: '#f4f4f0', trail: '#ff3b4a' },
  { id: 'naxi', name: '纳西阿妹', en: 'NAXI', price: 4500, desc: '背着七星羊皮披肩的纳西姑娘，七颗星和日月绣在肩背上，「披星戴月」', style: 'naxi',
    skin: '#e8b890', top: '#2a54b0', pants: '#1a1e3a', shoes: '#3a2a20', sole: '#ffd166', hat: '#1a2a6a', hair: '#1a1210', accent: '#ffd166', pack: '#f2ece0', trail: '#1fc8e0' },
];
// triangular pennant for the opera general's back flags (靠旗)
const FLAG = new THREE.BufferGeometry();
FLAG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, -0.34, 0, 0.26, -0.17, 0], 3));
FLAG.computeVertexNormals();
const EAR = new THREE.ConeGeometry(0.5, 1, 4);

const RB = new RoundedBoxGeometry(1, 1, 1, 2, 0.22);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const SPH = new THREE.SphereGeometry(0.5, 16, 12);
const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 14);
const CONE = new THREE.ConeGeometry(0.5, 1, 16, 1, true);

const mc = new Map();
export function M(hex, rough = 0.55, metal = 0.05) {
  const k = `${hex}|${rough}|${metal}`;
  if (!mc.has(k)) mc.set(k, std({ color: hex, roughness: rough, metalness: metal }));
  return mc.get(k);
}
export function E(hex, k = 2.5) {
  const key = `E${hex}|${k}`;
  if (!mc.has(key)) mc.set(key, basic({ color: hdr(hex, k) }));
  return mc.get(key);
}
function part(geo, mat, x, y, z, sx, sy, sz, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz);
  parent.add(m);
  return m;
}
const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

export function buildCharacter(d) {
  const robot = d.style === 'robot', panda = d.style === 'panda', guard = d.style === 'guard', neko = d.style === 'neko', rabbit = d.style === 'rabbit', liberty = d.style === 'liberty', koala = d.style === 'koala', guardsman = d.style === 'guardsman', naxi = d.style === 'naxi';
  const root = new THREE.Group();
  const body = grp(root, 0, 0.6, 0);         // roll / lean pivot
  const inner = grp(body, 0, -0.6, 0);
  const hips = grp(inner, 0, 0.98, 0);
  const metal = robot ? 0.75 : 0.05, rough = robot ? 0.3 : 0.6;
  const mTop = M(d.top, rough, metal), mPants = M(d.pants, rough, metal), mSkin = M(d.skin, robot ? 0.3 : 0.7, metal);
  const wide = guard ? 1.25 : 1;

  const leg = (side) => {
    const thigh = grp(hips, side * 0.15 * wide, 0, 0);
    part(RB, mPants, 0, -0.22, 0, 0.21, 0.5, 0.24, thigh);
    const knee = grp(thigh, 0, -0.45, 0);
    part(RB, mPants, 0, -0.2, 0, 0.19, 0.44, 0.21, knee);
    const foot = grp(knee, 0, -0.44, 0);
    part(RB, M(d.shoes, 0.5), 0, -0.02, -0.07, 0.24, 0.16, 0.4, foot);
    part(BOX, E(d.sole, 1.8), 0, -0.1, -0.07, 0.25, 0.035, 0.41, foot);
    if (guardsman) for (const [g, y, h] of [[thigh, -0.22, 0.48], [knee, -0.2, 0.42]]) part(BOX, M('#c8102e', 0.6), side * 0.106, y, 0, 0.012, h, 0.05, g);   // the red trouser stripe
    return { thigh, knee, foot };
  };
  const L = leg(-1), R = leg(1);

  const torso = grp(hips, 0, 0, 0);
  part(RB, mTop, 0, 0.32, guard ? 0.03 : 0, 0.52 * wide, 0.62, guard ? 0.4 : 0.3, torso);
  if (!panda && !guard && !neko && !rabbit && !liberty && !koala && !guardsman && !naxi) part(BOX, E(d.accent, 2.6), 0, 0.38, -0.152, 0.53, 0.05, 0.012, torso);
  if (robot) {
    part(SPH, E(d.accent, 3), 0, 0.42, -0.16, 0.14, 0.14, 0.05, torso);
  }
  if (guard) {
    part(BOX, E('#ffd166', 2.2), 0.12, 0.5, -0.205, 0.08, 0.1, 0.01, torso); // badge
    part(BOX, M('#0b0f1c'), 0, 0.06, 0, 0.67, 0.08, 0.42, torso);            // belt
  } else if (neko) {
    part(RB, M(d.accent, 0.5), 0, 0.62, 0, 0.4, 0.08, 0.34, torso);              // red collar
    part(SPH, E('#ffd166', 2.2), 0, 0.55, -0.18, 0.11, 0.11, 0.11, torso);       // golden bell
    part(SPH, M(d.hat, 0.7), 0.14, 0.28, 0.13, 0.26, 0.22, 0.12, torso);         // calico patches
    part(SPH, M(d.hair, 0.7), -0.13, 0.42, -0.13, 0.2, 0.17, 0.08, torso);
  } else if (guardsman) {
    const gold = M(d.accent, 0.3, 0.7);
    part(BOX, M(d.pack, 0.6), 0, 0.06, 0, 0.56, 0.09, 0.34, torso);                   // white buff belt
    part(BOX, gold, 0, 0.06, -0.173, 0.1, 0.07, 0.012, torso);                        // brass buckle
    for (let k = 0; k < 5; k++) part(SPH, gold, 0, 0.17 + k * 0.095, -0.156, 0.035, 0.035, 0.02, torso);   // tunic buttons
    part(BOX, M('#141a3a', 0.6), 0, 0.6, 0, 0.42, 0.09, 0.32, torso);                 // dark blue collar edged in gold
    part(BOX, gold, 0, 0.6, -0.163, 0.36, 0.025, 0.01, torso);
    for (const sx of [-1, 1]) part(BOX, M('#141a3a', 0.6), sx * 0.2, 0.62, 0, 0.12, 0.03, 0.2, torso);   // shoulder straps
  } else if (naxi) {
    part(RB, M('#7a1a2a', 0.7), 0, 0.36, 0, 0.56, 0.5, 0.34, torso);                    // maroon vest over the blue jacket
    part(BOX, M('#16182a', 0.8), 0, 0.02, -0.15, 0.46, 0.34, 0.04, torso);             // the pleated apron
    part(BOX, M('#141214', 0.9), 0, 0.3, 0.19, 0.5, 0.56, 0.05, torso);                // the cape on her back, black outside
    part(CYL, M(d.pack, 0.9), 0, 0.6, 0.17, 0.13, 0.54, 0.13, torso).rotation.z = Math.PI / 2;   // its white sheepskin roll
    for (const sx of [-1, 1]) part(BOX, M(d.pack, 0.8), 0, 0.36, -0.178, 0.05, 0.56, 0.012, torso).rotation.z = sx * 0.62;   // the cape's white straps crossed over her chest
    for (const sx of [-1, 1]) part(SPH, M(sx < 0 ? '#ffd166' : '#f2ece0', 0.5), sx * 0.15, 0.46, 0.22, 0.12, 0.12, 0.03, torso);   // sun and moon at the shoulders
    for (let k = 0; k < 7; k++) {                                                      // the seven stars along the hem, with their tassels
      const x = -0.21 + k * 0.07;
      part(SPH, M(['#ffd166', '#2a8ad8', '#e83a3a', '#3ab86a'][k % 4], 0.5), x, 0.1, 0.22, 0.055, 0.055, 0.02, torso);
      part(BOX, M('#f2ece0', 0.8), x, 0.02, 0.22, 0.012, 0.1, 0.01, torso);
    }
  } else if (koala) {
    part(RB, M(d.pack, 0.8), 0, 0.32, -0.12, 0.36, 0.44, 0.1, torso);                 // pale chest fur
  } else if (liberty) {
    part(BOX, M(d.hat, 0.6), 0, 0.42, -0.02, 0.6, 0.12, 0.34, torso).rotation.z = 0.5;   // the robe's sash
    part(CONE, M(d.top, 0.6), 0, -0.05, 0, 0.66, 0.5, 0.48, torso);                    // robe flaring over the hips
  } else if (rabbit) {
    const gold = M(d.hat, 0.35, 0.6);
    part(RB, gold, 0, 0.6, 0, 0.5, 0.08, 0.34, torso);                                // armour collar
    part(CYL, gold, 0, 0.38, -0.16, 0.16, 0.02, 0.16, torso).rotation.x = Math.PI / 2;  // breast mirror (护心镜)
    part(BOX, gold, 0, 0.06, 0, 0.56, 0.08, 0.34, torso);                             // belt
    part(RB, M('#f2f2ea', 0.6), 0, 0.2, -0.13, 0.36, 0.22, 0.06, torso);              // white apron panel
    const flags = grp(torso, 0, 0.5, 0.17);                                            // four back flags fanned out
    const fm = [d.pack, '#2fa84f'].map((c) => std({ color: c, roughness: 0.6, side: THREE.DoubleSide }));
    [-0.62, -0.22, 0.22, 0.62].forEach((a, i) => {
      const f = grp(flags, 0, 0, 0); f.rotation.z = a; f.rotation.x = 0.25;
      part(CYL, gold, 0, 0.38, 0, 0.022, 0.76, 0.022, f);
      part(FLAG, fm[i % 2], 0, 0.74, 0, a < 0 ? -1 : 1, 1, 1, f);
    });
  } else {
    part(RB, M(d.pack, 0.6), 0, 0.34, 0.22, 0.38, 0.44, 0.17, torso);
    part(BOX, E(d.accent, 2), 0, 0.42, 0.31, 0.3, 0.035, 0.01, torso);
  }

  const head = grp(torso, 0, 0.7, 0);
  if (robot) {
    part(RB, M(d.top, 0.25, 0.8), 0, 0.18, 0, 0.36, 0.34, 0.33, head);
    part(BOX, E(d.accent, 3.2), 0, 0.2, -0.166, 0.3, 0.09, 0.01, head);
    part(CYL, M('#58627a', 0.4, 0.8), 0.12, 0.42, 0, 0.025, 0.18, 0.025, head);
    part(SPH, E(d.accent, 3.5), 0.12, 0.52, 0, 0.07, 0.07, 0.07, head);
  } else {
    part(RB, mSkin, 0, 0.17, 0, 0.32, 0.34, 0.3, head);
    const eye = M(panda ? '#111' : '#1a1a22', 0.4);
    if (panda) {
      part(SPH, M('#1b1b1f'), -0.08, 0.2, -0.13, 0.11, 0.12, 0.06, head);
      part(SPH, M('#1b1b1f'), 0.08, 0.2, -0.13, 0.11, 0.12, 0.06, head);
      part(SPH, M('#fafafa'), -0.08, 0.21, -0.158, 0.04, 0.04, 0.02, head);
      part(SPH, M('#fafafa'), 0.08, 0.21, -0.158, 0.04, 0.04, 0.02, head);
      part(SPH, M('#1b1b1f'), 0, 0.12, -0.155, 0.06, 0.04, 0.04, head);
      part(SPH, M('#1b1b1f'), -0.14, 0.37, 0, 0.12, 0.12, 0.08, head);
      part(SPH, M('#1b1b1f'), 0.14, 0.37, 0, 0.12, 0.12, 0.08, head);
    } else {
      part(BOX, eye, -0.07, 0.2, -0.151, 0.04, 0.06, 0.01, head);
      part(BOX, eye, 0.07, 0.2, -0.151, 0.04, 0.06, 0.01, head);
    }
  }
  let tail = null;
  if (d.style === 'cap') {
    part(RB, M(d.hair, 0.8), 0, 0.27, 0.02, 0.34, 0.16, 0.32, head);
    part(RB, M(d.hat, 0.5), 0, 0.36, 0.01, 0.35, 0.13, 0.33, head);
    part(BOX, M(d.hat, 0.5), 0, 0.31, 0.21, 0.28, 0.035, 0.18, head);
    part(BOX, E(d.accent, 2.5), 0, 0.36, -0.166, 0.08, 0.06, 0.01, head);
  } else if (d.style === 'ponytail') {
    part(RB, M(d.hair, 0.7), 0, 0.3, 0.03, 0.35, 0.18, 0.34, head);
    part(BOX, E(d.accent, 2.4), 0, 0.27, 0, 0.36, 0.04, 0.35, head);
    tail = grp(head, 0, 0.3, 0.17);
    part(RB, M(d.hair, 0.7), 0, -0.14, 0.04, 0.13, 0.32, 0.13, tail);
  } else if (guard) {
    part(RB, M('#0f1830', 0.5), 0, 0.36, 0, 0.36, 0.12, 0.35, head);
    part(BOX, M('#0b0f1c', 0.4), 0, 0.3, -0.2, 0.3, 0.03, 0.14, head);
    part(BOX, E('#ffd166', 2), 0, 0.37, -0.178, 0.07, 0.06, 0.01, head);
    part(BOX, M('#3a2618'), 0, 0.1, -0.152, 0.16, 0.035, 0.01, head); // moustache
  } else if (neko) {
    for (const sx of [-1, 1]) {
      part(EAR, M(d.top, 0.7), sx * 0.1, 0.39, 0.01, 0.13, 0.17, 0.1, head);
      part(EAR, M('#f4a6b8', 0.7), sx * 0.1, 0.38, -0.02, 0.07, 0.11, 0.05, head);
      for (const dy of [0.0, 0.035]) part(BOX, M('#6a6a6a'), sx * 0.2, 0.12 + dy, -0.15, 0.14, 0.008, 0.008, head);
    }
    part(SPH, M(d.hat, 0.7), 0.1, 0.27, 0.0, 0.17, 0.12, 0.2, head);
    part(SPH, M(d.hair, 0.7), -0.1, 0.14, 0.06, 0.13, 0.12, 0.2, head);
    part(SPH, M('#f48aa4', 0.6), 0, 0.14, -0.155, 0.05, 0.035, 0.03, head);
    tail = grp(torso, 0, 0.12, 0.16);
    part(RB, M(d.top, 0.7), 0, 0.2, 0.06, 0.09, 0.42, 0.09, tail);
    part(RB, M(d.hat, 0.7), 0, 0.43, 0.08, 0.1, 0.12, 0.1, tail);
  } else if (naxi) {
    part(RB, M(d.hair, 0.7), 0, 0.27, 0.03, 0.34, 0.16, 0.33, head);                  // black hair under the cap
    part(CYL, M(d.hat, 0.7), 0, 0.37, 0, 0.36, 0.1, 0.34, head);                      // the dark blue cap
    part(CYL, M(d.accent, 0.5), 0, 0.33, 0, 0.37, 0.025, 0.35, head);
    part(RB, M(d.hair, 0.7), 0, 0.02, 0.18, 0.07, 0.36, 0.07, head);                   // a braid down her back
    for (const sx of [-1, 1]) part(SPH, M('#ff8f8a', 0.7), sx * 0.11, 0.12, -0.14, 0.06, 0.04, 0.02, head);   // rosy cheeks
  } else if (guardsman) {
    part(SPH, M(d.hat, 0.95), 0, 0.56, 0.01, 0.42, 0.64, 0.4, head);                 // the tall bearskin
    part(SPH, M('#1a1a1e', 0.95), 0.03, 0.74, -0.03, 0.34, 0.36, 0.34, head);
    part(BOX, M(d.accent, 0.3, 0.7), 0, 0.03, -0.13, 0.32, 0.025, 0.06, head);        // brass chin strap
    part(SPH, M('#c8102e', 0.8), 0.2, 0.5, 0.02, 0.07, 0.24, 0.07, head);             // red plume on the right
    part(BOX, M('#3a2618'), 0, 0.1, -0.152, 0.12, 0.02, 0.01, head);                  // a stern mouth
  } else if (koala) {
    for (const sx of [-1, 1]) {                                                       // big round fluffy ears
      part(SPH, mSkin, sx * 0.19, 0.33, 0.02, 0.22, 0.22, 0.12, head);
      part(SPH, M(d.hat, 0.9), sx * 0.19, 0.33, -0.03, 0.15, 0.15, 0.06, head);
    }
    part(SPH, M(d.hair, 0.3), 0, 0.14, -0.16, 0.11, 0.14, 0.08, head);               // the big black nose
    part(SPH, M(d.pack, 0.8), 0, 0.06, -0.14, 0.16, 0.08, 0.06, head);                // pale chin
  } else if (liberty) {
    part(RB, M(d.hair, 0.6), 0, 0.3, 0.04, 0.34, 0.14, 0.32, head);                  // hair under the crown
    part(CYL, M(d.hat, 0.5), 0, 0.37, 0, 0.36, 0.06, 0.34, head);                    // crown band
    for (let k = 0; k < 7; k++) {                                                     // seven rays
      const a = (k - 3) * 0.42, ray = grp(head, Math.sin(a) * 0.16, 0.4, -Math.cos(a) * 0.1 + 0.02);
      ray.rotation.set(-0.35, 0, -a * 0.9);
      part(CONE, M(d.hat, 0.5), 0, 0.09, 0, 0.05, 0.2, 0.05, ray);
    }
  } else if (rabbit) {
    for (const sx of [-1, 1]) {                                                       // long ears through the helmet
      const ear = grp(head, sx * 0.08, 0.42, 0.02); ear.rotation.z = -sx * 0.16;
      part(SPH, mSkin, 0, 0.17, 0, 0.1, 0.44, 0.07, ear);
      part(SPH, M(d.hair, 0.7), 0, 0.17, -0.025, 0.055, 0.34, 0.03, ear);
      part(SPH, M('#ff8fa8', 0.7), sx * 0.1, 0.12, -0.13, 0.07, 0.05, 0.03, head);   // blush
    }
    const gold = M(d.hat, 0.35, 0.6);
    part(RB, gold, 0, 0.33, 0.01, 0.36, 0.12, 0.34, head);                            // golden helmet
    part(BOX, gold, 0, 0.28, -0.17, 0.3, 0.05, 0.03, head);
    part(SPH, M('#e8253f', 0.6), 0, 0.42, -0.08, 0.1, 0.1, 0.1, head);               // red pompom
    part(BOX, M('#d7262e', 0.5), 0, 0.1, -0.152, 0.06, 0.03, 0.01, head);             // painted mouth
    tail = grp(hips, 0, -0.02, 0.17);
    part(SPH, mSkin, 0, 0, 0.04, 0.16, 0.16, 0.16, tail);                             // cotton tail
  }

  const arm = (side) => {
    const sh = grp(torso, side * 0.34 * wide, 0.54, 0);
    part(RB, mTop, 0, -0.15, 0, 0.15, 0.34, 0.15, sh);
    const el = grp(sh, 0, -0.3, 0);
    part(RB, panda ? M('#1b1b1f') : (robot ? mTop : mTop), 0, -0.13, 0, 0.13, 0.3, 0.13, el);
    part(SPH, panda ? M('#1b1b1f') : mSkin, 0, -0.31, 0, 0.13, 0.13, 0.13, el);
    return { sh, el };
  };
  const AL = arm(-1), AR = arm(1);
  if (koala) part(SPH, M(d.accent, 0.6), 0.02, -0.38, -0.05, 0.08, 0.22, 0.03, AL.el);   // a eucalyptus leaf
  if (liberty) {   // the torch in her right hand, the tablet in her left
    part(CYL, M('#4f8472', 0.5), 0, -0.44, 0, 0.07, 0.24, 0.07, AR.el);
    part(CONE, M('#d9b24a', 0.4, 0.6), 0, -0.6, 0, 0.16, 0.1, 0.16, AR.el);
    part(SPH, E('#ff9a2a', 2.6), 0, -0.72, 0, 0.17, 0.26, 0.17, AR.el);
    part(SPH, E('#fff0b0', 3.4), 0, -0.68, 0, 0.09, 0.15, 0.09, AR.el);
    part(BOX, M('#7fb8a2', 0.6), 0.04, -0.36, -0.06, 0.06, 0.26, 0.18, AL.el);
  }
  if (panda) {
    AL.sh.children[0].material = M('#1b1b1f'); AR.sh.children[0].material = M('#1b1b1f');
  }
  return { root, body, inner, hips, torso, head, tail, L, R, AL, AR, def: d };
}

// Pose solver for the procedural rigs.
export class Animator {
  constructor(rig) {
    this.r = rig; this.ph = 0; this.t = 0; this.cur = {}; this.roll = 0;
  }
  update(dt, s) {
    const r = this.r; this.t += dt;
    const t = this.t;
    let P;
    switch (s.mode) {
      case 'run': case 'stumble': {
        this.ph += dt * (6 + s.speed * 0.42);
        const sp = Math.sin(this.ph);
        P = { tL: sp * 0.95, tR: -sp * 0.95, kL: -0.25 - Math.max(0, -Math.sin(this.ph + 0.7)) * 1.5, kR: -0.25 - Math.max(0, Math.sin(this.ph + 0.7)) * 1.5,
          aL: -sp * 0.9, aR: sp * 0.9, zL: -0.12, zR: 0.12, eL: 1.35, eR: 1.35, tx: -0.2, bob: Math.abs(Math.cos(this.ph)) * 0.07, hy: 0, tz: 0 };
        if (s.mode === 'stumble') { P.tz = Math.sin(t * 28) * 0.35; P.aL = -2.2; P.aR = -1.6; P.zL = -0.9; P.zR = 0.9; }
        else if (r.def.style === 'liberty') { P.aR = -2.75; P.eR = 0.2; P.zR = 0.15; }   // runs with the torch held high
        break;
      }
      case 'jump':
        P = { tL: 1.1, tR: 0.3, kL: -1.5, kR: -0.7, aL: -0.5, aR: -0.3, zL: -1.0, zR: 1.0, eL: 0.6, eR: 0.6, tx: -0.1, bob: 0, hy: 0, tz: 0 };
        break;
      case 'roll':
        P = { tL: 1.9, tR: 1.9, kL: -2.4, kR: -2.4, aL: 1.1, aR: 1.1, zL: -0.2, zR: 0.2, eL: 1.7, eR: 1.7, tx: 0.4, bob: 0, hy: 0, tz: 0 };
        break;
      case 'fly':
        P = { tL: 0.25, tR: -0.35, kL: -0.6, kR: -0.9, aL: 0.2 + Math.sin(t * 3) * 0.1, aR: -2.6, zL: -0.5, zR: 0.2, eL: 0.6, eR: 0.2, tx: -0.55, bob: Math.sin(t * 3) * 0.06, hy: 0, tz: Math.sin(t * 1.7) * 0.08 };
        break;
      case 'dead':
        P = { tL: 0.6, tR: 0.1, kL: -0.5, kR: -0.2, aL: -1.6, aR: -1.2, zL: -1.2, zR: 1.3, eL: 0.4, eR: 0.3, tx: 0.2, bob: 0, hy: 0.5, tz: 0 };
        break;
      case 'caught':
        P = { tL: 0, tR: 0, kL: -0.1, kR: -0.1, aL: -2.9, aR: -2.9, zL: -0.3, zR: 0.3, eL: 0.3, eR: 0.3, tx: 0.05, bob: Math.sin(t * 10) * 0.02, hy: 0, tz: 0 };
        break;
      default: { // idle
        const b = Math.sin(t * 2.2);
        P = { tL: 0.05, tR: -0.05, kL: -0.08, kR: -0.08, aL: b * 0.06, aR: -b * 0.06, zL: -0.16, zR: 0.16, eL: 0.3, eR: 0.3, tx: 0.03, bob: b * 0.015, hy: Math.sin(t * 0.7) * 0.45, tz: 0 };
        if (r.def.style === 'neko') { const w = Math.sin(t * 5); P.aL = -2.7 + w * 0.3; P.eL = 1.0 + w * 0.45; P.zL = -0.2; }   // beckoning paw
        if (r.def.style === 'liberty') { P.aR = -2.95; P.eR = 0.1; P.zR = 0.1; }   // torch raised
        if (r.def.style === 'guardsman') { P.aL = 0.02; P.aR = 0.02; P.eL = 0.12; P.eR = 0.12; P.zL = -0.06; P.zR = 0.06; P.hy = 0; P.bob = 0; }   // standing to attention
      }
    }
    const k = 1 - Math.exp(-dt * (s.mode === 'run' ? 30 : 16));
    const c = this.cur;
    for (const key in P) c[key] = c[key] === undefined ? P[key] : c[key] + (P[key] - c[key]) * k;
    r.L.thigh.rotation.x = c.tL; r.R.thigh.rotation.x = c.tR;
    r.L.knee.rotation.x = c.kL; r.R.knee.rotation.x = c.kR;
    r.L.foot.rotation.x = -c.kL * 0.35; r.R.foot.rotation.x = -c.kR * 0.35;
    r.AL.sh.rotation.x = c.aL; r.AR.sh.rotation.x = c.aR;
    r.AL.sh.rotation.z = c.zL; r.AR.sh.rotation.z = c.zR;
    r.AL.el.rotation.x = c.eL; r.AR.el.rotation.x = c.eR;
    r.torso.rotation.x = c.tx; r.torso.rotation.z = c.tz;
    r.head.rotation.y = c.hy;
    r.inner.position.y = -0.6 + c.bob;
    if (r.tail) r.tail.rotation.x = 0.35 + Math.sin(this.ph * 2) * 0.25;
    // roll / flips / lean on the pivot
    if (s.mode === 'roll') this.roll -= dt * 15;
    else if (s.flip !== undefined && s.flip > 0) this.roll = -s.flip * Math.PI * 2;
    else this.roll = damp(this.roll, Math.round(this.roll / (Math.PI * 2)) * Math.PI * 2, 14, dt);
    const dead = s.mode === 'dead';
    r.body.rotation.x = dead ? damp(r.body.rotation.x, 1.45, 8, dt) : this.roll;
    r.body.rotation.z = damp(r.body.rotation.z, -(s.lean || 0) * 0.32, 12, dt);
    r.body.rotation.y = damp(r.body.rotation.y, (s.lean || 0) * 0.25, 12, dt);
    r.body.position.y = dead ? damp(r.body.position.y, 0.32, 8, dt) : (s.mode === 'roll' ? 0.5 : 0.6);
  }
}

export function buildGuard() {
  const rig = buildCharacter({ style: 'guard', skin: '#d8a27e', top: '#1e2c52', pants: '#141d36', shoes: '#0b0d14', sole: '#ffd166', hat: '#0f1830', accent: '#ffd166' });
  // flashlight with a soft beam
  const fl = grp(rig.AR.el, 0, -0.32, -0.05);
  part(CYL, M('#222', 0.3, 0.8), 0, 0, -0.1, 0.07, 0.3, 0.07, fl).rotation.x = Math.PI / 2;
  part(SPH, E('#fff6c8', 4), 0, 0, -0.26, 0.09, 0.09, 0.03, fl);
  const beamMat = basic({ color: hdr('#fff3c0', 0.5), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const beam = part(CONE, beamMat, 0, 0, -2.3, 1.2, 4, 1.2, fl);
  beam.rotation.x = -Math.PI / 2;
  beam.visible = false;
  rig.beam = beam;
  return rig;
}

export function buildDog() {
  const root = new THREE.Group();
  const fur = M('#8a5a34', 0.8), dark = M('#3a2416', 0.8);
  const body = grp(root, 0, 0.62, 0);
  part(RB, fur, 0, 0, 0, 0.36, 0.34, 0.8, body);
  const head = grp(body, 0, 0.22, -0.48);
  part(RB, fur, 0, 0, 0, 0.3, 0.3, 0.34, head);
  part(RB, dark, 0, -0.05, -0.22, 0.18, 0.15, 0.2, head);
  part(BOX, dark, -0.11, 0.2, 0.05, 0.08, 0.16, 0.08, head);
  part(BOX, dark, 0.11, 0.2, 0.05, 0.08, 0.16, 0.08, head);
  part(BOX, E('#ff3355', 2), 0, -0.17, -0.12, 0.31, 0.05, 0.12, head); // collar
  const legs = [[-0.12, -0.28], [0.12, -0.28], [-0.12, 0.28], [0.12, 0.28]].map(([x, z]) => {
    const g = grp(body, x, -0.12, z);
    part(RB, fur, 0, -0.22, 0, 0.11, 0.42, 0.12, g);
    return g;
  });
  const tail = grp(body, 0, 0.12, 0.4);
  part(RB, fur, 0, 0.14, 0.06, 0.07, 0.3, 0.07, tail);
  let ph = 0;
  return {
    root,
    update(dt, speed) {
      ph += dt * (8 + speed * 0.5);
      const s = Math.sin(ph);
      legs[0].rotation.x = s * 0.9; legs[1].rotation.x = s * 0.7;
      legs[2].rotation.x = -s * 0.9; legs[3].rotation.x = -s * 0.7;
      body.position.y = 0.62 + Math.abs(Math.cos(ph)) * 0.08;
      body.rotation.x = Math.cos(ph) * 0.08;
      tail.rotation.x = -0.6 + Math.sin(ph * 2) * 0.4;
      head.rotation.x = Math.sin(ph) * 0.1;
    },
  };
}

export function buildJetpack() {
  const g = new THREE.Group();
  const tankM = M('#d7dbe6', 0.25, 0.85), red = M('#ff3b3b', 0.4, 0.3);
  for (const x of [-0.13, 0.13]) {
    part(CYL, tankM, x, 0.34, 0.3, 0.17, 0.5, 0.17, g);
    part(SPH, red, x, 0.6, 0.3, 0.17, 0.12, 0.17, g);
    part(CYL, M('#333', 0.4, 0.8), x, 0.05, 0.3, 0.12, 0.1, 0.12, g);
  }
  const flameMat = basic({ color: hdr('#ffae3b', 4), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const coreMat = basic({ color: hdr('#fff2c4', 5), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const flames = [];
  for (const x of [-0.13, 0.13]) {
    const f = part(new THREE.ConeGeometry(0.5, 1, 12), flameMat, x, -0.35, 0.3, 0.17, 0.7, 0.17, g);
    f.rotation.x = Math.PI;
    const c = part(new THREE.ConeGeometry(0.5, 1, 12), coreMat, x, -0.2, 0.3, 0.09, 0.4, 0.09, g);
    c.rotation.x = Math.PI;
    flames.push(f, c);
  }
  g.userData.flames = flames;
  return g;
}

export function buildShield() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, color: { value: hdr('#59d8ff', 1.6) }, uCurveY: curveUniforms.uCurveY, uCurveX: curveUniforms.uCurveX, fade: { value: 1 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uCurveY, uCurveX; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ vP = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); ${CURVE_GLSL}
        vN = normalize(normalMatrix * normal); vV = normalize(-mvPosition.xyz); gl_Position = projectionMatrix * mvPosition; }`,
    fragmentShader: `uniform float time, fade; uniform vec3 color; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.5);
        float hex = 0.5 + 0.5 * sin(vP.y * 18.0 - time * 4.0) * sin(atan(vP.z, vP.x) * 9.0);
        float a = (f * 0.9 + hex * 0.12 + 0.03) * fade;
        gl_FragColor = vec4(color * a, a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1.25, 28, 18), mat);
  m.position.y = 1.0;
  m.scale.y = 1.15;
  return m;
}

export function buildMagnetAura() {
  const g = new THREE.Group();
  const mats = [basic({ color: hdr('#ff3355', 3), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
    basic({ color: hdr('#3d8bff', 3), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })];
  for (let i = 0; i < 2; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.85 + i * 0.12, 0.025, 6, 48, Math.PI * 1.4), mats[i]);
    r.rotation.x = Math.PI / 2;
    r.position.y = 0.9 + i * 0.25;
    g.add(r);
  }
  return g;
}

export function setCurved(obj) {
  obj.traverse((o) => { if (o.material && !o.material.onBeforeCompile.toString().includes('uCurveY')) curve(o.material); });
}
