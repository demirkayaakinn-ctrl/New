import './styles.css';
import L from 'leaflet';
import jsQR from 'jsqr';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { StatusBar, Style } from '@capacitor/status-bar';
import turkey from './turkey.json';
import {
  REGIONS, PROVINCES, SPECIES, REGION_BEST, STEPS, STAGES, NATIONAL, DEMO_PENS, FALLBACK_LOC,
} from './data.js';

const IMG = {
  ogm: 'img/ogm-logo.png',
  squirrel: 'img/sincap.png',
  tx: 'img/tohumix-logo.png',
  txw: 'img/tohumix-logo-white.png',
};

/* ------------------------------------------------------------------ */
/* İkonlar                                                             */
/* ------------------------------------------------------------------ */
const sv = (p, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${p}</svg>`;
const I = {
  qr: sv('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h3v4h-3"/>'),
  home: sv('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  map: sv('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
  sprout: sv('<path d="M12 21v-9"/><path d="M12 12c0-4 3-7 8-7 0 5-3 8-8 7z"/><path d="M12 14c0-3-2.5-6-7-6 0 4 2.5 6.5 7 6z"/>'),
  back: sv('<path d="M15 18l-6-6 6-6"/>'),
  close: sv('<path d="M6 6l12 12M18 6L6 18"/>'),
  camera: sv('<path d="M3 8a2 2 0 012-2h2l2-2h6l2 2h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><circle cx="12" cy="13" r="4"/>'),
  pin: sv('<path d="M12 21s-7-6.2-7-12a7 7 0 1114 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
  check: sv('<path d="M20 6L9 17l-5-5"/>'),
  info: sv('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>'),
  share: sv('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>'),
  teacher: sv('<circle cx="9" cy="7" r="3"/><path d="M3 21v-2a5 5 0 015-5h2a5 5 0 015 5v2"/><path d="M15 4h6v6h-6"/>'),
  student: sv('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>'),
  parent: sv('<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.2"/><path d="M2 21v-2a5 5 0 015-5h2a5 5 0 015 5v2M14 21v-1.5a3.5 3.5 0 013.5-3.5h0a3.5 3.5 0 013.5 3.5V21"/>'),
  pen: sv('<path d="M16 3l5 5L8 21H3v-5z"/><path d="M13 6l5 5"/>'),
  user: sv('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  ff: sv('<path d="M4 6l7 6-7 6zM13 6l7 6-7 6z"/>'),
  flash: sv('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  image: sv('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>'),
  refresh: sv('<path d="M21 12a9 9 0 11-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
  school: sv('<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M10 21v-5h4v5"/>'),
};

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = (n) => Math.round(n).toLocaleString('tr-TR');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY = 86400000;
const isNative = Capacitor.isNativePlatform();

function dateTR(ts) {
  return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function timeTR(ts) {
  return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}
function toast(msg, ms = 2400) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Kalıcı veri                                                          */
/* ------------------------------------------------------------------ */
const KEY = 'ogm-ormani-demo-v1';
let db = { user: null, plantings: [] };
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) db = { user: null, plantings: [], ...JSON.parse(raw) };
  } catch (e) { /* yok say */ }
}
function save() {
  for (let i = 0; i < 6; i++) {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
      return;
    } catch (e) {
      // Kota dolduysa en eski günlük fotoğraflarını temizle
      const p = db.plantings.find((x) => x.journal && x.journal.length > 1);
      if (p) p.journal.splice(1, 1);
      else break;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Coğrafya                                                             */
/* ------------------------------------------------------------------ */
function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inTurkey(lat, lng) {
  return turkey.geometry.coordinates.some((poly) => pointInRing(lng, lat, poly[0]));
}
function nearestProvince(lat, lng) {
  let best = null;
  let bd = Infinity;
  for (const p of PROVINCES) {
    const d = (p[1] - lat) ** 2 + ((p[2] - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bd) { bd = d; best = p; }
  }
  return { name: best[0], region: best[3], far: Math.sqrt(bd) > 3 };
}

// Türkiye geneli temsili dikim noktaları
let SEED_POINTS = null;
function seedPoints() {
  if (SEED_POINTS) return SEED_POINTS;
  const r = rng(2026);
  const total = PROVINCES.reduce((a, p) => a + p[4], 0);
  const keys = Object.keys(SPECIES);
  const pts = [];
  const N = 2400;
  for (let i = 0; i < N; i++) {
    let x = r() * total;
    let prov = PROVINCES[0];
    for (const p of PROVINCES) { x -= p[4]; if (x <= 0) { prov = p; break; } }
    let lat;
    let lng;
    for (let k = 0; k < 10; k++) {
      // Box–Muller
      const u = Math.max(r(), 1e-9);
      const v = r();
      const g1 = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      const g2 = Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v);
      lat = prov[1] + g1 * 0.28;
      lng = prov[2] + g2 * 0.36;
      if (inTurkey(lat, lng)) break;
      lat = null;
    }
    if (lat == null) continue;
    const best = REGION_BEST[prov[3]];
    const sp = r() < 0.7 ? best : keys[Math.floor(r() * keys.length)];
    pts.push({ lat, lng, sp, prov: prov[0] });
  }
  SEED_POINTS = pts;
  return pts;
}

function provinceTotals() {
  const total = PROVINCES.reduce((a, p) => a + p[4], 0);
  const map = {};
  let acc = 0;
  PROVINCES.forEach((p, i) => {
    const r = rng(i + 7)();
    const v = Math.round((NATIONAL.trees * p[4] / total) * (0.85 + r * 0.3));
    map[p[0]] = v;
    acc += v;
  });
  // toplamı tam tutturmak için farkı Ankara'ya ekle
  map.Ankara += NATIONAL.trees - acc;
  for (const pl of db.plantings) map[pl.province] = (map[pl.province] || 0) + 1;
  return map;
}

/* ------------------------------------------------------------------ */
/* QR çözümleme                                                         */
/* ------------------------------------------------------------------ */
function parsePen(text) {
  if (!text) return null;
  const t = String(text).trim();
  const m = t.match(/TX\d{2}-\d{4,8}/i);
  if (!m) return null;
  const id = m[0].toUpperCase();
  let sp = null;
  const sm = t.toUpperCase().match(/(KARACAM|SARICAM|KIZILCAM|HALEP)/);
  if (sm) sp = sm[1];
  if (!sp) {
    const d = DEMO_PENS.find((p) => p[0] === id);
    sp = d ? d[1] : 'KARACAM';
  }
  return { id, species: sp };
}

/* ------------------------------------------------------------------ */
/* Durum + yönlendirme                                                  */
/* ------------------------------------------------------------------ */
const state = {
  stack: [],
  pen: null, // { id, species }
  draft: null, // { photo, lat, lng, acc, approx, province, region, student }
};
let cleanup = null; // aktif ekranın temizleme fonksiyonu

const root = document.getElementById('app');

function go(name, params = {}, { replace = false } = {}) {
  if (replace) state.stack.pop();
  state.stack.push({ name, params });
  render();
}
function back() {
  if ($('.sheet-bg')) { closeSheet(); return true; }
  if (state.stack.length > 1) {
    state.stack.pop();
    render();
    return true;
  }
  return false;
}
function home() {
  state.stack = [{ name: 'home', params: {} }];
  state.pen = null;
  state.draft = null;
  render();
}
function tab(name) {
  state.stack = [{ name, params: {} }];
  render();
}

const SCREENS = {};
function render() {
  if (cleanup) { try { cleanup(); } catch (e) { /* */ } cleanup = null; }
  const cur = state.stack[state.stack.length - 1];
  const s = SCREENS[cur.name];
  root.innerHTML = '';
  const out = s(cur.params);
  if (typeof out === 'function') cleanup = out;
  if (isNative) {
    const dark = ['scan', 'camera'].includes(cur.name);
    StatusBar.setBackgroundColor({ color: dark ? '#000000' : '#1c4d29' }).catch(() => {});
  }
}

function topbar({ title = 'OGM ORMANI', backBtn = false, right = '' } = {}) {
  return `<header class="topbar">
    ${backBtn ? `<button class="icon-btn" data-act="back" aria-label="Geri">${I.back}</button>` : ''}
    <div class="pill"><img src="${IMG.ogm}" alt=""><b>${esc(title)}</b></div>
    ${right}
  </header>`;
}
function nav(active) {
  return `<nav class="nav">
    <button data-tab="home" class="${active === 'home' ? 'on' : ''}">${I.home}Ana Sayfa</button>
    <button data-tab="panel" class="${active === 'panel' ? 'on' : ''}">${I.map}OGM Ormanı</button>
    <div><button class="qr-fab" data-act="scan" aria-label="QR okut">${I.qr}</button></div>
    <button data-tab="mine" class="${active === 'mine' ? 'on' : ''}">${I.sprout}Fidanlarım</button>
    <button data-tab="profile" class="${active === 'profile' ? 'on' : ''}">${I.user}Profil</button>
  </nav>`;
}
function mount(html) {
  root.innerHTML = html;
  $$('[data-act="back"]', root).forEach((b) => b.addEventListener('click', back));
  $$('[data-act="scan"]', root).forEach((b) => b.addEventListener('click', () => go('scan')));
  $$('[data-tab]', root).forEach((b) => b.addEventListener('click', () => tab(b.dataset.tab)));
}

function userLabel(u) {
  if (!u) return '';
  if (u.type === 'teacher') return u.name;
  if (u.type === 'student') return u.value;
  return u.name;
}
function userTypeLabel(u) {
  return { teacher: 'Öğretmen', student: 'Öğrenci', parent: 'Veli' }[u?.type] || '';
}
function stageOf(p) {
  const days = (Date.now() - p.plantedAt) / DAY + (p.simDays || 0);
  let idx = 0;
  STAGES.forEach((s, i) => { if (days >= s.day) idx = i; });
  return { idx, days };
}

/* ------------------------------------------------------------------ */
/* Fidan çizimi (gelişim aşamasına göre)                                */
/* ------------------------------------------------------------------ */
function plantSvg(stage) {
  const soil = '<ellipse cx="100" cy="196" rx="70" ry="10" fill="#6b4423"/>';
  if (stage === 0) {
    return `<svg viewBox="0 0 200 200">${soil}
      <rect x="70" y="150" width="70" height="12" rx="6" fill="#c9a46a" transform="rotate(-25 105 156)"/>
      <rect x="128" y="125" width="16" height="12" rx="3" fill="#333" transform="rotate(-25 105 156)"/>
      <circle cx="88" cy="186" r="4" fill="#8a5a2b"/><circle cx="104" cy="190" r="4" fill="#8a5a2b"/><circle cx="118" cy="185" r="4" fill="#8a5a2b"/></svg>`;
  }
  if (stage === 1) {
    return `<svg viewBox="0 0 200 200">${soil}
      <path d="M100 196 C100 180 98 172 104 164" stroke="#7cc142" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M104 164 c-6 -8 -16 -8 -20 -4 c6 6 14 8 20 4z" fill="#9bd35c"/></svg>`;
  }
  if (stage === 2) {
    return `<svg viewBox="0 0 200 200">${soil}
      <path d="M100 196 V140" stroke="#6aa63a" stroke-width="6" stroke-linecap="round"/>
      ${[-60, -35, -10, 10, 35, 60].map((a) => `<path d="M100 142 l0 -26" stroke="#4f9a3a" stroke-width="4" stroke-linecap="round" transform="rotate(${a} 100 142)"/>`).join('')}</svg>`;
  }
  if (stage === 3) {
    return `<svg viewBox="0 0 200 200">${soil}
      <path d="M100 196 V96" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round"/>
      <polygon points="100,70 70,130 130,130" fill="#3f8a45"/>
      <polygon points="100,96 62,160 138,160" fill="#2b6a35"/></svg>`;
  }
  return `<svg viewBox="0 0 200 200">${soil}
    <path d="M100 196 V60" stroke="#8a5a2b" stroke-width="10" stroke-linecap="round"/>
    <polygon points="100,12 68,70 132,70" fill="#4f9a3a"/>
    <polygon points="100,40 56,112 144,112" fill="#3f8a45"/>
    <polygon points="100,74 44,160 156,160" fill="#2b6a35"/></svg>`;
}
const pineArt = `<svg viewBox="0 0 120 160" aria-hidden="true">
  <rect x="55" y="120" width="10" height="40" fill="#8a5a2b"/>
  <polygon points="60,4 30,60 90,60" fill="#7cc142"/>
  <polygon points="60,30 20,95 100,95" fill="#5aa33f"/>
  <polygon points="60,62 10,132 110,132" fill="#3f8a45"/></svg>`;

/* ------------------------------------------------------------------ */
/* EKRAN: Ana sayfa                                                     */
/* ------------------------------------------------------------------ */
SCREENS.home = () => {
  const total = NATIONAL.trees + db.plantings.length;
  const pct = (total / NATIONAL.target) * 100;
  const mine = db.plantings.length;
  const greet = db.user
    ? `Merhaba <b>${esc(userLabel(db.user))}</b>! Kalemin bitti mi? <b>QR'ını okut</b>, birlikte dikelim.`
    : `Merhaba! Ben <b>Fındık</b>. Tohumix kalemin bitince <b>çöpe değil toprağa</b>! QR'ını okut, ormana katıl.`;
  mount(`${topbar()}
  <main class="screen">
    <section class="hero">
      <div class="speech">${greet}</div>
      <div class="trees"><i></i><i></i><i></i><i></i><i></i></div>
      <img class="squirrel" src="${IMG.squirrel}" alt="Sincap">
      <div class="ground"></div>
    </section>
    <div class="pad stack">
      <button class="btn sun" data-act="scan">${I.qr} Kalemin QR'ını okut</button>
      <div class="stat-grid">
        <div class="stat big">
          <div class="row between"><span>Türkiye genelinde dikilen fidan</span><span class="live">CANLI</span></div>
          <b>${fmt(total)}</b>
          <div class="progress"><i style="width:${pct.toFixed(2)}%"></i></div>
          <div class="row between mt8"><span>Hedef: ${fmt(NATIONAL.target)}</span><span>%${pct.toFixed(1).replace('.', ',')}</span></div>
        </div>
        <div class="stat"><b>${fmt(NATIONAL.schools)}</b><span>Katılan okul</span></div>
        <div class="stat"><b>${fmt(NATIONAL.students + mine)}</b><span>Öğrenci</span></div>
      </div>
      <button class="card flat row" data-go="panel" style="width:100%;text-align:left">
        <div style="width:52px;height:52px;border-radius:14px;background:var(--leaf-soft);display:grid;place-items:center;color:var(--forest)">${I.map}</div>
        <div class="grow"><b style="color:var(--forest)">OGM Ormanı haritası</b><div class="sub">Tüm dikimleri Türkiye haritasında gör</div></div>
        <span style="color:var(--forest)">${I.back.replace('<svg', '<svg style="transform:rotate(180deg);width:22px"')}</span>
      </button>
      <button class="card flat row" data-go="mine" style="width:100%;text-align:left">
        <div style="width:52px;height:52px;border-radius:14px;background:var(--sun-soft);display:grid;place-items:center;color:var(--forest)">${I.sprout}</div>
        <div class="grow"><b style="color:var(--forest)">Fidanlarım</b><div class="sub">${mine ? `${mine} fidan takip ediliyor` : 'Henüz dikim yok — ilk fidanını dik!'}</div></div>
        <span style="color:var(--forest)">${I.back.replace('<svg', '<svg style="transform:rotate(180deg);width:22px"')}</span>
      </button>
      <div class="card flat">
        <div class="eyebrow">Nasıl çalışır?</div>
        <ol class="steps mt8">
          <li><div><b>Yaz</b><span>Bitmeyen uçlu Tohumix kalemini sonuna kadar kullan.</span></div></li>
          <li><div><b>Dik</b><span>Öğretmenin ve orman ekibiyle OGM'nin belirlediği alana dik.</span></div></li>
          <li><div><b>Okut</b><span>Etiketteki QR'ı okut, fotoğraf çek — konumun haritaya işlensin.</span></div></li>
          <li><div><b>Takip et</b><span>Fidanının büyümesini buradan izle, paylaş.</span></div></li>
        </ol>
      </div>
      <img class="tx-logo" src="${IMG.tx}" alt="Tohumix – Bitmeyen Tohumlu Kalem">
      <p class="foot-note">Her kalem bir fidan · Sıfır atık · Sıfır kesim</p>
    </div>
  </main>
  ${nav('home')}`);
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => tab(b.dataset.go)));
};

/* ------------------------------------------------------------------ */
/* Kamera yardımcıları                                                  */
/* ------------------------------------------------------------------ */
async function openCamera(video) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-media');
  // iOS Safari: playsinline/muted/autoplay, akış bağlanmadan önce ayarlanmalı
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('autoplay', '');
  video.muted = true;
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
  });
  video.srcObject = stream;
  await video.play().catch(() => {});
  return stream;
}
function stopStream(stream) {
  stream?.getTracks().forEach((t) => t.stop());
}
function fileToDataUrl(file, max = 960) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const sc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * sc);
      c.height = Math.round(img.height * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      res(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

/* ------------------------------------------------------------------ */
/* EKRAN: QR okut                                                       */
/* ------------------------------------------------------------------ */
SCREENS.scan = () => {
  mount(`<div class="scanner">
    <video></video>
    <div class="overlay"><div class="frame"><div class="laser"></div></div>
      <p class="hint">Kalemin etiketindeki QR kodu çerçeveye getir</p></div>
    <div class="top"><button class="icon-btn" data-act="back" aria-label="Kapat">${I.close}</button>
      <div class="grow center" style="font-weight:700">QR Okut</div><span style="width:40px"></span></div>
    <div class="bottom">
      <button class="btn light small" id="demoPen">${I.pen} QR yok mu? Demo kalem kullan</button>
    </div>
  </div>`);
  const video = $('video');
  let stream = null;
  let raf = 0;
  let alive = true;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const found = (pen) => {
    if (!alive) return;
    alive = false;
    if (navigator.vibrate) navigator.vibrate(60);
    onPenScanned(pen);
  };
  const tick = () => {
    if (!alive) return;
    if (video.readyState >= 2 && video.videoWidth) {
      const w = 480;
      const h = Math.round((video.videoHeight / video.videoWidth) * w);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h);
      const code = jsQR(d.data, w, h, { inversionAttempts: 'attemptBoth' });
      if (code?.data) {
        const pen = parsePen(code.data);
        if (pen) { found(pen); return; }
        $('.hint').textContent = 'Bu bir Tohumix kalem QR kodu değil. Etiketteki QR\'ı okut.';
      }
    }
    raf = requestAnimationFrame(tick);
  };
  openCamera(video).then((s) => {
    stream = s;
    if (!alive) { stopStream(s); return; }
    raf = requestAnimationFrame(tick);
  }).catch(() => {
    $('.overlay').innerHTML = `<div class="err">Kameraya erişilemedi.<br>Ayarlardan kamera iznini verip tekrar dene ya da aşağıdan demo kalemi kullan.</div>`;
  });
  $('#demoPen').addEventListener('click', () => {
    const used = new Set(db.plantings.map((p) => p.penId));
    const next = DEMO_PENS.find((p) => !used.has(p[0])) || DEMO_PENS[0];
    found({ id: next[0], species: next[1] });
  });
  return () => { alive = false; cancelAnimationFrame(raf); stopStream(stream); };
};

function onPenScanned(pen) {
  const existing = db.plantings.find((p) => p.penId === pen.id);
  if (existing) {
    toast('Bu kalem zaten dikildi — fidanını takip et 🌱');
    state.stack = [{ name: 'mine', params: {} }, { name: 'detail', params: { id: existing.id } }];
    render();
    return;
  }
  state.pen = pen;
  state.draft = null;
  if (db.user) go('seed', {}, { replace: true });
  else go('login', {}, { replace: true });
}

function penBanner() {
  if (!state.pen) return '';
  const sp = SPECIES[state.pen.species];
  return `<div class="pen-banner"><div class="ico">${I.check}</div>
    <div class="grow"><b>Kalem tanındı</b><small>Kod: ${esc(state.pen.id)} · Tohum: ${esc(sp.name)}</small></div></div>`;
}

/* ------------------------------------------------------------------ */
/* EKRAN: Giriş                                                          */
/* ------------------------------------------------------------------ */
SCREENS.login = (params) => {
  let type = params.type || 'teacher';
  let sMode = 'rumuz';
  const draw = () => {
    const forms = {
      teacher: `
        <label class="field"><span>Ad Soyad</span><input id="f_name" autocomplete="name" placeholder="Örn. Ayşe Yılmaz"></label>
        <label class="field"><span>Okul</span><input id="f_school" placeholder="Örn. Atatürk İlkokulu"></label>
        <label class="field"><span>Sınıf / Şube</span><input id="f_class" placeholder="Örn. 4-B"></label>
        <p class="sub">Öğretmen olarak giriş yaparsan, her dikimde öğrencinin rumuzunu ekleyerek tüm sınıfın kalemlerini tek telefondan kaydedebilirsin.</p>`,
      student: `
        <div class="seg" id="seg">
          ${[['rumuz', 'Rumuz'], ['sinif', 'Sınıf kodu'], ['no', 'Öğrenci no']].map(([k, l]) => `<button data-m="${k}" class="${sMode === k ? 'on' : ''}">${l}</button>`).join('')}
        </div>
        <label class="field"><span>${{ rumuz: 'Rumuzun', sinif: 'Sınıf kodu', no: 'Öğrenci numarası' }[sMode]}</span>
          <input id="f_value" placeholder="${{ rumuz: 'Örn. Yıldız-07', sinif: 'Örn. ATA-4B', no: 'Örn. 1254' }[sMode]}" ${sMode === 'no' ? 'inputmode="numeric"' : ''}></label>
        <label class="field"><span>Okul (isteğe bağlı)</span><input id="f_school" placeholder="Örn. Atatürk İlkokulu"></label>
        <p class="sub">Gerçek adını yazmana gerek yok. Rumuzunla ormanın bir parçası ol!</p>`,
      parent: `
        <label class="field"><span>Ad Soyad</span><input id="f_name" autocomplete="name" placeholder="Örn. Mehmet Demir"></label>
        <label class="field"><span>Telefon</span><input id="f_phone" type="tel" inputmode="tel" placeholder="05xx xxx xx xx"></label>
        <label class="field"><span>Çocuğunuzun rumuzu (isteğe bağlı)</span><input id="f_child" placeholder="Örn. Yıldız-07"></label>`,
    };
    mount(`${topbar({ backBtn: true, title: 'Giriş' })}
    <main class="screen"><div class="pad stack">
      ${penBanner()}
      <div><h1 class="title">Fidanını kim dikiyor?</h1>
      <p class="sub mt8">Uygulama indirmeden, birkaç bilgiyle giriş yap.</p></div>
      <div class="tabs">
        <button data-t="teacher" class="${type === 'teacher' ? 'on' : ''}">${I.teacher}Öğretmen</button>
        <button data-t="student" class="${type === 'student' ? 'on' : ''}">${I.student}Öğrenci</button>
        <button data-t="parent" class="${type === 'parent' ? 'on' : ''}">${I.parent}Veli</button>
      </div>
      ${forms[type]}
      <label class="check"><input type="checkbox" id="kvkk" checked><span>Kişisel verilerin yalnızca OGM Ormanı projesi kapsamında işlenmesine ilişkin <span class="link">aydınlatma metnini</span> okudum.</span></label>
      <button class="btn" id="go">Devam et</button>
    </div></main>`);
    $$('[data-t]').forEach((b) => b.addEventListener('click', () => { type = b.dataset.t; draw(); }));
    $$('#seg [data-m]').forEach((b) => b.addEventListener('click', () => { sMode = b.dataset.m; draw(); }));
    $('#go').addEventListener('click', submit);
  };
  const val = (id) => ($(id)?.value || '').trim();
  const submit = () => {
    if (!$('#kvkk').checked) { toast('Devam etmek için aydınlatma metnini onayla'); return; }
    let u;
    if (type === 'teacher') {
      if (!val('#f_name')) { toast('Lütfen adını yaz'); $('#f_name').focus(); return; }
      u = { type, name: val('#f_name'), school: val('#f_school') || 'Atatürk İlkokulu', cls: val('#f_class') };
    } else if (type === 'student') {
      if (!val('#f_value')) { toast('Lütfen bu alanı doldur'); $('#f_value').focus(); return; }
      u = { type, mode: sMode, value: val('#f_value'), school: val('#f_school') };
    } else {
      if (!val('#f_name')) { toast('Lütfen adınızı yazın'); $('#f_name').focus(); return; }
      const ph = val('#f_phone').replace(/\D/g, '');
      if (ph.length < 10) { toast('Telefon numarasını kontrol edin'); $('#f_phone').focus(); return; }
      u = { type, name: val('#f_name'), phone: val('#f_phone'), child: val('#f_child') };
    }
    db.user = u;
    save();
    if (state.pen) go('seed', {}, { replace: true });
    else home();
  };
  draw();
};

/* ------------------------------------------------------------------ */
/* EKRAN: Tohum kartı + dikim talimatı                                   */
/* ------------------------------------------------------------------ */
SCREENS.seed = () => {
  const sp = SPECIES[state.pen.species];
  mount(`${topbar({ backBtn: true, title: 'Tohumun' })}
  <main class="screen">
    <section class="seed-hero" style="background:linear-gradient(160deg, var(--forest) 0%, ${sp.color} 140%)">
      <span class="tag sun">Kalemindeki tohum</span>
      <h2>${esc(sp.name)}</h2>
      <div class="latin">${esc(sp.latin)}</div>
      <p>${esc(sp.desc)}</p>
      <div class="pine">${pineArt}</div>
    </section>
    <div class="pad stack">
      ${penBanner()}
      <div class="facts">
        <div><small>Çimlenme</small><b>${esc(sp.germination)}</b></div>
        <div><small>Yükselti</small><b>${esc(sp.altitude)}</b></div>
        <div><small>Dikim zamanı</small><b>${esc(sp.season)}</b></div>
      </div>
      <div class="card flat">
        <div class="eyebrow">En iyi yetiştiği bölgeler</div>
        <div class="seg mt8">${sp.regions.map((r) => `<button class="on" style="pointer-events:none">${REGIONS[r]}</button>`).join('')}</div>
      </div>
      <div class="card">
        <div class="eyebrow">Nasıl dikilir?</div>
        <ol class="steps mt8">${STEPS.map((s) => `<li><div><b>${s.t}</b><span>${s.d}</span></div></li>`).join('')}</ol>
      </div>
      <button class="btn sun" id="plant">${I.camera} Diktim! Fotoğrafını çek</button>
      <p class="foot-note">Fotoğraf çekildiğinde konumun otomatik alınır ve OGM Ormanı haritasına işlenir.</p>
    </div>
  </main>`);
  $('#plant').addEventListener('click', () => go('camera'));
};

/* ------------------------------------------------------------------ */
/* EKRAN: Fotoğraf çek                                                  */
/* ------------------------------------------------------------------ */
SCREENS.camera = (params) => {
  const journalFor = params.journalFor; // takip fotoğrafı ise fidan id'si
  mount(`<div class="scanner">
    <video></video>
    <div class="top"><button class="icon-btn" data-act="back" aria-label="Kapat">${I.close}</button>
      <div class="grow center" style="font-weight:700">${journalFor ? 'Gelişim fotoğrafı' : 'Fidanının fotoğrafı'}</div><span style="width:40px"></span></div>
    <div class="overlay" id="camMsg" style="pointer-events:none"></div>
    <div class="bottom">
      <p class="center" style="font-size:13px;opacity:0.9">${journalFor ? 'Fidanının bugünkü halini çek' : 'Diktiğin yeri ve kalemi kadraja al'}</p>
      <div class="row" style="justify-content:space-around">
        <label class="icon-btn" style="width:52px;height:52px">${I.image}<input type="file" accept="image/*" id="pick" hidden></label>
        <button class="shutter" id="shot" aria-label="Fotoğraf çek"></button>
        <span style="width:52px"></span>
      </div>
    </div>
  </div>`);
  const video = $('video');
  let stream = null;
  let alive = true;
  openCamera(video).then((s) => { stream = s; if (!alive) stopStream(s); }).catch(() => {
    $('#camMsg').innerHTML = `<div class="err">Kamera açılamadı. Soldaki galeri düğmesiyle bir fotoğraf seçebilirsin.</div>`;
  });
  const done = (dataUrl) => {
    alive = false;
    stopStream(stream);
    if (journalFor) {
      const p = db.plantings.find((x) => x.id === journalFor);
      if (p) {
        p.journal.push({ at: Date.now(), photo: dataUrl, stage: stageOf(p).idx });
        save();
        toast('Gelişim fotoğrafı eklendi 📸');
      }
      back();
      return;
    }
    state.draft = { ...(state.draft || {}), photo: dataUrl };
    go('locate', {}, { replace: true });
  };
  $('#shot').addEventListener('click', () => {
    if (!stream || !video.videoWidth) { $('#pick').click(); return; }
    const max = 960;
    const sc = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(video.videoWidth * sc);
    c.height = Math.round(video.videoHeight * sc);
    c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99;animation:fade .3s reverse forwards';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
    done(c.toDataURL('image/jpeg', 0.72));
  });
  $('#pick').addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (f) done(await fileToDataUrl(f));
  });
  return () => { alive = false; stopStream(stream); };
};

/* ------------------------------------------------------------------ */
/* EKRAN: Konum alınıyor                                                */
/* ------------------------------------------------------------------ */
function getPosition(opts) {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) { rej(new Error('no-geo')); return; }
    navigator.geolocation.getCurrentPosition(res, rej, opts);
  });
}
SCREENS.locate = () => {
  mount(`${topbar({ title: 'Konum' })}
  <main class="screen"><div class="locating">
    <div class="radar"><div class="dot">${I.pin}</div></div>
    <h2 class="title">Konumun alınıyor…</h2>
    <p class="sub" id="locMsg">Fidanının yeri OGM Ormanı haritasına işlenecek.</p>
  </div></main>`);
  let alive = true;
  (async () => {
    let loc = null;
    try {
      const p = await getPosition({ enableHighAccuracy: true, timeout: 9000, maximumAge: 30000 });
      loc = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, approx: false };
    } catch (e) {
      if (alive) $('#locMsg').textContent = 'GPS sinyali zayıf, ağ konumu deneniyor…';
      try {
        const p = await getPosition({ enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 });
        loc = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, approx: false };
      } catch (e2) {
        loc = { ...FALLBACK_LOC };
      }
    }
    if (!alive) return;
    const pr = nearestProvince(loc.lat, loc.lng);
    state.draft = { ...state.draft, ...loc, province: pr.name, region: pr.region, outside: pr.far };
    go('confirm', {}, { replace: true });
  })();
  return () => { alive = false; };
};

/* ------------------------------------------------------------------ */
/* Leaflet yardımcıları                                                  */
/* ------------------------------------------------------------------ */
function baseMap(el, opts = {}) {
  const map = L.map(el, {
    zoomControl: false,
    attributionControl: true,
    preferCanvas: true,
    zoomSnap: 0.1,
    ...opts,
  });
  map.attributionControl?.setPrefix(false);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
    attribution: '© OpenStreetMap © CARTO',
  }).addTo(map);
  L.geoJSON(turkey, {
    style: { color: '#1c4d29', weight: 1.5, fill: true, fillColor: '#7cc142', fillOpacity: 0.06 },
    interactive: false,
  }).addTo(map);
  return map;
}
function myPinIcon() {
  return L.divIcon({ className: '', html: '<div class="pulse"></div><div class="my-pin"></div>', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28] });
}

/* ------------------------------------------------------------------ */
/* EKRAN: Onay                                                          */
/* ------------------------------------------------------------------ */
SCREENS.confirm = () => {
  const d = state.draft;
  const sp = SPECIES[state.pen.species];
  const fits = sp.regions.includes(d.region);
  const best = SPECIES[REGION_BEST[d.region]];
  const isTeacher = db.user?.type === 'teacher';
  mount(`${topbar({ backBtn: true, title: 'Dikimi onayla' })}
  <main class="screen"><div class="pad stack">
    <div class="photo-frame"><img src="${d.photo}" alt="Fidan fotoğrafı">
      <div class="stamp"><span>${dateTR(Date.now())} · ${timeTR(Date.now())}</span><span>${esc(d.province)}</span></div></div>
    <div id="mini" class="minimap"></div>
    <div class="card flat">
      <dl class="kv">
        <dt>Kalem</dt><dd>${esc(state.pen.id)}</dd>
        <dt>Tohum</dt><dd>${esc(sp.name)}</dd>
        <dt>İl / Bölge</dt><dd>${esc(d.province)} · ${esc(REGIONS[d.region])}</dd>
        <dt>Koordinat</dt><dd>${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}</dd>
        <dt>Hassasiyet</dt><dd>${d.approx ? 'Yaklaşık (GPS yok)' : `± ${Math.round(d.acc)} m`}</dd>
        <dt>Diken</dt><dd>${esc(userLabel(db.user))} · ${userTypeLabel(db.user)}</dd>
      </dl>
    </div>
    ${fits
    ? `<div class="fit ok">${I.check}<div><b>${esc(sp.name)} bu bölgeye çok uygun!</b><br>${esc(REGIONS[d.region])} Bölgesi, ${esc(sp.name.toLowerCase())} için ideal yetişme alanlarından.</div></div>`
    : `<div class="fit no">${I.info}<div><b>Bilgi:</b> ${esc(REGIONS[d.region])} Bölgesi için en iyi sonuç veren tür <b>${esc(best.name)}</b>. Dikim yerini OGM ekibiyle teyit edebilirsin.</div></div>`}
    ${isTeacher ? `<label class="field"><span>Bu kalemi hangi öğrenci dikti? (rumuz / no — isteğe bağlı)</span><input id="stu" placeholder="Örn. Yıldız-07" value="${esc(d.student || '')}"></label>` : ''}
    <button class="btn sun" id="ok">${I.pin} OGM Ormanı'na işle</button>
    <button class="btn ghost small" id="retake">${I.camera} Fotoğrafı yeniden çek</button>
  </div></main>`);
  const map = baseMap($('#mini'), { dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, attributionControl: false });
  map.setView([d.lat, d.lng], d.approx ? 12 : 16);
  L.marker([d.lat, d.lng], { icon: myPinIcon() }).addTo(map);
  const t = setTimeout(() => map.invalidateSize(), 100);
  $('#retake').addEventListener('click', () => go('camera', {}, { replace: true }));
  $('#ok').addEventListener('click', () => {
    const p = {
      id: `P${Date.now().toString(36)}`,
      penId: state.pen.id,
      species: state.pen.species,
      by: { ...db.user },
      student: isTeacher ? ($('#stu').value || '').trim() : '',
      lat: d.lat, lng: d.lng, acc: d.acc, approx: d.approx,
      province: d.province, region: d.region,
      plantedAt: Date.now(),
      simDays: 0,
      journal: [{ at: Date.now(), photo: d.photo, stage: 0 }],
    };
    db.plantings.unshift(p);
    save();
    state.pen = null;
    state.draft = null;
    state.stack = [{ name: 'success', params: { id: p.id } }];
    render();
  });
  return () => { clearTimeout(t); map.remove(); };
};

/* ------------------------------------------------------------------ */
/* EKRAN: Başarı                                                        */
/* ------------------------------------------------------------------ */
SCREENS.success = ({ id }) => {
  const p = db.plantings.find((x) => x.id === id);
  const total = NATIONAL.trees + db.plantings.length;
  const isTeacher = db.user?.type === 'teacher';
  mount(`<main class="screen"><section class="success">
    <img src="${IMG.ogm}" alt="" style="width:56px;height:56px;border-radius:50%;background:#fff">
    <img class="squirrel" src="${IMG.squirrel}" alt="">
    <h1>Tebrikler! Fidanın ormana katıldı 🌱</h1>
    <p style="opacity:.85;font-size:14px;margin-top:6px">${esc(SPECIES[p.species].name)} · ${esc(p.province)} · ${esc(p.penId)}</p>
    <div class="counter" id="cnt">${fmt(total - 1)}</div>
    <p style="opacity:.85;font-size:13px">fidan ile OGM Ormanı büyüyor</p>
    <div class="actions">
      <button class="btn sun" id="toMap">${I.map} Haritada gör</button>
      <div class="row"><button class="btn light grow" id="toShare">${I.share} Paylaş</button>
      <button class="btn light grow" id="toTrack">${I.sprout} Takip et</button></div>
      <button class="btn ghost" id="again" style="color:#fff;border-color:rgba(255,255,255,.6)">${I.qr} ${isTeacher ? 'Sıradaki öğrencinin kalemini okut' : 'Yeni kalem okut'}</button>
    </div>
  </section></main>`);
  // sayaç animasyonu
  setTimeout(() => {
    const el = $('#cnt');
    if (!el) return;
    el.textContent = fmt(total);
    el.animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'ease-out' });
    if (navigator.vibrate) navigator.vibrate([40, 40, 80]);
  }, 900);
  // yaprak yağmuru
  const sec = $('.success');
  for (let i = 0; i < 26; i++) {
    const l = document.createElement('i');
    l.className = 'leaf-fall';
    l.style.left = `${Math.random() * 100}%`;
    l.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
    l.style.animationDelay = `${Math.random() * 1.2}s`;
    l.style.background = ['#7cc142', '#9bd35c', '#f4c534', '#5aa33f'][i % 4];
    sec.appendChild(l);
  }
  $('#toMap').addEventListener('click', () => { state.stack = [{ name: 'panel', params: { focus: id } }]; render(); });
  $('#toTrack').addEventListener('click', () => { state.stack = [{ name: 'mine', params: {} }, { name: 'detail', params: { id } }]; render(); });
  $('#toShare').addEventListener('click', () => openShare(p));
  $('#again').addEventListener('click', () => { state.stack = [{ name: 'home', params: {} }, { name: 'scan', params: {} }]; render(); });
};

/* ------------------------------------------------------------------ */
/* EKRAN: Fidanlarım                                                    */
/* ------------------------------------------------------------------ */
SCREENS.mine = () => {
  const list = db.plantings;
  mount(`${topbar({ title: 'Fidanlarım' })}
  <main class="screen"><div class="pad stack">
    ${list.length ? `
      <div class="stat-grid">
        <div class="stat"><b>${list.length}</b><span>Dikilen fidan</span></div>
        <div class="stat"><b>${new Set(list.map((p) => p.province)).size}</b><span>Farklı il</span></div>
      </div>
      ${list.map((p) => {
    const st = stageOf(p);
    const who = p.student || userLabel(p.by);
    return `<button class="plant-item" data-id="${p.id}">
          <div class="thumb"><img src="${p.journal[p.journal.length - 1].photo}" alt=""></div>
          <div class="grow"><b>${esc(SPECIES[p.species].name)} · ${esc(p.province)}</b>
          <small>${esc(who)} · ${dateTR(p.plantedAt)}</small>
          <small style="margin-top:4px"><span class="tag ${st.idx >= 2 ? 'soft' : 'sun'}" style="font-size:11px;padding:2px 10px">${STAGES[st.idx].name}</span></small></div>
          <span style="color:var(--forest)">${I.back.replace('<svg', '<svg style="transform:rotate(180deg);width:20px"')}</span>
        </button>`;
  }).join('')}`
    : `<div class="empty"><img src="${IMG.squirrel}" alt=""><h2 class="title">Henüz fidanın yok</h2>
      <p class="sub mt8">Kalemin bitince QR'ını okut, ilk fidanını dik!</p>
      <button class="btn sun mt16" data-act="scan">${I.qr} QR okut</button></div>`}
  </div></main>
  ${nav('mine')}`);
  $$('[data-id]').forEach((b) => b.addEventListener('click', () => go('detail', { id: b.dataset.id })));
};

/* ------------------------------------------------------------------ */
/* EKRAN: Fidan detayı / takip                                          */
/* ------------------------------------------------------------------ */
SCREENS.detail = ({ id }) => {
  const p = db.plantings.find((x) => x.id === id);
  if (!p) { home(); return; }
  const draw = () => {
    const st = stageOf(p);
    const sp = SPECIES[p.species];
    const next = STAGES[st.idx + 1];
    const who = p.student ? `${p.student} (öğretmeni: ${p.by.name})` : `${userLabel(p.by)} · ${userTypeLabel(p.by)}`;
    mount(`${topbar({ backBtn: true, title: `${sp.name} · ${p.province}`, right: `<button class="icon-btn" id="shareBtn" aria-label="Paylaş">${I.share}</button>` })}
    <main class="screen"><div class="pad stack">
      <div class="growth"><span class="badge tag">${STAGES[st.idx].name}</span>${plantSvg(st.idx)}</div>
      <div class="card">
        <div class="row between"><div><div class="eyebrow">Gelişim</div>
          <b style="color:var(--forest);font-size:18px">${Math.floor(st.days)}. gün</b></div>
          ${next ? `<span class="tag soft">Sıradaki: ${next.name}</span>` : '<span class="tag sun">Orman oldu! 🌲</span>'}</div>
        <div class="progress light"><i style="width:${Math.min(100, (st.days / 365) * 100).toFixed(1)}%"></i></div>
        <p class="sub mt8">💡 ${STAGES[st.idx].tip}</p>
      </div>
      <div class="card flat">
        <ul class="timeline">${STAGES.map((s, i) => `<li class="${i < st.idx ? 'done' : i === st.idx ? 'now' : ''}">
          <b>${s.name}</b><small>${i === 0 ? dateTR(p.plantedAt) : `${s.day >= 365 ? '1. yıl' : s.day >= 30 ? `${Math.round(s.day / 30)}. ay` : `${Math.round(s.day / 7)}. hafta`} civarı`}</small></li>`).join('')}</ul>
      </div>
      <div class="card flat">
        <div class="row between"><div class="eyebrow">Fotoğraf günlüğü</div><span class="sub">${p.journal.length} fotoğraf</span></div>
        <div class="journal mt8">${p.journal.map((j) => `<div><img src="${j.photo}" alt=""><span>${STAGES[j.stage]?.name || ''}</span></div>`).join('')}</div>
        <button class="btn light small mt16" id="addPhoto">${I.camera} Gelişim fotoğrafı ekle</button>
      </div>
      <div id="mini" class="minimap"></div>
      <div class="card flat"><dl class="kv">
        <dt>Kalem</dt><dd>${esc(p.penId)}</dd>
        <dt>Tür</dt><dd>${esc(sp.name)} (${esc(sp.latin)})</dd>
        <dt>Konum</dt><dd>${esc(p.province)} · ${esc(REGIONS[p.region])}</dd>
        <dt>Diken</dt><dd>${esc(who)}</dd>
        <dt>Dikim</dt><dd>${dateTR(p.plantedAt)} ${timeTR(p.plantedAt)}</dd>
      </dl></div>
      <button class="btn ghost small" id="ff">${I.ff} Sunum: zamanı ileri sar (${next ? next.name : 'başa dön'})</button>
    </div></main>`);
    const map = baseMap($('#mini'), { attributionControl: false });
    map.setView([p.lat, p.lng], 13);
    L.marker([p.lat, p.lng], { icon: myPinIcon() }).addTo(map);
    const t = setTimeout(() => map.invalidateSize(), 100);
    cleanup = () => { clearTimeout(t); map.remove(); };
    $('#shareBtn').addEventListener('click', () => openShare(p));
    $('#addPhoto').addEventListener('click', () => go('camera', { journalFor: p.id }));
    $('#ff').addEventListener('click', () => {
      const s = stageOf(p);
      if (STAGES[s.idx + 1]) {
        p.simDays = STAGES[s.idx + 1].day - (Date.now() - p.plantedAt) / DAY + 0.5;
        toast(`⏩ ${STAGES[s.idx + 1].name} aşamasına geçildi`);
      } else {
        p.simDays = 0;
      }
      save();
      if (cleanup) { cleanup(); cleanup = null; }
      draw();
    });
  };
  draw();
};

/* ------------------------------------------------------------------ */
/* EKRAN: OGM Ormanı paneli                                             */
/* ------------------------------------------------------------------ */
SCREENS.panel = ({ focus } = {}) => {
  const total = NATIONAL.trees + db.plantings.length;
  const pct = (total / NATIONAL.target) * 100;
  const totals = provinceTotals();
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const spTotal = Object.values(SPECIES).reduce((a, s) => a + s.share, 0);
  const names = ['Yıldız-07', 'Çınar-12', '4-B Sınıfı', 'Elif Ö.', 'Kartal-03', 'Deniz-21', 'Mavi-09', '6-A Sınıfı'];
  const r = rng(Math.floor(Date.now() / 60000));
  const fake = Array.from({ length: 5 }, (_, i) => {
    const pv = PROVINCES[Math.floor(r() * PROVINCES.length)];
    const sp = SPECIES[REGION_BEST[pv[3]]];
    return { who: names[Math.floor(r() * names.length)], prov: pv[0], sp: sp.name, ago: `${(i + 1) * 2 + Math.floor(r() * 3)} dk önce` };
  });
  const mine = db.plantings.slice(0, 3);
  mount(`${topbar({ title: 'OGM ORMANI' })}
  <main class="screen">
    <section class="panel-head">
      <div class="row between"><div class="eyebrow">Proje paneli</div><span class="live">CANLI</span></div>
      <div style="font-size:36px;font-weight:800;line-height:1.15;font-variant-numeric:tabular-nums">${fmt(total)} <span style="font-size:16px;font-weight:600;opacity:.8">fidan</span></div>
      <div class="progress"><i style="width:${pct.toFixed(2)}%"></i></div>
      <div class="row between mt8" style="font-size:12px;opacity:.85"><span>Hedef ${fmt(NATIONAL.target)}</span><span>%${pct.toFixed(1).replace('.', ',')}</span></div>
    </section>
    <div class="mapbox"><div id="bigmap" style="position:absolute;inset:0"></div>
      <div class="map-chip"><button class="on" data-z="tr">Türkiye</button>${db.plantings.length ? '<button data-z="me">Benim fidanlarım</button>' : ''}${Object.keys(SPECIES).map((k) => `<button data-sp="${k}">${SPECIES[k].name}</button>`).join('')}</div>
      <div class="map-legend">${Object.values(SPECIES).map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}<span><i style="background:var(--sun);border:2px solid var(--forest)"></i>Senin fidanın</span></div>
    </div>
    <div class="pad stack">
      <div class="stat-grid">
        <div class="stat"><b>${fmt(NATIONAL.schools)}</b><span>Okul</span></div>
        <div class="stat"><b>${fmt(NATIONAL.students + db.plantings.length)}</b><span>Öğrenci</span></div>
        <div class="stat"><b>${fmt(NATIONAL.teachers)}</b><span>Öğretmen</span></div>
        <div class="stat"><b>${NATIONAL.provinces}</b><span>İl</span></div>
      </div>
      <div class="card">
        <div class="eyebrow">Son dikimler</div>
        <ul class="feed mt8">
          ${mine.map((p) => `<li class="mine"><div class="av"><img src="${p.journal[0].photo}" alt=""></div><div class="grow"><b>${esc(p.student || userLabel(p.by))}</b> · ${esc(SPECIES[p.species].name)}<br><small class="muted">${esc(p.province)} · ${timeTR(p.plantedAt)}</small></div><span class="tag sun" style="font-size:10px">SEN</span></li>`).join('')}
          ${fake.map((f) => `<li><div class="av">${esc(f.who[0])}</div><div class="grow"><b>${esc(f.who)}</b> · ${esc(f.sp)}<br><small class="muted">${esc(f.prov)} · ${f.ago}</small></div></li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <div class="eyebrow">En çok fidan dikilen iller</div>
        <ul class="rank mt8">${top.map(([n, v], i) => `<li><em>${i + 1}</em>${esc(n)}<b>${fmt(v)}</b></li>`).join('')}</ul>
      </div>
      <div class="card">
        <div class="eyebrow">Tür dağılımı</div>
        <div class="bars">${Object.values(SPECIES).map((s) => `<div class="bar"><div class="row between"><span>${s.name}</span><b style="color:var(--forest)">%${Math.round((s.share / spTotal) * 100)}</b></div><div class="track"><i style="width:${(s.share / spTotal) * 100}%;background:${s.color}"></i></div></div>`).join('')}</div>
      </div>
      <img class="tx-logo" src="${IMG.tx}" alt="Tohumix">
      <p class="foot-note">Ülke geneli sayılar sunum için temsili demo verisidir. Telefonla yapılan dikimler gerçek konumla işlenir.</p>
    </div>
  </main>
  ${nav('panel')}`);

  const map = baseMap($('#bigmap'), { minZoom: 4 });
  const trBounds = L.geoJSON(turkey).getBounds();
  map.fitBounds(trBounds, { padding: [0, 0] });
  const renderer = L.canvas({ padding: 0.5 });
  const pts = seedPoints();
  let layer = L.layerGroup().addTo(map);
  const drawPts = (filter) => {
    layer.clearLayers();
    for (const pt of pts) {
      if (filter && pt.sp !== filter) continue;
      L.circleMarker([pt.lat, pt.lng], {
        renderer, radius: 2.6, weight: 0, fillOpacity: 0.75, fillColor: SPECIES[pt.sp].color, interactive: false,
      }).addTo(layer);
    }
  };
  drawPts(null);
  const myMarkers = {};
  db.plantings.forEach((p) => {
    const m = L.marker([p.lat, p.lng], { icon: myPinIcon(), zIndexOffset: 1000 }).addTo(map);
    m.bindPopup(`<img class="pop-img" src="${p.journal[p.journal.length - 1].photo}" alt=""><b>${esc(SPECIES[p.species].name)}</b> · ${esc(p.province)}<br>${esc(p.student || userLabel(p.by))}<br><small>${dateTR(p.plantedAt)} · ${STAGES[stageOf(p).idx].name}</small>`);
    myMarkers[p.id] = m;
  });
  $$('.map-chip button').forEach((b) => b.addEventListener('click', () => {
    $$('.map-chip button').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    if (b.dataset.sp) { drawPts(b.dataset.sp); map.flyToBounds(trBounds, { duration: 0.6 }); }
    else if (b.dataset.z === 'me') {
      drawPts(null);
      const g = L.featureGroup(Object.values(myMarkers));
      map.flyToBounds(g.getBounds().pad(0.5), { maxZoom: 15, duration: 1.2 });
    } else { drawPts(null); map.flyToBounds(trBounds, { duration: 0.8 }); }
  }));
  let dead = false;
  setTimeout(() => {
    if (dead) return;
    map.invalidateSize();
    if (focus && myMarkers[focus]) {
      const p = db.plantings.find((x) => x.id === focus);
      setTimeout(() => {
        if (dead) return;
        map.flyTo([p.lat, p.lng], p.approx ? 12 : 15, { duration: 2.2 });
        map.once('moveend', () => { if (!dead) myMarkers[focus].openPopup(); });
      }, 1400);
    }
  }, 120);
  return () => { dead = true; map.stop(); map.remove(); };
};

/* ------------------------------------------------------------------ */
/* EKRAN: Profil                                                        */
/* ------------------------------------------------------------------ */
SCREENS.profile = () => {
  const u = db.user;
  mount(`${topbar({ title: 'Profil' })}
  <main class="screen"><div class="pad stack">
    ${u ? `<div class="card row">
      <div style="width:56px;height:56px;border-radius:50%;background:var(--leaf-soft);display:grid;place-items:center;color:var(--forest)">${{ teacher: I.teacher, student: I.student, parent: I.parent }[u.type]}</div>
      <div class="grow"><b style="color:var(--forest);font-size:17px">${esc(userLabel(u))}</b>
      <div class="sub">${userTypeLabel(u)}${u.school ? ` · ${esc(u.school)}` : ''}${u.cls ? ` · ${esc(u.cls)}` : ''}${u.phone ? ` · ${esc(u.phone)}` : ''}</div></div></div>
      <button class="btn ghost small" id="logout">Çıkış yap</button>`
    : `<div class="card center"><p class="sub">Giriş yapmadın. Kalemini okuttuğunda giriş yapabilirsin.</p>
      <button class="btn mt16" id="login">Giriş yap</button></div>`}
    <div class="card flat">
      <div class="eyebrow">Tohumix hakkında</div>
      <p class="sub mt8">Gövdesi %100 geri dönüştürülmüş kraft kağıttan, ucu bitmeyen tohumlu kalem. Kapsül yok — tohum gövdenin içinde. Kalem bitince çöpe değil toprağa: suyla buluşan gövde çözülür, tohumlar filizlenir.</p>
      <img class="tx-logo mt16" src="${IMG.tx}" alt="Tohumix">
    </div>
    <div class="card flat">
      <div class="eyebrow">Sunum ayarları</div>
      <p class="sub mt8">Demo verilerini sıfırlayarak sunuma temiz başlayabilirsin.</p>
      <button class="btn light small mt8" id="reset">${I.refresh} Demo verilerini sıfırla</button>
    </div>
    <p class="foot-note">OGM Ormanı · Tohumix demo sürümü 1.0</p>
  </div></main>
  ${nav('profile')}`);
  $('#logout')?.addEventListener('click', () => { db.user = null; save(); tab('profile'); toast('Çıkış yapıldı'); });
  $('#login')?.addEventListener('click', () => go('login'));
  $('#reset').addEventListener('click', () => {
    if (!confirm('Tüm demo dikimleri ve giriş bilgisi silinsin mi?')) return;
    db = { user: null, plantings: [] };
    save();
    toast('Demo sıfırlandı');
    home();
  });
};

/* ------------------------------------------------------------------ */
/* Paylaşım kartı                                                       */
/* ------------------------------------------------------------------ */
function loadImg(src) {
  return new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = src;
  });
}
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
async function makeShareCard(p) {
  await document.fonts.ready;
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  const [photo, ogm, sq, tx] = await Promise.all([
    loadImg(p.journal[p.journal.length - 1].photo), loadImg(IMG.ogm), loadImg(IMG.squirrel), loadImg(IMG.tx),
  ]);
  x.fillStyle = '#f7f1e3';
  x.fillRect(0, 0, W, H);
  x.fillStyle = '#1c4d29';
  x.fillRect(0, 0, W, 150);
  if (ogm) { x.save(); x.beginPath(); x.arc(110, 75, 50, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill(); x.clip(); x.drawImage(ogm, 60, 25, 100, 100); x.restore(); }
  x.fillStyle = '#fff';
  x.font = '800 54px Poppins';
  x.fillText('OGM ORMANI', 190, 95);
  // fotoğraf
  x.save();
  rrect(x, 60, 200, W - 120, 700, 36);
  x.clip();
  if (photo) {
    const s = Math.max((W - 120) / photo.width, 700 / photo.height);
    const pw = photo.width * s;
    const ph = photo.height * s;
    x.drawImage(photo, 60 + (W - 120 - pw) / 2, 200 + (700 - ph) / 2, pw, ph);
  } else { x.fillStyle = '#dfe9d5'; x.fillRect(60, 200, W - 120, 700); }
  x.restore();
  // etiket
  x.fillStyle = '#f4c534';
  rrect(x, 90, 830, 420, 50, 25);
  x.fill();
  x.fillStyle = '#1c4d29';
  x.font = '700 26px Poppins';
  x.fillText(`🌱 ${SPECIES[p.species].name} · ${p.province}`, 112, 864);
  x.fillStyle = '#1c4d29';
  x.font = '800 58px Poppins';
  x.fillText('Ben de bir fidan diktim!', 60, 990);
  x.font = '500 32px Poppins';
  x.fillStyle = '#5f6d60';
  x.fillText(`${dateTR(p.plantedAt)} · Kalem ${p.penId}`, 60, 1045);
  x.fillText('Kalemim bitti, çöpe değil toprağa gitti.', 60, 1095);
  x.fillStyle = '#2b6a35';
  x.font = '700 32px Poppins';
  x.fillText('#OGMOrmanı  #Tohumix', 60, 1160);
  if (tx) x.drawImage(tx, 60, 1200, 300, 300 * (tx.height / tx.width));
  if (sq) { const h = 380; x.drawImage(sq, W - h * (sq.width / sq.height) - 30, H - h - 10, h * (sq.width / sq.height), h); }
  return c.toDataURL('image/jpeg', 0.9);
}
function closeSheet() { $('.sheet-bg')?.remove(); }
async function openShare(p) {
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = `<div class="sheet"><div class="grip"></div>
    <h2 class="title center">Fidanını paylaş</h2>
    <p class="sub center mt8">Sosyal medyada paylaş, arkadaşlarını da ormana davet et!</p>
    <div class="center mt16" id="prev"><div class="radar" style="margin:20px auto;width:80px;height:80px"></div></div>
    <div class="stack mt16"><button class="btn sun" id="doShare" disabled>${I.share} Paylaş</button>
    <button class="btn ghost small" id="cls">Kapat</button></div></div>`;
  document.body.appendChild(bg);
  bg.addEventListener('click', (e) => { if (e.target === bg) closeSheet(); });
  $('#cls', bg).addEventListener('click', closeSheet);
  const data = await makeShareCard(p);
  $('#prev', bg).innerHTML = `<img class="share-preview" src="${data}" alt="Paylaşım kartı">`;
  const btn = $('#doShare', bg);
  btn.disabled = false;
  const text = `Tohumix kalemimle OGM Ormanı'na bir ${SPECIES[p.species].name} fidanı diktim! 🌱 #OGMOrmanı #Tohumix`;
  btn.addEventListener('click', async () => {
    try {
      if (isNative) {
        const f = await Filesystem.writeFile({ path: `ogm-ormani-${p.id}.jpg`, data: data.split(',')[1], directory: Directory.Cache });
        await Share.share({ title: 'OGM Ormanı', text, files: [f.uri], dialogTitle: 'Fidanını paylaş' });
      } else {
        const blob = await (await fetch(data)).blob();
        const file = new File([blob], 'ogm-ormani.jpg', { type: 'image/jpeg' });
        if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text });
        else {
          const a = document.createElement('a');
          a.href = data;
          a.download = 'ogm-ormani.jpg';
          a.click();
        }
      }
    } catch (e) {
      if (!/cancel/i.test(String(e?.message || e))) toast('Paylaşım açılamadı');
    }
  });
}

/* ------------------------------------------------------------------ */
/* Başlat                                                               */
/* ------------------------------------------------------------------ */
function splash() {
  const s = document.createElement('div');
  s.className = 'splash';
  s.innerHTML = `<img class="logo" src="${IMG.ogm}" alt="OGM"><h1>OGM ORMANI</h1><small>Her kalem bir fidan · Bir kalemden bir ormana</small><img class="tx" src="${IMG.txw}" alt="Tohumix">`;
  document.body.appendChild(s);
  setTimeout(() => { s.style.opacity = '0'; setTimeout(() => s.remove(), 500); }, 1600);
}

load();
splash();
home();
seedPoints();
if (isNative) {
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  CapApp.addListener('backButton', () => {
    if (!back()) {
      const cur = state.stack[state.stack.length - 1];
      if (cur.name !== 'home') home();
      else CapApp.minimizeApp();
    }
  });
}
