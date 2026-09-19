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
exports.VERSION = void 0;
exports.defaults = defaults;
exports.createStore = createStore;
/* ==================================================================
   store.ts · Work 配置持久化（app/data/work.json）
   - 分区读改写：main.js 支持多窗口，两窗口同时 PUT 会后写覆盖前写，
     因此每个 section 的更新都走 promise 链串行化。
   - 原子写：tmp + rename，与既有 state.json 同一套模式。
   - 与前端 state.json 的边界：state.json 是前端 UI 快照（会话/项目/知识库/模型），
     work.json 是后端能力配置（智能体/技能/连接器/沙箱策略），互不覆盖。
   ================================================================== */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.VERSION = 1;
function defaults() {
    return {
        version: exports.VERSION,
        agents: [], /* 智能体定义 */
        subagents: [], /* 墨道子智能体（经 options.agents 委派；可编辑可添加不可删） */
        skills: {}, /* slug -> { enabled, order } */
        mcpServers: [], /* MCP 服务器配置 */
        sandboxPolicy: {}, /* 覆盖 policy.DEFAULT_POLICY */
        modelToolSupport: {}, /* 'providerId/modelId' -> 'fc' | 'react' */
        runHistory: [], /* 运行页历史（最多 100 条） */
        seeded: false, /* 内建智能体是否已播种 */
        domainPlugins: {}, /* 领域插件启用开关：未记录=启用，显式 false=停用 */
        prefs: {
            memory: { globalOn: true, projectOn: true },
            git: { prefix: 'qoder/', force: false, instr: '' },
            worktrees: { fetchBeforeCreate: false, autoDelete: true, limit: 15 },
            appearance: { width: 'standard' }
        }
    };
}
function createStore(appRoot, log) {
    const file = path.join(appRoot, 'data', 'work.json');
    let cache = null;
    let chain = Promise.resolve(false);
    function readRaw() {
        try {
            const txt = fs.readFileSync(file, 'utf8');
            const obj = JSON.parse(txt);
            if (!obj || typeof obj !== 'object')
                return defaults();
            /* 向前兼容：缺失的 section 用默认值补齐，多余的键保留 */
            const d = defaults();
            Object.keys(d).forEach(function (k) {
                if (obj[k] === undefined)
                    obj[k] = d[k];
            });
            return obj;
        }
        catch (e) {
            return defaults();
        }
    }
    function load() {
        if (cache === null)
            cache = readRaw();
        return cache;
    }
    function flush() {
        return new Promise(function (resolve) {
            try {
                fs.mkdirSync(path.dirname(file), { recursive: true });
                const tmp = file + '.tmp';
                fs.writeFileSync(tmp, JSON.stringify(cache, null, 2), 'utf8');
                fs.renameSync(tmp, file);
                resolve(true);
            }
            catch (e) {
                if (log)
                    log('work store write failed: ' + e.message);
                resolve(false);
            }
        });
    }
    /* 所有写操作串到同一条 promise 链上，保证读-改-写不交错 */
    function mutate(fn) {
        chain = chain.then(function () {
            load();
            let changed = true;
            try {
                changed = fn(cache);
            }
            catch (e) {
                if (log)
                    log('work store mutate failed: ' + e.message);
                throw e;
            }
            return changed === false ? false : flush();
        }).catch(function (e) { if (log)
            log('work store chain error: ' + e.message); return false; });
        return chain;
    }
    const api = {
        file: file,
        all: function () { return JSON.parse(JSON.stringify(load())); },
        section: function (name) {
            const d = defaults();
            const v = load()[name];
            return (v === undefined ? d[name] : JSON.parse(JSON.stringify(v)));
        },
        setSection: function (name, value) {
            if (!(name in defaults()))
                throw new Error('unknown work.json section: ' + String(name));
            return mutate(function (s) { s[name] = value; });
        },
        /* 分区局部更新：fn(sectionValue) 返回新值（或原地修改后返回 undefined） */
        update: function (name, fn) {
            if (!(name in defaults()))
                throw new Error('unknown work.json section: ' + String(name));
            return mutate(function (s) {
                const next = fn(s[name]);
                if (next !== undefined)
                    s[name] = next;
            });
        },
        mutate: mutate,
        reload: function () { cache = null; return load(); }
    };
    return api;
}
