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
  { id: 'parisienne', name: '巴黎女孩', en: 'PARISIENNE', price: 5000, desc: '戴红色贝雷帽、穿海魂衫的巴黎女孩，系着红色小方巾，手里攥着一根刚出炉的法棍', style: 'paris',
    skin: '#f0cca8', top: '#f4f2ec', pants: '#1a2440', shoes: '#141414', sole: '#ff6aa8', hat: '#c8202c', hair: '#5a3220', accent: '#ff6aa8', pack: '#1a2a5a', trail: '#ff6aa8' },
  { id: 'lion', name: '醒狮', en: 'LION DANCER', price: 5500, desc: '舞南狮的香港少年，顶着红金狮头：额上一面镜子、一双大眼、白绒绒的狮毛和独角，身后披着狮被，跑起来狮口一张一合', style: 'lion',
    skin: '#e8c4a0', top: '#d8202a', pants: '#f2c230', shoes: '#1a1a1e', sole: '#ffd166', hat: '#d8202a', hair: '#f6f4ee', accent: '#ffd166', pack: '#d8202a', trail: '#ff3d7f' },
  { id: 'nezha', name: '电音三太子', en: 'NEON NEZHA', price: 6000, desc: '台湾庙会里跳电音舞的三太子：大大的娃娃头戴着墨镜、含着奶嘴，头顶两个发髻，金甲红肚兜，飘着混天绫，脚踩一对呼呼转的风火轮', style: 'nezha',
    skin: '#f8e0cc', top: '#f2b830', pants: '#c8202a', shoes: '#1a1a1e', sole: '#ff7a1a', hat: '#141414', hair: '#141414', accent: '#ffd166', pack: '#e8202a', trail: '#ff9a2a' },
  { id: 'dondurma', name: '冰淇淋小哥', en: 'DONDURMACI', price: 6500, desc: '伊斯坦布尔街头卖土耳其冰淇淋的小哥：头戴红色菲斯帽、留着八字胡，红马甲上绣着金线，手里那根长铁棒挑着一大团能拉丝的冰淇淋，最爱逗客人，边跑边甩', style: 'dondurma',
    skin: '#e0b08a', top: '#f6f2ea', pants: '#1e1e28', shoes: '#3a2418', sole: '#ffd166', hat: '#c8102e', hair: '#1e1410', accent: '#ffd166', pack: '#8a1428', trail: '#ff8ab8' },
  { id: 'swan', name: '小天鹅', en: 'BALLERINA', price: 7000, desc: '莫斯科大剧院的芭蕾少女，《天鹅湖》里的白天鹅：白色蓬蓬纱裙、缀着银光的胸衣、发髻上一圈白羽毛冠，脚穿粉色足尖鞋；站着时双臂像天鹅的翅膀一样轻轻起伏', style: 'swan',
    skin: '#f4dcc8', top: '#f6f6fa', pants: '#f2dce2', shoes: '#f4b8c4', sole: '#ffd6e0', hat: '#ffffff', hair: '#3a2418', accent: '#dfe8ff', pack: '#ffffff', trail: '#cfe0ff' },
  { id: 'hippie', name: '嬉皮少女', en: 'FLOWER CHILD', price: 7500, desc: '1967 年“爱之夏”海特街上的花童：长长的直发中分，戴着雏菊花环和圆形粉色墨镜，扎染 T 恤外面套着流苏麂皮背心，胸前挂着和平标志，穿一条喇叭裤和凉鞋；待机时举手比出 ✌，跟着音乐轻轻摇摆', style: 'hippie',
    skin: '#f4d8c0', top: '#ff7ab8', pants: '#5a7ab0', shoes: '#8a5a3a', sole: '#ffd166', hat: '#ffffff', hair: '#b8803a', accent: '#d8dce4', pack: '#a8703a', trail: '#ff8ad8' },
  { id: 'surfer', name: '冲浪少年', en: 'SURFER', price: 8000, desc: '在威尼斯海滩边长大的冲浪少年：头发被太阳晒褪成金色，墨镜推到头顶，敞开的夏威夷衬衫里套着白背心，脖子上一串贝壳项链，冲浪短裤配人字拖，背上斜挎一块冲浪板；待机时比出 shaka 手势（拇指和小指伸开），像踩在浪板上一样压低身子，左右晃着找平衡', style: 'surfer',
    skin: '#d49a6a', top: '#2ab4a8', pants: '#ff7a3a', shoes: '#ff5a3a', sole: '#ffd166', hat: '#1a1a22', hair: '#f2d27a', accent: '#f4f0e8', pack: '#f4f0e8', trail: '#3ad8ff' },
  { id: 'falconer', name: '猎鹰少年', en: 'FALCONER', price: 8500, desc: '在沙漠边长大的阿联酋少年：一身雪白的坎杜拉长袍，领口垂着一根流苏，白头巾垂到肩后、压着黑色双圈头箍，左臂的皮手套上站着一只戴皮头罩的游隼；跑起来猎鹰张开翅膀保持平衡，站着时它会扑扇一阵翅膀', style: 'falconer',
    skin: '#c8946a', top: '#f6f4ee', pants: '#f2f0ea', shoes: '#7a4a2a', sole: '#ffd166', hat: '#f8f6f0', hair: '#1a1410', accent: '#c8a050', pack: '#7a5232', trail: '#ffd27a' },
];
// triangular pennant for the opera general's back flags (靠旗)
const FLAG = new THREE.BufferGeometry();
FLAG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, -0.34, 0, 0.26, -0.17, 0], 3));
FLAG.computeVertexNormals();
const EAR = new THREE.ConeGeometry(0.5, 1, 4);
const TOR = new THREE.TorusGeometry(0.5, 0.12, 8, 28);
const CORD = new THREE.TorusGeometry(0.5, 0.06, 6, 28);

const RB = new RoundedBoxGeometry(1, 1, 1, 2, 0.22);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const SPH = new THREE.SphereGeometry(0.5, 16, 12);
const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 14);
const CONE = new THREE.ConeGeometry(0.5, 1, 16, 1, true);
const FEZ = new THREE.CylinderGeometry(0.42, 0.5, 1, 18);

// a tie-dyed shirt: bright bands swirling out from the middle, their edges bleeding
let tieDyeMat = null;
function tieDye() {
  if (tieDyeMat) return tieDyeMat;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), cols = ['#ff3d7f', '#ffd23d', '#39d8ff', '#7cff5a', '#b46bff', '#ff7a2a'];
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const dx = x - 64, dy = y - 64, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), k = Math.floor((r / 9 + a / 1.2 + 12) % cols.length);
    g.fillStyle = cols[(k + cols.length) % cols.length]; g.fillRect(x, y, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  tieDyeMat = std({ map: tex, roughness: 0.75 });
  return tieDyeMat;
}
// an aloha shirt: big hibiscus flowers and palm leaves on teal
let alohaMat = null;
function aloha() {
  if (alohaMat) return alohaMat;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#1ea8a0'; g.fillRect(0, 0, 128, 128);
  for (let k = 0; k < 12; k++) { g.fillStyle = k % 2 ? '#1a6a4a' : '#2a8a5a'; g.beginPath(); g.ellipse(Math.random() * 128, Math.random() * 128, 16, 5, Math.random() * 6, 0, Math.PI * 2); g.fill(); }
  for (let k = 0; k < 8; k++) {   // five round petals, the dark eye, the stamen
    const x = 8 + Math.random() * 112, y = 8 + Math.random() * 112, r = 7 + Math.random() * 5, col = ['#ff4a3a', '#ff8a2a', '#f4f0e8', '#ff5aa0'][k % 4];
    for (let p = 0; p < 5; p++) { const a = (p / 5) * Math.PI * 2; g.fillStyle = col; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#8a1a2a'; g.beginPath(); g.arc(x, y, r * 0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd23d'; g.fillRect(x, y - r * 0.9, 1.5, r * 0.8);
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  alohaMat = std({ map: tex, roughness: 0.7 });
  return alohaMat;
}
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
  const robot = d.style === 'robot', panda = d.style === 'panda', guard = d.style === 'guard', neko = d.style === 'neko', rabbit = d.style === 'rabbit', liberty = d.style === 'liberty', koala = d.style === 'koala', guardsman = d.style === 'guardsman', naxi = d.style === 'naxi', paris = d.style === 'paris', lion = d.style === 'lion', nezha = d.style === 'nezha', dondurma = d.style === 'dondurma', swan = d.style === 'swan', hippie = d.style === 'hippie', surfer = d.style === 'surfer', falconer = d.style === 'falconer';
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
  const spin = [];
  if (nezha) for (const F of [L, R]) {   // 風火輪: a wheel of fire under each foot
    const w = grp(F.foot, 0, -0.05, -0.07);
    part(TOR, E('#ff6a1a', 2.4), 0, 0, 0, 0.44, 0.44, 0.44, w).rotation.y = Math.PI / 2;
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, f = part(CONE, E(k % 2 ? '#ffd23d' : '#ff3a1a', 2.6), 0, Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0.07, 0.16, 0.07, w); f.rotation.x = a - Math.PI / 2; }
    spin.push(w);
  }

  const torso = grp(hips, 0, 0, 0);
  let tail = null;
  part(RB, mTop, 0, 0.32, guard ? 0.03 : 0, 0.52 * wide, 0.62, guard ? 0.4 : 0.3, torso);
  if (!panda && !guard && !neko && !rabbit && !liberty && !koala && !guardsman && !naxi && !paris && !lion && !nezha && !dondurma && !swan && !hippie && !surfer && !falconer) part(BOX, E(d.accent, 2.6), 0, 0.38, -0.152, 0.53, 0.05, 0.012, torso);
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
  } else if (paris) {
    for (let k = 0; k < 6; k++) part(BOX, M(d.pack, 0.6), 0, 0.08 + k * 0.1, 0, 0.535, 0.045, 0.315, torso);   // the marinière's navy stripes
    part(BOX, M(d.hat, 0.6), 0, 0.6, -0.01, 0.36, 0.08, 0.33, torso);                   // a red neckerchief
    part(BOX, M(d.hat, 0.6), 0.12, 0.52, -0.165, 0.08, 0.14, 0.03, torso).rotation.z = 0.35;
  } else if (lion) {
    const gold = M(d.accent, 0.35, 0.6), fur = M(d.hair, 0.95);
    part(BOX, gold, 0, 0.06, 0, 0.56, 0.1, 0.34, torso);                               // the gold sash
    part(BOX, gold, 0.16, -0.05, -0.17, 0.08, 0.22, 0.02, torso);
    part(BOX, M(d.pack, 0.7), 0, 0.28, 0.2, 0.62, 0.74, 0.04, torso);                  // the lion's body cloth down his back
    for (let k = 0; k < 9; k++) part(SPH, gold, -0.2 + (k % 3) * 0.2, 0.5 - Math.floor(k / 3) * 0.2, 0.225, 0.11, 0.09, 0.02, torso);   // its gold scales
    for (let k = 0; k < 6; k++) part(SPH, fur, -0.27 + k * 0.108, -0.1, 0.22, 0.12, 0.12, 0.08, torso);   // and the white fringe on its hem
  } else if (nezha) {
    const gold = M(d.accent, 0.3, 0.7);
    part(RB, M(d.pack, 0.6), 0, 0.34, -0.14, 0.4, 0.42, 0.06, torso);                  // the red belly apron
    part(BOX, gold, 0, 0.55, -0.172, 0.4, 0.04, 0.02, torso);
    part(SPH, gold, 0, 0.32, -0.18, 0.12, 0.12, 0.03, torso);                          // its gilded medallion
    for (const sx of [-1, 1]) part(SPH, gold, sx * 0.3, 0.56, 0, 0.24, 0.14, 0.32, torso);   // the armour's shoulder plates
    part(BOX, gold, 0, 0.06, 0, 0.56, 0.1, 0.34, torso);                               // the belt
    part(TOR, gold, 0, 0.34, 0, 0.84, 0.84, 0.7, torso).rotation.set(1.35, 0.15, 0.75);   // the Universe Ring slung across him like a bandolier
    tail = grp(torso, 0, 0.55, 0.18);                                                    // the Red Armillary Sash, streaming behind (the Animator flaps it)
    const sash = M(d.pack, 0.6);
    part(TOR, sash, 0, 0.1, 0.04, 0.9, 0.5, 0.5, tail).rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) { part(BOX, sash, sx * 0.24, -0.22, 0.16, 0.09, 0.52, 0.025, tail).rotation.set(-0.5, 0, sx * 0.22); part(BOX, sash, sx * 0.33, -0.58, 0.36, 0.08, 0.42, 0.025, tail).rotation.set(-0.95, 0, sx * 0.3); }
  } else if (dondurma) {
    const vest = M(d.pack, 0.6), gold = M(d.accent, 0.3, 0.7);
    for (const sx of [-1, 1]) {
      part(RB, vest, sx * 0.17, 0.36, -0.01, 0.2, 0.56, 0.33, torso);                   // the vest's fronts, open over the white shirt
      part(BOX, gold, sx * 0.075, 0.36, -0.168, 0.025, 0.54, 0.012, torso);              // their gold edging
      for (let k = 0; k < 3; k++) part(SPH, gold, sx * 0.17, 0.5 - k * 0.14, -0.172, 0.07, 0.05, 0.015, torso);   // the embroidered scrolls
    }
    part(RB, vest, 0, 0.36, 0.06, 0.54, 0.56, 0.2, torso);                                // its back
    part(BOX, M(d.hat, 0.6), 0, 0.07, 0, 0.56, 0.12, 0.34, torso);                        // the red sash
    part(BOX, gold, 0, 0.07, -0.172, 0.56, 0.03, 0.01, torso);
  } else if (falconer) {
    part(FEZ, mTop, 0, -0.1, 0, 0.64, 0.34, 0.44, torso);                            // the kandura flaring over the hips
    part(CYL, M('#ecebe4', 0.6), 0, 0.6, -0.02, 0.24, 0.05, 0.2, torso);              // its round collar
    part(CYL, M('#f2f0e8', 0.5), 0, 0.44, -0.158, 0.022, 0.24, 0.022, torso);          // the tarboosha: the tassel hanging from the neck
    part(SPH, M('#f2f0e8', 0.5), 0, 0.31, -0.16, 0.05, 0.07, 0.05, torso);
  } else if (swan) {
    const tulle = M(d.pack, 0.9), silver = M(d.accent, 0.25, 0.6);
    part(CYL, tulle, 0, 0.04, 0, 1.0, 0.07, 0.92, torso);                              // the tutu: layers of tulle standing out flat from the hips
    part(CYL, M('#f8eef2', 0.9), 0, 0.0, 0, 0.9, 0.06, 0.84, torso);
    part(CYL, M('#ffffff', 0.9), 0, 0.085, 0, 0.82, 0.05, 0.76, torso);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; part(SPH, tulle, Math.cos(a) * 0.47, 0.03, Math.sin(a) * 0.43, 0.14, 0.06, 0.14, torso); }   // its ruffled edge
    for (let k = 0; k < 9; k++) part(SPH, silver, -0.16 + (k % 3) * 0.16, 0.22 + Math.floor(k / 3) * 0.12, -0.155, 0.04, 0.04, 0.015, torso);   // the bodice's sequins
    part(BOX, silver, 0, 0.6, -0.01, 0.42, 0.05, 0.31, torso);
  } else if (hippie) {
    part(RB, tieDye(), 0, 0.32, 0, 0.535, 0.625, 0.31, torso);                          // the tie-dyed shirt
    const suede = M(d.pack, 0.85);
    for (const sx of [-1, 1]) {
      part(RB, suede, sx * 0.19, 0.36, -0.01, 0.16, 0.5, 0.33, torso);                 // the suede vest, open at the front
      for (let k = 0; k < 5; k++) part(BOX, suede, sx * (0.13 + k * 0.028), 0.07, -0.16, 0.014, 0.16, 0.012, torso);   // its fringe
    }
    part(RB, suede, 0, 0.36, 0.07, 0.54, 0.5, 0.18, torso);
    const silver = M(d.accent, 0.25, 0.75);
    part(TOR, silver, 0, 0.3, -0.162, 0.13, 0.13, 0.1, torso);                          // the peace sign on its thong
    part(BOX, silver, 0, 0.3, -0.166, 0.012, 0.11, 0.01, torso);
    for (const sx of [-1, 1]) part(BOX, silver, sx * 0.025, 0.27, -0.166, 0.01, 0.055, 0.01, torso).rotation.z = sx * 0.8;
    part(BOX, M('#3a2a1a', 0.8), 0, 0.46, -0.16, 0.008, 0.26, 0.006, torso).rotation.z = 0.0;
  } else if (surfer) {
    part(RB, aloha(), 0, 0.32, 0, 0.535, 0.625, 0.31, torso);                          // the aloha shirt, hanging open
    part(BOX, M('#f4f2ec', 0.7), 0, 0.3, -0.158, 0.17, 0.52, 0.012, torso);            // the white vest under it
    for (const sx of [-1, 1]) part(BOX, aloha(), sx * 0.11, 0.6, -0.15, 0.12, 0.05, 0.03, torso).rotation.z = sx * 0.5;   // its collar
    for (let k = 0; k < 11; k++) { const a = Math.PI * (0.15 + (0.7 * k) / 10); part(SPH, M('#f4ecdc', 0.4), Math.cos(a) * 0.14, 0.62 - Math.sin(a) * 0.1, -0.168, 0.035, 0.035, 0.035, torso); }   // a string of puka shells
    part(BOX, M('#2a2a30', 0.6), 0, 0.33, -0.166, 0.05, 0.72, 0.01, torso).rotation.z = 0.62;   // the board's strap across his chest
    const board = grp(torso, 0, 0.5, 0.42); board.rotation.z = 0.3;                      // the board slung on his back, its nose up past his shoulder (clear of the jetpack)
    part(SPH, M(d.pack, 0.35), 0, 0, 0, 0.42, 1.35, 0.07, board);
    part(BOX, M('#ff5a3a', 0.5), 0, 0, -0.004, 0.05, 1.22, 0.074, board);              // the stripe down it
    part(BOX, M('#1a6ab0', 0.5), 0, -0.56, 0.05, 0.012, 0.12, 0.1, board);              // the fin
    part(BOX, M('#2a2a30', 0.6), 0, 0.02, -0.12, 0.08, 0.08, 0.22, board);              // the strap's buckle against his back
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
  if (lion) {   // the southern lion's head worn over his own: red and gold, the mirror on the brow, big eyes, white fur, one horn
    const red = M(d.hat, 0.55), gold = M(d.accent, 0.35, 0.6), fur = M(d.hair, 0.95), dark = M('#141414', 0.4);
    part(RB, red, 0, 0.26, 0.02, 0.56, 0.44, 0.56, head);
    part(BOX, gold, 0, 0.45, -0.24, 0.5, 0.1, 0.1, head);
    const mirror = part(CYL, E('#dff0ff', 1.8), 0, 0.36, -0.275, 0.12, 0.02, 0.12, head); mirror.rotation.x = Math.PI / 2;   // the mirror that scares off evil
    part(CYL, gold, 0, 0.36, -0.27, 0.16, 0.02, 0.16, head).rotation.x = Math.PI / 2;
    part(SPH, M('#2fa84f', 0.4), 0, 0.58, -0.18, 0.09, 0.24, 0.09, head).rotation.x = -0.55;   // the horn
    for (const sx of [-1, 1]) {
      part(SPH, M('#ffffff', 0.3), sx * 0.13, 0.28, -0.25, 0.15, 0.15, 0.1, head);        // the big eyes, gold lids over them
      part(SPH, dark, sx * 0.13, 0.28, -0.3, 0.07, 0.08, 0.03, head);
      part(SPH, gold, sx * 0.13, 0.35, -0.25, 0.17, 0.07, 0.11, head);
      part(SPH, red, sx * 0.25, 0.48, 0.06, 0.1, 0.14, 0.08, head);                        // the ears
    }
    part(SPH, M('#ff6a8a', 0.5), 0, 0.17, -0.3, 0.12, 0.09, 0.08, head);                   // the nose
    for (let k = 0; k < 7; k++) part(SPH, fur, -0.27 + k * 0.09, 0.5, -0.27, 0.12, 0.1, 0.09, head);   // white fur along the brow
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) part(SPH, fur, sx * 0.3, 0.42 - k * 0.1, -0.2 + k * 0.06, 0.1, 0.11, 0.1, head);
    tail = grp(head, 0, 0.08, 0.12);   // the lower jaw, which snaps open and shut as he runs (the Animator swings tail.x in 0.1..0.6)
    const jaw = grp(tail); jaw.rotation.x = -0.7;
    part(RB, red, 0, -0.04, -0.2, 0.46, 0.1, 0.42, jaw);
    for (let k = 0; k < 5; k++) part(SPH, fur, -0.18 + k * 0.09, -0.11, -0.36, 0.11, 0.12, 0.09, jaw);   // the beard
    part(BOX, M('#f4f4ee', 0.4), 0, 0.02, -0.38, 0.32, 0.03, 0.03, jaw);
  } else if (nezha) {   // the big doll's head of the festival costume: porcelain face, sunglasses and a pacifier, two buns of black hair
    const dark = M('#0a0a0e', 0.15, 0.6), gold = M(d.accent, 0.3, 0.7), hair = M(d.hair, 0.7);
    part(SPH, mSkin, 0, 0.3, 0, 0.62, 0.6, 0.58, head);
    part(SPH, hair, 0, 0.42, 0.06, 0.64, 0.48, 0.6, head);                              // the hair over the crown and the back
    part(BOX, gold, 0, 0.46, -0.24, 0.42, 0.05, 0.08, head);                            // the gold band across the brow
    part(SPH, M('#e8202a', 0.4), 0, 0.4, -0.29, 0.05, 0.08, 0.02, head);                // the red mark between the brows
    for (const sx of [-1, 1]) {
      part(SPH, hair, sx * 0.17, 0.7, 0.02, 0.2, 0.2, 0.2, head);                       // the two buns
      part(CYL, M(d.pack, 0.6), sx * 0.17, 0.6, 0.02, 0.15, 0.06, 0.15, head);          // tied with red ribbon
      part(RB, dark, sx * 0.11, 0.3, -0.27, 0.17, 0.1, 0.05, head);                     // the sunglasses
      part(BOX, E('#8ad8ff', 1.4), sx * 0.13, 0.32, -0.296, 0.05, 0.02, 0.005, head);   // a glint on each lens
      part(SPH, M('#ff8a9a', 0.7), sx * 0.19, 0.18, -0.24, 0.1, 0.07, 0.04, head);      // rosy cheeks
    }
    part(BOX, dark, 0, 0.31, -0.28, 0.08, 0.025, 0.02, head);                           // the bridge of the glasses
    part(SPH, M('#5ac8ff', 0.4), 0, 0.12, -0.285, 0.12, 0.08, 0.03, head);              // the pacifier's shield
    part(TOR, M('#ff6aa8', 0.4), 0, 0.09, -0.31, 0.1, 0.1, 0.1, head);                  // and its ring
  } else if (robot) {
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
  } else if (paris) {
    part(RB, M(d.hair, 0.7), 0, 0.22, 0.03, 0.36, 0.3, 0.34, head);                    // a brown bob
    part(BOX, M(d.hair, 0.7), 0, 0.29, -0.155, 0.3, 0.07, 0.02, head);                 // the fringe
    part(CYL, M(d.hat, 0.85), 0.03, 0.37, 0, 0.42, 0.07, 0.4, head).rotation.z = -0.22;   // the beret, worn at a tilt
    part(CYL, M(d.hat, 0.85), 0.07, 0.42, 0, 0.03, 0.06, 0.03, head);
    part(BOX, M(d.hat, 0.5), 0, 0.09, -0.152, 0.07, 0.025, 0.01, head);               // red lips
  } else if (guardsman) {
    part(SPH, M(d.hat, 0.95), 0, 0.56, 0.01, 0.42, 0.64, 0.4, head);                 // the tall bearskin
    part(SPH, M('#1a1a1e', 0.95), 0.03, 0.74, -0.03, 0.34, 0.36, 0.34, head);
    part(BOX, M(d.accent, 0.3, 0.7), 0, 0.03, -0.13, 0.32, 0.025, 0.06, head);        // brass chin strap
    part(SPH, M('#c8102e', 0.8), 0.2, 0.5, 0.02, 0.07, 0.24, 0.07, head);             // red plume on the right
    part(BOX, M('#3a2618'), 0, 0.1, -0.152, 0.12, 0.02, 0.01, head);                  // a stern mouth
  } else if (dondurma) {
    part(RB, M(d.hair, 0.7), 0, 0.27, 0.04, 0.34, 0.12, 0.32, head);                  // black hair under the fez
    part(FEZ, M(d.hat, 0.7), 0, 0.42, 0.01, 0.3, 0.24, 0.3, head);                    // the fez
    part(CYL, M('#141414', 0.6), 0, 0.545, 0.01, 0.04, 0.02, 0.04, head);
    tail = grp(head, 0, 0.54, 0.01);                                                    // its black tassel, swinging as he runs
    part(CYL, M('#141414', 0.8), 0, -0.02, 0.09, 0.03, 0.2, 0.03, tail).rotation.x = 1.2;
    part(BOX, M(d.hair, 0.6), 0, 0.105, -0.155, 0.17, 0.045, 0.02, head);              // a big moustache
    for (const sx of [-1, 1]) part(BOX, M(d.hair, 0.6), sx * 0.075, 0.27, -0.152, 0.06, 0.018, 0.01, head);   // and eyebrows
  } else if (falconer) {
    const cloth = M(d.hat, 0.85), cord = M('#141414', 0.6);
    part(RB, cloth, 0, 0.305, 0.01, 0.37, 0.22, 0.35, head);                        // the ghutra over the crown
    part(BOX, cloth, 0, 0.32, -0.158, 0.35, 0.05, 0.02, head);                       // its edge across the brow
    for (const sx of [-1, 1]) part(BOX, cloth, sx * 0.178, 0.13, 0.02, 0.035, 0.36, 0.31, head);   // falling either side of the face
    part(BOX, cloth, 0, 0.06, 0.165, 0.38, 0.5, 0.04, head);                         // and down the back to the shoulders
    for (const y of [0.335, 0.38]) part(CORD, cord, 0, y, 0.01, 0.4, 0.4, 0.4, head).rotation.x = Math.PI / 2;   // the agal: two black cords round the crown
    for (const sx of [-1, 1]) part(BOX, M(d.hair, 0.6), sx * 0.07, 0.25, -0.152, 0.07, 0.016, 0.01, head);   // eyebrows
  } else if (swan) {
    part(RB, M(d.hair, 0.7), 0, 0.27, 0.03, 0.34, 0.16, 0.33, head);                  // hair drawn back smooth
    part(SPH, M(d.hair, 0.7), 0, 0.36, 0.12, 0.18, 0.16, 0.16, head);                 // the bun
    for (const sx of [-1, 1]) {                                                       // the crown of white feathers either side of it
      part(SPH, M(d.hat, 0.95), sx * 0.13, 0.38, 0.06, 0.1, 0.18, 0.08, head).rotation.z = -sx * 0.6;
      part(SPH, M(d.hat, 0.95), sx * 0.07, 0.42, 0.1, 0.08, 0.14, 0.07, head).rotation.z = -sx * 0.3;
      part(SPH, M('#ff9aa8', 0.7), sx * 0.11, 0.12, -0.14, 0.06, 0.04, 0.02, head);  // rosy cheeks
    }
    part(BOX, M(d.accent, 0.25, 0.6), 0, 0.33, -0.12, 0.26, 0.035, 0.08, head);       // a silver tiara band
    part(BOX, M('#d84a6a', 0.5), 0, 0.09, -0.152, 0.06, 0.022, 0.01, head);           // her lips
  } else if (hippie) {
    const hair = M(d.hair, 0.7);
    part(RB, hair, 0, 0.29, 0.03, 0.35, 0.14, 0.34, head);                            // long straight hair, parted in the middle
    for (const sx of [-1, 1]) part(RB, hair, sx * 0.17, 0.12, 0.02, 0.06, 0.38, 0.3, head);
    part(RB, hair, 0, 0.15, 0.13, 0.35, 0.4, 0.1, head);                                // the back of her head, under what swings
    tail = grp(head, 0, 0.3, 0.15);                                                     // the length of it down her back, swinging as she runs
    part(RB, hair, 0, -0.26, 0.02, 0.3, 0.56, 0.08, tail);
    for (let k = 0; k < 10; k++) {                                                      // the crown of daisies, a few coloured flowers among them
      const a = (k / 10) * Math.PI * 2, x = Math.sin(a) * 0.19, z = -Math.cos(a) * 0.18 + 0.02;
      part(SPH, M(k % 3 === 1 ? ['#ff5a8a', '#ff9a2a', '#8ab8ff'][k % 4 % 3] : d.hat, 0.6), x, 0.36, z, 0.08, 0.05, 0.08, head);
      if (k % 3 !== 1) part(SPH, M('#ffd23d', 0.5), x * 1.04, 0.38, z * 1.04, 0.035, 0.03, 0.035, head);
    }
    for (const sx of [-1, 1]) {
      part(CYL, E('#ff7aa8', 1.1), sx * 0.075, 0.2, -0.158, 0.1, 0.012, 0.1, head).rotation.x = Math.PI / 2;   // the round, rose-tinted glasses
      part(TOR, M('#d8b048', 0.3, 0.7), sx * 0.075, 0.2, -0.162, 0.11, 0.11, 0.06, head);
    }
    part(BOX, M('#d8b048', 0.3, 0.7), 0, 0.21, -0.164, 0.05, 0.012, 0.01, head);
    part(BOX, M('#d85a6a', 0.5), 0, 0.09, -0.152, 0.06, 0.022, 0.01, head);           // her smile
  } else if (surfer) {
    const hair = M(d.hair, 0.85);
    part(RB, hair, 0, 0.29, 0.03, 0.35, 0.15, 0.34, head);                            // shaggy and sun-bleached
    for (let k = 0; k < 5; k++) part(BOX, hair, -0.12 + k * 0.06, 0.28, -0.15, 0.07, 0.1, 0.04, head).rotation.z = (k - 2) * 0.18;   // the fringe falling into his eyes
    for (const sx of [-1, 1]) part(RB, hair, sx * 0.17, 0.2, 0.04, 0.06, 0.24, 0.26, head);
    part(RB, hair, 0, 0.18, 0.15, 0.34, 0.26, 0.08, head);
    part(BOX, M('#1a1a22', 0.3), 0, 0.37, -0.06, 0.3, 0.035, 0.05, head);              // the sunglasses pushed up on his head
    for (const sx of [-1, 1]) part(BOX, E('#ff7a3a', 1.2), sx * 0.075, 0.375, -0.09, 0.11, 0.05, 0.02, head);   // their mirrored orange lenses
    for (const sx of [-1, 1]) part(BOX, M('#c8a050', 0.6), sx * 0.075, 0.265, -0.152, 0.06, 0.018, 0.01, head);   // his eyebrows
    part(BOX, M('#7a3a2a', 0.5), 0, 0.09, -0.152, 0.1, 0.022, 0.01, head);            // the grin
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
  if (paris) {   // the marinière's stripes running down the sleeves too
    for (const A of [AL, AR]) {
      for (let k = 0; k < 3; k++) part(BOX, M(d.pack, 0.6), 0, -0.05 - k * 0.1, 0, 0.16, 0.035, 0.16, A.sh);
      for (let k = 0; k < 2; k++) part(BOX, M(d.pack, 0.6), 0, -0.06 - k * 0.1, 0, 0.14, 0.035, 0.14, A.el);
    }
  }
  if (paris) {   // a baguette fresh from the boulangerie, in its paper wrap
    part(CYL, M('#d8a050', 0.7), 0, -0.34, -0.2, 0.075, 0.66, 0.075, AL.el).rotation.x = Math.PI / 2;
    part(CYL, M('#f4f0e8', 0.8), 0, -0.33, -0.02, 0.09, 0.22, 0.09, AL.el).rotation.x = Math.PI / 2;
    for (const z of [-0.32, -0.42]) part(BOX, M('#f0c880', 0.7), 0, -0.3, z, 0.05, 0.02, 0.05, AL.el);
  }
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
  if (dondurma) {   // the long steel paddle, a lump of stretchy ice cream on its end with a cone stuck in it
    part(CYL, M('#d8dce0', 0.25, 0.85), 0, -0.86, 0, 0.035, 1.1, 0.035, AR.el);
    part(SPH, M('#f8f4ec', 0.5), 0, -1.43, 0, 0.22, 0.2, 0.22, AR.el);
    part(SPH, M('#ff9ac0', 0.5), 0.03, -1.5, 0, 0.15, 0.13, 0.15, AR.el);
    part(CONE, M('#d8a050', 0.7), 0, -1.6, 0, 0.11, 0.2, 0.11, AR.el).rotation.x = Math.PI;
  }
  if (nezha) for (const A of [AL, AR]) part(CYL, M(d.accent, 0.3, 0.7), 0, -0.22, 0, 0.16, 0.08, 0.16, A.el);   // gold bracelets
  if (hippie) {
    for (const F of [L, R]) part(FEZ, mPants, 0, -0.36, 0, 0.3, 0.2, 0.32, F.knee);   // the bell-bottoms flaring over her sandals
    for (const sx of [-1, 1]) part(BOX, mSkin, sx * 0.03, -0.43, -0.02, 0.035, 0.14, 0.035, AR.el).rotation.z = sx * 0.28;   // two fingers up: peace
    for (const A of [AL, AR]) part(CYL, M('#8a5a3a', 0.6), 0, -0.24, 0, 0.15, 0.04, 0.15, A.el);   // leather wristbands
  }
  if (surfer) {
    [L, R].forEach((F, i) => {
      F.knee.children[0].material = mSkin;                                             // bare shins under the board shorts
      part(CYL, mPants, 0, -0.04, 0, 0.25, 0.12, 0.27, F.knee);                         // the shorts' hem at the knee
      part(BOX, M('#f4f0e8', 0.6), (i ? 1 : -1) * 0.107, -0.22, 0, 0.012, 0.48, 0.06, F.thigh);   // the white stripe down their sides
      F.foot.children[0].material = mSkin;                                             // bare feet in flip-flops: the thong between the toes
      for (const sx of [-1, 1]) part(BOX, M(d.shoes, 0.5), sx * 0.05, 0.03, -0.14, 0.02, 0.025, 0.17, F.foot).rotation.y = sx * 0.45;
    });
    part(BOX, mSkin, -0.065, -0.42, -0.02, 0.035, 0.12, 0.035, AR.el).rotation.z = 0.75;   // the shaka: the thumb and the little finger out
    part(BOX, mSkin, 0.065, -0.42, -0.02, 0.035, 0.12, 0.035, AR.el).rotation.z = -0.75;
    part(CYL, M('#ffd23d', 0.6), 0, -0.24, 0, 0.15, 0.04, 0.15, AL.el);                // a woven bracelet
  }
  const wings = [];
  if (falconer) {
    for (const F of [L, R]) {   // the kandura's skirts down to the ankles, swinging with the legs
      part(RB, mPants, 0, -0.22, 0, 0.27, 0.52, 0.3, F.thigh);
      part(FEZ, mPants, 0, -0.24, 0, 0.3, 0.46, 0.31, F.knee);
      F.foot.children[0].material = M('#c8946a', 0.7);                                   // bare feet in sandals
      part(BOX, M(d.shoes, 0.6), 0, -0.07, -0.07, 0.25, 0.04, 0.42, F.foot);
      part(BOX, M(d.shoes, 0.6), 0, 0.0, -0.14, 0.22, 0.03, 0.06, F.foot);
    }
    const leather = M(d.pack, 0.8);
    part(CYL, leather, 0, -0.22, 0, 0.17, 0.24, 0.17, AL.el);                         // the falconer's gauntlet
    part(CYL, M('#5a3a22', 0.8), 0, -0.1, 0, 0.19, 0.04, 0.19, AL.el);
    // the falcon: a peregrine standing on the glove, hooded, facing the way he runs (the forearm is held level in front)
    const fg = grp(AL.el, 0, -0.26, -0.09); fg.rotation.x = -Math.PI / 2;
    const back = M('#5a5e66', 0.7), cream = M('#efe4cc', 0.8), bar = M('#3a3a40', 0.7);
    for (const sx of [-1, 1]) part(CYL, M('#e8c040', 0.5), sx * 0.035, 0.02, 0, 0.025, 0.05, 0.025, fg);   // its yellow feet
    part(SPH, back, 0, 0.13, 0.01, 0.15, 0.21, 0.17, fg).rotation.x = 0.3;           // the body, the chest pushed out
    part(SPH, cream, 0, 0.13, -0.045, 0.115, 0.17, 0.08, fg).rotation.x = 0.3;      // its pale barred breast
    for (let k = 0; k < 6; k++) part(SPH, bar, -0.03 + (k % 3) * 0.03, 0.08 + Math.floor(k / 3) * 0.05, -0.085, 0.018, 0.012, 0.01, fg);
    part(BOX, back, 0, 0.03, 0.12, 0.075, 0.022, 0.17, fg).rotation.x = 0.55;       // the tail
    part(SPH, back, 0, 0.27, -0.02, 0.1, 0.1, 0.1, fg);                               // the head
    part(SPH, leather, 0, 0.29, -0.015, 0.105, 0.085, 0.105, fg);                     // the leather hood (burqa) over it
    part(SPH, M(d.accent, 0.5, 0.3), 0, 0.345, -0.01, 0.03, 0.04, 0.03, fg);           // the hood's knot on top
    part(CONE, M('#3a3a3a', 0.4), 0, 0.255, -0.085, 0.032, 0.05, 0.032, fg).rotation.x = -Math.PI / 2;   // the hooked beak
    for (const sx of [-1, 1]) {   // the wings: hinged at the shoulders, folded along its sides or spread (the Animator works them)
      const w = grp(fg, sx * 0.06, 0.19, 0.0);
      part(SPH, back, sx * 0.11, -0.02, 0.03, 0.22, 0.05, 0.2, w);
      part(BOX, M('#3e4148', 0.7), sx * 0.22, -0.035, 0.08, 0.16, 0.014, 0.1, w);    // the dark primaries at its tip
      wings.push({ w, sx });
    }
  }
  return { root, body, inner, hips, torso, head, tail, L, R, AL, AR, spin, wings, def: d };
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
        else if (r.def.style === 'dondurma') { P.aR = -2.65 + Math.sin(this.ph) * 0.12; P.eR = 0.25; P.zR = 0.18; }   // the paddle held up like a banner
        else if (r.def.style === 'falconer') { P.aL = 0.25 + Math.sin(this.ph) * 0.05; P.eL = 1.45; P.zL = -0.18; }   // the gauntlet held level in front, the falcon on it
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
        if (r.def.style === 'falconer') { P.aL = 0.35; P.eL = 1.5; P.zL = -0.2; P.hy = -0.3 + Math.sin(t * 0.7) * 0.25; }   // showing off his falcon
        if (r.def.style === 'dondurma') { const w = Math.sin(t * 5); P.aR = -2.2 + w * 0.6; P.eR = 0.5 + w * 0.45; P.zR = 0.22; P.hy = Math.sin(t * 1.3) * 0.5; }   // teasing a customer with the paddle
        if (r.def.style === 'swan') { const w = Math.sin(t * 2.2); P.aL = -0.1; P.aR = -0.1; P.zL = -1.25 - w * 0.28; P.zR = 1.25 + w * 0.28; P.eL = 0.35 + Math.sin(t * 2.2 + 0.9) * 0.3; P.eR = P.eL; P.hy = Math.sin(t * 0.7) * 0.3; }   // Odette's arms, rising and falling like wings
        if (r.def.style === 'hippie') { const w = Math.sin(t * 1.8); P.aR = -2.75; P.eR = 0.35 + Math.sin(t * 3.6) * 0.08; P.zR = 0.3; P.aL = 0.1; P.zL = -0.25 - w * 0.08; P.hy = w * 0.35; P.tz = w * 0.08; P.bob = Math.abs(Math.sin(t * 3.6)) * 0.03; }   // peace, swaying to the music
        if (r.def.style === 'surfer') { const w = Math.sin(t * 1.6); P.aR = -1.25; P.zR = 1.0 + w * 0.08; P.eR = 1.0; P.aL = -0.5 - w * 0.15; P.zL = -0.75 - w * 0.2; P.eL = 0.45; P.tL = 0.4; P.tR = 0.25; P.kL = -0.55; P.kR = -0.45; P.tz = w * 0.14; P.hy = -w * 0.3; P.bob = -0.05 + Math.abs(w) * 0.03; }   // shaka, riding a wave only he can see
        if (r.def.style === 'nezha') { const w = Math.sin(t * 8); P.aL = -1.4 - w; P.aR = -1.4 + w; P.eL = 1.2; P.eR = 1.2; P.zL = -0.45; P.zR = 0.45; P.hy = Math.sin(t * 4) * 0.35; P.bob = Math.abs(w) * 0.05; P.tz = Math.sin(t * 4) * 0.12; }   // the Neon Gods' techno dance
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
    if (r.spin) for (const w of r.spin) w.rotation.x -= dt * 14;
    if (r.wings && r.wings.length) {   // the falcon: wings half open for balance as he runs, spread in the air, folded tight in a roll, a burst of flapping now and then at rest
      const p = t % 4.6;
      const f = s.mode === 'run' ? 0.55 + 0.12 * Math.sin(this.ph * 2) : s.mode === 'jump' || s.mode === 'fly' ? 0.95 + 0.08 * Math.sin(t * 16) : s.mode === 'roll' ? 0 : s.mode === 'dead' ? 0.8 : p < 1.2 ? 0.5 + 0.5 * Math.sin(p * 17) : 0.04;
      for (const { w, sx } of r.wings) w.rotation.z = sx * (-1.25 + 1.45 * f);
    }
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
