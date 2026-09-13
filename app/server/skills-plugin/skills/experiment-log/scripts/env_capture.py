# -*- coding: utf-8 -*-
"""实验环境一键捕获：生成笔记「环境」小节 markdown（experiment-log 模板配套）。

与 mindspore-repro 的 env_probe 区别：本脚本只取最小必填项、输出精简一段，
专供 note_write 的「环境：」小节直接粘贴；不需要 MindSpore 细节时用它。

用法：python env_capture.py（或 --extra "A100 80G x4" 追加人工备注）
"""
import argparse
import importlib.metadata as im
import platform
import shutil
import subprocess
import sys
from datetime import datetime

KEY_PKGS = ["mindspore", "numpy", "scipy", "matplotlib", "pandas", "torch"]


def main(argv=None):
    ap = argparse.ArgumentParser(description="实验环境捕获")
    ap.add_argument("--extra", default="", help="人工备注（如硬件拓扑、特殊配置）")
    args = ap.parse_args(argv)

    vers = []
    for name in KEY_PKGS:
        try:
            vers.append("%s %s" % (name, im.version(name)))
        except im.PackageNotFoundError:
            continue
    gpu = ""
    if shutil.which("nvidia-smi"):
        try:
            r = subprocess.run(["nvidia-smi", "--query-gpu=name,memory.total",
                                "--format=csv,noheader"], capture_output=True, text=True, timeout=15)
            gpus = [g.strip() for g in r.stdout.splitlines() if g.strip()]
            if gpus:
                gpu = "；GPU：%s" % ("; ".join(gpus))
        except Exception:
            pass
    lines = [
        "- 时间：%s" % datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "- Python：%s（%s）" % (sys.version.split()[0], platform.system()),
        "- 关键包：" + "，".join(vers),
        "- 平台：%s%s" % (platform.platform(), gpu),
    ]
    if args.extra:
        lines.append("- 备注：%s" % args.extra)
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
