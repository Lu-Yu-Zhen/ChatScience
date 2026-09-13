---
name: 大模型架构分析
description: 分析大模型架构：参数量与显存估算、注意力变体对比、上下文长度与 KV cache、吞吐与并行策略。
---

# 大模型架构分析

## 标准估算（给公式并代入计算）
- 参数量：Transformer 每层 ≈ 12·d²（dense MHA+MLP），MoE 层按 expert 分摊；embedding 与 head 单独算。
- 训练显存 ≈ 参数(2B fp16) + 梯度(2B) + 优化器状态(fp32: 4B master + 8B Adam m,v) ≈ 16·N 字节/参数（混合精度）；推理显存 ≈ 2·N + KV cache。
- KV cache ≈ 2 · layers · heads · d_head · seq · batch · bytes。
- FLOPs ≈ 6·N·D（训练），2·N·D（推理）。

## 分析框架
1. 归纳架构要点：注意力变体（MHA/MQA/GQA/MLA/NSA/DSA）、位置编码、归一化位置、MoE 路由、长上下文方案。
2. 给出参数量/显存/算力的量化对比表（假设序列长度与 batch，写明假设）。
3. 指出该设计的瓶颈与适用规模区间。

## 输出要求
- 数值结论必须给推导过程；不确定的标注"估算"。
- 涉及具体论文时用检索工具核实数字，不要凭记忆引用参数量。

## 配套脚本与资源（位于本技能目录下）
- `scripts/estimator.py` — 参数量/显存/FLOPs/KV cache 估算器（纯标准库）。**凡涉及数值估算必须用它代入计算**，不心算：`python estimator.py --layers 12 --d 768 --heads 12 --vocab 50257 --seq 1024`；MoE 加 `--moe-experts 64 --moe-activated 8`；程序消费加 `--json`；看格式跑 `--demo`。脚本不在 cwd 时按 `data/skills-plugin/skills/model-arch-analysis/scripts/` 定位，找不到先用 Glob 搜 `estimator.py`。

## 通用约束（每个技能都要遵守）
- 沙箱以本机用户权限运行且无资源硬上限：**先用小样本/小 batch 验证脚本正确，再放大**。
- 需要事实依据时用检索工具（arxiv_search / fetch_url / kb_search）获取，不凭记忆断言；检索结论注明来源。
- 重要结论与实验数据用 note_write 写入笔记本（用户可见），不要只留在对话里。
- 代码放当前目录，图表与结果文件放 out/ 子目录。
- 数学公式用 LaTeX（行内 $...$，独立公式 $$...$$）。
