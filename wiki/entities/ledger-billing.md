---
type: entity
title: 账本与计费
tags: [ledger, 计费, 订阅, server, 墨台]
sources: [app/src/server/ledger.ts, app/src/server/policy.ts, app/src/server/audit.ts, app/src/shared/domain.ts, 墨台实现策划案/_src/06-订阅预付费.md]
updated: 2026-10-06
status: disputed
---

# 账本与计费

> 本页先把两个同名"账本"拆开：代码里的 ledger 是科研证据链台账，与商业化计费无关；计费体系只有设计、没有任何实现，因此缺口全部列明。

## 名字撞车（读源码前必须知道）

- `ledger.ts` 记的是"做了什么 / 声称了什么 / 产物在哪" `app/src/server/ledger.ts:1-10`，落盘位置是 `data/projects/<projectId>/ledger/entries.jsonl`，与积分、Token、账单无任何关系。
- `policy.ts` 是沙箱执行策略（超时、并发、输出上限、路径守卫、危险模式）`app/src/server/policy.ts:1-31`，不是权益策略；策划案里说的 Feature Flag 门禁在此文件里没有对应物。
- 真正接近"计费流水"的是审计日志 `data/work-audit.jsonl`：每条含时间、工具全名、参数摘要、结果状态、耗时、发起方 `app/src/server/audit.ts:12-24`，写入是旁路、失败不阻断会话 `app/src/server/audit.ts:48-53`。

## 代码里实际有什么

**证据链台账（已实现）**

- 两类条目：`action` 由工具结束事件自动记录，`claim` 由 `ledger_note` 工具显式记录 `app/src/server/ledger.ts:5-8`，条目结构见 `app/src/server/ledger.ts:14-31`。
- 自动记录有动作面过滤：只有科研相关工具调用才落条目，避免心跳噪声 `app/src/server/qoder.ts:98`；写入发生在 tool_end 分支，失败动作同样记录 `app/src/server/qoder.ts:1451-1462`。
- 产物路径靠启发式提取：从入参的若干文件字段与结果文本里正则捞文件名 `app/src/server/ledger.ts:46-65`。
- `ledger_note` 要求 claim 与 evidence 都非空，且**必须有项目作用域**，否则明确报错并建议改用 note_write `app/src/server/qoder.ts:582-591`。
- 体积是护栏不是闸门：单文件超 8MB 保留后 500 行 `app/src/server/ledger.ts:32` 与 `:74-77`；读取条数钳制在 1—2000 `app/src/server/ledger.ts:89`。
- 出口是 `GET /api/work/ledger?projectId=&format=json|md` `app/src/server/routes.ts:368-376`，md 形态直接产出复现清单：声明↔证据表、动作时间线、疑似产物索引、复核提示 `app/src/server/ledger.ts:96-141`，并在末行声明"复现需补齐环境版本/随机种子/数据哈希" `app/src/server/ledger.ts:139`。

**计量与额度（未实现，只有可核对的反证）**

- Chat 链路只统计字符数与耗时（`chars` / `ttftMs` / `totalMs`）`app/src/server/index.ts:223-224`；`chatStream` 解析上游 SSE 时只取 `delta.content` 与 `reasoning`，完全不读 `usage` 字段 `app/src/server/ai.ts:127-135`。
- 53 条 Work 路由与 6 条核心路由里没有任何 billing / credits / subscription / checkin / usage 端点 `app/src/server/routes.ts:16-515`。
- 后端配置类型只有四个字段（providerId / model / apiKey / note）`app/src/shared/domain.ts:327-332`，work.json 的分区集合里也没有账户、余额、档位字段 `app/src/shared/domain.ts:415-428`。
- 策划案自陈的唯一残留是前端一个"升级 Pro"词条 `墨台实现策划案/_src/06-订阅预付费.md:25`；本页在当前源码侧无法复现该证据（它指向构建产物），改以源码核验：`app/src/webapp/work/80-i18n.ts` 检索该键零命中，与策划案"该键已不在源码 i18n 中"一致 `墨台实现策划案/_src/06-订阅预付费.md:25`。

## 设计上要什么（未实现的部分）

- 双计量：Chat 高阶按 Token、Work 按积分，余额决定"能不能跑"、档位决定"能用哪些功能"，二者互不占用 `墨台实现策划案/_src/06-订阅预付费.md:78`，展开见 [算力与权限解耦](../concepts/billing-quota-decoupling.md)。
- 积分按复杂度阶梯计价（智能体数、工具调用数、沙箱时长分档）`墨台实现策划案/_src/06-订阅预付费.md:103-111`；结算在任务结束时、余额校验在开始时 `墨台实现策划案/_src/06-订阅预付费.md:115-116`。
- 个人四档 / 团队三档权益表与逐级对照 `墨台实现策划案/_src/06-订阅预付费.md:152-157` 与 `:218-220`；免费用户 200 初始积分、每日签到 100 积分 `墨台实现策划案/_src/06-订阅预付费.md:255` 与 `:257`。
- 数据结构要求：余额账户与会员订阅分开存储、流水 append-only、用量按日分桶、计价表可配置 `墨台实现策划案/_src/06-订阅预付费.md:378-408`；门禁必须服务端强制并返回结构化拒绝 `墨台实现策划案/_src/06-订阅预付费.md:360-363`。
- 前置缺口：无账号体系与云端，团队版与可信账本都缺地基 `墨台实现策划案/_src/06-订阅预付费.md:231`；本地单机的计费只能定位为"自律性计量" `墨台实现策划案/_src/06-订阅预付费.md:491`。

⚠️ 冲突：策划案 §1.2 用"约 40 个端点"描述后端规模 `墨台实现策划案/_src/06-订阅预付费.md:15`，实际为 Work 53 条 + 核心 6 条，详见 [后端服务](./backend-server.md) 与 [03-后端板块实现策划案](../sources/plan-03-backend.md)。

## 已可复用的接入点

积分计量所需的三个原始量已经在产生：工具调用事件（`tool_start` / `tool_end`）`app/src/server/qoder.ts:1425-1449`、沙箱执行耗时（`durationMs` 随结果返回）`app/src/server/routes.ts:53-54`、审计日志的逐调用记录 `app/src/server/audit.ts:48-53`。缺的是把它们换算成额度并做门禁判定那一层。

## 台账侧的增量实现（计费侧仍为零）

证据链台账这一半在往前建，计费那一半仍然没有代码：

- 智能体可显式调 `ledger_note` 落一条"关键声明 ↔ 证据 ↔ 产物 ↔ 置信度"，要求 claim 与 evidence 都非空且必须有项目作用域，写入走 `ledger.appendEntry`（`app/src/server/qoder.ts:593-610`）。
- 被动累积：凡命中 `LEDGER_TOOLS_RE` 的工具（Write/Edit/NotebookEdit/Bash/run_code/mcp__chatscience__*/mcp__research-*/WebFetch/WebSearch，`app/src/server/qoder.ts:123`）都会在回合结束时自动追加动作条目（`app/src/server/qoder.ts:1481-1482`）。
- 读取端 `GET /api/work/ledger?projectId=&format=json|md&limit=&projectName=`（`app/src/server/routes.ts:368`）；`md` 形态即复现清单，`projectName` 只影响标题显示。
- 实测规模：第五批一轮自动累积 76 条动作，导出的复现清单 176 条、疑似产物 25 项（`app/verify/全功能验证报告.md:186`）。

⚠️ 冲突：本页的 disputed 判定不变——上面全部是"证据台账"，与 06 策划案的积分/Token 计量无关，后者仍零实现，另见[06-订阅预付费板块实现策划案](../sources/plan-06-billing.md)。

## 关联

- 概念：[算力与权限解耦](../concepts/billing-quota-decoupling.md)
- 实体：[后端服务](./backend-server.md)、[记忆与知识库](./memory-knowledge.md)
- 资料：[03-后端板块实现策划案](../sources/plan-03-backend.md)
