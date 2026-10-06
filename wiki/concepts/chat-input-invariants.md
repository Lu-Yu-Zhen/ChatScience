---
type: concept
title: 对话区与输入区不变式
tags: [concept, 渲染层, 输入区, SSE, 验证]
sources: [app/src/webapp/webapp.ts, app/src/webapp/work/70-agent-chat.ts, app/src/webapp/work/75-plus-menu.ts, 01/主页面.html, app/verify/input-edge-check.js, app/src/verify/chat-verify.ts]
updated: 2026-10-06
status: stable
---

# 对话区与输入区不变式

> 一句话摘要：对话区与输入区必须长期成立的行为约束——模式严格跟随记录、Work 无工作区静默回落 Chat、Enter 发送、流式逐帧渲染、加号菜单挂 body——及其验证方式。

## 会话与模式不变式

- **模式严格跟随所打开记录**：`renderMessages` 顶部先同步 `sidebarMode`（`app/src/webapp/webapp.ts:3677-3693`），早于输入框状态更新，保证打开历史记录时界面与记录模式一致。
- **Work 无工作区 → 静默转 Chat**：会话 `mode==='work'` 且未绑定工作区时，发消息前把 `conv.mode` 改回 `chat` 并清空 `agentId`，消息照常发出、无气泡打扰（`app/src/webapp/webapp.ts:4501-4510`）。
- **草稿唯一化**：已在该模式的新对话初始页时再次触发不重建不播动画，仅聚焦输入框（`app/src/webapp/webapp.ts:1943-1946`）。

## 输入区不变式

- **Enter 发送 / Shift+Enter 换行**：`chatInput` 键盘监听（`app/src/webapp/webapp.ts:4466-4471`）。
- **空输入闸门**：无文字且无上下文芯片时直接 return，不入会话（`app/src/webapp/webapp.ts:4497`）。
- **发送即暂停状态机**：进行中点击发送键 = 中止当前输出，主输入框与阅读模式输入框共用 `sendBusy`（`app/src/webapp/webapp.ts:4485-4494`）。
- **入场动画只给新消息**：仅最后两条 `.msg` 播 `msgIn`，历史消息静止（`app/src/webapp/webapp.ts:4540-4542`）。
- **加号菜单必须挂 body**：`.input-box` 带 `overflow-y: auto`（`01/主页面.html:2054`），菜单若挂在输入框内会被裁剪，故一级/二级菜单 `position: fixed` 挂 `document.body`（`app/src/webapp/work/75-plus-menu.ts:13`、`:343-349`）；同一时刻仅一个实例，纯浏览器模式后三项置灰仅上传可用（`app/src/webapp/work/75-plus-menu.ts:356-365`）。
- **输入框由内向外渐变光晕**：`inset 1px` 主题色描边 + 外扩柔光渐隐两层叠加，聚焦态半径增大（`01/主页面.html:1519-1533`）。

## 流式渲染不变式

- 后端流式（真实链路）逐帧渲染：`requestPaint` 每帧最多一次，delta 到达即请求、不丢帧不卡顿（`app/src/webapp/webapp.ts:4675-4684`）。
- ⚠️ 冲突：策划案要求"流式输出必须 33ms 节流"（`墨台实现策划案/_src/02-前端.md:214`），源码实为 rAF 逐帧；30ms `setInterval` 只用于本地演示打字机（`app/src/webapp/webapp.ts:4285`），以代码为准 — 见[02-前端板块实现策划案](../sources/plan-02-frontend.md)。
- **Work 走 Agent SSE 链路**：`WORK_HOOKS.runTurn`（`app/src/webapp/webapp.ts:4545`）交 `Work.runTurn`，向 `/api/work/agent/run` 消费事件（`app/src/webapp/work/70-agent-chat.ts:135`），switch 覆盖 run_start/step_start/reasoning/delta/tool_start/tool_end/notice/run_result/aborted/error（`app/src/webapp/work/70-agent-chat.ts:147-241`）；`run_result` 携 `sessionId` 供下轮 resume（`:213`）。
- ⚠️ 冲突：策划案 SSE 事件表列 `run_end`（`墨台实现策划案/_src/02-前端.md:210-219`），Work 侧前端实际按 `run_result` 分支处理，以代码为准 — 见[前端渲染层](../entities/frontend-renderer.md)。
- 完成/失败经桌面壳系统通知（`app/src/webapp/webapp.ts:4751`、`app/src/webapp/work/70-agent-chat.ts:92-94`）。

## 验证方式

- **API 层链路**：`app/src/verify/chat-verify.ts` 直调 `/api/chat` 做 10 轮对话（`:25-36`），逐行解析 SSE `data:`/`[DONE]`（`:57-69`），断言关键词、连贯性与 TTFT。
- **真实窗口视觉**：`app/verify/input-edge-check.js` 起打包 exe 经 CDP 断言——标题栏高度 <60px 且"header+body+margin≈panel"总高守恒（`app/verify/input-edge-check.js:34-35`）、六套主题各自的光晕含主题色（`app/verify/input-edge-check.js:47-53`）。这体现"DOM 断言≠视觉可见，须 `elementFromPoint`+计算样式"方法论。

## 关联

- 实体：[前端渲染层](../entities/frontend-renderer.md)
- 实体：[Electron 桌面壳](../entities/electron-shell.md)
- 资料：[02-前端板块实现策划案](../sources/plan-02-frontend.md)
