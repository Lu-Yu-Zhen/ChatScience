# -*- coding: utf-8 -*-
"""出版级绘图风格模块：固化 SKILL.md 的"规范"章节，保证每次出图风格一致。

提供（run_code 中 import 使用）：
  use_paper_style()          —— 应用 rcParams（字号/线宽/去顶右边框/中文字体回退）
  CB_SAFE                    —— 色盲友好调色板（Okabe-Ito）
  smooth(y, k)               —— 移动平均平滑（loss 曲线叠加用）
  save_fig(fig, name, outdir)—— 同时导出 .pdf（矢量）与 .png（300dpi）到 out/

用法（run_code, lang=python）：
  import sys; sys.path.insert(0, r"<本技能目录>/scripts")
  import paper_style as ps
  ps.use_paper_style()
  ... 画图 ...
  ps.save_fig(fig, "loss_curve")     # → out/loss_curve.pdf + out/loss_curve.png
依赖 matplotlib；本文件自身可 CLI 跑一张风格自检图：python paper_style.py --demo
"""
import os

import matplotlib
matplotlib.use("Agg")           # 无显示环境后端，SKILL.md 规范要求
import matplotlib.pyplot as plt

# Okabe-Ito 色盲友好调色板（Nature/Science 常用）
CB_SAFE = ["#0072B2", "#D55E00", "#009E73", "#CC79A7", "#E69F00", "#56B4E9", "#F0E442", "#000000"]


def use_paper_style():
    plt.rcParams.update({
        "font.size": 9, "axes.labelsize": 9, "axes.titlesize": 9,
        "xtick.labelsize": 8, "ytick.labelsize": 8, "legend.fontsize": 8,
        "lines.linewidth": 1.2, "lines.markersize": 4,
        "axes.spines.top": False, "axes.spines.right": False,   # 一图一观点：去多余边框
        "axes.grid": False, "grid.alpha": 0.3,
        "figure.dpi": 110, "savefig.dpi": 300, "savefig.bbox": "tight",
        "font.sans-serif": ["DejaVu Sans", "Microsoft YaHei", "SimHei"],  # 中文回退（Windows）
        "axes.unicode_minus": False,
        "legend.frameon": False,
    })
    return plt.rcParams


def smooth(y, k=9):
    """移动平均平滑，边缘收缩窗口；输入含 None/NaN 时按跳过处理。"""
    n = len(y)
    if n < k:
        return list(y)
    half = k // 2
    out = []
    for i in range(n):
        lo, hi = max(0, i - half), min(n, i + half + 1)
        seg = [v for v in y[lo:hi] if v is not None]
        out.append(sum(seg) / len(seg) if seg else float("nan"))
    return out


def save_fig(fig, name, outdir="out"):
    """同时导出矢量 .pdf 与位图 .png（300dpi），返回路径列表。"""
    os.makedirs(outdir, exist_ok=True)
    paths = []
    for ext in ("pdf", "png"):
        p = os.path.join(outdir, "%s.%s" % (name, ext))
        fig.savefig(p)
        paths.append(p)
    return paths


def _demo():
    """风格自检：一条原始+平滑 loss 曲线 + 误差条柱状图。"""
    import random
    use_paper_style()
    random.seed(1)
    xs = list(range(200))
    ys = [2.0 * (2.71828 ** (-x / 60.0)) + 0.4 + random.gauss(0, 0.03) for x in xs]

    fig, (a1, a2) = plt.subplots(1, 2, figsize=(7, 2.8))
    a1.plot(xs, ys, color=CB_SAFE[0], alpha=0.4, lw=0.8, label="raw")
    a1.plot(xs, smooth(ys, 11), color=CB_SAFE[1], lw=1.4, label="smoothed")
    a1.set_yscale("log"); a1.set_xlabel("step"); a1.set_ylabel("loss"); a1.legend()

    means, errs = [0.82, 0.85, 0.79], [0.02, 0.015, 0.03]
    a2.bar(range(3), means, yerr=errs, capsize=3,
           color=[CB_SAFE[0], CB_SAFE[1], CB_SAFE[2]], width=0.6)
    a2.set_xticks(range(3)); a2.set_xticklabels(["base", "A", "B"])
    a2.set_ylabel("accuracy")
    fig.tight_layout()
    print("已保存：%s" % ", ".join(save_fig(fig, "style_demo")))
    plt.close(fig)


if __name__ == "__main__":
    _demo()
