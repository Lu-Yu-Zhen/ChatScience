# -*- coding: utf-8 -*-
"""逐层输出对齐核对器：比较两个 .npz（如 PyTorch 参考实现 vs MindSpore 移植）。

设计动机：SKILL.md 要求"与 PyTorch 参考实现对照时逐层输出对齐（atol/rtol 写明）"。
两个框架各 dump 一份 npz（key=层名，value=该层输出张量），本脚本逐 key 对拍并
输出最大绝对/相对误差表，第一个超阈值的层就是移植出错的位置。

dump 约定（两个框架都适用，在 forward 里钩子取输出）：
  np.savez("ms_layers.npz", **{layer_name: tensor.numpy()})

用法：
  python layer_align_check.py --a torch_layers.npz --b ms_layers.npz
  python layer_align_check.py --a a.npz --b b.npz --atol 1e-4 --rtol 1e-4 --top 15
  python layer_align_check.py --demo
"""
import argparse
import os
import sys

import numpy as np


def compare(a_path, b_path, atol=1e-5, rtol=1e-5, top=20):
    a, b = np.load(a_path), np.load(b_path)
    ka, kb = set(a.files), set(b.files)
    print("A=%s（%d 层）  B=%s（%d 层）  容差：atol=%g rtol=%g" % (a_path, len(ka), b_path, len(kb), atol, rtol))
    if ka - kb:
        print("[警告] 仅 A 有的层：%s" % ", ".join(sorted(ka - kb)))
    if kb - ka:
        print("[警告] 仅 B 有的层：%s" % ", ".join(sorted(kb - ka)))
    common = sorted(ka & kb)
    rows, n_bad = [], 0
    for k in common:
        x, y = np.asarray(a[k], dtype=np.float64), np.asarray(b[k], dtype=np.float64)
        if x.shape != y.shape:
            rows.append((k, "SHAPE %s vs %s" % (x.shape, y.shape), "-", "-"))
            n_bad += 1
            continue
        diff = np.abs(x - y)
        max_abs = float(diff.max()) if diff.size else 0.0
        denom = np.maximum(np.abs(x), np.abs(y))
        max_rel = float((diff / np.maximum(denom, 1e-12)).max()) if diff.size else 0.0
        bad = not np.allclose(x, y, atol=atol, rtol=rtol)
        n_bad += bad
        rows.append((k, "%.3e" % max_abs, "%.3e" % max_rel, "超阈值" if bad else "ok"))
    print("\n| 层 | max_abs | max_rel | 判定 |", "\n|---|---|---|---|")
    for r in rows:
        print("| %s | %s | %s | %s |" % r)
    print("\n结论：%d/%d 层通过。" % (len(common) - n_bad, len(common)))
    if n_bad:
        bad_keys = [r[0] for r in rows if r[3] == "超阈值" or r[1].startswith("SHAPE")]
        print("首个不匹配层：%s —— 从该层及其前一层的实现查起（权重加载/归一化位置/精度设置）。" % bad_keys[0])
        return 1
    return 0


def _dump_demo(outdir="out"):
    """生成一对演示 npz：B 在第 3 层起被注入 1e-2 的偏差，演示定位能力。"""
    rng = np.random.default_rng(0)
    os.makedirs(outdir, exist_ok=True)
    da, db = {}, {}
    h = rng.normal(size=(16, 8))
    for i in range(6):
        w = rng.normal(size=(8, 8)) * 0.1
        h = np.tanh(h @ w)
        da["layer%d" % i] = h.copy()
        db["layer%d" % i] = h + (0.01 if i >= 3 else 0.0)
    pa, pb = os.path.join(outdir, "demo_a.npz"), os.path.join(outdir, "demo_b.npz")
    np.savez(pa, **da)
    np.savez(pb, **db)
    return pa, pb


def main(argv=None):
    ap = argparse.ArgumentParser(description="逐层输出对齐核对")
    ap.add_argument("--a", help="参考实现 dump 的 npz")
    ap.add_argument("--b", help="待核对实现 dump 的 npz")
    ap.add_argument("--atol", type=float, default=1e-5)
    ap.add_argument("--rtol", type=float, default=1e-5)
    ap.add_argument("--top", type=int, default=20, help="仅展示前 N 层（0=全部）")
    ap.add_argument("--demo", action="store_true")
    args = ap.parse_args(argv)
    if args.demo:
        pa, pb = _dump_demo()
        print("[demo] 已生成 %s / %s\n" % (pa, pb))
        return compare(pa, pb, 1e-6, 1e-6)
    if not (args.a and args.b):
        ap.error("需要 --a/--b 或 --demo")
    return compare(args.a, args.b, args.atol, args.rtol, args.top)


if __name__ == "__main__":
    sys.exit(main())
