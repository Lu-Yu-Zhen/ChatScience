---
type: synthesis
title: 墨台 Wiki · 项目总览
tags: [总览, 导航, 墨台, ChatScience, Wiki]
sources: [AGENTS.md, app/package.json, wiki/SCHEMA.md, app/src/server/qoder.ts]
updated: 2026-10-06
status: stable
---

# 墨台 Wiki · 项目总览

> 一句话摘要：墨台（工程名 ChatScience）是一台本地优先的桌面科研工作台——Electron 壳内跑本地 HTTP 后端，由主智能体墨道编排子智能体、科研插件与沙箱；本 Wiki 是它沉淀下来的、可核验的第二份真相。

读法：本页只做导航。要找某个模块 → 下面的分层地图；要知道"为什么这样设计/踩过什么坑" → [索引](index.md) 里的 concepts；要查某份策划案讲了什么 → sources；要横向比结论 → syntheses。操作规范一律看 [SCHEMA 契约](SCHEMA.md)。

## 分层地图

| 层 | 页面 |
|---|---|
| 产品整体 | [墨台产品](entities/motai-product.md) |
| 桌面壳与渲染层 | [Electron 桌面壳](entities/electron-shell.md)、[前端渲染层](entities/frontend-renderer.md)、[Work 模块群](entities/work-modules.md) |
| 外观 | [主题系统](entities/theme-system.md)、[设置页](entities/settings-page.md)、[主题令牌契约](concepts/theme-token-contract.md)、[动效与布局约定](concepts/ui-motion-layout.md)、[对话区与输入区不变式](concepts/chat-input-invariants.md) |
| 本地后端 | [后端服务](entities/backend-server.md)、[沙箱与工作台](entities/sandbox-workspace.md)、[记忆与知识库](entities/memory-knowledge.md)、[账本与计费](entities/ledger-billing.md) |
| 智能体 | [墨道运行时](entities/agent-runtime.md)、[子智能体体系](entities/subagent-system.md)、[科研领域插件](entities/research-plugins.md)、[BYOK 认证与额度打回](concepts/byok-auth.md)、[Agent 委派模式](concepts/agent-delegation.md)、[领域路由与角色](concepts/domain-routing.md)、[沙箱边界](concepts/sandbox-boundaries.md)、[智能体可观测性](concepts/agent-observability.md) |
| 工程 | [构建与打包体系](entities/build-pack-system.md)、[验证套件](entities/verification-suite.md)、[构建产物同步纪律](concepts/artifact-sync.md)、[UI 验证方法论](concepts/verification-method.md)、[开发环境与命令约束](concepts/dev-environment.md)、[踩坑实录](concepts/pitfalls-log.md) |
| 对外与知识 | [墨台产品页站点](entities/motai-site.md)、[品牌与命名纪律](concepts/brand-naming.md)、[宣传合规红线](concepts/promo-compliance.md)、[Wiki 系统](entities/wiki-system.md)、[MCP 凭据带外化](concepts/mcp-credentials.md) |
| 横向结论 | [策划案与源码偏差清单](syntheses/plan-vs-code-gaps.md)、[有意保留的已知缺陷](syntheses/known-defects.md)、[验证脚本与功能矩阵](syntheses/verify-feature-matrix.md) |

## 规模事实（可复算）

- 手写源：`app/src` 下 61 个 `.ts`；其中渲染层主脚本 `app/src/webapp/webapp.ts`、Agent 编排 `app/src/server/qoder.ts` 是两个最大的单文件。
- 模块：Work 模块 14 个（`app/src/webapp/work/`）、领域插件 4 个（`app/server/plugins/`）、插件技能目录 18 个 + 底座内建技能 14 个（`app/server/skills-plugin/skills/`）。
- 验证：`app/verify` 38 个 `.js`（37 个可跑），23 手写 / 14 编译，分五层，见[验证脚本与功能矩阵](syntheses/verify-feature-matrix.md)。
- 资料：策划案七份 markdown 对应六份 `.docx`（`墨台实现策划案/_src/`、`墨台实现策划案/`）。
- 身份：包名 `chatscience-desktop`、产物 `ChatScience.exe`（`app/src/pack.ts:90`），界面里的智能体名是墨道与墨析（`app/src/server/qoder.ts:148`、`:172`）。

## 当前已知的冲突与缺口

- ⚠️ 冲突：宣传红线把"七类子智能体"列为上线前不得宣传的待实现能力（`墨台实现策划案/_src/05-宣传.md:379`），而运行时已注册七类（`app/src/server/qoder.ts:182`），见[子智能体体系](entities/subagent-system.md)。
- ⚠️ 冲突：订阅计费板块自判实质零实现（`墨台实现策划案/_src/06-订阅预付费.md:9`），产品页却已出现档位与算力话术（`墨台产品页.html:1237`、`:1400`），见[账本与计费](entities/ledger-billing.md)（本页 status: disputed）。
- ⚠️ 冲突：仓库文档的手写 JS 清单停在 14 个（`AGENTS.md:10`、`app/src/verify/verify-suite.ts:14`），动态判据实测 23 个，见[验证套件](entities/verification-suite.md)。
- ⚠️ 冲突：技能正文里的硬约束只在技能被显式加载的那一回合生效——2026-10-05 验收两次复现"模型不读数据就编造数据画出专业样子的图"，加了 SKILL.md 约束仍复现（`app/verify/全功能验证报告.md:220-224`），见[科研领域插件](entities/research-plugins.md)与[有意保留的已知缺陷](syntheses/known-defects.md)。
- 尚未核验收口：[BYOK 认证与额度打回](concepts/byok-auth.md) 与[算力与权限解耦](concepts/billing-quota-decoupling.md) 仍是 draft——前者的服务端拒绝文案需要真实凭据才能复现，后者只有设计不变式没有实现。
- 已知缺陷 9 组（思考开关不进上游请求体、子智能体提示不落界面、force 参数被吞、约束放错层等）：[有意保留的已知缺陷](syntheses/known-defects.md)。

## 常用命令（全部在 `app/` 目录）

| 命令 | 作用 |
|---|---|
| `npm run typecheck` | 三套 tsconfig 一起查类型 |
| `npm run build:ts` | 把 `app/src/**` 传播到 JS 产物 |
| `npm run start` | 编译后拉起 Electron |
| `npm run verify` / `verify <name>` / `verify -- --all` | 列脚本 / 单跑 / 全量 |
| `npm run wiki:lint` | Wiki 健康检查，非零退出即不通过 |
| `npm run wiki:lint -- --fix` | 重生成 [index.md](index.md) |
| `npm run wiki:lint -- --add concept/<id> --title "标题" --sources 路径1,路径2` | 生成合规骨架页 |
| `npm run wiki:lint -- --log ingest --title "资料标题"` | 向 [log.md](log.md) 追加一条 |

## 三个动作怎么触发

用户丢来新资料要沉淀 → **Ingest**（先查 SCHEMA §二 登记表，再 `--add`，然后回头改被触及的实体/概念页）。用户问项目知识 → **Query**（先读 index，再顺链接；有价值的对比与结论回填成 syntheses）。定期或改动后 → **Lint**（`npm run wiki:lint`，warning 也要进下一轮维护）。完整流程与规则码表在 [SCHEMA 契约](SCHEMA.md)。

## 关联

- 契约与流水：[SCHEMA 契约](SCHEMA.md)、[索引](index.md)、[操作日志](log.md)
- 实体：[墨台产品](entities/motai-product.md)、[Wiki 系统](entities/wiki-system.md)
- 综合：[策划案与源码偏差清单](syntheses/plan-vs-code-gaps.md)
