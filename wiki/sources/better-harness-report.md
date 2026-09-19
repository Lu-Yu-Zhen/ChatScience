---
type: source
title: Better Harness 报告两篇合并摘要（WorkBuddy 试运行 + Qoder 正式审查）
tags: [better-harness, 工作流审查, MCP安全, 变更验证, WorkBuddy, Qoder]
sources: [.workbuddy/better-harness-run/BetterHarness-试运行报告.md, .qoder/better-harness-runs/chatscience-harness-report.md]
updated: 2026-09-18
---

# Better Harness 报告两篇合并摘要

Better Harness（`QoderAI/better-harness`）是对 Agent 工作流本身做审查的工具，按 Agent Work Loop 五维（任务理解/可控执行/改动验证/可靠交付/经验沉淀）评分。两篇报告分别从 WorkBuddy（2026-09-12 试运行）与 Qoder（2026-09-18 正式审查）两个宿主对 D:\ChatScience 跑了审查，结论互相印证。

## 试运行报告（WorkBuddy，v0.7.0-alpha1）

- **安装**：上游不提供 WorkBuddy 插件分发（与 [AgentsView 调研](agentsview-report.md) 的结论一致），改以「整仓作为技能套件根」放入 `~/.workbuddy/skills/better-harness/`，并须移除嵌套 SKILL.md 目录防止技能污染（实测 3→13 个）。
- **修复两个上游 Windows bug**（影响所有 Windows 用户，值得报上游；本机补丁会被技能更新覆盖）：① 工作区目录名 slug 生成不匹配（`D--ChatScience` vs 实际 `d-ChatScience`）；② 路径比较区分大小写导致会话被判 foreignCwd 丢弃。修复后 3/3 会话、8 个任务片段、置信度 High。
- **核心发现**：13 次代码改动、0 次验证——「改而不验」是变更验证维度的直接缺口。
- **配置审查**：1 error（`~/.workbuddy/mcp.json` 中 ATOMGIT_TOKEN 明文）+ 6 advisory（npx 未锁版本 ×3、技能过长无渐进披露 ×3，其中 better-harness 自身那条属误报）。
- **报告渲染阻塞**：D:\ChatScience 当时非 git 仓库，projectHarness 通道不可用；工具按「诚实性」原则拒绝出报告而非编造。
- **踩坑**：`--until` 归一化为当日 00:00Z；lead 通道需 `harness analyze` 单独取；本机 Git Bash 残缺改用 PowerShell。

## 正式审查报告（Qoder，agent-work-loop-v4）

五维评分：任务理解 45 / 可控执行 50 / 改动验证 55 / 可靠交付 50 / 经验沉淀 38。四条发现：

1. **[High] MCP 明文凭据**：用户级 mcp.json 中 Atomgit/GitHub/Hugging Face 三 server 内嵌 token 型 env 值（lint 判定 secret-looking，未人工核对，处置时按真实凭据轮换）。
2. **[Medium] npx 未固定版本**：Atomgit / Framelink Figma / GitHub 三 MCP server 经未锁版本 npx 启动，与明文凭据同文件。
3. **[Medium] 变更统计被非源码淹没**：264 变更文件中 204 未跟踪，341,198 行里源码仅 4.6%，未跟踪截图/图片占 95.4% 主导 diffScore。
4. **[Medium] JS/TS 双实现缺 JS 侧门禁**：29 组同名 .js/.ts 镜像文件，仅 TS 侧有 typecheck/build，单侧改动造成的逻辑漂移无检查可发现。

证据边界：会话通道过薄（30 天仅 1 个合格片段），行为类结论一律 Unobserved；核心边界为推断（coreCodeRules 缺失）。

## 两篇共同指向的待办

- MCP 凭据迁出明文 + 固定 npx 版本（两宿主配置均有此问题）
- 「改而不验」补验证约定（对接现有 [验证体系](../concepts/验证体系.md)）
- JS/TS 双实现建立一致性检查或确立 TS 唯一源
- ChatScience 建 git 仓库是完整审查报告的前置条件

## 关联

- 相关来源：[AgentsView 调研与安装报告](agentsview-report.md)
- 相关概念：[智能体可观测性](../concepts/智能体可观测性.md)、[验证体系](../concepts/验证体系.md)、[踩坑实录](../concepts/踩坑实录.md)
