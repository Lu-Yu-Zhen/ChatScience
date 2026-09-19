---
type: source
title: 知识库改造 + AI 阅读模式计划（摘要）
tags: [知识库, 阅读器, AI阅读模式, pdf.js, 前端]
sources: [.trae/documents/plan-knowledge-db-ai-reader.md]
updated: 2026-09-18
---

# 知识库改造 + AI 阅读模式计划（摘要）

在单文件前端演示应用 `01/主页面.html` 内完成的知识库体系改造计划：「论文和数据库」→「知识和数据库」、文件夹式知识库、pdf.js 完整阅读器、AI 阅读模式（左栏隐藏 + 中栏阅读器 + 右栏聊天 + 论文注入上下文）。

## 关键结论

1. **五项改造**：改名与重组（知识库卡片→文件列表→文件预览）、右侧栏按会话动态绑定、pdf.js 功能完备阅读器（缩放/翻页/页码/检索/目录/高亮批注/全屏）、多文件类型预览（mammoth 转 docx、SheetJS 转 xlsx/csv、md/txt/图片）、AI 阅读模式。
2. **数据结构**：`papersDbState.kbs[]` 替代平铺 papers 列表；`project.libPapers` 废弃 → `kbFiles:[{kbId,fileName,pinned}]`；普通会话读写 `conv.localFiles/kbFiles/dbs`；阅读模式状态 `readMode` + `conv.docCtx = {fileName, text}`（>50k 字符截断，持久于会话、多轮持续生效）。
3. **阅读器实现要点**：pdf.js 3.11.174（cdnjs worker）连续页 canvas + IntersectionObserver 懒加载 + renderTextLayer 可选文本层；无 outline 时按大字号行提取简易目录；高亮批注按页存内存 `annotations`。
4. **AI 阅读模式 DOM 技巧**：把 `chatScroll/inputArea` **移动（appendChild）进右栏**而非重建——保留全部事件监听与消息数据，`renderMessages()` 无需感知；切换会话时自动退出阅读模式防串数据。
5. **边界声明**：纯前端演示——文件 data 仅存内存刷新即失；AI 回复为本地演示流式，docCtx 以文案体现注入；离线环境 pdf.js worker 加载失败降级为错误提示。

## 与现状的关系

⚠️ 本计划针对**纯前端演示阶段**（无后端）。当前应用中这些能力已演进为真实链路：阅读器解析结果由前端推送后端建 BM25 索引（[后端服务](../entities/后端服务.md) 的 kb.ts），工作区文件经 `/api/fs/list` + `/api/fs/raw` 实时读取，docCtx 注入走真实 `/api/chat` SSE。「≤50k 字符截断」上限在 [backend-策划案](backend-策划案.md) 5.3 节被列为待实现的"上下文裁剪"问题（实测曾注入 17.2 万字符未裁剪）。

## 关联
- 实体：[后端服务](../entities/后端服务.md)（kb.ts / notes.ts 承接本计划的后端化）、[墨台产品](../entities/墨台产品.md)
- 资料：[backend-策划案](backend-策划案.md)（知识库 BM25 与上下文裁剪）、[ts-migration](ts-migration.md)（前端 TS 化为二期建议）