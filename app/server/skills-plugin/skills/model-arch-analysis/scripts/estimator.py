# -*- coding: utf-8 -*-
"""Transformer 参数量 / 显存 / FLOPs / KV cache 估算器（纯标准库，零依赖）。

设计动机：SKILL.md 里的公式（12d²、16N 字节、KV cache、6ND）靠模型心算代入
容易错一个量级；本脚本把公式固化，输出逐项可核对的表格。

公式与推导（与 SKILL.md 一致，均标注来源假设）：
- 每层 dense：注意力 4d²（Q/K/V/O）+ MLP 2·ffn_mult·d²（两个矩阵 d↔ffn_mult·d）
  → ffn_mult=4 时 ≈ 12d²；另有 2 个 LayerNorm 各 2d，忽略不计级。
- MoE 层：注意力 4d² + n_experts × 2·expert_ffn_mult·d²；激活参数只算
  n_activated 个 expert。
- Embedding：vocab·d（untied 时 head 再计 vocab·d，tied 共享计一次）。
- 训练显存（混合精度 AdamW）：参数 2B + 梯度 2B + 优化器(fp32 master 4B +
  m 4B + v 4B) ≈ 16 B/参数；8-bit 优化器按 2+2+2+2=8 B/参数粗估。
- 推理显存：2·N 字节（fp16 权重）+ KV cache。
- KV cache = 2(K、V) × layers × kv_heads × d_head × seq × batch × bytes。
- FLOPs：线性部分 6·N_act·D（训练）/ 2·N_act·D（推理）；注意力部分（因果掩码，
  平均看到 s/2 个 key）= QK 2·(s/2)·d + AV 2·(s/2)·d = 2·s·d FLOPs/层/token，
  训练总计 2·L·d·s·D。均为估算值。

用法：
  python estimator.py --layers 12 --d 768 --heads 12 --vocab 50257 --seq 1024
  python estimator.py --config '{"layers":80,"d":8192,"heads":64,"moe_experts":64,"moe_activated":8}'
  python estimator.py --demo        # 内置两个示例（dense 768 / MoE 大模型）
"""
import argparse
import json
import sys


def build_argparser():
    p = argparse.ArgumentParser(description="Transformer 参数/显存/FLOPs/KV cache 估算")
    p.add_argument("--layers", type=int, default=12, help="Transformer 层数")
    p.add_argument("--d", type=int, default=768, help="隐藏维度 d_model")
    p.add_argument("--heads", type=int, default=12, help="注意力头数")
    p.add_argument("--d-head", type=int, default=None, help="每头维度，默认 d/heads")
    p.add_argument("--kv-heads", type=int, default=None, help="KV 头数（GQA/MLA 按实际 KV 头计），默认=heads")
    p.add_argument("--vocab", type=int, default=50257, help="词表大小")
    p.add_argument("--seq", type=int, default=1024, help="序列长度 s")
    p.add_argument("--batch", type=int, default=1, help="batch 大小（KV cache 总量用）")
    p.add_argument("--ffn-mult", type=int, default=4, help="FFN 隐层倍数（dense 层）")
    p.add_argument("--moe-experts", type=int, default=0, help="MoE expert 总数，0=dense 模型")
    p.add_argument("--moe-activated", type=int, default=None, help="每 token 激活 expert 数，默认 2")
    p.add_argument("--expert-ffn-mult", type=int, default=4, help="expert FFN 倍数")
    p.add_argument("--tied", action="store_true", help="embedding 与 head 共享权重")
    p.add_argument("--bytes", type=int, default=2, help="权重每参数字节数（fp16/bf16=2, fp32=4）")
    p.add_argument("--optimizer", choices=["adamw", "adamw8bit", "none"], default="adamw")
    p.add_argument("--grad-ckpt", action="store_true", help="启用梯度检查点（激活显存粗估减半以上）")
    p.add_argument("--tokens", type=float, default=0, help="训练 token 总数 D（用于总算力；0=只给每 token FLOPs）")
    p.add_argument("--config", type=str, default=None, help="JSON 覆盖上面参数（键同名，如 moe_experts）")
    p.add_argument("--json", action="store_true", help="输出 JSON（供程序消费）")
    p.add_argument("--demo", action="store_true", help="跑两个内置示例")
    return p


def estimate(cfg):
    """核心计算：输入参数字典，返回逐项结果字典。独立函数，便于 import 调用。"""
    L, d = cfg["layers"], cfg["d"]
    d_head = cfg.get("d_head") or max(d // cfg["heads"], 1)
    kv_heads = cfg.get("kv_heads") or cfg["heads"]
    ffn = cfg["ffn_mult"]
    E = cfg.get("moe_experts", 0)
    E_act = cfg.get("moe_activated") if cfg.get("moe_activated") is not None else 2

    attn_per_layer = 4 * d * d
    dense_mlp_per_layer = 2 * ffn * d * d
    if E > 0:
        expert_mlp = 2 * cfg["expert_ffn_mult"] * d * d
        mlp_params_total = E * expert_mlp           # 全部 expert 权重
        mlp_params_active = E_act * expert_mlp      # 每 token 实际激活
    else:
        mlp_params_total = mlp_params_active = dense_mlp_per_layer

    per_layer_total = attn_per_layer + mlp_params_total
    per_layer_active = attn_per_layer + mlp_params_active

    embed = cfg["vocab"] * d
    head = 0 if cfg.get("tied") else cfg["vocab"] * d
    norms = d  # 最终 norm，量级可忽略但列出

    n_total = L * per_layer_total + embed + head + norms
    n_active = L * per_layer_active + embed + head + norms

    B = cfg["bytes"]
    opt_bytes = {"adamw": 12, "adamw8bit": 4, "none": 0}[cfg["optimizer"]]
    # 混合精度：参数 B + 梯度 B + 优化器（fp32 master 4 + 状态）；粗估，不含激活
    train_static = n_total * (B + B + opt_bytes)

    # 激活显存粗估（Korthikanti et al. 2022 近似，fp16）：
    # 每 token 每层 ≈ 34·d 字节（含 ln/attn/MLP 中间量）；检查点后仅存层输入 2·d
    s, bsz = cfg["seq"], cfg["batch"]
    per_tok_per_layer = (2 if cfg.get("grad_ckpt") else 34) * d * B / 2
    act_mem = L * per_tok_per_layer * s * bsz

    kv_per_token = 2 * L * kv_heads * d_head * B          # 字节/token
    kv_total = kv_per_token * s * bsz

    infer_mem = n_total * B + kv_total
    train_mem = train_static + act_mem

    # FLOPs：线性 6·N_act·D + 注意力 2·L·d·s·D（因果，推导见文件头）
    flops_per_token_train = 6 * n_active + 2 * L * d * s
    flops_per_token_infer = 2 * n_active + L * d * s  # 推理增量：QK+AV 同因果口径 → L·d·s
    D = cfg.get("tokens", 0)
    flops_train_total = flops_per_token_train * D if D else None

    return {
        "params_total": n_total,
        "params_active": n_active if E > 0 else n_total,
        "params_embed": embed, "params_head": head,
        "per_layer": {"attn": attn_per_layer, "mlp_total": mlp_params_total,
                      "mlp_active": mlp_params_active},
        "mem_train_bytes": train_mem, "mem_train_static_bytes": train_static,
        "mem_activations_bytes": act_mem, "mem_infer_bytes": infer_mem,
        "kv_cache_bytes_per_token": kv_per_token,
        "kv_cache_bytes_total": kv_total,
        "flops_per_token_train": flops_per_token_train,
        "flops_per_token_infer": flops_per_token_infer,
        "flops_train_total": flops_train_total,
        "assumptions": {"d_head": d_head, "kv_heads": kv_heads,
                        "bytes_per_param": B, "optimizer": cfg["optimizer"],
                        "moe": E > 0, "moe_experts": E, "moe_activated": E_act if E > 0 else 0,
                        "grad_ckpt": bool(cfg.get("grad_ckpt"))},
    }


def fmt_bytes(x):
    for unit in ["B", "KiB", "MiB", "GiB", "TiB", "PiB"]:
        if x < 1024 or unit == "PiB":
            return "%.2f %s" % (x, unit)
        x /= 1024


def fmt_num(x):
    for unit in ["", "K", "M", "B", "T"]:
        if x < 1000 or unit == "T":
            return "%.2f%s" % (x, unit)
        x /= 1000


def render(res, cfg):
    rows = [
        ("总参数量（含全部 expert）", fmt_num(res["params_total"])),
        ("激活参数量/token", fmt_num(res["params_active"])),
        ("  - Embedding / Head", "%s / %s" % (fmt_num(res["params_embed"]), fmt_num(res["params_head"]) or "共享")),
        ("  - 每层 注意力 / MLP", "%s / %s" % (fmt_num(res["per_layer"]["attn"]), fmt_num(res["per_layer"]["mlp_total"]))),
        ("训练显存（静态+激活，粗估）", fmt_bytes(res["mem_train_bytes"])),
        ("  - 静态（参数+梯度+优化器）", fmt_bytes(res["mem_train_static_bytes"])),
        ("  - 激活（Korthikanti 近似）", fmt_bytes(res["mem_activations_bytes"])),
        ("推理显存（权重+KV）", fmt_bytes(res["mem_infer_bytes"])),
        ("KV cache / token", fmt_bytes(res["kv_cache_bytes_per_token"])),
        ("KV cache 总量（s×b）", fmt_bytes(res["kv_cache_bytes_total"])),
        ("训练 FLOPs / token", "%.3e" % res["flops_per_token_train"]),
        ("推理 FLOPs / token", "%.3e" % res["flops_per_token_infer"]),
    ]
    if res["flops_train_total"]:
        rows.append(("训练总算力（6ND 项）", "%.3e FLOPs" % res["flops_train_total"]))
    lines = ["| 项目 | 数值 |", "|---|---|"]
    lines += ["| %s | %s |" % r for r in rows]
    a = res["assumptions"]
    lines.append("\n假设：%s 层 · d=%d · kv_heads=%d · %s · %d B/参数 · 优化器 %s · seq=%d · batch=%d%s"
                 % (cfg["layers"], cfg["d"], a["kv_heads"],
                    "MoE(%d/%d)" % (a["moe_experts"], a["moe_activated"]) if a["moe"] else "dense",
                    a["bytes_per_param"], a["optimizer"], cfg["seq"], cfg["batch"],
                    " · 梯度检查点" if a["grad_ckpt"] else ""))
    lines.append("注意：均为估算；激活显存与注意力 FLOPs 对架构细节（如 FlashAttention、重计算粒度）敏感，作数量级判断用。")
    return "\n".join(lines)


def main(argv=None):
    args = build_argparser().parse_args(argv)
    if args.demo:
        demos = [
            {"layers": 12, "d": 768, "heads": 12, "vocab": 50257, "seq": 1024, "batch": 8,
             "ffn_mult": 4, "moe_experts": 0, "bytes": 2, "optimizer": "adamw",
             "tokens": 3e9, "tied": False, "grad_ckpt": False, "expert_ffn_mult": 4,
             "d_head": None, "kv_heads": None, "moe_activated": None},
            {"layers": 80, "d": 8192, "heads": 64, "vocab": 152064, "seq": 8192, "batch": 1,
             "ffn_mult": 4, "moe_experts": 64, "moe_activated": 8, "expert_ffn_mult": 4,
             "bytes": 2, "optimizer": "adamw", "tokens": 8e12, "tied": False,
             "grad_ckpt": True, "d_head": None, "kv_heads": 8},
        ]
        for i, cfg in enumerate(demos, 1):
            print("## 示例 %d%s" % (i, "（MoE）" if cfg["moe_experts"] else ""))
            print(render(estimate(cfg), cfg))
            print()
        return 0

    cfg = {k: getattr(args, k) for k in
           ["layers", "d", "heads", "d_head", "kv_heads", "vocab", "seq", "batch",
            "ffn_mult", "moe_experts", "moe_activated", "expert_ffn_mult", "tied",
            "bytes", "optimizer", "grad_ckpt", "tokens"]}
    if args.config:
        cfg.update(json.loads(args.config))
    res = estimate(cfg)
    print(json.dumps(res, indent=1, ensure_ascii=False) if args.json else render(res, cfg))
    return 0


if __name__ == "__main__":
    sys.exit(main())
