# ChatScience · 源码/产物地图

本文件只记录本仓库已核实的事实，目的只有一个：把改动路由到正确的文件，不要手改构建产物。

## 事实

- **唯一手写源码是 `app/src/**`（TypeScript）**：Electron 主进程 / preload、构建与打包脚本、`server/`、`shared/`、`verify/`，以及前端 `app/src/webapp/`（含 `work/` 模块）。
- **构建输出（勿手改，会被下次构建覆盖）**：
  - `01/**.js`：`01/webapp.js` 与 `01/work/*.js`，由 `app/src/webapp/**` 编译产出——依据 `app/tsconfig.webapp.json:16`（outDir `../01`）。
  - `app/**/*.js`：`app/main.js`、`preload.js`、`build.js`、`pack.js`、`make-icons.js`、`server/*.js`、`shared/*.js`、`verify/*.js` 等，由 `app/src/**` 对应 TS 原位编译产出——依据 `app/tsconfig.json` 与 `app/tsconfig.verify.json`（outDir `.`）。（例外：`app/verify/` 下部分旧诊断脚本与 `app/server/plugins/*/tools/mcp-mini.js` 为手写 JS，无 TS 镜像。）
  - `app/renderer/index.html`：由 `app/src/build.ts` 组装——读入 `01/主页面.html`，内联 `01/webapp.js` 与 `01/work/*.js` 并注入桌面适配层后写出（依据 `app/src/build.ts:15-16`）。
- **`01/主页面.html` 是构建输入，不是产物**：它是 build.ts 的源模板（含 `<!--CS_MAIN_SCRIPT-->`、`<!--CS_WORK_MODULES-->` 注入标记），可手改。`01/` 同时承担产物目录与 HTML 输入目录两种角色。

## 规则

- 代码改动只能落在 `app/src/**`（渲染层模板改 `01/主页面.html`），随后用 `npm run build:ts` 传播到上述 JS 产物；`app/renderer/index.html` 再经 `node build.js` 更新。命令均在 `app/` 目录执行。
- 提交前运行 `npm run typecheck`（覆盖 tsconfig.json / tsconfig.webapp.json / tsconfig.verify.json 三套配置）。
