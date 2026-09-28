/* ==================================================================
   routes.ts · Work 模式 HTTP 路由
   全部挂在既有 /api/* Bearer token 鉴权中间件之后（见 index.ts）。
   ctx 由 index.ts 装配：{ appRoot, log, store, sandbox, notes, kb, qoder }
   ================================================================== */
import * as fs from 'fs';
import * as path from 'path';
import type { Express, Request, Response } from 'express';
import { openSse } from './sse';
import { listMemories, deleteMemoryScope, readUserHooks, listWorktrees, normalizePrefs } from './userdata';
import type { KbIndexRequest, WorkCtx } from '../shared/domain';

/* 请求体由前端控制，结构宽松；这里统一收窄为索引类型 */
type Body = Record<string, any>;

export function mountRoutes(app: Express, ctx: WorkCtx): void {
  const log = ctx.log;

  /* ---------------- 总入口：前端注水 ---------------- */
  app.get('/api/work/bootstrap', async function (req: Request, res: Response) {
    try {
      res.json({
        ok: true,
        work: ctx.store.all(),
        sandboxPolicy: ctx.sandbox.getPolicy(),
        runtimes: ctx.sandbox.detectRuntimes(),
        byokModels: await ctx.qoder.byokModelsReady()
      });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  /* ---------------- 沙箱 ---------------- */

  /* 单次执行（SSE）：queued → stdout/stderr 实时流 → end(ExecResult) */
  app.post('/api/work/sandbox/exec', function (req: Request, res: Response) {
    const body: Body = req.body || {};
    const sse = openSse(res);
    let finished = false;
    sse.send('queued', { scope: body.scopeId || 'global' });
    ctx.sandbox.execCode({
      scopeId: body.scopeId || 'global',
      lang: body.lang || 'python',
      code: body.code || '',
      args: body.args,
      policyOverride: body.policyOverride,
      onEvent: function (kind: string, delta: string) {
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
      sse.send('error', { message: (e as Error).message });
      sse.end({ ok: false });
    });
    /* 正常完成也会触发 close：必须用 finished 区分，避免误报中断 */
    sse.onClientClose(function () {
      if (finished) return;
      log('sandbox exec aborted by client scope=' + (body.scopeId || 'global'));
      /* 子进程由 execCode 内部的 close 回调自然回收；这里仅记录 */
    });
  });

  /* 依赖安装（SSE 进度流） */
  app.post('/api/work/sandbox/install', function (req: Request, res: Response) {
    const body: Body = req.body || {};
    const sse = openSse(res);
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
      sse.send('error', { message: (e as Error).message });
      sse.end({ ok: false });
    });
    sse.onClientClose(function () { if (!finished) log('sandbox install aborted by client'); });
  });

  app.get('/api/work/sandbox/runtimes', function (req: Request, res: Response) {
    try { res.json(ctx.sandbox.detectRuntimes(req.query.force === '1')); }
    catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.get('/api/work/sandbox/files', function (req: Request, res: Response) {
    try { res.json({ scope: req.query.scope || 'global', files: ctx.sandbox.listFiles(String(req.query.scope || 'global')) }); }
    catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  app.post('/api/work/sandbox/read', function (req: Request, res: Response) {
    try {
      const b: Body = req.body || {};
      res.json(ctx.sandbox.readFile(b.scopeId || 'global', b.relPath, b.maxBytes));
    } catch (e) { res.status(400).json({ error: (e as Error).message, code: (e as NodeJS.ErrnoException).code }); }
  });

  app.post('/api/work/sandbox/write', function (req: Request, res: Response) {
    try {
      const b: Body = req.body || {};
      res.json(ctx.sandbox.writeFile(b.scopeId || 'global', b.relPath, b.content));
    } catch (e) { res.status(400).json({ error: (e as Error).message, code: (e as NodeJS.ErrnoException).code }); }
  });

  app.post('/api/work/sandbox/delete', function (req: Request, res: Response) {
    try {
      const b: Body = req.body || {};
      res.json(ctx.sandbox.deleteFile(b.scopeId || 'global', b.relPath));
    } catch (e) { res.status(400).json({ error: (e as Error).message, code: (e as NodeJS.ErrnoException).code }); }
  });

  /* 产物下载：小图已走 dataUrl 内联，这里服务大文件与任意类型。
     不支持 ?token= 查询参数（token 会进日志），鉴权走请求头。 */
  app.get('/api/work/sandbox/file', function (req: Request, res: Response) {
    try {
      const f = ctx.sandbox.readScopeFile(String(req.query.scope || 'global'), String(req.query.path || ''));
      res.setHeader('Content-Type', f.mime);
      res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(f.name) + '"');
      res.setHeader('Cache-Control', 'no-store');
      res.end(f.buffer);
    } catch (e) { res.status(400).json({ error: (e as Error).message, code: (e as NodeJS.ErrnoException).code }); }
  });

  app.post('/api/work/sandbox/reset', function (req: Request, res: Response) {
    try { res.json(ctx.sandbox.resetWorkspace((req.body || {}).scopeId || 'global')); }
    catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  app.get('/api/work/sandbox/policy', function (req: Request, res: Response) {
    res.json(ctx.sandbox.getPolicy());
  });

  app.put('/api/work/sandbox/policy', function (req: Request, res: Response) {
    try {
      const merged = ctx.sandbox.setPolicy(req.body || {});
      ctx.store.setSection('sandboxPolicy', merged).then(function () {
        res.json(merged);
      });
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  app.post('/api/work/sandbox/gc', function (req: Request, res: Response) {
    try { res.json(ctx.sandbox.gcSandboxes((req.body || {}).maxAgeMs)); }
    catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  /* ---------------- Agent 运行（Qoder Agent SDK，SSE） ----------------
     SDK 承担 Agent 循环/工具调用/MCP；这里把 SDK 消息流桥接成本地 SSE 事件。
     客户端断开连接 = 中断（AbortController），前端的"中断"按钮直接 abort fetch。 */
  app.post('/api/work/agent/run', function (req: Request, res: Response) {
    const body: Body = req.body || {};
    const sse = openSse(res);

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
      signal: abortCtl.signal,
      /* 项目记忆：Work 项目下的任务带 projectId——回合前确保记忆就绪 +
         注册 Stop 记忆决策 hook（模型自主决定是否更新） */
      projectId: body.projectId || null,
      projectName: body.projectName || null,
      taskTitle: body.taskTitle || null
    }, function (evt, data) { sse.send(evt, data as Record<string, unknown>); }).then(function (result) {
      runFinished = true;
      sse.send('run_result', { result: result });
      sse.end({ ok: result.ok });
      ctx.log && ctx.log('qoder run done conv=' + body.convId + ' ok=' + result.ok
        + ' turns=' + result.numTurns + ' toolCalls=' + result.toolCalls
        + ' total=' + result.durationMs + 'ms session=' + (result.sessionId || ''));
    }).catch(function (e) {
      runFinished = true;
      sse.send('error', { runId: '', message: (e as Error).message, fatal: true });
      sse.end({ ok: false });
      ctx.log && ctx.log('qoder run failed conv=' + body.convId + ' err=' + (e as Error).message);
    });
  });

  /* ---------------- 项目记忆（data/projects/<id>/memory/） ----------------
     前端在项目创建 / 任务创建时调用（幂等）；agent/run 侧也有就绪保障，
     两端任一失败都不阻断——记忆是增强不是闸门。 */
  app.post('/api/work/memory/project', function (req: Request, res: Response) {
    const body: Body = req.body || {};
    const projectId = String(body.projectId || '');
    if (!projectId) { res.status(400).json({ error: 'projectId required' }); return; }
    try {
      const r = ctx.memory.ensureProject(projectId, String(body.name || ''));
      res.json({ ok: true, projectId: projectId, dir: r.dir, readme: r.readme, created: r.created });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.post('/api/work/memory/task', function (req: Request, res: Response) {
    const body: Body = req.body || {};
    const projectId = String(body.projectId || '');
    const taskId = String(body.taskId || '');
    if (!projectId || !taskId) { res.status(400).json({ error: 'projectId & taskId required' }); return; }
    try {
      const r = ctx.memory.ensureTask(projectId, taskId, String(body.title || ''), String(body.projectName || ''));
      res.json({ ok: true, projectId: projectId, taskId: taskId, file: r.file, created: r.created });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.get('/api/work/memory/task', function (req: Request, res: Response) {
    const projectId = String(req.query.projectId || '');
    const taskId = String(req.query.taskId || '');
    if (!projectId || !taskId) { res.status(400).json({ error: 'projectId & taskId required' }); return; }
    try {
      const r = ctx.memory.readTask(projectId, taskId);
      res.json({ ok: true, projectId: projectId, taskId: taskId, exists: r.exists, content: r.content, path: r.path });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.get('/api/work/memory/project', function (req: Request, res: Response) {
    const projectId = String(req.query.projectId || '');
    if (!projectId) { res.status(400).json({ error: 'projectId required' }); return; }
    try {
      const r = ctx.memory.readProject(projectId);
      res.json({ ok: true, projectId: projectId, exists: r.exists, content: r.content, path: r.path, tasks: r.tasks });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  /* SDK 状态与连通性自检 */
  app.get('/api/work/qoder/config', function (req: Request, res: Response) { res.json(ctx.qoder.config()); });
  app.post('/api/work/qoder/ping', function (req: Request, res: Response) { ctx.qoder.ping().then(function (r) { res.json(r); }); });

  /* ---------------- 技能（SDK local plugin 承载） ---------------- */
  app.get('/api/work/skills', function (req: Request, res: Response) {
    try { res.json({ skills: ctx.qoder.listSkills(), states: ctx.store.section('skills') }); }
    catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });
  app.get('/api/work/skills/item', function (req: Request, res: Response) {
    try { res.json(ctx.qoder.readSkill(String(req.query.slug)) || {}); }
    catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });
  app.post('/api/work/skills/save', function (req: Request, res: Response) {
    try {
      const b: Body = req.body || {};
      res.json(ctx.qoder.writeSkill(b.slug, { name: b.name || b.slug, description: b.description || '' }, b.content || ''));
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });
  app.post('/api/work/skills/delete', function (req: Request, res: Response) {
    try { res.json(ctx.qoder.deleteSkill((req.body || {}).slug)); }
    catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });
  app.put('/api/work/skills/states', function (req: Request, res: Response) {
    try {
      ctx.store.setSection('skills', req.body || {}).then(function () { res.json({ ok: true }); });
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  /* ---------------- MCP 连接器（配置结构对齐 SDK McpServerConfig，直接透传） ---------------- */
  app.get('/api/work/mcp/servers', function (req: Request, res: Response) {
    res.json({ servers: ctx.store.section('mcpServers') });
  });
  app.put('/api/work/mcp/servers', function (req: Request, res: Response) {
    try {
      const list = Array.isArray(req.body && req.body.servers) ? req.body.servers : [];
      ctx.store.setSection('mcpServers', list).then(function () { res.json({ ok: true, servers: list }); });
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  /* ---------------- 智能体 CRUD ---------------- */
  app.get('/api/work/agents', function (req: Request, res: Response) {
    res.json({ agents: ctx.store.section('agents') });
  });
  app.put('/api/work/agents', function (req: Request, res: Response) {
    try {
      const list = Array.isArray(req.body && req.body.agents) ? req.body.agents : [];
      ctx.store.setSection('agents', list).then(function () { res.json({ ok: true, agents: list }); });
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  /* ---------------- 墨道子智能体（可编辑/可添加，不可删除） ----------------
     upsert 语义：id 存在则更新（builtin 允许编辑全部业务字段），不存在则添加。
     删除：仅用户自建（builtin=false）可删；内建七类不可删。 */
  app.put('/api/work/subagents', function (req: Request, res: Response) {
    try {
      const b: Body = req.body || {};
      const rec = (b.subagent || {}) as Record<string, unknown>;
      const name = String(rec.name || '').trim();
      if (!name) { res.status(400).json({ error: '子智能体名称必填' }); return; }
      ctx.store.update('subagents', function (list) {
        const arr = Array.isArray(list) ? list : [];
        let id = String(rec.id || '').trim();
        if (!id) id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        const item = {
          id: id,
          name: name,
          whenToUse: String(rec.whenToUse || ''),
          prompt: String(rec.prompt || ''),
          sdkTools: Array.isArray(rec.sdkTools) ? rec.sdkTools.map(String).filter(function (t) { return t !== 'Agent'; }) : [],
          scienceTools: Array.isArray(rec.scienceTools) ? rec.scienceTools.map(String) : [],
          skills: Array.isArray(rec.skills) ? rec.skills.map(String) : [],
          maxTurns: Math.min(Math.max(parseInt(String(rec.maxTurns), 10) || 12, 1), 64),
          permissionMode: ['default', 'acceptEdits', 'plan'].indexOf(String(rec.permissionMode)) > -1 ? String(rec.permissionMode) : 'default',
          model: String(rec.model || 'inherit'),
          builtin: !!rec.builtin
        };
        const i = arr.findIndex(function (a) { return a.id === id; });
        if (i > -1) arr[i] = item; else arr.push(item);
        return arr;
      }).then(function () { res.json({ ok: true, subagents: ctx.store.section('subagents') }); })
        .catch(function (e) { res.status(400).json({ error: (e as Error).message }); });
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  /* 删除用户自建子智能体：builtin 拒绝；墨道下次回合起不再注册该委派项 */
  app.delete('/api/work/subagents', function (req: Request, res: Response) {
    try {
      const id = String((req.query && req.query.id) || (req.body && (req.body as Body).id) || '');
      const cur = ctx.store.section('subagents') || [];
      const hit = cur.find(function (s) { return s.id === id; });
      if (!hit) { res.status(404).json({ error: '子智能体不存在' }); return; }
      if (hit.builtin) { res.status(400).json({ error: '内建子智能体不可删除' }); return; }
      ctx.store.update('subagents', function (list) {
        return (list || []).filter(function (s) { return s.id !== id; });
      }).then(function () { res.json({ ok: true, deleted: id, subagents: ctx.store.section('subagents') }); })
        .catch(function (e) { res.status(500).json({ error: (e as Error).message }); });
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  /* ---------------- 领域插件（科研外挂：agents/skills/commands/.mcp.json） ---------------- */
  app.get('/api/work/plugins', function (req: Request, res: Response) {
    try { res.json({ plugins: ctx.qoder.domainPlugins() }); }
    catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });
  app.put('/api/work/plugins', function (req: Request, res: Response) {
    try {
      const b: Body = req.body || {};
      const key = String(b.key || '');
      if (!key) { res.status(400).json({ error: 'key 必填' }); return; }
      ctx.qoder.setDomainPluginEnabled(key, b.enabled !== false)
        .then(function (plugins) { res.json({ ok: true, plugins: plugins }); })
        .catch(function (e) { res.status(400).json({ error: (e as Error).message }); });
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });
  /* 用户上传插件（2026-09-16）：写入 data/plugins/<key>/；重启后在插件清单中出现 */
  app.post('/api/work/plugins/save', function (req: Request, res: Response) {
    try {
      const b: Body = req.body || {};
      const files = Array.isArray(b.files) ? b.files : [];
      res.json(ctx.qoder.createPlugin(String(b.key || ''), files));
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });
  /* 插件使用文档（README.md 正文，前端渲染） */
  app.get('/api/work/plugins/item', function (req: Request, res: Response) {
    try {
      const key = String(req.query.key || '');
      const hit = ctx.qoder.domainPlugins().find(function (p) { return p.key === key; });
      if (!hit) { res.status(404).json({ error: '插件不存在' }); return; }
      const readme = path.join(hit.dir, 'README.md');
      res.json({
        key: hit.key,
        markdown: hit.hasReadme && fs.existsSync(readme) ? fs.readFileSync(readme, 'utf8') : ''
      });
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  /* ---------------- 知识库索引（前端推送解析文本；BM25 检索由 kb_search 工具承担） ---------------- */
  app.post('/api/work/kb/index', function (req: Request, res: Response) {
    try {
      const b: Body = req.body || {};
      if (!b.kbId || !b.fileName) { res.status(400).json({ error: 'kbId 与 fileName 必填' }); return; }
      if (typeof b.text !== 'string' || b.text.length > 2 * 1024 * 1024) { res.status(400).json({ error: 'text 缺失或超过 2MB' }); return; }
      res.json(ctx.kb.indexFile(b as KbIndexRequest));
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  app.post('/api/work/kb/remove', function (req: Request, res: Response) {
    try { res.json(ctx.kb.removeFile((req.body || {}).kbId, (req.body || {}).fileName)); }
    catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  app.get('/api/work/kb/status', function (req: Request, res: Response) {
    try { res.json(ctx.kb.status()); }
    catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  /* ---------------- 运行页历史 ---------------- */
  app.get('/api/work/run-history', function (req: Request, res: Response) {
    res.json({ runHistory: ctx.store.section('runHistory') });
  });

  app.put('/api/work/run-history', function (req: Request, res: Response) {
    try {
      const hist = Array.isArray(req.body && req.body.runHistory) ? req.body.runHistory.slice(0, 20) : [];
      ctx.store.setSection('runHistory', hist).then(function () { res.json({ ok: true }); });
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  /* ---------------- 笔记（Agent 的 note_write 与笔记本页共用） ---------------- */
  app.get('/api/work/notes', function (req: Request, res: Response) {
    try { res.json({ notes: ctx.notes.list() }); }
    catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.post('/api/work/notes', function (req: Request, res: Response) {
    try { res.json(ctx.notes.upsert(req.body || {})); }
    catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  app.post('/api/work/notes/delete', function (req: Request, res: Response) {
    try { res.json(ctx.notes.remove((req.body || {}).id)); }
    catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  app.get('/api/work/notes/item', function (req: Request, res: Response) {
    try { res.json(ctx.notes.get(String(req.query.id)) || {}); }
    catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  /* ---------------- 设置页偏好（后端持久化，替代前端 localStorage） ---------------- */
  app.get('/api/work/prefs', function (req: Request, res: Response) {
    try { res.json({ ok: true, prefs: ctx.store.section('prefs') }); }
    catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.put('/api/work/prefs', function (req: Request, res: Response) {
    try {
      const cur = ctx.store.section('prefs');
      const next = normalizePrefs(req.body || {}, cur);
      ctx.store.setSection('prefs', next).then(function () { res.json({ ok: true, prefs: next }); });
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });

  /* ---------------- 用户级 Qoder 数据（记忆 / 钩子 / worktrees） ---------------- */

  /* 记忆清单：全局 + 各项目（真实扫描 ~/.qoder-cn，不虚报） */
  app.get('/api/work/qoder/memories', function (req: Request, res: Response) {
    try { res.json({ ok: true, memories: listMemories() }); }
    catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  /* 记忆删除（软删除：整体移入系统临时目录，可找回） */
  app.post('/api/work/qoder/memories/delete', function (req: Request, res: Response) {
    try {
      const body: Body = req.body || {};
      const scope = body.scope === 'project' ? 'project' : 'global';
      const err = deleteMemoryScope(scope, scope === 'project' ? String(body.slug || '') : undefined);
      if (err) res.status(400).json({ error: err });
      else res.json({ ok: true, memories: listMemories() });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  /* 用户级 settings.json 中声明的 Hooks（只读反映磁盘配置） */
  app.get('/api/work/qoder/hooks', function (req: Request, res: Response) {
    try { res.json({ ok: true, hooks: readUserHooks() }); }
    catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  /* 指定仓库的 git worktree 列表（只读；repo=工作区绝对路径） */
  app.get('/api/work/worktrees', function (req: Request, res: Response) {
    try { res.json({ ok: true, worktrees: listWorktrees(String(req.query.repo || '')) }); }
    catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });
}
