---
type: entity
title: Wiki 系统
tags: [wiki, 知识库, 工具链, 工程约束, 墨台]
sources: [wiki/SCHEMA.md, app/src/tools/wiki-lint.ts, app/package.json, AGENTS.md, .gitattributes]
updated: 2026-10-06
status: stable
---

# Wiki 系统

> 一句话摘要：仓库自带一个 LLM 维护的三层知识库（Raw / Wiki / Schema），配套一个 733 行的机械校验器 wiki-lint，它只做契约已承诺的检查与三种维护动作。

## 三层结构与归属

- Raw = 仓库既有资料（策划案源、`app/src/**`、`app/verify/`、`AGENTS.md`、品牌与站点资产），对 Wiki 侧只读；Wiki = `wiki/{sources,entities,concepts,syntheses}/*.md`，由 LLM 创建改写；Schema = `wiki/SCHEMA.md`，人与 LLM 共同演化的契约，见 `wiki/SCHEMA.md:16-24`。
- 不建 wiki/raw 镜像目录：仓库自身就是 Raw 层，资料以路径登记不复制内容，`wiki/SCHEMA.md:24`。
- 目录与 type 一一对应（sources→source、entities→entity、concepts→concept、syntheses→synthesis），映射表在 `app/src/tools/wiki-lint.ts:55-56`，违反即 FM-TYPE-DIR 报错。
- `wiki/index.md` 与 `wiki/log.md` 是生成物：前者由 --fix 重写，后者只追加，`AGENTS.md:13`。
- 页面分类判断口径（source 还是 entity/concept/synthesis）见 `wiki/SCHEMA.md:68`。

## 工具能力

- 工具源 `app/src/tools/wiki-lint.ts`（733 行，头部用法注释 `app/src/tools/wiki-lint.ts:2-11`）；app 下的 tools/wiki-lint.js 是它的编译产物，由核心配置管辖（`app/tsconfig.json:29-30`），npm 包装在 `app/package.json:10`。
- 四种调用形态：全量检查（默认）、`--fix` 重写 index.md、`--add <type>/<id> --title T [--sources a,b]` 生成骨架页、`--log <op> --title "<标题>" [--author 名字]` 追加时间线；分支落在 `app/src/tools/wiki-lint.ts:681-688` 与 `app/src/tools/wiki-lint.ts:708-717`。
- `--add` 按契约模板产页且**已存在不覆盖**（`app/src/tools/wiki-lint.ts:623-659`，模板含 draft 状态与占位标题），SCHEMA 的 Ingest 第 2 步依赖它（`wiki/SCHEMA.md:125`）。
- `--log` 校验 op 白名单（init|ingest|query|lint|schema|restore|rebuild，`app/src/tools/wiki-lint.ts:59`），作者默认取 git user.name（`app/src/tools/wiki-lint.ts:606-613`）。
- `--fix` 只在内容有变化时才写 index.md（`app/src/tools/wiki-lint.ts:710-714`），索引分类顺序 entities→concepts→sources→syntheses（`app/src/tools/wiki-lint.ts:60`），非 stable 页带状态标记（`app/src/tools/wiki-lint.ts:524-526`）。
- 退出码 0=无 error、1=有 error、2=wiki 目录不可用（`app/src/tools/wiki-lint.ts:8`、`app/src/tools/wiki-lint.ts:676-679`、`app/src/tools/wiki-lint.ts:730`）。

## 检查是怎么落地的

- Raw 登记表是 SCHEMA §二 的机器镜像：`app/src/tools/wiki-lint.ts:70-91` 共 20 条前缀，页内 sources 与正文反引号引用只有落在前缀内才校验（`app/src/tools/wiki-lint.ts:238-240`、`app/src/tools/wiki-lint.ts:429`）——新增资料簇必须先改 SCHEMA 再改这张表（`wiki/SCHEMA.md:28`）。
- 行号引用只校验"存在 + 不越界"，**不校验语义**：源码一改就是一片行号漂到别的语句上。因此 `wiki/SCHEMA.md:108` 规定锚点要落在语句或块的起始行，改动密集的文件（`app/src/webapp/webapp.ts`、`app/src/server/qoder.ts`、`app/src/server/routes.ts` 一类）还要同时给符号名，复核时按符号重锚。
- 产物判定是运行时推断而非硬编码：app 下的 .js 当 `app/src/` 存在同名 .ts 时判为产物（`app/src/tools/wiki-lint.ts:268-277`），与 `AGENTS.md:10` 的手写 JS 例外规则同源。
- 禁引本机私有路径与运行时/密钥文件：两张清单在 `app/src/tools/wiki-lint.ts:94` 与 `app/src/tools/wiki-lint.ts:97`，理由见 `AGENTS.md:21`。
- 行号校验按文件真实行数（`app/src/tools/wiki-lint.ts:244-261`、`app/src/tools/wiki-lint.ts:459-465`），代码围栏内的引用不校验（`app/src/tools/wiki-lint.ts:163-175`）。
- STALE 靠 git 最后一次提交日期与页面 updated 比较（`app/src/tools/wiki-lint.ts:486-496`）。
- 连通性统计入链，index.md 不算入链来源（`app/src/tools/wiki-lint.ts:581-588`、`app/src/tools/wiki-lint.ts:701-702`）。
- 摘要行取正文第一条 `> ` 引用（`app/src/tools/wiki-lint.ts:207-212`），index 与 overview 都靠它。
- wiki 的 markdown 由 `.gitattributes:3-4` 固定 LF，页面出现 CRLF 会报 EOL-CRLF（`app/src/tools/wiki-lint.ts:325-326`）。

## 与 AGENTS.md 的边界

- AGENTS.md 管「改哪个文件」：源码/产物地图与三条触发流程的入口提示在 `AGENTS.md:13`、`AGENTS.md:20-21`；页面格式、字段规则、规则码表只在 `wiki/SCHEMA.md`（§四 §七），两处不一致时以 SCHEMA 为准。
- 契约变更必须三步走：改 SCHEMA、同步工具、往 log.md 记一条 schema（`wiki/SCHEMA.md:174-176`）。
- 提交前门禁：`npm run typecheck` 与 `npm run wiki:lint`（`AGENTS.md:18`、`AGENTS.md:20`）。

## 关联

- 契约本体：[SCHEMA.md](../SCHEMA.md)
- 产物与源同步纪律：[构建产物同步纪律](../concepts/artifact-sync.md)
- 构建工具链：[构建与打包体系](../entities/build-pack-system.md)
- 报告类资料：[验证报告簇](../sources/verify-reports.md)
- 产品与品牌入口：[墨台产品](../entities/motai-product.md)
