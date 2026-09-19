// @ts-nocheck
/* 前端全局脚本层：按字节精确迁移自 JS（见 app/TypeScript迁移说明.md），
   本文件关闭逐行类型检查；环境与第三方库声明见 ambient.d.ts。 */
/* ==================================================================
   35-skills.js · 技能与插件页
   技能以 SDK local plugin 形态承载（app/data/skills-plugin/skills/<slug>/SKILL.md），
   启用状态存 work.json 的 skills 段；qoder.js 在每次会话按白名单传 options.skills。
   ================================================================== */

function buildSkillsPage() {
  const shell = Work.pageShell({ wide: false });
  /* 双选项卡：技能 / 插件（2026-09-16）。tab 状态存 WorkState.skillsTab（默认 skills），
     切换经 Work.rerender() 整页重挂——设置页 section 与 Work 侧栏两个挂载点共用同一构建器。
     技能另有「表格 / 列表」双视图（WorkState.skillsView，默认表格=卡片网格）；
     技能与插件均支持本地上传（zip 压缩包 / 文件夹，见 SkillUpload）。 */
  const curTab = WorkState.skillsTab === 'plugins' ? 'plugins' : 'skills';
  shell.bar.appendChild(Work.el('div', 'flex: 1 1 0;'));
  [['skills', 'wTabSkills'], ['plugins', 'wTabPlugins']].forEach(function (t) {
    const active = t[0] === curTab;
    const pill = Work.el('div', 'height: 34px; padding: 0 16px; display: flex; align-items: center; cursor: pointer;'
      + ' border-radius: 999px; font-size: 12.5px; font-weight: 600;'
      + (active
        ? ' background: var(--btn-primary-bg); color: #FFFFFF;'
        : ' background: var(--surface); color: var(--text-2); border: 1px solid var(--border);'));
    pill.className = active ? 'btn btn-primary' : 'btn';
    pill.textContent = tt(t[1]);
    pill.addEventListener('click', function () {
      if (WorkState.skillsTab === t[0]) return;
      WorkState.skillsTab = t[0];
      Work.rerender();
    });
    shell.bar.appendChild(pill);
  });
  if (curTab === 'skills') {
    /* 视图切换（表格 / 列表）：两个圆形图标钮，选中态随主题主色 */
    const curView = WorkState.skillsView === 'list' ? 'list' : 'table';
    const mkViewBtn = function (view, iconPath, label) {
      const b = Work.el('div', 'width: 34px; height: 34px; border-radius: 999px; display: flex; justify-content: center; align-items: center; cursor: pointer;'
        + (curView === view
          ? ' background: var(--btn-primary-bg); color: #FFFFFF;'
          : ' background: var(--surface); color: var(--text-2); border: 1px solid var(--border);'));
      b.title = label;
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px">' + iconPath + '</svg>';
      b.addEventListener('click', function () {
        if (curView === view) return;
        WorkState.skillsView = view;
        Work.rerender();
      });
      return b;
    };
    shell.bar.appendChild(mkViewBtn('table', Work.ICONS.grid, tt('wViewTable')));
    shell.bar.appendChild(mkViewBtn('list', Work.ICONS.listIcon, tt('wViewList')));
    shell.bar.appendChild(Work.pillBtn(tt('wUploadSkill'), Work.ICONS.upload, function () { SkillUpload.open('skill'); }, { primary: true }));
  } else {
    shell.bar.appendChild(Work.pillBtn(tt('wRefresh'), null, function () { Work.rerender(); }, {}));
    shell.bar.appendChild(Work.pillBtn(tt('wUploadPlugin'), Work.ICONS.upload, function () { SkillUpload.open('plugin'); }, { primary: true }));
  }
  const holder = Work.el('div', 'display: flex; flex-direction: column; gap: 14px;');
  shell.body.appendChild(holder);

  if (!Work.api.available()) { holder.appendChild(noBackendCard()); return { node: shell.root, title: tt('wSkills'), desc: tt('wSkillsDesc'), wide: false }; }

  Work.store.ready().then(function () {
    if (curTab === 'skills') {
      return Work.api.fetch('/api/work/skills').then(function (d) {
        renderSkills(holder, (d || {}).skills || [], (d || {}).states || {});
      });
    }
    return Work.api.fetch('/api/work/plugins').then(function (pl) {
      renderDomainPlugins(holder, (pl || {}).plugins || []);
    });
  }).catch(function (e) {
    holder.replaceChildren();
    holder.appendChild(Work.noticeBox(tt('wErrLoadFail'), e.message, 'warn'));
  });

  return { node: shell.root, title: tt('wSkills'), desc: tt('wSkillsDesc'), wide: false };
}

function renderSkills(holder, skills, states) {
  /* 说明收敛到页头副标题，页面顶部不再放大段警告框 */
  const bar = Work.el('div', 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap;');
  bar.appendChild(Work.el('div', 'color: var(--text-3); font-size: 11.5px; font-weight: 700;'
    + ' margin-right: 4px;', tt('wSkillCount') + ' ' + skills.length));
  holder.appendChild(bar);

  if (!skills.length) {
    holder.appendChild(Work.emptyState(tt('wSkillEmpty'), Work.ICONS.layers));
    return;
  }

  /* 双视图（2026-09-16 裁定 #2）：表格 = 卡片网格（原样式）；列表 = 紧凑行 */
  if (WorkState.skillsView === 'list') { renderSkillList(holder, skills, states); return; }
  renderSkillGrid(holder, skills, states);
}

/* 表格视图：卡片网格（原样式） */
function renderSkillGrid(holder, skills, states) {
  const grid = Work.grid({ cols: 3 });
  skills.forEach(function (s) {
    const on = !(states[s.slug] && states[s.slug].enabled === false);
    const card = Work.card({ gap: '8px', pad: '14px' });
    const head = Work.el('div', 'display: flex; align-items: flex-start; gap: 8px;');
    const col = Work.el('div', 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 4px;');
    const nameRow = Work.el('div', 'display: flex; align-items: center; gap: 7px;');
    nameRow.appendChild(Work.el('div', 'color: var(--text-1); font-size: 13.5px; font-weight: 700;'
      + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', s.name || s.slug));
    nameRow.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px; flex-shrink: 0;',
      s.builtin ? tt('wSkillBuiltin') : tt('wSkillCustom')));
    col.appendChild(nameRow);
    col.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px; font-family: var(--mono);', s.slug));
    col.appendChild(Work.el('div', 'color: var(--text-2); font-size: 11.5px; line-height: 17px;'
      + ' display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;', s.description || ''));
    head.appendChild(col);
    head.appendChild(Work.toggle(function () { return on; }, function (v) {
      states[s.slug] = Object.assign({}, states[s.slug], { enabled: v });
      Work.api.fetch('/api/work/skills/states', { method: 'PUT', body: states })
        .then(function () { Work.toast(tt('saved2')); })
        .catch(function (e) { Work.toast(e.message); });
    }));
    card.appendChild(head);

    const foot = Work.el('div', 'display: flex; gap: 8px; align-items: center; margin-top: 2px;');
    foot.appendChild(Work.smallBtn(tt('wSkillView'), function () { skillViewModal(s); }));
    if (!s.builtin) {
      foot.appendChild(Work.smallBtn(tt('wEdit'), function () { skillEditModal(s); }));
      foot.appendChild(Work.smallBtn(tt('del'), function () {
        Work.confirm(tt('wSkillDelConfirm'), function () {
          Work.api.fetch('/api/work/skills/delete', { method: 'POST', body: { slug: s.slug } })
            .then(function () { Work.rerender(); })
            .catch(function (e) { Work.toast(e.message); });
        });
      }, { danger: true }));
    }
    foot.appendChild(Work.el('div', 'flex: 1 1 0;'));
    foot.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px;', Work.fmtBytes(s.chars)));
    card.appendChild(foot);
    grid.appendChild(card);
  });
  holder.appendChild(grid);
}

/* 列表视图：紧凑行（名称/类型 · slug · 描述 · 开关 · 操作 · 体积） */
function renderSkillList(holder, skills, states) {
  const list = Work.el('div', 'display: flex; flex-direction: column; gap: 6px;');
  skills.forEach(function (s) {
    const on = !(states[s.slug] && states[s.slug].enabled === false);
    const row = Work.el('div', 'display: flex; align-items: center; gap: 10px; flex-wrap: wrap;'
      + ' padding: 9px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px;');
    const nameCol = Work.el('div', 'flex: 0 0 190px; min-width: 0; display: flex; flex-direction: column; gap: 1px;');
    const nameRow = Work.el('div', 'display: flex; align-items: center; gap: 6px; min-width: 0;');
    nameRow.appendChild(Work.el('div', 'color: var(--text-1); font-size: 12.5px; font-weight: 600;'
      + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', s.name || s.slug));
    nameRow.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10px; flex-shrink: 0;',
      s.builtin ? tt('wSkillBuiltin') : tt('wSkillCustom')));
    nameCol.appendChild(nameRow);
    nameCol.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10px; font-family: var(--mono);'
      + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', s.slug));
    row.appendChild(nameCol);
    row.appendChild(Work.el('div', 'flex: 1 1 160px; min-width: 0; color: var(--text-2); font-size: 11.5px;'
      + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', s.description || ''));
    const actions = Work.el('div', 'display: flex; align-items: center; gap: 8px; flex-shrink: 0;');
    actions.appendChild(Work.toggle(function () { return on; }, function (v) {
      states[s.slug] = Object.assign({}, states[s.slug], { enabled: v });
      Work.api.fetch('/api/work/skills/states', { method: 'PUT', body: states })
        .then(function () { Work.toast(tt('saved2')); })
        .catch(function (e) { Work.toast(e.message); });
    }));
    actions.appendChild(Work.smallBtn(tt('wSkillView'), function () { skillViewModal(s); }));
    if (!s.builtin) {
      actions.appendChild(Work.smallBtn(tt('wEdit'), function () { skillEditModal(s); }));
      actions.appendChild(Work.smallBtn(tt('del'), function () {
        Work.confirm(tt('wSkillDelConfirm'), function () {
          Work.api.fetch('/api/work/skills/delete', { method: 'POST', body: { slug: s.slug } })
            .then(function () { Work.rerender(); })
            .catch(function (e) { Work.toast(e.message); });
        });
      }, { danger: true }));
    }
    actions.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px;', Work.fmtBytes(s.chars)));
    row.appendChild(actions);
    list.appendChild(row);
  });
  holder.appendChild(list);
}

/* ---------------- 本地上传（2026-09-16 裁定 #5） ----------------
   技能：仅接受包含 SKILL.md 的 zip 压缩包或文件夹；插件：需含 .qoder-plugin/plugin.json
   或 agents/ skills/ commands/ .mcp.json 之一。zip 在浏览器端解析（EOCD + 中央目录 +
   DecompressionStream('deflate-raw')），解出文本条目后经既有 API 落盘：
   POST /api/work/skills/save（SKILL.md 正文）与 POST /api/work/plugins/save（整目录文件）。 */
const SkillUpload = {
  TEXT_EXT: /\.(md|markdown|json|txt|ya?ml|toml|csv|js|mjs|ts|py|sh|ini|cfg)$/i,
  ROOT_MAX: 50,
  open: function (kind) {
    const m = Work.modal({
      title: kind === 'plugin' ? tt('wUploadPlugin') : tt('wUploadSkill'),
      width: 480
    });
    m.body.appendChild(Work.hint(kind === 'plugin' ? tt('wUploadPluginHint') : tt('wUploadSkillHint')));
    const zipInput = document.createElement('input');
    zipInput.type = 'file';
    zipInput.id = 'skillUploadZip';
    zipInput.accept = '.zip,application/zip';
    zipInput.style.display = 'none';
    const dirInput = document.createElement('input');
    dirInput.type = 'file';
    dirInput.id = 'skillUploadDir';
    dirInput.setAttribute('webkitdirectory', '');
    dirInput.style.display = 'none';
    const row = Work.el('div', 'display: flex; gap: 8px; margin-top: 6px;');
    row.appendChild(Work.pillBtn(tt('wPickZip'), Work.ICONS.file, function () { zipInput.click(); }, { primary: true }));
    row.appendChild(Work.pillBtn(tt('wPickFolder'), Work.ICONS.folderUp, function () { dirInput.click(); }, {}));
    m.body.appendChild(row);
    m.body.appendChild(zipInput);
    m.body.appendChild(dirInput);
    zipInput.addEventListener('change', function () {
      const f = zipInput.files && zipInput.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const entries = SkillUpload.readZip(reader.result);
          SkillUpload.importEntries(entries, kind, m);
        } catch (e) { Work.toast(String(e && e.message ? e.message : e)); }
      };
      reader.readAsArrayBuffer(f);
      zipInput.value = '';
    });
    dirInput.addEventListener('change', function () {
      const files = Array.prototype.slice.call(dirInput.files || []);
      if (!files.length) return;
      SkillUpload._folderToEntries(files, function (entries) {
        SkillUpload.importEntries(entries, kind, m);
      });
      dirInput.value = '';
    });
  },
  /* zip → [{ path, text }]：只解文本类条目 */
  readZip: function (buf) {
    const u8 = new Uint8Array(buf);
    const dv = new DataView(buf);
    let eocd = -1;
    const min = Math.max(0, u8.length - 22 - 65536);
    for (let i = u8.length - 22; i >= min; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error(tt('wUploadBadZip'));
    const count = dv.getUint16(eocd + 10, true);
    let off = dv.getUint32(eocd + 16, true);
    const out = [];
    for (let i = 0; i < count && out.length < SkillUpload.ROOT_MAX; i++) {
      if (dv.getUint32(off, true) !== 0x02014b50) break;
      const method = dv.getUint16(off + 10, true);
      const compSize = dv.getUint32(off + 20, true);
      const nameLen = dv.getUint16(off + 28, true);
      const extraLen = dv.getUint16(off + 30, true);
      const cmtLen = dv.getUint16(off + 32, true);
      const lho = dv.getUint32(off + 42, true);
      const rawPath = new TextDecoder().decode(u8.subarray(off + 46, off + 46 + nameLen));
      /* 路径归一化：部分 Windows 打包工具（如 PowerShell Compress-Archive）写入反斜杠分隔符 */
      const path2 = rawPath.replace(/\\/g, '/');
      off += 46 + nameLen + extraLen + cmtLen;
      if (/\/$/.test(path2)) continue;
      if (!SkillUpload.TEXT_EXT.test(path2)) continue;
      if (compSize > 1024 * 1024) continue;
      if (method !== 0 && method !== 8) continue;
      if (dv.getUint32(lho, true) !== 0x04034b50) continue;
      const lnl = dv.getUint16(lho + 26, true);
      const lel = dv.getUint16(lho + 28, true);
      const start = lho + 30 + lnl + lel;
      out.push({ path: path2, data: u8.subarray(start, start + compSize), method: method });
    }
    return out;
  },
  /* 文件夹 → [{ path, text }]（按扩展名过滤文本文件） */
  _folderToEntries: function (files, done) {
    const picked = files.filter(function (f) {
      const p = f.webkitRelativePath || f.name;
      return SkillUpload.TEXT_EXT.test(p) && f.size <= 1024 * 1024;
    }).slice(0, SkillUpload.ROOT_MAX);
    Promise.all(picked.map(function (f) {
      return f.text().then(function (text) { return { path: f.webkitRelativePath || f.name, text: text }; });
    })).then(done).catch(function (e) { Work.toast(String(e && e.message ? e.message : e)); });
  },
  _decodeAll: function (entries, done) {
    Promise.all(entries.map(function (e) {
      const path2 = e.path;
      if (e.text != null) return Promise.resolve({ path: path2, text: e.text });
      if (e.method === 0) return Promise.resolve({ path: path2, text: new TextDecoder().decode(e.data) });
      const stream = new Blob([e.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Response(stream).arrayBuffer().then(function (ab) {
        return { path: path2, text: new TextDecoder().decode(new Uint8Array(ab)) };
      });
    })).then(done).catch(function (e) { Work.toast(tt('wUploadBadZip') + '：' + (e && e.message ? e.message : e)); });
  },
  /* 去掉 zip 外层统一根目录（如 skill-x/SKILL.md → SKILL.md） */
  stripRoot: function (entries) {
    if (entries.length < 2) return entries;
    const first = entries[0].path.split('/')[0];
    const allShare = entries.every(function (e) { return e.path.split('/')[0] === first && e.path.indexOf('/') > -1; });
    if (!allShare) return entries;
    return entries.map(function (e) { return { path: e.path.slice(first.length + 1), text: e.text }; });
  },
  parseFrontmatter: function (text) {
    const s = String(text || '');
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(s);
    if (!m) return { name: '', description: '', body: s.trim() };
    let name = '';
    let description = '';
    m[1].split(/\r?\n/).forEach(function (line) {
      const mm = /^(name|description)\s*:\s*(.*)$/.exec(line.trim());
      if (!mm) return;
      const v = mm[2].replace(/^["']|["']$/g, '').trim();
      if (mm[1] === 'name') name = v;
      else description = v;
    });
    return { name: name, description: description, body: s.slice(m[0].length).trim() };
  },
  importEntries: function (entries, kind, m) {
    if (!entries || !entries.length) { Work.toast(kind === 'plugin' ? tt('wUploadNoPlugin') : tt('wUploadNoSkillMd')); return; }
    SkillUpload._decodeAll(entries, function (decoded) {
      const list = SkillUpload.stripRoot(decoded);
      if (kind === 'skill') SkillUpload._saveSkill(list, m);
      else SkillUpload._savePlugin(list, m);
    });
  },
  _saveSkill: function (list, m) {
    const hit = list.filter(function (e) { return /(^|\/)SKILL\.md$/i.test(e.path); })
      .sort(function (a, b) { return a.path.split('/').length - b.path.split('/').length; })[0];
    if (!hit) { Work.toast(tt('wUploadNoSkillMd')); return; }
    const parts = hit.path.split('/').filter(Boolean);
    const raw = parts.length >= 2 ? parts[parts.length - 2] : '';
    const slug = (raw.replace(/[^a-zA-Z0-9_-]/g, '') || ('skill-' + Date.now().toString(36)));
    const fm = SkillUpload.parseFrontmatter(hit.text);
    Work.api.fetch('/api/work/skills/save', {
      method: 'POST',
      body: { slug: slug, name: fm.name || slug, description: fm.description || '', content: fm.body }
    }).then(function () {
      const extra = list.length - 1;
      const nf = i18n[getLang()].wUploadExtraN;
      Work.toast(tt('saved2') + (extra > 0 && typeof nf === 'function' ? ' · ' + nf(extra) : ''));
      if (m && m.close) m.close();
      Work.rerender();
    }).catch(function (e) { Work.toast(e.message); });
  },
  _savePlugin: function (list, m) {
    const manifest = list.filter(function (e) { return /(^|\/)\.qoder-plugin\/plugin\.json$/i.test(e.path); })[0];
    let key = '';
    if (manifest) { try { key = String(JSON.parse(manifest.text).name || ''); } catch (e) { /* 忽略坏 manifest */ } }
    if (!key && list[0]) key = list[0].path.split('/')[0];
    key = String(key || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!key) { Work.toast(tt('wUploadBadKey')); return; }
    const meaningful = list.some(function (e) {
      return /(^|\/)(\.mcp\.json|plugin\.json|tools\.json)$/i.test(e.path)
        || /(^|\/)agents\/[^/]+\.md$/i.test(e.path)
        || /(^|\/)skills\/[^/]+\/SKILL\.md$/i.test(e.path)
        || /(^|\/)commands\/[^/]+\.md$/i.test(e.path);
    });
    if (!meaningful) { Work.toast(tt('wUploadNoPlugin')); return; }
    Work.api.fetch('/api/work/plugins/save', {
      method: 'POST',
      body: { key: key, files: list.map(function (e) { return { path: e.path, content: e.text }; }) }
    }).then(function () {
      Work.toast(tt('saved2') + ' · ' + key);
      if (m && m.close) m.close();
      Work.rerender();
    }).catch(function (e) {
      const msg = String(e && e.message ? e.message : e);
      Work.toast(/404|not found/i.test(msg) ? tt('wUploadNeedBackend') : msg);
    });
  }
};
Work.SkillUpload = SkillUpload;

/* ---------------- 领域插件（科研外挂）分区 ----------------
   research-ai / research-robotics / research-math：agents 可被墨道委派，
   skills 以 plugin:skill 进白名单，commands 为 slash 命令，MCP 工具 in-process 注入。
   卡片：能力计数 / 工具标签 / 可配置参数 / 使用文档查看。 */
function renderDomainPlugins(holder, plugins) {
  const section = Work.el('div', 'display: flex; flex-direction: column; gap: 10px; margin-top: 8px;');
  section.appendChild(Work.el('div', 'color: var(--text-1); font-size: 13px; font-weight: 700; margin-top: 6px;', tt('wPluginsTitle')));
  section.appendChild(Work.hint(tt('wPluginsHint')));
  const grid = Work.grid({ cols: 3 });
  (plugins || []).forEach(function (p) {
    const card = Work.card({ gap: '8px', pad: '14px' });
    const head = Work.el('div', 'display: flex; align-items: flex-start; gap: 8px;');
    const col = Work.el('div', 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 3px;');
    const nameRow = Work.el('div', 'display: flex; align-items: center; gap: 7px;');
    nameRow.appendChild(Work.el('div', 'color: var(--text-1); font-size: 13.5px; font-weight: 700;', p.key));
    nameRow.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px;', 'v' + (p.version || '1.0.0')));
    col.appendChild(nameRow);
    col.appendChild(Work.el('div', 'color: var(--text-2); font-size: 11.5px; line-height: 17px;'
      + ' display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;', p.description || ''));
    col.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px; font-family: var(--mono);',
      'agents ' + (p.agents || []).length + ' · skills ' + (p.skills || []).length
      + ' · commands ' + (p.commands || []).length + ' · tools ' + (p.tools || []).length));
    head.appendChild(col);
    head.appendChild(Work.toggle(function () { return p.enabled; }, function (v) {
      Work.api.fetch('/api/work/plugins', { method: 'PUT', body: { key: p.key, enabled: v } })
        .then(function (d) {
          if (d && d.plugins) {
            d.plugins.forEach(function (np) {
              const hit = (plugins || []).find(function (x) { return x.key === np.key; });
              if (hit) { hit.enabled = np.enabled; }
            });
          }
          Work.toast(tt('saved2') + ' · ' + (v ? tt('wPluginsOn') : tt('wPluginsOff')));
          Work.rerender();
        })
        .catch(function (e) { Work.toast(e.message); });
    }));
    card.appendChild(head);

    /* MCP 工具标签 */
    if ((p.tools || []).length) {
      const res = Work.el('div', 'display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px;');
      (p.tools || []).forEach(function (a) { res.appendChild(Work.tag(a, 'var(--text-2)')); });
      card.appendChild(res);
    }
    /* 可配置参数摘要（key=当前生效值） */
    const schemaProps = (p.configSchema && p.configSchema.properties) || {};
    const cfgKeys = Object.keys(schemaProps);
    if (cfgKeys.length) {
      const cfgLine = cfgKeys.map(function (k) { return k + '=' + (p.config && p.config[k] !== undefined ? p.config[k] : schemaProps[k].default); }).join(' · ');
      card.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px; margin-top: 2px;'
        + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', tt('wPluginsCfg') + '：' + cfgLine));
    }

    const foot = Work.el('div', 'display: flex; gap: 8px; align-items: center; margin-top: 4px;');
    if (p.hasReadme) {
      foot.appendChild(Work.smallBtn(tt('wPluginsDoc'), function () {
        Work.api.fetch('/api/work/plugins/item?key=' + encodeURIComponent(p.key)).then(function (d) {
          const m = Work.modal({ title: p.key + ' · ' + tt('wPluginsDoc'), width: 680 });
          const box = Work.el('div', 'min-height: 160px; max-height: 60vh; overflow-y: auto;');
          m.body.appendChild(box);
          const md = (d && d.markdown) || '';
          if (typeof window.marked !== 'undefined' && typeof window.DOMPurify !== 'undefined') {
            const rendered = Work.el('div');
            rendered.className = 'ai-text md-body';
            rendered.innerHTML = window.DOMPurify.sanitize(window.marked.parse(md));
            box.appendChild(rendered);
          } else {
            box.appendChild(Work.el('div', 'font-family: var(--mono); font-size: 12px; white-space: pre-wrap;', md));
          }
        }).catch(function (e) { Work.toast(e.message); });
      }, { primary: true }));
    }
    foot.appendChild(Work.el('div', 'flex: 1 1 0;'));
    foot.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px;', '听命于墨道'));
    card.appendChild(foot);
    grid.appendChild(card);
  });
  section.appendChild(grid);
  holder.appendChild(section);
}

/* 查看正文：有 marked 走渲染，离线/缺失时降级为等宽原文（不留空白） */
function skillViewModal(skill) {
  const m = Work.modal({ title: skill.name || skill.slug, width: 640 });
  const meta = Work.el('div', 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap;');
  meta.appendChild(Work.tag(skill.slug, 'var(--text-2)'));
  if (skill.description) meta.appendChild(Work.el('div', 'color: var(--text-2); font-size: 11.5px;', skill.description));
  m.body.appendChild(meta);
  const box = Work.el('div', 'min-height: 120px; max-height: 46vh; overflow-y: auto;');
  m.body.appendChild(box);
  Work.api.fetch('/api/work/skills/item?slug=' + encodeURIComponent(skill.slug)).then(function (d) {
    const md = (d && d.markdown) || '';
    const body = md.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').trim();
    if (typeof window.marked !== 'undefined' && typeof window.DOMPurify !== 'undefined') {
      const rendered = Work.el('div');
      rendered.className = 'ai-text md-body';
      rendered.innerHTML = window.DOMPurify.sanitize(window.marked.parse(body));
      box.appendChild(rendered);
    } else {
      box.appendChild(Work.hint(tt('wOfflineMd'), 'warn'));
      box.appendChild(Work.preBlock(body, { dark: false, maxHeight: '40vh' }));
    }
  }).catch(function (e) { box.appendChild(Work.hint(e.message, 'danger')); });
}

/* 新建 / 编辑 */
function skillEditModal(existing) {
  const m = Work.modal({
    title: existing ? (tt('wSkillEdit') + ' · ' + existing.slug) : tt('wSkillNew'),
    width: 640,
    okText: tt('saved2'),
    onOk: function (api) {
      const slug = (existing && existing.slug) || fSlug.input.value.trim();
      const name = fName.input.value.trim() || slug;
      const description = fDesc.input.value.trim();
      const content = fBody.input.value;
      if (!slug) { Work.toast(tt('wSkillSlugBad')); return; }
      Work.api.fetch('/api/work/skills/save', {
        method: 'POST', body: { slug: slug, name: name, description: description, content: content }
      }).then(function () { api.close(); Work.toast(tt('saved2')); Work.rerender(); })
        .catch(function (e) { Work.toast(e.message); });
    }
  });
  let fSlug;
  if (!existing) {
    fSlug = Work.field({ label: tt('wSkillSlug'), placeholder: 'my-skill', hint: tt('wSkillSlugHint') });
    m.body.appendChild(fSlug);
  }
  const fName = Work.field({ label: tt('wSkillName'), value: existing ? (existing.name || '') : '' });
  m.body.appendChild(fName);
  const fDesc = Work.field({ label: tt('wSkillDescLabel'), value: existing ? (existing.description || '') : '' });
  m.body.appendChild(fDesc);
  const fBody = Work.field({ label: tt('wSkillContent'), multiline: true, rows: 14, mono: true, value: '' });
  if (existing) {
    Work.api.fetch('/api/work/skills/item?slug=' + encodeURIComponent(existing.slug)).then(function (d) {
      fBody.input.value = ((d && d.markdown) || '').replace(/^---\r?\n[\s\S]*?\r?\n---/, '').trim();
    });
  }
  m.body.appendChild(fBody);
  m.body.appendChild(Work.hint(tt('wSkillFormatHint')));
}

Work.pages.skills = buildSkillsPage;
