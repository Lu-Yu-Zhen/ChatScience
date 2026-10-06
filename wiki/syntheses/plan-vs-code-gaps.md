---
type: synthesis
title: 策划案与源码偏差清单
tags: [偏差, 策划案, 源码, 复核, 墨台]
sources: [墨台实现策划案/_src/, app/src/, app/verify/, AGENTS.md, 墨台产品页.html]
updated: 2026-10-06
status: stable
---

# 策划案与源码偏差清单

> 一句话摘要：七份策划案写于实现之前，本页把已逐条回读原文核对过的偏差集中列出——每条给资料出处、源码现状与处置建议，用于决定"改文档"还是"补实现"。

判定口径：以 `app/src/**` 手写源为准；资料出处一律给 `墨台实现策划案/_src/*.md:行号`；行号已由 `npm run wiki:lint` 核对在真实范围内。仅列本次实际回读双方文本后成立的条目，未复核的传闻不入表。

## 一、能力状态类（策划案落后于代码）

| # | 主题 | 策划案说法 | 源码现状 | 处置 |
|---|---|---|---|---|
| 1 | 主题套数 | 内置六套主题、仅实现 light/dark（`墨台实现策划案/_src/01-UI.md:16`），六套扩展列为待实现（`:142`） | 12 张主题卡成为验收断言（`app/verify/settings-e2e.js:107`） | 更新策划案，见[主题系统](../entities/theme-system.md) |
| 2 | 设置页主题项 | 外观节写 2 主题 + 5 个扩展名（`墨台实现策划案/_src/07-设置页改造.md:36`） | 同一断言校验 12 卡与全名（`app/verify/settings-e2e.js:107-108`） | 更新策划案，见[设置页](../entities/settings-page.md) |
| 3 | 内置智能体数 | 「4 个内置智能体」并注 BUILTIN_AGENTS 共 5 个 id（`墨台实现策划案/_src/04-Agent系统设计.md:15`、`:141`、`:151`） | 内置数组只剩两项：墨道（`app/src/server/qoder.ts:148`）与墨析（`:147`） | 更新口径，见[墨道运行时](../entities/agent-runtime.md) |
| 4 | 七类子智能体 | 同表列为「待实现」（`墨台实现策划案/_src/04-Agent系统设计.md:15`） | 七类科研子智能体已注册（`app/src/server/qoder.ts:182`） | 更新策划案与宣传红线，见[子智能体体系](../entities/subagent-system.md) |
| 5 | 模型档位 | 「5 档模型档位已实现」（`墨台实现策划案/_src/06-订阅预付费.md:181`） | `app/src` 全库检索不到 `MODEL_TIERS`；上游只有九家 base_url 表（`app/src/server/ai.ts:8-20`），实际模型由 BYOK Key 决定 | 改述为 BYOK 现状，见[BYOK 认证与额度打回](../concepts/byok-auth.md) |
| 6 | 技能数量 | 验证套件仍把技能系统描述为「12 内建技能」（`app/src/verify/verify-suite.ts:60`） | 底座内建 14 个（`app/server/skills-plugin/skills/`，2026-10-05 skillsN2 断言实测），四个插件的技能目录另有 18 个：ai 6（`app/server/plugins/research-ai/skills/`）、math 3、robotics 3、tcm 6 | 改描述与报告口径，见[科研领域插件](../entities/research-plugins.md) |

## 二、结构与契约类

| # | 主题 | 策划案说法 | 源码现状 | 处置 |
|---|---|---|---|---|
| 7 | 沙箱产物目录 | `data/sandbox/<scope>/` 下 work/ 与 out/ 同级（`墨台实现策划案/_src/03-后端.md:188-190`） | 代码把 out 建在 work 内：`path.join(work, 'out')`（`app/src/server/sandbox.ts:115`） | 以代码为准，见[沙箱与工作台](../entities/sandbox-workspace.md) |
| 8 | SSE 事件名 | 汇总事件写作 `run_end`（`墨台实现策划案/_src/02-前端.md:218`） | 后端发 `run_result`（`app/src/server/routes.ts:205`），前端同名分支处理（`app/src/webapp/work/70-agent-chat.ts:216`） | 更新事件表，见[对话区与输入区不变式](../concepts/chat-input-invariants.md) |
| 9 | 路由建议入参 | 路由建议端点接受 `?text=&workspaceRoot=`（`app/src/server/routes.ts:378-379`） | 前端仅在有工作区项目时附带 workspaceRoot（`app/src/webapp/work/35-skills.ts:466-467`），空串时文件信号分支不进入（`app/src/server/qoder.ts:1618`） | 明确"无项目即无文件信号"，见[领域路由与角色](../concepts/domain-routing.md) |
| 10 | 渲染层规模 | 主脚本「30 万字符 / 5,717 行」（`墨台实现策划案/_src/02-前端.md:98`） | 同一文件现长 7,455 行，末段内容见 `app/src/webapp/webapp.ts:7453`；`app/src/server/qoder.ts` 同步到 1,684 行 | 数字随批次刷新即可，见[前端渲染层](../entities/frontend-renderer.md) |

## 三、仓库文档自身与实现的偏差

| # | 主题 | 文档说法 | 现状 | 处置 |
|---|---|---|---|---|
| 11 | 手写 JS 清单 | 根 `AGENTS.md:10` 列"共 14 个"，套件注释同样写 14（`app/src/verify/verify-suite.ts:14`） | 按"是否存在同名 `.ts`"动态判定实测 19 个，套件运行时自报的数字已是 19 | 更新 AGENTS.md 清单与注释，见[验证套件](../entities/verification-suite.md) |
| 12 | typecheck 覆盖 | 要求三套配置一起跑（`AGENTS.md:18`） | `app/start.bat:16` 跑核心 tsc、`app/start.bat:24` 只追加 webapp 一套 | 补 verify 配置或改文档，见[开发环境与命令约束](../concepts/dev-environment.md) |
| 13 | 报告环境行 | 「Electron 33 + Node 24.14.0 内置运行时」（`app/verify/验证报告.md:3`） | 同文档在根因段写明 Electron 33 内置 Node 20 不支持 `require(esm)`（`app/verify/验证报告.md:237`），迁移说明同样记 Electron 33 = Chromium 130 / Node 20（`app/TypeScript迁移说明.md:80`） | 页眉改为"系统 Node 24 / 内置 Node 20"，见[验证报告簇](../sources/verify-reports.md) |
| 14 | 计费与话术 | 板块自判"实质零实现"（`墨台实现策划案/_src/06-订阅预付费.md:9`） | 站点已出现「算力归算力，会员归会员」与档位选择话术（`墨台产品页.html:1237`、`:1400`）；代码侧 `app/src/server/ledger.ts:3` 是证据链台账、`app/src/server/policy.ts` 是沙箱策略 | 保持蓝图标签并受红线约束，见[账本与计费](../entities/ledger-billing.md) |
| 15 | 知识库注释 | 头注释写"中文 bigram + 单字"（`app/src/server/kb.ts:5`） | 实现只建 bigram，并注明加单字会让无关查询误命中（`app/src/server/kb.ts:63-71`） | 改注释，见[记忆与知识库](../entities/memory-knowledge.md) |

## 用法

拿这份表做两件事：改策划案前先确认目标行仍存在（行号会漂）；要补实现时按"处置"列去对应实体页看现有结构。缺陷类条目集中在[有意保留的已知缺陷](known-defects.md)，脚本覆盖情况见[验证脚本与功能矩阵](verify-feature-matrix.md)。

## 关联

- 综合：[有意保留的已知缺陷](known-defects.md)、[验证脚本与功能矩阵](verify-feature-matrix.md)
- 概念：[构建产物同步纪律](../concepts/artifact-sync.md)、[宣传合规红线](../concepts/promo-compliance.md)
- 资料：[05-宣传板块实现策划案](../sources/plan-05-promotion.md)、[06-订阅预付费板块实现策划案](../sources/plan-06-billing.md)
