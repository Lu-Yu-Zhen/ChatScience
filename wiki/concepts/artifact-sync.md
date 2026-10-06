---
type: concept
title: 构建产物同步纪律
tags: [构建产物, 同步, typescript, 工程约束]
sources: [AGENTS.md, app/tsconfig.json, app/tsconfig.webapp.json, app/tsconfig.verify.json, app/package.json, .gitattributes]
updated: 2026-10-06
status: stable
---

# 构建产物同步纪律

> 一句话摘要：app/src 是唯一手写源，JS 产物由三套 tsconfig 原位编译而来；改完源必须跑 build:ts，否则产物滞后，任何写在产物上的行号与改动都会在下次构建时被覆盖。

## 哪张源对应哪个产物

| 源 | 编译配置 | 产物落位 |
|---|---|---|
| `app/src/main.ts`、`src/preload.ts`（桌面壳，见 [Electron 壳](../entities/electron-shell.md)）、`src/server/**`（除 skills-plugin）、`src/shared/**`、`src/build.ts`、`src/pack.ts`、`src/make-icons.ts`、`src/tools/**` | `app/tsconfig.json`（rootDir=src → outDir=. ，`app/tsconfig.json:14-15`） | app 根与 server/、shared/、tools/ 下同名 .js |
| `app/src/webapp/**`（主脚本 + `src/webapp/work/` 14 个模块，见 [前端渲染层](../entities/frontend-renderer.md) 与 [Work 模块](../entities/work-modules.md)） | `app/tsconfig.webapp.json`（outDir 指向上一级的 01/，`app/tsconfig.webapp.json:16`） | 01/ 下的 webapp.js 与 work/*.js |
| `app/src/verify/**` 与技能包生成器 | `app/tsconfig.verify.json`（include `app/tsconfig.verify.json:23-26`，outDir=. ，`app/tsconfig.verify.json:13`） | app/verify 下同名 .js |
| `app/src/build.ts` 的组装步骤 | 不经 tsc，跑构建脚本 | app/renderer 下的 index.html（源模板是 01/主页面.html，`app/src/build.ts:15-16`） |
| `app/src/pack.ts` | 同上 | dist 便携目录（`app/src/pack.ts:45-95`） |

- 三条总则来自 `AGENTS.md:7-12`：唯一手写源码是 app/src；01 下的 js 与 app 下带同名 .ts 的 js 都是产物；01/主页面.html 是构建输入而非产物，可手改。
- 例外是真手写 JS：app/verify 下 18 个、以及插件的 mcp-mini.js，`AGENTS.md:10` 记录了规则，计数请按 [验证套件](../entities/verification-suite.md) 的运行时判定结果。

## 为什么会漂移

- 传播是**手动**的：typecheck 只 --noEmit 不落盘（`app/package.json:7`），必须 build:ts 才写产物（`app/package.json:8`）；npm start 会先编译再起应用（`app/package.json:12`），但只跑 `node` 单文件脚本的路径不会。
- 三套配置互斥地分走文件：核心配置显式排除 webapp、verify 与 skills-plugin（`app/tsconfig.json:30`），只跑其中一套只会更新一部分产物。
- noEmitOnError 让漂移「合法存在」：类型不过就完全不出产物（`app/tsconfig.json:21`、`app/tsconfig.webapp.json:20`、`app/tsconfig.verify.json:19`），于是源改坏了时盘上留下的仍是旧产物，看起来"没生效"。
- 手写 JS 不受管辖：改它们不经过 tsc，也就不会被 build:ts 覆盖（`AGENTS.md:10`），两边改动混在同一个目录里。
- 打包产物里的 app 资源是编译后的明文 JS，改包内等于改产物（`app/src/pack.ts:120-129`、`app/src/pack.ts:172-173`）。
- 换行也会造成假漂移：仓库的 LF 契约只约束 wiki 下的 markdown（`.gitattributes:1-4`），JS 产物没有 text/eol 属性，而本机 git 是 autocrlf 状态，diff 这些产物时会出现「LF will be replaced by CRLF」警告，把内容与换行混在同一份差异里。

## 怎么检查

- 一条命令：`npm run guard:artifacts`（`app/package.json:11`）＝ build:ts 之后用 `git diff --exit-code` 比对 01 目录、app 下所有 js 与 renderer 入口；退出码非零即表示「产物与最后一次提交不一致」。
- 这条命令是比对**提交**而非比对 src，所以任何未提交的源改动都会让它报错；它的正确用法是：先提交源、再跑 guard，确认产物已随源一起更新。
- 判定某个 .js 是不是产物，看同名 .ts 是否存在即可，`app/src/verify/verify-suite.ts:86-89` 与 `app/src/tools/wiki-lint.ts:268-277` 都用这条规则做运行时判定。
- 交付前的固定顺序在报告里有实录：typecheck → build:ts → renderer 构建 → 全量重打包（`app/verify/全功能验证报告.md:147`）。
- Wiki 侧的连带纪律：页面证据只能指 `app/src/**` 或真手写 JS，指产物会被 wiki-lint 判 EVID-PRODUCT（`app/src/tools/wiki-lint.ts:450-452`）。

## 产物新鲜度的现场判据

"产物看着是新的"不等于新。验收打包版前先证明产物里有本轮的改动，最省事的办法是拿一个**只有本轮才存在的新符号名**（例如 `app/src/server/qoder.ts:100` 的 eventArtifacts）分别在 dist 便携包内的 server 编译产物与 app/ 目录下的同名产物里计数：dist 侧为 0、app/ 侧非 0，就说明自己跑的是旧包（真实事故：pack.js 内部 tsc 因 `01/work/*.js` 瞬时文件锁失败并以退出码 1 结束，但重试循环只 sleep 不回显，于是从旧包做了验收，17 项里报出 2 项假失败，教训见 `app/verify/全功能验证报告.md:257-259`）。

由此得两条纪律：打包重试必须回显每次失败原因；界面类验收前先用新符号确认 dist 是最新的，再谈通过与否。

## 关联

- 三套配置与打包细节：[构建与打包体系](../entities/build-pack-system.md)
- 验证脚本的编译归属：[验证套件](../entities/verification-suite.md)
- 命令与环境坑：[开发环境与命令约束](../concepts/dev-environment.md)
- 踩坑归档：[踩坑实录](../concepts/pitfalls-log.md)
- 迁移当时的落位策略：[TypeScript 迁移说明](../sources/ts-migration.md)
