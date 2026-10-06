---
type: source
title: 03-后端板块实现策划案
tags: [策划案, server, 后端, 沙箱, 持久化]
sources: [墨台实现策划案/_src/03-后端.md, app/src/server/]
updated: 2026-10-06
status: stable
---

# 03-后端板块实现策划案

> 这份策划案把本地后端层按「已实现 / 部分实现 / 待实现」三档盘了一遍，并在末章给出可施工的补齐清单；本页提炼它的论证结构与逐条核对源码后的出入。

## 资料是什么

- 范围是本地后端全层：进程与启动、HTTP API 面、数据持久化、AI 上游、知识库检索、安全与沙箱、打包分发、验证体系、日志运维 `墨台实现策划案/_src/03-后端.md:7`。
- 全篇的方法论只有一条硬规则：策划案与已实现内容冲突时**一律以已实现为准** `墨台实现策划案/_src/03-后端.md:11`，并用一张七项裁定表把它执行掉 `墨台实现策划案/_src/03-后端.md:13-22`。
- 三个状态标记贯穿全文：【已实现】/【部分实现】/【待实现】 `墨台实现策划案/_src/03-后端.md:26`。

## 核心裁定（本文档最有价值的部分）

| 策划案原设想 | 裁定后的事实基准 |
|---|---|
| SQLite 存元数据与消息 | JSON 双文件（state.json / work.json），无 SQLite `墨台实现策划案/_src/03-后端.md:16` |
| 文档向量化 + 语义检索 | BM25 词法检索，向量检索列为待实现 `墨台实现策划案/_src/03-后端.md:18` |
| 7 个服务模块 | 按域拆分的 Express 路由 + 服务模块 `墨台实现策划案/_src/03-后端.md:17` |
| 计费与权限服务、团队服务、云同步 | 零实现，全部推到待实现 `墨台实现策划案/_src/03-后端.md:19-21` |

## 论证线（不按目录抄）

1. **先划进程边界再谈 API**：双进程图 + 启动链路表把「谁绑端口、谁发 token、谁写 runtime.json」定死 `墨台实现策划案/_src/03-后端.md:32-66`，随后才列端点全景 `墨台实现策划案/_src/03-后端.md:79-126`。
2. **存储用「物理隔离」讲一个原则**：state.json 与 work.json 分区是「双模式分离、故障互不影响」在存储层的落地 `墨台实现策划案/_src/03-后端.md:164`，写入机制统一为 tmp+rename 原子写 `墨台实现策划案/_src/03-后端.md:170`。
3. **安全章不按「有多强」排序，而按强制力排序**：九层防御逐层标注强 / 较强 / 弱 / 可绕过 `墨台实现策划案/_src/03-后端.md:325-337`，并点明唯一不可绕过层是 `shell:false` + argv 数组 `墨台实现策划案/_src/03-后端.md:332`。
4. **单独一章「能力边界如实声明」**：把拦截可绕过、无进程级资源上限、断网不可强制、BM25 非语义等都写成对外文档要保留的内容 `墨台实现策划案/_src/03-后端.md:388-401`。
5. **指标带归因**：TTFT 16,216 ms 明确归给上游在 17.2 万字符上下文下的真实时延，而非本地链路 `墨台实现策划案/_src/03-后端.md:245` 与 `:253`。
6. **事故记录写成可复用经验**：打包版 server 起不来 → 纯 ESM SDK 在 Electron 内置 Node 20 触发 ERR_REQUIRE_ESM `墨台实现策划案/_src/03-后端.md:455-463`，解法是 Function 间接层保住真实 `import()` `墨台实现策划案/_src/03-后端.md:467-472`。
7. **收尾是施工清单**：A–F 六组，每组写「改哪个面、怎么验收」，并规定新增端点必须先有契约测试 `墨台实现策划案/_src/03-后端.md:621-632` 与 `:699`。

## 与当前源码核对后的出入

⚠️ 冲突：进程模型。策划案写后端由主进程 fork 为独立子进程 `墨台实现策划案/_src/03-后端.md:41` 与 `:57`，实际是主进程内 `require('./server/index').startServer(...)` 同进程启动 `app/src/main.ts:272`，详见 [后端服务](../entities/backend-server.md)。

⚠️ 冲突：端点规模。策划案写「约 34—40 个端点（核心 6 + Work 33）」`墨台实现策划案/_src/03-后端.md:81` 与 `:604`，实际 Work 路由 53 条 + 核心 6 条，缺登记的是 bootstrap、记忆、子智能体、插件、偏好、用户级数据等 20 条 `app/src/server/routes.ts:361-514`，详见 [后端服务](../entities/backend-server.md)。

⚠️ 冲突：上游厂商数。策划案写 8 家 `墨台实现策划案/_src/03-后端.md:230`，实际 `PROVIDER_URLS` 为 9 家（多出阶跃星辰订阅路由）`app/src/server/ai.ts:8-20`，通道细节见 [后端服务](../entities/backend-server.md)。

⚠️ 冲突：SSE 收尾事件名。策划案写 `run_end` / `aborted` `墨台实现策划案/_src/03-后端.md:132`，类型面确有 `run_end` `app/src/shared/domain.ts:488`，但路由层另外下发的整回合结果帧名为 `run_result` `app/src/server/routes.ts:205`，该名字不在事件映射表内，链路描述见 [后端服务](../entities/backend-server.md)。

策划案自陈的两处缺陷仍在源码中：`?force=1` 被包装函数吞掉 `墨台实现策划案/_src/03-后端.md:417` ↔ `app/src/server/sandbox.ts:537-539`；错误文案运算符优先级致缺右括号 `墨台实现策划案/_src/03-后端.md:418` ↔ `app/src/server/sandbox.ts:176`。深度思考开关不生效同理仍然成立 `墨台实现策划案/_src/03-后端.md:263` ↔ `app/src/server/ai.ts:108-121`。

已核对且一致的项：端口候选 6 个 `墨台实现策划案/_src/03-后端.md:58` ↔ `app/src/main.ts:16`；24 字节随机 token 与 401 判定 `墨台实现策划案/_src/03-后端.md:60-61` ↔ `app/src/main.ts:17` 与 `app/src/server/index.ts:61-65`；BM25 参数与分块常量 `墨台实现策划案/_src/03-后端.md:273-275` ↔ `app/src/server/kb.ts:16-17`；危险模式 16 类 `墨台实现策划案/_src/03-后端.md:354` ↔ `app/src/server/policy.ts:102-119`；环形采集 head 60% + tail 40% `墨台实现策划案/_src/03-后端.md:369` ↔ `app/src/server/sandbox.ts:95-96`；快照大字段剥离 `墨台实现策划案/_src/03-后端.md:174` ↔ `app/src/build.ts:107-113`。

## 关联

- 实体：[后端服务](../entities/backend-server.md)、[记忆与知识库](../entities/memory-knowledge.md)、[账本与计费](../entities/ledger-billing.md)
- 概念：[算力与权限解耦](../concepts/billing-quota-decoupling.md)、[MCP 凭据带外化](../concepts/mcp-credentials.md)
- 产品：[墨台产品](../entities/motai-product.md)
- 构建与打包侧的 SDK 惰性加载事故落地页：[构建与打包体系](../entities/build-pack-system.md)
