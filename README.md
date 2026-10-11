# ChatScience

墨台（Motai）产品线的工程仓。主体是 **ChatScience 桌面应用**——一个 Electron 前后端分离的科研智能体客户端：前端是单文件渲染层，后端是绑定在 `127.0.0.1` 的本地 Express 服务，通过 Qoder Agent SDK 驱动智能体、技能、MCP 工具与沙箱执行。仓内同时容纳产品页站点、SDK 样例、七份实现策划案、品牌与壁纸资产，以及一份迁往 GitHub Wiki 的项目知识库。

- 平台：Windows（打包脚本按 win32-x64 产出便携版）
- 许可：[MIT](LICENSE)
- 知识库：[本仓库 Wiki 页签](https://github.com/Lu-Yu-Zhen/ChatScience/wiki)

## 目录

- [目录结构](#目录结构)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [常用命令](#常用命令)
- [桌面应用功能概览](#桌面应用功能概览)
- [构建与产物关系](#构建与产物关系)
- [配置与密钥](#配置与密钥)
- [验证体系](#验证体系)
- [打包便携版](#打包便携版)
- [各子项目说明](#各子项目说明)
- [知识库（GitHub Wiki）](#知识库github-wiki)
- [注意事项与常见问题](#注意事项与常见问题)
- [许可](#许可)

## 目录结构

```
ChatScience/
├── README.md / LICENSE         # 本文件与 MIT 许可
├── AGENTS.md                   # 源码/产物地图：改动该落在哪个文件、哪些不能手改
├── .gitignore / .gitattributes # 忽略契约；*.js / *.md 固定 LF
│
├── app/                        # Electron 桌面应用（package name: chatscience-desktop）
│   ├── src/                    # 唯一手写源码（TypeScript）
│   │   ├── main.ts             # Electron 主进程：窗口/托盘/快捷键/通知/后端进程托管
│   │   ├── preload.ts          # 预加载桥（contextBridge 暴露给渲染层）
│   │   ├── build.ts            # 组装渲染层：读 webapp/主页面.html，内联脚本 + 注入桌面桥接
│   │   ├── pack.ts             # 打出便携版（dist/）
│   │   ├── make-icons.ts       # 由 logo.jpeg 生成 app.ico / tray.png
│   │   ├── server/             # 本地后端：路由、SDK 桥、沙箱、检索、知识库、记忆…
│   │   ├── shared/             # 主进程与后端共享模块（domain、qoder-sdk）
│   │   ├── webapp/             # 前端：webapp.ts 主脚本 + work/ 14 个模块
│   │   ├── verify/             # 验证脚本（TypeScript 源）
│   │   └── tools/              # wiki-lint 等仓库工具
│   ├── verify/                 # 验证脚本（编译产物 js + 手写 js 例外 + 报告与指标）
│   ├── server/ shared/ icons/  # 后端与共享代码的编译产物、内置插件、应用图标
│   ├── package.json / tsconfig*.json / start.bat
│   └── main.js 等              # tsc 原位编译产物（勿手改）
│
├── webapp/                     # 渲染层输入与产物：主页面.html 模板 + webapp.js、work/*.js
├── sites/motai/                # 墨台产品页站点
├── examples/qoder-agent-sdk/   # Qoder Agent SDK 样例工程
├── docs/
│   ├── plans/                  # 七份实现策划案（源 + 生成链 + .docx 产物）
│   └── research/               # AgentsView 调研报告与会话统计
├── assets/
│   ├── brand/                  # InkForge 品牌图像资产（11 张）
│   ├── wallpapers/             # 八套主题壁纸
│   └── marketing/              # 科研 Agent 宣传海报
└── wiki/README.md              # 指向 GitHub Wiki 的指引（知识库本体在仓库 Wiki 页签）
```

## 环境要求

| 项 | 要求 |
|---|---|
| 操作系统 | Windows（`pack.js` 只产出 win32-x64；其余脚本跨平台可跑） |
| Node.js | ≥ 20（`@types/node` 为 ^20；`start.bat` 默认尝试本机 `v24.14.0`，找不到则用 PATH 中的 `node`） |
| npm | 随 Node 附带 |
| 磁盘 | 约 300MB（`node_modules` 含 Electron 运行时约 100MB） |
| 网络 | 首次 `npm install` 需访问 npm 源；运行期需访问模型服务 |

## 快速开始

```bash
cd app
npm install     # 首次：安装 express / zod / Qoder Agent SDK 与构建期依赖
node build.js   # 组装渲染层（app/renderer/ 不入库，克隆后必须构建一次）
npm start       # 编译三套 TypeScript → 启动 Electron
```

也可以直接双击 `app/start.bat`，它会一条龙完成：检测依赖（缺了就 `npm install`）→ 编译核心与前端两套 TypeScript → `node build.js` 组装渲染层 → 启动 Electron。

> `npm start` 本身只做 `npm run build:ts && electron .`，**不包含** `node build.js`；因为 `app/renderer/` 被 `.gitignore` 排除，克隆后第一次运行前必须先构建渲染层。

应用启动后：

1. 后端绑定 `127.0.0.1`（不对外暴露），监听 **8642**；被占用时按 `17462 → 27511 → 38123 → 2917 → 3218` 顺序切换，实际端口记录在 `app/data/runtime.json`。
2. 未配置任何模型时，应用会自动建一条阿里云百炼 `qwen3.8-flash` 的默认条目，填入 API Key 即可用；也可以在界面里自行添加供应商与模型（BYOK，密钥只存本机）。
3. 界面分 **Chat** 与 **Work** 两种模式，右上角切换。

## 常用命令

以下命令均在 `app/` 目录执行。

| 命令 | 作用 |
|---|---|
| `npm start` | 编译三套 TypeScript 后启动 Electron（不含渲染层组装） |
| `node build.js` | 由 `webapp/主页面.html` 组装 `app/renderer/index.html`（内联主脚本、Work bundle、桌面桥接） |
| `npm run typecheck` | 三套 tsconfig 全部 `--noEmit` 类型检查 |
| `npm run build:ts` | 三套 tsconfig 编译：核心与 verify 原位落盘，前端落到 `webapp/` |
| `npm run guard:artifacts` | 先 `build:ts`，再用 `git diff --exit-code` 校验 `webapp/`、`app/**/*.js`、`renderer/index.html` 与提交一致 |
| `npm run verify` | 枚举全部验证脚本并标注手写/编译；`npm run verify <name>` 单跑；`npm run verify -- --all` 全量 |
| `npm run wiki:lint` | 知识库校验（需 `CS_WIKI_DIR` 指向 wiki 检出，见下文） |
| `node pack.js` | 打出便携版到 `app/dist/` |
| `node make-icons.js` | 重新生成应用图标 |

## 桌面应用功能概览

**Chat 模式**：多会话对话、项目（工作区）管理、模型与供应商管理（含 BYOK 密钥）、右侧栏（阅读模式、文献库、文件与图片预览）。会话、项目、模型、文献库状态由后端落盘，前端以 180ms 差量同步（大字段与二进制会被剥离或截断，避免写风暴）。

**Work 模式**：科研工作台，由 14 个数字前缀模块组成（前缀即执行顺序）：

| 模块 | 职责 |
|---|---|
| `00-core` | 共享作用域与基础设施 |
| `10-api` / `20-store` | 后端 API 封装与前端状态 |
| `30-agents` / `35-skills` | 智能体与技能管理、插件推荐 |
| `40-mcp` | MCP 工具调用 |
| `45-sandbox` | 沙箱执行（代码/命令，声明式断网） |
| `50-notebook` / `55-run` / `60-trace` | 实验记录、运行与工具调用时间线 |
| `70-agent-chat` | 委派给子智能体的对话 |
| `75-plus-menu` | 输入区加号菜单 |
| `80-i18n` / `90-boot` | 中英文案（226 条，构建时校验键集合一致）与启动引导 |

**本地后端**（`app/src/server/`，绑定 `127.0.0.1`）：

| 模块 | 职责 |
|---|---|
| `index.ts` | 服务入口与 `/api/*` 鉴权中间件 |
| `routes.ts` | Work 模式 HTTP 路由 |
| `qoder.ts` | Qoder Agent SDK 封装（Agent 循环、工具调用、MCP 客户端、模型管理交给 SDK，不自研） |
| `ai.ts` | AI 流式代理（兼容 OpenAI Chat Completions 协议的上游） |
| `sse.ts` | Server-Sent Events 助手，统一事件帧格式 |
| `sandbox.ts` | 沙箱执行引擎（工作目录 `app/data/sandbox/<scopeId>/`） |
| `policy.ts` | 沙箱策略与路径守卫 |
| `research.ts` | 科研检索工具（arXiv / 网页抓取 / 联网检索，零依赖） |
| `sci-tools.ts` | 六个自定义科研工具（纯本地计算） |
| `domain-tools.ts` | 领域插件的 in-process MCP 工具实现 |
| `kb.ts` | 知识库 BM25 词法检索 |
| `memory.ts` | Work 项目记忆（记忆文件夹 + 任务记忆文档 + Stop 决策 hook） |
| `notes.ts` | 实验笔记存储（`app/data/notes/*.json`，Agent 与前端笔记本共用） |
| `audit.ts` | 工具调用审计日志（PreToolUse → PostToolUse/Failure） |
| `proc.ts` | 子进程与运行时管理（探测 python / node / uv / npm，带 TTL 缓存） |
| `store.ts` | Work 配置持久化（`app/data/work.json`，分区读改写） |
| `userdata.ts` | 用户级 Qoder 数据访问层（设置页真实数据源） |

**内置插件**（`app/server/plugins/`）：`research-ai`、`research-math`、`research-robotics`，每个含 `agents/`、`skills/`、`commands/`、`tools/` 与 `.mcp.json`、`configSchema.json`、`README.md`。

**外观**：12 套扩展主题 + light/dark，主题色只上外壳不动布局；其中 8 套带壁纸（素材在 `assets/wallpapers/`）。

## 构建与产物关系

仓库区分**手写源**与**编译产物**，产物会被下次构建覆盖，不要手改：

| 手写源 | 产物 | 依据 |
|---|---|---|
| `app/src/**/*.ts` | `app/**/*.js`（`main.js`、`preload.js`、`build.js`、`pack.js`、`make-icons.js`、`server/*.js`、`shared/*.js`、`verify/*.js`、`tools/wiki-lint.js`） | `app/tsconfig.json`、`app/tsconfig.verify.json`（outDir 为 `.`，原位编译） |
| `app/src/webapp/**` | `webapp/webapp.js`、`webapp/work/*.js` | `app/tsconfig.webapp.json`（outDir `../webapp`） |
| `webapp/主页面.html`（构建输入，可手改） | `app/renderer/index.html` | `app/src/build.ts` |

- 前端是**全局脚本模型**：主脚本与 14 个 Work 模块最终被 `build.ts` 拼进同一个 IIFE、共享一个作用域，因此 `tsconfig.webapp.json` 按 `module: none` 编译，各文件顶层 `const` 经全局声明合并互相可见，与运行时拼接语义严格一致。
- 改完源码请跑 `npm run build:ts && node build.js`，再用 `npm run guard:artifacts` 确认产物与提交一致。
- 更完整的路由规则见 [AGENTS.md](AGENTS.md)。

## 配置与密钥

| 文件 | 内容 | 是否入库 |
|---|---|---|
| `app/server/qoder.json` | Qoder 访问令牌（PAT），等同账户身份 | ❌ 已被 `.gitignore` 排除 |
| `app/server/config.json` | AI 上游 API Key | ❌ 已被 `.gitignore` 排除 |
| `app/data/` | 运行时数据：会话快照、`runtime.json`、用户数据、沙箱目录 | ❌ 不入库 |
| `sites/motai/.墨台产品页.qoder.site` | 站点发布描述符（含页面快照），随部署再生 | ❌ 不入库 |
| `examples/qoder-agent-sdk/njs/` | 本机 Node 发行版软链，指向仓库外绝对路径 | ❌ 不入库 |

首次使用请自行创建 `app/server/qoder.json` 与 `app/server/config.json`（或直接在界面里填 BYOK 密钥）。**分享便携版文件夹前务必清理这两个文件**，`pack.js` 生成的 `使用说明.txt` 里也有同样的提醒。

## 验证体系

`app/verify/` 下共 29 个 `.js` 与 6 个数据/报告文件。其中 **14 个是手写 JS**（在 `app/src/` 没有对应 `.ts`，不受 tsc 管辖）：`agent-run-diag`、`anim-coord-check`、`byok-bisect`、`byok-diag`、`byok-experiment`、`byok-run-check`、`cdp-eval`、`input-edge-check`、`layout-center-check`、`layout-refine-check`、`plugin-experiment`、`settings-e2e`、`settings-geometry`、`userdata-check`，另有 `app/server/plugins/*/tools/mcp-mini.js`。其余由 `app/src/verify/*.ts` 编译产出。

```bash
npm run verify              # 按层列出全部脚本，标注手写/编译
npm run verify sdk-smoke    # 单跑一个（透传退出码）
npm run verify -- --all     # 全量
```

验证报告与指标：`app/verify/验证报告.md`、`app/verify/metrics.json`、`work-metrics.json`、`agent-system-metrics.json`。

## 打包便携版

```bash
node pack.js
```

产物在 `app/dist/ChatScience-win32-x64/`：`ChatScience.exe`（electron.exe 改名，双击即用）+ Electron 运行时 + `resources/app/`（编译后的应用代码，**asar 关闭、明文可改**），并附 `重新构建.bat` 与 `使用说明.txt`。整个文件夹可拷贝到其他 Windows 机器使用；用户数据写在 `resources/app/data/`，删掉该目录即重置应用。

包内自检会核对可执行文件、主进程入口、渲染层、后端入口、图标、依赖与 Work 模块末文件等关键路径，缺一项即非零退出。换图标后重跑 `node make-icons.js` 再打包。

## 各子项目说明

**`sites/motai/`** —— 墨台产品页站点。`public/index.html` 是当前线上页；`functions/` 是"提交与读取"的匿名反馈接口（`index.ts` 入口，`adapter.mjs` / `handler.mjs` 适配）；`dev/feedback-local.mjs` 是本地开发桩；根目录的 `墨台产品页.html` 是旧版单页（保留备查）。发布描述符 `.墨台产品页.qoder.site` 不入库。

**`examples/qoder-agent-sdk/`** —— Qoder Agent SDK 样例工程，独立 `package.json`。仓库不内置 Node 发行版，克隆后需自备 `node`。

**`docs/plans/`** —— 七份实现策划案。`_src/*.md` 是 markdown 源（唯一真相），`_build/` 是 docx 生成链（`md2html.py` + `batch.py` + `config.json`），`_pipe/*/stage2/formatted-*.html` 是中间产物，`.docx` 是最终交付物。

**`docs/research/`** —— AgentsView 可观测性工具选型报告与会话统计导出（`sessions.json`、`stats.json`、`usage-daily.json`）。

**`assets/`** —— `brand/` 是 InkForge 品牌提案图（11 张文生图/改图产物，只作视觉基因库，不作产品命名）；`wallpapers/` 是 8 套主题壁纸；`marketing/` 是科研 Agent 宣传海报。

## 知识库（GitHub Wiki）

项目知识库不在本仓，位于[仓库 Wiki 页签](https://github.com/Lu-Yu-Zhen/ChatScience/wiki)：`Home.md` 是入口，`SCHEMA.md` 是契约（分层、页面格式、Raw 登记表、机器校验规则），`index.md` 是页面目录（生成物），`log.md` 是操作时间线。页面按 `entities/`（实体）、`concepts/`（概念）、`sources/`（资料摘要）、`syntheses/`（综合）四类组织，事实句后面用 `` `仓库路径:行号` `` 作可核验证据。

本地维护：

```bash
git clone https://github.com/Lu-Yu-Zhen/ChatScience.wiki.git chatscience-wiki
cd app
CS_WIKI_DIR=../chatscience-wiki npm run wiki:lint            # 全量检查
CS_WIKI_DIR=../chatscience-wiki npm run wiki:lint -- --fix   # 重生成 index.md
CS_WIKI_DIR=../chatscience-wiki npm run wiki:lint -- --add entity/<id> --title "标题" --sources app/src/
CS_WIKI_DIR=../chatscience-wiki npm run wiki:lint -- --log ingest --title "标题" --author "你的名字"
```

未设 `CS_WIKI_DIR` 时工具仍会在仓内找 `wiki/`，因正文已迁出，会以退出码 2 提示缺少 `SCHEMA.md`。详细分工见 [wiki/README.md](wiki/README.md)。

## 注意事项与常见问题

- **不要手改编译产物**：`app/**/*.js` 与 `webapp/**/*.js` 由 `app/src/**` 编译产出。要改就改 `.ts`，然后 `npm run build:ts`。
- **`webapp/主页面.html` 可以手改**：它是 `build.ts` 的输入模板，含 `<!--CS_MAIN_SCRIPT-->` 与 `<!--CS_WORK_MODULES-->` 两个注入标记，删掉会导致构建失败。
- **克隆后白屏 / 找不到页面**：`app/renderer/` 不入库，先跑一次 `node build.js`。
- **前端编译报 `UNKNOWN: unknown error, open ...`**：多为瞬时文件锁（杀毒软件或索引器占用），重跑一次 `tsc -p tsconfig.webapp.json` 通常即过。
- **端口被占用**：后端会自动换端口，实际端口看 `app/data/runtime.json`。
- **类型错误会阻止产出**：三套配置都是 `noEmitOnError`，`start.bat` 与 `build.js` 在编译失败时会中止，不会启动一个白屏应用。
- **换行策略**：`.gitattributes` 把 `*.js` / `*.md` 固定为 LF（与 tsc 产出一致），跨平台协作不会出现整文件行尾漂移；老检出如遇伪修改，`git add --renormalize .` 后提交一次即可归一。
- **分享产物前**：清理 `app/server/qoder.json` 与 `app/server/config.json`。

## 许可

[MIT](LICENSE)，Copyright © 2026 Lu-Yu-Zhen
