---
type: entity
title: Electron 桌面层（main.ts / preload.ts）
tags: [Electron, 主进程, 托盘, 单实例锁, IPC]
sources: [app/src/main.ts, app/src/preload.ts, 墨台实现策划案/_src/03-后端.md, .workbuddy/memory/MEMORY.md]
updated: 2026-09-18
---

# Electron 桌面层（main.ts / preload.ts）

墨台的桌面壳：Electron 33 主进程负责窗口/托盘/快捷键/通知/状态落盘，并以后端进程的宿主身份注入 token 与端口；preload 是 contextIsolation 下的唯一安全桥。

## 组成与职责

| 部分 | 职责 |
|---|---|
| `main.ts` | 主窗 1320×880 / 子窗 1080×760（多窗口共享同一后端与状态）；自绘标题栏（`Menu.setApplicationMenu(null)`）；托盘 + 全局快捷键（Ctrl+Alt+C 显隐 / Ctrl+Alt+T 置顶 / Ctrl+Alt+L 左栏折叠）；`state.json` 原子写（180ms 防抖差量）；fork/启动 [后端服务](后端服务.md) |
| `preload.ts` | `contextBridge.exposeInMainWorld('csDesktop', …)`：token/port 经页面 URL query 注入（不落盘）、getStateSync/saveState/notify/log、窗口控制、selectDirectory/openPath；结构对应 `shared/domain.ts` 的 `CsDesktopBridge` |

## 关键机制

- **单实例锁**：`requestSingleInstanceLock()` + `second-instance` 唤起已有窗口；锁结果写入 `boot-marker.log`（`lock=true/false`），这是打包版静默退出的诊断锚点。⚠️ 重打包验证前必须先杀旧进程（只按 `ChatScience.exe` 名或命令行含 ChatScience 的 electron.exe 过滤，**绝不可全杀 electron.exe**——WorkBuddy 自身就是 Electron）。
- **托盘常驻**：`window-all-closed` 不退出，保留托盘；由托盘菜单「退出」真正结束（`quitting=true; app.exit(0)`）；`before-quit` 时 flushState + 关 HTTP + 终止沙箱进程树防孤儿。
- **通知抑制策略（`shouldNotify()`）**：仅在用户「不在看应用」时提醒——置顶窗口不通知、任一窗口前台聚焦不通知、其余（后台失焦/最小化/隐藏托盘）才弹；Windows 通知身份 `setAppUserModelId(process.execPath)` 配合 rcedit 元数据，横幅显示 ChatScience 而非 Electron。
- **token 随机轮换与 runtime.json**：每次启动 `crypto.randomBytes(24)` 生成新 token（不持久化），端口从 6 候选（8642/17462/27511/38123/2917/3218）回退确定；后端 `onPort` 回调后主进程写 `data/runtime.json = {port, token, pid}` 供验证脚本读取，并 reload 窗口注入新 token。⚠️ 这意味着**每次重启 token/端口都可能变**，任何外部缓存连接信息的行为都会失效。
- **窗口显示兜底**：`ready-to-show` 可能先于监听注册触发（页面命中缓存加载极快）→ 3 秒兜底 `win.show()`，否则窗口永久 `show:false`。
- **启动诊断 boot-marker.log**：`main.js loaded pid=` 与 `lock=` 两行标记，专用于定位打包版静默退出（explorer 代理启动后轮询 `lock=true` 即确认新实例生效）。
- **安全基线**：`contextIsolation:true + sandbox:true + nodeIntegration:false` + IPC 白名单（sendSync 仅 state:get/save；invoke 仅 select-directory/open-path）。

## 关联
- 被托管：[后端服务](后端服务.md)
- 工具链：[构建打包体系](构建打包体系.md)（explorer 代理启动、rcedit 元数据）
- 概念：[验证体系](../concepts/验证体系.md)（runtime.json 是 exe-verify 的第一读取物）
- 资料：[backend-策划案](../sources/backend-策划案.md)（2.1—2.3 进程架构）