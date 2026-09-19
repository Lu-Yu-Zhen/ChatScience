// @ts-nocheck
/* 前端全局脚本层：按字节精确迁移自 JS（见 app/TypeScript迁移说明.md），
   本文件关闭逐行类型检查；环境与第三方库声明见 ambient.d.ts。 */
/* ==================================================================
   75-plus-menu.ts · 输入框「+」资源挂载菜单
   主输入框与独立读聊面板的加号共用本组件：一级菜单列出四类可挂载资源，
   其中「插件 / 技能 / MCP 连接器」在旁侧展开二级下拉框选定具体条目，
   「上传文件」维持原行为——不展开二级，直接交回调用方唤起文件选择器。

   设计约束
   - 不新造视觉体系：沿用既有下拉菜单令牌（--menu-bg / --menu-border /
     --menu-shadow）与 14px 圆角，与 #permSelectMenu / #modelMenu 同族。
   - 必须挂 body 且 position: fixed：#inputArea 所在 .input-box 带
     overflow-y: auto，菜单若挂在输入框内部会被裁剪。
   - 数据按需拉取（打开菜单时并行三路），单路失败只在二级内提示，不阻塞菜单；
     纯浏览器演示模式（无 CS_BACKEND）时后三项置灰，上传文件仍可用。
   - 二级项点击即挂载，菜单保持打开以支持连续挂载多项；已挂载项显示勾选态，
     再次点击即取消。落点由调用方通过 onPick 决定（主输入框 / 读聊面板各异）。
   ================================================================== */
/* 一级菜单宽度（含 padding）；二级宽度固定，视口右侧放不下时翻到左侧 */
const PM_L1_WIDTH = 244;
const PM_L2_WIDTH = 268;
/* 一级菜单规格：file 是执行项（展开二级），其余三项各对应一个后端数据源。
   list 负责把接口响应归一为 { id, name, desc, meta, off }：
   off=true 表示该条目在全局配置里已停用，挂载前需要提示。 */
const PM_SPECS = [
    {
        key: 'file',
        label: 'wPlusMenuUpload',
        desc: 'wPlusMenuUploadDesc',
        icon: 'upload'
    },
    {
        key: 'plugin',
        label: 'wPlusMenuPlugins',
        desc: 'wPlusMenuPluginsDesc',
        icon: 'box',
        endpoint: '/api/work/plugins',
        list: function (d) {
            return ((d && d.plugins) || []).map(function (p) {
                return {
                    id: p.key,
                    name: p.key,
                    desc: p.description || '',
                    meta: 'v' + (p.version || '1.0.0'),
                    off: p.enabled === false
                };
            });
        }
    },
    {
        key: 'skill',
        label: 'wPlusMenuSkills',
        desc: 'wPlusMenuSkillsDesc',
        icon: 'layers',
        endpoint: '/api/work/skills',
        list: function (d) {
            const states = (d && d.states) || {};
            return ((d && d.skills) || []).map(function (s) {
                const st = states[s.slug];
                return {
                    id: s.slug,
                    name: s.name || s.slug,
                    desc: s.description || '',
                    meta: s.slug,
                    off: !!(st && st.enabled === false)
                };
            });
        }
    },
    {
        key: 'mcp',
        label: 'wPlusMenuMcp',
        desc: 'wPlusMenuMcpDesc',
        icon: 'plug',
        endpoint: '/api/work/mcp/servers',
        list: function (d) {
            return ((d && d.servers) || []).map(function (s) {
                const c = s.config || {};
                const target = c.type === 'http'
                    ? String(c.url || '')
                    : [c.command].concat(c.args || []).join(' ');
                return {
                    id: s.key,
                    name: s.key,
                    desc: target || '—',
                    meta: c.type === 'http' ? 'HTTP' : 'stdio',
                    off: s.enabled === false
                };
            });
        }
    }
];
/* 组件级单例状态：同一时刻只允许一个加号菜单存在（再点另一个加号先关旧的） */
const pmState = {
    open: false,
    anchor: null,
    opts: null,
    root: null,
    l1: null,
    l2: null,
    activeKey: null,
    /* key -> { loading } | { items } | { error } */
    data: {},
    itemNodes: {},
    bound: false
};
function pmSpec(key) {
    return PM_SPECS.find(function (s) { return s.key === key; }) || null;
}
function pmSpecsWithData() {
    return PM_SPECS.filter(function (s) { return !!s.endpoint; });
}
/* ---------------- DOM 构建 ---------------- */
function pmMenuItem(spec) {
    const row = Work.el('div', 'display: flex; align-items: center; gap: 10px; padding: 8px 10px;'
        + ' border-radius: 10px; cursor: pointer; transition: background-color 0.15s ease;');
    row.dataset.key = spec.key;
    row.appendChild(Work.icon(Work.ICONS[spec.icon], 16, 'var(--text-2)'));
    const col = Work.el('div', 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 1px;');
    col.appendChild(Work.el('div', 'color: var(--text-1); font-size: 13px; font-weight: 600; white-space: nowrap;', tt(spec.label)));
    col.appendChild(Work.el('div', 'color: var(--text-3); font-size: 11px; line-height: 15px;'
        + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', tt(spec.desc)));
    row.appendChild(col);
    /* 右侧指示符：「上传文件」是直接执行项（唤起系统选择器），不带任何指示符；
       后三项展开二级，显示已加载数量 + 方向箭头，层级语义在这里区分 */
    const tail = Work.el('div', 'flex-shrink: 0; display: flex; align-items: center; gap: 4px;');
    tail.dataset.role = 'tail';
    if (spec.endpoint) {
        const cnt = Work.el('div', 'color: var(--text-3); font-size: 11px; font-weight: 600;');
        cnt.dataset.role = 'count';
        tail.appendChild(cnt);
        const chev = Work.icon(Work.ICONS.chevronR, 12, 'var(--text-3)');
        chev.dataset.role = 'chev';
        tail.appendChild(chev);
    }
    row.appendChild(tail);
    row.addEventListener('mouseenter', function () {
        pmSetActive(spec.key);
    });
    row.addEventListener('click', function () {
        if (spec.key === 'file') {
            const o = pmState.opts || {};
            pmClose();
            if (o.onUpload)
                o.onUpload();
            return;
        }
        /* 触屏无 hover：点击同样展开二级 */
        pmSetActive(spec.key);
    });
    return row;
}
function pmPaintItems() {
    PM_SPECS.forEach(function (spec) {
        const row = pmState.itemNodes[spec.key];
        if (!row)
            return;
        const active = pmState.activeKey === spec.key;
        row.style.background = active ? 'var(--hover-overlay, var(--accent-soft))' : 'transparent';
        const cnt = row.querySelector('[data-role="count"]');
        if (cnt) {
            const d = pmState.data[spec.key];
            const n = (d && d.items) ? d.items.length : null;
            cnt.textContent = (n === null) ? '' : String(n);
        }
    });
}
function pmL2Hint(text, tone) {
    return Work.el('div', 'padding: 10px 12px; color: ' + (tone || 'var(--text-3)') + ';'
        + ' font-size: 11.5px; line-height: 17px;', text);
}
function pmRenderL2(key) {
    const spec = pmSpec(key);
    const box = pmState.l2;
    if (!spec || !box)
        return;
    box.replaceChildren();
    box.appendChild(Work.sectionLabel(tt(spec.label)));
    const d = pmState.data[key];
    if (!d || d.loading) {
        box.appendChild(pmL2Hint(tt('wPlusMenuLoading')));
        return;
    }
    if (d.error) {
        box.appendChild(pmL2Hint(tt('wPlusMenuLoadFail') + '：' + d.error, 'var(--warn)'));
        return;
    }
    const items = d.items || [];
    if (!items.length) {
        box.appendChild(pmL2Hint(tt('wPlusMenuEmpty')));
        box.appendChild(pmL2Hint(tt('wPlusMenuEmptyHint')));
        return;
    }
    const opts = pmState.opts || {};
    items.forEach(function (it) {
        const picked = opts.isPicked ? !!opts.isPicked(key, it) : false;
        const row = Work.el('div', 'display: flex; align-items: flex-start; gap: 9px; padding: 8px 10px;'
            + ' border-radius: 10px; cursor: pointer; transition: background-color 0.15s ease;');
        row.dataset.pick = it.id;
        row.appendChild(Work.icon(Work.ICONS[spec.icon], 14, picked ? 'var(--link)' : 'var(--text-2)'));
        const col = Work.el('div', 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 2px;');
        const nameRow = Work.el('div', 'display: flex; align-items: center; gap: 6px;');
        nameRow.appendChild(Work.el('div', 'color: var(--text-1); font-size: 12.5px; font-weight: 600;'
            + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', it.name));
        if (it.off)
            nameRow.appendChild(Work.tag(tt('wPlusMenuDisabled'), 'var(--text-3)'));
        col.appendChild(nameRow);
        if (it.desc)
            col.appendChild(Work.el('div', 'color: var(--text-3); font-size: 11px; line-height: 15px;'
                + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', it.desc));
        row.appendChild(col);
        if (picked) {
            /* 勾选态：内联 SVG，界面零 emoji */
            const mark = Work.el('div', 'width: 14px; height: 14px; flex-shrink: 0; color: var(--link); margin-top: 2px;');
            mark.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
                + ' stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"'
                + ' style="width:14px;height:14px;">' + Work.ICONS.check + '</svg>';
            row.appendChild(mark);
        }
        row.addEventListener('mouseenter', function () { row.style.background = 'var(--hover-overlay, var(--accent-soft))'; });
        row.addEventListener('mouseleave', function () { row.style.background = 'transparent'; });
        row.addEventListener('click', function (e) {
            e.stopPropagation();
            if (pmState.opts && pmState.opts.onPick)
                pmState.opts.onPick(key, it);
            pmRenderL2(key);
        });
        box.appendChild(row);
    });
}
/* ---------------- 定位 ---------------- */
/* 一级从锚点上方弹出（输入框在底部），二级与一级底部对齐并向上生长；
   右侧空间不足时二级翻到左侧，高度自适应但不超出视口上沿。 */
function pmLayout() {
    const a = pmState.anchor;
    if (!a || !pmState.root)
        return;
    /* body 有 zoom 时 rect 是视觉坐标、写入值是本地 CSS 坐标：用实测比值 k 换算
       （k 由主脚本 csViewportK 提供：视觉 = CSS × k；k=1 时行为与旧版完全一致） */
    const k = (typeof csViewportK === 'function' ? csViewportK() : 1) || 1;
    const r = a.getBoundingClientRect();
    const l1 = pmState.l1;
    l1.style.width = Math.round(PM_L1_WIDTH) + 'px';
    /* 先定宽再读高：确保 offsetHeight 反映当前内容（锚定一级菜单到加号上方） */
    void l1.offsetWidth;
    l1.style.left = Math.round(Math.max(8, r.left / k)) + 'px';
    l1.style.top = Math.round(Math.max(8, r.top / k - l1.offsetHeight - 8)) + 'px';
    const l2 = pmState.l2;
    if (!pmState.activeKey || pmState.activeKey === 'file') {
        l2.style.display = 'none';
        return;
    }
    l2.style.display = 'flex';
    l2.style.width = Math.round(PM_L2_WIDTH) + 'px';
    const r1 = l1.getBoundingClientRect();
    const availRight = window.innerWidth - r1.right - 8;
    const l2LeftCss = (availRight >= PM_L2_WIDTH * k + 6)
        ? r1.right / k + 6
        : Math.max(8, r1.left / k - 6 - PM_L2_WIDTH);
    l2.style.left = Math.round(l2LeftCss) + 'px';
    /* 二级底对齐一级底（视觉对齐，换算为本地 CSS top） */
    l2.style.top = Math.round(Math.max(8, r1.bottom / k - l2.offsetHeight)) + 'px';
    l2.style.maxHeight = Math.round(Math.max(160, (r1.bottom - 16) / k)) + 'px';
}
/* ---------------- 数据 ---------------- */
function pmLoad() {
    pmState.data = {};
    if (!Work.api.available()) {
        pmSpecsWithData().forEach(function (s) { pmState.data[s.key] = { error: tt('wPlusMenuNeedBackend') }; });
        pmPaintItems();
        return;
    }
    pmSpecsWithData().forEach(function (s) { pmState.data[s.key] = { loading: true }; });
    pmPaintItems();
    const ready = (Work.store && Work.store.ready) ? Work.store.ready() : Promise.resolve();
    Promise.resolve(ready).catch(function () { /* bootstrap 失败也继续单独拉列表 */ }).then(function () {
        pmSpecsWithData().forEach(function (s) {
            Work.api.fetch(s.endpoint).then(function (d) {
                pmState.data[s.key] = { items: s.list(d) };
                if (pmState.open && pmState.activeKey === s.key)
                    pmRenderL2(s.key);
                pmPaintItems();
            }).catch(function (e) {
                pmState.data[s.key] = { error: (e && e.message) || String(e) };
                if (pmState.open && pmState.activeKey === s.key)
                    pmRenderL2(s.key);
                pmPaintItems();
            });
        });
    });
}
/* ---------------- 激活 / 开关 ---------------- */
function pmSetActive(key) {
    if (!pmState.open)
        return;
    /* file 项不展开二级，但保留高亮表明当前悬停位置 */
    pmState.activeKey = key;
    pmPaintItems();
    if (!key || key === 'file') {
        pmState.l2.style.display = 'none';
        return;
    }
    pmRenderL2(key);
    pmLayout();
}
function pmOnDocDown(e) {
    if (!pmState.open)
        return;
    const t = e.target;
    if (pmState.root && pmState.root.contains(t))
        return;
    /* 锚点自身的点击交给 click 做 toggle，避免 mousedown 关闭后又被 click 重开 */
    if (pmState.anchor && pmState.anchor.contains(t))
        return;
    pmClose();
}
function pmOnKeyDown(e) {
    if (pmState.open && e.key === 'Escape')
        pmClose();
}
function pmClose() {
    if (!pmState.open)
        return;
    pmState.open = false;
    if (pmState.root)
        pmState.root.remove();
    pmState.root = null;
    pmState.l1 = null;
    pmState.l2 = null;
    pmState.itemNodes = {};
    pmState.activeKey = null;
    pmState.anchor = null;
    pmState.opts = null;
}
function pmOpen(opts) {
    pmClose();
    const o = opts || {};
    if (!o.anchor)
        return;
    const root = Work.el('div', '');
    root.id = 'plusMenuRoot';
    const l1 = Work.el('div', 'position: fixed; z-index: 200; box-sizing: border-box; padding: 6px;'
        + ' display: flex; flex-direction: column; gap: 1px; background: var(--menu-bg);'
        + ' border: 1px solid var(--menu-border); border-radius: 14px; box-shadow: var(--menu-shadow);');
    l1.className = 'plus-menu-l1';
    const l2 = Work.el('div', 'position: fixed; z-index: 200; box-sizing: border-box; padding: 6px;'
        + ' display: none; flex-direction: column; gap: 1px; overflow-y: auto; background: var(--menu-bg);'
        + ' border: 1px solid var(--menu-border); border-radius: 14px; box-shadow: var(--menu-shadow);');
    l2.className = 'plus-menu-l2';
    PM_SPECS.forEach(function (spec) {
        const node = pmMenuItem(spec);
        pmState.itemNodes[spec.key] = node;
        l1.appendChild(node);
    });
    if (!Work.api.available()) {
        /* 无后端：后三项置灰，仅保留上传文件 */
        pmSpecsWithData().forEach(function (s) {
            const node = pmState.itemNodes[s.key];
            if (node) {
                node.style.opacity = '0.45';
                node.title = tt('wPlusMenuNeedBackend');
            }
        });
    }
    root.appendChild(l1);
    root.appendChild(l2);
    document.body.appendChild(root);
    pmState.open = true;
    pmState.anchor = o.anchor;
    pmState.opts = o;
    pmState.root = root;
    pmState.l1 = l1;
    pmState.l2 = l2;
    pmState.activeKey = null;
    pmState.data = {};
    pmState.itemNodes = pmState.itemNodes || {};
    pmLayout();
    pmPaintItems();
    if (!pmState.bound) {
        document.addEventListener('mousedown', pmOnDocDown, true);
        document.addEventListener('keydown', pmOnKeyDown, true);
        window.addEventListener('scroll', pmClose, true);
        window.addEventListener('resize', pmLayout);
        pmState.bound = true;
    }
    pmLoad();
}
function pmToggle(opts) {
    const o = opts || {};
    if (pmState.open && pmState.anchor === o.anchor) {
        pmClose();
        return;
    }
    pmOpen(o);
}
Work.plusMenu = {
    open: pmOpen,
    toggle: pmToggle,
    close: pmClose,
    isOpen: function () { return pmState.open; },
    /* 供调用方在挂载状态变化后刷新二级勾选态 */
    refresh: function () {
        if (pmState.open && pmState.activeKey && pmState.activeKey !== 'file')
            pmRenderL2(pmState.activeKey);
    }
};
