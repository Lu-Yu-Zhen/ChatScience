---
type: concept
title: BYOK 认证与额度打回
tags: [byok, 认证, 模型路由, credits, agent]
sources: [app/src/server/qoder.ts, app/src/shared/qoder-sdk.ts, app/src/shared/domain.ts, app/verify/byok-diag.js, app/verify/byok-bisect.js, app/verify/byok-experiment.js, app/verify/byok-run-check.js]
updated: 2026-10-06
status: draft
---

# BYOK 认证与额度打回

> 一句话摘要：Work 模式的模型调用只走用户自带 Key（BYOK）注册的模型 id，平台订阅档位路由已被移除；「设置 `resolveModel` 回调反而把会话打回 credits 通道」是本页最贵的实测结论（尚未复现，故 status: draft）。

## 规则（源码可核）

- **BYOK-only 语义**成文在实现注释里：`options.model` 直接填用户已注册的 BYOK 模型 id，凭据由 Qoder 服务端持有，模型调用不消耗平台 credits `app/src/server/qoder.ts:713-728`。
- 平台订阅档位路由（auto/ultimate/performance/efficient/lite）**彻底移除**，`resolveModel` 的唯一职责变成「锁定」——把所有 purpose 的模型请求压回绑定的 BYOK 模型 `app/src/server/qoder.ts:725-728`。
- 装配时 `auth` 用 accessToken 构造 `app/src/server/qoder.ts:1330`，与 `model` 分开：应用侧身份与模型侧凭据是两件事 `app/src/shared/domain.ts:503-518`。
- 拿不到可用 BYOK 模型即**明确失败**，绝不回落平台额度：`app/src/server/qoder.ts:1318-1327`；连通性自检 `ping()` 同样走 BYOK `:1509-1516`。
- 缓存为空时 `resolveByokModelId` 返回 `null` 而非兜底档位 `app/src/server/qoder.ts:1016-1017`。

## 额度打回（credits 拒绝）的两条实测结论

1. **per-call CustomModel 注入不可用**：`resolveModel` 返回 `{provider, api_key}` 会被服务端拒绝，报错文案记为 `Failed to generate custom pool` / `access token rejected` `app/src/server/qoder.ts:716-718`。
2. **设置 `resolveModel` 回调本身会把会话打回平台额度通道**，即使回调恒返回 BYOK 模型 id 也报 credit usage limit；不设置时全 purpose（含子智能体 inherit、压缩、工具调用）都跟随 `options.model` 的 BYOK 直连 `app/src/server/qoder.ts:1363-1366`。
- ⚠️ 冲突：因此 `makeModelResolver` 虽已导出并配单测 `app/src/verify/agent-system-verify.ts:187-196`，生产路径**并不注入**它，两者的取舍理由见 [墨道运行时](../entities/agent-runtime.md)。
- 探针脚本可直调（手写 JS，无同名 `.ts`）：`app/verify/byok-diag.js:30-35` 列 `listByokConfigs()` 并调 `validateByokModel`；`app/verify/byok-experiment.js:1`、`:17` 验证 push 模式（`options.model` = BYOK id）；`app/verify/byok-bisect.js:1`、`:19-36` 是二分定位器，变体 A 加 `resolveModel` + `resolveModelTimeoutMs`、B 加 preset 系统提示词、C 加 `includePartialMessages`、D 加 `permissionMode`、E 加工具白名单。
- 端到端断言在 `app/verify/byok-run-check.js:1`、`:24`：`run_start.model` 必须是 BYOK 模型 id 而非档位名。
- 静态旁证：`app/verify/agent-system-metrics.json:117-127` 记录 V7a/V7b 通过（main 与 task/compact/utility 同模型）。

## BYOK 清单怎么来

- 启动后异步刷新一次：probe 会话用 `model:'lite'` **仅为控制面引导**（清单就绪前无模型可用），`system/init` 一到就取 `listByokConfigs()` 并立即 break，不产生业务模型调用 `app/src/server/qoder.ts:954-983`、`:984-1000`。
- 字段归一为 `key/provider/model/displayName/contextWindow/maxInputTokens` `app/src/server/qoder.ts:987-996`，形状定义 `app/src/shared/domain.ts:509-518`。
- **踩坑**：probe 的 `cwd` 必须真实存在——SDK worker 启动即 stat cwd，缺失直接退出码 1，曾导致清单永远为空、Work 全模式不可用；现用 `ensureScope` 幂等建目录再兜底 mkdir `app/src/server/qoder.ts:966-975`。
- 刷新失败只记日志并下次重试 `app/src/server/qoder.ts:1001`；就绪等待 bootstrap 8s、回合内 25s `:1007-1011`、`:1321`。
- 模型窗口记在注释里（各模型 `max_input_tokens` 与可配 contextWindow 档位）`app/src/server/qoder.ts:721-723`——**本页不复核这些数值**，它们随注册配置变化。
- 模型匹配：先精确（`model` 或 `key`），再模糊（`normalizeModelBase` 剥 `-tp/-cp/-pg` 与日期后缀），都不中就退回清单第一个 `app/src/server/qoder.ts:1013-1025`、`:729-731`。

## 安全口径

- 应用侧 token 与 BYOK 凭据的原文**不得进任何 Wiki 页**：`app/src/tools/wiki-lint.ts:99-106` 的 SECRET 规则会机械拦截，且凭据文件本身在禁引清单内 `wiki/SCHEMA.md` §二。
- 前端只读清单不含凭据 `app/src/shared/domain.ts:509-518`，配置读取只回 `hasToken` 布尔 `app/src/server/qoder.ts:1626`。

## 未核验点（本页保持 draft 的原因）

- 四个 `app/verify/byok-*.js` 都指向**已打包的运行时目录**并需真实凭据，本次未执行，因此上文两条 credits 结论是「源码注释 + 脚本设计」的记录，不是本轮复现结果 `app/verify/byok-bisect.js:1`。
- 服务端拒绝文案的原文未二次核对 `app/src/server/qoder.ts:716-718`。

## 关联

- 实体：[墨道运行时](../entities/agent-runtime.md)、[子智能体体系](../entities/subagent-system.md)
- 概念：[智能体可观测性](agent-observability.md)
- 资料：[04-Agent系统设计实现策划案](../sources/plan-04-agent.md)
