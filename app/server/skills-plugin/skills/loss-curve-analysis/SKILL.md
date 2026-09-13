---
name: 训练曲线诊断
description: 诊断 loss/lr/grad norm 曲线：发散、平台、震荡、尖峰的成因定位与修复建议。
---

# 训练曲线诊断

## 输入
训练日志/CSV（用户粘贴或沙箱文件）。至少包含 step、loss；有 lr/grad_norm 更好。

## 诊断流程
1. 用 run_code 载入数据，画 loss-lr-grad norm 三联图到 out/（横轴统一 step）。
2. 按症状定位：
   - **尖峰（spike）**：数据异常/数值溢出/学习率过高 → 查看对应 step 的数据批次与 grad_norm。
   - **平台不降**：容量不足/lr 过低/标签噪声/梯度消失 → 做一次 lr 扫描或逐层范数检查。
   - **震荡**：batch 过小/momentum 不当/数据分布抖动。
   - **发散（NaN）**：先查前向数值范围，再查 loss 实现（log(0)、除零、fp16 溢出）。
3. 给出修复建议并按预期收益排序。

## 输出要求
- 结论必须指向曲线上的具体位置（step 区间）与数值证据。
- 修复建议附最小验证方案（如"把 lr 减半重跑前 200 step 对比"）。

## 配套脚本与资源（位于本技能目录下）
- `scripts/diagnose.py` — 日志解析 + spike/NaN/平台检测 + 三联图一体化：`python diagnose.py --log train.csv`（支持 csv/tsv/jsonl/key=value 日志，自动嗅探列名），产物 `out/curves_diagnosis.png/.pdf` 与带 step 区间的文本报告。**先跑脚本再补充自己的判断**，阈值可调（`--window` `--spike-k` `--plateau-slope`）。首次用 `--demo` 熟悉输出。

## 通用约束（每个技能都要遵守）
- 沙箱以本机用户权限运行且无资源硬上限：**先用小样本/小 batch 验证脚本正确，再放大**。
- 需要事实依据时用检索工具（arxiv_search / fetch_url / kb_search）获取，不凭记忆断言；检索结论注明来源。
- 重要结论与实验数据用 note_write 写入笔记本（用户可见），不要只留在对话里。
- 代码放当前目录，图表与结果文件放 out/ 子目录。
- 数学公式用 LaTeX（行内 $...$，独立公式 $$...$$）。
