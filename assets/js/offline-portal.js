/* 本文件由 build/make_offline.py 生成：portal 入口。不要手改。 */
(function () {
  'use strict';
  var VIS = window.VIS = window.VIS || {};
  var __VIS_SCRIPT_URL = document.currentScript ? document.currentScript.src : document.baseURI;
(function () {
/* =============================================================
   i18n.js —— 数据驱动的双语引擎（重构后）
   -------------------------------------------------------------
   重构前的问题：
     · 每段正文在 HTML 里写两遍（zh 版 + en 版 hidden），DOM 与体积翻倍，
       改一处必须同步两处；
     · 5 个页面各自维护一份 topbar 的中英 li；
     · 字典 key 有缺口（common.demo-folder 未定义，英文模式直接显示字面量）。
   重构后：
     · 文案集中在 assets/data/ui.json（单一真源）；
     · 正文按语言渲染（见 lesson-app.js），DOM 里只有当前语言一份；
     · 语言状态通过 ?lang= → localStorage → 浏览器语言 依次解析。
   ============================================================= */

const ROOT = new URL('../../', __VIS_SCRIPT_URL);
const siteUrl = (p) => new URL(p, ROOT).href;

const SUPPORTED = ['zh-CN', 'en-US'];
const STORAGE_KEY = 'vis.locale';
const DEFAULT_LOCALE = 'zh-CN';

let dict = null;
let locale = DEFAULT_LOCALE;
const listeners = new Set();

/** 接受 en / en-US / zh / zh-CN 等写法，归一化到规范 locale */
function normalizeLocale(v) {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  if (s === 'en' || s === 'en-us' || s.startsWith('en-')) return 'en-US';
  if (s === 'zh' || s === 'zh-cn' || s.startsWith('zh-')) return 'zh-CN';
  return null;
}

/** 按 ?lang= → localStorage → navigator.language 顺序解析初始语言 */
function resolveInitialLocale() {
  const fromUrl = normalizeLocale(new URLSearchParams(location.search).get('lang'));
  if (fromUrl) return fromUrl;
  try {
    const stored = normalizeLocale(localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
  } catch (e) { /* 隐私模式下 localStorage 可能抛错 */ }
  return normalizeLocale(navigator.language) || DEFAULT_LOCALE;
}

async function initI18n() {
  if (dict) return locale;
  const res = await fetch(siteUrl('assets/data/ui.json'));
  if (!res.ok) throw new Error('ui.json 加载失败: ' + res.status);
  dict = await res.json();
  locale = resolveInitialLocale();
  document.documentElement.lang = locale;
  return locale;
}

function getLocale() { return locale; }
function isZh() { return locale === 'zh-CN'; }

/**
 * 数据文件的键名与本模块的 locale 标识不同：
 *   locale  : 'zh-CN' | 'en-US'（HTML lang、localStorage 用）
 *   数据键  : 'zh'    | 'en'   （JSON 里存双语正文用，更短）
 * 所有读取 JSON 正文的地方都要经过这个换算。
 */
function dataKey(loc) {
  return ((loc || locale) === 'zh-CN') ? 'zh' : 'en';
}

/** 取译文字符串；支持 {n} 形式的占位符 */
function t(key, vars) {
  const table = (dict && (dict[locale] || dict[DEFAULT_LOCALE])) || {};
  let s = table[key];
  if (s === undefined) {
    // 回退到另一语言，最后才显示 key（避免重构前把 key 字面量显示给用户）
    const other = locale === 'zh-CN' ? 'en-US' : 'zh-CN';
    s = (dict && dict[other] && dict[other][key]);
  }
  if (s === undefined) return key;
  if (vars) {
    for (const k of Object.keys(vars)) s = s.replaceAll('{' + k + '}', String(vars[k]));
  }
  return s;
}

function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setLocale(next) {
  if (!SUPPORTED.includes(next) || next === locale) return;
  locale = next;
  try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
  document.documentElement.lang = next;
  // 同步到 URL（可分享 / 刷新保持），用 en / zh 短形式
  const url = new URL(location.href);
  url.searchParams.set('lang', next === 'en-US' ? 'en' : 'zh');
  // file:// 下个别浏览器会禁用 history API，失败也不该影响页面切换
  try { history.replaceState(null, '', url); } catch (e) { /* ignore */ }
  applyToDOM(document);
  listeners.forEach((fn) => {
    try { fn(next); } catch (e) { console.error(e); }
  });
}

/**
 * 把字典套用到 DOM：
 *   data-i18n="key"         → textContent
 *   data-i18n-html="key"    → innerHTML（文案里含链接/加粗时用）
 *   data-i18n-attr="as:key,bs:key2" → 逐属性替换
 *   data-i18n-title="key"   → title / aria-label
 */
function applyToDOM(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  scope.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (key) el.innerHTML = t(key);
  });
  scope.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.getAttribute('data-i18n-attr').split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s && s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
  scope.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (!key) return;
    el.setAttribute('title', t(key));
    if (!el.hasAttribute('aria-label') && el.tagName === 'BUTTON') el.setAttribute('aria-label', t(key));
  });
}

/** 在 root 中按 data-i18n 生成一个语言切换按钮组 */
function buildLangSwitcher(onChanged) {
  const wrap = document.createElement('div');
  wrap.className = 'lang-switch';
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('data-i18n-attr', 'aria-label:nav.lang.label');
  SUPPORTED.forEach((loc) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.locale = loc;
    b.textContent = loc === 'zh-CN' ? '中' : 'EN';
    b.setAttribute('aria-pressed', String(loc === locale));
    b.addEventListener('click', () => {
      setLocale(loc);
      wrap.querySelectorAll('button').forEach((x) =>
        x.setAttribute('aria-pressed', String(x.dataset.locale === loc)));
      if (onChanged) onChanged(loc);
    });
    wrap.appendChild(b);
  });
  return wrap;
}

// 便于在控制台/其他旧脚本里使用（保持向后兼容的全局入口）
window.__i18n = {
  t, getLocale, setLocale, isZh, applyToDOM, init: initI18n, onLocaleChange,
};


VIS['i18n'] = { siteUrl: siteUrl, SUPPORTED: SUPPORTED, normalizeLocale: normalizeLocale, initI18n: initI18n, getLocale: getLocale, isZh: isZh, dataKey: dataKey, t: t, onLocaleChange: onLocaleChange, setLocale: setLocale, applyToDOM: applyToDOM, buildLangSwitcher: buildLangSwitcher };
})();

(function () {
const { siteUrl } = VIS['i18n'];

/* =============================================================
   store.js —— 数据加载与学习进度
   -------------------------------------------------------------
   数据分层（重构新增）：
     ui.json        UI 文案字典（i18n.js 使用）
     courses.json   轻量课程结构（章/小节标题、阅读时长）—— 首屏加载
     lesson-0X.json 单章正文（三 tab 的 HTML）—— 按需加载当前章
     lessons.json   全站搜索索引（含正文文本）—— 首次搜索时才加载
   ============================================================= */



const PROGRESS_KEY = 'vis.progress';

let coursesPromise = null;
const lessonPromises = new Map();
let searchIndexPromise = null;
const progressListeners = new Set();

/* ---------------- 数据加载 ---------------- */

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
  return res.json();
}

function loadCourses() {
  if (!coursesPromise) coursesPromise = fetchJson(siteUrl('assets/data/courses.json'));
  return coursesPromise;
}

function loadLesson(id) {
  if (!lessonPromises.has(id)) {
    lessonPromises.set(id, fetchJson(siteUrl('assets/data/' + id + '.json')));
  }
  return lessonPromises.get(id);
}

/** 搜索索引较大，懒加载；失败后允许重试 */
function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = fetchJson(siteUrl('assets/data/lessons.json'))
      .catch((e) => { searchIndexPromise = null; throw e; });
  }
  return searchIndexPromise;
}

/** 各章「本章小结」（要点回顾），小文件，随首屏一起加载 */
let summariesPromise = null;
function loadSummaries() {
  if (!summariesPromise) {
    summariesPromise = fetchJson(siteUrl('assets/data/summaries.json'))
      .catch((e) => { summariesPromise = null; throw e; });
  }
  return summariesPromise;
}

/* ---------------- 学习进度 ---------------- */

function readStore() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : {};
  } catch (e) {
    return {};
  }
}

function writeStore(obj) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(obj)); } catch (e) { /* ignore */ }
  progressListeners.forEach((fn) => {
    try { fn(); } catch (e) { console.error(e); }
  });
}

function isDone(sectionId) {
  return Object.prototype.hasOwnProperty.call(readStore(), sectionId);
}

function markDone(sectionId, done) {
  const store = readStore();
  if (done === false) delete store[sectionId];
  else store[sectionId] = Date.now();
  writeStore(store);
  return done !== false;
}

function toggleDone(sectionId) {
  return markDone(sectionId, !isDone(sectionId));
}

function getDoneIds() {
  return Object.keys(readStore());
}

function resetProgress() {
  writeStore({});
}

function onProgressChange(fn) {
  progressListeners.add(fn);
  return () => progressListeners.delete(fn);
}

/** 章节进度：{ done, total, percent } */
function chapterProgress(chapter) {
  const store = readStore();
  const total = chapter.sections.length;
  const done = chapter.sections.filter((s) => Object.prototype.hasOwnProperty.call(store, s.id)).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

/** 全站进度：{ done, total, percent, byChapter, next } */
function totalProgress(courses) {
  const store = readStore();
  let done = 0;
  let total = 0;
  const byChapter = {};
  let next = null;
  courses.chapters.forEach((ch) => {
    const p = chapterProgress(ch);
    byChapter[ch.id] = p;
    done += p.done;
    total += p.total;
    if (!next) {
      const pending = ch.sections.find((s) => !Object.prototype.hasOwnProperty.call(store, s.id));
      if (pending) next = { chapterId: ch.id, sectionId: pending.id, title: pending.title };
    }
  });
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0, byChapter, next };
}

/** 估算"读完这一章"的分钟数 */
function chapterReadMinutes(chapter) {
  return chapter.sections.reduce((sum, s) => sum + (s.readMin || 1), 0);
}


VIS['store'] = { loadCourses: loadCourses, loadLesson: loadLesson, loadSearchIndex: loadSearchIndex, loadSummaries: loadSummaries, isDone: isDone, markDone: markDone, toggleDone: toggleDone, getDoneIds: getDoneIds, resetProgress: resetProgress, onProgressChange: onProgressChange, chapterProgress: chapterProgress, totalProgress: totalProgress, chapterReadMinutes: chapterReadMinutes };
})();

(function () {
const { t, getLocale, dataKey, siteUrl } = VIS['i18n'];
const { loadSearchIndex } = VIS['store'];

/* =============================================================
   search.js —— 全站搜索（重构新增）
   -------------------------------------------------------------
   · 索引在首次打开搜索面板时才加载（lessons.json 约 150KB，不拖慢首屏）
   · 命中范围：小节标题 / 小节内 h3 小标题 / 正文（讲解+代码+演示说明）
   · 结果可直接跳转到「章节 · 小节 · 讲解」，同章内不刷新页面
   ============================================================= */




let index = null;
let overlay = null;
let input = null;
let listEl = null;
let footEl = null;
let coursesRef = null;
let onJump = null;
let activeIdx = -1;
let results = [];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function buildOverlay() {
  overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.id = 'searchOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="search-panel">
      <div class="search-head">
        <svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path>
        </svg>
        <input id="searchInput" type="search" autocomplete="off" spellcheck="false"
               aria-label="${esc(t('search.label'))}">
        <button class="icon-btn" type="button" id="searchClose"
                aria-label="${esc(t('search.close'))}">✕</button>
      </div>
      <div class="search-results" id="searchResults" role="listbox"></div>
      <div class="search-foot">
        <span id="searchCount"></span>
        <span>↑ ↓ 选择 · Enter 打开 · Esc 关闭</span>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  input = overlay.querySelector('#searchInput');
  listEl = overlay.querySelector('#searchResults');
  footEl = overlay.querySelector('#searchCount');

  input.placeholder = t('search.placeholder');
  input.addEventListener('input', debounce(run, 140));
  input.addEventListener('keydown', onInputKey);
  overlay.querySelector('#searchClose').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
}

function debounce(fn, ms) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** 标题 / 小标题 / 正文三级加权（lang 为数据键：'zh' / 'en'） */
function score(query, sec, lang) {
  const q = query.toLowerCase();
  const title = (sec.title && (sec.title[lang] || sec.title.zh)) || '';
  const body = (sec.search && (sec.search[lang] || sec.search.zh)) || '';
  let s = 0;
  let snippet = '';

  if (title.toLowerCase().includes(q)) s += 120;
  (sec.outline || []).forEach((o) => {
    const ot = (o[lang] || o.zh || '');
    if (ot && ot.toLowerCase().includes(q)) s += 28;
  });
  const pos = body.toLowerCase().indexOf(q);
  if (pos >= 0) {
    s += 12;
    const start = Math.max(0, pos - 36);
    snippet = (start > 0 ? '…' : '') + body.slice(start, pos + 110).trim() + '…';
  }
  // 同时命中标题与正文，说明更相关
  if (s > 0 && pos >= 0 && title.toLowerCase().includes(q)) s += 40;
  return { s, snippet };
}

function highlight(text, query) {
  const safe = esc(text);
  if (!query) return safe;
  const q = esc(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    return safe.replace(new RegExp(q, 'gi'), (m) => '<mark>' + m + '</mark>');
  } catch (e) {
    return safe;
  }
}

function run() {
  const query = input.value.trim();
  activeIdx = -1;
  // 索引尚未就绪（首次加载中或加载失败）时不做任何事，否则下面会读 index.chapters 报错
  if (!index) return;
  if (!query) {
    listEl.innerHTML = `<div class="search-empty">${esc(t('search.empty'))}</div>`;
    footEl.textContent = '';
    results = [];
    return;
  }
  const lang = dataKey();
  const out = [];
  index.chapters.forEach((ch) => {
    const course = coursesRef.chapters.find((c) => c.id === ch.id);
    ch.sections.forEach((sec) => {
      const { s, snippet } = score(query, sec, lang);
      if (s > 0) out.push({ chapter: course, section: sec, score: s, snippet });
    });
  });
  out.sort((a, b) => b.score - a.score);
  results = out.slice(0, 40);

  if (!results.length) {
    listEl.innerHTML = `<div class="search-empty">${esc(t('search.noresult'))}</div>`;
    footEl.textContent = '';
    return;
  }
  footEl.textContent = t('search.results', { n: results.length });
  listEl.innerHTML = results.map((r, i) => `
    <a class="search-result" href="${href(r)}" data-idx="${i}" role="option" aria-selected="false">
      <div class="sr-crumb">${esc(t(r.chapter.navKey))} · ${esc(t('search.in'))} ${esc(r.section.id)}</div>
      <div class="sr-title">${highlight((r.section.title[lang] || r.section.title.zh), query)}</div>
      ${r.snippet ? `<div class="sr-snippet">${highlight(r.snippet, query)}</div>` : ''}
    </a>`).join('');
  listEl.querySelectorAll('.search-result').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const r = results[Number(el.dataset.idx)];
      jump(r);
    });
  });
  input.focus();
}

function href(r) {
  // 章节 id 与小节 id 都来自仓库内数据，这里再校验一次格式（纵深防御），
  // 避免将来数据源变化时把任意字符串拼进 href
  const okCh = /^lesson-\d{2}$/.test(r.chapter.id);
  const okSec = /^[\w-]+$/.test(r.section.id);
  if (!okCh || !okSec) {
    // 正常不会发生；出现说明数据命名漂移，留下线索而不是静默降级
    console.warn('[search] 非预期的 id 格式:', r.chapter.id, r.section.id);
  }
  const ch = okCh ? r.chapter.id : 'lesson-01';
  const sec = okSec ? r.section.id : '';
  return siteUrl(ch + '/index.html' + (sec ? '#' + sec + '/explain' : ''));
}

function jump(r) {
  close();
  const here = document.body.dataset.lesson;
  if (here && r.chapter.id === here && onJump) {
    onJump(r.section.id);
  } else {
    location.href = href(r);
  }
}

function onInputKey(e) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!results.length) return;
    activeIdx = (activeIdx + (e.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length;
    listEl.querySelectorAll('.search-result').forEach((el, i) => {
      const on = i === activeIdx;
      el.classList.toggle('active', on);
      el.setAttribute('aria-selected', String(on));
      if (on) el.scrollIntoView({ block: 'nearest' });
    });
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (activeIdx >= 0 && results[activeIdx]) jump(results[activeIdx]);
    else if (results.length) jump(results[0]);
  }
}

function open() {
  overlay.classList.add('open');
  input.value = '';
  listEl.innerHTML = `<div class="search-empty">${esc(t('search.empty'))}</div>`;
  footEl.textContent = '';
  input.focus();
  if (!index) {
    listEl.innerHTML = `<div class="search-empty">${esc(t('common.loading'))}</div>`;
    loadSearchIndex()
      .then((data) => {
        index = data;
        input.placeholder = t('search.placeholder');
        run();
      })
      .catch((e) => {
        listEl.innerHTML = `<div class="search-empty">搜索索引加载失败：${esc(e.message)}</div>`;
      });
  }
}

function close() {
  overlay.classList.remove('open');
}

function initSearch({ courses, onSectionJump }) {
  coursesRef = courses;
  onJump = onSectionJump;
  buildOverlay();
  return { open, close };
}




VIS['search'] = { initSearch: initSearch, openSearch: open, closeSearch: close };
})();

(function () {
const { initI18n, t, getLocale, dataKey, buildLangSwitcher, applyToDOM } = VIS['i18n'];
const { loadCourses, totalProgress, onProgressChange } = VIS['store'];
const { initSearch, openSearch } = VIS['search'];

/* =============================================================
   portal.js —— 课程门户逻辑
   · 章节卡片由数据渲染（重构前是手写死的 5 张卡片）
   · 新增「学习进度总览」：环形总进度 + 分章进度条 + 继续学习
   · 新增全站搜索入口
   ============================================================= */





const $ = (s) => document.querySelector(s);
const lang = () => getLocale();
/** JSON 里双语正文的键 */
const dk = () => dataKey();

let courses = null;

/* ---------------- 环形进度 ---------------- */
function ringSvg(percent) {
  const R = 33;
  const C = 2 * Math.PI * R;
  const off = C * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return `<svg class="progress-ring" width="92" height="92" viewBox="0 0 92 92" role="img"
            aria-label="${percent}%">
      <circle class="ring-bg" cx="46" cy="46" r="${R}" fill="none" stroke-width="9"></circle>
      <circle class="ring-fg" cx="46" cy="46" r="${R}" fill="none" stroke-width="9"
        stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
        transform="rotate(-90 46 46)"></circle>
      <text x="46" y="52" text-anchor="middle">${percent}%</text>
    </svg>`;
}

/* ---------------- 进度总览 ---------------- */
/** 把「上次学到哪」转成安全的站内链接（localStorage 内容不可信，严格校验） */
function continueHref(last) {
  const m = /^(lesson-\d{2})#([\w-]+)$/.exec(last || '');
  if (m) return m[1] + '/index.html#' + m[2] + '/explain';
  const nx = totalProgress(courses).next;
  if (nx && /^lesson-\d{2}$/.test(nx.chapterId) && /^[\w-]+$/.test(nx.sectionId)) {
    return nx.chapterId + '/index.html#' + nx.sectionId + '/explain';
  }
  return 'lesson-01/index.html';
}

function renderDashboard() {
  const p = totalProgress(courses);
  let last = null;
  try { last = localStorage.getItem('vis.last'); } catch (e) { /* ignore */ }
  const href = continueHref(last);
  const label = (last && /^lesson-\d{2}#[\w-]+$/.test(last)) || p.next
    ? t('portal.continue')
    : t('portal.continue.none');

  const bars = courses.chapters.map((ch) => {
    const cp = p.byChapter[ch.id];
    return `<a class="dash-bar" href="${ch.id}/index.html">
        <span class="dash-bar__label">${t(ch.navKey)}</span>
        <span class="dash-bar__track"><i class="dash-bar__fill" style="width:${cp.percent}%"></i></span>
        <span class="dash-bar__count">${cp.done}/${cp.total}</span>
      </a>`;
  }).join('');

  // 首屏主按钮跟随「继续学习」目标
  const heroBtn = $('#heroStart');
  if (heroBtn) {
    heroBtn.href = href;
    heroBtn.textContent = label;
  }

  $('#dashboard').innerHTML = `
    <div class="progress-dashboard">
      ${ringSvg(p.percent)}
      <div>
        <h3>${t('portal.dashboard.title')}</h3>
        <p>${t('portal.dashboard.total', { done: p.done, total: p.total })} · ${t('portal.dashboard.desc')}</p>
        <div class="dash-bars">${bars}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        <a class="btn" href="${href}">${label}</a>
        ${p.done > 0 ? `<button class="btn btn-ghost" type="button" id="resetProgress">${t('study.reset')}</button>` : ''}
      </div>
    </div>`;

  const resetBtn = $('#resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (!confirm(t('study.reset.confirm'))) return;
      const { resetProgress } = await Promise.resolve(VIS.store);
      resetProgress();
    });
  }
}

/* ---------------- 章节卡片 ---------------- */
function renderCards() {
  const langCur = dk();
  $('#cards').innerHTML = courses.chapters.map((ch) => {
    const p = totalProgress(courses).byChapter[ch.id];
    const tags = (ch.card.tags[langCur] || '').split('·').map((s) => s.trim()).filter(Boolean);
    return `
      <a class="card available" href="${ch.id}/index.html">
        <div class="card-meta">${(ch.sections || []).length} ${langCur === 'zh' ? '小节' : 'sections'}</div>
        <div class="card-num">${langCur === 'zh' ? '第 ' + ch.order + ' 章' : 'Chapter ' + ch.order}</div>
        <h3>${ch.card.title[langCur]}</h3>
        <div class="card-progress">
          <span class="card-progress__track"><i class="card-progress__fill" style="width:${p.percent}%"></i></span>
          <span>${p.done}/${p.total}</span>
        </div>
        <p class="card-desc">${ch.card.desc[langCur]}</p>
        <ul class="card-tags">${tags.map((tg) => `<li>${tg}</li>`).join('')}</ul>
        <div class="card-cta">${t('common.enter')}</div>
      </a>`;
  }).join('');
}

/* ---------------- 语言 ---------------- */
function rerender() {
  applyToDOM(document);
  renderDashboard();
  renderCards();
}

/** 顶部错误提示：用 textContent 构造，不把异常消息拼进 HTML */
function bootError(msg) {
  const p = document.createElement('p');
  p.style.padding = '16px';
  p.style.color = '#b91c1c';
  p.textContent = msg;
  return p;
}

async function boot() {
  try {
    await initI18n();
  } catch (e) {
    document.body.insertBefore(bootError('文案字典加载失败：' + e.message + '。请用本地 HTTP 服务器打开本页。'),
      document.body.firstChild);
    return;
  }
  try {
    courses = await loadCourses();
  } catch (e) {
    document.body.insertBefore(bootError('课程数据加载失败：' + e.message), document.body.firstChild);
    return;
  }

  $('#langSwitchHost').appendChild(buildLangSwitcher(() => rerender()));
  rerender();

  onProgressChange(() => { renderDashboard(); renderCards(); });

  initSearch({ courses });
  const openBtn = $('#searchBtn');
  openBtn.addEventListener('click', () => openSearch());
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    if (e.key === '/' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); openSearch(); }
  });
}

boot();


VIS['portal'] = {  };
})();

})();
