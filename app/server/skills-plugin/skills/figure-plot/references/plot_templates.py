# -*- coding: utf-8 -*-
"""常用科研图模板（可运行示例，对应 SKILL.md「常用模板」四类）。

与 scripts/paper_style.py 配套：先用 sys.path 引入 paper_style 再 import 本文件。
每个函数都是独立可跑的最小示例，直接改数据即可复用；产物统一保存到 out/。

  loss_curve()          loss 曲线（对数 y 轴 + 平滑线叠加原始）
  bar_with_err()        多方法柱状对比（均值 ± 标准差误差条）
  heatmap_annotated()   热力图（格内标数值）
  arch_diagram()        架构示意图（matplotlib patches 方框+箭头）
"""
import os
import sys
import random

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts"))
import paper_style as ps       # noqa: E402
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np              # noqa: E402


def loss_curve(runs, outdir="out"):
    """runs: {方法名: [(step, loss), ...]}，多条方法曲线对比。"""
    ps.use_paper_style()
    fig, ax = plt.subplots(figsize=(4.2, 3.0))
    for i, (name, pts) in enumerate(runs.items()):
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        ax.plot(xs, ys, color=ps.CB_SAFE[i % len(ps.CB_SAFE)], alpha=0.35, lw=0.8)
        ax.plot(xs, ps.smooth(ys, 11), color=ps.CB_SAFE[i % len(ps.CB_SAFE)], lw=1.4, label=name)
    ax.set_yscale("log")
    ax.set_xlabel("step"); ax.set_ylabel("loss")
    ax.legend()
    fig.tight_layout()
    return ps.save_fig(fig, "tpl_loss_curve", outdir)


def bar_with_err(labels, means, stds, outdir="out", ylabel="accuracy"):
    """labels/means/stds 等长；误差条 = 标准差（或 SE，注明即可）。"""
    ps.use_paper_style()
    fig, ax = plt.subplots(figsize=(3.6, 2.8))
    xs = range(len(labels))
    ax.bar(xs, means, yerr=stds, capsize=3, width=0.6,
           color=[ps.CB_SAFE[i % len(ps.CB_SAFE)] for i in xs])
    ax.set_xticks(list(xs)); ax.set_xticklabels(labels)
    ax.set_ylabel(ylabel)
    fig.tight_layout()
    return ps.save_fig(fig, "tpl_bar_err", outdir)


def heatmap_annotated(mat, row_labels, col_labels, outdir="out", fmt="%.3f"):
    """mat: 二维 list/ndarray；格内标数值，用 viridis。"""
    ps.use_paper_style()
    m = np.asarray(mat, dtype=float)
    fig, ax = plt.subplots(figsize=(0.62 * len(col_labels) + 1.6, 0.5 * len(row_labels) + 1.4))
    im = ax.imshow(m, cmap="viridis", aspect="auto")
    fig.colorbar(im, ax=ax, shrink=0.85)
    for i in range(m.shape[0]):
        for j in range(m.shape[1]):
            v = m[i, j]
            ax.text(j, i, fmt % v, ha="center", va="center", fontsize=7,
                    color="white" if (v - m.min()) > (m.max() - m.min()) * 0.55 else "black")
    ax.set_xticks(range(len(col_labels))); ax.set_xticklabels(col_labels)
    ax.set_yticks(range(len(row_labels))); ax.set_yticklabels(row_labels)
    fig.tight_layout()
    return ps.save_fig(fig, "tpl_heatmap", outdir)


def arch_diagram(blocks, outdir="out"):
    """blocks: [(名称, 组号), ...] 同组垂直排布，组间箭头连线。简单方框+箭头。"""
    ps.use_paper_style()
    fig, ax = plt.subplots(figsize=(6.0, 2.2))
    groups = {}
    for name, g in blocks:
        groups.setdefault(g, []).append(name)
    ncols = len(groups)
    box_w, box_h = 1.15, 0.52
    centers = {}
    for gi, (g, names) in enumerate(sorted(groups.items())):
        n = len(names)
        for bi, name in enumerate(names):
            x = gi * 2.0
            y = (n - 1) / 2.0 * (box_h + 0.18) - bi * (box_h + 0.18)
            ax.add_patch(plt.Rectangle((x - box_w / 2, y - box_h / 2), box_w, box_h,
                                       fill=True, facecolor="#EDF2F7",
                                       edgecolor=ps.CB_SAFE[gi % len(ps.CB_SAFE)], lw=1.2))
            ax.text(x, y, name, ha="center", va="center", fontsize=8)
            centers[(g, bi)] = (x + box_w / 2, y)
        for bi in range(n - 1):   # 组内竖向箭头
            x0, y0 = centers[(g, bi)]
            ax.annotate("", xy=(x0, y0 - box_h - 0.02), xytext=(x0, y0),
                        arrowprops=dict(arrowstyle="->", lw=1.0, color="#666666"))
    gs = sorted(groups)
    for gi in range(len(gs) - 1):  # 组间横向箭头：末块→首块
        x0, y0 = centers[(gs[gi], 0)]
        x1, y1 = centers[(gs[gi + 1], 0)]
        ax.annotate("", xy=(x1 - box_w / 2 - 0.03, y1), xytext=(x0 + 0.03, y0),
                    arrowprops=dict(arrowstyle="->", lw=1.2, color="#333333"))
    ax.set_xlim(-0.8, ncols * 2.0 - 0.2); ax.set_ylim(-1.2, 1.2)
    ax.axis("off")
    fig.tight_layout()
    return ps.save_fig(fig, "tpl_arch", outdir)


if __name__ == "__main__":
    random.seed(0)
    rng = np.random.default_rng(0)
    runs = {m: [(i * 10, 2.2 * 2.71828 ** (-i / (50 + 10 * k)) + 0.35 + rng.normal(0, 0.02))
                for i in range(120)] for k, m in enumerate(["base", "+MoE", "+long ctx"])}
    print("loss_curve      →", loss_curve(runs))
    print("bar_with_err    →", bar_with_err(["base", "A", "B"], [0.82, 0.85, 0.79], [0.02, 0.015, 0.03]))
    print("heatmap         →", heatmap_annotated(rng.random((4, 5)),
                                                  ["MHA", "GQA", "MLA", "NSA"],
                                                  ["128k", "256k", "512k", "1M", "2M"]))
    print("arch_diagram    →", arch_diagram([("Input", 0), ("Encoder×N", 1), ("MoE FFN", 2), ("Head", 3)]))
