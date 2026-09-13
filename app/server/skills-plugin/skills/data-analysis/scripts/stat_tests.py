# -*- coding: utf-8 -*-
"""统计分析流水线：正态性/方差齐性 → 自动选检验 → 效应量 + 置信区间 → 多重比较校正。

设计动机：SKILL.md 流程 3-4 要求"方法与假设匹配、结论附效应量与 CI、多重比较
校正"，人工执行最容易漏后两步。本脚本固化完整流水线，输出标准 markdown 报告。

输入：长格式 CSV，必须含 value 列与 group 列（--value/--group 可改名）；
或宽格式（非数值列当作分组不可行时自动报错提示）。>2 组自动做组间总体检验 +
两两事后比较（Holm 校正）。结果表可保存到 out/。

依赖：numpy + scipy（缺失时给出明确安装提示，不做降级近似，避免假统计）。
用法：
  python stat_tests.py --data results.csv
  python stat_tests.py --data results.csv --value acc --group method --alpha 0.05
  python stat_tests.py --demo
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
    raise SystemExit("本脚本依赖 numpy 与 scipy：pip install numpy scipy（不做降级近似以免产生假统计）")


def load_groups(path, value_col="value", group_col="group"):
    """长格式读入 → {组名: np.array(values)}；数值解析失败的行跳过并计数。"""
    groups, skipped = {}, 0
    with open(path, "r", encoding="utf-8-sig", errors="replace", newline="") as fh:
        reader = csv.DictReader(fh)
        if reader.fieldnames is None:
            raise SystemExit("CSV 无表头")
        cols = {c.strip().lower(): c for c in reader.fieldnames}
        vcol, gcol = cols.get(value_col.lower()), cols.get(group_col.lower())
        if vcol is None or gcol is None:
            raise SystemExit("需要 '%s' 与 '%s' 两列；现有列：%s" % (value_col, group_col, reader.fieldnames))
        for r in reader:
            g = (r[gcol] or "").strip()
            try:
                v = float(r[vcol])
            except (TypeError, ValueError):
                skipped += 1
                continue
            if g:
                groups.setdefault(g, []).append(v)
    if skipped:
        print("[提示] 跳过无法解析为数值的行：%d" % skipped)
    if len(groups) < 2:
        raise SystemExit("至少需要 2 个分组，当前 %d 个" % len(groups))
    return {g: np.asarray(v) for g, v in groups.items()}


def describe(x):
    mean = float(np.mean(x))
    sd = float(np.std(x, ddof=1)) if len(x) > 1 else 0.0
    sem = sd / math_sqrt(len(x))
    tcrit = float(st.t.ppf(0.975, len(x) - 1)) if len(x) > 1 else float("nan")
    return {"n": len(x), "mean": mean, "std": sd, "median": float(np.median(x)),
            "ci95": (mean - tcrit * sem, mean + tcrit * sem)}


def math_sqrt(x):
    return x ** 0.5


def cohens_d(a, b):
    """Cohen's d（合并方差）+ Hedges' g 小样本校正。"""
    na, nb = len(a), len(b)
    sp = math_sqrt(((na - 1) * np.var(a, ddof=1) + (nb - 1) * np.var(b, ddof=1)) / (na + nb - 2))
    if sp == 0:
        return 0.0, 0.0
    d = (float(np.mean(a)) - float(np.mean(b))) / sp
    J = 1 - 3 / (4 * (na + nb) - 9)
    return d, d * J


def rank_biserial(a, b):
    """Mann-Whitney 的效应量 rank-biserial r = 2·U/(n1·n2) − 1。"""
    u = st.mannwhitneyu(a, b, alternative="two-sided").statistic
    return 2 * float(u) / (len(a) * len(b)) - 1


def holm(pvals):
    """Holm-Bonferroni 校正，返回与输入同序的校正后 p 值列表。"""
    m = len(pvals)
    order = sorted(range(m), key=lambda i: pvals[i])
    out = [0.0] * m
    prev = 0.0
    for rank, i in enumerate(order):
        adj = min(1.0, (m - rank) * pvals[i])
        prev = max(prev, adj)   # 保证单调
        out[i] = prev
    return out


def run_pipeline(groups, alpha=0.05):
    names = sorted(groups)
    desc = {g: describe(groups[g]) for g in names}
    norm = {g: st.shapiro(groups[g][:5000]) for g in names}
    all_normal = all(p.pvalue > alpha for p in norm.values())
    stat_kw, p_kw = (st.levene(*[groups[g] for g in names]) if len(names) > 1 else (None, None))
    homog = bool(p_kw > alpha)

    tests = []
    if len(names) == 2:
        a, b = groups[names[0]], groups[names[1]]
        if all_normal and homog:
            r = st.ttest_ind(a, b, equal_var=True)
            method = "独立样本 t 检验（方差齐）"
        elif all_normal:
            r = st.ttest_ind(a, b, equal_var=False)
            method = "Welch t 检验（方差不齐）"
        else:
            r = st.mannwhitneyu(a, b, alternative="two-sided")
            method = "Mann-Whitney U（非正态）"
        eff = (rank_biserial(a, b) if "Mann" in method else cohens_d(a, b)[0])
        tests.append({"pair": (names[0], names[1]), "method": method,
                      "stat": float(r.statistic), "p": float(r.pvalue),
                      "effect": eff, "effect_name": "rank-biserial r" if "Mann" in method else "Cohen's d"})
    else:
        if all_normal and homog:
            r = st.f_oneway(*[groups[g] for g in names])
            method, stat_name = "单因素 ANOVA", "F"
            grand = np.concatenate([groups[g] for g in names])
            ss_b = sum(len(groups[g]) * (np.mean(groups[g]) - np.mean(grand)) ** 2 for g in names)
            ss_w = sum(((groups[g] - np.mean(groups[g])) ** 2).sum() for g in names)
            eta2 = float(ss_b / (ss_b + ss_w)) if (ss_b + ss_w) > 0 else 0.0
            overall_eff = ("eta²", eta2)
        else:
            r = st.kruskal(*[groups[g] for g in names])
            method, stat_name = "Kruskal-Wallis H", "H"
            n = sum(len(groups[g]) for g in names)
            overall_eff = ("epsilon²", float((r.statistic - len(names) + 1) / (n - len(names))))
        tests.append({"pair": None, "method": method, "stat": float(r.statistic),
                      "p": float(r.pvalue), "effect": overall_eff[1], "effect_name": overall_eff[0]})
        pairs = list(itertools.combinations(names, 2))
        raw = []
        for a, b in pairs:
            if all_normal:
                rr = st.ttest_ind(groups[a], groups[b], equal_var=homog)
                eff = cohens_d(groups[a], groups[b])[0]
                ename = "Cohen's d"
            else:
                rr = st.mannwhitneyu(groups[a], groups[b], alternative="two-sided")
                eff = rank_biserial(groups[a], groups[b])
                ename = "rank-biserial r"
            raw.append({"pair": (a, b), "method": "事后两两", "stat": float(rr.statistic),
                        "p": float(rr.pvalue), "effect": eff, "effect_name": ename})
        corrected = holm([t["p"] for t in raw])
        for t, cp in zip(raw, corrected):
            t["p_holm"] = cp
        tests.extend(raw)
    return {"describe": desc, "normality": {g: {"W": float(v.statistic), "p": float(v.pvalue)} for g, v in norm.items()},
            "levene": {"stat": float(stat_kw), "p": float(p_kw)} if stat_kw is not None else None,
            "all_normal": all_normal, "homog": homog, "alpha": alpha, "tests": tests}


def render(res):
    L = ["# 统计分析报告", "", "## 1. 描述统计", "",
         "| 组 | n | mean | std | median | 95% CI |", "|---|---|---|---|---|---|"]
    for g, d in res["describe"].items():
        L.append("| %s | %d | %.4g | %.4g | %.4g | [%.4g, %.4g] |" %
                 (g, d["n"], d["mean"], d["std"], d["median"], d["ci95"][0], d["ci95"][1]))
    L += ["", "## 2. 假设检查", ""]
    for g, w in res["normality"].items():
        L.append("- 正态性（Shapiro）：%s：W=%.3f, p=%.4g → %s" %
                 (g, w["W"], w["p"], "接受正态" if w["p"] > res["alpha"] else "拒绝正态"))
    if res["levene"]:
        L.append("- 方差齐性（Levene）：p=%.4g → %s" %
                 (res["levene"]["p"], "齐" if res["homog"] else "不齐"))
    L += ["", "## 3. 检验结果（α=%.2f）" % res["alpha"], "",
          "| 对比 | 方法 | 统计量 | p（校正后） | 效应量 | 显著？ |", "|---|---|---|---|---|---|"]
    for t in res["tests"]:
        p_disp = t.get("p_holm")
        p_txt = "%.4g" % p_disp if p_disp is not None else "%.4g" % t["p"]
        note = "（Holm 校正）" if p_disp is not None else ""
        sig = "是" if (p_disp if p_disp is not None else t["p"]) < res["alpha"] else "否"
        pair = "%s vs %s" % t["pair"] if t["pair"] else "总体（%d 组）" % len(res["describe"])
        L.append("| %s | %s%s | %s=%.3g | %s | %s=%.3g | %s |" %
                 (pair, t["method"], note, "stat", t["stat"], p_txt, t["effect_name"], t["effect"], sig))
    L += ["", "> 解读规则：p<α 只说明差异存在，结论必须同时引用效应量方向与大小；", "> 效应量很小（|d|<0.2 / |r|<0.1）时即使显著也应谨慎表述。"]
    return "\n".join(L)


def _demo(outdir="out"):
    rng = np.random.default_rng(3)
    os.makedirs(outdir, exist_ok=True)
    p = os.path.join(outdir, "demo_results.csv")
    with open(p, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["group", "value"])
        for g, mu, sd, n in [("baseline", 72.0, 3.0, 30), ("methodA", 74.5, 3.2, 30), ("methodB", 72.4, 3.1, 30)]:
            for v in rng.normal(mu, sd, n):
                w.writerow([g, "%.4f" % v])
    return p


def main(argv=None):
    ap = argparse.ArgumentParser(description="统计检验流水线")
    ap.add_argument("--data", help="长格式 CSV（group,value 两列起名可用 --group/--value 覆盖）")
    ap.add_argument("--group", default="group")
    ap.add_argument("--value", default="value")
    ap.add_argument("--alpha", type=float, default=0.05)
    ap.add_argument("--out", default="out", help="结果表保存目录")
    ap.add_argument("--demo", action="store_true")
    args = ap.parse_args(argv)
    path = args.data
    if args.demo:
        path = _demo(args.out)
        print("[demo] 合成数据已生成：%s" % path)
    if not path:
        ap.error("需要 --data 或 --demo")
    groups = load_groups(path, args.value, args.group)
    res = run_pipeline(groups, args.alpha)
    print(render(res))
    os.makedirs(args.out, exist_ok=True)
    jp = os.path.join(args.out, "stat_tests_result.json")
    with open(jp, "w", encoding="utf-8") as fh:
        json.dump(res, fh, ensure_ascii=False, indent=1, default=float)
    print("\n原始结果已保存：%s（中间表请一并归档到 out/）" % jp)
    return 0


if __name__ == "__main__":
    sys.exit(main())
