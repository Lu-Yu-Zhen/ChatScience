---
type: entity
title: Work 模块群
tags: [webapp, 工作台, 前端, 构建]
sources: [app/src/webapp/work/, app/src/build.ts, app/tsconfig.webapp.json, 01/主页面.html]
updated: 2026-10-06
status: stable
---

# Work 模块群

> `app/src/webapp/work/` 下 14 个以两位数字前缀排序的全局脚本模块，编译后由构建脚本内联成一个 IIFE 注入渲染层，承担 Work 模式的页面、状态、后端访问与 Agent 会话接管。

## 加载与注册方式

1. 编译：webapp 配置的 outDir 指向仓库根的 01/，源码里的每个模块产出一个同名 JS `app/tsconfig.webapp.json:16`。
2. 收集：构建脚本只认「两位数字-名字.js」形态的文件并按文件名排序，排序即执行顺序，明确不用文件系统的返回顺序 `app/src/build.ts:180-185`。
3. 前置校验：首个必须 00-core、末个必须 90-boot，再逐文件 `node --check` 做语法校验，语法错误直接让构建失败而不是产出一个白屏应用 `app/src/build.ts:189-204`。
4. 打包：全部拼进一个 'use strict' 的单一 IIFE，模块之间靠顶层共享常量通信（Work / WorkState / WORK_I18N），同时不污染全局 `app/src/build.ts:199-216`。
5. 注入：模板里留两个标记 `01/主页面.html:2333-2336`；构建先把主脚本注到主脚本标记处，再把 Work bundle 注到 Work 标记处，桌面桥接插到文档闭合标签前 `app/src/build.ts:245-272`；三段的先后顺序由产物断言兜底 `app/src/build.ts:275-287`。
6. 顺序约束的后果：bundle 在主脚本之后执行，所以对主脚本全局（WORK_HOOKS / t / getModels 等）的引用一律写在函数体内，避免加载期踩 TDZ `app/src/webapp/work/00-core.ts:4-13`。
7. 对外可见面只有一个：核心模块把 Work 挂到 window.CS_WORK `app/src/webapp/work/00-core.ts:23`，桥接层据此调用 snapshot / restore / boot `app/src/build.ts:57-58`。

## 14 个模块各自的职责

- `00-core.ts`（458 行）Work 命名空间与 UI 原语 `app/src/webapp/work/00-core.ts:15-23`；取词条的 tt() 缺 key 只 warn 不抛错 `app/src/webapp/work/00-core.ts:27-35`；图标入参走严格白名单正则，不匹配就退回默认图标 `app/src/webapp/work/00-core.ts:52-53`；整页重挂 rerender() `app/src/webapp/work/00-core.ts:448-458`。
- `10-api.ts`（149 行）后端访问层：workFetch / workSse / workFetchBlob 三个能力与可用态判定 `app/src/webapp/work/10-api.ts:4-13`、`app/src/webapp/work/10-api.ts:45`、`app/src/webapp/work/10-api.ts:73`、`app/src/webapp/work/10-api.ts:133`，导出集中在 Work.api `app/src/webapp/work/10-api.ts:141-149`。带鉴权头取二进制而不给路由开 token 查询参数，因为 token 会进日志 `app/src/webapp/work/10-api.ts:8-10`。
- `20-store.ts`（95 行）前端状态 WorkState 与后端 bootstrap 的映射 `app/src/webapp/work/20-store.ts:11-23`、`app/src/webapp/work/20-store.ts:28-52`；ensureReady 记忆化，首次打开任一 Work 页面才打后端 `app/src/webapp/work/20-store.ts:28-31`；另为桥接提供界面态快照 `app/src/webapp/work/20-store.ts:64-87`。
- `30-agents.ts`（417 行）智能体搭建页，字段与后端 query options 一一对应 `app/src/webapp/work/30-agents.ts:4-10`；六个角色枚举 `app/src/webapp/work/30-agents.ts:12`；沙箱 scope 在编辑器里二选 `app/src/webapp/work/30-agents.ts:319-323`；注册 `app/src/webapp/work/30-agents.ts:417`。
- `35-skills.ts`（608 行）技能与插件页，技能以 SDK local plugin 形态承载、启用态存 work.json 的 skills 段 `app/src/webapp/work/35-skills.ts:4-8`；技能/插件双选项卡与双视图 `app/src/webapp/work/35-skills.ts:11-16`；zip 与文件夹两种本地上传 `app/src/webapp/work/35-skills.ts:192`；注册 `app/src/webapp/work/35-skills.ts:608`。
- `40-mcp.ts`（223 行）连接器页：外部 MCP 由 SDK 原生承载，本页只做配置管理与透传校验 `app/src/webapp/work/40-mcp.ts:4-9`；内建科研工具分组 `app/src/webapp/work/40-mcp.ts:11-18`；三个 stdio 模板 `app/src/webapp/work/40-mcp.ts:20-24`；注册 `app/src/webapp/work/40-mcp.ts:223`。
- `45-sandbox.ts`（291 行）沙箱页，见 [沙箱与工作台](sandbox-workspace.md)。
- `50-notebook.ts`（262 行）笔记本页：单元格增删排序与 MD 预览，归属分项目 / 对话 / 独立三级 `app/src/webapp/work/50-notebook.ts:4-10`，UI 对象 `app/src/webapp/work/50-notebook.ts:31`，注册 `app/src/webapp/work/50-notebook.ts:262`。
- `55-run.ts`（128 行）运行页：复用沙箱 exec、只保留最轻入口，完整控制台留在沙箱页 `app/src/webapp/work/55-run.ts:4-8`，注册 `app/src/webapp/work/55-run.ts:128`。
- `60-trace.ts`（301 行）Agent 工具调用时间线，唯一数据源是消息对象上的调用数组 `app/src/webapp/work/60-trace.ts:4-11`，渲染入口 `app/src/webapp/work/60-trace.ts:109`，运行中刷新与收尾 `app/src/webapp/work/60-trace.ts:260`、`app/src/webapp/work/60-trace.ts:295`。
- `70-agent-chat.ts`（269 行）Work 会话的 Agent 回合接管：只接管 work 模式会话，否则交回 Chat 链路 `app/src/webapp/work/70-agent-chat.ts:4-9`、`app/src/webapp/work/70-agent-chat.ts:11`；沙箱 scope 与工作区根在此决定 `app/src/webapp/work/70-agent-chat.ts:99-105`。
- `75-plus-menu.ts`（407 行）输入框「+」资源挂载菜单：一级四类、二级选定条目，菜单必须挂 body 且 fixed 以避开输入框的 overflow 裁剪 `app/src/webapp/work/75-plus-menu.ts:4-19`，尺寸常量 `app/src/webapp/work/75-plus-menu.ts:21-22`，导出 `app/src/webapp/work/75-plus-menu.ts:397-407`。
- `80-i18n.ts`（510 行）Work 词条，zh / en 键序一一对应 `app/src/webapp/work/80-i18n.ts:4-11`，字典对象 `app/src/webapp/work/80-i18n.ts:13`；它是纯数据模块，因此构建脚本能按 CommonJS 载入做中英键集合与函数型词条类型的一致性校验 `app/src/build.ts:220-242`。
- `90-boot.ts`（136 行）装配层：词条并入主脚本 i18n `app/src/webapp/work/90-boot.ts:11-18`，把 Work.pages 逐项注册成带 work- 前缀的视图 `app/src/webapp/work/90-boot.ts:21-23`，向主脚本交侧栏项 `app/src/webapp/work/90-boot.ts:29-43`、欢迎页 pills `app/src/webapp/work/90-boot.ts:46-76`、会话徽标 `app/src/webapp/work/90-boot.ts:79-83`、回合接管 `app/src/webapp/work/90-boot.ts:87-90`、轨迹节点 `app/src/webapp/work/90-boot.ts:93-96`、知识库索引推送 `app/src/webapp/work/90-boot.ts:100-116`，预热入口 Work.boot `app/src/webapp/work/90-boot.ts:119-136`。

## 约定与现状

- 六个模块向 Work.pages 注册页面：agents / skills / mcp / sandbox / notebook / run `app/src/webapp/work/30-agents.ts:417`、`app/src/webapp/work/35-skills.ts:608`、`app/src/webapp/work/40-mcp.ts:223`、`app/src/webapp/work/45-sandbox.ts:291`、`app/src/webapp/work/50-notebook.ts:262`、`app/src/webapp/work/55-run.ts:128`。
- 侧栏只留技能与插件 / 连接器两项，其余四项已迁到设置页，欢迎页的入口 pill 走 openSettings `app/src/webapp/work/90-boot.ts:25-32`、`app/src/webapp/work/90-boot.ts:63-74`。
- 全部 14 个模块都关掉逐行类型检查、按字节精确迁移自原 JS，环境与第三方声明另见 ambient 声明文件 `app/src/webapp/work/00-core.ts:1-3`。

## 工具轨迹的产物条目与右栏预览

`60-trace.ts` 负责把工具结果里出现的产物变成可点击条目：

- 首选后端随 `tool_end` 事件下发的结构化 `artifacts`（`app/src/webapp/work/60-trace.ts:40-44`），没有该字段时才回退到结果文本正则刮取（扩展名表 `app/src/webapp/work/60-trace.ts:39`），并按文件名去重（绝对/相对两种写法曾重复成两个 chip）。
- 路径解析口径写在文件头注释里：优先会话绑定的工作区根，没有工作区时回落沙箱 scope（`app/src/webapp/work/60-trace.ts:36`、`app/src/webapp/work/60-trace.ts:57`）。
- 会话上下文由 `70-agent-chat.ts` 每轮写入 `Work.previewCtx`（projectId + workspaceRoot + scopeId，`app/src/webapp/work/70-agent-chat.ts:111`），并在收到 `run_result` 时把结构化产物挂到工具调用上（`app/src/webapp/work/70-agent-chat.ts:205`）。
- 为什么要结构化字段：`tool_end.result` 会截断到固定长度，`run_code` 返回的 `files[]` 常落在截断区外，靠刮展示文本不可靠（`app/verify/全功能验证报告.md:243`）。

## 关联

- 实体：[沙箱与工作台](sandbox-workspace.md)（45-sandbox 与 55-run 背后的引擎）
- 实体：[构建与打包体系](build-pack-system.md)（bundle 注入所在的构建链）
- 概念：[领域路由与角色](../concepts/domain-routing.md)（35-skills 页是插件与路由建议的唯一 UI 落点）
