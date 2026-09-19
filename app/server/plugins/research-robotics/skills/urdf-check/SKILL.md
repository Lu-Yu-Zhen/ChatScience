---
name: urdf-check
description: URDF/MJCF 模型文件核查：连杆-关节树完整性、惯性参数物理合理性、碰撞体配置与执行器映射，输出量化问题清单。
---

# URDF 模型核查

对给定 URDF/MJCF 执行：

1. **树完整性**：从 base_link 可达所有连杆；无孤立子树；关节闭环（parallel mechanism）是否被 mistakenly 断开。
2. **惯性参数**：mass>0；inertia 张量满足三角不等式（Ixx+Iyy≥Izz 等）且正定；质心位置在连杆几何合理范围内；<inertial> 缺失的连杆逐个列出（仿真会按零质量处理导致数值发散）。
3. **碰撞体**：collision 与 visual 几何一致性；high-poly mesh 建议简化；自碰检配置是否合理。
4. **执行器映射**：joint 的 actuator/effort/velocity 上限与真机规格表对照； transmission 分配无遗漏。
5. **输出**：问题清单（致命/警告/建议）+ 修正后的片段。
