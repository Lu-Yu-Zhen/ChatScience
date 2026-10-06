---
type: concept
title: 动效与布局约定
tags: [动效, 布局, 三栏, reduced-motion, UI]
sources: [01/主页面.html, app/src/webapp/webapp.ts, app/verify/anim-coord-check.js, app/verify/layout-center-check.js, app/verify/layout-refine-check.js, 墨台实现策划案/_src/01-UI.md]
updated: 2026-10-06
status: stable
---

# 动效与布局约定

> 一句话摘要：动效与布局约定锁定三栏几何量（标题栏 36px / 左栏 256px / 竖条 52px / 右栏 320px）与一套时长档，核心纪律是"内容更新绝不触发容器动画"，靠 `.anim` 门控、状态类与签名守卫三件事兜住。

## 布局常量

- `--titlebar-h: 36px`（`01/主页面.html:24`），`body` 以 `padding-top: 36px` 占位（`01/主页面.html:1440`）；纯浏览器下标题栏隐藏并把该令牌改成 0（`app/src/webapp/webapp.ts:2105`）。
- 左栏宽度单一事实来源 `--left-w: 256px`（`01/主页面.html:27`），栏宽与隐藏位移共用它：`#leftPanel.hidden { margin-left: calc(-1 * var(--left-w, 256px)); }`（`01/主页面.html:1755`），行内宽度取同一变量（`01/主页面.html:1957`）。竖条态走 `!important` 覆盖成 52px、左右内边距收成 5px（`01/主页面.html:1759`），内容用 `visibility: hidden` 而非 `display: none`（`01/主页面.html:1760`），竖条按钮 36×36 圆角 11px（`01/主页面.html:1764`）。
- 右栏 320px（`01/主页面.html:2128`），收起即 `margin-right: -320px`（`01/主页面.html:1750`）；阅读模式强制展开并把宽度改成 30%，构成文档 70 : 消息 30（`app/src/webapp/webapp.ts:5977-5981`）。
- 中栏内容限宽 920px 居中（`01/主页面.html:2052-2053`）；左栏可见时中栏左上角 12px 小圆角，左栏隐藏后不加（`01/主页面.html:1877-1879`）。
- 主窗 1320×880、最小 980×620，子窗 1080×760 同最小限制（`app/src/main.ts:168`、`:229`）。
- 消息导航条圆点 14×4、当前项转 `--link` 且宽 20px（`01/主页面.html:1894-1896`），hover 展开的整行文本上限 280px（`01/主页面.html:1903`）。

## 时长与缓动档

标准缓动统一 `cubic-bezier(0.22, 1, 0.36, 1)`；颜色/背景/边框用 `ease`；布局尺寸用 `ease-in-out`。实测档位：

| 时长 | 用途 | 证据 |
|---|---|---|
| 0.14s | 菜单项 hover 三属性 | `01/主页面.html:1557` |
| 0.18s | 会话项、开关滑块 `left`、导航选中态 | `01/主页面.html:1639`、`:1634` |
| 0.2s | 下拉渐显 `csMenuFade`、设置页进场 | `01/主页面.html:1552`、`app/src/webapp/webapp.ts:761` |
| 0.25s | 主题色过渡（body / .panel 背景与边框） | `01/主页面.html:1444`、`:1467` |
| 0.28s ease-in-out | 左右栏平推、阅读模式进出 | `01/主页面.html:1749`、`:1754`、`:1777-1778` |
| 0.5s / 0.55s | 初始态↔对话态布局过渡、进场与模式切换动画 | `01/主页面.html:1867-1868`、`:1467`、`:1929-1930` |

两处刻意的不对称：设置页退场比进场短（0.18s，`app/src/webapp/webapp.ts:783`），消息入场在 JS 侧改用 0.45s 且只给最后两条播动画、历史消息静止（`app/src/webapp/webapp.ts:4539-4542`）。

## 三条硬纪律

1. **侧栏过渡只在 `.anim` 存在时启用**：`#leftPanel.anim` 才挂 `transition`（`01/主页面.html:1754`），JS 在 `setLeftPanelHidden` / `setLeftRail` 里加类、并在 340ms 后移除（`app/src/webapp/webapp.ts:2070-2079`、`:2080-2091`）；触发点只有折叠按钮（`app/src/webapp/webapp.ts:2095-2097`）与全局快捷键 `Ctrl+Alt+L`（`app/src/main.ts:291`、桥接 `app/src/webapp/webapp.ts:2098-2100`）。
2. **状态类驱动布局，不给组件本体加 animation**：初始态由 `body.is-initial-chat` 把 `.chat-body` 的 `padding-bottom` 设成 34vh、`#chatScroll` 收成 `flex: 0 0 auto`（`01/主页面.html:1873-1874`），平滑全靠 `padding-bottom` 与 `flex-grow` 两条 0.5s 过渡（`01/主页面.html:1867-1868`），而 `#inputArea` 与其 `.input-box` 被强制 `animation: none !important`（`01/主页面.html:1869`）；该类由 `syncInitialChatFlag()` 按"聊天视图 + 非阅读模式 + 零消息"打点，与欢迎区渲染条件严格同进同退（`app/src/webapp/webapp.ts:3665-3671`）。
3. **列表重建必须带签名守卫**：项目树（`app/src/webapp/webapp.ts:3254-3255`）、会话列表（`app/src/webapp/webapp.ts:3612-3614`）、右栏（`app/src/webapp/webapp.ts:5156-5165`）内容未变则只原位切类，不重建 DOM；头像走 Blob URL 共享而非逐行重复解码 base64（`app/src/webapp/webapp.ts:2630-2636`）。

另有两条静默机制：Chat/Work 切换用 `csModeSlide` 水平侧滑，方向由 `--cs-slide-x` 决定（`01/主页面.html:1923-1927`），每个导航项行内挂同一关键帧与方向变量（`app/src/webapp/webapp.ts:1992`），项目/对话列表按模式取 ±18px 并加 `.cs-sync-slide` 同步平移（`app/src/webapp/webapp.ts:2051-2056`）；首启由 `html.cs-boot` 抑制侧栏/输入框进场动画，双 rAF 后移除（`01/主页面.html:1468-1474`、`app/src/webapp/webapp.ts:7254-7261`）。`prefers-reduced-motion: reduce` 有三处降级：全局 `.panel/.msg` 与各过渡（`01/主页面.html:1932-1935`）、设置页导航（`01/主页面.html:1634`）、自定义下拉（`01/主页面.html:1683`）。

## 字号缩放带来的坐标问题

界面字号是 body 上的 CSS `zoom`（五档 0.9/0.95/1/1.05/1.1，`app/src/webapp/webapp.ts:1588-1595`），这让 `getBoundingClientRect` 的视觉坐标与写回 `style.left` 的 CSS 坐标不一致，因此用一次性探针实测比值 k 并缓存，定位一律除以 k（`app/src/webapp/webapp.ts:1596-1613`）。滑块刻度也按 thumb 行程反算：刻度 `left: calc(8px + (100% - 16px) * i/4)`，且刻度行必须留在与滑条同宽的容器内（`app/src/webapp/webapp.ts:1511-1519`、`:1546-1548`）。

## 冲突与验证

- ⚠️ 冲突：策划案写左栏 280px、三处一致（`墨台实现策划案/_src/01-UI.md:15`、`:404`、`:792`），源码是 256px 变量，见[01-UI板块实现策划案](../sources/plan-01-ui.md)。
- ⚠️ 冲突：策划案把布局类动效上限写成 0.28s（`墨台实现策划案/_src/01-UI.md:702`），源码存在 0.5s / 0.55s 档（`01/主页面.html:1867-1868`、`:1929`），见[01-UI板块实现策划案](../sources/plan-01-ui.md)。
- `app/verify/anim-coord-check.js` 检四组协调性：导航项与列表容器同关键帧零延迟（`:45-48`）、初始态输入框在中部且发送后向下过渡（`:55-71`）、`msgIn` 起点 translateY 为正（`:76-77`）、三处下拉都有 `csMenuFade`（`:83`）。
- `app/verify/layout-center-check.js` 检标题栏 ≤47px（`:52`）、中栏左上圆角 12px（`:55`）、初始态整组中心高于几何中心 ≥40px（`:67`）、发送后归底 ≤24px（`:76`）。
- `app/verify/layout-refine-check.js` 检左栏右缘竖线与分组横线已移除（`:54-56`）、输入框无 keyframe 动画（`:75-76`）、模式切换后 `.chat-body` 不挂 `swap-anim`（`:88-89`）。
- 三个脚本 + `app/verify/input-edge-check.js` 都登记在 UI 层，见 `app/src/verify/verify-suite.ts:63-67`。

## 关联

- 概念：[主题令牌契约](../concepts/theme-token-contract.md)、[对话区与输入区不变式](../concepts/chat-input-invariants.md)
- 实体：[前端渲染层](../entities/frontend-renderer.md)、[验证套件](../entities/verification-suite.md)
- 资料：[01-UI板块实现策划案](../sources/plan-01-ui.md)
