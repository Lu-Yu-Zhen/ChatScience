# -*- coding: utf-8 -*-
"""MindSpore 网络模板：nn.Cell 结构（复制后按论文改 TODO）。

对应 SKILL.md 必备结构的 model/：__init__ 定义子模块，construct 定义前向；
命名尽量与论文符号对应（如 self.attn、self.ffn），便于逐层 dump 对齐。
"""
import mindspore.nn as nn


class TinyMLP(nn.Cell):
    """两层 MLP 分类器：仅作管道自检的最小网络，替换成论文模型时保持此文件组织方式。"""

    def __init__(self, in_dim=20, hidden=64, n_classes=2):
        super().__init__()
        # TODO: 按论文结构拆模块；每个子模块一个属性，方便逐层对齐与 checkpoint 阅读
        self.fc1 = nn.Dense(in_dim, hidden)
        self.act = nn.ReLU()
        self.fc2 = nn.Dense(hidden, n_classes)

    def construct(self, x):
        # TODO: 前向逻辑与论文公式一一对应；复杂模型在此拆分 forward 子函数
        return self.fc2(self.act(self.fc1(x)))
