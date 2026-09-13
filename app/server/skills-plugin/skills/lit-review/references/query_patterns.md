# arXiv 检索式模板（配合 arxiv_search 工具）

> 原则：同义词、缩写全称、上位词各检索一轮；每轮记录检索式（写进报告可复现）。
> arxiv_search 的 query 多词按 AND 组合，优先用术语原词，少用自然语言长句。

## 按目的选检索式

| 目的 | 检索式模式 | 示例 |
|---|---|---|
| 找方法原始论文 | 方法名 + 首作作者 | `speculative decoding` / `grouped query attention` |
| 找复现目标 | 方法名 + benchmark 名 | `Mamba long context benchmark` |
| 找对比基线 | 任务名 + survey | `retrieval augmented generation survey` |
| 找矛盾结论 | 方法名 + `limitations` / `failure` | `rotary embedding extrapolation` |
| 追踪最新 | 主题词 + 缩写全称各一轮 | `Mixture of Experts` 与 `MoE routing` |

## 检索纪律
1. 每个概念至少 2 个变体（全称/缩写/同义词），记录每轮 query 与命中数。
2. 命中去重按 arXiv id；初筛只读标题+摘要，入选再 fetch_url 核对正文。
3. 时间窗：先无窗看分布，再按研究问题收窄（如近 24 个月）。
4. 每轮检索式写进综述附录，保证可复现。
5. 引用给 arXiv id + 链接；"论文声称"与"核实过"分开标注。

## 产出物
- 候选清单：id / 标题 / 一句话为什么入选
- 对比表：方法 / 核心思想 / 数据集 / 指标 / 局限
- 空白分析：未覆盖组合、相互矛盾点
- 文献表导出：用 scripts/bib_export.py 把入选论文转 BibTeX
