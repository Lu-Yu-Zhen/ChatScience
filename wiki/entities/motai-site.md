---
type: entity
title: 墨台产品页站点
tags: [站点, 宣传, Qoder-Sites, 反馈墙, 墨台]
sources: [motai-site/, 墨台产品页.html]
updated: 2026-10-04
status: stable
---

# 墨台产品页站点

> 一句话摘要：motai-site 是墨台的对外单页站点工作目录——一个静态首页加一个只做"提交与读取"的匿名反馈接口，站点发布状态记录在同目录的 `.qoder.site` 描述符里。

## 目录组成

```
motai-site/
├── .墨台产品页.qoder.site     # 发布描述符（JSON）
├── public/index.html          # 站点首页，3,372 行单文件
├── functions/index.ts          # 8 行入口：接 Supabase 客户端并挂载 handler
├── functions/adapter.mjs       # serveSite 适配层
├── functions/handler.mjs       # 反馈墙逻辑，93 行
└── dev/feedback-local.mjs      # 65 行，本地跑反馈接口的开发桩
```

## 发布状态记在描述符里

`.墨台产品页.qoder.site` 是单行 JSON，字段含 `version`、`name`（墨台产品页）、`actionId`、`projectId`、`siteId`、`deploymentId`、`releaseId`、`artifactSha256`、`indexSha256`，以及整份首页 HTML 的 base64 快照 `indexHtml`（`motai-site/.墨台产品页.qoder.site`）。这说明站点已走过一次发布流程并留下了产物指纹；页面标识（siteId 等）属站点身份，不在 Wiki 内复述具体值。

关键纪律：更新站点要复用同一个 `projectId`，不能拿根目录的 `墨台产品页.html` 直接覆盖发布目录——两者确实不同（3,122 行对 3,372 行），根目录那份是旧版。

## 反馈接口的权限边界

`functions/handler.mjs:1` 的自述是"Public feedback board: anonymous visitors submit; everyone reads"，并且授权只有 SELECT + INSERT、没有更新与删除端点。入口 `functions/index.ts:1` 引入 `@supabase/supabase-js` 的 createClient，`functions/index.ts:5` 用 `Deno.serve(serveSite(...))` 把适配层、反馈处理与客户端绑起来。也就是说：反馈数据写在外部 Supabase，仓库里只有代码，没有数据导出，`dev/feedback-local.mjs` 只用于本地自测。

## 站点页面在讲什么

`墨台产品页.html` 的小标题顺序本身就是产品叙事：`轻对话用 Chat，…`（`:1050`）→「一个工作台，两条互不干扰的引擎」（`:1090`）→「智能体做了什么，一步一步都摊开给你看」（`:1157`）→「算力归算力，会员归会员」（`:1237`）→「先把不该说的说清楚」（`:1372`）→「选一个档位，解锁需要的高级能力」（`:1400`）→「放在同一把尺子上比」（`:1435`）→「算力用完了，可以单独补」（`:1457`）→「把这套工作台装到本机」（`:1518`）→「先把该说清楚的说完」（`:1584`）。

其中「算力归算力，会员归会员」直接复述了 06 策划案的解耦不变式（`墨台实现策划案/_src/06-订阅预付费.md:78`），而该能力在代码里仍是零实现——这类"站点话术领先于实现"的表述受宣传红线第 5 条约束，见[宣传合规红线](../concepts/promo-compliance.md)。

## 关联

- 资料：[品牌资产与站点素材](../sources/brand-and-site-assets.md)、[05-宣传板块实现策划案](../sources/plan-05-promotion.md)
- 概念：[宣传合规红线](../concepts/promo-compliance.md)、[算力与权限解耦](../concepts/billing-quota-decoupling.md)
- 实体：[墨台产品](motai-product.md)
