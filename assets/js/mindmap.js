/* =============================================================
   mindmap.js —— 每章思维导图（本次新增）
   -------------------------------------------------------------
   用「中心 = 本章，左右分支 = 各小节，叶子 = 该节讲解区的小标题」
   的结构，把整章内容画成一张放射状图，配在「本章小结」里。
   数据全部来自 courses.json（章节结构）与 summaries.json（要点），
   不需要额外维护一份图。

   纯内联 SVG：不依赖网络与 d3。
   ============================================================= */

const ZH = 'zh';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function units(str) {
  let n = 0;
  for (const ch of str) n += /[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1;
  return n;
}

function wrap(str, maxUnits, maxLines = 2) {
  const s = String(str || '');
  const wordBreak = /\s/.test(s);
  const tokens = wordBreak ? s.split(/(\s+)/).filter(Boolean) : Array.from(s);
  const lines = [];
  let cur = '';
  for (const tok of tokens) {
    const next = cur + tok;
    if (cur.trim() && units(next) > maxUnits) {
      lines.push(cur.trim());
      cur = tok.trimStart();
      if (lines.length === maxLines) break;
    } else {
      cur = next;
    }
  }
  if (lines.length < maxLines && cur.trim()) lines.push(cur.trim());
  if (!lines.length) lines.push(cur.trim() || s);
  const consumed = lines.join('').replace(/\s/g, '').length;
  if (lines.length === maxLines && consumed < s.replace(/\s/g, '').length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s+$/, '').replace(/.$/, '') + '…';
  }
  return lines;
}
function splitTitle(title) {
  const m = /^([\d.]+)\s+(.*)$/.exec(title || '');
  return m ? { num: m[1], name: m[2] } : { num: '', name: title || '' };
}

/** 一节的分支：标题 + 最多 3 条叶子 */
function branchHeight() { return 26 + 3 * 15; }

/**
 * 生成思维导图 SVG。
 * @param chapter  courses.json 里的一章（含 sections[].title / outline）
 * @param summary  summaries.json 里该章的小结（含 points / terms），可为空
 * @param lang     'zh' | 'en'
 */
export function mindmapSvg(chapter, summary, lang) {
  const zh = lang === ZH;
  const secs = chapter.sections || [];
  const half = Math.ceil(secs.length / 2);
  const right = secs.slice(0, half);
  const left = secs.slice(half);
  const rows = Math.max(right.length, left.length, 1);
  const ROW_H = branchHeight() + 14;
  const H = Math.max(240, rows * ROW_H + 40);
  const CY = H / 2;
  const BRANCH_W = 168;
  const LEAF_W = 150;
  const CENTER_W = 150;
  const GAP = 26;
  const W = 40 + LEAF_W + GAP + BRANCH_W + 34 + CENTER_W + 34 + BRANCH_W + GAP + LEAF_W + 40;
  const CX = W / 2;

  let b = '';

  // ---- 中心节点 ----
  const title = chapter.card ? chapter.card.title[lang] || chapter.card.title.zh : chapter.id;
  const tLines = wrap(title, 15, 2);
  const centerH = 30 + tLines.length * 18;
  b += `<rect x="${CX - CENTER_W / 2}" y="${CY - centerH / 2}" width="${CENTER_W}" height="${centerH}" rx="14"
          fill="#b4785f"></rect>`;
  tLines.forEach((ln, i) => {
    b += `<text x="${CX}" y="${CY - centerH / 2 + 24 + i * 18}" text-anchor="middle" font-size="13"
            font-weight="700" fill="#ffffff">${esc(ln)}</text>`;
  });
  b += `<text x="${CX}" y="${CY + centerH / 2 - 8}" text-anchor="middle" font-size="10" fill="#e6d6cc">${
    esc(zh ? `${secs.length} 个小节` : `${secs.length} sections`)}</text>`;

  // ---- 左右分支 ----
  const drawSide = (list, dir) => {
    const total = list.length;
    list.forEach((s, i) => {
      const y = CY - ((total - 1) * ROW_H) / 2 + i * ROW_H;
      const bx = dir > 0 ? CX + CENTER_W / 2 + 34 : CX - CENTER_W / 2 - 34 - BRANCH_W;
      const bh = branchHeight();
      const by = y - bh / 2;

      // 连线（中心 → 分支）
      const sx = dir > 0 ? CX + CENTER_W / 2 : CX - CENTER_W / 2;
      const ex = dir > 0 ? bx : bx + BRANCH_W;
      b += `<path d="M ${sx} ${CY} C ${sx + dir * 18} ${CY} ${ex - dir * 18} ${y} ${ex} ${y}"
              fill="none" stroke="#e6d6cc" stroke-width="2"></path>`;

      // 分支卡片
      const t = (s.title && (s.title[lang] || s.title.zh)) || s.id;
      const { num, name } = splitTitle(t);
      b += `<g class="mm-branch" data-sid="${esc(s.id)}" style="cursor:pointer">`;
      b += `<rect x="${bx}" y="${by}" width="${BRANCH_W}" height="${bh}" rx="9" fill="#ffffff"
              stroke="#e6d6cc" stroke-width="1.4"></rect>`;
      if (num) {
        const bw = Math.max(26, units(num) * 5.2 + 10);
        b += `<rect x="${bx + 9}" y="${by + 8}" width="${bw}" height="16" rx="8" fill="#f7eae3"></rect>`;
        b += `<text x="${bx + 9 + bw / 2}" y="${by + 20}" text-anchor="middle" font-size="9.5"
                font-weight="700" fill="#b4785f">${esc(num)}</text>`;
        b += `<text x="${bx + 9 + bw + 8}" y="${by + 20}" font-size="11.5" font-weight="600"
                fill="#33302c">${esc(wrap(name, 18, 1)[0] || '')}</text>`;
      } else {
        b += `<text x="${bx + 10}" y="${by + 20}" font-size="11.5" font-weight="600"
                fill="#33302c">${esc(wrap(name, 18, 1)[0] || '')}</text>`;
      }
      // 叶子：该节讲解区的小标题
      const outs = (s.outline || []).slice(0, 3);
      outs.forEach((o, k) => {
        const ot = o[lang] || o.zh || '';
        const ly = by + 34 + k * 15;
        b += `<circle cx="${bx + 14}" cy="${ly - 3}" r="2.6" fill="#d9a08f"></circle>`;
        b += `<text x="${bx + 22}" y="${ly}" font-size="10" fill="#6b645b">${esc(wrap(ot, 26, 1)[0] || '')}</text>`;
      });
      if (outs.length < 3) {
        const ly = by + 34 + outs.length * 15;
        b += `<text x="${bx + 22}" y="${ly}" font-size="9.5" fill="#ddd3c4">…</text>`;
      }
      b += `</g>`;
    });
  };
  drawSide(right, 1);
  drawSide(left, -1);

  // ---- 底部：小结要点条数提示 ----
  const pts = summary && summary.points ? summary.points.length : 0;
  if (pts) {
    b += `<text x="${CX}" y="${H - 10}" text-anchor="middle" font-size="10" fill="#a79e93">${
      esc(zh ? `下方小结列出了本章 ${pts} 条要点` : `the summary below lists ${pts} key points`)}</text>`;
  }

  return `<div class="mindmap"><svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img"
    aria-label="${esc(zh ? '本章思维导图' : 'Chapter mind map')}">${b}</svg></div>`;
}

/** 让思维导图上的分支可点击跳转（幂等：重复调用不会重复绑定） */
export function bindMindmap(root, onJump) {
  root.querySelectorAll('[data-sid]').forEach((g) => {
    if (g.dataset.mmBound === '1') return;
    g.dataset.mmBound = '1';
    g.addEventListener('click', () => onJump(g.getAttribute('data-sid')));
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'link');
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onJump(g.getAttribute('data-sid'));
      }
    });
  });
}
