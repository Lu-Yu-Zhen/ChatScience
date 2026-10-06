# ChatScience · 源码/产物地图

本文件只记录本仓库已核实的事实，目的只有一个：把改动路由到正确的文件，不要手改构建产物。

## 事实

- **唯一手写源码是 `app/src/**`（TypeScript）**：Electron 主进程 / preload、构建与打包脚本、`server/`、`shared/`、`verify/`，以及前端 `app/src/webapp/`（含 `work/` 模块）。
- **构建输出（勿手改，会被下次构建覆盖）**：
  - `01/**.js`：`01/webapp.js` 与 `01/work/*.js`，由 `app/src/webapp/**` 编译产出——依据 `app/tsconfig.webapp.json:16`（outDir `../01`）。
  - `app/**/*.js`：`app/main.js`、`preload.js`、`build.js`、`pack.js`、`make-icons.js`、`server/*.js`、`shared/*.js`、`verify/*.js`、`tools/wiki-lint.js` 等，由 `app/src/**` 对应 TS 原位编译产出——依据 `app/tsconfig.json` 与 `app/tsconfig.verify.json`（outDir `.`）。（例外·手写 JS，在 `app/src/` 无对应 `.ts`、不受 typecheck 与 build:ts 管辖，改它们不经过 tsc：`app/verify/` 的 agent-run-diag、anim-coord-check、byok-bisect、byok-diag、byok-experiment、byok-run-check、cdp-eval、input-edge-check、layout-center-check、layout-refine-check、plugin-experiment、settings-e2e、settings-geometry、userdata-check 共 14 个，以及 `app/server/plugins/*/tools/mcp-mini.js`。）
  - `app/renderer/index.html`：由 `app/src/build.ts` 组装——读入 `01/主页面.html`，内联 `01/webapp.js` 与 `01/work/*.js` 并注入桌面适配层后写出（依据 `app/src/build.ts:15-16`）。
- **`01/主页面.html` 是构建输入，不是产物**：它是 build.ts 的源模板（含 `<!--CS_MAIN_SCRIPT-->`、`<!--CS_WORK_MODULES-->` 注入标记），可手改。`01/` 同时承担产物目录与 HTML 输入目录两种角色。
- **`wiki/` 是 Karpathy《LLM Wiki》模式的三层知识库（v2 契约 = `wiki/SCHEMA.md`）**：Raw = 仓库既有资料（对 Wiki 侧只读，按 SCHEMA §二 登记表登记）→ Wiki（`wiki/{sources,entities,concepts,syntheses}/*.md`，由 LLM 维护，每页带 YAML frontmatter 与 `` `路径:行号` `` 形式的可核验引用）→ Schema（`wiki/SCHEMA.md`，契约）。`wiki/index.md` 与 `wiki/log.md` 是**生成物**（勿手改，并行摄取必然冲突），`wiki/SCHEMA.md` 与 `wiki/overview.md` 可手改。

## 规则

- 代码改动只能落在 `app/src/**`（渲染层模板改 `01/主页面.html`），随后用 `npm run build:ts` 传播到上述 JS 产物；`app/renderer/index.html` 再经 `node build.js` 更新。命令均在 `app/` 目录执行。
- 提交前运行 `npm run typecheck`（覆盖 tsconfig.json / tsconfig.webapp.json / tsconfig.verify.json 三套配置）。
- 验证脚本统一入口：`npm run verify`（app/ 目录）按层列出全部 `app/verify/*.js` 并标注手写/编译；`npm run verify <name>` 单跑（透传退出码），`npm run verify -- --all` 全量。
- **Wiki 维护**：操作 `wiki/` 前先完整读 `wiki/SCHEMA.md`（页面格式、Raw 登记表、命名与链接规则都在那里）。三个触发流程：用户给新资料要沉淀 → Ingest；问项目知识 → Query，有价值的答案回填成新页；定期或改动后 → Lint。每次改动后跑 `npm run wiki:lint`（app/ 目录，非零退出即不通过），用 `npm run wiki:lint -- --fix` 重新生成 `wiki/index.md`，并向 `wiki/log.md` 末尾追加一条 `## [YYYY-MM-DD] <op> | <标题> — @作者`。
- **Wiki 边界**：Raw 层（策划案 `_src/`、`AGENTS.md`、源码、验证脚本）对 Wiki 侧只读；Wiki 页面不得写入密钥，不得引用 `.qoder-cn/`、`.qoder/`、`memory/` 等不随 git 共享的本机路径。
