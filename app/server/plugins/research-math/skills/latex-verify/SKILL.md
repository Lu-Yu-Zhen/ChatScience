---
name: latex-verify
description: 核查 LaTeX 数学稿件：公式定界符配对、定理环境结构、引用键一致性、常见编译报错定位，输出可执行的修正清单。
---

# LaTeX 数学稿件核查

对给定的 .tex 内容或片段执行以下检查，逐项报告位置与修法：

1. **定界符配对**：$...$、\(...\)、\[...\]、{...} 逐层配对；检查 \left/\right 是否成对且尺寸合理。
2. **定理环境**：\newtheorem 定义与使用一致；\begin{theorem} 均有对应 \end；\label 紧跟 \caption 或环境头。
3. **引用一致性**：\ref/\eqref 的 key 都存在 \label；无重复 key；公式编号引用优先 \eqref。
4. **数学规范**：算子用 \operatorname 或声明 \DeclareMathOperator；多行推导用 align 且 & 对齐；省略号区分 \cdots/\ldots。
5. **常见编译错误**：& 出现在非对齐环境、空行切断公式环境、\text 内嵌套数学模式。

输出格式：按严重度分组（编译阻断 / 语义问题 / 风格建议），每条给出行号与修正片段。
