# research-robotics · 机器人工程领域科研外挂

为 ChatScience 墨道追加机器人领域的子智能体、技能、命令与 MCP 工具，覆盖「模型核查 → 仿真 → 力矩校核 → 真机迁移」。

## 能力清单

| 类型 | 名称 | 用途 |
|---|---|---|
| agent | robotics-sim | 仿真场景搭建与策略验证：成功率统计、失败模式聚类、sim-to-real 差异分析 |
| agent | robotics-deploy | 真机部署：分步检查单、安全链路、力矩裕度、故障排查 |
| skill | urdf-check | URDF 模型核查（结构/惯性/碰撞/执行器映射） |
| skill | ros2-debug | ROS2 三层定位法与经典症状速查（QoS/TF/仿真时间） |
| skill | sim2real | 域随机化范围与课程式迁移清单 |
| command | robot-verify | 真机执行前安全检查单（力矩裕度 + 急停 + 回退动作） |
| command | calib-plan | 标定计划（零位/TCP/外参），含量化验收判据 |
| tool | torque_estimate | 关节重力矩/峰值力矩估算 + 裕度判定 + 推荐规格 |
| tool | urdf_check | URDF 静态核查：树完整性/inertial 缺失/惯性三角不等式/limit 缺失 |
| tool | dh_transform | 标准 DH → 逐关节齐次变换矩阵与末端位姿（位置 + RPY） |

## 应用示例

**例 1 · 拿到别人给的 URDF 先体检**

> 「委派 robotics-sim：把 robot.urdf 的内容用 urdf_check 核查一遍，重点看有没有连杆缺 inertial。」

工具输出致命问题（零质量连杆、惯性三角不等式违反）与警告（缺 limit、孤立连杆），并给出根连杆候选。

**例 2 · 选型校核**

> 「末端负载 3kg、质心距关节轴 0.4m、双关节均摊，电机额定 25Nm 够不够？给推荐规格。」

`torque_estimate` 返回重力矩 11.77Nm、峰值 17.66Nm、单关节 8.83Nm、推荐额定 ≥17.66Nm（安全系数 2），判定「裕度充足」。

**例 3 · 运动学粗算**

> 「用 dh_transform 算 [30, 100, 50, 90]（deg）这组 DH 的末端位姿，RPY 用角度表示。」

返回 4×4 齐次矩阵、末端位置与 RPY 角，用于点位验证与雅可比分析前的位姿确认。

## 配置

在插件目录放 `config.json` 覆盖默认值（见 configSchema.json）：

```json
{ "default_dynamic_factor": 1.8, "safety_margin": 2.5 }
```

## 安全边界

- 任何会驱动物理硬件的操作，agents 只会生成【需人工确认】的检查单，绝不直接执行。
- 力矩估算与实测偏差 >15% 时会提示重新标定或检查摩擦模型。
