# 墨台 Wiki · 操作日志

> append-only 时间线。每条以统一前缀开头，取最近 5 条：`grep "^## \[" log.md | tail -5`。

## [2026-09-18] init | Wiki 系统骨架建立

按 Karpathy llm-wiki 模式创建三层架构：`SCHEMA.md`（约定与工作流）、`index.md`（目录）、`log.md`（本文件）、`overview.md`（总览），以及 `sources/`、`entities/`、`concepts/` 三个内容目录。原始资料层 = 仓库既有 21 份文档（约 630KB），只读引用。

## [2026-09-18] ingest | Agent系统设计策划案

摄取 04-Agent系统设计.md（180KB）并核对源码 → 7 页：sources×1、entities×3（墨道/子智能体体系/墨析）、concepts×3（byok-auth/agent-委派模式/领域插件）。标注策划案与当前源码三处过时/矛盾：内置智能体已收敛为 2 个；BYOK-only 定案（resolveModel 禁令）；隔离三件套缺一不可。

## [2026-09-18] ingest | UI与前端策划案

摄取 01-UI / 02-前端 / 07-设置页改造 → 8 页：sources×3、entities×3（前端架构/主题系统/设置页）、concepts×2（构建产物同步陷阱/动效与布局约定）。⚠️ 矛盾：左栏 280px vs 256px；01-UI「双主题+六套待实现」已被十二套现状取代。

## [2026-09-18] ingest | 后端、构建与迁移资料簇

摄取 03-后端 / TypeScript迁移说明 / 知识库阅读计划 → 8 页：sources×3、entities×3（后端服务/Electron桌面层/构建打包体系）、concepts×2（验证体系/沙箱机制）。关键：ERR_REQUIRE_ESM 双重陷阱与 Function 间接层解法；三处有意保留的已知缺陷；⚠️ TS 迁移说明「前端保持 JS」已被现状推翻。

## [2026-09-18] ingest | 品牌、产品与计费资料簇

摄取 05-宣传 / 06-订阅预付费 → 6 页：sources×2、entities×2（墨台产品/计费体系）、concepts×2（宣传合规红线/去AI味设计）。关键：计费体系实质性零实现（设计蓝图态）；⚠️ 矛盾：宣白色值两来源不一致（以 MEMORY 为准）。

## [2026-09-18] ingest | 工程日志与验证簇

摄取 验证报告 + 六份日记忆 + MEMORY-detail → 5 页：sources×3、concepts×2（踩坑实录 20 条 / 开发环境约束）。关键：resolveModel 打回平台额度（二分实验坐实）；explorer 代理启动穷尽实测；开发/打包运行时差异是最大风险面；UI 验证须真实点击+computed style 双通道。

## [2026-09-18] ingest | 外部工具与生态调研

摄取 AgentsView 报告 + Better Harness 两篇 → 4 页：sources×2、entities×1（agentsview）、concepts×1（智能体可观测性）。关键：better-harness 插件分发不支持，采用旁路读盘；两篇报告共同指向 MCP 明文凭据与验证缺失问题。

## [2026-09-18] lint | 首轮健康检查

- 链接完整性：脚本扫描全库相对链接，修复 `sources/agent-system-design.md` 3 处缺目录前缀的断链（byok-auth/agent-委派模式/领域插件 → ../concepts/）；SCHEMA.md 剩余 2 处为模板示例代码块占位，非真实链接。复检通过。
- 孤儿页：墨析、agentsview 入链较少（由 overview 与 index 兜底），观察中。
- 矛盾登记：4 处 ⚠️（左栏宽度、宣白色值、策划案过时×2）已写入 overview「已知矛盾」节。
- 待补清单：①PowerShell 数组解包坑无日志记录（详情在 MEMORY 项目记忆，已标注）；②计费体系 Token 计量实现缺口；③知识库阅读模式（knowledge-reader-plan）尚未落地，相关概念页暂缺。
