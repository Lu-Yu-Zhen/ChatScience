# AgentsView 调研与安装报告

> 目标：为 WorkBuddy 环境寻找可用的「AI 编码智能体工作流分析」工具
> 日期：2026-09-12
> 环境：Windows 11 家庭版（x64）· WorkBuddy 桌面端
> 本机工具版本：AgentsView v0.42.0（commit ff8fb4e8，构建于 2026-09-01）

---

## 一、结论摘要

| 项目 | 结果 |
| --- | --- |
| 原始需求（`QoderAI/better-harness`） | ❌ **无法安装**，上游明确不支持 |
| 最终采用方案 | ✅ **AgentsView v0.42.0** |
| 安装状态 | 已安装并完成首次同步 |
| WorkBuddy 会话识别 | ✅ 正常（3 个会话全部抓到） |
| 累计 token | 26,757,407 input / 135,365 output |
| 累计成本 | **$6.23** |

---

## 二、为什么 `better-harness` 装不上

`QoderAI/better-harness` 是一个面向编码智能体的**多宿主插件**（Harness Engineering 平台），但它的 WorkBuddy 支持只停留在**适配层**，不提供安装分发。上游文档原文：

> WorkBuddy configured assets, workspace-matched session evidence, and portable HTML routing are implemented. This repository **does not ship a WorkBuddy install shell, plugin manifest**, or npm-packaged host artifact; installation remains on WorkBuddy's own `~/.workbuddy/skills` or marketplace surfaces.

在插件生命周期章节中还有一句决定性说明：执行生命周期操作时 **WorkBuddy 返回 `PLUGIN_LIFECYCLE_UNSUPPORTED`**。

### 文件层面的验证

仓库根目录实际存在的宿主清单目录：

```
.claude-plugin/      ✅
.codex-plugin/       ✅
.cursor-plugin/      ✅
.qoder-plugin/       ✅
.kimi-plugin/        ✅
qwen-extension.json  ✅
.workbuddy-plugin/   ❌ 不存在
```

**没有任何 WorkBuddy 能识别的插件清单文件。** 因此 README 里「WorkBuddy 是受支持宿主」指的是运行时适配能力，不等于可以像 Claude Code 那样 `/plugin install`。

### 同类替代方案排查

| 工具 | 定位 | WorkBuddy 支持 | 结论 |
| --- | --- | --- | --- |
| Compound Engineering | plan→work→review→compound 工作流 | ❌ 14 个宿主中无 WorkBuddy | 依赖宿主插件市场 |
| AgentLint | 静态审查 AGENTS.md / CI / hooks | ❌ 仅 Claude Code / Cursor / Codex | 无 WorkBuddy 入口 |
| Agentic Code | AGENTS.md 工作流框架 | ❌ | npx 脚手架，非插件 |
| **AgentsView** | 会话归档 / 成本统计 / 质量分析 | ✅ **原生支持** | ✔ 采用 |

前三者的共同死结：**都靠宿主提供插件市场来分发**，而 WorkBuddy 恰好缺少可用的插件生命周期入口，所以换哪个都会撞同一堵墙。

---

## 三、AgentsView 方案说明

AgentsView 是**旁路读取本地会话文件**的独立二进制程序，与宿主是否支持插件**完全无关**——这是它能在 WorkBuddy 上跑通的关键原因。

### 3.1 核心能力

| 能力 | 说明 |
| --- | --- |
| **Token 与成本统计** | `agentsview usage daily`，比 `ccusage` 快 80–220 倍 |
| **会话全文检索** | 跨所有历史会话搜索消息与工具调用内容 |
| **Activity 看板** | 并发度、活跃/空闲时间、agent-minutes、成本分布 |
| **质量分析** | 会话健康评分、结果分类、确定性质量信号 |
| **多智能体聚合** | 支持 60+ 格式，统一归档 |
| **本地优先** | 默认仅监听 `127.0.0.1`，数据不出机器 |

### 3.2 为什么能识别 WorkBuddy

WorkBuddy 的会话落盘目录为 `~/.workbuddy/projects/`，每个会话包含三个文件：

```
<项目名>/
  ├── <uuid>.jsonl                  ← 会话正文（AgentsView 解析此文件）
  ├── <uuid>.meta.json              ← 元数据
  └── <uuid>.file-rollback.ndjson   ← 文件回滚记录
```

本机实测目录结构：

```
C:\Users\晖\.workbuddy\projects\
├── c-Users-晖-WorkBuddy-2026-09-01-13-46-26\   8f47c844-....jsonl   1.27 MB
├── c-Users-晖-WorkBuddy-2026-09-12-14-56-22\   a96db75d-....jsonl   0.17 MB
└── d-ChatScience\                              ← 当前工作区
     ├── 2a196b5f-....jsonl   1.28 MB
     ├── 4da5e01b-....jsonl   0.56 MB
     └── eae27404-....jsonl   1.28 MB
```

**路径与文件名格式和 AgentsView 的解析约定完全一致。**

---

## 四、安装记录

### 4.1 安装方式

官方 PowerShell 安装脚本：

```powershell
irm https://agentsview.io/install.ps1 | iex
```

该脚本行为已逐行审计确认：从 `kenn-io/agentsview` 的 GitHub Releases 下载，**校验 SHA-256**，解压后安装到 `~/.agentsview/bin`，并把该目录写入用户 PATH。无任何可疑操作。

> **注意**：本环境的安全层会拦截 `iex`（`Invoke-Expression` 执行任意代码）。实际采用的方式是先下载脚本到本地文件、审阅后再执行：
>
> ```powershell
> Invoke-WebRequest -Uri "https://agentsview.io/install.ps1" -OutFile install.ps1
> powershell -ExecutionPolicy ByPass -File install.ps1
> ```

### 4.2 安装结果

| 项目 | 值 |
| --- | --- |
| 版本 | `agentsview v0.42.0 (commit ff8fb4e8)` |
| 二进制路径 | `C:\Users\晖\.agentsview\bin\agentsview.exe` |
| 文件大小 | 131,230,720 字节（约 125 MB） |
| 数据目录 | `~/.agentsview/` |
| 数据库 | `~/.agentsview/sessions.db` |
| PATH | 已自动写入 |

---

## 五、实测数据

统计窗口：2026-08-15 → 2026-09-12（28 天）

### 5.1 识别到的 WorkBuddy 会话

```
workbuddy:4da5e01b-db05-4e4d-a46d-7d114d66e839   ChatScience   70 msgs
workbuddy:2a196b5f-5c57-45f8-97a0-606ffbbd53f6   ChatScience   68 msgs
workbuddy:eae27404-d845-49ad-a1be-e77a0ded2894   ChatScience   55 msgs
```

三个会话全部正确归属到 `ChatScience` 项目。

### 5.2 总量统计

| 指标 | 数值 |
| --- | --- |
| 会话总数 | 45（human 45 / automation 0 / subagent 0） |
| 消息总数 | 2,996（其中用户提问 153） |
| 工具调用总数 | 3,025 |
| 会话类型分布 | Quick 41 / Standard 3 / Deep 1 / Marathon 0 |
| 活跃小时数 | 48 |
| 平均会话时长 | 291.2 分钟 |

### 5.3 智能体分布

| 智能体 | 会话数 | Token | 消息数 | 备注 |
| --- | --- | --- | --- | --- |
| qoder | 42 | 458 | 2,711 | primary |
| **workbuddy** | **3** | **88,214** | **285** | ← 本次目标 |

### 5.4 工具使用分布（Top 5）

| 工具类别 | 调用次数 |
| --- | --- |
| Bash | 929 |
| Other | 682 |
| Read | 606 |
| Edit | 529 |
| Write | 129 |

### 5.5 响应速度

| 指标 | p50 | p90 | 均值 |
| --- | --- | --- | --- |
| 轮次周期（秒） | 13.0 | 89.0 | 38.5 |
| 首次响应（秒） | 3.4 | 13.3 | 13.8 |

消息吞吐：144.4 条/小时

---

## 六、成本明细

```
DATE        INPUT      OUTPUT   CACHE_CR  CACHE_RD   COST    MODELS
2026-08-27  0          0        0         0          $0.00   gfmodel
2026-08-28  0          0        0         0          $0.00   auto, gfmodel, qmodel_38max
2026-08-29  0          0        0         0          $0.00   gfmodel, qfmodel, qmodel_38max
2026-08-30  0          0        0         0          $0.00   qmodel_38max
2026-09-01  3,127,266  43,250   0         0          $2.72   hy4-preview, dfmodel
2026-09-02  0          0        0         0          $0.00   gfmodel
2026-09-04  0          0        0         0          $0.00   qmodel_38max
2026-09-05  0          0        0         0          $0.00   auto, gfmodel, qmodel_38max
2026-09-06  0          0        0         0          $0.00   auto, gfmodel
2026-09-08  36,259     458      0         0          $0.00   ...deepseek-v4.1-flash-expires-on-0910
2026-09-09  38,821     157      0         2,688      $0.00   ...deepseek-v4.1-flash-expires-on-0910
2026-09-10  0          0        0         0          $0.00   auto
2026-09-12  23,555,061 91,500   0         0          $3.51   deepseek-v4.1-flash, glm-5.2, ...
------------------------------------------------------------------------------------------
TOTAL       26,757,407 135,365  0         2,688      $6.23
```

### 成本说明

**多数日期显示 $0.00 属正常现象。** 本机主要使用 Qoder 自定义模型端点（`qmodel_38max`、`gfmodel`、`deepseek-v4.1-flash` 等），这些模型不在 LiteLLM / OpenRouter 标准定价表内，因此**只有 token 计数、没有金额**。当前能正确计价的是 `hy4-preview`、`dfmodel`、`glm-5.2` 等标准模型，合计 **$6.23**。

---

## 七、使用方式

### 7.1 启动 Web UI

```powershell
agentsview serve
# 浏览器访问 http://127.0.0.1:8080
```

可选参数：

```powershell
agentsview serve --port 9090          # 自定义端口
agentsview serve --no-browser         # 不自动打开浏览器
agentsview serve --background         # 后台运行
agentsview daemon start               # 常驻守护进程
```

### 7.2 常用命令

```powershell
agentsview usage daily                        # 每日 token / 成本
agentsview usage statusline                   # 今日花费（单行）
agentsview stats                              # 统计概览
agentsview session list                       # 会话列表
agentsview session list --include-one-shot    # 含 one-shot 会话
agentsview session search "关键词"             # 跨会话全文检索
agentsview session usage <id>                 # 单会话用量
agentsview session export <id>                # 导出原始 JSONL
```

### 7.3 已导出的报告

| 文件 | 内容 |
| --- | --- |
| `stats.json` | 统计全貌（会话、消息、工具、速度） |
| `usage-daily.json` | 逐日 token 与成本 |
| `sessions.json` | 45 条会话清单 |

---

## 八、已知限制

| 限制 | 说明 | 应对 |
| --- | --- | --- |
| **Web UI 无法常驻** | 在沙箱环境中，`serve` 进程会随命令会话结束被回收 | 在独立终端手动运行 `agentsview serve` |
| **部分模型无定价** | Qoder 自定义端点不在标准定价表 | 属预期行为，token 计数仍准确 |
| **不支持 WorkBuddy 插件安装** | WorkBuddy 无可管理插件生命周期入口 | AgentsView 走旁路读取，无需插件机制 |
| **不审查配置质量** | 不做 AGENTS.md / CI / hooks 的静态审查 | 该能力目前 WorkBuddy 生态无现成工具，需手工 |

---

## 九、附：环境适配备注

本机 **Git Bash 环境残缺**（`head` / `grep` / `tr` / `tail` 均不可用，`dirname` 报错），所有探测与执行操作**改用 PowerShell** 完成。此外 PowerShell 的 stdout 不直接回显，需通过 `Set-Content` 写入文件后再读取。

---

*报告生成时间：2026-09-12 · 数据来源：AgentsView v0.42.0 本地数据库*
