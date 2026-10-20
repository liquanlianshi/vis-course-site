/* =============================================================
   glossary-page.js —— 术语表汇总页入口
   ============================================================= */

import { initI18n, applyToDOM, buildLangSwitcher, t, getLocale, dataKey, onLocaleChange, siteUrl } from './i18n.js';
import { initGlossary, renderGlossaryPage } from './glossary.js';

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
