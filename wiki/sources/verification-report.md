---
type: source
title: 验证报告（交付与验证全记录）
tags: [验证, 交付, Electron, Qoder-SDK, 打包]
sources: [app/verify/验证报告.md]
updated: 2026-09-18
---

# 验证报告（交付与验证全记录）

`app/verify/验证报告.md`（约 40KB，397 行）是 ChatScience/墨台桌面应用自 2026-09-04 起的多轮交付与验证总记录：Chat 模式 → Work 模式 → 第二轮迭代 → 便携版打包 → 真窗口排查 → Round 3–8。原始报告只读，本页为索引级摘要；逐轮细节回源查阅。

## 报告结构（时间线）

| 节 | 内容 | 关键结果 |
|---|---|---|
| 一~四（09-04） | Chat 模式交付：Electron 33 + 内置 Node 24 运行时、便携版免安装、Express 后端（127.0.0.1 + 随机 24 字节 token）、三项需求（右侧栏去容器化/层级化文件选择/真实 AI） | API 层 10/10 轮（DeepSeek-V4.pdf 58 页 /172,746 字符注入，平均 TTFT 16,216ms）；UI 层 7/7，控制台 0 错误 |
| Work 模式（09-05） | 放弃自研 Agent 循环，改以 Qoder Agent SDK（@qodercn-ai/qodercn-agent-sdk，内置 qoderclicn 1.1.44）为底座 + 沙箱边界层 + in-process MCP 科研工具 + 管理页 | sandbox-verify 18/18、sdk-verify 12/12、skills-verify 10/10、kb-verify 7/7、agent-verify 7/7；UI 9 项全过 |
| 第二轮迭代（09-05） | 真实工作区（E:\开源模型架构研究）、Qoder 式时间线、Agent 切换器、管理页视觉去 AI 味 | workspace-verify 5/5；4 项修复（run_code cwd、diff 限深 2、作用域、轨迹首帧） |
| 便携版打包 | `node pack.js` → `dist/ChatScience-win32-x64/`（约 362MB 目录版，asar 关闭可改源码）；不用 electron-packager（GitHub 不可达） | 首包即暴露 ERR_REQUIRE_ESM（详见 [踩坑实录](../concepts/踩坑实录.md)） |
| 追加轮（09-05~06） | 真窗口排查三 bug（侧栏 8px、隐形下拉、ready-to-show 竞态+单实例锁）、全局 6px 悬浮滚动条、真实鼠标回归 | CDP + computer-use 双通道定位 |
| Round 3–8（09-06） | 阅读模式独立化与性能修复（renderMessages 540ms→50ms、renderRightPanel 280ms→0ms 签名守卫）、权限模式五档下拉、加号/竖条收起动画、应用图标（rcedit）、自绘标题栏品牌化 | 各轮 CDP 实测通过 |

## 值得记住的架构决策（报告"实事求是"声明）

- 前端**未迁移 React/Vue**：单文件前端是成熟 UI 资产，重写风险大于收益（后续已 TS 化，见 [ts-migration](ts-migration.md)）。
- 本机环回不启用 TLS，采用随机 token + 仅绑 127.0.0.1 + contextIsolation 纵深防御；状态持久化 180ms 差量检测 + 原子写入（tmp+rename）。
- W3 能力边界如实声明：canUseTool 静态扫描**防误操作不防绕过**；沙箱无 Job Object 资源上限（`peakRssKb` 恒 null 不谎报）；断网为声明式；kb_search 是 BM25 词法检索非语义。
- 认证红线：`server/qoder.json` 的 PAT **等同账户身份**，分享产物前必须清理。

## 修复记录密度最高的部分

报告含 30+ 条「现象→根因→修复」记录（build 注入失效、端口 3218 EACCES、隐形下拉、`state is not defined`、dialog 漏引、实参顺序错、种子标志拦截改名等），已按主题汇编至 [踩坑实录](../concepts/踩坑实录.md)。

## 关联
- 概念：[踩坑实录](../concepts/踩坑实录.md)、[验证体系](../concepts/验证体系.md)、[沙箱机制](../concepts/沙箱机制.md)、[构建产物同步陷阱](../concepts/构建产物同步陷阱.md)
- 实体：[构建打包体系](../entities/构建打包体系.md)、[Electron桌面层](../entities/Electron桌面层.md)、[后端服务](../entities/后端服务.md)、[前端架构](../entities/前端架构.md)
- 资料：[workbuddy-daily-logs](workbuddy-daily-logs.md)（后续开发日志）、[agent-system-design](agent-system-design.md)、[backend-策划案](backend-策划案.md)
