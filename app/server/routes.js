"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountRoutes = mountRoutes;
const sse_1 = require("./sse");
function mountRoutes(app, ctx) {
    const log = ctx.log;
    /* ---------------- 总入口：前端注水 ---------------- */
    app.get('/api/work/bootstrap', function (req, res) {
        try {
            res.json({
                ok: true,
                work: ctx.store.all(),
                sandboxPolicy: ctx.sandbox.getPolicy(),
                runtimes: ctx.sandbox.detectRuntimes()
            });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
    /* ---------------- 沙箱 ---------------- */
    /* 单次执行（SSE）：queued → stdout/stderr 实时流 → end(ExecResult) */
    app.post('/api/work/sandbox/exec', function (req, res) {
        const body = req.body || {};
        const sse = (0, sse_1.openSse)(res);
        let finished = false;
        sse.send('queued', { scope: body.scopeId || 'global' });
        ctx.sandbox.execCode({
            scopeId: body.scopeId || 'global',
            lang: body.lang || 'python',
            code: body.code || '',
            args: body.args,
            policyOverride: body.policyOverride,
            onEvent: function (kind, delta) {
                sse.send(kind, { delta: delta });
            }
        }).then(function (result) {
            finished = true;
            sse.send('end', { result: result });
            sse.end({ ok: result.ok });
            log('sandbox exec scope=' + (body.scopeId || 'global') + ' lang=' + (body.lang || 'python')
                + ' ok=' + result.ok + ' dur=' + result.durationMs + 'ms files=' + result.files.length);
        }).catch(function (e) {
            finished = true;
            sse.send('error', { message: e.message });
            sse.end({ ok: false });
        });
        /* 正常完成也会触发 close：必须用 finished 区分，避免误报中断 */
        sse.onClientClose(function () {
            if (finished)
                return;
            log('sandbox exec aborted by client scope=' + (body.scopeId || 'global'));
            /* 子进程由 execCode 内部的 close 回调自然回收；这里仅记录 */
        });
    });
    /* 依赖安装（SSE 进度流） */
    app.post('/api/work/sandbox/install', function (req, res) {
        const body = req.body || {};
        const sse = (0, sse_1.openSse)(res);
        let finished = false;
        ctx.sandbox.installDeps({
            scopeId: body.scopeId || 'global',
            manager: body.manager || 'pip',
            packages: body.packages || []
        }, function (kind, delta) {
            sse.send(kind, { delta: delta });
        }).then(function (result) {
            finished = true;
            sse.send('end', { result: result });
            sse.end({ ok: result.ok });
        }).catch(function (e) {
            finished = true;
            sse.send('error', { message: e.message });
            sse.end({ ok: false });
        });
        sse.onClientClose(function () { if (!finished)
            log('sandbox install aborted by client'); });
    });
    app.get('/api/work/sandbox/runtimes', function (req, res) {
        try {
            res.json(ctx.sandbox.detectRuntimes(req.query.force === '1'));
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
    app.get('/api/work/sandbox/files', function (req, res) {
        try {
            res.json({ scope: req.query.scope || 'global', files: ctx.sandbox.listFiles(String(req.query.scope || 'global')) });
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.post('/api/work/sandbox/read', function (req, res) {
        try {
            const b = req.body || {};
            res.json(ctx.sandbox.readFile(b.scopeId || 'global', b.relPath, b.maxBytes));
        }
        catch (e) {
            res.status(400).json({ error: e.message, code: e.code });
        }
    });
    app.post('/api/work/sandbox/write', function (req, res) {
        try {
            const b = req.body || {};
            res.json(ctx.sandbox.writeFile(b.scopeId || 'global', b.relPath, b.content));
        }
        catch (e) {
            res.status(400).json({ error: e.message, code: e.code });
        }
    });
    app.post('/api/work/sandbox/delete', function (req, res) {
        try {
            const b = req.body || {};
            res.json(ctx.sandbox.deleteFile(b.scopeId || 'global', b.relPath));
        }
        catch (e) {
            res.status(400).json({ error: e.message, code: e.code });
        }
    });
    /* 产物下载：小图已走 dataUrl 内联，这里服务大文件与任意类型。
       不支持 ?token= 查询参数（token 会进日志），鉴权走请求头。 */
    app.get('/api/work/sandbox/file', function (req, res) {
        try {
            const f = ctx.sandbox.readScopeFile(String(req.query.scope || 'global'), String(req.query.path || ''));
            res.setHeader('Content-Type', f.mime);
            res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(f.name) + '"');
            res.setHeader('Cache-Control', 'no-store');
            res.end(f.buffer);
        }
        catch (e) {
            res.status(400).json({ error: e.message, code: e.code });
        }
    });
    app.post('/api/work/sandbox/reset', function (req, res) {
        try {
            res.json(ctx.sandbox.resetWorkspace((req.body || {}).scopeId || 'global'));
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.get('/api/work/sandbox/policy', function (req, res) {
        res.json(ctx.sandbox.getPolicy());
    });
    app.put('/api/work/sandbox/policy', function (req, res) {
        try {
            const merged = ctx.sandbox.setPolicy(req.body || {});
            ctx.store.setSection('sandboxPolicy', merged).then(function () {
                res.json(merged);
            });
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.post('/api/work/sandbox/gc', function (req, res) {
        try {
            res.json(ctx.sandbox.gcSandboxes((req.body || {}).maxAgeMs));
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    /* ---------------- Agent 运行（Qoder Agent SDK，SSE） ----------------
       SDK 承担 Agent 循环/工具调用/MCP；这里把 SDK 消息流桥接成本地 SSE 事件。
       客户端断开连接 = 中断（AbortController），前端的"中断"按钮直接 abort fetch。 */
    app.post('/api/work/agent/run', function (req, res) {
        const body = req.body || {};
        const sse = (0, sse_1.openSse)(res);
        let agentDef = body.agentDef || null;
        if (!agentDef && body.agentId) {
            agentDef = (ctx.store.section('agents') || []).find(function (a) { return a.id === body.agentId; }) || null;
        }
        if (!agentDef) {
            sse.send('error', { runId: '', message: '找不到智能体定义（agentId 或 agentDef）', fatal: true });
            sse.end({ ok: false });
            return;
        }
        if (!body.prompt || !String(body.prompt).trim()) {
            sse.send('error', { runId: '', message: 'prompt 为空', fatal: true });
            sse.end({ ok: false });
            return;
        }
        /* 客户端断开 = 中断：AbortController 传给 SDK，终止整条运行 */
        let runFinished = false;
        const abortCtl = new AbortController();
        sse.onClientClose(function () {
            if (!runFinished) {
                ctx.log && ctx.log('agent run aborted by client conv=' + body.convId);
                abortCtl.abort();
            }
        });
        ctx.qoder.runWorkTurn({
            agentDef: agentDef,
            prompt: String(body.prompt),
            resumeSessionId: body.resumeSessionId || null,
            convId: body.convId || null,
            scopeId: body.scopeId || 'global',
            workspaceRoot: body.workspaceRoot || null,
            permissionMode: body.permissionMode || null,
            signal: abortCtl.signal
        }, function (evt, data) { sse.send(evt, data); }).then(function (result) {
            runFinished = true;
            sse.send('run_result', { result: result });
            sse.end({ ok: result.ok });
            ctx.log && ctx.log('qoder run done conv=' + body.convId + ' ok=' + result.ok
                + ' turns=' + result.numTurns + ' toolCalls=' + result.toolCalls
                + ' total=' + result.durationMs + 'ms session=' + (result.sessionId || ''));
        }).catch(function (e) {
            runFinished = true;
            sse.send('error', { runId: '', message: e.message, fatal: true });
            sse.end({ ok: false });
            ctx.log && ctx.log('qoder run failed conv=' + body.convId + ' err=' + e.message);
        });
    });
    /* SDK 状态与连通性自检 */
    app.get('/api/work/qoder/config', function (req, res) { res.json(ctx.qoder.config()); });
    app.post('/api/work/qoder/ping', function (req, res) { ctx.qoder.ping().then(function (r) { res.json(r); }); });
    /* ---------------- 技能（SDK local plugin 承载） ---------------- */
    app.get('/api/work/skills', function (req, res) {
        try {
            res.json({ skills: ctx.qoder.listSkills(), states: ctx.store.section('skills') });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
    app.get('/api/work/skills/item', function (req, res) {
        try {
            res.json(ctx.qoder.readSkill(String(req.query.slug)) || {});
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.post('/api/work/skills/save', function (req, res) {
        try {
            const b = req.body || {};
            res.json(ctx.qoder.writeSkill(b.slug, { name: b.name || b.slug, description: b.description || '' }, b.content || ''));
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.post('/api/work/skills/delete', function (req, res) {
        try {
            res.json(ctx.qoder.deleteSkill((req.body || {}).slug));
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.put('/api/work/skills/states', function (req, res) {
        try {
            ctx.store.setSection('skills', req.body || {}).then(function () { res.json({ ok: true }); });
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    /* ---------------- MCP 连接器（配置结构对齐 SDK McpServerConfig，直接透传） ---------------- */
    app.get('/api/work/mcp/servers', function (req, res) {
        res.json({ servers: ctx.store.section('mcpServers') });
    });
    app.put('/api/work/mcp/servers', function (req, res) {
        try {
            const list = Array.isArray(req.body && req.body.servers) ? req.body.servers : [];
            ctx.store.setSection('mcpServers', list).then(function () { res.json({ ok: true, servers: list }); });
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    /* ---------------- 智能体 CRUD ---------------- */
    app.get('/api/work/agents', function (req, res) {
        res.json({ agents: ctx.store.section('agents') });
    });
    app.put('/api/work/agents', function (req, res) {
        try {
            const list = Array.isArray(req.body && req.body.agents) ? req.body.agents : [];
            ctx.store.setSection('agents', list).then(function () { res.json({ ok: true, agents: list }); });
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    /* ---------------- 知识库索引（前端推送解析文本；BM25 检索由 kb_search 工具承担） ---------------- */
    app.post('/api/work/kb/index', function (req, res) {
        try {
            const b = req.body || {};
            if (!b.kbId || !b.fileName) {
                res.status(400).json({ error: 'kbId 与 fileName 必填' });
                return;
            }
            if (typeof b.text !== 'string' || b.text.length > 2 * 1024 * 1024) {
                res.status(400).json({ error: 'text 缺失或超过 2MB' });
                return;
            }
            res.json(ctx.kb.indexFile(b));
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.post('/api/work/kb/remove', function (req, res) {
        try {
            res.json(ctx.kb.removeFile((req.body || {}).kbId, (req.body || {}).fileName));
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.get('/api/work/kb/status', function (req, res) {
        try {
            res.json(ctx.kb.status());
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
    /* ---------------- 运行页历史 ---------------- */
    app.get('/api/work/run-history', function (req, res) {
        res.json({ runHistory: ctx.store.section('runHistory') });
    });
    app.put('/api/work/run-history', function (req, res) {
        try {
            const hist = Array.isArray(req.body && req.body.runHistory) ? req.body.runHistory.slice(0, 20) : [];
            ctx.store.setSection('runHistory', hist).then(function () { res.json({ ok: true }); });
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    /* ---------------- 笔记（Agent 的 note_write 与笔记本页共用） ---------------- */
    app.get('/api/work/notes', function (req, res) {
        try {
            res.json({ notes: ctx.notes.list() });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
    app.post('/api/work/notes', function (req, res) {
        try {
            res.json(ctx.notes.upsert(req.body || {}));
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.post('/api/work/notes/delete', function (req, res) {
        try {
            res.json(ctx.notes.remove((req.body || {}).id));
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.get('/api/work/notes/item', function (req, res) {
        try {
            res.json(ctx.notes.get(String(req.query.id)) || {});
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
}
