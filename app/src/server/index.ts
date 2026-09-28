/* ==================================================================
   ChatScience 桌面版 · 本地后端服务
   - 绑定 127.0.0.1（不对外暴露）
   - /api/* 需要 Bearer token（启动时随机生成，经 URL 注入渲染进程）
   - /api/state：状态快照读写（与主进程 IPC 共用同一 state.json，原子写入）
   - /api/chat：AI 流式代理（SSE）
   - 静态托管 renderer/
   ================================================================== */
import express, { type Request, type Response, type NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import type { Server } from 'http';
import { chatStream, resolveProvider, applyThinking } from './ai';
import * as storeMod from './store';
import * as sandboxMod from './sandbox';
import * as notesMod from './notes';
import * as kbMod from './kb';
import * as memoryMod from './memory';
import * as qoderMod from './qoder';
import * as routesMod from './routes';
import type { WorkCtx, QoderApi, AiConfigFile, ChatStreamOptions, ChatRequestFields } from '../shared/domain';

type Body = Record<string, any>;

export interface ServerHandle {
  stop(): void;
}

function log(appRoot: string, line: string): void {
  try {
    fs.mkdirSync(path.join(appRoot, 'data'), { recursive: true });
    fs.appendFileSync(path.join(appRoot, 'data', 'server.log'), new Date().toISOString() + ' ' + line + '\n');
  } catch (e) { /* 忽略 */ }
}

function readAiConfig(appRoot: string): AiConfigFile {
  try { return JSON.parse(fs.readFileSync(path.join(appRoot, 'server', 'config.json'), 'utf8')) as AiConfigFile; }
  catch (e) { return {}; }
}

export function startServer(
  portCandidates: number | number[],
  token: string,
  appRoot: string,
  onPort?: (port: number) => void
): ServerHandle {
  const app = express();
  const STATE_FILE = path.join(appRoot, 'data', 'state.json');
  app.use(express.json({ limit: '40mb' }));

  /* CORS：渲染层可能以 file://（origin null）或 http 加载，API 已有 token 鉴权，放开跨源 */
  app.use(function (req: Request, res: Response, next: NextFunction) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    next();
  });

  /* 鉴权：所有 /api/* 需要 Bearer token */
  app.use('/api', function (req: Request, res: Response, next: NextFunction) {
    const auth = req.headers.authorization || '';
    if (auth !== 'Bearer ' + token) { res.status(401).json({ error: 'unauthorized' }); return; }
    next();
  });

  app.get('/api/health', function (req: Request, res: Response) { res.json({ ok: true, ts: Date.now(), pid: process.pid }); });

  /* ---------------- Work 模式能力装配 ----------------
     顺序：CORS → token 鉴权（上面两个 app.use）→ Work 路由 → 既有 API。 */
  const store = storeMod.createStore(appRoot, function (line) { log(appRoot, line); });
  const sandbox = sandboxMod.createSandbox(appRoot, {
    log: function (line) { log(appRoot, line); },
    policy: store.section('sandboxPolicy')
  });
  const workCtx: WorkCtx = {
    appRoot: appRoot, token: token, log: function (line) { log(appRoot, line); },
    store: store, sandbox: sandbox,
    notes: notesMod.createNotes(appRoot),
    kb: kbMod.createKb(appRoot),   /* N6：知识库 BM25 词法检索索引（前端推送文本） */
    /* 项目记忆：data/projects/<projectId>/memory/（任务 md + Stop 决策 hook） */
    memory: memoryMod.createMemory(appRoot, function (line) { log(appRoot, line); }),
    qoder: undefined as unknown as QoderApi
  };
  /* Qoder Agent SDK：Work 模式的 Agent 底座（循环/工具调用/MCP/模型均由 SDK 承担） */
  workCtx.qoder = qoderMod.createQoder(appRoot, workCtx);
  routesMod.mountRoutes(app, workCtx);

  /* 播种内建智能体：启动时查漏补齐（新内建自动加入）；不覆盖既有定义——
     用户经管理页对墨道/墨析的编辑是最终事实。迁移：已废弃的内建智能体
     （BUILTIN_AGENTS 清单之外，功能已迁入墨道子智能体体系）从 work.json 移除。 */
  (function () {
    store.update('agents', function (list) {
      const arr = Array.isArray(list) ? list : [];
      let changed = false;
      qoderMod.BUILTIN_AGENTS.forEach(function (b) {
        const hit = arr.find(function (a) { return a.id === b.id; });
        if (!hit) { arr.push(JSON.parse(JSON.stringify(b))); changed = true; }
      });
      const builtinIds = qoderMod.BUILTIN_AGENTS.map(function (b) { return b.id; });
      const kept = arr.filter(function (a) { return !(a.builtin && builtinIds.indexOf(a.id) === -1); });
      if (kept.length !== arr.length) { changed = true; arr.length = 0; kept.forEach(function (a) { arr.push(a); }); }
      return changed ? arr : undefined;   /* 无变化不落盘 */
    }).then(function () {
      if (!store.section('seeded')) return store.setSection('seeded', true);
      return undefined;
    }).catch(function (e) { log(appRoot, 'seed agents failed: ' + (e as Error).message); });
  })();
  try { sandbox.gcSandboxes(); } catch (e) { log(appRoot, 'sandbox gc failed: ' + (e as Error).message); }

  app.get('/api/state', function (req: Request, res: Response) {
    try { res.type('json').send(fs.readFileSync(STATE_FILE, 'utf8')); }
    catch (e) { res.json(null); }
  });

  app.post('/api/state', function (req: Request, res: Response) {
    try {
      fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
      const tmp = STATE_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(req.body), 'utf8');
      fs.renameSync(tmp, STATE_FILE);
      res.json({ ok: true, ts: Date.now() });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  /* ---------------- 工作区文件扫描 / 读取（AI 阅读模式数据源） ---------------- */
  const WS_SCAN_EXTS = new Set(['pdf', 'docx', 'md', 'html', 'xlsx', 'xls', 'csv']);
  const WS_SKIP_DIRS = new Set(['node_modules', '.git', '.svn', 'dist', 'build', '__pycache__', '.venv', 'venv', '.idea', '.vscode']);
  function extOf(name: string): string {
    const i = name.lastIndexOf('.');
    return i > -1 ? name.slice(i + 1).toLowerCase() : '';
  }
  app.get('/api/fs/list', function (req: Request, res: Response) {
    const dir = String(req.query.dir || '');
    let root: string;
    try { root = fs.realpathSync(dir); } catch (e) { res.status(400).json({ error: 'dir not found' }); return; }
    let stat: fs.Stats;
    try { stat = fs.statSync(root); } catch (e) { res.status(400).json({ error: 'dir not found' }); return; }
    if (!stat.isDirectory()) { res.status(400).json({ error: 'not a directory' }); return; }
    const files: { name: string; ext: string; size: number; path: string }[] = [];
    const MAX = 400;
    (function walk(d: string, depth: number): void {
      if (depth > 3 || files.length >= MAX) return;
      let entries: fs.Dirent[];
      try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
      entries.sort(function (a, b) { return a.name.localeCompare(b.name); });
      entries.forEach(function (en) {
        if (files.length >= MAX) return;
        if (en.name.startsWith('.')) return;
        const full = path.join(d, en.name);
        if (en.isDirectory()) {
          if (!WS_SKIP_DIRS.has(en.name)) walk(full, depth + 1);
          return;
        }
        if (!en.isFile()) return;
        const ext = extOf(en.name);
        if (!WS_SCAN_EXTS.has(ext)) return;
        let size = 0;
        try { size = fs.statSync(full).size; } catch (e) { /* 忽略 */ }
        files.push({ name: en.name, ext: ext, size: size, path: full });
      });
    })(root, 0);
    res.json({ dir: root, files: files });
  });

  const WS_MIME: Record<string, string> = { pdf: 'application/pdf', html: 'text/html; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
  app.get('/api/fs/raw', function (req: Request, res: Response) {
    const p = String(req.query.path || '');
    let real: string;
    try { real = fs.realpathSync(p); } catch (e) { res.status(400).json({ error: 'file not found' }); return; }
    let st: fs.Stats;
    try { st = fs.statSync(real); } catch (e) { res.status(400).json({ error: 'file not found' }); return; }
    if (!st.isFile() || st.size > 64 * 1024 * 1024) { res.status(400).json({ error: 'not a readable file' }); return; }
    res.setHeader('Content-Type', WS_MIME[extOf(real)] || 'application/octet-stream');
    fs.createReadStream(real).pipe(res);
  });

  /* AI 流式代理 */
  app.post('/api/chat', async function (req: Request, res: Response) {
    const body: Body = req.body || {};
    const model = body.model;
    const messages = body.messages;
    if (!model || !Array.isArray(messages) || !messages.length) {
      res.status(400).json({ error: 'bad request: model & messages required' });
      return;
    }
    const cfg = readAiConfig(appRoot);
    const key = body.apiKey || cfg.apiKey;
    if (!key) { res.status(400).json({ error: 'missing api key (config.json or request body)' }); return; }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    const t0 = Date.now();
    let firstDeltaMs: number | null = null;
    let full = '';
    const t0Write = () => res.write('data: ' + JSON.stringify({ delta: '' }) + '\n\n');
    t0Write();
    try {
      const chatOpts: ChatStreamOptions & ChatRequestFields = {
        providerId: body.providerId || cfg.providerId || 'bailian',
        model: model,
        apiKey: key,
        messages: messages,
        temperature: body.temperature,
        web: body.web !== false
      };
      /* 思考开关：前端显式传布尔时按厂商官方参数注入（Chat 默认不思考） */
      if (typeof body.thinking === 'boolean') {
        applyThinking(chatOpts, resolveProvider(chatOpts.providerId), body.thinking === true);
      }
      await chatStream(chatOpts, function (ev) {
        if (ev.type === 'reasoning') {
          res.write('data: ' + JSON.stringify({ reasoning: ev.text }) + '\n\n');
          return;
        }
        if (firstDeltaMs === null) firstDeltaMs = Date.now() - t0;
        full += ev.text;
        res.write('data: ' + JSON.stringify({ delta: ev.text }) + '\n\n');
      });
      log(appRoot, 'chat ok model=' + model + ' ttft=' + firstDeltaMs + 'ms chars=' + full.length + ' total=' + (Date.now() - t0) + 'ms');
      res.write('data: ' + JSON.stringify({ done: true, ttftMs: firstDeltaMs, totalMs: Date.now() - t0, chars: full.length }) + '\n\n');
    } catch (e) {
      log(appRoot, 'chat fail model=' + model + ' err=' + (e as Error).message);
      res.write('data: ' + JSON.stringify({ error: (e as Error).message }) + '\n\n');
    }
    res.write('data: [DONE]\n\n');
    res.end();
  });

  /* 渲染层静态托管 */
  app.use(express.static(path.join(appRoot, 'renderer')));

  /* 依次尝试候选端口（Windows 保留端口段会导致 EACCES，自动回退） */
  const ports = Array.isArray(portCandidates) ? portCandidates : [portCandidates];
  let activeServer: Server | null = null;
  function tryListen(i: number): void {
    if (i >= ports.length) {
      log(appRoot, 'SERVER LISTEN ERROR: all candidate ports failed: ' + ports.join(','));
      return;
    }
    const port = ports[i];
    const server = app.listen(port, '127.0.0.1', function () {
      log(appRoot, 'server listening on 127.0.0.1:' + port);
      console.log('[server] listening on 127.0.0.1:' + port);
      activeServer = server;
      if (onPort) onPort(port);
    });
    server.on('error', function (e) {
      log(appRoot, 'listen failed on ' + port + ': ' + e.message);
      console.error('[server] listen error on ' + port, e.message);
      try { server.close(); } catch (err) { /* 忽略 */ }
      tryListen(i + 1);
    });
  }
  tryListen(0);

  /* 退出清理：关 HTTP + 杀沙箱进程树（后续阶段再补 MCP 子进程） */
  return {
    stop: function () {
      try { sandbox.stop(); } catch (e) { /* 忽略 */ }
      if (activeServer) { try { activeServer.close(); } catch (e) { /* 忽略 */ } }
    }
  };
}
