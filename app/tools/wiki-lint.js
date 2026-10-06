"use strict";
/**
 * 墨台 Wiki 工具 —— 实现 wiki/SCHEMA.md §七 承诺的机械校验与维护动作。
 * 用法（在 app/ 目录执行）：
 *   npm run wiki:lint                                            全量检查
 *   npm run wiki:lint -- --fix                                   重写 index.md
 *   npm run wiki:lint -- --add <type>/<id> --title T [--sources a,b]   生成合规骨架页
 *   npm run wiki:lint -- --log <op> --title "<标题>" [--author 名字]  追加 log.md 条目
 * 退出码：0 = 无 error（允许 warning）｜1 = 有 error｜2 = 无法执行
 *
 * 规则变更须同步改 wiki/SCHEMA.md §二/§四/§七，并向 wiki/log.md 记一条 schema 记录。
 */
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const REPO_DIR = path.resolve(__dirname, '..', '..');
const WIKI_DIR = path.join(REPO_DIR, 'wiki');
const CONTENT_DIRS = ['sources', 'entities', 'concepts', 'syntheses'];
const DIR_TO_TYPE = { sources: 'source', entities: 'entity', concepts: 'concept', syntheses: 'synthesis' };
const TYPES = ['source', 'entity', 'concept', 'synthesis', 'schema', 'meta'];
const STATUSES = ['stable', 'draft', 'disputed', 'archived'];
const LOG_OPS = ['init', 'ingest', 'query', 'lint', 'schema', 'restore', 'rebuild'];
const INDEX_ORDER = ['entities', 'concepts', 'sources', 'syntheses'];
const INDEX_TITLES = {
    entities: '实体（entities/）',
    concepts: '概念（concepts/）',
    sources: '资料摘要（sources/）',
    syntheses: '综合与回填（syntheses/）',
};
const FRONTMATTER_FIELDS = ['type', 'title', 'tags', 'sources', 'updated', 'status'];
/** SCHEMA §二 Raw 登记表的前缀镜像；新增资料簇先改 SCHEMA 再改这里。 */
const RAW_PREFIXES = [
    'AGENTS.md',
    '墨台实现策划案/_src/',
    'app/src/',
    'app/verify/',
    'app/server/plugins/',
    'app/package.json',
    'app/tsconfig',
    'app/start.bat',
    'app/TypeScript迁移说明.md',
    '01/主页面.html',
    'motai-site/',
    '墨台产品页.html',
    'inkforge-brand_assets/',
    '主题壁纸/',
    'agentsview-report/',
    'SDK应用/',
    '测试文件夹/',
    'wiki/',
    '.gitattributes',
    '.gitignore',
];
/** 不随 git 共享的本机路径，禁止出现在 sources: 与证据引用中。 */
const FORBIDDEN_PATH = ['.qoder-cn', '.workbuddy', '.qoder/', '.qoder\\', '.trae/', '.verify-tmp/', '.verify-shots/', 'memory/', '~'];
/** 只读禁引的运行时/密钥路径。 */
const BANNED_PATH = ['app/data/', 'app/dist/', 'node_modules/', 'app/server/qoder.json', 'app/server/config.json'];
const SECRET_PATTERNS = [
    ['GitHub token', /\b(?:ghp|gho|ghu|ghs|ghpr)_[A-Za-z0-9]{20,}/],
    ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
    ['sk- 形式密钥', /\bsk-[A-Za-z0-9_-]{20,}/],
    ['私钥块', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
    ['Bearer 凭据', /Authorization:\s*Bearer\s+[A-Za-z0-9._~+/=-]{16,}/i],
    ['JWT', /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/],
];
const ILLEGAL_NAME = /[\s\\/:*?"<>|]/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const BACKTICK = /`([^`\n]+)`/g;
const CITATION = /^([A-Za-z0-9_.\-\u4e00-\u9fff/]+?)(?::(\d+)(?:-(\d+))?)?$/;
const findings = [];
function add(severity, code, page, line, message) {
    findings.push({ severity, code, page, line, message });
}
/** 在文本里定位包含 needle 的首行行号（1 基），找不到返回 0。 */
function lineOf(text, needle) {
    if (!needle)
        return 0;
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(needle))
            return i + 1;
    }
    return 0;
}
function stripQuotes(s) {
    if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))))
        return s.slice(1, -1);
    return s;
}
function parseFrontmatter(raw) {
    const m = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/.exec(raw);
    if (!m)
        return { fm: {}, body: raw, ok: false };
    const fm = {};
    for (const line of m[1].split(/\r?\n/)) {
        if (!line.trim() || line.trimStart().startsWith('#'))
            continue;
        const kv = /^([A-Za-z_][A-Za-z0-9_-]*)[ \t]*:[ \t]*(.*)$/.exec(line);
        if (!kv)
            continue;
        const value = kv[2].trim();
        if (value.startsWith('[') && value.endsWith(']')) {
            const inner = value.slice(1, -1).trim();
            fm[kv[1]] = inner ? inner.split(',').map((s) => stripQuotes(s.trim())).filter(Boolean) : [];
        }
        else {
            fm[kv[1]] = stripQuotes(value);
        }
    }
    return { fm, body: raw.slice(m[0].length), ok: true };
}
function asArray(v) {
    if (v === undefined)
        return [];
    return Array.isArray(v) ? v : [v];
}
function asString(v) {
    if (v === undefined)
        return '';
    return Array.isArray(v) ? v.join(', ') : v;
}
/** 去掉围栏代码块，避免 SCHEMA 里的模板示例触发误报；整块替换为空行以保持行号。 */
function stripCodeFences(text) {
    const out = [];
    let inFence = false;
    for (const line of text.split(/\r?\n/)) {
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence;
            out.push('');
            continue;
        }
        out.push(inFence ? '' : line);
    }
    return out.join('\n');
}
function listMd(dir) {
    if (!fs.existsSync(dir))
        return [];
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
        .map((e) => path.join(dir, e.name))
        .sort();
}
function isContent(page) {
    return CONTENT_DIRS.includes(page.dir);
}
function isGenerated(page) {
    return page.rel === 'index.md' || page.rel === 'log.md';
}
function loadPages() {
    const pages = [];
    const push = (abs, dir) => {
        const raw = fs.readFileSync(abs, 'utf8');
        const parsed = parseFrontmatter(raw);
        const name = path.basename(abs);
        pages.push({ abs, rel: dir === 'root' ? name : `${dir}/${name}`, id: name.replace(/\.md$/, ''), dir, raw, body: parsed.body, fm: parsed.fm });
    };
    for (const abs of listMd(WIKI_DIR))
        push(abs, 'root');
    for (const dir of CONTENT_DIRS)
        for (const abs of listMd(path.join(WIKI_DIR, dir)))
            push(abs, dir);
    return pages;
}
/** index.md 与 lint 报告都取正文第一条 `> ` 引用行作为一句话摘要。 */
function summaryOf(page) {
    for (const line of page.body.split(/\r?\n/)) {
        if (line.startsWith('> '))
            return line.slice(2).trim();
    }
    return '';
}
function extractLinks(body) {
    const prose = stripCodeFences(body);
    const refs = [];
    const re = /\[[^\]]*\]\(([^)\s]+)\)/g;
    let m;
    while ((m = re.exec(prose))) {
        refs.push({ target: m[1], line: lineOf(prose, m[0]) });
    }
    return refs;
}
function decodeTarget(target) {
    const clean = target.split('#')[0];
    try {
        return decodeURIComponent(clean);
    }
    catch {
        return clean;
    }
}
function normalizeRepoPath(p) {
    return p.replace(/\\/g, '/').replace(/^\.\//, '');
}
function isUnderRegisteredPrefix(rel) {
    return RAW_PREFIXES.some((p) => rel === p.replace(/\/$/, '') || rel.startsWith(p));
}
const statCache = new Map();
function statRepo(rel) {
    const key = normalizeRepoPath(rel);
    const hit = statCache.get(key);
    if (hit)
        return hit;
    const abs = path.join(REPO_DIR, key);
    let out = { exists: false, isFile: false, lines: 0 };
    if (fs.existsSync(abs)) {
        const st = fs.statSync(abs);
        if (st.isFile()) {
            const content = fs.readFileSync(abs, 'utf8');
            out = { exists: true, isFile: true, lines: content.split(/\r?\n/).length };
        }
        else {
            out = { exists: true, isFile: false, lines: 0 };
        }
    }
    statCache.set(key, out);
    return out;
}
/**
 * 构建产物判定（SCHEMA §二 禁引清单）：
 * `01/**.js` 与 `app/renderer/` 恒为产物；`app/**.js` 当 `app/src/` 存在同名 `.ts` 时是产物，
 * 否则是 AGENTS.md 记录的手写 JS 例外。
 */
function isProductPath(rel) {
    const p = normalizeRepoPath(rel);
    if (p.startsWith('app/renderer/') || p.startsWith('app/dist/'))
        return true;
    if (/^01\/.*\.js$/.test(p))
        return true;
    if (/^01\/work\/.*\.js$/.test(p))
        return true;
    if (p.startsWith('app/') && p.endsWith('.js')) {
        return fs.existsSync(path.join(REPO_DIR, 'app', 'src', p.slice('app/'.length).replace(/\.js$/, '.ts')));
    }
    return false;
}
function bannedReason(rel) {
    const p = normalizeRepoPath(rel);
    if (FORBIDDEN_PATH.some((bad) => p.includes(bad)))
        return '不随 git 共享的本机路径';
    if (BANNED_PATH.some((bad) => p.includes(bad)))
        return '运行时数据或密钥文件';
    if (/^[A-Za-z]:\//.test(p) || p.startsWith('/'))
        return '绝对路径';
    return '';
}
const gitDateCache = new Map();
function lastCommitDate(relToRepo) {
    const key = normalizeRepoPath(relToRepo);
    if (gitDateCache.has(key))
        return gitDateCache.get(key) ?? null;
    let date = null;
    try {
        const out = (0, child_process_1.execFileSync)('git', ['-C', REPO_DIR, 'log', '-1', '--format=%cs', '--', key], { encoding: 'utf8', timeout: 8000 }).trim();
        date = ISO_DATE.test(out) ? out : null;
    }
    catch {
        date = null;
    }
    gitDateCache.set(key, date);
    return date;
}
function validDate(s) {
    const m = ISO_DATE.exec(s);
    if (!m)
        return false;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const date = new Date(Date.UTC(y, mo - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d && mo >= 1 && mo <= 12;
}
function today() {
    return new Date().toISOString().slice(0, 10);
}
function checkPageIdentity(pages) {
    const seen = new Map();
    for (const page of pages) {
        if (ILLEGAL_NAME.test(page.id))
            add('E', 'NAME-ILLEGAL', page.rel, 0, `文件名含空格或非法字符：${path.basename(page.abs)}`);
        const key = page.id.toLowerCase();
        const prev = seen.get(key);
        if (prev)
            add('E', 'NAME-DUP', page.rel, 0, `页面 id 与 ${prev} 重复（文件名即唯一标识）`);
        seen.set(key, page.rel);
        if (page.raw.includes('\r\n'))
            add('W', 'EOL-CRLF', page.rel, 0, 'CRLF 换行；.gitattributes 已约定 wiki/*.md 用 LF');
        if (page.raw.charCodeAt(0) === 0xfeff)
            add('E', 'BOM', page.rel, 0, '含 UTF-8 BOM');
    }
}
function checkFrontmatter(page) {
    if (isGenerated(page))
        return;
    if (!parseFrontmatter(page.raw).ok) {
        add('E', 'FM-MISSING', page.rel, 0, '缺少 YAML frontmatter');
        return;
    }
    for (const key of FRONTMATTER_FIELDS) {
        if (page.fm[key] === undefined)
            add('E', 'FM-FIELD', page.rel, 0, `frontmatter 缺字段：${key}`);
    }
    for (const key of Object.keys(page.fm)) {
        if (!FRONTMATTER_FIELDS.includes(key))
            add('W', 'FM-UNKNOWN-FIELD', page.rel, lineOf(page.raw, `${key}:`), `frontmatter 有契约未定义的字段：${key}`);
    }
    const type = asString(page.fm.type);
    if (type && !TYPES.includes(type))
        add('E', 'FM-TYPE', page.rel, lineOf(page.raw, 'type:'), `type 非法：${type}（允许 ${TYPES.join('|')}）`);
    if (isContent(page) && type && type !== DIR_TO_TYPE[page.dir])
        add('E', 'FM-TYPE-DIR', page.rel, lineOf(page.raw, 'type:'), `type=${type} 与目录 ${page.dir}/ 不一致（应为 ${DIR_TO_TYPE[page.dir]}）`);
    if (page.rel === 'SCHEMA.md' && type && type !== 'schema')
        add('E', 'FM-TYPE-DIR', page.rel, lineOf(page.raw, 'type:'), 'SCHEMA.md 的 type 应为 schema');
    if (page.rel === 'overview.md' && type === 'meta')
        add('E', 'FM-TYPE', page.rel, lineOf(page.raw, 'type:'), 'overview.md 是手写综述页，type 不应为 meta');
    const status = asString(page.fm.status);
    if (status && !STATUSES.includes(status))
        add('E', 'FM-STATUS', page.rel, lineOf(page.raw, 'status:'), `status 非法：${status}（允许 ${STATUSES.join('|')}）`);
    if (status === 'disputed' && !stripCodeFences(page.body).includes('⚠️'))
        add('E', 'FM-STATUS', page.rel, lineOf(page.raw, 'status:'), 'status=disputed 但页内没有 ⚠️ 冲突行');
    const updated = asString(page.fm.updated);
    if (updated && !validDate(updated))
        add('E', 'FM-DATE', page.rel, lineOf(page.raw, 'updated:'), `updated 非 ISO 日期：${updated}`);
    else if (updated && updated > today())
        add('E', 'FM-DATE-FUTURE', page.rel, lineOf(page.raw, 'updated:'), `updated 在未来：${updated}`);
    if (page.fm.tags !== undefined && asArray(page.fm.tags).length === 0)
        add('E', 'FM-TAGS', page.rel, lineOf(page.raw, 'tags:'), 'tags 为空');
    if (isContent(page) && page.fm.sources !== undefined && asArray(page.fm.sources).length === 0)
        add('E', 'FM-SOURCES', page.rel, lineOf(page.raw, 'sources:'), 'sources 为空（每页必须可溯源）');
}
function checkBody(page) {
    if (isGenerated(page))
        return;
    const title = asString(page.fm.title);
    const heading = /^[ \t]*#[ \t]+(.+?)[ \t]*$/m.exec(page.body);
    if (!heading)
        add('E', 'BODY-H1', page.rel, 0, '正文缺少一级标题');
    else if (title && heading[1] !== title)
        add('E', 'BODY-TITLE', page.rel, lineOf(page.body, heading[0]), `一级标题「${heading[1]}」与 frontmatter title「${title}」不一致`);
    if ((isContent(page) || page.rel === 'overview.md' || page.rel === 'SCHEMA.md') && !summaryOf(page)) {
        add('E', 'BODY-SUMMARY', page.rel, heading ? lineOf(page.body, heading[0]) : 0, '缺少 `> 一句话摘要`（index.md 与 overview 依赖它）');
    }
    const prose = stripCodeFences(page.body);
    if (isContent(page)) {
        if (!/^[ \t]*##[ \t]+关联[ \t]*$/m.test(page.body))
            add('W', 'BODY-RELATED', page.rel, 0, '缺 `## 关联` 分节');
        if (/\[\[[^\]]+\]\]/.test(prose))
            add('E', 'LINK-WIKILINK', page.rel, lineOf(page.body, '[['), '使用了 Obsidian [[wikilink]]，须改为相对 markdown 链接');
    }
    if (prose.includes('⚠️')) {
        const lines = prose.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            // 行内代码里的 `⚠️` 是在描述契约本身，不算冲突声明
            if (!lines[i].replace(/`[^`]*`/g, '').includes('⚠️'))
                continue;
            if (!/\]\([^)]*\.md(?:#[^)]*)?\)/.test(lines[i]))
                add('W', 'CONTRA-LINK', page.rel, i + 1, '⚠️ 冲突行未链接到发生冲突的另一页');
        }
    }
    for (const [label, re] of SECRET_PATTERNS) {
        const m = re.exec(prose);
        if (m)
            add('E', 'SECRET', page.rel, lineOf(page.body, m[0]), `疑似密钥（${label}）：${m[0].slice(0, 12)}…`);
    }
}
function checkSources(page) {
    if (isGenerated(page) || page.rel === 'SCHEMA.md')
        return;
    for (const src of asArray(page.fm.sources)) {
        const line = lineOf(page.raw, src);
        const rel = normalizeRepoPath(src);
        const banned = bannedReason(rel);
        if (banned) {
            add('E', 'SRC-UNSHARED', page.rel, line, `sources 引用了${banned}：${src}`);
            continue;
        }
        if (src === '全部' || src === 'all') {
            add('E', 'SRC-VAGUE', page.rel, line, 'sources 写了「全部」，必须列出可核验的具体路径');
            continue;
        }
        if (isProductPath(rel)) {
            add('E', 'SRC-PRODUCT', page.rel, line, `sources 指向构建产物：${src}（改引 app/src/ 下对应手写源）`);
            continue;
        }
        if (rel.startsWith('wiki/')) {
            if (!statRepo(rel).exists)
                add('E', 'SRC-MISSING', page.rel, line, `sources 指向不存在的页面：${src}`);
            continue;
        }
        if (!isUnderRegisteredPrefix(rel)) {
            add('E', 'SRC-UNREGISTERED', page.rel, line, `sources 路径不在 Raw 登记表内：${src}（新增资料簇先改 SCHEMA §二）`);
            continue;
        }
        if (!statRepo(rel).exists)
            add('E', 'SRC-MISSING', page.rel, line, `sources 路径在仓库中不存在：${src}`);
    }
}
/** 提取正文里的反引号证据引用；只处理落在 Raw 登记表内的路径，避免误伤普通词。 */
function extractEvidence(body) {
    const prose = stripCodeFences(body);
    const out = [];
    const lines = prose.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        let m;
        BACKTICK.lastIndex = 0;
        while ((m = BACKTICK.exec(lines[i]))) {
            const c = CITATION.exec(m[1].trim());
            if (!c)
                continue;
            const rel = normalizeRepoPath(c[1]);
            // 登记表外的普通词不校验；但构建产物要抓出来，否则"别引产物"成了空规则。
            // 绝对路径/斜杠开头的接口路径（如 `/api/chat`）留给 sources: 检查，不在正文里误伤。
            if (!isUnderRegisteredPrefix(rel) && !isProductPath(rel))
                continue;
            const from = c[2] ? Number(c[2]) : 0;
            const to = c[3] ? Number(c[3]) : from;
            out.push({ file: rel, from, to, line: i + 1, text: m[0] });
        }
    }
    return out;
}
function checkEvidence(page) {
    if (isGenerated(page) || !isContent(page))
        return;
    const refs = extractEvidence(page.body);
    if (!refs.length) {
        add('W', 'EVID-NONE', page.rel, 0, '整页没有 `路径:行号` 形式的可核验引用（SCHEMA §四.2）');
    }
    for (const ref of refs) {
        const banned = bannedReason(ref.file);
        if (banned) {
            add('E', 'EVID-BAD', page.rel, ref.line, `证据引用了${banned}：${ref.file}`);
            continue;
        }
        if (isProductPath(ref.file)) {
            add('E', 'EVID-PRODUCT', page.rel, ref.line, `证据指向构建产物：${ref.file}（下次构建会改写，行号随之漂移）`);
            continue;
        }
        const st = statRepo(ref.file);
        if (!st.exists) {
            add('E', 'EVID-BAD', page.rel, ref.line, `证据路径不存在：${ref.file}`);
            continue;
        }
        if (!ref.from)
            continue;
        if (!st.isFile) {
            add('E', 'EVID-RANGE', page.rel, ref.line, `目录不能带行号：${ref.text}`);
            continue;
        }
        if (ref.from < 1 || ref.to > st.lines)
            add('E', 'EVID-RANGE', page.rel, ref.line, `行号越界：${ref.file} 只有 ${st.lines} 行，引用 ${ref.from}${ref.to !== ref.from ? `-${ref.to}` : ''}`);
        if (ref.from > ref.to)
            add('E', 'EVID-RANGE', page.rel, ref.line, `行号区间反向：${ref.text}`);
    }
}
/** 校验页内链接可达性，返回该页指向的 wiki 页面 rel（供入链统计）。 */
function checkLinks(page, byAbs) {
    const targets = [];
    for (const ref of extractLinks(page.body)) {
        if (ref.target.startsWith('#') || /^(https?:|mailto:)/i.test(ref.target))
            continue;
        const resolved = path.resolve(path.dirname(page.abs), decodeTarget(ref.target));
        const hit = byAbs.get(resolved);
        if (hit) {
            if (hit !== page.rel)
                targets.push(hit);
            continue;
        }
        if (resolved.startsWith(WIKI_DIR + path.sep))
            add('E', 'LINK-BROKEN', page.rel, ref.line, `断链（wiki 内目标不存在）：${ref.target}`);
        else if (!fs.existsSync(resolved))
            add('E', 'LINK-BROKEN', page.rel, ref.line, `断链（仓库内目标不存在）：${ref.target}`);
    }
    return targets;
}
function checkStaleness(page) {
    const updated = asString(page.fm.updated);
    if (!updated || isGenerated(page))
        return;
    for (const src of asArray(page.fm.sources)) {
        const rel = normalizeRepoPath(src);
        if (rel.startsWith('wiki/'))
            continue;
        if (!statRepo(rel).exists)
            continue;
        const committed = lastCommitDate(rel);
        if (committed && committed > updated)
            add('W', 'STALE', page.rel, lineOf(page.raw, 'updated:'), `updated=${updated} 早于源最后提交 ${committed}（${src}），需重新核实`);
    }
}
function buildIndex(pages) {
    const lines = [
        '---',
        'type: meta',
        'title: 墨台 Wiki · 索引',
        'tags: [index, 导航]',
        'sources: [wiki/SCHEMA.md]',
        `updated: ${today()}`,
        'status: stable',
        '---',
        '',
        '# 墨台 Wiki · 索引',
        '',
        '> 生成物：由 `npm run wiki:lint -- --fix` 从各页 frontmatter 与摘要行重写，请勿手改。',
        '> 入门读 [overview.md](overview.md)；契约见 [SCHEMA.md](SCHEMA.md)；时间线见 [log.md](log.md)。',
        '',
    ];
    const content = pages.filter(isContent).sort((a, b) => a.rel.localeCompare(b.rel, 'en'));
    for (const dir of INDEX_ORDER) {
        lines.push(`## ${INDEX_TITLES[dir]}`, '');
        const inDir = content.filter((p) => p.dir === dir);
        if (!inDir.length) {
            lines.push('_（空）_', '');
            continue;
        }
        for (const p of inDir) {
            const status = asString(p.fm.status);
            const badge = status && status !== 'stable' ? ` 〔${status}〕` : '';
            lines.push(`- [${asString(p.fm.title) || p.id}](${p.rel}) — ${summaryOf(p) || '_缺摘要_'}${badge}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
function checkIndexCoverage(pages, expected) {
    const abs = path.join(WIKI_DIR, 'index.md');
    if (!fs.existsSync(abs)) {
        add('E', 'INDEX-MISSING', 'index.md', 0, 'index.md 不存在，跑 `npm run wiki:lint -- --fix` 生成');
        return;
    }
    const raw = fs.readFileSync(abs, 'utf8');
    if (raw.replace(/^\uFEFF/, '').trimEnd() === expected.trimEnd())
        return;
    const listed = new Set(extractLinks(parseFrontmatter(raw).body).map((r) => normalizeRepoPath(decodeTarget(r.target))));
    const missing = pages.filter((p) => isContent(p) && !listed.has(p.rel));
    const ghost = [...listed].filter((rel) => rel.includes('/') && !pages.some((p) => p.rel === rel));
    const why = missing.length
        ? `未收录：${missing.slice(0, 4).map((m) => m.rel).join(', ')}${missing.length > 4 ? ' …' : ''}`
        : ghost.length
            ? `收录了不存在的页：${ghost.join(', ')}`
            : '摘要或顺序与页面集不一致';
    add('E', 'INDEX-DRIFT', 'index.md', 0, `index.md 已过期（${why}），跑 \`npm run wiki:lint -- --fix\``);
}
function checkLog() {
    const abs = path.join(WIKI_DIR, 'log.md');
    if (!fs.existsSync(abs)) {
        add('E', 'LOG-MISSING', 'log.md', 0, 'log.md 不存在');
        return;
    }
    const entryRe = /^## \[(\d{4}-\d{2}-\d{2})\] ([a-z]+) \| (.+)$/;
    let prev = '';
    let count = 0;
    fs.readFileSync(abs, 'utf8').split(/\r?\n/).forEach((line, i) => {
        if (!line.startsWith('## ['))
            return;
        count++;
        const m = entryRe.exec(line);
        if (!m) {
            add('E', 'LOG-FORMAT', 'log.md', i + 1, '条目格式不符：应为 `## [YYYY-MM-DD] <op> | <标题> — @<作者>`');
            return;
        }
        const date = m[1];
        const op = m[2];
        const title = m[3];
        if (!validDate(date))
            add('E', 'LOG-DATE', 'log.md', i + 1, `日期非法：${date}`);
        if (!LOG_OPS.includes(op))
            add('E', 'LOG-OP', 'log.md', i + 1, `操作类型非法：${op}（允许 ${LOG_OPS.join('|')}）`);
        if (!/—\s*@\S+$/.test(title))
            add('E', 'LOG-AUTHOR', 'log.md', i + 1, '条目缺作者署名（结尾应为 ` — @作者`）');
        if (prev && date < prev)
            add('W', 'LOG-ORDER', 'log.md', i + 1, `日期倒序：${date} 接在 ${prev} 之后`);
        prev = date;
    });
    if (!count)
        add('E', 'LOG-EMPTY', 'log.md', 0, 'log.md 没有任何条目');
}
function checkConnectivity(pages, inbound) {
    for (const page of pages) {
        if (!isContent(page))
            continue;
        const refs = extractLinks(page.body).filter((r) => /\.md($|#)/i.test(decodeTarget(r.target)));
        if (!refs.length)
            add('W', 'LINK-THIN', page.rel, 0, '页内没有指向 .md 的相对链接；交叉引用是本 Wiki 的价值核心');
        if (!inbound.has(page.rel))
            add('W', 'ORPHAN', page.rel, 0, '无入链（overview.md 与其它内容页都没指向它；index.md 是生成物，不计入入链）');
    }
}
function parseFlags(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        if (!argv[i].startsWith('--'))
            continue;
        const key = argv[i].slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
            out[key] = next;
            i++;
        }
        else {
            out[key] = 'true';
        }
    }
    return out;
}
function gitUser() {
    try {
        const name = (0, child_process_1.execFileSync)('git', ['-C', REPO_DIR, 'config', 'user.name'], { encoding: 'utf8', timeout: 5000 }).trim();
        return name || 'unknown';
    }
    catch {
        return 'unknown';
    }
}
function ensureDirs() {
    for (const dir of CONTENT_DIRS) {
        const abs = path.join(WIKI_DIR, dir);
        if (!fs.existsSync(abs))
            fs.mkdirSync(abs, { recursive: true });
    }
}
/** --add <type 或 dir>/<id>：按 SCHEMA §四 模板生成骨架页；已存在则不覆盖。 */
function addPage(spec, title, sources) {
    const m = /^([a-z]+)\/(.+)$/.exec(spec);
    const dir = m ? (CONTENT_DIRS.includes(m[1]) ? m[1] : (Object.keys(DIR_TO_TYPE).find((d) => DIR_TO_TYPE[d] === m[1]) ?? '')) : '';
    if (!dir)
        return `--add 参数非法：${spec}（应为 ${CONTENT_DIRS.map((d) => `${DIR_TO_TYPE[d]}/<id>`).join(' | ')}）`;
    const type = DIR_TO_TYPE[dir];
    const id = m[2];
    if (ILLEGAL_NAME.test(id))
        return `页面 id 含空格或非法字符：${id}`;
    ensureDirs();
    const abs = path.join(WIKI_DIR, dir, `${id}.md`);
    if (fs.existsSync(abs))
        return `${dir}/${id}.md 已存在，未覆盖`;
    const heading = title || id;
    const srcList = sources ? sources.split(',').map((s) => normalizeRepoPath(s.trim())).filter(Boolean) : ['app/src/'];
    const text = [
        '---',
        `type: ${type}`,
        `title: ${heading}`,
        `tags: [${type}, 待补]`,
        `sources: [${srcList.join(', ')}]`,
        `updated: ${today()}`,
        'status: draft',
        '---',
        '',
        `# ${heading}`,
        '',
        '> 一句话摘要：这页讲什么（index.md 取这一行）。',
        '',
        '## 正文',
        '',
        '事实句后用反引号给仓库路径与行号作为证据，例如 `app/src/tools/wiki-lint.ts:1`。',
        '',
        '## 关联',
        '',
        '- 相关页：[overview](../overview.md)',
        '',
    ].join('\n');
    fs.writeFileSync(abs, text, 'utf8');
    return `已创建 ${dir}/${id}.md（status: draft）—— 填完正文后把 status 改成 stable 并跑 --fix`;
}
/** --log op "标题"：向 append-only 时间线追加一条条目。 */
function appendLog(op, title, author) {
    if (!LOG_OPS.includes(op))
        return `--log 操作类型非法：${op}（允许 ${LOG_OPS.join('|')}）`;
    const abs = path.join(WIKI_DIR, 'log.md');
    if (!fs.existsSync(abs))
        return 'log.md 不存在，先按 SCHEMA §八 建好表头';
    let raw = fs.readFileSync(abs, 'utf8');
    const entry = `\n## [${today()}] ${op} | ${title || '（无标题）'} — @${author || gitUser()}\n`;
    if (!raw.endsWith('\n'))
        raw += '\n';
    fs.writeFileSync(abs, raw.replace(/^\uFEFF/, '') + entry, 'utf8');
    return `已追加 log.md 条目：[${today()}] ${op} | ${title}`;
}
function main() {
    const argv = process.argv.slice(2);
    const flags = parseFlags(argv);
    if (!fs.existsSync(WIKI_DIR)) {
        process.stderr.write(`找不到 wiki 目录：${WIKI_DIR}\n`);
        return 2;
    }
    if (flags.add) {
        process.stdout.write(`${addPage(String(flags.add), flags.title ?? '', flags.sources ?? '')}\n`);
        return 0;
    }
    if (flags.log) {
        process.stdout.write(`${appendLog(String(flags.log), flags.title ?? '', flags.author ?? '')}\n`);
        return 0;
    }
    const pages = loadPages();
    const byAbs = new Map(pages.map((p) => [path.resolve(p.abs), p.rel]));
    checkPageIdentity(pages);
    const inbound = new Map();
    for (const page of pages) {
        checkFrontmatter(page);
        checkBody(page);
        checkSources(page);
        checkEvidence(page);
        checkStaleness(page);
        if (page.rel === 'index.md')
            continue; // 生成物作为入链来源没有意义
        for (const target of checkLinks(page, byAbs))
            inbound.set(target, (inbound.get(target) ?? 0) + 1);
    }
    checkConnectivity(pages, inbound);
    checkLog();
    const expected = buildIndex(pages);
    if (flags.fix) {
        const abs = path.join(WIKI_DIR, 'index.md');
        const before = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
        if (before.replace(/^\uFEFF/, '').trimEnd() !== expected.trimEnd()) {
            fs.writeFileSync(abs, expected, 'utf8');
            process.stdout.write('index.md 已重新生成\n');
        }
        else {
            process.stdout.write('index.md 无需更新\n');
        }
    }
    checkIndexCoverage(pages, expected);
    const errors = findings.filter((f) => f.severity === 'E');
    const warnings = findings.filter((f) => f.severity === 'W');
    const sorted = [...findings].sort((a, b) => a.severity.localeCompare(b.severity) || a.page.localeCompare(b.page, 'en') || a.line - b.line);
    for (const f of sorted) {
        process.stdout.write(`${f.severity} ${f.code.padEnd(18)} ${f.page}${f.line ? `:${f.line}` : ''}  ${f.message}\n`);
    }
    const pageCount = pages.filter(isContent).length;
    const linkCount = [...inbound.values()].reduce((a, b) => a + b, 0);
    process.stdout.write(`\n检查 ${pageCount} 个内容页 + ${pages.length - pageCount} 个根文件；有效交叉引用 ${linkCount} 条：${errors.length} error，${warnings.length} warning\n`);
    if (!errors.length && warnings.length)
        process.stdout.write('（warning 不阻塞合并，但 STALE / ORPHAN / EVID-NONE 应进下次维护周期）\n');
    return errors.length ? 1 : 0;
}
process.exit(main());
