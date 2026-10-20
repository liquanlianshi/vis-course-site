/* =============================================================
   store.js —— 数据加载与学习进度
   -------------------------------------------------------------
   数据分层（重构新增）：
     ui.json        UI 文案字典（i18n.js 使用）
     courses.json   轻量课程结构（章/小节标题、阅读时长）—— 首屏加载
     lesson-0X.json 单章正文（三 tab 的 HTML）—— 按需加载当前章
     lessons.json   全站搜索索引（含正文文本）—— 首次搜索时才加载
   ============================================================= */

import { siteUrl } from './i18n.js';

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

export function loadCourses() {
  if (!coursesPromise) coursesPromise = fetchJson(siteUrl('assets/data/courses.json'));
  return coursesPromise;
}

export function loadLesson(id) {
  if (!lessonPromises.has(id)) {
    lessonPromises.set(id, fetchJson(siteUrl('assets/data/' + id + '.json')));
  }
  return lessonPromises.get(id);
}

/** 搜索索引较大，懒加载；失败后允许重试 */
export function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = fetchJson(siteUrl('assets/data/lessons.json'))
      .catch((e) => { searchIndexPromise = null; throw e; });
  }
  return searchIndexPromise;
}

/** 各章「本章小结」（要点回顾），小文件，随首屏一起加载 */
let summariesPromise = null;
export function loadSummaries() {
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

export function isDone(sectionId) {
  return Object.prototype.hasOwnProperty.call(readStore(), sectionId);
}

export function markDone(sectionId, done) {
  const store = readStore();
  if (done === false) delete store[sectionId];
  else store[sectionId] = Date.now();
  writeStore(store);
  return done !== false;
}

export function toggleDone(sectionId) {
  return markDone(sectionId, !isDone(sectionId));
}

export function getDoneIds() {
  return Object.keys(readStore());
}

export function resetProgress() {
  writeStore({});
}

export function onProgressChange(fn) {
  progressListeners.add(fn);
  return () => progressListeners.delete(fn);
}

/** 章节进度：{ done, total, percent } */
export function chapterProgress(chapter) {
  const store = readStore();
  const total = chapter.sections.length;
  const done = chapter.sections.filter((s) => Object.prototype.hasOwnProperty.call(store, s.id)).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

/** 全站进度：{ done, total, percent, byChapter, next } */
export function totalProgress(courses) {
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
export function chapterReadMinutes(chapter) {
  return chapter.sections.reduce((sum, s) => sum + (s.readMin || 1), 0);
}
