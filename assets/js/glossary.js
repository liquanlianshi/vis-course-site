/* =============================================================
   glossary.js —— 术语表（本次新增）
   -------------------------------------------------------------
   两个使用方式：
     1. 正文里自动给术语加虚线下划线，悬停/点击弹出解释
        （每个术语在整页里最多标注 N 次，避免满屏下划线）
     2. 汇总页 site/glossary/ 列出全部术语，支持搜索
   数据来自 assets/data/glossary.json（中英对照 + 解释）。
   ============================================================= */

import { getLocale, dataKey, siteUrl, t } from './i18n.js';

let glossary = null;
let glossaryPromise = null;
let tooltip = null;
let activeTerm = null;

export function loadGlossary() {
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

export function getGlossary() { return glossary || []; }

export function findTerm(name) {
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
export function applyGlossary(root, maxPerTerm = 2) {
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

export function clearGlossaryMarks(root) {
  if (!root) return;
  root.querySelectorAll('.term').forEach((el) => {
    const txt = document.createTextNode(el.textContent);
    el.parentNode.replaceChild(txt, el);
  });
  if (root.normalize) root.normalize();
}

/* ---------------- 汇总页 ---------------- */
export function renderGlossaryPage(host, lang) {
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
export function openGlossary(host) {
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
export async function initGlossary() {
  try {
    await loadGlossary();
    return true;
  } catch (e) {
    console.warn('[glossary] 加载失败:', e.message);
    return false;
  }
}
