"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
/* ==================================================================
   ChatScience 桌面版 · 本地后端服务
   - 绑定 127.0.0.1（不对外暴露）
   - /api/* 需要 Bearer token（启动时随机生成，经 URL 注入渲染进程）
   - /api/state：状态快照读写（与主进程 IPC 共用同一 state.json，原子写入）
   - /api/chat：AI 流式代理（SSE）
   - 静态托管 renderer/
   ================================================================== */
const express_1 = __importDefault(require("express"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ai_1 = require("./ai");
const storeMod = __importStar(require("./store"));
const sandboxMod = __importStar(require("./sandbox"));
const notesMod = __importStar(require("./notes"));
const kbMod = __importStar(require("./kb"));
const memoryMod = __importStar(require("./memory"));
const qoderMod = __importStar(require("./qoder"));
const routesMod = __importStar(require("./routes"));
function log(appRoot, line) {
    try {
        fs.mkdirSync(path.join(appRoot, 'data'), { recursive: true });
        fs.appendFileSync(path.join(appRoot, 'data', 'server.log'), new Date().toISOString() + ' ' + line + '\n');
    }
    catch (e) { /* 忽略 */ }
}
function readAiConfig(appRoot) {
    try {
        return JSON.parse(fs.readFileSync(path.join(appRoot, 'server', 'config.json'), 'utf8'));
    }
    catch (e) {
        return {};
    }
}
function startServer(portCandidates, token, appRoot, onPort) {
    const app = (0, express_1.default)();
    const STATE_FILE = path.join(appRoot, 'data', 'state.json');
    app.use(express_1.default.json({ limit: '40mb' }));
    /* CORS：渲染层可能以 file://（origin null）或 http 加载，API 已有 token 鉴权，放开跨源 */
    app.use(function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }
        next();
    });
    /* 鉴权：所有 /api/* 需要 Bearer token */
    app.use('/api', function (req, res, next) {
        const auth = req.headers.authorization || '';
        if (auth !== 'Bearer ' + token) {
            res.status(401).json({ error: 'unauthorized' });
            return;
        }
        next();
    });
    app.get('/api/health', function (req, res) { res.json({ ok: true, ts: Date.now(), pid: process.pid }); });
    /* ---------------- Work 模式能力装配 ----------------
       顺序：CORS → token 鉴权（上面两个 app.use）→ Work 路由 → 既有 API。 */
    const store = storeMod.createStore(appRoot, function (line) { log(appRoot, line); });
    const sandbox = sandboxMod.createSandbox(appRoot, {
        log: function (line) { log(appRoot, line); },
        policy: store.section('sandboxPolicy')
    });
    const workCtx = {
        appRoot: appRoot, token: token, log: function (line) { log(appRoot, line); },
        store: store, sandbox: sandbox,
        notes: notesMod.createNotes(appRoot),
        kb: kbMod.createKb(appRoot), /* N6：知识库 BM25 词法检索索引（前端推送文本） */
        /* 项目记忆：data/projects/<projectId>/memory/（任务 md + Stop 决策 hook） */
        memory: memoryMod.createMemory(appRoot, function (line) { log(appRoot, line); }),
        qoder: undefined
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
                if (!hit) {
                    arr.push(JSON.parse(JSON.stringify(b)));
                    changed = true;
                }
            });
            const builtinIds = qoderMod.BUILTIN_AGENTS.map(function (b) { return b.id; });
            const kept = arr.filter(function (a) { return !(a.builtin && builtinIds.indexOf(a.id) === -1); });
            if (kept.length !== arr.length) {
                changed = true;
                arr.length = 0;
                kept.forEach(function (a) { arr.push(a); });
            }
            return changed ? arr : undefined; /* 无变化不落盘 */
        }).then(function () {
            if (!store.section('seeded'))
                return store.setSection('seeded', true);
            return undefined;
        }).catch(function (e) { log(appRoot, 'seed agents failed: ' + e.message); });
    })();
    try {
        sandbox.gcSandboxes();
    }
    catch (e) {
        log(appRoot, 'sandbox gc failed: ' + e.message);
    }
    app.get('/api/state', function (req, res) {
        try {
            res.type('json').send(fs.readFileSync(STATE_FILE, 'utf8'));
        }
        catch (e) {
            res.json(null);
        }
    });
    app.post('/api/state', function (req, res) {
        try {
            fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
            const tmp = STATE_FILE + '.tmp';
            fs.writeFileSync(tmp, JSON.stringify(req.body), 'utf8');
            fs.renameSync(tmp, STATE_FILE);
            res.json({ ok: true, ts: Date.now() });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
    /* ---------------- 工作区文件扫描 / 读取（AI 阅读模式数据源） ---------------- */
    const WS_SCAN_EXTS = new Set(['pdf', 'docx', 'md', 'html', 'xlsx', 'xls', 'csv']);
    const WS_SKIP_DIRS = new Set(['node_modules', '.git', '.svn', 'dist', 'build', '__pycache__', '.venv', 'venv', '.idea', '.vscode']);
    function extOf(name) {
        const i = name.lastIndexOf('.');
        return i > -1 ? name.slice(i + 1).toLowerCase() : '';
    }
    app.get('/api/fs/list', function (req, res) {
        const dir = String(req.query.dir || '');
        let root;
        try {
            root = fs.realpathSync(dir);
        }
        catch (e) {
            res.status(400).json({ error: 'dir not found' });
            return;
        }
        let stat;
        try {
            stat = fs.statSync(root);
        }
        catch (e) {
            res.status(400).json({ error: 'dir not found' });
            return;
        }
        if (!stat.isDirectory()) {
            res.status(400).json({ error: 'not a directory' });
            return;
        }
        const files = [];
        const MAX = 400;
        (function walk(d, depth) {
            if (depth > 3 || files.length >= MAX)
                return;
            let entries;
            try {
                entries = fs.readdirSync(d, { withFileTypes: true });
            }
            catch (e) {
                return;
            }
            entries.sort(function (a, b) { return a.name.localeCompare(b.name); });
            entries.forEach(function (en) {
                if (files.length >= MAX)
                    return;
                if (en.name.startsWith('.'))
                    return;
                const full = path.join(d, en.name);
                if (en.isDirectory()) {
                    if (!WS_SKIP_DIRS.has(en.name))
                        walk(full, depth + 1);
                    return;
                }
                if (!en.isFile())
                    return;
                const ext = extOf(en.name);
                if (!WS_SCAN_EXTS.has(ext))
                    return;
                let size = 0;
                try {
                    size = fs.statSync(full).size;
                }
                catch (e) { /* 忽略 */ }
                files.push({ name: en.name, ext: ext, size: size, path: full });
            });
        })(root, 0);
        res.json({ dir: root, files: files });
    });
    const WS_MIME = { pdf: 'application/pdf', html: 'text/html; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
    app.get('/api/fs/raw', function (req, res) {
        const p = String(req.query.path || '');
        let real;
        try {
            real = fs.realpathSync(p);
        }
        catch (e) {
            res.status(400).json({ error: 'file not found' });
            return;
        }
        let st;
        try {
            st = fs.statSync(real);
        }
        catch (e) {
            res.status(400).json({ error: 'file not found' });
            return;
        }
        if (!st.isFile() || st.size > 64 * 1024 * 1024) {
            res.status(400).json({ error: 'not a readable file' });
            return;
        }
        res.setHeader('Content-Type', WS_MIME[extOf(real)] || 'application/octet-stream');
        fs.createReadStream(real).pipe(res);
    });
    /* AI 流式代理 */
    app.post('/api/chat', async function (req, res) {
        const body = req.body || {};
        const model = body.model;
        const messages = body.messages;
        if (!model || !Array.isArray(messages) || !messages.length) {
            res.status(400).json({ error: 'bad request: model & messages required' });
            return;
        }
        const cfg = readAiConfig(appRoot);
        const key = body.apiKey || cfg.apiKey;
        if (!key) {
            res.status(400).json({ error: 'missing api key (config.json or request body)' });
            return;
        }
        res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });
        const t0 = Date.now();
        let firstDeltaMs = null;
        let full = '';
        const t0Write = () => res.write('data: ' + JSON.stringify({ delta: '' }) + '\n\n');
        t0Write();
        try {
            const chatOpts = {
                providerId: body.providerId || cfg.providerId || 'bailian',
                model: model,
                apiKey: key,
                messages: messages,
                temperature: body.temperature,
                web: body.web !== false
            };
            /* 思考开关：前端显式传布尔时按厂商官方参数注入（Chat 默认不思考） */
            if (typeof body.thinking === 'boolean') {
                (0, ai_1.applyThinking)(chatOpts, (0, ai_1.resolveProvider)(chatOpts.providerId), body.thinking === true);
            }
            await (0, ai_1.chatStream)(chatOpts, function (ev) {
                if (ev.type === 'reasoning') {
                    res.write('data: ' + JSON.stringify({ reasoning: ev.text }) + '\n\n');
                    return;
                }
                if (firstDeltaMs === null)
                    firstDeltaMs = Date.now() - t0;
                full += ev.text;
                res.write('data: ' + JSON.stringify({ delta: ev.text }) + '\n\n');
            });
            log(appRoot, 'chat ok model=' + model + ' ttft=' + firstDeltaMs + 'ms chars=' + full.length + ' total=' + (Date.now() - t0) + 'ms');
            res.write('data: ' + JSON.stringify({ done: true, ttftMs: firstDeltaMs, totalMs: Date.now() - t0, chars: full.length }) + '\n\n');
        }
        catch (e) {
            log(appRoot, 'chat fail model=' + model + ' err=' + e.message);
            res.write('data: ' + JSON.stringify({ error: e.message }) + '\n\n');
        }
        res.write('data: [DONE]\n\n');
        res.end();
    });
    /* 渲染层静态托管 */
    app.use(express_1.default.static(path.join(appRoot, 'renderer')));
    /* 依次尝试候选端口（Windows 保留端口段会导致 EACCES，自动回退） */
    const ports = Array.isArray(portCandidates) ? portCandidates : [portCandidates];
    let activeServer = null;
    function tryListen(i) {
        if (i >= ports.length) {
            log(appRoot, 'SERVER LISTEN ERROR: all candidate ports failed: ' + ports.join(','));
            return;
        }
        const port = ports[i];
        const server = app.listen(port, '127.0.0.1', function () {
            log(appRoot, 'server listening on 127.0.0.1:' + port);
            console.log('[server] listening on 127.0.0.1:' + port);
            activeServer = server;
            if (onPort)
                onPort(port);
        });
        server.on('error', function (e) {
            log(appRoot, 'listen failed on ' + port + ': ' + e.message);
            console.error('[server] listen error on ' + port, e.message);
            try {
                server.close();
            }
            catch (err) { /* 忽略 */ }
            tryListen(i + 1);
        });
    }
    tryListen(0);
    /* 退出清理：关 HTTP + 杀沙箱进程树（后续阶段再补 MCP 子进程） */
    return {
        stop: function () {
            try {
                sandbox.stop();
            }
            catch (e) { /* 忽略 */ }
            if (activeServer) {
                try {
                    activeServer.close();
                }
                catch (e) { /* 忽略 */ }
            }
        }
    };
}
