# research-math · 数学领域科研外挂

为 ChatScience 墨道（通用科研底座）追加数学领域的子智能体、技能、命令与 MCP 工具。

## 能力清单

| 类型 | 名称 | 用途 |
|---|---|---|
| agent | proof-writer | 「定义-引理-定理-证明」结构化严格证明，标注每步依据 |
| agent | symbolic-helper | 代数变形、求解技巧选型、渐近/量纲分析 |
| agent | numerics-checker | 数值实验可信性审查：精度/条件数/收敛判据 |
| skill | latex-verify | LaTeX 稿件核查（定界符/定理环境/引用键/编译错误） |
| skill | theorem-map | 定理依赖图梳理：拓扑序、循环依赖、前提冗余 |
| skill | proof-style | 数学写作风格规范（可发表水准） |
| command | math-check | 推导严密性审查（跳步/未声明前提/反例） |
| command | numerics-audit | 数值计算可信性审查（精度/条件数/复算方案） |
| tool | arith_eval | 双精度浮点求值（含函数与 π/e），快速数值核对 |
| tool | frac_eval | **精确**有理数运算（BigInt 分数，零浮点误差） |
| tool | matrix_det | ≤8×8 方阵精确行列式/秩/可逆性（分数高斯消元） |

## 应用示例

**例 1 · 恒等式精确验证**（浮点会误判的场合）

> 对墨道说：「委派 research-math:proof-writer，用 frac_eval 验证 (3/4 + 1/6) × 12 = 11 是否精确成立，并给出小数展开。」

工具输出 `{fraction: "11", decimal: "11"}` ——精确等于，无舍入争议。若用浮点求值 0.75+0.166… 类问题会被舍入噪声污染。

**例 2 · 行列式符号结论**

> 「用 matrix_det 判定 [[2,1,0],[1,3,1],[0,1,2]] 是否可逆，给出消元过程。」

返回 `determinant: "8"`（分数精确）、`invertible: true` 与逐步消元记录，可直接写进证明。

**例 3 · 数值异常解释**

> 「委派 numerics-checker：我算 sqrt(2)**2 - 2 得到 4.44e-16 而不是 0，是我的代码错了吗？」

回答会区分「数学成立」与「浮点成立」，解释 ULP 量级，并用 frac_eval 复算有理数部分。

## 配置

在插件目录放 `config.json` 覆盖默认值（见 configSchema.json）：

```json
{ "decimal_digits": 16, "matrix_max_n": 8 }
```

## 与底座的协作方式

- 墨道按 agents 的 description 自动路由委派；也可点名 agent id（如 `research-math:proof-writer`）。
- 技能由模型按任务自动调用；`/research-math:math-check` 命令可在输入框直接触发。
- 关闭插件：技能与插件页 → 领域插件 → research-math 开关关闭，下个回合生效。
