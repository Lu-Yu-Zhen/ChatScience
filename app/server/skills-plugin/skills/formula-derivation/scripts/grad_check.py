# -*- coding: utf-8 -*-
"""公式推导的机械验证工具：数值梯度对拍 + sympy 符号核验 + 维度审计。

设计动机：SKILL.md 要求"终点回代验证、量纲/维度一致性检查"，这些靠模型心算
不可靠。本脚本提供三个函数，run_code 里 import 后即可用：
  1) verify_gradient(f, grad, x)   —— 解析梯度 vs 中心差分数值梯度逐元素对拍
  2) verify_expression(expr, deriv, var) —— sympy 核验 d(expr)/dv == deriv
  3) dim_audit([(a,b),(b,c)...])   —— 矩阵链维度审计

依赖：numpy 必需；sympy 可选（函数 2 需要）。
CLI：python grad_check.py  跑内置 softmax 梯度示例，演示用法与输出格式。
"""
import numpy as np


def verify_gradient(f, grad, x, eps=1e-6, rtol=1e-4, verbose=True):
    """对拍解析梯度 grad(x) 与中心差分数值梯度。

    f    : callable(x: np.ndarray) -> float 或 (float, 无用附加值)
    grad : callable(x: np.ndarray) -> np.ndarray，声称的解析梯度
    x    : np.ndarray，测试点（远离对称点，随机性由调用方负责）
    返回 dict：ok / max_rel_err / per-element 表（verbose 时打印）。
    """
    x = np.asarray(x, dtype=float)
    g_num = np.zeros_like(x)
    for idx in np.ndindex(x.shape):
        xp = x.copy(); xm = x.copy()
        xp[idx] += eps; xm[idx] -= eps
        fp, fm = f(xp), f(xm)
        fp = fp[0] if isinstance(fp, tuple) else fp
        fm = fm[0] if isinstance(fm, tuple) else fm
        g_num[idx] = (fp - fm) / (2 * eps)
    g_ana = np.asarray(grad(x), dtype=float)
    # 容错：解析梯度可能返回展平形状，统一 ravel 后逐元素对拍
    g_num, g_ana = g_num.ravel(), g_ana.ravel()
    if g_num.shape != g_ana.shape:
        raise ValueError("梯度形状不一致：数值 %s vs 解析 %s（检查 grad 返回形状）" % (g_num.shape, g_ana.shape))
    denom = np.maximum(np.abs(g_num) + np.abs(g_ana), 1e-12)
    rel = np.abs(g_num - g_ana) / denom
    max_rel = float(rel.max())
    ok = bool(max_rel < rtol)
    if verbose:
        print("数值/解析梯度对拍：%s（max_rel_err=%.3e, rtol=%.0e, eps=%.0e）"
              % ("通过" if ok else "不通过", max_rel, rtol, eps))
        if not ok:
            bad = np.argwhere(rel >= rtol)
            for idx in bad[:10]:
                i = tuple(idx)
                print("  位置 %s: 解析=%.6g 数值=%.6g rel=%.2e" % (i, g_ana[i], g_num[i], rel[i]))
    return {"ok": ok, "max_rel_err": max_rel, "num_grad": g_num, "ana_grad": g_ana}


def verify_expression(expr, deriv, var, subs=None):
    """sympy 符号核验：simplify(d(expr)/dvar - deriv) 是否为 0。

    expr/deriv : sympy 表达式；var : sympy 符号；subs : 可选 {符号: 值} 数值抽查
    返回 dict：ok / diff_expr / numeric_spot。
    """
    try:
        import sympy as sp
    except ImportError:
        raise RuntimeError("verify_expression 需要 sympy（pip install sympy）")
    diff_expr = sp.simplify(sp.diff(sp.sympify(expr), var) - sp.sympify(deriv))
    ok = sp.simplify(diff_expr) == 0
    out = {"ok": bool(ok), "residual": str(diff_expr), "numeric_spot": None}
    if subs:
        vals = {var: 1.37}
        vals.update(subs)
        # 数值抽查双保险：符号化简失败时用随机点估值
        num = abs(float(sp.N((sp.diff(sp.sympify(expr), var) - sp.sympify(deriv)).subs(vals))))
        out["numeric_spot"] = num
        if not ok:
            out["ok"] = num < 1e-8
            out["note"] = "符号化简未归零但数值残差=%.2e，可能只是未化简形式" % num
    print("符号核验：%s（残差 = %s）" % ("通过" if out["ok"] else "不通过", out["residual"]))
    return out


def dim_audit(steps):
    """矩阵链维度审计。steps: [(shapeA, shapeB, op), ...]，op ∈ {'@','+','hadamard'}。

    '@' 矩阵乘要求 A 末维 == B 末-1 维；'+'/'hadamard' 要求形状完全一致。
    全通过返回 True，否则抛 AssertionError 指明第几步不匹配（供推导文本引用）。
    """
    for i, (a, b, op) in enumerate(steps, 1):
        if op == "@":
            assert a[-1] == b[-2], "第 %d 步矩阵乘维度不匹配：A%s · B%s（A 末维 %d ≠ B 倒数第 2 维 %d）" % (i, a, b, a[-1], b[-2])
        elif op in ("+", "hadamard"):
            assert tuple(a) == tuple(b), "第 %d 步逐元素运算形状不一致：%s vs %s" % (i, a, b)
        else:
            raise ValueError("未知算子 %r（支持 @ / + / hadamard）" % op)
    print("维度审计：%d 步全部通过（%s）" % (len(steps), " → ".join(str(s[0]) for s in steps)))
    return True


def _demo():
    """内置示例：softmax 交叉熵对 logits 的梯度（教科书结论 J·(p−y)）。"""
    rng = np.random.default_rng(0)
    n, C = 5, 4
    logits = rng.normal(size=(n, C))
    y = rng.integers(0, C, size=n)

    def f(z):
        z2 = z.reshape(n, C)
        p = np.exp(z2 - z2.max(1, keepdims=True))
        p /= p.sum(1, keepdims=True)
        return -np.mean(np.log(p[np.arange(n), y]))

    def grad(z):
        z2 = z.reshape(n, C)
        p = np.exp(z2 - z2.max(1, keepdims=True))
        p /= p.sum(1, keepdims=True)
        p[np.arange(n), y] -= 1
        return (p / n).reshape(-1)

    verify_gradient(f, grad, logits.copy())

    import sympy as sp
    x, a = sp.symbols("x a")
    verify_expression(sp.log(x) * a, a / x, x)

    dim_audit([((32, 512), (512, 64), "@"), ((32, 64), (32, 64), "+")])


if __name__ == "__main__":
    _demo()
