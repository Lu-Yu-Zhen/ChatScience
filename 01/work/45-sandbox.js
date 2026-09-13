/* ==================================================================
   45-sandbox.js · 沙箱页（wide 全宽）
   左列：运行时环境诊断 + 执行策略；右列：控制台（代码 / 实时输出 / 结果 / 产物）
   所有代码与输出一律 textContent 渲染——模型或脚本可打印任意 HTML，
   走 innerHTML 等于在渲染进程里执行它。
   ================================================================== */

function noBackendCard() {
  return Work.noticeBox(tt('wNoBackendTitle'), tt('wNoBackendBody'), 'warn');
}

function sandboxPolicyEditor(card) {
  const p = WorkState.sandboxPolicy;
  const inputs = {};

  function numField(key, label, sub, suffix) {
    const wrap = Work.field({
      label: label + (suffix ? '（' + suffix + '）' : ''),
      value: p[key] !== undefined ? String(p[key]) : '',
      hint: sub, hintTone: 'ok'
    });
    let timer = null;
    wrap.input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        const v = parseInt(wrap.input.value, 10);
        if (!isNaN(v)) { p[key] = v; pushPolicy(); }
      }, 700);
    });
    inputs[key] = wrap;
    card.appendChild(wrap);
  }

  numField('timeoutMs', tt('wPolTimeout'), tt('wPolTimeoutSub'), 'ms');
  numField('maxOutputBytes', tt('wPolOutput'), tt('wPolOutputSub'), 'bytes');
  numField('maxConcurrent', tt('wPolConcurrent'), tt('wPolConcurrentSub'));
  numField('maxFileSizeMb', tt('wPolFileSize'), tt('wPolFileSizeSub'), 'MB');

  const netRow = Work.row(tt('wPolNetwork'), Work.seg([
    { value: 'open', label: tt('wNetOpen') },
    { value: 'declared', label: tt('wNetDeclared') }
  ], function () { return p.network || 'declared'; }, function (v) {
    p.network = v; pushPolicy();
  }), { sub: tt('wPolNetworkSub') });
  card.appendChild(netRow);

  card.appendChild(Work.row(tt('wPolDanger'), Work.toggle(function () { return p.blockDangerPatterns !== false; }, function (v) { p.blockDangerPatterns = v; pushPolicy(); }),
    { sub: tt('wPolDangerSub') }));
  card.appendChild(Work.row(tt('wPolTraversal'), Work.toggle(function () { return p.blockParentTraversal !== false; }, function (v) { p.blockParentTraversal = v; pushPolicy(); }),
    { sub: tt('wPolTraversalSub') }));
  card.appendChild(Work.row(tt('wPolNetImports'), Work.toggle(function () { return !!p.blockNetworkImports; }, function (v) { p.blockNetworkImports = v; pushPolicy(); }),
    { sub: tt('wPolNetImportsSub') }));
}

let _policySaveTimer = null;
function pushPolicy() {
  clearTimeout(_policySaveTimer);
  _policySaveTimer = setTimeout(function () {
    Work.store.saveSandboxPolicy(WorkState.sandboxPolicy).catch(function (e) {
      Work.toast(tt('wErrSavePolicy') + '：' + e.message);
    });
  }, 600);
}

function runtimeCard(body) {
  const c = Work.card({});
  const head = Work.el('div', 'display: flex; justify-content: space-between; align-items: center;');
  head.appendChild(Work.sectionLabel(tt('wRtTitle')));
  const refresh = Work.smallBtn(tt('wRefresh'), function () {
    refresh.style.opacity = '0.45';
    Work.api.fetch('/api/work/sandbox/runtimes?force=1').then(function (rt) {
      WorkState.runtimes = rt;
      Work.rerender();
    }).catch(function (e) { Work.toast(e.message); });
  });
  head.appendChild(refresh);
  c.appendChild(head);

  const rt = WorkState.runtimes || { runtimes: {}, errors: [] };
  const names = { python: 'Python', node: 'Node.js', uv: 'uv', npm: 'npm', pip: 'pip' };
  Object.keys(names).forEach(function (k) {
    const r = (rt.runtimes || {})[k];
    const row = Work.el('div', 'display: flex; align-items: center; gap: 9px; padding: 7px 10px;'
      + ' background: var(--accent-soft); border-radius: 10px;');
    row.appendChild(Work.statusDot(r ? 'ok' : 'idle'));
    row.appendChild(Work.el('div', 'color: var(--text-1); font-size: 12.5px; font-weight: 500; flex: 1 1 0;', names[k]));
    row.appendChild(Work.el('div', 'color: ' + (r ? 'var(--text-2)' : 'var(--text-3)') + '; font-size: 11.5px; font-family: var(--mono);', r ? r.version : tt('wRtMissing')));
    c.appendChild(row);
    if (r && r.raw && r.raw !== r.version) {
      c.appendChild(Work.hint(Work.truncate(r.raw, 90)));
    }
  });
  if (rt.errors && rt.errors.length) {
    c.appendChild(Work.hint(tt('wRtProbeFail') + '：' + rt.errors.map(function (e) { return e.key; }).join(', '), 'warn'));
  }
  c.appendChild(Work.hint(tt('wRtInfo') + '：' + (rt.platform || '?') + ' · ' + (rt.arch || '?') + ' · ' + (rt.cpus || '?') + ' 核 · ' + (rt.totalMemMb || '?') + ' MB'));
  body.appendChild(c);
  return c;
}

function consoleCard(body) {
  const s = WorkState.sandbox;
  const c = Work.card({ gap: '10px' });
  const head = Work.el('div', 'display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;');
  head.appendChild(Work.sectionLabel(tt('wConsole')));
  const ops = Work.el('div', 'display: flex; align-items: center; gap: 8px;');
  ops.appendChild(Work.seg([
    { value: 'python', label: 'Python' },
    { value: 'node', label: 'Node' },
    { value: 'shell', label: 'Shell' }
  ], function () { return s.lang; }, function (v) { s.lang = v; }));
  const runBtn = Work.pillBtn(s.running ? tt('wRunning') : tt('wRun'), s.running ? Work.ICONS.clock : Work.ICONS.play, runNow, { primary: true });
  const stopBtn = Work.smallBtn(tt('wStop'), function () { if (s._run) s._run.abort(); }, { danger: true });
  stopBtn.style.display = s.running ? '' : 'none';
  ops.appendChild(runBtn);
  ops.appendChild(stopBtn);
  head.appendChild(ops);
  c.appendChild(head);

  const editor = Work.field({
    multiline: true, mono: true, rows: 10,
    value: s.code, placeholder: tt('wCodePh')
  });
  editor.input.addEventListener('input', function () { s.code = editor.input.value; });
  c.appendChild(editor);

  const out = Work.preBlock(s.output || tt('wOutEmpty'), { maxHeight: '340px' });
  c.appendChild(out);

  const meta = Work.el('div', 'display: none; flex-wrap: wrap; gap: 8px; align-items: center;');
  c.appendChild(meta);

  const filesWrap = Work.el('div', 'display: flex; flex-direction: column; gap: 8px;');
  c.appendChild(filesWrap);

  function setRunning(v) {
    s.running = v;
    runBtn.textContent = v ? tt('wRunning') : tt('wRun');
    stopBtn.style.display = v ? '' : 'none';
    runBtn.style.opacity = v ? '0.6' : '';
  }

  function paintResult(r) {
    if (!r) { meta.style.display = 'none'; meta.replaceChildren(); return; }
    meta.replaceChildren();
    const bits = [];
    bits.push([r.ok ? tt('wResOk') : tt('wResFail'), r.ok ? 'var(--ok)' : 'var(--danger-text)']);
    if (r.exitCode !== null && r.exitCode !== undefined) bits.push(['exit ' + r.exitCode, 'var(--text-2)']);
    bits.push([Work.fmtMs(r.durationMs), 'var(--text-2)']);
    if (r.timedOut) bits.push([tt('wResTimeout'), 'var(--warn)']);
    if (r.blocked) bits.push([tt('wResBlocked'), 'var(--warn)']);
    if (r.networkPolicy === 'declared-only') bits.push([tt('wResNetDeclared'), 'var(--text-3)']);
    bits.forEach(function (b) {
      meta.appendChild(Work.tag(b[0], b[1]));
    });
    meta.style.display = 'flex';
  }

  function paintFiles(files) {
    filesWrap.replaceChildren();
    if (!files || !files.length) return;
    filesWrap.appendChild(Work.sectionLabel(tt('wArtifacts') + '（' + files.length + '）'));
    const g = Work.el('div', 'display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px;');
    files.slice(0, 24).forEach(function (f) {
      const box = Work.el('div', 'padding: 10px; background: var(--accent-soft); border-radius: 12px;'
        + ' display: flex; flex-direction: column; gap: 7px; min-width: 0;');
      if (f.isImage && f.dataUrl) {
        const img = document.createElement('img');
        img.src = f.dataUrl;
        img.style.cssText = 'width: 100%; border-radius: 8px; background: #fff; display: block;';
        img.alt = f.name;
        box.appendChild(img);
      } else if (f.isImage) {
        const ph = Work.el('div', 'height: 90px; border-radius: 8px; background: var(--surface-2);'
          + ' display: flex; align-items: center; justify-content: center; color: var(--text-3); font-size: 11px;', tt('wImgLarge'));
        box.appendChild(ph);
      }
      const nm = Work.el('div', 'color: var(--text-1); font-size: 11.5px; font-family: var(--mono);'
        + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', f.name);
      nm.title = f.relPath;
      box.appendChild(nm);
      box.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px;', Work.fmtBytes(f.size)));
      const dl = Work.smallBtn(f.isImage ? tt('wOpen') : tt('wDownload'), function () {
        Work.api.blob('/api/work/sandbox/file?scope=' + encodeURIComponent(f.scope || 'global') + '&path=' + encodeURIComponent(f.relPath))
          .then(function (url) { window.open(url, '_blank'); setTimeout(function () { URL.revokeObjectURL(url); }, 60000); })
          .catch(function (e) { Work.toast(e.message); });
      });
      box.appendChild(dl);
      g.appendChild(box);
    });
    filesWrap.appendChild(g);
  }

  function runNow() {
    if (s.running) return;
    const code = editor.input.value;
    if (!code.trim()) { Work.toast(tt('wEmptyCode')); return; }
    s.output = '';
    out.textContent = tt('wOutQueued');
    setRunning(true);
    paintResult(null);
    filesWrap.replaceChildren();
    s._run = Work.api.sse('/api/work/sandbox/exec', { scopeId: 'global', lang: s.lang, code: code }, {
      onEvent: function (evt, data) {
        if (evt === 'stdout' || evt === 'stderr') {
          const tag = evt === 'stderr' ? '[stderr] ' : '';
          s.output = (s.output || '') + tag + (data.delta || '');
          /* DOM 防膨胀：只保留最近 200KB 文本 */
          if (s.output.length > 204800) s.output = s.output.slice(-204800);
          out.textContent = s.output;
          out.scrollTop = out.scrollHeight;
        } else if (evt === 'end') {
          const r = data.result || {};
          s.result = r;
          s.output = (s.output || '') + (r.stdout || '') + (r.stderr ? '\n[stderr]\n' + r.stderr : '');
          if (r.timedOut) s.output += '\n[' + tt('wResTimeout') + ']';
          if (r.blocked) s.output += '\n[' + tt('wResBlocked') + '：' + (r.blockReason || '') + ']';
          out.textContent = s.output || tt('wOutEmpty');
          out.scrollTop = out.scrollHeight;
          paintResult(r);
          paintFiles(r.files || []);
        } else if (evt === 'error') {
          s.output = (s.output || '') + '\n[error] ' + (data.message || '');
          out.textContent = s.output;
        }
      },
      onClose: function () { setRunning(false); },
      onAbort: function () { setRunning(false); s.output += '\n[' + tt('wAborted') + ']'; out.textContent = s.output; },
      onError: function (e) {
        setRunning(false);
        s.output = (s.output || '') + '\n[error] ' + e.message;
        out.textContent = s.output;
      }
    });
  }

  c._paintFiles = paintFiles;
  body.appendChild(c);
  return c;
}

function buildSandboxPage() {
  const shell = Work.pageShell({ wide: true });
  shell.bar.appendChild(Work.smallBtn(tt('wResetWs'), function () {
    Work.confirm(tt('wResetWsConfirm'), function () {
      Work.api.fetch('/api/work/sandbox/reset', { method: 'POST', body: { scopeId: 'global' } })
        .then(function () { Work.toast(tt('wResetDone')); WorkState.sandbox.files = null; })
        .catch(function (e) { Work.toast(e.message); });
    });
  }, { danger: true }));

  const holder = Work.el('div', 'display: flex; flex-direction: column; gap: 14px;');
  shell.body.appendChild(holder);

  function renderLoaded() {
    holder.replaceChildren();
    /* 能力边界：安全关键信息保留可见，但用中性面板（非高饱和警告框） */
    holder.appendChild(Work.noticeBox(tt('wSandboxBoundaryTitle'), tt('wSandboxBoundaryBody')));

    const two = Work.el('div', 'display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap;');
    const left = Work.el('div', 'flex: 0 1 380px; min-width: 320px; display: flex; flex-direction: column; gap: 14px;');
    const right = Work.el('div', 'flex: 1 1 520px; min-width: 420px; display: flex; flex-direction: column; gap: 14px;');
    two.appendChild(left);
    two.appendChild(right);
    holder.appendChild(two);

    runtimeCard(left);
    const pol = Work.card({});
    pol.appendChild(Work.sectionLabel(tt('wPolicy')));
    sandboxPolicyEditor(pol);
    left.appendChild(pol);

    consoleCard(right);
  }

  if (!Work.api.available()) {
    holder.appendChild(noBackendCard());
  } else {
    Work.store.ready().then(renderLoaded).catch(function (e) {
      holder.replaceChildren();
      holder.appendChild(Work.noticeBox(tt('wErrLoadFail'), e.message, 'warn'));
    });
  }

  return { node: shell.root, title: tt('wSandbox'), desc: tt('wSandboxDesc'), wide: true };
}

Work.pages.sandbox = buildSandboxPage;
