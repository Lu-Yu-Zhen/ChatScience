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
exports.createNotes = createNotes;
/* ==================================================================
   notes.ts · 实验笔记存储（app/data/notes/*.json）
   Agent 的 note_write 工具与前端笔记本页共用同一份——
   "Agent 与用户共用实验记录"是 Work 模式的核心设计。
   ================================================================== */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function createNotes(appRoot) {
    const DIR = path.join(appRoot, 'data', 'notes');
    function ensure() { fs.mkdirSync(DIR, { recursive: true }); }
    function safeId(id) {
        const s = String(id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
        if (!s)
            throw new Error('invalid note id');
        return s;
    }
    function serializeCells(cells) {
        return (cells || []).map(function (c) { return (c && c.source) || ''; }).join('\n\n');
    }
    function list() {
        ensure();
        let files = [];
        try {
            files = fs.readdirSync(DIR).filter(function (f) { return f.endsWith('.json'); });
        }
        catch (e) {
            return [];
        }
        const out = [];
        files.forEach(function (f) {
            try {
                const n = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
                if (n && n.id)
                    out.push(n);
            }
            catch (e) { /* 损坏文件跳过 */ }
        });
        out.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
        return out;
    }
    function get(id) {
        const sid = safeId(id);
        try {
            return JSON.parse(fs.readFileSync(path.join(DIR, sid + '.json'), 'utf8'));
        }
        catch (e) {
            return null;
        }
    }
    function upsert(note) {
        ensure();
        const now = Date.now();
        const id = note.id ? safeId(note.id) : ('n' + now.toString(36) + Math.random().toString(36).slice(2, 6));
        const prev = get(id) || {};
        const rec = {
            id: id,
            title: String(note.title || prev.title || '未命名笔记').slice(0, 120),
            content: String(note.content !== undefined ? note.content : (prev.content || '')),
            source: note.source || prev.source || 'user',
            convId: note.convId || prev.convId || null,
            /* Jupyter 形式：单元格数组 + 归属（proj:<id> / conv:<id> / null 独立） */
            scopeKey: note.scopeKey !== undefined ? (note.scopeKey || null) : (prev.scopeKey || null),
            cells: Array.isArray(note.cells) ? note.cells : (prev.cells || null),
            createdAt: prev.createdAt || now,
            updatedAt: now
        };
        /* Agent 的 note_write 只写 content：内容变化时追加为 markdown 单元格，Jupyter 视图可见 */
        if (!Array.isArray(note.cells) && Array.isArray(prev.cells)
            && note.content !== undefined && note.content !== serializeCells(prev.cells)) {
            rec.cells = prev.cells.concat([{
                    id: 'c' + now.toString(36) + Math.random().toString(36).slice(2, 5),
                    type: 'markdown',
                    source: String(note.content)
                }]);
        }
        const tmp = path.join(DIR, id + '.json.tmp');
        fs.writeFileSync(tmp, JSON.stringify(rec, null, 2), 'utf8');
        fs.renameSync(tmp, path.join(DIR, id + '.json'));
        return rec;
    }
    function remove(id) {
        const sid = safeId(id);
        try {
            fs.rmSync(path.join(DIR, sid + '.json'), { force: true });
            return { deleted: sid };
        }
        catch (e) {
            return { deleted: sid, error: e.message };
        }
    }
    const api = { list: list, get: get, upsert: upsert, remove: remove, dir: DIR };
    return api;
}
