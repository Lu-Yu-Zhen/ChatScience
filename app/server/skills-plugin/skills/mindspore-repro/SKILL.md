---
name: MindSpore 复现骨架
description: 用 MindSpore 复现论文模型与训练流程：nn.Cell 结构、数据管道、Model.train、回调与 checkpoint、混合精度配置。
---

# MindSpore 复现骨架

## 代码规范
- 模型用 `nn.Cell`：`__init__` 定义子模块，`construct` 定义前向；命名与论文符号对应。
- 训练用 `Model.train` + `LossMonitor`/`TimeMonitor`/自定义 `Callback`；checkpoint 用 `ModelCheckpoint`。
- 混合精度：`Model(..., amp_level="O2")` 或 `auto_mixed_precision`；注意论文若用 bf16 需说明差异。
- 随机性：`set_seed(seed)` + `numpy.random.seed`；数据管道用 `GeneratorDataset`/`Cifar10Dataset` 等。

## 必备结构（用户要求复现时按此组织）
```
model/         # 网络（按模块分文件）
train.py       # 训练入口（argparse 超参）
eval.py        # 评估入口
dataset.py     # 数据管道
out/           # checkpoint 与日志
```

## 注意
- 验证顺序：先 CPU 小样本前向 → 单卡小 batch 反向 → 短训练收敛 → 全量。
- 遇到算子缺失/精度问题，写明报错全文并用 run_code 复现最小案例。
- 与 PyTorch 参考实现对照时，逐层输出对齐（ atol/rtol 阈值写明）。

## 配套脚本与资源（位于本技能目录下）
- `scripts/env_probe.py` — 环境探针：`python env_probe.py --deep --train` 输出可粘贴的「环境」小节（版本/GPU/后端/最小前反向 sanity）。**复现前先跑**，结果进实验笔记。
- `scripts/layer_align_check.py` — 逐层输出对拍：两框架各 `np.savez("layers.npz", **{层名: 输出})` 后 `python layer_align_check.py --a torch.npz --b ms.npz --atol 1e-5`，首个超阈值层即出错位置。`--demo` 看示例。
- `assets/train_template.py`、`assets/dataset_template.py`、`assets/model_template.py`、`assets/eval_template.py` — 可运行的工程骨架（argparse/set_seed/GeneratorDataset/ModelCheckpoint），复制到项目根目录改 TODO 处即可；assets 四件可直接运行自检（合成数据）。
- `references/api_mapping.md` — PyTorch↔MindSpore API 对照与移植易错点（Dense 权重形状、zero_grad 无需、amp 粒度差异等），移植前先读。

## 通用约束（每个技能都要遵守）
- 沙箱以本机用户权限运行且无资源硬上限：**先用小样本/小 batch 验证脚本正确，再放大**。
- 需要事实依据时用检索工具（arxiv_search / fetch_url / kb_search）获取，不凭记忆断言；检索结论注明来源。
- 重要结论与实验数据用 note_write 写入笔记本（用户可见），不要只留在对话里。
- 代码放当前目录，图表与结果文件放 out/ 子目录。
- 数学公式用 LaTeX（行内 $...$，独立公式 $$...$$）。
