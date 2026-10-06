---
type: concept
title: 沙箱边界
tags: [sandbox, 安全边界, server, 权限, 审批]
sources: [app/src/server/policy.ts, app/src/server/sandbox.ts, app/src/server/proc.ts, app/src/server/qoder.ts]
updated: 2026-10-06
status: stable
---

# 沙箱边界

> 本页界定墨台到底允许执行什么、路径与网络约束在哪一层生效、审批与拒绝走哪两条通道、失败以什么形式回到用户和模型面前。核心结论：这是防误操作的工程边界，不是安全隔离。

## 一、定位：不是安全边界

- 源码把这条写进文件头：沙箱**不是**安全边界，代码以当前用户权限在本机执行，没有容器也没有 Job Object，因此拦不住读写本机任意文件、耗尽内存或联网 `app/src/server/policy.ts:4-6`、`app/src/server/sandbox.ts:9-16`。
- 唯一不可被沙箱内代码绕过的一层是 spawnGuarded 的 shell:false + argv 数组：命令行不经 shell 解析，代码里的内容不会被当作 shell 元字符执行 `app/src/server/policy.ts:12-13`、`app/src/server/proc.ts:148-155`。
- 连验证脚本都专门设一条用例来证明这条边界：故意让代码读系统目录，读得到才算通过 `app/src/verify/sandbox-verify.ts:151-158`。

## 二、什么能执行

- 三种语言：python / node / shell，脚本后缀按平台决定（Windows 的 shell 落 .cmd）`app/src/server/sandbox.ts:28`；shell 用 ComSpec 或 /bin/sh `app/src/server/sandbox.ts:231`。
- 前提是本机探测得到解释器：探测 python / node / uv / npm / pip 并把结果落盘缓存 6 小时 `app/src/server/proc.ts:53-59`、`app/src/server/proc.ts:15`；Windows 下裸命令名先用 where.exe 解析成真实路径，因为 CreateProcess 只认 .exe `app/src/server/proc.ts:21-43`。
- 依赖安装是独立受控操作：只认 pip / uv / npm 三种管理器 `app/src/server/sandbox.ts:378-392`，包名必须先过白名单正则（.cmd 包装要经 cmd.exe，所以把 shell 元字符挡在外面）`app/src/server/policy.ts:154-162`、`app/src/server/sandbox.ts:371-373`，单次上限 50 个包 `app/src/server/sandbox.ts:370`。
- 不允许的：交互式进程——stdin 一律 ignore，杜绝任何等待输入的情况 `app/src/server/proc.ts:145`、`app/src/server/proc.ts:154`。

## 三、路径边界：分两层，强度不同

- 强制有效的一层是**工具级文件 API**（读 / 写 / 列 / 下载产物）：每条路径先 sanitizeRelPath 再 assertInside `app/src/server/sandbox.ts:421-428`。
  - sanitizeRelPath 的规则：必须相对、总长不超 240 以规避 Windows 260 限制、逐级禁止向上穿越、禁非法字符与 Windows 保留设备名 `app/src/server/policy.ts:81-94`、`app/src/server/policy.ts:72-74`。
  - assertInside 除了字符串前缀比较（带分隔符，避免 sibling 目录名误通过），还要 realpath 后再判一次，封 junction 与符号链接绕过 `app/src/server/policy.ts:50-70`；目标尚不存在时放行，因为父目录已校验过 `app/src/server/policy.ts:67-68`。
- 纵深防御的一层是**代码文本静态扫描**：拦的是模型或用户手滑写出破坏性命令，防不住有意绕过 `app/src/server/policy.ts:9-11`。
  - 16 条危险模式，逐条精确匹配破坏性命令本身以避免误伤科研代码——例如只匹配 Windows 的磁盘格式化命令形式，而不是裸词 format `app/src/server/policy.ts:97-119`。
  - 另加一条路径穿越信号：两级以上向上爬才拦，单级放行（work 到 out 就用单级），因为那里放着配置与状态文件 `app/src/server/policy.ts:121-123`。
  - 网络库导入拦截默认关闭，误伤面大 `app/src/server/policy.ts:29`、`app/src/server/policy.ts:145-148`。

## 四、网络边界：声明式四层近似

默认策略是 declared（声明式断网）`app/src/server/policy.ts:26`，它做四件事，也只做这四件 `app/src/server/sandbox.ts:11-14`：

1. 代理环境变量指向黑洞端口 `app/src/server/sandbox.ts:216-220`，同时 NO_PROXY 置星号 `app/src/server/sandbox.ts:212`。
2. Python 侧经 PYTHONPATH 注入 sitecustomize，只 patch 连接类方法而保留 socket 类本身——因为 TLS 模块要继承它，整替会 import 即崩 `app/src/server/sandbox.ts:30-43`、`app/src/server/sandbox.ts:32-33`。
3. Node 侧经 NODE_OPTIONS 的 require 预加载 netblock 脚本，重写 Socket.prototype.connect `app/src/server/sandbox.ts:45-53`、`app/src/server/sandbox.ts:219`。
4. 可选的代码静态扫描（见上一节，默认不查网络库）。

诚实声明：ctypes、原生扩展、C 层 DNS 仍可联网，所以执行结果里网络态写的是 declared-only 而不是 blocked `app/src/server/sandbox.ts:14`、`app/src/server/sandbox.ts:337`。用户可切到 open `app/src/webapp/work/45-sandbox.ts:42-48`。

## 五、资源上限：只有四样

超时强杀 + 线程数收敛 + 并发数 + 单文件大小 `app/src/server/sandbox.ts:15-16`，默认值与上下限兜底都在策略里 `app/src/server/policy.ts:20-31`、`app/src/server/policy.ts:174-177`。超时用进程树强杀（Windows 走 taskkill /T /F，child.kill 杀不掉孙子进程）`app/src/server/proc.ts:107-114`、`app/src/server/sandbox.ts:291-295`。内存峰值字段保留但恒为 null，不谎报 `app/src/server/sandbox.ts:336`。

## 六、审批与拒绝：两条通道

- 通道 A · 沙箱页 / run_code：执行前扫描，命中就不执行并返回 blocked + blockReason，提示语明写「这是防误操作的静态拦截，不是安全边界」`app/src/server/sandbox.ts:182-191`。
- 通道 B · Agent 工具网关 canUseTool：deny 的原因回给模型，模型通常下一轮自行调整 `app/src/server/qoder.ts:605-611`。
  - Bash：命令文本走同一份 scanCode，命中即 deny `app/src/server/qoder.ts:614-621`。
  - Write / Edit：路径必须落在本次 cwd 内，否则 deny 并提示产物写 out 子目录 `app/src/server/qoder.ts:623-641`。
  - 唯一的例外口径是项目记忆目录，由 extraWriteRoots 单独放开这一个根 `app/src/server/qoder.ts:609-611`、`app/src/server/qoder.ts:626-634`。
  - 放行也留痕：子智能体发起的调用必记审计，主会话高频只读工具不记以免噪音 `app/src/server/qoder.ts:642-646`；守卫自身出错不阻断会话 `app/src/server/qoder.ts:645-649`。
- 权限档位与收紧：档位枚举 `app/src/server/qoder.ts:116`；领域包覆写角色时 permissionMode 只允许保持或降档、maxTurns 只允许收紧 `app/src/server/domain-roles.ts:166-173`，越权项一律拒绝并回报，不静默降级 `app/src/server/domain-roles.ts:18-23`。

## 七、失败如何反馈

| 失败 | 反馈形式 | 证据 |
|---|---|---|
| 运行时缺失 | ok=false + 已探测清单，不抛异常 | `app/src/server/sandbox.ts:172-179` |
| 进程起不来 | 明确提示可能被杀软 / EDR 拦截，附 diagnostics | `app/src/server/sandbox.ts:245-249` |
| 静态拦截 | blocked=true + 命中原因列表 | `app/src/server/sandbox.ts:182-191` |
| 超时 | timedOut + exitCode + killedInfo | `app/src/server/sandbox.ts:326-328` |
| 输出超长 | stdoutCapped / stderrCapped 标记，中间截断 | `app/src/server/sandbox.ts:92-98` |
| 路径越界 | 抛 EPATHOUT / EPATHLINK / ERELPATH，HTTP 侧转 400 并回 code | `app/src/server/policy.ts:56`、`app/src/server/routes.ts:101-120` |
| 文件过大 | EFILETOOLARGE，读默认 2MB、写按策略上限 | `app/src/server/sandbox.ts:441-448`、`app/src/server/sandbox.ts:457-466` |
| 包名非法 | 抛错说明包装需经 cmd.exe 的原因 | `app/src/server/sandbox.ts:371-373` |

前端把结果状态渲染成中性标签（成功/失败、exit、耗时、超时、被拦、声明式断网），被拦时把 blockReason 追加进输出文本 `app/src/webapp/work/45-sandbox.ts:146-160`、`app/src/webapp/work/45-sandbox.ts:215-224`。

## 工作区读取的边界（与沙箱并列的第二道门）

模型输出里的文件名不能当路径直接用。右栏预览走的是专用端点而不是通用文件读取：

- `/api/work/ws/raw` 只认 `state.json` 里 `mode==='work'` 且带 folder 的已注册项目（`app/src/server/index.ts:192-196`），未注册 projectId 一律 404（`app/src/server/index.ts:203`）；绝对路径与含 NUL 的 rel 直接 400（`:204`）。
- 解析用 `realpathSync` 再比前缀，越出项目根返回 403（`app/src/server/index.ts:206-208`）——软链与 `..` 都在这一步被挡掉；单文件 8MB 上限（`:211`）。
- 对照面：接受任意绝对路径的 `/api/fs/raw`（`app/src/server/index.ts:170`）仍在，因此新增的"由模型提供文件名"的链路必须走受约束端点，理由写在验收报告里：一条伪造的工具结果就能读全盘（`app/verify/全功能验证报告.md:240`）。
- 绝对路径也只在"确实落在本次会话工作区内"时才允许成为可点条目（`app/src/webapp/work/60-trace.ts:36`），前端还会把反斜杠与正斜杠先归一再剥前缀（`app/src/webapp/webapp.ts:5355`）。

## 关联

- 实体：[沙箱与工作台](../entities/sandbox-workspace.md)（这些边界的实现载体）
- 实体：[Work 模块群](../entities/work-modules.md)（策略编辑器与文案所在的前端层）
- 概念：[领域路由与角色](domain-routing.md)（角色级权限收紧）
- 资料：[测试文件夹人工验证记录](../sources/manual-test-notes.md)（工作区模式下边界的实际留痕）
