# -*- coding: utf-8 -*-
"""文献清单 → BibTeX 导出（去重、生成 citation key）。

设计动机：综述收尾要交引用清单；手写 .bib 格式易错。输入 arxiv_search 已拿到的
结构化信息（JSON），本脚本确定性生成 .bib，并按 arXiv id 去重。

输入格式（--input JSON 文件或 stdin）：
  [{"id": "2401.12345", "title": "...", "authors": ["A. B. Author", ...],
    "year": 2024, "venue": "arXiv"}, ...]
  id 也可以是完整 arXiv 链接，脚本自动抽取编号。
--fetch 模式：只给 id 列表（--ids "2401.12345,2402.00001"），脚本访问
  arXiv 官方 export API 拉取元数据（需要网络；失败时提示改用 JSON 输入）。

用法：
  python bib_export.py --input papers.json
  python bib_export.py --ids "2401.12345, 2310.06825" --fetch
"""
import argparse
import json
import re
import sys
import urllib.request
from xml.etree import ElementTree

ARXIV_ID = re.compile(r"(\d{4}\.\d{4,5})(v\d+)?$")
NS = {"a": "http://www.w3.org/2005/Atom"}


def extract_id(s):
    """从 '2401.12345v2' 或 'https://arxiv.org/abs/2401.12345' 抽取裸 id。"""
    s = str(s).strip().rstrip("/")
    m = ARXIV_ID.search(s)
    if m:
        return m.group(1)
    m = re.search(r"arxiv\.org/(?:abs|pdf)/([a-zA-Z-]+\.\d{4,5})", s)
    return m.group(1) if m else s


def tex_escape(s):
    return (str(s).replace("&", r"\&").replace("%", r"\%").replace("_", r"\_")
            .replace("#", r"\#").replace("{", "{{").replace("}", "}}"))


def make_key(entry, used):
    """citation key：首作者姓氏小写 + 年份 + 标题首实词。冲突时加 a/b/c。"""
    authors = entry.get("authors") or ["anon"]
    first = re.split(r"[,\s]+", authors[0].strip())[-1].lower()
    first = re.sub(r"[^a-z]", "", first) or "anon"
    word = re.sub(r"[^A-Za-z]", "", (entry.get("title") or "notitle").split()[-1] if (entry.get("title") or "").split() else "notitle").lower()
    base = "%s%s%s" % (first, entry.get("year", ""), word)
    key, i = base, 0
    while key in used:
        i += 1
        key = base + "abcdef"[i % 6] + ("a" * (i // 6))
    used.add(key)
    return key


def to_bibtex(entries):
    used, out = set(), []
    for e in entries:
        e = dict(e)
        e["id"] = extract_id(e.get("id", ""))
        key = make_key(e, used)
        authors = " and ".join(e.get("authors") or ["Anonymous"])
        lines = ["@article{%s," % key,
                 "  title     = {%s}," % tex_escape(e.get("title", "Untitled")),
                 "  author    = {%s}," % tex_escape(authors),
                 "  year      = {%s}," % e.get("year", ""),
                 "  journal   = {%s}," % tex_escape(e.get("venue", "arXiv preprint")),
                 "  eprint    = {%s}," % e["id"],
                 "  archivePrefix = {arXiv},",
                 "}"]
        out.append("\n".join(lines))
    return "\n\n".join(out) + "\n"


def fetch_arxiv(ids):
    """arXiv 官方 export API 批量拉取元数据（免 key）。"""
    idq = ",".join(extract_id(i) for i in ids)
    url = "http://export.arxiv.org/api/query?id_list=%s&max_results=%d" % (idq, max(len(ids), 1))
    with urllib.request.urlopen(url, timeout=30) as r:
        root = ElementTree.fromstring(r.read())
    entries = []
    for e in root.findall("a:entry", NS):
        authors = [a.findtext("a:name", "", NS) for a in e.findall("a:author", NS)]
        eid = e.findtext("a:id", "", NS)
        entries.append({
            "id": extract_id(eid),
            "title": re.sub(r"\s+", " ", e.findtext("a:title", "", NS)).strip(),
            "authors": authors,
            "year": (e.findtext("a:published", "", NS) or "")[:4],
            "venue": "arXiv",
        })
    return entries


def main(argv=None):
    ap = argparse.ArgumentParser(description="文献清单 → BibTeX")
    ap.add_argument("--input", help="JSON 文件（结构见文件头注释）；缺省读 stdin")
    ap.add_argument("--ids", help="逗号分隔 arXiv id，配合 --fetch")
    ap.add_argument("--fetch", action="store_true", help="访问 arXiv API 拉元数据")
    args = ap.parse_args(argv)
    if args.fetch:
        if not args.ids:
            ap.error("--fetch 需要 --ids")
        ids = [i for i in re.split(r"[,\s]+", args.ids) if i]
        entries = fetch_arxiv(ids)
        print("[fetch] 从 arXiv 取回 %d 条" % len(entries), file=sys.stderr)
    else:
        raw = open(args.input, "r", encoding="utf-8").read() if args.input else sys.stdin.read()
        entries = json.loads(raw)
    # 按 arXiv id 去重（保留首个）
    seen, uniq = set(), []
    for e in entries:
        k = extract_id(e.get("id", "")) or json.dumps(e, sort_keys=True)
        if k not in seen:
            seen.add(k)
            uniq.append(e)
    print("[dedup] %d → %d 条" % (len(entries), len(uniq)), file=sys.stderr)
    print(to_bibtex(uniq))
    return 0


if __name__ == "__main__":
    sys.exit(main())
