---
type: concept
title: 开发环境与命令约束
tags: [环境, 命令, windows, electron, 工程约束]
sources: [app/package.json, app/start.bat, AGENTS.md, app/src/verify/verify-suite.ts, app/verify/全功能验证报告.md, app/TypeScript迁移说明.md]
updated: 2026-10-06
status: stable
---

# 开发环境与命令约束

> 一句话摘要：所有 npm 命令都在 app/ 目录执行，产物路径与脚本 cwd 都按「相对 app 根」写死；Windows 侧还有宿主环境变量泄漏、保留端口段与换行三处固定坑。

## 命令面只有六条，且都在 app/ 下跑

- `app/package.json:7-12`：typecheck / build:ts / verify / wiki:lint / guard:artifacts / start。含义与同步职责见 [构建产物同步纪律](../concepts/artifact-sync.md)。
- 仓库规则明确「命令均在 app/ 目录执行」，见 `AGENTS.md:17`；提交前门禁是 typecheck 覆盖三套配置（`AGENTS.md:18` 对应 `app/package.json:7`）。
- 验证入口自带 cwd 归一：脚本目录的上级即 app 根，子进程以它作 cwd（`app/src/verify/verify-suite.ts:25-27`、`app/src/verify/verify-suite.ts:134-137`），所以从仓库根跑 `node app/verify/verify-suite.js` 也等价（`app/src/verify/verify-suite.ts:4-5`）。
- wiki-lint 的仓库根取工具自身目录的上两级（`app/src/tools/wiki-lint.ts:52-53`），并从那里调 git 比对提交日期（`app/src/tools/wiki-lint.ts:289-301`）——git 不在 PATH 时 STALE 与作者署名会静默降级为 null / unknown（`app/src/tools/wiki-lint.ts:606-612`）。

## 两种启动方式不等价

- 日常：npm start = build:ts 后起 electron（`app/package.json:12`）。
- 双击：`app/start.bat` 自己走完整链——先 `cd /d %~dp0`（`app/start.bat:4`）、`chcp 65001` 保中文（`app/start.bat:2`）、探测本机 Node（硬编码路径优先，缺文件才回退 PATH 上的 node，`app/start.bat:6-7`）、缺 Electron 时自动装依赖（`app/start.bat:9-13`）、两步 tsc 失败即 pause 退出（`app/start.bat:15-29`）、最后 build + 启动 exe（`app/start.bat:31-35`）。
- 差异点：start.bat 的 tsc 步**先判 errorlevel 再中止**（`app/start.bat:17-21`），配合三套配置的 noEmitOnError（`app/tsconfig.json:21`）保证类型不过不出产物；但它直接调 node_modules 里的 tsc 而非 npm scripts，因此**不会**跑 tsconfig.verify.json 那一套，verify 层脚本得单独 build:ts。
- ⚠️ 冲突：`AGENTS.md:18` 要求提交前跑 `npm run typecheck`，但双击路径 `app/start.bat:16` 与 `app/start.bat:24` 只跑核心与前端两套编译；正确做法见 [构建产物同步纪律](../concepts/artifact-sync.md)。
- 换行坑：这份批处理是混合换行，第 23~30 行是 CRLF、其余是 LF（`app/start.bat:23-30`），编辑时别以为整文件同一种行尾。

## Windows 特有的三处约束

- 宿主环境变量泄漏：ELECTRON_RUN_AS_NODE=1 会让 electron.exe 退化为纯 Node、应用不启动，打包冒烟与所有 UI 脚本 spawn 前都要剥掉它（`app/src/pack.ts:226-229`、`app/verify/settings-geometry.js:20`）。
- 保留端口段：Windows 可能占用候选端口触发 EACCES，服务按候选列表依次回退并把实际端口写进运行时文件（`app/src/server/index.ts:236-238`，实测记录见 `app/verify/验证报告.md:86`）。
- 文件锁与杀软：exe 被占用时 rcedit 会部分写入静默失败，所以先 taskkill 再等 1.2 秒（`app/src/pack.ts:100-101`）；首启可能被杀软扫描拖慢，冒烟按 20 秒容忍（`app/src/pack.ts:235-240`，说明见 `app/verify/验证报告.md:249`）。
- 单实例闸：锁被拒的实例必须不起服务、不写运行时文件，否则外部工具连错端口（`app/src/main.ts:264-268`，缺陷编号 B8 见 `app/verify/全功能验证报告.md:17`）；壳的窗口与托盘行为见 [Electron 壳](../entities/electron-shell.md)。

## 运行时与外部依赖

- Electron 33 = Chromium 130 / 内置 Node 20（`app/TypeScript迁移说明.md:80`），因此 SDK 这类纯 ESM 包不能用 require 加载（`app/verify/验证报告.md:237`）。
- ⚠️ 冲突：`app/verify/验证报告.md:3` 写「Electron 33 + Node 24.14.0 内置运行时」，但 `app/TypeScript迁移说明.md:119` 与同报告 `app/verify/验证报告.md:237` 都记 Electron 33 内置 Node 20；以源码为准，该坑的来龙去脉在 [踩坑实录](../concepts/pitfalls-log.md)——Node 24 是本机 shell 里的 Node，Electron 内是 Node 20。
- 本机 PATH 缺 node/uv/npm/pip 会如实反映在沙箱运行时探测页，并影响 run_code 的 Node 语言与插件 stdio 通道（`app/verify/全功能验证报告.md:151`）。
- 依赖面很小：express、SDK、zod 三个运行时依赖（`app/package.json:23-27`），typescript/@types 只是构建期，产物里被排除（`app/src/pack.ts:130-135`）。
- 跨平台未实测：托盘与快捷键有跨平台实现，但 macOS/Linux 需按用户环境自测（`app/verify/验证报告.md:175`）。

## 运行时与 PATH 的现实约束

- 仓库里不再自带 Node 发行版：`SDK应用/njs/`（指向仓库外绝对路径的本机 Node 软链）已被排除出版本库（`.gitignore:6-7`）并停止跟踪，克隆后要跑 SDK 样例工程得自备 node。
- 本机 PATH 里目前没有 node / uv / npm / pip，沙箱页会如实呈现；后果是 `run_code` 的 Node 语言与插件的 stdio 通道受影响，Python 正常（`app/verify/全功能验证报告.md:267`）。这也是内置插件 MCP 改走 in-process 注入的环境原因，见[MCP 凭据带外化](mcp-credentials.md)。
- 界面类验收依赖打包版：先 `build:ts` → `build.js` → 重打包，再用新符号 grep dist 与源码树确认产物新鲜（判据见[构建产物同步纪律](artifact-sync.md)），否则会在旧包上跑出假失败。

## 关联

- 产物同步与漂移检查：[构建产物同步纪律](../concepts/artifact-sync.md)
- 构建与打包脚本本体：[构建与打包体系](../entities/build-pack-system.md)
- 验证脚本入口：[验证套件](../entities/verification-suite.md)
- Wiki 命令与门禁：[Wiki 系统](../entities/wiki-system.md)
- 环境类踩坑：[踩坑实录](../concepts/pitfalls-log.md)
