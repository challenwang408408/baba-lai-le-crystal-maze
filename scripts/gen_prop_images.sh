#!/usr/bin/env bash
# 用 Codex CLI 的 image_generation 工具补生成两张道具图（饭盒 / 冻结）。
# 订阅内置 imagegen，无按次计费。失败不阻塞，游戏有 3D 兜底。
set -uo pipefail

CODEX="$HOME/.npm-global/bin/codex"
ASSETS="/Users/wangchanglun/Desktop/AI_test项目/adhoc_jobs/m-梦幻公主水晶迷宫/public/assets"
GEN="$HOME/.codex/generated_images"

gen() {
  local out="$1"
  local prompt="$2"
  local stamp
  stamp="$(mktemp)"
  touch "$stamp"
  printf '%s\n' "$prompt 生成后把 PNG 保存到这个精确路径：$ASSETS/$out" \
    | "$CODEX" exec --skip-git-repo-check -s workspace-write --add-dir "$ASSETS" --color never - \
    > "$ASSETS/../../scripts/codex-$out.log" 2>&1
  if [[ ! -s "$ASSETS/$out" ]]; then
    local fb
    fb="$(find "$GEN" -type f -name '*.png' -newer "$stamp" 2>/dev/null | tail -n 1)"
    [[ -n "$fb" && -s "$fb" ]] && cp "$fb" "$ASSETS/$out"
  fi
  rm -f "$stamp"
  if [[ -s "$ASSETS/$out" ]]; then echo "OK $out"; else echo "FAIL $out"; fi
}

gen "lunchbox.png" "请使用你的 image_generation 工具生成一张图片：一个可爱卡通便当盒/饭盒 cute kawaii bento lunchbox，粉彩公主配色（樱花粉、薰衣草紫、薄荷绿），盒盖微开露出可爱食物，柔和发光，主体居中，正方形，透明背景。"
gen "freeze-snowflake.png" "请使用你的 image_generation 工具生成一张图片：一个可爱的冻结道具图标 cute glowing snowflake ice crystal power-up，粉蓝色冰晶，kawaii 闪光，主体居中，正方形，透明背景。"

echo "done"
