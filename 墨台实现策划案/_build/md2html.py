# -*- coding: utf-8 -*-
"""
Markdown -> typeset HTML (business-report genre) for the tencent-docx pipeline.

Rules enforced (per doc-typeset SKILL.md):
- no display:grid, no <dl>/<dt>/<dd>  -> use <table>
- every <table> has <thead> + <tbody>
- key CSS props declared explicitly (no inheritance reliance)
- no decorative <hr>
- cover + body as adjacent top-level <section>
- left-border blocks get &nbsp;&nbsp; prefix
- all styles via CSS vars
"""
import re
import sys
import json
import html as htmllib

# ---------------------------------------------------------------- token map
TOKENS = json.load(open(sys.argv[2], encoding="utf-8"))
CV = TOKENS["css_variables"]


def v(name, fallback=""):
    """Reference a design token as a CSS custom property."""
    return "var(" + name + ("", ")" if fallback is None else ", " + fallback + ")")[0]


def V(name, fb=None):
    return "var(--%s%s)" % (name, "" if fb is None else ", " + fb)


# ---------------------------------------------------------------- inline md
def inline(text):
    """Inline markdown -> HTML, escaping first."""
    t = htmllib.escape(text, quote=False)
    # protect inline code spans first
    codes = []

    def _stash(m):
        codes.append(m.group(1))
        return "\x00%d\x00" % (len(codes) - 1)

    t = re.sub(r"`([^`]+)`", _stash, t)
    t = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*([^*\n]+?)\*(?!\*)", r"<em>\1</em>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', t)
    for i, c in enumerate(codes):
        t = t.replace("\x00%d\x00" % i, "<code>%s</code>" % c)
    return t


def cell(text):
    return inline(text.strip())


# ---------------------------------------------------------------- table
def render_table(rows):
    """rows: list of list-of-str. First row = header."""
    if not rows:
        return ""
    head = rows[0]
    body = rows[1:]
    out = ['<table class="doc-table">', "<thead><tr>"]
    for h in head:
        out.append("<th>%s</th>" % cell(h))
    out.append("</tr></thead>")
    out.append("<tbody>")
    for r in body:
        out.append("<tr>")
        for c in r:
            out.append("<td>%s</td>" % cell(c))
        out.append("</tr>")
    out.append("</tbody></table>")
    return "".join(out)


# ---------------------------------------------------------------- callout
CALLOUT_RE = re.compile(r"^(注意|警告|重要|严禁|风险|缺陷|关键冲突|关键|提示)")


def callout(text, kind):
    # left-border block: two non-collapsing leading spaces required
    return '<p class="callout callout--%s">&nbsp;&nbsp;%s</p>' % (kind, inline(text))


# ---------------------------------------------------------------- main parse
def parse(md, title):
    lines = md.split("\n")
    blocks = []          # list of html strings
    i = 0
    n = len(lines)
    h2_list = []         # (anchor, text)
    h2_idx = 0

    def flush_para(buf):
        if buf:
            txt = " ".join(x.strip() for x in buf).strip()
            if txt:
                blocks.append("<p>%s</p>" % inline(txt))
            buf.clear()

    para = []
    while i < n:
        line = lines[i]
        s = line.strip()

        # ---- table detection: | ... | line followed by separator
        if s.startswith("|") and i + 1 < n and re.match(r"^\|[\s:\-|]+\|$", lines[i + 1].strip()):
            flush_para(para)
            rows = []
            hdr = [c for c in s.strip("|").split("|")]
            rows.append(hdr)
            i += 2
            while i < n and lines[i].strip().startswith("|"):
                rows.append(lines[i].strip().strip("|").split("|"))
                i += 1
            blocks.append(render_table(rows))
            continue

        # ---- headings
        if s.startswith("#### "):
            flush_para(para)
            blocks.append("<h4>%s</h4>" % inline(s[5:]))
            i += 1
            continue
        if s.startswith("### "):
            flush_para(para)
            blocks.append("<h3>%s</h3>" % inline(s[4:]))
            i += 1
            continue
        if s.startswith("## "):
            flush_para(para)
            h2_idx += 1
            txt = s[3:]
            anchor = "section-%d" % h2_idx
            h2_list.append((anchor, txt))
            blocks.append('<h2 id="%s">%s</h2>' % (anchor, inline(txt)))
            i += 1
            continue
        if s.startswith("# "):
            flush_para(para)
            blocks.append("<h1>%s</h1>" % inline(s[2:]))
            i += 1
            continue

        # ---- hr -> divider
        if re.match(r"^-{3,}$", s) or re.match(r"^\*{3,}$", s):
            flush_para(para)
            blocks.append('<div data-component="divider"></div>')
            i += 1
            continue

        # ---- blockquote
        if s.startswith(">"):
            flush_para(para)
            buf = []
            while i < n and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip().lstrip(">").strip())
                i += 1
            blocks.append(callout(" ".join(buf), "info"))
            continue

        # ---- fenced code
        if s.startswith("```"):
            flush_para(para)
            i += 1
            buf = []
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            body = htmllib.escape("\n".join(buf), quote=False)
            blocks.append("<pre><code>%s</code></pre>" % body)
            continue

        # ---- list
        if re.match(r"^([-*+]|\d+\.)\s+", s):
            flush_para(para)
            ordered = bool(re.match(r"^\d+\.\s+", s))
            tag = "ol" if ordered else "ul"
            items = []
            while i < n:
                t = lines[i].strip()
                m = re.match(r"^([-*+]|\d+\.)\s+(.*)$", t)
                if not m:
                    break
                items.append(m.group(2))
                i += 1
            blocks.append("<%s>%s</%s>" % (
                tag, "".join("<li>%s</li>" % inline(x) for x in items), tag))
            continue

        # ---- blank
        if not s:
            flush_para(para)
            i += 1
            continue

        # ---- callout-ish paragraph
        if CALLOUT_RE.match(s):
            flush_para(para)
            kind = "warning" if re.match(r"^(注意|警告|重要|严禁|风险|缺陷|关键)", s) else "info"
            blocks.append(callout(s.strip("*").strip(), kind))
            i += 1
            continue

        para.append(line)
        i += 1

    flush_para(para)
    return blocks, h2_list


# ---------------------------------------------------------------- assemble
CSS = """
@page { @bottom-center { content: counter(page); } }
@page cover { @bottom-center { content: none; } }
section[role="cover"] { page: cover; }

:root {
  --fs-h1: %(h1)s;
  --fs-h2: %(h2)s;
  --fs-h3: %(h3)s;
  --fs-h4: %(h4)s;
  --fs-body: %(body)s;
  --fs-small: %(small)s;
  --fs-tiny: %(tiny)s;
  --ff-heading: %(ffh)s;
  --ff-body: %(ffb)s;
  --ff-mono: %(ffm)s;
  --lh-body: %(lhb)s;
  --lh-title: %(lht)s;
  --fw-bold: %(fwb)s;
  --fw-em: %(fwe)s;
  --fw-normal: %(fwn)s;

  --color-primary: %(cp)s;
  --color-secondary: %(cs)s;
  --color-accent: %(ca)s;
  --color-text: %(ct)s;
  --color-heading: %(ch)s;
  --color-muted: %(cm)s;
  --color-border: %(cb)s;
  --color-bg: %(cbg)s;
  --color-surface: %(csurf)s;
  --color-divider: %(cdiv)s;
  --color-danger: #C62828;
  --color-emphasis: #C62828;
  --color-success: #2E7D32;
  --color-warn: #B26A00;
  --color-code-bg: #F5F7FA;

  --spacing-paragraph: %(spp)s;
  --spacing-section: %(sps)s;
  --spacing-block: %(spb)s;
  --spacing-card: %(spc)s;
  --margin-page: %(mp)s;
  --page-content-width: 15.6cm;
  --radius-card: 6px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--ff-body);
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  color: var(--color-text);
  background: var(--color-bg);
  max-width: var(--page-content-width);
  margin-left: auto;
  margin-right: auto;
}

/* ---------------- cover ---------------- */
section[role="cover"] { padding: 0; }
.cover-inner { padding: 4.2cm 0 0 0; }
.cover-category {
  font-family: var(--ff-heading); font-size: var(--fs-small);
  font-weight: var(--fw-bold); color: var(--color-primary);
  letter-spacing: 0.18em; text-align: left; margin-bottom: 1.1em;
}
.cover-title {
  font-family: var(--ff-heading); font-size: var(--fs-h1);
  font-weight: var(--fw-bold); color: var(--color-heading);
  line-height: var(--lh-title); text-align: left; margin-bottom: 0.55em;
}
.cover-subtitle {
  font-size: var(--fs-h3); color: var(--color-muted);
  text-align: left; line-height: 1.5; margin-bottom: 2.6em;
}
.cover-info { width: 100%%; border-collapse: collapse; margin-top: 2.4cm; }
.cover-info td {
  padding: 0.42em 0; font-size: var(--fs-small);
  color: var(--color-muted); border-bottom: 1px solid var(--color-divider);
  text-align: left;
}
.cover-info td:first-child {
  width: 6.2em; color: var(--color-text); font-weight: var(--fw-em);
}
.cover-foot {
  margin-top: 1.6cm; font-size: var(--fs-tiny); color: var(--color-muted);
  text-align: left;
}

/* ---------------- body ---------------- */
.body-wrap { padding: 0; }
h1 {
  font-family: var(--ff-heading); font-size: var(--fs-h1);
  font-weight: var(--fw-bold); color: var(--color-heading);
  line-height: var(--lh-title); margin-bottom: 0.8em;
}
h2 {
  font-family: var(--ff-heading); font-size: var(--fs-h2);
  font-weight: var(--fw-bold); color: var(--color-heading);
  line-height: var(--lh-title); margin-top: 1.9em; margin-bottom: 0.62em;
  padding-bottom: 0.22em; border-bottom: 1px solid var(--color-divider);
}
h3 {
  font-family: var(--ff-heading); font-size: var(--fs-h3);
  font-weight: var(--fw-bold); color: var(--color-primary);
  margin-top: 1.35em; margin-bottom: 0.5em;
}
h4 {
  font-family: var(--ff-heading); font-size: var(--fs-h4);
  font-weight: var(--fw-bold); color: var(--color-text);
  margin-top: 1.05em; margin-bottom: 0.4em;
}
p { margin-bottom: var(--spacing-paragraph); text-align: left; }
ul, ol { margin: 0 0 var(--spacing-paragraph) 1.5em; }
li { margin-bottom: 0.32em; line-height: var(--lh-body); }
strong { font-weight: var(--fw-bold); color: var(--color-heading); }
code {
  font-family: var(--ff-mono); font-size: 0.92em;
  background: var(--color-code-bg); padding: 1px 4px;
  border-radius: 3px; color: var(--color-heading);
}
pre {
  background: var(--color-code-bg); border: 1px solid var(--color-border);
  border-radius: var(--radius-card); padding: 0.72em 0.9em;
  margin-bottom: var(--spacing-paragraph); overflow-x: auto;
}
pre code { background: none; padding: 0; font-size: 0.86em; }

/* ---------------- toc ---------------- */
.doc-toc {
  margin-bottom: 1.8em; padding: 1.05em 1.2em;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
}
.toc-title {
  font-family: var(--ff-heading); font-size: var(--fs-h4);
  font-weight: var(--fw-bold); color: var(--color-heading);
  margin-bottom: 0.6em;
}
.toc-list, .toc-list ol, .toc-list ul { list-style: none; list-style-type: none;
  padding-left: 0; margin: 0; }
.toc-list li { margin-bottom: 0.3em; text-indent: 0; font-size: var(--fs-small); }
.toc-list a { color: var(--color-primary); text-decoration: none; }

/* ---------------- table ---------------- */
.doc-table {
  width: 100%%; border-collapse: collapse; margin-bottom: var(--spacing-block);
  table-layout: fixed; font-size: var(--fs-small);
}
.doc-table th {
  background: var(--color-primary); color: #FFFFFF;
  font-family: var(--ff-heading); font-weight: var(--fw-bold);
  padding: 0.5em 0.62em; border: 1px solid var(--color-primary);
  text-align: left; font-size: var(--fs-tiny);
}
.doc-table td {
  padding: 0.46em 0.62em; border: 1px solid var(--color-border);
  vertical-align: top; text-align: left; word-wrap: break-word;
}
.doc-table tbody tr:nth-child(even) td { background: var(--color-surface); }

/* ---------------- callout ---------------- */
.callout {
  margin-bottom: var(--spacing-paragraph);
  padding: 0.62em 0.85em 0.62em 0.9em;
  border-left: 3px solid var(--color-primary);
  background: var(--color-surface);
  border-radius: 0 var(--radius-card) var(--radius-card) 0;
}
.callout--warning {
  border-left-color: var(--color-warn); background: #FFFBEB;
}
.callout--danger {
  border-left-color: var(--color-danger); background: #FEF2F2;
}

/* ---------------- misc ---------------- */
section[role="body"] { padding: 0; }
h2 + p, h3 + p, h4 + p { text-align: left; }
"""


def build_html(md, title, subtitle, category, meta_rows, foot):
    blocks, h2_list = parse(md, title)
    css = CSS % {
        "h1": CV["--typography-fontSize-h1"],
        "h2": CV["--typography-fontSize-h2"],
        "h3": CV["--typography-fontSize-h3"],
        "h4": CV["--typography-fontSize-body"],
        "body": CV["--typography-fontSize-body"],
        "small": CV["--typography-fontSize-small"],
        "tiny": CV["--typography-fontSize-tiny"],
        "ffh": CV["--typography-fontFamily-heading"],
        "ffb": CV["--typography-fontFamily-body"],
        "ffm": CV["--typography-fontFamily-code"],
        "lhb": CV["--typography-lineHeight-body"],
        "lht": CV["--typography-lineHeight-title"],
        "fwb": "700",
        "fwe": CV["--typography-fontWeight-emphasis"],
        "fwn": CV["--typography-fontWeight-body"],
        "cp": CV["--color-primary"],
        "cs": CV["--color-secondary"],
        "ca": CV["--color-accent"],
        "ct": CV["--color-text"],
        "ch": CV["--color-heading"],
        "cm": CV["--color-textSecondary"],
        "cb": CV["--color-divider"],
        "cbg": CV["--color-background"],
        "csurf": CV["--color-surface"],
        "cdiv": CV["--color-divider"],
        "spp": CV["--spacing-paragraph"],
        "sps": CV["--spacing-sectionGap"],
        "spb": CV["--spacing-cardPadding"],
        "spc": CV["--spacing-cardPadding"],
        "mp": CV["--layout-marginLeft"],
    }

    # toc
    toc = ""
    if len(h2_list) >= 3:
        items = "".join('<li><a href="#%s">%s</a></li>' % (a, inline(t))
                        for a, t in h2_list)
        toc = ('<nav class="doc-toc" aria-label="文档目录">'
               '<p class="toc-title">目录</p>'
               '<ol class="toc-list">%s</ol></nav>' % items)

    info_rows = "".join(
        "<tr><td>%s</td><td>%s</td></tr>" % (k, val) for k, val in meta_rows)

    body = toc + "\n".join(blocks)

    return """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="docx-page-size" content="A4">
<title>%(title)s</title>
<style>%(css)s</style>
</head>
<body>
<section role="cover">
  <div class="cover-inner">
    <p class="cover-category">%(category)s</p>
    <h1 class="cover-title">%(title)s</h1>
    <p class="cover-subtitle">%(subtitle)s</p>
    <table class="cover-info">%(info)s</table>
    <p class="cover-foot">%(foot)s</p>
  </div>
</section>
<section role="body" data-page-restart="1">
<div class="body-wrap">
%(body)s
</div>
</section>
</body>
</html>
""" % dict(css=css, title=title, subtitle=subtitle, category=category,
           info=info_rows, foot=foot, body=body)


if __name__ == "__main__":
    cfgs = json.load(open(sys.argv[3], encoding="utf-8"))
    doc_id = sys.argv[5] if len(sys.argv) > 5 else None
    cfg = cfgs[doc_id] if doc_id and doc_id in cfgs else cfgs
    md = open(sys.argv[1], encoding="utf-8").read()
    out = build_html(md, cfg["title"], cfg["subtitle"], cfg["category"],
                     cfg["meta"], cfg["foot"])
    open(sys.argv[4], "w", encoding="utf-8").write(out)
    print("WROTE", sys.argv[4], len(out))
