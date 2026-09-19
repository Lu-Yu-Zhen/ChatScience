---
name: ros2-debug
description: ROS2 系统排查套路：节点/话题/参数三层定位法，QoS 不匹配与时间同步问题的经典症状与验证命令。
---

# ROS2 排查手册

按「三层定位法」收缩问题域：

1. **节点层**：`ros2 node list` 确认节点存活（未出现 → 看启动日志 stderr 与环境变量 ROS_DOMAIN_ID 是否一致）。
2. **话题层**：`ros2 topic list -t` 对照预期类型；`ros2 topic hz <topic>` 看频率是否达设计值；`ros2 topic echo --once` 验证内容。
3. **参数层**：`ros2 param dump <node>` 对照预期配置。

## 经典症状速查
- **发布者正常订阅者收不到**：QoS 不匹配（reliability/durability 组合不兼容）——`ros2 topic info -v` 对比两侧 QoS；sensor 数据 best_effort vs 可靠的冲突最常见。
- **TF 树断裂**：`ros2 run tf2_ros tf2_monitor`；常见原因是 static_transform_publisher 未启动或时间戳用了系统时钟而仿真用 sim time（`use_sim_time` 不一致）。
- **控制抖动**：检查控制周期与执行器反馈频率不匹配、deadline QoS 未满足。
- **仿真时间错乱**：/clock 是否发布、use_sim_time 是否在所有节点统一设置。

输出：定位结论 + 已执行的验证命令与输出 + 下一步动作。
