---
type: meta
title: 墨台 Wiki · 索引
tags: [index, 导航]
sources: [wiki/SCHEMA.md]
updated: 2026-10-06
status: stable
---

# 墨台 Wiki · 索引

> 生成物：由 `npm run wiki:lint -- --fix` 从各页 frontmatter 与摘要行重写，请勿手改。
> 入门读 [overview.md](overview.md)；契约见 [SCHEMA.md](SCHEMA.md)；时间线见 [log.md](log.md)。

## 实体（entities/）

- [墨道运行时](entities/agent-runtime.md) — 一句话摘要：`app/src/server/qoder.ts` 是 Work 模式的运行底座——把 Qoder Agent SDK 的 query 循环包成一个可装配、可流式、可取消、可审计的回合（runWorkTurn），Agent 循环本身不自研。
- [后端服务](entities/backend-server.md) — 本页讲本地后端的四件事：HTTP 服务在哪个进程里起来、路由分几层、代码执行与工具调用的边界画在哪、前端拿到的是什么样的调用面。
- [构建与打包体系](entities/build-pack-system.md) — 一句话摘要：三套 tsconfig 把 app/src 的 TS 原位编译回迁移前的 JS 路径，build.ts 组装单文件渲染层，pack.ts 用本机 Electron 运行时产出便携 exe 并自检加冒烟。
- [Electron 桌面壳](entities/electron-shell.md) — 一句话摘要：Electron 主进程与 preload 安全桥——管窗口、托盘、全局快捷键、单实例锁、本地服务与 IPC 白名单，把桌面能力经 `window.csDesktop` 透出给渲染层。
- [前端渲染层](entities/frontend-renderer.md) — 一句话摘要：ChatScience 渲染层的唯一手写源码——单文件主脚本 `webapp.ts` + Work 扩展模块 + HTML 模板，经构建期拼接内联为桌面窗口内的运行代码。
- [账本与计费](entities/ledger-billing.md) — 本页先把两个同名"账本"拆开：代码里的 ledger 是科研证据链台账，与商业化计费无关；计费体系只有设计、没有任何实现，因此缺口全部列明。 〔disputed〕
- [记忆与知识库](entities/memory-knowledge.md) — 后端里有四套互不相同的"记住东西"的机制——项目记忆、知识库检索、用户级 Qoder 记忆读取、实验笔记——本页把它们各自的作用域、写入口径与能力边界分开讲清。
- [墨台产品](entities/motai-product.md) — 一句话摘要：墨台是一台"本地优先"的桌面科研工作台——Electron 壳里跑一个本地 HTTP 后端，由墨道主智能体编排子智能体与科研插件，对外名称在不同层分别是 墨台 / ChatScience / chatscience-desktop / ChatScience.exe。
- [墨台产品页站点](entities/motai-site.md) — 一句话摘要：motai-site 是墨台的对外单页站点工作目录——一个静态首页加一个只做"提交与读取"的匿名反馈接口，站点发布状态记录在同目录的 `.qoder.site` 描述符里。
- [科研领域插件](entities/research-plugins.md) — 一句话摘要：`app/server/plugins/<domain>/` 是墨道的学科外挂——包内声明子智能体、技能、命令、工具与角色覆写，宿主只做声明式装配，换学科不改一行宿主代码。
- [沙箱与工作台](entities/sandbox-workspace.md) — 沙箱引擎把 python / node / shell 代码段放进独立子进程执行并回传产物，工作台的「沙箱页」与「运行页」是它的两个前端入口；本页讲模块组成、目录约定、执行链路与验证覆盖。
- [设置页](entities/settings-page.md) — 一句话摘要：设置页是挂在 body 上的全屏覆盖层「左导航 + 右内容面板」，六组十五节，把 Work 侧栏四个入口收为唯一挂载点，同时与侧栏双入口共用构建器。
- [子智能体体系](entities/subagent-system.md) — 一句话摘要：墨台有两层智能体——UI 可切换的内置智能体（墨道 `agent-orchestrator`、墨析 `agent-discuss`）与**不进切换器**、只经 `options.agents` 注册给墨道委派的七类科研子智能体。
- [主题系统](entities/theme-system.md) — 一句话摘要：主题系统是渲染层的令牌换肤机制——light/dark 双基座加 12 套扩展配色预设，靠 `html[data-theme]` 单属性切换、localStorage 持久化，八套扩展主题另带初始态壁纸。
- [验证套件](entities/verification-suite.md) — 一句话摘要：app/verify 的 37 个脚本没有一个测试框架，统一入口 verify-suite 只做发现、分层、手写/编译判定与退出码透传。
- [Wiki 系统](entities/wiki-system.md) — 一句话摘要：仓库自带一个 LLM 维护的三层知识库（Raw / Wiki / Schema），配套一个 733 行的机械校验器 wiki-lint，它只做契约已承诺的检查与三种维护动作。
- [Work 模块群](entities/work-modules.md) — `app/src/webapp/work/` 下 14 个以两位数字前缀排序的全局脚本模块，编译后由构建脚本内联成一个 IIFE 注入渲染层，承担 Work 模式的页面、状态、后端访问与 Agent 会话接管。

## 概念（concepts/）

- [Agent 委派模式](concepts/agent-delegation.md) — 一句话摘要：墨道用 SDK 的 `Agent` 工具 + `options.agents` 注册表做委派——子智能体是**父会话内的执行分支**（靠 `parent_tool_use_id` 标识），没有独立会话、不能互相调度、权限判定按 `agentID` 留痕。
- [智能体可观测性](concepts/agent-observability.md) — 一句话摘要：墨台的观测面分四层——实时 SSE 事件流、旁路 JSONL 工具审计、项目作用域的科研台账、以及插件装配自检；共同纪律是「观测是旁路，不阻断会话，但失败必须可见」。
- [构建产物同步纪律](concepts/artifact-sync.md) — 一句话摘要：app/src 是唯一手写源，JS 产物由三套 tsconfig 原位编译而来；改完源必须跑 build:ts，否则产物滞后，任何写在产物上的行号与改动都会在下次构建时被覆盖。
- [算力与权限解耦](concepts/billing-quota-decoupling.md) — 本页记录"余额决定能不能跑、档位决定能用哪些功能"这条设计铁律，与代码里当前**真实存在**的三条独立判定通道（权限、工具可见集、资源护栏）之间的差距；商业额度那一半仍是纯设计。 〔draft〕
- [品牌与命名纪律](concepts/brand-naming.md) — 一句话摘要：裁定口径是「墨台 / 墨道」为唯一产品名、ChatScience 降为英文与工程代号、InkForge 只作视觉基因库不作命名；代码现状与这条口径仍有一处结构性落差——产品 UI 与产物名里没有"墨台"。
- [BYOK 认证与额度打回](concepts/byok-auth.md) — 一句话摘要：Work 模式的模型调用只走用户自带 Key（BYOK）注册的模型 id，平台订阅档位路由已被移除；「设置 `resolveModel` 回调反而把会话打回 credits 通道」是本页最贵的实测结论（尚未复现，故 status: draft）。 〔draft〕
- [对话区与输入区不变式](concepts/chat-input-invariants.md) — 一句话摘要：对话区与输入区必须长期成立的行为约束——模式严格跟随记录、Work 无工作区静默回落 Chat、Enter 发送、流式逐帧渲染、加号菜单挂 body——及其验证方式。
- [开发环境与命令约束](concepts/dev-environment.md) — 一句话摘要：所有 npm 命令都在 app/ 目录执行，产物路径与脚本 cwd 都按「相对 app 根」写死；Windows 侧还有宿主环境变量泄漏、保留端口段与换行三处固定坑。
- [领域路由与角色](concepts/domain-routing.md) — 本页讲两件相关但独立的事：按任务信号建议启用哪个领域插件包（路由），以及插件包能对底座的七个科研环节角色改什么、不能改什么（角色覆写）。共同点是「换学科只换包，不改宿主」。
- [MCP 凭据带外化](concepts/mcp-credentials.md) — 本页讲 MCP 相关配置里"哪些值可以进 git、哪些必须走带外通道"，以及代码用哪些机制保证明文凭据不落进仓库；规则是：进库的清单只放变量与空 env，真实凭据一律留在被忽略的运行时目录或由服务端持有的凭据里。
- [踩坑实录](concepts/pitfalls-log.md) — 一句话摘要：只收 Raw 里已核实、带出处的坑——工具链改写、Windows 运行时泄漏、UI 可见性假象、文档口径漂移四类，每条给现象、根因与出处。
- [宣传合规红线](concepts/promo-compliance.md) — 一句话摘要：七条红线的可执行版本——只宣传代码里已经存在的能力、额度表述必须分三条线说清、不宣称绝对隔离、物料先清密钥、学术用途要写边界；其中"待实现不宣传"这一条已经和子智能体的实现进度脱节。
- [沙箱边界](concepts/sandbox-boundaries.md) — 本页界定墨台到底允许执行什么、路径与网络约束在哪一层生效、审批与拒绝走哪两条通道、失败以什么形式回到用户和模型面前。核心结论：这是防误操作的工程边界，不是安全隔离。
- [主题令牌契约](concepts/theme-token-contract.md) — 一句话摘要：主题令牌契约规定每套主题必须命名化覆盖哪几组令牌、必须守住哪条对比度与色相距离门槛、新增一套主题要同时落在哪几个注册点，以及配色如何随壁纸取值。
- [动效与布局约定](concepts/ui-motion-layout.md) — 一句话摘要：动效与布局约定锁定三栏几何量（标题栏 36px / 左栏 256px / 竖条 52px / 右栏 320px）与一套时长档，核心纪律是"内容更新绝不触发容器动画"，靠 `.anim` 门控、状态类与签名守卫三件事兜住。
- [UI 验证方法论](concepts/verification-method.md) — 一句话摘要：这个项目不用单元测试框架，UI 结论一律来自「拉起真实 exe → CDP 真实鼠标点击 → getBoundingClientRect 与 getComputedStyle 双通道断言 → 截图留证」的可复现链路。

## 资料摘要（sources/）

- [AgentsView 调研与安装报告](sources/agentsview-report.md) — 一句话摘要：一次「给编码智能体找可观测性工具」的选型与落地记录（2026-09-12）——`better-harness` 因宿主无插件生命周期而装不上，改用旁路读取会话文件的 AgentsView v0.42.0，并留下三份统计导出。
- [品牌资产与站点素材](sources/brand-and-site-assets.md) — 一句话摘要：这一簇是四组静态 Raw 资产——InkForge 品牌图 11 张、八套壁纸源图、产品页站点目录与根目录旧站点文件；其中只有壁纸真正进入了产品，其余是宣传侧与基因库素材。
- [测试文件夹人工验证记录](sources/manual-test-notes.md) — 测试文件夹/ 是 Work 模式人工验收用的工作区夹具与四份手写记录；本页只登记这些记录能证明什么、不能证明什么，不复写其内容。
- [01-UI板块实现策划案](sources/plan-01-ui.md) — 一句话摘要：这份策划案把墨台客户端的视觉与交互层拆成设计语言、令牌、主题、字体、栅格、布局、组件、图标、动效、可访问性十章，并给出 A–E 五组落地清单；其"已实现"数字是 2026 年 9 月快照，多处已被源码推进。
- [02-前端板块实现策划案](sources/plan-02-frontend.md) — 一句话摘要：前端板块（技术栈、模块划分、构建链路、状态与通信、性能、工程化）的实现策划案，开篇即声明"凡与已实现冲突一律以已实现为准"。
- [03-后端板块实现策划案](sources/plan-03-backend.md) — 这份策划案把本地后端层按「已实现 / 部分实现 / 待实现」三档盘了一遍，并在末章给出可施工的补齐清单；本页提炼它的论证结构与逐条核对源码后的出入。
- [04-Agent系统设计实现策划案](sources/plan-04-agent.md) — 一句话摘要：Work 模式「墨道」智能体系统的蓝图 + 已实现/待实现核对清单（编制于 2026-09），它自评「六个板块中差异最大」`墨台实现策划案/_src/04-Agent系统设计.md:619`；本记录保留其设计骨架与决策，其中大量"待实现"项已被当前源码推翻。
- [05-宣传板块实现策划案](sources/plan-05-promotion.md) — 一句话摘要：这份策划案盘点了墨台宣传资产的现状与四套品牌名并存的风险，给出"墨台/墨道 为唯一产品名"的统一方案，并把七条宣传合规红线定成硬纪律。
- [06-订阅预付费板块实现策划案](sources/plan-06-billing.md) — 一句话摘要：这份策划案规划了积分与 Token 双计量、个人四档与团队三档会员、免费用户与签到、增值充值包，同时给出版本号级的关键结论——该板块在代码里实质零实现。
- [07-设置页改造策划案](sources/plan-07-settings.md) — 一句话摘要：这份策划案把左下角的设置下拉框改成全屏独立设置页，定稿了导航分组、侧栏迁移、进入返回交互与「外壳随主题 / 内容区钉白」的视觉裁定，并累积了三批补充裁定。
- [TypeScript 迁移说明](sources/ts-migration.md) — 一句话摘要：这份 Raw 记录了 2026-09-13 把 19 个源文件改写为 TypeScript 的取舍、编译配置与踩坑，核心承诺是「产物落回原路径、对外行为不变」。
- [验证报告簇](sources/verify-reports.md) — 一句话摘要：两份 Raw 报告（2026-09-04 起多轮追加、2026-10-04 全功能复核）加三份 metrics JSON，构成项目全部实测结论与口径来源。

## 综合与回填（syntheses/）

- [有意保留的已知缺陷](syntheses/known-defects.md) — 一句话摘要：这些都是"代码里看得见、文档里承认"的已知问题，不是新 bug——每条给现象、证据、影响面与是否被验证脚本覆盖，用来判断哪些能安全忽略、哪些一动就要补断言。
- [策划案与源码偏差清单](syntheses/plan-vs-code-gaps.md) — 一句话摘要：七份策划案写于实现之前，本页把已逐条回读原文核对过的偏差集中列出——每条给资料出处、源码现状与处置建议，用于决定"改文档"还是"补实现"。
- [验证脚本与功能矩阵](syntheses/verify-feature-matrix.md) — 一句话摘要：`app/verify` 现有 37 个脚本、分五层登记在套件里，其中 23 个是手写 JS、14 个由 `app/src/verify/*.ts` 编译；2026-10-05 新增的四个脚本把"科研能力真跑 + 右栏预览 + 过程连拍"补进了覆盖面，但也留下两处描述性数字滞后。
