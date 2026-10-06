---
type: entity
title: 科研领域插件
tags: [插件, 领域扩展, 科研, roles-json, mcp]
sources: [app/server/plugins/, app/src/server/qoder.ts, app/src/server/domain-tools.ts, app/src/server/domain-data-tools.ts, app/src/server/domain-lit.ts, app/src/shared/domain.ts]
updated: 2026-10-06
status: stable
---

# 科研领域插件

> 一句话摘要：`app/server/plugins/<domain>/` 是墨道的学科外挂——包内声明子智能体、技能、命令、工具与角色覆写，宿主只做声明式装配，换学科不改一行宿主代码。

## 包布局与装配契约

- 布局约定写在装载代码的注释里 `app/src/server/qoder.ts:733-742`：`.qoder-plugin/plugin.json` 名/版本/描述、`agents/*.md` 领域子智能体、`skills/<name>/SKILL.md` 技能、`commands/*.md` 命令、`.mcp.json` 领域 MCP；启用状态存 `work.json` 的 `domainPlugins`。
- 扫描两个根：内置 `app/server/plugins` 与用户上传 `app/data/plugins`，**同名时保护内置**（跳过用户包）`app/src/server/qoder.ts:803-930`（`:927-928`）。
- 单包读取的清单很宽：agents / skills / commands / `tools.json` / `dataTools.json` / `dataSources.json` / `routing.json` / `configSchema.json` + `config.json` 合并 / `.mcp.json` / `roles.json`，逐项产 `warnings` `app/src/server/qoder.ts:808-930`；对应形状 `DomainPluginInfo` `app/src/shared/domain.ts:550-575`。
- 加载不再静默失败：agent md 解析失败、技能缺 `SKILL.md`、`tools.json` 损坏都会写进 warnings `app/src/server/qoder.ts:822-858`，doctor 试运行汇总 `:1539-1570`，端点 `GET /api/work/plugins/doctor` `app/src/server/routes.ts:361-366`，前端渲染 `app/src/webapp/work/35-skills.ts:415`。
- 启用是包粒度：未记录 = 启用，显式 `false` = 关闭 `app/src/server/qoder.ts:909`；开关写回 store `:1643-1649`。
- 用户上传包写入前有路径白名单：逐段过滤 `.` 与 `..`，落盘前再校验必须仍在插件根内 `app/src/server/qoder.ts:932-954`。

## MCP 通道：stdio 失败，改走 in-process

- 包内 `.mcp.json` 声明的 stdio server 依赖外部 node 与 CLI 变量展开，**实测未可靠启动** `app/src/server/qoder.ts:733-742`、`app/src/server/domain-tools.ts:1-8`。
- 因此宿主按 `tools.json` 的精确工具名用 `buildDomainServer` **in-process** 注入 `app/src/server/qoder.ts:1218-1227`；doctor 里明确留了这条说明 `:1557`。
- 工具实现集中在宿主：`app/src/server/domain-tools.ts:350` 起按域组织（如 `arith_eval` 用递归下降求值器 `:356-375`）；包内 `.mcp.json` 的 stdio 入口脚本仍随包保留 `app/server/plugins/research-ai/tools/mcp-mini.js:1-3`，但运行时不走它。

## 四个内置包

| 包 | agents | skills | commands | 工具来源 | roles.json |
|---|---|---|---|---|---|
| research-ai | 3 | 6 目录 | 2 | `tools.json` 三个 MCP 工具 | 覆写 5 角色 |
| research-math | 3 | 3 | 2 | `tools.json` 三个（精确算术/行列式） | **无** |
| research-robotics | 2 | 3 | 2 | `tools.json` 三个（力矩/URDF/DH） | **无** |
| research-tcm | 3 | 6 | 2 | `dataTools.json` 五个数据驱动工具 | **覆写全部 7 角色** |

- 逐包计数依据（能力清单表头）：`app/server/plugins/research-ai/README.md:9-19`、`app/server/plugins/research-math/README.md:9-19`、`app/server/plugins/research-robotics/README.md:9-18`、`app/server/plugins/research-tcm/README.md:9-14`；工具清单声明 `app/server/plugins/research-ai/tools.json:3`、`app/server/plugins/research-math/tools.json:3`、`app/server/plugins/research-robotics/tools.json:3`。
- AI 包 skills 目录实为 6 个（`benchmark-kit`/`eval-rubric`/`loss-curve-analysis`/`mindspore-repro`/`model-arch-analysis`/`prompt-audit`），其 README 只列了 3 个 `app/server/plugins/research-ai/README.md:12-14`——多出的三个正是 roles.json 挂给底座角色的那批 `app/server/plugins/research-ai/roles.json:8`。
- 角色覆写条数：AI 包五条 `app/server/plugins/research-ai/roles.json:4-28`，中医包七条 `app/server/plugins/research-tcm/roles.json:4-44`；math 与 robotics 包目录内没有 `roles.json`（只有底座角色 + 包内 agents）。
- 配置默认值由 `configSchema.json` 声明、`config.json` 覆盖后合并 `app/src/server/qoder.ts:894-905`；例：AI 包的默认隐藏维度/序列长度/吞吐 `app/server/plugins/research-ai/configSchema.json:4-17`，中医包的 `default_dynasty`（朝代口径）与 `require_disclaimer` `app/server/plugins/research-tcm/configSchema.json:4-17`。
- 中医包是「换学科不改宿主」的样板：能力全部由 `roles.json + skills + agents + commands + dataTools` 声明 `app/server/plugins/research-tcm/README.md:3`，并自带免责边界（不构成诊疗建议、未标版本即按不可核验处理）`:27-31`。

## 两类零代码扩展

- **数据驱动工具**：`dataTools.json` 三种 kind（`lookup` / `convert` / `format`），宿主只做表查询、乘除与模板填充，**不执行任何包内代码** `app/src/server/domain-data-tools.ts:7-9`，校验 `:73`、构建 `:193`；中医包据此给出方剂检索 `app/server/plugins/research-tcm/dataTools.json:4-16`、证型对应 `:18-30`、检索词族 `:32-45`、古制剂量换算（未限朝代即报错）`:47-54`、古籍引文格式化 `:61-70`。与 `tools.json` 同名时宿主实现优先并告警 `app/src/server/qoder.ts:868-874`。
- **声明式文献源**：`dataSources.json` 让包自带检索源，宿主只做「模板拼 URL → 单次 HTTP → 字段映射归一」`app/src/server/qoder.ts:539-540`；装载与校验 `:878-887` → `app/src/server/domain-lit.ts:113`，执行 `:131`，底座内置源 `:168`；包暴露的源经 `lit_search(source="list")` 可见 `app/src/server/qoder.ts:544-566`，中医包声明了 Europe PMC 与 Crossref 两源 `app/server/plugins/research-tcm/dataSources.json:5-30`。

## 领域路由建议（不自动启用）

- `routing.json` 的 `keywords` / `fileSignals` / `corpora` 只是建议依据 `app/server/plugins/research-ai/routing.json:2-32`。
- 打分 = 关键词命中 ×2 + 文件签名命中 ×3，返回 `suggestion` 与 `recommendEnable`，**只作建议** `app/src/server/qoder.ts:1586-1616`；端点 `GET /api/work/plugins/route` `app/src/server/routes.ts:376-381`，前端调用 `app/src/webapp/work/35-skills.ts:427`。

## 包声明即可扩展的两类数据

插件不再只能靠宿主代码加工具：包目录里的 `dataTools.json` 与 `dataSources.json` 会被读取并校验。

- `dataTools.json` → 数据驱动工具，零宿主代码扩展，未声明时为空对象（解析与校验 `app/src/server/qoder.ts:886`，契约字段 `app/src/shared/domain.ts:576`）。
- `dataSources.json` → 包声明的文献检索源，进入 `lit_search` 的可用源清单；校验失败写进 warnings 而不是静默跳过（`app/src/server/qoder.ts:904`，字段 `app/src/shared/domain.ts:580`，源清单拼装 `:564`）。
- 包描述符另有两个身份字段：`mcpServer`（in-process MCP 的服务名，供 roles 挂工具与 `buildDomainServer` 复用，`app/src/shared/domain.ts:574`）与 `hasRoles`（是否对底座七环节做领域覆写，`:578`）。
- 自检入口 `pluginDoctor()` 汇总包级 warnings、roles.json 试运行回报与可覆写角色清单（`app/src/server/qoder.ts:1571`），HTTP 侧对应 `app/src/server/routes.ts:363`。

**一条已实测的边界**：写在技能 `SKILL.md` 正文里的约束只在技能被显式加载的那一回合生效。第五批验收里，模型两次在未加载技能的情况下编造数据画出"看起来很专业"的图，加了硬约束仍复现；显式要求数据来自指定 CSV 才立刻正确（`app/verify/全功能验证报告.md:222`）。因此"必须可靠生效"的约束要放底座系统提示或工具层校验，不能只放技能正文，见[有意保留的已知缺陷](../syntheses/known-defects.md)。

## 关联

- 实体：[子智能体体系](subagent-system.md)、[墨道运行时](agent-runtime.md)
- 概念：[Agent 委派模式](../concepts/agent-delegation.md)、[领域路由](../concepts/domain-routing.md)
- 资料：[04-Agent系统设计实现策划案](../sources/plan-04-agent.md)
