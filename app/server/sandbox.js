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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCRIPT_EXT = exports.IMG_MIME = void 0;
exports.createSandbox = createSandbox;
/* ==================================================================
   sandbox.ts · 沙箱执行引擎
   工作目录：app/data/sandbox/<scopeId>/{work,out,.hooks,.meta.json}
     work/   代码工作目录（cwd），产物也写这里
     out/    建议产物目录（savefig 等），与代码文件分开便于识别
     .hooks/ 断网策略的注入点（sitecustomize.py / netblock.js）
     .meta.json  scope 元数据

   能力边界（与 policy.ts一致，须如实告知用户）：
   - 无容器、无 Job Object：不能阻止沙箱内代码读写本机文件、耗尽内存或联网。
   - network:'declared' 只是声明式断网的四层近似：
     ① 代理环境变量指向黑洞端口  ② Python sitecustomize 阻断 socket
     ③ Node --require 阻断 net   ④ 代码静态扫描（可选）
     ctypes / 原生扩展 / C 层 DNS 仍可联网。
   - 资源上限只有：超时强杀 + 线程数收敛 + 并发数 + 单文件大小。peakRss 无法测量，
     usage.peakRssKb 恒为 null（字段留位，不谎报数据）。
   ================================================================== */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const proc = __importStar(require("./proc"));
const policyMod = __importStar(require("./policy"));
exports.IMG_MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.bmp': 'image/bmp' };
exports.SCRIPT_EXT = { python: 'py', node: 'js', shell: proc.IS_WIN ? 'cmd' : 'sh' };
const SITECUSTOMIZE_PY = [
    '"""ChatScience sandbox: declared network policy (best-effort, NOT a hard boundary)."""',
    '# 注意：不能把 socket.socket 整个替换成函数——ssl.py 里 class SSLSocket(socket) 要继承它，',
    '# 替换成函数会让 import ssl 直接 TypeError。只 patch 连接类方法，类本身保留。',
    'import socket as _s',
    '_MSG = "[ChatScience sandbox] network access blocked by declared policy"',
    'def _blocked(self, *_a, **_k):',
    '    raise OSError(_MSG)',
    '_s.socket.connect = _blocked',
    '_s.socket.connect_ex = _blocked',
    '_s.socket.sendto = _blocked',
    '_s.create_connection = _blocked',
    '_s.getaddrinfo = _blocked'
].join('\n') + '\n';
const NETBLOCK_JS = [
    '/* ChatScience sandbox: declared network policy (best-effort, NOT a hard boundary). */',
    '(function () {',
    '  const net = require("net");',
    '  const msg = "[ChatScience sandbox] network access blocked by declared policy";',
    '  net.Socket.prototype.connect = function () { throw new Error(msg); };',
    '  net.createConnection = net.connect = function () { throw new Error(msg); };',
    '})();'
].join('\n') + '\n';
function createSandbox(appRoot, opts) {
    const log = opts && opts.log ? opts.log : function () { };
    const ROOT = path.join(appRoot, 'data', 'sandbox');
    let policy = policyMod.mergePolicy(opts && opts.policy);
    /* ---------------- 并发信号量 ---------------- */
    let running = 0;
    const waiters = [];
    function acquire() {
        return new Promise(function (resolve) {
            if (running < policy.maxConcurrent) {
                running++;
                resolve();
                return;
            }
            waiters.push(resolve);
        });
    }
    function release() {
        running = Math.max(0, running - 1);
        const next = waiters.shift();
        if (next && running < policy.maxConcurrent) {
            running++;
            next();
        }
    }
    /* ---------------- 输出清洗 ---------------- */
    /* \r 进度条（pip/torch/mindspore 每秒几百帧）：每行只保留最后一段；
       剥 ANSI 与控制字符。清洗只影响展示与回传，不改变进程行为。 */
    function cleanOutput(raw) {
        let s = String(raw);
        s = s.replace(/\r\n/g, '\n');
        s = s.replace(/[^\n]*\r([^\n]*)/g, function (_, last) { return last; });
        s = s.replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, ''); /* OSC 标题等 */
        s = s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, ''); /* CSI 序列 */
        s = s.replace(/\x1b[@-_]/g, ''); /* 其余转义 */
        s = s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
        return s;
    }
    /* head 60% + tail 40% 双端保留：traceback 在尾部，loss/结论也在尾部，
       中间的进度条与重复帧最不重要，砍中间。 */
    function capOutput(cleaned, maxBytes) {
        if (Buffer.byteLength(cleaned, 'utf8') <= maxBytes)
            return { text: cleaned, capped: false };
        const budget = maxBytes - 60;
        const head = cleaned.slice(0, Math.floor(budget * 0.6));
        const tail = cleaned.slice(-Math.ceil(budget * 0.4));
        return { text: head + '\n…[输出过长，中间部分已截断]…\n' + tail, capped: true };
    }
    /* ---------------- 目录管理 ---------------- */
    function normScope(scopeId) {
        const s = String(scopeId || 'global').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'global';
        return s;
    }
    function scopeRoot(scopeId) {
        const s = normScope(scopeId);
        const p = path.join(ROOT, s);
        policyMod.assertInside(ROOT, p);
        return p;
    }
    function ensureScope(scopeId) {
        const root = scopeRoot(scopeId);
        const work = path.join(root, 'work');
        const out = path.join(work, 'out'); /* 产物目录：就在 cwd 下，代码里 savefig("out/x.png") 即写入 */
        const hooks = path.join(root, '.hooks');
        [work, out, hooks].forEach(function (d) { fs.mkdirSync(d, { recursive: true }); });
        try {
            fs.writeFileSync(path.join(hooks, 'sitecustomize.py'), SITECUSTOMIZE_PY, 'utf8');
        }
        catch (e) { /* 忽略 */ }
        try {
            fs.writeFileSync(path.join(hooks, 'netblock.js'), NETBLOCK_JS, 'utf8');
        }
        catch (e) { /* 忽略 */ }
        const meta = path.join(root, '.meta.json');
        if (!fs.existsSync(meta)) {
            fs.writeFileSync(meta, JSON.stringify({ id: normScope(scopeId), createdAt: Date.now(), updatedAt: Date.now() }, null, 2), 'utf8');
        }
        return { root: root, work: work, out: out, hooks: hooks };
    }
    /* 递归快照：{ relPath -> {size, mtimeMs} }，用于产物 diff 与文件列表。
       maxDepth 限制递归深度（工作区模式 diff 用户目录时避免全量扫描）。 */
    function walkSnapshot(base, rel, maxDepth) {
        const outMap = {};
        function walk(dir, prefix, depth) {
            if (maxDepth !== undefined && depth > maxDepth)
                return;
            let entries;
            try {
                entries = fs.readdirSync(dir, { withFileTypes: true });
            }
            catch (e) {
                return;
            }
            entries.forEach(function (d) {
                if (d.name.startsWith('.'))
                    return;
                const full = path.join(dir, d.name);
                const rp = prefix ? prefix + '/' + d.name : d.name;
                if (d.isDirectory())
                    walk(full, rp, depth + 1);
                else {
                    try {
                        const st = fs.statSync(full);
                        outMap[rp] = { size: st.size, mtimeMs: st.mtimeMs };
                    }
                    catch (e) { /* 竞态：文件被删 */ }
                }
            });
        }
        walk(base, rel || '', 0);
        return outMap;
    }
    /* ---------------- 执行 ---------------- */
    const activeChildren = new Set();
    /**
     * execCode({ scopeId, lang, code, timeoutMs, onEvent })
     * onEvent(kind, data)：kind ∈ stdout | stderr | note —— 用于运行页实时输出
     * 返回 ExecResult（见文件头注释）
     */
    async function execCode(req) {
        const lang = (req.lang || 'python').toLowerCase();
        if (!exports.SCRIPT_EXT[lang])
            throw new Error('unsupported lang: ' + lang);
        const scope = ensureScope(String(req.scopeId));
        /* 工作区模式：进程 cwd 用调用方指定的工作区（Agent 代码直接操作真实项目），
           但 _run_*.py 脚本文件仍写沙箱目录，避免污染用户工作区 */
        const cwdOverride = (req.cwd && path.isAbsolute(req.cwd) && fs.existsSync(req.cwd)) ? path.resolve(req.cwd) : null;
        const runCwd = cwdOverride || scope.work;
        const diffDepth = cwdOverride ? 2 : undefined; /* 用户目录可能很大，产物 diff 限深 */
        const rt = proc.detectRuntimes(appRoot);
        const need = lang === 'python' ? 'python' : 'node';
        if (lang !== 'shell' && !rt.runtimes[need]) {
            return {
                ok: false, exitCode: null, timedOut: false, blocked: false,
                stdout: '', stderr: '运行时未安装或未在 PATH 中找到：' + need
                    + '（已探测：' + Object.keys(rt.runtimes).join(', ') || '无' + '）',
                durationMs: 0, files: [], usage: { peakRssKb: null }, diagnostics: rt.errors
            };
        }
        const policyReq = policyMod.mergePolicy(Object.assign({}, policy, req.policyOverride || {}));
        const scan = policyMod.scanCode(String(req.code || ''), policyReq);
        if (scan.blocked) {
            log('sandbox exec blocked: ' + scan.reason);
            return {
                ok: false, exitCode: null, timedOut: false, blocked: true, blockReason: scan.reason,
                stdout: '', stderr: '代码未执行——触发沙箱静态拦截：' + scan.reason
                    + '\n说明：这是防误操作的静态拦截，不是安全边界；如确需执行，请修改代码。',
                durationMs: 0, files: [], usage: { peakRssKb: null }
            };
        }
        await acquire();
        const t0 = Date.now();
        /* 写脚本文件（保留便于排查），argv 数组方式传给解释器 */
        const scriptName = '_run_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6) + '.' + exports.SCRIPT_EXT[lang];
        const scriptPath = path.join(scope.work, scriptName);
        try {
            fs.writeFileSync(scriptPath, String(req.code || ''), 'utf8');
        }
        catch (e) {
            release();
            throw e;
        }
        /* 环境变量：中文编码 / matplotlib 无显示环境 / 线程数收敛 / 声明式断网 */
        const env = Object.assign({}, process.env, {
            PYTHONIOENCODING: 'utf-8',
            PYTHONUTF8: '1',
            MPLBACKEND: 'Agg',
            OMP_NUM_THREADS: '4',
            MKL_NUM_THREADS: '4',
            NUMEXPR_NUM_THREADS: '4',
            PYTHONPATH: scope.hooks + (process.env.PYTHONPATH ? path.delimiter + process.env.PYTHONPATH : ''),
            NO_PROXY: '*',
            TERM: 'dumb',
            CI: '1'
        });
        if (policyReq.network === 'declared') {
            env.HTTP_PROXY = env.HTTPS_PROXY = env.ALL_PROXY = 'http://127.0.0.1:9';
            env.http_proxy = env.https_proxy = env.all_proxy = 'http://127.0.0.1:9';
            env.NODE_OPTIONS = (env.NODE_OPTIONS ? env.NODE_OPTIONS + ' ' : '') + '--require=' + JSON.stringify(path.join(scope.hooks, 'netblock.js'));
        }
        let cmd;
        let args;
        if (lang === 'python') {
            cmd = rt.runtimes.python.exe;
            args = ['-u', scriptPath];
        }
        else if (lang === 'node') {
            cmd = rt.runtimes.node.exe;
            args = [scriptPath];
        }
        else {
            cmd = proc.IS_WIN ? (process.env.ComSpec || 'cmd.exe') : '/bin/sh';
            /* 修正：不再手写外层引号——node 会按需为含空格参数加引号；
               手写引号会被 node 的命令行转义变成 \"...\"，导致 cmd 找不到脚本
               （验证 exe 时发现的遗留 bug，dev/node 环境同样存在） */
            args = proc.IS_WIN ? ['/d', '/s', '/c', scriptPath] : [scriptPath];
        }
        if (req.args && req.args.length)
            args = args.concat(req.args.map(String));
        return await new Promise(function (resolve) {
            let child;
            try {
                child = proc.spawnGuarded(cmd, args, { cwd: runCwd, env: env });
            }
            catch (e) {
                release();
                resolve({
                    ok: false, exitCode: null, timedOut: false, blocked: false,
                    stdout: '', stderr: '进程启动失败（杀毒软件/EDR 可能拦截了 Electron 派生的解释器）: ' + e.message,
                    durationMs: Date.now() - t0, files: [], usage: { peakRssKb: null }, diagnostics: [{ key: cmd, error: e.message }]
                });
                return;
            }
            activeChildren.add(child);
            const rawCap = policyReq.maxOutputBytes * 4;
            const accOut = { buf: '', dropped: false }, accErr = { buf: '', dropped: false };
            let done = false, timedOut = false;
            let killedInfo = null;
            let flushTimer = null, pendingOut = '', pendingErr = '';
            function pushRaw(acc, s) {
                if (acc.buf.length + s.length <= rawCap) {
                    acc.buf += s;
                    return;
                }
                acc.dropped = true;
                acc.buf = (acc.buf + s).slice(-rawCap); /* 只保留最近 rawCap 字节，尾部优先 */
            }
            function emitLive(kind, delta) {
                if (!req.onEvent || !delta)
                    return;
                /* 实时流只做轻清洗（\r 分段），ANSI 可能被 chunk 边界切断，可接受 */
                const c = cleanOutput(delta.replace(/\r([^\n]*)/g, '\n$1')).slice(0, 4096);
                if (c) {
                    try {
                        req.onEvent(kind, c);
                    }
                    catch (e) { /* 回调异常不影响执行 */ }
                }
            }
            function scheduleFlush() {
                if (flushTimer)
                    return;
                flushTimer = setTimeout(function () {
                    flushTimer = null;
                    if (pendingOut) {
                        emitLive('stdout', pendingOut);
                        pendingOut = '';
                    }
                    if (pendingErr) {
                        emitLive('stderr', pendingErr);
                        pendingErr = '';
                    }
                }, 120);
            }
            function onData(buf, which) {
                const s = buf.toString('utf8');
                if (which === 'out') {
                    pushRaw(accOut, s);
                    pendingOut += s;
                }
                else {
                    pushRaw(accErr, s);
                    pendingErr += s;
                }
                scheduleFlush();
            }
            child.stdout.on('data', function (b) { onData(b, 'out'); });
            child.stderr.on('data', function (b) { onData(b, 'err'); });
            child.on('error', function (e) { if (!done) {
                accErr.buf += '\n[spawn error] ' + e.message;
                accErr.dropped = false;
            } });
            const timer = setTimeout(function () {
                timedOut = true;
                killedInfo = proc.killTree(child.pid, 'timeout ' + policyReq.timeoutMs + 'ms');
                log('sandbox timeout pid=' + child.pid + ' scope=' + req.scopeId + ' kill=' + JSON.stringify(killedInfo));
            }, policyReq.timeoutMs);
            const before = walkSnapshot(runCwd, '', diffDepth);
            child.on('close', function (code, signal) {
                if (done)
                    return;
                done = true;
                clearTimeout(timer);
                if (flushTimer) {
                    clearTimeout(flushTimer);
                }
                if (pendingOut)
                    emitLive('stdout', pendingOut);
                if (pendingErr)
                    emitLive('stderr', pendingErr);
                activeChildren.delete(child);
                release();
                /* 产物 diff：只对 work/（产物目录就是 work/out/），排除本次执行写入的脚本 */
                const after = walkSnapshot(runCwd, '', diffDepth);
                const changed = {};
                Object.keys(after).forEach(function (k) {
                    if (/_run_[0-9a-z]+\.(py|js|cmd|sh)$/i.test(k))
                        return;
                    const b = before[k];
                    if (!b || b.mtimeMs !== after[k].mtimeMs || b.size !== after[k].size)
                        changed[k] = after[k];
                });
                const cOut = (accOut.dropped ? '…[早期 stdout 已超出采集上限，仅保留最近内容]…\n' : '') + cleanOutput(accOut.buf);
                const cErr = (accErr.dropped ? '…[早期 stderr 已超出采集上限，仅保留最近内容]…\n' : '') + cleanOutput(accErr.buf);
                const o = capOutput(cOut, policyReq.maxOutputBytes);
                const e2 = capOutput(cErr, policyReq.maxOutputBytes);
                resolve({
                    ok: code === 0 && !timedOut,
                    exitCode: code === null ? null : code,
                    signal: signal || null,
                    timedOut: timedOut,
                    killedInfo: killedInfo,
                    blocked: false,
                    stdout: o.text,
                    stdoutCapped: o.capped,
                    stderr: e2.text,
                    stderrCapped: e2.capped,
                    durationMs: Date.now() - t0,
                    files: collectArtifacts(runCwd, changed, policyReq, normScope(req.scopeId)),
                    usage: { peakRssKb: null }, /* 无 Job Object，无法测量；不谎报 */
                    networkPolicy: policyReq.network === 'declared' ? 'declared-only' : 'open',
                    scope: normScope(req.scopeId)
                });
            });
        });
    }
    /* 产物：新增/修改的文件；小图片转 base64 内联（<img> 带不了鉴权头） */
    function collectArtifacts(baseDir, changed, policyReq, scopeIdStr) {
        return Object.keys(changed).slice(0, 50).map(function (rel) {
            const st = changed[rel];
            const abs = path.join(baseDir, rel);
            const ext = path.extname(rel).toLowerCase();
            const item = {
                name: path.basename(rel), relPath: rel, size: st.size,
                mime: exports.IMG_MIME[ext] || 'application/octet-stream',
                isImage: !!exports.IMG_MIME[ext], dataUrl: null, scope: scopeIdStr || 'global'
            };
            if (item.isImage && st.size <= policyReq.maxInlineImageBytes) {
                try {
                    item.dataUrl = 'data:' + item.mime + ';base64,' + fs.readFileSync(abs).toString('base64');
                }
                catch (e) {
                    item.readError = e.message;
                }
            }
            return item;
        });
    }
    /* ---------------- 依赖安装（独立受控操作，异步事件流） ---------------- */
    async function installDeps(req, onEvent) {
        const manager = (req.manager || 'pip').toLowerCase();
        const pkgs = (req.packages || []).map(function (s) { return String(s).trim(); }).filter(Boolean);
        if (!pkgs.length)
            throw new Error('未指定要安装的包');
        if (pkgs.length > 50)
            throw new Error('一次最多安装 50 个包');
        const check = manager === 'pip' || manager === 'uv' ? policyMod.PY_PKG_RE : policyMod.PKG_SPEC_RE;
        const bad = pkgs.filter(function (p) { return !check.test(p); });
        if (bad.length)
            throw new Error('包名未通过安全校验（.cmd 包装需经 cmd.exe，包名不得含 shell 元字符）: ' + bad.join(', '));
        const scope = ensureScope(String(req.scopeId));
        const rt = proc.detectRuntimes(appRoot);
        let cmd, args;
        if (manager === 'pip') {
            if (!rt.runtimes.python)
                throw new Error('未找到 python，无法使用 pip');
            cmd = rt.runtimes.python.exe;
            args = ['-m', 'pip', 'install', '--disable-pip-version-check', '-q'].concat(pkgs);
        }
        else if (manager === 'uv') {
            if (!rt.runtimes.uv)
                throw new Error('未找到 uv');
            cmd = rt.runtimes.uv.exe;
            args = ['pip', 'install', '--quiet'].concat(pkgs);
        }
        else if (manager === 'npm') {
            if (!rt.runtimes.npm)
                throw new Error('未找到 npm');
            cmd = rt.runtimes.npm.exe;
            args = ['install', '--no-audit', '--no-fund', '--loglevel=error'].concat(pkgs);
        }
        else {
            throw new Error('不支持的包管理器: ' + manager);
        }
        const env = Object.assign({}, process.env, {
            PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', TERM: 'dumb'
        });
        return await new Promise(function (resolve) {
            let child;
            try {
                child = proc.spawnGuarded(cmd, args, { cwd: scope.work, env: env });
            }
            catch (e) {
                resolve({ ok: false, error: e.message, output: '' });
                return;
            }
            activeChildren.add(child);
            let acc = '';
            const grab = function (b) {
                const s = b.toString('utf8');
                acc += s;
                if (onEvent)
                    onEvent('install', cleanOutput(s).slice(0, 2000));
            };
            child.stdout.on('data', grab);
            child.stderr.on('data', grab);
            const timer = setTimeout(function () {
                proc.killTree(child.pid, 'install timeout');
            }, 10 * 60 * 1000);
            child.on('close', function (code) {
                clearTimeout(timer);
                activeChildren.delete(child);
                resolve({ ok: code === 0, exitCode: code, output: capOutput(cleanOutput(acc), 65536).text });
            });
        });
    }
    /* ---------------- 工具级文件 API（全部经 assertInside / sanitizeRelPath） ---------------- */
    function absIn(scopeId, rel, sub) {
        const scope = ensureScope(scopeId);
        const clean = policyMod.sanitizeRelPath(rel);
        const base = sub === 'out' ? scope.out : scope.work;
        return policyMod.assertInside(base, path.join(base, clean));
    }
    function listFiles(scopeId) {
        const scope = ensureScope(scopeId);
        /* 产物目录就是 cwd 下的 out/，单一快照即可，无需再并一个独立目录 */
        const snap = walkSnapshot(scope.work, '');
        return Object.keys(snap).map(function (k) {
            const ext = path.extname(k).toLowerCase();
            return { relPath: k, size: snap[k].size, mtimeMs: snap[k].mtimeMs, isImage: !!exports.IMG_MIME[ext] };
        }).filter(function (f) { return !/_run_[0-9a-z]+\.(py|js|cmd|sh)$/i.test(f.relPath); })
            .sort(function (a, b) { return b.mtimeMs - a.mtimeMs; });
    }
    function readFile(scopeId, rel, maxBytes) {
        const abs = absIn(scopeId, rel);
        const st = fs.statSync(abs);
        if (st.size > (maxBytes || 2 * 1024 * 1024)) {
            const e = new Error('文件过大（' + st.size + ' 字节），请分段读取');
            e.code = 'EFILETOOLARGE';
            throw e;
        }
        const buf = fs.readFileSync(abs);
        const ext = path.extname(abs).toLowerCase();
        if (exports.IMG_MIME[ext]) {
            return { relPath: policyMod.sanitizeRelPath(rel), size: st.size, mime: exports.IMG_MIME[ext], isImage: true, dataUrl: 'data:' + exports.IMG_MIME[ext] + ';base64,' + buf.toString('base64'), text: null };
        }
        return { relPath: policyMod.sanitizeRelPath(rel), size: st.size, mime: 'text/plain', isImage: false, dataUrl: null, text: buf.toString('utf8') };
    }
    function writeFile(scopeId, rel, content) {
        const scope = ensureScope(scopeId);
        const clean = policyMod.sanitizeRelPath(rel);
        const body = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
        const limit = policy.maxFileSizeMb * 1024 * 1024;
        if (body.length > limit) {
            const e = new Error('写入内容超过上限（' + policy.maxFileSizeMb + 'MB）');
            e.code = 'EFILETOOLARGE';
            throw e;
        }
        const abs = policyMod.assertInside(scope.work, path.join(scope.work, clean));
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, body);
        return { relPath: clean, size: body.length };
    }
    function deleteFile(scopeId, rel) {
        const abs = absIn(scopeId, rel);
        fs.rmSync(abs, { force: true });
        return { deleted: policyMod.sanitizeRelPath(rel) };
    }
    function readScopeFile(scopeId, rel) {
        /* 供 HTTP 下载产物用：返回 {buffer, mime} */
        const abs = absIn(scopeId, rel);
        const ext = path.extname(abs).toLowerCase();
        return { buffer: fs.readFileSync(abs), mime: exports.IMG_MIME[ext] || 'application/octet-stream', name: path.basename(abs) };
    }
    function resetWorkspace(scopeId) {
        const root = scopeRoot(scopeId);
        fs.rmSync(root, { recursive: true, force: true });
        ensureScope(scopeId);
        return { reset: normScope(scopeId) };
    }
    /* GC：清理超期未用的 scope。大目录删除分片执行，避免阻塞事件循环。 */
    function gcSandboxes(maxAgeMs) {
        const age = maxAgeMs || (policy.autoGcDays * 86400000);
        const now = Date.now();
        const removed = [];
        let entries = [];
        try {
            entries = fs.readdirSync(ROOT, { withFileTypes: true });
        }
        catch (e) {
            return { removed: removed };
        }
        const stale = [];
        entries.forEach(function (d) {
            if (!d.isDirectory())
                return;
            const metaPath = path.join(ROOT, d.name, '.meta.json');
            let updatedAt = 0;
            try {
                updatedAt = JSON.parse(fs.readFileSync(metaPath, 'utf8')).updatedAt || 0;
            }
            catch (e) { /* 无 meta 用目录 mtime */ }
            if (!updatedAt) {
                try {
                    updatedAt = fs.statSync(path.join(ROOT, d.name)).mtimeMs;
                }
                catch (e) {
                    return;
                }
            }
            if (now - updatedAt > age)
                stale.push(d.name);
        });
        let i = 0;
        function step() {
            const chunk = stale.slice(i, i + 5);
            chunk.forEach(function (name) {
                try {
                    fs.rmSync(path.join(ROOT, name), { recursive: true, force: true });
                    removed.push(name);
                }
                catch (e) { /* 忽略 */ }
            });
            i += 5;
            if (i < stale.length)
                setImmediate(step);
        }
        step();
        return { removed: removed, pending: stale.length };
    }
    function setPolicy(next) { policy = policyMod.mergePolicy(Object.assign({}, policy, next || {})); return policy; }
    function getPolicy() { return policy; }
    /* 退出清理：杀掉所有还在跑的进程树，防止 Electron 退出后 python 残留 */
    function stop() {
        activeChildren.forEach(function (c) { proc.killTree(c.pid, 'app shutdown'); });
        activeChildren.clear();
        waiters.length = 0;
    }
    const api = {
        execCode, installDeps, listFiles, readFile, writeFile, deleteFile,
        readScopeFile, resetWorkspace, gcSandboxes,
        setPolicy: function (next) { return setPolicy(next); },
        getPolicy: getPolicy,
        /* 注意：与迁移前 JS 版一致，这里忽略 force 参数——
           routes 的 ?force=1 实际走 TTL 缓存（遗留行为，迁移说明里有记录） */
        detectRuntimes: function (_force) { return proc.detectRuntimes(appRoot); },
        ensureScope: function (s) { return ensureScope(s); }, /* 返回 {root,work,out,hooks}，cwd 用 .work */
        stop: stop,
        policy: function () { return policy; }
    };
    return api;
}
