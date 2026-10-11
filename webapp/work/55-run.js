// @ts-nocheck
/* 前端全局脚本层：按字节精确迁移自 JS（见 app/TypeScript迁移说明.md），
   本文件关闭逐行类型检查；环境与第三方库声明见 ambient.d.ts。 */
/* ==================================================================
   55-run.js · 运行页：快速执行一段代码/命令
   复用沙箱 exec（与沙箱页同一引擎、同一策略），只保留最轻的入口；
   完整控制台、策略配置、产物面板在"沙箱"页。历史记录存 work.json runHistory。
   ================================================================== */
function buildRunPage() {
    const shell = Work.pageShell({ wide: false });
    const holder = Work.el('div', 'display: flex; flex-direction: column; gap: 14px;');
    shell.body.appendChild(holder);
    if (!Work.api.available()) {
        holder.appendChild(noBackendCard());
        return { node: shell.root, title: tt('wRun'), desc: tt('wRunDesc'), wide: false };
    }
    Work.store.ready().then(function () {
        holder.replaceChildren();
        renderRun(holder);
    }).catch(function (e) {
        holder.replaceChildren();
        holder.appendChild(Work.noticeBox(tt('wErrLoadFail'), e.message, 'warn'));
    });
    return { node: shell.root, title: tt('wRun'), desc: tt('wRunDesc'), wide: false };
}
function renderRun(holder) {
    const s = WorkState.sandbox;
    const card = Work.card({ gap: '10px' });
    const head = Work.el('div', 'display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;');
    head.appendChild(Work.sectionLabel(tt('wConsole')));
    const ops = Work.el('div', 'display: flex; align-items: center; gap: 8px;');
    ops.appendChild(Work.seg([
        { value: 'python', label: 'Python' }, { value: 'node', label: 'Node' }, { value: 'shell', label: 'Shell' }
    ], function () { return s.lang; }, function (v) { s.lang = v; }));
    const runBtn = Work.pillBtn(s.running ? tt('wRunning') : tt('wRun'), s.running ? Work.ICONS.clock : Work.ICONS.play, run, { primary: true });
    const stopBtn = Work.smallBtn(tt('wStop'), function () { if (s._run)
        s._run.abort(); }, { danger: true });
    stopBtn.style.display = s.running ? '' : 'none';
    ops.appendChild(runBtn);
    ops.appendChild(stopBtn);
    head.appendChild(ops);
    card.appendChild(head);
    const editor = Work.field({ multiline: true, mono: true, rows: 8, value: s.code, placeholder: tt('wCodePh') });
    editor.input.addEventListener('input', function () { s.code = editor.input.value; });
    card.appendChild(editor);
    const out = Work.preBlock(s.output || tt('wOutEmpty'), { maxHeight: '300px' });
    card.appendChild(out);
    function setRunning(v) {
        s.running = v;
        runBtn.textContent = v ? tt('wRunning') : tt('wRun');
        stopBtn.style.display = v ? '' : 'none';
    }
    function run() {
        if (s.running)
            return;
        const code = editor.input.value;
        if (!code.trim()) {
            Work.toast(tt('wEmptyCode'));
            return;
        }
        s.output = '';
        out.textContent = tt('wOutQueued');
        setRunning(true);
        s._run = Work.api.sse('/api/work/sandbox/exec', { scopeId: 'global', lang: s.lang, code: code }, {
            onEvent: function (evt, data) {
                if (evt === 'stdout' || evt === 'stderr') {
                    s.output = (s.output || '') + (evt === 'stderr' ? '[stderr] ' : '') + (data.delta || '');
                    if (s.output.length > 204800)
                        s.output = s.output.slice(-204800);
                    out.textContent = s.output;
                    out.scrollTop = out.scrollHeight;
                }
                else if (evt === 'end') {
                    const r = data.result || {};
                    s.result = r;
                    s.output = (s.output || '') + (r.stdout || '') + (r.stderr ? '\n[stderr]\n' + r.stderr : '');
                    out.textContent = s.output || tt('wOutEmpty');
                    out.scrollTop = out.scrollHeight;
                    pushHistory(code, r);
                }
                else if (evt === 'error') {
                    s.output = (s.output || '') + '\n[error] ' + (data.message || '');
                    out.textContent = s.output;
                }
            },
            onClose: function () { setRunning(false); },
            onAbort: function () { setRunning(false); s.output += '\n[' + tt('wAborted') + ']'; out.textContent = s.output; },
            onError: function (e) { setRunning(false); s.output = (s.output || '') + '\n[error] ' + e.message; out.textContent = s.output; }
        });
    }
    function pushHistory(code, r) {
        const hist = WorkState.runHistory || [];
        hist.unshift({
            at: Date.now(), lang: s.lang,
            code: Work.truncate(code, 2000),
            ok: r.ok, exitCode: r.exitCode, durationMs: r.durationMs,
            stdout: Work.truncate(r.stdout || '', 500)
        });
        if (hist.length > 50)
            hist.length = 50;
        WorkState.runHistory = hist;
        Work.api.fetch('/api/work/run-history', { method: 'PUT', body: { runHistory: hist.slice(0, 20) } }).catch(function () { });
        paintHistory(hist);
    }
    const histWrap = Work.el('div', 'display: flex; flex-direction: column; gap: 8px;');
    holder.appendChild(card);
    holder.appendChild(Work.sectionLabel(tt('wRunHistory')));
    holder.appendChild(histWrap);
    function paintHistory(hist) {
        histWrap.replaceChildren();
        if (!hist || !hist.length) {
            histWrap.appendChild(Work.hint(tt('wRunHistEmpty')));
            return;
        }
        hist.slice(0, 10).forEach(function (h) {
            const row = Work.el('div', 'padding: 8px 11px; background: var(--accent-soft); border-radius: 10px;'
                + ' display: flex; align-items: center; gap: 8px; cursor: pointer;');
            row.appendChild(Work.statusDot(h.ok ? 'ok' : 'error'));
            row.appendChild(Work.el('div', 'color: var(--text-2); font-size: 11px; font-family: var(--mono);'
                + ' flex: 1 1 0; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', (h.lang + ' · ' + h.code.replace(/\s+/g, ' '))));
            row.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px; flex-shrink: 0;', Work.fmtMs(h.durationMs)));
            row.addEventListener('click', function () {
                s.lang = h.lang;
                s.code = h.code;
                Work.rerender();
            });
            histWrap.appendChild(row);
        });
    }
    paintHistory(WorkState.runHistory || []);
}
Work.pages.run = buildRunPage;
