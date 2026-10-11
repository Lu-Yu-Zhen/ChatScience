// 指向 GitHub Wiki 的指引（代码仓内唯一与 wiki/ 相关的文件）。
# 项目知识库已迁往 GitHub Wiki

本目录不再存放知识库正文。墨台项目的三层知识库（Raw / Wiki / Schema，Karpathy《LLM Wiki》模式）托管在本仓库的 **Wiki 页签**：

- 仓库：`<本仓库>.wiki.git`
- 入口页：`Home.md`（原 `overview.md` 的全景导航）
- 契约页：`SCHEMA.md`（分层、页面格式、Raw 登记表、机器校验规则）
- 目录：`index.md`（生成物）；时间线：`log.md`

## 本地维护

```bash
git clone <本仓库>.wiki.git chatscience-wiki   # 克隆知识库
cd app
CS_WIKI_DIR=../chatscience-wiki npm run wiki:lint           # 全量检查
CS_WIKI_DIR=../chatscience-wiki npm run wiki:lint -- --fix  # 重生成 index.md
CS_WIKI_DIR=../chatscience-wiki npm run wiki:lint -- --add entity/<id> --title "标题" --sources app/src/
CS_WIKI_DIR=../chatscience-wiki npm run wiki:lint -- --log ingest --title "标题" --author "你的名字"
```

未设 `CS_WIKI_DIR` 时工具仍会在本仓内找 `wiki/`；因正文已迁出，此时会以退出码 2 提示缺少 `SCHEMA.md`。

## 与代码仓的关系

- Wiki 页内的路径引用一律相对**代码仓根**（如 `app/src/server/routes.ts:12`、`docs/plans/_src/03-后端.md`），机器校验时按代码仓解析；`wiki/` 前缀的引用按 wiki 检出根解析。
- 代码仓的 Raw 层资料（`app/src/**`、`app/verify/`、`docs/plans/_src/`、`AGENTS.md`、站点与品牌资产等）对 Wiki 侧只读；两侧的路径登记表在 `SCHEMA.md` §二 与 `app/src/tools/wiki-lint.ts` 的 `RAW_PREFIXES` 各存一份，改一处必须同步另一处。
- 回填改动请提交到 `<本仓库>.wiki.git`，不要提交到本代码仓。
