# -*- coding: utf-8 -*-
"""消融结果聚合：多 seed 结果 → 均值±标准差 → 对 baseline 显著性 → 论文表格。

设计动机：SKILL.md 要求"≥3 seed、报告均值±标准差、差异小于 1 个标准差不得
声称有效"。手工整理易错且容易忘记 σ 规则，本脚本机械执行并强制输出该判定。

输入：长格式 CSV，必须含 config、seed 两列 + 若干指标列（其余数值列都当指标）。
  config,seed,acc,f1
  base,1,0.812,0.799
  +moe,1,0.835,0.812
统计：
- 每 config：n_seed / mean / std / min / max（各指标）
- 与 --baseline 对比：按 seed 配对（交集 seed）做配对 t 检验；无交集时退化为
  独立 Welch t 检验并在报告注明
- σ 规则：|mean 差| < 1×baseline_std → 输出"不得声称有效"标志
- 多指标两两比较用 Holm 校正
输出：markdown 报告 + out/ablation_table.md（论文表格格式，方法列 × 指标行）。
用法：
  python aggregate_results.py --data runs.csv --baseline base
  python aggregate_results.py --demo
依赖 numpy + scipy。
"""
import argparse
import csv
import itertools
import json
import os
import sys

try:
    import numpy as np
    from scipy import stats as st
except ImportError:
    raise SystemExit("依赖 numpy 与 scipy：pip install numpy scipy")


def load(path):
    rows = []
    with open(path, "r", encoding="utf-8-sig", errors="replace", newline="") as fh:
        reader = csv.DictReader(fh)
        if not reader.fieldnames or not {"config", "seed"} <= {c.strip().lower() for c in reader.fieldnames}:
            raise SystemExit("CSV 需包含 config 与 seed 列；现有列：%s" % reader.fieldnames)
        cols = {c.strip().lower(): c for c in reader.fieldnames}
        metric_cols = [c for c in reader.fieldnames
                       if c not in (cols["config"], cols["seed"])]
        for r in reader:
            row = {"config": (r[cols["config"]] or "").strip(), "seed": (r[cols["seed"]] or "").strip()}
            ok = bool(row["config"]) and bool(row["seed"])
            for m in metric_cols:
                try:
                    row[m] = float(r[m])
                except (TypeError, ValueError):
                    row[m] = None
                    ok = False
            if ok:
                rows.append(row)
    configs = sorted({r["config"] for r in rows})
    metrics = metric_cols
    return rows, configs, metrics


def holm(pvals):
    m = len(pvals)
    order = sorted(range(m), key=lambda i: pvals[i])
    out, prev = [0.0] * m, 0.0
    for rank, i in enumerate(order):
        prev = max(prev, min(1.0, (m - rank) * pvals[i]))
        out[i] = prev
    return out


def aggregate(rows, configs, metrics, baseline, alpha=0.05):
    # 每 config × metric 统计
    summary = {}
    for cfg in configs:
        sub = [r for r in rows if r["config"] == cfg]
        summary[cfg] = {}
        for m in metrics:
            vals = [r[m] for r in sub if r[m] is not None]
            a = np.asarray(vals, dtype=float)
            summary[cfg][m] = {"n": len(a), "mean": float(a.mean()) if len(a) else float("nan"),
                               "std": float(a.std(ddof=1)) if len(a) > 1 else 0.0,
                               "min": float(a.min()) if len(a) else float("nan"),
                               "max": float(a.max()) if len(a) else float("nan")}
    # 与 baseline 比较（按 seed 配对优先）
    comparisons = []
    if baseline and baseline in configs:
        base_rows = {r["seed"]: r for r in rows if r["config"] == baseline}
        others = [c for c in configs if c != baseline]
        raw = []
        for cfg in others:
            for m in metrics:
                sub = {r["seed"]: r for r in rows if r["config"] == cfg}
                common = sorted(set(base_rows) & set(sub))
                if len(common) >= 2:
                    xa = np.array([base_rows[s][m] for s in common], dtype=float)
                    xb = np.array([sub[s][m] for s in common], dtype=float)
                    paired = True
                else:
                    xa = np.array([r[m] for r in base_rows.values() if r[m] is not None])
                    xb = np.array([r[m] for r in sub.values() if r[m] is not None])
                    paired = False
                if len(xa) < 2 or len(xb) < 2:
                    continue
                if paired:
                    tr = st.ttest_rel(xb, xa)
                else:
                    tr = st.ttest_ind(xb, xa, equal_var=False)
                diff = float(xb.mean() - xa.mean())
                one_sigma = abs(diff) < summary[baseline][m]["std"]
                raw.append({"config": cfg, "metric": m, "paired": paired,
                            "n_seeds": min(len(xa), len(xb)), "diff": diff,
                            "p": float(tr.pvalue), "one_sigma": bool(one_sigma),
                            "base_std": summary[baseline][m]["std"]})
        corrected = holm([c["p"] for c in raw]) if raw else []
        for c, cp in zip(raw, corrected):
            c["p_holm"] = cp
            c["verdict"] = ("有效" if (cp < alpha and not c["one_sigma"])
                            else "显著但 |Δ|<1σ，不得声称有效" if cp < alpha
                            else "无显著差异")
        comparisons = raw
    return summary, comparisons


def render(summary, comparisons, configs, metrics, baseline):
    L = ["# 消融结果聚合", "", "## 各配置指标（均值±标准差，%d seed）" % max(s["n"] for c in summary.values() for s in c.values()), "",
         "| config | " + " | ".join("%s" % m for m in metrics) + " |", "|---" * (len(metrics) + 1)]
    for cfg in configs:
        cells = []
        for m in metrics:
            s = summary[cfg][m]
            cells.append("%.4f ± %.4f (n=%d)" % (s["mean"], s["std"], s["n"]))
        L.append("| %s | %s |" % (cfg, " | ".join(cells)))
    if comparisons:
        L += ["", "## 与 baseline（%s）对比" % baseline, "",
              "| config | metric | Δ | p(Holm) | 配对 | σ 规则 | 判定 |", "|---|---|---|---|---|---|---|"]
        for c in comparisons:
            L.append("| %s | %s | %+.4f | %.4g | %s（n=%d seed） | %s | %s |" %
                     (c["config"], c["metric"], c["diff"], c["p_holm"],
                      "按 seed 配对" if c["paired"] else "独立（seed 无交集）",
                      c["n_seeds"], "触发" if c["one_sigma"] else "通过", c["verdict"]))
        L += ["", "> σ 规则：|Δ| < 1×baseline_std 的改善一律不声称有效（SKILL.md 统计效力要求）。"]
    else:
        L.append("\n（未指定 --baseline 或 baseline 不在数据中，跳过显著性对比）")
    return "\n".join(L)


def paper_table(summary, configs, metrics):
    """论文表格格式（方法行 × 指标列）写 out/ablation_table.md。"""
    L = ["| 方法 | " + " | ".join(metrics) + " |", "|---" * (len(metrics) + 1)]
    for cfg in configs:
        cells = ["%.2f±%.2f" % (summary[cfg][m]["mean"], summary[cfg][m]["std"]) if summary[cfg][m]["n"] else "-" for m in metrics]
        L.append("| %s | %s |" % (cfg, " | ".join(cells)))
    return "\n".join(L)


def _demo(outdir="out"):
    import random
    random.seed(2)
    os.makedirs(outdir, exist_ok=True)
    p = os.path.join(outdir, "demo_runs.csv")
    with open(p, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["config", "seed", "acc", "f1"])
        for seed in (1, 2, 3):
            w.writerow(["base", seed, "%.4f" % (0.812 + random.gauss(0, 0.004)), "%.4f" % (0.799 + random.gauss(0, 0.005))])
            w.writerow(["+moe", seed, "%.4f" % (0.835 + random.gauss(0, 0.004)), "%.4f" % (0.812 + random.gauss(0, 0.005))])
            w.writerow(["+longctx", seed, "%.4f" % (0.814 + random.gauss(0, 0.003)), "%.4f" % (0.801 + random.gauss(0, 0.004))])
    return p


def main(argv=None):
    ap = argparse.ArgumentParser(description="消融结果聚合")
    ap.add_argument("--data", help="runs.csv（config,seed,指标…）")
    ap.add_argument("--baseline", help="基准配置名")
    ap.add_argument("--alpha", type=float, default=0.05)
    ap.add_argument("--out", default="out")
    ap.add_argument("--demo", action="store_true")
    args = ap.parse_args(argv)
    path = args.data
    if args.demo:
        path = _demo(args.out)
        print("[demo] 合成数据：%s\n" % path)
    if not path:
        ap.error("需要 --data 或 --demo")
    if args.demo and not args.baseline:
        args.baseline = "base"   # demo 数据里的基准配置名
    rows, configs, metrics = load(path)
    summary, comparisons = aggregate(rows, configs, metrics, args.baseline, args.alpha)
    print(render(summary, comparisons, configs, metrics, args.baseline))
    os.makedirs(args.out, exist_ok=True)
    tp = os.path.join(args.out, "ablation_table.md")
    with open(tp, "w", encoding="utf-8") as fh:
        fh.write(paper_table(summary, configs, metrics) + "\n")
    print("\n论文表格已写入：%s（结果出来后请同步 note_write 记录）" % tp)
    return 0


if __name__ == "__main__":
    sys.exit(main())
