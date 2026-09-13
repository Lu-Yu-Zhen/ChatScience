// @ts-nocheck
/* 前端全局脚本层：按字节精确迁移自 JS（见 app/TypeScript迁移说明.md），
   本文件关闭逐行类型检查；环境与第三方库声明见 ambient.d.ts。 */
/* ==================================================================
   40-mcp.js · 连接器页
   外部 MCP 服务器由 Qoder Agent SDK 原生承载（stdio / http 配置直接透传），
   本页只做配置管理与透传校验；in-process 科研工具作为"内建"分组展示。
   连接/工具发现由 SDK 在会话启动时完成（mcpServerStatus），不在此处保活。
   ================================================================== */

const SCI_TOOLS = [
  { name: 'arxiv_search', desc: 'arXiv 论文检索（官方 API，免 key）' },
  { name: 'fetch_url', desc: '抓取网页正文，核对检索结果原文' },
  { name: 'web_search', desc: '联网检索（无 key 端点，已知脆弱）' },
  { name: 'kb_search', desc: '本地知识库 BM25 词法检索' },
  { name: 'note_write', desc: '写入实验笔记（与笔记本页共用）' },
  { name: 'run_code', desc: '独立沙箱进程执行代码（比 Bash 更隔离）' }
];

const MCP_TEMPLATES = [
  { key: 'filesystem', label: 'Filesystem（本地文件）', type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '.'], note: '需本机可运行 npx；cwd 参数建议填沙箱目录' },
  { key: 'fetch', label: 'Fetch（网页抓取）', type: 'stdio', command: 'uvx', args: ['mcp-server-fetch'], note: '需本机安装 uv' },
  { key: 'memory', label: 'Memory（知识图谱记忆）', type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'], note: '需本机可运行 npx' }
];

function parseJsonField(raw, fallback) {
  const s = String(raw || '').trim();
  if (!s) return fallback;
  try { return JSON.parse(s); } catch (e) { return { __parseError: e.message }; }
}

function buildMcpPage() {
  const shell = Work.pageShell({ wide: false });
  shell.bar.appendChild(Work.pillBtn(tt('wMcpAdd'), Work.ICONS.plus, function () { mcpEditModal(null, null); }, { primary: true }));
  const holder = Work.el('div', 'display: flex; flex-direction: column; gap: 14px;');
  shell.body.appendChild(holder);

  if (!Work.api.available()) { holder.appendChild(noBackendCard()); return { node: shell.root, title: tt('wMcp'), desc: tt('wMcpDesc'), wide: false }; }

  Promise.all([
    Work.store.ready(),
    Work.api.fetch('/api/work/mcp/servers')
  ]).then(function (all) {
    holder.replaceChildren();
    renderMcp(holder, (all[1] && all[1].servers) || []);
  }).catch(function (e) {
    holder.replaceChildren();
    holder.appendChild(Work.noticeBox(tt('wErrLoadFail'), e.message, 'warn'));
  });

  return { node: shell.root, title: tt('wMcp'), desc: tt('wMcpDesc'), wide: false };
}

function renderMcp(holder, servers) {
  /* 说明收敛到页头副标题 */

  /* 内建科研工具（in-process，随应用分发，始终可用） */
  const sciCard = Work.card({});
  sciCard.appendChild(Work.sectionLabel(tt('wMcpScience')));
  const sciGrid = Work.el('div', 'display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px;');
  SCI_TOOLS.forEach(function (t) {
    const box = Work.el('div', 'padding: 10px 12px; background: var(--accent-soft); border-radius: 10px; display: flex; flex-direction: column; gap: 3px;');
    box.appendChild(Work.el('div', 'color: var(--text-1); font-size: 12px; font-weight: 600; font-family: var(--mono);', t.name));
    box.appendChild(Work.el('div', 'color: var(--text-3); font-size: 11px; line-height: 16px;', t.desc));
    sciGrid.appendChild(box);
  });
  sciCard.appendChild(sciGrid);
  holder.appendChild(sciCard);

  /* 外部服务器列表 */
  holder.appendChild(Work.sectionLabel(tt('wMcpExternal') + '（' + servers.length + '）'));
  if (!servers.length) {
    holder.appendChild(Work.emptyState(tt('wMcpEmpty'), Work.ICONS.plug));
    const tplRow = Work.el('div', 'display: flex; gap: 8px; flex-wrap: wrap;');
    MCP_TEMPLATES.forEach(function (t) {
      tplRow.appendChild(Work.smallBtn(t.label, function () { mcpEditModal(null, t); }));
    });
    holder.appendChild(tplRow);
    return;
  }
  const list = Work.el('div', 'display: flex; flex-direction: column; gap: 6px;');
  servers.forEach(function (s) {
    /* 单行列表（IDE 设置风格）：状态点 + 名称 + 类型 + 目标 + 开关 + 操作 */
    const row = Work.el('div', 'display: flex; align-items: center; gap: 10px; padding: 10px 12px;'
      + ' background: var(--surface); border: 1px solid var(--border); border-radius: 10px;'
      + ' transition: border-color 0.15s ease;');
    row.addEventListener('mouseenter', function () { row.style.borderColor = '#94A3B8'; });
    row.addEventListener('mouseleave', function () { row.style.borderColor = 'var(--border)'; });
    row.appendChild(Work.statusDot(s.enabled === false ? 'idle' : 'ok'));
    row.appendChild(Work.el('div', 'color: var(--text-1); font-size: 12.5px; font-weight: 600; font-family: var(--mono); flex-shrink: 0;', s.key));
    row.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px; flex-shrink: 0;',
      s.config && s.config.type === 'http' ? 'HTTP' : 'stdio'));
    const target = s.config && s.config.type === 'http'
      ? String(s.config.url || '')
      : [s.config && s.config.command].concat(s.config && s.config.args || []).join(' ');
    row.appendChild(Work.el('div', 'flex: 1 1 0; min-width: 0; color: var(--text-3); font-size: 11px; font-family: var(--mono);'
      + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', target || '—'));
    row.appendChild(Work.toggle(function () { return s.enabled !== false; }, function (v) {
      s.enabled = v;
      saveServers(servers);
    }));
    row.appendChild(Work.smallBtn(tt('wEdit'), function () { mcpEditModal(s, null); }));
    row.appendChild(Work.smallBtn(tt('del'), function () {
      Work.confirm(tt('wMcpDelConfirm'), function () {
        const idx = servers.indexOf(s);
        if (idx > -1) servers.splice(idx, 1);
        saveServers(servers, true);
      });
    }, { danger: true }));
    list.appendChild(row);
  });
  holder.appendChild(list);
}

function saveServers(servers, rerenderAfter) {
  Work.api.fetch('/api/work/mcp/servers', { method: 'PUT', body: { servers: servers } })
    .then(function () {
      Work.toast(tt('saved2'));
      if (rerenderAfter) Work.rerender();
    })
    .catch(function (e) { Work.toast(e.message); });
}

function mcpEditModal(existing, template) {
  const src = existing || (template ? {
    key: template.key, config: { type: template.type, command: template.command, args: template.args }
  } : { key: '', config: { type: 'stdio' } });
  const isNew = !existing;
  const state = {
    key: src.key || '',
    type: (src.config && src.config.type) === 'http' ? 'http' : 'stdio',
    command: (src.config && src.config.command) || '',
    args: JSON.stringify((src.config && src.config.args) || [], null, 0) === '[]' ? '' : JSON.stringify((src.config && src.config.args) || []),
    env: (src.config && src.config.env) ? JSON.stringify(src.config.env, null, 0) : '',
    cwd: (src.config && src.config.cwd) || '',
    url: (src.config && src.config.url) || '',
    headers: (src.config && src.config.headers) ? JSON.stringify(src.config.headers, null, 0) : ''
  };

  const m = Work.modal({
    title: isNew ? tt('wMcpAdd') : (tt('wEdit') + ' · ' + src.key),
    width: 600, okText: tt('saved2'),
    onOk: function (api) {
      /* 组装并校验（配置结构与 SDK McpServerConfig 对齐） */
      const key = state.key.trim();
      if (!/^[a-zA-Z0-9_-]{1,40}$/.test(key)) { Work.toast(tt('wMcpKeyBad')); return; }
      const conf = { type: state.type };
      if (state.type === 'stdio') {
        if (!state.command.trim()) { Work.toast(tt('wMcpNeedCmd')); return; }
        conf.command = state.command.trim();
        const args = parseJsonField(state.args, []);
        if (args && args.__parseError) { Work.toast(tt('wMcpJsonBad') + ' args: ' + args.__parseError); return; }
        if (args && args.length) conf.args = args;
        const env = parseJsonField(state.env, null);
        if (env && env.__parseError) { Work.toast(tt('wMcpJsonBad') + ' env: ' + env.__parseError); return; }
        if (env) conf.env = env;
        if (state.cwd.trim()) conf.cwd = state.cwd.trim();
      } else {
        if (!/^https?:\/\//i.test(state.url.trim())) { Work.toast(tt('wMcpNeedUrl')); return; }
        conf.url = state.url.trim();
        const headers = parseJsonField(state.headers, null);
        if (headers && headers.__parseError) { Work.toast(tt('wMcpJsonBad') + ' headers: ' + headers.__parseError); return; }
        if (headers) conf.headers = headers;
      }
      /* 透传校验说明：连接由 SDK 在会话启动时完成，本页不保活；错误会在 run_start 的 mcpServers 状态里可见 */
      Work.api.fetch('/api/work/mcp/servers').then(function (d) {
        const list = (d && d.servers) || [];
        const hit = list.find(function (x) { return x.key === key; });
        const rec = { key: key, enabled: existing ? (existing.enabled !== false) : true, config: conf };
        if (hit) { const i = list.indexOf(hit); list[i] = rec; } else list.push(rec);
        return Work.api.fetch('/api/work/mcp/servers', { method: 'PUT', body: { servers: list } });
      }).then(function () { api.close(); Work.toast(tt('saved2')); Work.rerender(); })
        .catch(function (e) { Work.toast(e.message); });
    }
  });

  if (isNew) {
    const fKey = Work.field({ label: tt('wMcpKey'), value: state.key, placeholder: 'my-server', hint: tt('wMcpKeyHint') });
    fKey.input.addEventListener('input', function () { state.key = fKey.input.value; });
    m.body.appendChild(fKey);
    m.body.appendChild(Work.row(tt('wMcpType'), Work.seg([
      { value: 'stdio', label: 'stdio' }, { value: 'http', label: 'HTTP' }
    ], function () { return state.type; }, function (v) {
      state.type = v;
      m.body.replaceChildren();
      buildBody(m, state, isNew);
    })));
  } else if (template) {
    /* 模板也允许改 key */
    const fKey = Work.field({ label: tt('wMcpKey'), value: state.key });
    fKey.input.addEventListener('input', function () { state.key = fKey.input.value; });
    m.body.appendChild(fKey);
  }
  buildBody(m, state, isNew && !template);
  if (template) m.body.appendChild(Work.hint(tt('wMcpTplNote') + '：' + template.note, 'warn'));
}

function buildBody(m, state, editableType) {
  if (state.type === 'stdio') {
    const fCmd = Work.field({ label: 'command', value: state.command, placeholder: 'npx / uvx / python', inputStyle: 'font-family: var(--mono);' });
    fCmd.input.addEventListener('input', function () { state.command = fCmd.input.value; });
    m.body.appendChild(fCmd);
    const fArgs = Work.field({ label: 'args（JSON 数组）', value: state.args, placeholder: '["-y","@modelcontextprotocol/server-filesystem","/path"]', multiline: true, rows: 2, mono: true });
    fArgs.input.addEventListener('input', function () { state.args = fArgs.input.value; });
    m.body.appendChild(fArgs);
    const fEnv = Work.field({ label: 'env（JSON 对象，可选）', value: state.env, placeholder: '{"API_TOKEN":"..."}', multiline: true, rows: 2, mono: true });
    fEnv.input.addEventListener('input', function () { state.env = fEnv.input.value; });
    m.body.appendChild(fEnv);
    const fCwd = Work.field({ label: 'cwd（可选）', value: state.cwd, placeholder: '工作目录', inputStyle: 'font-family: var(--mono);' });
    fCwd.input.addEventListener('input', function () { state.cwd = fCwd.input.value; });
    m.body.appendChild(fCwd);
  } else {
    const fUrl = Work.field({ label: 'URL', value: state.url, placeholder: 'https://mcp.example.com/mcp', inputStyle: 'font-family: var(--mono);' });
    fUrl.input.addEventListener('input', function () { state.url = fUrl.input.value; });
    m.body.appendChild(fUrl);
    const fHeaders = Work.field({ label: 'headers（JSON 对象，可选）', value: state.headers, placeholder: '{"Authorization":"Bearer ..."}', multiline: true, rows: 2, mono: true });
    fHeaders.input.addEventListener('input', function () { state.headers = fHeaders.input.value; });
    m.body.appendChild(fHeaders);
  }
  m.body.appendChild(Work.hint(tt('wMcpPermHint')));
}

Work.pages.mcp = buildMcpPage;
