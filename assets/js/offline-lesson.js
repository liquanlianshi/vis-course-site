/* 本文件由 build/make_offline.py 生成：lesson 入口。不要手改。 */
(function () {
  'use strict';
  var VIS = window.VIS = window.VIS || {};
  var __VIS_SCRIPT_URL = document.currentScript ? document.currentScript.src : document.baseURI;
(function () {
// lesson-01 —— 各小节「演示」tab 的实现（由原 lesson.js 迁移，已抽出公共样板）
// 每个 demo 接收挂载元素 mount，向其注入 HTML 并用 d3 绘制。

// lesson.js —— Doc-01 集成教学页面交互逻辑
// 1) 章节切换  2) Tab 切换  3) Demo 注入

// d3 由 index.html 通过本地 vendor/d3.v7.min.js 预先加载到 window.d3（离线可用）
const d3 = window.d3;
const demos = {};
// ---------- 3.1 数据加载演示 ----------
demos["d-3-1"] = async (mount) => {
  mount.innerHTML = `
    <div class="console" id="d-3-1-log">加载中...</div>
    <h4>转换后数据（前 10 行）</h4>
    <div id="d-3-1-table"></div>
    <h4>字段映射</h4>
    <table class="theory-table">
      <thead><tr><th>CSV 中文</th><th>JS 变量</th><th>类型</th></tr></thead>
      <tbody>
          <tr><td>序号</td><td>id</td><td>Number</td></tr>
          <tr><td>姓名</td><td>name</td><td>String</td></tr>
          <tr><td>生日</td><td>birthday</td><td>Date</td></tr>
          <tr><td>年龄</td><td>age</td><td>Number</td></tr>
          <tr><td>班级</td><td>class</td><td>String</td></tr>
        </tbody>
    </table>
    <button id="d-3-1-reload" class="demo-btn">重新加载</button>
  `;
  const log = (msg) => {
    const el = document.getElementById("d-3-1-log");
    if (el) el.textContent += "\n" + msg;
  };
  const run = async () => {
    const el = document.getElementById("d-3-1-log");
    if (el) el.textContent = "⏳ 加载 ./data/newstudent.csv...";
    function transformRow(d) {
      return {
        id:       +d["序号"],
        name:     d["姓名"].trim(),
        gender:   d["性别"].trim(),
        birthday: new Date(d["生日"]),
        age:      +d["年龄"],
        class:    d["班级"].trim(),
      };
    }
    const data = await d3.csv("./data/newstudent.csv", transformRow);
    log(`✓ 共 ${data.length} 条`);
    log("【类型验证】");
    log(`typeof data[0].age  →  ${typeof data[0].age}`);
    log(`data[0].birthday instanceof Date  →  ${data[0].birthday instanceof Date}`);
    log(`data[0].age + 1  →  ${data[0].age + 1}（Number 可计算）`);
    log("");
    log("【前 3 条】");
    log(JSON.stringify(data.slice(0, 3).map(d => ({
      ...d, birthday: d.birthday.toISOString().slice(0, 10)
    })), null, 2));

    const tbl = document.getElementById("d-3-1-table");
    tbl.innerHTML = `<table class="theory-table">
      <thead><tr><th>id</th><th>name</th><th>gender</th><th>birthday</th><th>age</th><th>class</th></tr></thead>
      <tbody>${data.slice(0, 10).map(d => `<tr>
        <td>${d.id}</td><td>${d.name}</td><td>${d.gender}</td>
        <td>${d.birthday.toISOString().slice(0, 10)}</td>
        <td>${d.age}</td><td>${d.class}</td>
      </tr>`).join("")}</tbody>
    </table>`;
  };
  document.getElementById("d-3-1-reload").addEventListener("click", run);
  await run();
};

// ---------- 3.2 DIKW 金字塔 ----------
demos["d-3-2"] = (mount) => {
  const W = 600, H = 360, cx = W / 2;
  const LAYERS = [
    { name: "Wisdom",   cn: "智慧", color: "#9333ea", h: 60, topW: 60,
      desc: "运用知识做出明智判断与战略决策。回答「为什么」与「应该怎么做」。",
      viz: "战略仪表盘、决策树" },
    { name: "Knowledge", cn: "知识", color: "#0891b2", h: 80, topW: 90,
      desc: "对信息的进一步提炼和理解，形成模式、规律、关联。回答「如何」。",
      viz: "统计模型、机器学习预测" },
    { name: "Information", cn: "信息", color: "#059669", h: 100, topW: 120,
      desc: "经过处理、组织、赋予上下文的数据。回答「谁、什么、何时、何地」。",
      viz: "折线图、柱状图、热力图" },
    { name: "Data", cn: "数据", color: "#64748b", h: 120, topW: 150,
      desc: "原始、离散的观察结果，缺乏上下文与意义。",
      viz: "原始表格、CSV 文件" },
  ];
  mount.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div><div id="d-3-2-svg"></div></div>
      <div id="d-3-2-detail" class="demo-detail">← 点击金字塔任意层</div>
    </div>
  `;
  const svg = d3.select("#d-3-2-svg").append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("style", "max-width:600px;");
  LAYERS.forEach((layer, i) => {
    const botW = layer.topW + 60;
    const yTop = 20 + i * 80;
    const yBot = yTop + layer.h;
    const path = `M ${cx - layer.topW / 2} ${yTop}
      L ${cx + layer.topW / 2} ${yTop}
      L ${cx + botW / 2} ${yBot}
      L ${cx - botW / 2} ${yBot} Z`;
    const g = svg.append("g").style("cursor", "pointer")
      .on("mouseover", function () {
        d3.select(this).select("path").transition().duration(150)
          .attr("fill", d3.color(layer.color).brighter(0.5));
      })
      .on("mouseout", function () {
        d3.select(this).select("path").transition().duration(150)
          .attr("fill", layer.color);
      })
      .on("click", () => {
        document.getElementById("d-3-2-detail").innerHTML = `
          <h4 style="color:${layer.color}">${layer.cn}（${layer.name}）</h4>
          <p>${layer.desc}</p>
          <p><strong>典型可视化：</strong>${layer.viz}</p>`;
      });
    g.append("path").attr("d", path)
      .attr("fill", layer.color).attr("stroke", "white").attr("stroke-width", 2);
    g.append("text").attr("x", cx).attr("y", (yTop + yBot) / 2)
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .attr("fill", "white").attr("font-size", 16).attr("font-weight", 600)
      .text(`${layer.cn} · ${layer.name}`);
  });
};

// ---------- 3.3 属性 × 视觉通道 ----------
demos["d-3-3"] = (mount) => {
  const DATA = [
    { name: "张三", major: "软件工程", classNo: 1, age: 18 },
    { name: "李四", major: "软件工程", classNo: 1, age: 19 },
    { name: "王五", major: "软件工程", classNo: 2, age: 20 },
    { name: "赵六", major: "软件工程", classNo: 2, age: 17 },
    { name: "孙七", major: "数据科学", classNo: 1, age: 21 },
    { name: "周八", major: "数据科学", classNo: 1, age: 22 },
    { name: "吴九", major: "数据科学", classNo: 2, age: 19 },
  ];
  mount.innerHTML = `
    <div class="demo-sub">
      <h4>3.3.1 类别 → 色相（✓ 正确）</h4>
      <svg id="d-3-3-cat" style="width:100%; height:140px;"></svg>
    </div>
    <div class="demo-sub">
      <h4>3.3.2 序数 → 亮度（✓ 正确）</h4>
      <svg id="d-3-3-ord" style="width:100%; height:80px;"></svg>
    </div>
    <div class="demo-sub">
      <h4>3.3.3 数值 → 位置（✓ 正确）</h4>
      <svg id="d-3-3-num" style="width:100%; height:160px;"></svg>
    </div>
    <div class="demo-sub">
      <h4>3.3.4 ✕ 数值 → 色相（错配，看不出大小）</h4>
      <svg id="d-3-3-bad" style="width:100%; height:160px;"></svg>
    </div>
  `;
  // 类别 → 色相
  {
    const svg = d3.select("#d-3-3-cat");
    const W = 600, H = 140;
    svg.attr("viewBox", `0 0 ${W} ${H}`);
    const majors = [...new Set(DATA.map(d => d.major))];
    const color = d3.scaleOrdinal().domain(majors).range(d3.schemeTableau10);
    const x = d3.scaleBand().domain(DATA.map(d => d.name)).range([40, W - 20]).padding(0.3);
    svg.selectAll("rect").data(DATA).join("rect")
      .attr("x", d => x(d.name)).attr("y", 20).attr("width", x.bandwidth()).attr("height", 50)
      .attr("fill", d => color(d.major));
    svg.selectAll("text").data(DATA).join("text")
      .attr("x", d => x(d.name) + x.bandwidth() / 2).attr("y", 90)
      .attr("text-anchor", "middle").attr("font-size", 11).text(d => d.name);
  }
  // 序数 → 亮度
  {
    const svg = d3.select("#d-3-3-ord");
    const W = 600, H = 80;
    svg.attr("viewBox", `0 0 ${W} ${H}`);
    const levels = [1, 2, 3, 4, 5];
    const x = d3.scaleBand().domain(levels).range([40, W - 20]).padding(0.2);
    const brightness = d3.scaleLinear().domain([1, 5]).range(["#f1f5f9", "#0f172a"]);
    svg.selectAll("rect").data(levels).join("rect")
      .attr("x", d => x(d)).attr("y", 10).attr("width", x.bandwidth()).attr("height", 40)
      .attr("fill", d => brightness(d));
  }
  // 数值 → 位置
  {
    const svg = d3.select("#d-3-3-num");
    const W = 600, H = 160;
    svg.attr("viewBox", `0 0 ${W} ${H}`);
    const x = d3.scaleLinear().domain(d3.extent(DATA, d => d.age)).range([60, W - 20]);
    const y = d3.scaleBand().domain(DATA.map(d => d.name)).range([10, H - 40]).padding(0.3);
    svg.append("g").attr("transform", `translate(0, ${H - 30})`).call(d3.axisBottom(x).ticks(5));
    svg.selectAll("circle").data(DATA).join("circle")
      .attr("cx", d => x(d.age)).attr("cy", d => y(d.name) + y.bandwidth() / 2).attr("r", 7)
      .attr("fill", "#2563eb");
    svg.selectAll("text").data(DATA).join("text")
      .attr("x", 55).attr("y", d => y(d.name) + y.bandwidth() / 2 + 4)
      .attr("text-anchor", "end").attr("font-size", 11).text(d => d.name);
  }
  // 错配
  {
    const svg = d3.select("#d-3-3-bad");
    const W = 600, H = 160;
    svg.attr("viewBox", `0 0 ${W} ${H}`);
    const x = d3.scaleBand().domain(DATA.map(d => d.name)).range([40, W - 20]).padding(0.3);
    const hue = d3.scaleSequential(d3.interpolateRainbow).domain(d3.extent(DATA, d => d.age));
    svg.selectAll("rect").data(DATA).join("rect")
      .attr("x", d => x(d.name)).attr("y", 10).attr("width", x.bandwidth()).attr("height", 50)
      .attr("fill", d => hue(d.age));
    svg.selectAll("text").data(DATA).join("text")
      .attr("x", d => x(d.name) + x.bandwidth() / 2).attr("y", 80)
      .attr("text-anchor", "middle").attr("font-size", 11).text(d => `${d.name}（${d.age}）`);
  }
};

// ---------- 3.4 D3 8 个数组函数 ----------
demos["d-3-4"] = (mount) => {
  mount.innerHTML = `
    <div class="controls">
      <label>函数：
        <select id="d-3-4-sel">
          <option value="map">map</option>
          <option value="reduce">reduce</option>
          <option value="cross">cross</option>
          <option value="merge">merge</option>
          <option value="pairs">pairs</option>
          <option value="transpose">transpose</option>
          <option value="zip">zip</option>
          <option value="filter">filter</option>
          <option value="group">group ★</option>
          <option value="rollup">rollup ★</option>
        </select>
      </label>
    </div>
    <div id="d-3-4-out"></div>
  `;
  const SPECS = {
    map: { in: [1, 2, 3, 4], fn: () => d3.map([1,2,3,4], x => x * x), hint: "把每个元素平方" },
    reduce: { in: [1, 2, 3, 4], fn: () => d3.reduce([1,2,3,4], (a, b) => a + b, 0), hint: "求和" },
    cross: { in: ['A','B','C'], fn: () => d3.cross(['A','B'], [1,2]), hint: "笛卡尔积" },
    merge: { in: [[1,2],[3,4]], fn: () => d3.merge([[1,2],[3,4],[5]]), hint: "扁平合并" },
    pairs: { in: [1,2,3,4], fn: () => d3.pairs([1,2,3,4]), hint: "相邻元素对" },
    transpose: { in: [[1,2,3],[4,5,6]], fn: () => d3.transpose([[1,2,3],[4,5,6]]), hint: "矩阵转置" },
    zip: { in: [['A','B','C'],[1,2,3]], fn: () => d3.zip(['A','B','C'],[1,2,3]), hint: "按位合并" },
    filter: { in: [1,2,3,4,5], fn: () => d3.filter([1,2,3,4,5], x => x > 2), hint: "保留 > 2 的" },
    group: { in: null, fn: () => {
      const data = [{c:'1班',n:1},{c:'1班',n:2},{c:'2班',n:3},{c:'2班',n:4}];
      return d3.group(data, d => d.c);
    }, hint: "按班级分组（保留所有元素）" },
    rollup: { in: null, fn: () => {
      const data = [{c:'1班',n:1},{c:'1班',n:2},{c:'2班',n:3},{c:'2班',n:4}];
      return d3.rollup(data, v => v.length, d => d.c);
    }, hint: "按班级聚合（每班人数）" },
  };
  const render = (name) => {
    const s = SPECS[name];
    const out = s.fn();
    document.getElementById("d-3-4-out").innerHTML = `
      <p><strong>${name}</strong> —— ${s.hint}</p>
      <div class="console">输入：${JSON.stringify(s.in)}
输出：${JSON.stringify([...out], null, 2)}</div>`;
  };
  document.getElementById("d-3-4-sel").addEventListener("change", e => render(e.target.value));
  render("map");
};

// ---------- 3.5 Selection 三态 ----------
demos["d-3-5"] = (mount) => {
  mount.innerHTML = `
    <div class="controls">
      <button id="d-3-5-add" class="demo-btn">+ 添加</button>
      <button id="d-3-5-update" class="demo-btn">⇆ 更新</button>
      <button id="d-3-5-remove" class="demo-btn">− 删除</button>
      <button id="d-3-5-reset" class="demo-btn">重置</button>
    </div>
    <p>当前数据：<code id="d-3-5-state">[1, 2, 3]</code></p>
    <svg id="d-3-5-svg" style="width:100%; height:140px;"></svg>
    <p class="demo-legend">
      <span style="color:#10b981">●</span> enter（绿）
      <span style="color:#0ea5e9">●</span> update（蓝）
      <span style="color:#ef4444">●</span> exit（红）
    </p>
  `;
  const svg = d3.select("#d-3-5-svg");
  const W = 700, H = 140;
  svg.attr("viewBox", `0 0 ${W} ${H}`);
  let data = [1, 2, 3];
  const render = () => {
    svg.selectAll("circle").data(data, d => d).join(
      enter => enter.append("circle")
        .attr("cx", d => d * 70 + 60).attr("cy", H / 2).attr("r", 0)
        .attr("fill", "#10b981")
        .call(s => s.transition().duration(400).attr("r", 24)),
      update => update.attr("fill", "#0ea5e9")
        .call(s => s.transition().duration(400)
          .attr("cx", d => d * 70 + 60).attr("r", 24)),
      exit => exit.attr("fill", "#ef4444")
        .call(s => s.transition().duration(400).attr("r", 0).remove())
    );
    document.getElementById("d-3-5-state").textContent = "[" + data.join(", ") + "]";
  };
  document.getElementById("d-3-5-add").onclick = () => { data = [...data, data.length + 1]; render(); };
  document.getElementById("d-3-5-update").onclick = () => { data = data.map(d => d + 0.5); render(); };
  document.getElementById("d-3-5-remove").onclick = () => { data = data.slice(0, -1); render(); };
  document.getElementById("d-3-5-reset").onclick = () => { data = [1, 2, 3]; render(); };
  render();
};


VIS['demos/lesson-01'] = { demos: demos };
})();

(function () {
// lesson-02 —— 各小节「演示」tab 的实现（由原 lesson.js 迁移，已抽出公共样板）
// 每个 demo 接收挂载元素 mount，向其注入 HTML 并用 d3 绘制。

// lesson.js —— Doc-02 集成教学页面交互逻辑
// 1) 章节切换  2) Tab 切换  3) 4 个 Demo 注入

// d3 由 index.html 通过本地 vendor/d3.v7.min.js 预先加载到 window.d3（离线可用）
const d3 = window.d3;

// =============================================================
// 数据加载辅助函数（修复 loadStudents 未定义 bug · 2026-09-09）
// =============================================================
async function loadStudents() {
  return await d3.csv("./data/newstudent.csv", d => {
    const cls = d["班级"].trim();
    return {
      id:       +d["序号"],
      name:     d["姓名"].trim(),
      gender:   d["性别"].trim(),
      birthday: d["生日"].trim(),
      age:      +d["年龄"],
      class:    cls,
      hometown: d["籍贯"].trim(),
      nation:   d["民族"].trim(),
      // 从班级提取专业（"软件工程1班" → "软件工程"），用于 d-4-2/4-3/4-4 rollup 分组
      major:    cls.replace(/[\d班]+$/, "").trim(),
    };
  });
}


const demos = {};
// ---------- 4.1 流程概念图（Card / Mackinlay / van Wijk） ----------
demos["d-4-1"] = (mount) => {
  mount.innerHTML = `
    <div class="controls">
      <span style="font-size:13px;color:#475569;"> 点击任一节点查看该步骤在三个理论中的对应关系</span>
    </div>
    <svg class="flow-svg" id="d-4-1-svg" viewBox="0 0 920 200"></svg>
    <div class="flow-detail" id="d-4-1-detail">点击上方任一节点（Card 1999 / Mackinlay 1986 / van Wijk 的对应）→</div>
  `;

  const nodes = [
    { id: "data",  label: "① 原始数据",
      c: "#3b82f6",
      detail: "<strong>Card 1999 模型：原始数据 (Raw Data)</strong> —— 一切可视化的起点。<br>" +
              "<strong>Mackinlay 1986：</strong> 无需变换，直接进入 mapping pipeline。<br>" +
              "<strong>van Wijk：</strong> 这是用户最直接看到的「数据集」，通常是 DBMS 表 / CSV / JSON。<br>" +
              "<em>本节课例子：newstudent.csv（80 条 2025 级新生）</em>"
    },
    { id: "tform", label: "② 数据变换",
      c: "#a855f7",
      detail: "<strong>Card 1999：</strong>派生数据 (Derived Data) —— filter / sort / group / derive / aggregate。<br>" +
              "<strong>关键：</strong>D3 的 d3.rollup、d3.group 全部是这一层的实现。<br>" +
              "<strong>van Wijk：</strong>数据到视图的「Transformations」，决定接下来能看到什么。<br>" +
              "<em>例子：80 条 → 按「专业 → 班级」聚合 → 班级学生人数</em>"
    },
    { id: "map",   label: "③ 视觉映射",
      c: "#f59e0b",
      detail: "<strong>Card 1999：</strong>可视化结构 (Visualization Mapping)，D → T → V。<br>" +
              "<strong>Mackinlay 1986：</strong>自动化准则 —— 数值属性最佳通道是位置（位置量化误差最小），类别属性最佳通道是色调。<br>" +
              "<strong>关键决策：</strong>把「年龄」映射到位置（X）、把「性别」映射到颜色（hue）。<br>" +
              "<em>本节课例子：d3.scaleLinear(x) + d3.scaleOrdinal(colors)</em>"
    },
    { id: "view",  label: "④ 视图渲染",
      c: "#10b981",
      detail: "<strong>Card 1999：</strong>视图变换 (View Transformation)，C → L → S 三层。<br>" +
              "· <strong>C 层：</strong>camera 决定观察位置（虚拟摄像机）<br>" +
              "· <strong>L 层：</strong>light 决定阴影、深度（z 轴）<br>" +
              "· <strong>S 层：</strong>screen 把虚拟坐标映射到真实像素（如 800×600）<br>" +
              "<em>SVG 渲染：&lt;rect x=&quot;100&quot; y=&quot;200&quot; width=&quot;50&quot; height=&quot;30&quot;/&gt;</em>"
    },
    { id: "inter", label: "⑤ 用户交互",
      c: "#ef4444",
      detail: "<strong>van Wijk 模型核心：</strong>反馈循环 —— View → Filter → Param → Other Views。<br>" +
              "<strong>Card 把交互放在最末层：</strong>用户与 view 的交互反向触达数据变换层。<br>" +
              "<strong>常见交互：</strong>zoom（缩放）/ pan（平移）/ select（高亮）/ link（联动）。<br>" +
              "<em>本节课演示：点击节点查看详情（基于事件委托）</em>"
    }
  ];

  const W = 920;
  const NODE_W = 130, NODE_H = 60;
  const pad = (W - nodes.length * NODE_W) / (nodes.length + 1);

  const svg = d3.select("#d-4-1-svg");
  // arrowhead marker
  const defs = svg.append("defs");
  defs.append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 8).attr("refY", 0)
    .attr("markerWidth", 6).attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#94a3b8");

  // arrows
  nodes.slice(0, -1).forEach((n, i) => {
    const next = nodes[i + 1];
    const x1 = pad + i * (NODE_W + pad) + NODE_W;
    const x2 = pad + (i + 1) * (NODE_W + pad);
    const y = 35 + NODE_H / 2;
    svg.append("line")
       .attr("class", "arrow")
       .attr("x1", x1).attr("y1", y).attr("x2", x2).attr("y2", y)
       .attr("marker-end", "url(#arrowhead)");
  });

  // nodes
  const g = svg.selectAll(".node").data(nodes).join("g")
    .attr("class", "node")
    .attr("transform", (d, i) => `translate(${pad + i * (NODE_W + pad)}, 35)`)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      svg.selectAll(".node").classed("selected", n => n.id === d.id);
      document.getElementById("d-4-1-detail").innerHTML = d.detail;
    });

  g.append("rect")
    .attr("width", NODE_W).attr("height", NODE_H)
    .attr("fill", d => d.c + "15")                  // 极浅色背景
    .attr("stroke", d => d.c)
    .attr("stroke-width", 2);

  g.append("text")
    .attr("class", "node-label")
    .attr("x", NODE_W / 2).attr("y", NODE_H / 2 + 5)
    .attr("text-anchor", "middle")
    .text(d => d.label);
};

// ---------- 4.2 数据分类树（d3.rollup 多层聚合） ----------
demos["d-4-2"] = async (mount) => {
  const data = await loadStudents();

  mount.innerHTML = `
    <div class="controls">
      <label>第 1 层分组：
        <select id="d-4-2-k1">
          <option value="gender" selected>gender 性别</option>
          <option value="major">major 专业</option>
          <option value="class">class 班级</option>
          <option value="hometown">hometown 籍贯</option>
        </select>
      </label>
      <label>第 2 层分组：
        <select id="d-4-2-k2">
          <option value="" selected>— 无（单层）—</option>
          <option value="gender">gender</option>
          <option value="major">major</option>
          <option value="class">class</option>
        </select>
      </label>
      <label>每组聚合：
        <select id="d-4-2-val">
          <option value="count" selected>count 计数</option>
          <option value="ages">ages 年龄列表</option>
          <option value="avgAge">avgAge 平均年龄</option>
        </select>
      </label>
    </div>
    <div class="console" id="d-4-2-out">计算中...</div>
    <p class="demo-legend">
      <span style="color:#a855f7">★</span> <strong>d3.rollup(data, reduceFn, key1, key2)</strong>：
      多层 key 时，外层为 key1、内层为 key2；reduceFn 把同组数据聚合为单一值。
    </p>
  `;

  const $k1 = document.getElementById("d-4-2-k1");
  const $k2 = document.getElementById("d-4-2-k2");
  const $val = document.getElementById("d-4-2-val");
  const $out = document.getElementById("d-4-2-out");

  function run() {
    const k1 = $k1.value, k2 = $k2.value, val = $val.value;

    const reduceFn = val === "count"  ? v => v.length
                   : val === "avgAge" ? v => +(d3.mean(v, d => d.age).toFixed(2))
                                      : v => v.map(d => d.age).join(",");

    // 注意：d3.rollup 接收 keys 是 rest 参数
    const result = d3.rollup(data, reduceFn, d => d[k1], ...(k2 ? [d => d[k2]] : []));

    $out.innerText = formatMap(result, k1);
  }

  // 自定义嵌套 Map 打印（d3 默认 toString 不好看）
  function formatMap(m, label) {
    const lines = [`d3.rollup 按「${label}」聚合的结果 →`];
    function walk(node, depth) {
      if (node instanceof Map) {
        for (const [k, v] of node) {
          lines.push(`  ${"  ".repeat(depth)}├── "${k}"`);
          walk(v, depth + 1);
        }
      } else {
        lines.push(`  ${"  ".repeat(depth)}└── ${JSON.stringify(node)}`);
      }
    }
    walk(m, 1);
    return lines.join("\n");
  }

  $k1.addEventListener("change", run);
  $k2.addEventListener("change", run);
  $val.addEventListener("change", run);
  run();
};

// ---------- 4.3 树布局（Reingold-Tilford 算法） ----------
demos["d-4-3"] = async (mount) => {
  const data = await loadStudents();

  mount.innerHTML = `
    <div class="controls">
      <label>聚合层次：
        <select id="d-4-3-keys">
          <option value="major:class" selected>专业 → 班级</option>
          <option value="major:class:gender">专业 → 班级 → 性别</option>
          <option value="gender:major:class">性别 → 专业 → 班级</option>
          <option value="hometown:major">籍贯 → 专业</option>
        </select>
      </label>
      <label>节点间距：
        <input id="d-4-3-sep" type="range" min="0.1" max="2" step="0.05" value="0.6" />
        <span id="d-4-3-sep-out">0.6</span>
      </label>
    </div>
    <svg class="tree-svg tree-layout-svg" id="d-4-3-svg" viewBox="0 0 800 360"></svg>
    <p class="demo-legend">
      <strong>Reingold-Tilford 算法：</strong>1981 年提出，仍是 d3.tree() 的核心实现。每个父节点的子节点
      均匀分配左右两侧的空间，子节点的位置是递归计算父节点位置 ± 偏移。
    </p>
  `;

  const $keys = document.getElementById("d-4-3-keys");
  const $sep  = document.getElementById("d-4-3-sep");
  const $out  = document.getElementById("d-4-3-sep-out");

  function getHierarchy() {
    const path = $keys.value.split(":");
    let rootData = { count: data.length };

    // 用 d3.rollup 嵌套聚合
    let innermost = data;
    const keys = path.slice().reverse();
    let fn = arr => arr;  // 叶子就是列表本身
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const prev = fn;
      fn = (arr) => {
        const m = d3.rollup(arr, prev, d => d[k]);
        return m;
      };
    }

    rootData.children = fn(data);
    return rootData;
  }

  function buildNodeRec(d, label = "所有学生") {
    if (d instanceof Map) {
      const children = [];
      for (const [key, val] of d) {
        children.push(buildNodeRec(val, key));
      }
      return { name: label, children };
    }
    // 叶子：d 是数组（之前 fn(arr) = arr 链路最终终止）
    return { name: `${label} (${d.length})`, value: d.length, _students: d };
  }

  function render() {
    const sep = +$sep.value;
    $out.textContent = sep.toString();

    const raw = getHierarchy();
    const root = d3.hierarchy(buildNodeRec(raw.children));
    const width = 800, height = 360;
    const treeLayout = d3.tree().size([height - 40, width - 80]).separation((a, b) => (a.parent === b.parent ? 1 : sep));
    const treeData = treeLayout(root);

    const svg = d3.select("#d-4-3-svg");
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", "translate(40, 20)");

    // links
    g.selectAll(".link").data(treeData.links()).join("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal()
        .x(d => d.y).y(d => d.x));

    // nodes
    const ng = g.selectAll(".node").data(treeData.descendants()).join("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y}, ${d.x})`);

    ng.append("circle").attr("r", 5);
    ng.append("text")
      .attr("dy", 4)
      .attr("x", d => d.children ? -8 : 8)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.name);
  }

  $keys.addEventListener("change", render);
  $sep.addEventListener("input", render);
  render();
};

// ---------- 4.4 树形列表渲染（classed + 事件委托 + stopPropagation + 动画 transition） ----------
demos["d-4-4"] = async (mount) => {
  const data = await loadStudents();

  // d3.rollup → { major: { class: [students...] } }
  const grouped = d3.rollup(data,
    v => v,                              // 班级 → 学生列表
    d => d.major,
    d => d.class);

  // 转为 JSON 树（hierarchy 友好的格式）
  function toJSON(map, label = "全部新生") {
    if (map instanceof Map) {
      const children = [];
      for (const [k, v] of map) children.push(toJSON(v, k));
      return { name: label, children };
    }
    return { name: `${label} (${map.length}人)`, students: map };
  }

  const rootData = toJSON(grouped, "2025 级新生");
  const root = d3.hierarchy(rootData);

  // 给每个节点加一份展开状态
  root.descendants().forEach(d => d.data._collapsed = false);

  // 动画时长（滑块实时控制）
  let DURATION = 500;

  mount.innerHTML = `
    <div class="controls">
      <button id="d-4-4-expand-all"  class="demo-btn">全部展开</button>
      <button id="d-4-4-collapse-all" class="demo-btn secondary">全部折叠</button>
      <label style="font-size:13px;color:#475569;">动画时长
        <input id="d-4-4-dur" type="range" min="0" max="1500" step="50" value="500" style="vertical-align:middle;">
        <span id="d-4-4-dur-out" style="width:40px;display:inline-block;text-align:right;">500ms</span>
      </label>
      <span style="font-size:12px;color:#64748b;"> 点 toggle 折叠 · 点「选中」看事件委托 · 拖滑块看 transition</span>
    </div>
    <div class="tree-list" id="d-4-4-tree"></div>
    <p class="console" id="d-4-4-info">点击任意班级条目 → 看事件冒泡 & delegated handler 的日志</p>
    <p class="demo-legend">
      <strong>关键技术：</strong>
      <code>classed("selected", bool)</code> 链式状态控制 ·
      <code>stopPropagation()</code> 阻止冒泡 ·
      <code>e.target.closest(".label")</code> 事件委托 ·
      <code>.transition().duration(ms)</code> 动画
    </p>
  `;

  const $tree = document.getElementById("d-4-4-tree");
  const $info = document.getElementById("d-4-4-info");

  function render() {
    $tree.innerHTML = "";
    const ul = d3.create("ul");
    ul.selectAll("li").data([root]).join("li")
      .each(function (d) { buildList(d3.select(this), d); });
    $tree.appendChild(ul.node());
  }

  function buildList(liSel, d) {
    liSel.attr("class", d.data._collapsed ? "collapsed" : "");

    const label = liSel.append("span").attr("class", "label");

    // toggle 折叠（带动画）
    if (d.children) {
      label.append("span").attr("class", "toggle").text(d.data._collapsed ? "▶" : "▼");
    } else {
      label.append("span").attr("class", "toggle").text("·");
    }
    label.append("span").text(d.data.name);
    if (d.data.students) {
      label.append("span").attr("class", "count").text(d.data.students.length);
    }

    // 关键 ①：阻止 label 上的 click 冒泡（避免误触发"选中"）
    label.on("click.toggle", (event) => {
      event.stopPropagation();
      d.data._collapsed = !d.data._collapsed;
      render();
    });

    // 关键 ②：点击 li 触发"选中"（事件委托 —— ul 上不必逐个监听）
    liSel.on("click.select", (event) => {
      // 关键：不要再次选到 toggle 按钮
      if (event.target.classList.contains("toggle")) return;
      const all = $tree.querySelectorAll("li");
      all.forEach(li => li.classList.remove("selected"));
      liSel.classed("selected", true);
      $info.innerHTML = `<strong>事件冒泡日志：</strong><br>` +
        `  · 触发节点：<code>${d.data.name}</code><br>` +
        `  · e.target = 元素 .label（不是 ul）<br>` +
        `  · li 的 click 监听器被调用（事件委托）<br>` +
        `  · toggle 按钮上 stopPropagation() 阻止冒泡，所以不触发本监听器`;
    });

    if (d.children && !d.data._collapsed) {
      const subUL = liSel.append("ul");
      //  关键 ③：transition + duration —— 子列表"淡入"，时长由滑块控制
      if (DURATION > 0) {
        subUL.style("opacity", 0)
             .transition().duration(DURATION).style("opacity", 1);
      }
      subUL.selectAll("li").data(d.children).join("li")
        .each(function (sub) { buildList(d3.select(this), sub); });
    }
  }

  document.getElementById("d-4-4-expand-all").onclick = () => {
    root.descendants().forEach(d => d.data._collapsed = false);
    render();
  };
  document.getElementById("d-4-4-collapse-all").onclick = () => {
    root.descendants().forEach(d => d.data._collapsed = true);
    render();
  };

  // 动画时长滑块：实时改 DURATION 并重放
  const $dur = document.getElementById("d-4-4-dur");
  const $durOut = document.getElementById("d-4-4-dur-out");
  $dur.addEventListener("input", () => {
    DURATION = +$dur.value;
    $durOut.textContent = DURATION + "ms";
    render();
  });

  render();
};

// 启动第一个章节的 demo（如果在加载时正好展示 ch-4-1）
document.addEventListener("DOMContentLoaded", () => {
  const firstMount = document.querySelector(".chapter.active .tab-panel[data-panel='demo'] .demo-mount");
  if (firstMount && !firstMount.dataset.rendered) {
    const name = firstMount.dataset.demo;
    if (demos[name]) demos[name](firstMount);
    firstMount.dataset.rendered = "1";
  }
});


VIS['demos/lesson-02'] = { demos: demos };
})();

(function () {
// lesson-03 —— 各小节「演示」tab 的实现（由原 lesson.js 迁移，已抽出公共样板）
// 每个 demo 接收挂载元素 mount，向其注入 HTML 并用 d3 绘制。

// Doc-03 色彩专题 · 集成教学页面 · 8 个 demo
// =========================================
//   3.1 颜色模型基础   → d-3-1 color-models
//   3.2 colormap 三类  → d-3-2 colormap-principles
//   3.3 Lab 色域图    → d-3-3 lab-gamut
//   3.4 色系搭配规则  → d-3-4 color-harmony
//   3.5 科研经典配色  → d-3-5 classic-palettes
//   3.6 对错案例对比  → d-3-6 good-vs-bad
//   3.7 鲜艳+低饱和  → d-3-7 muted-saturated
//   3.8 CVD 论文图测  → d-3-8 cvd-paper-test
// =========================================

// d3 由 index.html 通过本地 vendor/d3.v7.min.js 预先加载到 window.d3（离线可用）
const d3 = window.d3;

// 本模块导出的 demo 注册表（key = 挂载点 id）
const demos = {};

// 公共工具：颜色空间转换 + CVD 模拟（颜色专题 8 个 demo 共用）
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

const CVD_MATRICES = {
  protanopia:   [[0.567, 0.433, 0.000], [0.558, 0.442, 0.000], [0.000, 0.242, 0.758]],
  deuteranopia: [[0.625, 0.375, 0.000], [0.700, 0.300, 0.000], [0.000, 0.300, 0.700]],
  tritanopia:   [[0.950, 0.050, 0.000], [0.000, 0.433, 0.567], [0.000, 0.475, 0.525]]
};

function simulateCVD(rgb, type) {
  const m = CVD_MATRICES[type];
  const [r, g, b] = rgb;
  return [
    Math.round(Math.max(0, Math.min(255, r * m[0][0] + g * m[0][1] + b * m[0][2]))),
    Math.round(Math.max(0, Math.min(255, r * m[1][0] + g * m[1][1] + b * m[1][2]))),
    Math.round(Math.max(0, Math.min(255, r * m[2][0] + g * m[2][1] + b * m[2][2])))
  ];
}

const rgbStr = ([r, g, b]) => `rgb(${r},${g},${b})`;

// 5 大科研经典配色（7 色以内）
const CLASSIC_PALETTES = {
  'Wong 2011':         ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'],
  'Paul Tol bright':   ['#4477AA', '#EE6677', '#228833', '#CCBB44', '#66CCEE', '#AA3377', '#BBBBBB'],
  'Paul Tol muted':    ['#332288', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#CC6677', '#882255'],
  'Okabe-Ito':         ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'],
  'Tableau 10':        ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC'],
  'Paired (12)':       ['#A6CEE3', '#1F78B4', '#B2DF8A', '#33A02C', '#FB9A99', '#E31A1C', '#FDBF6F', '#FF7F00', '#CAB2D6', '#6A3D9A', '#FFFF99', '#B15928'],
  'Viridis (seq)':     ['#440154', '#3B528B', '#21918C', '#5EC962', '#FDE725'],
  'Cividis (seq)':     ['#00224E', '#2C3F75', '#61678A', '#938B9A', '#C1AB80', '#E6CC65'],
  'RdBu (div)':        ['#67001F', '#D6604D', '#F4A582', '#FDFDFF,', '#92C5DE', '#4393C3', '#053061']
};

// =========================================
//  d-3-1 · 颜色模型基础（3.1）
// =========================================
demos["d-3-1"] = async function (mount) {
  mount.innerHTML = `
    <h4>颜色模型基础</h4>
    <p class="demo-hint">拖动滑块改变颜色，下方 4 个色块同时显示四种颜色空间的呈现，CVD 模拟显示 3 种色盲眼中所见。</p>
    <div class="color-picker-row">
      <label>R <input type="range" id="cr" min="0" max="255" value="100"></label>
      <label>G <input type="range" id="cg" min="0" max="255" value="50"></label>
      <label>B <input type="range" id="cb" min="0" max="255" value="200"></label>
      <div id="rgb-preview" style="height:32px;border-radius:4px;background:rgb(100,50,200);"></div>
    </div>

    <div class="color-grid" id="color-grid"></div>

    <div class="color-space-cards">
      <div class="color-space-card">
        <h5>RGB · 加色模型</h5>
        <p>红绿蓝三色光按强度（0-255）混合。<strong>不感知均匀</strong>：(255,0,0) 与 (0,255,0) 在屏幕上看上去"亮度差很多"。</p>
      </div>
      <div class="color-space-card">
        <h5>HSL · 艺术家友好</h5>
        <p>色相(H)·饱和度(S)·亮度(L)。H 与 L 直观，但 <strong>也不是感知均匀</strong>：HSL=50 与 HSL=80 的"亮差"在 Lab 空间里不相等。</p>
      </div>
      <div class="color-space-card">
        <h5>CIE Lab · 感知均匀</h5>
        <p>由人眼对色彩的实验测量构造，<strong>距离 ≈ 感知差</strong>。设计 colormap 时常用（d3.interpolateLab 是 Lab 空间插值）。</p>
      </div>
      <div class="color-space-card">
        <h5>CMYK · 减色（印刷）</h5>
        <p>青·品红·黄·黑。屏幕显示用不到，但印刷/出版场景必须知道。<span class="note">Web 可视化默认 RGB。</span></p>
      </div>
    </div>

    <h4>CVD（色觉缺陷）模拟</h4>
    <p class="demo-hint">约有 8% 男性、0.5% 女性是色盲。下图把同一颜色在三种常见色盲眼中模拟呈现。</p>
    <div class="cvd-row" id="cvd-row"></div>
  `;

  const grid = mount.querySelector("#color-grid");
  const cvdRow = mount.querySelector("#cvd-row");
  const preview = mount.querySelector("#rgb-preview");
  const cr = mount.querySelector("#cr");
  const cg = mount.querySelector("#cg");
  const cb = mount.querySelector("#cb");

  function render() {
    const r = +cr.value, g = +cg.value, b = +cb.value;
    preview.style.background = rgbStr([r, g, b]);

    const hsl = rgbToHsl(r, g, b);
    const c = d3.color(rgbStr([r, g, b]));
    // d3-color v3 没有 Color#lab/Color#cmyk 实例方法，改用 d3.lab() 构造并手算 cmyk
    const lab = d3.lab(c);
    const labDisp = `L*${lab.l.toFixed(0)} a*${lab.a.toFixed(0)} b*${lab.b.toFixed(0)}`;
    const hslDisp = `H*${hsl[0].toFixed(0)}° S*${hsl[1].toFixed(0)}% L*${hsl[2].toFixed(0)}%`;
    const R = r / 255, G = g / 255, B = b / 255;
    const k = 1 - Math.max(R, G, B);
    const cmyk = {
      c: k === 1 ? 0 : (1 - R - k) / (1 - k),
      m: k === 1 ? 0 : (1 - G - k) / (1 - k),
      y: k === 1 ? 0 : (1 - B - k) / (1 - k),
      k,
    };
    const cmykDisp = `C*${(cmyk.c*100).toFixed(0)} M*${(cmyk.m*100).toFixed(0)} Y*${(cmyk.y*100).toFixed(0)} K*${(cmyk.k*100).toFixed(0)}`;

    grid.innerHTML = `
      <div class="color-cell" style="background:${rgbStr([r,g,b])}">RGB<small>(${r}, ${g}, ${b})</small></div>
      <div class="color-cell" style="background:${rgbStr([r,g,b])}">HSL<small>${hslDisp}</small></div>
      <div class="color-cell" style="background:${rgbStr([r,g,b])}">Lab<small>${labDisp}</small></div>
      <div class="color-cell" style="background:${rgbStr([r,g,b])}">CMYK<small>${cmykDisp}</small></div>
    `;

    const prota = simulateCVD([r, g, b], 'protanopia');
    const deuta = simulateCVD([r, g, b], 'deuteranopia');
    const trita = simulateCVD([r, g, b], 'tritanopia');
    cvdRow.innerHTML = `
      <div class="cvd-cell" style="background:${rgbStr([r,g,b])}">正常视觉</div>
      <div class="cvd-cell" style="background:${rgbStr(prota)}">红色盲</div>
      <div class="cvd-cell" style="background:${rgbStr(deuta)}">绿色盲</div>
      <div class="cvd-cell" style="background:${rgbStr(trita)}">蓝色盲</div>
    `;
  }

  [cr, cg, cb].forEach(el => el.addEventListener("input", render));
  render();
};

// =========================================
//  d-3-2 · colormap 三类（3.2）
// =========================================
demos["d-3-2"] = async function (mount) {
  const sample = [
    0,2,4,7,9,12,15,18,21,24,28,32,35,38,41,45,48,51,55,58,
    62,66,70,74,78,82,86,90,94,98,102,106,110,114,115,122,126,130,135,140,
    145,150,160,170,180,200,220,240,280,350
  ];
  const seq = d3.scaleSequential(d3.interpolateViridis).domain([0, 350]);
  const div = d3.interpolateRdBu;
  const cat = d3.scaleOrdinal(d3.schemeTableau10);

  mount.innerHTML = `
    <h4>colormap 三类选择</h4>
    <p class="demo-hint">三类 colormap 对应不同数据语义。选错类型 = 误导读者。</p>

    <h4 style="margin-top:14px">三类速记</h4>
    <table class="decision-table">
      <thead><tr><th>类型</th><th>适用</th><th>例子</th><th>CVD 友好</th></tr></thead>
      <tbody>
        <tr><td><strong>顺序型</strong></td><td>有序数值（人口、温度）</td>
            <td><div class="colormap-strip" id="strip-seq"></div>Viridis</td><td>✓ 优</td></tr>
        <tr><td><strong>发散型</strong></td><td>偏离中位数（±%、Z 分数）</td>
            <td><div class="colormap-strip" id="strip-div"></div>RdBu</td><td>△ 中</td></tr>
        <tr><td><strong>定性型</strong></td><td>无序类别（产品、性别）</td>
            <td><div class="colormap-strip" id="strip-cat"></div>Tableau10</td><td>△ 与色相相关</td></tr>
      </tbody>
    </table>

    <h4 style="margin-top:14px">50 州谋杀率（顺序型 Viridis 演示）</h4>
    <div id="seq-bar"></div>

    <h4 style="margin-top:14px">△ 错误示例：发散型 RdBu 画有序数据</h4>
    <p class="demo-hint" style="color:#dc2626">用 RdBu（发散型）画"50 州谋杀率"会让"中段 100 附近的州看上去"接近白色"——但 100 没有任何语义意义，纯属误导。</p>
    <div id="div-bar"></div>
  `;

  function strip(id, scale, n = 16) {
    const el = mount.querySelector("#" + id);
    el.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const d = document.createElement("div");
      d.style.background = typeof scale === "function" ? scale(i / (n - 1)) : scale(i / (n - 1));
      el.appendChild(d);
    }
  }
  strip("strip-seq", d3.scaleSequential(d3.interpolateViridis));
  strip("strip-div", d3.interpolateRdBu);
  strip("strip-cat", d3.scaleOrdinal(d3.schemeTableau10));

  function bar(id, scale) {
    const el = mount.querySelector("#" + id);
    el.innerHTML = "";
    sample.forEach((v, i) => {
      const d = document.createElement("div");
      d.style.cssText = `display:inline-block;width:14px;height:50px;background:${typeof scale === "function" ? scale(v / 350) : scale(1 - v / 350)};`;
      el.appendChild(d);
    });
  }
  bar("seq-bar", seq);
  bar("div-bar", div);
};

// =========================================
//  d-3-3 · Lab 色域图（3.3）
// =========================================
demos["d-3-3"] = async function (mount) {
  const W = 600, H = 420;
  let L = 60;

  mount.innerHTML = `
    <h4>CIE Lab 色域图</h4>
    <p class="demo-hint">CIE Lab 是感知均匀的颜色空间。a* 横轴（红↔绿），b* 纵轴（黄↔蓝），L* 决定亮度。<br>
    三种 RGB 工作色域（sRGB / Adobe RGB / Rec.2020）嵌套在 Lab 空间里 —— 越大越能表示更广的颜色。</p>
    <div class="ms-threshold-control">
      <label>L* 亮度：</label>
      <input type="range" id="labL" min="20" max="90" value="60">
      <span class="slope-readout" id="labLReadout">60</span>
    </div>
    <svg class="lab-gamut-svg" width="${W}" height="${H}" id="lab-svg"></svg>
    <div id="lab-note"></div>
  `;

  const svg = d3.select(mount.querySelector("#lab-svg"));
  const labL = mount.querySelector("#labL");
  const labLReadout = mount.querySelector("#labLReadout");
  const note = mount.querySelector("#lab-note");

  const xScale = d3.scaleLinear().domain([-128, 128]).range([40, W - 40]);
  const yScale = d3.scaleLinear().domain([128, -128]).range([20, H - 20]);

  function render() {
    L = +labL.value;
    labLReadout.textContent = L;
    svg.selectAll("*").remove();

    const step = 4;
    for (let a = -128; a <= 128; a += step) {
      for (let b = -128; b <= 128; b += step) {
        const rgb = d3.lab(L, a, b).rgb();
        const cr = Math.max(0, Math.min(255, rgb.r));
        const cg = Math.max(0, Math.min(255, rgb.g));
        const cb = Math.max(0, Math.min(255, rgb.b));
        svg.append("rect")
          .attr("x", xScale(a)).attr("y", yScale(b))
          .attr("width", step * (W - 80) / 256 + 1)
          .attr("height", step * (H - 40) / 256 + 1)
          .attr("fill", `rgb(${cr},${cg},${cb})`)
          .attr("opacity", 0.85);
      }
    }

    svg.append("line").attr("x1", 40).attr("x2", W - 40).attr("y1", H / 2).attr("y2", H / 2)
      .attr("stroke", "#1e293b").attr("stroke-width", 1);
    svg.append("line").attr("x1", W / 2).attr("x2", W / 2).attr("y1", 20).attr("y2", H - 20)
      .attr("stroke", "#1e293b").attr("stroke-width", 1);

    svg.append("text").attr("x", W - 36).attr("y", H / 2 - 6).attr("font-size", 12).attr("fill", "#1e293b").text("a* = +128 红");
    svg.append("text").attr("x", 44).attr("y", H / 2 - 6).attr("font-size", 12).attr("fill", "#1e293b").text("绿 a* = -128");
    svg.append("text").attr("x", W / 2 + 6).attr("y", 24).attr("font-size", 12).attr("fill", "#1e293b").text("黄 b* = +128");
    svg.append("text").attr("x", W / 2 + 6).attr("y", H - 12).attr("font-size", 12).attr("fill", "#1e293b").text("蓝 b* = -128");

    note.innerHTML = `
      <h4>关键点</h4>
      <ul>
        <li><strong>Lab 空间感知均匀</strong>：色域内任意两点距离 ≈ 人眼感知差</li>
        <li>实际显示色域是 sRGB（约三角内），超出色域的颜色会被 clamp 回 sRGB → 出现"失真"</li>
        <li>Adobe RGB 涵盖绿色更广（看印刷/摄影），Rec.2020 涵盖 4K 电视</li>
        <li>调整 L* 滑块：L* 越低，色域面积越小（暗色只能 saturate 有限）</li>
        <li><strong>实战意义</strong>：从 Lab→RGB 转换（d3.lab(...).rgb()）会让你设计 colormap 时自动处理感知线性</li>
      </ul>
    `;
  }

  labL.addEventListener("input", render);
  render();
};

// =========================================
//  d-3-4 · 色系搭配规则（3.4）
// =========================================
demos["d-3-4"] = async function (mount) {
  const rules = [
    { name: "单色 Monochromatic", offset: 0,            desc: "同一色相不同亮度/饱和" },
    { name: "类比 Analogous",    offset: 30,           desc: "色轮相邻 ±30°" },
    { name: "互补 Complementary",offset: 180,          desc: "色轮正对面 180°" },
    { name: "三等分 Triadic",    offset: 120,          desc: "色轮 120° 等分" },
    { name: "分裂互补 Split",    offset: 150,          desc: "互补色相邻 150°" }
  ];

  let baseH = 210;
  let sat = 60;
  let lit = 55;

  mount.innerHTML = `
    <h4>色系搭配规则（5 大类）</h4>
    <p class="demo-hint">选主色 → 5 张配色方案同时生成。每张色板用一张"假论文插图"展示。</p>
    <div class="ms-threshold-control">
      <label>主色 H：</label>
      <input type="range" id="baseH" min="0" max="360" value="210">
      <span class="slope-readout" id="baseHReadout">210°</span>
    </div>
    <div class="harmony-grid" id="harmony"></div>
    <div id="harmony-note"></div>
  `;

  const grid = mount.querySelector("#harmony");
  const baseHInput = mount.querySelector("#baseH");
  const baseHReadout = mount.querySelector("#baseHReadout");
  const note = mount.querySelector("#harmony-note");

  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }

  function palette(h, offset) {
    const cs = [];
    for (let i = -2; i <= 2; i++) {
      const hh = (h + i * offset + 360) % 360;
      cs.push(rgbStr(hslToRgb(hh, sat, lit)));
    }
    return cs;
  }

  function renderPaper(palette, idx) {
    const W = 200, H = 80;
    const svg = `<svg width="${W}" height="${H}">
      ${[10, 30, 50, 70, 90, 110, 130, 150, 170, 190].map((x, i) =>
        `<rect x="${x - 8}" y="${H - 10 - (i * 7) % 60}" width="14" height="${(i * 7) % 60 + 5}" fill="${palette[i % palette.length]}" />`
      ).join('')}
    </svg>`;
    return svg;
  }

  function render() {
    baseH = +baseHInput.value;
    baseHReadout.textContent = baseH + "°";
    grid.innerHTML = "";

    rules.forEach((r, i) => {
      const pal = palette(baseH, r.offset);
      const card = document.createElement("div");
      card.className = "harmony-card";
      card.innerHTML = `
        <h5>${r.name}</h5>
        <div class="harmony-swatch">
          ${pal.map(c => `<div style="background:${c}"></div>`).join('')}
        </div>
        <p>${r.desc}</p>
        <div class="harmony-preview" style="background:${pal[2]}">假论文图</div>
        <div style="margin-top:4px">${renderPaper(pal, i)}</div>
      `;
      grid.appendChild(card);
    });

    note.innerHTML = `
      <h4>关键点</h4>
      <ul>
        <li><strong>单色</strong>：最安全、最不刺眼。适合"严肃"科研图（如 Nature 黑白经济型配色）</li>
        <li><strong>类比</strong>：和谐但缺少对比度。适合"层级"或"分组"少的情况</li>
        <li><strong>互补</strong>：对比度强但易刺眼。适合"突出重点"（如对照实验组）</li>
        <li><strong>三等分</strong>：3 种类别时最常用（如 处理/对照/安慰剂）</li>
        <li><strong>分裂互补</strong>：互补的"温和版"——主色 1 + 强调 2（主对比但不刺眼）</li>
      </ul>
    `;
  }

  baseHInput.addEventListener("input", render);
  render();
};

// =========================================
//  d-3-5 · 科研经典配色（3.5）
// =========================================
demos["d-3-5"] = async function (mount) {
  const data = Array.from({length: 20}, (_, i) => ({ x: i, y: Math.sin(i / 3) * 5 + i * 0.5 + (i % 3) }));

  mount.innerHTML = `
    <h4>科研经典配色横评</h4>
    <p class="demo-hint">6 大经典科研配色：Wong 2011（Nature 推荐）/ Paul Tol / Okabe-Ito / Tableau / Paired / Viridis。每种都 CVD 友好，<strong>其中 Wong / Okabe-Ito / Paul Tol 是 Nature/Science/Cell 实际在用的</strong>。</p>

    <div class="palette-matrix" id="palettes"></div>

    <h4 style="margin-top:14px">同样数据 + 不同配色（看哪个"耐看"）</h4>
    <div class="demo-control" id="pal-tabs"></div>
    <svg class="heatmap-svg" id="pal-svg" width="720" height="240"></svg>
    <div id="pal-note"></div>
  `;

  const mat = mount.querySelector("#palettes");
  const sources = {
    'Wong 2011':       'Nature Methods 2011 - 8 色 CVD 友好',
    'Paul Tol bright': 'SRON Tech Note 2021 - 7 色白底',
    'Paul Tol muted':  'SRON Tech Note 2021 - 8 色深底',
    'Okabe-Ito':       'Okabe & Ito 2002 - 8 色 CVD 友好',
    'Tableau 10':      'Tableau 10 - 10 色通用',
    'Paired (12)':     'ColorBrewer 12 - 12 色配对',
    'Viridis (seq)':   'Smith et al. 2017 - 顺序型',
    'Cividis (seq)':   'Nuñez et al. 2018 - 顺序型 CVD',
    'RdBu (div)':      'ColorBrewer - 发散型红蓝'
  };
  Object.entries(CLASSIC_PALETTES).forEach(([name, colors]) => {
    const row = document.createElement("div");
    row.className = "palette-name";
    row.textContent = name;
    mat.appendChild(row);

    const strip = document.createElement("div");
    strip.className = "palette-strip";
    colors.forEach(c => {
      const d = document.createElement("div");
      d.style.background = c;
      strip.appendChild(d);
    });
    mat.appendChild(strip);

    const src = document.createElement("div");
    src.className = "palette-source";
    src.textContent = sources[name] || "";
    mat.appendChild(src);
  });

  const tabs = mount.querySelector("#pal-tabs");
  const svg = d3.select(mount.querySelector("#pal-svg"));
  const note = mount.querySelector("#pal-note");

  function drawBars(paletteName) {
    svg.selectAll("*").remove();
    const pal = CLASSIC_PALETTES[paletteName];
    const N = pal.length;
    const W = 720, H = 240, M = { t: 30, r: 20, b: 30, l: 30 };
    const innerW = W - M.l - M.r, innerH = H - M.t - M.b;
    const xScale = d3.scaleBand().domain(d3.range(N)).range([0, innerW]).padding(0.2);
    const yScale = d3.scaleLinear().domain([0, 15]).range([innerH, 0]);

    svg.selectAll("rect").data(pal).enter().append("rect")
      .attr("x", (_, i) => M.l + xScale(i))
      .attr("y", (_, i) => M.t + yScale(i + 1))
      .attr("width", xScale.bandwidth())
      .attr("height", (_, i) => innerH - yScale(i + 1))
      .attr("fill", d => d)
      .attr("opacity", 0.9);

    const line = d3.line().x((d, i) => M.l + xScale(i) + xScale.bandwidth() / 2)
                           .y(d => M.t + yScale(d.y))
                           .curve(d3.curveCatmullRom);
    data.forEach((_, li) => {
      if (li >= N) return;
      const sub = data.slice(0, N);
      svg.append("path").datum(sub)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", pal[li % N])
        .attr("stroke-width", 2.5)
        .attr("opacity", 0.6);
    });

    svg.append("text").attr("x", M.l).attr("y", M.t - 8)
      .attr("font-size", 12).attr("font-weight", 600).attr("fill", "#1e293b")
      .text(paletteName);

    note.innerHTML = `
      <h4>关键点</h4>
      <ul>
        <li><strong>Wong / Okabe-Ito / Paul Tol</strong>：3 大科研配色黄金标准，色盲友好 + 灰度打印友好</li>
        <li><strong>Tableau 10</strong>：商业图表之王，适合 5-7 类，但红绿对色盲不友好</li>
        <li><strong>Paired (12)</strong>：配对设计（如处理前/后），但 12 色过载眼睛</li>
        <li><strong>顺序型 colormap</strong>（Viridis / Cividis）：仅用于连续数值，不能用于离散类别</li>
        <li>一般原则：<strong>类别数 ≤ 7</strong>，否则用连续 colormap 替代</li>
      </ul>
    `;
  }

  Object.keys(CLASSIC_PALETTES).forEach((name, i) => {
    const btn = document.createElement("label");
    btn.textContent = name;
    if (i === 0) btn.classList.add("active");
    btn.addEventListener("click", () => {
      tabs.querySelectorAll("label").forEach(l => l.classList.remove("active"));
      btn.classList.add("active");
      drawBars(name);
    });
    tabs.appendChild(btn);
  });

  drawBars("Wong 2011");
};

// =========================================
//  d-3-6 · 对错案例对比（3.6）
// =========================================
demos["d-3-6"] = async function (mount) {
  const cases = [
    { name: "A：彩虹谱 Jet",         type: "wrong",   reason: "Jet 非感知均匀 + CVD 不友好 + 打印不友好", palette: d3.interpolateRainbow },
    { name: "B：红绿对比",           type: "wrong",   reason: "红绿对红绿色盲完全不可分辨（约 6% 男性）", palette: (t) => d3.interpolateRgb("#dc2626", "#16a34a")(t) },
    { name: "C：颜色过多 12 色",     type: "wrong",   reason: "类别超过 7 种时，眼睛无法区分；应合并或用连续 colormap", palette: (t) => d3.interpolateSinebow(t) },
    { name: "D：Wong 8 色（对）",    type: "correct", reason: "Wong 2011 配色：CVD 友好 + 灰度打印友好 + 类别数 ≤ 8", palette: (t) => CLASSIC_PALETTES["Wong 2011"][Math.floor(t * 7.99)] }
  ];

  mount.innerHTML = `
    <h4>对错案例对比（4 张图，请你投票）</h4>
    <p class="demo-hint">同样 8 类数据，用 4 种配色方案。点击你认为"对"的那张。</p>
    <div class="quiz-grid" id="quiz"></div>
    <div id="quiz-result"></div>
  `;

  const grid = mount.querySelector("#quiz");
  const result = mount.querySelector("#quiz-result");

  function makeSampleBars(palette) {
    const data = Array.from({length: 8}, (_, i) => 2 + (i * 1.3 + 0.5) % 5 + Math.sin(i) * 1.2);
    const W = 200, H = 100;
    let bars = "";
    const bw = (W - 16) / 8;
    data.forEach((v, i) => {
      const color = palette(i / 7);
      bars += `<rect x="${8 + i * bw}" y="${H - 8 - v * 14}" width="${bw - 2}" height="${v * 14}" fill="${color}" />`;
    });
    return `<svg width="${W}" height="${H}" style="background:#fafafa;border:1px solid #e2e8f0;">${bars}</svg>`;
  }

  cases.forEach((c, i) => {
    const card = document.createElement("div");
    card.className = "quiz-card";
    card.innerHTML = `
      <h5 style="margin:0 0 6px;font-size:12px;color:#475569">${c.name}</h5>
      ${makeSampleBars(c.palette)}
      <div class="quiz-card-label">点我投票</div>
    `;
    card.addEventListener("click", () => {
      cards.forEach((cc, ii) => {
        cc.classList.remove("correct", "wrong");
        if (ii === i) cc.classList.add(c.type);
        else cc.classList.add(c.type === "correct" ? "wrong" : "");
      });
      result.innerHTML = `
        <div class="quiz-result">
          <strong>答案：${c.name}</strong> ${c.type === "correct" ? "✓ 正确" : "△ 错"}<br>
          <span style="font-size:12px;">${c.reason}</span>
        </div>
      `;
    });
    grid.appendChild(card);
  });

  const cards = grid.querySelectorAll(".quiz-card");
};

// =========================================
//  d-3-7 · 鲜艳+低饱和 哲学生成器（3.7）
// =========================================
demos["d-3-7"] = async function (mount) {
  let H = 220, S = 70, L = 55;

  mount.innerHTML = `
    <h4>配色哲学：鲜艳 + 低饱和（耐看的设计）</h4>
    <p class="demo-hint">选主色 → 算法生成 5-7 色搭配：主色 + 2 类比色 + 1 互补强调 + 1 低饱和高亮。<br>
    <strong>用户原则</strong>：颜色数量 ≤ 7、鲜艳颜色（高 H 区分度）+ 低饱和度（S 30-50%）= <strong>好看又耐看</strong>。</p>
    <div class="philosophy-row">
      <div class="philosophy-inputs">
        <label>主色 H <input type="range" id="phH" min="0" max="360" value="220"></label>
        <label>主色 S <input type="range" id="phS" min="20" max="100" value="70"></label>
        <label>主色 L <input type="range" id="phL" min="30" max="80" value="55"></label>
        <p style="font-size:11px;color:#64748b;line-height:1.6;margin-top:10px">
          <strong>经验公式</strong>：<br>
          • 主色 S = 70-80%（鲜明）<br>
          • 配套色 S = 30-50%（低饱和，耐看）<br>
          • 强调色用互补或类比，<strong>不要全饱和</strong><br>
          • 高亮用 L=85-90%（如背景、注释）
        </p>
      </div>
      <div class="philosophy-output">
        <h5>生成的 7 色板</h5>
        <div class="harmony-swatch" id="phPalette" style="height:48px;"></div>
        <h5 style="margin-top:12px">假论文插图（看效果）</h5>
        <div class="philosophy-paper" id="phPaper"></div>
      </div>
    </div>
  `;

  const phH = mount.querySelector("#phH");
  const phS = mount.querySelector("#phS");
  const phL = mount.querySelector("#phL");
  const pal = mount.querySelector("#phPalette");
  const paper = mount.querySelector("#phPaper");

  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  function hslHex(h, s, l) {
    const [r, g, b] = hslToRgb(h, s, l);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }

  function genPalette(H, S, L) {
    return [
      hslHex((H - 30 + 360) % 360, S * 0.6, L * 1.1),
      hslHex((H - 30 + 360) % 360, S, L),
      hslHex(H, S, L),
      hslHex((H + 30) % 360, S, L),
      hslHex((H + 30) % 360, S * 0.6, L * 1.1),
      hslHex((H + 180) % 360, S * 0.8, L * 0.95),
      hslHex(H, S * 0.2, L * 1.4)
    ];
  }

  function makePaper(palette) {
    return `
      <div class="philosophy-paper-card" style="background:${palette[2]};color:#fff">
        <strong>实验组</strong><br>主色 HSL
      </div>
      <div class="philosophy-paper-card" style="background:${palette[5]};color:#fff">
        <strong>对照组</strong><br>互补
      </div>
      <div class="philosophy-paper-card" style="background:${palette[6]};color:#1e293b;border:1px solid #cbd5e1">
        <strong>注释层</strong><br>高亮低饱和
      </div>
    `;
  }

  function render() {
    H = +phH.value; S = +phS.value; L = +phL.value;
    const palette = genPalette(H, S, L);
    pal.innerHTML = palette.map(c => `<div style="background:${c}"></div>`).join('');
    paper.innerHTML = makePaper(palette);
  }

  [phH, phS, phL].forEach(el => el.addEventListener("input", render));
  render();
};

// =========================================
//  d-3-8 · CVD 论文图测（3.8）
// =========================================
demos["d-3-8"] = async function (mount) {
  mount.innerHTML = `
    <h4>CVD 论文图测：你的图在色盲眼里还看得懂吗？</h4>
    <p class="demo-hint">下面 3 张"经典论文图"，模拟在 3 种视觉下的呈现。第一张常出现在 Nature Methods，第二张是顺序型热图，第三张是红绿对比。</p>
    <div class="cvd-paper" id="papers"></div>
    <div id="cvd-paper-note"></div>
  `;

  const papers = mount.querySelector("#papers");

  function makeScatter(palette) {
    const W = 220, H = 110;
    const N = 5;
    let pts = "";
    d3.range(40).forEach(i => {
      const cat = i % N;
      const x = 20 + (i * 7) % 180;
      const y = 15 + (i * 11) % 80;
      pts += `<circle cx="${x}" cy="${y}" r="5" fill="${palette[cat]}" opacity="0.85" />`;
    });
    return `<svg width="${W}" height="${H}" style="background:#fff;border:1px solid #e2e8f0;">${pts}</svg>`;
  }

  function makeHeatmap(scale) {
    const W = 220, H = 110;
    let cells = "";
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 14; c++) {
        const t = (r * 14 + c) / 70;
        cells += `<rect x="${c * 16}" y="${r * 22}" width="16" height="22" fill="${scale(t)}" />`;
      }
    }
    return `<svg width="${W}" height="${H}" style="background:#fff;border:1px solid #e2e8f0;">${cells}</svg>`;
  }

  function makeRedGreen() {
    const W = 220, H = 110;
    const pal = ["#dc2626", "#16a34a", "#dc2626", "#16a34a", "#dc2626"];
    let bars = "";
    d3.range(5).forEach(i => {
      bars += `<rect x="${20 + i * 36}" y="${20 + (i % 2) * 5}" width="30" height="${70 - i * 5}" fill="${pal[i]}" />`;
    });
    return `<svg width="${W}" height="${H}" style="background:#fff;border:1px solid #e2e8f0;">${bars}</svg>`;
  }

  function cvdTransformSvg(svgString, type) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    doc.querySelectorAll("[fill]").forEach(el => {
      const c = d3.color(el.getAttribute("fill"));
      if (!c) return;
      const rgb = [Math.round(c.rgb().r), Math.round(c.rgb().g), Math.round(c.rgb().b)];
      const sim = simulateCVD(rgb, type);
      el.setAttribute("fill", rgbStr(sim));
    });
    return new XMLSerializer().serializeToString(doc);
  }

  const paperData = [
    { name: " 论文图 1：5 类别散点（Wong 配色）",  makeSvg: () => makeScatter(CLASSIC_PALETTES["Wong 2011"]) },
    { name: " 论文图 2：顺序型热图（Viridis）", makeSvg: () => makeHeatmap(d3.interpolateViridis) },
    { name: "△ 论文图 3：红绿对比（错误案例）",     makeSvg: () => makeRedGreen() }
  ];

  paperData.forEach(p => {
    const card = document.createElement("div");
    card.className = "cvd-paper-card";
    const original = p.makeSvg();
    const deuta = cvdTransformSvg(original, 'deuteranopia');
    const prota = cvdTransformSvg(original, 'protanopia');
    card.innerHTML = `
      <h5>${p.name}</h5>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:9px;">
        <div><div style="color:#94a3b8;margin-bottom:2px">正常</div>${original}</div>
        <div><div style="color:#94a3b8;margin-bottom:2px">红盲</div>${prota}</div>
        <div><div style="color:#94a3b8;margin-bottom:2px">绿盲</div>${deuta}</div>
      </div>
    `;
    papers.appendChild(card);
  });

  mount.querySelector("#cvd-paper-note").innerHTML = `
    <h4>关键点</h4>
    <ul>
      <li><strong>图 1（Wong）</strong>：5 类别散点在 CVD 眼中仍可分辨。✓ 推荐</li>
      <li><strong>图 2（Viridis）</strong>：顺序型热图在 CVD 眼中亮度单调性保持。✓ 推荐</li>
      <li><strong>图 3（红绿）</strong>：在绿盲眼里：红和绿几乎变成同色：（看 prota/deuta 列）。△ 禁用</li>
      <li><strong>实测流程</strong>：把图导出 PNG → 用 <a href="https://www.color-blindness.com/coblis-color-blindness-simulator/" target="_blank">Coblis</a> 模拟 → 看是否仍能区分</li>
      <li><strong>Wong 2011</strong> 是 Nature Methods 8:441 推荐，几乎所有顶标都改用 CVD 友好配色了</li>
    </ul>
  `;
};


VIS['demos/lesson-03'] = { demos: demos };
})();

(function () {
// lesson-04 —— 各小节「演示」tab 的实现（由原 lesson.js 迁移，已抽出公共样板）
// 每个 demo 接收挂载元素 mount，向其注入 HTML 并用 d3 绘制。

// Doc-04 低维数据可视化 · 集成教学页面 · 5 个 demo
// =========================================
//   4.1 数据转换       → d-4-1 crime-loader
//   4.2 坐标轴变换     → d-4-2 coordinate-transform
//   4.3 曲线拟合       → d-4-3 curve-fitting
//   4.4 倾角感知       → d-4-4 slope-perception
//   4.5 等值线         → d-4-5 marching-squares
// =========================================

// d3 由 index.html 通过本地 vendor/d3.v7.min.js 预先加载到 window.d3（离线可用）
const d3 = window.d3;

// 本模块导出的 demo 注册表（key = 挂载点 id）
const demos = {};

// =========================================
//  d-4-1 · 数据转换（4.1）
// =========================================
demos["d-4-1"] = async function (mount) {
  mount.innerHTML = `
    <h4>数据转换：长格式 vs 宽格式</h4>
    <p class="demo-hint">crime.csv 是宽格式（每个州一行，每个指标一列）。可视化和 d3 操作通常需要长格式（每行一个观测）。</p>
    <div id="data-shape"></div>
    <h4 style="margin-top:16px">↻ 转换代码</h4>
    <pre><code class="lang-js">//  d3.csv 第二参做类型转换
const raw = await d3.csv('./data/crime.csv', d3.autoType);
console.log(raw[0]);  // {state: 'Alabama', population: 3979000, ...}

// 宽格式 → 长格式：每行一个 (州, 指标, 值)
const long = raw.flatMap(d =>
  ['murder','robbery','burglary'].map(key => ({
    state: d.state, metric: key, value: d[key]
  }))
);</code></pre>
    <div id="data-preview"></div>
  `;

  const raw = await d3.csv('./data/crime.csv', d3.autoType);

  const shapeDiv = mount.querySelector("#data-shape");
  if (!shapeDiv) return;
  shapeDiv.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0;">
      <div>
        <h5 style="margin:0 0 6px;color:#4338ca">宽格式（CSV 原样）</h5>
        <pre style="font-size:11px;background:#f8fafc;color:#1e293b;padding:8px;border-radius:4px;overflow:auto;max-height:180px;">
${raw.slice(0, 3).map(d => JSON.stringify(d, null, 0)).join('\n')}
...
共 ${raw.length} 行 × ${Object.keys(raw[0]).length} 列</pre>
      </div>
      <div>
        <h5 style="margin:0 0 6px;color:#4338ca">长格式（转换后）</h5>
        <pre style="font-size:11px;background:#f8fafc;color:#1e293b;padding:8px;border-radius:4px;overflow:auto;max-height:180px;">
${raw.slice(0, 3).flatMap(d => ['murder','robbery','burglary'].map(k => JSON.stringify({state:d.state,metric:k,value:d[k]}))).slice(0, 9).join('\n')}
...
共 ${raw.length * 3} 行 × 3 列</pre>
      </div>
    </div>
  `;

  const prev = mount.querySelector("#data-preview");
  prev.innerHTML = `
    <h4 style="margin-top:12px">前 10 行预览</h4>
    <table class="decision-table" style="font-size:11px;">
      <thead><tr><th>州</th><th>人口</th><th>谋杀</th><th>抢劫</th><th>盗窃</th></tr></thead>
      <tbody>
        ${raw.slice(0, 10).map(d => `<tr><td>${d.state}</td><td>${d.population.toLocaleString()}</td><td>${d.murder}</td><td>${d.robbery.toLocaleString()}</td><td>${d.burglary.toLocaleString()}</td></tr>`).join('')}
      </tbody>
    </table>
  `;
};

// =========================================
//  d-4-2 · 三层坐标变换（4.2）
// =========================================
demos["d-4-2"] = async function (mount) {
  const raw = await d3.csv('./data/crime.csv', d3.autoType);
  const data = raw.map(d => ({ state: d.state, x: d.murder, y: d.robbery }));

  const W = 720, H = 360, M = { t: 30, r: 20, b: 40, l: 50 };
  const innerW = W - M.l - M.r, innerH = H - M.t - M.b;

  const xScaleData = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.x)]).range([0, innerW]);
  const yScaleData = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.y)]).range([innerH, 0]);
  const xScaleScreen = d3.scaleLinear().domain([0, innerW]).range([M.l, M.l + innerW]);
  const yScaleScreen = d3.scaleLinear().domain([innerH, 0]).range([M.t + innerH, M.t]);

  mount.innerHTML = `<h4>三层坐标变换</h4>
    <p class="demo-hint">数据空间 → 坐标系空间 → 屏幕空间。每一层职责不同，错位就会出问题。</p>
    <div class="demo-control">
      <label><input type="radio" name="xscale" value="linear" checked> x: linear</label>
      <label><input type="radio" name="xscale" value="log"> x: log</label>
      <label><input type="radio" name="xscale" value="sqrt"> x: sqrt</label>
    </div>
    <svg class="heatmap-svg" width="${W}" height="${H}" id="scatter"></svg>
    <div id="code-trace"></div>
  `;

  const svg = d3.select(mount.querySelector("#scatter"));
  let curXType = "linear";

  function render() {
    let xDataScale;
    if (curXType === "log") xDataScale = d3.scaleLog().domain([1, d3.max(data, d => d.x)]).range([0, innerW]);
    else if (curXType === "sqrt") xDataScale = d3.scaleSqrt().domain([0, d3.max(data, d => d.x)]).range([0, innerW]);
    else xDataScale = xScaleData;

    svg.selectAll("*").remove();

    svg.append("g").selectAll("line")
      .data(xDataScale.ticks(5)).enter().append("line")
      .attr("x1", d => xScaleScreen(xDataScale(d))).attr("x2", d => xScaleScreen(xDataScale(d)))
      .attr("y1", M.t).attr("y2", M.t + innerH)
      .attr("stroke", "#e2e8f0");

    const xAxis = d3.axisBottom().scale(d3.scaleLinear().domain(xDataScale.domain()).range(xDataScale.range())).tickFormat(d => d);
    svg.append("g").attr("transform", `translate(${M.l},${M.t + innerH})`).call(xAxis);
    svg.append("g").attr("transform", `translate(${M.l},${M.t})`).call(d3.axisLeft().scale(yScaleData));

    svg.selectAll("circle")
      .data(data).enter().append("circle")
      .attr("cx", d => xScaleScreen(xDataScale(d.x)))
      .attr("cy", d => yScaleScreen(yScaleData(d.y)))
      .attr("r", 4)
      .attr("fill", "#6366f1")
      .attr("opacity", 0.7);

    svg.append("text").attr("x", M.l + innerW / 2).attr("y", M.t + innerH + 32)
      .attr("text-anchor", "middle").style("font-size", "12px").text("Murder rate →");
    svg.append("text").attr("transform", `translate(${M.l - 36},${M.t + innerH/2}) rotate(-90)`)
      .attr("text-anchor", "middle").style("font-size", "12px").text("Robbery rate →");
  }

  mount.querySelectorAll("input[name=xscale]").forEach(r => {
    r.addEventListener("change", e => { curXType = e.target.value; render(); });
  });

  mount.querySelector("#code-trace").innerHTML = `
    <h4 style="margin-top:14px">关键代码：三层映射</h4>
    <pre><code class="lang-js">// 数据空间：值域 → 坐标系（0..innerW）
const xData = d3.scaleLinear().domain([0, maxX]).range([0, innerW]);
// 坐标系空间 → 屏幕空间（加 margin 偏移）
const xScreen = d3.scaleLinear().domain([0, innerW]).range([M.l, M.l + innerW]);
// 渲染
.attr('cx', d => xScreen(xData(d.x)))</code></pre>
  `;

  render();
};

// =========================================
//  d-4-3 · 曲线拟合（4.3，10 种曲线对比）
// =========================================
demos["d-4-3"] = async function (mount) {
  const raw = await d3.csv('./data/crime.csv', d3.autoType);
  const data = raw.map(d => ({ x: d.population, y: d.murder }));

  const W = 720, H = 380, M = { t: 20, r: 20, b: 36, l: 50 };
  const innerW = W - M.l - M.r, innerH = H - M.t - M.b;

  const xScale = d3.scaleLog().domain(d3.extent(data, d => d.x)).range([0, innerW]);
  const yScale = d3.scaleLinear().domain([0, d3.max(data, d => d.y) * 1.1]).range([innerH, 0]);
  const xScreen = d3.scaleLinear().domain([0, innerW]).range([M.l, M.l + innerW]);
  const yScreen = d3.scaleLinear().domain([innerH, 0]).range([M.t + innerH, M.t]);

  const curveTypes = [
    { name: "linear",    label: "Linear（直线）" },
    { name: "monotoneX", label: "Monotone X" },
    { name: "natural",   label: "Natural" },
    { name: "basis",     label: "Basis" },
    { name: "cardinal",  label: "Cardinal" },
    { name: "catmullRom",label: "Catmull-Rom" },
    { name: "step",      label: "Step" },
    { name: "stepBefore",label: "Step Before" },
    { name: "stepAfter", label: "Step After" },
    { name: "curveBundle",label: "Bundle" }
  ];

  mount.innerHTML = `
    <h4>曲线拟合：插值 vs 平滑</h4>
    <p class="demo-hint">同 50 个州的人口-谋杀率散点，用 10 种 curve 各画一条线。点击切换。</p>
    <div class="demo-control" id="curve-tabs" style="margin-bottom:12px"></div>
    <svg class="heatmap-svg" width="${W}" height="${H}" id="curves"></svg>
    <div id="curve-note"></div>
  `;

  const tabs = mount.querySelector("#curve-tabs");
  const svg = d3.select(mount.querySelector("#curves"));
  const note = mount.querySelector("#curve-note");

  function renderCurve(idx) {
    const ct = curveTypes[idx];

    const sorted = [...data].sort((a, b) => a.x - b.x);
    const line = d3.line().x(d => xScale(d.x)).y(d => yScale(d.y));
    if (ct.name !== "linear" && ct.name !== "step" && ct.name !== "stepBefore" && ct.name !== "stepAfter") {
      line.curve(d3[ct.name]);
    } else if (ct.name.startsWith("step")) {
      line.curve(d3[ct.name]);
    }

    svg.selectAll("*").remove();

    svg.append("g").selectAll("line")
      .data(yScale.ticks(6)).enter().append("line")
      .attr("x1", M.l).attr("x2", M.l + innerW)
      .attr("y1", d => yScreen(yScale(d))).attr("y2", d => yScreen(yScale(d)))
      .attr("stroke", "#e2e8f0");

    svg.append("g").attr("transform", `translate(${M.l},${M.t + innerH})`)
      .call(d3.axisBottom().scale(xScale).tickFormat(d3.format(".0s")));
    svg.append("g").attr("transform", `translate(${M.l},${M.t})`)
      .call(d3.axisLeft().scale(yScale));

    svg.selectAll("circle").data(data).enter().append("circle")
      .attr("cx", d => xScreen(xScale(d.x))).attr("cy", d => yScreen(yScale(d.y)))
      .attr("r", 3).attr("fill", "#94a3b8").attr("opacity", 0.5);

    svg.append("path").datum(sorted)
      .attr("fill", "none").attr("stroke", "#6366f1").attr("stroke-width", 2)
      .attr("d", line);

    note.innerHTML = `
      <h4>关键点</h4>
      <ul>
        <li><code>linear</code>、<code>step*</code> 是基础</li>
        <li><code>monotoneX</code>：保证原序列单调不出现伪震荡</li>
        <li><code>natural</code>、<code>catmullRom</code>：过所有点的平滑样条</li>
        <li>拟合 vs 插值：插值过所有点但容易过拟合；拟合（regression）只看趋势</li>
      </ul>
    `;
  }

  curveTypes.forEach((c, i) => {
    const btn = document.createElement("label");
    btn.textContent = c.label;
    if (i === 0) btn.classList.add("active");
    btn.addEventListener("click", () => {
      tabs.querySelectorAll("label").forEach(l => l.classList.remove("active"));
      btn.classList.add("active");
      renderCurve(i);
    });
    tabs.appendChild(btn);
  });

  renderCurve(0);
};

// =========================================
//  d-4-4 · 倾角感知（4.4，Cleveland 1984）
// =========================================
demos["d-4-4"] = async function (mount) {
  let angle = 45;
  const W = 720, H = 320;
  const line = (a) => {
    const r = (a * Math.PI) / 180;
    const x1 = 100, y1 = 240, x2 = x1 + 240 * Math.cos(r), y2 = y1 - 240 * Math.sin(r);
    return [x1, y1, x2, y2];
  };

  mount.innerHTML = `
    <h4>倾角感知（Cleveland 1984）</h4>
    <p class="demo-hint">人眼对斜率的感知 <strong>不是</strong> 线性。Cleveland 1984 实验：<strong>45° 倾角</strong> 是"看上去差距最小、最接近真实值"的角度。</p>
    <div class="slope-control">
      <label>角度：</label>
      <input type="range" id="angle" min="5" max="85" value="45">
      <span class="slope-readout" id="readout">45°</span>
    </div>
    <svg class="slope-svg" width="${W}" height="${H}" id="slope-svg"></svg>
    <div id="slope-expl"></div>
  `;

  const svg = d3.select(mount.querySelector("#slope-svg"));
  const expl = mount.querySelector("#slope-expl");
  const angleInput = mount.querySelector("#angle");
  const readout = mount.querySelector("#readout");

  function render() {
    angle = +angleInput.value;
    readout.textContent = angle + "°";
    svg.selectAll("*").remove();

    const [rx1, ry1, rx2, ry2] = line(45);
    svg.append("line").attr("x1", rx1).attr("y1", ry1).attr("x2", rx2).attr("y2", ry2)
      .attr("stroke", "#cbd5e1").attr("stroke-width", 1).attr("stroke-dasharray", "4 4");
    svg.append("text").attr("x", rx2 + 8).attr("y", ry2 + 4)
      .attr("font-size", 11).attr("fill", "#94a3b8").text("45° 参考");

    const [x1, y1, x2, y2] = line(angle);
    svg.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
      .attr("stroke", "#6366f1").attr("stroke-width", 3);
    svg.append("circle").attr("cx", x1).attr("cy", y1).attr("r", 5).attr("fill", "#6366f1");
    svg.append("circle").attr("cx", x2).attr("cy", y2).attr("r", 5).attr("fill", "#6366f1");

    svg.append("text").attr("x", x1 - 10).attr("y", y1 + 4)
      .attr("text-anchor", "end").attr("font-size", 12).text("起点");
    svg.append("text").attr("x", x2 + 10).attr("y", y2 + 4)
      .attr("font-size", 12).text("终点");

    const rad = (angle * Math.PI) / 180;
    const ax = x1 + 50 * Math.cos(rad / 2);
    const ay = y1 - 50 * Math.sin(rad / 2);
    svg.append("text").attr("x", ax).attr("y", ay)
      .attr("font-size", 12).attr("fill", "#4338ca").attr("font-weight", 600)
      .text(angle + "°");

    expl.innerHTML = `
      <h4>关键点</h4>
      <ul>
        <li><strong>Stevens 幂律</strong>：斜率感知 ≈ (真实斜率)^1.0 ~ 1.3 区间</li>
        <li><strong>45°</strong> 是视觉"中点"：人眼对靠近 45° 的斜率估计最准</li>
        <li>设计图表时：让关键数据斜率落在 30°-60°，避免在 0° 或 90° 附近做趋势对比</li>
        <li>例：增长曲线若是指数增长，前期很缓、后期很陡，应换 log 轴让斜率落在 ~45°</li>
      </ul>
    `;
  }

  angleInput.addEventListener("input", render);
  render();
};

// =========================================
//  d-4-5 · Marching Squares 等值线（4.5）
// =========================================
demos["d-4-5"] = async function (mount) {
  const N = 8;
  function field(x, y) {
    const cx = 3.5, cy = 4;
    return Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / 6) +
           0.3 * Math.exp(-((x - 1) ** 2 + (y - 6) ** 2) / 3);
  }
  const grid = [];
  for (let y = 0; y < N; y++) {
    grid.push([]);
    for (let x = 0; x < N; x++) grid[y].push(field(x, y));
  }

  const W = 720, H = 460;
  const cellSize = 40;
  const margin = 30;
  let threshold = 0.5;

  const EDGE_TABLE = [
    [],
    [[3, 0]],
    [[0, 1]],
    [[3, 1]],
    [[1, 2]],
    [[3, 0], [1, 2]],
    [[0, 2]],
    [[3, 2]],
    [[2, 3]],
    [[2, 0]],
    [[0, 1], [2, 3]],
    [[2, 1]],
    [[1, 3]],
    [[1, 0]],
    [[0, 3]],
    []
  ];

  mount.innerHTML = `
    <h4>Marching Squares 等值线</h4>
    <p class="demo-hint">标量场被离散化为网格后，给定阈值，追踪 <strong>值=阈值</strong> 的曲线。拖滑块改变阈值。</p>
    <div class="ms-threshold-control">
      <label>阈值：</label>
      <input type="range" id="th" min="0.05" max="0.95" step="0.05" value="0.5">
      <span class="slope-readout" id="th-readout">0.50</span>
    </div>
    <svg class="ms-svg" width="${W}" height="${H}" id="ms-svg"></svg>
    <div id="ms-expl"></div>
  `;

  const svg = d3.select(mount.querySelector("#ms-svg"));
  const thInput = mount.querySelector("#th");
  const readout = mount.querySelector("#th-readout");
  const expl = mount.querySelector("#ms-expl");

  function render() {
    threshold = +thInput.value;
    readout.textContent = threshold.toFixed(2);
    svg.selectAll("*").remove();

    const xMax = d3.max(grid.flat()), xMin = d3.min(grid.flat());
    const fillScale = d3.scaleSequential(d3.interpolateViridis).domain([xMin, xMax]);

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const px = margin + x * cellSize;
        const py = margin + y * cellSize;
        svg.append("rect")
          .attr("x", px).attr("y", py)
          .attr("width", cellSize).attr("height", cellSize)
          .attr("fill", fillScale(grid[y][x]))
          .attr("stroke", "#cbd5e1").attr("stroke-width", 0.5);
      }
    }

    for (let y = 0; y < N - 1; y++) {
      for (let x = 0; x < N - 1; x++) {
        const tl = grid[y][x],     tr = grid[y][x + 1];
        const bl = grid[y + 1][x], br = grid[y + 1][x + 1];
        let code = 0;
        if (bl > threshold) code |= 1;
        if (br > threshold) code |= 2;
        if (tr > threshold) code |= 4;
        if (tl > threshold) code |= 8;

        const lines = EDGE_TABLE[code];
        const px = margin + x * cellSize;
        const py = margin + y * cellSize;
        const edges = [
          [px, py + cellSize / 2],
          [px + cellSize / 2, py + cellSize],
          [px + cellSize, py + cellSize / 2],
          [px + cellSize / 2, py]
        ];

        lines.forEach(([a, b]) => {
          svg.append("line")
            .attr("x1", edges[a][0]).attr("y1", edges[a][1])
            .attr("x2", edges[b][0]).attr("y2", edges[b][1])
            .attr("class", "ms-contour");
        });
      }
    }

    expl.innerHTML = `
      <h4>关键点</h4>
      <ul>
        <li><strong>16 种 case</strong>：每个 cell 4 个角的"是否大于阈值"决定 case 编号 0-15</li>
        <li>每种 case 对应 0/1/2 条线段，把"超过阈值"和"未超过阈值"的两片区域分开</li>
        <li>扩展到 3D 叫 Marching Cubes（128 种 case）</li>
        <li>应用：地形等高线、医学 MRI 等值面、密度等高图</li>
      </ul>
    `;
  }

  thInput.addEventListener("input", render);
  render();
};


VIS['demos/lesson-04'] = { demos: demos };
})();

(function () {
// lesson-05 —— 各小节「演示」tab 的实现（由原 lesson.js 迁移，已抽出公共样板）
// 每个 demo 接收挂载元素 mount，向其注入 HTML 并用 d3 绘制。

// Doc-05 时序数据可视化 · 集成教学页面 · 5 个 demo
// =========================================
//   5.1 时间属性      → d-5-1 attributes
//   5.2 标准时序图    → d-5-2 french-names
//   5.3 日历热图     → d-5-3 cal-heatmap
//   5.4 阿基米德螺旋 → d-5-4 spiral
//   5.5 Storyline    → d-5-5 storyline
// =========================================

// d3 由 index.html 通过本地 vendor/d3.v7.min.js 预先加载到 window.d3（离线可用）
const d3 = window.d3;

// 本模块导出的 demo 注册表（key = 挂载点 id）
const demos = {};

// =========================================
//  d-5-1 · 时间属性（5.1）
// =========================================
demos["d-5-1"] = async function (mount) {
  const TIME_ATTRIBUTES = [
    { key: "ordered",             name: "有序性",      icon: "↗",  color: "#3b82f6",
      desc: "时间是有序的。两个事件发生的时间有先后次序，与因果关系紧密相连。",
      example: "火车时刻表、事件日志（log）、git commit history" },
    { key: "continuous",          name: "连续性",      icon: "∞",  color: "#10b981",
      desc: "时间是连续的。两个时间点之间总存在另一个时间点。",
      example: "实时传感器数据（温度、心率）、流式数据流" },
    { key: "periodic",            name: "周期性",      icon: "", color: "#f59e0b",
      desc: "许多自然过程有循环规律（季节、昼夜）。可采用循环时间域表示。",
      example: "24h 体温、12 个月气温、年周期销售" },
    { key: "spatial_independent", name: "独立于空间",  icon: "", color: "#8b5cf6",
      desc: "时间与空间紧相关，但科学过程大多将它们独立处理。",
      example: "折线图 x 轴只用时间、y 轴只用度量；时序不混用空间" },
    { key: "structured",          name: "结构性",      icon: "", color: "#ec4899",
      desc: "时间尺度分年/月/日/时/分/秒，分割既有自然反映（昼夜）也有人为定义。",
      example: "日历/周排列、闰年调整、工作日 vs 周末" }
  ];

  mount.innerHTML = `
    <h4>时间的 5 个核心属性</h4>
    <p class="demo-hint">点每张卡片 → 显示详细解释 + 影响哪些可视化设计。设计时序图前先确认这 5 个属性。</p>
    <div class="attr-grid" id="attr-grid"></div>
    <div class="attr-detail" id="attr-detail" style="margin-top:14px;">
      <p style="color:#94a3b8;font-size:13px;">↑ 点卡片查看详情</p>
    </div>
  `;

  const grid = mount.querySelector("#attr-grid");
  const detail = mount.querySelector("#attr-detail");

  function renderDetail(attr) {
    detail.innerHTML = `
      <div class="attr-detail-card" style="border-left:4px solid ${attr.color};">
        <h4>${attr.icon} ${attr.name} <small style="font-size:11px;color:#94a3b8;font-weight:400">key: ${attr.key}</small></h4>
        <p style="margin:6px 0 10px;color:#334155;line-height:1.7;">${attr.desc}</p>
        <div class="example">
          <strong>实际例子：</strong> ${attr.example}
        </div>
        <div class="visual-hint" style="margin-top:8px;font-size:12px;color:#64748b;">
          <strong>影响可视化：</strong>
          ${attr.key === 'ordered' ? '线图、散点图按时间排序，乱序会导致语义错误' :
            attr.key === 'continuous' ? '线图 vs 柱图的选用——连续数据用线，离散事件用柱/点' :
            attr.key === 'periodic' ? '螺旋图 / polar / 日历热图能更好表达周期性' :
            attr.key === 'spatial_independent' ? '避免在时序图中混用空间编码（颜色映射空间）' :
            '日历/工作日/闰年等特殊时间尺度要在数据预处理时正确处理'}
        </div>
      </div>
    `;
  }

  TIME_ATTRIBUTES.forEach(attr => {
    const card = document.createElement("div");
    card.className = "attr-card";
    card.style.borderTop = `4px solid ${attr.color}`;
    card.innerHTML = `
      <div class="attr-icon" style="color:${attr.color}">${attr.icon}</div>
      <div class="attr-name">${attr.name}</div>
      <div class="attr-key">key: ${attr.key}</div>
    `;
    card.addEventListener("click", () => renderDetail(attr));
    grid.appendChild(card);
  });
};

// =========================================
//  d-5-2 · 法国人名折线图（5.2）
// =========================================
demos["d-5-2"] = async function (mount) {
  const res = await fetch('./data/french_names.json');
  const data = await res.json();

  const W = 720, H = 380, M = { t: 30, r: 30, b: 50, l: 60 };
  const innerW = W - M.l - M.r, innerH = H - M.t - M.b;

  const parseYear = d3.timeParse("%Y");
  const series = {};
  Object.entries(data.names).forEach(([name, arr]) => {
    series[name] = arr.map(d => ({ year: parseYear(String(d.year)), count: d.count }));
  });

  const all = Object.values(series).flat();
  const xDomain = d3.extent(all, d => d.year);
  const yMax = d3.max(all, d => d.count);

  const xScale = d3.scaleTime().domain(xDomain).range([0, innerW]);
  const yScale = d3.scaleLinear().domain([0, yMax * 1.1]).range([innerH, 0]);

  const COLORS = { Marie: "#db2777", Jean: "#2563eb", Camille: "#059669" };

  mount.innerHTML = `
    <h4>法国人名使用频率（1900-2020）</h4>
    <p class="demo-hint">鼠标移到线上 → 黑色垂直参考线 + 圆点 + tip 显示具体数值。点击名字标签切换显示。</p>
    <div class="demo-control" id="name-tabs"></div>
    <svg class="ts-svg" width="${W}" height="${H}" id="lines"></svg>
    <div id="lines-note"></div>
  `;

  const tabs = mount.querySelector("#name-tabs");
  const svg = d3.select(mount.querySelector("#lines"));
  const visible = new Set(Object.keys(series));

  function render() {
    svg.selectAll("*").remove();

    svg.append("g").selectAll("line")
      .data(yScale.ticks(6)).enter().append("line")
      .attr("x1", M.l).attr("x2", M.l + innerW)
      .attr("y1", d => M.t + yScale(d)).attr("y2", d => M.t + yScale(d))
      .attr("stroke", "#e2e8f0");

    svg.append("g").attr("transform", `translate(${M.l},${M.t + innerH})`)
      .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.timeFormat("%Y")));
    svg.append("g").attr("transform", `translate(${M.l},${M.t})`)
      .call(d3.axisLeft(yScale).ticks(6));

    svg.append("text").attr("x", M.l + innerW / 2).attr("y", M.t + innerH + 36)
      .attr("text-anchor", "middle").style("font-size", "12px").text("年份 →");
    svg.append("text").attr("transform", `translate(${M.l - 44},${M.t + innerH/2}) rotate(-90)`)
      .attr("text-anchor", "middle").style("font-size", "12px").text("每年出生数 →");

    const line = d3.line()
      .x(d => xScale(d.year)).y(d => M.t + yScale(d.count))
      .curve(d3.curveMonotoneX);

    Object.entries(series).forEach(([name, arr]) => {
      if (!visible.has(name)) return;
      svg.append("path").datum(arr)
        .attr("fill", "none").attr("stroke", COLORS[name]).attr("stroke-width", 2.5)
        .attr("d", line);
    });

    const focus = svg.append("g").style("display", "none");
    focus.append("line").attr("class", "hover-line")
      .attr("y1", M.t).attr("y2", M.t + innerH).attr("stroke", "#1e293b").attr("stroke-width", 1);
    focus.append("text").attr("class", "tip").attr("text-anchor", "middle")
      .style("font-size", "11px").style("font-weight", "600");

    const overlay = svg.append("rect")
      .attr("x", M.l).attr("y", M.t).attr("width", innerW).attr("height", innerH)
      .attr("fill", "none").attr("pointer-events", "all");
    overlay.on("mouseover", () => focus.style("display", null))
      .on("mouseout",  () => focus.style("display", "none"))
      .on("mousemove", (event) => {
        const [mx] = d3.pointer(event);
        const date = xScale.invert(mx - M.l);
        const year = date.getFullYear();
        focus.attr("transform", `translate(${xScale(parseYear(String(year)))},0)`);
        const parts = Object.entries(series)
          .filter(([n]) => visible.has(n))
          .map(([n, arr]) => {
            const v = arr.find(d => d.year.getFullYear() === year);
            return `${n}: ${v ? v.count : '-'}人`;
          });
        focus.select("text").attr("y", M.t - 8).text(`${year} 年 — ${parts.join(" | ")}`);
      });
  }

  Object.keys(series).forEach(name => {
    const btn = document.createElement("label");
    btn.innerHTML = `<input type="checkbox" checked> ${name}`;
    btn.classList.add("active");
    btn.querySelector("input").addEventListener("change", e => {
      if (e.target.checked) { visible.add(name); btn.classList.add("active"); }
      else { visible.delete(name); btn.classList.remove("active"); }
      render();
    });
    tabs.appendChild(btn);
  });

  mount.querySelector("#lines-note").innerHTML = `
    <h4>关键点</h4>
    <ul>
      <li><code>d3.timeParse('%Y')</code> 把 '1965' 字符串转 Date 对象</li>
      <li><code>scaleTime</code> 自动按时间跨度选 tick 间隔（10 年间距）</li>
      <li>通用 hover 模板：透明矩形捕获 + focus g 显示垂直线 + 圆点 + 文字 tip</li>
    </ul>
  `;

  render();
};

// =========================================
//  d-5-3 · 日历热图（5.3）
// =========================================
demos["d-5-3"] = async function (mount) {
  const dataRaw = await d3.csv('./data/weather_2024.csv', d3.autoType);
  const byKey = new Map(dataRaw.map(d => [d.date, d.temp_max]));

  const year = 2024;
  const start = new Date(year, 0, 1);
  const end   = new Date(year + 1, 0, 1);

  const days = d3.timeDay.range(start, end).map(d => ({
    date: d,
    value: byKey.get(d3.timeFormat('%Y-%m-%d')(d)) ?? 0
  }));

  const colorScale = d3.scaleSequential(d3.interpolateRdYlBu).domain([30, -5]);

  const cellSize = 16;
  const W = 800, H = 220;
  const M = { t: 30, l: 30 };

  function weekColSunday(date) {
    return Math.floor(d3.timeDay.count(d3.timeYear.floor(date), date) / 7);
  }
  function dayIndexSunday(date) {
    return date.getDay();
  }
  function isFirstDayOfMonth(date) {
    return date.getDay() !== 0 && date.getMonth() > 0 && date.getDate() === 1;
  }
  function isMonthDivider(date) {
    const sevenDaysAgo = d3.timeDay.offset(date, -7);
    return date.getFullYear() !== sevenDaysAgo.getFullYear()
        || date.getMonth()    !== sevenDaysAgo.getMonth();
  }

  mount.innerHTML = `
    <h4>2024 年北京每日最高温（van Wijk 日历热图）</h4>
    <p class="demo-hint">x = 周（年内的第几周），y = 星期几，色 = 最高温（蓝=冷 / 红=热）。鼠标 hover 看具体数值。月份之间用红色分隔线。</p>
    <div class="ms-threshold-control">
      <label>colormap：</label>
      <select id="cmap">
        <option value="RdYlBu" selected>RdYlBu（红黄蓝）</option>
        <option value="Viridis">Viridis（顺序型）</option>
        <option value="Cividis">Cividis（顺序型 CVD）</option>
      </select>
    </div>
    <svg class="cal-svg" width="${W}" height="${H}" id="cal"></svg>
    <div id="cal-legend"></div>
  `;

  const svg = d3.select(mount.querySelector("#cal"));
  const sel = mount.querySelector("#cmap");
  const legend = mount.querySelector("#cal-legend");
  let g;  // 修复 g is not defined bug · 2026-09-09

  function render() {
    svg.selectAll("*").remove();
    const interp = d3['interpolate' + sel.value];
    colorScale.interpolator(interp);

    g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);

    g.selectAll("rect.cell")
      .data(days).join("rect")
      .attr("class", "cell")
      .attr("width", cellSize).attr("height", cellSize)
      .attr("x", d => weekColSunday(d.date) * cellSize)
      .attr("y", d => dayIndexSunday(d.date) * cellSize)
      .attr("rx", 1.5).attr("ry", 1.5)
      .attr("fill", d => colorScale(d.value))
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "#1e293b").attr("stroke-width", 1.5);
        showTip(event, `${d3.timeFormat("%Y-%m-%d")(d.date)} ${d.value.toFixed(1)}°C`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", null);
        hideTip();
      });

    g.selectAll("line.month-boundary")
      .data(days.filter(d => isFirstDayOfMonth(d.date)))
      .join("line")
      .attr("class", "month-boundary")
      .attr("x1", d => weekColSunday(d.date) * cellSize)
      .attr("x2", d => weekColSunday(d.date) * cellSize + cellSize)
      .attr("y1", d => dayIndexSunday(d.date) * cellSize)
      .attr("y2", d => dayIndexSunday(d.date) * cellSize)
      .attr("stroke", "#dc2626").attr("stroke-width", 1.5);

    g.selectAll("line.month-divider")
      .data(days.filter(d => isMonthDivider(d.date)))
      .join("line")
      .attr("class", "month-divider")
      .attr("x1", d => weekColSunday(d.date) * cellSize)
      .attr("x2", d => weekColSunday(d.date) * cellSize)
      .attr("y1", d => dayIndexSunday(d.date) * cellSize)
      .attr("y2", d => dayIndexSunday(d.date) * cellSize + cellSize)
      .attr("stroke", "#dc2626").attr("stroke-width", 1.5);

    const months = d3.timeMonth.range(start, end);
    g.selectAll("text.month-label")
      .data(months).join("text")
      .attr("class", "month-label")
      .attr("x", d => weekColSunday(d) * cellSize + 2)
      .attr("y", -8)
      .style("font-size", "10px").style("fill", "#475569")
      .text(d => d3.timeFormat("%b")(d));

    g.selectAll("text.day-label")
      .data(["日", "一", "二", "三", "四", "五", "六"])
      .join("text")
      .attr("class", "day-label")
      .attr("x", -4).attr("y", (_, i) => i * cellSize + cellSize - 4)
      .attr("text-anchor", "end")
      .style("font-size", "9px").style("fill", "#64748b")
      .text(d => d);

    legend.innerHTML = `
      <div class="cal-legend-bar">
        <span class="legend-low">-5°C</span>
        <div class="legend-strip" id="legend-strip"></div>
        <span class="legend-high">30°C</span>
      </div>
    `;
    const strip = mount.querySelector("#legend-strip");
    for (let i = 0; i <= 30; i++) {
      const t = -5 + (i / 30) * 35;
      const d = document.createElement("div");
      d.style.background = colorScale(t);
      strip.appendChild(d);
    }
  }

  function showTip(event, text) {
    let tip = mount.querySelector(".ts-tip");
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "ts-tip";
      tip.style.cssText = "position:absolute;background:#1e293b;color:white;padding:4px 8px;border-radius:3px;font-size:11px;pointer-events:none;z-index:1000;";
      document.body.appendChild(tip);
    }
    tip.textContent = text;
    tip.style.left = (event.pageX + 10) + "px";
    tip.style.top  = (event.pageY - 24) + "px";
  }
  function hideTip() {
    const tip = mount.querySelector(".ts-tip");
    if (tip) tip.remove();
  }

  sel.addEventListener("change", render);
  render();
};

// =========================================
//  d-5-4 · 阿基米德螺旋（5.4）
// =========================================
demos["d-5-4"] = async function (mount) {
  const dataRaw = await d3.csv('./data/weather_2024.csv', d3.autoType);
  const byKey = new Map(dataRaw.map(d => [d.date, d.temp_max]));
  const year = 2024;
  const start = new Date(year, 0, 1);
  const end   = new Date(year + 1, 0, 1);
  const days = d3.timeDay.range(start, end);

  const boxSize = 22;
  const coilGap = boxSize * 1.4;
  const b = coilGap / (2 * Math.PI);
  const startRadius = 60;
  let theta = (startRadius - 0) / b;

  function pos(t) {
    const r = 0 + b * t;
    return { x: r * Math.cos(t), y: r * Math.sin(t), r };
  }
  function angleDelta(r) { return boxSize / Math.sqrt(b * b + r * r); }

  const W = 720, H = 720;
  const M = { t: H / 2, l: W / 2 };

  const colorScale = d3.scaleSequential(d3.interpolateRdYlBu).domain([30, -5]);

  mount.innerHTML = `
    <h4>阿基米德螺旋日历（2024）</h4>
    <p class="demo-hint">每个回路 = 1 年（实际是 1 个周期）。鼠标 hover 看日期 + 温度。扇环角度动态调整：<code>Δθ = boxSize / √(b² + r²)</code> 让弧长近似相等。</p>
    <div class="ms-threshold-control">
      <label>每周起始：</label>
      <select id="weekstart">
        <option value="0" selected>周日</option>
        <option value="1">周一</option>
      </select>
    </div>
    <svg class="spiral-svg" width="${W}" height="${H}" id="spiral-svg"></svg>
    <div id="spiral-note"></div>
  `;

  const svg = d3.select(mount.querySelector("#spiral-svg"));
  const weekSel = mount.querySelector("#weekstart");

  function render() {
    svg.selectAll("*").remove();
    theta = (startRadius - 0) / b;
    const firstDayOfWeek = +weekSel.value;
    const offset = (firstDayOfWeek - start.getDay() + 7) % 7;
    const dayCount = 366;
    const segs = [];

    for (let i = 0; i < dayCount; i++) {
      const t0 = theta;
      const p = pos(t0);
      theta += angleDelta(p.r);
      const t1 = theta;
      const date = d3.timeDay.offset(start, i + offset);
      const dateKey = d3.timeFormat('%Y-%m-%d')(date);
      const value = byKey.get(dateKey);
      segs.push({ t0, t1, date, value });
    }

    const ringT = 1.4;
    svg.selectAll("path.seg")
      .data(segs).join("path")
      .attr("class", "seg")
      .attr("d", d => {
        const r0 = pos(d.t0).r, r1 = pos(d.t1).r;
        const rg0 = r0 + ringT, rg1 = r1 + ringT;
        const x0o = rg0 * Math.cos(d.t0), y0o = rg0 * Math.sin(d.t0);
        const x1o = rg1 * Math.cos(d.t1), y1o = rg1 * Math.sin(d.t1);
        const x1i = r1 * Math.cos(d.t1), y1i = r1 * Math.sin(d.t1);
        const x0i = r0 * Math.cos(d.t0), y0i = r0 * Math.sin(d.t0);
        return `M ${x0o} ${y0o} A ${rg0} ${rg0} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${r1} ${r1} 0 0 0 ${x0i} ${y0i} Z`;
      })
      .attr("fill", d => d.value != null ? colorScale(d.value) : "#e2e8f0")
      .attr("stroke", "#fff").attr("stroke-width", 0.5)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "#1e293b").attr("stroke-width", 1.5);
        showTip(event, `${d3.timeFormat('%Y-%m-%d')(d.date)}: ${d.value?.toFixed(1) ?? '-'}°C`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5);
        hideTip();
      });

    const months = d3.timeMonth.range(start, end);
    svg.selectAll("text.month-label")
      .data(months).join("text")
      .attr("class", "month-label")
      .attr("x", d => {
        const t = theta;
        return pos(t).r * Math.cos(t);
      })
      .attr("y", d => pos(theta).r * Math.sin(theta))
      .style("font-size", "10px").style("fill", "#475569")
      .text(d => d3.timeFormat("%b")(d));
  }

  function showTip(event, text) {
    let tip = mount.querySelector(".ts-tip");
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "ts-tip";
      tip.style.cssText = "position:absolute;background:#1e293b;color:white;padding:4px 8px;border-radius:3px;font-size:11px;pointer-events:none;z-index:1000;";
      document.body.appendChild(tip);
    }
    tip.textContent = text;
    tip.style.left = (event.pageX + 10) + "px";
    tip.style.top  = (event.pageY - 24) + "px";
  }
  function hideTip() {
    const tip = mount.querySelector(".ts-tip");
    if (tip) tip.remove();
  }

  svg.attr("viewBox", `${-M.l} ${-M.t} ${W} ${H}`);
  weekSel.addEventListener("change", render);
  render();
};

// =========================================
//  d-5-5 · Storyline（5.5，侏罗纪公园）
// =========================================
demos["d-5-5"] = async function (mount) {
  // 数据：侏罗纪公园 5 个角色
  const data = {
    title: "侏罗纪公园 (Jurassic Park, 1993)",
    duration_min: 127,
    characters: [
      { name: "Alan Grant & Kids", color: "#1976d2", width: 4, points: [
        { time:  5, y:  80 }, { time: 18, y: 130 }, { time: 38, y: 180 },
        { time: 65, y: 150 }, { time: 78, y:  80 }, { time: 88, y: 110 },
        { time:105, y:  60 }, { time:125, y:  40 }
      ]},
      { name: "T-REX", color: "#d32f2f", width: 6, points: [
        { time: 75, y: 280 }, { time: 78, y: 130 }, { time: 88, y: 200 },
        { time:100, y: 250 }, { time:120, y: 290 }
      ]},
      { name: "Raptors", color: "#f57c00", width: 4, points: [
        { time: 50, y: 320 }, { time: 80, y: 290 }, { time: 95, y: 230 },
        { time:108, y: 180 }, { time:118, y: 100 }
      ]},
      { name: "Malcolm", color: "#7b1fa2", width: 3, points: [
        { time: 22, y:  40 }, { time: 45, y:  90 }, { time: 70, y: 120 },
        { time: 82, y: 130 }, { time: 95, y: 200 }, { time:120, y: 240 }
      ]},
      { name: "Dilophosaurus", color: "#388e3c", width: 3, points: [
        { time: 38, y: 350 }, { time: 48, y: 320 }, { time: 58, y: 340 }
      ]}
    ],
    events: [
      { time: 78, x: 78, y: 105, name: "T-REX 攻击", desc: "T-REX 冲出围栏攻击 Alan & Kids 的车" },
      { time: 48, x: 48, y: 335, name: "Nedry 事件", desc: "Dilophosaurus 攻击 Nedry" }
    ]
  };

  const W = 800, H = 460, M = { t: 30, r: 30, b: 40, l: 110 };

  const xScale = d3.scaleLinear().domain([0, data.duration_min]).range([M.l, W - M.r]);
  const yScale = d3.scaleLinear().domain([0, 400]).range([H - M.b, M.t]);

  mount.innerHTML = `
    <h4>Storyline 时间线：《侏罗纪公园》5 角色</h4>
    <p class="demo-hint">每条彩色曲线 = 1 个角色的"生命线"。y 越靠近 = 角色聚拢（相遇/冲突）；y 远离 = 分离。半透明红圈 = 关键事件。鼠标 hover 看事件详情。</p>
    <div class="demo-control" id="alpha-control">
      <label>曲线张力：</label>
      <input type="range" id="alpha" min="0" max="1" step="0.1" value="0.5">
      <span class="slope-readout" id="alpha-readout">0.5</span>
    </div>
    <svg class="storyline-svg" width="${W}" height="${H}" id="storyline"></svg>
    <div id="storyline-note"></div>
  `;

  const svg = d3.select(mount.querySelector("#storyline"));
  const alphaInput = mount.querySelector("#alpha");
  const alphaReadout = mount.querySelector("#alpha-readout");
  const note = mount.querySelector("#storyline-note");

  function render() {
    const alpha = +alphaInput.value;
    alphaReadout.textContent = alpha.toFixed(1);
    svg.selectAll("*").remove();

    svg.append("g").selectAll("line")
      .data(d3.range(0, data.duration_min + 1, 20)).enter().append("line")
      .attr("x1", d => xScale(d)).attr("x2", d => xScale(d))
      .attr("y1", M.t).attr("y2", H - M.b)
      .attr("stroke", "#e2e8f0");

    svg.append("g").attr("transform", `translate(0,${H - M.b})`)
      .call(d3.axisBottom(xScale).ticks(8));
    svg.append("text").attr("x", W / 2).attr("y", H - 6)
      .attr("text-anchor", "middle").style("font-size", "11px").text("电影时间 (分钟) →");

    const line = d3.line()
      .x(d => xScale(d.time))
      .y(d => yScale(d.y))
      .curve(d3.curveCatmullRom.alpha(alpha));

    data.characters.forEach(c => {
      svg.append("path")
        .datum(c.points)
        .attr("d", line)
        .attr("stroke", c.color).attr("stroke-width", c.width)
        .attr("fill", "none").attr("opacity", 0.9);

      svg.append("text")
        .attr("x", M.l - 8)
        .attr("y", yScale(c.points[0].y))
        .attr("text-anchor", "end")
        .attr("font-size", "12px").attr("font-weight", 600)
        .attr("fill", c.color)
        .text(c.name);
    });

    const eventLayer = svg.append("g").attr("class", "event-layer");
    data.events.forEach(ev => {
      const ex = xScale(ev.time);
      const ey = yScale(ev.y);
      const grp = eventLayer.append("g").attr("class", "event")
        .style("cursor", "pointer")
        .on("mouseenter", (e) => showTip(e, `${ev.name}\n${ev.desc}`))
        .on("mouseleave", () => hideTip());
      grp.append("circle")
        .attr("cx", ex).attr("cy", ey).attr("r", 18)
        .attr("fill", "rgba(220, 38, 38, 0.15)").attr("stroke", "none");
      grp.append("circle")
        .attr("cx", ex).attr("cy", ey).attr("r", 4)
        .attr("fill", "#dc2626");
      grp.append("text")
        .attr("x", ex).attr("y", ey - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "10").attr("font-weight", 600).attr("fill", "#cc0000")
        .text(ev.name);
    });
  }

  function showTip(event, text) {
    let tip = mount.querySelector(".ts-tip");
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "ts-tip";
      tip.style.cssText = "position:absolute;background:#1e293b;color:white;padding:6px 10px;border-radius:4px;font-size:11px;pointer-events:none;z-index:1000;white-space:pre-line;max-width:200px;";
      document.body.appendChild(tip);
    }
    tip.textContent = text;
    tip.style.left = (event.pageX + 12) + "px";
    tip.style.top  = (event.pageY - 12) + "px";
  }
  function hideTip() {
    const tip = mount.querySelector(".ts-tip");
    if (tip) tip.remove();
  }

  alphaInput.addEventListener("input", render);

  note.innerHTML = `
    <h4>关键点</h4>
    <ul>
      <li><strong>3 大元素</strong>：时间尺度映射（<code>scaleLinear</code>）+ Catmull-Rom 样条（<code>alpha=0.5</code>）+ 事件层（红圈标注）</li>
      <li><strong>y 表达"关系"</strong>：T-REX 和 Grant 在 t=78 都画到 y=130，<strong>视觉聚拢 = "T-REX 攻击"</strong></li>
      <li><strong>alpha 调张力</strong>：0=接近直线，1=过度弯曲，0.5=标准（流动但不震荡）</li>
      <li><strong>事件层独立</strong>：半透明红圈 + 文字，可单独动画、独立筛选</li>
    </ul>
  `;

  render();
};


VIS['demos/lesson-05'] = { demos: demos };
})();

(function () {
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

const ROOT = new URL('../../', __VIS_SCRIPT_URL);
const siteUrl = (p) => new URL(p, ROOT).href;

const SUPPORTED = ['zh-CN', 'en-US'];
const STORAGE_KEY = 'vis.locale';
const DEFAULT_LOCALE = 'zh-CN';

let dict = null;
let locale = DEFAULT_LOCALE;
const listeners = new Set();

/** 接受 en / en-US / zh / zh-CN 等写法，归一化到规范 locale */
function normalizeLocale(v) {
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

async function initI18n() {
  if (dict) return locale;
  const res = await fetch(siteUrl('assets/data/ui.json'));
  if (!res.ok) throw new Error('ui.json 加载失败: ' + res.status);
  dict = await res.json();
  locale = resolveInitialLocale();
  document.documentElement.lang = locale;
  return locale;
}

function getLocale() { return locale; }
function isZh() { return locale === 'zh-CN'; }

/**
 * 数据文件的键名与本模块的 locale 标识不同：
 *   locale  : 'zh-CN' | 'en-US'（HTML lang、localStorage 用）
 *   数据键  : 'zh'    | 'en'   （JSON 里存双语正文用，更短）
 * 所有读取 JSON 正文的地方都要经过这个换算。
 */
function dataKey(loc) {
  return ((loc || locale) === 'zh-CN') ? 'zh' : 'en';
}

/** 取译文字符串；支持 {n} 形式的占位符 */
function t(key, vars) {
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

function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setLocale(next) {
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
function applyToDOM(root) {
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
function buildLangSwitcher(onChanged) {
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


VIS['i18n'] = { siteUrl: siteUrl, SUPPORTED: SUPPORTED, normalizeLocale: normalizeLocale, initI18n: initI18n, getLocale: getLocale, isZh: isZh, dataKey: dataKey, t: t, onLocaleChange: onLocaleChange, setLocale: setLocale, applyToDOM: applyToDOM, buildLangSwitcher: buildLangSwitcher };
})();

(function () {
const { siteUrl } = VIS['i18n'];

/* =============================================================
   store.js —— 数据加载与学习进度
   -------------------------------------------------------------
   数据分层（重构新增）：
     ui.json        UI 文案字典（i18n.js 使用）
     courses.json   轻量课程结构（章/小节标题、阅读时长）—— 首屏加载
     lesson-0X.json 单章正文（三 tab 的 HTML）—— 按需加载当前章
     lessons.json   全站搜索索引（含正文文本）—— 首次搜索时才加载
   ============================================================= */



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

function loadCourses() {
  if (!coursesPromise) coursesPromise = fetchJson(siteUrl('assets/data/courses.json'));
  return coursesPromise;
}

function loadLesson(id) {
  if (!lessonPromises.has(id)) {
    lessonPromises.set(id, fetchJson(siteUrl('assets/data/' + id + '.json')));
  }
  return lessonPromises.get(id);
}

/** 搜索索引较大，懒加载；失败后允许重试 */
function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = fetchJson(siteUrl('assets/data/lessons.json'))
      .catch((e) => { searchIndexPromise = null; throw e; });
  }
  return searchIndexPromise;
}

/** 各章「本章小结」（要点回顾），小文件，随首屏一起加载 */
let summariesPromise = null;
function loadSummaries() {
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

function isDone(sectionId) {
  return Object.prototype.hasOwnProperty.call(readStore(), sectionId);
}

function markDone(sectionId, done) {
  const store = readStore();
  if (done === false) delete store[sectionId];
  else store[sectionId] = Date.now();
  writeStore(store);
  return done !== false;
}

function toggleDone(sectionId) {
  return markDone(sectionId, !isDone(sectionId));
}

function getDoneIds() {
  return Object.keys(readStore());
}

function resetProgress() {
  writeStore({});
}

function onProgressChange(fn) {
  progressListeners.add(fn);
  return () => progressListeners.delete(fn);
}

/** 章节进度：{ done, total, percent } */
function chapterProgress(chapter) {
  const store = readStore();
  const total = chapter.sections.length;
  const done = chapter.sections.filter((s) => Object.prototype.hasOwnProperty.call(store, s.id)).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

/** 全站进度：{ done, total, percent, byChapter, next } */
function totalProgress(courses) {
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
function chapterReadMinutes(chapter) {
  return chapter.sections.reduce((sum, s) => sum + (s.readMin || 1), 0);
}


VIS['store'] = { loadCourses: loadCourses, loadLesson: loadLesson, loadSearchIndex: loadSearchIndex, loadSummaries: loadSummaries, isDone: isDone, markDone: markDone, toggleDone: toggleDone, getDoneIds: getDoneIds, resetProgress: resetProgress, onProgressChange: onProgressChange, chapterProgress: chapterProgress, totalProgress: totalProgress, chapterReadMinutes: chapterReadMinutes };
})();

(function () {
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
function dikwPyramid(lang) {
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
function d3Transforms(lang) {
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
function dataJoin(lang) {
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
function shneiderman(lang) {
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
function channelRanking(lang) {
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
function domEvents(lang) {
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
function colorSpaces(lang) {
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
function uniformity(lang) {
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
function colorHarmony(lang) {
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
function transformTypes(lang) {
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
function curveTypes(lang) {
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
function clevelandSlope(lang) {
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
function marchingSquares(lang) {
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
function seriesForms(lang) {
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
function calendarMapping(lang) {
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
function polarTransform(lang) {
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


VIS['figures'] = { dikwPyramid: dikwPyramid, d3Transforms: d3Transforms, dataJoin: dataJoin, shneiderman: shneiderman, channelRanking: channelRanking, domEvents: domEvents, colorSpaces: colorSpaces, uniformity: uniformity, colorHarmony: colorHarmony, transformTypes: transformTypes, curveTypes: curveTypes, clevelandSlope: clevelandSlope, marchingSquares: marchingSquares, seriesForms: seriesForms, calendarMapping: calendarMapping, polarTransform: polarTransform };
})();

(function () {
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

const hasInteractive = (sectionId) => Object.prototype.hasOwnProperty.call(SPECS, sectionId);

/** 把交互组件插到该小节「讲解」面板的最前面（比插图更靠前，便于上手试） */
function mountInteractive(article, sectionId, lang) {
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


VIS['interactive'] = { hasInteractive: hasInteractive, mountInteractive: mountInteractive };
})();

(function () {
const F = VIS['figures'];
const { isDone } = VIS['store'];
const { mountInteractive } = VIS['interactive'];

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
function knowledgeMapSvg(chapter, activeId, lang) {
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

function bindKnowledgeMap(container, onJump) {
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
function mountVisuals(article, sectionId, lang) {
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


VIS['visuals'] = { knowledgeMapSvg: knowledgeMapSvg, bindKnowledgeMap: bindKnowledgeMap, mountVisuals: mountVisuals };
})();

(function () {
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
function mindmapSvg(chapter, summary, lang) {
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
function bindMindmap(root, onJump) {
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


VIS['mindmap'] = { mindmapSvg: mindmapSvg, bindMindmap: bindMindmap };
})();

(function () {
const { getLocale, dataKey, siteUrl, t } = VIS['i18n'];

/* =============================================================
   glossary.js —— 术语表（本次新增）
   -------------------------------------------------------------
   两个使用方式：
     1. 正文里自动给术语加虚线下划线，悬停/点击弹出解释
        （每个术语在整页里最多标注 N 次，避免满屏下划线）
     2. 汇总页 site/glossary/ 列出全部术语，支持搜索
   数据来自 assets/data/glossary.json（中英对照 + 解释）。
   ============================================================= */



let glossary = null;
let glossaryPromise = null;
let tooltip = null;
let activeTerm = null;

function loadGlossary() {
  if (!glossaryPromise) {
    glossaryPromise = fetch(siteUrl('assets/data/glossary.json'))
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then((d) => {
        glossary = d.terms || [];
        return glossary;
      })
      .catch((e) => {
        glossaryPromise = null;
        throw e;
      });
  }
  return glossaryPromise;
}

function getGlossary() { return glossary || []; }

function findTerm(name) {
  if (!glossary) return null;
  return glossary.find((g) => g.zh === name || g.en === name) || null;
}

/* ---------------- 悬停提示 ---------------- */
function ensureTooltip() {
  if (tooltip) return tooltip;
  tooltip = document.createElement('div');
  tooltip.className = 'term-tip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.appendChild(tooltip);
  document.addEventListener('scroll', hideTip, { passive: true, capture: true });
  window.addEventListener('resize', hideTip);
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.term') && !e.target.closest('.term-tip')) hideTip();
  });
  return tooltip;
}

function showTip(el, term) {
  const tip = ensureTooltip();
  const lang = dataKey();
  const title = `${term.zh}${term.en && term.en !== term.zh ? ' · ' + term.en : ''}`;
  tip.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(term.desc[lang] || term.desc.zh)}</p>
    <a href="${siteUrl('glossary/index.html')}#${encodeURIComponent(term.zh)}" target="_blank" rel="noopener">${
    dataKey() === 'zh' ? '在术语表中查看 →' : 'Open in glossary →'}</a>`;
  tip.hidden = false;
  const r = el.getBoundingClientRect();
  const tw = tip.offsetWidth;
  const th = tip.offsetHeight;
  let left = r.left + window.scrollX + r.width / 2 - tw / 2;
  left = Math.max(8, Math.min(left, window.scrollX + document.documentElement.clientWidth - tw - 8));
  let top = r.top + window.scrollY - th - 8;
  if (top < window.scrollY + 4) top = r.bottom + window.scrollY + 8;   // 上面放不下就放下方
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
  activeTerm = el;
}

function hideTip() {
  if (tooltip) tooltip.hidden = true;
  activeTerm = null;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* ---------------- 正文标注 ---------------- */
const SKIP_TAGS = new Set(['PRE', 'CODE', 'A', 'BUTTON', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SVG', 'PATH', 'TEXT']);
const SKIP_CLOSEST = '.term, .visual-figure, .viz-interactive, .mindmap, .search-panel, .term-tip, .chapter-nav';

/**
 * 给 root 内正文里的术语加下划线。
 * @param root  容器（一般是当前激活小节）
 * @param maxPerTerm 这一次调用（通常是当前激活的那一个小节）里，同一术语最多标注几次；
 *                    调用方在小节切换时各自调用，因此计数不跨小节累计
 */
function applyGlossary(root, maxPerTerm = 2) {
  if (!glossary || !glossary.length || !root) return 0;
  const lang = dataKey();
  // 长词优先，避免「数据」把「数据质量」切碎
  const terms = glossary
    .map((g) => ({ g, name: lang === 'zh' ? g.zh : g.en }))
    .filter((x) => x.name && x.name.length >= 2)
    .sort((a, b) => b.name.length - a.name.length);

  const counts = new Map();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets = [];
  let node = walker.nextNode();
  while (node) {
    const p = node.parentElement;
    if (p && !SKIP_TAGS.has(p.tagName) && !p.closest(SKIP_CLOSEST)
        // SVG <text> 与标题不参与标注：前者塞 HTML 子节点会吞掉文字，后者会弄脏标题
        && !p.closest('svg') && !p.closest('h1,h2,h3,h4')
        && node.nodeValue.trim().length > 1) {
      targets.push(node);
    }
    node = walker.nextNode();
  }

  let wrapped = 0;
  targets.forEach((textNode) => {
    let current = textNode;
    let guard = 0;
    while (current && guard++ < 4) {
      const text = current.nodeValue;
      let hit = null;
      for (const term of terms) {
        const used = counts.get(term.g.zh) || 0;
        if (used >= maxPerTerm) continue;
        const idx = lang === 'zh' ? text.indexOf(term.name) : matchWord(text, term.name);
        if (idx >= 0 && (!hit || idx < hit.idx)) hit = { term, idx };
      }
      if (!hit) break;
      const name = lang === 'zh' ? hit.term.name : text.substr(hit.idx, hit.term.name.length);
      const before = current.nodeValue.slice(0, hit.idx);
      const after = current.nodeValue.slice(hit.idx + name.length);
      const span = document.createElement('span');
      span.className = 'term';
      span.dataset.term = hit.term.g.zh;
      span.tabIndex = 0;
      span.textContent = name;
      const binding = () => showTip(span, hit.term.g);
      span.addEventListener('mouseenter', binding);
      span.addEventListener('focus', binding);
      span.addEventListener('click', (e) => { e.preventDefault(); binding(); });
      span.addEventListener('mouseleave', hideTip);
      span.addEventListener('blur', hideTip);
      const parent = current.parentNode;
      if (!parent) break;
      // 把原文本节点拆成「前段 + 术语 span + 后段」，然后必须把原节点删掉，
      // 否则原文会连同新节点一起留在 DOM 里（表现为整句重复一遍）。
      const beforeNode = document.createTextNode(before);
      const rest = after ? document.createTextNode(after) : null;
      parent.insertBefore(beforeNode, current);
      parent.insertBefore(span, current);
      if (rest) parent.insertBefore(rest, current);
      parent.removeChild(current);
      current = rest;
      counts.set(hit.term.g.zh, (counts.get(hit.term.g.zh) || 0) + 1);
      wrapped += 1;
    }
  });
  return wrapped;
}

/** 英文按词边界匹配，避免 "data" 命中 "database" 内部 */
function matchWord(text, word) {
  const lower = text.toLowerCase();
  const w = word.toLowerCase();
  let from = 0;
  while (from <= lower.length - w.length) {
    const idx = lower.indexOf(w, from);
    if (idx < 0) return -1;
    const before = idx === 0 ? ' ' : lower[idx - 1];
    const after = idx + w.length >= lower.length ? ' ' : lower[idx + w.length];
    if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) return idx;
    from = idx + 1;
  }
  return -1;
}

function clearGlossaryMarks(root) {
  if (!root) return;
  root.querySelectorAll('.term').forEach((el) => {
    const txt = document.createTextNode(el.textContent);
    el.parentNode.replaceChild(txt, el);
  });
  if (root.normalize) root.normalize();
}

/* ---------------- 汇总页 ---------------- */
function renderGlossaryPage(host, lang) {
  const zh = lang === 'zh';
  const list = getGlossary();
  if (!list.length) {
    host.innerHTML = `<p class="viz-note">${zh ? '术语数据未加载' : 'glossary not loaded'}</p>`;
    return;
  }
  host.innerHTML = `
    <div class="gloss-search">
      <input type="search" id="glossFilter" autocomplete="off"
             placeholder="${zh ? '过滤术语…' : 'filter terms…'}" aria-label="${zh ? '过滤术语' : 'filter terms'}">
      <span class="gloss-count" id="glossCount"></span>
    </div>
    <dl class="gloss-list">
      ${list.map((g) => `
        <div class="gloss-item" id="${encodeURIComponent(g.zh)}" data-key="${escapeHtml((g.zh + ' ' + g.en).toLowerCase())}">
          <dt><span class="zh">${escapeHtml(g.zh)}</span><span class="en">${escapeHtml(g.en)}</span></dt>
          <dd>${escapeHtml(g.desc[lang] || g.desc.zh)}</dd>
        </div>`).join('')}
    </dl>`;
  const input = host.querySelector('#glossFilter');
  const count = host.querySelector('#glossCount');
  const items = [...host.querySelectorAll('.gloss-item')];
  const update = () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    items.forEach((it) => {
      const on = !q || it.dataset.key.includes(q) || it.querySelector('dd').textContent.toLowerCase().includes(q);
      it.hidden = !on;
      if (on) shown += 1;
    });
    count.textContent = zh ? `显示 ${shown} / ${items.length} 条` : `${shown} / ${items.length} shown`;
  };
  input.addEventListener('input', update);
  update();
  // 支持从正文跳转过来时直接定位（hash 完全由用户控制，畸形输入不能让整页挂掉）
  if (location.hash) {
    let raw = '';
    try {
      raw = decodeURIComponent(location.hash.slice(1));
    } catch (e) {
      raw = '';   // 例如 #% 这类畸形转义
    }
    const target = raw ? host.querySelector('.gloss-item[id="' + CSS.escape(raw) + '"]') : null;
    if (target) {
      target.classList.add('gloss-item--flash');
      target.scrollIntoView({ block: 'center' });
    }
  }
}

/** 顶栏「术语表」按钮：打开一个轻量弹层 */
function openGlossary(host) {
  const zh = dataKey() === 'zh';
  let overlay = document.getElementById('glossOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'glossOverlay';
    overlay.className = 'search-overlay';
    overlay.innerHTML = `
      <div class="search-panel gloss-panel" role="dialog" aria-modal="true"
           aria-label="${zh ? '术语表' : 'Glossary'}">
        <div class="search-head">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v18H6.5A2.5 2.5 0 0 1 4 18.5z"></path>
            <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H19"></path>
          </svg>
          <strong>${zh ? '术语表' : 'Glossary'}</strong>
          <button class="icon-btn" type="button" id="glossClose" aria-label="${t('search.close')}">✕</button>
        </div>
        <div class="search-results" id="glossBody"></div>
        <div class="search-foot"><span></span><span>Esc ${zh ? '关闭' : 'close'}</span></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') overlay.classList.remove('open');
    });
    overlay.querySelector('#glossClose').addEventListener('click', () => overlay.classList.remove('open'));
  }
  renderGlossaryPage(overlay.querySelector('#glossBody'), dataKey());
  overlay.classList.add('open');
}

/* ---------------- 初始化 ---------------- */
async function initGlossary() {
  try {
    await loadGlossary();
    return true;
  } catch (e) {
    console.warn('[glossary] 加载失败:', e.message);
    return false;
  }
}


VIS['glossary'] = { loadGlossary: loadGlossary, getGlossary: getGlossary, findTerm: findTerm, applyGlossary: applyGlossary, clearGlossaryMarks: clearGlossaryMarks, renderGlossaryPage: renderGlossaryPage, openGlossary: openGlossary, initGlossary: initGlossary };
})();

(function () {
const { t, getLocale, dataKey, siteUrl } = VIS['i18n'];
const { loadSearchIndex } = VIS['store'];

/* =============================================================
   search.js —— 全站搜索（重构新增）
   -------------------------------------------------------------
   · 索引在首次打开搜索面板时才加载（lessons.json 约 150KB，不拖慢首屏）
   · 命中范围：小节标题 / 小节内 h3 小标题 / 正文（讲解+代码+演示说明）
   · 结果可直接跳转到「章节 · 小节 · 讲解」，同章内不刷新页面
   ============================================================= */




let index = null;
let overlay = null;
let input = null;
let listEl = null;
let footEl = null;
let coursesRef = null;
let onJump = null;
let activeIdx = -1;
let results = [];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function buildOverlay() {
  overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.id = 'searchOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="search-panel">
      <div class="search-head">
        <svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path>
        </svg>
        <input id="searchInput" type="search" autocomplete="off" spellcheck="false"
               aria-label="${esc(t('search.label'))}">
        <button class="icon-btn" type="button" id="searchClose"
                aria-label="${esc(t('search.close'))}">✕</button>
      </div>
      <div class="search-results" id="searchResults" role="listbox"></div>
      <div class="search-foot">
        <span id="searchCount"></span>
        <span>↑ ↓ 选择 · Enter 打开 · Esc 关闭</span>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  input = overlay.querySelector('#searchInput');
  listEl = overlay.querySelector('#searchResults');
  footEl = overlay.querySelector('#searchCount');

  input.placeholder = t('search.placeholder');
  input.addEventListener('input', debounce(run, 140));
  input.addEventListener('keydown', onInputKey);
  overlay.querySelector('#searchClose').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
}

function debounce(fn, ms) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** 标题 / 小标题 / 正文三级加权（lang 为数据键：'zh' / 'en'） */
function score(query, sec, lang) {
  const q = query.toLowerCase();
  const title = (sec.title && (sec.title[lang] || sec.title.zh)) || '';
  const body = (sec.search && (sec.search[lang] || sec.search.zh)) || '';
  let s = 0;
  let snippet = '';

  if (title.toLowerCase().includes(q)) s += 120;
  (sec.outline || []).forEach((o) => {
    const ot = (o[lang] || o.zh || '');
    if (ot && ot.toLowerCase().includes(q)) s += 28;
  });
  const pos = body.toLowerCase().indexOf(q);
  if (pos >= 0) {
    s += 12;
    const start = Math.max(0, pos - 36);
    snippet = (start > 0 ? '…' : '') + body.slice(start, pos + 110).trim() + '…';
  }
  // 同时命中标题与正文，说明更相关
  if (s > 0 && pos >= 0 && title.toLowerCase().includes(q)) s += 40;
  return { s, snippet };
}

function highlight(text, query) {
  const safe = esc(text);
  if (!query) return safe;
  const q = esc(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    return safe.replace(new RegExp(q, 'gi'), (m) => '<mark>' + m + '</mark>');
  } catch (e) {
    return safe;
  }
}

function run() {
  const query = input.value.trim();
  activeIdx = -1;
  // 索引尚未就绪（首次加载中或加载失败）时不做任何事，否则下面会读 index.chapters 报错
  if (!index) return;
  if (!query) {
    listEl.innerHTML = `<div class="search-empty">${esc(t('search.empty'))}</div>`;
    footEl.textContent = '';
    results = [];
    return;
  }
  const lang = dataKey();
  const out = [];
  index.chapters.forEach((ch) => {
    const course = coursesRef.chapters.find((c) => c.id === ch.id);
    ch.sections.forEach((sec) => {
      const { s, snippet } = score(query, sec, lang);
      if (s > 0) out.push({ chapter: course, section: sec, score: s, snippet });
    });
  });
  out.sort((a, b) => b.score - a.score);
  results = out.slice(0, 40);

  if (!results.length) {
    listEl.innerHTML = `<div class="search-empty">${esc(t('search.noresult'))}</div>`;
    footEl.textContent = '';
    return;
  }
  footEl.textContent = t('search.results', { n: results.length });
  listEl.innerHTML = results.map((r, i) => `
    <a class="search-result" href="${href(r)}" data-idx="${i}" role="option" aria-selected="false">
      <div class="sr-crumb">${esc(t(r.chapter.navKey))} · ${esc(t('search.in'))} ${esc(r.section.id)}</div>
      <div class="sr-title">${highlight((r.section.title[lang] || r.section.title.zh), query)}</div>
      ${r.snippet ? `<div class="sr-snippet">${highlight(r.snippet, query)}</div>` : ''}
    </a>`).join('');
  listEl.querySelectorAll('.search-result').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const r = results[Number(el.dataset.idx)];
      jump(r);
    });
  });
  input.focus();
}

function href(r) {
  // 章节 id 与小节 id 都来自仓库内数据，这里再校验一次格式（纵深防御），
  // 避免将来数据源变化时把任意字符串拼进 href
  const okCh = /^lesson-\d{2}$/.test(r.chapter.id);
  const okSec = /^[\w-]+$/.test(r.section.id);
  if (!okCh || !okSec) {
    // 正常不会发生；出现说明数据命名漂移，留下线索而不是静默降级
    console.warn('[search] 非预期的 id 格式:', r.chapter.id, r.section.id);
  }
  const ch = okCh ? r.chapter.id : 'lesson-01';
  const sec = okSec ? r.section.id : '';
  return siteUrl(ch + '/index.html' + (sec ? '#' + sec + '/explain' : ''));
}

function jump(r) {
  close();
  const here = document.body.dataset.lesson;
  if (here && r.chapter.id === here && onJump) {
    onJump(r.section.id);
  } else {
    location.href = href(r);
  }
}

function onInputKey(e) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!results.length) return;
    activeIdx = (activeIdx + (e.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length;
    listEl.querySelectorAll('.search-result').forEach((el, i) => {
      const on = i === activeIdx;
      el.classList.toggle('active', on);
      el.setAttribute('aria-selected', String(on));
      if (on) el.scrollIntoView({ block: 'nearest' });
    });
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (activeIdx >= 0 && results[activeIdx]) jump(results[activeIdx]);
    else if (results.length) jump(results[0]);
  }
}

function open() {
  overlay.classList.add('open');
  input.value = '';
  listEl.innerHTML = `<div class="search-empty">${esc(t('search.empty'))}</div>`;
  footEl.textContent = '';
  input.focus();
  if (!index) {
    listEl.innerHTML = `<div class="search-empty">${esc(t('common.loading'))}</div>`;
    loadSearchIndex()
      .then((data) => {
        index = data;
        input.placeholder = t('search.placeholder');
        run();
      })
      .catch((e) => {
        listEl.innerHTML = `<div class="search-empty">搜索索引加载失败：${esc(e.message)}</div>`;
      });
  }
}

function close() {
  overlay.classList.remove('open');
}

function initSearch({ courses, onSectionJump }) {
  coursesRef = courses;
  onJump = onSectionJump;
  buildOverlay();
  return { open, close };
}




VIS['search'] = { initSearch: initSearch, openSearch: open, closeSearch: close };
})();

(function () {
const { initI18n, t, getLocale, dataKey, buildLangSwitcher, applyToDOM, onLocaleChange, siteUrl } = VIS['i18n'];
const { loadCourses, loadLesson, loadSummaries, isDone, toggleDone, onProgressChange, chapterProgress, chapterReadMinutes } = VIS['store'];
const { mountVisuals, knowledgeMapSvg, bindKnowledgeMap } = VIS['visuals'];
const { mindmapSvg, bindMindmap } = VIS['mindmap'];
const { initGlossary, applyGlossary, openGlossary, findTerm, clearGlossaryMarks } = VIS['glossary'];
const { initSearch } = VIS['search'];

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
  if (!demosModulePromise) demosModulePromise = Promise.resolve(VIS['demos/' + lessonId]);
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


VIS['lesson-app'] = {  };
})();

})();
