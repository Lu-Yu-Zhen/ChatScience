# -*- coding: utf-8 -*-
"""MindSpore 评估模板：加载 checkpoint → 测试集指标（对应必备结构的 eval.py）。

用法：python eval_template.py --ckpt out/tinymlp-2_50.ckpt
指标输出为"原样数字"（不美化舍入），供 experiment-log 技能记录。
"""
import argparse

import mindspore as ms
import mindspore.nn as nn
from mindspore import Model, load_checkpoint, load_param_into_net

from dataset_template import make_dataset
from model_template import TinyMLP


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--ckpt", required=True, help="ModelCheckpoint 保存的 .ckpt 路径")
    p.add_argument("--batch-size", type=int, default=32)
    p.add_argument("--n-samples", type=int, default=256)
    p.add_argument("--device", default="CPU")
    args = p.parse_args()

    ms.set_context(mode=ms.PYNATIVE_MODE, device_target=args.device)
    net = TinyMLP(in_dim=20, hidden=64, n_classes=2)
    params = load_checkpoint(args.ckpt)
    not_loaded = load_param_into_net(net, params)
    if not_loaded not in (None, [], ([], [])):
        print("[提示] 有参数未加载：%s（检查网络结构是否与 checkpoint 匹配）" % (not_loaded,))

    ds = make_dataset(n_samples=args.n_samples, batch_size=args.batch_size, shuffle=False)
    model = Model(net, loss_fn=nn.CrossEntropyLoss(), metrics={"acc": nn.Accuracy()})
    result = model.eval(ds, dataset_sink_mode=False)
    # 原样打印，不做舍入美化——experiment-log 纪律要求关键数字原样记录
    print("eval result:", result)


if __name__ == "__main__":
    main()
