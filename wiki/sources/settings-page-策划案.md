---
type: source
title: 设置页信息架构改造策划案摘要
tags: [设置页, 信息架构, 导航, 覆盖层, 偏好持久化]
sources: [墨台实现策划案/_src/07-设置页改造.md]
updated: 2026-09-18
---

# 设置页信息架构改造策划案摘要

2026-09-15 定稿、09-16 两批扩展：左下角「设置」由弹出小下拉框改为独立全屏设置页，Work 侧栏部分入口迁入，形成六组十五项导航。改造范围仅 `app/src/webapp/`（`01/` 为同步副本）。

## 核心内容

- **信息架构定稿**：§3 导航从四组十项扩至**六组十五项**（通用/模型/墨道·Work/知识与扩展/智能体行为/工作区）；智能体、沙箱、笔记本、运行自 Work 侧栏迁入且**唯一挂载点=设置页**；知识与数据库、技能与插件、连接器**双入口保留**（共用构建器+同一份数据，零复制代码）。⚠️ MEMORY.md 落地版分组明细与此略有出入（如「记忆」归入墨道·Work 组），见 [设置页](../entities/设置页.md)。
- **载体裁定**：全屏覆盖层 `#settingsPage`（body 直挂、fixed inset:0）而非新增 view 分支——不动 renderMessages 等任何分支，返回即精确还原、SSE 不中断，回归面最小。
- **兼容路由**：`openWorkPage` 收到 work-agents/sandbox/notebook/run 四 key 一律转发 `openSettings`，覆盖全部旧调用点与深链。
- **视觉裁定（§8）**：外壳随主题、内容区 `.settings-paper` 全主题钉白；后按用户反馈操作区改淡灰 `--settings-canvas: #F8F9FB`。
- **落地清单（§2 代码锚点）**：改动集中于 `主页面.html`（删 settingsMenu）、`webapp.js`（openSettings/closeSettings、三面板）、`work/90-boot.js`（_SIDEBAR 删四项、pills 改跳转）。
- **九项交互细化（§10）**：导航幂等守卫（同 id 不刷新，force 例外）、技能页表格/列表视图切换、个人资料页重构、zip 本地上传（⚠️ PowerShell Compress-Archive 写反斜杠路径需归一化）、开关统一滑动块、`--btn-primary-bg/-hover` 逐主题按钮色等。
- **验收**：9+4 项清单；无头 Chrome CDP 17 项断言全过；后端改动（`/api/work/plugins/save`）需重启应用生效。

## 关联
- 实体：[设置页](../entities/设置页.md)、[前端架构](../entities/前端架构.md)、[主题系统](../entities/主题系统.md)
- 概念：[构建产物同步陷阱](../concepts/构建产物同步陷阱.md)、[动效与布局约定](../concepts/动效与布局约定.md)
- 同批资料：[ui-design-策划案](ui-design-策划案.md)、[frontend-策划案](frontend-策划案.md)
