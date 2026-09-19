---
type: source
title: Agent 系统设计策划案摘要
tags: [Agent, 墨道, Work模式, Qoder-SDK, 子智能体, 策划案]
sources: [墨台实现策划案/_src/04-Agent系统设计.md]
updated: 2026-09-18
---

# Agent 系统设计策划案摘要

04 号策划案（约 184KB / 2300+ 行）：Work 模式智能体系统「[墨道](../entities/墨道.md)」的已实现核对 + 演进蓝图 + Qoder Agent SDK 官方文档摘编 + 改码授权契约。**六个板块中已实现与策划案差异最大的一块**。

## 核心要点

- **冲突裁定**：全板块以已实现为准。策划案愿景（七类子智能体、主智能体调度、审辨迭代循环、fork/检查点）在编制时（2026-09）列为**待实现**，不得对外宣称已实现。⚠️ 编制后源码已推进：`agent-orchestrator`（墨道）+ `SUBAGENT_SPECS` 七类子智能体已经 `options.agents` 落地（见 [子智能体体系](../entities/子智能体体系.md)），本策划案相应章节已过时。
- **底座**：Qoder Agent SDK `@qodercn-ai/qodercn-agent-sdk@1.0.34`（内置 qoderclicn 1.1.44），纯 ESM → 动态 `import()` 惰性加载 + Function 间接层绕过 tsc 改写。不自研 Agent 循环，聚焦科研领域价值（技能 + 沙箱 + 科研工具）。
- **隔离三件套（缺一不可）**：`settingSources: []` + `strictMcpConfig: true` + `tools` 白名单——实测缺任一项，SDK 继承本机 qoderclicn 全部配置、泄漏数百个 MCP 工具。
- **模型策略演进**：策划案记载 5 档 `MODEL_TIERS`（走 SDK 平台池）→ 2026-09-15 定案 **BYOK-only**，平台档位路由彻底移除，见 [byok-auth](../concepts/byok-auth.md)。⚠️ 策划案 14.7 称"五档是自建档位，不是官方档位"，但所列官方档位（auto/ultimate/performance/efficient/lite）与自建档位**完全同名**，该表述自相矛盾。
- **resolveModel 教训**：策划案 B1 规划"resolveModel 按智能体路由"，实测（2026-09-15 二分实验）设置该回调会把会话打回平台额度通道，**方案被实测否决**，详见 [byok-auth](../concepts/byok-auth.md)。
- **委派模式**：`options.agents` 注册子智能体 + `Agent` 工具委派，是墨道调度落地的唯一 SDK 基础，见 [agent-委派模式](../concepts/agent-委派模式.md)。
- **领域插件**：`server/plugins/<domain>/` 外挂包（research-ai / research-math / research-robotics），见 [领域插件](../concepts/领域插件.md)。
- **能力边界如实声明**（第九章）：`canUseTool` 防误操作不防绕过、沙箱无进程级资源上限、`kb_search` 是 BM25 词法检索、`init.skills` 仅发现不注入、模型重复循环触发 maxTurns 后如实报失败无静默假成功。
- **验证**：69+ 项真实验证（sdk 12/12、agent 7/7、skills 10/10、kb 7/7、sandbox 18/18、workspace 5/5）+ 黄金路径。

## 章节地图

| 章 | 内容 | 性质 |
|---|---|---|
| 一 | 板块定位、已实现 vs 策划案差异总览、冲突裁定 | 裁定 |
| 二 | 运行架构全景（前端→runWorkTurn→SDK→墨道扩展）、关键设计决策 | 已实现 |
| 三 | SDK 接入（动态 import、类型面、官方文档能力映射） | 已实现 |
| 四 | 智能体定义体系（内置智能体、AgentDefRecord 字段、种子机制、七类子智能体两路径） | 混合 |
| 五 | 模型五档 / 权限五档 / 覆盖链 / UI 修复经验 | 混合 |
| 六 | 三层工具生态、6 科研 MCP、元工具机制、12 内建技能 | 混合 |
| 七 | 上下文隔离、工作区模式、会话 resume、可观测性、笔记联动 | 混合 |
| 八 | 演进目标架构「墨道」：五环节（察故/分役/试证/合论/审辨）、主智能体三职责、三分支路由、审辨循环、路线图 A-F | 蓝图 |
| 九 | 能力边界如实声明 | 边界 |
| 十 | 风险与应对（SDK 上限、token 成本、MCP 稳定性等 7 项） | 风险 |
| 十一 | 实施优先级三阶段 | 计划 |
| 十二 | 已实现/待实现速查总表 | 速查 |
| 十三 | 落地清单 A-F 组（A 加固、B 模型权限、C 工具技能、D 上下文隔离、E 主调度、F 会话） | 施工 |
| 十四 | Qoder Agent SDK 官方文档摘编 20 节（Quick Start、Agents/Subagents、MCP、Skills、Plugins、Auth、Model Policy、Checkpoint、Tools、Permission、Hooks、Cost、Events、Cloud、Session、类型参考、落地对照） | 参考 |
| 十五 | 智能体改码执行边界（L1-L3 三层授权契约、模块专项边界、越界授权模板） | 纪律 |

## 溯源

- 原文：`D:\ChatScience\墨台实现策划案\_src\04-Agent系统设计.md`（只读）
- 编据源码：`app/src/server/qoder.ts`、`app/src/shared/domain.ts`、`app/server/skills-plugin/`、`app/verify/验证报告.md`

## 关联
- 实体：[墨道](../entities/墨道.md)、[子智能体体系](../entities/子智能体体系.md)、[墨析](../entities/墨析.md)
- 概念：[byok-auth](../concepts/byok-auth.md)、[agent-委派模式](../concepts/agent-委派模式.md)、[领域插件](../concepts/领域插件.md)
- 同簇资料：[settings-page-策划案](settings-page-策划案.md)（智能体管理页挂载点）
</content>
