---
type: meta
title: 墨台 Wiki · 操作日志
tags: [log, 时间线]
sources: [wiki/SCHEMA.md]
updated: 2026-10-04
status: stable
---

# 墨台 Wiki · 操作日志

> append-only 时间线。条目格式 `## [YYYY-MM-DD] <op> | <标题> — @<作者>`，只在文件末尾追加；取最近 5 条：`grep "^## \[" wiki/log.md | tail -5`。

## [2026-10-04] rebuild | Wiki 系统按 Karpathy llm-wiki 模式完全重构 — @Qoder

旧 `wiki/` 42 页整体废弃（不迁移内容，只作覆盖清单参考）。重建三件事：① `SCHEMA.md` v2 契约 —— Raw 登记表 + 禁引清单（本机私有路径、构建产物、密钥文件）、四类内容目录（sources/entities/concepts/syntheses）、证据引用语法 `` `路径:行号` ``；② `app/src/tools/wiki-lint.ts` 重写，新增 `EVID-*`（引用路径存在性、行号越界、指向产物）、`SRC-PRODUCT`、`CONTRA-LINK`、`FM-UNKNOWN-FIELD`、disputed 页必须含冲突行等检查，并加 `--add` 骨架生成与 `--log` 时间线追加两种维护模式；③ 内容从 Raw 重新摄取。

## [2026-10-04] schema | 契约 v2 定稿：⚠️ 保留为冲突标记 — @Qoder

`⚠️` 只用于"本页结论与另一页冲突"，行内代码里的 `⚠️` 视为在描述契约本身、不触发 `CONTRA-LINK`。退出码沿用 0/1/2；`--fix` 只重写 `index.md`。
## [2026-10-04] ingest | 领域路由接上工作区文件信号，启用确认统一到两个入口 — @Qoder

P6 的第三批只有 API 层证据，补真实点击验收后暴露两处：插件页「检测领域」不传 workspaceRoot（且取工作区误用仅 Work 模式填充的 CS_WORK 状态，Chat 模式恒空），使 routing.json 的 fileSignals 在用户可见路径上恒不命中；建议行的「启用该包」直接 PUT，绕过卡片开关的能力差异确认。现改为与智能体回合同一口径取 `projects`，文件信号以标签呈现，卡片开关与建议入口共用 `confirmEnablePlugin()`。验收 `app/verify/plugin-route-ui-verify.js` 10/10（中性文本仅靠工作区文件得建议；取消不改状态，确认才启用）。同时记录 MCP 惰性加载丢真名的坑与修法：`app/src/server/qoder.ts` 的 `unwrapMcpCall()`，详见 `app/verify/全功能验证报告.md:113` 与 `app/verify/全功能验证报告.md:145`。

## [2026-10-05] ingest | 品牌/订阅/站点簇与三个综合页（48 页齐备） — @Qoder

## [2026-10-05] lint | 重构终验：48 内容页 447 交叉引用，0 error — @Qoder
## [2026-10-05] ingest | Work 模式科研能力真跑：12 场景 25 断言全过，数据溯源约束不能只写在技能里 — @Qoder

在用户自己创建的 Work 项目（绑定 D:ChatScience测试文件夹）上真跑数据分析/统计/绘图/实验记录/文献/数学/领域工具/论文自查/写作/委派/台账，并用 CDP 真实点击走一遍界面链路。地面真值由 pandas+scipy 预置（0.7650 / 0.8666 / 差 0.1016 / t(4)=38.38 / d≈31.3），模型全部实算命中。关键负例：无数据约束提示时模型两次编造示例数据画出「看起来专业」的假图，往 figure-plot 技能正文加禁令后仍复现——该回合没加载技能，技能正文不进上下文；结论是科研硬约束必须落底座提示词或工具层。另记 arXiv 429 限流时模型如实报告未编编号（想要的行为），以及验收脚本须每请求重读 runtime.json。证据 `app/verify/全功能验证报告.md:161`、`app/verify/全功能验证报告.md:190`；脚本 `app/verify/science-capability-verify.js`、`app/verify/science-ui-verify.js`。
## [2026-10-05] ingest | 右侧栏就地预览：点图片出图、点文件出内容，产物清单改为结构化事件 — @Qoder

右栏从「只列论文、点击一律进全屏阅读器」扩成 WorkBuddy 式检视器：图片与文本/代码/CSV 在右栏预览卡就地出图出内容，pdf/docx/html 仍进阅读器并可一键切回。新增白名单端点 `app/src/server/index.ts:200`（只认已注册 work 项目 folder，越界 403 / 绝对路径 400 / 未注册 404），工作区扫描扩展名纳入图片与文本（`:128`）。工具轨迹的产物条目不再刮被截断的展示文本，改由后端在截断前抽 `tool_end.artifacts`（`app/src/server/qoder.ts:100`）。页面事实见 [前端渲染层](entities/frontend-renderer.md) 新增的「右栏：上下文资料与就地预览」一节；验收 `app/verify/right-panel-preview-verify.js` 17/17，截图 `app/verify/shots/rp-0*.png`，报告 `app/verify/全功能验证报告.md` 第六批。

## [2026-10-06] ingest | 同步 2026-10-05 两批改动：右栏预览、科研能力真跑、台账与产物事件 — @Qoder

## [2026-10-06] lint | 全库引用重锚 68 处并复核热文件锚点 — @Qoder

## [2026-10-06] schema | SCHEMA §四.2 增加重锚纪律（锚在语句起始行、热文件附符号名） — @Qoder
