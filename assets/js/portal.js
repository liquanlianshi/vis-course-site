/* =============================================================
   portal.js —— 课程门户逻辑
   · 章节卡片由数据渲染（重构前是手写死的 5 张卡片）
   · 新增「学习进度总览」：环形总进度 + 分章进度条 + 继续学习
   · 新增全站搜索入口
   ============================================================= */

import { initI18n, t, getLocale, dataKey, buildLangSwitcher, applyToDOM } from './i18n.js';
import { loadCourses, totalProgress, onProgressChange } from './store.js';
import { initSearch, openSearch } from './search.js';

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
      const { resetProgress } = await import('./store.js');
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
