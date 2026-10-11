# ChatScience

墨台（Motai）产品线的工程仓：以 **ChatScience 桌面应用**（Electron 前后端分离）为主体，附带产品页站点、SDK 样例、实现策划案、品牌与壁纸资产，以及一份迁往 GitHub Wiki 的项目知识库。

## 目录结构

```
ChatScience/
├── app/                        # Electron 桌面应用（chatscience-desktop）
│   ├── src/                    # 唯一手写源码（TypeScript）
│   │   ├── main.ts / preload.ts        # Electron 主进程与预加载桥
│   │   ├── server/ shared/             # 本地后端服务与共享模块
│   │   ├── webapp/ webapp/work/        # 前端主脚本与 Work 模块
│   │   ├── verify/ tools/              # 验证脚本与 wiki-lint 工具
│   ├── verify/                 # 验证脚本与验证报告（含 14 个手写 JS 例外）
│   ├── server/ shared/ icons/  # 内置插件、共享代码、应用图标
│   ├── package.json / tsconfig*.json / start.bat
│   └── main.js 等              # tsc 原位编译产物（勿手改）
├── webapp/                     # 渲染层：主页面.html 模板 + webapp.js、work/*.js（tsc 产物）
├── sites/motai/                # 墨台产品页站点（public / functions / dev）+ 旧版单页
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

源码与产物的对应关系、改动该落在哪个文件，见 [AGENTS.md](AGENTS.md)。

## 快速开始

桌面应用（命令均在 `app/` 目录执行）：

```bash
cd app
npm install          # 首次
npm start            # 编译三套 TypeScript 配置后启动 Electron
```

其他常用命令：

| 命令 | 作用 |
|---|---|
| `npm run typecheck` | 三套 tsconfig（核心 / 前端 / verify）类型检查 |
| `npm run build:ts` | 编译全部 TypeScript，产物落回原路径与 `webapp/` |
| `node build.js` | 由 `webapp/主页面.html` 组装 `app/renderer/index.html` |
| `npm run guard:artifacts` | 校验编译产物与最后一次提交一致 |
| `npm run verify` | 枚举全部验证脚本；`npm run verify <name>` 单跑，`-- --all` 全量 |
| `node pack.js` | 打出便携版（dist/） |

站点与样例工程各自独立：`sites/motai/` 是静态页 + 函数接口，`examples/qoder-agent-sdk/` 需自备 Node（仓库不内置 Node 发行版）。

## 知识库（GitHub Wiki）

项目知识库不在本仓，位于本仓库的 **Wiki 页签**（`<仓库>.wiki.git`），入口页 `Home.md`，契约页 `SCHEMA.md`。本地维护方式：

```bash
git clone <仓库>.wiki.git                 # 克隆知识库
cd app
CS_WIKI_DIR=../<wiki 目录名> npm run wiki:lint          # 全量检查
CS_WIKI_DIR=../<wiki 目录名> npm run wiki:lint -- --fix  # 重生成 index.md
```

详见 [wiki/README.md](wiki/README.md)。

## 注意事项

- **不要手改编译产物**：`app/**/*.js` 与 `webapp/**/*.js` 由 `app/src/**` 编译产出，改动请回到 `.ts` 源文件后跑 `npm run build:ts`。
- **敏感文件不入库**：`app/server/qoder.json`（Qoder PAT）与 `app/server/config.json`（AI API Key）已被 `.gitignore` 排除；分享产物前请清理。
- **换行策略**：`.gitattributes` 将 `*.js` / `*.md` 固定为 LF，与 tsc 产出一致，可避免 `git status` 出现伪修改。

## 许可

[MIT](LICENSE)
