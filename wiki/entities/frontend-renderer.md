---
type: entity
title: 前端渲染层
tags: [entity, 渲染层, webapp, Electron, i18n]
sources: [app/src/webapp/, 01/主页面.html, 墨台实现策划案/_src/02-前端.md]
updated: 2026-10-06
status: stable
---

# 前端渲染层

> 一句话摘要：ChatScience 渲染层的唯一手写源码——单文件主脚本 `webapp.ts` + Work 扩展模块 + HTML 模板，经构建期拼接内联为桌面窗口内的运行代码。

## 它是什么

渲染层由三类手写源组成，构建时才合成产物（产物为 `01/` 下的 JS 与 renderer 页面，均不可手改、本簇不引，见 AGENTS.md 的产物地图）：

1. **主脚本** `app/src/webapp/webapp.ts`（7276 行，首行 `// @ts-nocheck`，逐行类型检查关闭，见 `app/src/webapp/webapp.ts:1`）：承担 Chat 模式、会话状态、消息渲染、输入区、知识库、阅读模式、设置面板、模型配置、i18n 取值器。
2. **Work 扩展模块** `app/src/webapp/work/*.ts`：按数字前缀字典序拼接进同一 IIFE；实际 14 个模块（`00-core`…`90-boot`，含 `75-plus-menu`）。模块间靠顶层 `const` 互相引用、共享同一闭包，不污染全局（`墨台实现策划案/_src/02-前端.md:94`）。
3. **HTML 模板** `01/主页面.html`（构建输入，非产物，可手改）：三栏骨架、自绘标题栏、输入区的静态结构。

## 主脚本如何与 Work 模块解耦

主脚本只声明挂载点 `WORK_HOOKS`（`app/src/webapp/webapp.ts:2127-2134`）——`pages` / `sidebarItems` / `runTurn` / `messageRowExtra` / `emptyStatePills` / `convBadge`。Work 页面构建器把节点注册进来，主脚本在侧栏、发送链路、消息渲染处"按 hook 是否存在"决定走 Work 还是原 Chat 逻辑（`app/src/webapp/webapp.ts:4545`）。未构建直接双击打开源文件时 hook 为空，页面显示"模块未加载"而非报错（`app/src/webapp/webapp.ts:2151-2166`）。

模板里两个注入标记把这一顺序固化：`<!--CS_MAIN_SCRIPT-->` 与 `<!--CS_WORK_MODULES-->`（`01/主页面.html:2333-2335`），Work 模块必须在主脚本之后注入（其顶层 const 已初始化，否则 TDZ 白屏）。

## 关键函数落点

- 会话模型：`currentConv`（`app/src/webapp/webapp.ts:1889`）、`createConversation`（`:1908`，字段含 mode/agentId/localFiles/kbFiles/docCtx）、`startDraft`（`:1941`）。
- 消息渲染：`renderMessages`（`app/src/webapp/webapp.ts:3673`）顶部先同步 `sidebarMode`（`:3677-3693`）再动输入框；`buildMessageRow`（`:4331`）、`buildThinkBlock`（`:4303`）。
- 流式：`paintStreaming` 稳定段/活动段分离增量渲染（`app/src/webapp/webapp.ts:4255-4278`）；本地演示打字机 `startStream` 用 30ms `setInterval`（`:4285`）。
- 发送：`sendMessage`（`app/src/webapp/webapp.ts:4496`）；真实链路 `runRealChat` POST `/api/chat` 带 `Bearer window.CS_BACKEND.token`（`:4719-4732`），SSE 由 `consumeChatStream` 逐行解析 `data:` 与 `[DONE]`（`:4584-4608`）。

## 与后端的通信面

主脚本访问数据类接口经 `workFetch`（`app/src/webapp/webapp.ts:843-847`）——它桥接 `window.CS_WORK.api.fetch`（由 `90-boot` 暴露），不可用时明确报错"请通过桌面版应用使用该功能"。`CS_BACKEND.base/token` 由桌面桥接注入，指向 `127.0.0.1:<port>`（`app/src/preload.ts:17`）。

## 输入区结构

模板把输入区骨架写死：`#inputArea`（`01/主页面.html:2053`）内 `.input-box`（`01/主页面.html:2054`，带 `overflow-y: auto`）、`#chatInput`（`:2063`）、加号 `#attachBtn`（`:2067`）、`#workspaceBtn`/`#permSelectBtn`/`#agentSelectBtn`/`#thinkingBtn`（`:2072-2095`）、模型 `#modelBtn`/`#micBtn`/`#sendBtn`（`:2101-2114`）。交互不变式集中在[对话区与输入区不变式](../concepts/chat-input-invariants.md)。

## 右栏：上下文资料与就地预览

`#rightPanel`（320px，`01/主页面.html:2128`）由 `renderRightPanel`（`app/src/webapp/webapp.ts:5313`）按签名守卫重建，签名里含预览态（`:5329`），内容分三组：项目文件（本地导入 + 工作区扫描）、知识库、数据库连接。

- **点击按类型分流**（`wsRowClick` `app/src/webapp/webapp.ts:5361`）：图片与文本/代码/CSV 在右栏就地预览；pdf/docx/html/xlsx 仍进全屏阅读器（`enterReadMode`，见 [对话区与输入区不变式](../concepts/chat-input-invariants.md)）。两个分组（项目文件、数据）共用这一对助手，避免"某组还指着阅读器"。
- **预览卡** `rpPreviewCard`（`app/src/webapp/webapp.ts:5119`）插在资料列表顶部：图片走 `URL.createObjectURL(blob)`，文本走内容预览并 200KB 截断，头部给类型·大小·相对路径、关闭、以及「全屏阅读」一键切回阅读器。
- **取字节端点是白名单制的**：`GET /api/work/ws/raw?projectId=&rel=`（`app/src/server/index.ts:200`）只认 `state.json` 里 `mode==='work'` 项目的 folder，`realpath` 后强制落在该根内（越界 403、绝对路径 400、未注册 404）。工作区扫描的扩展名清单在同文件 `:128`——右栏能不能列出 png 由它决定。
- **工具轨迹的产物条目**：`run_code` 结果 JSON 自带 `files[]`，但 `tool_end.result` 截断到 4000 字符会把 `files` 切掉，所以后端在截断前抽成结构化 `tool_end.artifacts`（`app/src/server/qoder.ts:100`、类型 `app/src/shared/domain.ts:487`），前端渲染成可点条目（`app/src/webapp/work/60-trace.ts:40`）；绝对路径仅当落在本次会话工作区内才可点，解析上下文由 `Work.previewCtx` 提供（`app/src/webapp/work/70-agent-chat.ts:111`）。

## 已知规模债

主脚本单文件已到 7455 行，且各 work 模块首行均 `// @ts-nocheck`（`app/src/webapp/webapp.ts:1`）。策划案原记 5,717 行/13 模块，与现状不符——按资料自身"以已实现为准"原则，以本页源码计数为准（对照见 [02-前端板块实现策划案](../sources/plan-02-frontend.md)）。

## 右栏即检视器

右栏从"只列论文类文档、点击一律进全屏阅读器"改成预览与阅读器分流：

- 预览卡 `rpPreviewCard()`（`app/src/webapp/webapp.ts:5119-5121`）在右栏列表内插入（`:5335`），图片走 blob 出图，文本/代码走内容预览并截断，头部给类型·大小·相对路径与"全屏阅读"回退（`app/verify/全功能验证报告.md:242`）。
- 点击分流由路由助手决定：图片/文本/代码/CSV 进右栏预览（`app/src/webapp/webapp.ts:5363`），pdf/docx/html/xlsx 仍进既有阅读器，原能力不动；该助手被提到 `renderRightPanel` 顶层，两个分组共用（此前数据分组的行还指着旧入口，导致点 CSV 误进全屏）。
- 相对路径计算要先归一正反斜杠与大小写（`app/src/webapp/webapp.ts:5355`），否则剥前缀失败会把绝对路径传给后端并报 400。

## 关联

- 资料：[02-前端板块实现策划案](../sources/plan-02-frontend.md)
- 实体：[Electron 桌面壳](../entities/electron-shell.md)
- 概念：[对话区与输入区不变式](../concepts/chat-input-invariants.md)
- 实体：[构建与打包体系](../entities/build-pack-system.md)
