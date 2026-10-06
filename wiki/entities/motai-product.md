---
type: entity
title: 墨台产品
tags: [产品, 架构总览, 墨台, ChatScience]
sources: [app/package.json, app/src/, 墨台实现策划案/_src/, motai-site/]
updated: 2026-10-06
status: stable
---

# 墨台产品

> 一句话摘要：墨台是一台"本地优先"的桌面科研工作台——Electron 壳里跑一个本地 HTTP 后端，由墨道主智能体编排子智能体与科研插件，对外名称在不同层分别是 墨台 / ChatScience / chatscience-desktop / ChatScience.exe。

## 它由哪些部分组成

| 层 | 承担者 | 页面 |
|---|---|---|
| 桌面壳 | Electron 主进程与 preload，起后端、管窗口与单实例 | [Electron 桌面壳](electron-shell.md) |
| 渲染层 | 单文件主脚本 + 14 个 Work 模块 + 主题令牌模板 | [前端渲染层](frontend-renderer.md)、[Work 模块群](work-modules.md) |
| 本地后端 | Express 路由 + 会话编排 + 沙箱 + 记忆/知识库 + 账本 | [后端服务](backend-server.md)、[沙箱与工作台](sandbox-workspace.md) |
| 智能体 | 墨道主编排 + 墨析对话 + 七类科研子智能体 | [墨道运行时](agent-runtime.md)、[子智能体体系](subagent-system.md) |
| 领域能力 | 四个科研插件（技能/命令/工具/角色/路由） | [科研领域插件](research-plugins.md) |
| 外观 | 12 套主题与八套初始态壁纸 | [主题系统](theme-system.md)、[设置页](settings-page.md) |
| 对外 | 产品页站点与品牌资产 | [墨台产品页站点](motai-site.md) |
| 工程 | 构建打包与验证套件 | [构建与打包体系](build-pack-system.md)、[验证套件](verification-suite.md) |
| 知识 | 本 Wiki 三层知识库 | [Wiki 系统](wiki-system.md) |

## 装配方式

包定义在 `app/package.json`：包名 `chatscience-desktop`，入口 `main.js`（编译产物），运行时依赖只有三个——`@qodercn-ai/qodercn-agent-sdk`、`express`、`zod`，开发依赖含 `electron` 与 `electron-packager`。主进程在启动时把后端拉起来：`serverHandle = require('./server/index').startServer(PORT_CANDIDATES, TOKEN, __dirname, ...)`（`app/src/main.ts:272`），端口从候选表里探测、回调返回实端口。打包阶段把 Electron 的 `electron.exe` 改名为 `ChatScience.exe`（`app/src/pack.ts:90`），并写 `OriginalFilename: 'ChatScience.exe'`（`app/src/pack.ts:111`）。

## 规模事实（可复算）

`app/src` 下 61 个 `.ts` 手写源；渲染层主脚本 `app/src/webapp/webapp.ts` 7,455 行、Agent 编排 `app/src/server/qoder.ts` 1,684 行；`app/src/webapp/work/` 14 个模块；`app/server/plugins/` 四个插件（技能目录 18 个）+ 底座内建技能 14（`app/server/skills-plugin/skills/`）；科研工具白名单 14 项（`app/src/server/qoder.ts:93-95`）；`app/verify/` 38 个 `.js`（37 个可跑 + 入口自身，其中 23 个手写，判据见[构建产物同步纪律](../concepts/artifact-sync.md)）；`墨台实现策划案/_src/` 七份策划案 markdown 对应六份 `.docx` 产物。

## 名称与身份

四个名称不是四套产品，而是四个层次：墨台 / 墨道 是产品与主智能体的中文名，ChatScience 是工程与英文名，`chatscience-desktop` 是包名，`ChatScience.exe` 是产物名。当前只有 `app/src/tools/wiki-lint.ts` 与策划案里出现"墨台"字样，产品代码里的中文名是墨道与墨析（`app/src/server/qoder.ts:148`、`app/src/server/qoder.ts:172`）。纪律与风险见[品牌与命名纪律](../concepts/brand-naming.md)；对外表述的边界见[宣传合规红线](../concepts/promo-compliance.md)。

## 尚未闭合的部分

商业化（会员档位、积分与 Token 计量）在代码里实质零实现，只有设计蓝图，见[账本与计费](ledger-billing.md)与[06-订阅预付费板块实现策划案](../sources/plan-06-billing.md)；团队侧能力同为缺口。完整偏差清单在[策划案与源码偏差清单](../syntheses/plan-vs-code-gaps.md)。

## 关联

- 资料：[05-宣传板块实现策划案](../sources/plan-05-promotion.md)、[品牌资产与站点素材](../sources/brand-and-site-assets.md)
- 实体：[墨台产品页站点](motai-site.md)、[墨道运行时](agent-runtime.md)、[后端服务](backend-server.md)
- 概念：[品牌与命名纪律](../concepts/brand-naming.md)、[宣传合规红线](../concepts/promo-compliance.md)
