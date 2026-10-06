---
type: entity
title: 记忆与知识库
tags: [memory, 知识库, BM25, server, 墨台]
sources: [app/src/server/memory.ts, app/src/server/kb.ts, app/src/server/userdata.ts, app/src/shared/domain.ts, 墨台实现策划案/_src/03-后端.md, 墨台实现策划案/_src/02-前端.md]
updated: 2026-10-06
status: stable
---

# 记忆与知识库

> 后端里有四套互不相同的"记住东西"的机制——项目记忆、知识库检索、用户级 Qoder 记忆读取、实验笔记——本页把它们各自的作用域、写入口径与能力边界分开讲清。

## 四套机制的分工

| 机制 | 位置 | 谁写 | 谁读 |
|---|---|---|---|
| 项目/任务记忆 | `app/src/server/memory.ts:88-95` | 模型经 Stop 决策 hook 自主写 | 回合前注入系统提示 `app/src/server/qoder.ts:1296` |
| 知识库索引 | `app/src/server/kb.ts:43-46` | 前端推送已解析文本 `app/src/webapp/work/90-boot.ts:100-116` | `kb_search` 工具 `app/src/server/qoder.ts:404-411` |
| 用户级记忆读取 | `app/src/server/userdata.ts:71-98` | 不由本产品写 | 设置页展示与软删除 `app/src/server/routes.ts:488-502` |
| 实验笔记 | `app/src/server/notes.ts:1-5` | `note_write` 与笔记本页共用同一份 | 同两端 |

## 项目记忆

目录是 `data/projects/<projectId>/memory/`，下含 README.md 索引与 `tasks/<taskId>.md`；projectId 与 taskId 来自前端快照，作路径段前必须清洗字符 `app/src/server/memory.ts:70-74`。根目录入口处一次 `path.resolve`，否则记忆位置会随进程 cwd 漂移 `app/src/server/memory.ts:91`。

- 任务文档的键实际是会话 ID：`ensureContext` 收到的 taskId 由运行参数里的 convId 传入 `app/src/server/qoder.ts:1150`。
- 创建是幂等的：项目文件夹与任务文档不存在才写模板，任务同时登记进 README 的任务清单 `app/src/server/memory.ts:133-168`；标题从草稿变正题时同步 H1 `app/src/server/memory.ts:170-186`。
- 注入段带"机制说明 + 写入规范 + 当前内容"，任务记忆截 4000 字符、项目索引截 2000 字符 `app/src/server/memory.ts:19-20` 与 `:239-261`。
- 触发方式不是每轮都写：SDK Stop 事件首次返回 `decision:'block'` 加决策指令，第二次（`stop_hook_active` 或本回合已阻断过）放行 `app/src/server/memory.ts:268-307`；hook 自身异常一律放行，记忆是增强不是闸门。
- 写入口径被单独放开：`canUseTool` 的额外可写根只有记忆目录 `app/src/server/qoder.ts:1350` 与 `app/src/server/qoder.ts:623-640`。
- 就绪失败不阻断会话，降级为无记忆 `app/src/server/qoder.ts:1147-1155`；前端侧也有一条独立的项目/任务创建调用，两端任一失败都不影响对方 `app/src/server/routes.ts:221-240`。

## 知识库（BM25 词法检索）

`K1=1.5 / B=0.75`，分块 600 字符、重叠 80、单文档上限 900,000 字符 `app/src/server/kb.ts:16-17`；分词是英文按词 + 中文只建 bigram——刻意不加单字，因为单字会让无关查询误命中 `app/src/server/kb.ts:58-71`。索引来源是前端解析好的纯文本（pdf.js / mammoth / SheetJS 的结果），后端不重复解析二进制 `app/src/server/kb.ts:3-4`，HTTP 侧对 text 设 2MB 上限 `app/src/server/routes.ts:419-426`。

检索结果固定带 `kind: 'bm25-lexical'` 与一句"非语义、同义改述可能漏召回"的提示 `app/src/server/kb.ts:191-195`；无索引时返回引导文案而不是空结果 `app/src/server/kb.ts:135-140`。kbId 与文件名都要清洗并做索引根前缀校验 `app/src/server/kb.ts:37-56`。

⚠️ 冲突：策划案把知识库定位为"文档解析、分块、向量化与检索"，本簇裁定已改为以 BM25 为准并把向量检索列为待实现 `墨台实现策划案/_src/03-后端.md:18`；前端侧也只把知识库当作"文件导入 + 上下文芯片" `墨台实现策划案/_src/02-前端.md:104`，裁定过程见 [03-后端板块实现策划案](../sources/plan-03-backend.md)。另有一处源码内部不一致：文件头注释写"中文 bigram + 单字" `app/src/server/kb.ts:5`，实际实现只建 bigram `app/src/server/kb.ts:64-71`。

## 用户级记忆与偏好

`userdata.ts` 读的是 Qoder CLI 在用户主目录下的数据（记忆目录、项目记忆、settings.json 里的 hooks），只读展示不做写入 `app/src/server/userdata.ts:1-11`；删除是软删除——整目录改名移入系统临时目录，且写入前必须通过"目标仍在 CLI 根内"的前缀校验 `app/src/server/userdata.ts:101-120`。这些是本机私有路径，按契约不进任何 Wiki 页面，本页只描述机制。

设置页偏好才是本产品自己的持久化：PUT 时逐字段类型校验与长度裁剪后写进 work.json 的 prefs 分区 `app/src/server/userdata.ts:219-243` 与 `app/src/server/routes.ts:475-483`；记忆开关的真实生效点在 SDK `options.memory` 的 scope 开关 `app/src/server/qoder.ts:1369-1373`，Git 偏好则被编译成一段中文约束注入墨道系统提示 `app/src/server/userdata.ts:203-216`。

## 缺口

附件二进制只存内存不落盘，重启后知识库文件需重新上传 `墨台实现策划案/_src/03-后端.md:181`；知识库容量配额、向量检索、多表结构化数据库均无实现 `墨台实现策划案/_src/03-后端.md:288-317`。

## 关联

- 实体：[后端服务](./backend-server.md)、[账本与计费](./ledger-billing.md)、[墨台产品](./motai-product.md)
- 资料：[03-后端板块实现策划案](../sources/plan-03-backend.md)
- 概念：[算力与权限解耦](../concepts/billing-quota-decoupling.md)
