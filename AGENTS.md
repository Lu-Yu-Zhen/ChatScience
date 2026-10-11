# ChatScience · 源码/产物地图

本文件只记录本仓库已核实的事实，目的只有一个：把改动路由到正确的文件，不要手改构建产物。

## 目录结构（标准布局）

```
ChatScience/
├── README.md / LICENSE         # 仓库门面：项目说明与许可
├── AGENTS.md                   # 本文件：源码/产物地图与仓库规则
├── .gitignore / .gitattributes # 忽略契约与换行策略
├── app/                        # Electron 桌面应用（chatscience-desktop）
│   ├── src/                    # 唯一手写源码（TypeScript）
│   ├── verify/                 # 验证脚本与验证报告
│   ├── server/ shared/ tools/ icons/
│   ├── package.json / tsconfig*.json / start.bat
│   └── main.js 等              # tsc 原位编译产物（勿手改）
├── webapp/                     # 渲染层：主页面.html 模板 + webapp.js、work/*.js（tsc 产物）
├── sites/motai/                # 墨台产品页站点（public=Pages 源 / functions / dev）+ 旧版单页
├── examples/qoder-agent-sdk/   # Qoder Agent SDK 样例工程
├── docs/
│   ├── plans/                  # 七份实现策划案（_src 源 + _pipe/_build 生成链 + .docx）
│   └── research/               # AgentsView 调研报告与会话统计
├── assets/
│   ├── brand/                  # InkForge 品牌图像资产
│   ├── wallpapers/             # 八套主题壁纸
│   └── marketing/              # 科研 Agent 宣传海报
└── wiki/README.md              # 指向 GitHub Wiki 的指引（知识库本体在仓库 Wiki 页签）
```

## 事实

- **唯一手写源码是 `app/src/**`（TypeScript）**：Electron 主进程 / preload、构建与打包脚本、`server/`、`shared/`、`verify/`、`tools/`，以及前端 `app/src/webapp/`（含 `work/` 模块）。
- **构建输出（勿手改，会被下次构建覆盖）**：
  - `webapp/**.js`：`webapp/webapp.js` 与 `webapp/work/*.js`，由 `app/src/webapp/**` 编译产出——依据 `app/tsconfig.webapp.json`（outDir `../webapp`）。
  - `app/**/*.js`：`app/main.js`、`preload.js`、`build.js`、`pack.js`、`make-icons.js`、`server/*.js`、`shared/*.js`、`verify/*.js`、`tools/wiki-lint.js` 等，由 `app/src/**` 对应 TS 原位编译产出——依据 `app/tsconfig.json` 与 `app/tsconfig.verify.json`（outDir `.`）。（例外·手写 JS，在 `app/src/` 无对应 `.ts`、不受 typecheck 与 build:ts 管辖，改它们不经过 tsc：`app/verify/` 的 agent-run-diag、anim-coord-check、byok-bisect、byok-diag、byok-experiment、byok-run-check、cdp-eval、input-edge-check、layout-center-check、layout-refine-check、plugin-experiment、settings-e2e、settings-geometry、userdata-check 共 14 个，以及 `app/server/plugins/*/tools/mcp-mini.js`。）
  - `app/renderer/index.html`：由 `app/src/build.ts` 组装——读入 `webapp/主页面.html`，内联 `webapp/webapp.js` 与 `webapp/work/*.js` 并注入桌面适配层后写出。
- **`webapp/主页面.html` 是构建输入，不是产物**：它是 build.ts 的源模板（含 `<!--CS_MAIN_SCRIPT-->`、`<!--CS_WORK_MODULES-->` 注入标记），可手改。
- **知识库不在本仓**：`wiki/` 已迁至 GitHub Wiki（`<仓库>.wiki.git`），契约是其中的 `SCHEMA.md`；本仓只留 `wiki/README.md` 作指引。Raw 层仍是本仓资料，Wiki 页内路径相对本仓根解析。
- **`sites/motai/public/` 是全仓唯一对外公开的目录**：GitHub Pages 由 Actions 工作流只上传该目录（<https://lu-yu-zhen.github.io/ChatScience/>），内容与链接一律按"互联网可见"对待；内部策划案、调研报告、资产、源码与密钥都不进这个目录，旧版单页 `墨台产品页.html` 也不发布。
- **换行策略**：`.gitattributes` 把 `*.js` / `*.md` 固定为 LF——与 tsc 产出一致，消除 autocrlf 往返造成的伪修改（`git status` 噪声）。
- **不入库的敏感/生成物**：`app/server/qoder.json` 与 `app/server/config.json`（含 Qoder PAT 与 AI API Key）、`app/data/`、`sites/motai/.墨台产品页.qoder.site`（站点发布描述符，随部署再生）、`examples/qoder-agent-sdk/njs/`（本机 Node 发行版软链）。

## 规则

- 代码改动只能落在 `app/src/**`（渲染层模板改 `webapp/主页面.html`），随后用 `npm run build:ts` 传播到上述 JS 产物；`app/renderer/index.html` 再经 `node build.js` 更新。命令均在 `app/` 目录执行。
- 提交前运行 `npm run typecheck`（覆盖 tsconfig.json / tsconfig.webapp.json / tsconfig.verify.json 三套配置），并用 `npm run guard:artifacts` 确认产物与最后一次提交一致。
- 验证脚本统一入口：`npm run verify`（app/ 目录）按层列出全部 `app/verify/*.js` 并标注手写/编译；`npm run verify <name>` 单跑（透传退出码），`npm run verify -- --all` 全量。
- **Wiki 维护**：知识库在 GitHub Wiki。本地先克隆 `<仓库>.wiki.git`，设 `CS_WIKI_DIR` 指向该检出，即可在 `app/` 目录跑 `npm run wiki:lint`（`--fix` 重生成 `index.md`，`--add` 产骨架页，`--log` 记时间线）。契约变更必须同步改 Wiki 里的 `SCHEMA.md` 与 `app/src/tools/wiki-lint.ts` 的 `RAW_PREFIXES`，并在 `log.md` 记一条 `schema`。
- **Wiki 边界**：Raw 层（`docs/plans/_src/`、`app/src/**`、`app/verify/`、`app/server/plugins/`、`AGENTS.md`、各站点与品牌资产）对 Wiki 侧只读；Wiki 页面不得写入密钥，不得引用 `.qoder/`、`.qoder-cn/`、`.trae/`、`.qoder-plugin/`、`.workbuddy/`、`.verify-tmp/`、`.verify-shots/`、`memory/` 等不随 git 共享的本机路径，也不得引用 `sites/motai/.墨台产品页.qoder.site` 这类不入库的生成物。
