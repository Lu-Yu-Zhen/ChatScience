---
type: concept
title: MCP 凭据带外化
tags: [MCP, 凭据, 安全, server, 墨台]
sources: [app/server/plugins/, app/src/server/qoder.ts, app/src/server/domain-data-tools.ts, .gitignore, AGENTS.md, 墨台实现策划案/_src/03-后端.md]
updated: 2026-10-06
status: stable
---

# MCP 凭据带外化

> 本页讲 MCP 相关配置里"哪些值可以进 git、哪些必须走带外通道"，以及代码用哪些机制保证明文凭据不落进仓库；规则是：进库的清单只放变量与空 env，真实凭据一律留在被忽略的运行时目录或由服务端持有的凭据里。

## 进库的 MCP 清单长什么样

三份内置科研插件的连接器清单同形 `app/server/plugins/research-ai/.mcp.json:1-10`：stdio server 的命令行是 `node`，脚本路径写成变量占位 `${CLAUDE_PLUGIN_ROOT}/tools/mcp-mini.js` `app/server/plugins/research-ai/.mcp.json:6`，`env` 字段是空对象 `app/server/plugins/research-ai/.mcp.json:7`。同样形状见 `app/server/plugins/research-math/.mcp.json:6-7` 与 `app/server/plugins/research-robotics/.mcp.json:6-7`。

- 用变量而不是绝对路径：清单因此与机器无关，也不会把用户名或盘符写进 diff。
- env 留空而不是填值：工具所需的可调参数走另一条通道（下一条），凭据没有落点。

## 宿主实际不依赖那份 stdio 清单

- 插件自带 MCP 由宿主以 in-process 方式注入，原因是 stdio 通道依赖外部 node 与变量展开、实测不可靠 `app/src/server/qoder.ts:1218-1227`；自检端点把这条结论原样回报 `app/src/server/qoder.ts:1556`。
- 数据驱动工具不执行任何插件代码，只做表查询 / 乘除 / 模板填充，数据文件必须是插件目录内的 .json、realpath 校验防穿越、上限 2MB `app/src/server/domain-data-tools.ts:1-10` 与 `:52-63`——这条边界顺带取消了"插件代码里藏凭据或偷读环境"的表面积。
- 插件的可调参数走声明式配置：configSchema.json 给默认值、插件目录内的 config.json 覆盖后合并 `app/src/server/qoder.ts:894-907`；已入库的样例声明的是学科口径与检索上限这类非敏感项 `app/server/plugins/research-tcm/configSchema.json:1-20`。

## 用户自己配的外部连接器

结构直接对齐 SDK 的 McpServerConfig 并原样透传 `app/src/shared/domain.ts:384-393`，读与写只有两条路由 `app/src/server/routes.ts:291-299`，运行期逐条拷贝注入并受智能体白名单约束 `app/src/server/qoder.ts:1189-1195`。因此如果某个连接器需要 token，它落在运行时数据目录的工作配置文件里，而该目录整体被仓库忽略 `.gitignore:6-7`。

## 明文凭据为什么必须带外

- 仓库契约已经把后端目录下的两份凭据文件（SDK 访问令牌与 AI 上游密钥）显式列为禁止入库 `.gitignore:13-15`，本文件的规则表把它归入"运行时数据或密钥"禁引类 `AGENTS.md:21`。
- 打包形态放大了风险：便携版关闭 asar、源码明文可读，策划案因此把"分享前清理产物内的凭据文件"列为必做项，并指出这类令牌等同于账户身份 `墨台实现策划案/_src/03-后端.md:431` 与 `:482-483`。
- 泄露的处置成本是不可逆的：只能在账户侧吊销重建 `墨台实现策划案/_src/03-后端.md:483`——git 历史里的明文一旦提交就删不干净。
- 本 Wiki 自身同规则：页面里不得出现任何凭据片段 `wiki/SCHEMA.md:112`。

## 代码里的三条防泄漏做法

1. **对外只暴露布尔量**：SDK 配置端点返回模型、权限模式与 `hasToken`，不返回令牌本身 `app/src/server/qoder.ts:1626`。
2. **日志默认脱敏**：调试开关打开时打印 options 也把 auth 替换成占位字符串 `app/src/server/qoder.ts:1385-1387`；审计日志纪律是禁止写入凭据、参数摘要与详情各自截断 `app/src/server/audit.ts:6` 与 `:26-39`。
3. **本地 HTTP 令牌不进 URL**：产物下载不开 `?token=` 查询参数，因为令牌会进日志与历史 `app/src/server/routes.ts:122-123`，前端改用带鉴权头的 blob 下载 `app/src/webapp/work/10-api.ts:8-10` 与 `:133-139`。令牌本身由主进程生成、经页面 URL 注入渲染层 `app/src/main.ts:17` 与 `app/src/preload.ts:8-17`，并写入被忽略的运行时文件供验证脚本复用 `app/src/main.ts:277`。

## 关联

- 实体：[后端服务](../entities/backend-server.md)、[构建与打包体系](../entities/build-pack-system.md)
- 概念：[算力与权限解耦](./billing-quota-decoupling.md)
- 资料：[03-后端板块实现策划案](../sources/plan-03-backend.md)
