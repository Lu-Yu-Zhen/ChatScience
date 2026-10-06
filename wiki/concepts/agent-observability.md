---
type: concept
title: 智能体可观测性
tags: [可观测性, 审计, 台账, sse, hooks]
sources: [app/src/server/qoder.ts, app/src/server/audit.ts, app/src/server/ledger.ts, app/src/server/memory.ts, app/src/server/sse.ts, app/src/shared/domain.ts, app/verify/agent-system-metrics.json]
updated: 2026-10-06
status: stable
---

# 智能体可观测性

> 一句话摘要：墨台的观测面分四层——实时 SSE 事件流、旁路 JSONL 工具审计、项目作用域的科研台账、以及插件装配自检；共同纪律是「观测是旁路，不阻断会话，但失败必须可见」。

## 第一层：SSE 实时事件

- 事件契约 10 类（`run_start` / `notice` / `delta` / `reasoning` / `tool_start` / `tool_end` / `tool_stream` / `error` / `run_end` / `aborted`）定义在 `app/src/shared/domain.ts:479-493`。
- 回合开始即发 `run_start`，携带 `agentId / model / permissionMode / tools` 全量可见集 `app/src/server/qoder.ts:1389`；`system/init` 转 `notice`（SDK 版本、模型、权限、技能与 MCP 状态）`:1406-1411`；结束发 `run_end` 带 `metrics{totalMs, toolCalls, turns}` `:1487`。
- 每帧统一 `data: {"evt":…}` 结构并带 15s 心跳注释帧，避免长任务被中间层判空闲 `app/src/server/sse.ts:1-28`；端点与「客户端断开 = 中断」在 `app/src/server/routes.ts:157-216`。
- 工具名可观测的关键一环：MCP 惰性加载后线路上只看到 `mcp_call`，`unwrapMcpCall` 还原真实工具名与参数，否则「这次到底调了哪个科研工具」就丢了 `app/src/server/qoder.ts:100-115`。
- 前端把 `parentToolUseId` 渲染成子智能体前缀、错误自动展开：`app/src/webapp/work/70-agent-chat.ts:174-204`；失败原因原样透传不掩盖 `:211-226`。

## 第二层：工具审计（旁路 JSONL）

- 入口是官方 Hooks 生命周期：`PreToolUse` / `PostToolUse` / `SubagentStart` / `SubagentStop` / `PostToolUseFailure` / `PermissionDenied` 六类回调 `app/src/server/qoder.ts:654-711`。
- 记录形状 `AuditEntry` 支持 7 种 event，含 `agentId`（主会话为 null）、`parentToolUseId`、`durationMs`、`resultStatus` `app/src/server/audit.ts:12-24`；耗时由 Pre/Post 两次时间戳相减 `app/src/server/qoder.ts:670-682`。
- 参数摘要与 detail 各有截断上限（240 / 600 字符）`app/src/server/audit.ts:26-39`；审计禁止写入凭据原文，写失败不阻断会话（闸门在 canUseTool，审计只是留痕）`:2-8`、`:48-53`。
- 权限判定同样留痕：deny 与 gateway-allow 两条路径都写条目 `app/src/server/qoder.ts:617-646`。
- 读回：`readAudit` 取尾部 N 条 `app/src/server/qoder.ts:1653-1654`，契约 `app/src/shared/domain.ts:547-548`。

## 第三层：科研台账（给人复核的那份）

- 两类条目：`action`（工具结束事件自动记）与 `claim`（`ledger_note` 显式记「声明↔证据↔产物↔置信度」）`app/src/server/ledger.ts:5-8`、`app/src/server/qoder.ts:568-596`。
- 自动记录只覆盖有科研价值的动作面（写类工具 / Bash / run_code / 科研 MCP / WebFetch / WebSearch），避免心跳噪声淹没有用信息 `app/src/server/qoder.ts:97-98`、`app/src/server/ledger.ts:14-31`。
- 产物线索靠入参与结果里挑路径 `app/src/server/ledger.ts:45-65`；条目文件有 8MB 滚动截断护栏 `:73-77`；读取上限 1–2000 条 `:83-93`。
- 复现清单（Markdown）导出动作时间线 + 声明表 + 产物索引 + 复核提示，并明写「台账只记录做了什么，不保证做得对」`app/src/server/ledger.ts:96-142`；端点 `app/src/server/routes.ts:367-376`、装配 `app/src/server/qoder.ts:1572-1584`。

## 第四层：装配与决策自检

- 插件加载失败不再静默：坏 frontmatter、缺 `SKILL.md`、`tools.json` 解析失败都进包级 warnings `app/src/server/qoder.ts:822-858`；`pluginDoctor` 汇总 warnings + roles 试运行生效/被拒 `:1539-1570`，端点 `app/src/server/routes.ts:361-366`，前端渲染 `app/src/webapp/work/35-skills.ts:415`。
- 记忆写入是模型自主决策，但决策本身可观测：Stop hook 以 `decision:'block' + reason` 回灌指令，并记 `memory_decision` 审计条目、向前端发同名 notice，`stop_hook_active` 防循环 `app/src/server/memory.ts:266-300`。
- 领域路由建议可查询（只建议不自动启用）`app/src/server/qoder.ts:1586-1616`。

## 已知缺口

- ⚠️ 冲突：`subagent_start` / `subagent_stop` 后端已发且验证脚本已断言 `app/verify/agent-system-metrics.json:177-181`，但前端 `notice` 只对三种 code 弹提示，子智能体起止在 UI 上只能靠工具轨迹前缀反推 `app/src/webapp/work/70-agent-chat.ts:211-215`，嵌套时间线的完整形态仍未做，规划依据见 [Agent 委派模式](agent-delegation.md)。
- 用量与按模型计价仍是缺口：`run_end` 只有 `totalMs / toolCalls / turns` `app/src/server/qoder.ts:1487`，与策划案 §13.2 的 A6 判定一致 `墨台实现策划案/_src/04-Agent系统设计.md:643`。
- 外部旁路观测（读宿主会话文件做 token/成本统计）另有独立工具，不作为本项目实现的凭据，见 [AgentsView 调研与安装报告](../sources/agentsview-report.md)。

## 过程可追溯的三条新证据链

1. **界面能看到工具真名与入参**：Work 界面链路验收要求工具行显示 `mcp__chatscience__run_code` / `note_write` 真名、页面零裸 `mcp_call`，并能展开一条工具行看到完整输入 JSON 与响应（`app/verify/全功能验证报告.md:188`、`:215`）。前提是名字先经 `unwrapMcpCall` 还原（`app/src/server/qoder.ts:134`）。
2. **产物成为一等条目**：`tool_end.artifacts` 由后端在结果截断前抽出（`app/src/server/qoder.ts:100`、`app/src/shared/domain.ts:485-487`），轨迹渲染成可点击条目并在右栏出图出文本（`app/src/webapp/work/60-trace.ts:40-44`），不再依赖展示文本刮取。
3. **执行期连拍留证**：`app/verify/science-process-shots.js` 在回合执行期间每 5 秒一帧、收尾后再展开工具行拍细节，产出 14 帧（登记 `app/src/verify/verify-suite.ts:66`，帧序说明 `app/verify/全功能验证报告.md:205-217`）。

台账侧同期提供了动作级留痕：命中 `LEDGER_TOOLS_RE` 的工具自动累积条目，一轮实测 76 条动作、导出 176 条复现清单（`app/verify/全功能验证报告.md:186`），见[账本与计费](../entities/ledger-billing.md)。

## 关联

- 实体：[墨道运行时](../entities/agent-runtime.md)、[科研领域插件](../entities/research-plugins.md)
- 概念：[Agent 委派模式](agent-delegation.md)、[BYOK 认证与额度打回](byok-auth.md)
- 资料：[AgentsView 调研与安装报告](../sources/agentsview-report.md)
