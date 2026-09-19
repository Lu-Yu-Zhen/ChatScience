---
type: concept
title: BYOK 认证机制（自带 Key 直连）
tags: [BYOK, 模型路由, resolveModel, options.model, credits, 踩坑]
sources: [墨台实现策划案/_src/04-Agent系统设计.md, app/src/server/qoder.ts, app/verify/byok-experiment.js]
updated: 2026-09-18
---

# BYOK 认证机制（自带 Key 直连）

BYOK = Bring Your Own Key：Work 模式所有模型调用走用户自有 API Key 模型，不消耗 Qoder 平台订阅额度（credits）。2026-09-15 定案为 **BYOK-only**——平台订阅档位路由（auto/ultimate/performance/efficient/lite）彻底移除。

## 正确用法

- **`options.model` 直填已注册 BYOK 模型 id**（如 `qwen3.8-flash-pg`）。凭据由 Qoder 服务端持有，客户端无需管理 Key 明文。实测真实响应成功（`app/verify/byok-experiment.js`）。
- 已注册清单经 `q.listByokConfigs()` 查询：启动后异步刷新一次并缓存（`byokCache`）；probe 会话用平台档位 `lite` 仅为控制面引导，init 拿到清单后立即中断，不产生业务调用。
- bootstrap 把 BYOK 清单暴露给前端，[墨道](../entities/墨道.md) 管理页据此列出可绑定模型；`agent.modelKey` 精确/模糊匹配（`normalizeModelBase` 剥掉 `-tp/-cp/-pg` 后缀与日期尾缀），未绑定或 `'byok'` → 清单第一个。
- 清单为空 → 明确报错「未检测到已注册的 API Key 模型，请在 Qoder 客户端设置 → 模型配置 BYOK 后重启」，**绝不回落平台档位**。

## 禁令与实测教训 ⚠️

1. **禁止设置 `resolveModel` 回调**。实测（2026-09-15 二分实验）：只要设置该回调，会话即被打回平台额度通道——**即使回调恒返回 BYOK 模型 id 也报 credit usage limit**。不设置时全 purpose（main/subagent/compact/utility，含子智能体 inherit）均跟随 `options.model` 的 BYOK 直连模型。
2. **per-call CustomModel 注入不可用**：`resolveModel` 返回 `{provider, model, api_key}` 凭据对象会被服务端拒绝（`Failed to generate custom pool` / `access token rejected`）。这与策划案 14.7 官方文档描述（"回调可返回 BYOK 凭据对象路由到第三方"）相悖——**官方文档能力在当前服务端不可用**。
3. 动态选择模式无自动回退：回调超时/抛错/返回空即整次查询失败——即使将来解禁 resolveModel，也必须 try/catch 兜底非空模型。
4. 04 策划案 B1「resolveModel 按智能体路由」原为待实现规划，实际以"禁令 + options.model 直连"落地，规划作废。

## Provider 目录与模型窗口

- 运行时可获取 BYOK provider 目录与各模型 `max_input_tokens`（qwen3.8 系 1M、glm5.1 202K、kimi-k2.7-code 256K 等）；已注册配置 contextWindow 可配 200K/400K/1M。
- 会话鉴权本身用 PAT（`server/qoder.json` 的 accessToken）——**PAT 等同账户身份，需严格保管**，不得写入日志。

## 两套模型链路（历史背景）

Chat 走厂商模型体系（8 家 Provider，用户可配 Key），Work 原走 SDK 平台五档——现 Work 已 BYOK-only。`makeModelResolver()`（锁定用途）仍导出仅供验证脚本，生产路径不调用。

## 关联
- 实体：[墨道](../entities/墨道.md)、[墨析](../entities/墨析.md)、[计费体系](../entities/计费体系.md)
- 概念：[agent-委派模式](agent-委派模式.md)（子智能体 model:'inherit' 依赖本机制）
- 资料：[Agent 系统设计策划案摘要](../sources/agent-system-design.md)（§14.6 认证、§14.7 模型策略）
</content>
