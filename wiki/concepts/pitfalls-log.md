---
type: concept
title: 踩坑实录
tags: [踩坑, 调试, windows, 构建, 验证]
sources: [app/verify/验证报告.md, app/verify/全功能验证报告.md, app/TypeScript迁移说明.md, AGENTS.md, app/src/build.ts, app/src/pack.ts]
updated: 2026-10-06
status: stable
---

# 踩坑实录

> 一句话摘要：只收 Raw 里已核实、带出处的坑——工具链改写、Windows 运行时泄漏、UI 可见性假象、文档口径漂移四类，每条给现象、根因与出处。

## 工具链与构建

- 现象：打包版 Work 全线失败、选工作区无反应。根因：server 从未启动——SDK 是纯 ESM，Electron 33 内置 Node 20 无 require(esm)，而 tsc 会把 CJS 里的动态 import（含变量指示符）统一改写成 require。解法是用 Function 间接层保留真实 import：`app/TypeScript迁移说明.md:117-127`、`app/verify/验证报告.md:236-239`。
- tsconfig 的 outDir 为 app 根时，不显式写 exclude 会让整个目录被默认排除、include 匹配不到任何文件（TS18003）：`app/TypeScript迁移说明.md:128-130`，落实在 `app/tsconfig.json:30`。
- zod 此前只是 SDK 的隐式 peer 依赖，迁移后必须在 dependencies 显式声明并把 zod 加进产物自检：`app/TypeScript迁移说明.md:131-134`、`app/src/pack.ts:202`。
- @types/node 20 起 Buffer 带泛型，concat 需要元素类型一致：`app/TypeScript迁移说明.md:141-143`。
- 内联 bundle 时字符串替换会把 `$$` 当特殊模式，而 KaTeX 定界符配置里就有它，必须用函数式替换：`app/src/build.ts:257-258`。
- 源模板没有 </body> 闭合标签会让注入正则不匹配（早期 build 注入失效的原因），现策略是插到 </html> 前并做唯一标记校验：`app/verify/验证报告.md:84`、`app/src/build.ts:267-272`。
- 不在构建期做逐文件语法校验，代价是 start.bat 产出一个白屏应用：`app/src/build.ts:187-197`；Work 模块顺序只能靠两位数字前缀的字典序，不能用 readdir 原始返回顺序：`app/src/build.ts:177-185`。
- 产物自检清单会随技能迁移而陈旧，全量打包直接失败：`app/verify/全功能验证报告.md:80`，清单本体 `app/src/pack.ts:186-206`。

## 打包与 Windows 运行时

- 宿主泄漏 ELECTRON_RUN_AS_NODE=1 时，electron.exe 退化为纯 Node、应用起不来，spawn 前必须剥掉：`app/src/pack.ts:224-233`。
- 冒烟不能用 spawnSync（detached 对它无效，会一直等常驻进程退出）：`app/src/pack.ts:224-225`。
- exe 被占用时 rcedit 会部分写入且静默失败，要先 taskkill 再等 1.2 秒释放文件锁：`app/src/pack.ts:100-101`。
- Windows 保留端口段导致 3218 触发 EACCES，解法是候选端口自动回退并记录实际端口：`app/verify/验证报告.md:86`、`app/src/server/index.ts:236-238`。
- 单实例锁被拒时 app.quit() 是异步的，whenReady 仍会触发并覆盖运行时文件成死端口，必须在 whenReady 内设闸：`app/verify/全功能验证报告.md:17`、`app/src/main.ts:264-268`，壳侧行为见 [Electron 壳](../entities/electron-shell.md)。
- ready-to-show 若在 loadFile 之后注册，页面命中缓存时事件早于监听，进程活着但窗口永不显示：`app/verify/验证报告.md:301`。
- 窗口被遮挡时 Electron 冻结 rAF 与 IO，表现为动画/渲染「卡住」，转前台即恢复——别当性能 bug 查：`app/verify/验证报告.md:343`。
- 首启可能被杀软扫描拖慢，冒烟容忍窗口按 20 秒设：`app/src/pack.ts:235-240`、`app/verify/验证报告.md:249`。
- 资源管理器短暂显示旧图标是系统缓存，刷新或改名即恢复：`app/src/pack.ts:180-182`。

## UI 与验证

- 「下拉点了没反应」的真因是隐形菜单：类规则 opacity:0 + pointer-events:none 依赖父级 .open，而 JS 只切 display；上一轮加的空列表兜底只治了「列表未就绪」：`app/verify/验证报告.md:309-313`。
- 同族第二层根因：输入框容器的 overflow-y:auto 会把向上弹的绝对定位菜单裁掉，elementFromPoint 命中的是 textarea：`app/verify/验证报告.md:361`。
- 方法论教训：DOM 断言（display、children 数）证明不了视觉可见，必须在真实窗口用 elementFromPoint 与计算样式：`app/verify/验证报告.md:314`。
- scrollbar-width 与 ::-webkit-scrollbar 定制在 Chromium 130 互斥，前者会把细滚动条定制整个禁用：`app/verify/验证报告.md:319`。
- flex 中间容器缺 flex:1 与 min-height:0 时只按内容收缩，滚动区被压成 8px——内容全在 DOM 里，只是看不见：`app/verify/验证报告.md:299`。
- 合成点击必须命中含同名文本的最内层节点，点外层容器等于点空：`app/verify/验证报告.md:374`。
- 合成输入有硬边界：系统前台锁挡死键盘注入、剪贴板注入被安全策略封禁，这类项只能留给人工复验：`app/verify/全功能验证报告.md:37`、`app/verify/全功能验证报告.md:57`。
- 全量串行跑 23/30，7 个失败项单独跑全过——exe 类脚本自带 taskkill 清场并争用实例与 CDP 端口，套件内失败先怀疑互踩：`app/verify/全功能验证报告.md:68`。
- 陈旧预期比应用更容易坏：技能数 12→17、硬编码工作区路径都要跟着改：`app/verify/全功能验证报告.md:23-26`。
- MCP 惰性加载会让线路上只看到元工具名，工具轨迹与台账断链，需按线路形状还原真名：`app/verify/全功能验证报告.md:113`。
- 科研场景的数据溯源不能只写进 SKILL.md：模型未显式加载技能时技能正文根本不进上下文，"禁止编造示例数据"就形同虚设——同一场景两次画出专业但假的图。可靠做法只有底座提示词或工具层校验：`app/verify/全功能验证报告.md:190`。
- 外部检索源会限流而非返回空：arXiv 429 时正确行为是如实报告"API 限流、查不到"，验收断言要写成「拿到可核验编号 或 如实报告限流」，否则会把外部故障误判成应用缺陷：`app/verify/全功能验证报告.md:198`。
- 驱动打包版应用的验收脚本必须每次请求重读 `data/runtime.json`：应用重启会换端口与 token，缓存凭证会让后续场景静默收到 401 的 HTML 页（表现为 JSON 解析错误）：`app/verify/science-capability-verify.js:22-27`。
- 被截断的展示文本不能当数据源：`tool_end.result` 截到 4000 字符，`run_code` 结果里的 `files[]` 常正好被切掉，靠刮文本抽产物会时灵时不灵——改为后端在截断前抽结构化 `artifacts` 随事件下发：`app/src/server/qoder.ts:100`。
- Windows 两种分隔符会静默破坏"剥前缀"：工作区扫描给反斜杠绝对路径、项目 folder 存正斜杠，`indexOf(root)===0` 比不中，rel 留成绝对路径被白名单端点拒成 400——两边先归一再比：`app/src/webapp/webapp.ts:5355`。
- 右栏列表坐标点击前必须 `scrollIntoView`：预览卡插在列表顶部会把目标行挤出 `#ctxList` 裁剪区，按 rect 点击落在裁剪外，表现为"点了没反应"（驱动缺陷，不是应用缺陷）。
- 打包脚本会正确以退出码 1 报告 tsc 失败，但外层重试循环若只 sleep 不回显，就会**从旧包启动做验收并报出假失败**；判别：同一关键符号在 `app/server/*.js` 与 `dist/.../server/*.js` 里 grep 次数不一致：`app/src/pack.ts:63-64`。
- 沙箱 worker 首启有瞬态竞争（报 exited with code 1），BYOK 就绪等待从 8 秒放宽到 25 秒才稳住：`app/verify/验证报告.md:419`、`app/verify/全功能验证报告.md:18`、`app/src/server/qoder.ts:1321`。
- 性能坑：每条消息行都给 img.src 赋 base64 头像会造成 80ms 级同步解码，改 Blob URL 共享：`app/verify/验证报告.md:342`。
- 用脚本改文件时注意换行：对 CRLF 文件的静默替换失败曾让补丁「看起来打上了」：`app/verify/验证报告.md:261`。

## 文档与口径漂移

- 手写 JS 的数量与名单只在运行时判定才可靠，静态清单会落后于新增脚本：`AGENTS.md:10`、`app/src/verify/verify-suite.ts:86-89`（详见 [验证套件](../entities/verification-suite.md)）。
- metrics JSON 是最后一次运行的快照、不是历史累积，且沙箱脚本是整份覆盖写入：`app/src/verify/sandbox-verify.ts:219`，报告表格却是首轮成绩：`app/verify/验证报告.md:57-58`。
- 便携发行版目录树里的 .js 全是产物，引用必须改指 app/src：`app/verify/验证报告.md:9`、`AGENTS.md:8-11`。
- 按「行为不变」原则刻意保留的历史 bug（Chat 思考开关未注入上游、force 参数被忽略、错误文案缺括号）：`app/TypeScript迁移说明.md:165-174`。
- 安全边界不是漏洞修复清单：canUseTool 静态扫描防误操作不防有意绕过、沙箱无进程级资源上限：`app/verify/验证报告.md:159-160`，完整边界承诺见 [沙箱边界](../concepts/sandbox-boundaries.md)。

## 验收脚本自身的坑（2026-10-05 第五、六批）

- **必须每次请求重读 `data/runtime.json`**：应用重启会换端口与 token，缓存凭证会让后续场景静默拿到 401 的 HTML 页，表现为 JSON 解析报错——很容易被误判成应用缺陷（`app/verify/全功能验证报告.md:230`）。
- **重试循环要回显失败原因**：`pack.js` 内部 tsc 因 `01/work/*.js` 瞬时文件锁失败并正确以退出码 1 结束，但重试只 `sleep` 不回显，于是从**旧包**做验收，17 项里报出 2 项假失败；确认办法是拿本轮新符号 grep dist 与源码树两侧（`app/verify/全功能验证报告.md:257-259`），判据见[构建产物同步纪律](artifact-sync.md)。
- **外部限流要按"或"写断言**：arXiv API 会 429，同一场景一次跑通拿到编号、一次三次全被限流；被限流时模型如实报告"API 限流、查不到"而没有编造编号——这是想要的行为，所以断言写成「真编号 **或** 如实报告限流」（`app/verify/全功能验证报告.md:228`）。
- **别把表现放宽成掩盖**：模型收尾偶尔不带要求的表格（只写记忆更新说明），首轮因此 FAIL；处理方式是放宽到「答复或工具结果内可核验」，同时把"答复未含表"显式打进证据里（`app/verify/全功能验证报告.md:229`）。
- **技能正文不是兜底**：约束只写在 `SKILL.md` 里＝概率性生效，未加载技能的回合根本不受约束，见[有意保留的已知缺陷](../syntheses/known-defects.md) D8。

## 关联

- 验证脚本与分层：[验证套件](../entities/verification-suite.md)
- 实测方法论：[UI 验证方法论](../concepts/verification-method.md)
- 构建与打包本体：[构建与打包体系](../entities/build-pack-system.md)
- 迁移史出处：[TypeScript 迁移说明](../sources/ts-migration.md)
- 报告与指标：[验证报告簇](../sources/verify-reports.md)
