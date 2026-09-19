# 墨台 Wiki · 索引

> 内容目录：所有 Wiki 页面的分类清单。查询时先读这里定位页面，再钻取。每页一行摘要。
> 入门请先读 [overview.md](overview.md)；操作规范见 [SCHEMA.md](SCHEMA.md)。

## 实体（entities/）

### 产品与智能体
- [墨台产品](entities/墨台产品.md) — 品牌实体：墨台/墨道/ChatScience 命名关系、VI 四色、产品页三页路由
- [墨道](entities/墨道.md) — 主智能体 agent-orchestrator：定位、工具集、子智能体委派、BYOK 模型通道
- [墨析](entities/墨析.md) — agent-discuss 对话只读智能体
- [子智能体体系](entities/子智能体体系.md) — 七类科研子智能体（SUBAGENT_SPECS、sub-* 注册、管理页分区）

### 前端
- [前端架构](entities/前端架构.md) — webapp.ts + 01/work/ 数字前缀模块体系与构建链路
- [主题系统](entities/主题系统.md) — 十二套扩展主题、66 项令牌契约、注册点与区分度门槛
- [设置页](entities/设置页.md) — 全屏覆盖层、六组十五项导航、真实数据对接

### 后端与桌面
- [后端服务](entities/后端服务.md) — app/src/server/ 模块地图（路由、store、SDK 桥、沙箱、知识库等）
- [Electron 桌面层](entities/Electron桌面层.md) — main/preload、单实例锁、托盘、通知抑制、token 轮换
- [构建打包体系](entities/构建打包体系.md) — pack.js/build.js/tsconfig 三配置、便携版、explorer 代理启动

### 外部工具
- [AgentsView](entities/agentsview.md) — 智能体运行观测工具（v0.42.0 旁路读盘方案）

### 规划中（未实现）
- [计费体系](entities/计费体系.md) — 算力/权限解耦设计蓝图 ⚠️ 实质性零实现

## 概念（concepts/）

### 架构决策
- [BYOK 认证机制](concepts/byok-auth.md) — options.model 直填 BYOK 模型 id；resolveModel 禁令与实测教训
- [Agent 委派模式](concepts/agent-委派模式.md) — options.agents 注册 + Agent 工具委派的设计模式
- [领域插件](concepts/领域插件.md) — server/plugins/<domain>/ 布局（research-ai/robotics/math、in-process MCP）
- [沙箱机制](concepts/沙箱机制.md) — 隔离执行、runtimes 参数与已知缺陷

### 工程约定
- [构建产物同步陷阱](concepts/构建产物同步陷阱.md) — 01/ 与 renderer/index.html 是编译产物，改源码位置的正确认知
- [动效与布局约定](concepts/动效与布局约定.md) — 输入框/消息协调动画、下拉渐显、reduced-motion、去 AI 味
- [去AI味设计](concepts/去AI味设计.md) — 中性色打底、零 emoji、内联 SVG、字体与动效规范
- [验证体系](concepts/验证体系.md) — app/verify/ 脚本族、CDP 观测、回归基线
- [智能体可观测性](concepts/智能体可观测性.md) — Agent 运行轨迹观测的层次与工具

### 经验沉淀
- [踩坑实录](concepts/踩坑实录.md) — 20 条「现象→根因→对策」跨会话汇编（rcedit 竞态、resolveModel 打回额度、zoom 坐标等）
- [开发环境约束](concepts/开发环境约束.md) — Windows 中文用户名、Node 路径、沙箱限制、启动方式穷尽实测
- [宣传合规红线](concepts/宣传合规红线.md) — 不得宣传未上线能力、边界如实声明、禁用表述

## 资料摘要（sources/）

### 策划案（墨台实现策划案/_src/）
- [01-UI 策划案](sources/ui-design-策划案.md) — UI 板块设计（⚠️ 部分记载已被现状取代）
- [02-前端策划案](sources/frontend-策划案.md) — 前端板块实现设计
- [03-后端策划案](sources/backend-策划案.md) — 后端板块实现设计
- [04-Agent 系统设计策划案](sources/agent-system-design.md) — 智能体体系设计（本库最大资料，180KB）
- [05-宣传策划案](sources/promotion-策划案.md) — 宣传板块设计
- [06-订阅预付费策划案](sources/billing-策划案.md) — 计费体系设计（规划态）
- [07-设置页改造策划案](sources/settings-page-策划案.md) — 设置页信息架构改造

### 工程记录
- [TypeScript 迁移说明](sources/ts-migration.md) — 迁移决策与第七节有意保留的已知问题
- [验证报告](sources/verification-report.md) — 交付与验证全记录（8 轮时间线）
- [WorkBuddy 日记忆（9-12→9-17）](sources/workbuddy-daily-logs.md) — 六日开发主线合并摘要
- [MEMORY-detail 细节分卷](sources/memory-detail.md) — 长枚举与实现细节索引
- [知识库改造 + AI 阅读模式计划](sources/knowledge-reader-plan.md) — .trae 计划文档

### 外部调研
- [AgentsView 调研与安装报告](sources/agentsview-report.md) — 观测工具选型与落地
- [Better Harness 报告两篇](sources/better-harness-report.md) — WorkBuddy 试运行 + Qoder 正式审查
