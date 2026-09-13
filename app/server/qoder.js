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
exports.BUILTIN_AGENTS = exports.MODEL_TIERS = exports.PERMISSION_MODES = exports.SDK_BUILTIN_DEFAULT = void 0;
exports.buildScienceServer = buildScienceServer;
exports.makeCanUseTool = makeCanUseTool;
exports.createQoder = createQoder;
/* ==================================================================
   qoder.ts · Work 模式底座：Qoder Agent SDK 封装
   - Agent 循环、工具调用、MCP 客户端、模型管理全部交给 SDK，不自研
   - 沙箱边界层：cwd 指到沙箱工作目录；canUseTool 拦高危 Bash 与越界写
   - 科研扩展：in-process MCP server（arxiv / fetch / web / kb / note / run_code）
     ——这些是 SDK 原生没有、ChatScience 补上的能力
   - 多轮：SDK 原生 resume（conv.sdkSessionId），不手工拼历史

   诚实边界（与 policy.ts 一致）：
   - canUseTool 对 Bash 的拦截是命令文本静态扫描，可被绕过；cwd 隔离依赖 SDK
     自身的目录约束。需要硬隔离的执行走 run_code（独立进程沙箱）。
   - settingSources:[] + strictMcpConfig:true 是隔离的关键：否则 SDK 会继承本机
     qoderclicn 的全部用户配置（包括几百个 MCP 工具），沙箱形同虚设。

   类型：全部走 shared/qoder-sdk 重导出的官方 SDK 类型（Options / SDKMessage /
   CanUseTool / PermissionResult / AgentDefinition / McpServerConfig 等）。
   ================================================================== */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const zod_1 = require("zod");
const policyMod = __importStar(require("./policy"));
const research = __importStar(require("./research"));
const qoder_sdk_1 = require("../shared/qoder-sdk");
const domain_1 = require("../shared/domain");
const MODEL_OUT_CAP = 8000; /* 工具结果回灌给模型的最大字符数 */
function cap(s, n) {
    const str = typeof s === 'string' ? s : JSON.stringify(s, null, 1);
    if (str.length <= (n || MODEL_OUT_CAP))
        return str;
    return str.slice(0, (n || MODEL_OUT_CAP)) + '\n…[已截断，完整内容请分段读取]…';
}
function truncateStr(s, n) {
    s = String(s === undefined || s === null ? '' : s);
    return s.length > n ? s.slice(0, n) + '…' : s;
}
/* SDK 内建工具白名单（科研 Agent 的合理全集；init 实测可用名） */
exports.SDK_BUILTIN_DEFAULT = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch', 'NotebookEdit'];
exports.PERMISSION_MODES = ['default', 'acceptEdits', 'auto', 'plan', 'dontAsk'];
exports.MODEL_TIERS = ['auto', 'ultimate', 'performance', 'efficient', 'lite'];
/* 内建智能体（首次启动播种进 work.json；用户可编辑可删除） */
exports.BUILTIN_AGENTS = [
    {
        id: 'agent-research', name: '通用Agent', role: 'research', builtin: true,
        description: '文献检索与精读、公式推导、架构分析；给出结论时附来源与推导。',
        systemPrompt: '你是一位严谨的大模型方向科研助理。优先检索再断言；结论区分"论文声称"与"数据支撑"；关键结论写入实验笔记。',
        model: 'performance', permissionMode: 'default', maxTurns: 16,
        tools: { sdk: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'WebFetch', 'WebSearch'], builtin: ['science'] },
        skills: ['paper-deep-read', 'lit-review', 'formula-derivation', 'model-arch-analysis', 'experiment-log'],
        sandbox: { scope: 'global' }
    },
    {
        id: 'agent-repro', name: '代码复现', role: 'code', builtin: true,
        description: '在沙箱里把论文方法跑起来：MindSpore/Python 实现、小样本验证、训练诊断。',
        systemPrompt: '你是一位代码复现专家。先读通方法再动手；严格"小样本先验证再放大"；每阶段用 note_write 记录配置与结果；图表存 out/。',
        model: 'performance', permissionMode: 'acceptEdits', maxTurns: 24,
        tools: { sdk: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'NotebookEdit'], builtin: ['science'] },
        skills: ['paper-repro-plan', 'mindspore-repro', 'loss-curve-analysis', 'figure-plot', 'experiment-log'],
        sandbox: { scope: 'agent' }
    },
    {
        id: 'agent-analysis', name: '数据分析', role: 'analysis', builtin: true,
        description: '实验数据处理与可视化：统计检验、分组对比、出版级图表。',
        systemPrompt: '你是一位数据分析专家。先看数据再下结论；统计方法与数据性质匹配；结论附数值证据；图表同时导出 PDF 与 PNG 到 out/。',
        model: 'performance', permissionMode: 'acceptEdits', maxTurns: 16,
        tools: { sdk: ['Read', 'Write', 'Glob', 'Bash', 'NotebookEdit'], builtin: ['science'] },
        skills: ['data-analysis', 'figure-plot', 'ablation-design'],
        sandbox: { scope: 'agent' }
    },
    {
        id: 'agent-discuss', name: '科研探讨助手', role: 'research', builtin: true,
        description: '只读科研交流：读你的代码与文档，讨论思路、答疑、审阅方案，不改动任何文件。',
        systemPrompt: '你是一位科研探讨伙伴。只读取与分析，绝不修改文件；回答先给结论再给依据；引用用户文件时注明文件名与大致位置。',
        model: 'performance', permissionMode: 'default', maxTurns: 16,
        tools: { sdk: ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch'], builtin: ['science'], scienceTools: ['arxiv_search', 'fetch_url', 'web_search', 'kb_search'] },
        skills: ['paper-deep-read', 'formula-derivation', 'model-arch-analysis', 'lit-review'],
        sandbox: { scope: 'global' }
    }
];
function readConfig(appRoot) {
    try {
        return JSON.parse(fs.readFileSync(path.join(appRoot, 'server', 'qoder.json'), 'utf8')) || {};
    }
    catch (e) {
        return {};
    }
}
/* ---------------- in-process 科研工具 server ---------------- */
/* SDK tool() 的 handler 返回 CallToolResult：{ content:[{type:'text',text}], isError? } */
function mcpResult(value) {
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 1);
    return { content: [{ type: 'text', text: cap(text) }] };
}
function mcpError(msg) {
    return { isError: true, content: [{ type: 'text', text: String(msg) }] };
}
function buildScienceServer(sciCtx, sdk) {
    const { tool, createSdkMcpServer } = sdk;
    const arxivSearch = tool('arxiv_search', '检索 arXiv 论文（官方 API，免 key），返回标题、作者、摘要、arXiv id 与 PDF 链接。适合文献初筛与找复现目标。', { query: zod_1.z.string().describe('关键词，多个词按 AND 组合'), maxResults: zod_1.z.number().int().min(1).max(20).optional().describe('默认 5') }, async function (args) {
        try {
            return mcpResult(await research.arxivSearch(args));
        }
        catch (e) {
            return mcpError(e.message);
        }
    }, { annotations: { readOnlyHint: true } });
    const fetchUrl = tool('fetch_url', '抓取 http/https 网页并返回剥掉 HTML 的正文（截断）。用于核对检索结果原文。不支持 PDF——已导入知识库的论文请用 kb_search。', { url: zod_1.z.string().describe('完整 URL'), maxChars: zod_1.z.number().int().optional().describe('默认 12000') }, async function (args) {
        try {
            return mcpResult(await research.fetchUrl(args));
        }
        catch (e) {
            return mcpError(e.message);
        }
    }, { annotations: { readOnlyHint: true } });
    const webSearch = tool('web_search', '联网检索（无 key 公开端点）。已知脆弱点：依赖第三方 HTML 解析，可能失效或质量有限；重要结论务必用 fetch_url 核对原文。', { query: zod_1.z.string() }, async function (args) {
        try {
            return mcpResult(await research.webSearch(args));
        }
        catch (e) {
            return mcpError(e.message);
        }
    }, { annotations: { readOnlyHint: true } });
    const kbSearch = tool('kb_search', '本地知识库 BM25 词法检索（不是语义检索），返回带 score 的段落。仅命中已建立索引的文件；若提示"尚未索引"，请告知用户在知识与数据库页重新导入文件。', {
        query: zod_1.z.string(),
        kbId: zod_1.z.string().optional().describe('限定某个知识库'),
        topK: zod_1.z.number().int().optional().describe('默认 5')
    }, async function (args) {
        try {
            if (!sciCtx.kb)
                return mcpError('知识库检索模块不可用');
            return mcpResult(await Promise.resolve(sciCtx.kb.search(args)));
        }
        catch (e) {
            return mcpError(e.message);
        }
    }, { annotations: { readOnlyHint: true } });
    const noteWrite = tool('note_write', '写入或更新一条实验笔记（与用户在笔记本页看到的是同一份）。记录实验配置、结果与结论。传 noteId 即更新。', { noteId: zod_1.z.string().optional(), title: zod_1.z.string().describe('笔记标题'), content: zod_1.z.string().describe('Markdown 正文') }, async function (args) {
        try {
            const rec = sciCtx.notes.upsert({
                id: args.noteId, title: args.title, content: args.content,
                source: 'agent', convId: sciCtx.convId || null
            });
            return mcpResult({ noteId: rec.id, title: rec.title, updatedAt: rec.updatedAt, hint: '用户可在 笔记本 页看到这条笔记' });
        }
        catch (e) {
            return mcpError(e.message);
        }
    });
    const runCode = tool('run_code', '在独立沙箱进程里执行一段代码（python/node/shell），比直接用 Bash 更隔离：独立工作目录、超时强杀进程树、输出截断、破坏性命令静态拦截。'
        + 'matplotlib 已配置 Agg 后端，图片保存到 out/ 下会自动回传。返回 stdout/stderr 与产物列表。优先小样本验证再放大。', {
        lang: zod_1.z.string().optional().describe('python | node | shell，默认 python'),
        code: zod_1.z.string().describe('完整代码'),
        timeoutMs: zod_1.z.number().int().optional().describe('覆盖默认超时')
    }, async function (args) {
        try {
            const r = await sciCtx.sandbox.execCode({
                scopeId: sciCtx.scopeId, cwd: sciCtx.workspaceRoot || undefined, lang: args.lang || 'python', code: String(args.code || ''),
                policyOverride: args.timeoutMs ? { timeoutMs: args.timeoutMs } : undefined,
                onEvent: sciCtx.onToolStream ? function (kind, delta) { sciCtx.onToolStream(kind, delta); } : null
            });
            return mcpResult({
                ok: r.ok, exitCode: r.exitCode, timedOut: r.timedOut, blocked: r.blocked, blockReason: r.blockReason,
                stdout: truncateStr(r.stdout, 6000), stderr: truncateStr(r.stderr, 4000),
                durationMs: r.durationMs,
                files: (r.files || []).map(function (f) { return { relPath: f.relPath, size: f.size, isImage: f.isImage, inlined: !!f.dataUrl }; })
            });
        }
        catch (e) {
            return mcpError(e.message);
        }
    });
    return createSdkMcpServer({
        name: 'chatscience',
        tools: [arxivSearch, fetchUrl, webSearch, kbSearch, noteWrite, runCode]
    });
}
/* canUseTool 沙箱策略：deny 的原因会回给模型，模型通常下一轮自行调整 */
function makeCanUseTool(cwd, policy, log) {
    return async function (toolName, input, options) {
        void options;
        try {
            if (toolName === 'Bash') {
                const scan = policyMod.scanCode(String((input && input.command) || ''), policy);
                if (scan.blocked) {
                    log('canUseTool deny Bash: ' + scan.reason);
                    return { behavior: 'deny', message: '已拦截高危命令：' + scan.reason + '（静态拦截，防误操作；如确需执行请换方式）' };
                }
            }
            if (toolName === 'Write' || toolName === 'Edit') {
                const p = String((input && (input.file_path || input.notebook_path)) || '');
                if (p) {
                    try {
                        policyMod.assertInside(cwd, p);
                    }
                    catch (e) {
                        log('canUseTool deny ' + toolName + ': ' + e.message);
                        return { behavior: 'deny', message: '路径超出沙箱工作目录，禁止写入：' + p + '（产物请写到 cwd 内，图片建议 out/ 子目录）' };
                    }
                }
            }
        }
        catch (e) {
            log('canUseTool error: ' + e.message); /* 守卫自身出错不阻断会话 */
        }
        return { behavior: 'allow', updatedInput: input };
    };
}
/* ---------------- 会话运行 ---------------- */
function createQoder(appRoot, ctx) {
    const log = ctx.log;
    const cfg = readConfig(appRoot);
    const BUILTIN_SKILL_PLUGIN = path.join(appRoot, 'server', 'skills-plugin');
    const USER_SKILL_PLUGIN = path.join(appRoot, 'data', 'skills-plugin');
    /* 用户技能插件目录按 SDK local plugin 约定初始化，内建技能播种进去（缺哪些补哪些） */
    function ensureSkillPlugin() {
        try {
            const manifest = path.join(USER_SKILL_PLUGIN, '.qoder-plugin', 'plugin.json');
            if (!fs.existsSync(manifest)) {
                fs.mkdirSync(path.dirname(manifest), { recursive: true });
                fs.writeFileSync(manifest, JSON.stringify({
                    name: 'chatscience-skills', version: '1.0.0',
                    description: 'ChatScience 科研技能包（内建 + 用户自定义）'
                }, null, 2), 'utf8');
            }
            fs.mkdirSync(path.join(USER_SKILL_PLUGIN, 'skills'), { recursive: true });
            const src = path.join(BUILTIN_SKILL_PLUGIN, 'skills');
            if (fs.existsSync(src)) {
                fs.readdirSync(src, { withFileTypes: true }).forEach(function (d) {
                    if (!d.isDirectory())
                        return;
                    const dest = path.join(USER_SKILL_PLUGIN, 'skills', d.name);
                    if (!fs.existsSync(dest))
                        fs.cpSync(path.join(src, d.name), dest, { recursive: true });
                });
            }
            return USER_SKILL_PLUGIN;
        }
        catch (e) {
            log('skill plugin init failed: ' + e.message);
            return fs.existsSync(BUILTIN_SKILL_PLUGIN) ? BUILTIN_SKILL_PLUGIN : null;
        }
    }
    /* 已发现的技能清单（供前端展示；以磁盘目录为准） */
    function listSkills() {
        const dir = ensureSkillPlugin();
        const out = [];
        if (!dir)
            return out;
        const root = path.join(dir, 'skills');
        let entries = [];
        try {
            entries = fs.readdirSync(root, { withFileTypes: true });
        }
        catch (e) {
            return out;
        }
        entries.forEach(function (d) {
            if (!d.isDirectory())
                return;
            const f = path.join(root, d.name, 'SKILL.md');
            if (!fs.existsSync(f))
                return;
            const md = fs.readFileSync(f, 'utf8');
            const fm = {};
            const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
            if (m) {
                m[1].split(/\r?\n/).forEach(function (line) {
                    const kv = line.match(/^([a-zA-Z_-]+)\s*:\s*(.*)$/);
                    if (kv)
                        fm[kv[1].trim()] = kv[2].trim().replace(/^["']|["']$/g, '');
                });
            }
            const body = md.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').trim();
            out.push({
                slug: d.name,
                name: fm.name || d.name,
                description: fm.description || '',
                builtin: fs.existsSync(path.join(BUILTIN_SKILL_PLUGIN, 'skills', d.name, 'SKILL.md')),
                chars: body.length, updatedAt: fs.statSync(f).mtimeMs
            });
        });
        return out.sort(function (a, b) { return a.slug.localeCompare(b.slug); });
    }
    function readSkill(slug) {
        const dir = ensureSkillPlugin();
        const clean = String(slug || '').replace(/[^a-zA-Z0-9_-]/g, '');
        const f = path.join(dir || '', 'skills', clean, 'SKILL.md');
        if (!fs.existsSync(f))
            return null;
        return { slug: clean, markdown: fs.readFileSync(f, 'utf8') };
    }
    function writeSkill(slug, frontmatter, body) {
        const dir = ensureSkillPlugin();
        const clean = String(slug || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
        if (!clean)
            throw new Error('slug 非法（仅允许字母数字-_）');
        const dir2 = path.join(dir || '', 'skills', clean);
        fs.mkdirSync(dir2, { recursive: true });
        const fm = Object.keys(frontmatter || {}).map(function (k) { return k + ': ' + frontmatter[k]; }).join('\n');
        fs.writeFileSync(path.join(dir2, 'SKILL.md'), '---\n' + fm + '\n---\n\n' + String(body || '') + '\n', 'utf8');
        return { slug: clean };
    }
    function deleteSkill(slug) {
        const dir = ensureSkillPlugin();
        const clean = String(slug || '').replace(/[^a-zA-Z0-9_-]/g, '');
        fs.rmSync(path.join(dir || '', 'skills', clean), { recursive: true, force: true });
        return { deleted: clean };
    }
    /**
     * runWorkTurn(params, onEvent, externalSignal)
     * 返回 { ok, text, sessionId, numTurns, durationMs, is_error, errors, toolCalls }
     */
    async function runWorkTurn(params, onEvent, externalSignal) {
        const emit = function (evt, data) {
            if (onEvent) {
                try {
                    onEvent(evt, data);
                }
                catch (e) { /* 回调异常不影响主流程 */ }
            }
        };
        /* SDK 为 ESM：动态加载（Electron 内置 Node 20 无 require(esm)） */
        const sdk = await (0, qoder_sdk_1.loadSdk)();
        const agentDef = (params.agentDef || {});
        const scopeId = params.scopeId || 'global';
        /* 工作区模式：Agent 直接在用户选择的本地文件夹里工作（cwd = 工作区根）；
           否则走沙箱工作目录。ensureScope 返回 {root,work,out,hooks}；cwd 用 .work */
        const workspaceRoot = (params.workspaceRoot && typeof params.workspaceRoot === 'string'
            && path.isAbsolute(params.workspaceRoot)) ? params.workspaceRoot : null;
        let workDir;
        if (workspaceRoot) {
            try {
                fs.accessSync(workspaceRoot); /* 必须真实存在 */
                workDir = path.resolve(workspaceRoot);
            }
            catch (e) {
                emit('error', { runId: '', message: '工作区不可访问：' + workspaceRoot, fatal: true });
                return { ok: false, error: 'workspace not accessible: ' + workspaceRoot, text: '', toolCalls: 0, durationMs: 0 };
            }
        }
        else {
            workDir = ctx.sandbox.ensureScope(scopeId).work;
        }
        const policy = ctx.sandbox.policy();
        /* --- 工具可见集：SDK 内建（白名单交集）+ 科研工具 + MCP 白名单 ---
           语义：tools.sdk 未设置 = 默认全集；[] = 显式不给任何内建工具（纯 MCP 智能体） */
        const wantSdk = agentDef.tools ? agentDef.tools.sdk : undefined;
        const sdkTools = (Array.isArray(wantSdk))
            ? wantSdk.filter(function (n) { return exports.SDK_BUILTIN_DEFAULT.indexOf(n) > -1; })
            : exports.SDK_BUILTIN_DEFAULT.slice();
        /* 科研工具（in-process MCP）默认开启；agentDef.tools.builtin 为空数组时关闭 */
        const builtinWanted = (agentDef.tools && agentDef.tools.builtin !== undefined) ? agentDef.tools.builtin : ['science'];
        const sciEnabled = builtinWanted.indexOf('science') > -1;
        const mcpServers = {};
        const mcpToolNames = [];
        if (sciEnabled) {
            mcpServers.chatscience = buildScienceServer({
                sandbox: ctx.sandbox, notes: ctx.notes, kb: ctx.kb, scopeId: scopeId,
                workspaceRoot: workspaceRoot,
                convId: params.convId || null,
                onToolStream: function (kind, delta) { emit('tool_stream', { kind: kind, delta: delta }); }
            }, sdk);
            const allSci = ['arxiv_search', 'fetch_url', 'web_search', 'kb_search', 'note_write', 'run_code'];
            const subset = (agentDef.tools && agentDef.tools.scienceTools);
            (Array.isArray(subset) && subset.length ? allSci.filter(function (n) { return subset.indexOf(n) > -1; }) : allSci)
                .forEach(function (n) { mcpToolNames.push('mcp__chatscience__' + n); });
        }
        /* 用户配置的外部 MCP 服务器：按智能体白名单透传（配置结构与 SDK McpServerConfig 一致） */
        const wantedMcp = (agentDef.tools && agentDef.tools.mcp) || null;
        const enabledServers = (ctx.store.section('mcpServers') || []).filter(function (s) { return s.enabled !== false; });
        enabledServers.forEach(function (s) {
            if (wantedMcp && !(s.key in wantedMcp))
                return;
            const conf = Object.assign({}, s.config);
            if (s.key === 'chatscience')
                return;
            mcpServers[s.key] = conf;
            if (Array.isArray(s.tools)) {
                s.tools.forEach(function (t) { mcpToolNames.push('mcp__' + s.key + '__' + (typeof t === 'string' ? t : t.name)); });
            }
            else {
                /* 未枚举工具时按 always_allow 策略放行整个 server（工具名动态发现） */
                mcpToolNames.push('mcp__' + s.key);
            }
        });
        /* --- 技能：SDK local plugin + skills 白名单 --- */
        const pluginDir = ensureSkillPlugin();
        const skillStates = ctx.store.section('skills') || {};
        const discovered = listSkills();
        const enabledSlugs = discovered
            .filter(function (s) { const st = skillStates[s.slug]; return st ? st.enabled !== false : true; })
            .map(function (s) { return s.slug; });
        /* 智能体级技能白名单 */
        const agentSkills = (agentDef.skills && agentDef.skills.length)
            ? enabledSlugs.filter(function (s) { return agentDef.skills.indexOf(s) > -1; })
            : enabledSlugs;
        const skillsOption = agentSkills.length
            ? agentSkills.map(function (s) { return 'chatscience-skills:' + s; })
            : [];
        const tools = sdkTools.slice();
        if (skillsOption.length)
            tools.push('Skill');
        Array.prototype.push.apply(tools, mcpToolNames);
        const ctl = new AbortController();
        const sig = externalSignal || params.signal;
        if (sig) {
            if (sig.aborted)
                ctl.abort();
            else
                sig.addEventListener('abort', function () { ctl.abort(); }, { once: true });
        }
        const options = {
            auth: sdk.accessToken(cfg.accessToken),
            cwd: workDir,
            model: (function () {
                if (exports.MODEL_TIERS.indexOf(String(agentDef.model)) > -1)
                    return String(agentDef.model);
                const byStrength = { off: 'lite', low: 'efficient', medium: 'performance', high: 'ultimate' };
                if (agentDef.thinkingStrength && byStrength[agentDef.thinkingStrength])
                    return byStrength[agentDef.thinkingStrength];
                return cfg.model || 'performance';
            })(),
            /* 权限模式：请求覆盖 > 智能体定义 > 全局配置 > default（SDK 五档） */
            permissionMode: exports.PERMISSION_MODES.indexOf(params.permissionMode) > -1
                ? (0, domain_1.asPermissionMode)(params.permissionMode)
                : (exports.PERMISSION_MODES.indexOf(agentDef.permissionMode) > -1
                    ? (0, domain_1.asPermissionMode)(agentDef.permissionMode)
                    : (0, domain_1.asPermissionMode)(cfg.permissionMode, 'default')),
            maxTurns: Math.min(Math.max(parseInt(String(agentDef.maxTurns), 10) || 12, 1), 40),
            /* 沙箱隔离三件套 */
            settingSources: [],
            strictMcpConfig: true,
            tools: tools,
            allowedTools: tools.slice(),
            canUseTool: makeCanUseTool(workDir, policy, log),
            mcpServers: mcpServers,
            includePartialMessages: true
        };
        if (pluginDir)
            options.plugins = [{ type: 'local', path: pluginDir }];
        if (skillsOption.length)
            options.skills = skillsOption;
        if (params.resumeSessionId)
            options.resume = params.resumeSessionId;
        const runId = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        if (process.env.CS_DEBUG) {
            console.log('[qoder][debug] cwd=' + workDir);
            console.log('[qoder][debug] options=' + JSON.stringify(Object.assign({}, options, { auth: '<redacted>' })).slice(0, 800));
        }
        emit('run_start', { runId: runId, agentId: agentDef.id, model: options.model, permissionMode: options.permissionMode, tools: tools });
        const toolStartAt = {};
        let sessionId = params.resumeSessionId || null;
        let text = '';
        let toolCalls = 0;
        const t0 = Date.now();
        try {
            const q = sdk.query({ prompt: String(params.prompt || ''), options: options });
            for await (const msg of q) {
                const m = msg;
                if (ctl.signal.aborted)
                    break;
                if (!sessionId && m.session_id)
                    sessionId = m.session_id;
                if (m.type === 'system' && m.subtype === 'init') {
                    emit('notice', {
                        runId: runId, code: 'init',
                        message: 'SDK ' + m.qodercli_version + ' · 模型 ' + m.model + ' · 权限 ' + m.permissionMode,
                        skills: m.skills || [], mcpServers: m.mcp_servers || []
                    });
                }
                else if (m.type === 'stream_event') {
                    /* SDK 事件 delta 的字段在 d.ts 中较宽，这里按线路协议形状收窄（行为不变） */
                    const d = (m.event && m.event.delta);
                    if (!d)
                        continue;
                    if (d.type === 'text_delta' && d.text) {
                        text += d.text;
                        emit('delta', { runId: runId, delta: d.text });
                    }
                    else if (d.type === 'thinking_delta' && d.thinking)
                        emit('reasoning', { runId: runId, delta: d.thinking });
                    else if (d.type === 'input_json_delta') { /* 参数流式：暂不逐帧透传，tool_start 时给全量 */ }
                }
                else if (m.type === 'assistant') {
                    const blocks = ((m.message && m.message.content) || []);
                    blocks.forEach(function (b) {
                        if (b.type !== 'tool_use')
                            return;
                        toolCalls++;
                        toolStartAt[b.id] = Date.now();
                        emit('tool_start', {
                            runId: runId, callId: b.id, name: b.name,
                            args: truncateStr(JSON.stringify(b.input || {}), 2000)
                        });
                    });
                }
                else if (m.type === 'user') {
                    const blocks = ((m.message && m.message.content) || []);
                    blocks.forEach(function (b) {
                        if (b.type !== 'tool_result')
                            return;
                        const dur = toolStartAt[b.tool_use_id] ? Date.now() - toolStartAt[b.tool_use_id] : undefined;
                        const txt = typeof b.content === 'string' ? b.content : JSON.stringify(b.content);
                        emit('tool_end', {
                            runId: runId, callId: b.tool_use_id,
                            ok: !b.is_error, durationMs: dur,
                            result: truncateStr(txt, 4000),
                            error: b.is_error ? truncateStr(txt, 400) : undefined
                        });
                    });
                }
                else if (m.type === 'system' && m.subtype === 'permission_denied') {
                    emit('tool_end', {
                        runId: runId, callId: m.tool_use_id, ok: false,
                        error: '权限拒绝：' + (m.message || m.tool_name),
                        result: '已被沙箱策略或权限配置拒绝'
                    });
                }
                else if (m.type === 'result') {
                    const rm = m;
                    if (rm.subtype === 'success')
                        text = rm.result || text;
                    const out = {
                        ok: rm.subtype === 'success' && !rm.is_error,
                        text: text,
                        sessionId: rm.session_id || sessionId,
                        numTurns: rm.num_turns,
                        durationMs: (rm.duration_ms ?? (Date.now() - t0)),
                        toolCalls: toolCalls,
                        is_error: !!rm.is_error,
                        errors: rm.errors || (rm.is_error && rm.result ? [String(rm.result).slice(0, 300)] : [])
                    };
                    emit('run_end', { runId: runId, ok: out.ok, text: out.text, metrics: { totalMs: out.durationMs, toolCalls: out.toolCalls, turns: out.numTurns } });
                    return out;
                }
            }
            /* 流结束但没有 result 消息（如被 abort） */
            if (ctl.signal.aborted) {
                emit('aborted', { runId: runId });
                return { ok: false, aborted: true, text: text, sessionId: sessionId, toolCalls: toolCalls, durationMs: Date.now() - t0 };
            }
            return { ok: !!text, text: text, sessionId: sessionId, toolCalls: toolCalls, durationMs: Date.now() - t0, errors: ['会话结束但未收到 result 消息'] };
        }
        catch (e) {
            if (ctl.signal.aborted) {
                emit('aborted', { runId: runId });
                return { ok: false, aborted: true, text: text, sessionId: sessionId, toolCalls: toolCalls, durationMs: Date.now() - t0 };
            }
            log('qoder run failed: ' + e.message);
            emit('error', { runId: runId, message: e.message, fatal: true });
            return { ok: false, error: e.message, text: text, sessionId: sessionId, toolCalls: toolCalls, durationMs: Date.now() - t0 };
        }
    }
    /* 连通性自检：1 回合最小查询（供连接器/设置页"测试"按钮） */
    async function ping() {
        const sdk = await (0, qoder_sdk_1.loadSdk)();
        const t0 = Date.now();
        try {
            const dir = ctx.sandbox.ensureScope('global').work;
            const q = sdk.query({
                prompt: '请只回复两个字符：OK',
                options: {
                    auth: sdk.accessToken(cfg.accessToken), cwd: dir,
                    model: 'lite', maxTurns: 1, permissionMode: 'dontAsk',
                    settingSources: [], strictMcpConfig: true, tools: [], allowedTools: []
                }
            });
            let reply = '';
            for await (const m of q) {
                if (m.type === 'result') {
                    reply = m.result || '';
                    break;
                }
            }
            return { ok: true, ms: Date.now() - t0, reply: String(reply).slice(0, 40) };
        }
        catch (e) {
            return { ok: false, ms: Date.now() - t0, error: e.message };
        }
    }
    return {
        runWorkTurn: runWorkTurn,
        listSkills: listSkills,
        readSkill: readSkill,
        writeSkill: writeSkill,
        deleteSkill: deleteSkill,
        ensureSkillPlugin: ensureSkillPlugin,
        ping: ping,
        config: function () { return { model: cfg.model || 'performance', permissionMode: cfg.permissionMode || 'default', hasToken: !!cfg.accessToken }; },
        MODEL_TIERS: exports.MODEL_TIERS,
        SDK_BUILTIN_DEFAULT: exports.SDK_BUILTIN_DEFAULT
    };
}
