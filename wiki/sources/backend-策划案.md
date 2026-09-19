---
type: source
title: 03-后端板块实现策划案（摘要）
tags: [后端, 策划案, 沙箱, 持久化, 打包, 验证]
sources: [墨台实现策划案/_src/03-后端.md]
updated: 2026-09-18
---

# 03-后端板块实现策划案（摘要）

墨台本地后端服务层的实测调研策划案：进程架构、HTTP API 面、数据持久化、AI 上游链路、知识库、安全沙箱、打包分发、验证体系、日志可观测性，以及按 A—F 六组收拢的落地清单。

## 冲突裁定原则（第 1.2 节，全文基调）

凡策划案第 5 章设计与已实现冲突，**一律以已实现为准**：纯 Node/TS + Express（弃 Rust 混合）、JSON 双文件持久化（无 SQLite）、BM25 词法检索（无向量库）、12 模块按域拆分（非 7 模块统一网关）。计费/团队/云同步为零实现。

## 关键结论

1. **双进程模型**：Electron 主进程 fork 后端（内置 Node 20），仅绑 `127.0.0.1`，每次启动随机 24 字节 Bearer token，6 端口候选回退，`runtime.json` 落盘实际端口与 token。详见 [Electron桌面层](../entities/Electron桌面层.md)。
2. **API 面约 40 端点**（核心 6 + Work 33）；⚠️ 与 [ts-migration](ts-migration.md) 记载的"routes.ts 29 端点"口径不一，实际源码路由更多（含 bootstrap/plugins 等新增）。
3. **持久化**：`state.json`（前端快照，180ms 防抖差量）+ `work.json`（后端配置，分区串行 store）物理隔离；原子写 tmp+rename；种子按 id 增量合并修复"改名不生效"。遗留：落盘延迟极端丢帧、二进制附件不落盘。
4. **AI 链路**：8 厂商 OpenAI 兼容代理，Key 仅存后端；实测 10/10 轮（17.2 万字符注入），TTFT 16.2s 为上游时延非本地缺陷。已知缺陷：思考开关未达上游（一行修复）。
5. **知识库**：纯词法 BM25（K1=1.5/B=0.75，中文 bigram，600/80 分块），已声明非语义边界；向量+RRF 混合为升级方案。
6. **安全 = 9 层纵深 + 诚实边界声明**：唯一不可绕过层是 `shell:false`；命令拦截"防误操作不防绕过"；断网为声明式；`peakRssKb` 恒 null 不谎报。详见 [沙箱机制](../concepts/沙箱机制.md)。
7. **打包关键踩坑（8.3）**：SDK 纯 ESM × Electron 内置 Node 20 → `ERR_REQUIRE_ESM` 使打包版 server 静默未启动；且 tsc 会把动态 `import()` 改写回 `require()`——解法是 **Function 间接层**构造真 import。
8. **验证**：12 脚本 69+ 项全绿；方法论五条（行为不变 SHA256、真实执行、失败如实呈现、不谎报指标、双通道 UI）。详见 [验证体系](../concepts/验证体系.md)。
9. **落地清单**：A 组 AI 缺陷修复（P0）→ B 持久化 → C 安全加固 → D 向量化 → E 新 API 七组 → F 可观测与 CI；施工顺序与验收标准明确。

## 关联
- 实体：[后端服务](../entities/后端服务.md)、[Electron桌面层](../entities/Electron桌面层.md)、[构建打包体系](../entities/构建打包体系.md)、[墨台产品](../entities/墨台产品.md)
- 概念：[沙箱机制](../concepts/沙箱机制.md)、[验证体系](../concepts/验证体系.md)、[宣传合规红线](../concepts/宣传合规红线.md)（边界如实声明的出处）
- 资料：[ts-migration](ts-migration.md)（同一批已知缺陷的迁移视角）、[knowledge-reader-plan](knowledge-reader-plan.md)（阅读模式前端侧设计）、[billing-策划案](billing-策划案.md)（计费零实现）