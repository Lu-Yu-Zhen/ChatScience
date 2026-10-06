---
type: source
title: 验证报告簇
tags: [验证, 报告, 指标, 墨台]
sources: [app/verify/验证报告.md, app/verify/全功能验证报告.md, app/verify/metrics.json, app/verify/work-metrics.json, app/verify/agent-system-metrics.json]
updated: 2026-10-06
status: stable
---

# 验证报告簇

> 一句话摘要：两份 Raw 报告（2026-09-04 起多轮追加、2026-10-04 全功能复核）加三份 metrics JSON，构成项目全部实测结论与口径来源。

## 两份报告别混着读

- `app/verify/验证报告.md`（419 行）是**过程记录**：从 2026-09-04 交付报告起，按时间追加 Work 模式、第二轮迭代、打包故障、M/N/P 调试轮、追加轮 1/2、Round 3~9，见 `app/verify/验证报告.md:1-3`、`app/verify/验证报告.md:97`、`app/verify/验证报告.md:221`、`app/verify/验证报告.md:403`。
- `app/verify/全功能验证报告.md`（269 行）是**当前状态快照**：2026-10-04 用打包版 exe + CDP 真实点击链路做全功能复核，B1~B14 缺陷清单加 Wave 1~6 结果（`app/verify/全功能验证报告.md:3`、`:8`、`:30`），同日之后又按批次追加到 2026-10-05：第五批「Work 模式科研能力真跑验收」`app/verify/全功能验证报告.md:161-224`，第六批「右侧栏预览」`:234-259`，交付与残留清单 `:262-268`。页头的验证日期仍写 2026-10-04，引用批次内容时以小节标题里的日期为准。
- 两份报告的驱动方式不同：早期用 `_cdp_eval.js` + 9222 端口调试通道（`app/verify/验证报告.md:295`、`app/verify/验证报告.md:303`），后期统一到 9223 约定（`app/verify/全功能验证报告.md:3`）。

## 报告里的关键结论（可当验收口径）

- Chat API 层 10 轮全文注入、UI 层 7 项，指标与对话全文分别落 `app/verify/metrics.json` 与 `app/verify/transcript.txt`：`app/verify/验证报告.md:50-67`、`app/verify/验证报告.md:69-81`。
- Work 模式后端逐层成绩（沙箱 18/18、SDK 12/12、技能 10/10、知识库 7/7、端到端 7/7）：`app/verify/验证报告.md:122-135`。
- 能力边界是报告里最该被引用的部分：canUseTool 静态扫描防误操作不防有意绕过、沙箱无 Job Object 资源上限、声明式断网不可强制、kb_search 是 BM25 词法检索、init.skills 只是发现报告，见 `app/verify/验证报告.md:155-165`，逐条承诺的现页是 [沙箱边界](../concepts/sandbox-boundaries.md)。
- 打包期专属故障（开发环境测不出）与根因：`app/verify/验证报告.md:234-241`。
- 全功能复核的缺陷表 B1~B10、测试侧修正、最终回归与追加两批能力：`app/verify/全功能验证报告.md:8-19`、`:21-28`、`:66-70`、`:74-104`、`:109-143`。
- 第五批把"科研能力真跑"落成 12 场景 25 条断言 + 界面链路 7 项，全部给出可复核数字（pandas 均值 0.7650/0.8666、t(4)=38.38）：`app/verify/全功能验证报告.md:171-188`；同批最重要的一条是**数据溯源不能只写在技能里**，`:220-224`。
- 第六批给出右栏预览的四处实现与三条当场修掉的真实缺陷（斜杠归一、数据分组没接新路由、产物条目被截断）：`app/verify/全功能验证报告.md:238-255`。

## 三份 metrics JSON 的口径

- `app/verify/metrics.json`（66 行）：Chat 管线产物，字段 `rounds/model/paperChars/startedAt/summary/finishedAt`，由 `app/src/verify/chat-verify.ts:123` 整份写出，声明见 `app/src/verify/chat-verify.ts:9`。
- `app/verify/work-metrics.json`（341 行）：多脚本合并写入，每个脚本占一个键；沙箱脚本是**整份覆盖**（`app/src/verify/sandbox-verify.ts:219`），其余脚本读回后合并再写（`app/src/verify/agent-verify.ts:121-127`、`app/src/verify/kb-verify.ts:105-107`、`app/src/verify/skills-verify.ts:117-119`、`app/src/verify/sdk-verify.ts:169-171`、`app/src/verify/memory-verify.ts:253-259`、`app/src/verify/workspace-verify.ts:132-134`）。2026-10-05 那轮沙箱脚本先跑并覆盖整份，当前盘上只剩 `sandbox`（18/18）与 `skillsN2`（11/11）两个键，其余键已被抹掉——这正是"快照不是历史"的直接后果。
- `app/verify/agent-system-metrics.json`（194 行）：单次运行汇总，字段 `at/total/pass/skip/fail/results`，由 `app/src/verify/agent-system-verify.ts:309` 写出；当前记录 31/31。
- 结论：metrics 是**最后一次运行的快照**，不是历史累积。引用前先看文件里的 `at` 时间戳。

## 报告里的操作约束（照抄会出事）

- 认证令牌等同账户身份，分享便携包前必须清理那个文件：`app/verify/验证报告.md:173`、`app/verify/验证报告.md:248`。
- 两份报告都留了「待用户清理 / 待用户操作」段，写明验证中间产物、`测试文件夹/` 里的验收数据与本机 PATH 缺陷：`app/verify/全功能验证报告.md:266-267`。

## 报告与数据的矛盾（引用时注意）

- 三份报告类资料的可信度分级：BUG 表与 Wave 清单是**当轮实测**、修复记录是**过程证据**、能力边界（W3）是**长期承诺**；引用时别把过程证据当现状。
- 报告只在正文引用脚本名，不引用行号；本页所有实现细节都改指 `app/src/**` 或手写 JS 的证据，这是 Wiki 侧的硬约束（`wiki/SCHEMA.md:51`）。
- ⚠️ 冲突：`app/verify/验证报告.md:57-58` 记「轮次成功 10/10（100%）」，但盘上 `app/verify/metrics.json` 的最后一次运行（startedAt 2026-10-05T02:46）summary 是 roundsTotal=10、roundsOk=0、successRate 0.0%、keywordPassRate 0/10——报告表格是首轮成绩，JSON 是末次运行；口径与成因见[踩坑实录](../concepts/pitfalls-log.md)。
- ⚠️ 冲突：`app/verify/验证报告.md:128-129` 与 `:172` 记 12 个内建技能，`app/src/verify/verify-suite.ts:60` 也仍写 12，而 2026-10-05 的 skillsN2 断言实测**底座内建 14 个**（`app/server/skills-plugin/skills/`），插件包另有 18 个技能目录（`app/server/plugins/research-ai/skills/`）——技能数随插件化增长，旧报告与登记说明的数字都滞后，脚本侧口径见[验证套件](../entities/verification-suite.md)。
- `app/verify/验证报告.md:414` 说 memory 结果写入 `work-metrics.json → projectMemory`，当前文件里没有该键（被后续脚本覆盖）——同上看第 2 条口径。
- `app/verify/验证报告.md:12-26` 的目录树是便携发行版布局，其中 `main.js`/`server/*.js`/`renderer/index.html` 均为构建产物；报告自己在 `app/verify/验证报告.md:9` 已标注源码在 `app/src/`，本页引用时一律指向 TS 源。

## 关联

- 脚本本身与分层入口：[验证套件](../entities/verification-suite.md)
- 实测方法与边界：[UI 验证方法论](../concepts/verification-method.md)
- 逐条踩坑归档：[踩坑实录](../concepts/pitfalls-log.md)
- 打包形态与产物自检：[构建与打包体系](../entities/build-pack-system.md)
