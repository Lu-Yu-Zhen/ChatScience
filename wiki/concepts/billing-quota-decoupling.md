---
type: concept
title: 算力与权限解耦
tags: [计费, 权限, BYOK, 沙箱策略, 概念]
sources: [app/src/server/policy.ts, app/src/server/ledger.ts, app/src/server/qoder.ts, app/src/server/ai.ts, 墨台实现策划案/_src/06-订阅预付费.md]
updated: 2026-10-06
status: draft
---

# 算力与权限解耦

> 本页记录"余额决定能不能跑、档位决定能用哪些功能"这条设计铁律，与代码里当前**真实存在**的三条独立判定通道（权限、工具可见集、资源护栏）之间的差距；商业额度那一半仍是纯设计。

**页 status 为 draft 的原因**：解耦的"权限侧"与"资源侧"在源码里可逐行核验；"额度侧"（积分账户、Token 计量、档位门禁）在源码里没有任何判定逻辑，只有设计意图，因此本页不写成 stable。

## 设计要什么

- 两条铁律：算力（积分 / Token 余额）与权限（会员档位）彻底解耦、互不占用 `墨台实现策划案/_src/06-订阅预付费.md:78`。
- 充值包只补算力、不带功能权益；会员到期后权益收回但余额仍可继续消耗 `墨台实现策划案/_src/06-订阅预付费.md:285` 与 `:294-296`。
- 落地手段是声明式权益表 + 统一门禁入口 + 服务端强制 `墨台实现策划案/_src/06-订阅预付费.md:325-363`。

## 代码里已经解耦的三条通道

**1. 权限通道（不看任何额度）**

- SDK 权限模式共五档 `app/src/server/qoder.ts:116`，生效优先级是"请求覆盖 > 智能体定义 > 全局配置 > default" `app/src/server/qoder.ts:1338-1343`。
- `canUseTool` 只做两类判定：Bash 命令文本静态扫描、Write/Edit 的路径是否在可写根内 `app/src/server/qoder.ts:611-651`；它的返回里没有余额、档位、配额任何一项。
- 拒绝与放行都留痕：拒绝进审计 `app/src/server/qoder.ts:618`，子智能体的放行同样记一条 gateway-allow `app/src/server/qoder.ts:643-646`，SDK 侧 PermissionDenied 事件另行落审计 `app/src/server/qoder.ts:704-709`。

**2. 能力可见集通道（档位将来挂在这里）**

- 白名单是四次交集：SDK 内建工具取交集 `app/src/server/qoder.ts:1160-1162`、科研工具按 `scienceTools` 子集筛选 `app/src/server/qoder.ts:1183-1186`、外部 MCP 按智能体白名单透传 `app/src/server/qoder.ts:1189-1201`、技能按启用状态与智能体声明取交集 `app/src/server/qoder.ts:1206-1210`。
- 结构上限独立于额度：子智能体工具清单一律剔除 Agent 防嵌套 `app/src/server/qoder.ts:88`，轮次钳制在 1—64 `app/src/server/qoder.ts:1344`。
- 插件覆写底座角色时越权项被显式拒绝并回报，不做静默降级 `app/src/server/qoder.ts:1306-1315`——这正是"权限判定要有可观测出口"的现成范式。

**3. 资源护栏通道（现在被误当成"额度"的东西）**

- 沙箱策略十项默认值 `app/src/server/policy.ts:20-31`，`mergePolicy` 对超时 / 输出 / 并发 / 文件大小做上下限钳制 `app/src/server/policy.ts:174-177`。
- 执行期靠超时强杀 + 并发信号量 + 线程数收敛兜住，且明确声明无法测内存峰值 `app/src/server/sandbox.ts:15` 与 `:60-69`。
- 其余"额度"全是体积与条数护栏：检索 topK 钳制 `app/src/server/kb.ts:133`、索引文本 2MB `app/src/server/routes.ts:423`、台账读取 1—2000 `app/src/server/ledger.ts:89`、审计读取上限 1000 `app/src/server/audit.ts:59`、运行历史只留 20 条 `app/src/server/routes.ts:445`。

## 计算通道上的"钱"其实只有一处可核验

- Work 与自检一律走用户自有 API Key 的 BYOK 模型，取不到就致命报错，注释写明"绝不回落平台订阅档位（credits 通道）" `app/src/server/qoder.ts:1318-1327`，连通性自检同样 BYOK `app/src/server/qoder.ts:1510-1516`。
- 一条实测教训改变了架构：设置 resolveModel 回调会把会话打回平台额度通道（即使恒返回 BYOK 模型 id 也报 credit usage limit），因此该回调被刻意不设 `app/src/server/qoder.ts:1363-1366`。
- Chat 侧唯一与计费桶有关的是厂商路由选择：订阅型 Key 必须打 plan 专用 base_url，误用按量付费端点会被打进计费桶并返回 402 `app/src/server/ai.ts:17-19`。

## 未核验 / 待建

积分账户、Token 计量、每日签到、档位门禁、按日用量看板在源码里都没有对应实现（证据见 [账本与计费](../entities/ledger-billing.md) 的"计量与额度（未实现）"小节 `app/src/shared/domain.ts:415-428`）。策划案建议的分区与端点清单 `墨台实现策划案/_src/06-订阅预付费.md:378-428` 属设计，本页不视为事实。

## 关联

- 实体：[账本与计费](../entities/ledger-billing.md)、[后端服务](../entities/backend-server.md)
- 资料：[03-后端板块实现策划案](../sources/plan-03-backend.md)
- 产品：[墨台产品](../entities/motai-product.md)
