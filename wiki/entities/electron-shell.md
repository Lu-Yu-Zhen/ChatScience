---
type: entity
title: Electron 桌面壳
tags: [entity, Electron, 主进程, IPC, 墨台]
sources: [app/src/main.ts, app/src/preload.ts, app/src/shared/domain.ts]
updated: 2026-10-06
status: stable
---

# Electron 桌面壳

> 一句话摘要：Electron 主进程与 preload 安全桥——管窗口、托盘、全局快捷键、单实例锁、本地服务与 IPC 白名单，把桌面能力经 `window.csDesktop` 透出给渲染层。

## 组成

三个手写源构成桌面壳（原位编译产物为 app 目录下的 main.js / preload.js，不可手改、本簇不引）：

- `app/src/main.ts`（303 行）主进程。
- `app/src/preload.ts`（31 行）contextBridge 安全桥。
- `app/src/shared/domain.ts` 的 `CsDesktopBridge` 接口（`app/src/shared/domain.ts:622-641`）是 preload 暴露面的类型契约，与 preload 逐字段对齐。

## 启动与安全

主进程随机生成 24 字节 token（`app/src/main.ts:17`），候选端口列表 `PORT_CANDIDATES`（`:16`）。窗口以 `contextIsolation: true` + `nodeIntegration: false` + `sandbox: true` 创建（`app/src/main.ts:173-179`），token 与端口经页面 URL query 注入（`app/src/main.ts:182`），preload 再从 `window.location.search` 读出并透出 `base: 'http://127.0.0.1:' + port`（`app/src/preload.ts:8-17`）——token 不落盘。外链一律 `setWindowOpenHandler` deny，仅 `http(s)` 交 `shell.openExternal`（`app/src/main.ts:188`）。

## 单实例 / 托盘 / 窗口

- **单实例锁**：`requestSingleInstanceLock`（`app/src/main.ts:251`）；被拒实例 `app.quit()`，且 `whenReady` 内再设闸门 `if (!gotLock) return`（`app/src/main.ts:268`），避免被拒实例覆盖 `runtime.json` 成死端口。二次启动经 `second-instance` 唤起并聚焦已有窗口（`app/src/main.ts:257-262`）。
- **关窗即隐藏**：`win.on('close')` 在未退出时 `preventDefault` 并 `hide`（`app/src/main.ts:190-192`），退出走托盘菜单；`window-all-closed` 空实现保持托盘常驻（`app/src/main.ts:303`）。
- **托盘**：`createTray` 建菜单——显示主界面 / 新建多窗口 / 置顶 / 退出（`app/src/main.ts:209-223`），双击唤起主窗（`:222`）。
- **自绘标题栏**：`titleBarStyle: 'hidden'` 并 `Menu.setApplicationMenu(null)`（`app/src/main.ts:270`），窗口控制走 IPC `win:minimize`/`win:maximize-toggle`/`win:close`（`app/src/main.ts:140-152`）。

## 全局快捷键

`CommandOrControl+Alt+C` 显隐（`app/src/main.ts:288`）、`+Alt+T` 置顶（`:289`）、`+Alt+L` 通知渲染层切换左栏（`:291`，经 `left-panel-toggle` 通道）。

## IPC 白名单与桥接方法

preload 只暴露 `window.csDesktop`（`app/src/preload.ts:12-31`），方法与 main.ts 句柄一一对应：状态读写 `getStateSync`/`saveState`、`notify`、`log`、事件监听 `onTopmostChanged`/`onLeftPanelToggle`/`onMaxChanged`、窗口控制 `winMinimize`/`winMaximizeToggle`/`winClose`、对话框 `selectDirectory`/`openPath`/`exportPdf`。渲染层据此实现工作区选择、记忆目录打开、PDF 导出（`app/src/main.ts:89`、`:105`、`:122`）。

## 通知抑制与持久化

`shouldNotify` 只在"用户不在看应用"时提醒：置顶不通知、任一窗口前台聚焦不通知、后台/最小化/隐藏到托盘才通知（`app/src/main.ts:61-72`）。状态快照落 `data/state.json`，180ms 防抖 + tmp 再 rename 原子写（`app/src/main.ts:43-58`），`before-quit` 强制 `flushState` 并停后端、终止沙箱进程树（`app/src/main.ts:296-301`）。

## 关联

- 实体：[前端渲染层](../entities/frontend-renderer.md)
- 概念：[对话区与输入区不变式](../concepts/chat-input-invariants.md)
- 资料：[02-前端板块实现策划案](../sources/plan-02-frontend.md)
- 实体：[墨台产品](../entities/motai-product.md)
