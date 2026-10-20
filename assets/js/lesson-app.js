/* =============================================================
   lesson-app.js —— 章节页应用（重构核心）
   -------------------------------------------------------------
   把原站每个 lesson-XX/index.html 里 400~900 行的硬编码正文，
   改为「薄壳 HTML + 数据渲染」：
     · 顶栏 / 目录 / 小节结构 / 上下章导航由本文件统一生成
       （重构前这些在 5 个页面里各复制一份）
     · 正文按当前语言从 lesson-XX.json 取，DOM 只存在一份
       （重构前中英各渲染一遍，英文 hidden）
     · tab 切换、深链 #小节/标签、键盘快捷键、学习进度、阅读进度
   ============================================================= */

import { initI18n, t, getLocale, dataKey, buildLangSwitcher, applyToDOM, onLocaleChange, siteUrl } from './i18n.js';
import {
  loadCourses, loadLesson, loadSummaries, isDone, toggleDone, onProgressChange,
  chapterProgress, chapterReadMinutes,
} from './store.js';
import { mountVisuals, knowledgeMapSvg, bindKnowledgeMap } from './visuals.js';
import { mindmapSvg, bindMindmap } from './mindmap.js';
import { initGlossary, applyGlossary, openGlossary, findTerm, clearGlossaryMarks } from './glossary.js';
import { initSearch } from './search.js';

const TABS = ['explain', 'code', 'demo'];
const TAB_KEYS = { explain: 'tab.explain', code: 'tab.code', demo: 'tab.demo' };

/* 描边图标：避免各页散落 emoji，粗细与文字视觉重量对齐 */
const ICON = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle>
    <path d="m20 20-3.2-3.2"></path></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v18H6.5A2.5 2.5 0 0 1 4 18.5z"></path>
    <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H19"></path></svg>`,
  explain: `<svg class="tab-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 5h16"></path>
    <path d="M4 10h16"></path><path d="M4 15h10"></path><path d="M4 20h7"></path></svg>`,
  code: `<svg class="tab-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m9 8-4 4 4 4"></path><path d="m15 8 4 4-4 4"></path></svg>`,
  demo: `<svg class="tab-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5"></circle><path d="m10.5 9 4.5 3-4.5 3z"></path></svg>`,
};
const TAB_ICON = { explain: ICON.explain, code: ICON.code, demo: ICON.demo };

const lessonId = document.body.dataset.lesson;
let courses = null;
let lesson = null;
let summaries = null;
let currentSection = null;
let currentTab = 'explain';

const $ = (sel) => document.querySelector(sel);

const lang = () => getLocale();
/** JSON 里双语正文的键：'zh' / 'en'（与 locale 'zh-CN' / 'en-US' 不同） */
const dk = () => dataKey();
const pick = (obj) => (obj && (obj[dk()] || obj.zh)) || '';

/* ============================================================
   URL 契约：#<sectionId>/<tab>  例如 #ch-1-3/code
   （重构前只支持 #<sectionId>，且进入小节会强制跳到 demo tab）
   ============================================================ */
function parseHash() {
  let raw = '';
  try {
    // 畸形 hash（如 #%、#%zz）会让 decodeURIComponent 抛 URIError，
    // 而 hash 完全由用户控制，这里必须兜住，否则整个 boot 流程会中断
    raw = decodeURIComponent(location.hash.replace(/^#/, ''));
  } catch (e) {
    raw = location.hash.replace(/^#/, '');
  }
  if (!raw) return {};
  const [sec, tab] = raw.split('/');
  return { sec, tab: TABS.includes(tab) ? tab : null };
}

function writeHash(secId, tab) {
  const next = '#' + secId + '/' + tab;
  if (location.hash === next) return;
  // file:// 下个别浏览器会禁用 history API；失败时静默跳过，不影响切换
  try { history.replaceState(null, '', next); } catch (e) { /* ignore */ }
}

/* ============================================================
   顶栏
   ============================================================ */
function renderTopbar() {
  const nav = $('#topbar');
  nav.setAttribute('aria-label', t('nav.home'));
  nav.innerHTML = `
    <div class="course-topbar__inner">
      <a class="brand" href="../index.html">
        <span class="brand-mark" aria-hidden="true"></span>
        <span class="back" aria-hidden="true">←</span><span>${t('nav.home')}</span>
      </a>
      <ul class="tabs">
        ${courses.chapters.map((ch) => `
          <li><a href="../${ch.id}/index.html"${ch.id === lessonId ? ' class="current" aria-current="page"' : ''}>${t(ch.navKey)}</a></li>
        `).join('')}
      </ul>
      <div class="topbar-actions">
        <button class="icon-btn" id="glossaryBtn" type="button"
                title="${t('nav.glossary')}" aria-label="${t('nav.glossary')}">${ICON.book}</button>
        <button class="icon-btn" id="searchBtn" type="button"
                data-i18n-title="search.open" aria-label="${t('search.open')}">${ICON.search}</button>
      </div>
    </div>`;
  // 顶栏章节条是横向滚动的：只在当前章不可见时做「最小滚动」，
  // 避免把左侧章节整块推出视野（窄屏打开第 5 章时才会滚动）
  requestAnimationFrame(() => {
    const strip = nav.querySelector('ul.tabs');
    const cur = strip && strip.querySelector('a.current');
    if (!strip) return;
    strip.classList.toggle('is-scrollable', strip.scrollWidth > strip.clientWidth + 1);
    if (!cur) return;
    const sr = strip.getBoundingClientRect();
    const cr = cur.getBoundingClientRect();
    if (cr.left < sr.left) strip.scrollLeft -= sr.left - cr.left + 10;
    else if (cr.right > sr.right) strip.scrollLeft += cr.right - sr.right + 10;
    strip.classList.toggle('is-scrollable', strip.scrollWidth > strip.clientWidth + 1);
  });
  const actions = nav.querySelector('.topbar-actions');
  actions.appendChild(buildLangSwitcher(() => rerenderAll()));
  nav.querySelector('#searchBtn').addEventListener('click', () => window.__visOpenSearch && window.__visOpenSearch());
  nav.querySelector('#glossaryBtn').addEventListener('click', () => openGlossary());
}

/* ============================================================
   页头（章标题 + 章内进度）
   ============================================================ */
function renderHeader() {
  const chapter = courses.chapters.find((c) => c.id === lessonId);
  const p = chapterProgress(chapter);
  const mins = chapterReadMinutes(chapter);
  const header = $('#lessonHeader');
  header.innerHTML = `
    <div class="lesson-header__inner">
      <div>
        <p class="lesson-kicker">${lang() === 'zh-CN' ? '第 ' + chapter.order + ' 章' : 'Chapter ' + chapter.order}</p>
        <h1>${pick(chapter.card.title) || t(chapter.navKey)}</h1>
        <p class="subtitle">${chapter.sections.length} ${lang() === 'zh-CN' ? '个小节' : 'sections'} · ${t('study.readtime', { n: mins })}</p>
      </div>
      <div class="chapter-progress" role="group" aria-label="${t('study.progress')}">
        <span>${t('study.progress')}</span>
        <span class="progress-track"><i style="width:${p.percent}%"></i></span>
        <span>${p.done} / ${p.total}</span>
      </div>
      <div class="header-tip">${t('kbd.hint')}</div>
    </div>`;
}

/* ============================================================
   左侧目录
   ============================================================ */
function renderTOC() {
  const chapter = courses.chapters.find((c) => c.id === lessonId);
  const nav = $('#chapterNav');
  nav.setAttribute('aria-label', t('nav.toc'));
  const sum = summaries && summaries[lessonId];
  nav.innerHTML = `
    <h3>${t('nav.toc')}</h3>
    <ul>
      ${chapter.sections.map((s) => `
        <li><a href="#${s.id}/explain" data-chapter="${s.id}">
          <span class="toc-mark" aria-hidden="true">${isDone(s.id) ? '✓' : ''}</span>
          <span class="toc-label">${pick(s.title)}</span>
        </a></li>`).join('')}
      ${sum ? `
        <li><a href="#${summaryId()}/explain" data-chapter="${summaryId()}" class="toc-summary">
          <span class="toc-mark" aria-hidden="true">§</span>
          <span class="toc-label">${pick(sum.title)}</span>
        </a></li>` : ''}
    </ul>
    <div class="nav-tip">
      <a href="../supplementary/index.html#chapter-${chapter.order}" target="_blank" rel="noopener">${t('common.supplementary')}</a>
      ${chapter.hasDemoFolder ? `<a href="./demo/index.html" target="_blank" rel="noopener">${t('common.demo-folder')}</a>` : ''}
      <a href="./lecture.md" target="_blank" rel="noopener">${t('common.full-lecture')}</a>
      <a href="../glossary/index.html" target="_blank" rel="noopener">${t('nav.glossary')}</a>
    </div>`;
  nav.querySelectorAll('a[data-chapter]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      activateSection(a.dataset.chapter, 'explain', { scroll: true, focus: true });
    });
  });
}

const summaryId = () => 'ch-' + lessonId.replace(/^lesson-0*/, '') + '-summary';

/* ============================================================
   正文
   ============================================================ */
function sectionToolbar(section, chapter) {
  const done = isDone(section.id);
  const idx = chapter.sections.findIndex((s) => s.id === section.id);
  const meta = chapter.sections[idx];
  return `
    <div class="sec-toolbar">
      <span class="sec-meta">${t('study.readtime', { n: meta.readMin || 1 })}</span>
      <span class="sec-meta" aria-hidden="true">·</span>
      <span class="sec-meta">${idx + 1} / ${chapter.sections.length}</span>
      <button class="btn btn-ok" type="button" data-mark="${section.id}"
              aria-pressed="${done}">${done ? t('study.completed') : t('study.mark')}</button>
    </div>`;
}

/** HTML 转义：用于把纯文本插进 innerHTML / 属性（小结正文含刻意保留的 <strong>，不走这里） */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/** 「本章小结」：思维导图 + 要点回顾 + 关键术语 */
function summaryArticle(chapter) {
  const sum = summaries && summaries[lessonId];
  if (!sum) return '';
  const lang = dk();
  const points = (sum.points || []).map((p) => `<li>${pick(p)}</li>`).join('');
  // 思维导图的叶子来自大纲：优先用正文里的双语大纲，避免英文模式露出中文
  const mapChapter = {
    ...chapter,
    sections: chapter.sections.map((cs) => {
      const ls = (lesson.sections || []).find((x) => x.id === cs.id);
      return ls && ls.outline && ls.outline.length ? { ...cs, outline: ls.outline } : cs;
    }),
  };
  const terms = (sum.terms || []).map((name) => {
    const g = findTerm(name);
    const label = g ? (lang === 'zh' ? g.zh : g.en) : name;
    return `<a class="term-chip" href="../glossary/index.html#${encodeURIComponent(name)}" target="_blank" rel="noopener"
              ${g ? `title="${escapeHtml(g.desc[lang] || g.desc.zh)}"` : ''}>${escapeHtml(label)}</a>`;
  }).join('');
  return `
    <article class="chapter chapter-summary" id="${summaryId()}" aria-labelledby="${summaryId()}-h2">
      <h2 id="${summaryId()}-h2">${pick(sum.title)}</h2>
      <p class="chapter-subtitle">${pick(sum.lead)}</p>
      <div class="summary-mindmap">
        <h3 class="summary-h3">${lang === 'zh' ? '这一章的结构' : 'How this chapter fits together'}</h3>
        ${mindmapSvg(mapChapter, sum, lang)}
      </div>
      <div class="summary-points-wrap">
        <h3 class="summary-h3">${lang === 'zh' ? '要点回顾' : 'Key points'}</h3>
        <ol class="summary-points">${points}</ol>
      </div>
      <div class="summary-terms-wrap">
        <h3 class="summary-h3">${lang === 'zh' ? '关键术语' : 'Key terms'}</h3>
        <div class="summary-terms">${terms}</div>
        <p class="summary-more"><a href="../glossary/index.html" target="_blank" rel="noopener">${
          lang === 'zh' ? '查看完整术语表 →' : 'Open the full glossary →'}</a></p>
      </div>
    </article>`;
}

function renderContent() {
  const chapter = courses.chapters.find((c) => c.id === lessonId);
  const host = $('#chapterContent');
  host.innerHTML = lesson.sections.map((sec) => {
    const panels = sec.panels || {};
    return `
    <article class="chapter" id="${sec.id}" aria-labelledby="${sec.id}-h2">
      <h2 id="${sec.id}-h2">${pick(sec.title)}</h2>
      <p class="chapter-subtitle">${pick(sec.subtitle) || ''}</p>
      ${sectionToolbar(sec, chapter)}
      ${knowledgeMapSvg(chapter, sec.id, dk())}
      <div class="tabs" role="tablist" aria-label="${t('a11y.tablist')}">
        ${TABS.map((tb) => `
          <button class="tab-btn" type="button" role="tab" data-tab="${tb}"
                  id="${sec.id}-tab-${tb}" aria-controls="${sec.id}-panel-${tb}"
                  aria-selected="false" tabindex="-1">${TAB_ICON[tb]}<span>${t(TAB_KEYS[tb])}</span></button>`).join('')}
      </div>
      <div class="tab-panels">
        ${TABS.map((tb) => `
          <div class="tab-panel" data-panel="${tb}" role="tabpanel"
               id="${sec.id}-panel-${tb}" aria-labelledby="${sec.id}-tab-${tb}" tabindex="0">
            ${(panels[tb] && panels[tb][dk()]) || ''}
          </div>`).join('')}
      </div>
    </article>`;
  }).join('') + summaryArticle(chapter);

  // 标记已学
  host.querySelectorAll('[data-mark]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.mark;
      const nowDone = toggleDone(id);
      btn.setAttribute('aria-pressed', String(nowDone));
      btn.textContent = nowDone ? t('study.completed') : t('study.mark');
      updateTocMarks();
      renderHeader();
      // 全部学完时的鼓励提示
      const chapter = courses.chapters.find((c) => c.id === lessonId);
      const p = chapterProgress(chapter);
      if (p.done === p.total) flash(t('study.all-done'));
    });
  });

  // tab 按钮
  host.querySelectorAll('.chapter').forEach((article) => {
    const btns = [...article.querySelectorAll('.tab-btn')];
    btns.forEach((btn, i) => {
      btn.addEventListener('click', () => selectTab(article.id, btn.dataset.tab));
      btn.addEventListener('keydown', (e) => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const next = btns[(i + dir + btns.length) % btns.length];
        next.focus();
        selectTab(article.id, next.dataset.tab);
      });
    });

    // 讲解区插图（本次重构新增）
    mountVisuals(article, article.id, dk());
    // 知识地图上的节点可点击跳转
    const km = article.querySelector('.knowledge-map');
    if (km) bindKnowledgeMap(km, (sid) => activateSection(sid, 'explain', { scroll: true }));
    // 代码复制按钮
    article.querySelectorAll('.tab-panel[data-panel="code"] pre').forEach(addCopyButton);
  });

  applyToDOM(host);
}

/** 给代码块加"复制"按钮（重构新增的学习辅助） */
function addCopyButton(pre) {
  const wrap = document.createElement('div');
  wrap.className = 'code-block';
  pre.parentNode.insertBefore(wrap, pre);
  wrap.appendChild(pre);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'code-copy';
  btn.textContent = lang() === 'zh-CN' ? '复制' : 'Copy';
  btn.addEventListener('click', async () => {
    const text = pre.innerText;
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = lang() === 'zh-CN' ? '已复制 ✓' : 'Copied ✓';
    } catch (e) {
      btn.textContent = lang() === 'zh-CN' ? '复制失败' : 'Failed';
    }
    setTimeout(() => { btn.textContent = lang() === 'zh-CN' ? '复制' : 'Copy'; }, 1600);
  });
  wrap.appendChild(btn);
}

function updateTocMarks() {
  document.querySelectorAll('#chapterNav a[data-chapter]').forEach((a) => {
    const done = isDone(a.dataset.chapter);
    a.classList.toggle('is-done', done);
    const mark = a.querySelector('.toc-mark');
    if (mark) mark.textContent = done ? '✓' : '';
  });
}

/* ============================================================
   右侧本节导读（scrollspy）
   ============================================================ */
let scrollSpy = null;

function renderOutline(sec) {
  const host = $('#sectionOutline');
  if (!sec) {                         // 小结视图没有大纲，收起右栏
    if (scrollSpy) { scrollSpy.disconnect(); scrollSpy = null; }
    host.innerHTML = '';
    $('#lessonMain').classList.remove('with-outline');
    return;
  }
  const items = (sec.outline || []).map((o, i) => {
    const title = o[dk()] || o.zh;
    if (!title) return '';
    return `<li><a href="#" data-outline="${i}">${title}</a></li>`;
  }).join('');
  if (!items) {
    host.innerHTML = '';
    $('#lessonMain').classList.remove('with-outline');
    return;
  }
  $('#lessonMain').classList.add('with-outline');
  host.innerHTML = `<h4>${t('nav.outline')}</h4><ul>${items}</ul>`;

  const article = document.getElementById(sec.id);
  const heads = [...article.querySelectorAll('.tab-panel[data-panel="explain"] h3')];
  const links = [...host.querySelectorAll('a[data-outline]')];
  links.forEach((a, i) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      selectTab(sec.id, 'explain');
      const h = heads[i];
      if (h) {
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        h.style.transition = 'background .4s';
        h.style.background = '#fde68a';
        setTimeout(() => { h.style.background = ''; }, 900);
      }
    });
  });

  if (scrollSpy) scrollSpy.disconnect();
  if (!heads.length) return;
  scrollSpy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const i = heads.indexOf(en.target);
      links.forEach((l, li) => l.classList.toggle('active', li === i));
    });
  }, { rootMargin: '-72px 0px -70% 0px', threshold: 0 });
  heads.forEach((h) => scrollSpy.observe(h));
}

/* ============================================================
   小节 / 标签 激活
   ============================================================ */
async function selectTab(secId, tab, { pushUrl = true } = {}) {
  const article = document.getElementById(secId);
  if (!article) return;
  currentTab = tab;
  article.querySelectorAll('.tab-btn').forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  article.querySelectorAll('.tab-panel').forEach((p) => {
    p.classList.toggle('active', p.dataset.panel === tab);
  });
  if (pushUrl && currentSection) writeHash(currentSection, tab);
  if (tab === 'demo') renderDemosIn(article);
}

/**
 * 同步「当前小节」在正文与目录上的高亮。
 * 任何重建 DOM 的地方（activateSection、rerenderAll）都必须重做一次：
 * 正文 article 靠 .active 才可见（.chapter 默认 display:none），
 * 目录靠 .active / aria-current 标识当前位置。
 */
function syncActiveMarkers() {
  document.querySelectorAll('.chapter').forEach((c) => {
    c.classList.toggle('active', c.id === currentSection);
  });
  document.querySelectorAll('#chapterNav a[data-chapter]').forEach((a) => {
    const on = a.dataset.chapter === currentSection;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
}

async function activateSection(secId, tab, { scroll = true, focus = false } = {}) {
  const chapter = courses.chapters.find((c) => c.id === lessonId);
  const isSummary = secId === summaryId();
  const sec = isSummary ? null : lesson.sections.find((s) => s.id === secId);
  if (!isSummary && !sec) return;
  currentSection = secId;

  syncActiveMarkers();

  if (isSummary) {
    // 小结没有「大纲」，收起右侧栏让导图获得整宽
    renderOutline(null);
    const art = document.getElementById(secId);
    // bindMindmap 自身幂等（每个分支记 data-mm-bound），这里不需要额外守卫
    if (art) bindMindmap(art, (sid) => activateSection(sid, 'explain', { scroll: true }));
    applyGlossary(document.getElementById(secId));
    writeHash(secId, 'explain');
    try { localStorage.setItem('vis.last', lessonId + '#' + secId); } catch (e) { /* ignore */ }
    if (scroll) {
      const el = document.getElementById(secId);
      if (el) window.scrollTo({ top: Math.max(0, el.offsetTop - 70), behavior: 'smooth' });
    }
    void chapter;
    return;
  }

  renderOutline(sec);
  await selectTab(secId, tab || 'explain');
  writeHash(secId, currentTab);
  // 记住学习位置（门户"继续学习"用）
  try { localStorage.setItem('vis.last', lessonId + '#' + secId); } catch (e) { /* ignore */ }

  // 新激活的小节里给术语加下划线提示（每节只做一次）
  const article = document.getElementById(secId);
  if (article && article.dataset.gloss !== '1') {
    applyGlossary(article);
    article.dataset.gloss = '1';
  }

  if (scroll) {
    if (article) window.scrollTo({ top: Math.max(0, article.offsetTop - 70), behavior: 'smooth' });
  }
  if (focus && location.hash) {
    const h2 = document.getElementById(secId + '-h2');
    if (h2) h2.focus && h2.focus();
  }
  void chapter;
}

/* ============================================================
   Demo 渲染（按章动态加载对应模块）
   ============================================================ */
let demosModulePromise = null;

function loadDemos() {
  if (!demosModulePromise) demosModulePromise = import('./demos/' + lessonId + '.js');
  return demosModulePromise;
}

function errorNote(msg) {
  const p = document.createElement('p');
  p.className = 'demo-hint';
  p.textContent = msg;
  return p;
}

async function renderDemosIn(article) {
  const mounts = [...article.querySelectorAll('.demo-mount')];
  if (!mounts.length) return;
  let mod;
  try {
    mod = await loadDemos();
  } catch (e) {
    mounts.forEach((m) => { m.replaceChildren(errorNote('demo 模块加载失败: ' + e.message)); });
    return;
  }
  const demos = mod.demos || {};
  await Promise.all(mounts.map(async (mount) => {
    if (mount.dataset.rendered) return;
    // 兼容两种挂载点写法（data-demo / id="demo-mount-xxx"）
    const name = mount.dataset.demo || (mount.id || '').replace(/^demo-mount-/, '');
    const fn = demos[name];
    if (typeof fn !== 'function') {
      // name 来自 lesson JSON 的 data-demo 属性（静态数据），仍走 textContent 保持一套写法
      const p = document.createElement('p');
      p.className = 'demo-hint';
      p.textContent = (lang() === 'zh-CN' ? '未找到演示：' : 'Demo not found: ') + name;
      mount.replaceChildren(p);
      return;
    }
    mount.dataset.rendered = '1';
    try {
      await fn(mount);
    } catch (e) {
      delete mount.dataset.rendered;
      console.error('[demo ' + name + ']', e);
      mount.replaceChildren(errorNote((lang() === 'zh-CN' ? '△ 演示运行出错：' : '△ Demo error: ') +
        String(e && e.message || e)));
    }
  }));
}

/* ============================================================
   页脚 + 上下章导航
   ============================================================ */
function renderFooter() {
  const idx = courses.chapters.findIndex((c) => c.id === lessonId);
  const prev = courses.chapters[idx - 1];
  const next = courses.chapters[idx + 1];
  const pager = $('#chapterPager');
  if (pager) {
    pager.className = 'chapter-pager' + (!prev ? ' no-prev' : '') + (!next ? ' no-next' : '');
    pager.innerHTML = `
      ${prev ? `<a class="pager-prev" href="../${prev.id}/index.html" aria-label="${t('common.prev.aria')}">
        <span class="pager-dir">${t('common.prev')}</span>
        <span class="pager-title">${t(prev.navKey)}</span></a>` : '<span class="pager-empty"></span>'}
      ${next ? `<a class="pager-next" href="../${next.id}/index.html" aria-label="${t('common.next.aria')}">
        <span class="pager-dir">${t('common.next')}</span>
        <span class="pager-title">${t(next.navKey)}</span></a>` : '<span class="pager-empty"></span>'}
      <a class="pager-portal" href="../index.html">${t('nav.home')}</a>`;
  }
  const footer = $('#siteFooter');
  footer.innerHTML = `
    <p data-i18n-html="footer.copyright"></p>
    <p class="footer-meta" data-i18n="footer.meta"></p>`;
  applyToDOM(footer);
}

/* ============================================================
   轻提示：整章学完时的激励反馈
   ============================================================ */
function flash(message) {
  let el = document.getElementById('visToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'visToast';
    el.className = 'vis-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = message;
  void el.offsetWidth;          // 强制 reflow，保证首次显示时 transition 生效
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ============================================================
   阅读进度条 + 快捷键
   ============================================================ */
function bindReadingProgress() {
  const bar = $('#readProgress');
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function bindHotkeys() {
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const chapter = courses.chapters.find((c) => c.id === lessonId);
    const i = chapter.sections.findIndex((s) => s.id === currentSection);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      // 焦点在 tab 上时交给 tab 自己的键盘处理
      if (e.target.classList && e.target.classList.contains('tab-btn')) return;
      if (i < 0) return;                 // 小结视图没有 tab 可切
      e.preventDefault();
      const at = TABS.indexOf(currentTab);
      selectTab(currentSection, TABS[(at + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]);
    } else if (e.key === ']' ) {
      if (i < 0) return;                 // 小结已经是本章最后一屏
      if (i < chapter.sections.length - 1) { e.preventDefault(); activateSection(chapter.sections[i + 1].id, 'explain', { scroll: true }); }
    } else if (e.key === '[') {
      if (i < 0) {                       // 从小结退回最后一节
        e.preventDefault();
        activateSection(chapter.sections[chapter.sections.length - 1].id, 'explain', { scroll: true });
      } else if (i > 0) { e.preventDefault(); activateSection(chapter.sections[i - 1].id, 'explain', { scroll: true }); }
    } else if (e.key === '/') {
      e.preventDefault();
      window.__visOpenSearch && window.__visOpenSearch();
    }
  });
}

/* ============================================================
   语言切换后重渲染
   ============================================================ */
function rerenderAll() {
  renderTopbar();
  renderHeader();
  renderTOC();
  renderContent();
  renderFooter();
  // renderContent / renderTOC 重建了正文与目录，高亮标记必须重设——
  // 否则切语言后正文整块不可见（.chapter 默认 display:none）、目录也不标当前位置。
  syncActiveMarkers();
  const sec = lesson.sections.find((s) => s.id === currentSection);
  if (sec) {
    renderOutline(sec);
    selectTab(currentSection, currentTab, { pushUrl: false });
    // 术语下划线与 dataset.gloss 标记同样在重建中丢失，这里重做一次，
    // 否则切语言后当前小节的术语要切走再切回才恢复。
    const art = document.getElementById(currentSection);
    if (art) {
      applyGlossary(art);
      art.dataset.gloss = '1';
    }
  } else if (currentSection === summaryId()) {
    // 小结视图：重新绑定导图与术语（renderContent 已重建 DOM）
    const art = document.getElementById(summaryId());
    if (art) {
      bindMindmap(art, (sid) => activateSection(sid, 'explain', { scroll: true }));
      applyGlossary(art);
    }
  }
  updateTocMarks();
}

/* ============================================================
   大纲归一化
   原始数据里中英文大纲被存成两个相邻对象（{zh, en:''} + {zh:'', en}），
   英文模式下会回退成中文。这里把成对的条目合并成一条双语记录。
   ============================================================ */
function normalizeOutline(list) {
  const out = [];
  (list || []).forEach((o) => {
    const item = { zh: o.zh || '', en: o.en || '' };
    const prev = out[out.length - 1];
    if (prev) {
      if (!item.zh && item.en && !prev.en) { prev.en = item.en; return; }
      if (item.zh && !item.en && !prev.zh) { prev.zh = item.zh; return; }
    }
    out.push(item);
  });
  return out;
}

/* ============================================================
   启动
   ============================================================ */
async function boot() {
  const showError = (msg) => {
    const wrap = document.createElement('div');
    wrap.style.padding = '32px';
    wrap.appendChild(errorNote(msg));
    $('#chapterContent').replaceChildren(wrap);
  };
  try {
    await initI18n();
  } catch (e) {
    showError('文案字典加载失败：' + e.message + '（请通过 HTTP 服务器打开本页）');
    return;
  }
  try {
    [courses, lesson] = await Promise.all([loadCourses(), loadLesson(lessonId)]);
  } catch (e) {
    showError(t('common.error.load'));
    return;
  }
  lesson.sections.forEach((sec) => { sec.outline = normalizeOutline(sec.outline); });

  // 小结与术语表是增强项，加载失败不影响正文阅读
  await Promise.all([
    loadSummaries().then((s) => { summaries = s; }).catch(() => { summaries = null; }),
    initGlossary().catch(() => {}),
  ]);
  const chapterMeta = courses.chapters.find((c) => c.id === lessonId);
  document.title = pick(chapterMeta.card.title) + ' · ' + t('portal.title');

  renderTopbar();
  renderHeader();
  renderTOC();
  renderContent();
  renderFooter();
  bindReadingProgress();
  bindHotkeys();

  const fromHash = parseHash();
  const chapter = courses.chapters.find((c) => c.id === lessonId);
  const knownIds = lesson.sections.map((s) => s.id);
  if (summaries && summaries[lessonId] && summaries[lessonId].points) knownIds.push(summaryId());
  const initial = (fromHash.sec && knownIds.includes(fromHash.sec))
    ? fromHash.sec
    : chapter.sections[0].id;
  await activateSection(initial, fromHash.tab || 'explain', { scroll: false });

  window.addEventListener('hashchange', () => {
    const { sec, tab } = parseHash();
    if (sec && sec !== currentSection) activateSection(sec, tab || 'explain', { scroll: false });
    else if (tab && tab !== currentTab) selectTab(currentSection, tab, { pushUrl: false });
  });

  onProgressChange(() => { updateTocMarks(); renderHeader(); });
  onLocaleChange(() => { /* rerenderAll 已由 buildLangSwitcher 触发 */ });

  // 搜索（懒加载索引）；同章命中要在本页内跳转，不走整页刷新
  const searchApi = initSearch({
    courses,
    onSectionJump: (sid) => activateSection(sid, 'explain', { scroll: true }),
  });
  // 顶栏按钮与快捷键统一走 search 模块的 open()：
  // 它内部负责打开面板、聚焦输入框，并在首次打开时懒加载搜索索引。
  // （早先这里只给 overlay 加 class，导致索引永远不会被加载、搜索恒无结果）
  window.__visOpenSearch = () => searchApi.open();

  await renderDemosIn(document.getElementById(initial));
}

boot();
