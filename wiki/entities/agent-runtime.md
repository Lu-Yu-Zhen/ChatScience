---
type: entity
title: 墨道运行时
tags: [agent, qoder-sdk, 墨道, work模式, 沙箱]
sources: [app/src/server/qoder.ts, app/src/shared/qoder-sdk.ts, app/src/shared/domain.ts, app/src/server/routes.ts, app/verify/agent-system-metrics.json]
updated: 2026-10-06
status: stable
---

# 墨道运行时

> 一句话摘要：`app/src/server/qoder.ts` 是 Work 模式的运行底座——把 Qoder Agent SDK 的 query 循环包成一个可装配、可流式、可取消、可审计的回合（runWorkTurn），Agent 循环本身不自研。

## 与 SDK 的对接面

- 类型只从一个口子进：`app/src/shared/qoder-sdk.ts:22-114` 把官方 SDK 的 `Options` / `SDKMessage` / `CanUseTool` / `AgentDefinition` / Hooks / ModelPolicy 等**全部以 type-only 重导出**，业务代码不直接 import SDK。
- 运行时加载是唯一的例外通道：SDK 是纯 ESM 包，Electron 33 内置 Node 20 不支持 `require(esm)`，故用 `new Function` 间接层构造真 `import()` 绕过 tsc 的 require 改写 `app/src/shared/qoder-sdk.ts:120-141`。
- 进程内只加载一次并缓存 promise `app/src/shared/qoder-sdk.ts:131-140`；`type QoderSdkModule = typeof import(...)` 是纯类型引用 `:118`。
- 对外 API 面收敛在 `QoderApi`：`runWorkTurn` / `listSkills` / `ping` / `subagents` / `domainPlugins` / `pluginDoctor` / `ledger` / `route` / `createPlugin` / `byokModels` / `readAudit` `app/src/shared/domain.ts:519-549`，实现见返回对象 `app/src/server/qoder.ts:1618-1655`。

## 一次回合怎么装配（runWorkTurn）

1. 入口 `app/src/server/qoder.ts:1117`；工作区模式则 `cwd` = 用户所选绝对目录（不可访问即整回合失败并 `emit('error', fatal)`）`:1127-1137`，否则用沙箱 scope 的 work 目录 `:1139`。
2. 项目记忆就绪（幂等，失败降级为无记忆）`:1147-1155`。
3. 工具可见集 = `tools.sdk` 与内建白名单取交集 + 科研工具 + 外部 MCP + 插件 MCP 精确名 `:1157-1202`；内建白名单是 10 项（含 `Agent`）`:90`。
4. 技能白名单：本地插件目录技能 + 插件 `key:skill` 限定名，中文 frontmatter 名与目录名两种形式都塞进白名单 `:1204-1263`。
5. `options` 一次装配 `:1329-1353`：`auth` 取 accessToken、`cwd`、`systemPrompt` 用 `{type:'preset', preset:'qodercli', append:…}` 保留 CLI 预设再追加 `:1332-1335`、`model` 为 BYOK 模型 id、`permissionMode` 覆盖链「请求 > 智能体定义 > 全局配置 > default」`:1338-1343`、`maxTurns` 夹在 1–64 `:1344`、隔离三件套 `settingSources: []` + `strictMcpConfig: true` + `tools/allowedTools` `:1345-1349`、`canUseTool` `:1350`、`includePartialMessages: true` `:1352`。
6. 追加：`plugins`（技能包 + 启用的领域插件目录）`:1355-1358`、`skills` `:1359`、`resume` `:1360`、`agents`（仅编排会话）`:1362`、`memory` 的 scope 开关 `:1367-1373`、`hooks` `:1374-1383`。
7. 系统提示词 = 通用执行规范（拆解/执行/自主决策/错误修正/汇报）+ 智能体专属定位 + 记忆段 + Git 偏好 `:1277-1297`。

## 会话、流式与取消

- SDK 消息循环 `for await (const msg of q)` `:1401`；`system/init` 转成 `notice`（带版本、模型、权限、技能与 MCP 状态）`:1406-1411`。
- 流式增量：`text_delta` → `delta`、`thinking_delta` → `reasoning`，`input_json_delta` 故意不逐帧透传 `:1412-1418`；工具轨迹走 `assistant`/`user` 消息的 `tool_use` / `tool_result` 块 `:1419-1449`。
- 嵌套依据：`parent_tool_use_id`，null = 主会话、非 null = 子智能体 `:1419-1423`，前端据此把委派显示成 `Agent → <id>` 与前缀 `app/src/webapp/work/70-agent-chat.ts:174-192`。
- 多轮：`params.resumeSessionId` → `options.resume` `app/src/server/qoder.ts:1360`，会话 id 从消息里首次出现即记下 `:1404`，前端在 `run_result` 里回写 `conv.sdkSessionId` `app/src/webapp/work/70-agent-chat.ts:211-213`。
- 取消：回合内自建 `AbortController`，外部信号（或 HTTP 客户端断开）触发 abort `app/src/server/qoder.ts:1269-1274`；循环每轮检查 `ctl.signal.aborted` 即 break `:1403`；abort 收尾返回 `{ok:false, aborted:true}` 并 `emit('aborted')` `:1492-1495`、`:1498-1501`。HTTP 侧「客户端断开 = 中断」在 `app/src/server/routes.ts:179-187`。
- 事件契约（10 类）在 `app/src/shared/domain.ts:479-493`；SSE 帧与 15s 心跳见 `app/src/server/sse.ts:1-28`。
- 连通性自检 `ping()`：1 回合最小查询，BYOK 模型 + `tools: []` + `dontAsk` `app/src/server/qoder.ts:1509-1534`。

## 模型与 BYOK 路由

- 当前语义是 **BYOK-only**：平台订阅档位路由已被移除，`options.model` 直接填用户已注册的 BYOK 模型 id `app/src/server/qoder.ts:713-728`。
- 选择函数 `resolveByokModelId`：未绑定或 `'byok'` → 清单第一个；否则精确匹配再模糊匹配（`normalizeModelBase` 剥掉 `-tp/-cp/-pg` 与日期后缀）`app/src/server/qoder.ts:1013-1025`、`app/src/server/qoder.ts:728-731`。
- 清单来自启动期一次异步探测：probe 会话用 `model:'lite'` 只为拿到 `listByokConfigs()`，init 后立即 break，不作业务调用 `app/src/server/qoder.ts:954-1005`；就绪等待最多 8s（回合内另等 25s）`app/src/server/qoder.ts:1006-1011`、`app/src/server/qoder.ts:1321`。
- 拿不到模型即明确报错、不回落平台额度 `:1318-1327`。细节与踩坑见 [BYOK 认证与额度打回](../concepts/byok-auth.md)。
- ⚠️ 冲突：策划案 §5.1 的 `MODEL_TIERS` 五档与 §9「Work 走平台模型池」在当前源码中已不存在，现状见 [BYOK 认证与额度打回](../concepts/byok-auth.md)。
- ⚠️ 待清：`makeModelResolver` 已导出并被验证脚本单测 `app/src/verify/agent-system-verify.ts:187-196`，但生产路径明确**不设置** `resolveModel` `app/src/server/qoder.ts:1363-1366`，两者关系见 [BYOK 认证与额度打回](../concepts/byok-auth.md)。

## 科研工具与守卫

- in-process MCP server `chatscience` 注册 14 个工具 `app/src/server/qoder.ts:598-602`，清单唯一真值 `:93-95`；统一结果形状与「 isError + 结构化错误头（工具名/类型/可重试性）」`:271-280`。
- 每个工具独立熔断状态：30s 超时、连续 3 次失败熔断 60s；`run_code` 走沙箱自身超时不套短超时 `:282-338`。工具级守卫与审计的观测面见 [智能体可观测性](../concepts/agent-observability.md)。
- MCP 惰性加载把 `mcp__server__tool` 收进元工具 `mcp_call`，`unwrapMcpCall` 还原真实工具名与参数，否则台账与审计只会记 `mcp_call` `:100-115`。

## 边界与验证

- 诚实边界（与 policy 一致）：`canUseTool` 对 Bash 只是命令文本静态扫描、可被绕过，cwd 隔离依赖 SDK 自身约束，需硬隔离的执行走 `run_code` `app/src/server/qoder.ts:9-13`；守卫实现 `:611-652`，边界语义详见 [沙箱边界](../concepts/sandbox-boundaries.md)。
- 播种：七类子智能体启动时按 id 查漏写进 `subagents` 分区，已存在的不覆盖（用户编辑是最终事实）`:780-797`。
- 验证记录：`app/verify/agent-system-metrics.json:2-5` 为 31/31 通过，其中 V9 基础回合 `:141-144`、V9b 流式与工具轨迹完整 `:147-150`、V9c `parentToolUseId` 字段存在 `:153-156`。

## 工具面的三处扩展点

- **科研工具白名单**：`SCIENCE_TOOL_NAMES` 现列 14 个（`app/src/server/qoder.ts:93-95`），末两项是 `lit_search`（多源文献检索）与 `ledger_note`（证据链台账），二者都由启用包的声明决定可用源与项目作用域（`app/src/server/qoder.ts:564`、`:593-596`）。
- **MCP 名还原**：插件工具经 `mcp__<server>__<tool>` 包裹，统一由 `unwrapMcpCall()` 还原成真实工具名与入参再判权限与计时（`app/src/server/qoder.ts:134`，调用点 `:669`、`:691`）。不先还原就会出现"权限按外层名判、轨迹显示裸 mcp_call"两类错。
- **产物与流式细节**：`eventArtifacts()` 在结果被截断之前从 `run_code` 的 `files[]` 与文本里抽出结构化产物清单（`app/src/server/qoder.ts:100`、装配点 `:1469`），随 `tool_end.artifacts` 下发（字段与理由见 `app/src/shared/domain.ts:485-487`）；思考与正文增量经 `onToolStream` 转成 `tool_stream` 事件（`app/src/server/qoder.ts:1203`）。

## 关联

- 实体：[子智能体体系](subagent-system.md)、[科研领域插件](research-plugins.md)
- 概念：[BYOK 认证与额度打回](../concepts/byok-auth.md)、[Agent 委派模式](../concepts/agent-delegation.md)
- 资料：[04-Agent系统设计实现策划案](../sources/plan-04-agent.md)
