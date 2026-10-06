---
type: schema
title: 墨台 Wiki · Schema 契约
tags: [schema, 契约, 入口]
sources: [AGENTS.md, wiki/]
updated: 2026-10-06
status: stable
---

# 墨台 Wiki · Schema 契约

> 本文件是整个 Wiki 系统唯一的配置契约：如何分层、页面写成什么样、Raw 资料怎么登记、Ingest/Query/Lint 怎么走、哪些检查由机器强制执行。**任何操作 `wiki/` 之前先完整读这里。**

模式来源：Karpathy《LLM Wiki》(gist `442a6bf`) —— 不做"每次提问重新检索"的 RAG，而是让 LLM **增量构建并长期维护一份持久的、会复利增值的知识产物**：交叉引用与已合并的结论稳定地留在页面上，人负责选题、取材和提问，机器负责簿记。

## 一、三层架构

| 层 | 位置 | 归属 | 可写性 |
|---|---|---|---|
| **Raw** | 仓库既有资料：策划案 `_src/`、`app/src/**` 源码、`app/verify/` 脚本与报告、`AGENTS.md`、各站点与品牌资产 | 用户 / 构建系统 | ❌ 对 Wiki 侧只读，永不改动 |
| **Wiki** | `wiki/` 下除本文件与生成物外的全部 `.md` | LLM 完全拥有 | ✅ 创建、改写、交叉引用 |
| **Schema** | `wiki/SCHEMA.md` | 人与 LLM 共同演化 | 受限可写：只在约定要变时改，改完必须记 `log.md` 并同步 `app/src/tools/wiki-lint.ts` |

不建 `wiki/raw/` 镜像目录：**仓库自身就是 Raw 层**。资料以 §二的登记表登记、以路径引用，不复制内容，避免出现第二份真相。

## 二、Raw 登记表

`sources:` 与正文里出现的仓库路径，只有落在下表前缀内才算合法（机器校验 `SRC-UNREGISTERED`）。新增资料簇 = 先改本表，再改工具里的 `RAW_PREFIXES`，最后写页 —— 顺序不能反。

| 前缀 | 是什么 |
|---|---|
| `AGENTS.md` | 源码/产物地图与仓库规则 |
| `墨台实现策划案/_src/` | 七份实现策划案的 markdown 源（`.docx` 是产物，不登记） |
| `app/src/` | 唯一手写源码（Electron 主进程 / preload / server / shared / webapp / verify / tools） |
| `app/verify/` | 验证脚本与验证报告（含手写 `.js` 例外） |
| `app/server/plugins/` | 内置科研插件（agents / skills / commands / tools / roles / routing） |
| `app/package.json`、`app/tsconfig.json`（及 `.webapp`/`.verify` 两套）、`app/start.bat` | 脚本入口、三套编译配置、启动方式 |
| `app/TypeScript迁移说明.md` | TS 迁移史与取舍 |
| `01/主页面.html` | 渲染层模板（build 输入，非产物） |
| `motai-site/`、`墨台产品页.html` | 产品页站点与根目录旧站点文件 |
| `inkforge-brand_assets/`、`主题壁纸/` | 品牌图像资产、八套壁纸 |
| `agentsview-report/` | AgentsView 调研报告与会话统计 |
| `SDK应用/` | Qoder Agent SDK 样例工程（`njs/` 是本机 Node 发行版软链，不入库、不可引） |
| `测试文件夹/` | 人工验证记录与夹具 |
| `wiki/` | Wiki 自身页面（仅综合页/派生页可引） |
| `.gitattributes`、`.gitignore` | 换行策略与忽略契约 |

**禁引清单**（机器校验 `SRC-UNSHARED` / `SRC-PRODUCT`）：

- 不随 git 共享的本机路径：`.qoder/`、`.qoder-cn/`、`.trae/`、`.qoder-plugin/`、`.workbuddy/`、`.verify-tmp/`、`.verify-shots/`、`memory/`、`~`、任何绝对路径或盘符。
- 构建产物与运行时数据：`app/renderer/`、`app/dist/`、`app/data/`、`node_modules/`、`01/**.js`、以及任何在 `app/src/` 有同名 `.ts` 的 `app/**.js`。产物会被下次构建覆盖，页面上的行号会当场失效 —— 证据一律指向 `app/src/**` 的手写源。
- 密钥文件：`app/server/qoder.json`、`app/server/config.json`。

## 三、目录结构

```
wiki/
├── SCHEMA.md      # 本文件：契约与工作流（type: schema）
├── index.md       # 目录：按类列出每页 + 一行摘要 —— 生成物，勿手改（type: meta）
├── log.md         # 时间线：append-only 操作流水 —— 生成物，只追加（type: meta）
├── overview.md    # 顶层综述：项目全景导航 + 已知矛盾清单（type: synthesis）
├── sources/       # 资料摘要页：一份 Raw 资料一页（type: source）
├── entities/      # 实体页：模块/系统/组件/产品 —— "它是什么、由哪些部分组成、和谁交互"（type: entity）
├── concepts/      # 概念页：约定/机制/决策/踩坑 —— "为什么这样设计、约束是什么"（type: concept）
└── syntheses/     # 综合页：跨主题对比、结论、Query 回填 —— "把几处合起来说一件事"（type: synthesis）
```

四类内容目录与 `type` 必须一一对应（`FM-TYPE-DIR`）。判断归属：只讲一份资料 → source；指得出的东西 → entity；抽象规则与经验 → concept；需要横向比较或回填结论 → synthesis。

## 四、页面格式

每个内容页以 YAML frontmatter 开头，六个字段全部必填：

```markdown
---
type: entity
title: 后端服务
tags: [server, HTTP, 墨台]
sources: [app/src/server/, 墨台实现策划案/_src/03-后端.md]
updated: 2026-10-04
status: stable
---

# 后端服务

> 一句话摘要：index.md 与 overview 直接取这一行，所以它必须是"这页讲什么"，不是修饰语。

## 是什么
正文。事实句后面用反引号带仓库路径与行号作为证据，例如 `app/src/server/routes.ts:12`。

## 关联
- 实体：[墨道](../entities/墨道.md)
- 概念：[沙箱机制](../concepts/sandbox.md)
```

字段规则：

- `type`：`source` / `entity` / `concept` / `synthesis` / `schema` / `meta`。
- `title`：与正文一级标题逐字一致（`BODY-TITLE`）。
- `tags`：非空数组，用于检索；3~6 个，含至少一个子系统标签。
- `sources`：非空、可核验的 Raw 路径（目录以 `/` 结尾），不允许"全部"这类模糊值。
- `updated`：ISO 日期，不晚于今天；晚于所引资料最后一次提交即触发 `STALE` warning。
- `status`：`stable`（已对着当前源码核实）/ `draft`（补写中）/ `disputed`（存在未消解矛盾，页内必须有 `⚠️` 行）/ `archived`（被推翻，只保留历史）。

正文契约：

1. **摘要行**：一级标题后第一段以 `> ` 开头，一句话。`index.md` 由它生成。
2. **证据引用**：事实性断言后面给 `` `仓库相对路径` `` 或 `` `仓库相对路径:行号` `` / `` `路径:起-止` ``。行号必须落在文件真实行数内（`EVID-RANGE`）。代码围栏内的引用不校验。引用行要指向**语句或块起始的那一行**，不要落在 `}`、`});` 或空行上——机器只校验范围，不校验语义。改动密集的文件（`app/src/webapp/webapp.ts`、`app/src/server/qoder.ts`、`app/src/server/routes.ts` 一类）一次提交就可能让成片行号漂移：这些页要同时给出**符号名**（函数名、端点路径、字段名）作为主锚，源码变更后按符号重锚，别只靠行号。
3. **矛盾要显式**：新资料推翻旧结论时不静默覆盖，写 `⚠️ 冲突：…` 并链到冲突的另一页（`CONTRA-LINK`）。
4. **一页一主题、克制篇幅**：概览 + 链接优于堆砌，细节留在 Raw；单页正文建议 ≤ 120 行。
5. **链接优先**：交叉引用是本 Wiki 的价值核心，提到已有页面的实体/概念必须链接（Obsidian `[[wikilink]]` 禁止，`LINK-WIKILINK`）；无入链的孤儿页与零 `.md` 链接的薄页由机器点名。
6. **零密钥**：任何凭据、token、私钥片段不得出现在页面里（`SECRET`）。

## 五、命名

- 文件名即页面唯一标识：小写 `kebab-case`，中文主题可直接用中文名（如 `entities/墨道.md`）；全库大小写不敏感去重（`NAME-DUP`），文件名不得含空格与 `\/:*?"<>|`（`NAME-ILLEGAL`）。
- 页内链接一律相对路径 markdown 链接：`../concepts/sandbox.md`、`overview.md`；URL 编码可被解析（工具会 decode）。
- `wiki/*.md` 由 `.gitattributes` 固定 LF 换行，避免跨平台整文件改写。

## 六、工作流

### Ingest（用户给新资料要沉淀）

1. 若资料簇不在 §二 登记表内，先改 SCHEMA + 工具再往下走。
2. `npm run wiki:lint -- --add source/<id> --title "资料标题" --sources 路径1,路径2` 生成合规骨架。
3. 读 Raw，写摘要页；**再更新所有被触及的 entity/concept/synthesis 页**（一份资料常牵动 10+ 页），不新开重复页。
4. 冲突处加 `⚠️` 行，并把被推翻的页 `status` 改掉。
5. `npm run wiki:lint -- --fix` 重生成 `index.md`，`npm run wiki:lint -- --log ingest --title "资料标题"` 追加时间线。
6. `npm run wiki:lint` 退出码为 0 才算完成。

### Query（问项目知识）

1. 先读 `index.md` 定位候选页，再钻取页面，顺链接扩展；不足时才回读 Raw。
2. 回答给出页面链接与 Raw 出处，不空口结论。
3. **有价值的回答回填**：对比表、跨主题结论、新发现的关联 —— 写成 `syntheses/` 页（或补进既有页），让每次探索也进入复利。回填走 `--add synthesis/<id>`，并在 `log.md` 记 `query`。

### Lint（定期或改动后）

`npm run wiki:lint`（在 `app/` 目录）跑 §七 全部规则；`--fix` 只重写 `index.md`。warning 不阻塞合并，但 `STALE` / `ORPHAN` / `EVID-NONE` 必须进下一个维护周期。每轮 Lint 在 `log.md` 记一条 `lint`，写清修了什么、还欠什么。

## 七、机器校验规则表

工具：`app/src/tools/wiki-lint.ts`（编译产物 `app/tools/wiki-lint.js`，`npm run wiki:lint`）。**改规则必须同步改本表与 §四/§二 正文**。退出码：0 = 无 error，1 = 有 error，2 = 无法执行（wiki 目录缺失）。

| 码 | 级别 | 检查 |
|---|---|---|
| NAME-ILLEGAL / NAME-DUP | E | 文件名非法字符 / 全库 id 重复 |
| BOM / EOL-CRLF | E / W | UTF-8 BOM / CRLF 换行 |
| FM-MISSING / FM-FIELD / FM-UNKNOWN-FIELD | E / E / W | 缺 frontmatter / 缺必填字段 / 出现未知字段 |
| FM-TYPE / FM-TYPE-DIR / FM-STATUS / FM-DATE / FM-DATE-FUTURE | E | 枚举值非法 / type 与目录不符 / 日期非法或在未来 |
| FM-TAGS / FM-SOURCES | E | tags 为空 / sources 为空 |
| BODY-H1 / BODY-TITLE / BODY-SUMMARY | E | 缺一级标题 / 标题与 title 不一致 / 缺 `> ` 摘要行 |
| BODY-RELATED | W | 内容页缺 `## 关联` 分节 |
| LINK-WIKILINK / LINK-BROKEN | E | 用了 `[[wikilink]]` / 相对链接目标不存在 |
| SRC-UNSHARED / SRC-PRODUCT / SRC-VAGUE / SRC-UNREGISTERED / SRC-MISSING | E | 指向本机私有路径 / 构建产物 / "全部" / 未登记前缀 / 路径不存在 |
| EVID-NONE / EVID-BAD / EVID-RANGE / EVID-PRODUCT | W / E / E / E | 整页零证据 / 证据路径不存在 / 行号越界 / 证据指向产物 |
| CONTRA-LINK | W | `⚠️` 冲突行没有链接另一页 |
| STALE | W | `updated` 早于所引资料最后一次提交 |
| INDEX-MISSING / INDEX-DRIFT | E | index.md 不存在 / 与页面集不一致（跑 `--fix`） |
| LOG-MISSING / LOG-EMPTY / LOG-FORMAT / LOG-DATE / LOG-OP / LOG-AUTHOR | E | 时间线缺失、无条目、条目格式或日期或操作类型非法、缺 `— @作者` |
| LOG-ORDER | W | 条目日期倒序 |
| ORPHAN / LINK-THIN | W | 无入链 / 页内零 `.md` 链接 |
| SECRET | E | 疑似密钥（GitHub token、AKIA、sk-、私钥块、Bearer、JWT） |

`--fix` 会按各页 frontmatter 与摘要行重写 `index.md`（分类顺序：entities → concepts → sources → syntheses，非 stable 页带 `〔status〕` 标记），因此 **index.md 永远不手改** —— 并行摄取必然冲突。

## 八、index 与 log 分工

- `index.md` = **内容导向**目录，查询入口，生成物。
- `log.md` = **时间导向**流水，append-only，只在文件末尾追加，条目格式固定：
  `## [YYYY-MM-DD] <op> | <标题> — @<作者>`，`op ∈ init | ingest | query | lint | schema | restore | rebuild`。
  取最近 5 条：`grep "^## \[" wiki/log.md | tail -5`。

## 九、演化说明

本契约与项目共同演化。更顺手就改，但每次改动：① 改本文件；② 同步 `wiki-lint.ts` 与本表；③ `log.md` 记一条 `schema`。工具只做契约已承诺的事 —— 想要新检查，先写进 §四/§七。
