---
type: source
title: 07-设置页改造策划案
tags: [设置页, 信息架构, 主题, 策划案, UI]
sources: [墨台实现策划案/_src/07-设置页改造.md, 01/主页面.html, app/src/webapp/webapp.ts]
updated: 2026-10-06
status: stable
---

# 07-设置页改造策划案

> 一句话摘要：这份策划案把左下角的设置下拉框改成全屏独立设置页，定稿了导航分组、侧栏迁移、进入返回交互与「外壳随主题 / 内容区钉白」的视觉裁定，并累积了三批补充裁定。

## 资料是什么

单份 markdown，路径 `墨台实现策划案/_src/07-设置页改造.md`，状态标注【策划确认】（`墨台实现策划案/_src/07-设置页改造.md:3`），改造范围声明只动 `app/src/webapp/`（`:5`）。需求五条原话归纳在 `:9-13`：下拉框改独立页、导航含个人设置/主题/模型配置、Work 侧栏入口迁入、知识与扩展三项双入口保留。

## 定稿要点

本节与下节凡只写 `:行号` 处，资料一律是 `墨台实现策划案/_src/07-设置页改造.md`。

- **导航 IA**：初版"四组十项"（`:31-49`），第二批扩为"六组十五项"，新增「智能体行为」与「工作区」两组（`:128`）；排序理由是个人 → 全局 → Work 专属 → 资源扩展（`:51-55`）。
- **侧栏迁移**：Chat 不变，Work 由 9 项减到 5 项，智能体/沙箱/笔记本/运行 四项从 `_SIDEBAR` 删除（`:59-67`）；`openWorkPage` 收到这四个 `work-*` key 时统一转发到设置页——四个迁移页的唯一挂载点即设置页（`:73`）。
- **载体选择**：用全屏覆盖层 `#settingsPage` 而非新增 view 分支，理由是不动 `renderMessages` / `renderConversations` / `setSidebarMode` 任何分支，底层 DOM 原样保留、返回即精确还原（`:78-81`）。
- **进入与返回**：进场 200ms `cubic-bezier(0.22,1,0.36,1)`，`prefers-reduced-motion` 时直接显隐；落点优先级"深链指定 > 上次访问（localStorage `cs-settings-section`）> 默认"（`:84-86`）；返回走「← 返回」+ Esc，进行中的流式回复不中断（`:88-91`）。
- **视觉裁定**：外壳（顶栏 + 左导航）随主题，右侧 `.settings-paper` 在所有主题下钉白，导航右边界用 `--border` 而非 `--border-soft`（`:119-121`）。
- **五个偏好分类**：钩子 / 记忆 / 电脑操控 / Git / Worktrees 以描述符驱动的 `SETTINGS_PREF_PANELS` 实现，挂载进 `#settingsWorkBody`，能力状态如实标注「筹备中」不虚标（`:127-132`）。
- **九项交互裁定**：同节幂等守卫、技能页表格/列表双视图、钩子图标改锚形、个人资料页重构、技能/插件本地上传、笔记本 markdown 默认渲染、`.toggle` 40×22 滑动块、按钮主色令牌化、操作区底色由纯白改淡灰 `--settings-canvas: #F8F9FB`（`:150-158`）。
- **验收清单**：9 条主清单（`:105-115`）+ 4 条补充（`:141-144`），逐条可点验。

## 与当前源码的偏差（以源码为准）

- ⚠️ 冲突：主题项数。资料写"主题 8 项（跟随系统/亮色/暗色 + 青绿/海天/朱砂/旧事/玻璃）"（`:36`、`:111`），源码是 3 档主题模式下拉 + 12 张扩展主题卡，见[主题系统](../entities/theme-system.md)。
- ⚠️ 冲突：记忆归属。资料把「记忆」列在「智能体行为」组（`:46`），源码把 `memory` 放进「墨道 · Work」组，该组只剩钩子与电脑操控两项（`app/src/webapp/webapp.ts:641-656`），详见[设置页](../entities/settings-page.md)。
- ⚠️ 冲突：偏好持久化。资料写五份 localStorage 键 `cs-set-hooks / cs-set-memory / cs-set-computer / cs-set-git / cs-set-worktrees`（`:130`），源码只有电脑操控与外观的字体/字号仍走 `cs-set-*`（`app/src/webapp/webapp.ts:1297-1311`、`:1484-1485`），记忆 / Git / Worktrees / 内容宽度改由后端 `/api/work/prefs` 读写（`app/src/webapp/webapp.ts:854-872`、`:1219-1220`、`:1557`），钩子面板是只读扫描（`app/src/webapp/webapp.ts:1273`），见[设置页](../entities/settings-page.md)。
- ⚠️ 冲突：外壳底色取值口径。资料写"取 `var(--bg)`"（`:119`），源码默认取 `var(--panel-bg)`，只在 light 下覆盖为 `--bg`（`01/主页面.html:1355-1356`），见[主题令牌契约](../concepts/theme-token-contract.md)。
- ⚠️ 冲突：静态面板数量。资料写"个人设置 / 主题 / 模型三面板"（`:98`），源码 `SETTINGS_STATIC_PANELS` 只剩 personal 与 models，外观节改为动态构建（`app/src/webapp/webapp.ts:662-663`），见[设置页](../entities/settings-page.md)。
- 行号引用已漂移：资料第 2 节的锚点 `墨台实现策划案/_src/07-设置页改造.md:19-27` 指向编译前的 JS 产物行号，产物每次构建都会重写，当前实现一律以 `app/src/webapp/webapp.ts` 与 `app/src/webapp/work/90-boot.ts` 为准。

## 策划案里仍成立的部分

以下裁定在源码中逐条对得上，可直接当现状读：

- 幂等守卫与其例外（首开/深链/语言重建走 force）（`墨台实现策划案/_src/07-设置页改造.md:150`，实现 `app/src/webapp/webapp.ts:727-734`）。
- 兼容路由四个 key 一律转发、其余 key 保持原行为（`墨台实现策划案/_src/07-设置页改造.md:73`，实现 `app/src/webapp/webapp.ts:2168-2173`）。
- 内容区钉白与 `--settings-canvas` 由 `#F3F4F7` 调浅为 `#F8F9FB`（`墨台实现策划案/_src/07-设置页改造.md:120`、`:158`，实现 `01/主页面.html:1361-1365`）。
- 偏好面板描述符驱动、统一挂进 `#settingsWorkBody`（`墨台实现策划案/_src/07-设置页改造.md:129`，实现 `app/src/webapp/webapp.ts:1214`）；面板内对齐采"标题/分组居中、操作行文字在左控件在右"（`app/src/webapp/webapp.ts:802-806`），导航列固定 216px（`01/主页面.html:2155`）。
- 词条落点：`data-i18n` 放内层 span、面板头标题/副标题取自构建器（`墨台实现策划案/_src/07-设置页改造.md:99`、`:81`，实现 `app/src/webapp/webapp.ts:692-710`）。

## 关联

- 实体：[设置页](../entities/settings-page.md)、[主题系统](../entities/theme-system.md)、[前端渲染层](../entities/frontend-renderer.md)
- 概念：[主题令牌契约](../concepts/theme-token-contract.md)、[动效与布局约定](../concepts/ui-motion-layout.md)
- 资料：[01-UI板块实现策划案](plan-01-ui.md)
