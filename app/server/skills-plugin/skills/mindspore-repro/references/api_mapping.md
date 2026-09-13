# PyTorch ↔ MindSpore 常用 API 对照（复现移植速查）

> 高频易错点用 ⚠ 标注。以 MindSpore 2.x 为准。

## 随机性与全局

| PyTorch | MindSpore | 说明 |
|---|---|---|
| `torch.manual_seed(s)` | `ms.set_seed(s)` | ⚠ 还需 `numpy.random.seed`；MindSpore 无全局 python random |
| `torch.cuda.is_available()` | `ms.context.get_context("device_target")` | 无直接等价，按 target 判断 |
| `device = "cuda"` | `ms.set_context(device_target="GPU")` | CPU/GPU/Ascend 三档 |

## 网络定义

| PyTorch | MindSpore | 说明 |
|---|---|---|
| `nn.Module` | `nn.Cell` | 前向叫 `construct`，不是 `forward` |
| `nn.Linear(d_in, d_out)` | `nn.Dense(d_in, d_out)` | Dense 权重 shape 是 (out, in)，初始化分布不同 ⚠ |
| `nn.Conv2d` | `nn.Conv2d` | weight_init 默认不同，对齐时显式指定 |
| `nn.LayerNorm` | `nn.LayerNorm` | `normalized_shape` 语义一致 |
| `x.permute(...)` / `x.view(...)` | `x.transpose(...)` / `x.reshape(...)` | ⚠ transpose 是函数式调用 |
| `F.softmax(x, dim=-1)` | `ms.ops.softmax(x, axis=-1)` | dim→axis |
| `x.argmax(dim=-1)` | `x.argmax(axis=-1)` | 同上 |

## 训练循环

| PyTorch | MindSpore | 说明 |
|---|---|---|
| `optimizer.zero_grad()` | 无需 | ⚠ 静态图按 value_and_grad 函数式取梯度，无累加残留；动态图大循环也不需要手动清零 |
| `loss.backward()` | `grad_fn(x, y)` | `ms.value_and_grad(forward_fn, None, weights=params)` |
| `optimizer.step()` | `opt(grads)` | 优化器实例直接调用 |
| `model.train()` / `model.eval()` | `net.set_train(True/False)` | 或 `Model` 的 `metrics` + `model.eval` |
| `torch.utils.data.DataLoader` | `mindspore.dataset.GeneratorDataset` + `.batch()` | 列名 column_names 必须与 construct 形参对应 ⚠ |
| `amp.autocast()` | `Model(amp_level="O2")` 或 `auto_mixed_precision` | ⚠ O2 按层白名单转 fp16，粒度与 PyTorch autocast 不同，需核对精度敏感层 |

## 保存 / 加载

| PyTorch | MindSpore | 说明 |
|---|---|---|
| `torch.save(model.state_dict(), p)` | `ms.save_checkpoint(net, p)` | ckpt 是参数名到张量的映射 |
| `torch.load(p)` | `ms.load_checkpoint(p)` | `load_param_into_net` 返回未加载参数，必须检查 ⚠ |

## 移植对齐纪律（与 SKILL.md 一致）

1. 逐层 dump：两框架各存 `np.savez("layers.npz", **{层名: 输出.numpy()})`，
   用 scripts/layer_align_check.py 对拍；第一个超阈值层即出错位置。
2. 权重转换后先比对 `sum(|W|)` 与每层输出，再谈训练。
3. 初始化分布差异（Dense/Conv 默认 init 不同）会改变极小 batch 的 loss 轨迹——
   对齐期显式指定 `weight_init` 为参考实现同款。
