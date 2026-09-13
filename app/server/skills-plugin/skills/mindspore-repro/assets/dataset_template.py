# -*- coding: utf-8 -*-
"""MindSpore 数据管道模板：GeneratorDataset 包装合成二分类数据（可运行）。

对应 SKILL.md 必备结构的 dataset.py。接真实数据时：
- numpy 内存装得下 → 换 __getitem__/__len__ 的数组来源
- 图片/大文件 → 改用 mindspore.dataset 生成器或 ImageFolderDataset
- 保持"预处理确定性"：任何随机增广都要受 set_seed 影响，复现必须可追溯
"""
import numpy as np
import mindspore.dataset as ds


def make_dataset(n_samples=512, in_dim=20, batch_size=16, seed=42, shuffle=True):
    """合成二分类数据（两个高斯团），返回可迭代 Dataset。"""
    rng = np.random.default_rng(seed)
    half = n_samples // 2
    x0 = rng.normal(-1.0, 0.8, size=(half, in_dim)).astype(np.float32)
    x1 = rng.normal(1.0, 0.8, size=(n_samples - half, in_dim)).astype(np.float32)
    X = np.concatenate([x0, x1], axis=0)
    y = np.concatenate([np.zeros(half, dtype=np.int32), np.ones(n_samples - half, dtype=np.int32)])
    order = rng.permutation(n_samples) if shuffle else np.arange(n_samples)
    X, y = X[order], y[order]

    def gen():
        for i in range(n_samples):
            yield X[i], y[i]

    dataset = ds.GeneratorDataset(source=gen, column_names=["data", "label"], shuffle=shuffle)
    dataset = dataset.batch(batch_size, drop_remainder=False)
    return dataset


if __name__ == "__main__":
    d = make_dataset(batch_size=8)
    for step, (data, label) in enumerate(d.create_tuple_iterator()):
        print("step", step, "data", data.shape, "label", label.shape)
        if step >= 2:
            break
    print("数据管道 OK")
