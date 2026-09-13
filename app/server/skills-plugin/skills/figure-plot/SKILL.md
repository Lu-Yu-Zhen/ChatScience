---
name: 科研配图
description: 用 matplotlib 产出出版级图表（矢量优先）：合适的图型、字号、配色、导出 PDF/PNG 到 out/。
---

# 科研配图

## 规范
- `matplotlib.use("Agg")`；保存到 out/，同时导出 .pdf（矢量）与 .png（300dpi）。
- 字号：正文 8-10pt；轴标签与刻度不小于 8pt；线宽 ≥1；颜色考虑色盲友好（viridis/tab10）。
- 图题不写进图内（论文用 caption）；必要信息放轴标签与图例。
- 一图一观点：不需要的元素（顶右边框、多余网格）去掉。

## 常用模板
loss 曲线（对数 y 轴 + 平滑线叠加原始）、多方法柱状对比（误差条）、热力图（标数值）、架构示意图（简单方框+箭头，matplotlib patches）。

## 输出要求
- 生成后用 run_code 的产物回传让用户直接预览。
- 说明图的阅读顺序与每条线代表什么。

## 配套脚本与资源（位于本技能目录下）
- `scripts/paper_style.py` — 风格模块：run_code 里 `sys.path.insert(0, r"<技能目录>/scripts"); import paper_style as ps`，然后 `ps.use_paper_style()`（字号/线宽/去顶右边框/中文字体回退）、`ps.CB_SAFE`（色盲友好色板）、`ps.smooth(y)`、`ps.save_fig(fig, name)`（自动双格式导出到 out/）。**所有出图必须走此风格**，保证每次风格一致。
- `references/plot_templates.py` — 四类常用图的可运行模板（loss 曲线/误差条柱状/热力图/架构图），改数据即用；`python references/plot_templates.py` 跑全部示例。

## 通用约束（每个技能都要遵守）
- 沙箱以本机用户权限运行且无资源硬上限：**先用小样本/小 batch 验证脚本正确，再放大**。
- 需要事实依据时用检索工具（arxiv_search / fetch_url / kb_search）获取，不凭记忆断言；检索结论注明来源。
- 重要结论与实验数据用 note_write 写入笔记本（用户可见），不要只留在对话里。
- 代码放当前目录，图表与结果文件放 out/ 子目录。
- 数学公式用 LaTeX（行内 $...$，独立公式 $$...$$）。
