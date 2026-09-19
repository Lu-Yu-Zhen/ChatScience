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
exports.listMemories = listMemories;
exports.deleteMemoryScope = deleteMemoryScope;
exports.readUserHooks = readUserHooks;
exports.listWorktrees = listWorktrees;
exports.gitPrefsPrompt = gitPrefsPrompt;
exports.normalizePrefs = normalizePrefs;
/* ==================================================================
   userdata.ts · 用户级 Qoder 数据访问层（设置页真实数据源）
   数据源（Qoder CLI 本机目录，~/.qoder-cn）：
     - memory/*.md                  全局记忆（MEMORY.md 为索引）
     - projects/<slug>/memory/*.md  项目记忆（slug=项目路径编码）
     - settings.json                用户级设置（hooks 声明于此）
   安全边界：
     - 所有读写限制在 qoderHome 之内（realpath 前缀校验，防路径穿越）
     - 删除走「软删除」：整体移动到系统临时目录，不直接 rm
     - git worktree 只读（list --porcelain），不改仓库
   ================================================================== */
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
function qoderHome() {
    /* Qoder CLI 目录：默认 ~/.qoder-cn，环境变量可覆盖（与 CLI 行为对齐） */
    const env = process.env.QODER_HOME || process.env.QODERCN_HOME;
    return env && path.isAbsolute(env) ? env : path.join(os.homedir(), '.qoder-cn');
}
function statSafe(p) {
    try {
        return fs.statSync(p);
    }
    catch (e) {
        return null;
    }
}
function latestMtime(dir) {
    let latest = null;
    let entries = [];
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    }
    catch (e) {
        return null;
    }
    entries.forEach(function (d) {
        if (!d.isFile())
            return;
        const st = statSafe(path.join(dir, d.name));
        if (st && (latest === null || st.mtimeMs > latest))
            latest = st.mtimeMs;
    });
    return latest;
}
function listMdFiles(dir) {
    const out = [];
    let entries = [];
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    }
    catch (e) {
        return out;
    }
    entries.forEach(function (d) {
        if (!d.isFile() || !/\.md$/i.test(d.name))
            return;
        const st = statSafe(path.join(dir, d.name));
        if (st)
            out.push({ name: d.name, size: st.size, mtime: st.mtimeMs });
    });
    out.sort(function (a, b) { return b.mtime - a.mtime; });
    return out;
}
function listMemories() {
    const home = qoderHome();
    const gDir = path.join(home, 'memory');
    const gFiles = listMdFiles(gDir);
    const gExists = !!statSafe(gDir);
    const global = {
        scope: 'global', slug: null, dir: gDir, exists: gExists,
        count: gFiles.length,
        updatedAt: gFiles.length ? gFiles[0].mtime : latestMtime(gDir),
        files: gFiles
    };
    const projects = [];
    const pRoot = path.join(home, 'projects');
    let slugs = [];
    try {
        slugs = fs.readdirSync(pRoot, { withFileTypes: true });
    }
    catch (e) {
        slugs = [];
    }
    slugs.forEach(function (d) {
        if (!d.isDirectory())
            return;
        const mDir = path.join(pRoot, d.name, 'memory');
        const files = listMdFiles(mDir);
        if (!statSafe(mDir) && !files.length)
            return; /* 无记忆目录的项目不展示 */
        projects.push({
            scope: 'project', slug: d.name, dir: mDir, exists: !!statSafe(mDir),
            count: files.length, updatedAt: files.length ? files[0].mtime : null, files: files
        });
    });
    projects.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    return { home: home, global: global, projects: projects };
}
/* 软删除：把记忆目录整体移动到系统临时目录（可手工找回），返回 null=成功 */
function deleteMemoryScope(scope, slug) {
    const home = qoderHome();
    let dir;
    if (scope === 'global') {
        dir = path.join(home, 'memory');
    }
    else {
        if (!slug || /[\\/\:*?"<>|]/.test(slug) || slug.indexOf('..') > -1)
            return '非法的项目标识';
        dir = path.join(home, 'projects', slug, 'memory');
    }
    const resolved = path.resolve(dir);
    /* 前缀校验：必须位于 ~/.qoder-cn 内，防穿越 */
    if (resolved !== home && resolved.indexOf(home + path.sep) !== 0)
        return '路径超出 Qoder 用户目录';
    if (!statSafe(resolved))
        return '记忆目录不存在';
    const trash = path.join(os.tmpdir(), 'chatscience-memory-trash-' + Date.now().toString(36) + '-' + path.basename(resolved));
    try {
        fs.mkdirSync(path.dirname(trash), { recursive: true });
        fs.renameSync(resolved, trash);
    }
    catch (e) {
        return '删除失败：' + e.message;
    }
    return null;
}
/* Qoder CLI hooks 布局（与 Claude Code 同构）：hooks: { Event: [{ matcher, hooks: [{ type:'command', command }] }] } */
function readUserHooks() {
    const file = path.join(qoderHome(), 'settings.json');
    const out = { path: file, exists: false, readable: false, count: 0, events: [] };
    const st = statSafe(file);
    if (!st) {
        out.error = 'settings.json 不存在';
        return out;
    }
    out.exists = true;
    let obj;
    try {
        obj = JSON.parse(fs.readFileSync(file, 'utf8'));
        out.readable = true;
    }
    catch (e) {
        out.error = 'settings.json 解析失败：' + e.message;
        return out;
    }
    const hooks = obj && obj.hooks;
    if (!hooks || typeof hooks !== 'object')
        return out;
    Object.keys(hooks).forEach(function (event) {
        const matchersRaw = Array.isArray(hooks[event]) ? hooks[event] : [];
        const matchers = [];
        matchersRaw.forEach(function (m) {
            const list = Array.isArray(m.hooks) ? m.hooks : [];
            const commands = [];
            list.forEach(function (h) { if (h && typeof h.command === 'string')
                commands.push(h.command); });
            out.count += commands.length;
            matchers.push({ matcher: typeof m.matcher === 'string' ? m.matcher : '', commands: commands });
        });
        if (matchers.length)
            out.events.push({ event: event, matchers: matchers });
    });
    return out;
}
function listWorktrees(repoPath) {
    const repo = path.resolve(String(repoPath || ''));
    const out = { repo: repo, exists: false, isRepo: false, worktrees: [] };
    const st = statSafe(repo);
    if (!st || !st.isDirectory()) {
        out.error = '工作区目录不存在：' + repo;
        return out;
    }
    out.exists = true;
    if (!statSafe(path.join(repo, '.git'))) {
        out.error = '当前工作区不是 Git 仓库（未找到 .git）';
        return out;
    }
    out.isRepo = true;
    let r;
    try {
        r = (0, child_process_1.spawnSync)('git', ['worktree', 'list', '--porcelain'], { cwd: repo, encoding: 'utf8', windowsHide: true });
    }
    catch (e) {
        out.error = '无法启动 git：' + e.message;
        return out;
    }
    if (r.error) {
        out.error = '无法启动 git：' + r.error.message;
        return out;
    }
    if (r.status !== 0) {
        out.error = 'git worktree list 失败：' + String(r.stderr || '').trim();
        return out;
    }
    /* porcelain 解析：worktree <path> / HEAD <sha> / branch refs/heads/<name> / bare / detached */
    let cur = null;
    String(r.stdout || '').split(/\r?\n/).forEach(function (line) {
        if (!line.trim())
            return;
        if (line.indexOf('worktree ') === 0) {
            if (cur)
                out.worktrees.push(cur);
            cur = { path: line.slice(9).trim(), head: '', branch: '', bare: false, detached: false };
        }
        else if (cur) {
            if (line.indexOf('HEAD ') === 0)
                cur.head = line.slice(5).trim();
            else if (line.indexOf('branch ') === 0)
                cur.branch = line.slice(7).trim().replace(/^refs\/heads\//, '');
            else if (line === 'bare')
                cur.bare = true;
            else if (line === 'detached')
                cur.detached = true;
        }
    });
    if (cur)
        out.worktrees.push(cur);
    return out;
}
/* ---------------- Git 偏好 → 墨道系统提示（SDK preset+append 规范） ---------------- */
/* 设置页 Git/Worktrees 偏好的真实消费点：注入 Work 会话系统提示，
   约束墨道执行 git 行为（分支前缀/推送策略/提交说明风格）。 */
function gitPrefsPrompt(prefs) {
    const lines = [];
    const g = prefs && prefs.git ? prefs.git : { prefix: '', force: false, instr: '' };
    const w = prefs && prefs.worktrees ? prefs.worktrees : { fetchBeforeCreate: false, autoDelete: true, limit: 15 };
    const prefix = String(g.prefix || '').trim();
    if (prefix)
        lines.push('- 新建分支时必须使用前缀「' + prefix + '」；用户未另行说明时不要去掉该前缀。');
    if (g.force)
        lines.push('- 推送远端时始终使用 --force-with-lease（用户已授权强制推送）；远端已变化时拒绝覆盖并说明原因。');
    else
        lines.push('- 推送远端时使用普通 push，不使用任何 force 参数。');
    const instr = String(g.instr || '').trim();
    if (instr)
        lines.push('- 生成提交说明时遵循以下用户指令：' + instr);
    if (w && w.autoDelete)
        lines.push('- 清理 worktree 前先创建 Git 备份分支，数量上限 ' + (w.limit || 15) + ' 个。');
    if (!lines.length)
        return '';
    return '\n\n## Git 与 Worktree 偏好（来自用户设置页，需遵守）\n' + lines.join('\n');
}
/* 内存开关校验/规范化：PUT prefs 时使用 */
function normalizePrefs(input, cur) {
    const next = JSON.parse(JSON.stringify(cur));
    const inc = (input || {});
    if (inc.memory && typeof inc.memory === 'object') {
        if (typeof inc.memory.globalOn === 'boolean')
            next.memory.globalOn = inc.memory.globalOn;
        if (typeof inc.memory.projectOn === 'boolean')
            next.memory.projectOn = inc.memory.projectOn;
    }
    if (inc.git && typeof inc.git === 'object') {
        if (typeof inc.git.prefix === 'string')
            next.git.prefix = inc.git.prefix.slice(0, 60);
        if (typeof inc.git.force === 'boolean')
            next.git.force = inc.git.force;
        if (typeof inc.git.instr === 'string')
            next.git.instr = inc.git.instr.slice(0, 4000);
    }
    if (inc.worktrees && typeof inc.worktrees === 'object') {
        if (typeof inc.worktrees.fetchBeforeCreate === 'boolean')
            next.worktrees.fetchBeforeCreate = inc.worktrees.fetchBeforeCreate;
        if (typeof inc.worktrees.autoDelete === 'boolean')
            next.worktrees.autoDelete = inc.worktrees.autoDelete;
        const n = parseInt(String(inc.worktrees.limit), 10);
        if (!isNaN(n) && n > 0 && n <= 100)
            next.worktrees.limit = n;
    }
    if (inc.appearance && typeof inc.appearance === 'object') {
        if (typeof inc.appearance.width === 'string' && ['narrow', 'standard', 'wide'].indexOf(inc.appearance.width) > -1) {
            next.appearance.width = inc.appearance.width;
        }
    }
    return next;
}
