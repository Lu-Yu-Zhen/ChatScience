/* ==================================================================
   50-notebook.js · 笔记本页（Jupyter Notebook 形式，wide 双栏）
   - 笔记本由单元格（markdown / code）组成：增删、排序、逐格编辑、MD 预览
   - 归属两级：项目笔记本（proj:<id>）/ 单条对话笔记本（conv:<id>）/ 独立
   - 数据与 Agent 的 note_write 工具共用 app/data/notes/：
     Agent 只写 content 时，后端会把新内容追加为 markdown 单元格
   ================================================================== */

function buildNotebookPage() {
  const shell = Work.pageShell({ wide: true });
  shell.bar.appendChild(Work.pillBtn(tt('wNoteNew'), Work.ICONS.plus, function () { NoteUI.create(); }, { primary: true }));
  const holder = Work.el('div', 'display: flex; flex-direction: column; gap: 14px;');
  shell.body.appendChild(holder);

  if (!Work.api.available()) { holder.appendChild(noBackendCard()); return { node: shell.root, title: tt('wNotebook'), desc: tt('wNotebookDesc'), wide: true }; }

  Work.store.ready().then(function () { return Work.api.fetch('/api/work/notes'); }).then(function (d) {
    holder.replaceChildren();
    NoteUI.render(holder, (d && d.notes) || []);
  }).catch(function (e) {
    holder.replaceChildren();
    holder.appendChild(Work.noticeBox(tt('wErrLoadFail'), e.message, 'warn'));
  });

  return { node: shell.root, title: tt('wNotebook'), desc: tt('wNotebookDesc'), wide: true };
}

const NoteUI = {
  currentId: null,
  cells: [],            /* 当前笔记本的单元格（编辑态） */

  scopeLabel: function (n) {
    const sk = n.scopeKey || '';
    if (sk.indexOf('proj:') === 0) {
      const p = (window.CS_WORK && window.CS_WORK.state && window.CS_WORK.state.projects) || [];
      const hit = p.find(function (x) { return x.id === sk.slice(5); });
      return hit ? (hit.name || '项目') : '项目';
    }
    if (sk.indexOf('conv:') === 0) return '对话';
    return '';
  },

  cellsOf: function (n) {
    if (Array.isArray(n.cells) && n.cells.length) return n.cells;
    const src = n.content || '';
    if (!src) return [];
    /* 旧笔记（纯 content）按空行分段降级为 markdown 单元格 */
    return src.split(/\n{2,}/).filter(function (s) { return s.trim(); }).map(function (s, i) {
      return { id: 'legacy' + i, type: 'markdown', source: s };
    });
  },

  render: function (holder, notes) {
    const wrap = Work.el('div', 'display: flex; gap: 14px; align-items: flex-start; min-height: 420px;');

    /* ---- 左列表（按归属分组） ---- */
    const left = Work.el('div', 'flex: 0 0 280px; display: flex; flex-direction: column; gap: 8px;');
    left.appendChild(Work.sectionLabel(tt('wNoteList') + '（' + notes.length + '）'));
    const groups = [
      { key: 'proj', label: tt('nbGroupProject'), items: notes.filter(function (n) { return (n.scopeKey || '').indexOf('proj:') === 0; }) },
      { key: 'conv', label: tt('nbGroupConv'), items: notes.filter(function (n) { return (n.scopeKey || '').indexOf('conv:') === 0; }) },
      { key: 'none', label: tt('nbGroupStandalone'), items: notes.filter(function (n) { return !(n.scopeKey || ''); }) }
    ];
    groups.forEach(function (g) {
      if (!g.items.length) return;
      left.appendChild(Work.sectionLabel(g.label));
      const list = Work.el('div', 'display: flex; flex-direction: column; gap: 6px; max-height: 30vh; overflow-y: auto; margin-bottom: 6px;');
      g.items.forEach(function (n) {
        const row = Work.el('div', 'padding: 9px 11px; background: var(--accent-soft); border-radius: 10px;'
          + ' cursor: pointer; display: flex; flex-direction: column; gap: 3px;'
          + (NoteUI.currentId === n.id ? ' outline: 1px solid var(--accent-text);' : ''));
        const head = Work.el('div', 'display: flex; align-items: center; gap: 6px;');
        head.appendChild(Work.el('div', 'flex: 1 1 0; min-width: 0; color: var(--text-1); font-size: 12.5px; font-weight: 600;'
          + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', n.title || tt('wNoteUntitled')));
        if (n.source === 'agent') head.appendChild(Work.tag('Agent', '#16A34A', 'rgba(22,163,74,0.10)'));
        row.appendChild(head);
        const sub = Work.el('div', 'color: var(--text-3); font-size: 10.5px; display: flex; gap: 6px; align-items: center;');
        sub.appendChild(Work.el('div', '', Work.fmtTime(n.updatedAt)));
        sub.appendChild(Work.el('div', '', NoteUI.cellsOf(n).length + ' cells'));
        const sl = NoteUI.scopeLabel(n);
        if (sl) sub.appendChild(Work.el('div', '', sl));
        row.appendChild(sub);
        row.addEventListener('click', function () { NoteUI.open(n); });
        list.appendChild(row);
      });
      left.appendChild(list);
    });
    wrap.appendChild(left);

    /* ---- 右侧：Jupyter 笔记本视图 ---- */
    const right = Work.el('div', 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 10px;');
    const cur = notes.find(function (n) { return n.id === NoteUI.currentId; });
    if (cur) right.appendChild(NoteUI.notebookView(cur));
    else right.appendChild(Work.emptyState(tt('wNotePick'), Work.ICONS.book));
    wrap.appendChild(right);
    holder.appendChild(wrap);
  },

  /* ---- Jupyter 笔记本视图：头部（标题/保存/加格） + 单元格栈 ---- */
  notebookView: function (n) {
    NoteUI.cells = NoteUI.cellsOf(n).map(function (c) {
      return { id: c.id || ('c' + Math.random().toString(36).slice(2, 8)), type: c.type === 'code' ? 'code' : 'markdown', source: c.source || '' };
    });
    const root = Work.el('div', 'display: flex; flex-direction: column; gap: 10px; min-width: 0;');

    const head = Work.card({ gap: '10px' });
    const headRow = Work.el('div', 'display: flex; align-items: center; gap: 8px;');
    const fTitle = Work.field({ value: n.title || '' });
    fTitle.input.style.flex = '1 1 0';
    headRow.appendChild(fTitle);
    const scopeTag = NoteUI.scopeLabel(n);
    if (scopeTag) headRow.appendChild(Work.tag(scopeTag, '#2563EB', 'rgba(37,99,235,0.10)'));
    headRow.appendChild(Work.smallBtn(tt('saved2'), function () { NoteUI.save(n, fTitle.input.value); }, { primary: true }));
    headRow.appendChild(Work.smallBtn(tt('nbAddMd'), function () { NoteUI.cells.push({ id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type: 'markdown', source: '' }); NoteUI.rerenderStack(n); }));
    headRow.appendChild(Work.smallBtn(tt('nbAddCode'), function () { NoteUI.cells.push({ id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type: 'code', source: '' }); NoteUI.rerenderStack(n); }));
    head.appendChild(headRow);
    root.appendChild(head);

    const stack = Work.el('div', 'display: flex; flex-direction: column; gap: 10px; margin-top: 2px;');
    NoteUI._stackNode = stack;
    NoteUI.renderStack(stack, n);
    root.appendChild(stack);
    return root;
  },

  renderStack: function (stack, n) {
    stack.replaceChildren();
    if (!NoteUI.cells.length) {
      const empty = Work.el('div', 'padding: 26px; text-align: center; color: var(--text-3); font-size: 12.5px;'
        + ' border: 1px dashed var(--border); border-radius: 12px;');
      empty.textContent = tt('nbEmpty');
      stack.appendChild(empty);
      return;
    }
    NoteUI.cells.forEach(function (cell, i) {
      stack.appendChild(NoteUI.cellRow(cell, i, stack));
    });
  },

  rerenderStack: function () {
    if (NoteUI._stackNode) NoteUI.renderStack(NoteUI._stackNode);
  },

  cellRow: function (cell, i, stack) {
    const isCode = cell.type === 'code';
    const row = Work.el('div', 'display: flex; gap: 8px; align-items: stretch;');

    /* 左侧竖排工具（Jupyter 风格） */
    const gutter = Work.el('div', 'flex: 0 0 30px; display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 6px;');
    const typeBtn = Work.el('div', 'padding: 2px 6px; border-radius: 6px; font-size: 9.5px; font-weight: 700; cursor: pointer;'
      + ' background: ' + (isCode ? 'rgba(37,99,235,0.10)' : 'rgba(22,163,74,0.10)') + '; color: ' + (isCode ? '#2563EB' : '#16A34A') + ';');
    typeBtn.textContent = isCode ? 'CODE' : 'MD';
    typeBtn.title = tt('nbToggleType');
    typeBtn.addEventListener('click', function () { cell.type = isCode ? 'markdown' : 'code'; NoteUI.renderStack(stack); });
    gutter.appendChild(typeBtn);
    gutter.appendChild(NoteUI.miniIcon('↑', tt('nbMoveUp'), function () { if (i > 0) { NoteUI.cells.splice(i, 1); NoteUI.cells.splice(i - 1, 0, cell); NoteUI.renderStack(stack); } }));
    gutter.appendChild(NoteUI.miniIcon('↓', tt('nbMoveDown'), function () { if (i < NoteUI.cells.length - 1) { NoteUI.cells.splice(i, 1); NoteUI.cells.splice(i + 1, 0, cell); NoteUI.renderStack(stack); } }));
    gutter.appendChild(NoteUI.miniIcon('×', tt('del'), function () { NoteUI.cells.splice(i, 1); NoteUI.renderStack(stack); }));
    row.appendChild(gutter);

    /* 主体：In [n] 提示 + 编辑器 + MD 预览切换 */
    const main = Work.el('div', 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 0;');
    if (isCode) main.appendChild(Work.el('div', 'font-size: 10.5px; color: var(--text-3); font-weight: 700; padding: 2px 2px 4px 2px;', 'In [' + (i + 1) + ']:'));
    const ta = document.createElement('textarea');
    ta.value = cell.source;
    ta.rows = Math.min(18, Math.max(3, cell.source.split('\n').length + 1));
    ta.style.cssText = 'width: 100%; box-sizing: border-box; border: 1px solid var(--border-soft); border-radius: 10px;'
      + ' outline: none; background: ' + (isCode ? 'var(--surface-2)' : 'var(--surface)') + '; resize: vertical;'
      + ' color: var(--text-1); font-size: 12.5px; line-height: 20px; padding: 9px 11px;'
      + ' font-family: ' + (isCode ? '"Consolas", "JetBrains Mono", monospace' : 'inherit') + ';';
    ta.addEventListener('input', function () { cell.source = ta.value; ta.rows = Math.min(18, Math.max(3, ta.value.split('\n').length + 1)); });
    main.appendChild(ta);
    if (!isCode) {
      const prevBtn = Work.smallBtn(tt('wNotePreview'), function () {
        let pv = main.querySelector('.nb-preview');
        if (pv) { pv.remove(); prevBtn.textContent = tt('wNotePreview'); return; }
        prevBtn.textContent = tt('saved2');
        pv = Work.el('div', 'nb-preview; border: 1px solid var(--border-soft); border-radius: 10px; padding: 10px 12px; background: var(--surface); max-height: 40vh; overflow-y: auto; margin-top: 6px;');
        if (typeof window.marked !== 'undefined' && typeof window.DOMPurify !== 'undefined') {
          const rendered = Work.el('div');
          rendered.className = 'ai-text md-body';
          rendered.innerHTML = window.DOMPurify.sanitize(window.marked.parse(cell.source || ''));
          pv.appendChild(rendered);
        } else {
          pv.appendChild(Work.hint(tt('wOfflineMd'), 'warn'));
          pv.appendChild(Work.preBlock(cell.source, { dark: false, maxHeight: '36vh' }));
        }
        main.appendChild(pv);
      });
      prevBtn.style.cssText += 'align-self: flex-start; margin-top: 6px;';
      main.appendChild(prevBtn);
    }
    row.appendChild(main);
    return row;
  },

  miniIcon: function (ch, title, fn) {
    const b = Work.el('div', 'width: 22px; height: 22px; border-radius: 7px; display: flex; justify-content: center; align-items: center;'
      + ' color: var(--text-3); cursor: pointer; font-size: 13px; transition: background-color 0.15s ease;');
    b.textContent = ch;
    b.title = title;
    b.addEventListener('click', fn);
    return b;
  },

  save: function (n, title) {
    const cells = NoteUI.cells.map(function (c) { return { id: c.id, type: c.type, source: c.source }; });
    const content = cells.map(function (c) { return c.source; }).join('\n\n');
    Work.api.fetch('/api/work/notes', {
      method: 'POST',
      body: { id: n.id, title: (title || '').trim() || tt('wNoteUntitled'), content: content, source: n.source, scopeKey: n.scopeKey || null, cells: cells }
    }).then(function () { Work.toast(tt('saved2')); Work.rerender(); })
      .catch(function (e) { Work.toast(e.message); });
  },

  open: function (n) {
    if (n) { NoteUI.currentId = n.id; Work.rerender(); }
  },

  /* 新建：选择归属（项目笔记本 / 当前对话笔记本 / 独立） */
  create: function () {
    const opts = [{ key: '', label: tt('nbStandalone') }];
    const conv = (typeof currentConv === 'function') ? currentConv() : null;
    if (conv && conv.id && String(conv.id).indexOf('draft') !== 0) {
      opts.push({ key: 'conv:' + conv.id, label: tt('nbForConv') + (conv.title || '') });
    }
    const projList = (window.CS_WORK && window.CS_WORK.state && window.CS_WORK.state.projects) || [];
    projList.forEach(function (p) { opts.push({ key: 'proj:' + p.id, label: tt('nbForProj') + (p.name || '') }); });

    const m = Work.modal({ title: tt('wNoteNew'), width: 400 });
    const box = Work.el('div', 'display: flex; flex-direction: column; gap: 6px;');
    opts.forEach(function (o) {
      const row = Work.el('div', 'padding: 9px 11px; border-radius: 10px; cursor: pointer; font-size: 12.5px; color: var(--text-1);');
      row.textContent = o.label;
      row.addEventListener('click', function () {
        Work.api.fetch('/api/work/notes', {
          method: 'POST',
          body: { title: o.label || tt('wNoteUntitled'), content: '', source: 'user', scopeKey: o.key || null, cells: [] }
        }).then(function (rec) { NoteUI.currentId = rec.id; Work.rerender(); })
          .catch(function (e) { Work.toast(e.message); });
      });
      box.appendChild(row);
    });
    m.body.appendChild(box);
  }
};

Work.pages.notebook = buildNotebookPage;
