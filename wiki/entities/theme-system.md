---
type: entity
title: 主题系统
tags: [主题, 设计令牌, 壁纸, UI, 墨台]
sources: [app/src/webapp/webapp.ts, 01/主页面.html, 主题壁纸/, app/verify/settings-e2e.js, app/verify/input-edge-check.js]
updated: 2026-10-06
status: stable
---

# 主题系统

> 一句话摘要：主题系统是渲染层的令牌换肤机制——light/dark 双基座加 12 套扩展配色预设，靠 `html[data-theme]` 单属性切换、localStorage 持久化，八套扩展主题另带初始态壁纸。

## 由哪些部分组成

- **令牌层**：`01/主页面.html` 的 `:root` 定义 68 个自定义属性（`01/主页面.html:20-92`），`html[data-theme="dark"]` 成对覆盖（`01/主页面.html:93-160`）；12 套扩展主题每套同样写满 66 行令牌赋值（如 `01/主页面.html:169`）。
- **切换逻辑**：`applyTheme()` 读 `localStorage.getItem('cs-theme')`，值为 `system` 时按 `prefers-color-scheme` 解析成 light/dark，否则原样用作 `data-theme`（`app/src/webapp/webapp.ts:533-536`）；系统偏好变化只在 `system` 下重解析（`app/src/webapp/webapp.ts:543`）。
- **选择入口**：设置页「外观」节，主题模式下拉三档 light/dark/system（`app/src/webapp/webapp.ts:1412-1423`）+ 12 张预览卡（`app/src/webapp/webapp.ts:1428-1449`）；卡片点击由 document 上的委托事件写盘并重解析（`app/src/webapp/webapp.ts:544-550`）。
- **壁纸层**：八套主题的初始态背景，以 base64 内联在 `01/主页面.html:238-346` 的注入段里；素材源文件是 `主题壁纸/` 下的八张 jpeg。
- **同节的其他外观能力**：字体风格五档（黑体/楷体/宋体/行书/等宽，`app/src/webapp/webapp.ts:1478-1486`、`:1575-1582`）、界面字号五档（`app/src/webapp/webapp.ts:1490-1550`，实现是 body 上的 CSS `zoom`，缩放系数 0.9/0.95/1/1.05/1.1，`app/src/webapp/webapp.ts:1588-1595`）、内容宽度三档（`app/src/webapp/webapp.ts:1552-1562`）。

## 关键行为

- **扩展主题不受系统明暗影响**：只有 `system / light / dark` 会走媒体查询，扩展主题是具体配色预设，选中即固定（`app/src/webapp/webapp.ts:526-530`）。
- **主题色只上外壳**：侧边栏、顶部栏浮层吃主题色，聊天画布 `.chat-body` 与右栏 `#rightPanel` 由一条十二主题共用规则把令牌钉回亮色基（选择器 `01/主页面.html:1181-1208`，钉回值 `:1209-1267`），主窗口标题栏 `#mainHeader` 更是全主题恒定亮色（`01/主页面.html:1269-1331`）。
- **按钮与开关随主题但豁免钉回**：`--btn-primary-bg / --btn-primary-hover / --switch-on` 集中定义在所有主题块之后，且明写"不进亮色钉回块"（`01/主页面.html:1333-1350`），消费点 `.btn-primary`（`01/主页面.html:1509`）与 `.toggle.on`（`01/主页面.html:1642`）。
- **壁纸与欢迎态同进同退**：壁纸规则的选择器是 `html[data-theme="X"] body.is-initial-chat #centerPanel`（`01/主页面.html:256`），`is-initial-chat` 由 `syncInitialChatFlag()` 按"聊天视图 + 非阅读模式 + 当前会话零消息"打点（`app/src/webapp/webapp.ts:3665-3671`）；因父级底色写在行内 `background` 简写上，壁纸层必须用 `!important`（`01/主页面.html:250-253`）。
- **有壁纸的只有八套**：注入段列明 白蛇缘起 / 经典QQ / 桃林 / 现代简约 暂无壁纸不注入（`01/主页面.html:240`），八套为 只此青绿 / 天空与海 / 水墨江南 / 城南旧事 / 万山红遍 / 风花雪月 / 办公日常 / 燕云十六声（`01/主页面.html:241-243`、`:256-306`）；内联副本按"长边 1600 / JPEG q82 / progressive"统一口径（`01/主页面.html:248`），字节数小于 `主题壁纸/` 原图，即重编码版本。

## 边界与历史包袱

- **不越界的换肤**：`applyTheme()` 只改根元素的 `data-theme` 与卡片选中态（`app/src/webapp/webapp.ts:533-542`），不触发任何几何变化；持久化键就是 `cs-theme`（`app/src/webapp/webapp.ts:534`）。
- **限定主题只作标注**：`yanyun`（游戏限定）、`white-snake`（影视 IP）、`qq-classic`（品牌风格）三个 `limited` 字段仅是元数据，注释两处声明界面不渲染任何限定标识（`app/src/webapp/webapp.ts:526-530`、`:1424-1426`）。
- **语言与主题是两条线**：语言切换属内容更新，会重挂设置页导航与面板头（`app/src/webapp/webapp.ts:574-575`、`:790-793`），主题切换不需要。
- **暗色不是第五套而是解析结果**：`system` 经媒体查询解析成 light 或 dark，媒体查询变化只在 `system` 下重新解析（`app/src/webapp/webapp.ts:535`、`:543`）。

## 冲突与验证

- 主题不做布局：壁纸层注释直接写明"实现纪律：只改 background 层，不动任何布局/圆角/间距"（`01/主页面.html:255`），换肤的恒定项由[动效与布局约定](../concepts/ui-motion-layout.md)承接。
- 主题切换属内容级更新：`applyTheme()` 只改根属性与卡片选中态（`app/src/webapp/webapp.ts:533-542`），语言切换才需要重挂设置页导航与面板头（`app/src/webapp/webapp.ts:574-576`）。
- 持久化键是 `cs-theme`（`app/src/webapp/webapp.ts:534`、`:548`），字号与字体的持久化另走 `cs-set-appearance`（`app/src/webapp/webapp.ts:1484-1485`）。
- ⚠️ 冲突：策划案裁定"仅实现 light/dark 双主题，六套扩展列为待实现"（`墨台实现策划案/_src/01-UI.md:16`、`:142`），当前源码是 12 套扩展主题，另见[01-UI板块实现策划案](../sources/plan-01-ui.md)。
- ⚠️ 冲突：策划案把设置页主题项写为 8 项（`墨台实现策划案/_src/07-设置页改造.md:36`），验证脚本断言的是 12 张卡，另见[07-设置页改造策划案](../sources/plan-07-settings.md)。
- **验证**：`app/verify/settings-e2e.js:107` 断言 `.theme-card` 恰为 12 张，`:108` 校验六套中文名齐备，`:117-120` 校验点第一/第二卡后 `data-theme` 落到 `modern-minimal` / `ink-green`；`app/verify/input-edge-check.js:38-53` 逐主题断言输入框光晕 `box-shadow` 含预期主题色 rgb 三元组。
- 命名与 id 的历史包袱、对比度与 ΔE 门槛等可核验约束，落在[主题令牌契约](../concepts/theme-token-contract.md)。

## 关联

- 概念：[主题令牌契约](../concepts/theme-token-contract.md)、[动效与布局约定](../concepts/ui-motion-layout.md)
- 实体：[设置页](../entities/settings-page.md)、[前端渲染层](../entities/frontend-renderer.md)
- 资料：[01-UI板块实现策划案](../sources/plan-01-ui.md)
