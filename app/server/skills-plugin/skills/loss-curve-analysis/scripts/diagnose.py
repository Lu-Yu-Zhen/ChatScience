# -*- coding: utf-8 -*-
"""训练曲线自动诊断：解析日志 → spike/NaN/平台检测 → loss/lr/grad_norm 三联图。

设计动机：SKILL.md 强制"用 run_code 载入数据画三联图"，但每次现写解析与绘图
代码既费 token 又风格漂移；本脚本固化解析、检测阈值与图样式，输出带 step 区间
证据的诊断报告。

支持的日志格式（自动嗅探列名，大小写/别名不敏感）：
- CSV / TSV：step,loss,lr,grad_norm（别：iteration, epoch; loss_value; learning_rate; gradnorm…）
- JSONL：每行一个 {"step":..,"loss":..,...}
- txt 中 "step=100 loss=2.31 lr=0.001" 形式的 key=value 行
只要求 step 与 loss 两列，lr/grad_norm 缺失时对应子图跳过。

检测方法（阈值可用参数覆盖）：
- spike：滚动中位数 ± k·MAD（默认 k=6），窗口 --window（默认 21）
- NaN/Inf：loss 非有限值的 step 全部列出（发散征兆）
- 平台：把平滑后曲线均分 --segments（默认 8）段，逐段线性拟合，
  归一化斜率 |slope|/|首段截距| < --plateau-slope（默认 1e-4）判平台
- 图：matplotlib Agg，保存 out/curves_diagnosis.png + .pdf；无 matplotlib 时仅文本报告

用法：
  python diagnose.py --log train_log.csv
  python diagnose.py --log train_log.csv --window 31 --spike-k 8
  python diagnose.py --demo   # 生成带 spike+平台+NaN 的合成曲线自测
"""
import argparse
import csv
import json
import math
import os
import re
import sys

ALIAS = {
    "step": ["step", "iteration", "iter", "epoch", "global_step"],
    "loss": ["loss", "loss_value", "train_loss", "total_loss"],
    "lr": ["lr", "learning_rate", "learningrate"],
    "grad_norm": ["grad_norm", "gradnorm", "gradient_norm", "gnorm"],
}


def _norm_key(k):
    return re.sub(r"[^a-z_]", "", str(k).lower().strip())


def _map_columns(header):
    colmap = {}
    for canon, names in ALIAS.items():
        for col in header:
            if _norm_key(col) in names:
                colmap[canon] = col
                break
    return colmap


def load_log(path):
    """读入日志，返回 [{step,loss,lr,grad_norm}, ...]（缺失字段为 None）。"""
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        sample = fh.read(4096)
    rows = []
    if sample.lstrip().startswith("{"):
        for line in open(path, "r", encoding="utf-8", errors="replace"):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            rows.append({k: obj.get(k) for k in ALIAS})
        return rows
    kv_line = re.compile(r"(\w+)\s*[:=]\s*([+-]?[\d.eE]+(?:nan|inf)?)", re.I)
    if kv_line.search(sample):
        for line in open(path, "r", encoding="utf-8", errors="replace"):
            kv = {k.lower(): v for k, v in kv_line.findall(line)}
            if not kv:
                continue
            rows.append({canon: kv.get(_norm_key(canon)) for canon in ALIAS})
        return rows
    # CSV/TSV：要求表头行（列名含 step/loss 等别名之一）；自动判分隔符
    with open(path, "r", encoding="utf-8", errors="replace", newline="") as fh:
        head = fh.readline()
        delim = "\t" if head.count("\t") > head.count(",") else ","
        fieldnames = [c.strip() for c in head.rstrip("\r\n").split(delim) if c.strip()]
        colmap = _map_columns(fieldnames)
        if "loss" not in colmap:
            raise SystemExit("表头里没找到 loss 列（本脚本要求带表头 CSV；候选别名：%s）" % ALIAS["loss"])
        idxs = {canon: fieldnames.index(col) for canon, col in colmap.items()}
        for r in csv.reader(fh, delimiter=delim):
            if not r or all(not c.strip() for c in r):
                continue
            rec = {}
            for canon, idx in idxs.items():
                if idx < len(r):
                    try:
                        rec[canon] = float(r[idx])
                    except ValueError:
                        rec[canon] = None
                else:
                    rec[canon] = None
            if "step" not in colmap:
                rec["step"] = float(len(rows))
            rows.append(rec)
    return rows


def _smooth(y, k=9):
    if len(y) < k:
        return list(y)
    half = k // 2
    out = []
    for i in range(len(y)):
        lo, hi = max(0, i - half), min(len(y), i + half + 1)
        out.append(sum(y[lo:hi]) / (hi - lo))
    return out


def _mad_spikes(y, window, k):
    """滚动中位数 ± k·MAD 检测尖峰，返回 [(idx, value, zscore), ...]。"""
    spikes = []
    half = window // 2
    for i in range(len(y)):
        lo, hi = max(0, i - half), min(len(y), i + half + 1)
        seg = y[lo:hi]
        med = sorted(seg)[len(seg) // 2]
        mad = sorted(abs(v - med) for v in seg)[len(seg) // 2] or 1e-12
        z = abs(y[i] - med) / (1.4826 * mad)
        if z > k:
            spikes.append((i, y[i], z))
    return spikes


def _plateaus(y, segments, thresh):
    """分段线性拟合判平台，返回 [(起idx, 止idx, 归一化斜率), ...]。"""
    n = len(y)
    seg = max(n // segments, 2)
    out = []
    for s0 in range(0, n, seg):
        seg_y = y[s0:s0 + seg]
        if len(seg_y) < 3:
            continue
        xs = list(range(len(seg_y)))
        mx, my = sum(xs) / len(xs), sum(seg_y) / len(seg_y)
        denom = sum((x - mx) ** 2 for x in xs) or 1e-12
        slope = sum((x - mx) * (v - my) for x, v in zip(xs, seg_y)) / denom
        scale = abs(y[0]) or 1e-12
        norm = slope / scale
        if abs(norm) < thresh:
            out.append((s0, s0 + len(seg_y) - 1, norm))
    return out


def analyze(rows, window=21, spike_k=6.0, segments=8, plateau_slope=1e-4):
    steps = [r["step"] for r in rows]
    loss = [r["loss"] for r in rows]
    finite = [v for v in loss if v is not None and math.isfinite(v)]
    nonfinite = [(steps[i], loss[i]) for i, v in enumerate(loss) if v is None or not math.isfinite(v)]
    spikes = _mad_spikes(finite, window, spike_k) if len(finite) > window else []
    # spike 索引要映射回原 rows 下标
    fmap = {}
    j = 0
    for i, v in enumerate(loss):
        if v is not None and math.isfinite(v):
            fmap[j] = i
            j += 1
    spikes = [(fmap[i], v, z) for i, v, z in spikes]
    smooth = _smooth(finite, 9)
    plateaus_raw = _plateaus(smooth, segments, plateau_slope)
    plateaus = [(fmap[a], fmap[b], norm) for a, b, norm in plateaus_raw if (b - a) > len(rows) / segments / 2]
    rise = None
    if len(finite) >= 10:
        lastq = sum(finite[-max(len(finite) // 10, 1):]) / max(len(finite) // 10, 1)
        firstq = sum(finite[:max(len(finite) // 10, 1)]) / max(len(finite) // 10, 1)
        if lastq > firstq * 1.5:
            rise = (firstq, lastq)
    return {"n": len(rows), "steps": steps, "loss": loss,
            "spikes": spikes, "nonfinite": nonfinite,
            "plateaus": plateaus, "loss_rising": rise,
            "first": finite[0] if finite else None,
            "last": finite[-1] if finite else None,
            "min": min(finite) if finite else None,
            "min_at": steps[loss.index(min(finite))] if finite else None}


def _mkplot(res, rows, outdir):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        return None
    os.makedirs(outdir, exist_ok=True)
    series = {"loss": [r["loss"] for r in rows]}
    for k in ("lr", "grad_norm"):
        vals = [r.get(k) for r in rows]
        series[k] = vals if any(v is not None for v in vals) else None
    nplots = 1 + sum(1 for v in series.values() if v and k != "loss" and v is not None)
    fig, axes = plt.subplots(max(nplots, 1), 1, figsize=(7, 2.6 * max(nplots, 1)), sharex=True)
    axes = [axes] if nplots == 1 else axes
    ax = axes[0]
    ax.plot(res["steps"], res["loss"], lw=0.8, alpha=0.5, label="loss")
    sm = _smooth([v if v and math.isfinite(v) else float("nan") for v in res["loss"]], 9)
    ax.plot(res["steps"], sm, lw=1.2, label="smoothed")
    for i, v, z in res["spikes"]:
        ax.annotate("spike", (res["steps"][i], res["loss"][i]), fontsize=7, color="tab:red")
    for a, b, _ in res["plateaus"]:
        ax.axvspan(res["steps"][a], res["steps"][b], color="tab:orange", alpha=0.15)
    ax.set_ylabel("loss")
    ax.legend(fontsize=7)
    ai = 1
    for k in ("lr", "grad_norm"):
        vals = series.get(k)
        if not vals or ai >= len(axes):
            continue
        axes[ai].plot(res["steps"], vals, lw=0.9, color="tab:green" if k == "lr" else "tab:purple")
        axes[ai].set_ylabel(k)
        ai += 1
    axes[-1].set_xlabel("step")
    fig.tight_layout()
    paths = []
    for ext in ("png", "pdf"):
        p = os.path.join(outdir, "curves_diagnosis." + ext)
        fig.savefig(p, dpi=300)
        paths.append(p)
    return paths


def report(res, log_name):
    L = ["# 训练曲线诊断报告（%s，%d 条记录）" % (log_name, res["n"]),
         "- loss：%s（首）→ %s（末）→ min %s @step %s" % (res["first"], res["last"], res["min"], res["min_at"])]
    if res["nonfinite"]:
        bad = ", ".join("step %s(%s)" % (s, v) for s, v in res["nonfinite"][:8])
        L.append("- **[发散征兆]** 非有限 loss %d 处：%s%s" % (len(res["nonfinite"]), bad, " …" if len(res["nonfinite"]) > 8 else ""))
    if res["spikes"]:
        L.append("- **[尖峰]** %d 处（窗口 MAD 检测）：" % len(res["spikes"]))
        for i, v, z in res["spikes"][:10]:
            L.append("  - step %s：loss=%s，偏离滚动中位数 %.1fσ" % (res["steps"][i], v, z))
    if res["plateaus"]:
        L.append("- **[平台]** 平滑曲线 %d 段近零斜率：" % len(res["plateaus"]))
        for a, b, norm in res["plateaus"][:6]:
            L.append("  - step %s–%s（归一化斜率 %.2e）" % (res["steps"][a], res["steps"][b], norm))
    if res["loss_rising"]:
        L.append("- **[整体回升]** 末段均值 %.4g 高于首段 %.4g" % res["loss_rising"])
    if not (res["spikes"] or res["nonfinite"] or res["plateaus"] or res["loss_rising"]):
        L.append("- 未检测到明显异常（spike/NaN/平台/回升）。")
    L.append("\n症状→成因映射见 SKILL.md「诊断流程」；下一步验证方案请按最小改动原则给出。")
    return "\n".join(L)


def _demo(outdir="out"):
    """合成曲线：正常下降 + 中途 spike + 尾部平台 + 一个 NaN。"""
    import random
    random.seed(7)
    rows = []
    for i in range(400):
        loss = 2.5 * math.exp(-i / 80.0) + 0.35 + random.gauss(0, 0.012)
        if i == 180:
            loss = 1.9
        if i >= 300:
            loss = 0.36 + random.gauss(0, 0.004)
        if i == 260:
            loss = float("nan")
        rows.append({"step": float((i + 1) * 10), "loss": loss,
                     "lr": 1e-3 * (0.5 ** (i // 150)), "grad_norm": 1.2 + random.gauss(0, 0.3)})
    os.makedirs(outdir, exist_ok=True)
    p = os.path.join(outdir, "demo_train_log.csv")
    with open(p, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["step", "loss", "lr", "grad_norm"])
        w.writeheader()
        w.writerows(rows)
    return p


def main(argv=None):
    ap = argparse.ArgumentParser(description="训练曲线诊断")
    ap.add_argument("--log", help="日志文件（csv/tsv/jsonl/key=value txt）")
    ap.add_argument("--window", type=int, default=21, help="spike 检测滚动窗口")
    ap.add_argument("--spike-k", type=float, default=6.0, help="MAD 倍数阈值")
    ap.add_argument("--segments", type=int, default=8, help="平台检测分段数")
    ap.add_argument("--plateau-slope", type=float, default=1e-4, help="平台斜率阈值（归一化）")
    ap.add_argument("--out", default="out", help="图片输出目录（默认 ./out）")
    ap.add_argument("--no-plot", action="store_true")
    ap.add_argument("--demo", action="store_true")
    args = ap.parse_args(argv)
    path = args.log
    if args.demo:
        path = _demo(args.out)
        print("[demo] 合成日志已生成：%s" % path)
    if not path:
        ap.error("需要 --log 或 --demo")
    rows = load_log(path)
    if len(rows) < 5:
        raise SystemExit("有效记录不足 5 条，无法诊断")
    res = analyze(rows, args.window, args.spike_k, args.segments, args.plateau_slope)
    print(report(res, os.path.basename(path)))
    if not args.no_plot:
        paths = _mkplot(res, rows, args.out)
        if paths:
            print("\n三联图已保存：%s" % ", ".join(paths))
        else:
            print("\n（matplotlib 不可用，仅文本报告）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
