---
type: concept
title: Agent 委派模式（options.agents + Agent 工具）
tags: [委派, options.agents, Agent工具, 主智能体, 上下文隔离, 设计模式]
sources: [墨台实现策划案/_src/04-Agent系统设计.md, app/src/server/qoder.ts]
updated: 2026-09-18
---

# Agent 委派模式（options.agents + Agent 工具）

Qoder Agent SDK 提供的多智能体机制，也是 [墨道](../entities/墨道.md) 主智能体调度 [七类子智能体](../entities/子智能体体系.md) 的**唯一实现基础**（策划案 14.2 称之为"墨道最核心的一篇"）。

## 机制

| 要素 | 规则 |
|---|---|
| 注册 | `options.agents: Record<string, AgentDefinition>` 注册自定义子智能体供主会话委派 |
| 委派开关 | 主会话 `tools` **必须含 `Agent` 工具**，否则委派能力不存在 |
| 路由依据 | `description` 写成「什么时候用我」——模型据此判断调起哪个子智能体，是路由质量**第一等验收指标**，非文档装饰 |
| 上下文 | 子智能体独立上下文，不接收父会话完整历史；父传子的核心信息是 Agent 工具调用的任务提示 |
| 结果回传 | 子智能体中间工具结果不回灌父会话，只有最终结果进入 |
| 嵌套 | 子智能体**不可**衍生自己的子智能体——子智能体 tools 一律不放 `Agent` |
| 防失控 | `maxTurns` 必设（审辨循环上限、失败兜底的第一道闸） |
| 技能预加载 | `skills` 字段为每类子智能体预设专属技能集，替代全局白名单 |
| 模型 | `model: 'inherit'` 跟随主会话（含 BYOK 直连，见 [byok-auth](byok-auth.md)） |

## 为什么选这个模式

- 策划案要求"主智能体唯一网关、子智能体互不调度"——SDK 的不可嵌套约束在能力层面**天然成立**（D3 网关语义零成本落地），无需自建调度层。
- 与"不自研 Agent 循环"的底座决策一致：调度、委派、隔离全部复用 SDK 原语。
- 权限层按 `options.agentID` 标识"哪个子智能体发起的调用"落审计，是主智能体唯一网关的最小落地。

## 项目落地要点（qoder.ts）

- `isOrchestrator` 判定（agentId 为 agent-orchestrator 或 tools 含 Agent）→ 才构建 `options.agents` 注册表；其余智能体行为不变。
- 注册表来源三路合并：`SUBAGENT_SPECS` 播种（work.json subagents 分区）+ 用户管理页自定义 + 领域插件 `plugin:agent`（见 [领域插件](领域插件.md)）。
- 委派纪律写进墨道 systemPrompt：委派前说明选择理由、带回结果注明出处、子智能体失败时调整任务描述重新委派。
- 风险预案（策划案第十章）：SDK 动态编排能力若受限，退化为"预设模板 + 局部动态"（路径 A 技能化）。

## 关联
- 实体：[墨道](../entities/墨道.md)、[子智能体体系](../entities/子智能体体系.md)
- 概念：[byok-auth](byok-auth.md)、[领域插件](领域插件.md)
- 资料：[Agent 系统设计策划案摘要](../sources/agent-system-design.md)（§14.2、§8.2、§13.6 E 组）
</content>
