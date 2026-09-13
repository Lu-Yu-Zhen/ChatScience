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
    shell.bar.appendChild(Work.pillBtn(tt('wSkillNew'), Work.ICONS.plus, function () { skillEditModal(null); }, { primary: true }));
    const holder = Work.el('div', 'display: flex; flex-direction: column; gap: 14px;');
    shell.body.appendChild(holder);
    if (!Work.api.available()) {
        holder.appendChild(noBackendCard());
        return { node: shell.root, title: tt('wSkills'), desc: tt('wSkillsDesc'), wide: false };
    }
    Work.store.ready().then(function () { return Work.api.fetch('/api/work/skills'); }).then(function (d) {
        holder.replaceChildren();
        renderSkills(holder, d.skills || [], d.states || {});
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
    const grid = Work.grid(320);
    skills.forEach(function (s) {
        const on = !(states[s.slug] && states[s.slug].enabled === false);
        const card = Work.card({ gap: '8px', pad: '14px' });
        const head = Work.el('div', 'display: flex; align-items: flex-start; gap: 8px;');
        const col = Work.el('div', 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 4px;');
        const nameRow = Work.el('div', 'display: flex; align-items: center; gap: 7px;');
        nameRow.appendChild(Work.el('div', 'color: var(--text-1); font-size: 13.5px; font-weight: 700;'
            + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', s.name || s.slug));
        nameRow.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px; flex-shrink: 0;', s.builtin ? tt('wSkillBuiltin') : tt('wSkillCustom')));
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
/* 查看正文：有 marked 走渲染，离线/缺失时降级为等宽原文（不留空白） */
function skillViewModal(skill) {
    const m = Work.modal({ title: skill.name || skill.slug, width: 640 });
    const meta = Work.el('div', 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap;');
    meta.appendChild(Work.tag(skill.slug, 'var(--text-2)'));
    if (skill.description)
        meta.appendChild(Work.el('div', 'color: var(--text-2); font-size: 11.5px;', skill.description));
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
        }
        else {
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
            if (!slug) {
                Work.toast(tt('wSkillSlugBad'));
                return;
            }
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
