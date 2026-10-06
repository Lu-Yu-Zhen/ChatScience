---
type: concept
title: UI 验证方法论
tags: [验证, cdp, ui, 方法论, 墨台]
sources: [app/verify/cdp-ui.js, app/verify/cdp-eval.js, app/verify/settings-geometry.js, app/verify/layout-center-check.js, app/verify/layout-refine-check.js, app/verify/验证报告.md, app/verify/全功能验证报告.md]
updated: 2026-10-04
status: stable
---

# UI 验证方法论

> 一句话摘要：这个项目不用单元测试框架，UI 结论一律来自「拉起真实 exe → CDP 真实鼠标点击 → getBoundingClientRect 与 getComputedStyle 双通道断言 → 截图留证」的可复现链路。

## 通道：先有真实窗口再谈断言

- 每个 UI 脚本自带启动器：从 dist 便携目录 spawn exe 并加 `--remote-debugging-port=<端口>`，等 data/runtime.json 的 mtime 变新以确认后端真的起来了，再读端口与 token（`app/verify/settings-geometry.js:19-24`、`app/verify/layout-center-check.js:36-41`）。
- spawn 前一律剥掉宿主泄漏的 ELECTRON_RUN_AS_NODE，否则 Electron 退化成纯 Node、应用根本不启动（`app/verify/settings-geometry.js:20`；打包冒烟里的同一处理见 `app/src/pack.ts:228-229`）。
- 端口是**手工分池**的，脚本之间不共用：9223（`app/verify/cdp-ui.js:18`）、9225（`app/verify/settings-e2e.js:12`）、9227（`app/verify/settings-geometry.js:10`）、9228（`app/verify/input-edge-check.js:10`）、9230/9231/9232（`app/verify/layout-center-check.js:15`、`app/verify/layout-refine-check.js:16`、`app/verify/anim-coord-check.js:15`）。
- 连上后走 CDP 的 Runtime.evaluate，returnByValue + awaitPromise + userGesture（`app/verify/cdp-eval.js:37-39`）；异常不抛，只打印 EXC 片段（`app/verify/cdp-eval.js:40`）。

## 真实点击链路：合成事件不算数

- 点击 = 三段 Input.dispatchMouseEvent（mouseMoved → mousePressed → mouseReleased），且 mouseMoved 不能带 button，否则被判为拖拽起始吞掉后续 click（`app/verify/cdp-ui.js:58-66`）。
- 点之前先 hover 再等 250ms 过渡，然后**重新算一次坐标并做严格可见性检查**才落点（`app/verify/cdp-ui.js:70-75`、`app/verify/cdp-ui.js:100-108`）——CSS 过渡和 hover 显隐会让坐标漂移。
- 菜单项点击用 elementFromPoint 校验落点文本，不匹配就重算重试 6 次，仍不中则失败退出（`app/verify/cdp-ui.js:206-224`）。
- 教训来自实测：DOM 断言（display:block、children 数）证明不了视觉可见，隐形菜单就是这么漏过去的（`app/verify/验证报告.md:309-314`）；合成点击必须命中最内层节点，点外层容器等于点空（`app/verify/验证报告.md:374`）。

## 双通道：几何值 + computed style

- 可见性判定同时看布局盒与样式：宽高>0、y 在视口内，再叠 offsetParent、visibility、opacity≥0.1（`app/verify/cdp-ui.js:76-83`、`app/verify/cdp-ui.js:153-160`）。
- 布局断言取整后的 rect 值做算术比较，例如「整组中心在消息区几何中心之上 delta≥40」「输入框距底≤24px」「滚动区高度占比>70%」（`app/verify/layout-center-check.js:63-68`、`app/verify/layout-center-check.js:74-77`）；圆角这类只能读 getComputedStyle（`app/verify/layout-center-check.js:30-32`）。被验对象的职责划分见 [前端渲染层](../entities/frontend-renderer.md)。
- 几何留证脚本直接把关键元素的 l/t/w/h/cx 打表，不做布尔判定（`app/verify/settings-geometry.js:15-17`、`app/verify/settings-geometry.js:34-40`），适合人读回归。
- 断言汇总成 pass/fail 计数并以退出码收敛（`app/verify/layout-center-check.js:21`、`app/verify/layout-center-check.js:95-97`）。
- 等过渡完成再断言：flex 过渡 0.55s 后 sleep 900ms（`app/verify/layout-center-check.js:72`）。

## 截图留证

- Page.captureScreenshot 存 PNG，路径按轮次/主题命名（`app/verify/layout-center-check.js:88-93`、`app/verify/settings-geometry.js:41-43`）；通用驱动把截图集中到一个由脚本 mkdir 的目录（`app/verify/cdp-ui.js:19-20`、`app/verify/cdp-ui.js:232-236`）。
- 截图目录不存在会让脚本末尾步骤报错，属环境准备问题（`app/verify/全功能验证报告.md:28`）。

## 边界（别把方法当结论）

- 合成输入有硬限制：系统前台锁会挡死 SendKeys、剪贴板注入被安全策略封禁，这类项只能标注「待人工复验」（`app/verify/全功能验证报告.md:37`、`app/verify/全功能验证报告.md:57`）。
- 全量串行会互踩：exe 类脚本自带 taskkill 清场并争用实例与 CDP 端口，套件内失败要单独复跑归因（`app/verify/全功能验证报告.md:68`）。
- 陈旧预期比应用更容易坏：agents/skills 计数、硬编码工作区路径都要随实现更新（`app/verify/全功能验证报告.md:23`、`app/verify/全功能验证报告.md:26`）。
- 依赖模型自主行为的断言有固有抖动，不计入缺陷（`app/verify/全功能验证报告.md:70`）。
- 报告表格与 metrics JSON 不是同一次实验的产物，引用前先对时间戳，见 [验证报告簇](../sources/verify-reports.md)。

## 关联

- 脚本清单与入口：[验证套件](../entities/verification-suite.md)
- 缺陷归档：[踩坑实录](../concepts/pitfalls-log.md)
- 指标口径：[验证报告簇](../sources/verify-reports.md)
- 打包形态（exe 从哪来）：[构建与打包体系](../entities/build-pack-system.md)
