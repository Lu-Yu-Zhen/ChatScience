---
type: source
title: 品牌资产与站点素材
tags: [品牌, 素材, 壁纸, 站点, 墨台]
sources: [inkforge-brand_assets/, 主题壁纸/, motai-site/, 墨台产品页.html, 01/主页面.html]
updated: 2026-10-06
status: stable
---

# 品牌资产与站点素材

> 一句话摘要：这一簇是四组静态 Raw 资产——InkForge 品牌图 11 张、八套壁纸源图、产品页站点目录与根目录旧站点文件；其中只有壁纸真正进入了产品，其余是宣传侧与基因库素材。

## 四组资产分别是什么

- **`inkforge-brand_assets/`**：11 张 `.jpg`，文件名形如 `1b51f20d-miora_text_to_image-1789367535833-0-f21c1afdd6f5.jpg`，即 6 张 text_to_image + 5 张 edit_image 的文生图产物。它们是 InkForge 品牌提案的视觉素材（提案本身见 [05-宣传板块实现策划案](../sources/plan-05-promotion.md)）。
- **`主题壁纸/`**：8 张 `.jpeg`——万山红遍、办公日常、只此青绿、城南旧事、天空与蓝、水墨江南、燕云十六声、风花雪月。
- **`motai-site/`**：托管站点工作目录，含发布描述符、`public/index.html`、`functions/` 与 `dev/`（细节见 [墨台产品页站点](../entities/motai-site.md)）。
- **`墨台产品页.html`**：根目录 3,122 行的单文件站点页，与 `motai-site/public/index.html`（3,372 行）内容不同，属两个版本并存。

## 谁真正消费它们

壁纸是唯一进入产品运行时的素材，但不是按路径引用：`app/src/webapp/webapp.ts` 与 `app/src/webapp/work/` 下检索不到 `主题壁纸` 或 `wallpaper` 的文件路径引用，实际用法是把图片重编码成 base64 内联进渲染层模板（`01/主页面.html:238-346` 的注入段与逐主题规则），因此改 `主题壁纸/` 里的原图不会影响产物，需重新注入。八张源图对应八套有壁纸的主题，机制见[主题系统](../entities/theme-system.md)。

品牌图与站点文件则完全不进产品：在 `app/src` 下能检索到 `inkforge` 字样的唯一位置是 Wiki 工具的 Raw 登记表前缀本身（`app/src/tools/wiki-lint.ts:80`），没有任何运行时代码读取这些资产。

## 使用这批资料时的注意

- 图像内容不做断言：文件名只能证明生成方式（text_to_image / edit_image）与生成批次时间戳，不能证明画面内容；需要结论时以肉眼确认为准。
- 两个站点文件同名不同内容，改动前先确认目标是 `motai-site/public/index.html`（发布用）还是根目录 `墨台产品页.html`（旧版）。
- 素材目录只放素材，临时脚本与对照清单不要落在这几个目录里。

## 关联

- 实体：[墨台产品页站点](../entities/motai-site.md)、[主题系统](../entities/theme-system.md)、[墨台产品](../entities/motai-product.md)
- 概念：[品牌与命名纪律](../concepts/brand-naming.md)、[宣传合规红线](../concepts/promo-compliance.md)
- 资料：[05-宣传板块实现策划案](../sources/plan-05-promotion.md)
