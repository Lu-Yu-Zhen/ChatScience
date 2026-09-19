---
type: concept
title: 墨台项目总览
tags: [overview, 导航]
sources: [全部]
updated: 2026-09-18
---

# 墨台（ChatScience）项目总览

> 入门页：整个项目的全景导航。深入任何主题请从链接进入对应页面；完整目录见 [index.md](index.md)。

## 一句话定位

**墨台**（工程代号 ChatScience）是一个 Electron 桌面科研智能体应用：Chat 模式做轻对话，Work 模式由主智能体**墨道**驱动深度科研。主张语「轻对话用 Chat，深科研交给墨道」。详见 [墨台产品](entities/墨台产品.md)。

## 系统分层

| 层 | 内容 | 入口页 |
|---|---|---|
| 桌面壳 | Electron main/preload、单实例锁、托盘、通知 | [Electron 桌面层](entities/Electron桌面层.md) |
| 前端 | webapp.ts + 14 个 work/ 数字模块，编译进单文件 | [前端架构](entities/前端架构.md) · [主题系统](entities/主题系统.md) · [设置页](entities/设置页.md) |
| 后端 | 纯 Node/Express，仅绑 127.0.0.1 + 随机 token 鉴权 | [后端服务](entities/后端服务.md) |
| 智能体 | 墨道（agent-orchestrator）+ 墨析 + 七类子智能体 | [墨道](entities/墨道.md) · [子智能体体系](entities/子智能体体系.md) |
| 领域扩展 | research-ai / robotics / math 三插件（9 个领域工具） | [领域插件](concepts/领域插件.md) |

## 当前状态快照（2026-09-18）

- **已落地**：Work 模式 Agent 链路（BYOK-only）、十二套主题、设置页真实数据对接、trace 思考分组、输入框「+」资源菜单、验证体系（exe-verify 34 项 + 12 脚本 69+ 项）。
- **规划态**：[计费体系](entities/计费体系.md)（⚠️ 实质性零实现）、团队版（架构级缺失）、宣传物料多数能力。
- **有意保留的已知问题**：Chat 深度思考开关无效、sandbox runtimes force 参数被忽略、沙箱错误文案缺右括号（见 [TS 迁移摘要](sources/ts-migration.md) 第七节）。

## 五条核心设计决策

1. **BYOK-only 模型通道**：Work 模式模型调用走用户第三方 API Key，`options.model` 直填 BYOK 模型 id；**禁止设置 resolveModel**（一旦设置，服务端把整个会话打回平台额度通道）。→ [BYOK 认证机制](concepts/byok-auth.md)
2. **子智能体委派**：七类科研子智能体经 `options.agents` 注册给墨道，经 Agent 工具委派，不进 UI 选择器。→ [Agent 委派模式](concepts/agent-委派模式.md)
3. **构建产物纪律**：`01/` 与 `app/renderer/index.html` 是编译产物，前端修复必须落在 `app/src/webapp/`，否则静默丢失。→ [构建产物同步陷阱](concepts/构建产物同步陷阱.md)
4. **每步必重打包验证**：用户硬约定——每完成一步改动必须重新打包并由 explorer 代理启动 exe（沙箱内唯一可靠启动路）。→ [开发环境约束](concepts/开发环境约束.md)
5. **诚实边界**：沙箱是「防误操作」非绝对隔离；宣传不得越过未上线能力红线。→ [宣传合规红线](concepts/宣传合规红线.md) · [沙箱机制](concepts/沙箱机制.md)

## 已知矛盾与待复核（Lint 线索）

- 左栏宽度：策划案 280px vs MEMORY `--left-w` 256px（以现状为准，待复核）。
- 宣白色值：05 策划案 #F6F7F9/#F7F5EE vs MEMORY #F4F0E5（以 MEMORY 为准）。
- 01-UI 策划案「双主题+六套待实现」已被十二套现状取代；04 策划案「4 内置智能体」已收敛为 2 个。
- TS 迁移说明「前端有意保持 JS」已被 src/webapp TS 化落地推翻。
- ⚠️ 待补：PowerShell 单元素数组自动解包坑（PUT 全列表变非数组清空分区）在工程日志簇无记录，详情见 MEMORY 项目记忆。

## 推荐阅读路径

- 想了解**产品是什么** → [墨台产品](entities/墨台产品.md) → [计费体系](entities/计费体系.md) → [宣传合规红线](concepts/宣传合规红线.md)
- 想改**前端/UI** → [前端架构](entities/前端架构.md) → [构建产物同步陷阱](concepts/构建产物同步陷阱.md) → [主题系统](entities/主题系统.md) → [动效与布局约定](concepts/动效与布局约定.md)
- 想改**智能体/模型链路** → [墨道](entities/墨道.md) → [BYOK 认证机制](concepts/byok-auth.md) → [子智能体体系](entities/子智能体体系.md) → [领域插件](concepts/领域插件.md)
- 想跑**构建与验证** → [构建打包体系](entities/构建打包体系.md) → [验证体系](concepts/验证体系.md) → [踩坑实录](concepts/踩坑实录.md)
- 想查**历史决策过程** → [日记忆摘要](sources/workbuddy-daily-logs.md) → [验证报告](sources/verification-report.md) → 各策划案摘要页

## 关联

- 操作规范：[SCHEMA.md](SCHEMA.md)
- 全量目录：[index.md](index.md)
- 时间线：[log.md](log.md)
