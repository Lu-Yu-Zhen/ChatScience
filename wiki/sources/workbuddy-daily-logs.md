---
type: source
title: WorkBuddy 日记忆合并摘要（2026-09-12 至 09-17）
tags: [工作日志, 开发历史, 主题系统, 设置页, 打包]
sources: [.workbuddy/memory/2026-09-12.md, .workbuddy/memory/2026-09-13.md, .workbuddy/memory/2026-09-14.md, .workbuddy/memory/2026-09-15.md, .workbuddy/memory/2026-09-16.md, .workbuddy/memory/2026-09-17.md]
updated: 2026-09-18
---

# WorkBuddy 日记忆合并摘要（2026-09-12 至 09-17）

六份日记忆（合计约 120KB）按日期主线记录墨台从「工具调研」到「TS 迁移 → 品牌 → 产品页 → Agent 系统 → 主题/设置页 → 交互细节与十二套主题」的六天开发史。原始文件只读；长期结论已沉淀在 `MEMORY.md`（索引）与 [memory-detail](memory-detail.md)（细节分卷）。

## 09-12：运营物料与工具链调研

- 两张海报交付：科研 Agent 宣传海报（1080×1620，轻盈科技风）+ 内测招募海报（1080×1440，活力年轻风），含可复用排版经验（底图负偏移、水印遮盖、SVG 箭头替代 emoji 字符）。
- AgentsView 调研安装（旁路读 `~/.workbuddy/projects/*.jsonl` 的会话分析工具，v0.42.0）；产出 `agentsview-report/`。
- better-harness 以「技能套件」装入 `~/.workbuddy/skills/better-harness/`（用户纠正：WorkBuddy 不叫插件叫技能套件）；**发现并修复两个上游 Windows bug**（slug 盘符大小写/双横线、路径比较大小写敏感），修复前 WorkBuddy 会话证据恒为 0。试运行最重要发现：13 次代码改动 0 次验证。
- 摸清 WorkBuddy 插件机制（`.codebuddy-plugin/` 清单、市场注册表）；环境坑首记录：Git Bash 残缺、安全层拦截 iex/Start-Process/Remove-Item（详见 [踩坑实录](../concepts/踩坑实录.md)）。

## 09-13：TypeScript 迁移完成

app/ 核心代码（main/preload/server 11 模块/build/pack/make-icons）迁至 `src/*.ts`，产物落回原路径、下游零改动；git 基线 a31f729→1bdcfa1；21 项冒烟 ALL PASS、renderer SHA256 一致。关键坑（tsc 改写动态 import）与遗留问题见 [ts-migration](ts-migration.md)。

## 09-14：墨砺 InkForge 品牌方案

11 件画布产物（`inkforge-brand.miora`）：6 Logo 概念→选①墨滴砺痕→VI 手册+3 展示图。⚠️ 与后续裁定冲突：产品名最终定为「墨台」，InkForge/墨砺仅作视觉基因库（见 [墨台产品](../entities/墨台产品.md)）。已知缺陷：AI 生图对色卡小字色值还原不可靠。

## 09-15：产品页 + Agent 系统大版本 + 五套主题

- `墨台产品页.html`：单文件三页哈希路由（产品/订阅/下载）+ 中英双站（国际站 $20/$50/$100/$200，团队 $39/$99/$189，Ultra 档），断言 47→84→120→137→139 项递进全过；沉淀技能 `html-inline-i18n`、`single-file-hash-router`。
- 04-Agent 系统落地（按策划案）：A 组加固（工具超时 30s/熔断/统一错误结构/审计 hooks→work-audit.jsonl）、E 组七类子智能体+编排主智能体、C 组 6 本地科研工具+5 新技能（12→17）；`verify/agent-system-verify.ts` 35/35。⚠️ 1.0.34 实测 QoderModelPurpose 实际值 main/plan/task/compact/utility ≠ 国际版文档。
- 五套扩展主题（青绿/海天/朱砂/旧事/玻璃）+ 令牌归位；同日用户裁定「外壳分色、画布亮色」并二次收缩。⚠️ ink-green 外壳 #F7F5EE 被用户改判为 #E1ECE5，策划案值作废。并发编译竞态教训首现。
- 交付《墨台项目地图.md》：全仓结构摸底（01/ 是 src/webapp 同步副本、三段构建链、文档真源 _src/*.md）。

## 09-16：主题着色定稿 + 设置页落地 + 图标系统方案

- 三轮着色裁定收敛（见 [主题系统](../entities/主题系统.md)「着色范围」）：仅左侧栏+顶部栏随主题；「标题栏/窗口顶部栏」词汇调换，以本条为准。
- 设置页改造实施（全屏覆盖层 #settingsPage，六组十五项导航，Work 侧栏 9→5 项）+ 第二批扩展（五偏好面板 + 技能页双选项卡）+ 三问题修复（--titlebar-h 让位、覆盖层内 renderMessages 重绘不可见→Work.rerender 上下文感知、幂等导航 force）。⚠️ 并发编辑事故：webapp.ts 被旧缓冲覆盖回原始版，逐块重放恢复，两会话最终共存。
- 九项 UI/UX 细化（个人资料页、zip 本地上传、toggle 令牌化）；只此青绿初始态壁纸试点（`!important` 必加、注入脚本锚点坑）。
- 两主题按壁纸重建（cinnabar→水墨江南、glass→万山红遍，毛玻璃退役）+ 五主题壁纸统一；逗号选择器退化坑发现。
- 墨台图标组件系统设计方案（Ardot，92 枚/7 组+规范页，纯描边 1.75px）；天空与海整族同位移下移法（技能 `theme-tint-family-shift`）。

## 09-17：交互细节密集日 + 十二套主题定型

- 输入框「+」资源挂载菜单（新模块 75-plus-menu.ts，三路数据源、body+fixed 门户、contextPicks 带 ref）；验证 25/25。
- 无 Bash 环境的 CDP 自验姿势沉淀（PowerShell 起 node → node spawn 无头 Chrome → 原生 WebSocket 直连 9222/9333）；**用户新硬约定：每步完成后重新打包并打开应用**，explorer.exe 代理启动为唯一可行自动化启动路（五条死路穷尽实测）。
- 左栏 280→256px（收敛 `--left-w` 单一事实来源）；对话消息样式改造（AI 无头像、等宽字体栈顺序坑、用户气泡 53→41px）；设置页字体五档（两层根因：body 内联阻断继承 + prefPatch 未定义）+ prefSelect 自定义淡入组件重写。
- 界面字号五档滑条（body.style.zoom）：zoom 坐标分裂坑（csViewportK() 探针校准）+ 刻度对齐（thumb 行程公式）两轮修复。
- 主题扩至十二套定型（+风花雪月/桃林/燕云十六声/白蛇缘起/办公日常/经典QQ）：66 项令牌契约、4 类注册点、Lab ΔE≥12 区分度门槛、`--btn-primary-text` 侧通道（亮品牌色不压深）；燕云按 10 张官方壁纸量化重建；选择器改一行四个；壁纸扩至八主题（三主题随壁纸二次调色）。
- 同日多次用户裁定迭代：桃林改淡粉（R>B>G 才是粉）、白蛇「白为主青为辅」+侧栏纯白（ΔE=0 系明示，勿为区分度加色）、QQ 改正牌蓝 #12B7F5。

## 关联
- 概念：[踩坑实录](../concepts/踩坑实录.md)、[开发环境约束](../concepts/开发环境约束.md)、[验证体系](../concepts/验证体系.md)、[构建产物同步陷阱](../concepts/构建产物同步陷阱.md)
- 实体：[主题系统](../entities/主题系统.md)、[设置页](../entities/设置页.md)、[构建打包体系](../entities/构建打包体系.md)、[墨台产品](../entities/墨台产品.md)
- 资料：[memory-detail](memory-detail.md)、[verification-report](verification-report.md)、[ts-migration](ts-migration.md)
