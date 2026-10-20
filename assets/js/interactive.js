/* =============================================================
   interactive.js —— 讲解区交互式可视化组件（本次新增）
   -------------------------------------------------------------
   与静态插图的区别：这几个组件**可以动手调**，用「改变一个参数 →
   画面立刻变化」的方式把抽象结论讲清楚。

     1. 视觉通道对比器（第 2 章）—— 同一份数据换成不同通道，看读起来差多少
     2. colormap 选择器（第 3 章）—— 切换 colormap，看同一份数据的呈现
     3. 色觉缺陷模拟器（第 3 章）—— 切换 CVD 类型，看配色是否还能区分
     4. 时间粒度缩放器（第 5 章）—— 拖粒度滑块，看同一份时间序列的不同面貌

   全部用原生 DOM + 内联 SVG 实现，不依赖 d3（讲解区永远可用）。
   ============================================================= */

const ZH = 'zh';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- 颜色工具 ---------- */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
  const f = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}

/** Machado et al. 2009 在 severity = 1.0 时的色觉缺陷模拟矩阵 */
const CVD_MATRICES = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};

function simulateCVD(hex, type) {
  const [r, g, b] = hexToRgb(hex);
  if (type === 'achromatopsia') {
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return rgbToHex(y, y, y);
  }
  const m = CVD_MATRICES[type];
  if (!m) return hex;
  return rgbToHex(
    m[0][0] * r + m[0][1] * g + m[0][2] * b,
    m[1][0] * r + m[1][1] * g + m[1][2] * b,
    m[2][0] * r + m[2][1] * g + m[2][2] * b,
  );
}

/** 感知亮度（用于排序 / 判断"亮度是否单调"） */
function luma(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** 在色标数组上做线性插值取色 */
function rampAt(stops, t) {
  const n = stops.length - 1;
  const x = Math.max(0, Math.min(1, t)) * n;
  const i = Math.min(n - 1, Math.floor(x));
  const f = x - i;
  const a = hexToRgb(stops[i]);
  const b = hexToRgb(stops[i + 1]);
  return rgbToHex(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
}

/* ===============================================================
   组件 1：视觉通道对比器（第 2 章 2.3 视觉映射）
   =============================================================== */
const CHANNEL_DATA = [
  { name: { zh: '计算机', en: 'CS' }, v: 42 },
  { name: { zh: '软件', en: 'SE' }, v: 68 },
  { name: { zh: '数据', en: 'DS' }, v: 35 },
  { name: { zh: '智能', en: 'AI' }, v: 80 },
  { name: { zh: '网络', en: 'Net' }, v: 55 },
  { name: { zh: '电子', en: 'EE' }, v: 62 },
];

function channelHtml(lang) {
  const zh = lang === ZH;
  const chips = zh
    ? [
        { k: 'length', t: '长度（条形图）', tag: '推荐' },
        { k: 'angle', t: '角度（饼图）', tag: '次选' },
        { k: 'area', t: '面积（气泡图）', tag: '偏差大' },
        { k: 'hue', t: '色相（色块图）', tag: '不应编码数值' },
      ]
    : [
        { k: 'length', t: 'Length (bars)', tag: 'recommended' },
        { k: 'angle', t: 'Angle (pie)', tag: 'second best' },
        { k: 'area', t: 'Area (bubbles)', tag: 'large error' },
        { k: 'hue', t: 'Hue (swatches)', tag: 'not for magnitude' },
      ];
  return `
    <h4>${zh ? '动手试：同一份数据换个通道' : 'Try it: same data, different channel'}</h4>
    <div class="controls" data-role="chips">
      ${chips.map((c, i) => `<button class="btn ${i === 0 ? '' : 'btn-ghost'}" type="button" data-ch="${c.k}">${esc(c.t)}</button>`).join('')}
    </div>
    <div data-role="canvas" class="viz-canvas"></div>
    <p class="viz-note" data-role="note"></p>`;
}

function drawChannel(root, lang, kind) {
  const zh = lang === ZH;
  const host = root.querySelector('[data-role="canvas"]');
  const note = root.querySelector('[data-role="note"]');
  const W = 560, H = 190;
  const max = 80;
  const PALETTE = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948'];
  let b = '';
  if (kind === 'length') {
    const BW = 62, GAP = 26, X0 = 30, BASE = H - 34;
    CHANNEL_DATA.forEach((d, i) => {
      const x = X0 + i * (BW + GAP);
      const h = (d.v / max) * 104;
      b += `<rect x="${x}" y="${BASE - h}" width="${BW}" height="${h}" rx="3" fill="#2563eb"></rect>`;
      b += `<text x="${x + BW / 2}" y="${BASE - h - 6}" text-anchor="middle" font-size="11" fill="#1e293b">${d.v}</text>`;
      b += `<text x="${x + BW / 2}" y="${BASE + 16}" text-anchor="middle" font-size="10.5" fill="#475569">${esc(d.name[lang] || d.name.zh)}</text>`;
    });
    b += `<line x1="${X0 - 10}" y1="${BASE}" x2="${W - 20}" y2="${BASE}" stroke="#cbd5e1"></line>`;
  } else if (kind === 'angle') {
    const cx = 150, cy = H / 2, R = 74;
    const total = CHANNEL_DATA.reduce((s, d) => s + d.v, 0);
    let acc = -Math.PI / 2;
    CHANNEL_DATA.forEach((d, i) => {
      const ang = (d.v / total) * Math.PI * 2;
      const x1 = cx + Math.cos(acc) * R, y1 = cy + Math.sin(acc) * R;
      const x2 = cx + Math.cos(acc + ang) * R, y2 = cy + Math.sin(acc + ang) * R;
      const large = ang > Math.PI ? 1 : 0;
      b += `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z"
              fill="${PALETTE[i]}" stroke="#fff" stroke-width="1.5"></path>`;
      const mid = acc + ang / 2;
      b += `<text x="${(cx + Math.cos(mid) * R * 0.66).toFixed(1)}" y="${(cy + Math.sin(mid) * R * 0.66 + 4).toFixed(1)}"
              text-anchor="middle" font-size="10.5" fill="#fff">${d.v}</text>`;
      acc += ang;
    });
    CHANNEL_DATA.forEach((d, i) => {
      const y = 34 + i * 22;
      b += `<rect x="300" y="${y - 10}" width="12" height="12" rx="2" fill="${PALETTE[i]}"></rect>`;
      b += `<text x="320" y="${y}" font-size="11" fill="#334155">${esc(d.name[lang] || d.name.zh)} · ${d.v}</text>`;
    });
  } else if (kind === 'area') {
    CHANNEL_DATA.forEach((d, i) => {
      const r = Math.sqrt(d.v / max) * 42;
      const cx = 70 + (i % 3) * 172, cy = 62 + Math.floor(i / 3) * 82;
      b += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${PALETTE[i]}" opacity="0.72" stroke="#fff" stroke-width="1.5"></circle>`;
      b += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" fill="#1e293b">${d.v}</text>`;
      b += `<text x="${cx}" y="${cy + r + 14}" text-anchor="middle" font-size="10" fill="#64748b">${esc(d.name[lang] || d.name.zh)}</text>`;
    });
  } else {
    const n = CHANNEL_DATA.length;
    const BW = 78, GAP = 12, X0 = 24;
    // 用"色相 = 数值高低"这个错误做法：从蓝到红的连续 ramp
    CHANNEL_DATA.forEach((d, i) => {
      const t = (d.v - 30) / 55;
      const col = rampAt(['#2166ac', '#67a9cf', '#f7f7f7', '#ef8a62', '#b2182b'], t);
      const x = X0 + i * (BW + GAP);
      b += `<rect x="${x}" y="40" width="${BW}" height="76" rx="5" fill="${col}"></rect>`;
      b += `<text x="${x + BW / 2}" y="132" text-anchor="middle" font-size="10.5" fill="#475569">${esc(d.name[lang] || d.name.zh)}</text>`;
      b += `<text x="${x + BW / 2}" y="150" text-anchor="middle" font-size="10" fill="#94a3b8">?</text>`;
    });
    b += `<text x="${X0}" y="28" font-size="10.5" fill="#b91c1c">${zh ? '数值被藏进颜色里——读者无法读出大小，只能猜' : 'values hidden in color — readers can only guess'}</text>`;
  }
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${b}</svg>`;

  const notes = zh
    ? {
        length: '✓ 长度有共同基线，六个值的大小顺序一眼可读——这就是教科书推荐它的原因。',
        angle: '△ 饼图只能看出"谁更大"，很难读出"大多少"：42 与 55 的面积差需要靠角度估。',
        area: '△ 面积按平方根缩放，人的面积感知本身就偏保守，实际读出的差异会被系统性低估。',
        hue: '✕ 色相没有数量含义：读者不知道蓝色代表 42 还是 80，只能去查图例——等于把工作推给读者。',
      }
    : {
        length: '✓ A shared baseline makes the ordering and ratios readable at a glance — that is why it is the recommended default.',
        angle: '△ A pie shows who is bigger but not by how much: distinguishing 42 from 55 means estimating angles.',
        area: '△ Area scales with the square root and area perception is conservative, so differences get systematically underestimated.',
        hue: '✕ Hue carries no magnitude: readers cannot tell whether blue means 42 or 80 without checking the legend — the work moves to the reader.',
      };
  note.textContent = notes[kind] || '';
}

/* ===============================================================
   组件 2：colormap 选择器（第 3 章 3.2）
   =============================================================== */
const COLORMAPS = [
  { k: 'viridis', name: 'viridis', type: { zh: '顺序型', en: 'sequential' }, stops: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'], discrete: false },
  { k: 'plasma', name: 'plasma', type: { zh: '顺序型', en: 'sequential' }, stops: ['#0d0887', '#7e03a8', '#cc4778', '#f89540', '#f0f921'], discrete: false },
  { k: 'inferno', name: 'inferno', type: { zh: '顺序型', en: 'sequential' }, stops: ['#000004', '#420a68', '#932667', '#dd513a', '#fca50a', '#fcffa4'], discrete: false },
  { k: 'turbo', name: 'turbo', type: { zh: '顺序型（彩虹变体）', en: 'sequential (rainbow-like)' }, stops: ['#30123b', '#4145ab', '#4675ed', '#39a2fc', '#1bcfd4', '#a4fc3b', '#f9ba38', '#e95f2b', '#a3160b'], discrete: false },
  { k: 'rdbu', name: 'RdBu', type: { zh: '发散型', en: 'diverging' }, stops: ['#67001f', '#d6604d', '#f7f7f7', '#4393c3', '#053061'], discrete: false },
  { k: 'tableau10', name: 'Tableau10', type: { zh: '定性型', en: 'categorical' }, stops: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac'], discrete: true },
];

/** 10×10 的示例数据：一列平滑渐变 + 一条对角高值带，便于看出 colormap 的差异 */
function sampleGrid() {
  const g = [];
  for (let r = 0; r < 10; r++) {
    const row = [];
    for (let c = 0; c < 10; c++) {
      row.push(Math.min(1, 0.1 + 0.45 * (c / 9) + 0.5 * Math.exp(-Math.pow((r - c) / 2.4, 2))));
    }
    g.push(row);
  }
  return g;
}

function colormapHtml(lang) {
  const zh = lang === ZH;
  return `
    <h4>${zh ? '动手试：换 colormap 看同一份数据' : 'Try it: same data, different colormap'}</h4>
    <div class="controls" data-role="chips">
      ${COLORMAPS.map((c, i) => `<button class="btn ${i === 0 ? '' : 'btn-ghost'}" type="button" data-cm="${c.k}">${esc(c.name)}</button>`).join('')}
    </div>
    <div class="viz-grid-wrap">
      <div data-role="grid" class="viz-canvas"></div>
      <div data-role="bar" class="viz-canvas viz-canvas--bar"></div>
    </div>
    <p class="viz-note" data-role="note"></p>`;
}

function drawColormap(root, lang, key) {
  const zh = lang === ZH;
  const cm = COLORMAPS.find((c) => c.k === key) || COLORMAPS[0];
  const grid = sampleGrid();
  const CELL = 26, PAD = 6;
  const W = PAD * 2 + 10 * CELL, H = PAD * 2 + 10 * CELL;
  let b = '';
  grid.forEach((row, r) => row.forEach((v, c) => {
    const col = cm.discrete
      ? cm.stops[Math.min(cm.stops.length - 1, Math.round(v * (cm.stops.length - 1)))]
      : rampAt(cm.stops, v);
    b += `<rect x="${PAD + c * CELL}" y="${PAD + r * CELL}" width="${CELL}" height="${CELL}" fill="${col}" stroke="#fff" stroke-width="0.6"></rect>`;
  }));
  root.querySelector('[data-role="grid"]').innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${b}</svg>`;

  // 色带 + 刻度
  const BW = 260, BH = 20;
  let bar = '';
  if (cm.discrete) {
    const seg = BW / cm.stops.length;
    cm.stops.forEach((s, i) => { bar += `<rect x="${i * seg}" y="0" width="${seg + 0.5}" height="${BH}" fill="${s}"></rect>`; });
  } else {
    for (let i = 0; i < BW; i++) {
      bar += `<rect x="${i}" y="0" width="1.2" height="${BH}" fill="${rampAt(cm.stops, i / (BW - 1))}"></rect>`;
    }
  }
  bar += `<rect x="0" y="0" width="${BW}" height="${BH}" rx="3" fill="none" stroke="#e2e8f0"></rect>`;
  bar += `<text x="0" y="${BH + 16}" font-size="10" fill="#64748b">${zh ? '低' : 'low'}</text>`;
  bar += `<text x="${BW}" y="${BH + 16}" font-size="10" fill="#64748b" text-anchor="end">${zh ? '高' : 'high'}</text>`;
  // 亮度曲线（判断单调性）
  const LH = 46;
  const ly = 46;
  let path = '';
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const v = cm.discrete ? luma(cm.stops[Math.min(cm.stops.length - 1, Math.round(t * (cm.stops.length - 1)))]) : luma(rampAt(cm.stops, t));
    const x = t * BW;
    const y = ly + LH - (v / 255) * LH;
    path += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  bar += `<path d="${path}" fill="none" stroke="#334155" stroke-width="1.6" transform="translate(0, ${BH + 26})"></path>`;
  bar += `<text x="0" y="${BH + 30}" font-size="9.5" fill="#94a3b8">${zh ? '感知亮度' : 'perceived lightness'}</text>`;
  root.querySelector('[data-role="bar"]').innerHTML =
    `<svg viewBox="0 0 ${BW} ${BH + 26 + LH + 12}" xmlns="http://www.w3.org/2000/svg" role="img">${bar}</svg>`;

  // 亮度走向：折返（方向反转）的次数。顺序型希望 0 次；
  // 发散型因为有中点，折返 1 次恰恰是设计特征。
  let dir = 0, prev = null, monotonic = true, folds = 0;
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const v = cm.discrete
      ? luma(cm.stops[Math.min(cm.stops.length - 1, Math.round(t * (cm.stops.length - 1)))])
      : luma(rampAt(cm.stops, t));
    if (prev !== null) {
      const d = Math.sign(Math.round(v - prev));
      if (d !== 0) {
        if (dir === 0) dir = d;
        else if (d !== dir) { monotonic = false; folds += 1; dir = d; }
      }
    }
    prev = v;
  }
  const lightnessNote = cm.discrete
    ? (zh ? '分类色无亮度序，数值需靠长度 / 位置编码。' : 'categorical maps have no lightness order; encode magnitude with length / position.')
    : monotonic
      ? (zh ? '亮度单调，黑白打印与色觉缺陷下仍可读。' : 'lightness is monotonic, so it survives grayscale and CVD.')
      : (zh ? `亮度折返 ${folds} 次。${cm.k === 'rdbu' ? '发散型的中点就在折返处，这是设计特征。' : '顺序型出现折返会让读者把中间误读成极值，建议换 viridis 一类。'}`
          : `lightness folds ${folds}×. ${cm.k === 'rdbu' ? 'The midpoint sits at the fold — expected for diverging.' : 'Folds in a sequential map read as spurious extremes; prefer viridis-like maps.'}`);
  const notes = zh
    ? {
        sequential: `✓ 顺序型：适合“越大越深”的连续数值。`,
        diverging: `✓ 发散型：有中点（0 / 均值）时才用；两端对称、中间接近白色。`,
        categorical: `△ 定性型：只表示类别，不表示大小。`,
      }
    : {
        sequential: '✓ Sequential: for continuous magnitude.',
        diverging: '✓ Diverging: only when a meaningful midpoint exists (zero, or a mean).',
        categorical: '△ Categorical: encodes identity only.',
      };
  const noteEl = root.querySelector('[data-role="note"]');
  const baseNote = notes[cm.k === 'rdbu' ? 'diverging' : cm.discrete ? 'categorical' : 'sequential'];
  noteEl.textContent = `${baseNote}${lightnessNote}`;
  noteEl.dataset.cm = cm.name;
}

/* ===============================================================
   组件 3：色觉缺陷模拟器（第 3 章 3.8）
   =============================================================== */
const CVD_TYPES = [
  { k: 'normal', name: { zh: '正常视觉', en: 'Normal vision' }, pct: '—' },
  { k: 'deuteranopia', name: { zh: '绿色盲 Deuteranopia', en: 'Deuteranopia' }, pct: '≈6% 男性' },
  { k: 'protanopia', name: { zh: '红色盲 Protanopia', en: 'Protanopia' }, pct: '≈1% 男性' },
  { k: 'tritanopia', name: { zh: '蓝黄色盲 Tritanopia', en: 'Tritanopia' }, pct: '≈0.01%' },
  { k: 'achromatopsia', name: { zh: '全色盲 Achromatopsia', en: 'Achromatopsia' }, pct: '罕见' },
];

/** 两组用于检验的配色：一组"危险"，一组"安全" */
const CVD_SETS = {
  risky: {
    label: { zh: '常见但危险的配色（红 / 绿 / 橙）', en: 'Common but risky (red / green / orange)' },
    colors: ['#e15759', '#59a14f', '#f28e2b', '#4e79a7'],
  },
  safe: {
    label: { zh: '更稳妥的配色（同色相变明暗）', en: 'Safer (one hue, varied lightness)' },
    colors: ['#1e3a8a', '#3b82f6', '#93c5fd', '#dbeafe'],
  },
};

function cvdHtml(lang) {
  const zh = lang === ZH;
  return `
    <h4>${zh ? '动手试：你的配色在色觉缺陷者眼里是什么样' : 'Try it: how your palette looks with color-vision deficiency'}</h4>
    <div class="controls" data-role="setchips">
      ${Object.entries(CVD_SETS).map(([k, s], i) =>
        `<button class="btn ${i === 0 ? '' : 'btn-ghost'}" type="button" data-set="${k}">${esc(s.label[lang] || s.label.zh)}</button>`).join('')}
    </div>
    <div class="controls" data-role="cvdchips">
      ${CVD_TYPES.map((t, i) =>
        `<button class="btn ${i === 0 ? '' : 'btn-ghost'}" type="button" data-cvd="${t.k}">${esc(t.name[lang] || t.name.zh)}</button>`).join('')}
    </div>
    <div data-role="sim" class="viz-canvas"></div>
    <p class="viz-note" data-role="note"></p>`;
}

function drawCVD(root, lang, setKey, typeKey) {
  const zh = lang === ZH;
  const set = CVD_SETS[setKey] || CVD_SETS.risky;
  const type = typeKey || 'normal';
  const W = 560, H = 168;
  const BW = 118, BH = 84, GAP = 16, X0 = 18;
  let b = '';
  b += `<text x="${X0}" y="18" font-size="10.5" fill="#64748b">${zh ? `原始配色（${esc(set.label.zh)}）` : `original palette (${esc(set.label.en)})`}</text>`;
  set.colors.forEach((c, i) => {
    const x = X0 + i * (BW + GAP);
    b += `<rect x="${x}" y="26" width="${BW}" height="42" rx="5" fill="${c}"></rect>`;
    b += `<text x="${x + 6}" y="52" font-size="10" fill="#fff" opacity="0.9">${esc(c)}</text>`;
  });
  b += `<text x="${X0}" y="94" font-size="10.5" fill="#64748b">${zh ? `模拟后（${esc(CVD_TYPES.find((t) => t.k === type).name.zh)}）` : `simulated (${esc(CVD_TYPES.find((t) => t.k === type).name.en)})`}</text>`;
  const sims = set.colors.map((c) => (type === 'normal' ? c : simulateCVD(c, type)));
  sims.forEach((c, i) => {
    const x = X0 + i * (BW + GAP);
    b += `<rect x="${x}" y="102" width="${BW}" height="42" rx="5" fill="${c}"></rect>`;
  });
  // 相邻色块的感知色差（用亮度差近似提示）
  let minGap = 255;
  for (let i = 1; i < sims.length; i++) {
    const d = Math.abs(luma(sims[i]) - luma(sims[i - 1]));
    minGap = Math.min(minGap, d);
  }
  b += `<text x="${W - 12}" y="${H - 6}" text-anchor="end" font-size="10" fill="${minGap < 22 ? '#b91c1c' : '#047857'}">
    ${zh ? '相邻色块最小亮度差' : 'min lightness gap'}: ${minGap.toFixed(0)}${minGap < 22 ? (zh ? ' ← 偏小，可能分不清' : ' ← too small') : (zh ? ' ← 尚可' : ' ← OK')}
  </text>`;
  root.querySelector('[data-role="sim"]').innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${b}</svg>`;

  const notes = zh
    ? {
        normal: '这是原始配色。点上面的按钮切换不同类型的色觉缺陷，看第二行色块是否还能互相区分。',
        deuteranopia: '绿/红/橙 三色在绿色盲眼里会明显靠近——如果它们编码不同类别，读者就分不出来了。',
        protanopia: '红色会被压暗、绿色相对变亮，红色的"强调感"消失，这也是红色不适合做"唯一警示色"的原因。',
        tritanopia: '蓝黄轴受影响：蓝色与绿色可能互换明暗关系；这种情况相对少见但代价高。',
        achromatopsia: '只剩亮度的世界里，配色必须靠"明暗差"来区分——这正是"亮度要单调"这条规则的价值。',
      }
    : {
        normal: 'This is the original palette. Switch the deficiency type above and watch whether the second row stays distinguishable.',
        deuteranopia: 'Green, red and orange collapse toward each other — if they encode different categories, readers cannot separate them.',
        protanopia: 'Red darkens and green lightens, so red loses its "urgency" — one reason red should not be the only warning color.',
        tritanopia: 'The blue–yellow axis is affected: blue and green may swap lightness. Rare, but costly when it happens.',
        achromatopsia: 'With lightness only, a palette must be separated by brightness — exactly the value of the "monotonic lightness" rule.',
      };
  root.querySelector('[data-role="note"]').textContent = notes[type] || '';
}

/* ===============================================================
   组件 4：时间粒度缩放器（第 5 章 5.3）
   =============================================================== */
/** 合成一年的日数据：缓慢季节趋势 + 周内规律 + 少量噪声 */
function yearSeries() {
  const out = [];
  for (let d = 0; d < 365; d++) {
    const season = 40 + 28 * Math.sin((d / 365) * Math.PI * 2 - 1.1);
    const weekday = d % 7 < 5 ? 8 : -6;
    const noise = 4 * Math.sin(d / 3.1);
    out.push(Math.max(2, season + weekday + noise));
  }
  return out;
}

const GRANULARITIES = [
  { k: 'day', label: { zh: '按日（365 点）', en: 'daily (365 points)' }, n: 365,
    hint: { zh: '看到噪声最多的一层：周末低谷清晰，但整体趋势被抖动淹没', en: 'the noisiest layer: weekend dips are clear but the trend is buried' } },
  { k: 'week', label: { zh: '按周（约 52 点）', en: 'weekly (~52 points)' }, n: 52,
    hint: { zh: '周末效应被平均掉，季节趋势开始显现——多数分析的合适粒度', en: 'weekend effect averages out and the seasonal trend appears — the sweet spot for most analysis' } },
  { k: 'month', label: { zh: '按月（12 点）', en: 'monthly (12 points)' }, n: 12,
    hint: { zh: '趋势最清楚，但代价是只剩 12 个点：年初的波动已经看不到了', en: 'the trend is clearest, but only 12 points remain — early-year swings vanish' } },
];

function timeHtml(lang) {
  const zh = lang === ZH;
  return `
    <h4>${zh ? '动手试：同一份时间序列换粒度' : 'Try it: same series, different granularity'}</h4>
    <div class="controls" data-role="gchips">
      ${GRANULARITIES.map((g, i) => `<button class="btn ${i === 0 ? '' : 'btn-ghost'}" type="button" data-g="${g.k}">${esc(g.label[lang] || g.label.zh)}</button>`).join('')}
    </div>
    <div data-role="chart" class="viz-canvas"></div>
    <p class="viz-note" data-role="note"></p>`;
}

function drawTime(root, lang, key) {
  const zh = lang === ZH;
  const g = GRANULARITIES.find((x) => x.k === key) || GRANULARITIES[0];
  const raw = yearSeries();
  const step = raw.length / g.n;
  const agg = [];
  for (let i = 0; i < g.n; i++) {
    const seg = raw.slice(Math.floor(i * step), Math.max(Math.floor(i * step) + 1, Math.floor((i + 1) * step)));
    agg.push(seg.reduce((a, b) => a + b, 0) / seg.length);
  }
  const W = 560, H = 190, PADL = 44, PADR = 16, PADT = 20, PADB = 34;
  const lo = Math.min(...agg, ...raw) - 4;
  const hi = Math.max(...agg, ...raw) + 4;
  const px = (i, n) => PADL + (i * (W - PADL - PADR)) / Math.max(1, n - 1);
  const py = (v) => PADT + (1 - (v - lo) / (hi - lo)) * (H - PADT - PADB);
  let b = '';
  // 网格
  for (let i = 0; i <= 4; i++) {
    const v = lo + ((hi - lo) * i) / 4;
    const y = py(v);
    b += `<line x1="${PADL}" y1="${y.toFixed(1)}" x2="${W - PADR}" y2="${y.toFixed(1)}" stroke="#f1f5f9"></line>`;
    b += `<text x="${PADL - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9.5" fill="#94a3b8">${v.toFixed(0)}</text>`;
  }
  // 原始日数据（淡色作背景参照）
  b += `<path d="${raw.map((v, i) => (i ? 'L' : 'M') + px(i, 365).toFixed(1) + ' ' + py(v).toFixed(1)).join(' ')}"
          fill="none" stroke="#cbd5e1" stroke-width="1"></path>`;
  // 当前粒度
  b += `<path d="${agg.map((v, i) => (i ? 'L' : 'M') + px(i, agg.length).toFixed(1) + ' ' + py(v).toFixed(1)).join(' ')}"
          fill="none" stroke="#4338ca" stroke-width="2.2"></path>`;
  agg.forEach((v, i) => {
    if (agg.length <= 60) b += `<circle cx="${px(i, agg.length).toFixed(1)}" cy="${py(v).toFixed(1)}" r="2.6" fill="#4338ca"></circle>`;
  });
  b += `<line x1="${PADL}" y1="${H - PADB}" x2="${W - PADR}" y2="${H - PADB}" stroke="#cbd5e1"></line>`;
  b += `<text x="${PADL}" y="${H - 12}" font-size="10" fill="#64748b">${zh ? '1 月' : 'Jan'}</text>`;
  b += `<text x="${W - PADR}" y="${H - 12}" font-size="10" fill="#64748b" text-anchor="end">${zh ? '12 月' : 'Dec'}</text>`;
  b += `<text x="${PADL + 6}" y="${PADT + 12}" font-size="10" fill="#94a3b8">${zh ? '灰线 = 原始日数据（参照）' : 'grey = raw daily data'}</text>`;
  root.querySelector('[data-role="chart"]').innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${b}</svg>`;
  root.querySelector('[data-role="note"]').textContent = g.hint[lang] || g.hint.zh;
}

/* ===============================================================
   挂载入口
   =============================================================== */
const SPECS = {
  'ch-2-3': {
    html: channelHtml,
    init: (root, lang) => {
      const chips = root.querySelector('[data-role="chips"]');
      chips.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-ch]');
        if (!btn) return;
        chips.querySelectorAll('button').forEach((x) => {
          const on = x === btn;
          x.classList.toggle('btn', on);
          x.classList.toggle('btn-ghost', !on);
        });
        drawChannel(root, lang, btn.dataset.ch);
      });
      drawChannel(root, lang, 'length');
    },
  },
  'ch-3-2': {
    html: colormapHtml,
    init: (root, lang) => {
      const chips = root.querySelector('[data-role="chips"]');
      chips.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-cm]');
        if (!btn) return;
        chips.querySelectorAll('button').forEach((x) => {
          const on = x === btn;
          x.classList.toggle('btn', on);
          x.classList.toggle('btn-ghost', !on);
        });
        drawColormap(root, lang, btn.dataset.cm);
      });
      drawColormap(root, lang, 'viridis');
    },
  },
  'ch-3-8': {
    html: cvdHtml,
    init: (root, lang) => {
      let setKey = 'risky';
      let typeKey = 'normal';
      const setChips = root.querySelector('[data-role="setchips"]');
      const cvdChips = root.querySelector('[data-role="cvdchips"]');
      const toggle = (group, btn) => group.querySelectorAll('button').forEach((x) => {
        const on = x === btn;
        x.classList.toggle('btn', on);
        x.classList.toggle('btn-ghost', !on);
      });
      setChips.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-set]');
        if (!btn) return;
        toggle(setChips, btn);
        setKey = btn.dataset.set;
        drawCVD(root, lang, setKey, typeKey);
      });
      cvdChips.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-cvd]');
        if (!btn) return;
        toggle(cvdChips, btn);
        typeKey = btn.dataset.cvd;
        drawCVD(root, lang, setKey, typeKey);
      });
      drawCVD(root, lang, setKey, typeKey);
    },
  },
  'ch-5-3': {
    html: timeHtml,
    init: (root, lang) => {
      const chips = root.querySelector('[data-role="gchips"]');
      chips.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-g]');
        if (!btn) return;
        chips.querySelectorAll('button').forEach((x) => {
          const on = x === btn;
          x.classList.toggle('btn', on);
          x.classList.toggle('btn-ghost', !on);
        });
        drawTime(root, lang, btn.dataset.g);
      });
      drawTime(root, lang, 'day');
    },
  },
};

export const hasInteractive = (sectionId) => Object.prototype.hasOwnProperty.call(SPECS, sectionId);

/** 把交互组件插到该小节「讲解」面板的最前面（比插图更靠前，便于上手试） */
export function mountInteractive(article, sectionId, lang) {
  const spec = SPECS[sectionId];
  if (!spec) return;
  const panel = article.querySelector('.tab-panel[data-panel="explain"]');
  if (!panel || panel.querySelector('.viz-interactive')) return;
  const host = document.createElement('div');
  host.className = 'viz-interactive';
  host.innerHTML = `${spec.html(lang)}<p class="viz-src">${
    lang === ZH
      ? '配色模拟依据 Machado et al. 2009 的色觉缺陷模型（severity = 1.0）；colormap 色标取自 matplotlib / ColorBrewer。'
      : 'Simulation follows Machado et al. 2009 (severity = 1.0); colormap stops from matplotlib / ColorBrewer.'
  }</p>`;
  const firstHeading = panel.querySelector('h3');
  if (firstHeading) panel.insertBefore(host, firstHeading);
  else panel.prepend(host);
  try {
    spec.init(host, lang);
  } catch (e) {
    console.error('[interactive ' + sectionId + ']', e);
    host.insertAdjacentHTML('beforeend', '<p class="demo-hint">△ 交互组件初始化失败</p>');
  }
}
