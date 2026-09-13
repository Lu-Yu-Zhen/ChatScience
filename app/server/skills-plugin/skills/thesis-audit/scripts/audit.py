# -*- coding: utf-8 -*-
"""论文机械自查：正则级确定性扫描，产出"位置/类型/摘录/建议/严重度"问题清单。

设计动机：SKILL.md 的检查清单里，引用对应、图表编号、缩写定义、术语一致性这四
类是机械匹配工作——模型通读全文既慢又漏，正则扫描确定性强。模型只复核脚本标出
的位置并补充语义类问题（论证漏洞、逻辑断层）。

支持文件：.tex / .md / .txt（混用多文件一起传）。
检查项：
  1. cite     LaTeX \\cite{key} 与 --bib 的 .bib 条目交叉核对：缺失/未引用
  2. figure   图表编号连续性 + "先引用后出现"（LaTeX label/ref 或 md 中"图N/表N"）
  3. abbr     大写缩写（2+ 字母）首次出现是否带展开（括号/顿号模式），常见词白名单可忽略
  4. terms    --terms CSV（variant,canonical）统计各变体出现次数，混用即报告
说明：均为启发式，报告 ≠ 定罪；每条都给出原文行号与摘录供人工/模型复核。
用法：
  python audit.py --file thesis.tex --bib refs.bib
  python audit.py --file thesis.md --terms terms.csv --ignore CPU GPU API
  python audit.py --demo
"""
import argparse
import csv
import os
import re
import sys

# 高频且通常无需展开的缩写白名单（可 --ignore 追加）
ABBR_WHITELIST = {
    "CPU", "GPU", "API", "URL", "URI", "JSON", "CSV", "PDF", "HTML", "HTTP", "HTTPS",
    "TCP", "UDP", "RAM", "ROM", "SSD", "HDD", "DPI", "RGB", "FFT", "SOTA", "ETC",
    "IE", "EG", "VS", "ETAL", "IID", "GPS", "NLP", "LLM", "LLMS",
}

ABBR_EXPAND = re.compile(  # 缩写后跟展开：ABC（...）/ ABC (...)/ ABC，即...
    r"\b([A-Z][A-Za-z]*[A-Z])\b\s*[(（]([^)）]{2,60})[)）]")

CITE_RE = re.compile(r"\\cite[tp]?\{([^}]+)\}")
BIB_RE = re.compile(r"@\w+\s*\{\s*([^,\s]+)\s*,")
LABEL_RE = re.compile(r"\\label\{(fig|table|tab):([^}]+)\}")
REF_RE = re.compile(r"\\(?:auto)?(?:c|c)?ref\{(fig|table|tab):([^}]+)\}")
MD_FIG = re.compile(r"(图|表)\s*(\d+)")   # md/txt 中的中文图表编号


def read_lines(path):
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        return fh.read().splitlines()


def check_cites(lines, bib_path, path, issues):
    if not bib_path:
        return
    bib_keys = set()
    if os.path.exists(bib_path):
        bib_keys = set(BIB_RE.findall("\n".join(read_lines(bib_path))))
    cited = set()
    for ln, line in enumerate(lines, 1):
        for group in CITE_RE.findall(line):
            for key in group.split(","):
                cited.add(key.strip())
    for key in sorted(cited - bib_keys):
        issues.append((path, "引用", "high", "第?行（全文）", "\\cite{%s} 在 .bib 中无对应条目" % key, "补条目或改键名"))
    for key in sorted(bib_keys - cited):
        issues.append((bib_path, "引用", "low", "文献表", "条目 %s 未被正文引用" % key, "删除或补引用"))


def check_figures(lines, path, issues, is_tex):
    """编号连续性 + 先引用后出现。返回 label→首现行号，供交叉核对。"""
    if is_tex:
        labels, refs = {}, []
        for ln, line in enumerate(lines, 1):
            for kind, name in LABEL_RE.findall(line):
                labels.setdefault((kind, name), ln)
            for kind, name in REF_RE.findall(line):
                refs.append((kind, name, ln))
        for kind, name, ln in refs:
            if (kind, name) not in labels:
                issues.append((path, "图表", "high", "第 %d 行" % ln, "\\ref{%s:%s} 无对应 \\label" % (kind, name), "补 label 或改引用"))
        # 先引用后出现：ref 行号 < label 行号
        for (kind, name), ln_label in labels.items():
            for k2, n2, ln_ref in refs:
                if (k2, n2) == (kind, name) and ln_ref < ln_label:
                    issues.append((path, "图表", "medium", "第 %d 行" % ln_ref,
                                   "图/表 %s:%s 被引用（第 %d 行）早于其定义（第 %d 行）" % (kind, name, ln_ref, ln_label),
                                   "调整顺序：先引用后出现"))
    else:
        seen = {"图": [], "表": []}
        for ln, line in enumerate(lines, 1):
            for kind, num in MD_FIG.findall(line):
                seen[kind].append((int(num), ln))
        for kind, seq in seen.items():
            nums = [n for n, _ in seq]
            if not nums:
                continue
            first_def = nums[0] if len(set(nums[:1])) else None
            for i in range(1, len(nums)):
                if nums[i] > nums[i - 1] + 1:
                    issues.append((path, "图表", "medium", "第 %d 行" % seq[i][1],
                                   "%s 编号从 %d 跳到 %d" % (kind, nums[i - 1], nums[i]), "检查编号连续性"))
            if len(nums) > 1 and nums[1] < nums[0] and nums[0] > 1:
                issues.append((path, "图表", "medium", "第 %d 行" % seq[0][1],
                               "%s 首个编号即 %d，疑未从 1 开始" % (kind, nums[0]), "检查编号起点"))


def check_abbr(lines, path, issues, extra_ignore):
    ignore = ABBR_WHITELIST | {w.upper() for w in extra_ignore}
    expanded, seen_abbr = set(), {}
    for ln, line in enumerate(lines, 1):
        for abbr, full in ABBR_EXPAND.findall(line):
            expanded.add(abbr.upper())
        for m in re.finditer(r"\b[A-Za-z]*[A-Z]{2,}[0-9]*\b", line):
            token = m.group(0)
            up = token.upper()
            if up in ignore or up in expanded:
                continue
            if up not in seen_abbr:
                seen_abbr[up] = (ln, line.strip()[:60])
    for up, (ln, ctx) in sorted(seen_abbr.items()):
        issues.append((path, "缩写", "low", "第 %d 行" % ln,
                       "缩写 %s 首次出现未见展开" % up, "首次出现处补全称；若已展开请忽略（启发式）"))


def check_terms(term_csv, issues):
    if not term_csv or not os.path.exists(term_csv):
        return
    groups = {}
    with open(term_csv, "r", encoding="utf-8-sig", newline="") as fh:
        for r in csv.reader(fh):
            if len(r) >= 2 and r[0].strip() and r[1].strip():
                groups.setdefault(r[1].strip(), []).append(r[0].strip())
    return groups   # canonical → [variant...]；真正计数需要文档文本，见 run_audit


def run_audit(paths, bib_path, term_csv, extra_ignore):
    issues = []
    all_text_by_file = {}
    for p in paths:
        if not os.path.exists(p):
            raise SystemExit("文件不存在：%s" % p)
        lines = read_lines(p)
        all_text_by_file[p] = lines
        is_tex = p.lower().endswith(".tex")
        check_cites(lines, bib_path, p, issues)
        check_figures(lines, p, issues, is_tex)
        check_abbr(lines, p, issues, extra_ignore)
    # 术语一致性：跨全部文件计数
    if term_csv and os.path.exists(term_csv):
        want = check_terms(term_csv, issues) or {}
        flat = "\n".join("\n".join(ls) for ls in all_text_by_file.values())
        for canonical, variants in want.items():
            counts = {v: len(re.findall(re.escape(v), flat)) for v in variants}
            used = {v: c for v, c in counts.items() if c > 0}
            if len(used) > 1:
                issues.append(("-", "术语", "medium", "全文",
                               "概念「%s」混用：%s" % (canonical, "，".join("%s×%d" % kv for kv in used.items())),
                               "统一为其中一个变体（建议 %s）" % canonical))
    return issues


def render(issues):
    if not issues:
        return "# 论文自查报告\n\n机械扫描未发现问题（不代表无问题：论证逻辑、数据一致性等语义检查仍需人工/模型复核）。"
    sev_order = {"high": 0, "medium": 1, "low": 2}
    issues = sorted(issues, key=lambda x: sev_order.get(x[2], 3))
    L = ["# 论文自查报告（机械扫描 %d 条）" % len(issues), "",
         "| 文件 | 类型 | 严重度 | 位置 | 问题 | 建议 |", "|---|---|---|---|---|---|"]
    for f, typ, sev, loc, prob, sug in issues:
        L.append("| %s | %s | %s | %s | %s | %s |" % (os.path.basename(f), typ, sev, loc, prob.replace("|", "\\|"), sug.replace("|", "\\|")))
    L.append("\n> 下一步：逐条复核（给行号即可定位原文）；机械报告之外，请模型再从论证结构、数据一致性角度人工补查。")
    return "\n".join(L)


def _demo(outdir="out"):
    os.makedirs(outdir, exist_ok=True)
    doc = os.path.join(outdir, "demo_thesis.md")
    with open(doc, "w", encoding="utf-8") as fh:
        fh.write("# 演示文档\n\n本文提出 ABC 方法。GPU 加速使训练更快。\n"
                 "如图 2 所示……\n\n## 实验\n\n使用 CNN 与 RNN 对比，见图 4。\n"
                 "图 1 是整体框架。表中显示性能（表 3）。\n")
    terms = os.path.join(outdir, "demo_terms.csv")
    with open(terms, "w", encoding="utf-8") as fh:
        fh.write("variant,canonical\nself-attention,自注意力\n自注意力机制,自注意力\n注意力机制,自注意力\n")
    return doc, terms


def main(argv=None):
    ap = argparse.ArgumentParser(description="论文机械自查")
    ap.add_argument("--file", nargs="+", help="待检文档（.tex/.md/.txt，可多个）")
    ap.add_argument("--bib", help="参考文献 .bib（启用引用交叉核对）")
    ap.add_argument("--terms", help="术语表 CSV：variant,canonical")
    ap.add_argument("--ignore", nargs="*", default=[], help="额外忽略的缩写")
    ap.add_argument("--out", default="out")
    ap.add_argument("--demo", action="store_true")
    args = ap.parse_args(argv)
    doc, terms = (None, None)
    if args.demo:
        doc, terms = _demo(args.out)
        print("[demo] 演示文档：%s；术语表：%s" % (doc, terms))
    files = args.file or ([doc] if doc else None)
    if not files:
        ap.error("需要 --file 或 --demo")
    tcsv = args.terms or terms
    issues = run_audit(files, args.bib, tcsv, args.ignore)
    print(render(issues))
    return 0


if __name__ == "__main__":
    sys.exit(main())
