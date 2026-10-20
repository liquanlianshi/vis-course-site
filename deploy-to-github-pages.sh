#!/usr/bin/env bash
# =============================================================
# 一键把重构后的站点发布到 GitHub Pages，得到作业要求的「网页链接」
#
# 用法（在解压后的网站目录里执行，或指定目录）：
#     bash 一键部署到GitHubPages.sh                 # 默认仓库名 vis
#     bash 一键部署到GitHubPages.sh my-vis-homework  # 自定仓库名
#     bash 一键部署到GitHubPages.sh vis --dry-run   # 只打印将执行的命令，不做改动
#
# 前置条件：已安装并登录 GitHub CLI（gh auth status 显示已登录）
# 说明：脚本会在你的 GitHub 账号下创建一个 public 仓库并推送站点内容。
#       站点是纯静态的，仓库名即访问路径的一部分。
# =============================================================
set -euo pipefail

REPO_NAME="${1:-vis}"
DRY_RUN="${2:-}"
SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run() {
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] $*"
  else
    echo "  \$ $*"
    "$@"
  fi
}

echo "=========================================="
echo " 发布《可视化导论》重构版到 GitHub Pages"
echo " 站点目录: $SITE_DIR"
echo " 仓库名称: $REPO_NAME"
[ "$DRY_RUN" = "--dry-run" ] && echo " 模式: 仅演示（不产生任何改动）"
echo "=========================================="

# ---------- 1. 检查 gh 登录 ----------
if ! command -v gh >/dev/null 2>&1; then
  echo "✗ 未找到 gh（GitHub CLI）。请先安装：https://cli.github.com/"
  echo "  或者改用 Netlify Drop：把本文件夹拖到 https://app.netlify.com/drop"
  exit 1
fi
if [ "$DRY_RUN" != "--dry-run" ] && ! gh auth status >/dev/null 2>&1; then
  echo "✗ 尚未登录 GitHub，请先执行：gh auth login"
  exit 1
fi
OWNER="$(gh api user -q .login 2>/dev/null || echo 你的用户名)"
echo "账号: $OWNER"

# ---------- 2. 本地提交 ----------
cd "$SITE_DIR"
if [ ! -d .git ]; then
  run git init -q
fi
run git add -A
run git -c user.name="${OWNER}" -c user.email="${OWNER}@users.noreply.github.com" \
    commit -q -m "重构《可视化导论》课程网站：内容与呈现分离、双语单一数据源、新增可视化图形与学习功能" \
    || echo "  （没有新的改动需要提交）"
run git branch -M main

# ---------- 3. 创建远端仓库并推送 ----------
if gh repo view "$OWNER/$REPO_NAME" >/dev/null 2>&1; then
  echo "仓库 $OWNER/$REPO_NAME 已存在，改为推送内容"
  run git remote remove origin 2>/dev/null || true
  run git remote add origin "https://github.com/$OWNER/$REPO_NAME.git"
  run git push -u origin main
else
  run gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
fi

# ---------- 4. 开启 Pages（main 分支根目录）----------
echo "开启 GitHub Pages…"
if [ "$DRY_RUN" != "--dry-run" ]; then
  gh api -X POST "repos/$OWNER/$REPO_NAME/pages" \
      -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 \
    || gh api -X PUT "repos/$OWNER/$REPO_NAME/pages" \
      -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 \
    || echo "  （Pages 可能需要手动开启：仓库 Settings → Pages → Source 选 main / root）"
fi

echo
echo "=========================================="
echo " 完成！"
echo " 链接（首次部署需等 1~2 分钟生效）："
echo "   https://$OWNER.github.io/$REPO_NAME/"
echo "=========================================="
echo "提醒：把上面这个链接填进作业的「网页链接」一项。"
