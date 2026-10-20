/* =============================================================
   figures.js —— 讲解区新增概念插图（第二批）
   -------------------------------------------------------------
   第一批 5 张在 visuals.js 内（Stevens×Mackinlay 矩阵、Card 数据流、
   colormap 三类色带、三层坐标空间、时间五属性）。本模块再补 15 张，
   覆盖更多知识点，并引入经典文献中已被广泛印证的通用结论：
     · Mackinlay 1986, "Automating the Design of Graphical Presentations"
     · Cleveland & McGill 1984, "Graphical Perception"
     · Shneiderman 1996, "The Eyes Have It"
     · Munzner, "Visualization Analysis and Design"
     · Ware, "Information Visualization: Perception for Design"
   引用处均在图注里写明来源，便于与老师课程口径核对。

   全部为内联 SVG：不依赖网络、不依赖 d3，讲解区永远可显示。
   ============================================================= */

const ZH = 'zh';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function units(str) {
  let n = 0;
  for (const ch of str) n += /[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1;
  return n;
}

function wrap(str, maxUnits, maxLines = 2) {
  const lines = [];
  let cur = '';
  for (const ch of str) {
    if (units(cur + ch) > maxUnits) {
      lines.push(cur);
      cur = ch;
      if (lines.length === maxLines) break;
    } else {
      cur += ch;
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  return lines;
}

const svg = (w, h, body, cls = '') =>
  `<svg class="${cls}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${body}</svg>`;

function figure(inner, caption, w, h) {
  return `<figure class="visual-figure">${svg(w, h, inner)}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
}

/** 多行居中文本 */
function textLines(lines, x, y, cls, lh = 13) {
  return lines.map((ln, i) => `<text class="${cls}" x="${x}" y="${y + i * lh}" text-anchor="middle">${esc(ln)}</text>`).join('');
}

/* ===============================================================
   第 1 章
   =============================================================== */

/** DIKW 金字塔：数据 → 信息 → 知识 → 智慧 */
export function dikwPyramid(lang) {
  const zh = lang === ZH;
  const layers = zh
    ? [
        { t: '数据 Data', q: '发生了什么？', ex: '2025-09-01, 18, 男, 96.5', w: 300, c: '#93c5fd' },
        { t: '信息 Information', q: '有多少 / 什么关系？', ex: '平均年龄 18.2 岁，男生占 62%', w: 246, c: '#60a5fa' },
        { t: '知识 Knowledge', q: '为什么 / 怎么办？', ex: '年龄与专业选择存在相关性', w: 192, c: '#3b82f6' },
        { t: '智慧 Wisdom', q: '应该怎么做？', ex: '据此调整招生宣传策略', w: 138, c: '#1d4ed8' },
      ]
    : [
        { t: 'Data', q: 'What happened?', ex: '2025-09-01, 18, M, 96.5', w: 300, c: '#93c5fd' },
        { t: 'Information', q: 'How much / relations?', ex: 'Mean age 18.2, 62% male', w: 246, c: '#60a5fa' },
        { t: 'Knowledge', q: 'Why / how?', ex: 'Age correlates with major choice', w: 192, c: '#3b82f6' },
        { t: 'Wisdom', q: 'What should we do?', ex: 'Adjust recruitment strategy', w: 138, c: '#1d4ed8' },
      ];
  const H = 62, GAP = 4, TOP = 16;
  const totalH = layers.length * (H + GAP) + TOP;
  const W = 520;
  const cx = W / 2;
  let b = '';
  layers.forEach((l, i) => {
    const y = TOP + i * (H + GAP);
    const w = l.w;
    b += `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${H}" rx="6" fill="${l.c}" opacity="0.92"></rect>`;
    b += `<text x="${cx}" y="${y + 24}" text-anchor="middle" font-size="13.5" font-weight="700" fill="#0f172a">${esc(l.t)}</text>`;
    b += `<text x="${cx}" y="${y + 42}" text-anchor="middle" font-size="11" fill="#1e293b">${esc(l.q)}</text>`;
    b += `<text x="${cx}" y="${y + 56}" text-anchor="middle" font-size="10" fill="#334155" font-style="italic">${esc(l.ex)}</text>`;
  });
  // 右侧刻度标注
  b += `<text x="${W - 6}" y="${TOP + 12}" text-anchor="end" font-size="10" fill="#64748b">${zh ? '价值 ↑' : 'value ↑'}</text>`;
  b += `<text x="${W - 6}" y="${totalH - 4}" text-anchor="end" font-size="10" fill="#64748b">${zh ? '数据量 ↓' : 'volume ↓'}</text>`;
  const cap = zh
    ? '<strong>这张图解决一个常见误解：</strong>「数据 = 信息 = 知识」是三个不同的层次。'
      + '越往上越值钱，但样本越少、越依赖人的判断。第 1 章里 1.1 节生成的 CSV 属于最底层的「数据」；'
      + '1.4 节用 <code>d3.rollup</code> 聚合出的「各班人数」就升到了「信息」；'
      + '把信息放进专业语境解释因果才叫「知识」。<strong>可视化的主战场在第一层到第二层之间</strong>——'
      + '把数据变成人能看懂的信息。<span class="fig-src">概念来源：DIKW 层级模型（Ackoff 1989 的通俗化表述）。</span>'
    : '<strong>Fixes a common misconception:</strong> data, information and knowledge are three different tiers. '
      + 'Higher tiers are worth more but have less volume and depend more on human judgement. '
      + 'In Chapter 1, the CSV produced in 1.1 is raw <em>data</em>; the per-class counts aggregated with '
      + '<code>d3.rollup</code> in 1.4 are <em>information</em>; only when information is interpreted in a domain '
      + 'context does it become <em>knowledge</em>. <strong>Most visualization work happens between tier 1 and 2</strong> — '
      + 'turning data into information people can read. <span class="fig-src">Source: DIKW hierarchy (popularised by Ackoff 1989).</span>';
  return figure(b, cap, W, totalH);
}

/** D3 八个数据变换函数对照 */
export function d3Transforms(lang) {
  const zh = lang === ZH;
  const items = zh
    ? [
        { f: 'd3.filter', d: '按条件筛选行', e: 'age > 18' },
        { f: 'd3.map', d: '每行换成新对象', e: '只保留 name / major' },
        { f: 'd3.sort', d: '按字段排序', e: '按年龄降序' },
        { f: 'd3.rollup', d: '分组后聚合', e: '按班级数人数' },
        { f: 'd3.group', d: '分组但不聚合', e: '按专业分成数组' },
        { f: 'd3.count', d: '计数（可带条件）', e: '每个专业几人' },
        { f: 'd3.sum / mean', d: '求和 / 求均值', e: '平均身高' },
        { f: 'd3.extent', d: '最小最大（定定义域）', e: '[17, 22] 岁' },
      ]
    : [
        { f: 'd3.filter', d: 'keep rows by test', e: 'age > 18' },
        { f: 'd3.map', d: 'transform each row', e: 'keep name / major' },
        { f: 'd3.sort', d: 'order rows', e: 'by age desc' },
        { f: 'd3.rollup', d: 'group then aggregate', e: 'count per class' },
        { f: 'd3.group', d: 'group without aggregating', e: 'arrays per major' },
        { f: 'd3.count', d: 'count (optionally filtered)', e: 'students per major' },
        { f: 'd3.sum / mean', d: 'sum / average', e: 'mean height' },
        { f: 'd3.extent', d: 'min & max (domain)', e: '[17, 22] years' },
      ];
  const CW = 168, CH = 66, GAP = 12, PAD = 14;
  const COLS = 4;
  const W = PAD * 2 + COLS * CW + (COLS - 1) * GAP;
  const ROWS = Math.ceil(items.length / COLS);
  const H = PAD * 2 + ROWS * CH + (ROWS - 1) * GAP;
  let b = '';
  items.forEach((it, i) => {
    const r = Math.floor(i / COLS), c = i % COLS;
    const x = PAD + c * (CW + GAP), y = PAD + r * (CH + GAP);
    b += `<rect class="flow-box" x="${x}" y="${y}" width="${CW}" height="${CH}" rx="8"></rect>`;
    b += `<rect x="${x}" y="${y}" width="4" height="${CH}" rx="2" fill="#6366f1"></rect>`;
    b += `<text class="flow-title" x="${x + 14}" y="${y + 24}" font-size="12">${esc(it.f)}</text>`;
    b += `<text class="flow-sub" x="${x + 14}" y="${y + 41}">${esc(it.d)}</text>`;
    b += `<text class="flow-label" x="${x + 14}" y="${y + 57}">${esc(it.e)}</text>`;
  });
  const cap = zh
    ? '<strong>这八个函数是「数据 → 数据表」这一步的全部工具箱。</strong>'
      + '记住一条判断标准：<strong>只改行/列结构的是 filter / map / sort；产生新数值的是 rollup / group / count / sum；'
      + '为坐标轴定范围的是 extent</strong>。第 1.4 节的演示里，它们被串成一条链：'
      + '<code>csv → filter → map → rollup</code>。'
    : '<strong>These eight functions are the whole toolbox for the “data → data table” step.</strong> '
      + 'A useful rule: <strong>filter / map / sort only reshape rows and columns; rollup / group / count / sum produce new '
      + 'numbers; extent defines an axis domain</strong>. In the 1.4 demo they are chained: '
      + '<code>csv → filter → map → rollup</code>.';
  return figure(b, cap, W, H);
}

/** Data-Join 三态 */
export function dataJoin(lang) {
  const zh = lang === ZH;
  const W = 560, H = 200;
  const nodes = zh
    ? [
        { t: 'enter()', d: '新数据，没有对应元素', n: '需要 append 新 DOM', c: '#22c55e' },
        { t: 'update()', d: '数据与元素都存在', n: '只改属性 / 文本', c: '#3b82f6' },
        { t: 'exit()', d: '元素多余，没有数据', n: '需要 remove 掉', c: '#ef4444' },
      ]
    : [
        { t: 'enter()', d: 'new data, no element yet', n: 'needs append', c: '#22c55e' },
        { t: 'update()', d: 'data and element both exist', n: 'just change attrs', c: '#3b82f6' },
        { t: 'exit()', d: 'extra element, no data', n: 'needs remove', c: '#ef4444' },
      ];
  const CX = 116, CY = 42, CW = 372, CH = 44, GAP = 14;
  let b = '';
  // 左侧：数据与元素两条线
  b += `<text class="matrix-head" x="10" y="24">${zh ? '数据数组' : 'data array'}</text>`;
  b += `<text class="matrix-head" x="10" y="24"></text>`;
  b += `<rect x="10" y="30" width="66" height="24" rx="5" fill="#dbeafe" stroke="#93c5fd"></rect>`;
  b += `<text x="43" y="47" text-anchor="middle" font-size="11" fill="#1e40af">[d0 d1 d2]</text>`;
  b += `<rect x="10" y="74" width="66" height="24" rx="5" fill="#f1f5f9" stroke="#cbd5e1"></rect>`;
  b += `<text x="43" y="91" text-anchor="middle" font-size="11" fill="#334155">[e0 e1]</text>`;
  b += `<text class="matrix-axis" x="43" y="114" text-anchor="middle">${zh ? '已有元素' : 'DOM nodes'}</text>`;
  // 中间：join 汇合
  b += `<path class="flow-arrow" d="M 82 42 L 100 42"></path><path class="flow-arrow" d="M 82 86 L 100 86"></path>`;
  b += `<rect x="100" y="52" width="86" height="26" rx="6" fill="#eef2ff" stroke="#a5b4fc"></rect>`;
  b += `<text x="143" y="69" text-anchor="middle" font-size="11.5" font-weight="700" fill="#4338ca">selection.data()</text>`;

  nodes.forEach((n, i) => {
    const y = 22 + i * (CH + GAP);
    b += `<rect x="${CX + 96}" y="${y}" width="${CW}" height="${CH}" rx="8" fill="#fff" stroke="${n.c}" stroke-width="1.4"></rect>`;
    b += `<circle cx="${CX + 116}" cy="${y + CH / 2}" r="7" fill="${n.c}"></circle>`;
    b += `<text class="flow-title" x="${CX + 134}" y="${y + 20}" font-size="12.5">${esc(n.t)}</text>`;
    b += `<text class="flow-sub" x="${CX + 134}" y="${y + 36}">${esc(n.d)} · ${esc(n.n)}</text>`;
  });
  b += `<path class="flow-arrow" d="M 186 65 C 240 65 240 ${22 + CH / 2} ${CX + 90} ${22 + CH / 2}"></path>`;
  b += `<path class="flow-arrow" d="M 186 65 L ${CX + 90} 65"></path>`;
  b += `<path class="flow-arrow" d="M 186 65 C 240 65 240 ${22 + 2 * (CH + GAP) + CH / 2} ${CX + 90} ${22 + 2 * (CH + GAP) + CH / 2}"></path>`;
  const cap = zh
    ? '<strong>三态的划分依据只有一个：这次数据与 DOM 元素能不能配对。</strong>'
      + '配不上（数据多）走 <code>enter</code>，配得上走 <code>update</code>，元素多出来走 <code>exit</code>。'
      + '数据更新时三态会同时出现，所以标准写法是 <code>selectAll → data → join(...)</code> 一次处理完。'
      + '1.5 节的踩坑演示里，最常见的问题就是「只写了 enter，删数据时旧元素留在画面上」。'
    : '<strong>The split is decided by one thing: can this datum be paired with a DOM node?</strong> '
      + 'Unpaired data goes to <code>enter</code>, paired data to <code>update</code>, surplus nodes to <code>exit</code>. '
      + 'When data changes all three can appear at once, which is why the idiom is '
      + '<code>selectAll → data → join(...)</code>. The most common bug in the 1.5 demo is handling only '
      + '<code>enter</code>, so removed data leaves stale nodes on screen.';
  return figure(b, cap, CX + CW + 110, H);
}

/* ===============================================================
   第 2 章
   =============================================================== */

/** Shneiderman 信息寻求箴言 */
export function shneiderman(lang) {
  const zh = lang === ZH;
  const steps = zh
    ? [
        { t: '① 先概览', e: 'Overview first', d: '先给全貌：总量、分布、趋势', c: '#b4785f' },
        { t: '② 再缩放与过滤', e: 'Zoom & filter', d: '圈定关心的范围，去掉噪声', c: '#6e9cb5' },
        { t: '③ 按需看细节', e: 'Details on demand', d: '鼠标悬停 / 点击才展开', c: '#6f9e77' },
      ]
    : [
        { t: '① Overview first', e: '', d: 'show the whole: totals, spread, trend', c: '#b4785f' },
        { t: '② Zoom & filter', e: '', d: 'narrow to what matters, drop noise', c: '#6e9cb5' },
        { t: '③ Details on demand', e: '', d: 'expand on hover / click only', c: '#6f9e77' },
      ];
  const CW = 190, CH = 96, GAP = 44, PAD = 16;
  const W = PAD * 2 + steps.length * CW + (steps.length - 1) * GAP;
  const H = CH + 74;
  let b = '';
  steps.forEach((s, i) => {
    const x = PAD + i * (CW + GAP), y = 30;
    b += `<rect x="${x}" y="${y}" width="${CW}" height="${CH}" rx="10" fill="#fff" stroke="${s.c}" stroke-width="1.5"></rect>`;
    b += `<rect x="${x}" y="${y}" width="${CW}" height="26" rx="10" fill="${s.c}" opacity="0.12"></rect>`;
    b += `<text class="flow-title" x="${x + CW / 2}" y="${y + 18}" text-anchor="middle" fill="${s.c}">${esc(s.t)}</text>`;
    if (s.e) b += `<text class="flow-label" x="${x + CW / 2}" y="${y + 42}" text-anchor="middle" font-size="10">${esc(s.e)}</text>`;
    textLines(wrap(s.d, 24, 2), x + CW / 2, y + (s.e ? 62 : 50), 'flow-sub');
    if (i < steps.length - 1) {
      const ax = x + CW + 8, ay = y + CH / 2;
      b += `<path class="flow-arrow" d="M ${ax} ${ay} L ${ax + GAP - 16} ${ay}"></path>
            <path class="flow-arrow" d="M ${ax + GAP - 21} ${ay - 5} L ${ax + GAP - 14} ${ay} L ${ax + GAP - 21} ${ay + 5}"></path>`;
    }
  });
  const cap = zh
    ? '<strong>这三句话是交互设计的默认骨架</strong>，D3 里对应关系很清楚：「概览」用全量数据画散点/轮廓，'
      + '「缩放过滤」用 <code>d3.zoom</code> 与下拉筛选，'
      + '「按需细节」用 <code>mouseover</code> 弹 tooltip 或展开子节点。'
      + '第 2 章后面的树形列表正好是这个骨架的实例：先看整棵树 → 折叠到某个专业 → 悬停看学生详情。'
      + '<span class="fig-src">来源：Shneiderman 1996, "The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations"。</span>'
    : '<strong>These three phrases are the default skeleton for interaction design.</strong> In D3 they map cleanly: '
      + 'overview = draw the full dataset; zoom &amp; filter = <code>d3.zoom</code> plus dropdown filters; '
      + 'details on demand = tooltips on <code>mouseover</code> or expanding a node. '
      + 'The tree list later in Chapter 2 is exactly this skeleton: see the whole tree → collapse to one major → hover a student to see details. '
      + '<span class="fig-src">Source: Shneiderman 1996, "The Eyes Have It".</span>';
  return figure(b, cap, W, H);
}

/** 视觉通道感知强度排序 */
export function channelRanking(lang) {
  const zh = lang === ZH;
  const rows = zh
    ? [
        { t: '位置（共同刻度）', a: 1.0, q: '定量' },
        { t: '长度', a: 0.94, q: '定量' },
        { t: '角度 / 斜率', a: 0.88, q: '定量' },
        { t: '面积', a: 0.72, q: '定量（偏弱）' },
        { t: '体积 / 深度', a: 0.62, q: '定量（偏弱）' },
        { t: '亮度 / 明度', a: 0.55, q: '有序' },
        { t: '色相', a: 0.4, q: '定性' },
        { t: '形状', a: 0.28, q: '定性' },
      ]
    : [
        { t: 'Position (common scale)', a: 1.0, q: 'quantitative' },
        { t: 'Length', a: 0.94, q: 'quantitative' },
        { t: 'Angle / slope', a: 0.88, q: 'quantitative' },
        { t: 'Area', a: 0.72, q: 'quantitative (weak)' },
        { t: 'Volume / depth', a: 0.62, q: 'quantitative (weak)' },
        { t: 'Brightness / lightness', a: 0.55, q: 'ordered' },
        { t: 'Hue', a: 0.4, q: 'qualitative' },
        { t: 'Shape', a: 0.28, q: 'qualitative' },
      ];
  const LABEL_W = 156, BAR_MAX = 250, ROW_H = 27, TOP = 34, PAD = 16;
  const W = PAD * 2 + LABEL_W + BAR_MAX + 96;
  const H = TOP + rows.length * ROW_H + 34;
  const col = (a) => (a >= 0.85 ? '#2563eb' : a >= 0.6 ? '#60a5fa' : a >= 0.4 ? '#a5b4fc' : '#c7d2fe');
  let b = `<text class="matrix-head" x="${PAD + LABEL_W}" y="${TOP - 12}">${zh ? '编码数值时的感知准确性（相对值）' : 'accuracy when encoding values (relative)'}</text>`;
  rows.forEach((r, i) => {
    const y = TOP + i * ROW_H;
    b += `<text class="matrix-label" x="${PAD + LABEL_W - 10}" y="${y + 15}" text-anchor="end">${esc(r.t)}</text>`;
    b += `<rect x="${PAD + LABEL_W}" y="${y + 4}" width="${BAR_MAX}" height="16" rx="3" fill="#f1f5f9"></rect>`;
    b += `<rect x="${PAD + LABEL_W}" y="${y + 4}" width="${(BAR_MAX * r.a).toFixed(1)}" height="16" rx="3" fill="${col(r.a)}"></rect>`;
    b += `<text class="matrix-tick" x="${PAD + LABEL_W + BAR_MAX + 8}" y="${y + 16}">${esc(r.q)}</text>`;
  });
  const cap = zh
    ? '<strong>这张排序图的实用价值：选通道之前先看它。</strong>'
      + '同样是画「人数占比」，用<strong>长度</strong>（条形图）比用<strong>角度</strong>（饼图）更容易读准，'
      + '用<strong>面积</strong>（气泡图）更差；所以教科书的口径是「能用位置和长度就不要用面积和色相」。'
      + '注意下半部分：<strong>色相与形状本身不带数量信息</strong>，它们只适合表示「不同的类别」——'
      + '这正是 1.3 节那张矩阵图右下角标「误用」的原因。'
      + '<span class="fig-src">来源：Cleveland &amp; McGill 1984 的图形感知实验（位置/长度/角度/面积/体积的准确性次序）；'
      + 'Mackinlay 1986 把它整理为通道的定量/有序/定性分级。</span>'
    : '<strong>Practical value: check this ordering before choosing a channel.</strong> '
      + 'For "share of students", a <em>length</em> encoding (bar chart) is read more accurately than an '
      + '<em>angle</em> encoding (pie chart), and <em>area</em> (bubble chart) is worse still — hence the textbook rule '
      + '"prefer position and length over area and hue". Note the lower half: <strong>hue and shape carry no magnitude</strong>, '
      + 'so they fit categories only — the same reason the bottom-right cell of the 1.3 matrix is marked as a misuse. '
      + '<span class="fig-src">Source: Cleveland &amp; McGill 1984 (accuracy ordering); Mackinlay 1986 (quantitative / ordered / qualitative tiers).</span>';
  return figure(b, cap, W, H);
}

/** DOM 事件传播三阶段 */
export function domEvents(lang) {
  const zh = lang === ZH;
  const W = 560, H = 210;
  const boxes = [
    { x: 30, y: 24, w: 500, h: 162, t: 'window / document', c: '#e0e7ff' },
    { x: 70, y: 52, w: 420, h: 110, t: 'g.chart', c: '#c7d2fe' },
    { x: 120, y: 84, w: 150, h: 54, t: 'rect.bar', c: '#a5b4fc', hit: true },
    { x: 300, y: 84, w: 150, h: 54, t: 'rect.bar', c: '#a5b4fc' },
  ];
  let b = '';
  boxes.forEach((bx) => {
    b += `<rect x="${bx.x}" y="${bx.y}" width="${bx.w}" height="${bx.h}" rx="8" fill="${bx.c}" opacity="0.75"
            stroke="${bx.hit ? '#dc2626' : '#818cf8'}" stroke-width="${bx.hit ? 2 : 1}"></rect>`;
    b += `<text class="matrix-label" x="${bx.x + 8}" y="${bx.y + 15}" font-size="10.5">${esc(bx.t)}</text>`;
  });
  b += `<text x="${195}" y="${114}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#991b1b">${zh ? '点这里' : 'click here'}</text>`;
  // 三个阶段
  const phases = zh
    ? [
        { t: '① 捕获 capture', d: 'window → … → 目标（父到子）', y: 200, c: '#0891b2' },
        { t: '② 目标 target', d: '事件到达被点的元素', y: 200, c: '#dc2626' },
        { t: '③ 冒泡 bubble', d: '目标 → … → window（子到父）', y: 200, c: '#059669' },
      ]
    : [
        { t: '① capture', d: 'window → … → target (outer to inner)', c: '#0891b2' },
        { t: '② target', d: 'event reaches the clicked node', c: '#dc2626' },
        { t: '③ bubble', d: 'target → … → window (inner to outer)', c: '#059669' },
      ];
  phases.forEach((p, i) => {
    const x = 30 + i * 175;
    b += `<rect x="${x}" y="196" width="166" height="34" rx="6" fill="#fff" stroke="${p.c}" stroke-width="1.3"></rect>`;
    b += `<text x="${x + 8}" y="211" font-size="11" font-weight="700" fill="${p.c}">${esc(p.t)}</text>`;
    b += `<text x="${x + 8}" y="224" font-size="9.5" fill="#475569">${esc(p.d)}</text>`;
  });
  const cap = zh
    ? '<strong>为什么必须懂这三阶段：</strong>图表里的柱子有几十上百个，'
      + '<strong>给每个 <code>rect</code> 绑一个监听器既慢又难维护</strong>——正确做法是把监听器绑在父节点 '
      + '<code>g</code> 上，利用事件冒泡从父节点「接住」子元素的事件（事件委托）。'
      + '另外两个常踩的点：<code>event.stopPropagation()</code> 会掐断冒泡让父节点收不到；'
      + 'tooltip 要跟着鼠标走就得用 <code>event.clientX/Y</code> 而不是元素自身坐标。'
    : '<strong>Why this matters:</strong> a chart may hold hundreds of bars, and '
      + '<strong>attaching a listener to every <code>rect</code> is slow and hard to maintain</strong> — the right move is to '
      + 'listen on the parent <code>g</code> and let bubbling carry child events up (event delegation). '
      + 'Two related traps: <code>event.stopPropagation()</code> cuts bubbling so the parent never hears the event, '
      + 'and a tooltip that should follow the cursor needs <code>event.clientX/Y</code>, not the element\'s own coordinates.';
  return figure(b, cap, W, H + 40);
}

/* ===============================================================
   第 3 章
   =============================================================== */

/** 颜色空间关系 */
export function colorSpaces(lang) {
  const zh = lang === ZH;
  const W = 540, H = 220;
  const nodes = zh
    ? [
        { t: 'RGB', d: '硬件怎么发光', u: '屏幕 / 取色器', x: 70, c: '#ef4444' },
        { t: 'HSL / HSV', d: '人怎么描述颜色', u: '调色板 / 主题', x: 270, c: '#0891b2' },
        { t: 'Lab / LCh', d: '人怎么感觉颜色', u: 'colormap / 配色评估', x: 470, c: '#7c3aed' },
      ]
    : [
        { t: 'RGB', d: 'how hardware emits light', u: 'screens / color pickers', x: 70, c: '#ef4444' },
        { t: 'HSL / HSV', d: 'how people describe color', u: 'palettes / themes', x: 270, c: '#0891b2' },
        { t: 'Lab / LCh', d: 'how people perceive color', u: 'colormaps / evaluation', x: 470, c: '#7c3aed' },
      ];
  let b = '';
  nodes.forEach((n) => {
    b += `<circle cx="${n.x}" cy="86" r="46" fill="${n.c}" opacity="0.13" stroke="${n.c}" stroke-width="1.5"></circle>`;
    b += `<text x="${n.x}" y="82" text-anchor="middle" font-size="14" font-weight="700" fill="${n.c}">${esc(n.t)}</text>`;
    b += `<text x="${n.x}" y="100" text-anchor="middle" font-size="9.5" fill="#475569">${esc(n.d)}</text>`;
    b += `<text x="${n.x}" y="152" text-anchor="middle" font-size="10" fill="#64748b">${esc(n.u)}</text>`;
  });
  const arrow = (x1, x2, label) => `
    <path class="flow-arrow" d="M ${x1} 86 L ${x2} 86"></path>
    <path class="flow-arrow" d="M ${x2 - 5} 81 L ${x2} 86 L ${x2 - 5} 91"></path>
    <text class="flow-label" x="${(x1 + x2) / 2}" y="78" text-anchor="middle" font-size="9.5">${esc(label)}</text>`;
  b += arrow(116, 224, zh ? '描述更方便' : 'easier to describe');
  b += arrow(316, 424, zh ? '换算去知觉偏差' : 'remove perceptual bias');
  // 底部：同一颜色的三种写法
  b += `<text class="matrix-head" x="16" y="186">${zh ? '同一个颜色，三种写法：' : 'Same color, three notations:'}</text>`;
  const samples = [
    { l: 'rgb(37, 99, 235)', x: 16 },
    { l: 'hsl(217, 91%, 53%)', x: 196 },
    { l: 'lab(48% 12 -68)', x: 376 },
  ];
  samples.forEach((s) => {
    b += `<rect x="${s.x}" y="194" width="26" height="18" rx="4" fill="#2563eb"></rect>`;
    b += `<text x="${s.x + 32}" y="208" font-size="10.5" fill="#334155" font-family="monospace">${esc(s.l)}</text>`;
  });
  const cap = zh
    ? '<strong>三者的分工是这张图的关键：</strong>RGB 适合存与显示（但两个颜色「看起来差多少」它说不准）；'
      + 'HSL 适合人手动挑色（色相/饱和度/亮度三个旋钮符合直觉）；'
      + '<strong>Lab 的 L 通道就是感知亮度，所以做 colormap 和配色评价必须用 Lab</strong>——'
      + '第 3.3 节讲「感知均匀」时，判据就是「Lab 距离相等时人眼感觉也相等」。'
    : '<strong>The division of labour is the point:</strong> RGB is fine for storage and display but cannot tell you '
      + '"how different do these two colors look"; HSL is easy for humans to hand-pick; '
      + '<strong>Lab\'s L channel is perceptual lightness, so colormaps and palette evaluation must use Lab</strong> — '
      + 'which is exactly the criterion for "perceptually uniform" in section 3.3.';
  return figure(b, cap, W, H);
}

/** 感知均匀性：RGB 插值 vs Lab 插值 */
export function uniformity(lang) {
  const zh = lang === ZH;
  const W = 560, H = 190;
  const BAR_X = 150, BAR_W = 340, BAR_H = 26;
  // RGB 线性插值（中间发灰）与 Lab 插值（亮度单调）的近似色标
  const rgbMix = ['#0000ff', '#3f3fd4', '#6b6ba9', '#93938f', '#b8b875', '#dcdc5b', '#ffff00'];
  const labMix = ['#0000ff', '#3a4ce8', '#5a83f0', '#7db4f5', '#a3d8f7', '#cceef9', '#ffff00'];
  let b = '';
  const bands = [
    { label: zh ? 'RGB 直接插值' : 'RGB interpolation', stops: rgbMix, note: zh ? '中段发灰、亮度先降后升 → 数据"看起来分成两簇"' : 'grey middle, lightness dips → data looks bimodal', bad: true },
    { label: zh ? 'Lab / 感知均匀插值' : 'Lab interpolation', stops: labMix, note: zh ? '亮度单调上升 → 数值大小与深浅一一对应' : 'lightness rises monotonically → value maps to depth', bad: false },
  ];
  bands.forEach((band, i) => {
    const y = 44 + i * 62;
    b += `<text class="band-label" x="${BAR_X - 12}" y="${y + 18}" text-anchor="end">${esc(band.label)}</text>`;
    const seg = BAR_W / band.stops.length;
    band.stops.forEach((c, si) => {
      b += `<rect x="${BAR_X + si * seg}" y="${y}" width="${seg + 0.5}" height="${BAR_H}" fill="${c}"></rect>`;
    });
    b += `<rect x="${BAR_X}" y="${y}" width="${BAR_W}" height="${BAR_H}" rx="4" fill="none" stroke="#e2e8f0"></rect>`;
    b += `<text class="band-note" x="${BAR_X}" y="${y + BAR_H + 15}" fill="${band.bad ? '#b91c1c' : '#047857'}">${esc(band.note)}</text>`;
  });
  b += `<text class="band-tick" x="${BAR_X}" y="34">${zh ? '低' : 'low'}</text>`;
  b += `<text class="band-tick" x="${BAR_X + BAR_W}" y="34" text-anchor="end">${zh ? '高' : 'high'}</text>`;
  const cap = zh
    ? '<strong>「感知均匀」不是玄学，就一条判据：相等的数值差应该看起来相等。</strong>'
      + '上面那条在两端看起来"深蓝→灰→亮黄"，中间那段会让人误以为数据在这里有个转折；'
      + '下面那条亮度单调变化，读起来才和数值一致。'
      + '这也是 <code>d3.interpolateViridis</code> 这类 colormap 的设计目标，'
      + '以及 3.3 节要强调的「不要拿 RGB 两端直接插值」。'
    : '<strong>Perceptual uniformity has one test: equal value steps should look like equal steps.</strong> '
      + 'The top band reads "dark blue → grey → bright yellow"; the grey middle makes viewers see a spurious break in the data. '
      + 'The bottom band rises monotonically in lightness, so what you see matches the numbers. '
      + 'This is the design goal of colormaps such as <code>d3.interpolateViridis</code>, and the reason section 3.3 warns '
      + 'against interpolating straight through RGB.';
  return figure(b, cap, W, H);
}

/** 5 大色系搭配规则 */
export function colorHarmony(lang) {
  const zh = lang === ZH;
  const schemes = zh
    ? [
        { t: '同类色', d: '同一色相调明暗', angs: [0, 0, 0], sat: [1, 0.7, 0.45], li: [0.35, 0.5, 0.68] },
        { t: '邻近色', d: '色轮上相邻 ±30°', angs: [0, 30, -30], sat: [1, 1, 1], li: [0.45, 0.5, 0.5] },
        { t: '互补色', d: '色轮对面 180°', angs: [0, 180, 180], sat: [1, 1, 0.6], li: [0.5, 0.5, 0.68] },
        { t: '分裂互补', d: '对面两侧 ±150°', angs: [0, 150, -150], sat: [1, 1, 1], li: [0.5, 0.5, 0.5] },
        { t: '三角配色', d: '三等分 120°', angs: [0, 120, 240], sat: [1, 1, 1], li: [0.5, 0.5, 0.5] },
      ]
    : [
        { t: 'Monochromatic', d: 'one hue, vary lightness', angs: [0, 0, 0], sat: [1, 0.7, 0.45], li: [0.35, 0.5, 0.68] },
        { t: 'Analogous', d: 'adjacent ±30°', angs: [0, 30, -30], sat: [1, 1, 1], li: [0.45, 0.5, 0.5] },
        { t: 'Complementary', d: 'opposite 180°', angs: [0, 180, 180], sat: [1, 1, 0.6], li: [0.5, 0.5, 0.68] },
        { t: 'Split complementary', d: '±150° around opposite', angs: [0, 150, -150], sat: [1, 1, 1], li: [0.5, 0.5, 0.5] },
        { t: 'Triadic', d: 'evenly at 120°', angs: [0, 120, 240], sat: [1, 1, 1], li: [0.5, 0.5, 0.5] },
      ];
  const hsl = (h, s, l) => {
    const H = ((h % 360) + 360) % 360;
    // HSL → RGB（简洁实现，够画色轮用）
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((H / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, bl = 0;
    if (H < 60) [r, g, bl] = [c, x, 0];
    else if (H < 120) [r, g, bl] = [x, c, 0];
    else if (H < 180) [r, g, bl] = [0, c, x];
    else if (H < 240) [r, g, bl] = [0, x, c];
    else if (H < 300) [r, g, bl] = [x, 0, c];
    else [r, g, bl] = [c, 0, x];
    const hex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return '#' + hex(r) + hex(g) + hex(bl);
  };
  const PAD = 14, CW = 104, CH = 128, GAP = 10;
  const W = PAD * 2 + schemes.length * CW + (schemes.length - 1) * GAP;
  const H = CH + 40;
  let b = '';
  schemes.forEach((s, i) => {
    const x = PAD + i * (CW + GAP), y = 12;
    b += `<rect class="km-card" x="${x}" y="${y}" width="${CW}" height="${CH}" rx="9"></rect>`;
    b += `<text class="flow-title" x="${x + CW / 2}" y="${y + 20}" text-anchor="middle" font-size="11.5">${esc(s.t)}</text>`;
    // 色轮
    const cx = x + CW / 2, cy = y + 66, R = 30;
    b += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#e2e8f0" stroke-width="8"></circle>`;
    s.angs.forEach((a, k) => {
      const col = hsl(a, s.sat[k], s.li[k]);
      const rad = ((a - 90) * Math.PI) / 180;
      const px = cx + Math.cos(rad) * R, py = cy + Math.sin(rad) * R;
      b += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="7.5" fill="${col}" stroke="#fff" stroke-width="1.5"></circle>`;
      if (k > 0) {
        const rad0 = ((s.angs[0] - 90) * Math.PI) / 180;
        b += `<line x1="${(cx + Math.cos(rad0) * R).toFixed(1)}" y1="${(cy + Math.sin(rad0) * R).toFixed(1)}"
                 x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2 2"></line>`;
      }
    });
    // 实际色块
    s.angs.forEach((a, k) => {
      const col = hsl(a, s.sat[k], s.li[k]);
      b += `<rect x="${x + 14 + k * 26}" y="${y + 102}" width="22" height="14" rx="3" fill="${col}"></rect>`;
    });
    textLines(wrap(s.d, 18, 1), x + CW / 2, y + CH + 18, 'flow-sub');
  });
  const cap = zh
    ? '<strong>配色规则的作用是「看起来是一套」而不是「好看」。</strong>'
      + '同一张图里如果颜色彼此无关，读者会以为它们编码了某种关系；'
      + '反过来，颜色太接近又会分不清类别。五条规则给的是"既相关又可分"的平衡点：'
      + '类别少（2–3 类）用互补或分裂互补对比最强；类别多（5 类以上）用同类色 + 明暗区分更稳；'
      + '<strong>要编码数值大小，永远回到"单色相 + 明暗单调"的同类色方案</strong>（与 3.2 节的顺序型 colormap 对应）。'
    : '<strong>Harmony rules exist so a palette looks like one family, not to look pretty.</strong> '
      + 'If colors in one chart seem unrelated, readers assume they encode a relationship; if they are too close, categories blur. '
      + 'These five rules are the balance point: for 2–3 categories use complementary / split-complementary for maximum contrast; '
      + 'for 5+ categories monochromatic with varied lightness is steadier; '
      + '<strong>to encode magnitude, always come back to a single-hue, monotonic-lightness scheme</strong> '
      + '(the sequential colormap of section 3.2).';
  return figure(b, cap, W, H);
}

/* ===============================================================
   第 4 章
   =============================================================== */

/** 近似各种 d3 曲线风格的示意图路径（只求形似，不追求与 d3 逐点一致） */
function smoothPath(pts, style) {
  const P = pts.map(([x, y]) => [x + 6, y + 6]);
  if (!style) return P.map((p, i) => (i ? 'L' : 'M') + ` ${p[0]} ${p[1]}`).join(' ');
  if (style === 'step' || style === 'stepAfter') {
    let d = `M ${P[0][0]} ${P[0][1]}`;
    for (let i = 1; i < P.length; i++) {
      const mx = style === 'step' ? (P[i - 1][0] + P[i][0]) / 2 : P[i][0];
      d += ` L ${mx} ${P[i - 1][1]} L ${mx} ${P[i][1]} L ${P[i][0]} ${P[i][1]}`;
    }
    return d;
  }
  if (style === 'basis' || style === 'bundle') {
    let d = `M ${P[0][0]} ${P[0][1]}`;
    for (let i = 1; i < P.length - 1; i++) {
      const mx = (P[i][0] + P[i + 1][0]) / 2;
      const my = (P[i][1] + P[i + 1][1]) / 2;
      d += ` Q ${P[i][0]} ${P[i][1]} ${mx} ${my}`;
    }
    return d;
  }
  let d = `M ${P[0][0]} ${P[0][1]}`;
  for (let i = 1; i < P.length; i++) {
    const p0 = P[i - 1], p1 = P[i];
    const cx = (p0[0] + p1[0]) / 2;
    const bias = style === 'bump' ? 0.6 : style === 'monotone' ? 0.15 : 0.5;
    d += ` C ${cx} ${p0[1] + (style === 'bump' ? (p1[1] - p0[1]) * bias : 0)} ${cx} ${p1[1]} ${p1[0]} ${p1[1]}`;
  }
  return d;
}

/** 数据变换的四种类型 */
export function transformTypes(lang) {
  const zh = lang === ZH;
  const steps = zh
    ? [
        { t: '过滤 Filter', d: '保留满足条件的行', e: 'age >= 18', io: '3 行 → 2 行', c: '#b4785f' },
        { t: '分组 Group', d: '按字段切成多组', e: 'by 专业', io: '3 行 → 2 组', c: '#6e9cb5' },
        { t: '聚合 Aggregate', d: '每组压成一个数', e: 'count()', io: '2 组 → 2 数', c: '#8f86b8' },
        { t: '排序 Sort', d: '按数值重排（做排名）', e: 'desc by n', io: '改变顺序', c: '#6f9e77' },
      ]
    : [
        { t: 'Filter', d: 'keep rows that pass', e: 'age >= 18', io: '3 rows → 2 rows', c: '#b4785f' },
        { t: 'Group', d: 'split by a field', e: 'by major', io: '3 rows → 2 groups', c: '#6e9cb5' },
        { t: 'Aggregate', d: 'collapse each group', e: 'count()', io: '2 groups → 2 numbers', c: '#8f86b8' },
        { t: 'Sort', d: 'reorder (for ranking)', e: 'desc by n', io: 'order changes', c: '#6f9e77' },
      ];
  const CW = 176, CH = 104, GAP = 38, PAD = 16;
  const W = PAD * 2 + 200 + steps.length * CW + (steps.length - 1) * GAP;
  const H = CH + 88;
  let b = `<text class="matrix-head" x="${PAD}" y="20">${zh ? '原始数据表' : 'source table'}</text>`;
  const rows = [['小明', '计算机', '18'], ['小红', '计算机', '19'], ['小刚', '软件', '17']];
  rows.forEach((r, i) => {
    const y = 30 + i * 20;
    r.forEach((cell, j) => {
      b += `<rect x="${PAD + j * 54}" y="${y}" width="54" height="20" fill="${i % 2 ? '#f8fafc' : '#fff'}" stroke="#e2e8f0"></rect>`;
      b += `<text x="${PAD + j * 54 + 27}" y="${y + 14}" text-anchor="middle" font-size="10" fill="#334155">${esc(cell)}</text>`;
    });
  });
  b += `<path class="flow-arrow" d="M ${PAD + 166} 70 L ${PAD + 186} 70"></path>
        <path class="flow-arrow" d="M ${PAD + 181} 65 L ${PAD + 188} 70 L ${PAD + 181} 75"></path>`;
  steps.forEach((s, i) => {
    const x = PAD + 196 + i * (CW + GAP), y = 26;
    b += `<rect x="${x}" y="${y}" width="${CW}" height="${CH}" rx="9" fill="#fff" stroke="${s.c}" stroke-width="1.5"></rect>`;
    b += `<rect x="${x}" y="${y}" width="${CW}" height="24" rx="9" fill="${s.c}" opacity="0.13"></rect>`;
    b += `<text class="flow-title" x="${x + CW / 2}" y="${y + 17}" text-anchor="middle" fill="${s.c}">${esc(s.t)}</text>`;
    textLines(wrap(s.d, 21, 2), x + CW / 2, y + 44, 'flow-sub');
    b += `<text class="flow-label" x="${x + CW / 2}" y="${y + 78}" text-anchor="middle" font-family="monospace">${esc(s.e)}</text>`;
    b += `<text class="matrix-tick" x="${x + CW / 2}" y="${y + 95}" text-anchor="middle">${esc(s.io)}</text>`;
    if (i < steps.length - 1) {
      const ax = x + CW + 5, ay = y + CH / 2;
      b += `<path class="flow-arrow" d="M ${ax} ${ay} L ${ax + GAP - 13} ${ay}"></path>
            <path class="flow-arrow" d="M ${ax + GAP - 18} ${ay - 5} L ${ax + GAP - 11} ${ay} L ${ax + GAP - 18} ${ay + 5}"></path>`;
    }
  });
  b += `<text class="matrix-axis" x="${PAD + 196}" y="${H - 10}">${zh ? '这四步串起来，就是第 2 章数据流模型里的「数据 → 数据表」' : 'chained, these four are the "data → table" step of the Chapter 2 model'}</text>`;
  const cap = zh
    ? '<strong>先想清楚要动的是「行」还是「值」，再选函数。</strong>'
      + '过滤和排序只动行的顺序与数量；分组和聚合才会产生新的数值（新的一列或一张小表）。'
      + '第 4.1 节的 Crime 数据就是这条链的实际应用：先过滤掉缺失值，再按性别分组求均值。'
    : '<strong>Decide whether you are changing rows or values, then pick the function.</strong> '
      + 'Filter and sort only change the order and count of rows; group and aggregate create new numbers. '
      + 'The Crime dataset in 4.1 walks exactly this chain: filter missing values, then group by gender and average.';
  return figure(b, cap, W, H);
}

/** 10 种曲线类型对比 */
export function curveTypes(lang) {
  const zh = lang === ZH;
  const pts = [[0, 0], [18, 26], [36, 8], [54, 34], [72, 14], [90, 30]];
  const items = zh
    ? [
        { n: 'curveLinear', s: null, d: '直连，最忠实' },
        { n: 'curveStep', s: 'step', d: '阶梯，适合离散状态' },
        { n: 'curveStepAfter', s: 'stepAfter', d: '保持到下一时刻' },
        { n: 'curveBasis', s: 'basis', d: '平滑但不穿点' },
        { n: 'curveCardinal', s: 'cardinal', d: '平滑且穿点' },
        { n: 'curveCatmullRom', s: 'catmull', d: '更柔和的穿点平滑' },
        { n: 'curveMonotoneX', s: 'monotone', d: '单调，不造假峰' },
        { n: 'curveNatural', s: 'natural', d: '自然三次样条' },
        { n: 'curveBumpX', s: 'bump', d: '凸起，适合流向' },
        { n: 'curveBundle', s: 'bundle', d: '束状，适合关系图' },
      ]
    : [
        { n: 'curveLinear', s: null, d: 'straight joins, most faithful' },
        { n: 'curveStep', s: 'step', d: 'steps, for discrete states' },
        { n: 'curveStepAfter', s: 'stepAfter', d: 'hold until next point' },
        { n: 'curveBasis', s: 'basis', d: 'smooth but misses points' },
        { n: 'curveCardinal', s: 'cardinal', d: 'smooth through points' },
        { n: 'curveCatmullRom', s: 'catmull', d: 'gentler through-points' },
        { n: 'curveMonotoneX', s: 'monotone', d: 'monotone, no false peaks' },
        { n: 'curveNatural', s: 'natural', d: 'natural cubic spline' },
        { n: 'curveBumpX', s: 'bump', d: 'bumps, good for flows' },
        { n: 'curveBundle', s: 'bundle', d: 'bundled, for relations' },
      ];
  const CW = 168, CH = 78, GAP = 10, PAD = 14, COLS = 5;
  const W = PAD * 2 + COLS * CW + (COLS - 1) * GAP;
  const ROWS = Math.ceil(items.length / COLS);
  const H = PAD * 2 + ROWS * CH + (ROWS - 1) * GAP;
  let b = '';
  items.forEach((it, i) => {
    const r = Math.floor(i / COLS), c = i % COLS;
    const x = PAD + c * (CW + GAP), y = PAD + r * (CH + GAP);
    b += `<rect x="${x}" y="${y}" width="${CW}" height="${CH}" rx="7" fill="#fff" stroke="#e2e8f0"></rect>`;
    b += `<text x="${x + 8}" y="${y + 15}" font-size="10.5" font-weight="600" fill="#334155" font-family="monospace">${esc(it.n)}</text>`;
    b += `<g transform="translate(${x + 8}, ${y + 20})">`;
    b += `<path d="${smoothPath(pts, it.s)}" fill="none" stroke="#2563eb" stroke-width="1.8"></path>`;
    pts.forEach((p) => { b += `<circle cx="${p[0] + 6}" cy="${p[1] + 6}" r="2.2" fill="#1e293b"></circle>`; });
    b += `</g>`;
    b += `<text class="flow-sub" x="${x + 8}" y="${y + CH - 8}" font-size="9.5">${esc(it.d)}</text>`;
  });
  const cap = zh
    ? '<strong>平滑是有代价的：曲线越平滑，越可能与真实数据不符。</strong>'
      + '注意 <code>curveBasis</code> 与 <code>curveCardinal</code> 的区别——前者根本不经过数据点，'
      + '后者经过但会在点之间"鼓"出去；<code>curveMonotoneX</code> 专门保证不制造假的局部极值，'
      + '<strong>画"单调上升的曲线"这类图时它是更安全的选择</strong>。'
      + '实务判断：数据点少时用 linear 最老实；点密集、只是想去掉锯齿时才用单调平滑。'
    : '<strong>Smoothing has a cost: the smoother the curve, the less it may match the data.</strong> '
      + 'Compare <code>curveBasis</code> (never passes through the points) with <code>curveCardinal</code> '
      + '(passes through but bulges). <code>curveMonotoneX</code> specifically avoids inventing local extrema — '
      + '<strong>the safer choice for a monotone rising series</strong>. '
      + 'Rule of thumb: few points → stay with linear; many noisy points → monotone smoothing.';
  return figure(b, cap, W, H);
}

/** Cleveland 45° 倾角实验 */
export function clevelandSlope(lang) {
  const zh = lang === ZH;
  const W = 560, H = 200;
  const series = [3.2, 3.6, 4.6, 5.2, 6.3, 6.9, 8.2];
  const draw = (ox, oy, w, h, scaleY, label, good) => {
    let s = `<rect x="${ox}" y="${oy}" width="${w}" height="${h}" rx="6" fill="#fff" stroke="#e2e8f0"></rect>`;
    s += `<text x="${ox + w / 2}" y="${oy - 8}" text-anchor="middle" font-size="11.5" font-weight="600" fill="${good ? '#047857' : '#b91c1c'}">${esc(label)}</text>`;
    const n = series.length;
    const px = (i) => ox + 16 + (i * (w - 32)) / (n - 1);
    const py = (v) => oy + h - 16 - ((v - 3) / (8.2 - 3)) * (h - 32) * scaleY;
    s += `<path d="${series.map((v, i) => (i ? 'L' : 'M') + ' ' + px(i).toFixed(1) + ' ' + py(v).toFixed(1)).join(' ')}"
            fill="none" stroke="${good ? '#059669' : '#dc2626'}" stroke-width="2"></path>`;
    series.forEach((v, i) => { s += `<circle cx="${px(i).toFixed(1)}" cy="${py(v).toFixed(1)}" r="2.6" fill="${good ? '#059669' : '#dc2626'}"></circle>`; });
    return s;
  };
  let b = '';
  b += draw(24, 36, 240, 128, 1.0, zh ? 'a) 斜率较陡（更接近 45°）' : 'a) steeper (closer to 45°)', true);
  b += draw(296, 36, 240, 128, 0.28, zh ? 'b) 纵轴压扁（斜率很小）' : 'b) y squashed (tiny slope)', false);
  b += `<path class="flow-arrow" d="M 272 100 L 288 100"></path>`;
  b += `<text class="matrix-axis" x="24" y="${H - 8}">${zh ? '同一组数据，只改变纵轴尺度，人眼判断"涨幅"的准确度就不同' : 'same data, only the y-scale differs — accuracy of judging "how much" changes'}</text>`;
  const cap = zh
    ? '<strong>结论有点反直觉：图被压得太扁时，人反而读不准变化幅度。</strong>'
      + 'Cleveland 的实验发现，判断"两个值差多少"时，<strong>平均斜率接近 45° 的折线最容易被准确读取</strong>，'
      + '过度拉伸或压扁都会让误差变大。'
      + '实务推论：想强调"涨得快"就把纵轴拉到接近 45°；'
      + '想淡化涨幅就压扁纵轴——<strong>这也正是"纵轴不从 0 开始"能误导人的原因</strong>。'
      + '<span class="fig-src">来源：Cleveland &amp; McGill 1984 关于角度/斜率判断的实验结论（"banking to 45°"）。</span>'
    : '<strong>Slightly counter-intuitive: a chart squashed too flat makes magnitudes harder to judge.</strong> '
      + 'Cleveland\'s experiments found that when judging "how much bigger is A than B", '
      + '<strong>a line whose average slope is near 45° is read most accurately</strong>; '
      + 'over-stretching or squashing the y-axis both increase error. '
      + 'Practical consequence: stretch the y-axis toward 45° to emphasise growth, squash it to play growth down — '
      + '<strong>which is exactly why "y-axis not starting at zero" can mislead</strong>. '
      + '<span class="fig-src">Source: Cleveland &amp; McGill 1984 (the "banking to 45°" principle).</span>';
  return figure(b, cap, W, H);
}

/** Marching Squares 原理 */
export function marchingSquares(lang) {
  const zh = lang === ZH;
  const W = 560, H = 196;
  const cell = 46;
  let b = '';
  const vals = [[3, 7], [5, 9]];
  const ox = 30, oy = 46;
  b += `<text class="matrix-head" x="${ox}" y="${oy - 14}">${zh ? '① 每个方格看四个角' : '① look at 4 corners per cell'}</text>`;
  vals.forEach((row, r) => row.forEach((v, c) => {
    const x = ox + c * cell, y = oy + r * cell;
    const above = v >= 6;
    b += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${above ? '#dbeafe' : '#f8fafc'}" stroke="#cbd5e1"></rect>`;
    b += `<circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="11" fill="${above ? '#2563eb' : '#fff'}" stroke="#94a3b8"></circle>`;
    b += `<text x="${x + cell / 2}" y="${y + cell / 2 + 4}" text-anchor="middle" font-size="11" fill="${above ? '#fff' : '#475569'}">${v}</text>`;
  }));
  b += `<text class="matrix-axis" x="${ox}" y="${oy + 2 * cell + 18}">${zh ? '阈值 = 6，≥6 记作"内部"' : 'threshold = 6, ≥6 counts as "inside"'}</text>`;

  const cases = zh
    ? [{ n: '一角在内', d: '切掉一个角' }, { n: '相邻两角在内', d: '直线穿过' }, { n: '对角两角在内', d: '两条线段' }, { n: '三角在内', d: '切掉三角' }]
    : [{ n: 'one corner inside', d: 'clips a corner' }, { n: 'two adjacent inside', d: 'straight cut' }, { n: 'two diagonal inside', d: 'two segments' }, { n: 'three inside', d: 'clips a triangle' }];
  const cx0 = 232, cy0 = 44, CS = 50, GAP = 12;
  b += `<text class="matrix-head" x="${cx0}" y="${cy0 - 14}">${zh ? '② 16 种组合归成 4 类画法' : '② 16 cases reduce to 4 drawings'}</text>`;
  const corners = [[0, 0], [1, 0], [0, 1], [1, 1]];
  cases.forEach((cs, i) => {
    const x = cx0 + (i % 2) * (CS + GAP + 96), y = cy0 + Math.floor(i / 2) * (CS + GAP + 8);
    const inside = [[1, 0, 0, 0], [1, 1, 0, 0], [1, 0, 0, 1], [1, 1, 1, 0]][i];
    b += `<rect x="${x}" y="${y}" width="${CS}" height="${CS}" fill="#f8fafc" stroke="#cbd5e1"></rect>`;
    corners.forEach((cn, k) => {
      const px = x + cn[0] * CS, py = y + cn[1] * CS;
      b += `<circle cx="${px}" cy="${py}" r="6.5" fill="${inside[k] ? '#2563eb' : '#fff'}" stroke="#94a3b8"></circle>`;
    });
    const cxy = corners.map((cn) => [cn[0] * CS, cn[1] * CS]);
    const segs = [];
    for (let e = 0; e < 4; e++) {
      const a = e, bb = (e + 1) % 4;
      if (inside[a] !== inside[bb]) {
        segs.push([(cxy[a][0] + cxy[bb][0]) / 2, (cxy[a][1] + cxy[bb][1]) / 2]);
      }
    }
    if (segs.length >= 2) {
      b += `<path d="M ${(x + segs[0][0]).toFixed(1)} ${(y + segs[0][1]).toFixed(1)} L ${(x + segs[1][0]).toFixed(1)} ${(y + segs[1][1]).toFixed(1)}"
              stroke="#dc2626" stroke-width="2.4" fill="none"></path>`;
      if (segs.length === 4) {
        b += `<path d="M ${(x + segs[2][0]).toFixed(1)} ${(y + segs[2][1]).toFixed(1)} L ${(x + segs[3][0]).toFixed(1)} ${(y + segs[3][1]).toFixed(1)}"
                stroke="#dc2626" stroke-width="2.4" fill="none"></path>`;
      }
    }
    b += `<text class="flow-sub" x="${x + CS + 8}" y="${y + 22}" font-size="10">${esc(cs.n)}</text>`;
    b += `<text class="matrix-tick" x="${x + CS + 8}" y="${y + 36}">${esc(cs.d)}</text>`;
  });
  const cap = zh
    ? '<strong>等值线的本质是"在网格边上找内外交界"。</strong>'
      + '每个方格四个角与阈值比较得到 16 种内外组合；'
      + '对每组只需在"一内一外"的边上取中点（严格做法按数值线性插值），连起来就是一段等值线。'
      + '把所有方格的线段接龙，就是 4.5 节演示里那条完整曲线——'
      + '<strong>它不做任何曲线拟合，只是一堆直线段接起来</strong>。'
    : '<strong>Contours fundamentally "find where inside meets outside along cell edges".</strong> '
      + 'Comparing four corners per cell with the threshold gives 16 patterns; for each you only connect the midpoints of '
      + 'edges where inside meets outside (the rigorous version interpolates by value). '
      + 'Chain the segments of all cells and you get the contour from the 4.5 demo — '
      + '<strong>no curve fitting, just many short segments joined</strong>.';
  return figure(b, cap, W, H);
}

/* ===============================================================
   第 5 章
   =============================================================== */

/** 时间序列的三种表达 */
export function seriesForms(lang) {
  const zh = lang === ZH;
  const W = 566, H = 194;
  const a = [0.35, 0.5, 0.42, 0.62, 0.55, 0.78, 0.7, 0.9];
  const bser = [0.25, 0.3, 0.36, 0.4, 0.52, 0.58, 0.62, 0.7];
  const cser = [0.15, 0.2, 0.22, 0.28, 0.34, 0.36, 0.42, 0.48];
  const chartW = 162, chartH = 116, oy = 40;
  const xs = (i, ox) => ox + 12 + (i * (chartW - 24)) / (a.length - 1);
  const ys = (v) => oy + chartH - 12 - v * (chartH - 26);
  const line = (arr, ox) => arr.map((v, i) => (i ? 'L' : 'M') + ' ' + xs(i, ox).toFixed(1) + ' ' + ys(v).toFixed(1)).join(' ');
  let b = '';
  // a) 折线
  const ox1 = 20;
  b += `<rect x="${ox1}" y="${oy}" width="${chartW}" height="${chartH}" rx="6" fill="#fff" stroke="#e2e8f0"></rect>`;
  b += `<path d="${line(a, ox1)}" fill="none" stroke="#2563eb" stroke-width="2"></path>`;
  b += `<text class="matrix-head" x="${ox1 + chartW / 2}" y="${oy - 10}" text-anchor="middle" font-size="11">${zh ? 'a) 折线：看趋势' : 'a) Line: trend'}</text>`;
  // b) 堆叠面积
  const ox2 = ox1 + chartW + 26;
  b += `<rect x="${ox2}" y="${oy}" width="${chartW}" height="${chartH}" rx="6" fill="#fff" stroke="#e2e8f0"></rect>`;
  const stackTop = a.map((v, i) => v + bser[i] + cser[i]);
  const stackMid = bser.map((v, i) => v + cser[i]);
  const rev = (arr, ox) => arr.slice().reverse().map((v, k) => ' L ' + xs(arr.length - 1 - k, ox).toFixed(1) + ' ' + ys(v).toFixed(1)).join('');
  b += `<path d="${line(stackTop, ox2)}${rev(stackMid, ox2)} Z" fill="#bfdbfe"></path>`;
  b += `<path d="${line(stackMid, ox2)}${rev(cser, ox2)} Z" fill="#93c5fd"></path>`;
  b += `<path d="${line(cser, ox2)}${rev(cser.map(() => 0), ox2)} Z" fill="#60a5fa"></path>`;
  b += `<text class="matrix-head" x="${ox2 + chartW / 2}" y="${oy - 10}" text-anchor="middle" font-size="11">${zh ? 'b) 堆叠面积：看构成' : 'b) Stacked: composition'}</text>`;
  // c) 流图
  const ox3 = ox2 + chartW + 26;
  b += `<rect x="${ox3}" y="${oy}" width="${chartW}" height="${chartH}" rx="6" fill="#fff" stroke="#e2e8f0"></rect>`;
  const mid = cser.map((v, i) => v + bser[i] / 2);
  const th = bser.map((v, i) => v * (0.3 + 0.35 * (i / bser.length)));
  b += `<path d="${line(mid.map((v, i) => v + th[i]), ox3)}${rev(mid.map((v, i) => v - th[i]), ox3)} Z" fill="#60a5fa" opacity="0.8"></path>`;
  b += `<text class="matrix-head" x="${ox3 + chartW / 2}" y="${oy - 10}" text-anchor="middle" font-size="11">${zh ? 'c) 流图：看此消彼长' : 'c) Stream: shifts'}</text>`;
  // 底部说明
  const notes = zh
    ? ['整体涨还是跌 → 折线', '总量由什么构成 → 堆叠面积', 'A 变多时 B 是否变少 → 流图']
    : ['rising or falling → line', 'what makes up the total → stacked', 'does B shrink as A grows → stream'];
  notes.forEach((n, i) => {
    b += `<text class="flow-sub" x="${20 + i * 182}" y="${oy + chartH + 22}" font-size="10">${esc(n)}</text>`;
  });
  const cap = zh
    ? '<strong>三张图画的是同一份数据，选哪个取决于你要回答的问题。</strong>'
      + '第 5.2 节的法国人名序列用折线，因为要回答的是"某个名字的流行度如何随时间起落"；'
      + '如果问题变成"这些名字加起来占总出生人口的比例怎么变"，就该换成堆叠面积或流图了。'
    : '<strong>All three draw the same data; the question decides.</strong> '
      + 'Section 5.2 uses a line for the French baby-name series because the question is how one name\'s popularity rose and fell. '
      + 'If the question became "how does their combined share of births change", you would switch to stacked area or a streamgraph.';
  return figure(b, cap, W, H);
}

/** 日历热图的映射规则 */
export function calendarMapping(lang) {
  const zh = lang === ZH;
  const W = 560, H = 190;
  let b = '';
  b += `<text class="matrix-head" x="20" y="22">${zh ? '两步映射：先按 7 天折行，再定列' : 'two mappings: wrap every 7 days, then columns'}</text>`;
  const cell = 15, ox = 24, oy = 36, days = 42;
  for (let i = 0; i < days; i++) {
    const col = i % 7, row = Math.floor(i / 7);
    const x = ox + col * (cell + 2), y = oy + row * (cell + 2);
    const t = i / (days - 1);
    const c = `rgb(${Math.round(255 - 175 * t)}, ${Math.round(247 - 187 * t)}, ${Math.round(237 - 177 * t)})`;
    b += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${c}" stroke="#f1f5f9"></rect>`;
  }
  b += `<text class="matrix-tick" x="${ox}" y="${oy + 6 * (cell + 2) + 16}">${zh ? '列 = 星期几；行 = 第几周；颜色 = 数值' : 'column = weekday; row = week; color = value'}</text>`;

  const gran = zh
    ? [
        { t: '年 × 日', d: '365 格 → 看季节性' },
        { t: '月 × 日', d: '约 30 格 → 看周内规律' },
        { t: '周 × 小时', d: '168 格 → 看作息规律' },
      ]
    : [
        { t: 'year × day', d: '365 cells → seasonality' },
        { t: 'month × day', d: '~30 cells → weekly rhythm' },
        { t: 'week × hour', d: '168 cells → daily rhythm' },
      ];
  b += `<text class="matrix-head" x="322" y="22">${zh ? '换粒度 = 换两个轴的含义' : 'change granularity = change both axes'}</text>`;
  gran.forEach((g, i) => {
    const x = 322, y = 34 + i * 46;
    b += `<rect x="${x}" y="${y}" width="216" height="38" rx="7" fill="#fff" stroke="#e2e8f0"></rect>`;
    b += `<rect x="${x}" y="${y}" width="4" height="38" rx="2" fill="#7c3aed"></rect>`;
    b += `<text class="flow-title" x="${x + 14}" y="${y + 17}" font-size="11.5">${esc(g.t)}</text>`;
    b += `<text class="flow-sub" x="${x + 14}" y="${y + 31}" font-size="10">${esc(g.d)}</text>`;
  });
  const cap = zh
    ? '<strong>日历热图的威力全在"两个轴都放时间"。</strong>'
      + '折线图把时间压成一个轴，一周内的规律会被抹平；'
      + '日历热图把"日期"拆成"第几周 + 星期几"两个维度，'
      + '<strong>于是"每周一都特别高"这类周期性一眼就能看出来</strong>。'
      + '代价是格子很小，只适合看模式、不适合读具体数值——所以它旁边总要配色标图例。'
    : '<strong>The power of a calendar heatmap is that both axes carry time.</strong> '
      + 'A line chart collapses time onto one axis and erases weekday patterns; '
      + 'a calendar splits a date into "which week" and "which weekday", '
      + '<strong>making periodicity such as "every Monday is high" visible at a glance</strong>. '
      + 'The price is tiny cells: good for patterns, bad for exact numbers, hence the color legend beside it.';
  return figure(b, cap, W, H);
}

/** 直角坐标 → 极坐标变换 */
export function polarTransform(lang) {
  const zh = lang === ZH;
  const W = 560, H = 206;
  let b = '';
  const ox = 36, oy = 128, w = 180, h = 92;
  b += `<text class="matrix-head" x="${ox}" y="${oy - h - 12}">${zh ? '直角坐标：x 轴一直延伸' : 'Cartesian: x keeps extending'}</text>`;
  b += `<rect x="${ox}" y="${oy - h}" width="${w}" height="${h}" fill="#fff" stroke="#e2e8f0" rx="6"></rect>`;
  b += `<line x1="${ox + 10}" y1="${oy - 6}" x2="${ox + w - 10}" y2="${oy - 6}" stroke="#94a3b8"></line>`;
  b += `<line x1="${ox + 10}" y1="${oy - 6}" x2="${ox + 10}" y2="${oy - h + 10}" stroke="#94a3b8"></line>`;
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const x = ox + 10 + (i / 23) * (w - 20);
    const y = oy - 14 - (26 + 30 * Math.abs(Math.sin(i / 3.3))) * (h / 106);
    pts.push([x, y]);
  }
  b += `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="#2563eb" stroke-width="1.8"></path>`;
  b += `<text class="matrix-tick" x="${ox + w / 2}" y="${oy + 12}" text-anchor="middle">${zh ? '第 1 年到第 N 年' : 'year 1 … year N'}</text>`;

  const cx = 402, cy = 112, R = 70;
  b += `<text class="matrix-head" x="${cx - R}" y="${cy - R - 12}">${zh ? '极坐标：一整圈 = 一个周期' : 'Polar: one turn = one period'}</text>`;
  b += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#e2e8f0"></circle>`;
  let pb = '';
  const turns = 2;
  for (let i = 0; i <= 220; i++) {
    const t = i / 220;
    const ang = t * turns * Math.PI * 2 - Math.PI / 2;
    const r = 8 + t * (R - 14);
    const val = 26 + 30 * Math.abs(Math.sin((t * 24) / 3.3));
    const rr = r * (0.74 + 0.26 * (val / 56));
    pb += (i ? 'L' : 'M') + (cx + Math.cos(ang) * rr).toFixed(1) + ' ' + (cy + Math.sin(ang) * rr).toFixed(1);
  }
  b += `<path d="${pb}" fill="none" stroke="#059669" stroke-width="1.8"></path>`;
  b += `<circle cx="${cx}" cy="${cy}" r="3" fill="#059669"></circle>`;
  b += `<text class="matrix-tick" x="${cx}" y="${cy + R + 18}" text-anchor="middle">${zh ? '半径 = 数值，角度 = 时间' : 'radius = value, angle = time'}</text>`;

  b += `<path class="flow-arrow" d="M 244 112 L 322 112"></path>
        <path class="flow-arrow" d="M 317 107 L 324 112 L 317 117"></path>
        <text class="flow-label" x="283" y="104" text-anchor="middle" font-size="10">${zh ? '卷起来' : 'wrap'}</text>`;
  const cap = zh
    ? '<strong>卷起来的好处：周期性的"头尾相接"。</strong>'
      + '折线图里 12 月的尾巴和次年 1 月的开头相距一整张图，'
      + '螺旋图里它们本来就是相邻的一圈——<strong>年度周期因此在视觉上自然闭合</strong>。'
      + '代价是同一半径上不同圈的数据会重叠，所以 5.4 节要用"透明度 / 颜色随半径变化"来区分圈次。'
    : '<strong>The benefit of wrapping: cycles become head-to-tail.</strong> '
      + 'On a line chart December sits a whole chart away from next January; on a spiral they are neighbouring turns, '
      + '<strong>so the annual cycle closes visually</strong>. '
      + 'The cost is overlap between turns sharing a radius, which is why section 5.4 varies opacity / color with radius.';
  return figure(b, cap, W, H);
}
