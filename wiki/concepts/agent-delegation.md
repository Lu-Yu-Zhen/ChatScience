---
type: concept
title: Agent 委派模式
tags: [agent, 委派, 主智能体, 权限网关, 嵌套时间线]
sources: [app/src/server/qoder.ts, app/src/server/domain-roles.ts, app/src/server/routes.ts, app/src/webapp/work/70-agent-chat.ts, app/verify/agent-system-metrics.json]
updated: 2026-10-06
status: stable
---

# Agent 委派模式

> 一句话摘要：墨道用 SDK 的 `Agent` 工具 + `options.agents` 注册表做委派——子智能体是**父会话内的执行分支**（靠 `parent_tool_use_id` 标识），没有独立会话、不能互相调度、权限判定按 `agentID` 留痕。

## 委派的前提与开关

- 机制门槛写在白名单注释里：主会话 `tools` 含 `Agent` 才能委派 `options.agents` 注册的子智能体 `app/src/server/qoder.ts:86-90`。
- 编排会话判定：`agentDef.id === 'agent-orchestrator'` **或** 请求的 `tools.sdk` 里含 `Agent` `app/src/server/qoder.ts:1298-1304`；只有编排会话才构造 `subagentDefs` `:1304`、才设 `options.agents` `:1362`。
- 非编排会话并非降级运行：插件的 skills / MCP / commands 照常加载，只是没有 `Agent` 委派工具 `app/src/server/qoder.ts:1211-1214`。

## 路由依据：description 写「何时用我」

- 约束成文：`description` 写「何时用我」，模型据此路由，是**分派质量的第一等指标** `app/src/server/qoder.ts:159-160`；转换时 `description = whenToUse` `:242-248`。
- 领域包通过 `whenToUseSuffix` 追加学科口径，直接改写路由依据 `app/src/server/domain-roles.ts:116-117`；包内 README 也据此说明「委派与包内子智能体同名任务会自动带上领域口径」`app/server/plugins/research-tcm/README.md:25`。
- 三分支路由策略写进墨道系统提示词：简单任务直接回答、中度任务只调少数子智能体、复杂任务按依赖串联、混合任务先科研后汇总 `app/src/server/qoder.ts:131-135`；纪律「绝不机械地为每个任务都拉起全部子智能体」`:128`。

## 三条硬约束

- **禁嵌套派生**：子智能体 `tools` 一律不含 `Agent` `app/src/server/qoder.ts:161`、`:238-241`；写入口再兜一层过滤 `app/src/server/routes.ts:330`；角色覆写若试图下放 `Agent` 直接拒绝 `app/src/server/domain-roles.ts:122`。
- **必须设 `maxTurns`**（防失控第一道闸）`app/src/server/qoder.ts:162`、缺省兜到 12 `:252`；回合装配再夹在 1–64 `app/src/server/qoder.ts:1344`。
- **上下文只按需下发**：每次委派把「当前任务 + 必要材料片段」写进委派提示词，子智能体看不到主会话的完整对话；汇总与裁定一律归墨道 `app/src/server/qoder.ts:136-139`。

## 唯一网关的落地形态（最小版）

- 权限层按 `options.agentID` 区分发起方：deny 时把 agentId 写进日志与审计条目 `app/src/server/qoder.ts:605-613`、`:619`、`:637`。
- 放行也留痕：有 agentId 的调用额外记 `tool_start` + `gateway-allow`，主会话高频只读工具不记以免噪声 `app/src/server/qoder.ts:642-646`。
- 生命周期侧：`SubagentStart` / `SubagentStop` 各记一条 `event: 'subagent'`，并同时向前端发 `notice`（`subagent_start` / `subagent_stop`）`app/src/server/qoder.ts:693-704`；`PermissionDenied` 另记一条 `:705-709`。
- ⚠️ 冲突：策划案 §1.2/§7.2 设想的「子智能体工具请求上报主智能体、由其代调并审计」的六步网关**未实现**（工具由 SDK 直接执行，主智能体只在提示词层负责），现状与蓝图的差距见 [04-Agent系统设计实现策划案](../sources/plan-04-agent.md)。

## 嵌套时间线与取消

- `parent_tool_use_id` 是嵌套时间线的唯一依据：null = 主会话，非 null 指向父子间那次 `Agent` 调用；该字段增量透传，前端不读时行为不变 `app/src/server/qoder.ts:1419-1423`、`:1431-1435`、`:1448`。
- 前端把委派显示成 `Agent → <子智能体 id>`，子智能体内部工具调用加 `<id> · ` 前缀 `app/src/webapp/work/70-agent-chat.ts:174-192`。
- 台账按此区分角色：有 `parent_tool_use_id` 的动作记为 `role: 'subagent'`，否则 `main` `app/src/server/qoder.ts:1450-1461`。
- 取消是**整条运行级**：一个 `AbortController` 绑住 SDK query，循环每轮检查后 break `app/src/server/qoder.ts:1269-1274`、`:1403`；没有「单独掐掉某个子任务」的调度层。
- 语义修正（策划案 §14.19 自己提出）：子智能体在 SDK 里不拥有独立可恢复会话，需要独立执行单元时应 fork 平级会话 `墨台实现策划案/_src/04-Agent系统设计.md:2887`。

## 插件子智能体的委派

- 包内 `agents/*.md` 解析后以 `<插件>:<agent>` 为 key 合并进 `options.agents` `app/src/server/qoder.ts:733-742`、`:1228-1242`；仅编排会话合并 `:1305`。
- 委派目标 id 由前端从 `Agent` 工具入参里按 `subagent_type / agent_id / agent` 三候选解析 `app/src/webapp/work/70-agent-chat.ts:179-183`。

## 验证记录

- 简单任务不误拉起：`app/verify/agent-system-metrics.json:165-169`（V10，Agent 调用数 = 0）。
- 委派真实发生：`:171-175`（V11a，`Agent` 工具带 `description` / `prompt` 入参）；子智能体活动可观测：`:177-181`（V11b，`notice` 帧 `subagent_start`）。

## 关联

- 实体：[子智能体体系](../entities/subagent-system.md)、[科研领域插件](../entities/research-plugins.md)、[墨道运行时](../entities/agent-runtime.md)
- 概念：[智能体可观测性](agent-observability.md)
