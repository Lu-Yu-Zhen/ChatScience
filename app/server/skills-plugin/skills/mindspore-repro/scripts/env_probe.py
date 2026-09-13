# -*- coding: utf-8 -*-
"""MindSpore 复现环境探针：一键收集版本/CUDA/算子可用性，输出可粘贴的环境块。

设计动机：SKILL.md 要求"环境信息完整到可复现"。每次现写探测代码费时且漏项；
本脚本固化为一条命令，输出 markdown 环境小节，直接贴进 note_write 的笔记。

检查项：
- Python 版本与平台
- MindSpore 版本；--deep 时跑 mindspore.run_check()（编译算子，耗时数秒）
- GPU：nvidia-smi（名称/显存/驱动），探测不到时明确说明
- 关键包版本：numpy / scipy / matplotlib / pandas / sympy
- --train：最小前反向 sanity（nn.Cell 单 Dense 层 1 step，CPU），
  验证"能建图、能反向"——复现前先跑通这个，再谈模型本身。

用法：
  python env_probe.py            # 快速模式
  python env_probe.py --deep     # 加跑 mindspore.run_check()
  python env_probe.py --train    # 加跑最小前反向
"""
import argparse
import importlib.metadata as im
import platform
import shutil
import subprocess
import sys

KEY_PKGS = ["mindspore", "numpy", "scipy", "matplotlib", "pandas", "sympy", "torch"]


def pkg_versions():
    out = {}
    for name in KEY_PKGS:
        try:
            out[name] = im.version(name)
        except im.PackageNotFoundError:
            out[name] = None
    return out


def gpu_info():
    if not shutil.which("nvidia-smi"):
        return None
    try:
        r = subprocess.run(["nvidia-smi", "--query-gpu=name,memory.total,driver_version",
                            "--format=csv,noheader"], capture_output=True, text=True, timeout=15)
        return [line.strip() for line in r.stdout.splitlines() if line.strip()]
    except Exception:
        return None


def probe(deep=False, with_train=False):
    L = ["## 环境", "", "- 时间：%s" % __import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
         "- Python：%s（%s）" % (sys.version.split()[0], platform.platform())]
    vers = pkg_versions()
    L.append("- 包版本：" + "，".join("%s %s" % (k, v or "未安装") for k, v in vers.items() if v))
    missing = [k for k, v in vers.items() if v is None]
    if missing:
        L.append("- 未安装：%s" % "，".join(missing))
    gpus = gpu_info()
    if gpus:
        for i, g in enumerate(gpus):
            L.append("- GPU%d：%s" % (i, g))
    else:
        L.append("- GPU：未检测到 nvidia-smi（可能纯 CPU 环境）")
    if vers.get("mindspore"):
        ms = __import__("mindspore")
        L.append("- MindSpore 默认后端：mindspore.get_context('device_target')")
        if deep:
            L.append("- run_check：")
            try:
                ms.run_check()
            except Exception as e:
                L.append("  - 失败：%s" % e)
        if with_train:
            L.append("- 最小前反向 sanity：")
            try:
                import numpy as np
                import mindspore as ms
                import mindspore.nn as nn
                from mindspore import Tensor, Parameter
                ms.set_context(mode=ms.PYNATIVE_MODE, device_target="CPU")
                ms.set_seed(0)
                net = nn.Dense(4, 2)
                loss_fn = nn.MSELoss()
                opt = nn.SGD(net.trainable_params(), learning_rate=0.1)

                def forward_fn(x, y):
                    return loss_fn(net(x), y)

                grad_fn = ms.value_and_grad(forward_fn, None, weights=opt.parameters)
                x = Tensor(np.random.rand(8, 4).astype(np.float32))
                y = Tensor(np.random.rand(8, 2).astype(np.float32))
                loss, grads = grad_fn(x, y)
                opt(grads)
                n_params = sum(int(np.prod(p.shape)) if isinstance(p, Parameter) else 0
                               for p in net.get_parameters())
                L.append("  - 通过：1 step 完成，loss=%.4f，参数量=%d，可建图可反向" % (float(loss.asnumpy()), n_params))
            except Exception as e:
                L.append("  - 失败：%s: %s" % (type(e).__name__, e))
    return "\n".join(L)


def main(argv=None):
    ap = argparse.ArgumentParser(description="MindSpore 环境探针")
    ap.add_argument("--deep", action="store_true", help="加跑 mindspore.run_check()")
    ap.add_argument("--train", action="store_true", help="加跑最小前反向 sanity")
    args = ap.parse_args(argv)
    print(probe(args.deep, args.train))
    print("\n（本块可直接作为笔记「环境」小节内容）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
