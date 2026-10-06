---
type: source
title: TypeScript 迁移说明
tags: [迁移, typescript, 构建, 工程约束]
sources: [app/TypeScript迁移说明.md, app/tsconfig.json, app/package.json, app/start.bat]
updated: 2026-10-06
status: stable
---

# TypeScript 迁移说明

> 一句话摘要：这份 Raw 记录了 2026-09-13 把 19 个源文件改写为 TypeScript 的取舍、编译配置与踩坑，核心承诺是「产物落回原路径、对外行为不变」。

## 资料是什么

- 单文件迁移史文档，位于 `app/TypeScript迁移说明.md`（188 行），迁移日期与原则写在开头 `app/TypeScript迁移说明.md:3-5`：功能与对外行为不变，所有 HTTP 路由、SSE 事件、文件布局、启动链路与打包产物结构均保持原样。
- 依据是 Qoder Agent SDK 官方 TypeScript 参考页，见 `app/TypeScript迁移说明.md:4`。
- 文末记录基线提交 `app/TypeScript迁移说明.md:188`（迁移前基线 `a31f729`）。

## 改写范围（§一）

- 已迁移 19 个源文件到 `app/src/`，逐层列表见 `app/TypeScript迁移说明.md:11-27`（共享类型、SDK 接入、Electron 壳、后端 12 个模块、构建工具三个）；壳与后端各自的现状见 [Electron 壳](../entities/electron-shell.md) 与 [后端服务](../entities/backend-server.md)。
- 产物落位策略：rootDir=src、outDir=. —— 编译产物回到迁移前的确切路径，因此 Electron 入口、build 注入路径、pack 复制清单、verify 脚本、start.bat 调用路径全部无需改动，见 `app/TypeScript迁移说明.md:29-32`。
- 有意保持 JavaScript 的部分（非遗漏）：前端拼接模型、verify 脚本、调试辅助脚本、两份运行时配置，理由逐条见 `app/TypeScript迁移说明.md:36-41`。
- 配置与脚本变更清单（package.json 依赖与 scripts、start.bat 增加 tsc、pack 增加编译步骤、.gitignore）见 `app/TypeScript迁移说明.md:45-51`。

## 类型与编译配置（§二 §三）

- 类型策略四条：SDK 类型以官方包 d.ts 为准并统一经 `app/src/shared/qoder-sdk.ts` 重导出；模块值类型用 `typeof import(...)` 获取；业务域类型集中在 `app/src/shared/domain.ts`；strict 全开，见 `app/TypeScript迁移说明.md:57-73`。
- tsconfig 逐项注释见 `app/TypeScript迁移说明.md:77-95`，与实际配置文件一致：`app/tsconfig.json:14-16`（rootDir/outDir/strict）、`app/tsconfig.json:21`（noEmitOnError）、`app/tsconfig.json:29-30`（include 与显式 exclude）。
- ⚠️ 冲突：文档 §三 只讲一份 tsconfig，实际仓库现在是三套（核心 / 前端 / verify），文档撰写时前端尚未 TS 化；见 `app/tsconfig.webapp.json:15-16` 与 `app/tsconfig.verify.json:12-13`，取舍细节在 [构建与打包体系](../entities/build-pack-system.md)。
- 文档 §1.2 记的「13 个 work 模块」「主脚本 38 万字符」是当时快照 `app/TypeScript迁移说明.md:38`；现在前端已 TS 化，源码是 `app/src/webapp/webapp.ts`（7275 行）与 14 个 `app/src/webapp/work/` 模块。

## 构建与运行链路（§四 §五）

- 开发链路与打包链路的原文顺序见 `app/TypeScript迁移说明.md:97-113`；便携包内 `resources/app/` 是编译后的明文 JS，「重新构建.bat」只跑 build.js，包内无需 TS 工具链（`app/TypeScript迁移说明.md:111-112`，实际脚本由 `app/src/pack.ts:144-158` 生成）。
- 六条踩坑（§五）是本页最有复用价值的部分：动态 import 被 tsc 改写成 require、`outDir: "."` 与默认 exclude 触发 TS18003、zod 需显式声明、SDK 消息类型最小断言、noEmitOnError 落实行为不变、@types/node 20 的 Buffer 泛型，见 `app/TypeScript迁移说明.md:117-143`；逐条已核实的事实归档在 [踩坑实录](../concepts/pitfalls-log.md)。
- 其中最重要的一条是 SDK 纯 ESM 与 Electron 33 内置 Node 20 无 `require(esm)` 的冲突，解法用 Function 间接层保留真实 `import()`：`app/TypeScript迁移说明.md:117-127`。

## 验证与遗留（§六 §七 §八）

- 行为保持验证表：tsc 零错误、编译产物语法全过、renderer 产物新旧 SHA256 一致（510,972 bytes）、21 项行为冒烟 ALL PASS，见 `app/TypeScript迁移说明.md:147-153`；未覆盖项（/api/chat、agent/run、pack 全流程）见 `app/TypeScript迁移说明.md:161`。
- §七 记录三条迁移中发现但按「行为不变」原则未修的历史问题：Chat 深度思考开关未注入上游、`runtimes?force=1` 被忽略、沙箱错误文案缺右括号，见 `app/TypeScript迁移说明.md:165-174`。
- §八 后续建议（前端二期 TS 化、修 §七 两处、跑完整 pack）见 `app/TypeScript迁移说明.md:178-184`；其中前两条已落地——`app/tsconfig.webapp.json` 与 `app/package.json:7-8` 的 typecheck/build:ts 现已包含前端与 verify 两套配置。

## 关联

- 产物落位与三套编译配置：[构建与打包体系](../entities/build-pack-system.md)
- 源与产物的同步纪律：[构建产物同步纪律](../concepts/artifact-sync.md)
- 命令入口与执行目录：[开发环境与命令约束](../concepts/dev-environment.md)
- 验证脚本为何保持 JS：[验证套件](../entities/verification-suite.md)
- 结论归档：[验证报告簇](verify-reports.md)
