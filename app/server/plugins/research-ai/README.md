# research-ai · 人工智能领域科研外挂

为 ChatScience 墨道追加 AI 领域的子智能体、技能、命令与 MCP 工具，覆盖「文献 → 实验设计 → 数据质检 → 训练执行 → 评测」全链路。

## 能力清单

| 类型 | 名称 | 用途 |
|---|---|---|
| agent | ai-experiment | 实验设计与执行：超参管理、冒烟验证、日志定位、指标汇总 |
| agent | ai-lit-survey | 文献三要素提取（贡献/方法/设置）、主题聚类、可复现性标注 |
| agent | repro-auditor | 论文复现审计：协议抽取（未披露项标注）、风险分级、逐步复现计划 |
| skill | benchmark-kit | 基准协议：数据划分/污染检查/显著性/公平对比清单 |
| skill | prompt-audit | 提示词审查与回归测试（校准样本集 + 一致性） |
| skill | eval-rubric | 评测评分细则：维度锚点、κ 一致性、防位置/长度偏置 |
| command | ai-exp-plan | 生成实验计划（假设/矩阵/资源/时间线/风险） |
| command | data-audit | 训练前数据质检（画像/污染/划分建议） |
| tool | gpu_mem_estimate | 训练/推理显存分解估算（权重/梯度/Adam/KV cache） |
| tool | token_budget | 训练预算：总 token、优化器步数、预计时长 |
| tool | data_profile | CSV/TSV/JSONL 数据画像：类型/缺失率/分布/高频值 |

## 应用示例

**例 1 · 训练可行性速判**

> 「7B 模型 bf16 全参微调 2B tokens 的训练数据，batch 16、seq 4096，A100 集群要跑多久？先给显存再给时间。」

墨道会依次调用 `gpu_mem_estimate`（激活估算）与 `token_budget`（步数/时长），并给出风险提示（ZeRO/并行会改变分布）。

**例 2 · 训练前数据质检**

> 「委派 repro-auditor：先用 data_profile 给 data/train.jsonl 前 5000 行画像，报告缺失率超 20% 的字段和数值越界。」

数据画像输出字段级统计，全部数字来自工具实际输出；异常字段会给出清洗建议。

**例 3 · 复现审计**

> 「委派 research-ai:repro-auditor 审计这篇论文的实验章节，列出原文未披露的关键超参。」

产出四要素协议表 + 缺口分级（阻断/存疑/可容忍）+ 逐步复现计划。

## 配置

在插件目录放 `config.json` 覆盖默认值（见 configSchema.json）：

```json
{ "default_hidden": 4096, "default_seq_len": 4096, "default_throughput_tps": 45000 }
```

## 边界与诚实性

- 所有估算标注经验系数与误差范围（±30%），不冒充实测。
- agents 拒绝编造指标：跑不了的实验明确标注「未验证」。
