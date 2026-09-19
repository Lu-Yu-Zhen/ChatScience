---
type: source
title: AgentsView 调研与安装报告（摘要）
tags: [AgentsView, WorkBuddy, 可观测性, 成本统计, 工具选型]
sources: [agentsview-report/AgentsView-调研与安装报告.md]
updated: 2026-09-18
---

# AgentsView 调研与安装报告（摘要）

为 WorkBuddy 环境寻找「AI 编码智能体工作流分析」工具的调研记录（2026-09-12）：原始候选 `QoderAI/better-harness` 因 WorkBuddy 无插件生命周期入口（`PLUGIN_LIFECYCLE_UNSUPPORTED`）无法安装，最终采用旁路读取本地会话文件的独立二进制 [AgentsView](../entities/agentsview.md) v0.42.0，安装并跑通。

## 要点

- **选型逻辑**：Compound Engineering / AgentLint / Agentic Code 均依赖宿主插件市场分发，WorkBuddy 恰好缺此入口，换哪个都撞同一堵墙；AgentsView 不走插件机制，直接解析 `~/.workbuddy/projects/` 下的会话 JSONL，路径格式与其解析约定完全一致。
- **核心能力**：token/成本统计、跨会话全文检索、Activity 看板、质量分析、60+ 智能体格式聚合、本地优先（仅监听 127.0.0.1）。
- **实测数据**（28 天窗口）：识别 3 个 ChatScience 会话（共 45 会话）；累计 26,757,407 input / 135,365 output token；成本 $6.23——多数日期 $0.00 属正常，因 Qoder 自定义模型端点不在标准定价表内，仅 token 计数准确。
- **安装**：官方 PowerShell 脚本（逐行审计、SHA-256 校验），装至 `~/.agentsview/bin`；因安全层拦截 `iex`，采用先下载后 `-File` 执行。
- **已知限制**：Web UI 无法在沙箱内常驻；不审查 AGENTS.md/CI/hooks 配置质量（该能力 WorkBuddy 生态暂无现成工具）。
- **环境备注**：本机 Git Bash 残缺，探测与执行改用 PowerShell。

## 关联

- 相关实体：[AgentsView](../entities/agentsview.md)
- 相关概念：[智能体可观测性](../concepts/智能体可观测性.md)、[Better Harness 报告摘要](better-harness-report.md)
