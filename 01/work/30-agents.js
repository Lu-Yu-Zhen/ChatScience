// @ts-nocheck
/* 前端全局脚本层：按字节精确迁移自 JS（见 app/TypeScript迁移说明.md），
   本文件关闭逐行类型检查；环境与第三方库声明见 ambient.d.ts。 */
/* ==================================================================
   30-agents.js · 智能体搭建页（wide）
   agentDef 字段与 server/qoder.js 的 query options 映射一一对应：
   systemPrompt / modelKey(BYOK 模型) / permissionMode / maxTurns /
   tools{sdk[],builtin[],mcp{}} / skills[] / sandbox.scope
   模型调用一律走用户自有 API Key（BYOK-only），平台订阅档位已移除。
   ================================================================== */
const AGENT_ROLES = ['research', 'code', 'analysis', 'writing', 'custom'];
const AGENT_ROLE_COLORS = {
    research: ['#2563EB', 'rgba(37,99,235,0.10)'],
    code: ['#16A34A', 'rgba(22,163,74,0.10)'],
    analysis: ['#7C3AED', 'rgba(124,58,237,0.10)'],
    writing: ['#EA580C', 'rgba(234,88,12,0.10)'],
    custom: ['#64748B', 'rgba(100,116,139,0.10)']
};
function buildAgentsPage() {
    const shell = Work.pageShell({ wide: true });
    shell.bar.appendChild(Work.pillBtn(tt('wAgentNewSub'), Work.ICONS.plus, function () { subagentEditModal(null); }, { primary: true }));
    const holder = Work.el('div', 'display: flex; flex-direction: column; gap: 14px;');
    shell.body.appendChild(holder);
    if (!Work.api.available()) {
        holder.appendChild(noBackendCard());
        return { node: shell.root, title: tt('wAgents'), desc: tt('wAgentsDesc'), wide: true };
    }
    Promise.all([
        Work.store.ready(),
        Work.api.fetch('/api/work/skills'),
        Work.api.fetch('/api/work/mcp/servers'),
        Work.api.fetch('/api/work/qoder/config')
    ]).then(function (all) {
        WorkState.skillsList = (all[1] && all[1].skills) || [];
        WorkState.mcpList = (all[2] && all[2].servers) || [];
        holder.replaceChildren();
        renderAgents(holder, WorkState.agents || [], WorkState.subagents || []);
    }).catch(function (e) {
        holder.replaceChildren();
        holder.appendChild(Work.noticeBox(tt('wErrLoadFail'), e.message, 'warn'));
    });
    return { node: shell.root, title: tt('wAgents'), desc: tt('wAgentsDesc'), wide: true };
}
function renderAgents(holder, agents, subagents) {
    /* 主智能体区：墨道（主Agent）与墨析（仅对话）——固定不可删除，可编辑 */
    holder.appendChild(Work.sectionLabel('主智能体'));
    const mainGrid = Work.grid(300);
    (agents || []).forEach(function (a) { mainGrid.appendChild(agentCard(a, agents)); });
    holder.appendChild(mainGrid);
    /* 子智能体区：听命于墨道，可编辑、可添加、不可删除 */
    holder.appendChild(Work.el('div', 'height: 1px; background: var(--border); margin: 4px 0;'));
    holder.appendChild(Work.sectionLabel('子智能体（由墨道调度委派，不可删除）'));
    const subGrid = Work.grid(300);
    (subagents || []).forEach(function (s) { subGrid.appendChild(subagentCard(s)); });
    subGrid.appendChild(Work.dashedCard(tt('wAgentNewSub'), Work.ICONS.plus, function () { subagentEditModal(null); }));
    holder.appendChild(subGrid);
}
function subagentCard(s) {
    const card = Work.card({ gap: '8px', pad: '16px' });
    const head = Work.el('div', 'display: flex; align-items: center; gap: 10px;');
    const avatar = Work.el('div', 'width: 38px; height: 38px; border-radius: 12px; background: rgba(100,116,139,0.10);'
        + ' color: #64748B; display: flex; justify-content: center; align-items: center; flex-shrink: 0;');
    avatar.appendChild(Work.icon(Work.ICONS.agent, 19, '#64748B'));
    head.appendChild(avatar);
    const col = Work.el('div', 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 2px;');
    const nameRow = Work.el('div', 'display: flex; align-items: center; gap: 7px;');
    nameRow.appendChild(Work.el('div', 'color: var(--text-1); font-size: 14px; font-weight: 700;'
        + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', s.name || '子智能体'));
    nameRow.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px; flex-shrink: 0;', (s.builtin ? '内建' : '自定义') + ' · 跟随墨道模型'));
    col.appendChild(nameRow);
    col.appendChild(Work.el('div', 'color: var(--text-2); font-size: 11.5px; line-height: 17px;'
        + ' display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;', s.whenToUse || ''));
    head.appendChild(col);
    card.appendChild(head);
    const toolsN = (s.sdkTools || []).length + (s.scienceTools || []).length;
    card.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px; margin-top: 2px;'
        + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', '模型 ' + (s.model || 'inherit') + ' · maxTurns ' + (s.maxTurns || 12) + ' · 工具 ' + toolsN
        + ' · 技能 ' + ((s.skills || []).length)));
    const foot = Work.el('div', 'display: flex; gap: 8px; align-items: center; margin-top: 4px;');
    foot.appendChild(Work.smallBtn(tt('wEdit'), function () { subagentEditModal(s); }, { primary: true }));
    if (!s.builtin) {
        foot.appendChild(Work.smallBtn(tt('wSubDelete'), function () {
            if (!window.confirm(tt('wSubDelConfirm')))
                return;
            Work.api.fetch('/api/work/subagents?id=' + encodeURIComponent(s.id), { method: 'DELETE' })
                .then(function (d) {
                WorkState.subagents = (d && d.subagents) || WorkState.subagents;
                Work.toast(tt('saved2'));
                Work.rerender();
            })
                .catch(function (e) { Work.toast(e.message); });
        }));
    }
    foot.appendChild(Work.el('div', 'flex: 1 1 0;'));
    foot.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px;', '听命于墨道'));
    card.appendChild(foot);
    return card;
}
function subagentEditModal(existing) {
    const isNew = !existing;
    const s = existing ? JSON.parse(JSON.stringify(existing)) : {
        id: '', name: '', whenToUse: '', prompt: '',
        sdkTools: ['Read', 'Glob', 'Grep'], scienceTools: ['kb_search'],
        skills: [], maxTurns: 12, permissionMode: 'default', model: 'inherit', builtin: false
    };
    const skillsList = WorkState.skillsList || [];
    const sdkAll = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch', 'NotebookEdit'];
    const sciAll = ['arxiv_search', 'fetch_url', 'web_search', 'kb_search', 'note_write', 'run_code',
        'doi_cite', 'keyword_expand', 'latex_check', 'unit_convert', 'figure_caption'];
    const m = Work.modal({
        title: isNew ? tt('wAgentNewSub') : (tt('wEdit') + ' · ' + (existing.name || '')),
        width: 640, okText: tt('saved2'),
        onOk: function (api) {
            s.name = fName.input.value.trim();
            s.whenToUse = fWhen.input.value.trim();
            s.prompt = fPrompt.input.value;
            const mt = parseInt(fTurns.input.value, 10);
            s.maxTurns = isNaN(mt) ? 12 : Math.min(Math.max(mt, 1), 64);
            if (!s.name) {
                Work.toast(tt('wAgentNameBad'));
                return;
            }
            if (!s.whenToUse) {
                Work.toast('委派时机（description）必填——模型据此决定是否委派');
                return;
            }
            Work.api.fetch('/api/work/subagents', { method: 'PUT', body: { subagent: s } }).then(function (d) {
                WorkState.subagents = (d && d.subagents) || WorkState.subagents;
                api.close();
                Work.toast(tt('saved2'));
                Work.rerender();
            }).catch(function (e) { Work.toast(e.message); });
        }
    });
    const fName = Work.field({ label: '名称', value: s.name, placeholder: '如：专利检索' });
    m.body.appendChild(fName);
    const fWhen = Work.field({ label: '委派时机（模型据此路由，务必具体）', value: s.whenToUse || '',
        placeholder: '当任务需要……时用我。只做……，不做……' });
    m.body.appendChild(fWhen);
    const fPrompt = Work.field({ label: '子智能体提示词（角色 / 边界 / 输出要求）', multiline: true, rows: 5, value: s.prompt || '' });
    m.body.appendChild(fPrompt);
    m.body.appendChild(Work.row('权限模式', Work.seg(['default', 'acceptEdits', 'plan'].map(function (p) { return { value: p, label: p }; }), function () { return s.permissionMode || 'default'; }, function (v) { s.permissionMode = v; })));
    const fTurns = Work.field({ label: tt('wAgentTurns'), value: String(s.maxTurns || 12), type: 'number', inputStyle: 'max-width: 120px;' });
    m.body.appendChild(Work.row(tt('wAgentTurns'), fTurns.input, { sub: '模型跟随墨道（inherit）；maxTurns 设执行轮次上限' }));
    const toolBox = Work.card({ gap: '6px', pad: '12px' });
    toolBox.appendChild(Work.sectionLabel(tt('wAgentTools')));
    toolBox.appendChild(Work.hint('SDK 工具与科研工具（mcp__chatscience__*）；Agent 委派工具不可加入（子智能体不可嵌套派生）。'));
    sdkAll.forEach(function (name) {
        toolBox.appendChild(checkRow(name, function () { return s.sdkTools.indexOf(name) > -1; }, function (v) {
            if (v) {
                if (s.sdkTools.indexOf(name) === -1)
                    s.sdkTools.push(name);
            }
            else {
                const i = s.sdkTools.indexOf(name);
                if (i > -1)
                    s.sdkTools.splice(i, 1);
            }
        }));
    });
    sciAll.forEach(function (name) {
        toolBox.appendChild(checkRow('mcp · ' + name, function () { return s.scienceTools.indexOf(name) > -1; }, function (v) {
            if (v) {
                if (s.scienceTools.indexOf(name) === -1)
                    s.scienceTools.push(name);
            }
            else {
                const i = s.scienceTools.indexOf(name);
                if (i > -1)
                    s.scienceTools.splice(i, 1);
            }
        }));
    });
    m.body.appendChild(toolBox);
    const skillBox = Work.card({ gap: '6px', pad: '12px' });
    skillBox.appendChild(Work.sectionLabel(tt('wAgentSkills')));
    if (!skillsList.length)
        skillBox.appendChild(Work.hint(tt('wAgentNoSkills')));
    skillsList.forEach(function (sk) {
        skillBox.appendChild(checkRow(sk.name + '（' + sk.slug + '）', function () { return s.skills.indexOf(sk.slug) > -1; }, function (v) {
            if (v) {
                if (s.skills.indexOf(sk.slug) === -1)
                    s.skills.push(sk.slug);
            }
            else {
                const i = s.skills.indexOf(sk.slug);
                if (i > -1)
                    s.skills.splice(i, 1);
            }
        }));
    });
    m.body.appendChild(skillBox);
}
function agentCard(a, agents) {
    const color = AGENT_ROLE_COLORS[a.role] || AGENT_ROLE_COLORS.custom;
    const card = Work.card({ gap: '8px', pad: '16px' });
    const head = Work.el('div', 'display: flex; align-items: center; gap: 10px;');
    const avatar = Work.el('div', 'width: 38px; height: 38px; border-radius: 12px; background: ' + color[1]
        + '; color: ' + color[0] + '; display: flex; justify-content: center; align-items: center; flex-shrink: 0;');
    avatar.appendChild(Work.icon(Work.ICONS.agent, 19, color[0]));
    head.appendChild(avatar);
    const col = Work.el('div', 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 2px;');
    const nameRow = Work.el('div', 'display: flex; align-items: center; gap: 7px;');
    nameRow.appendChild(Work.el('div', 'color: var(--text-1); font-size: 14px; font-weight: 700;'
        + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', a.name || 'Agent'));
    nameRow.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px; flex-shrink: 0;', (tt('wRole_' + a.role) || a.role) + (a.builtin ? ' · ' + tt('wSkillBuiltin') : '')));
    col.appendChild(nameRow);
    col.appendChild(Work.el('div', 'color: var(--text-2); font-size: 11.5px; line-height: 17px;'
        + ' display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;', a.description || ''));
    head.appendChild(col);
    card.appendChild(head);
    /* 能力摘要：单行弱化文本（去彩色 tag 堆砌） */
    const sdkN = a.tools && a.tools.sdk ? a.tools.sdk.length : -1;
    const sciOn = !!(a.tools && a.tools.builtin && a.tools.builtin.indexOf('science') > -1);
    const mcpN = a.tools && a.tools.mcp ? Object.keys(a.tools.mcp).length : 0;
    const modelDisp = (a.modelKey && a.modelKey !== 'byok') ? 'API·绑定实例' : 'API·跟随全局';
    const metaParts = [
        modelDisp,
        'maxTurns ' + (a.maxTurns || 12),
        sdkN < 0 ? tt('wToolsAll') : tt('wToolsN').replace('{n}', String(sdkN))
    ];
    if (sciOn)
        metaParts.push(tt('wScienceTools'));
    if (mcpN)
        metaParts.push('MCP ' + mcpN);
    if (a.skills && a.skills.length)
        metaParts.push(tt('wSkillsN').replace('{n}', String(a.skills.length)));
    if (a.sandbox && a.sandbox.scope === 'agent')
        metaParts.push(tt('wSandboxScope'));
    card.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px; margin-top: 2px;'
        + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', metaParts.join(' · ')));
    /* 操作行：墨道/墨析固定不可删除（仅编辑/复制/对话） */
    const foot = Work.el('div', 'display: flex; gap: 8px; align-items: center; margin-top: 4px;');
    foot.appendChild(Work.smallBtn(tt('wAgentChat'), function () { Work.Agents.startConversation(a); }, { primary: true }));
    foot.appendChild(Work.smallBtn(tt('wEdit'), function () { agentEditModal(a); }));
    foot.appendChild(Work.smallBtn(tt('wAgentCopy'), function () {
        const copy = JSON.parse(JSON.stringify(a));
        copy.id = Work.uid('agent');
        copy.name = a.name + ' · 副本';
        copy.builtin = false;
        copy.createdAt = Date.now();
        agents.push(copy);
        saveAgents(agents, true);
    }));
    foot.appendChild(Work.el('div', 'flex: 1 1 0;'));
    foot.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px;', '固定'));
    card.appendChild(foot);
    return card;
}
function saveAgents(agents, rerenderAfter) {
    Work.api.fetch('/api/work/agents', { method: 'PUT', body: { agents: agents } })
        .then(function () {
        WorkState.agents = agents; /* runTurn 立即可用 */
        Work.toast(tt('saved2'));
        if (rerenderAfter)
            Work.rerender();
    })
        .catch(function (e) { Work.toast(e.message); });
}
/* ---------------- 编辑器弹窗 ---------------- */
function agentEditModal(existing) {
    const isNew = !existing;
    const a = existing ? JSON.parse(JSON.stringify(existing)) : {
        id: Work.uid('agent'), name: '', role: 'custom', description: '',
        systemPrompt: '', modelKey: 'byok', permissionMode: 'default', maxTurns: 12,
        tools: { sdk: WorkState._sdkDefaults || ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch', 'NotebookEdit'], builtin: ['science'], mcp: {} },
        skills: [], sandbox: { scope: 'global' }
    };
    const skillsList = WorkState.skillsList || [];
    const mcpList = WorkState.mcpList || [];
    const m = Work.modal({
        title: isNew ? tt('wAgentNew') : (tt('wEdit') + ' · ' + (existing.name || '')),
        width: 640, okText: tt('saved2'),
        onOk: function (api) {
            a.name = fName.input.value.trim();
            a.description = fDesc.input.value.trim();
            a.systemPrompt = fSys.input.value;
            const mt = parseInt(fTurns.input.value, 10);
            a.maxTurns = isNaN(mt) ? 12 : Math.min(Math.max(mt, 1), 40);
            if (!a.name) {
                Work.toast(tt('wAgentNameBad'));
                return;
            }
            /* MCP 白名单：只保留勾选的 server（全选 server 时记录为空数组=全部） */
            const mcpWanted = {};
            mcpList.forEach(function (s) {
                const arr = a.tools.mcp && a.tools.mcp[s.key];
                if (arr && arr.length)
                    mcpWanted[s.key] = arr;
            });
            a.tools.mcp = mcpWanted;
            a.updatedAt = Date.now();
            Work.api.fetch('/api/work/agents').then(function (d) {
                const list = (d && d.agents) || [];
                const hit = list.find(function (x) { return x.id === a.id; });
                if (hit) {
                    const i = list.indexOf(hit);
                    list[i] = a;
                }
                else
                    list.push(a);
                return Work.api.fetch('/api/work/agents', { method: 'PUT', body: { agents: list } });
            }).then(function () {
                WorkState.agents = WorkState.agents || [];
                const i = WorkState.agents.findIndex(function (x) { return x.id === a.id; });
                if (i > -1)
                    WorkState.agents[i] = a;
                else
                    WorkState.agents.push(a);
                api.close();
                Work.toast(tt('saved2'));
                Work.rerender();
            }).catch(function (e) { Work.toast(e.message); });
        }
    });
    const fName = Work.field({ label: tt('wAgentName'), value: a.name, placeholder: '我的科研智能体' });
    m.body.appendChild(fName);
    const fDesc = Work.field({ label: tt('wAgentDescLabel'), value: a.description });
    m.body.appendChild(fDesc);
    /* 角色 / 模型 / 权限 / maxTurns */
    m.body.appendChild(Work.row(tt('wAgentRole'), Work.seg(AGENT_ROLES.map(function (r) { return { value: r, label: tt('wRole_' + r) || r }; }), function () { return a.role; }, function (v) { a.role = v; })));
    /* 模型：从用户在 Qoder 注册的 BYOK 模型中选择（凭据存 Qoder 服务端） */
    const byokList = WorkState.byokModels || [];
    const modelOpts = [{ value: 'byok', label: '跟随全局（激活模型）' }];
    byokList.forEach(function (bm) {
        modelOpts.push({ value: bm.model, label: (bm.displayName || bm.model) + '（' + bm.provider + '）' });
    });
    if (byokList.length) {
        m.body.appendChild(Work.row(tt('wAgentModel') + '（API）', Work.seg(modelOpts, function () { return a.modelKey || 'byok'; }, function (v) { a.modelKey = v; })));
        m.body.appendChild(Work.hint('API 模型：调用走你在 Qoder 注册的 BYOK 凭据，不消耗平台 credits。'));
    }
    else {
        m.body.appendChild(Work.hint('尚未检测到已注册的 API Key 模型——请在 Qoder 客户端「设置 → 模型」配置自带模型后重启应用；在此之前智能体无法执行任务。'));
    }
    m.body.appendChild(Work.row(tt('wAgentPerm'), Work.seg(['default', 'acceptEdits', 'auto', 'plan'].map(function (p) { return { value: p, label: p }; }), function () { return a.permissionMode || 'default'; }, function (v) { a.permissionMode = v; })));
    const fTurns = Work.field({ label: tt('wAgentTurns'), value: String(a.maxTurns || 12), type: 'number', inputStyle: 'max-width: 120px;' });
    m.body.appendChild(Work.row(tt('wAgentTurns'), fTurns.input, { sub: tt('wAgentTurnsSub') }));
    m.body.appendChild(Work.row(tt('wAgentScope'), Work.seg([
        { value: 'global', label: tt('wScopeGlobal') }, { value: 'agent', label: tt('wScopeAgent') }
    ], function () { return (a.sandbox && a.sandbox.scope) || 'global'; }, function (v) {
        a.sandbox = a.sandbox || {};
        a.sandbox.scope = v;
    })));
    /* 系统提示词 */
    const fSys = Work.field({ label: tt('wAgentSys'), multiline: true, rows: 5, value: a.systemPrompt || '' });
    m.body.appendChild(fSys);
    /* 工具：SDK 内建复选 */
    const sdkAll = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch', 'NotebookEdit'];
    if (a.tools.sdk === undefined)
        a.tools.sdk = sdkAll.slice();
    const toolBox = Work.card({ gap: '6px', pad: '12px' });
    toolBox.appendChild(Work.sectionLabel(tt('wAgentTools')));
    toolBox.appendChild(Work.hint(tt('wAgentToolsHint')));
    sdkAll.forEach(function (name) {
        toolBox.appendChild(checkRow(name, function () { return a.tools.sdk.indexOf(name) > -1; }, function (v) {
            if (v) {
                if (a.tools.sdk.indexOf(name) === -1)
                    a.tools.sdk.push(name);
            }
            else {
                const i = a.tools.sdk.indexOf(name);
                if (i > -1)
                    a.tools.sdk.splice(i, 1);
            }
        }));
    });
    toolBox.appendChild(checkRow(tt('wScienceTools') + '（arxiv_search / run_code / kb_search / note_write …）', function () { return a.tools.builtin.indexOf('science') > -1; }, function (v) {
        const i = a.tools.builtin.indexOf('science');
        if (v && i === -1)
            a.tools.builtin.push('science');
        if (!v && i > -1)
            a.tools.builtin.splice(i, 1);
    }));
    /* MCP 白名单（整 server 粒度：勾选 = 该 server 全部工具可用） */
    mcpList.forEach(function (s) {
        toolBox.appendChild(checkRow('mcp · ' + s.key, function () { return !!(a.tools.mcp && a.tools.mcp[s.key]); }, function (v) {
            a.tools.mcp = a.tools.mcp || {};
            if (v)
                a.tools.mcp[s.key] = []; /* [] = 该 server 全部工具 */
            else
                delete a.tools.mcp[s.key];
        }, s.enabled === false));
    });
    if (!mcpList.length)
        toolBox.appendChild(Work.hint(tt('wAgentNoMcp')));
    m.body.appendChild(toolBox);
    /* 技能复选 */
    const skillBox = Work.card({ gap: '6px', pad: '12px' });
    skillBox.appendChild(Work.sectionLabel(tt('wAgentSkills')));
    skillBox.appendChild(Work.hint(tt('wAgentSkillsHint')));
    if (!skillsList.length)
        skillBox.appendChild(Work.hint(tt('wAgentNoSkills')));
    skillsList.forEach(function (s) {
        skillBox.appendChild(checkRow(s.name + '（' + s.slug + '）', function () { return a.skills.indexOf(s.slug) > -1; }, function (v) {
            if (v) {
                if (a.skills.indexOf(s.slug) === -1)
                    a.skills.push(s.slug);
            }
            else {
                const i = a.skills.indexOf(s.slug);
                if (i > -1)
                    a.skills.splice(i, 1);
            }
        }));
    });
    m.body.appendChild(skillBox);
}
function checkRow(label, get, set, disabled) {
    const row = Work.el('div', 'display: flex; align-items: center; gap: 8px; padding: 6px 8px;'
        + ' border-radius: 8px; cursor: pointer; background: var(--accent-soft);' + (disabled ? ' opacity: 0.45;' : ''));
    const box = Work.el('div', 'width: 15px; height: 15px; border-radius: 5px; flex-shrink: 0;'
        + ' border: 1px solid ' + (get() ? 'var(--accent-text)' : 'var(--border)') + ';'
        + ' background: ' + (get() ? 'var(--accent-text)' : 'transparent') + ';'
        + ' color: #fff; display: flex; justify-content: center; align-items: center;');
    if (get())
        box.appendChild(Work.icon(Work.ICONS.check, 10, '#fff'));
    row.appendChild(box);
    row.appendChild(Work.el('div', 'color: var(--text-1); font-size: 12px; flex: 1 1 0; min-width: 0;'
        + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', label));
    if (!disabled) {
        row.addEventListener('click', function () {
            set(!get());
            box.style.borderColor = get() ? 'var(--accent-text)' : 'var(--border)';
            box.style.background = get() ? 'var(--accent-text)' : 'transparent';
            box.replaceChildren();
            if (get())
                box.appendChild(Work.icon(Work.ICONS.check, 10, '#fff'));
        });
    }
    return row;
}
/* 对话入口：切到 Work 模式 → 绑定 agentId 的草稿 → 输入框就绪 */
Work.Agents = {
    startConversation: function (agent) {
        if (typeof setSidebarMode === 'function') {
            if (sidebarMode !== 'work')
                setSidebarMode('work');
            else if (!draft || (draft.messages && draft.messages.length))
                startDraft(null);
        }
        if (draft) {
            draft.agentId = agent.id;
        }
        activeConvId = 'draft';
        /* 设置页内挂载：先关设置页再进入对话（否则视图切换发生在遮罩之后，看似"点了没反应"） */
        if (typeof settingsOpen !== 'undefined' && settingsOpen && typeof closeSettings === 'function')
            closeSettings();
        view = 'chat';
        renderConversations();
        renderMessages();
        playSwap();
        chatInput.focus();
        Work.toast(tt('wAgentReady').replace('{n}', agent.name || 'Agent'));
    }
};
Work.pages.agents = buildAgentsPage;
