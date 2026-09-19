---
type: entity
title: AgentsView
tags: [工具, 可观测性, WorkBuddy, 外部依赖]
sources: [agentsview-report/AgentsView-调研与安装报告.md]
updated: 2026-09-18
---

# AgentsView

独立二进制形式的 AI 编码智能体会话分析工具（`kenn-io/agentsview`），旁路读取各宿主本地会话文件做 token/成本统计、全文检索、Activity 看板与质量分析；不走宿主插件机制，故在 WorkBuddy 这类无插件生命周期入口的环境下仍可用。

## 关键事实

| 项 | 值 |
|---|---|
| 本机版本 | v0.42.0（commit ff8fb4e8，2026-09-01 构建） |
| 安装位置 | `C:\Users\晖\.agentsview\bin\agentsview.exe`（约 125 MB），PATH 已写入 |
| 数据 | `~/.agentsview/sessions.db`；默认仅监听 `127.0.0.1:8080`，数据不出机器 |
| WorkBuddy 识别 | 解析 `~/.workbuddy/projects/<项目>/<uuid>.jsonl`，3 个 ChatScience 会话全部正确归属 |
| 常用命令 | `agentsview serve` / `usage daily` / `stats` / `session search` |

## 与本项目（ChatScience/墨台）的关系

- 作为 WorkBuddy 环境下唯一跑通的智能体工作流分析工具，被用于本项目的会话成本与行为统计（详见 [AgentsView 调研与安装报告](../sources/agentsview-report.md)）。
- 局限：不审查 AGENTS.md/CI/hooks 配置质量——该缺口由 [Better Harness 报告](../sources/better-harness-report.md) 所记录的工具路线尝试覆盖，但 better-harness 在 WorkBuddy 上需手工装为技能且打过 Windows 补丁。
- 与项目内置 trace 体系（`60-trace` 前端轨迹渲染）互补：前者看历史会话聚合，后者看运行中实时轨迹（见 [智能体可观测性](../concepts/智能体可观测性.md)、[前端架构](../entities/前端架构.md)）。

## 状态

已安装、已完成首次同步并产出统计（stats.json / usage-daily.json / sessions.json 导出在 agentsview-report/ 目录）。已知限制：沙箱内 `serve` 进程无法常驻，需独立终端手动运行。

## 关联

- 相关来源：[AgentsView 调研与安装报告](../sources/agentsview-report.md)、[Better Harness 报告两篇合并摘要](../sources/better-harness-report.md)
- 相关概念：[智能体可观测性](../concepts/智能体可观测性.md)、[开发环境约束](../concepts/开发环境约束.md)
