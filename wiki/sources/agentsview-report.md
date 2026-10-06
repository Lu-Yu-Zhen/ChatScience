---
type: source
title: AgentsView 调研与安装报告
tags: [可观测性, 外部工具, 会话统计, 来源摘要, workbuddy]
sources: [agentsview-report/AgentsView-调研与安装报告.md, agentsview-report/stats.json, agentsview-report/usage-daily.json, agentsview-report/sessions.json]
updated: 2026-10-04
status: stable
---

# AgentsView 调研与安装报告

> 一句话摘要：一次「给编码智能体找可观测性工具」的选型与落地记录（2026-09-12）——`better-harness` 因宿主无插件生命周期而装不上，改用旁路读取会话文件的 AgentsView v0.42.0，并留下三份统计导出。

## 资料是什么

- 日期与环境：2026-09-12，Windows 11 x64 + WorkBuddy 桌面端，工具版本 v0.42.0 `agentsview-report/AgentsView-调研与安装报告.md:3-6`。
- 结论摘要：原始需求 `QoderAI/better-harness` **无法安装**，最终采用 AgentsView，3 个会话全部抓到 `agentsview-report/AgentsView-调研与安装报告.md:14-17`。
- **它是外部工具的调研报告，不是墨台运行时的实现证据**：观测对象是编码智能体的宿主会话文件，与本项目 `data/work-audit.jsonl` 那条自建审计链路无关。

## 为什么 better-harness 装不上

| 环节 | 事实 | 出处 |
|---|---|---|
| 上游自陈 | 实现了 WorkBuddy 的适配层，但**不提供** WorkBuddy 安装壳与插件清单 | `agentsview-report/AgentsView-调研与安装报告.md:27` |
| 决定性报错 | 插件生命周期操作返回 `PLUGIN_LIFECYCLE_UNSUPPORTED` | `:29` |
| 文件层验证 | 仓库有 `.claude-plugin`/`.qoder-plugin` 等 6 类宿主清单，独缺 WorkBuddy 的 | `:33-43` |
| 同类排查 | Compound Engineering / AgentLint / Agentic Code 同样不支持该宿主 | `:51-54` |
| 共同死结 | 它们都靠宿主插件市场分发，而该宿主缺可用生命周期入口 | `:56` |

## AgentsView 为什么能跑通

- 核心机制：**旁路读取本地会话文件**的独立二进制，与宿主是否支持插件完全无关 `agentsview-report/AgentsView-调研与安装报告.md:62`。
- 会话落盘形态是「按项目目录 + 每会话三件套（正文 jsonl / 元数据 / 文件回滚记录）」，与 AgentsView 的解析约定一致 `agentsview-report/AgentsView-调研与安装报告.md:77-84`、`:98`。
- 能力面：逐日 token 与成本、跨会话全文检索、Activity 看板、会话质量评分、60+ 格式聚合、默认只监听本机 `127.0.0.1` `agentsview-report/AgentsView-调研与安装报告.md:66-73`。
- 安装纪律值得借鉴：安全层拦截 `iex`，改为「先下载脚本→逐行审阅→再执行」；脚本行为含 SHA-256 校验与写入 PATH `agentsview-report/AgentsView-调研与安装报告.md:106-119`、`:112`。
- 已知限制：Web UI 进程随命令会话结束被回收、部分模型无定价、不做 AGENTS.md/hooks 静态审查 `agentsview-report/AgentsView-调研与安装报告.md:259-262`。

## 三份导出的读数

- `agentsview-report/stats.json:1`：单行压缩 JSON（`schema_version` 2），含窗口、总量、分布、速度、工具构成与智能体组合；其中 **`sessions_subagent` 为 0**——该工具把这批会话全记为人类会话，未识别子智能体。
- `agentsview-report/usage-daily.json:3-12`：定价表来源为 fetched，且 `fallback.used = true`（`auto` 档位走了兜底）；逐日明细从 `:428` 起，末尾按智能体计数 `:940-942`。
- `agentsview-report/sessions.json:10`：会话清单 JSON 载荷；`:1-8` 混入了 PowerShell 的 stderr 噪声（`NativeCommandError`），说明导出时把 stderr 一并写进了文件——机器解析前需剥掉。
- 报告口径的汇总：28 天窗口 `agentsview-report/AgentsView-调研与安装报告.md:136`，会话 45 / 消息 2,996 / 工具调用 3,025 / 活跃 48 小时 `:152-157`，轮次周期 p50 13.0s、首次响应 p50 3.4s `:178-182`，累计 26,757,407 input / 135,365 output / **$6.23** `:205`。
- 多数日期成本为 0 属预期：自定义模型端点不在标准定价表内，只有 token 计数 `agentsview-report/AgentsView-调研与安装报告.md:210`。

## 对本项目的可用启示

- 会话归档要保留**可被第三方解析的追加式结构**，本项目对应实现见 [智能体可观测性](../concepts/agent-observability.md)。
- 用量统计的诚实边界（无定价即不虚报金额）与本项目「字段留位但不谎报」的纪律一致 `agentsview-report/AgentsView-调研与安装报告.md:210`。
- ⚠️ 冲突：本报告只覆盖编码智能体宿主会话，若把它当作墨台 Work 的观测数据即为误用；墨台自身的观测能力以源码为准，见 [智能体可观测性](../concepts/agent-observability.md)。

## 关联

- 概念：[智能体可观测性](../concepts/agent-observability.md)、[Agent 委派模式](../concepts/agent-delegation.md)
- 实体：[墨道运行时](../entities/agent-runtime.md)
- 资料：[04-Agent系统设计实现策划案](plan-04-agent.md)
