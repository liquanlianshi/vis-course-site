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

const ROOT = new URL('../../', import.meta.url);
export const siteUrl = (p) => new URL(p, ROOT).href;

export const SUPPORTED = ['zh-CN', 'en-US'];
const STORAGE_KEY = 'vis.locale';
const DEFAULT_LOCALE = 'zh-CN';

let dict = null;
let locale = DEFAULT_LOCALE;
const listeners = new Set();

/** 接受 en / en-US / zh / zh-CN 等写法，归一化到规范 locale */
export function normalizeLocale(v) {
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

export async function initI18n() {
  if (dict) return locale;
  const res = await fetch(siteUrl('assets/data/ui.json'));
  if (!res.ok) throw new Error('ui.json 加载失败: ' + res.status);
  dict = await res.json();
  locale = resolveInitialLocale();
  document.documentElement.lang = locale;
  return locale;
}

export function getLocale() { return locale; }
export function isZh() { return locale === 'zh-CN'; }

/**
 * 数据文件的键名与本模块的 locale 标识不同：
 *   locale  : 'zh-CN' | 'en-US'（HTML lang、localStorage 用）
 *   数据键  : 'zh'    | 'en'   （JSON 里存双语正文用，更短）
 * 所有读取 JSON 正文的地方都要经过这个换算。
 */
export function dataKey(loc) {
  return ((loc || locale) === 'zh-CN') ? 'zh' : 'en';
}

/** 取译文字符串；支持 {n} 形式的占位符 */
export function t(key, vars) {
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

export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setLocale(next) {
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
export function applyToDOM(root) {
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
export function buildLangSwitcher(onChanged) {
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
