# -*- coding: utf-8 -*-
"""MindSpore 训练入口模板（复制到复现项目根目录后改 TODO 处）。

对应 SKILL.md 必备结构的 train.py：argparse 超参、set_seed、GeneratorDataset、
Model.train + LossMonitor + ModelCheckpoint。默认跑在合成数据上（可直接运行
自检），接真实数据集只需改 dataset.py。
用法：python train_template.py --epochs 2 --batch-size 16
"""
import argparse

import mindspore as ms
import mindspore.nn as nn
from mindspore import Model
from mindspore.train.callback import LossMonitor, TimeMonitor, ModelCheckpoint, CheckpointConfig

from dataset_template import make_dataset          # 数据管道见 dataset_template.py
from model_template import TinyMLP                 # 网络见 model_template.py


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--epochs", type=int, default=2)
    p.add_argument("--batch-size", type=int, default=16)
    p.add_argument("--lr", type=float, default=1e-3)
    p.add_argument("--seed", type=int, default=42, help="随机种子，复现必须记录")
    p.add_argument("--device", default="CPU", choices=["CPU", "GPU", "Ascend"])
    p.add_argument("--out", default="out", help="checkpoint 与日志目录")
    # TODO: 按论文补齐超参（权重衰减、warmup、调度器等），缺的标注 [需假设]
    return p.parse_args()


def main():
    args = parse_args()
    # 随机性三件套：mindspore / numpy / python（random 由框架内部覆盖大多数场景）
    ms.set_seed(args.seed)
    ms.set_context(mode=ms.PYNATIVE_MODE, device_target=args.device)

    net = TinyMLP(in_dim=20, hidden=64, n_classes=2)
    loss_fn = nn.CrossEntropyLoss()
    opt = nn.Adam(net.trainable_params(), learning_rate=args.lr)

    ds = make_dataset(n_samples=512, in_dim=20, batch_size=args.batch_size)

    model = Model(net, loss_fn=loss_fn, optimizer=opt,
                  metrics={"acc": nn.Accuracy()})

    ckpt_cb = ModelCheckpoint(prefix="tinymlp",
                              directory=args.out,
                              config=CheckpointConfig(save_checkpoint_steps=50, keep_checkpoint_max=3))
    # 训练（验证集留空时 train 后单独 eval）
    model.train(args.epochs, ds,
                callbacks=[TimeMonitor(), LossMonitor(per_print_times=4), ckpt_cb],
                dataset_sink_mode=False)   # CPU 必须 False；GPU 小数据也建议 False 便于逐 step 观察

    print("训练完成；checkpoint 在 %s/；下一步：eval_template 评估 + 训练曲线诊断技能核对曲线。" % args.out)


if __name__ == "__main__":
    main()
