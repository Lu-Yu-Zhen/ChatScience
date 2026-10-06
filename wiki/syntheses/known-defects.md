---
type: synthesis
title: 有意保留的已知缺陷
tags: [缺陷, 技术债, 遗留行为, 墨台]
sources: [app/src/server/, app/src/webapp/, app/verify/, app/TypeScript迁移说明.md]
updated: 2026-10-06
status: stable
---

# 有意保留的已知缺陷

> 一句话摘要：这些都是"代码里看得见、文档里承认"的已知问题，不是新 bug——每条给现象、证据、影响面与是否被验证脚本覆盖，用来判断哪些能安全忽略、哪些一动就要补断言。

收录口径：只收源码注释、源码行为或验证报告里有直接证据的条目；推测与"感觉不对"不写。

## 一、请求与提示链路

**D1 · 思考开关不进上游请求体。** Chat 侧会调 `applyThinking(chatOpts, ..., body.thinking === true)`（`app/src/server/index.ts:251`），该函数按厂商差异写 `thinking` / `enable_thinking` / `reasoning`（`app/src/server/ai.ts:46`，字段声明见 `app/src/shared/domain.ts:311-312`）。但 `chatStream()` 组的是全新 body，只带 `model`、`messages`、`stream`、`temperature` 与 web 搜索（`app/src/server/ai.ts:111-116`），前面写进 `opts` 的思考字段不会被带上。影响：界面上的思考开关对上游不生效，思考增量仍可能因模型默认行为出现（解析见 `app/src/server/ai.ts:132`）。覆盖：Chat 管线三项（chat-verify / stream-verify / noweb-test，登记于 `app/src/verify/verify-suite.ts`）验的是注入、时序与 TTFT，未断言思考字段。

**D2 · 子智能体运行提示不在界面出现。** 后端在委派前后发 `notice`，code 为 `subagent_start` / `subagent_stop`（`app/src/server/qoder.ts:721`、`:702`），而渲染层 `notice` 分支只对 `tools_truncated`、`mcp_not_connected`、`no_tool_calls` 三种 code 弹提示（`app/src/webapp/work/70-agent-chat.ts:211-214`）。影响：委派过程信息被丢弃，用户看不出子智能体何时启停；trace 面板另有一路可见，见[Work 模块群](../entities/work-modules.md)。

## 二、沙箱与路由

**D3 · 运行时探测文案的"无"分支恒不生效。** 表达式 `+ '（已探测：' + Object.keys(rt.runtimes).join(', ') || '无' + '）'`（`app/src/server/sandbox.ts:176`）里 `||` 优先级低于 `+`，左侧拼接串恒为真值，`'无' + '）'` 永远取不到，且括号位置使右半段脱离了预期语义。影响：无可用运行时时的提示缺失。属文案缺陷，不影响执行判定。

**D4 · `?force=1` 实际仍走 TTL 缓存。** 代码注释自陈"routes 的 ?force=1 实际走 TTL 缓存（遗留行为，迁移说明里有记录）"（`app/src/server/sandbox.ts:538`）。影响：调用方以为能强刷，实则可能拿缓存；迁移期有意保留，见[TypeScript 迁移说明](../sources/ts-migration.md)。

**D5 · 无工作区项目时文件信号恒不命中。** 路由建议端点声明接受 `text` 与 `workspaceRoot`（`app/src/server/routes.ts:378-379`），后端只在 `workspaceRoot` 非空时进入文件信号分支（`app/src/server/qoder.ts:1618`），而前端只有选中工作区项目才附带该参数（`app/src/webapp/work/35-skills.ts:466-467`）。影响：未选项目时建议只由文本决定，插件的目录特征不参与打分——这是可预期行为，但界面没有说明。

## 三、文档与簿记类（改了才算还债）

**D6 · 注释与清单漂移。** 知识库头注释仍写"中文 bigram + 单字"，实现只建 bigram（`app/src/server/kb.ts:5` 对 `:63-71`）；根 `AGENTS.md:10` 与 `app/src/verify/verify-suite.ts:14` 都记"手写 JS 14 个"，按动态判据实测 19 个；`app/verify/验证报告.md:3` 的环境行称 Electron 内置 Node 24，同文 `:237` 论证的却是内置 Node 20 不支持 `require(esm)`。逐条见[策划案与源码偏差清单](plan-vs-code-gaps.md)。

**D7 · 蓝图与话术的落差。** 订阅计费自判"实质零实现"（`墨台实现策划案/_src/06-订阅预付费.md:9`），产品页却已有档位与算力话术（`墨台产品页.html:1237`、`:1400`）；投放前需过红线第 5 条，见[宣传合规红线](../concepts/promo-compliance.md)。

## 四、能力边界类：约束放错层

**D8 · 技能正文里的硬约束是概率性生效的。** 2026-10-05 第五批验收里，无约束提示下模型**两次**独立复现"不读数据、直接编一组看着合理的数据画图"；把硬约束写进 `app/server/skills-plugin/skills/figure-plot/SKILL.md` 顶部后**仍然复现**——因为那一回合模型没有显式加载技能，技能正文根本没进上下文；只有提示里显式要求"数据必须来自指定 CSV"时行为立刻正确。报告给的结论是：数据真实性这类约束只能落在底座系统提示（每回合都在场）或工具层校验（出图时要求声明数据来源文件并核对存在性），当前只落在技能正文，本批未擅自改底座提示词（`app/verify/全功能验证报告.md:220-224`）。影响面与判断依据见[科研领域插件](../entities/research-plugins.md)。

**D9 · 子智能体起止提示仍不落界面。** D2 未修：`subagent_start` / `subagent_stop` 照发（`app/src/server/qoder.ts:721`、`:727`），前端仍只认三种 code（`app/src/webapp/work/70-agent-chat.ts:211-214`）。

## 处理建议

D1 与 D2 属"一改就有效果"的小切口：D1 需要把 `applyThinking` 的目标从 `opts` 换成上游 body 对象，D2 需要在前端 notice 分支补两种 code。D3 是括号与优先级修正。D4 若要恢复强刷语义，需同时补断言。D5 建议先补界面说明。D6/D7 是文档与物料的活，不占开发依赖。

## 关联

- 综合：[策划案与源码偏差清单](plan-vs-code-gaps.md)、[验证脚本与功能矩阵](verify-feature-matrix.md)
- 实体：[沙箱与工作台](../entities/sandbox-workspace.md)、[墨道运行时](../entities/agent-runtime.md)、[验证套件](../entities/verification-suite.md)
- 概念：[沙箱边界](../concepts/sandbox-boundaries.md)、[构建产物同步纪律](../concepts/artifact-sync.md)
