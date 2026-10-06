---
type: entity
title: 验证套件
tags: [验证, 脚本, 质量门禁, 墨台]
sources: [app/src/verify/verify-suite.ts, app/verify/, app/package.json, AGENTS.md]
updated: 2026-10-06
status: stable
---

# 验证套件

> 一句话摘要：app/verify 的 37 个脚本没有一个测试框架，统一入口 verify-suite 只做发现、分层、手写/编译判定与退出码透传。

## 入口与三种用法

- 唯一入口源是 `app/src/verify/verify-suite.ts`（204 行），头部注释即用法说明：`app/src/verify/verify-suite.ts:2-7`。
- 三种模式：无参数列出全部脚本（按层 + 手写/编译判定）；`npm run verify <name> [args…]` 单跑并原样透传退出码；`--all [--timeout 秒]` 按层顺序全量跑并末尾汇总（用法 `app/src/verify/verify-suite.ts:5-7`，实现 `app/src/verify/verify-suite.ts:182-202`）。
- 默认单脚本超时 300 秒（`app/src/verify/verify-suite.ts:29`），全量模式串行、每个脚本仍是独立 node 进程、cwd 固定为 app 根（`app/src/verify/verify-suite.ts:143-144`、`app/src/verify/verify-suite.ts:159`）。
- 找不到脚本时返回 2 并列出可用名（`app/src/verify/verify-suite.ts:195-199`）；汇总里逐条报 PASS/FAIL 与失败项（`app/src/verify/verify-suite.ts:174-177`）。
- npm 侧只有一条包装命令：`app/package.json:9`。
- 设计取向写在头部：不引入测试框架、不新增 CI，入口只做发现与编排（`app/src/verify/verify-suite.ts:8-9`）。

## 手写 / 编译是运行时判定的，不硬编码名单

- 判定规则：`app/src/verify/<name>.ts` 存在 → [编译]，否则 → [手写]（`app/src/verify/verify-suite.ts:97`），列表头会动态打印手写数量（`app/src/verify/verify-suite.ts:120-122`）。
- 入口自身从列表里剔除（`app/src/verify/verify-suite.ts:28`、`app/src/verify/verify-suite.ts:103`），所以列表显示 37 个、盘上 38 个 `.js`。
- 实测分类（按当前磁盘）：
  - 有 TS 镜像、受 typecheck 与 build:ts 管辖的 15 个：agent-system-verify、agent-verify、chat-verify、exe-verify、kb-verify、memory-verify、noweb-test、sandbox-verify、sdk-smoke、sdk-verify、skills-verify、stream-verify、ts-migration-smoke、verify-suite、workspace-verify。
  - 手写 JS、不在 tsc 管辖内的 23 个：agent-api-verify、agent-run-diag、anim-coord-check、byok-bisect、byok-diag、byok-experiment、byok-run-check、cdp-eval、cdp-ui、domain-p2p5p6-verify、domain-switch-verify、input-edge-check、layout-center-check、layout-refine-check、plugin-experiment、plugin-route-ui-verify、right-panel-preview-verify、science-capability-verify、science-process-shots、science-ui-verify、settings-e2e、settings-geometry、userdata-check。
- ⚠️ 冲突：`AGENTS.md:10` 与 `app/src/verify/verify-suite.ts:14` 都写「手写 JS 共 14 个」，实际磁盘是 23 个。差额来自两轮新增验收资产：2026-10-04 的 cdp-ui、agent-api-verify、domain-switch-verify、domain-p2p5p6-verify、plugin-route-ui-verify，以及 2026-10-05 的 science-capability-verify、science-ui-verify、right-panel-preview-verify、science-process-shots（交付清单见 `app/verify/全功能验证报告.md:265`）。两份文档的静态计数都已落后；入口因为运行时判定，列表不受影响。计数漂移的教训归档在[踩坑实录](../concepts/pitfalls-log.md)。

## 分层登记表

- 五个层：沙箱 / SDK / 技能 / UI / Chat 管线（`app/src/verify/verify-suite.ts:31`、`app/src/verify/verify-suite.ts:41`）。沙箱层对应[沙箱边界](../concepts/sandbox-boundaries.md)里声明的能力与限制。
- 登记表 `SCRIPTS` 有 37 条，逐条带中文说明与可选用法参数（`app/src/verify/verify-suite.ts:44-82`）；当前 37 个脚本全部已登记，列表里没有「未分层」项。
- 未登记的脚本不会被静默丢弃，会归入「未分层」并在末尾提示补层（`app/src/verify/verify-suite.ts:89-95`、`app/src/verify/verify-suite.ts:123`、`app/src/verify/verify-suite.ts:134`）——2026-10-05 那四个新脚本正是靠这条提示被发现、当场补登记的。
- 「Chat 管线」层是为了避免 chat-verify / stream-verify / noweb-test 被错分进 SDK 或 UI 才单列的（`app/src/verify/verify-suite.ts:15-19`）。
- 登记说明里的**条数会滞后于用例增长**：`app/src/verify/verify-suite.ts:49` 写「Agent 系统 11 项」，末次运行实为 31 项全过（`app/verify/agent-system-metrics.json:2-5`）；`app/src/verify/verify-suite.ts:60` 写「12 内建技能」，底座内建实为 14（`app/server/skills-plugin/skills/`，断言见[测试文件夹人工验证记录](../sources/manual-test-notes.md)所说的 skillsN2 记录），插件包技能目录另有 18 个（`app/server/plugins/research-ai/skills/`）。

## 产物与夹具

- 结果 JSON 落在 verify 目录：`app/verify/metrics.json`、`app/verify/work-metrics.json`、`app/verify/agent-system-metrics.json`，口径见[验证报告簇](../sources/verify-reports.md)。
- 测试夹具 `app/verify/paper_text.txt`（论文全文）与 `app/verify/transcript.txt`（对话全文）；2026-10-05 另造了两组带地面真值的科研夹具 `测试文件夹/实验指标.csv` 与 `测试文件夹/论文片段.md`，见[测试文件夹人工验证记录](../sources/manual-test-notes.md)。
- UI 层脚本依赖打包产物：从 app 下的 dist 便携目录拉起 exe、读运行时数据文件取端口，所以必须先跑 pack（描述见 `app/src/verify/verify-suite.ts:68`）；打包细节见[构建与打包体系](../entities/build-pack-system.md)。
- 脚本之间会互相 taskkill 清场，这是全量模式失败的常见原因，见[UI 验证方法论](../concepts/verification-method.md)。
- 界面链路的留证产物落在 `app/verify/shots/`：科研能力真跑的 5 张关键图与 14 帧过程连拍（`app/verify/全功能验证报告.md:190-217`）。

## 关联

- 覆盖与空白：[验证脚本与功能矩阵](../syntheses/verify-feature-matrix.md)
- 报告与指标口径：[验证报告簇](../sources/verify-reports.md)
- 实测方法论：[UI 验证方法论](../concepts/verification-method.md)
- 编译归属与命令：[构建与打包体系](../entities/build-pack-system.md)
- 互踩与陈旧预期：[踩坑实录](../concepts/pitfalls-log.md)
- 命令执行目录：[开发环境与命令约束](../concepts/dev-environment.md)
