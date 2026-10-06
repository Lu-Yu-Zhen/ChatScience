---
type: entity
title: 后端服务
tags: [server, HTTP, Express, 沙箱, 墨台]
sources: [app/src/server/, app/src/shared/domain.ts, app/src/main.ts, app/src/preload.ts, 墨台实现策划案/_src/03-后端.md]
updated: 2026-10-06
status: stable
---

# 后端服务

> 本页讲本地后端的四件事：HTTP 服务在哪个进程里起来、路由分几层、代码执行与工具调用的边界画在哪、前端拿到的是什么样的调用面。

## 是什么

一个只绑回环地址的 Express 应用，给桌面渲染层提供 AI 代理、Agent 运行、沙箱执行、持久化与检索能力 `app/src/server/index.ts:41-46`。它**不是独立进程**：由 Electron 主进程在 `whenReady` 里同进程 `require('./server/index').startServer(...)` 拉起 `app/src/main.ts:272`。

⚠️ 冲突：策划案的双进程图与启动链路表都把后端写成"主进程 fork 出的子进程" `墨台实现策划案/_src/03-后端.md:41`，代码事实是同进程装配 `app/src/main.ts:272`；详见 [03-后端板块实现策划案](../sources/plan-03-backend.md)。

## 怎么起来

1. 主进程生成一次性凭据与端口候选：`crypto.randomBytes(24)` 的 token、6 个候选端口 `app/src/main.ts:16-17`。
2. `startServer` 依次 `app.listen(port, '127.0.0.1')`，任一端口 `error`（Windows 保留段会 EACCES）就递归试下一个 `app/src/server/index.ts:239-258`。
3. 中间件顺序即安全顺序：JSON body（上限 40MB）→ CORS → `/api` 的 Bearer 强校验（不符 401）→ Work 路由 → 既有 API `app/src/server/index.ts:49-65` 与 `:70-87`。
4. 能力对象在装配期一次性注入 `WorkCtx`：store / sandbox / notes / kb / memory / qoder，其中 qoder 需要回引 ctx 所以先占位后赋值 `app/src/server/index.ts:71-87`。
5. 实际端口回调里写运行时信息并重新加载窗口 `app/src/main.ts:277-279`；被单实例锁拒绝的实例必须先返回，否则会把运行时文件覆盖成死端口 `app/src/main.ts:268`。

## 路由分层

| 层 | 挂载点 | 内容 |
|---|---|---|
| 核心 API | 直接写在 index.ts | health、state 读写、工作区扫描与原始文件读取、Chat SSE 代理 `app/src/server/index.ts:111-231` |
| Work API | `mountRoutes(app, ctx)` | 53 条路由，按沙箱 / Agent 运行 / 记忆 / 技能 / MCP / 智能体 / 子智能体 / 插件 / 知识库 / 历史 / 笔记 / 偏好 / 用户级数据分组 `app/src/server/routes.ts:16-515` |

⚠️ 冲突：策划案记「Work 命名空间 33 个、全库约 34—40 端点」`墨台实现策划案/_src/03-后端.md:94`，实际 Work 有 53 条；未登记的是 bootstrap、记忆 4 条、子智能体 2 条、插件与台账 6 条、偏好 2 条、用户级记忆与钩子与 worktrees 4 条 `app/src/server/routes.ts:19-29` 与 `app/src/server/routes.ts:361-514`，详见 [03-后端板块实现策划案](../sources/plan-03-backend.md)。

流式端点统一走 `openSse`，事件帧为 `data: {"evt":...}` 并带 15 秒心跳注释帧 `app/src/server/sse.ts:15-28`；事件负载类型集中在 `WorkRunEventMap` `app/src/shared/domain.ts:479-490`。客户端断开即中断：路由侧用 AbortController 把信号传进 SDK `app/src/server/routes.ts:181-197`。

## 执行与工具的边界

- **进程层**：`spawnGuarded` 固定 `shell:false` + argv 数组 + `stdio[0]='ignore'`，Windows 上 `.cmd/.bat` 包装才经 cmd.exe 且逐参数转义 `app/src/server/proc.ts:146-166`；超时用 `taskkill /T /F` 杀整棵进程树 `app/src/server/proc.ts:113`。
- **策略层**：`DEFAULT_POLICY` 给超时 / 输出 / 并发 / 单文件大小 / 断网模式等十项默认值 `app/src/server/policy.ts:20-31`，`mergePolicy` 再对数值做上下限钳制，防止配置写歪导致挂死 `app/src/server/policy.ts:174-177`。
- **路径层**：`assertInside` 用带分隔符的前缀比较并二次校验 realpath，封 junction 逃逸 `app/src/server/policy.ts:52-69`；`sanitizeRelPath` 拒绝对上穿越、非法字符与 Windows 保留设备名 `app/src/server/policy.ts:81-93`。
- **文本层**：16 类危险模式 + 两级以上穿越 + 可选网络导入拦截 `app/src/server/policy.ts:102-119` 与 `:134-151`——这层是纵深防御不是安全边界。
- **工具层**：科研工具以 in-process MCP server 注入同一 SDK 会话 `app/src/server/qoder.ts:1173-1187`；纯计算函数单独放在 `app/src/server/sci-tools.ts:1-15`，验证脚本可脱离模型单测。
- **插件工具**：领域插件用 `dataTools.json` 声明 lookup / convert / format 三类表驱动工具，宿主不执行任何插件代码，数据文件必须是插件目录内的 .json 且 ≤2MB `app/src/server/domain-data-tools.ts:1-10` 与 `:52-63`。

## 前端调用面

token 与端口经页面 URL query 注入后由 preload 透出 `app/src/preload.ts:8-17`，桌面适配层把它组装成 `window.CS_BACKEND` `app/src/build.ts:40-42`；请求侧只有三个入口：`workFetch`（自动带 Bearer 头）、`workSse`（POST + 流解析 + abort）、`workFetchBlob`（带鉴权头下载转 objectURL）`app/src/webapp/work/10-api.ts:45-139`。刻意不给路由开 `?token=` 查询参数——token 会进日志 `app/src/webapp/work/10-api.ts:9-10` 与 `app/src/server/routes.ts:122-123`。后端不可用时抛 `WorkApiError` 而非返回假数据 `app/src/webapp/work/10-api.ts:36-47`。

## 数据面

配置类工作数据只有一个文件与一条串行化写链：`store.ts` 读 `data/work.json`，所有读-改-写挂在同一条 promise 链上，tmp+rename 原子落盘 `app/src/server/store.ts:36-89`；分区集合见 `WorkState`（agents / subagents / skills / mcpServers / sandboxPolicy / modelToolSupport / runHistory / seeded / domainPlugins / prefs）`app/src/shared/domain.ts:415-428`。前端快照走另一条通道（`/api/state` 原子写 `app/src/server/index.ts:116-124`），两文件互不覆盖 `app/src/server/store.ts:6-7`。

## 受约束的工作区读取与插件自检

右栏预览需要按项目读文件字节，这条通道是**白名单式**设计，与通用的 `/api/fs/raw`（`app/src/server/index.ts:170`，接受任意路径）刻意分开：

- `GET /api/work/ws/raw?projectId=&rel=`（`app/src/server/index.ts:200`）先查已注册的 work 项目根（`app/src/server/index.ts:192`，读不到 state 时白名单为空、一律 404）；未注册项目 404（`app/src/server/index.ts:203`）、空 rel / 含 NUL / 绝对路径 400（`:204`）。
- 取 `realpath` 后强制落在项目根内，越界 403（`app/src/server/index.ts:206-208`）；非普通文件或超过 8MB 拒绝（`app/src/server/index.ts:211`），MIME 按扩展名白名单给、未知回 `application/octet-stream`（`app/src/server/index.ts:213`、映射表 `:183`）。
- 这么严的理由：工具轨迹里的文件名来自模型输出，若沿用接受任意路径的端点，一条伪造结果就能读全盘（`app/verify/全功能验证报告.md:240`）。
- 工作区扫描的扩展白名单 `WS_SCAN_EXTS`（`app/src/server/index.ts:128`）已纳入 png/jpg/webp/gif 与 txt/json/log/tex/bib/py/js/ts/yaml/ipynb 等，右栏才列得出 run_code 的产物图片。

另外两个只读端点：`GET /api/work/plugins/doctor`（`app/src/server/routes.ts:363`）返回包级 warnings、roles.json 试运行回报与可覆写角色清单（实现 `app/src/server/qoder.ts:1571`）；`GET /api/work/ledger`（`app/src/server/routes.ts:368`）除 `projectId/format/limit` 外接受 `projectName`，让复现清单头部显示人类可读项目名而不是裸 id。

## 关联

- 资料：[03-后端板块实现策划案](../sources/plan-03-backend.md)
- 实体：[记忆与知识库](./memory-knowledge.md)、[账本与计费](./ledger-billing.md)、[构建与打包体系](./build-pack-system.md)
- 概念：[MCP 凭据带外化](../concepts/mcp-credentials.md)、[算力与权限解耦](../concepts/billing-quota-decoupling.md)
