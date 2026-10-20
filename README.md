# 《可视化导论》课程网站 · 重构版

中国石油大学（华东）《可视化导论》课程网站的重构版本。
原站：<https://cinger007.github.io/vis/>

重构目标：**让内容展现更清晰、更适合学习**，并补齐原站在工程与可用性上的缺陷。
技术栈：纯 HTML + CSS + 原生 JavaScript + 本地 D3.js v7，无任何运行时依赖。

> 在线预览：<https://liquanlianshi.github.io/vis-course-site/>
>
> **双击 `index.html` 即可完整浏览**：入口脚本与课程数据已经打包成经典脚本，
> 不再依赖本地服务器或 `file://` 下会被拦截的 ES modules / fetch。

---

## 一、如何运行

**直接双击 `index.html`**（macOS / Windows 都可以），浏览器会以 `file://` 打开完整站点：
门户、章节页、代码、演示、搜索、术语表、补充 demo 全部可用，不需要安装环境或启动服务器。

之所以能做到：入口脚本是经典脚本（不是 ES modules），课程 JSON / CSV 数据内嵌在
`assets/data/offline-data.js` 里，并附带一个只服务站内文件的 fetch 垫片。

```text
双击 index.html  →  完整站点
```

如果仍然用本地服务器访问（如 `python -m http.server 8080`），同样可以，行为一致。

### 修改源码后

`assets/js/offline-*.js` 与 `assets/data/offline-data.js` 是**生成产物**，源码仍是
`assets/js/` 下的 ES modules 与 `assets/data/*.json`。改完源码/数据后重新生成：

```bash
cd site
python3 build/make_offline.py
```

生成脚本是 `site/build/make_offline.py`，纯 Python 标准库，不需要安装任何第三方依赖。

部署到任意静态托管（GitHub Pages / Netlify / Nginx / 校园服务器）时，
把 `site/` 目录内容整体上传即可，无需任何构建步骤。

```bash
# 若使用 GitHub Pages 且已登录 GitHub CLI，可用仓库内的一键脚本：
bash deploy-to-github-pages.sh          # 默认仓库名 vis
bash deploy-to-github-pages.sh 仓库名
bash deploy-to-github-pages.sh vis --dry-run   # 只预览，不做改动
```

> 站点已内置 D3.js 与 d3-regression，**不依赖任何外部 CDN**，断网或校园网
> 屏蔽 CDN 时依然可用。

---

## 二、目录结构

```
site/
├── index.html                课程门户（hero + 进度总览 + 章节卡片 + 使用方式 + 关于）
├── lesson-01/ … lesson-05/   5 个章节页
│   ├── index.html            薄壳（约 2KB，只声明“这一页是第几章”）
│   ├── data/                 该章用到的 CSV / JSON 数据
│   ├── img/                  该章的图片（第 2 章有 5 张理论配图）
│   ├── demo/                 可单独打开的 demo 集合（第 1 章）
│   └── lecture.md            完整讲义 markdown
├── supplementary/            补充 demo 集合（15 个独立小 demo，可单独打开）
├── glossary/                 术语表汇总页（31 条中英对照，支持实时过滤）
├── build/
│   └── make_offline.py       生成「双击可开」的入口包与内嵌数据
└── assets/
    ├── css/
    │   ├── tokens.css        设计令牌（颜色 / 字体 / 间距 / 圆角 / 阴影 / 层级）
    │   ├── base.css          重置、排版基线、通用按钮与卡片
    │   ├── course.css        章节页（顶栏 / 目录 / 三 tab / 演示 / 搜索面板）
    │   ├── portal.css        门户与补充 demo 索引页
    │   └── widgets.css       可视化图形、交互组件、思维导图、小结、术语表
    ├── js/
    │   ├── offline-portal.js  ← 生成产物：门户入口包
    │   ├── offline-lesson.js  ← 生成产物：章节页入口包（含 5 章 demo）
    │   ├── offline-glossary.js / offline-supplementary.js
    │   ├── i18n.js           双语引擎（数据驱动，locale ↔ 数据键换算）
    │   ├── store.js          数据加载 + 学习进度（localStorage）
    │   ├── lesson-app.js     章节页应用（渲染 / tab / 深链 / 键盘 / 导读）
    │   ├── portal.js         门户逻辑（进度总览 / 卡片 / 搜索入口）
    │   ├── search.js         全站搜索（索引懒加载）
    │   ├── visuals.js        可视化图形入口（知识地图 + 第一批插图）
    │   ├── figures.js        新增概念插图 16 张（DIKW / 通道排序 / 曲线类型…）
    │   ├── interactive.js    4 个交互式组件（通道对比 / colormap / 色觉模拟 / 时间粒度）
    │   ├── mindmap.js        每章结构思维导图（由课程结构自动生成）
    │   ├── glossary.js       术语表（正文悬停解释 + 汇总页渲染）
    │   ├── glossary-page.js  术语表汇总页入口
    │   ├── supplementary.js  补充 demo 索引页
    │   └── demos/
    │       └── lesson-0N.js  各章「演示」tab 的实现
    ├── data/
    │   ├── offline-data.js   ← 生成产物：内嵌 JSON / CSV + fetch 垫片
    │   ├── ui.json           UI 文案字典（中英各一份，key 一一对应）
    │   ├── courses.json      轻量课程结构（含每节小标题，供思维导图用）
    │   ├── lesson-0N.json    单章正文（按需加载当前章）
    │   ├── summaries.json    每章「本章小结」（要点 + 关键术语）
    │   ├── glossary.json     术语表数据（31 条）
    │   └── lessons.json      全站搜索索引（首次搜索时懒加载）
    └── vendor/               本地第三方库（d3 7.9.0、d3-regression 1.3.10）
```

---

## 三、内容怎么改

正文与呈现是分离的——**改内容只需要改 JSON，不用碰 HTML/CSS**。

| 想改什么 | 改哪里 |
| --- | --- |
| 某小节的讲解 / 代码 / 演示说明 | `assets/data/lesson-0N.json` 里对应小节的 `panels.explain / code / demo`，`zh` 与 `en` 各一份 |
| 小节标题、副标题 | 同上，`title` / `subtitle` 字段 |
| 章节卡片文案、门户文案 | `assets/data/ui.json`（注意中英两份 key 要一一对应） |
| 顶栏导航文字 | `ui.json` 的 `nav.ch1 … nav.ch5` |
| 配色 / 字号 / 间距 | `assets/css/tokens.css`（改一处全站生效） |
| 某个演示的交互 | `assets/js/demos/lesson-0N.js` |

> **改完内容记得重新打包**：双击打开的是 `assets/data/offline-data.js` 里内嵌的数据，
> 改完 `assets/data/*.json` 或 `assets/js/*.js` 后，执行 `cd site && python3 build/make_offline.py`，
> 否则浏览器里看到的还是旧内容。

`courses.json` 与 `lessons.json` 是章节结构/搜索索引，一般不用手改；
若调整了小节标题，需要同步这两个文件后再重新打包。

---

## 四、离线打包脚本

`build/make_offline.py` 只做一件事：把 ES modules 源码按入口合并成经典脚本，
并把 `assets/data/` 下的 JSON 与各章 CSV 内嵌成 `offline-data.js`，
让 `file://` 下双击 `index.html` 也能完整运行。

```bash
cd site
python3 build/make_offline.py
```

脚本只用 Python 标准库，输出四个入口包：

| 产物 | 用于 |
| --- | --- |
| `assets/js/offline-portal.js` | 课程门户 |
| `assets/js/offline-lesson.js` | 5 个章节页（含各章 demo） |
| `assets/js/offline-glossary.js` | 术语表 |
| `assets/js/offline-supplementary.js` | 补充 demo 索引 |

单文件 demo（`lesson-01/demo/`、`supplementary/*.html`）不合并，只引用
`assets/data/offline-data.js` 来获得内嵌 CSV。

> 从原始讲义批量重建索引、迁移资源的旧构建脚本未随本次前端交付，当前目录只需要
> `make_offline.py`。

---

## 五、已知取舍

- **讲义 markdown 只保留中文一份**：原站同时有 `lecture.md` / `lecture-en.md`
  与逐段重复的 `01-数据.md` 等副本；网页正文已支持中英切换，故只保留一份 markdown。
- **补充 demo 中的 PDF 讲义未包含**：体积较大，且课程内容已结构化进站点正文。
- **`volumeRendering.html` / `yearcalendar.html` 两个卡片已移除**：原站索引页
  指向这两个文件，但仓库里并不存在（死链）。
