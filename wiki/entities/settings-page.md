---
type: entity
title: 设置页
tags: [设置页, UI, 信息架构, 墨台, 持久化]
sources: [app/src/webapp/webapp.ts, 01/主页面.html, app/verify/settings-e2e.js, app/verify/settings-geometry.js, 墨台实现策划案/_src/07-设置页改造.md]
updated: 2026-10-06
status: stable
---

# 设置页

> 一句话摘要：设置页是挂在 body 上的全屏覆盖层「左导航 + 右内容面板」，六组十五节，把 Work 侧栏四个入口收为唯一挂载点，同时与侧栏双入口共用构建器。

## 骨架与位置

- 覆盖层节点 `#settingsPage`：`position: fixed`，`top: var(--titlebar-h, 36px)`，`z-index: 90`，默认 `display: none`（`01/主页面.html:2143`），标题栏高度令牌见 `01/主页面.html:24`。
- 左导航 `#settingsNav` 宽 216px、右边界 1px `--border`、底色 `--settings-shell`（`01/主页面.html:2155`）；返回键 `#settingsBackBtn`（`01/主页面.html:2145`）。
- 右内容区 `.settings-paper`：`overflow-y: auto`，内边距 `26px 32px 48px 32px`（`01/主页面.html:2156`）；面板头 `#settingsPanelHead` + `#settingsPanelTitle`（`01/主页面.html:2157-2158`）。
- 两种面板容器：静态面板 `#settingsPersonalPanel`（`01/主页面.html:2161`）与 `#settingsModelsPanel`（`01/主页面.html:2237`）；其余全部走同一个动态容器 `#settingsWorkBody`，`max-width: 980px`（`01/主页面.html:2314`）。

## 导航 IA

`SETTINGS_NAV` 六组，顺序即渲染顺序（`app/src/webapp/webapp.ts:633-661`）：通用（个人设置、主题）、模型（模型配置）、墨道 · Work（智能体、沙箱、笔记本、运行、记忆）、知识与扩展（知识和数据库、技能与插件、连接器）、智能体行为（钩子、电脑操控）、工作区（Git、Worktrees）。导航由 `renderSettingsNav()` 逐组建标签 + 逐行建条目（`app/src/webapp/webapp.ts:672-691`），图标全部内联 SVG、集中在 `SETTINGS_ICONS`（`app/src/webapp/webapp.ts:615-631`）。

- ⚠️ 冲突：策划案把「记忆」列在「智能体行为」组（`墨台实现策划案/_src/07-设置页改造.md:46`），源码把它放在「墨道 · Work」组（`app/src/webapp/webapp.ts:641-647`），另见[07-设置页改造策划案](../sources/plan-07-settings.md)。
- ⚠️ 冲突：策划案的「主题」节含 8 个选项（`墨台实现策划案/_src/07-设置页改造.md:36`），源码的主题节是 3 档模式下拉 + 12 张主题卡，见[主题系统](../entities/theme-system.md)。

## 进出与状态

- 齿轮点击不再开下拉，直接 `openSettings()`（`app/src/webapp/webapp.ts:588-591`）。
- 进入：`display: flex` 后用 0.2s `cubic-bezier(0.22,1,0.36,1)` 的 opacity + `translateY(8px)` 入场，`prefers-reduced-motion: reduce` 时直接显隐（`app/src/webapp/webapp.ts:755-766`）；同时 `document.body.style.overflow = 'hidden'` 锁底层滚动（`app/src/webapp/webapp.ts:767`）。
- 落点优先级：深链指定 > 本次会话已选节 > localStorage `cs-settings-section` > personal，且一律 `force` 重渲染（`app/src/webapp/webapp.ts:771-773`，写入点 `:736`）。
- 退出：0.18s 淡出后 `display: none` 并解锁滚动（`app/src/webapp/webapp.ts:775-789`）；Esc 关闭，但弹窗 `.modal-overlay.visible` 开着时让位（`app/src/webapp/webapp.ts:794-800`）。
- 幂等守卫：同一节且无 `force` 直接 return，页面状态不被打断（`app/src/webapp/webapp.ts:727-734`）；个人设置例外——统计与资料每次进入都重取（`app/src/webapp/webapp.ts:728-730`）。

## 面板来源与复用

- `SETTINGS_STATIC_PANELS` 只保留 personal 与 models 两节为静态 DOM 切换（`app/src/webapp/webapp.ts:662-663`、显隐切换 `:740-744`）。
- 动态节优先查 `SETTINGS_PREF_PANELS`（memory / hooks / computer / git / worktrees / theme 六个构建器，`app/src/webapp/webapp.ts:1214-1567`），查不到才走 `mountSettingsDynamic()` 复用 Work 页构建器 `buildWorkPage('work-' + id)` 与 `buildPapersDbPage()`（`app/src/webapp/webapp.ts:712-726`）。
- 迁移项的唯一挂载点在设置页：`openWorkPage` 收到 `work-agents / work-sandbox / work-notebook / work-run` 一律转发 `openSettings`（`app/src/webapp/webapp.ts:2168-2173`）；Work 侧栏因此只剩技能与插件 / 连接器两项注入（`app/src/webapp/work/90-boot.ts:29-32`），基础三项在 `app/src/webapp/webapp.ts:1965-1971`。
- 所有模型配置入口统一 `openSettings('models')`，原 modal 已退役（`app/src/webapp/webapp.ts:1774-1775`、深链调用 `:1866`）。
- 持久化分两路：偏好走后端 `/api/work/prefs`，GET 注水 + PUT 保存（`app/src/webapp/webapp.ts:854-872`）；外观的字体与字号、电脑操控仍写 localStorage `cs-set-appearance` / `cs-set-computer`（`app/src/webapp/webapp.ts:1484-1485`、`:1299-1311`），读写工具 `prefLoad` / `prefPatch`（`app/src/webapp/webapp.ts:823-838`）。
- 个人资料用本地键 `cs-name / cs-email / cs-avatar / cs-signature / cs-uid`，四项统计取本地真实数据（`app/src/webapp/webapp.ts:7101-7141`）。

## 验证

- `app/verify/settings-e2e.js` 用 CDP 逐节打开并断言真实文本：记忆七项、钩子五项、Git 三项、Worktrees 三项、外观七项（`app/verify/settings-e2e.js:75-112`），其中含「十二张主题卡」计数（`:107`）与「占位行已移除」反断言（`:110`）。
- `app/verify/settings-geometry.js` 打印 `#leftPanel`、`#settingsPage`、`#settingsNav`、`.settings-paper`、`#settingsPanelHead`、`#settingsWorkBody` 与首张 `pref-card` 的矩形并截图（`app/verify/settings-geometry.js:34-43`）。
- 两个脚本都注册在 UI 层，见 `app/src/verify/verify-suite.ts:68-69`。

## 关联

- 实体：[主题系统](../entities/theme-system.md)、[前端渲染层](../entities/frontend-renderer.md)、[验证套件](../entities/verification-suite.md)
- 概念：[UI 验证方法论](../concepts/verification-method.md)、[动效与布局约定](../concepts/ui-motion-layout.md)
- 资料：[07-设置页改造策划案](../sources/plan-07-settings.md)
