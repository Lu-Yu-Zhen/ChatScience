---
type: synthesis
title: 验证脚本与功能矩阵
tags: [验证, 脚本, 覆盖, 质量, 墨台]
sources: [app/verify/, app/src/verify/, app/package.json, app/TypeScript迁移说明.md]
updated: 2026-10-06
status: stable
---

# 验证脚本与功能矩阵

> 一句话摘要：`app/verify` 现有 37 个脚本、分五层登记在套件里，其中 23 个是手写 JS、14 个由 `app/src/verify/*.ts` 编译；2026-10-05 新增的四个脚本把"科研能力真跑 + 右栏预览 + 过程连拍"补进了覆盖面，但也留下两处描述性数字滞后。

## 怎么读这张表

分层、说明与用法来自登记处 `app/src/verify/verify-suite.ts:45-82`，五个层名定义在 `app/src/verify/verify-suite.ts:31`，手写/编译判据是"是否存在同名 `app/src/verify/<name>.ts`"（`app/src/verify/verify-suite.ts:14`）。命令入口：`npm run verify` 列全部、`npm run verify <name>` 单跑、`npm run verify -- --all` 全量（`app/package.json`）。规模与判定由运行时自报，不写死在代码里。

| 层 | 数量 | 脚本（★=手写 JS，其余为编译产物） | 验的是什么 |
|---|---|---|---|
| 沙箱 | 1 | sandbox-verify | 引擎 18 项：超时强杀、路径守卫、声明式断网、并发信号量（`app/src/verify/verify-suite.ts:45`） |
| SDK | 14 | ★agent-run-diag、★byok-bisect、★byok-diag、★byok-experiment、★byok-run-check、★userdata-check + agent-system-verify、agent-verify、kb-verify、memory-verify、sdk-smoke、sdk-verify、ts-migration-smoke、workspace-verify | 真实 `query()` 与 PAT、工具隔离与科研工具注入、resume 回忆、项目记忆 23 项、知识库 BM25 7 项、工作区越界写拦截、服务端 API 面冒烟，以及 BYOK 的四种定位手段 |
| 技能 | 5 | ★domain-p2p5p6-verify、★domain-switch-verify、★science-capability-verify、★plugin-experiment + skills-verify | 双领域切换、外挂验收 11 项（路由建议/文献检索/台账）、**科研能力真跑 12 场景（数据分析/统计/绘图溯源/实验记录/文献/数学/领域，`app/src/verify/verify-suite.ts:63`）**、插件结构校验与 MCP 状态、技能启用白名单端到端 |
| UI | 14 | ★agent-api-verify、★anim-coord-check、★cdp-eval、★cdp-ui、★input-edge-check、★layout-center-check、★layout-refine-check、★plugin-route-ui-verify、★right-panel-preview-verify、★science-process-shots、★science-ui-verify、★settings-e2e、★settings-geometry + exe-verify | 打包版 exe 端到端、真实点击链路驱动、**Work 界面科研链路 7 项（真实点击发送→工具轨迹真名→数字与真值一致→台账增长，`app/src/verify/verify-suite.ts:64`）**、**右侧栏预览 17 项（`ws/raw` 白名单语义 + 真实点击出图出文本，`app/src/verify/verify-suite.ts:65`）**、**执行期每 5 秒一帧的过程连拍（`app/src/verify/verify-suite.ts:66`）**、设置页五面板实测 |
| Chat 管线 | 3 | chat-verify、stream-verify、noweb-test | Chat API 十轮全文注入与中断恢复、SSE 分块时序、`web=false` 的 TTFT 对照 |

界面类脚本普遍要求**打包版在跑**：exe-verify 的登记说明写了"需先 node pack.js"（`app/src/verify/verify-suite.ts:68`），cdp-ui 给出 click/click-text/type/text/eval/wait-for/shot 等动作（`app/src/verify/verify-suite.ts:71-72`）。最近一轮全功能验证的驱动方式同样印证——打包版 `ChatScience.exe` 开 `--remote-debugging-port=9223` + CDP 真实点击（`app/verify/全功能验证报告.md:3`）。所以这些脚本验的不是开发态，产物与源码不同步时结果会骗人，见[构建产物同步纪律](../concepts/artifact-sync.md)。

## 两处数字已经滞后

- `app/src/verify/verify-suite.ts:49` 把 agent-system-verify 描述为「Agent 系统 11 项」，但 2026-10-05 那次运行的指标文件记 `total: 31`、`pass: 31`，条目编号从 V2 排到 V11d（`app/verify/agent-system-metrics.json:1-6`）——登记说明没跟着用例涨。
- `app/src/verify/verify-suite.ts:60` 把 skills-verify 描述为「12 内建技能」，而四个插件的 skills 目录合计 18 个：ai 6（`app/server/plugins/research-ai/skills/`）、math 3、robotics 3、tcm 6。

静态清单同样落后于现实：`AGENTS.md:10` 与 `app/src/verify/verify-suite.ts:14` 都写"手写 JS 14 个"，运行时按动态判据自报 23 个。教训写在[踩坑实录](../concepts/pitfalls-log.md)里——数量与名单只在运行时判定才可靠。

## 目前没有断言的四类空白

1. **计费与订阅**：在 `app/verify/` 与 `app/src/verify/` 里检索 `积分`、`credits`、`billing`、`订阅` 均无命中，与该板块"实质零实现"一致（`墨台实现策划案/_src/06-订阅预付费.md:9`）；实现落地前无需补测，落地时必须新起一层。
2. **主题对比度与 ΔE 门槛**：检索 `contrast`、`对比度` 在验证脚本里零命中，令牌约束目前只以文档形式存在，见[主题令牌契约](../concepts/theme-token-contract.md)。
3. **站点与品牌资产**：`motai-site/` 只有本地开发桩 `motai-site/dev/feedback-local.mjs`，仓库内没有针对站点内容或素材的自动化断言，见[墨台产品页站点](../entities/motai-site.md)。
4. **Wiki 内容质量**：不在 `npm run verify` 体系内，由 `npm run wiki:lint` 独立承担（规则码表见[Wiki 系统](../entities/wiki-system.md)）。

## 关联

- 实体：[验证套件](../entities/verification-suite.md)、[构建与打包体系](../entities/build-pack-system.md)、[墨道运行时](../entities/agent-runtime.md)
- 概念：[UI 验证方法论](../concepts/verification-method.md)、[开发环境与命令约束](../concepts/dev-environment.md)
- 综合：[有意保留的已知缺陷](known-defects.md)、[策划案与源码偏差清单](plan-vs-code-gaps.md)
- 资料：[验证报告簇](../sources/verify-reports.md)
