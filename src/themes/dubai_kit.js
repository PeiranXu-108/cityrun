// Dubai's street kit for a winter evening's blue hour: the boards of Deira in Arabic and English over the cafeterias,
// the exchanges, the tailors and the perfumers; the souks' carved wood and brass lanterns, the gold in the windows, the
// spice sacks; the cream taxis with their coloured roofs, white Land Cruisers, supercars and the police's white and green
// one, the red and white buses; date palms with their trunks wrapped in warm lights, the ghaf, bougainvillea; the air-
// conditioned bus shelters, the double-armed street lights, the flags; the people: men in white kanduras and ghutras,
// women in black abayas, tourists, workers in blue overalls, the delivery riders; abras and dhows, yachts; camels.
// Every business name is made up; the places are real.
import { THREE, Batcher, VC, G, std, basic, hdr, canvasTex, planeUV, buildingGeo, shade, CHUNK_LEN, rand, randi, pick, chance } from '../core.js';
import { EDGE, at, waterMat, screenMat, screenTint } from './common.js';
import { beam } from './tokyo_kit.js';
import { dubaiTreeKit } from './trees.js';
import { taperGeo } from './ny_icons.js';
import { puffs } from './taipei_towers.js';
import { tiledBox } from './beijing_kit.js';

export const KUFI = '"Noto Kufi Arabic", "Geeza Pro", Tahoma, sans-serif';       // shop boards, road signs, the towers
export const RUQAA = '"Aref Ruqaa", "Noto Kufi Arabic", "Geeza Pro", serif';      // the souks and the old town
export const SANS = '"Oswald", "Arial Narrow", sans-serif';
export const SERIF = '"Playfair Display", Georgia, "Times New Roman", serif';
export const DISPLAY = '"Russo One", "Arial Black", sans-serif';
export const KERB = EDGE + 3.1;   // the kerb: a lane of road between the track and it, the pavement beyond
export const X0 = 11.2;           // the building line of the shopping streets
export const face = (s) => (-s * Math.PI) / 2;   // turns a plane on side s to face the track
export const WARM = ['#ffd9a0', '#ffe6bc', '#ffc880', '#fff0d8', '#ffdcb0'];
export const SAND = ['#e8d4b0', '#dcc49c', '#f0dcb8', '#d8bc90', '#e4ccaa', '#f2e2c4', '#d4b48a'];
export const CORAL = ['#d8c8a8', '#e2d4b4', '#cfbe9c', '#e8dcc0', '#d4c09a'];
export const TAXI_ROOFS = ['#d8202a', '#d8202a', '#d8202a', '#2a9a4a', '#f2c230', '#ff7a1a', '#6a3ab8', '#ff6aa8'];   // Dubai Taxi red the most of them
const CARS = ['#f4f4f2', '#f4f4f2', '#f0f0ee', '#ececea', '#d8dadc', '#c8cacc', '#1a1a1e', '#8a8e94', '#c8a050', '#2a3a5a', '#5a1a1a'];
const SKIN = ['#c8946a', '#b07a52', '#8a5a3a', '#e8c4a0', '#d8a878', '#6a4428', '#f0d0b0', '#a06a42'];
const HAIR = ['#141010', '#1e1612', '#2a1e16', '#3a2a1a', '#5a3e26', '#8a6a3a'];
const TOPS = ['#f4f0e8', '#2a4a8a', '#c8302a', '#1a1a1e', '#3a7a5a', '#e8a030', '#8a5aa8', '#5ab8d8', '#f2c8d8', '#7a7a80'];
const LEGS = ['#1a2440', '#2a2a30', '#5a5a60', '#c8b898', '#3a3a48', '#1e1e24'];
const KANDURA = ['#f6f4ee', '#f6f4ee', '#f4f2ea', '#f8f6f2', '#e8e2d4', '#d8ccb8', '#c8c4bc'];   // white mostly; winter's beige and grey

// ---------- the boards: [Arabic, English], a style ----------
// box: a lightbox in the shop's colour (Deira); gold: lit gold letters on a dark fascia (the malls and the boulevard);
// wood: carved teak, gilded (the souks, the old town); green: the pharmacy's cross
const B = (ar, en, st = 'box', c = '#d8202a') => ({ ar, en, st, c });
export const DEIRA_SIGNS = [B('كافتيريا الواحة', 'AL WAHA CAFETERIA', 'box', '#d8202a'), B('صرافة', 'MONEY EXCHANGE', 'box', '#1a5aa8'), B('سوبرماركت', 'SUPERMARKET', 'box', '#2a8a3a'),
  B('هواتف متحركة', 'MOBILE PHONES', 'box', '#ff7a1a'), B('خياط رجالي', 'GENTS TAILORING', 'box', '#5a3aa8'), B('عطور الريف', 'AL REEF PERFUMES', 'gold'), B('صيدلية', 'PHARMACY', 'green', '#1a9a3a'),
  B('مطعم الفجر', 'AL FAJR RESTAURANT', 'box', '#c8202a'), B('شاورما', 'SHAWARMA', 'box', '#e86a1a'), B('عصائر طازجة', 'FRESH JUICE', 'box', '#2aa84a'), B('شاي كرك', 'KARAK TEA', 'box', '#a8501a'),
  B('مغسلة', 'LAUNDRY', 'box', '#1a8ac8'), B('إلكترونيات', 'ELECTRONICS', 'box', '#1a3a8a'), B('حلويات', 'SWEETS', 'box', '#d83a7a'), B('مخبز', 'BAKERY', 'box', '#c8902a'),
  B('صالون حلاقة', 'GENTS SALON', 'box', '#2a2a30'), B('بقالة', 'GROCERY', 'box', '#3a8a2a'), B('أقمشة', 'TEXTILES', 'box', '#8a2a5a')];
export const SOUK_SIGNS = [B('ذهب ومجوهرات', 'GOLD & JEWELLERY', 'gold'), B('بهارات', 'SPICES', 'wood'), B('عود وبخور', 'OUD & BAKHOOR', 'wood'), B('سجاد', 'CARPETS', 'wood'),
  B('فوانيس', 'LANTERNS', 'wood'), B('أقمشة', 'TEXTILES', 'wood'), B('زعفران', 'SAFFRON', 'wood'), B('تمور', 'DATES', 'wood'), B('تحف', 'ANTIQUES', 'wood'), B('شالات', 'PASHMINA', 'wood'),
  B('عطور', 'PERFUMES', 'gold'), B('ساعات', 'WATCHES', 'gold')];
export const BLVD_SIGNS = [B('مقهى', 'CAFÉ', 'gold'), B('قهوة عربية', 'ARABIC COFFEE', 'gold'), B('شيشة', 'SHISHA LOUNGE', 'gold'), B('كنافة', 'KUNAFA', 'gold'), B('لقيمات', 'LUQAIMAT', 'gold'),
  B('تمور', 'DATES', 'gold'), B('شوكولاتة', 'CHOCOLATIER', 'gold'), B('عطور', 'PERFUMERY', 'gold'), B('معرض فني', 'GALLERY', 'gold'), B('مشويات', 'LEBANESE GRILL', 'gold'), B('بوتيك', 'BOUTIQUE', 'gold')];
export const MARINA_SIGNS = [B('مأكولات بحرية', 'SEAFOOD', 'gold'), B('تأجير يخوت', 'YACHT CHARTER', 'box', '#1a6ab8'), B('مقهى', 'CAFÉ', 'gold'), B('ستيك هاوس', 'STEAKHOUSE', 'gold'),
  B('سوشي', 'SUSHI', 'gold'), B('جيلاتو', 'GELATO', 'gold'), B('برغر', 'BURGERS', 'box', '#d8202a'), B('عصائر', 'JUICE BAR', 'box', '#2aa84a')];
export const HERITAGE_SIGNS = [B('معرض فني', 'ART GALLERY', 'wood'), B('بيت القهوة', 'COFFEE HOUSE', 'wood'), B('دار الحرف', 'CRAFTS HOUSE', 'wood'), B('مطبخ إماراتي', 'EMIRATI KITCHEN', 'wood'),
  B('تحف', 'ANTIQUES', 'wood'), B('دار الخط', 'CALLIGRAPHY', 'wood')];
// the blue street plates
export const STREETS = [['شارع الشيخ زايد', 'SHEIKH ZAYED RD'], ['شارع الخليج', 'AL KHALEEJ RD'], ['شارع الرقة', 'AL RIGGA RD'], ['شارع المنخول', 'AL MANKHOOL RD'], ['شارع الفهيدي', 'AL FAHIDI ST'],
  ['شارع جميرا', 'JUMEIRA ST'], ['شارع السيف', 'AL SEEF ST'], ['شارع الضيافة', 'AL DIYAFAH ST'], ['شارع البحر', 'AL BAHAR ST'], ['شارع النصر', 'AL NASR ST']];
// the gantries' destinations, and the Metro's stations
export const GANTRY = [['جبل علي', 'Jebel Ali'], ['أبوظبي', 'Abu Dhabi'], ['دبي مارينا', 'Dubai Marina'], ['المطار', 'Airport'], ['ديرة', 'Deira'], ['بر دبي', 'Bur Dubai'],
  ['الشارقة', 'Sharjah'], ['جميرا', 'Jumeirah'], ['وسط المدينة', 'Downtown'], ['المركز التجاري', 'Trade Centre']];
export const STATIONS = [['برج خليفة / دبي مول', 'BURJ KHALIFA / DUBAI MALL'], ['المركز المالي', 'FINANCIAL CENTRE'], ['أبراج الإمارات', 'EMIRATES TOWERS'], ['المركز التجاري العالمي', 'WORLD TRADE CENTRE'],
  ['البرشاء', 'AL BARSHA'], ['دبي مارينا', 'DUBAI MARINA'], ['الخليج التجاري', 'BUSINESS BAY']];
// every other word in Arabic the city draws (the landmarks, the trains, the warnings)
export const WORDS = [['مترو دبي', 'DUBAI METRO'], ['ترام دبي', 'DUBAI TRAM'], ['محطة العبرة', 'ABRA STATION'], ['انتبه جمال', 'CAMEL CROSSING'], ['انتبه لرأسك', 'MIND YOUR HEAD'],
  ['مواقف', 'PARKING'], ['سالك', 'SALIK'], ['محطة حافلات', 'BUS STOP'], ['دبي', 'DUBAI'], ['مدينة الذهب', 'CITY OF GOLD'], ['سوق الذهب', 'GOLD SOUK'], ['سوق التوابل', 'SPICE SOUK'],
  ['متحف دبي', 'DUBAI MUSEUM'], ['دبي أوبرا', 'DUBAI OPERA'], ['متحف المستقبل', 'MUSEUM OF THE FUTURE'], ['دبي مول', 'THE DUBAI MALL'], ['مدينة جميرا', 'MADINAT JUMEIRAH'],
  ['أهلاً وسهلاً', 'WELCOME'], ['السيف', 'AL SEEF'], ['حديقة زعبيل', 'ZABEEL PARK'], ['برواز دبي', 'DUBAI FRAME'], ['مسجد جميرا', 'JUMEIRAH MOSQUE'], ['مخيم الصحراء', 'DESERT CAMP'],
  ['سوق البهار', 'SOUK AL BAHAR'], ['تاكسي', 'TAXI'], ['شرطة دبي', 'DUBAI POLICE'], ['هيئة الطرق والمواصلات', 'RTA'], ['مرسى دبي', 'DUBAI MARINA'], ['عين دبي', 'AIN DUBAI'], ['جي بي آر', 'JBR'],
  ['المستقبل لمن يتخيله ويصممه وينفذه', 'THE FUTURE'], ['الإمارات', 'EMIRATES'], ['قناة دبي المائية', 'DUBAI WATER CANAL'], ['نخلة جميرا', 'PALM JUMEIRAH'], ['أطلانتس', 'ATLANTIS'],
  ['برج العرب', 'BURJ AL ARAB'], ['برج خليفة', 'BURJ KHALIFA'], ['الفهيدي', 'AL FAHIDI'], ['خور دبي', 'DUBAI CREEK'], ['صيدلية', 'PHARMACY']];
export const GLYPHS = [...new Set([...DEIRA_SIGNS, ...SOUK_SIGNS, ...BLVD_SIGNS, ...MARINA_SIGNS, ...HERITAGE_SIGNS].map((s) => s.ar).join('')
  + [...STREETS, ...GANTRY, ...STATIONS, ...WORDS].map((s) => s[0]).join(''))].join('');

// ---------- textures ----------
function paveTex() {   // the pavement: sand-coloured interlocking pavers, a darker band of them along the kerb
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8a7a64'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = -16; x < w; x += 32) {
      const ox = (y / 16) % 2 ? 16 : 0, v = randi(-10, 10);
      g.fillStyle = `rgb(${196 + v},${178 + v},${146 + v})`; g.fillRect(x + ox + 1, y + 1, 30, 14);
    }
    g.fillStyle = 'rgba(70,56,40,0.5)'; g.fillRect(0, 0, 18, h);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${rand(0.02, 0.07)})`; g.fillRect(rand(0, w), rand(0, h), 2, 2); }
  });
}
function sandTex() {   // sand: warm, its wind ripples running across
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#d8b088'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 5) {
      g.strokeStyle = `rgba(${Math.random() < 0.5 ? '255,236,200' : '150,104,70'},${rand(0.12, 0.3)})`; g.lineWidth = rand(1, 2.2);
      g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x * 0.05 + y * 0.3) * 2.5); g.stroke();
    }
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${pick(['120,80,50', '255,240,210', '90,60,40'])},${rand(0.05, 0.2)})`; g.fillRect(rand(0, w), rand(0, h), 1.5, 1.5); }
  });
}
function asphaltTex() {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#2c2c30'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { const v = randi(30, 70); g.fillStyle = `rgba(${v},${v},${v + 4},0.5)`; g.fillRect(rand(0, w), rand(0, h), 1.5, 1.5); }
  });
}
// facades: {map, emissive, cols, rows} like core.js windowTex
function facade({ cols = 8, rows = 16, cw = 32, ch = 40, wall, paint }) {
  const W = cols * cw, H = rows * ch, lits = [];
  const map = canvasTex(W, H, (g) => { g.fillStyle = wall; g.fillRect(0, 0, W, H); paint(g, W, H, false, lits); });
  const emissive = canvasTex(W, H, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); paint(g, W, H, true, lits); });
  return { map, emissive, cols, rows };
}
function deiraTex() {   // a 1980s block in Deira: rendered concrete, aluminium windows in deep reveals, a few lit, curtains half drawn
  return facade({ wall: '#cdbfa6', paint: (g, W, H, em, lits) => {
    let i = 0;
    for (let r = 0; r < 16; r++) for (let c = 0; c < 8; c++, i++) {
      const x = c * 32 + 5, y = r * 40 + 7;
      if (!em) {
        g.fillStyle = 'rgba(90,70,50,0.35)'; g.fillRect(x - 2, y - 2, 26, 30);
        g.fillStyle = '#1c1e24'; g.fillRect(x, y, 22, 26); g.strokeStyle = '#b8bcc0'; g.lineWidth = 1.5; g.strokeRect(x, y, 22, 26); g.beginPath(); g.moveTo(x + 11, y); g.lineTo(x + 11, y + 26); g.stroke();
        g.fillStyle = 'rgba(60,50,40,0.25)'; g.fillRect(x - 3, y + 28, 28, 3);
        lits[i] = Math.random() < 0.42 ? pick(['#ffe2b0', '#fff4e0', '#e8f4ff', '#ffd090']) : null;
      } else if (lits[i]) {
        g.fillStyle = lits[i]; g.fillRect(x + 1, y + 1, 20, 24);
        if (Math.random() < 0.5) { g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x + 1, y + 1, rand(5, 11), 24); }
      }
    }
  } });
}
function glassTex(base, mull, lit, { band = 0.32 } = {}) {   // a glass curtain wall: tinted glass, mullions, offices lit in rows, the slab edges
  return facade({ wall: base, paint: (g, W, H, em, lits) => {
    for (let r = 0; r < 16; r++) {
      const rowLit = Math.random() < band ? 0.85 : 0.22;
      for (let c = 0; c < 8; c++) {
        const x = c * 32, y = r * 40, k = r * 8 + c;
        if (!em) {
          const gr = g.createLinearGradient(0, y, 0, y + 40); gr.addColorStop(0, shade(base, 1.2)); gr.addColorStop(1, shade(base, 0.85));
          g.fillStyle = gr; g.fillRect(x, y, 32, 40);
          g.fillStyle = mull; g.fillRect(x, y, 2, 40); g.fillRect(x, y + 33, 32, 7);
          lits[k] = Math.random() < rowLit ? pick(lit) : null;
        } else if (lits[k]) { g.fillStyle = lits[k]; g.fillRect(x + 2, y + 2, 30, 31); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 2 + rand(0, 20), y + 18, 8, 15); }
      }
    }
  } });
}
function resTex() {   // a residential tower at the Marina: the balconies' glass railings, sliding doors, the lit living rooms
  return facade({ wall: '#e8e2d6', paint: (g, W, H, em, lits) => {
    for (let r = 0; r < 16; r++) for (let c = 0; c < 8; c++) {
      const x = c * 32, y = r * 40, k = r * 8 + c;
      if (!em) {
        g.fillStyle = '#2a3442'; g.fillRect(x + 3, y + 6, 26, 24);
        g.fillStyle = 'rgba(180,210,230,0.55)'; g.fillRect(x, y + 22, 32, 10);   // the glass balustrade
        g.fillStyle = '#d8d0c0'; g.fillRect(x, y + 32, 32, 6);
        lits[k] = Math.random() < 0.48 ? pick(['#ffe2b0', '#fff2d8', '#ffd8a0', '#e8f0ff']) : null;
      } else if (lits[k]) { g.fillStyle = lits[k]; g.fillRect(x + 4, y + 7, 24, 15); g.fillStyle = shade(lits[k], 0.5); g.fillRect(x + 4, y + 22, 24, 8); }
    }
  } });
}
function stuccoTex(base = '#e6d2ae') {   // sand-coloured render, a little weathered (the arabesque low-rise, the villas)
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,250,235' : '120,90,60'},${rand(0.03, 0.09)})`; g.fillRect(rand(0, w), rand(0, h), rand(2, 6), rand(2, 6)); }
  });
}
function coralTex() {   // coral stone laid in gypsum: the old houses of Al Fahidi and Al Shindagha, their render worn off in patches
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#e2d4b6'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 10) for (let x = -10; x < w; x += rand(14, 22)) {
      g.fillStyle = pick(['#cbb894', '#d8c6a2', '#bfac88', '#d2bf9c']); g.beginPath(); g.ellipse(x + rand(0, 6), y + 5, rand(6, 10), rand(3.5, 5), rand(-0.2, 0.2), 0, Math.PI * 2); g.fill();
      for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(120,96,64,0.35)'; g.fillRect(x + rand(-4, 8), y + rand(1, 8), 1.4, 1.4); }
    }
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(240,232,214,0.75)'; g.beginPath(); g.ellipse(rand(0, w), rand(0, h), rand(10, 26), rand(8, 18), 0, 0, Math.PI * 2); g.fill(); }   // the gypsum render left on
  });
}
function latticeTex() {   // the eight-pointed stars of an Islamic lattice (mashrabiya, screens, the souks' shades): cut out with alpha
  return canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-out';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const cx = c * 32 + 16, cy = r * 32 + 16;
      g.beginPath();
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2 + Math.PI / 8, rr = k % 2 ? 7 : 12.5; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      g.closePath(); g.fill();
      g.beginPath(); g.arc(c * 32, r * 32, 3.2, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
  });
}
function carpetTex() {   // kilims and Persian rugs: borders, medallions, stripes, the reds and indigos of the souk's stacks
  return canvasTex(256, 256, (g, w, h) => {
    const P = [['#8a1a1a', '#e8c070', '#1a2a5a'], ['#1a2a5a', '#d8a050', '#8a2a2a'], ['#6a1a2a', '#f0e0c0', '#2a5a4a'], ['#a83a1a', '#1a1a2a', '#e8d0a0']];
    for (let i = 0; i < 4; i++) {
      const [a, b2, c] = P[i], x = (i % 2) * 128, y = Math.floor(i / 2) * 128;
      g.fillStyle = a; g.fillRect(x, y, 128, 128);
      g.strokeStyle = b2; g.lineWidth = 6; g.strokeRect(x + 8, y + 8, 112, 112);
      g.strokeStyle = c; g.lineWidth = 3; g.strokeRect(x + 16, y + 16, 96, 96);
      g.fillStyle = b2; g.beginPath(); for (let k = 0; k < 8; k++) { const ang = (k / 8) * Math.PI * 2, rr = k % 2 ? 18 : 34; g.lineTo(x + 64 + Math.cos(ang) * rr, y + 64 + Math.sin(ang) * rr); } g.closePath(); g.fill();
      g.fillStyle = c; g.beginPath(); g.arc(x + 64, y + 64, 9, 0, Math.PI * 2); g.fill();
      for (let k = 0; k < 10; k++) { g.fillStyle = k % 2 ? c : b2; g.fillRect(x + 22 + k * 8.4, y + 22, 4, 4); g.fillRect(x + 22 + k * 8.4, y + 102, 4, 4); }
    }
  }, { repeat: false });
}
export function flagTex() {   // the UAE's flag: the red band at the hoist, green, white and black
  return canvasTex(128, 64, (g, w, h) => {
    g.fillStyle = '#00843d'; g.fillRect(0, 0, w, h / 3);
    g.fillStyle = '#ffffff'; g.fillRect(0, h / 3, w, h / 3);
    g.fillStyle = '#111111'; g.fillRect(0, (2 * h) / 3, w, h / 3);
    g.fillStyle = '#e8112d'; g.fillRect(0, 0, w / 4, h);
  }, { repeat: false });
}
// shop windows, one interior to a row (a window tiles its row along its length)
const WINS = ['gold', 'spice', 'cloth', 'perfume', 'lamps', 'carpet', 'phones', 'juice', 'shawarma', 'sweets', 'cafe', 'pharmacy', 'boutique', 'grocery', 'tailor', 'dates'];
export const WIN = Object.fromEntries(WINS.map((k, i) => [k, i]));
const NWIN = WINS.length;
function shopWinTex() {
  const W = 256, R = 64;
  return canvasTex(W, R * NWIN, (g) => {
    WINS.forEach((k, i) => {
      g.save(); g.translate(0, i * R); g.beginPath(); g.rect(0, 0, W, R); g.clip();
      const bgs = { gold: '#3a2a10', spice: '#4a2a14', cloth: '#2a1a2a', perfume: '#1a1418', lamps: '#2a1a0a', carpet: '#3a1414', phones: '#e8eef4', juice: '#f4f0e0', shawarma: '#f0e8d0', sweets: '#f8ecd8', cafe: '#3a2418', pharmacy: '#eef6f0', boutique: '#f0e8e0', grocery: '#f4f2e8', tailor: '#ece4d4', dates: '#4a2a14' };
      g.fillStyle = bgs[k]; g.fillRect(0, 0, W, R);
      if (k === 'gold') {   // necklaces on velvet busts, bangles, the whole window glowing
        for (let x = 6; x < W; x += 30) { g.fillStyle = '#5a1a2a'; g.fillRect(x, 20, 22, 40); g.strokeStyle = '#ffd24a'; g.lineWidth = 3; g.beginPath(); g.arc(x + 11, 22, 10, 0.2, Math.PI - 0.2); g.stroke(); g.beginPath(); g.arc(x + 11, 26, 7, 0.3, Math.PI - 0.3); g.stroke(); g.fillStyle = '#ffe680'; g.beginPath(); g.arc(x + 11, 34, 4, 0, 7); g.fill(); }
        for (let i2 = 0; i2 < 60; i2++) { g.fillStyle = `rgba(255,240,160,${rand(0.4, 1)})`; g.fillRect(rand(0, W), rand(0, R), 2, 2); }
      } else if (k === 'spice' || k === 'dates') {   // sacks rolled down, their heaps of colour
        for (let x = 4; x < W; x += 26) { const c = k === 'dates' ? pick(['#6a3a1a', '#8a4a20', '#5a2a14']) : pick(['#d84a1a', '#f2b030', '#8a5a2a', '#c8202a', '#e8d070', '#6a8a2a', '#3a2a1a']); g.fillStyle = '#c8b088'; g.fillRect(x, 36, 22, 28); g.fillStyle = c; g.beginPath(); g.ellipse(x + 11, 38, 12, 8, 0, 0, 7); g.fill(); }
      } else if (k === 'cloth') {
        for (let x = 0; x < W; x += 12) { g.fillStyle = pick(['#c8202a', '#2a5aa8', '#e8c040', '#2a8a5a', '#a83a8a', '#f4f0e8', '#1a1a1a']); g.fillRect(x, 8, 10, 56); }
      } else if (k === 'perfume') {   // the bottles on mirrored shelves, gold and coloured glass
        for (const y of [14, 40]) { g.fillStyle = '#5a4a3a'; g.fillRect(0, y + 18, W, 3); for (let x = 8; x < W; x += 16) { g.fillStyle = pick(['#c8a040', '#8a2a4a', '#2a6a8a', '#e8d080', '#6a2a8a']); g.fillRect(x, y + 4, 9, 14); g.fillStyle = '#e8c860'; g.fillRect(x + 3, y, 3, 4); } }
      } else if (k === 'lamps') {   // pierced brass lanterns hanging, glowing
        for (let x = 10; x < W; x += 24) { const y = rand(14, 34); g.strokeStyle = '#8a6a3a'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y - 8); g.stroke(); g.fillStyle = pick(['#ffb040', '#ff7a3a', '#6ad0ff', '#ff4a8a', '#7aff8a']); g.beginPath(); g.ellipse(x, y, 7, 10, 0, 0, 7); g.fill(); g.fillStyle = '#c89a40'; g.fillRect(x - 6, y - 12, 12, 3); }
      } else if (k === 'carpet') {
        for (let x = 0; x < W; x += 34) { g.fillStyle = pick(['#8a1a1a', '#1a2a5a', '#6a1a2a', '#a83a1a']); g.fillRect(x + 2, 4, 30, 60); g.strokeStyle = pick(['#e8c070', '#f0e0c0']); g.lineWidth = 2; g.strokeRect(x + 5, 8, 24, 52); }
      } else if (k === 'phones') {
        for (let x = 8; x < W; x += 20) { g.fillStyle = '#141418'; g.fillRect(x, 20, 12, 22); g.fillStyle = pick(['#3a8ae8', '#e83a8a', '#3ae8a8']); g.fillRect(x + 1, 22, 10, 17); }
        g.fillStyle = '#d8202a'; g.fillRect(0, 54, W, 10);
      } else if (k === 'juice') {   // the fruit stacked up to the ceiling, the glasses on the counter
        for (let i2 = 0; i2 < 80; i2++) { g.fillStyle = pick(['#ff8a1a', '#ffd23d', '#3aa83a', '#d82a2a', '#ffb0c0', '#e8e040']); g.beginPath(); g.arc(rand(0, W), rand(0, 44), rand(4, 7), 0, 7); g.fill(); }
        for (let x = 10; x < W; x += 22) { g.fillStyle = pick(['#ff9a2a', '#ffe060', '#7ad04a', '#ff6a8a']); g.fillRect(x, 48, 8, 14); }
      } else if (k === 'shawarma') {   // the spits turning in front of their grills, the menu boards over them
        for (const x of [40, 120, 200]) { g.fillStyle = '#ff9a3a'; g.fillRect(x - 18, 10, 36, 50); g.fillStyle = '#8a4a1a'; g.beginPath(); g.moveTo(x - 10, 14); g.lineTo(x + 10, 14); g.lineTo(x + 6, 58); g.lineTo(x - 6, 58); g.fill(); }
        g.fillStyle = '#d8202a'; g.fillRect(0, 0, W, 8);
      } else if (k === 'sweets') {   // trays of baklava and kunafa in the glass counter
        for (let x = 4; x < W; x += 36) { g.fillStyle = pick(['#e8a030', '#c87a2a', '#f0c060', '#e86a2a']); g.fillRect(x, 34, 32, 18); for (let y = 36; y < 52; y += 5) { g.fillStyle = 'rgba(120,70,20,0.4)'; g.fillRect(x, y, 32, 1); } g.fillStyle = '#6a9a3a'; g.fillRect(x + 4, 36, 3, 3); }
      } else if (k === 'cafe') {   // warm light, a counter, the brass dallahs on it
        g.fillStyle = '#ffcf8a'; g.fillRect(0, 0, W, 30); g.fillStyle = '#5a3420'; g.fillRect(0, 40, W, 24);
        for (let x = 14; x < W; x += 36) { g.fillStyle = '#e8b040'; g.beginPath(); g.ellipse(x, 34, 6, 7, 0, 0, 7); g.fill(); g.fillRect(x - 2, 24, 4, 5); }
      } else if (k === 'pharmacy') {
        for (let y = 6; y < R; y += 14) for (let x = 0; x < W; x += 10) { g.fillStyle = pick(['#ffffff', '#e8f0ff', '#d8202a', '#2a8a4a', '#2a5aa8']); g.fillRect(x + 1, y, 8, 10); }
      } else if (k === 'boutique') {   // mannequins in kanduras and abayas, spotlit
        for (let x = 20; x < W; x += 44) { const ab = Math.random() < 0.5; g.fillStyle = ab ? '#141414' : '#f8f6f0'; g.beginPath(); g.moveTo(x - 7, 18); g.lineTo(x + 7, 18); g.lineTo(x + 11, 62); g.lineTo(x - 11, 62); g.fill(); g.fillStyle = ab ? '#141414' : '#f8f6f0'; g.beginPath(); g.arc(x, 12, 6, 0, 7); g.fill(); if (ab) { g.fillStyle = '#c8a040'; g.fillRect(x - 6, 30, 12, 2); } }
      } else if (k === 'grocery') {
        for (let y = 6; y < R; y += 14) { g.fillStyle = '#8a8a8a'; g.fillRect(0, y + 10, W, 2); for (let x = 0; x < W; x += 8) { g.fillStyle = pick(['#d8202a', '#ffd23d', '#2a8a4a', '#2a5aa8', '#ff8a1a', '#f4f0e8']); g.fillRect(x + 1, y, 6, 10); } }
      } else if (k === 'tailor') {   // bolts of white kandura cloth, a mannequin, the measuring table
        for (let x = 0; x < W; x += 14) { g.fillStyle = pick(['#f8f6f0', '#e8e2d4', '#d8ccb8', '#c8c4bc', '#2a2a3a']); g.fillRect(x + 1, 6, 12, 40); }
        g.fillStyle = '#6a4a2a'; g.fillRect(0, 50, W, 14);
      }
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, W, 5);
      g.restore();
    });
  }, { repeat: false });
}
function adAtlas() {   // the LED billboards' adverts, side by side: a watch, a perfume, a tower "now selling", the shopping festival, an airline
  const N = 6, W = 256, H = 128;
  const tex = canvasTex(W * N, H, (g) => {
    const cell = (i, draw) => { g.save(); g.translate(i * W, 0); g.beginPath(); g.rect(0, 0, W, H); g.clip(); draw(); g.restore(); };
    const txt = (s, x, y, px, col, font = SANS, w = 700) => { g.fillStyle = col; g.font = `${w} ${px}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); };
    cell(0, () => { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0a0a14'); gr.addColorStop(1, '#2a2440'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#e8c060'; g.lineWidth = 6; g.beginPath(); g.arc(70, 64, 38, 0, 7); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(70, 64); g.lineTo(70, 36); g.moveTo(70, 64); g.lineTo(92, 72); g.stroke();
      txt('ETERNAL', 172, 54, 28, '#f4e8c8', SERIF); txt('GENEVA · 1896', 172, 84, 14, '#c8a050', SERIF); });
    cell(1, () => { const gr = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 160); gr.addColorStop(0, '#8a2a5a'); gr.addColorStop(1, '#1a0a1a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = '#e8c870'; g.fillRect(48, 40, 34, 60); g.fillRect(58, 28, 14, 14); txt('عود', 170, 52, 36, '#ffe8b0', KUFI); txt('OUD ROYALE', 170, 92, 18, '#f0d8a0', SERIF); });
    cell(2, () => { g.fillStyle = '#0e2238'; g.fillRect(0, 0, W, H); g.fillStyle = '#c8e4ff'; for (const [x, h] of [[30, 90], [52, 110], [76, 70], [96, 120], [120, 84]]) g.fillRect(x, H - h, 16, h);
      txt('SKY LIVING', 196, 48, 26, '#ffffff'); txt('NOW SELLING', 196, 80, 15, '#ffd23d'); });
    cell(3, () => { const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#ff3d7f'); gr.addColorStop(1, '#ff9a2a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      txt('مهرجان التسوق', W / 2, 42, 30, '#ffffff', KUFI, 900); txt('SHOPPING FESTIVAL · 70% OFF', W / 2, 92, 16, '#fff4d0'); });
    cell(4, () => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3a6ab8'); gr.addColorStop(1, '#f2c8a0'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = '#f4f4f2'; g.beginPath(); g.ellipse(128, 70, 70, 9, -0.12, 0, 7); g.fill(); g.beginPath(); g.moveTo(110, 72); g.lineTo(84, 104); g.lineTo(100, 104); g.lineTo(140, 70); g.fill(); g.beginPath(); g.moveTo(186, 62); g.lineTo(196, 40); g.lineTo(204, 40); g.lineTo(198, 64); g.fill();
      txt('FLY THE WORLD', 128, 24, 18, '#ffffff'); });
    cell(5, () => { g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, W, H); g.fillStyle = '#f4f4f2'; g.beginPath(); g.moveTo(30, 90); g.lineTo(60, 66); g.lineTo(150, 60); g.lineTo(206, 78); g.lineTo(220, 92); g.closePath(); g.fill();
      g.fillStyle = '#141414'; for (const x of [70, 182]) { g.beginPath(); g.arc(x, 92, 12, 0, 7); g.fill(); }
      txt('V12 · THE NEW GT', 128, 28, 18, '#e8e8e8'); });
  }, { repeat: false });
  return { tex, cells: N };
}

// ---------- the kit ----------
export function makeKit() {
  const K = {};
  K.face = face;
  // ---------- materials ----------
  const pave = paveTex();
  K.sideMat = std({ map: pave.clone(), roughness: 0.85 }); K.sideMat.map.repeat.set(2, 23); K.sideMat.map.needsUpdate = true;   // the track's side strips
  K.paveMat = std({ map: pave, roughness: 0.85 });
  const sand = sandTex(); K.sandMat = std({ map: sand, roughness: 0.95, vertexColors: true, emissive: '#ffffff', emissiveMap: sand, emissiveIntensity: 0.14 });   // (a little of the sky's glow kept in it)
  K.roadMat = std({ map: asphaltTex(), roughness: 0.9 });
  K.stuccoMat = std({ map: stuccoTex(), vertexColors: true, roughness: 0.88 });
  K.coralMat = std({ map: coralTex(), vertexColors: true, roughness: 0.92 });
  K.latticeMat = std({ map: latticeTex(), vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 });
  K.latticeGlow = basic({ map: K.latticeMat.map, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });   // the same lattice lit from behind
  K.carpetMat = std({ map: carpetTex(), roughness: 0.95, side: THREE.DoubleSide });
  K.flagMat = std({ map: flagTex(), roughness: 0.8, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: flagTex(), emissiveIntensity: 0.25 });
  K.water = waterMat('#1a3a5a', 8);
  const fac = (tex, k = 1.6, metal = 0.1, rough = 0.6) => std({ map: tex.map, emissiveMap: tex.emissive, emissive: '#ffffff', emissiveIntensity: k, vertexColors: true, roughness: rough, metalness: metal });
  K.deira = deiraTex(); K.deiraMat = fac(K.deira, 1.5, 0.05, 0.85);
  K.glassT = [glassTex('#3a5a72', '#1a2430', ['#e8f4ff', '#fff4dc', '#d8ecff']), glassTex('#8a7a5a', '#3a3020', ['#fff0d0', '#ffe0a8']), glassTex('#2a3a4a', '#9aa4b0', ['#e8f0ff', '#fff8e8'], { band: 0.45 })];
  K.glassM = K.glassT.map((t) => fac(t, 1.6, 0.55, 0.25));
  K.res = resTex(); K.resMat = fac(K.res, 1.5, 0.1, 0.7);
  const sw = shopWinTex();
  K.winMat = basic({ map: sw, color: hdr('#ffffff', 1.05) });
  const tiledP = new Map(), tiledB = new Map();
  K.tiledPlane = (w, d, k) => { const key = `${w.toFixed(2)}|${d.toFixed(2)}|${k}`; if (!tiledP.has(key)) tiledP.set(key, planeUV({ u0: 0, u1: w / k, v0: 0, v1: d / k })); return tiledP.get(key); };
  K.tiledBox = (w, h, d, k = 2) => { const key = `${w.toFixed(1)}|${h.toFixed(1)}|${d.toFixed(1)}|${k}`; if (!tiledB.has(key)) tiledB.set(key, tiledBox(+w.toFixed(1), +h.toFixed(1), +d.toFixed(1), k)); return tiledB.get(key); };
  K.win = (n, kind) => { const key = `w${n}|${kind}`; if (!tiledP.has(key)) { const r = WIN[kind]; tiledP.set(key, planeUV({ u0: 0, u1: n, v0: 1 - (r + 1) / NWIN + 0.002, v1: 1 - r / NWIN - 0.002 })); } return tiledP.get(key); };
  K.pave = (b, x, z, w, d, y = 0.03) => b.add(K.tiledPlane(w, d, 3.5), K.paveMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0);
  K.road = (b, x, z, w, d, y = 0.035) => b.add(K.tiledPlane(w, d, 6), K.roadMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0);
  K.sand = (b, x, z, w, d, y = 0.03, col = 0xffffff) => b.add(K.tiledPlane(w, d, 7), K.sandMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0, col);
  K.lawn = (b, x, z, w, d, col = '#4a7a3a', y = 0.04) => b.add(G.plane, VC.solid, x, y, z, w, d, 1, -Math.PI / 2, 0, 0, col);
  K.poolMat = basic({ map: canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }, { repeat: false }),
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  K.pool = (b, x, z, w, d, col, y = 0.06) => b.add(G.plane, K.poolMat, x, y, z, w, d, 1, -Math.PI / 2, 0, 0, col);   // light spilt on the ground
  const ad = adAtlas();
  K.screen = screenMat(ad.tex, ad.cells, 1.4, 0.18);
  K.ledScreen = (b, x, y, z, w, h, ry = 0, bright = 1) => b.add(G.plane, K.screen, x, y, z, w, h, 1, 0, ry, 0, screenTint(bright));
  // the red lamps on the towers and the cranes, blinking together
  K.blinkRed = basic({ color: hdr('#ff2a1a', 3) });

  // ---------- the labels ----------
  // Every board, label and street plate is drawn once into one atlas and set with one material, so all the words in a chunk
  // cost a single draw (as in la_kit.js); their brightness rides in the vertex colour.
  const AW = 2048, AH = 4096, atlas = document.createElement('canvas'); atlas.width = AW; atlas.height = AH;
  const actx = atlas.getContext('2d'), atex = new THREE.CanvasTexture(atlas);
  atex.colorSpace = THREE.SRGBColorSpace; atex.anisotropy = 4;
  K.labelMat = basic({ map: atex, vertexColors: true, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, forceSinglePass: true });
  const slots = new Map(), shelves = [], NONE = { u0: 1 - 1 / AW, u1: 1 - 0.5 / AW, v0: 0.5 / AH, v1: 1 / AH };
  let top = 0, full = false;
  K.atlasFill = () => top / AH;
  const slot = (key, w, h, draw, gap = 4) => {
    if (slots.has(key)) return slots.get(key);
    const atX = (s) => (s.x ? s.x + Math.max(gap, s.gap) : 0);
    let s = shelves.find((s2) => s2.h >= h && s2.h <= h * 1.34 && atX(s2) + w <= AW);
    if (!s) {
      if (top + h > AH - 2) { if (!full) console.error('dubai label atlas is full'); full = true; slots.set(key, NONE); return NONE; }
      shelves.push((s = { y: top, h, x: 0, gap })); top += h + 4;
    }
    const ax = atX(s), ay = s.y, e = gap ? 0.5 : 1.5;
    s.x = ax + w; s.gap = gap;
    actx.save(); actx.translate(ax, ay); actx.beginPath(); actx.rect(0, 0, w, h); actx.clip(); actx.clearRect(0, 0, w, h); draw(actx, w, h); actx.restore();
    const r = { u0: (ax + e) / AW, u1: (ax + w - e) / AW, v0: 1 - (ay + h - e) / AH, v1: 1 - (ay + e) / AH };
    atex.needsUpdate = true;
    slots.set(key, r); return r;
  };
  const fit = (g, text, px, max, weight, font) => { g.font = `${weight} ${px}px ${font}`; const m = g.measureText(text).width; if (m > max) { px = Math.floor((px * max) / m); g.font = `${weight} ${px}px ${font}`; } return px; };
  // a board with the Arabic over the English (the law's order on Dubai's signs)
  const drawBoard = (g, sg, w, h) => {
    const st = sg.st, wood = st === 'wood', gold = st === 'gold', green = st === 'green';
    if (wood) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6a3e1e'); gr.addColorStop(1, '#4a2a12'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8a050'; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10); }
    else if (gold) { g.fillStyle = '#16120e'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8a050'; g.fillRect(0, h - 4, w, 4); }
    else if (green) { g.fillStyle = '#f4f8f4'; g.fillRect(0, 0, w, h); g.fillStyle = sg.c; const cx = h * 0.55, cy = h / 2, a = h * 0.16, b2 = h * 0.42; g.fillRect(cx - a / 2, cy - b2 / 2, a, b2); g.fillRect(cx - b2 / 2, cy - a / 2, b2, a); }
    else { g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, w, h); g.fillStyle = sg.c; g.fillRect(0, 0, w, h * 0.12); g.fillRect(0, h * 0.88, w, h * 0.12); }
    const ink = wood || gold ? '#ffd88a' : green ? '#1a6a2a' : sg.c;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const x0 = green ? w * 0.56 + h * 0.3 : w / 2, max = (green ? w - h * 1.1 : w) * 0.86;
    if (gold || wood) { g.shadowColor = 'rgba(255,200,90,0.8)'; g.shadowBlur = h * 0.08; }
    g.direction = 'rtl'; g.fillStyle = ink; fit(g, sg.ar, Math.floor(h * 0.42), max, wood ? 700 : 900, wood ? RUQAA : KUFI); g.fillText(sg.ar, x0, h * 0.38);
    g.direction = 'ltr'; fit(g, sg.en, Math.floor(h * 0.24), max, 700, gold ? SERIF : SANS); g.fillText(sg.en, x0, h * 0.75);
    g.shadowBlur = 0;
  };
  const board = (key, w, h, k, draw) => ({ ...slot(key, w, h, draw, 0), k });
  const SHOP_SIGNS = [...new Set([...DEIRA_SIGNS, ...SOUK_SIGNS, ...BLVD_SIGNS, ...MARINA_SIGNS, ...HERITAGE_SIGNS])];
  SHOP_SIGNS.forEach((sg, i) => { sg.r = board('s' + i, 384, 112, sg.st === 'box' || sg.st === 'green' ? 1.15 : 1.25, (g, w, h) => drawBoard(g, sg, w, h)); });
  K.plateRects = STREETS.map((st, i) => board('st' + i, 320, 96, 0.9, (g, w, h) => {   // a blue street plate, the white border, Arabic over English
    g.fillStyle = '#1a3a8a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.direction = 'rtl'; fit(g, st[0], 34, w * 0.86, 700, KUFI); g.fillText(st[0], w / 2, h * 0.36);
    g.direction = 'ltr'; fit(g, st[1], 24, w * 0.86, 700, SANS); g.fillText(st[1], w / 2, h * 0.74);
  }));
  K.board = (t, r, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => t.add(planeUV(r), K.labelMat, x, y, z, sx, sy, sz, rx, ry, rz, hdr('#ffffff', r.k));
  const drawLabel = (g, w, h, text, { color = '#ffffff', font = DISPLAY, weight = 400, size = 0.6, bg = null, border = null, glow = null, rtl = false }) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    if (border) { const m = Math.min(w, h); g.strokeStyle = border; g.lineWidth = m * 0.05; g.strokeRect(m * 0.07, m * 0.07, w - m * 0.14, h - m * 0.14); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color; g.direction = rtl ? 'rtl' : 'ltr';
    if (glow) { g.shadowColor = glow; g.shadowBlur = Math.min(w, h) * 0.12; }
    fit(g, text, Math.floor(h * size), w * 0.88, weight, font);
    g.fillText(text, w / 2, h / 2 + h * 0.04);
    if (glow) { g.shadowBlur = Math.min(w, h) * 0.03; g.fillText(text, w / 2, h / 2 + h * 0.04); }
  };
  K.labelRect = (text, o = {}) => {   // a label's cell in the atlas (Arabic text: rtl: true)
    const w = Math.round((o.w || 512) / 2), h = Math.round((o.h || 128) / 2);
    return slot(['h', text, w, h, o.color, o.font, o.weight, o.size, o.bg, o.border, o.glow].join('|'), w, h, (g) => drawLabel(g, w, h, text, o));
  };
  K.sign = (t, text, o = {}, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => t.add(planeUV(K.labelRect(text, o)), K.labelMat, x, y, z, sx, sy, sz, rx, ry, rz, hdr('#ffffff', o.k ?? 1.1));
  // two lines, the Arabic over the English, on one cell (station names, landmark plaques, gantries)
  K.biRect = (ar, en, { w = 512, h = 160, color = '#ffffff', bg = null, border = null, font = KUFI, enFont = SANS, glow = null } = {}) => {
    const W2 = Math.round(w / 2), H2 = Math.round(h / 2);
    return slot(['bi', ar, en, W2, H2, color, bg, border, font, enFont, glow].join('|'), W2, H2, (g, ww, hh) => {
      if (bg) { g.fillStyle = bg; g.fillRect(0, 0, ww, hh); }
      if (border) { g.strokeStyle = border; g.lineWidth = hh * 0.05; g.strokeRect(hh * 0.07, hh * 0.07, ww - hh * 0.14, hh - hh * 0.14); }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color;
      if (glow) { g.shadowColor = glow; g.shadowBlur = hh * 0.1; }
      g.direction = 'rtl'; fit(g, ar, Math.floor(hh * 0.4), ww * 0.88, 700, font); g.fillText(ar, ww / 2, hh * 0.36);
      g.direction = 'ltr'; fit(g, en, Math.floor(hh * 0.25), ww * 0.88, 700, enFont); g.fillText(en, ww / 2, hh * 0.76);
    });
  };
  K.bi = (t, ar, en, o = {}, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => t.add(planeUV(K.biRect(ar, en, o)), K.labelMat, x, y, z, sx, sy, sz, rx, ry, rz, hdr('#ffffff', o.k ?? 1.1));
  // builds fn(temp) on its own and sets it into b through the matrix m (for things that tilt or turn)
  K.place = (b, fn, m) => { const t = new Batcher(); fn(t); for (const [mat, list] of t.buckets) for (const g of list) b.addM(g, mat, m, null); };
  K.pick = (list) => pick(list);
  K.shopSign = (b, sg, x, y, z, s, w = 3.2, h = 0.92) => K.board(b, sg.r, x, y, z, w, h, 1, 0, face(s), 0);

  // ---------- trees ----------
  const TR = dubaiTreeKit();
  K.datePalm = TR.datePalm; K.clump = TR.clump; K.fanPalm = TR.fanPalm; K.ghaf = TR.ghaf; K.bougain = TR.bougain;
  K.palmRow = (b, x, z0, z1, { step = [11, 14], gaps = [], s = [0.85, 1.05], lit = false } = {}) => {
    const out = [];
    for (let z = z0 + rand(1, step[0] * 0.6); z < z1 - 1; z += rand(...step)) if (!gaps.some(([a, c]) => z > a - 1.2 && z < c + 1.2)) { K.datePalm(b, x, -z, rand(...s), { lit }); out.push(z); }
    return out;
  };
  K.shrub = (b, x, z, { y = 0, s = rand(0.6, 1.0), col = pick(['#2a4a2a', '#3a5a32', '#2e5a3a', '#4a6a3a']) } = {}) => b.add(G.sphLow, VC.solid, x, y + 0.35 * s, z, 1.2 * s, 0.8 * s, 1.2 * s, 0, rand(0, 3), 0, col);
  K.hedge = (b, x, z, w, d, h = 1.2, col = pick(['#2e4e2a', '#36582e', '#2a4626'])) => { b.block(VC.solid, col, x, 0, z, w, h, d); b.box(VC.solid, shade(col, 1.15), x, h, z, w + 0.06, 0.08, d + 0.06); };
  // a flower bed in a kerbed planter: petunias in rows of colour, as down Dubai's medians
  K.flowerBed = (b, x, z, w, d) => {
    b.block(VC.solid, '#d8ccb4', x, 0, z, w + 0.24, 0.3, d + 0.24); b.box(VC.solid, '#5a4430', x, 0.31, z, w, 0.02, d);
    const cols = [pick(['#e8288a', '#ff5ab0', '#c8187a']), pick(['#f4f0f8', '#ffd23d', '#ff8a1a']), pick(['#8a3ad8', '#e8288a', '#ff3a3a'])];
    for (let i = 0; i < Math.round(w * d * 5); i++) { const u = rand(-w / 2 + 0.1, w / 2 - 0.1), v = rand(-d / 2 + 0.1, d / 2 - 0.1); b.add(G.sphLow, VC.solid, x + u, 0.38, z + v, 0.16, 0.1, 0.16, 0, 0, 0, cols[Math.floor(((u + w / 2) / w) * 3) % 3]); }
  };

  // ---------- people ----------
  // On the pavements, hundreds: cheap figures of a handful of parts (a robe needs no legs). kind: 'kandura' (white robe,
  // white or red-checked ghutra, black agal), 'abaya' (black robe, black shayla), 'casual', 'worker' (blue overalls, a
  // hard hat or a cap), 'tourist' (shorts, a sun hat, a camera or a phone).
  const ROBE = taperGeo(1.32, 8);
  const pickKind = (mix) => { let r = Math.random() * Object.values(mix).reduce((a, c) => a + c, 0); for (const [k, v] of Object.entries(mix)) { r -= v; if (r <= 0) return k; } return 'casual'; };
  K.MIX = { street: { kandura: 3, abaya: 2, casual: 5, worker: 2, tourist: 1 }, blvd: { kandura: 3, abaya: 3, casual: 2, tourist: 4 }, souk: { kandura: 2, abaya: 2, casual: 3, tourist: 4 }, beach: { kandura: 1, abaya: 1, casual: 2, tourist: 6 } };
  K.walker = (b, x, z, { s = rand(0.92, 1.05), y = 0, kind = null, mix = K.MIX.street, phone = chance(0.25), bag = chance(0.2), ry = rand(-0.5, 0.5) + (chance(0.5) ? Math.PI : 0) } = {}) => {
    kind = kind || pickKind(mix);
    const ca = Math.cos(ry), sa = Math.sin(ry), skin = pick(SKIN), P = (fx, fz) => [x + (fx * ca + fz * sa) * s, z + (-fx * sa + fz * ca) * s];
    const head = (col = skin) => b.add(G.sphLow, VC.solid, x, y + 1.66 * s, z, 0.26 * s, 0.3 * s, 0.27 * s, 0, ry, 0, col);
    if (kind === 'kandura' || kind === 'abaya') {
      const ab = kind === 'abaya', robe = ab ? pick(['#141416', '#18181c', '#101012', '#1e1a1e']) : pick(KANDURA);
      b.add(ROBE, VC.solid, x, y + 0.75 * s, z, 0.42 * s, 1.5 * s, 0.3 * s, 0, ry, 0, robe);   // the robe from the shoulders to the ground
      for (const e of [-1, 1]) { const [px, pz] = P(e * 0.25, 0); b.add(G.box, VC.solid, px, y + 1.18 * s, pz, 0.1 * s, 0.5 * s, 0.13 * s, 0, ry, e * 0.08, robe); }   // the sleeves
      head(skin);
      if (ab) { b.add(G.sphLow, VC.solid, x, y + 1.69 * s, z, 0.31 * s, 0.34 * s, 0.31 * s, 0, ry, 0, '#141416'); const [hx, hz] = P(0, 0.06); b.add(G.box, VC.solid, hx, y + 1.5 * s, hz, 0.34 * s, 0.34 * s, 0.22 * s, 0, ry, 0, '#141416'); }   // the shayla over the head
      else {
        const gh = chance(0.75) ? '#f8f6f0' : '#e8d8d8', [bx, bz] = P(0, 0.08);
        b.add(G.sphLow, VC.solid, x, y + 1.74 * s, z, 0.3 * s, 0.22 * s, 0.3 * s, 0, ry, 0, gh);   // the ghutra over the crown
        b.add(G.box, VC.solid, bx, y + 1.55 * s, bz, 0.36 * s, 0.38 * s, 0.22 * s, 0, ry, 0, gh);   // falling to the shoulders
        b.add(G.tor, VC.solid, x, y + 1.82 * s, z, 0.32 * s, 0.32 * s, 0.6 * s, Math.PI / 2, ry, 0, '#141414');   // the agal
      }
    } else {
      const worker = kind === 'worker', tourist = kind === 'tourist', top = worker ? pick(['#2a4a9a', '#1e3a8a', '#3a5aa8']) : pick(TOPS), legs = worker ? top : tourist && chance(0.6) ? skin : pick(LEGS);
      for (const e of [-1, 1]) { const [px, pz] = P(e * 0.085, 0); b.add(G.box, VC.solid, px, y + 0.43 * s, pz, 0.15 * s, 0.86 * s, 0.19 * s, 0, ry, 0, legs); }
      if (tourist && legs === skin) { const sh = pick(LEGS); b.add(G.box, VC.solid, x, y + 0.78 * s, z, 0.4 * s, 0.24 * s, 0.24 * s, 0, ry, 0, sh); }
      b.add(G.box, VC.solid, x, y + 1.17 * s, z, 0.44 * s, 0.68 * s, 0.27 * s, 0, ry, 0, top);
      if (worker) { const [vx, vz] = P(0, -0.14); b.add(G.box, VC.glow, vx, y + 1.2 * s, vz, 0.4 * s, 0.05 * s, 0.01, 0, ry, 0, hdr('#d8ff3a', 0.9)); }   // the reflective band
      head(skin);
      const hk = worker ? (chance(0.5) ? 'helmet' : 'cap') : tourist ? pick(['sun', 'cap', 'none']) : pick(['none', 'none', 'cap', 'hair']);
      if (hk === 'helmet') b.add(G.sphLow, VC.solid, x, y + 1.8 * s, z, 0.32 * s, 0.18 * s, 0.32 * s, 0, ry, 0, pick(['#ffd23d', '#f4f4f0', '#ff8a1a']));
      else if (hk === 'cap') b.add(G.box, VC.solid, x, y + 1.8 * s, z, 0.28 * s, 0.1 * s, 0.3 * s, 0, ry, 0, pick(['#1a1a1e', '#c8302a', '#2a4a8a', '#f4f0e8']));
      else if (hk === 'sun') b.add(G.cyl8, VC.solid, x, y + 1.8 * s, z, 0.56 * s, 0.05 * s, 0.56 * s, 0, 0, 0, pick(['#e8d8a8', '#f4f0e0', '#d8c08a']));
      else b.add(G.sphLow, VC.solid, x, y + 1.76 * s, z + 0.02, 0.27 * s, 0.17 * s, 0.28 * s, 0, ry, 0, pick(HAIR));
    }
    if (phone) { const [px, pz] = P(0.1, -0.24); b.box(VC.glow, hdr('#cfe6ff', 1.4), px, y + 1.3 * s, pz, 0.07, 0.12, 0.02, ry); }
    if (bag) { const [bx, bz] = P(0.28, 0); b.box(VC.solid, pick(['#141414', '#c8a070', '#8a2a1a', '#f4f0e8', '#d8c8a0']), bx, y + 0.95 * s, bz, 0.09, 0.32, 0.3, ry); }
  };
  K.crowd = (b, x0, x1, z0, z1, n, opts = {}) => { for (let i = 0; i < n; i++) K.walker(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -rand(z0, z1), opts); };
  K.throng = (b, x0, x1, z0, z1, n, { gaps = [], ...opts } = {}) => {   // a crowd kept out of the given stretches (distances along the street)
    for (let i = 0, t = 0; i < n && t < n * 4; t++) {
      const z = rand(z0, z1);
      if (gaps.some(([a, c]) => z > a && z < c)) continue;
      K.walker(b, rand(Math.min(x0, x1), Math.max(x0, x1)), -z, opts); i++;
    }
  };
  K.queue = (b, x, z, n, dz = 0.62, opts = {}) => { for (let k = 0; k < n; k++) K.walker(b, x + rand(-0.12, 0.12), z + k * dz, { phone: chance(0.5), ...opts }); };
  // Up front, posed: jointed figures (la_kit.js's way: limbs are boxes between the joints). outfit: 'kandura', 'abaya',
  // 'casual', 'tourist', 'worker', 'chef'; pose: 'stand', 'walk', 'phone', 'camera', 'seated', 'push' (a porter's cart),
  // 'falcon' (a falcon on the gloved fist), 'lead' (a camel's halter), 'wave', 'drum'.
  K.person = (b, x, z, { s = rand(0.92, 1.05), y = 0, outfit = 'casual', pose = 'stand', ry = null, top = null } = {}) => {
    const a = ry ?? rand(-0.5, 0.5) + (chance(0.5) ? Math.PI : 0), ca = Math.cos(a), sa = Math.sin(a), skin = pick(SKIN);
    const W3 = (fx, fy, fz) => [x + (fx * ca + fz * sa) * s, y + fy * s, z + (-fx * sa + fz * ca) * s];
    const bone = (p, q, t, col) => beam(b, VC.solid, ...W3(...p), ...W3(...q), t * s, col);
    const part = (geo, fx, fy, fz, sx, sy, sz, col, rx = 0, rz = 0) => b.add(geo, VC.solid, ...W3(fx, fy, fz), sx * s, sy * s, sz * s, rx, a, rz, col);
    const robe = outfit === 'kandura' ? pick(KANDURA) : outfit === 'abaya' ? '#141416' : null;
    const c = robe || top || (outfit === 'worker' ? '#2a4a9a' : outfit === 'chef' ? '#f4f4f0' : pick(TOPS)), lg = outfit === 'worker' ? c : outfit === 'tourist' ? skin : pick(LEGS);
    const seated = pose === 'seated', hip = seated ? 0.5 : 0.9;
    if (seated) {
      for (const e of [-1, 1]) { bone([e * 0.09, 0.5, 0], [e * 0.1, 0.5, -0.42], 0.15, robe || lg); bone([e * 0.1, 0.5, -0.42], [e * 0.1, 0.06, -0.46], 0.12, robe || lg); }
      if (robe) part(G.box, 0, 0.42, -0.12, 0.42, 0.18, 0.62, robe);
    } else if (robe) {
      part(ROBE, 0, 0.72, 0, 0.44, 1.44, 0.32, robe);
      for (const e of [-1, 1]) part(G.box, e * 0.09, 0.04, -0.06, 0.12, 0.08, 0.26, outfit === 'kandura' ? '#7a4a2a' : '#141414');
    } else {
      const walk = pose === 'walk' || pose === 'push' || pose === 'lead', st = walk ? rand(0.3, 0.45) : 0;
      for (const e of [-1, 1]) {
        const foot = [e * 0.09, 0.08, walk ? e * st : 0], knee = [e * 0.09, 0.48, walk ? e * st * 0.5 : 0];
        bone(foot, knee, 0.12, outfit === 'tourist' ? skin : lg); bone(knee, [e * 0.095, hip, 0], 0.15, lg);
        part(G.box, foot[0], 0.04, foot[2] - 0.05, 0.12, 0.08, 0.26, pick(['#1a1a1a', '#e8e8e8', '#5a3a2a']));
      }
      if (outfit === 'tourist') part(G.box, 0, hip - 0.1, 0, 0.38, 0.24, 0.24, pick(LEGS));
      part(G.box, 0, hip + 0.02, 0, 0.36, 0.14, 0.22, lg);
    }
    part(G.box, 0, hip + 0.33, 0, 0.42, 0.5, 0.24, c);
    if (outfit === 'worker') part(G.box, 0, hip + 0.36, -0.125, 0.4, 0.05, 0.01, hdr('#d8ff3a', 0.9));
    const sh = hip + 0.55;
    for (const e of [-1, 1]) {
      const sx = e * 0.26;
      let el, hd;
      if (pose === 'camera') { el = [e * 0.24, sh - 0.2, -0.16]; hd = [e * 0.07, sh + 0.1, -0.26]; }
      else if (pose === 'phone' && e > 0) { el = [sx + 0.02, sh - 0.27, -0.04]; hd = [0.1, sh - 0.12, -0.27]; }
      else if (pose === 'push') { el = [sx, sh - 0.2, -0.25]; hd = [sx * 0.8, sh - 0.3, -0.55]; }
      else if (pose === 'falcon' && e < 0) { el = [sx - 0.04, sh - 0.3, -0.02]; hd = [sx - 0.02, sh - 0.22, -0.34]; }
      else if (pose === 'lead' && e > 0) { el = [sx + 0.04, sh - 0.25, -0.12]; hd = [sx + 0.06, sh - 0.3, -0.42]; }
      else if (pose === 'wave' && e > 0) { el = [sx + 0.18, sh + 0.12, 0]; hd = [sx + 0.2, sh + 0.42, -0.04]; }
      else if (pose === 'drum') { el = [e * 0.3, sh - 0.25, -0.18]; hd = [e * 0.16, sh - 0.3, -0.36]; }
      else { const sw = pose === 'walk' ? e * 0.12 : 0; el = [sx + e * 0.02, sh - 0.28, sw * 0.6]; hd = [sx + e * 0.01, sh - 0.56, sw]; }
      bone([sx, sh, 0], el, 0.105, c); bone(el, hd, 0.095, robe ? c : skin);
      if (robe) part(G.sphLow, ...hd, 0.08, 0.08, 0.08, skin);
    }
    if (pose === 'falcon') {   // the falcon on the gauntlet
      const [fx, fy, fz] = [-0.28, sh - 0.12, -0.34];
      part(G.box, -0.28, sh - 0.24, -0.3, 0.12, 0.12, 0.2, '#7a5232');
      part(G.sphLow, fx, fy + 0.04, fz, 0.13, 0.2, 0.15, '#5a5e66', 0.3);
      part(G.sphLow, fx, fy + 0.18, fz - 0.02, 0.09, 0.09, 0.09, '#7a5232');
    }
    if (pose === 'drum') part(G.cyl, 0, hip + 0.1, -0.3, 0.42, 0.34, 0.42, '#c8a060', Math.PI / 2);   // a tabl slung at the hip
    const H = seated ? 1.2 : hip + 0.75;
    part(G.sphLow, 0, H, 0, 0.24, 0.29, 0.25, skin);
    if (outfit === 'kandura') {
      const gh = chance(0.8) ? '#f8f6f0' : '#e8c8c8';
      part(G.sphLow, 0, H + 0.08, 0.01, 0.3, 0.22, 0.3, gh); part(G.box, 0, H - 0.12, 0.09, 0.34, 0.36, 0.12, gh);
      part(G.tor, 0, H + 0.15, 0.01, 0.3, 0.3, 0.55, '#141414', Math.PI / 2);
    } else if (outfit === 'abaya') { part(G.sphLow, 0, H + 0.03, 0.01, 0.3, 0.33, 0.3, '#141416'); part(G.box, 0, H - 0.18, 0.07, 0.34, 0.3, 0.16, '#141416'); }
    else if (outfit === 'worker') part(G.sphLow, 0, H + 0.13, 0, 0.3, 0.17, 0.3, pick(['#ffd23d', '#f4f4f0']));
    else if (outfit === 'chef') part(G.cyl8, 0, H + 0.2, 0, 0.26, 0.24, 0.26, '#ffffff');
    else if (outfit === 'tourist') part(G.cyl8, 0, H + 0.12, 0, 0.5, 0.04, 0.5, pick(['#e8d8a8', '#f4f0e0']));
    else part(G.sphLow, 0, H + 0.07, 0.025, 0.26, 0.18, 0.27, pick(HAIR));
    if (pose === 'camera') part(G.box, 0, H - 0.02, -0.29, 0.17, 0.1, 0.09, '#141414');
    else if (pose === 'phone') b.box(VC.glow, hdr('#cfe6ff', 1.4), ...W3(0.1, sh - 0.1, -0.3), 0.07 * s, 0.12 * s, 0.02, a);
  };

  // ---------- vehicles ----------
  // A car is its body's side profile extruded across its width, the glass a little narrower, the roof panel and pillars over
  // it, wheels, lamps (la_kit.js's way). kind: 'sedan', 'taxi' (cream, its roof the company's colour, the TAXI light), 'suv'
  // (the white Land Cruiser), 'super' (a wedge of a supercar), 'police' (the same in Dubai Police's white and green, its light
  // bar), 'lux' (a long upright limousine), 'gwagon' (a square box on wheels); dir: which way it faces (+1: away down the
  // track, the way traffic on the right-hand side goes; -1: toward you).
  const CAR = {
    sedan: { L: 4.85, W: 1.84, wr: 0.33, wu: 1.45, belt: 0.92, top: 1.45, hl: 0.68, tl: 0.8, body: [[-2.4, 0.3], [2.4, 0.3], [2.44, 0.62], [2.2, 0.8], [0.95, 0.92], [-1.6, 0.95], [-2.36, 0.92], [-2.46, 0.64]],
      cab: [[0.97, 0.9], [0.32, 1.38], [-0.95, 1.4], [-1.64, 0.93]], roof: [[0.34, 1.37], [0.3, 1.44], [-0.94, 1.45], [-0.99, 1.39]] },
    suv: { L: 4.95, W: 1.98, wr: 0.4, wu: 1.48, belt: 1.12, top: 1.88, hl: 0.9, tl: 1.05, body: [[-2.47, 0.4], [2.47, 0.4], [2.5, 0.78], [2.36, 1.04], [1.25, 1.12], [-2.42, 1.14], [-2.5, 0.8]],
      cab: [[1.27, 1.1], [0.62, 1.8], [-2.36, 1.82], [-2.42, 1.12]], roof: [[0.64, 1.79], [0.6, 1.87], [-2.38, 1.88], [-2.43, 1.81]] },
    super: { L: 4.75, W: 2.02, wr: 0.36, wu: 1.42, belt: 0.72, top: 1.12, hl: 0.5, tl: 0.72, body: [[-2.36, 0.18], [2.36, 0.18], [2.42, 0.4], [1.3, 0.62], [-1.85, 0.86], [-2.36, 0.84], [-2.44, 0.44]],
      cab: [[1.3, 0.6], [0.25, 1.08], [-0.85, 1.1], [-1.82, 0.86]], roof: [[0.27, 1.07], [0.24, 1.12], [-0.84, 1.13], [-0.88, 1.08]] },
    lux: { L: 5.45, W: 2.0, wr: 0.38, wu: 1.75, belt: 1.05, top: 1.6, hl: 0.82, tl: 0.92, body: [[-2.72, 0.34], [2.72, 0.34], [2.74, 0.94], [2.56, 1.04], [1.05, 1.07], [-2.05, 1.09], [-2.72, 1.0], [-2.76, 0.62]],
      cab: [[1.07, 1.05], [0.22, 1.55], [-1.45, 1.57], [-2.08, 1.07]], roof: [[0.24, 1.54], [0.2, 1.6], [-1.43, 1.61], [-1.48, 1.56]] },
    gwagon: { L: 4.7, W: 1.95, wr: 0.4, wu: 1.45, belt: 1.12, top: 1.95, hl: 0.92, tl: 1.0, body: [[-2.35, 0.42], [2.35, 0.42], [2.37, 1.06], [2.15, 1.13], [-2.35, 1.14]],
      cab: [[1.3, 1.12], [1.12, 1.88], [-2.3, 1.89], [-2.35, 1.13]], roof: [[1.14, 1.87], [1.12, 1.95], [-2.31, 1.96], [-2.36, 1.88]] },
  };
  CAR.taxi = CAR.sedan; CAR.police = CAR.super;
  const profiles = new Map();
  const extrude = (pts, w) => {
    const key = pts.flat().join(',') + '|' + w.toFixed(2);
    if (!profiles.has(key)) {
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v))), { depth: w, bevelEnabled: false });
      g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2);
      const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); profiles.set(key, n);
    }
    return profiles.get(key);
  };
  const GLASS = hdr('#2e3a4e', 0.95);
  K.car = (b, x, z, dir = 1, { kind = pick(['sedan', 'suv', 'suv', 'taxi', 'taxi', 'super', 'lux', 'gwagon']), col = null, lit = true, y = 0, lo = false } = {}) => {
    const C = CAR[kind], W = C.W, hw = W / 2, F = C.L / 2;
    const roofCol = kind === 'taxi' ? pick(TAXI_ROOFS) : null;
    col = col || (kind === 'taxi' ? '#e6dac0' : kind === 'police' ? '#f6f6f4' : kind === 'super' ? pick(['#ffd23d', '#ff7a1a', '#39b84a', '#d8202a', '#f4f4f2', '#1a1a1e', '#4a7ad8', '#c8c8cc']) : pick(CARS));
    const M0 = new THREE.Matrix4().makeRotationY(dir > 0 ? 0 : Math.PI).setPosition(x, y, z);
    const prof = (pts, w, mat, c) => b.addM(extrude(pts, w), mat, M0, c);
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
    const part = (geo, mat, c, px, py, pu, sx, sy, sz, rx = 0, rz = 0) => { _m.compose(_v.set(px, py, -pu), _q.setFromEuler(_e.set(rx, 0, rz)), _s.set(sx, sy, sz)); b.addM(geo, mat, _m.premultiply(M0), c); };
    const away = dir > 0;   // its tail toward the runner
    prof(C.body, W, kind === 'super' || kind === 'police' ? VC.metal : VC.solid, col);
    prof(C.cab, W - 0.14, VC.glow, GLASS); prof(C.roof, W - 0.12, VC.solid, roofCol || (kind === 'police' ? '#f6f6f4' : col));
    for (const u of [C.wu, -C.wu]) for (const e of [-1, 1]) part(lo ? G.box : G.cyl8, VC.solid, '#141414', e * (hw - 0.1), C.wr, u, lo ? 0.24 : C.wr * 2, lo ? C.wr * 2 : 0.26, C.wr * 2, 0, lo ? 0 : Math.PI / 2);
    for (const e of [-1, 1]) {
      part(G.box, VC.glow, hdr('#fff4d8', lit ? (away ? 0.6 : 3.4) : 0.4), e * (hw - 0.32), C.hl, F + 0.02, 0.4, 0.12, 0.05);   // the headlamps
      part(G.box, VC.glow, hdr('#ff2a2a', lit ? (away ? 2.6 : 0.7) : 0.5), e * (hw - 0.26), C.tl, -F - 0.02, 0.38, 0.12, 0.05);   // the tail lamps
    }
    if (lo) return;
    part(G.box, VC.solid, '#1a1a1e', 0, C.hl - 0.16, F + 0.01, W - 0.4, 0.14, 0.06);   // the grille
    if (kind === 'lux') { part(G.box, VC.metal, '#e8eaec', 0, C.hl, F + 0.03, 0.62, 0.42, 0.05); part(G.box, VC.metal, '#e8eaec', 0, C.belt + 0.04, F - 0.5, 0.05, 0.08, 0.1); }   // the tall chrome grille and its mascot
    if (kind === 'taxi') {   // the roof sign, lit
      part(G.box, VC.glow, hdr('#fff4d0', 1.6), 0, C.top + 0.12, -0.4, 0.62, 0.2, 0.26);
      part(G.box, VC.solid, roofCol, 0, C.top + 0.01, -0.4, 0.7, 0.04, 0.32);
    }
    if (kind === 'police') {   // Dubai Police's livery: the green band along the white, the light bar
      for (const e of [-1, 1]) part(G.box, VC.solid, '#0a6a3a', e * (hw + 0.004), C.belt - 0.12, 0, 0.012, 0.2, C.L * 0.86);
      part(G.box, VC.glow, hdr('#3a7aff', 3), -0.3, C.top + 0.06, -0.3, 0.5, 0.08, 0.18); part(G.box, VC.glow, hdr('#ff2a2a', 3), 0.3, C.top + 0.06, -0.3, 0.5, 0.08, 0.18);
    }
    if (kind === 'suv' && chance(0.3)) part(G.box, VC.metal, '#8a8e94', 0, C.top + 0.06, -0.4, W - 0.3, 0.05, 2.2);   // roof rails
  };
  // a red and white RTA bus (12 m): the dark band of windows, the destination's LEDs, the doors
  K.bus = (b, x, z, dir = 1) => {
    const L = 12, W = 2.55, H = 3.2, d = dir > 0 ? 1 : -1;
    b.box(VC.solid, '#f4f4f2', x, 1.75, z, W, 2.6, L);
    b.box(VC.solid, '#c8202a', x, 0.62, z, W + 0.02, 0.5, L - 0.2);
    b.box(VC.solid, '#c8202a', x, 3.02, z, W - 0.1, 0.12, L - 0.6);
    for (const e of [-1, 1]) {
      b.box(VC.glow, hdr('#e8e0c8', 0.75), x + e * (W / 2 + 0.01), 2.0, z, 0.02, 1.15, L - 1.4);
      for (let u = -L / 2 + 1.3; u < L / 2 - 1; u += 1.6) b.box(VC.solid, '#1a1a1e', x + e * (W / 2 + 0.02), 2.0, z + u, 0.02, 1.2, 0.08);
      for (const u of [-L * 0.32, L * 0.18]) b.box(VC.solid, '#2a2a30', x + e * (W / 2 + 0.015), 1.45, z + u, 0.02, 2.2, 1.2);
      for (const u of [-L * 0.35, L * 0.3]) b.cyl(VC.solid, '#141414', x + e * (W / 2 - 0.1), 0.5, z + u, 0.5, 0.3, 'cyl8', 0, Math.PI / 2);
    }
    b.box(VC.glow, hdr('#ffb43a', 1.8), x, 2.95, z + d * (L / 2 + 0.01), 1.6, 0.25, 0.02);   // the route and destination
    b.box(VC.glow, hdr('#2e3a4e', 0.9), x, 2.0, z + d * (L / 2 + 0.01), W - 0.2, 1.3, 0.02);
    for (const e of [-1, 1]) { b.box(VC.glow, hdr('#fff4d8', dir > 0 ? 0.6 : 3), x + e * 0.9, 0.85, z + d * (L / 2 + 0.02), 0.32, 0.14, 0.04); b.box(VC.glow, hdr('#ff2a2a', dir > 0 ? 2.4 : 0.6), x + e * 0.95, 0.9, z - d * (L / 2 + 0.02), 0.2, 0.3, 0.04); }
  };
  // a delivery rider on his motorbike, the insulated box on the back in his company's colour
  K.moto = (b, x, z, dir = 1) => {
    const d = dir > 0 ? 1 : -1, col = pick(['#ff6a1a', '#1ab8a8', '#ffd23d', '#e8202a', '#2a8a4a']);
    for (const u of [-0.62, 0.62]) b.cyl(VC.solid, '#141414', x, 0.32, z + u * d, 0.32, 0.12, 'cyl8', 0, Math.PI / 2);
    b.box(VC.solid, '#2a2a30', x, 0.62, z, 0.3, 0.36, 1.3);
    b.box(VC.solid, col, x, 1.18, z + 0.55 * d, 0.5, 0.48, 0.5);
    b.box(VC.glow, hdr('#fff4d8', d < 0 ? 3 : 0.5), x, 0.86, z - 0.72 * d, 0.14, 0.1, 0.04);
    b.box(VC.solid, col, x, 1.1, z - 0.05 * d, 0.4, 0.55, 0.32);   // the rider's jacket
    b.add(G.sphLow, VC.solid, x, 1.55, z - 0.05 * d, 0.3, 0.32, 0.32, 0, 0, 0, col);   // his helmet
  };
  // the traffic in the lane by the track (dir: +1 on the right-hand side, going away; -1 on the left, coming toward you)
  const VLEN = { sedan: 4.85, taxi: 4.85, suv: 4.95, super: 4.75, lux: 5.45, gwagon: 4.7, police: 4.75, bus: 12, moto: 1.8 };
  K.jam = (b, x, z0, z1, dir, { fill = 0.6, mix = { taxi: 6, suv: 5, sedan: 4, super: 1, lux: 1, gwagon: 1, police: 0.3, bus: 0.6, moto: 0.8 }, gaps = [] } = {}) => {
    let z = z0 + rand(0, 5);
    while (z < z1 - 4.5) {
      const k = pickKind(mix), len = VLEN[k];
      if (z + len > z1 - 0.3) { z += 2; continue; }
      if (gaps.some(([a, c]) => z + len > a - 0.8 && z < c + 0.8)) { z += 1.5; continue; }
      if (!chance(fill)) { z += rand(5, 12); continue; }
      const zc = -(z + len / 2);
      if (k === 'bus') K.bus(b, x, zc, dir); else if (k === 'moto') K.moto(b, x, zc, dir); else K.car(b, x, zc, dir, { kind: k });
      z += len + rand(0.8, 2.2);
    }
  };
  // a row of parked cars, nose in to the kerb
  K.carRow = (b, x, z0, z1, s, { p = 0.6, gaps = [] } = {}) => {
    for (let z = z0 + rand(0.5, 2); z < z1 - 2.6; z += 2.7) {
      if (gaps.some(([a, c]) => z > a - 1.4 && z < c + 1.4) || !chance(p)) continue;
      K.place(b, (t) => K.car(t, 0, 0, 1, { kind: pick(['suv', 'suv', 'sedan', 'lux', 'gwagon', 'super', 'sedan']), lit: false }), new THREE.Matrix4().makeRotationY((s * Math.PI) / 2).setPosition(x, 0, -z));
    }
  };

  // ---------- street furniture ----------
  // the street lights: 'twin' (the tall double-armed mast down the roads, its heads like lanterns), 'lantern' (an ornate
  // Arabic lantern on a fluted post: the boulevard, the souks, the old town), 'blade' (a slim LED blade: the Marina)
  K.lamp = (b, x, z, s, { kind = 'twin', light = '#ffd9a0' } = {}) => {
    if (kind === 'lantern') {
      b.cyl(VC.metal, '#2a2a2e', x, 1.8, z, 0.09, 3.6, 'cyl8'); b.cyl(VC.metal, '#2a2a2e', x, 0.25, z, 0.22, 0.5, 'cyl8');
      b.add(G.cone8, VC.metal, x, 4.25, z, 0.5, 0.3, 0.5, Math.PI, 0, 0, '#c8a050');
      b.add(G.cyl8, VC.glow, x, 3.9, z, 0.42, 0.55, 0.42, 0, 0, 0, hdr(light, 3));
      b.add(G.cone8, VC.metal, x, 4.45, z, 0.5, 0.35, 0.5, 0, 0, 0, '#c8a050'); b.sph(VC.metal, '#c8a050', x, 4.68, z, 0.07);
      K.pool(b, x, z, 4.6, 4.6, hdr(light, 0.35));
      return;
    }
    if (kind === 'blade') { b.box(VC.metal, '#d8dadc', x, 3.2, z, 0.14, 6.4, 0.24); b.box(VC.glow, hdr('#f4f8ff', 2.4), x - s * 0.08, 3.2, z, 0.02, 5.6, 0.12); K.pool(b, x - s * 0.8, z, 3, 3, hdr('#f4f8ff', 0.25)); return; }
    const h = 10;
    b.cyl(VC.metal, '#8a8e94', x, h / 2, z, 0.13, h, 'cyl8');
    for (const e of [-1, 1]) {   // the two arms, the heads over the road and the pavement
      const ex = x + e * 1.5;
      beam(b, VC.metal, x, h - 0.6, z, ex, h - 0.1, z, 0.08, '#8a8e94');
      b.add(G.box, VC.metal, ex, h - 0.18, z, 0.72, 0.18, 0.36, 0, 0, 0, '#9a9ea4');
      b.box(VC.glow, hdr(light, 3.2), ex, h - 0.3, z, 0.6, 0.06, 0.28);
      K.pool(b, ex, z, 6, 6, hdr(light, 0.32));
    }
  };
  // the air-conditioned bus shelter: a glass box, its AC unit on the roof, the RTA's sign, people waiting in the cool
  K.busShelter = (b, x, z, s) => {
    const w = 1.8, L = 4.4;
    b.block(VC.solid, '#d8dcdc', x, 0, z, w, 0.12, L);
    b.box(VC.glow, hdr('#d8ecf4', 0.55), x, 1.35, z, w - 0.1, 2.4, L - 0.1);
    for (const u of [-L / 2, -L / 4, 0, L / 4, L / 2]) b.box(VC.metal, '#c8ccd0', x + s * (w / 2), 1.35, z + u, 0.06, 2.5, 0.06);
    b.block(VC.solid, '#c8ccd0', x, 2.6, z, w + 0.2, 0.18, L + 0.2);
    b.block(VC.metal, '#b8bcc0', x, 2.78, z + L / 4, 1.0, 0.5, 1.2);   // the AC unit
    K.bi(b, 'محطة حافلات', 'BUS STOP', { w: 384, h: 128, color: '#ffffff', bg: '#c8202a' }, x - s * (w / 2 + 0.03), 2.25, z - L / 2 + 0.7, 1.1, 0.36, 1, 0, face(s), 0);
    K.pool(b, x, z, 3, 5.5, hdr('#d8f0ff', 0.25));
  };
  K.flagPole = (b, x, z, { h = 9, w = 2.4 } = {}) => {   // a flagpole and the flag, a little lifted by the breeze
    b.cyl(VC.metal, '#d8dadc', x, h / 2, z, 0.06, h, 'cyl8'); b.sph(VC.metal, '#c8a050', x, h + 0.05, z, 0.09);
    b.add(G.plane, K.flagMat, x, h - w * 0.28, z - w / 2 - 0.05, w, w / 2, 1, 0, Math.PI / 2 + rand(-0.25, 0.25), 0);
  };
  // bunting in the flag's colours strung along the street (National Day is a month away)
  K.bunting = (b, x0, x1, y, z, { sag = 0.6 } = {}) => {
    const n = Math.max(3, Math.round(Math.abs(x1 - x0) / 0.5)), cols = ['#e8112d', '#00843d', '#ffffff', '#141414'];
    beam(b, VC.solid, x0, y, z, (x0 + x1) / 2, y - sag, z, 0.02, '#8a8a8a'); beam(b, VC.solid, (x0 + x1) / 2, y - sag, z, x1, y, z, 0.02, '#8a8a8a');
    for (let i = 1; i < n; i++) { const t = i / n, xx = x0 + (x1 - x0) * t, yy = y - sag * 4 * t * (1 - t); b.add(G.cone4, VC.solid, xx, yy - 0.2, z, 0.28, 0.36, 0.02, Math.PI, 0, 0, cols[i % 4]); }
  };
  // a string of lanterns (the souks, the cafés): pierced brass, glowing
  K.lanterns = (b, x0, x1, y, z, { sag = 0.5, n = null, cols = ['#ffb040', '#ff8a3a', '#ffd070', '#ff6a5a'] } = {}) => {
    n = n || Math.max(3, Math.round(Math.abs(x1 - x0) / 1.1));
    beam(b, VC.solid, x0, y, z, (x0 + x1) / 2, y - sag, z, 0.025, '#3a2a1a'); beam(b, VC.solid, (x0 + x1) / 2, y - sag, z, x1, y, z, 0.025, '#3a2a1a');
    for (let i = 1; i < n; i++) { const t = i / n, xx = x0 + (x1 - x0) * t, yy = y - sag * 4 * t * (1 - t) - 0.3; b.add(G.sphLow, VC.glow, xx, yy, z, 0.24, 0.34, 0.24, 0, 0, 0, hdr(pick(cols), 2.4)); b.add(G.cone8, VC.metal, xx, yy + 0.22, z, 0.22, 0.14, 0.22, 0, 0, 0, '#c8a050'); }
  };
  K.lanternZ = (b, x, y, z0, z1, opts = {}) => {   // the same strung along the street
    const n = Math.max(3, Math.round(Math.abs(z1 - z0) / 1.2)), sag = opts.sag ?? 0.4, cols = opts.cols || ['#ffb040', '#ff8a3a', '#ffd070', '#ff6a5a'];
    beam(b, VC.solid, x, y, -z0, x, y - sag, -(z0 + z1) / 2, 0.025, '#3a2a1a'); beam(b, VC.solid, x, y - sag, -(z0 + z1) / 2, x, y, -z1, 0.025, '#3a2a1a');
    for (let i = 1; i < n; i++) { const t = i / n, zz = z0 + (z1 - z0) * t, yy = y - sag * 4 * t * (1 - t) - 0.3; b.add(G.sphLow, VC.glow, x, yy, -zz, 0.24, 0.34, 0.24, 0, 0, 0, hdr(pick(cols), 2.4)); }
  };
  K.bench = (b, x, z, s) => { b.box(VC.solid, '#8a6a4a', x, 0.45, z, 0.5, 0.06, 1.8); b.box(VC.solid, '#8a6a4a', x + s * 0.24, 0.72, z, 0.06, 0.4, 1.8); for (const u of [-0.75, 0.75]) b.box(VC.metal, '#3a3a40', x, 0.22, z + u, 0.45, 0.44, 0.06); };
  K.bin = (b, x, z) => { b.cyl(VC.solid, '#5a5e64', x, 0.48, z, 0.26, 0.96, 'cyl8'); b.cyl(VC.metal, '#c8ccd0', x, 0.98, z, 0.28, 0.06, 'cyl8'); };
  K.hydrant = (b, x, z) => { b.cyl(VC.solid, '#d8202a', x, 0.4, z, 0.13, 0.8, 'cyl8'); b.sph(VC.solid, '#d8202a', x, 0.82, z, 0.13, true); for (const e of [-1, 1]) b.box(VC.solid, '#c8c8c8', x + e * 0.15, 0.55, z, 0.1, 0.1, 0.1); };
  K.meter = (b, x, z, s) => { b.box(VC.metal, '#5a5e64', x, 0.5, z, 0.12, 1.0, 0.12); b.box(VC.solid, '#ff7a1a', x, 1.25, z, 0.32, 0.5, 0.24); b.box(VC.glow, hdr('#8ad8ff', 1.2), x - s * 0.125, 1.32, z, 0.02, 0.14, 0.18); };   // the orange RTA parking machine
  K.streetPlate = (b, x, z, s, i = randi(0, STREETS.length - 1)) => { b.cyl(VC.metal, '#5a5e64', x, 1.4, z, 0.04, 2.8, 'cyl6'); K.board(b, K.plateRects[i], x, 2.6, z, 1.5, 0.45, 1, 0, face(s), 0); };
  // a dallah, Arabic coffee's pot, as big as a car on its plinth (the city's roundabouts and squares)
  K.dallah = (b, x, z, s = 1) => {
    b.block(VC.solid, '#e8dcc0', x, 0, z, 2.6 * s, 0.9 * s, 2.6 * s);
    const gold = '#c89a3a', y = 0.9 * s;
    b.add(taperGeo(0.75, 16), VC.metal, x, y + 0.9 * s, z, 1.9 * s, 1.8 * s, 1.9 * s, 0, 0, 0, gold);
    b.add(G.sph, VC.metal, x, y + 1.9 * s, z, 1.3 * s, 0.8 * s, 1.3 * s, 0, 0, 0, gold);
    b.add(taperGeo(1.4, 16), VC.metal, x, y + 2.55 * s, z, 0.7 * s, 0.6 * s, 0.7 * s, 0, 0, 0, gold);
    b.add(G.cone, VC.metal, x, y + 3.25 * s, z, 0.9 * s, 0.9 * s, 0.9 * s, 0, 0, 0, gold); b.sph(VC.metal, gold, x, y + 3.8 * s, z, 0.12 * s);
    beam(b, VC.metal, x + 0.7 * s, y + 1.2 * s, z, x + 1.5 * s, y + 2.8 * s, z, 0.22 * s, gold);   // the beak of a spout
    beam(b, VC.metal, x - 0.75 * s, y + 2.2 * s, z, x - 1.15 * s, y + 1.4 * s, z, 0.14 * s, gold);   // the handle
    K.pool(b, x, z, 6 * s, 6 * s, hdr('#ffd9a0', 0.35));
  };
  // the gantry over the far lanes of the road (never over the track): blue boards with the destinations, Arabic and English
  K.gantry = (b, x0, x1, z, { y = 7.2 } = {}) => {
    for (const x of [x0, x1]) b.cyl(VC.metal, '#9aa0a8', x, y / 2, z, 0.25, y, 'cyl8');
    b.box(VC.metal, '#8a9098', (x0 + x1) / 2, y - 0.2, z, Math.abs(x1 - x0), 0.35, 0.35);
    const n = Math.max(1, Math.floor(Math.abs(x1 - x0) / 4.4)), w = Math.abs(x1 - x0) / n;
    for (let i = 0; i < n; i++) { const [ar, en] = pick(GANTRY); K.bi(b, ar, en, { w: 512, h: 224, color: '#ffffff', bg: '#1a4aa8', border: '#ffffff' }, Math.min(x0, x1) + w * (i + 0.5), y + 1.1, z + 0.2, w - 0.3, 1.9, 1, 0, 0, 0); }
  };
  // a Salik toll gate over the road: the blue beam with its name, the cameras and readers looking down at the lanes
  K.salik = (b, x0, x1, z, { y = 6.6 } = {}) => {
    for (const x of [x0, x1]) b.block(VC.metal, '#c8ccd0', x, 0, z, 0.5, y, 0.5);
    b.box(VC.solid, '#1a3a8a', (x0 + x1) / 2, y, z, Math.abs(x1 - x0) + 0.5, 0.9, 0.6);
    K.bi(b, 'سالك', 'SALIK', { w: 384, h: 128, color: '#ffffff' }, (x0 + x1) / 2, y, z + 0.31, 2.4, 0.8, 1, 0, 0, 0);
    for (let x = Math.min(x0, x1) + 1.5; x < Math.max(x0, x1) - 1; x += 3.4) { b.box(VC.solid, '#2a2a30', x, y - 0.65, z, 0.4, 0.3, 0.5); b.box(VC.glow, hdr('#ff3a3a', 1.6), x, y - 0.65, z + 0.26, 0.08, 0.08, 0.02); }
  };
  // a billboard on its tall pole by the road: an LED screen cycling its adverts
  K.billboard = (b, x, z, s, { y = 12, w = 12, h = 6 } = {}) => {
    b.cyl(VC.metal, '#7a7e84', x, y / 2, z, 0.45, y, 'cyl8');
    b.block(VC.solid, '#1a1a1e', x, y - h / 2 - 0.2, z, 0.6, h + 0.4, w + 0.4);
    K.ledScreen(b, x - s * 0.31, y, z, w, h, face(s), 1.1);
  };
  // the shawarma stand at a cafeteria's door: the cone of meat on its spit before the glowing grill, the counter
  K.shawarma = (b, x, z, s) => {
    b.block(VC.metal, '#c8ccd0', x, 0, z, 1.0, 1.0, 1.6);
    b.box(VC.glow, hdr('#ff7a2a', 2.2), x + s * 0.2, 1.6, z, 0.06, 0.9, 0.5);
    b.add(taperGeo(0.6, 10), VC.solid, x - s * 0.05, 1.55, z, 0.44, 0.75, 0.44, Math.PI, 0, 0, '#8a4a1e');
    b.cyl(VC.metal, '#d8dadc', x - s * 0.05, 1.5, z, 0.02, 1.1, 'cyl6');
    K.pool(b, x - s * 0.6, z, 2.2, 2.2, hdr('#ff9a4a', 0.4));
  };
  // a karak tea counter: the big pots steaming, the paper cups stacked, a queue
  K.karak = (b, x, z, s) => {
    b.block(VC.solid, '#6a3e22', x, 0, z, 0.9, 1.05, 1.8);
    for (const u of [-0.45, 0.4]) { b.cyl(VC.metal, '#d8dadc', x, 1.25, z + u, 0.22, 0.4, 'cyl8'); K.steamAt(x, 1.5, z + u); }
    for (let k = 0; k < 4; k++) b.cyl(VC.solid, '#f4f0e8', x - s * 0.25, 1.12 + k * 0.06, z, 0.05, 0.06, 'cyl6');
  };
  // a fruit-juice stand: the fruit heaped in its trays, the blender, bright strip lights
  K.juice = (b, x, z, s) => {
    b.block(VC.solid, '#f4f0e8', x, 0, z, 1.0, 0.95, 2.2);
    for (let k = 0; k < 18; k++) b.add(G.sphLow, VC.solid, x + rand(-0.35, 0.35), 1.02 + rand(0, 0.15), z + rand(-0.95, 0.95), 0.2, 0.2, 0.2, 0, 0, 0, pick(['#ff8a1a', '#ffd23d', '#3aa83a', '#d82a2a', '#e8e040', '#ffb0c0']));
    b.box(VC.glow, hdr('#f4fff4', 2.2), x, 2.2, z, 1.0, 0.06, 2.2);
    b.box(VC.solid, '#2aa84a', x, 2.3, z, 1.1, 0.12, 2.3);
  };
  // a porter's wooden handcart, stacked with cartons (and sometimes the porter with it)
  K.cart = (b, x, z, { ry = rand(0, Math.PI), porter = chance(0.5) } = {}) => {
    const c = Math.cos(ry), sn = Math.sin(ry), P = (u, v) => [x + u * c + v * sn, z - u * sn + v * c];
    for (const e of [-1, 1]) { const [wx, wz] = P(e * 0.45, 0.4); b.cyl(VC.solid, '#3a2a1a', wx, 0.25, wz, 0.25, 0.06, 'cyl8', 0, Math.PI / 2); }
    b.add(G.box, VC.solid, x, 0.5, z, 1.0, 0.08, 1.6, 0, ry, 0, '#8a6a4a');
    for (let k = 0; k < randi(2, 5); k++) { const [cx, cz] = P(rand(-0.25, 0.25), rand(-0.5, 0.4)); b.add(G.box, VC.solid, cx, 0.75 + k * 0.42, cz, rand(0.6, 0.8), 0.4, rand(0.5, 0.7), 0, ry + rand(-0.2, 0.2), 0, pick(['#c8a070', '#b89060', '#d8b888', '#a87a4a', '#e8e0d0'])); }
    for (const e of [-1, 1]) { const [ax, az] = P(e * 0.35, -0.75), [hx, hz] = P(e * 0.32, -1.1); beam(b, VC.solid, ax, 0.55, az, hx, 0.95, hz, 0.05, '#5a4030'); }   // the handles
    if (porter) K.person(b, ...P(0, -1.5), { outfit: 'casual', pose: 'push', ry });
  };
  // a camel: the long legs, the hump under its saddle cloth, the neck curving up to the small head; kneel: folded down
  // on the sand; or a dromedary's head turned to look at you
  K.camel = (b, x, z, { ry = rand(0, Math.PI * 2), kneel = false, s = rand(0.95, 1.08), y: y0 = 0, cloth = pick(['#c8202a', '#e8a020', '#2a5aa8', '#8a2a5a', '#1a7a4a']) } = {}) => {
    const c = Math.cos(ry), sn = Math.sin(ry), W = (u, y, v) => [x + (u * c + v * sn) * s, y0 + y * s, z + (-u * sn + v * c) * s];
    const col = pick(['#c8a070', '#b8905e', '#d4b080', '#a87e50']), dark = shade(col, 0.8);
    const by = kneel ? 0.95 : 1.85;
    b.add(G.sph, VC.solid, ...W(0, by, 0), 1.0 * s, 0.85 * s, 1.9 * s, 0, ry, 0, col);
    b.add(G.sph, VC.solid, ...W(0, by + 0.5, 0.05), 0.75 * s, 0.75 * s, 0.9 * s, 0, ry, 0, col);   // the hump
    b.add(G.box, VC.solid, ...W(0, by + 0.62, 0.05), 1.06 * s, 0.06 * s, 1.0 * s, 0, ry, 0, cloth);   // its saddle cloth
    for (const e of [-1, 1]) b.add(G.box, VC.solid, ...W(e * 0.53, by + 0.32, 0.05), 0.04 * s, 0.55 * s, 1.0 * s, 0, ry, 0, cloth);
    for (let k = 0; k < 5; k++) b.add(G.sphLow, VC.solid, ...W(0.55, by + 0.04, -0.4 + k * 0.2), 0.06 * s, 0.14 * s, 0.06 * s, 0, ry, 0, pick(['#ffd23d', '#ffffff', '#ff3a3a']));   // the tassels
    const N0 = W(0, by + 0.15, -0.85), N1 = W(0, by + 0.9, -1.35), H0 = W(0, by + 1.15, -1.55);
    beam(b, VC.solid, ...N0, ...N1, 0.28 * s, col); beam(b, VC.solid, ...N1, ...H0, 0.22 * s, col);
    b.add(G.box, VC.solid, ...W(0, by + 1.12, -1.75), 0.22 * s, 0.24 * s, 0.5 * s, 0, ry, 0, col);   // the head
    for (const e of [-1, 1]) b.add(G.box, VC.solid, ...W(e * 0.08, by + 1.3, -1.6), 0.05 * s, 0.1 * s, 0.05 * s, 0, ry, 0, dark);   // the ears
    beam(b, VC.solid, ...W(0, by + 0.1, 0.92), ...W(0, by - 0.6, 1.0), 0.07 * s, dark);   // the tail
    if (kneel) { for (const u of [-0.6, 0.6]) for (const e of [-1, 1]) b.add(G.box, VC.solid, ...W(e * 0.3, 0.2, u), 0.22 * s, 0.4 * s, 0.7 * s, 0, ry, 0, dark); return; }
    for (const u of [-0.62, 0.62]) for (const e of [-1, 1]) {   // the legs: thigh, the knob of the knee, the shin, the broad foot
      const kx = e * 0.32, kz = u + (u < 0 ? -0.05 : 0.08);
      beam(b, VC.solid, ...W(kx, by - 0.2, u), ...W(kx, 0.95, kz), 0.2 * s, col); b.add(G.sphLow, VC.solid, ...W(kx, 0.95, kz), 0.2 * s, 0.2 * s, 0.2 * s, 0, 0, 0, dark);
      beam(b, VC.solid, ...W(kx, 0.95, kz), ...W(kx, 0.1, u), 0.13 * s, col); b.add(G.box, VC.solid, ...W(kx, 0.05, u - 0.04), 0.26 * s, 0.1 * s, 0.32 * s, 0, ry, 0, dark);
    }
  };
  K.cat = (b, x, z, { ry = rand(0, 6) } = {}) => {   // a street cat, sitting
    const col = pick(['#c8a070', '#f4f0e8', '#3a3a3a', '#d8a050', '#8a7a6a']);
    b.add(G.sphLow, VC.solid, x, 0.18, z, 0.22, 0.3, 0.3, 0, ry, 0, col); b.add(G.sphLow, VC.solid, x - Math.sin(ry) * 0.12, 0.38, z - Math.cos(ry) * 0.12, 0.16, 0.15, 0.15, 0, ry, 0, col);
    for (const e of [-1, 1]) b.add(G.cone4, VC.solid, x - Math.sin(ry) * 0.12 + Math.cos(ry) * e * 0.05, 0.47, z - Math.cos(ry) * 0.12 - Math.sin(ry) * e * 0.05, 0.05, 0.07, 0.05, 0, ry, 0, col);
  };

  // ---------- boats ----------
  // an abra: the creek's wooden water taxi, its flat canopy on posts, the passengers on the bench down the middle facing
  // out, the driver in the well at the stern by the engine; lit with a string of bulbs at night
  K.abra = (b, x, y, z, { ry = 0, people = true, col = pick(['#8a5a2a', '#7a4a22', '#9a6a3a']) } = {}) => {
    K.place(b, (t) => {
      t.add(G.sph, VC.solid, 0, 0.1, 0, 2.1, 0.9, 8.4, 0, 0, 0, col);
      t.box(VC.solid, shade(col, 1.25), 0, 0.5, 0, 2.0, 0.12, 7.6);
      t.box(VC.solid, pick(['#2a6a8a', '#c8202a', '#e8c040', '#2a8a4a']), 0, 0.42, 0, 2.06, 0.1, 7.8);
      t.box(VC.solid, '#5a3a1e', 0, 0.72, 0, 0.5, 0.35, 5.4);
      for (const u of [-2.6, 0, 2.6]) for (const e of [-1, 1]) t.box(VC.solid, '#5a3a1e', e * 0.85, 1.35, u, 0.07, 1.4, 0.07);
      t.box(VC.solid, '#e8dcc0', 0, 2.08, 0, 2.0, 0.08, 6.0);
      for (let u = -2.8; u <= 2.8; u += 0.7) t.add(G.sphLow, VC.glow, 0.98, 1.98, u, 0.1, 0.1, 0.1, 0, 0, 0, hdr('#ffd890', 2.6));
      if (people) for (let k = 0; k < randi(3, 7); k++) K.walker(t, (k % 2 ? 0.35 : -0.35), -2.2 + k * 0.7, { y: 0.0, s: 0.62, ry: k % 2 ? Math.PI / 2 : -Math.PI / 2, mix: K.MIX.souk, bag: false });
    }, new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z));
  };
  // a dhow: the wooden trader moored at the wharf, high stern with its gallery, the long raked bow, the mast, piled with
  // cargo for Iran, Somalia, India: tyres, fridges in their cartons, sacks, a pickup truck lashed on top; bulbs along her
  K.dhow = (b, x, y, z, { ry = 0, L = rand(18, 24), cargo = true, lights = true } = {}) => {
    K.place(b, (t) => {
      const wood = pick(['#7a4a22', '#8a5a2a', '#6a3e1a']);
      t.add(G.sph, VC.solid, 0, 0.6, 0, 5.2, 3.2, L, 0, 0, 0, wood);
      t.box(VC.solid, shade(wood, 1.2), 0, 1.6, 0, 4.6, 0.3, L * 0.86);
      t.box(VC.solid, '#e8dcc0', 0, 1.25, 0, 5.24, 0.3, L * 0.9);   // the white strake along her side
      t.block(VC.solid, wood, 0, 1.6, L * 0.36, 4.4, 2.6, L * 0.2);   // the high stern
      t.box(VC.solid, shade(wood, 1.3), 0, 4.3, L * 0.36, 4.6, 0.2, L * 0.22);
      for (let k = 0; k < 6; k++) t.box(VC.solid, shade(wood, 1.4), -2.25 + k * 0.9, 4.75, L * 0.36 + L * 0.1, 0.12, 0.7, 0.12);   // its carved gallery
      beam(t, VC.solid, 0, 1.4, -L * 0.42, 0, 4.2, -L * 0.6, 0.35, wood);   // the raked stem
      t.cyl(VC.solid, wood, 0, 8, -L * 0.1, 0.2, 13, 'cyl8');   // the mast
      beam(t, VC.solid, 0, 12.5, -L * 0.1, 0, 6, L * 0.3, 0.06, '#2a2a2a'); beam(t, VC.solid, 0, 12.5, -L * 0.1, 0, 2.5, -L * 0.48, 0.06, '#2a2a2a');
      if (cargo) for (let k = 0; k < randi(10, 16); k++) {
        const u = rand(-L * 0.3, L * 0.2), kind = Math.random();
        if (kind < 0.3) t.cyl(VC.solid, '#1a1a1a', rand(-1.4, 1.4), 2.0 + rand(0, 1.6), u, 0.45, 0.3, 'cyl8', Math.PI / 2);   // tyres
        else if (kind < 0.6) t.block(VC.solid, pick(['#e8e4dc', '#d8d0c0', '#c8a070']), rand(-1.4, 1.4), 1.75, u, rand(0.8, 1.2), rand(1.2, 1.9), rand(0.8, 1.1));   // fridges and cartons
        else t.add(G.sphLow, VC.solid, rand(-1.4, 1.4), 2.0, u, 1.0, 0.6, 0.7, 0, rand(0, 3), 0, pick(['#e8dcc0', '#c8b890', '#f4f0e8']));   // sacks
      }
      if (lights) for (let u = -L * 0.42; u < L * 0.42; u += 0.8) t.add(G.sphLow, VC.glow, 2.6, 1.9, u, 0.12, 0.12, 0.12, 0, 0, 0, hdr(pick(['#ffd890', '#fff0c0']), 2.6));
    }, new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z));
  };
  // a white yacht at its berth: the hull, the decks stepping back, the dark band of glass, the flybridge
  K.yacht = (b, x, y, z, { ry = 0, L = rand(16, 30) } = {}) => {
    K.place(b, (t) => {
      t.add(G.sph, VC.solid, 0, 0.8, 0, L * 0.22, 2.6, L, 0, 0, 0, '#f6f6f4');
      t.box(VC.solid, '#1a2a3a', 0, 0.9, 0, L * 0.215, 0.25, L * 0.86);
      t.block(VC.solid, '#f4f4f2', 0, 1.9, L * 0.05, L * 0.17, 1.6, L * 0.6);
      t.box(VC.glow, hdr('#2a3a4e', 1.2), 0, 2.7, L * 0.05, L * 0.172, 0.6, L * 0.56);
      t.block(VC.solid, '#f4f4f2', 0, 3.5, L * 0.12, L * 0.13, 1.2, L * 0.35);
      t.box(VC.glow, hdr('#ffe8c0', 1.4), 0, 4.1, L * 0.12, L * 0.132, 0.4, L * 0.3);
      for (let u = -L * 0.4; u < L * 0.4; u += 1.2) t.add(G.sphLow, VC.glow, L * 0.11, 1.6, u, 0.08, 0.08, 0.08, 0, 0, 0, hdr('#bfe6ff', 2.2));
    }, new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z));
  };
  // a dhow on its dinner cruise: the old hull, the deck roofed over and glassed in, strung all round with lights
  K.cruise = (b, x, y, z, { ry = 0 } = {}) => {
    K.place(b, (t) => {
      const L = 26;
      t.add(G.sph, VC.solid, 0, 0.6, 0, 6, 3, L, 0, 0, 0, '#6a3e1a');
      t.block(VC.solid, '#5a3418', 0, 1.6, 0, 5.4, 2.2, L * 0.7);
      t.box(VC.glow, hdr('#ffd9a0', 1.3), 0, 2.7, 0, 5.42, 1.1, L * 0.66);
      t.box(VC.solid, '#e8dcc0', 0, 3.85, 0, 5.8, 0.12, L * 0.74);
      for (let u = -L * 0.38; u < L * 0.38; u += 0.6) for (const e of [-1, 1]) t.add(G.sphLow, VC.glow, e * 2.95, 3.95, u, 0.12, 0.12, 0.12, 0, 0, 0, hdr(pick(['#ff5a8a', '#ffd23d', '#3ad8ff', '#7aff6a']), 2.8));
    }, new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z));
  };
  K.jetski = (b, x, y, z, { ry = rand(0, 6) } = {}) => K.place(b, (t) => { t.add(G.sph, VC.solid, 0, 0.3, 0, 1.0, 0.5, 2.8, 0, 0, 0, pick(['#f4f4f2', '#ffd23d', '#2a8ad8', '#e8202a'])); t.box(VC.solid, '#1a1a1e', 0, 0.62, 0.2, 0.4, 0.2, 0.9); K.walker(t, 0, 0.15, { y: 0.2, s: 0.8, kind: 'tourist', ry: 0 }); }, new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z));

  // ---------- steam, smoke and incense ----------
  K.steamBuf = []; K.smokeBuf = [];
  K.steamAt = (x, y, z) => K.steamBuf.push([x, y, z]);
  K.smokeAt = (x, y, z) => K.smokeBuf.push([x, y, z]);   // incense from a burner, shisha smoke
  K.puffMats = [];
  // flush a built chunk: its steam and smoke as one billboard mesh each
  K.flush = (g) => {
    const st = K.steamBuf.splice(0), sm = K.smokeBuf.splice(0);
    if (st.length) { const m = puffs(st, { size: 0.32, grow: 2.2, rise: 1.7, drift: 0.25, life: 3.4, n: 4, color: '#f4f0e8', opacity: 0.26 }); g.add(m); K.puffMats.push(m); }
    if (sm.length) { const m = puffs(sm, { size: 0.24, grow: 2.6, rise: 2.4, drift: 0.4, life: 5, n: 4, color: '#d8ccc0', opacity: 0.22 }); g.add(m); K.puffMats.push(m); }
    return g;
  };
  K.update = (t) => {
    for (const m of K.puffMats) m.userData.update(t);
    K.water.userData.scroll.offset.y = -t * 0.015;
    K.screen.uniforms.time.value = t;
    K.blinkRed.color.set('#ff2a1a').multiplyScalar(Math.sin(t * 2.4) > 0.1 ? 3.2 : 0.3);
  };
  return K;
}
