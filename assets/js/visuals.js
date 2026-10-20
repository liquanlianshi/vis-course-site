/* =============================================================
   visuals.js —— 讲解区可视化图形（本次重构新增）
   -------------------------------------------------------------
   原站问题：5 章里只有 lesson-02 有 5 张 PNG、lesson-01 有 1 张 PNG，
   其余 3 章的讲解区是纯文字；图形只有点了「演示」tab 才由 JS 画出来。
   本模块提供两类图形：
     1) 每章「知识地图」——横贯本章各小节，标出当前位置与完成状态
     2) 关键小节插图——把抽象关系画成图（矩阵 / 数据流 / 色带 / 空间变换）
   全部用内联 SVG 生成：不依赖网络、不依赖 d3，讲解区永远可显示。
   ============================================================= */

import { isDone } from './store.js';
import * as F from './figures.js';
import { mountInteractive } from './interactive.js';

const ZH = 'zh';   // JSON 正文里中文的键（注意不是 locale 的 'zh-CN'）

/* ---------------------------------------------------------------
   通用小工具
   --------------------------------------------------------------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** 视觉宽度：中文/全角按 2 计，其余按 1 计 */
function units(str) {
  let n = 0;
  for (const ch of str) n += /[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1;
  return n;
}

/** 把文本按视觉宽度折成最多 maxLines 行；英文按词断行，避免 "Transfor/mation" */
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

function svgEl(viewBox, body, cls = '', w) {
  // 宽度给 100%，但用 max-width 锁住自然尺寸：容器窄时等比缩小，不会溢出
  const size = w ? ` width="100%" style="max-width:${w}px"` : '';
  return `<svg class="${cls}"${size} viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img">${body}</svg>`;
}

/* ===============================================================
   一、知识地图
   =============================================================== */
export function knowledgeMapSvg(chapter, activeId, lang) {
  const secs = chapter.sections;
  const NODE_W = 128, NODE_H = 76, GAP = 18, PAD = 14;
  // 小节多的时候（如第 3 章 8 节）折成两行，避免整张图被压到看不清
  const twoRows = secs.length > 6;
  const cols = twoRows ? Math.ceil(secs.length / 2) : secs.length;
  const rows = twoRows ? 2 : 1;
  const ROW_GAP = 30;
  const W = PAD * 2 + cols * NODE_W + (cols - 1) * GAP;
  const H = rows * NODE_H + (rows - 1) * ROW_GAP + 34;
  const headZh = '本章知识地图';
  const headEn = 'Chapter Map';
  const hintZh = '点击任一节点跳转该小节';
  const hintEn = 'Click a node to jump';
  const doneZh = '已学', doneEn = 'learned';

  let body = '';
  secs.forEach((s, i) => {
    const row = twoRows ? Math.floor(i / cols) : 0;
    const col = twoRows ? i % cols : i;
    // 第二行从右往左排，形成「S 形」阅读顺序
    const reversed = twoRows && row === 1;
    const c = reversed ? cols - 1 - col : col;
    const x = PAD + c * (NODE_W + GAP);
    const y = 14 + row * (NODE_H + ROW_GAP);
    const active = s.id === activeId;
    const done = isDone(s.id);
    const title = (s.title && (s.title[lang] || s.title[ZH])) || '';
    const { num, name } = splitTitle(title);
    const lines = wrap(name, 16, 2);

    body += `<g class="km-node" data-sid="${esc(s.id)}" style="cursor:pointer">`;
    body += `<rect class="km-card${active ? ' is-active' : ''}${done ? ' is-done' : ''}"
              x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="10"></rect>`;
    // 编号徽标
    if (num) {
      // 注意：SVG 的 presentation attribute 不认 CSS 变量（var() 只在 CSS 里生效），
      // 所以这里必须用具体色值
      body += `<rect x="${x + 10}" y="${y + 10}" width="${Math.max(28, units(num) * 5.4 + 12)}" height="18" rx="9"
                fill="${active ? '#b4785f' : done ? '#6f9e77' : '#a79e93'}"></rect>`
        + `<text class="km-node-num" x="${x + 10 + Math.max(28, units(num) * 5.4 + 12) / 2}" y="${y + 23}"
                text-anchor="middle">${esc(num)}</text>`;
    }
    // 完成标记
    if (done) {
      body += `<text x="${x + NODE_W - 12}" y="${y + 23}" text-anchor="end" font-size="12" fill="#6f9e77">✓</text>`;
    }
    // 标题
    lines.forEach((ln, li) => {
      body += `<text class="km-node-label" x="${x + 12}" y="${y + 46 + li * 15}">${esc(ln)}</text>`;
    });
    body += `</g>`;
    // 连接箭头：同一行内向右（第二行为向左），跨行时从行尾绕到下一行行首
    const isLastInRow = col === cols - 1;
    if (i < secs.length - 1) {
      if (!isLastInRow) {
        const ax = x + NODE_W + 5;
        const ay = y + NODE_H / 2;
        const dir = reversed ? -1 : 1;
        const from = reversed ? x - 5 : ax;
        const to = reversed ? x - GAP + 12 : ax + GAP - 12;
        body += `<path class="km-edge" d="M ${from} ${ay} L ${to} ${ay}"></path>
                 <path class="km-edge" d="M ${to - dir * 5} ${ay - 4} L ${to} ${ay} L ${to - dir * 5} ${ay + 4}"></path>`;
      } else if (twoRows) {
        // 行尾 → 下一行行首（两行都在同一列，竖直连接）
        const cx = x + NODE_W / 2;
        const y1 = y + NODE_H + 4;
        const y2 = y + NODE_H + ROW_GAP - 5;
        body += `<path class="km-edge" d="M ${cx} ${y1} L ${cx} ${y2 - 6}"></path>
                 <path class="km-edge" d="M ${cx - 4} ${y2 - 10} L ${cx} ${y2 - 5} L ${cx + 4} ${y2 - 10}"></path>`;
      }
    }
  });

  const head = `<div class="knowledge-map__head">
      <h3>${esc(lang === ZH ? headZh : headEn)} · ${esc(chapter.card.title[lang] || '')}</h3>
      <span>${esc(lang === ZH ? hintZh : hintEn)} · ✓ ${esc(lang === ZH ? doneZh : doneEn)}</span>
    </div>`;
  return `<div class="knowledge-map">${head}<div class="knowledge-map__body">${svgEl(`0 0 ${W} ${H}`, body, '', W)}</div></div>`;
}

export function bindKnowledgeMap(container, onJump) {
  // 与 bindMindmap 同一套幂等约定：已绑过的节点不重复绑。
  // 前置约定：不得用 cloneNode / 回写 innerHTML 复用已绑定的节点
  // （那会让 data-mm-bound 残留而监听器丢失）；本项目的图都是整块重建的。
  container.querySelectorAll('[data-sid]').forEach((g) => {
    if (g.dataset.mmBound === '1') return;
    g.dataset.mmBound = '1';
    g.addEventListener('click', () => onJump(g.getAttribute('data-sid')));
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onJump(g.getAttribute('data-sid')); }
    });
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'link');
  });
}

/* ===============================================================
   二、讲解区插图
   =============================================================== */

/* ---- 图 1：Stevens 测量尺度 × Mackinlay 视觉通道 适配矩阵 ---- */
function stevensMackinlay(lang) {
  const zh = lang === ZH;
  const cols = zh ? ['名义 Nominal', '序数 Ordinal', '区间 Interval', '比率 Ratio'] : ['Nominal', 'Ordinal', 'Interval', 'Ratio'];
  const rows = zh
    ? ['定量型通道', '顺序型通道', '定性型通道']
    : ['Quantitative', 'Ordered', 'Qualitative'];
  const cells = [
    // [行][列] => 0 不适合 / 1 可用 / 2 最佳
    [1, 1, 2, 2],
    [1, 2, 2, 1],
    [2, 2, 1, 1],
  ];
  const color = { 0: '#f7f2ea', 1: '#e6d6cc', 2: '#b4785f' };
  const mark = { 0: '—', 1: '✓', 2: '★★' };
  const markColor = { 0: '#a79e93', 1: '#9d6049', 2: '#ffffff' };
  const COL_W = 118, ROW_H = 46, LEFT = 128, TOP = 40;
  const W = LEFT + COL_W * 4 + 20;
  const H = TOP + ROW_H * 3 + 30;

  let b = '';
  cols.forEach((c, i) => {
    b += `<text class="matrix-head" x="${LEFT + i * COL_W + COL_W / 2}" y="${TOP - 14}" text-anchor="middle">${esc(c)}</text>`;
  });
  rows.forEach((r, ri) => {
    b += `<text class="matrix-head" x="${LEFT - 12}" y="${TOP + ri * ROW_H + ROW_H / 2 + 4}" text-anchor="end">${esc(r)}</text>`;
    cols.forEach((c, ci) => {
      const v = cells[ri][ci];
      const x = LEFT + ci * COL_W, y = TOP + ri * ROW_H;
      b += `<rect class="matrix-cell" x="${x}" y="${y}" width="${COL_W - 4}" height="${ROW_H - 4}" rx="5" fill="${color[v]}"></rect>`;
      b += `<text class="matrix-ok" x="${x + (COL_W - 4) / 2}" y="${y + ROW_H / 2 + 1}" text-anchor="middle"
             fill="${markColor[v]}">${mark[v]}</text>`;
    });
  });
  const capZh = '<strong>怎么读这张图：</strong>横轴是数据的测量尺度（越往右越"定量"），纵轴是视觉通道的感知档次。'
    + '交叉格的 ★★ 是教科书推荐的首选映射：<strong>比率/区间数据要用位置、长度、角度</strong>这类定量通道；'
    + '<strong>名义数据只能用色相、形状</strong>这类定性通道。右下角→左上角走"定量到定性"，'
    + '左上角→右下角则是常见的误用（拿色相编码数值，读者看不出大小关系）。';
  const capEn = '<strong>How to read:</strong> columns are Stevens measurement scales (more quantitative to the right); '
    + 'rows are perceptual tiers of visual channels. ★★ marks the textbook-preferred mapping: '
    + 'ratio/interval data should use quantitative channels (position, length, angle); nominal data may only use '
    + 'qualitative channels (hue, shape). Going from bottom-right to top-left means "quantitative → qualitative"; '
    + 'the reverse is the classic mistake (encoding numbers with hue).';
  return `<figure class="visual-figure">
      ${svgEl(`0 0 ${W} ${H}`, b, 'viz-matrix')}
      <div class="viz-legend">
        <span><i style="background:#b4785f"></i>★★ 首选通道</span>
        <span><i style="background:#e6d6cc"></i>✓ 可用</span>
        <span><i style="background:#f7f2ea"></i>— 不适合</span>
      </div>
      <figcaption>${zh ? capZh : capEn}</figcaption>
    </figure>`;
}

/* ---- 图 2：Card 数据流模型（原数据 → 数据表 → 视觉结构 → 视图） ---- */
function cardModel(lang) {
  const zh = lang === ZH;
  const steps = zh
    ? [
        { t: '原数据', s: 'CSV / 数据库', k: '' },
        { t: '数据表', s: '清洗·聚合·连接·派生', k: 'D → T（数据变换）' },
        { t: '视觉结构', s: '图元 + 通道映射', k: 'T → V（视觉编码）' },
        { t: '视图', s: 'DOM / SVG / Canvas', k: 'V → 渲染' },
      ]
    : [
        { t: 'Raw Data', s: 'CSV / database', k: '' },
        { t: 'Data Table', s: 'clean · aggregate · join · derive', k: 'D → T' },
        { t: 'Visual Structure', s: 'marks + channel mapping', k: 'T → V' },
        { t: 'View', s: 'DOM / SVG / Canvas', k: 'render' },
      ];
  const BOX_W = 152, BOX_H = 68, GAP = 54, PAD = 16;
  const W = PAD * 2 + steps.length * BOX_W + (steps.length - 1) * GAP;
  const H = BOX_H + 74;
  let b = '';
  steps.forEach((s, i) => {
    const x = PAD + i * (BOX_W + GAP), y = 30;
    b += `<rect class="flow-box${i === 1 ? ' is-accent' : i === 3 ? ' is-ok' : ''}" x="${x}" y="${y}" width="${BOX_W}" height="${BOX_H}" rx="9"></rect>`;
    b += `<text class="flow-title" x="${x + BOX_W / 2}" y="${y + 26}" text-anchor="middle">${esc(s.t)}</text>`;
    const lines = wrap(s.s, 22, 2);
    lines.forEach((ln, li) => {
      b += `<text class="flow-sub" x="${x + BOX_W / 2}" y="${y + 44 + li * 12}" text-anchor="middle">${esc(ln)}</text>`;
    });
    if (i < steps.length - 1) {
      const ax = x + BOX_W + 6, ay = y + BOX_H / 2;
      b += `<path class="flow-arrow" d="M ${ax} ${ay} L ${ax + GAP - 16} ${ay}"></path>
            <path class="flow-arrow" d="M ${ax + GAP - 20} ${ay - 5} L ${ax + GAP - 13} ${ay} L ${ax + GAP - 20} ${ay + 5}"></path>`;
      const label = steps[i + 1].k;
      if (label) b += `<text class="flow-label" x="${ax + (GAP - 12) / 2}" y="${ay - 10}" text-anchor="middle">${esc(label)}</text>`;
    }
  });
  const capZh = '<strong>Card 数据流模型：</strong>可视化不是"拿到数据直接画图"，而是三次变换串成的流水线。'
    + '每一步的输入输出都有明确类型，<strong>出问题时可以按步排查</strong>：数据表不对 → 查 2.2 的变换；'
    + '视觉结构不对 → 查 2.3 的映射；交互不灵 → 查 2.4 的渲染与事件。';
  const capEn = '<strong>The Card data-flow model:</strong> visualization is not "chart the raw data" but a pipeline of three '
    + 'transformations. Each step has a typed input and output, so <strong>failures can be localised</strong>: '
    + 'a wrong data table → check the 2.2 transforms; a wrong visual structure → check the 2.3 mapping; '
    + 'broken interaction → check the 2.4 rendering and events.';
  return `<figure class="visual-figure">
      ${svgEl(`0 0 ${W} ${H}`, b, 'viz-flow')}
      <figcaption>${zh ? capZh : capEn}</figcaption>
    </figure>`;
}

/* ---- 图 3：colormap 三类对比色带 ---- */
function colormapBands(lang) {
  const zh = lang === ZH;
  const BAND_W = 560, BAND_H = 26, LEFT = 116, TOP = 26, ROW_GAP = 62;
  const H = TOP + ROW_GAP * 3 - 24;
  const W = LEFT + BAND_W + 24;

  const bands = [
    {
      label: zh ? '顺序型 Sequential' : 'Sequential',
      note: zh ? '数据单调递增 → 亮度/明度单调变化（viridis）' : 'monotonic data → monotonic lightness (viridis)',
      stops: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
      gradient: true,
      ticks: zh ? ['低', '', '高'] : ['low', '', 'high'],
    },
    {
      label: zh ? '发散型 Diverging' : 'Diverging',
      note: zh ? '有中点（0 / 均值）→ 两端对称、中间白（RdBu）' : 'a meaningful midpoint → symmetric ends, light middle (RdBu)',
      stops: ['#67001f', '#d6604d', '#f7f7f7', '#4393c3', '#053061'],
      gradient: true,
      ticks: zh ? ['负', '0', '正'] : ['−', '0', '+'],
    },
    {
      label: zh ? '定性型 Categorical' : 'Categorical',
      note: zh ? '无序类别 → 色相互异、亮度和饱和度接近（Tableau10）' : 'unordered categories → distinct hues, similar lightness (Tableau10)',
      stops: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7'],
      gradient: false,
      ticks: [],
    },
  ];

  let b = '';
  bands.forEach((band, i) => {
    const y = TOP + i * ROW_GAP;
    b += `<text class="band-label" x="${LEFT - 12}" y="${y + BAND_H / 2 + 4}" text-anchor="end">${esc(band.label)}</text>`;
    if (band.gradient) {
      const id = 'grad' + i;
      const stops = band.stops.map((c, si) =>
        `<stop offset="${(si / (band.stops.length - 1)) * 100}%" stop-color="${c}"></stop>`).join('');
      b += `<defs><linearGradient id="${id}" x1="0" x2="1">${stops}</linearGradient></defs>`;
      b += `<rect x="${LEFT}" y="${y}" width="${BAND_W}" height="${BAND_H}" rx="4" fill="url(#${id})"></rect>`;
    } else {
      const seg = BAND_W / band.stops.length;
      band.stops.forEach((c, si) => {
        b += `<rect x="${LEFT + si * seg}" y="${y}" width="${seg}" height="${BAND_H}" fill="${c}"></rect>`;
      });
    }
    b += `<rect x="${LEFT}" y="${y}" width="${BAND_W}" height="${BAND_H}" rx="4" fill="none" stroke="#eae2d6"></rect>`;
    b += `<text class="band-note" x="${LEFT}" y="${y + BAND_H + 15}">${esc(band.note)}</text>`;
    band.ticks.forEach((tk, ti) => {
      if (!tk) return;
      const tx = LEFT + (BAND_W * ti) / (band.ticks.length - 1);
      b += `<text class="band-tick" x="${tx}" y="${y - 6}" text-anchor="middle">${esc(tk)}</text>`;
    });
  });
  const capZh = '<strong>选型口诀：</strong>先问数据有没有顺序 —— 有顺序（且单调）用顺序型；'
    + '有"中点"（正负、与均值之差）才用发散型；<strong>没有顺序就一定用定性型</strong>。'
    + '顺序型和发散型要保证亮度单调（这样黑白打印、色觉缺陷读者也读得懂）；'
    + '定性型要保证色相互异但亮度接近（避免某个类别"看起来更重"）。';
  const capEn = '<strong>Rule of thumb:</strong> first ask whether the data is ordered — monotonic ordered data uses sequential; '
    + 'only data with a meaningful midpoint (sign, deviation from mean) uses diverging; '
    + '<strong>unordered categories must use categorical</strong>. Sequential and diverging maps must keep lightness monotonic '
    + '(so they survive grayscale printing and colour-vision deficiency); categorical maps need distinct hues with similar '
    + 'lightness so no category looks "heavier" than another.';
  return `<figure class="visual-figure">
      ${svgEl(`0 0 ${W} ${H}`, b, 'viz-bands')}
      <figcaption>${zh ? capZh : capEn}</figcaption>
    </figure>`;
}

/* ---- 图 4：三层坐标空间变换 ---- */
function threeSpaces(lang) {
  const zh = lang === ZH;
  const PAD = 20, BOX_W = 164, BOX_H = 104, GAP = 56;
  const W = PAD * 2 + BOX_W * 3 + GAP * 2;
  const H = BOX_H + 86;
  const titles = zh
    ? ['数据空间', '坐标系空间', '屏幕空间']
    : ['Data space', 'Coordinate space', 'Screen space'];
  const subs = zh
    ? ['原始单位', 'Cartesian / Polar', '像素（≥0）']
    : ['raw units', 'Cartesian / Polar', 'pixels (≥0)'];
  const labels = zh ? ['d3.scale', '坐标系变换'] : ['d3.scale', 'coord transform'];
  const labels2 = zh ? ['坐标轴映射', '平移/翻转 y'] : ['axis mapping', 'translate / flip y'];

  // 三层各自的小示意图
  const drawData = (x, y) => {
    let s = '';
    const pts = [[26, 74], [52, 52], [78, 66], [104, 34], [130, 46]];
    pts.forEach(([px, py]) => { s += `<circle cx="${x + px}" cy="${y + py}" r="4" fill="#b4785f"></circle>`; });
    s += `<line x1="${x + 14}" y1="${y + 86}" x2="${x + 148}" y2="${y + 86}" stroke="#a79e93"></line>
          <line x1="${x + 14}" y1="${y + 86}" x2="${x + 14}" y2="${y + 18}" stroke="#a79e93"></line>
          <text class="matrix-axis" x="${x + 30}" y="${y + 98}">1995</text>
          <text class="matrix-axis" x="${x + 118}" y="${y + 98}">2020</text>`;
    return s;
  };
  const drawCoord = (x, y) => {
    let s = '';
    const pts = [[26, 74], [52, 52], [78, 66], [104, 34], [130, 46]];
    pts.forEach(([px, py]) => { s += `<circle cx="${x + px}" cy="${y + py}" r="4" fill="#6e9cb5"></circle>`; });
    s += `<line x1="${x + 14}" y1="${y + 30}" x2="${x + 148}" y2="${y + 30}" stroke="#a79e93"></line>
          <line x1="${x + 14}" y1="${y + 30}" x2="${x + 14}" y2="${y + 96}" stroke="#a79e93"></line>`;
    return s;
  };
  const drawScreen = (x, y) => {
    let s = '';
    const pts = [[30, 44], [58, 70], [86, 54], [114, 86], [140, 74]];
    pts.forEach(([px, py]) => { s += `<circle cx="${x + px}" cy="${y + py}" r="4" fill="#5f8f6b"></circle>`; });
    s += `<rect x="${x + 14}" y="${y + 24}" width="136" height="76" fill="none" stroke="#a79e93" stroke-dasharray="3 3"></rect>
          <text class="matrix-axis" x="${x + 16}" y="${y + 18}">0</text>
          <text class="matrix-axis" x="${x + 128}" y="${y + 18}">width</text>`;
    return s;
  };
  const drawers = [drawData, drawCoord, drawScreen];

  let b = '';
  for (let i = 0; i < 3; i++) {
    const x = PAD + i * (BOX_W + GAP);
    const y = 16;
    b += `<rect class="flow-box" x="${x}" y="${y}" width="${BOX_W}" height="${BOX_H}" rx="10"></rect>`;
    b += `<g>${drawers[i](x, y - 6)}</g>`;
    b += `<text class="flow-title" x="${x + BOX_W / 2}" y="${y + BOX_H + 20}" text-anchor="middle">${esc(titles[i])}</text>`;
    b += `<text class="flow-sub" x="${x + BOX_W / 2}" y="${y + BOX_H + 36}" text-anchor="middle">${esc(subs[i])}</text>`;
    if (i < 2) {
      const ax = x + BOX_W + 6, ay = y + BOX_H / 2;
      b += `<path class="flow-arrow" d="M ${ax} ${ay} L ${ax + GAP - 16} ${ay}"></path>
            <path class="flow-arrow" d="M ${ax + GAP - 20} ${ay - 5} L ${ax + GAP - 13} ${ay} L ${ax + GAP - 20} ${ay + 5}"></path>
            <text class="flow-label" x="${ax + (GAP - 12) / 2}" y="${ay - 12}" text-anchor="middle">${esc(labels[i])}</text>
            <text class="flow-label" x="${ax + (GAP - 12) / 2}" y="${ay + 22}" text-anchor="middle">${esc(labels2[i])}</text>`;
    }
  }
  const capZh = '<strong>三层职责分开，调试就不迷路：</strong>数据空间只关心原始数值与单位；'
    + '坐标系空间由 <code>d3.scale</code> 负责（domain → range），决定"数值落在轴的哪里"；'
    + '屏幕空间是最终的像素位置，注意 SVG 的 y 轴向下，所以 <code>y = height - scale(v)</code> 才是正确写法。'
    + 'Crime 数据那节出现的怪图，往往就错在第二层与第三层混在一起写。';
  const capEn = '<strong>Keeping the three layers separate keeps debugging simple:</strong> data space holds raw values and units; '
    + 'coordinate space is produced by <code>d3.scale</code> (domain → range) and decides where a value sits on the axis; '
    + 'screen space is the final pixel position — remember SVG\'s y axis points down, so <code>y = height - scale(v)</code> is correct. '
    + 'Most broken charts in the Crime exercise come from mixing layer 2 and layer 3 in one expression.';
  return `<figure class="visual-figure">
      ${svgEl(`0 0 ${W} ${H}`, b, 'viz-flow')}
      <figcaption>${zh ? capZh : capEn}</figcaption>
    </figure>`;
}

/* ---- 图 5：时间的 5 个属性 ---- */
function timeAttributes(lang) {
  const zh = lang === ZH;
  const items = zh
    ? [
        { t: '有序', d: '时间只会向前，可比较先后', g: 'line' },
        { t: '连续', d: '可以无限细分（毫秒→世纪）', g: 'scale' },
        { t: '周期', d: '日月年循环重复', g: 'cycle' },
        { t: '独立于空间', d: '不占物理空间，需另找通道', g: 'axis' },
        { t: '结构性', d: '年月日分层，可缩放粒度', g: 'tree' },
      ]
    : [
        { t: 'Ordered', d: 'time only moves forward; order is comparable', g: 'line' },
        { t: 'Continuous', d: 'infinitely divisible (ms → centuries)', g: 'scale' },
        { t: 'Periodic', d: 'days, months, years repeat', g: 'cycle' },
        { t: 'Space-independent', d: 'needs its own channel', g: 'axis' },
        { t: 'Structured', d: 'hierarchical, zoomable granularity', g: 'tree' },
      ];
  const CARD_W = 150, CARD_H = 96, GAP = 18, PAD = 14;
  const W = PAD * 2 + items.length * CARD_W + (items.length - 1) * GAP;
  const H = CARD_H + 26;

  const glyph = (kind, x, y) => {
    switch (kind) {
      case 'line':
        return `<path d="M ${x} ${y + 34} L ${x + 44} ${y + 34}" stroke="#b4785f" stroke-width="2"></path>
                <path d="M ${x + 44} ${y + 34} l -6 -5 l 0 10 z" fill="#b4785f"></path>`;
      case 'scale':
        return `<line x1="${x}" y1="${y + 34}" x2="${x + 46}" y2="${y + 34}" stroke="#a79e93"></line>
                ${[0, 12, 24, 36, 46].map((d) => `<line x1="${x + d}" y1="${y + 30}" x2="${x + d}" y2="${y + 38}" stroke="#8c8378"></line>`).join('')}`;
      case 'cycle':
        return `<circle cx="${x + 23}" cy="${y + 34}" r="16" fill="none" stroke="#6e9cb5" stroke-width="2"></circle>
                <path d="M ${x + 36} ${y + 24} l 4 8 l -9 0 z" fill="#6e9cb5"></path>`;
      case 'axis':
        return `<line x1="${x}" y1="${y + 30}" x2="${x + 46}" y2="${y + 30}" stroke="#8c8378" stroke-width="2"></line>
                <line x1="${x}" y1="${y + 38}" x2="${x + 46}" y2="${y + 38}" stroke="#ddd3c4" stroke-width="2"></line>
                <circle cx="${x + 24}" cy="${y + 34}" r="4" fill="#5f8f6b"></circle>`;
      case 'tree':
      default:
        return `<line x1="${x + 23}" y1="${y + 20}" x2="${x + 23}" y2="${y + 42}" stroke="#a79e93"></line>
                <line x1="${x + 23}" y1="${y + 30}" x2="${x + 6}" y2="${y + 30}" stroke="#a79e93"></line>
                <line x1="${x + 23}" y1="${y + 30}" x2="${x + 40}" y2="${y + 30}" stroke="#a79e93"></line>
                <circle cx="${x + 23}" cy="${y + 18}" r="4" fill="#b4785f"></circle>
                <circle cx="${x + 6}" cy="${y + 42}" r="3.5" fill="#a9a3ce"></circle>
                <circle cx="${x + 40}" cy="${y + 42}" r="3.5" fill="#a9a3ce"></circle>`;
    }
  };

  let b = '';
  items.forEach((it, i) => {
    const x = PAD + i * (CARD_W + GAP), y = 10;
    b += `<rect class="km-card" x="${x}" y="${y}" width="${CARD_W}" height="${CARD_H}" rx="9"></rect>`;
    b += glyph(it.g, x + CARD_W / 2 - 23, y + 8);
    b += `<text class="flow-title" x="${x + CARD_W / 2}" y="${y + 66}" text-anchor="middle">${esc(it.t)}</text>`;
    wrap(it.d, 19, 2).forEach((ln, li) => {
      b += `<text class="flow-sub" x="${x + CARD_W / 2}" y="${y + 80 + li * 11}" text-anchor="middle">${esc(ln)}</text>`;
    });
  });
  const capZh = '<strong>五个属性对应五种画法：</strong>"有序"→ 折线；"连续"→ 连续轴上的密度/高度；'
    + '"周期"→ 日历热图、极坐标螺旋（把重复的周期折回一圈）；"独立于空间"→ 时间要占用 x 轴或动画这样的专门通道；'
    + '"结构性"→ 时间轴可以逐级下钻（年 → 季 → 月 → 日）。第 5 章后面的每个例子，都是先选属性、再选画法。';
  const capEn = '<strong>Five attributes, five idioms:</strong> ordered → line chart; continuous → density/height on a continuous axis; '
    + 'periodic → calendar heatmap or polar spiral (folding the cycle back onto a circle); space-independent → time needs its own '
    + 'channel such as the x axis or animation; structured → the axis can be drilled down level by level (year → quarter → month → day). '
    + 'Every example in Chapter 5 picks the attribute first, then the idiom.';
  return `<figure class="visual-figure">
      ${svgEl(`0 0 ${W} ${H}`, b, 'viz-time')}
      <figcaption>${zh ? capZh : capEn}</figcaption>
    </figure>`;
}

const FIGURES = {
  // ---- 第一批（本文件内定义）----
  'ch-1-3': stevensMackinlay,
  'ch-2-2': cardModel,
  'ch-3-2': colormapBands,
  'ch-4-2': threeSpaces,
  'ch-5-1': timeAttributes,
  // ---- 第二批（figures.js，共 16 张，覆盖更多知识点）----
  'ch-1-2': F.dikwPyramid,
  'ch-1-4': F.d3Transforms,
  'ch-1-5': F.dataJoin,
  'ch-2-1': F.shneiderman,
  'ch-2-3': F.channelRanking,
  'ch-2-4': F.domEvents,
  'ch-3-1': F.colorSpaces,
  'ch-3-3': F.uniformity,
  'ch-3-4': F.colorHarmony,
  'ch-4-1': F.transformTypes,
  'ch-4-3': F.curveTypes,
  'ch-4-4': F.clevelandSlope,
  'ch-4-5': F.marchingSquares,
  'ch-5-2': F.seriesForms,
  'ch-5-3': F.calendarMapping,
  'ch-5-4': F.polarTransform,
};

/** 把插图插到该小节「讲解」面板的最前面（若无则插到末尾） */
export function mountVisuals(article, sectionId, lang) {
  // 交互组件优先挂载（它包含自己的说明，位置更靠前）
  mountInteractive(article, sectionId, lang);
  const build = FIGURES[sectionId];
  if (!build) return;
  const panel = article.querySelector('.tab-panel[data-panel="explain"]');
  if (!panel || panel.querySelector('.visual-figure')) return;   // 避免重复插入
  const host = document.createElement('div');
  host.innerHTML = build(lang);
  const fig = host.firstElementChild;
  // 插到第一个 h3 之前更贴近正文（若无 h3 则放最前面）
  const firstHeading = panel.querySelector('h3');
  if (firstHeading) panel.insertBefore(fig, firstHeading);
  else panel.prepend(fig);
}
