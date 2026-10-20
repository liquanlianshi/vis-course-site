/* =============================================================
   search.js —— 全站搜索（重构新增）
   -------------------------------------------------------------
   · 索引在首次打开搜索面板时才加载（lessons.json 约 150KB，不拖慢首屏）
   · 命中范围：小节标题 / 小节内 h3 小标题 / 正文（讲解+代码+演示说明）
   · 结果可直接跳转到「章节 · 小节 · 讲解」，同章内不刷新页面
   ============================================================= */

import { t, getLocale, dataKey, siteUrl } from './i18n.js';
import { loadSearchIndex } from './store.js';

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

export function initSearch({ courses, onSectionJump }) {
  coursesRef = courses;
  onJump = onSectionJump;
  buildOverlay();
  return { open, close };
}

export { open as openSearch, close as closeSearch };
