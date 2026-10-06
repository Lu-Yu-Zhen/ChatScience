---
type: concept
title: 领域路由与角色
tags: [领域插件, 路由, 角色绑定, server, 科研工作台]
sources: [app/src/server/domain-roles.ts, app/src/server/domain-lit.ts, app/src/server/qoder.ts, app/server/plugins/, app/src/webapp/work/35-skills.ts]
updated: 2026-10-06
status: stable
---

# 领域路由与角色

> 本页讲两件相关但独立的事：按任务信号建议启用哪个领域插件包（路由），以及插件包能对底座的七个科研环节角色改什么、不能改什么（角色覆写）。共同点是「换学科只换包，不改宿主」。

## 一、底座的七个环节

- 七个科研子智能体规格硬编码在 `app/src/server/qoder.ts:172-236`：文献调研、实验设计、实验仿真、数据分析、文稿撰写、结果评审、资料归档，id 统一 sub- 前缀。
- 路由靠 description：转换给 SDK 时 description 取 whenToUse，注释直陈这是「分派质量的第一等指标」`app/src/server/qoder.ts:160`、`app/src/server/qoder.ts:238-243`。
- 三条不可违反的机制约束：tools 一律不含 Agent（禁嵌套派生）、maxTurns 必设、模型用 inherit 继承主会话 `app/src/server/qoder.ts:159-164`、`app/src/server/qoder.ts:245-258`。
- 委派前提是主智能体：只有编排型智能体（或显式要求 Agent 工具的）才装配这批定义 `app/src/server/qoder.ts:1298-1305`。

## 二、领域包如何被发现

- 两个扫描根：随包的内置目录与用户上传目录 `app/src/server/qoder.ts:806-807`，两次 scanRoot 后合并 `app/src/server/qoder.ts:927-928`。当前内置四包：research-ai / research-math / research-robotics / research-tcm（`app/server/plugins/`）。
- 启用态按包粒度存储，未在存储里记 false 的一律视为启用 `app/src/server/qoder.ts:909`。
- 用户插件写入前逐段过滤点与点点并复查必须落在插件根内，防目录穿越 `app/src/server/qoder.ts:932-934`。
- 包内可声明的六类外挂：agents 目录、skills 目录、commands、tools.json（MCP 工具白名单）、dataTools.json（数据驱动工具）、dataSources.json（文献源），外加 routing.json 与 roles.json `app/src/server/qoder.ts:817-893`。

## 三、路由建议（P6）：只建议，不启用

- 信号文件三段：keywords / fileSignals / corpora，注释即声明「仅用于给出建议启用哪个包的提示，宿主不会自动启用插件」`app/server/plugins/research-ai/routing.json:2`。
- 打分：任务文本命中关键词每个 2 分，工作区文件名命中信号每个 3 分，取最高分为建议项，另有「建议但未启用」清单 `app/src/server/qoder.ts:1594-1615`。
- 工作区文件只读一层、上限 400 个文件名，目录不可读时退化为纯文本判定 `app/src/server/qoder.ts:1590-1595`。
- 端点 `GET /api/work/plugins/route` 明确不改启用状态 `app/src/server/routes.ts:376-381`；启用要走 PUT `app/src/server/routes.ts:385-395`。
- 前端把工作区根一起传过去：取主脚本作用域里的 `projects`，用第一个 `mode==='work' && folder` 的项目文件夹作为 `workspaceRoot` `app/src/webapp/work/35-skills.ts:464-467`，命中到的文件信号以标签呈现 `app/src/webapp/work/35-skills.ts:478`。曾经只传任务文本、导致这条用户可见路径上文件信号恒不命中，修复记录见 `app/verify/全功能验证报告.md:151`；实测证据 `app/verify/plugin-route-ui-verify.js`（中性文本＋工作区文件即可得出建议，10/10）。
- UI 落点：技能与插件页的插件选项卡，展示前三条命中并给一键启用 `app/src/webapp/work/35-skills.ts:470-490`；启用必须过能力差异确认，卡片开关与建议入口共用同一条路径 `app/src/webapp/work/35-skills.ts:426-440`、`app/src/webapp/work/35-skills.ts:513`（取消即不改启用状态）。

## 四、角色覆写（S2）：能改什么

覆写文档结构 `app/src/server/domain-roles.ts:28-35`，可改六项：promptSuffix、whenToUseSuffix、tools、skills、maxTurns、permissionMode。生效顺序与拒绝条件：

- 未知角色 id 直接拒绝并指向 doctor 端点查可覆写清单 `app/src/server/domain-roles.ts:105-109`。
- prompt 追加有 4000 字符上限，超了就拒 `app/src/server/domain-roles.ts:61`、`app/src/server/domain-roles.ts:111-115`；生效时以「【包名 领域口径】」拼接 `app/src/server/domain-roles.ts:114`。
- tools 三道闸：Agent 永不下放 `app/src/server/domain-roles.ts:122`；SDK 工具只能在允许集内 `app/src/server/domain-roles.ts:56-58`、`app/src/server/domain-roles.ts:138-143`；MCP 工具只能是本包自己声明的精确名，或底座 chatscience 科研清单里的 `app/src/server/domain-roles.ts:123-137`。
- skills 只能挂本包 skills 目录下的技能，跨包请改用那个包 `app/src/server/domain-roles.ts:146-158`。
- maxTurns 只允许收紧 `app/src/server/domain-roles.ts:160-165`；permissionMode 只允许保持或降档，保守序为 plan < default < acceptEdits < bypassPermissions < dontAsk `app/src/server/domain-roles.ts:60`、`app/src/server/domain-roles.ts:167-173`。
- 关键设计：越权项一律拒绝并回报，不做静默降级 `app/src/server/domain-roles.ts:18-23`，报告由 log 与 summarizeRoleReports 转成可读行 `app/src/server/domain-roles.ts:174`、`app/src/server/domain-roles.ts:182-189`。

## 五、覆写的消费点与可见性

- 真实生效在每次编排回合：先把启用包的 agents 解析成 plugin:agent 定义合并，再对副本施加角色覆写 `app/src/server/qoder.ts:1211-1246`、`app/src/server/qoder.ts:1306-1316`；技能以 plugin:skill 限定名追加白名单 `app/src/server/qoder.ts:1243`、`app/src/server/qoder.ts:1262-1263`。
- 插件自带 MCP 统一 in-process 注入，包内 stdio 配置实测不可靠 `app/src/server/qoder.ts:1218-1227`、`app/src/server/qoder.ts:1556`。
- 自检端点 `/api/work/plugins/doctor` 返回每包 warnings、roles 试运行的生效/被拒项与可覆写角色 id `app/src/server/qoder.ts:1543-1570`、`app/src/server/routes.ts:362-366`；前端在插件页顶部渲染这一块，目的是让静默失败可见 `app/src/webapp/work/35-skills.ts:412-416`。

## 六、文献源也是领域数据（P2）

- 适配器把「文献从哪来」降为包内声明：模板拼 URL、单次 HTTP、字段映射归一，宿主不执行包内代码 `app/src/server/domain-lit.ts:1-9`。
- 只支持单次请求型 API；需要链式调用的源仍走宿主实现 `app/src/server/domain-lit.ts:7-9`。
- 加载自检校验必填项、URL 必须含查询占位符、映射必须含 title 与 id `app/src/server/domain-lit.ts:113-125`；底座自带 arxiv 作为默认源之一 `app/src/server/domain-lit.ts:168-176`。
- 启用包的源在每次扫描时汇入 lit_search 工具 `app/src/server/qoder.ts:1168-1172`、`app/src/server/qoder.ts:539-563`，未知源名会回列可选清单 `app/src/server/qoder.ts:559-560`。
- 各包语料声明不同：中医包同时列 europepmc / crossref / arxiv `app/server/plugins/research-tcm/routing.json:34-38`，机器人与数学包只列 arxiv `app/server/plugins/research-robotics/routing.json:25-28`。
- 现状：四包里只有 research-ai 与 research-tcm 带 roles.json（见 `app/server/plugins/research-ai/`、`app/server/plugins/research-tcm/` 目录），另外两包目前只声明路由信号与工具。
- 领域硬约束写在覆写文本里而非代码里：中医包所有角色继承一条「仅服务文献与教学研究，不构成诊疗建议」`app/server/plugins/research-tcm/roles.json:2`。

## 关联

- 概念：[沙箱边界](sandbox-boundaries.md)（覆写只能收紧权限档位与轮次上限）
- 实体：[沙箱与工作台](../entities/sandbox-workspace.md)（run_code 等科研工具如何被子智能体调用）
- 实体：[Work 模块群](../entities/work-modules.md)（插件页与路由建议的前端落点）
