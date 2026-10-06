---
type: entity
title: 子智能体体系
tags: [agent, 子智能体, 墨道, roles-json, 技能]
sources: [app/src/server/qoder.ts, app/src/server/domain-roles.ts, app/src/shared/domain.ts, app/src/server/routes.ts, app/src/server/skills-plugin/build.ts, app/verify/agent-system-metrics.json]
updated: 2026-10-06
status: stable
---

# 子智能体体系

> 一句话摘要：墨台有两层智能体——UI 可切换的内置智能体（墨道 `agent-orchestrator`、墨析 `agent-discuss`）与**不进切换器**、只经 `options.agents` 注册给墨道委派的七类科研子智能体。

## 内置智能体（用户可见可编辑）

- 定义在 `app/src/server/qoder.ts:117-155`，首次启动播种进 `work.json`，用户可编辑可删除。
- `agent-orchestrator` 显示名「墨道」，`role: 'orchestrator'`，三职责写进系统提示词：意图识别与动态路由、结果汇总与判定、异常处理与重规划 `app/src/server/qoder.ts:119-140`；`modelKey: 'byok'`、`permissionMode: 'acceptEdits'`、`maxTurns: 200`、`tools.sdk` 含 `Agent` `:141-142`。
- `agent-discuss` 显示名「墨析」，是**对话型只读**智能体：只 `Read/Glob/Grep/WebFetch/WebSearch` + 四个检索类科研工具，`permissionMode: 'default'`、`maxTurns: 16` `app/src/server/qoder.ts:146-154`。
- 委派前提由 SDK 机制决定：主会话工具集含 `Agent` 才能委派，子智能体自身一律不含 `Agent`（禁嵌套派生）`app/src/server/qoder.ts:86-90`；编排判定见 `isOrchestrator` `:1302-1304`。

## 七类科研子智能体

规格表 `SUBAGENT_SPECS` `app/src/server/qoder.ts:157-236`（注释即标明依据策划案 E1 / 4.4 路径 B）：

| id | 名称 | maxTurns | 权限档 | 关键工具 |
|---|---|---|---|---|
| `sub-lit-review` | 文献调研 | 14 | default | arxiv/fetch/web/kb/doi_cite/keyword_expand `:173-181` |
| `sub-experiment-design` | 实验设计 | 10 | default | Write + kb/note_write `:182-190` |
| `sub-simulation` | 实验仿真 | 16 | acceptEdits | run_code + Bash `:191-199` |
| `sub-data-analysis` | 数据分析 | 14 | acceptEdits | run_code + unit_convert `:200-208` |
| `sub-writing` | 文稿撰写 | 14 | acceptEdits | latex_check/doi_cite/figure_caption `:209-217` |
| `sub-review` | 结果评审 | 10 | default | 只读三工具 + kb/latex_check `:218-226` |
| `sub-archive` | 资料归档 | 10 | acceptEdits | note_write + Write `:227-235` |

- 硬性约束在注释里成文 `app/src/server/qoder.ts:157-165`：`description` 写「何时用我」（模型据此路由，是分派质量的第一等指标）、`tools` 不含 Agent、`maxTurns` 必设、`mcpServers: ['chatscience']` 复用主会话科研 server、`model: 'inherit'`。
- 转换函数 `buildSubagentDefinitions` `app/src/server/qoder.ts:241-261`：科研工具补 `mcp__chatscience__` 前缀 `:245-246`、缺省 `maxTurns` 兜到 12 `:252`、**skills 必须拷副本**（否则被角色覆写反复污染）`:255-256`。
- 记录形状 `SubagentRecord`（`whenToUse` / `prompt` / `sdkTools` / `scienceTools` / `skills` / `maxTurns` / `permissionMode` / `model`）见 `app/src/shared/domain.ts:368-382`。
- 管理页写入口：`PUT /api/work/subagents` upsert，入参里的 `Agent` 被强制过滤、`maxTurns` 夹在 1–64、权限档只允许 `default/acceptEdits/plan` `app/src/server/routes.ts:315-344`；`DELETE` 只允许删非 builtin `:346-359`。

## 领域覆写：roles.json 换学科不改宿主

- 动机：七个环节的提示词与工具绑定原先硬编码、带 AI/ML 口味 `app/src/server/domain-roles.ts:1-24`。
- 覆写字段六个：`promptSuffix` / `whenToUseSuffix` / `tools` / `skills` / `maxTurns` / `permissionMode` `app/src/server/domain-roles.ts:28-35`。
- 安全边界（**越权一律拒绝并回报，不静默降级**）：`Agent` 不得下放 `:122`；SDK 工具只能在 `ROLE_ALLOWED_SDK` 九项内 `:56-58`、`:138-143`；MCP 工具只能是本包声明的或底座科研清单内的 `:123-137`；技能只能是本包 `skills/` 下的 `:146-158`；`maxTurns` 只允许收紧 `:160-165`；`permissionMode` 按保守序只允许降档 `:60`、`:167-173`；提示词追加 4000 字符上限 `:61`、`:113`。
- 回报链路 `RoleApplyReport` `app/src/server/domain-roles.ts:48-53`，回合内调用与日志 `app/src/server/qoder.ts:1306-1316`，试运行与可见清单在 doctor `app/src/server/qoder.ts:1539-1570`。

## 插件带来的第三类子智能体

- 包内 `agents/*.md` 的 frontmatter（`name/description/model/tools`）+ 正文=提示词，由 `parseAgentMd` 解析 `app/src/server/qoder.ts:743-762`；解析失败不再静默，会进包级 warnings `:823-831`。
- 注册 key 为 `<插件>:<agent>`，默认工具 `Read/Glob/Grep`、`maxTurns` 固定 12、`mcpServers` 挂 `chatscience` + 包自身 server `app/src/server/qoder.ts:1225-1242`；仅编排会话合并 `:1305`。细节见 [科研领域插件](research-plugins.md)。

## 技能

- 内建技能由脚本一次性写盘 `app/src/server/skills-plugin/build.ts:389-396`，声明表 `:11-80` 共 **17 项**（文件头注释仍写「12 个」已过时 `:4`）；每个技能强制带通用约束段（小样本先验证、不凭记忆断言、结论落 `note_write`）`:82-89`。
- 验证记录：七类定义存在 `app/verify/agent-system-metrics.json:9-14`、约束全满足 `:15-20`、skills 引用全部存在 `:21-26`、内建技能总数 17 `:33-38`。

## 与策划案的冲突

- ⚠️ 冲突：策划案 §4.4 与 §12 把七类子智能体列为**待实现**并推荐路径 A（技能化），实际走的是 §4.4 表里的路径 B，现状见 [Agent 委派模式](../concepts/agent-delegation.md)。
- ⚠️ 冲突：策划案 §6.4「12 个内建科研技能」与 §12 的覆盖判断已过时，技能清单以 `app/src/server/skills-plugin/build.ts:11-80` 为准，见 [04-Agent系统设计实现策划案](../sources/plan-04-agent.md)。
- ⚠️ 冲突：策划案 §4.1 的四个内置智能体（通用/科研/复现/分析）在当前源码中只剩墨道与墨析，见 [墨道运行时](agent-runtime.md)。

## 关联

- 实体：[墨道运行时](agent-runtime.md)、[科研领域插件](research-plugins.md)
- 概念：[Agent 委派模式](../concepts/agent-delegation.md)、[智能体可观测性](../concepts/agent-observability.md)
- 资料：[04-Agent系统设计实现策划案](../sources/plan-04-agent.md)
