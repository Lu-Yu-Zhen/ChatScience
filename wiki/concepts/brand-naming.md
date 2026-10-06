---
type: concept
title: 品牌与命名纪律
tags: [品牌, 命名, 宣传, 墨台, InkForge]
sources: [墨台实现策划案/_src/05-宣传.md, app/package.json, app/src/pack.ts, app/src/server/qoder.ts]
updated: 2026-10-06
status: stable
---

# 品牌与命名纪律

> 一句话摘要：裁定口径是「墨台 / 墨道」为唯一产品名、ChatScience 降为英文与工程代号、InkForge 只作视觉基因库不作命名；代码现状与这条口径仍有一处结构性落差——产品 UI 与产物名里没有"墨台"。

## 为什么会并存

策划案把四套标识并存列为宣传板块的最高优先级风险：产品策划案的 墨台 / 墨道（水墨美学，仅文本规划）、已接入产品的 ChatScience 粉蓝气泡图标、未接入的 InkForge（墨砺，玄黑+石青+丹朱）、既有海报的 CHATSCIENCE 宝蓝科学风（`墨台实现策划案/_src/05-宣传.md:68-77`）。风险描述是"品牌名与视觉未统一前，任何投放都会造成认知混乱与资产浪费"。

## 裁定口径与出处

同节裁定建议（`墨台实现策划案/_src/05-宣传.md:79-90`）四条：产品名统一为墨台（主智能体名墨道）；英文名保留 ChatScience 作为英文标识与工程代号，理由是代码、包名、目录、技能命名已全面使用；InkForge 提案的色卡与辅助图形作为视觉基因库采纳，但放弃其命名；应用图标重做，因粉蓝气泡与墨色 UI 脱节。

## 各名称在仓库里的真实分布

| 名称 | 出现处 | 证据 |
|---|---|---|
| 墨道 | 主编排智能体的名字，代码里就是它 | `BUILTIN_AGENTS` 中 `id: 'agent-orchestrator', name: '墨道'`（`app/src/server/qoder.ts:148`），系统提示词自称「墨道」主智能体（`app/src/server/qoder.ts:151`） |
| 墨析 | 对话型内置智能体 | `id: 'agent-discuss', name: '墨析'`（`app/src/server/qoder.ts:172`） |
| 墨台 | 只出现在宣传与治理文本里 | 策划案 `墨台实现策划案/_src/05-宣传.md:1` 的标题；仓库内 `app/src` 只有 Wiki 工具用它命名（`app/src/tools/wiki-lint.ts:2`、`:502`）与登记资料路径（`app/src/tools/wiki-lint.ts:72`、`:82`） |
| ChatScience | 工程与产物身份 | 包名 `chatscience-desktop`（`app/package.json`），产物改名 `ChatScience.exe`（`app/src/pack.ts:90`、`:111`），验证报告标题（`app/verify/全功能验证报告.md:1`） |
| InkForge | 只在策划案与素材目录名里 | 素材 `inkforge-brand_assets/`（11 张图，见[品牌资产与站点素材](../sources/brand-and-site-assets.md)）；`app/src` 内除 Wiki 的 Raw 登记表前缀外无任何引用 |

按上表数一下：**产品代码里没有"墨台"这个字符串**（除 Wiki 工具自身），窗口标题与界面文案走的是另一套命名。这是"墨台为唯一产品名"这条口径尚未闭合的部分——图标重做任务在仓库里也无对应产物证据（本次未核验，不做断言）。

## 用法纪律

- 面向用户与宣传：用 墨台；提到主智能体用 墨道，提到对话智能体用 墨析。
- 面向工程：包名、目录、产物名、CI 里保留 ChatScience，不要为统一品牌去改代码标识。
- InkForge 只作为配色与辅助图形的来源，禁止把它当成产品名重新启用。
- 产品页与物料的表述要过[宣传合规红线](../concepts/promo-compliance.md)；命名混乱带来的投放风险见[05-宣传板块实现策划案](../sources/plan-05-promotion.md)。

## 关联

- 概念：[宣传合规红线](promo-compliance.md)
- 实体：[墨台产品](../entities/motai-product.md)、[墨道运行时](../entities/agent-runtime.md)、[墨台产品页站点](../entities/motai-site.md)
- 资料：[05-宣传板块实现策划案](../sources/plan-05-promotion.md)、[品牌资产与站点素材](../sources/brand-and-site-assets.md)
