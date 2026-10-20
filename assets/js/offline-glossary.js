/* 本文件由 build/make_offline.py 生成：glossary 入口。不要手改。 */
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
const { getLocale, dataKey, siteUrl, t } = VIS['i18n'];

/* =============================================================
   glossary.js —— 术语表（本次新增）
   -------------------------------------------------------------
   两个使用方式：
     1. 正文里自动给术语加虚线下划线，悬停/点击弹出解释
        （每个术语在整页里最多标注 N 次，避免满屏下划线）
     2. 汇总页 site/glossary/ 列出全部术语，支持搜索
   数据来自 assets/data/glossary.json（中英对照 + 解释）。
   ============================================================= */



let glossary = null;
let glossaryPromise = null;
let tooltip = null;
let activeTerm = null;

function loadGlossary() {
  if (!glossaryPromise) {
    glossaryPromise = fetch(siteUrl('assets/data/glossary.json'))
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then((d) => {
        glossary = d.terms || [];
        return glossary;
      })
      .catch((e) => {
        glossaryPromise = null;
        throw e;
      });
  }
  return glossaryPromise;
}

function getGlossary() { return glossary || []; }

function findTerm(name) {
  if (!glossary) return null;
  return glossary.find((g) => g.zh === name || g.en === name) || null;
}

/* ---------------- 悬停提示 ---------------- */
function ensureTooltip() {
  if (tooltip) return tooltip;
  tooltip = document.createElement('div');
  tooltip.className = 'term-tip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.appendChild(tooltip);
  document.addEventListener('scroll', hideTip, { passive: true, capture: true });
  window.addEventListener('resize', hideTip);
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.term') && !e.target.closest('.term-tip')) hideTip();
  });
  return tooltip;
}

function showTip(el, term) {
  const tip = ensureTooltip();
  const lang = dataKey();
  const title = `${term.zh}${term.en && term.en !== term.zh ? ' · ' + term.en : ''}`;
  tip.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(term.desc[lang] || term.desc.zh)}</p>
    <a href="${siteUrl('glossary/index.html')}#${encodeURIComponent(term.zh)}" target="_blank" rel="noopener">${
    dataKey() === 'zh' ? '在术语表中查看 →' : 'Open in glossary →'}</a>`;
  tip.hidden = false;
  const r = el.getBoundingClientRect();
  const tw = tip.offsetWidth;
  const th = tip.offsetHeight;
  let left = r.left + window.scrollX + r.width / 2 - tw / 2;
  left = Math.max(8, Math.min(left, window.scrollX + document.documentElement.clientWidth - tw - 8));
  let top = r.top + window.scrollY - th - 8;
  if (top < window.scrollY + 4) top = r.bottom + window.scrollY + 8;   // 上面放不下就放下方
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
  activeTerm = el;
}

function hideTip() {
  if (tooltip) tooltip.hidden = true;
  activeTerm = null;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* ---------------- 正文标注 ---------------- */
const SKIP_TAGS = new Set(['PRE', 'CODE', 'A', 'BUTTON', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SVG', 'PATH', 'TEXT']);
const SKIP_CLOSEST = '.term, .visual-figure, .viz-interactive, .mindmap, .search-panel, .term-tip, .chapter-nav';

/**
 * 给 root 内正文里的术语加下划线。
 * @param root  容器（一般是当前激活小节）
 * @param maxPerTerm 这一次调用（通常是当前激活的那一个小节）里，同一术语最多标注几次；
 *                    调用方在小节切换时各自调用，因此计数不跨小节累计
 */
function applyGlossary(root, maxPerTerm = 2) {
  if (!glossary || !glossary.length || !root) return 0;
  const lang = dataKey();
  // 长词优先，避免「数据」把「数据质量」切碎
  const terms = glossary
    .map((g) => ({ g, name: lang === 'zh' ? g.zh : g.en }))
    .filter((x) => x.name && x.name.length >= 2)
    .sort((a, b) => b.name.length - a.name.length);

  const counts = new Map();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets = [];
  let node = walker.nextNode();
  while (node) {
    const p = node.parentElement;
    if (p && !SKIP_TAGS.has(p.tagName) && !p.closest(SKIP_CLOSEST)
        // SVG <text> 与标题不参与标注：前者塞 HTML 子节点会吞掉文字，后者会弄脏标题
        && !p.closest('svg') && !p.closest('h1,h2,h3,h4')
        && node.nodeValue.trim().length > 1) {
      targets.push(node);
    }
    node = walker.nextNode();
  }

  let wrapped = 0;
  targets.forEach((textNode) => {
    let current = textNode;
    let guard = 0;
    while (current && guard++ < 4) {
      const text = current.nodeValue;
      let hit = null;
      for (const term of terms) {
        const used = counts.get(term.g.zh) || 0;
        if (used >= maxPerTerm) continue;
        const idx = lang === 'zh' ? text.indexOf(term.name) : matchWord(text, term.name);
        if (idx >= 0 && (!hit || idx < hit.idx)) hit = { term, idx };
      }
      if (!hit) break;
      const name = lang === 'zh' ? hit.term.name : text.substr(hit.idx, hit.term.name.length);
      const before = current.nodeValue.slice(0, hit.idx);
      const after = current.nodeValue.slice(hit.idx + name.length);
      const span = document.createElement('span');
      span.className = 'term';
      span.dataset.term = hit.term.g.zh;
      span.tabIndex = 0;
      span.textContent = name;
      const binding = () => showTip(span, hit.term.g);
      span.addEventListener('mouseenter', binding);
      span.addEventListener('focus', binding);
      span.addEventListener('click', (e) => { e.preventDefault(); binding(); });
      span.addEventListener('mouseleave', hideTip);
      span.addEventListener('blur', hideTip);
      const parent = current.parentNode;
      if (!parent) break;
      // 把原文本节点拆成「前段 + 术语 span + 后段」，然后必须把原节点删掉，
      // 否则原文会连同新节点一起留在 DOM 里（表现为整句重复一遍）。
      const beforeNode = document.createTextNode(before);
      const rest = after ? document.createTextNode(after) : null;
      parent.insertBefore(beforeNode, current);
      parent.insertBefore(span, current);
      if (rest) parent.insertBefore(rest, current);
      parent.removeChild(current);
      current = rest;
      counts.set(hit.term.g.zh, (counts.get(hit.term.g.zh) || 0) + 1);
      wrapped += 1;
    }
  });
  return wrapped;
}

/** 英文按词边界匹配，避免 "data" 命中 "database" 内部 */
function matchWord(text, word) {
  const lower = text.toLowerCase();
  const w = word.toLowerCase();
  let from = 0;
  while (from <= lower.length - w.length) {
    const idx = lower.indexOf(w, from);
    if (idx < 0) return -1;
    const before = idx === 0 ? ' ' : lower[idx - 1];
    const after = idx + w.length >= lower.length ? ' ' : lower[idx + w.length];
    if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) return idx;
    from = idx + 1;
  }
  return -1;
}

function clearGlossaryMarks(root) {
  if (!root) return;
  root.querySelectorAll('.term').forEach((el) => {
    const txt = document.createTextNode(el.textContent);
    el.parentNode.replaceChild(txt, el);
  });
  if (root.normalize) root.normalize();
}

/* ---------------- 汇总页 ---------------- */
function renderGlossaryPage(host, lang) {
  const zh = lang === 'zh';
  const list = getGlossary();
  if (!list.length) {
    host.innerHTML = `<p class="viz-note">${zh ? '术语数据未加载' : 'glossary not loaded'}</p>`;
    return;
  }
  host.innerHTML = `
    <div class="gloss-search">
      <input type="search" id="glossFilter" autocomplete="off"
             placeholder="${zh ? '过滤术语…' : 'filter terms…'}" aria-label="${zh ? '过滤术语' : 'filter terms'}">
      <span class="gloss-count" id="glossCount"></span>
    </div>
    <dl class="gloss-list">
      ${list.map((g) => `
        <div class="gloss-item" id="${encodeURIComponent(g.zh)}" data-key="${escapeHtml((g.zh + ' ' + g.en).toLowerCase())}">
          <dt><span class="zh">${escapeHtml(g.zh)}</span><span class="en">${escapeHtml(g.en)}</span></dt>
          <dd>${escapeHtml(g.desc[lang] || g.desc.zh)}</dd>
        </div>`).join('')}
    </dl>`;
  const input = host.querySelector('#glossFilter');
  const count = host.querySelector('#glossCount');
  const items = [...host.querySelectorAll('.gloss-item')];
  const update = () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    items.forEach((it) => {
      const on = !q || it.dataset.key.includes(q) || it.querySelector('dd').textContent.toLowerCase().includes(q);
      it.hidden = !on;
      if (on) shown += 1;
    });
    count.textContent = zh ? `显示 ${shown} / ${items.length} 条` : `${shown} / ${items.length} shown`;
  };
  input.addEventListener('input', update);
  update();
  // 支持从正文跳转过来时直接定位（hash 完全由用户控制，畸形输入不能让整页挂掉）
  if (location.hash) {
    let raw = '';
    try {
      raw = decodeURIComponent(location.hash.slice(1));
    } catch (e) {
      raw = '';   // 例如 #% 这类畸形转义
    }
    const target = raw ? host.querySelector('.gloss-item[id="' + CSS.escape(raw) + '"]') : null;
    if (target) {
      target.classList.add('gloss-item--flash');
      target.scrollIntoView({ block: 'center' });
    }
  }
}

/** 顶栏「术语表」按钮：打开一个轻量弹层 */
function openGlossary(host) {
  const zh = dataKey() === 'zh';
  let overlay = document.getElementById('glossOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'glossOverlay';
    overlay.className = 'search-overlay';
    overlay.innerHTML = `
      <div class="search-panel gloss-panel" role="dialog" aria-modal="true"
           aria-label="${zh ? '术语表' : 'Glossary'}">
        <div class="search-head">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v18H6.5A2.5 2.5 0 0 1 4 18.5z"></path>
            <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H19"></path>
          </svg>
          <strong>${zh ? '术语表' : 'Glossary'}</strong>
          <button class="icon-btn" type="button" id="glossClose" aria-label="${t('search.close')}">✕</button>
        </div>
        <div class="search-results" id="glossBody"></div>
        <div class="search-foot"><span></span><span>Esc ${zh ? '关闭' : 'close'}</span></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') overlay.classList.remove('open');
    });
    overlay.querySelector('#glossClose').addEventListener('click', () => overlay.classList.remove('open'));
  }
  renderGlossaryPage(overlay.querySelector('#glossBody'), dataKey());
  overlay.classList.add('open');
}

/* ---------------- 初始化 ---------------- */
async function initGlossary() {
  try {
    await loadGlossary();
    return true;
  } catch (e) {
    console.warn('[glossary] 加载失败:', e.message);
    return false;
  }
}


VIS['glossary'] = { loadGlossary: loadGlossary, getGlossary: getGlossary, findTerm: findTerm, applyGlossary: applyGlossary, clearGlossaryMarks: clearGlossaryMarks, renderGlossaryPage: renderGlossaryPage, openGlossary: openGlossary, initGlossary: initGlossary };
})();

(function () {
const { initI18n, applyToDOM, buildLangSwitcher, t, getLocale, dataKey, onLocaleChange, siteUrl } = VIS['i18n'];
const { initGlossary, renderGlossaryPage } = VIS['glossary'];

/* =============================================================
   glossary-page.js —— 术语表汇总页入口
   ============================================================= */




const $ = (sel) => document.querySelector(sel);

async function boot() {
  const host = $('#glossaryBody');
  try {
    await initI18n();
  } catch (e) {
    // 不用 innerHTML：e.message 虽来自 fetch/JSON.parse（当前不可控），
    // 但错误消息走 textContent 更稳妥，万一将来被注入也不会变成 XSS。
    const p = document.createElement('p');
    p.className = 'viz-note';
    p.textContent = '文案字典加载失败：' + e.message + '（请通过 HTTP 服务器打开本页）';
    host.replaceChildren(p);
    return;
  }
  document.title = t('nav.glossary') + ' · ' + t('portal.title');
  applyToDOM();
  const langHost = $('#langHost');
  if (langHost) langHost.appendChild(buildLangSwitcher(() => {
    applyToDOM();
    document.documentElement.lang = getLocale();
    render();
  }));

  const ok = await initGlossary();
  if (!ok) {
    host.innerHTML = '<p class="viz-note">未能加载术语数据（assets/data/glossary.json）。</p>';
    return;
  }
  render();

  function render() {
    renderGlossaryPage(host, dataKey());
  }

  onLocaleChange(() => { applyToDOM(); render(); });
}

boot();


VIS['glossary-page'] = {  };
})();

})();
