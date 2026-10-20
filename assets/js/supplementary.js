/* =============================================================
   supplementary.js —— 补充 demo 索引页的脚本
   只做三件事：应用文案字典、挂语言切换、填充页脚。
   ============================================================= */

import { initI18n, buildLangSwitcher, applyToDOM } from './i18n.js';

async function boot() {
  try {
    await initI18n();
  } catch (e) {
    document.body.insertAdjacentHTML('afterbegin',
      '<p style="padding:16px;color:#b91c1c">文案字典加载失败，请通过本地 HTTP 服务器打开本页。</p>');
    return;
  }
  applyToDOM(document);
  document.querySelector('#langSwitchHost').appendChild(buildLangSwitcher(() => applyToDOM(document)));
  document.title = document.querySelector('h1').textContent + ' · 《可视化导论》';
}

boot();
