# -*- coding: utf-8 -*-
"""
把 site/ 打包成「双击 index.html 就能用」的纯静态版本。

背景：
    站点源码用 ES modules（import/export）和 fetch 读数据。
    浏览器在 file:// 下会拦截这两类请求，直接双击只看到空壳。
    本脚本做三件事：
      1. 把各入口的模块依赖按拓扑序合成经典脚本（IIFE + 全局 VIS 命名空间）
      2. 把所有 JSON / CSV 内嵌成一份 offline-data.js，并注入 fetch 垫片
      3. 生成 4 个入口包：portal / lesson / glossary / supplementary

用法：
    cd site && python3 build/make_offline.py
"""
import json
import os
import posixpath
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(HERE, '..'))
JS_DIR = os.path.join(SITE, 'assets', 'js')

MODULES = [
    'i18n', 'store', 'figures', 'interactive', 'mindmap', 'visuals',
    'glossary', 'search',
    'demos/lesson-01', 'demos/lesson-02', 'demos/lesson-03',
    'demos/lesson-04', 'demos/lesson-05',
    'lesson-app', 'portal', 'glossary-page', 'supplementary',
]

BUNDLES = {
    'portal': ['portal'],
    # demo 模块是动态 import 的，静态依赖图里看不到，这里显式列在入口前面
    'lesson': ['demos/lesson-01', 'demos/lesson-02', 'demos/lesson-03',
               'demos/lesson-04', 'demos/lesson-05', 'lesson-app'],
    'glossary': ['glossary-page'],
    'supplementary': ['supplementary'],
}

IMPORT_NS = re.compile(r"import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+'([^']+)';")
IMPORT_NAMED = re.compile(r"import\s*\{([^}]*)\}\s*from\s*'([^']+)';", re.S)
EXPORT_DECL = re.compile(r"export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)")
EXPORT_BLOCK = re.compile(r"export\s*\{([^}]*)\}\s*;?")


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def key_for(spec, from_key):
    """'./store.js' -> 'store'；'./demos/lesson-01.js' -> 'demos/lesson-01'"""
    base = posixpath.dirname(from_key)
    path = posixpath.normpath(posixpath.join(base, spec))
    if path.endswith('.js'):
        path = path[:-3]
    return path


def parse_module(key):
    src = read(os.path.join(JS_DIR, key + '.js'))
    deps = []
    prelude = []

    for m in IMPORT_NS.finditer(src):
        alias, spec = m.group(1), m.group(2)
        dep = key_for(spec, key)
        deps.append(dep)
        prelude.append("const %s = VIS['%s'];" % (alias, dep))
    src = IMPORT_NS.sub('', src)

    for m in IMPORT_NAMED.finditer(src):
        names = [x.strip() for x in m.group(1).split(',') if x.strip()]
        spec = m.group(2)
        dep = key_for(spec, key)
        deps.append(dep)
        prelude.append('const { %s } = VIS[\'%s\'];' % (', '.join(names), dep))
    src = IMPORT_NAMED.sub('', src)

    exports = []          # (exportedName, localName)
    for m in EXPORT_DECL.finditer(src):
        name = m.group(1)
        exports.append((name, name))
    for m in EXPORT_BLOCK.finditer(src):
        for part in m.group(1).split(','):
            part = part.strip()
            if not part:
                continue
            if ' as ' in part:
                local, alias = [x.strip() for x in part.split(' as ')]
            else:
                local = alias = part
            exports.append((alias, local))

    src = EXPORT_DECL.sub(lambda m: m.group(0)[len('export '):], src)
    src = EXPORT_BLOCK.sub('', src)
    return src, deps, prelude, exports


def transform(key):
    src, deps, prelude, exports = parse_module(key)

    # 动态 import：改成从全局命名空间取
    src = src.replace("import('./demos/' + lessonId + '.js')",
                      "Promise.resolve(VIS['demos/' + lessonId])")
    src = src.replace("await import('./store.js')", "await Promise.resolve(VIS.store)")
    # import.meta.url：经典脚本里用当前脚本地址代替
    src = src.replace('import.meta.url', '__VIS_SCRIPT_URL')

    alias = ', '.join('%s: %s' % (a, l) for a, l in exports)
    body = '\n'.join(prelude) + ('\n\n' if prelude else '') + src
    body += "\n\nVIS['%s'] = { %s };\n" % (key, alias)
    return deps, "(function () {\n" + body + "})();\n"


def topo(entries):
    seen, order = set(), []

    def visit(key):
        if key in seen:
            return
        seen.add(key)
        deps, _ = transform(key) if key not in cache else (cache[key][0], None)
        for d in deps:
            visit(d)
        order.append(key)

    cache = {}
    for key in MODULES:
        deps, code = transform(key)
        cache[key] = (deps, code)
    for e in entries:
        visit(e)
    return [(k, cache[k][1]) for k in order]


def data_script():
    lines = [
        "/* 本文件由 build/make_offline.py 生成：内嵌 JSON / CSV + fetch 垫片。不要手改。 */",
        "(function () {",
        "  window.__VIS_ROOT__ = new URL('../../', document.currentScript.src).href;",
        "  window.__VIS_JSON__ = window.__VIS_JSON__ || {};",
        "  window.__VIS_TEXT__ = window.__VIS_TEXT__ || {};",
    ]
    jsons, texts = {}, {}
    for root, dirs, files in os.walk(SITE):
        dirs[:] = [d for d in dirs if d not in ('.git', 'vendor', 'node_modules')]
        for name in sorted(files):
            path = os.path.join(root, name)
            rel = os.path.relpath(path, SITE).replace(os.sep, '/')
            if name.endswith('.json'):
                try:
                    jsons[rel] = json.loads(read(path))
                except Exception as e:
                    print('  ! 跳过 JSON', rel, e)
            elif name.endswith('.csv'):
                texts[rel] = read(path)

    lines.append('  Object.assign(window.__VIS_JSON__, %s);' % json.dumps(
        jsons, ensure_ascii=False, separators=(',', ':')))
    lines.append('  Object.assign(window.__VIS_TEXT__, %s);' % json.dumps(
        texts, ensure_ascii=False, separators=(',', ':')))

    lines.append(r'''
  /* fetch 垫片：把站点内的 JSON / CSV 请求直接返回内嵌内容，
     file:// 下也能让 d3.csv / fetch 正常工作 */
  if (window.fetch) {
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        var abs = new URL(url, document.baseURI).href;
        var root = window.__VIS_ROOT__ || '';
        if (root && abs.indexOf(root) === 0) {
          var rel = abs.slice(root.length).split('?')[0].split('#')[0];
          var isJson = Object.prototype.hasOwnProperty.call(window.__VIS_JSON__, rel);
          var isText = Object.prototype.hasOwnProperty.call(window.__VIS_TEXT__, rel);
          if (isJson || isText) {
            var body = isJson ? JSON.stringify(window.__VIS_JSON__[rel]) : window.__VIS_TEXT__[rel];
            var type = isJson ? 'application/json' : 'text/csv';
            return Promise.resolve(new Response(body, {
              status: 200,
              headers: { 'Content-Type': type + ';charset=utf-8' }
            }));
          }
        }
      } catch (e) { /* 落到原生 fetch */ }
      return nativeFetch(input, init);
    };
  }
})();
''')
    return '\n'.join(lines)


def main():
    total = 0
    out_dir = os.path.join(SITE, 'assets', 'js')
    for name, entries in BUNDLES.items():
        code = [
            '/* 本文件由 build/make_offline.py 生成：%s 入口。不要手改。 */' % name,
            '(function () {',
            "  'use strict';",
            '  var VIS = window.VIS = window.VIS || {};',
            "  var __VIS_SCRIPT_URL = document.currentScript ? document.currentScript.src : document.baseURI;",
        ]
        for key, mod_code in topo(entries):
            code.append(mod_code)
        code.append('})();\n')
        out = os.path.join(out_dir, 'offline-%s.js' % name)
        with open(out, 'w', encoding='utf-8') as f:
            f.write('\n'.join(code))
        size = os.path.getsize(out)
        total += size
        print('  %-28s %7.1f KB' % ('assets/js/offline-%s.js' % name, size / 1024))

    data = data_script()
    out = os.path.join(SITE, 'assets', 'data', 'offline-data.js')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(data)
    size = os.path.getsize(out)
    total += size
    print('  %-28s %7.1f KB' % ('assets/data/offline-data.js', size / 1024))
    print('\n合计 %.1f KB' % (total / 1024))


if __name__ == '__main__':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
    main()
