---
type: entity
title: 沙箱与工作台
tags: [sandbox, 工作台, server, webapp, 验证]
sources: [app/src/server/sandbox.ts, app/src/server/proc.ts, app/src/server/routes.ts, app/src/webapp/work/45-sandbox.ts, app/src/verify/sandbox-verify.ts]
updated: 2026-10-06
status: stable
---

# 沙箱与工作台

> 沙箱引擎把 python / node / shell 代码段放进独立子进程执行并回传产物，工作台的「沙箱页」与「运行页」是它的两个前端入口；本页讲模块组成、目录约定、执行链路与验证覆盖。

## 组成

- 引擎 `createSandbox(appRoot, opts)` 返回一个 SandboxApi：execCode / installDeps / listFiles / readFile / writeFile / deleteFile / readScopeFile / resetWorkspace / gcSandboxes / setPolicy / getPolicy / detectRuntimes / ensureScope / stop `app/src/server/sandbox.ts:55`、`app/src/server/sandbox.ts:532-543`。
- 进程层在 `app/src/server/proc.ts`：运行时探测带落盘缓存 `app/src/server/proc.ts:78-103`，受控 spawn `app/src/server/proc.ts:146-167`，进程树终止 `app/src/server/proc.ts:109-122`。
- HTTP 面是 12 个 sandbox 端点（exec / install / runtimes / files / read / write / delete / file / reset / policy GET / policy PUT / gc）`app/src/server/routes.ts:35-155`。
- 策略与边界语义是独立一页：[沙箱边界](../concepts/sandbox-boundaries.md)。

## 目录约定（运行时数据，不入库）

- 根 = appRoot 下的 data/sandbox `app/src/server/sandbox.ts:57`；scopeId 先清洗成 `[a-zA-Z0-9_-]` 并截断到 64 字符，空值落 global `app/src/server/sandbox.ts:102-105`。
- 每个 scope 四件套：work（进程 cwd）、work 下的 out（产物目录，代码里往 out 写即被识别）、.hooks（断网注入点）、.meta.json（scope 元数据）`app/src/server/sandbox.ts:112-125`。
- ⚠️ 冲突：策划案把 out 画成与 work 同级 `墨台实现策划案/_src/03-后端.md:185-193`，源码实际把 out 建在 work 内 `app/src/server/sandbox.ts:115`、注释也明写「产物目录就在 cwd 下」；以源码为准，边界解释见 [沙箱边界](../concepts/sandbox-boundaries.md)。
- 两个钩子文件每次 ensureScope 重写 `app/src/server/sandbox.ts:118-119`，模板见 `app/src/server/sandbox.ts:30-43`（Python）与 `app/src/server/sandbox.ts:45-53`（Node）。
- 快照跳过名以点开头的条目，隐藏文件与隐藏目录不会进产物清单 `app/src/server/sandbox.ts:136`；钩子目录与元数据本来就建在 work 之外 `app/src/server/sandbox.ts:116-117`。

## 执行链路

execCode 的一次执行按这个顺序走 `app/src/server/sandbox.ts:161-342`：

1. 语言校验，脚本后缀由 SCRIPT_EXT 决定（Windows 的 shell 落 .cmd）`app/src/server/sandbox.ts:28`。
2. 若请求带绝对且真实存在的 cwd，进程 cwd 切到该工作区，但运行脚本仍写沙箱，产物 diff 限深 2 层 `app/src/server/sandbox.ts:165-169`。
3. 运行时缺失直接返回结构化失败并附探测 diagnostics，不抛异常 `app/src/server/sandbox.ts:172-179`。
4. 静态扫描命中即 blocked、代码根本不执行 `app/src/server/sandbox.ts:182-191`。
5. 全局并发信号量 acquire / release `app/src/server/sandbox.ts:63-73`。
6. 脚本名形如 `_run_<时间底36>_<随机>.<后缀>`，以 argv 数组交给解释器 `app/src/server/sandbox.ts:196-197`、`app/src/server/sandbox.ts:224-236`。
7. 固定环境变量：中文编码两项、matplotlib 用 Agg、BLAS 线程收敛到 4、PYTHONPATH 指向钩子目录 `app/src/server/sandbox.ts:204-215`；声明式断网再追加代理黑洞与 NODE_OPTIONS `app/src/server/sandbox.ts:216-220`。
8. 超时用进程树强杀并记 killedInfo `app/src/server/sandbox.ts:291-295`。
9. 输出先清洗（回车分段、剥 ANSI 与控制字符）`app/src/server/sandbox.ts:79-88`，再按 head 60% + tail 40% 截断 `app/src/server/sandbox.ts:92-98`；原始采集上限取策略值的 4 倍、溢出保尾 `app/src/server/sandbox.ts:254`、`app/src/server/sandbox.ts:260-264`。
10. 产物 = 运行前后目录快照 diff，排除本次的 `_run_` 脚本 `app/src/server/sandbox.ts:310-316`，最多 50 个，小图片转 dataUrl 内联 `app/src/server/sandbox.ts:345-362`。

依赖安装是另一条受控通道：包名先过白名单正则（因为 .cmd 包装要经 cmd.exe），一次最多 50 个，超时固定 10 分钟 `app/src/server/sandbox.ts:366-373`、`app/src/server/sandbox.ts:410-412`。

## 前端入口

- 沙箱页左列是运行时诊断与策略编辑器 `app/src/webapp/work/45-sandbox.ts:68-102`、`app/src/webapp/work/45-sandbox.ts:15-56`，右列是控制台 `app/src/webapp/work/45-sandbox.ts:104-243`，注册为 Work.pages.sandbox `app/src/webapp/work/45-sandbox.ts:291`。
- 策略改动 600ms 防抖后 PUT，后端合并再写 work.json 分区 `app/src/webapp/work/45-sandbox.ts:58-66`、`app/src/server/routes.ts:143-150`。
- 执行走 SSE：queued → stdout/stderr 实时流 → end(ExecResult) `app/src/server/routes.ts:35-66`；前端只认这三类事件加 error `app/src/webapp/work/45-sandbox.ts:205-237`。
- 运行页复用同一引擎，只保留最轻入口 `app/src/webapp/work/55-run.ts:4-8`、`app/src/webapp/work/55-run.ts:63`。
- 代码与输出一律 textContent 渲染，绝不 innerHTML `app/src/webapp/work/45-sandbox.ts:4-9`；控制台文本在 DOM 侧只留最近 200KB `app/src/webapp/work/45-sandbox.ts:211-212`。
- 页面顶部常驻能力边界声明用中性面板而非高饱和警告 `app/src/webapp/work/45-sandbox.ts:258-261`。
- Agent 侧经 run_code 工具落到同一个 execCode `app/src/server/qoder.ts:427-452`；scope 为 agent 的智能体用 conv 前缀的独立沙箱 `app/src/webapp/work/70-agent-chat.ts:99`，两个内建智能体都是 global `app/src/server/qoder.ts:144`、`app/src/server/qoder.ts:153`。

## 验证覆盖

`sandbox-verify` 自起随机端口后端、不干扰运行实例 `app/src/verify/sandbox-verify.ts:64-66`，18 个断言分 8 组：健康检查 `app/src/verify/sandbox-verify.ts:69-70`、中文与 numpy `app/src/verify/sandbox-verify.ts:72-80`、超时强杀且孙子进程无残留 `app/src/verify/sandbox-verify.ts:82-110`、matplotlib 产物回传 `app/src/verify/sandbox-verify.ts:113-129`、工具级路径守卫四例 `app/src/verify/sandbox-verify.ts:132-149`、诚实演示代码层可读沙箱外 `app/src/verify/sandbox-verify.ts:151-158`、进度条不吞尾部结论 `app/src/verify/sandbox-verify.ts:161-175`、断网三例与危险命令拦截 `app/src/verify/sandbox-verify.ts:177-199`、并发信号量 `app/src/verify/sandbox-verify.ts:202-210`。汇总写进验证目录的 work-metrics.json，退出码取全通过率 `app/src/verify/sandbox-verify.ts:214-222`。

## 已知遗留

- detectRuntimes 忽略 force 参数：前端「刷新」带的是 `?force=1` `app/src/webapp/work/45-sandbox.ts:74`，但 API 层直接丢弃该参数、实际仍走 6 小时 TTL 缓存 `app/src/server/sandbox.ts:537-539`、`app/src/server/proc.ts:15`。
- 内存峰值恒为 null：无 Job Object 就不谎报 `app/src/server/sandbox.ts:15-16`、`app/src/server/sandbox.ts:336`。

## 关联

- 概念：[沙箱边界](../concepts/sandbox-boundaries.md)（能执行什么、边界在哪、如何拒绝）
- 实体：[Work 模块群](work-modules.md)（沙箱页与运行页在 bundle 里的位置）
- 概念：[领域路由与角色](../concepts/domain-routing.md)（run_code 如何被挂给子智能体）
- 资料：[测试文件夹人工验证记录](../sources/manual-test-notes.md)（工作区模式的人工留痕）
