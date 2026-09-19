---
type: source
title: MEMORY-detail 细节分卷摘要
tags: [长期约定, 设计令牌, 定价, 壁纸, 构建]
sources: [.workbuddy/memory/MEMORY-detail.md]
updated: 2026-09-18
---

# MEMORY-detail 细节分卷摘要

`.workbuddy/memory/MEMORY-detail.md` 是墨台长期约定的**细节分卷**：`MEMORY.md` 只留索引级硬约束，本卷承载长枚举与实现细节，按需查阅。共五卷。

## 卷一 · 主题令牌实测值

- **sky-sea**（09-16 整族下移 Δ(R−12,G−4,B+3) 后）：panel #E4F2FE / panel-border·border #D0E3F5 / border-soft·menu-border #DCEDFB / accent-soft·chip #D9ECFC / conv-active #D7EAF9 / scroll-thumb #CEE2F3（hover #BAD4E9）/ selection-bg #C6DFF3 / toggle-off #B7CEE1。
- **cinnabar（水墨江南）**：--bg #F5F2EC / --panel-bg #FAF8F4 / --text-1 #23211E / --primary-bg #2E3438 黛瓦墨 / --link #35566B 黛青 / --danger-text #A8332A。
- **glass（万山红遍）**：--bg #F7F1EA / --panel-bg #FAF6F1 / --text-1 #2A211A / --primary-bg #9E3B22 赭红 / --link #2F5D7A；--canvas-bg 实色 #FFFFFF（body 渐变与 backdrop-filter 已删）。
- 新增令牌清单（--focus-border/--selection-*/--close-hover/--toggle-off/--toast-shadow/--hl-anno/--hl-search/--accent-wash/--paper 族/--chart-1..6）；纸纹 cinnabar 0.04 / nostalgia 0.06。
- ⚠️ 本卷仅列三套主题现状值；十二套完整表在 `MEMORY.md` 主题系统节（见 [主题系统](../entities/主题系统.md)）。

## 卷二 · 产品页区块与定价

三页区块归属、双站定价（国际站个人 $20/$50/$100/$200、团队 $39/$99/$189、第四档 Ultra）、分站支付方式（中国四种/国际六种，均保留兑换码）、长句主张「让科研从重复劳动中解放，把精力还给思考」。

## 卷三 · 初始态壁纸映射与实现

五主题壁纸映射（ink-green←只此青绿 / sky-sea←天空与蓝 / cinnabar←水墨江南 / nostalgia←城南旧事 / glass←万山红遍；源图 `D:\ChatScience\主题壁纸\`）；统一口径 base64 内联、长边 1600 / JPEG q82 / progressive；注入脚本 `C:\Temp\inject_wallpaper.js`（幂等，CS_INK_WALLPAPER_START/END 标记）。⚠️ 09-17 壁纸已扩至八主题（+snow-moon/office-daily/yanyun），本卷的"五主题"记载滞后于 MEMORY.md。

## 卷四 · 设置页实现细节

五组偏好面板（SETTINGS_PREF_PANELS，持久化 cs-set-*，未联动后端如实标注）、技能页双选项卡、zip 浏览器端解析（EOCD+中央目录+DecompressionStream；⚠️ PowerShell Compress-Archive 写反斜杠路径须归一化）、个人资料页与侧栏共用键、九项 UI/UX 细化清单、**CDP 验证范式**（window.CS_BACKEND 桩 + fetch 拦截可在纯浏览器测后端依赖页；无头 Chrome 易被沙箱回收，跑前先探 /json/version）。详见 [设置页](../entities/设置页.md)。

## 卷五 · 构建与后端模块

build.ts 三段拼接（字典序、断言首 00-core/末 90-boot、函数式 replace）；后端 12 模块清单；`SDK应用/` 试验沙箱不参与构建、`app/dist/` 为产物勿当源码读；git 基线 a31f729→1bdcfa1→9592f22；状态标记【已实现】/【部分实现】/【待实现】。详见 [构建打包体系](../entities/构建打包体系.md)、[后端服务](../entities/后端服务.md)。

## 关联
- 索引卷：`MEMORY.md`（未建页；本卷是其细节展开）
- 实体：[主题系统](../entities/主题系统.md)、[设置页](../entities/设置页.md)、[构建打包体系](../entities/构建打包体系.md)、[后端服务](../entities/后端服务.md)、[墨台产品](../entities/墨台产品.md)
- 概念：[踩坑实录](../concepts/踩坑实录.md)、[验证体系](../concepts/验证体系.md)
- 资料：[workbuddy-daily-logs](workbuddy-daily-logs.md)
