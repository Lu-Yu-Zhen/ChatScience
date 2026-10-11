# -*- coding: utf-8 -*-
"""Batch build: md -> html -> docx for all six volumes."""
import json
import os
import subprocess
import sys

PY = r"C:\Users\晖\.venv-html-to-docx\Scripts\python.exe"
PLUGIN = r"C:\Users\晖\.workbuddy\plugins\cache\workbuddy-builtin\tencent-docx\5.5.6-wb.38337834.g5f969292.h4918b5ced607"
M2H = r"D:\ChatScience\墨台实现策划案\_build\md2html.py"
TOK = os.path.join(PLUGIN, r"skills\design-token\tokens\compiled\business-report.json")
CFG = r"D:\ChatScience\墨台实现策划案\_build\config.json"
SCRIPTS = os.path.join(PLUGIN, r"skills\html-to-docx\scripts")

BASE = r"D:\ChatScience\墨台实现策划案"
SRC = os.path.join(BASE, "_src")
OUT = BASE

DOCS = [
    ("01", "01-UI.md", "01-UI", "formatted-ui.html",
     "墨台-01-UI板块实现策划案.docx"),
    ("02", "02-前端.md", "02-前端", "formatted-fe.html",
     "墨台-02-前端板块实现策划案.docx"),
    ("03", "03-后端.md", "03-后端", "formatted-be.html",
     "墨台-03-后端板块实现策划案.docx"),
    ("04", "04-Agent系统设计.md", "04-Agent", "formatted-agent.html",
     "墨台-04-Agent系统设计实现策划案.docx"),
    ("05", "05-宣传.md", "05-宣传", "formatted-promo.html",
     "墨台-05-宣传板块实现策划案.docx"),
    ("06", "06-订阅预付费.md", "06-订阅", "formatted-billing.html",
     "墨台-06-订阅预付费板块实现策划案.docx"),
]

log = []

for did, srcname, pipename, htmlname, docxname in DOCS:
    md_path = os.path.join(SRC, srcname)
    stage2 = os.path.join(BASE, "_pipe", pipename, "stage2")
    html_path = os.path.join(stage2, htmlname)
    docx_path = os.path.join(OUT, docxname)
    os.makedirs(stage2, exist_ok=True)

    # ---- S2: md -> html
    r = subprocess.run([PY, M2H, md_path, TOK, CFG, html_path, did],
                       capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        log.append("[%s] S2 FAILED: %s" % (did, r.stderr[-1500:]))
        continue
    log.append("[%s] S2 ok (%s bytes)" % (did, os.path.getsize(html_path)))

    # ---- S3: html -> docx
    env = dict(os.environ)
    env["PYTHONPATH"] = SCRIPTS
    r = subprocess.run(
        [PY, "-m", "html_to_docx", "convert", html_path, "-o", docx_path,
         "--page-size", "A4", "--orientation", "portrait",
         "--margin-top", "2.5", "--margin-bottom", "2.0",
         "--margin-left", "2.5", "--margin-right", "2.5"],
        capture_output=True, text=True, encoding="utf-8",
        cwd=SCRIPTS, env=env)
    if r.returncode != 0:
        log.append("[%s] S3 FAILED: %s" % (did, (r.stderr or "")[-1500:]))
    else:
        log.append("[%s] S3 -> %s | %s" % (did, docxname, r.stdout.strip()[:300]))

sys.stdout.reconfigure(encoding="utf-8")
print("\n".join(log))
