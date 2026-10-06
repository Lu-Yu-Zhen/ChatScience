---
type: entity
title: 构建与打包体系
tags: [构建, 打包, typescript, electron, 墨台]
sources: [app/src/build.ts, app/src/pack.ts, app/tsconfig.json, app/tsconfig.webapp.json, app/tsconfig.verify.json, app/package.json, AGENTS.md]
updated: 2026-10-04
status: stable
---

# 构建与打包体系

> 一句话摘要：三套 tsconfig 把 app/src 的 TS 原位编译回迁移前的 JS 路径，build.ts 组装单文件渲染层，pack.ts 用本机 Electron 运行时产出便携 exe 并自检加冒烟。

## 是什么

四层工具链，全部是 `app/src/**` 下的 TS 源（编译出的 build.js / pack.js 是产物，改逻辑只改 TS）：

| 环节 | 源 | 做什么 |
|---|---|---|
| 编译 | `app/tsconfig.json`、`app/tsconfig.webapp.json`、`app/tsconfig.verify.json` | TS → JS，产物落回原路径 |
| 渲染层组装 | `app/src/build.ts`（296 行） | 把主脚本、Work 模块、桌面适配层拼成单文件 HTML |
| 打包 | `app/src/pack.ts`（271 行） | 复用本机 Electron 运行时产出 dist 便携目录 |
| 图标 | `app/src/make-icons.ts` | 由 logo 生成 app.ico 与托盘图，被 pack 第 2.5 步消费（`app/src/pack.ts:97-118`） |

## 三套编译配置：产物落位是设计核心

- 核心层 `app/tsconfig.json`：rootDir=src、outDir=. ——产物回到 app 根与 server/、shared/ 原位（`app/tsconfig.json:14-15`），module=commonjs 匹配 Electron 主进程与 preload 的加载方式（`app/tsconfig.json:12`），strict 全开（`app/tsconfig.json:16`），include/exclude 必须显式声明否则 outDir 被默认排除（`app/tsconfig.json:29-30`）。
- 前端层 `app/tsconfig.webapp.json`：outDir 是 app 的上级目录下的 01/（`app/tsconfig.webapp.json:16`），module=none 按无模块全局脚本编译（`app/tsconfig.webapp.json:14-15`），strict 关闭（`app/tsconfig.webapp.json:17`）；设计理由写在配置头部注释 `app/tsconfig.webapp.json:3-10`，产出的渲染层见 [前端渲染层](../entities/frontend-renderer.md)。
- verify 层 `app/tsconfig.verify.json`：覆盖 `src/verify/**/*.ts` 与技能包生成器（`app/tsconfig.verify.json:23-26`），宽松编译但保留 noEmitOnError（`app/tsconfig.verify.json:19`）。
- 三套共有 `noEmitOnError: true`（`app/tsconfig.json:21`、`app/tsconfig.webapp.json:20`、`app/tsconfig.verify.json:19`）：类型不过绝不出产物，这是「行为不变」承诺在工具链上的落实。
- 排除项决定谁不受 tsc 管辖：核心配置 exclude 掉了 src/webapp、src/verify 与 skills-plugin（`app/tsconfig.json:30`），所以这三块分别由另两套配置接管。

## build.ts：渲染层组装与自断言

- 输入输出固定：源模板是仓库根的 01/主页面.html，产物是 app/renderer/index.html（`app/src/build.ts:15-16`）；Work 模块目录与主脚本路径见 `app/src/build.ts:17-18`。
- 两个注入标记 WORK_MARK / MAIN_MARK（`app/src/build.ts:21-23`），组装前校验标记存在，源文件若已含桥接标记则判定「把产物当源文件」（`app/src/build.ts:245-248`）。
- Work 模块按两位数字前缀字典序拼接（`app/src/build.ts:180-185`），首个必须 00-core.js、末个必须 90-boot.js（`app/src/build.ts:202-203`），逐文件用子进程做语法校验（`app/src/build.ts:189-197`），最后合成单个 IIFE 共享顶层 const（`app/src/build.ts:212`）。
- i18n 键集合校验只 warn 不失败（`app/src/build.ts:220-242`）。
- 主脚本与 Work bundle 的注入必须用函数式替换，否则 KaTeX 配置里的 `$$` 会被字符串替换吞掉（`app/src/build.ts:257-260`）。
- 桥接层插在 </html> 之前，因为源文件可能没有 </body>（`app/src/build.ts:267-272`）。
- 产物断言是最后一道闸：标记不残留、恰含 1 个桥接标记、主脚本→work bundle→桥接的顺序、标题仍是 ChatScience，任一失败 process.exit(1) 阻止 start.bat 启动 Electron（`app/src/build.ts:275-290`）。

## pack.ts：零下载的便携打包

- 明确不用 electron-packager，直接复用本机 node_modules 里的 Electron 运行时（`app/src/pack.ts:1-16` 与 `app/src/pack.ts:88-89`），electron.exe 改名 ChatScience.exe 在 `app/src/pack.ts:90`，并删掉 default_app.asar 让运行时加载 resources/app（`app/src/pack.ts:91`）。
- 第 0 步先编译两套 TS（`app/src/pack.ts:55-64`），第 1 步跑 renderer 构建（`app/src/pack.ts:66-69`），两步失败即退出；被打包的桌面壳本体见 [Electron 壳](../entities/electron-shell.md)。
- `PACK_SKIP_HEAVY=1` 跳过运行时与 node_modules 的大体积复制，但应用源码总是重拷（`app/src/pack.ts:71-77`、`app/src/pack.ts:120-129`）；全量重打包前先把用户 data 目录挪出再挪回（`app/src/pack.ts:80-93`）。
- 产物排除构建工具链：electron / electron-packager / typescript / @types（`app/src/pack.ts:130-135`）。
- 第 2.5 步用 rcedit 写 PE 图标与 FileDescription，exe 被占用时先 taskkill 并等 1.2 秒释放文件锁，rcedit 失败即退出（`app/src/pack.ts:96-118`）。
- 生成 重新构建.bat 与 使用说明.txt 两份随包文件（`app/src/pack.ts:144-183`）。
- 自检两步：关键文件存在性清单（`app/src/pack.ts:186-211`）+ 在产物目录内 require SDK 与 express（`app/src/pack.ts:212-218`）。
- 启动冒烟：剥掉宿主泄漏的 ELECTRON_RUN_AS_NODE 后用 spawn+unref 拉起 exe，40 次×500ms 轮询 data/runtime.json 的 mtime（首启可能被杀软拖慢），随后 taskkill 清场（`app/src/pack.ts:220-246`）。

## 命令入口

`app/package.json:7-12` 六个脚本：typecheck（三套 --noEmit）、build:ts（三套编译）、verify、wiki:lint、guard:artifacts、start（build:ts 后起 electron）。逐条含义与执行目录见 [开发环境与命令约束](../concepts/dev-environment.md)，产物为何会漂移见 [构建产物同步纪律](../concepts/artifact-sync.md)。

⚠️ 冲突：`AGENTS.md:17` 说 renderer 产物「再经 node build.js 更新」，但 app/build.js 是产物、不能手改也不该直接改；正确入口是 `app/package.json:8` 的 build:ts 加 `app/src/build.ts` 的源 —— 纪律细节见 [构建产物同步纪律](../concepts/artifact-sync.md)。

## 关联

- 迁移史与取舍：[TypeScript 迁移说明](../sources/ts-migration.md)
- 源与产物的同步纪律：[构建产物同步纪律](../concepts/artifact-sync.md)
- 命令与环境：[开发环境与命令约束](../concepts/dev-environment.md)
- 验证脚本的编译归属：[验证套件](../entities/verification-suite.md)
