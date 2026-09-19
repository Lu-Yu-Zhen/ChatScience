---
type: source
title: TypeScript 迁移说明（摘要）
tags: [TypeScript, 迁移, 构建, 行为不变, 已知问题]
sources: [app/TypeScript迁移说明.md]
updated: 2026-09-18
---

# TypeScript 迁移说明（摘要）

2026-09-13 完成的 JS→TS 迁移记录：19 个源文件迁入 `app/src/`，产物落回原路径实现下游零改动，以 renderer/index.html SHA256 一致 + 21 项冒烟验证"行为不变"承诺，并如实记录迁移中发现但未修改的三处历史缺陷。

## 关键结论

1. **迁移范围**：`shared/domain.ts`（全项目业务类型集中地）+ `shared/qoder-sdk.ts`（官方类型重导出 + `loadSdk()` 动态加载器）+ Electron 壳（main/preload）+ 后端 12 模块 + 构建工具（build/pack/make-icons），共 19 文件。
2. **产物落位策略**：`rootDir=src、outDir=.` —— 编译产物回到迁移前 exact 路径（main.js / server/*.js / build.js / pack.js），故 Electron 入口、pack 复制清单、verify 脚本、start.bat **全部无需改动**。
3. **有意保持 JS**（非遗漏）：`01/` 前端（单文件内联 IIFE 模型，转 TS 需先模块化，属独立改造）、`verify/*.js`（迁移的行为安全网，同步改写会削弱验证能力）、`_cdp_eval.js`、config/qoder.json（运行时配置）。
4. **类型策略**：SDK 类型以官方包 d.ts 为准、业务不直接 import SDK；strict 全开无隐式 any；边界输入统一 `Record<string, any>` 收口。
5. **踩坑六条（第五节）**：① tsc 在 CJS 输出中把一切 `import()`（含变量指示符）改写回 `require()`，重新引入 `ERR_REQUIRE_ESM`——解法 Function 间接层 `new Function('s','return import(s);')`；② `outDir="."` 必须显式 `exclude`，否则 TS18003；③ zod 从 SDK peer 提升为显式 dependencies；④ SDK 消息类型用最小形状断言收窄；⑤ `noEmitOnError:true` 落实"编译失败绝不覆盖可用产物"；⑥ @types/node 20 的 `Buffer<ArrayBuffer>` 泛型。
6. **验证全绿**：tsc 0 错误、产物 node --check ×19、renderer SHA256 一致（510,972 bytes）、`ts-migration-smoke.js` 21 项 ALL PASS（鉴权/bootstrap/技能/qoder config/笔记/知识库/沙箱真实执行/危险拦截）。

## 第七节：有意保留的已知问题（行为不变原则，未修改仅记录）

| # | 问题 | 根因 | 修复成本 |
|---|---|---|---|
| 1 | **Chat 深度思考开关实际无效** | `applyThinking` 写入 `chatOpts`，但 `chatStream` 组装上游请求体时不读取这些字段——注入从未到达上游 | 在 `chatStream` 内把 `opts.thinking / enable_thinking / reasoning` 复制进 `body` 即可 |
| 2 | **`/api/work/sandbox/runtimes?force=1` 不生效** | `detectRuntimes` 包装函数一直忽略参数（走 TTL 缓存），迁移按原行为保留、源码有注释标记 | 包装改为透传 `force` 一行 |
| 3 | **沙箱"运行时未安装"错误文案缺右括号** | `+ join(...) || '无' + '）'` 运算符优先级导致 `||` 分支永不生效且丢失闭合括号 | 修正表达式优先级（提示性文案，不影响功能） |

⚠️ 这三处与 [backend-策划案](backend-策划案.md) 7.8/5.3 节记载一致，两处资料互相印证；修复在 backend 策划案阶段一 P0 任务清单中（#1/#2/#3）。

## 关联
- 实体：[后端服务](../entities/后端服务.md)、[构建打包体系](../entities/构建打包体系.md)
- 概念：[验证体系](../concepts/验证体系.md)、[沙箱机制](../concepts/沙箱机制.md)（force 参数与错误文案问题所在）
- 资料：[backend-策划案](backend-策划案.md)（同一批缺陷的策划案视角 + 修复优先级）